import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function hsApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/hubspot?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'HubSpot error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/hubspot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'HubSpot error'); }
  return r.json();
}

const listContacts: KitToolHandler = async (input, ctx) => {
  const d = await hsApi('list-contacts', { limit: input.limit ?? 20 }, ctx);
  const contacts = d.results ?? [];
  const lines = contacts.map((c: { properties: { firstname: string; lastname: string; email: string; company: string } }) =>
    `- **${c.properties.firstname || ''} ${c.properties.lastname || ''}** — ${c.properties.email} (${c.properties.company || 'N/A'})`);
  return { success: true, data: contacts, displayMarkdown: `## Contacts (${d.total ?? contacts.length})\n\n${lines.join('\n')}` };
};

const searchContacts: KitToolHandler = async (input, ctx) => {
  const d = await hsApi('search-contacts', { query: input.query }, ctx, 'POST');
  const contacts = d.results ?? [];
  const lines = contacts.map((c: { properties: { firstname: string; lastname: string; email: string } }) =>
    `- **${c.properties.firstname || ''} ${c.properties.lastname || ''}** — ${c.properties.email}`);
  return { success: true, data: contacts, displayMarkdown: `## Search: "${input.query}" (${contacts.length})\n\n${lines.join('\n')}` };
};

const createContact: KitToolHandler = async (input, ctx) => {
  const d = await hsApi('create-contact', { email: input.email, firstName: input.firstName, lastName: input.lastName, phone: input.phone, company: input.company }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Contact created: **${input.firstName} ${input.lastName}** (${input.email})` };
};

const listDeals: KitToolHandler = async (input, ctx) => {
  const d = await hsApi('list-deals', { limit: input.limit ?? 15 }, ctx);
  const deals = d.results ?? [];
  const lines = deals.map((dl: { properties: { dealname: string; amount: string; dealstage: string; closedate: string } }) =>
    `- **${dl.properties.dealname}** — $${dl.properties.amount || '?'} — ${dl.properties.dealstage} (close: ${dl.properties.closedate || 'TBD'})`);
  return { success: true, data: deals, displayMarkdown: `## Deals (${d.total ?? deals.length})\n\n${lines.join('\n')}` };
};

const createDeal: KitToolHandler = async (input, ctx) => {
  const d = await hsApi('create-deal', { dealname: input.name, amount: input.amount, dealstage: input.stage, pipeline: input.pipeline }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Deal created: **${input.name}** ($${input.amount || '?'})` };
};

const listCompanies: KitToolHandler = async (input, ctx) => {
  const d = await hsApi('list-companies', { limit: input.limit ?? 15 }, ctx);
  const companies = d.results ?? [];
  const lines = companies.map((c: { properties: { name: string; domain: string; industry: string; annualrevenue: string } }) =>
    `- **${c.properties.name}** (${c.properties.domain || 'N/A'}) — ${c.properties.industry || 'N/A'} — $${c.properties.annualrevenue || '?'}`);
  return { success: true, data: companies, displayMarkdown: `## Companies (${d.total ?? companies.length})\n\n${lines.join('\n')}` };
};

const listTickets: KitToolHandler = async (input, ctx) => {
  const d = await hsApi('list-tickets', { limit: input.limit ?? 15 }, ctx);
  const tickets = d.results ?? [];
  const lines = tickets.map((t: { properties: { subject: string; hs_pipeline_stage: string; hs_ticket_priority: string } }) =>
    `- **${t.properties.subject}** — ${t.properties.hs_pipeline_stage} (${t.properties.hs_ticket_priority || 'normal'})`);
  return { success: true, data: tickets, displayMarkdown: `## Tickets (${d.total ?? tickets.length})\n\n${lines.join('\n')}` };
};

const hsOverview: KitToolHandler = async (_i, ctx) => {
  const d = await hsApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## HubSpot CRM Overview\n\n- **Contacts:** ${d.contacts}\n- **Deals:** ${d.deals}\n- **Companies:** ${d.companies}\n- **Tickets:** ${d.tickets}` };
};

export const manifest: KitManifest = {
  id: 'hubspot-crm', name: 'HubSpot CRM', version: '1.0.0',
  description: 'HubSpot — contacts, deals, companies, tickets, pipelines, owners, and CRM search.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use hubspot tools for enterprise CRM: contacts, deals pipeline, company research, ticket management, and sales analytics.',
  tools: [
    { name: 'hubspot_contacts', description: 'List CRM contacts.', input_schema: { type: 'object', properties: { limit: { type: 'number' } } } },
    { name: 'hubspot_search_contacts', description: 'Search contacts by email.', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    { name: 'hubspot_create_contact', description: 'Create a new contact.', input_schema: { type: 'object', properties: { email: { type: 'string' }, firstName: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' }, company: { type: 'string' } }, required: ['email'] } },
    { name: 'hubspot_deals', description: 'List deals pipeline.', input_schema: { type: 'object', properties: { limit: { type: 'number' } } } },
    { name: 'hubspot_create_deal', description: 'Create a new deal.', input_schema: { type: 'object', properties: { name: { type: 'string' }, amount: { type: 'number' }, stage: { type: 'string' }, pipeline: { type: 'string' } }, required: ['name'] } },
    { name: 'hubspot_companies', description: 'List companies.', input_schema: { type: 'object', properties: { limit: { type: 'number' } } } },
    { name: 'hubspot_tickets', description: 'List support tickets.', input_schema: { type: 'object', properties: { limit: { type: 'number' } } } },
    { name: 'hubspot_overview', description: 'HubSpot CRM overview: contacts, deals, companies, tickets.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  hubspot_contacts: listContacts, hubspot_search_contacts: searchContacts, hubspot_create_contact: createContact,
  hubspot_deals: listDeals, hubspot_create_deal: createDeal, hubspot_companies: listCompanies,
  hubspot_tickets: listTickets, hubspot_overview: hsOverview,
};
