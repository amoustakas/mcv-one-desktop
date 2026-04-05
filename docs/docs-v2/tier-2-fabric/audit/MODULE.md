# @mcv/fabric/audit — Audit Logging Module

**Parent Package:** @mcv/fabric  
**Tier:** 2 (Infrastructure Services)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `audit` module provides comprehensive audit logging and compliance infrastructure for the MCV ecosystem. It captures every significant action across the platform — authentication events, data operations, administrative actions, and system events — with full context for security monitoring, compliance reporting, and forensic analysis.

**Every enterprise deployment requires audit logging. This module is the foundation for SOC 2, GDPR, HIPAA, and PCI-DSS compliance.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGGING API
// ═══════════════════════════════════════════════════════════════════════════════

// Core audit operations
export { createAuditEntry, logSuccess, logFailure } from './server/services/audit-service';
export { computeChanges } from './server/services/audit-service';

// Query operations
export { queryAuditLogs, getAuditLogById } from './server/services/audit-service';
export { getResourceTimeline, getUserTimeline } from './server/services/audit-service';
export { getAuditStats } from './server/services/audit-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// Request-scoped audit context
export { 
  setAuditContext, 
  getAuditContext, 
  clearAuditContext,
  withAuditContext,
  withAuditLogging,
} from './server/services/audit-service';

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

export { autoAuditMiddleware } from './server/middleware/auto-audit';

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT & RETENTION SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  exportAuditLogs,
  getExportStatus,
  listExports,
} from './server/services/export-service';

export {
  applyRetentionPolicies,
  getRetentionPolicies,
  updateRetentionPolicy,
} from './server/services/retention-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export { AUDIT_CATEGORIES, CATEGORY_OPTIONS, AUDIT_CATEGORY_KEYS } from './constants/categories';
export { AUDIT_ACTIONS, ACTION_OPTIONS, AUDIT_ACTION_KEYS } from './constants/actions';
export { 
  DEFAULT_RETENTION_POLICIES, 
  COMPLIANCE_FRAMEWORKS,
  type ComplianceFramework,
} from './constants/retention-policies';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { AuditLogTable } from './client/components/audit-log-table';
export { AuditFilters } from './client/components/audit-filters';
export { AuditTimeline } from './client/components/audit-timeline';
export { AuditDetailModal } from './client/components/audit-detail-modal';
export { AuditStatsCard } from './client/components/audit-stats-card';
export { AuditExport } from './client/components/audit-export';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export { useAuditLogs } from './client/hooks/use-audit-logs';
export { useAuditStats } from './client/hooks/use-audit-stats';
export { useActivityTimeline } from './client/hooks/use-activity-timeline';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  AuditLog,
  NewAuditLog,
  AuditChange,
  AuditCategory,
  AuditAction,
  AuditActorType,
  AuditResult,
  AuditRetentionPolicy,
  NewAuditRetentionPolicy,
  AuditExport,
  NewAuditExport,
  AuditExportFilters,
  CreateAuditEntryInput,
  AuditContext,
  AuditLogWithActor,
  ActivityTimelineItem,
  AuditStats,
  AuditLogFilters,
  AuditLogPagination,
  AuditLogSorting,
  AuditLogQueryResult,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AUDIT MODULE ARCHITECTURE                              │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           APPLICATION LAYER                                  │ │
