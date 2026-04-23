// Clerk JWT custom-claims reader for MCV Trust Engine claims.
//
// The Trust Engine microservice (Cloud Run / api/_handlers/identity.ts)
// writes mcv_trust_score + mcv_civic_clearance into Clerk's public_metadata
// via clerkClient.users.updateUserMetadata. The frontend / handlers read
// those fields back through Clerk's session JWT — this module provides the
// parse + narrow helpers so nobody hand-types the claim names.

import type { CivicClearance, McvIdClaims } from './types';

/**
 * Safely extract MCV claims from a Clerk JWT payload. Returns null when no
 * MCV claims are present (new session pre-Trust-Engine) or when the shape
 * is malformed.
 */
export function readMcvClaims(
  jwtPayload: Record<string, unknown> | null | undefined,
): McvIdClaims | null {
  if (!jwtPayload) return null;

  // Clerk nests custom claims under `public_metadata` by default, but some
  // templates expose them at the root. Check both.
  const source =
    (jwtPayload.public_metadata as Record<string, unknown> | undefined) ??
    jwtPayload;

  const score = source.mcv_trust_score;
  const clearance = source.mcv_civic_clearance;
  const computedAt = source.mcv_trust_computed_at;
  const fractures = source.mcv_active_fractures;

  if (typeof score !== 'number') return null;
  if (!isCivicClearance(clearance)) return null;
  if (typeof computedAt !== 'string') return null;

  return {
    mcv_trust_score: score,
    mcv_civic_clearance: clearance,
    mcv_trust_computed_at: computedAt,
    mcv_active_fractures: Array.isArray(fractures)
      ? fractures.filter((f): f is string => typeof f === 'string')
      : [],
  };
}

function isCivicClearance(value: unknown): value is CivicClearance {
  return value === 'basic' || value === 'verified' || value === 'sovereign';
}

/**
 * Decode Clerk JWT payload without verification. Clerk verifies the JWT
 * at the session-middleware layer; callers of this helper have already
 * passed that gate. Returns null for malformed tokens.
 */
export function decodeJwtPayloadUnsafe(jwt: string): Record<string, unknown> | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

/**
 * End-to-end convenience — extract MCV claims directly from a Clerk JWT.
 * Returns null on missing fields OR malformed JWT.
 */
export function extractMcvClaimsFromJwt(jwt: string): McvIdClaims | null {
  return readMcvClaims(decodeJwtPayloadUnsafe(jwt));
}
