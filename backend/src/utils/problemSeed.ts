import bcrypt from 'bcrypt';
import { prisma } from '../db/db.js';
import { ContestStatus, Mode, Verdict } from '../generated/prisma/enums.js';

const demoPassword = 'codeforged-demo';

const users = [
  { username: 'alina_codes', name: 'Alina Rao', email: 'alina@example.test', rating: 1480, ratings: [1260, 1370, 1480], solved: [[true, true], [true, false], [true, true]] },
  { username: 'byte_ninja', name: 'Kabir Shah', email: 'kabir@example.test', rating: 1320, ratings: [1180, 1260, 1320], solved: [[true, false], [true, true], [false, true]] },
  { username: 'graph_guru', name: 'Mira Sen', email: 'mira@example.test', rating: 1710, ratings: [1580, 1650, 1710], solved: [[true, true], [true, true], [true, true]] },
  { username: 'loopster', name: 'Dev Mehta', email: 'dev@example.test', rating: 1100, ratings: [980, 1040, 1100], solved: [[false, true], [true, false], [true, false]] },
];

const solutions: Record<string, string> = {
  'A. Watermelon': 'w = int(input())\nprint("YES" if w > 2 and w % 2 == 0 else "NO")',
  'B. Way Too Long Words': 'n = int(input())\nfor _ in range(n):\n    word = input().strip()\n    print(word if len(word) <= 10 else f"{word[0]}{len(word) - 2}{word[-1]}")',
  'A. Team': 'n = int(input())\nprint(sum(sum(map(int, input().split())) >= 2 for _ in range(n)))',
  'B. Domino Piling': 'm, n = map(int, input().split())\nprint(m * n // 2)',
  'A. Beautiful Matrix': 'grid = [list(map(int, input().split())) for _ in range(5)]\nfor row in range(5):\n    for col in range(5):\n        if grid[row][col] == 1:\n            print(abs(row - 2) + abs(col - 2))',
  'B. Petya and Strings': 'first = input().lower()\nsecond = input().lower()\nprint((first > second) - (first < second))',
};

const contests = [
  {
    title: 'CodeForged Spring Warmup',
    startTime: new Date('2026-03-14T09:00:00.000Z'),
    duration: 120,
    problems: [
      {
        title: 'A. Watermelon',
        statement: `# A. Watermelon\n\nYou are given the weight w of a watermelon in kilograms. Decide whether it can be split into two positive integer parts so that each part has an even weight.\n\n## Input\nA single integer w (1 ≤ w ≤ 100).\n\n## Output\nPrint YES if such a split is possible, otherwise print NO.`,
        cases: [['8', 'YES'], ['5', 'NO'], ['1', 'NO'], ['100', 'YES'], ['2', 'NO']],
      },
      {
        title: 'B. Way Too Long Words',
        statement: `# B. Way Too Long Words\n\nA word is too long if its length is strictly greater than 10. Replace every too-long word with its first letter, followed by the number of omitted letters, followed by its last letter. Leave all other words unchanged.\n\n## Input\nThe first line contains n (1 ≤ n ≤ 100). Each of the next n lines contains a lowercase word of length at most 100.\n\n## Output\nPrint the transformed words, one per line.`,
        cases: [['4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis', 'word\nl10n\ni18n\np43s']],
      },
    ],
  },
  {
    title: 'CodeForged Array and Grid Contest',
    startTime: new Date('2026-04-11T09:00:00.000Z'),
    duration: 150,
    problems: [
      {
        title: 'A. Team',
        statement: `# A. Team\n\nThree friends decide whether to implement a problem. Each friend independently says whether they are sure of the solution. They implement it only when at least two are sure. Given their answers for each problem, count how many problems they will implement.\n\n## Input\nThe first line contains n (1 ≤ n ≤ 1000). Each of the next n lines contains three integers, each either 0 or 1.\n\n## Output\nPrint the number of problems they will implement.`,
        cases: [['3\n1 1 0\n1 1 1\n1 0 0', '2'], ['4\n0 0 0\n0 1 1\n1 1 1\n1 0 1', '3'], ['1\n0 0 0', '0']],
      },
      {
        title: 'B. Domino Piling',
        statement: `# B. Domino Piling\n\nGiven an m by n rectangular board and unlimited 2 by 1 dominoes, find the maximum number of dominoes that can be placed without overlap. Dominoes may be rotated and must cover exactly two unit squares.\n\n## Input\nOne line contains m and n (1 ≤ m, n ≤ 16).\n\n## Output\nPrint the maximum number of dominoes.`,
        cases: [['2 4', '4'], ['3 3', '4'], ['1 1', '0'], ['1 16', '8'], ['5 4', '10']],
      },
    ],
  },
  {
    title: 'CodeForged String Skills',
    startTime: new Date('2026-05-09T09:00:00.000Z'),
    duration: 120,
    problems: [
      {
        title: 'A. Beautiful Matrix',
        statement: `# A. Beautiful Matrix\n\nA 5 by 5 matrix contains twenty-four zeroes and one one. In one move, you may swap two adjacent rows or two adjacent columns. Find the minimum number of moves needed to bring the one to the center cell.\n\n## Input\nFive lines each contain five integers, with exactly one integer equal to 1 and all others equal to 0.\n\n## Output\nPrint the minimum number of moves.`,
        cases: [['0 0 0 0 0\n0 0 0 0 0\n0 0 1 0 0\n0 0 0 0 0\n0 0 0 0 0', '0'], ['1 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0', '4'], ['0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 1', '4']],
      },
      {
        title: 'B. Petya and Strings',
        statement: `# B. Petya and Strings\n\nCompare two strings of equal length lexicographically without regard to letter case.\n\n## Input\nTwo lines contain strings of equal length (1 to 100), made of English letters.\n\n## Output\nPrint -1 if the first string is smaller, 1 if it is greater, or 0 if they are equal ignoring case.`,
        cases: [['aaaa\naaaA', '0'], ['abs\nAbz', '-1'], ['abcdefg\nAbCdEfF', '1'], ['Code\ncode', '0']],
      },
    ],
  },
];

