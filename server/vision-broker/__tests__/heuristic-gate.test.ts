// heuristic-gate.test.ts — covers the classify() policy across every
// destructive vocab term, ancestor heuristics, cross-origin nav, and
// the safe edge cases. Then exercises the gate factory against a
// real pending-store to confirm safe -> auto and destructive -> queued.

import { describe, expect, it } from 'vitest';

import type {
  ActionRequest,
  ApprovalContext,
  Ref,
  SnapshotResult,
} from '@mcv/vision/broker-contract';

import {
  DESTRUCTIVE_VOCAB,
  classify,
  createHeuristicGate,
} from '../heuristic-gate';
import { createPendingStore } from '../pending-store';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRef(over: Partial<Ref>): Ref {
  return {
    id: 'r1',
    role: 'button',
    name: 'Click me',
    bounds: { x: 0, y: 0, width: 50, height: 30 },
    originOrdinal: 0,
    ancestorRoles: [],
    offscreen: false,
    disabled: false,
    ...over,
  };
}

function makeSnapshot(refs: Ref[], url = 'https://app.mcv.dev/dashboard'): SnapshotResult {
  return {
    url,
    title: 'Dashboard',
    takenAt: 0,
    screenshotPng: new Uint8Array(),
    refs,
    summary: '',
  };
}

function makeCtx(): ApprovalContext {
  return {
    sessionId: 's',
    agentHandle: 'tony.naos',
    tenantId: 't',
    ventureId: 'v',
    preSnapshotId: 'snap-1',
  };
}

// ---------------------------------------------------------------------------
// Sanity: vocab regex
// ---------------------------------------------------------------------------

describe('vision-broker · heuristic-gate · DESTRUCTIVE_VOCAB regex', () => {
  it.each([
    'Submit',
    'submit form',
    'Delete account',
    'PUBLISH',
    'Send message',
    'Pay now',
    'Confirm purchase',
    'destroy session',
    'remove user',
    'Withdraw funds',
    'Transfer balance',
  ])('flags %s', (label) => {
    expect(DESTRUCTIVE_VOCAB.test(label)).toBe(true);
  });

  it.each(['Cancel', 'Save draft', 'View details', 'Edit profile', 'Open menu'])(
    'does NOT flag %s',
    (label) => {
      expect(DESTRUCTIVE_VOCAB.test(label)).toBe(false);
    },
  );
});

// ---------------------------------------------------------------------------
// classify() — click
// ---------------------------------------------------------------------------

describe('vision-broker · heuristic-gate · classify(click)', () => {
  it('returns destructive for a button labeled with vocab', () => {
    const snap = makeSnapshot([
      makeRef({ id: 'r1', role: 'button', name: 'Submit' }),
    ]);
    const req: ActionRequest = { kind: 'click', refId: 'r1' };
    expect(classify(req, { snapshot: snap })).toBe('destructive');
  });

  it('returns safe for a button labeled outside vocab', () => {
    const snap = makeSnapshot([
      makeRef({ id: 'r1', role: 'button', name: 'View details' }),
    ]);
    const req: ActionRequest = { kind: 'click', refId: 'r1' };
    expect(classify(req, { snapshot: snap })).toBe('safe');
  });

  it('returns safe when ref is unknown but snapshot exists (will fail downstream)', () => {
    const snap = makeSnapshot([]);
    const req: ActionRequest = { kind: 'click', refId: 'unknown' };
    expect(classify(req, { snapshot: snap })).toBe('safe');
  });

  it('returns destructive when no snapshot is available (fail-closed)', () => {
    const req: ActionRequest = { kind: 'click', refId: 'r1' };
    expect(classify(req, { snapshot: null })).toBe('destructive');
  });
});

// ---------------------------------------------------------------------------
// classify() — type
// ---------------------------------------------------------------------------

describe('vision-broker · heuristic-gate · classify(type)', () => {
  it('flags type into a textbox inside a form', () => {
    const snap = makeSnapshot([
      makeRef({
        id: 'tb1',
        role: 'textbox',
        name: 'Card number',
        ancestorRoles: ['form', 'main'],
      }),
    ]);
    const req: ActionRequest = { kind: 'type', refId: 'tb1', text: '4242' };
    expect(classify(req, { snapshot: snap })).toBe('destructive');
  });

  it('does NOT flag type into a textbox NOT inside a form (e.g. search box)', () => {
    const snap = makeSnapshot([
      makeRef({
        id: 'tb1',
        role: 'textbox',
        name: 'Search',
        ancestorRoles: ['nav', 'header'],
      }),
    ]);
    const req: ActionRequest = { kind: 'type', refId: 'tb1', text: 'hi' };
    expect(classify(req, { snapshot: snap })).toBe('safe');
  });

  it('does NOT flag type into non-textbox (combobox / etc.)', () => {
    const snap = makeSnapshot([
      makeRef({
        id: 'cb1',
        role: 'combobox',
        name: 'Country',
        ancestorRoles: ['form'],
      }),
    ]);
    const req: ActionRequest = { kind: 'type', refId: 'cb1', text: 'US' };
    // role !== 'textbox', so classification falls through to safe
    expect(classify(req, { snapshot: snap })).toBe('safe');
  });
});

