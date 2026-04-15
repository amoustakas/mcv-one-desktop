import type { CoreServiceConfig } from './types';
import { CoreApiError, CoreNotAvailableError, coreOk, coreFail, type CoreResponse } from './types';

// Shared HTTP primitive for all three Core Triangle clients.
// Wraps fetch with auth header injection, timeout, and typed error mapping.

export interface HttpCallArgs<Body = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: Body;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  /** If true, failures throw instead of returning CoreResponse. Default false. */
  throwOnError?: boolean;
}

export function buildQueryString(query?: Record<string, string | number | boolean | undefined>): string {
  if (!query) return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export async function coreHttp<Response, Body = unknown>(
  service: 'identity' | 'fabric' | 'intelligence',
  config: CoreServiceConfig,
  args: HttpCallArgs<Body>,
): Promise<CoreResponse<Response>> {
  const token = await config.getAuthToken();
  const url = `${config.baseUrl.replace(/\/$/, '')}${args.path}${buildQueryString(args.query)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 10_000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(config.ventureId ? { 'x-mcv-venture': config.ventureId } : {}),
    ...args.headers,
  };

  try {
    const res = await fetch(url, {
      method: args.method,
      headers,
      body: args.body !== undefined ? JSON.stringify(args.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      // Triangle error envelope: { error: { code, message, details? } }
      const errObj = (payload as { error?: { code?: string; message?: string } } | null)?.error;
      const err = new CoreApiError(
        service,
        res.status,
        errObj?.code ?? (payload as { code?: string } | null)?.code,
        errObj?.message ?? (payload as { message?: string } | null)?.message ?? res.statusText,
        payload,
      );
      if (args.throwOnError) throw err;
      return coreFail(err);
    }

    const body = (await res.json()) as { data?: Response } | Response;
    // Triangle convention: success responses wrap payload in { data: ... }.
    // Unwrap transparently; fall back to the raw body if the envelope is absent
    // (e.g. /health style pings that return { ok: true, ... }).
    const data = (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>))
      ? ((body as { data: Response }).data)
      : (body as Response);
    return coreOk(data);
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof CoreApiError) {
      if (args.throwOnError) throw e;
      return coreFail(e);
    }
    // Network/timeout/CORS → service not available
    const err = new CoreNotAvailableError(service, e);
    config.logger?.('warn', `[${service}] request failed → fallback`, { url, err: (e as Error).message });
    if (args.throwOnError) throw err;
    return coreFail(err);
  }
}

/**
 * Helper: call the client and return the payload or null on failure. Used for
 * callers that want a nullable "did it work" result without checking `ok`.
 */
export async function coreMaybe<T>(
  p: Promise<CoreResponse<T>>,
): Promise<T | null> {
  const res = await p;
  return res.ok ? res.data : null;
}
