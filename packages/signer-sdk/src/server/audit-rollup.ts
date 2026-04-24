// packages/signer-sdk/src/server/audit-rollup.ts
//
// Cross-venture audit rollup — aggregates envelope state UP the parent/
// child-venture tree so a compliance dashboard can see the whole view
// even when ventures are leaf-scoped. Pure function, no DB coupling —
// callers query whatever store they use and feed the result here.

import type { SignerEnvelope } from '../core/types';
import {
  emptyRollup,
  foldEnvelope,
  scopeContains,
  scopeFromEnvelope,
  type SigningAuditRollup,
  type SigningScope,
} from '../core/tenancy';

export interface RollupInput {
  coverageScope: SigningScope;
  envelopes: Iterable<SignerEnvelope>;
}

/** Fold every envelope in `envelopes` that belongs to `coverageScope` (or
 *  any scope it contains) into a single rollup. Envelopes outside the
 *  coverage subtree are silently skipped — callers query the store
 *  scoped correctly, but this guards against accidental over-inclusion. */
export function rollupEnvelopes(input: RollupInput): SigningAuditRollup {
  let rollup = emptyRollup(input.coverageScope, input.coverageScope);
  for (const envelope of input.envelopes) {
    rollup = foldEnvelope(rollup, envelope);
  }
  return rollup;
}

/** Partition envelopes into per-venture rollups — useful when a parent
 *  compliance view wants the breakdown by child venture. Each entry in
 *  the returned map is the rollup for that exact child scope. */
export function rollupByChildVenture(
  coverageScope: SigningScope,
  envelopes: Iterable<SignerEnvelope>,
): Map<string, SigningAuditRollup> {
  const buckets = new Map<string, SigningAuditRollup>();
  for (const envelope of envelopes) {
    const scope = scopeFromEnvelope(envelope);
    if (!scopeContains(coverageScope, scope)) continue;
    const key = scope.childVentureId ?? '_root';
    const existing = buckets.get(key) ?? emptyRollup(scope, scope);
    buckets.set(key, foldEnvelope(existing, envelope));
  }
  return buckets;
}
