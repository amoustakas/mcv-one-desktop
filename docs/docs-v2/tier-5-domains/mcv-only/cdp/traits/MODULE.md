# @mcv/cdp/traits

> **Tier 5 — MCV-Only Domain Module**
> Computed user traits derived from CDP event streams.

| Field | Value |
|---|---|
| **Package** | `@mcv/cdp/traits` |
| **Tier** | 5 (Domain) |
| **Availability** | MCV-Only |
| **Since** | 0.11.0 |
| **Status** | Stable |
| **Owner** | CDP Team |
| **Depends on** | `@mcv/cdp/events`, `@mcv/cdp/profiles`, `@mcv/kernel`, `@mcv/db`, `@mcv/bus` |
| **Consumers** | `@mcv/cdp/segments`, `@mcv/cdp/audiences`, `@mcv/cdp/journeys`, `@mcv/analytics` |

---

## Purpose

Traits are the bridge between raw behavioral events and actionable user understanding. While the CDP event stream captures every click, purchase, page view, and interaction a user performs, traits distill that firehose of data into computed properties that describe *who the user is* rather than *what the user did*. A trait like `total_spend_30d` takes thousands of individual purchase events and collapses them into a single, queryable number attached to a user profile. A trait like `churn_risk_score` synthesizes login frequency, engagement patterns, and recency of activity into a predictive signal. Traits transform event logs into intelligence.

The `@mcv/cdp/traits` module provides the full lifecycle for defining, computing, storing, and serving these computed properties. Venture operators define traits through a declarative configuration — specifying the source events, the computation rule (count, sum, min, max, most_frequent, or custom_formula), any time windows, and the expected output type. The TraitEngine then handles both real-time incremental updates (processing events as they arrive via Redpanda) and scheduled batch recomputation (for complex traits, backfills, or consistency reconciliation). Traits support dependency chains — a trait can reference other traits in its computation, forming a directed acyclic graph (DAG) that the engine resolves in topological order.

Every trait is multi-tenant by design. Global trait definitions provide a baseline (e.g., `last_seen_at`, `event_count_total`), while each venture can layer on custom traits tailored to their domain — an e-commerce venture might define `average_order_value` and `favorite_product_category`, while a SaaS venture defines `feature_adoption_score` and `days_since_last_login`. Trait values are versioned, staleness-tracked, and stored in Supabase PostgreSQL alongside the profiles they enrich. The module exposes both programmatic APIs for internal consumers (segments, journeys, audiences) and query interfaces for analytics dashboards.

---

## Exports

```typescript
// === Core Engine ===
export { TraitEngine }              from './engine/trait-engine';
export { TraitComputer }            from './engine/trait-computer';
export { TraitResolver }            from './engine/trait-resolver';
export { DependencyGraph }          from './engine/dependency-graph';
export { BatchScheduler }           from './engine/batch-scheduler';
export { IncrementalProcessor }     from './engine/incremental-processor';
export { StalenessChecker }         from './engine/staleness-checker';

// === Computation Rules ===
export { CountRule }                from './rules/count-rule';
export { SumRule }                  from './rules/sum-rule';
export { MinRule }                  from './rules/min-rule';
export { MaxRule }                  from './rules/max-rule';
export { MostFrequentRule }         from './rules/most-frequent-rule';
export { CustomFormulaRule }        from './rules/custom-formula-rule';
export { RuleRegistry }             from './rules/rule-registry';

// === Definitions & Configuration ===
export { TraitDefinitionService }   from './services/trait-definition-service';
export { TraitVersionManager }      from './services/trait-version-manager';
export { TraitValueStore }          from './services/trait-value-store';
export { VentureTraitManager }      from './services/venture-trait-manager';

// === Repositories ===
export { TraitDefinitionRepo }      from './repos/trait-definition-repo';
export { TraitValueRepo }           from './repos/trait-value-repo';
export { TraitComputationRepo }     from './repos/trait-computation-repo';
export { TraitDependencyRepo }      from './repos/trait-dependency-repo';
export { ComputationJobRepo }       from './repos/computation-job-repo';

// === Schemas (Drizzle ORM) ===
export {
  traitDefinitions,
  traitValues,
  traitComputations,
  traitDependencies,
  computationJobs,
}                                   from './schemas';

// === Types ===
export type { TraitDefinition }        from './types/trait-definition';
export type { TraitValue }             from './types/trait-value';
export type { ComputationRule }        from './types/computation-rule';
export type { ComputationRuleType }    from './types/computation-rule';
export type { TraitType }              from './types/trait-type';
export type { TraitDependencyEdge }    from './types/trait-dependency';
export type { TraitDependencyGraph }   from './types/trait-dependency';
export type { BatchJob }               from './types/batch-job';
export type { BatchJobStatus }         from './types/batch-job';
export type { TraitComputationResult } from './types/computation-result';
export type { TraitEngineConfig }      from './types/engine-config';
export type { TraitFilter }            from './types/trait-filter';
export type { TraitSnapshot }          from './types/trait-snapshot';
export type { StalenessReport }        from './types/staleness-report';
export type { TraitVersionRecord }     from './types/trait-version';

// === Errors ===
export {
  TraitError,
  TraitNotFoundError,
  TraitDefinitionConflictError,
  TraitComputationError,
  TraitDependencyCycleError,
  TraitStalenessError,
  TraitTypeError,
  TraitFormulaError,
  TraitBatchError,
  TraitVersionError,
  TraitVentureError,
  TraitTimeWindowError,
}                                   from './errors';

// === Constants ===
export {
  TRAIT_TYPES,
  COMPUTATION_RULE_TYPES,
  BATCH_JOB_STATUSES,
  DEFAULT_STALENESS_THRESHOLD_MS,
  MAX_DEPENDENCY_DEPTH,
  TRAIT_VALUE_RETENTION_DAYS,
  REDPANDA_TRAIT_TOPIC,
}                                   from './constants';

// === Plugin / Registration ===
export { traitsPlugin }             from './plugin';
export { registerTraitRoutes }      from './routes';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           @mcv/cdp/traits — Architecture                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                    │
│  │  cdp/events   │     │  Redpanda     │     │  CRON /      │                    │
│  │  (raw stream) │────▶│  Topic:       │     │  Manual      │                    │
│  │              │     │  cdp.events   │     │  Trigger     │                    │
│  └──────────────┘     └──────┬───────┘     └──────┬───────┘                    │
│                              │                     │                            │
│                    ┌─────────▼─────────┐           │                            │
│                    │  Incremental       │           │                            │
│                    │  Processor         │           │                            │
│                    │  (real-time)       │           │                            │
│                    └─────────┬─────────┘           │                            │
│                              │                     │                            │
│                    ┌─────────▼─────────────────────▼───────┐                    │
│                    │           TRAIT ENGINE                  │                    │
│                    │  ┌─────────────────────────────────┐   │                    │
│                    │  │     Dependency Graph (DAG)       │   │                    │
│                    │  │  Topological sort → exec order   │   │                    │
│                    │  └────────────────┬────────────────┘   │                    │
│                    │                   │                     │                    │
│                    │  ┌────────────────▼────────────────┐   │                    │
│                    │  │       Trait Computer             │   │                    │
│                    │  │  ┌───────┐ ┌───────┐ ┌───────┐  │   │                    │
│                    │  │  │ COUNT │ │  SUM  │ │  MIN  │  │   │                    │
│                    │  │  └───────┘ └───────┘ └───────┘  │   │                    │
│                    │  │  ┌───────┐ ┌───────┐ ┌───────┐  │   │                    │
│                    │  │  │  MAX  │ │ FREQ  │ │FORMULA│  │   │                    │
│                    │  │  └───────┘ └───────┘ └───────┘  │   │                    │
│                    │  └────────────────┬────────────────┘   │                    │
│                    │                   │                     │                    │
│                    │  ┌────────────────▼────────────────┐   │                    │
│                    │  │      Trait Resolver              │   │                    │
│                    │  │  Type coercion · Validation      │   │                    │
│                    │  │  Staleness check · Versioning    │   │                    │
│                    │  └────────────────┬────────────────┘   │                    │
│                    └───────────────────┼─────────────────────┘                    │
│                                        │                                         │
│                    ┌───────────────────▼─────────────────┐                       │
│                    │        Supabase PostgreSQL           │                       │
│                    │  ┌──────────────┐ ┌──────────────┐  │                       │
│                    │  │ trait_defns   │ │ trait_values  │  │                       │
│                    │  └──────────────┘ └──────────────┘  │                       │
│                    │  ┌──────────────┐ ┌──────────────┐  │                       │
│                    │  │ trait_deps    │ │ comp_jobs    │  │                       │
│                    │  └──────────────┘ └──────────────┘  │                       │
│                    └───────────────────┬─────────────────┘                       │
│                                        │                                         │
│                    ┌───────────────────▼─────────────────┐                       │
│                    │         Downstream Consumers         │                       │
│                    │  ┌────────────┐  ┌────────────────┐ │                       │
│                    │  │ cdp/profiles│  │ cdp/segments   │ │                       │
│                    │  └────────────┘  └────────────────┘ │                       │
│                    │  ┌────────────┐  ┌────────────────┐ │                       │
│                    │  │ cdp/journeys│  │ analytics     │ │                       │
│                    │  └────────────┘  └────────────────┘ │                       │
│                    └─────────────────────────────────────┘                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

1. **Event Ingestion** — Raw events from `@mcv/cdp/events` are published to the `cdp.events` Redpanda topic.
2. **Incremental Processing** — The `IncrementalProcessor` consumes events in near real-time, identifies which trait definitions are affected by each event type, and enqueues targeted recomputations.
3. **Dependency Resolution** — The `DependencyGraph` determines computation order. If trait B depends on trait A, A is computed first. Cycles are detected and rejected at definition time.
4. **Computation** — The `TraitComputer` applies the appropriate rule (count, sum, min, max, most_frequent, custom_formula) against the relevant event data within the configured time window.
5. **Resolution & Storage** — The `TraitResolver` validates and coerces the computed value to the declared trait type, checks for staleness, and persists the result to `trait_values` in Supabase PostgreSQL.
6. **Profile Enrichment** — Computed trait values are written to the user profile via `@mcv/cdp/profiles`, making them queryable by segments, audiences, journeys, and analytics.

---

## Core Interfaces

### TraitEngine

The top-level orchestrator that ties together all sub-components.

```typescript
interface TraitEngineConfig {
  /** Venture ID scope (null = global engine) */
  ventureId: string | null;

