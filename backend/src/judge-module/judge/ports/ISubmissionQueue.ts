import { SubmissionRequest } from '../types';

export type SubmissionHandler = (request: SubmissionRequest) => Promise<void>;

/**
 * Port for queuing submissions before they reach JudgeService.
 *
 * Exists so the ingestion layer (HTTP routes, websocket intake, etc)
 * never has to think about backpressure or concurrency — it just
 * calls enqueue(). Whatever's actually pulling jobs off the queue (an
 * in-memory limiter today, BullMQ/Redis later) is swappable without
 * touching route handlers or JudgeService — same DIP pattern as
 * IJudgeProvider.
 *
 * This matters specifically for vjudge: it's a scraper hitting a
 * third-party site, and submitting too fast risks rate-limiting or
 * an IP ban. The queue is where you enforce "only N submissions in
 * flight to vjudge at once," independent of how many submissions
 * arrive concurrently from a live contest.
 */
export interface ISubmissionQueue {
  enqueue(request: SubmissionRequest): Promise<void>;

  /** Registers the function that processes each dequeued submission. Call once at startup. */
  onSubmission(handler: SubmissionHandler): void;

  start(): void;
  stop(): Promise<void>;
}
