import { prisma } from '../db/db.js';
import { ContestStatus } from '../generated/prisma/enums.js';

interface CodeforcesProblemSeed {
  title: string;
  statement: string;
  timeLimit: number;
  memoryLimit: number;
  testCases?: Array<{
    input: string;
    expected: string;
    isSample: boolean;
    orderIndex: number;
  }>;
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
    testCases: [
      { input: '8\n', expected: 'YES\n', isSample: true, orderIndex: 0 },
      { input: '5\n', expected: 'NO\n', isSample: true, orderIndex: 1 },
    ],
  },
  {
    title: 'B. Two Arrays And Swaps',
    statement:
      'You are given two arrays a and b and an integer k. In one operation, choose one element from array a and one from array b, and swap them. Find the maximum possible sum of the first array after at most k swaps.',
    timeLimit: 2000,
    memoryLimit: 512,
    testCases: [
      { input: '3 2\n1 2 3\n3 1\n', expected: '7\n', isSample: true, orderIndex: 0 },
      { input: '4 1\n1 2 3 4\n4\n', expected: '11\n', isSample: true, orderIndex: 1 },
    ],
  },
  {
    title: 'A. Team',
    statement:
      'The team consists of three programmers. Determine the maximum number of teams that can be formed from n programmers.',
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: '6 3\n1 1 1 1 1 1\n', expected: '2\n', isSample: true, orderIndex: 0 },
      { input: '5 2\n1 1 1 1 1\n', expected: '2\n', isSample: true, orderIndex: 1 },
    ],
  },
  {
    title: 'B. Gift Fixing',
    statement:
      'You are given two arrays of positive integers. You may perform operations by decreasing one element from each array. Determine the minimum number of operations required.',
    timeLimit: 1500,
    memoryLimit: 256,
    testCases: [
      { input: '3\n1 2 3\n3 2 1\n', expected: '2\n', isSample: true, orderIndex: 0 },
      { input: '2\n5 5\n5 5\n', expected: '0\n', isSample: true, orderIndex: 1 },
    ],
  },
];

const CUSTOM_PROBLEM_SEED = {
  title: 'Two Sum',
  statement: `# Two Sum

Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to the target.

You may assume that each input has exactly one solution, and you cannot use the same element twice.

## Example 1
Input: nums = [2,7,11,15], target = 9
Output: [0,1]

## Example 2
Input: nums = [3,2,4], target = 6
Output: [1,2]

## Constraints
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- There is exactly one valid answer.

## Notes
Return the indices as a list of two integers in ascending order.`,
  timeLimit: 1000,
  memoryLimit: 256,
  testCases: [
    {
      input: 'nums = [2,7,11,15]\ntarget = 9\n',
      expected: '[0, 1]\n',
      isSample: true,
      orderIndex: 0,
    },
    {
      input: 'nums = [3,2,4]\ntarget = 6\n',
      expected: '[1, 2]\n',
      isSample: true,
      orderIndex: 1,
    },
    {
      input: 'nums = [10,20,30,40]\ntarget = 50\n',
      expected: '[1, 2]\n',
      isSample: false,
      orderIndex: 2,
    },
    {
      input: 'nums = [1,5,3,8,9]\ntarget = 13\n',
      expected: '[2, 4]\n',
      isSample: false,
      orderIndex: 3,
    },
  ],
};

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
      testCases: [
        {
          input: '1\n',
          expected: '1\n',
          isSample: true,
          orderIndex: 0,
        },
      ],
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
        contestId: contest.id,
        testCases: {
          create: (seed.testCases ?? [
            {
              input: '1\n',
              expected: '1\n',
              isSample: true,
              orderIndex: 0,
            },
          ]).map((testCase) => ({
            input: testCase.input,
            expected: testCase.expected,
            isSample: testCase.isSample,
            orderIndex: testCase.orderIndex,
          })),
        },
      },
    });

    seeded += 1;
  }

  const customProblemExists = await prisma.problem.findFirst({
    where: { contestId: contest.id, title: CUSTOM_PROBLEM_SEED.title },
    select: { id: true },
  });

  if (!customProblemExists) {
    await prisma.problem.create({
      data: {
        title: CUSTOM_PROBLEM_SEED.title,
        statement: CUSTOM_PROBLEM_SEED.statement,
        timeLimit: CUSTOM_PROBLEM_SEED.timeLimit,
        memoryLimit: CUSTOM_PROBLEM_SEED.memoryLimit,
        published: true,
        contestId: contest.id,
        testCases: {
          create: CUSTOM_PROBLEM_SEED.testCases.map((testCase) => ({
            input: testCase.input,
            expected: testCase.expected,
            isSample: testCase.isSample,
            orderIndex: testCase.orderIndex,
          })),
        },
      },
    });

    seeded += 1;
  }

  console.log(`[seed] inserted ${seeded} problems into contest ${contest.id}`);
}
