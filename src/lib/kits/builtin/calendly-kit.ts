import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function calApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/calendly?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Calendly error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/calendly', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Calendly error'); }
  return r.json();
}

const listEvents: KitToolHandler = async (_i, ctx) => {
  const d = await calApi('list-scheduled-events', {}, ctx);
  const events = d.collection ?? [];
  const lines = events.map((e: { name: string; start_time: string; status: string }) =>
    `- **${e.name}** — ${new Date(e.start_time).toLocaleString()} (${e.status})`);
  return { success: true, data: events, displayMarkdown: `## Upcoming (${events.length})\n\n${lines.join('\n')}` };
};

const listEventTypes: KitToolHandler = async (_i, ctx) => {
  const d = await calApi('list-event-types', {}, ctx);
  const types = d.collection ?? [];
  const lines = types.map((t: { name: string; duration: number; scheduling_url: string; active: boolean }) =>
    `- **${t.name}** (${t.duration}min) ${t.active ? '🟢' : '⚫'} — [book](${t.scheduling_url})`);
  return { success: true, data: types, displayMarkdown: `## Event Types (${types.length})\n\n${lines.join('\n')}` };
};

const cancelEvent: KitToolHandler = async (input, ctx) => {
  await calApi('cancel-event', { eventUuid: input.eventUuid, reason: input.reason }, ctx, 'POST');
  return { success: true, data: {}, displayMarkdown: `Event ${input.eventUuid} cancelled.` };
};

const calOverview: KitToolHandler = async (_i, ctx) => {
  const d = await calApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Calendly\n\n- **Name:** ${d.name}\n- **Email:** ${d.email}\n- **Event Types:** ${d.event_types}\n- **Upcoming:** ${d.upcoming_events}\n- **Booking:** ${d.scheduling_url}` };
};

export const manifest: KitManifest = {
  id: 'calendly-scheduling', name: 'Calendly', version: '1.0.0',
  description: 'Calendly — meeting scheduling, event types, invitees, availability, and cancellations.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use calendly tools for viewing upcoming meetings, managing event types, and cancelling events.',
  tools: [
    { name: 'calendly_events', description: 'List upcoming scheduled events.', input_schema: { type: 'object', properties: {} } },
    { name: 'calendly_event_types', description: 'List event types (meeting templates).', input_schema: { type: 'object', properties: {} } },
    { name: 'calendly_cancel', description: 'Cancel a scheduled event.', input_schema: { type: 'object', properties: { eventUuid: { type: 'string' }, reason: { type: 'string' } }, required: ['eventUuid'] } },
    { name: 'calendly_overview', description: 'Calendly account overview.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  calendly_events: listEvents, calendly_event_types: listEventTypes, calendly_cancel: cancelEvent, calendly_overview: calOverview,
};
