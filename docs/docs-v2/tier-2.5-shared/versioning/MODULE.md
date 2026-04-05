# @mcv/shared/versioning — Entity Versioning Module

**Parent Package:** @mcv/shared  
**Tier:** 2.5 (Shared Business Utilities)  
**Classification:** PUBLISHABLE (Phase 2: Q3 2026)  
**Last Updated:** February 8, 2026

---

## Purpose

The `versioning` module provides **immutable version history, change tracking, snapshot management, diff comparison, and rollback** for any entity in the MCV.ONE ecosystem. Every data mutation — whether a product update, workflow definition change, contact field edit, or document revision — can be version-tracked through this module, providing a complete audit trail with point-in-time recovery.

**This is the universal versioning backbone. Any module that needs "undo", "history", "compare", or "rollback" delegates to this engine.**

Key capabilities:
- **Immutable version records** — every entity mutation produces a sequentially numbered, full-snapshot version
- **Deep diff engine** — structural comparison of arbitrary nested objects with dot-path change tracking
- **Named snapshots** — user-created, labeled save-points for pre-migration / pre-launch safety nets
- **Draft / publish workflow** — work-in-progress isolation with one-click promotion to a versioned record
- **Rollback & revert** — forward-only rollback (creates N+1 from any historical version; never mutates history)
- **Retention policies** — configurable per-entity-type pruning by count, age, or both
- **Field-level change tracking** — fine-grained integration with `audit_logs` for compliance queries
- **Pluggable version stores** — universal JSONB store for most entities; specialized adapters for workflows (graph snapshots) and tasks (lightweight change log)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        ENTITY VERSIONING ENGINE                                  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                         VERSION CREATION PIPELINE                          │  │
│  │                                                                            │  │
│  │  Entity Mutation ──► Change Detection ──► Diff Threshold Check             │  │
│  │         │                    │                      │                       │  │
│  │         │              Deep Diff Engine        Skip if < threshold         │  │
│  │         │              (recursive O(n))        (configurable per type)     │  │
│  │         │                    │                      │                       │  │
│  │         └────────────────────┴──────────────────────┘                       │  │
│  │                              │                                              │  │
│  │                    Create Version Record                                    │  │
│  │              (snapshot + metadata + message)                                │  │
│  │                              │                                              │  │
│  │                    Emit version.created event                               │  │
│  └──────────────────────────────┬─────────────────────────────────────────────┘  │
│                                 │                                                │
│  ┌──────────────────────────────▼─────────────────────────────────────────────┐  │
│  │                        SNAPSHOT STORE                                      │  │
│  │                                                                            │  │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐             │  │
│  │   │ Version 1 │  │ Version 2 │  │ Version 3 │  │ Version N │             │  │
│  │   │ (full)    │  │ (full)    │  │ (full)    │  │ (full)    │             │  │
│  │   │ snapshot  │  │ snapshot  │  │ snapshot  │  │ snapshot  │             │  │
│  │   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘             │  │
│  │         │               │               │               │                  │  │
│  │         └───────────────┴───────────────┴───────────────┘                  │  │
│  │                              │                                             │  │
│  │                        Diff Engine                                         │  │
│  │              (compare any two versions)                                    │  │
│  │              (O(n) recursive field walk)                                   │  │
│  └──────────────────────────────┬─────────────────────────────────────────────┘  │
│                                 │                                                │
│  ┌──────────────────────────────▼─────────────────────────────────────────────┐  │
│  │                       LIFECYCLE MANAGEMENT                                 │  │
│  │                                                                            │  │
│  │   Rollback ◄──► Revert ◄──► Draft/Publish ◄──► Retention Policy           │  │
│  │      │              │              │                    │                   │  │
│  │   Restore       Create new      Branch              Prune old              │  │
│  │   version N-1   from old        management          versions               │  │
│  │   as N+1        version         (draft→pub)         (count/age)            │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                 │                                                │
│  ┌──────────────────────────────▼─────────────────────────────────────────────┐  │
│  │                       PLUGGABLE STORE ADAPTERS                             │  │
│  │                                                                            │  │
│  │   ┌────────────────────────────────────────────────┐                       │  │
│  │   │ UniversalVersionStore (entity_versions)        │  ← default            │  │
│  │   │ Products, Contacts, Deals, Invoices, Docs, ... │                       │  │
│  │   └────────────────────────────────────────────────┘                       │  │
│  │                                                                            │  │
│  │   ┌────────────────────────────────────────────────┐                       │  │
│  │   │ WorkflowVersionStore (workflow_versions)       │  ← registered         │  │
│  │   │ Stores nodes[] / edges[] / changelog natively  │                       │  │
│  │   └────────────────────────────────────────────────┘                       │  │
│  │                                                                            │  │
│  │   ┌────────────────────────────────────────────────┐                       │  │
│  │   │ TaskHistoryStore (task_history)                │  ← registered         │  │
│  │   │ Lightweight field-level changelog, not full    │                       │  │
│  │   │ snapshots — optimized for high-frequency ops   │                       │  │
│  │   └────────────────────────────────────────────────┘                       │  │
│  │                                                                            │  │
│  │   ┌────────────────────────────────────────────────┐                       │  │
│  │   │ registerVersionStore('MyEntity', adapter)      │  ← extensible         │  │
│  │   └────────────────────────────────────────────────┘                       │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                 │                                                │
│  ┌──────────────────────────────▼─────────────────────────────────────────────┐  │
│  │                       PERSISTENCE LAYER                                    │  │
│  │                                                                            │  │
│  │   entity_versions        entity_snapshots        entity_drafts             │  │
│  │   audit_logs (changes)   task_history (tasks)    workflow_versions          │  │
│  │   audit_retention_policies (retention rules)                               │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Auto-Versioning on Entity Update

```
  Client Request (PUT /api/products/:id)
         │
         ▼
  ┌─────────────────┐
  │  tRPC Mutation   │  Validate input via Zod
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Service Layer   │  Apply business rules, prepare newData
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  DB Transaction  │  UPDATE entity SET data = newData
  │                  │  WHERE id = $entityId
  └────────┬────────┘
           │
           ├─── autoVersionMiddleware() ──────────────────┐
           │                                               │
           │    ┌────────────────────────────────┐         │
           │    │ 1. Get latest version snapshot │         │
           │    │ 2. diff(oldData, newData)      │         │
           │    │ 3. Check changeRatio vs        │         │
           │    │    diffThreshold                │         │
           │    │ 4. Filter excludeFields        │         │
           │    │ 5. If significant:             │         │
           │    │    → createVersion()           │         │
           │    │    → trackChange() per field   │         │
           │    │    → emit version.created      │         │
           │    └────────────────────────────────┘         │
           │                                               │
           ◄───────────────────────────────────────────────┘
           │
           ▼
  Return updated entity to client
```

### Data Flow: Rollback Operation

```
  Client Request: POST /api/versions/rollback
         │
         ▼
  ┌──────────────────────────┐
  │ 1. canRollback() check   │  version > 1?
  └──────────┬───────────────┘
             │ yes
             ▼
  ┌──────────────────────────┐
  │ 2. getRollbackPreview()  │  diff(currentVersion, targetVersion)
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ 3. Permission check      │  requires {entity_type}:update
  │    versioning:rollback   │  + versioning:rollback
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────────────────────┐
  │ 4. DB Transaction:                       │
  │    a) Read target version data           │
  │    b) UPDATE entity SET data = target    │
  │    c) INSERT entity_versions (N+1)       │
  │       with metadata.source = 'rollback'  │
  │       metadata.rolledBackFrom = N        │
  │       metadata.rolledBackTo = target     │
  │    d) INSERT audit_logs                  │
  │    e) emit version.rollback event        │
  └──────────┬───────────────────────────────┘
             │
             ▼
  Return RollbackResult { newVersion, diff, previousVersion, targetVersion }
```

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// VERSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createVersion,           // Create a new version for any entity
  getVersions,             // Get paginated version history for an entity
  getVersion,              // Get a specific version by number or ID
  getLatestVersion,        // Get the most recent version
  countVersions,           // Count total versions for an entity
} from './versions';

// ═══════════════════════════════════════════════════════════════════════════════
// DIFF & COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════

export {
  diff,                    // Deep diff two arbitrary objects
  diffVersions,            // Diff two specific version numbers
  diffWithCurrent,         // Diff a version against current state
  formatDiff,              // Format diff output for display
  summarizeDiff,           // Human-readable change summary
} from './diff';

// ═══════════════════════════════════════════════════════════════════════════════
// ROLLBACK & RESTORE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  rollback,                // Rollback to previous version (N → N-1 as N+1)
  revertTo,                // Revert to specific version number
  canRollback,             // Check if rollback is possible
  getRollbackPreview,      // Preview what rollback would change
} from './rollback';

// ═══════════════════════════════════════════════════════════════════════════════
// SNAPSHOTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createSnapshot,          // Create named point-in-time snapshot
  getSnapshot,             // Retrieve snapshot by ID
  listSnapshots,           // List snapshots for an entity
  deleteSnapshot,          // Remove a snapshot
  restoreFromSnapshot,     // Restore entity from snapshot
} from './snapshots';

// ═══════════════════════════════════════════════════════════════════════════════
// DRAFT / PUBLISH WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════════

export {
  saveDraft,               // Save entity as draft (not yet published)
  getDraft,                // Get current draft for an entity
  publishDraft,            // Publish draft as new version
  discardDraft,            // Discard draft without publishing
  hasDraft,                // Check if entity has unpublished draft
} from './drafts';

// ═══════════════════════════════════════════════════════════════════════════════
// RETENTION & CLEANUP
// ═══════════════════════════════════════════════════════════════════════════════

export {
  applyRetentionPolicy,    // Prune versions beyond retention limits
  getRetentionPolicy,      // Get retention config for entity type
  setRetentionPolicy,      // Configure retention per entity type
} from './retention';

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE TRACKING (Integration with audit_logs)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  trackChange,             // Record a field-level change
  getChangeHistory,        // Get change log for an entity
  getFieldHistory,         // Get history for a specific field
  getChangedBy,            // Get all changes by a specific user
} from './change-tracking';

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGGABLE STORE ADAPTERS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  registerVersionStore,    // Register a custom store for an entity type
  getVersionStore,         // Get the store adapter for an entity type
  UniversalVersionStore,   // Default JSONB-based store (entity_versions)
} from './stores';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Version,
  VersionMetadata,
  Snapshot,
  SnapshotMetadata,
  DiffResult,
  DiffEntry,
  DiffType,
  VersionConfig,
  RetentionPolicy,
  Draft,
  ChangeRecord,
  ChangeType,
  RollbackResult,
  VersionQuery,
  VersionPage,
  VersionStore,
  VersionStoreAdapter,
  CreateVersionParams,
  CreateSnapshotParams,
  TrackChangeParams,
} from './types';
```

---

## TypeScript Interfaces

### Version

```typescript
/**
 * A single version record for any entity.
 * Contains the full snapshot of the entity at that point in time.
 *
 * Versions are immutable. Once created, a version record is never modified.
 * Rollbacks create NEW versions with data copied from the target version,
 * preserving the complete history of what happened and when.
 */
interface Version {
  /** Unique version record ID (UUID v4) */
  id: string;

