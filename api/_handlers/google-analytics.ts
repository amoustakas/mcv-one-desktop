import { getProviderToken } from './_oauth-helper.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Google Analytics Data API (GA4) — reports, realtime, dimensions, metrics
// ---------------------------------------------------------------------------

const GA_API = 'https://analyticsdata.googleapis.com/v1beta';
const GA_ADMIN = 'https://analyticsadmin.googleapis.com/v1beta';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const t = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!t) { res.status(401).json({ error: 'Auth required' }); return null; }
  try { const { verifyToken } = await import('@clerk/backend'); return (await verifyToken(t, { secretKey })).sub; }
  catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

async function gaPost(url: string, token: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `GA ${res.status}`); }
  return res.json();
}

async function gaFetch(url: string, token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `GA ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  let token: string;
  try { token = (await getProviderToken(userId, 'google')).token; }
  catch { return res.status(500).json({ error: 'Google not connected.' }); }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;
  const propertyId = ((req.query.propertyId || req.body?.propertyId) as string) || '';

  try {
    switch (action) {
      case 'list-accounts':
        return res.json(await gaFetch(`${GA_ADMIN}/accounts`, token));

      case 'list-properties': {
        const { accountId } = req.query;
        const filter = accountId ? `?filter=parent:accounts/${accountId}` : '';
        return res.json(await gaFetch(`${GA_ADMIN}/properties${filter}`, token));
      }

      case 'run-report': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        const { startDate = '30daysAgo', endDate = 'today', dimensions = 'date', metrics = 'activeUsers,sessions,screenPageViews', limit = 100 } = req.body || {};
        return res.json(await gaPost(`${GA_API}/properties/${propertyId}:runReport`, token, {
          dateRanges: [{ startDate, endDate }],
          dimensions: (dimensions as string).split(',').map((d: string) => ({ name: d.trim() })),
          metrics: (metrics as string).split(',').map((m: string) => ({ name: m.trim() })),
          limit: Number(limit),
        }));
      }

      case 'realtime': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        const { dimensions = 'country', metrics = 'activeUsers' } = req.body || {};
        return res.json(await gaPost(`${GA_API}/properties/${propertyId}:runRealtimeReport`, token, {
          dimensions: (dimensions as string).split(',').map((d: string) => ({ name: d.trim() })),
          metrics: (metrics as string).split(',').map((m: string) => ({ name: m.trim() })),
        }));
      }

      case 'top-pages': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        return res.json(await gaPost(`${GA_API}/properties/${propertyId}:runReport`, token, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'averageSessionDuration' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 20,
        }));
      }

      case 'traffic-sources': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        return res.json(await gaPost(`${GA_API}/properties/${propertyId}:runReport`, token, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'bounceRate' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 20,
        }));
      }

      case 'geo-report': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        return res.json(await gaPost(`${GA_API}/properties/${propertyId}:runReport`, token, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'country' }, { name: 'city' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 30,
        }));
      }

      case 'device-report': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        return res.json(await gaPost(`${GA_API}/properties/${propertyId}:runReport`, token, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'bounceRate' }],
        }));
      }

      // ── Batch Report ──
      case 'batch-report': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        const { requests } = req.body;
        if (!requests) return res.status(400).json({ error: 'requests array required' });
        return res.json(await gaPost(`${GA_API}/properties/${propertyId}:batchRunReports`, token, { requests }));
      }

      // ── Funnel Report ──
      case 'funnel-report': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        const { steps } = req.body;
        if (!steps) return res.status(400).json({ error: 'steps array required (funnel steps)' });
        return res.json(await gaPost(`${GA_API}/properties/${propertyId}:runFunnelReport`, token, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          funnel: { steps },
        }));
      }

      // ── Cohort Analysis ──
      case 'cohort-report': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        const { cohortSpec, metrics: cohortMetrics = 'activeUsers' } = req.body;
        return res.json(await gaPost(`${GA_API}/properties/${propertyId}:runReport`, token, {
          dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'cohort' }, { name: 'cohortNthDay' }],
          metrics: (cohortMetrics as string).split(',').map((m: string) => ({ name: m.trim() })),
          cohortSpec: cohortSpec || { cohorts: [{ dimension: 'firstSessionDate', dateRange: { startDate: '30daysAgo', endDate: 'today' } }] },
        }));
      }

      // ── Metadata (available dimensions/metrics) ──
      case 'list-metadata': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        return res.json(await gaFetch(`${GA_API}/properties/${propertyId}/metadata`, token));
      }

      // ── Data Streams ──
      case 'list-data-streams': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        return res.json(await gaFetch(`${GA_ADMIN}/properties/${propertyId}/dataStreams`, token));
      }

      // ── Custom Dimensions ──
      case 'list-custom-dimensions': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        return res.json(await gaFetch(`${GA_ADMIN}/properties/${propertyId}/customDimensions`, token));
      }

      // ── Audiences ──
      case 'list-audiences': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        return res.json(await gaFetch(`${GA_ADMIN}/properties/${propertyId}/audiences`, token));
      }

      // ── Conversion Events ──
      case 'list-conversion-events': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        return res.json(await gaFetch(`${GA_ADMIN}/properties/${propertyId}/conversionEvents`, token));
      }

      // ── User Properties ──
      case 'list-user-properties': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        return res.json(await gaFetch(`${GA_ADMIN}/properties/${propertyId}/customMetrics`, token));
      }

      // ── Landing Pages ──
      case 'landing-pages': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        return res.json(await gaPost(`${GA_API}/properties/${propertyId}:runReport`, token, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'landingPagePlusQueryString' }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 20,
        }));
      }

      case 'overview': {
        if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
        const [summary, realtime] = await Promise.all([
          gaPost(`${GA_API}/properties/${propertyId}:runReport`, token, {
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'averageSessionDuration' }, { name: 'bounceRate' }],
          }),
          gaPost(`${GA_API}/properties/${propertyId}:runRealtimeReport`, token, {
            metrics: [{ name: 'activeUsers' }],
          }),
        ]);
        return res.json({ summary, realtime_users: realtime.rows?.[0]?.metricValues?.[0]?.value ?? '0' });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
