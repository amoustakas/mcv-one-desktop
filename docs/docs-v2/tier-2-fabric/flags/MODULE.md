# @mcv/fabric/flags — Feature Flags Module

**Parent Package:** @mcv/fabric  
**Tier:** 2 (Infrastructure Services)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `flags` module provides feature flag management and experimentation infrastructure for the MCV ecosystem. It enables progressive rollouts, A/B testing, user targeting, and kill switches — all without code deployments. Built for multi-tenant environments with per-venture and per-user overrides.

**Control what users see, when they see it, and measure the impact.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SERVER SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

// Flag CRUD operations
export { 
  listFlags, 
  getFlag, 
  getFlagByKey,
  createFlag, 
  updateFlag, 
  deleteFlag,
} from './server/services/flag-service';

// Quick actions
export { quickToggle, quickRollout } from './server/services/flag-service';

// Override management
export { 
  createOverride, 
  deleteOverride, 
  listOverrides,
} from './server/services/flag-service';

// Analytics
export { getFlagAnalytics } from './server/services/flag-service';

// Flag evaluation
export { 
  evaluateFlag, 
  evaluateFlags,
  getEffectiveValue,
} from './server/services/evaluator';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { FeatureFlag } from './client/components/feature-flag';
export { Experiment } from './client/components/experiment';
export { FlagBadge } from './client/components/flag-badge';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export { useFlag } from './client/hooks/use-flag';
export { useFlagValue } from './client/hooks/use-flag-value';
export { useFlagsAdmin } from './client/hooks/use-flags-admin';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export { FlagsProvider, useFlagsContext } from './client/context/flags-provider';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  FeatureFlag,
  FlagOverride,
  FlagValue,
  FlagStatus,
  FlagType,
  RolloutStrategy,
  TargetingRule,
  TargetingCondition,
  FlagWithStats,
  FlagFilters,
  FlagListResponse,
  CreateFlagInput,
  UpdateFlagInput,
  EvaluationContext,
  EvaluationResult,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FEATURE FLAGS ARCHITECTURE                              │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                            CLIENT LAYER                                      │ │
│  │                                                                              │ │
│  │  ┌───────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                         FlagsProvider                                  │  │ │
│  │  │                                                                        │  │ │
│  │  │  • Fetches flags on mount (with caching)                              │  │ │
│  │  │  • Provides context to child components                                │  │ │
│  │  │  • Handles real-time updates via WebSocket                            │  │ │
│  │  │  • Tracks flag evaluations for analytics                               │  │ │
│  │  └───────────────────────────────────────────────────────────────────────┘  │ │
│  │                                    │                                         │ │
│  │         ┌──────────────────────────┼──────────────────────────┐             │ │
│  │         │                          │                          │             │ │
│  │  ┌──────▼──────┐  ┌────────────────▼────────────┐  ┌─────────▼────────┐   │ │
│  │  │  useFlag()  │  │  <FeatureFlag key="...">   │  │  <Experiment>    │   │ │
│  │  │             │  │                             │  │                  │   │ │
│  │  │  Returns    │  │  Renders children if flag  │  │  A/B testing     │   │ │
│  │  │  boolean    │  │  is enabled                 │  │  with variants   │   │ │
│  │  └─────────────┘  └─────────────────────────────┘  └──────────────────┘   │ │
│  │                                                                              │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────┐ │
│  │                           EVALUATION ENGINE                                   │ │
│  │                                                                               │ │
│  │    ┌────────────────────────────────────────────────────────────────────┐    │ │
│  │    │                      evaluateFlag(key, context)                     │    │ │
│  │    │                                                                     │    │ │
│  │    │  1. Check user override       ─▶  User has explicit override?      │    │ │
│  │    │  2. Check venture override    ─▶  Venture has override?            │    │ │
│  │    │  3. Check schedule            ─▶  Within startAt/endAt window?     │    │ │
│  │    │  4. Check targeting rules     ─▶  User matches any rule?           │    │ │
│  │    │  5. Check rollout percentage  ─▶  User in rollout bucket?          │    │ │
│  │    │  6. Return default value      ─▶  Fall back to defaultValue        │    │ │
│  │    │                                                                     │    │ │
│  │    └────────────────────────────────────────────────────────────────────┘    │ │
│  │                                                                               │ │
│  │    ┌────────────────────────────────────────────────────────────────────┐    │ │
│  │    │                     Percentage Rollout                              │    │ │
│  │    │                                                                     │    │ │
│  │    │  bucket = hash(flagId + "-" + userId) % 100                         │    │ │
│  │    │  enabled = bucket < rolloutPercentage                               │    │ │
│  │    │                                                                     │    │ │
│  │    │  Deterministic: Same user always gets same result                   │    │ │
│  │    │  Stable: Increasing % doesn't change existing assignments           │    │ │
│  │    └────────────────────────────────────────────────────────────────────┘    │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                             DATABASE LAYER                                     │ │
│  │                                                                                │ │
│  │    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │ │
│  │    │  feature_flags   │  │  flag_overrides  │  │  flag_evaluations│          │ │
│  │    │                  │  │                  │  │                  │          │ │
│  │    │  • key           │  │  • flagId        │  │  • flagId        │          │ │
│  │    │  • defaultValue  │  │  • userId        │  │  • userId        │          │ │
│  │    │  • rollout %     │  │  • ventureId     │  │  • value         │          │ │
│  │    │  • targeting     │  │  • value         │  │  • matchedRule   │          │ │
│  │    │  • schedule      │  │  • expiresAt     │  │  • evaluatedAt   │          │ │
│  │    └──────────────────┘  └──────────────────┘  └──────────────────┘          │ │
│  │                                                                                │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### FeatureFlag

