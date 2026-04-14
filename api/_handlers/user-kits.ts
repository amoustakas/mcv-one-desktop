import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient, requireAuth } from './_supabase.js';

// ---------------------------------------------------------------------------
// User Kits API — persists per-user enable/disable preferences for Kits.
// Actions: list (GET), set (POST with kit_id + enabled), bulk-set (POST array)
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ctx = await requireAuth(req, res);
  if (!ctx) return;
  const supabase = getServiceClient();
  const action = req.method === 'GET' ? 'list' : (req.body?.action || 'set');

  try {
    switch (action) {
      // ── List all kit prefs for the signed-in user ──
      case 'list': {
        const { data, error } = await supabase
          .from('user_kits')
          .select('kit_id, enabled, config, installed_at')
          .eq('user_id', ctx.userId)
          .order('installed_at', { ascending: true });
        if (error) throw error;
        return res.json({ kits: data || [] });
      }

      // ── Upsert a single kit preference ──
      case 'set': {
        const { kit_id, enabled, config } = req.body;
        if (!kit_id) return res.status(400).json({ error: 'kit_id required' });
        const row = {
          user_id: ctx.userId,
          kit_id,
          enabled: enabled === false ? false : true,
          config: config || {},
        };
        const { data, error } = await supabase
          .from('user_kits')
          .upsert(row, { onConflict: 'user_id,kit_id' })
          .select()
          .single();
        if (error) throw error;
        return res.json({ kit: data });
      }

      // ── Bulk upsert (used for initial boot sync) ──
      case 'bulk-set': {
        const prefs: Array<{ kit_id: string; enabled: boolean; config?: Record<string, unknown> }> = req.body?.kits || [];
        if (!Array.isArray(prefs) || prefs.length === 0) {
          return res.status(400).json({ error: 'kits array required' });
        }
        const rows = prefs.map(p => ({
          user_id: ctx.userId,
          kit_id: p.kit_id,
          enabled: p.enabled !== false,
          config: p.config || {},
        }));
        const { data, error } = await supabase
          .from('user_kits')
          .upsert(rows, { onConflict: 'user_id,kit_id' })
          .select();
        if (error) throw error;
        return res.json({ kits: data || [] });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
