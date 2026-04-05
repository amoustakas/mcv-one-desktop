# @mcv/cdp/events

> **Tier 5 — MCV-Only Domain**
> CDP event collection, validation, streaming, and processing pipeline for all 9 MCV ventures.

**Depends on:** `@mcv/cdp/profiles`, `@mcv/cdp/traits`, `@mcv/foundation/schema`, `@mcv/foundation/errors`, `@mcv/foundation/logging`, `@mcv/infra/redpanda`, `@mcv/infra/supabase`
**Depended on by:** `@mcv/cdp/traits`, `@mcv/cdp/segments`, `@mcv/cdp/profiles`, `@mcv/cdp/audiences`, `@mcv/cdp/journeys`, `@mcv/analytics`

---

## Purpose

The **events** module is the foundational data ingestion layer of the MCV Customer Data Platform. Every user interaction across all nine ventures — page views, clicks, purchases, searches, bets placed, keywords tracked, grants applied for, games started, properties viewed — flows through this module before reaching any other part of the CDP. It is the single source of truth for behavioral data and the entry point for the entire real-time and batch analytics pipeline.

Events handles the full lifecycle of behavioral data: collection from diverse client and server sources, validation against venture-specific schemas, enrichment with contextual metadata (device, location, session, referrer), streaming through Redpanda for real-time consumption, persistence to partitioned PostgreSQL tables, and aggregation into pre-computed metrics rollups. The module processes millions of events per day across all ventures while maintaining strict ordering guarantees within a user session and exactly-once semantics through idempotency keys and deduplication windows.

Beyond raw ingestion, the events module provides critical infrastructure for the rest of the CDP. Computed traits are derived from event streams (e.g., "total lifetime purchases" is a rolling aggregation of `purchase_made` events). Segments evaluate membership based on event patterns (e.g., "users who viewed odds but didn't place a bet in the last 7 days"). Profile timelines are built from event histories. The event replay system allows backfilling when new traits or segments are defined, reprocessing historical events through updated logic without re-ingesting from source systems. A dead letter queue captures events that fail validation or processing, enabling investigation and retry without data loss.

---

## Exports

```typescript
// === Core Collector ===
export { EventCollector } from './collector';
export { createEventCollector } from './collector';
export type { EventCollectorConfig, CollectorOptions, BatchConfig } from './collector';

// === Event Types ===
export type { Event, RawEvent, EnrichedEvent, ValidatedEvent } from './types';
export type { EventContext, DeviceContext, LocationContext, SessionContext } from './types';
export type { EventProperties, EventMetadata, EventTimestamps } from './types';
export type { EventId, EventName, VentureEventKey } from './types';

// === Schema & Validation ===
export { EventSchemaRegistry } from './schema/registry';
export { validateEvent } from './schema/validator';
export { registerVentureEvents } from './schema/venture-events';
export type { EventSchema, EventFieldDefinition, SchemaVersion } from './schema/types';
export type { ValidationResult, ValidationError, ValidationWarning } from './schema/validator';

// === Venture Event Catalogs ===
export { BETEDGE_EVENTS } from './ventures/betedge';
export { SERPSPACE_EVENTS } from './ventures/serpspace';
export { FULLGAIN_EVENTS } from './ventures/fullgain';
export { MCVSTUDIOS_EVENTS } from './ventures/mcvstudios';
export { FUTURESTATE_EVENTS } from './ventures/futurestate';
export { SHELFWISE_EVENTS } from './ventures/shelfwise';
export { EMBERGLOW_EVENTS } from './ventures/emberglow';
export { PULSEFRONT_EVENTS } from './ventures/pulsefront';
export { NEXTERA_EVENTS } from './ventures/nextera';
export type { VentureEventConfig, VentureEventCatalog } from './ventures/types';

// === Context Enrichment ===
export { enrichEventContext } from './context/enricher';
export { DeviceDetector } from './context/device';
export { GeoResolver } from './context/geo';
export { SessionResolver } from './context/session';
export { ReferrerParser } from './context/referrer';
export type { EnrichmentPipeline, EnrichmentStep } from './context/types';

// === Streaming & Processing ===
export { EventProducer } from './streaming/producer';
export { EventConsumer } from './streaming/consumer';
export { EventRouter } from './streaming/router';
export type { ProducerConfig, ConsumerConfig, TopicConfig } from './streaming/types';

// === Metrics Rollup ===
export { MetricsRollup } from './metrics/rollup';
export { RealTimeAggregator } from './metrics/realtime';
export { BatchAggregator } from './metrics/batch';
export type { MetricDefinition, RollupConfig, AggregationWindow } from './metrics/types';
export type { MetricValue, MetricQuery, MetricResult } from './metrics/types';

// === Event Replay ===
export { EventReplayer } from './replay/replayer';
export { ReplayJob } from './replay/job';
export type { ReplayConfig, ReplayFilter, ReplayProgress } from './replay/types';

// === Dead Letter Queue ===
export { DeadLetterQueue } from './dlq/queue';
export { DLQProcessor } from './dlq/processor';
export type { DeadLetterEvent, DLQConfig, RetryPolicy } from './dlq/types';

// === Repositories ===
export { EventRepository } from './repositories/event-repository';
export { EventSchemaRepository } from './repositories/schema-repository';
export { MetricsRepository } from './repositories/metrics-repository';
export { DeadLetterRepository } from './repositories/dlq-repository';

// === Middleware & Hooks ===
export { eventMiddleware } from './middleware';
export { deduplicationMiddleware } from './middleware/dedup';
export { rateLimitMiddleware } from './middleware/rate-limit';
export { consentMiddleware } from './middleware/consent';
export type { EventMiddleware, MiddlewareContext } from './middleware/types';

// === Constants ===
export {
  EVENT_TOPICS,
  EVENT_CONSUMER_GROUPS,
  MAX_BATCH_SIZE,
  MAX_EVENT_SIZE_BYTES,
  DEDUP_WINDOW_MS,
  DEFAULT_RETENTION_DAYS,
  PARTITION_STRATEGY,
} from './constants';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EVENT SOURCES (9 Ventures)                            │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┤
│ BetEdge  │SerpSpace │ FullGain │   MCV    │ Future   │ShelfWise │  Emberglow   │
│  Web/    │  Web/    │  Web/    │ Studios  │  state   │  Web/    │  PulseFront  │
│  Mobile  │  API     │  Portal  │  Games   │  Web/App │  App     │  NextEra     │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────┬───────┘
     │          │          │          │          │          │            │
     ▼          ▼          ▼          ▼          ▼          ▼            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT SDKs / SERVER SDKs                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Browser SDK  │  │  React SDK   │  │ React Native │  │  Server SDK  │        │
│  │ (analytics.  │  │ (useTrack,   │  │  (mobile     │  │  (Node.js,   │        │
│  │  js snippet) │  │  TrackView)  │  │   events)    │  │   webhooks)  │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         └──────────────────┴─────────────────┴─────────────────┘                │
│                                      │                                          │
│                          HTTP POST /v1/events                                   │
│                          HTTP POST /v1/events/batch                             │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              EVENT COLLECTOR API                                 │
│                                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐       │
│  │ Rate Limit  │─▶│  Dedup Check │─▶│   Consent    │─▶│    Validation   │       │
│  │ Middleware   │  │  (Redis/     │  │  Middleware   │  │  (Schema Check, │       │
│  │ (per-venture │  │   bloom      │  │  (GDPR/CCPA  │  │   type check,   │       │
│  │  & per-user) │  │   filter)    │  │   consent)   │  │   required flds)│       │
│  └─────────────┘  └──────────────┘  └──────────────┘  └────────┬────────┘       │
│                                                                  │               │
│                                    ┌─────────────────────────────┤               │
│                                    │                             │               │
│                              VALID │                    INVALID  │               │
│                                    ▼                             ▼               │
│                           ┌────────────────┐         ┌──────────────────┐        │
│                           │    Context      │         │  Dead Letter     │        │
│                           │   Enrichment    │         │  Queue (DLQ)     │        │
│                           │                 │         │                  │        │
│                           │ • Device detect │         │ • Failed event   │        │
│                           │ • Geo resolve   │         │ • Error reason   │        │
│                           │ • Session link  │         │ • Retry count    │        │
│                           │ • Referrer parse│         │ • Original payload│       │
│                           │ • User agent    │         └──────────────────┘        │
│                           └────────┬────────┘                                    │
│                                    │                                             │
└────────────────────────────────────┼─────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         REDPANDA (Event Streaming)                               │
│                                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                        │
│  │ cdp.events.raw          │  │ cdp.events.enriched     │                        │
│  │ (partitioned by venture │  │ (partitioned by venture │                        │
│  │  + user_id hash)        │  │  + event_type)          │                        │
│  └───────────┬─────────────┘  └───────────┬─────────────┘                        │
│              │                             │                                     │
│  ┌───────────┴─────────────┐  ┌───────────┴─────────────┐                        │
│  │ cdp.events.dlq          │  │ cdp.events.metrics      │                        │
│  │ (dead letter events)    │  │ (pre-aggregated)        │                        │
│  └─────────────────────────┘  └─────────────────────────┘                        │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│   TRAIT PROCESSOR     │ │  SEGMENT EVALUATOR   │ │  METRICS AGGREGATOR  │
│                       │ │                       │ │                      │
│ Consumes events to   │ │ Evaluates segment    │ │ Real-time rollups:   │
│ compute/update        │ │ rules against event  │ │ • DAU / MAU          │
│ profile traits:       │ │ streams:             │ │ • Conversion rates   │
│                       │ │                      │ │ • Revenue per venture│
│ • lifetime_value      │ │ • "high_roller"      │ │ • Event counts       │
│ • total_bets          │ │ • "churning_user"    │ │ • Funnel metrics     │
│ • last_active         │ │ • "power_searcher"   │ │                      │
│ • favorite_category   │ │ • "new_homebuyer"    │ │ Batch rollups:       │
│                       │ │                      │ │ • Weekly/monthly     │
│                       │ │                      │ │ • Cohort analysis    │
└───────────┬───────────┘ └───────────┬──────────┘ └───────────┬──────────┘
            │                         │                        │
            ▼                         ▼                        ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       SUPABASE POSTGRESQL (Storage)                               │
│                                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                │
│  │ events           │  │ event_schemas    │  │ metrics_rollups  │                │
│  │ (partitioned     │  │                  │  │                  │                │
│  │  by date range)  │  │ Schema registry  │  │ Pre-computed     │                │
│  │                  │  │ with versioning  │  │ aggregations     │                │
│  ├──────────────────┤  └──────────────────┘  └──────────────────┘                │
│  │ events_2026_01   │                                                            │
│  │ events_2026_02   │  ┌──────────────────┐  ┌──────────────────┐                │
│  │ events_2026_03   │  │ dead_letter_     │  │ event_replay_    │                │
│  │ ...              │  │ events           │  │ jobs             │                │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Event

The canonical event structure representing a single behavioral interaction. Events are immutable once created — they are never updated, only appended.

```typescript
/**
 * Unique event identifier. Format: evt_{venture}_{ulid}
 * Uses ULID for time-ordered, globally unique IDs.
 */
type EventId = `evt_${string}_${string}`;

/**
 * Event name using dot-notation taxonomy.
 * Format: {category}.{action} or {category}.{action}.{detail}
 * Examples: "page.viewed", "bet.placed", "keyword.tracked"
 */
type EventName = string;

/**
 * Raw event as received from client/server SDKs before any processing.
 */
interface RawEvent {
  /** Client-generated message ID for deduplication */
  messageId?: string;

  /** Event name from venture taxonomy */
  event: EventName;

  /** Profile/user identifier (anonymous or identified) */
  userId?: string;

  /** Anonymous identifier (device/browser fingerprint) */
  anonymousId?: string;

  /** Venture identifier */
  ventureId: string;

  /** Event-specific properties */
  properties?: Record<string, unknown>;

  /** Client-provided timestamp (ISO 8601) */
  timestamp?: string;

  /** Contextual data provided by client SDK */
  context?: Partial<EventContext>;

  /** Integration-specific options */
  integrations?: Record<string, boolean | Record<string, unknown>>;
}

/**
 * Fully validated and enriched event ready for storage and streaming.
 */
interface Event {
  /** Server-assigned unique event ID */
  id: EventId;

  /** Event name from venture taxonomy */
  event: EventName;

  /** Resolved profile ID (links anonymous → identified) */
  profileId: string;

  /** Original anonymous ID if provided */
  anonymousId?: string;

  /** Venture this event belongs to */
  ventureId: string;

  /** Event-specific properties (validated against schema) */
  properties: Record<string, unknown>;

  /** Enriched context (device, location, session, referrer) */
  context: EventContext;

  /** Client-provided timestamp */
  timestamp: Date;

  /** Server receive timestamp */
  receivedAt: Date;