  /** Redpanda consumer group for incremental processing */
  consumerGroup: string;

  /** Maximum concurrent trait computations */
  concurrency: number;

  /** Default staleness threshold in milliseconds */
  stalenessThresholdMs: number;

  /** Maximum depth of trait dependency chains */
  maxDependencyDepth: number;

  /** Enable/disable real-time incremental processing */
  realtimeEnabled: boolean;

  /** Enable/disable batch scheduler */
  batchEnabled: boolean;

  /** Batch computation cron expression */
  batchCron: string;

  /** Dead letter topic for failed computations */
  deadLetterTopic: string;
}

interface TraitEngine {
  /**
   * Initialize the engine — build dependency graph, start consumers,
   * schedule batch jobs.
   */
  initialize(config: TraitEngineConfig): Promise<void>;

  /**
   * Shut down gracefully — drain in-flight computations, disconnect
   * consumers, cancel scheduled jobs.
   */
  shutdown(): Promise<void>;

  /**
   * Compute a single trait for a single profile.
   * Used for on-demand / just-in-time resolution.
   */
  computeTrait(
    profileId: string,
    traitSlug: string,
    options?: { force?: boolean; ventureId?: string }
  ): Promise<TraitValue>;

  /**
   * Compute all traits for a single profile.
   * Respects dependency ordering.
   */
  computeAllTraits(
    profileId: string,
    options?: { force?: boolean; ventureId?: string }
  ): Promise<TraitValue[]>;

  /**
   * Trigger a batch recomputation for a specific trait across all profiles.
   */
  triggerBatchRecompute(
    traitSlug: string,
    options?: { ventureId?: string; priority?: 'low' | 'normal' | 'high' }
  ): Promise<BatchJob>;

  /**
   * Get the current value of a trait for a profile.
   * Returns cached value; does NOT recompute.
   */
  getTraitValue(
    profileId: string,
    traitSlug: string,
    options?: { ventureId?: string; allowStale?: boolean }
  ): Promise<TraitValue | null>;

  /**
   * Get all trait values for a profile.
   */
  getProfileTraits(
    profileId: string,
    options?: { ventureId?: string; filter?: TraitFilter }
  ): Promise<TraitValue[]>;

  /**
   * Check staleness for a profile's traits.
   */
  checkStaleness(
    profileId: string,
    options?: { ventureId?: string }
  ): Promise<StalenessReport>;

  /**
   * Access the dependency graph for inspection / debugging.
   */
  getDependencyGraph(ventureId?: string): TraitDependencyGraph;

  /**
   * Health check — returns engine status including consumer lag,
   * pending batch jobs, and error rates.
   */
  health(): Promise<TraitEngineHealth>;
}

interface TraitEngineHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  consumerLag: number;
  pendingBatchJobs: number;
  failedComputations24h: number;
  staleTrait24h: number;
  lastComputationAt: Date | null;
  uptime: number;
}
```

### TraitDefinition

The declarative specification for a computed trait.

```typescript
interface TraitDefinition {
  /** Unique identifier */
  id: string;

  /** URL-safe slug, unique per venture scope */
  slug: string;

  /** Human-readable name */
  name: string;

  /** Detailed description */
  description: string;

  /** The venture this trait belongs to (null = global) */
  ventureId: string | null;

  /** Output type of the computed value */
  type: TraitType;

  /** Computation rule configuration */
  rule: ComputationRule;

  /** Event types that trigger recomputation */
  sourceEvents: string[];

  /** Optional time window for the computation */
  timeWindow: TraitTimeWindow | null;

  /** Traits this trait depends on */
  dependencies: string[];

  /** Whether this trait is computed in real-time */
  realtimeEnabled: boolean;

  /** Batch recomputation schedule (cron) */
  batchSchedule: string | null;

  /** Custom staleness threshold (overrides engine default) */
  stalenessThresholdMs: number | null;

  /** Current version number */
  version: number;

  /** Whether the trait is active */
  isActive: boolean;

  /** Tags for organizational grouping */
  tags: string[];

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** ID of the user who created this definition */
  createdBy: string;
}

type TraitType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'json';

interface TraitTimeWindow {
  /** Duration value */
  value: number;
  /** Duration unit */
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  /** Whether the window slides (rolling) or is fixed (calendar-aligned) */
  mode: 'rolling' | 'fixed';
}
```

### ComputationRule

Defines how a trait value is derived from source data.

```typescript
type ComputationRuleType =
  | 'count'
  | 'sum'
  | 'min'
  | 'max'
  | 'most_frequent'
  | 'custom_formula';

interface ComputationRuleBase {
  type: ComputationRuleType;
  /** Optional event property filter — only include events matching these conditions */
  filter?: EventFilter;
}

interface CountRule extends ComputationRuleBase {
  type: 'count';
  /** Count distinct values of this property (null = count events) */
  distinctProperty?: string | null;
}

interface SumRule extends ComputationRuleBase {
  type: 'sum';
  /** Event property to sum */
  property: string;
  /** Default value if property is missing */
  defaultValue?: number;
}

interface MinRule extends ComputationRuleBase {
  type: 'min';
  /** Event property to find minimum of */
  property: string;
}

interface MaxRule extends ComputationRuleBase {
  type: 'max';
  /** Event property to find maximum of */
  property: string;
}

interface MostFrequentRule extends ComputationRuleBase {
  type: 'most_frequent';
  /** Event property to find most frequent value of */
  property: string;
  /** How to handle ties */
  tieBreaker: 'first' | 'last' | 'alphabetical';
}

interface CustomFormulaRule extends ComputationRuleBase {
  type: 'custom_formula';
  /** 
   * Formula expression. References trait values with `trait.slug_name`
   * and event aggregates with `events.property.agg()`.
   * Example: "trait.total_spend_30d / trait.order_count_30d"
   */
  expression: string;
  /** Variables available in the formula context */
  variables?: Record<string, FormulaVariable>;
}

type ComputationRule =
  | CountRule
  | SumRule
  | MinRule
  | MaxRule
  | MostFrequentRule
  | CustomFormulaRule;

interface EventFilter {
  /** Match events where property equals value */
  equals?: Record<string, unknown>;
  /** Match events where property is in set */
  in?: Record<string, unknown[]>;
  /** Match events where property is not in set */
  notIn?: Record<string, unknown[]>;
  /** Match events where numeric property is >= value */
  gte?: Record<string, number>;
  /** Match events where numeric property is <= value */
  lte?: Record<string, number>;
  /** Match events where property exists */
  exists?: string[];
  /** Match events where property does not exist */
  notExists?: string[];
}

interface FormulaVariable {
  /** Source: 'trait' references another trait, 'aggregate' runs an event aggregation */
  source: 'trait' | 'aggregate';
  /** Trait slug (if source=trait) */
  traitSlug?: string;
  /** Event type (if source=aggregate) */
  eventType?: string;
  /** Event property (if source=aggregate) */
  property?: string;
  /** Aggregation function (if source=aggregate) */
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
}
```

### TraitValue

A computed trait value attached to a profile.

```typescript
interface TraitValue {
  /** Unique identifier */
  id: string;

  /** Profile this value belongs to */
  profileId: string;

  /** Trait definition this value is for */
  traitDefinitionId: string;

  /** Trait slug (denormalized for fast lookups) */
  traitSlug: string;

  /** The computed value (stored as JSONB, typed by definition) */
  value: unknown;

  /** Type of the value (mirrors definition, for validation) */
  type: TraitType;

  /** Venture scope */
  ventureId: string | null;

  /** When this value was last computed */
  computedAt: Date;

  /** Version of the trait definition at computation time */
  definitionVersion: number;

  /** Computation method that produced this value */
  computationMethod: 'realtime' | 'batch' | 'on_demand';

  /** Number of source events that contributed to this value */
  sourceEventCount: number;

  /** Whether this value is considered stale */
  isStale: boolean;

  /** Computation duration in milliseconds */
  computationDurationMs: number;

  /** Previous value (for change tracking) */
  previousValue: unknown | null;

  /** When the value last changed (not just recomputed) */
  valueChangedAt: Date | null;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

interface TraitSnapshot {
  profileId: string;
  ventureId: string | null;
  traits: Record<string, {
    value: unknown;
    type: TraitType;
    computedAt: Date;
    isStale: boolean;
  }>;
  snapshotAt: Date;
}

interface StalenessReport {
  profileId: string;
  totalTraits: number;
  staleTraits: number;
  freshTraits: number;
  stalestTrait: {
    slug: string;
    computedAt: Date;
    ageMs: number;
    thresholdMs: number;
  } | null;
  overallHealth: 'fresh' | 'stale' | 'critical';
  details: Array<{
    slug: string;
    computedAt: Date;
    ageMs: number;
    thresholdMs: number;
    isStale: boolean;
  }>;
}
```

### TraitDependencyGraph

Manages the directed acyclic graph of trait dependencies.

```typescript
interface TraitDependencyEdge {
  /** The trait that depends on another */
  dependentTraitId: string;
  dependentTraitSlug: string;

  /** The trait being depended upon */
  dependencyTraitId: string;
  dependencyTraitSlug: string;

  /** Venture scope */
  ventureId: string | null;
}

interface TraitDependencyGraph {
  /**
   * Add a dependency edge. Throws TraitDependencyCycleError if this
   * would create a cycle.
   */
  addEdge(edge: TraitDependencyEdge): void;