// ---------------------------------------------------------------------------
// classify() — navigate
// ---------------------------------------------------------------------------

describe('vision-broker · heuristic-gate · classify(navigate)', () => {
  it('flags cross-origin navigation', () => {
    const snap = makeSnapshot([], 'https://app.mcv.dev/dashboard');
    const req: ActionRequest = { kind: 'navigate', url: 'https://stripe.com/checkout' };
    expect(classify(req, { snapshot: snap })).toBe('destructive');
  });

  it('does NOT flag same-origin navigation', () => {
    const snap = makeSnapshot([], 'https://app.mcv.dev/dashboard');
    const req: ActionRequest = { kind: 'navigate', url: 'https://app.mcv.dev/settings' };
    expect(classify(req, { snapshot: snap })).toBe('safe');
  });

  it('does NOT flag navigation to data:/about: (no origin)', () => {
    const snap = makeSnapshot([], 'https://app.mcv.dev/dashboard');
    const req: ActionRequest = { kind: 'navigate', url: 'data:text/html,<p>hi</p>' };
    expect(classify(req, { snapshot: snap })).toBe('safe');
  });
});

// ---------------------------------------------------------------------------
// classify() — scroll/wait are always safe
// ---------------------------------------------------------------------------

describe('vision-broker · heuristic-gate · classify(scroll|wait)', () => {
  it('always returns safe for scroll', () => {
    const req: ActionRequest = { kind: 'scroll', dx: 0, dy: 400 };
    expect(classify(req, { snapshot: null })).toBe('safe');
    expect(classify(req, { snapshot: makeSnapshot([]) })).toBe('safe');
  });

  it('always returns safe for wait', () => {
    const req: ActionRequest = { kind: 'wait', condition: { kind: 'networkIdle' } };
    expect(classify(req, { snapshot: null })).toBe('safe');
  });
});

// ---------------------------------------------------------------------------
// Gate factory — integration with pending-store
// ---------------------------------------------------------------------------

describe('vision-broker · heuristic-gate · createHeuristicGate', () => {
  it('returns auto-verdict immediately for safe actions', async () => {
    const pendingStore = createPendingStore();
    const snap = makeSnapshot([
      makeRef({ id: 'r1', role: 'button', name: 'View details' }),
    ]);
    const gate = createHeuristicGate({
      pendingStore,
      snapshots: { get: () => snap },
      timeoutMs: 60_000,
    });

    const req: ActionRequest = { kind: 'click', refId: 'r1' };
    const decision = await gate.evaluate(req, makeCtx());

    expect(decision.verdict).toBe('auto');
    expect(decision.decidedBy).toBeNull();
    expect(pendingStore.size()).toBe(0);
  });

  it('enqueues destructive actions and resolves on setVerdict', async () => {
    const pendingStore = createPendingStore();
    const snap = makeSnapshot([
      makeRef({ id: 'r1', role: 'button', name: 'Delete account' }),
    ]);
    const gate = createHeuristicGate({
      pendingStore,
      snapshots: { get: () => snap },
      timeoutMs: 60_000,
    });

    const req: ActionRequest = { kind: 'click', refId: 'r1' };
    const decisionP = gate.evaluate(req, makeCtx());

    expect(pendingStore.size()).toBe(1);
    const [pending] = pendingStore.list();
    pendingStore.setVerdict(pending.id, 'approved', 'tony.atlas');

    const decision = await decisionP;
    expect(decision.verdict).toBe('approved');
    expect(decision.decidedBy).toBe('tony.atlas');
  });

  it('passes the resolved snapshot through to refDescriptor', async () => {
    const pendingStore = createPendingStore();
    const snap = makeSnapshot(
      [makeRef({ id: 'r1', role: 'button', name: 'Submit' })],
      'https://app.mcv.dev/checkout',
    );
    const gate = createHeuristicGate({
      pendingStore,
      snapshots: { get: () => snap },
      timeoutMs: 60_000,
    });

    void gate.evaluate({ kind: 'click', refId: 'r1' }, makeCtx());

    const [pending] = pendingStore.list();
    expect(pending.refDescriptor).toContain("'Submit'");
    expect(pending.refDescriptor).toContain('app.mcv.dev/checkout');
  });
});
