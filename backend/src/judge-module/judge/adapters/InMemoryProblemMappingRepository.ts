import { IProblemMappingRepository } from '../ports/IProblemMappingRepository';
import { ProblemMapping } from '../types';

/**
 * Simple in-memory implementation for dev/testing. Swap for a
 * DB-backed implementation (Prisma/Mongo/etc) in production by
 * implementing the same IProblemMappingRepository interface — nothing
 * else in the judge module changes.
 */
export class InMemoryProblemMappingRepository implements IProblemMappingRepository {
  private readonly mappings = new Map<string, ProblemMapping>();

  add(mapping: ProblemMapping): void {
    this.mappings.set(this.key(mapping.internalProblemId, mapping.providerName), mapping);
  }

  async getMapping(internalProblemId: string, providerName: string): Promise<ProblemMapping | null> {
    return this.mappings.get(this.key(internalProblemId, providerName)) ?? null;
  }

  private key(internalProblemId: string, providerName: string): string {
    return `${providerName}:${internalProblemId}`;
  }
}
