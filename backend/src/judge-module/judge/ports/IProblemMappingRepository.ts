import { ProblemMapping } from '../types';

/**
 * Port for resolving your internal problemId into whatever identifier
 * a given external judge expects (e.g. vjudge's "CF1879A" vs a future
 * judge0 test-data bundle id). Backed by DB, cache, or a config file —
 * JudgeService and the providers don't care which.
 */
export interface IProblemMappingRepository {
  getMapping(internalProblemId: string, providerName: string): Promise<ProblemMapping | null>;
}
