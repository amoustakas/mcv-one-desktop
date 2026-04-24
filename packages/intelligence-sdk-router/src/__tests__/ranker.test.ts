import { describe, it, expect } from 'vitest';
import {
  applyRrf,
  rerank,
  recencyScore,
  compositeScore,
  RRF_K,
  COMPOSITE_WEIGHTS,
  RECENCY_HALF_LIFE_DAYS,
} from '../ranker.js';
import type { RecallHit, SubstrateKind } from '../types.js';

function hit(id: string, substrate: SubstrateKind, similarity = 0.8, confidence = 0.8): RecallHit {
  return {
    id, substrate, content: `content:${id}`,
    similarity, recencyScore: 0.5, confidence,
    provenance: { source: `src:${id}`, driver: substrate },
    metadata: {},
  };
}

describe('ranker.recencyScore', () => {
  it('returns 1.0 for now', () => {
    const now = new Date('2026-04-23T00:00:00Z');
    expect(recencyScore(now.toISOString(), now)).toBeCloseTo(1, 6);
  });

  it('returns 0.5 at half-life', () => {
    const now = new Date('2026-04-23T00:00:00Z');
    const past = new Date(now.getTime() - RECENCY_HALF_LIFE_DAYS * 24 * 60 * 60 * 1000);
    expect(recencyScore(past.toISOString(), now)).toBeCloseTo(0.5, 4);
  });

  it('returns 0.25 at 2x half-life', () => {
    const now = new Date('2026-04-23T00:00:00Z');
    const past = new Date(now.getTime() - 2 * RECENCY_HALF_LIFE_DAYS * 24 * 60 * 60 * 1000);
    expect(recencyScore(past.toISOString(), now)).toBeCloseTo(0.25, 4);
  });

  it('clamps future timestamps to 1.0', () => {
    const now = new Date('2026-04-23T00:00:00Z');
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    expect(recencyScore(future.toISOString(), now)).toBe(1);
  });

  it('returns 0 on invalid input', () => {
    expect(recencyScore('not-a-date')).toBe(0);
  });
});

describe('ranker.applyRrf', () => {
  it('sums 1/(k+r) across lists a hit appears in', () => {
    const a = hit('h1', 'semantic');
    const scores = applyRrf({ semantic: [a] });
    expect(scores.get('h1')).toBeCloseTo(1 / (RRF_K + 1), 6);
  });

  it('a hit in two lists accumulates both contributions', () => {
    const a = hit('h1', 'semantic');
    const b = hit('h1', 'long-term');
    const scores = applyRrf({ semantic: [a], 'long-term': [b] });
    const expected = 1 / (RRF_K + 1) + 1 / (RRF_K + 1);
    expect(scores.get('h1')).toBeCloseTo(expected, 6);
  });

  it('rank 2 has lower contribution than rank 1', () => {
    const a1 = hit('a', 'semantic');
    const a2 = hit('b', 'semantic');
    const scores = applyRrf({ semantic: [a1, a2] });
    expect(scores.get('a')).toBeGreaterThan(scores.get('b')!);
  });

  it('returns empty map for empty input', () => {
    expect(applyRrf({}).size).toBe(0);
  });
});

describe('ranker.compositeScore weights', () => {
  it('weights sum to 1', () => {
    const sum = COMPOSITE_WEIGHTS.rrf + COMPOSITE_WEIGHTS.similarity + COMPOSITE_WEIGHTS.recency + COMPOSITE_WEIGHTS.confidence;
    expect(sum).toBeCloseTo(1, 10);
  });

  it('correctly computes weighted sum', () => {
    const s = compositeScore({ normalizedRrf: 1, similarity: 1, recency: 1, confidence: 1 });
    expect(s).toBeCloseTo(1, 10);
  });

  it('zero inputs give zero score', () => {
    const s = compositeScore({ normalizedRrf: 0, similarity: 0, recency: 0, confidence: 0 });
    expect(s).toBe(0);
  });
});

describe('ranker.rerank', () => {
  it('a cross-substrate duplicate scores higher than a single-list hit', () => {
    const shared = hit('shared', 'semantic', 0.9, 0.9);
    const sharedDup = hit('shared', 'long-term', 0.85, 0.9);
    const unique = hit('solo', 'semantic', 0.95, 0.9);
    const out = rerank({ semantic: [shared, unique], 'long-term': [sharedDup] });
    const sharedOut = out.find((h) => h.id === 'shared');
    const soloOut = out.find((h) => h.id === 'solo');
    expect(sharedOut).toBeDefined();
    expect(soloOut).toBeDefined();
    // shared appears in 2 lists at rank 1 → higher RRF → higher composite
    expect(sharedOut!.compositeScore!).toBeGreaterThan(soloOut!.compositeScore!);
  });

  it('stable ordering: returns hits sorted by compositeScore DESC', () => {
    const hits = ['a', 'b', 'c', 'd'].map((id, i) => hit(id, 'semantic', 0.9 - i * 0.1));
    const out = rerank({ semantic: hits });
    for (let i = 1; i < out.length; i++) {
      expect(out[i - 1].compositeScore!).toBeGreaterThanOrEqual(out[i].compositeScore!);
    }
  });

  it('empty input returns empty output', () => {
    expect(rerank({})).toEqual([]);
  });

  it('deduplicates by id, keeping canonical per substrate priority', () => {
    const s = hit('x', 'semantic');
    const lt = hit('x', 'long-term');
    const ep = hit('x', 'episodic');
    const out = rerank({ semantic: [s], 'long-term': [lt], episodic: [ep] });
    expect(out.length).toBe(1);
    // semantic wins priority per SUBSTRATE_PRIORITY[0]
    expect(out[0].substrate).toBe('semantic');
  });
});
