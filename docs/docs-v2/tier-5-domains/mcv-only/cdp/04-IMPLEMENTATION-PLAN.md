# @mcv/cdp — Implementation Plan

**Package:** `@mcv/cdp`
**Tier:** 5 (Domain Layer — MCV-Only)
**Classification:** INTERNAL — Never Published
**Submodules:** events, identity-graph, profiles, segments, sync, traits
**Last Updated:** February 9, 2026

---

## 1. Overview

The `@mcv/cdp` package implements a unified **Customer Data Platform** for the entire MCV.ONE 9-venture consortium. It collects behavioral events from all touchpoints (web, mobile, blockchain, email, support, commerce), resolves cross-platform identities into unified 360° customer profiles, computes real-time and batch traits, builds dynamic audience segments, and synchronizes data to external activation destinations (Facebook Ads, Google Ads, Klaviyo, Snowflake, webhooks).

This implementation plan covers the full build-out across four phases — from foundational event ingestion to ML-powered identity matching and predictive segmentation. The CDP is the single most critical data infrastructure component in the MCV ecosystem: every downstream domain (marketing, analytics, commerce, compliance) depends on it.

### Key Deliverables

- **Event ingestion pipeline** processing 100K+ events/minute across all ventures
- **Identity resolution engine** with deterministic and probabilistic matching
- **Unified profile store** with 360° customer view and GDPR compliance
- **Trait computation engine** with real-time and batch computation modes
- **Dynamic segmentation engine** supporting rule-based, static, and ML segments
- **Sync orchestrator** pushing audiences to 6+ external destinations

### Success Metrics

| Metric | Target |
|--------|--------|
| Event ingestion latency (p99) | < 200ms |
| Identity resolution latency (p95) | < 500ms |
| Profile query latency (p95) | < 100ms |
| Segment recomputation (1M profiles) | < 5 minutes |
| Sync delivery success rate | > 99.5% |
| Cross-venture identity merge accuracy | > 95% |

---

## 2. Prerequisites

### Infrastructure Dependencies

| Dependency | Purpose | Required By |
|-----------|---------|-------------|
| `@mcv/kernel` | Auth context, tenant isolation, error handling | Phase 1 |
| `@mcv/db` | Drizzle ORM, connection pooling, migrations | Phase 1 |
| `@mcv/events` | Redpanda/Kafka event bus for ingestion | Phase 1 |
| `@mcv/storage` | File storage for bulk imports/exports | Phase 2 |
| `@mcv/ai` | ML models for probabilistic matching, predictions | Phase 3 |
| `@mcv/comms` | Notification delivery for sync alerts | Phase 3 |
| PostgreSQL 15+ | Primary data store with RLS | Phase 1 |
| Redis 7+ | Caching, pub/sub, rate limiting | Phase 1 |
| Redpanda/Kafka | Event streaming backbone | Phase 1 |

### Team Requirements

| Role | Count | Phases |
|------|-------|--------|
| Senior Backend Engineer | 2 | All phases |
| Data Engineer | 1 | Phase 1–3 |
| ML Engineer | 1 | Phase 3 |
| Frontend Engineer | 1 | Phase 2–4 |
| QA Engineer | 1 | All phases |

### Pre-Implementation Checklist

- [ ] Supabase project provisioned with RLS policies for `cdp_*` tables
- [ ] Redpanda cluster configured with `cdp.events.*` topic namespace
- [ ] Redis cluster provisioned with dedicated keyspace for CDP
- [ ] Drizzle ORM schema migration pipeline tested
- [ ] Venture ID enumeration finalized for all 9 MCV ventures
- [ ] PII handling policy reviewed with compliance team
- [ ] Event schema registry created (Zod schemas for all event types)

---

## 3. Phase 1 — Foundation (Weeks 1–6)

**Goal:** Establish the event ingestion pipeline, basic profile storage, and database schema. By end of Phase 1, events flow from all ventures into the CDP and create/update basic profiles.

### 3.1 Database Schema & Migrations