│  │                                                                              │ │
│  │  ┌──────────────────────────────────────────────────────────────────────┐   │ │
│  │  │                       Audit Context (AsyncLocalStorage)               │   │ │
│  │  │                                                                       │   │ │
│  │  │  • Request-scoped context (userId, ventureId, sessionId, ip)          │   │ │
│  │  │  • Automatically propagated through async operations                  │   │ │
│  │  │  • Thread-safe for concurrent requests                                │   │ │
│  │  └──────────────────────────────────────────────────────────────────────┘   │ │
│  │                                    │                                         │ │
│  │  ┌─────────────────┐  ┌────────────▼───────────┐  ┌────────────────────┐    │ │
│  │  │  Auto-Audit     │  │    Audit Service       │  │   Export Service   │    │ │
│  │  │  Middleware     │  │                        │  │                    │    │ │
│  │  │                 │  │  • createAuditEntry()  │  │  • CSV/JSON export │    │ │
│  │  │  Captures all   │──▶  • logSuccess()        │  │  • Async generation│    │ │
│  │  │  mutations      │  │  • logFailure()        │  │  • Signed download │    │ │
│  │  │  automatically  │  │  • queryAuditLogs()    │  │                    │    │ │
│  │  └─────────────────┘  └────────────┬───────────┘  └────────────────────┘    │ │
│  │                                    │                                         │ │
│  └────────────────────────────────────┼─────────────────────────────────────────┘ │
│                                       │                                           │
│  ┌────────────────────────────────────┼─────────────────────────────────────────┐ │
│  │                           STORAGE LAYER                                       │ │
│  │                                    │                                          │ │
│  │    ┌───────────────────────────────▼───────────────────────────────────┐     │ │
│  │    │                       PostgreSQL                                   │     │ │
│  │    │                                                                    │     │ │
│  │    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │     │ │
│  │    │  │   audit_logs    │  │  audit_exports  │  │   retention     │   │     │ │
│  │    │  │                 │  │                 │  │   _policies     │   │     │ │
│  │    │  │  • eventType    │  │  • format       │  │                 │   │     │ │
│  │    │  │  • category     │  │  • filters      │  │  • category     │   │     │ │
│  │    │  │  • action       │  │  • status       │  │  • retentionDays│   │     │ │
│  │    │  │  • actor*       │  │  • filePath     │  │  • compliance   │   │     │ │
│  │    │  │  • resource*    │  │                 │  │                 │   │     │ │
│  │    │  │  • changes      │  │                 │  │                 │   │     │ │
│  │    │  │  • metadata     │  │                 │  │                 │   │     │ │
│  │    │  └─────────────────┘  └─────────────────┘  └─────────────────┘   │     │ │
│  │    │                                                                    │     │ │
│  │    │                    Optimized Indexes:                              │     │ │
│  │    │  • timestamp, actor_id, venture_id, resource (type+id)            │     │ │
│  │    │  • Composite: venture_id + timestamp, actor_id + timestamp        │     │ │
│  │    └────────────────────────────────────────────────────────────────────┘     │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                          RETENTION & COMPLIANCE                                │ │
│  │                                                                               │ │
│  │    ┌────────────────────────────────────────────────────────────────────┐    │ │
│  │    │               Retention Policy Engine (Cron)                        │    │ │
│  │    │                                                                     │    │ │
│  │    │  • Runs daily at 3:00 AM UTC                                        │    │ │
│  │    │  • Applies per-category retention policies                          │    │ │
│  │    │  • Handles compliance framework requirements (SOC2, GDPR, HIPAA)    │    │ │
│  │    │  • Soft-deletes first, hard-deletes after 30-day grace period       │    │ │
│  │    │  • Creates retention audit trail (meta-audit)                       │    │ │
│  │    └────────────────────────────────────────────────────────────────────┘    │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Event Categories

The audit system organizes events into categories for filtering, retention policies, and compliance mapping:

| Category | Description | Default Retention | Compliance |
|----------|-------------|-------------------|------------|
| `authentication` | Login, logout, MFA, session events | 365 days | SOC 2 |
| `authorization` | Permission grants, role changes, access decisions | 365 days | SOC 2 |
| `data` | CRUD operations on business entities | 90 days | GDPR |
| `admin` | Administrative actions, configuration changes | 730 days (2 years) | SOC 2 |
| `compliance` | Audit exports, retention actions, consent changes | 2555 days (7 years) | GDPR, HIPAA |
| `security` | Failed logins, suspicious activity, security events | 365 days | SOC 2 |
| `billing` | Invoices, payments, subscription changes | 2555 days (7 years) | PCI-DSS |
| `system` | Health checks, maintenance, deployments | 30 days | — |
| `integration` | Third-party API calls, webhooks, syncs | 90 days | — |

---

## Event Actions

Each audit entry records a specific action type:

| Action | Past Tense | Icon | Description |
|--------|------------|------|-------------|
| `create` | created | plus | New resource created |
| `read` | viewed | eye | Resource accessed/viewed |
| `update` | updated | edit | Resource modified |
| `delete` | deleted | trash | Resource removed |
| `execute` | executed | play | Operation/workflow executed |
| `approve` | approved | check | Approval workflow action |
| `reject` | rejected | x | Rejection workflow action |
| `login` | logged in | log-in | User authentication |
| `logout` | logged out | log-out | User session ended |
| `mfa_verify` | verified MFA | smartphone | MFA challenge completed |
| `password_change` | changed password | lock | Password updated |
| `permission_grant` | granted permission | user-check | Permission added |
| `permission_revoke` | revoked permission | user-x | Permission removed |
| `export` | exported | download | Data exported |
| `import` | imported | upload | Data imported |
| `archive` | archived | archive | Resource archived |
| `restore` | restored | rotate-ccw | Resource restored |

