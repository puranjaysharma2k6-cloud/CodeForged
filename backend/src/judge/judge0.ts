import axios from 'axios';
import { prisma } from '../db/db.js';
import { Verdict } from '../generated/prisma/enums.js';
import { redisClient } from '../redis/redis.js';

const JUDGE0_URL = process.env.JUDGE0_URL ?? 'http://localhost:2358';

const DEFAULT_CALLBACK_URL =
  process.env.JUDGE0_WEBHOOK_URL ??
  `${process.env.BACKEND_URL ?? 'http://172.17.0.1:8000'}/api/judge0/webhook`;
const pendingSubmissionTokens = new Map<string, { submissionId: string; testIndex: number }>();
// in memory map -> should be stored in persistent memroyu instead
type TestResult = {
  index: number;
  verdict: Verdict;
  runtime: number | null;
  memory: number | null;
};

interface Judge0SubmissionRequest {
  source_code: string;
  language_id: number;
  stdin: string;
  expected_output: string;
  cpu_time_limit: number;
  wall_time_limit: number;
  memory_limit: number;
  enable_network: boolean;
  callback_url?: string;
  // this allows running without c groups

    enable_per_process_and_thread_time_limit?: boolean;
  enable_per_process_and_thread_memory_limit?: boolean;
}

interface Judge0SubmissionResult {
  token: string;
}

const LANGUAGE_ID_MAP: Record<string, number> = {
  cpp17: 52,
  cpp20: 52,
  java: 62,
  python3: 71,
  javascript: 63,
  go: 60,
  rust: 73,
  kotlin: 78,
};

export async function submitToJudge0(input: {
  sourceCode: string;
  language: string;
  stdin: string;
  expectedOutput: string;
  timeLimitMs: number;
  memoryLimitKb: number;
  submissionId?: string;
  testIndex?: number;
}): Promise<Judge0SubmissionResult> {
  const [result] = await submitBatchToJudge0({
    sourceCode: input.sourceCode,
    language: input.language,
    timeLimitMs: input.timeLimitMs,
    memoryLimitKb: input.memoryLimitKb,
    submissionId: input.submissionId,
    tests: [{
      stdin: input.stdin,
      expectedOutput: input.expectedOutput,
      testIndex: input.testIndex ?? 0,
    }],
  });

  return result;
}

export async function submitBatchToJudge0(input: {
  sourceCode: string;
  language: string;
  timeLimitMs: number;
  memoryLimitKb: number;
  submissionId?: string;
  tests: Array<{
    stdin: string;
    expectedOutput: string;
    testIndex: number;
  }>;
}): Promise<Judge0SubmissionResult[]> {
  const languageId = LANGUAGE_ID_MAP[input.language] ?? LANGUAGE_ID_MAP.python3;
  const submissions = input.tests.map((test): Judge0SubmissionRequest => ({
    source_code: input.sourceCode,
    language_id: languageId,
    stdin: test.stdin,
    expected_output: test.expectedOutput,
    cpu_time_limit: normalizeCpuTimeLimit(input.timeLimitMs),
    wall_time_limit: 5,
    memory_limit: normalizeMemoryLimit(input.memoryLimitKb),
    enable_network: false,
    callback_url: DEFAULT_CALLBACK_URL,
    enable_per_process_and_thread_time_limit: true,
enable_per_process_and_thread_memory_limit: true,
  }));

  const createResponse = await axios.post(
    `${JUDGE0_URL}/submissions/batch?base64_encoded=false`,
    { submissions },
    { headers: { 'Content-Type': 'application/json' } },
  );
  // judge0 api return a token which can be used for getting response later
  const results = createResponse.data as Judge0SubmissionResult[] | undefined;
  if (!Array.isArray(results) || results.length !== input.tests.length) {
    throw new Error('Judge0 did not return a token for every test case.');
  }

  results.forEach((result, index) => {
    if (!result?.token) {
      throw new Error('Judge0 did not return a submission token.');
    }
 // HERE the in memory map Pending SUbmission token 
    if (input.submissionId) {
      pendingSubmissionTokens.set(result.token, {
        submissionId: input.submissionId,
        testIndex: input.tests[index].testIndex,
      });
    }
  });
   console.log('JUDGE0_URL:', process.env.JUDGE0_URL);
 console.log('process.env.JUDGE0_CALLBACK_URL:', process.env.JUDGE0_CALLBACK_URL);
  console.log('[judge0] submitted batch, tokens:', results.map((r) => r.token));
  return results;
}

function normalizeCpuTimeLimit(timeLimitMs: number): number {
  return Math.max(1, Math.min(2, timeLimitMs / 1000));
}

