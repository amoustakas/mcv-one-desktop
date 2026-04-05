# @mcv/cdp/sync

> **Tier 5 — MCV-Only Domain**
> Destination sync and data activation — pushing CDP audiences, profiles, and events to external marketing, advertising, and CRM platforms.

---

## Purpose

The **sync** module is the outbound data activation layer of the MCV Customer Data Platform. While other CDP modules focus on ingesting, unifying, and segmenting customer data, sync is responsible for delivering that data to the external platforms where it drives real business outcomes — email campaigns in Mailchimp, ad audiences in Google Ads, CRM records in Salesforce, push notifications in Braze, and beyond. Without sync, the CDP is a sophisticated data warehouse with no way to act on its intelligence.

Sync operates through a pluggable adapter architecture that abstracts away the vast differences between destination APIs. Each destination — whether it speaks REST, GraphQL, batch CSV, or proprietary protocols — is encapsulated behind a uniform `DestinationAdapter` interface. The `SyncOrchestrator` coordinates jobs across all configured destinations for a venture, managing scheduling, parallelism, rate limiting, and error recovery. Field mappings translate CDP's canonical profile schema into each destination's expected format, handling type coercions, value transformations, and structural differences transparently.

The module supports three distinct sync modes to match different activation use cases: **full sync** for initial loads and periodic reconciliation, **incremental sync** for efficient scheduled updates that only push changed records, and **real-time streaming** for latency-sensitive activations triggered by Redpanda events. Each destination can be independently configured with its own sync mode, schedule, field mappings, and conflict resolution strategy. A comprehensive audit trail tracks every sync operation — what was sent, when, to where, whether it succeeded or failed, and exactly what changed — providing full observability into the data activation pipeline.

---

## Exports

```typescript
// @mcv/cdp/sync — Public API

// ─── Core Orchestration ──────────────────────────────────────────────
export { SyncOrchestrator } from './orchestrator';
export { SyncScheduler } from './scheduler';
export { SyncJobRunner } from './runner';
export { SyncJobQueue } from './queue';

// ─── Destination Adapters ────────────────────────────────────────────
export { DestinationAdapter } from './adapters/base';
export { MailchimpAdapter } from './adapters/mailchimp';
export { HubSpotAdapter } from './adapters/hubspot';
export { GoogleAdsAdapter } from './adapters/google-ads';
export { FacebookAdsAdapter } from './adapters/facebook-ads';
export { SalesforceAdapter } from './adapters/salesforce';
export { BrazeAdapter } from './adapters/braze';
export { IterableAdapter } from './adapters/iterable';
export { WebhookAdapter } from './adapters/webhook';
export { AdapterRegistry } from './adapters/registry';

// ─── Field Mapping ───────────────────────────────────────────────────
export { FieldMapper } from './mapping/field-mapper';
export { FieldMappingEngine } from './mapping/engine';
export { TransformPipeline } from './mapping/transforms';
export { SchemaValidator } from './mapping/validator';

// ─── Conflict Resolution ─────────────────────────────────────────────
export { ConflictResolver } from './conflicts/resolver';
export { MergeStrategyRegistry } from './conflicts/strategies';

// ─── Rate Limiting ───────────────────────────────────────────────────
export { RateLimiter } from './rate-limiter';
export { AdaptiveBackoff } from './rate-limiter/backoff';
export { TokenBucket } from './rate-limiter/token-bucket';
export { RateLimitTracker } from './rate-limiter/tracker';

// ─── Error Handling ──────────────────────────────────────────────────
export { SyncErrorHandler } from './errors/handler';
export { DeadLetterQueue } from './errors/dead-letter-queue';
export { RetryPolicy } from './errors/retry-policy';
export { SyncAlertManager } from './errors/alerts';

// ─── History & Audit ─────────────────────────────────────────────────
export { SyncHistoryService } from './history/service';
export { SyncAuditLogger } from './history/audit-logger';
export { SyncMetricsCollector } from './history/metrics';

// ─── Data Transformation ─────────────────────────────────────────────
export { DataTransformer } from './transform/transformer';
export { TypeCoercionEngine } from './transform/coercion';
export { ValueNormalizer } from './transform/normalizer';
export { BatchFormatter } from './transform/batch-formatter';

// ─── Real-Time Streaming ─────────────────────────────────────────────
export { StreamingSyncConsumer } from './streaming/consumer';
export { StreamingSyncRouter } from './streaming/router';
export { StreamingBufferManager } from './streaming/buffer';

// ─── tRPC Router ─────────────────────────────────────────────────────
export { syncRouter } from './trpc/router';
export type { SyncRouterType } from './trpc/router';

// ─── Types ───────────────────────────────────────────────────────────
export type {
  SyncJob,
  SyncJobStatus,
  SyncMode,
  SyncSchedule,
  SyncConfig,
  SyncResult,
  SyncResultSummary,
  SyncError,
  SyncErrorCode,
  DestinationConfig,
  DestinationType,
  FieldMapping,
  FieldMappingRule,
  FieldTransform,
  ConflictResolutionStrategy,
  ConflictRecord,
  RateLimitConfig,
  RetryConfig,
  SyncHistoryEntry,
  SyncAuditEvent,
  SyncMetrics,
  StreamingSyncEvent,
  DeadLetterEntry,
  BatchSyncPayload,
  SyncHealthStatus,
} from './types';

// ─── Schemas (Drizzle ORM) ───────────────────────────────────────────
export {
  syncDestinations,
  syncJobs,
  syncFieldMappings,
  syncHistory,
  syncErrors,
  syncRateLimitState,
  syncDeadLetterQueue,
} from './schema';

// ─── Constants ───────────────────────────────────────────────────────
export { SYNC_ERROR_CODES } from './constants/error-codes';
export { DESTINATION_TYPES } from './constants/destinations';
export { SYNC_MODES } from './constants/modes';
export { DEFAULT_RATE_LIMITS } from './constants/rate-limits';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            @mcv/cdp/sync                                        │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        SYNC ORCHESTRATOR                                 │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────────┐  │   │
│  │  │  Scheduler   │  │  Job Runner  │  │  Job Queue │  │ Health Check  │  │   │
│  │  │  (cron/rt)   │  │  (parallel)  │  │ (priority) │  │  (monitor)    │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  └───────────────┘  │   │
│  └─────────┼─────────────────┼────────────────┼────────────────────────────┘   │
│            │                 │                 │                                 │
│  ┌─────────▼─────────────────▼─────────────────▼────────────────────────────┐   │
│  │                        DATA PIPELINE                                     │   │
│  │                                                                          │   │
│  │  ┌────────────┐    ┌──────────────┐    ┌──────────────┐                  │   │
│  │  │   Source    │───▶│    Field     │───▶│    Data      │                  │   │
│  │  │  Resolver   │    │   Mapper     │    │ Transformer  │                  │   │
│  │  │            │    │              │    │              │                  │   │
│  │  │ • Segments │    │ • CDP→Dest   │    │ • Coercion   │                  │   │
│  │  │ • Profiles │    │ • Rules      │    │ • Normalize  │                  │   │
│  │  │ • Events   │    │ • Defaults   │    │ • Format     │                  │   │
│  │  └────────────┘    └──────────────┘    └──────┬───────┘                  │   │
│  └───────────────────────────────────────────────┼──────────────────────────┘   │
│                                                  │                              │
│  ┌───────────────────────────────────────────────▼──────────────────────────┐   │
│  │                     DESTINATION ADAPTERS                                 │   │
│  │                                                                          │   │
│  │  ┌────────────┐  ┌──────────┐  ┌────────────┐  ┌───────────────┐       │   │
│  │  │ Mailchimp  │  │ HubSpot  │  │ Google Ads │  │ Facebook Ads  │       │   │
│  │  └────────────┘  └──────────┘  └────────────┘  └───────────────┘       │   │
│  │  ┌────────────┐  ┌──────────┐  ┌────────────┐  ┌───────────────┐       │   │
│  │  │ Salesforce │  │  Braze   │  │  Iterable  │  │   Webhook     │       │   │
│  │  └────────────┘  └──────────┘  └────────────┘  └───────────────┘       │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                     RELIABILITY LAYER                                    │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────────┐  │   │
│  │  │ Rate Limiter│  │ Retry Policy │  │ Conflict   │  │ Dead Letter   │  │   │
│  │  │ (per-dest)  │  │ (exp backoff)│  │ Resolver   │  │ Queue         │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────┘  └───────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                     OBSERVABILITY                                        │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────────┐  │   │
│  │  │ Sync History│  │ Audit Logger │  │  Metrics   │  │ Alert Manager │  │   │
│  │  │ (full trail)│  │ (per-record) │  │ (counters) │  │ (thresholds)  │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────┘  └───────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

                         EXTERNAL INTEGRATIONS

  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │  Redpanda    │    │  Supabase    │    │  Destination │
  │  (triggers)  │    │  (state/     │    │  APIs        │
  │              │    │   history)   │    │  (external)  │
  └──────────────┘    └──────────────┘    └──────────────┘
```

### Data Flow — Sync Pipeline

```
                    SYNC PIPELINE (per job)

  ┌─────────────┐     ┌───────────────┐     ┌──────────────┐
  │  Trigger     │────▶│  Source        │────▶│  Diff Engine │
  │              │     │  Resolution    │     │              │
  │ • Schedule   │     │               │     │ • Changed    │
  │ • Redpanda   │     │ • Load segment│     │   records    │
  │ • Manual     │     │ • Load profiles│    │ • New records│
  │ • API call   │     │ • Cursor state│     │ • Deletions  │
  └─────────────┘     └───────────────┘     └──────┬───────┘
                                                    │
                                                    ▼
  ┌─────────────┐     ┌───────────────┐     ┌──────────────┐
  │  Destination │◀────│  Batch        │◀────│  Transform   │
  │  Adapter     │     │  Formatter    │     │  Pipeline    │
  │              │     │               │     │              │
  │ • API calls  │     │ • Chunk       │     │ • Map fields │
  │ • Auth       │     │ • Serialize   │     │ • Coerce     │
  │ • Pagination │     │ • Compress    │     │ • Normalize  │
  └──────┬───────┘     └───────────────┘     └──────────────┘
         │
         ▼
  ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
  │  Result      │────▶│  Conflict     │────▶│  History     │
  │  Collector   │     │  Resolver     │     │  Writer      │
  │              │     │               │     │              │
  │ • Success    │     │ • CDP wins    │     │ • Audit log  │
  │ • Failures   │     │ • Dest wins   │     │ • Metrics    │
  │ • Partial    │     │ • Merge       │     │ • Alerts     │
  └──────────────┘     └───────────────┘     └──────────────┘
```

### Real-Time Streaming Flow

```
  Redpanda Topics                    Sync Module                    Destinations
  ──────────────                    ───────────                    ────────────

  cdp.profile.updated ──┐
                         │     ┌──────────────────┐
  cdp.segment.entered ───┼────▶│ StreamingSync     │
                         │     │ Consumer          │
  cdp.segment.exited ────┤     │                   │
                         │     │ • Deserialize     │
  cdp.event.tracked ─────┘     │ • Route to dest   │──────▶ Real-time
                               │ • Buffer (10s)    │        API calls
                               │ • Micro-batch     │
                               └──────────────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │ Per-Destination   │
                               │ Buffer            │
                               │                   │
                               │ • Collect events  │
                               │ • Flush on size   │
                               │   or time window  │
                               │ • Rate limit      │
                               └──────────────────┘
```

---

## Core Interfaces

### SyncOrchestrator

The central coordinator for all sync operations within a venture.

