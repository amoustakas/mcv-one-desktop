import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServerIntelligence } from '../../src/lib/mcv-core/intelligence.js';
import { sanitizeIngress, sanitizeEgress } from '@mcv/guardrails-sdk';

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
  const userId = await requireAuth(req, res); if (!userId) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages: rawMessages, systemPrompt: rawSystemPrompt } = req.body as {
    messages?: Array<{ role: string; content: string }>;
    systemPrompt?: string;
  };

  if (!rawMessages || !Array.isArray(rawMessages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // ── Phase-0 ingress sanitization ───────────────────────────────────
  // Run before any upstream model call (intelligence gateway OR direct GenAI)
  // so both paths get the same guardrail floor. See @mcv/guardrails-sdk.
  const sanitizePayload = [
    ...(rawSystemPrompt ? [{ role: 'system' as const, content: rawSystemPrompt }] : []),
    ...rawMessages,
  ];
  const ingressResult = sanitizeIngress(sanitizePayload, {
    userId, correlationId: __correlationId, agentHandle: 'gemini-handler',
  });
  if (ingressResult.blocked) {
    return res.status(400).json({
      error: 'request blocked by safety policy',
      blocks: ingressResult.violations.map((v) => ({
        kind: v.kind, patternId: v.patternId, severity: v.severity,
      })),
    });
  }
  const safeSystemPrompt = rawSystemPrompt
    ? (ingressResult.safe.find((m): m is { role: 'system'; content: string } =>
        typeof m === 'object' && 'role' in m && m.role === 'system')?.content ?? rawSystemPrompt)
    : undefined;
  const messages = ingressResult.safe.filter((m): m is { role: string; content: string } =>
    typeof m === 'object' && 'role' in m && m.role !== 'system') as Array<{ role: string; content: string }>;

  // ── Triangle routing ────────────────────────────────────────────────
  // Route through Intelligence with provider:'google' when configured. The
  // gateway handles provider failover and centralized cost tracking.
  const intelligence = createServerIntelligence();
  if (intelligence) {
    try {
      const result = await intelligence.chat({
        provider: 'google',
        model: 'gemini-1.5-pro',
        messages: [
          ...(safeSystemPrompt ? [{ role: 'system' as const, content: safeSystemPrompt }] : []),
          ...messages.map((m) => ({
            role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
            content: m.content,
          })),
        ],
      });
      if (result.ok) {
        const egress = sanitizeEgress(result.data.content, { userId, correlationId: __correlationId });
        return res.status(200).json({ content: egress.safe });
      }
      // eslint-disable-next-line no-console
      console.warn('[gemini] Intelligence call failed, falling back to direct GenAI:', result.error.message);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[gemini] Intelligence threw, falling back to direct GenAI:', (err as Error).message);
    }
  }

  // Phase-0 safety: VITE_* env names leak into the browser bundle via Vite.
  // Server handlers MUST NOT fall back to VITE_GOOGLE_AI_KEY — that shape
  // silently re-introduces the browser-exposed-key vuln (see docs/CLAUDE.md env section).
  const googleKey = process.env.GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';
  if (!googleKey) {
    return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
  }

  try {
    const genAI = new GoogleGenerativeAI(googleKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: safeSystemPrompt || undefined,
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    const egress = sanitizeEgress(text, { userId, correlationId: __correlationId });
    return res.status(200).json({ content: egress.safe });
  } catch (error) {
    const message = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error));
    return res.status(500).json({ error: message });
  }
}
