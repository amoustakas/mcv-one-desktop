import { describe, it, expect } from 'vitest';
import { TILE_DEFINITIONS, getTileDefinition, getTilesForSuite } from '../definitions';
import { DEFAULT_LOADOUTS } from '../loadouts';

describe('factory tiles', () => {
  it('fct_heartbeat + fct_runs_active exist in registry', () => {
    expect(getTileDefinition('fct_heartbeat')).toBeDefined();
    expect(getTileDefinition('fct_runs_active')).toBeDefined();
  });

  it('both are slotted under operations suite', () => {
    expect(TILE_DEFINITIONS.fct_heartbeat?.suite).toBe('operations');
    expect(TILE_DEFINITIONS.fct_runs_active?.suite).toBe('operations');
  });

  it('fct_heartbeat is in the operations default loadout', () => {
    expect(DEFAULT_LOADOUTS.operations).toContain('fct_heartbeat');
  });

  it('operations loadout still has exactly 6 tiles', () => {
    expect(DEFAULT_LOADOUTS.operations).toHaveLength(6);
  });

  it('fct_heartbeat has accent + formatter + async source', async () => {
    const def = getTileDefinition('fct_heartbeat');
    expect(def).toBeDefined();
    expect(def!.accent).toBeTruthy();
    expect(typeof def!.formatter).toBe('function');
    expect(typeof def!.source).toBe('function');
  });

  it('getTilesForSuite(operations) includes fct_heartbeat', () => {
    const tiles = getTilesForSuite('operations');
    expect(tiles.map((t) => t.id)).toContain('fct_heartbeat');
  });
});