```typescript
import { TRPCError } from '@trpc/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * SyncOrchestrator manages the lifecycle of sync jobs across all
 * configured destinations for a venture. It handles scheduling,
 * job creation, execution, monitoring, and cleanup.
 */
interface SyncOrchestrator {
  /**
   * Initialize the orchestrator for a venture, loading destination
   * configs and establishing adapter connections.
   */
  initialize(ventureId: string): Promise<void>;

  /**
   * Create and enqueue a sync job for a specific destination.
   * The job will be picked up by the runner based on priority and schedule.
   */
  createJob(params: CreateSyncJobParams): Promise<SyncJob>;

  /**
   * Execute a sync job immediately, bypassing the queue.
   * Used for manual triggers and high-priority syncs.
   */
  executeJob(jobId: string): Promise<SyncResult>;

  /**
   * Cancel a running or queued sync job.
   * Running jobs will be gracefully stopped at the next checkpoint.
   */
  cancelJob(jobId: string): Promise<void>;

  /**
   * Get the current status of a sync job, including progress metrics.
   */
  getJobStatus(jobId: string): Promise<SyncJobStatus>;

  /**
   * List all sync jobs for a venture, with filtering and pagination.
   */
  listJobs(params: ListSyncJobsParams): Promise<PaginatedResult<SyncJob>>;

  /**
   * Trigger a full sync for all destinations of a venture.
   * Creates individual jobs per destination, executed in parallel.
   */
  syncAll(ventureId: string, options?: SyncAllOptions): Promise<SyncJob[]>;

  /**
   * Run a dry-run sync that computes what would be synced
   * without actually pushing data to destinations.
   */
  dryRun(params: CreateSyncJobParams): Promise<SyncDryRunResult>;

  /**
   * Get health status of all destination connections for a venture.
   */
  getHealth(ventureId: string): Promise<SyncHealthStatus>;

  /**
   * Pause all sync operations for a venture (e.g., during maintenance).
   */
  pause(ventureId: string): Promise<void>;

  /**
   * Resume sync operations for a venture after a pause.
   */
  resume(ventureId: string): Promise<void>;

  /**
   * Shut down the orchestrator, completing in-flight jobs gracefully.
   */
  shutdown(): Promise<void>;
}

interface CreateSyncJobParams {
  ventureId: string;
  destinationId: string;
  mode: SyncMode;
  segmentIds?: string[];
  profileIds?: string[];
  priority?: 'low' | 'normal' | 'high' | 'critical';
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}

interface ListSyncJobsParams {
  ventureId: string;
  destinationId?: string;
  status?: SyncJobStatus[];
  mode?: SyncMode[];
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'started_at' | 'completed_at';
  orderDir?: 'asc' | 'desc';
}

interface SyncAllOptions {
  mode?: SyncMode;
  segmentIds?: string[];
  excludeDestinations?: string[];
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

interface SyncDryRunResult {
  destinationId: string;
  recordsToCreate: number;
  recordsToUpdate: number;
  recordsToDelete: number;
  estimatedDuration: number;
  fieldMappingPreview: FieldMappingPreview[];
  potentialConflicts: ConflictPreview[];
  rateLimitEstimate: RateLimitEstimate;
}
```

### SyncJob

Represents a single sync operation targeting one destination.

```typescript
/**
 * A SyncJob represents an individual sync operation — one venture's data
 * being pushed to one destination. Jobs are created by the orchestrator
 * and executed by the runner.
 */
interface SyncJob {
  /** Unique job identifier */
  id: string;

  /** Venture this job belongs to */
  ventureId: string;

  /** Target destination configuration ID */
  destinationId: string;

  /** Sync mode for this job */
  mode: SyncMode;

  /** Current job status */
  status: SyncJobStatusEnum;

  /** Priority level (affects queue ordering) */
  priority: 'low' | 'normal' | 'high' | 'critical';

  /** Optional segment IDs to filter sync scope */
  segmentIds: string[] | null;

  /** Optional specific profile IDs to sync */
  profileIds: string[] | null;

  /** Cursor for incremental syncs — where the last sync left off */
  cursor: SyncCursor | null;

  /** Progress metrics for the current execution */
  progress: SyncProgress;

  /** Error information if the job failed */
  error: SyncJobError | null;

  /** Number of retry attempts so far */
  retryCount: number;

  /** Maximum retries allowed */
  maxRetries: number;

  /** Arbitrary metadata attached to the job */
  metadata: Record<string, unknown>;

  /** When the job was created */
  createdAt: Date;

  /** When the job was scheduled to run */
  scheduledAt: Date;

  /** When the job actually started executing */
  startedAt: Date | null;

  /** When the job completed (success or final failure) */
  completedAt: Date | null;

  /** When the job will next be retried (if in retry status) */
  nextRetryAt: Date | null;
}

type SyncMode = 'full' | 'incremental' | 'realtime';

type SyncJobStatusEnum =
  | 'pending'      // Created, waiting in queue
  | 'scheduled'    // Scheduled for future execution
  | 'running'      // Currently executing
  | 'paused'       // Paused mid-execution
  | 'completed'    // Successfully finished
  | 'failed'       // Failed after all retries exhausted
  | 'cancelled'    // Manually cancelled
  | 'retrying';    // Failed, waiting for next retry attempt

interface SyncCursor {
  /** Timestamp of the last successfully synced record */
  lastSyncedAt: Date;
  /** ID of the last successfully synced record */
  lastSyncedId: string;
  /** Destination-specific cursor data */
  destinationCursor: Record<string, unknown> | null;
  /** Page token for paginated APIs */
  pageToken: string | null;
}

interface SyncProgress {
  /** Total records to process (null if unknown/streaming) */
  totalRecords: number | null;
  /** Records processed so far */
  processedRecords: number;
  /** Records successfully synced */
  successCount: number;
  /** Records that failed to sync */
  failureCount: number;
  /** Records skipped (e.g., no changes) */
  skippedCount: number;
  /** Current phase of the sync */
  phase: 'resolving' | 'mapping' | 'transforming' | 'syncing' | 'finalizing';
  /** Estimated time remaining in seconds */
  estimatedSecondsRemaining: number | null;
  /** Records per second throughput */
  throughput: number;
  /** Percentage complete (0-100) */
  percentComplete: number;
}

interface SyncJobError {
  code: string;
  message: string;
  details: Record<string, unknown> | null;
  occurredAt: Date;
  isRetryable: boolean;
}
```

### DestinationAdapter

The pluggable interface that all destination integrations must implement.

```typescript
/**
 * DestinationAdapter is the contract that every external platform integration
 * must fulfill. It abstracts away the specifics of each destination's API,
 * authentication, data format, and rate limiting behavior.
 */
interface DestinationAdapter {
  /** Unique identifier for this adapter type (e.g., 'mailchimp', 'hubspot') */
  readonly type: DestinationType;

  /** Human-readable name */
  readonly displayName: string;

  /** Supported sync modes for this destination */
  readonly supportedModes: SyncMode[];

  /** Maximum batch size for bulk operations */
  readonly maxBatchSize: number;

  /** Default rate limit configuration */
  readonly defaultRateLimits: RateLimitConfig;

  /**
   * Initialize the adapter with destination-specific credentials and config.
   * Validates credentials and establishes any persistent connections.
   */
  initialize(config: DestinationConfig): Promise<void>;

  /**
   * Test the connection to the destination.
   * Returns detailed status including auth validity, API reachability, etc.
   */
  testConnection(): Promise<ConnectionTestResult>;

  /**
   * Get the destination's schema — what fields it expects/supports.
   * Used to validate field mappings and offer mapping suggestions.
   */
  getSchema(): Promise<DestinationSchema>;

  /**
   * Push a batch of records to the destination.
   * Returns per-record results for granular error tracking.
   */
  pushBatch(batch: SyncBatchPayload): Promise<BatchPushResult>;

  /**
   * Delete records from the destination (for segment exits, GDPR, etc.).
   */
  deleteBatch(identifiers: DestinationIdentifier[]): Promise<BatchDeleteResult>;

  /**
   * Fetch current state of records from the destination.
   * Used for conflict detection and reconciliation.
   */
  fetchRecords(identifiers: DestinationIdentifier[]): Promise<DestinationRecord[]>;

  /**
   * Get the current rate limit status from the destination's response headers.
   */
  getRateLimitStatus(): Promise<RateLimitStatus>;

  /**
   * Handle destination-specific webhook callbacks (e.g., Mailchimp unsubscribes).
   */
  handleWebhook(payload: unknown): Promise<WebhookHandlerResult>;

  /**
   * Clean up resources, close connections.
   */
  dispose(): Promise<void>;
}

type DestinationType =
  | 'mailchimp'
  | 'hubspot'
  | 'google_ads'
  | 'facebook_ads'
  | 'salesforce'
  | 'braze'
  | 'iterable'
  | 'webhook';

interface DestinationConfig {
  id: string;
  ventureId: string;
  type: DestinationType;
  name: string;
  credentials: EncryptedCredentials;
  settings: Record<string, unknown>;
  rateLimits: RateLimitConfig | null;
  enabled: boolean;
}

interface EncryptedCredentials {
  /** Encrypted JSON blob of credentials */
  encryptedPayload: string;
  /** Key version used for encryption */
  keyVersion: number;
  /** Credential fields vary by destination type */
  fields: string[];
}

interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  error?: string;
  details: {
    authValid: boolean;
    apiReachable: boolean;
    permissionsSufficient: boolean;
    apiVersion: string;
    accountName?: string;
  };
}

interface DestinationSchema {
  /** Available objects/entities in the destination */
  objects: DestinationObject[];
  /** Required fields that must be mapped */
  requiredFields: string[];
  /** Fields available for mapping */
  availableFields: DestinationField[];
  /** Custom field support */
  supportsCustomFields: boolean;
  /** Maximum custom fields allowed */
  maxCustomFields: number | null;
}

interface DestinationObject {
  id: string;
  name: string;
  description: string;
  supportsCreate: boolean;
  supportsUpdate: boolean;
  supportsDelete: boolean;
  identifierFields: string[];
}

interface DestinationField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'email' | 'phone' | 'array' | 'object';
  required: boolean;
  readOnly: boolean;
  maxLength?: number;
  enumValues?: string[];
  description?: string;
}

interface SyncBatchPayload {
  destinationObject: string;
  records: TransformedRecord[];
  operation: 'upsert' | 'create' | 'update';
}

interface TransformedRecord {
  /** CDP profile ID for tracking */
  sourceId: string;
  /** Destination identifier (if updating existing record) */
  destinationId?: string;
  /** Mapped and transformed field values */
  fields: Record<string, unknown>;
  /** Metadata for conflict resolution */
  lastModifiedAt: Date;
}

interface BatchPushResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: RecordPushResult[];
  rateLimitRemaining: number | null;
  rateLimitResetAt: Date | null;
}

interface RecordPushResult {
  sourceId: string;
  destinationId: string | null;
  success: boolean;
  operation: 'created' | 'updated' | 'skipped';
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}
```

### FieldMapping

Configuration for translating CDP fields to destination fields.

```typescript
/**
 * FieldMapping defines how CDP profile/trait fields map to
 * a specific destination's expected field structure. Each destination
 * has its own set of field mappings, configured per venture.
 */
interface FieldMapping {
  id: string;
  ventureId: string;
  destinationId: string;
  /** Source object in CDP (e.g., 'profile', 'event') */
  sourceObject: string;
  /** Target object in destination (e.g., 'contact', 'subscriber') */
  destinationObject: string;
  /** Individual field mapping rules */
  rules: FieldMappingRule[];
  /** Default values for unmapped destination fields */
  defaults: Record<string, unknown>;
  /** Whether to sync unmapped fields as custom properties */
  syncUnmappedAsCustom: boolean;
  /** Fields to explicitly exclude from sync */
  excludeFields: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface FieldMappingRule {
  id: string;
  /** Source field path (dot notation for nested, e.g., 'traits.company.name') */
  sourceField: string;
  /** Destination field identifier */
  destinationField: string;
  /** Transform to apply during mapping */
  transform: FieldTransform | null;
  /** Whether this mapping is required (sync fails if source field is missing) */
  required: boolean;
  /** Default value if source field is null/undefined */
  defaultValue: unknown | null;
  /** Whether to skip the record if this field is null */
  skipIfNull: boolean;
  /** Optional description for documentation */
  description: string | null;
}

type FieldTransform =
  | { type: 'identity' }
  | { type: 'lowercase' }
  | { type: 'uppercase' }
  | { type: 'trim' }
  | { type: 'hash'; algorithm: 'sha256' | 'md5' }
  | { type: 'truncate'; maxLength: number }
  | { type: 'dateFormat'; inputFormat: string; outputFormat: string }
  | { type: 'numberFormat'; decimals: number; locale?: string }
  | { type: 'booleanCast'; truthyValues: string[] }
  | { type: 'enumMap'; mapping: Record<string, string> }
  | { type: 'template'; template: string }
  | { type: 'concatenate'; fields: string[]; separator: string }
  | { type: 'split'; separator: string; index: number }
  | { type: 'regex'; pattern: string; replacement: string }
  | { type: 'custom'; functionName: string; params: Record<string, unknown> };
```

### SyncConfig

Top-level configuration for a destination's sync behavior.