**Duration:** Weeks 1–2
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Create Drizzle schema for `cdp_profiles` table with venture isolation
- [ ] Create schema for `cdp_events` with date-partitioned storage
- [ ] Create schema for `cdp_identity_nodes` and `cdp_identity_edges`
- [ ] Create schema for `cdp_traits`, `cdp_trait_definitions`, `cdp_trait_values`
- [ ] Create schema for `cdp_segments`, `cdp_segment_rules`, `cdp_segment_memberships`
- [ ] Create schema for `cdp_destinations`, `cdp_sync_configs`, `cdp_sync_jobs`
- [ ] Implement RLS policies: ventures can only access their own CDP data
- [ ] Create indexes for profile lookup by email, phone, wallet, device
- [ ] Create composite indexes for event queries (venture + profile + timestamp)
- [ ] Write migration scripts with rollback support
- [ ] Validate schema against MODULE.md type definitions

```typescript
// Example: Core profile schema with RLS
import { pgTable, text, jsonb, timestamp, boolean, numeric, index, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const profileStatusEnum = pgEnum('cdp_profile_status', [
  'active', 'merged', 'suppressed', 'deleted',
]);

export const profileTypeEnum = pgEnum('cdp_profile_type', [
  'identified', 'anonymous', 'lead', 'prospect',
]);

export const cdpProfiles = pgTable('cdp_profiles', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id'),
  type: profileTypeEnum('type').default('anonymous').notNull(),
  status: profileStatusEnum('status').default('active').notNull(),
  canonicalEmail: text('canonical_email'),
  canonicalPhone: text('canonical_phone'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  country: text('country'),
  region: text('region'),
  city: text('city'),
  timezone: text('timezone'),
  firstSeenAt: timestamp('first_seen_at'),
  lastSeenAt: timestamp('last_seen_at'),
  totalEvents: numeric('total_events').default('0'),
  ltvCents: numeric('ltv_cents').default('0'),
  traits: jsonb('traits').$type<Record<string, unknown>>().default({}),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('cdp_profile_venture_idx').on(table.ventureId),
  index('cdp_profile_email_idx').on(table.ventureId, table.canonicalEmail),
  index('cdp_profile_phone_idx').on(table.ventureId, table.canonicalPhone),
  index('cdp_profile_user_idx').on(table.ventureId, table.userId),
  index('cdp_profile_last_seen_idx').on(table.ventureId, table.lastSeenAt),
]);
```

### 3.2 Event Ingestion Pipeline

**Duration:** Weeks 2–4
**Owner:** Data Engineer + Senior Backend Engineer

#### Tasks

- [ ] Create Zod schemas for all standard event types (track, identify, page, screen, group, alias)
- [ ] Implement `EventCollector` service with `track()`, `trackBatch()`, `identify()`, `page()`, `screen()` methods
- [ ] Implement event validation layer with Zod runtime parsing
- [ ] Implement event deduplication using idempotency keys (Redis SET NX with TTL)
- [ ] Implement event context enrichment (IP → geo lookup, user-agent parsing)
- [ ] Set up Redpanda consumer group `cdp-event-processor` for parallel consumption
- [ ] Implement `EventProcessor` that routes validated events to identity resolution + storage
- [ ] Implement `EventStore` with date-partitioned writes and query interface
- [ ] Create event replay mechanism for reprocessing historical events
- [ ] Implement batch ingestion API for bulk historical imports
- [ ] Set up dead-letter queue for failed event processing

```typescript
// Example: Event ingestion with validation and deduplication
import { z } from 'zod';
import { redis } from '@mcv/kernel/cache';
import { producer } from '@mcv/events';

const TrackEventSchema = z.object({
  anonymousId: z.string().optional(),
  userId: z.string().optional(),
  event: z.string().min(1).max(256),
  properties: z.record(z.unknown()).optional(),
  context: z.object({
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    locale: z.string().optional(),
    page: z.object({
      url: z.string().optional(),
      referrer: z.string().optional(),
    }).optional(),
  }).optional(),
  timestamp: z.string().datetime().optional(),
  messageId: z.string().optional(),
});

export async function track(ventureId: string, input: z.infer<typeof TrackEventSchema>) {
  const validated = TrackEventSchema.parse(input);
  const messageId = validated.messageId ?? `evt_${createId()}`;

  // Deduplication: skip if already processed within 24h window
  const dedupeKey = `cdp:dedup:${ventureId}:${messageId}`;
  const isNew = await redis.set(dedupeKey, '1', 'NX', 'EX', 86400);
  if (!isNew) return { status: 'deduplicated', messageId };

  // Enrich context
  const enrichedContext = await enrichEventContext(validated.context);

  // Publish to Redpanda for async processing
  await producer.send({
    topic: `cdp.events.${ventureId}`,
    messages: [{
      key: validated.userId ?? validated.anonymousId ?? messageId,
      value: JSON.stringify({
        type: 'track',
        ventureId,
        messageId,
        ...validated,
        context: enrichedContext,
        receivedAt: new Date().toISOString(),
      }),
    }],
  });

  return { status: 'accepted', messageId };
}
```

