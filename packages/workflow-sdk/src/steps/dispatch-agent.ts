// Dispatch-agent step handler.
//
// Delegates to a caller-provided AgentDispatcher. Handler in this package
// stays SDK-level (no Claude, no Supabase, no Fabric) — the app wires the
// real dispatcher at boot. This keeps the workflow SDK testable with a
// mock dispatcher.

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

export interface DispatchStepContext {
  dispatcher: AgentDispatcher;
  correlationId: string;
  /** Variables available for {{...}} template substitution (prior-step outputs). */
  variables: Record<string, unknown>;
}

/** Execute a dispatch-agent step. */
export async function runDispatchAgentStep(
  step: DispatchAgentStep,
  ctx: DispatchStepContext,
): Promise<AgentDispatchResponse> {
  const task = renderTemplate(step.taskTemplate, ctx.variables);
  const response = await ctx.dispatcher.dispatch({
    agentHandle: step.agentHandle,
    task,
    ventureId: step.ventureId,
    domain: step.domain,
    correlationId: ctx.correlationId,
    timeoutMs: step.timeoutMs,
  });
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
