// NAOS Dispatch — agent activation seam
// Milofish seam 2: sim-synthetic resolver lets every production flow run in
// offline sim-mode without real Claude API calls or Supabase writes.
//
// Mode selection happens at dispatcher construction; the Dispatcher interface
// is stable across modes. Apps wire the correct implementation at startup
// based on AGENT_MODE env or feature flag.

import type { AgentRole, InteractionOutcome, Prediction } from './types';
import { createPrediction } from './prediction';

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

/** Dispatcher activation mode. Drives which resolver handles a dispatch call. */
export type AgentMode =
  | 'production'      // real Claude + real Fabric + real DB writes
  | 'sim-synthetic'   // rule-based resolver, no API calls, events go to sim-publisher
  | 'sim-trace';      // replay from recorded decision trace (reproducible sim)

// ---------------------------------------------------------------------------
// Request / Response contract
// ---------------------------------------------------------------------------

export interface DispatchRequest {
  /** UUID of the agent being dispatched */
  agentId: string;
  /** Functional role (resolver may switch behavior by role) */
  role: AgentRole;
  /** Tier (1-5); affects autonomy checks and consensus weighting */
  tier: number;
  /** Venture context */
  ventureId: string;
  /** Domain of the work */
  domain: string;
  /** Task description — what the agent is being asked to decide/produce */
  task: string;
  /** Arbitrary context payload (resolver-specific) */
  context: Record<string, unknown>;
  /** Optional correlation id for tracing across trials/iterations */
  correlationId?: string;
}

export interface DispatchResponse {
  /** UUID of the dispatched agent */
  agentId: string;
  /** The agent's primary prediction/decision for this request */
  prediction: Prediction;
  /** Raw decision text (may match prediction.predictedOutcome or elaborate on it) */
  decision: string;
  /** Outcome of the dispatch itself (not the downstream effect of the decision) */
  outcome: InteractionOutcome;
  /** Agent's self-assessed confidence (0-100) */
  confidence: number;
  /** Milliseconds spent producing the decision */
  latencyMs: number;
  /** Mode under which this dispatch ran */
  mode: AgentMode;
  /** Optional events emitted during dispatch (sim-publisher captures these) */
  emittedEvents: DispatchEvent[];
}

/** Structured event emitted by a dispatch. Matches Fabric event shape. */
export interface DispatchEvent {
  topic: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Dispatcher interface
// ---------------------------------------------------------------------------

export interface Dispatcher {
  mode: AgentMode;
  dispatch(request: DispatchRequest): Promise<DispatchResponse>;
}

// ---------------------------------------------------------------------------
// Sim-synthetic dispatcher
// ---------------------------------------------------------------------------

export interface SimSyntheticResolver {
  /**
   * Produce a decision for a dispatched agent.
   * Must be deterministic given the same inputs — sim-parity depends on it.
   */
  (request: DispatchRequest): {
    decision: string;
    predictedOutcome: string;
    confidence: number;
  };
}

export interface SimDispatcherOptions {
  /** Decision resolver. Defaults to a rule-based role/tier heuristic. */
  resolver?: SimSyntheticResolver;
  /** Artificial latency to simulate real-world round trips (ms). Default 0. */
  syntheticLatencyMs?: number;
  /** Optional event sink. Captures events instead of publishing (sim-mode pattern). */
  onEvent?: (event: DispatchEvent) => void;
}

/**
 * Sim dispatcher for offline / synthetic-user runs. Produces deterministic
 * decisions based on role + tier + task hash. Emits the same Fabric-shaped
 * events a production dispatch would, routed through onEvent so the
 * sim-publisher (seam 1) can capture them for parity validation.
 */
export class SimDispatcher implements Dispatcher {
  readonly mode: AgentMode = 'sim-synthetic';
  private readonly resolver: SimSyntheticResolver;
  private readonly syntheticLatencyMs: number;
  private readonly onEvent?: (event: DispatchEvent) => void;

