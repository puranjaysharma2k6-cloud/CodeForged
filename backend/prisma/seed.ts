import { prisma } from "../src/db/db";
import { Verdict, ContestStatus, Mode } from '../src/generated/prisma/enums';
//const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with warm-up data...');

//   // 1. Clean up existing data to avoid unique constraint errors on re-runs
//   await prisma.submission.deleteMany();
//   await prisma.contestResult.deleteMany();
//   await prisma.contestRegistration.deleteMany();
//   await prisma.problem.deleteMany();
//   await prisma.contest.deleteMany();
//   await prisma.user.deleteMany();

  const user1 = await prisma.user.create({
    data: {
      email: 'tourist@example.com',
      username: 'tourist',
      passwordHash: 'hashed_password_placeholder',
      name: 'Gennady Korotkevich',
      currentRating: 3800,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'benq@example.com',
      username: 'Benq',
      passwordHash: 'hashed_password_placeholder',
      name: 'Benjamin Qi',
      currentRating: 3750,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'newbie@example.com',
      username: 'newbie_coder',
      passwordHash: 'hashed_password_placeholder',
      currentRating: 1200,
    },
  });

  
  const pastContest = await prisma.contest.create({
    data: {
      title: 'ICPC Regional Warmup 2026',
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      duration: 300, // 5 hours in minutes
      status: ContestStatus.PAST,
      editorial: 'The editorial for A is greedy, B is DP...',
    },
  });

  const upcomingContest = await prisma.contest.create({
    data: {
      title: 'Weekly Algorithm Round 45',
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      duration: 120, // 2 hours
      status: ContestStatus.UPCOMING,
    },
  });

  // 4. Create Problems for Past Contest
  const problemA = await prisma.problem.create({
    data: {
      title: 'A. Watermelon',
      statement: 'One hot summer day Pete and his friend Billy decided to buy a watermelon...',
      timeLimit: 1000,
      memoryLimit: 256,
      published: true,
      contestId: pastContest.id,
    },
  });

  const problemB = await prisma.problem.create({
    data: {
      title: 'B. Traveling Salesman',
      statement: 'Given a list of cities and the distances between each pair of cities...',
      timeLimit: 2000,
      memoryLimit: 512,
      published: true,
      contestId: pastContest.id,
    },
  });

  // 5. Create Problems for Upcoming Contest (Not published yet)
  await prisma.problem.create({
    data: {
      title: 'A. Secret Upcoming Problem',
      statement: 'This statement is hidden until the contest starts.',
      published: false,
      contestId: upcomingContest.id,
    },
  });

  // 6. Create Registrations
  await prisma.contestRegistration.createMany({
    data: [
      { userId: user1.id, contestId: pastContest.id, mode: Mode.OFFICIAL },
      { userId: user2.id, contestId: pastContest.id, mode: Mode.OFFICIAL },
      { userId: user3.id, contestId: pastContest.id, mode: Mode.VIRTUAL },
      { userId: user1.id, contestId: upcomingContest.id, mode: Mode.OFFICIAL },
    ],
  });

  // 7. Create Submissions for Past Contest
  await prisma.submission.create({
    data: {
      code: 'print("YES" if w % 2 == 0 and w > 2 else "NO")',
      language: 'Python 3',
      status: Verdict.ACCEPTED,
      runtime: 45,
      memory: 1024,
      userId: user1.id,
      problemId: problemA.id,
    },
  });

  await prisma.submission.create({
    data: {
      code: '#include <iostream>\nint main() { return 0; }',
      language: 'C++20',
      status: Verdict.WRONG_ANSWER,
      runtime: 12,
      memory: 512,
      userId: user2.id,
      problemId: problemB.id,
    },
  });

  // 8. Create Contest Results (Historical Snapshot)
  await prisma.contestResult.create({
    data: {
      title: `Result: ${user1.username} in ${pastContest.title}`,
      userId: user1.id,
      contestId: pastContest.id,
      mode: Mode.OFFICIAL,
      score: 2,
      penalty: 120,
      newRating: 3820,
      finalRank: 1,
      problemStats: { A: 'Accepted', B: 'Accepted' }, // Stored as JSON
    },
  });

  await prisma.contestResult.create({
    data: {
      title: `Result: ${user2.username} in ${pastContest.title}`,
      userId: user2.id,
      contestId: pastContest.id,
      mode: Mode.OFFICIAL,
      score: 1,
      penalty: 45,
      newRating: 3740,
      finalRank: 2,
      problemStats: { A: 'Accepted', B: 'Wrong Answer' }, 
    },
  });

  console.log(' Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });