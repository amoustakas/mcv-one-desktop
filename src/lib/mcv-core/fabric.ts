// src/lib/mcv-core/fabric.ts
//
// Per-service shim for the Fabric microservice (events, audit, jobs, storage).
// Adds:
//   - createServerFabric(): server-side factory bound to process.env.FABRIC_URL
//   - auditedAction<T>(): wrapper that publishes a Fabric event around any
//     async action, swallowing Fabric outages so audit failures never break UX.

import {
  createFabricClient,
  type FabricClient,
  type EventPublishRequest,
  type EventPublishResult,
  type AuditWriteRequest,
  type JobEnqueueRequest,
  type JobEnqueueResult,
  type StoragePutRequest,
  type StoragePutResult,
} from '@mcv/core-triangle/fabric';
export {
  createFabricClient,
  type FabricClient,
  type EventPublishRequest,
  type EventPublishResult,
  type AuditWriteRequest,
  type JobEnqueueRequest,
  type JobEnqueueResult,
  type StoragePutRequest,
  type StoragePutResult,
};

export interface ServerFabricOptions {
  getAuthToken?: () => Promise<string | null>;
  ventureId?: string;
  timeoutMs?: number;
}

export function createServerFabric(opts: ServerFabricOptions = {}): FabricClient | null {
  const baseUrl = process.env.FABRIC_URL;
  if (!baseUrl) return null;
  return createFabricClient({
    baseUrl,
    getAuthToken: opts.getAuthToken ?? (async () => process.env.INTERNAL_SERVICE_SECRET ?? null),
    ventureId: opts.ventureId,
    timeoutMs: opts.timeoutMs,
    logger: (level, msg, meta) =>
      // eslint-disable-next-line no-console
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[fabric] ${msg}`, meta ?? ''),
  });
}

/**
 * Wrap an async action in a fire-and-forget audit publish. Returns the action's
 * result; Fabric outages never propagate to the caller (audit is observability,
 * not a transactional dependency).
 *
 * Usage:
 *   const result = await auditedAction(
 *     fabric,
 *     { topic: 'chat', type: 'chat.sent', ventureId, data: { correlationId } },
 *     () => actuallyDoTheChat(),
 *   );
 */
export async function auditedAction<T>(
  fabric: FabricClient | null,
  event: Omit<EventPublishRequest, 'payload'> & { type: string; data?: Record<string, unknown> },
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    void publishSafe(fabric, event, { ok: true, ms: Date.now() - start });
    return result;
  } catch (err) {
    void publishSafe(fabric, event, { ok: false, ms: Date.now() - start, error: (err as Error).message });
    throw err;
  }
}

async function publishSafe(
  fabric: FabricClient | null,
  event: Omit<EventPublishRequest, 'payload'> & { type: string; data?: Record<string, unknown> },
  outcome: Record<string, unknown>,
): Promise<void> {
  if (!fabric) return;
  try {
    await fabric.publish({
      topic: event.topic,
      payload: { type: event.type, ...event.data, ...outcome },
      traceId: event.traceId,
      idempotencyKey: event.idempotencyKey,
      ventureId: event.ventureId,
    });
  } catch {
    // Audit must never break the calling action.
  }
}
