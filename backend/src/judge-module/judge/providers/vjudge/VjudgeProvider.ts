import { IJudgeProvider } from '../../ports/IJudgeProvider.js';
import { IProblemMappingRepository } from '../../ports/IProblemMappingRepository.js';
import {
  SubmissionRequest,
  JudgeResult,
  SupportedLanguage,
  VerdictStatus,
  TERMINAL_STATUSES,
} from '../../types.js';
import { ProblemMappingNotFoundError, JudgeSubmissionError } from '../../errors.js';
import {
  VjudgeAccountPool,
  VjudgeAccount,
  VjudgeAccountCredentials,
  VjudgeAccountPoolOptions,
} from './VjudgeAccountPool.js';

// ---------------------------------------------------------------------------
// Public options / interfaces
// ---------------------------------------------------------------------------

export interface VjudgeProviderOptions {
  baseUrl?: string;
  /** One or more vjudge bot accounts — concurrency is bounded by how many you give it */
  accounts: VjudgeAccountCredentials[];
  poolOptions?: VjudgeAccountPoolOptions;
  /**
   * Injected HTTP client so the class stays testable without real network.
   * In production pass the result of createVjudgeHttpClient() from
   * VjudgeHttpClientImpl.ts.  In tests, pass a stub.
   *
   * NOTE: each account must get its OWN client instance so cookie jars
   * stay isolated between accounts.  VjudgeProvider creates one client
   * per account via the factory below.
   */
  httpClientFactory: () => VjudgeHttpClient;
}

/**
 * Minimal HTTP boundary vjudge needs.
 * Backed by axios + tough-cookie in production (see VjudgeHttpClientImpl).
 */
export interface VjudgeHttpClient {
  post(
    url: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<{ status: number; body: string }>;
  get(
    url: string,
    headers?: Record<string, string>,
  ): Promise<{ status: number; body: string }>;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const VJUDGE_BASE = 'https://vjudge.net';

/**
 * Maps our SupportedLanguage enum to the exact string vjudge expects in the
 * submit form body.  Individual problems can override via
 * ProblemMapping.externalLanguageMap.
 */
const LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  [SupportedLanguage.CPP17]: 'GNU G++17',
  [SupportedLanguage.CPP20]: 'GNU G++20',
  [SupportedLanguage.JAVA]: 'Java',
  [SupportedLanguage.PYTHON3]: 'Python3',
  [SupportedLanguage.JAVASCRIPT]: 'Node.js',
  [SupportedLanguage.GO]: 'Go',
  [SupportedLanguage.RUST]: 'Rust',
  [SupportedLanguage.KOTLIN]: 'Kotlin',
};

/**
 * Maps vjudge's human-readable status strings to our VerdictStatus enum.
 * If a status string doesn't appear here it's treated as RUNNING (still
 * in progress) unless processing===false, in which case it falls back to
 * INTERNAL_ERROR.
 */
const STATUS_MAP: Record<string, VerdictStatus> = {
  Accepted: VerdictStatus.ACCEPTED,
  'Wrong Answer': VerdictStatus.WRONG_ANSWER,
  'Time Limit Exceeded': VerdictStatus.TIME_LIMIT_EXCEEDED,
  'Memory Limit Exceeded': VerdictStatus.MEMORY_LIMIT_EXCEEDED,
  'Runtime Error': VerdictStatus.RUNTIME_ERROR,
  'Compilation Error': VerdictStatus.COMPILATION_ERROR,
  'Presentation Error': VerdictStatus.PRESENTATION_ERROR,
  'Output Limit Exceeded': VerdictStatus.OUTPUT_LIMIT_EXCEEDED,
  // vjudge sometimes surfaces these variants too
  'Runtime Error (SIGSEGV)': VerdictStatus.RUNTIME_ERROR,
  'Runtime Error (SIGABRT)': VerdictStatus.RUNTIME_ERROR,
  'Runtime Error (SIGFPE)': VerdictStatus.RUNTIME_ERROR,
  'Runtime Error (SIGBUS)': VerdictStatus.RUNTIME_ERROR,
};

// ---------------------------------------------------------------------------
// Per-run bookkeeping
// ---------------------------------------------------------------------------

interface ActiveRun {
  /** The pool account that submitted this run — stays locked until terminal */
  account: VjudgeAccount;
  /** The per-account HTTP client (keeps the cookie jar for that account) */
  client: VjudgeHttpClient;
  /** Our internal submission UUID — passed back in every JudgeResult */
  submissionId: string;
}

// ---------------------------------------------------------------------------
// VjudgeProvider
// ---------------------------------------------------------------------------

/**
 * Real IJudgeProvider adapter for vjudge.net.
 *
 * Concurrency model:
 *   - One account per in-flight submission (vjudge enforces this upstream).
 *   - The account is acquired before submitting and held until a terminal
 *     verdict is received, then released back to the pool.
 *   - Keep ISubmissionQueue concurrency <= pool size to avoid stacking
 *     jobs inside pool.acquire()'s internal polling loop.
 *
 * externalProblemCode format (stored in ProblemMapping):
 *   "<vjudgeContestId>/<problemLetter>"  e.g. "563012/A"
 *   Obtain this by visiting vjudge.net/problem/<OJ>-<num> and reading
 *   the contest ID + letter from the page's textarea JSON blob.
 */
export class VjudgeProvider implements IJudgeProvider {
  readonly name = 'vjudge';

