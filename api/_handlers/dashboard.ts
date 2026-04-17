import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.method === 'GET' ? req.query.action as string : req.body?.action;

  // Bare GET without action = health-check ping (used by Command Center
  // System Health card). Returns 200 OK with a summary of supported actions.
  if (!action) {
    return res.json({ ok: true, service: 'dashboard', actions: ['stats','attention','morning-brief'] });
  }

  try {
    switch (action) {
      // ── Aggregated Stats ──
      case 'stats': {
        const [tasks, contacts, deals, docs, convos, notifications] = await Promise.all([
          supabase.from('tasks').select('id, status, priority, venture_id, created_at, due_date'),
          supabase.from('contacts').select('id, type, venture_id, created_at'),
          supabase.from('deals').select('id, value, stage, venture_id, expected_close'),
          supabase.from('documents').select('id, doc_type, venture_id, updated_at'),
          supabase.from('conversations').select('id, venture_id, updated_at'),
          supabase.from('notifications').select('id, type, read, created_at').eq('read', false).limit(20),
        ]);

        const allTasks = tasks.data || [];
        const allDeals = deals.data || [];
        const openTasks = allTasks.filter((t: { status: string }) => t.status !== 'done' && t.status !== 'completed');
        const overdueTasks = openTasks.filter((t: { due_date?: string }) =>
          t.due_date && new Date(t.due_date) < new Date()
        );
        const criticalTasks = openTasks.filter((t: { priority: string }) => t.priority === 'critical' || t.priority === 'high');
        const pipelineValue = allDeals.reduce((sum: number, d: { value?: number }) => sum + (d.value || 0), 0);
        const wonValue = allDeals.filter((d: { stage: string }) => d.stage === 'closed_won').reduce((sum: number, d: { value?: number }) => sum + (d.value || 0), 0);

        return res.json({
          stats: {
            tasks: { total: allTasks.length, open: openTasks.length, overdue: overdueTasks.length, critical: criticalTasks.length },
            contacts: { total: (contacts.data || []).length },
            deals: { total: allDeals.length, pipelineValue, wonValue },
            docs: { total: (docs.data || []).length },
            conversations: { total: (convos.data || []).length },
            unreadNotifications: (notifications.data || []).length,
          },
          overdueTasks: overdueTasks.slice(0, 5),
          criticalTasks: criticalTasks.slice(0, 5),
        });
      }

      // ── Attention Required ──
      case 'attention': {
        const items: Array<{ id: string; type: string; severity: 'critical' | 'warning' | 'info'; title: string; description: string; ventureId?: string; actionLabel: string; actionView: string }> = [];

        // Overdue tasks
        const { data: overdue } = await supabase
          .from('tasks').select('id, title, due_date, venture_id, priority')
          .not('status', 'in', '("done","completed")')
          .lt('due_date', new Date().toISOString())
          .order('due_date', { ascending: true })
          .limit(5);

        for (const t of overdue || []) {
          items.push({
            id: `task-${t.id}`,
            type: 'task',
            severity: t.priority === 'critical' ? 'critical' : 'warning',
            title: `Overdue: ${t.title}`,
            description: `Due ${new Date(t.due_date).toLocaleDateString()}`,
            ventureId: t.venture_id,
            actionLabel: 'View Tasks',
            actionView: 'tasks',
          });
        }

        // Stale deals (no update in 7+ days, not closed)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: staleDeals } = await supabase
          .from('deals').select('id, title, stage, value, venture_id, updated_at')
          .not('stage', 'like', 'closed%')
          .lt('updated_at', weekAgo)
          .order('value', { ascending: false })
          .limit(3);

        for (const d of staleDeals || []) {
          items.push({
            id: `deal-${d.id}`,
            type: 'deal',
            severity: 'warning',
            title: `Stale deal: ${d.title}`,
            description: `$${(d.value || 0).toLocaleString()} · ${d.stage.replace(/_/g, ' ')} · no activity in 7+ days`,
            ventureId: d.venture_id,
            actionLabel: 'View CRM',
            actionView: 'crm',
          });
        }

        // Unread notifications
        const { data: unread } = await supabase
          .from('notifications').select('id, title, description, type, venture_id, created_at')
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        for (const n of unread || []) {
          items.push({
            id: `notif-${n.id}`,
            type: 'notification',
            severity: n.type === 'error' ? 'critical' : 'info',
            title: n.title,
            description: n.description || '',
            ventureId: n.venture_id,
            actionLabel: 'Dismiss',
            actionView: 'command-center',
          });
        }

        // Sort by severity
        const order = { critical: 0, warning: 1, info: 2 };
        items.sort((a, b) => order[a.severity] - order[b.severity]);

        return res.json({ items });
      }

      // ── Morning Brief (AI-generated) ──
      case 'morning-brief': {
        // Gather yesterday's activity
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const [newTasks, newDeals, newDocs, newActivities, newConvos] = await Promise.all([
          supabase.from('tasks').select('title, status, venture_id').gte('created_at', yesterday),
          supabase.from('deals').select('title, value, stage, venture_id').gte('created_at', yesterday),
          supabase.from('documents').select('title, doc_type, venture_id').gte('created_at', yesterday),
          supabase.from('activities').select('title, type, venture_id').gte('created_at', yesterday),
          supabase.from('conversations').select('title, venture_id').gte('created_at', yesterday),
        ]);

        const briefData = {
          tasks: (newTasks.data || []).length,
          deals: (newDeals.data || []).length,
          docs: (newDocs.data || []).length,
          activities: (newActivities.data || []).length,
          conversations: (newConvos.data || []).length,
          taskDetails: (newTasks.data || []).slice(0, 5),
          dealDetails: (newDeals.data || []).slice(0, 3),
          docDetails: (newDocs.data || []).slice(0, 3),
        };

        // If Anthropic key available, generate AI summary
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
          try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 300,
                messages: [{
                  role: 'user',
                  content: `Generate a concise CEO morning brief (3-5 bullet points, markdown) for EdgeIQ Holdings based on the last 24 hours of activity:\n\n${JSON.stringify(briefData, null, 2)}\n\nFocus on what matters most: new deals, overdue items, key documents, and momentum. Be direct and actionable. Address the CEO as "you".`,
                }],
              }),
            });
            const result = await response.json();
            const aiText = result.content?.[0]?.text || '';
            return res.json({ brief: aiText, data: briefData, generated: true });
          } catch {
            // Fall through to static brief
          }
        }

        // Static fallback
        const lines = [];
        if (briefData.tasks > 0) lines.push(`- **${briefData.tasks} new tasks** created in the last 24h`);
        if (briefData.deals > 0) lines.push(`- **${briefData.deals} new deals** added to the pipeline`);
        if (briefData.docs > 0) lines.push(`- **${briefData.docs} documents** updated in the knowledge base`);
        if (briefData.activities > 0) lines.push(`- **${briefData.activities} CRM activities** logged`);
        if (briefData.conversations > 0) lines.push(`- **${briefData.conversations} AI conversations** across ventures`);
        if (lines.length === 0) lines.push('- No activity recorded in the last 24 hours — quiet day across the portfolio');

        return res.json({ brief: lines.join('\n'), data: briefData, generated: false });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
