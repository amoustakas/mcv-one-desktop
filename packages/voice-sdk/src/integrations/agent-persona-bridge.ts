// @mcv/voice-sdk — agent_persona.voice_profile bridge.
//
// agent_persona.voice_profile JSONB shape (from Session P migration):
//   {
//     tone:              'warm' | 'authoritative' | 'analytical' | 'playful' | 'stern' | 'technical' | ...
//     pace:              'slow' | 'measured' | 'natural' | 'brisk' | 'rapid'
//     formality:         'casual' | 'conversational' | 'formal' | 'ceremonial'
//     hedges:            0..1   — how often the agent softens statements
//     humor:             0..1   — dryness → playfulness
//     signature_phrases: string[]
//   }
//
// We translate each field into neutral VoiceSessionParams plus any
// provider-specific hints. The mapping is intentionally conservative —
// voice_profile is a style system, not a literal knob set — so we nudge
// stability/style/paceWpm/pitch and let providers interpret.

import type { ProviderName, VoiceSessionParams } from '../providers/ProviderContract';

export interface AgentVoiceProfile {
  tone?: string;
  pace?: string;
  formality?: string;
  hedges?: number;
  humor?: number;
  signature_phrases?: string[];
  /** Optional explicit voice id override that takes precedence. */
  voice_id?: string;
  /** Optional provider preference (informational — router decides). */
  preferred_provider?: ProviderName;
}

const PACE_WPM: Record<string, number> = {
  slow: 110,
  measured: 130,
  natural: 150,
  brisk: 175,
  rapid: 200,
};

const TONE_STYLE: Record<string, number> = {
  warm: 0.55,
  playful: 0.75,
  authoritative: 0.15,
  stern: 0.1,
  analytical: 0.2,
  technical: 0.15,
  empathetic: 0.5,
  narrative: 0.45,
};

const TONE_STABILITY: Record<string, number> = {
  warm: 0.5,
  playful: 0.35,
  authoritative: 0.75,
  stern: 0.85,
  analytical: 0.7,
  technical: 0.8,
  empathetic: 0.55,
  narrative: 0.5,
};

const TONE_PITCH: Record<string, number> = {
  warm: 1.0,
  playful: 1.08,
  authoritative: 0.95,
  stern: 0.9,
  analytical: 1.0,
  technical: 1.0,
  empathetic: 1.02,
  narrative: 1.0,
};

/**
 * Base mapping (provider-agnostic) from voice_profile → VoiceSessionParams.
 */
export function personaProfileToBaseParams(profile: AgentVoiceProfile): VoiceSessionParams {
  const tone = (profile.tone ?? 'warm').toLowerCase();
  const pace = (profile.pace ?? 'natural').toLowerCase();

  const base: VoiceSessionParams = {
    voiceId: profile.voice_id,
    paceWpm: PACE_WPM[pace] ?? 150,
    style: TONE_STYLE[tone] ?? 0.3,
    stability: TONE_STABILITY[tone] ?? 0.5,
    pitch: TONE_PITCH[tone] ?? 1.0,
  };

  // Humor nudges style higher; hedges nudge stability higher.
  if (typeof profile.humor === 'number') {
    base.style = clamp((base.style ?? 0) + profile.humor * 0.2, 0, 1);
  }
  if (typeof profile.hedges === 'number') {
    base.stability = clamp((base.stability ?? 0) + profile.hedges * 0.15, 0, 1);
  }

  // Signature phrases become a systemPrompt hint — the LLM-driven providers
  // (Gemini Live, OpenAI Realtime) use this; TTS-only providers ignore it.
  if (profile.signature_phrases?.length) {
    base.systemPrompt = `You occasionally use these signature phrases naturally: ${profile.signature_phrases.join('; ')}.`;
  }

  return base;
}

/**
 * Per-provider refinement. ElevenLabs respects stability/style; Gemini Live
 * respects voiceName + systemInstruction; OpenAI Realtime uses `voice` +
 * `instructions`; Vapi voice goes through assistant config; Deepgram/Azure
 * take what they can.
 */
export function personaProfileToParams(profile: AgentVoiceProfile, provider: ProviderName): VoiceSessionParams {
  const base = personaProfileToBaseParams(profile);
  switch (provider) {
    case 'elevenlabs':
      // Prefer an ElevenLabs voice id if the profile has one; else keep base.
      return { ...base, similarity: 0.75 };
    case 'gemini-live':
      // Gemini doesn't honor stability/similarity — map tone to voiceName
      // when profile doesn't specify one.
      return {
        ...base,
        voiceId: profile.voice_id ?? geminiVoiceForTone(profile.tone),
      };
    case 'openai-realtime':
      return {
        ...base,
        voiceId: profile.voice_id ?? openaiVoiceForTone(profile.tone),
      };
    case 'vapi':
      return { ...base, raw: { voiceProvider: '11labs' } };
    case 'azure-speech':
      return {
        ...base,
        voiceId: profile.voice_id ?? azureVoiceForTone(profile.tone),
      };
    case 'deepgram':
      // STT only — just carry language.
      return { language: (base as any).language ?? 'en' };
    default:
      return base;
  }
}

function geminiVoiceForTone(tone?: string): string {
  switch ((tone ?? '').toLowerCase()) {
    case 'authoritative': return 'Charon';
    case 'warm':          return 'Aoede';
    case 'playful':       return 'Puck';
    case 'analytical':    return 'Kore';
    case 'stern':         return 'Fenrir';
    case 'technical':     return 'Orus';
    default:              return 'Aoede';
  }
}

function openaiVoiceForTone(tone?: string): string {
  switch ((tone ?? '').toLowerCase()) {
    case 'authoritative': return 'ash';
    case 'warm':          return 'shimmer';
    case 'playful':       return 'sage';
    case 'analytical':    return 'ballad';
    case 'stern':         return 'verse';
    case 'technical':     return 'coral';
    default:              return 'alloy';
  }
}

function azureVoiceForTone(tone?: string): string {
  switch ((tone ?? '').toLowerCase()) {
    case 'authoritative': return 'en-US-GuyNeural';
    case 'warm':          return 'en-US-JennyNeural';
    case 'playful':       return 'en-US-AriaNeural';
    case 'analytical':    return 'en-US-DavisNeural';
    case 'stern':         return 'en-US-TonyNeural';
    case 'technical':     return 'en-US-BrianNeural';
    default:              return 'en-US-JennyNeural';
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
