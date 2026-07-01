import { ISubmissionQueue, SubmissionHandler } from '../ports/ISubmissionQueue.js';
import { SubmissionRequest } from '../types.js';

export interface InMemoryQueueOptions {
  /** max submissions in flight at once — this is your vjudge rate-limit knob */
  concurrency: number;
  /** ms to wait before retrying a job that throws */
  retryDelayMs?: number;
  maxRetries?: number;
}

/**
 * Single-process, in-memory FIFO queue with a concurrency cap. Good
 * enough for one backend instance / early-stage scale.
 *
 * Swap for BullMQSubmissionQueue (or anything else implementing
 * ISubmissionQueue) when you need multi-instance support, persistence
 * across restarts, or crash recovery — nothing outside this file
 * changes, since both implement the same port.
 */
export class InMemoryConcurrencyLimitedQueue implements ISubmissionQueue {
  private queue: { request: SubmissionRequest; attempt: number }[] = [];
  private inFlight = 0;
  private handler: SubmissionHandler | null = null;
  private running = false;

  constructor(private readonly options: InMemoryQueueOptions) {}

  async enqueue(request: SubmissionRequest): Promise<void> {
    this.queue.push({ request, attempt: 0 });
    this.pump();
  }

  onSubmission(handler: SubmissionHandler): void {
    this.handler = handler;
  }

  start(): void {
    this.running = true;
    this.pump();
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  private pump(): void {
    if (!this.running || !this.handler) return;

    while (this.inFlight < this.options.concurrency && this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.inFlight++;
      void this.runJob(job);
    }
  }

  private async runJob(job: { request: SubmissionRequest; attempt: number }): Promise<void> {
    try {
      await this.handler!(job.request);
    } catch (err) {
      const maxRetries = this.options.maxRetries ?? 0;
      if (job.attempt < maxRetries) {
        const delay = this.options.retryDelayMs ?? 1000;
        setTimeout(() => {
          this.queue.unshift({ request: job.request, attempt: job.attempt + 1 });
          this.pump();
        }, delay);
      } else {
        console.error(`[submission-queue] job for "${job.request.submissionId}" failed permanently`, err);
      }
    } finally {
      this.inFlight--;
      this.pump();
    }
  }
}
