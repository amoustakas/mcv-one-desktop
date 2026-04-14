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
import { supabase } from '../supabase';

/**
 * MCV Desktop's persona resolver.
 *
 * Lookup order:
 *   1. persona_voices row matching (agent_codename, venture_id) — venture override
 *   2. persona_voices row matching (agent_codename, NULL) — global default
 *   3. @mcv/voice-sdk DEFAULT_PERSONA_VOICES — SDK fallback
 *
 * Any Supabase failure falls through to the SDK defaults so voice never
 * breaks when the DB is unreachable.
 */
export async function resolvePersonaVoice(
  agentCodename: string,
  ventureId?: string,
): Promise<PersonaVoice | null> {
  const codename = agentCodename.toLowerCase();

  if (supabase) {
    try {
      // Fetch both global and venture-specific rows in one query; pick venture
      // override when present.
      const { data, error } = await supabase
        .from('persona_voices')
        .select('provider, voice_id, settings, venture_id')
        .eq('agent_codename', codename)
        .or(ventureId ? `venture_id.eq.${ventureId},venture_id.is.null` : 'venture_id.is.null')
        .limit(2);

      if (!error && Array.isArray(data) && data.length > 0) {
        const override = ventureId ? data.find((r) => r.venture_id === ventureId) : null;
        const fallback = data.find((r) => r.venture_id === null);
        const row = override ?? fallback;
        if (row) {
          return {
            provider: row.provider as PersonaVoice['provider'],
            voiceId: row.voice_id,
            settings: (row.settings as Record<string, unknown>) || undefined,
          };
        }
      }
    } catch {
      // Supabase unreachable — fall through to SDK defaults.
    }
  }

  return resolveFromSdk(codename, ventureId);
}
