import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function calApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/google-calendar?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Calendar error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/google-calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Calendar error'); }
  return r.json();
}

const listEvents: KitToolHandler = async (input, ctx) => {
  const d = await calApi('list-events', { maxResults: input.limit ?? 10, q: input.query }, ctx);
  const events = d.items ?? [];
  const lines = events.map((e: { summary: string; start: { dateTime?: string; date?: string }; location: string }) =>
    `- **${e.summary}** — ${e.start?.dateTime || e.start?.date || 'TBD'}${e.location ? ` @ ${e.location}` : ''}`);
  return { success: true, data: events, displayMarkdown: `## Upcoming Events (${events.length})\n\n${lines.join('\n')}` };
};

const createEvent: KitToolHandler = async (input, ctx) => {
  const d = await calApi('create-event', { summary: input.summary, description: input.description, start: input.start, end: input.end, location: input.location, attendees: input.attendees }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Event created: **${d.summary}** — ${d.start?.dateTime || d.start?.date}` };
};

const quickAdd: KitToolHandler = async (input, ctx) => {
  const d = await calApi('quick-add', { text: input.text }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Quick event added: **${d.summary}**` };
};

const calOverview: KitToolHandler = async (_i, ctx) => {
  const d = await calApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Calendar Overview\n\n- **Calendars:** ${d.calendar_count}\n- **Upcoming (7d):** ${d.upcoming_events}\n- **Next:** ${d.next_event || 'Nothing scheduled'} at ${d.next_event_time || 'N/A'}` };
};

const listCalendars: KitToolHandler = async (_i, ctx) => {
  const d = await calApi('list-calendars', {}, ctx);
  const cals = d.items ?? [];
  const lines = cals.map((c: { summary: string; id: string; primary?: boolean }) =>
    `- **${c.summary}**${c.primary ? ' (primary)' : ''}`);
  return { success: true, data: cals, displayMarkdown: `## Calendars (${cals.length})\n\n${lines.join('\n')}` };
};

const findFreeTime: KitToolHandler = async (input, ctx) => {
  const timeMin = input.timeMin || new Date().toISOString();
  const timeMax = input.timeMax || new Date(Date.now() + 7 * 86400000).toISOString();
  const d = await calApi('free-busy', { timeMin, timeMax, items: [{ id: 'primary' }] }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `## Free/Busy\n\nChecked ${timeMin} to ${timeMax}.\n\n${JSON.stringify(d.calendars?.primary?.busy ?? [], null, 2)}` };
};

export const manifest: KitManifest = {
  id: 'google-calendar', name: 'Google Calendar', version: '2.0.0',
  description: 'Google Calendar — events, scheduling, free/busy, quick-add, calendars, and calendar management.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use calendar tools for scheduling, viewing upcoming events, creating meetings, checking free time, and managing calendars. Requires Google OAuth with calendar scope.',
  tools: [
    { name: 'gcal_list_events', description: 'List upcoming calendar events.', input_schema: { type: 'object', properties: { limit: { type: 'number' }, query: { type: 'string', description: 'Search text in events' } } } },
    { name: 'gcal_create_event', description: 'Create a new calendar event.', input_schema: { type: 'object', properties: { summary: { type: 'string' }, description: { type: 'string' }, start: { type: 'string', description: 'ISO datetime' }, end: { type: 'string', description: 'ISO datetime' }, location: { type: 'string' }, attendees: { type: 'array', description: 'Array of email strings' } }, required: ['summary', 'start', 'end'] } },
    { name: 'gcal_quick_add', description: 'Quick-add event from natural language text.', input_schema: { type: 'object', properties: { text: { type: 'string', description: 'e.g. "Meeting with Tony at 3pm tomorrow"' } }, required: ['text'] } },
    { name: 'gcal_list_calendars', description: 'List all calendars.', input_schema: { type: 'object', properties: {} } },
    { name: 'gcal_find_free_time', description: 'Check free/busy status for a time range.', input_schema: { type: 'object', properties: { timeMin: { type: 'string', description: 'ISO datetime start' }, timeMax: { type: 'string', description: 'ISO datetime end' } } } },
    { name: 'gcal_overview', description: 'Calendar summary: calendars, upcoming events, next event.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  gcal_list_events: listEvents,
  gcal_create_event: createEvent,
  gcal_quick_add: quickAdd,
  gcal_list_calendars: listCalendars,
  gcal_find_free_time: findFreeTime,
  gcal_overview: calOverview,
};