  /**
   * Remove a dependency edge.
   */
  removeEdge(dependentSlug: string, dependencySlug: string): void;

  /**
   * Get the topological computation order for all traits.
   * Traits with no dependencies come first.
   */
  getComputationOrder(): string[];

  /**
   * Get the computation order starting from a specific trait.
   * Includes all upstream dependencies.
   */
  getComputationOrderFor(traitSlug: string): string[];

  /**
   * Get all traits that directly depend on the given trait.
   */
  getDependents(traitSlug: string): string[];

  /**
   * Get all traits that the given trait directly depends on.
   */
  getDependencies(traitSlug: string): string[];

  /**
   * Get all traits that transitively depend on the given trait.
   */
  getTransitiveDependents(traitSlug: string): string[];

  /**
   * Get all traits that the given trait transitively depends on.
   */
  getTransitiveDependencies(traitSlug: string): string[];

  /**
   * Detect if adding an edge would create a cycle.
   */
  wouldCreateCycle(from: string, to: string): boolean;

  /**
   * Get the depth of the deepest dependency chain.
   */
  getMaxDepth(): number;

  /**
   * Validate the entire graph — no cycles, no missing definitions,
   * no depth violations.
   */
  validate(): GraphValidationResult;

  /**
   * Export the graph for visualization / debugging.
   */
  toJSON(): { nodes: string[]; edges: TraitDependencyEdge[] };
}

interface GraphValidationResult {
  valid: boolean;
  errors: Array<{
    type: 'cycle' | 'missing_dependency' | 'depth_exceeded' | 'self_reference';
    message: string;
    traits: string[];
  }>;
}
```

### BatchJob

Represents a scheduled or triggered batch recomputation.

```typescript
type BatchJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

interface BatchJob {
  /** Unique job identifier */
  id: string;

  /** Trait being recomputed */
  traitDefinitionId: string;
  traitSlug: string;

  /** Venture scope */
  ventureId: string | null;

  /** Current status */
  status: BatchJobStatus;

  /** Job priority */
  priority: 'low' | 'normal' | 'high';

  /** How the job was triggered */
  trigger: 'scheduled' | 'manual' | 'definition_change' | 'backfill';

  /** Total profiles to process */
  totalProfiles: number;

  /** Profiles processed so far */
  processedProfiles: number;

  /** Profiles that failed computation */
  failedProfiles: number;

  /** Profiles that were skipped (e.g., already fresh) */
  skippedProfiles: number;

  /** Progress percentage (0-100) */
  progress: number;

  /** When the job started processing */
  startedAt: Date | null;

  /** When the job completed (or failed) */
  completedAt: Date | null;

  /** Estimated time to completion in seconds */
  estimatedSecondsRemaining: number | null;

  /** Error message if failed */
  errorMessage: string | null;

  /** Error details / stack trace */
  errorDetails: unknown | null;

  /** Number of retry attempts */
  retryCount: number;

  /** Maximum retries before permanent failure */
  maxRetries: number;

  /** Cursor for resumable processing */
  cursor: string | null;

  /** Job metadata (custom context) */
  metadata: Record<string, unknown>;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

interface BatchJobCreateInput {
  traitSlug: string;
  ventureId?: string;
  priority?: 'low' | 'normal' | 'high';
  trigger?: 'manual' | 'backfill';
  metadata?: Record<string, unknown>;
}

interface BatchJobFilter {
  status?: BatchJobStatus | BatchJobStatus[];
  traitSlug?: string;
  ventureId?: string;
  trigger?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}
```

### TraitFilter

Used for querying and filtering traits.

```typescript
interface TraitFilter {
  /** Filter by trait slugs */
  slugs?: string[];

  /** Filter by trait types */
  types?: TraitType[];

  /** Filter by tags */
  tags?: string[];

  /** Only include active traits */
  activeOnly?: boolean;

  /** Only include stale traits */
  staleOnly?: boolean;

  /** Only include real-time traits */
  realtimeOnly?: boolean;

  /** Exclude global traits (venture-specific only) */
  ventureOnly?: boolean;

  /** Include computation metadata */
  includeMetadata?: boolean;