  /** Entity type identifier (e.g., 'Product', 'Workflow', 'Contact') */
  entityType: string;

  /** Entity ID being versioned (UUID) */
  entityId: string;

  /** Sequential version number (1, 2, 3, ...) — monotonically increasing */
  version: number;

  /**
   * Full snapshot of the entity data at this version.
   * For `storageMode: 'full'` this is the complete entity.
   * For `storageMode: 'delta'` this is only the changed fields
   * (requires reconstruction from base version).
   */
  data: Record<string, unknown>;

  /** User who created this version (null for system-generated) */
  userId: string | null;

  /** Human-readable version message (like a git commit message) */
  message: string | null;

  /** Additional metadata (source, trigger, tags, tracing) */
  metadata: VersionMetadata;

  /** Venture scope — required for RLS */
  ventureId: string;

  /** ISO timestamp of version creation (immutable) */
  createdAt: string;
}
```

### VersionMetadata

```typescript
/**
 * Metadata attached to each version record.
 * Captures provenance, tracing, and contextual information.
 */
interface VersionMetadata {
  /** What triggered this version creation */
  source: 'manual' | 'auto' | 'rollback' | 'publish' | 'import' | 'migration';

  /** Tags for categorization and filtering */
  tags?: string[];

  /** IP address of the actor (for compliance) */
  ipAddress?: string;

  /** Session ID of the actor */
  sessionId?: string;

  /** Request ID for distributed tracing */
  requestId?: string;

  /** If source === 'rollback': the version we rolled back FROM */
  rolledBackFrom?: number;

  /** If source === 'rollback': the version we rolled back TO */
  rolledBackTo?: number;

  /** If source === 'auto': the computed change ratio (0.0-1.0) */
  changeRatio?: number;

  /** If source === 'auto': list of field paths that changed */
  changedFields?: string[];

  /** If source === 'import': the import batch ID */
  importBatchId?: string;

  /** If source === 'publish': the draft ID that was published */
  draftId?: string;

  /** Arbitrary extra context (extensible) */
  [key: string]: unknown;
}
```

### CreateVersionParams

```typescript
/**
 * Parameters for creating a new version.
 * The version number is auto-assigned (max existing + 1).
 */
interface CreateVersionParams {
  /** Entity type (e.g., 'Product', 'Contact') */
  entityType: string;

  /** Entity ID (UUID) */
  entityId: string;

  /** Venture scope (required for RLS) */
  ventureId: string;

  /** Full entity data at this version */
  data: Record<string, unknown>;

  /** Actor user ID (null for system changes) */
  userId: string | null;

  /** Human-readable message describing this version */
  message?: string;

  /** Version metadata */
  metadata?: Partial<VersionMetadata>;
}
```

### DiffResult & DiffEntry

```typescript
/**
 * Result of comparing two versions or objects.
 * Contains individual field-level changes and summary statistics.
 */
interface DiffResult {
  /** Entity being compared */
  entityType: string;
  entityId: string;

  /** Version numbers compared */
  fromVersion: number;
  toVersion: number;

  /** Individual field changes (sorted by path) */
  changes: DiffEntry[];

  /** Summary statistics */
  stats: {
    /** Fields that exist in `to` but not in `from` */
    added: number;
    /** Fields that exist in `from` but not in `to` */
    removed: number;
    /** Fields that exist in both but differ in value */
    modified: number;
    /** Fields that exist in both and are identical */
    unchanged: number;
    /** Total unique field paths across both versions */
    total: number;
  };
}

/**
 * A single field-level change between two states.
 * The `path` uses dot-notation with array bracket syntax.
 */
interface DiffEntry {
  /**
   * Dot-notation path to the changed field.
   * Examples:
   *   'name'                    — top-level field
   *   'pricing.monthly.amount'  — nested object field
   *   'features[2]'             — array element
   *   'tags[0].name'            — nested in array element
   */
  path: string;

  /** Type of change */
  type: DiffType;

  /** Previous value (undefined for 'added') */
  before?: unknown;

  /** New value (undefined for 'removed') */
  after?: unknown;

  /** Data type of the field */
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
}

type DiffType = 'added' | 'removed' | 'modified';
```

### Snapshot

```typescript
/**
 * A named point-in-time snapshot.
 * Unlike auto-versions, snapshots are explicitly created and named.
 * They serve as bookmarks — "save this state, I might need it back."
 *
 * Snapshots are never pruned by retention policies when `keepSnapshots: true`.
 */
interface Snapshot {
  /** Unique snapshot ID (UUID v4) */
  id: string;

  /** Entity type */
  entityType: string;

  /** Entity ID */
  entityId: string;

  /** Human-readable snapshot name (e.g., "Before Migration", "Pre-Launch") */
  name: string;

  /** Optional description explaining why this snapshot was created */
  description?: string;

  /** Full entity data at snapshot time */
  data: Record<string, unknown>;

  /** Version number at snapshot time (for reference) */
  atVersion: number;

  /** Who created the snapshot */
  userId: string;

  /** Venture scope */
  ventureId: string;

  /** Snapshot metadata */
  metadata: SnapshotMetadata;

  /** Creation timestamp */
  createdAt: string;

  /** Optional expiry — snapshot auto-deletes after this time */
  expiresAt?: string;
}

interface SnapshotMetadata {
  /** Why was this snapshot created? */
  reason?: string;

  /** Tags for filtering */
  tags?: string[];

  /** Arbitrary extra context */
  [key: string]: unknown;
}
```

### CreateSnapshotParams

```typescript
interface CreateSnapshotParams {
  entityType: string;
  entityId: string;
  name: string;
  description?: string;
  userId: string;
  ventureId: string;
  metadata?: Partial<SnapshotMetadata>;
  /** ISO timestamp — auto-cleanup after this date */
  expiresAt?: string;
}
```

### Draft

```typescript
/**
 * An unpublished draft of an entity.
 * Drafts live separately from the version history until explicitly published.
 *
 * Constraints:
 * - One draft per user per entity (enforced by UNIQUE constraint)
 * - Drafts auto-expire after VERSION_DRAFT_EXPIRY_DAYS of inactivity
 * - Publishing a draft creates a new version with source='publish'
 */
interface Draft {
  /** Draft ID (UUID v4) */
  id: string;

  /** Entity type */
  entityType: string;

  /** Entity ID */
  entityId: string;

  /** Draft data (may be partial or complete) */
  data: Record<string, unknown>;

  /** Base version this draft was forked from */
  baseVersion: number;

  /** Who is editing this draft */
  userId: string;

  /** Venture scope */
  ventureId: string;

  /** When the draft was last saved */
  updatedAt: string;

  /** When the draft was first created */
  createdAt: string;
}
```

### RetentionPolicy

```typescript
/**
 * Retention policy for version pruning.
 * Applied per entity type — configurable by venture admins.
 *
 * The pruning algorithm:
 * 1. For each entity of this type, get all versions ordered by version DESC
 * 2. Always keep the first `minKeep` versions (regardless of age)
 * 3. If keepFirst=true, always keep version 1
 * 4. If keepSnapshots=true, never prune versions referenced by a snapshot
 * 5. From remaining: prune if version count > maxVersions
 * 6. From remaining: prune if age > retentionDays
 */
interface RetentionPolicy {
  /** Entity type this policy applies to */
  entityType: string;

  /** Maximum number of versions to keep (null = unlimited) */
  maxVersions: number | null;

  /** Maximum age in days to retain versions (null = forever) */
  retentionDays: number | null;

  /** Always keep the first version (v1)? */
  keepFirst: boolean;

  /** Always keep versions referenced by named snapshots? */
  keepSnapshots: boolean;

  /** Minimum versions to keep regardless of age or count */
  minKeep: number;
}
```

### VersionConfig

```typescript
/**
 * Configuration for auto-versioning behavior.
 * Can be set globally or overridden per entity type.
 */
interface VersionConfig {
  /** Maximum versions to retain per entity (feeds RetentionPolicy) */
  maxVersions: number;

  /** Retention period in days */
  retentionDays: number;

  /** Automatically create versions on entity update */
  autoVersion: boolean;

  /**
   * Minimum change ratio to trigger auto-version (0.0 - 1.0).
   * Calculated as: changedFields.length / totalFields.length
   * Set to 0.0 to version every change, 0.5 to require 50%+ fields changed.
   */
  diffThreshold: number;

  /** Enable draft/publish workflow for this entity type */
  enableDrafts: boolean;

  /** Fields to exclude from diff comparison (dot-notation paths) */
  excludeFields: string[];

  /**
   * Whether to store full snapshots or deltas.
   * - 'full' — complete entity data per version (fast reads, higher storage)
   * - 'delta' — only changed fields (lower storage, requires reconstruction)
   */
  storageMode: 'full' | 'delta';
}
```

### ChangeRecord

```typescript
/**
 * A field-level change record, stored in audit_logs.
 * Provides fine-grained tracking beyond version snapshots.
 *
 * Use case: "Show me every time this contact's email was changed,
 * who changed it, and when."
 */
interface ChangeRecord {
  id: string;
  entityType: string;
  entityId: string;

  /** Specific field that changed (dot-notation path) */
  fieldName: string;

  /** Previous value (serialized to string for consistent storage) */
  oldValue: string | null;

  /** New value (serialized to string) */
  newValue: string | null;

  /** Type of change */
  changeType: ChangeType;

  /** Who made the change */
  userId: string | null;

  /** Action label (e.g., 'updated', 'status_changed', 'assigned') */
  action: string;

  /** When the change occurred */
  createdAt: string;
}

type ChangeType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'assigned'
  | 'commented';
```

### TrackChangeParams

```typescript
interface TrackChangeParams {
  entityType: string;
  entityId: string;
  action: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  userId: string | null;
  ventureId: string;
  metadata?: Record<string, unknown>;
}
```

### Query & Pagination Types

```typescript
/**
 * Query parameters for retrieving version history.
 * Supports filtering, date ranges, and pagination.
 */
interface VersionQuery {
  entityType: string;
  entityId: string;

  /** Filter by version range */
  fromVersion?: number;
  toVersion?: number;

  /** Filter by user */
  userId?: string;

  /** Filter by date range (ISO strings) */
  fromDate?: string;
  toDate?: string;

  /** Filter by metadata source */
  source?: VersionMetadata['source'];

  /** Pagination */
  limit?: number;   // Default: 20, Max: 100
  offset?: number;  // Default: 0

  /** Sort order (default: 'desc' — newest first) */
  order?: 'asc' | 'desc';
}

/**
 * Paginated version list response.
 */
