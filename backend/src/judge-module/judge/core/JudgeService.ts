import { IJudgeProvider } from '../ports/IJudgeProvider.js';
import { IVerdictPublisher } from '../ports/IVerdictPublisher.js';
import { IProblemMappingRepository } from '../ports/IProblemMappingRepository.js';
import { SubmissionRequest, JudgeResult, VerdictStatus, TERMINAL_STATUSES } from '../types.js';
import { UnsupportedLanguageError, JudgeSubmissionError, JudgePollingTimeoutError } from '../errors.js';

export interface JudgeServiceConfig {
  pollIntervalMs: number;
  maxPollAttempts: number;
  /** optional exponential backoff so we don't hammer a scraper-based judge */
  pollBackoffMultiplier?: number;
  maxPollIntervalMs?: number;
}

const DEFAULT_CONFIG: JudgeServiceConfig = {
  pollIntervalMs: 1500,
  maxPollAttempts: 40,
  pollBackoffMultiplier: 1.15,
  maxPollIntervalMs: 8000,
};

/**
 * Orchestrates a single submission's lifecycle:
 *   validate language -> resolve problem mapping (inside provider) ->
 *   submit -> poll until terminal -> publish.
 *
 * This class is the "high-level policy" in DIP terms: it depends only
 * on IJudgeProvider / IVerdictPublisher / IProblemMappingRepository,
 * all injected via the constructor. It never imports a concrete
 * provider. That means:
 *   - Today: new JudgeService(new VjudgeProvider(...), ...)
 *   - Later: new JudgeService(new Judge0Provider(...), ...)
 * with zero changes to this file or to whatever calls JudgeService.
 */
export class JudgeService {
  constructor(
    private readonly provider: IJudgeProvider,
    private readonly publisher: IVerdictPublisher,
    private readonly problemMappingRepo: IProblemMappingRepository,
    private readonly config: JudgeServiceConfig = DEFAULT_CONFIG,
  ) {}

  /**
   * Drives a submission to completion and returns the final verdict.
   * Also publishes IN_QUEUE immediately and intermediate states (e.g.
   * COMPILING/RUNNING) as they're observed, so your websocket layer
   * can show live progress if the provider reports them.
   */
  async judge(request: SubmissionRequest): Promise<JudgeResult> {
    if (!this.provider.supportsLanguage(request.language)) {
      throw new UnsupportedLanguageError(request.language, this.provider.name);
    }

    await this.publisher.publish({
      submissionId: request.submissionId,
      verdict: VerdictStatus.IN_QUEUE,
      judgedAt: new Date(),
      providerName: this.provider.name,
    });

    let trackingHandle: string;
    try {
      trackingHandle = await this.provider.submit(request);
    } catch (err) {
      const failure: JudgeResult = {
        submissionId: request.submissionId,
        verdict: VerdictStatus.SYSTEM_ERROR,
        judgedAt: new Date(),
        providerName: this.provider.name,
      };
      await this.publisher.publish(failure);
      throw new JudgeSubmissionError(
        `Failed to submit "${request.submissionId}" to ${this.provider.name}`,
        this.provider.name,
        err,
      );
    }

    const result = await this.pollUntilTerminal(trackingHandle, request.submissionId);
    await this.publisher.publish(result);
    return result;
  }

  private async pollUntilTerminal(trackingHandle: string, submissionId: string): Promise<JudgeResult> {
    let interval = this.config.pollIntervalMs;
    const backoff = this.config.pollBackoffMultiplier ?? 1;
    const cap = this.config.maxPollIntervalMs ?? interval;

    for (let attempt = 1; attempt <= this.config.maxPollAttempts; attempt++) {
      const result = await this.provider.getVerdict(trackingHandle);

      if (TERMINAL_STATUSES.has(result.verdict)) {
        return result;
      }

      // Surface intermediate progress (COMPILING/RUNNING/etc) to the client.
      await this.publisher.publish(result);

      await sleep(interval);
      interval = Math.min(interval * backoff, cap);
    }

    throw new JudgePollingTimeoutError(submissionId, this.provider.name, this.config.maxPollAttempts);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
