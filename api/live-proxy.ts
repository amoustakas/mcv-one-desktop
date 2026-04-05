import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Live API Proxy — Returns the Google AI key for client-side Live API connection.
 * The Live API uses WebSocket directly from the client via @google/genai SDK.
 * This endpoint provides authenticated key exchange so the API key stays server-side
 * until an authenticated user requests it for a session.
 *
 * In production, this should be replaced with a short-lived session token system.
 */

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

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });

  const { action } = req.body;

  switch (action) {
    case 'get-session-key':
      // Return the API key for Live API WebSocket connection
      // The client uses this to establish a direct WebSocket with Google
      return res.json({ apiKey: GOOGLE_AI_KEY });

    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }
}
