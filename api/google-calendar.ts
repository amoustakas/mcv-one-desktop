import { getProviderToken } from './_oauth-helper';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Google Calendar API v3 — events, calendars, free/busy, colors
// ---------------------------------------------------------------------------

const CAL_API = 'https://www.googleapis.com/calendar/v3';

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

async function calFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${CAL_API}${path}${qs ? '?' + qs : ''}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Calendar ${res.status}`); }
  return res.json();
}

async function calPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${CAL_API}${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Calendar ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  let token: string;
  try { token = (await getProviderToken(userId, 'google')).token; }
  catch { return res.status(500).json({ error: 'Google not connected.' }); }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      case 'list-calendars':
        return res.json(await calFetch('/users/me/calendarList', token));

      case 'list-events': {
        const { calendarId = 'primary', maxResults = '25', timeMin, timeMax, q } = req.query;
        const params: Record<string, string> = { maxResults: maxResults as string, singleEvents: 'true', orderBy: 'startTime' };
        if (timeMin) params.timeMin = timeMin as string;
        else params.timeMin = new Date().toISOString();
        if (timeMax) params.timeMax = timeMax as string;
        if (q) params.q = q as string;
        return res.json(await calFetch(`/calendars/${encodeURIComponent(calendarId as string)}/events`, token, params));
      }

      case 'get-event': {
        const { calendarId = 'primary', eventId } = req.query;
        if (!eventId) return res.status(400).json({ error: 'eventId required' });
        return res.json(await calFetch(`/calendars/${calendarId}/events/${eventId}`, token));
      }

      case 'create-event': {
        const { calendarId = 'primary', summary, description, start, end, location, attendees } = req.body;
        if (!summary || !start || !end) return res.status(400).json({ error: 'summary, start, and end required' });
        return res.json(await calPost(`/calendars/${calendarId}/events`, token, {
          summary, description, location,
          start: typeof start === 'string' ? { dateTime: start, timeZone: 'America/Toronto' } : start,
          end: typeof end === 'string' ? { dateTime: end, timeZone: 'America/Toronto' } : end,
          attendees: attendees?.map((e: string) => ({ email: e })),
        }));
      }

      case 'quick-add': {
        const { calendarId = 'primary', text } = req.body;
        if (!text) return res.status(400).json({ error: 'text required' });
        return res.json(await calPost(`/calendars/${calendarId}/events/quickAdd?text=${encodeURIComponent(text)}`, token, {}));
      }

      case 'free-busy': {
        const { timeMin, timeMax, items } = req.body;
        if (!timeMin || !timeMax) return res.status(400).json({ error: 'timeMin and timeMax required' });
        return res.json(await calPost('/freeBusy', token, {
          timeMin, timeMax,
          items: items || [{ id: 'primary' }],
        }));
      }

      case 'colors':
        return res.json(await calFetch('/colors', token));

      case 'overview': {
        const now = new Date().toISOString();
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
        const [calendars, events] = await Promise.all([
          calFetch('/users/me/calendarList', token),
          calFetch('/calendars/primary/events', token, { timeMin: now, timeMax: nextWeek, maxResults: '10', singleEvents: 'true', orderBy: 'startTime' }),
        ]);
        return res.json({
          calendar_count: calendars.items?.length ?? 0,
          upcoming_events: events.items?.length ?? 0,
          next_event: events.items?.[0]?.summary,
          next_event_time: events.items?.[0]?.start?.dateTime || events.items?.[0]?.start?.date,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
