# `src/lib/` — AI routing matrix

This README documents which AI/voice/media calls route through the **MCV Core
Triangle** (specifically the Intelligence gateway) and which stay **direct** to
their provider SDKs. The boundary is deliberate.

## Routes through Intelligence

The Intelligence gateway gives us provider-agnostic routing, central cost
tracking (`intelligence_usage` table), failover, and audit observability. Any
LLM completion that benefits from those properties is routed.

| Surface | Handler | Provider param | Notes |
|---|---|---|---|
| Claude chat (streaming + non-streaming) | `api/_handlers/chat.ts` | `provider: 'anthropic'` | Falls back to direct `@anthropic-ai/sdk` if `INTELLIGENCE_URL` unset or call fails. |
| Gemini chat (non-streaming) | `api/_handlers/gemini.ts` | `provider: 'google'` | Falls back to `@google/generative-ai` if Triangle unreachable. |
| Tool-use / kit orchestration | via `api/_handlers/chat.ts` | `provider: 'anthropic'` | Tool schemas pass through; `tool_use` blocks are buffered and emitted as a single SSE event after stream end. |
| RAG retrieval (when `useRag: true`) | `intelligence.retrieve()` | n/a | Cross-corpus search — Intelligence is the only path. |

## Stays direct (does NOT route through Intelligence)

The Triangle does not cover real-time media or voice latency budgets. These
surfaces continue to call provider SDKs directly so we keep sub-200ms voice UX.

| Surface | Provider | Why direct |
|---|---|---|
| Deepgram STT (streaming + batch) | `@deepgram/sdk` | Sub-100ms first-byte budget; gateway hop adds latency. |
| ElevenLabs TTS (streaming) | `elevenlabs` | Same — voice playback is latency-critical. |
| Gemini Live API (bidi audio) | `@google/genai` Live | WebSocket session; not a request/response shape Intelligence supports. |
| Imagen image generation | `@google/genai` | Triangle Intelligence currently scoped to text completions only. |
| Veo video generation | `@google/genai` | Same — media gen not in Intelligence v1. |
| Vapi voice agent | direct API | Outbound voice calls; Vapi owns the realtime loop. |

## NAOS agent runtime

The **NAOS agent runtime stays local** (in this repo / kits package), not on
the Triangle. Phase-3 Intelligence agents (`agentInvoke`) are stateless
single-turn invocations; NAOS is a kit-aware, venture-context-switching,
session-persistent runtime. Migrating loses too much. Revisit if Intelligence
ships streaming agents with session state.

## How to add a new AI surface

1. **Latency-critical or media-gen?** Stay direct. Add a new handler that
   calls the provider SDK; document it in this table.
2. **Standard text completion?** Route through Intelligence. Use
   `createServerIntelligence()` from `src/lib/mcv-core/intelligence.ts` and
   keep a graceful-fallback path to the direct SDK.
3. **Cross-corpus knowledge query?** Use `intelligence.retrieve()` — there is
   no direct equivalent.

## Env vars

See `.env.example`. The relevant block:

```
INTELLIGENCE_URL=                # Intelligence gateway base URL (server-side)
INTERNAL_SERVICE_SECRET=         # S2S header for Triangle internal calls
```

If `INTELLIGENCE_URL` is unset, every routing decision in this table flips
to the "direct" provider SDK automatically. The app always boots.