```typescript
/**
 * SyncConfig captures the complete sync configuration for a specific
 * destination within a venture — mode, schedule, behavior, and limits.
 */
interface SyncConfig {
  id: string;
  ventureId: string;
  destinationId: string;

  /** Primary sync mode */
  mode: SyncMode;

  /** Schedule configuration (ignored for real-time mode) */
  schedule: SyncSchedule | null;

  /** Which segments to sync (null = all segments) */
  segmentIds: string[] | null;

  /** Conflict resolution strategy */
  conflictResolution: ConflictResolutionStrategy;

  /** Rate limiting overrides (null = use destination defaults) */
  rateLimits: RateLimitConfig | null;

  /** Retry behavior configuration */
  retryConfig: RetryConfig;

  /** Maximum records per sync job */
  maxRecordsPerJob: number;

  /** Batch size for API calls */
  batchSize: number;

  /** Whether to sync deletions (segment exits) */
  syncDeletions: boolean;

  /** Whether to track individual record-level history */
  trackRecordHistory: boolean;

  /** Whether sync is currently enabled */
  enabled: boolean;

  /** Alert configuration for failures */
  alertConfig: SyncAlertConfig;

  createdAt: Date;
  updatedAt: Date;
}

interface SyncSchedule {
  /** Cron expression for scheduled syncs (e.g., '0 */6 * * *' for every 6h) */
  cronExpression: string;
  /** Timezone for cron evaluation */
  timezone: string;
  /** Whether to skip if previous job is still running */
  skipIfRunning: boolean;
  /** Maximum execution time before job is killed */
  timeoutMinutes: number;
}

interface RetryConfig {
  /** Maximum number of retries */
  maxRetries: number;
  /** Base delay between retries in milliseconds */
  baseDelayMs: number;
  /** Maximum delay cap in milliseconds */
  maxDelayMs: number;
  /** Backoff multiplier (e.g., 2 for exponential) */
  backoffMultiplier: number;
  /** Whether to add jitter to retry delays */
  jitter: boolean;
  /** Error codes that should not be retried */
  nonRetryableCodes: string[];
}

interface SyncAlertConfig {
  /** Alert on consecutive failures exceeding this count */
  alertOnConsecutiveFailures: number;
  /** Alert if sync duration exceeds this (minutes) */
  alertOnLongRunning: number;
  /** Alert if error rate exceeds this percentage */
  alertOnErrorRate: number;
  /** Notification channels (email addresses, webhook URLs) */
  notificationTargets: NotificationTarget[];
}

interface NotificationTarget {
  type: 'email' | 'webhook' | 'slack';
  target: string;
  minSeverity: 'info' | 'warning' | 'error' | 'critical';
}
```

### SyncResult

The outcome of a completed sync job.

```typescript
/**
 * SyncResult captures the complete outcome of a sync job execution,
 * including success/failure counts, timing, and detailed per-record results.
 */
interface SyncResult {
  /** Job ID this result belongs to */
  jobId: string;

  /** Overall status */
  status: 'success' | 'partial' | 'failed';

  /** Summary statistics */
  summary: SyncResultSummary;

  /** Updated cursor position for incremental syncs */
  cursor: SyncCursor | null;

  /** Detailed errors (capped at 1000) */
  errors: SyncRecordError[];

  /** Conflicts that were resolved during sync */
  resolvedConflicts: ResolvedConflict[];

  /** Timing breakdown */
  timing: SyncTiming;

  /** Rate limit state at completion */
  rateLimitState: RateLimitStatus;
}

interface SyncResultSummary {
  totalRecords: number;
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  failed: number;
  /** Breakdown of failures by error code */
  failuresByCode: Record<string, number>;
}

interface SyncTiming {
  /** Total job duration in milliseconds */
  totalDurationMs: number;
  /** Time spent resolving source data */
  sourceResolutionMs: number;
  /** Time spent mapping fields */
  fieldMappingMs: number;
  /** Time spent transforming data */
  transformationMs: number;
  /** Time spent pushing to destination */
  destinationPushMs: number;
  /** Time spent waiting for rate limits */
  rateLimitWaitMs: number;
  /** Time spent on conflict resolution */
  conflictResolutionMs: number;
}

interface SyncRecordError {
  sourceId: string;
  destinationId: string | null;
  errorCode: string;
  message: string;
  retryable: boolean;
  field?: string;
  attemptNumber: number;
}

interface ResolvedConflict {
  sourceId: string;
  destinationId: string;
  field: string;
  cdpValue: unknown;
  destinationValue: unknown;
  resolvedValue: unknown;
  strategy: ConflictResolutionStrategy;
}
```

### ConflictResolution

Strategies for handling data conflicts between CDP and destinations.

```typescript
/**
 * Conflict resolution determines what happens when the CDP and the
 * destination disagree about a field's value. This is especially
 * important for bidirectional-ish scenarios where destination data
 * may be modified directly (e.g., a sales rep updating Salesforce).
 */
type ConflictResolutionStrategy =
  | 'cdp_wins'           // CDP value always overwrites destination
  | 'destination_wins'   // Destination value is preserved, CDP skips
  | 'most_recent_wins'   // Whichever was modified more recently wins
  | 'merge'              // Attempt to merge non-conflicting fields
  | 'manual'             // Flag for manual review, do not auto-resolve
  | 'skip';              // Skip the entire record if any conflict exists

interface ConflictResolver {
  /**
   * Detect conflicts between CDP data and destination data.
   */
  detectConflicts(
    cdpRecords: TransformedRecord[],
    destinationRecords: DestinationRecord[],
  ): Promise<ConflictRecord[]>;

  /**
   * Resolve detected conflicts using the configured strategy.
   */
  resolveConflicts(
    conflicts: ConflictRecord[],
    strategy: ConflictResolutionStrategy,
  ): Promise<ResolvedConflict[]>;

  /**
   * Get conflicts flagged for manual review.
   */
  getManualReviewQueue(
    ventureId: string,
    destinationId: string,
  ): Promise<PaginatedResult<ConflictRecord>>;

  /**
   * Manually resolve a specific conflict.
   */
  resolveManually(
    conflictId: string,
    resolution: ManualResolution,
  ): Promise<void>;
}

interface ConflictRecord {
  id: string;
  jobId: string;
  sourceId: string;
  destinationId: string;
  conflictingFields: ConflictingField[];
  detectedAt: Date;
  resolvedAt: Date | null;
  resolution: ConflictResolutionStrategy | null;
}

interface ConflictingField {
  field: string;
  cdpValue: unknown;
  cdpModifiedAt: Date;
  destinationValue: unknown;
  destinationModifiedAt: Date | null;
}

interface ManualResolution {
  resolvedBy: string;
  resolution: 'use_cdp' | 'use_destination' | 'custom';
  customValues?: Record<string, unknown>;
  note?: string;
}
```

### RateLimitConfig

Rate limiting configuration to respect destination API constraints.

```typescript
/**
 * Rate limiting configuration per destination. Each destination has
 * different API rate limits, and sync must respect them to avoid
 * being throttled or banned.
 */
interface RateLimitConfig {
  /** Maximum requests per second */
  requestsPerSecond: number;

  /** Maximum requests per minute */
  requestsPerMinute: number;

  /** Maximum requests per hour */
  requestsPerHour: number;

  /** Maximum requests per day */
  requestsPerDay: number | null;

  /** Maximum concurrent requests */
  maxConcurrent: number;

  /** Maximum records per batch request */
  maxBatchSize: number;

  /** Backoff strategy when rate limited */
  backoffStrategy: BackoffStrategy;

  /** Whether to read rate limit headers from API responses */
  respectResponseHeaders: boolean;

  /** Buffer percentage below the limit to stay safe (0-100) */
  safetyMarginPercent: number;
}

type BackoffStrategy =
  | { type: 'fixed'; delayMs: number }
  | { type: 'exponential'; baseMs: number; maxMs: number; multiplier: number }
  | { type: 'linear'; baseMs: number; incrementMs: number; maxMs: number }
  | { type: 'adaptive'; initialMs: number; maxMs: number };

interface RateLimitStatus {
  /** Requests remaining in current window */
  remaining: number;
  /** Total limit for current window */
  limit: number;
  /** When the current window resets */
  resetsAt: Date;
  /** Whether currently being rate-limited */
  isLimited: boolean;
  /** Current utilization percentage */
  utilizationPercent: number;
}
```

---

## Database Schemas

All tables use multi-tenant RLS with `venture_id` scoping. Sync state is stored in Supabase PostgreSQL using Drizzle ORM.

### sync_destinations

Stores destination configurations — credentials, settings, and connection status.

```typescript
import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * sync_destinations — Configured destination platforms per venture.
 * Each row represents one external platform connection (e.g., a venture's
 * Mailchimp account, their Google Ads account, etc.).
 */
export const syncDestinations = pgTable(
  'sync_destinations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ventureId: uuid('venture_id').notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    // Encrypted credentials blob
    credentialsEncrypted: text('credentials_encrypted').notNull(),
    credentialsKeyVersion: integer('credentials_key_version').notNull().default(1),

    // Destination-specific settings (audience ID, list ID, etc.)
    settings: jsonb('settings').notNull().default({}),

    // Sync configuration
    syncMode: varchar('sync_mode', { length: 20 }).notNull().default('incremental'),
    scheduleConfig: jsonb('schedule_config'),
    conflictStrategy: varchar('conflict_strategy', { length: 30 }).notNull().default('cdp_wins'),
    rateLimitOverrides: jsonb('rate_limit_overrides'),
    retryConfig: jsonb('retry_config').notNull().default({
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 300000,
      backoffMultiplier: 2,
      jitter: true,
      nonRetryableCodes: [],
    }),
    batchSize: integer('batch_size').notNull().default(100),
    maxRecordsPerJob: integer('max_records_per_job').notNull().default(100000),
    syncDeletions: boolean('sync_deletions').notNull().default(true),
    trackRecordHistory: boolean('track_record_history').notNull().default(true),

    // Alert configuration
    alertConfig: jsonb('alert_config').notNull().default({
      alertOnConsecutiveFailures: 3,
      alertOnLongRunning: 60,
      alertOnErrorRate: 10,
      notificationTargets: [],
    }),

    // Connection health
    lastConnectionTest: timestamp('last_connection_test', { withTimezone: true }),
    connectionStatus: varchar('connection_status', { length: 20 }).notNull().default('untested'),
    connectionError: text('connection_error'),

    // Status
    enabled: boolean('enabled').notNull().default(true),
    paused: boolean('paused').notNull().default(false),

    // Cursor for incremental syncs
    lastSyncCursor: jsonb('last_sync_cursor'),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    lastSuccessfulSyncAt: timestamp('last_successful_sync_at', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    ventureIdx: index('sync_dest_venture_idx').on(table.ventureId),
    ventureTypeIdx: index('sync_dest_venture_type_idx').on(table.ventureId, table.type),
    enabledIdx: index('sync_dest_enabled_idx').on(table.ventureId, table.enabled),
    uniqueName: uniqueIndex('sync_dest_unique_name').on(table.ventureId, table.name),
  }),
);

export const syncDestinationsRelations = relations(syncDestinations, ({ many }) => ({
  jobs: many(syncJobs),
  fieldMappings: many(syncFieldMappings),
  history: many(syncHistory),
  errors: many(syncErrors),
}));
```

### sync_jobs

Tracks individual sync job executions — status, progress, timing.

```typescript
/**
 * sync_jobs — Individual sync job executions.
 * Each row is one sync run targeting one destination. Tracks full lifecycle
 * from creation through completion/failure.
 */
export const syncJobs = pgTable(
  'sync_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ventureId: uuid('venture_id').notNull(),
    destinationId: uuid('destination_id')
      .notNull()
      .references(() => syncDestinations.id, { onDelete: 'cascade' }),

    // Job configuration
    mode: varchar('mode', { length: 20 }).notNull(),
    priority: varchar('priority', { length: 20 }).notNull().default('normal'),
    segmentIds: jsonb('segment_ids').$type<string[]>(),
    profileIds: jsonb('profile_ids').$type<string[]>(),

    // Status tracking
    status: varchar('status', { length: 20 }).notNull().default('pending'),

    // Progress
    totalRecords: integer('total_records'),
    processedRecords: integer('processed_records').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    failureCount: integer('failure_count').notNull().default(0),
    skippedCount: integer('skipped_count').notNull().default(0),
    currentPhase: varchar('current_phase', { length: 30 }),

    // Sync cursor (for incremental — start and end positions)
    startCursor: jsonb('start_cursor'),
    endCursor: jsonb('end_cursor'),

    // Error information
    errorCode: varchar('error_code', { length: 50 }),
    errorMessage: text('error_message'),
    errorDetails: jsonb('error_details'),
    isRetryable: boolean('is_retryable'),

    // Retry tracking
    retryCount: integer('retry_count').notNull().default(0),
    maxRetries: integer('max_retries').notNull().default(3),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),

    // Timing
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),

    // Timing breakdown
    timingBreakdown: jsonb('timing_breakdown').$type<{
      sourceResolutionMs: number;
      fieldMappingMs: number;
      transformationMs: number;
      destinationPushMs: number;
      rateLimitWaitMs: number;
      conflictResolutionMs: number;
    }>(),

    // Rate limit state at completion
    rateLimitStateAtCompletion: jsonb('rate_limit_state_at_completion'),

    // Metadata
    metadata: jsonb('metadata').notNull().default({}),
    triggeredBy: varchar('triggered_by', { length: 50 }).notNull().default('schedule'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ventureIdx: index('sync_jobs_venture_idx').on(table.ventureId),
    destIdx: index('sync_jobs_dest_idx').on(table.destinationId),
    statusIdx: index('sync_jobs_status_idx').on(table.status),
    ventureStatusIdx: index('sync_jobs_venture_status_idx').on(table.ventureId, table.status),
    scheduledIdx: index('sync_jobs_scheduled_idx').on(table.scheduledAt),
    createdIdx: index('sync_jobs_created_idx').on(table.createdAt),
    retryIdx: index('sync_jobs_retry_idx').on(table.status, table.nextRetryAt),
  }),
);

export const syncJobsRelations = relations(syncJobs, ({ one, many }) => ({
  destination: one(syncDestinations, {
    fields: [syncJobs.destinationId],
    references: [syncDestinations.id],
  }),
  history: many(syncHistory),
  errors: many(syncErrors),
}));
```

