# @mcv/portfolio/ventures

> **Tier 5 — MCV-Only Domain Module**
> Venture lifecycle management — the beating heart of the MCV consortium.

| Field | Value |
|---|---|
| **Package** | `@mcv/portfolio/ventures` |
| **Tier** | 5 (Domain) |
| **Visibility** | MCV-Only (super-admin, consortium operators) |
| **Since** | 0.1.0 |
| **Status** | Active — Core |
| **Owner** | Portfolio Domain Team |
| **Depends on** | `@mcv/identity/tenants`, `@mcv/shared/db`, `@mcv/shared/events`, `@mcv/shared/config` |
| **Consumed by** | Super-admin dashboard, CLI tooling, portfolio analytics, billing, deployment pipelines |

---

## Purpose

Ventures are the fundamental unit of organization within the MCV consortium. Every product, every team, every deployment, every dollar of revenue traces back to a venture. This module owns the complete lifecycle of a venture — from the moment an idea is conceived and registered in the system, through seed-stage validation, growth-phase scaling, maturity optimization, and eventual archival or sunset. It is, without exaggeration, the single most important domain entity in the entire MCV platform. Without ventures, there is no consortium — just a collection of disconnected services with no organizational gravity.

The `@mcv/portfolio/ventures` module provides full CRUD operations for venture entities, rich profile management (branding, industry vertical, stage classification), real-time health monitoring via KPI dashboards (MRR, ARR, churn, CAC, LTV, NPS, runway), team assignment and allocation tracking, technology stack registries, per-venture deployment configurations, multi-tenant isolation verification, cross-venture comparison analytics, milestone-based stage gate progression with approval workflows, and starter templates for rapidly bootstrapping new ventures in common verticals (SaaS, marketplace, fintech, gaming). Every operation is tenant-aware, audit-logged, and protected by row-level security policies that ensure absolute data isolation between ventures.

The module serves as the canonical source of truth for the super-admin dashboard. When a consortium operator opens the dashboard, the first thing they see is the venture portfolio — a bird's-eye view of all nine MCV ventures (BetEdge, SerpSpace, Full Gain, MCV Studios, Futurestate, and four others), their health scores, team allocations, and stage progression. From there, they can drill into any venture for granular configuration, deploy feature flags, reassign team members, approve stage gate transitions, or spin up an entirely new venture from a template. This module makes all of that possible.

---

## Exports

```typescript
// === Primary Service ===
export { VentureService } from './services/venture.service';
export { VentureHealthService } from './services/venture-health.service';
export { VentureTeamService } from './services/venture-team.service';
export { VentureStageGateService } from './services/venture-stage-gate.service';
export { VentureTemplateService } from './services/venture-template.service';
export { VentureComparisonService } from './services/venture-comparison.service';
export { VentureDeploymentService } from './services/venture-deployment.service';
export { VentureTechStackService } from './services/venture-tech-stack.service';

// === Core Types ===
export type {
  Venture,
  VentureId,
  VentureSlug,
  VentureProfile,
  VentureConfig,
  VentureHealth,
  VentureHealthSnapshot,
  VentureKPI,
  VentureStage,
  VentureStatus,
  VentureIndustry,
  TeamAssignment,
  TeamRole,
  TechStack,
  TechStackEntry,
  DeploymentConfig,
  FeatureFlag,
  StageGate,
  StageGateApproval,
  StageGateMilestone,
  VentureTemplate,
  VentureComparison,
  VentureComparisonMetric,
} from './types';

// === Schemas (Drizzle ORM) ===
export {
  ventures,
  ventureConfigs,
  ventureHealthSnapshots,
  teamAssignments,
  techStacks,
  stageGates,
  stageGateMilestones,
  ventureTemplates,
} from './schema';

// === tRPC Router ===
export { ventureRouter } from './router';

// === Validators (Zod) ===
export {
  createVentureSchema,
  updateVentureSchema,
  ventureConfigSchema,
  teamAssignmentSchema,
  techStackEntrySchema,
  stageGateSchema,
  ventureTemplateSchema,
  ventureFilterSchema,
  ventureComparisonSchema,
} from './validators';

// === Events ===
export {
  VENTURE_CREATED,
  VENTURE_UPDATED,
  VENTURE_ARCHIVED,
  VENTURE_REACTIVATED,
  VENTURE_STAGE_CHANGED,
  VENTURE_HEALTH_SNAPSHOT,
  VENTURE_TEAM_ASSIGNED,
  VENTURE_TEAM_REMOVED,
  VENTURE_GATE_APPROVED,
  VENTURE_GATE_REJECTED,
  VENTURE_TEMPLATE_APPLIED,
  VENTURE_CONFIG_CHANGED,
} from './events';

// === Constants ===
export {
  VENTURE_STAGES,
  VENTURE_STATUSES,
  VENTURE_INDUSTRIES,
  DEFAULT_KPIS,
  HEALTH_THRESHOLDS,
  STAGE_GATE_REQUIREMENTS,
} from './constants';

// === Utilities ===
export { calculateHealthScore } from './utils/health-score';
export { calculateRunway } from './utils/runway';
export { ventureToTenant } from './utils/tenant-mapping';
export { generateVentureSlug } from './utils/slug';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SUPER-ADMIN DASHBOARD                                │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────────┐  │
│  │Portfolio │ │ Venture  │ │  Health  │ │   Team    │ │  Stage Gate      │  │
│  │Overview  │ │ Detail   │ │Dashboard │ │Allocation │ │  Progression     │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘ └────────┬─────────┘  │
└───────┼─────────────┼───────────┼──────────────┼────────────────┼────────────┘
        │             │           │              │                │
        ▼             ▼           ▼              ▼                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           tRPC ROUTER LAYER                                  │
│                                                                              │
│  venture.list      venture.getById     venture.create    venture.update      │
│  venture.archive   venture.reactivate  venture.compare   venture.fromTemplate│
│  health.snapshot   health.dashboard    health.trends     health.alerts       │
│  team.assign       team.remove         team.reallocate   team.byVenture      │
│  stack.register    stack.update        stack.audit       stack.byVenture     │
│  gate.submit       gate.approve        gate.reject       gate.history       │
│  config.set        config.get          config.flags      config.deploy      │
│  template.list     template.create     template.preview  template.apply     │
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                       │
│                                                                              │
│  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────────┐  │
│  │  VentureService   │  │VentureHealthSvc   │  │ VentureTeamService       │  │
│  │                   │  │                   │  │                          │  │
│  │  create()         │  │  captureSnapshot()│  │  assign()                │  │
│  │  update()         │  │  getDashboard()   │  │  remove()                │  │
│  │  archive()        │  │  getTrends()      │  │  reallocate()            │  │
│  │  reactivate()     │  │  getAlerts()      │  │  getByVenture()          │  │
│  │  getById()        │  │  calculateScore() │  │  getByMember()           │  │
│  │  list()           │  │  compareHealth()  │  │  validateAllocations()   │  │
│  │  fromTemplate()   │  │                   │  │                          │  │
│  └──────┬───────────┘  └────────┬──────────┘  └────────────┬─────────────┘  │
│         │                       │                           │                │
│  ┌──────┴───────────┐  ┌───────┴───────────┐  ┌───────────┴──────────────┐  │
│  │StageGateService   │  │TechStackService   │  │DeploymentConfigService   │  │
│  │                   │  │                   │  │                          │  │
│  │  submit()         │  │  register()       │  │  setConfig()             │  │
│  │  approve()        │  │  update()         │  │  getConfig()             │  │
│  │  reject()         │  │  audit()          │  │  setFlags()              │  │
│  │  getHistory()     │  │  getByVenture()   │  │  getFlags()              │  │
│  │  getMilestones()  │  │  getDependencies()│  │  deployConfig()          │  │
│  └──────────────────┘  └───────────────────┘  └──────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────┐  ┌────────────────────────────────────────────┐   │
│  │VentureTemplateSvc     │  │ VentureComparisonService                   │   │
│  │                       │  │                                            │   │
│  │  list()               │  │  compare()                                 │   │
│  │  create()             │  │  rankByMetric()                            │   │
│  │  preview()            │  │  generateReport()                          │   │
│  │  apply()              │  │  getPortfolioSummary()                     │   │
│  └───────────────────────┘  └────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER (Drizzle ORM)                             │
│                                                                              │
│  ┌──────────┐ ┌───────────────┐ ┌──────────────────────┐ ┌───────────────┐  │
│  │ ventures │ │venture_configs│ │venture_health_snapshots│ │team_assignments│ │
│  └──────────┘ └───────────────┘ └──────────────────────┘ └───────────────┘  │
│  ┌──────────┐ ┌───────────────┐ ┌──────────────────────┐                    │
│  │tech_stacks│ │ stage_gates  │ │  venture_templates   │                    │
│  └──────────┘ └───────────────┘ └──────────────────────┘                    │
│                                                                              │
│  Row-Level Security (RLS) · Multi-Tenant Isolation · Supabase PostgreSQL    │
└──────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      EVENT BUS (Domain Events)                               │
│                                                                              │
│  VENTURE_CREATED → identity/tenants (auto-provision tenant)                  │
│  VENTURE_ARCHIVED → billing (pause subscriptions)                            │
│  VENTURE_STAGE_CHANGED → notifications (alert stakeholders)                  │
│  VENTURE_HEALTH_SNAPSHOT → analytics (store time-series)                     │
│  VENTURE_GATE_APPROVED → deployment (unlock next-stage features)             │
│  VENTURE_CONFIG_CHANGED → deployment (hot-reload configs)                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Venture

The root entity. Every product in the MCV consortium is a `Venture`.

```typescript
/**
 * Represents a single venture in the MCV consortium.
 * Each venture maps 1:1 to a tenant in @mcv/identity/tenants.
 */
export interface Venture {
  /** UUID v7 — sortable by creation time */
  id: VentureId;

  /** URL-safe slug, unique across the consortium. e.g. "betedge", "serpspace" */
  slug: VentureSlug;

  /** Corresponding tenant ID in @mcv/identity/tenants */
  tenantId: TenantId;

  /** Human-readable venture profile */
  profile: VentureProfile;

  /** Current lifecycle stage */
  stage: VentureStage;

  /** Active, archived, or suspended */
  status: VentureStatus;

  /** Latest calculated health score (0-100) */
  healthScore: number | null;

  /** Industry vertical classification */
  industry: VentureIndustry;

  /** Template this venture was bootstrapped from, if any */
  templateId: VentureTemplateId | null;

  /** When the venture was founded/created in the system */
  foundedAt: Date;

  /** Audit timestamps */
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;

  /** Who created this venture */
  createdBy: UserId;
}

/** Branded type for venture IDs */
export type VentureId = string & { readonly __brand: 'VentureId' };

/** URL-safe venture slug */
export type VentureSlug = string & { readonly __brand: 'VentureSlug' };
```

### VentureProfile

```typescript
/**
 * Rich profile information for a venture — branding, description, links.
 * Displayed on the super-admin dashboard and public portfolio pages.
 */
export interface VentureProfile {
  /** Display name. e.g. "BetEdge", "SerpSpace", "Full Gain" */
  name: string;

  /** Short tagline (max 120 chars). e.g. "AI-Powered Sports Betting Intelligence" */
  tagline: string;

  /** Full description (markdown supported, max 5000 chars) */
  description: string;

  /** Primary domain. e.g. "betedge.ai", "serpspace.com" */
  domain: string | null;

  /** Additional domains (staging, docs, etc.) */
  additionalDomains: string[];

  /** Logo URL (stored in Supabase Storage) */
  logoUrl: string | null;

  /** Favicon URL */
  faviconUrl: string | null;

  /** Brand color scheme */
  colorScheme: VentureColorScheme;

  /** Social links */
  links: {
    website: string | null;
    github: string | null;
    twitter: string | null;
    linkedin: string | null;
    discord: string | null;
    docs: string | null;
  };

  /** Founding team / key stakeholders */
  founders: string[];

  /** Contact email for the venture */
  contactEmail: string | null;

  /** Timezone the venture primarily operates in */
  timezone: string;
}

export interface VentureColorScheme {
  primary: string;    // Hex color, e.g. "#6366F1"
  secondary: string;  // Hex color
  accent: string;     // Hex color
  background: string; // Hex color
  foreground: string; // Hex color
}
```

### VentureStage & VentureStatus

```typescript
/**
 * Lifecycle stages — ventures progress through these via stage gates.
 * Each transition requires approval through the stage gate workflow.
 */
export type VentureStage =
  | 'idea'       // Concept phase — no code, just a thesis
  | 'validation' // Validating product-market fit — MVP in progress
  | 'seed'       // Seed stage — early users, iterating fast
  | 'growth'     // Growth stage — scaling users, revenue emerging
  | 'scale'      // Scale stage — significant revenue, optimizing unit economics
  | 'mature'     // Mature — stable revenue, focus on efficiency and expansion
  | 'sunset';    // Winding down — being deprecated or sold

/**
 * Operational status — independent of stage.
 * A venture can be in any stage and still be active, paused, or archived.
 */
export type VentureStatus =
  | 'active'     // Normal operations
  | 'paused'     // Temporarily paused (team reassigned, funding gap, etc.)
  | 'archived'   // Soft-deleted — data retained, no active operations
  | 'suspended'; // Administratively suspended (compliance, billing, etc.)

/**
 * Industry vertical classifications for portfolio analysis.
 */
export type VentureIndustry =
  | 'sports-betting'
  | 'seo-marketing'
  | 'government-grants'
  | 'gaming'
  | 'real-estate'
  | 'fintech'
  | 'edtech'
  | 'healthtech'
  | 'saas'
  | 'marketplace'
  | 'ai-ml'
  | 'other';
```

### VentureConfig

```typescript
/**
 * Per-venture configuration — environment variables, feature flags,
 * domain settings, and deployment parameters. These drive the
 * multi-tenant runtime behavior of each venture.
 */
