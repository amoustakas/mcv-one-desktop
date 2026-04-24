/**
 * IntelligenceRouter public types.
 *
 * Spec: Plan §1.1 (12-substrate catalog), §1.2 (API surface).
 * Router ships 7 substrate adapters in Phase-1: semantic, personal,
 * episodic, procedural, social, referential, long-term.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TelemetryRecorder } from './telemetry.js';

/* ------------------------------------------------------------------
 * Substrates
 * ---------------------------------------------------------------- */

export const SUBSTRATES = [
  'semantic',
  'personal',
  'episodic',
  'procedural',
  'social',
  'referential',
  'long-term',
] as const;

export type SubstrateKind = typeof SUBSTRATES[number];

/* ------------------------------------------------------------------
 * Observe kinds (Plan §1.2 routing table)
 * ---------------------------------------------------------------- */

export const OBSERVE_KINDS = [
  'fact',            // → long-term
  'preference',      // → long-term
  'constraint',      // → long-term
  'decision',        // → long-term
  'chunk',           // → semantic (storage_chunks)
  'interaction',     // → episodic (naos_interactions)
  'emotional_shift', // → social (naos_emotional_state)
  'relationship_update', // → social (naos_relationships)
  'connection_fact', // → REJECTED — oauth stays outside Router
  'document',        // → deferred (M6 Documentation OS); rejected in Phase-1
] as const;

export type ObserveKind = typeof OBSERVE_KINDS[number];

/** Which observe kinds are accepted by Phase-1 Router. */
export const ACCEPTED_OBSERVE_KINDS: ReadonlySet<ObserveKind> = new Set<ObserveKind>([
  'fact', 'preference', 'constraint', 'decision',
  'chunk', 'interaction', 'emotional_shift', 'relationship_update',
]);

/* ------------------------------------------------------------------
 * Provenance + shared shapes
 * ---------------------------------------------------------------- */

export interface Provenance {
  source: string;              // e.g. 'draft:<id>', 'workflow:<id>', 'event:<id>', 'agent:<handle>'
  correlationId?: string;
  causationId?: string;
  eventId?: string;
  driver?: string;             // e.g. 'knowledge-observer', 'dispatch-agent'
  [key: string]: unknown;
}

/* ------------------------------------------------------------------
 * Recall
 * ---------------------------------------------------------------- */

export interface RecallArgs {
  query: string;
  layers?: SubstrateKind[];    // default ['semantic','personal','episodic']
  topK?: number;               // default 8, max 50
  filters?: {
    agentHandle?: string;
    ventureId?: string;
    userId?: string;
    kinds?: ObserveKind[];     // filter long-term by memory_kind
    correlationId?: string;    // for episodic trace-scoped recall
    since?: string;            // ISO-8601; filter recency
  };
}

export interface RecallHit {
  id: string;
  substrate: SubstrateKind;
  content: string;
  similarity: number;          // 0..1, cosine sim if vector; fallback 0.5 for non-vector substrates
  recencyScore: number;        // 0..1, decay from now
  confidence: number;          // 0..1, substrate-reported
  rrfScore?: number;           // populated after fusion
  compositeScore?: number;     // populated after composite re-rank
  provenance: Provenance;
  metadata?: Record<string, unknown>;
}

export interface RecallResult {
  query: string;
  hits: RecallHit[];
  perLayer: Partial<Record<SubstrateKind, { count: number; latencyMs: number; error?: string }>>;
  totalLatencyMs: number;
  traceId: string;
}

/* ------------------------------------------------------------------
 * Observe
 * ---------------------------------------------------------------- */

export interface ObserveArgs {
  kind: ObserveKind;
  content: string;
  provenance: Provenance;
  confidence: number;          // 0..1
  tags?: string[];
  ventureId?: string;
  userId?: string;
  agentHandle?: string;
  /** Supersedes a previous memory (long-term kind only). */
  supersedesId?: string;
  /** Skip embedding (e.g. for constraints that don't need semantic recall). */
  skipEmbedding?: boolean;
}

export interface ObserveResult {
  id: string;
  substrate: SubstrateKind;
  kind: ObserveKind;
  backpressureHit: boolean;
}