### sync_field_mappings

Stores field mapping configurations between CDP and destination schemas.

```typescript
/**
 * sync_field_mappings — Field mapping rules per destination.
 * Defines how CDP fields translate to destination-specific fields,
 * including transforms, defaults, and validation rules.
 */
export const syncFieldMappings = pgTable(
  'sync_field_mappings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ventureId: uuid('venture_id').notNull(),
    destinationId: uuid('destination_id')
      .notNull()
      .references(() => syncDestinations.id, { onDelete: 'cascade' }),

    // Object mapping
    sourceObject: varchar('source_object', { length: 100 }).notNull().default('profile'),
    destinationObject: varchar('destination_object', { length: 100 }).notNull(),

    // Individual field rules
    rules: jsonb('rules')
      .notNull()
      .$type<Array<{
        id: string;
        sourceField: string;
        destinationField: string;
        transform: FieldTransform | null;
        required: boolean;
        defaultValue: unknown | null;
        skipIfNull: boolean;
        description: string | null;
      }>>()
      .default([]),

    // Default values for unmapped fields
    defaults: jsonb('defaults').notNull().default({}),

    // Behavior
    syncUnmappedAsCustom: boolean('sync_unmapped_as_custom').notNull().default(false),
    excludeFields: jsonb('exclude_fields').$type<string[]>().notNull().default([]),

    // Validation
    lastValidatedAt: timestamp('last_validated_at', { withTimezone: true }),
    validationErrors: jsonb('validation_errors').$type<string[]>(),

    // Version tracking for mapping changes
    version: integer('version').notNull().default(1),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ventureIdx: index('sync_fm_venture_idx').on(table.ventureId),
    destIdx: index('sync_fm_dest_idx').on(table.destinationId),
    uniqueMapping: uniqueIndex('sync_fm_unique_mapping').on(
      table.destinationId,
      table.sourceObject,
      table.destinationObject,
    ),
  }),
);

export const syncFieldMappingsRelations = relations(syncFieldMappings, ({ one }) => ({
  destination: one(syncDestinations, {
    fields: [syncFieldMappings.destinationId],
    references: [syncDestinations.id],
  }),
}));
```

### sync_history

Audit trail of sync operations — what was synced, when, outcome.

```typescript
/**
 * sync_history — Complete audit trail of sync operations.
 * Records every sync job execution with full statistics. Partitioned
 * by month for efficient querying and retention management.
 */
export const syncHistory = pgTable(
  'sync_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ventureId: uuid('venture_id').notNull(),
    destinationId: uuid('destination_id')
      .notNull()
      .references(() => syncDestinations.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => syncJobs.id, { onDelete: 'cascade' }),

    // Sync details
    mode: varchar('mode', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),

    // Summary stats
    totalRecords: integer('total_records').notNull(),
    recordsCreated: integer('records_created').notNull().default(0),
    recordsUpdated: integer('records_updated').notNull().default(0),
    recordsDeleted: integer('records_deleted').notNull().default(0),
    recordsSkipped: integer('records_skipped').notNull().default(0),
    recordsFailed: integer('records_failed').notNull().default(0),

    // Failure breakdown
    failuresByCode: jsonb('failures_by_code').$type<Record<string, number>>().notNull().default({}),

    // Conflict stats
    conflictsDetected: integer('conflicts_detected').notNull().default(0),
    conflictsResolved: integer('conflicts_resolved').notNull().default(0),
    conflictsPendingReview: integer('conflicts_pending_review').notNull().default(0),

    // Timing
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
    durationMs: integer('duration_ms').notNull(),
    timingBreakdown: jsonb('timing_breakdown'),

    // Rate limit impact
    rateLimitWaitMs: integer('rate_limit_wait_ms').notNull().default(0),
    rateLimitHits: integer('rate_limit_hits').notNull().default(0),

    // Data volume
    bytesTransferred: integer('bytes_transferred').notNull().default(0),
    apiCallsMade: integer('api_calls_made').notNull().default(0),

    // Cursor positions
    startCursor: jsonb('start_cursor'),
    endCursor: jsonb('end_cursor'),

    // Segments synced
    segmentIds: jsonb('segment_ids').$type<string[]>(),

    // Who/what triggered this sync
    triggeredBy: varchar('triggered_by', { length: 50 }).notNull(),
    triggeredByUserId: uuid('triggered_by_user_id'),

    // Error summary (if failed)
    errorCode: varchar('error_code', { length: 50 }),
    errorMessage: text('error_message'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ventureIdx: index('sync_hist_venture_idx').on(table.ventureId),
    destIdx: index('sync_hist_dest_idx').on(table.destinationId),
    jobIdx: index('sync_hist_job_idx').on(table.jobId),
    statusIdx: index('sync_hist_status_idx').on(table.status),
    createdIdx: index('sync_hist_created_idx').on(table.createdAt),
    ventureCreatedIdx: index('sync_hist_venture_created_idx').on(table.ventureId, table.createdAt),
    destStatusIdx: index('sync_hist_dest_status_idx').on(table.destinationId, table.status),
  }),
);

export const syncHistoryRelations = relations(syncHistory, ({ one }) => ({
  destination: one(syncDestinations, {
    fields: [syncHistory.destinationId],
    references: [syncDestinations.id],
  }),
  job: one(syncJobs, {
    fields: [syncHistory.jobId],
    references: [syncJobs.id],
  }),
}));
```

### sync_errors

Detailed error records for failed sync operations at the record level.

```typescript
/**
 * sync_errors — Per-record error details from sync jobs.
 * When a sync job partially fails, individual record failures are
 * logged here for debugging and retry. Also feeds the dead letter queue.
 */
export const syncErrors = pgTable(
  'sync_errors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ventureId: uuid('venture_id').notNull(),
    destinationId: uuid('destination_id')
      .notNull()
      .references(() => syncDestinations.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => syncJobs.id, { onDelete: 'cascade' }),

    // Record identification
    sourceId: varchar('source_id', { length: 255 }).notNull(),
    destinationRecordId: varchar('destination_record_id', { length: 255 }),

    // Error details
    errorCode: varchar('error_code', { length: 50 }).notNull(),
    errorMessage: text('error_message').notNull(),
    errorDetails: jsonb('error_details'),
    failedField: varchar('failed_field', { length: 255 }),

    // The payload that failed (for debugging/retry)
    failedPayload: jsonb('failed_payload'),

    // Retry info
    isRetryable: boolean('is_retryable').notNull(),
    retryCount: integer('retry_count').notNull().default(0),
    maxRetries: integer('max_retries').notNull().default(3),
    lastRetriedAt: timestamp('last_retried_at', { withTimezone: true }),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),

    // Dead letter queue status
    dlqStatus: varchar('dlq_status', { length: 20 }).notNull().default('active'),
    dlqResolvedAt: timestamp('dlq_resolved_at', { withTimezone: true }),
    dlqResolvedBy: uuid('dlq_resolved_by'),
    dlqResolution: varchar('dlq_resolution', { length: 30 }),

    // HTTP response details (when applicable)
    httpStatus: integer('http_status'),
    httpResponseBody: text('http_response_body'),

    // Timestamps
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ventureIdx: index('sync_err_venture_idx').on(table.ventureId),
    destIdx: index('sync_err_dest_idx').on(table.destinationId),
    jobIdx: index('sync_err_job_idx').on(table.jobId),
    sourceIdx: index('sync_err_source_idx').on(table.sourceId),
    codeIdx: index('sync_err_code_idx').on(table.errorCode),
    dlqIdx: index('sync_err_dlq_idx').on(table.dlqStatus),
    retryIdx: index('sync_err_retry_idx').on(table.isRetryable, table.nextRetryAt),
    ventureCodeIdx: index('sync_err_venture_code_idx').on(table.ventureId, table.errorCode),
  }),
);

export const syncErrorsRelations = relations(syncErrors, ({ one }) => ({
  destination: one(syncDestinations, {
    fields: [syncErrors.destinationId],
    references: [syncDestinations.id],
  }),
  job: one(syncJobs, {
    fields: [syncErrors.jobId],
    references: [syncJobs.id],
  }),
}));
```

### sync_rate_limit_state

Tracks real-time rate limit consumption per destination.

```typescript
/**
 * sync_rate_limit_state — Real-time rate limit tracking per destination.
 * Updated on every API call to ensure we never exceed destination limits.
 * Uses atomic increments and sliding windows.
 */
export const syncRateLimitState = pgTable(
  'sync_rate_limit_state',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ventureId: uuid('venture_id').notNull(),
    destinationId: uuid('destination_id')
      .notNull()
      .references(() => syncDestinations.id, { onDelete: 'cascade' }),

    // Current window state
    windowType: varchar('window_type', { length: 20 }).notNull(), // 'second', 'minute', 'hour', 'day'
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
    requestCount: integer('request_count').notNull().default(0),
    requestLimit: integer('request_limit').notNull(),

    // Backoff state
    isBackingOff: boolean('is_backing_off').notNull().default(false),
    backoffUntil: timestamp('backoff_until', { withTimezone: true }),
    consecutiveRateLimits: integer('consecutive_rate_limits').notNull().default(0),

    // Last API response rate limit headers
    lastRateLimitRemaining: integer('last_rate_limit_remaining'),
    lastRateLimitReset: timestamp('last_rate_limit_reset', { withTimezone: true }),

    // Timestamps
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    destWindowIdx: uniqueIndex('sync_rl_dest_window_idx').on(
      table.destinationId,
      table.windowType,
    ),
    backoffIdx: index('sync_rl_backoff_idx').on(table.isBackingOff),
  }),
);
```

### sync_dead_letter_queue

Failed records that have exhausted all retries, pending manual resolution.

```typescript
/**
 * sync_dead_letter_queue — Records that have exhausted all automatic
 * retry attempts. Requires manual investigation and resolution.
 * Records can be retried, skipped, or resolved with corrected data.
 */
export const syncDeadLetterQueue = pgTable(
  'sync_dead_letter_queue',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ventureId: uuid('venture_id').notNull(),
    destinationId: uuid('destination_id')
      .notNull()
      .references(() => syncDestinations.id, { onDelete: 'cascade' }),
    originalJobId: uuid('original_job_id')
      .notNull()
      .references(() => syncJobs.id, { onDelete: 'set null' }),

    // Record identification
    sourceId: varchar('source_id', { length: 255 }).notNull(),
    destinationRecordId: varchar('destination_record_id', { length: 255 }),

    // The failed payload (complete data for retry)
    payload: jsonb('payload').notNull(),
    transformedPayload: jsonb('transformed_payload'),

    // Error context
    errorCode: varchar('error_code', { length: 50 }).notNull(),
    errorMessage: text('error_message').notNull(),
    errorHistory: jsonb('error_history').$type<Array<{
      attemptNumber: number;
      errorCode: string;
      errorMessage: string;
      occurredAt: string;
      httpStatus?: number;
    }>>().notNull(),

    // Total attempts across all jobs
    totalAttempts: integer('total_attempts').notNull(),

    // Resolution
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: uuid('resolved_by'),
    resolution: varchar('resolution', { length: 30 }),
    resolutionNote: text('resolution_note'),

    // If retried, which job handled it
    retryJobId: uuid('retry_job_id'),

    // Timestamps
    firstFailedAt: timestamp('first_failed_at', { withTimezone: true }).notNull(),
    lastFailedAt: timestamp('last_failed_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ventureIdx: index('sync_dlq_venture_idx').on(table.ventureId),
    destIdx: index('sync_dlq_dest_idx').on(table.destinationId),
    statusIdx: index('sync_dlq_status_idx').on(table.status),
    ventureStatusIdx: index('sync_dlq_venture_status_idx').on(table.ventureId, table.status),
    sourceIdx: index('sync_dlq_source_idx').on(table.sourceId),
    errorCodeIdx: index('sync_dlq_error_code_idx').on(table.errorCode),
  }),
);
```

---

## Code Examples

### 1. Configuring a Destination

Setting up a new Mailchimp destination for a venture with credentials, sync mode, and schedule.

