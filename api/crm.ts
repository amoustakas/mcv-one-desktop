import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.method === 'GET' ? req.query.action as string : req.body?.action;

  try {
    switch (action) {
      case 'list-contacts': {
        const v = req.query.venture_id || req.body?.venture_id;
        let q = supabase.from('contacts').select('*').order('updated_at', { ascending: false }).limit(100);
        if (v) q = q.eq('venture_id', v);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ contacts: data });
      }
      case 'create-contact': {
        const { data, error } = await supabase.from('contacts').insert(req.body.contact).select().single();
        if (error) throw error;
        return res.json({ contact: data });
      }
      case 'update-contact': {
        const { id, ...updates } = req.body;
        const { data, error } = await supabase.from('contacts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (error) throw error;
        return res.json({ contact: data });
      }
      case 'delete-contact': {
        await supabase.from('contacts').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }
      case 'list-deals': {
        const v = req.query.venture_id || req.body?.venture_id;
        let q = supabase.from('deals').select('*, contacts(name, company)').order('updated_at', { ascending: false }).limit(100);
        if (v) q = q.eq('venture_id', v);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ deals: data });
      }
      case 'create-deal': {
        const { data, error } = await supabase.from('deals').insert(req.body.deal).select().single();
        if (error) throw error;
        return res.json({ deal: data });
      }
      case 'update-deal': {
        const { id: dealId, ...dealUpdates } = req.body;
        const { data, error } = await supabase.from('deals').update({ ...dealUpdates, updated_at: new Date().toISOString() }).eq('id', dealId).select().single();
        if (error) throw error;
        return res.json({ deal: data });
      }
      case 'stats': {
        const [contacts, deals] = await Promise.all([
          supabase.from('contacts').select('type', { count: 'exact' }),
          supabase.from('deals').select('stage, value'),
        ]);
        const totalContacts = contacts.data?.length || 0;
        const totalDeals = deals.data?.length || 0;
        const pipeline = deals.data?.reduce((sum: number, d: any) => sum + (parseFloat(d.value) || 0), 0) || 0;
        return res.json({ totalContacts, totalDeals, pipeline });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