  /** Server processing timestamp */
  processedAt: Date;

  /** Schema version used for validation */
  schemaVersion: string;

  /** Client-generated dedup key */
  messageId: string;

  /** Event metadata */
  metadata: EventMetadata;
}

/**
 * Enriched event with all context resolved and validated.
 * This is the final form written to storage and streamed.
 */
interface EnrichedEvent extends Event {
  /** Enrichment flags indicating which enrichments succeeded */
  enrichments: {
    device: boolean;
    geo: boolean;
    session: boolean;
    referrer: boolean;
    profileResolved: boolean;
  };
}

/**
 * Validated event — intermediate state after schema validation passes.
 */
interface ValidatedEvent extends RawEvent {
  /** Validation result metadata */
  validation: {
    schemaVersion: string;
    validatedAt: Date;
    warnings: ValidationWarning[];
  };
}
```

### EventContext

Rich contextual information automatically attached to every event during the enrichment pipeline.

```typescript
/**
 * Complete event context combining all enrichment sources.
 */
interface EventContext {
  /** Device and browser information */
  device: DeviceContext;

  /** Geographic location */
  location: LocationContext;

  /** Session information */
  session: SessionContext;

  /** Page/screen information */
  page?: PageContext;

  /** Referrer and campaign information */
  referrer?: ReferrerContext;

  /** Network information */
  network?: NetworkContext;

  /** App information (mobile SDKs) */
  app?: AppContext;

  /** Consent state at time of event */
  consent: ConsentContext;

  /** SDK information */
  library: LibraryContext;
}

/**
 * Device detection results from user agent parsing.
 */
interface DeviceContext {
  /** Device type: desktop, mobile, tablet, bot, unknown */
  type: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';

  /** Device manufacturer (e.g., "Apple", "Samsung") */
  manufacturer?: string;

  /** Device model (e.g., "iPhone 15 Pro", "Galaxy S24") */
  model?: string;

  /** Operating system name */
  os: string;

  /** Operating system version */
  osVersion: string;

  /** Browser name */
  browser: string;

  /** Browser version */
  browserVersion: string;

  /** Screen width in pixels */
  screenWidth?: number;

  /** Screen height in pixels */
  screenHeight?: number;

  /** Viewport width */
  viewportWidth?: number;

  /** Viewport height */
  viewportHeight?: number;

  /** Device pixel ratio */
  pixelRatio?: number;

  /** Raw user agent string */
  userAgent: string;

  /** Whether the device supports touch */
  touchEnabled?: boolean;
}

/**
 * Geographic location resolved from IP address.
 */
interface LocationContext {
  /** Two-letter country code (ISO 3166-1) */
  country?: string;

  /** Country name */
  countryName?: string;

  /** Region/state/province code */
  region?: string;

  /** Region name */
  regionName?: string;

  /** City name */
  city?: string;

  /** Postal/zip code */
  postalCode?: string;

  /** Latitude */
  latitude?: number;

  /** Longitude */
  longitude?: number;

  /** Timezone identifier (e.g., "America/Toronto") */
  timezone?: string;

  /** ISP/Organization */
  isp?: string;

  /** Whether this is a known VPN/proxy */
  isProxy?: boolean;

  /** Resolution method: ip, gps, manual */
  resolvedBy: 'ip' | 'gps' | 'manual';
}

/**
 * Session tracking across events within a single visit.
 */
interface SessionContext {
  /** Unique session identifier */
  sessionId: string;

  /** Session sequence number (nth visit) */
  sessionNumber: number;

  /** Whether this is the first event in the session */
  isNewSession: boolean;

  /** Session start timestamp */
  startedAt: Date;

  /** Number of events in this session so far */
  eventCount: number;

  /** Duration of session so far (ms) */
  durationMs: number;

  /** Landing page URL for this session */
  landingPage?: string;

  /** Landing page referrer */
  entryReferrer?: string;
}

/**
 * Current page/screen context.
 */
interface PageContext {
  /** Full URL */
  url: string;

  /** URL path */
  path: string;

  /** Page title */
  title?: string;

  /** URL search/query string */
  search?: string;

  /** URL hash fragment */
  hash?: string;

  /** Previous page URL */
  referrer?: string;
}

/**
 * Referrer and UTM campaign attribution.
 */
interface ReferrerContext {
  /** Full referrer URL */
  url?: string;

  /** Referrer domain */
  domain?: string;

  /** Classified referrer type */
  type: 'direct' | 'organic' | 'paid' | 'social' | 'email' | 'referral' | 'internal' | 'unknown';

  /** Referrer source name (e.g., "google", "facebook") */
  source?: string;

  /** UTM source parameter */
  utmSource?: string;

  /** UTM medium parameter */
  utmMedium?: string;

  /** UTM campaign parameter */
  utmCampaign?: string;

  /** UTM term parameter */
  utmTerm?: string;

  /** UTM content parameter */
  utmContent?: string;

  /** Click ID parameters (gclid, fbclid, etc.) */
  clickIds?: Record<string, string>;
}

/**
 * Network context for connectivity awareness.
 */
interface NetworkContext {
  /** IP address (hashed or masked for storage) */
  ipHash: string;

  /** Connection type: wifi, cellular, ethernet, unknown */
  connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';

  /** Effective connection type: slow-2g, 2g, 3g, 4g */
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';

  /** Whether the device is offline-capable */
  offlineCapable?: boolean;
}

/**
 * Mobile app context.
 */
interface AppContext {
  /** App name */
  name: string;

  /** App version */
  version: string;

  /** App build number */
  build: string;

  /** App namespace/bundle ID */
  namespace: string;
}

/**
 * User consent state at the time the event was recorded.
 */
interface ConsentContext {
  /** Whether analytics consent was granted */
  analytics: boolean;

  /** Whether marketing consent was granted */
  marketing: boolean;

  /** Whether functional consent was granted */
  functional: boolean;

  /** Consent framework (e.g., "tcf_v2", "ccpa", "custom") */
  framework?: string;

  /** Consent string/token */
  consentString?: string;

  /** When consent was last updated */
  updatedAt?: Date;
}

/**
 * SDK library information for debugging and compatibility.
 */
interface LibraryContext {
  /** SDK name (e.g., "@mcv/analytics-browser") */
  name: string;

  /** SDK version */
  version: string;

  /** Transport method: fetch, xhr, beacon, websocket */
  transport?: 'fetch' | 'xhr' | 'beacon' | 'websocket';
}
```

### EventCollector

The primary API for ingesting events. Handles single and batch event submission with built-in middleware pipeline.

```typescript
/**
 * Configuration for the EventCollector.
 */
interface EventCollectorConfig {
  /** Venture ID this collector serves */
  ventureId: string;

  /** Maximum events per batch request */
  maxBatchSize: number;

  /** Maximum event payload size in bytes */
  maxEventSizeBytes: number;

  /** Deduplication window in milliseconds */
  dedupWindowMs: number;

  /** Rate limit: max events per second per user */
  rateLimitPerUser: number;

  /** Rate limit: max events per second per venture */
  rateLimitPerVenture: number;

  /** Whether to enforce strict schema validation */
  strictValidation: boolean;

  /** Enrichment pipeline configuration */
  enrichment: {
    /** Enable device detection */
    device: boolean;
    /** Enable geo resolution */
    geo: boolean;
    /** Enable session tracking */
    session: boolean;
    /** Enable referrer parsing */
    referrer: boolean;
  };

  /** Dead letter queue configuration */
  dlq: {
    /** Enable DLQ for failed events */
    enabled: boolean;
    /** Max retry attempts before permanent failure */
    maxRetries: number;
    /** Retry delay base in ms (exponential backoff) */
    retryDelayMs: number;
  };

  /** Redpanda producer configuration */
  producer: ProducerConfig;
}

/**
 * The EventCollector is the main entry point for event ingestion.
 * It orchestrates validation, enrichment, streaming, and error handling.
 */
interface EventCollector {
  /**
   * Track a single event.
   * Returns the enriched event with server-assigned ID.
   *
   * @throws {EventValidationError} If event fails schema validation
   * @throws {EventRateLimitError} If rate limit exceeded
   * @throws {EventDuplicateError} If duplicate messageId detected
   */
  track(event: RawEvent): Promise<EnrichedEvent>;

  /**
   * Track multiple events in a single batch.
   * Returns results for each event (success or failure).
   * Partial failures are supported — valid events proceed even if some fail.
   *
   * @throws {EventBatchError} If entire batch is rejected (e.g., rate limit)
   */
  trackBatch(events: RawEvent[]): Promise<BatchResult>;

  /**
   * Identify a user, linking anonymous ID to a known user ID.
   * Generates an internal "identify" event.
   */
  identify(params: {
    userId: string;
    anonymousId?: string;
    traits?: Record<string, unknown>;
    ventureId: string;
  }): Promise<EnrichedEvent>;

  /**
   * Track a page view event with standard page properties.
   */
  page(params: {
    userId?: string;
    anonymousId?: string;
    ventureId: string;
    name?: string;
    category?: string;
    properties?: Record<string, unknown>;
    context?: Partial<EventContext>;
  }): Promise<EnrichedEvent>;

  /**
   * Register middleware to run on every event.
   * Middleware executes in registration order.
   */
  use(middleware: EventMiddleware): void;

  /**
   * Flush any buffered events immediately.
   * Used during graceful shutdown.
   */
  flush(): Promise<void>;

  /**
   * Gracefully shut down the collector.
   * Flushes buffered events and closes connections.
   */
  shutdown(): Promise<void>;

  /**
   * Get collector health/status information.
   */
  health(): CollectorHealth;
}

/**
 * Result of a batch track operation.
 */
interface BatchResult {
  /** Total events in the batch */
  total: number;

  /** Number of successfully processed events */
  succeeded: number;

  /** Number of failed events */
  failed: number;

  /** Individual event results */
  results: Array<{
    /** Index in the original batch */
    index: number;
    /** Whether this event succeeded */
    success: boolean;
    /** The enriched event (if successful) */
    event?: EnrichedEvent;
    /** Error details (if failed) */
    error?: {
      code: string;
      message: string;
      field?: string;
    };
  }>;

  /** Batch-level metadata */
  metadata: {
    /** Time to process entire batch (ms) */
    processingTimeMs: number;
    /** Number of duplicates filtered */
    duplicatesFiltered: number;
    /** Number sent to DLQ */
    sentToDLQ: number;
  };
}

/**
 * Collector health information.
 */
interface CollectorHealth {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';

  /** Redpanda producer connection status */
  producer: 'connected' | 'disconnected' | 'reconnecting';

  /** Current events in processing buffer */
  bufferSize: number;

  /** Events processed in last minute */
  eventsPerMinute: number;

  /** Current error rate (0-1) */
  errorRate: number;

  /** Average processing latency (ms) */
  avgLatencyMs: number;

  /** Uptime in seconds */
  uptimeSeconds: number;

  /** Last error (if any) */
  lastError?: {
    code: string;
    message: string;
    timestamp: Date;
  };
}
```

### EventSchema

Schema definitions for event validation. Each venture registers its event catalog with expected properties and types.

```typescript
/**
 * Schema definition for a specific event type.
 */
interface EventSchema {
  /** Unique schema identifier */
  id: string;

  /** Event name this schema validates */
  eventName: EventName;

  /** Venture this schema belongs to (null for global events) */
  ventureId: string | null;

  /** Schema version (semver) */
  version: string;

  /** Human-readable description */
  description: string;

  /** Category for organizing events */
  category: string;

  /** Property definitions */
  properties: Record<string, EventFieldDefinition>;

  /** Required property names */
  required: string[];

  /** Whether additional properties are allowed */
  additionalProperties: boolean;

  /** Schema status */
  status: 'active' | 'deprecated' | 'draft';

  /** Deprecation notice (if status is deprecated) */
  deprecationNotice?: string;

  /** Replacement event name (if deprecated) */
  replacedBy?: string;

  /** Tags for filtering and discovery */
  tags: string[];

  /** When this schema was created */
  createdAt: Date;

  /** When this schema was last updated */
  updatedAt: Date;
}

/**
 * Field definition within an event schema.
 */
interface EventFieldDefinition {
  /** Field data type */
  type: 'string' | 'number' | 'boolean' | 'integer' | 'array' | 'object' | 'date' | 'enum';

  /** Human-readable description */
  description: string;

  /** Whether this field is required */
  required?: boolean;

  /** Allowed values (for enum type) */
  enum?: Array<string | number>;

  /** Default value */
  default?: unknown;

  /** Minimum value (for number/integer) */
  min?: number;

  /** Maximum value (for number/integer) */
  max?: number;

  /** Minimum length (for string/array) */
  minLength?: number;

  /** Maximum length (for string/array) */
  maxLength?: number;

  /** Regex pattern (for string) */
  pattern?: string;

  /** Array item type definition */
  items?: EventFieldDefinition;

