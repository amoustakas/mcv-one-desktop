// Sim-parity contract tests — Marathon 1 Step 5.
//
// Locks the contract that every sim-mode primitive produces observable,
// deterministic output. Failures here mean a production flow would behave
// differently from its sim-mode equivalent — breaks the MVP pipeline
// commitment "feature isn't done without a sim-equivalent" (plan
// anti-pattern #4).
//
// Runs under vitest via the `scripts/**/__tests__/**/*.test.ts` glob in
// vitest.config.ts, so `npm test` enforces this on every push.

import { describe, it, expect } from 'vitest';

import {
  SimDispatcher,
  TraceDispatcher,
  InMemoryTraceStore,
  resolveAgentMode,
  isSimMode,
  type DispatchRequest,
} from '@mcv/naos-sdk/dispatch';
import {
  runConsensusTrial,
  createDeterministicResolver,
  createPrediction,
  computeConsensus,
} from '@mcv/naos-sdk/prediction';
import { StudyGate, InMemoryStudyTraceSink, summarize } from '../../src/lib/hitl/study-gate';
import { MemoryEventPublisher } from '../../src/lib/events/memory-publisher';
import {
  fabricToEventEnvelope,
  fabricBatchToEnvelopes,
  envelopeToFabricEvent,
  type FabricMCVEvent,
} from '../../src/lib/fabric-bridge/fabric-to-events';

// ───────────────────────────────────────────────────────────────────────────
// Fixtures
// ───────────────────────────────────────────────────────────────────────────

const FLEET = [
  { agentId: 'aegis',  role: 'ceo_proxy' as const, tier: 1, historicalAccuracy: 88, emotionalStability: 92 },
  { agentId: 'athena', role: 'cfo' as const,       tier: 1, historicalAccuracy: 93, emotionalStability: 90 },
  { agentId: 'kael',   role: 'cto' as const,       tier: 1, historicalAccuracy: 85, emotionalStability: 80 },
  { agentId: 'argus',  role: 'director_analytics' as const, tier: 2, historicalAccuracy: 90, emotionalStability: 85 },
];

