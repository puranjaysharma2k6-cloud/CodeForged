export interface VjudgeAccountCredentials {
  username: string;
  password: string;
}

export type VjudgeAccountState = 'idle' | 'busy' | 'unhealthy';

export interface VjudgeAccount {
  username: string;
  password: string;
  sessionCookie: string | null;
  state: VjudgeAccountState;
  consecutiveFailures: number;
  quarantinedUntil: number | null; // epoch ms
  lastUsedAt: number | null;
}

export interface VjudgeAccountPoolOptions {
  /** failures in a row before an account gets pulled out of rotation */
  maxConsecutiveFailures?: number;
  /** how long a quarantined account sits out before being eligible again */
  quarantineMs?: number;
  /** how long acquire() will wait/poll for a free account before giving up */
  acquireTimeoutMs?: number;
  acquirePollIntervalMs?: number;
}

const DEFAULTS: Required<VjudgeAccountPoolOptions> = {
  maxConsecutiveFailures: 3,
  quarantineMs: 5 * 60 * 1000,
  acquireTimeoutMs: 30_000,
  acquirePollIntervalMs: 250,
};

/**
 * Manages a pool of vjudge bot accounts.
 *
 * vjudge — and the origin judge behind it (Codeforces, UVA, etc) —
 * generally allows one active submission per account at a time. That
 * makes "how many submissions can be judged concurrently" really mean
 * "how many healthy, free accounts do we have." This class is the
 * thing that makes that constraint explicit and safe: it hands out
 * accounts one at a time, and pulls an account out of rotation
 * (instead of hammering it) once it starts failing repeatedly —
 * which is usually what a rate-limit or soft-ban looks like.
 *
 * This is an internal implementation detail of VjudgeProvider, not a
 * port. JudgeService and everything above it never sees this class.
 */
export class VjudgeAccountPool {
  private readonly accounts: VjudgeAccount[];
  private readonly options: Required<VjudgeAccountPoolOptions>;

  constructor(credentials: VjudgeAccountCredentials[], options: VjudgeAccountPoolOptions = {}) {
    if (credentials.length === 0) {
      throw new Error('VjudgeAccountPool requires at least one account');
    }
    this.options = { ...DEFAULTS, ...options };
    this.accounts = credentials.map((c) => ({
      username: c.username,
      password: c.password,
      sessionCookie: null,
      state: 'idle' as const,
      consecutiveFailures: 0,
      quarantinedUntil: null,
      lastUsedAt: null,
    }));
  }

  /** Accounts currently free and healthy — your real-time judging capacity */
  availableCount(): number {
    this.releaseExpiredQuarantines();
    return this.accounts.filter((a) => a.state === 'idle').length;
  }

  size(): number {
    return this.accounts.length;
  }

  /**
   * Claims a free, healthy account, blocking (polling) until one is
   * available or acquireTimeoutMs elapses. Caller is responsible for
   * eventually calling releaseHealthy() or releaseUnhealthy() on it —
   * wrap usage in try/catch and release in every branch.
   */
  async acquire(): Promise<VjudgeAccount> {
    const deadline = Date.now() + this.options.acquireTimeoutMs;

    while (Date.now() < deadline) {
      this.releaseExpiredQuarantines();

      const account = this.accounts.find((a) => a.state === 'idle');
      if (account) {
        account.state = 'busy';
        account.lastUsedAt = Date.now();
        return account;
      }

      await sleep(this.options.acquirePollIntervalMs);
    }

    throw new Error(
      `VjudgeAccountPool: no account available within ${this.options.acquireTimeoutMs}ms ` +
        `(${this.size()} total, ${this.availableCount()} usable). Either add more accounts ` +
        `or reduce ISubmissionQueue concurrency to match pool size.`,
    );
  }

  /** Call once the account's submission is fully judged successfully (or simply errored for unrelated reasons). */
  releaseHealthy(account: VjudgeAccount): void {
    account.consecutiveFailures = 0;
    account.state = 'idle';
  }

  /**
   * Call when a failure is plausibly the account's fault — login
   * failure, an error response from vjudge, a suspected rate-limit.
   * Quarantines the account once it crosses maxConsecutiveFailures
   * instead of continuing to hammer something that's likely flagged.
   */
  releaseUnhealthy(account: VjudgeAccount): void {
    account.consecutiveFailures += 1;

    if (account.consecutiveFailures >= this.options.maxConsecutiveFailures) {
      account.state = 'unhealthy';
      account.quarantinedUntil = Date.now() + this.options.quarantineMs;
      account.sessionCookie = null; // force a fresh login once it's back in rotation
      console.warn(
        `[vjudge-pool] quarantining "${account.username}" for ${this.options.quarantineMs}ms ` +
          `after ${account.consecutiveFailures} consecutive failures`,
      );
    } else {
      account.state = 'idle';
    }
  }

  private releaseExpiredQuarantines(): void {
    const now = Date.now();
    for (const account of this.accounts) {
      if (account.state === 'unhealthy' && account.quarantinedUntil !== null && now >= account.quarantinedUntil) {
        account.state = 'idle';
        account.quarantinedUntil = null;
        account.consecutiveFailures = 0;
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