  /** Sort order */
  sortBy?: 'slug' | 'computedAt' | 'valueChangedAt' | 'name';
  sortDir?: 'asc' | 'desc';
}
```

---

## Database Schemas

All schemas use Drizzle ORM with Supabase PostgreSQL. Tables live in the `cdp` schema.

### trait_definitions

Stores the declarative configuration for each computed trait.

```typescript
import { pgTable, pgSchema, text, jsonb, boolean, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const cdp = pgSchema('cdp');

export const traitDefinitions = cdp.table('trait_definitions', {
  // === Identity ===
  id:                text('id').primaryKey().default(sql`gen_random_uuid()`),
  slug:              text('slug').notNull(),
  name:              text('name').notNull(),
  description:       text('description').default(''),

  // === Scope ===
  ventureId:         text('venture_id'),

  // === Type & Rule ===
  type:              text('type').notNull(),
    // 'string' | 'number' | 'boolean' | 'date' | 'array' | 'json'
  rule:              jsonb('rule').notNull(),
    // { type: 'count' | 'sum' | 'min' | 'max' | 'most_frequent' | 'custom_formula', ...config }
  sourceEvents:      jsonb('source_events').notNull().default(sql`'[]'::jsonb`),
    // string[] — event types that trigger this trait
  timeWindow:        jsonb('time_window'),
    // { value: number, unit: string, mode: 'rolling' | 'fixed' } | null

  // === Dependencies ===
  dependencies:      jsonb('dependencies').notNull().default(sql`'[]'::jsonb`),
    // string[] — slugs of traits this depends on

  // === Scheduling ===
  realtimeEnabled:   boolean('realtime_enabled').notNull().default(true),
  batchSchedule:     text('batch_schedule'),
    // cron expression or null

  // === Staleness ===
  stalenessThresholdMs: integer('staleness_threshold_ms'),
    // null = use engine default

  // === Versioning ===
  version:           integer('version').notNull().default(1),
  isActive:          boolean('is_active').notNull().default(true),

  // === Metadata ===
  tags:              jsonb('tags').notNull().default(sql`'[]'::jsonb`),
  createdBy:         text('created_by').notNull(),

  // === Timestamps ===
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Slug must be unique within a venture scope (null venture = global)
  slugVentureUnique: uniqueIndex('trait_def_slug_venture_idx')
    .on(table.slug, table.ventureId),
  ventureIdx:        index('trait_def_venture_idx').on(table.ventureId),
  typeIdx:           index('trait_def_type_idx').on(table.type),
  activeIdx:         index('trait_def_active_idx').on(table.isActive),
  tagsIdx:           index('trait_def_tags_idx').using('gin', table.tags),
  sourceEventsIdx:   index('trait_def_source_events_idx').using('gin', table.sourceEvents),
}));
```

### trait_values

Stores the computed trait values for each profile.

```typescript
export const traitValues = cdp.table('trait_values', {
  // === Identity ===
  id:                    text('id').primaryKey().default(sql`gen_random_uuid()`),
  profileId:             text('profile_id').notNull(),
  traitDefinitionId:     text('trait_definition_id').notNull()
    .references(() => traitDefinitions.id, { onDelete: 'cascade' }),
  traitSlug:             text('trait_slug').notNull(),

  // === Value ===
  value:                 jsonb('value'),
    // The computed value — type depends on definition
  type:                  text('type').notNull(),
    // Denormalized from definition for validation

  // === Scope ===
  ventureId:             text('venture_id'),

  // === Computation Metadata ===
  computedAt:            timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  definitionVersion:     integer('definition_version').notNull(),
  computationMethod:     text('computation_method').notNull(),
    // 'realtime' | 'batch' | 'on_demand'
  sourceEventCount:      integer('source_event_count').notNull().default(0),
  computationDurationMs: integer('computation_duration_ms').notNull().default(0),

  // === Change Tracking ===
  previousValue:         jsonb('previous_value'),
  valueChangedAt:        timestamp('value_changed_at', { withTimezone: true }),

  // === Staleness ===
  isStale:               boolean('is_stale').notNull().default(false),

  // === Timestamps ===
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // One value per profile per trait per venture
  profileTraitUnique: uniqueIndex('trait_val_profile_trait_idx')
    .on(table.profileId, table.traitDefinitionId, table.ventureId),
  profileIdx:         index('trait_val_profile_idx').on(table.profileId),
  traitSlugIdx:       index('trait_val_slug_idx').on(table.traitSlug),
  ventureIdx:         index('trait_val_venture_idx').on(table.ventureId),
  computedAtIdx:      index('trait_val_computed_at_idx').on(table.computedAt),
  staleIdx:           index('trait_val_stale_idx').on(table.isStale)
    .where(sql`is_stale = true`),
  valueChangedIdx:    index('trait_val_changed_idx').on(table.valueChangedAt),
  // GIN index on value for segment queries
  valueGinIdx:        index('trait_val_value_gin_idx').using('gin', table.value),
}));
```

### trait_computations

Audit log of individual trait computations for debugging and analytics.

```typescript
export const traitComputations = cdp.table('trait_computations', {
  // === Identity ===
  id:                    text('id').primaryKey().default(sql`gen_random_uuid()`),
  profileId:             text('profile_id').notNull(),
  traitDefinitionId:     text('trait_definition_id').notNull()
    .references(() => traitDefinitions.id, { onDelete: 'cascade' }),
  traitSlug:             text('trait_slug').notNull(),

  // === Scope ===
  ventureId:             text('venture_id'),

  // === Result ===
  status:                text('status').notNull(),
    // 'success' | 'failed' | 'skipped'
  computedValue:         jsonb('computed_value'),
  previousValue:         jsonb('previous_value'),
  valueChanged:          boolean('value_changed').notNull().default(false),

  // === Computation Details ===
  computationMethod:     text('computation_method').notNull(),
  definitionVersion:     integer('definition_version').notNull(),
  sourceEventCount:      integer('source_event_count').notNull().default(0),
  durationMs:            integer('duration_ms').notNull().default(0),

  // === Error Details ===
  errorCode:             text('error_code'),
  errorMessage:          text('error_message'),
  errorDetails:          jsonb('error_details'),

  // === Trigger ===
  triggeredBy:           text('triggered_by').notNull(),
    // 'realtime_event' | 'batch_job' | 'on_demand' | 'dependency_update'
  triggerEventId:        text('trigger_event_id'),
    // The event ID that triggered this (if realtime)
  batchJobId:            text('batch_job_id'),
    // The batch job ID (if batch)

  // === Timestamps ===
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  profileIdx:      index('trait_comp_profile_idx').on(table.profileId),
  traitSlugIdx:    index('trait_comp_slug_idx').on(table.traitSlug),
  statusIdx:       index('trait_comp_status_idx').on(table.status),
  ventureIdx:      index('trait_comp_venture_idx').on(table.ventureId),
  createdAtIdx:    index('trait_comp_created_at_idx').on(table.createdAt),
  batchJobIdx:     index('trait_comp_batch_job_idx').on(table.batchJobId),
  // Partial index for failures (for monitoring dashboards)
  failedIdx:       index('trait_comp_failed_idx').on(table.createdAt)
    .where(sql`status = 'failed'`),
}));
```

### trait_dependencies

Stores the edges of the trait dependency graph.

```typescript
export const traitDependencies = cdp.table('trait_dependencies', {
  // === Identity ===
  id:                    text('id').primaryKey().default(sql`gen_random_uuid()`),

  // === Edge ===
  dependentTraitId:      text('dependent_trait_id').notNull()
    .references(() => traitDefinitions.id, { onDelete: 'cascade' }),
  dependentTraitSlug:    text('dependent_trait_slug').notNull(),

  dependencyTraitId:     text('dependency_trait_id').notNull()
    .references(() => traitDefinitions.id, { onDelete: 'cascade' }),
  dependencyTraitSlug:   text('dependency_trait_slug').notNull(),

  // === Scope ===
  ventureId:             text('venture_id'),

  // === Metadata ===
  depth:                 integer('depth').notNull().default(1),
    // Distance from dependent to dependency (1 = direct)

  // === Timestamps ===
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  edgeUnique:          uniqueIndex('trait_dep_edge_idx')
    .on(table.dependentTraitId, table.dependencyTraitId),
  dependentIdx:        index('trait_dep_dependent_idx').on(table.dependentTraitId),
  dependencyIdx:       index('trait_dep_dependency_idx').on(table.dependencyTraitId),
  ventureIdx:          index('trait_dep_venture_idx').on(table.ventureId),
  dependentSlugIdx:    index('trait_dep_dependent_slug_idx').on(table.dependentTraitSlug),
  dependencySlugIdx:   index('trait_dep_dependency_slug_idx').on(table.dependencyTraitSlug),
}));
```

### computation_jobs

Tracks batch recomputation jobs.

```typescript
export const computationJobs = cdp.table('computation_jobs', {
  // === Identity ===
  id:                       text('id').primaryKey().default(sql`gen_random_uuid()`),

  // === Target ===
  traitDefinitionId:        text('trait_definition_id').notNull()
    .references(() => traitDefinitions.id, { onDelete: 'cascade' }),
  traitSlug:                text('trait_slug').notNull(),

  // === Scope ===
  ventureId:                text('venture_id'),

  // === Status ===
  status:                   text('status').notNull().default('pending'),
    // 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused'
  priority:                 text('priority').notNull().default('normal'),
    // 'low' | 'normal' | 'high'
  trigger:                  text('trigger').notNull(),
    // 'scheduled' | 'manual' | 'definition_change' | 'backfill'

  // === Progress ===
  totalProfiles:            integer('total_profiles').notNull().default(0),
  processedProfiles:        integer('processed_profiles').notNull().default(0),
  failedProfiles:           integer('failed_profiles').notNull().default(0),
  skippedProfiles:          integer('skipped_profiles').notNull().default(0),

  // === Timing ===
  startedAt:                timestamp('started_at', { withTimezone: true }),
  completedAt:              timestamp('completed_at', { withTimezone: true }),
  estimatedSecondsRemaining: integer('estimated_seconds_remaining'),

  // === Error ===
  errorMessage:             text('error_message'),
  errorDetails:             jsonb('error_details'),

  // === Retry ===
  retryCount:               integer('retry_count').notNull().default(0),
  maxRetries:               integer('max_retries').notNull().default(3),

  // === Resumability ===
  cursor:                   text('cursor'),
    // Opaque cursor for resumable processing

  // === Metadata ===
  metadata:                 jsonb('metadata').notNull().default(sql`'{}'::jsonb`),

  // === Timestamps ===
  createdAt:                timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusIdx:           index('comp_job_status_idx').on(table.status),
  traitSlugIdx:        index('comp_job_slug_idx').on(table.traitSlug),
  ventureIdx:          index('comp_job_venture_idx').on(table.ventureId),
  priorityStatusIdx:   index('comp_job_priority_status_idx')
    .on(table.priority, table.status),
  createdAtIdx:        index('comp_job_created_at_idx').on(table.createdAt),
  // Partial index for active jobs
  activeIdx:           index('comp_job_active_idx').on(table.status)
    .where(sql`status IN ('pending', 'running', 'paused')`),
}));
```

### trait_definition_versions

Stores version history for trait definitions, enabling safe rollback.

```typescript
export const traitDefinitionVersions = cdp.table('trait_definition_versions', {
  // === Identity ===
  id:                text('id').primaryKey().default(sql`gen_random_uuid()`),
  traitDefinitionId: text('trait_definition_id').notNull()
    .references(() => traitDefinitions.id, { onDelete: 'cascade' }),

  // === Version ===
  version:           integer('version').notNull(),
  snapshot:          jsonb('snapshot').notNull(),
    // Full serialized TraitDefinition at this version

  // === Change Context ===
  changeReason:      text('change_reason'),
  changedBy:         text('changed_by').notNull(),
  changedFields:     jsonb('changed_fields').notNull().default(sql`'[]'::jsonb`),
    // string[] — which fields changed

  // === Timestamps ===
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  defVersionUnique: uniqueIndex('trait_def_ver_idx')
    .on(table.traitDefinitionId, table.version),
  defIdx:           index('trait_def_ver_def_idx').on(table.traitDefinitionId),
  createdAtIdx:     index('trait_def_ver_created_at_idx').on(table.createdAt),
}));
```

---

## Code Examples

### 1. Defining a Trait

Create trait definitions declaratively. The `TraitDefinitionService` validates the definition, checks for dependency conflicts, and persists it.

```typescript
import { TraitDefinitionService } from '@mcv/cdp/traits';

const definitionService = new TraitDefinitionService(db, ventureId);

// Simple count trait — number of purchases in the last 30 days
const purchaseCount = await definitionService.create({
  slug: 'purchase_count_30d',
  name: 'Purchase Count (30 days)',
  description: 'Total number of purchase events in the last 30 days',
  type: 'number',
  rule: {
    type: 'count',
  },
  sourceEvents: ['purchase_completed'],
  timeWindow: {
    value: 30,
    unit: 'days',
    mode: 'rolling',
  },
  realtimeEnabled: true,
  batchSchedule: '0 2 * * *', // Daily at 2 AM for reconciliation
  tags: ['ecommerce', 'engagement'],
});

console.log(purchaseCount);
// {
//   id: 'td_a1b2c3d4',
//   slug: 'purchase_count_30d',
//   name: 'Purchase Count (30 days)',
//   version: 1,
//   isActive: true,
//   ...
// }

// Sum trait — total revenue in the last 30 days
const totalSpend = await definitionService.create({
  slug: 'total_spend_30d',
  name: 'Total Spend (30 days)',
  description: 'Sum of all purchase amounts in the last 30 days',
  type: 'number',
  rule: {
    type: 'sum',
    property: 'amount',
    defaultValue: 0,
  },
  sourceEvents: ['purchase_completed'],
  timeWindow: {
    value: 30,
    unit: 'days',
    mode: 'rolling',
  },
  realtimeEnabled: true,
  tags: ['ecommerce', 'revenue'],
});

// Most frequent trait — favorite product category
const favoriteCategory = await definitionService.create({
  slug: 'favorite_category',
  name: 'Favorite Product Category',
  description: 'Most frequently purchased product category (all time)',
  type: 'string',
  rule: {
    type: 'most_frequent',
    property: 'category',
    tieBreaker: 'last',
  },
  sourceEvents: ['purchase_completed', 'product_viewed'],
  timeWindow: null, // All time
  realtimeEnabled: true,
  tags: ['ecommerce', 'preferences'],
});
```

### 2. Computation Rule Types

Each rule type has specific behavior. Here's how each one processes events:

```typescript
import {
  CountRule,
  SumRule,
  MinRule,
  MaxRule,
  MostFrequentRule,
  CustomFormulaRule,
  TraitComputer,
} from '@mcv/cdp/traits';

const computer = new TraitComputer(db, eventStore);

// ── COUNT ─────────────────────────────────────────────
// Count events matching criteria
const loginCount = await computer.compute('profile_123', {
  type: 'count',
  // No distinctProperty → count total events
});
// Result: 47

// Count distinct values
const uniqueDevices = await computer.compute('profile_123', {
  type: 'count',
  distinctProperty: 'device_id',
  filter: {
    exists: ['device_id'],
  },
});
// Result: 3 (e.g., phone, laptop, tablet)

// ── SUM ───────────────────────────────────────────────
// Sum a numeric property across events
const totalRevenue = await computer.compute('profile_123', {
  type: 'sum',
  property: 'amount',
  defaultValue: 0,
  filter: {
    equals: { status: 'completed' },
  },
});
// Result: 2847.50

// ── MIN ───────────────────────────────────────────────
// Find the minimum value of a property
const firstPurchaseAmount = await computer.compute('profile_123', {
  type: 'min',
  property: 'amount',
});
// Result: 9.99

