// HITL Study Gate — Milofish seam 5.
// Observes every agent decision pre-approval so Tony + Devon can replay
// decision traces, study where agents agree vs diverge, and measure
// prediction accuracy vs actual outcomes. Complements intercept-gate.ts:
// intercept-gate blocks for human approval on flagged kits; study-gate
// observes everything for learning and sim-parity validation.
//
// Activate via env: HITL_STUDY_MODE=true. When disabled, the wrapper is
// a pass-through with zero overhead.

import type {
  DispatchEvent,
  DispatchRequest,
  DispatchResponse,
  Dispatcher,
} from '@mcv/naos-sdk/dispatch';

// ---------------------------------------------------------------------------
// Captured trace shape
// ---------------------------------------------------------------------------

export interface StudyTrace {
  /** Stable trace id (useful for playback + cross-reference with Fabric events) */
  id: string;
  /** The dispatch request as received */
  request: DispatchRequest;
  /** The dispatcher's response */
  response: DispatchResponse;
  /** Events the dispatch emitted (mirror of response.emittedEvents) */
  events: DispatchEvent[];
  /** Milliseconds from request-received to response-produced */
  latencyMs: number;
  /** Wall-clock timestamp when the trace was sealed */
  capturedAt: string;
  /** Optional resolver outcome tag (filled post-hoc when Tony grades the decision) */
  humanVerdict?: 'matched-consensus' | 'overrode-consensus' | 'rejected' | 'deferred';
  /** Optional freeform notes */
  notes?: string;
}

// ---------------------------------------------------------------------------
// Trace sink contract
// ---------------------------------------------------------------------------

export interface StudyTraceSink {
  /** Persist a trace. Implementations may batch internally. */
  record(trace: StudyTrace): void | Promise<void>;
  /** Retrieve recent traces (most recent first). */
  list(options?: { limit?: number; agentId?: string }): StudyTrace[] | Promise<StudyTrace[]>;
  /** Update a trace with a human verdict after the fact. */
  grade(traceId: string, verdict: NonNullable<StudyTrace['humanVerdict']>, notes?: string): void | Promise<void>;
}

// ---------------------------------------------------------------------------
// In-memory ring buffer sink — default for local + sim runs
// ---------------------------------------------------------------------------

export class InMemoryStudyTraceSink implements StudyTraceSink {
  private buffer: StudyTrace[] = [];
  private readonly capacity: number;

  constructor(capacity = 1000) {
    this.capacity = capacity;
  }

  record(trace: StudyTrace): void {
    this.buffer.unshift(trace);
    if (this.buffer.length > this.capacity) {
      this.buffer.length = this.capacity;
    }
  }

  list(options: { limit?: number; agentId?: string } = {}): StudyTrace[] {
    const limit = options.limit ?? 100;
    const filtered = options.agentId
      ? this.buffer.filter((t) => t.request.agentId === options.agentId)
      : this.buffer;
    return filtered.slice(0, limit);
  }

  grade(
    traceId: string,
    verdict: NonNullable<StudyTrace['humanVerdict']>,
    notes?: string,
  ): void {
    const trace = this.buffer.find((t) => t.id === traceId);
    if (!trace) return;
    trace.humanVerdict = verdict;
    if (notes !== undefined) trace.notes = notes;
  }

  size(): number {
    return this.buffer.length;
  }

  clear(): void {
    this.buffer.length = 0;
  }
}

// ---------------------------------------------------------------------------
// StudyGate — dispatcher wrapper that observes every dispatch
// ---------------------------------------------------------------------------

export interface StudyGateOptions {
  /** Inner dispatcher (production or sim). Required. */
  inner: Dispatcher;
  /** Trace sink. Defaults to InMemoryStudyTraceSink with 1000 capacity. */
  sink?: StudyTraceSink;
  /** Whether the gate is enabled. When false, wrapper is a pass-through. */
  enabled?: boolean;
  /** Optional hook fired after every recorded trace (useful for live dashboards) */
  onTrace?: (trace: StudyTrace) => void;
}

