import { requireAuth } from './_auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Calendly API v2 — events, schedules, invitees, availability, webhooks
// ---------------------------------------------------------------------------

const CAL_API = 'https://api.calendly.com';
const API_KEY = process.env.CALENDLY_API_KEY || '';

async function calFetch(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${CAL_API}${path}${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Calendly ${res.status}`); }
  return res.json();
}

async function calPost(path: string, body: unknown) {
  const res = await fetch(`${CAL_API}${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Calendly ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!API_KEY) return res.status(500).json({ error: 'CALENDLY_API_KEY not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      case 'me':
        return res.json(await calFetch('/users/me'));

      case 'list-event-types': {
        const me = await calFetch('/users/me');
        const userUri = me.resource?.uri;
        return res.json(await calFetch('/event_types', { user: userUri, count: '25' }));
      }

      case 'list-scheduled-events': {
        const me = await calFetch('/users/me');
        const userUri = me.resource?.uri;
        const { status = 'active', count = '25', minStartTime } = req.query;
        const params: Record<string, string> = { user: userUri, status: status as string, count: count as string };
        if (minStartTime) params.min_start_time = minStartTime as string;
        else params.min_start_time = new Date().toISOString();
        return res.json(await calFetch('/scheduled_events', params));
      }

      case 'get-event': {
        const { eventUuid } = req.query;
        if (!eventUuid) return res.status(400).json({ error: 'eventUuid required' });
        return res.json(await calFetch(`/scheduled_events/${eventUuid}`));
      }

      case 'list-invitees': {
        const { eventUuid, count = '25' } = req.query;
        if (!eventUuid) return res.status(400).json({ error: 'eventUuid required' });
        return res.json(await calFetch(`/scheduled_events/${eventUuid}/invitees`, { count: count as string }));
      }

      case 'cancel-event': {
        const { eventUuid, reason } = req.body;
        if (!eventUuid) return res.status(400).json({ error: 'eventUuid required' });
        return res.json(await calPost(`/scheduled_events/${eventUuid}/cancellation`, { reason }));
      }

      case 'list-webhooks': {
        const me = await calFetch('/users/me');
        const orgUri = me.resource?.current_organization;
        return res.json(await calFetch('/webhook_subscriptions', { organization: orgUri, scope: 'organization' }));
      }

      case 'create-webhook': {
        const { url, events, scope = 'organization' } = req.body;
        if (!url || !events) return res.status(400).json({ error: 'url and events required' });
        const me = await calFetch('/users/me');
        return res.json(await calPost('/webhook_subscriptions', {
          url, events, organization: me.resource?.current_organization, scope,
        }));
      }

      case 'availability': {
        const me = await calFetch('/users/me');
        const userUri = me.resource?.uri;
        return res.json(await calFetch('/user_availability_schedules', { user: userUri }));
      }

      case 'overview': {
        const me = await calFetch('/users/me');
        const userUri = me.resource?.uri;
        const [eventTypes, upcoming] = await Promise.all([
          calFetch('/event_types', { user: userUri, count: '5' }),
          calFetch('/scheduled_events', { user: userUri, status: 'active', count: '5', min_start_time: new Date().toISOString() }),
        ]);
        return res.json({
          name: me.resource?.name,
          email: me.resource?.email,
          scheduling_url: me.resource?.scheduling_url,
          event_types: eventTypes.collection?.length ?? 0,
          upcoming_events: upcoming.collection?.length ?? 0,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
