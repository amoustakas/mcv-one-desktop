// packages/guardrails-sdk/src/voice.ts
//
// Voice-specific sanitization helpers. Voice turns differ from text turns
// along two axes:
//
// 1. Ingress is a transcribed user turn — already text, but we must ALSO
//    redact PII before the transcript is persisted to naos_interactions.
//    Audio bytes themselves pass through untouched.
//
// 2. Egress is assistant text that will be synthesized to audio by TTS.
//    A "redaction" in this stream needs to be pronounceable without
//    alarming the user ("redacted social security number" in speech is
//    weird) — so we use human-friendly placeholder phrasing.

import type { Policy, SanitizeMeta, SanitizeResult } from './types.js';
import { sanitizeText } from './sanitize.js';
import { DEFAULT_EGRESS_POLICY } from './rules.js';

const SPEECH_FRIENDLY_REPLACEMENTS: Record<string, string> = {
  SSN: 'a social security number',
  CREDIT_CARD: 'a credit card number',
  US_PHONE: 'a phone number',
  EMAIL: 'an email address',
  API_KEY_LIKE: 'an API key',
  GOOGLE_CLOUD_CREDENTIAL: 'a cloud credential',
  JWT_LIKE: 'an authentication token',
};

function speechFriendly(text: string): string {
  return text.replace(/\[REDACTED:([A-Z_]+)\]/g, (_full, kind) => {
    return SPEECH_FRIENDLY_REPLACEMENTS[kind] ?? 'redacted content';
  });
}

export interface VoiceTurnInput {
  text: string;
  kind: 'user_transcript' | 'assistant_pre_tts';
}

/**
 * Sanitize a single voice turn. For assistant turns headed to TTS, we
 * post-process the redacted string into speech-friendly placeholders so
 * the synthesizer produces a natural-sounding line.
 */
export function sanitizeVoiceTurn(
  turn: VoiceTurnInput,
  meta: Omit<SanitizeMeta, 'direction'>,
  policy: Policy = DEFAULT_EGRESS_POLICY,
): SanitizeResult<string> {
  const direction = turn.kind === 'user_transcript' ? 'ingress' : 'egress';
  const r = sanitizeText(turn.text, { policy, meta, direction });
  if (turn.kind === 'assistant_pre_tts' && r.redactions.length > 0) {
    return { ...r, safe: speechFriendly(r.safe) };
  }
  return r;
}
