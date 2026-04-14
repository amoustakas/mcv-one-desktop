import { requireAuth } from './_auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Vapi API — AI voice assistants, calls, phone numbers, analytics
// ---------------------------------------------------------------------------

const VAPI_API = 'https://api.vapi.ai';
const VAPI_KEY = process.env.VAPI_API_KEY || '';

async function vapiFetch(path: string, options?: { method?: string; body?: unknown }) {
  const res = await fetch(`${VAPI_API}${path}`, {
    method: options?.method || 'GET',
    headers: { Authorization: `Bearer ${VAPI_KEY}`, 'Content-Type': 'application/json' },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Vapi ${res.status}`);
  }
  if (res.status === 204) return {};
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!VAPI_KEY) return res.status(500).json({ error: 'VAPI_API_KEY not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Assistants ──
      case 'list-assistants':
        return res.json(await vapiFetch('/assistant'));

      case 'get-assistant': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/assistant/${id}`));
      }

      case 'create-assistant': {
        const { name, model, voice, firstMessage, instructions, tools } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        return res.json(await vapiFetch('/assistant', {
          method: 'POST',
          body: { name, model, voice, firstMessage, instructions, tools },
        }));
      }

      case 'update-assistant': {
        const { id, ...updates } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/assistant/${id}`, { method: 'PATCH', body: updates }));
      }

      case 'delete-assistant': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/assistant/${id}`, { method: 'DELETE' }));
      }

      // ── Calls ──
      case 'list-calls': {
        const { limit = '20' } = req.query;
        return res.json(await vapiFetch(`/call?limit=${limit}`));
      }

      case 'get-call': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/call/${id}`));
      }

      case 'create-call': {
        const { assistantId, phoneNumberId, customer, name } = req.body;
        if (!assistantId) return res.status(400).json({ error: 'assistantId required' });
        return res.json(await vapiFetch('/call', {
          method: 'POST', body: { assistantId, phoneNumberId, customer, name },
        }));
      }

      // ── Phone Numbers ──
      case 'list-phone-numbers':
        return res.json(await vapiFetch('/phone-number'));

      case 'get-phone-number': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/phone-number/${id}`));
      }

      case 'create-phone-number': {
        const { provider = 'vapi', name, assistantId, areaCode } = req.body;
        return res.json(await vapiFetch('/phone-number', {
          method: 'POST', body: { provider, name, assistantId, sip: areaCode ? { areaCode } : undefined },
        }));
      }

      // ── Calls (extended) ──
      case 'get-call-details': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/call/${id}`));
      }

      case 'end-call': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/call/${id}`, { method: 'DELETE' }));
      }

      // ── Workflows ──
      case 'list-workflows':
        return res.json(await vapiFetch('/workflow'));

      case 'get-workflow': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/workflow/${id}`));
      }

      case 'create-workflow': {
        const { name, steps } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        return res.json(await vapiFetch('/workflow', { method: 'POST', body: { name, steps } }));
      }

      case 'update-workflow': {
        const { id, ...updates } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/workflow/${id}`, { method: 'PATCH', body: updates }));
      }

      case 'delete-workflow': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/workflow/${id}`, { method: 'DELETE' }));
      }

      // ── Squads ──
      case 'list-squads':
        return res.json(await vapiFetch('/squad'));

      // ── Knowledge Bases ──
      case 'list-knowledge-bases':
        return res.json(await vapiFetch('/knowledge-base'));

      case 'create-knowledge-base': {
        const { name, ...rest } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        return res.json(await vapiFetch('/knowledge-base', { method: 'POST', body: { name, ...rest } }));
      }

      case 'update-knowledge-base': {
        const { id, ...updates } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/knowledge-base/${id}`, { method: 'PATCH', body: updates }));
      }

      case 'delete-knowledge-base': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/knowledge-base/${id}`, { method: 'DELETE' }));
      }

      // ── Tools ──
      case 'list-tools':
        return res.json(await vapiFetch('/tool'));

      case 'create-tool': {
        const { type, function: fn, ...rest } = req.body;
        if (!type) return res.status(400).json({ error: 'type required' });
        return res.json(await vapiFetch('/tool', { method: 'POST', body: { type, function: fn, ...rest } }));
      }

      case 'delete-tool': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await vapiFetch(`/tool/${id}`, { method: 'DELETE' }));
      }

      // ── Analytics ──
      case 'get-analytics': {
        const { startDate, endDate } = req.query;
        let path = '/analytics';
        const params: string[] = [];
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);
        if (params.length) path += '?' + params.join('&');
        return res.json(await vapiFetch(path));
      }

      // ── Logs ──
      case 'list-logs': {
        const { limit = '20' } = req.query;
        return res.json(await vapiFetch(`/log?limit=${limit}`));
      }

      // ── Overview ──
      case 'overview': {
        const [assistants, calls, numbers] = await Promise.all([
          vapiFetch('/assistant'),
          vapiFetch('/call?limit=5'),
          vapiFetch('/phone-number'),
        ]);
        return res.json({
          assistants: Array.isArray(assistants) ? assistants.length : 0,
          recent_calls: Array.isArray(calls) ? calls.length : 0,
          phone_numbers: Array.isArray(numbers) ? numbers.length : 0,
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
