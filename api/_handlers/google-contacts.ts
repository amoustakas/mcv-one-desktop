import { getProviderToken } from './_oauth-helper.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
const PEOPLE_API = 'https://people.googleapis.com/v1';

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

async function peopleFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${PEOPLE_API}${path}${qs ? '?' + qs : ''}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `People API ${res.status}`); }
  return res.json();
}

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
  const userId = await requireAuth(req, res);
  if (!userId) return;

  let token: string;
  try { token = (await getProviderToken(userId, 'google')).token; }
  catch (err) { return res.status(401).json({ error: err instanceof Error ? err.message : 'Google not connected.' }); }

  const action = req.query.action as string;

  try {
    switch (action) {
      case 'list': {
        const { pageSize = '50', pageToken } = req.query;
        const params: Record<string, string> = {
          personFields: 'names,emailAddresses,phoneNumbers,photos,organizations',
          pageSize: pageSize as string,
        };
        if (pageToken) params.pageToken = pageToken as string;
        const data = await peopleFetch('/people/me/connections', token, params);
        const contacts = (data.connections ?? []).map((c: Record<string, unknown>) => {
          const names = c.names as Array<{ displayName: string }> | undefined;
          const emails = c.emailAddresses as Array<{ value: string }> | undefined;
          const phones = c.phoneNumbers as Array<{ value: string }> | undefined;
          const photos = c.photos as Array<{ url: string }> | undefined;
          const orgs = c.organizations as Array<{ name: string; title: string }> | undefined;
          return {
            resourceName: c.resourceName,
            name: names?.[0]?.displayName || '',
            email: emails?.[0]?.value || '',
            phone: phones?.[0]?.value || '',
            photo: photos?.[0]?.url || '',
            organization: orgs?.[0]?.name || '',
            title: orgs?.[0]?.title || '',
          };
        });
        return res.json({ contacts, nextPageToken: data.nextPageToken, totalItems: data.totalItems });
      }

      case 'search': {
        const { query, pageSize = '20' } = req.query;
        if (!query) return res.status(400).json({ error: 'query required' });
        const data = await peopleFetch('/people:searchContacts', token, {
          query: query as string,
          pageSize: pageSize as string,
          readMask: 'names,emailAddresses,phoneNumbers,photos,organizations',
        });
        const results = (data.results ?? []).map((r: { person: Record<string, unknown> }) => {
          const c = r.person;
          const names = c.names as Array<{ displayName: string }> | undefined;
          const emails = c.emailAddresses as Array<{ value: string }> | undefined;
          return {
            resourceName: c.resourceName,
            name: names?.[0]?.displayName || '',
            email: emails?.[0]?.value || '',
          };
        });
        return res.json({ results });
      }

      case 'autocomplete': {
        const { q, limit = '5' } = req.query;
        if (!q) return res.status(400).json({ error: 'q required' });
        const data = await peopleFetch('/people:searchContacts', token, {
          query: q as string,
          pageSize: limit as string,
          readMask: 'names,emailAddresses',
        });
        const suggestions = (data.results ?? []).map((r: { person: Record<string, unknown> }) => {
          const c = r.person;
          const names = c.names as Array<{ displayName: string }> | undefined;
          const emails = c.emailAddresses as Array<{ value: string }> | undefined;
          return { name: names?.[0]?.displayName || '', email: emails?.[0]?.value || '' };
        }).filter((s: { email: string }) => s.email);
        return res.json({ suggestions });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
