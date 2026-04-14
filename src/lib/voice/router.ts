// src/lib/voice/router.ts
//
// Dual-stack voice router. Picks between:
//   * Gemini Live Audio (low-latency, native function-calling, multi-agent)
//   * Deepgram STT + ElevenLabs TTS (voice casting, transcription, narration)
//
// Use-case selection rules (from the plan):
//
// GEMINI LIVE when:
//   - Real-time agent conversation (Audio Orb, ChatterBots)
//   - Function-calling over voice (Native Audio Sandbox)
//   - Multi-agent voice roundtables
//   - Realtime meeting assistant
//   - Phone/PWA on-device sessions
//
// DEEPGRAM + ELEVENLABS when:
//   - Voice casting / branded narration per agent per venture
//   - Long-form transcription (calls, meetings, podcasts)
//   - High-fidelity asset generation (video voiceovers, ad reads)
//   - Compliance-grade audit logging (diarization + sentiment)
//   - Non-Gemini LLM chat needs voice (e.g. Claude-primary conversations)

export type VoiceStack = 'gemini-live' | 'deepgram-elevenlabs';

export type VoiceUseCase =
  | 'agent-conversation'        // live back-and-forth with an agent (Gemini Live)
  | 'multi-agent-roundtable'    // ChatterBots — multiple agents in one session (Gemini Live)
  | 'agent-tool-use'            // voice invocation of kit tools (Gemini Live)
  | 'meeting-transcription'     // calls, podcasts, long-form (Deepgram)
  | 'narration-asset'           // video voiceover, ad read (ElevenLabs)
  | 'voice-casting'             // per-agent per-venture branded voice (ElevenLabs)
  | 'compliance-audio'          // regulated audit with diarization (Deepgram)
  | 'claude-chat-voice'         // Claude-primary chat gets voice via D+E (since Live is Gemini)
  | 'auto';                     // router decides from context

export interface VoiceContext {
  useCase: VoiceUseCase;
  /** LLM driving the current session — 'gemini' routes to Live natively */
  provider?: 'anthropic' | 'google' | 'openai' | 'local';
  /** Priority on latency — sub-500ms nudges to Live */
  latencyTolerance?: 'real-time' | 'near-real-time' | 'batch';
  /** Duration estimate; long-form leans D+E */
  estimatedDurationMs?: number;
  /** Require diarization (speaker separation) → D+E */
  requireDiarization?: boolean;
  /** Need tool-calling mid-conversation → Live */
  requireToolCalling?: boolean;
  /** Venture id for voice-casting profile lookup */
  ventureId?: string;
  /** Agent codename for persona lookup */
  agentCodename?: string;
  /** User override from settings */
  userPreference?: VoiceStack;
}

export interface VoiceStackInfo {
  stack: VoiceStack;
  reason: string;
  /** Override-able config the caller applies (voice_id, model, etc.) */
  config: Record<string, unknown>;
}

/** Pick the appropriate stack from a use case + context. */
export function pickStack(ctx: VoiceContext): VoiceStackInfo {
  // 1) Explicit user preference wins (settings toggle).
  if (ctx.userPreference) {
    return {
      stack: ctx.userPreference,
      reason: 'user preference override',
      config: {},
    };
  }

  // 2) Strict routing by use-case category.
  switch (ctx.useCase) {
    case 'agent-conversation':
    case 'multi-agent-roundtable':
    case 'agent-tool-use':
      return {
        stack: 'gemini-live',
        reason: 'low-latency agent interaction with optional tool use',
        config: { model: 'gemini-2.0-flash-live-001' },
      };

    case 'meeting-transcription':
    case 'compliance-audio':
      return {
        stack: 'deepgram-elevenlabs',
        reason: 'long-form transcription + diarization',
        config: { model: 'nova-2', diarize: true, smart_format: true },
      };

    case 'narration-asset':
    case 'voice-casting':
      return {
        stack: 'deepgram-elevenlabs',
        reason: 'high-fidelity branded TTS',
        config: { model: 'eleven_turbo_v2_5' },
      };

    case 'claude-chat-voice':
      return {
        stack: 'deepgram-elevenlabs',
        reason: 'Claude-driven chat; Gemini Live would require provider switch',
        config: {},
      };

    case 'auto':
    default:
      // Fall through to the heuristic below.
      break;
  }

  // 3) Auto: score signals.
  let scoreLive = 0;
  let scoreDe = 0;

  if (ctx.provider === 'google') scoreLive += 2;
  if (ctx.provider === 'anthropic' || ctx.provider === 'openai') scoreDe += 2;

  if (ctx.latencyTolerance === 'real-time') scoreLive += 3;
  if (ctx.latencyTolerance === 'batch') scoreDe += 2;

  if (ctx.requireToolCalling) scoreLive += 2;
  if (ctx.requireDiarization) scoreDe += 3;

  if (typeof ctx.estimatedDurationMs === 'number') {
    if (ctx.estimatedDurationMs > 120_000) scoreDe += 2;
    if (ctx.estimatedDurationMs < 5_000) scoreLive += 1;
  }

  const stack: VoiceStack = scoreLive >= scoreDe ? 'gemini-live' : 'deepgram-elevenlabs';
  return {
    stack,
    reason: `auto: live=${scoreLive}, de=${scoreDe}`,
    config: {},
  };
}

/**
 * Resolve the branded voice profile for a given agent in a given venture.
 * Looks up a persona_voices table (to be seeded) with a fallback to the
 * agent's default voice. Stub implementation until persona_voices lands.
 */
export interface PersonaVoice {
  provider: 'elevenlabs' | 'gemini-live';
  voiceId: string;
  settings?: Record<string, unknown>;
}

export async function resolvePersonaVoice(
  agentCodename: string,
  _ventureId?: string,
): Promise<PersonaVoice | null> {
  // Placeholder defaults per agent. Replace with Supabase lookup when
  // persona_voices table ships (Phase 2.7 — see epic "Voice router").
  const defaults: Record<string, PersonaVoice> = {
    aegis: { provider: 'elevenlabs', voiceId: 'rachel' },     // authoritative, clear
    athena: { provider: 'elevenlabs', voiceId: 'domi' },       // analytical, precise
    atlas: { provider: 'elevenlabs', voiceId: 'josh' },        // warm, confident
    daedalus: { provider: 'elevenlabs', voiceId: 'adam' },     // technical, measured
    hermes: { provider: 'elevenlabs', voiceId: 'antoni' },     // energetic, engaging
    minerva: { provider: 'elevenlabs', voiceId: 'bella' },     // thoughtful, crisp
    vulcan: { provider: 'elevenlabs', voiceId: 'arnold' },     // stern, deliberate
    forge: { provider: 'elevenlabs', voiceId: 'sam' },         // practical, direct
    muse: { provider: 'elevenlabs', voiceId: 'elli' },         // creative, expressive
    sentry: { provider: 'elevenlabs', voiceId: 'callum' },     // calm, reliable
    scribe: { provider: 'elevenlabs', voiceId: 'charlotte' },  // articulate, narrative
    helios: { provider: 'elevenlabs', voiceId: 'dave' },       // operational, steady
  };
  return defaults[agentCodename.toLowerCase()] ?? null;
}