  /** Nested object properties */
  properties?: Record<string, EventFieldDefinition>;

  /** Whether this field contains PII */
  pii?: boolean;

  /** PII handling strategy */
  piiStrategy?: 'hash' | 'mask' | 'redact' | 'encrypt';

  /** Whether this field should be indexed for queries */
  indexed?: boolean;

  /** Example values for documentation */
  examples?: unknown[];
}

/**
 * Schema version tracking for migration.
 */
interface SchemaVersion {
  /** Schema ID */
  schemaId: string;

  /** Version string (semver) */
  version: string;

  /** Changes from previous version */
  changelog: string;

  /** Whether this is a breaking change */
  breaking: boolean;

  /** Migration instructions for breaking changes */
  migration?: string;

  /** When this version was published */
  publishedAt: Date;
}
```

### VentureEventConfig

Venture-specific event catalogs defining the taxonomy of events each venture produces.

```typescript
/**
 * Complete event catalog for a venture.
 */
interface VentureEventCatalog {
  /** Venture identifier */
  ventureId: string;

  /** Venture display name */
  ventureName: string;

  /** Event categories and their events */
  categories: Record<string, VentureEventCategory>;

  /** Global events that apply to all ventures */
  includesGlobal: boolean;

  /** Custom enrichment rules for this venture */
  enrichmentRules?: VentureEnrichmentRule[];
}

/**
 * Category of related events within a venture.
 */
interface VentureEventCategory {
  /** Category name */
  name: string;

  /** Category description */
  description: string;

  /** Events in this category */
  events: VentureEventDefinition[];
}

/**
 * Individual event definition in a venture catalog.
 */
interface VentureEventDefinition {
  /** Event name (dot notation) */
  name: EventName;

  /** Human-readable label */
  label: string;

  /** Description of when this event fires */
  description: string;

  /** Associated schema ID */
  schemaId: string;

  /** Whether this is a conversion event */
  isConversion?: boolean;

  /** Revenue field path (if this event carries revenue) */
  revenueField?: string;

  /** Expected volume tier: low, medium, high, very_high */
  volumeTier: 'low' | 'medium' | 'high' | 'very_high';

  /** Whether this event is critical for core flows */
  isCritical?: boolean;
}

/**
 * Venture-specific enrichment rule applied during context enrichment.
 */
interface VentureEnrichmentRule {
  /** Rule name */
  name: string;

  /** Event name pattern to match (glob) */
  eventPattern: string;

  /** Enrichment function */
  enrichment: (event: ValidatedEvent) => Promise<Record<string, unknown>>;
}
```

### MetricsRollup

Pre-computed metrics aggregated from event streams in real-time and batch modes.

```typescript
/**
 * Definition of a metric to be computed from events.
 */
interface MetricDefinition {
  /** Unique metric identifier */
  id: string;

  /** Human-readable metric name */
  name: string;

  /** Description */
  description: string;

  /** Venture this metric belongs to (null for global) */
  ventureId: string | null;

  /** Aggregation type */
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'count_distinct' | 'percentile';

  /** Event name(s) to aggregate */
  eventNames: EventName[];

  /** Optional event filter conditions */
  filters?: MetricFilter[];

  /** Property to aggregate (for sum, avg, min, max) */
  valueField?: string;

  /** Field to count distinct on (for count_distinct) */
  distinctField?: string;

  /** Percentile value (for percentile aggregation, 0-100) */
  percentileValue?: number;

  /** Rollup windows to compute */
  windows: AggregationWindow[];

  /** Dimensions to group by */
  dimensions?: string[];

  /** Whether to compute in real-time (streaming) */
  realtime: boolean;

  /** Whether to compute in batch (scheduled) */
  batch: boolean;
}

/**
 * Aggregation time windows for metrics.
 */
type AggregationWindow = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * Filter condition for metric computation.
 */
interface MetricFilter {
  /** Property path to filter on */
  field: string;

  /** Comparison operator */
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'exists';

  /** Value to compare against */
  value: unknown;
}

/**
 * Query for retrieving computed metrics.
 */
interface MetricQuery {
  /** Metric ID to query */
  metricId: string;

  /** Venture filter */
  ventureId?: string;

  /** Time range start */
  from: Date;

  /** Time range end */
  to: Date;

  /** Aggregation window */
  window: AggregationWindow;

  /** Dimension filters */
  dimensions?: Record<string, string | string[]>;

  /** Whether to include comparison period */
  compare?: {
    /** Comparison type */
    type: 'previous_period' | 'previous_year' | 'custom';
    /** Custom comparison range (for custom type) */
    from?: Date;
    to?: Date;
  };
}

/**
 * Result of a metric query.
 */
interface MetricResult {
  /** Metric definition */
  metric: MetricDefinition;

  /** Time series data points */
  timeSeries: MetricDataPoint[];

  /** Summary statistics for the period */
  summary: {
    /** Current period value */
    value: number;
    /** Comparison period value (if requested) */
    compareValue?: number;
    /** Change percentage */
    changePercent?: number;
    /** Change direction */
    trend?: 'up' | 'down' | 'flat';
  };

  /** Query metadata */
  metadata: {
    /** Query execution time (ms) */
    queryTimeMs: number;
    /** Data freshness — last event timestamp in range */
    lastEventAt?: Date;
    /** Whether real-time or batch data was used */
    dataSource: 'realtime' | 'batch' | 'hybrid';
  };
}

/**
 * Individual data point in a metric time series.
 */
interface MetricDataPoint {
  /** Window start timestamp */
  timestamp: Date;

  /** Metric value for this window */
  value: number;

  /** Dimension values (if grouped) */
  dimensions?: Record<string, string>;

  /** Number of events aggregated */
  eventCount: number;
}
```

### EventMiddleware

Pluggable middleware pipeline for event processing.

```typescript
/**
 * Middleware function for event processing pipeline.
 * Each middleware can transform, filter, or reject events.
 */
type EventMiddleware = (
  event: RawEvent,
  context: MiddlewareContext,
  next: () => Promise<void>,
) => Promise<void>;

/**
 * Context available to middleware during event processing.
 */
interface MiddlewareContext {
  /** The event being processed (mutable) */
  event: RawEvent;

  /** Request metadata */
  request: {
    /** Client IP address */
    ip: string;
    /** Request headers */
    headers: Record<string, string>;
    /** Request timestamp */
    receivedAt: Date;
    /** Write key used for authentication */
    writeKey: string;
  };

  /** Venture configuration */
  venture: {
    id: string;
    name: string;
    config: EventCollectorConfig;
  };

  /** Whether to reject this event */
  reject: (code: string, message: string) => void;

  /** Whether this event was rejected by a previous middleware */
  rejected: boolean;

  /** Rejection details (if rejected) */
  rejection?: { code: string; message: string };

  /** Add a warning without rejecting */
  warn: (code: string, message: string) => void;

  /** Accumulated warnings */
  warnings: Array<{ code: string; message: string }>;

  /** Shared state between middleware */
  state: Map<string, unknown>;
}
```

---

## Venture Event Taxonomies

Each venture defines a catalog of events specific to its domain. All ventures also inherit global events (page views, sessions, identifies).

### Global Events (All Ventures)

| Event Name | Category | Description | Volume |
|---|---|---|---|
| `page.viewed` | Navigation | User viewed a page/screen | Very High |
| `page.scrolled` | Navigation | User scrolled past threshold | High |
| `session.started` | Session | New session began | High |
| `session.ended` | Session | Session ended (timeout or explicit) | High |
| `user.identified` | Identity | Anonymous user linked to known identity | Medium |
| `user.signed_up` | Identity | New user registration | Low |
| `user.signed_in` | Identity | User login | Medium |
| `user.signed_out` | Identity | User logout | Medium |
| `search.performed` | Search | User performed a search | High |
| `error.occurred` | System | Client-side error captured | Medium |
| `notification.received` | Engagement | Push/in-app notification received | Medium |
| `notification.clicked` | Engagement | User clicked a notification | Medium |
| `experiment.viewed` | Experimentation | User exposed to A/B test variant | High |
| `consent.updated` | Privacy | User updated consent preferences | Low |

### BetEdge Events

| Event Name | Category | Description | Volume |
|---|---|---|---|
| `bet.placed` | Wagering | User placed a bet | Very High |
| `bet.settled` | Wagering | Bet result determined (win/loss/void) | Very High |
| `bet.cashed_out` | Wagering | User cashed out early | Medium |
| `odds.viewed` | Browsing | User viewed odds for an event | Very High |
| `odds.compared` | Browsing | User compared odds across bookmakers | High |
| `live_bet.placed` | Live | User placed a live/in-play bet | High |
| `live_bet.streamed` | Live | User watched live stream while betting | Medium |
| `parlay.created` | Wagering | User created a parlay/accumulator | High |
| `parlay.modified` | Wagering | User modified parlay selections | Medium |
| `deposit.completed` | Wallet | User deposited funds | Medium |
| `withdrawal.requested` | Wallet | User requested withdrawal | Low |
| `promotion.claimed` | Marketing | User claimed a promotional offer | Medium |
| `sport.favorited` | Preference | User favorited a sport/league/team | Low |

### SerpSpace Events

| Event Name | Category | Description | Volume |
|---|---|---|---|
| `keyword.tracked` | Tracking | New keyword added to tracking | Medium |
| `keyword.removed` | Tracking | Keyword removed from tracking | Low |
| `rank.checked` | Tracking | SERP rank checked for keyword | Very High |
| `rank.changed` | Tracking | Rank position changed (up/down) | High |
| `report.generated` | Reporting | User generated a rank report | Medium |
| `report.exported` | Reporting | User exported report (PDF/CSV) | Low |
| `report.shared` | Reporting | User shared report with team | Low |
| `competitor.added` | Competitive | Competitor domain added for tracking | Low |
| `competitor.analyzed` | Competitive | Competitor analysis performed | Medium |
| `serp_feature.detected` | Analysis | SERP feature detected (snippet, PAA, etc.) | High |
| `backlink.discovered` | Links | New backlink discovered | Medium |
| `site_audit.started` | Audit | Site audit initiated | Low |
| `site_audit.completed` | Audit | Site audit completed with results | Low |
| `alert.triggered` | Alerts | Rank drop/gain alert triggered | Medium |

### Full Gain Events

| Event Name | Category | Description | Volume |
|---|---|---|---|
| `grant.searched` | Discovery | User searched for grants | High |
| `grant.viewed` | Discovery | User viewed grant details | High |
| `grant.saved` | Discovery | User saved grant to list | Medium |
| `grant.applied` | Application | User started grant application | Medium |
| `grant.submitted` | Application | Grant application submitted | Low |
| `grant.status_changed` | Application | Application status updated | Low |
| `milestone.created` | Milestones | Funding milestone defined | Low |
| `milestone.completed` | Milestones | Milestone marked complete | Low |
| `milestone.evidence_uploaded` | Milestones | Evidence uploaded for milestone | Low |
| `funding.received` | Finance | Funding disbursement received | Low |
| `funding.reported` | Finance | Financial report submitted | Low |
| `eligibility.checked` | Discovery | User checked eligibility for grant | High |
| `document.uploaded` | Application | Document uploaded for application | Medium |
| `advisor.contacted` | Support | User contacted funding advisor | Low |

### MCV Studios Events

| Event Name | Category | Description | Volume |
|---|---|---|---|
| `game.started` | Gameplay | User started a game session | Very High |
| `game.ended` | Gameplay | Game session ended | Very High |
| `game.paused` | Gameplay | User paused the game | High |
| `game.resumed` | Gameplay | User resumed from pause | High |
| `level.started` | Progression | User started a new level | Very High |
| `level.completed` | Progression | User completed a level | High |
| `level.failed` | Progression | User failed a level | High |
| `achievement.unlocked` | Progression | User unlocked an achievement | Medium |
| `purchase.started` | Monetization | In-app purchase flow started | Medium |
| `purchase.completed` | Monetization | In-app purchase completed | Medium |
| `purchase.failed` | Monetization | In-app purchase failed | Low |
| `virtual_currency.earned` | Economy | User earned virtual currency | Very High |
| `virtual_currency.spent` | Economy | User spent virtual currency | High |
| `social.shared` | Social | User shared game content | Low |
| `tutorial.started` | Onboarding | User started tutorial | Medium |
| `tutorial.completed` | Onboarding | User completed tutorial | Medium |
| `tutorial.skipped` | Onboarding | User skipped tutorial | Low |
| `ad.viewed` | Monetization | User viewed a rewarded ad | High |
| `ad.clicked` | Monetization | User clicked an ad | Medium |

### Futurestate Events

| Event Name | Category | Description | Volume |
|---|---|---|---|
| `property.viewed` | Browsing | User viewed a property listing | Very High |
| `property.saved` | Browsing | User saved/favorited a property | Medium |
| `property.shared` | Browsing | User shared a property listing | Low |
| `property.compared` | Browsing | User compared multiple properties | Medium |
| `search.filtered` | Search | User applied search filters | Very High |
| `search.saved` | Search | User saved a search | Low |
| `offer.started` | Transaction | User started an offer | Low |
| `offer.submitted` | Transaction | Offer submitted on property | Low |
| `offer.accepted` | Transaction | Offer accepted by seller | Low |
| `offer.rejected` | Transaction | Offer rejected by seller | Low |
| `offer.countered` | Transaction | Counter-offer received | Low |
| `inspection.scheduled` | Transaction | Property inspection scheduled | Low |
| `inspection.completed` | Transaction | Inspection completed with report | Low |
| `mortgage.calculated` | Finance | User used mortgage calculator | High |
| `mortgage.preapproved` | Finance | User received pre-approval | Low |
| `agent.contacted` | Communication | User contacted a real estate agent | Medium |
| `virtual_tour.started` | Browsing | User started a virtual property tour | Medium |
| `virtual_tour.completed` | Browsing | User completed virtual tour | Medium |
| `open_house.registered` | Events | User registered for open house | Low |

---

## Database Schemas

### events (Partitioned by Date)

The primary events table is range-partitioned by `received_at` on a monthly basis for query performance and data lifecycle management.

```typescript
import { pgTable, text, timestamp, jsonb, uuid, index, bigint } from 'drizzle-orm/pg-core';

