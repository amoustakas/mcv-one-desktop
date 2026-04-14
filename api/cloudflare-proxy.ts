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


// ---------------------------------------------------------------------------
// Cloudflare API Proxy
// ---------------------------------------------------------------------------
// Server-side proxy for Cloudflare API. Kit code never sees the API token.
// Supports: Workers, KV, R2, D1, and account management.

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CF_BASE = 'https://api.cloudflare.com/client/v4';

// R2 S3-compatible credentials (separate from CF_API_TOKEN).
// Generate at: Cloudflare Dashboard → R2 → Manage R2 API Tokens.
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_ENDPOINT = CF_ACCOUNT_ID ? `https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com` : '';

async function getR2Client() {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY not configured');
  }
  const { S3Client } = await import('@aws-sdk/client-s3');
  return new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

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

      // ── Worker Deploy / Delete ────────────────────────────────
      case 'deploy-worker': {
        const { scriptName, script, bindings } = req.body;
        if (!scriptName || !script) return res.status(400).json({ error: 'scriptName and script required' });
        // Workers API expects multipart form for script upload; use metadata + script parts
        const metadata = JSON.stringify({ main_module: 'worker.js', bindings: bindings || [] });
        const boundary = '----CFWorkerBoundary';
        const body = [
          `--${boundary}`,
          'Content-Disposition: form-data; name="metadata"; filename="metadata.json"',
          'Content-Type: application/json',
          '',
          metadata,
          `--${boundary}`,
          'Content-Disposition: form-data; name="worker.js"; filename="worker.js"',
          'Content-Type: application/javascript+module',
          '',
          script,
          `--${boundary}--`,
        ].join('\r\n');

        const url = `${CF_BASE}/accounts/${CF_ACCOUNT_ID}/workers/scripts/${scriptName}`;
        const deployRes = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${CF_API_TOKEN}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
          },
          body,
        });
        const data = await deployRes.json().catch(() => ({ success: false, errors: [{ message: 'Non-JSON response' }] }));
        if (!data.success && data.errors?.length) throw new Error(data.errors.map((e: { message: string }) => e.message).join('; '));
        return res.json({ success: true, worker: data.result });
      }

      case 'delete-worker': {
        const { scriptName } = req.body;
        if (!scriptName) return res.status(400).json({ error: 'scriptName required' });
        await cfFetch(`/accounts/${CF_ACCOUNT_ID}/workers/scripts/${scriptName}`, { method: 'DELETE' });
        return res.json({ success: true, scriptName });
      }

      // ── KV Delete / Bulk Put ────────────────────────────────
      case 'kv-delete': {
        const { namespace_id: nsId, key } = req.body;
        if (!nsId || !key) return res.status(400).json({ error: 'namespace_id and key required' });
        const url = `${CF_BASE}/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}`;
        await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${CF_API_TOKEN}` } });
        return res.json({ success: true, key });
      }

      case 'kv-bulk-put': {
        const { namespace_id: nsId, kvPairs } = req.body;
        if (!nsId || !kvPairs || !Array.isArray(kvPairs)) return res.status(400).json({ error: 'namespace_id and kvPairs array required' });
        await cfFetch(
          `/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${nsId}/bulk`,
          { method: 'PUT', body: JSON.stringify(kvPairs) },
        );
        return res.json({ success: true, count: kvPairs.length });
      }

      // ── R2 Object Operations ────────────────────────────────
      // Direct upload via S3 client. For small files (<4MB) pass `body` as a
      // base64-encoded string along with optional `content_type` and
      // `metadata`. For large files prefer `r2-presigned-upload` and upload
      // directly from the client.
      case 'r2-upload-object': {
        const { bucket, key, body: bodyB64, content_type, metadata } = req.body;
        if (!bucket || !key) return res.status(400).json({ error: 'bucket and key required' });
        if (!bodyB64 || typeof bodyB64 !== 'string') {
          return res.status(400).json({ error: 'body (base64 string) required. Use r2-presigned-upload for large files.' });
        }
        const client = await getR2Client();
        const { PutObjectCommand } = await import('@aws-sdk/client-s3');
        const buf = Buffer.from(bodyB64, 'base64');
        const result = await client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buf,
          ContentType: content_type || 'application/octet-stream',
          Metadata: metadata || undefined,
        }));
        return res.json({
          success: true,
          object: {
            bucket,
            key,
            size: buf.byteLength,
            etag: result.ETag,
            version_id: result.VersionId,
          },
        });
      }

      // Issue a presigned URL the client can PUT to directly (bypasses our
      // serverless size limits and is far cheaper for large media).
      case 'r2-presigned-upload': {
        const { bucket, key, content_type, expires_in = 900 } = req.body;
        if (!bucket || !key) return res.status(400).json({ error: 'bucket and key required' });
        const client = await getR2Client();
        const { PutObjectCommand } = await import('@aws-sdk/client-s3');
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
        const cmd = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: content_type || 'application/octet-stream',
        });
        const url = await getSignedUrl(client, cmd, { expiresIn: expires_in });
        return res.json({
          success: true,
          url,
          method: 'PUT',
          expires_in,
          headers: { 'Content-Type': content_type || 'application/octet-stream' },
        });
      }

      // Download via presigned GET (for private buckets).
      case 'r2-presigned-download': {
        const { bucket, key, expires_in = 900 } = req.body;
        if (!bucket || !key) return res.status(400).json({ error: 'bucket and key required' });
        const client = await getR2Client();
        const { GetObjectCommand } = await import('@aws-sdk/client-s3');
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
        const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
        const url = await getSignedUrl(client, cmd, { expiresIn: expires_in });
        return res.json({ success: true, url, expires_in });
      }

      // List objects in a bucket.
      case 'r2-list-objects': {
        const { bucket, prefix, max_keys = 1000, continuation_token } = req.body;
        if (!bucket) return res.status(400).json({ error: 'bucket required' });
        const client = await getR2Client();
        const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
        const out = await client.send(new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          MaxKeys: max_keys,
          ContinuationToken: continuation_token,
        }));
        return res.json({
          success: true,
          objects: (out.Contents || []).map(o => ({
            key: o.Key,
            size: o.Size,
            etag: o.ETag,
            last_modified: o.LastModified?.toISOString(),
          })),
          is_truncated: out.IsTruncated,
          next_continuation_token: out.NextContinuationToken,
        });
      }

      // Head (metadata-only) check — useful before download.
      case 'r2-head-object': {
        const { bucket, key } = req.body;
        if (!bucket || !key) return res.status(400).json({ error: 'bucket and key required' });
        const client = await getR2Client();
        const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
        try {
          const out = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
          return res.json({
            success: true,
            object: {
              key,
              size: out.ContentLength,
              etag: out.ETag,
              content_type: out.ContentType,
              last_modified: out.LastModified?.toISOString(),
              metadata: out.Metadata,
            },
          });
        } catch (e) {
          const status = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
          if (status === 404) return res.json({ success: true, object: null });
          throw e;
        }
      }

      case 'r2-delete-object': {
        const { bucket, key } = req.body;
        if (!bucket || !key) return res.status(400).json({ error: 'bucket and key required' });
        await cfFetch(
          `/accounts/${CF_ACCOUNT_ID}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`,
          { method: 'DELETE' },
        );
        return res.json({ success: true, bucket, key });
      }

      case 'r2-get-object-info': {
        const { bucket, key } = req.body;
        if (!bucket || !key) return res.status(400).json({ error: 'bucket and key required' });
        const url = `${CF_BASE}/accounts/${CF_ACCOUNT_ID}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`;
        const headRes = await fetch(url, {
          method: 'HEAD',
          headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
        });
        return res.json({
          exists: headRes.ok,
          contentLength: headRes.headers.get('content-length'),
          contentType: headRes.headers.get('content-type'),
          lastModified: headRes.headers.get('last-modified'),
        });
      }

      // ── D1 Execute (write operations) ──────────────────────
      case 'd1-execute': {
        const { database_id, sql, params } = req.body;
        if (!database_id || !sql) return res.status(400).json({ error: 'database_id and sql required' });
        const data = await cfFetch(
          `/accounts/${CF_ACCOUNT_ID}/d1/database/${database_id}/query`,
          { method: 'POST', body: JSON.stringify({ sql, params: params || [] }) },
        );
        return res.json({
          results: data.result?.[0]?.results ?? [],
          meta: data.result?.[0]?.meta ?? {},
          success: true,
        });
      }

      // ── Zone / DNS Management ──────────────────────────────
      case 'create-zone': {
        const { name, jumpStart } = req.body;
        if (!name) return res.status(400).json({ error: 'domain name required' });
        const data = await cfFetch('/zones', {
          method: 'POST',
          body: JSON.stringify({ name, account: { id: CF_ACCOUNT_ID }, jump_start: jumpStart ?? true }),
        });
        return res.json({ zone: { id: data.result?.id, name: data.result?.name, status: data.result?.status } });
      }

      case 'create-dns-record': {
        const { zoneId, type: recordType, name: recordName, content, proxied, ttl } = req.body;
        if (!zoneId || !recordType || !recordName || !content) {
          return res.status(400).json({ error: 'zoneId, type, name, and content required' });
        }
        const data = await cfFetch(`/zones/${zoneId}/dns_records`, {
          method: 'POST',
          body: JSON.stringify({ type: recordType, name: recordName, content, proxied: proxied ?? true, ttl: ttl || 1 }),
        });
        return res.json({ record: data.result });
      }

      case 'update-dns-record': {
        const { zoneId, recordId, type: recordType, name: recordName, content, proxied, ttl } = req.body;
        if (!zoneId || !recordId) return res.status(400).json({ error: 'zoneId and recordId required' });
        const payload: Record<string, unknown> = {};
        if (recordType !== undefined) payload.type = recordType;
        if (recordName !== undefined) payload.name = recordName;
        if (content !== undefined) payload.content = content;
        if (proxied !== undefined) payload.proxied = proxied;
        if (ttl !== undefined) payload.ttl = ttl;
        const data = await cfFetch(`/zones/${zoneId}/dns_records/${recordId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        return res.json({ record: data.result });
      }

      case 'delete-dns-record': {
        const { zoneId, recordId } = req.body;
        if (!zoneId || !recordId) return res.status(400).json({ error: 'zoneId and recordId required' });
        await cfFetch(`/zones/${zoneId}/dns_records/${recordId}`, { method: 'DELETE' });
        return res.json({ success: true, recordId });
      }

      case 'list-dns-records': {
        const { zoneId } = req.body;
        if (!zoneId) return res.status(400).json({ error: 'zoneId required' });
        const data = await cfFetch(`/zones/${zoneId}/dns_records?per_page=100`);
        return res.json({
          records: (data.result ?? []).map((r: Record<string, unknown>) => ({
            id: r.id, type: r.type, name: r.name, content: r.content,
            proxied: r.proxied, ttl: r.ttl,
          })),
        });
      }

      // ── Cache Purge ─────────────────────────────────────────
      case 'purge-cache': {
        const { zoneId, purgeEverything, files } = req.body;
        if (!zoneId) return res.status(400).json({ error: 'zoneId required' });
        const payload: Record<string, unknown> = {};
        if (purgeEverything) {
          payload.purge_everything = true;
        } else if (files && Array.isArray(files)) {
          payload.files = files;
        } else {
          return res.status(400).json({ error: 'purgeEverything or files array required' });
        }
        const data = await cfFetch(`/zones/${zoneId}/purge_cache`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        return res.json({ success: true, id: data.result?.id });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
