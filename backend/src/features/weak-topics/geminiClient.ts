/**
 * Gemini API client for Code Verdict & Logic Analyzer.
 *
 * Fetches the last 3 failed submissions for the user's #1 weakest topic,
 * sends them to Gemini for structured diagnostic analysis, and returns
 * a 4-field result. Returns null on any failure so callers fall back
 * to deterministic strings.
 *
 * - Model: gemini-2.0-flash
 * - 5s timeout via AbortController
 * - API key: process.env.GEMINI_API_KEY — never logged, never hardcoded
 */

import axios from 'axios';
import { prisma } from '../../db/db.js';

const GEMINI_MODEL   = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TIMEOUT_MS     = 5_000;

export interface TopicStat {
  tag:            string;
  totalAttempts:  number;
  failedAttempts: number;
}

export interface CodeAnalysis {
  verdictAnalysis:          string; // pattern across the 3 submissions
  whatWentWrong:            string; // specific mistakes
  betterApproach:           string; // correct approach
  recommendedDataStructure: string; // DS/algorithm to study
}

// Failed verdicts to look up for code retrieval
const FAILED_STATUSES = [
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'MEMORY_LIMIT_EXCEEDED',
  'COMPILATION_ERROR',
  'PRESENTATION_ERROR',
  'OUTPUT_LIMIT_EXCEEDED',
] as const;

/**
 * Fetches the 3 most recent failed submissions for the user's weakest tag,
 * sends them to Gemini for structured analysis, returns 4-field result.
 * Returns null on any failure.
 */
export async function analyzeWeakTopic(
  userId: string,
  weakestTag: string,
  stats: TopicStat[],
): Promise<CodeAnalysis | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[weak-topics] GEMINI_API_KEY not set — using fallback');
    return null;
  }

  // Fetch last 3 failed submissions for problems tagged with the weakest tag
  const failedSubmissions = await prisma.submission.findMany({
    where: {
      userId,
      status: { in: FAILED_STATUSES as any },
      problem: {
        tags: { some: { tag: weakestTag } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      code:     true,
      language: true,
      status:   true,
      problem:  { select: { title: true } },
    },
  });

  if (failedSubmissions.length === 0) {
    return null;
  }

  // Build the prompt with the actual code
  const submissionsText = failedSubmissions
    .map(
      (s, i) =>
        `--- Submission ${i + 1} (${s.language}) on "${s.problem.title}" — verdict: ${s.status} ---\n${s.code}`,
    )
    .join('\n\n');

  const systemPrompt = [
    'You are an expert competitive programming coach analyzing a student\'s failed code submissions.',
    'You will receive up to 3 failed submissions for a specific DSA topic.',
    'Respond ONLY with a valid JSON object — no markdown, no backticks, no explanation outside the JSON.',
    'The JSON must have exactly these 4 keys:',
    '"verdictAnalysis": string — 1-2 sentences describing the pattern of failures across the submissions.',
    '"whatWentWrong": string — 1-2 sentences identifying the specific logical or algorithmic mistake.',
    '"betterApproach": string — 1-2 sentences describing the correct high-level approach.',
    '"recommendedDataStructure": string — exactly ONE data structure or algorithm name (e.g. "Segment Tree", "BFS", "Two Pointers").',
    'Base ALL statements strictly on the code provided. Do not invent facts.',
  ].join(' ');

  const userPrompt =
    `Topic being analyzed: ${weakestTag}\n` +
    `User's stats for this topic: ${failedSubmissions.length} failed submissions shown below.\n\n` +
    submissionsText;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await axios.post(
      GEMINI_API_URL,
      {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.2 },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${apiKey}`,
        },
        signal: controller.signal as any,
      },
    );

    clearTimeout(timer);

    const rawText: string | undefined =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) return null;

    // Parse the JSON response
    const parsed = JSON.parse(rawText.trim()) as CodeAnalysis;

    // Validate all 4 fields exist and are strings
    if (
      typeof parsed.verdictAnalysis          !== 'string' ||
      typeof parsed.whatWentWrong            !== 'string' ||
      typeof parsed.betterApproach           !== 'string' ||
      typeof parsed.recommendedDataStructure !== 'string'
    ) {
      console.error('[weak-topics] Gemini returned malformed JSON:', rawText);
      return null;
    }

    return parsed;
  } catch (err: any) {
    if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
      console.warn('[weak-topics] Gemini call timed out');
    } else if (err instanceof SyntaxError) {
      console.error('[weak-topics] Gemini response was not valid JSON');
    } else {
      console.error('[weak-topics] Gemini call failed:', err.message);
    }
    return null;
  }
}