/**
 * Core events table — partitioned by received_at (monthly).
 * Each partition: events_YYYY_MM
 *
 * Partition creation is automated via pg_partman or a scheduled job.
 */
export const events = pgTable(
  'events',
  {
    /** Server-assigned unique event ID (ULID stored as text) */
    id: text('id').primaryKey(),

    /** Event name from venture taxonomy */
    eventName: text('event_name').notNull(),

    /** Resolved profile ID */
    profileId: text('profile_id').notNull(),

    /** Original anonymous ID */
    anonymousId: text('anonymous_id'),

    /** Venture identifier */
    ventureId: text('venture_id').notNull(),

    /** Event-specific properties (validated JSON) */
    properties: jsonb('properties').notNull().default({}),

    /** Full enriched context */
    context: jsonb('context').notNull().default({}),

    /** Client-provided timestamp */
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),

    /** Server receive time */
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),

    /** Server processing time */
    processedAt: timestamp('processed_at', { withTimezone: true }).notNull(),

    /** Schema version used for validation */
    schemaVersion: text('schema_version').notNull(),

    /** Client-generated dedup key */
    messageId: text('message_id').notNull(),

    /** Event category (denormalized for query perf) */
    category: text('category'),

    /** Whether this is a conversion event (denormalized) */
    isConversion: text('is_conversion').default('false'),

    /** Revenue amount (denormalized for fast aggregation) */
    revenue: text('revenue'),

    /** Revenue currency */
    revenueCurrency: text('revenue_currency'),

    /** Device type (denormalized for filtering) */
    deviceType: text('device_type'),

    /** Country code (denormalized for filtering) */
    country: text('country'),

    /** Session ID (denormalized for session queries) */
    sessionId: text('session_id'),
  },
  (table) => ({
    /** Primary query pattern: events for a profile */
    profileTimeIdx: index('idx_events_profile_time')
      .on(table.ventureId, table.profileId, table.receivedAt),

    /** Event type queries within a venture */
    ventureEventIdx: index('idx_events_venture_event')
      .on(table.ventureId, table.eventName, table.receivedAt),

    /** Session-based event grouping */
    sessionIdx: index('idx_events_session')
      .on(table.sessionId, table.receivedAt),

    /** Deduplication lookups */
    dedupIdx: index('idx_events_dedup')
      .on(table.ventureId, table.messageId),

    /** Conversion event queries */
    conversionIdx: index('idx_events_conversions')
      .on(table.ventureId, table.isConversion, table.receivedAt),

    /** Country-based analytics */
    countryIdx: index('idx_events_country')
      .on(table.ventureId, table.country, table.receivedAt),
  })
);

/**
 * SQL for partition creation (executed by migration or pg_partman).
 *
 * CREATE TABLE events (
 *   ...
 * ) PARTITION BY RANGE (received_at);
 *
 * -- Monthly partitions
 * CREATE TABLE events_2026_01 PARTITION OF events
 *   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
 * CREATE TABLE events_2026_02 PARTITION OF events
 *   FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
 * -- ... auto-created by pg_partman
 *
 * -- Retention: partitions older than configured retention are detached and archived
 */
```

### event_schemas

Registry of event schemas with versioning for validation and documentation.

```typescript
export const eventSchemas = pgTable(
  'event_schemas',
  {
    /** Unique schema identifier */
    id: text('id').primaryKey(),

    /** Event name this schema validates */
    eventName: text('event_name').notNull(),

    /** Venture ID (null for global events) */
    ventureId: text('venture_id'),

    /** Schema version (semver) */
    version: text('version').notNull(),

    /** Human-readable description */
    description: text('description').notNull(),

    /** Event category */
    category: text('category').notNull(),

    /** JSON Schema for property validation */
    propertiesSchema: jsonb('properties_schema').notNull(),

    /** Required property names */
    requiredProperties: jsonb('required_properties').notNull().default([]),

    /** Whether additional properties are allowed */
    additionalProperties: text('additional_properties').notNull().default('true'),

    /** PII field paths for compliance */
    piiFields: jsonb('pii_fields').notNull().default([]),

    /** Schema status */
    status: text('status').notNull().default('active'),

    /** Deprecation notice */
    deprecationNotice: text('deprecation_notice'),

    /** Replacement event (if deprecated) */
    replacedBy: text('replaced_by'),

    /** Tags for filtering */
    tags: jsonb('tags').notNull().default([]),

    /** Who created this schema */
    createdBy: text('created_by').notNull(),

    /** Creation timestamp */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

    /** Last update timestamp */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    /** Look up schema by event name and venture */
    eventVentureIdx: index('idx_event_schemas_event_venture')
      .on(table.eventName, table.ventureId),

    /** Look up active schemas */
    statusIdx: index('idx_event_schemas_status')
      .on(table.status),

    /** Version history for an event */
    versionIdx: index('idx_event_schemas_version')
      .on(table.eventName, table.ventureId, table.version),
  })
);
```

### metrics_rollups

Pre-computed metric aggregations at various time windows.

```typescript
export const metricsRollups = pgTable(
  'metrics_rollups',
  {
    /** Composite primary key: metric_id + window + timestamp + venture + dimensions */
    id: text('id').primaryKey(),

    /** Metric definition ID */
    metricId: text('metric_id').notNull(),

    /** Venture ID */
    ventureId: text('venture_id').notNull(),

    /** Aggregation window */
    window: text('window').notNull(), // 'minute' | 'hour' | 'day' | 'week' | 'month'

    /** Window start timestamp */
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),

    /** Window end timestamp */
    windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),

    /** Aggregated metric value */
    value: text('value').notNull(), // stored as text for precision

    /** Number of events aggregated */
    eventCount: bigint('event_count', { mode: 'number' }).notNull(),

    /** Dimension values for grouped metrics */
    dimensions: jsonb('dimensions').notNull().default({}),

    /** Aggregation type used */
    aggregationType: text('aggregation_type').notNull(),

    /** Whether this was computed in real-time or batch */
    computedBy: text('computed_by').notNull(), // 'realtime' | 'batch'

    /** When this rollup was computed */
    computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),

    /** Whether this rollup has been finalized (batch-corrected) */
    finalized: text('finalized').notNull().default('false'),
  },
  (table) => ({
    /** Primary query pattern: metric values over time */
    metricTimeIdx: index('idx_metrics_rollups_metric_time')
      .on(table.metricId, table.ventureId, table.window, table.windowStart),

    /** Dashboard queries: all metrics for a venture in a window */
    ventureWindowIdx: index('idx_metrics_rollups_venture_window')
      .on(table.ventureId, table.window, table.windowStart),

    /** Batch finalization lookups */
    finalizedIdx: index('idx_metrics_rollups_finalized')
      .on(table.metricId, table.finalized, table.windowStart),
  })
);
```

### dead_letter_events

Events that failed processing, captured for investigation and retry.

```typescript
export const deadLetterEvents = pgTable(
  'dead_letter_events',
  {
    /** Unique DLQ entry ID */
    id: text('id').primaryKey(),

    /** Original event payload (as received) */
    originalPayload: jsonb('original_payload').notNull(),

    /** Venture ID (extracted from payload if possible) */
    ventureId: text('venture_id'),

    /** Event name (extracted from payload if possible) */
    eventName: text('event_name'),

    /** Error code */
    errorCode: text('error_code').notNull(),

    /** Human-readable error message */
    errorMessage: text('error_message').notNull(),

    /** Detailed error context (stack trace, validation errors, etc.) */
    errorDetails: jsonb('error_details').notNull().default({}),

    /** Processing stage where failure occurred */
    failedAt: text('failed_at').notNull(), // 'validation' | 'enrichment' | 'streaming' | 'storage'

    /** Number of retry attempts */
    retryCount: bigint('retry_count', { mode: 'number' }).notNull().default(0),

    /** Maximum retries allowed */
    maxRetries: bigint('max_retries', { mode: 'number' }).notNull().default(3),

    /** When the next retry is scheduled */
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),

    /** Current status */
    status: text('status').notNull().default('pending'),
    // 'pending' | 'retrying' | 'resolved' | 'failed_permanent' | 'discarded'

    /** Resolution notes (when manually resolved or discarded) */
    resolutionNotes: text('resolution_notes'),

    /** Who resolved this entry */
    resolvedBy: text('resolved_by'),

    /** When this entry was created */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

    /** When this entry was last updated */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

    /** When this entry was resolved */
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => ({
    /** Query DLQ by status for processing */
    statusRetryIdx: index('idx_dlq_status_retry')
      .on(table.status, table.nextRetryAt),

    /** Query DLQ by venture for investigation */
    ventureIdx: index('idx_dlq_venture')
      .on(table.ventureId, table.createdAt),

    /** Query DLQ by error code for pattern analysis */
    errorCodeIdx: index('idx_dlq_error_code')
      .on(table.errorCode, table.createdAt),

    /** Query DLQ by failure stage */
    failedAtIdx: index('idx_dlq_failed_at')
      .on(table.failedAt, table.createdAt),
  })
);
```

### event_replay_jobs

Tracks event replay jobs for backfilling traits, segments, and other derived data.

```typescript
export const eventReplayJobs = pgTable(
  'event_replay_jobs',
  {
    /** Unique job ID */
    id: text('id').primaryKey(),

    /** Human-readable job name */
    name: text('name').notNull(),

    /** Job description / reason for replay */
    description: text('description'),

    /** Venture ID filter (null = all ventures) */
    ventureId: text('venture_id'),

    /** Event name filter (null = all events) */
    eventNames: jsonb('event_names'), // string[]

    /** Profile ID filter (null = all profiles) */
    profileIds: jsonb('profile_ids'), // string[]

    /** Replay time range start */
    rangeStart: timestamp('range_start', { withTimezone: true }).notNull(),

    /** Replay time range end */
    rangeEnd: timestamp('range_end', { withTimezone: true }).notNull(),

    /** Target consumer group for replay */
    targetConsumerGroup: text('target_consumer_group').notNull(),

    /** Target topic to replay into */
    targetTopic: text('target_topic').notNull(),

    /** Replay speed multiplier (1.0 = real-time, 0 = as-fast-as-possible) */
    speedMultiplier: text('speed_multiplier').notNull().default('0'),

    /** Job status */
    status: text('status').notNull().default('pending'),
    // 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

    /** Total events matching the filter */
    totalEvents: bigint('total_events', { mode: 'number' }),

    /** Events processed so far */
    processedEvents: bigint('processed_events', { mode: 'number' }).notNull().default(0),

    /** Events that failed during replay */
    failedEvents: bigint('failed_events', { mode: 'number' }).notNull().default(0),

    /** Last event ID processed (for resumption) */
    lastProcessedId: text('last_processed_id'),

    /** Throughput: events per second */
    eventsPerSecond: text('events_per_second'),

    /** Estimated time remaining in seconds */
    estimatedSecondsRemaining: bigint('estimated_seconds_remaining', { mode: 'number' }),

    /** Error message (if failed) */
    errorMessage: text('error_message'),

    /** Who initiated this replay */
    initiatedBy: text('initiated_by').notNull(),

    /** When the job was created */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

    /** When the job started processing */
    startedAt: timestamp('started_at', { withTimezone: true }),

    /** When the job completed */
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    /** Query jobs by status */
    statusIdx: index('idx_replay_jobs_status')
      .on(table.status),

    /** Query jobs by venture */
    ventureIdx: index('idx_replay_jobs_venture')
      .on(table.ventureId, table.createdAt),
  })
);
```

---

## Code Examples

### 1. Track a Single Event

```typescript
import { createEventCollector } from '@mcv/cdp/events';

