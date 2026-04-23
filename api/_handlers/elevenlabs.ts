import { requireAuth } from './_auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sanitizeVoiceTurn } from '@mcv/guardrails-sdk';

import { requestLogger } from '../../src/lib/server/logger';
// ---------------------------------------------------------------------------
// ElevenLabs API — TTS, voices, voice cloning, sound effects, models, history
// ---------------------------------------------------------------------------

const XI_API = 'https://api.elevenlabs.io/v1';
const API_KEY = process.env.ELEVENLABS_API_KEY || '';

async function xiFetch(path: string, options?: { method?: string; body?: unknown; headers?: Record<string, string> }) {
  const res = await fetch(`${XI_API}${path}`, {
    method: options?.method || 'GET',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail?.message || err.message || `ElevenLabs ${res.status}`);
  }
  // For audio streams, return raw response info
  if (res.headers.get('content-type')?.includes('audio')) {
    return { audio: true, contentType: res.headers.get('content-type'), size: res.headers.get('content-length') };
  }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!API_KEY) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Voices ──
      case 'list-voices':
        return res.json(await xiFetch('/voices'));

      case 'get-voice': {
        const { voiceId } = req.query;
        if (!voiceId) return res.status(400).json({ error: 'voiceId required' });
        return res.json(await xiFetch(`/voices/${voiceId}?with_settings=true`));
      }

      case 'search-voices': {
        const { query, page_size = '20' } = req.query;
        let path = '/shared-voices?page_size=' + page_size;
        if (query) path += `&search=${encodeURIComponent(query as string)}`;
        return res.json(await xiFetch(path));
      }

      case 'get-default-settings':
        return res.json(await xiFetch('/voices/settings/default'));

      // ── Text-to-Speech (returns base64 MP3 audio) ──
      case 'tts': {
        const { voiceId, text, model_id = 'eleven_multilingual_v2', voice_settings } = req.body;
        if (!voiceId || !text) return res.status(400).json({ error: 'voiceId and text required' });

        // Phase-0 voice sanitization: PII in text about to be spoken aloud gets
        // replaced with speech-friendly placeholders ("a social security number")
        // via sanitizeVoiceTurn. Blocks on prompt-injection or tool-poisoning
        // tags that somehow made it into a TTS request.
        const voiceSanitized = sanitizeVoiceTurn(
          { text, kind: 'assistant_pre_tts' },
          { userId, correlationId: __correlationId, agentHandle: 'elevenlabs-tts' },
        );
        if (voiceSanitized.blocked) {
          return res.status(400).json({
            error: 'TTS request blocked by safety policy',
            blocks: voiceSanitized.violations.map((v) => ({
              kind: v.kind, patternId: v.patternId, severity: v.severity,
            })),
          });
        }

        // ElevenLabs TTS returns binary audio; bypass xiFetch which parses JSON.
        const xiRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: voiceSanitized.safe, model_id,
            voice_settings: voice_settings || { stability: 0.5, similarity_boost: 0.75 },
          }),
        });
        if (!xiRes.ok) {
          const e = await xiRes.json().catch(() => ({}));
          return res.status(xiRes.status).json({ error: e.detail?.message || `ElevenLabs ${xiRes.status}` });
        }
        const buf = Buffer.from(await xiRes.arrayBuffer());
        return res.json({
          audio_base64: buf.toString('base64'),
          mime_type: 'audio/mpeg',
          size_bytes: buf.byteLength,
          voice_id: voiceId,
          model_id,
        });
      }

      case 'tts-stream': {
        const { voiceId, text, model_id = 'eleven_multilingual_v2' } = req.body;
        if (!voiceId || !text) return res.status(400).json({ error: 'voiceId and text required' });
        return res.json({ endpoint: `/v1/text-to-speech/${voiceId}/stream`, note: 'Use direct streaming from client with xi-api-key header' });
      }

      // ── Voice Design (text-to-voice) ──
      case 'design-voice': {
        const { voiceDescription, text } = req.body;
        if (!voiceDescription) return res.status(400).json({ error: 'voiceDescription required' });
        return res.json(await xiFetch('/text-to-voice/create-previews', {
          method: 'POST', body: { voice_description: voiceDescription, text: text || 'Hello, this is a preview of my voice.' },
        }));
      }

      case 'create-designed-voice': {
        const { voiceName, voiceDescription, generatedVoiceId } = req.body;
        if (!voiceName || !generatedVoiceId) return res.status(400).json({ error: 'voiceName and generatedVoiceId required' });
        return res.json(await xiFetch('/text-to-voice/create-voice-from-preview', {
          method: 'POST', body: { voice_name: voiceName, voice_description: voiceDescription, generated_voice_id: generatedVoiceId },
        }));
      }

      // ── Sound Effects ──
      case 'generate-sfx': {
        const { text, duration_seconds, prompt_influence } = req.body;
        if (!text) return res.status(400).json({ error: 'text required' });
        return res.json(await xiFetch('/sound-generation', {
          method: 'POST', body: { text, duration_seconds, prompt_influence },
          headers: { Accept: 'application/json' },
        }));
      }

      // ── Models ──
      case 'list-models':
        return res.json(await xiFetch('/models'));

      // ── History ──
      case 'list-history': {
        const { page_size = '20' } = req.query;
        return res.json(await xiFetch(`/history?page_size=${page_size}`));
      }

      case 'get-history-item': {
        const { historyItemId } = req.query;
        if (!historyItemId) return res.status(400).json({ error: 'historyItemId required' });
        return res.json(await xiFetch(`/history/${historyItemId}`));
      }

      // ── Voice Clone ──
      case 'clone-voice': {
        // NOTE: Full voice cloning requires multipart/form-data with audio file uploads.
        // This endpoint accepts name + description for metadata; audio files must be sent
        // via direct client upload or a separate multipart handler.
        const { name, description, labels } = req.body;
        if (!name) return res.status(400).json({ error: 'name required. Note: audio files must be uploaded via multipart/form-data directly to ElevenLabs.' });
        return res.json(await xiFetch('/voices/add', {
          method: 'POST',
          body: { name, description, labels },
        }));
      }

      // ── Voice Settings ──
      case 'get-voice-settings': {
        const { voiceId } = req.query;
        if (!voiceId) return res.status(400).json({ error: 'voiceId required' });
        return res.json(await xiFetch(`/voices/${voiceId}/settings`));
      }

      case 'update-voice-settings': {
        const { voiceId, stability, similarity_boost } = req.body;
        if (!voiceId) return res.status(400).json({ error: 'voiceId required' });
        return res.json(await xiFetch(`/voices/${voiceId}/settings/edit`, {
          method: 'POST',
          body: { stability, similarity_boost },
        }));
      }

      case 'delete-voice': {
        const { voiceId } = req.body;
        if (!voiceId) return res.status(400).json({ error: 'voiceId required' });
        return res.json(await xiFetch(`/voices/${voiceId}`, { method: 'DELETE' }));
      }

      // ── History Audio & Deletion ──
      case 'get-history-audio': {
        const { historyItemId } = req.query;
        if (!historyItemId) return res.status(400).json({ error: 'historyItemId required' });
        return res.json(await xiFetch(`/history/${historyItemId}/audio`));
      }

      case 'delete-history-item': {
        const { historyItemId } = req.body;
        if (!historyItemId) return res.status(400).json({ error: 'historyItemId required' });
        return res.json(await xiFetch(`/history/${historyItemId}`, { method: 'DELETE' }));
      }

      // ── Projects ──
      case 'list-projects':
        return res.json(await xiFetch('/projects'));

      case 'get-usage':
        return res.json(await xiFetch('/user'));

      // ── Pronunciation Dictionaries ──
      case 'list-dictionaries':
        return res.json(await xiFetch('/pronunciation-dictionaries'));

      // ── User / Subscription ──
      case 'get-user':
        return res.json(await xiFetch('/user'));

      case 'get-subscription':
        return res.json(await xiFetch('/user/subscription'));

      // ── Overview ──
      case 'overview': {
        const [user, voices, models] = await Promise.all([
          xiFetch('/user/subscription'),
          xiFetch('/voices'),
          xiFetch('/models'),
        ]);
        return res.json({
          tier: user.tier,
          character_count: user.character_count,
          character_limit: user.character_limit,
          voice_count: voices.voices?.length ?? 0,
          model_count: Array.isArray(models) ? models.length : 0,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    return res.status(500).json({ error: message });
  }
}
