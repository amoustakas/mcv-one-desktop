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

export const manifest: KitManifest = {
  id: 'sendgrid-email', name: 'SendGrid Email', version: '1.0.0',
  description: 'SendGrid — transactional & marketing email, templates, contacts, lists, delivery stats.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use sendgrid tools for email delivery, template management, contact lists, and delivery analytics.',
  tools: [
    { name: 'sendgrid_send', description: 'Send an email.', input_schema: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' }, subject: { type: 'string' }, text: { type: 'string' }, html: { type: 'string' } }, required: ['from', 'to', 'subject'] } },
    { name: 'sendgrid_templates', description: 'List email templates.', input_schema: { type: 'object', properties: {} } },
    { name: 'sendgrid_stats', description: 'Get email delivery stats (30 days).', input_schema: { type: 'object', properties: {} } },
    { name: 'sendgrid_overview', description: 'SendGrid overview: deliveries, opens, clicks.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  sendgrid_send: sendEmail, sendgrid_templates: listTemplates, sendgrid_stats: getStats, sendgrid_overview: sgOverview,
};
