import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
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


const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const TEAM_SLUG = 'mcv';

async function vercelFetch(path: string) {
  const url = `https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${TEAM_SLUG}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Vercel API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function vercelMutate(path: string, method: string, body?: unknown) {
  const url = `https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${TEAM_SLUG}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Vercel API ${res.status}: ${await res.text()}`);
  if (res.status === 204) return { success: true };
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
  const userId = await requireAuth(req, res); if (!userId) return;
  if (!['GET', 'POST'].includes(req.method || '')) return res.status(405).json({ error: 'Method not allowed' });
  if (!VERCEL_TOKEN) return res.status(500).json({ error: 'VERCEL_TOKEN not configured' });

  const action = req.query.action as string;

  try {
    switch (action) {
      case 'projects': {
        const data = await vercelFetch('/v9/projects?limit=20');
        return res.json({
          projects: data.projects.map((p: Record<string, unknown>) => ({
            id: p.id,
            name: p.name,
            framework: p.framework,
            url: `https://${(p.targets as Record<string, Record<string, string>>)?.production?.url || p.name + '.vercel.app'}`,
            updatedAt: p.updatedAt,
          })),
        });
      }

      case 'deployments': {
        const project = req.query.project as string;
        const path = project
          ? `/v6/deployments?projectId=${project}&limit=10`
          : '/v6/deployments?limit=10';
        const data = await vercelFetch(path);
        return res.json({
          deployments: data.deployments.map((d: Record<string, unknown>) => ({
            uid: d.uid,
            name: d.name,
            url: `https://${d.url}`,
            state: d.state,
            created: d.created,
            ready: d.ready,
            target: d.target,
          })),
        });
      }

      // ── Deployment CRUD ────────────────────────────────────

      case 'create-deployment': {
        const { name, gitSource } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        const data = await vercelMutate('/v13/deployments', 'POST', { name, gitSource: gitSource || {} });
        return res.json({ deployment: { uid: data.id, url: `https://${data.url}`, state: data.readyState } });
      }

      case 'cancel-deployment': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'deployment id required' });
        const data = await vercelMutate(`/v13/deployments/${id}/cancel`, 'PATCH');
        return res.json({ deployment: { uid: data.id || id, state: data.readyState || 'CANCELED' } });
      }

      // ── Environment Variables ───────────────────────────────

      case 'list-env-vars': {
        const { projectId } = req.body || req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId required' });
        const data = await vercelFetch(`/v9/projects/${projectId}/env`);
        return res.json({
          envs: (data.envs || []).map((e: Record<string, unknown>) => ({
            id: e.id, key: e.key, target: e.target, type: e.type,
          })),
        });
      }

      case 'create-env-var': {
        const { projectId, key, value, target, type } = req.body;
        if (!projectId || !key) return res.status(400).json({ error: 'projectId and key required' });
        const data = await vercelMutate(`/v10/projects/${projectId}/env`, 'POST', {
          key, value: value || '', target: target || ['production', 'preview', 'development'], type: type || 'encrypted',
        });
        return res.json({ env: { id: data.id, key: data.key, target: data.target } });
      }

      case 'delete-env-var': {
        const { projectId, envId } = req.body;
        if (!projectId || !envId) return res.status(400).json({ error: 'projectId and envId required' });
        await vercelMutate(`/v9/projects/${projectId}/env/${envId}`, 'DELETE');
        return res.json({ success: true, envId });
      }

      // ── Domains ─────────────────────────────────────────────

      case 'list-domains': {
        const { projectId } = req.body || req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId required' });
        const data = await vercelFetch(`/v9/projects/${projectId}/domains`);
        return res.json({
          domains: (data.domains || []).map((d: Record<string, unknown>) => ({
            name: d.name, verified: d.verified, redirect: d.redirect,
          })),
        });
      }

      case 'add-domain': {
        const { projectId, name } = req.body;
        if (!projectId || !name) return res.status(400).json({ error: 'projectId and name required' });
        const data = await vercelMutate(`/v10/projects/${projectId}/domains`, 'POST', { name });
        return res.json({ domain: { name: data.name, verified: data.verified } });
      }

      case 'remove-domain': {
        const { projectId, domain } = req.body;
        if (!projectId || !domain) return res.status(400).json({ error: 'projectId and domain required' });
        await vercelMutate(`/v9/projects/${projectId}/domains/${domain}`, 'DELETE');
        return res.json({ success: true, domain });
      }

      // ── Project info ────────────────────────────────────────

      case 'get-project': {
        const { projectId } = req.body || req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId required' });
        const data = await vercelFetch(`/v9/projects/${projectId}`);
        return res.json({
          project: {
            id: data.id, name: data.name, framework: data.framework,
            url: `https://${data.targets?.production?.url || data.name + '.vercel.app'}`,
            updatedAt: data.updatedAt, nodeVersion: data.nodeVersion,
          },
        });
      }

      // ── Aliases ─────────────────────────────────────────────

      case 'list-aliases': {
        const data = await vercelFetch('/v4/aliases');
        return res.json({
          aliases: (data.aliases || []).map((a: Record<string, unknown>) => ({
            uid: a.uid, alias: a.alias, deploymentId: a.deploymentId, created: a.createdAt,
          })),
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error));
    return res.status(500).json({ error: message });
  }
}
