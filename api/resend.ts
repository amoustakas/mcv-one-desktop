import { requireAuth } from './_auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Resend API — send email, domains, API keys, audiences, contacts, broadcasts
// ---------------------------------------------------------------------------

const RESEND_API = 'https://api.resend.com';
const API_KEY = process.env.RESEND_API_KEY || '';

async function resendFetch(path: string, options?: { method?: string; body?: unknown }) {
  const res = await fetch(`${RESEND_API}${path}`, {
    method: options?.method || 'GET',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Resend ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      case 'send': {
        const { from, to, subject, html, text, replyTo, cc, bcc, tags } = req.body;
        if (!from || !to || !subject) return res.status(400).json({ error: 'from, to, subject required' });
        return res.json(await resendFetch('/emails', {
          method: 'POST', body: { from, to: Array.isArray(to) ? to : [to], subject, html, text, reply_to: replyTo, cc, bcc, tags },
        }));
      }

      case 'get-email': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await resendFetch(`/emails/${id}`));
      }

      case 'batch-send': {
        const { emails } = req.body;
        if (!emails || !Array.isArray(emails)) return res.status(400).json({ error: 'emails array required' });
        return res.json(await resendFetch('/emails/batch', { method: 'POST', body: emails }));
      }

      case 'list-domains':
        return res.json(await resendFetch('/domains'));

      case 'get-domain': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await resendFetch(`/domains/${id}`));
      }

      case 'add-domain': {
        const { name, region = 'us-east-1' } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        return res.json(await resendFetch('/domains', { method: 'POST', body: { name, region } }));
      }

      case 'verify-domain': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await resendFetch(`/domains/${id}/verify`, { method: 'POST' }));
      }

      case 'list-api-keys':
        return res.json(await resendFetch('/api-keys'));

      case 'list-audiences':
        return res.json(await resendFetch('/audiences'));

      case 'get-audience': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await resendFetch(`/audiences/${id}`));
      }

      case 'create-audience': {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        return res.json(await resendFetch('/audiences', { method: 'POST', body: { name } }));
      }

      case 'add-contact': {
        const { audienceId, email, firstName, lastName, unsubscribed } = req.body;
        if (!audienceId || !email) return res.status(400).json({ error: 'audienceId and email required' });
        return res.json(await resendFetch(`/audiences/${audienceId}/contacts`, {
          method: 'POST', body: { email, first_name: firstName, last_name: lastName, unsubscribed },
        }));
      }

      case 'list-contacts': {
        const { audienceId } = req.query;
        if (!audienceId) return res.status(400).json({ error: 'audienceId required' });
        return res.json(await resendFetch(`/audiences/${audienceId}/contacts`));
      }

      case 'list-broadcasts':
        return res.json(await resendFetch('/broadcasts'));

      case 'overview': {
        const [domains, audiences, keys] = await Promise.all([
          resendFetch('/domains'),
          resendFetch('/audiences'),
          resendFetch('/api-keys'),
        ]);
        return res.json({
          domains: domains.data?.length ?? 0,
          audiences: audiences.data?.length ?? 0,
          api_keys: keys.data?.length ?? 0,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
