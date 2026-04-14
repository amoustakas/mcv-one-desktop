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

/**
 * withAuth — higher-order handler wrapper.
 * Short-circuits with a 401 if auth fails; otherwise calls through to the
 * inner handler with the authenticated user id available on (req as any).userId.
 *
 * Usage:
 *   export default withAuth(async (req, res) => { ... })
 */
export function withAuth<T extends VercelRequest = VercelRequest>(
  handler: (req: T & { userId?: string }, res: VercelResponse) => Promise<unknown> | unknown,
) {
  return async (req: T, res: VercelResponse) => {
    const userId = await requireAuth(req, res);
    if (!userId) return; // requireAuth already sent the 401
    (req as T & { userId: string }).userId = userId;
    return handler(req as T & { userId: string }, res);
  };
}
