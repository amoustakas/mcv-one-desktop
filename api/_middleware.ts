import { verifyToken } from '@clerk/backend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Routes that don't require auth
const PUBLIC_ROUTES = ['/api/health'];

export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  // Check if this is a public route
  const path = req.url?.split('?')[0] || '';
  if (PUBLIC_ROUTES.some(r => path.endsWith(r.replace('/api', '')))) {
    return 'public';
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Also check cookies for Clerk session
  const sessionToken = token || (req.cookies?.__session as string | undefined);

  if (!sessionToken) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  try {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      // No Clerk secret = dev mode, allow all
      return 'dev-mode';
    }

    const payload = await verifyToken(sessionToken, {
      secretKey,
    });
    return payload.sub; // Clerk user ID
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}