  constructor(options: SimDispatcherOptions = {}) {
    this.resolver = options.resolver ?? defaultRoleBasedResolver;
    this.syntheticLatencyMs = options.syntheticLatencyMs ?? 0;
    this.onEvent = options.onEvent;
  }

  async dispatch(request: DispatchRequest): Promise<DispatchResponse> {
    const startedAt = Date.now();

    if (this.syntheticLatencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.syntheticLatencyMs));
    }

    const resolved = this.resolver(request);

    const prediction = createPrediction(
      request.agentId,
      request.ventureId,
      request.domain,
      request.task,
      resolved.predictedOutcome,
      resolved.confidence,
    );

    const emittedEvents: DispatchEvent[] = [];
    const dispatchEvent: DispatchEvent = {
      topic: 'naos.agent.dispatched',
      aggregateId: request.agentId,
      payload: {
        agentId: request.agentId,
        role: request.role,
        tier: request.tier,
        ventureId: request.ventureId,
        domain: request.domain,
        task: request.task,
        correlationId: request.correlationId,
        mode: this.mode,
        decision: resolved.decision,
        confidence: resolved.confidence,
      },
      timestamp: new Date().toISOString(),
    };
    emittedEvents.push(dispatchEvent);
    this.onEvent?.(dispatchEvent);

    return {
      agentId: request.agentId,
      prediction,
      decision: resolved.decision,
      outcome: 'pending',
      confidence: resolved.confidence,
      latencyMs: Date.now() - startedAt,
      mode: this.mode,
      emittedEvents,
    };
  }
}

// ---------------------------------------------------------------------------
// Sim-trace dispatcher — replay from recorded traces
// ---------------------------------------------------------------------------

export interface TraceEntry {
  /** Matches on agentId + task hash + correlationId (if provided) */
  agentId: string;
  taskKey: string;
  decision: string;
  predictedOutcome: string;
  confidence: number;
  outcome: InteractionOutcome;
}

export interface TraceStore {
  lookup(agentId: string, task: string, correlationId?: string): TraceEntry | undefined;
}

/**
 * Trace-replay dispatcher. Looks up pre-recorded decisions from a TraceStore.
 * Used for reproducibility studies: "given this exact input sequence, does
 * the agent fleet produce the same output sequence?" Falls back to a
 * synthetic resolver when no trace entry matches (configurable).
 */
export class TraceDispatcher implements Dispatcher {
  readonly mode: AgentMode = 'sim-trace';
  private readonly store: TraceStore;
  private readonly fallback?: Dispatcher;
  private readonly onEvent?: (event: DispatchEvent) => void;

  constructor(options: {
    store: TraceStore;
    fallback?: Dispatcher;
    onEvent?: (event: DispatchEvent) => void;
  }) {
    this.store = options.store;
    this.fallback = options.fallback;
    this.onEvent = options.onEvent;
  }

  async dispatch(request: DispatchRequest): Promise<DispatchResponse> {
    const startedAt = Date.now();
    const entry = this.store.lookup(request.agentId, request.task, request.correlationId);

    if (!entry) {
      if (this.fallback) return this.fallback.dispatch(request);
      throw new Error(
        `TraceDispatcher: no entry for agent ${request.agentId} task "${request.task}" (correlationId=${request.correlationId ?? 'none'})`,
      );
    }

    const prediction = createPrediction(
      request.agentId,
      request.ventureId,
      request.domain,
      request.task,
      entry.predictedOutcome,
      entry.confidence,
    );

    const emittedEvents: DispatchEvent[] = [];
    const traceEvent: DispatchEvent = {
      topic: 'naos.agent.dispatched',
      aggregateId: request.agentId,
      payload: {
        agentId: request.agentId,
        role: request.role,
        tier: request.tier,
        ventureId: request.ventureId,
        domain: request.domain,
        task: request.task,
        correlationId: request.correlationId,
        mode: this.mode,
        decision: entry.decision,
        confidence: entry.confidence,
        tracedFrom: entry.taskKey,
      },
      timestamp: new Date().toISOString(),
    };
    emittedEvents.push(traceEvent);
    this.onEvent?.(traceEvent);

    return {
      agentId: request.agentId,
      prediction,
      decision: entry.decision,
      outcome: entry.outcome,
      confidence: entry.confidence,
      latencyMs: Date.now() - startedAt,
      mode: this.mode,
      emittedEvents,
    };
  }
}