// ── MAX ───────────────────────────────────────────────
// Find the maximum value of a property
const largestOrder = await computer.compute('profile_123', {
  type: 'max',
  property: 'amount',
});
// Result: 499.99

// ── MOST_FREQUENT ─────────────────────────────────────
// Find the most common value of a property
const preferredPayment = await computer.compute('profile_123', {
  type: 'most_frequent',
  property: 'payment_method',
  tieBreaker: 'last',
});
// Result: 'credit_card'

// ── CUSTOM_FORMULA ────────────────────────────────────
// Arbitrary expression combining traits and aggregates
const avgOrderValue = await computer.compute('profile_123', {
  type: 'custom_formula',
  expression: 'total_spend / order_count',
  variables: {
    total_spend: {
      source: 'trait',
      traitSlug: 'total_spend_30d',
    },
    order_count: {
      source: 'trait',
      traitSlug: 'purchase_count_30d',
    },
  },
});
// Result: 60.58 (2847.50 / 47)

// Formula with mixed sources (trait + event aggregate)
const engagementScore = await computer.compute('profile_123', {
  type: 'custom_formula',
  expression: '(page_views * 0.3) + (purchases * 0.5) + (days_active * 0.2)',
  variables: {
    page_views: {
      source: 'aggregate',
      eventType: 'page_viewed',
      aggregation: 'count',
    },
    purchases: {
      source: 'trait',
      traitSlug: 'purchase_count_30d',
    },
    days_active: {
      source: 'aggregate',
      eventType: 'session_started',
      property: 'date',
      aggregation: 'count', // count distinct dates
    },
  },
});
// Result: 78.4
```

### 3. Batch Recomputation

Batch jobs recompute a trait across all profiles — used for backfills, definition changes, or daily reconciliation.

```typescript
import { TraitEngine, BatchScheduler } from '@mcv/cdp/traits';

const engine = new TraitEngine(config);

// ── Trigger a manual batch recompute ──────────────────
const job = await engine.triggerBatchRecompute('total_spend_30d', {
  ventureId: 'venture_abc',
  priority: 'high',
});

console.log(job);
// {
//   id: 'job_x1y2z3',
//   traitSlug: 'total_spend_30d',
//   status: 'pending',
//   priority: 'high',
//   trigger: 'manual',
//   totalProfiles: 0,      // Populated when job starts
//   processedProfiles: 0,
//   ...
// }

// ── Monitor job progress ──────────────────────────────
const checkProgress = async (jobId: string) => {
  const status = await engine.getBatchJobStatus(jobId);
  console.log(`
    Status: ${status.status}
    Progress: ${status.progress}%
    Processed: ${status.processedProfiles} / ${status.totalProfiles}
    Failed: ${status.failedProfiles}
    ETA: ${status.estimatedSecondsRemaining}s
  `);
};

// Poll until complete
const pollInterval = setInterval(async () => {
  const status = await engine.getBatchJobStatus(job.id);
  if (status.status === 'completed' || status.status === 'failed') {
    clearInterval(pollInterval);
    console.log(`Job ${job.id} finished: ${status.status}`);
    console.log(`  Processed: ${status.processedProfiles}`);
    console.log(`  Failed: ${status.failedProfiles}`);
    console.log(`  Skipped: ${status.skippedProfiles}`);
    console.log(`  Duration: ${
      (status.completedAt!.getTime() - status.startedAt!.getTime()) / 1000
    }s`);
  }
}, 5000);

// ── Batch scheduler for recurring jobs ────────────────
const scheduler = new BatchScheduler(db, engine);

// Register a trait for daily batch recomputation
await scheduler.register({
  traitSlug: 'churn_risk_score',
  ventureId: 'venture_abc',
  cron: '0 3 * * *',          // 3 AM daily
  priority: 'normal',
  // Skip profiles where trait was computed < 12h ago
  skipFreshWithinMs: 12 * 60 * 60 * 1000,
});

// List scheduled batch jobs
const scheduled = await scheduler.listScheduled({
  ventureId: 'venture_abc',
});
console.log(scheduled);
// [
//   { traitSlug: 'churn_risk_score', cron: '0 3 * * *', nextRunAt: '2026-02-09T03:00:00Z' },
//   { traitSlug: 'total_spend_30d', cron: '0 2 * * *', nextRunAt: '2026-02-09T02:00:00Z' },
// ]

// ── Cancel a running job ──────────────────────────────
await engine.cancelBatchJob(job.id);

// ── Retry a failed job (resumes from cursor) ─────────
await engine.retryBatchJob(job.id);
```

### 4. Real-time Incremental Updates

The `IncrementalProcessor` consumes events from Redpanda and updates affected traits in near real-time.

```typescript
import { IncrementalProcessor, TraitEngine } from '@mcv/cdp/traits';

const engine = new TraitEngine(config);

// The processor is started automatically when engine.initialize() is called.
// Here's what happens internally:

const processor = new IncrementalProcessor({
  engine,
  consumerGroup: 'cdp-traits-incremental',
  topic: 'cdp.events',
  concurrency: 10,
  batchSize: 100,
  batchTimeoutMs: 500,
});

// ── Event arrives from Redpanda ───────────────────────
// When a purchase_completed event arrives:
// {
//   id: 'evt_abc123',
//   type: 'purchase_completed',
//   profileId: 'profile_456',
//   properties: { amount: 79.99, category: 'Electronics', payment_method: 'credit_card' },
//   timestamp: '2026-02-08T15:30:00Z',
//   ventureId: 'venture_abc',
// }

// The processor:
// 1. Looks up trait definitions where 'purchase_completed' ∈ sourceEvents
//    → finds: purchase_count_30d, total_spend_30d, favorite_category, largest_order, avg_order_value
// 2. Builds a mini dependency graph for the affected traits
//    → avg_order_value depends on purchase_count_30d and total_spend_30d
// 3. Computes in topological order:
//    a. purchase_count_30d (count) → 48
//    b. total_spend_30d (sum) → 2927.49
//    c. favorite_category (most_frequent) → 'Electronics'
//    d. largest_order (max) → 499.99 (unchanged)
//    e. avg_order_value (formula: total/count) → 60.99
// 4. Persists updated trait values
// 5. Commits Redpanda offset

// ── Manual single-trait computation ───────────────────
const value = await engine.computeTrait('profile_456', 'total_spend_30d', {
  force: true,  // Recompute even if fresh
  ventureId: 'venture_abc',
});

console.log(value);
// {
//   id: 'tv_m1n2o3',
//   profileId: 'profile_456',
//   traitSlug: 'total_spend_30d',
//   value: 2927.49,
//   type: 'number',
//   computedAt: '2026-02-08T15:30:01Z',
//   definitionVersion: 1,
//   computationMethod: 'on_demand',
//   sourceEventCount: 48,
//   isStale: false,
//   computationDurationMs: 23,
//   previousValue: 2847.50,
//   valueChangedAt: '2026-02-08T15:30:01Z',
// }

// ── Retrieve all traits for a profile ─────────────────
const traits = await engine.getProfileTraits('profile_456', {
  ventureId: 'venture_abc',
  filter: {
    tags: ['ecommerce'],
    activeOnly: true,
    includeMetadata: true,
    sortBy: 'slug',
    sortDir: 'asc',
  },
});

console.log(traits.map(t => ({ slug: t.traitSlug, value: t.value, stale: t.isStale })));
// [
//   { slug: 'avg_order_value', value: 60.99, stale: false },
//   { slug: 'favorite_category', value: 'Electronics', stale: false },
//   { slug: 'largest_order', value: 499.99, stale: false },
//   { slug: 'purchase_count_30d', value: 48, stale: false },
//   { slug: 'total_spend_30d', value: 2927.49, stale: false },
// ]
```

### 5. Trait Dependency Chains

Traits can depend on other traits, forming a DAG. The engine resolves dependencies automatically.

```typescript
import { TraitDefinitionService, DependencyGraph } from '@mcv/cdp/traits';

const definitionService = new TraitDefinitionService(db, 'venture_abc');

// ── Define a chain of dependent traits ────────────────

// Level 0: No dependencies (leaf traits)
await definitionService.create({
  slug: 'total_spend_30d',
  name: 'Total Spend (30 days)',
  type: 'number',
  rule: { type: 'sum', property: 'amount' },
  sourceEvents: ['purchase_completed'],
  timeWindow: { value: 30, unit: 'days', mode: 'rolling' },
  dependencies: [],
  realtimeEnabled: true,
  tags: ['ecommerce'],
});

await definitionService.create({
  slug: 'purchase_count_30d',
  name: 'Purchase Count (30 days)',
  type: 'number',
  rule: { type: 'count' },
  sourceEvents: ['purchase_completed'],
  timeWindow: { value: 30, unit: 'days', mode: 'rolling' },
  dependencies: [],
  realtimeEnabled: true,
  tags: ['ecommerce'],
});

await definitionService.create({
  slug: 'days_since_last_purchase',
  name: 'Days Since Last Purchase',
  type: 'number',
  rule: {
    type: 'custom_formula',
    expression: 'DAYS_BETWEEN(last_purchase_date, NOW())',
    variables: {
      last_purchase_date: {
        source: 'aggregate',
        eventType: 'purchase_completed',
        property: 'timestamp',
        aggregation: 'max',
      },
    },
  },
  sourceEvents: ['purchase_completed'],
  dependencies: [],
  realtimeEnabled: true,
  tags: ['ecommerce', 'recency'],
});

// Level 1: Depends on level 0
await definitionService.create({
  slug: 'avg_order_value_30d',
  name: 'Average Order Value (30 days)',
  type: 'number',
  rule: {
    type: 'custom_formula',
    expression: 'order_count > 0 ? total_spend / order_count : 0',
    variables: {
      total_spend: { source: 'trait', traitSlug: 'total_spend_30d' },
      order_count: { source: 'trait', traitSlug: 'purchase_count_30d' },
    },
  },
  sourceEvents: ['purchase_completed'],
  dependencies: ['total_spend_30d', 'purchase_count_30d'],
  realtimeEnabled: true,
  tags: ['ecommerce', 'derived'],
});

