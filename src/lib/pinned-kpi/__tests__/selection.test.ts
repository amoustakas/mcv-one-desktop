import { describe, it, expect } from 'vitest';
import { selectSuiteTiles } from '../selection';
import { DEFAULT_LOADOUTS } from '../loadouts';

describe('selectSuiteTiles', () => {
  it('returns the default loadout for a suite when no custom list provided', () => {
    expect(selectSuiteTiles('capital')).toEqual(DEFAULT_LOADOUTS.capital);
  });

  it('returns the default loadout when custom list is empty', () => {
    expect(selectSuiteTiles('capital', [])).toEqual(DEFAULT_LOADOUTS.capital);
  });

  it('uses the custom list when non-empty', () => {
    expect(selectSuiteTiles('capital', ['cap_portfolio_nav'])).toEqual(['cap_portfolio_nav']);
  });

  it('preserves custom order (no implicit dedup/reorder)', () => {
    const custom = ['cap_open_rounds','cap_portfolio_nav','cap_commits_inflight'] as const;
    expect(selectSuiteTiles('capital', [...custom])).toEqual(custom);
  });

  it('covers every SuiteId in DEFAULT_LOADOUTS', () => {
    const suites: Array<Parameters<typeof selectSuiteTiles>[0]> = [
      'command-center','capital','growth','payments','crm',
      'creative','engineering','operations','knowledge','comms',
    ];
    for (const s of suites) {
      expect(selectSuiteTiles(s).length).toBe(6);
    }
  });
});
