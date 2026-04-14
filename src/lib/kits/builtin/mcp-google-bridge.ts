import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

/**
 * MCP Google Bridge Kit
 *
 * Intelligent router that decides whether to use MCP tools (real-time reads)
 * or API routes (authenticated writes) for Google operations.
 *
 * MCP path: instant queries via session-scoped MCP tools (Gmail, Calendar)
 * API path: authenticated writes via Vercel API routes (send, create, upload)
 */

async function apiCall(path: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const qs = new URLSearchParams(Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
    )).toString();
    const r = await ctx.fetch(`${path}?${qs}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `API error ${r.status}`); }
    return r.json();
  }
  const r = await ctx.fetch(path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `API error ${r.status}`); }
  return r.json();
}

// ── Cross-service workflow: Prepare for meeting ──
const prepareForMeeting: KitToolHandler = async (_input, ctx) => {
  const md: string[] = ['## Meeting Preparation\n'];

  // Step 1: Get next calendar event
  try {
    const calData = await apiCall('/api/google-calendar', { action: 'list-events', maxResults: '1' }, ctx);
    const next = calData.items?.[0];
    if (next) {
      md.push(`### Next Meeting: ${next.summary}`);
      md.push(`- **When:** ${next.start?.dateTime ? new Date(next.start.dateTime).toLocaleString() : 'TBD'}`);
      if (next.location) md.push(`- **Where:** ${next.location}`);
      if (next.attendees?.length) md.push(`- **Attendees:** ${next.attendees.map((a: { email: string }) => a.email).join(', ')}`);
      if (next.hangoutLink) md.push(`- **Meet link:** ${next.hangoutLink}`);
      md.push('');

      // Step 2: Search for related emails
      if (next.attendees?.length) {
        const attendee = next.attendees[0]?.email;
        if (attendee) {
          try {
            const emailData = await apiCall('/api/gmail', { action: 'search', q: `from:${attendee}`, maxResults: '3' }, ctx);
            const emails = emailData.messages ?? [];
            if (emails.length) {
              md.push('### Recent Emails from Attendees');
              for (const e of emails) {
                md.push(`- **${e.subject}** — ${e.from} (${e.date})`);
              }
              md.push('');
            }
          } catch { /* Gmail not connected — skip */ }
        }
      }

      // Step 3: Search Drive for related docs
      try {
        const driveData = await apiCall('/api/google-drive', { action: 'search', q: next.summary }, ctx);
        const files = driveData.files ?? [];
        if (files.length) {
          md.push('### Related Documents');
          for (const f of files.slice(0, 5)) {
            md.push(`- **${f.name}** — ${f.mimeType?.split('.').pop() || 'file'}`);
          }
          md.push('');
        }
      } catch { /* Drive not connected — skip */ }
    } else {
      md.push('No upcoming meetings found.');
    }
  } catch (err) {
    md.push(`Calendar error: ${err instanceof Error ? err.message : 'unavailable'}`);
  }

  return { success: true, data: null, displayMarkdown: md.join('\n') };
};

// ── Cross-service workflow: Daily briefing ──
const dailyBriefing: KitToolHandler = async (_input, ctx) => {
  const md: string[] = ['## Daily Briefing\n'];

  // Calendar
  try {
    const calData = await apiCall('/api/google-calendar', { action: 'overview' }, ctx);
    md.push('### Calendar');
    md.push(`- **${calData.upcoming_events || 0}** events this week`);
    if (calData.next_event) md.push(`- Next: **${calData.next_event}** at ${calData.next_event_time}`);
    md.push('');
  } catch { md.push('### Calendar\n- Not connected\n'); }

  // Gmail
  try {
    const gmailData = await apiCall('/api/gmail', { action: 'overview' }, ctx);
    md.push('### Email');
    md.push(`- **${gmailData.unreadMessages || 0}** unread emails`);
    md.push(`- ${gmailData.inboxMessages || 0} in inbox`);
    md.push('');
  } catch { md.push('### Email\n- Not connected\n'); }

  // Tasks
  try {
    const tasksData = await apiCall('/api/google-tasks', { action: 'overview' }, ctx);
    md.push('### Tasks');
    md.push(`- **${tasksData.pending_tasks || 0}** pending tasks`);
    if (tasksData.overdue_tasks > 0) md.push(`- **${tasksData.overdue_tasks}** overdue`);
    if (tasksData.next_due) md.push(`- Next due: **${tasksData.next_due}**`);
    md.push('');
  } catch { md.push('### Tasks\n- Not connected\n'); }

  return { success: true, data: null, displayMarkdown: md.join('\n') };
};