// Level 2: Depends on level 0 and level 1
await definitionService.create({
  slug: 'churn_risk_score',
  name: 'Churn Risk Score',
  description: 'Composite churn risk score (0-100, higher = more at risk)',
  type: 'number',
  rule: {
    type: 'custom_formula',
    expression: `
      CLAMP(0, 100,
        (days_inactive * 2.5) +
        (100 - CLAMP(0, 100, aov * 0.5)) +
        (order_count < 2 ? 30 : 0)
      )
    `,
    variables: {
      days_inactive: { source: 'trait', traitSlug: 'days_since_last_purchase' },
      aov: { source: 'trait', traitSlug: 'avg_order_value_30d' },
      order_count: { source: 'trait', traitSlug: 'purchase_count_30d' },
    },
  },
  sourceEvents: ['purchase_completed'],
  dependencies: [
    'days_since_last_purchase',
    'avg_order_value_30d',
    'purchase_count_30d',
  ],
  realtimeEnabled: false,  // Too expensive for real-time
  batchSchedule: '0 4 * * *',
  tags: ['ecommerce', 'predictive', 'churn'],
});

// ── Inspect the dependency graph ──────────────────────
const graph = engine.getDependencyGraph('venture_abc');

console.log('Computation order:', graph.getComputationOrder());
// [
//   'total_spend_30d',          // Level 0
//   'purchase_count_30d',       // Level 0
//   'days_since_last_purchase', // Level 0
//   'avg_order_value_30d',      // Level 1
//   'churn_risk_score',         // Level 2
// ]

console.log('Dependencies for churn_risk_score:',
  graph.getTransitiveDependencies('churn_risk_score'));
// [
//   'days_since_last_purchase',
//   'avg_order_value_30d',
//   'purchase_count_30d',
//   'total_spend_30d',           // Transitive via avg_order_value_30d
// ]

console.log('Dependents of purchase_count_30d:',
  graph.getTransitiveDependents('purchase_count_30d'));
// [
//   'avg_order_value_30d',
//   'churn_risk_score',          // Transitive via avg_order_value_30d
// ]

console.log('Max depth:', graph.getMaxDepth());
// 2

// ── Cycle detection ───────────────────────────────────
const wouldCycle = graph.wouldCreateCycle('total_spend_30d', 'churn_risk_score');
console.log('Would create cycle:', wouldCycle);
// true — churn_risk_score → avg_order_value_30d → total_spend_30d → churn_risk_score

// Attempting to create a cyclic dependency throws:
try {
  await definitionService.create({
    slug: 'circular_trait',
    name: 'This Will Fail',
    type: 'number',
    rule: {
      type: 'custom_formula',
      expression: 'churn * 2',
      variables: {
        churn: { source: 'trait', traitSlug: 'churn_risk_score' },
      },
    },
    sourceEvents: [],
    // churn_risk_score depends on total_spend_30d, and if total_spend_30d
    // depended on this trait, it would create a cycle
    dependencies: ['churn_risk_score'],
    realtimeEnabled: true,
    tags: [],
  });
} catch (err) {
  // This creation itself is fine — no cycle. But if churn_risk_score
  // was then updated to depend on circular_trait, THAT would fail.
  console.log('Created OK, no cycle');
}

// ── Graph validation ──────────────────────────────────
const validation = graph.validate();
console.log(validation);
// {
//   valid: true,
//   errors: []
// }
```

### 6. Trait Versioning and Rollback

When a trait definition changes, the previous version is preserved for rollback.

```typescript
import { TraitVersionManager, TraitDefinitionService } from '@mcv/cdp/traits';

const definitions = new TraitDefinitionService(db, 'venture_abc');
const versions = new TraitVersionManager(db);

// ── Update a trait definition ─────────────────────────
// Changes the time window from 30 days to 90 days
const updated = await definitions.update('total_spend_30d', {
  timeWindow: { value: 90, unit: 'days', mode: 'rolling' },
  changeReason: 'Expanding window for more stable metric',
});

console.log(updated.version); // 2

// ── View version history ──────────────────────────────
const history = await versions.getHistory('total_spend_30d', {
  ventureId: 'venture_abc',
  limit: 10,
});

console.log(history);
// [
//   {
//     version: 2,
//     changedFields: ['timeWindow'],
//     changeReason: 'Expanding window for more stable metric',
//     changedBy: 'user_admin_1',
//     createdAt: '2026-02-08T16:00:00Z',
//     snapshot: { ... full definition at v2 ... },
//   },
//   {
//     version: 1,
//     changedFields: [],
//     changeReason: 'Initial creation',
//     changedBy: 'user_admin_1',
//     createdAt: '2026-01-15T10:00:00Z',
//     snapshot: { ... full definition at v1 ... },
//   },
// ]

// ── Compare versions ──────────────────────────────────
const diff = await versions.diff('total_spend_30d', {
  ventureId: 'venture_abc',
  fromVersion: 1,
  toVersion: 2,
});

console.log(diff);
// {
//   changedFields: ['timeWindow'],
//   changes: {
//     timeWindow: {
//       from: { value: 30, unit: 'days', mode: 'rolling' },
//       to: { value: 90, unit: 'days', mode: 'rolling' },
//     },
//   },
// }

// ── Rollback to a previous version ────────────────────
const rolledBack = await versions.rollback('total_spend_30d', {
  ventureId: 'venture_abc',
  toVersion: 1,
  changeReason: '90-day window was too noisy, reverting',
});

console.log(rolledBack.version); // 3 (new version with v1's config)
console.log(rolledBack.timeWindow);
// { value: 30, unit: 'days', mode: 'rolling' }

// A rollback automatically triggers a batch recomputation
// for the affected trait (priority: high)
```

### 7. Venture-specific Traits

Each venture can define custom traits on top of the global trait set.

```typescript
import { VentureTraitManager, TraitEngine } from '@mcv/cdp/traits';

const ventureManager = new VentureTraitManager(db);

// ── List global traits ────────────────────────────────
const globalTraits = await ventureManager.listGlobalTraits();
console.log(globalTraits.map(t => t.slug));
// ['last_seen_at', 'event_count_total', 'first_event_at', 'days_since_first_event']

// ── Create venture-specific traits ────────────────────
// E-commerce venture
await ventureManager.createForVenture('venture_ecommerce', {
  slug: 'lifetime_value',
  name: 'Customer Lifetime Value',
  type: 'number',
  rule: {
    type: 'sum',
    property: 'amount',
    filter: { equals: { status: 'completed' } },
  },
  sourceEvents: ['purchase_completed'],
  timeWindow: null, // All time
  realtimeEnabled: true,
  tags: ['ecommerce', 'ltv'],
});

// SaaS venture
await ventureManager.createForVenture('venture_saas', {
  slug: 'feature_adoption_score',
  name: 'Feature Adoption Score',
  type: 'number',
  rule: {
    type: 'custom_formula',
    expression: '(features_used / total_features) * 100',
    variables: {
      features_used: {
        source: 'aggregate',
        eventType: 'feature_used',
        property: 'feature_name',
        aggregation: 'count', // distinct count
      },
      total_features: {
        source: 'aggregate',
        eventType: 'feature_available',
        property: 'feature_name',
        aggregation: 'count',
      },
    },
  },
  sourceEvents: ['feature_used', 'feature_available'],
  dependencies: [],
  realtimeEnabled: true,
  tags: ['saas', 'adoption'],
});

// ── Get effective traits for a venture ────────────────
// Returns global traits + venture-specific traits
const effectiveTraits = await ventureManager.getEffectiveTraits('venture_ecommerce');
console.log(effectiveTraits.map(t => ({ slug: t.slug, scope: t.ventureId ? 'venture' : 'global' })));
// [
//   { slug: 'last_seen_at', scope: 'global' },
//   { slug: 'event_count_total', scope: 'global' },
//   { slug: 'first_event_at', scope: 'global' },
//   { slug: 'days_since_first_event', scope: 'global' },
//   { slug: 'lifetime_value', scope: 'venture' },
//   { slug: 'purchase_count_30d', scope: 'venture' },
//   { slug: 'total_spend_30d', scope: 'venture' },
//   ... etc
// ]

// ── Venture trait override ────────────────────────────
// A venture can override the staleness threshold for a global trait
await ventureManager.overrideGlobalTrait('venture_ecommerce', 'event_count_total', {
  stalenessThresholdMs: 5 * 60 * 1000,  // 5 minutes (stricter than global default)
});
```

### 8. Staleness Detection

Track when traits were last computed and flag stale values.

```typescript
import { StalenessChecker, TraitEngine } from '@mcv/cdp/traits';

const engine = new TraitEngine(config);
const checker = new StalenessChecker(db, {
  defaultThresholdMs: 60 * 60 * 1000, // 1 hour default
});

// ── Check staleness for a profile ─────────────────────
const report = await engine.checkStaleness('profile_456', {
  ventureId: 'venture_abc',
});

console.log(report);
// {
//   profileId: 'profile_456',
//   totalTraits: 8,
//   staleTraits: 2,
//   freshTraits: 6,
//   stalestTrait: {
//     slug: 'churn_risk_score',
//     computedAt: '2026-02-07T04:00:00Z',
//     ageMs: 131400000,  // ~36.5 hours
//     thresholdMs: 86400000, // 24 hours
//   },
//   overallHealth: 'stale',
//   details: [
//     { slug: 'churn_risk_score', computedAt: '...', ageMs: 131400000, thresholdMs: 86400000, isStale: true },
//     { slug: 'engagement_score', computedAt: '...', ageMs: 90000000, thresholdMs: 86400000, isStale: true },
//     { slug: 'total_spend_30d', computedAt: '...', ageMs: 1200000, thresholdMs: 3600000, isStale: false },
//     ...
//   ],
// }

