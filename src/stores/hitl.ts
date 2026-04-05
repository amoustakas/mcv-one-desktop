import { create } from 'zustand';
import type { HITLRequest, HITLResponse, HITLDecision, TuningTrace } from '../lib/kits/types';

// ---------------------------------------------------------------------------
// HITL Store — pending requests, response history, and tuning traces
// ---------------------------------------------------------------------------

interface PendingRequest extends HITLRequest {
  resolve: (response: HITLResponse) => void;
}

interface HITLState {
  pendingRequests: PendingRequest[];
  history: Array<HITLRequest & { response: HITLResponse }>;
  tuningTraces: TuningTrace[];

  /** Create a pending request. Returns a Promise that resolves when the operator responds. */
  requestApproval: (request: HITLRequest) => Promise<HITLResponse>;

  /** Operator responds to a pending request */
  respond: (requestId: string, decision: HITLDecision, modifiedInput?: Record<string, unknown>) => void;

  /** Add a tuning trace (from approved tool executions) */
  addTrace: (trace: TuningTrace) => void;

  /** Export all traces as JSONL string */
  exportTraces: () => string;

  /** Clear all traces */
  clearTraces: () => void;

  /** Get count of pending requests */
  getPendingCount: () => number;
}

const AUTO_REJECT_TIMEOUT_MS = 60_000; // 60 seconds

export const useHITL = create<HITLState>()((set, get) => ({
  pendingRequests: [],
  history: [],
  tuningTraces: [],

  requestApproval: (request) => {
    return new Promise<HITLResponse>((resolve) => {
      const pending: PendingRequest = { ...request, resolve };
      set((s) => ({ pendingRequests: [...s.pendingRequests, pending] }));

      // Auto-reject after timeout
      setTimeout(() => {
        const state = get();
        if (state.pendingRequests.some((p) => p.id === request.id)) {
          const response: HITLResponse = {
            requestId: request.id,
            decision: 'rejected',
            respondedAt: Date.now(),
          };
          set((s) => ({
            pendingRequests: s.pendingRequests.filter((p) => p.id !== request.id),
            history: [...s.history, { ...request, response }],
          }));
          resolve(response);
        }
      }, AUTO_REJECT_TIMEOUT_MS);
    });
  },

  respond: (requestId, decision, modifiedInput) => {
    const state = get();
    const pending = state.pendingRequests.find((p) => p.id === requestId);
    if (!pending) return;

    const response: HITLResponse = {
      requestId,
      decision,
      modifiedInput: decision === 'modified' ? modifiedInput : undefined,
      respondedAt: Date.now(),
    };

    // Remove from pending, add to history, resolve the promise
    set((s) => ({
      pendingRequests: s.pendingRequests.filter((p) => p.id !== requestId),
      history: [...s.history, { ...pending, response }],
    }));

    pending.resolve(response);
  },

  addTrace: (trace) =>
    set((s) => ({ tuningTraces: [...s.tuningTraces, trace] })),

  exportTraces: () => {
    const traces = get().tuningTraces;
    return traces.map((t) => JSON.stringify({
      messages: t.messages,
      tool_calls: [{ name: t.toolCall.name, arguments: t.toolCall.input }],
      tool_results: [{ content: t.toolResult.displayMarkdown || JSON.stringify(t.toolResult.data) }],
      decision: t.decision,
    })).join('\n');
  },

  clearTraces: () => set({ tuningTraces: [] }),

  getPendingCount: () => get().pendingRequests.length,
}));
