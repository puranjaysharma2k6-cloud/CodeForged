import type { Request, Response } from "express";

// Placeholder data until Contest models are added to Prisma.
const MOCK_CONTESTS = [
  {
    id: "contest-1",
    name: "Weekly Challenge #42",
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    status: "upcoming" as const,
  },
  {
    id: "contest-2",
    name: "Spring Sprint",
    startDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    duration: 180,
    status: "ongoing" as const,
  },
  {
    id: "contest-3",
    name: "Winter Finals",
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 240,
    status: "past" as const,
  },
];

export async function listContests(_req: Request, res: Response): Promise<void> {
  res.json(MOCK_CONTESTS);
}

export async function getContestById(req: Request, res: Response): Promise<void> {
  const contest = MOCK_CONTESTS.find((item) => item.id === req.params.id);

  if (!contest) {
    res.status(404).json({ message: "Contest not found" });
    return;
  }

  res.json(contest);
}

export async function getParticipation(req: Request, res: Response): Promise<void> {
  const contest = MOCK_CONTESTS.find((item) => item.id === req.params.id);

  if (!contest) {
    res.status(404).json({ message: "Contest not found" });
    return;
  }

  if (contest.status !== "past") {
    res.status(400).json({ message: "Participation is only available for past contests" });
    return;
  }

  // Placeholder until participation is stored in the database.
  res.json({
    contestId: contest.id,
    problemsSolved: 3,
    rank: 42,
    score: 850,
  });
}

export async function registerForContest(req: Request, res: Response): Promise<void> {
  const contest = MOCK_CONTESTS.find((item) => item.id === req.params.id);

  if (!contest) {
    res.status(404).json({ message: "Contest not found" });
    return;
  }

  if (contest.status === "past") {
    res.status(400).json({ message: "Cannot register for a past contest" });
    return;
  }

  res.status(201).json({
    message: "Registered successfully",
    contestId: contest.id,
    userId: req.user!.userId,
  });
}
