import { IProblemMappingRepository } from '../ports/IProblemMappingRepository.js';
import { ProblemMapping } from '../types.js';
import { prisma } from '../../../db/db.js';

/**
 * Production implementation of IProblemMappingRepository.
 * Reads vjudgeId from the Problem table in Postgres.
 *
 * vjudgeId format: "<contestId>/<problemLetter>"  e.g. "563012/A"
 * Set this field when creating a problem via the admin panel.
 */
export class PrismaProblemMappingRepository implements IProblemMappingRepository {
  async getMapping(
    internalProblemId: string,
    providerName: string,
  ): Promise<ProblemMapping | null> {
    if (providerName !== 'vjudge') return null;

    const problem = await prisma.problem.findUnique({
      where: { id: internalProblemId },
      select: { vjudgeId: true },
    });

    if (!problem?.vjudgeId) return null;

    return {
      internalProblemId,
      providerName: 'vjudge',
      externalProblemCode: problem.vjudgeId, // "563012/A"
    };
  }
}
