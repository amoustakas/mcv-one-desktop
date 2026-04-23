// Workflow Runner contract tests.
//
// Locks the Phase 3 / Marathon 4 Step 1 behavior: steps execute in order,
// state persists between steps, draft-gate pauses human-review flows,
// lifecycle events fire at every transition, failures short-circuit.

import { describe, it, expect } from 'vitest';

import { WorkflowRunner, type LifecycleEvent } from '../runner';
import { InMemoryArtifactStore } from '../draft-artifacts';
import type {
  AgentDispatcher,
  AgentDispatchResponse,
} from '../steps/dispatch-agent';
import type { QueryExecutor, SqlResult } from '../steps/sql';
import type { WorkflowDefinition, WorkflowRun, WorkflowTrigger } from '../types';

// ───────────────────────────────────────────────────────────────────────────
// Mocks
// ───────────────────────────────────────────────────────────────────────────

class StubDispatcher implements AgentDispatcher {
  calls: { agentHandle: string; task: string }[] = [];
  constructor(private readonly fn: (req: { task: string; agentHandle: string }) => AgentDispatchResponse) {}
  async dispatch(req: { task: string; agentHandle: string }): Promise<AgentDispatchResponse> {
    this.calls.push({ agentHandle: req.agentHandle, task: req.task });
    return this.fn(req);
  }
}

class StubExecutor implements QueryExecutor {
  calls: { sql: string; params: Record<string, unknown> }[] = [];
  constructor(private readonly fn: (sql: string, params: Record<string, unknown>) => SqlResult) {}
  async execute(query: { sql: string; params: Record<string, unknown> }): Promise<SqlResult> {
    this.calls.push({ sql: query.sql, params: query.params });
    return this.fn(query.sql, query.params);
  }
}

function makeTrigger(overrides: Partial<WorkflowTrigger> = {}): WorkflowTrigger {
  return {
    topic: 'capital.round.opened',
    payload: { roundId: 'seed-ii', roundName: 'FutureState Seed II' },
    ventureId: 'futurestate',
    correlationId: 'corr-1',
    ...overrides,
  };
}

