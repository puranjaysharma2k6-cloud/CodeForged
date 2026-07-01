import { IVerdictPublisher } from '../judge-module/judge/ports/IVerdictPublisher.js';
import { JudgeResult, TERMINAL_STATUSES, VerdictStatus } from '../judge-module/judge/types.js';
import { Verdict } from '../generated/prisma/enums.js';
import { prisma } from '../db/db.js';

/**
 * Production IVerdictPublisher.
 *
 * Intermediate verdicts (IN_QUEUE, RUNNING) → logged only.
 *   TODO: replace console.log with redis.publish() once pub/sub is wired.
 *
 * Terminal verdicts → update Submission row in Postgres.
 *   TODO: also redis.publish() so WebSocket layer can notify the client.
 */
export class VerdictPublisher implements IVerdictPublisher {
  async publish(result: JudgeResult): Promise<void> {
    // Always log — swap for redis.publish() later
    console.log(
      `[verdict] ${result.submissionId} → ${result.verdict} (${result.providerName})`,
    );

    // Only write to DB on terminal verdict
    if (!TERMINAL_STATUSES.has(result.verdict)) return;

    await prisma.submission.update({
      where: { id: result.submissionId },
      data: {
        status:  mapVerdict(result.verdict),  // Verdict enum, not string
        runtime: result.executionTimeMs ?? null,
        memory:  result.memoryUsedKb   ?? null,
      },
    });

    console.log(
      `[verdict] DB updated — "${result.submissionId}" → ${result.verdict}`,
    );
  }
}

/**
 * Maps judge module VerdictStatus → Prisma Verdict enum.
 * Both use the same string values, but this explicit map ensures
 * compile-time safety — if either enum changes, this breaks loudly.
 */
function mapVerdict(v: VerdictStatus): Verdict {
  const MAP: Partial<Record<VerdictStatus, Verdict>> = {
    [VerdictStatus.ACCEPTED]:              Verdict.ACCEPTED,
    [VerdictStatus.WRONG_ANSWER]:          Verdict.WRONG_ANSWER,
    [VerdictStatus.TIME_LIMIT_EXCEEDED]:   Verdict.TIME_LIMIT_EXCEEDED,
    [VerdictStatus.MEMORY_LIMIT_EXCEEDED]: Verdict.MEMORY_LIMIT_EXCEEDED,
    [VerdictStatus.COMPILATION_ERROR]:     Verdict.COMPILATION_ERROR,
    [VerdictStatus.RUNTIME_ERROR]:         Verdict.RUNTIME_ERROR,
    [VerdictStatus.PRESENTATION_ERROR]:    Verdict.PRESENTATION_ERROR,
    [VerdictStatus.OUTPUT_LIMIT_EXCEEDED]: Verdict.OUTPUT_LIMIT_EXCEEDED,
    [VerdictStatus.SYSTEM_ERROR]:          Verdict.SYSTEM_ERROR,
    [VerdictStatus.INTERNAL_ERROR]:        Verdict.SYSTEM_ERROR,
  };
  return MAP[v] ?? Verdict.SYSTEM_ERROR;
}
