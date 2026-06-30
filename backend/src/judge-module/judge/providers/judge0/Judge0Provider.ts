import { IJudgeProvider } from '../../ports/IJudgeProvider';
import { SubmissionRequest, JudgeResult, SupportedLanguage, VerdictStatus } from '../../types';
import { JudgeSubmissionError } from '../../errors';

export interface Judge0ProviderOptions {
  apiUrl: string; // e.g. self-hosted judge0 instance or RapidAPI endpoint
  apiKey?: string;
  httpClient: Judge0HttpClient;
}

export interface Judge0HttpClient {
  post(url: string, body: unknown, headers?: Record<string, string>): Promise<{ status: number; json: any }>;
  get(url: string, headers?: Record<string, string>): Promise<{ status: number; json: any }>;
}

// judge0 language ids — https://ce.judge0.com/languages
const LANGUAGE_ID_MAP: Record<SupportedLanguage, number> = {
  [SupportedLanguage.CPP17]: 54,
  [SupportedLanguage.CPP20]: 105,
  [SupportedLanguage.JAVA]: 62,
  [SupportedLanguage.PYTHON3]: 71,
  [SupportedLanguage.JAVASCRIPT]: 63,
  [SupportedLanguage.GO]: 60,
  [SupportedLanguage.RUST]: 73,
  [SupportedLanguage.KOTLIN]: 78,
};

// judge0 status.id -> our VerdictStatus
const STATUS_MAP: Record<number, VerdictStatus> = {
  1: VerdictStatus.IN_QUEUE,
  2: VerdictStatus.RUNNING,
  3: VerdictStatus.ACCEPTED,
  4: VerdictStatus.WRONG_ANSWER,
  5: VerdictStatus.TIME_LIMIT_EXCEEDED,
  6: VerdictStatus.COMPILATION_ERROR,
  7: VerdictStatus.RUNTIME_ERROR, // SIGSEGV and friends collapse to RUNTIME_ERROR here
  13: VerdictStatus.INTERNAL_ERROR,
};

/**
 * Skeleton judge0 adapter — included to demonstrate that the
 * IJudgeProvider port genuinely generalizes across a scraper (vjudge)
 * and a real REST-based judge (judge0). This is what "swapping the
 * judge later" actually looks like: a new class, same interface.
 *
 * Not wired into the registry by default — register it yourself in
 * your composition root when you're ready to switch.
 */
export class Judge0Provider implements IJudgeProvider {
  readonly name = 'judge0';

  constructor(private readonly options: Judge0ProviderOptions) {}

  supportsLanguage(language: SupportedLanguage): boolean {
    return language in LANGUAGE_ID_MAP;
  }

  async submit(request: SubmissionRequest): Promise<string> {
    try {
      const res = await this.options.httpClient.post(
        `${this.options.apiUrl}/submissions?base64_encoded=false&wait=false`,
        {
          source_code: request.sourceCode,
          language_id: LANGUAGE_ID_MAP[request.language],
          cpu_time_limit: request.timeLimitMs ? request.timeLimitMs / 1000 : undefined,
          memory_limit: request.memoryLimitKb,
        },
        this.authHeaders(),
      );
      return res.json.token;
    } catch (err) {
      throw new JudgeSubmissionError(`judge0 submit failed for ${request.submissionId}`, this.name, err);
    }
  }

  async getVerdict(trackingHandle: string): Promise<JudgeResult> {
    const res = await this.options.httpClient.get(
      `${this.options.apiUrl}/submissions/${trackingHandle}?base64_encoded=false`,
      this.authHeaders(),
    );
    const data = res.json;

    return {
      submissionId: trackingHandle,
      verdict: STATUS_MAP[data.status?.id] ?? VerdictStatus.SYSTEM_ERROR,
      executionTimeMs: data.time ? Math.round(parseFloat(data.time) * 1000) : undefined,
      memoryUsedKb: data.memory ?? undefined,
      compileError: data.compile_output ?? undefined,
      runtimeError: data.stderr ?? undefined,
      judgedAt: new Date(),
      providerName: this.name,
    };
  }

  private authHeaders(): Record<string, string> {
    return this.options.apiKey ? { 'X-RapidAPI-Key': this.options.apiKey } : {};
  }
}
