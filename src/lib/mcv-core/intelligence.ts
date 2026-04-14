// MCV Core Triangle — Intelligence client.
// Port 8082 HTTP / 50053 gRPC.
// Provides: AI model gateway (provider routing + fallback), RAG retrieval
// across ecosystem corpora, and agent runtime (compile+invoke NAOS agents).

import type { CoreServiceConfig, CoreResponse } from './types';
import { coreHttp } from './http';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  /** NAOS agent codename — Intelligence compiles + prepends system prompt */
  agent?: string;
  /** Override venture scope from config */
  ventureId?: string;
  /** Provider preference; gateway routes via policy if unspecified */
  provider?: 'anthropic' | 'google' | 'openai' | 'local';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Enable pre-prompt RAG retrieval */
  useRag?: boolean;
  /** Corpora filter for RAG */
  corpora?: string[];
  /** Tool schemas (kit-style) */
  tools?: Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }>;
  stream?: boolean;
}

export interface ChatUsage {
  inputTokens: number;
  outputTokens: number;
  /** Cost in USD (gateway computes from provider) */
  costUsd: number;
}

export interface ChatResponse {
  messageId: string;
  content: string;
  toolCalls?: Array<{ id: string; name: string; input: Record<string, unknown> }>;
  finishReason: 'stop' | 'length' | 'tool_use' | 'content_filter' | 'error';
  provider: string;
  model: string;
  usage: ChatUsage;
  /** Citations from RAG (if useRag=true) */
  citations?: Array<{ n: number; corpus: string; source: string; similarity: number }>;
}

export interface EmbedRequest {
  texts: string[];
  /** RETRIEVAL_QUERY | RETRIEVAL_DOCUMENT | SEMANTIC_SIMILARITY */
  taskType?: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY';
}
export interface EmbedResponse {
  vectors: number[][];
  model: string;
  dims: number;
}

export interface RetrieveRequest {
  query: string;
  corpora?: string[];
  ventureId?: string;
  topK?: number;
  threshold?: number;
}
export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
  source: string;
  corpus: string;
  metadata?: Record<string, unknown>;
}
export interface RetrieveResponse {
  chunks: RetrievedChunk[];
}

export interface AgentInvokeRequest {
  codename: string;
  input: string;
  ventureId?: string;
  tools?: ChatRequest['tools'];
}

// ── Client ──

export interface IntelligenceClient {
  chat(req: ChatRequest): Promise<CoreResponse<ChatResponse>>;
  /** Streaming variant (SSE). Throws on unavailability. */
  chatStream(req: ChatRequest, onChunk: (text: string) => void, signal?: AbortSignal): Promise<ChatResponse>;
  embed(req: EmbedRequest): Promise<CoreResponse<EmbedResponse>>;
  retrieve(req: RetrieveRequest): Promise<CoreResponse<RetrieveResponse>>;
  agentInvoke(req: AgentInvokeRequest): Promise<CoreResponse<ChatResponse>>;
  ping(): Promise<CoreResponse<{ ok: true; service: 'intelligence'; version: string }>>;
}

export function createIntelligenceClient(config: CoreServiceConfig): IntelligenceClient {
  async function chatStream(
    req: ChatRequest,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<ChatResponse> {
    const token = await config.getAuthToken();
    const url = `${config.baseUrl.replace(/\/$/, '')}/v1/chat/stream`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(config.ventureId ? { 'x-mcv-venture': config.ventureId } : {}),
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ ...req, stream: true }),
      signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`Intelligence stream failed: ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResponse: ChatResponse | null = null;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data) as
            | { type: 'chunk'; text: string }
            | { type: 'done'; response: ChatResponse };
          if (parsed.type === 'chunk') onChunk(parsed.text);
          else if (parsed.type === 'done') finalResponse = parsed.response;
        } catch {
          // skip malformed
        }
      }
    }
    if (!finalResponse) throw new Error('Intelligence stream ended without final response');
    return finalResponse;
  }

  return {
    chat: (req) => coreHttp('intelligence', config, { method: 'POST', path: '/v1/chat', body: req }),
    chatStream,
    embed: (req) => coreHttp('intelligence', config, { method: 'POST', path: '/v1/embed', body: req }),
    retrieve: (req) => coreHttp('intelligence', config, { method: 'POST', path: '/v1/retrieve', body: req }),
    agentInvoke: (req) => coreHttp('intelligence', config, { method: 'POST', path: '/v1/agents/invoke', body: req }),
    ping: () => coreHttp('intelligence', config, { method: 'GET', path: '/v1/ping' }),
  };
}
