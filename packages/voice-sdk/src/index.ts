// @mcv/voice-sdk — public surface.
//
// v0.2.0: multi-provider enterprise-lego architecture. Every venture picks
// a `primary` + ordered `fallback` list; every agent's voice_profile JSONB
// maps to provider-specific params at session creation. Router, session
// machine, and fallback chain are all provider-agnostic — zero hardcoded
// provider names in the core paths.

export * from './router';

// Provider contract + registry
export type {
  ProviderContract,
  ProviderConnection,
  ProviderConfig,
  ProviderCapability,
  ProviderName,
  ProviderAudioChunk,
  ProviderTranscript,
  ProviderToolCall,
  ProviderEvent,
  VoiceSessionParams,
} from './providers/ProviderContract';
export { TinyEmitter } from './providers/ProviderContract';
export {
  registerProvider,
  getProvider,
  listProviders,
  clearProviders,
  registerBuiltinProviders,
} from './providers/registry';

// Provider adapters (named exports so host apps can inject selectively).
export { ElevenLabsProvider } from './providers/ElevenLabsProvider';
export { GeminiLiveProvider } from './providers/GeminiLiveProvider';
export { DeepgramProvider } from './providers/DeepgramProvider';
export { VapiProvider } from './providers/VapiProvider';
export { OpenAIRealtimeProvider } from './providers/OpenAIRealtimeProvider';
export { AzureProvider } from './providers/AzureProvider';

// Router
export {
  VoiceRouter,
  InMemoryQuotaTracker,
  type VentureVoiceConfig,
  type RouteRequest,
  type RouteResult,
  type UsageEvent,
  type QuotaTracker,
} from './router/VoiceRouter';
export {
  FallbackChain,
  type FallbackCandidate,
  type FallbackOptions,
  type FallbackAttemptResult,
  type FallbackFailure,
} from './router/FallbackChain';

// Session
export {
  VoiceSession,
  type SessionState,
  type VoiceSessionOptions,
} from './session/VoiceSession';

// Integrations
export {
  personaProfileToParams,
  personaProfileToBaseParams,
  type AgentVoiceProfile,
} from './integrations/agent-persona-bridge';

export const MCV_VOICE_SDK_VERSION = '0.2.0' as const;
