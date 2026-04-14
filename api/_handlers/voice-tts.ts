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


export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY || '';
  if (!apiKey) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });

  const { text, voiceId } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  try {
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId || '21m00Tcm4TlvDq8ikWAM'}/stream`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: text.slice(0, 5000), model_id: 'eleven_turbo_v2_5', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });
    if (!elRes.ok) return res.status(elRes.status).json({ error: await elRes.text() });

    res.setHeader('Content-Type', 'audio/mpeg');
    const reader = elRes.body?.getReader();
    if (!reader) return res.status(500).json({ error: 'No body' });
    while (true) { const { done, value } = await reader.read(); if (done) break; res.write(Buffer.from(value)); }
    res.end();
  } catch (e) { return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown' }); }
}
