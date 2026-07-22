/**
 * Post-contest result processing.
 *
 * Called by contestScheduler.ts when the end-timer fires.
 * Runs asynchronously after the contest ends — never blocks the timer callback.
 *
 * Steps:
 *   1. Snapshot the live Redis sorted set → ContestResult rows in Postgres
 *   2. Assign finalRank based on snapshot order
 *   3. Set newRating = 0 (placeholder — implement Elo/CF-style later)
 *   4. Delete the Redis sorted set (no longer needed)
 *
 * NOTE: Rating calculation is left as a stub (newRating = currentRating).
 * Wire in your Elo/CF algorithm when ready — the ContestResult row is
 * already written with finalRank so the leaderboard freezes correctly.
 */

import { prisma } from '../db/db.js';
import { redisClient } from '../redis/redis.js';
import { Mode } from '../generated/prisma/enums.js';

export async function processContestResults(contestId: string): Promise<void> {
  console.log(`[contest-results] processing contest "${contestId}"`);

  const leaderboardKey = `leaderboard:${contestId}`;

  // 1. Read the full sorted set — highest score first
  let entries: { value: string; score: number }[] = [];
  try {
    entries = await redisClient.zRangeWithScores(leaderboardKey, 0, -1, { REV: true });
  } catch (err: any) {
    console.error('[contest-results] failed to read Redis leaderboard:', err.message);
    return;
  }

  if (entries.length === 0) {
    console.log(`[contest-results] no entries for contest "${contestId}" — skipping`);
    return;
  }

  // 2. Fetch contest title for ContestResult.title
  const contest = await prisma.contest.findUnique({
    where:  { id: contestId },
    select: { title: true },
  });
  const title = contest?.title ?? contestId;

  // 3. Fetch current ratings for all participants (for newRating placeholder)
  const userIds = entries.map((e) => e.value);
  const users = await prisma.user.findMany({
    where:  { id: { in: userIds } },
    select: { id: true, currentRating: true },
  });
  const ratingMap = new Map(users.map((u) => [u.id, u.currentRating]));

  // 4. Write ContestResult rows in a transaction
  try {
    await prisma.$transaction(
      entries.map((entry, index) =>
        prisma.contestResult.upsert({
          where: {
            userId_contestId_mode: {
              userId:    entry.value,
              contestId,
              mode:      Mode.OFFICIAL,
            },
          },
          create: {
            userId:    entry.value,
            contestId,
            mode:      Mode.OFFICIAL,
            title,
            score:     entry.score,
            penalty:   0,          // TODO: add penalty tracking in leaderboard
            finalRank: index + 1,
            newRating: ratingMap.get(entry.value) ?? 0,  // placeholder — replace with Elo
          },
          update: {
            score:     entry.score,
            finalRank: index + 1,
            newRating: ratingMap.get(entry.value) ?? 0,
          },
        }),
      ),
    );

    console.log(`[contest-results] wrote ${entries.length} ContestResult row(s) for "${contestId}"`);
  } catch (err: any) {
    console.error('[contest-results] failed to write ContestResult rows:', err.message);
    return;
  }

  // 5. Clean up the Redis sorted set — Postgres is now the source of truth
  try {
    await redisClient.del(leaderboardKey);
    console.log(`[contest-results] deleted Redis key "${leaderboardKey}"`);
  } catch (err: any) {
    console.error('[contest-results] failed to delete Redis key:', err.message);
    // Non-fatal — key will just expire naturally
  }
}
