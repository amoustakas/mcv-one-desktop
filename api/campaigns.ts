import { requireAuth } from "./_auth";
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.body?.action || req.query.action;

  try {
    switch (action) {
      case 'list': {
        const v = req.body?.venture_id;
        let q = supabase.from('campaigns').select('*').order('updated_at', { ascending: false }).limit(200);
        if (v) q = q.eq('venture_id', v);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ campaigns: data });
      }
      case 'create': {
        const { data, error } = await supabase.from('campaigns').insert(req.body.campaign).select().single();
        if (error) throw error;
        return res.json({ campaign: data });
      }
      case 'update': {
        const { id, ...updates } = req.body.campaign;
        const { data, error } = await supabase.from('campaigns')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id).select().single();
        if (error) throw error;
        return res.json({ campaign: data });
      }
      case 'delete': {
        await supabase.from('campaigns').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }
      case 'stats': {
        const { data } = await supabase.from('campaigns').select('status, budget, reach, conversions');
        const total = data?.length || 0;
        const active = data?.filter((c: { status: string }) => c.status === 'active').length || 0;
        const budget = data?.reduce((s: number, c: { budget: number }) => s + (c.budget || 0), 0) || 0;
        const reach = data?.reduce((s: number, c: { reach: number }) => s + (c.reach || 0), 0) || 0;
        return res.json({ total, active, budget, reach });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
