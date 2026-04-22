// api/_handlers/factory.ts
//
// Proxy from the cockpit to the Local AI Factory runtime on :7004.
// The Factory runs on Tony's machine (sole-operator), so this handler is a
// thin pass-through that inherits the cockpit's platform patterns:
//   - Clerk session auth (401 on missing / invalid JWT)
//   - Sliding-window rate limit (60 req/min per client IP)
//   - pino structured logging (request_in / request_out / errors) with
//     correlation_id bound via AsyncLocalStorage
//   - x-correlation-id propagates outbound to the Factory so its own logs
//     share the trace thread
//   - Sentry captures 5xx proxy errors with { handler: 'factory', correlation_id }
//   - FACTORY_INTERNAL_SECRET (if set) added as X-Internal-Secret header
//     server-side only — never returned to the client
//
// Action dispatch envelope matches the client in src/lib/factory-client.ts:
//   POST /api/factory  { action: 'ping' | 'heartbeat' | 'flows' | 'events' |
//                                 'events-clear' | 'bus' | 'capabilities' |
//                                 'list-jobs' | 'schedule-job' | 'delete-job' |
//                                 'run-job' | 'invoke',
//                        ...args }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requestLogger } from '../../src/lib/server/logger';
import { runWithCorrelation, resolveCorrelationId } from '../../src/lib/server/correlation';
import { fetchWithCorrelation } from '../../src/lib/server/fetch-with-correlation';
import { withRateLimit } from '../../src/lib/server/rate-limit';
import { captureHandlerError, initSentryServer } from '../../src/lib/sentry/server';

// ─── Config ──────────────────────────────────────────────────────────────────

const FACTORY_URL = process.env.FACTORY_URL || process.env.VITE_FACTORY_URL || 'http://localhost:7004';
const TIMEOUT_MS = 30_000;

// Server-side only — never returned to the client. When configured, it's sent
// to the Factory as X-Internal-Secret to authenticate the cockpit as a known
// caller.
const INTERNAL_SECRET = process.env.FACTORY_INTERNAL_SECRET;

// Rate limit: 60 req/min per IP. Factory console polls heartbeat every 5s
// (~12/min), so a user opening the console ticks ~12-15 requests/min in
// baseline. 60 gives headroom for manual flow invocations + bus seeding
// without ever hitting the ceiling in normal use.
const FACTORY_RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 60,
  keyPrefix: 'factory',
} as const;

// ─── Clerk auth (mirrors live-proxy.ts pattern) ──────────────────────────────

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  // Dev-without-Clerk escape hatch — allows Tony to run the Factory locally
  // without wiring a full Clerk tenant. Matches live-proxy.ts.
  if (!secretKey) return 'no-secret';

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.cookies?.__session || null);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch {
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }
}

// ─── Outbound forward helper (correlation-aware) ─────────────────────────────