```typescript
import { syncRouter } from '@mcv/cdp/sync';
import { createTRPCContext } from '@mcv/trpc';

// ─── Configure a new Mailchimp destination ──────────────────────────

const destination = await trpc.sync.destinations.create.mutate({
  ventureId: 'venture_abc123',
  type: 'mailchimp',
  name: 'Main Marketing List',
  description: 'Primary email list for newsletter and campaigns',

  // Credentials (will be encrypted at rest)
  credentials: {
    apiKey: 'mc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us21',
    server: 'us21',
  },

  // Mailchimp-specific settings
  settings: {
    audienceId: 'abc123def',  // Mailchimp audience/list ID
    doubleOptIn: false,
    tags: ['cdp-synced'],
  },

  // Sync configuration
  syncMode: 'incremental',
  schedule: {
    cronExpression: '0 */4 * * *',  // Every 4 hours
    timezone: 'America/Toronto',
    skipIfRunning: true,
    timeoutMinutes: 30,
  },

  // Behavior
  conflictStrategy: 'cdp_wins',
  batchSize: 500,              // Mailchimp supports up to 500 per batch
  maxRecordsPerJob: 50000,
  syncDeletions: true,         // Remove from list when segment exits

  // Retry policy
  retryConfig: {
    maxRetries: 5,
    baseDelayMs: 2000,
    maxDelayMs: 300000,        // 5 minutes max
    backoffMultiplier: 2,
    jitter: true,
    nonRetryableCodes: ['INVALID_API_KEY', 'AUDIENCE_NOT_FOUND'],
  },

  // Alerting
  alertConfig: {
    alertOnConsecutiveFailures: 3,
    alertOnLongRunning: 45,    // Alert if sync takes > 45 min
    alertOnErrorRate: 5,       // Alert if > 5% of records fail
    notificationTargets: [
      { type: 'email', target: 'ops@venture.com', minSeverity: 'error' },
      { type: 'slack', target: '#cdp-alerts', minSeverity: 'warning' },
    ],
  },
});

console.log(`Destination created: ${destination.id}`);

// ─── Test the connection ────────────────────────────────────────────

const connectionTest = await trpc.sync.destinations.testConnection.mutate({
  destinationId: destination.id,
});

if (connectionTest.success) {
  console.log(`Connected to ${connectionTest.details.accountName}`);
  console.log(`API version: ${connectionTest.details.apiVersion}`);
  console.log(`Latency: ${connectionTest.latencyMs}ms`);
} else {
  console.error(`Connection failed: ${connectionTest.error}`);
}

// ─── Fetch the destination's schema for mapping ─────────────────────

const schema = await trpc.sync.destinations.getSchema.query({
  destinationId: destination.id,
});

console.log('Available fields:', schema.availableFields.map(f => f.name));
console.log('Required fields:', schema.requiredFields);
console.log('Supports custom fields:', schema.supportsCustomFields);
```

### 2. Setting Up Field Mappings

Defining how CDP profile fields map to Mailchimp subscriber fields.

```typescript
import { FieldMapper } from '@mcv/cdp/sync';

// ─── Create field mappings for Mailchimp ─────────────────────────────

const fieldMapping = await trpc.sync.fieldMappings.create.mutate({
  ventureId: 'venture_abc123',
  destinationId: destination.id,
  sourceObject: 'profile',
  destinationObject: 'subscriber',

  rules: [
    // Simple direct mappings
    {
      sourceField: 'email',
      destinationField: 'email_address',
      transform: null,
      required: true,
      defaultValue: null,
      skipIfNull: true,
      description: 'Primary email — required for Mailchimp subscriber ID',
    },
    {
      sourceField: 'traits.firstName',
      destinationField: 'merge_fields.FNAME',
      transform: { type: 'trim' },
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: 'First name merge field',
    },
    {
      sourceField: 'traits.lastName',
      destinationField: 'merge_fields.LNAME',
      transform: { type: 'trim' },
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: 'Last name merge field',
    },

    // Transform: concatenate fields
    {
      sourceField: 'traits.city',
      destinationField: 'merge_fields.CITY',
      transform: { type: 'uppercase' },
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: 'City in uppercase',
    },

    // Transform: date formatting
    {
      sourceField: 'traits.birthdate',
      destinationField: 'merge_fields.BIRTHDAY',
      transform: {
        type: 'dateFormat',
        inputFormat: 'YYYY-MM-DD',
        outputFormat: 'MM/DD',
      },
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: 'Birthday in Mailchimp MM/DD format',
    },

    // Transform: enum mapping
    {
      sourceField: 'traits.subscriptionTier',
      destinationField: 'merge_fields.TIER',
      transform: {
        type: 'enumMap',
        mapping: {
          free: 'Free',
          starter: 'Starter',
          professional: 'Pro',
          enterprise: 'Enterprise',
        },
      },
      required: false,
      defaultValue: 'Free',
      skipIfNull: false,
      description: 'Subscription tier mapped to Mailchimp values',
    },

    // Transform: hash for matching (e.g., Google Ads requires SHA256 emails)
    {
      sourceField: 'phone',
      destinationField: 'merge_fields.PHONE',
      transform: { type: 'trim' },
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: 'Phone number',
    },

    // Transform: template-based computed field
    {
      sourceField: 'traits.totalOrders',
      destinationField: 'merge_fields.SEGMENT',
      transform: {
        type: 'custom',
        functionName: 'computeEngagementTier',
        params: { thresholds: [0, 5, 20, 100] },
      },
      required: false,
      defaultValue: 'new',
      skipIfNull: false,
      description: 'Computed engagement segment based on order count',
    },
  ],

  // Default values for destination fields not mapped from CDP
  defaults: {
    status: 'subscribed',
    language: 'en',
  },

  // Behavior
  syncUnmappedAsCustom: false,  // Don't auto-sync unmapped fields
  excludeFields: ['traits.internal_notes', 'traits.debug_flag'],
});

// ─── Validate the mapping against destination schema ─────────────────

const validation = await trpc.sync.fieldMappings.validate.mutate({
  mappingId: fieldMapping.id,
});

if (validation.valid) {
  console.log('Field mapping is valid ✓');
} else {
  console.error('Mapping errors:', validation.errors);
  // e.g., "Required destination field 'email_address' has no source mapping"
}

// ─── Preview mapping with sample data ────────────────────────────────

const preview = await trpc.sync.fieldMappings.preview.query({
  mappingId: fieldMapping.id,
  sampleProfileIds: ['profile_001', 'profile_002', 'profile_003'],
});

for (const sample of preview.samples) {
  console.log(`Profile ${sample.sourceId}:`);
  console.log('  Input:', sample.sourceData);
  console.log('  Output:', sample.transformedData);
  console.log('  Warnings:', sample.warnings);
}
```

### 3. Running a Sync Job

Executing an incremental sync and monitoring its progress.

```typescript
import { SyncOrchestrator } from '@mcv/cdp/sync';

// ─── Create and run an incremental sync job ──────────────────────────

const job = await trpc.sync.jobs.create.mutate({
  ventureId: 'venture_abc123',
  destinationId: destination.id,
  mode: 'incremental',
  priority: 'normal',
  segmentIds: ['segment_active_customers', 'segment_high_value'],
});

console.log(`Job created: ${job.id} (status: ${job.status})`);

// ─── Execute the job ─────────────────────────────────────────────────

const result = await trpc.sync.jobs.execute.mutate({
  jobId: job.id,
});

console.log(`Sync completed: ${result.status}`);
console.log(`  Total records: ${result.summary.totalRecords}`);
console.log(`  Created: ${result.summary.created}`);
console.log(`  Updated: ${result.summary.updated}`);
console.log(`  Deleted: ${result.summary.deleted}`);
console.log(`  Skipped: ${result.summary.skipped}`);
console.log(`  Failed: ${result.summary.failed}`);
console.log(`  Duration: ${result.timing.totalDurationMs}ms`);
console.log(`  Rate limit waits: ${result.timing.rateLimitWaitMs}ms`);

if (result.errors.length > 0) {
  console.log(`\n  Errors (first 5):`);
  for (const error of result.errors.slice(0, 5)) {
    console.log(`    ${error.sourceId}: [${error.errorCode}] ${error.message}`);
  }
}

if (result.resolvedConflicts.length > 0) {
  console.log(`\n  Conflicts resolved: ${result.resolvedConflicts.length}`);
  for (const conflict of result.resolvedConflicts.slice(0, 3)) {
    console.log(`    ${conflict.sourceId}.${conflict.field}:`);
    console.log(`      CDP: ${conflict.cdpValue} → Dest: ${conflict.destinationValue}`);
    console.log(`      Resolved: ${conflict.resolvedValue} (${conflict.strategy})`);
  }
}

// ─── Poll job progress (for long-running syncs) ─────────────────────

async function monitorJob(jobId: string): Promise<void> {
  let status = await trpc.sync.jobs.getStatus.query({ jobId });

  while (status.status === 'running') {
    const progress = status.progress;
    const bar = '█'.repeat(Math.floor(progress.percentComplete / 5))
              + '░'.repeat(20 - Math.floor(progress.percentComplete / 5));

    process.stdout.write(
      `\r  [${bar}] ${progress.percentComplete.toFixed(1)}% ` +
      `(${progress.processedRecords}/${progress.totalRecords ?? '?'}) ` +
      `${progress.throughput.toFixed(0)} rec/s ` +
      `ETA: ${progress.estimatedSecondsRemaining ?? '?'}s ` +
      `Phase: ${progress.phase}`
    );

    await new Promise(resolve => setTimeout(resolve, 2000));
    status = await trpc.sync.jobs.getStatus.query({ jobId });
  }

  console.log(`\n  Final status: ${status.status}`);
}

await monitorJob(job.id);

// ─── Run a dry run first (recommended) ──────────────────────────────

const dryRun = await trpc.sync.jobs.dryRun.mutate({
  ventureId: 'venture_abc123',
  destinationId: destination.id,
  mode: 'incremental',
  segmentIds: ['segment_active_customers'],
});

console.log(`Dry run results:`);
console.log(`  Would create: ${dryRun.recordsToCreate}`);
console.log(`  Would update: ${dryRun.recordsToUpdate}`);
console.log(`  Would delete: ${dryRun.recordsToDelete}`);
console.log(`  Estimated duration: ${dryRun.estimatedDuration}s`);
console.log(`  Potential conflicts: ${dryRun.potentialConflicts.length}`);
console.log(`  Rate limit estimate: ${dryRun.rateLimitEstimate.estimatedApiCalls} API calls`);
```

### 4. Handling Errors and the Dead Letter Queue

Managing sync failures, retries, and the dead letter queue.

```typescript
import { SyncErrorHandler, DeadLetterQueue } from '@mcv/cdp/sync';

// ─── View recent sync errors ─────────────────────────────────────────

const errors = await trpc.sync.errors.list.query({
  ventureId: 'venture_abc123',
  destinationId: destination.id,
  limit: 20,
  orderBy: 'occurred_at',
  orderDir: 'desc',
});

for (const error of errors.items) {
  console.log(`[${error.errorCode}] ${error.sourceId}: ${error.errorMessage}`);
  console.log(`  Retryable: ${error.isRetryable}, Attempts: ${error.retryCount}/${error.maxRetries}`);
  if (error.httpStatus) {
    console.log(`  HTTP ${error.httpStatus}`);
  }
}

// ─── View error distribution ─────────────────────────────────────────

const errorStats = await trpc.sync.errors.stats.query({
  ventureId: 'venture_abc123',
  destinationId: destination.id,
  since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
});

console.log('Error distribution (last 7 days):');
for (const [code, count] of Object.entries(errorStats.byCode)) {
  console.log(`  ${code}: ${count}`);
}
console.log(`Total errors: ${errorStats.total}`);
console.log(`Retryable: ${errorStats.retryable}`);
console.log(`Non-retryable: ${errorStats.nonRetryable}`);

// ─── Dead Letter Queue management ────────────────────────────────────

const dlqItems = await trpc.sync.deadLetterQueue.list.query({
  ventureId: 'venture_abc123',
  status: 'pending',
  limit: 50,
});

console.log(`Dead letter queue: ${dlqItems.total} pending items`);

for (const item of dlqItems.items) {
  console.log(`\n  Record: ${item.sourceId}`);
  console.log(`  Destination: ${item.destinationId}`);
  console.log(`  Error: [${item.errorCode}] ${item.errorMessage}`);
  console.log(`  Total attempts: ${item.totalAttempts}`);
  console.log(`  First failed: ${item.firstFailedAt}`);
  console.log(`  Last failed: ${item.lastFailedAt}`);
  console.log(`  Error history:`);
  for (const attempt of item.errorHistory) {
    console.log(`    #${attempt.attemptNumber}: [${attempt.errorCode}] ${attempt.errorMessage}`);
  }
}

// ─── Retry specific DLQ items ────────────────────────────────────────

const retryResult = await trpc.sync.deadLetterQueue.retry.mutate({
  ids: [dlqItems.items[0].id, dlqItems.items[1].id],
});

console.log(`Retry job created: ${retryResult.jobId}`);
console.log(`Records queued for retry: ${retryResult.recordCount}`);

// ─── Resolve DLQ items manually ──────────────────────────────────────

await trpc.sync.deadLetterQueue.resolve.mutate({
  ids: [dlqItems.items[2].id],
  resolution: 'skip',
  note: 'Record was deleted in source — no longer relevant',
  resolvedBy: 'user_admin_001',
});

// ─── Bulk resolve by error code ──────────────────────────────────────

