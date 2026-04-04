import { requireAuth } from "./_middleware";
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
        const { data, error } = await supabase.from('ventures').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.json({ ventures: data });
      }
      case 'get': {
        const { data, error } = await supabase.from('ventures').select('*').eq('id', req.body.id).single();
        if (error) throw error;
        return res.json({ venture: data });
      }
      case 'create': {
        const v = req.body.venture;
        const id = v.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
        const { data, error } = await supabase.from('ventures').insert({ ...v, id }).select().single();
        if (error) throw error;
        return res.json({ venture: data });
      }
      case 'update': {
        const { id, ...updates } = req.body.venture;
        const { data, error } = await supabase.from('ventures')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id).select().single();
        if (error) throw error;
        return res.json({ venture: data });
      }
      case 'delete': {
        await supabase.from('ventures').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
