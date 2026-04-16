# MCV One Desktop — Voice Surface Inventory

Wave 3 Session 13 inventory: multi-provider `@mcv/voice-sdk` extraction.

## 1. Voice Components

6 components in [src/components/voice/](../../src/components/voice/):

- **AudioOrb3D.tsx** — THREE.js sphere with simplex noise displacement, cyan (input) / purple (output) glow, ambient particle orbit.
- **AudioOrb.tsx** — Full voice turn (listen → transcribe Deepgram → Claude → TTS ElevenLabs → playback). Holds turn history, resolves persona voice via `resolvePersonaVoice()`, calls `/api/deepgram` and `/api/elevenlabs`.
- **VoiceCarousel.tsx** — 31 Google AI Studio voices (Zephyr, Puck, Charon, etc.). Gender / pitch filters, sample playback.
- **ConversationPanel.tsx** — Transcript display, status indicator, volume meters, mic toggle, text input, connect/disconnect.
- **BotBuilder.tsx** — Personality editor: name, system prompt, voice selector (from VOICE_DATA), function-calling toggle, kit allowlist (useAllKits mode).
- **FunctionCallConsole.tsx** — Terminal-style function call viewer. Shows pending → executing → done/error with expandable args/results.

## 2. Voice-Related Kits

Found 5 kits in [packages/kits-sdk/src/builtin/](../../packages/kits-sdk/src/builtin/):

- **deepgram-kit.ts** — STT. Tools: transcribe-url, transcribe-with-intelligence (topics, sentiment, summary), list-models, overview.
- **elevenlabs-kit.ts** — TTS + voice management. Tools: list-voices, tts, generate-sfx, list-models, search-voices, clone-voice, get/update voice-settings, delete-voice, usage.
- **voice-ai-kit.ts** — AI voice library + casting. Tools: list-voices (with gender/pitch filter), recommend-voice (Gemini-powered), start-conversation.
- **vapi-kit.ts** — Outbound voice calls. Tools: list/create assistants, list/make calls, phone numbers, workflows, knowledge bases, custom tools.
- **gemini-kit.ts** — Includes Gemini Live voice via `gemini-2.0-flash-live-001`.

## 3. Voice Client Modules

Found in [src/lib/](../../src/lib/):

- **voice.ts** — Low-level: `startRecording()`, `stopRecording()`, `speakText()`, `cancelRecording()`. Records webm/opus, calls `/api/voice-stt`, plays TTS from `/api/voice-tts`.
- **voice/router.ts** — Shim over `@mcv/voice-sdk`. Exports `pickStack()`, `VoiceUseCase`, `PersonaVoice`. Resolver queries Supabase `persona_voices` with (agent_codename, venture_id) fallback to SDK.
- **google/voice-constants.ts** — 31 Google AI voices (Zephyr, Puck, Charon, Kore, Fenrir, Leda, Orus, Aoede, Callirrhoe, Autonoe, Enceladus, Iapetus, Umbriel, Algieba, Despina, Erinome, Algenib, Rasalgethi, Laomedeia, Achernar, Alnilam, Schedar, Gacrux, Pulcherrima, Achird, Zubenelgenubi, Vindemiatrix, Sadachbia, Sadaltager, Sulafat). Gender, pitch, characteristics, audio sample URLs.

## 4. API Handlers

Located in [api/_handlers/](../../api/_handlers/):

- **voice-stt.ts** — POST /api/voice-stt. Deepgram STT (audio base64 → nova-2 transcript). Clerk auth.
- **voice-tts.ts** — POST /api/voice-tts. ElevenLabs TTS (text + voiceId → eleven_turbo_v2_5 audio/mpeg stream). Clerk auth.
- **voice-voices.ts** — POST /api/voice-voices. Actions: list (31 voices), recommend (Gemini casting director).

## 5. Voice Router & Stack Selection

**@mcv/voice-sdk** (pure selection logic):
- **VoiceStack**: gemini-live, deepgram-elevenlabs.
- **VoiceUseCase**: agent-conversation, multi-agent-roundtable, agent-tool-use, meeting-transcription, narration-asset, voice-casting, compliance-audio, claude-chat-voice, auto.
- **pickStack(ctx)** routes by use-case, provider, latency, tool-calling, diarization, duration.
- **DEFAULT_PERSONA_VOICES**: 12 agent mappings (aegis→rachel, athena→domi, atlas→josh, daedalus→adam, hermes→antoni, minerva→bella, vulcan→arnold, forge→sam, muse→elli, sentry→callum, scribe→charlotte, helios→dave). All ElevenLabs.

## 6. Persona Voices Table

[supabase/migration-persona-voices.sql](../../supabase/migration-persona-voices.sql):
- **Schema**: id (uuid), agent_codename, venture_id (nullable), provider (elevenlabs|gemini-live|deepgram), voice_id, settings (jsonb).
- **Lookup**: (agent_codename, venture_id) → override if match; else (agent_codename, null).
- **Seeded**: 12 rows (S13 2026-04-14), all ElevenLabs. Ready for Gemini Live overrides.

## 7. Agent Voice Profile

[supabase/migration-agent-foundation.sql](../../supabase/migration-agent-foundation.sql):
- **agent_persona.voice_profile** (jsonb): {tone, pace, formality, hedges, humor, signature_phrases}. Not yet consumed; awaits voice stack consumer.

## Gaps for Wave 3

1. No standalone @mcv/voice-sdk package — interfaces live in router only.
2. No provider abstraction — hardwired to D+E; Gemini Live / Vapi require separate paths.
3. voice_profile → stack mapping missing — tone/pace/hedges unused.
4. No streaming TTS — full download before playback.
5. No provider fallback — single point of failure per voice component.
6. No cross-venture persona_voices testing yet.
7. Vapi call flow not wired to desktop components.

