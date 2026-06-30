import { SubmissionRequest, JudgeResult, SupportedLanguage } from '../types';

/**
 * Port (abstraction) that every judge backend must implement.
 *
 * JudgeService depends ONLY on this interface — never on a concrete
 * provider class. That's the whole DIP move: swapping vjudge for
 * judge0 (or anything else) later means writing one new class that
 * implements this interface and registering it. JudgeService, your
 * controllers, your routes — none of them change.
 */
export interface IJudgeProvider {
  /** Unique, stable identifier used for registry lookup & logging, e.g. "vjudge" */
  readonly name: string;

  /** Whether this provider can execute code in the given language */
  supportsLanguage(language: SupportedLanguage): boolean;

  /**
   * Submits code for judging. Returns a provider-specific tracking
   * handle (vjudge run id, judge0 token, etc). Must NOT block until
   * judged — judging is inherently async for every backend.
   */
  submit(request: SubmissionRequest): Promise<string>;

  /**
   * Fetches the current judging status/result for a tracking handle.
   * Called repeatedly by JudgeService until the result is terminal
   * (see TERMINAL_STATUSES in types.ts).
   */
  getVerdict(trackingHandle: string): Promise<JudgeResult>;
}
