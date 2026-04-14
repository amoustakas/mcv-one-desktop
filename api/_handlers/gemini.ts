import { GoogleGenerativeAI } from '@google/generative-ai';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const googleKey = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';
  if (!googleKey) {
    return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
  }

  try {
    const genAI = new GoogleGenerativeAI(googleKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: systemPrompt || undefined,
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return res.status(200).json({ content: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