---

## Core Interfaces

### CreateAuditEntryInput

```typescript
interface CreateAuditEntryInput {
  // Event classification
  eventType: string;                    // e.g., "deals.created", "user.login"
  category: AuditCategory;              // 'authentication' | 'data' | 'admin' | ...
  action: AuditAction;                  // 'create' | 'update' | 'delete' | ...

  // Actor (auto-populated from context if not provided)
  actorType?: AuditActorType;           // 'user' | 'system' | 'agent' | 'api_key' | ...
  actorId?: string;                     // User ID or service identifier
  actorEmail?: string;                  // For display purposes
  actorDisplayName?: string;            // For display purposes

  // Request context (auto-populated from context)
  ipAddress?: string;                   // Client IP address (masked in logs)
  userAgent?: string;                   // Browser/client identifier
  sessionId?: string;                   // Session ID for correlation
  requestId?: string;                   // Unique request ID for tracing

  // Scope
  ventureId?: string;                   // Multi-tenant scope

  // Resource information
  resourceType?: string;                // e.g., "deal", "contact", "user"
  resourceId?: string;                  // UUID of affected resource
  resourceName?: string;                // Human-readable name

  // Change tracking
  dataBefore?: Record<string, unknown>; // State before operation
  dataAfter?: Record<string, unknown>;  // State after operation
  changes?: AuditChange[];              // Computed field-level changes

  // Additional context
  metadata?: Record<string, unknown>;   // Custom metadata
  reason?: string;                      // Reason for action (optional)
  tags?: string[];                      // Custom tags for filtering

  // Result
  result?: AuditResult;                 // 'success' | 'failure' | 'partial' | 'pending'
  errorCode?: string;                   // Error code if failed
  errorMessage?: string;                // Error message if failed

  // Performance
  durationMs?: number;                  // Operation duration in milliseconds

  // Compliance
  isSensitive?: boolean;                // Contains PII? (affects retention)
}
```

### AuditContext

```typescript
interface AuditContext {
  userId?: string;                      // Current user ID
  userEmail?: string;                   // Current user email
  userDisplayName?: string;             // Current user display name
  ventureId?: string;                   // Current venture context
  sessionId?: string;                   // Session identifier
  requestId?: string;                   // Request identifier
  ipAddress?: string;                   // Client IP address
  userAgent?: string;                   // Client user agent
}
```

### AuditChange

```typescript
interface AuditChange {
  field: string;                        // Field name that changed
  from: unknown;                        // Previous value
  to: unknown;                          // New value
  type: 'added' | 'removed' | 'modified'; // Type of change
}
```

### AuditLog (Full Record)

```typescript
interface AuditLog {
  id: string;                           // UUID primary key
  
  // Event classification
  eventType: string;
  category: AuditCategory;
  action: AuditAction;
  
  // Actor
  actorType: AuditActorType;
  actorId: string | null;
  actorEmail: string | null;
  actorDisplayName: string | null;
  
  // Request context
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  requestId: string | null;
  
  // Scope
  ventureId: string | null;
  
  // Resource
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  
  // Changes
  dataBefore: Record<string, unknown> | null;
  dataAfter: Record<string, unknown> | null;
  changes: AuditChange[] | null;
  
  // Context
  metadata: Record<string, unknown> | null;
  reason: string | null;
  tags: string[] | null;
  
  // Result
  result: AuditResult;
  errorCode: string | null;
  errorMessage: string | null;
  
  // Performance
  durationMs: number | null;
  
  // Compliance
  isSensitive: boolean;
  isRetained: boolean;
  retentionExpiry: Date | null;
  
  // Timestamps
  timestamp: Date;
  createdAt: Date;
}
```

### AuditLogFilters