  private readonly pool: VjudgeAccountPool;
  private readonly activeRuns = new Map<string, ActiveRun>();
  /** One HTTP client per account — cookie jars must not be shared */
  private readonly accountClients = new Map<string, VjudgeHttpClient>();

  constructor(
    private readonly options: VjudgeProviderOptions,
    private readonly problemMappingRepo: IProblemMappingRepository,
  ) {
    this.pool = new VjudgeAccountPool(options.accounts, options.poolOptions);

    // Pre-create one isolated HTTP client per account at construction time
    for (const cred of options.accounts) {
      this.accountClients.set(cred.username, options.httpClientFactory());
    }
  }

  supportsLanguage(language: SupportedLanguage): boolean {
    return language in LANGUAGE_MAP;
  }

  /** Free, healthy accounts right now — wire to a /health endpoint */
  getPoolStatus(): { total: number; available: number } {
    return { total: this.pool.size(), available: this.pool.availableCount() };
  }

  // -------------------------------------------------------------------------
  // submit()
  // -------------------------------------------------------------------------

  async submit(request: SubmissionRequest): Promise<string> {
    const mapping = await this.problemMappingRepo.getMapping(request.problemId, this.name);
    if (!mapping) {
      throw new ProblemMappingNotFoundError(request.problemId, this.name);
    }

    // Parse "contestId/problemNum" from externalProblemCode
    const [contestId, problemNum] = mapping.externalProblemCode.split('/');
    if (!contestId || !problemNum) {
      throw new JudgeSubmissionError(
        `Invalid externalProblemCode "${mapping.externalProblemCode}" — expected "<contestId>/<problemNum>" e.g. "563012/A"`,
        this.name,
      );
    }

    const account = await this.pool.acquire();
    const client = this.accountClients.get(account.username)!;

    try {
      await this.ensureLoggedIn(account, client);

      const language =
        mapping.externalLanguageMap?.[request.language] ?? LANGUAGE_MAP[request.language];

      // vjudge requires source to be base64(encodeURIComponent(code))
      const encodedSource = Buffer.from(
        encodeURIComponent(request.sourceCode),
      ).toString('base64');

      const formBody = new URLSearchParams({
        method: '0',
        language,
        open: '0',
        source: encodedSource,
        captcha: '',
        password: '',
      });

      const res = await client.post(
        `${this.baseUrl()}/contest/submit/${contestId}/${problemNum}`,
        formBody,
        { 'Content-Type': 'application/x-www-form-urlencoded' },
      );

      const data = parseJson(res.body);

      if (!data || data.error) {
        // Captcha or session issue — treat as an account-level failure
        throw new Error(
          `vjudge submit rejected: ${data?.error ?? `HTTP ${res.status}: ${res.body}`}`,
        );
      }

      const runId = String(data.runId);
      if (!runId || runId === 'undefined') {
        throw new Error(`vjudge submit: no runId in response — body: ${res.body}`);
      }

      this.activeRuns.set(runId, { account, client, submissionId: request.submissionId });
      console.log(
        `[vjudge] submitted ${request.submissionId} → runId=${runId} via ${account.username}`,
      );
      return runId;
    } catch (err) {
      // Release unhealthy — login failure, captcha, or bad response
      account.sessionCookie = null; // force re-login next time
      this.pool.releaseUnhealthy(account);
      throw new JudgeSubmissionError(
        `vjudge submit failed for ${request.submissionId}: ${(err as Error).message}`,
        this.name,
        err,
      );
    }
  }

