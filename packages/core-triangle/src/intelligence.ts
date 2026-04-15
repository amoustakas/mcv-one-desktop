// MCV Core Triangle — Intelligence client.
// Aligned with real Triangle SDK contract (see TRIANGLE_GAPS.md for deltas).
//
//   POST /chat         → non-streaming completion
//   POST /chat/stream  → SSE stream: `event: chunk|done` + `data: {id,delta,model,finishReason?}`
//                        terminated by `data: [DONE]`
//   POST /rag/query    → RAG retrieval + synthesized answer
//   GET  /health       → liveness (was /v1/ping)
//
// The public method surface (chat, chatStream, retrieve, ping) is preserved
// so src/lib/mcv-core/intelligence.ts and api/_handlers/chat.ts keep
// compiling. `chatStream` continues to use a callback shape — we synthesize
// the final ChatResponse from accumulated deltas since the real SSE stream
// does not include usage/toolCalls mid-flight.

import type { CoreServiceConfig, CoreResponse } from './types';
import { coreHttp } from './http';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  agent?: string;
  ventureId?: string;
  provider?: 'anthropic' | 'google' | 'openai' | 'local';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** When true, Intelligence fans out RAG retrieval before generation. */
  useRag?: boolean;
  corpora?: string[];
  /** Real SDK uses `inputSchema`; local callers may pass either shape. */
  tools?: Array<{
    name: string;
    description: string;
    input_schema?: Record<string, unknown>;
    inputSchema?: Record<string, unknown>;
  }>;
  stream?: boolean;
}

export interface ChatUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface ChatResponse {
  messageId: string;
  content: string;
  toolCalls?: Array<{ id: string; name: string; input: Record<string, unknown> }>;
  finishReason: 'stop' | 'length' | 'tool_use' | 'content_filter' | 'error' | 'max_tokens';
  provider: string;
  model: string;
  usage: ChatUsage;
  citations?: Array<{ n: number; corpus: string; source: string; similarity: number }>;
}

// Real Triangle /chat response shape (under the {data:...} envelope).
interface GatewayCompletionResponse {
  id: string;
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: ChatResponse['finishReason'];
  metadata?: { provider?: string; toolCalls?: ChatResponse['toolCalls']; costUsd?: number } & Record<string, unknown>;
}

// Real Triangle SSE stream chunk.
interface StreamChunk {
  id: string;
  delta: string;
  model: string;
  finishReason?: ChatResponse['finishReason'];
}

export interface RetrieveRequest {
  query: string;
  corpora?: string[];
  ventureId?: string;
  topK?: number;
  threshold?: number;
  filters?: Record<string, unknown>;
}

// Real /rag/query response.
interface RagQueryResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    chunkId: string;
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
  confidence: number;
  tokensUsed: number;
}

/** Legacy shape preserved for existing callers. */
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
  /** Populated when Intelligence returns a synthesized answer. */
  answer?: string;
  confidence?: number;
}

export interface EmbedRequest {
  texts: string[];
  taskType?: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY';
}
export interface EmbedResponse {
  vectors: number[][];
  model: string;
  dims: number;
}

export interface AgentInvokeRequest {
  codename: string;
  input: string;
  ventureId?: string;
  tools?: ChatRequest['tools'];
}

export interface IntelligenceClient {
  chat(req: ChatRequest): Promise<CoreResponse<ChatResponse>>;
  chatStream(req: ChatRequest, onChunk: (text: string) => void, signal?: AbortSignal): Promise<ChatResponse>;
  embed(req: EmbedRequest): Promise<CoreResponse<EmbedResponse>>;
  retrieve(req: RetrieveRequest): Promise<CoreResponse<RetrieveResponse>>;
  agentInvoke(req: AgentInvokeRequest): Promise<CoreResponse<ChatResponse>>;
  ping(): Promise<CoreResponse<{ ok: true; service: 'intelligence'; version?: string }>>;
}

function toChatResponse(raw: GatewayCompletionResponse, provider: string | undefined): ChatResponse {
  return {
    messageId: raw.id,
    content: raw.content,
    toolCalls: raw.metadata?.toolCalls,
    finishReason: raw.finishReason,
    provider: (raw.metadata?.provider as string | undefined) ?? provider ?? 'unknown',
    model: raw.model,
    usage: {
      inputTokens: raw.usage.promptTokens,
      outputTokens: raw.usage.completionTokens,
      costUsd: (raw.metadata?.costUsd as number | undefined) ?? 0,
    },
  };
}

