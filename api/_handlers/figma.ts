import { getProviderToken } from './_oauth-helper.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
// ---------------------------------------------------------------------------
// Figma API v1 — files, components, styles, exports, comments, projects, versions
// ---------------------------------------------------------------------------

const FIGMA_API = 'https://api.figma.com/v1';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const t = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : (req.cookies?.__session || null);
  if (!t) { res.status(401).json({ error: 'Auth required' }); return null; }
  try { const { verifyToken } = await import('@clerk/backend'); return (await verifyToken(t, { secretKey })).sub; }
  catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

async function figmaFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${FIGMA_API}${path}${qs ? '?' + qs : ''}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || e.err || `Figma ${res.status}`); }
  return res.json();
}

async function figmaPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${FIGMA_API}${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Figma ${res.status}`); }
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

  let token: string;
  try { token = (await getProviderToken(userId, 'figma')).token; }
  catch { return res.status(500).json({ error: 'Figma not connected.' }); }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      case 'me':
        return res.json(await figmaFetch('/me', token));

      // ── Files ──
      case 'get-file': {
        const { fileKey, depth } = req.query;
        if (!fileKey) return res.status(400).json({ error: 'fileKey required' });
        const params: Record<string, string> = {};
        if (depth) params.depth = depth as string;
        return res.json(await figmaFetch(`/files/${fileKey}`, token, params));
      }

      case 'get-file-nodes': {
        const { fileKey, ids } = req.query;
        if (!fileKey || !ids) return res.status(400).json({ error: 'fileKey and ids required' });
        return res.json(await figmaFetch(`/files/${fileKey}/nodes`, token, { ids: ids as string }));
      }

      // ── Components ──
      case 'get-components': {
        const { fileKey } = req.query;
        if (!fileKey) return res.status(400).json({ error: 'fileKey required' });
        return res.json(await figmaFetch(`/files/${fileKey}/components`, token));
      }

      case 'team-components': {
        const { teamId } = req.query;
        if (!teamId) return res.status(400).json({ error: 'teamId required' });
        return res.json(await figmaFetch(`/teams/${teamId}/components`, token));
      }

      case 'component-sets': {
        const { fileKey } = req.query;
        if (!fileKey) return res.status(400).json({ error: 'fileKey required' });
        return res.json(await figmaFetch(`/files/${fileKey}/component_sets`, token));
      }

      // ── Styles ──
      case 'get-styles': {
        const { fileKey } = req.query;
        if (!fileKey) return res.status(400).json({ error: 'fileKey required' });
        return res.json(await figmaFetch(`/files/${fileKey}/styles`, token));
      }

      case 'team-styles': {
        const { teamId } = req.query;
        if (!teamId) return res.status(400).json({ error: 'teamId required' });
        return res.json(await figmaFetch(`/teams/${teamId}/styles`, token));
      }

      // ── Images / Exports ──
      case 'export-images': {
        const { fileKey, ids, format = 'png', scale = '2' } = req.query;
        if (!fileKey || !ids) return res.status(400).json({ error: 'fileKey and ids required' });
        return res.json(await figmaFetch(`/images/${fileKey}`, token, {
          ids: ids as string, format: format as string, scale: scale as string,
        }));
      }

      case 'get-image-fills': {
        const { fileKey } = req.query;
        if (!fileKey) return res.status(400).json({ error: 'fileKey required' });
        return res.json(await figmaFetch(`/files/${fileKey}/images`, token));
      }

      // ── Comments ──
      case 'get-comments': {
        const { fileKey } = req.query;
        if (!fileKey) return res.status(400).json({ error: 'fileKey required' });
        return res.json(await figmaFetch(`/files/${fileKey}/comments`, token));
      }

      case 'add-comment': {
        const { fileKey, message, x, y } = req.body;
        if (!fileKey || !message) return res.status(400).json({ error: 'fileKey and message required' });
        const body: Record<string, unknown> = { message };
        if (x !== undefined && y !== undefined) body.client_meta = { x: Number(x), y: Number(y) };
        return res.json(await figmaPost(`/files/${fileKey}/comments`, token, body));
      }

      // ── Projects ──
      case 'team-projects': {
        const { teamId } = req.query;
        if (!teamId) return res.status(400).json({ error: 'teamId required' });
        return res.json(await figmaFetch(`/teams/${teamId}/projects`, token));
      }

      case 'project-files': {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId required' });
        return res.json(await figmaFetch(`/projects/${projectId}/files`, token));
      }

      // ── Versions ──
      case 'get-versions': {
        const { fileKey } = req.query;
        if (!fileKey) return res.status(400).json({ error: 'fileKey required' });
        return res.json(await figmaFetch(`/files/${fileKey}/versions`, token));
      }

      // ── Variables (Design Tokens) ──
      case 'get-variables': {
        const { fileKey } = req.query;
        if (!fileKey) return res.status(400).json({ error: 'fileKey required' });
        return res.json(await figmaFetch(`/files/${fileKey}/variables/local`, token));
      }

      case 'get-published-variables': {
        const { fileKey } = req.query;
        if (!fileKey) return res.status(400).json({ error: 'fileKey required' });
        return res.json(await figmaFetch(`/files/${fileKey}/variables/published`, token));
      }

      // ── Overview ──
      case 'overview': {
        const me = await figmaFetch('/me', token);
        return res.json({ user: me.handle, email: me.email, img_url: me.img_url });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
