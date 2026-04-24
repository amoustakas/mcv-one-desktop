// Dispatch-agent step handler.
//
// Delegates to a caller-provided AgentDispatcher. Handler in this package
// stays SDK-level (no Claude, no Supabase, no Fabric) — the app wires the
// real dispatcher at boot. This keeps the workflow SDK testable with a
// mock dispatcher.
//
// Phase-1 addition: optional `intel` on DispatchStepContext. When provided,
// the step calls `intel.recall(...)` before prompt composition to inject
// a <long_term_memory> block, and `intel.observe(...)` after completion
// to persist the decision to agent_memory_longterm. Back-compat guarded —
// existing callers without `intel` keep working unchanged.
//
// Uses a structural type for intel so workflow-sdk doesn't take a
// hard dependency on @mcv/intelligence-sdk-router.

import type { DispatchAgentStep } from '../types';

export interface AgentDispatchRequest {
  agentHandle: string;
  task: string;
  ventureId: string;
  domain: string;
  correlationId: string;
  timeoutMs?: number;
}

export interface AgentDispatchResponse {
  output: unknown;
  confidence: number;
  /** Raw decision text or decision descriptor */
  decision: string;
}

export interface AgentDispatcher {
  dispatch(request: AgentDispatchRequest): Promise<AgentDispatchResponse>;
}

/**
 * Structural type for IntelligenceRouter — avoids a runtime dep on
 * @mcv/intelligence-sdk-router. Only the methods the step calls are
 * required; full Router type is compatible.
 */
export interface DispatchIntelligence {
  recall(args: {
    query: string;
    layers?: readonly string[];
    topK?: number;
    filters?: Record<string, unknown>;
  }): Promise<{
    hits: Array<{ content: string; substrate: string; compositeScore?: number }>;
  }>;
  observe(args: {
    kind: 'fact' | 'preference' | 'constraint' | 'decision' | string;
    content: string;
    provenance: { source: string; correlationId?: string; [k: string]: unknown };
    confidence: number;
    tags?: string[];
    ventureId?: string;
    agentHandle?: string;
  }): Promise<{ id: string; substrate: string; kind: string; backpressureHit: boolean }>;
}

export interface DispatchStepContext {
  dispatcher: AgentDispatcher;
  correlationId: string;
  /** Variables available for {{...}} template substitution (prior-step outputs). */
  variables: Record<string, unknown>;
  /**
   * Phase-1 optional IntelligenceRouter. When provided, the step
   * prefixes the dispatched task with a <long_term_memory> block of
   * top-N recall hits, and writes a decision memory after completion.
   */
  intel?: DispatchIntelligence;
  /** Top-K for recall injection. Default 8. */
  intelTopK?: number;
  /** Substrate layers to consult. Default ['semantic','personal','episodic']. */
  intelLayers?: readonly string[];
}

const MEMORY_BLOCK_TAGS = { open: '<long_term_memory>', close: '</long_term_memory>' } as const;

/** Compose a task with an injected memory block. */
function injectMemoryBlock(task: string, hits: Array<{ content: string; substrate: string; compositeScore?: number }>): string {
  if (hits.length === 0) return task;
  const body = hits
    .map((h, i) => `  ${i + 1}. [${h.substrate}] ${h.content}`)
    .join('\n');
  return `${MEMORY_BLOCK_TAGS.open}\n${body}\n${MEMORY_BLOCK_TAGS.close}\n\n${task}`;
}

/** Execute a dispatch-agent step. */
export async function runDispatchAgentStep(
  step: DispatchAgentStep,
  ctx: DispatchStepContext,
): Promise<AgentDispatchResponse> {
  const renderedTask = renderTemplate(step.taskTemplate, ctx.variables);

  // Phase-1 recall injection (opt-in via ctx.intel).
  let task = renderedTask;
  if (ctx.intel) {
    try {
      const recalled = await ctx.intel.recall({
        query: renderedTask,
        layers: ctx.intelLayers ?? ['semantic', 'personal', 'episodic'],
        topK: ctx.intelTopK ?? 8,
      });
      task = injectMemoryBlock(renderedTask, recalled.hits);
    } catch {
      // Recall errors don't fail the step — fall back to un-augmented task.
      task = renderedTask;
    }
  }

  const response = await ctx.dispatcher.dispatch({
    agentHandle: step.agentHandle,
    task,
    ventureId: step.ventureId,
    domain: step.domain,
    correlationId: ctx.correlationId,
    timeoutMs: step.timeoutMs,
  });

  // Phase-1 observe-after-completion (opt-in via ctx.intel).
  if (ctx.intel && typeof response.decision === 'string' && response.decision.length > 0) {
    try {
      await ctx.intel.observe({
        kind: 'decision',
        content: response.decision.slice(0, 2000),
        provenance: {
          source: `workflow:dispatch-agent:${step.agentHandle}`,
          correlationId: ctx.correlationId,
          driver: 'dispatch-agent',
          agentHandle: step.agentHandle,
          ventureId: step.ventureId,
        },
        confidence: typeof response.confidence === 'number' ? response.confidence : 0.9,
        tags: [`agent:${step.agentHandle}`, `venture:${step.ventureId}`, `domain:${step.domain}`],
        ventureId: step.ventureId,
        agentHandle: step.agentHandle,
      });
    } catch {
      // Observe errors don't fail the step — agent decision already landed.
    }
  }

  return response;
}

/**
 * Render `{{step.output.field}}` templates from a variables map. Missing
 * keys render as empty strings — the workflow runner logs + continues.
 * Intentionally minimal; for heavier templating, callers can preprocess.
 */
export function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, expr: string) => {
    const value = resolvePath(vars, expr.trim());
    return value === undefined || value === null ? '' : String(value);
  });
}

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
