// Wizard TTS route — turns agent text into an agent-voiced audio stream.
//
// Flow:
//   1. Normalize agent handle ("@atlas" → "atlas") to the persona_voices codename.
//   2. Look up (codename, venture_id) with fallback to global (venture_id IS NULL).
//   3. Call the ElevenLabs REST TTS endpoint for that voice_id.
//   4. Stream the resulting MPEG audio back to the client.
//
// We talk to ElevenLabs via plain `fetch` rather than the SDK so the onboarding
// app carries no vendor dependency. The Desktop app uses the full voice-sdk
// router for multi-provider; the wizard only needs the one rail.

import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io';
const DEFAULT_MODEL = 'eleven_turbo_v2_5';

interface PersonaVoiceRow {
  provider: string;
  voice_id: string;
  settings: Record<string, unknown> | null;
  venture_id: string | null;
}

async function resolveVoiceId(codename: string, ventureId: string | null): Promise<PersonaVoiceRow | null> {
  const sb = getServiceSupabase();
  const filter = ventureId
    ? `venture_id.eq.${ventureId},venture_id.is.null`
    : 'venture_id.is.null';

  const { data, error } = await sb
    .from('persona_voices')
    .select('provider, voice_id, settings, venture_id')
    .eq('agent_codename', codename)
    .or(filter)
    .limit(2);

  if (error || !data?.length) return null;

  // Venture-scoped row wins over the global row.
  const override = ventureId ? data.find((r) => r.venture_id === ventureId) : null;
  return (override ?? data.find((r) => r.venture_id === null) ?? null) as PersonaVoiceRow | null;
}

export async function POST(req: Request) {
  let body: { text?: string; agentHandle?: string; ventureId?: string | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const text = (body.text ?? '').trim();
  const rawHandle = (body.agentHandle ?? '').trim();
  const ventureId = body.ventureId ?? null;

  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });
  if (!rawHandle) return NextResponse.json({ error: 'agentHandle required' }, { status: 400 });

  // "@atlas" → "atlas", "Atlas" → "atlas".
  const codename = rawHandle.replace(/^@/, '').toLowerCase();

  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 503 });
  }

  let voiceRow: PersonaVoiceRow | null = null;
  try {
    voiceRow = await resolveVoiceId(codename, ventureId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `persona_voices lookup failed: ${msg}` }, { status: 500 });
  }

  if (!voiceRow) {
    return NextResponse.json(
      { error: `no voice mapped for agent "${codename}"` },
      { status: 404 },
    );
  }

  // Build ElevenLabs request.
  const settings = (voiceRow.settings ?? {}) as Record<string, unknown>;
  const ttsPayload = {
    text,
    model_id: (settings.model_id as string) || DEFAULT_MODEL,
    voice_settings: {
      stability: typeof settings.stability === 'number' ? settings.stability : 0.55,
      similarity_boost: typeof settings.similarity === 'number' ? settings.similarity : 0.75,
      style: typeof settings.style === 'number' ? settings.style : 0.35,
      use_speaker_boost: true,
    },
  };

  const url = `${ELEVENLABS_BASE}/v1/text-to-speech/${encodeURIComponent(voiceRow.voice_id)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'content-type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify(ttsPayload),
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    return NextResponse.json(
      { error: `elevenlabs tts failed: ${r.status} ${r.statusText}`, detail: detail.slice(0, 500) },
      { status: 502 },
    );
  }

  // Pass the audio stream back directly — avoid buffering large blobs server-side.
  const audio = r.body;
  if (!audio) {
    return NextResponse.json({ error: 'elevenlabs returned no body' }, { status: 502 });
  }

  return new Response(audio, {
    status: 200,
    headers: {
      'content-type': 'audio/mpeg',
      'cache-control': 'private, max-age=300',
      'x-voice-provider': voiceRow.provider,
      'x-voice-id': voiceRow.voice_id,
    },
  });
}
