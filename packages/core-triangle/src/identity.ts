// MCV Core Triangle — Identity client.
// Aligned with real Triangle SDK contract:
//
//   GET  /users/me → current user + venture memberships
//   GET  /ventures → accessible ventures
//   GET  /health   → ping (was /v1/ping)
//
// The legacy `session()` / `tenants()` methods remain on the public surface
// but are implemented by translating the real /users/me and /ventures
// responses into the existing IdentitySession / TenantMembership shapes so
// downstream callers (src/hooks/use-core-triangle.ts + tsx components) don't
// need to change.
//
// `can()` (RBAC check) has no equivalent in the public Identity SDK — only
// the internal `checkPermission` gRPC method. It's kept as a typed stub
// returning CoreNotAvailableError; see TRIANGLE_GAPS.md.

import type { CoreServiceConfig, CoreResponse } from './types';
import { coreHttp } from './http';

export interface IdentitySession {
  userId: string;
  email: string | null;
  displayName: string | null;
  roles: string[];
  tenants: Array<{ id: string; role: string }>;
  expiresAt: string;
}

export interface RbacCheckRequest {
  resource: string;
  action: string;
  subjectId?: string;
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

// Real /users/me response shape.
interface UserMeResponse {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string | Date;
  memberships: Array<{
    ventureId: string;
    role: string;
    status: 'active' | 'invited' | 'suspended';
    joinedAt: string | Date;
  }>;
}

// Real /ventures response shape.
interface VentureListItem {
  ventureId: string;
  role: string;
  status: string;
  joinedAt: string | Date;
  ventureName: string;
  ventureSlug: string;
}

export interface IdentityClient {
  session(): Promise<CoreResponse<IdentitySession>>;
  can(req: RbacCheckRequest): Promise<CoreResponse<RbacCheckResult>>;
  tenants(): Promise<CoreResponse<TenantMembership[]>>;
  ping(): Promise<CoreResponse<{ ok: true; service: 'identity'; version?: string }>>;
}

export function createIdentityClient(config: CoreServiceConfig): IdentityClient {
  async function session(): Promise<CoreResponse<IdentitySession>> {
    const res = await coreHttp<UserMeResponse>('identity', config, { method: 'GET', path: '/users/me' });
    if (!res.ok) return res;
    const me = res.data;
    return {
      ok: true,
      data: {
        userId: me.id,
        email: me.email ?? null,
        displayName: me.name ?? null,
        roles: [me.role],
        tenants: (me.memberships ?? [])
          .filter((m) => m.status === 'active')
          .map((m) => ({ id: m.ventureId, role: m.role })),
        // /users/me doesn't return a token expiry — callers that care should
        // read the underlying JWT's `exp`. Stub to +1h for now.
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      },
    };
  }

  async function tenants(): Promise<CoreResponse<TenantMembership[]>> {
    const res = await coreHttp<VentureListItem[]>('identity', config, { method: 'GET', path: '/ventures' });
    if (!res.ok) return res;
    return {
      ok: true,
      data: res.data.map((v) => ({
        ventureId: v.ventureId,
        role: v.role,
        joinedAt: typeof v.joinedAt === 'string' ? v.joinedAt : v.joinedAt.toISOString(),
      })),
    };
  }

  async function can(_req: RbacCheckRequest): Promise<CoreResponse<RbacCheckResult>> {
    // Public Identity SDK doesn't expose RBAC check (only `checkPermission` on
    // the internal gRPC client). Caller should fall back to client-side role
    // check using session().roles + session().tenants until the gap closes.
    return {
      ok: false,
      error: new (await import('./types')).CoreNotAvailableError('identity'),
    };
  }

  async function ping(): Promise<CoreResponse<{ ok: true; service: 'identity'; version?: string }>> {
    const res = await coreHttp<{ ok?: boolean; version?: string }>('identity', config, {
      method: 'GET',
      path: '/health',
    });
    if (!res.ok) return res;
    return { ok: true, data: { ok: true, service: 'identity', version: res.data?.version } };
  }

  return { session, can, tenants, ping };
}

export async function canOrFallback(
  client: IdentityClient,
  req: RbacCheckRequest,
  fallback: boolean,
): Promise<boolean> {
  const res = await client.can(req);
  if (!res.ok) return fallback;
  return res.data.allowed;
}

// ── Client-side RBAC fallback ────────────────────────────────────────
//
// The public Identity SDK has no `/rbac/check` route (see TRIANGLE_GAPS).
// Until it ships, callers gate UI/actions via canClientSide(session, req)
// against the already-fetched IdentitySession.
//
// Policy (fail-closed):
//   - Global roles 'admin'/'owner' → allow any action, any venture
//   - Per-venture role 'owner'/'admin' → allow any action on that ventureId
//   - 'member' → allow read-family (read|view|list|get|browse|query) on that venture
//   - 'viewer' → allow read-family only
//   - no session / unknown role / no matching venture membership → DENY
//
// Intentionally conservative. Surfaces needing finer-grained perms should
// wait for the real /rbac/check endpoint.

const READ_ACTIONS = new Set(['read', 'view', 'list', 'get', 'browse', 'query']);

function isReadAction(action: string): boolean {
  const last = action.includes('.') ? action.split('.').pop()! : action;
  return READ_ACTIONS.has(last.toLowerCase());
}

export function canClientSide(
  session: IdentitySession | null,
  req: RbacCheckRequest,
): RbacCheckResult {
  if (!session) {
    return { allowed: false, reason: 'no-session' };
  }

  const globalRoles = new Set(session.roles.map((r) => r.toLowerCase()));
  if (globalRoles.has('admin') || globalRoles.has('owner')) {
    return { allowed: true };
  }

  if (req.ventureId) {
    const membership = session.tenants.find((t) => t.id === req.ventureId);
    if (!membership) {
      return { allowed: false, reason: 'no-venture-membership' };
    }
    const role = membership.role.toLowerCase();
    if (role === 'owner' || role === 'admin') return { allowed: true };
    if (role === 'member' && isReadAction(req.action)) return { allowed: true };
    if (role === 'member') return { allowed: false, reason: 'member-write-requires-server-rbac' };
    if (role === 'viewer' && isReadAction(req.action)) return { allowed: true };
    return { allowed: false, reason: `role-${role}-insufficient` };
  }

  return { allowed: false, reason: 'requires-venture-scope-or-global-role' };
}

/**
 * Try server RBAC first (via Identity /rbac/check when it ships); on
 * CoreNotAvailableError, fall back to the client-side role check against
 * the current session. This is the recommended helper for UI gates.
 */
export async function canWithSessionFallback(
  client: IdentityClient,
  session: IdentitySession | null,
  req: RbacCheckRequest,
): Promise<RbacCheckResult> {
  const server = await client.can(req);
  if (server.ok) return server.data;
  return canClientSide(session, req);
}
