import { requireAuth } from "../_middleware";
import { getUserConnections } from "../_oauth-helper";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// OAuth Status — Returns connection status for all providers
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  try {
    const connections = await getUserConnections(userId);

    // Also include health check data for API-key-only services
    const health: Record<string, boolean> = {
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      GOOGLE_AI_KEY: !!(process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY),
      DEEPGRAM_API_KEY: !!(process.env.DEEPGRAM_API_KEY || process.env.VITE_DEEPGRAM_API_KEY),
      ELEVENLABS_API_KEY: !!(process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY),
      GOOGLE_MAPS_KEY: !!(process.env.GOOGLE_MAPS_KEY || process.env.VITE_GOOGLE_MAPS_KEY),
      VERCEL_TOKEN: !!process.env.VERCEL_TOKEN,
      N8N_API_KEY: !!process.env.N8N_API_KEY,
      SUPABASE_URL: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
    };

    return res.json({ connections, health });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