export async function seedCodeforcesProblems(): Promise<void> {
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const seededUsers: Array<{ id: string; seed: (typeof users)[number] }> = [];

  for (const user of users) {
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, currentRating: user.rating },
      create: {
        email: user.email,
        username: user.username,
        name: user.name,
        currentRating: user.rating,
        passwordHash,
      },
      select: { id: true },
    });
    seededUsers.push({ id: savedUser.id, seed: user });
  }

  for (const [contestIndex, contestSeed] of contests.entries()) {
    const existingContest = await prisma.contest.findFirst({ where: { title: contestSeed.title } });
    const contest = existingContest ?? await prisma.contest.create({
      data: {
        title: contestSeed.title,
        startTime: contestSeed.startTime,
        duration: contestSeed.duration,
        status: ContestStatus.PAST,
        editorial: null,
      },
    });

    const seededProblems = [];
    for (const problemSeed of contestSeed.problems) {
      const existingProblem = await prisma.problem.findFirst({
        where: { contestId: contest.id, title: problemSeed.title },
      });
      const problem = existingProblem ?? await prisma.problem.create({
        data: {
          title: problemSeed.title,
          statement: problemSeed.statement,
          timeLimit: 1000,
          memoryLimit: 256,
          published: true,
          contestId: contest.id,
        },
      });

      const caseCount = await prisma.testCase.count({ where: { problemId: problem.id } });
      if (caseCount === 0) {
        await prisma.testCase.createMany({
          data: problemSeed.cases.map(([input, expected], orderIndex) => ({
            problemId: problem.id,
            input: `${input}\n`,
            expected: `${expected}\n`,
            isSample: orderIndex === 0,
            orderIndex,
          })),
        });
      }

      seededProblems.push({ id: problem.id, title: problemSeed.title });
    }

    for (const [userIndex, seededUser] of seededUsers.entries()) {
      const solveMap = Object.fromEntries(seededProblems.map((problem, problemIndex) => [
        problem.id,
        {
          solved: seededUser.seed.solved[contestIndex][problemIndex],
          attempts: seededUser.seed.solved[contestIndex][problemIndex] ? 1 : 0,
          penalty: seededUser.seed.solved[contestIndex][problemIndex] ? 20 + problemIndex * 10 : 0,
        },
      ]));
      const solvedCount = Object.values(solveMap).filter((result) => result.solved).length;
      const resultData = {
        title: contestSeed.title,
        score: solvedCount * 500,
        penalty: solvedCount * 30 + userIndex * 7,
        newRating: seededUser.seed.ratings[contestIndex],
        finalRank: userIndex + 1,
        problemStats: solveMap,
      };

      await prisma.contestResult.upsert({
        where: {
          userId_contestId_mode: {
            userId: seededUser.id,
            contestId: contest.id,
            mode: Mode.OFFICIAL,
          },
        },
        update: resultData,
        create: {
          ...resultData,
          userId: seededUser.id,
          contestId: contest.id,
          mode: Mode.OFFICIAL,
        },
      });

      for (const [problemIndex, problem] of seededProblems.entries()) {
        if (!seededUser.seed.solved[contestIndex][problemIndex]) continue;

        const code = solutions[problem.title];
        const existingSubmission = await prisma.submission.findFirst({
          where: { userId: seededUser.id, problemId: problem.id, code },
          select: { id: true },
        });
        if (existingSubmission) continue;

        await prisma.submission.create({
          data: {
            userId: seededUser.id,
            problemId: problem.id,
            code,
            language: 'python3',
            status: Verdict.ACCEPTED,
            runtime: 12 + userIndex * 3 + problemIndex,
            memory: 2048 + userIndex * 128,
            createdAt: new Date(contestSeed.startTime.getTime() + (25 + problemIndex * 12 + userIndex * 3) * 60_000),
          },
        });
      }
    }
  }

  console.log(`[seed] ensured ${contests.length} contests, ${users.length} demo users, and 6 problems`);
}
