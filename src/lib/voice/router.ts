// src/lib/voice/router.ts
//
// MCV Desktop shim over @mcv/voice-sdk. The pure routing logic lives in
// the shared package so every venture app (FutureState, BetEdge, mcv.gg,
// WarForge) selects voice stacks the same way. This shim layers MCV
// Desktop's Supabase-backed persona lookup on top of the SDK's defaults.

export {
  pickStack,
  type VoiceStack,
  type VoiceUseCase,
  type VoiceContext,
  type VoiceStackInfo,
  type PersonaVoice,
  DEFAULT_PERSONA_VOICES,
} from '@mcv/voice-sdk';

import {
  resolvePersonaVoice as resolveFromSdk,
  type PersonaVoice,
} from '@mcv/voice-sdk';

/**
 * MCV Desktop's persona resolver — reads the Supabase `persona_voices`
 * table first (per-venture + per-agent override), then falls through to
 * the SDK defaults when no custom mapping exists.
 *
 * The persona_voices table isn't created yet (pending Phase 2.7 migration
 * — see "Voice router" epic). Until then this behaves identically to the
 * SDK's default resolver.
 */
export async function resolvePersonaVoice(
  agentCodename: string,
  ventureId?: string,
): Promise<PersonaVoice | null> {
  // TODO(persona-voices-migration): Supabase lookup with RLS-scoped rows:
  //   select provider, voice_id, settings from persona_voices
  //   where agent_codename = $1 and (venture_id = $2 or venture_id is null)
  //   order by (venture_id = $2) desc limit 1;
  // Fall through to SDK defaults on miss or table absence.
  return resolveFromSdk(agentCodename, ventureId);
}
