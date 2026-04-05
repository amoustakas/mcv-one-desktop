import type { KitInstance, HITLRequest, HITLResponse, ToolCallResult, TuningTrace } from '../kits/types';
import type { ToolCallEvent } from '../claude';
import { useHITL } from '../../stores/hitl';
import { flightRecorder } from '../telemetry/flight-recorder';

// ---------------------------------------------------------------------------
// HITLGate — intercepts tool execution for kits that require human approval.
// Returns a Promise that resolves when the operator approves/rejects/modifies.
// ---------------------------------------------------------------------------

function generateId(): string {
  return `hitl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class HITLGate {
  /**
   * Check if a kit requires human approval before tool execution.
   */
  shouldIntercept(kit: KitInstance): boolean {
    return kit.manifest.requires_human_approval === true;
  }

  /**
   * Request operator approval for a tool call.
   * Blocks execution until the operator responds.
   * Returns the (possibly modified) input if approved, or throws if rejected.
   */
  async requestApproval(
    kit: KitInstance,
    toolCall: ToolCallEvent,
  ): Promise<{ approved: true; input: Record<string, unknown> } | { approved: false; error: string }> {
    const request: HITLRequest = {
      id: generateId(),
      toolCallId: toolCall.id,
      kitId: kit.manifest.id,
      toolName: toolCall.name,
      input: toolCall.input,
      timestamp: Date.now(),
      reason: `Kit "${kit.manifest.name}" requires human approval`,
    };

    flightRecorder.recordHITL('hitl_request', {
      requestId: request.id,
      kitId: request.kitId,
      toolName: request.toolName,
    });
    flightRecorder.addStep('tool_dispatch', `HITL: Awaiting approval for ${request.kitId}/${request.toolName}`);

    const store = useHITL.getState();
    const response: HITLResponse = await store.requestApproval(request);

    flightRecorder.recordHITL('hitl_response', {
      requestId: request.id,
      decision: response.decision,
    });

    if (response.decision === 'rejected') {
      return { approved: false, error: `Operator rejected: ${request.toolName}` };
    }

    // Use modified input if the operator edited it, otherwise original
    const finalInput = response.decision === 'modified' && response.modifiedInput
      ? response.modifiedInput
      : toolCall.input;

    return { approved: true, input: finalInput };
  }

  /**
   * Record an approved tool execution as a tuning trace.
   */
  recordApprovedTrace(
    messages: Array<{ role: string; content: string }>,
    toolCall: { name: string; input: Record<string, unknown> },
    toolResult: ToolCallResult,
  ): void {
    const trace: TuningTrace = {
      id: generateId(),
      messages,
      toolCall,
      toolResult,
      decision: 'approved',
      timestamp: Date.now(),
    };
    useHITL.getState().addTrace(trace);
  }
}

/** Singleton instance */
export const hitlGate = new HITLGate();