// ── Bulk staleness scan ───────────────────────────────
// Find profiles with the most stale traits
const staleProfiles = await checker.findStaleProfiles({
  ventureId: 'venture_abc',
  minStaleTraits: 3,
  limit: 100,
  orderBy: 'stale_count_desc',
});

console.log(staleProfiles);
// [
//   { profileId: 'profile_789', staleTraitCount: 5, oldestComputedAt: '2026-02-05T...' },
//   { profileId: 'profile_456', staleTraitCount: 2, oldestComputedAt: '2026-02-07T...' },
//   ...
// ]

// ── Trigger recomputation for stale traits ────────────
for (const profile of staleProfiles) {
  await engine.computeAllTraits(profile.profileId, {
    force: false,   // Only recompute stale ones
    ventureId: 'venture_abc',
  });
}

// ── Staleness monitoring query ────────────────────────
// Get aggregate staleness stats for a venture
const stats = await checker.getVentureStats('venture_abc');
console.log(stats);
// {
//   totalTraitValues: 45000,
//   staleValues: 1200,
//   stalenessRate: 0.027,  // 2.7%
//   byTrait: {
//     'churn_risk_score': { total: 5000, stale: 800, rate: 0.16 },
//     'engagement_score': { total: 5000, stale: 300, rate: 0.06 },
//     'total_spend_30d': { total: 5000, stale: 50, rate: 0.01 },
//     ...
//   },
// }
```

---

## Error Codes

| Code | Name | HTTP | Description |
|---|---|---|---|
| `TRAIT_NOT_FOUND` | TraitNotFoundError | 404 | Trait definition with the given slug does not exist in the specified venture scope |
| `TRAIT_DEFINITION_CONFLICT` | TraitDefinitionConflictError | 409 | A trait with this slug already exists in the same venture scope |
| `TRAIT_COMPUTATION_FAILED` | TraitComputationError | 500 | The computation rule failed to produce a result (e.g., division by zero, null property) |
| `TRAIT_DEPENDENCY_CYCLE` | TraitDependencyCycleError | 422 | Adding this dependency would create a cycle in the trait dependency graph |
| `TRAIT_STALENESS_EXCEEDED` | TraitStalenessError | 410 | The requested trait value exceeds its staleness threshold and `allowStale: false` was set |
| `TRAIT_TYPE_MISMATCH` | TraitTypeError | 422 | The computed value does not match the declared trait type (e.g., string computed for a number trait) |
| `TRAIT_FORMULA_INVALID` | TraitFormulaError | 422 | The custom_formula expression is syntactically invalid or references undefined variables |
| `TRAIT_BATCH_FAILED` | TraitBatchError | 500 | A batch recomputation job failed permanently after exhausting retries |
| `TRAIT_VERSION_NOT_FOUND` | TraitVersionError | 404 | The requested version number does not exist for this trait definition |
| `TRAIT_VENTURE_UNAUTHORIZED` | TraitVentureError | 403 | The requesting venture does not have permission to access or modify this trait |
| `TRAIT_TIME_WINDOW_INVALID` | TraitTimeWindowError | 422 | The specified time window configuration is invalid (e.g., negative value, unsupported unit) |
| `TRAIT_DEPENDENCY_DEPTH_EXCEEDED` | TraitDependencyCycleError | 422 | The dependency chain exceeds the configured maximum depth (`MAX_DEPENDENCY_DEPTH`) |
| `TRAIT_FORMULA_TIMEOUT` | TraitFormulaError | 408 | The custom formula expression took too long to evaluate (exceeds computation timeout) |
| `TRAIT_BATCH_ALREADY_RUNNING` | TraitBatchError | 409 | A batch job for this trait is already running; wait for it to complete or cancel it first |
| `TRAIT_DEFINITION_IMMUTABLE_FIELD` | TraitDefinitionConflictError | 422 | Attempted to change an immutable field (e.g., `slug`, `type` after values exist) |

### Error Handling Patterns

```typescript
import {
  TraitNotFoundError,
  TraitComputationError,
  TraitDependencyCycleError,
  TraitStalenessError,
  TraitFormulaError,
} from '@mcv/cdp/traits';

try {
  const value = await engine.getTraitValue('profile_123', 'nonexistent_trait');
} catch (err) {
  if (err instanceof TraitNotFoundError) {
    console.error(`Trait not found: ${err.traitSlug}`);
    // err.code === 'TRAIT_NOT_FOUND'
  }
}

try {
  const value = await engine.computeTrait('profile_123', 'total_spend_30d');
} catch (err) {
  if (err instanceof TraitComputationError) {
    console.error(`Computation failed: ${err.message}`);
    console.error(`Rule type: ${err.ruleType}`);
    console.error(`Source events: ${err.sourceEventCount}`);
    // Fallback to cached value
    const cached = await engine.getTraitValue('profile_123', 'total_spend_30d', {
      allowStale: true,
    });
  }
}

try {
  await definitionService.create({
    slug: 'bad_trait',
    dependencies: ['creates_cycle'],
    // ...
  });
} catch (err) {
  if (err instanceof TraitDependencyCycleError) {
    console.error(`Cycle detected: ${err.cycle.join(' → ')}`);
    // err.cycle: ['bad_trait', 'creates_cycle', 'some_other', 'bad_trait']
  }
}

// Staleness-aware reads
try {
  const value = await engine.getTraitValue('profile_123', 'churn_risk_score', {
    allowStale: false,  // Strict mode
  });
} catch (err) {
  if (err instanceof TraitStalenessError) {
    console.warn(`Trait ${err.traitSlug} is stale (age: ${err.ageMs}ms, threshold: ${err.thresholdMs}ms)`);
    // Trigger recomputation
    await engine.computeTrait('profile_123', 'churn_risk_score', { force: true });
  }
}
```

---

## Security

### Access Control

| Operation | Required Permission | Scope |
|---|---|---|
| Read trait definitions | `cdp.traits.definitions.read` | venture |
| Create trait definitions | `cdp.traits.definitions.write` | venture |
| Update trait definitions | `cdp.traits.definitions.write` | venture |
| Delete trait definitions | `cdp.traits.definitions.delete` | venture |
| Read trait values | `cdp.traits.values.read` | venture |
| Trigger batch recompute | `cdp.traits.batch.execute` | venture |
| Cancel batch jobs | `cdp.traits.batch.manage` | venture |
| Manage global traits | `cdp.traits.global.admin` | system |

### Multi-tenancy Isolation

- All queries are scoped by `ventureId` — a venture can never read or modify another venture's trait definitions or values.
- Global traits (ventureId = null) are readable by all ventures but only modifiable by system administrators.
- Row-level security (RLS) policies enforce tenant isolation at the database level.

```sql
-- RLS policy for trait_definitions
CREATE POLICY trait_definitions_venture_isolation ON cdp.trait_definitions
  USING (
    venture_id IS NULL  -- Global traits are readable by all
    OR venture_id = current_setting('app.venture_id', true)
  );

-- RLS policy for trait_values
CREATE POLICY trait_values_venture_isolation ON cdp.trait_values
  USING (
    venture_id IS NULL
    OR venture_id = current_setting('app.venture_id', true)
  );
