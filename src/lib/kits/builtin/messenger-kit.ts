import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function fbApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'POST') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/messenger?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Messenger error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/messenger', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Messenger error'); }
  return r.json();
}

const sendMessage: KitToolHandler = async (input, ctx) => {
  const d = await fbApi('send-text', { recipientId: input.recipientId, text: input.text }, ctx);
  return { success: true, data: d, displayMarkdown: `Messenger sent to ${input.recipientId}: "${(input.text as string).slice(0, 80)}"` };
};
const getProfile: KitToolHandler = async (input, ctx) => {
  const d = await fbApi('get-profile', { userId: input.userId }, ctx, 'GET');
  return { success: true, data: d, displayMarkdown: `## ${d.first_name} ${d.last_name}\n\nLocale: ${d.locale} | Timezone: ${d.timezone}` };
};
const getPage: KitToolHandler = async (_i, ctx) => {
  const d = await fbApi('get-page', {}, ctx, 'GET');
  return { success: true, data: d, displayMarkdown: `## ${d.name}\n\n- **Category:** ${d.category}\n- **Fans:** ${d.fan_count?.toLocaleString()}\n- **ID:** ${d.id}` };
};
const fbOverview: KitToolHandler = async (_i, ctx) => {
  const d = await fbApi('overview', {}, ctx, 'GET');
  return { success: true, data: d, displayMarkdown: `## Messenger Overview\n\n- **Page:** ${d.page_name}\n- **Category:** ${d.category}\n- **Fans:** ${d.fans?.toLocaleString()}` };
};

export const manifest: KitManifest = {
  id: 'messenger-comms', name: 'Messenger', version: '1.0.0',
  description: 'Facebook Messenger — send messages, templates, attachments, quick replies, and page management.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use messenger tools for Facebook Messenger bot interactions, sending messages, and managing page conversations.',
  tools: [
    { name: 'messenger_send', description: 'Send a Messenger text message.', input_schema: { type: 'object', properties: { recipientId: { type: 'string' }, text: { type: 'string' } }, required: ['recipientId', 'text'] } },
    { name: 'messenger_get_profile', description: 'Get a Messenger user profile.', input_schema: { type: 'object', properties: { userId: { type: 'string' } }, required: ['userId'] } },
    { name: 'messenger_get_page', description: 'Get page info.', input_schema: { type: 'object', properties: {} } },
    { name: 'messenger_overview', description: 'Messenger page overview.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  messenger_send: sendMessage, messenger_get_profile: getProfile, messenger_get_page: getPage, messenger_overview: fbOverview,
};