function makeRequest(agent: typeof FLEET[number], correlationId: string): DispatchRequest {
  return {
    agentId: agent.agentId,
    role: agent.role,
    tier: agent.tier,
    ventureId: 'futurestate',
    domain: 'capital',
    task: 'Evaluate Q2 STATE round-open timing against counsel pre-disclosure gate.',
    context: { round: 'seed-ii' },
    correlationId,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Seam 2 — SimDispatcher
// ───────────────────────────────────────────────────────────────────────────

describe('SimDispatcher (seam 2)', () => {
  it('produces deterministic outputs for the same request', async () => {
    const dispatcher = new SimDispatcher();
    const request = makeRequest(FLEET[0], 'determinism-test');

    const first = await dispatcher.dispatch(request);
    const second = await dispatcher.dispatch(request);

    expect(second.decision).toBe(first.decision);
    expect(second.prediction.predictedOutcome).toBe(first.prediction.predictedOutcome);
    expect(second.confidence).toBe(first.confidence);
  });

  it('emits one naos.agent.dispatched event per dispatch', async () => {
    const captured: unknown[] = [];
    const dispatcher = new SimDispatcher({ onEvent: (e) => captured.push(e) });
    await dispatcher.dispatch(makeRequest(FLEET[0], 'event-emission'));
    expect(captured).toHaveLength(1);
    expect(dispatcher.mode).toBe('sim-synthetic');
  });

  it('confidence scales inversely with tier (tier 1 > tier 5)', async () => {
    const dispatcher = new SimDispatcher();
    const tier1Agent = { ...FLEET[0] };
    const tier5Agent = { ...FLEET[0], agentId: 'ic-worker', role: 'ic' as const, tier: 5 };

    const tier1Response = await dispatcher.dispatch(makeRequest(tier1Agent, 'tier-compare'));
    const tier5Response = await dispatcher.dispatch(makeRequest(tier5Agent, 'tier-compare'));

    expect(tier1Response.confidence).toBeGreaterThan(tier5Response.confidence);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// TraceDispatcher + InMemoryTraceStore
// ───────────────────────────────────────────────────────────────────────────

describe('TraceDispatcher (seam 2 variant)', () => {
  it('replays a recorded decision deterministically', async () => {
    const store = new InMemoryTraceStore();
    store.set('aegis', 'some-task', {
      decision: 'recorded-decision',
      predictedOutcome: 'approve',
      confidence: 95,
      outcome: 'success',
    });

    const dispatcher = new TraceDispatcher({ store });
    const request: DispatchRequest = {
      agentId: 'aegis',
      role: 'ceo_proxy',
      tier: 1,
      ventureId: 'test',
      domain: 'test',
      task: 'some-task',
      context: {},
    };

    const response = await dispatcher.dispatch(request);
    expect(response.decision).toBe('recorded-decision');
    expect(response.confidence).toBe(95);
    expect(response.outcome).toBe('success');
  });

  it('falls back to a secondary dispatcher when no trace matches', async () => {
    const store = new InMemoryTraceStore();
    const fallback = new SimDispatcher();
    const dispatcher = new TraceDispatcher({ store, fallback });

    const response = await dispatcher.dispatch(makeRequest(FLEET[0], 'no-trace'));
    expect(response.agentId).toBe(FLEET[0].agentId);
    expect(response.mode).toBe('sim-synthetic'); // came through fallback
  });

  it('throws when no trace and no fallback', async () => {
    const store = new InMemoryTraceStore();
    const dispatcher = new TraceDispatcher({ store });
    await expect(dispatcher.dispatch(makeRequest(FLEET[0], 'no-fallback'))).rejects.toThrow(/no entry/);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Seam 5 — StudyGate (with publisher bridge)
// ───────────────────────────────────────────────────────────────────────────

describe('StudyGate (seam 5)', () => {
  it('records one trace per dispatch and forwards one envelope per emitted event', async () => {
    const inner = new SimDispatcher();
    const bus = new MemoryEventPublisher();
    const gate = new StudyGate({ inner, publisher: bus });

    for (const agent of FLEET) {
      await gate.dispatch(makeRequest(agent, 'parity-batch'));
    }
    // Allow the fire-and-forget publish microtasks to settle.
    await new Promise((resolve) => setImmediate(resolve));

    expect(gate.getSink().list()).toHaveLength(FLEET.length);
    expect(bus.size()).toBe(FLEET.length);

    // All envelopes in this batch share one correlationId — the request's.
    const correlationIds = new Set(bus.list().map((e) => e.correlationId));
    expect(correlationIds.size).toBe(1);
    expect([...correlationIds][0]).toBe('parity-batch');

    // ventureId propagates from request to envelope.
    expect(new Set(bus.list().map((e) => e.ventureId))).toEqual(new Set(['futurestate']));

    // emittedBy carries the agent handle.
    expect(bus.list().map((e) => e.emittedBy).sort()).toEqual(
      FLEET.map((a) => `agent:${a.agentId}`).sort(),
    );
  });

  it('is a pass-through when disabled', async () => {
    const inner = new SimDispatcher();
    const bus = new MemoryEventPublisher();
    const sink = new InMemoryStudyTraceSink();
    const gate = new StudyGate({ inner, publisher: bus, sink, enabled: false });

    await gate.dispatch(makeRequest(FLEET[0], 'disabled'));

    expect(sink.size()).toBe(0);
    expect(bus.size()).toBe(0);
  });

  it('summarize() rolls traces into dashboard metrics', async () => {
    const inner = new SimDispatcher();
    const gate = new StudyGate({ inner });

    for (const agent of FLEET) {
      await gate.dispatch(makeRequest(agent, 'summary'));
    }
    const summary = await summarize(gate.getSink(), 100);

    expect(summary.totalTraces).toBe(FLEET.length);
    expect(summary.ungraded).toBe(FLEET.length);
    expect(summary.verdictCounts['matched-consensus']).toBe(0);
    expect(summary.byMode['sim-synthetic']).toBe(FLEET.length);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Seam 6 — runConsensusTrial
// ───────────────────────────────────────────────────────────────────────────

describe('runConsensusTrial (seam 6)', () => {
  it('produces valid aggregate metrics across N iterations', async () => {
    const result = await runConsensusTrial({
      agents: FLEET.map(({ agentId, tier, historicalAccuracy, emotionalStability }) => ({
        agentId, tier, historicalAccuracy, emotionalStability,
      })),
      decisionContext: 'Test decision',
      ventureId: 'test',
      domain: 'test',
      iterations: 5,
      confidenceThreshold: 0.6,
      resolver: createDeterministicResolver(['approve', 'escalate', 'defer']),
    });

    expect(result.iterations).toHaveLength(5);
    expect(['approve', 'escalate', 'defer']).toContain(result.aggregate.dominantConsensus);
    expect(result.aggregate.convergenceScore).toBeGreaterThanOrEqual(0);
    expect(result.aggregate.convergenceScore).toBeLessThanOrEqual(1);
    expect(result.aggregate.averageConfidence).toBeGreaterThanOrEqual(0);
    expect(result.aggregate.averageConfidence).toBeLessThanOrEqual(100);
  });

  it('flags chronic outliers (agents disagreeing >50% of iterations)', async () => {
    const result = await runConsensusTrial({
      agents: FLEET.map(({ agentId, tier, historicalAccuracy, emotionalStability }) => ({
        agentId, tier, historicalAccuracy, emotionalStability,
      })),
      decisionContext: 'Outlier test',
      ventureId: 'test',
      domain: 'test',
      iterations: 5,
      resolver: createDeterministicResolver(['a', 'b', 'c']),
    });
    // Deterministic resolver with 3 choices + 4 agents should produce
    // some disagreement. Chronic outliers is a set that should be empty OR
    // contain a subset of the fleet (never the whole fleet).
    expect(result.chronicOutliers.length).toBeLessThan(FLEET.length);
    for (const outlierId of result.chronicOutliers) {
      expect(FLEET.map((a) => a.agentId)).toContain(outlierId);
    }
  });

  it('defaults iterations to 5 and threshold to 0.85', async () => {
    const result = await runConsensusTrial({
      agents: [{ agentId: 'solo', tier: 1, historicalAccuracy: 100, emotionalStability: 100 }],
      decisionContext: 'Solo',
      ventureId: 'test',
      domain: 'test',
      resolver: createDeterministicResolver(['only-choice']),
    });
    expect(result.iterations).toHaveLength(5);
    // Single agent, single choice → 100% convergence, exceeds 0.85 default.
    expect(result.aggregate.convergenceScore).toBe(1);
    expect(result.aggregate.metThreshold).toBe(true);
    expect(result.chronicOutliers).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// computeConsensus — underlying primitive
// ───────────────────────────────────────────────────────────────────────────

describe('computeConsensus', () => {
  it('weights tier 1 predictions more heavily than tier 5', () => {
    const tier1Prediction = createPrediction('a1', 'v', 'd', 'ctx', 'approve', 80);
    const tier5Prediction = createPrediction('a5', 'v', 'd', 'ctx', 'reject', 80);
    const consensus = computeConsensus([
      { prediction: tier1Prediction, agentTier: 1, historicalAccuracy: 90, emotionalStability: 90 },
      { prediction: tier5Prediction, agentTier: 5, historicalAccuracy: 90, emotionalStability: 90 },
    ]);
    expect(consensus.consensusPrediction).toBe('approve');
    expect(consensus.outliers).toHaveLength(1);
    expect(consensus.outliers[0].agentId).toBe('a5');
  });

  it('handles empty input gracefully', () => {
    const consensus = computeConsensus([]);
    expect(consensus.consensusConfidence).toBe(0);
    expect(consensus.outliers).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Mode resolution
// ───────────────────────────────────────────────────────────────────────────

describe('resolveAgentMode', () => {
  it('returns production for empty/unknown/unsafe values', () => {
    expect(resolveAgentMode(undefined)).toBe('production');
    expect(resolveAgentMode('')).toBe('production');
    expect(resolveAgentMode('PRODUCTION')).toBe('production');
    expect(resolveAgentMode('unexpected-garbage')).toBe('production');
  });

  it('returns the sim mode when explicitly set', () => {
    expect(resolveAgentMode('sim-synthetic')).toBe('sim-synthetic');
    expect(resolveAgentMode('sim_synthetic')).toBe('sim-synthetic');
    expect(resolveAgentMode('sim-trace')).toBe('sim-trace');
  });

  it('isSimMode() narrows to the sim variants', () => {
    expect(isSimMode('production')).toBe(false);
    expect(isSimMode('sim-synthetic')).toBe(true);
    expect(isSimMode('sim-trace')).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Cross-repo substrate — Fabric bridge contracts
//
// Locks the bridge contract between @mcv/fabric (mcv-core-triangle) and
// @mcv/events-sdk (mcv-one-desktop). A failure here means a cross-repo
// event flow would lose identity across the boundary — breaks the
// Marathon 5 P1.B commitment "sim-parity as a first-class feature".
// ───────────────────────────────────────────────────────────────────────────

const CROSS_V = '88888888-8888-4888-8888-888888888888';
const CROSS_ID = '99999999-9999-4999-8999-999999999999';
const CROSS_CORR = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function makeFabricFixture<T>(overrides: Partial<FabricMCVEvent<T>> & { data: T }): FabricMCVEvent<T> {
  return {
    id: CROSS_ID,
    topic: 'fabric.contract.test',
    type: 'sim.parity',
    source: 'sim-parity-suite',
    ventureId: CROSS_V,
    correlationId: CROSS_CORR,
    timestamp: '2026-04-22T23:00:00Z',
    version: '1.0',
    ...overrides,
  };
}

describe('fabric-bridge contract parity', () => {
  it('preserves every identity field through the bridge', () => {
    const fabric = makeFabricFixture({
      data: { amount: 100 },
      metadata: { k: 'v' },
    });
    const env = fabricToEventEnvelope(fabric);

    expect(env.id).toBe(fabric.id);
    expect(env.topic).toBe(fabric.topic);
    expect(env.schemaVersion).toBe(fabric.version);
    expect(env.correlationId).toBe(fabric.correlationId);
    expect(env.ventureId).toBe(fabric.ventureId);
    expect(env.emittedAt).toBe(fabric.timestamp);
  });

  it('applies "fabric:" provenance prefix to emittedBy', () => {
    const fabric = makeFabricFixture({ data: {} });
    const env = fabricToEventEnvelope(fabric);
    expect(env.emittedBy).toBe(`fabric:${fabric.source}`);
    expect(env.emittedBy.startsWith('fabric:')).toBe(true);
  });

  it('folds Fabric type + metadata into payload.__fabric without loss', () => {
    const fabric = makeFabricFixture({
      data: { core: 'data' },
      metadata: { extra: 'nested', nums: [1, 2, 3] },
    });
    const env = fabricToEventEnvelope(fabric);
    expect(env.payload.__fabric.type).toBe(fabric.type);
    expect(env.payload.__fabric.metadata).toEqual(fabric.metadata);
    expect(env.payload.data).toEqual({ core: 'data' });
  });

  it('every bridged envelope sets causationId=null and status=pending', () => {
    // Fabric has no cascade concept today; the bridge produces roots only.
    const events = [
      makeFabricFixture({ data: { i: 0 } }),
      makeFabricFixture({ id: '11111111-1111-4111-8111-111111111111', data: { i: 1 } }),
    ];
    const envs = fabricBatchToEnvelopes(events);
    for (const env of envs) {
      expect(env.causationId).toBeNull();
      expect(env.status).toBe('pending');
    }
  });

  it('round-trip fabric → envelope → fabric preserves all required fields', () => {
    const original = makeFabricFixture({
      data: { complex: { nested: [1, 2] } },
      metadata: { tag: 'round-trip' },
    });
    const env = fabricToEventEnvelope(original);
    const round = envelopeToFabricEvent<{ complex: { nested: number[] } }>(env);
    expect(round).not.toBeNull();
    expect(round!.id).toBe(original.id);
    expect(round!.topic).toBe(original.topic);
    expect(round!.type).toBe(original.type);
    expect(round!.source).toBe(original.source);
    expect(round!.ventureId).toBe(original.ventureId);
    expect(round!.correlationId).toBe(original.correlationId);
    expect(round!.version).toBe(original.version);
    expect(round!.data).toEqual(original.data);
    expect(round!.metadata).toEqual(original.metadata);
  });

  it('envelopeToFabricEvent returns null when envelope was not bridge-originated', () => {
    const foreign = {
      id: 'x',
      topic: 't',
      schemaVersion: '1.0',
      correlationId: 'c',
      causationId: null,
      ventureId: null,
      emittedAt: '2026-04-22T00:00:00Z',
      emittedBy: 'foundation:counsel',
      payload: { domain: 'data without __fabric wrapper' },
      status: 'pending' as const,
    };
    expect(envelopeToFabricEvent(foreign)).toBeNull();
  });

  it('batch bridge preserves order and event count', () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      makeFabricFixture({
        id: `${'0'.repeat(7)}${i}-0000-4000-8000-000000000000`,
        topic: `fabric.test.${i}`,
        data: { idx: i },
      }),
    );
    const envs = fabricBatchToEnvelopes(events);
    expect(envs).toHaveLength(5);
    expect(envs.map((e) => e.topic)).toEqual([
      'fabric.test.0',
      'fabric.test.1',
      'fabric.test.2',
      'fabric.test.3',
      'fabric.test.4',
    ]);
    expect(envs.map((e) => (e.payload.data as { idx: number }).idx)).toEqual([0, 1, 2, 3, 4]);
  });

  it('correlation cohesion: events sharing correlationId on Fabric side share it in envelopes', () => {
    const shared = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const events = [
      makeFabricFixture({
        id: '00000001-0000-4000-8000-000000000000',
        correlationId: shared,
        data: { step: 1 },
      }),
      makeFabricFixture({
        id: '00000002-0000-4000-8000-000000000000',
        correlationId: shared,
        data: { step: 2 },
      }),
      makeFabricFixture({
        id: '00000003-0000-4000-8000-000000000000',
        correlationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        data: { step: 1 },
      }),
    ];
    const envs = fabricBatchToEnvelopes(events);
    expect(envs[0]!.correlationId).toBe(envs[1]!.correlationId);
    expect(envs[0]!.correlationId).not.toBe(envs[2]!.correlationId);
  });
});