export interface VentureConfig {
  id: string;
  ventureId: VentureId;

  /** Environment variables (encrypted at rest) */
  envVars: Record<string, EncryptedValue>;

  /** Feature flags — venture-specific overrides */
  featureFlags: FeatureFlag[];

  /** Domain configuration */
  domains: DomainConfig;

  /** Deployment target configuration */
  deployment: DeploymentTarget;

  /** Third-party integrations enabled for this venture */
  integrations: IntegrationConfig[];

  /** Rate limits and quotas */
  limits: VentureLimits;

  createdAt: Date;
  updatedAt: Date;
  version: number; // Optimistic concurrency control
}

export interface FeatureFlag {
  /** Unique flag key, e.g. "enable-ai-predictions", "beta-dashboard" */
  key: string;

  /** Human-readable description */
  description: string;

  /** Whether the flag is enabled */
  enabled: boolean;

  /** Optional: percentage rollout (0-100) */
  rolloutPercentage: number | null;

  /** Optional: specific user/tenant targeting */
  targeting: FlagTargeting | null;

  /** When the flag was last toggled */
  lastToggledAt: Date;
  lastToggledBy: UserId;
}

export interface FlagTargeting {
  /** Include specific user IDs */
  includeUsers: UserId[];
  /** Exclude specific user IDs */
  excludeUsers: UserId[];
  /** Include specific tenant IDs */
  includeTenants: TenantId[];
  /** Target by user attribute (e.g., plan, role) */
  attributeRules: AttributeRule[];
}

export interface DomainConfig {
  /** Primary production domain */
  primary: string;
  /** Custom domains mapped to this venture */
  custom: CustomDomain[];
  /** SSL certificate status */
  sslStatus: 'active' | 'pending' | 'expired' | 'none';
  /** CDN configuration */
  cdn: 'cloudflare' | 'vercel' | 'none';
}

export interface CustomDomain {
  domain: string;
  verified: boolean;
  verifiedAt: Date | null;
  dnsRecords: DnsRecord[];
}

export interface DeploymentTarget {
  /** Primary hosting provider */
  provider: 'vercel' | 'aws' | 'gcp' | 'railway' | 'fly-io' | 'self-hosted';
  /** Region/location */
  region: string;
  /** Environment-specific configs */
  environments: {
    development: EnvironmentConfig;
    staging: EnvironmentConfig;
    production: EnvironmentConfig;
  };
}

export interface EnvironmentConfig {
  url: string;
  branch: string;
  autoDeployEnabled: boolean;
  environmentVariableOverrides: Record<string, string>;
}

export interface VentureLimits {
  /** Max API requests per minute */
  apiRateLimit: number;
  /** Max storage in GB */
  storageQuotaGb: number;
  /** Max team members */
  maxTeamMembers: number;
  /** Max monthly active users */
  maxMau: number;
  /** Max database size in GB */
  maxDbSizeGb: number;
}
```

### VentureHealth

```typescript
/**
 * Health monitoring — KPI snapshots captured at regular intervals.
 * Powers the health dashboard and trend analysis.
 */
export interface VentureHealth {
  ventureId: VentureId;

  /** Overall health score (0-100), computed from weighted KPIs */
  overallScore: number;

  /** Individual KPI values */
  kpis: VentureKPIs;

  /** Health grade derived from overall score */
  grade: HealthGrade;

  /** Active alerts for concerning metrics */
  alerts: HealthAlert[];

  /** Trend direction over last 30 days */
  trend: 'improving' | 'stable' | 'declining';

  /** When this snapshot was captured */
  capturedAt: Date;
}

export interface VentureKPIs {
  /** Monthly Recurring Revenue in USD cents */
  mrr: number;

  /** Annual Recurring Revenue in USD cents (MRR × 12, or actual) */
  arr: number;

  /** Monthly churn rate as a percentage (0-100) */
  churnRate: number;

  /** Customer Acquisition Cost in USD cents */
  cac: number;

  /** Customer Lifetime Value in USD cents */
  ltv: number;

  /** LTV:CAC ratio — healthy is > 3.0 */
  ltvCacRatio: number;

  /** Net Promoter Score (-100 to 100) */
  nps: number | null;

  /** Monthly Active Users */
  mau: number;

  /** Daily Active Users */
  dau: number;

  /** DAU/MAU ratio — engagement stickiness */
  dauMauRatio: number;

  /** Runway in months (cash / monthly burn) */
  runway: number | null;

  /** Monthly burn rate in USD cents */
  burnRate: number;

  /** Gross margin as percentage (0-100) */
  grossMargin: number;

  /** Revenue growth rate month-over-month (percentage) */
  revenueGrowthRate: number;

  /** Customer count */
  totalCustomers: number;

  /** Number of paying customers */
  payingCustomers: number;

  /** Average Revenue Per User in USD cents */
  arpu: number;

  /** Time to value in days (onboarding → first value) */
  timeToValue: number | null;

  /** Support ticket resolution time in hours */
  avgResolutionTime: number | null;

  /** Uptime percentage (99.9%, etc.) */
  uptime: number;
}

export type HealthGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export interface HealthAlert {
  id: string;
  metric: keyof VentureKPIs;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  threshold: number;
  actualValue: number;
  triggeredAt: Date;
  acknowledgedAt: Date | null;
  acknowledgedBy: UserId | null;
}
```

### TeamAssignment

```typescript
/**
 * Maps team members to ventures with roles and allocation percentages.
 * A single person can be allocated across multiple ventures.
 * Total allocation across all ventures should not exceed 100%.
 */
export interface TeamAssignment {
  id: string;
  ventureId: VentureId;
  userId: UserId;

  /** Role within this specific venture */
  role: TeamRole;

  /** What percentage of their time is allocated to this venture (0-100) */
  allocationPercentage: number;

  /** Start date of this assignment */
  startDate: Date;

  /** End date (null = ongoing) */
  endDate: Date | null;

  /** Whether this is the person's primary venture */
  isPrimary: boolean;

  /** Optional notes about the assignment */
  notes: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export type TeamRole =
  | 'lead'           // Venture lead / CEO equivalent
  | 'co-lead'        // Co-lead
  | 'engineer'       // Software engineer
  | 'senior-engineer' // Senior software engineer
  | 'designer'       // UI/UX designer
  | 'product'        // Product manager
  | 'marketing'      // Marketing / growth
  | 'sales'          // Sales
  | 'support'        // Customer support
  | 'data'           // Data analyst / scientist
  | 'devops'         // DevOps / infrastructure
  | 'qa'             // Quality assurance
  | 'advisor'        // Advisory role (low allocation)
  | 'contractor';    // External contractor
```

### TechStack

```typescript
/**
 * Technology stack registry per venture.
 * Tracks what technologies, frameworks, and services each venture uses.
 * Enables cross-venture dependency analysis and standardization.
 */
export interface TechStack {
  id: string;
  ventureId: VentureId;

  /** Categorized technology entries */
  entries: TechStackEntry[];

  /** Infrastructure summary */
  infrastructure: InfrastructureConfig;

  /** Last audit date */
  lastAuditedAt: Date | null;
  lastAuditedBy: UserId | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface TechStackEntry {
  /** Technology name, e.g. "Next.js", "PostgreSQL", "Redis" */
  name: string;

  /** Semver version or "latest" */
  version: string;

  /** Category classification */
  category: TechCategory;

  /** How critical is this to the venture */
  criticality: 'core' | 'important' | 'nice-to-have';

  /** License type */
  license: string | null;

  /** Monthly cost in USD cents (for paid services) */
  monthlyCost: number | null;

  /** Notes or justification */
  notes: string | null;
}

export type TechCategory =
  | 'frontend-framework'
  | 'backend-framework'
  | 'database'
  | 'cache'
  | 'message-queue'
  | 'search'
  | 'auth'
  | 'storage'
  | 'cdn'
  | 'monitoring'
  | 'analytics'
  | 'ci-cd'
  | 'hosting'
  | 'email'
  | 'payment'
  | 'ai-ml'
  | 'other';

export interface InfrastructureConfig {
  /** Primary cloud provider */
  cloudProvider: 'aws' | 'gcp' | 'azure' | 'vercel' | 'railway' | 'fly-io' | 'hybrid';

  /** Container orchestration */
  containerization: 'docker' | 'kubernetes' | 'serverless' | 'none';

  /** CI/CD platform */
  ciCd: 'github-actions' | 'gitlab-ci' | 'circle-ci' | 'vercel' | 'other';

  /** Primary database hosting */
  databaseHost: 'supabase' | 'neon' | 'planetscale' | 'rds' | 'cloud-sql' | 'self-hosted';

  /** Estimated monthly infrastructure cost in USD cents */
  estimatedMonthlyCost: number;

  /** Regions deployed to */
  regions: string[];
}
```

### StageGate

```typescript
/**
 * Stage gate — a milestone-based checkpoint that ventures must pass
 * to progress from one stage to the next.
 * 
 * Example: To move from "seed" to "growth", a venture must:
 * - Have ≥100 paying customers
 * - Achieve ≥$10k MRR
 * - Maintain churn < 10%
 * - Have a full-time team lead assigned
 * 
 * Stage gates require explicit approval from authorized approvers.
 */
export interface StageGate {
  id: string;
  ventureId: VentureId;

  /** The stage transition this gate governs */
  fromStage: VentureStage;
  toStage: VentureStage;

  /** Current status of this gate */
  status: StageGateStatus;

  /** Milestones that must be met */
  milestones: StageGateMilestone[];

  /** Percentage of milestones completed (0-100) */
  completionPercentage: number;

  /** Who submitted this gate for review */
  submittedBy: UserId | null;
  submittedAt: Date | null;

  /** Approval chain */
  approvals: StageGateApproval[];

  /** Required number of approvals */
  requiredApprovals: number;

  /** Optional notes / context for the transition */
  notes: string | null;

  /** Target date for completing this transition */
  targetDate: Date | null;

  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export type StageGateStatus =
  | 'not-started'  // Gate exists but no milestones completed
  | 'in-progress'  // Some milestones completed
  | 'submitted'    // Submitted for approval
  | 'approved'     // Approved — stage transition will occur
  | 'rejected'     // Rejected — needs more work
  | 'completed';   // Transition completed

export interface StageGateMilestone {
  id: string;
  stageGateId: string;

  /** Human-readable milestone title */
  title: string;

  /** Detailed description / acceptance criteria */
  description: string;

  /** Category of milestone */
  category: 'revenue' | 'users' | 'team' | 'product' | 'technical' | 'compliance' | 'other';

  /** Whether this milestone is met */
  completed: boolean;

  /** Auto-check: KPI-based validation rule (optional) */
  autoCheckRule: AutoCheckRule | null;

  /** Evidence / proof of completion */
  evidence: string | null;

  /** Who verified this milestone */
  verifiedBy: UserId | null;
  verifiedAt: Date | null;
}

export interface AutoCheckRule {
  /** Which KPI to check */
  metric: keyof VentureKPIs;
  /** Comparison operator */
  operator: 'gte' | 'lte' | 'gt' | 'lt' | 'eq';
  /** Threshold value */
  value: number;
}

export interface StageGateApproval {
  id: string;
  stageGateId: string;
  approverId: UserId;
  decision: 'approved' | 'rejected' | 'pending';
  comments: string | null;
  decidedAt: Date | null;
}
```

### VentureTemplate

```typescript
/**
 * Starter templates for rapidly bootstrapping new ventures.
 * Templates pre-configure tech stack, team structure, stage gates,
 * feature flags, and deployment settings for common venture types.
 */
export interface VentureTemplate {
  id: VentureTemplateId;

  /** Template name, e.g. "SaaS Starter", "Marketplace Blueprint" */
  name: string;

  /** Detailed description of what this template includes */
  description: string;

  /** Industry vertical this template targets */
  industry: VentureIndustry;

  /** Type of product this template is designed for */
  productType: 'saas' | 'marketplace' | 'fintech' | 'gaming' | 'mobile-app' | 'api-service' | 'other';

  /** Default profile settings */
  defaultProfile: Partial<VentureProfile>;

  /** Default tech stack */
  defaultTechStack: TechStackEntry[];

  /** Default feature flags */
  defaultFeatureFlags: Omit<FeatureFlag, 'lastToggledAt' | 'lastToggledBy'>[];

  /** Default team roles needed */
  suggestedTeamStructure: { role: TeamRole; count: number; description: string }[];

  /** Pre-configured stage gate milestones */
  stageGateTemplates: {
    fromStage: VentureStage;
    toStage: VentureStage;
    milestones: Omit<StageGateMilestone, 'id' | 'stageGateId' | 'completed' | 'verifiedBy' | 'verifiedAt'>[];
  }[];

  /** Default deployment configuration */
  defaultDeployment: Partial<DeploymentTarget>;

  /** Default resource limits */
  defaultLimits: Partial<VentureLimits>;

  /** Who created this template */
  createdBy: UserId;

  /** Whether this is an official MCV template */
  isOfficial: boolean;

  /** Usage count — how many ventures used this template */
  usageCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export type VentureTemplateId = string & { readonly __brand: 'VentureTemplateId' };
```

### VentureService

```typescript
/**
 * Primary service for venture CRUD and lifecycle management.
 * All mutations are audit-logged and emit domain events.
 */
export interface IVentureService {
  // === CRUD ===
  
  /** Create a new venture with profile, config, and optional template */
  create(input: CreateVentureInput): Promise<Venture>;
  
  /** Get a venture by ID with optional relations */
  getById(id: VentureId, options?: VentureQueryOptions): Promise<Venture | null>;
  
  /** Get a venture by slug */
  getBySlug(slug: VentureSlug): Promise<Venture | null>;
  
  /** List ventures with filtering, sorting, and pagination */
  list(filter?: VentureFilter): Promise<PaginatedResult<Venture>>;
  
  /** Update venture profile and/or configuration */
  update(id: VentureId, input: UpdateVentureInput): Promise<Venture>;
  
