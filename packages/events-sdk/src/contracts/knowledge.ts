// packages/events-sdk/src/contracts/knowledge.ts
//
// Phase-1 Intelligence Router emissions + subscriptions.
//
// Topics:
//   - knowledge.recall       (emitted on every router.recall())
//   - knowledge.observed     (emitted on every successful router.observe())
//   - knowledge.backpressure (emitted when per-tenant observe rate limit hit)
//
// Subscriptions: the knowledge-observer handler subscribes to 4 upstream
// topics, seeded into event_subscribers by migration-intelligence-unification-2026-04-28.sql.

import { z } from 'zod';
import type { ContractDeclaration } from '../types.js';

const Provenance = z.object({
  source: z.string(),
  correlationId: z.string().optional(),
  causationId: z.string().optional(),
  eventId: z.string().optional(),
  driver: z.string().optional(),
}).passthrough();

export const KnowledgeContract: ContractDeclaration<'knowledge'> = {
  module: 'knowledge',
  version: '1.0',

  emits: [
    {
      topic: 'knowledge.recall.completed',
      schemaVersion: '1.0',
      payload: z.object({
        query: z.string(),
        layers: z.array(z.string()),
        topK: z.number(),
        hitCount: z.number(),
        perLayer: z.record(z.string(), z.object({
          count: z.number(),
          latencyMs: z.number(),
          error: z.string().optional(),
        })),
        traceId: z.string(),
      }),
      description:
        'Intelligence Router ran a cross-substrate recall. Payload summarizes layer latencies + hit count for observability. Full trace lives in TelemetrySpan for that traceId.',
    },
    {
      topic: 'knowledge.memory.observed',
      schemaVersion: '1.0',
      payload: z.object({
        memoryId: z.string(),
        substrate: z.string(),
        kind: z.enum(['fact', 'preference', 'constraint', 'decision', 'chunk', 'interaction', 'emotional_shift', 'relationship_update']),
        confidence: z.number().min(0).max(1),
        provenance: Provenance,
        tags: z.array(z.string()).default([]),
      }),
      description:
        'Intelligence Router wrote a new memory. Subscribers include downstream consolidators (Vertex AI Memory Bank in Phase-5) and the EventStreamView live dev panel.',
    },
    {
      topic: 'knowledge.backpressure.triggered',
      schemaVersion: '1.0',
      payload: z.object({
        tenantId: z.string(),
        kind: z.string(),
        droppedAt: z.string(),
      }),
      description:
        'Per-tenant observe rate limit exceeded. Alert-worthy when it happens repeatedly; at steady-state it signals a misbehaving agent or a capacity tier bump.',
    },
  ],

  subscribes: [
    {
      topicPattern: 'agentic.draft.approved',
      handlerUrl: '/api/knowledge-observer',
      description: 'Draft approval → decision memory in agent_memory_longterm.',
    },
    {
      topicPattern: 'agentic.draft.edited',
      handlerUrl: '/api/knowledge-observer',
      description: 'Draft edit → preference memory (Tony materially rewrote; that preference pattern matters).',
    },
    {
      topicPattern: 'agentic.draft.rejected',
      handlerUrl: '/api/knowledge-observer',
      description: 'Draft rejection → constraint memory (avoid this output class next time).',
    },
    {
      topicPattern: 'foundation.*.approved',
      handlerUrl: '/api/knowledge-observer',
      description: 'Any foundation-module approval → fact memory with module-derived content.',
    },
  ],
};