// Create a collector for a specific venture
const collector = createEventCollector({
  ventureId: 'betedge',
  maxBatchSize: 100,
  maxEventSizeBytes: 32_768,        // 32KB max per event
  dedupWindowMs: 5 * 60 * 1000,     // 5 minute dedup window
  rateLimitPerUser: 50,              // 50 events/sec per user
  rateLimitPerVenture: 10_000,       // 10k events/sec per venture
  strictValidation: true,
  enrichment: {
    device: true,
    geo: true,
    session: true,
    referrer: true,
  },
  dlq: {
    enabled: true,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
  producer: {
    brokers: [process.env.REDPANDA_BROKER_URL!],
    clientId: 'cdp-events-betedge',
    topic: 'cdp.events.raw',
    compression: 'snappy',
    batchSize: 16384,
    lingerMs: 10,
  },
});

// Track a bet placement event
const enrichedEvent = await collector.track({
  event: 'bet.placed',
  userId: 'user_abc123',
  ventureId: 'betedge',
  properties: {
    betId: 'bet_xyz789',
    sport: 'football',
    league: 'NFL',
    market: 'moneyline',
    selection: 'Kansas City Chiefs',
    odds: 2.35,
    stake: 25.00,
    currency: 'USD',
    betType: 'single',
    isLive: false,
    eventId: 'nfl_2026_sb_61',
    eventName: 'Super Bowl LXI',
  },
  context: {
    page: {
      url: 'https://betedge.com/nfl/super-bowl',
      path: '/nfl/super-bowl',
      title: 'Super Bowl LXI Betting',
    },
  },
  timestamp: new Date().toISOString(),
});

console.log('Event tracked:', enrichedEvent.id);
// evt_betedge_01HXYZ123ABC...

console.log('Device:', enrichedEvent.context.device.type);
// "mobile"

console.log('Location:', enrichedEvent.context.location.country);
// "CA"

console.log('Session:', enrichedEvent.context.session.sessionId);
// "sess_abc123_20260208"
```

### 2. Batch Collect Events

```typescript
import { createEventCollector } from '@mcv/cdp/events';

const collector = createEventCollector({
  ventureId: 'mcvstudios',
  maxBatchSize: 500,
  maxEventSizeBytes: 16_384,
  dedupWindowMs: 5 * 60 * 1000,
  rateLimitPerUser: 100,    // Games generate high-frequency events
  rateLimitPerVenture: 50_000,
  strictValidation: true,
  enrichment: { device: true, geo: true, session: true, referrer: false },
  dlq: { enabled: true, maxRetries: 3, retryDelayMs: 1000 },
  producer: {
    brokers: [process.env.REDPANDA_BROKER_URL!],
    clientId: 'cdp-events-mcvstudios',
    topic: 'cdp.events.raw',
    compression: 'snappy',
    batchSize: 32768,
    lingerMs: 5,
  },
});

// Batch of game events from a single session
const batchResult = await collector.trackBatch([
  {
    event: 'game.started',
    userId: 'player_001',
    ventureId: 'mcvstudios',
    properties: {
      gameId: 'stellar-conquest',
      gameVersion: '2.4.1',
      platform: 'ios',
      sessionType: 'ranked',
    },
    messageId: 'msg_aaa111',
  },
  {
    event: 'level.started',
    userId: 'player_001',
    ventureId: 'mcvstudios',
    properties: {
      gameId: 'stellar-conquest',
      levelId: 'campaign_03_07',
      levelName: 'The Dark Nebula',
      difficulty: 'hard',
      attemptsCount: 2,
    },
    messageId: 'msg_aaa112',
  },
  {
    event: 'virtual_currency.earned',
    userId: 'player_001',
    ventureId: 'mcvstudios',
    properties: {
      gameId: 'stellar-conquest',
      currencyType: 'star_credits',
      amount: 500,
      source: 'level_reward',
      levelId: 'campaign_03_07',
    },
    messageId: 'msg_aaa113',
  },
  {
    event: 'level.completed',
    userId: 'player_001',
    ventureId: 'mcvstudios',
    properties: {
      gameId: 'stellar-conquest',
      levelId: 'campaign_03_07',
      levelName: 'The Dark Nebula',
      difficulty: 'hard',
      completionTimeMs: 234_500,
      score: 94_200,
      stars: 3,
      perfectRun: false,
    },
    messageId: 'msg_aaa114',
  },
  {
    event: 'achievement.unlocked',
    userId: 'player_001',
    ventureId: 'mcvstudios',
    properties: {
      gameId: 'stellar-conquest',
      achievementId: 'nebula_navigator',
      achievementName: 'Nebula Navigator',
      achievementTier: 'gold',
      xpReward: 1000,
    },
    messageId: 'msg_aaa115',
  },
]);

console.log(`Batch result: ${batchResult.succeeded}/${batchResult.total} succeeded`);
// Batch result: 5/5 succeeded

console.log(`Processing time: ${batchResult.metadata.processingTimeMs}ms`);
// Processing time: 12ms

console.log(`Duplicates filtered: ${batchResult.metadata.duplicatesFiltered}`);
// Duplicates filtered: 0

// Handle partial failures
for (const result of batchResult.results) {
  if (!result.success) {
    console.error(`Event ${result.index} failed:`, result.error);
  }
}
```

### 3. Define a Venture Event Schema

```typescript
import { EventSchemaRegistry } from '@mcv/cdp/events';
import { db } from '@mcv/infra/supabase';

const registry = new EventSchemaRegistry(db);

// Register a new event schema for Futurestate
await registry.register({
  eventName: 'property.viewed',
  ventureId: 'futurestate',
  version: '1.2.0',
  description: 'Fired when a user views a property listing page. Includes property details and viewing context.',
  category: 'Browsing',
  properties: {
    propertyId: {
      type: 'string',
      description: 'Unique property listing identifier',
      required: true,
      pattern: '^prop_[a-zA-Z0-9]+$',
      examples: ['prop_abc123', 'prop_xyz789'],
    },
    propertyType: {
      type: 'enum',
      description: 'Type of property',
      required: true,
      enum: ['house', 'condo', 'townhouse', 'apartment', 'land', 'commercial'],
    },
    listingPrice: {
      type: 'number',
      description: 'Listed price in listing currency',
      required: true,
      min: 0,
      examples: [450000, 1250000],
    },
    currency: {
      type: 'string',
      description: 'Price currency code (ISO 4217)',
      required: true,
      pattern: '^[A-Z]{3}$',
      default: 'CAD',
    },
    bedrooms: {
      type: 'integer',
      description: 'Number of bedrooms',
      min: 0,
      max: 50,
    },
    bathrooms: {
      type: 'number',
      description: 'Number of bathrooms (supports half baths)',
      min: 0,
      max: 50,
    },
    squareFootage: {
      type: 'number',
      description: 'Property size in square feet',
      min: 0,
    },
    city: {
      type: 'string',
      description: 'Property city',
      required: true,
    },
    province: {
      type: 'string',
      description: 'Province or state code',
      required: true,
    },
    postalCode: {
      type: 'string',
      description: 'Postal/ZIP code',
      pii: true,
      piiStrategy: 'mask',
    },
    viewSource: {
      type: 'enum',
      description: 'How the user arrived at this listing',
      enum: ['search_results', 'saved_list', 'recommendation', 'direct_link', 'map_view', 'similar_properties'],
      required: true,
    },
    hasVirtualTour: {
      type: 'boolean',
      description: 'Whether the property has a virtual tour available',
    },
    daysOnMarket: {
      type: 'integer',
      description: 'Number of days the property has been listed',
      min: 0,
    },
    agentId: {
      type: 'string',
      description: 'Listing agent identifier',
    },
    viewDurationMs: {
      type: 'integer',
      description: 'Time spent viewing the listing (ms), captured on departure',
      min: 0,
    },
    photosViewed: {
      type: 'integer',
      description: 'Number of listing photos the user viewed',
      min: 0,
    },
  },
  required: ['propertyId', 'propertyType', 'listingPrice', 'currency', 'city', 'province', 'viewSource'],
  additionalProperties: false,
  status: 'active',
  tags: ['browsing', 'property', 'core-funnel'],
});

console.log('Schema registered: property.viewed v1.2.0');

// Validate an event against the schema
import { validateEvent } from '@mcv/cdp/events';

const result = await validateEvent(
  {
    event: 'property.viewed',
    ventureId: 'futurestate',
    properties: {
      propertyId: 'prop_abc123',
      propertyType: 'condo',
      listingPrice: 589000,
      currency: 'CAD',
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 1100,
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 3A8',
      viewSource: 'search_results',
      hasVirtualTour: true,
      daysOnMarket: 14,
    },
  },
  registry,
);

console.log('Valid:', result.valid);
// Valid: true

console.log('PII fields detected:', result.piiFields);
// PII fields detected: ['postalCode']

console.log('Warnings:', result.warnings);
// Warnings: []
```

### 4. Query Metrics Rollups

```typescript
import { MetricsRollup } from '@mcv/cdp/events';
import { db } from '@mcv/infra/supabase';

const metrics = new MetricsRollup(db);

// Define a DAU metric for BetEdge
await metrics.defineMetric({
  id: 'betedge_dau',
  name: 'BetEdge Daily Active Users',
  description: 'Count of unique users who performed any action on BetEdge in a day',
  ventureId: 'betedge',
  aggregation: 'count_distinct',
  eventNames: ['*'],  // All events count toward DAU
  distinctField: 'profileId',
  windows: ['day', 'week', 'month'],
  realtime: true,
  batch: true,
});

// Define a conversion rate metric
await metrics.defineMetric({
  id: 'betedge_bet_conversion',
  name: 'BetEdge Odds-to-Bet Conversion Rate',
  description: 'Percentage of odds.viewed events that lead to bet.placed within the same session',
  ventureId: 'betedge',
  aggregation: 'count',
  eventNames: ['bet.placed'],
  windows: ['hour', 'day', 'week'],
  dimensions: ['sport', 'market'],
  realtime: true,
  batch: true,
});

// Define a revenue metric
await metrics.defineMetric({
  id: 'betedge_revenue',
  name: 'BetEdge Total Stakes',
  description: 'Sum of all bet stakes placed on BetEdge',
  ventureId: 'betedge',
  aggregation: 'sum',
  eventNames: ['bet.placed'],
  valueField: 'properties.stake',
  filters: [
    { field: 'properties.currency', operator: 'eq', value: 'USD' },
  ],
  windows: ['hour', 'day', 'week', 'month'],
  dimensions: ['properties.sport', 'properties.betType'],
  realtime: true,
  batch: true,
});

// Query DAU for the last 30 days
const dauResult = await metrics.query({
  metricId: 'betedge_dau',
  ventureId: 'betedge',
  from: new Date('2026-01-09'),
  to: new Date('2026-02-08'),
  window: 'day',
  compare: { type: 'previous_period' },
});

console.log('DAU Summary:', dauResult.summary);
// {
//   value: 45_230,          // Average DAU this period
//   compareValue: 41_800,   // Average DAU previous period
//   changePercent: 8.2,
//   trend: 'up'
// }

console.log('Time series points:', dauResult.timeSeries.length);
// 31

console.log('Data source:', dauResult.metadata.dataSource);
// "batch" (for historical data)

// Query revenue by sport for today (real-time)
const revenueResult = await metrics.query({
  metricId: 'betedge_revenue',
  ventureId: 'betedge',
  from: new Date('2026-02-08T00:00:00Z'),
  to: new Date('2026-02-08T23:59:59Z'),
  window: 'hour',
  dimensions: { 'properties.sport': ['football', 'basketball', 'hockey'] },
});

console.log('Today revenue by sport:');
for (const point of revenueResult.timeSeries) {
  console.log(`  ${point.timestamp.toISOString()} | ${point.dimensions?.['properties.sport']} | $${point.value}`);
}
// 2026-02-08T00:00:00Z | football | $124,500
// 2026-02-08T00:00:00Z | basketball | $89,200
// 2026-02-08T00:00:00Z | hockey | $45,800
// ...
```

### 5. Replay Historical Events

```typescript
import { EventReplayer } from '@mcv/cdp/events';
import { db } from '@mcv/infra/supabase';

const replayer = new EventReplayer(db, {
  brokers: [process.env.REDPANDA_BROKER_URL!],
  clientId: 'cdp-event-replayer',
});

// Create a replay job to backfill a new computed trait
// Scenario: We added a new "total_virtual_currency_earned" trait
// and need to compute it from historical events
const job = await replayer.createJob({
  name: 'Backfill total_virtual_currency_earned trait',
  description: 'Replay virtual_currency.earned events to compute lifetime earnings for MCV Studios players',
  ventureId: 'mcvstudios',
  eventNames: ['virtual_currency.earned'],
  rangeStart: new Date('2025-01-01'),
  rangeEnd: new Date('2026-02-08'),
  targetConsumerGroup: 'cdp-trait-processor-backfill',
  targetTopic: 'cdp.events.replay',
  speedMultiplier: 0, // As fast as possible
  initiatedBy: 'admin@mcv.com',
});

console.log('Replay job created:', job.id);
// replay_01HXYZ...

console.log('Total events to replay:', job.totalEvents);
// 12,450,000

// Start the replay
await replayer.start(job.id);

// Monitor progress
const interval = setInterval(async () => {
  const progress = await replayer.getProgress(job.id);

  console.log(`Progress: ${progress.processedEvents}/${progress.totalEvents} (${progress.percentComplete}%)`);
  console.log(`Throughput: ${progress.eventsPerSecond} events/sec`);
  console.log(`ETA: ${progress.estimatedSecondsRemaining}s`);
  console.log(`Failed: ${progress.failedEvents}`);
  console.log('---');

  if (progress.status === 'completed' || progress.status === 'failed') {
    clearInterval(interval);
    console.log('Replay finished with status:', progress.status);
  }
}, 5000);

// Progress: 1,245,000/12,450,000 (10%)
// Throughput: 85,000 events/sec
// ETA: 132s
// Failed: 23
// ---
// Progress: 6,225,000/12,450,000 (50%)
// Throughput: 92,000 events/sec
// ETA: 68s
// Failed: 41
// ---
// ...

// Pause/resume if needed
await replayer.pause(job.id);
await replayer.resume(job.id);

// Cancel if something goes wrong
// await replayer.cancel(job.id);

// Replay with profile filter (for targeted backfills)
const targetedJob = await replayer.createJob({
  name: 'Backfill specific players',
  description: 'Replay events for players who reported incorrect trait values',
  ventureId: 'mcvstudios',
  eventNames: ['virtual_currency.earned', 'virtual_currency.spent', 'purchase.completed'],
  profileIds: ['player_001', 'player_002', 'player_003'],
  rangeStart: new Date('2025-06-01'),
  rangeEnd: new Date('2026-02-08'),
  targetConsumerGroup: 'cdp-trait-processor-backfill',
  targetTopic: 'cdp.events.replay',
  speedMultiplier: 0,
  initiatedBy: 'admin@mcv.com',
});
```

### 6. Working with the Dead Letter Queue

```typescript
import { DeadLetterQueue, DLQProcessor } from '@mcv/cdp/events';
import { db } from '@mcv/infra/supabase';

const dlq = new DeadLetterQueue(db);

// Query DLQ entries for investigation
const pendingEntries = await dlq.query({
  status: 'pending',
  ventureId: 'serpspace',
  limit: 50,
  orderBy: 'createdAt',
  order: 'desc',
});

console.log(`${pendingEntries.total} pending DLQ entries for SerpSpace`);

// Inspect a specific entry
const entry = pendingEntries.items[0];
console.log('Error:', entry.errorCode, '-', entry.errorMessage);
console.log('Failed at:', entry.failedAt);
console.log('Original event:', JSON.stringify(entry.originalPayload, null, 2));
console.log('Retry count:', entry.retryCount);

// Manually retry a specific entry
await dlq.retry(entry.id);

// Bulk retry all validation errors from a specific time range
// (useful after fixing a schema bug)
const retried = await dlq.bulkRetry({
  errorCode: 'EVT_VALIDATION_FAILED',
  ventureId: 'serpspace',
  createdAfter: new Date('2026-02-07'),
  createdBefore: new Date('2026-02-08'),
});

console.log(`Retried ${retried.count} entries`);

// Discard entries that are not recoverable
await dlq.discard(entry.id, {
  reason: 'Malformed client SDK payload from deprecated v1.0 SDK',
  resolvedBy: 'admin@mcv.com',
});

// Get DLQ statistics for monitoring
const stats = await dlq.stats();
console.log('DLQ Stats:', stats);
// {
//   total: 1_234,
//   byStatus: { pending: 156, retrying: 12, resolved: 890, failed_permanent: 45, discarded: 131 },
//   byVenture: { betedge: 340, serpspace: 210, ... },
//   byErrorCode: { EVT_VALIDATION_FAILED: 500, EVT_ENRICHMENT_ERROR: 120, ... },
//   byFailedAt: { validation: 600, enrichment: 150, streaming: 400, storage: 84 },
//   oldestPending: '2026-02-01T04:23:00Z',
// }

// Set up automatic DLQ processing
const processor = new DLQProcessor(dlq, {
  pollIntervalMs: 30_000,     // Check every 30 seconds
  batchSize: 50,               // Process 50 entries per batch
  maxRetries: 3,               // Max 3 retries per entry
  retryBackoff: 'exponential', // Exponential backoff
  retryBaseMs: 1000,           // 1s, 2s, 4s
  autoDiscard: {
    enabled: true,
    afterDays: 30,             // Auto-discard after 30 days
    notifyChannel: 'cdp-alerts',
  },
});

await processor.start();
```

### 7. Custom Event Middleware

```typescript
import { createEventCollector, type EventMiddleware } from '@mcv/cdp/events';

// PII scrubbing middleware — removes or hashes PII fields before storage
const piiScrubber: EventMiddleware = async (event, context, next) => {
  if (event.properties) {
    const schema = await context.state.get('schema') as EventSchema | undefined;

    if (schema) {
      for (const [field, def] of Object.entries(schema.properties)) {
        if (def.pii && event.properties[field] !== undefined) {
          switch (def.piiStrategy) {
            case 'hash':
              event.properties[field] = await hashValue(String(event.properties[field]));
              break;
            case 'mask':
              event.properties[field] = maskValue(String(event.properties[field]));
              break;
            case 'redact':
              event.properties[field] = '[REDACTED]';
              break;
            case 'encrypt':
              event.properties[field] = await encryptValue(String(event.properties[field]));
              break;
          }
        }
      }
    }
  }

  await next();
};

// Bot detection middleware — filters out known bot traffic
const botFilter: EventMiddleware = async (event, context, next) => {
  const userAgent = context.request.headers['user-agent'] || '';

  if (isKnownBot(userAgent)) {
    context.reject('EVT_BOT_DETECTED', `Bot traffic filtered: ${extractBotName(userAgent)}`);
    return;
  }

  // Flag suspicious patterns without rejecting
  if (isSuspiciousPattern(context.request.ip, event)) {
    context.warn('EVT_SUSPICIOUS_PATTERN', 'Event matches suspicious traffic pattern');
    event.properties = {
      ...event.properties,
      _suspicious: true,
      _suspiciousReason: 'pattern_match',
    };
  }

  await next();
};

// Revenue normalization middleware — ensures consistent currency handling
const revenueNormalizer: EventMiddleware = async (event, context, next) => {
  if (event.properties?.revenue !== undefined) {
    const amount = Number(event.properties.revenue);
    if (isNaN(amount) || amount < 0) {
      context.reject('EVT_INVALID_REVENUE', `Invalid revenue value: ${event.properties.revenue}`);
      return;
    }

    // Normalize to cents for precision
    event.properties.revenueInCents = Math.round(amount * 100);
    event.properties.revenueCurrency = event.properties.currency || 'USD';
  }

  await next();
};

// Register middleware on the collector
const collector = createEventCollector({ /* ... config ... */ });

collector.use(botFilter);           // 1. Filter bots first
collector.use(piiScrubber);         // 2. Scrub PII
collector.use(revenueNormalizer);   // 3. Normalize revenue

// Middleware executes in registration order for each event
```

### 8. Real-Time Metrics Aggregation

```typescript
import { RealTimeAggregator } from '@mcv/cdp/events';

const aggregator = new RealTimeAggregator({
  brokers: [process.env.REDPANDA_BROKER_URL!],
  consumerGroup: 'cdp-metrics-realtime',
  topic: 'cdp.events.enriched',
  flushIntervalMs: 10_000,    // Flush to DB every 10 seconds
  windowBufferMs: 60_000,     // Buffer 1 minute of windows for late events
});

// Register metric computations
aggregator.register({
  id: 'global_events_per_minute',
  name: 'Global Events Per Minute',
  description: 'Total events across all ventures per minute',
  ventureId: null, // Global
  aggregation: 'count',
  eventNames: ['*'],
  windows: ['minute', 'hour'],
  realtime: true,
  batch: false,
});

aggregator.register({
  id: 'betedge_live_bets',
  name: 'BetEdge Live Bets',
  description: 'Count of live bets placed in real-time',
  ventureId: 'betedge',
  aggregation: 'count',
  eventNames: ['live_bet.placed'],
  windows: ['minute', 'hour'],
  dimensions: ['properties.sport'],
  realtime: true,
  batch: false,
});

aggregator.register({
  id: 'futurestate_property_views_by_city',
  name: 'Futurestate Property Views by City',
  description: 'Property views grouped by city',
  ventureId: 'futurestate',
  aggregation: 'count',
  eventNames: ['property.viewed'],
  windows: ['hour', 'day'],
  dimensions: ['properties.city'],
  realtime: true,
  batch: true,
});

// Start consuming and aggregating
await aggregator.start();

// Query real-time metrics (last 5 minutes)
const liveMetrics = await aggregator.getCurrentWindow('betedge_live_bets', 'minute');
console.log('Live bets in current minute:', liveMetrics);
// { value: 342, dimensions: { 'properties.sport': { football: 180, basketball: 95, hockey: 67 } } }

// Graceful shutdown
process.on('SIGTERM', async () => {
  await aggregator.flush();
  await aggregator.stop();
});
```

---

## Error Codes

| Code | HTTP | Description | Resolution |
|---|---|---|---|
| `EVT_VALIDATION_FAILED` | 400 | Event failed schema validation. Required properties missing, type mismatch, or value out of range. | Check event properties against the registered schema. Use `validateEvent()` for pre-flight validation. |
| `EVT_SCHEMA_NOT_FOUND` | 400 | No schema registered for this event name and venture combination. | Register a schema via `EventSchemaRegistry.register()` or use a recognized global event name. |
| `EVT_DUPLICATE_EVENT` | 409 | Event with this `messageId` was already processed within the deduplication window. | This is expected behavior for at-least-once delivery. The original event was successfully processed. |
| `EVT_RATE_LIMITED` | 429 | Rate limit exceeded for user or venture. Per-user and per-venture limits are configurable. | Back off and retry with exponential backoff. Consider batching events to reduce request count. |
| `EVT_PAYLOAD_TOO_LARGE` | 413 | Event payload exceeds `maxEventSizeBytes` limit (default 32KB). | Reduce event properties size. Move large data to separate storage and reference by ID. |
| `EVT_BATCH_TOO_LARGE` | 413 | Batch contains more events than `maxBatchSize` (default 500). | Split the batch into smaller chunks. |
| `EVT_INVALID_TIMESTAMP` | 400 | Event timestamp is missing, malformed, or too far in the past/future (>72 hours drift). | Provide a valid ISO 8601 timestamp. Server clock and client clock should be reasonably synchronized. |
| `EVT_MISSING_IDENTITY` | 400 | Event has neither `userId` nor `anonymousId`. At least one identity is required. | Include either `userId` (for identified users) or `anonymousId` (for anonymous users) in the event. |
| `EVT_INVALID_VENTURE` | 400 | The `ventureId` is not a recognized MCV venture. | Use one of the 9 registered venture IDs: betedge, serpspace, fullgain, mcvstudios, futurestate, shelfwise, emberglow, pulsefront, nextera. |
| `EVT_ENRICHMENT_ERROR` | 500 | Context enrichment failed (device detection, geo resolution, or session lookup). Event is stored but context may be incomplete. | Check enrichment service health. The event was still processed — context can be backfilled via replay. |
| `EVT_PRODUCER_ERROR` | 503 | Failed to publish event to Redpanda. Event was sent to DLQ for retry. | Check Redpanda cluster health. Events in DLQ will be automatically retried. |
| `EVT_CONSENT_DENIED` | 403 | Event rejected because user has not granted analytics consent. | Ensure consent state is up-to-date. Only track events when `consent.analytics === true`. |
| `EVT_REPLAY_FAILED` | 500 | Event replay job failed. Check the job status for detailed error information. | Inspect the replay job status and error message. Resume from last checkpoint if possible. |
| `EVT_DLQ_RETRY_EXHAUSTED` | 500 | Dead letter event exhausted all retry attempts. Moved to `failed_permanent` status. | Manual investigation required. Check `errorDetails` for root cause. Discard or fix and resubmit. |
| `EVT_SCHEMA_CONFLICT` | 409 | Schema version conflict — attempted to register a version that already exists. | Increment the schema version when making changes. Use `PATCH` semver for compatible changes, `MAJOR` for breaking changes. |

---

## Security

### PII in Events

Events frequently contain personally identifiable information (PII) that must be handled with care under GDPR, CCPA, and other privacy regulations.

**PII Detection and Handling:**

```typescript
// Schema-level PII annotations
const schema: EventSchema = {
  eventName: 'offer.submitted',
  ventureId: 'futurestate',
  properties: {
    propertyId: { type: 'string', description: 'Property ID' },
    offerAmount: { type: 'number', description: 'Offer amount' },
    buyerName: {
      type: 'string',
      description: 'Buyer full name',
      pii: true,                  // Marked as PII
      piiStrategy: 'hash',        // SHA-256 hash before storage
    },
    buyerEmail: {
      type: 'string',
      description: 'Buyer email address',
      pii: true,
      piiStrategy: 'encrypt',     // AES-256 encrypted at rest
    },
    buyerPhone: {
      type: 'string',
      description: 'Buyer phone number',
      pii: true,
      piiStrategy: 'redact',      // Removed entirely — not stored
    },
    postalCode: {
      type: 'string',
      description: 'Property postal code',
      pii: true,
      piiStrategy: 'mask',        // Partial masking: "M5V ***"
    },
  },
  // ...
};
```

**PII Strategies:**

| Strategy | Description | Reversible | Use Case |
|---|---|---|---|
| `hash` | SHA-256 with venture-specific salt | No | Counting unique values without storing originals |
| `mask` | Partial redaction (keep first/last chars) | No | Displaying partial values in admin UIs |
| `redact` | Complete removal from event | No | Fields needed only client-side, never stored |
| `encrypt` | AES-256-GCM with rotating keys | Yes (with key) | Fields needed for downstream processing or support |

### Consent Tracking

Every event includes a `consent` context object reflecting the user's consent state at the time the event was recorded.

```typescript
// The consent middleware rejects events when analytics consent is not granted
const consentMiddleware: EventMiddleware = async (event, context, next) => {
  const consent = event.context?.consent;

  // Reject if no consent information provided (strict mode)
  if (!consent && context.venture.config.strictValidation) {
    context.reject('EVT_CONSENT_DENIED', 'Analytics consent state required but not provided');
    return;
  }

  // Reject if analytics consent explicitly denied
  if (consent && !consent.analytics) {
    context.reject('EVT_CONSENT_DENIED', 'User has not granted analytics consent');
    return;
  }

  // Strip marketing-related properties if marketing consent not granted
  if (consent && !consent.marketing && event.properties) {
    delete event.properties.utmSource;
    delete event.properties.utmMedium;
    delete event.properties.utmCampaign;
    delete event.properties.utmTerm;
    delete event.properties.utmContent;
  }

  await next();
};
```

### Access Control

```typescript
// Write keys are venture-specific and scoped
// Each venture has a unique write key pair (public/server)
// Public keys: used in browser SDKs (rate-limited, no PII access)
// Server keys: used in server SDKs (higher limits, full access)

// Events API requires a valid write key in the Authorization header
// Authorization: Bearer <write_key>

// Administrative operations (schema management, replay, DLQ)
// require CDP admin role via @mcv/auth RBAC
```

### Data Retention

```typescript
// Event data retention is managed via partition lifecycle:
// - Hot: 0-90 days — full query access, SSD storage
// - Warm: 90-365 days — query access, HDD storage
// - Cold: 365+ days — archived to object storage (S3/R2)
// - Deleted: per venture retention policy (configurable)

// Partition detachment is automated via pg_partman
// Archived partitions can be reattached for replay operations
```

### IP Address Handling

```typescript
// Raw IP addresses are NEVER stored in the events table.
// During enrichment:
// 1. IP → geo lookup (country, region, city)
// 2. IP → ISP/organization lookup
// 3. IP → VPN/proxy detection
// 4. IP is hashed (SHA-256 + daily rotating salt) for fraud detection
// 5. Original IP is discarded

// The ipHash in NetworkContext can be used for:
// - Rate limiting (short-term)
// - Fraud detection patterns (matching across sessions)
// - NOT for re-identification (salt rotates daily)
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `CDP_EVENTS_REDPANDA_BROKERS` | Yes | — | Comma-separated Redpanda broker URLs (e.g., `redpanda-0:9092,redpanda-1:9092`) |
| `CDP_EVENTS_REDPANDA_SASL_USERNAME` | Yes | — | Redpanda SASL username for authentication |
| `CDP_EVENTS_REDPANDA_SASL_PASSWORD` | Yes | — | Redpanda SASL password for authentication |
| `CDP_EVENTS_TOPIC_RAW` | No | `cdp.events.raw` | Topic name for raw (pre-enrichment) events |
| `CDP_EVENTS_TOPIC_ENRICHED` | No | `cdp.events.enriched` | Topic name for enriched events |
| `CDP_EVENTS_TOPIC_DLQ` | No | `cdp.events.dlq` | Topic name for dead letter events |
| `CDP_EVENTS_TOPIC_REPLAY` | No | `cdp.events.replay` | Topic name for replayed events |
| `CDP_EVENTS_TOPIC_METRICS` | No | `cdp.events.metrics` | Topic name for pre-aggregated metrics |
| `CDP_EVENTS_TOPIC_PARTITIONS` | No | `12` | Number of partitions per topic |
| `CDP_EVENTS_TOPIC_REPLICATION` | No | `3` | Replication factor for topics |
| `CDP_EVENTS_MAX_BATCH_SIZE` | No | `500` | Maximum events per batch API request |
| `CDP_EVENTS_MAX_EVENT_SIZE_BYTES` | No | `32768` | Maximum single event payload size (32KB) |
| `CDP_EVENTS_DEDUP_WINDOW_MS` | No | `300000` | Deduplication window in milliseconds (5 min) |
| `CDP_EVENTS_RATE_LIMIT_PER_USER` | No | `50` | Max events per second per user |
| `CDP_EVENTS_RATE_LIMIT_PER_VENTURE` | No | `10000` | Max events per second per venture |
| `CDP_EVENTS_ENRICHMENT_GEO_DB` | No | `./data/GeoLite2-City.mmdb` | Path to MaxMind GeoIP database |
| `CDP_EVENTS_ENRICHMENT_GEO_UPDATE_URL` | No | — | URL for automatic GeoIP database updates |
| `CDP_EVENTS_SESSION_TIMEOUT_MS` | No | `1800000` | Session inactivity timeout (30 min) |
| `CDP_EVENTS_SESSION_MAX_DURATION_MS` | No | `86400000` | Maximum session duration (24 hours) |
| `CDP_EVENTS_PII_ENCRYPTION_KEY` | Yes | — | AES-256 key for PII field encryption (base64) |
| `CDP_EVENTS_PII_HASH_SALT` | Yes | — | Salt for PII hashing operations |
| `CDP_EVENTS_DLQ_MAX_RETRIES` | No | `3` | Maximum retry attempts for DLQ entries |
| `CDP_EVENTS_DLQ_RETRY_BASE_MS` | No | `1000` | Base delay for DLQ retry backoff |
| `CDP_EVENTS_DLQ_AUTO_DISCARD_DAYS` | No | `30` | Auto-discard DLQ entries after N days |
| `CDP_EVENTS_PARTITION_RETENTION_HOT_DAYS` | No | `90` | Days to keep partitions in hot storage |
| `CDP_EVENTS_PARTITION_RETENTION_WARM_DAYS` | No | `365` | Days to keep partitions in warm storage |
| `CDP_EVENTS_PARTITION_RETENTION_TOTAL_DAYS` | No | `730` | Total retention before deletion (2 years) |
| `CDP_EVENTS_METRICS_FLUSH_INTERVAL_MS` | No | `10000` | Real-time metrics flush interval (10 sec) |
| `CDP_EVENTS_METRICS_WINDOW_BUFFER_MS` | No | `60000` | Late event buffer for metric windows (1 min) |
| `CDP_EVENTS_REPLAY_MAX_CONCURRENT` | No | `3` | Maximum concurrent replay jobs |
| `CDP_EVENTS_REPLAY_DEFAULT_THROUGHPUT` | No | `100000` | Default replay events per second |
| `CDP_EVENTS_REDIS_URL` | Yes | — | Redis URL for deduplication bloom filter and rate limiting |
| `CDP_EVENTS_STRICT_VALIDATION` | No | `true` | Whether to enforce strict schema validation |
| `CDP_EVENTS_CONSENT_REQUIRED` | No | `true` | Whether analytics consent is required for event processing |
| `CDP_EVENTS_LOG_LEVEL` | No | `info` | Logging level (debug, info, warn, error) |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---|---|
| `@mcv/cdp/profiles` | Profile resolution — linking anonymous IDs to identified profiles |
| `@mcv/cdp/traits` | Trait computation — consuming events to derive computed traits |
| `@mcv/foundation/schema` | Base schema utilities, JSON Schema validation primitives |
| `@mcv/foundation/errors` | Standardized error types and error code registry |
| `@mcv/foundation/logging` | Structured logging with venture context |
| `@mcv/foundation/config` | Environment variable parsing and validation |
| `@mcv/infra/redpanda` | Redpanda/Kafka client wrapper with connection pooling |
| `@mcv/infra/supabase` | Supabase PostgreSQL client and connection management |
| `@mcv/infra/redis` | Redis client for deduplication and rate limiting |
| `@mcv/auth` | RBAC for administrative operations (schema management, replay) |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@confluentinc/kafka-javascript` | `^1.x` | Redpanda/Kafka producer and consumer client |
| `drizzle-orm` | `^0.36.x` | Type-safe SQL query builder for PostgreSQL |
| `ua-parser-js` | `^2.x` | User agent parsing for device detection |
| `maxmind` | `^4.x` | MaxMind GeoIP database reader for geo resolution |
| `@maxmind/geoip2-node` | `^5.x` | GeoIP2 Node.js bindings |
| `ioredis` | `^5.x` | Redis client for deduplication bloom filter |
| `bloom-filters` | `^3.x` | Bloom filter implementation for dedup (backed by Redis) |
| `ulid` | `^2.x` | ULID generation for time-ordered event IDs |
| `zod` | `^3.x` | Runtime schema validation for event payloads |
| `snappy` | `^7.x` | Snappy compression for Redpanda message compression |
| `prom-client` | `^15.x` | Prometheus metrics for collector monitoring |
| `murmurhash` | `^2.x` | MurmurHash for consistent partition assignment |

---

## Testing Notes

### Unit Tests

```typescript
// Test event validation against schemas
describe('EventValidator', () => {
  it('should validate a well-formed bet.placed event', async () => {
    const result = await validateEvent({
      event: 'bet.placed',
      ventureId: 'betedge',
      userId: 'user_123',
      properties: {
        betId: 'bet_abc',
        sport: 'football',
        odds: 2.5,
        stake: 25.0,
        currency: 'USD',
        betType: 'single',
        isLive: false,
      },
    }, registry);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject event with missing required fields', async () => {
    const result = await validateEvent({
      event: 'bet.placed',
      ventureId: 'betedge',
      userId: 'user_123',
      properties: {
        betId: 'bet_abc',
        // Missing: sport, odds, stake, currency, betType
      },
    }, registry);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'sport', code: 'required' })
    );
  });

  it('should detect and annotate PII fields', async () => {
    const result = await validateEvent({
      event: 'offer.submitted',
      ventureId: 'futurestate',
      userId: 'user_123',
      properties: {
        propertyId: 'prop_abc',
        offerAmount: 500000,
        buyerEmail: 'buyer@example.com',
      },
    }, registry);

    expect(result.piiFields).toContain('buyerEmail');
  });
});

