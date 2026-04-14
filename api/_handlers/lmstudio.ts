import { requireAuth } from './_auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// LM Studio Local API — chat, embeddings, models, loading, system info
// OpenAI-compatible + LM Studio native endpoints
// Connects to local LM Studio server (default: http://localhost:1234)
// ---------------------------------------------------------------------------

const LMS_BASE = process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234';
const LMS_API = `${LMS_BASE}/api/v0`;
const LMS_OAI = `${LMS_BASE}/v1`; // OpenAI-compatible endpoint

async function lmsFetch(path: string, base = LMS_API, options?: { method?: string; body?: unknown; timeout?: number }) {
  const controller = new AbortController();
  const timeoutMs = options?.timeout || 30000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}${path}`, {
      method: options?.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error?.message || `LM Studio ${res.status}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') throw new Error('LM Studio server not responding (timeout)');
    throw err;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Server Health ──
      case 'health': {
        try {
          const start = Date.now();
          await lmsFetch('/models', LMS_API, { timeout: 5000 });
          return res.json({ online: true, latencyMs: Date.now() - start, baseUrl: LMS_BASE });
        } catch {
          return res.json({ online: false, baseUrl: LMS_BASE, error: 'LM Studio server not reachable' });
        }
      }

      // ── Models ──
      case 'list-models':
        return res.json(await lmsFetch('/models'));

      case 'list-downloaded': {
        // v0 API for downloaded (not just loaded) models
        try { return res.json(await lmsFetch('/models/downloaded')); }
        catch { return res.json(await lmsFetch('/models')); }
      }

      case 'get-model': {
        const { modelId } = req.query;
        if (!modelId) return res.status(400).json({ error: 'modelId required' });
        return res.json(await lmsFetch(`/models/${encodeURIComponent(modelId as string)}`));
      }

      case 'load-model': {
        const { model, contextLength, gpuOffload } = req.body;
        if (!model) return res.status(400).json({ error: 'model required (path or identifier)' });
        const body: Record<string, unknown> = { model };
        if (contextLength) body.context_length = contextLength;
        if (gpuOffload !== undefined) body.gpu_offload = gpuOffload;
        return res.json(await lmsFetch('/models/load', LMS_API, {
          method: 'POST', body, timeout: 120000, // Loading can take 2 min
        }));
      }

      case 'unload-model': {
        const { model } = req.body;
        if (!model) return res.status(400).json({ error: 'model required' });
        return res.json(await lmsFetch('/models/unload', LMS_API, { method: 'POST', body: { model } }));
      }

      // ── Chat Completions (OpenAI-compatible) ──
      case 'chat': {
        const { model, messages, temperature = 0.7, max_tokens = -1, tools, tool_choice, response_format, stream = false } = req.body;
        if (!messages) return res.status(400).json({ error: 'messages required' });
        const body: Record<string, unknown> = { messages, temperature, max_tokens, stream };
        if (model) body.model = model;
        if (tools) body.tools = tools;
        if (tool_choice) body.tool_choice = tool_choice;
        if (response_format) body.response_format = response_format;
        const data = await lmsFetch('/chat/completions', LMS_API, {
          method: 'POST', body, timeout: 120000,
        });
        return res.json(data);
      }

      // ── Text Completions ──
      case 'completions': {
        const { model, prompt, temperature = 0.7, max_tokens = 256 } = req.body;
        if (!prompt) return res.status(400).json({ error: 'prompt required' });
        const body: Record<string, unknown> = { prompt, temperature, max_tokens };
        if (model) body.model = model;
        return res.json(await lmsFetch('/completions', LMS_API, {
          method: 'POST', body, timeout: 120000,
        }));
      }

      // ── Embeddings ──
      case 'embeddings': {
        const { model, input } = req.body;
        if (!input) return res.status(400).json({ error: 'input required' });
        const body: Record<string, unknown> = { input };
        if (model) body.model = model;
        return res.json(await lmsFetch('/embeddings', LMS_API, { method: 'POST', body }));
      }

      // ── Structured Output (JSON mode) ──
      case 'chat-structured': {
        const { model, messages, schema, temperature = 0.3 } = req.body;
        if (!messages || !schema) return res.status(400).json({ error: 'messages and schema required' });
        const body: Record<string, unknown> = {
          messages, temperature,
          response_format: { type: 'json_schema', json_schema: { name: 'response', strict: true, schema } },
        };
        if (model) body.model = model;
        return res.json(await lmsFetch('/chat/completions', LMS_API, {
          method: 'POST', body, timeout: 120000,
        }));
      }

      // ── Tool Calling ──
      case 'chat-with-tools': {
        const { model, messages, tools, tool_choice = 'auto', temperature = 0.3 } = req.body;
        if (!messages || !tools) return res.status(400).json({ error: 'messages and tools required' });
        const body: Record<string, unknown> = { messages, tools, tool_choice, temperature };
        if (model) body.model = model;
        return res.json(await lmsFetch('/chat/completions', LMS_API, {
          method: 'POST', body, timeout: 120000,
        }));
      }

      // ── System Info (GPU, RAM, etc.) ──
      case 'system-info': {
        try { return res.json(await lmsFetch('/system/info')); }
        catch { return res.json({ note: 'System info endpoint may not be available in this LM Studio version' }); }
      }

      // ── OpenAI-Compatible Endpoint (for apps expecting /v1/) ──
      case 'oai-models':
        return res.json(await lmsFetch('/models', LMS_OAI));

      case 'oai-chat': {
        const { model, messages, temperature, max_tokens, tools, stream } = req.body;
        return res.json(await lmsFetch('/chat/completions', LMS_OAI, {
          method: 'POST',
          body: { model, messages, temperature, max_tokens, tools, stream: stream || false },
          timeout: 120000,
        }));
      }

      // ── Benchmark (quick performance test) ──
      case 'benchmark': {
        const { model, prompt = 'Write a short paragraph about artificial intelligence.' } = req.body;
        const start = Date.now();
        const data = await lmsFetch('/chat/completions', LMS_API, {
          method: 'POST',
          body: {
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 200,
          },
          timeout: 60000,
        });
        const elapsed = Date.now() - start;
        return res.json({
          model: data.model,
          tokensPerSecond: data.stats?.tokens_per_second,
          timeToFirstToken: data.stats?.time_to_first_token,
          generationTime: data.stats?.generation_time,
          totalTimeMs: elapsed,
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          modelInfo: data.model_info,
          runtime: data.runtime,
          response: data.choices?.[0]?.message?.content?.slice(0, 200),
        });
      }

      // ── Overview ──
      case 'overview': {
        try {
          const start = Date.now();
          const models = await lmsFetch('/models', LMS_API, { timeout: 5000 });
          const latency = Date.now() - start;
          const modelList = models.data ?? [];
          const loaded = modelList.filter((m: { state?: string }) => m.state === 'loaded' || !m.state);
          return res.json({
            online: true,
            latencyMs: latency,
            baseUrl: LMS_BASE,
            loaded_models: loaded.length,
            total_models: modelList.length,
            models: loaded.map((m: { id: string; object?: string }) => m.id),
          });
        } catch {
          return res.json({ online: false, baseUrl: LMS_BASE, loaded_models: 0, total_models: 0, models: [] });
        }
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
