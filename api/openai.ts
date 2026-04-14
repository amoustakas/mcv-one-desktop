import { requireAuth } from './_auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// OpenAI API — chat completions, images, embeddings, audio, moderation, models
// ---------------------------------------------------------------------------

const OAI_API = 'https://api.openai.com/v1';
const API_KEY = process.env.OPENAI_API_KEY || '';

async function oaiFetch(path: string, options?: { method?: string; body?: unknown }) {
  const res = await fetch(`${OAI_API}${path}`, {
    method: options?.method || 'GET',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `OpenAI ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      case 'chat': {
        const { messages, model = 'gpt-4o', temperature = 0.7, max_tokens = 4096, tools, response_format } = req.body;
        if (!messages) return res.status(400).json({ error: 'messages required' });
        const body: Record<string, unknown> = { model, messages, temperature, max_tokens };
        if (tools) body.tools = tools;
        if (response_format) body.response_format = response_format;
        return res.json(await oaiFetch('/chat/completions', { method: 'POST', body }));
      }

      case 'generate-image': {
        const { prompt, model = 'dall-e-3', size = '1024x1024', quality = 'standard', n = 1 } = req.body;
        if (!prompt) return res.status(400).json({ error: 'prompt required' });
        return res.json(await oaiFetch('/images/generations', {
          method: 'POST', body: { prompt, model, size, quality, n },
        }));
      }

      case 'edit-image': {
        return res.json({ note: 'Image editing requires multipart upload. Use /images/edits directly.' });
      }

      case 'embeddings': {
        const { input, model = 'text-embedding-3-small' } = req.body;
        if (!input) return res.status(400).json({ error: 'input required' });
        return res.json(await oaiFetch('/embeddings', {
          method: 'POST', body: { input, model },
        }));
      }

      case 'transcribe': {
        return res.json({ note: 'Audio transcription requires multipart upload. Use /audio/transcriptions with Whisper model directly.' });
      }

      case 'tts': {
        const { input, model = 'tts-1', voice = 'alloy', speed = 1 } = req.body;
        if (!input) return res.status(400).json({ error: 'input required' });
        return res.json({ endpoint: '/audio/speech', note: 'Returns audio stream. POST with {model, input, voice, speed}', model, voice, speed });
      }

      case 'moderation': {
        const { input } = req.body;
        if (!input) return res.status(400).json({ error: 'input required' });
        return res.json(await oaiFetch('/moderations', { method: 'POST', body: { input } }));
      }

      case 'list-models':
        return res.json(await oaiFetch('/models'));

      case 'get-model': {
        const { modelId } = req.query;
        if (!modelId) return res.status(400).json({ error: 'modelId required' });
        return res.json(await oaiFetch(`/models/${modelId}`));
      }

      // ── Assistants API ──
      case 'list-assistants':
        return res.json(await oaiFetch('/assistants?order=desc&limit=20', { method: 'GET' }));

      case 'create-assistant': {
        const { name, instructions, model = 'gpt-4o', tools: assistantTools } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        return res.json(await oaiFetch('/assistants', {
          method: 'POST', body: { name, instructions, model, tools: assistantTools },
        }));
      }

      // ── Files ──
      case 'list-files':
        return res.json(await oaiFetch('/files'));

      // ── Fine-tuning ──
      case 'list-fine-tunes':
        return res.json(await oaiFetch('/fine_tuning/jobs?limit=10'));

      case 'create-fine-tune': {
        const { training_file, model = 'gpt-4o-mini-2024-07-18', suffix } = req.body;
        if (!training_file) return res.status(400).json({ error: 'training_file required' });
        return res.json(await oaiFetch('/fine_tuning/jobs', {
          method: 'POST', body: { training_file, model, suffix },
        }));
      }

      case 'overview': {
        const models = await oaiFetch('/models');
        const ownedModels = (models.data ?? []).filter((m: { owned_by: string }) => m.owned_by === 'user' || m.owned_by === 'organization');
        return res.json({
          total_models: models.data?.length ?? 0,
          custom_models: ownedModels.length,
          key_models: ['gpt-4o', 'gpt-4o-mini', 'dall-e-3', 'whisper-1', 'tts-1'].filter((m) =>
            models.data?.some((d: { id: string }) => d.id === m)),
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
