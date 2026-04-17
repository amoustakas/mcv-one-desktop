import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

import { requestLogger } from '../../src/lib/server/logger';
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

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || '';

// Voice metadata (server-side copy for the casting director)
const VOICES = [
  { name: 'Zephyr', gender: 'Female', pitch: 'Medium-High', traits: ['Enthusiastic', 'Bright', 'Upbeat'] },
  { name: 'Puck', gender: 'Male', pitch: 'Medium', traits: ['Casual', 'Energetic', 'Approachable'] },
  { name: 'Charon', gender: 'Male', pitch: 'Low', traits: ['Deep', 'Calm', 'Resonant', 'Professional'] },
  { name: 'Kore', gender: 'Female', pitch: 'Medium-High', traits: ['Enthusiastic', 'Bright', 'Clear'] },
  { name: 'Fenrir', gender: 'Male', pitch: 'Medium-Low', traits: ['Warm', 'Inquisitive', 'Friendly'] },
  { name: 'Leda', gender: 'Female', pitch: 'Medium-High', traits: ['Youthful', 'Inquisitive', 'Bright'] },
  { name: 'Orus', gender: 'Male', pitch: 'Medium-Low', traits: ['Inquisitive', 'Casual', 'Clear'] },
  { name: 'Aoede', gender: 'Female', pitch: 'Medium-High', traits: ['Professional', 'Engaging', 'Optimistic'] },
  { name: 'Callirrhoe', gender: 'Female', pitch: 'Medium-High', traits: ['Friendly', 'Professional', 'Engaging'] },
  { name: 'Autonoe', gender: 'Female', pitch: 'Medium-High', traits: ['Warm', 'Articulate', 'Professional'] },
  { name: 'Enceladus', gender: 'Male', pitch: 'Medium-Low', traits: ['Energetic', 'Confident', 'Motivating'] },
  { name: 'Iapetus', gender: 'Male', pitch: 'Medium-Low', traits: ['Confident', 'Professional', 'Resonant'] },
  { name: 'Umbriel', gender: 'Male', pitch: 'Medium-Low', traits: ['Resonant', 'Inquisitive', 'Confident'] },
  { name: 'Algieba', gender: 'Male', pitch: 'Medium-Low', traits: ['Enthusiastic', 'Warm', 'Articulate'] },
  { name: 'Despina', gender: 'Female', pitch: 'Medium-High', traits: ['Energetic', 'Warm', 'Young Adult'] },
  { name: 'Erinome', gender: 'Female', pitch: 'Medium', traits: ['Confident', 'Professional', 'Sophisticated'] },
  { name: 'Algenib', gender: 'Male', pitch: 'Medium-Low', traits: ['Smooth', 'Calm', 'Inquisitive'] },
  { name: 'Rasalgethi', gender: 'Male', pitch: 'Medium-High', traits: ['Energetic', 'Inquisitive', 'Young Adult'] },
  { name: 'Laomedeia', gender: 'Female', pitch: 'Medium-High', traits: ['Warm', 'Approachable', 'Young Adult'] },
  { name: 'Achernar', gender: 'Female', pitch: 'Medium-High', traits: ['Warm', 'Inviting', 'Professional'] },
  { name: 'Alnilam', gender: 'Male', pitch: 'Medium-High', traits: ['Energetic', 'Optimistic', 'Clear'] },
  { name: 'Schedar', gender: 'Male', pitch: 'Medium', traits: ['Casual', 'Energetic', 'Approachable'] },
  { name: 'Gacrux', gender: 'Female', pitch: 'Medium', traits: ['Warm', 'Inquisitive', 'Engaging'] },
  { name: 'Pulcherrima', gender: 'Male', pitch: 'Medium-High', traits: ['Energetic', 'Youthful', 'Optimistic'] },
  { name: 'Achird', gender: 'Male', pitch: 'Medium-Low', traits: ['Warm', 'Professional', 'Articulate'] },
  { name: 'Zubenelgenubi', gender: 'Male', pitch: 'Low', traits: ['Deep', 'Resonant', 'Sophisticated'] },
  { name: 'Vindemiatrix', gender: 'Female', pitch: 'Medium-High', traits: ['Warm', 'Smooth', 'Inquisitive'] },
  { name: 'Sadachbia', gender: 'Male', pitch: 'Medium-Low', traits: ['Resonant', 'Professional', 'Clear'] },
  { name: 'Sadaltager', gender: 'Male', pitch: 'Medium-Low', traits: ['Professional', 'Articulate', 'Calm'] },
  { name: 'Sulafat', gender: 'Female', pitch: 'Medium-High', traits: ['Warm', 'Enthusiastic', 'Professional'] },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const { action } = req.body;

  try {
    switch (action) {
      case 'list':
        return res.json({ voices: VOICES });

      case 'recommend': {
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
        const { description, useCase } = req.body;
        if (!description) return res.status(400).json({ error: 'description required' });

        const ai = new GoogleGenAI({ apiKey: GOOGLE_AI_KEY });
        const voiceList = VOICES.map(v => `${v.name} (${v.gender}, ${v.pitch}, ${v.traits.join(', ')})`).join('\n');

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are an AI casting director. Given the following voice request, recommend the 3 best voices from the library.

Request: "${description}"
Use case: ${useCase || 'general'}

Available voices:
${voiceList}

Return JSON: { "recommendations": [{ "name": "VoiceName", "reasoning": "why this voice fits" }] }`,
          config: { responseMimeType: 'application/json' },
        });

        const text = response.text || '{}';
        try {
          const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
          return res.json(parsed);
        } catch {
          return res.json({ recommendations: [], raw: text });
        }
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (e: any) {
    console.error('Voice API error:', e);
    return res.status(500).json({ error: e.message || 'Voice operation failed' });
  }
}
