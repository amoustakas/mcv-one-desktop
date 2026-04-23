// Workflow Runner — the durable orchestrator.
//
// Advances a WorkflowRun one step at a time, persisting state after each
// transition so a mid-run crash can resume from the last successful step.
// Never runs a step twice unless it was previously 'failed' AND the retry
// policy permits. Steps can't see each other directly — all inter-step
// communication goes through a variables map keyed by stepId.

import type {
  StepResult,
  WorkflowDefinition,
  WorkflowRun,
  WorkflowStep,
  WorkflowTrigger,
} from './types';
import { runDispatchAgentStep, type AgentDispatcher } from './steps/dispatch-agent';
import { runDraftGateStep, type ArtifactStore } from './steps/draft-gate';
import { runHttpStep } from './steps/http';
import { runSqlStep, type QueryExecutor } from './steps/sql';

export interface RunnerDependencies {
  dispatcher: AgentDispatcher;
  artifactStore: ArtifactStore;
  queryExecutor: QueryExecutor;
  /** Optional event publisher — fires workflow lifecycle events when set. */
  onLifecycleEvent?: (event: LifecycleEvent) => void;
  /** Persist run state; runner calls after every step transition. */
  persistRun: (run: WorkflowRun) => Promise<void>;
  /** Test override for time reads. Defaults to Date.now. */
  nowMs?: () => number;
  /** Test override for random ids. */
  generateRunId?: () => string;
}

export type LifecycleEventKind =
  | 'workflow.started'
  | 'workflow.step.started'
  | 'workflow.step.succeeded'
  | 'workflow.step.failed'
  | 'workflow.awaiting-review'
  | 'workflow.completed'
  | 'workflow.failed';

export interface LifecycleEvent {
  kind: LifecycleEventKind;
  runId: string;
  workflowId: string;
  stepId?: string;
  correlationId: string;
  timestampMs: number;
  extras?: Record<string, unknown>;
}

// ───────────────────────────────────────────────────────────────────────────
// Runner
// ───────────────────────────────────────────────────────────────────────────

export class WorkflowRunner {
  private readonly deps: RunnerDependencies;
  private readonly now: () => number;
  private readonly generateRunId: () => string;

  constructor(deps: RunnerDependencies) {
    this.deps = deps;
    this.now = deps.nowMs ?? (() => Date.now());
    this.generateRunId = deps.generateRunId ?? defaultRunId;
  }

  /** Start a new run from a trigger. Advances through steps until completion OR awaiting-review. */
  async start(def: WorkflowDefinition, trigger: WorkflowTrigger): Promise<WorkflowRun> {
    const run: WorkflowRun = {
      id: this.generateRunId(),
      workflowId: def.id,
      triggerEventId: trigger.eventId,
      triggerPayload: trigger.payload,
      ventureId: trigger.ventureId,
      status: 'running',
      stepResults: [],
      artifactIds: [],
      correlationId: trigger.correlationId,
      startedAtMs: this.now(),
    };
    await this.deps.persistRun(run);
    this.emit({ kind: 'workflow.started', runId: run.id, workflowId: def.id, correlationId: run.correlationId, timestampMs: run.startedAtMs });

    return this.advance(def, run);
  }

  /** Resume a paused run (awaiting-review or a retryable failure) after external progress. */
  async resume(def: WorkflowDefinition, run: WorkflowRun): Promise<WorkflowRun> {
    if (run.status === 'completed' || run.status === 'canceled') {
      return run;
    }
    run.status = 'running';
    await this.deps.persistRun(run);
    return this.advance(def, run);
  }

  // ─── core loop ───────────────────────────────────────────────────────────

