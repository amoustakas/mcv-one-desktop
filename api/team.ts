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
        const { data, error } = await supabase.from('team_members').select('*').order('role').order('name');
        if (error) throw error;
        return res.json({ members: data });
      }
      case 'get': {
        const { data, error } = await supabase.from('team_members').select('*').eq('id', req.body.id).single();
        if (error) throw error;
        return res.json({ member: data });
      }
      case 'create': {
        const { data, error } = await supabase.from('team_members').insert(req.body.member).select().single();
        if (error) throw error;
        return res.json({ member: data });
      }
      case 'update': {
        const { id, ...updates } = req.body.member;
        const { data, error } = await supabase.from('team_members')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id).select().single();
        if (error) throw error;
        return res.json({ member: data });
      }
      case 'delete': {
        await supabase.from('team_members').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }
      case 'assign-ventures': {
        const { id, venture_assignments } = req.body;
        const { data, error } = await supabase.from('team_members')
          .update({ venture_assignments, updated_at: new Date().toISOString() })
          .eq('id', id).select().single();
        if (error) throw error;
        return res.json({ member: data });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