```typescript
interface FeatureFlag {
  id: string;                           // UUID primary key
  
  // Identity
  key: string;                          // Unique key (e.g., 'new-dashboard')
  name: string;                         // Human-readable name
  description: string | null;           // Detailed description
  
  // Ownership
  ventureId: string | null;             // Venture scope (null = global)
  createdById: string | null;           // Creator user ID
  
  // Type and value
  type: FlagType;                       // 'boolean' | 'string' | 'number' | 'json'
  defaultValue: FlagValue;              // Default value when no rules match
  
  // Status
  status: FlagStatus;                   // 'draft' | 'active' | 'paused' | 'archived'
  
  // Rollout configuration
  rolloutStrategy: RolloutStrategy;     // 'all' | 'percentage' | 'user_list' | 'attribute' | 'schedule'
  rolloutPercentage: number;            // 0-100 for percentage rollout
  
  // Targeting
  targetingRules: TargetingRule[];      // Ordered rules for evaluation
  
  // Schedule
  startAt: Date | null;                 // Enable after this time
  endAt: Date | null;                   // Disable after this time
  
  // Metadata
  tags: string[];                       // Categorization tags
  metadata: Record<string, unknown> | null;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### FlagValue

```typescript
type FlagValue =
  | { enabled: boolean }                // Boolean flag
  | { value: string | number | boolean | Record<string, unknown> }; // Variant value

// Examples:
const booleanFlag: FlagValue = { enabled: true };
const stringFlag: FlagValue = { value: 'variant-a' };
const jsonFlag: FlagValue = { value: { theme: 'dark', density: 'compact' } };
```

### TargetingRule

```typescript
interface TargetingRule {
  id: string;                           // Unique rule ID
  name?: string;                        // Human-readable name
  conditions: TargetingCondition[];     // AND conditions
  value: FlagValue;                     // Value if rule matches
  percentage?: number;                  // Optional percentage for this rule
}

interface TargetingCondition {
  attribute: string;                    // User/context attribute
  operator: TargetingOperator;          // Comparison operator
  value: ConditionValue;                // Comparison value(s)
}

type TargetingOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'regex';

type ConditionValue = string | number | boolean | string[] | number[];
```

### EvaluationContext

```typescript
interface EvaluationContext {
  // Required
  userId: string;
  
  // Optional attributes (for targeting)
  ventureId?: string;
  email?: string;
  tier?: 'free' | 'pro' | 'enterprise';
  country?: string;
  locale?: string;
  platform?: 'web' | 'ios' | 'android';
  version?: string;
  
