import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function tgApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'POST') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/telegram?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Telegram error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Telegram error'); }
  return r.json();
}

const sendMessage: KitToolHandler = async (input, ctx) => {
  const d = await tgApi('send-message', { chatId: input.chatId, text: input.text, parseMode: input.parseMode }, ctx);
  return { success: true, data: d, displayMarkdown: `Telegram sent to ${input.chatId}: "${(input.text as string).slice(0, 80)}"` };
};
const sendPhoto: KitToolHandler = async (input, ctx) => {
  const d = await tgApi('send-photo', { chatId: input.chatId, photo: input.photo, caption: input.caption }, ctx);
  return { success: true, data: d, displayMarkdown: `Photo sent to ${input.chatId}` };
};
const getChat: KitToolHandler = async (input, ctx) => {
  const d = await tgApi('get-chat', { chatId: input.chatId }, ctx, 'GET');
  return { success: true, data: d, displayMarkdown: `## Chat: ${d.title || d.first_name || d.id}\n\n- **Type:** ${d.type}\n- **Members:** ${d.member_count || 'N/A'}\n- **Description:** ${d.description || 'none'}` };
};
const sendPoll: KitToolHandler = async (input, ctx) => {
  const d = await tgApi('send-poll', { chatId: input.chatId, question: input.question, options: input.options }, ctx);
  return { success: true, data: d, displayMarkdown: `Poll sent: "${input.question}"` };
};
const setCommands: KitToolHandler = async (input, ctx) => {
  const d = await tgApi('set-commands', { commands: input.commands }, ctx);
  return { success: true, data: d, displayMarkdown: `Bot commands updated (${(input.commands as unknown[])?.length || 0} commands)` };
};
const tgOverview: KitToolHandler = async (_i, ctx) => {
  const d = await tgApi('overview', {}, ctx, 'GET');
  return { success: true, data: d, displayMarkdown: `## Telegram Bot\n\n- **Name:** ${d.bot_name}\n- **Username:** @${d.username}\n- **Webhook:** ${d.webhook_url}\n- **Pending Updates:** ${d.pending_updates}` };
};

export const manifest: KitManifest = {
  id: 'telegram-comms', name: 'Telegram Bot', version: '1.0.0',
  description: 'Telegram — messages, photos, documents, polls, inline keyboards, moderation, bot commands, and webhooks.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use telegram tools for bot messaging, group management, polls, moderation (ban/unban/pin), and webhook configuration.',
  tools: [
    { name: 'telegram_send', description: 'Send a Telegram message (supports HTML/Markdown).', input_schema: { type: 'object', properties: { chatId: { type: 'string' }, text: { type: 'string' }, parseMode: { type: 'string', description: 'HTML or MarkdownV2' } }, required: ['chatId', 'text'] } },
    { name: 'telegram_send_photo', description: 'Send a photo to a chat.', input_schema: { type: 'object', properties: { chatId: { type: 'string' }, photo: { type: 'string', description: 'URL to image' }, caption: { type: 'string' } }, required: ['chatId', 'photo'] } },
    { name: 'telegram_get_chat', description: 'Get chat/group/channel info.', input_schema: { type: 'object', properties: { chatId: { type: 'string' } }, required: ['chatId'] } },
    { name: 'telegram_send_poll', description: 'Send a poll.', input_schema: { type: 'object', properties: { chatId: { type: 'string' }, question: { type: 'string' }, options: { type: 'array', description: 'Array of answer strings' } }, required: ['chatId', 'question', 'options'] } },
    { name: 'telegram_set_commands', description: 'Set bot slash commands.', input_schema: { type: 'object', properties: { commands: { type: 'array', description: 'Array of {command, description}' } }, required: ['commands'] } },
    { name: 'telegram_overview', description: 'Bot overview: name, username, webhook status.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  telegram_send: sendMessage, telegram_send_photo: sendPhoto, telegram_get_chat: getChat,
  telegram_send_poll: sendPoll, telegram_set_commands: setCommands, telegram_overview: tgOverview,
};
