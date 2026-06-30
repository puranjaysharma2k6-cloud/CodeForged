// Domain
export * from './types.js';
export * from './errors.js';

// Ports (abstractions) — code against these everywhere outside the judge module
export * from './ports/IJudgeProvider.js';
export * from './ports/IVerdictPublisher.js';
export * from './ports/IProblemMappingRepository.js';
export * from './ports/ISubmissionQueue.js';

// Core
export * from './core/JudgeService.js';
export * from './core/JudgeProviderFactory.js';

// Queue implementations
export * from './queue/InMemoryConcurrencyLimitedQueue.js';
export * from './queue/BullMQSubmissionQueue.js';

// Providers (concrete adapters)
export * from './providers/vjudge/VjudgeProvider.js';
export * from './providers/vjudge/VjudgeAccountPool.js';
export * from './providers/vjudge/VjudgeHttpClientImpl.js';
export * from './providers/judge0/Judge0Provider.js';

// Default adapters for dev/testing
export * from './adapters/ConsoleVerdictPublisher.js';
export * from './adapters/InMemoryProblemMappingRepository.js';

export * from './config.js';