function normalizeTools(tools: ChatRequest['tools']): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema ?? t.input_schema ?? {},
  }));
}

function toGatewayBody(req: ChatRequest) {
  return {
    provider: req.provider,
    model: req.model ?? 'claude-sonnet-4-20250514',
    messages: req.messages,
    temperature: req.temperature,
    maxTokens: req.maxTokens,
    tools: normalizeTools(req.tools),
    ventureId: req.ventureId,
    useRag: req.useRag,
    corpora: req.corpora,
  };
}

export function createIntelligenceClient(config: CoreServiceConfig): IntelligenceClient {
  async function chatStream(
    req: ChatRequest,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<ChatResponse> {
    const token = await config.getAuthToken();
    const url = `${config.baseUrl.replace(/\/$/, '')}/chat/stream`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(config.ventureId ? { 'x-mcv-venture': config.ventureId } : {}),
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(toGatewayBody(req)),
      signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`Intelligence stream failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';
    let lastChunk: StreamChunk | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE events separated by blank lines. Each event may have an `event:`
      // line and a `data:` line. We only care about the data payload.
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? '';
      for (const evt of events) {
        const dataLine = evt.split(/\r?\n/).find((l) => l.startsWith('data: '));
        if (!dataLine) continue;
        const data = dataLine.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data) as StreamChunk;
          lastChunk = parsed;
          if (parsed.delta) {
            accumulated += parsed.delta;
            onChunk(parsed.delta);
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    // Synthesize a ChatResponse from the accumulated text. Usage and toolCalls
    // are not carried in the real SSE stream (see TRIANGLE_GAPS) — zeroed here.
    return {
      messageId: lastChunk?.id ?? 'unknown',
      content: accumulated,
      finishReason: lastChunk?.finishReason ?? 'stop',
      provider: req.provider ?? 'unknown',
      model: lastChunk?.model ?? req.model ?? 'unknown',
      usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
    };
  }

  async function chat(req: ChatRequest): Promise<CoreResponse<ChatResponse>> {
    const res = await coreHttp<GatewayCompletionResponse>('intelligence', config, {
      method: 'POST',
      path: '/chat',
      body: toGatewayBody(req),
    });
    if (!res.ok) return res;
    return { ok: true, data: toChatResponse(res.data, req.provider) };
  }

  async function retrieve(req: RetrieveRequest): Promise<CoreResponse<RetrieveResponse>> {
    const res = await coreHttp<RagQueryResponse>('intelligence', config, {
      method: 'POST',
      path: '/rag/query',
      body: {
        query: req.query,
        ventureId: req.ventureId ?? config.ventureId ?? '',
        topK: req.topK,
        threshold: req.threshold,
        filters: req.filters,
      },
    });
    if (!res.ok) return res;
    return {
      ok: true,
      data: {
        answer: res.data.answer,
        confidence: res.data.confidence,
        chunks: res.data.sources.map((s) => ({
          id: s.chunkId,
          content: s.content,
          similarity: s.score,
          source: (s.metadata?.source as string | undefined) ?? s.documentId,
          corpus: (s.metadata?.corpus as string | undefined) ?? 'default',
          metadata: s.metadata,
        })),
      },
    };
  }

  async function agentInvoke(req: AgentInvokeRequest): Promise<CoreResponse<ChatResponse>> {
    // Real SDK exposes `runAgent` on a different route; treat as alias until
    // streaming-agent endpoint ships (see TRIANGLE_GAPS).
    return chat({
      messages: [{ role: 'user', content: req.input }],
      agent: req.codename,
      ventureId: req.ventureId,
      tools: req.tools,
    });
  }

  async function embed(_req: EmbedRequest): Promise<CoreResponse<EmbedResponse>> {
    // Public Intelligence SDK does not expose an embeddings endpoint yet.
    return {
      ok: false,
      error: new (await import('./types')).CoreNotAvailableError('intelligence'),
    };
  }

  async function ping(): Promise<CoreResponse<{ ok: true; service: 'intelligence'; version?: string }>> {
    const res = await coreHttp<{ ok?: boolean; version?: string }>('intelligence', config, {
      method: 'GET',
      path: '/health',
    });
    if (!res.ok) return res;
    return { ok: true, data: { ok: true, service: 'intelligence', version: res.data?.version } };
  }

  return { chat, chatStream, embed, retrieve, agentInvoke, ping };
}