// ── Cross-service: Schedule + email ──
const scheduleAndNotify: KitToolHandler = async (input, ctx) => {
  const md: string[] = [];

  // Create event
  const eventData = await apiCall('/api/google-calendar', {
    action: 'create-event',
    summary: input.summary,
    start: input.start,
    end: input.end,
    location: input.location,
    attendees: input.attendees,
  }, ctx, 'POST');

  md.push(`Event created: **${eventData.summary}**`);
  if (eventData.hangoutLink) md.push(`Meet link: ${eventData.hangoutLink}`);

  // Send notification email if requested
  if (input.notifyEmail && Array.isArray(input.attendees) && input.attendees.length > 0) {
    for (const email of input.attendees as string[]) {
      try {
        await apiCall('/api/gmail', {
          action: 'send',
          to: email,
          subject: `Meeting: ${input.summary}`,
          body: `You've been invited to: ${input.summary}\n\nWhen: ${input.start}\nWhere: ${input.location || 'TBD'}\n${eventData.hangoutLink ? `Meet: ${eventData.hangoutLink}` : ''}`,
        }, ctx, 'POST');
        md.push(`Notified: ${email}`);
      } catch { md.push(`Failed to notify: ${email}`); }
    }
  }

  return { success: true, data: eventData, displayMarkdown: md.join('\n') };
};

// ── Google workspace search (unified) ──
const workspaceSearch: KitToolHandler = async (input, ctx) => {
  const query = input.query as string;
  const md: string[] = [`## Search: "${query}"\n`];
  const results: Record<string, unknown[]> = {};

  // Search in parallel
  const [emailRes, driveRes, calRes] = await Promise.allSettled([
    apiCall('/api/gmail', { action: 'search', q: query, maxResults: '5' }, ctx),
    apiCall('/api/google-drive', { action: 'search', q: query, maxResults: '5' }, ctx),
    apiCall('/api/google-calendar', { action: 'list-events', q: query, maxResults: '5' }, ctx),
  ]);

  if (emailRes.status === 'fulfilled') {
    const emails = emailRes.value.messages ?? [];
    if (emails.length) {
      results.emails = emails;
      md.push(`### Gmail (${emails.length})`);
      for (const e of emails) md.push(`- **${e.subject}** — ${e.from}`);
      md.push('');
    }
  }

  if (driveRes.status === 'fulfilled') {
    const files = driveRes.value.files ?? [];
    if (files.length) {
      results.files = files;
      md.push(`### Drive (${files.length})`);
      for (const f of files) md.push(`- **${f.name}**`);
      md.push('');
    }
  }

  if (calRes.status === 'fulfilled') {
    const events = calRes.value.items ?? [];
    if (events.length) {
      results.events = events;
      md.push(`### Calendar (${events.length})`);
      for (const ev of events) md.push(`- **${ev.summary}** — ${ev.start?.dateTime || ev.start?.date}`);
      md.push('');
    }
  }

  if (md.length === 1) md.push('No results found across Gmail, Drive, or Calendar.');

  return { success: true, data: results, displayMarkdown: md.join('\n') };
};

// ── Weekly report generator ──
const weeklyReport: KitToolHandler = async (input, ctx) => {
  const md: string[] = ['## Weekly Report\n'];
  const recipientEmail = input.recipient as string | undefined;

  // Gather all data in parallel
  const [calRes, gmailRes, tasksRes, analyticsRes] = await Promise.allSettled([
    apiCall('/api/google-calendar', { action: 'overview' }, ctx),
    apiCall('/api/gmail', { action: 'overview' }, ctx),
    apiCall('/api/google-tasks', { action: 'overview' }, ctx),
    apiCall('/api/google-analytics', { action: 'overview' }, ctx),
  ]);

  const context: Record<string, unknown> = {};
  if (calRes.status === 'fulfilled') context.calendar = calRes.value;
  if (gmailRes.status === 'fulfilled') context.gmail = gmailRes.value;
  if (tasksRes.status === 'fulfilled') context.tasks = tasksRes.value;
  if (analyticsRes.status === 'fulfilled') context.analytics = analyticsRes.value;

  // Generate narrative with Gemini
  try {
    const r = await (await ctx.fetch('/api/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'gemini-generate',
        prompt: `Generate a professional weekly report based on this data. Include sections: Executive Summary, Calendar & Meetings, Communications, Task Progress, and Website Performance. Use bullet points and bold key metrics.\n\nData:\n${JSON.stringify(context, null, 2)}`,
      }),
    })).json();
    md.push(r.content || 'Report generation failed.');
  } catch {
    // Fallback to raw data
    md.push('### Calendar\n' + JSON.stringify(context.calendar, null, 2));
    md.push('\n### Email\n' + JSON.stringify(context.gmail, null, 2));
    md.push('\n### Tasks\n' + JSON.stringify(context.tasks, null, 2));
  }

  // Optionally email the report
  if (recipientEmail) {
    try {
      await apiCall('/api/gmail', {
        action: 'send',
        to: recipientEmail,
        subject: `Weekly Report — ${new Date().toLocaleDateString()}`,
        body: md.join('\n'),
      }, ctx, 'POST');
      md.push(`\n\n*Report emailed to ${recipientEmail}*`);
    } catch { md.push('\n\n*Failed to email report*'); }
  }

  return { success: true, data: context, displayMarkdown: md.join('\n') };
};

