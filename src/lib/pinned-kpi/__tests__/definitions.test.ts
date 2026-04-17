import { describe, it, expect } from 'vitest';
import { TILE_DEFINITIONS, getTileDefinition, getTilesForSuite } from '../definitions';

describe('pinned-kpi definitions', () => {
  it('exports at least 6 command-center tiles', () => {
    const tiles = getTilesForSuite('command-center');
    expect(tiles.length).toBeGreaterThanOrEqual(6);
    expect(tiles.map((t) => t.id)).toEqual(
      expect.arrayContaining([
        'cc_total_users', 'cc_revenue_mtd', 'cc_mrr',
        'cc_cash_runway', 'cc_active_ventures', 'cc_attention',
      ]),
    );
  });

  it('every definition has suite, label, accent, formatter, source', () => {
    for (const def of Object.values(TILE_DEFINITIONS)) {
      expect(def.suite).toBeDefined();
      expect(def.label).toBeTruthy();
      expect(def.accent).toMatch(/^#|^var\(/);
      expect(typeof def.formatter).toBe('function');
      expect(typeof def.source).toBe('function');
    }
  });

  it('getTileDefinition returns undefined for unknown id', () => {
    expect(getTileDefinition('nonexistent')).toBeUndefined();
  });

  it('every SuiteId has at least 6 tiles defined', () => {
    const bySuite = Object.values(TILE_DEFINITIONS).reduce<Record<string, number>>((acc, t) => {
      acc[t.suite] = (acc[t.suite] ?? 0) + 1;
      return acc;
    }, {});
    for (const suite of ['command-center','capital','growth','payments','crm','creative','engineering','operations','knowledge','comms']) {
      expect(bySuite[suite], `${suite} must have ≥6 tiles`).toBeGreaterThanOrEqual(6);
    }
  });
});