interface VersionPage {
  versions: Version[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

/**
 * Result of a rollback or revert operation.
 * The rollback itself creates a new version (forward-only).
 */
interface RollbackResult {
  /** The new version created by the rollback */
  newVersion: Version;

  /** What changed from current to rolled-back state */
  diff: DiffResult;

  /** Previous version number (before rollback) */
  previousVersion: number;

  /** Target version number (what we rolled back to) */
  targetVersion: number;
}
```

### VersionStore Adapter Interface

```typescript
/**
 * Pluggable version store adapter.
 * Implement this interface to provide custom storage for specific entity types.
 * The default UniversalVersionStore uses entity_versions with JSONB.
 */
interface VersionStoreAdapter {
  /** Create a new version record */
  create(params: CreateVersionParams & { version: number }): Promise<Version>;

  /** List versions with filtering and pagination */
  list(query: VersionQuery): Promise<VersionPage>;

  /** Get a specific version by number */
  get(entityType: string, entityId: string, version: number): Promise<Version | null>;

  /** Get the latest version */
  getLatest(entityType: string, entityId: string): Promise<Version | null>;

  /** Count total versions for an entity */
  count(entityType: string, entityId: string): Promise<number>;

  /** Delete versions (for retention cleanup) */
  delete(entityType: string, entityId: string, versionNumbers: number[]): Promise<number>;
}
```

---

## Database Schemas

### `entity_versions` — Universal Version Store

```sql
-- ============================================================================
-- ENTITY VERSIONS
-- Universal version store for any entity type.
-- Stores full JSONB snapshots with sequential version numbers.
-- ============================================================================

CREATE TABLE entity_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL,            -- e.g., 'Product', 'Workflow', 'Contact'
  entity_id       UUID NOT NULL,
  version         INTEGER NOT NULL,         -- Sequential: 1, 2, 3, ...
  data            JSONB NOT NULL,           -- Full entity snapshot at this version
  message         TEXT,                     -- Human-readable version note
  metadata        JSONB DEFAULT '{}',       -- VersionMetadata (source, tags, tracing)
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensures version numbers are unique per entity
  UNIQUE(entity_type, entity_id, version)
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

-- Entity lookup (most common query pattern)
CREATE INDEX entity_versions_entity_idx
  ON entity_versions(entity_type, entity_id);

-- Version history with ordering (covers ORDER BY version DESC LIMIT 1)
CREATE INDEX entity_versions_entity_version_idx
  ON entity_versions(entity_type, entity_id, version DESC);

-- Venture isolation (RLS backing index)
CREATE INDEX entity_versions_venture_idx
  ON entity_versions(venture_id);

-- User activity queries ("changes by me")
CREATE INDEX entity_versions_user_idx
  ON entity_versions(user_id);

-- Date range queries (compliance, audit)
CREATE INDEX entity_versions_created_idx
  ON entity_versions(created_at);

-- Composite: venture + entity for tenant-scoped lookups
CREATE INDEX entity_versions_venture_entity_idx
  ON entity_versions(venture_id, entity_type, entity_id);
```

### `entity_snapshots` — Named Snapshots

```sql
-- ============================================================================
-- ENTITY SNAPSHOTS
-- Named point-in-time snapshots for explicit save-points.
-- Unlike auto-versions, these are user-created and labeled.
-- ============================================================================

CREATE TABLE entity_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  name            TEXT NOT NULL,             -- Human label: "Pre-Migration", "v2.0 Launch"
  description     TEXT,                      -- Why this snapshot was created
  data            JSONB NOT NULL,            -- Full entity data at snapshot time
  at_version      INTEGER NOT NULL,          -- Version number at snapshot time
  metadata        JSONB DEFAULT '{}',        -- SnapshotMetadata
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  expires_at      TIMESTAMPTZ,               -- Auto-cleanup after this timestamp
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX entity_snapshots_entity_idx
  ON entity_snapshots(entity_type, entity_id);

CREATE INDEX entity_snapshots_venture_idx
  ON entity_snapshots(venture_id);

-- For cron-based expired snapshot cleanup
CREATE INDEX entity_snapshots_expires_idx
  ON entity_snapshots(expires_at)
  WHERE expires_at IS NOT NULL;
```

### `entity_drafts` — Unpublished Drafts

```sql
-- ============================================================================
-- ENTITY DRAFTS
-- Unpublished work-in-progress for entities.
-- One draft per user per entity (enforced by unique constraint).
-- ============================================================================

CREATE TABLE entity_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  data            JSONB NOT NULL,            -- Draft entity data
  base_version    INTEGER NOT NULL,          -- Version this draft was forked from
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One draft per user per entity
  UNIQUE(entity_type, entity_id, user_id)
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX entity_drafts_entity_idx
  ON entity_drafts(entity_type, entity_id);

CREATE INDEX entity_drafts_user_idx
  ON entity_drafts(user_id);

CREATE INDEX entity_drafts_venture_idx
  ON entity_drafts(venture_id);

-- For stale draft cleanup cron
CREATE INDEX entity_drafts_updated_idx
  ON entity_drafts(updated_at);
```

### `task_history` — Task-Specific Change Tracking

```sql
-- ============================================================================
-- TASK HISTORY
-- Lightweight field-level change log for tasks.
-- Optimized for high-frequency task updates (status changes, assignments).
-- Does NOT store full snapshots — just field deltas.
-- ============================================================================

CREATE TABLE task_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,     -- 'created', 'updated', 'status_changed', 'assigned', 'commented'
  field_name      TEXT,              -- 'status', 'priority', 'assignee_id', null for 'created'
  old_value       TEXT,              -- Previous value (serialized)
  new_value       TEXT,              -- New value (serialized)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

-- Task lookup (most common: get history for a task)
CREATE INDEX idx_task_history_task
  ON task_history(task_id);

-- User activity
CREATE INDEX idx_task_history_user
  ON task_history(user_id);

-- Chronological ordering within a task (covers ORDER BY created_at)
CREATE INDEX idx_task_history_task_created
  ON task_history(task_id, created_at);

-- Action filtering
CREATE INDEX idx_task_history_action
  ON task_history(action);
```

### `workflow_versions` — Workflow-Specific Versioning

```sql
-- ============================================================================
-- WORKFLOW VERSIONS
-- Specialized version store for workflow graph snapshots.
-- Stores nodes[] and edges[] as native JSONB arrays instead of
-- wrapping the entire workflow in a generic `data` column.
-- ============================================================================

CREATE TABLE workflow_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL,
  nodes           JSONB NOT NULL DEFAULT '[]',   -- WorkflowNode[]
  edges           JSONB NOT NULL DEFAULT '[]',   -- WorkflowEdge[]
  changelog       TEXT,                          -- Human-readable change description
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX wf_versions_workflow_idx
  ON workflow_versions(workflow_id);

CREATE INDEX wf_versions_workflow_version_idx
  ON workflow_versions(workflow_id, version);
```

### `audit_logs` — Change Tracking Integration

The versioning module integrates with the global `audit_logs` table for field-level change tracking. The relevant columns used by the versioning module:

```sql
-- Columns from audit_logs consumed/produced by versioning:
--
--   resource_type     → maps to entityType
--   resource_id       → maps to entityId
--   data_before       → previous state (JSONB) — written on version.created
--   data_after        → new state (JSONB) — written on version.created
--   changes           → AuditChange[] (field, from, to, type)
--   action            → 'create' | 'update' | 'delete' | 'restore'
--   category          → 'data' for versioned entity changes
--   is_sensitive      → versioning respects this for PII handling
--   is_retained       → versioning respects this for retention policy
--   retention_expiry  → versioning sets this based on RetentionPolicy.retentionDays
--
-- See @mcv/audit MODULE.md for complete audit_logs schema.
```

### `audit_retention_policies` — Retention Configuration

```sql
-- ============================================================================
-- AUDIT RETENTION POLICIES
-- Configurable per-venture, per-category retention rules.
-- The versioning module reads these to determine pruning behavior.
-- ============================================================================

CREATE TABLE audit_retention_policies (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id              UUID REFERENCES ventures(id) ON DELETE CASCADE,
  is_global               BOOLEAN DEFAULT false,       -- Applies to all ventures
  name                    TEXT NOT NULL,
  description             TEXT,
  category                TEXT,                         -- null = all categories
  event_types             JSONB,                        -- string[] filter
  resource_types          JSONB,                        -- string[] filter
  retention_days          INTEGER NOT NULL DEFAULT 90,
  archive_before_delete   BOOLEAN DEFAULT true,
  archive_location        TEXT,                         -- S3 bucket path
  compliance_framework    TEXT,                         -- 'GDPR', 'SOC2', 'PCI-DSS'
  is_required             BOOLEAN DEFAULT false,       -- Cannot be shortened
  is_active               BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by              UUID,
  updated_by              UUID,

  UNIQUE(venture_id, name)
);
```

---

## Drizzle ORM Schema Definitions

The database tables above are defined in Drizzle ORM. Here are the actual TypeScript schema definitions from the codebase:

### task_history (Drizzle)

```typescript
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { tasks } from './tasks';

export const taskHistory = pgTable(
  'task_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    fieldName: text('field_name'),
    oldValue: text('old_value'),
    newValue: text('new_value'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_task_history_task').on(table.taskId),
    index('idx_task_history_user').on(table.userId),
    index('idx_task_history_task_created').on(table.taskId, table.createdAt),
    index('idx_task_history_action').on(table.action),
  ]
);

export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
  task: one(tasks, {
    fields: [taskHistory.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskHistory.userId],
    references: [users.id],
  }),
}));

export type TaskHistoryEntry = typeof taskHistory.$inferSelect;
export type NewTaskHistoryEntry = typeof taskHistory.$inferInsert;
```

### workflow_versions (Drizzle)

```typescript
import { pgTable, uuid, text, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workflows } from './workflows';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;       // 100+ node types (triggers, actions, flow control)
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: ConditionGroup;
}

export const workflowVersions = pgTable(
  'workflow_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    nodes: jsonb('nodes').$type<WorkflowNode[]>().notNull().default([]),
    edges: jsonb('edges').$type<WorkflowEdge[]>().notNull().default([]),
    changelog: text('changelog'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('wf_versions_workflow_idx').on(table.workflowId),
    index('wf_versions_workflow_version_idx').on(table.workflowId, table.version),
  ]
);

export const workflowVersionsRelations = relations(workflowVersions, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowVersions.workflowId],
    references: [workflows.id],
  }),
  creator: one(users, {
    fields: [workflowVersions.createdBy],
    references: [users.id],
  }),
}));

export type WorkflowVersion = typeof workflowVersions.$inferSelect;
export type NewWorkflowVersion = typeof workflowVersions.$inferInsert;
```

---

## Entity Relationships

```
entity_versions ──────── N:1 ────► entities (any table via entity_type + entity_id)
                ──────── N:1 ────► users (user_id — who created this version)
                ──────── N:1 ────► ventures (venture_id — tenant scope)

entity_snapshots ─────── N:1 ────► entities (via entity_type + entity_id)
                 ─────── N:1 ────► users (who created the snapshot)
                 ─────── N:1 ────► ventures (tenant scope)
                 ─────── 1:1 ────► entity_versions (at_version — which version)

entity_drafts ────────── N:1 ────► entities (via entity_type + entity_id)
              ────────── N:1 ────► users (who owns this draft)
              ────────── N:1 ────► ventures (tenant scope)
              ────────── 1:1 ────► entity_versions (base_version — forked from)

audit_logs.changes[] ──► field-level change records (via resource_type + resource_id)
audit_retention_policies → retention rules (per venture, per category)

task_history ──────────► tasks (task_id — cascade on delete)
             ──────────► users (user_id — SET NULL on delete)

workflow_versions ─────► workflows (workflow_id — cascade on delete)
                  ─────► users (created_by — SET NULL on delete)
