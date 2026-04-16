import { describe, it, expect } from 'vitest';
import { computeRoyaltyLegs } from '../royalty-walker';
import type { RoyaltyGraph, RoyaltyGraphLayer } from '../foundation-types';

const graph: RoyaltyGraph = {
  id: 'g_1', ventureId: 'futurestate', label: 'Futurestate v1', version: 1,
  effectiveAt: '2026-01-01', supersededAt: null, metadata: {}, createdAt: '2026-01-01',
};

function layer(overrides: Partial<RoyaltyGraphLayer>): RoyaltyGraphLayer {
  return {
    id: 'l_' + Math.random().toString(36).slice(2, 8),
    graphId: graph.id,
    sequence: 1,
    label: 'unnamed',
    recipientType: 'treasury',
    recipientId: 't_platform',
    bps: 0,
    kind: 'platform_rake',
    conditionExpr: null,
    jurisdiction: null,
    metadata: {},
    ...overrides,
  };
}

describe('computeRoyaltyLegs', () => {
  it('routes 100% to primary when no layers', () => {
    const r = computeRoyaltyLegs({
      graph, layers: [],
      context: { flowKind: 're_yield_distribution', amount: 1000, currency: 'CAD' },
      primaryRecipient: { recipientType: 'investor', recipientId: 'u_1' },
    });
    expect(r.legs).toHaveLength(1);
    expect(r.legs[0].amount).toBe(1000);
    expect(r.residualToPrimary).toBe(1000);
    expect(r.totalRoyalty).toBe(0);
  });

  it('applies single platform rake + primary residual', () => {
    const layers = [layer({ sequence: 1, bps: 250, label: 'edgeiq', kind: 'platform_rake' })];
    const r = computeRoyaltyLegs({
      graph, layers,
      context: { flowKind: 're_yield_distribution', amount: 1000, currency: 'CAD' },
      primaryRecipient: { recipientType: 'investor', recipientId: 'u_1' },
    });
    expect(r.legs).toHaveLength(2);
    expect(r.legs[0].amount).toBe(25);
    expect(r.legs[1].amount).toBe(975);
    expect(r.totalRoyalty).toBe(25);
  });

  it('applies multi-layer waterfall', () => {
    const layers = [
      layer({ sequence: 1, bps: 250, label: 'edgeiq',   kind: 'platform_rake', recipientId: 't_edgeiq' }),
      layer({ sequence: 2, bps: 500, label: 'venture',  kind: 'venture_rake',  recipientId: 't_venture' }),
      layer({ sequence: 3, bps: 100, label: 'reserve',  kind: 'reserve',       recipientId: 't_reserve' }),
    ];
    const r = computeRoyaltyLegs({
      graph, layers,
      context: { flowKind: 're_yield_distribution', amount: 10000, currency: 'CAD' },
      primaryRecipient: { recipientType: 'investor', recipientId: 'u_1', label: 'investor_payout' },
    });
    expect(r.legs.map((l) => l.amount)).toEqual([250, 500, 100, 9150]);
    expect(r.totalRoyalty).toBe(850);
  });

  it('filters by jurisdiction', () => {
    const layers = [
      layer({ sequence: 1, bps: 250, kind: 'platform_rake', jurisdiction: 'US-DE' }),
      layer({ sequence: 2, bps: 500, kind: 'venture_rake',  jurisdiction: null }),
    ];
    const r = computeRoyaltyLegs({
      graph, layers,
      context: { flowKind: 're_yield_distribution', amount: 1000, currency: 'CAD', jurisdiction: 'CA-ON' },
      primaryRecipient: { recipientType: 'investor', recipientId: 'u_1' },
    });
    expect(r.legs).toHaveLength(2);
    expect(r.totalRoyalty).toBe(50);
  });

  it('filters by condition expression on flowKind', () => {
    const layers = [
      layer({ sequence: 1, bps: 500, conditionExpr: "flowKind==TOKEN_PRESALE" }),
      layer({ sequence: 2, bps: 200, conditionExpr: "flowKind==RE_YIELD_DISTRIBUTION" }),
    ];
    const r = computeRoyaltyLegs({
      graph, layers,
      context: { flowKind: 're_yield_distribution', amount: 1000, currency: 'CAD' },
      primaryRecipient: { recipientType: 'investor', recipientId: 'u_1' },
    });
    expect(r.legs).toHaveLength(2);
    expect(r.legs[0].bpsApplied).toBe(200);
  });

  it('filters by amount threshold', () => {
    const layers = [
      layer({ sequence: 1, bps: 500, conditionExpr: "amount>=10000" }),
      layer({ sequence: 2, bps: 100 }),
    ];
    const small = computeRoyaltyLegs({
      graph, layers,
      context: { flowKind: 're_capital_call', amount: 500, currency: 'CAD' },
      primaryRecipient: { recipientType: 'investor', recipientId: 'u_1' },
    });
    expect(small.legs).toHaveLength(2);
    expect(small.totalRoyalty).toBe(5);

    const big = computeRoyaltyLegs({
      graph, layers,
      context: { flowKind: 're_capital_call', amount: 20000, currency: 'CAD' },
      primaryRecipient: { recipientType: 'investor', recipientId: 'u_1' },
    });
    expect(big.legs).toHaveLength(3);
  });

  it('honors compound condition (&&)', () => {
    const layers = [
      layer({ sequence: 1, bps: 500, conditionExpr: "flowKind==TOKEN_PRESALE && amount>=10000" }),
    ];
    const match = computeRoyaltyLegs({
      graph, layers,
      context: { flowKind: 'token_presale', amount: 10000, currency: 'USD' },
      primaryRecipient: { recipientType: 'investor', recipientId: 'u_1' },
    });
    expect(match.totalRoyalty).toBe(500);

    const miss = computeRoyaltyLegs({
      graph, layers,
      context: { flowKind: 'token_presale', amount: 5000, currency: 'USD' },
      primaryRecipient: { recipientType: 'investor', recipientId: 'u_1' },
    });
    expect(miss.totalRoyalty).toBe(0);
  });

  it('maps recipient types to DistributionLeg vocabulary', () => {
    const layers = [
      layer({ sequence: 1, bps: 500, recipientType: 'treasury' }),
      layer({ sequence: 2, bps: 500, recipientType: 'user' }),
      layer({ sequence: 3, bps: 500, recipientType: 'external_entity' }),
      layer({ sequence: 4, bps: 500, recipientType: 'pool' }),
    ];
    const r = computeRoyaltyLegs({
      graph, layers,
      context: { flowKind: 're_yield_distribution', amount: 10000, currency: 'CAD' },
      primaryRecipient: { recipientType: 'investor', recipientId: 'u_1' },
    });
    expect(r.legs[0].recipientType).toBe('platform');
    expect(r.legs[1].recipientType).toBe('royalty_holder');
    expect(r.legs[2].recipientType).toBe('external');
    expect(r.legs[3].recipientType).toBe('liquidity_pool');
  });

  it('clamps final leg when cumulative bps > 10000', () => {
    const layers = [
      layer({ sequence: 1, bps: 6000 }),
      layer({ sequence: 2, bps: 6000 }),
    ];
    const r = computeRoyaltyLegs({
      graph, layers,
      context: { flowKind: 're_capital_call', amount: 1000, currency: 'CAD' },
      primaryRecipient: { recipientType: 'investor', recipientId: 'u_1' },
    });
    expect(r.legs.slice(0, 2).map((l) => l.amount)).toEqual([600, 400]);
    expect(r.residualToPrimary).toBe(0);
  });

  it('returns currency from context', () => {
    const r = computeRoyaltyLegs({
      graph, layers: [layer({ sequence: 1, bps: 100 })],
      context: { flowKind: 'token_presale', amount: 1000, currency: 'USDC' },
      primaryRecipient: { recipientType: 'investor', recipientId: 'u_1' },
    });
    expect(r.currency).toBe('USDC');
    expect(r.legs.every((l) => l.currency === 'USDC')).toBe(true);
  });
});
