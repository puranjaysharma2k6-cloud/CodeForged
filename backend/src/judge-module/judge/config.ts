export interface JudgeModuleConfig {
  /** name of the active provider in the registry, e.g. 'vjudge' | 'judge0' */
  activeProvider: string;
}

export function loadJudgeConfigFromEnv(): JudgeModuleConfig {
  return {
    activeProvider: process.env.JUDGE_PROVIDER ?? 'vjudge',
  };
}