export class StudyGate implements Dispatcher {
  readonly mode: Dispatcher['mode'];
  private readonly inner: Dispatcher;
  private readonly sink: StudyTraceSink;
  private readonly enabled: boolean;
  private readonly onTrace?: (trace: StudyTrace) => void;

  constructor(options: StudyGateOptions) {
    this.inner = options.inner;
    this.mode = options.inner.mode;
    this.sink = options.sink ?? new InMemoryStudyTraceSink();
    this.enabled = options.enabled ?? true;
    this.onTrace = options.onTrace;
  }

  async dispatch(request: DispatchRequest): Promise<DispatchResponse> {
    if (!this.enabled) {
      return this.inner.dispatch(request);
    }

    const startedAt = Date.now();
    const response = await this.inner.dispatch(request);
    const latencyMs = Date.now() - startedAt;

    const trace: StudyTrace = {
      id: generateTraceId(),
      request,
      response,
      events: response.emittedEvents,
      latencyMs,
      capturedAt: new Date().toISOString(),
    };

    // Fire-and-forget persistence — do not block the dispatch path on sink errors.
    try {
      const persistResult = this.sink.record(trace);
      if (persistResult && typeof (persistResult as Promise<void>).catch === 'function') {
        (persistResult as Promise<void>).catch((err) => {
          console.warn('[StudyGate] sink.record failed:', err);
        });
      }
    } catch (err) {
      console.warn('[StudyGate] sink.record threw:', err);
    }

    this.onTrace?.(trace);

    return response;
  }

  /** Expose the underlying sink for UI / analysis code. */
  getSink(): StudyTraceSink {
    return this.sink;
  }
}

// ---------------------------------------------------------------------------
// Trace-id generation
// ---------------------------------------------------------------------------

function generateTraceId(): string {
  // UUIDv7-esque: time-ordered prefix + random suffix. Collision-safe for
  // in-process use; swap for crypto.randomUUID() at boundaries that need it.
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `study-${ts}-${rand}`;
}

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

/**
 * Read HITL_STUDY_MODE from env + resolve to a boolean. Accepts true|1|yes|on
 * as enabled. Returns false by default so the gate never accidentally
 * activates in production without an explicit opt-in.
 */
export function isStudyModeEnabled(envValue: string | undefined): boolean {
  if (!envValue) return false;
  const normalized = envValue.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
}

// ---------------------------------------------------------------------------
// Analysis helpers — quick summaries for the Command Center sideview
// ---------------------------------------------------------------------------

export interface StudySummary {
  totalTraces: number;
  byAgent: Record<string, number>;
  byMode: Record<string, number>;
  averageLatencyMs: number;
  verdictCounts: Record<NonNullable<StudyTrace['humanVerdict']>, number>;
  /** Count of traces that are still ungraded */
  ungraded: number;
}

export async function summarize(sink: StudyTraceSink, limit = 500): Promise<StudySummary> {
  const traces = await sink.list({ limit });
  const byAgent: Record<string, number> = {};
  const byMode: Record<string, number> = {};
  const verdictCounts: StudySummary['verdictCounts'] = {
    'matched-consensus': 0,
    'overrode-consensus': 0,
    'rejected': 0,
    'deferred': 0,
  };
  let totalLatency = 0;
  let ungraded = 0;

  for (const trace of traces) {
    byAgent[trace.request.agentId] = (byAgent[trace.request.agentId] ?? 0) + 1;
    byMode[trace.response.mode] = (byMode[trace.response.mode] ?? 0) + 1;
    totalLatency += trace.latencyMs;
    if (trace.humanVerdict) {
      verdictCounts[trace.humanVerdict] += 1;
    } else {
      ungraded += 1;
    }
  }

  return {
    totalTraces: traces.length,
    byAgent,
    byMode,
    averageLatencyMs: traces.length > 0 ? Math.round(totalLatency / traces.length) : 0,
    verdictCounts,
    ungraded,
  };
}