```

---

## Deep Diff Algorithm

The diff engine is the heart of the versioning module. It performs a recursive structural comparison of two arbitrary objects and produces a list of `DiffEntry` records.

### Algorithm: `diff(before, after, parentPath?)`

```
function diff(before, after, parentPath = ''):
  results = []

  allKeys = union(keys(before), keys(after))

  for each key in allKeys:
    path = parentPath ? `${parentPath}.${key}` : key
    oldVal = before[key]
    newVal = after[key]

    if oldVal is undefined:
      results.push({ path, type: 'added', after: newVal })

    else if newVal is undefined:
      results.push({ path, type: 'removed', before: oldVal })

    else if isObject(oldVal) && isObject(newVal):
      results.push(...diff(oldVal, newVal, path))    // recurse

    else if isArray(oldVal) && isArray(newVal):
      results.push(...diffArray(oldVal, newVal, path)) // array-aware

    else if oldVal !== newVal:
      results.push({ path, type: 'modified', before: oldVal, after: newVal })

  return results
```

### Array Diffing Strategy

Arrays are compared positionally (index-based) rather than by content matching. This is a deliberate design choice for performance and predictability:

```
diffArray(oldArr, newArr, parentPath):
  maxLen = max(oldArr.length, newArr.length)
  results = []

  for i = 0 to maxLen - 1:
    path = `${parentPath}[${i}]`

    if i >= oldArr.length:
      results.push({ path, type: 'added', after: newArr[i] })
    else if i >= newArr.length:
      results.push({ path, type: 'removed', before: oldArr[i] })
    else if isObject(oldArr[i]) && isObject(newArr[i]):
      results.push(...diff(oldArr[i], newArr[i], path))
    else if oldArr[i] !== newArr[i]:
      results.push({ path, type: 'modified', before: oldArr[i], after: newArr[i] })

  return results
```

### Complexity Analysis

| Input Shape | Time Complexity | Space Complexity |
|-------------|-----------------|------------------|
| Flat object (N keys) | O(N) | O(N) |
| Nested object (depth D, N keys per level) | O(N^D) | O(N^D) |
| Array of M objects with N keys each | O(M × N) | O(M × N) |
| Typical entity (< 100 fields, 3-4 levels deep) | **< 1ms** | **< 10KB** |

---

## Code Examples

### 1. Creating Versions on Entity Updates

```typescript
import { createVersion, getVersions } from '@mcv/shared/versioning';

// Create version when a product is updated
const product = await db.update(products)
  .set({ price: 2499, description: 'Updated pricing tier' })
  .where(eq(products.id, productId))
  .returning();

await createVersion({
  entityType: 'Product',
  entityId: productId,
  ventureId: venture.id,
  data: product[0],
  userId: currentUser.id,
  message: 'Updated pricing from $19.99 to $24.99',
  metadata: {
    source: 'manual',
    requestId: ctx.requestId,
  },
});

// Retrieve version history (newest first)
const history = await getVersions({
  entityType: 'Product',
  entityId: productId,
  order: 'desc',
  limit: 20,
});
// {
//   versions: [
//     { version: 3, message: 'Updated pricing...', createdAt: '...' },
//     { version: 2, message: 'Added description', createdAt: '...' },
//     { version: 1, message: 'Created', createdAt: '...' },
//   ],
//   total: 3,
//   hasMore: false,
//   offset: 0,
//   limit: 20,
// }
```

### 2. Deep Diff Between Two Objects

```typescript
import { diff, formatDiff, summarizeDiff } from '@mcv/shared/versioning';

const oldProduct = {
  name: 'Pro Plan',
  price: 1999,
  features: ['analytics', 'export'],
  limits: { users: 10, storage: '5GB' },
};

const newProduct = {
  name: 'Pro Plan',
  price: 2499,
  features: ['analytics', 'export', 'api-access'],
  limits: { users: 25, storage: '10GB' },
  tier: 'premium',
};

const changes = diff(oldProduct, newProduct);
// [
//   { path: 'price', type: 'modified', before: 1999, after: 2499, dataType: 'number' },
//   { path: 'features[2]', type: 'added', after: 'api-access', dataType: 'string' },
//   { path: 'limits.users', type: 'modified', before: 10, after: 25, dataType: 'number' },
//   { path: 'limits.storage', type: 'modified', before: '5GB', after: '10GB', dataType: 'string' },
//   { path: 'tier', type: 'added', after: 'premium', dataType: 'string' },
// ]

// Human-readable summary
const summary = summarizeDiff(changes);
// "5 changes: 3 modified, 2 added, 0 removed"

// Formatted for display
const formatted = formatDiff(changes);
// [
//   { path: 'price', label: 'Price', display: '1999 → 2499', type: 'modified' },
//   { path: 'features[2]', label: 'Features[2]', display: '+ api-access', type: 'added' },
//   { path: 'limits.users', label: 'Users', display: '10 → 25', type: 'modified' },
//   { path: 'limits.storage', label: 'Storage', display: '5GB → 10GB', type: 'modified' },
//   { path: 'tier', label: 'Tier', display: '+ premium', type: 'added' },
// ]
```

### 3. Comparing Specific Versions

```typescript
import { diffVersions, diffWithCurrent } from '@mcv/shared/versioning';

// Diff between two historical versions
const result = await diffVersions({
  entityType: 'Product',
  entityId: productId,
  fromVersion: 1,
  toVersion: 3,
});
// {
//   entityType: 'Product',
//   entityId: 'prod-123',
//   fromVersion: 1,
//   toVersion: 3,
//   changes: [
//     { path: 'price', type: 'modified', before: 999, after: 2499 },
//     { path: 'features[2]', type: 'added', after: 'api-access' },
//     // ...
//   ],
//   stats: { added: 2, removed: 0, modified: 3, unchanged: 5, total: 10 },
// }

// Diff a historical version against the current live state
const currentDiff = await diffWithCurrent({
  entityType: 'Product',
  entityId: productId,
  version: 1,
  currentData: await getProduct(productId),  // live entity
});
// Shows everything that changed from v1 to now
```

### 4. Rollback to Previous Version

```typescript
import { rollback, revertTo, canRollback, getRollbackPreview } from '@mcv/shared/versioning';

// Check if rollback is possible
const possible = await canRollback('Product', productId);
// true (version > 1)

// Preview what would change (non-destructive)
const preview = await getRollbackPreview('Product', productId);
// {
//   currentVersion: 3,
//   targetVersion: 2,
//   diff: { changes: [...], stats: { modified: 2, ... } },
// }

// Execute rollback to previous version
// Creates version 4 with data copied from version 2
const result = await rollback('Product', productId, {
  userId: currentUser.id,
  message: 'Rollback: pricing change caused checkout errors',
});
// {
//   newVersion: {
//     version: 4,
//     data: { /* version 2 data */ },
//     metadata: {
//       source: 'rollback',
//       rolledBackFrom: 3,
//       rolledBackTo: 2,
//     },
//   },
//   diff: { ... },
//   previousVersion: 3,
//   targetVersion: 2,
// }

// Or revert to a specific version (jump to any point in history)
const result2 = await revertTo('Product', productId, 1, {
  userId: currentUser.id,
  message: 'Revert to original version — starting fresh',
});
// Creates version 5 with data from version 1
```

### 5. Named Snapshots

```typescript
import {
  createSnapshot,
  listSnapshots,
  getSnapshot,
  restoreFromSnapshot,
  deleteSnapshot,
} from '@mcv/shared/versioning';

// Create a named snapshot before a risky operation
const snapshot = await createSnapshot({
  entityType: 'CatalogConfig',
  entityId: catalogId,
  name: 'Pre-Migration Backup',
  description: 'Snapshot before migrating to new pricing structure',
  userId: currentUser.id,
  ventureId: venture.id,
  metadata: { reason: 'migration', migrationId: 'mig-2026-02' },
  expiresAt: '2026-08-08T00:00:00Z',  // Keep for 6 months
});
// { id: 'snap-uuid', name: 'Pre-Migration Backup', atVersion: 12, ... }

// List all snapshots for an entity
const snapshots = await listSnapshots({
  entityType: 'CatalogConfig',
  entityId: catalogId,
});
// [
//   { id: 'snap-1', name: 'Pre-Migration Backup', atVersion: 12, createdAt: '...' },
//   { id: 'snap-2', name: 'Pre-Launch State', atVersion: 8, createdAt: '...' },
// ]

// Restore from snapshot (creates a new version, doesn't mutate history)
await restoreFromSnapshot({
  snapshotId: snapshot.id,
  userId: currentUser.id,
  message: 'Restored from Pre-Migration Backup — migration failed',
});
// Creates version 13 with data from snapshot (which was version 12 data)

// Delete a snapshot when no longer needed
await deleteSnapshot(snapshot.id, { userId: currentUser.id });
// Emits snapshot.deleted event
```

### 6. Draft / Publish Workflow

```typescript
import { saveDraft, getDraft, publishDraft, discardDraft, hasDraft } from '@mcv/shared/versioning';

// Save work-in-progress as draft (not versioned yet)
await saveDraft({
  entityType: 'Product',
  entityId: productId,
  data: {
    ...currentProduct,
    price: 2999,
    features: [...currentProduct.features, 'priority-support'],
  },
  userId: currentUser.id,
  ventureId: venture.id,
});
// Draft saved — no version created, no audit event for the entity itself

// Check if there's an unpublished draft
const draftExists = await hasDraft('Product', productId, currentUser.id);
// true

// Get the draft
const draft = await getDraft('Product', productId, currentUser.id);
// {
//   id: 'draft-uuid',
//   data: { price: 2999, features: ['...', 'priority-support'] },
//   baseVersion: 3,
//   userId: 'user-uuid',
//   updatedAt: '2026-02-08T...',
// }

// Save again (updates existing draft — UPSERT via unique constraint)
await saveDraft({
  entityType: 'Product',
  entityId: productId,
  data: { ...draft.data, price: 3499 },  // Changed mind on price
  userId: currentUser.id,
  ventureId: venture.id,
});

// Publish the draft → creates new version from draft data
const newVersion = await publishDraft({
  entityType: 'Product',
  entityId: productId,
  userId: currentUser.id,
  message: 'Published: added priority support tier',
});
// {
//   version: 4,
//   data: { price: 3499, features: ['...', 'priority-support'] },
//   metadata: { source: 'publish', draftId: 'draft-uuid' },
// }
// Draft is automatically deleted after publish

// Or discard the draft without publishing
await discardDraft('Product', productId, currentUser.id);
// Draft deleted, emits draft.discarded event
```

### 7. Field-Level Change Tracking

```typescript
import { trackChange, getChangeHistory, getFieldHistory, getChangedBy } from '@mcv/shared/versioning';

// Record field-level changes (integrates with audit_logs)
await trackChange({
  entityType: 'Contact',
  entityId: contactId,
  action: 'updated',
  fieldName: 'email',
  oldValue: 'old@example.com',
  newValue: 'new@example.com',
  userId: currentUser.id,
  ventureId: venture.id,
});

