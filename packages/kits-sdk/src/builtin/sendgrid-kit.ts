import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function sgApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/sendgrid?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'SendGrid error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/sendgrid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'SendGrid error'); }
  return r.json();
}

const sendEmail: KitToolHandler = async (input, ctx) => {
  const d = await sgApi('send', { from: input.from, to: input.to, subject: input.subject, text: input.text, html: input.html }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Email sent to ${input.to}: "${input.subject}"` };
};
const listTemplates: KitToolHandler = async (_i, ctx) => {
  const d = await sgApi('list-templates', {}, ctx);
  const templates = d.result ?? d.templates ?? [];
  const lines = templates.map((t: { name: string; id: string }) => `- **${t.name}** (\`${t.id}\`)`);
  return { success: true, data: templates, displayMarkdown: `## Email Templates (${templates.length})\n\n${lines.join('\n')}` };
};
const getStats: KitToolHandler = async (_i, ctx) => {
  const d = await sgApi('global-stats', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## SendGrid Stats (30d)\n\n\`\`\`json\n${JSON.stringify(d, null, 2).slice(0, 2000)}\n\`\`\`` };
};
const sgOverview: KitToolHandler = async (_i, ctx) => {
  const d = await sgApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## SendGrid Overview (7d)\n\n- **Requests:** ${d.requests?.toLocaleString()}\n- **Delivered:** ${d.delivered?.toLocaleString()}\n- **Opens:** ${d.opens?.toLocaleString()}\n- **Clicks:** ${d.clicks?.toLocaleString()}\n- **Senders:** ${d.verified_senders}` };
};

const createContact: KitToolHandler = async (input, ctx) => {
  const d = await sgApi('create-contact', { email: input.email, first_name: input.firstName, last_name: input.lastName }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Contact created: **${input.firstName || ''} ${input.lastName || ''}** (${input.email})` };
};

const createList: KitToolHandler = async (input, ctx) => {
  const d = await sgApi('create-list', { name: input.name }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `List created: **${input.name}**` };
};

const deleteList: KitToolHandler = async (input, ctx) => {
  const d = await sgApi('delete-list', { id: input.id }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `List \`${input.id}\` deleted.` };
};

const createCampaign: KitToolHandler = async (input, ctx) => {
  const d = await sgApi('create-campaign', { name: input.name, sender_id: input.senderId, subject: input.subject, html_content: input.html }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Campaign created: **${input.name}** — subject: "${input.subject}"` };
};

const sendCampaign: KitToolHandler = async (input, ctx) => {
  const d = await sgApi('send-campaign', { id: input.id }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Campaign \`${input.id}\` sent.` };
};

const createSender: KitToolHandler = async (input, ctx) => {
  const d = await sgApi('create-sender', { email: input.email, name: input.name }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Sender created: **${input.name}** (${input.email})` };
};

const verifySender: KitToolHandler = async (input, ctx) => {
  const d = await sgApi('verify-sender', { id: input.id }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Sender \`${input.id}\` verification initiated.` };
};

const deleteBounce: KitToolHandler = async (input, ctx) => {
  const d = await sgApi('delete-bounce', { email: input.email }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Bounce record deleted for ${input.email}.` };
};

export const manifest: KitManifest = {
  id: 'sendgrid-email', name: 'SendGrid Email', version: '2.0.0',
  description: 'SendGrid — transactional & marketing email, templates, contacts, lists, delivery stats.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use sendgrid tools for email delivery, template management, contact lists, and delivery analytics.',
  tools: [
    { name: 'sendgrid_send', description: 'Send an email.', input_schema: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' }, subject: { type: 'string' }, text: { type: 'string' }, html: { type: 'string' } }, required: ['from', 'to', 'subject'] } },
    { name: 'sendgrid_templates', description: 'List email templates.', input_schema: { type: 'object', properties: {} } },
    { name: 'sendgrid_stats', description: 'Get email delivery stats (30 days).', input_schema: { type: 'object', properties: {} } },
    { name: 'sendgrid_overview', description: 'SendGrid overview: deliveries, opens, clicks.', input_schema: { type: 'object', properties: {} } },
    { name: 'sendgrid_create_contact', description: 'Add a contact to SendGrid.', input_schema: { type: 'object', properties: { email: { type: 'string' }, firstName: { type: 'string' }, lastName: { type: 'string' } }, required: ['email'] } },
    { name: 'sendgrid_create_list', description: 'Create a contact list.', input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
    { name: 'sendgrid_delete_list', description: 'Delete a contact list.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'sendgrid_create_campaign', description: 'Create a single-send campaign.', input_schema: { type: 'object', properties: { name: { type: 'string' }, senderId: { type: 'number' }, subject: { type: 'string' }, html: { type: 'string' } }, required: ['name', 'senderId', 'subject', 'html'] } },
    { name: 'sendgrid_send_campaign', description: 'Send a campaign by ID.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'sendgrid_create_sender', description: 'Create a verified sender identity.', input_schema: { type: 'object', properties: { email: { type: 'string' }, name: { type: 'string' } }, required: ['email', 'name'] } },
    { name: 'sendgrid_verify_sender', description: 'Initiate sender verification.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'sendgrid_delete_bounce', description: 'Delete a bounce record for an email.', input_schema: { type: 'object', properties: { email: { type: 'string' } }, required: ['email'] } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  sendgrid_send: sendEmail, sendgrid_templates: listTemplates, sendgrid_stats: getStats, sendgrid_overview: sgOverview,
  sendgrid_create_contact: createContact, sendgrid_create_list: createList, sendgrid_delete_list: deleteList,
  sendgrid_create_campaign: createCampaign, sendgrid_send_campaign: sendCampaign,
  sendgrid_create_sender: createSender, sendgrid_verify_sender: verifySender, sendgrid_delete_bounce: deleteBounce,
};
