/**
 * GET /api/health — uptime probe for monitors, load balancers, smoke tests.
 *
 * Returns 200 + { ok: true } when DB is reachable.
 * Returns 503 + { ok: false } when DB is unreachable.
 *
 * Logging: uses console.log with correlation_id pattern for now.
 * I2.1 (pino logger) may patch this to use requestLogger once
 * src/lib/server/logger.ts lands.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

import { requestLogger } from '../../src/lib/server/logger';
// Module-level start time — persists across warm invocations.
const startedAt = Date.now();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

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
  const correlationId =
    (req.headers['x-correlation-id'] as string) ?? crypto.randomUUID();
  res.setHeader('x-correlation-id', correlationId);

  const t0 = Date.now();
  console.log(JSON.stringify({
    level: 'info',
    msg: 'health check start',
    correlation_id: correlationId,
    ts: new Date().toISOString(),
  }));

  let db_ok = false;
  let migrations_count = 0;

  try {
    // 1) Basic liveness — read one row from ventures
    const { error: venturesError } = await supabase
      .from('ventures')
      .select('id')
      .limit(1);
    db_ok = !venturesError;

    if (db_ok) {
      // 2) Migration count — try supabase_migrations schema first (service role
      //    should have access), fall back to public.schema_migrations, then skip.
      try {
        const { count, error: migError } = await supabase
          .schema('supabase_migrations')
          .from('schema_migrations')
          .select('version', { count: 'exact', head: true });
        if (!migError && count != null) {
          migrations_count = count;
        }
      } catch {
        // supabase_migrations schema not exposed via supabase-js — try public fallback
        try {
          const { count, error: pubMigError } = await supabase
            .from('schema_migrations')
            .select('version', { count: 'exact', head: true });
          if (!pubMigError && count != null) {
            migrations_count = count;
          }
        } catch {
          // Not queryable via JS client — migrations_count stays 0, not a blocker
          console.log(JSON.stringify({
            level: 'warn',
            msg: 'migrations table not queryable via supabase-js',
            correlation_id: correlationId,
          }));
        }
      }
    }
  } catch (err) {
    db_ok = false;
    console.log(JSON.stringify({
      level: 'error',
      msg: 'health DB check threw',
      correlation_id: correlationId,
      error: err instanceof Error ? err.message : String(err),
    }));
  }

  const body = {
    ok: db_ok,
    db_ok,
    migrations_count,
    active_crons: 6, // matches vercel.json cron count — update if crons change
    commit_sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? 'local',
    uptime_ms: Date.now() - startedAt,
    ts: new Date().toISOString(),
  };

  const status = db_ok ? 200 : 503;
  console.log(JSON.stringify({
    level: db_ok ? 'info' : 'warn',
    msg: 'health check complete',
    correlation_id: correlationId,
    status,
    db_ok,
    migrations_count,
    latency_ms: Date.now() - t0,
  }));

  return res.status(status).json(body);
}
