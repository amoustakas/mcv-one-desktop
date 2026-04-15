// Contract tests for the Intelligence client — locks the wire format
// against drift. If the real Triangle Intelligence service changes
// endpoint paths, request shapes, response envelopes, or SSE event
// format, these tests fail loudly BEFORE the app ships.
//
// Mocking strategy: stub global fetch. Each test asserts both the outbound
// request (URL, method, body shape, headers) AND the inbound parsing
// (including the {data: T} envelope unwrap).

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createIntelligenceClient } from '../intelligence';
import type { CoreServiceConfig } from '../types';

const BASE_URL = 'http://intelligence.test';

function mkConfig(overrides: Partial<CoreServiceConfig> = {}): CoreServiceConfig {
  return {
    baseUrl: BASE_URL,
    getAuthToken: async () => 'test-token',
    ventureId: 'mcv',
    timeoutMs: 5000,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Intelligence wire contract', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('chat() — non-streaming', () => {
    it('POSTs to /chat with auth header, venture header, and envelope-wrapped response', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          data: {
            id: 'msg-1',
            content: 'hello',
            model: 'claude-sonnet-4-20250514',
            usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
            finishReason: 'stop',
            metadata: { provider: 'anthropic', costUsd: 0.001 },
          },
        }),
      );

      const client = createIntelligenceClient(mkConfig());
      const res = await client.chat({
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'ping' }],
      });

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/chat`);
      expect(init.method).toBe('POST');
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
      expect((init.headers as Record<string, string>)['x-mcv-venture']).toBe('mcv');

      const body = JSON.parse(init.body as string);
      expect(body.provider).toBe('anthropic');
      expect(body.model).toBe('claude-sonnet-4-20250514');
      expect(body.messages).toEqual([{ role: 'user', content: 'ping' }]);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.content).toBe('hello');
        expect(res.data.usage.inputTokens).toBe(10);
        expect(res.data.usage.outputTokens).toBe(5);
        expect(res.data.usage.costUsd).toBe(0.001);
        expect(res.data.provider).toBe('anthropic');
      }
    });

    it('normalizes tool schemas — input_schema → inputSchema on the wire', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: {
        id: 'x', content: '', model: 'x',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop',
      }}));
      const client = createIntelligenceClient(mkConfig());
      await client.chat({
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'x' }],
        tools: [{ name: 'search', description: 'search', input_schema: { type: 'object' } }],
      });
      const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
      expect(body.tools[0].inputSchema).toEqual({ type: 'object' });
      expect(body.tools[0].input_schema).toBeUndefined();
    });

    it('returns CoreFailure on 4xx with error envelope', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ error: { code: 'rate_limited', message: 'slow down' } }, 429),
      );
      const client = createIntelligenceClient(mkConfig());
      const res = await client.chat({ model: 'x', messages: [] });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.message).toBe('slow down');
        expect((res.error as { code?: string }).code).toBe('rate_limited');
      }
    });
  });

  describe('retrieve() — RAG query', () => {
    it('POSTs to /rag/query and maps sources[] → chunks[]', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          data: {
            answer: 'Paris',
            sources: [
              { documentId: 'd1', chunkId: 'c1', content: 'France capital', score: 0.9, metadata: { source: 'wiki', corpus: 'geo' } },
            ],
            confidence: 0.92,
            tokensUsed: 120,
          },
        }),
      );
      const client = createIntelligenceClient(mkConfig());
      const res = await client.retrieve({ query: 'capital of France', ventureId: 'mcv', topK: 5 });

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/rag/query`);
      expect(JSON.parse(init.body as string)).toMatchObject({
        query: 'capital of France',
        ventureId: 'mcv',
        topK: 5,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.answer).toBe('Paris');
        expect(res.data.confidence).toBe(0.92);
        expect(res.data.chunks).toHaveLength(1);
        expect(res.data.chunks[0]).toMatchObject({
          id: 'c1',
          similarity: 0.9,
          source: 'wiki',
          corpus: 'geo',
        });
      }
    });
  });

  describe('embed() — documented gap', () => {
    it('returns CoreNotAvailableError (public SDK has no embeddings endpoint)', async () => {
      const client = createIntelligenceClient(mkConfig());
      const res = await client.embed({ texts: ['hello'] });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.name).toBe('CoreNotAvailableError');
      }
      // fetch should NOT have been called — stubbed endpoint returns without network.
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('ping() — health check', () => {
    it('GETs /health (not /v1/ping)', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, version: '1.2.3' }));
      const client = createIntelligenceClient(mkConfig());
      const res = await client.ping();

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/health`);
      expect(init.method).toBe('GET');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.service).toBe('intelligence');
        expect(res.data.version).toBe('1.2.3');
      }
    });
  });

  describe('chatStream() — SSE contract', () => {
    it('POSTs to /chat/stream, parses real SSE format, synthesizes ChatResponse from deltas', async () => {
      // Real SSE: event: chunk\ndata: {id,delta,model}\n\n ... data: [DONE]
      const sseBody =
        'event: chunk\ndata: {"id":"m1","delta":"hel","model":"claude-sonnet-4-20250514"}\n\n' +
        'event: chunk\ndata: {"id":"m1","delta":"lo","model":"claude-sonnet-4-20250514"}\n\n' +
        'event: done\ndata: {"id":"m1","delta":"","model":"claude-sonnet-4-20250514","finishReason":"stop"}\n\n' +
        'data: [DONE]\n\n';

      fetchMock.mockResolvedValue(
        new Response(sseBody, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      );

      const client = createIntelligenceClient(mkConfig());
      const chunks: string[] = [];
      const final = await client.chatStream(
        { provider: 'anthropic', model: 'claude-sonnet-4-20250514', messages: [{ role: 'user', content: 'hi' }] },
        (t) => chunks.push(t),
      );

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/chat/stream`);
      expect(init.method).toBe('POST');
      expect((init.headers as Record<string, string>).Accept).toBe('text/event-stream');

      expect(chunks).toEqual(['hel', 'lo']);
      expect(final.content).toBe('hello');
      expect(final.finishReason).toBe('stop');
      expect(final.model).toBe('claude-sonnet-4-20250514');
      expect(final.provider).toBe('anthropic');
      // Usage is zeroed per TRIANGLE_GAPS — real SSE carries no usage mid-flight.
      expect(final.usage.inputTokens).toBe(0);
      expect(final.usage.outputTokens).toBe(0);
    });

    it('ignores malformed SSE chunks without crashing', async () => {
      const sseBody =
        'data: not-valid-json\n\n' +
        'data: {"id":"m1","delta":"ok","model":"x"}\n\n' +
        'data: [DONE]\n\n';
      fetchMock.mockResolvedValue(
        new Response(sseBody, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }),
      );
      const client = createIntelligenceClient(mkConfig());
      const chunks: string[] = [];
      const final = await client.chatStream(
        { model: 'x', messages: [{ role: 'user', content: 'x' }] },
        (t) => chunks.push(t),
      );
      expect(chunks).toEqual(['ok']);
      expect(final.content).toBe('ok');
    });
  });
});
