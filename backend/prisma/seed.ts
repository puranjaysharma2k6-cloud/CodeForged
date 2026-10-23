import bcrypt from 'bcrypt';
import { seedCodeforcesProblems } from '../src/utils/problemSeed.js';

async function main() {
  await seedCodeforcesProblems();
}

main()
  .then(() => {
    console.log('[seed] demo contest data ensured');
  })
  .catch((error) => {
    console.error('[seed] failed:', error);
    process.exit(1);
  });