// ---------------------------------------------------------------------------
// Default rule-based resolver
// ---------------------------------------------------------------------------

/**
 * Baseline resolver for sim-synthetic mode. Decision text + outcome are
 * deterministic per (agentId, task) — same inputs always produce same output.
 * Confidence scales with tier (higher tier = more confident) + task length
 * (longer tasks = more hedged confidence).
 */
const defaultRoleBasedResolver: SimSyntheticResolver = (request) => {
  const key = `${request.agentId}:${request.task}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }

  const decisionVariants = [
    `Proceed with ${request.domain} action per ${request.role} playbook`,
    `Escalate — outside ${request.role} authority for ${request.domain}`,
    `Defer — insufficient context for confident ${request.domain} call`,
    `Propose alternative approach in ${request.domain}`,
  ];
  const decisionIndex = Math.abs(hash) % decisionVariants.length;
  const decision = decisionVariants[decisionIndex];

  const outcomeVariants = [
    'approve',
    'escalate',
    'defer',
    'alternative',
  ];
  const predictedOutcome = outcomeVariants[decisionIndex];

  // Confidence: higher tier = base higher; long tasks reduce confidence
  const tierConfidence = Math.max(20, 100 - request.tier * 12);
  const taskLengthPenalty = Math.min(30, Math.floor(request.task.length / 50));
  const confidence = Math.max(10, Math.min(100, tierConfidence - taskLengthPenalty));

  return { decision, predictedOutcome, confidence };
};

// ---------------------------------------------------------------------------
// In-memory TraceStore helper — convenient for tests + local sim runs
// ---------------------------------------------------------------------------

export class InMemoryTraceStore implements TraceStore {
  private entries = new Map<string, TraceEntry>();

  set(agentId: string, taskKey: string, entry: Omit<TraceEntry, 'agentId' | 'taskKey'>): void {
    this.entries.set(this.key(agentId, taskKey), {
      agentId,
      taskKey,
      ...entry,
    });
  }

  lookup(agentId: string, task: string, correlationId?: string): TraceEntry | undefined {
    const withCorrelation = correlationId
      ? this.entries.get(this.key(agentId, `${task}|${correlationId}`))
      : undefined;
    return withCorrelation ?? this.entries.get(this.key(agentId, task));
  }

  private key(agentId: string, taskKey: string): string {
    return `${agentId}::${taskKey}`;
  }
}

// ---------------------------------------------------------------------------
// Mode resolution from env / flag
// ---------------------------------------------------------------------------

/**
 * Read AGENT_MODE from environment with safe default. Apps call this at
 * startup to pick the correct dispatcher wiring. Unknown values fall back
 * to production to prevent sim-mode leaking into real deployments.
 */
export function resolveAgentMode(envValue: string | undefined): AgentMode {
  switch ((envValue ?? '').toLowerCase()) {
    case 'sim-synthetic':
    case 'sim_synthetic':
      return 'sim-synthetic';
    case 'sim-trace':
    case 'sim_trace':
      return 'sim-trace';
    case '':
    case 'production':
    case 'prod':
      return 'production';
    default:
      return 'production';
  }
}

/** Type guard — is this dispatcher running in any sim mode? */
export function isSimMode(mode: AgentMode): boolean {
  return mode === 'sim-synthetic' || mode === 'sim-trace';
}
