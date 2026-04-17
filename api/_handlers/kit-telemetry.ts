import { createClient } from '@supabase/supabase-js';
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


// ---------------------------------------------------------------------------
// Kit Telemetry — Execution Audit Logging
// ---------------------------------------------------------------------------
// Logs kit tool execution events for audit, debugging, and trust scoring.

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
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
  const userId = await requireAuth(req, res);
  if (!userId) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = req.body?.action;

  try {
    switch (action) {
      // Log a tool execution event
      case 'log': {
        const { kitId, toolName, durationMs, success, errorMessage } = req.body;

        if (!kitId || !toolName) {
          return res.status(400).json({ error: 'kitId and toolName required' });
        }

        const { error } = await supabase.from('kit_audit_log').insert({
          user_id: userId,
          kit_id: kitId,
          tool_name: toolName,
          duration_ms: durationMs || 0,
          success: success ?? true,
          error_message: errorMessage || null,
        });

        if (error) throw error;
        return res.json({ success: true });
      }

      // Get recent audit logs for the current user
      case 'list': {
        const limit = Math.min(Number(req.body?.limit) || 50, 200);
        const kitId = req.body?.kitId as string | undefined;

        let query = supabase
          .from('kit_audit_log')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (kitId) {
          query = query.eq('kit_id', kitId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return res.json({ logs: data || [] });
      }

      // Get execution stats per kit
      case 'stats': {
        const { data, error } = await supabase
          .from('kit_audit_log')
          .select('kit_id, tool_name, success, duration_ms')
          .eq('user_id', userId);

        if (error) throw error;

        const logs = data || [];
        const stats: Record<string, {
          total: number;
          successes: number;
          failures: number;
          avgDuration: number;
        }> = {};

        for (const log of logs) {
          if (!stats[log.kit_id]) {
            stats[log.kit_id] = { total: 0, successes: 0, failures: 0, avgDuration: 0 };
          }
          const s = stats[log.kit_id];
          s.total++;
          if (log.success) s.successes++;
          else s.failures++;
          s.avgDuration = (s.avgDuration * (s.total - 1) + (log.duration_ms || 0)) / s.total;
        }

        return res.json({ stats });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error));
    return res.status(500).json({ error: message });
  }
}