const bulkResolve = await trpc.sync.deadLetterQueue.bulkResolve.mutate({
  ventureId: 'venture_abc123',
  destinationId: destination.id,
  errorCode: 'INVALID_EMAIL_FORMAT',
  resolution: 'skip',
  note: 'Bulk skip — these are clearly invalid email addresses',
  resolvedBy: 'user_admin_001',
});

console.log(`Bulk resolved ${bulkResolve.count} DLQ items`);

// ─── Configure automatic error alerting ──────────────────────────────

// Alert rules are set in the destination config (alertConfig),
// but can also be configured per error code:

await trpc.sync.alerts.configureRule.mutate({
  ventureId: 'venture_abc123',
  destinationId: destination.id,
  rule: {
    name: 'Auth failures spike',
    condition: {
      type: 'error_rate',
      errorCode: 'AUTH_FAILED',
      threshold: 1,          // Any auth failure
      windowMinutes: 5,
    },
    severity: 'critical',
    actions: [
      { type: 'pause_sync' },
      {
        type: 'notify',
        targets: [
          { type: 'email', target: 'security@venture.com' },
          { type: 'slack', target: '#cdp-critical' },
        ],
      },
    ],
    enabled: true,
  },
});
```

### 5. Real-Time Streaming Sync

Setting up real-time sync triggered by Redpanda events for low-latency activation.

```typescript
import { StreamingSyncConsumer, StreamingSyncRouter } from '@mcv/cdp/sync';

// ─── Configure a destination for real-time sync ──────────────────────

const brazeDestination = await trpc.sync.destinations.create.mutate({
  ventureId: 'venture_abc123',
  type: 'braze',
  name: 'Braze Real-Time',
  description: 'Real-time profile and event sync to Braze for push notifications',

  credentials: {
    apiKey: 'braze-api-key-xxx',
    restEndpoint: 'https://rest.iad-01.braze.com',
    appGroupId: 'app-group-xxx',
  },

  settings: {
    appId: 'braze-app-id',
    pushEnabled: true,
    trackEvents: true,
  },

  syncMode: 'realtime',

  // Real-time specific config
  schedule: null,  // No cron for real-time

  // Tighter retry for real-time (don't want stale data)
  retryConfig: {
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitter: true,
    nonRetryableCodes: ['INVALID_API_KEY'],
  },

  // Braze rate limits
  rateLimitOverrides: {
    requestsPerSecond: 250,
    requestsPerMinute: 15000,
    requestsPerHour: null,
    requestsPerDay: null,
    maxConcurrent: 10,
    maxBatchSize: 75,   // Braze /users/track accepts up to 75 per call
    backoffStrategy: {
      type: 'adaptive',
      initialMs: 100,
      maxMs: 5000,
    },
    respectResponseHeaders: true,
    safetyMarginPercent: 10,
  },

  batchSize: 75,
  syncDeletions: false,   // Braze uses attributes, not deletions
});

// ─── Set up field mappings for Braze ─────────────────────────────────

await trpc.sync.fieldMappings.create.mutate({
  ventureId: 'venture_abc123',
  destinationId: brazeDestination.id,
  sourceObject: 'profile',
  destinationObject: 'user',
  rules: [
    {
      sourceField: 'externalId',
      destinationField: 'external_id',
      transform: null,
      required: true,
      defaultValue: null,
      skipIfNull: true,
      description: 'Braze external user ID',
    },
    {
      sourceField: 'email',
      destinationField: 'email',
      transform: { type: 'lowercase' },
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: 'Email address',
    },
    {
      sourceField: 'traits.firstName',
      destinationField: 'first_name',
      transform: null,
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: null,
    },
    {
      sourceField: 'traits.subscriptionTier',
      destinationField: 'custom_attributes.subscription_tier',
      transform: null,
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: 'Custom attribute for subscription tier',
    },
    {
      sourceField: 'traits.lifetimeValue',
      destinationField: 'custom_attributes.ltv',
      transform: { type: 'numberFormat', decimals: 2 },
      required: false,
      defaultValue: 0,
      skipIfNull: false,
      description: 'Lifetime value as custom attribute',
    },
  ],
  defaults: {},
  syncUnmappedAsCustom: true,
  excludeFields: ['traits.internal_notes'],
});

// ─── Streaming consumer setup (internal — handled by the module) ─────

// The streaming consumer is started by the SyncOrchestrator when a
// destination is configured for real-time mode. Here's how it works
// internally:

const consumer = new StreamingSyncConsumer({
  ventureId: 'venture_abc123',
  destinationId: brazeDestination.id,
  topics: [
    'cdp.profile.updated',    // Profile attribute changes
    'cdp.segment.entered',    // New segment memberships
    'cdp.segment.exited',     // Segment exits
    'cdp.event.tracked',      // Raw events (if destination supports)
  ],
  consumerGroup: `sync-realtime-${brazeDestination.id}`,
  redpandaBrokers: process.env.REDPANDA_BROKERS!.split(','),
});

// The consumer uses micro-batching: collects events for up to 10 seconds
// or 75 records (Braze batch size), whichever comes first, then flushes.

consumer.on('batch_flushed', (result) => {
  console.log(`Flushed ${result.recordCount} records to Braze`);
  console.log(`  Success: ${result.successCount}, Failed: ${result.failureCount}`);
  console.log(`  Latency: ${result.latencyMs}ms`);
});

consumer.on('rate_limited', (info) => {
  console.warn(`Rate limited by Braze. Backing off ${info.backoffMs}ms`);
});

consumer.on('error', (error) => {
  console.error(`Streaming sync error: ${error.message}`);
});

await consumer.start();

// ─── Monitor streaming sync health ──────────────────────────────────

const streamingHealth = await trpc.sync.streaming.getHealth.query({
  ventureId: 'venture_abc123',
  destinationId: brazeDestination.id,
});

console.log('Streaming sync health:');
console.log(`  Status: ${streamingHealth.status}`);  // 'healthy', 'degraded', 'down'
console.log(`  Consumer lag: ${streamingHealth.consumerLag} messages`);
console.log(`  Throughput: ${streamingHealth.throughputPerSecond} rec/s`);
console.log(`  Avg latency: ${streamingHealth.avgLatencyMs}ms`);
console.log(`  Error rate: ${streamingHealth.errorRatePercent}%`);
console.log(`  Last flush: ${streamingHealth.lastFlushAt}`);
console.log(`  Buffer size: ${streamingHealth.bufferSize} records`);
```

### 6. Sync All Destinations (Full Reconciliation)

Running a full sync across all destinations for a venture, useful for initial setup or periodic reconciliation.

```typescript
// ─── Full sync across all destinations ───────────────────────────────

const jobs = await trpc.sync.orchestrator.syncAll.mutate({
  ventureId: 'venture_abc123',
  mode: 'full',
  priority: 'normal',
  excludeDestinations: ['dest_legacy_crm'],  // Skip specific destinations
});

console.log(`Created ${jobs.length} sync jobs:`);
for (const job of jobs) {
  console.log(`  ${job.destinationName}: ${job.id} (${job.status})`);
}

// ─── Monitor all jobs ────────────────────────────────────────────────

