import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

import { requestLogger } from '../../src/lib/server/logger';
// ---------------------------------------------------------------------------
// /api/compliance-cron — compliance runtime executor.
//
// Invoked by:
//   * Vercel cron (schedule in vercel.json) — runs hourly to drive the
//     dunning retry queue across every venture with an active dunning_config.
//   * Manual agent call — Vulcan or Athena can hit this via the compliance
//     kit's `compliance_run_cycle` tool to force an immediate sweep.
//   * `/api/compliance-cron?venture_id=X` scopes to one venture.
//
// Cron authentication: set CRON_SECRET env var; Vercel Cron sends it as
// Authorization: Bearer <CRON_SECRET>. Manual agent calls use Clerk auth.
//
// This is the missing piece that turns the existing 1,662-line compliance
// library (fraud-engine, dunning-manager, tax-engine, price-localization)
// into an actual running engine that responds to payment events.
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

function isCronRequest(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const auth = req.headers.authorization;
  return auth === `Bearer ${cronSecret}`;
}

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  // Cron bypass first
  if (isCronRequest(req)) return 'cron';

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

interface CycleResult {
  venture_id: string;
  dunning_retries_processed: number;
  dunning_recovered: number;
  dunning_exhausted: number;
  dunning_errors: number;
  duration_ms: number;
}

async function runDunningCycle(ventureId: string): Promise<CycleResult> {
  const started = Date.now();
  const result: CycleResult = {
    venture_id: ventureId,
    dunning_retries_processed: 0,
    dunning_recovered: 0,
    dunning_exhausted: 0,
    dunning_errors: 0,
    duration_ms: 0,
  };

  try {
    // Dynamic import to keep function cold-start lean.
    const { processRetries } = await import('../src/lib/compliance/dunning-manager');
    const retries = await processRetries(ventureId);

    result.dunning_retries_processed = retries.length;
    for (const r of retries) {
      if (r.recovered) result.dunning_recovered++;
      else if (r.error) result.dunning_errors++;
      // A retry that was attempted but neither recovered nor errored is
      // still in the retry queue; not 'exhausted' yet. Exhaustion happens
      // via a separate markExhausted() call downstream.
    }

    // Scan for exhausted dunning states (all retries attempted, still failing).
    const { data: exhaustedRows } = await supabase
      .from('dunning_states')
      .select('id')
      .eq('venture_id', ventureId)
      .eq('status', 'exhausted')
      .is('resolved_at', null);
    result.dunning_exhausted = exhaustedRows?.length || 0;
  } catch (err) {
    result.dunning_errors++;
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[compliance-cron] ${ventureId} dunning cycle failed:`, err);
    }
  }

  result.duration_ms = Date.now() - started;
  return result;
}

/**
 * Emit a notification for cycles that had meaningful outcomes (recovery,
 * exhaustion, or errors). Quiet otherwise.
 */
async function notifyIfInteresting(result: CycleResult): Promise<void> {
  const interesting = result.dunning_recovered + result.dunning_exhausted + result.dunning_errors;
  if (interesting === 0) return;
  try {
    await supabase.from('notifications').insert({
      type: result.dunning_errors > 0 ? 'warning' : 'info',
      title: `Dunning cycle: ${result.venture_id}`,
      description: `Processed ${result.dunning_retries_processed}: ${result.dunning_recovered} recovered, ${result.dunning_exhausted} exhausted, ${result.dunning_errors} errored`,
      source: 'compliance',
      venture_id: result.venture_id,
    });
  } catch {
    // best-effort
  }
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
  const actor = await requireAuth(req, res);
  if (!actor) return;

  const ventureIdParam = (req.query.venture_id || req.body?.venture_id) as string | undefined;

  try {
    let ventures: string[] = [];

    if (ventureIdParam) {
      ventures = [ventureIdParam];
    } else {
      // Every venture with an active dunning config.
      const { data, error } = await supabase
        .from('dunning_configs')
        .select('venture_id')
        .eq('enabled', true);
      if (error) throw error;
      ventures = Array.from(new Set((data || []).map((r: { venture_id: string }) => r.venture_id)));
    }

    const results = await Promise.all(ventures.map((v) => runDunningCycle(v)));

    // Fire best-effort notifications; don't block the response.
    void Promise.all(results.map(notifyIfInteresting));

    const summary = {
      ventures_scanned: results.length,
      total_processed: results.reduce((s, r) => s + r.dunning_retries_processed, 0),
      total_recovered: results.reduce((s, r) => s + r.dunning_recovered, 0),
      total_exhausted: results.reduce((s, r) => s + r.dunning_exhausted, 0),
      total_errors: results.reduce((s, r) => s + r.dunning_errors, 0),
    };

    return res.json({
      ok: true,
      actor,
      summary,
      results,
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error)) });
  }
}
