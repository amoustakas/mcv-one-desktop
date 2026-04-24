/**
 * @mcv/intelligence-sdk-router
 *
 * Unified recall/observe across 7 memory/knowledge substrates.
 * Spec: Plan §1.1–1.6.
 *
 * Usage:
 *
 *   const router = new IntelligenceRouter({
 *     supabase, events, tenantId, ventureId, userId, agentHandle,
 *     embed: (text) => fetch('/api/_embeddings', { ... }).then(r => r.json()).then(r => r[0]),
 *     telemetry: new ConsoleTelemetryRecorder(),
 *   });
 *
 *   await router.recall({ query: 'who owns the IP?', layers: ['semantic','long-term'] });
 *   await router.observe({ kind: 'decision', content: 'MTY split approved',
 *                          provenance: { source: 'draft:<id>' }, confidence: 1.0 });
 *
 * PHASE-1 local shipment. Promotion path: mcv-core-triangle/packages/intelligence-sdk/src/router/
 * once foundation-substrate-2026-04-22 merges on core-triangle/main.
 *
 * Future architecture hooks (v0.2+, not Phase-1):
 *   - writeGuard — device-attestation hook on observe(); Tony's Jarvis-tier biometric gate.
 *   - distill — scoped memory export for cross-venture distribution.
 */

import type {
  ContextArgs, ContextPayload,
  InteractionRow,
  ObserveArgs, ObserveResult,
  PersonalityPayload,
  RecallArgs, RecallHit, RecallResult,
  RouterOpts,
  SubstrateContext, SubstrateKind, SubstrateAdapter, WritableSubstrateAdapter,
  TraceArgs, TraceResult,
} from './types.js';
import {
  ACCEPTED_OBSERVE_KINDS,
  BackpressureError,
  SubstrateRejectedError,
} from './types.js';
import { rerank, recencyScore } from './ranker.js';
import { BackpressureRegistry } from './backpressure.js';
import {
  NoopTelemetryRecorder,
  ROUTER_SPAN_NAMES,
  MCV_TELEMETRY_ATTRS,
  type TelemetryRecorder,
} from './telemetry.js';
import { semanticAdapter } from './substrates/semantic.js';
import { personalAdapter } from './substrates/personal.js';
import { episodicAdapter } from './substrates/episodic.js';
import { proceduralAdapter } from './substrates/procedural.js';
import { socialAdapter } from './substrates/social.js';
import { referentialAdapter } from './substrates/referential.js';
import { longTermAdapter } from './substrates/long-term.js';

export * from './types.js';
export * as telemetry from './telemetry.js';
export * as determinism from './determinism.js';
export * as ranker from './ranker.js';
export { BackpressureRegistry, TokenBucket } from './backpressure.js';

export const DEFAULT_RECALL_LAYERS: SubstrateKind[] = ['semantic', 'personal', 'episodic'];

const ADAPTERS: Record<SubstrateKind, SubstrateAdapter> = {
  semantic: semanticAdapter,
  personal: personalAdapter,
  episodic: episodicAdapter,
  procedural: proceduralAdapter,
  social: socialAdapter,
  referential: referentialAdapter,
  'long-term': longTermAdapter,
};

const WRITABLE_ADAPTERS: Partial<Record<SubstrateKind, WritableSubstrateAdapter>> = {
  'long-term': longTermAdapter,
};

/** Routing table for observe() — plan §1.2. */
function kindToSubstrate(kind: ObserveArgs['kind']): SubstrateKind {
  switch (kind) {
    case 'fact':
    case 'preference':
    case 'constraint':
    case 'decision':
      return 'long-term';
    case 'chunk':
      return 'semantic';
    case 'interaction':
      return 'episodic';
    case 'emotional_shift':
    case 'relationship_update':
      return 'social';
    case 'connection_fact':
    case 'document':
      throw new SubstrateRejectedError(kind);
    default:
      throw new SubstrateRejectedError(kind);
  }
}

export class IntelligenceRouter {
  readonly opts: RouterOpts;
  private readonly telemetry: TelemetryRecorder;
  private readonly backpressure: BackpressureRegistry;
  private tenantReady: Promise<void> | null = null;

  constructor(opts: RouterOpts) {
    if (!opts.tenantId) throw new Error('IntelligenceRouter: tenantId is required');
    if (!opts.supabase) throw new Error('IntelligenceRouter: supabase is required');
    if (!opts.events) throw new Error('IntelligenceRouter: events is required');
    if (typeof opts.embed !== 'function') throw new Error('IntelligenceRouter: embed fn is required');
    this.opts = opts;
    this.telemetry = opts.telemetry ?? new NoopTelemetryRecorder();
    this.backpressure = new BackpressureRegistry(opts.observeRateLimit ?? 100);
  }