### 3.3 Basic Profile Management

**Duration:** Weeks 4–6
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement `ProfileService` with create, read, update, search operations
- [ ] Implement `getProfile()` returning full profile with inline traits
- [ ] Implement `searchProfiles()` with multi-criteria filtering (email, phone, traits, status)
- [ ] Implement `getProfileTimeline()` returning recent events for a profile
- [ ] Implement profile creation on first event (anonymous → lead → identified lifecycle)
- [ ] Implement `identify()` flow: merge anonymous profile into identified profile
- [ ] Implement `suppressProfile()` for GDPR compliance (clear PII, retain anonymized stats)
- [ ] Implement profile deduplication detection (flag potential duplicates)
- [ ] Create React hooks: `useProfile`, `useProfileSearch`, `useProfileTimeline`
- [ ] Create components: `ProfileCard`, `ProfileDetail`, `ProfileTimeline`
- [ ] Write integration tests for complete event→profile pipeline

### 3.4 Phase 1 Acceptance Criteria

| Criterion | Validation Method |
|-----------|-------------------|
| Events from all ventures arrive in CDP within 200ms | Load test with k6 |
| Profile auto-created on first event from new user | Integration test |
| Identify call merges anonymous → identified | Integration test |
| Deduplication rejects duplicate messageIds | Unit test |
| RLS prevents cross-venture profile access | Security test |
| GDPR suppress clears PII but retains aggregate stats | Integration test |
| Event replay reprocesses 1M events without data loss | Stress test |
| Schema migrations run cleanly on empty + populated databases | CI/CD pipeline |

---

## 4. Phase 2 — Core Features (Weeks 7–14)

**Goal:** Build identity resolution, dynamic segmentation, trait computation, and the sync framework. By end of Phase 2, the CDP can resolve cross-platform identities, compute traits from events, build dynamic audiences, and sync them externally.

### 4.1 Identity Resolution Engine

**Duration:** Weeks 7–9
**Owner:** Senior Backend Engineer + Data Engineer

#### Tasks

- [ ] Implement `IdentityGraph` service: nodes (email, phone, wallet, device, userId) and edges (co-occurrence)
- [ ] Implement deterministic identity matching (exact email, phone, userId matches)
- [ ] Implement `IdentityResolver.resolve()` — given a set of identifiers, return the canonical profile ID
- [ ] Implement `linkIdentities()` — record co-occurring identifiers from a single event/session
- [ ] Implement `AliasManager` — CRUD for email/phone/device/wallet aliases with verification status
- [ ] Implement hash-based PII storage (SHA-256 for email/phone in identity nodes)
- [ ] Implement `triggerMerge()` — when resolution determines two profiles are the same person
- [ ] Implement `ProfileMerger` with configurable conflict resolution strategies:
  - Most recent value wins (default for most fields)
  - Highest value wins (LTV, total events)
  - Union strategy (tags, segments)
  - Manual review threshold (when confidence < 80%)
- [ ] Implement merge audit log with rollback capability
- [ ] Implement `getProfileGraph()` — visualize the identity graph for a single profile
- [ ] Create cross-venture identity linking (user bets on BetEdge + shops on SerpSpace = one profile)
- [ ] Write identity resolution benchmarks: 10K resolution requests/second target