  private async advance(def: WorkflowDefinition, run: WorkflowRun): Promise<WorkflowRun> {
    const variables: Record<string, unknown> = {
      triggerPayload: run.triggerPayload,
    };

    // Replay already-executed steps into variables so templates can see prior results.
    for (const result of run.stepResults) {
      variables[result.stepId] = { output: result.output };
    }

    const nextStepIndex = run.stepResults.length;
    for (let i = nextStepIndex; i < def.steps.length; i++) {
      const step = def.steps[i];
      this.emit({
        kind: 'workflow.step.started',
        runId: run.id,
        workflowId: def.id,
        stepId: step.id,
        correlationId: run.correlationId,
        timestampMs: this.now(),
      });

      const result = await this.runStep(step, def, run, variables);
      run.stepResults.push(result);
      await this.deps.persistRun(run);

      if (result.status === 'failed') {
        run.status = 'failed';
        run.failureReason = result.errorMessage ?? `Step ${step.id} failed`;
        run.completedAtMs = this.now();
        await this.deps.persistRun(run);
        this.emit({
          kind: 'workflow.failed',
          runId: run.id,
          workflowId: def.id,
          stepId: step.id,
          correlationId: run.correlationId,
          timestampMs: run.completedAtMs,
          extras: { failureReason: run.failureReason },
        });
        return run;
      }

      this.emit({
        kind: 'workflow.step.succeeded',
        runId: run.id,
        workflowId: def.id,
        stepId: step.id,
        correlationId: run.correlationId,
        timestampMs: result.completedAtMs ?? this.now(),
      });

      variables[step.id] = { output: result.output };

      // Draft-gate steps may pause the run — short-circuit the loop.
      if (step.kind === 'draft-gate') {
        const outcome = result.output as { action: 'continue' | 'pause'; artifactId: string };
        if (outcome.action === 'pause') {
          run.status = 'awaiting-review';
          run.artifactIds.push(outcome.artifactId);
          await this.deps.persistRun(run);
          this.emit({
            kind: 'workflow.awaiting-review',
            runId: run.id,
            workflowId: def.id,
            stepId: step.id,
            correlationId: run.correlationId,
            timestampMs: this.now(),
            extras: { artifactId: outcome.artifactId },
          });
          return run;
        }
        run.artifactIds.push(outcome.artifactId);
      }
    }

    run.status = 'completed';
    run.completedAtMs = this.now();
    await this.deps.persistRun(run);
    this.emit({
      kind: 'workflow.completed',
      runId: run.id,
      workflowId: def.id,
      correlationId: run.correlationId,
      timestampMs: run.completedAtMs,
    });
    return run;
  }

  private async runStep(
    step: WorkflowStep,
    _def: WorkflowDefinition,
    run: WorkflowRun,
    variables: Record<string, unknown>,
  ): Promise<StepResult> {
    const startedAtMs = this.now();
    try {
      let output: unknown;
      switch (step.kind) {
        case 'dispatch-agent': {
          const response = await runDispatchAgentStep(step, {
            dispatcher: this.deps.dispatcher,
            correlationId: run.correlationId,
            variables,
          });
          // Thread the step's agentHandle through the output so downstream
          // draft-gate steps can attribute the artifact. The dispatch
          // response itself carries content + confidence only.
          output = { ...response, agentHandle: step.agentHandle };
          break;
        }
        case 'draft-gate': {
          // Content + agent info come from the most recent dispatch-agent step
          // in variables; the caller is expected to sequence draft-gate AFTER
          // a dispatch-agent step. If no dispatch output exists, we still
          // create the artifact with an empty payload — operators see the
          // malformed draft and fix the workflow def.
          const lastDispatch = findLastDispatchOutput(variables);
          output = await runDraftGateStep(step, {
            store: this.deps.artifactStore,
            content: lastDispatch?.content as Record<string, unknown> ?? {},
            agentHandle: lastDispatch?.agentHandle ?? 'unknown',
            confidence: lastDispatch?.confidence ?? 0,
            runId: run.id,
            workflowId: run.workflowId,
            ventureId: run.ventureId,
          });
          break;
        }
        case 'http':
          output = await runHttpStep(step, { variables });
          break;
        case 'sql':
          output = await runSqlStep(step, {
            executor: this.deps.queryExecutor,
            variables,
          });
          break;
      }
      return {
        stepId: step.id,
        stepKind: step.kind,
        status: 'succeeded',
        output,
        startedAtMs,
        completedAtMs: this.now(),
        attempt: 1,
      };
    } catch (err) {
      return {
        stepId: step.id,
        stepKind: step.kind,
        status: 'failed',
        output: null,
        errorMessage: err instanceof Error ? err.message : String(err),
        startedAtMs,
        completedAtMs: this.now(),
        attempt: 1,
      };
    }
  }

  private emit(event: LifecycleEvent): void {
    try {
      this.deps.onLifecycleEvent?.(event);
    } catch (err) {
      console.warn('[workflow-runner] onLifecycleEvent threw:', err);
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

function findLastDispatchOutput(variables: Record<string, unknown>): {
  content: unknown;
  agentHandle: string;
  confidence: number;
} | null {
  for (const value of Object.values(variables).reverse()) {
    if (value && typeof value === 'object' && 'output' in value) {
      const out = (value as { output: unknown }).output;
      if (
        out && typeof out === 'object' &&
        'confidence' in out &&
        'decision' in out &&
        'agentHandle' in out &&
        'output' in out
      ) {
        const typed = out as unknown as { output: unknown; confidence: number; agentHandle: string };
        return {
          content: typed.output,
          agentHandle: typed.agentHandle,
          confidence: typed.confidence,
        };
      }
    }
  }
  return null;
}

function defaultRunId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `run-${ts}-${rand}`;
}