  // -------------------------------------------------------------------------
  // getVerdict()
  // -------------------------------------------------------------------------

  async getVerdict(trackingHandle: string): Promise<JudgeResult> {
    const run = this.activeRuns.get(trackingHandle);
    if (!run) {
      throw new Error(
        `vjudge: no active run for tracking handle "${trackingHandle}" — ` +
          `was it already resolved, or was submit() never called for it?`,
      );
    }

    try {
      const res = await run.client.get(
        `${this.baseUrl()}/solution/data/${trackingHandle}`,
      );

      const data = parseJson(res.body);
      if (!data) {
        throw new Error(`vjudge getVerdict: unparseable response — ${res.body}`);
      }

      // processing===true  → still judging
      // processing===false → terminal
      const stillRunning: boolean = data.processing === true;

      let verdict: VerdictStatus;
      if (stillRunning) {
        verdict = VerdictStatus.RUNNING;
      } else {
        // Map the human-readable status string to our enum
        verdict = STATUS_MAP[data.status as string] ?? VerdictStatus.INTERNAL_ERROR;
      }

      const result: JudgeResult = {
        submissionId: run.submissionId,
        verdict,
        executionTimeMs: typeof data.time === 'number' ? data.time : undefined,
        memoryUsedKb: typeof data.memory === 'number' ? data.memory : undefined,
        compileError:
          verdict === VerdictStatus.COMPILATION_ERROR && data.additionalInfo
            ? stripHtml(data.additionalInfo)
            : undefined,
        runtimeError:
          verdict === VerdictStatus.RUNTIME_ERROR && data.additionalInfo
            ? stripHtml(data.additionalInfo)
            : undefined,
        judgedAt: new Date(),
        providerName: this.name,
      };

      if (TERMINAL_STATUSES.has(verdict)) {
        this.activeRuns.delete(trackingHandle);
        this.pool.releaseHealthy(run.account);
        console.log(
          `[vjudge] ${run.submissionId} → ${verdict} (runId=${trackingHandle})`,
        );
      }

      return result;
    } catch (err) {
      this.activeRuns.delete(trackingHandle);
      this.pool.releaseUnhealthy(run.account);
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // ensureLoggedIn()
  // -------------------------------------------------------------------------

  private async ensureLoggedIn(account: VjudgeAccount, client: VjudgeHttpClient): Promise<void> {
    // Check session validity if we already have a cookie
    if (account.sessionCookie) {
      try {
        const checkRes = await client.post(
          `${this.baseUrl()}/user/checkLogInStatus`,
          new URLSearchParams(),
        );
        const still = parseJson(checkRes.body);
        if (still === true) return; // session still alive
      } catch {
        // fall through to re-login
      }
      account.sessionCookie = null;
    }

    // POST login with form-urlencoded body
    const formBody = new URLSearchParams({
      username: account.username,
      password: account.password,
    });

    const res = await client.post(
      `${this.baseUrl()}/user/login`,
      formBody,
      { 'Content-Type': 'application/x-www-form-urlencoded' },
    );

    const body = res.body.trim();

    if (body !== 'success') {
      throw new Error(
        `vjudge login failed for "${account.username}": ${body}`,
      );
    }

    // The axios cookie jar (inside client) already stored the JSESSIONID
    // automatically from the Set-Cookie response header.
    // We set a non-null sentinel on the account so we know it's logged in.
    account.sessionCookie = 'active'; // actual cookie lives in the jar
    console.log(`[vjudge] logged in as "${account.username}"`);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private baseUrl(): string {
    return this.options.baseUrl ?? VJUDGE_BASE;
  }
}

// ---------------------------------------------------------------------------
// Module-level helpers (not exported — internal only)
// ---------------------------------------------------------------------------

function parseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Very lightweight HTML tag stripper for compiler/runtime error logs */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}
