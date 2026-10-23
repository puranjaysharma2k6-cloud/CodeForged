import bcrypt from 'bcrypt';
import { prisma } from '../db/db.js';
import { ContestStatus } from '../generated/prisma/enums.js';

const demoPassword = 'codeforged-demo';

const users = [
  { username: 'alina_codes', name: 'Alina Rao', email: 'alina@example.test', rating: 1480 },
  { username: 'byte_ninja', name: 'Kabir Shah', email: 'kabir@example.test', rating: 1320 },
  { username: 'graph_guru', name: 'Mira Sen', email: 'mira@example.test', rating: 1710 },
  { username: 'loopster', name: 'Dev Mehta', email: 'dev@example.test', rating: 1100 },
];

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

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        username: user.username,
        name: user.name,
        currentRating: user.rating,
        passwordHash,
      },
    });
  }

  for (const contestSeed of contests) {
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
    }
  }

  console.log(`[seed] ensured ${contests.length} contests, ${users.length} demo users, and 6 problems`);
}