async function forward(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (INTERNAL_SECRET) headers['X-Internal-Secret'] = INTERNAL_SECRET;

    // fetchWithCorrelation auto-injects x-correlation-id from AsyncLocalStorage,
    // so the Factory's own logs can be joined to the cockpit's trace thread.
    const res = await fetchWithCorrelation(`${FACTORY_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ac.signal,
    });
    const text = await res.text();
    let json: unknown;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { ok: res.ok, status: res.status, body: json };
  } finally {
    clearTimeout(timer);
  }
}

async function deleteDirect(path: string): Promise<{ ok: boolean; status: number }> {
  const res = await fetchWithCorrelation(`${FACTORY_URL}${path}`, {
    method: 'DELETE',
    headers: INTERNAL_SECRET ? { 'X-Internal-Secret': INTERNAL_SECRET } : undefined,
  }).catch(() => null);
  return { ok: !!res?.ok, status: res?.status ?? 0 };
}

// ─── Core handler (wrapped by withRateLimit on export) ───────────────────────

initSentryServer();

async function coreHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Bind correlation_id for the entire request's async scope. Inbound header
  // wins; else a fresh UUID is minted. fetchWithCorrelation reads this
  // automatically on outbound fetches.
  const correlationId = resolveCorrelationId(req as unknown as { headers?: Record<string, unknown> });

  await runWithCorrelation(correlationId, async () => {
    const { log } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
    const scopedLog = log.child({ handler: 'factory', correlation_id: correlationId });

    try { res.setHeader('x-correlation-id', correlationId); } catch { /* headers already sent */ }
    const start = Date.now();
    scopedLog.info({ event: 'request_in' });
    res.on('finish', () => {
      scopedLog.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - start });
    });
    res.on('close', () => {
      if (!res.writableEnded) {
        scopedLog.warn({ event: 'request_abort', duration_ms: Date.now() - start });
      }
    });

    const userId = await requireAuth(req, res);
    if (!userId) return;

    const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string | undefined;
    const params = { ...req.query, ...(req.body || {}) } as Record<string, unknown>;

    try {
      switch (action) {
        case 'ping': {
          const r = await forward('GET', '/ping');
          res.status(r.ok ? 200 : 503).json({ factory: r.body, factoryUrl: FACTORY_URL });
          return;
        }
        case 'heartbeat': {
          const emit = params.emit === 'false' ? 'false' : 'true';
          const r = await forward('GET', `/heartbeat?emit=${emit}`);
          res.status(r.ok ? 200 : 503).json({
            ok: r.ok, status: r.status, heartbeat: r.body, factoryUrl: FACTORY_URL,
          });
          return;
        }
        case 'flows': {
          const r = await forward('GET', '/flows');
          res.status(r.ok ? 200 : 503).json({
            ok: r.ok, flows: (r.body as { flows?: string[] } | null)?.flows ?? [],
          });
          return;
        }
        case 'events': {
          const limit = Number(params.limit ?? 50);
          const r = await forward('GET', `/events?limit=${Number.isFinite(limit) ? limit : 50}`);
          res.status(r.ok ? 200 : 503).json({
            ok: r.ok, events: (r.body as { events?: unknown[] } | null)?.events ?? [],
          });
          return;
        }
        case 'events-clear': {
          const del = await deleteDirect('/events');
          res.status(del.ok ? 200 : 503).json({ cleared: del.ok });
          return;
        }
        case 'bus': {
          const limit = Number(params.limit ?? 100);
          const typePrefix = typeof params.typePrefix === 'string'
            ? `&typePrefix=${encodeURIComponent(params.typePrefix)}` : '';
          const source = typeof params.source === 'string'
            ? `&source=${encodeURIComponent(params.source)}` : '';
          const r = await forward(
            'GET',
            `/bus?limit=${Number.isFinite(limit) ? limit : 100}${typePrefix}${source}`,
          );
          res.status(r.ok ? 200 : 503).json({
            ok: r.ok, events: (r.body as { events?: unknown[] } | null)?.events ?? [],
          });
          return;
        }
        case 'capabilities': {
          const r = await forward('GET', '/capabilities');
          res.status(r.ok ? 200 : 503).json(r.body);
          return;
        }
        case 'list-jobs': {
          const r = await forward('GET', '/jobs');
          res.status(r.ok ? 200 : 503).json({
            ok: r.ok, jobs: (r.body as { jobs?: unknown[] } | null)?.jobs ?? [],
          });
          return;
        }
        case 'schedule-job': {
          const r = await forward('POST', '/jobs', params);
          res.status(r.ok ? 200 : (r.status || 502)).json(r.body);
          return;
        }
        case 'delete-job': {
          const id = params.id as string | undefined;
          if (!id) { res.status(400).json({ error: 'id required' }); return; }
          const del = await deleteDirect(`/jobs/${encodeURIComponent(id)}`);
          res.status(del.ok ? 200 : 502).json({ deleted: del.ok });
          return;
        }
        case 'run-job': {
          const id = params.id as string | undefined;
          if (!id) { res.status(400).json({ error: 'id required' }); return; }
          const r = await forward('POST', `/jobs/${encodeURIComponent(id)}/run`);
          res.status(r.ok ? 200 : (r.status || 502)).json(r.body);
          return;
        }
        case 'invoke': {
          const flowName = params.flowName as string | undefined;
          if (!flowName) { res.status(400).json({ error: 'flowName required' }); return; }
          const input = (params.input as unknown) ?? {};
          const r = await forward('POST', `/invoke/${encodeURIComponent(flowName)}`, input);
          res.status(r.ok ? 200 : (r.status || 502)).json(r.body);
          return;
        }
        default:
          res.status(400).json({
            error: `Unknown action: ${action ?? '(missing)'}. Expected: ping | heartbeat | flows | events | events-clear | bus | capabilities | list-jobs | schedule-job | delete-job | run-job | invoke`,
          });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      // Most common local-dev cause: Factory process not running.
      const hint = msg.includes('ECONNREFUSED') || msg.includes('fetch failed')
        ? ` (Factory unreachable at ${FACTORY_URL} — start with 'pnpm dev' in c:/Users/moust/mcv)`
        : '';

      scopedLog.error({ event: 'factory_error', action, err: msg });
      captureHandlerError(err, { correlation_id: correlationId, handler: 'factory' });

      if (!res.headersSent) {
        res.status(503).json({
          error: `factory-proxy: ${msg}${hint}`,
          factoryUrl: FACTORY_URL,
          correlation_id: correlationId,
        });
      }
    }
  });
}

export default withRateLimit(FACTORY_RATE_LIMIT)(coreHandler);
