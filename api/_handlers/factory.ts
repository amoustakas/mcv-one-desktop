// api/_handlers/factory.ts
// Factory proxy — forwards cockpit calls to the Local AI Factory runtime on :7004.
// The Factory itself runs on Tony's machine (sole-operator); this handler is
// a thin pass-through that keeps auth + error shape consistent with the rest
// of the cockpit API surface. Spec: C:\Users\moust\.claude\plans\check-out-the-spec-robust-eich.md

import type { VercelRequest, VercelResponse } from '@vercel/node';

const FACTORY_URL = process.env.FACTORY_URL || process.env.VITE_FACTORY_URL || 'http://localhost:7004';
const TIMEOUT_MS = 30_000;

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch {
    res.status(401).json({ error: 'Invalid session' }); return null;
  }
}

async function forward(method: 'GET' | 'POST', path: string, body?: unknown) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${FACTORY_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ac.signal,
    });
    const text = await res.text();
    let json: unknown;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { ok: res.ok, status: res.status, body: json };
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string | undefined;
  const params = { ...req.query, ...(req.body || {}) } as Record<string, unknown>;

  try {
    switch (action) {
      case 'ping': {
        const r = await forward('GET', '/ping');
        return res.status(r.ok ? 200 : 503).json({ factory: r.body, factoryUrl: FACTORY_URL });
      }
      case 'heartbeat': {
        const emit = params.emit === 'false' ? 'false' : 'true';
        const r = await forward('GET', `/heartbeat?emit=${emit}`);
        return res.status(r.ok ? 200 : 503).json({
          ok: r.ok, status: r.status, heartbeat: r.body, factoryUrl: FACTORY_URL,
        });
      }
      case 'flows': {
        const r = await forward('GET', '/flows');
        return res.status(r.ok ? 200 : 503).json({ ok: r.ok, flows: (r.body as any)?.flows ?? [] });
      }
      case 'events': {
        const limit = Number(params.limit ?? 50);
        const r = await forward('GET', `/events?limit=${Number.isFinite(limit) ? limit : 50}`);
        return res.status(r.ok ? 200 : 503).json({ ok: r.ok, events: (r.body as any)?.events ?? [] });
      }
      case 'events-clear': {
        const r = await forward('GET', '/events'); // no-op read fallback if DELETE fails
        // Issue DELETE directly — forward helper is GET/POST only so inline it here.
        const del = await fetch(`${FACTORY_URL}/events`, { method: 'DELETE' }).catch(() => null);
        return res.status(del?.ok ? 200 : (r.ok ? 200 : 503)).json({ cleared: !!del?.ok });
      }
      case 'bus': {
        const limit = Number(params.limit ?? 100);
        const typePrefix = typeof params.typePrefix === 'string' ? `&typePrefix=${encodeURIComponent(params.typePrefix)}` : '';
        const source = typeof params.source === 'string' ? `&source=${encodeURIComponent(params.source)}` : '';
        const r = await forward('GET', `/bus?limit=${Number.isFinite(limit) ? limit : 100}${typePrefix}${source}`);
        return res.status(r.ok ? 200 : 503).json({ ok: r.ok, events: (r.body as any)?.events ?? [] });
      }
      case 'capabilities': {
        const r = await forward('GET', '/capabilities');
        return res.status(r.ok ? 200 : 503).json(r.body);
      }
      case 'list-jobs': {
        const r = await forward('GET', '/jobs');
        return res.status(r.ok ? 200 : 503).json({ ok: r.ok, jobs: (r.body as any)?.jobs ?? [] });
      }
      case 'schedule-job': {
        const r = await forward('POST', '/jobs', params);
        return res.status(r.ok ? 200 : (r.status || 502)).json(r.body);
      }
      case 'delete-job': {
        const id = params.id as string | undefined;
        if (!id) return res.status(400).json({ error: 'id required' });
        const del = await fetch(`${FACTORY_URL}/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null);
        return res.status(del?.ok ? 200 : 502).json({ deleted: !!del?.ok });
      }
      case 'run-job': {
        const id = params.id as string | undefined;
        if (!id) return res.status(400).json({ error: 'id required' });
        const r = await forward('POST', `/jobs/${encodeURIComponent(id)}/run`);
        return res.status(r.ok ? 200 : (r.status || 502)).json(r.body);
      }
      case 'invoke': {
        const flowName = params.flowName as string | undefined;
        if (!flowName) return res.status(400).json({ error: 'flowName required' });
        const input = (params.input as unknown) ?? {};
        const r = await forward('POST', `/invoke/${encodeURIComponent(flowName)}`, input);
        return res.status(r.ok ? 200 : (r.status || 502)).json(r.body);
      }
      default:
        return res.status(400).json({
          error: `Unknown action: ${action ?? '(missing)'}. Expected: ping | heartbeat | flows | invoke`,
        });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    // Most common local-dev cause: Factory process not running.
    const hint = msg.includes('ECONNREFUSED') || msg.includes('fetch failed')
      ? ` (Factory unreachable at ${FACTORY_URL} — start with 'pnpm dev' in c:/Users/moust/mcv)`
      : '';
    return res.status(503).json({ error: `factory-proxy: ${msg}${hint}`, factoryUrl: FACTORY_URL });
  }
}
