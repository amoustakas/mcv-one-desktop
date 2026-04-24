import { describe, it, expect } from 'vitest';
import { ACCEPTED_OBSERVE_KINDS, SubstrateRejectedError, type ObserveKind } from '../types.js';

/**
 * Phase-1 routing discipline — observe() kind → substrate.
 *
 * Accepted: fact, preference, constraint, decision, chunk, interaction,
 *           emotional_shift, relationship_update.
 * Rejected: connection_fact (oauth stays outside Router), document (M6).
 */

describe('observe kind acceptance', () => {
  const accepted: ObserveKind[] = [
    'fact', 'preference', 'constraint', 'decision',
    'chunk', 'interaction', 'emotional_shift', 'relationship_update',
  ];
  const rejected: ObserveKind[] = ['connection_fact', 'document'];

  it.each(accepted)('accepts kind=%s', (kind) => {
    expect(ACCEPTED_OBSERVE_KINDS.has(kind)).toBe(true);
  });

  it.each(rejected)('rejects kind=%s', (kind) => {
    expect(ACCEPTED_OBSERVE_KINDS.has(kind)).toBe(false);
  });

  it('SubstrateRejectedError shape is stable', () => {
    const err = new SubstrateRejectedError('connection_fact');
    expect(err.code).toBe('E_SUBSTRATE_REJECTED');
    expect(err.name).toBe('SubstrateRejectedError');
    expect(err.message).toContain('connection_fact');
  });
});

describe('default recall layers include text-first substrates', () => {
  it('semantic + personal + episodic are the default', async () => {
    const mod = await import('../index.js');
    expect(mod.DEFAULT_RECALL_LAYERS).toEqual(['semantic', 'personal', 'episodic']);
  });
});
