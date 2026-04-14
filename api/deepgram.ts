import { requireAuth } from './_auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Deepgram API — transcription, pre-recorded, models, usage, projects
// ---------------------------------------------------------------------------

const DG_API = 'https://api.deepgram.com/v1';
const API_KEY = process.env.DEEPGRAM_API_KEY || '';

async function dgFetch(path: string, options?: { method?: string; body?: unknown; headers?: Record<string, string> }) {
  const res = await fetch(`${DG_API}${path}`, {
    method: options?.method || 'GET',
    headers: { Authorization: `Token ${API_KEY}`, 'Content-Type': 'application/json', ...options?.headers },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.err_msg || `Deepgram ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!API_KEY) return res.status(500).json({ error: 'DEEPGRAM_API_KEY not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Transcription (pre-recorded via URL) ──
      case 'transcribe-url': {
        const { url, language = 'en', model = 'nova-2', smart_format = true, punctuate = true, diarize = false, topics = false, sentiment = false, summarize = false } = req.body;
        if (!url) return res.status(400).json({ error: 'url required' });
        const params = new URLSearchParams({
          model, language, smart_format: String(smart_format), punctuate: String(punctuate),
          diarize: String(diarize),
        });
        if (topics) params.set('detect_topics', 'true');
        if (sentiment) params.set('sentiment', 'true');
        if (summarize) params.set('summarize', 'v2');
        return res.json(await dgFetch(`/listen?${params.toString()}`, {
          method: 'POST', body: { url },
        }));
      }

      // ── Transcription intelligence features ─��
      case 'transcribe-with-intelligence': {
        const { url, language = 'en' } = req.body;
        if (!url) return res.status(400).json({ error: 'url required' });
        return res.json(await dgFetch('/listen?model=nova-2&smart_format=true&punctuate=true&diarize=true&detect_topics=true&sentiment=true&summarize=v2&intents=true&detect_entities=true', {
          method: 'POST', body: { url },
        }));
      }

      // ── Models ──
      case 'list-models':
        return res.json(await dgFetch('/models'));

      case 'get-model': {
        const { modelId } = req.query;
        if (!modelId) return res.status(400).json({ error: 'modelId required' });
        return res.json(await dgFetch(`/models/${modelId}`));
      }

      // ── Projects ──
      case 'list-projects':
        return res.json(await dgFetch('/projects'));

      case 'get-project': {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId required' });
        return res.json(await dgFetch(`/projects/${projectId}`));
      }

      // ── Usage ──
      case 'get-usage': {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId required' });
        const startDate = new Date(Date.now() - 30 * 86400000).toISOString();
        const endDate = new Date().toISOString();
        return res.json(await dgFetch(`/projects/${projectId}/usage?start=${startDate}&end=${endDate}`));
      }

      // ── Keys ──
      case 'list-keys': {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId required' });
        return res.json(await dgFetch(`/projects/${projectId}/keys`));
      }

      // ── Text-to-Speech (Aura) ──
      case 'tts': {
        const { text, model = 'aura-asteria-en' } = req.body;
        if (!text) return res.status(400).json({ error: 'text required' });
        // TTS returns audio — we return metadata
        return res.json({ endpoint: `/v1/speak?model=${model}`, note: 'Use direct POST with text body and Deepgram API key for audio stream', model });
      }

      // ── Overview ──
      case 'overview': {
        const projects = await dgFetch('/projects');
        const projectList = projects.projects ?? [];
        return res.json({
          project_count: projectList.length,
          projects: projectList.map((p: { project_id: string; name: string }) => ({ id: p.project_id, name: p.name })),
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
