# @mcv/voice-sdk

Dual-stack voice router + persona resolution for MCV venture apps.

## Usage

```ts
import { pickStack, resolvePersonaVoice } from '@mcv/voice-sdk';

const decision = pickStack({
  useCase: 'claude-chat-voice',
  provider: 'anthropic',
  agentCodename: 'aegis',
});
// → { stack: 'deepgram-elevenlabs', reason: '...', config: {} }

const persona = await resolvePersonaVoice('aegis');
// → { provider: 'elevenlabs', voiceId: 'rachel' }
```

## Stacks

- **gemini-live** — real-time agent conversation, function-calling over voice
- **deepgram-elevenlabs** — transcription, voice casting, narration, Claude-chat

## Use cases → stack mapping (deterministic)

| Use case | Stack |
|---|---|
| agent-conversation | gemini-live |
| multi-agent-roundtable | gemini-live |
| agent-tool-use | gemini-live |
| meeting-transcription | deepgram-elevenlabs |
| narration-asset | deepgram-elevenlabs |
| voice-casting | deepgram-elevenlabs |
| compliance-audio | deepgram-elevenlabs |
| claude-chat-voice | deepgram-elevenlabs |
| auto | scored heuristic |

## Persona voices

`DEFAULT_PERSONA_VOICES` ships the 12 NAOS C-suite codenames mapped to
ElevenLabs voice ids. Venture apps override per-agent via a Supabase
`persona_voices` table + thin wrapper.

## Consumers

- `mcv-one-desktop` via `src/lib/voice/router.ts` shim
- FutureState (planned)
- BetEdge (planned)
