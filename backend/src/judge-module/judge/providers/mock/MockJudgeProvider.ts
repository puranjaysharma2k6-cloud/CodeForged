import { IJudgeProvider } from '../../ports/IJudgeProvider.js';
import { JudgeSubmissionError } from '../../errors.js';
import { SubmissionRequest, JudgeResult, SupportedLanguage, VerdictStatus } from '../../types.js';

interface ActiveMockRun {
  submissionId: string;
  step: number;
}

export class MockJudgeProvider implements IJudgeProvider {
  readonly name = 'mock';

  private readonly activeRuns = new Map<string, ActiveMockRun>();

  supportsLanguage(_language: SupportedLanguage): boolean {
    return true;
  }

  async submit(request: SubmissionRequest): Promise<string> {
    const handle = `${request.submissionId}:mock`;
    this.activeRuns.set(handle, {
      submissionId: request.submissionId,
      step: 0,
    });

    return handle;
  }

  async getVerdict(trackingHandle: string): Promise<JudgeResult> {
    const run = this.activeRuns.get(trackingHandle);
    if (!run) {
      throw new JudgeSubmissionError(
        `mock judge has no active run for ${trackingHandle}`,
        this.name,
      );
    }

    run.step += 1;
    const verdict = run.step >= 3 ? VerdictStatus.ACCEPTED : VerdictStatus.RUNNING;

    if (verdict === VerdictStatus.ACCEPTED) {
      this.activeRuns.delete(trackingHandle);
    }

    return {
      submissionId: run.submissionId,
      verdict,
      executionTimeMs: run.step * 25,
      memoryUsedKb: 64 + run.step * 8,
      judgedAt: new Date(),
      providerName: this.name,
    };
  }
}