  /**
   * Ensure `app.tenant_id` is set on the Supabase session BEFORE any
   * RLS-gated query runs. Idempotent — memoized per instance.
   */
  private async ensureTenant(): Promise<void> {
    if (this.tenantReady) return this.tenantReady;
    this.tenantReady = (async () => {
      const { error } = await this.opts.supabase.rpc('set_tenant', { t: this.opts.tenantId });
      if (error) {
        throw new Error(`IntelligenceRouter: set_tenant failed — ${error.message}`);
      }
    })();
    return this.tenantReady;
  }

  private buildCtx(): SubstrateContext {
    return {
      supabase: this.opts.supabase,
      tenantId: this.opts.tenantId,
      ventureId: this.opts.ventureId,
      userId: this.opts.userId,
      agentHandle: this.opts.agentHandle,
    };
  }

  /**
   * recall — fan-out to requested layers in parallel, RRF-fuse, re-rank.
   */
  async recall(args: RecallArgs): Promise<RecallResult> {
    await this.ensureTenant();
    const span = this.telemetry.startSpan(ROUTER_SPAN_NAMES.RECALL, {
      attributes: {
        [MCV_TELEMETRY_ATTRS.VENTURE_ID]: this.opts.ventureId ?? '',
        [MCV_TELEMETRY_ATTRS.USER_ID]: this.opts.userId ?? '',
        'router.query.length': args.query.length,
        'router.layers': (args.layers ?? DEFAULT_RECALL_LAYERS).join(','),
        'router.topK': args.topK ?? 8,
      },
    });

    const started = Date.now();
    const traceId = span.span.traceId;
    const layers = (args.layers ?? DEFAULT_RECALL_LAYERS).filter((l, i, a) => a.indexOf(l) === i);
    const needsEmbedding = layers.some((l) => l === 'semantic' || l === 'long-term');

    try {
      let queryEmbedding: number[] | null = null;
      if (needsEmbedding) {
        queryEmbedding = await this.opts.embed(args.query);
      }

      const ctx = this.buildCtx();
      const perLayer: Partial<Record<SubstrateKind, RecallHit[]>> = {};
      const perLayerStats: RecallResult['perLayer'] = {};

      await Promise.all(layers.map(async (kind) => {
        const adapter = ADAPTERS[kind];
        const layerStart = Date.now();
        try {
          const hits = await adapter.recall(args, queryEmbedding, ctx);
          perLayer[kind] = hits;
          perLayerStats[kind] = { count: hits.length, latencyMs: Date.now() - layerStart };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          perLayerStats[kind] = { count: 0, latencyMs: Date.now() - layerStart, error: msg };
          span.addEvent('router.layer.error', { layer: kind, message: msg });
        }
      }));

      const fused = rerank(perLayer);
      const topK = Math.min(args.topK ?? 8, 50);
      const hits = fused.slice(0, topK);
      const totalLatencyMs = Date.now() - started;

      span.setAttribute('router.hits.count', hits.length);
      span.setAttribute('router.totalLatencyMs', totalLatencyMs);
      span.setStatus('ok');

      // Emit knowledge.recall.completed event (best-effort; don't fail recall on publish error).
      try {
        await this.opts.events.publish(
          'knowledge.recall.completed',
          {
            query: args.query,
            layers,
            topK,
            hitCount: hits.length,
            perLayer: perLayerStats,
            traceId,
          },
          {
            ventureId: this.opts.ventureId,
            emittedBy: this.opts.agentHandle ? `agent:${this.opts.agentHandle}` : 'router',
          }
        );
      } catch (err) {
        span.addEvent('router.emit.error', { message: err instanceof Error ? err.message : String(err) });
      }

      return {
        query: args.query,
        hits,
        perLayer: perLayerStats,
        totalLatencyMs,
        traceId,
      };
    } catch (err) {
      span.recordError(err);
      throw err;
    } finally {
      span.end();
    }
  }

