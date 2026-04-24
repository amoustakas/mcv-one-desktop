/**
 * Ranker — Reciprocal Rank Fusion + composite re-rank.
 *
 * Spec (Plan §1.2):
 *   1. Fan-out per-substrate recall returns RecallHit[] sorted by
 *      that substrate's native score (similarity / recency / match).
 *   2. RRF fusion with k=60 (Cormack & Clarke canonical).
 *   3. Composite re-rank:
 *        0.50 · rrfScore
 *      + 0.25 · similarity
 *      + 0.15 · recencyScore
 *      + 0.10 · confidence
 *   4. Stable sort by compositeScore DESC, break ties by substrate
 *      order for deterministic-replay friendliness.
 */

import type { RecallHit, SubstrateKind } from './types.js';

export const RRF_K = 60;

export const COMPOSITE_WEIGHTS = {
  rrf: 0.5,
  similarity: 0.25,
  recency: 0.15,
  confidence: 0.1,
} as const;

/** Recency half-life in days. 30 days ≈ 0.5 score. */
export const RECENCY_HALF_LIFE_DAYS = 30;

/**
 * Compute per-hit recency score from an ISO timestamp.
 * score = 2^(-age_days / half_life)
 * now  → 1.0;  30d → 0.5;  60d → 0.25;  90d → 0.125
 */
export function recencyScore(isoTimestamp: string, now: Date = new Date()): number {
  const t = Date.parse(isoTimestamp);
  if (!Number.isFinite(t)) return 0;
  const ageDays = Math.max(0, (now.getTime() - t) / (1000 * 60 * 60 * 24));
  return Math.pow(2, -ageDays / RECENCY_HALF_LIFE_DAYS);
}

/**
 * Reciprocal Rank Fusion over per-substrate ranked lists.
 * Each list is ALREADY sorted by that substrate's native score.
 *
 * For a hit h appearing at rank r (1-based) in list L:
 *   rrf_contribution(h, L) = 1 / (k + r)
 *
 * Final rrfScore for h is the SUM across all lists it appears in.
 */
export function applyRrf(
  perLayer: Partial<Record<SubstrateKind, RecallHit[]>>,
  k: number = RRF_K
): Map<string, number> {
  const scores = new Map<string, number>();
  for (const layerHits of Object.values(perLayer)) {
    if (!layerHits) continue;
    layerHits.forEach((hit, idx) => {
      const rank = idx + 1;
      const contribution = 1 / (k + rank);
      scores.set(hit.id, (scores.get(hit.id) ?? 0) + contribution);
    });
  }
  return scores;
}

/**
 * Compute composite score for a single hit given its RRF score.
 *   0.50·rrf + 0.25·similarity + 0.15·recency + 0.10·confidence
 *
 * All inputs expected in [0, 1]. Output is also in [0, 1] given
 * weighted-convex combination — but note that RRF scores are NOT
 * naturally in [0, 1] (they're 1/(k+r) summed), so we normalize
 * RRF by max-observed inside `rerank()` before plugging in here.
 */
export function compositeScore(args: {
  normalizedRrf: number;
  similarity: number;
  recency: number;
  confidence: number;
}): number {
  const { normalizedRrf, similarity, recency, confidence } = args;
  return (
    COMPOSITE_WEIGHTS.rrf * normalizedRrf +
    COMPOSITE_WEIGHTS.similarity * similarity +
    COMPOSITE_WEIGHTS.recency * recency +
    COMPOSITE_WEIGHTS.confidence * confidence
  );
}

/**
 * Full pipeline: per-substrate hits → fused + re-ranked list.
 *
 * Deduplicates by hit.id, keeping the representation from the
 * highest-weighted-substrate occurrence (by `substrateWeight`
 * order — semantic > long-term > episodic > personal > social >
 * referential > procedural, matching typical relevance for
 * general agent recall).
 */
export function rerank(
  perLayer: Partial<Record<SubstrateKind, RecallHit[]>>,
  opts?: { k?: number; now?: Date }
): RecallHit[] {
  const k = opts?.k ?? RRF_K;
  const now = opts?.now ?? new Date();
  const rrfScores = applyRrf(perLayer, k);
  if (rrfScores.size === 0) return [];
  const maxRrf = Math.max(...rrfScores.values());

  // Deduplicate by id, keeping the hit with the richest substrate
  // (per substrateWeight) as the canonical representation.
  const canonical = new Map<string, RecallHit>();
  for (const layerKind of SUBSTRATE_PRIORITY) {
    const hits = perLayer[layerKind];
    if (!hits) continue;
    for (const hit of hits) {
      if (!canonical.has(hit.id)) {
        canonical.set(hit.id, hit);
      }
    }
  }

  const rescored: RecallHit[] = [];
  for (const hit of canonical.values()) {
    const rrfRaw = rrfScores.get(hit.id) ?? 0;
    const normalizedRrf = maxRrf > 0 ? rrfRaw / maxRrf : 0;
    const recency = hit.recencyScore > 0 ? hit.recencyScore : recencyScore(
      typeof hit.metadata?.createdAt === 'string' ? hit.metadata.createdAt : now.toISOString(),
      now
    );
    const composite = compositeScore({
      normalizedRrf,
      similarity: clamp01(hit.similarity),
      recency: clamp01(recency),
      confidence: clamp01(hit.confidence),
    });
    rescored.push({
      ...hit,
      rrfScore: rrfRaw,
      recencyScore: recency,
      compositeScore: composite,
    });
  }

  // Stable sort DESC by composite; break ties by substrate priority
  // then id for deterministic-replay friendliness.
  rescored.sort((a, b) => {
    const diff = (b.compositeScore ?? 0) - (a.compositeScore ?? 0);
    if (Math.abs(diff) > 1e-9) return diff;
    const sa = SUBSTRATE_PRIORITY.indexOf(a.substrate);
    const sb = SUBSTRATE_PRIORITY.indexOf(b.substrate);
    if (sa !== sb) return sa - sb;
    return a.id.localeCompare(b.id);
  });

  return rescored;
}

/** Substrate priority for dedup + tie-breaking. Higher index = lower priority. */
export const SUBSTRATE_PRIORITY: readonly SubstrateKind[] = [
  'semantic',
  'long-term',
  'episodic',
  'personal',
  'social',
  'referential',
  'procedural',
] as const;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
