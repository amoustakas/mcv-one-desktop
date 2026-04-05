import { requireAuth } from "./auth-middleware";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Cloudflare API Proxy
// ---------------------------------------------------------------------------
// Server-side proxy for Cloudflare API. Kit code never sees the API token.
// Supports: Workers, KV, R2, D1, and account management.

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CF_BASE = 'https://api.cloudflare.com/client/v4';

async function cfFetch(path: string, options: RequestInit = {}) {
  const url = `${CF_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CF_API_TOKEN}`,
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({ success: false, errors: [{ message: 'Non-JSON response' }] }));

  if (!data.success && data.errors?.length) {
    throw new Error(data.errors.map((e: { message: string }) => e.message).join('; '));
  }
  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    return res.status(500).json({ error: 'CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID not configured' });
  }

  const action = req.body?.action;

  try {
    switch (action) {
      // ── Workers ──────────────────────────────────────────────
      case 'list-workers': {
        const data = await cfFetch(`/accounts/${CF_ACCOUNT_ID}/workers/scripts`);
        const workers = (data.result ?? []).map(
          (w: { id: string; etag: string; modified_on: string; created_on: string }) => ({
            id: w.id,
            modified: w.modified_on,
            created: w.created_on,
          }),
        );
        return res.json({ workers });
      }

      case 'get-worker': {
        const name = req.body.name as string;
        if (!name) return res.status(400).json({ error: 'name required' });
        const data = await cfFetch(`/accounts/${CF_ACCOUNT_ID}/workers/scripts/${name}`);
        return res.json({ worker: data.result });
      }

      // ── KV Namespaces ───────────────────────────────────────
      case 'list-kv': {
        const data = await cfFetch(`/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces`);
        const namespaces = (data.result ?? []).map(
          (ns: { id: string; title: string }) => ({ id: ns.id, title: ns.title }),
        );
        return res.json({ namespaces });
      }

      case 'kv-list-keys': {
        const nsId = req.body.namespace_id as string;
        const prefix = req.body.prefix as string || '';
        const limit = Math.min(Number(req.body.limit) || 100, 1000);
        if (!nsId) return res.status(400).json({ error: 'namespace_id required' });
        const data = await cfFetch(
          `/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${nsId}/keys?limit=${limit}${prefix ? '&prefix=' + encodeURIComponent(prefix) : ''}`,
        );
        return res.json({ keys: data.result ?? [] });
      }

      case 'kv-get': {
        const { namespace_id: nsId, key } = req.body;
        if (!nsId || !key) return res.status(400).json({ error: 'namespace_id and key required' });
        // KV values return raw text, not JSON
        const url = `${CF_BASE}/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}`;
        const kvRes = await fetch(url, { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } });
        const value = await kvRes.text();
        return res.json({ key, value });
      }

      case 'kv-put': {
        const { namespace_id: nsId, key, value } = req.body;
        if (!nsId || !key) return res.status(400).json({ error: 'namespace_id, key required' });
        const url = `${CF_BASE}/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}`;
        await fetch(url, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'text/plain' },
          body: String(value ?? ''),
        });
        return res.json({ success: true });
      }

      // ── R2 Buckets ──────────────────────────────────────────
      case 'list-r2-buckets': {
        const data = await cfFetch(`/accounts/${CF_ACCOUNT_ID}/r2/buckets`);
        const buckets = (data.result?.buckets ?? data.result ?? []).map(
          (b: { name: string; creation_date: string }) => ({ name: b.name, created: b.creation_date }),
        );
        return res.json({ buckets });
      }

      // ── D1 Databases ────────────────────────────────────────
      case 'list-d1': {
        const data = await cfFetch(`/accounts/${CF_ACCOUNT_ID}/d1/database`);
        const databases = (data.result ?? []).map(
          (db: { uuid: string; name: string; version: string; created_at: string }) => ({
            id: db.uuid,
            name: db.name,
            version: db.version,
            created: db.created_at,
          }),
        );
        return res.json({ databases });
      }

      case 'd1-query': {
        const { database_id, sql, params } = req.body;
        if (!database_id || !sql) return res.status(400).json({ error: 'database_id and sql required' });
        const data = await cfFetch(
          `/accounts/${CF_ACCOUNT_ID}/d1/database/${database_id}/query`,
          { method: 'POST', body: JSON.stringify({ sql, params: params || [] }) },
        );
        return res.json({
          results: data.result?.[0]?.results ?? [],
          meta: data.result?.[0]?.meta ?? {},
        });
      }

      // ── Account Info ────────────────────────────────────────
      case 'account-info': {
        const data = await cfFetch(`/accounts/${CF_ACCOUNT_ID}`);
        return res.json({
          id: data.result?.id,
          name: data.result?.name,
          type: data.result?.type,
          settings: data.result?.settings,
        });
      }

      // ── Zones / Domains ─────────────────────────────────────
      case 'list-zones': {
        const data = await cfFetch('/zones?account.id=' + CF_ACCOUNT_ID);
        const zones = (data.result ?? []).map(
          (z: { id: string; name: string; status: string; plan: { name: string } }) => ({
            id: z.id,
            domain: z.name,
            status: z.status,
            plan: z.plan?.name,
          }),
        );
        return res.json({ zones });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