  /**
   * observe — route a write by kind into the appropriate substrate.
   */
  async observe(args: ObserveArgs): Promise<ObserveResult> {
    if (!ACCEPTED_OBSERVE_KINDS.has(args.kind)) {
      throw new SubstrateRejectedError(args.kind);
    }
    await this.ensureTenant();

    const span = this.telemetry.startSpan(ROUTER_SPAN_NAMES.OBSERVE, {
      attributes: {
        [MCV_TELEMETRY_ATTRS.VENTURE_ID]: this.opts.ventureId ?? '',
        'router.observe.kind': args.kind,
      },
    });

    try {
      // Backpressure check BEFORE the DB write.
      if (!this.backpressure.allow(this.opts.tenantId)) {
        try {
          await this.opts.events.publish('knowledge.backpressure.triggered', {
            tenantId: this.opts.tenantId,
            kind: args.kind,
            droppedAt: new Date().toISOString(),
          }, { ventureId: this.opts.ventureId, emittedBy: 'router' });
        } catch {
          /* noop */
        }
        span.setAttribute('router.backpressure.hit', true);
        span.setStatus('error');
        throw new BackpressureError();
      }

      const substrate = kindToSubstrate(args.kind);
      const adapter = WRITABLE_ADAPTERS[substrate];
      if (!adapter) {
        throw new SubstrateRejectedError(args.kind);
      }

      // Embed if the substrate can hold vector embeddings (long-term/semantic).
      const wantsEmbedding =
        (substrate === 'long-term' || substrate === 'semantic') && !args.skipEmbedding;
      const embedding = wantsEmbedding ? await this.opts.embed(args.content) : null;

      const ctx = this.buildCtx();
      const { id } = await adapter.observe(args, embedding, ctx);

      try {
        await this.opts.events.publish('knowledge.memory.observed', {
          memoryId: id,
          substrate,
          kind: args.kind,
          confidence: args.confidence,
          provenance: args.provenance,
          tags: args.tags ?? [],
        }, {
          ventureId: this.opts.ventureId,
          correlationId: typeof args.provenance.correlationId === 'string'
            ? args.provenance.correlationId
            : undefined,
          emittedBy: this.opts.agentHandle ? `agent:${this.opts.agentHandle}` : 'router',
        });
      } catch (err) {
        span.addEvent('router.emit.error', { message: err instanceof Error ? err.message : String(err) });
      }

      span.setAttribute('router.observe.id', id);
      span.setStatus('ok');
      return { id, substrate, kind: args.kind, backpressureHit: false };
    } catch (err) {
      if (!(err instanceof BackpressureError)) span.recordError(err);
      throw err;
    } finally {
      span.end();
    }
  }

  /**
   * trace — return the causal chain + interactions + drafts for one
   * correlation_id. Read-only.
   */
  async trace(args: TraceArgs): Promise<TraceResult> {
    await this.ensureTenant();
    const span = this.telemetry.startSpan(ROUTER_SPAN_NAMES.TRACE, {
      attributes: { 'router.trace.correlationId': args.correlationId },
    });
    try {
      const [evtRes, draftRes] = await Promise.all([
        this.opts.supabase
          .from('event_log')
          .select('id, topic, correlation_id, causation_id, venture_id, emitted_at, emitted_by, payload')
          .eq('correlation_id', args.correlationId)
          .order('emitted_at', { ascending: true })
          .limit(args.depth ?? 50),
        this.opts.supabase
          .from('agent_drafts')
          .select('id, title, status, created_at')
          .eq('correlation_key', args.correlationId)
          .order('created_at', { ascending: true }),
      ]);

      const events = ((evtRes.data ?? []) as Array<{
        id: string; topic: string; correlation_id: string; causation_id: string | null;
        venture_id: string | null; emitted_at: string; emitted_by: string; payload: unknown;
      }>).map((e) => ({
        eventId: e.id,
        topic: e.topic,
        emittedAt: e.emitted_at,
        emittedBy: e.emitted_by,
        payload: e.payload,
        correlationId: e.correlation_id,
        causationId: e.causation_id ?? undefined,
      }));

      const drafts = ((draftRes.data ?? []) as Array<{
        id: string; title: string; status: string; created_at: string;
      }>).map((d) => ({ id: d.id, title: d.title, status: d.status, createdAt: d.created_at }));

      span.setStatus('ok');
      return {
        correlationId: args.correlationId,
        events,
        interactions: [],
        drafts,
      };
    } catch (err) {
      span.recordError(err);
      throw err;
    } finally {
      span.end();
    }
  }

