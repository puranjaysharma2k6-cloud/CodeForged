export class JudgeError extends Error {
  constructor(message: string, public readonly providerName?: string) {
    super(message);
    this.name = 'JudgeError';
  }
}

export class UnsupportedLanguageError extends JudgeError {
  constructor(language: string, providerName: string) {
    super(`Language "${language}" is not supported by provider "${providerName}"`, providerName);
    this.name = 'UnsupportedLanguageError';
  }
}

export class ProblemMappingNotFoundError extends JudgeError {
  constructor(problemId: string, providerName: string) {
    super(`No mapping found for problem "${problemId}" on provider "${providerName}"`, providerName);
    this.name = 'ProblemMappingNotFoundError';
  }
}

export class JudgeSubmissionError extends JudgeError {
  constructor(message: string, providerName: string, public readonly cause?: unknown) {
    super(message, providerName);
    this.name = 'JudgeSubmissionError';
  }
}

export class JudgePollingTimeoutError extends JudgeError {
  constructor(submissionId: string, providerName: string, attempts: number) {
    super(`Polling timed out for submission "${submissionId}" after ${attempts} attempts`, providerName);
    this.name = 'JudgePollingTimeoutError';
  }
}

export class ProviderNotRegisteredError extends JudgeError {
  constructor(providerName: string) {
    super(`No judge provider registered under name "${providerName}"`);
    this.name = 'ProviderNotRegisteredError';
  }
}
