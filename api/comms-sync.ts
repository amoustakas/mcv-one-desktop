import { createClient } from '@supabase/supabase-js';
import { getProviderToken } from './_oauth-helper';
import type { VercelRequest, VercelResponse } from '@vercel/node';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

// ---------------------------------------------------------------------------
// Comms Sync — ingests communication data into Knowledge Base, CRM, Tasks
//
// Mirrors pipeline-sync.ts pattern: auth → action switch → Supabase upsert
// Dedup via metadata JSONB: { source: 'comms-sync', sourceId: '<unique>' }
// ---------------------------------------------------------------------------

// ── Helpers ──

function guessVenture(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('futurestate') || lower.includes('future state')) return 'futurestate';
  if (lower.includes('betedge') || lower.includes('bet-edge') || lower.includes('bet edge')) return 'betedge';
  if (lower.includes('warforge') || lower.includes('war forge')) return 'warforge';
  if (lower.includes('edgeiq') || lower.includes('edge iq')) return 'edgeiq';
  if (lower.includes('arqlab') || lower.includes('arq lab')) return 'arqlabs';
  if (lower.includes('mcv.gg') || lower.includes('mcvgg')) return 'mcvgg';
  return 'mcv';
}

async function isDuplicate(table: string, sourceId: string): Promise<boolean> {
  const { data } = await supabase
    .from(table)
    .select('id')
    .contains('metadata', { source: 'comms-sync', sourceId })
    .limit(1);
  return (data?.length ?? 0) > 0;
}

function parseEmailAddress(raw: string): { name: string; email: string } {
  // "Tony Moustakas <tony@mcv.one>" → { name: 'Tony Moustakas', email: 'tony@mcv.one' }
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: raw, email: raw };
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

// ── Gmail Fetch Helpers (server-side, using OAuth token) ──

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function gmailFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${GMAIL_API}${path}${qs ? '?' + qs : ''}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Gmail API ${r.status}`);
  return r.json();
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

// ── Twilio Fetch Helper ──

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_API = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}`;

async function twilioFetch(path: string) {
  const r = await fetch(`${TWILIO_API}${path}`, {
    headers: { Authorization: 'Basic ' + Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64') },
  });
  if (!r.ok) throw new Error(`Twilio API ${r.status}`);
  return r.json();
}

// ── Google Calendar Fetch Helper ──

const GCAL_API = 'https://www.googleapis.com/calendar/v3';

async function gcalFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${GCAL_API}${path}${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`GCal API ${r.status}`);
  return r.json();
}

// ── Slack Fetch Helper ──

const SLACK_API = 'https://slack.com/api';

async function slackCall(method: string, token: string, params?: Record<string, unknown>) {
  const r = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: params ? JSON.stringify(params) : undefined,
  });
  const data = await r.json();
  if (!data.ok) throw new Error(data.error || `Slack ${method} failed`);
  return data;
}

// ── AI Classifier ──

async function classifyItems(items: Array<{ id: string; platform: string; from?: string; subject?: string; content: string }>) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey || items.length === 0) return items.map((i) => ({ id: i.id, importance: 'medium' as const, routes: [{ target: 'document' as const, docType: 'note' }], ventureId: guessVenture(i.content + (i.subject || '')) }));

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a data triage agent for MCV One, a venture portfolio management platform owned by EdgeIQ Holdings.
Ventures: mcv, betedge, futurestate, warforge, mcvgg, edgeiq, arqlabs.

Classify each communication item for routing. For each item return a JSON object:
{
  "id": "<item id>",
  "importance": "high" | "medium" | "low",
  "routes": [{ "target": "document" | "crm-activity" | "crm-contact" | "task" | "notification", "docType": "email-digest" | "meeting-notes" | "note" | "report" }],
  "ventureId": "<venture_id or null>"
}

Skip items that are clearly spam, newsletters, or automated notifications (importance: "low", routes: []).

Return a JSON array. No markdown fences.

Items:
${JSON.stringify(items.map((i) => ({ id: i.id, platform: i.platform, from: i.from, subject: i.subject, content: i.content.slice(0, 500) })))}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text);
  } catch {
    // Fallback: classify everything as medium importance, route to document
    return items.map((i) => ({ id: i.id, importance: 'medium', routes: [{ target: 'document', docType: 'note' }], ventureId: guessVenture(i.content + (i.subject || '')) }));
  }
}

// ═══════════════════════════════════════════
// Standalone sync functions — each returns Record<string, number>
// Used by both individual action cases and full-sync orchestrator
// ═══════════════════════════════════════════

