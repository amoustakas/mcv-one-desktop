// @mcv/voice-sdk — Provider registry.
//
// The router NEVER imports a provider module directly. Consumers (or the
// SDK's own defaults) register implementations keyed by ProviderName. New
// providers drop in with one registerProvider() call.

import type { ProviderContract, ProviderName } from './ProviderContract';

const registry = new Map<ProviderName, ProviderContract>();

export function registerProvider(provider: ProviderContract): void {
  registry.set(provider.name, provider);
}

export function getProvider(name: ProviderName): ProviderContract | undefined {
  return registry.get(name);
}

export function listProviders(): ReadonlyArray<ProviderContract> {
  return Array.from(registry.values());
}

export function clearProviders(): void {
  registry.clear();
}

/**
 * Register the six built-in provider adapters bundled with the SDK.
 * Host apps call this once at startup (or import `registerBuiltinProviders`
 * from `@mcv/voice-sdk`). Keeps the registry empty by default so tests can
 * inject mocks without side-effects.
 */
export async function registerBuiltinProviders(): Promise<void> {
  const [{ ElevenLabsProvider }, { GeminiLiveProvider }, { DeepgramProvider }, { VapiProvider }, { OpenAIRealtimeProvider }, { AzureProvider }] = await Promise.all([
    import('./ElevenLabsProvider'),
    import('./GeminiLiveProvider'),
    import('./DeepgramProvider'),
    import('./VapiProvider'),
    import('./OpenAIRealtimeProvider'),
    import('./AzureProvider'),
  ]);
  registerProvider(ElevenLabsProvider);
  registerProvider(GeminiLiveProvider);
  registerProvider(DeepgramProvider);
  registerProvider(VapiProvider);
  registerProvider(OpenAIRealtimeProvider);
  registerProvider(AzureProvider);
}
