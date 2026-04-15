// src/lib/mcv-core/identity.ts
//
// Per-service shim for the Identity microservice. Re-exports the typed client
// from @mcv/core-triangle/identity and adds a server-side factory for use in
// Vercel API handlers + the local Express server, where `import.meta.env` is
// not available and we must read from process.env.
//
// Browser code should keep using useCoreTriangle() in src/hooks/use-core-triangle.ts.

import {
  createIdentityClient,
  type IdentityClient,
  type IdentitySession,
  type RbacCheckRequest,
  type RbacCheckResult,
  type TenantMembership,
} from '@mcv/core-triangle/identity';
export {
  createIdentityClient,
  type IdentityClient,
  type IdentitySession,
  type RbacCheckRequest,
  type RbacCheckResult,
  type TenantMembership,
};

export interface ServerIdentityOptions {
  /** Per-request token (Clerk JWT, Identity session, or null for anonymous). */
  getAuthToken?: () => Promise<string | null>;
  ventureId?: string;
  timeoutMs?: number;
}

/**
 * Server-side Identity client factory. Reads IDENTITY_URL from process.env.
 * Returns null if the URL is unset — caller is expected to fall back to the
 * existing Clerk + Supabase path.
 */
export function createServerIdentity(opts: ServerIdentityOptions = {}): IdentityClient | null {
  const baseUrl = process.env.IDENTITY_URL;
  if (!baseUrl) return null;
  return createIdentityClient({
    baseUrl,
    getAuthToken: opts.getAuthToken ?? (async () => process.env.INTERNAL_SERVICE_SECRET ?? null),
    ventureId: opts.ventureId,
    timeoutMs: opts.timeoutMs,
    logger: (level, msg, meta) =>
      // eslint-disable-next-line no-console
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[identity] ${msg}`, meta ?? ''),
  });
}

