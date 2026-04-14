import { getProviderToken } from './_oauth-helper.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Google Drive API v3 — files, folders, search, permissions, export
// ---------------------------------------------------------------------------

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const t = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!t) { res.status(401).json({ error: 'Auth required' }); return null; }
  try { const { verifyToken } = await import('@clerk/backend'); return (await verifyToken(t, { secretKey })).sub; }
  catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

async function driveFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${DRIVE_API}${path}${qs ? '?' + qs : ''}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Drive ${res.status}`); }
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
      case 'list-files': {
        const { pageSize = '20', q, orderBy = 'modifiedTime desc', pageToken } = req.query;
        const params: Record<string, string> = {
          pageSize: pageSize as string, orderBy: orderBy as string,
          fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,owners,webViewLink,iconLink,thumbnailLink)',
        };
        if (q) params.q = q as string;
        if (pageToken) params.pageToken = pageToken as string;
        return res.json(await driveFetch('/files', token, params));
      }

      case 'get-file': {
        const { fileId } = req.query;
        if (!fileId) return res.status(400).json({ error: 'fileId required' });
        return res.json(await driveFetch(`/files/${fileId}`, token, {
          fields: 'id,name,mimeType,size,modifiedTime,createdTime,owners,permissions,webViewLink,description,starred',
        }));
      }

      case 'search': {
        const { query, pageSize = '20' } = req.query;
        if (!query) return res.status(400).json({ error: 'query required' });
        return res.json(await driveFetch('/files', token, {
          q: `fullText contains '${(query as string).replace(/'/g, "\\'")}'`,
          pageSize: pageSize as string,
          fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
        }));
      }

      case 'list-shared':
        return res.json(await driveFetch('/files', token, {
          q: 'sharedWithMe=true', pageSize: '20', orderBy: 'modifiedTime desc',
          fields: 'files(id,name,mimeType,size,modifiedTime,owners,webViewLink)',
        }));

      case 'list-recent':
        return res.json(await driveFetch('/files', token, {
          q: `modifiedTime > '${new Date(Date.now() - 7 * 86400000).toISOString()}'`,
          pageSize: '20', orderBy: 'modifiedTime desc',
          fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
        }));

      case 'list-starred':
        return res.json(await driveFetch('/files', token, {
          q: 'starred=true', pageSize: '20',
          fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
        }));

      case 'get-storage':
        return res.json(await driveFetch('/about', token, { fields: 'storageQuota,user' }));

      case 'export-file': {
        const { fileId, mimeType = 'text/plain' } = req.query;
        if (!fileId) return res.status(400).json({ error: 'fileId required' });
        const exportRes = await fetch(`${DRIVE_API}/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType as string)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!exportRes.ok) throw new Error(`Export failed: ${exportRes.status}`);
        const content = await exportRes.text();
        return res.json({ content: content.slice(0, 50000) });
      }

      case 'overview': {
        const [about, recent] = await Promise.all([
          driveFetch('/about', token, { fields: 'storageQuota,user' }),
          driveFetch('/files', token, { pageSize: '5', orderBy: 'modifiedTime desc', fields: 'files(name,modifiedTime,mimeType)' }),
        ]);
        const q = about.storageQuota;
        return res.json({
          user: about.user?.displayName,
          email: about.user?.emailAddress,
          storage_used_gb: q?.usage ? (Number(q.usage) / 1e9).toFixed(2) : 'N/A',
          storage_limit_gb: q?.limit ? (Number(q.limit) / 1e9).toFixed(0) : 'unlimited',
          recent_files: recent.files?.map((f: { name: string; mimeType: string }) => `${f.name} (${f.mimeType})`),
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
