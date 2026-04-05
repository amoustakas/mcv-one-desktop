import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function resendApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/resend?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Resend error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Resend error'); }
  return r.json();
}

const sendEmail: KitToolHandler = async (input, ctx) => {
  const d = await resendApi('send', { from: input.from, to: input.to, subject: input.subject, html: input.html, text: input.text }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Email sent via Resend to ${input.to}: "${input.subject}" (ID: ${d.id})` };
};
const listDomains: KitToolHandler = async (_i, ctx) => {
  const d = await resendApi('list-domains', {}, ctx);
  const domains = d.data ?? [];
  const lines = domains.map((dm: { name: string; status: string; region: string }) => `- **${dm.name}** — ${dm.status} (${dm.region})`);
  return { success: true, data: domains, displayMarkdown: `## Domains (${domains.length})\n\n${lines.join('\n')}` };
};
const listAudiences: KitToolHandler = async (_i, ctx) => {
  const d = await resendApi('list-audiences', {}, ctx);
  const audiences = d.data ?? [];
  const lines = audiences.map((a: { name: string; id: string }) => `- **${a.name}** (\`${a.id}\`)`);
  return { success: true, data: audiences, displayMarkdown: `## Audiences (${audiences.length})\n\n${lines.join('\n')}` };
};
const resendOverview: KitToolHandler = async (_i, ctx) => {
  const d = await resendApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Resend Overview\n\n- **Domains:** ${d.domains}\n- **Audiences:** ${d.audiences}\n- **API Keys:** ${d.api_keys}` };
};

const createDomain: KitToolHandler = async (input, ctx) => {
  const d = await resendApi('create-domain', { name: input.name, region: input.region }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Domain created: **${input.name}** (region: ${input.region || 'us-east-1'})` };
};

const deleteDomain: KitToolHandler = async (input, ctx) => {
  const d = await resendApi('delete-domain', { id: input.id }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Domain \`${input.id}\` deleted.` };
};

const deleteAudience: KitToolHandler = async (input, ctx) => {
  const d = await resendApi('delete-audience', { id: input.id }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Audience \`${input.id}\` deleted.` };
};

const removeContact: KitToolHandler = async (input, ctx) => {
  const d = await resendApi('remove-contact', { audienceId: input.audienceId, contactId: input.contactId }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Contact \`${input.contactId}\` removed from audience \`${input.audienceId}\`.` };
};

const createBroadcast: KitToolHandler = async (input, ctx) => {
  const d = await resendApi('create-broadcast', { audienceId: input.audienceId, from: input.from, subject: input.subject, html: input.html }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Broadcast created: "${input.subject}" for audience \`${input.audienceId}\`` };
};

const sendBroadcast: KitToolHandler = async (input, ctx) => {
  const d = await resendApi('send-broadcast', { id: input.id }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Broadcast \`${input.id}\` sent.` };
};

export const manifest: KitManifest = {
  id: 'resend-email', name: 'Resend Email', version: '2.0.0',
  description: 'Resend — developer email API, domains, audiences, contacts, broadcasts.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use resend tools for transactional email, domain management, audience building, and contact management.',
  tools: [
    { name: 'resend_send', description: 'Send an email via Resend.', input_schema: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' }, subject: { type: 'string' }, html: { type: 'string' }, text: { type: 'string' } }, required: ['from', 'to', 'subject'] } },
    { name: 'resend_domains', description: 'List verified domains.', input_schema: { type: 'object', properties: {} } },
    { name: 'resend_audiences', description: 'List audiences.', input_schema: { type: 'object', properties: {} } },
    { name: 'resend_overview', description: 'Resend account overview.', input_schema: { type: 'object', properties: {} } },
    { name: 'resend_create_domain', description: 'Add a sending domain.', input_schema: { type: 'object', properties: { name: { type: 'string', description: 'Domain name' }, region: { type: 'string', description: 'e.g. us-east-1, eu-west-1' } }, required: ['name'] } },
    { name: 'resend_delete_domain', description: 'Delete a domain by ID.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'resend_delete_audience', description: 'Delete an audience by ID.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'resend_remove_contact', description: 'Remove a contact from an audience.', input_schema: { type: 'object', properties: { audienceId: { type: 'string' }, contactId: { type: 'string' } }, required: ['audienceId', 'contactId'] } },
    { name: 'resend_create_broadcast', description: 'Create a broadcast email.', input_schema: { type: 'object', properties: { audienceId: { type: 'string' }, from: { type: 'string' }, subject: { type: 'string' }, html: { type: 'string' } }, required: ['audienceId', 'from', 'subject', 'html'] } },
    { name: 'resend_send_broadcast', description: 'Send a broadcast by ID.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  resend_send: sendEmail, resend_domains: listDomains, resend_audiences: listAudiences, resend_overview: resendOverview,
  resend_create_domain: createDomain, resend_delete_domain: deleteDomain,
  resend_delete_audience: deleteAudience, resend_remove_contact: removeContact,
  resend_create_broadcast: createBroadcast, resend_send_broadcast: sendBroadcast,
};
