import type { KitInstance, KitExecutionContext, ToolCallResult } from './types';
import { getDefaultSandbox } from './sandbox';

// ---------------------------------------------------------------------------
// Kit Execution Bridge
// ---------------------------------------------------------------------------
// Decides where to run a kit tool and dispatches accordingly:
//   - 'inline' (builtin kits): direct handler call, no sandbox
//   - 'worker': Web Worker sandbox for untrusted code
//   - 'serverless': POST to /api/kit-execute for credential-sensitive ops

/**
 * Execute a kit tool via the appropriate runtime.
 * This is the single entry point for all kit tool execution.
 */
export async function executeKitTool(
  kit: KitInstance,
  toolName: string,
  input: Record<string, unknown>,
  context: KitExecutionContext,
): Promise<ToolCallResult> {
  const runtime = kit.manifest.runtime;

  switch (runtime) {
    case 'inline':
      return executeInline(kit, toolName, input, context);

    case 'worker':
      return executeInWorker(kit, toolName, input);

    case 'serverless':
      return executeServerside(kit, toolName, input, context);

    default:
      return { success: false, error: `Unknown runtime: ${runtime}` };
  }
}

/** Direct handler call — for built-in trusted kits */
async function executeInline(
  kit: KitInstance,
  toolName: string,
  input: Record<string, unknown>,
  context: KitExecutionContext,
): Promise<ToolCallResult> {
  const handler = kit.handlers[toolName];
  if (!handler) {
    return { success: false, error: `No handler for tool "${toolName}" in kit "${kit.manifest.id}"` };
  }

  try {
    return await handler(input, context);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Handler execution failed',
    };
  }
}

/** Web Worker sandbox — for untrusted/downloaded kits */
async function executeInWorker(
  kit: KitInstance,
  toolName: string,
  input: Record<string, unknown>,
): Promise<ToolCallResult> {
  // Kit code must be available as a string bundle for the worker
  // For now, this requires the kit to have a `_bundleCode` property
  // (set during kit installation from registry in Phase 4)
  const bundleCode = (kit as KitInstance & { _bundleCode?: string })._bundleCode;
  if (!bundleCode) {
    return {
      success: false,
      error: `Kit "${kit.manifest.id}" has no bundle code for worker execution`,
    };
  }

  const sandbox = getDefaultSandbox();
  return sandbox.execute(bundleCode, toolName, input, { timeout: 30000 });
}

/** Server-side execution — for kits needing credentials or Node.js APIs */
async function executeServerside(
  kit: KitInstance,
  toolName: string,
  input: Record<string, unknown>,
  context: KitExecutionContext,
): Promise<ToolCallResult> {
  try {
    const res = await context.fetch('/api/kit-execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kitId: kit.manifest.id,
        toolName,
        input,
        ventureId: context.ventureId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Server execution failed' }));
      return { success: false, error: err.error || `Server error: ${res.status}` };
    }

    const data = await res.json().catch(() => ({ success: false, error: 'Non-JSON server response' }));
    return data as ToolCallResult;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Server-side execution failed',
    };
  }
}
