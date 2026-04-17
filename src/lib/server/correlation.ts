// Correlation ID propagation — AsyncLocalStorage across the stack.
// Inbound requests get a correlation_id (header or generated). AsyncLocalStorage
// carries it through every downstream call — fetchWithCorrelation auto-injects
// x-correlation-id on outbound. Triangle, Factory, Stripe, Plaid, Supabase all
// become traceable by a single ID. Foundation for cross-system incident triage.

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const correlationStorage = new AsyncLocalStorage<string>();

/**
 * Resolve a correlation_id for an inbound request.
 * Preference order: x-correlation-id header → x-request-id header → new UUID.
 */
export function resolveCorrelationId(req: { headers?: Record<string, unknown> }): string {
  const h = req.headers ?? {};
  const fromInbound =
    (h['x-correlation-id'] as string | undefined) ??
    (h['x-request-id'] as string | undefined);
  return fromInbound ?? randomUUID();
}

/**
 * Return a header record with x-correlation-id set.
 * If no explicit id is provided, falls back to the active AsyncLocalStorage id.
 * If neither is available, returns the base headers unchanged.
 */
export function withCorrelationHeader(
  base: HeadersInit | Record<string, string> = {},
  correlationId?: string,
): Record<string, string> {
  const id = correlationId ?? getActiveCorrelationId();
  const asRecord = (h: HeadersInit | Record<string, string>): Record<string, string> => {
    if (h instanceof Headers) {
      const out: Record<string, string> = {};
      h.forEach((v, k) => {
        out[k] = v;
      });
      return out;
    }
    if (Array.isArray(h)) {
      const out: Record<string, string> = {};
      for (const [k, v] of h) out[k] = v;
      return out;
    }
    return { ...(h as Record<string, string>) };
  };
  const flat = asRecord(base);
  if (!id) return flat;
  flat['x-correlation-id'] = id;
  return flat;
}

/** Return the correlation_id active in the current AsyncLocalStorage context, if any. */
export function getActiveCorrelationId(): string | undefined {
  return correlationStorage.getStore();
}

/** Run fn inside an AsyncLocalStorage context that carries correlationId. */
export function runWithCorrelation<T>(correlationId: string, fn: () => T): T {
  return correlationStorage.run(correlationId, fn);
}
