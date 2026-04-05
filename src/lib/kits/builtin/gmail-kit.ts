import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function gmailApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const query = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const res = await ctx.fetch(`/api/gmail?${query}`);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Gmail ${res.status}`); }
    return res.json();
  }
  const res = await ctx.fetch('/api/gmail', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Gmail ${res.status}`); }
  return res.json();
}

const searchEmails: KitToolHandler = async (input, ctx) => {
  const data = await gmailApi('search', { q: input.query, maxResults: input.limit ?? 10 }, ctx);
  const msgs = data.messages ?? [];
  const lines = msgs.map((m: { subject: string; from: string; date: string; snippet: string }) =>
    `- **${m.subject}** — from ${m.from} (${m.date})\n  ${(m.snippet || '').slice(0, 80)}...`);
  return { success: true, data: msgs, displayMarkdown: `## Gmail Search: "${input.query}" (${msgs.length} results)\n\n${lines.join('\n')}` };
};

const getMessage: KitToolHandler = async (input, ctx) => {
  const data = await gmailApi('get-message', { id: input.id }, ctx);
  const p = data._parsed;
  return { success: true, data, displayMarkdown: `## ${p?.subject || 'No Subject'}\n\n**From:** ${p?.from}\n**To:** ${p?.to}\n**Date:** ${p?.date}\n\n${(p?.body || '').slice(0, 2000)}` };
};

const listLabels: KitToolHandler = async (_input, ctx) => {
  const data = await gmailApi('list-labels', {}, ctx);
  const labels = data.labels ?? [];
  const lines = labels.map((l: { name: string; id: string; type: string }) => `- **${l.name}** (\`${l.id}\`) — ${l.type}`);
  return { success: true, data: labels, displayMarkdown: `## Labels (${labels.length})\n\n${lines.join('\n')}` };
};

const sendEmail: KitToolHandler = async (input, ctx) => {
  const data = await gmailApi('send', { to: input.to, subject: input.subject, body: input.body }, ctx, 'POST');
  return { success: true, data, displayMarkdown: `Email sent to ${input.to}: "${input.subject}"` };
};

const gmailOverview: KitToolHandler = async (_input, ctx) => {
  const data = await gmailApi('overview', {}, ctx);
  return { success: true, data, displayMarkdown: `## Gmail Overview\n\n- **Email:** ${data.email}\n- **Total Messages:** ${data.messagesTotal?.toLocaleString()}\n- **Inbox:** ${data.inboxMessages}\n- **Unread:** ${data.unreadMessages}` };
};

export const manifest: KitManifest = {
  id: 'gmail-comms',
  name: 'Gmail',
  version: '1.0.0',
  description: 'Gmail — search, read, send, labels, threads, and inbox management.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use gmail tools for email search, reading messages, sending emails, and inbox overview. Requires Google OAuth with gmail scopes.',
  tools: [
    { name: 'gmail_search', description: 'Search Gmail messages.', input_schema: { type: 'object', properties: { query: { type: 'string', description: 'Gmail search query (e.g. "from:john subject:invoice")' }, limit: { type: 'number' } }, required: ['query'] } },
    { name: 'gmail_get_message', description: 'Read a full email by ID.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'gmail_list_labels', description: 'List all Gmail labels.', input_schema: { type: 'object', properties: {} } },
    { name: 'gmail_send', description: 'Send an email.', input_schema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } },
    { name: 'gmail_overview', description: 'Gmail inbox summary.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  gmail_search: searchEmails,
  gmail_get_message: getMessage,
  gmail_list_labels: listLabels,
  gmail_send: sendEmail,
  gmail_overview: gmailOverview,
};