```typescript
// Example: Identity resolution with deterministic matching
export class IdentityResolver {
  async resolve(ventureId: string, identifiers: IdentityInput[]): Promise<ResolutionResult> {
    const candidates: Map<string, number> = new Map(); // profileId → confidence score

    for (const identifier of identifiers) {
      const nodes = await db.select()
        .from(cdpIdentityNodes)
        .where(and(
          eq(cdpIdentityNodes.ventureId, ventureId),
          eq(cdpIdentityNodes.type, identifier.type),
          eq(cdpIdentityNodes.hashedValue, sha256(normalize(identifier.value))),
        ));

      for (const node of nodes) {
        const current = candidates.get(node.profileId) ?? 0;
        candidates.set(node.profileId, current + this.getTypeWeight(identifier.type));
      }
    }

    if (candidates.size === 0) return { action: 'create', profileId: null, confidence: 0 };
    if (candidates.size === 1) {
      const [profileId, score] = [...candidates.entries()][0];
      return { action: 'match', profileId, confidence: Math.min(score / 100, 1) };
    }

    // Multiple candidates: check if merge needed
    const sorted = [...candidates.entries()].sort((a, b) => b[1] - a[1]);
    const topScore = sorted[0][1];
    const secondScore = sorted[1][1];

    if (topScore > 80 && secondScore > 60) {
      return { action: 'merge', profileIds: sorted.map(s => s[0]), confidence: topScore / 100 };
    }

    return { action: 'match', profileId: sorted[0][0], confidence: topScore / 100 };
  }

  private getTypeWeight(type: IdentityType): number {
    const weights: Record<IdentityType, number> = {
      email: 40, phone: 35, userId: 50, walletAddress: 30, deviceId: 15, cookie: 10,
    };
    return weights[type] ?? 10;
  }
}
```

### 4.2 Trait Computation Engine

**Duration:** Weeks 9–11
**Owner:** Data Engineer

#### Tasks

- [ ] Implement `TraitEngine` with `defineTrait()`, `setTrait()`, `getTraits()`, `computeTraits()`
- [ ] Support trait sources: computed (from events), manual (API set), ML (model predictions), enrichment (3rd party), imported (bulk)
- [ ] Implement computation rule types:
  - **Aggregate:** count, sum, average, min, max of event properties
  - **Window:** computation over last N days (e.g., "purchases in last 30 days")
  - **Recency:** days since last event of type X
  - **Frequency:** number of active days in period
  - **Formula:** derived trait from other traits (e.g., `avg_order_value = total_revenue / order_count`)
- [ ] Implement `TraitComputer` — execute computation rules against event store
- [ ] Implement event-triggered trait recomputation (trait updates when relevant event arrives)
- [ ] Implement batch trait computation via `runBatchComputation()` — recompute a trait across all profiles
- [ ] Implement trait value caching in Redis with configurable TTL
- [ ] Implement trait validation rules (type checking, range constraints)
- [ ] Create React components: `TraitDefinitionForm`, `TraitValueEditor`
- [ ] Create React hook: `useTraitEditor`

```typescript
// Example: Trait definition and computation
const purchaseCountTrait: TraitDefinition = {
  id: 'total_purchases',
  name: 'Total Purchases',
  type: 'computed',
  dataType: 'number',
  computation: {
    type: 'aggregate',
    method: 'count',
    eventFilter: { event: 'order_completed' },
    window: null, // all-time
  },
  triggers: ['order_completed', 'order_refunded'],
  cacheTtlMs: 300_000, // 5 min cache
};

const churnRiskTrait: TraitDefinition = {
  id: 'churn_risk',
  name: 'Churn Risk Score',
  type: 'computed',
  dataType: 'number',
  computation: {
    type: 'formula',
    expression: 'daysSinceLastActive > 30 ? 0.8 : daysSinceLastActive > 14 ? 0.5 : 0.2',
    dependencies: ['days_since_last_active'],
  },
  triggers: ['*'], // recompute on any event
  cacheTtlMs: 3600_000, // 1 hour cache
};
```

### 4.3 Dynamic Segmentation Engine

