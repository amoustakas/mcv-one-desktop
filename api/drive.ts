import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_DRIVE_KEY = process.env.GOOGLE_DRIVE_KEY || process.env.GOOGLE_API_KEY || '';
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';

/** Build a Drive API URL with the API key and optional query params */
function driveUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${DRIVE_BASE}${path}`);
  url.searchParams.set('key', GOOGLE_DRIVE_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  return url.toString();
}

/** Simplify a Drive file object into a clean structure */
function simplifyFile(file: Record<string, unknown>): Record<string, unknown> {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    modifiedTime: file.modifiedTime,
    createdTime: file.createdTime,
    size: file.size,
    webViewLink: file.webViewLink,
    webContentLink: file.webContentLink,
    iconLink: file.iconLink,
    parents: file.parents,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!GOOGLE_DRIVE_KEY) {
    return res.status(500).json({
      error: 'Google Drive API key not configured. Set GOOGLE_DRIVE_KEY or GOOGLE_API_KEY environment variable.',
    });
  }

  const { action } = req.body;

  try {
    switch (action) {
      // --- List files (with optional query, mimeType, folderId filters) ---
      case 'list': {
        const { query, mimeType, folderId, pageSize, pageToken } = req.body;
        const qParts: string[] = [];

        if (query) qParts.push(`name contains '${query.replace(/'/g, "\\'")}'`);
        if (mimeType) qParts.push(`mimeType = '${mimeType.replace(/'/g, "\\'")}'`);
        if (folderId) qParts.push(`'${folderId.replace(/'/g, "\\'")}' in parents`);
        qParts.push('trashed = false');

        const params: Record<string, string> = {
          q: qParts.join(' and '),
          fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, createdTime, size, webViewLink, webContentLink, iconLink, parents)',
          pageSize: String(pageSize || 20),
          orderBy: 'modifiedTime desc',
        };
        if (pageToken) params.pageToken = pageToken;

        const response = await fetch(driveUrl('/files', params));
        const data = await response.json();
        if (!response.ok) {
          const msg = data.error?.message || 'Google Drive API error';
          return res.status(response.status).json({ error: msg });
        }

        return res.json({
          files: (data.files || []).map((f: Record<string, unknown>) => simplifyFile(f)),
          nextPageToken: data.nextPageToken || null,
        });
      }

      // --- Get file metadata ---
      case 'get': {
        const { fileId } = req.body;
        if (!fileId) return res.status(400).json({ error: 'fileId is required' });

        const params: Record<string, string> = {
          fields: 'id, name, mimeType, modifiedTime, createdTime, size, webViewLink, webContentLink, iconLink, parents, description',
        };

        const response = await fetch(driveUrl(`/files/${fileId}`, params));
        const data = await response.json();
        if (!response.ok) {
          const msg = data.error?.message || 'Google Drive API error';
          return res.status(response.status).json({ error: msg });
        }

        return res.json({ file: simplifyFile(data) });
      }

      // --- Export Google Doc/Sheet/Slide as text ---
      case 'export': {
        const { fileId, mimeType } = req.body;
        if (!fileId) return res.status(400).json({ error: 'fileId is required' });

        // Default export as plain text; support common export types
        const exportMime = mimeType || 'text/plain';
        const params: Record<string, string> = { mimeType: exportMime };

        const response = await fetch(driveUrl(`/files/${fileId}/export`, params));

        if (!response.ok) {
          // Try to parse error JSON, but export may return text errors
          let errorMsg = 'Google Drive export error';
          try {
            const errData = await response.json();
            errorMsg = errData.error?.message || errorMsg;
          } catch {
            errorMsg = await response.text();
          }
          return res.status(response.status).json({ error: errorMsg });
        }

        const content = await response.text();
        return res.json({ content, mimeType: exportMime });
      }

      // --- Search files by full-text query ---
      case 'search': {
        const { query, pageSize, pageToken } = req.body;
        if (!query) return res.status(400).json({ error: 'query is required' });

        const params: Record<string, string> = {
          q: `fullText contains '${query.replace(/'/g, "\\'")}' and trashed = false`,
          fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, createdTime, size, webViewLink, webContentLink, iconLink, parents)',
          pageSize: String(pageSize || 20),
          orderBy: 'modifiedTime desc',
        };
        if (pageToken) params.pageToken = pageToken;

        const response = await fetch(driveUrl('/files', params));
        const data = await response.json();
        if (!response.ok) {
          const msg = data.error?.message || 'Google Drive API error';
          return res.status(response.status).json({ error: msg });
        }

        return res.json({
          files: (data.files || []).map((f: Record<string, unknown>) => simplifyFile(f)),
          nextPageToken: data.nextPageToken || null,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
