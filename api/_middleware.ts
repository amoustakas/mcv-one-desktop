import { verifyToken } from '@clerk/backend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PUBLIC_ROUTES = ['/api/health'];

export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  // Public routes bypass auth
  const path = req.url?.split('?')[0] || '';
  if (PUBLIC_ROUTES.some(r => path.endsWith(r.replace('/api', '')))) {
    return 'public';
  }

  const secretKey = process.env.CLERK_SECRET_KEY;

  // No Clerk secret configured — fail closed in production, allow in dev
  if (!secretKey) {
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV;
    if (env === 'production') {
      res.status(500).json({ error: 'Server misconfiguration: authentication not configured' });
      return null;
    }
    return 'dev-mode';
  }

  // Try multiple token sources:
  // 1. Authorization: Bearer <token> header
  // 2. __session cookie (Clerk's default)
  // 3. __client cookie
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const sessionCookie = req.cookies?.__session;
  const token = bearerToken || sessionCookie;

  if (!token) {
    // No token found — in production this blocks, but log for debugging
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return null;
  }

  try {
    const payload = await verifyToken(token, { secretKey });
    return payload.sub; // Clerk user ID
  } catch (err) {
    // Token verification failed — could be expired or malformed
    res.status(401).json({
      error: 'Invalid or expired session. Please sign in again.',
    });
    return null;
  }
}
