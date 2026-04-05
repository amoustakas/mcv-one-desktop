import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Step 1: Test dynamic import of clerk
    const clerk = await import('@clerk/backend');
    const hasVerify = typeof clerk.verifyToken === 'function';

    // Step 2: Test auth header parsing
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // Step 3: Test secret key
    const secretKey = process.env.CLERK_SECRET_KEY;

    res.json({
      ok: true,
      clerkImported: true,
      hasVerifyToken: hasVerify,
      hasSecretKey: !!secretKey,
      hasToken: !!token,
      tokenLength: token?.length || 0,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 8) : undefined,
    });
  }
}
