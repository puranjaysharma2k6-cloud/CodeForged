import { IJudgeProvider } from '../ports/IJudgeProvider.js';
import { ProviderNotRegisteredError } from '../errors.js';

/**
 * Registry/factory for judge providers. Lets you select the active
 * provider at runtime via config/env (JUDGE_PROVIDER=vjudge|judge0),
 * without JudgeService or any caller ever importing a concrete
 * provider class.
 *
 * To add a new judge backend later:
 *   1. Implement IJudgeProvider in a new class (e.g. Judge0Provider).
 *   2. registry.register(new Judge0Provider(...)).
 *   3. Flip JUDGE_PROVIDER (or your config) to "judge0".
 * Nothing else in the codebase needs to change.
 */
export class JudgeProviderRegistry {
  private readonly providers = new Map<string, IJudgeProvider>();

  register(provider: IJudgeProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): IJudgeProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new ProviderNotRegisteredError(name);
    }
    return provider;
  }

  list(): string[] {
    return [...this.providers.keys()];
  }
}
