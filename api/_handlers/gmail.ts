import { getProviderToken } from './_oauth-helper.js';
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
// Gmail API v1 — messages, labels, drafts, send, search, threads
// Uses Google OAuth token (gmail.readonly or gmail.send scopes)
// ---------------------------------------------------------------------------

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

class GoogleApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function mapGoogleStatus(status: number, message: string): GoogleApiError {
  switch (status) {
    case 401: return new GoogleApiError('Google token expired or revoked. Please reconnect in Settings > Integrations.', 401);
    case 403: return new GoogleApiError('Missing permission. Please reconnect Google with required scopes.', 403);
    case 404: return new GoogleApiError('Resource not found.', 404);
    case 429: return new GoogleApiError('Rate limited by Google. Try again in a moment.', 429);
    default: return new GoogleApiError(message || `Gmail API error (${status})`, status >= 500 ? 502 : status);
  }
}

async function gmailFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${GMAIL_API}${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw mapGoogleStatus(res.status, err.error?.message || '');
  }
  return res.json();
}

async function gmailPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${GMAIL_API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw mapGoogleStatus(res.status, err.error?.message || '');
  }
  return res.json();
}

/** Decode base64url encoded email body */
function decodeBody(encoded: string): string {
  try {
    return Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  } catch { return ''; }
}

/** Extract header value from Gmail message headers */
function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  let token: string;
  try {
    const result = await getProviderToken(userId, 'google');
    token = result.token;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Google not connected.';
    return res.status(401).json({ error: message });
  }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Profile ──
      case 'profile':
        return res.json(await gmailFetch('/profile', token));

      // ── Labels ──
      case 'list-labels':
        return res.json(await gmailFetch('/labels', token));

      case 'get-label': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await gmailFetch(`/labels/${id}`, token));
      }

      // ── Messages ──
      case 'list-messages': {
        const { q, maxResults = '20', labelIds } = req.query;
        const params: Record<string, string> = { maxResults: maxResults as string };
        if (q) params.q = q as string;
        if (labelIds) params.labelIds = labelIds as string;
        return res.json(await gmailFetch('/messages', token, params));
      }

      case 'get-message': {
        const { id, format = 'full' } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        const msg = await gmailFetch(`/messages/${id}`, token, { format: format as string });

        // Parse headers and body for convenience
        const headers = msg.payload?.headers || [];
        let body = '';
        if (msg.payload?.body?.data) {
          body = decodeBody(msg.payload.body.data);
        } else if (msg.payload?.parts) {
          const textPart = msg.payload.parts.find((p: { mimeType: string }) => p.mimeType === 'text/plain');
          const htmlPart = msg.payload.parts.find((p: { mimeType: string }) => p.mimeType === 'text/html');
          if (textPart?.body?.data) body = decodeBody(textPart.body.data);
          else if (htmlPart?.body?.data) body = decodeBody(htmlPart.body.data);
        }

        return res.json({
          ...msg,
          _parsed: {
            from: getHeader(headers, 'From'),
            to: getHeader(headers, 'To'),
            subject: getHeader(headers, 'Subject'),
            date: getHeader(headers, 'Date'),
            body: body.slice(0, 5000),
          },
        });
      }

      // ── Search ──
      case 'search': {
        const { q, maxResults = '10' } = req.query;
        if (!q) return res.status(400).json({ error: 'q (query) required' });
        const list = await gmailFetch('/messages', token, { q: q as string, maxResults: maxResults as string });
        // Fetch snippet for each message
        const messages = list.messages ?? [];
        const detailed = await Promise.all(
          messages.slice(0, 10).map(async (m: { id: string }) => {
            const msg = await gmailFetch(`/messages/${m.id}`, token, { format: 'metadata', metadataHeaders: 'Subject,From,Date' });
            return {
              id: msg.id,
              snippet: msg.snippet,
              from: getHeader(msg.payload?.headers || [], 'From'),
              subject: getHeader(msg.payload?.headers || [], 'Subject'),
              date: getHeader(msg.payload?.headers || [], 'Date'),
            };
          }),
        );
        return res.json({ messages: detailed, resultSizeEstimate: list.resultSizeEstimate });
      }

      // ── Threads ──
      case 'list-threads': {
        const { q, maxResults = '10' } = req.query;
        const params: Record<string, string> = { maxResults: maxResults as string };
        if (q) params.q = q as string;
        return res.json(await gmailFetch('/threads', token, params));
      }

      case 'get-thread': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await gmailFetch(`/threads/${id}`, token, { format: 'metadata' }));
      }

      // ── Drafts ──
      case 'list-drafts': {
        const { maxResults = '10' } = req.query;
        return res.json(await gmailFetch('/drafts', token, { maxResults: maxResults as string }));
      }

      // ── Send (requires gmail.send scope) ──
      case 'send': {
        const { to, subject, body: msgBody } = req.body;
        if (!to || !subject || !msgBody) return res.status(400).json({ error: 'to, subject, and body required' });
        const raw = Buffer.from(
          `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${msgBody}`,
        ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return res.json(await gmailPost('/messages/send', token, { raw }));
      }

      // ── Modify labels (archive, star, etc.) ──
      case 'modify': {
        const { id, addLabelIds, removeLabelIds } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await gmailPost(`/messages/${id}/modify`, token, { addLabelIds, removeLabelIds }));
      }

      // ── Trash / Untrash ──
      case 'trash': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await gmailPost(`/messages/${id}/trash`, token, {}));
      }

      // ── Overview ──
      case 'overview': {
        const [profile, inbox, unread] = await Promise.all([
          gmailFetch('/profile', token),
          gmailFetch('/labels/INBOX', token),
          gmailFetch('/labels/UNREAD', token),
        ]);
        return res.json({
          email: profile.emailAddress,
          threadsTotal: profile.threadsTotal,
          messagesTotal: profile.messagesTotal,
          inboxMessages: inbox.messagesTotal,
          unreadMessages: unread.messagesTotal,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    const status = err instanceof GoogleApiError ? err.status : 500;
    return res.status(status).json({ error: message });
  }
}