// ── Inbox intelligence: AI categorize recent emails ──
const inboxIntelligence: KitToolHandler = async (_input, ctx) => {
  const md: string[] = ['## Inbox Intelligence\n'];

  try {
    const emails = await apiCall('/api/gmail', { action: 'search', q: 'in:inbox', maxResults: '20' }, ctx);
    const messages = emails.messages ?? [];
    if (messages.length === 0) return { success: true, data: null, displayMarkdown: 'No messages in inbox.' };

    const emailList = messages.map((m: { subject: string; from: string; snippet: string }) =>
      `- From: ${m.from} | Subject: ${m.subject} | Preview: ${(m.snippet || '').slice(0, 80)}`
    ).join('\n');

    const r = await (await ctx.fetch('/api/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'gemini-generate',
        prompt: `Analyze these inbox emails and categorize them. For each email, classify as: URGENT, ACTION REQUIRED, FYI, MARKETING, or PERSONAL. Then provide:\n1. Top 3 emails that need immediate attention\n2. Emails that can be archived\n3. Any patterns you notice (e.g., many unsubscribe-worthy newsletters)\n\nEmails:\n${emailList}`,
      }),
    })).json();

    md.push(r.content || 'Analysis failed.');
  } catch (err) {
    md.push(`Error: ${err instanceof Error ? err.message : 'unavailable'}`);
  }

  return { success: true, data: null, displayMarkdown: md.join('\n') };
};

// ── Connection health check ──
const connectionHealth: KitToolHandler = async (_input, ctx) => {
  try {
    const data = await (await ctx.fetch('/api/oauth/health?provider=google')).json();
    if (!data.connected) {
      return { success: true, data, displayMarkdown: '## Google Connection\n\nNot connected. Please connect Google in Settings > Integrations.' };
    }
    const md: string[] = [
      `## Google Health (${data.healthScore}%)`,
      '',
      `**Account:** ${data.userName}`,
      `**Token expires in:** ${data.expiresInSeconds ? `${Math.round(data.expiresInSeconds / 60)} minutes` : 'unknown'}`,
      `**Avg latency:** ${data.avgLatencyMs}ms`,
      data.needsScopeUpgrade ? '\n**Warning:** Scope upgrade available. Reconnect for full access.' : '',
      '',
      '### Service Status',
    ];
    for (const [svc, info] of Object.entries(data.services) as Array<[string, { status: string; latencyMs: number; error?: string }]>) {
      const icon = info.status === 'healthy' ? '+' : info.status === 'degraded' ? '~' : '-';
      md.push(`${icon} **${svc}**: ${info.status} (${info.latencyMs}ms)${info.error ? ` — ${info.error}` : ''}`);
    }
    return { success: true, data, displayMarkdown: md.join('\n') };
  } catch (err) {
    return { success: false, data: null, displayMarkdown: `Health check failed: ${err instanceof Error ? err.message : 'unknown error'}` };
  }
};

export const manifest: KitManifest = {
  id: 'mcp-google-bridge',
  name: 'Google Workspace Bridge',
  version: '2.0.0',
  description: 'Cross-service Google Workspace workflows — meeting prep, daily briefing, unified search, schedule+notify.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools for cross-service Google workflows. "Prepare for my meeting" gathers calendar, email, and drive context. "Daily briefing" summarizes calendar, email, and tasks. "Workspace search" searches across all Google services at once.',
  tools: [
    {
      name: 'google_prepare_meeting',
      description: 'Prepare for your next meeting — gathers calendar event details, related emails from attendees, and shared documents.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'google_daily_briefing',
      description: 'Get a daily briefing — calendar overview, unread emails, pending tasks.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'google_schedule_and_notify',
      description: 'Create a calendar event and optionally email attendees a notification.',
      input_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' }, start: { type: 'string' }, end: { type: 'string' },
          location: { type: 'string' }, attendees: { type: 'array' },
          notifyEmail: { type: 'boolean', description: 'Send email notification to attendees' },
        },
        required: ['summary', 'start', 'end'],
      },
    },
    {
      name: 'google_workspace_search',
      description: 'Search across Gmail, Drive, and Calendar simultaneously. Returns unified results.',
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search query' } },
        required: ['query'],
      },
    },
    {
      name: 'google_connection_health',
      description: 'Check Google Workspace connection health — per-service status, latency, token expiry, scope coverage.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'google_weekly_report',
      description: 'Generate a comprehensive weekly report from Calendar, Gmail, Tasks, and Analytics data. Optionally email it to a recipient.',
      input_schema: {
        type: 'object',
        properties: {
          recipient: { type: 'string', description: 'Email address to send the report to (optional)' },
        },
      },
    },
    {
      name: 'google_inbox_intelligence',
      description: 'AI-analyze your inbox: categorize emails (URGENT, ACTION REQUIRED, FYI, MARKETING), identify top priorities, suggest archivable messages.',
      input_schema: { type: 'object', properties: {} },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  google_prepare_meeting: prepareForMeeting,
  google_daily_briefing: dailyBriefing,
  google_schedule_and_notify: scheduleAndNotify,
  google_workspace_search: workspaceSearch,
  google_connection_health: connectionHealth,
  google_weekly_report: weeklyReport,
  google_inbox_intelligence: inboxIntelligence,
};
