import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function msApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/microsoft-graph?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Outlook error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/microsoft-graph', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Outlook error'); }
  return r.json();
}

const listMail: KitToolHandler = async (input, ctx) => {
  const d = await msApi('list-mail', { top: input.limit ?? 15, folder: input.folder }, ctx);
  const msgs = d.value ?? [];
  const lines = msgs.map((m: { subject: string; from: { emailAddress: { name: string } }; receivedDateTime: string; isRead: boolean; bodyPreview: string }) =>
    `- ${m.isRead ? '' : '🔵 '}**${m.subject}** — ${m.from?.emailAddress?.name} (${new Date(m.receivedDateTime).toLocaleDateString()})\n  ${m.bodyPreview?.slice(0, 80)}`);
  return { success: true, data: msgs, displayMarkdown: `## Inbox (${msgs.length})\n\n${lines.join('\n')}` };
};

const getMail: KitToolHandler = async (input, ctx) => {
  const d = await msApi('get-mail', { id: input.id }, ctx);
  return { success: true, data: d, displayMarkdown: `## ${d.subject}\n\n**From:** ${d.from?.emailAddress?.name} (${d.from?.emailAddress?.address})\n**Date:** ${new Date(d.receivedDateTime).toLocaleString()}\n\n${d.body?.content?.replace(/<[^>]*>/g, '').slice(0, 3000) || ''}` };
};

const sendMail: KitToolHandler = async (input, ctx) => {
  const d = await msApi('send-mail', { to: input.to, subject: input.subject, body: input.body, cc: input.cc, importance: input.importance }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Email sent to ${input.to}: "${input.subject}"` };
};

const searchMail: KitToolHandler = async (input, ctx) => {
  const d = await msApi('search-mail', { query: input.query, top: input.limit ?? 10 }, ctx);
  const msgs = d.value ?? [];
  const lines = msgs.map((m: { subject: string; from: { emailAddress: { name: string } }; bodyPreview: string }) =>
    `- **${m.subject}** — ${m.from?.emailAddress?.name}\n  ${m.bodyPreview?.slice(0, 80)}`);
  return { success: true, data: msgs, displayMarkdown: `## Search: "${input.query}" (${msgs.length})\n\n${lines.join('\n')}` };
};

const listEvents: KitToolHandler = async (input, ctx) => {
  const d = await msApi('list-events', { top: input.limit ?? 10 }, ctx);
  const events = d.value ?? [];
  const lines = events.map((e: { subject: string; start: { dateTime: string }; end: { dateTime: string }; location: { displayName: string }; webLink: string }) =>
    `- **${e.subject}** — ${new Date(e.start?.dateTime).toLocaleString()} → ${new Date(e.end?.dateTime).toLocaleTimeString()}${e.location?.displayName ? ` @ ${e.location.displayName}` : ''}`);
  return { success: true, data: events, displayMarkdown: `## Upcoming Events (${events.length})\n\n${lines.join('\n')}` };
};

const createEvent: KitToolHandler = async (input, ctx) => {
  const d = await msApi('create-event', { subject: input.subject, start: input.start, end: input.end, location: input.location, body: input.body, attendees: input.attendees }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Event created: **${d.subject}** — ${d.start?.dateTime}${d.webLink ? `\n[Open](${d.webLink})` : ''}` };
};

const listContacts: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('list-contacts', {}, ctx);
  const contacts = d.value ?? [];
  const lines = contacts.map((c: { displayName: string; emailAddresses: { address: string }[]; companyName: string; jobTitle: string }) =>
    `- **${c.displayName}** — ${c.emailAddresses?.[0]?.address || 'no email'} (${c.companyName || ''} ${c.jobTitle || ''})`);
  return { success: true, data: contacts, displayMarkdown: `## Contacts (${contacts.length})\n\n${lines.join('\n')}` };
};

export const manifest: KitManifest = {
  id: 'microsoft-outlook', name: 'Microsoft Outlook', version: '1.0.0',
  description: 'Outlook — email (read, send, search), calendar (events, create), contacts, and mail folders.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use outlook tools for Microsoft 365 email, calendar, and contacts. Covers the full Outlook experience.',
  tools: [
    { name: 'outlook_inbox', description: 'List inbox emails.', input_schema: { type: 'object', properties: { limit: { type: 'number' }, folder: { type: 'string', description: 'inbox, sentitems, drafts, deleteditems' } } } },
    { name: 'outlook_read', description: 'Read a full email by ID.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'outlook_send', description: 'Send an email via Outlook.', input_schema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' }, cc: { type: 'string' }, importance: { type: 'string' } }, required: ['to', 'subject', 'body'] } },
    { name: 'outlook_search', description: 'Search emails.', input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
    { name: 'outlook_events', description: 'List upcoming calendar events.', input_schema: { type: 'object', properties: { limit: { type: 'number' } } } },
    { name: 'outlook_create_event', description: 'Create a calendar event with optional Teams meeting.', input_schema: { type: 'object', properties: { subject: { type: 'string' }, start: { type: 'string' }, end: { type: 'string' }, location: { type: 'string' }, attendees: { type: 'array' } }, required: ['subject', 'start', 'end'] } },
    { name: 'outlook_contacts', description: 'List Outlook contacts.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  outlook_inbox: listMail, outlook_read: getMail, outlook_send: sendMail, outlook_search: searchMail,
  outlook_events: listEvents, outlook_create_event: createEvent, outlook_contacts: listContacts,
};
