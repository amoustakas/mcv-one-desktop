import { requireAuth } from "./_auth";
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Kit Telemetry — Execution Audit Logging
// ---------------------------------------------------------------------------
// Logs kit tool execution events for audit, debugging, and trust scoring.

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
