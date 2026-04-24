// packages/signer-sdk/src/core/tenancy.ts
//
// Child-venture tenancy helpers. Every envelope carries a (tenantId,
// parentVentureId, childVentureId?) scope tuple; this file provides the
// utilities consumers use to compose those, walk parent-child trees,
// and assemble audit rollups that aggregate envelope state UP the tree
// so compliance sees the whole view (not just one leaf-venture's slice).
//
// Mirrors the Phase-1 Intelligence Router's scope-tuple shape so the
// two modules compose cleanly when workflows bridge signing + recall.

import type { SignerEnvelope, EnvelopeStatus } from './types';

/** Scope tuple for any signing operation. Never includes userId — the
 *  signer is the user, identified by email on the envelope. */
export interface SigningScope {
  tenantId: string;
  parentVentureId: string;
  childVentureId?: string;
}

export function scopeFromEnvelope(envelope: Pick<SignerEnvelope, 'tenantId' | 'parentVentureId' | 'childVentureId'>): SigningScope {
  return {
    tenantId: envelope.tenantId,
    parentVentureId: envelope.parentVentureId,
    childVentureId: envelope.childVentureId,
  };
}

/** Stable string form for logging, cache keys, and RLS pseudo-variables.
 *  Format: `tenant/<tid>/venture/<pvid>[:<cvid>]`. Child segment is
 *  appended only when present so it round-trips with `scopeFromKey`. */
export function scopeKey(scope: SigningScope): string {
  const base = `tenant/${scope.tenantId}/venture/${scope.parentVentureId}`;
  return scope.childVentureId ? `${base}:${scope.childVentureId}` : base;
}

export function scopeFromKey(key: string): SigningScope | null {
  const m = key.match(/^tenant\/([^/]+)\/venture\/([^:]+)(?::(.+))?$/);
  if (!m) return null;
  return {
    tenantId: m[1],
    parentVentureId: m[2],
    childVentureId: m[3] || undefined,
  };
}

/** Two scopes match when they describe the same venture leaf. */
export function scopesEqual(a: SigningScope, b: SigningScope): boolean {
  return (
    a.tenantId === b.tenantId &&
    a.parentVentureId === b.parentVentureId &&
    (a.childVentureId ?? null) === (b.childVentureId ?? null)
  );
}

/** Parent matches a child — i.e. the child's scope is inside the parent's
 *  subtree. A scope is always in its own subtree (reflexive). */
export function scopeContains(parent: SigningScope, candidate: SigningScope): boolean {
  if (parent.tenantId !== candidate.tenantId) return false;
  if (parent.parentVentureId !== candidate.parentVentureId) return false;
  // parent with no childVentureId → all children belong
  if (!parent.childVentureId) return true;
  // parent is itself a child → only exact match belongs
  return parent.childVentureId === candidate.childVentureId;
}

// ─── Audit rollup ──────────────────────────────────────────────────────

/** Aggregate view emitted by `server/audit-rollup.ts`. Shape is consumer-
 *  facing — the compliance dashboard UI in mcv-one-desktop consumes this
 *  directly, and subscribers on `signing.envelope.*` can reconstruct it. */
export interface SigningAuditRollup {
  scope: SigningScope;
  /** Scope of the subtree this rollup covers — equals `scope` for a leaf
   *  venture, or the parent when this is a cross-tree rollup. */
  coverageScope: SigningScope;
  counts: Record<EnvelopeStatus, number>;
  totalEnvelopes: number;
  /** Most-recent activity timestamp across any envelope in the subtree.
   *  Null when the subtree has no envelopes yet. */
  lastActivityAt: string | null;
}

export function emptyRollup(scope: SigningScope, coverageScope: SigningScope = scope): SigningAuditRollup {
  return {
    scope,
    coverageScope,
    counts: {
      draft: 0, issued: 0, viewed: 0, partial: 0, signed: 0, voided: 0, expired: 0,
    },
    totalEnvelopes: 0,
    lastActivityAt: null,
  };
}

/** Fold an envelope into a rollup. Pure — returns a new rollup. */
export function foldEnvelope(rollup: SigningAuditRollup, envelope: SignerEnvelope): SigningAuditRollup {
  if (!scopeContains(rollup.coverageScope, scopeFromEnvelope(envelope))) return rollup;
  const next = {
    ...rollup,
    counts: { ...rollup.counts, [envelope.status]: rollup.counts[envelope.status] + 1 },
    totalEnvelopes: rollup.totalEnvelopes + 1,
    lastActivityAt: pickLater(rollup.lastActivityAt, lastActivityOf(envelope)),
  };
  return next;
}

function lastActivityOf(envelope: SignerEnvelope): string {
  const { audit, issuedAt } = envelope;
  return (
    audit.lastSignedAt ||
    audit.voidedAt ||
    audit.viewedAt ||
    issuedAt
  );
}

function pickLater(a: string | null, b: string): string {
  if (!a) return b;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}