  // Custom attributes
  [key: string]: unknown;
}
```

### EvaluationResult

```typescript
interface EvaluationResult {
  value: FlagValue;                     // Evaluated value
  enabled: boolean;                     // Convenience boolean
  source: 'default' | 'override' | 'rule' | 'rollout'; // How value was determined
  matchedRuleId?: string;               // Which rule matched (if any)
  flagId: string;                       // Flag ID for reference
}
```

### FlagWithStats

```typescript
interface FlagWithStats extends FeatureFlag {
  overrideCount: number;                // Number of active overrides
  evaluationCount: number;              // Total evaluations
  enabledCount: number;                 // Evaluations where enabled=true
  conversionRate?: number;              // % enabled (enabledCount/evaluationCount)
}
```

---

## Database Schema

### feature_flags Table

```typescript
export const featureFlags = pgTable(
  'feature_flags',
  {
    // Primary key
    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════
    // IDENTITY
    // ═══════════════════════════════════════════════════════════════════════
    
    // Unique key for programmatic access (e.g., 'new-dashboard', 'ai-assistant')
    key: text('key').notNull(),
    
    // Human-readable display name
    name: text('name').notNull(),
    
    // Detailed description for documentation
    description: text('description'),

    // ═══════════════════════════════════════════════════════════════════════
    // OWNERSHIP
    // ═══════════════════════════════════════════════════════════════════════
    
    // Venture scope (null = global/platform flag)
    ventureId: uuid('venture_id').references(() => ventures.id, {
      onDelete: 'cascade',
    }),
    
    // Creator for auditing
    createdById: uuid('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    // ═══════════════════════════════════════════════════════════════════════
    // TYPE AND VALUE
    // ═══════════════════════════════════════════════════════════════════════
    
    // Flag value type
    type: text('type', { 
      enum: ['boolean', 'string', 'number', 'json'] 
    }).default('boolean').notNull(),
    
    // Default value when no targeting rules match
    defaultValue: jsonb('default_value').$type<FlagValue>().notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // STATUS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Lifecycle status
    status: text('status', { 
      enum: ['draft', 'active', 'paused', 'archived'] 
    }).default('draft').notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // ROLLOUT CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    
    // Rollout strategy
    rolloutStrategy: text('rollout_strategy', { 
      enum: ['all', 'percentage', 'user_list', 'attribute', 'schedule'] 
    }).default('all').notNull(),
    
    // Percentage for 'percentage' strategy (0-100)
    rolloutPercentage: integer('rollout_percentage').default(0),

    // ═══════════════════════════════════════════════════════════════════════
    // TARGETING RULES
    // ═══════════════════════════════════════════════════════════════════════
    
    // Ordered array of targeting rules
    targetingRules: jsonb('targeting_rules').$type<TargetingRule[]>(),

    // ═══════════════════════════════════════════════════════════════════════
    // SCHEDULE
    // ═══════════════════════════════════════════════════════════════════════
    
    // Enable flag after this time
    startAt: timestamp('start_at', { withTimezone: true }),
    
    // Disable flag after this time
    endAt: timestamp('end_at', { withTimezone: true }),

    // ═══════════════════════════════════════════════════════════════════════
    // METADATA
    // ═══════════════════════════════════════════════════════════════════════
    
    // Tags for categorization
    tags: jsonb('tags').$type<string[]>(),
    
    // Custom metadata
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    // ═══════════════════════════════════════════════════════════════════════
    // TIMESTAMPS
    // ═══════════════════════════════════════════════════════════════════════
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Unique key per venture (or globally if ventureId is null)
    uniqueIndex('feature_flags_key_venture_idx').on(table.key, table.ventureId),
    index('feature_flags_status_idx').on(table.status),
    index('feature_flags_venture_idx').on(table.ventureId),
  ]
);
```

### flag_overrides Table

```typescript
export const flagOverrides = pgTable(
  'flag_overrides',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Reference to flag
    flagId: uuid('flag_id')
      .references(() => featureFlags.id, { onDelete: 'cascade' })
      .notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // TARGET (one should be set)
    // ═══════════════════════════════════════════════════════════════════════
    
    // User-specific override
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    
    // Venture-specific override (when flag is global)
    ventureId: uuid('venture_id').references(() => ventures.id, {
      onDelete: 'cascade',
    }),

    // ═══════════════════════════════════════════════════════════════════════
    // OVERRIDE VALUE
    // ═══════════════════════════════════════════════════════════════════════
    
    value: jsonb('value').$type<FlagValue>().notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // METADATA
    // ═══════════════════════════════════════════════════════════════════════
    
    // Reason for the override
    reason: text('reason'),
    
    // Who created the override
    createdById: uuid('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    
    // Optional expiration
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('flag_overrides_flag_idx').on(table.flagId),
    index('flag_overrides_user_idx').on(table.userId),
    index('flag_overrides_venture_idx').on(table.ventureId),
  ]
);
```

### flag_evaluations Table

```typescript
export const flagEvaluations = pgTable(
  'flag_evaluations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // References
    flagId: uuid('flag_id')
      .references(() => featureFlags.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    ventureId: uuid('venture_id').references(() => ventures.id, {
      onDelete: 'cascade',
    }),

    // ═══════════════════════════════════════════════════════════════════════
    // EVALUATION RESULT
    // ═══════════════════════════════════════════════════════════════════════
    
    // Evaluated value
    value: jsonb('value').$type<FlagValue>().notNull(),
    
    // Which rule matched (if any)
    matchedRuleId: text('matched_rule_id'),
    
    // Was this an override?
    isOverride: boolean('is_override').default(false),

    // ═══════════════════════════════════════════════════════════════════════
    // CONTEXT
    // ═══════════════════════════════════════════════════════════════════════
    
    // Evaluation context for debugging
    context: jsonb('context').$type<Record<string, unknown>>(),

    // Timestamp
    evaluatedAt: timestamp('evaluated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('flag_evaluations_flag_idx').on(table.flagId),
    index('flag_evaluations_evaluated_at_idx').on(table.evaluatedAt),
    index('flag_evaluations_venture_idx').on(table.ventureId),
  ]
);
```

---

## Usage Examples

### Basic Flag Operations

```typescript
import { 
  createFlag, 
  updateFlag, 
  deleteFlag,
  quickToggle,
  quickRollout,
} from '@mcv/flags/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Create a simple boolean flag
// ═══════════════════════════════════════════════════════════════════════════════

const flag = await createFlag({
  key: 'new-dashboard',
  name: 'New Dashboard Experience',
  description: 'Enables the redesigned dashboard with improved analytics',
  ventureId: 'venture-uuid',
  type: 'boolean',
  defaultValue: { enabled: false },
  tags: ['frontend', 'dashboard', 'q1-2026'],
}, userId);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Create a flag with percentage rollout
// ═══════════════════════════════════════════════════════════════════════════════

const rolloutFlag = await createFlag({
  key: 'ai-assistant',
  name: 'AI Assistant',
  description: 'Chat-based AI assistant for deal recommendations',
  ventureId: 'venture-uuid',
  type: 'boolean',
  defaultValue: { enabled: false },
  rolloutStrategy: 'percentage',
  rolloutPercentage: 10, // Start with 10%
}, userId);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Quick toggle (kill switch)
// ═══════════════════════════════════════════════════════════════════════════════

// Disable immediately (incident response)
await quickToggle({ flagId: flag.id, enabled: false });

// Re-enable after fix
await quickToggle({ flagId: flag.id, enabled: true });

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Gradual rollout
// ═══════════════════════════════════════════════════════════════════════════════

// Day 1: 5%
await quickRollout({ flagId: rolloutFlag.id, percentage: 5 });

// Day 3: 25%
await quickRollout({ flagId: rolloutFlag.id, percentage: 25 });

// Day 7: 50%
await quickRollout({ flagId: rolloutFlag.id, percentage: 50 });

// Day 14: 100% (full rollout)
await quickRollout({ flagId: rolloutFlag.id, percentage: 100 });
```

### Targeting Rules

```typescript
import { createFlag, updateFlag } from '@mcv/flags/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Flag with targeting rules
// ═══════════════════════════════════════════════════════════════════════════════

const targetedFlag = await createFlag({
  key: 'premium-features',
  name: 'Premium Features',
  type: 'boolean',
  defaultValue: { enabled: false },
  rolloutStrategy: 'attribute',
  targetingRules: [
    // Rule 1: Always enable for enterprise customers
    {
      id: 'enterprise-users',
      name: 'Enterprise Users',
      conditions: [
        { attribute: 'tier', operator: 'equals', value: 'enterprise' }
      ],
      value: { enabled: true },
    },
    // Rule 2: Enable for pro users in USA
    {
      id: 'pro-usa',
      name: 'Pro Users (USA)',
      conditions: [
        { attribute: 'tier', operator: 'equals', value: 'pro' },
        { attribute: 'country', operator: 'equals', value: 'US' },
      ],
      value: { enabled: true },
    },
    // Rule 3: 50% rollout for remaining pro users
    {
      id: 'pro-50-percent',
      name: 'Pro Users (50% rollout)',
      conditions: [
        { attribute: 'tier', operator: 'equals', value: 'pro' },
      ],
      value: { enabled: true },
      percentage: 50,
    },
  ],
}, userId);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: A/B test with variants
// ═══════════════════════════════════════════════════════════════════════════════

const abTestFlag = await createFlag({
  key: 'checkout-flow',
  name: 'Checkout Flow Experiment',
  type: 'string',
  defaultValue: { value: 'control' },
  rolloutStrategy: 'percentage',
  rolloutPercentage: 100, // Everyone gets assigned a variant
  targetingRules: [
    {
      id: 'variant-a',
      name: 'Variant A - Single Page',
      conditions: [],
      value: { value: 'single-page' },
      percentage: 33,
    },
    {
      id: 'variant-b',
      name: 'Variant B - Multi-Step',
      conditions: [],
      value: { value: 'multi-step' },
      percentage: 33,
    },
    // Remaining 34% get 'control' (default)
  ],
  metadata: {
    hypothesis: 'Single-page checkout will increase conversion by 10%',
    primaryMetric: 'checkout_completion_rate',
    expectedEndDate: '2026-03-01',
  },
}, userId);
```

### Flag Evaluation

```typescript
import { evaluateFlag, evaluateFlags } from '@mcv/flags/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Evaluate a single flag
// ═══════════════════════════════════════════════════════════════════════════════

const result = await evaluateFlag('new-dashboard', {
  userId: 'user-uuid',
  ventureId: 'venture-uuid',
  tier: 'pro',
  country: 'US',
  platform: 'web',
});

if (result.enabled) {
  // Show new dashboard
} else {
  // Show legacy dashboard
}

console.log('Evaluation result:', {
  enabled: result.enabled,
  source: result.source,       // 'default' | 'override' | 'rule' | 'rollout'
  matchedRule: result.matchedRuleId,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Evaluate multiple flags at once
// ═══════════════════════════════════════════════════════════════════════════════

const flags = await evaluateFlags(
  ['new-dashboard', 'ai-assistant', 'premium-features'],
  {
    userId: 'user-uuid',
    ventureId: 'venture-uuid',
    tier: 'enterprise',
  }
);

// Returns: { 'new-dashboard': result, 'ai-assistant': result, ... }

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Get variant value for A/B test
// ═══════════════════════════════════════════════════════════════════════════════

const checkoutResult = await evaluateFlag('checkout-flow', {
  userId: 'user-uuid',
});

const variant = checkoutResult.value.value as string; // 'control' | 'single-page' | 'multi-step'

switch (variant) {
  case 'single-page':
    return <SinglePageCheckout />;
  case 'multi-step':
    return <MultiStepCheckout />;
  default:
    return <LegacyCheckout />;
}
```

### Overrides

```typescript
import { createOverride, listOverrides, deleteOverride } from '@mcv/flags/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Create user override (for QA/testing)
// ═══════════════════════════════════════════════════════════════════════════════

await createOverride({
  flagId: 'new-dashboard-flag-id',
  userId: 'qa-user-uuid',
  value: { enabled: true },
  reason: 'QA testing for sprint 42',
  createdById: adminUserId,
  expiresAt: new Date('2026-02-15'), // Auto-expire after testing
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Create venture override (for specific customer)
// ═══════════════════════════════════════════════════════════════════════════════

await createOverride({
  flagId: 'premium-features-flag-id',
  ventureId: 'vip-customer-venture-uuid',
  value: { enabled: true },
  reason: 'VIP customer early access',
  createdById: adminUserId,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: List and manage overrides
// ═══════════════════════════════════════════════════════════════════════════════

const overrides = await listOverrides('flag-uuid');

for (const override of overrides) {
  console.log(`Override for ${override.user?.email || override.venture?.name}`);
  console.log(`  Value: ${JSON.stringify(override.value)}`);
  console.log(`  Reason: ${override.reason}`);
  console.log(`  Expires: ${override.expiresAt}`);
}

// Remove override
await deleteOverride(override.id);
```

### Client-Side Usage (React)

```tsx
import { 
  FlagsProvider, 
  useFlag, 
  useFlagValue,
  FeatureFlag,
  Experiment,
} from '@mcv/flags/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Provider setup
// ═══════════════════════════════════════════════════════════════════════════════

function App() {
  return (
    <FlagsProvider 
      userId={user.id}
      ventureId={venture.id}
      context={{
        tier: user.subscription.tier,
        country: user.country,
        platform: 'web',
      }}
    >
      <Dashboard />
    </FlagsProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: useFlag hook
// ═══════════════════════════════════════════════════════════════════════════════

function Dashboard() {
  const isNewDashboard = useFlag('new-dashboard');
  const aiAssistantEnabled = useFlag('ai-assistant');
  
  return (
    <div>
      {isNewDashboard ? <NewDashboard /> : <LegacyDashboard />}
      {aiAssistantEnabled && <AIAssistantWidget />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: FeatureFlag component
// ═══════════════════════════════════════════════════════════════════════════════

function Sidebar() {
  return (
    <nav>
      <Link href="/deals">Deals</Link>
      <Link href="/contacts">Contacts</Link>
      
      <FeatureFlag flag="analytics-beta">
        <Link href="/analytics">Analytics (Beta)</Link>
      </FeatureFlag>
      
      <FeatureFlag 
        flag="admin-tools" 
        fallback={<Link href="/help">Help</Link>}
      >
        <Link href="/admin">Admin Tools</Link>
      </FeatureFlag>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 16: Experiment component (A/B testing)
// ═══════════════════════════════════════════════════════════════════════════════

function CheckoutPage() {
  return (
    <Experiment flag="checkout-flow">
      {{
        'single-page': <SinglePageCheckout />,
        'multi-step': <MultiStepCheckout />,
        control: <LegacyCheckout />,
      }}
    </Experiment>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 17: useFlagValue for non-boolean flags
// ═══════════════════════════════════════════════════════════════════════════════

function ThemedComponent() {
  const themeConfig = useFlagValue<{ primary: string; mode: 'light' | 'dark' }>(
    'theme-experiment'
  );
  
  return (
    <div style={{ 
      backgroundColor: themeConfig?.primary ?? '#3b82f6',
      colorScheme: themeConfig?.mode ?? 'light',
    }}>
      Themed Content
    </div>
  );
}
```

### Analytics

```typescript
import { getFlagAnalytics } from '@mcv/flags/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 18: Get flag analytics
// ═══════════════════════════════════════════════════════════════════════════════

const analytics = await getFlagAnalytics('flag-uuid', {
  startDate: subDays(new Date(), 30),
  endDate: new Date(),
});

console.log('Flag Analytics:');
console.log(`  Total evaluations: ${analytics.totalEvaluations}`);
console.log(`  Enabled evaluations: ${analytics.enabledEvaluations}`);
console.log(`  Conversion rate: ${(analytics.enabledEvaluations / analytics.totalEvaluations * 100).toFixed(1)}%`);
console.log(`  Unique users: ${analytics.uniqueUsers}`);

// Daily breakdown
for (const day of analytics.evaluationsByDay) {
  console.log(`  ${day.date}: ${day.enabled}/${day.total} enabled`);
}
```

---

## Performance Considerations

### Caching Strategy

| Layer | Cache Duration | Invalidation |
|-------|---------------|--------------|
| Client (FlagsProvider) | 5 minutes | On flag change (WebSocket) |
| API Edge | 1 minute | Stale-while-revalidate |
| Server | 30 seconds | On flag update |

### Evaluation Performance

- **Target**: < 5ms per flag evaluation
- **Batch evaluation**: Evaluate multiple flags in single query
- **Deterministic hashing**: Consistent bucket assignment without DB lookup

```typescript
// Percentage rollout uses deterministic hashing
function getBucket(flagId: string, userId: string): number {
  const hash = createHash('sha256')
    .update(`${flagId}-${userId}`)
    .digest('hex');
  
  return parseInt(hash.slice(0, 8), 16) % 100;
}
```

---

## Security Considerations

- Flag evaluation is server-side (no exposure of targeting logic)
- Override creation requires `flags:admin` permission
- Evaluation logs are sampled (not every request) for analytics
- Sensitive flags can be marked as `internal` to hide from client bundle

---

## Environment Variables

```bash
# Feature flags configuration
FLAGS_CACHE_TTL=30                       # Cache duration in seconds
FLAGS_EVALUATION_SAMPLING=0.1            # % of evaluations to log (0.1 = 10%)
FLAGS_REALTIME_ENABLED=true              # Enable WebSocket updates
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-orm | ^0.29.x | Database ORM |
| @mcv/db | workspace | Database schema |
| @mcv/realtime | workspace | Real-time updates |

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `flags.created` | admin | Flag created |
| `flags.updated` | admin | Flag configuration changed |
| `flags.deleted` | admin | Flag deleted |
| `flags.toggled` | admin | Flag enabled/disabled |
| `flags.rollout_changed` | admin | Rollout percentage changed |
| `flags.override.created` | admin | Override created |
| `flags.override.deleted` | admin | Override removed |

---

*@mcv/fabric/flags — Feature Flags & Experimentation Module*