  /** Soft-archive a venture (data retained, operations stopped) */
  archive(id: VentureId, reason: string): Promise<Venture>;
  
  /** Reactivate a previously archived venture */
  reactivate(id: VentureId): Promise<Venture>;

  // === Lifecycle ===
  
  /** Create a venture from a template */
  fromTemplate(templateId: VentureTemplateId, overrides: Partial<CreateVentureInput>): Promise<Venture>;
  
  /** Change venture stage (requires approved stage gate) */
  transitionStage(id: VentureId, toStage: VentureStage): Promise<Venture>;
  
  /** Suspend a venture (admin action) */
  suspend(id: VentureId, reason: string): Promise<Venture>;
  
  /** Check if a slug is available */
  isSlugAvailable(slug: string): Promise<boolean>;

  // === Queries ===
  
  /** Get total count by status */
  countByStatus(): Promise<Record<VentureStatus, number>>;
  
  /** Get ventures grouped by stage */
  groupByStage(): Promise<Record<VentureStage, Venture[]>>;
  
  /** Search ventures by name, description, or tags */
  search(query: string): Promise<Venture[]>;
}

export interface CreateVentureInput {
  name: string;
  slug?: string; // Auto-generated from name if not provided
  tagline: string;
  description: string;
  industry: VentureIndustry;
  stage?: VentureStage; // Defaults to 'idea'
  domain?: string;
  colorScheme?: Partial<VentureColorScheme>;
  templateId?: VentureTemplateId;
  founders?: string[];
  contactEmail?: string;
  timezone?: string;
}

export interface UpdateVentureInput {
  profile?: Partial<VentureProfile>;
  industry?: VentureIndustry;
}

export interface VentureFilter {
  status?: VentureStatus[];
  stage?: VentureStage[];
  industry?: VentureIndustry[];
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  sortBy?: 'name' | 'createdAt' | 'healthScore' | 'mrr' | 'stage';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface VentureQueryOptions {
  includeConfig?: boolean;
  includeHealth?: boolean;
  includeTeam?: boolean;
  includeTechStack?: boolean;
  includeStageGates?: boolean;
}
```

### VentureComparison

```typescript
/**
 * Side-by-side comparison of multiple ventures across selected metrics.
 * Used in the portfolio overview dashboard for strategic decision-making.
 */
export interface VentureComparison {
  /** Ventures being compared */
  ventures: VentureComparisonEntry[];

  /** Metrics used for comparison */
  metrics: VentureComparisonMetric[];

  /** Generated at timestamp */
  generatedAt: Date;

  /** Portfolio-level aggregates */
  portfolioSummary: PortfolioSummary;
}

export interface VentureComparisonEntry {
  ventureId: VentureId;
  ventureName: string;
  stage: VentureStage;
  healthScore: number;
  values: Record<string, number>;
  rank: Record<string, number>;
}

export type VentureComparisonMetric =
  | 'mrr'
  | 'arr'
  | 'churnRate'
  | 'cac'
  | 'ltv'
  | 'ltvCacRatio'
  | 'nps'
  | 'mau'
  | 'dau'
  | 'runway'
  | 'burnRate'
  | 'grossMargin'
  | 'revenueGrowthRate'
  | 'totalCustomers'
  | 'healthScore'
  | 'uptime'
  | 'teamSize';

export interface PortfolioSummary {
  totalVentures: number;
  activeVentures: number;
  totalMrr: number;
  totalArr: number;
  totalCustomers: number;
  totalTeamMembers: number;
  averageHealthScore: number;
  topPerformer: { ventureId: VentureId; name: string; score: number };
  needsAttention: { ventureId: VentureId; name: string; score: number; reason: string }[];
  totalBurnRate: number;
  portfolioRunway: number | null;
  venturesByStage: Record<VentureStage, number>;
  venturesByIndustry: Record<VentureIndustry, number>;
}
```

---

## Database Schemas (Drizzle ORM)

### ventures

```typescript
import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// === Enums ===

export const ventureStageEnum = pgEnum('venture_stage', [
  'idea',
  'validation',
  'seed',
  'growth',
  'scale',
  'mature',
  'sunset',
]);

export const ventureStatusEnum = pgEnum('venture_status', [
  'active',
  'paused',
  'archived',
  'suspended',
]);

export const ventureIndustryEnum = pgEnum('venture_industry', [
  'sports-betting',
  'seo-marketing',
  'government-grants',
  'gaming',
  'real-estate',
  'fintech',
  'edtech',
  'healthtech',
  'saas',
  'marketplace',
  'ai-ml',
  'other',
]);

// === Main Table ===

export const ventures = pgTable('ventures', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'restrict' }),
  
  // Profile (stored as JSONB for flexibility)
  profile: jsonb('profile').notNull().$type<VentureProfile>(),

  // Classification
  stage: ventureStageEnum('stage').notNull().default('idea'),
  status: ventureStatusEnum('status').notNull().default('active'),
  industry: ventureIndustryEnum('industry').notNull(),

  // Computed / cached
  healthScore: integer('health_score'),

  // Template origin
  templateId: uuid('template_id').references(() => ventureTemplates.id),

  // Dates
  foundedAt: timestamp('founded_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),

  // Audit
  createdBy: uuid('created_by').notNull(),
});

// === Indexes ===
// CREATE INDEX idx_ventures_slug ON ventures(slug);
// CREATE INDEX idx_ventures_tenant_id ON ventures(tenant_id);
// CREATE INDEX idx_ventures_status ON ventures(status);
// CREATE INDEX idx_ventures_stage ON ventures(stage);
// CREATE INDEX idx_ventures_industry ON ventures(industry);
// CREATE INDEX idx_ventures_health_score ON ventures(health_score);

// === RLS Policy ===
// Ventures are only visible to super-admins and consortium operators.
// Row-level security ensures tenant isolation:
//
// CREATE POLICY ventures_super_admin ON ventures
//   FOR ALL
//   USING (
//     auth.jwt() ->> 'role' = 'super-admin'
//     OR auth.jwt() ->> 'role' = 'consortium-operator'
//   );
//
// For tenant-scoped access (a venture viewing its own record):
// CREATE POLICY ventures_own_tenant ON ventures
//   FOR SELECT
//   USING (tenant_id = auth.jwt() ->> 'tenant_id');

// === Relations ===

export const venturesRelations = relations(ventures, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [ventures.tenantId],
    references: [tenants.id],
  }),
  config: one(ventureConfigs, {
    fields: [ventures.id],
    references: [ventureConfigs.ventureId],
  }),
  healthSnapshots: many(ventureHealthSnapshots),
  teamAssignments: many(teamAssignments),
  techStack: one(techStacks, {
    fields: [ventures.id],
    references: [techStacks.ventureId],
  }),
  stageGates: many(stageGates),
  template: one(ventureTemplates, {
    fields: [ventures.templateId],
    references: [ventureTemplates.id],
  }),
}));
```

### venture_configs

```typescript
export const ventureConfigs = pgTable('venture_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id')
    .notNull()
    .unique()
    .references(() => ventures.id, { onDelete: 'cascade' }),

  // Encrypted environment variables
  envVars: jsonb('env_vars').notNull().default({}).$type<Record<string, EncryptedValue>>(),

  // Feature flags
  featureFlags: jsonb('feature_flags').notNull().default([]).$type<FeatureFlag[]>(),

  // Domain configuration
  domains: jsonb('domains').notNull().$type<DomainConfig>(),

  // Deployment configuration
  deployment: jsonb('deployment').notNull().$type<DeploymentTarget>(),

  // Integrations
  integrations: jsonb('integrations').notNull().default([]).$type<IntegrationConfig[]>(),

  // Resource limits
  limits: jsonb('limits').notNull().$type<VentureLimits>(),

  // Optimistic concurrency
  version: integer('version').notNull().default(1),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ventureConfigsRelations = relations(ventureConfigs, ({ one }) => ({
  venture: one(ventures, {
    fields: [ventureConfigs.ventureId],
    references: [ventures.id],
  }),
}));
```

### venture_health_snapshots

```typescript
export const ventureHealthSnapshots = pgTable('venture_health_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id')
    .notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),

  // Overall computed score
  overallScore: integer('overall_score').notNull(),
  grade: text('grade').notNull().$type<HealthGrade>(),

  // All KPI values at time of snapshot
  kpis: jsonb('kpis').notNull().$type<VentureKPIs>(),

  // Active alerts at time of snapshot
  alerts: jsonb('alerts').notNull().default([]).$type<HealthAlert[]>(),

  // Trend direction
  trend: text('trend').notNull().$type<'improving' | 'stable' | 'declining'>(),

  // Snapshot timestamp (usually daily or hourly)
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),

  // Optional: who/what triggered this snapshot
  capturedBy: text('captured_by'), // 'system', 'cron', or user ID
});

// === Indexes ===
// CREATE INDEX idx_health_venture_id ON venture_health_snapshots(venture_id);
// CREATE INDEX idx_health_captured_at ON venture_health_snapshots(captured_at DESC);
// CREATE INDEX idx_health_venture_captured ON venture_health_snapshots(venture_id, captured_at DESC);

// Time-series partitioning recommended for production:
// PARTITION BY RANGE (captured_at) — monthly partitions

export const ventureHealthSnapshotsRelations = relations(ventureHealthSnapshots, ({ one }) => ({
  venture: one(ventures, {
    fields: [ventureHealthSnapshots.ventureId],
    references: [ventures.id],
  }),
}));
```

### team_assignments

```typescript
export const teamRoleEnum = pgEnum('team_role', [
  'lead',
  'co-lead',
  'engineer',
  'senior-engineer',
  'designer',
  'product',
  'marketing',
  'sales',
  'support',
  'data',
  'devops',
  'qa',
  'advisor',
  'contractor',
]);

export const teamAssignments = pgTable('team_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id')
    .notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  role: teamRoleEnum('role').notNull(),
  allocationPercentage: integer('allocation_percentage').notNull().default(100),

  startDate: timestamp('start_date', { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp('end_date', { withTimezone: true }),

  isPrimary: boolean('is_primary').notNull().default(false),
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // A user can only have one active assignment per venture per role
  uniqueActiveAssignment: unique().on(table.ventureId, table.userId, table.role),
}));

// === Indexes ===
// CREATE INDEX idx_team_venture_id ON team_assignments(venture_id);
// CREATE INDEX idx_team_user_id ON team_assignments(user_id);
// CREATE INDEX idx_team_role ON team_assignments(role);

// === Constraint ===
// CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100)
// Application-level: SUM(allocation_percentage) for a user across all ventures <= 100

