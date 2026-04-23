import { describe, it, expect } from 'vitest';
import type { TileDefinition } from '../types';
import { SUITE_IDS } from '../types';

describe('pinned-kpi types', () => {
  it('exports the canonical 11 SuiteId values', () => {
    expect(SUITE_IDS).toEqual([
      'command-center',
      'capital', 'growth', 'payments', 'crm',
      'creative', 'engineering', 'operations', 'knowledge', 'comms',
      'foundation',
    ]);
  });

  it('TileDefinition shape requires id, label, suite, accent, formatter', () => {
    const def: TileDefinition = {
      id: 'test_tile',
      suite: 'capital',
      label: 'Test',
      accent: '#00F5FF',
      source: async () => ({ value: 42 }),
      formatter: (v) => String(v),
    };
    expect(def.id).toBe('test_tile');
  });
});