```typescript
interface AuditLogFilters {
  ventureId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  categories?: AuditCategory[];
  actions?: AuditAction[];
  results?: AuditResult[];
  actorIds?: string[];
  resourceTypes?: string[];
  resourceId?: string;
  eventTypePattern?: string;            // LIKE pattern matching
  sensitiveOnly?: boolean;
  search?: string;                      // Full-text search
}
```

### AuditStats

```typescript
interface AuditStats {
  totalEvents: number;
  eventsByCategory: Record<string, number>;
  eventsByResult: Record<string, number>;
  topActors: Array<{
    actorId: string;
    displayName: string;
    count: number;
  }>;
  topResources: Array<{
    resourceType: string;
    count: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    count: number;
  }>;
}
```

---

## Database Schema

### audit_logs Table

```typescript
export const auditLogs = pgTable(
  'audit_logs',
  {
    // Primary key
    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT CLASSIFICATION
    // ═══════════════════════════════════════════════════════════════════════
    
    // Event type: Hierarchical identifier (e.g., "deals.created", "user.mfa.enabled")
    eventType: text('event_type').notNull(),
    
    // Category: High-level classification for filtering and retention
    category: text('category', {
      enum: [
        'authentication',    // Login, logout, session events
        'authorization',     // Permission and access events
        'data',              // CRUD operations on entities
        'admin',             // Administrative actions
        'compliance',        // Audit exports, retention, consent
        'security',          // Security-related events
        'system',            // System health, maintenance
        'billing',           // Financial operations
        'integration',       // Third-party integrations
      ],
    }).notNull(),
    
    // Action: Specific operation performed
    action: text('action', {
      enum: [
        'create', 'read', 'update', 'delete',
        'execute', 'approve', 'reject',
        'login', 'logout', 'mfa_verify', 'password_change',
        'permission_grant', 'permission_revoke',
        'export', 'import', 'archive', 'restore',
      ],
    }).notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // ACTOR INFORMATION
    // ═══════════════════════════════════════════════════════════════════════
    
    // Actor type: Who/what performed the action
    actorType: text('actor_type', {
      enum: ['user', 'system', 'agent', 'api_key', 'webhook', 'cron'],
    }).notNull(),
    
    // Actor ID: UUID of the actor (nullable for system actions)
    actorId: uuid('actor_id'),
    
    // Denormalized actor info for fast display
    actorEmail: text('actor_email'),
    actorDisplayName: text('actor_display_name'),

    // ═══════════════════════════════════════════════════════════════════════
    // REQUEST CONTEXT
    // ═══════════════════════════════════════════════════════════════════════
    
    // Client IP address (may be masked for privacy)
    ipAddress: text('ip_address'),
    
    // Browser/client user agent string
    userAgent: text('user_agent'),
    
    // Session ID for correlating actions within a session
    sessionId: uuid('session_id'),
    
    // Request ID for distributed tracing
    requestId: uuid('request_id'),

    // ═══════════════════════════════════════════════════════════════════════
    // SCOPE
    // ═══════════════════════════════════════════════════════════════════════
    
    // Venture ID for multi-tenant filtering
    ventureId: uuid('venture_id').references(() => ventures.id, {
      onDelete: 'set null',
    }),

    // ═══════════════════════════════════════════════════════════════════════
    // RESOURCE INFORMATION
    // ═══════════════════════════════════════════════════════════════════════
    
    // Resource type: Entity type (e.g., "deal", "contact", "user")
    resourceType: text('resource_type'),
    
    // Resource ID: UUID of the affected resource
    resourceId: uuid('resource_id'),
    
    // Human-readable resource name for display
    resourceName: text('resource_name'),

    // ═══════════════════════════════════════════════════════════════════════
    // CHANGE TRACKING
    // ═══════════════════════════════════════════════════════════════════════
    
    // Full state before the operation (for rollback/audit)
    dataBefore: jsonb('data_before').$type<Record<string, unknown>>(),
    
    // Full state after the operation
    dataAfter: jsonb('data_after').$type<Record<string, unknown>>(),
    
    // Computed field-level changes
    changes: jsonb('changes').$type<AuditChange[]>(),

    // ═══════════════════════════════════════════════════════════════════════
    // ADDITIONAL CONTEXT
    // ═══════════════════════════════════════════════════════════════════════
    
    // Custom metadata for application-specific context
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    
    // Human-readable reason for the action
    reason: text('reason'),
    
    // Tags for custom filtering/grouping
    tags: jsonb('tags').$type<string[]>(),

    // ═══════════════════════════════════════════════════════════════════════
    // RESULT
    // ═══════════════════════════════════════════════════════════════════════
    
    // Operation result
    result: text('result', {
      enum: ['success', 'failure', 'partial', 'pending'],
    }).notNull().default('success'),
    
    // Error code if operation failed
    errorCode: text('error_code'),
    
    // Error message if operation failed
    errorMessage: text('error_message'),

    // ═══════════════════════════════════════════════════════════════════════
    // PERFORMANCE
    // ═══════════════════════════════════════════════════════════════════════
    
    // Operation duration in milliseconds
    durationMs: integer('duration_ms'),

    // ═══════════════════════════════════════════════════════════════════════
    // COMPLIANCE
    // ═══════════════════════════════════════════════════════════════════════
    
    // Flag for PII-containing entries (affects retention)
    isSensitive: boolean('is_sensitive').default(false),
    
    // Subject to retention policy?
    isRetained: boolean('is_retained').default(true),
    
    // Calculated expiry date based on retention policy
    retentionExpiry: timestamp('retention_expiry', { withTimezone: true }),

    // ═══════════════════════════════════════════════════════════════════════
    // TIMESTAMPS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Event timestamp (when the action occurred)
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    
    // Record creation timestamp
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Primary query patterns
    index('audit_logs_timestamp_idx').on(table.timestamp),
    index('audit_logs_actor_idx').on(table.actorId),
    index('audit_logs_venture_idx').on(table.ventureId),
    index('audit_logs_resource_idx').on(table.resourceType, table.resourceId),
    index('audit_logs_category_idx').on(table.category),
    index('audit_logs_event_type_idx').on(table.eventType),
    
    // Composite indexes for common queries
    index('audit_logs_venture_timestamp_idx').on(table.ventureId, table.timestamp),
    index('audit_logs_actor_timestamp_idx').on(table.actorId, table.timestamp),
  ]
);
```

