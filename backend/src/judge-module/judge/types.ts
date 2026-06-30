export enum VerdictStatus {
  PENDING = 'PENDING',
  IN_QUEUE = 'IN_QUEUE',
  COMPILING = 'COMPILING',
  RUNNING = 'RUNNING',
  ACCEPTED = 'ACCEPTED',
  WRONG_ANSWER = 'WRONG_ANSWER',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
  PRESENTATION_ERROR = 'PRESENTATION_ERROR',
  OUTPUT_LIMIT_EXCEEDED = 'OUTPUT_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export enum SupportedLanguage {
  CPP17 = 'CPP17',
  CPP20 = 'CPP20',
  JAVA = 'JAVA',
  PYTHON3 = 'PYTHON3',
  JAVASCRIPT = 'JAVASCRIPT',
  GO = 'GO',
  RUST = 'RUST',
  KOTLIN = 'KOTLIN',
}

/** Statuses that mean "judging is done, nothing more will change" */
export const TERMINAL_STATUSES: ReadonlySet<VerdictStatus> = new Set([
  VerdictStatus.ACCEPTED,
  VerdictStatus.WRONG_ANSWER,
  VerdictStatus.TIME_LIMIT_EXCEEDED,
  VerdictStatus.MEMORY_LIMIT_EXCEEDED,
  VerdictStatus.RUNTIME_ERROR,
  VerdictStatus.COMPILATION_ERROR,
  VerdictStatus.PRESENTATION_ERROR,
  VerdictStatus.OUTPUT_LIMIT_EXCEEDED,
  VerdictStatus.INTERNAL_ERROR,
  VerdictStatus.SYSTEM_ERROR,
]);

export interface SubmissionRequest {
  submissionId: string;
  problemId: string;
  language: SupportedLanguage;
  sourceCode: string;
  timeLimitMs?: number;
  memoryLimitKb?: number;
  /** e.g. contest/live-room id — useful for logging/grouping, not used by judging logic */
  contextId?: string;
}

export interface TestCaseResult {
  index: number;
  status: VerdictStatus;
  executionTimeMs?: number;
  memoryUsedKb?: number;
}

export interface JudgeResult {
  submissionId: string;
  verdict: VerdictStatus;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  testCasesPassed?: number;
  totalTestCases?: number;
  testCases?: TestCaseResult[];
  compileError?: string;
  runtimeError?: string;
  judgedAt: Date;
  /** which provider produced this result — handy for debugging/logging */
  providerName: string;
}

export interface ProblemMapping {
  internalProblemId: string;
  providerName: string;
  /** e.g. "CF1879A", "UVA10618" — whatever the external judge calls it */
  externalProblemCode: string;
  externalLanguageMap?: Partial<Record<SupportedLanguage, string>>;
}
