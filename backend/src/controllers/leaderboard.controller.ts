import { Request, Response } from "express";
import { prisma } from "../db/db.js";


console.log("user requestin leaderboard");
//ping db
async function pingdb() {
  console.time("ping-db");
await prisma.$queryRaw`SELECT 1`; 
console.timeEnd("ping-db");
}
 pingdb();

export async function getLeaderboard(
  req: Request,
  res: Response
): Promise<void> {
  console.time("LeaderBoard");
  try {
    const leaderboard = await prisma.user.findMany({
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
console.timeEnd("LeaderBoard")
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

    res.status(200).json(rankedLeaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch leaderboard",
    });
  }
}