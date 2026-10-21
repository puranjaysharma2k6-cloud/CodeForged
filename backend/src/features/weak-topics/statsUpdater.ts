/**
 * Incremental weak-topic stats updater.
 *
 * Called fire-and-forget from VerdictPublisher on every terminal verdict.
 * Never throws into the caller — all errors are caught and logged internally.
 *
 * Rules:
 * - Only counts the FIRST terminal verdict per (user, problem) pair.
 *   Re-submitting after a wrong answer doesn't inflate failure counts.
 * - Looks up the problem's tags from ProblemTag.
 * - Upserts UserTopicStats: totalAttempts++ always, failedAttempts++ on failure.
 */

import { prisma } from '../../db/db.js';
import { Verdict } from '../../generated/prisma/enums.js';

type VerdictStatus = (typeof Verdict)[keyof typeof Verdict];

// Verdicts that count as a "failed" attempt
const FAILED_VERDICTS = new Set<VerdictStatus>([
  Verdict.WRONG_ANSWER,
  Verdict.TIME_LIMIT_EXCEEDED,
  Verdict.RUNTIME_ERROR,
  Verdict.MEMORY_LIMIT_EXCEEDED,
  Verdict.COMPILATION_ERROR,
  Verdict.PRESENTATION_ERROR,
  Verdict.OUTPUT_LIMIT_EXCEEDED,
]);

export function updateUserTopicStats(
  userId: string,
  problemId: string,
  verdict: VerdictStatus,
): void {
  // Fire and forget — never awaited on the hot path
  _update(userId, problemId, verdict).catch((err) =>
    console.error('[weak-topics] updateUserTopicStats error:', err),
  );
}

async function _update(
  userId: string,
  problemId: string,
  verdict: VerdictStatus,
): Promise<void> {
  // 1. Check if this user already has a terminal verdict on this problem.
  //    If yes, skip — first-attempt-only counting.
  const priorTerminal = await prisma.submission.findFirst({
    where: {
      userId,
      problemId,
      status: {
        notIn: ['PENDING'] as any,
      },
      // Exclude the submission that just triggered this call by finding
      // any submission that was already resolved before now.
      // We look for >1 terminal verdict because the current one is now saved.
    },
    select: { id: true },
    // order doesn't matter — existence check only
  });

  // Count terminal submissions for this user+problem.
  // If more than 1 exists, this isn't the first attempt.
  const terminalCount = await prisma.submission.count({
    where: {
      userId,
      problemId,
      status: { notIn: ['PENDING'] as any },
    },
  });

  if (terminalCount > 1) {
    // Not the first terminal verdict — skip to avoid double-counting
    return;
  }

  // 2. Look up tags for this problem
  const tagRows = await prisma.problemTag.findMany({
    where: { problemId },
    select: { tag: true },
  });

  if (tagRows.length === 0) {
    // Problem has no tags — nothing to group on, skip
    return;
  }

  const isFailed = FAILED_VERDICTS.has(verdict);

  // 3. Upsert UserTopicStats for each tag — one transaction
  await prisma.$transaction(
    tagRows.map(({ tag }) =>
      prisma.userTopicStats.upsert({
        where:  { userId_tag: { userId, tag } },
        create: {
          userId,
          tag,
          totalAttempts:  1,
          failedAttempts: isFailed ? 1 : 0,
        },
        update: {
          totalAttempts:  { increment: 1 },
          failedAttempts: { increment: isFailed ? 1 : 0 },
        },
      }),
    ),
  );
}
