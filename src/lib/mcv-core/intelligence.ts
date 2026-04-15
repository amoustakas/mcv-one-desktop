// src/lib/mcv-core/intelligence.ts
//
// Per-service shim for the Intelligence gateway (Claude/Gemini/OpenAI/local
// routing, RAG, agent runtime). Adds a server-side factory for use in
// api/_handlers/chat.ts + gemini.ts.

import {
  createIntelligenceClient,
  type IntelligenceClient,
  type ChatRequest,
  type ChatResponse,
  type ChatMessage,
  type ChatUsage,
  type EmbedRequest,
  type EmbedResponse,
  type RetrieveRequest,
  type RetrieveResponse,
  type RetrievedChunk,
  type AgentInvokeRequest,
} from '@mcv/core-triangle/intelligence';
export {
  createIntelligenceClient,
  type IntelligenceClient,
  type ChatRequest,
  type ChatResponse,
  type ChatMessage,
  type ChatUsage,
  type EmbedRequest,
  type EmbedResponse,
  type RetrieveRequest,
  type RetrieveResponse,
  type RetrievedChunk,
  type AgentInvokeRequest,
};

export interface ServerIntelligenceOptions {
  getAuthToken?: () => Promise<string | null>;
  ventureId?: string;
  timeoutMs?: number;
}

/**
 * Server-side Intelligence client. Returns null when INTELLIGENCE_URL is unset,
 * signaling to the caller to fall back to direct provider SDKs (Anthropic /
 * Google / OpenAI / etc).
 */
export function createServerIntelligence(opts: ServerIntelligenceOptions = {}): IntelligenceClient | null {
  const baseUrl = process.env.INTELLIGENCE_URL;
  if (!baseUrl) return null;
  return createIntelligenceClient({
    baseUrl,
    getAuthToken: opts.getAuthToken ?? (async () => process.env.INTERNAL_SERVICE_SECRET ?? null),
    ventureId: opts.ventureId,
    timeoutMs: opts.timeoutMs ?? 60_000, // chat streams are long
    logger: (level, msg, meta) =>
      // eslint-disable-next-line no-console
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[intelligence] ${msg}`, meta ?? ''),
  });
}
