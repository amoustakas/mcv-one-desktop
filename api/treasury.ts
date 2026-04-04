import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.body?.action || req.query.action;

  try {
    switch (action) {
      case 'list': {
        const month = req.body?.month;
        let q = supabase.from('financials').select('*').order('venture_id');
        if (month) q = q.eq('month', month);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ financials: data });
      }
      case 'upsert': {
        const { venture_id, month, revenue, expenses, notes } = req.body;
        const { data, error } = await supabase.from('financials').upsert(
          { venture_id, month, revenue: revenue || 0, expenses: expenses || 0, notes: notes || '', updated_at: new Date().toISOString() },
          { onConflict: 'venture_id,month' }
        ).select().single();
        if (error) throw error;
        return res.json({ financial: data });
      }
      case 'summary': {
        const { data, error } = await supabase.from('financials').select('venture_id, month, revenue, expenses').order('month', { ascending: false });
        if (error) throw error;
        return res.json({ financials: data });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