### audit_retention_policies Table

```typescript
export const auditRetentionPolicies = pgTable(
  'audit_retention_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Scope
    ventureId: uuid('venture_id').references(() => ventures.id, {
      onDelete: 'cascade',
    }),
    
    // Policy configuration
    category: text('category').notNull(),        // Target category
    retentionDays: integer('retention_days').notNull(),
    complianceFramework: text('compliance_framework'), // 'SOC2', 'GDPR', 'HIPAA', 'PCI-DSS'
    
    // Description
    description: text('description'),
    
    // Status
    isActive: boolean('is_active').default(true),
    
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('retention_policies_venture_idx').on(table.ventureId),
    index('retention_policies_category_idx').on(table.category),
  ]
);
```

### audit_exports Table

```typescript
export const auditExports = pgTable(
  'audit_exports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Scope
    ventureId: uuid('venture_id').references(() => ventures.id, {
      onDelete: 'cascade',
    }).notNull(),
    
    // Export configuration
    format: text('format', { enum: ['csv', 'json', 'parquet'] }).notNull(),
    filters: jsonb('filters').$type<AuditExportFilters>(),
    
    // Status
    status: text('status', { 
      enum: ['pending', 'processing', 'completed', 'failed', 'expired'] 
    }).notNull().default('pending'),
    
    // File information
    filePath: text('file_path'),
    fileSize: bigint('file_size', { mode: 'number' }),
    recordCount: integer('record_count'),
    
    // Error handling
    errorMessage: text('error_message'),
    
    // Expiration
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    
    // Audit
    requestedById: uuid('requested_by_id').references(() => users.id),
    
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('audit_exports_venture_idx').on(table.ventureId),
    index('audit_exports_status_idx').on(table.status),
  ]
);
```

---

## Usage Examples

### Basic Audit Logging

