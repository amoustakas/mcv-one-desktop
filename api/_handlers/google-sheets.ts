import { getProviderToken } from './_oauth-helper.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Google Sheets API v4 — read, write, create, format, append
// ---------------------------------------------------------------------------

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const t = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!t) { res.status(401).json({ error: 'Auth required' }); return null; }
  try { const { verifyToken } = await import('@clerk/backend'); return (await verifyToken(t, { secretKey })).sub; }
  catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

async function sheetsFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${SHEETS_API}${path}${qs ? '?' + qs : ''}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Sheets ${res.status}`); }
  return res.json();
}

async function sheetsPost(url: string, token: string, body: unknown, method = 'POST') {
  const res = await fetch(url, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Sheets ${res.status}`); }
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
      case 'get-spreadsheet': {
        const { spreadsheetId } = req.query;
        if (!spreadsheetId) return res.status(400).json({ error: 'spreadsheetId required' });
        return res.json(await sheetsFetch(`/${spreadsheetId}`, token, { fields: 'spreadsheetId,properties,sheets.properties' }));
      }

      case 'read-range': {
        const { spreadsheetId, range } = req.query;
        if (!spreadsheetId || !range) return res.status(400).json({ error: 'spreadsheetId and range required' });
        return res.json(await sheetsFetch(`/${spreadsheetId}/values/${encodeURIComponent(range as string)}`, token, { valueRenderOption: 'FORMATTED_VALUE' }));
      }

      case 'write-range': {
        const { spreadsheetId, range, values } = req.body;
        if (!spreadsheetId || !range || !values) return res.status(400).json({ error: 'spreadsheetId, range, and values required' });
        return res.json(await sheetsPost(
          `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
          token, { values }, 'PUT',
        ));
      }

      case 'append-rows': {
        const { spreadsheetId, range, values } = req.body;
        if (!spreadsheetId || !range || !values) return res.status(400).json({ error: 'spreadsheetId, range, and values required' });
        return res.json(await sheetsPost(
          `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
          token, { values },
        ));
      }

      case 'create-spreadsheet': {
        const { title, sheets } = req.body;
        if (!title) return res.status(400).json({ error: 'title required' });
        return res.json(await sheetsPost(SHEETS_API, token, {
          properties: { title },
          sheets: sheets?.map((s: string) => ({ properties: { title: s } })) || [{ properties: { title: 'Sheet1' } }],
        }));
      }

      case 'batch-get': {
        const { spreadsheetId, ranges } = req.query;
        if (!spreadsheetId || !ranges) return res.status(400).json({ error: 'spreadsheetId and ranges required' });
        const rangeArr = (ranges as string).split(',');
        const qs = rangeArr.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
        const url = `${SHEETS_API}/${spreadsheetId}/values:batchGet?${qs}&valueRenderOption=FORMATTED_VALUE`;
        const data = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        return res.json(await data.json());
      }

      case 'clear-range': {
        const { spreadsheetId, range } = req.body;
        if (!spreadsheetId || !range) return res.status(400).json({ error: 'spreadsheetId and range required' });
        return res.json(await sheetsPost(
          `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, token, {},
        ));
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