// Test deduplication
describe('Deduplication', () => {
  it('should accept first event with a messageId', async () => {
    const event = createRawEvent({ messageId: 'msg_unique_1' });
    const result = await collector.track(event);
    expect(result.id).toBeDefined();
  });

  it('should reject duplicate messageId within window', async () => {
    const event = createRawEvent({ messageId: 'msg_dup_1' });
    await collector.track(event); // First — succeeds

    await expect(collector.track(event)).rejects.toThrow('EVT_DUPLICATE_EVENT');
  });

  it('should accept same messageId after dedup window expires', async () => {
    const event = createRawEvent({ messageId: 'msg_window_1' });
    await collector.track(event);

    // Advance time past dedup window
    jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes > 5 minute window

    const result = await collector.track(event);
    expect(result.id).toBeDefined();
  });
});

// Test context enrichment
describe('ContextEnrichment', () => {
  it('should detect mobile device from user agent', async () => {
    const event = createRawEvent({
      context: {
        library: { name: '@mcv/analytics-browser', version: '1.0.0' },
      },
    });

    const enriched = await enrichEventContext(event, {
      ip: '1.2.3.4',
      headers: {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      },
      receivedAt: new Date(),
    });

    expect(enriched.context.device.type).toBe('mobile');
    expect(enriched.context.device.manufacturer).toBe('Apple');
    expect(enriched.context.device.os).toBe('iOS');
  });

  it('should resolve geo location from IP', async () => {
    const enriched = await enrichEventContext(createRawEvent(), {
      ip: '206.47.45.1', // Known Toronto IP
      headers: {},
      receivedAt: new Date(),
    });

    expect(enriched.context.location.country).toBe('CA');
    expect(enriched.context.location.city).toBe('Toronto');
    expect(enriched.context.location.timezone).toBe('America/Toronto');
  });

  it('should create new session after timeout', async () => {
    const event1 = createRawEvent({ userId: 'user_123' });
    const enriched1 = await enrichEventContext(event1, mockRequest());

    // 2 hours later (past 30 minute session timeout)
    jest.advanceTimersByTime(2 * 60 * 60 * 1000);

    const event2 = createRawEvent({ userId: 'user_123' });
    const enriched2 = await enrichEventContext(event2, mockRequest());

    expect(enriched2.context.session.sessionId).not.toBe(enriched1.context.session.sessionId);
    expect(enriched2.context.session.isNewSession).toBe(true);
    expect(enriched2.context.session.sessionNumber).toBe(enriched1.context.session.sessionNumber + 1);
  });
});
```

### Integration Tests

```typescript
// Test full pipeline: collect → validate → enrich → produce → consume → store
describe('Event Pipeline Integration', () => {
  let collector: EventCollector;
  let consumer: EventConsumer;
  let db: Database;

  beforeAll(async () => {
    // Use testcontainers for Redpanda and PostgreSQL
    collector = await createTestCollector();
    consumer = await createTestConsumer();
    db = await createTestDatabase();
  });

  it('should process event end-to-end', async () => {
    const tracked = await collector.track({
      event: 'page.viewed',
      userId: 'test_user',
      ventureId: 'betedge',
      properties: {
        url: 'https://betedge.com/nfl',
        title: 'NFL Betting',
      },
    });

    // Wait for consumer to process
    await waitForEvent(consumer, tracked.id, { timeoutMs: 5000 });

    // Verify stored in database
    const stored = await db.query.events.findFirst({
      where: eq(events.id, tracked.id),
    });

    expect(stored).toBeDefined();
    expect(stored!.eventName).toBe('page.viewed');
    expect(stored!.profileId).toBe('test_user');
    expect(stored!.ventureId).toBe('betedge');
  });

  it('should handle batch with partial failures', async () => {
    const result = await collector.trackBatch([
      createRawEvent({ event: 'page.viewed', ventureId: 'betedge' }),       // Valid
      createRawEvent({ event: 'unknown.event', ventureId: 'betedge' }),     // Invalid schema
      createRawEvent({ event: 'bet.placed', ventureId: 'betedge' }),        // Valid (assuming properties)
    ]);

    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.results[1].error!.code).toBe('EVT_SCHEMA_NOT_FOUND');

    // Check DLQ received the failed event
    const dlqEntry = await db.query.deadLetterEvents.findFirst({
      where: eq(deadLetterEvents.errorCode, 'EVT_SCHEMA_NOT_FOUND'),
    });
    expect(dlqEntry).toBeDefined();
  });

  it('should replay events to target topic', async () => {
    // Seed events
    await seedEvents(collector, 1000);

    // Create replay job
    const replayer = new EventReplayer(db, testRedpandaConfig);
    const job = await replayer.createJob({
      name: 'Test replay',
      ventureId: 'betedge',
      eventNames: ['bet.placed'],
      rangeStart: new Date('2026-01-01'),
      rangeEnd: new Date('2026-12-31'),
      targetConsumerGroup: 'test-replay-consumer',
      targetTopic: 'cdp.events.replay.test',
      speedMultiplier: 0,
      initiatedBy: 'test',
    });

    await replayer.start(job.id);
    await waitForJobCompletion(replayer, job.id, { timeoutMs: 30_000 });

    const finalJob = await replayer.getProgress(job.id);
    expect(finalJob.status).toBe('completed');
    expect(finalJob.processedEvents).toBeGreaterThan(0);
    expect(finalJob.failedEvents).toBe(0);
  });
});
```

### Load Tests

```typescript
// Throughput benchmarks for event collection
describe('Event Collector Load Test', () => {
  it('should handle 10,000 events/second per venture', async () => {
    const collector = await createProductionCollector('betedge');
    const events = generateRandomBetEdgeEvents(10_000);

    const start = performance.now();
    const results = await Promise.all(
      chunk(events, 100).map(batch => collector.trackBatch(batch))
    );
    const elapsed = performance.now() - start;

    const totalSucceeded = results.reduce((sum, r) => sum + r.succeeded, 0);
    const throughput = totalSucceeded / (elapsed / 1000);

    expect(throughput).toBeGreaterThan(10_000);
    console.log(`Throughput: ${throughput.toFixed(0)} events/sec`);
    console.log(`Latency: ${elapsed.toFixed(0)}ms for ${totalSucceeded} events`);
  });

  it('should maintain <50ms p99 latency under load', async () => {
    const collector = await createProductionCollector('betedge');
    const latencies: number[] = [];

    // Sustained load for 30 seconds
    const endTime = Date.now() + 30_000;
    while (Date.now() < endTime) {
      const start = performance.now();
      await collector.track(generateRandomBetEdgeEvent());
      latencies.push(performance.now() - start);
    }

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.50)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log(`p50: ${p50.toFixed(1)}ms | p95: ${p95.toFixed(1)}ms | p99: ${p99.toFixed(1)}ms`);

    expect(p99).toBeLessThan(50);
  });
});
```

### Test Utilities

```typescript
// Shared test helpers for event testing

