import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function postJson(url: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

function currency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

const createContact: KitToolHandler = async (input, ctx) => {
  const name = input.name as string;
  const email = (input.email as string) || undefined;
  const company = (input.company as string) || undefined;
  const data = await postJson('/api/crm', {
    action: 'create-contact',
    contact: { name, email, company },
  }, ctx);
  const c = data.contact;
  let md = `**Contact Created:** ${c?.name || name}`;
  if (c?.email || email) md += ` · ${c?.email || email}`;
  if (c?.company || company) md += ` · ${c?.company || company}`;
  return { success: true, data: c, displayMarkdown: md };
};

const listContacts: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/crm', { action: 'list-contacts' }, ctx);
  const contacts = data.contacts ?? [];
  if (contacts.length === 0) return { success: true, data: [], displayMarkdown: 'No contacts found.' };
  let md = '## Contacts\n\n| Name | Email | Company |\n|------|-------|---------|\n';
  for (const c of contacts) {
    md += `| ${c.name || '—'} | ${c.email || '—'} | ${c.company || '—'} |\n`;
  }
  return { success: true, data: contacts, displayMarkdown: md };
};

const createDeal: KitToolHandler = async (input, ctx) => {
  const title = input.title as string;
  const value = typeof input.value === 'number' ? input.value : parseFloat(String(input.value || '0'));
  const data = await postJson('/api/crm', {
    action: 'create-deal',
    deal: { title, value: value || 0 },
  }, ctx);
  const d = data.deal;
  return {
    success: true,
    data: d,
    displayMarkdown: `**Deal Created:** ${d?.title || title} — ${currency(d?.value ?? value)}`,
  };
};

const listDeals: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/crm', { action: 'list-deals' }, ctx);
  const deals = data.deals ?? [];
  if (deals.length === 0) return { success: true, data: [], displayMarkdown: 'No deals found.' };

  const grouped: Record<string, Array<{ title: string; value: number }>> = {};
  for (const d of deals) {
    const stage = d.stage || 'Unassigned';
    if (!grouped[stage]) grouped[stage] = [];
    grouped[stage].push(d);
  }

  let md = '## Deals by Stage\n\n';
  for (const [stage, items] of Object.entries(grouped)) {
    const total = items.reduce((sum, d) => sum + (d.value || 0), 0);
    md += `### ${stage} (${items.length}) — ${currency(total)}\n\n`;
    for (const d of items) md += `- **${d.title}** — ${currency(d.value)}\n`;
    md += '\n';
  }
  return { success: true, data: deals, displayMarkdown: md };
};

const viewPipeline: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/crm', { action: 'list-deals' }, ctx);
  const deals = data.deals ?? [];
  if (deals.length === 0) return { success: true, data: [], displayMarkdown: 'Pipeline is empty.' };

  const grouped: Record<string, Array<{ title: string; value: number }>> = {};
  for (const d of deals) {
    const stage = d.stage || 'Unassigned';
    if (!grouped[stage]) grouped[stage] = [];
    grouped[stage].push(d);
  }

  let md = '## Deal Pipeline\n\n| Stage | Count | Total Value |\n|-------|-------|-------------|\n';
  let grandTotal = 0;
  for (const [stage, items] of Object.entries(grouped)) {
    const total = items.reduce((sum, d) => sum + (d.value || 0), 0);
    grandTotal += total;
    md += `| ${stage} | ${items.length} | ${currency(total)} |\n`;
  }
  md += `| **Total** | **${deals.length}** | **${currency(grandTotal)}** |\n`;
  return { success: true, data: { deals, grandTotal }, displayMarkdown: md };
};

export const manifest: KitManifest = {
  id: 'crm-ops',
  name: 'CRM Operations',
  version: '1.0.0',
  description: 'Manage contacts, deals, and the sales pipeline.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about contacts, deals, the pipeline, or CRM data.',
  tools: [
    {
      name: 'create_contact',
      description: 'Create a new contact with name, optional email, and optional company.',
      input_schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Contact full name' },
          email: { type: 'string', description: 'Email address' },
          company: { type: 'string', description: 'Company name' },
        },
        required: ['name'],
      },
    },
    {
      name: 'list_contacts',
      description: 'List all contacts in the CRM.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'create_deal',
      description: 'Create a new deal with title and monetary value.',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Deal title' },
          value: { type: 'number', description: 'Deal value in USD' },
        },
        required: ['title'],
      },
    },
    {
      name: 'list_deals',
      description: 'List all deals grouped by pipeline stage.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'view_pipeline',
      description: 'Show a summary of the deal pipeline with totals per stage.',
      input_schema: { type: 'object', properties: {} },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  create_contact: createContact,
  list_contacts: listContacts,
  create_deal: createDeal,
  list_deals: listDeals,
  view_pipeline: viewPipeline,
};
