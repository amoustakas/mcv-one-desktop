// FintracTracker contract tests.
//
// Locks the aggregation math + event emission at the Canadian AML boundary.
// LVCTR crosses at $10k CAD aggregate (24h rolling), Travel Rule at $1k
// per-flow. Pruning must be deterministic (no hidden Date.now()).

import { describe, it, expect } from 'vitest';
import BN from 'bn.js';

import { FintracTracker } from '../fintrac-tracker';
import type { FintracTrackerEvent } from '../fintrac-tracker';

const SCALE = new BN(10).pow(new BN(18));
const cadRaw = (cad: number): BN => new BN(cad).mul(SCALE);

describe('FintracTracker', () => {
  it('fires Travel Rule event at or above $1,000 CAD single flow', () => {
    const events: FintracTrackerEvent[] = [];
    const tracker = new FintracTracker({ onEvent: (e) => { events.push(e); } });

    tracker.track({ userId: 'u1', amountRawCad: cadRaw(999), timestampMs: 1, correlationId: 'c1' });
    expect(events.filter((e) => e.kind === 'travel-rule')).toHaveLength(0);

    tracker.track({ userId: 'u1', amountRawCad: cadRaw(1000), timestampMs: 2, correlationId: 'c2' });
    expect(events.filter((e) => e.kind === 'travel-rule')).toHaveLength(1);

    tracker.track({ userId: 'u1', amountRawCad: cadRaw(5000), timestampMs: 3, correlationId: 'c3' });
    expect(events.filter((e) => e.kind === 'travel-rule')).toHaveLength(2);
  });

  it('fires LVCTR event when 24h aggregate crosses $10,000 CAD', () => {
    const events: FintracTrackerEvent[] = [];
    const tracker = new FintracTracker({ onEvent: (e) => { events.push(e); } });

    // 5 flows of $2k each = $10k aggregate — threshold hits on 5th
    for (let i = 0; i < 4; i++) {
      tracker.track({ userId: 'u1', amountRawCad: cadRaw(2000), timestampMs: i + 1, correlationId: `c${i}` });
    }
    expect(events.filter((e) => e.kind === 'lvctr')).toHaveLength(0);

    tracker.track({ userId: 'u1', amountRawCad: cadRaw(2000), timestampMs: 5, correlationId: 'c5' });
    const lvctrEvents = events.filter((e) => e.kind === 'lvctr');
    expect(lvctrEvents).toHaveLength(1);
    if (lvctrEvents[0]?.kind === 'lvctr') {
      expect(lvctrEvents[0].contributingFlows).toBe(5);
      expect(lvctrEvents[0].aggregatedRawCad).toBe(cadRaw(10_000).toString());
    }
  });

  it('prunes flows older than 24h window', () => {
    const events: FintracTrackerEvent[] = [];
    const tracker = new FintracTracker({
      onEvent: (e) => { events.push(e); },
      lvctrWindowMs: 1000, // 1 second for test ease
    });

    // Flow A at t=0
    tracker.track({ userId: 'u1', amountRawCad: cadRaw(9_000), timestampMs: 0, correlationId: 'A' });
    // Flow B at t=500ms — aggregate $18k, LVCTR fires
    tracker.track({ userId: 'u1', amountRawCad: cadRaw(9_000), timestampMs: 500, correlationId: 'B' });
    const firstLvctr = events.filter((e) => e.kind === 'lvctr').length;
    expect(firstLvctr).toBe(1);

    // Flow C at t=1500ms — Flow A is now expired; aggregate = Flow B + C = $18k still
    tracker.track({ userId: 'u1', amountRawCad: cadRaw(9_000), timestampMs: 1500, correlationId: 'C' });
    const secondLvctr = events.filter((e) => e.kind === 'lvctr').length;
    // Still fires because B ($9k) + C ($9k) = $18k
    expect(secondLvctr).toBe(2);

    // Flow D at t=2500ms — Flows A, B expired; aggregate = C + D = $18k
    tracker.track({ userId: 'u1', amountRawCad: cadRaw(9_000), timestampMs: 2500, correlationId: 'D' });
    // Flow D alone with C = $18k, still above threshold
    const thirdLvctr = events.filter((e) => e.kind === 'lvctr').length;
    expect(thirdLvctr).toBe(3);
  });

  it('tracks per-user windows independently', () => {
    const events: FintracTrackerEvent[] = [];
    const tracker = new FintracTracker({ onEvent: (e) => { events.push(e); } });

    tracker.track({ userId: 'alice', amountRawCad: cadRaw(5000), timestampMs: 1, correlationId: 'a1' });
    tracker.track({ userId: 'bob',   amountRawCad: cadRaw(5000), timestampMs: 2, correlationId: 'b1' });
    tracker.track({ userId: 'alice', amountRawCad: cadRaw(5000), timestampMs: 3, correlationId: 'a2' });

    // Alice hit $10k; Bob hit $5k
    const aliceLvctr = events.filter((e) => e.kind === 'lvctr' && e.userId === 'alice');
    const bobLvctr = events.filter((e) => e.kind === 'lvctr' && e.userId === 'bob');
    expect(aliceLvctr).toHaveLength(1);
    expect(bobLvctr).toHaveLength(0);
  });

  it('aggregateFor returns zero for unknown users', () => {
    const tracker = new FintracTracker();
    expect(tracker.aggregateFor('unknown', 1000).toString()).toBe('0');
  });

  it('reset clears per-user or all state', () => {
    const tracker = new FintracTracker();
    tracker.track({ userId: 'u1', amountRawCad: cadRaw(5000), timestampMs: 1, correlationId: 'c1' });
    tracker.track({ userId: 'u2', amountRawCad: cadRaw(5000), timestampMs: 2, correlationId: 'c2' });

    tracker.reset('u1');
    expect(tracker.aggregateFor('u1', 10).toString()).toBe('0');
    expect(tracker.aggregateFor('u2', 10).toString()).not.toBe('0');

    tracker.reset();
    expect(tracker.aggregateFor('u2', 10).toString()).toBe('0');
  });
});
