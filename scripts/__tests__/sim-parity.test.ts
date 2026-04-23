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
