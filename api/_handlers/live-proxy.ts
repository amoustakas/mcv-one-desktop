import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';

/**
 * Live API Proxy — Server-side proxy for Google AI (Gemini) text generation.
 *
 * HISTORY (OWASP A10-01, 2026-04-17):
 *   This handler previously exposed a `get-session-key` action that returned
 *   the raw GOOGLE_AI_KEY to any authenticated caller. That action has been
 *   removed. The handler is now a pure server-side proxy: the client POSTs
 *   a payload, we call Google AI server-side using the server-held key, and
 *   we stream the response back. The key never leaves the server.
 *
 *   The WebSocket-based Live API (bidirectional audio) is a separate flow
 *   handled in `src/lib/google/live-api-client.ts` and `src/hooks/use-voice-agent.ts`,
 *   which talk directly to `wss://generativelanguage.googleapis.com`. That
 *   path uses VITE_GOOGLE_AI_KEY from the browser bundle (a public-by-design
 *   Vite env) and does NOT touch this endpoint — an ephemeral-token model
 *   for that WebSocket flow is Google-API-side work, tracked separately.
 *
 * ACCEPTED ACTIONS
 *   generate          — one-shot text generation, returns JSON
 *   generate-stream   — streaming text generation, returns chunked text/plain
 *
 * REQUEST BODY
 *   {
 *     action: 'generate' | 'generate-stream',
 *     model?: string,          // defaults to 'gemini-1.5-flash'
 *     prompt?: string,         // single-turn convenience
 *     messages?: { role: 'user'|'assistant'; content: string }[],
 *     systemPrompt?: string,
 *   }
 */

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

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';

type MessageRole = 'user' | 'assistant' | 'model' | 'system';
interface InboundMessage { role: MessageRole; content: string }

function normalizeHistory(messages: InboundMessage[]) {
  return messages.map(m => ({
    role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

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
  if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });

  const body = (req.body || {}) as {
    action?: string;
    model?: string;
    prompt?: string;
    messages?: InboundMessage[];
    systemPrompt?: string;
  };

  const action = body.action || 'generate';
  const modelName = body.model || 'gemini-1.5-flash';
  const systemPrompt = body.systemPrompt;

  let messages: InboundMessage[] = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length && typeof body.prompt === 'string' && body.prompt) {
    messages = [{ role: 'user', content: body.prompt }];
  }
  if (!messages.length) {
    return res.status(400).json({ error: 'messages[] or prompt required' });
  }

  if (action !== 'generate' && action !== 'generate-stream') {
    return res.status(400).json({ error: `Unknown action: ${action}. Supported: generate | generate-stream` });
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt || undefined,
    });

    const history = normalizeHistory(messages.slice(0, -1));
    const lastMessage = messages[messages.length - 1];

    if (action === 'generate-stream') {
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.setHeader('x-accel-buffering', 'no');
      const chat = model.startChat({ history });
      const stream = await chat.sendMessageStream(lastMessage.content);
      for await (const chunk of stream.stream) {
        const piece = chunk.text();
        if (piece) res.write(piece);
      }
      res.end();
      return;
    }

    // action === 'generate'
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();
    return res.status(200).json({ content: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    if (!res.headersSent) {
      return res.status(500).json({ error: message });
    }
    res.end();
  }
}
