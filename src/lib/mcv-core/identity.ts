// MCV Core Triangle — Identity client.
// Port 8080 HTTP / 50051 gRPC.
// Provides: auth session resolution, RBAC checks, multi-tenant scoping.
//
// This client ships with MCV Desktop today and is SAFE to call even before
// the Identity service is deployed — every method returns a CoreResponse
// whose `ok=false` branch signals that callers should fall back to their
// existing Clerk + Supabase path.

import type { CoreServiceConfig, CoreResponse } from './types';
import { coreHttp } from './http';

// ── Types (to be superseded by codegen'd types once Identity ships) ──

export interface IdentitySession {
  userId: string;
  email: string | null;
  displayName: string | null;
  roles: string[];
  tenants: Array<{ id: string; role: string }>;
  expiresAt: string; // ISO
}

export interface RbacCheckRequest {
  resource: string;
  action: string;
  /** Optional object id for row-level checks */
  subjectId?: string;
  /** Override the default venture from config */
  ventureId?: string;
}

export interface RbacCheckResult {
  allowed: boolean;
  reason?: string;
  requiredRoles?: string[];
}

export interface TenantMembership {
  ventureId: string;
  role: string;
  joinedAt: string;
}

// ── Client ──

export interface IdentityClient {
  session(): Promise<CoreResponse<IdentitySession>>;
  can(req: RbacCheckRequest): Promise<CoreResponse<RbacCheckResult>>;
  tenants(): Promise<CoreResponse<TenantMembership[]>>;
  /** Echo — useful for service health checks */
  ping(): Promise<CoreResponse<{ ok: true; service: 'identity'; version: string }>>;
}

export function createIdentityClient(config: CoreServiceConfig): IdentityClient {
  return {
    session: () => coreHttp('identity', config, { method: 'GET', path: '/v1/session' }),
    can: (req) => coreHttp('identity', config, { method: 'POST', path: '/v1/rbac/check', body: req }),
    tenants: () => coreHttp('identity', config, { method: 'GET', path: '/v1/tenants' }),
    ping: () => coreHttp('identity', config, { method: 'GET', path: '/v1/ping' }),
  };
}

/**
 * Convenience: boolean RBAC check that falls back to allow-on-service-down.
 * Use for non-security-critical gates (e.g. UI visibility). For hard security
 * gates, check the full CoreResponse and fail-closed.
 */
export async function canOrFallback(
  client: IdentityClient,
  req: RbacCheckRequest,
  fallback: boolean,
): Promise<boolean> {
  const res = await client.can(req);
  if (!res.ok) return fallback;
  return res.data.allowed;
}
