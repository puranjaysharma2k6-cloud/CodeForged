/**
 * Production IVerdictPublisher — Redis Streams + live leaderboard.
 *
 * On every publish():
 *   XADD verdict:<submissionId> * ...fields   → WebSocket clients read this
 *
 * On ACCEPTED terminal verdict additionally:
 *   ZINCRBY leaderboard:<contestId> 1 <userId>  → live sorted-set leaderboard
 *
 * On any terminal verdict:
 *   UPDATE submissions SET status, runtime, memory
 *   updateUserTopicStats (fire-and-forget)
 */

import type { RedisClientType } from 'redis';
import { IVerdictPublisher } from '../judge-module/judge/ports/IVerdictPublisher.js';
import { JudgeResult, TERMINAL_STATUSES, VerdictStatus } from '../judge-module/judge/types.js';
import { Verdict } from '../generated/prisma/enums.js';
import { prisma } from '../db/db.js';
import { updateUserTopicStats } from '../features/weak-topics/statsUpdater.js';

export class RedisStreamVerdictPublisher implements IVerdictPublisher {
  constructor(private readonly redis: RedisClientType) {}

  async publish(result: JudgeResult): Promise<void> {
    const streamKey = `verdict:${result.submissionId}`;

    // ── 1. Write to Redis Stream (all verdict states) ──────────────────────
    const entry: Record<string, string> = {
      submissionId: result.submissionId,
      verdict:      result.verdict,
      providerName: result.providerName,
      judgedAt:     result.judgedAt.toISOString(),
    };
    if (result.executionTimeMs != null) entry.executionTimeMs = String(result.executionTimeMs);
    if (result.memoryUsedKb    != null) entry.memoryUsedKb    = String(result.memoryUsedKb);
    if (result.compileError)            entry.compileError    = result.compileError;
    if (result.runtimeError)            entry.runtimeError    = result.runtimeError;

    try {
      await this.redis.xAdd(streamKey, '*', entry);
    } catch (err: any) {
      console.error('[verdict-publisher] XADD failed:', err.message);
      // Non-fatal — never block judging because of Redis
    }

    // ── 2. Only continue for terminal verdicts ─────────────────────────────
    if (!TERMINAL_STATUSES.has(result.verdict)) return;

    // ── 3. Update Postgres submission row ──────────────────────────────────
    await prisma.submission.update({
      where: { id: result.submissionId },
      data: {
        status:  mapVerdict(result.verdict),
        runtime: result.executionTimeMs ?? null,
        memory:  result.memoryUsedKb   ?? null,
      },
    });

    // ── 4. Look up userId + contestId from the submission ──────────────────
    // (one query serves both weak-topics hook and leaderboard update)
    const sub = await prisma.submission.findUnique({
      where:  { id: result.submissionId },
      select: {
        userId:    true,
        problemId: true,
        problem:   { select: { contestId: true } },
      },
    });

    if (sub) {
      // ── 5. Live leaderboard — increment on ACCEPTED only ─────────────────
      if (result.verdict === VerdictStatus.ACCEPTED) {
        const leaderboardKey = `leaderboard:${sub.problem.contestId}`;
        try {
          await this.redis.zIncrBy(leaderboardKey, 1, sub.userId);
        } catch (err: any) {
          console.error('[verdict-publisher] ZINCRBY failed:', err.message);
        }
      }

      // ── 6. Weak-topics hook — fire and forget ─────────────────────────────
      updateUserTopicStats(sub.userId, sub.problemId, result.verdict);
    }

    console.log(`[verdict] ${result.submissionId} → ${result.verdict}`);
  }
}

function mapVerdict(v: VerdictStatus): Verdict {
  const MAP: Partial<Record<VerdictStatus, Verdict>> = {
    [VerdictStatus.ACCEPTED]:              Verdict.ACCEPTED,
    [VerdictStatus.WRONG_ANSWER]:          Verdict.WRONG_ANSWER,
    [VerdictStatus.TIME_LIMIT_EXCEEDED]:   Verdict.TIME_LIMIT_EXCEEDED,
    [VerdictStatus.MEMORY_LIMIT_EXCEEDED]: Verdict.MEMORY_LIMIT_EXCEEDED,
    [VerdictStatus.COMPILATION_ERROR]:     Verdict.COMPILATION_ERROR,
    [VerdictStatus.RUNTIME_ERROR]:         Verdict.RUNTIME_ERROR,
    [VerdictStatus.PRESENTATION_ERROR]:    Verdict.PRESENTATION_ERROR,
    [VerdictStatus.OUTPUT_LIMIT_EXCEEDED]: Verdict.OUTPUT_LIMIT_EXCEEDED,
    [VerdictStatus.SYSTEM_ERROR]:          Verdict.SYSTEM_ERROR,
    [VerdictStatus.INTERNAL_ERROR]:        Verdict.SYSTEM_ERROR,
  };
  return MAP[v] ?? Verdict.SYSTEM_ERROR;
}
