import { authenticate } from "../middlewares/auth.middleware.js";
import type { Request, Response } from "express";
import { prisma } from "../db/db.js"

interface RatingData {
  contestName: string;
  newRating: number;
}

interface ProfileLoaderData {
  username: string;
  name: string; // Added to match your Prisma select
  avatarUrl: string | null;
  currentRating: number;
  problemsSolved: number;
  rank: number;
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
        name: true,
        avatarUrl: true,
        ratingHistory: {
           orderBy: {
             contestId: 'asc',
           },
          select: {
            newRating: true,
            title : true,
            
          },
        },
      },
    });
    console.timeEnd("userINFO");

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const totalContests = user.ratingHistory.length;
    const currentRating = totalContests > 0 ? user.ratingHistory[totalContests - 1].newRating : 1500; // 1500 as baseline default

    const rank = await prisma.user.count({
      where: {
        currentRating: {
          gt: currentRating,
        },
      },
    }) + 1;


    const formattedRatingHistory: RatingData[] = (
      user.ratingHistory).map((result) => ({
      contestName: result.title,
      newRating: result.newRating,
    }));

    const result: ProfileLoaderData = {
      username: user.username,
      name: user.name ?? "",
      avatarUrl: user.avatarUrl,
      currentRating: currentRating,
      problemsSolved: problemsSolvedCount,
      rank: rank,
      ratingHistory: formattedRatingHistory 
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}