/* ------------------------------------------------------------------
 * Trace
 * ---------------------------------------------------------------- */

export interface TraceArgs {
  correlationId: string;
  depth?: number;              // default 10 causal hops
}

export interface TraceEvent {
  eventId: string;
  topic: string;
  emittedAt: string;
  emittedBy: string;
  payload: unknown;
  correlationId: string;
  causationId?: string;
}

export interface TraceResult {
  correlationId: string;
  events: TraceEvent[];        // ordered by emittedAt ASC
  interactions: Array<{
    id: string;
    agentHandle: string;
    interactionType: string;
    outcome: string | null;
    createdAt: string;
  }>;
  drafts: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
}

/* ------------------------------------------------------------------
 * Personality + Context (light read-only helpers)
 * ---------------------------------------------------------------- */

export interface PersonalityPayload {
  agentHandle: string;
  traits: Record<string, number>;
  emotionalState?: Record<string, number>;
  domainMastery?: Record<string, unknown>;
  lastUpdated: string;
}

export interface ContextArgs {
  artifact: { kind: 'draft' | 'workflow' | 'event'; id: string };
}

export interface ContextPayload {
  artifact: ContextArgs['artifact'];
  resolvedRefs: Array<{ kind: string; id: string; label?: string; data?: unknown }>;
  relatedMemories: RecallHit[];
}

/* ------------------------------------------------------------------
 * Record (structured interaction write, not free-form observe)
 * ---------------------------------------------------------------- */

export interface InteractionRow {
  agentId: string;
  ventureId?: string;
  interactionType: string;
  context: Record<string, unknown>;
  outcome?: string;
  humanFeedback?: string;
  peerFeedback?: Record<string, unknown>;
  traitDeltas?: Record<string, number>;
  emotionalDeltas?: Record<string, number>;
  skillsAffected?: string[];
}

/* ------------------------------------------------------------------
 * Constructor opts
 * ---------------------------------------------------------------- */

export interface EventPublisher {
  /** Publish an event. Mirrors @mcv/events-sdk publisher shape. */
  publish(
    topic: string,
    payload: unknown,
    context?: { ventureId?: string; correlationId?: string; causationId?: string; emittedBy?: string }
  ): Promise<unknown>;
}

export interface EmbedFn {
  (text: string): Promise<number[]>;
}

export interface RecallCache {
  get(key: string): Promise<RecallResult | null>;
  set(key: string, value: RecallResult, ttlSeconds: number): Promise<void>;
}

export interface RouterOpts {
  supabase: SupabaseClient;
  events: EventPublisher;
  tenantId: string;
  ventureId?: string;
  userId?: string;
  agentHandle?: string;
  embed: EmbedFn;
  cache?: RecallCache;
  telemetry?: TelemetryRecorder;
  /** Max observe writes per second per tenant. Default 100. */
  observeRateLimit?: number;
}

/* ------------------------------------------------------------------
 * Internal substrate adapter contract
 * ---------------------------------------------------------------- */

export interface SubstrateContext {
  supabase: SupabaseClient;
  tenantId: string;
  ventureId?: string;
  userId?: string;
  agentHandle?: string;
}

export interface SubstrateAdapter {
  readonly kind: SubstrateKind;
  recall(
    args: RecallArgs,
    queryEmbedding: number[] | null,
    ctx: SubstrateContext
  ): Promise<RecallHit[]>;
}

/** Optional — not every substrate accepts writes. */
export interface WritableSubstrateAdapter extends SubstrateAdapter {
  observe(args: ObserveArgs, embedding: number[] | null, ctx: SubstrateContext): Promise<{ id: string }>;
}

/* ------------------------------------------------------------------
 * Errors
 * ---------------------------------------------------------------- */

export class RouterError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'RouterError';
  }
}

export class BackpressureError extends RouterError {
  constructor(message = 'observe rate limit exceeded') {
    super('E_BACKPRESSURE', message);
    this.name = 'BackpressureError';
  }
}

export class SubstrateRejectedError extends RouterError {
  constructor(kind: ObserveKind) {
    super('E_SUBSTRATE_REJECTED', `observe kind "${kind}" is not accepted by the Router`);
    this.name = 'SubstrateRejectedError';
  }
}