async function monitorAllJobs(jobIds: string[]): Promise<void> {
  let allDone = false;

  while (!allDone) {
    const statuses = await Promise.all(
      jobIds.map(id => trpc.sync.jobs.getStatus.query({ jobId: id }))
    );

    allDone = statuses.every(s =>
      ['completed', 'failed', 'cancelled'].includes(s.status)
    );

    console.clear();
    console.log('Sync Status Dashboard');
    console.log('═'.repeat(80));

    for (const status of statuses) {
      const icon = status.status === 'completed' ? '✅'
                 : status.status === 'failed' ? '❌'
                 : status.status === 'running' ? '🔄'
                 : '⏳';

      const progress = status.progress;
      const pct = progress.percentComplete.toFixed(0).padStart(3);

      console.log(
        `${icon} ${status.destinationName.padEnd(25)} ` +
        `${pct}% | ${progress.successCount}✓ ${progress.failureCount}✗ ` +
        `${progress.skippedCount}↷ | ${progress.throughput.toFixed(0)} rec/s`
      );
    }

    if (!allDone) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

await monitorAllJobs(jobs.map(j => j.id));

// ─── View consolidated sync history ─────────────────────────────────

const history = await trpc.sync.history.list.query({
  ventureId: 'venture_abc123',
  limit: 10,
  orderBy: 'completed_at',
  orderDir: 'desc',
});

console.log('\nRecent sync history:');
for (const entry of history.items) {
  const successRate = ((entry.recordsCreated + entry.recordsUpdated) / entry.totalRecords * 100).toFixed(1);
  console.log(
    `  ${entry.completedAt.toISOString()} | ${entry.destinationName.padEnd(20)} | ` +
    `${entry.status.padEnd(9)} | ${entry.totalRecords} records | ` +
    `${successRate}% success | ${entry.durationMs}ms`
  );
}
```

### 7. Google Ads Customer Match Sync

Specialized example for syncing hashed audience data to Google Ads.

```typescript
// ─── Configure Google Ads destination ────────────────────────────────

const googleAds = await trpc.sync.destinations.create.mutate({
  ventureId: 'venture_abc123',
  type: 'google_ads',
  name: 'Google Ads Customer Match',

  credentials: {
    clientId: 'google-client-id',
    clientSecret: 'google-client-secret',
    refreshToken: 'google-refresh-token',
    developerToken: 'google-dev-token',
    loginCustomerId: '1234567890',
    customerId: '0987654321',
  },

  settings: {
    userListId: '123456789',
    userListName: 'CDP High Value Customers',
    membershipLifeSpanDays: 30,
    uploadKeyType: 'CONTACT_INFO',
  },

  syncMode: 'incremental',
  schedule: {
    cronExpression: '0 6 * * *',   // Daily at 6 AM
    timezone: 'America/Toronto',
    skipIfRunning: true,
    timeoutMinutes: 60,
  },

  batchSize: 1000,   // Google Ads allows up to 100k per operation
  conflictStrategy: 'cdp_wins',
});

// ─── Google Ads requires SHA256-hashed PII ───────────────────────────

await trpc.sync.fieldMappings.create.mutate({
  ventureId: 'venture_abc123',
  destinationId: googleAds.id,
  sourceObject: 'profile',
  destinationObject: 'user_data',
  rules: [
    {
      sourceField: 'email',
      destinationField: 'hashed_email',
      transform: {
        type: 'hash',
        algorithm: 'sha256',
      },
      required: true,
      defaultValue: null,
      skipIfNull: true,
      description: 'SHA256 hashed email (Google requirement)',
    },
    {
      sourceField: 'phone',
      destinationField: 'hashed_phone_number',
      transform: {
        type: 'hash',
        algorithm: 'sha256',
      },
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: 'SHA256 hashed phone for enhanced matching',
    },
    {
      sourceField: 'traits.firstName',
      destinationField: 'hashed_first_name',
      transform: {
        type: 'hash',
        algorithm: 'sha256',
      },
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: 'SHA256 hashed first name',
    },
    {
      sourceField: 'traits.lastName',
      destinationField: 'hashed_last_name',
      transform: {
        type: 'hash',
        algorithm: 'sha256',
      },
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: 'SHA256 hashed last name',
    },
    {
      sourceField: 'traits.postalCode',
      destinationField: 'address_info.postal_code',
      transform: null,
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: 'Postal code (not hashed)',
    },
    {
      sourceField: 'traits.country',
      destinationField: 'address_info.country_code',
      transform: { type: 'uppercase' },
      required: false,
      defaultValue: null,
      skipIfNull: false,
      description: 'ISO country code',
    },
  ],
  defaults: {},
  syncUnmappedAsCustom: false,
  excludeFields: [],
});
```

### 8. Webhook Destination (Custom Integration)

Setting up a generic webhook destination for custom platforms not natively supported.

```typescript
// ─── Configure a webhook destination ─────────────────────────────────

const webhookDest = await trpc.sync.destinations.create.mutate({
  ventureId: 'venture_abc123',
  type: 'webhook',
  name: 'Custom Data Warehouse Sync',
  description: 'Push audience data to internal data warehouse via webhook',

  credentials: {
    webhookUrl: 'https://internal-api.company.com/cdp/ingest',
    authType: 'bearer',
    authToken: 'internal-api-token-xxx',
  },

  settings: {
    httpMethod: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Source': 'mcv-cdp',
    },
    payloadFormat: 'json_array',     // Send records as JSON array
    includeMetadata: true,            // Include sync metadata in payload
    maxPayloadSizeBytes: 5242880,     // 5MB max per request
    responseSuccessCodes: [200, 201, 202],
    timeoutMs: 30000,
  },

  syncMode: 'incremental',
  schedule: {
    cronExpression: '*/30 * * * *',  // Every 30 minutes
    timezone: 'UTC',
    skipIfRunning: true,
    timeoutMinutes: 15,
  },

  batchSize: 1000,
  rateLimitOverrides: {
    requestsPerSecond: 10,
    requestsPerMinute: 100,
    requestsPerHour: null,
    requestsPerDay: null,
    maxConcurrent: 3,
    maxBatchSize: 1000,
    backoffStrategy: { type: 'exponential', baseMs: 1000, maxMs: 60000, multiplier: 2 },
    respectResponseHeaders: true,
    safetyMarginPercent: 20,
  },
});

// Webhook field mapping — pass through most fields with minimal transform
await trpc.sync.fieldMappings.create.mutate({
  ventureId: 'venture_abc123',
  destinationId: webhookDest.id,
  sourceObject: 'profile',
  destinationObject: 'record',
  rules: [
    {
      sourceField: 'id',
      destinationField: 'cdp_profile_id',
      transform: null,
      required: true,
      defaultValue: null,
      skipIfNull: true,
      description: 'CDP profile ID as primary key',
    },
    {
      sourceField: 'email',
      destinationField: 'email',
      transform: { type: 'lowercase' },
      required: true,
      defaultValue: null,
      skipIfNull: true,
      description: null,
    },
  ],
  defaults: {},
  syncUnmappedAsCustom: true,   // Forward all traits as-is
  excludeFields: ['traits.internal_notes'],
});
```

---

## Error Codes

| Code | Description | Retryable | Resolution |
|------|-------------|-----------|------------|
| `SYNC_AUTH_FAILED` | Destination API authentication failed. Credentials may be expired or revoked. | No | Re-authenticate the destination, refresh OAuth tokens, or update API keys. |
| `SYNC_RATE_LIMITED` | Destination API rate limit exceeded. The sync is being throttled. | Yes | Automatic backoff. If persistent, reduce batch size or sync frequency. |
| `SYNC_DESTINATION_UNREACHABLE` | Cannot connect to destination API. Network error or service outage. | Yes | Check destination service status. Automatic retry with backoff. |
| `SYNC_INVALID_PAYLOAD` | Destination rejected the payload due to validation errors (invalid email format, missing required fields, etc.). | No | Fix field mappings or source data. Check DLQ for specific record details. |
| `SYNC_DESTINATION_NOT_FOUND` | The target resource in the destination doesn't exist (e.g., deleted audience, removed list). | No | Verify destination settings. The target audience/list/object may have been deleted. |
| `SYNC_FIELD_MAPPING_INVALID` | Field mapping references a source field that doesn't exist or a destination field that's unavailable. | No | Update field mappings. Run `fieldMappings.validate` to identify issues. |
| `SYNC_CONFLICT_UNRESOLVED` | A data conflict was detected and the resolution strategy is set to `manual`, requiring human review. | No | Review conflicts in the manual review queue and resolve them. |
| `SYNC_TRANSFORM_FAILED` | A field transform failed (e.g., date parsing error, regex error, custom function threw). | No | Fix the transform configuration. Check the specific record and field in error details. |
| `SYNC_QUOTA_EXCEEDED` | Destination account quota exceeded (e.g., Mailchimp subscriber limit, Braze data point limit). | No | Upgrade the destination account plan or reduce the number of records being synced. |
| `SYNC_TIMEOUT` | Sync job exceeded its configured timeout. May indicate too much data or slow destination API. | Yes | Increase timeout, reduce batch scope, or split into multiple jobs. |
| `SYNC_CURSOR_INVALID` | Incremental sync cursor is invalid or corrupted. Cannot resume from last position. | No | Reset the sync cursor and run a full sync to re-establish baseline. |
| `SYNC_DUPLICATE_RECORD` | Destination reported a duplicate record conflict that couldn't be auto-resolved. | Yes | Check identifier field mappings. May need to merge duplicates in the destination. |
| `SYNC_PERMISSION_DENIED` | API credentials lack necessary permissions for the requested operation. | No | Update destination API credentials with required scopes/permissions. |
| `SYNC_SCHEMA_MISMATCH` | Destination schema has changed since field mappings were configured. New required fields or removed fields. | No | Refresh destination schema and update field mappings accordingly. |
| `SYNC_ENCRYPTION_ERROR` | Failed to decrypt destination credentials. Key version mismatch or corruption. | No | Re-encrypt credentials with current key. Contact platform admin if key rotation issue. |
| `SYNC_BATCH_PARTIAL_FAILURE` | A batch operation partially succeeded. Some records were accepted, others rejected. | Partial | Review per-record errors. Successfully synced records are committed; failed records enter retry. |
| `SYNC_CONSUMER_LAG` | Real-time streaming consumer lag exceeds threshold. Data activation is delayed. | Yes | Scale consumer instances or reduce event volume. Check for slow destination APIs. |
| `SYNC_DLQ_THRESHOLD` | Dead letter queue size exceeded the configured threshold. Too many unresolved failures. | No | Review and resolve DLQ items. Investigate root cause of recurring failures. |

---

## Security

### Credential Storage

All destination API credentials are **encrypted at rest** using AES-256-GCM with venture-specific encryption keys. Credentials are never stored in plaintext and are only decrypted in memory when establishing destination connections.

```typescript
// Credential lifecycle
// 1. User provides credentials via tRPC mutation
// 2. Credentials are encrypted using the venture's encryption key
// 3. Encrypted blob is stored in sync_destinations.credentials_encrypted
// 4. On sync execution, credentials are decrypted in-memory
// 5. Decrypted credentials are never logged, cached to disk, or included in error messages
// 6. Key rotation updates credentials_key_version and re-encrypts
```

### Multi-Tenant Isolation

- **Row-Level Security (RLS)**: All sync tables enforce RLS using `venture_id`. A venture can only see and manage its own destinations, jobs, mappings, and history.
- **Adapter isolation**: Each destination adapter instance is scoped to a single venture. Adapters cannot cross-access other ventures' configurations.
- **Rate limit isolation**: Rate limit state is tracked per-destination, per-venture. One venture's rate limit consumption never affects another.
- **Streaming isolation**: Redpanda consumer groups are scoped per-venture-per-destination, ensuring message isolation.

### Data Handling

- **PII in transit**: All API calls to destinations use HTTPS/TLS 1.2+. No PII is transmitted over unencrypted channels.
- **PII in logs**: Error logs and sync history **never** include raw PII values. Profile IDs and destination IDs are logged, but actual field values (emails, names, etc.) are redacted.
- **Hash transforms**: For destinations requiring hashed identifiers (Google Ads, Facebook Ads), hashing is performed before data leaves the sync module. Raw PII never reaches these destinations.
- **Dead letter queue**: Failed payloads stored in the DLQ are encrypted. Access to DLQ data requires elevated permissions.
- **GDPR compliance**: The `syncDeletions` flag ensures that when a profile is deleted or exits a segment, the corresponding record is removed from the destination. Deletion requests are tracked in sync history.

### Access Control

```typescript
// tRPC middleware enforces these permission checks:
// - sync.destinations.create    → requires 'cdp:destinations:write'
// - sync.destinations.delete    → requires 'cdp:destinations:admin'
// - sync.jobs.execute           → requires 'cdp:sync:execute'
// - sync.fieldMappings.create   → requires 'cdp:destinations:write'
// - sync.deadLetterQueue.retry  → requires 'cdp:sync:execute'
// - sync.history.list           → requires 'cdp:sync:read'
// - sync.errors.list            → requires 'cdp:sync:read'
```

---

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `REDPANDA_BROKERS` | Comma-separated Redpanda broker addresses for real-time sync consumers. | Yes (for realtime mode) | — |
| `REDPANDA_SASL_USERNAME` | SASL username for Redpanda authentication. | Yes (if SASL enabled) | — |
| `REDPANDA_SASL_PASSWORD` | SASL password for Redpanda authentication. | Yes (if SASL enabled) | — |
| `SYNC_ENCRYPTION_KEY` | Base64-encoded AES-256 key for encrypting destination credentials. | Yes | — |
| `SYNC_ENCRYPTION_KEY_VERSION` | Current key version number for key rotation tracking. | No | `1` |
| `SYNC_MAX_CONCURRENT_JOBS` | Maximum number of sync jobs that can run concurrently per venture. | No | `5` |
| `SYNC_GLOBAL_MAX_CONCURRENT` | Maximum number of sync jobs running across all ventures. | No | `50` |
| `SYNC_DEFAULT_TIMEOUT_MINUTES` | Default timeout for sync jobs if not configured per-destination. | No | `60` |
| `SYNC_DLQ_THRESHOLD` | Number of pending DLQ items that triggers an alert. | No | `100` |
| `SYNC_STREAMING_BUFFER_SIZE` | Maximum records to buffer before flushing in real-time mode. | No | `100` |
| `SYNC_STREAMING_FLUSH_INTERVAL_MS` | Maximum time to buffer records before flushing in real-time mode. | No | `10000` |
| `SYNC_HISTORY_RETENTION_DAYS` | Number of days to retain detailed sync history before archiving. | No | `90` |
| `SYNC_ERROR_RETENTION_DAYS` | Number of days to retain individual error records. | No | `30` |
| `SYNC_METRICS_ENABLED` | Enable sync metrics collection (Prometheus format). | No | `true` |
| `SYNC_ALERT_WEBHOOK_URL` | Webhook URL for sync alert notifications. | No | — |
| `SUPABASE_URL` | Supabase project URL. | Yes | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for RLS bypass in background jobs. | Yes | — |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/cdp/profiles` | Source data — unified customer profiles and traits |
| `@mcv/cdp/segments` | Source data — audience segments that trigger syncs |
| `@mcv/cdp/events` | Source data — tracked events for real-time activation |
| `@mcv/cdp/identity` | Identity resolution — mapping profile IDs to destination identifiers |
| `@mcv/shared/db` | Drizzle ORM instance, connection pooling, migration utilities |
| `@mcv/shared/auth` | Permission checks, venture scoping, RLS context |
| `@mcv/shared/crypto` | AES-256-GCM encryption/decryption for credentials |
| `@mcv/shared/queue` | Job queue primitives, priority scheduling |
| `@mcv/shared/logging` | Structured logging with PII redaction |
| `@mcv/shared/monitoring` | Metrics collection, health check registration |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `kafkajs` | `^2.2.4` | Redpanda/Kafka consumer for real-time streaming |
| `drizzle-orm` | `^0.30.x` | Database ORM for sync state management |
| `zod` | `^3.22.x` | Runtime validation of configs, payloads, API responses |
| `@trpc/server` | `^10.45.x` | tRPC router for sync management API |
| `cron-parser` | `^4.9.x` | Parse and evaluate cron expressions for scheduling |
| `p-queue` | `^7.4.x` | Concurrency-limited job queue |
| `p-retry` | `^6.2.x` | Retry logic with configurable backoff |
| `bottleneck` | `^2.19.x` | Rate limiting and scheduling |
| `node-cron` | `^3.0.x` | Cron-based job scheduling |
| `ioredis` | `^5.3.x` | Redis client for distributed rate limit state (optional) |

### Destination SDK Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mailchimp/mailchimp_marketing` | `^3.0.x` | Mailchimp Marketing API client |
| `@hubspot/api-client` | `^11.x` | HubSpot API client |
| `google-ads-api` | `^14.x` | Google Ads API client |
| `facebook-nodejs-business-sdk` | `^19.x` | Facebook Marketing API client |
| `jsforce` | `^3.x` | Salesforce API client |

> **Note:** Destination SDK packages are loaded dynamically. Only adapters that are actually configured for a venture are initialized, keeping the runtime footprint minimal.

---

## Testing

### Unit Tests

```typescript
// tests/unit/field-mapper.test.ts
describe('FieldMapper', () => {
  it('should map simple fields directly', () => {
    const mapper = new FieldMapper(mappingRules);
    const result = mapper.map(sourceProfile);
    expect(result.email_address).toBe(sourceProfile.email);
  });

  it('should apply transforms in order', () => {
    const mapper = new FieldMapper([{
      sourceField: 'email',
      destinationField: 'hashed_email',
      transform: { type: 'hash', algorithm: 'sha256' },
      required: true,
      defaultValue: null,
      skipIfNull: true,
    }]);
    const result = mapper.map({ email: 'Test@Example.COM' });
    // Should lowercase then hash
    expect(result.hashed_email).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should use default values for missing fields', () => {
    const mapper = new FieldMapper([{
      sourceField: 'traits.missing_field',
      destinationField: 'some_field',
      transform: null,
      required: false,
      defaultValue: 'default_value',
      skipIfNull: false,
    }]);
    const result = mapper.map({ traits: {} });
    expect(result.some_field).toBe('default_value');
  });

  it('should throw on missing required fields with skipIfNull', () => {
    const mapper = new FieldMapper([{
      sourceField: 'email',
      destinationField: 'email_address',
      transform: null,
      required: true,
      defaultValue: null,
      skipIfNull: true,
    }]);
    expect(() => mapper.map({ email: null })).toThrow('SYNC_FIELD_MAPPING_INVALID');
  });

  it('should handle nested source fields with dot notation', () => {
    const mapper = new FieldMapper([{
      sourceField: 'traits.company.name',
      destinationField: 'company_name',
      transform: null,
      required: false,
      defaultValue: null,
      skipIfNull: false,
    }]);
    const result = mapper.map({ traits: { company: { name: 'Acme Corp' } } });
    expect(result.company_name).toBe('Acme Corp');
  });
});

// tests/unit/rate-limiter.test.ts
describe('RateLimiter', () => {
  it('should allow requests within limit', async () => {
    const limiter = new RateLimiter({ requestsPerSecond: 10 });
    for (let i = 0; i < 10; i++) {
      expect(await limiter.tryAcquire()).toBe(true);
    }
  });

  it('should block requests over limit', async () => {
    const limiter = new RateLimiter({ requestsPerSecond: 2 });
    await limiter.tryAcquire();
    await limiter.tryAcquire();
    expect(await limiter.tryAcquire()).toBe(false);
  });

  it('should apply exponential backoff on rate limit responses', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 100,
      backoffStrategy: { type: 'exponential', baseMs: 100, maxMs: 5000, multiplier: 2 },
    });
    limiter.onRateLimitResponse(429);
    expect(limiter.getBackoffMs()).toBe(100);
    limiter.onRateLimitResponse(429);
    expect(limiter.getBackoffMs()).toBe(200);
    limiter.onRateLimitResponse(429);
    expect(limiter.getBackoffMs()).toBe(400);
  });
});

// tests/unit/conflict-resolver.test.ts
describe('ConflictResolver', () => {
  it('should resolve with CDP value when strategy is cdp_wins', async () => {
    const resolver = new ConflictResolver();
    const conflict = createConflict({ cdpValue: 'new', destinationValue: 'old' });
    const result = await resolver.resolveConflicts([conflict], 'cdp_wins');
    expect(result[0].resolvedValue).toBe('new');
  });

  it('should resolve with destination value when strategy is destination_wins', async () => {
    const resolver = new ConflictResolver();
    const conflict = createConflict({ cdpValue: 'new', destinationValue: 'old' });
    const result = await resolver.resolveConflicts([conflict], 'destination_wins');
    expect(result[0].resolvedValue).toBe('old');
  });

  it('should use most recent value when strategy is most_recent_wins', async () => {
    const resolver = new ConflictResolver();
    const conflict = createConflict({
      cdpValue: 'cdp_val',
      cdpModifiedAt: new Date('2025-01-15'),
      destinationValue: 'dest_val',
      destinationModifiedAt: new Date('2025-01-20'),
    });
    const result = await resolver.resolveConflicts([conflict], 'most_recent_wins');
    expect(result[0].resolvedValue).toBe('dest_val');
  });
});
```

### Integration Tests

```typescript
// tests/integration/mailchimp-adapter.test.ts
describe('MailchimpAdapter (integration)', () => {
  let adapter: MailchimpAdapter;

  beforeAll(async () => {
    adapter = new MailchimpAdapter();
    await adapter.initialize({
      id: 'test-dest',
      ventureId: 'test-venture',
      type: 'mailchimp',
      name: 'Test',
      credentials: testCredentials,
      settings: { audienceId: testAudienceId },
      rateLimits: null,
      enabled: true,
    });
  });

  afterAll(async () => {
    await adapter.dispose();
  });

  it('should successfully test connection', async () => {
    const result = await adapter.testConnection();
    expect(result.success).toBe(true);
    expect(result.details.authValid).toBe(true);
    expect(result.details.apiReachable).toBe(true);
  });

  it('should fetch destination schema', async () => {
    const schema = await adapter.getSchema();
    expect(schema.requiredFields).toContain('email_address');
    expect(schema.availableFields.length).toBeGreaterThan(0);
  });

  it('should push a batch of records', async () => {
    const batch: SyncBatchPayload = {
      destinationObject: 'subscriber',
      operation: 'upsert',
      records: [
        {
          sourceId: 'profile_test_001',
          fields: {
            email_address: 'test@example.com',
            merge_fields: { FNAME: 'Test', LNAME: 'User' },
            status: 'subscribed',
          },
          lastModifiedAt: new Date(),
        },
      ],
    };

    const result = await adapter.pushBatch(batch);
    expect(result.successCount).toBe(1);
    expect(result.results[0].success).toBe(true);
  });

  it('should handle invalid email gracefully', async () => {
    const batch: SyncBatchPayload = {
      destinationObject: 'subscriber',
      operation: 'upsert',
      records: [
        {
          sourceId: 'profile_bad_email',
          fields: {
            email_address: 'not-an-email',
            status: 'subscribed',
          },
          lastModifiedAt: new Date(),
        },
      ],
    };

    const result = await adapter.pushBatch(batch);
    expect(result.failureCount).toBe(1);
    expect(result.results[0].error?.code).toBe('SYNC_INVALID_PAYLOAD');
  });
});

// tests/integration/sync-orchestrator.test.ts
describe('SyncOrchestrator (integration)', () => {
  it('should run a full incremental sync end-to-end', async () => {
    // This test requires:
    // - A test venture with profiles
    // - A configured test destination (use webhook to a mock server)
    // - Field mappings

    const orchestrator = new SyncOrchestrator(db, redpanda);
    await orchestrator.initialize('test-venture');

    const job = await orchestrator.createJob({
      ventureId: 'test-venture',
      destinationId: 'test-webhook-dest',
      mode: 'incremental',
      priority: 'high',
    });

    const result = await orchestrator.executeJob(job.id);

    expect(result.status).toBe('success');
    expect(result.summary.totalRecords).toBeGreaterThan(0);
    expect(result.summary.failed).toBe(0);
    expect(result.timing.totalDurationMs).toBeGreaterThan(0);

    // Verify history was recorded
    const history = await db.query.syncHistory.findFirst({
      where: eq(syncHistory.jobId, job.id),
    });
    expect(history).toBeDefined();
    expect(history?.status).toBe('success');
  });
});
```

### Test Utilities

```typescript
// tests/utils/mock-destination.ts
import { DestinationAdapter } from '@mcv/cdp/sync';

/**
 * MockDestinationAdapter for testing sync pipelines without
 * hitting real external APIs.
 */
export class MockDestinationAdapter implements DestinationAdapter {
  readonly type = 'webhook' as const;
  readonly displayName = 'Mock Destination';
  readonly supportedModes: SyncMode[] = ['full', 'incremental', 'realtime'];
  readonly maxBatchSize = 1000;
  readonly defaultRateLimits: RateLimitConfig = {
    requestsPerSecond: 100,
    requestsPerMinute: 6000,
    requestsPerHour: 360000,
    requestsPerDay: null,
    maxConcurrent: 10,
    maxBatchSize: 1000,
    backoffStrategy: { type: 'fixed', delayMs: 100 },
    respectResponseHeaders: false,
    safetyMarginPercent: 0,
  };

  public pushedBatches: SyncBatchPayload[] = [];
  public deletedIdentifiers: DestinationIdentifier[] = [];
  public shouldFailNext = false;
  public failureError: string = 'Mock failure';

  async initialize(_config: DestinationConfig): Promise<void> {
    // No-op for mock
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return {
      success: true,
      latencyMs: 1,
      details: {
        authValid: true,
        apiReachable: true,
        permissionsSufficient: true,
        apiVersion: 'mock-v1',
        accountName: 'Mock Account',
      },
    };
  }

  async getSchema(): Promise<DestinationSchema> {
    return {
      objects: [{ id: 'record', name: 'Record', description: 'Mock record',
        supportsCreate: true, supportsUpdate: true, supportsDelete: true,
        identifierFields: ['id'] }],
      requiredFields: ['email'],
      availableFields: [
        { id: 'email', name: 'email', type: 'email', required: true, readOnly: false },
        { id: 'name', name: 'name', type: 'string', required: false, readOnly: false },
      ],
      supportsCustomFields: true,
      maxCustomFields: null,
    };
  }

  async pushBatch(batch: SyncBatchPayload): Promise<BatchPushResult> {
    this.pushedBatches.push(batch);

    if (this.shouldFailNext) {
      this.shouldFailNext = false;
      return {
        totalProcessed: batch.records.length,
        successCount: 0,
        failureCount: batch.records.length,
        results: batch.records.map(r => ({
          sourceId: r.sourceId,
          destinationId: null,
          success: false,
          operation: 'skipped' as const,
          error: { code: 'MOCK_ERROR', message: this.failureError, retryable: true },
        })),
        rateLimitRemaining: 1000,
        rateLimitResetAt: null,
      };
    }

    return {
      totalProcessed: batch.records.length,
      successCount: batch.records.length,
      failureCount: 0,
      results: batch.records.map(r => ({
        sourceId: r.sourceId,
        destinationId: `mock-${r.sourceId}`,
        success: true,
        operation: 'created' as const,
      })),
      rateLimitRemaining: 1000,
      rateLimitResetAt: null,
    };
  }

  async deleteBatch(identifiers: DestinationIdentifier[]): Promise<BatchDeleteResult> {
    this.deletedIdentifiers.push(...identifiers);
    return { totalProcessed: identifiers.length, successCount: identifiers.length, failureCount: 0, results: [] };
  }

  async fetchRecords(_identifiers: DestinationIdentifier[]): Promise<DestinationRecord[]> {
    return [];
  }

  async getRateLimitStatus(): Promise<RateLimitStatus> {
    return { remaining: 1000, limit: 1000, resetsAt: new Date(), isLimited: false, utilizationPercent: 0 };
  }

  async handleWebhook(_payload: unknown): Promise<WebhookHandlerResult> {
    return { processed: true, actions: [] };
  }

  async dispose(): Promise<void> {
    // No-op
  }
}
```

### Load & Performance Testing

```typescript
// tests/performance/sync-throughput.test.ts
describe('Sync throughput', () => {
  it('should handle 10,000 records in under 60 seconds (webhook)', async () => {
    const mockDest = new MockDestinationAdapter();
    const orchestrator = createTestOrchestrator(mockDest);

    const profiles = generateTestProfiles(10_000);
    await insertTestProfiles(profiles);

    const start = Date.now();
    const job = await orchestrator.createJob({
      ventureId: 'perf-test',
      destinationId: 'mock-dest',
      mode: 'full',
      priority: 'high',
    });
    const result = await orchestrator.executeJob(job.id);
    const elapsed = Date.now() - start;

    expect(result.status).toBe('success');
    expect(result.summary.totalRecords).toBe(10_000);
    expect(result.summary.failed).toBe(0);
    expect(elapsed).toBeLessThan(60_000);

    console.log(`Throughput: ${(10_000 / (elapsed / 1000)).toFixed(0)} records/sec`);
  });

  it('should respect rate limits without exceeding them', async () => {
    const mockDest = new MockDestinationAdapter();
    const rateLimiter = new RateLimiter({
      requestsPerSecond: 5,
      requestsPerMinute: 300,
      requestsPerHour: 18000,
      requestsPerDay: null,
      maxConcurrent: 2,
      maxBatchSize: 100,
      backoffStrategy: { type: 'fixed', delayMs: 200 },
      respectResponseHeaders: false,
      safetyMarginPercent: 0,
    });

    const requestTimestamps: number[] = [];
    const originalPush = mockDest.pushBatch.bind(mockDest);
    mockDest.pushBatch = async (batch: SyncBatchPayload) => {
      requestTimestamps.push(Date.now());
      return originalPush(batch);
    };

    // Run sync with rate limiter
    // ... (verify no more than 5 requests in any 1-second window)

    for (let i = 1; i < requestTimestamps.length; i++) {
      const windowStart = requestTimestamps[i] - 1000;
      const requestsInWindow = requestTimestamps.filter(t => t >= windowStart && t <= requestTimestamps[i]).length;
      expect(requestsInWindow).toBeLessThanOrEqual(5);
    }
  });
});
```

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| [`@mcv/cdp/profiles`](../profiles/MODULE.md) | Source — provides unified customer profiles for sync |
| [`@mcv/cdp/segments`](../segments/MODULE.md) | Source — segment membership changes trigger syncs |
| [`@mcv/cdp/events`](../events/MODULE.md) | Source — tracked events for real-time activation |
| [`@mcv/cdp/identity`](../identity/MODULE.md) | Identity resolution for mapping profiles to destination IDs |
| [`@mcv/shared/db`](../../../../tier-1-foundations/shared/db/MODULE.md) | Database infrastructure and migrations |
| [`@mcv/shared/auth`](../../../../tier-1-foundations/shared/auth/MODULE.md) | Permission enforcement and venture scoping |

---

## Changelog

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | 2025-01-15 | Initial sync module with Mailchimp and webhook adapters |
| 0.2.0 | 2025-02-01 | Added HubSpot, Google Ads, Facebook Ads adapters |
| 0.3.0 | 2025-02-15 | Real-time streaming sync via Redpanda |
| 0.4.0 | 2025-03-01 | Conflict resolution engine, dead letter queue |
| 0.5.0 | 2025-03-15 | Salesforce, Braze, Iterable adapters |
| 0.6.0 | 2025-04-01 | Sync history, audit trail, alerting system |
| 1.0.0 | 2025-05-01 | Production release — full sync, incremental, real-time |