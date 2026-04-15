// Cron: dispatch undelivered notifications via configured channels.
// Reads `notifications` rows where dispatched_at IS NULL AND channels is non-empty.
// For each enabled channel (slack, email), looks up the row's
// target_user_id's stored OAuth token and posts directly to the provider API.
// Records per-channel result in delivery_log; sets dispatched_at when all
// channels have been attempted (success or failure).
//
// Configured in vercel.json: { "path": "/api/cron-notifications-dispatch", "schedule": "*/2 * * * *" }
// Every 2 minutes — keeps perceived latency low for capital + ops events
// without hammering OAuth providers (Slack rate limit is ~1/sec/workspace).
//
// Idempotent — only undispatched rows are touched. If a row's channel set
// is empty (in-app only), the row is left alone.

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProviderToken } from './_oauth-helper.js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  description: string | null;
  source: string | null;
  venture_id: string | null;
  target_user_id: string | null;
  channels: Record<string, Record<string, unknown>>;
  delivery_log: Array<Record<string, unknown>>;
}

interface DispatchAttempt {
  channel: string;
  ok: boolean;
  error?: string;
  reference?: string;
  at: string;
}

async function postSlack(token: string, channel: string, text: string, threadTs?: string): Promise<{ ok: boolean; ts?: string; error?: string }> {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ channel, text, thread_ts: threadTs }),
  });
  const data = await res.json() as { ok: boolean; ts?: string; error?: string };
  return data.ok ? { ok: true, ts: data.ts } : { ok: false, error: data.error ?? 'slack send failed' };
}

async function sendGmail(token: string, to: string, subject: string, body: string): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  // RFC 822 → base64url for Gmail send.
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body,
  ].join('\r\n');
  const encoded = Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: encoded }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: (data as { error?: { message?: string } }).error?.message ?? `gmail ${res.status}` };
  return { ok: true, messageId: (data as { id?: string }).id };
}

async function dispatchOne(n: NotificationRow): Promise<DispatchAttempt[]> {
  const attempts: DispatchAttempt[] = [];
  const channels = n.channels ?? {};
  const at = new Date().toISOString();
  const text = `*${n.title}*\n${n.description ?? ''}`.trim();

  if (channels.slack && n.target_user_id) {
    const slackCfg = channels.slack as { channel?: string; thread_ts?: string };
    if (!slackCfg.channel) {
      attempts.push({ channel: 'slack', ok: false, error: 'missing channel id', at });
    } else {
      try {
        const { token } = await getProviderToken(n.target_user_id, 'slack');
        const r = await postSlack(token, slackCfg.channel, text, slackCfg.thread_ts);
        attempts.push({ channel: 'slack', ok: r.ok, error: r.error, reference: r.ts, at });
      } catch (err) {
        attempts.push({ channel: 'slack', ok: false, error: err instanceof Error ? err.message : String(err), at });
      }
    }
  }

  if (channels.email && n.target_user_id) {
    const emailCfg = channels.email as { to?: string; subject?: string };
    if (!emailCfg.to) {
      attempts.push({ channel: 'email', ok: false, error: 'missing to address', at });
    } else {
      try {
        const { token } = await getProviderToken(n.target_user_id, 'google');
        const subject = emailCfg.subject ?? `[${n.source ?? 'mcv'}] ${n.title}`;
        const r = await sendGmail(token, emailCfg.to, subject, `${n.title}\n\n${n.description ?? ''}`);
        attempts.push({ channel: 'email', ok: r.ok, error: r.error, reference: r.messageId, at });
      } catch (err) {
        attempts.push({ channel: 'email', ok: false, error: err instanceof Error ? err.message : String(err), at });
      }
    }
  }

  return attempts;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { data: pending, error } = await supabase
    .from('notifications')
    .select('id, type, title, description, source, venture_id, target_user_id, channels, delivery_log')
    .is('dispatched_at', null)
    .not('channels', 'eq', '{}')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  if (!pending || !pending.length) return res.json({ ran_at: new Date().toISOString(), pending: 0, dispatched: [] });

  const dispatched: Array<{ id: string; channels: number; succeeded: number; failed: number }> = [];

  for (const n of pending as NotificationRow[]) {
    const attempts = await dispatchOne(n);
    const succeeded = attempts.filter((a) => a.ok).length;
    const failed = attempts.length - succeeded;
    const log = [...(n.delivery_log ?? []), ...attempts];

    await supabase
      .from('notifications')
      .update({
        dispatched_at: new Date().toISOString(),
        delivery_log: log,
      })
      .eq('id', n.id);

    dispatched.push({ id: n.id, channels: attempts.length, succeeded, failed });
  }

  return res.json({ ran_at: new Date().toISOString(), pending: pending.length, dispatched });
}