```typescript
import { createAuditEntry, logSuccess, logFailure } from '@mcv/audit/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Log a successful operation
// ═══════════════════════════════════════════════════════════════════════════════

async function createDeal(input: CreateDealInput, userId: string) {
  const deal = await db.insert(deals).values(input).returning();
  
  await logSuccess('deals.created', {
    category: 'data',
    action: 'create',
    actorId: userId,
    resourceType: 'deal',
    resourceId: deal.id,
    resourceName: deal.name,
    dataAfter: deal,
    metadata: {
      source: 'web_app',
      pipelineId: deal.pipelineId,
    },
  });
  
  return deal;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Log a failed operation
// ═══════════════════════════════════════════════════════════════════════════════

async function deleteDeal(dealId: string, userId: string) {
  try {
    const deal = await db.query.deals.findFirst({ where: eq(deals.id, dealId) });
    await db.delete(deals).where(eq(deals.id, dealId));
    
    await logSuccess('deals.deleted', {
      category: 'data',
      action: 'delete',
      actorId: userId,
      resourceType: 'deal',
      resourceId: dealId,
      resourceName: deal.name,
      dataBefore: deal,
    });
  } catch (error) {
    await logFailure('deals.deleted', {
      category: 'data',
      action: 'delete',
      actorId: userId,
      resourceType: 'deal',
      resourceId: dealId,
      errorCode: 'DELETE_FAILED',
      errorMessage: error.message,
    });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Log with change tracking
// ═══════════════════════════════════════════════════════════════════════════════

import { computeChanges } from '@mcv/audit/server';

async function updateDeal(dealId: string, updates: UpdateDealInput, userId: string) {
  // Fetch current state
  const before = await db.query.deals.findFirst({ where: eq(deals.id, dealId) });
  
  // Apply updates
  const [after] = await db.update(deals)
    .set(updates)
    .where(eq(deals.id, dealId))
    .returning();
  
  // Compute changes (only track specific fields)
  const changes = computeChanges(before, after, [
    'name', 'value', 'stage', 'assignedTo', 'expectedCloseDate'
  ]);
  
  await createAuditEntry({
    eventType: 'deals.updated',
    category: 'data',
    action: 'update',
    actorId: userId,
    resourceType: 'deal',
    resourceId: dealId,
    resourceName: after.name,
    dataBefore: before,
    dataAfter: after,
    changes,
  });
  
  return after;
}
```

### Audit Context Management

```typescript
import { 
  withAuditContext, 
  setAuditContext, 
  getAuditContext 
} from '@mcv/audit/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: API route with audit context
// ═══════════════════════════════════════════════════════════════════════════════

// In your API route handler
export async function POST(req: Request) {
  const session = await getSession(req);
  
  return withAuditContext({
    userId: session.userId,
    userEmail: session.email,
    userDisplayName: session.name,
    ventureId: session.ventureId,
    sessionId: session.id,
    requestId: crypto.randomUUID(),
    ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  }, async () => {
    // All audit logs within this scope automatically include context
    const deal = await dealService.create(await req.json());
    return Response.json(deal);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Middleware-based context
// ═══════════════════════════════════════════════════════════════════════════════

import { withAuditLogging } from '@mcv/audit/server';

// Wrap your route handler
export const POST = withAuditLogging(async (req: Request) => {
  // Context is automatically set from request headers
  // Additional context can be merged with setAuditContext()
  
  const session = await getSession(req);
  setAuditContext({
    userId: session.userId,
    ventureId: session.ventureId,
  });
  
  return Response.json({ success: true });
});
```

### Querying Audit Logs

```typescript
import { 
  queryAuditLogs, 
  getAuditLogById,
  getResourceTimeline,
  getUserTimeline,
  getAuditStats,
} from '@mcv/audit/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Query logs with filters
// ═══════════════════════════════════════════════════════════════════════════════

const results = await queryAuditLogs({
  filters: {
    ventureId: 'abc-123',
    dateFrom: new Date('2026-01-01'),
    dateTo: new Date('2026-02-01'),
    categories: ['data', 'admin'],
    actions: ['create', 'update', 'delete'],
    search: 'Enterprise Deal',
  },
  pagination: {
    page: 1,
    pageSize: 50,
  },
  sorting: {
    field: 'timestamp',
    direction: 'desc',
  },
});

console.log(`Found ${results.total} events`);
console.log(`Page ${results.page}/${results.totalPages}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Get resource activity timeline
// ═══════════════════════════════════════════════════════════════════════════════

const dealTimeline = await getResourceTimeline('deal', 'deal-uuid-123', 20);

