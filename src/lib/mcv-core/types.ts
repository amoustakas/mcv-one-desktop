// MCV Core Triangle — shared types.
//
// The Core Triangle is three foundational microservices powering the MCV
// ecosystem. MCV Desktop consumes them via thin typed clients defined in
// the sibling files in this directory.
//
//   Identity     | Auth, RBAC, multi-tenant, compliance  | 8080  / 50051
//   Fabric       | Event bus, audit, jobs, storage, RT   | 8081  / 50052
//   Intelligence | AI gateway, RAG, agents               | 8082  / 50053
//
// Design philosophy:
//  * HTTP-first for v1. gRPC-web adapter can be bolted on later behind the
//    same client interface.
//  * Every client supports a `fallback` mode: when the service is unreachable
//    the client returns a typed NotAvailable error that callers check for and
//    degrade gracefully (e.g. Identity falls back to Clerk+Supabase path).
//  * Zero hard dependency on the services existing. MCV Desktop ships today
//    with the services acting as optional augmentation.

export interface CoreServiceConfig {
  /** Base URL, e.g. http://localhost:8080 or https://identity.mcv.one */
  baseUrl: string;
  /** Provide a Clerk JWT or Identity session token for authenticated calls */
  getAuthToken: () => Promise<string | null>;
  /** Optional tenant/venture scope forwarded in a header */
  ventureId?: string;
  /** Request timeout in ms (default 10s) */
  timeoutMs?: number;
  /** Log lifecycle events via a provided logger */
  logger?: (level: 'debug' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) => void;
}

export class CoreNotAvailableError extends Error {
  readonly isCoreNotAvailable = true;
  constructor(public readonly service: 'identity' | 'fabric' | 'intelligence', cause?: unknown) {
    super(`Core Triangle service not available: ${service}`);
    this.name = 'CoreNotAvailableError';
    (this as { cause?: unknown }).cause = cause;
  }
}

export class CoreApiError extends Error {
  readonly isCoreApiError = true;
  constructor(
    public readonly service: 'identity' | 'fabric' | 'intelligence',
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'CoreApiError';
  }
}

export interface CoreResult<T> {
  ok: true;
  data: T;
}
export interface CoreFailure {
  ok: false;
  error: CoreApiError | CoreNotAvailableError;
}
export type CoreResponse<T> = CoreResult<T> | CoreFailure;

export function coreOk<T>(data: T): CoreResult<T> {
  return { ok: true, data };
}
export function coreFail(error: CoreApiError | CoreNotAvailableError): CoreFailure {
  return { ok: false, error };
}