async function syncEmails(userId: string): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  let token: string;
  try { token = (await getProviderToken(userId, 'google')).token; } catch { return { synced: 0, skipped: 0, error_google_not_connected: 1 }; }

  // Fetch recent unread + starred emails
  const list = await gmailFetch('/messages', token, { q: 'in:inbox (is:unread OR is:starred)', maxResults: '15' });
  const messageIds: string[] = (list.messages ?? []).map((m: { id: string }) => m.id);

  // Fetch full message details
  const emails: Array<{ id: string; from: string; to: string; subject: string; body: string; date: string }> = [];
  for (const msgId of messageIds.slice(0, 15)) {
    if (await isDuplicate('documents', `gmail-${msgId}`)) continue;

    const msg = await gmailFetch(`/messages/${msgId}`, token, { format: 'full' });
    const headers = msg.payload?.headers || [];
    let body = '';
    if (msg.payload?.body?.data) {
      body = Buffer.from(msg.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    } else if (msg.payload?.parts) {
      const textPart = msg.payload.parts.find((p: { mimeType: string }) => p.mimeType === 'text/plain');
      if (textPart?.body?.data) body = Buffer.from(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    }

    emails.push({
      id: msgId,
      from: getHeader(headers, 'From'),
      to: getHeader(headers, 'To'),
      subject: getHeader(headers, 'Subject'),
      body: body.slice(0, 5000),
      date: getHeader(headers, 'Date'),
    });
  }

  if (emails.length === 0) return { synced: 0, skipped: messageIds.length };

  // AI classify
  const classifications = await classifyItems(emails.map((e) => ({
    id: e.id, platform: 'gmail', from: e.from, subject: e.subject, content: e.body,
  })));

  const classMap = new Map(classifications.map((c: { id: string; importance: string; routes: Array<{ target: string; docType?: string }>; ventureId?: string }) => [c.id, c]));

  for (const email of emails) {
    const cls = classMap.get(email.id) || { importance: 'medium', routes: [{ target: 'document', docType: 'email-digest' }], ventureId: null };
    if (cls.importance === 'low') { results.skipped = (results.skipped || 0) + 1; continue; }

    const ventureId = cls.ventureId || guessVenture(email.subject + ' ' + email.from);
    const { name: senderName, email: senderEmail } = parseEmailAddress(email.from);

    // Route: Document
    if (cls.routes?.some((r: { target: string }) => r.target === 'document')) {
      const docType = cls.routes.find((r: { target: string }) => r.target === 'document')?.docType || 'email-digest';
      await supabase.from('documents').insert({
        user_id: userId,
        title: email.subject || '(No subject)',
        content: `**From:** ${email.from}\n**To:** ${email.to}\n**Date:** ${email.date}\n\n---\n\n${email.body}`,
        doc_type: docType,
        venture_id: ventureId,
        metadata: { source: 'comms-sync', sourceId: `gmail-${email.id}`, sourcePlatform: 'gmail', from: senderEmail, to: email.to, subject: email.subject, syncedAt: new Date().toISOString() },
      });
      results.documents = (results.documents || 0) + 1;
    }

    // Route: CRM Activity (match sender to contact)
    if (cls.routes?.some((r: { target: string }) => r.target === 'crm-activity')) {
      const { data: contacts } = await supabase.from('contacts').select('id, venture_id').ilike('email', senderEmail).limit(1);
      if (contacts?.length) {
        if (!(await isDuplicate('activities', `gmail-act-${email.id}`))) {
          await supabase.from('activities').insert({
            type: 'email',
            title: email.subject || 'Email',
            description: `From: ${senderName} (${senderEmail})`,
            contact_id: contacts[0].id,
            venture_id: contacts[0].venture_id || ventureId,
            metadata: { source: 'comms-sync', sourceId: `gmail-act-${email.id}`, sourcePlatform: 'gmail' },
          });
          // Update last_contacted
          await supabase.from('contacts').update({ last_contacted: new Date().toISOString() }).eq('id', contacts[0].id);
          results.activities = (results.activities || 0) + 1;
        }
      }
    }

    // Route: New CRM Contact
    if (cls.routes?.some((r: { target: string }) => r.target === 'crm-contact')) {
      const { data: existing } = await supabase.from('contacts').select('id').ilike('email', senderEmail).limit(1);
      if (!existing?.length) {
        await supabase.from('contacts').insert({
          name: senderName,
          email: senderEmail,
          type: 'lead',
          status: 'active',
          source: 'gmail',
          lifecycle_stage: 'lead',
          venture_id: ventureId,
          metadata: { source: 'comms-sync', sourceId: `gmail-contact-${email.id}`, sourcePlatform: 'gmail' },
        });
        results.contacts = (results.contacts || 0) + 1;
      }
    }
  }

  return results;
}

async function syncCalls(_userId: string): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  if (!ACCOUNT_SID || !AUTH_TOKEN) return { synced: 0, error_twilio_not_configured: 1 };

  const data = await twilioFetch('/Calls.json?PageSize=20');
  const calls = data.calls ?? [];

  for (const call of calls) {
    if (await isDuplicate('activities', `twilio-call-${call.sid}`)) continue;
    if (call.status !== 'completed') continue; // Only sync finished calls

    const phone = normalizePhone(call.direction === 'inbound' ? call.from : call.to);
    const { data: contacts } = await supabase.from('contacts').select('id, name, venture_id').or(`phone.ilike.%${phone.slice(-10)}%`).limit(1);

    const contactName = contacts?.[0]?.name || phone;
    const contactId = contacts?.[0]?.id;
    const ventureId = contacts?.[0]?.venture_id || 'mcv';

    await supabase.from('activities').insert({
      type: 'call',
      title: `Call with ${contactName}`,
      description: `Duration: ${call.duration || 0}s · Direction: ${call.direction} · Status: ${call.status}`,
      contact_id: contactId || null,
      venture_id: ventureId,
      metadata: { source: 'comms-sync', sourceId: `twilio-call-${call.sid}`, sourcePlatform: 'twilio', direction: call.direction, duration: call.duration, phone },
      created_at: call.date_created,
    });

    // Update last_contacted if contact matched
    if (contactId) {
      await supabase.from('contacts').update({ last_contacted: new Date().toISOString() }).eq('id', contactId);
    }

    results.activities = (results.activities || 0) + 1;
  }

  return results;
}

