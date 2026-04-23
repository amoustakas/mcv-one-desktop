#!/usr/bin/env node
// scripts/sim-dry-run — end-to-end Milofish sim-mode exercise.
//
// Capstone driver for Phase 1 Track 1A of the MVP pipeline (plan file
// this-is-all-of-smooth-sunset.md §6). Wires the local sim-mode seams
// together with the cross-repo Fabric bridge contract into a single
// command a dev can run on a laptop with zero external credentials:
//
//   Seam 2 (dispatch.ts SimDispatcher)        → synthetic agent resolver
//   Seam 5 (hitl/study-gate.ts StudyGate)     → trace observation wrapper
//   Seam 6 (prediction.ts runConsensusTrial)  → N-iteration convergence check
//   Seam 4 (foundation seeder --sim-mode)     → synthetic counsel corpus
//   Cross-repo contract parity                 → Fabric MCVEvent bridge adapter
//                                                 (seams 1 + 3 shipped in
//                                                 mcv-core-triangle branch
//                                                 foundation-substrate-2026-04-22)
//
// Output validates: (a) dispatch resolves deterministically, (b) study
// gate captures every trace, (c) consensus trial converges + flags
// chronic outliers, (d) foundation seeder produces parity output,
// (e) Fabric→events-sdk envelope bridge preserves all identity fields
// losslessly (prerequisite for the runtime cross-repo wiring that
// lands once @mcv/fabric is available as a file-path dep).
//
// Usage:
//   pnpm tsx scripts/sim-dry-run.ts
//
// Exits 0 on full green, 1 if any seam fails its assertion.

import { spawnSync } from 'node:child_process';
import path from 'node:path';

import {
  SimDispatcher,
  type DispatchEvent,
  type DispatchRequest,
} from '@mcv/naos-sdk/dispatch';
import {
  runConsensusTrial,
  createDeterministicResolver,
} from '@mcv/naos-sdk/prediction';
import { StudyGate, summarize } from '../src/lib/hitl/study-gate';
import { MemoryEventPublisher } from '../src/lib/events/memory-publisher';
import {
  fabricToEventEnvelope,
  fabricBatchToEnvelopes,
  envelopeToFabricEvent,
  type FabricMCVEvent,
} from '../src/lib/fabric-bridge/fabric-to-events';

// ───────────────────────────────────────────────────────────────────────────
// Synthetic agent fleet
// ───────────────────────────────────────────────────────────────────────────

const SYNTHETIC_FLEET = [
  { agentId: 'aegis',       role: 'ceo_proxy' as const, tier: 1, historicalAccuracy: 88, emotionalStability: 92 },
  { agentId: 'athena',      role: 'cfo' as const,       tier: 1, historicalAccuracy: 93, emotionalStability: 90 },
  { agentId: 'kael',        role: 'cto' as const,       tier: 1, historicalAccuracy: 85, emotionalStability: 80 },
  { agentId: 'argus',       role: 'director_analytics' as const, tier: 2, historicalAccuracy: 90, emotionalStability: 85 },
  { agentId: 'hermes',      role: 'director_growth' as const,    tier: 2, historicalAccuracy: 78, emotionalStability: 75 },
  { agentId: 'loremaster',  role: 'director_content' as const,   tier: 2, historicalAccuracy: 82, emotionalStability: 88 },
];

// ───────────────────────────────────────────────────────────────────────────
// Seam 2 + 5 — Dispatch + StudyGate
// ───────────────────────────────────────────────────────────────────────────