**Duration:** Weeks 11–13
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement `SegmentBuilder` with `createSegment()`, `updateRules()`, `estimateSize()`
- [ ] Support segment types: dynamic (rule-based), static (curated list), ML (lookalike)
- [ ] Implement rule evaluation engine supporting:
  - Trait conditions (e.g., `total_purchases > 5`)
  - Event conditions (e.g., `has event 'purchase' in last 30 days`)
  - Segment inclusion/exclusion (e.g., `in segment 'VIPs' AND NOT in 'Churned'`)
  - Nested AND/OR logic with unlimited depth
- [ ] Implement `SegmentEvaluator.computeSegment()` — full segment recomputation
- [ ] Implement `estimateSize()` — fast count estimate without full materialization
- [ ] Implement `MembershipEngine` — track enter/exit events for segment membership changes
- [ ] Implement segment membership caching in Redis with bitmap-based membership checks
- [ ] Implement incremental segment updates (only re-evaluate profiles with changed traits)
- [ ] Create React components: `SegmentBuilderUI`, `SegmentRuleEditor`, `SegmentSizeEstimator`
- [ ] Create React hooks: `useSegmentBuilder`, `useSegmentMembers`

```typescript
// Example: Segment rule definition with nested logic
const highValueActiveSegment: SegmentRules = {
  operator: 'AND',
  conditions: [
    {
      type: 'trait',
      traitId: 'ltv_cents',
      operator: 'greater_than',
      value: 50000, // > $500 LTV
    },
    {
      type: 'trait',
      traitId: 'days_since_last_active',
      operator: 'less_than',
      value: 30,
    },
    {
      operator: 'OR',
      conditions: [
        {
          type: 'event',
          eventName: 'purchase',
          timeWindow: { days: 90 },
          countOperator: 'greater_than',
          countValue: 2,
        },
        {
          type: 'segment',
          segmentId: 'enterprise_plan_users',
          membership: 'member',
        },
      ],
    },
  ],
};
```

### 4.4 Sync Framework

**Duration:** Weeks 13–14
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement `SyncOrchestrator` with job scheduling, monitoring, and retry logic
- [ ] Implement `DestinationManager` with CRUD for destination configurations
- [ ] Implement `DestinationAdapter` interface for pluggable destination integrations
- [ ] Implement adapters for: Facebook Custom Audiences, Google Customer Match
- [ ] Implement `SyncJob` execution: extract segment members → transform → load to destination
- [ ] Implement field mapping configuration (CDP fields → destination fields)
- [ ] Implement incremental sync (only send additions/removals since last sync)
- [ ] Implement full sync fallback for destination recovery
- [ ] Implement `testDestination()` for connectivity verification
- [ ] Implement sync job history and error tracking
- [ ] Implement sync scheduling (cron-based recurring syncs)
- [ ] Create React components: `SyncDashboard`, `DestinationConfigForm`, `SyncJobHistory`
- [ ] Create React hooks: `useSyncDashboard`, `useDestinations`

### 4.5 Phase 2 Acceptance Criteria

| Criterion | Validation Method |
|-----------|-------------------|
| Identity resolution resolves email+phone to single profile | Integration test |
| Cross-venture identities linked when same email used | Integration test |
| Profile merge preserves all data with audit trail | Integration test |
| Merge rollback restores original profiles | Integration test |
| Computed traits update within 5s of triggering event | Performance test |
| Batch trait computation processes 1M profiles in < 10 min | Stress test |
| Segment with 5 nested rules computes in < 30s for 100K profiles | Performance test |
| Segment size estimation within 10% of actual count | Statistical test |
| Facebook Custom Audience sync completes for 50K profiles | E2E test |
| Sync retry recovers from transient destination failures | Chaos test |

---

## 5. Phase 3 — Advanced Features (Weeks 15–22)

**Goal:** Add ML-powered identity matching, predictive segments, real-time personalization, and cross-venture CDP capabilities. This phase transforms the CDP from a data store into an intelligence platform.

### 5.1 ML-Powered Identity Matching

**Duration:** Weeks 15–17
**Owner:** ML Engineer + Data Engineer

#### Tasks

