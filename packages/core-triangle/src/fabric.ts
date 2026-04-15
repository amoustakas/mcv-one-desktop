// MCV Core Triangle — Fabric client.
// Aligned with real Triangle SDK contract:
//
//   POST /events   → publishEvent({ topic, type, source, ventureId, data, correlationId?, metadata? })
//   POST /audit    → logAudit({ ventureId, userId?, action, resourceType, resourceId?, metadata?, ipAddress? })
//   GET  /audit    → queryAudit(URLSearchParams)
//   GET  /health   → ping
//
// Gaps flagged in TRIANGLE_GAPS.md:
//   - Jobs endpoint (enqueue/get/stats) not exposed publicly yet
//   - Storage upload/signed-url uses a different contract than the local client
//     assumed; we expose typed stubs that return CoreNotAvailableError
//   - SSE subscribe kept as-is against /events/subscribe; confirm path when
//     realtime ships.

import type { CoreServiceConfig, CoreResponse } from './types';
import { coreHttp } from './http';

// ── Request types (local public surface preserved for existing callers) ──

export interface EventPublishRequest {
  topic: string;
  payload: Record<string, unknown>;
  traceId?: string;
  idempotencyKey?: string;
  ventureId?: string;
}
export interface EventPublishResult {
  eventId: string;
  acceptedAt: string;
}

export interface AuditWriteRequest {
  action: string;
  actor: { userId?: string; agentCodename?: string };
  resource: { type: string; id: string };
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ventureId?: string;
  ip?: string;
  userAgent?: string;
}

export interface JobEnqueueRequest {
  queue: string;
  name: string;
  payload: Record<string, unknown>;
  runAt?: string;
  maxAttempts?: number;
}
export interface JobEnqueueResult {
  jobId: string;
  enqueuedAt: string;
}

export interface StoragePutRequest {
  bucket: string;
  key: string;
  bodyBase64?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  presign?: boolean;
}
export interface StoragePutResult {
  key: string;
  size: number;
  etag?: string;
  presignedUrl?: string;
  expiresIn?: number;
}

export interface RealtimeSubscribeOptions {
  topic: string;
  signal?: AbortSignal;
}

export interface AuditQuery {
  ventureId?: string;
  userId?: string;
  action?: string;
  /** ISO timestamp or epoch ms */
  from?: string | number;
  /** ISO timestamp or epoch ms */
  to?: string | number;
  limit?: number;
  offset?: number;
}

export interface AuditEntry {
  id: string;
  ventureId: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  timestamp: string;
}

export interface AuditQueryResult {
  entries: AuditEntry[];
  total: number;
  limit: number;
  offset: number;
}

// ── Client ──

export interface FabricClient {
  publish(req: EventPublishRequest): Promise<CoreResponse<EventPublishResult>>;
  enqueue(req: JobEnqueueRequest): Promise<CoreResponse<JobEnqueueResult>>;
  audit(req: AuditWriteRequest): Promise<CoreResponse<{ ok: true }>>;
  /** Query the audit log; filters are all optional and AND-combined. */
  queryAudit(query: AuditQuery): Promise<CoreResponse<AuditQueryResult>>;
  storagePut(req: StoragePutRequest): Promise<CoreResponse<StoragePutResult>>;
  storageGetUrl(bucket: string, key: string): Promise<CoreResponse<{ url: string; expiresIn: number }>>;
  subscribe<T = unknown>(opts: RealtimeSubscribeOptions): AsyncIterable<T>;
  ping(): Promise<CoreResponse<{ ok: true; service: 'fabric'; version?: string }>>;
}

