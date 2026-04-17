import { describe, it, expect, beforeEach } from 'vitest';

// Minimal localStorage shim for node test environment (zustand persist expects it).
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

import { useCommandCenter } from '../command-center';

describe('command-center store · pinnedKpis', () => {
  beforeEach(() => {
    localStorage.clear();
    useCommandCenter.setState({ pinnedKpis: {} });
  });

  it('setSuiteTiles replaces the loadout for a suite', () => {
    useCommandCenter.getState().setSuiteTiles('capital', ['cap_portfolio_nav', 'cap_open_rounds']);
    expect(useCommandCenter.getState().pinnedKpis.capital).toEqual(['cap_portfolio_nav', 'cap_open_rounds']);
  });

  it('addSuiteTile appends if not present', () => {
    useCommandCenter.getState().setSuiteTiles('capital', ['cap_portfolio_nav']);
    useCommandCenter.getState().addSuiteTile('capital', 'cap_open_rounds');
    expect(useCommandCenter.getState().pinnedKpis.capital).toEqual(['cap_portfolio_nav', 'cap_open_rounds']);
  });

  it('addSuiteTile is idempotent', () => {
    useCommandCenter.getState().setSuiteTiles('capital', ['cap_portfolio_nav']);
    useCommandCenter.getState().addSuiteTile('capital', 'cap_portfolio_nav');
    expect(useCommandCenter.getState().pinnedKpis.capital).toEqual(['cap_portfolio_nav']);
  });

  it('removeSuiteTile drops the id', () => {
    useCommandCenter.getState().setSuiteTiles('capital', ['cap_portfolio_nav', 'cap_open_rounds']);
    useCommandCenter.getState().removeSuiteTile('capital', 'cap_portfolio_nav');
    expect(useCommandCenter.getState().pinnedKpis.capital).toEqual(['cap_open_rounds']);
  });

  it('reorderSuiteTile moves within the array', () => {
    useCommandCenter.getState().setSuiteTiles('capital', ['a', 'b', 'c']);
    useCommandCenter.getState().reorderSuiteTile('capital', 0, 2);
    expect(useCommandCenter.getState().pinnedKpis.capital).toEqual(['b', 'c', 'a']);
  });
});