async function syncCalendar(userId: string): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  let token: string;
  try { token = (await getProviderToken(userId, 'google')).token; } catch { return { synced: 0, error_google_not_connected: 1 }; }

  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60_000);
  const events = await gcalFetch('/calendars/primary/events', token, {
    timeMin: now.toISOString(),
    timeMax: in48h.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '15',
  });

  for (const ev of events.items ?? []) {
    if (!ev.summary) continue;
    const eventId = ev.id;
    const startDt = ev.start?.dateTime || ev.start?.date || '';
    const _endDt = ev.end?.dateTime || ev.end?.date || '';
    const attendees = (ev.attendees || []).map((a: { email: string; displayName?: string }) => a.displayName || a.email);
    const ventureId = guessVenture(ev.summary + ' ' + (ev.description || ''));

    // Create prep task (due 1h before)
    if (!(await isDuplicate('tasks', `gcal-task-${eventId}`))) {
      const dueDate = new Date(new Date(startDt).getTime() - 60 * 60_000);
      await supabase.from('tasks').insert({
        user_id: userId,
        title: `Prepare for: ${ev.summary}`,
        description: `Meeting at ${new Date(startDt).toLocaleString()}\nAttendees: ${attendees.join(', ') || 'None listed'}\n${ev.description || ''}`,
        status: 'todo',
        priority: 'medium',
        venture_id: ventureId,
        due_date: dueDate.toISOString(),
        tags: ['meeting-prep'],
        metadata: { source: 'comms-sync', sourceId: `gcal-task-${eventId}`, sourcePlatform: 'gcal', eventId },
      });
      results.tasks = (results.tasks || 0) + 1;
    }

    // Create meeting notes template
    if (!(await isDuplicate('documents', `gcal-notes-${eventId}`))) {
      const dateStr = new Date(startDt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const timeStr = new Date(startDt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const location = ev.location || ev.hangoutLink || ev.conferenceData?.entryPoints?.[0]?.uri || 'TBD';

      const template = `# Meeting Notes: ${ev.summary}
**Date:** ${dateStr} at ${timeStr}
**Attendees:** ${attendees.join(', ') || 'TBD'}
**Location:** ${location}

## Agenda
${ev.description || 'TBD'}

## Notes
-

## Action Items
- [ ]

## Follow-up
-
`;
      await supabase.from('documents').insert({
        user_id: userId,
        title: `Meeting Notes: ${ev.summary} — ${dateStr}`,
        content: template,
        doc_type: 'meeting-notes',
        venture_id: ventureId,
        metadata: { source: 'comms-sync', sourceId: `gcal-notes-${eventId}`, sourcePlatform: 'gcal', eventId, attendees, syncedAt: new Date().toISOString() },
      });
      results.documents = (results.documents || 0) + 1;
    }
  }

  return results;
}

async function syncMessaging(userId: string): Promise<Record<string, number>> {
  let slackSynced = 0;
  try {
    const slackToken = (await getProviderToken(userId, 'slack')).token;
    const channels = await slackCall('conversations.list', slackToken, { limit: 10, types: 'public_channel,private_channel', exclude_archived: true });

    for (const ch of (channels.channels || []).slice(0, 5)) {
      const history = await slackCall('conversations.history', slackToken, { channel: ch.id, limit: 10 });
      for (const msg of (history.messages || [])) {
        // Only save messages with reactions, mentions, or threads
        if (!msg.reactions?.length && !msg.reply_count && !msg.text?.includes('<@')) continue;
        const sourceId = `slack-${ch.id}-${msg.ts}`;
        if (await isDuplicate('documents', sourceId)) continue;

        await supabase.from('documents').insert({
          user_id: userId,
          title: `Slack #${ch.name}: ${(msg.text || '').slice(0, 60)}`,
          content: msg.text || '',
          doc_type: 'note',
          venture_id: guessVenture(ch.name),
          metadata: { source: 'comms-sync', sourceId, sourcePlatform: 'slack', channelName: ch.name, channelId: ch.id, syncedAt: new Date().toISOString() },
        });
        slackSynced++;
      }
    }

    // Sync Slack users → CRM contacts
    const users = await slackCall('users.list', slackToken, { limit: 100 });
    for (const u of (users.members || []).filter((m: { is_bot: boolean; deleted: boolean }) => !m.is_bot && !m.deleted)) {
      const email = u.profile?.email;
      if (!email) continue;
      const { data: existing } = await supabase.from('contacts').select('id').ilike('email', email).limit(1);
      if (!existing?.length) {
        await supabase.from('contacts').insert({
          name: u.real_name || u.name,
          email,
          source: 'slack',
          type: 'team',
          status: 'active',
          lifecycle_stage: 'customer',
          venture_id: 'mcv',
          metadata: { source: 'comms-sync', sourceId: `slack-user-${u.id}`, sourcePlatform: 'slack' },
        });
        slackSynced++;
      }
    }
  } catch { /* Slack not connected */ }

  return { messaging: slackSynced };
}

async function syncSocial(userId: string): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  const today = new Date().toISOString().split('T')[0];
  const sourceId = `social-digest-${today}`;
  if (await isDuplicate('documents', sourceId)) return { synced: 0, skipped: 1 };

  const sections: string[] = [`# Social Engagement Digest — ${today}\n`];

  // Twitter
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN;
    if (bearerToken) {
      // Get user info (requires a configured user ID)
      sections.push('## X / Twitter\nTwitter data requires user ID configuration. Connect via integrations to enable.\n');
    }
  } catch { /* skip */ }

  // YouTube
  try {
    const googleToken = (await getProviderToken(userId, 'google')).token;
    const ytData = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true`, {
      headers: { Authorization: `Bearer ${googleToken}` },
    });
    if (ytData.ok) {
      const yt = await ytData.json();
      const stats = yt.items?.[0]?.statistics;
      if (stats) {
        sections.push(`## YouTube\n- Subscribers: ${stats.subscriberCount}\n- Total Views: ${stats.viewCount}\n- Videos: ${stats.videoCount}\n`);
      }
    }
  } catch { /* skip */ }

  if (sections.length > 1) {
    await supabase.from('documents').insert({
      user_id: userId,
      title: `Social Engagement Digest — ${today}`,
      content: sections.join('\n'),
      doc_type: 'report',
      venture_id: 'mcv',
      metadata: { source: 'comms-sync', sourceId, sourcePlatform: 'social', syncedAt: new Date().toISOString() },
    });
    results.documents = 1;
  }

  return results;
}

