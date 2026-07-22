/**
 * Code Verdict & Logic Analyzer — service layer.
 *
 * - Wilson-scores all topics, surfaces top-5.
 * - For the #1 weakest topic, fetches last 3 failed submissions and
 *   runs them through Gemini for structured diagnostic analysis.
 * - Hash-based cache invalidation + 1-hour rate limit.
 * - Always returns deterministic fallback strings if LLM is unavailable.
 *
 * wilson.ts and statsUpdater.ts are untouched — zero regression on hot path.
 */

import crypto from 'crypto';
import { prisma } from '../../db/db.js';
import { wilsonLowerBound } from './wilson.js';
import { analyzeWeakTopic, TopicStat, CodeAnalysis } from './geminiClient.js';

const MIN_ATTEMPTS      = 3;
const TOP_N             = 5;
const REGEN_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export interface WeakTopicResult {
  topics:   TopicStat[];
  analysis: {
    targetTag:                string;
    verdictAnalysis:          string;
    whatWentWrong:            string;
    betterApproach:           string;
    recommendedDataStructure: string;
  } | null;
}

// Deterministic fallbacks — used when LLM is unavailable or no data exists
function buildFallback(tag: string, totalAttempts: number): CodeAnalysis {
  return {
    verdictAnalysis:          `You have struggled with ${tag} across multiple attempts.`,
    whatWentWrong:            `Unable to analyze code automatically — check your submissions manually.`,
    betterApproach:           `Review fundamental ${tag} patterns and practice targeted problems.`,
    recommendedDataStructure: tag,
  };
}

export async function getWeakTopics(userId: string): Promise<WeakTopicResult> {
  // 1. Load stats filtered to minimum sample size
  const rows = await prisma.userTopicStats.findMany({
    where: {
      userId,
      totalAttempts: { gte: MIN_ATTEMPTS },
    },
    select: { tag: true, totalAttempts: true, failedAttempts: true },
  });

  // 2. Wilson score + sort + top N
  const scored = rows
    .map((r) => ({
      tag:            r.tag,
      totalAttempts:  r.totalAttempts,
      failedAttempts: r.failedAttempts,
      wilson:         wilsonLowerBound(r.failedAttempts, r.totalAttempts),
    }))
    .sort((a, b) => b.wilson - a.wilson)
    .slice(0, TOP_N);

  const topics: TopicStat[] = scored.map(({ tag, totalAttempts, failedAttempts }) => ({
    tag,
    totalAttempts,
    failedAttempts,
  }));

  if (topics.length === 0) {
    return { topics, analysis: null };
  }

  const weakestTag = topics[0].tag;

  // 3. Hash top-N for cache key
  const statsHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(topics))
    .digest('hex');

  // 4. Cache check
  const cached = await prisma.userTopicAnalysisCache.findUnique({
    where: { userId },
  });

  if (cached) {
    const hashUnchanged  = cached.statsHash === statsHash;
    const withinCooldown = Date.now() - cached.generatedAt.getTime() < REGEN_COOLDOWN_MS;

    if (hashUnchanged || withinCooldown) {
      return {
        topics,
        analysis: {
          targetTag:                cached.targetTag,
          verdictAnalysis:          cached.verdictAnalysis,
          whatWentWrong:            cached.whatWentWrong,
          betterApproach:           cached.betterApproach,
          recommendedDataStructure: cached.recommendedDataStructure,
        },
      };
    }
  }

  // 5. Cache miss — call Gemini with actual code
  const generated = await analyzeWeakTopic(userId, weakestTag, topics);
  const analysis  = generated ?? buildFallback(weakestTag, topics[0].totalAttempts);

  // 6. Hallucination guard — ensure recommendedDataStructure isn't a fabricated tag
  const knownTags = new Set(topics.map((t) => t.tag.toLowerCase()));
  const rds = analysis.recommendedDataStructure.toLowerCase();
  // Allow if it matches a known tag OR is a common DS/algo name (not a fabricated topic)
  // We just log a warning — don't suppress the result, as DS names may legitimately differ
  if (!knownTags.has(rds)) {
    console.warn(
      `[weak-topics] recommendedDataStructure "${analysis.recommendedDataStructure}" ` +
      `not in known tags [${[...knownTags].join(', ')}] — may be a valid DS name or hallucination`,
    );
  }

  // 7. Upsert cache
  await prisma.userTopicAnalysisCache.upsert({
    where:  { userId },
    create: {
      userId,
      targetTag:                weakestTag,
      verdictAnalysis:          analysis.verdictAnalysis,
      whatWentWrong:            analysis.whatWentWrong,
      betterApproach:           analysis.betterApproach,
      recommendedDataStructure: analysis.recommendedDataStructure,
      statsHash,
    },
    update: {
      targetTag:                weakestTag,
      verdictAnalysis:          analysis.verdictAnalysis,
      whatWentWrong:            analysis.whatWentWrong,
      betterApproach:           analysis.betterApproach,
      recommendedDataStructure: analysis.recommendedDataStructure,
      statsHash,
      generatedAt:              new Date(),
    },
  });

  return {
    topics,
    analysis: {
      targetTag:                weakestTag,
      verdictAnalysis:          analysis.verdictAnalysis,
      whatWentWrong:            analysis.whatWentWrong,
      betterApproach:           analysis.betterApproach,
      recommendedDataStructure: analysis.recommendedDataStructure,
    },
  };
}
