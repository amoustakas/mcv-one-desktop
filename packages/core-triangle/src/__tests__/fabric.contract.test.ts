// Contract tests for the Fabric client — locks events/audit wire format.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFabricClient } from '../fabric';
import type { CoreServiceConfig } from '../types';

const BASE_URL = 'http://fabric.test';

function mkConfig(overrides: Partial<CoreServiceConfig> = {}): CoreServiceConfig {
  return {
    baseUrl: BASE_URL,
    getAuthToken: async () => 'internal-secret',
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

describe('Fabric wire contract', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('publish() — legacy shape → real /events', () => {
    it('translates {topic, payload:{type, ...data}} into {topic, type, source, ventureId, data, correlationId}', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ data: { eventId: 'evt-1', timestamp: '2026-04-15T10:00:00Z' } }),
      );
      const client = createFabricClient(mkConfig());
      const res = await client.publish({
        topic: 'chat',
        payload: { type: 'chat.sent', userId: 'u1', stream: true },
        traceId: 'corr-1',
        ventureId: 'mcv',
      });

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/events`);
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string);
      expect(body).toMatchObject({
        topic: 'chat',
        type: 'chat.sent',
        source: 'mcv-one-desktop',
        ventureId: 'mcv',
        data: { userId: 'u1', stream: true },
        correlationId: 'corr-1',
      });
      // The `type` key must be extracted from payload, not included in data.
      expect(body.data.type).toBeUndefined();

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.eventId).toBe('evt-1');
        expect(res.data.acceptedAt).toBe('2026-04-15T10:00:00Z');
      }
    });

    it('synthesizes type field from topic when payload has no type', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ data: { eventId: 'evt-2', timestamp: '2026-04-15T10:00:00Z' } }),
      );
      const client = createFabricClient(mkConfig());
      await client.publish({ topic: 'custom', payload: { foo: 'bar' } });
      const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
      expect(body.type).toBe('custom.event');
    });
  });

  describe('audit() — legacy shape → real /audit', () => {
    it('maps {actor, resource, before, after, ip, userAgent} into flat real shape', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: { id: 'audit-1' } }));
      const client = createFabricClient(mkConfig());
      const res = await client.audit({
        action: 'doc.delete',
        actor: { userId: 'u1' },
        resource: { type: 'document', id: 'doc-1' },
        before: { title: 'old' },
        after: null as unknown as Record<string, unknown>,
        ventureId: 'mcv',
        ip: '1.2.3.4',
        userAgent: 'vitest',
      });

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/audit`);
      const body = JSON.parse(init.body as string);
      expect(body).toMatchObject({
        ventureId: 'mcv',
        userId: 'u1',
        action: 'doc.delete',
        resourceType: 'document',
        resourceId: 'doc-1',
        ipAddress: '1.2.3.4',
      });
      expect(body.metadata.before).toEqual({ title: 'old' });
      expect(res.ok).toBe(true);
    });
  });

  describe('queryAudit() — GET /audit with URLSearchParams', () => {
    it('serializes filters as query string and unwraps {data:{entries,total,limit,offset}}', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          data: {
            entries: [
              { id: 'a1', ventureId: 'mcv', userId: 'u1', action: 'chat.sent', resourceType: 'chat', resourceId: null, metadata: null, ipAddress: null, timestamp: '2026-04-15T10:00:00Z' },
            ],
            total: 1, limit: 100, offset: 0,
          },
        }),
      );
      const client = createFabricClient(mkConfig());
      const res = await client.queryAudit({
        ventureId: 'mcv',
        action: 'chat.sent',
        from: 1_700_000_000_000,
        limit: 100,
      });

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toMatch(new RegExp(`^${BASE_URL}/audit\\?`));
      expect(url).toContain('ventureId=mcv');
      expect(url).toContain('action=chat.sent');
      expect(url).toContain('limit=100');
      // epoch ms should be normalized to ISO before sending
      expect(url).toContain('from=2023');
      expect(init.method).toBe('GET');

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.total).toBe(1);
        expect(res.data.entries[0].action).toBe('chat.sent');
      }
    });
  });

  describe('enqueue / storagePut / storageGetUrl — documented gaps', () => {
    it('all return CoreNotAvailableError without hitting the network', async () => {
      const client = createFabricClient(mkConfig());
      const e = await client.enqueue({ queue: 'q', name: 'n', payload: {} });
      const p = await client.storagePut({ bucket: 'b', key: 'k' });
      const g = await client.storageGetUrl('b', 'k');
      expect(e.ok).toBe(false);
      expect(p.ok).toBe(false);
      expect(g.ok).toBe(false);
      if (!e.ok) expect(e.error.name).toBe('CoreNotAvailableError');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('ping()', () => {
    it('GETs /health', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, version: '0.9.0' }));
      const client = createFabricClient(mkConfig());
      const res = await client.ping();
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/health`);
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.service).toBe('fabric');
    });
  });
});
