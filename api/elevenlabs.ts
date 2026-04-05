import { requireAuth } from './_auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

      // ── Text-to-Speech ──
      case 'tts': {
        const { voiceId, text, model_id = 'eleven_multilingual_v2', voice_settings } = req.body;
        if (!voiceId || !text) return res.status(400).json({ error: 'voiceId and text required' });
        const data = await xiFetch(`/text-to-speech/${voiceId}`, {
          method: 'POST',
          body: { text, model_id, voice_settings: voice_settings || { stability: 0.5, similarity_boost: 0.75 } },
          headers: { Accept: 'application/json' },
        });
        return res.json(data);
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
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