// ═══════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const action = req.body?.action;

  try {
    switch (action) {

      case 'sync-emails': {
        const results = await syncEmails(userId);
        return res.json({ synced: results, total: Object.values(results).reduce((s, n) => s + n, 0) });
      }

      case 'sync-calls': {
        const results = await syncCalls(userId);
        return res.json({ synced: results, total: results.activities || 0 });
      }

      case 'sync-calendar': {
        const results = await syncCalendar(userId);
        return res.json({ synced: results, total: Object.values(results).reduce((s, n) => s + n, 0) });
      }

      case 'sync-messaging': {
        const results = await syncMessaging(userId);
        return res.json({ synced: results, total: results.messaging || 0 });
      }

      case 'sync-social': {
        const results = await syncSocial(userId);
        return res.json({ synced: results, total: results.documents || 0 });
      }

      // ═══════════════════════════════════════
      // Full Sync — orchestrate all actions
      // ═══════════════════════════════════════
      case 'full-sync': {
        const syncFns: Record<string, (uid: string) => Promise<Record<string, number>>> = {
          'sync-emails': syncEmails,
          'sync-calls': syncCalls,
          'sync-calendar': syncCalendar,
          'sync-messaging': syncMessaging,
          'sync-social': syncSocial,
        };

        const allResults: Record<string, Record<string, number>> = {};

        // Run sync actions sequentially to respect rate limits
        for (const [name, fn] of Object.entries(syncFns)) {
          try {
            allResults[name] = await fn(userId);
          } catch {
            allResults[name] = { error: 1 };
          }
        }

        const totalSynced = Object.values(allResults).reduce((sum, r) =>
          sum + Object.values(r).reduce((s, n) => s + n, 0), 0);

        return res.json({ synced: allResults, total: totalSynced });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Comms sync failed' });
  }
}
