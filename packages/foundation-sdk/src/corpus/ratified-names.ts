// @mcv/foundation-sdk/corpus/ratified-names — LOCKED. Do not extend without Tony's sign-off.
//
// The 6 deprecated → ratified naming migrations locked per IP Inventory v1.1 §0.1.
// These are the ONLY naming changes that the NamingRatificationBoard enforces.
//
// Source of truth: this file (matches the DB seed in migration-foundation-os-v1-2026-04-22.sql).
// Divergence between this file and the DB is a bug — the inline SQL seed above MUST match.

export type NamingContextKind = 'prose' | 'identifier' | 'any';

export interface RatifiedNameEntry {
  /** Old term as written in source docs (case-sensitive for identifier contexts). */
  deprecatedName: string;
  /** The new canonical term. */
  ratifiedName: string;
  /** Which occurrence contexts this rule applies to.
   *  - 'prose' only: safe to rewrite in markdown/UI copy, leave code identifiers alone.
   *  - 'identifier' only: code identifier renames (rare — we usually prefer prose-only).
   *  - 'any': rewrite everywhere the scanner finds it. */
  context: NamingContextKind;
  /** Why this ratification exists — drives tooltip copy in NamingRatificationBoard. */
  rationale: string;
}

/** The canonical ratification set. Iteration order matches the ratification cards in the UI. */
export const RATIFIED_NAMES: readonly RatifiedNameEntry[] = [
  {
    deprecatedName: 'Sovereign Citizen',
    ratifiedName: 'Citizen',
    context: 'any',
    rationale:
      'Brand-risk kill — institutional LPs pattern-match "Sovereign Citizen" to the legal-extremist movement. ' +
      'Must be scrubbed from every external-facing doc before Blue Marlin / Gary / Joel see it. IP Inventory §9.3.',
  },
  {
    deprecatedName: 'Covenant',
    ratifiedName: 'Root',
    context: 'any',
    rationale: 'Layer 0 Purpose Trust naming per IP Inventory v1.1 §0.1. "Root" names the IP-holding trust.',
  },
  {
    deprecatedName: 'Confluence',
    ratifiedName: 'Weave',
    context: 'any',
    rationale: 'Naming ratification per IP Inventory v1.1 §0.1. "Weave" is the distinctive compound replacement.',
  },
  {
    deprecatedName: 'Whole',
    ratifiedName: 'Chorus',
    context: 'any',
    rationale: 'Naming ratification per IP Inventory v1.1 §0.1.',
  },
  {
    deprecatedName: 'Unhoused',
    ratifiedName: 'Unsworn',
    context: 'any',
    rationale:
      'Naming ratification per IP Inventory v1.1 §0.1. "Unsworn" is more distinctive in civic/gaming context ' +
      'than "Unhoused" (which has real-world homelessness-advocacy overload).',
  },
  {
    deprecatedName: 'ATLAS',
    ratifiedName: 'MCV Atlas',
    context: 'prose',
    rationale:
      'Compound filing strategy per IP Inventory §1.5 — standalone ATLAS faces massive prior art (CERN, MongoDB, ' +
      'IBM, Palantir). Only rewrite prose occurrences; agent-id "atlas" and existing TS identifiers like ' +
      'AtlasAgent stay as-is (identifier-context rewrites would break imports).',
  },
] as const;

/** Fast lookup by deprecated name. Matches are case-sensitive — the scanner decides whether
 *  to fold case based on occurrence kind. */
export const RATIFIED_NAMES_BY_DEPRECATED: Readonly<Record<string, RatifiedNameEntry>> =
  Object.freeze(
    Object.fromEntries(RATIFIED_NAMES.map((entry) => [entry.deprecatedName, entry]))
  );

/** Reverse lookup — which deprecated terms mapped to a given ratified name.
 *  In practice always one-to-one but typed as array for defensive composition. */
export const DEPRECATED_FOR_RATIFIED: Readonly<Record<string, readonly RatifiedNameEntry[]>> =
  Object.freeze(
    RATIFIED_NAMES.reduce<Record<string, RatifiedNameEntry[]>>((acc, entry) => {
      (acc[entry.ratifiedName] ??= []).push(entry);
      return acc;
    }, {})
  );

/** Classification defaults by occurrence kind — drives the auto-approve safety ladder.
 *  Rows default to these and can be manually overridden per-row in the board. */
export const CLASSIFICATION_DEFAULTS = Object.freeze({
  markdown_prose: 'safe',
  code_comment: 'safe',
  ui_copy: 'safe',
  string_literal: 'ambiguous',
  identifier: 'unsafe',
  import_path: 'unsafe',
  type_name: 'unsafe',
  test_name: 'unsafe',
} as const);
export type OccurrenceKindKey = keyof typeof CLASSIFICATION_DEFAULTS;
