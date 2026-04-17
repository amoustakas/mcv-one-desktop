import { getProviderToken } from './_oauth-helper.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
const TASKS_API = 'https://tasks.googleapis.com/tasks/v1';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

class GoogleApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

function mapGoogleStatus(status: number, message: string): GoogleApiError {
  switch (status) {
    case 401: return new GoogleApiError('Google token expired or revoked. Please reconnect in Settings > Integrations.', 401);
    case 403: return new GoogleApiError('Missing permission. Please reconnect Google with required scopes.', 403);
    case 404: return new GoogleApiError('Resource not found.', 404);
    case 429: return new GoogleApiError('Rate limited by Google. Try again in a moment.', 429);
    default: return new GoogleApiError(message || `Tasks API error (${status})`, status >= 500 ? 502 : status);
  }
}

async function tasksFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${TASKS_API}${path}${qs ? '?' + qs : ''}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw mapGoogleStatus(res.status, e.error?.message || ''); }
  return res.json();
}

async function tasksPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${TASKS_API}${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw mapGoogleStatus(res.status, e.error?.message || ''); }
  return res.json();
}

async function tasksPatch(path: string, token: string, body: unknown) {
  const res = await fetch(`${TASKS_API}${path}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw mapGoogleStatus(res.status, e.error?.message || ''); }
  return res.json();
}

async function tasksDelete(path: string, token: string) {
  const res = await fetch(`${TASKS_API}${path}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) { const e = await res.json().catch(() => ({})); throw mapGoogleStatus(res.status, e.error?.message || ''); }
  return { deleted: true };
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

  let token: string;
  try { token = (await getProviderToken(userId, 'google')).token; }
  catch (err) { return res.status(401).json({ error: err instanceof Error ? err.message : 'Google not connected.' }); }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      case 'list-tasklists':
        return res.json(await tasksFetch('/users/@me/lists', token));

      case 'list-tasks': {
        const { tasklistId = '@default', showCompleted = 'false', maxResults = '100' } = req.query;
        return res.json(await tasksFetch(`/lists/${tasklistId}/tasks`, token, { showCompleted: showCompleted as string, maxResults: maxResults as string }));
      }

      case 'get-task': {
        const { tasklistId = '@default', taskId } = req.query;
        if (!taskId) return res.status(400).json({ error: 'taskId required' });
        return res.json(await tasksFetch(`/lists/${tasklistId}/tasks/${taskId}`, token));
      }

      case 'create-task': {
        const { tasklistId = '@default', title, notes, due } = req.body;
        if (!title) return res.status(400).json({ error: 'title required' });
        return res.json(await tasksPost(`/lists/${tasklistId}/tasks`, token, {
          title, notes, due: due ? new Date(due).toISOString() : undefined,
        }));
      }

      case 'update-task': {
        const { tasklistId = '@default', taskId, title, notes, due, status } = req.body;
        if (!taskId) return res.status(400).json({ error: 'taskId required' });
        const body: Record<string, unknown> = {};
        if (title !== undefined) body.title = title;
        if (notes !== undefined) body.notes = notes;
        if (due !== undefined) body.due = due ? new Date(due).toISOString() : null;
        if (status !== undefined) body.status = status;
        return res.json(await tasksPatch(`/lists/${tasklistId}/tasks/${taskId}`, token, body));
      }

      case 'complete-task': {
        const { tasklistId = '@default', taskId } = req.body;
        if (!taskId) return res.status(400).json({ error: 'taskId required' });
        return res.json(await tasksPatch(`/lists/${tasklistId}/tasks/${taskId}`, token, { status: 'completed' }));
      }

      case 'delete-task': {
        const { tasklistId = '@default', taskId } = req.body;
        if (!taskId) return res.status(400).json({ error: 'taskId required' });
        return res.json(await tasksDelete(`/lists/${tasklistId}/tasks/${taskId}`, token));
      }

      case 'overview': {
        const [lists, tasks] = await Promise.all([
          tasksFetch('/users/@me/lists', token),
          tasksFetch('/lists/@default/tasks', token, { showCompleted: 'false', maxResults: '50' }),
        ]);
        const items = tasks.items ?? [];
        const overdue = items.filter((t: { due: string }) => t.due && new Date(t.due) < new Date());
        return res.json({
          list_count: lists.items?.length ?? 0,
          pending_tasks: items.length,
          overdue_tasks: overdue.length,
          next_due: items.find((t: { due: string }) => t.due)?.title || null,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    const status = err instanceof GoogleApiError ? err.status : 500;
    return res.status(status).json({ error: message });
  }
}
