import { getProviderToken } from './_oauth-helper.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Google Search Console API — performance, URL inspection, sitemaps
// ---------------------------------------------------------------------------

const GSC_API = 'https://searchconsole.googleapis.com/webmasters/v3';
const GSC_V1 = 'https://searchconsole.googleapis.com/v1';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const t = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!t) { res.status(401).json({ error: 'Auth required' }); return null; }
  try { const { verifyToken } = await import('@clerk/backend'); return (await verifyToken(t, { secretKey })).sub; }
  catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

async function gscFetch(url: string, token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `GSC ${res.status}`); }
  return res.json();
}

async function gscPost(url: string, token: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `GSC ${res.status}`); }
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
      case 'list-sites':
        return res.json(await gscFetch(`${GSC_API}/sites`, token));

      case 'get-site': {
        const { siteUrl } = req.query;
        if (!siteUrl) return res.status(400).json({ error: 'siteUrl required' });
        return res.json(await gscFetch(`${GSC_API}/sites/${encodeURIComponent(siteUrl as string)}`, token));
      }

      case 'search-analytics': {
        const { siteUrl, startDate, endDate, dimensions = 'query', rowLimit = 25 } = req.body || {};
        if (!siteUrl) return res.status(400).json({ error: 'siteUrl required' });
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        return res.json(await gscPost(`${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, token, {
          startDate: startDate || thirtyDaysAgo,
          endDate: endDate || today,
          dimensions: (dimensions as string).split(',').map((d: string) => d.trim()),
          rowLimit: Number(rowLimit),
        }));
      }

      case 'top-queries': {
        const { siteUrl } = req.body || req.query;
        if (!siteUrl) return res.status(400).json({ error: 'siteUrl required' });
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        return res.json(await gscPost(`${GSC_API}/sites/${encodeURIComponent(siteUrl as string)}/searchAnalytics/query`, token, {
          startDate: thirtyDaysAgo, endDate: today,
          dimensions: ['query'],
          rowLimit: 25,
        }));
      }

      case 'top-pages': {
        const { siteUrl } = req.body || req.query;
        if (!siteUrl) return res.status(400).json({ error: 'siteUrl required' });
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        return res.json(await gscPost(`${GSC_API}/sites/${encodeURIComponent(siteUrl as string)}/searchAnalytics/query`, token, {
          startDate: thirtyDaysAgo, endDate: today,
          dimensions: ['page'],
          rowLimit: 25,
        }));
      }

      case 'list-sitemaps': {
        const { siteUrl } = req.query;
        if (!siteUrl) return res.status(400).json({ error: 'siteUrl required' });
        return res.json(await gscFetch(`${GSC_API}/sites/${encodeURIComponent(siteUrl as string)}/sitemaps`, token));
      }

      case 'inspect-url': {
        const { siteUrl, inspectionUrl } = req.body;
        if (!siteUrl || !inspectionUrl) return res.status(400).json({ error: 'siteUrl and inspectionUrl required' });
        return res.json(await gscPost(`${GSC_V1}/urlInspection/index:inspect`, token, { siteUrl, inspectionUrl }));
      }

      // ── Sitemap Management ──
      case 'submit-sitemap': {
        const { siteUrl, feedpath } = req.body;
        if (!siteUrl || !feedpath) return res.status(400).json({ error: 'siteUrl and feedpath required' });
        const r = await fetch(`${GSC_API}/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(feedpath)}`, {
          method: 'PUT', headers: { Authorization: `Bearer ${token}` },
        });
        return res.json({ submitted: r.ok });
      }

      case 'delete-sitemap': {
        const { siteUrl, feedpath } = req.body;
        if (!siteUrl || !feedpath) return res.status(400).json({ error: 'siteUrl and feedpath required' });
        const r = await fetch(`${GSC_API}/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(feedpath)}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
        return res.json({ deleted: r.ok });
      }

      // ── Country Performance ──
      case 'country-performance': {
        const { siteUrl } = req.body;
        if (!siteUrl) return res.status(400).json({ error: 'siteUrl required' });
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        return res.json(await gscPost(`${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, token, {
          startDate: thirtyDaysAgo, endDate: today, dimensions: ['country'], rowLimit: 25,
        }));
      }

      // ── Device Performance ──
      case 'device-performance': {
        const { siteUrl } = req.body;
        if (!siteUrl) return res.status(400).json({ error: 'siteUrl required' });
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        return res.json(await gscPost(`${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, token, {
          startDate: thirtyDaysAgo, endDate: today, dimensions: ['device'], rowLimit: 5,
        }));
      }

      // ── Date Performance (daily trend) ──
      case 'daily-performance': {
        const { siteUrl } = req.body;
        if (!siteUrl) return res.status(400).json({ error: 'siteUrl required' });
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        return res.json(await gscPost(`${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, token, {
          startDate: thirtyDaysAgo, endDate: today, dimensions: ['date'], rowLimit: 31,
        }));
      }

      // ── Links (External + Internal) ──
      case 'external-links': {
        const { siteUrl } = req.query;
        if (!siteUrl) return res.status(400).json({ error: 'siteUrl required' });
        return res.json(await gscFetch(`${GSC_API}/sites/${encodeURIComponent(siteUrl as string)}/searchAnalytics/query`, token));
      }

      case 'overview': {
        const sites = await gscFetch(`${GSC_API}/sites`, token);
        return res.json({
          site_count: sites.siteEntry?.length ?? 0,
          sites: sites.siteEntry?.map((s: { siteUrl: string; permissionLevel: string }) => ({
            url: s.siteUrl, permission: s.permissionLevel,
          })),
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
