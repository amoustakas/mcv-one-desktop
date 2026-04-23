/**
 * /api/domain-registry — read access to the authoritative owned-domains table.
 *
 * Actions:
 *   - list         → all domains, ordered by expires_at asc (nearest expiry first)
 *   - expiring     → domains expiring within `days` (default 90)
 *   - by-venture   → filter to a specific venture_id
 *   - stats        → aggregate counts (total, expired, expiring-30d, expiring-90d)
 *
 * Seeded nightly (eventually) by scripts/seed-domain-registry.ts.
 * Schema: supabase/migration-domain-registry-2026-04-17.sql.
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';

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
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log, correlationId } = requestLogger(
    req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string }
  );
  try { res.setHeader('x-correlation-id', correlationId); } catch { /* already sent */ }
  const start = Date.now();
  log.info({ event: 'request_in' });
  res.on('finish', () => {
    log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - start });
  });

  const userId = await requireAuth(req, res);
  if (!userId) return;

  const action =
    req.method === 'GET' ? (req.query.action as string | undefined) : req.body?.action;

  if (!action) {
    return res.json({
      ok: true,
      service: 'domain-registry',
      actions: ['list', 'expiring', 'by-venture', 'stats'],
    });
  }

  try {
    switch (action) {
      // ── All domains ──
      case 'list': {
        const { data, error } = await supabase
          .from('domain_registry')
          .select('*')
          .order('expires_at', { ascending: true, nullsFirst: false });
        if (error) throw error;
        return res.json({ domains: data ?? [] });
      }

      // ── Expiring soon ──
      case 'expiring': {
        const days = Number(req.query.days ?? req.body?.days ?? 90);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + days);
        const { data, error } = await supabase
          .from('domain_registry')
          .select('*')
          .lte('expires_at', cutoff.toISOString().slice(0, 10))
          .order('expires_at', { ascending: true, nullsFirst: false });
        if (error) throw error;
        return res.json({ domains: data ?? [], days });
      }

      // ── By venture ──
      case 'by-venture': {
        const ventureId = (req.query.venture_id as string) || req.body?.venture_id;
        if (!ventureId) return res.status(400).json({ error: 'venture_id required' });
        const { data, error } = await supabase
          .from('domain_registry')
          .select('*')
          .eq('venture_id', ventureId)
          .order('expires_at', { ascending: true, nullsFirst: false });
        if (error) throw error;
        return res.json({ domains: data ?? [] });
      }

      // ── Stats ──
      case 'stats': {
        const [all, expired, exp30, exp90] = await Promise.all([
          supabase.from('domain_registry').select('id', { count: 'exact', head: true }),
          supabase.from('domain_registry').select('id', { count: 'exact', head: true }).eq('status', 'expired'),
          statsExpiringWithin(30),
          statsExpiringWithin(90),
        ]);
        return res.json({
          total: all.count ?? 0,
          expired: expired.count ?? 0,
          expiring_30d: exp30,
          expiring_90d: exp90,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ event: 'handler_error', error: message });
    return res.status(500).json({ error: message });
  }
}

async function statsExpiringWithin(days: number): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  const { count } = await supabase
    .from('domain_registry')
    .select('id', { count: 'exact', head: true })
    .lte('expires_at', cutoff.toISOString().slice(0, 10))
    .neq('status', 'expired');
  return count ?? 0;
}
