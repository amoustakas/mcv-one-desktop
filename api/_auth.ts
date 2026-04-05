import type { VercelRequest, VercelResponse } from '@vercel/node';

const PUBLIC_ROUTES = ['/api/health'];

export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  try {
    // Public routes bypass auth
    const path = req.url?.split('?')[0] || '';
    if (PUBLIC_ROUTES.some(r => path.endsWith(r.replace('/api', '')))) {
      return 'public';
    }

    const secretKey = process.env.CLERK_SECRET_KEY;

    // No Clerk secret configured — allow through (Clerk handles auth on frontend)
    if (!secretKey) {
      return 'no-secret';
    }

    // Try multiple token sources
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const sessionCookie = req.cookies?.__session;
    const token = bearerToken || sessionCookie;

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return null;
    }

    // Dynamic import to avoid ESM/CJS issues at module load time
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch (err) {
    // If Clerk verification fails or module can't load, return error details
    const message = err instanceof Error ? err.message : 'Auth error';
    console.error('[auth-middleware]', message);
    res.status(401).json({ error: 'Authentication failed: ' + message });
    return null;
  }
}