- [ ] Build probabilistic identity scoring model using:
  - Behavioral similarity (event patterns, session timing, device fingerprints)
  - Network proximity (shared IP ranges, geolocation overlap)
  - Temporal correlation (activity patterns across ventures)
- [ ] Implement confidence scoring for identity matches (0–100 scale)
- [ ] Implement configurable merge threshold per venture (auto-merge vs. review queue)
- [ ] Build training pipeline using known identity links as positive examples
- [ ] Implement feature engineering pipeline for identity signals
- [ ] Deploy model as Supabase Edge Function for real-time scoring
- [ ] Implement human-in-the-loop review queue for low-confidence matches
- [ ] Create merge suggestion UI with side-by-side profile comparison
- [ ] Implement A/B testing framework for identity model versions
- [ ] Validate model accuracy against manually verified identity links

```typescript
// Example: Probabilistic identity scoring
interface IdentitySignals {
  sharedEmailDomain: boolean;
  ipOverlap: number;         // 0-1: fraction of shared IPs
  timezoneMatch: boolean;
  sessionTimeCorrelation: number; // Pearson r of activity hours
  deviceFingerprintSimilarity: number; // 0-1: Jaccard similarity
  behavioralEmbeddingDistance: number; // cosine distance
  walletInteraction: boolean; // on-chain transaction between wallets
}

async function scoreProbabilisticMatch(
  profileA: string,
  profileB: string,
  signals: IdentitySignals
): Promise<{ score: number; recommendation: 'auto_merge' | 'review' | 'reject' }> {
  const featureVector = extractFeatures(signals);
  const score = await mlModel.predict(featureVector);

  if (score > 0.90) return { score, recommendation: 'auto_merge' };
  if (score > 0.60) return { score, recommendation: 'review' };
  return { score, recommendation: 'reject' };
}
```

### 5.2 Predictive Segments

**Duration:** Weeks 17–19
**Owner:** ML Engineer + Senior Backend Engineer

#### Tasks

- [ ] Implement "likely to purchase" prediction model based on behavioral traits
- [ ] Implement "churn risk" prediction using recency/frequency/monetary (RFM) analysis
- [ ] Implement "lookalike audience" segment type using embedding similarity
- [ ] Implement segment type `ml` with model reference and confidence threshold
- [ ] Build feature store integration for ML model inputs
- [ ] Implement daily batch scoring pipeline for all predictive segments
- [ ] Implement real-time scoring for high-priority segments (< 1s latency)
- [ ] Create model performance dashboard (precision, recall, AUC over time)
- [ ] Implement automatic model retraining trigger on data drift detection
- [ ] Wire predictive segments into sync framework for ad platform targeting

### 5.3 Real-Time Personalization

**Duration:** Weeks 19–21
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement real-time event stream processing for instant trait updates
- [ ] Implement WebSocket-based profile change notifications
- [ ] Implement `useEventStream` React hook for live event monitoring
- [ ] Build personalization API: given a profile, return real-time trait values + segment memberships
- [ ] Implement edge caching for personalization responses (< 50ms target)
- [ ] Create personalization SDK for venture frontends (JavaScript/TypeScript)
- [ ] Implement A/B test segment assignment and tracking
- [ ] Build real-time segment enter/exit webhook notifications
- [ ] Implement rate-limited personalization API with per-venture quotas

### 5.4 Cross-Venture CDP

**Duration:** Weeks 21–22
**Owner:** Senior Backend Engineer + Data Engineer

#### Tasks

