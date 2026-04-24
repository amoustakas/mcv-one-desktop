import { describe, it, expect } from 'vitest';
import { semanticAdapter } from '../substrates/semantic.js';
import { personalAdapter } from '../substrates/personal.js';
import { episodicAdapter } from '../substrates/episodic.js';
import { proceduralAdapter } from '../substrates/procedural.js';
import { socialAdapter } from '../substrates/social.js';
import { referentialAdapter } from '../substrates/referential.js';
import { longTermAdapter } from '../substrates/long-term.js';
import { SUBSTRATES } from '../types.js';

/**
 * Substrate shape tests — each adapter must:
 *   1. declare its `kind` matching one of the SUBSTRATES constants
 *   2. expose a `recall` function
 *   3. the long-term adapter additionally exposes `observe`
 */

describe('substrate adapters declare correct kind', () => {
  it('semanticAdapter.kind === "semantic"', () => {
    expect(semanticAdapter.kind).toBe('semantic');
    expect(SUBSTRATES).toContain(semanticAdapter.kind);
  });
  it('personalAdapter.kind === "personal"', () => {
    expect(personalAdapter.kind).toBe('personal');
  });
  it('episodicAdapter.kind === "episodic"', () => {
    expect(episodicAdapter.kind).toBe('episodic');
  });
  it('proceduralAdapter.kind === "procedural"', () => {
    expect(proceduralAdapter.kind).toBe('procedural');
  });
  it('socialAdapter.kind === "social"', () => {
    expect(socialAdapter.kind).toBe('social');
  });
  it('referentialAdapter.kind === "referential"', () => {
    expect(referentialAdapter.kind).toBe('referential');
  });
  it('longTermAdapter.kind === "long-term"', () => {
    expect(longTermAdapter.kind).toBe('long-term');
  });
});

describe('all adapters expose recall()', () => {
  const all = [semanticAdapter, personalAdapter, episodicAdapter, proceduralAdapter, socialAdapter, referentialAdapter, longTermAdapter];
  it.each(all)('%o has recall function', (adapter) => {
    expect(typeof adapter.recall).toBe('function');
  });
});

describe('only long-term is writable', () => {
  it('longTermAdapter has observe()', () => {
    expect(typeof longTermAdapter.observe).toBe('function');
  });
  it('semanticAdapter has NO observe()', () => {
    expect('observe' in semanticAdapter).toBe(false);
  });
  it('personalAdapter has NO observe()', () => {
    expect('observe' in personalAdapter).toBe(false);
  });
});

describe('adapters gracefully return [] when required context is missing', () => {
  const stubCtx = { supabase: {} as never, tenantId: 't-1' };

  it('personal.recall returns [] when userId missing', async () => {
    const out = await personalAdapter.recall({ query: 'anything' }, null, stubCtx);
    expect(out).toEqual([]);
  });

  it('procedural.recall returns [] when userId missing', async () => {
    const out = await proceduralAdapter.recall({ query: 'anything' }, null, stubCtx);
    expect(out).toEqual([]);
  });

  it('social.recall returns [] when agentHandle missing', async () => {
    const out = await socialAdapter.recall({ query: 'anything' }, null, stubCtx);
    expect(out).toEqual([]);
  });

  it('referential.recall returns [] when no correlationId filter', async () => {
    const out = await referentialAdapter.recall({ query: 'anything' }, null, stubCtx);
    expect(out).toEqual([]);
  });

  it('semantic.recall returns [] when embedding is null', async () => {
    const out = await semanticAdapter.recall({ query: 'anything' }, null, stubCtx);
    expect(out).toEqual([]);
  });

  it('long-term.recall returns [] when embedding is null', async () => {
    const out = await longTermAdapter.recall({ query: 'anything' }, null, stubCtx);
    expect(out).toEqual([]);
  });
});
