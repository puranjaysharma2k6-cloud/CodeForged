import { ISubmissionQueue, SubmissionHandler } from '../ports/ISubmissionQueue';
import { SubmissionRequest } from '../types';

export interface BullMQSubmissionQueueOptions {
  redisUrl: string;
  queueName?: string;
  concurrency: number;
}

/**
 * Skeleton Redis/BullMQ-backed queue — for when you outgrow a single
 * process (multiple backend instances, need durability so submissions
 * survive a restart/crash). Implements the same ISubmissionQueue port
 * as InMemoryConcurrencyLimitedQueue, so swapping it in at the
 * composition root is a one-line change.
 *
 * Not wired up by default. `npm install bullmq` and fill in the TODOs
 * when you actually need it — no rush, the in-memory queue is fine
 * until you're running more than one backend instance.
 */
export class BullMQSubmissionQueue implements ISubmissionQueue {
  // private queue: Queue;
  // private worker: Worker | null = null;
  private handler: SubmissionHandler | null = null;

  constructor(private readonly options: BullMQSubmissionQueueOptions) {
    // TODO:
    // this.queue = new Queue(options.queueName ?? 'submissions', {
    //   connection: { url: options.redisUrl },
    // });
  }

  async enqueue(request: SubmissionRequest): Promise<void> {
    // TODO:
    // await this.queue.add('judge', request, { jobId: request.submissionId });
    throw new Error('BullMQSubmissionQueue.enqueue() not implemented — install bullmq and fill in the TODOs');
  }

  onSubmission(handler: SubmissionHandler): void {
    this.handler = handler;
  }

  start(): void {
    // TODO:
    // this.worker = new Worker(
    //   this.options.queueName ?? 'submissions',
    //   async (job) => { await this.handler!(job.data as SubmissionRequest); },
    //   { connection: { url: this.options.redisUrl }, concurrency: this.options.concurrency },
    // );
  }

  async stop(): Promise<void> {
    // TODO: await this.worker?.close();
  }
}
