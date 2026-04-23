import { describe, it, expect } from 'vitest';
import { DEFAULT_LOADOUTS } from '../loadouts';
import { TILE_DEFINITIONS } from '../definitions';
import { SUITE_IDS } from '../types';

describe('default loadouts', () => {
  it('provides a loadout for every SuiteId', () => {
    for (const suite of SUITE_IDS) {
      expect(DEFAULT_LOADOUTS[suite], `missing loadout for ${suite}`).toBeDefined();
      // Foundation has no tile sources yet (the suite surfaces per-panel data
      // directly rather than via KPI strip). Every other suite carries the
      // canonical 6-tile preset.
      if (suite !== 'foundation') {
        expect(DEFAULT_LOADOUTS[suite].length).toBe(6);
      }
    }
  });

  it('every KpiId in a loadout resolves to a TileDefinition with matching suite', () => {
    for (const [suite, tileIds] of Object.entries(DEFAULT_LOADOUTS)) {
      for (const id of tileIds) {
        const def = TILE_DEFINITIONS[id];
        expect(def, `${id} in ${suite} loadout has no definition`).toBeDefined();
        expect(def.suite).toBe(suite);
      }
    }
  });
});