function normalizeMemoryLimit(memoryLimitKb: number): number {
  return Math.max(32 * 1024, memoryLimitKb);

}


export async function handleJudge0Webhook(payload: any): Promise<void> {
  console.log('[judge0-webhook] received payload:', payload);
  const token = payload?.token as string | undefined;
  const pending = token ? pendingSubmissionTokens.get(token) : undefined;

  if (!token || !pending) {
    return;
  }

  pendingSubmissionTokens.delete(token);
  const { submissionId, testIndex } = pending;

  const statusId = payload?.status?.id as number | undefined;
  const verdict = mapJudge0Status(statusId ?? 0);
  const runtime = payload?.time != null ? Math.round(Number(payload.time) * 1000) : null;
  const memory = payload?.memory != null ? Number(payload.memory) : null;

  const finalResult = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Submission" WHERE id = ${submissionId} FOR UPDATE`;

    const submission = await tx.submission.findUnique({
      where: { id: submissionId },
      select: { testResults: true },
    });

    const results = normalizeTestResults(submission?.testResults);
    const existingIndex = results.findIndex((result) => result.index === testIndex);

    const updatedResult: TestResult = {
      index: testIndex,
      verdict,
      runtime,
      memory,
    };

    if (existingIndex >= 0) {
      results[existingIndex] = updatedResult;
    } else {
      results.push(updatedResult);
    }

    results.sort((a, b) => a.index - b.index);

    const hasPendingTests = results.some((result) => result.verdict === Verdict.PENDING);
    const aggregateVerdict = hasPendingTests ? Verdict.PENDING : aggregateTestVerdict(results);
    const aggregateRuntime = hasPendingTests ? null : sumRuntime(results);
    const aggregateMemory = hasPendingTests ? null : maxMemory(results);

    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: aggregateVerdict,
        runtime: aggregateRuntime,
        memory: aggregateMemory,
        testResults: results,
      },
    });

    if (hasPendingTests) {
      return null;
    }

    return {
      verdict: aggregateVerdict,
      runtime: aggregateRuntime,
      memory: aggregateMemory,
    };
  });

  if (!finalResult) {
    return;
  }

  const streamPayload: Record<string, string> = {
    submissionId,
    verdict: finalResult.verdict,
    providerName: 'judge0',
    judgedAt: new Date().toISOString(),
  };

  console.log('streamPayload result gottem', streamPayload);
  
  if (finalResult.runtime != null) streamPayload.executionTimeMs = String(finalResult.runtime);
  if (finalResult.memory != null) streamPayload.memoryUsedKb = String(finalResult.memory);

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  await redisClient.xAdd(`verdict:${submissionId}`, '*', streamPayload);
}

function normalizeTestResults(value: unknown): TestResult[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): TestResult | null => {
      if (!item || typeof item !== 'object') return null;
      const result = item as Partial<TestResult>;
      if (typeof result.index !== 'number') return null;

      return {
        index: result.index,
        verdict: isVerdict(result.verdict) ? result.verdict : Verdict.PENDING,
        runtime: typeof result.runtime === 'number' ? result.runtime : null,
        memory: typeof result.memory === 'number' ? result.memory : null,
      };
    })
    .filter((result): result is TestResult => result !== null);
}

function aggregateTestVerdict(results: TestResult[]): Verdict {
  return results.find((result) => result.verdict !== Verdict.ACCEPTED)?.verdict ?? Verdict.ACCEPTED;
}

function sumRuntime(results: TestResult[]): number | null {
  const runtimes = results
    .map((result) => result.runtime)
    .filter((runtime): runtime is number => runtime !== null);

  return runtimes.length > 0 ? runtimes.reduce((total, runtime) => total + runtime, 0) : null;
}

function maxMemory(results: TestResult[]): number | null {
  const memories = results
    .map((result) => result.memory)
    .filter((memory): memory is number => memory !== null);

  return memories.length > 0 ? Math.max(...memories) : null;
}

function isVerdict(value: unknown): value is Verdict {
  return typeof value === 'string' && Object.values(Verdict).includes(value as Verdict);
}

function mapJudge0Status(statusId: number): Verdict {
  switch (statusId) {
    case 3:
      return Verdict.ACCEPTED;
    case 4:
      return Verdict.WRONG_ANSWER;
    case 5:
      return Verdict.TIME_LIMIT_EXCEEDED;
    case 6:
      return Verdict.COMPILATION_ERROR;
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
    case 14:
      return Verdict.RUNTIME_ERROR;
    default:
      return Verdict.SYSTEM_ERROR;
  }
}
