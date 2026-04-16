# @mcv/voice-sdk — Migration notes

## 0.1.0 → 0.2.0

**Non-breaking.** Every v0.1.0 export is preserved; v0.2.0 layers new modules on top.

### New surface

- `VoiceRouter` — orchestrator that composes `FallbackChain` around provider `connect()` calls. Consumes `VentureVoiceConfig` (primary + fallback + features) from `@mcv/ventures-sdk`.
- `FallbackChain` — declarative provider fallback with per-candidate timeout.
- `ProviderContract` — canonical interface every provider adapter implements. Zero hardcoded provider names in the router — adding a new provider is `registerProvider(MyProvider)`.
- Six built-in adapters: `ElevenLabsProvider`, `GeminiLiveProvider`, `DeepgramProvider`, `VapiProvider`, `OpenAIRealtimeProvider`, `AzureProvider`. All dynamic-import their underlying SDK so the package stays dependency-free until a host app opts in.
- `VoiceSession` — state machine over a `ProviderConnection` (or a pair of connections for composite STT+TTS stacks). States: `idle → connecting → listening → thinking → speaking → closed`.
- `personaProfileToParams()` — translates `agent_persona.voice_profile` JSONB (`{tone, pace, formality, hedges, humor, signature_phrases}`) into provider-specific params.
- `InMemoryQuotaTracker` + `QuotaTracker` interface — per-venture monthly spend cap with 80% alert, 100% hard stop.

### Subpath exports

New package.json `exports` entries:
- `@mcv/voice-sdk/router/voice-router`
- `@mcv/voice-sdk/router/fallback-chain`
- `@mcv/voice-sdk/providers`
- `@mcv/voice-sdk/providers/registry`
- `@mcv/voice-sdk/providers/elevenlabs` (+ gemini-live, deepgram, vapi, openai-realtime, azure)
- `@mcv/voice-sdk/session`
- `@mcv/voice-sdk/integrations/agent-persona`

The flat root export still re-exports everything.

### Optional peer dependencies

Providers dynamic-import these SDKs. Installing them is optional per-venture:

- `@elevenlabs/elevenlabs-js` — ElevenLabs TTS streaming
- `@google/genai` — Gemini Live (already installed in mcv-one-desktop)
- `@deepgram/sdk` — Deepgram STT
- `@vapi-ai/server-sdk` — Vapi phone
- `openai/realtime/ws` + `openai/realtime/websocket` — OpenAI Realtime

When a provider's SDK is missing, the adapter degrades to REST where possible; if REST isn't available (e.g. Gemini Live, OpenAI Realtime which are WS-only), `connect()` throws and the router's fallback chain takes over.

### Host-app migration

Old pattern:
```ts
import { pickStack } from '@mcv/voice-sdk';
const { stack, config } = pickStack({ useCase: 'agent-conversation' });
// Manually wire D+E or Gemini Live…
```

New pattern:
```ts
import { VoiceRouter, registerBuiltinProviders } from '@mcv/voice-sdk';
await registerBuiltinProviders();
const router = new VoiceRouter();
const { connection, provider, degraded } = await router.connect({
  venture: { ventureId: 'mcv', primary: 'gemini-live', fallback: ['elevenlabs', 'deepgram'] },
  providerConfigs: {
    'gemini-live': { apiKey: process.env.GOOGLE_AI_KEY },
    'elevenlabs':  { apiKey: process.env.ELEVENLABS_API_KEY },
    'deepgram':    { apiKey: process.env.DEEPGRAM_API_KEY },
  },
  agentPersona: agentPersona.voice_profile,   // from supabase
});
```

`pickStack()` remains available for legacy callers. New code should use `VoiceRouter`.
