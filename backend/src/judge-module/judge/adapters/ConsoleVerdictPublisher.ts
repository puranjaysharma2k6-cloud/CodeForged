import { IVerdictPublisher } from '../ports/IVerdictPublisher';
import { JudgeResult } from '../types';

/**
 * Trivial default publisher — logs to console. Useful for local dev
 * and tests before your real pub/sub + websocket publisher exists.
 *
 * When ready, implement IVerdictPublisher with your pubsub code, e.g.:
 *
 *   class RedisPubSubVerdictPublisher implements IVerdictPublisher {
 *     async publish(result: JudgeResult) {
 *       await redis.publish(`submission:${result.submissionId}`, JSON.stringify(result));
 *     }
 *   }
 *
 * and pass that into JudgeService instead of this one. No other file
 * needs to change.
 */
export class ConsoleVerdictPublisher implements IVerdictPublisher {
  async publish(result: JudgeResult): Promise<void> {
    console.log(`[verdict] ${result.submissionId} -> ${result.verdict} (via ${result.providerName})`);
  }
}