- [ ] Implement cross-venture identity linking with consent management
- [ ] Implement unified cross-venture profile view (aggregate data from all ventures)
- [ ] Implement cross-venture segment definitions (e.g., "active on BetEdge AND FutureState")
- [ ] Implement venture-level data access controls (venture A cannot read venture B's raw events)
- [ ] Implement cross-venture trait aggregation (e.g., total LTV across all ventures)
- [ ] Create cross-venture analytics dashboard for consortium-level insights
- [ ] Implement data sharing agreements between ventures with audit logging
- [ ] Test complete cross-venture flow: user signs up on Venture A → identified on Venture B → unified profile

### 5.5 Phase 3 Acceptance Criteria

| Criterion | Validation Method |
|-----------|-------------------|
| ML identity matching achieves > 90% precision, > 85% recall | Model evaluation |
| Probabilistic matches < 60% confidence routed to review queue | Integration test |
| Predictive "likely to purchase" segment has > 70% precision | A/B test |
| Churn risk model identifies 80%+ of actual churners | Backtesting |
| Personalization API responds in < 50ms (p95) | Load test |
| Real-time trait updates visible within 2 seconds of event | E2E test |
| Cross-venture profile aggregates data from 3+ ventures | Integration test |
| Consent enforcement blocks unauthorized cross-venture data access | Security test |

---

## 6. Phase 4 — Polish & Hardening (Weeks 23–26)

**Goal:** Production hardening, performance optimization, comprehensive documentation, and operational readiness.

### 6.1 Performance Optimization

- [ ] Implement connection pooling optimization for high-throughput event ingestion
- [ ] Add database query plan analysis and index tuning for top-20 queries
- [ ] Implement materialized views for frequently accessed segment counts
- [ ] Optimize identity graph traversal with adjacency list caching
- [ ] Implement event archival pipeline (move events older than 90 days to cold storage)
- [ ] Add query result caching with intelligent invalidation
- [ ] Benchmark and optimize trait computation for 10M+ profile scale

### 6.2 Observability & Monitoring

- [ ] Instrument all services with OpenTelemetry tracing
- [ ] Create Grafana dashboards: event throughput, resolution latency, sync success rates
- [ ] Set up PagerDuty alerts for: ingestion lag > 5s, sync failure rate > 5%, dead-letter queue growth
- [ ] Implement health check endpoints for all CDP services
- [ ] Create operational runbooks for common failure scenarios
- [ ] Implement audit logging for all profile mutations and data access

### 6.3 Documentation & Developer Experience

- [ ] Write SDK documentation with integration examples for each venture
- [ ] Create event schema catalog with descriptions and example payloads
- [ ] Write trait definition cookbook (common trait patterns)
- [ ] Create segment builder user guide with screenshots
- [ ] Document sync destination setup for each supported platform
- [ ] Write API reference with OpenAPI/Swagger spec
- [ ] Create architecture decision records (ADRs) for key design choices

### 6.4 Security & Compliance

- [ ] Penetration test all API endpoints
- [ ] Validate GDPR compliance: right to erasure, data portability, consent management
- [ ] Implement CCPA opt-out mechanism
- [ ] Verify RLS policy coverage for all tables (no data leaks between ventures)
- [ ] Implement API rate limiting per venture with configurable quotas
- [ ] Create security incident response plan for CDP data breaches
- [ ] Complete SOC 2 documentation for CDP data handling

### 6.5 Phase 4 Acceptance Criteria

| Criterion | Validation Method |
|-----------|-------------------|
| All API endpoints have OpenTelemetry tracing | Trace inspection |
| Grafana dashboards show real-time CDP health | Manual review |
| PagerDuty fires within 60s of threshold breach | Chaos test |
| GDPR suppress removes all PII within 30 seconds | Integration test |
| RLS blocks cross-venture access on all 20+ tables | Automated security scan |
| SDK documentation has examples for all 9 ventures | Doc review |
| Load test sustains 100K events/min for 1 hour | Stress test |

---

## 7. Testing Strategy

### Unit Tests

| Area | Coverage Target | Key Test Cases |
|------|-----------------|----------------|
| Event validation | 100% | All event types, edge cases, malformed input |
| Identity resolution | 95% | Deterministic match, multi-identifier, no match, merge trigger |
| Trait computation | 95% | All computation types, edge cases, null handling |
| Segment evaluation | 95% | All condition types, nested logic, empty results |
| Sync adapters | 90% | Each destination type, field mapping, error handling |

### Integration Tests

| Scenario | Description |
|----------|-------------|
| Event→Profile pipeline | Track event creates profile, updates lastSeenAt |
| Identify flow | Anonymous profile merged into identified profile |
| Cross-venture identity | Same email on two ventures creates linked profiles |
| Trait trigger chain | Event → trait recompute → segment membership change |
| Sync round-trip | Segment computed → synced to destination → verified |
| GDPR suppress | Suppress profile → verify PII cleared → verify segment removal |
| Merge rollback | Merge two profiles → rollback → verify separation |

### Performance Tests

| Test | Target | Tool |
|------|--------|------|
| Event ingestion throughput | 100K events/min sustained | k6 |
| Identity resolution latency | p95 < 500ms | k6 |
| Profile query latency | p95 < 100ms | k6 |
| Segment computation (1M profiles) | < 5 min | Custom benchmark |
| Batch trait computation (1M profiles) | < 10 min | Custom benchmark |
| Sync job (50K profiles) | < 2 min | E2E test |

### Security Tests

- RLS policy validation for all CDP tables
- JWT token validation and expiry
- PII encryption at rest verification
- Cross-venture isolation verification
- Rate limiting enforcement
- SQL injection prevention (parameterized queries via Drizzle)

---

## 8. Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Event ingestion bottleneck at scale** | Medium | High | Horizontal scaling via Redpanda partitions; auto-scaling consumers; back-pressure handling |
| **Identity resolution false positives** | Medium | High | Conservative merge thresholds; human review queue; merge rollback capability |
| **Cross-venture data leaks** | Low | Critical | RLS policies on every table; regular security audits; automated RLS coverage tests |
| **ML model drift degrades identity accuracy** | Medium | Medium | Automated data drift detection; scheduled retraining; A/B testing new models |
| **Sync destination API breaking changes** | High | Medium | Version-pinned adapters; integration health checks; fallback to full-sync mode |
| **PII compliance violation** | Low | Critical | Encryption at rest; hash-based identity storage; GDPR suppress mechanism; compliance audits |
| **Profile merge data corruption** | Low | High | Comprehensive audit logging; merge rollback; pre-merge validation; staging merges |
| **Redis cache inconsistency** | Medium | Medium | Cache invalidation on write; TTL-based expiry; cache-aside pattern; graceful degradation |
| **Redpanda/Kafka cluster failure** | Low | High | Multi-AZ deployment; consumer offset tracking; replay capability; dead-letter queue |
| **Schema migration failures** | Low | Medium | Tested rollback scripts; staging environment validation; blue-green deployment |

---

## 9. Timeline Summary

```
Week  1-2   ████ Schema & Migrations
Week  2-4   ██████ Event Ingestion Pipeline
Week  4-6   ████ Basic Profile Management
            ────── Phase 1 Gate Review ──────
Week  7-9   ██████ Identity Resolution Engine
Week  9-11  ████ Trait Computation Engine
Week 11-13  ████ Dynamic Segmentation Engine
Week 13-14  ██ Sync Framework
            ────── Phase 2 Gate Review ──────
Week 15-17  ██████ ML Identity Matching
Week 17-19  ████ Predictive Segments
Week 19-21  ████ Real-Time Personalization
Week 21-22  ██ Cross-Venture CDP
            ────── Phase 3 Gate Review ──────
Week 23-24  ████ Performance & Observability
Week 24-25  ████ Documentation & DX
Week 25-26  ██ Security & Compliance
            ────── Phase 4 Final Review ──────
```

**Total Duration:** 26 weeks (6.5 months)

### Phase Gate Reviews

| Gate | Week | Go/No-Go Criteria |
|------|------|-------------------|
| Phase 1 → 2 | Week 6 | Events flowing, profiles created, RLS validated |
| Phase 2 → 3 | Week 14 | Identity resolution working, segments computing, first sync successful |
| Phase 3 → 4 | Week 22 | ML models deployed, cross-venture linking operational |
| Production Release | Week 26 | All acceptance criteria met, security audit passed, docs complete |

### Dependencies & Critical Path

```
Events (P1) → Identity (P2) → ML Identity (P3)
Events (P1) → Profiles (P1) → Traits (P2) → Segments (P2) → Sync (P2)
Traits (P2) → Predictive Segments (P3)
Segments (P2) → Real-Time Personalization (P3)
Profiles (P1) → Cross-Venture CDP (P3)
```

The critical path runs: **Schema → Events → Profiles → Identity → Traits → Segments → Predictive Segments → Polish**.

---

*@mcv/cdp — Customer Data Platform*
