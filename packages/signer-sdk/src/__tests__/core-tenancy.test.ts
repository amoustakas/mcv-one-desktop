import { describe, it, expect } from 'vitest';
import {
  scopeKey,
  scopeFromKey,
  scopesEqual,
  scopeContains,
  emptyRollup,
  foldEnvelope,
  type SigningScope,
} from '../core/tenancy';
import type { SignerEnvelope } from '../core/types';

const mkEnvelope = (overrides: Partial<SignerEnvelope> = {}): SignerEnvelope => ({
  publicId: 'e1',
  tenantId: 't1',
  parentVentureId: 'mcv',
  envelopeVersion: 1,
  documents: [],
  signer: { name: 'A', email: 'a@mcv.one' },
  status: 'issued',
  issuedAt: '2026-04-24T00:00:00.000Z',
  expiresAt: '2026-05-24T00:00:00.000Z',
  audit: { issuedAt: '2026-04-24T00:00:00.000Z', issuedBy: 'system:test' },
  ...overrides,
});

describe('scopeKey round-trip', () => {
  it('serialises then parses parent-only scope', () => {
    const s: SigningScope = { tenantId: 't1', parentVentureId: 'mcv' };
    const k = scopeKey(s);
    expect(k).toBe('tenant/t1/venture/mcv');
    expect(scopeFromKey(k)).toEqual(s);
  });

  it('serialises then parses parent+child scope', () => {
    const s: SigningScope = { tenantId: 't1', parentVentureId: 'mcv', childVentureId: 'futurestate' };
    const k = scopeKey(s);
    expect(k).toBe('tenant/t1/venture/mcv:futurestate');
    expect(scopeFromKey(k)).toEqual(s);
  });

  it('returns null for malformed keys', () => {
    expect(scopeFromKey('not a key')).toBeNull();
    expect(scopeFromKey('tenant//venture/mcv')).toBeNull();
  });
});

describe('scopesEqual', () => {
  it('treats undefined childVentureId as null-equal', () => {
    const a: SigningScope = { tenantId: 't1', parentVentureId: 'mcv' };
    const b: SigningScope = { tenantId: 't1', parentVentureId: 'mcv', childVentureId: undefined };
    expect(scopesEqual(a, b)).toBe(true);
  });

  it('distinguishes different child ventures', () => {
    const a: SigningScope = { tenantId: 't1', parentVentureId: 'mcv', childVentureId: 'fs' };
    const b: SigningScope = { tenantId: 't1', parentVentureId: 'mcv', childVentureId: 'we' };
    expect(scopesEqual(a, b)).toBe(false);
  });
});

describe('scopeContains', () => {
  it('parent with no childVentureId contains all children', () => {
    const parent: SigningScope = { tenantId: 't1', parentVentureId: 'mcv' };
    const child: SigningScope = { tenantId: 't1', parentVentureId: 'mcv', childVentureId: 'fs' };
    expect(scopeContains(parent, child)).toBe(true);
  });

  it('child scope only contains itself', () => {
    const child: SigningScope = { tenantId: 't1', parentVentureId: 'mcv', childVentureId: 'fs' };
    const other: SigningScope = { tenantId: 't1', parentVentureId: 'mcv', childVentureId: 'we' };
    expect(scopeContains(child, child)).toBe(true);
    expect(scopeContains(child, other)).toBe(false);
  });

  it('never crosses tenants', () => {
    const parent: SigningScope = { tenantId: 't1', parentVentureId: 'mcv' };
    const other: SigningScope = { tenantId: 't2', parentVentureId: 'mcv' };
    expect(scopeContains(parent, other)).toBe(false);
  });
});

describe('rollup folding', () => {
  it('counts statuses across a parent scope', () => {
    const coverage: SigningScope = { tenantId: 't1', parentVentureId: 'mcv' };
    let rollup = emptyRollup(coverage);
    rollup = foldEnvelope(rollup, mkEnvelope({ status: 'issued' }));
    rollup = foldEnvelope(rollup, mkEnvelope({ publicId: 'e2', status: 'signed' }));
    rollup = foldEnvelope(rollup, mkEnvelope({ publicId: 'e3', status: 'signed', childVentureId: 'fs' }));
    expect(rollup.totalEnvelopes).toBe(3);
    expect(rollup.counts.issued).toBe(1);
    expect(rollup.counts.signed).toBe(2);
  });

  it('skips envelopes outside the coverage subtree', () => {
    const coverage: SigningScope = { tenantId: 't1', parentVentureId: 'mcv', childVentureId: 'fs' };
    let rollup = emptyRollup(coverage);
    rollup = foldEnvelope(rollup, mkEnvelope({ childVentureId: 'fs', status: 'issued' }));
    rollup = foldEnvelope(rollup, mkEnvelope({ publicId: 'e2', childVentureId: 'we', status: 'issued' }));
    expect(rollup.totalEnvelopes).toBe(1);
  });
});
