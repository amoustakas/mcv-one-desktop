import { requireAuth } from './_auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// HubSpot CRM API v3 — contacts, deals, companies, tickets, pipelines, owners
// ---------------------------------------------------------------------------

const HS_API = 'https://api.hubapi.com';
const API_KEY = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_API_KEY || '';

async function hsFetch(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${HS_API}${path}${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `HubSpot ${res.status}`); }
  return res.json();
}

async function hsPost(path: string, body: unknown) {
  const res = await fetch(`${HS_API}${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `HubSpot ${res.status}`); }
  return res.json();
}

async function hsPatch(path: string, body: unknown) {
  const res = await fetch(`${HS_API}${path}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `HubSpot ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!API_KEY) return res.status(500).json({ error: 'HUBSPOT_ACCESS_TOKEN not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Contacts ──
      case 'list-contacts': {
        const { limit = '20', after } = req.query;
        const params: Record<string, string> = { limit: limit as string, properties: 'firstname,lastname,email,phone,company,lifecyclestage,createdate' };
        if (after) params.after = after as string;
        return res.json(await hsFetch('/crm/v3/objects/contacts', params));
      }

      case 'get-contact': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await hsFetch(`/crm/v3/objects/contacts/${id}`, {
          properties: 'firstname,lastname,email,phone,company,jobtitle,lifecyclestage,hs_lead_status',
        }));
      }

      case 'create-contact': {
        const { email, firstName, lastName, phone, company } = req.body;
        if (!email) return res.status(400).json({ error: 'email required' });
        return res.json(await hsPost('/crm/v3/objects/contacts', {
          properties: { email, firstname: firstName, lastname: lastName, phone, company },
        }));
      }

      case 'update-contact': {
        const { id, properties } = req.body;
        if (!id || !properties) return res.status(400).json({ error: 'id and properties required' });
        return res.json(await hsPatch(`/crm/v3/objects/contacts/${id}`, { properties }));
      }

      case 'search-contacts': {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'query required' });
        return res.json(await hsPost('/crm/v3/objects/contacts/search', {
          filterGroups: [{ filters: [{ propertyName: 'email', operator: 'CONTAINS_TOKEN', value: query }] }],
          properties: ['firstname', 'lastname', 'email', 'phone', 'company'],
          limit: 20,
        }));
      }

      // ── Deals ──
      case 'list-deals': {
        const { limit = '20', after } = req.query;
        const params: Record<string, string> = { limit: limit as string, properties: 'dealname,amount,dealstage,closedate,pipeline,hubspot_owner_id' };
        if (after) params.after = after as string;
        return res.json(await hsFetch('/crm/v3/objects/deals', params));
      }

      case 'get-deal': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await hsFetch(`/crm/v3/objects/deals/${id}`, {
          properties: 'dealname,amount,dealstage,closedate,pipeline,hubspot_owner_id,description',
        }));
      }

      case 'create-deal': {
        const { dealname, amount, dealstage, pipeline, closedate } = req.body;
        if (!dealname) return res.status(400).json({ error: 'dealname required' });
        return res.json(await hsPost('/crm/v3/objects/deals', {
          properties: { dealname, amount: amount?.toString(), dealstage, pipeline, closedate },
        }));
      }

      case 'update-deal': {
        const { id, properties } = req.body;
        if (!id || !properties) return res.status(400).json({ error: 'id and properties required' });
        return res.json(await hsPatch(`/crm/v3/objects/deals/${id}`, { properties }));
      }

      // ── Companies ──
      case 'list-companies': {
        const { limit = '20' } = req.query;
        return res.json(await hsFetch('/crm/v3/objects/companies', {
          limit: limit as string, properties: 'name,domain,industry,numberofemployees,annualrevenue',
        }));
      }

      case 'get-company': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await hsFetch(`/crm/v3/objects/companies/${id}`, {
          properties: 'name,domain,industry,numberofemployees,annualrevenue,city,state,country,description',
        }));
      }

      // ── Tickets ──
      case 'list-tickets': {
        const { limit = '20' } = req.query;
        return res.json(await hsFetch('/crm/v3/objects/tickets', {
          limit: limit as string, properties: 'subject,content,hs_pipeline_stage,hs_ticket_priority,createdate',
        }));
      }

      case 'create-ticket': {
        const { subject, content, pipeline, pipelineStage, priority } = req.body;
        if (!subject) return res.status(400).json({ error: 'subject required' });
        return res.json(await hsPost('/crm/v3/objects/tickets', {
          properties: { subject, content, hs_pipeline: pipeline, hs_pipeline_stage: pipelineStage, hs_ticket_priority: priority },
        }));
      }

      // ── Pipelines ──
      case 'list-pipelines': {
        const { objectType = 'deals' } = req.query;
        return res.json(await hsFetch(`/crm/v3/pipelines/${objectType}`));
      }

      // ── Owners ──
      case 'list-owners':
        return res.json(await hsFetch('/crm/v3/owners'));

      // ── Overview ──
      case 'overview': {
        const [contacts, deals, companies, tickets] = await Promise.all([
          hsFetch('/crm/v3/objects/contacts', { limit: '1' }),
          hsFetch('/crm/v3/objects/deals', { limit: '1' }),
          hsFetch('/crm/v3/objects/companies', { limit: '1' }),
          hsFetch('/crm/v3/objects/tickets', { limit: '1' }),
        ]);
        return res.json({
          contacts: contacts.total ?? 0,
          deals: deals.total ?? 0,
          companies: companies.total ?? 0,
          tickets: tickets.total ?? 0,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