import { createEventCollector, type RawEvent } from '@mcv/cdp/events';

/**
 * Create a raw event with sensible defaults for testing.
 */
export function createRawEvent(overrides: Partial<RawEvent> = {}): RawEvent {
  return {
    event: 'page.viewed',
    userId: `test_user_${Math.random().toString(36).slice(2, 8)}`,
    ventureId: 'betedge',
    properties: {},
    timestamp: new Date().toISOString(),
    messageId: `msg_${Math.random().toString(36).slice(2, 14)}`,
    ...overrides,
  };
}

/**
 * Create a collector configured for testing (in-memory Redpanda mock).
 */
export async function createTestCollector(ventureId = 'betedge') {
  return createEventCollector({
    ventureId,
    maxBatchSize: 100,
    maxEventSizeBytes: 32_768,
    dedupWindowMs: 5 * 60 * 1000,
    rateLimitPerUser: 1000,
    rateLimitPerVenture: 100_000,
    strictValidation: false,
    enrichment: { device: true, geo: false, session: true, referrer: false },
    dlq: { enabled: true, maxRetries: 1, retryDelayMs: 100 },
    producer: {
      brokers: ['localhost:9092'],
      clientId: 'test-collector',
      topic: 'test.events.raw',
      compression: 'none',
      batchSize: 1024,
      lingerMs: 0,
    },
  });
}