export function createFabricClient(config: CoreServiceConfig): FabricClient {
  async function* subscribeSse<T>(opts: RealtimeSubscribeOptions): AsyncGenerator<T> {
    const token = await config.getAuthToken();
    const url = `${config.baseUrl.replace(/\/$/, '')}/events/subscribe?topic=${encodeURIComponent(opts.topic)}`;
    const res = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), Accept: 'text/event-stream' },
      signal: opts.signal,
    });
    if (!res.ok || !res.body) throw new Error(`Fabric subscribe failed: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? '';
      for (const evt of events) {
        const dataLine = evt.split(/\r?\n/).find((l) => l.startsWith('data: '));
        if (!dataLine) continue;
        try {
          yield JSON.parse(dataLine.slice(6)) as T;
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  async function publish(req: EventPublishRequest): Promise<CoreResponse<EventPublishResult>> {
    // Map legacy {topic, payload: {type, ...data}} onto real {topic, type, source, data}.
    const { type, ...data } = (req.payload ?? {}) as { type?: string } & Record<string, unknown>;
    const body = {
      topic: req.topic,
      type: type ?? `${req.topic}.event`,
      source: 'mcv-one-desktop',
      ventureId: req.ventureId ?? config.ventureId ?? '',
      data,
      correlationId: req.traceId,
      metadata: req.idempotencyKey ? { idempotencyKey: req.idempotencyKey } : undefined,
    };
    const res = await coreHttp<{ eventId: string; timestamp: string }>('fabric', config, {
      method: 'POST',
      path: '/events',
      body,
    });
    if (!res.ok) return res;
    return { ok: true, data: { eventId: res.data.eventId, acceptedAt: res.data.timestamp } };
  }

  async function audit(req: AuditWriteRequest): Promise<CoreResponse<{ ok: true }>> {
    const body = {
      ventureId: req.ventureId ?? config.ventureId ?? '',
      userId: req.actor.userId,
      action: req.action,
      resourceType: req.resource.type,
      resourceId: req.resource.id,
      metadata: {
        actor: req.actor,
        before: req.before,
        after: req.after,
        userAgent: req.userAgent,
      },
      ipAddress: req.ip,
    };
    const res = await coreHttp<{ id: string }>('fabric', config, {
      method: 'POST',
      path: '/audit',
      body,
    });
    if (!res.ok) return res;
    return { ok: true, data: { ok: true } };
  }

  async function queryAudit(query: AuditQuery): Promise<CoreResponse<AuditQueryResult>> {
    const normalized: Record<string, string | number | boolean | undefined> = {
      ventureId: query.ventureId ?? config.ventureId,
      userId: query.userId,
      action: query.action,
      from: typeof query.from === 'number' ? new Date(query.from).toISOString() : query.from,
      to: typeof query.to === 'number' ? new Date(query.to).toISOString() : query.to,
      limit: query.limit,
      offset: query.offset,
    };
    return coreHttp<AuditQueryResult>('fabric', config, {
      method: 'GET',
      path: '/audit',
      query: normalized,
    });
  }

  async function enqueue(_req: JobEnqueueRequest): Promise<CoreResponse<JobEnqueueResult>> {
    // Public Fabric SDK currently has no jobs endpoint — see TRIANGLE_GAPS.
    return {
      ok: false,
      error: new (await import('./types')).CoreNotAvailableError('fabric'),
    };
  }

  async function storagePut(_req: StoragePutRequest): Promise<CoreResponse<StoragePutResult>> {
    return {
      ok: false,
      error: new (await import('./types')).CoreNotAvailableError('fabric'),
    };
  }

  async function storageGetUrl(_bucket: string, _key: string): Promise<CoreResponse<{ url: string; expiresIn: number }>> {
    return {
      ok: false,
      error: new (await import('./types')).CoreNotAvailableError('fabric'),
    };
  }

  async function ping(): Promise<CoreResponse<{ ok: true; service: 'fabric'; version?: string }>> {
    const res = await coreHttp<{ ok?: boolean; version?: string }>('fabric', config, {
      method: 'GET',
      path: '/health',
    });
    if (!res.ok) return res;
    return { ok: true, data: { ok: true, service: 'fabric', version: res.data?.version } };
  }

  return {
    publish,
    enqueue,
    audit,
    queryAudit,
    storagePut,
    storageGetUrl,
    subscribe: (opts) => subscribeSse(opts) as AsyncIterable<unknown> as never,
    ping,
  };
}
