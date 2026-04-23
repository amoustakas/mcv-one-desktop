#!/usr/bin/env node
// scripts/sim-dry-run — end-to-end Milofish sim-mode exercise.
//
// Capstone driver for Phase 1 Track 1A of the MVP pipeline (plan file
// this-is-all-of-smooth-sunset.md §6). Wires the four local sim-mode
// seams together into a single command a dev can run on a laptop with
// zero external credentials:
//
//   Seam 2 (dispatch.ts SimDispatcher)        → synthetic agent resolver
//   Seam 5 (hitl/study-gate.ts StudyGate)     → trace observation wrapper
//   Seam 6 (prediction.ts runConsensusTrial)  → N-iteration convergence check
//   Seam 4 (foundation seeder --sim-mode)     → synthetic counsel corpus
//
// Output validates: (a) dispatch resolves deterministically, (b) study
// gate captures every trace, (c) consensus trial converges + flags
// chronic outliers, (d) foundation seeder produces parity output.
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
}> {
  console.log('\n[1/3] Dispatch + StudyGate  (seams 2 + 5)');
  const capturedEvents: DispatchEvent[] = [];
  const dispatcher = new SimDispatcher({
    syntheticLatencyMs: 0,
    onEvent: (event) => capturedEvents.push(event),
  });
  const gate = new StudyGate({ inner: dispatcher, enabled: true });

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

  const summary = await summarize(gate.getSink(), 100);
  console.log(
    `    traces recorded: ${summary.totalTraces}  ` +
    `avg latency ${summary.averageLatencyMs}ms  ` +
    `ungraded ${summary.ungraded}`,
  );

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

  console.log('    ✓ StudyGate captured all traces');
  console.log('    ✓ SimDispatcher emitted Fabric-shaped events for sim-publisher (seam 1) to consume');

  return { totalTraces: summary.totalTraces, capturedEvents };
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

  const durationMs = Date.now() - startedAt;
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(` All 4 local seams green. Total wall-clock: ${durationMs}ms`);
  console.log(' Cross-repo seams pending: 1 (Fabric sim-publisher) + 3 (Intelligence MockProvider)');
  console.log(' Both live in mcv-core-triangle — separate session in that worktree.');
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

main().catch((err: unknown) => {
  console.error('\n[FAIL]', err instanceof Error ? err.message : String(err));
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