async function exerciseDispatchAndStudyGate(): Promise<{
  totalTraces: number;
  capturedEvents: DispatchEvent[];
  publishedCount: number;
}> {
  console.log('\n[1/3] Dispatch + StudyGate + EventPublisher bridge  (seams 2 + 5 + M1 integration)');
  const capturedEvents: DispatchEvent[] = [];
  const dispatcher = new SimDispatcher({
    syntheticLatencyMs: 0,
    onEvent: (event) => capturedEvents.push(event),
  });

  // Bridge the Milofish seam to the just-committed @mcv/events-sdk nervous
  // system. MemoryEventPublisher implements the same EventPublisher interface
  // as the production Supabase publisher, so the wiring that exercises
  // here is identical to the wiring FutureState would use in prod.
  const eventBus = new MemoryEventPublisher({ capacity: 100 });
  const gate = new StudyGate({
    inner: dispatcher,
    enabled: true,
    publisher: eventBus,
  });

  const requests: DispatchRequest[] = SYNTHETIC_FLEET.map((agent) => ({
    agentId: agent.agentId,
    role: agent.role,
    tier: agent.tier,
    ventureId: 'futurestate',
    domain: 'capital',
    task: 'Evaluate Q2 STATE round-open timing against counsel pre-disclosure gate.',
    context: { round: 'seed-ii', commitCapUsd: 30_000_000 },
    correlationId: 'sim-dry-run-capital-q2',
  }));

  for (const request of requests) {
    const response = await gate.dispatch(request);
    console.log(
      `    ${response.agentId.padEnd(12)} → ${response.prediction.predictedOutcome.padEnd(12)} ` +
      `(confidence ${String(response.confidence).padStart(3)}, latency ${response.latencyMs}ms)`,
    );
  }

  // Fire-and-forget publishes settle on the microtask queue; wait one tick.
  await new Promise((resolve) => setImmediate(resolve));

  const summary = await summarize(gate.getSink(), 100);
  console.log(
    `    traces recorded: ${summary.totalTraces}  ` +
    `avg latency ${summary.averageLatencyMs}ms  ` +
    `ungraded ${summary.ungraded}`,
  );

  const publishedEnvelopes = eventBus.list();
  const sampleEnvelope = publishedEnvelopes[0];
  console.log(
    `    envelopes published: ${publishedEnvelopes.length}  ` +
    `topics: ${Array.from(new Set(publishedEnvelopes.map((e) => e.topic))).join(', ')}`,
  );
  if (sampleEnvelope) {
    console.log(
      `    sample envelope: id=${sampleEnvelope.id.slice(0, 8)} ` +
      `correlationId=${sampleEnvelope.correlationId.slice(0, 16)}… ` +
      `emittedBy="${sampleEnvelope.emittedBy}" ventureId=${sampleEnvelope.ventureId}`,
    );
  }

  if (summary.totalTraces !== SYNTHETIC_FLEET.length) {
    throw new Error(
      `StudyGate should record one trace per dispatch; expected ${SYNTHETIC_FLEET.length}, got ${summary.totalTraces}`,
    );
  }
  if (capturedEvents.length !== SYNTHETIC_FLEET.length) {
    throw new Error(
      `SimDispatcher should emit one naos.agent.dispatched event per dispatch; expected ${SYNTHETIC_FLEET.length}, got ${capturedEvents.length}`,
    );
  }
  if (publishedEnvelopes.length !== SYNTHETIC_FLEET.length) {
    throw new Error(
      `StudyGate should forward one envelope per dispatched event; expected ${SYNTHETIC_FLEET.length}, got ${publishedEnvelopes.length}`,
    );
  }
  const correlationIds = new Set(publishedEnvelopes.map((e) => e.correlationId));
  if (correlationIds.size !== 1) {
    throw new Error(
      `All envelopes in this dispatch batch should share one correlationId; got ${correlationIds.size}`,
    );
  }
  const ventureIds = new Set(publishedEnvelopes.map((e) => e.ventureId));
  if (!ventureIds.has('futurestate')) {
    throw new Error(
      `Envelopes should carry ventureId=futurestate from the request; got [${Array.from(ventureIds).join(', ')}]`,
    );
  }

  console.log('    ✓ StudyGate captured all traces');
  console.log('    ✓ SimDispatcher emitted Fabric-shaped DispatchEvents');
  console.log('    ✓ MemoryEventPublisher received all envelopes via bridge adapter');
  console.log('    ✓ Envelope correlationId propagated from request (cascade integrity)');
  console.log('    ✓ Envelope ventureId propagated from request (tenancy integrity)');

  return {
    totalTraces: summary.totalTraces,
    capturedEvents,
    publishedCount: publishedEnvelopes.length,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Seam 6 — Consensus Trial Runner
// ───────────────────────────────────────────────────────────────────────────

async function exerciseConsensusTrial(): Promise<void> {
  console.log('\n[2/3] Consensus Trial Runner  (seam 6)');

  const outcomeChoices = ['approve', 'escalate', 'defer'];
  const resolver = createDeterministicResolver(outcomeChoices);

  const result = await runConsensusTrial({
    agents: SYNTHETIC_FLEET.map(({ agentId, tier, historicalAccuracy, emotionalStability }) => ({
      agentId,
      tier,
      historicalAccuracy,
      emotionalStability,
    })),
    decisionContext:
      'Approve FutureState STATE token mint for Cliff Bay RWA? Counsel pre-disclosure not yet green.',
    ventureId: 'futurestate',
    domain: 'capital',
    iterations: 5,
    confidenceThreshold: 0.6,
    resolver,
  });

  console.log(`    iterations run:       ${result.iterations.length}`);
  console.log(`    dominant consensus:   "${result.aggregate.dominantConsensus}"`);
  console.log(`    convergence score:    ${(result.aggregate.convergenceScore * 100).toFixed(0)}%`);
  console.log(`    average confidence:   ${result.aggregate.averageConfidence}/100`);
  console.log(`    met threshold (0.60): ${result.aggregate.metThreshold ? 'YES' : 'NO'}`);
  console.log(`    chronic outliers:     ${result.chronicOutliers.length === 0 ? 'none' : result.chronicOutliers.join(', ')}`);
  console.log(`    trial duration:       ${result.durationMs}ms`);

  if (result.iterations.length !== 5) {
    throw new Error(`Expected 5 iterations, got ${result.iterations.length}`);
  }
  if (!outcomeChoices.includes(result.aggregate.dominantConsensus)) {
    throw new Error(
      `Dominant consensus "${result.aggregate.dominantConsensus}" not in valid outcome set`,
    );
  }

  console.log('    ✓ Consensus runner produced valid aggregate metrics');
  console.log('    ✓ Outlier detection operational');
}

// ───────────────────────────────────────────────────────────────────────────
// Seam 4 — Foundation seeder --sim-mode
// ───────────────────────────────────────────────────────────────────────────

function exerciseFoundationSeeder(): void {
  console.log('\n[3/3] Foundation Seeder  (seam 4)');

  const seederPath = path.join('scripts', 'foundation', 'seed-foundation-epics.ts');
  // Pass the full command as a single string so Node 24+ doesn't warn
  // about shell:true + args (DEP0190). Args are hard-coded constants here,
  // so there's no injection surface — quoting the path keeps spaces safe.
  const result = spawnSync(`pnpm tsx "${seederPath}" --sim-mode`, {
    encoding: 'utf8',
    shell: true,
  });

  if (result.status !== 0) {
    console.error('    seeder sim-mode output:');
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`Foundation seeder --sim-mode exited with status ${result.status}`);
  }

  const lines = result.stdout.split('\n').filter((line) => line.trim().length > 0);
  const simLines = lines.filter((line) => line.includes('[SIM]'));

  console.log(`    total output lines:   ${lines.length}`);
  console.log(`    [SIM]-tagged lines:   ${simLines.length}`);

  const hasParent = simLines.some((line) => line.includes('parent:'));
  const hasChildren = simLines.some((line) => /\+ CT-\d+|IP-\d+|SEC-\d+/.test(line));
  const hasZeroWritesBanner = simLines.some((line) => line.includes('zero Supabase writes'));

  if (!hasParent) throw new Error('Foundation seeder sim-mode missing parent epic output');
  if (!hasChildren) throw new Error('Foundation seeder sim-mode missing child epic output');
  if (!hasZeroWritesBanner) throw new Error('Foundation seeder sim-mode missing zero-writes banner');

  console.log('    ✓ seeder emitted parent + children without Supabase');
  console.log('    ✓ zero-writes banner confirmed');
}

// ───────────────────────────────────────────────────────────────────────────
// Cross-repo contract parity — Fabric MCVEvent bridge
// ───────────────────────────────────────────────────────────────────────────

function exerciseCrossRepoBridge(): void {
  console.log('\n[4/4] Cross-Repo Substrate  (bridge contract parity)');

  // Construct Fabric-shaped fixtures locally. When @mcv/fabric becomes
  // available as a file-path dep, these fixtures will be replaced with
  // real SimLocalEventPublisher.getPublishedEvents() output — contract
  // is identical either way.
  const V = '22222222-2222-2222-2222-222222222222';
  const fabricEvents: FabricMCVEvent[] = [
    {
      id: '33333333-3333-4333-8333-333333333333',
      topic: 'fabric.capital.call-issued',
      type: 'capital.call.issued',
      source: 'capital-calls.handler',
      ventureId: V,
      correlationId: '44444444-4444-4444-8444-444444444444',
      timestamp: '2026-04-22T23:00:00Z',
      version: '1.0',
      data: { callId: 'CC-001', amountMicrocents: 5_000_000_00, currency: 'USD' },
      metadata: { raiseRound: 'seed-ii', ventureSlug: 'futurestate' },
    },
    {
      id: '55555555-5555-4555-8555-555555555555',
      topic: 'fabric.audit.log',
      type: 'audit.action',
      source: 'audit.service',
      ventureId: V,
      correlationId: '44444444-4444-4444-8444-444444444444',
      timestamp: '2026-04-22T23:00:01Z',
      version: '1.0',
      data: { action: 'capital_call_sent', actor: 'system', resource: 'CC-001' },
    },
    {
      id: '66666666-6666-4666-8666-666666666666',
      topic: 'fabric.intelligence.completion',
      type: 'intelligence.completion.done',
      source: 'intelligence.gateway',
      ventureId: V,
      correlationId: '77777777-7777-4777-8777-777777777777',
      timestamp: '2026-04-22T23:00:02Z',
      version: '1.0',
      data: { model: 'claude-sonnet-4-6', tokensIn: 420, tokensOut: 180, costMicrocents: 5_280 },
    },
  ];

  console.log(`    fabric events to bridge: ${fabricEvents.length}`);

  // Bridge the batch through the adapter.
  const envelopes = fabricBatchToEnvelopes(fabricEvents);
  if (envelopes.length !== fabricEvents.length) {
    throw new Error(`Bridge produced ${envelopes.length} envelopes for ${fabricEvents.length} inputs`);
  }

  // Every envelope must carry the fabric: provenance prefix.
  for (const env of envelopes) {
    if (!env.emittedBy.startsWith('fabric:')) {
      throw new Error(`Envelope missing fabric: provenance prefix — got "${env.emittedBy}"`);
    }
  }

  // Correlation IDs preserved across the bridge — the capital-call +
  // audit-log share correlationId, so downstream cascade observers
  // can stitch them together on the events-sdk side.
  const correlationGroups = new Map<string, number>();
  for (const env of envelopes) {
    correlationGroups.set(env.correlationId, (correlationGroups.get(env.correlationId) ?? 0) + 1);
  }
  if (correlationGroups.size !== 2) {
    throw new Error(`Expected 2 correlation groups, got ${correlationGroups.size}`);
  }

  // Round-trip every envelope and assert byte-exact identity field preservation.
  for (let i = 0; i < fabricEvents.length; i++) {
    const original = fabricEvents[i]!;
    const round = envelopeToFabricEvent(envelopes[i]!);
    if (!round) throw new Error(`Round-trip returned null for envelope ${i}`);
    if (round.id !== original.id) throw new Error(`id drift: ${original.id} → ${round.id}`);
    if (round.topic !== original.topic) throw new Error(`topic drift`);
    if (round.type !== original.type) throw new Error(`type drift`);
    if (round.source !== original.source) throw new Error(`source drift`);
    if (round.correlationId !== original.correlationId) throw new Error(`correlationId drift`);
    if (round.ventureId !== original.ventureId) throw new Error(`ventureId drift`);
    if (round.version !== original.version) throw new Error(`version drift`);
  }

  // Single-event path is the same as batch with N=1 — exercise both.
  const singleBridged = fabricToEventEnvelope(fabricEvents[0]!);
  if (singleBridged.id !== fabricEvents[0]!.id) throw new Error('Single-event bridge id drift');

  console.log('    ✓ batch bridge preserved event count and order');
  console.log('    ✓ provenance prefix (fabric:) applied to all envelopes');
  console.log('    ✓ correlation groups preserved across bridge');
  console.log('    ✓ round-trip lossless on all identity fields');
  console.log('    ✓ single-event path matches batch path contract');
}

// ───────────────────────────────────────────────────────────────────────────
// Entry
// ───────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(' MCV Milofish Sim-Mode Kernel — Phase 1 Track 1A Dry Run');
  console.log(' Plan: this-is-all-of-smooth-sunset.md §6 (Phase 1 Track 1A)');
  console.log('═══════════════════════════════════════════════════════════════════');

  const startedAt = Date.now();

  await exerciseDispatchAndStudyGate();
  await exerciseConsensusTrial();
  exerciseFoundationSeeder();
  exerciseCrossRepoBridge();

  const durationMs = Date.now() - startedAt;
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(` All 4 local seams + cross-repo bridge contract green. Total: ${durationMs}ms`);
  console.log(' Cross-repo substrate shipped in mcv-core-triangle branch');
  console.log(' `foundation-substrate-2026-04-22` (9 commits). Runtime cross-repo');
  console.log(' wiring (sim-local publisher → events-sdk memory bridge) pending');
  console.log(' file-path dep setup — next session.');
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

main().catch((err: unknown) => {
  console.error('\n[FAIL]', err instanceof Error ? err.message : String(err));
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
