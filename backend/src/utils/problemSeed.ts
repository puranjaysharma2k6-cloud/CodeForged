import { prisma } from '../db/db.js';
import { ContestStatus } from '../generated/prisma/enums.js';

interface CodeforcesProblemSeed {
  title: string;
  statement: string;
  timeLimit: number;
  memoryLimit: number;
  vjudgeId: string;
}

interface CodeforcesApiResponse {
  result: {
    problems: Array<{
      contestId: number;
      index: string;
      name: string;
      type: string;
      points?: number;
    }>;
  };
}

const FALLBACK_SEEDS: CodeforcesProblemSeed[] = [
  {
    title: 'A. Watermelon',
    statement:
      'One hot summer day Pete and his friend Billy decided to buy a watermelon. They chose the biggest one, but it had to be divided between them. The watermelon weighs w kilograms. Pete and Billy want to split the watermelon into two parts so that each part weighs an even number of kilograms. Determine whether it is possible to split the watermelon into two parts with even weights.',
    timeLimit: 1000,
    memoryLimit: 256,
    vjudgeId: '4/A',
  },
  {
    title: 'B. Two Arrays And Swaps',
    statement:
      'You are given two arrays a and b and an integer k. In one operation, choose one element from array a and one from array b, and swap them. Find the maximum possible sum of the first array after at most k swaps.',
    timeLimit: 2000,
    memoryLimit: 512,
    vjudgeId: '1154/B',
  },
  {
    title: 'A. Team',
    statement:
      'The team consists of three programmers. Determine the maximum number of teams that can be formed from n programmers.',
    timeLimit: 1000,
    memoryLimit: 256,
    vjudgeId: '470/A',
  },
  {
    title: 'B. Gift Fixing',
    statement:
      'You are given two arrays of positive integers. You may perform operations by decreasing one element from each array. Determine the minimum number of operations required.',
    timeLimit: 1500,
    memoryLimit: 256,
    vjudgeId: '1398/B',
  },
];

async function fetchCodeforcesProblems(): Promise<CodeforcesProblemSeed[]> {
  try {
    const res = await fetch('https://codeforces.com/api/problemset.problems');
    if (!res.ok) throw new Error(`Codeforces API status ${res.status}`);
    const data = (await res.json()) as CodeforcesApiResponse;
    const candidates = (data.result?.problems ?? []).filter((p) => p.type === 'A' || p.type === 'B');

    return candidates.slice(0, 4).map((problem) => ({
      title: `${problem.index}. ${problem.name}`,
      statement: `Imported from Codeforces contest ${problem.contestId}. This problem is seeded into the local database for contest testing and practice.`,
      timeLimit: 1000,
      memoryLimit: 256,
      vjudgeId: `${problem.contestId}/${problem.index}`,
    }));
  } catch (error) {
    console.warn('[seed] Codeforces API unavailable, using bundled fallback problems:', error);
    return FALLBACK_SEEDS;
  }
}

export async function seedCodeforcesProblems(): Promise<void> {
  const existingContest = await prisma.contest.findFirst({
    where: { title: 'Codeforces Warmup Contest' },
    select: { id: true },
  });

  const contest = existingContest ?? (await prisma.contest.create({
    data: {
      title: 'Codeforces Warmup Contest',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      duration: 180,
      status: ContestStatus.PAST,
      editorial: 'Seeded from Codeforces problems for local testing.',
    },
  }));

  const seeds = await fetchCodeforcesProblems();

  let seeded = 0;
  for (const seed of seeds) {
    const existing = await prisma.problem.findFirst({
      where: { contestId: contest.id, title: seed.title },
      select: { id: true },
    });

    if (existing) continue;

    await prisma.problem.create({
      data: {
        title: seed.title,
        statement: seed.statement,
        timeLimit: seed.timeLimit,
        memoryLimit: seed.memoryLimit,
        published: true,
        vjudgeId: seed.vjudgeId,
        contestId: contest.id,
      },
    });

    seeded += 1;
  }

  console.log(`[seed] inserted ${seeded} Codeforces-style problems into contest ${contest.id}`);
}