// Get all changes for an entity (paginated, newest first)
const changes = await getChangeHistory({
  entityType: 'Contact',
  entityId: contactId,
  limit: 50,
});
// [
//   { fieldName: 'email', action: 'updated', oldValue: 'old@...', newValue: 'new@...', createdAt: '...' },
//   { fieldName: 'status', action: 'status_changed', oldValue: 'lead', newValue: 'customer', ... },
//   { fieldName: null, action: 'created', oldValue: null, newValue: null, ... },
// ]

// Get history for a single field ("when was this email last changed?")
const emailChanges = await getFieldHistory({
  entityType: 'Contact',
  entityId: contactId,
  fieldName: 'email',
});
// [
//   { oldValue: 'old@example.com', newValue: 'new@example.com', userId: '...', createdAt: '...' },
//   { oldValue: null, newValue: 'old@example.com', userId: '...', createdAt: '...' },
// ]

// Get all changes by a specific user ("what did Jane change today?")
const janeChanges = await getChangedBy({
  userId: janeId,
  fromDate: '2026-02-08T00:00:00Z',
  toDate: '2026-02-08T23:59:59Z',
  limit: 100,
});
```

### 8. Task History Integration

```typescript
import { db } from '@mcv/db';
import { taskHistory } from '@mcv/db/schema';
import { eq, desc } from 'drizzle-orm';

// Record a task status change
await db.insert(taskHistory).values({
  taskId: task.id,
  userId: currentUser.id,
  action: 'status_changed',
  fieldName: 'status',
  oldValue: 'in_progress',
  newValue: 'completed',
});

// Record a task assignment
await db.insert(taskHistory).values({
  taskId: task.id,
  userId: currentUser.id,
  action: 'assigned',
  fieldName: 'assignee_id',
  oldValue: 'user-A-uuid',
  newValue: 'user-B-uuid',
});

// Get full task timeline
const history = await db
  .select()
  .from(taskHistory)
  .where(eq(taskHistory.taskId, task.id))
  .orderBy(desc(taskHistory.createdAt));

// [
//   { action: 'status_changed', fieldName: 'status', oldValue: 'in_progress', newValue: 'completed', createdAt: '...' },
//   { action: 'assigned', fieldName: 'assignee_id', oldValue: 'user-A', newValue: 'user-B', createdAt: '...' },
//   { action: 'updated', fieldName: 'priority', oldValue: 'medium', newValue: 'high', createdAt: '...' },
//   { action: 'created', fieldName: null, oldValue: null, newValue: null, createdAt: '...' },
// ]
```

### 9. Retention Policy Management

```typescript
import { setRetentionPolicy, applyRetentionPolicy, getRetentionPolicy } from '@mcv/shared/versioning';

// Configure retention for products
await setRetentionPolicy({
  entityType: 'Product',
  maxVersions: 50,         // Keep last 50 versions
  retentionDays: 365,      // Keep for 1 year
  keepFirst: true,          // Always keep v1 (the original)
  keepSnapshots: true,      // Never prune named snapshots
  minKeep: 5,              // Always keep at least 5 versions
});

// Check current policy
const policy = await getRetentionPolicy('Product');
// { entityType: 'Product', maxVersions: 50, retentionDays: 365, keepFirst: true, ... }

// Run retention cleanup (typically via cron job — @mcv/fabric/jobs)
const pruned = await applyRetentionPolicy({
  entityType: 'Product',
  dryRun: false,  // Set true to preview without deleting
});
// { prunedCount: 12, keptCount: 50, errors: [] }

// Dry run first to see what would be pruned
const preview = await applyRetentionPolicy({
  entityType: 'Product',
  dryRun: true,
});
// { prunedCount: 12, keptCount: 50, errors: [], dryRun: true }
// Nothing actually deleted
```

### 10. Auto-Versioning with Change Detection

```typescript
import { createVersion, diff } from '@mcv/shared/versioning';
import type { VersionConfig } from '@mcv/shared/versioning';

/**
 * Middleware for auto-versioning on entity update.
 * Skips version creation if changes are below the diff threshold.
 * Excludes transient fields (updatedAt, __v) from consideration.
 */
async function autoVersionMiddleware(
  entityType: string,
  entityId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  config: VersionConfig,
  ctx: { userId: string; ventureId: string },
) {
  if (!config.autoVersion) return;

  // Calculate change ratio
  const changes = diff(oldData, newData);
  const totalFields = Object.keys({ ...oldData, ...newData }).length;
  const changeRatio = changes.length / totalFields;

  // Skip if below threshold (e.g., only updatedAt changed)
  if (changeRatio < config.diffThreshold) {
    return; // Change too small to version
  }

  // Exclude configured fields (e.g., updatedAt, __v, lastAccessedAt)
  const significantChanges = changes.filter(
    (c) => !config.excludeFields.some((f) => c.path.startsWith(f))
  );

  if (significantChanges.length === 0) return;

  // Create version with auto metadata
  await createVersion({
    entityType,
    entityId,
    ventureId: ctx.ventureId,
    data: newData,
    userId: ctx.userId,
    message: `Auto-versioned: ${significantChanges.length} field(s) changed`,
    metadata: {
      source: 'auto',
      changeRatio,
      changedFields: significantChanges.map((c) => c.path),
    },
  });
}

// Usage in a service layer:
async function updateProduct(productId: string, updates: Partial<Product>, ctx: Context) {
  const oldProduct = await getProduct(productId);
  const newProduct = await db.update(products).set(updates).where(eq(products.id, productId)).returning();

  await autoVersionMiddleware('Product', productId, oldProduct, newProduct[0], {
    autoVersion: true,
    diffThreshold: 0.01,      // Version if any real field changed
    excludeFields: ['updatedAt', '__v'],
    maxVersions: 50,
    retentionDays: 365,
    enableDrafts: false,
    storageMode: 'full',
  }, ctx);

  return newProduct[0];
}
```

### 11. Workflow Versioning (Specialized Store)

```typescript
import { db } from '@mcv/db';
import { workflowVersions } from '@mcv/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { WorkflowNode, WorkflowEdge } from '@mcv/db/schema';

// Create a workflow version with graph snapshot
await db.insert(workflowVersions).values({
  workflowId: workflow.id,
  version: 3,
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger_contact_created',
      label: 'New Contact',
      position: { x: 100, y: 100 },
      config: {},
    },
    {
      id: 'email-1',
      type: 'send_email',
      label: 'Welcome Email',
      position: { x: 100, y: 250 },
      config: { templateId: 'tmpl-welcome' },
    },
    {
      id: 'wait-1',
      type: 'wait',
      label: 'Wait 3 days',
      position: { x: 100, y: 400 },
      config: { delayMs: 259200000 },
    },
  ],
  edges: [
    { id: 'e1', source: 'trigger-1', target: 'email-1' },
    { id: 'e2', source: 'email-1', target: 'wait-1' },
  ],
  changelog: 'Added welcome email step and 3-day wait',
  createdBy: currentUser.id,
});

// Query version history for a workflow
const versions = await db
  .select()
  .from(workflowVersions)
  .where(eq(workflowVersions.workflowId, workflow.id))
  .orderBy(desc(workflowVersions.version));

// Diff two workflow versions (graph-aware)
const v1 = versions.find((v) => v.version === 1);
const v3 = versions.find((v) => v.version === 3);
const nodeDiff = diff(
  { nodes: v1.nodes, edges: v1.edges },
  { nodes: v3.nodes, edges: v3.edges },
);
// Shows added nodes, modified configs, new edges, etc.
```

### 12. Versioned Update with Full Audit Trail

```typescript
import { createVersion, getLatestVersion, diff, trackChange } from '@mcv/shared/versioning';
import { createAuditLog } from '@mcv/audit';

/**
 * Complete versioned update: creates version + tracks field changes + emits audit log.
 * This is the recommended pattern for entity updates that require full audit trail.
 */
async function versionedUpdate(
  entityType: string,
  entityId: string,
  newData: Record<string, unknown>,
  ctx: { userId: string; ventureId: string; requestId: string },
) {
  // 1. Get current state
  const latest = await getLatestVersion(entityType, entityId);
  if (!latest) throw new Error('ENTITY_NOT_VERSIONED');

  // 2. Compute diff
  const changes = diff(latest.data, newData);
  if (changes.length === 0) return latest; // No changes, skip versioning

  // 3. Create new version
  const version = await createVersion({
    entityType,
    entityId,
    ventureId: ctx.ventureId,
    data: newData,
    userId: ctx.userId,
    message: `Updated ${changes.length} field(s)`,
    metadata: { source: 'manual', requestId: ctx.requestId },
  });

  // 4. Track each field change individually (for field-level history)
  await Promise.all(
    changes.map((change) =>
      trackChange({
        entityType,
        entityId,
        action: 'updated',
        fieldName: change.path,
        oldValue: JSON.stringify(change.before),
        newValue: JSON.stringify(change.after),
        userId: ctx.userId,
        ventureId: ctx.ventureId,
      })
    )
  );

  // 5. Emit audit event
  await createAuditLog({
    eventType: `${entityType.toLowerCase()}.updated`,
    category: 'data',
    action: 'update',
    actorType: 'user',
    actorId: ctx.userId,
    resourceType: entityType,
    resourceId: entityId,
    dataBefore: latest.data,
    dataAfter: newData,
    changes: changes.map((c) => ({
      field: c.path,
      from: c.before,
      to: c.after,
      type: c.type,
    })),
    ventureId: ctx.ventureId,
  });

  return version;
}
```

### 13. Bulk Version Operations

```typescript
import { createVersion, applyRetentionPolicy } from '@mcv/shared/versioning';

// Bulk version creation (e.g., during CSV import)
async function bulkImportWithVersioning(
  items: Array<{ id: string; data: Record<string, unknown> }>,
  ctx: { userId: string; ventureId: string },
) {
  const batchSize = 100; // Process in batches to avoid overwhelming DB
  const results = { succeeded: 0, failed: 0, total: items.length, errors: [] as string[] };

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map((item) =>
        createVersion({
          entityType: 'Contact',
          entityId: item.id,
          ventureId: ctx.ventureId,
          data: item.data,
          userId: ctx.userId,
          message: 'Imported from CSV',
          metadata: { source: 'import', importBatchId: `batch-${Date.now()}` },
        })
      )
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled') results.succeeded++;
      else {
        results.failed++;
        results.errors.push(r.reason?.message ?? 'Unknown error');
      }
    }
  }

  return results;
}

// Periodic cleanup via cron (registered with @mcv/fabric/jobs)
async function cleanupOldVersions() {
  const entityTypes = ['Product', 'Contact', 'Deal', 'Invoice', 'Document'];

  for (const entityType of entityTypes) {
    const result = await applyRetentionPolicy({ entityType, dryRun: false });
    console.log(`[retention] ${entityType}: pruned ${result.prunedCount}, kept ${result.keptCount}`);
  }
}
```

### 14. Version-Aware API Endpoint (tRPC Router)

```typescript
import { getVersion, getVersions, diffVersions, rollback, revertTo } from '@mcv/shared/versioning';
import { z } from 'zod';
import { protectedProcedure, router } from '@mcv/api';