function capturedRuns(): { persist: (r: WorkflowRun) => Promise<void>; snapshots: WorkflowRun[] } {
  const snapshots: WorkflowRun[] = [];
  return {
    persist: async (r) => { snapshots.push(structuredClone(r)); },
    snapshots,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Tests
// ───────────────────────────────────────────────────────────────────────────

describe('WorkflowRunner — sequential step execution', () => {
  it('runs a dispatch-agent → draft-gate(human) pair and pauses awaiting review', async () => {
    const events: LifecycleEvent[] = [];
    const dispatcher = new StubDispatcher(() => ({
      output: { letter: 'Hi investor, round Seed II is open.' },
      confidence: 0.85,
      decision: 'draft-letter',
    }));
    const store = new InMemoryArtifactStore();
    const executor = new StubExecutor(() => ({ rows: [], rowCount: 0 }));
    const { persist, snapshots } = capturedRuns();

    const runner = new WorkflowRunner({
      dispatcher,
      artifactStore: store,
      queryExecutor: executor,
      persistRun: persist,
      onLifecycleEvent: (e) => events.push(e),
    });

    const def: WorkflowDefinition = {
      id: 'capital.round-opened',
      name: 'Hermes LP outreach on round opened',
      triggerTopics: ['capital.round.opened'],
      steps: [
        {
          id: 'hermes-draft',
          kind: 'dispatch-agent',
          agentHandle: 'hermes',
          taskTemplate: 'Draft outreach letter for {{triggerPayload.roundName}}',
          ventureId: 'futurestate',
          domain: 'capital',
        },
        {
          id: 'inbox-gate',
          kind: 'draft-gate',
          artifactKind: 'lp-outreach-email',
          reviewTarget: 'human-inbox',
        },
      ],
    };

    const run = await runner.start(def, makeTrigger());

    expect(run.status).toBe('awaiting-review');
    expect(run.stepResults).toHaveLength(2);
    expect(run.stepResults[0].status).toBe('succeeded');
    expect(run.stepResults[1].status).toBe('succeeded');
    expect(run.artifactIds).toHaveLength(1);

    // Dispatcher got the rendered template
    expect(dispatcher.calls).toHaveLength(1);
    expect(dispatcher.calls[0].task).toContain('FutureState Seed II');

    // Store has the artifact in 'proposed' status
    const artifacts = await store.list();
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].status).toBe('proposed');
    expect(artifacts[0].kind).toBe('lp-outreach-email');
    expect(artifacts[0].agentHandle).toBe('hermes');
    expect(artifacts[0].confidence).toBe(0.85);

    // Lifecycle events fired
    expect(events.map((e) => e.kind)).toEqual([
      'workflow.started',
      'workflow.step.started',
      'workflow.step.succeeded',
      'workflow.step.started',
      'workflow.step.succeeded',
      'workflow.awaiting-review',
    ]);

    // Persistence called at every transition (5 advances: start + 2 steps + awaiting + persist)
    expect(snapshots.length).toBeGreaterThanOrEqual(3);
  });

  it('auto-approves when confidence >= threshold', async () => {
    const dispatcher = new StubDispatcher(() => ({
      output: { summary: 'audit complete' },
      confidence: 0.97,
      decision: 'complete',
    }));
    const store = new InMemoryArtifactStore();
    const executor = new StubExecutor(() => ({ rows: [], rowCount: 0 }));
    const { persist } = capturedRuns();

    const runner = new WorkflowRunner({
      dispatcher, artifactStore: store, queryExecutor: executor, persistRun: persist,
    });

    const def: WorkflowDefinition = {
      id: 'audit-auto',
      name: 'Auto-audit',
      triggerTopics: ['foundation.audit.triggered'],
      steps: [
        { id: 'audit', kind: 'dispatch-agent', agentHandle: 'argus',
          taskTemplate: 'Audit', ventureId: 'futurestate', domain: 'audit' },
        { id: 'auto', kind: 'draft-gate', artifactKind: 'audit-memo',
          reviewTarget: 'auto-approve', autoApproveConfidence: 0.95 },
      ],
    };

    const run = await runner.start(def, makeTrigger());
    expect(run.status).toBe('completed');
  });

  it('SHORT-CIRCUITS on step failure', async () => {
    const events: LifecycleEvent[] = [];
    const dispatcher = new StubDispatcher(() => {
      throw new Error('agent exploded');
    });
    const store = new InMemoryArtifactStore();
    const executor = new StubExecutor(() => ({ rows: [], rowCount: 0 }));
    const { persist } = capturedRuns();

    const runner = new WorkflowRunner({
      dispatcher, artifactStore: store, queryExecutor: executor, persistRun: persist,
      onLifecycleEvent: (e) => events.push(e),
    });

    const def: WorkflowDefinition = {
      id: 'fail',
      name: 'Failing workflow',
      triggerTopics: ['t'],
      steps: [
        { id: 'broken', kind: 'dispatch-agent', agentHandle: 'x', taskTemplate: 't', ventureId: 'v', domain: 'd' },
        { id: 'never-runs', kind: 'sql', sqlTemplate: 'SELECT 1', params: {}, mutating: false },
      ],
    };

    const run = await runner.start(def, makeTrigger());

    expect(run.status).toBe('failed');
    expect(run.failureReason).toContain('agent exploded');
    expect(run.stepResults).toHaveLength(1); // second step never ran
    expect(events.some((e) => e.kind === 'workflow.failed')).toBe(true);
  });

  it('chains prior-step outputs via {{stepId.output.field}} templates', async () => {
    const dispatcher = new StubDispatcher((req) => {
      if (req.agentHandle === 'first') {
        return { output: { score: 42 }, confidence: 0.7, decision: 'first' };
      }
      // Second agent should receive the first's score in its task
      return { output: { decision: `score-${req.task.match(/\d+/)?.[0]}` }, confidence: 0.8, decision: 'second' };
    });
    const store = new InMemoryArtifactStore();
    const executor = new StubExecutor(() => ({ rows: [], rowCount: 0 }));
    const { persist } = capturedRuns();

    const runner = new WorkflowRunner({
      dispatcher, artifactStore: store, queryExecutor: executor, persistRun: persist,
    });

    const def: WorkflowDefinition = {
      id: 'chain',
      name: 'Step chain',
      triggerTopics: ['t'],
      steps: [
        { id: 'first',  kind: 'dispatch-agent', agentHandle: 'first',  taskTemplate: 'Score this',
          ventureId: 'v', domain: 'd' },
        { id: 'second', kind: 'dispatch-agent', agentHandle: 'second',
          taskTemplate: 'Act on {{first.output.output.score}}',
          ventureId: 'v', domain: 'd' },
      ],
    };

    const run = await runner.start(def, makeTrigger());
    expect(run.status).toBe('completed');
    expect(dispatcher.calls[1].task).toBe('Act on 42');
  });

  it('resume() re-enters a paused run (e.g. after human approval)', async () => {
    const dispatcher = new StubDispatcher(() => ({
      output: { letter: 'ok' }, confidence: 0.5, decision: 'd',
    }));
    const store = new InMemoryArtifactStore();
    const executor = new StubExecutor(() => ({ rows: [], rowCount: 0 }));
    const { persist } = capturedRuns();

    const runner = new WorkflowRunner({
      dispatcher, artifactStore: store, queryExecutor: executor, persistRun: persist,
    });

    const def: WorkflowDefinition = {
      id: 'paused',
      name: 'Paused workflow',
      triggerTopics: ['t'],
      steps: [
        { id: 'draft', kind: 'dispatch-agent', agentHandle: 'a', taskTemplate: 't', ventureId: 'v', domain: 'd' },
        { id: 'gate', kind: 'draft-gate', artifactKind: 'x', reviewTarget: 'human-inbox' },
        { id: 'after', kind: 'sql', sqlTemplate: 'INSERT INTO t VALUES (:x)', params: { x: 1 }, mutating: true },
      ],
    };

    const run = await runner.start(def, makeTrigger());
    expect(run.status).toBe('awaiting-review');
    expect(run.stepResults).toHaveLength(2); // dispatch + gate

    // Simulate human approval — caller would flip artifact status externally,
    // then resume. Runner doesn't re-run the gate; advances past it.
    const resumed = await runner.resume(def, run);
    expect(resumed.status).toBe('completed');
    expect(resumed.stepResults).toHaveLength(3);
  });
});

