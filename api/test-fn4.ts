import { requireAuth } from "./auth-middleware";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await requireAuth(req, res);
    if (!userId) return;
    res.json({ ok: true, userId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