export const versionRouter = router({
  // List version history (paginated)
  list: protectedProcedure
    .input(z.object({
      entityType: z.string().min(1).max(50),
      entityId: z.string().uuid(),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).default(0),
      source: z.enum(['manual', 'auto', 'rollback', 'publish', 'import', 'migration']).optional(),
    }))
    .query(async ({ input }) => {
      return getVersions({
        entityType: input.entityType,
        entityId: input.entityId,
        limit: input.limit,
        offset: input.offset,
        source: input.source,
        order: 'desc',
      });
    }),

  // Get specific version
  get: protectedProcedure
    .input(z.object({
      entityType: z.string().min(1),
      entityId: z.string().uuid(),
      version: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      const version = await getVersion(input.entityType, input.entityId, input.version);
      if (!version) throw new TRPCError({ code: 'NOT_FOUND', message: 'VERSION_NOT_FOUND' });
      return version;
    }),

  // Compare versions
  diff: protectedProcedure
    .input(z.object({
      entityType: z.string().min(1),
      entityId: z.string().uuid(),
      fromVersion: z.number().int().positive(),
      toVersion: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      if (input.fromVersion >= input.toVersion) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'INVALID_VERSION_RANGE' });
      }
      return diffVersions(input);
    }),

  // Rollback (requires versioning:rollback permission)
  rollback: protectedProcedure
    .input(z.object({
      entityType: z.string().min(1),
      entityId: z.string().uuid(),
      targetVersion: z.number().int().positive().optional(),
      message: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Permission check
      ctx.requirePermission(`${input.entityType.toLowerCase()}:update`);
      ctx.requirePermission('versioning:rollback');

      if (input.targetVersion) {
        return revertTo(input.entityType, input.entityId, input.targetVersion, {
          userId: ctx.user.id,
          message: input.message ?? `Reverted to version ${input.targetVersion}`,
        });
      }
      return rollback(input.entityType, input.entityId, {
        userId: ctx.user.id,
        message: input.message ?? 'Rolled back to previous version',
      });
    }),
});
```

### 15. React Hook for Version History UI

```typescript
import { trpc } from '@mcv/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

/**
 * React hook for version history management.
 * Provides version list, diff comparison, and rollback capabilities.
 */
function useVersionHistory(entityType: string, entityId: string) {
  const queryClient = useQueryClient();
  const [selectedVersions, setSelectedVersions] = useState<[number, number] | null>(null);

  // Paginated version list
  const versions = trpc.versions.list.useQuery({
    entityType,
    entityId,
    limit: 20,
  });

  // Diff between selected versions (only when two are selected)
  const diffResult = trpc.versions.diff.useQuery(
    {
      entityType,
      entityId,
      fromVersion: selectedVersions?.[0] ?? 0,
      toVersion: selectedVersions?.[1] ?? 0,
    },
    { enabled: selectedVersions !== null },
  );

  // Rollback mutation
  const rollbackMutation = trpc.versions.rollback.useMutation({
    onSuccess: () => {
      // Invalidate version cache so UI refreshes
      queryClient.invalidateQueries({ queryKey: ['versions'] });
      // Also invalidate the entity itself (it changed)
      queryClient.invalidateQueries({ queryKey: [entityType.toLowerCase()] });
    },
  });

  const compareVersions = useCallback((from: number, to: number) => {
    setSelectedVersions([from, to]);
  }, []);

  const rollback = useCallback(
    (targetVersion?: number, message?: string) =>
      rollbackMutation.mutateAsync({ entityType, entityId, targetVersion, message }),
    [rollbackMutation, entityType, entityId],
  );

  return {
    versions: versions.data?.versions ?? [],
    total: versions.data?.total ?? 0,
    isLoading: versions.isLoading,
    diffResult: diffResult.data ?? null,
    isDiffing: diffResult.isLoading,
    compareVersions,
    rollback,
    isRollingBack: rollbackMutation.isPending,
  };
}

// Usage in a component
function VersionHistoryPanel({ entityType, entityId }: Props) {
  const {
    versions, compareVersions, rollback,
    isRollingBack, diffResult, isDiffing,
  } = useVersionHistory(entityType, entityId);

  return (
    <div className="version-history-panel">
      <h3>Version History</h3>
      {versions.map((v) => (
        <VersionCard
          key={v.id}
          version={v}
          onCompare={() => compareVersions(v.version - 1, v.version)}
          onRollback={() => rollback(v.version, `Rolled back to v${v.version}`)}
          isRollingBack={isRollingBack}
        />
      ))}
      {diffResult && <DiffViewer diff={diffResult} />}
    </div>
  );
}
```

---

## UI Components (from @mcv/ui/diff)

The versioning module has companion UI components in `@mcv/ui/diff` for rendering diffs:

```typescript
// From @mcv/ui/diff — Diff & Comparison UI Components

export {
  DiffViewer,        // Side-by-side or inline diff display (GitHub-style)
  InlineDiff,        // Inline character-level diff for short text
  ChangeBadge,       // Color-coded badge: "added" | "modified" | "removed"
} from './diff-viewer';

export {
  ComparePanel,      // Two-column comparison panel for any two objects
  CompareRow,        // Single row in a comparison (field, before, after)
  CompareStats,      // Summary bar: "3 modified, 2 added, 0 removed"
  PropertyDiff,      // Property-level diff display
} from './compare-panel';

// Types
export type {
  DiffViewerProps,
  InlineDiffProps,
  ChangeBadgeProps,
  DiffContent,
  DiffHunk,
  DiffLine,
  DiffLineType,
  ComparePanelProps,
  CompareRowProps,
  CompareStatsProps,
  PropertyDiffProps,
  CompareItem,
  CompareField,
};
```

---

## Performance Considerations

### Storage Strategy

| Mode | Description | Pros | Cons |
|------|-------------|------|------|
| `full` (default) | Store complete entity snapshot per version | Fast reads, simple rollback, no reconstruction | Higher storage usage |
| `delta` | Store only changed fields (diff from previous) | Lower storage, efficient for large entities | Slower reads (must reconstruct from chain), complex rollback, chain corruption risk |

**Recommendation:** Use `full` mode for entities under 100KB. Consider `delta` mode only for large documents (> 100KB) with frequent small changes and infrequent historical reads.

### Latency Targets

| Operation | Target | P99 | Notes |
|-----------|--------|-----|-------|
| createVersion() | < 5ms | < 15ms | Single INSERT with auto-increment |
| getVersions() | < 3ms | < 10ms | Uses composite index |
| getLatestVersion() | < 2ms | < 5ms | Uses index with LIMIT 1 |
| diff() (< 100 fields) | < 1ms | < 3ms | In-memory, no DB |
| diff() (< 1000 fields) | < 10ms | < 25ms | In-memory, no DB |
| diffVersions() | < 8ms | < 20ms | Two reads + in-memory diff |
| rollback() | < 15ms | < 40ms | Read + INSERT in transaction |
| createSnapshot() | < 5ms | < 15ms | Single INSERT |
| applyRetentionPolicy() | < 500ms/entity | < 2s/entity | Batch DELETE with limits |
| trackChange() | < 3ms | < 8ms | Single INSERT into audit_logs |

### Indexing Strategy

| Query Pattern | Index | Notes |
|--------------|-------|-------|
| Version history for entity | `entity_versions_entity_version_idx` | Covers ORDER BY version DESC |
| Latest version | Same index, LIMIT 1 | Most critical query — must be < 2ms |
| Versions by user | `entity_versions_user_idx` | "Changes by me" queries |
| Versions by date range | `entity_versions_created_idx` | Compliance/audit queries |
| Tenant isolation | `entity_versions_venture_entity_idx` | RLS-backed composite |
| Snapshot expiry cleanup | `entity_snapshots_expires_idx` (partial) | WHERE expires_at IS NOT NULL |
| Task timeline | `idx_task_history_task_created` | Covers ORDER BY created_at |
| Stale draft cleanup | `entity_drafts_updated_idx` | Cron: WHERE updated_at < threshold |

### Recommended Limits

| Metric | Default | Recommended Max | Notes |
|--------|---------|-----------------|-------|
| Versions per entity | 50 | 200 | Configurable via retention policy |
| Snapshot data size | — | 10MB | VERSION_SNAPSHOT_MAX_SIZE_MB |
| Concurrent version writes | — | 50/s per entity | Serialized via UNIQUE constraint |
| Diff computation | — | < 50ms | For entities < 100KB |
| Retention cleanup batch | 1000 | 5000 | Avoid long-running transactions |
| Drafts per user per entity | 1 | 1 | Enforced by UNIQUE constraint |
| Snapshots per entity | — | 100 | Soft limit (admin warning) |
| Version message length | — | 500 chars | Validated in API layer |

### Query Performance Patterns

```sql
-- ✅ Fast: get latest version (uses composite index, LIMIT 1)
SELECT * FROM entity_versions
WHERE entity_type = 'Product' AND entity_id = $1
ORDER BY version DESC LIMIT 1;
-- Cost: Index Scan, < 0.1ms

-- ✅ Fast: get version range (uses composite index)
SELECT * FROM entity_versions
WHERE entity_type = 'Product' AND entity_id = $1
  AND version BETWEEN $2 AND $3
ORDER BY version ASC;
-- Cost: Index Scan, < 0.5ms

-- ✅ Fast: count versions (index-only scan)
SELECT COUNT(*) FROM entity_versions
WHERE entity_type = 'Product' AND entity_id = $1;
-- Cost: Index Only Scan, < 0.1ms

-- ⚠️ Moderate: retention cleanup (batch DELETE with subquery)
DELETE FROM entity_versions
WHERE entity_type = $1
  AND entity_id IN (
    SELECT entity_id FROM entity_versions
    WHERE entity_type = $1
    GROUP BY entity_id
    HAVING COUNT(*) > $maxVersions
  )
  AND version NOT IN (
    SELECT version FROM entity_versions
    WHERE entity_type = $1 AND entity_id = entity_versions.entity_id
    ORDER BY version DESC
    LIMIT $maxVersions
  );
-- Cost: Depends on entity count — batched to 1000 per run

-- 💡 Consider partitioning for high-volume entity types:
-- CREATE TABLE entity_versions_products
--   PARTITION OF entity_versions
--   FOR VALUES IN ('Product');
```

### Concurrency Handling

Version number assignment is serialized per entity via the UNIQUE constraint:

```typescript
// The UNIQUE(entity_type, entity_id, version) constraint prevents duplicate version numbers.
// Version assignment uses SELECT MAX(version) + 1 within a transaction:

async function nextVersionNumber(entityType: string, entityId: string): Promise<number> {
  const result = await db
    .select({ maxVersion: sql`COALESCE(MAX(version), 0)` })
    .from(entityVersions)
    .where(and(
      eq(entityVersions.entityType, entityType),
      eq(entityVersions.entityId, entityId),
    ));

  return (result[0]?.maxVersion ?? 0) + 1;
}

// If two concurrent writes race, the UNIQUE constraint causes one to fail.
// The failing write retries with the new max version.
// This is acceptable because:
// 1. Version creation is fast (< 5ms)
// 2. Contention on a single entity is rare
// 3. Retry logic handles the edge case gracefully
```

---

## Security

### Row-Level Security (RLS)

```sql
-- ── Venture Isolation ────────────────────────────────────────────────────────
-- All version data is scoped to the current venture.
-- No cross-tenant version access is possible.