describe('InMemoryArtifactStore', () => {
  it('transitions status + captures reviewer', async () => {
    const store = new InMemoryArtifactStore();
    const art = await store.create({
      kind: 'x', payload: {}, runId: 'r1', workflowId: 'w1',
      agentHandle: 'agent', ventureId: 'v', confidence: 0.5, status: 'proposed',
    });
    const transitioned = await store.transition(art.id, 'approved', { userId: 'tony', note: 'ship it' });
    expect(transitioned.status).toBe('approved');
    expect(transitioned.reviewerUserId).toBe('tony');
    expect(transitioned.reviewerNote).toBe('ship it');
  });

  it('list filters by status + applies limit', async () => {
    const store = new InMemoryArtifactStore();
    for (let i = 0; i < 5; i++) {
      await store.create({
        kind: 'x', payload: {}, runId: `r${i}`, workflowId: 'w',
        agentHandle: 'a', ventureId: 'v', confidence: 0.5, status: 'proposed',
      });
    }
    for (let i = 0; i < 3; i++) {
      await store.create({
        kind: 'x', payload: {}, runId: `r-app-${i}`, workflowId: 'w',
        agentHandle: 'a', ventureId: 'v', confidence: 0.5, status: 'approved',
      });
    }
    expect((await store.list({ status: 'proposed' })).length).toBe(5);
    expect((await store.list({ status: 'approved' })).length).toBe(3);
    expect((await store.list({ limit: 2 })).length).toBe(2);
  });
});
