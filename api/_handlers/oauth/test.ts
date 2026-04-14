import { getProviderToken, getProviderConfig } from "../_oauth-helper";
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
// OAuth Test — Verifies a connection by making a lightweight API call
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
    const start = Date.now();
    const { token, source } = await getProviderToken(userId, provider);
    const config = getProviderConfig(provider);

    // Build headers based on provider
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (provider === 'github') {
      headers.Authorization = `Bearer ${token}`;
      headers['X-GitHub-Api-Version'] = '2022-11-28';
    } else if (provider === 'notion') {
      headers.Authorization = `Bearer ${token}`;
      headers['Notion-Version'] = '2022-06-28';
    } else if (provider === 'cloudflare') {
      headers.Authorization = `Bearer ${token}`;
    } else {
      headers.Authorization = `Bearer ${token}`;
    }

    const testRes = await fetch(config.userInfoUrl, { headers });
    const latency = Date.now() - start;

    if (!testRes.ok) {
      return res.json({
        success: false,
        provider,
        source,
        latency,
        error: `API returned ${testRes.status}`,
      });
    }

    const userData = await testRes.json().catch(() => ({}));
    let userName = '';

    switch (provider) {
      case 'github': userName = userData.login || ''; break;
      case 'google': userName = userData.name || userData.email || ''; break;
      case 'notion': userName = userData.name || ''; break;
      case 'cloudflare': userName = userData.result?.email || ''; break;
    }

    return res.json({
      success: true,
      provider,
      source,
      latency,
      userName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.json({ success: false, provider, error: message });
  }
}
