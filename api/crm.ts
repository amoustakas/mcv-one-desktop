import { requireAuth } from "./_middleware";
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

async function notify(type: string, title: string, description: string, source: string, ventureId?: string) {
  await supabase.from('notifications').insert({ type, title, description, source, venture_id: ventureId || null });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.method === 'GET' ? req.query.action as string : req.body?.action;

  try {
    switch (action) {
      // ── Contacts ──
      case 'list-contacts': {
        const v = req.query.venture_id || req.body?.venture_id;
        let q = supabase.from('contacts').select('*').order('updated_at', { ascending: false }).limit(200);
        if (v) q = q.eq('venture_id', v);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ contacts: data });
      }
      case 'get-contact': {
        const { data, error } = await supabase
          .from('contacts').select('*').eq('id', req.body.id).single();
        if (error) throw error;
        // Fetch activities for this contact
        const { data: activities } = await supabase
          .from('activities').select('*')
          .eq('contact_id', req.body.id)
          .order('created_at', { ascending: false }).limit(50);
        // Fetch deals for this contact
        const { data: deals } = await supabase
          .from('deals').select('*')
          .eq('contact_id', req.body.id)
          .order('updated_at', { ascending: false });
        return res.json({ contact: data, activities: activities || [], deals: deals || [] });
      }
      case 'create-contact': {
        const { data, error } = await supabase.from('contacts').insert(req.body.contact).select().single();
        if (error) throw error;
        await notify('success', `New contact: ${data.name}`, data.company ? `${data.role || ''} at ${data.company}` : '', 'crm', data.venture_id);
        return res.json({ contact: data });
      }
      case 'update-contact': {
        const { id, ...updates } = req.body.contact || req.body;
        const { data, error } = await supabase.from('contacts')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id).select().single();
        if (error) throw error;
        return res.json({ contact: data });
      }
      case 'delete-contact': {
        await supabase.from('contacts').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }

      // ── Deals ──
      case 'list-deals': {
        const v = req.query.venture_id || req.body?.venture_id;
        let q = supabase.from('deals').select('*, contacts(name, company)').order('updated_at', { ascending: false }).limit(200);
        if (v) q = q.eq('venture_id', v);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ deals: data });
      }
      case 'create-deal': {
        const { data, error } = await supabase.from('deals').insert(req.body.deal).select().single();
        if (error) throw error;
        await notify('info', `New deal: ${data.title}`, `Value: $${data.value || 0}`, 'crm', data.venture_id);
        return res.json({ deal: data });
      }
      case 'update-deal': {
        const { id: dealId, ...dealUpdates } = req.body.deal || req.body;
        const { data, error } = await supabase.from('deals')
          .update({ ...dealUpdates, updated_at: new Date().toISOString() })
          .eq('id', dealId).select().single();
        if (error) throw error;
        return res.json({ deal: data });
      }
      case 'delete-deal': {
        await supabase.from('deals').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }

      // ── Activities ──
      case 'list-activities': {
        const { contact_id, deal_id, venture_id } = req.body || {};
        let q = supabase.from('activities').select('*, contacts(name)').order('created_at', { ascending: false }).limit(100);
        if (contact_id) q = q.eq('contact_id', contact_id);
        if (deal_id) q = q.eq('deal_id', deal_id);
        if (venture_id) q = q.eq('venture_id', venture_id);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ activities: data });
      }
      case 'create-activity': {
        const { data, error } = await supabase.from('activities').insert(req.body.activity).select().single();
        if (error) throw error;
        // Update contact's last_contacted
        if (req.body.activity.contact_id && ['call', 'email', 'meeting'].includes(req.body.activity.type)) {
          await supabase.from('contacts')
            .update({ last_contacted: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', req.body.activity.contact_id);
        }
        return res.json({ activity: data });
      }
      case 'delete-activity': {
        await supabase.from('activities').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }

      // ── Accounts ──
      case 'list-accounts': {
        const v = req.body?.venture_id;
        let q = supabase.from('accounts').select('*').order('updated_at', { ascending: false }).limit(200);
        if (v) q = q.eq('venture_id', v);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ accounts: data });
      }
      case 'create-account': {
        const { data, error } = await supabase.from('accounts').insert(req.body.account).select().single();
        if (error) throw error;
        return res.json({ account: data });
      }
      case 'update-account': {
        const { id: accId, ...accUpdates } = req.body.account;
        const { data, error } = await supabase.from('accounts')
          .update({ ...accUpdates, updated_at: new Date().toISOString() })
          .eq('id', accId).select().single();
        if (error) throw error;
        return res.json({ account: data });
      }
      case 'delete-account': {
        await supabase.from('accounts').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }
      case 'get-account': {
        const { data, error } = await supabase.from('accounts').select('*').eq('id', req.body.id).single();
        if (error) throw error;
        const { data: acContacts } = await supabase.from('contacts').select('*').eq('account_id', req.body.id).order('updated_at', { ascending: false });
        return res.json({ account: data, contacts: acContacts || [] });
      }

      // ── Lead Scoring ──
      case 'update-lead-score': {
        const { contact_id, lead_score, engagement_score } = req.body;
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (lead_score !== undefined) updates.lead_score = lead_score;
        if (engagement_score !== undefined) updates.engagement_score = engagement_score;
        const { data, error } = await supabase.from('contacts').update(updates).eq('id', contact_id).select().single();
        if (error) throw error;
        return res.json({ contact: data });
      }

      // ── Pipeline Analytics ──
      case 'pipeline-analytics': {
        const { data: allDeals } = await supabase.from('deals').select('stage, value, probability, created_at, updated_at');
        const stages = ['discovery', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
        const analytics = stages.map(stage => {
          const stageDeals = (allDeals || []).filter((d: { stage: string }) => d.stage === stage);
          const totalValue = stageDeals.reduce((s: number, d: { value: number }) => s + (Number(d.value) || 0), 0);
          const weightedValue = stageDeals.reduce((s: number, d: { value: number; probability: number }) => s + ((Number(d.value) || 0) * (d.probability || 0) / 100), 0);
          return { stage, count: stageDeals.length, totalValue, weightedValue };
        });
        return res.json({ analytics, totalDeals: allDeals?.length || 0 });
      }

      // ── Stats ──
      case 'stats': {
        const [contacts, deals, activities] = await Promise.all([
          supabase.from('contacts').select('type', { count: 'exact' }),
          supabase.from('deals').select('stage, value'),
          supabase.from('activities').select('type', { count: 'exact' }),
        ]);
        const totalContacts = contacts.data?.length || 0;
        const totalDeals = deals.data?.length || 0;
        const totalActivities = activities.data?.length || 0;
        const pipeline = deals.data?.reduce((sum: number, d: { value: string | number }) => sum + (parseFloat(String(d.value)) || 0), 0) || 0;
        const won = deals.data?.filter((d: { stage: string }) => d.stage === 'closed_won').reduce((sum: number, d: { value: string | number }) => sum + (parseFloat(String(d.value)) || 0), 0) || 0;
        return res.json({ totalContacts, totalDeals, totalActivities, pipeline, won });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
