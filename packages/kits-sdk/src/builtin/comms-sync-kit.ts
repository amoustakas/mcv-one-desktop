import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function syncApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const r = await ctx.fetch('/api/comms-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Comms sync error'); }
  return r.json();
}

const syncEmails: KitToolHandler = async (_i, ctx) => {
  const d = await syncApi('sync-emails', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Email Sync\n\nSynced ${d.synced ?? '?'} emails. AI-classified and routed to CRM/docs.` };
};

const syncCalls: KitToolHandler = async (_i, ctx) => {
  const d = await syncApi('sync-calls', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Call Sync\n\nSynced ${d.synced ?? '?'} call records from Twilio.` };
};

const syncCalendar: KitToolHandler = async (_i, ctx) => {
  const d = await syncApi('sync-calendar', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Calendar Sync\n\nSynced ${d.synced ?? '?'} upcoming events. Prep tasks created.` };
};

const syncMessaging: KitToolHandler = async (_i, ctx) => {
  const d = await syncApi('sync-messaging', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Messaging Sync\n\nSynced ${d.synced ?? '?'} Slack messages + contacts.` };
};

const syncSocial: KitToolHandler = async (_i, ctx) => {
  const d = await syncApi('sync-social', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Social Sync\n\nSynced engagement data from X/YouTube into daily digest.` };
};

const fullSync: KitToolHandler = async (_i, ctx) => {
  const d = await syncApi('full-sync', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Full Comms Sync Complete\n\n\`\`\`json\n${JSON.stringify(d, null, 2).slice(0, 2000)}\n\`\`\`` };
};

export const manifest: KitManifest = {
  id: 'comms-sync', name: 'Communications Sync', version: '1.0.0',
  description: 'Comms Sync — synchronize emails, calls, calendar, Slack messages, and social media into the MCV CRM and knowledge base.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use comms-sync tools to pull data from Gmail, Twilio, Google Calendar, Slack, and X/YouTube into the unified MCV pipeline. Full sync orchestrates all channels.',
  tools: [
    { name: 'comms_sync_emails', description: 'Sync Gmail: AI-classify, route to CRM/docs.', input_schema: { type: 'object', properties: {} } },
    { name: 'comms_sync_calls', description: 'Sync Twilio call records to CRM activities.', input_schema: { type: 'object', properties: {} } },
    { name: 'comms_sync_calendar', description: 'Sync Google Calendar → prep tasks + meeting notes.', input_schema: { type: 'object', properties: {} } },
    { name: 'comms_sync_messaging', description: 'Sync Slack messages + users into CRM.', input_schema: { type: 'object', properties: {} } },
    { name: 'comms_sync_social', description: 'Sync X/YouTube engagement into daily digest.', input_schema: { type: 'object', properties: {} } },
    { name: 'comms_full_sync', description: 'Full sync: emails + calls + calendar + messaging + social.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  comms_sync_emails: syncEmails, comms_sync_calls: syncCalls, comms_sync_calendar: syncCalendar,
  comms_sync_messaging: syncMessaging, comms_sync_social: syncSocial, comms_full_sync: fullSync,
};
