import { JudgeResult } from '../types';

/**
 * Port for publishing a verdict (final or intermediate, e.g. RUNNING)
 * outward to the rest of your system.
 *
 * You're building pub/sub + websockets yourself — implement this
 * interface with that code (e.g. `RedisPubSubVerdictPublisher`) and
 * inject it into JudgeService. JudgeService never knows or cares how
 * delivery actually happens.
 */
export interface IVerdictPublisher {
  publish(result: JudgeResult): Promise<void>;
}
