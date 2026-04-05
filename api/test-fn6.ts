import type { VercelRequest, VercelResponse } from '@vercel/node';

async function myAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Auth required' });
    return null;
  }

  const { verifyToken } = await import('@clerk/backend');
  const payload = await verifyToken(token, { secretKey });
  return payload.sub;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await myAuth(req, res);
    if (!userId) return;
    res.json({ ok: true, userId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