export const teamAssignmentsRelations = relations(teamAssignments, ({ one }) => ({
  venture: one(ventures, {
    fields: [teamAssignments.ventureId],
    references: [ventures.id],
  }),
  user: one(users, {
    fields: [teamAssignments.userId],
    references: [users.id],
  }),
}));
```

### tech_stacks

```typescript
export const techStacks = pgTable('tech_stacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id')
    .notNull()
    .unique()
    .references(() => ventures.id, { onDelete: 'cascade' }),

  // All technology entries
  entries: jsonb('entries').notNull().default([]).$type<TechStackEntry[]>(),

  // Infrastructure configuration
  infrastructure: jsonb('infrastructure').notNull().$type<InfrastructureConfig>(),

  // Audit trail
  lastAuditedAt: timestamp('last_audited_at', { withTimezone: true }),
  lastAuditedBy: uuid('last_audited_by'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const techStacksRelations = relations(techStacks, ({ one }) => ({
  venture: one(ventures, {
    fields: [techStacks.ventureId],
    references: [ventures.id],
  }),
}));
```

### stage_gates

```typescript
export const stageGateStatusEnum = pgEnum('stage_gate_status', [
  'not-started',
  'in-progress',
  'submitted',
  'approved',
  'rejected',
  'completed',
]);

export const stageGates = pgTable('stage_gates', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id')
    .notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),

  fromStage: ventureStageEnum('from_stage').notNull(),
  toStage: ventureStageEnum('to_stage').notNull(),
  status: stageGateStatusEnum('status').notNull().default('not-started'),

  // Milestones stored as JSONB array
  milestones: jsonb('milestones').notNull().default([]).$type<StageGateMilestone[]>(),

  completionPercentage: integer('completion_percentage').notNull().default(0),

  // Submission
  submittedBy: uuid('submitted_by'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),

  // Approvals
  approvals: jsonb('approvals').notNull().default([]).$type<StageGateApproval[]>(),
  requiredApprovals: integer('required_approvals').notNull().default(1),

  notes: text('notes'),
  targetDate: timestamp('target_date', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// === Indexes ===
// CREATE INDEX idx_stage_gates_venture_id ON stage_gates(venture_id);
// CREATE INDEX idx_stage_gates_status ON stage_gates(status);
// CREATE UNIQUE INDEX idx_stage_gates_unique_transition ON stage_gates(venture_id, from_stage, to_stage)
//   WHERE status NOT IN ('completed', 'rejected');

export const stageGatesRelations = relations(stageGates, ({ one }) => ({
  venture: one(ventures, {
    fields: [stageGates.ventureId],
    references: [ventures.id],
  }),
}));
```

### venture_templates

```typescript
export const ventureTemplates = pgTable('venture_templates', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: text('name').notNull().unique(),
  description: text('description').notNull(),

  industry: ventureIndustryEnum('industry').notNull(),
  productType: text('product_type').notNull().$type<VentureTemplate['productType']>(),

  // Template contents (all JSONB)
  defaultProfile: jsonb('default_profile').notNull().default({}).$type<Partial<VentureProfile>>(),
  defaultTechStack: jsonb('default_tech_stack').notNull().default([]).$type<TechStackEntry[]>(),
  defaultFeatureFlags: jsonb('default_feature_flags').notNull().default([]),
  suggestedTeamStructure: jsonb('suggested_team_structure').notNull().default([]),
  stageGateTemplates: jsonb('stage_gate_templates').notNull().default([]),
  defaultDeployment: jsonb('default_deployment').notNull().default({}),
  defaultLimits: jsonb('default_limits').notNull().default({}),

  // Metadata
  createdBy: uuid('created_by').notNull(),
  isOfficial: boolean('is_official').notNull().default(false),
  usageCount: integer('usage_count').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ventureTemplatesRelations = relations(ventureTemplates, ({ many }) => ({
  ventures: many(ventures),
}));
```

---

## MCV Venture Registry

The nine ventures currently in the MCV consortium:

| # | Venture | Slug | Industry | Stage | Description |
|---|---------|------|----------|-------|-------------|
| 1 | **BetEdge** | `betedge` | sports-betting | growth | AI-powered sports betting intelligence — predictive models, odds analysis, bankroll management |
| 2 | **SerpSpace** | `serpspace` | seo-marketing | growth | Enterprise SEO platform — rank tracking, keyword research, backlink analysis, SERP monitoring |
| 3 | **Full Gain** | `fullgain` | government-grants | seed | Grant management platform — discovery, application tracking, compliance for government funding |
| 4 | **MCV Studios** | `mcv-studios` | gaming | validation | Game development studio — indie titles, mobile games, interactive entertainment |
| 5 | **Futurestate** | `futurestate` | real-estate | idea | Real estate analytics — market predictions, property valuation, investment portfolio management |
| 6 | **PayPath** | `paypath` | fintech | seed | Payment orchestration — multi-provider routing, smart retries, fee optimization |
| 7 | **SkillForge** | `skillforge` | edtech | idea | Skills-based learning platform — micro-credentials, competency mapping, career pathways |
| 8 | **VitalSync** | `vitalsync` | healthtech | idea | Health data integration — wearable aggregation, health scoring, provider dashboards |
| 9 | **NexusAI** | `nexus-ai` | ai-ml | validation | AI/ML ops platform — model registry, experiment tracking, inference pipeline management |

---

## Code Examples

### 1. Creating a New Venture

```typescript
import { VentureService } from '@mcv/portfolio/ventures';
import { db } from '@mcv/shared/db';
import { eventBus } from '@mcv/shared/events';

const ventureService = new VentureService(db, eventBus);

// Create a new venture from scratch
const betedge = await ventureService.create({
  name: 'BetEdge',
  slug: 'betedge',
  tagline: 'AI-Powered Sports Betting Intelligence',
  description: `
    BetEdge leverages advanced machine learning models to analyze 
    historical sports data, real-time odds movements, and market 
    inefficiencies. Our platform helps serious bettors make data-driven 
    decisions with predictive models, bankroll management tools, and 
    automated alert systems.
  `.trim(),
  industry: 'sports-betting',
  stage: 'growth',
  domain: 'betedge.ai',
  colorScheme: {
    primary: '#10B981',
    secondary: '#059669',
    accent: '#34D399',
    background: '#0F172A',
    foreground: '#F8FAFC',
  },
  founders: ['Moustafa Al-Nakeeb'],
  contactEmail: 'team@betedge.ai',
  timezone: 'America/Toronto',
});

console.log(`Created venture: ${betedge.id} (${betedge.slug})`);
// Created venture: 01912345-6789-7abc-def0-123456789abc (betedge)

// The VentureService automatically:
// 1. Generates a tenant via @mcv/identity/tenants
// 2. Creates default venture config
// 3. Initializes empty stage gates for the current stage
// 4. Emits VENTURE_CREATED event
```

### 2. Creating a Venture from a Template

```typescript
import { VentureService, VentureTemplateService } from '@mcv/portfolio/ventures';

const templateService = new VentureTemplateService(db);
const ventureService = new VentureService(db, eventBus);

// List available templates
const templates = await templateService.list();
// Returns: SaaS Starter, Marketplace Blueprint, Fintech Foundation, Gaming Studio, ...

// Preview what a template would generate
const preview = await templateService.preview('saas-starter');
console.log(preview);
// {
//   suggestedTechStack: ['Next.js', 'Supabase', 'Stripe', 'Resend', ...],
//   suggestedTeam: [{ role: 'lead', count: 1 }, { role: 'engineer', count: 2 }, ...],
//   stageGates: [{ from: 'idea', to: 'validation', milestones: 5 }, ...],
//   defaultLimits: { apiRateLimit: 1000, storageQuotaGb: 10, ... },
// }

// Create a venture from the template
const paypath = await ventureService.fromTemplate('saas-starter', {
  name: 'PayPath',
  slug: 'paypath',
  tagline: 'Smart Payment Orchestration',
  description: 'Multi-provider payment routing with smart retries and fee optimization.',
  industry: 'fintech',
  domain: 'paypath.io',
  founders: ['Moustafa Al-Nakeeb'],
  contactEmail: 'hello@paypath.io',
});

// The template auto-configures:
// - Tech stack (Next.js, Supabase, Stripe, etc.)
// - Feature flags (onboarding-wizard: true, beta-dashboard: false, etc.)
// - Stage gate milestones (idea → validation, validation → seed, etc.)
// - Deployment targets (Vercel, us-east-1)
// - Resource limits (1000 req/min, 10GB storage, etc.)
// - Suggested team structure
```

### 3. Health Dashboard & KPI Monitoring

```typescript
import { VentureHealthService } from '@mcv/portfolio/ventures';

const healthService = new VentureHealthService(db);

// Capture a health snapshot (typically run by a cron job)
const snapshot = await healthService.captureSnapshot('betedge', {
  mrr: 4250000,           // $42,500 MRR (stored in cents)
  arr: 51000000,          // $510,000 ARR
  churnRate: 3.2,         // 3.2% monthly churn
  cac: 12000,             // $120 CAC
  ltv: 480000,            // $4,800 LTV
  ltvCacRatio: 40.0,      // 40:1 LTV:CAC (excellent)
  nps: 62,                // NPS 62 (great)
  mau: 8500,
  dau: 3200,
  dauMauRatio: 0.376,     // 37.6% stickiness
  runway: null,           // Self-sustaining — no burn
  burnRate: 0,
  grossMargin: 82.5,      // 82.5% gross margin
  revenueGrowthRate: 12.3, // 12.3% MoM growth
  totalCustomers: 1850,
  payingCustomers: 620,
  arpu: 6855,             // $68.55 ARPU
  timeToValue: 2.5,       // 2.5 days to first value
  avgResolutionTime: 4.2, // 4.2 hours avg support resolution
  uptime: 99.97,          // 99.97% uptime
});

console.log(`Health score: ${snapshot.overallScore}/100 (${snapshot.grade})`);
// Health score: 91/100 (A)

// Get the full dashboard for a venture
const dashboard = await healthService.getDashboard('betedge');
console.log(dashboard);
// {
//   current: { overallScore: 91, grade: 'A', kpis: { ... }, alerts: [] },
//   trend: 'improving',
//   history: [
//     { date: '2026-02-07', score: 89 },
//     { date: '2026-02-06', score: 88 },
//     { date: '2026-02-05', score: 87 },
//     ...
//   ],
//   sparklines: {
//     mrr: [3800000, 3950000, 4100000, 4250000],
//     mau: [7200, 7600, 8100, 8500],
//     churnRate: [4.1, 3.8, 3.5, 3.2],
//   },
// }

// Get trend analysis over a period
const trends = await healthService.getTrends('betedge', {
  from: new Date('2025-11-01'),
  to: new Date('2026-02-08'),
  granularity: 'weekly',
});
// Returns weekly aggregated KPI data for charting

// Check for health alerts across all ventures
const alerts = await healthService.getAlerts();
// [
//   {
//     ventureId: 'fullgain',
//     metric: 'churnRate',
//     severity: 'warning',
//     message: 'Churn rate (8.5%) exceeds warning threshold (5%)',
//     threshold: 5,
//     actualValue: 8.5,
//   },
//   {
//     ventureId: 'mcv-studios',
//     metric: 'runway',
//     severity: 'critical',
//     message: 'Runway (3.2 months) below critical threshold (6 months)',
//     threshold: 6,
//     actualValue: 3.2,
//   },
// ]
```

### 4. Team Allocation Management

```typescript
import { VentureTeamService } from '@mcv/portfolio/ventures';

const teamService = new VentureTeamService(db, eventBus);

// Assign a team member to a venture
await teamService.assign({
  ventureId: 'betedge',
  userId: 'user-moustafa',
  role: 'lead',
  allocationPercentage: 40,
  isPrimary: true,
  startDate: new Date('2024-01-01'),
  notes: 'Founder & venture lead',
});

// Assign same person to another venture (split allocation)
await teamService.assign({
  ventureId: 'serpspace',
  userId: 'user-moustafa',
  role: 'lead',
  allocationPercentage: 30,
  isPrimary: false,
  startDate: new Date('2024-03-01'),
});

// Assign more people
await teamService.assign({
  ventureId: 'betedge',
  userId: 'user-alice',
  role: 'senior-engineer',
  allocationPercentage: 100,
  isPrimary: true,
  startDate: new Date('2024-06-01'),
});

await teamService.assign({
  ventureId: 'betedge',
  userId: 'user-bob',
  role: 'engineer',
  allocationPercentage: 60,
  isPrimary: true,
  startDate: new Date('2024-09-01'),
});

await teamService.assign({
  ventureId: 'serpspace',
  userId: 'user-bob',
  role: 'engineer',
  allocationPercentage: 40,
  isPrimary: false,
  startDate: new Date('2024-09-01'),
});

// Validate allocations — ensure no one exceeds 100%
const validation = await teamService.validateAllocations();
console.log(validation);
// {
//   valid: true,
//   overAllocated: [],  // Users whose total allocation exceeds 100%
//   underUtilized: [    // Users with less than 80% total allocation
//     { userId: 'user-moustafa', totalAllocation: 70 },
//   ],
// }

// Get team for a specific venture
const betedgeTeam = await teamService.getByVenture('betedge');
// [
//   { user: 'Moustafa', role: 'lead', allocation: 40%, isPrimary: true },
//   { user: 'Alice', role: 'senior-engineer', allocation: 100%, isPrimary: true },
//   { user: 'Bob', role: 'engineer', allocation: 60%, isPrimary: true },
// ]

// Get all assignments for a specific person
const moustafaAssignments = await teamService.getByMember('user-moustafa');
// [
//   { venture: 'BetEdge', role: 'lead', allocation: 40% },
//   { venture: 'SerpSpace', role: 'lead', allocation: 30% },
// ]

// Reallocate — move someone between ventures
await teamService.reallocate({
  userId: 'user-bob',
  changes: [
    { ventureId: 'betedge', allocationPercentage: 80 },
    { ventureId: 'serpspace', allocationPercentage: 20 },
  ],
});

// Get portfolio-wide team summary
const teamSummary = await teamService.getPortfolioSummary();
// {
//   totalMembers: 12,
//   byVenture: {
//     betedge: { count: 5, totalAllocation: 380 },
//     serpspace: { count: 3, totalAllocation: 220 },
//     ...
//   },
//   byRole: {
//     lead: 3,
//     engineer: 5,
//     'senior-engineer': 2,
//     designer: 1,
//     product: 1,
//   },
//   unassigned: ['user-newguy'],  // Team members not assigned to any venture
// }
```

### 5. Stage Gate Progression

```typescript
import { VentureStageGateService } from '@mcv/portfolio/ventures';

const stageGateService = new VentureStageGateService(db, eventBus);

// Initialize stage gates for a new venture (usually done automatically)
// This creates gates for: idea → validation → seed → growth → scale → mature
await stageGateService.initialize('fullgain');

// Get the current active gate for Full Gain (currently in 'seed')
const currentGate = await stageGateService.getCurrentGate('fullgain');
console.log(currentGate);
// {
//   fromStage: 'seed',
//   toStage: 'growth',
//   status: 'in-progress',
//   completionPercentage: 40,
//   milestones: [
//     { title: '100+ paying customers', category: 'users', completed: false,
//       autoCheckRule: { metric: 'payingCustomers', operator: 'gte', value: 100 } },
//     { title: '$10k+ MRR', category: 'revenue', completed: false,
//       autoCheckRule: { metric: 'mrr', operator: 'gte', value: 1000000 } },
//     { title: 'Churn rate < 10%', category: 'revenue', completed: true,
//       autoCheckRule: { metric: 'churnRate', operator: 'lt', value: 10 } },
//     { title: 'Full-time team lead assigned', category: 'team', completed: true,
//       autoCheckRule: null },
//     { title: 'SOC 2 compliance initiated', category: 'compliance', completed: false,
//       autoCheckRule: null },
//   ],
//   targetDate: '2026-06-01',
// }

// Auto-evaluate milestones against current KPIs
const evaluation = await stageGateService.autoEvaluate('fullgain');
console.log(evaluation);
// {
//   milestoneResults: [
//     { title: '100+ paying customers', passed: false, current: 45, required: 100 },
//     { title: '$10k+ MRR', passed: false, current: 650000, required: 1000000 },
//     { title: 'Churn rate < 10%', passed: true, current: 7.2, required: 10 },
//   ],
//   newCompletionPercentage: 40,
// }

// Manually complete a non-automated milestone
await stageGateService.completeMilestone('fullgain', 'milestone-soc2', {
  evidence: 'SOC 2 Type I audit initiated with Vanta. Engagement letter signed.',
  verifiedBy: 'user-moustafa',
});

// Submit the gate for review once milestones are met
await stageGateService.submit('fullgain', {
  submittedBy: 'user-moustafa',
  notes: 'All milestones met. Ready to transition to growth stage.',
});

// Approve the gate (requires authorized approver)
await stageGateService.approve('fullgain', {
  approverId: 'user-admin',
  comments: 'Metrics look solid. Team is ready for growth phase. Approved.',
});

// The approval triggers:
// 1. Venture stage updates: seed → growth
// 2. VENTURE_STAGE_CHANGED event emitted
// 3. Next stage gate (growth → scale) is initialized
// 4. Notifications sent to all stakeholders
// 5. Stage-specific features unlocked (if gated by feature flags)

// Reject a gate if milestones aren't truly met
await stageGateService.reject('fullgain', {
  approverId: 'user-admin',
  comments: 'Customer count is inflated — 20% are trial accounts, not paying. Recount needed.',
});

// View stage gate history for a venture
const history = await stageGateService.getHistory('betedge');
// [
//   { from: 'idea', to: 'validation', status: 'completed', completedAt: '2024-03-15' },
//   { from: 'validation', to: 'seed', status: 'completed', completedAt: '2024-08-01' },
//   { from: 'seed', to: 'growth', status: 'completed', completedAt: '2025-04-20' },
//   { from: 'growth', to: 'scale', status: 'in-progress', completionPercentage: 65 },
// ]
```

### 6. Venture Comparison & Portfolio Analytics

```typescript
import { VentureComparisonService } from '@mcv/portfolio/ventures';

const comparisonService = new VentureComparisonService(db);

// Compare specific ventures across metrics
const comparison = await comparisonService.compare({
  ventureIds: ['betedge', 'serpspace', 'fullgain'],
  metrics: ['mrr', 'mau', 'churnRate', 'healthScore', 'ltvCacRatio'],
});

console.log(comparison);
// {
//   ventures: [
//     {
//       ventureId: 'betedge', ventureName: 'BetEdge', stage: 'growth',
//       healthScore: 91,
//       values: { mrr: 4250000, mau: 8500, churnRate: 3.2, healthScore: 91, ltvCacRatio: 40.0 },
//       rank: { mrr: 1, mau: 1, churnRate: 1, healthScore: 1, ltvCacRatio: 1 },
//     },
//     {
//       ventureId: 'serpspace', ventureName: 'SerpSpace', stage: 'growth',
//       healthScore: 78,
//       values: { mrr: 2800000, mau: 5200, churnRate: 5.1, healthScore: 78, ltvCacRatio: 12.5 },
//       rank: { mrr: 2, mau: 2, churnRate: 2, healthScore: 2, ltvCacRatio: 2 },
//     },
//     {
//       ventureId: 'fullgain', ventureName: 'Full Gain', stage: 'seed',
//       healthScore: 55,
//       values: { mrr: 650000, mau: 320, churnRate: 7.2, healthScore: 55, ltvCacRatio: 3.8 },
//       rank: { mrr: 3, mau: 3, churnRate: 3, healthScore: 3, ltvCacRatio: 3 },
//     },
//   ],
//   generatedAt: '2026-02-08T21:36:00Z',
// }

// Rank all ventures by a single metric
const rankedByMrr = await comparisonService.rankByMetric('mrr');
// [
//   { rank: 1, venture: 'BetEdge', value: 4250000 },
//   { rank: 2, venture: 'SerpSpace', value: 2800000 },
//   { rank: 3, venture: 'Full Gain', value: 650000 },
//   { rank: 4, venture: 'PayPath', value: 180000 },
//   ...
// ]

// Get the full portfolio summary
const summary = await comparisonService.getPortfolioSummary();
console.log(summary);
// {
//   totalVentures: 9,
//   activeVentures: 7,
//   totalMrr: 8430000,       // $84,300/month across all ventures
//   totalArr: 101160000,     // $1,011,600/year
//   totalCustomers: 3450,
//   totalTeamMembers: 18,
//   averageHealthScore: 62.3,
//   topPerformer: { ventureId: 'betedge', name: 'BetEdge', score: 91 },
//   needsAttention: [
//     { ventureId: 'mcv-studios', name: 'MCV Studios', score: 38,
//       reason: 'Low health score, runway < 6 months' },
//     { ventureId: 'vitalsync', name: 'VitalSync', score: 25,
//       reason: 'No revenue, no team assigned' },
//   ],
//   totalBurnRate: 15200000,   // $152,000/month total burn
//   portfolioRunway: 14.2,     // ~14 months portfolio-level runway
//   venturesByStage: { idea: 3, validation: 2, seed: 1, growth: 2, scale: 1 },
//   venturesByIndustry: { 'sports-betting': 1, 'seo-marketing': 1, ... },
// }
```

### 7. Tech Stack Management

```typescript
import { VentureTechStackService } from '@mcv/portfolio/ventures';

const techStackService = new VentureTechStackService(db);

// Register the tech stack for BetEdge
await techStackService.register('betedge', {
  entries: [
    {
      name: 'Next.js',
      version: '14.2',
      category: 'frontend-framework',
      criticality: 'core',
      license: 'MIT',
      monthlyCost: null,
      notes: 'App router with server components',
    },
    {
      name: 'Supabase',
      version: 'latest',
      category: 'database',
      criticality: 'core',
      license: 'Apache-2.0',
      monthlyCost: 2500, // $25/month
      notes: 'PostgreSQL + Auth + Realtime + Storage',
    },
    {
      name: 'Redis',
      version: '7.2',
      category: 'cache',
      criticality: 'important',
      license: 'BSD-3-Clause',
      monthlyCost: 1500,
      notes: 'Upstash serverless Redis for caching and rate limiting',
    },
    {
      name: 'TensorFlow',
      version: '2.15',
      category: 'ai-ml',
      criticality: 'core',
      license: 'Apache-2.0',
      monthlyCost: null,
      notes: 'Predictive models for sports outcome analysis',
    },
    {
      name: 'Stripe',
      version: 'latest',
      category: 'payment',
      criticality: 'core',
      license: 'Proprietary',
      monthlyCost: null, // Usage-based
      notes: 'Payment processing, subscriptions, invoicing',
    },
    {
      name: 'Vercel',
      version: 'latest',
      category: 'hosting',
      criticality: 'core',
      license: 'Proprietary',
      monthlyCost: 2000,
      notes: 'Edge deployment, serverless functions, analytics',
    },
  ],
  infrastructure: {
    cloudProvider: 'vercel',
    containerization: 'serverless',
    ciCd: 'github-actions',
    databaseHost: 'supabase',
    estimatedMonthlyCost: 8500, // $85/month
    regions: ['us-east-1', 'eu-west-1'],
  },
});

// Audit a tech stack — check for outdated versions, license issues, etc.
const auditResult = await techStackService.audit('betedge');
console.log(auditResult);
// {
//   outdated: [
//     { name: 'TensorFlow', current: '2.15', latest: '2.16', severity: 'minor' },
//   ],
//   licenseIssues: [],
//   costBreakdown: {
//     total: 8500,
//     byCategory: { database: 2500, cache: 1500, hosting: 2000, ... },
//   },
//   recommendations: [
//     'Consider upgrading TensorFlow to 2.16 for performance improvements',
//     'Redis usage is low — consider downgrading Upstash plan',
//   ],
// }

// Cross-venture tech analysis
const crossAnalysis = await techStackService.getCrossVentureAnalysis();
// {
//   commonTechnologies: [
//     { name: 'Next.js', usedBy: ['betedge', 'serpspace', 'fullgain', ...], count: 7 },
//     { name: 'Supabase', usedBy: ['betedge', 'serpspace', 'fullgain', ...], count: 9 },
//     { name: 'Stripe', usedBy: ['betedge', 'serpspace', 'paypath'], count: 3 },
//   ],
//   uniqueTechnologies: [
//     { name: 'TensorFlow', usedBy: ['betedge'], reason: 'ML predictions' },
//     { name: 'Unity', usedBy: ['mcv-studios'], reason: 'Game engine' },
//   ],
//   totalInfrastructureCost: 42500,  // $425/month across all ventures
//   standardizationScore: 78,        // % of shared technology choices
// }
```

### 8. Deployment Configuration

```typescript
import { VentureDeploymentService } from '@mcv/portfolio/ventures';

const deployService = new VentureDeploymentService(db, eventBus);

// Set environment variables for a venture
await deployService.setConfig('betedge', {
  envVars: {
    NEXT_PUBLIC_APP_URL: { value: 'https://betedge.ai', encrypted: false },
    DATABASE_URL: { value: 'postgresql://...', encrypted: true },
    STRIPE_SECRET_KEY: { value: 'sk_live_...', encrypted: true },
    ODDS_API_KEY: { value: 'abc123...', encrypted: true },
    REDIS_URL: { value: 'redis://...', encrypted: true },
    SENTRY_DSN: { value: 'https://...@sentry.io/...', encrypted: false },
  },
  domains: {
    primary: 'betedge.ai',
    custom: [
      { domain: 'app.betedge.ai', verified: true, verifiedAt: new Date(), dnsRecords: [] },
      { domain: 'api.betedge.ai', verified: true, verifiedAt: new Date(), dnsRecords: [] },
    ],
    sslStatus: 'active',
    cdn: 'cloudflare',
  },
  deployment: {
    provider: 'vercel',
    region: 'us-east-1',
    environments: {
      development: {
        url: 'https://dev.betedge.ai',
        branch: 'develop',
        autoDeployEnabled: true,
        environmentVariableOverrides: { NODE_ENV: 'development' },
      },
      staging: {
        url: 'https://staging.betedge.ai',
        branch: 'staging',
        autoDeployEnabled: true,
        environmentVariableOverrides: { NODE_ENV: 'staging' },
      },
      production: {
        url: 'https://betedge.ai',
        branch: 'main',
        autoDeployEnabled: false, // Manual deploys for production
        environmentVariableOverrides: { NODE_ENV: 'production' },
      },
    },
  },
  limits: {
    apiRateLimit: 5000,
    storageQuotaGb: 50,
    maxTeamMembers: 20,
    maxMau: 50000,
    maxDbSizeGb: 25,
  },
});

// Toggle feature flags
await deployService.setFlags('betedge', [
  { key: 'enable-ai-predictions', enabled: true, description: 'AI prediction engine', rolloutPercentage: 100, targeting: null },
  { key: 'beta-live-odds', enabled: true, description: 'Real-time odds tracking', rolloutPercentage: 25, targeting: null },
  { key: 'parlays-v2', enabled: false, description: 'New parlay builder UI', rolloutPercentage: null, targeting: {
    includeUsers: ['user-moustafa', 'user-alice'], // Internal testing only
    excludeUsers: [],
    includeTenants: [],
    attributeRules: [],
  }},
]);

// Get all feature flags for a venture
const flags = await deployService.getFlags('betedge');
// [
//   { key: 'enable-ai-predictions', enabled: true, rollout: 100% },
//   { key: 'beta-live-odds', enabled: true, rollout: 25% },
//   { key: 'parlays-v2', enabled: false, targeting: [2 users] },
// ]

// Deploy config changes to a specific environment
await deployService.deployConfig('betedge', 'staging');
// Emits VENTURE_CONFIG_CHANGED event → triggers hot-reload in staging
```

### 9. Archiving & Reactivating Ventures

```typescript
const ventureService = new VentureService(db, eventBus);

// Archive a venture that's being sunsetted
const archived = await ventureService.archive('vitalsync', 'Deprioritized — pivoting resources to higher-ROI ventures.');
console.log(archived.status); // 'archived'
console.log(archived.archivedAt); // 2026-02-08T21:36:00Z

// Archiving triggers:
// 1. Status set to 'archived', archivedAt timestamp set
// 2. All team assignments end-dated
// 3. VENTURE_ARCHIVED event emitted
// 4. Billing paused via billing service integration
// 5. Deployment configs marked as inactive (no auto-deploys)
// 6. Data is RETAINED — not deleted

// Reactivate a venture later
const reactivated = await ventureService.reactivate('vitalsync');
console.log(reactivated.status); // 'active'
console.log(reactivated.archivedAt); // null

// Reactivation triggers:
// 1. Status restored to 'active'
// 2. VENTURE_REACTIVATED event emitted
// 3. Billing resumed
// 4. Team must be manually reassigned
// 5. Stage gates preserved from before archival
```

### 10. Venture Listing & Filtering

```typescript
const ventureService = new VentureService(db, eventBus);

// List all active ventures sorted by health score
const activeVentures = await ventureService.list({
  status: ['active'],
  sortBy: 'healthScore',
  sortOrder: 'desc',
  page: 1,
  pageSize: 25,
});

// Filter by stage
const growthVentures = await ventureService.list({
  stage: ['growth', 'scale'],
  status: ['active'],
});

// Filter by industry
const fintechVentures = await ventureService.list({
  industry: ['fintech', 'sports-betting'],
  sortBy: 'mrr',
  sortOrder: 'desc',
});

// Search by name or description
const results = await ventureService.search('betting');
// Returns: [BetEdge]

// Count by status
const counts = await ventureService.countByStatus();
// { active: 7, paused: 0, archived: 2, suspended: 0 }

// Group by stage
const byStage = await ventureService.groupByStage();
// {
//   idea: [Futurestate, SkillForge, VitalSync],
//   validation: [MCV Studios, NexusAI],
//   seed: [Full Gain, PayPath],
//   growth: [BetEdge, SerpSpace],
//   scale: [],
//   mature: [],
//   sunset: [],
// }
```

---

## tRPC Router

```typescript
import { router, superAdminProcedure, operatorProcedure } from '@mcv/shared/trpc';
import { z } from 'zod';
import {
  createVentureSchema,
  updateVentureSchema,
  ventureFilterSchema,
  teamAssignmentSchema,
  stageGateSchema,
  ventureComparisonSchema,
} from './validators';

export const ventureRouter = router({
  // === Venture CRUD ===
  
  list: operatorProcedure
    .input(ventureFilterSchema.optional())
    .query(async ({ ctx, input }) => {
      return ctx.ventureService.list(input);
    }),

  getById: operatorProcedure
    .input(z.object({
      id: z.string().uuid(),
      includeConfig: z.boolean().default(false),
      includeHealth: z.boolean().default(false),
      includeTeam: z.boolean().default(false),
      includeTechStack: z.boolean().default(false),
      includeStageGates: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const { id, ...options } = input;
      return ctx.ventureService.getById(id as VentureId, options);
    }),

  getBySlug: operatorProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.ventureService.getBySlug(input.slug as VentureSlug);
    }),

  create: superAdminProcedure
    .input(createVentureSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.ventureService.create(input);
    }),

  update: superAdminProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: updateVentureSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.ventureService.update(input.id as VentureId, input.data);
    }),

  archive: superAdminProcedure
    .input(z.object({
      id: z.string().uuid(),
      reason: z.string().min(10).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.ventureService.archive(input.id as VentureId, input.reason);
    }),

  reactivate: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.ventureService.reactivate(input.id as VentureId);
    }),

  fromTemplate: superAdminProcedure
    .input(z.object({
      templateId: z.string().uuid(),
      overrides: createVentureSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.ventureService.fromTemplate(
        input.templateId as VentureTemplateId,
        input.overrides,
      );
    }),

  // === Health ===
  
  health: router({
    dashboard: operatorProcedure
      .input(z.object({ ventureId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.healthService.getDashboard(input.ventureId as VentureId);
      }),

    trends: operatorProcedure
      .input(z.object({
        ventureId: z.string().uuid(),
        from: z.date(),
        to: z.date(),
        granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
      }))
      .query(async ({ ctx, input }) => {
        return ctx.healthService.getTrends(input.ventureId as VentureId, input);
      }),

    alerts: operatorProcedure
      .query(async ({ ctx }) => {
        return ctx.healthService.getAlerts();
      }),

    captureSnapshot: superAdminProcedure
      .input(z.object({
        ventureId: z.string().uuid(),
        kpis: z.object({
          mrr: z.number(),
          arr: z.number(),
          churnRate: z.number(),
          cac: z.number(),
          ltv: z.number(),
          ltvCacRatio: z.number(),
          nps: z.number().nullable(),
          mau: z.number(),
          dau: z.number(),
          dauMauRatio: z.number(),
          runway: z.number().nullable(),
          burnRate: z.number(),
          grossMargin: z.number(),
          revenueGrowthRate: z.number(),
          totalCustomers: z.number(),
          payingCustomers: z.number(),
          arpu: z.number(),
          timeToValue: z.number().nullable(),
          avgResolutionTime: z.number().nullable(),
          uptime: z.number(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.healthService.captureSnapshot(
          input.ventureId as VentureId,
          input.kpis,
        );
      }),
  }),

  // === Team ===
  
  team: router({
    assign: superAdminProcedure
      .input(teamAssignmentSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.teamService.assign(input);
      }),

    remove: superAdminProcedure
      .input(z.object({
        ventureId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.teamService.remove(input);
      }),

    reallocate: superAdminProcedure
      .input(z.object({
        userId: z.string().uuid(),
        changes: z.array(z.object({
          ventureId: z.string().uuid(),
          allocationPercentage: z.number().min(0).max(100),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.teamService.reallocate(input);
      }),

    byVenture: operatorProcedure
      .input(z.object({ ventureId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.teamService.getByVenture(input.ventureId as VentureId);
      }),

    byMember: operatorProcedure
      .input(z.object({ userId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.teamService.getByMember(input.userId);
      }),

    validateAllocations: operatorProcedure
      .query(async ({ ctx }) => {
        return ctx.teamService.validateAllocations();
      }),

    portfolioSummary: operatorProcedure
      .query(async ({ ctx }) => {
        return ctx.teamService.getPortfolioSummary();
      }),
  }),

  // === Stage Gates ===
  
  stageGate: router({
    current: operatorProcedure
      .input(z.object({ ventureId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.stageGateService.getCurrentGate(input.ventureId as VentureId);
      }),

    submit: superAdminProcedure
      .input(z.object({
        ventureId: z.string().uuid(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.stageGateService.submit(input.ventureId as VentureId, {
          submittedBy: ctx.userId,
          notes: input.notes,
        });
      }),

    approve: superAdminProcedure
      .input(z.object({
        ventureId: z.string().uuid(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.stageGateService.approve(input.ventureId as VentureId, {
          approverId: ctx.userId,
          comments: input.comments,
        });
      }),

    reject: superAdminProcedure
      .input(z.object({
        ventureId: z.string().uuid(),
        comments: z.string().min(10),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.stageGateService.reject(input.ventureId as VentureId, {
          approverId: ctx.userId,
          comments: input.comments,
        });
      }),

    autoEvaluate: operatorProcedure
      .input(z.object({ ventureId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.stageGateService.autoEvaluate(input.ventureId as VentureId);
      }),

    history: operatorProcedure
      .input(z.object({ ventureId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.stageGateService.getHistory(input.ventureId as VentureId);
      }),
  }),

  // === Comparison ===
  
  comparison: router({
    compare: operatorProcedure
      .input(ventureComparisonSchema)
      .query(async ({ ctx, input }) => {
        return ctx.comparisonService.compare(input);
      }),

    rankByMetric: operatorProcedure
      .input(z.object({
        metric: z.enum([
          'mrr', 'arr', 'churnRate', 'cac', 'ltv', 'ltvCacRatio',
          'nps', 'mau', 'dau', 'runway', 'burnRate', 'grossMargin',
          'revenueGrowthRate', 'totalCustomers', 'healthScore', 'uptime', 'teamSize',
        ]),
      }))
      .query(async ({ ctx, input }) => {
        return ctx.comparisonService.rankByMetric(input.metric);
      }),

    portfolioSummary: operatorProcedure
      .query(async ({ ctx }) => {
        return ctx.comparisonService.getPortfolioSummary();
      }),
  }),

  // === Tech Stack ===
  
  techStack: router({
    register: superAdminProcedure
      .input(z.object({
        ventureId: z.string().uuid(),
        data: z.object({
          entries: z.array(z.object({
            name: z.string(),
            version: z.string(),
            category: z.string(),
            criticality: z.enum(['core', 'important', 'nice-to-have']),
            license: z.string().nullable(),
            monthlyCost: z.number().nullable(),
            notes: z.string().nullable(),
          })),
          infrastructure: z.object({
            cloudProvider: z.string(),
            containerization: z.string(),
            ciCd: z.string(),
            databaseHost: z.string(),
            estimatedMonthlyCost: z.number(),
            regions: z.array(z.string()),
          }),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.techStackService.register(input.ventureId as VentureId, input.data);
      }),

    audit: operatorProcedure
      .input(z.object({ ventureId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.techStackService.audit(input.ventureId as VentureId);
      }),

    crossVentureAnalysis: operatorProcedure
      .query(async ({ ctx }) => {
        return ctx.techStackService.getCrossVentureAnalysis();
      }),
  }),

  // === Config & Deployment ===
  
  config: router({
    get: operatorProcedure
      .input(z.object({ ventureId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.deployService.getConfig(input.ventureId as VentureId);
      }),

    set: superAdminProcedure
      .input(z.object({
        ventureId: z.string().uuid(),
        config: ventureConfigSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.deployService.setConfig(input.ventureId as VentureId, input.config);
      }),

    getFlags: operatorProcedure
      .input(z.object({ ventureId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.deployService.getFlags(input.ventureId as VentureId);
      }),

    setFlags: superAdminProcedure
      .input(z.object({
        ventureId: z.string().uuid(),
        flags: z.array(z.object({
          key: z.string(),
          enabled: z.boolean(),
          description: z.string(),
          rolloutPercentage: z.number().nullable(),
          targeting: z.any().nullable(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.deployService.setFlags(input.ventureId as VentureId, input.flags);
      }),

    deploy: superAdminProcedure
      .input(z.object({
        ventureId: z.string().uuid(),
        environment: z.enum(['development', 'staging', 'production']),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.deployService.deployConfig(
          input.ventureId as VentureId,
          input.environment,
        );
      }),
  }),

  // === Templates ===
  
  template: router({
    list: operatorProcedure
      .query(async ({ ctx }) => {
        return ctx.templateService.list();
      }),

    create: superAdminProcedure
      .input(ventureTemplateSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.templateService.create(input);
      }),

    preview: operatorProcedure
      .input(z.object({ templateId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.templateService.preview(input.templateId as VentureTemplateId);
      }),
  }),
});
```

---

## Zod Validators

```typescript
import { z } from 'zod';

// === Venture CRUD ===

export const createVentureSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string()
    .min(2).max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  tagline: z.string().min(5).max(120),
  description: z.string().min(20).max(5000),
  industry: z.enum([
    'sports-betting', 'seo-marketing', 'government-grants', 'gaming',
    'real-estate', 'fintech', 'edtech', 'healthtech', 'saas',
    'marketplace', 'ai-ml', 'other',
  ]),
  stage: z.enum([
    'idea', 'validation', 'seed', 'growth', 'scale', 'mature', 'sunset',
  ]).default('idea'),
  domain: z.string().url().optional().or(z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/)),
  colorScheme: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    foreground: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).partial().optional(),
  templateId: z.string().uuid().optional(),
  founders: z.array(z.string()).optional(),
  contactEmail: z.string().email().optional(),
  timezone: z.string().optional(),
});

export const updateVentureSchema = z.object({
  profile: z.object({
    name: z.string().min(2).max(100),
    tagline: z.string().min(5).max(120),
    description: z.string().min(20).max(5000),
    domain: z.string().nullable(),
    additionalDomains: z.array(z.string()),
    logoUrl: z.string().url().nullable(),
    faviconUrl: z.string().url().nullable(),
    colorScheme: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      background: z.string(),
      foreground: z.string(),
    }),
    links: z.object({
      website: z.string().url().nullable(),
      github: z.string().url().nullable(),
      twitter: z.string().url().nullable(),
      linkedin: z.string().url().nullable(),
      discord: z.string().url().nullable(),
      docs: z.string().url().nullable(),
    }),
    founders: z.array(z.string()),
    contactEmail: z.string().email().nullable(),
    timezone: z.string(),
  }).partial().optional(),
  industry: z.enum([
    'sports-betting', 'seo-marketing', 'government-grants', 'gaming',
    'real-estate', 'fintech', 'edtech', 'healthtech', 'saas',
    'marketplace', 'ai-ml', 'other',
  ]).optional(),
});

// === Filters ===

export const ventureFilterSchema = z.object({
  status: z.array(z.enum(['active', 'paused', 'archived', 'suspended'])).optional(),
  stage: z.array(z.enum([
    'idea', 'validation', 'seed', 'growth', 'scale', 'mature', 'sunset',
  ])).optional(),
  industry: z.array(z.enum([
    'sports-betting', 'seo-marketing', 'government-grants', 'gaming',
    'real-estate', 'fintech', 'edtech', 'healthtech', 'saas',
    'marketplace', 'ai-ml', 'other',
  ])).optional(),
  search: z.string().max(200).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  sortBy: z.enum(['name', 'createdAt', 'healthScore', 'mrr', 'stage']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

// === Team Assignments ===

export const teamAssignmentSchema = z.object({
  ventureId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum([
    'lead', 'co-lead', 'engineer', 'senior-engineer', 'designer',
    'product', 'marketing', 'sales', 'support', 'data', 'devops',
    'qa', 'advisor', 'contractor',
  ]),
  allocationPercentage: z.number().int().min(0).max(100).default(100),
  startDate: z.date().optional(),
  endDate: z.date().nullable().optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().max(500).nullable().optional(),
});

// === Tech Stack ===

export const techStackEntrySchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().min(1).max(50),
  category: z.enum([
    'frontend-framework', 'backend-framework', 'database', 'cache',
    'message-queue', 'search', 'auth', 'storage', 'cdn', 'monitoring',
    'analytics', 'ci-cd', 'hosting', 'email', 'payment', 'ai-ml', 'other',
  ]),
  criticality: z.enum(['core', 'important', 'nice-to-have']),
  license: z.string().nullable().optional(),
  monthlyCost: z.number().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

// === Stage Gates ===

export const stageGateSchema = z.object({
  ventureId: z.string().uuid(),
  fromStage: z.enum(['idea', 'validation', 'seed', 'growth', 'scale', 'mature', 'sunset']),
  toStage: z.enum(['idea', 'validation', 'seed', 'growth', 'scale', 'mature', 'sunset']),
  milestones: z.array(z.object({
    title: z.string().min(5).max(200),
    description: z.string().max(1000),
    category: z.enum(['revenue', 'users', 'team', 'product', 'technical', 'compliance', 'other']),
    autoCheckRule: z.object({
      metric: z.string(),
      operator: z.enum(['gte', 'lte', 'gt', 'lt', 'eq']),
      value: z.number(),
    }).nullable().optional(),
  })),
  requiredApprovals: z.number().int().min(1).max(5).default(1),
  targetDate: z.date().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// === Venture Config ===

export const ventureConfigSchema = z.object({
  envVars: z.record(z.object({
    value: z.string(),
    encrypted: z.boolean().default(true),
  })).optional(),
  featureFlags: z.array(z.object({
    key: z.string().regex(/^[a-z0-9-]+$/),
    enabled: z.boolean(),
    description: z.string(),
    rolloutPercentage: z.number().min(0).max(100).nullable(),
    targeting: z.any().nullable(),
  })).optional(),
  domains: z.object({
    primary: z.string(),
    custom: z.array(z.object({
      domain: z.string(),
      verified: z.boolean(),
    })),
    sslStatus: z.enum(['active', 'pending', 'expired', 'none']),
    cdn: z.enum(['cloudflare', 'vercel', 'none']),
  }).optional(),
  deployment: z.object({
    provider: z.enum(['vercel', 'aws', 'gcp', 'railway', 'fly-io', 'self-hosted']),
    region: z.string(),
    environments: z.object({
      development: z.object({ url: z.string(), branch: z.string(), autoDeployEnabled: z.boolean(), environmentVariableOverrides: z.record(z.string()) }),
      staging: z.object({ url: z.string(), branch: z.string(), autoDeployEnabled: z.boolean(), environmentVariableOverrides: z.record(z.string()) }),
      production: z.object({ url: z.string(), branch: z.string(), autoDeployEnabled: z.boolean(), environmentVariableOverrides: z.record(z.string()) }),
    }),
  }).optional(),
  limits: z.object({
    apiRateLimit: z.number().int().positive(),
    storageQuotaGb: z.number().positive(),
    maxTeamMembers: z.number().int().positive(),
    maxMau: z.number().int().positive(),
    maxDbSizeGb: z.number().positive(),
  }).optional(),
});

// === Comparison ===

export const ventureComparisonSchema = z.object({
  ventureIds: z.array(z.string().uuid()).min(2).max(9),
  metrics: z.array(z.enum([
    'mrr', 'arr', 'churnRate', 'cac', 'ltv', 'ltvCacRatio',
    'nps', 'mau', 'dau', 'runway', 'burnRate', 'grossMargin',
    'revenueGrowthRate', 'totalCustomers', 'healthScore', 'uptime', 'teamSize',
  ])).min(1).max(10),
});

// === Templates ===

export const ventureTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(20).max(2000),
  industry: z.enum([
    'sports-betting', 'seo-marketing', 'government-grants', 'gaming',
    'real-estate', 'fintech', 'edtech', 'healthtech', 'saas',
    'marketplace', 'ai-ml', 'other',
  ]),
  productType: z.enum(['saas', 'marketplace', 'fintech', 'gaming', 'mobile-app', 'api-service', 'other']),
  defaultProfile: z.any().optional(),
  defaultTechStack: z.array(techStackEntrySchema).optional(),
  defaultFeatureFlags: z.array(z.object({
    key: z.string(),
    enabled: z.boolean(),
    description: z.string(),
    rolloutPercentage: z.number().nullable(),
  })).optional(),
  suggestedTeamStructure: z.array(z.object({
    role: z.string(),
    count: z.number().int().positive(),
    description: z.string(),
  })).optional(),
  stageGateTemplates: z.array(z.object({
    fromStage: z.string(),
    toStage: z.string(),
    milestones: z.array(z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      autoCheckRule: z.any().nullable(),
    })),
  })).optional(),
  defaultDeployment: z.any().optional(),
  defaultLimits: z.any().optional(),
  isOfficial: z.boolean().default(false),
});
```

---

## Health Score Calculation

The health score is a weighted composite of normalized KPI values. Each KPI is scored on a 0–100 scale, then combined using the weights below.

```typescript
// utils/health-score.ts

export interface HealthScoreWeights {
  mrr: number;
  churnRate: number;
  ltvCacRatio: number;
  revenueGrowthRate: number;
  grossMargin: number;
  dauMauRatio: number;
  nps: number;
  uptime: number;
  runway: number;
}

export const DEFAULT_WEIGHTS: HealthScoreWeights = {
  mrr: 0.15,
  churnRate: 0.15,
  ltvCacRatio: 0.12,
  revenueGrowthRate: 0.12,
  grossMargin: 0.10,
  dauMauRatio: 0.10,
  nps: 0.08,
  uptime: 0.10,
  runway: 0.08,
};

export const HEALTH_THRESHOLDS = {
  churnRate: { excellent: 2, good: 5, warning: 10, critical: 20 },
  ltvCacRatio: { excellent: 5, good: 3, warning: 1.5, critical: 1 },
  revenueGrowthRate: { excellent: 20, good: 10, warning: 0, critical: -10 },
  grossMargin: { excellent: 80, good: 60, warning: 40, critical: 20 },
  dauMauRatio: { excellent: 0.4, good: 0.25, warning: 0.15, critical: 0.05 },
  nps: { excellent: 70, good: 40, warning: 0, critical: -30 },
  uptime: { excellent: 99.99, good: 99.9, warning: 99, critical: 95 },
  runway: { excellent: 24, good: 12, warning: 6, critical: 3 },
};

/**
 * Calculate the overall health score for a venture based on its KPIs.
 * Returns a score between 0 and 100.
 */
export function calculateHealthScore(
  kpis: VentureKPIs,
  weights: HealthScoreWeights = DEFAULT_WEIGHTS,
): { score: number; grade: HealthGrade; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  // MRR score — logarithmic scale, $100k+ = 100
  breakdown.mrr = normalizeLog(kpis.mrr / 100, 100, 10000000);

  // Churn rate — lower is better (inverse scale)
  breakdown.churnRate = normalizeInverse(kpis.churnRate, 0, 20);

  // LTV:CAC ratio — higher is better, capped at 10
  breakdown.ltvCacRatio = normalizeLinear(kpis.ltvCacRatio, 0, 10);

  // Revenue growth rate — higher is better, capped at 50%
  breakdown.revenueGrowthRate = normalizeLinear(kpis.revenueGrowthRate, -20, 50);

  // Gross margin — higher is better
  breakdown.grossMargin = normalizeLinear(kpis.grossMargin, 0, 100);

  // DAU/MAU ratio — higher is better
  breakdown.dauMauRatio = normalizeLinear(kpis.dauMauRatio, 0, 0.6);

  // NPS — range -100 to 100, normalize to 0-100
  breakdown.nps = kpis.nps !== null
    ? normalizeLinear(kpis.nps, -100, 100)
    : 50; // Default to neutral if NPS not tracked

  // Uptime — exponential punishment for downtime
  breakdown.uptime = normalizeUptime(kpis.uptime);

  // Runway — months remaining, null = self-sustaining = 100
  breakdown.runway = kpis.runway !== null
    ? normalizeLinear(kpis.runway, 0, 36)
    : 100;

  // Weighted sum
  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += (breakdown[key] ?? 50) * weight;
  }

  score = Math.round(Math.max(0, Math.min(100, score)));
  const grade = scoreToGrade(score);

  return { score, grade, breakdown };
}

function scoreToGrade(score: number): HealthGrade {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 78) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 62) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function normalizeLinear(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function normalizeInverse(value: number, best: number, worst: number): number {
  return Math.max(0, Math.min(100, ((worst - value) / (worst - best)) * 100));
}

function normalizeLog(value: number, min: number, max: number): number {
  if (value <= min) return 0;
  if (value >= max) return 100;
  return (Math.log(value / min) / Math.log(max / min)) * 100;
}

function normalizeUptime(uptime: number): number {
  if (uptime >= 99.99) return 100;
  if (uptime >= 99.9) return 90;
  if (uptime >= 99.5) return 75;
  if (uptime >= 99.0) return 60;
  if (uptime >= 98.0) return 40;
  if (uptime >= 95.0) return 20;
  return 0;
}
```

---

## Domain Events

```typescript
// events.ts

import { DomainEvent } from '@mcv/shared/events';

export const VENTURE_CREATED = 'portfolio.venture.created' as const;
export const VENTURE_UPDATED = 'portfolio.venture.updated' as const;
export const VENTURE_ARCHIVED = 'portfolio.venture.archived' as const;
export const VENTURE_REACTIVATED = 'portfolio.venture.reactivated' as const;
export const VENTURE_STAGE_CHANGED = 'portfolio.venture.stage_changed' as const;
export const VENTURE_HEALTH_SNAPSHOT = 'portfolio.venture.health_snapshot' as const;
export const VENTURE_TEAM_ASSIGNED = 'portfolio.venture.team_assigned' as const;
export const VENTURE_TEAM_REMOVED = 'portfolio.venture.team_removed' as const;
export const VENTURE_GATE_APPROVED = 'portfolio.venture.gate_approved' as const;
export const VENTURE_GATE_REJECTED = 'portfolio.venture.gate_rejected' as const;
export const VENTURE_TEMPLATE_APPLIED = 'portfolio.venture.template_applied' as const;
export const VENTURE_CONFIG_CHANGED = 'portfolio.venture.config_changed' as const;

// Event payloads
export interface VentureCreatedEvent extends DomainEvent {
  type: typeof VENTURE_CREATED;
  payload: {
    ventureId: VentureId;
    slug: VentureSlug;
    name: string;
    tenantId: TenantId;
    stage: VentureStage;
    industry: VentureIndustry;
    createdBy: UserId;
    templateId: VentureTemplateId | null;
  };
}

export interface VentureArchivedEvent extends DomainEvent {
  type: typeof VENTURE_ARCHIVED;
  payload: {
    ventureId: VentureId;
    slug: VentureSlug;
    reason: string;
    archivedBy: UserId;
    teamMembersAffected: number;
  };
}

export interface VentureStageChangedEvent extends DomainEvent {
  type: typeof VENTURE_STAGE_CHANGED;
  payload: {
    ventureId: VentureId;
    slug: VentureSlug;
    fromStage: VentureStage;
    toStage: VentureStage;
    approvedBy: UserId;
    stageGateId: string;
  };
}

export interface VentureHealthSnapshotEvent extends DomainEvent {
  type: typeof VENTURE_HEALTH_SNAPSHOT;
  payload: {
    ventureId: VentureId;
    overallScore: number;
    grade: HealthGrade;
    trend: 'improving' | 'stable' | 'declining';
    alerts: HealthAlert[];
  };
}

export interface VentureTeamAssignedEvent extends DomainEvent {
  type: typeof VENTURE_TEAM_ASSIGNED;
  payload: {
    ventureId: VentureId;
    userId: UserId;
    role: TeamRole;
    allocationPercentage: number;
    assignedBy: UserId;
  };
}

export interface VentureConfigChangedEvent extends DomainEvent {
  type: typeof VENTURE_CONFIG_CHANGED;
  payload: {
    ventureId: VentureId;
    changedFields: string[];
    changedBy: UserId;
    version: number;
  };
}

export type VentureEvent =
  | VentureCreatedEvent
  | VentureArchivedEvent
  | VentureStageChangedEvent
  | VentureHealthSnapshotEvent
  | VentureTeamAssignedEvent
  | VentureConfigChangedEvent;
```

### Event Handlers (Cross-Domain Integration)

```typescript
// event-handlers.ts

import { eventBus } from '@mcv/shared/events';
import { VENTURE_CREATED, VENTURE_ARCHIVED, VENTURE_STAGE_CHANGED } from './events';

// When a venture is created, auto-provision a tenant
eventBus.on(VENTURE_CREATED, async (event) => {
  const { ventureId, slug, name } = event.payload;
  
  // @mcv/identity/tenants handles tenant provisioning
  await tenantService.provision({
    ventureId,
    slug,
    name,
    isolation: 'schema', // or 'row' depending on config
  });
});

// When a venture is archived, pause billing
eventBus.on(VENTURE_ARCHIVED, async (event) => {
  const { ventureId, reason } = event.payload;
  
  // @mcv/billing handles subscription management
  await billingService.pauseAllSubscriptions(ventureId, reason);
  
  // Notify team members
  await notificationService.notifyTeam(ventureId, {
    title: 'Venture Archived',
    message: `This venture has been archived. Reason: ${reason}`,
    severity: 'warning',
  });
});

// When a stage changes, unlock features and notify
eventBus.on(VENTURE_STAGE_CHANGED, async (event) => {
  const { ventureId, fromStage, toStage, approvedBy } = event.payload;
  
  // Unlock stage-specific feature flags
  await featureFlagService.unlockStageFeatures(ventureId, toStage);
  
  // Update resource limits for the new stage
  await resourceService.applyStageDefaults(ventureId, toStage);
  
  // Celebrate in the team channel
  await notificationService.notifyTeam(ventureId, {
    title: '🎉 Stage Transition!',
    message: `Venture advanced from ${fromStage} to ${toStage}!`,
    severity: 'success',
  });
});
```

---

## Error Codes

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `VENTURE_NOT_FOUND` | Venture Not Found | 404 | The requested venture ID or slug does not exist |
| `VENTURE_SLUG_TAKEN` | Slug Already Taken | 409 | The requested slug is already in use by another venture |
| `VENTURE_ALREADY_ARCHIVED` | Already Archived | 409 | Cannot archive a venture that is already archived |
| `VENTURE_NOT_ARCHIVED` | Not Archived | 409 | Cannot reactivate a venture that is not archived |
| `VENTURE_SUSPENDED` | Venture Suspended | 403 | Operation not allowed on a suspended venture |
| `VENTURE_CONFIG_VERSION_CONFLICT` | Config Version Conflict | 409 | Optimistic concurrency conflict — config was modified by another process |
| `VENTURE_STAGE_INVALID_TRANSITION` | Invalid Stage Transition | 422 | Cannot skip stages (e.g., idea → growth). Must progress sequentially |
| `VENTURE_GATE_NOT_READY` | Gate Not Ready | 422 | Stage gate milestones are not all completed; cannot submit for approval |
| `VENTURE_GATE_ALREADY_SUBMITTED` | Gate Already Submitted | 409 | This stage gate has already been submitted for approval |
| `VENTURE_GATE_UNAUTHORIZED_APPROVER` | Unauthorized Approver | 403 | User is not authorized to approve/reject stage gates |
| `VENTURE_TEAM_OVER_ALLOCATED` | Team Over-Allocated | 422 | Assigning this allocation would exceed 100% for the user across all ventures |
| `VENTURE_TEAM_DUPLICATE_ASSIGNMENT` | Duplicate Assignment | 409 | User already has an active assignment with this role on this venture |
| `VENTURE_TEMPLATE_NOT_FOUND` | Template Not Found | 404 | The referenced venture template does not exist |
| `VENTURE_LIMIT_EXCEEDED` | Resource Limit Exceeded | 429 | Venture has exceeded its resource quota (API calls, storage, MAU, etc.) |
| `VENTURE_DOMAIN_NOT_VERIFIED` | Domain Not Verified | 422 | Custom domain DNS records have not been verified |
| `VENTURE_INVALID_COLOR_SCHEME` | Invalid Color Scheme | 422 | One or more color values are not valid hex colors |
| `VENTURE_ENV_DECRYPTION_FAILED` | Env Decryption Failed | 500 | Failed to decrypt environment variables — encryption key may have rotated |
| `VENTURE_MAX_VENTURES_REACHED` | Max Ventures Reached | 422 | Consortium has reached the maximum number of active ventures |

### Error Usage

```typescript
import { TRPCError } from '@trpc/server';

// In service methods
if (!venture) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'VENTURE_NOT_FOUND',
    cause: { ventureId: id },
  });
}

if (venture.status === 'archived') {
  throw new TRPCError({
    code: 'CONFLICT',
    message: 'VENTURE_ALREADY_ARCHIVED',
    cause: { ventureId: id, archivedAt: venture.archivedAt },
  });
}

// Allocation check
const totalAllocation = existingAllocations.reduce((sum, a) => sum + a.allocationPercentage, 0);
if (totalAllocation + newAllocation > 100) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'VENTURE_TEAM_OVER_ALLOCATED',
    cause: {
      userId,
      currentTotal: totalAllocation,
      requested: newAllocation,
      maxAllowed: 100,
    },
  });
}
```

---

## Security

### Access Control

| Operation | Required Role | Notes |
|-----------|--------------|-------|
| List ventures | `consortium-operator` | Can view all ventures |
| View venture details | `consortium-operator` | Including health, team, config (secrets redacted) |
| Create venture | `super-admin` | Creates tenant, initializes config |
| Update venture | `super-admin` | Profile changes, industry reclassification |
| Archive/reactivate | `super-admin` | Affects billing, team assignments |
| Manage team | `super-admin` | Assign, remove, reallocate members |
| Manage config | `super-admin` | Environment variables, feature flags |
| Deploy config | `super-admin` | Push config changes to environments |
| Approve stage gates | `super-admin` | Must not be the same person who submitted |
| Capture health snapshot | `super-admin` or `system` | Usually automated via cron |
| View health dashboard | `consortium-operator` | Read-only access to all health data |
| Manage templates | `super-admin` | Create, edit official templates |

### Data Protection

- **Environment variables** are encrypted at rest using AES-256-GCM
- **Encryption keys** are stored in a separate key management service, never in the database
- **Secrets are never logged** — all audit logs redact secret values
- **API keys and tokens** in `envVars` are write-only for non-super-admins (can set but not read)
- **Health data** is retained indefinitely for trend analysis (GDPR note: contains no PII)
- **Team assignments** reference user IDs only — PII lives in `@mcv/identity`

### Multi-Tenant Isolation

```sql
-- Row-Level Security ensures ventures can only see their own data
-- when accessed through tenant-scoped sessions

ALTER TABLE ventures ENABLE ROW LEVEL SECURITY;

-- Super-admin/operator: can see all ventures
CREATE POLICY ventures_admin_all ON ventures
  FOR ALL
  USING (
    current_setting('app.user_role') IN ('super-admin', 'consortium-operator')
  );

-- Tenant-scoped: venture can only see its own record
CREATE POLICY ventures_tenant_own ON ventures
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
  );

-- Health snapshots inherit venture-level RLS
CREATE POLICY health_admin_all ON venture_health_snapshots
  FOR ALL
  USING (
    current_setting('app.user_role') IN ('super-admin', 'consortium-operator')
  );

-- Cascade RLS to all child tables
CREATE POLICY config_admin_all ON venture_configs
  FOR ALL
  USING (
    current_setting('app.user_role') IN ('super-admin', 'consortium-operator')
  );
```

### Audit Logging

Every mutation is automatically logged:

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: UserId;
  action: string;           // e.g., 'venture.create', 'venture.archive'
  resourceType: 'venture' | 'venture_config' | 'team_assignment' | 'stage_gate';
  resourceId: string;
  ventureId: VentureId;
  changes: {
    field: string;
    oldValue: unknown;      // Redacted for secrets
    newValue: unknown;      // Redacted for secrets
  }[];
  metadata: Record<string, unknown>;
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | Supabase PostgreSQL connection string |
| `VENTURE_ENCRYPTION_KEY` | ✅ | — | AES-256 key for encrypting env vars (base64) |
| `VENTURE_ENCRYPTION_KEY_ID` | ✅ | — | Key ID for key rotation tracking |
| `VENTURE_MAX_ACTIVE` | ❌ | `25` | Maximum number of active ventures allowed |
| `VENTURE_HEALTH_CRON` | ❌ | `0 */6 * * *` | Cron schedule for health snapshot capture |
| `VENTURE_HEALTH_RETENTION_DAYS` | ❌ | `730` | How long to retain health snapshots (2 years) |
| `VENTURE_SLUG_MIN_LENGTH` | ❌ | `2` | Minimum length for venture slugs |
| `VENTURE_SLUG_MAX_LENGTH` | ❌ | `50` | Maximum length for venture slugs |
| `VENTURE_DEFAULT_API_RATE_LIMIT` | ❌ | `1000` | Default API rate limit for new ventures |
| `VENTURE_DEFAULT_STORAGE_QUOTA_GB` | ❌ | `10` | Default storage quota for new ventures |
| `VENTURE_DEFAULT_MAX_MAU` | ❌ | `10000` | Default MAU limit for new ventures |
| `VENTURE_STAGE_GATE_MIN_APPROVALS` | ❌ | `1` | Minimum approvals required for stage transitions |
| `VENTURE_TEMPLATE_OFFICIAL_ONLY` | ❌ | `false` | If true, only official templates can be used |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Supabase service role key for admin operations |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/identity/tenants` | Tenant provisioning when a venture is created |
| `@mcv/shared/db` | Drizzle ORM database client and connection pooling |
| `@mcv/shared/events` | Domain event bus for cross-module communication |
| `@mcv/shared/config` | Shared configuration management |
| `@mcv/shared/trpc` | tRPC router setup, middleware, procedures |
| `@mcv/shared/auth` | Authentication context, role checking |
| `@mcv/shared/crypto` | AES-256-GCM encryption for environment variables |
| `@mcv/shared/audit` | Audit logging infrastructure |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30` | Database ORM and query builder |
| `@trpc/server` | `^11` | Type-safe API layer |
| `zod` | `^3.22` | Runtime schema validation |
| `nanoid` | `^5` | Short ID generation for slugs |
| `slugify` | `^1.6` | URL-safe slug generation from venture names |
| `date-fns` | `^3` | Date manipulation for health trends and stage gate timelines |
| `decimal.js` | `^10` | Precise financial calculations (MRR, ARR, etc.) |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { VentureService } from './services/venture.service';
import { createTestDb, seedTestVentures } from '@mcv/shared/testing';

describe('VentureService', () => {
  let service: VentureService;
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    service = new VentureService(db, mockEventBus);
    await seedTestVentures(db);
  });

  describe('create', () => {
    it('should create a venture with auto-generated slug', async () => {
      const venture = await service.create({
        name: 'Test Venture',
        tagline: 'A test venture',
        description: 'This is a test venture for unit testing purposes.',
        industry: 'saas',
      });

      expect(venture.slug).toBe('test-venture');
      expect(venture.stage).toBe('idea');
      expect(venture.status).toBe('active');
      expect(venture.tenantId).toBeDefined();
    });

    it('should reject duplicate slugs', async () => {
      await service.create({
        name: 'BetEdge Clone',
        slug: 'betedge',
        tagline: 'Duplicate',
        description: 'This should fail because betedge slug exists.',
        industry: 'sports-betting',
      });

      await expect(promise).rejects.toThrow('VENTURE_SLUG_TAKEN');
    });

    it('should emit VENTURE_CREATED event', async () => {
      await service.create({
        name: 'Event Test',
        tagline: 'Testing events',
        description: 'This venture should trigger a creation event.',
        industry: 'saas',
      });

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'portfolio.venture.created',
        expect.objectContaining({
          payload: expect.objectContaining({
            name: 'Event Test',
          }),
        }),
      );
    });
  });

  describe('archive', () => {
    it('should set status to archived', async () => {
      const result = await service.archive('betedge-id', 'Testing archival');
      expect(result.status).toBe('archived');
      expect(result.archivedAt).toBeInstanceOf(Date);
    });

    it('should reject archiving an already-archived venture', async () => {
      await service.archive('betedge-id', 'First archive');
      await expect(
        service.archive('betedge-id', 'Second archive'),
      ).rejects.toThrow('VENTURE_ALREADY_ARCHIVED');
    });
  });

  describe('stage transition', () => {
    it('should reject non-sequential stage transitions', async () => {
      await expect(
        service.transitionStage('idea-venture-id', 'growth'),
      ).rejects.toThrow('VENTURE_STAGE_INVALID_TRANSITION');
    });
  });
});

describe('calculateHealthScore', () => {
  it('should return A+ for excellent metrics', () => {
    const result = calculateHealthScore({
      mrr: 10000000,
      churnRate: 1.5,
      ltvCacRatio: 8.0,
      revenueGrowthRate: 25,
      grossMargin: 85,
      dauMauRatio: 0.45,
      nps: 75,
      uptime: 99.99,
      runway: null,
      // ... other KPIs
    } as VentureKPIs);

    expect(result.grade).toBe('A+');
    expect(result.score).toBeGreaterThanOrEqual(95);
  });

  it('should return F for terrible metrics', () => {
    const result = calculateHealthScore({
      mrr: 0,
      churnRate: 25,
      ltvCacRatio: 0.5,
      revenueGrowthRate: -15,
      grossMargin: 10,
      dauMauRatio: 0.02,
      nps: -50,
      uptime: 90,
      runway: 1,
      // ... other KPIs
    } as VentureKPIs);

    expect(result.grade).toBe('F');
    expect(result.score).toBeLessThan(40);
  });
});

describe('Team Allocation', () => {
  it('should prevent over-allocation beyond 100%', async () => {
    const teamService = new VentureTeamService(db, mockEventBus);

    // Assign 80% to venture A
    await teamService.assign({
      ventureId: 'venture-a',
      userId: 'user-1',
      role: 'engineer',
      allocationPercentage: 80,
    });

    // Try to assign 30% to venture B (total would be 110%)
    await expect(
      teamService.assign({
        ventureId: 'venture-b',
        userId: 'user-1',
        role: 'engineer',
        allocationPercentage: 30,
      }),
    ).rejects.toThrow('VENTURE_TEAM_OVER_ALLOCATED');
  });
});
```

### Integration Tests

```typescript
describe('Venture Lifecycle Integration', () => {
  it('should complete full lifecycle: create → configure → health → stage → archive', async () => {
    // 1. Create from template
    const venture = await ventureService.fromTemplate('saas-starter', {
      name: 'Lifecycle Test',
      tagline: 'Full lifecycle test',
      description: 'Testing the complete venture lifecycle end-to-end.',
      industry: 'saas',
    });
    expect(venture.stage).toBe('idea');

    // 2. Configure
    await deployService.setConfig(venture.id, {
      envVars: { APP_URL: { value: 'https://test.example.com', encrypted: false } },
      limits: { apiRateLimit: 500, storageQuotaGb: 5, maxTeamMembers: 5, maxMau: 1000, maxDbSizeGb: 1 },
    });

    // 3. Assign team
    await teamService.assign({
      ventureId: venture.id,
      userId: 'user-lead',
      role: 'lead',
      allocationPercentage: 100,
    });

    // 4. Capture health snapshot
    await healthService.captureSnapshot(venture.id, testKpis);
    const dashboard = await healthService.getDashboard(venture.id);
    expect(dashboard.current.overallScore).toBeGreaterThan(0);

    // 5. Progress through stage gate
    const gate = await stageGateService.getCurrentGate(venture.id);
    // Mark all milestones as complete
    for (const milestone of gate.milestones) {
      await stageGateService.completeMilestone(venture.id, milestone.id, {
        evidence: 'Test evidence',
        verifiedBy: 'user-lead',
      });
    }
    await stageGateService.submit(venture.id, { submittedBy: 'user-lead' });
    await stageGateService.approve(venture.id, { approverId: 'user-admin' });

    // Verify stage transition
    const updated = await ventureService.getById(venture.id);
    expect(updated.stage).toBe('validation');

    // 6. Archive
    const archived = await ventureService.archive(venture.id, 'Test complete');
    expect(archived.status).toBe('archived');
  });
});
```

---

## Migration Notes

### Initial Migration (v0.1.0)

```sql
-- Create all venture tables
CREATE TABLE ventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  profile JSONB NOT NULL,
  stage venture_stage NOT NULL DEFAULT 'idea',
  status venture_status NOT NULL DEFAULT 'active',
  industry venture_industry NOT NULL,
  health_score INTEGER,
  template_id UUID REFERENCES venture_templates(id),
  founded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  created_by UUID NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE ventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE venture_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE venture_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE venture_templates ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ventures_updated_at
  BEFORE UPDATE ON ventures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Repeat trigger for all tables with updated_at columns
```

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/identity/tenants` | 1:1 mapping — each venture creates a tenant |
| `@mcv/billing/subscriptions` | Listens to venture events for subscription lifecycle |
| `@mcv/analytics/portfolio` | Consumes health snapshots for portfolio-wide dashboards |
| `@mcv/notifications` | Receives events for team/stage notifications |
| `@mcv/deployment/pipelines` | Reads venture config for deployment automation |
| `@mcv/portfolio/investments` | References ventures for investment tracking |
| `@mcv/portfolio/financials` | Aggregates venture revenue data |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2024-01-15 | Initial release — CRUD, profiles, basic health |
| 0.2.0 | 2024-03-01 | Added stage gates, team assignments |
| 0.3.0 | 2024-05-15 | Added venture templates, comparison service |
| 0.4.0 | 2024-08-01 | Added tech stack registry, deployment configs |
| 0.5.0 | 2024-10-15 | Added feature flags, domain management |
| 0.6.0 | 2025-01-10 | Health score v2 with weighted KPIs, alerting |
| 0.7.0 | 2025-04-01 | Cross-venture tech analysis, standardization scoring |
| 0.8.0 | 2025-07-15 | Auto-evaluate stage gate milestones from KPIs |
| 1.0.0 | 2025-10-01 | Stable release — all features production-ready |
