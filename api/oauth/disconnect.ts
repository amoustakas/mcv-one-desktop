import { deleteOAuthConnection, getProviderToken, getProviderConfig } from "../_oauth-helper";
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
// OAuth Disconnect — Revokes token and removes connection
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const provider = req.body?.provider as string;
  if (!provider) {
    return res.status(400).json({ error: 'provider required' });
  }

  try {
    // Try to revoke the token at the provider
    try {
      const config = getProviderConfig(provider);
      if (config.revokeUrl) {
        const { token } = await getProviderToken(userId, provider);
        await fetch(config.revokeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `token=${encodeURIComponent(token)}`,
        }).catch(() => {}); // Best effort
      }
    } catch {
      // Token may already be invalid — proceed with deletion
    }

    // Delete from Supabase
    await deleteOAuthConnection(userId, provider);

    return res.json({ success: true, message: `${provider} disconnected` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
