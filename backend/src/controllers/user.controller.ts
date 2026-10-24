import { authenticate } from "../middlewares/auth.middleware.js";
import type { Request, Response } from "express";
import { prisma } from "../db/db.js"

interface RatingData {
  contestName: string;
  newRating: number;
  date: string;
}

interface ProfileLoaderData {
  username: string;
  handle: string;
  avatarUrl: string | null;
  currentRating: number;
  problemsSolved: number;
  globalRank: number;
  ratingHistory: RatingData[];
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const userId = req.params.id ?? req.user?.userId;

  if (typeof userId !== 'string') {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  try {
    console.time("problem solved");
    const solved = await prisma.submission.findMany({
      where: {
        userId,
        status: "ACCEPTED"
      },
      distinct: ["problemId"],
      select: {
        problemId: true
      }
    });
    console.timeEnd("problem solved");

    const problemsSolvedCount = solved.length;

    console.time("userINFO");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        avatarUrl: true,
        currentRating: true,
      },
    });
    console.timeEnd("userINFO");

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const ratingHistory = await prisma.contestResult.findMany({
      where: { userId, mode: 'OFFICIAL' },
      select: {
        newRating: true,
        title: true,
        contest: { select: { startTime: true } },
      },
    });
    ratingHistory.sort((a, b) => a.contest.startTime.getTime() - b.contest.startTime.getTime());
    const currentRating = ratingHistory.at(-1)?.newRating ?? user.currentRating;

    const rank = await prisma.user.count({
      where: {
        currentRating: {
          gt: currentRating,
        },
      },
    }) + 1;


    const formattedRatingHistory: RatingData[] = ratingHistory.map((result) => ({
      contestName: result.title,
      newRating: result.newRating,
      date: result.contest.startTime.toISOString(),
    }));

    const result: ProfileLoaderData = {
      username: user.username,
      handle: user.username,
      avatarUrl: user.avatarUrl,
      currentRating: currentRating,
      problemsSolved: problemsSolvedCount,
      globalRank: rank,
      ratingHistory: formattedRatingHistory,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
