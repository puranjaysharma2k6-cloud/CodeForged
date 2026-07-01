import {
  JudgeService,
  JudgeProviderRegistry,
  VjudgeProvider,
  InMemoryConcurrencyLimitedQueue,
  loadJudgeConfigFromEnv,
  IVerdictPublisher,
  ISubmissionQueue,
} from '../judge/index.js';
import { createVjudgeHttpClient } from '../judge/providers/vjudge/VjudgeHttpClientImpl.js';
import { PrismaProblemMappingRepository } from '../judge/adapters/PrismaProblemMappingRepository.js';

function loadVjudgeAccounts(): { username: string; password: string }[] {
  const raw = process.env.VJUDGE_ACCOUNTS;
  if (!raw) throw new Error('VJUDGE_ACCOUNTS env var not set');
  return JSON.parse(raw);
}

export function buildJudgeService(
  publisher: IVerdictPublisher,
): { judgeService: JudgeService; vjudgeProvider: VjudgeProvider } {
  const config = loadJudgeConfigFromEnv();

  // Reads vjudgeId from Problem table in Postgres
  const problemMappingRepo = new PrismaProblemMappingRepository();

  const vjudgeProvider = new VjudgeProvider(
    {
      accounts: loadVjudgeAccounts(),
      poolOptions: {
        maxConsecutiveFailures: 3,
        quarantineMs: 5 * 60 * 1000,
      },
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

export function buildSubmissionQueue(
  judgeService: JudgeService,
  vjudgeProvider: VjudgeProvider,
): ISubmissionQueue {
  const queue = new InMemoryConcurrencyLimitedQueue({
    concurrency: vjudgeProvider.getPoolStatus().total,
    maxRetries: 1,
    retryDelayMs: 2000,
  });

  queue.onSubmission(async (request: import('../judge/types.js').SubmissionRequest) => {
    await judgeService.judge(request);
  });

  queue.start();
  return queue;
}
