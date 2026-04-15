// Capital × OFAC — LegacyAdapter scaffold (inbound compliance).
// Epic 13 Story 6. First non-payment adapter; proves the
// CapitalComplianceEvent shape introduced in types.ts.
//
// What it does: given a (name, optional DOB) pair for an investor
// contact, performs a fuzzy match against the US Treasury OFAC SDN
// (Specially Designated Nationals) list and emits a
// CapitalComplianceEvent. Downstream compliance-reconcile stamps the
// result on capital_investor_profile.metadata.compliance.ofac.
//
// This PR ships the pure matcher + a small curated seed list for
// testing. A follow-up PR will add:
//   - supabase.ofac_sdn_entries table + nightly cron that pulls
//     https://www.treasury.gov/ofac/downloads/sdn.csv
//   - Fuzzy match via Postgres pg_trgm at DB scale
//   - Commit-creation gate (blocks when outcome='match')
//
// Until that lands, screeners call screenOfac({ name, dob }, seed)
// with either the bundled demo seed or their own test fixture.
//
// Seam design: the matcher accepts an injectable SDN list so tests,
// demos, and future production paths can all share the same scoring
// logic. The adapter's `fromForeign` takes an OfacQuery (our local
// query shape — this is not a true "foreign event", more of a pull).
// We keep the LegacyAdapter wrapper so this adapter appears alongside
// Plaid and Stripe in listings and so the evolution story to the full
// INTEROP.md contract stays uniform.

import type { LegacyAdapter, CapitalComplianceEvent } from './types';

/** Pull-style query for the OFAC adapter. Not a webhook event — the
 *  caller (Capital action, scheduled screener) constructs it.  */
export interface OfacQuery {
  contactId: string;
  name: string;                  // full legal name
  dob?: string;                  // ISO date
  /** Optional pre-computed country / additional identifiers for future
   *  stronger-than-name matching. Unused today; reserved. */
  country?: string;
  nationalIds?: string[];
}

/** One row in the SDN list as stored locally. Matches the columns we'd
 *  persist in the eventual ofac_sdn_entries table. */
export interface SdnEntry {
  id: string;                    // stable vendor id (ent_num in OFAC CSV)
  primaryName: string;
  aliases?: string[];
  dob?: string;                  // ISO if DOB known
  country?: string;
  list: 'SDN' | 'ConsolidatedSanctions';
  programs: string[];            // e.g. ['CUBA', 'IRAN', 'NARCOTICS']
}

export interface OfacAdapterOptions {
  /** Injected SDN entries to score against. In production this will be
   *  supplied by the scheduled screener from the ofac_sdn_entries
   *  table; in tests, use bundled fixtures. */
  sdnEntries: SdnEntry[];
  /** Match threshold (0-1). Default 0.85 — chosen so common first-name
   *  matches don't trigger, but full-name high-similarity matches do. */
  threshold?: number;
  /** Require DOB match (when both sides have one) for a 'match'
   *  outcome. Defaults to true — a name-only collision downgrades to
   *  'review' rather than a hard block. */
  requireDobWhenPresent?: boolean;
}

/** Normalize a name for comparison: lowercase, strip diacritics,
 *  collapse whitespace. Keeps the algorithm dependency-free. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    // Strip combining diacritical marks (U+0300-U+036F). Character
    // class — a bare range like \u0300-\u036f matches the literal
    // substring, not the range.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Dice coefficient over bigrams — favors multi-word name overlap and
 *  handles transposition better than Levenshtein for names. Not as
 *  good as Jaro-Winkler at abbreviations, but Jaro-Winkler costs
 *  another dependency for marginal gain at this threshold. */
export function nameSimilarity(a: string, b: string): number {
  const A = normalize(a);
  const B = normalize(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  const bigrams = (s: string): Map<string, number> => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      if (g.trim().length < 2) continue;
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const aG = bigrams(A);
  const bG = bigrams(B);
  let matches = 0;
  for (const [g, count] of aG) {
    const other = bG.get(g);
    if (!other) continue;
    matches += Math.min(count, other);
  }
  const totalA = [...aG.values()].reduce((s, n) => s + n, 0);
  const totalB = [...bG.values()].reduce((s, n) => s + n, 0);
  if (totalA + totalB === 0) return 0;
  return (2 * matches) / (totalA + totalB);
}

/** Pure screening function. Exported for direct use when the full
 *  LegacyAdapter wrapper isn't needed (e.g. gate logic, batch jobs). */
export function screenOfac(
  query: OfacQuery,
  opts: OfacAdapterOptions,
): CapitalComplianceEvent {
  const threshold = opts.threshold ?? 0.85;
  const requireDob = opts.requireDobWhenPresent ?? true;

  let bestScore = 0;
  let bestEntry: SdnEntry | null = null;
  let alternates = 0;

  for (const entry of opts.sdnEntries) {
    // Score against primary name + every alias, take the max for this
    // entry. Aliases of the same entity shouldn't double-count the
    // entry as two candidates.
    const candidates = [entry.primaryName, ...(entry.aliases ?? [])];
    let entryBest = 0;
    for (const name of candidates) {
      const s = nameSimilarity(query.name, name);
      if (s > entryBest) entryBest = s;
    }

    if (entryBest > 0.5 && entryBest < threshold) alternates++;
    if (entryBest > bestScore) {
      bestScore = entryBest;
      bestEntry = entry;
    }
  }

  // Outcome logic: clear < 0.5 · review < threshold · match >= threshold,
  // with the DOB guard downgrading name-only strong matches to 'review'.
  let outcome: CapitalComplianceEvent['outcome'] = 'clear';
  if (bestScore >= threshold) {
    outcome = 'match';
    if (requireDob && query.dob && bestEntry?.dob && query.dob !== bestEntry.dob) {
      outcome = 'review';
    }
  } else if (bestScore >= 0.75) {
    outcome = 'review';
  }

  return {
    contactId: query.contactId,
    outcome,
    score: bestScore,
    source: 'ofac',
    matchedRecord: outcome === 'clear' ? undefined : bestEntry ? {
      name: bestEntry.primaryName,
      dob: bestEntry.dob,
      list: bestEntry.list,
      programs: bestEntry.programs,
      sourceEntryId: bestEntry.id,
    } : undefined,
    screenedAt: new Date().toISOString(),
    rawEvent: { query, bestEntry },
    matchDiagnostics: {
      strategy: 'ofac-fuzzy-name+dob',
      threshold,
      alternates,
    },
  };
}

export function createOfacAdapter(
  opts: OfacAdapterOptions,
): LegacyAdapter<OfacQuery, CapitalComplianceEvent> {
  return {
    id: 'ofac',
    async fromForeign(query) {
      if (!query.name || !query.contactId) return null;
      return screenOfac(query, opts);
    },
    // No toForeign — OFAC is observer-only; we don't push data back.
  };
}
