import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.DEEPGRAM_API_KEY || process.env.VITE_DEEPGRAM_API_KEY || '';
  if (!apiKey) return res.status(500).json({ error: 'DEEPGRAM_API_KEY not configured' });

  try {
    const audioBuffer = Buffer.from(req.body.audio, 'base64');
    const dgRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true', {
      method: 'POST', headers: { Authorization: `Token ${apiKey}`, 'Content-Type': 'audio/webm' }, body: audioBuffer,
    });
    if (!dgRes.ok) return res.status(dgRes.status).json({ error: await dgRes.text() });
    const data = await dgRes.json();
    return res.json({ transcript: data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '' });
  } catch (e) { return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown' }); }
}