```

### Formula Sandboxing

Custom formula expressions are executed in a sandboxed environment with:

- **No access** to filesystem, network, or system APIs
- **Execution timeout** of 100ms per formula evaluation
- **Memory limit** of 10MB per evaluation context
- **Allowlisted functions** only: `CLAMP`, `ABS`, `ROUND`, `FLOOR`, `CEIL`, `MIN`, `MAX`, `IF`, `DAYS_BETWEEN`, `NOW`, `COALESCE`, basic arithmetic operators
- **No loops** or recursion — formulas must be pure expressions
- **Input validation** — all variable references are validated against the declared variables before execution

### Data Sensitivity

- Trait values may contain PII-derived information (e.g., `favorite_category` implies purchase history). Apply appropriate data classification labels.
- Trait computation logs (`trait_computations` table) store before/after values — configure retention policies to comply with GDPR and data minimization requirements.
- The `TRAIT_VALUE_RETENTION_DAYS` configuration controls how long historical trait values are kept.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `CDP_TRAITS_ENABLED` | No | `true` | Master switch to enable/disable the traits module |
| `CDP_TRAITS_REALTIME_ENABLED` | No | `true` | Enable real-time incremental trait computation |
| `CDP_TRAITS_BATCH_ENABLED` | No | `true` | Enable batch computation scheduler |
| `CDP_TRAITS_CONCURRENCY` | No | `10` | Maximum concurrent trait computations per engine instance |
| `CDP_TRAITS_STALENESS_THRESHOLD_MS` | No | `3600000` | Default staleness threshold (1 hour) |
| `CDP_TRAITS_MAX_DEPENDENCY_DEPTH` | No | `5` | Maximum allowed depth of trait dependency chains |
| `CDP_TRAITS_BATCH_DEFAULT_CRON` | No | `0 2 * * *` | Default cron for batch recomputation (2 AM daily) |
| `CDP_TRAITS_FORMULA_TIMEOUT_MS` | No | `100` | Maximum execution time for custom formula expressions |
| `CDP_TRAITS_FORMULA_MEMORY_MB` | No | `10` | Maximum memory for formula evaluation sandbox |
| `CDP_TRAITS_VALUE_RETENTION_DAYS` | No | `365` | How long to retain historical trait value records |
| `CDP_TRAITS_COMPUTATION_LOG_RETENTION_DAYS` | No | `30` | How long to retain computation audit logs |
| `CDP_TRAITS_CONSUMER_GROUP` | No | `cdp-traits-incremental` | Redpanda consumer group name |
| `CDP_TRAITS_DEAD_LETTER_TOPIC` | No | `cdp.traits.dlq` | Dead letter topic for failed computations |
| `CDP_TRAITS_BATCH_PAGE_SIZE` | No | `500` | Number of profiles to process per batch page |
| `CDP_TRAITS_BATCH_MAX_RETRIES` | No | `3` | Maximum retry attempts for batch jobs |
| `REDPANDA_BROKERS` | Yes | — | Redpanda broker addresses (comma-separated) |
| `SUPABASE_DATABASE_URL` | Yes | — | PostgreSQL connection string for trait storage |

---

## Dependencies

### Internal Dependencies

| Package | Usage |
|---|---|
| `@mcv/cdp/events` | Source event stream; provides event types and Redpanda topics |
| `@mcv/cdp/profiles` | Target for trait value enrichment; profiles consume computed traits |
| `@mcv/kernel` | Core abstractions: Result types, error base classes, logging, config |
| `@mcv/db` | Drizzle ORM setup, connection pooling, migration utilities |
| `@mcv/bus` | Redpanda consumer/producer abstractions for event streaming |
| `@mcv/auth` | Permission checks and venture-scoped authorization |

### External Dependencies

| Package | Version | Usage |
|---|---|---|
| `drizzle-orm` | `^0.30.0` | Database schema definitions and queries |
| `kafkajs` | `^2.2.0` | Redpanda consumer for real-time event processing (via `@mcv/bus`) |
| `cron-parser` | `^4.9.0` | Parsing and validating cron expressions for batch schedules |
| `mathjs` | `^12.0.0` | Safe expression evaluation for custom formula rules |
| `graphlib` | `^2.1.0` | DAG operations for the trait dependency graph |
| `zod` | `^3.22.0` | Runtime validation of trait definitions and computation rules |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TraitComputer } from '@mcv/cdp/traits';
import { createTestDb, seedEvents } from '@mcv/testing';

describe('TraitComputer', () => {
  let computer: TraitComputer;
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    await seedEvents(db, 'profile_test', [
      { type: 'purchase_completed', properties: { amount: 50, category: 'Books' } },
      { type: 'purchase_completed', properties: { amount: 100, category: 'Electronics' } },
      { type: 'purchase_completed', properties: { amount: 75, category: 'Books' } },
    ]);
    computer = new TraitComputer(db);
  });

  it('counts events correctly', async () => {
    const result = await computer.compute('profile_test', {
      type: 'count',
    }, { eventTypes: ['purchase_completed'] });
    expect(result).toBe(3);
  });

  it('sums a property correctly', async () => {
    const result = await computer.compute('profile_test', {
      type: 'sum',
      property: 'amount',
    }, { eventTypes: ['purchase_completed'] });
    expect(result).toBe(225);
  });

  it('finds min value correctly', async () => {
    const result = await computer.compute('profile_test', {
      type: 'min',
      property: 'amount',
    }, { eventTypes: ['purchase_completed'] });
    expect(result).toBe(50);
  });

  it('finds max value correctly', async () => {
    const result = await computer.compute('profile_test', {
      type: 'max',
      property: 'amount',
    }, { eventTypes: ['purchase_completed'] });
    expect(result).toBe(100);
  });

  it('finds most frequent value correctly', async () => {
    const result = await computer.compute('profile_test', {
      type: 'most_frequent',
      property: 'category',
      tieBreaker: 'alphabetical',
    }, { eventTypes: ['purchase_completed'] });
    expect(result).toBe('Books'); // 2 occurrences vs 1
  });

  it('evaluates custom formulas correctly', async () => {
    const result = await computer.compute('profile_test', {
      type: 'custom_formula',
      expression: 'total / count',
      variables: {
        total: { source: 'aggregate', eventType: 'purchase_completed', property: 'amount', aggregation: 'sum' },
        count: { source: 'aggregate', eventType: 'purchase_completed', aggregation: 'count' },
      },
    }, { eventTypes: ['purchase_completed'] });
    expect(result).toBe(75); // 225 / 3
  });
});
```

### Dependency Graph Tests

```typescript
describe('DependencyGraph', () => {
  it('detects cycles', () => {
    const graph = new DependencyGraph();
    graph.addEdge({ dependentTraitSlug: 'A', dependencyTraitSlug: 'B', ... });
    graph.addEdge({ dependentTraitSlug: 'B', dependencyTraitSlug: 'C', ... });
    
    expect(graph.wouldCreateCycle('C', 'A')).toBe(true);
    expect(() => {
      graph.addEdge({ dependentTraitSlug: 'C', dependencyTraitSlug: 'A', ... });
    }).toThrow(TraitDependencyCycleError);
  });

  it('returns correct topological order', () => {
    const graph = new DependencyGraph();
    graph.addEdge({ dependentTraitSlug: 'B', dependencyTraitSlug: 'A', ... });
    graph.addEdge({ dependentTraitSlug: 'C', dependencyTraitSlug: 'A', ... });
    graph.addEdge({ dependentTraitSlug: 'D', dependencyTraitSlug: 'B', ... });
    graph.addEdge({ dependentTraitSlug: 'D', dependencyTraitSlug: 'C', ... });

    const order = graph.getComputationOrder();
    expect(order.indexOf('A')).toBeLessThan(order.indexOf('B'));
    expect(order.indexOf('A')).toBeLessThan(order.indexOf('C'));
    expect(order.indexOf('B')).toBeLessThan(order.indexOf('D'));
    expect(order.indexOf('C')).toBeLessThan(order.indexOf('D'));
  });

  it('enforces max depth', () => {
    const graph = new DependencyGraph({ maxDepth: 3 });
    graph.addEdge({ dependentTraitSlug: 'B', dependencyTraitSlug: 'A', ... });
    graph.addEdge({ dependentTraitSlug: 'C', dependencyTraitSlug: 'B', ... });
    graph.addEdge({ dependentTraitSlug: 'D', dependencyTraitSlug: 'C', ... });

    // Adding depth 4 should fail
    expect(() => {
      graph.addEdge({ dependentTraitSlug: 'E', dependencyTraitSlug: 'D', ... });
    }).toThrow(/depth exceeded/i);
  });
});
```

### Integration Tests

```typescript
describe('TraitEngine (integration)', () => {
  it('computes traits in dependency order', async () => {
    const engine = await createTestEngine();
    
    // Define dependent traits
    await engine.defineTraits([
      { slug: 'spend', rule: { type: 'sum', property: 'amount' }, dependencies: [] },
      { slug: 'count', rule: { type: 'count' }, dependencies: [] },
      { slug: 'aov', rule: { type: 'custom_formula', expression: 'spend / count' }, dependencies: ['spend', 'count'] },
    ]);

    // Seed events
    await seedEvents(db, 'profile_int', [
      { type: 'purchase', properties: { amount: 100 } },
      { type: 'purchase', properties: { amount: 200 } },
    ]);

    // Compute all
    const results = await engine.computeAllTraits('profile_int');
    
    const spend = results.find(r => r.traitSlug === 'spend');
    const count = results.find(r => r.traitSlug === 'count');
    const aov = results.find(r => r.traitSlug === 'aov');

    expect(spend?.value).toBe(300);
    expect(count?.value).toBe(2);
    expect(aov?.value).toBe(150);
  });

  it('handles real-time event processing end-to-end', async () => {
    const engine = await createTestEngine({ realtimeEnabled: true });
    
    await engine.defineTraits([
      { slug: 'page_views', rule: { type: 'count' }, sourceEvents: ['page_viewed'] },
    ]);

    // Simulate event arrival via Redpanda
    await publishTestEvent({
      type: 'page_viewed',
      profileId: 'profile_rt',
      properties: { page: '/home' },
    });

    // Wait for processing
    await waitForComputation('profile_rt', 'page_views', { timeoutMs: 5000 });

    const value = await engine.getTraitValue('profile_rt', 'page_views');
    expect(value?.value).toBe(1);
  });

  it('batch recomputes across all profiles', async () => {
    const engine = await createTestEngine();
    
    await engine.defineTraits([
      { slug: 'event_total', rule: { type: 'count' }, sourceEvents: ['*'] },
    ]);

    // Seed events for multiple profiles
    for (let i = 0; i < 100; i++) {
      await seedEvents(db, `profile_batch_${i}`, [
        { type: 'click', properties: {} },
        { type: 'click', properties: {} },
      ]);
    }

    const job = await engine.triggerBatchRecompute('event_total');
    await waitForJob(job.id, { timeoutMs: 30000 });

    const completedJob = await engine.getBatchJobStatus(job.id);
    expect(completedJob.status).toBe('completed');
    expect(completedJob.processedProfiles).toBe(100);
    expect(completedJob.failedProfiles).toBe(0);
  });
});
```

### Performance Testing Notes

- **Incremental latency target**: < 50ms from event arrival to trait value update (p99)
- **Batch throughput target**: > 10,000 profiles/minute for simple rules (count, sum)
- **Custom formula evaluation**: < 5ms per evaluation (p99)
- **Dependency resolution**: < 1ms for graphs with ≤ 50 nodes
- **Profile trait retrieval**: < 10ms for all traits of a single profile

Load tests should simulate:
1. High-throughput event streams (10,000+ events/second)
2. Large batch jobs (1M+ profiles)
3. Deep dependency chains (max depth = 5)
4. Concurrent real-time and batch processing
5. Cross-venture trait isolation under load

---

## Related Modules

| Module | Relationship |
|---|---|
| [`@mcv/cdp/events`](../events/MODULE.md) | Upstream — provides the raw event stream that traits consume |
| [`@mcv/cdp/profiles`](../profiles/MODULE.md) | Downstream — profiles are enriched with computed trait values |
| [`@mcv/cdp/segments`](../segments/MODULE.md) | Downstream — segments query trait values for audience membership |
| [`@mcv/cdp/audiences`](../audiences/MODULE.md) | Downstream — audiences use traits for targeting and personalization |
| [`@mcv/cdp/journeys`](../journeys/MODULE.md) | Downstream — journey triggers and conditions reference trait values |
| [`@mcv/analytics`](../../../../tier-5-domains/mcv-only/analytics/MODULE.md) | Downstream — analytics dashboards surface trait distributions and trends |
