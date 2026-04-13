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

const createDraft: KitToolHandler = async (input, ctx) => {
  const data = await gmailApi('create-draft', { to: input.to, subject: input.subject, body: input.body }, ctx, 'POST');
  return { success: true, data, displayMarkdown: `Draft created: "${input.subject}" to ${input.to}` };
};

const archiveMessage: KitToolHandler = async (input, ctx) => {
  const data = await gmailApi('modify', { id: input.id, removeLabelIds: ['INBOX'] }, ctx, 'POST');
  return { success: true, data, displayMarkdown: `Message archived.` };
};

const modifyLabels: KitToolHandler = async (input, ctx) => {
  const data = await gmailApi('modify', { id: input.id, addLabelIds: input.add_labels, removeLabelIds: input.remove_labels }, ctx, 'POST');
  return { success: true, data, displayMarkdown: `Labels updated on message ${input.id}.` };
};

const trashMessage: KitToolHandler = async (input, ctx) => {
  const data = await gmailApi('trash', { id: input.id }, ctx, 'POST');
  return { success: true, data, displayMarkdown: `Message moved to trash.` };
};

const listThreads: KitToolHandler = async (input, ctx) => {
  const data = await gmailApi('search', { q: input.query || 'in:inbox', maxResults: input.limit ?? 10 }, ctx);
  const threads = data.messages ?? [];
  return { success: true, data: threads, displayMarkdown: `## Threads (${threads.length})\n\n${threads.map((t: { subject: string; from: string }) => `- **${t.subject}** from ${t.from}`).join('\n')}` };
};

export const manifest: KitManifest = {
  id: 'gmail-comms',
  name: 'Gmail',
  version: '2.0.0',
  description: 'Gmail — search, read, send, draft, archive, label, trash, threads, and inbox management.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use gmail tools for email search, reading, sending, drafting, archiving, labeling, and inbox overview. Requires Google OAuth with gmail.modify scope.',
  tools: [
    { name: 'gmail_search', description: 'Search Gmail messages.', input_schema: { type: 'object', properties: { query: { type: 'string', description: 'Gmail search query (e.g. "from:john subject:invoice")' }, limit: { type: 'number' } }, required: ['query'] } },
    { name: 'gmail_get_message', description: 'Read a full email by ID.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'gmail_list_labels', description: 'List all Gmail labels.', input_schema: { type: 'object', properties: {} } },
    { name: 'gmail_send', description: 'Send an email.', input_schema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } },
    { name: 'gmail_create_draft', description: 'Create a draft email without sending.', input_schema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } },
    { name: 'gmail_archive', description: 'Archive a message (remove from inbox).', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'gmail_modify_labels', description: 'Add or remove labels on a message.', input_schema: { type: 'object', properties: { id: { type: 'string' }, add_labels: { type: 'array', description: 'Label IDs to add' }, remove_labels: { type: 'array', description: 'Label IDs to remove' } }, required: ['id'] } },
    { name: 'gmail_trash', description: 'Move a message to trash.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'gmail_list_threads', description: 'List conversation threads.', input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } } },
    { name: 'gmail_overview', description: 'Gmail inbox summary — email, totals, unread count.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  gmail_search: searchEmails,
  gmail_get_message: getMessage,
  gmail_list_labels: listLabels,
  gmail_send: sendEmail,
  gmail_create_draft: createDraft,
  gmail_archive: archiveMessage,
  gmail_modify_labels: modifyLabels,
  gmail_trash: trashMessage,
  gmail_list_threads: listThreads,
  gmail_overview: gmailOverview,
};
