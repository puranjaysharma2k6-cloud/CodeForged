import { Request, Response } from "express";
import { prisma } from "../db/db.js";
import { redisClient } from "../redis/redis.js";

type LeaderboardEntry = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  currentRating: number;
  rank?: number;
};

async function fetchRedisLeaderboard(): Promise<LeaderboardEntry[]> {
  const leaderboardKey = process.env.LEADERBOARD_KEY ?? "leaderboard";

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  const rawEntries = await redisClient.zRangeWithScores(leaderboardKey, 0, -1, {
    REV: true,
  });

  if (rawEntries.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: rawEntries.map((entry) => entry.value),
      },
    },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      currentRating: true,
    },
  });

  const userMap = new Map(users.map((user) => [user.id, user]));

  return rawEntries
    .map((entry, index) => {
      const user = userMap.get(entry.value);

      if (!user) {
        return null;
      }

      return {
        ...user,
        currentRating: entry.score,
        rank: index + 1,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

export async function getLeaderboard(
  req: Request,
  res: Response
): Promise<void> {
  console.time("LeaderBoard");
  try {
    let leaderboard: LeaderboardEntry[] = await fetchRedisLeaderboard();

    if (leaderboard.length === 0) {
      leaderboard = await prisma.user.findMany({
        orderBy: {
          currentRating: "desc",
        },
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          currentRating: true,
        },
      });
    }

    console.timeEnd("LeaderBoard");
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    res.status(200).json(rankedLeaderboard);
  } catch (error) {
    console.error("[leaderboard] failed to fetch leaderboard:", error);
    res.status(500).json({
      message: "Failed to fetch leaderboard",
    });
  }
}