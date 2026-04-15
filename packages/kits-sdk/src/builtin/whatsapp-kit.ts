import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function waApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const r = await ctx.fetch('/api/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'WhatsApp error'); }
  return r.json();
}

const sendText: KitToolHandler = async (input, ctx) => {
  const d = await waApi('send-text', { to: input.to, text: input.text }, ctx);
  return { success: true, data: d, displayMarkdown: `WhatsApp sent to ${input.to}: "${(input.text as string).slice(0, 80)}"` };
};
const sendTemplate: KitToolHandler = async (input, ctx) => {
  const d = await waApi('send-template', { to: input.to, templateName: input.templateName, languageCode: input.language }, ctx);
  return { success: true, data: d, displayMarkdown: `Template "${input.templateName}" sent to ${input.to}` };
};
const sendImage: KitToolHandler = async (input, ctx) => {
  const d = await waApi('send-image', { to: input.to, imageUrl: input.imageUrl, caption: input.caption }, ctx);
  return { success: true, data: d, displayMarkdown: `Image sent to ${input.to}` };
};
const listTemplates: KitToolHandler = async (_i, ctx) => {
  const d = await waApi('list-templates', {}, ctx);
  const templates = d.data ?? [];
  const lines = templates.map((t: { name: string; status: string; category: string; language: string }) =>
    `- **${t.name}** — ${t.status} (${t.category}) — ${t.language}`);
  return { success: true, data: templates, displayMarkdown: `## WhatsApp Templates (${templates.length})\n\n${lines.join('\n')}` };
};
const getProfile: KitToolHandler = async (_i, ctx) => {
  const d = await waApi('get-profile', {}, ctx);
  const p = d.data?.[0] || {};
  return { success: true, data: p, displayMarkdown: `## WhatsApp Business Profile\n\n- **About:** ${p.about || 'N/A'}\n- **Vertical:** ${p.vertical || 'N/A'}\n- **Email:** ${p.email || 'N/A'}` };
};
const waOverview: KitToolHandler = async (_i, ctx) => {
  const d = await waApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## WhatsApp Overview\n\n- **Number:** ${d.phone_number}\n- **Name:** ${d.verified_name}\n- **Quality:** ${d.quality}` };
};

export const manifest: KitManifest = {
  id: 'whatsapp-comms', name: 'WhatsApp Business', version: '1.0.0',
  description: 'WhatsApp Business — text messages, templates, images, documents, interactive messages, and business profile.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use whatsapp tools for business messaging, template campaigns, media sharing, and customer communication.',
  tools: [
    { name: 'whatsapp_send_text', description: 'Send a WhatsApp text message.', input_schema: { type: 'object', properties: { to: { type: 'string', description: 'Phone number with country code' }, text: { type: 'string' } }, required: ['to', 'text'] } },
    { name: 'whatsapp_send_template', description: 'Send a pre-approved template message.', input_schema: { type: 'object', properties: { to: { type: 'string' }, templateName: { type: 'string' }, language: { type: 'string' } }, required: ['to', 'templateName'] } },
    { name: 'whatsapp_send_image', description: 'Send an image via WhatsApp.', input_schema: { type: 'object', properties: { to: { type: 'string' }, imageUrl: { type: 'string' }, caption: { type: 'string' } }, required: ['to', 'imageUrl'] } },
    { name: 'whatsapp_list_templates', description: 'List message templates.', input_schema: { type: 'object', properties: {} } },
    { name: 'whatsapp_get_profile', description: 'Get business profile info.', input_schema: { type: 'object', properties: {} } },
    { name: 'whatsapp_overview', description: 'WhatsApp Business overview.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  whatsapp_send_text: sendText, whatsapp_send_template: sendTemplate, whatsapp_send_image: sendImage,
  whatsapp_list_templates: listTemplates, whatsapp_get_profile: getProfile, whatsapp_overview: waOverview,
};
