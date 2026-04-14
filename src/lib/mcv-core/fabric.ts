// MCV Core Triangle — Fabric client.
// Port 8081 HTTP / 50052 gRPC.
// Provides: event publish/subscribe, durable jobs, audit log, storage, real-time.

import type { CoreServiceConfig, CoreResponse } from './types';
import { coreHttp } from './http';

export interface EventPublishRequest {
  topic: string;
  payload: Record<string, unknown>;
  /** Correlate related events across services */
  traceId?: string;
  /** Dedupe within a topic */
  idempotencyKey?: string;
  ventureId?: string;
}
export interface EventPublishResult {
  eventId: string;
  acceptedAt: string;
}

export interface JobEnqueueRequest {
  queue: string;
  name: string;
  payload: Record<string, unknown>;
  runAt?: string;
  /** Retry policy override */
  maxAttempts?: number;
}
export interface JobEnqueueResult {
  jobId: string;
  enqueuedAt: string;
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

export interface StoragePutRequest {
  bucket: string;
  key: string;
  /** base64-encoded body for small objects, or a presigned-url request */
  bodyBase64?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  /** Ask Fabric to return a presigned upload URL instead of accepting the body */
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

// ── Client ──

export interface FabricClient {
  publish(req: EventPublishRequest): Promise<CoreResponse<EventPublishResult>>;
  enqueue(req: JobEnqueueRequest): Promise<CoreResponse<JobEnqueueResult>>;
  audit(req: AuditWriteRequest): Promise<CoreResponse<{ ok: true }>>;
  storagePut(req: StoragePutRequest): Promise<CoreResponse<StoragePutResult>>;
  storageGetUrl(bucket: string, key: string): Promise<CoreResponse<{ url: string; expiresIn: number }>>;
  /**
   * Subscribe to a topic over SSE/WebSocket. Returns an async iterator of
   * events. If Fabric is unavailable throws a CoreNotAvailableError — unlike
   * the RPC methods, subscribe has no meaningful ok=false value.
   */
  subscribe<T = unknown>(opts: RealtimeSubscribeOptions): AsyncIterable<T>;
  ping(): Promise<CoreResponse<{ ok: true; service: 'fabric'; version: string }>>;
}

export function createFabricClient(config: CoreServiceConfig): FabricClient {
  async function* subscribeSse<T>(opts: RealtimeSubscribeOptions): AsyncGenerator<T> {
    const token = await config.getAuthToken();
    const url = `${config.baseUrl.replace(/\/$/, '')}/v1/events/subscribe?topic=${encodeURIComponent(opts.topic)}`;
    const res = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), Accept: 'text/event-stream' },
      signal: opts.signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`Fabric subscribe failed: ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6);
          try {
            yield JSON.parse(payload) as T;
          } catch {
            // ignore malformed chunks
          }
        }
      }
    }
  }

  return {
    publish: (req) => coreHttp('fabric', config, { method: 'POST', path: '/v1/events/publish', body: req }),
    enqueue: (req) => coreHttp('fabric', config, { method: 'POST', path: '/v1/jobs/enqueue', body: req }),
    audit: (req) => coreHttp('fabric', config, { method: 'POST', path: '/v1/audit', body: req }),
    storagePut: (req) => coreHttp('fabric', config, { method: 'POST', path: '/v1/storage/put', body: req }),
    storageGetUrl: (bucket, key) =>
      coreHttp('fabric', config, {
        method: 'GET',
        path: '/v1/storage/url',
        query: { bucket, key },
      }),
    subscribe: (opts) => subscribeSse(opts) as AsyncIterable<unknown> as never,
    ping: () => coreHttp('fabric', config, { method: 'GET', path: '/v1/ping' }),
  };
}