for (const item of dealTimeline) {
  console.log(`${item.timestamp}: ${item.summary}`);
  // Output: "2026-02-08 14:30: John Smith updated Enterprise Deal"
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Get user activity timeline
// ═══════════════════════════════════════════════════════════════════════════════

const userActivity = await getUserTimeline('user-uuid-456', 50);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Get audit statistics
// ═══════════════════════════════════════════════════════════════════════════════

const stats = await getAuditStats(
  'venture-uuid',
  new Date('2026-01-01'),
  new Date('2026-02-01')
);

console.log(`Total events: ${stats.totalEvents}`);
console.log(`By category:`, stats.eventsByCategory);
console.log(`Top actors:`, stats.topActors);
console.log(`Time series:`, stats.timeSeriesData);
```

### Client-Side Usage (React)

```tsx
import { 
  useAuditLogs, 
  useAuditStats, 
  useActivityTimeline 
} from '@mcv/audit/client';
import { 
  AuditLogTable, 
  AuditFilters, 
  AuditTimeline 
} from '@mcv/audit/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Audit log viewer component
// ═══════════════════════════════════════════════════════════════════════════════

function AuditLogViewer({ ventureId }: { ventureId: string }) {
  const [filters, setFilters] = useState<AuditLogFilters>({
    ventureId,
    dateFrom: subDays(new Date(), 30),
  });
  
  const { data, isLoading, error } = useAuditLogs(filters);
  const { data: stats } = useAuditStats(ventureId);
  
  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        <AuditStatsCard 
          title="Total Events" 
          value={stats?.totalEvents} 
        />
        <AuditStatsCard 
          title="Data Operations" 
          value={stats?.eventsByCategory.data} 
        />
        <AuditStatsCard 
          title="Auth Events" 
          value={stats?.eventsByCategory.authentication} 
        />
        <AuditStatsCard 
          title="Failures" 
          value={stats?.eventsByResult.failure} 
          variant="warning"
        />
      </div>
      
      {/* Filters */}
      <AuditFilters 
        value={filters} 
        onChange={setFilters} 
      />
      
      {/* Log table */}
      <AuditLogTable 
        data={data?.data ?? []} 
        isLoading={isLoading}
        onRowClick={(log) => openDetailModal(log)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Resource activity timeline
// ═══════════════════════════════════════════════════════════════════════════════

function DealActivityTab({ dealId }: { dealId: string }) {
  const { data: timeline } = useActivityTimeline('deal', dealId);
  
  return (
    <AuditTimeline 
      items={timeline ?? []}
      emptyMessage="No activity recorded for this deal."
    />
  );
}
```

---

## Retention Policies

### Default Policies

```typescript
const DEFAULT_RETENTION_POLICIES: DefaultRetentionConfig[] = [
  {
    category: 'authentication',
    days: 365,
    description: 'Authentication events retained for 1 year',
  },
  {
    category: 'authorization',
    days: 365,
    description: 'Authorization events retained for 1 year',
  },
  {
    category: 'data',
    days: 90,
    description: 'Data operation events retained for 90 days',
  },
  {
    category: 'admin',
    days: 730,
    complianceFramework: 'SOC2',
    description: 'Admin actions retained for 2 years (SOC2)',
  },
  {
    category: 'compliance',
    days: 2555,
    complianceFramework: 'GDPR',
    description: 'Compliance events retained for 7 years',
  },
  {
    category: 'security',
    days: 365,
    description: 'Security events retained for 1 year',
  },
  {
    category: 'billing',
    days: 2555,
    complianceFramework: 'PCI-DSS',
    description: 'Billing events retained for 7 years',
  },
  {
    category: 'system',
    days: 30,
    description: 'System events retained for 30 days',
  },
  {
    category: 'integration',
    days: 90,
    description: 'Integration events retained for 90 days',
  },
];
```

### Compliance Frameworks

| Framework | Minimum Retention | Notes |
|-----------|-------------------|-------|
| SOC 2 | 365 days | 1 year for security-related events |
| GDPR | 365 days | 1 year minimum, user can request deletion |
| PCI-DSS | 365 days | 1 year for cardholder data events |
| HIPAA | 2190 days (6 years) | 6 years for PHI-related events |
| ISO 27001 | 365 days | 1 year for security events |

---

## Performance Considerations

### Query Optimization

| Query Pattern | Index Used | Expected Latency |
|--------------|------------|------------------|
| By venture + date range | `venture_timestamp_idx` | < 50ms |
| By actor + date range | `actor_timestamp_idx` | < 50ms |
| By resource (type + id) | `resource_idx` | < 20ms |
| By category | `category_idx` | < 100ms |
| Full-text search | Sequential (consider Elasticsearch) | 100-500ms |

### Volume Estimates

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Events/day | 10,000 | 1,000,000+ |
| Storage/month | 100MB | 10GB+ |
| Avg query time | 20ms | 50ms |

### High-Volume Recommendations

1. **Partitioning**: Consider partitioning `audit_logs` by month for tables > 100M rows
2. **Archival**: Move old logs to cold storage (S3/GCS) after retention period
3. **Elasticsearch**: Add Elasticsearch for full-text search at scale
4. **Async Writes**: Use message queue for non-blocking audit writes

```typescript
// Async audit logging for high-throughput scenarios
import { auditQueue } from '@mcv/queue';

export async function logAuditAsync(input: CreateAuditEntryInput) {
  await auditQueue.send('audit.log', input);
}

// Worker processes queue asynchronously
auditQueue.process('audit.log', async (job) => {
  await createAuditEntry(job.data);
});
```

---

## Security Considerations

### Data Protection

- **IP Masking**: Client IPs are masked in logs (last octet replaced with `xxx`)
- **PII Flagging**: Entries containing PII are flagged with `isSensitive = true`
- **Sensitive Fields**: Password hashes, tokens, and secrets are never logged
- **Encryption**: Logs encrypted at rest using database-level encryption

### Access Control

- Audit logs require `audit:read` permission to view
- Export requires `audit:export` permission
- Retention policies require `audit:admin` permission
- All audit access is itself audited (meta-audit)

### Immutability

- Audit logs are append-only (no updates)
- Deletion only via retention policy (with audit trail)
- Database triggers prevent manual deletion
- Checksums validate log integrity

---

## Environment Variables

```bash
# Audit configuration
AUDIT_RETENTION_ENABLED=true              # Enable automatic retention
AUDIT_RETENTION_CRON="0 3 * * *"         # Daily at 3 AM UTC
AUDIT_EXPORT_BUCKET=mcv-audit-exports    # S3/GCS bucket for exports
AUDIT_EXPORT_EXPIRY_HOURS=72             # Export download link expiry

# Performance
AUDIT_ASYNC_ENABLED=false                 # Use queue for async writes
AUDIT_BATCH_SIZE=100                      # Batch size for bulk operations

# Compliance
AUDIT_DEFAULT_RETENTION_DAYS=90          # Default if no policy matches
AUDIT_COMPLIANCE_MODE=SOC2               # SOC2 | GDPR | HIPAA | PCI-DSS
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-orm | ^0.29.x | Database ORM |
| async_hooks | (built-in) | Request-scoped context via AsyncLocalStorage |
| @mcv/db | workspace | Database schema and connection |
| uuid | ^9.x | UUID generation |

---

## Testing Notes

### Unit Testing

```typescript
import { createAuditEntry, computeChanges } from '@mcv/audit/server';

describe('Audit Service', () => {
  it('should create audit entry with minimal fields', async () => {
    const entry = await createAuditEntry({
      eventType: 'test.event',
      category: 'system',
      action: 'execute',
    });
    
    expect(entry.id).toBeDefined();
    expect(entry.result).toBe('success');
  });
  
  it('should compute changes correctly', () => {
    const changes = computeChanges(
      { name: 'Old Name', value: 100 },
      { name: 'New Name', value: 100 }
    );
    
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      field: 'name',
      from: 'Old Name',
      to: 'New Name',
      type: 'modified',
    });
  });
});
```

### Integration Testing

```typescript
describe('Audit Context', () => {
  it('should propagate context through async operations', async () => {
    await withAuditContext({ userId: 'test-user' }, async () => {
      const entry = await createAuditEntry({
        eventType: 'test.event',
        category: 'system',
        action: 'execute',
      });
      
      expect(entry.actorId).toBe('test-user');
    });
  });
});
```

---

## Audit Events (Self-Auditing)

The audit module logs its own operations:

| Event | Category | Description |
|-------|----------|-------------|
| `audit.export.requested` | compliance | Export job created |
| `audit.export.completed` | compliance | Export job finished |
| `audit.export.downloaded` | compliance | Export file accessed |
| `audit.retention.applied` | compliance | Retention policy executed |
| `audit.retention.updated` | admin | Retention policy modified |

---

*@mcv/fabric/audit — Enterprise Audit Logging Module*
