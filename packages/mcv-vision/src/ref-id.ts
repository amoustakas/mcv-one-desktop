/**
 * @mcv/vision — Ref-id minting (API contract, frozen at v0.1).
 *
 * Computes the deterministic, reload-stable handle that every action
 * targets. The hash inputs are the four contract fields:
 *
 *     role + accessibleName + ancestorRoles[] + originOrdinal
 *
 * Output: 16-char (64-bit) lowercase-hex prefix of SHA-256.
 *
 * **DO NOT EVOLVE IN PLACE.** Changing the algorithm or input shape
 * breaks every persisted action audit trail in the broker SQLite.
 * If the algorithm needs to change, bump `@mcv/vision` major and add
 * a v2 minter alongside this one — never silently mutate v1 output.
 */

import { createHash } from 'node:crypto';

export interface RefIdInputs {
  /** Action-relevant ARIA role (see types.AxRole). */
  role: string;
  /** Accessible name resolved per W3C AccName algorithm. */
  name: string;
  /** Ancestor roles from the element upward, truncated to 8. */
  ancestorRoles: readonly string[];
  /** 0-based order among siblings of the same role under the same parent. */
  originOrdinal: number;
}

/**
 * Mint the canonical Ref.id for an actionable AX node.
 *
 * Implementation note: we JSON-serialize the inputs as a tuple and
 * hash the bytes. JSON unambiguously escapes any control chars,
 * delimiters, or unicode in `name`, so two distinct input tuples can
 * never collide on serialization. SHA-256 truncated to 16 hex chars
 * gives 64 bits — vanishing collision probability for single-page
 * snapshots, and still tractable for human eyeballing in audit logs.
 */
export function makeRefId(input: RefIdInputs): string {
  const canonical = JSON.stringify([
    input.role,
    input.name,
    [...input.ancestorRoles],
    input.originOrdinal,
  ]);
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}