-- Versions: scoped to venture
ALTER TABLE entity_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY versions_venture_isolation ON entity_versions
  USING (venture_id = current_setting('app.venture_id')::uuid);

-- Snapshots: same venture scope
ALTER TABLE entity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY snapshots_venture_isolation ON entity_snapshots
  USING (venture_id = current_setting('app.venture_id')::uuid);

-- Drafts: user can only access their own drafts within their venture
ALTER TABLE entity_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY drafts_user_isolation ON entity_drafts
  USING (
    venture_id = current_setting('app.venture_id')::uuid
    AND user_id = current_setting('app.user_id')::uuid
  );

-- Task history: scoped via task → venture relationship
-- (inherits from tasks table RLS)

-- Workflow versions: scoped via workflow → venture relationship
-- (inherits from workflows table RLS)
```

### Permissions

| Action | Required Permission | Notes |
|--------|-------------------|-------|
| View version history | `{entity_type}:read` | Any venture member with read access |
| Create version | `{entity_type}:update` | Auto-created on entity update |
| Create snapshot | `{entity_type}:update` | Named snapshot creation |
| Rollback | `{entity_type}:update` + `versioning:rollback` | Requires explicit rollback permission |
| Revert to specific version | `{entity_type}:update` + `versioning:rollback` | Same as rollback |
| Delete snapshot | `versioning:admin` | Admin only — snapshots are safety nets |
| Configure retention | `versioning:admin` | Venture admin |
| View change history | `audit:read` | Audit access |
| Save draft | `{entity_type}:update` | Own drafts only (RLS enforced) |
| Publish draft | `{entity_type}:update` | Creates new version |
| Discard draft | `{entity_type}:update` | Own drafts only |
| View other users' drafts | `versioning:admin` | Admin can see all drafts |

### Data Sensitivity

- **PII in snapshots**: Version snapshots may contain PII. The versioning module respects the `is_sensitive` flag from `audit_logs` and marks sensitive entity versions accordingly.
- **GDPR compliance**: Retention policies must comply with data regulations. The `retentionDays` setting supports GDPR right-to-erasure requirements. When an entity is deleted, all its versions cascade-delete via foreign key.
- **Draft isolation**: Drafts are strictly per-user. No other user can see or modify your draft (enforced by RLS + UNIQUE constraint).
- **Rollback auditing**: Every rollback operation is itself versioned (creates N+1 with `source: 'rollback'`), providing a complete audit trail of who rolled back what and when.
- **Immutability guarantee**: Version records are INSERT-only. No UPDATE or DELETE operations are exposed through the API (only retention cleanup can DELETE, and that's admin-only).

### Input Validation

```typescript
// All API inputs are validated via Zod schemas:

const entityTypeSchema = z.string().min(1).max(50).regex(/^[A-Za-z][A-Za-z0-9]*$/);
const entityIdSchema = z.string().uuid();
const versionNumberSchema = z.number().int().positive().max(999999);
const versionMessageSchema = z.string().max(500).optional();
const snapshotNameSchema = z.string().min(1).max(200);
const snapshotDataSchema = z.record(z.unknown()).refine(
  (data) => JSON.stringify(data).length < 10 * 1024 * 1024, // 10MB limit
  { message: 'SNAPSHOT_TOO_LARGE' },
);
```

---

## Audit Events

All versioning operations emit audit events via `@mcv/fabric/events`:

| Event | Payload | When |
|-------|---------|------|
| `version.created` | `{ entityType, entityId, version, userId, ventureId }` | New version created (any source) |
| `version.created.auto` | `{ entityType, entityId, version, changeRatio, changedFields }` | Auto-version triggered by threshold |
| `version.created.manual` | `{ entityType, entityId, version, userId, message }` | Manually created version |
| `version.rollback` | `{ entityType, entityId, fromVersion, toVersion, userId, newVersion }` | Rollback to previous version |
| `version.revert` | `{ entityType, entityId, targetVersion, newVersion, userId }` | Revert to specific version number |
| `snapshot.created` | `{ snapshotId, entityType, entityId, name, atVersion, userId }` | Named snapshot created |
| `snapshot.restored` | `{ snapshotId, entityType, entityId, newVersion, userId }` | Entity restored from snapshot |
| `snapshot.deleted` | `{ snapshotId, entityType, entityId, userId }` | Snapshot manually removed |
| `snapshot.expired` | `{ snapshotId, entityType, entityId }` | Snapshot auto-cleaned past expiry |
| `draft.saved` | `{ entityType, entityId, userId, baseVersion }` | Draft saved or updated |
| `draft.published` | `{ entityType, entityId, userId, newVersion, draftId }` | Draft published as new version |
| `draft.discarded` | `{ entityType, entityId, userId, draftId }` | Draft discarded without publishing |
| `draft.expired` | `{ entityType, entityId, userId, draftId }` | Draft auto-cleaned after inactivity |
| `retention.applied` | `{ entityType, prunedCount, keptCount, ventureId }` | Retention policy cleanup completed |
| `retention.configured` | `{ entityType, policy, userId, ventureId }` | Retention policy created or updated |
| `change.tracked` | `{ entityType, entityId, fieldName, action, userId }` | Field-level change recorded |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VERSION_DEFAULT_MAX_VERSIONS` | No | `50` | Default max versions to keep per entity |
| `VERSION_DEFAULT_RETENTION_DAYS` | No | `365` | Default retention period in days |
| `VERSION_AUTO_VERSION_ENABLED` | No | `true` | Enable auto-versioning globally |
| `VERSION_DIFF_THRESHOLD` | No | `0.01` | Minimum change ratio for auto-version (0.0-1.0) |
| `VERSION_STORAGE_MODE` | No | `full` | Default storage mode (`full` or `delta`) |
| `VERSION_SNAPSHOT_MAX_SIZE_MB` | No | `10` | Maximum snapshot data size in megabytes |
| `VERSION_DRAFT_EXPIRY_DAYS` | No | `30` | Auto-expire stale drafts after N days of inactivity |
| `VERSION_RETENTION_BATCH_SIZE` | No | `1000` | Batch size for retention cleanup operations |
| `VERSION_EXCLUDE_FIELDS` | No | `updatedAt,__v` | Comma-separated fields to exclude from auto-diff |
| `VERSION_SNAPSHOT_WARN_COUNT` | No | `100` | Log warning when entity exceeds this snapshot count |
| `VERSION_CLEANUP_CRON` | No | `0 3 * * *` | Cron schedule for retention cleanup (3 AM daily) |
| `VERSION_DRAFT_CLEANUP_CRON` | No | `0 4 * * *` | Cron schedule for stale draft cleanup (4 AM daily) |
| `VERSION_SNAPSHOT_CLEANUP_CRON` | No | `0 5 * * *` | Cron schedule for expired snapshot cleanup (5 AM daily) |

---

## Error Codes

| Code | Message | HTTP | When |
|------|---------|------|------|
| `VERSION_NOT_FOUND` | Version not found | 404 | Requested version number doesn't exist for this entity |
| `ENTITY_NOT_VERSIONED` | Entity has no version history | 404 | No versions exist for this entity (never been versioned) |
| `SNAPSHOT_NOT_FOUND` | Snapshot not found | 404 | Snapshot ID doesn't exist or belongs to another venture |
| `DRAFT_NOT_FOUND` | No draft found | 404 | No draft exists for this entity/user combination |
| `DRAFT_CONFLICT` | Draft already exists | 409 | Attempt to create second draft (one per user per entity) |
| `ROLLBACK_IMPOSSIBLE` | Cannot rollback (only one version) | 400 | Entity only has version 1 — nothing to roll back to |
| `VERSION_CONFLICT` | Version number already exists | 409 | Concurrent version creation race condition (retry) |
| `SNAPSHOT_TOO_LARGE` | Snapshot data exceeds size limit | 413 | Snapshot data > `VERSION_SNAPSHOT_MAX_SIZE_MB` |
| `RETENTION_IN_PROGRESS` | Retention cleanup already running | 409 | Another cleanup job is in progress for this entity type |
| `INVALID_VERSION_RANGE` | fromVersion must be < toVersion | 400 | Invalid diff range — `fromVersion` >= `toVersion` |
| `ENTITY_TYPE_UNKNOWN` | Unknown entity type | 400 | Entity type not registered in the version store registry |
| `PERMISSION_DENIED` | Insufficient permissions for rollback | 403 | Missing `versioning:rollback` permission |
| `DRAFT_BASE_OUTDATED` | Draft base version is outdated | 409 | Entity was versioned since draft was created (conflict) |
| `SNAPSHOT_LIMIT_EXCEEDED` | Too many snapshots for this entity | 400 | Entity exceeds `VERSION_SNAPSHOT_WARN_COUNT` |

---

## Dependencies

| Dependency | Tier | Purpose |
|------------|------|---------|
| `@mcv/kernel` | 0 | UUID generation, error types, logging, environment config |
| `@mcv/fabric/db` | 2 | Drizzle ORM, database connection, transactions |
| `@mcv/fabric/events` | 2 | Audit event emission (`version.created`, `snapshot.restored`, etc.) |
| `@mcv/fabric/jobs` | 2 | Scheduled retention/draft/snapshot cleanup cron jobs |
| `@mcv/identity/permissions` | 3 | Permission checks for rollback and admin operations |
| `@mcv/audit` | 2.5 | Integration with `audit_logs` table for field-level change tracking |
| `drizzle-orm` | — | Database ORM (transitive via `@mcv/fabric/db`) |
| `zod` | — | Input validation for all API endpoints |

---

## Integration Points

| Consumer | Usage | Direction |
|----------|-------|-----------|
| `@mcv/shared/workflows` | Workflow version history via `workflow_versions` table | consumes |
| `@mcv/commerce` | Product/catalog versioning, price history tracking | consumes |
| `@mcv/crm` | Contact/deal field change tracking, relationship timeline | consumes |
| `@mcv/content` | Document revision history, content versioning | consumes |
| `@mcv/finance` | Invoice/quote version audit trail, compliance | consumes |
| `@mcv/projects` | Task history via `task_history` table, sprint change log | consumes |
| `@mcv/audit` | Bidirectional — versioning writes to `audit_logs`, audit reads from versions | bidirectional |
| `@mcv/ui/diff` | DiffViewer, ComparePanel, ChangeBadge display components | consumes (UI) |
| Admin Dashboard | Version history UI, diff viewer, rollback controls | consumes (UI) |

---

## Testing Notes

### Unit Testing

