/**
 * Composition root.
 *
 * This is the ONLY place in your backend that imports concrete classes.
 * Everything above (route handlers, controllers) only ever calls:
 *   - submissionQueue.enqueue(request)   to submit
 *   - implements IVerdictPublisher        to receive verdicts
 */
import { Request,Response } from 'express';
import {
  JudgeService,
  JudgeProviderRegistry,
  VjudgeProvider,
  ConsoleVerdictPublisher,
  InMemoryProblemMappingRepository,
  InMemoryConcurrencyLimitedQueue,
  loadJudgeConfigFromEnv,
  IVerdictPublisher,
  ISubmissionQueue,
} from '../judge/index.js';
import { createVjudgeHttpClient } from '../judge/providers/vjudge/VjudgeHttpClientImpl.js';

// ---------------------------------------------------------------------------
// Account loader
// ---------------------------------------------------------------------------

/**
 * Reads VJUDGE_ACCOUNTS from .env — already set in your project:
 *   VJUDGE_ACCOUNTS='[{"username":"Puranjay","password":"..."},...]'
 */
function loadVjudgeAccounts(): { username: string; password: string }[] {
  const raw = process.env.VJUDGE_ACCOUNTS;
  if (!raw) {
    throw new Error(
      'VJUDGE_ACCOUNTS env var not set — needs a JSON array of {username,password}',
    );
  }
  return JSON.parse(raw);
}

// ---------------------------------------------------------------------------
// Judge service builder
// ---------------------------------------------------------------------------

export function buildJudgeService(
  publisher: IVerdictPublisher = new ConsoleVerdictPublisher(),
): { judgeService: JudgeService; vjudgeProvider: VjudgeProvider } {
  const config = loadJudgeConfigFromEnv(); // JUDGE_PROVIDER=vjudge (default)

  // Problem mapping repo — swap for a Prisma-backed one in production.
  // Add mappings here or in your DB seed.
  // Format: externalProblemCode = "<vjudgeContestId>/<problemLetter>"
  //   e.g. for vjudge.net/contest/563012/problem/A → "563012/A"
  const problemMappingRepo = new InMemoryProblemMappingRepository();

  // Example mapping — replace / extend with your real problems
  problemMappingRepo.add({
    internalProblemId: 'prob-101',
    providerName: 'vjudge',
    externalProblemCode: '563012/A', // <-- vjudgeContestId/problemLetter
  });

  const vjudgeProvider = new VjudgeProvider(
    {
      accounts: loadVjudgeAccounts(),
      poolOptions: {
        maxConsecutiveFailures: 3,
        quarantineMs: 5 * 60 * 1000,
      },
      // Factory called once per account — each account gets its own cookie jar
      httpClientFactory: createVjudgeHttpClient,
    },
    problemMappingRepo,
  );

  const registry = new JudgeProviderRegistry();
  registry.register(vjudgeProvider);

  const judgeService = new JudgeService(
    registry.get(config.activeProvider),
    publisher,
    problemMappingRepo,
  );

  return { judgeService, vjudgeProvider };
}

// ---------------------------------------------------------------------------
// Submission queue builder
// ---------------------------------------------------------------------------

export function buildSubmissionQueue(
  judgeService: JudgeService,
  vjudgeProvider: VjudgeProvider,
): ISubmissionQueue {
  // Concurrency capped at pool size — one slot per bot account
  const queue = new InMemoryConcurrencyLimitedQueue({
    concurrency: vjudgeProvider.getPoolStatus().total,
    maxRetries: 1,
    retryDelayMs: 2000,
  });

  queue.onSubmission(async (request:Request) => {
    await judgeService.judge(request);
  });

  queue.start();
  return queue;
}
