// pending-store.test.ts — exercises createPendingStore() against the
// full lifecycle: enqueue + setVerdict round-trip, timeout firing,
// subscriber event delivery, and double-decide idempotence.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActionRequest, ApprovalContext } from '@mcv/vision/broker-contract';

import { createPendingStore, type PendingStoreEvent } from '../pending-store';

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

function makeReq(): ActionRequest {
  return { kind: 'click', refId: 'ref-submit-1' };
}

function makeCtx(): ApprovalContext {
  return {
    sessionId: 'sess-1',
    agentHandle: 'tony.naos',
    tenantId: 't-mcv',
    ventureId: 'v-desktop',
    preSnapshotId: 'snap-1',
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('vision-broker · pending-store · enqueue + setVerdict', () => {
  it('resolves the enqueue promise with the verdict on setVerdict', async () => {
    const store = createPendingStore();

    const decisionP = store.enqueue({
      req: makeReq(),
      ctx: makeCtx(),
      timeoutMs: 60_000,
    });

    expect(store.size()).toBe(1);
    const [pending] = store.list();
    expect(pending.req).toEqual(makeReq());

    const ok = store.setVerdict(pending.id, 'approved', 'tony.atlas', 'go');
    expect(ok).toBe(true);

    const decision = await decisionP;
    expect(decision.verdict).toBe('approved');
    expect(decision.decidedBy).toBe('tony.atlas');
    expect(decision.note).toBe('go');
    expect(store.size()).toBe(0);
  });

  it('returns false from setVerdict for unknown id', () => {
    const store = createPendingStore();
    expect(store.setVerdict('unknown', 'approved', null)).toBe(false);
  });

  it('is idempotent — second setVerdict for the same id is a no-op', async () => {
    const store = createPendingStore();
    const decisionP = store.enqueue({
      req: makeReq(),
      ctx: makeCtx(),
      timeoutMs: 60_000,
    });
    const [pending] = store.list();

    expect(store.setVerdict(pending.id, 'approved', 'tony.atlas')).toBe(true);
    expect(store.setVerdict(pending.id, 'rejected', 'tony.atlas')).toBe(false);

    const decision = await decisionP;
    // First verdict wins.
    expect(decision.verdict).toBe('approved');
  });
});

describe('vision-broker · pending-store · timeout', () => {
  it('auto-rejects with verdict=timeout after timeoutMs elapses', async () => {
    const store = createPendingStore();

    const decisionP = store.enqueue({
      req: makeReq(),
      ctx: makeCtx(),
      timeoutMs: 1_000,
    });

    await vi.advanceTimersByTimeAsync(1_001);

    const decision = await decisionP;
    expect(decision.verdict).toBe('timeout');
    expect(decision.decidedBy).toBeNull();
    expect(decision.note).toMatch(/auto-rejected/);
    expect(store.size()).toBe(0);
  });

  it('does NOT fire timeout if setVerdict arrives first', async () => {
    const store = createPendingStore();

    const decisionP = store.enqueue({
      req: makeReq(),
      ctx: makeCtx(),
      timeoutMs: 5_000,
    });
    const [pending] = store.list();

    await vi.advanceTimersByTimeAsync(1_000);
    store.setVerdict(pending.id, 'rejected', 'tony.atlas', 'no thanks');
    // Even after the original deadline elapses, the verdict from
    // setVerdict() is what we get.
    await vi.advanceTimersByTimeAsync(10_000);

    const decision = await decisionP;
    expect(decision.verdict).toBe('rejected');
    expect(decision.note).toBe('no thanks');
  });
});

describe('vision-broker · pending-store · subscribers', () => {
  it('delivers pending-added then pending-decided to subscribers', async () => {
    const store = createPendingStore();
    const events: PendingStoreEvent[] = [];
    const off = store.subscribe((e) => events.push(e));

    const decisionP = store.enqueue({
      req: makeReq(),
      ctx: makeCtx(),
      timeoutMs: 60_000,
    });
    const [pending] = store.list();

    store.setVerdict(pending.id, 'approved', 'tony.atlas');
    await decisionP;

    expect(events.map((e) => e.kind)).toEqual(['pending-added', 'pending-decided']);
    if (events[1].kind === 'pending-decided') {
      expect(events[1].verdict).toBe('approved');
    }

    off();
  });

  it('delivers pending-timeout to subscribers when deadline fires', async () => {
    const store = createPendingStore();
    const events: PendingStoreEvent[] = [];
    store.subscribe((e) => events.push(e));

    const decisionP = store.enqueue({
      req: makeReq(),
      ctx: makeCtx(),
      timeoutMs: 1_000,
    });
    await vi.advanceTimersByTimeAsync(1_001);
    await decisionP;

    expect(events.map((e) => e.kind)).toEqual(['pending-added', 'pending-timeout']);
  });

  it('off() unsubscribes — no further events delivered', async () => {
    const store = createPendingStore();
    const events: PendingStoreEvent[] = [];
    const off = store.subscribe((e) => events.push(e));

    const decisionP = store.enqueue({
      req: makeReq(),
      ctx: makeCtx(),
      timeoutMs: 60_000,
    });
    off();

    const [pending] = store.list();
    store.setVerdict(pending.id, 'approved', 'tony.atlas');
    await decisionP;

    // Only the pending-added event landed before unsubscribe.
    expect(events.map((e) => e.kind)).toEqual(['pending-added']);
  });
});

describe('vision-broker · pending-store · refDescriptor', () => {
  it('uses snapshot ref name when available', async () => {
    const store = createPendingStore();

    store.enqueue({
      req: { kind: 'click', refId: 'r1' },
      ctx: makeCtx(),
      timeoutMs: 60_000,
      preSnapshot: {
        url: 'https://app.mcv.dev/dashboard',
        title: 'Dashboard',
        takenAt: 0,
        screenshotPng: new Uint8Array([1, 2, 3]),
        refs: [
          {
            id: 'r1',
            role: 'button',
            name: 'Submit',
            bounds: { x: 0, y: 0, width: 0, height: 0 },
            originOrdinal: 0,
            ancestorRoles: [],
            offscreen: false,
            disabled: false,
          },
        ],
        summary: '',
      },
    });

    const [pending] = store.list();
    expect(pending.refDescriptor).toContain("'Submit'");
    expect(pending.refDescriptor).toContain('button');
    expect(pending.refDescriptor).toContain('app.mcv.dev');
  });

  it('falls back to refId when no snapshot is provided', () => {
    const store = createPendingStore();

    store.enqueue({
      req: { kind: 'click', refId: 'r1' },
      ctx: makeCtx(),
      timeoutMs: 60_000,
    });

    const [pending] = store.list();
    expect(pending.refDescriptor).toContain('r1');
  });
});
