import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
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
// Google AI File API — upload, poll, list, delete
// Uses REST directly (the @google/generative-ai SDK has limited File API support)
// ---------------------------------------------------------------------------

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';
const FILE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/files';

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

  if (!GOOGLE_AI_KEY) {
    return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
  }

  try {
    const { action } = req.method === 'GET' ? req.query : req.body;

    switch (action) {
      // Upload a file (base64-encoded in request body)
      case 'upload': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

        const { fileData, mimeType, displayName } = req.body;
        if (!fileData || !mimeType) {
          return res.status(400).json({ error: 'fileData (base64) and mimeType required' });
        }

        // Step 1: Start resumable upload to get upload URI
        const startRes = await fetch(
          `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GOOGLE_AI_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Upload-Protocol': 'resumable',
              'X-Goog-Upload-Command': 'start',
              'X-Goog-Upload-Header-Content-Type': mimeType,
              'X-Goog-Upload-Header-Content-Length': String(Buffer.byteLength(fileData, 'base64')),
            },
            body: JSON.stringify({ file: { displayName: displayName || 'uploaded-file' } }),
          },
        );

        const uploadUrl = startRes.headers.get('x-goog-upload-url');
        if (!uploadUrl) {
          const err = await startRes.text();
          return res.status(500).json({ error: 'Failed to get upload URL', details: err });
        }

        // Step 2: Upload the file bytes
        const buffer = Buffer.from(fileData, 'base64');
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Length': String(buffer.length),
            'X-Goog-Upload-Offset': '0',
            'X-Goog-Upload-Command': 'upload, finalize',
          },
          body: buffer,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.text();
          return res.status(500).json({ error: 'File upload failed', details: err });
        }

        const fileInfo = await uploadRes.json();
        return res.json({
          name: fileInfo.file?.name,
          uri: fileInfo.file?.uri,
          mimeType: fileInfo.file?.mimeType,
          sizeBytes: fileInfo.file?.sizeBytes,
          state: fileInfo.file?.state,
          displayName: fileInfo.file?.displayName,
        });
      }

      // Poll file state (for video processing etc.)
      case 'poll': {
        const fileName = (req.method === 'GET' ? req.query.name : req.body.name) as string;
        if (!fileName) return res.status(400).json({ error: 'name required' });

        const pollRes = await fetch(`${FILE_API_BASE}/${fileName}?key=${GOOGLE_AI_KEY}`);
        if (!pollRes.ok) {
          return res.status(pollRes.status).json({ error: 'Failed to poll file status' });
        }
        const info = await pollRes.json();
        return res.json({
          name: info.name,
          uri: info.uri,
          mimeType: info.mimeType,
          state: info.state,
          sizeBytes: info.sizeBytes,
        });
      }

      // List uploaded files
      case 'list': {
        const listRes = await fetch(`${FILE_API_BASE}?key=${GOOGLE_AI_KEY}&pageSize=50`);
        if (!listRes.ok) {
          return res.status(listRes.status).json({ error: 'Failed to list files' });
        }
        const data = await listRes.json();
        return res.json({ files: data.files || [] });
      }

      // Delete a file
      case 'delete': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });

        const delRes = await fetch(`${FILE_API_BASE}/${name}?key=${GOOGLE_AI_KEY}`, {
          method: 'DELETE',
        });
        if (!delRes.ok) {
          return res.status(delRes.status).json({ error: 'Failed to delete file' });
        }
        return res.json({ deleted: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    console.error('[google-files]', message);
    return res.status(500).json({ error: message });
  }
}
