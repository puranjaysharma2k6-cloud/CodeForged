import { authenticate } from "../middlewares/auth.middleware.js";
import type { Request, Response } from "express";
import { prisma } from "../db/db.js";
import { login } from "./auth.controller.js";
import { $Enums } from "../generated/prisma/client.js";

interface RatingData {
  contestName: string;
  newRating: number;
  date: string;
}

 interface ProfileLoaderData {
  username: string;
  handle: string;
  avatarUrl?: string;
  currentRating: number;
  problemsSolved: number;
  ratingHistory: RatingData[];
}



export async function getUser(req: Request, res: Response): Promise<void> {

  console.time("ping-db");

await prisma.$queryRaw`SELECT 1`;

console.timeEnd("ping-db");


const userId = req.params.id ?? req.user!.userId; // parms.id bc you named your router users/:id router.get(users :/id)
// since getUser is a common function for both me as well as for accesign other persons profile :id
if (typeof userId !== 'string') {
    res.status(400).json({ error: "Invalid user ID" });
    return;
}
// console.log("url:", req.originalUrl);
// console.log("params:", req.params);
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
  where: { id: userId }, // index on id increases the performance 
  select: {
    username: true,
    name: true,
    avatarUrl: true,
    ratingHistory: {
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        newRating: true,
        createdAt: true,
        contest: {
          select: {
            title: true,
          },
        },
      },
    },
  },
});
  console.timeEnd("userINFO");
 if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }

  const rank = await prisma.user.count({
        where: {
          currentRating: {
            gt: user?.ratingHistory[user.ratingHistory.length - 1]?.newRating ?? 0,
          },
        },
      }) + 1;

const result = {
  ...user,
  problemsSolved: problemsSolvedCount,
  rank,
  currentRating:
    user?.ratingHistory[user.ratingHistory.length - 1]?.newRating ?? 0,
};

   
    res.json(result);
} catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
}
}