```typescript
import { diff, summarizeDiff, formatDiff } from '@mcv/shared/versioning';

describe('Deep Diff Engine', () => {
  it('should detect added fields', () => {
    const changes = diff({ a: 1 }, { a: 1, b: 2 });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      path: 'b',
      type: 'added',
      after: 2,
      dataType: 'number',
    });
  });

  it('should detect removed fields', () => {
    const changes = diff({ a: 1, b: 2 }, { a: 1 });
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe('removed');
    expect(changes[0].before).toBe(2);
  });

  it('should detect modified fields', () => {
    const changes = diff({ price: 1999 }, { price: 2499 });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      path: 'price',
      type: 'modified',
      before: 1999,
      after: 2499,
    });
  });

  it('should handle nested object diffs', () => {
    const changes = diff(
      { config: { limits: { users: 10, storage: '5GB' } } },
      { config: { limits: { users: 25, storage: '5GB' } } },
    );
    expect(changes).toHaveLength(1);
    expect(changes[0].path).toBe('config.limits.users');
  });

  it('should handle array element additions', () => {
    const changes = diff(
      { features: ['a', 'b'] },
      { features: ['a', 'b', 'c'] },
    );
    expect(changes).toHaveLength(1);
    expect(changes[0].path).toBe('features[2]');
    expect(changes[0].type).toBe('added');
  });

  it('should return empty array for identical objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const changes = diff(obj, structuredClone(obj));
    expect(changes).toHaveLength(0);
  });

  it('should handle null values correctly', () => {
    const changes = diff({ a: null }, { a: 'hello' });
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe('modified');
    expect(changes[0].before).toBeNull();
  });

  it('should generate human-readable summary', () => {
    const changes = diff(
      { a: 1, b: 2 },
      { a: 1, b: 3, c: 4 },
    );
    const summary = summarizeDiff(changes);
    expect(summary).toBe('2 changes: 1 modified, 1 added, 0 removed');
  });
});

describe('Retention Policy', () => {
  it('should always keep minKeep versions', async () => {
    // Setup: entity with 100 versions, policy: maxVersions=10, minKeep=5
    const result = await applyRetentionPolicy({
      entityType: 'TestEntity',
      dryRun: true,
    });
    expect(result.keptCount).toBeGreaterThanOrEqual(5);
  });

  it('should never prune version 1 when keepFirst=true', async () => {
    // Setup: entity with 100 versions, policy: maxVersions=5, keepFirst=true
    const result = await applyRetentionPolicy({
      entityType: 'TestEntity',
      dryRun: false,
    });
    const remaining = await getVersions({
      entityType: 'TestEntity',
      entityId: testEntityId,
      order: 'asc',
      limit: 1,
    });
    expect(remaining.versions[0].version).toBe(1);
  });

  it('should preserve snapshot-referenced versions', async () => {
    // Create snapshot at version 5
    await createSnapshot({ entityType: 'TestEntity', entityId: testEntityId, name: 'test', userId: 'u1', ventureId: 'v1' });
    // Apply retention with keepSnapshots=true
    const result = await applyRetentionPolicy({ entityType: 'TestEntity', dryRun: false });
    // Version 5 should still exist
    const v5 = await getVersion('TestEntity', testEntityId, 5);
    expect(v5).not.toBeNull();
  });
});

describe('Rollback', () => {
  it('should reject rollback on single-version entity', async () => {
    const canDo = await canRollback('TestEntity', singleVersionEntityId);
    expect(canDo).toBe(false);

    await expect(
      rollback('TestEntity', singleVersionEntityId, { userId: 'u1' })
    ).rejects.toThrow('ROLLBACK_IMPOSSIBLE');
  });

  it('should create new version with historical data', async () => {
    // Entity at version 3 with data { price: 2499 }
    // Version 2 had data { price: 1999 }
    const result = await rollback('TestEntity', testEntityId, { userId: 'u1' });

    expect(result.newVersion.version).toBe(4);
    expect(result.newVersion.data.price).toBe(1999);
    expect(result.newVersion.metadata.source).toBe('rollback');
    expect(result.newVersion.metadata.rolledBackFrom).toBe(3);
    expect(result.newVersion.metadata.rolledBackTo).toBe(2);
  });

  it('should support revert to any historical version', async () => {
    const result = await revertTo('TestEntity', testEntityId, 1, { userId: 'u1' });
    expect(result.targetVersion).toBe(1);
    expect(result.newVersion.version).toBe(5); // Next sequential
  });
});

describe('Draft / Publish', () => {
  it('should enforce one draft per user per entity', async () => {
    await saveDraft({ entityType: 'T', entityId: 'e1', data: {}, userId: 'u1', ventureId: 'v1' });
    // Second save should update, not create duplicate
    await saveDraft({ entityType: 'T', entityId: 'e1', data: { a: 1 }, userId: 'u1', ventureId: 'v1' });
    const draft = await getDraft('T', 'e1', 'u1');
    expect(draft?.data).toEqual({ a: 1 });
  });

  it('should create version on publish and delete draft', async () => {
    await saveDraft({ entityType: 'T', entityId: 'e1', data: { published: true }, userId: 'u1', ventureId: 'v1' });
    const version = await publishDraft({ entityType: 'T', entityId: 'e1', userId: 'u1' });
    expect(version.metadata.source).toBe('publish');
    expect(version.data.published).toBe(true);

    const draft = await getDraft('T', 'e1', 'u1');
    expect(draft).toBeNull(); // Draft was deleted
  });
});
```

### Integration Testing

```typescript
describe('Version-Aware Entity Update (E2E)', () => {
  it('should create version, track changes, and emit audit event', async () => {
    // 1. Create initial entity
    const entity = await createProduct({ name: 'Widget', price: 999 });

    // 2. Create initial version
    await createVersion({
      entityType: 'Product',
      entityId: entity.id,
      ventureId: testVentureId,
      data: entity,
      userId: testUserId,
      message: 'Created',
      metadata: { source: 'manual' },
    });

    // 3. Update entity with versioned update
    const updated = await versionedUpdate(
      'Product',
      entity.id,
      { ...entity, price: 1499, name: 'Widget Pro' },
      { userId: testUserId, ventureId: testVentureId, requestId: 'req-1' },
    );

    // 4. Verify version was created
    expect(updated.version).toBe(2);

    // 5. Verify diff is correct
    const diffResult = await diffVersions({
      entityType: 'Product',
      entityId: entity.id,
      fromVersion: 1,
      toVersion: 2,
    });
    expect(diffResult.stats.modified).toBe(2); // price + name

    // 6. Verify field-level changes were tracked
    const priceHistory = await getFieldHistory({
      entityType: 'Product',
      entityId: entity.id,
      fieldName: 'price',
    });
    expect(priceHistory).toHaveLength(1);
    expect(priceHistory[0].oldValue).toBe('999');
    expect(priceHistory[0].newValue).toBe('1499');

    // 7. Rollback and verify
    const rollbackResult = await rollback('Product', entity.id, {
      userId: testUserId,
      message: 'Reverting price change',
    });
    expect(rollbackResult.newVersion.version).toBe(3);
    expect(rollbackResult.newVersion.data.price).toBe(999);
  });

  it('should handle concurrent version creation gracefully', async () => {
    const entity = await createProduct({ name: 'Test' });
    await createVersion({
      entityType: 'Product',
      entityId: entity.id,
      ventureId: testVentureId,
      data: entity,
      userId: testUserId,
      metadata: { source: 'manual' },
    });

    // Simulate concurrent updates
    const results = await Promise.allSettled([
      createVersion({
        entityType: 'Product',
        entityId: entity.id,
        ventureId: testVentureId,
        data: { ...entity, price: 100 },
        userId: 'user-a',
        metadata: { source: 'manual' },
      }),
      createVersion({
        entityType: 'Product',
        entityId: entity.id,
        ventureId: testVentureId,
        data: { ...entity, price: 200 },
        userId: 'user-b',
        metadata: { source: 'manual' },
      }),
    ]);

    // Both should succeed (one gets v2, other gets v3 after retry)
    const succeeded = results.filter((r) => r.status === 'fulfilled');
    expect(succeeded.length).toBe(2);

    const versions = await getVersions({
      entityType: 'Product',
      entityId: entity.id,
      order: 'asc',
    });
    expect(versions.total).toBe(3); // v1 + v2 + v3
  });
});
```

---

## Migration Notes

### Entity-Specific vs Universal Stores

Some entity types use **specialized version tables** optimized for their data shape:

| Entity Type | Store | Table | Reason |
|-------------|-------|-------|--------|
| **Workflows** | `WorkflowVersionStore` | `workflow_versions` | Stores `nodes[]`/`edges[]` as native JSONB arrays for efficient graph queries |
| **Tasks** | `TaskHistoryStore` | `task_history` | Lightweight field-level changelog — tasks change frequently but don't need full snapshots |
| **All others** | `UniversalVersionStore` | `entity_versions` | Generic JSONB snapshot — works for any entity shape |

### Adding a New Specialized Store

The versioning module's API abstracts over these backends, routing to the appropriate table based on `entityType`. To add a new specialized backend, register a `VersionStoreAdapter`:

```typescript
import { registerVersionStore } from '@mcv/shared/versioning';
import type { VersionStoreAdapter } from '@mcv/shared/versioning';

// Example: Register a specialized store for "Document" entities
// that uses a dedicated table with full-text search columns.
const documentStore: VersionStoreAdapter = {
  async create(params) {
    return db.insert(documentVersions).values({
      documentId: params.entityId,
      version: params.version,
      content: params.data.content as string,
      metadata: params.data.metadata,
      fullText: params.data.content as string, // searchable column
      userId: params.userId,
    }).returning();
  },
  async list(query) { /* ... */ },
  async get(entityType, entityId, version) { /* ... */ },
  async getLatest(entityType, entityId) { /* ... */ },
  async count(entityType, entityId) { /* ... */ },
  async delete(entityType, entityId, versionNumbers) { /* ... */ },
};

registerVersionStore('Document', documentStore);

// Now all versioning API calls with entityType='Document'
// will route through this adapter instead of the universal store.
```

### Migrating from Legacy Version Tracking

If an existing module was tracking versions manually (e.g., a `product_history` table), migrate to the universal versioning module:

```typescript
// 1. Bulk-insert existing history into entity_versions
const legacyHistory = await db.select().from(productHistory).orderBy(asc(productHistory.createdAt));

for (let i = 0; i < legacyHistory.length; i++) {
  await createVersion({
    entityType: 'Product',
    entityId: legacyHistory[i].productId,
    ventureId: legacyHistory[i].ventureId,
    data: legacyHistory[i].snapshot,
    userId: legacyHistory[i].changedBy,
    message: `Migrated from legacy history (version ${i + 1})`,
    metadata: { source: 'migration' },
  });
}

// 2. Drop legacy table (after verification)
// ALTER TABLE product_history RENAME TO product_history_deprecated;
```

---

## Constants

```typescript
// Default configuration values (overridable via environment variables)

export const VERSION_DEFAULTS = {
  maxVersions: 50,
  retentionDays: 365,
  autoVersion: true,
  diffThreshold: 0.01,
  storageMode: 'full' as const,
  snapshotMaxSizeMb: 10,
  draftExpiryDays: 30,
  retentionBatchSize: 1000,
  excludeFields: ['updatedAt', '__v'],
  snapshotWarnCount: 100,
} as const;

export const VERSION_SOURCES = [
  'manual',
  'auto',
  'rollback',
  'publish',
  'import',
  'migration',
] as const;

export const CHANGE_TYPES = [
  'created',
  'updated',
  'deleted',
  'status_changed',
  'assigned',
  'commented',
] as const;

export const TASK_HISTORY_ACTIONS = [
  'created',
  'updated',
  'status_changed',
  'assigned',
  'commented',
  'priority_changed',
  'due_date_changed',
] as const;
```

---

*@mcv/shared/versioning — Entity Versioning Module*