  /**
   * personality — load a single agent's personality + emotional snapshot.
   * M3 will flesh this out; Phase-1 returns a minimal payload.
   */
  async personality(args: { agentHandle: string }): Promise<PersonalityPayload> {
    await this.ensureTenant();
    let traits: Record<string, number> = {};
    let emotionalState: Record<string, number> | undefined;
    let lastUpdated = new Date().toISOString();
    try {
      const { data: agent } = await this.opts.supabase
        .from('agents').select('id').eq('handle', args.agentHandle).maybeSingle();
      const agentId = (agent as { id: string } | null)?.id;
      if (agentId) {
        const { data: p } = await this.opts.supabase
          .from('naos_personality')
          .select('*').eq('agent_id', agentId).maybeSingle();
        if (p) {
          const row = p as Record<string, unknown>;
          traits = Object.fromEntries(
            Object.entries(row).filter(([k, v]) => typeof v === 'number' && k !== 'agent_id')
          ) as Record<string, number>;
          lastUpdated = (row.updated_at as string) ?? lastUpdated;
        }
        const { data: e } = await this.opts.supabase
          .from('naos_emotional_state')
          .select('*').eq('agent_id', agentId).maybeSingle();
        if (e) {
          const row = e as Record<string, unknown>;
          emotionalState = Object.fromEntries(
            Object.entries(row).filter(([k, v]) => typeof v === 'number' && k !== 'agent_id')
          ) as Record<string, number>;
        }
      }
    } catch {
      /* graceful — M3 tables may not be fully wired */
    }
    return { agentHandle: args.agentHandle, traits, emotionalState, lastUpdated };
  }

  /**
   * context — resolve an artifact (draft / workflow / event) to its
   * refs + related memories.
   */
  async context(args: ContextArgs): Promise<ContextPayload> {
    await this.ensureTenant();
    const span = this.telemetry.startSpan(ROUTER_SPAN_NAMES.CONTEXT, {
      attributes: { 'router.context.artifact': `${args.artifact.kind}:${args.artifact.id}` },
    });
    try {
      const resolvedRefs: ContextPayload['resolvedRefs'] = [];
      let relatedQuery = '';

      if (args.artifact.kind === 'draft') {
        const { data } = await this.opts.supabase
          .from('agent_drafts')
          .select('id, title, summary, context_refs')
          .eq('id', args.artifact.id)
          .maybeSingle();
        const draft = data as { id: string; title: string; summary: string | null; context_refs: unknown } | null;
        if (draft) {
          relatedQuery = [draft.title, draft.summary].filter(Boolean).join(' — ');
          if (Array.isArray(draft.context_refs)) {
            for (const r of draft.context_refs) {
              if (!r || typeof r !== 'object') continue;
              const ref = r as { kind?: string; id?: string; label?: string };
              if (ref.kind && ref.id) {
                resolvedRefs.push({ kind: ref.kind, id: ref.id, label: ref.label });
              }
            }
          }
        }
      }

      const related: RecallHit[] = relatedQuery
        ? (await this.recall({ query: relatedQuery, topK: 6, layers: ['semantic', 'long-term'] })).hits
        : [];

      span.setStatus('ok');
      return { artifact: args.artifact, resolvedRefs, relatedMemories: related };
    } catch (err) {
      span.recordError(err);
      throw err;
    } finally {
      span.end();
    }
  }

  /**
   * record — insert a structured naos_interactions row (not free-form).
   */
  async record(args: { interaction: InteractionRow }): Promise<{ id: string }> {
    await this.ensureTenant();
    const i = args.interaction;
    const { data, error } = await this.opts.supabase
      .from('naos_interactions')
      .insert({
        agent_id: i.agentId,
        venture_id: i.ventureId ?? this.opts.ventureId ?? null,
        interaction_type: i.interactionType,
        context: i.context ?? {},
        outcome: i.outcome ?? null,
        human_feedback: i.humanFeedback ?? null,
        peer_feedback: i.peerFeedback ?? null,
        trait_deltas: i.traitDeltas ?? null,
        emotional_deltas: i.emotionalDeltas ?? null,
        skills_affected: i.skillsAffected ?? null,
      })
      .select('id')
      .single();
    if (error) throw new Error(`record(): ${error.message}`);
    return { id: (data as { id: string }).id };
  }

  /**
   * emit — thin pass-through to the events publisher. Convenience API
   * so callers don't have to import @mcv/events-sdk separately when
   * they already have a Router instance.
   */
  async emit(args: { topic: string; payload: unknown; correlationId?: string }): Promise<void> {
    await this.opts.events.publish(args.topic, args.payload, {
      ventureId: this.opts.ventureId,
      correlationId: args.correlationId,
      emittedBy: this.opts.agentHandle ? `agent:${this.opts.agentHandle}` : 'router',
    });
  }
}

/** Utility — useful in tests + callers. */
export { recencyScore };
