import { requireAuth } from './_auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// SendGrid API v3 — send email, templates, contacts, stats, suppressions
// ---------------------------------------------------------------------------

const SG_API = 'https://api.sendgrid.com/v3';
const API_KEY = process.env.SENDGRID_API_KEY || '';

async function sgFetch(path: string, options?: { method?: string; body?: unknown }) {
  const res = await fetch(`${SG_API}${path}`, {
    method: options?.method || 'GET',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.errors?.[0]?.message || `SendGrid ${res.status}`); }
  if (res.status === 202 || res.status === 204) return { success: true };
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!API_KEY) return res.status(500).json({ error: 'SENDGRID_API_KEY not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      case 'send': {
        const { to, from, subject, text, html, templateId, dynamicTemplateData } = req.body;
        if (!to || !from || (!subject && !templateId)) return res.status(400).json({ error: 'to, from, and subject (or templateId) required' });
        const msg: Record<string, unknown> = {
          personalizations: [{ to: Array.isArray(to) ? to.map((e: string) => ({ email: e })) : [{ email: to }] }],
          from: typeof from === 'string' ? { email: from } : from,
        };
        if (templateId) {
          msg.template_id = templateId;
          if (dynamicTemplateData) (msg.personalizations as Record<string, unknown>[])[0].dynamic_template_data = dynamicTemplateData;
        } else {
          msg.subject = subject;
          msg.content = [html ? { type: 'text/html', value: html } : { type: 'text/plain', value: text }];
        }
        return res.json(await sgFetch('/mail/send', { method: 'POST', body: msg }));
      }

      case 'list-templates':
        return res.json(await sgFetch('/templates?generations=dynamic&page_size=50'));

      case 'get-template': {
        const { templateId } = req.query;
        if (!templateId) return res.status(400).json({ error: 'templateId required' });
        return res.json(await sgFetch(`/templates/${templateId}`));
      }

      case 'list-contacts': {
        const { pageSize = '50' } = req.query;
        return res.json(await sgFetch(`/marketing/contacts?page_size=${pageSize}`));
      }

      case 'search-contacts': {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'query required' });
        return res.json(await sgFetch('/marketing/contacts/search', { method: 'POST', body: { query } }));
      }

      case 'add-contacts': {
        const { contacts, listIds } = req.body;
        if (!contacts) return res.status(400).json({ error: 'contacts array required' });
        return res.json(await sgFetch('/marketing/contacts', { method: 'PUT', body: { contacts, list_ids: listIds } }));
      }

      case 'list-lists':
        return res.json(await sgFetch('/marketing/lists?page_size=50'));

      case 'global-stats': {
        const { startDate, endDate } = req.query;
        const start = (startDate as string) || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const end = (endDate as string) || new Date().toISOString().split('T')[0];
        return res.json(await sgFetch(`/stats?start_date=${start}&end_date=${end}&aggregated_by=day`));
      }

      case 'list-suppressions':
        return res.json(await sgFetch('/suppression/bounces?limit=50'));

      case 'list-blocks':
        return res.json(await sgFetch('/suppression/blocks?limit=50'));

      case 'sender-identities':
        return res.json(await sgFetch('/verified_senders'));

      // ── Contact Management ──
      case 'create-contact': {
        const { contacts } = req.body;
        if (!contacts || !Array.isArray(contacts)) return res.status(400).json({ error: 'contacts array required' });
        return res.json(await sgFetch('/marketing/contacts', { method: 'PUT', body: { contacts } }));
      }
      case 'delete-contacts': {
        const { ids } = req.body;
        if (!ids) return res.status(400).json({ error: 'ids required' });
        const idsParam = Array.isArray(ids) ? ids.join(',') : ids;
        return res.json(await sgFetch(`/marketing/contacts?ids=${encodeURIComponent(idsParam)}`, { method: 'DELETE' }));
      }

      // ── List Management ──
      case 'create-list': {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        return res.json(await sgFetch('/marketing/lists', { method: 'POST', body: { name } }));
      }
      case 'delete-list': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await sgFetch(`/marketing/lists/${id}`, { method: 'DELETE' }));
      }
      case 'add-to-list': {
        const { id, contact_ids } = req.body;
        if (!id || !contact_ids) return res.status(400).json({ error: 'id and contact_ids required' });
        return res.json(await sgFetch(`/marketing/lists/${id}/contacts`, { method: 'PUT', body: { contact_ids } }));
      }

      // ── Campaign Management ──
      case 'create-campaign': {
        const { name, sender_id, subject, html_content } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        return res.json(await sgFetch('/marketing/singlesends', {
          method: 'POST', body: { name, sender_id, email_config: { subject, html_content } },
        }));
      }
      case 'update-campaign': {
        const { id, ...updates } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await sgFetch(`/marketing/singlesends/${id}`, { method: 'PATCH', body: updates }));
      }
      case 'send-campaign': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await sgFetch(`/marketing/singlesends/${id}/schedule`, {
          method: 'PUT', body: { send_at: 'now' },
        }));
      }
      case 'delete-campaign': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await sgFetch(`/marketing/singlesends/${id}`, { method: 'DELETE' }));
      }

      // ── Sender Management ──
      case 'create-sender': {
        const { from, reply_to, nickname, address, city, country } = req.body;
        if (!from) return res.status(400).json({ error: 'from required (email and name)' });
        return res.json(await sgFetch('/marketing/senders', {
          method: 'POST', body: { from, reply_to, nickname, address, city, country },
        }));
      }
      case 'verify-sender': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await sgFetch(`/marketing/senders/${id}/resend_verification`, { method: 'POST' }));
      }

      // ── Suppression Management ──
      case 'list-suppressions-bounces':
        return res.json(await sgFetch('/suppression/bounces?limit=50'));

      case 'delete-bounce': {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'email required' });
        return res.json(await sgFetch(`/suppression/bounces/${encodeURIComponent(email)}`, { method: 'DELETE' }));
      }

      case 'overview': {
        const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const end = new Date().toISOString().split('T')[0];
        const [stats, senders] = await Promise.all([
          sgFetch(`/stats?start_date=${start}&end_date=${end}`),
          sgFetch('/verified_senders'),
        ]);
        const totals = (Array.isArray(stats) ? stats : []).reduce((acc: Record<string, number>, d: { stats: Array<{ metrics: Record<string, number> }> }) => {
          const m = d.stats?.[0]?.metrics || {};
          acc.requests = (acc.requests || 0) + (m.requests || 0);
          acc.delivered = (acc.delivered || 0) + (m.delivered || 0);
          acc.opens = (acc.opens || 0) + (m.opens || 0);
          acc.clicks = (acc.clicks || 0) + (m.clicks || 0);
          return acc;
        }, {});
        return res.json({ ...totals, verified_senders: senders.results?.length ?? 0 });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