/**
 * Wait for a specific event to appear in a consumer.
 */
export async function waitForEvent(
  consumer: EventConsumer,
  eventId: string,
  options: { timeoutMs: number } = { timeoutMs: 5000 },
): Promise<EnrichedEvent> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Timed out waiting for event ${eventId}`)),
      options.timeoutMs,
    );

    consumer.on('event', (event: EnrichedEvent) => {
      if (event.id === eventId) {
        clearTimeout(timeout);
        resolve(event);
      }
    });
  });
}

/**
 * Generate realistic random events for a venture.
 */
export function generateRandomBetEdgeEvents(count: number): RawEvent[] {
  const sports = ['football', 'basketball', 'hockey', 'baseball', 'soccer'];
  const markets = ['moneyline', 'spread', 'over_under', 'prop', 'parlay'];
  const betTypes = ['single', 'parlay', 'teaser', 'round_robin'];

  return Array.from({ length: count }, (_, i) => ({
    event: Math.random() > 0.3 ? 'bet.placed' : 'odds.viewed',
    userId: `user_${(i % 1000).toString().padStart(4, '0')}`,
    ventureId: 'betedge',
    properties: {
      sport: sports[Math.floor(Math.random() * sports.length)],
      market: markets[Math.floor(Math.random() * markets.length)],
      odds: 1 + Math.random() * 10,
      stake: Math.round(Math.random() * 500 * 100) / 100,
      currency: 'USD',
      betType: betTypes[Math.floor(Math.random() * betTypes.length)],
      isLive: Math.random() > 0.7,
    },
    messageId: `msg_load_${i}_${Date.now()}`,
    timestamp: new Date().toISOString(),
  }));
}
```

---

## Monitoring & Observability

### Prometheus Metrics

The event collector exposes the following Prometheus metrics for monitoring:

```
# Event ingestion
cdp_events_received_total{venture, event_name, sdk}           — Total events received
cdp_events_processed_total{venture, event_name, status}        — Total events processed (success/failure)
cdp_events_batch_size_histogram{venture}                       — Distribution of batch sizes
cdp_events_processing_duration_seconds{venture, stage}         — Processing time per stage

# Validation
cdp_events_validation_total{venture, result}                   — Validation results (pass/fail)
cdp_events_validation_errors_total{venture, error_code}        — Validation errors by code

# Enrichment
cdp_events_enrichment_duration_seconds{venture, step}          — Enrichment step duration
cdp_events_enrichment_failures_total{venture, step}            — Enrichment failures

# Streaming
cdp_events_producer_send_total{venture, topic}                 — Events sent to Redpanda
cdp_events_producer_errors_total{venture, topic}               — Producer errors
cdp_events_producer_latency_seconds{venture, topic}            — Producer send latency

# DLQ
cdp_events_dlq_total{venture, error_code, status}              — DLQ entries by status
cdp_events_dlq_retry_total{venture, result}                    — DLQ retry results
cdp_events_dlq_age_seconds{venture}                            — Age of oldest pending DLQ entry

# Rate limiting
cdp_events_rate_limited_total{venture, scope}                  — Rate limit rejections (per-user/per-venture)

# Deduplication
cdp_events_dedup_total{venture, result}                        — Dedup results (unique/duplicate)
cdp_events_dedup_bloom_filter_size{venture}                    — Bloom filter size

# Metrics rollup
cdp_metrics_rollup_computed_total{venture, metric, window}     — Rollups computed
cdp_metrics_rollup_latency_seconds{venture, mode}              — Rollup computation latency (realtime/batch)

# Replay
cdp_events_replay_active_jobs                                  — Currently active replay jobs
cdp_events_replay_events_total{job_id, status}                 — Replayed events by status
cdp_events_replay_throughput{job_id}                           — Replay throughput (events/sec)

# Consumer lag
cdp_events_consumer_lag{group, topic, partition}               — Consumer group lag
```

### Alerting Rules

```yaml
# Critical alerts for event pipeline health

# No events received for 5 minutes (any venture)
- alert: CDPEventsNoIngestion
  expr: rate(cdp_events_received_total[5m]) == 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "No events received for venture {{ $labels.venture }}"

# Error rate exceeds 5%
- alert: CDPEventsHighErrorRate
  expr: >
    rate(cdp_events_processed_total{status="error"}[5m])
    / rate(cdp_events_processed_total[5m]) > 0.05
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Event error rate above 5% for {{ $labels.venture }}"

# DLQ growing with old entries
- alert: CDPEventsDLQBacklog
  expr: cdp_events_dlq_age_seconds > 86400
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "DLQ has entries older than 24 hours for {{ $labels.venture }}"

# Processing latency p99 > 100ms
- alert: CDPEventsHighLatency
  expr: histogram_quantile(0.99, cdp_events_processing_duration_seconds) > 0.1
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Event processing p99 latency exceeds 100ms for {{ $labels.venture }}"

# Consumer lag growing
- alert: CDPEventsConsumerLag
  expr: cdp_events_consumer_lag > 100000
  for: 15m
  labels:
    severity: critical
  annotations:
    summary: "Consumer lag exceeds 100K for group {{ $labels.group }}"
```

---

## Related Modules

| Module | Relationship |
|---|---|
| `@mcv/cdp/profiles` | Events are linked to profiles via `profileId`. Profile resolution happens during enrichment. |
| `@mcv/cdp/traits` | Computed traits are derived from event streams. The trait processor consumes from `cdp.events.enriched`. |
| `@mcv/cdp/segments` | Segment rules evaluate against event patterns. Real-time segments consume the event stream directly. |
| `@mcv/cdp/audiences` | Audiences are built from segments, which are built from events. Events are the ultimate data source. |
| `@mcv/cdp/journeys` | Journey orchestration triggers on specific events (e.g., start journey when `user.signed_up`). |
| `@mcv/analytics` | Analytics dashboards query metrics rollups computed by this module. |
| `@mcv/infra/redpanda` | Event streaming infrastructure. This module is the primary producer. |
| `@mcv/infra/supabase` | Event storage. Partitioned tables managed by this module. |