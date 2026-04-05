# @mcv/crm — Package Specification

| Field | Value |
|---|---|
| **Package** | `@mcv/crm` |
| **Classification** | PUBLISHABLE |
| **Tier** | 5 — Domain Modules |
| **Category** | Customer Relationship Management |
| **Runtime** | Server (Node.js) + Client (React) |
| **Status** | Active Development |
| **Last Updated** | February 9, 2026 |

---

## Table of Contents

1. [Overview](#overview)
2. [Purpose & Scope](#purpose--scope)
3. [Module Summary](#module-summary)
4. [Architecture Position](#architecture-position)
5. [Key Interfaces & Types](#key-interfaces--types)
6. [Configuration](#configuration)
7. [Dependencies](#dependencies)
8. [Multi-Tenant Design](#multi-tenant-design)
9. [Security](#security)
10. [Performance](#performance)
11. [Deployment](#deployment)

---

## Overview

`@mcv/crm` is the **Customer Relationship Management** domain module within MCV.ONE — a full-featured, AI-enhanced CRM system that manages the complete sales lifecycle from first contact to closed-won revenue. It operates as a **Tier 5 Publishable** domain, meaning it is designed to function both as an integral part of the MCV.ONE consortium platform and as an independently deployable SaaS product.

Unlike traditional CRM platforms, `@mcv/crm` is built from the ground up with:

- **AI-powered deal scoring** — A 9-factor algorithm that evaluates deal health, win probability, and risk classification using heuristic signals derived from pipeline position, activity patterns, engagement metrics, and historical data.
- **Configurable lead scoring** — A rule-based engine with three scoring categories (behavioral, demographic, firmographic) plus automated score decay for inactive contacts.
- **Intelligent duplicate detection** — Levenshtein-distance fuzzy name matching, exact email comparison, phone normalization, and domain matching with configurable confidence thresholds.
- **Revenue forecasting** — Period-based forecasting with commit/best-case/pipeline categorization, quota attainment tracking, and multi-period trend analysis.
- **Custom objects** — User-defined CRM entities with dynamic field schemas, allowing ventures to extend the data model without code changes.
- **Smart views** — Saved, shareable filter-sort-column configurations that give each team member a personalized workspace.
- **Stage automation** — Pipeline stage-triggered automations (on_enter, on_exit, on_time) that drive workflow actions like email sends, task creation, and field updates.

The module is currently **monolithic** in structure (no internal subdirectory decomposition), but its architecture is organized around well-defined service boundaries covering contacts, organizations, deals/pipelines, activities, deal scoring, lead scoring, forecasting, duplicate detection, custom objects, and smart views.

### Key Metrics

| Metric | Value |
|---|---|
| Service modules | 10 (contact, organization, deal, activity, deal-scoring, lead-scoring, forecast, duplicate-detection, custom-object, smart-view) |
| Database tables | 16+ |
| Exported service functions | 80+ |
| React hooks | 10 |
| React components | 10 |
| Zod schemas | 40+ |
| Audit event types | 22 |
| Error codes | 15 |

---

## Purpose & Scope

### Purpose

`@mcv/crm` provides a complete customer relationship management platform that enables MCV.ONE ventures (and external customers when deployed standalone) to:

1. **Manage the entire contact lifecycle** — From initial lead capture through marketing/sales qualification to customer status and beyond, with granular lifecycle stage tracking and ownership assignment.

2. **Track organizations and relationships** — Company records with domain deduplication, industry classification, employee counts, revenue data, and linked contacts/deals for a complete account view.

3. **Drive deal pipelines** — Configurable multi-stage sales pipelines with Kanban-view grouping, stage probability mapping, pipeline analytics, and deal closure tracking with win/loss reasons.

4. **Capture every interaction** — Polymorphic activity logging for notes, emails, calls, meetings, and tasks, each with type-specific rich metadata (call duration/outcome, meeting attendees/links, task priority/status).

5. **Score deals with AI** — Automated deal health scoring across 9 factors (stage progression, velocity, activity recency/frequency, meeting/email engagement, deal size, stakeholder involvement, contact engagement) with risk classification and close-date prediction.

6. **Score leads intelligently** — Rule-based contact scoring across behavioral (activity patterns), demographic (job title, industry), and firmographic (company size, revenue) dimensions with automated decay.

7. **Forecast revenue accurately** — Period-based forecasting with category breakdowns (commit, best-case, pipeline), forecast-vs-actual comparison, quota attainment tracking, and multi-period trend analysis.

8. **Detect and merge duplicates** — Automated duplicate detection with exact matching, fuzzy matching, and confidence scoring, plus a merge workflow with field-level conflict resolution and full audit trail.

9. **Extend the data model** — User-defined custom objects with dynamic field schemas, inter-object relationships, and full CRUD support.

10. **Personalize the workspace** — Smart views with saved filters, sort orders, and column configurations that can be shared across teams.

### Scope

#### In Scope

| Area | Coverage |
|---|---|
| Contact management | CRUD, search, bulk operations, lifecycle tracking, tags, custom fields |
| Organization management | CRUD, search, domain dedup, industry classification, revenue tracking, linked entities |
| Deal & pipeline management | CRUD, stage movement, closure, Kanban grouping, pipeline analytics |
| Pipeline configuration | Multi-stage pipelines per venture, stage ordering, probability mapping, default pipelines |
| Activity tracking | Notes, emails, calls, meetings, tasks — polymorphic subject linking, rich metadata |
| Stage automation | Entry/exit/time-delay triggers, email/task/field-update/webhook actions |
| AI deal scoring | 9-factor scoring algorithm, risk classification, win probability, close-date prediction |
| Lead scoring | Behavioral/demographic/firmographic rules, score decay, distribution analytics |
| Revenue forecasting | Period-based forecasts, category breakdown, quota attainment, trend analysis |
| Duplicate detection | Exact/fuzzy matching, confidence scoring, merge workflow, audit trail |
| Custom objects | User-defined entities, dynamic fields, inter-object relationships |
| Smart views | Saved filters/sorts/columns, sharing, default views per object type |
| Client SDK | React hooks for all major data types, pre-built UI components |
| Multi-tenancy | Venture-scoped data isolation via PostgreSQL RLS |

#### Out of Scope

| Area | Rationale |
|---|---|
| Marketing automation | Handled by `@mcv/growth` (campaigns, sequences, A/B testing) |
| Conversational messaging | Handled by `@mcv/nexus` (omnichannel conversations) |
| Email delivery | Handled by `@mcv/connectors/email` (SMTP, deliverability) |
| Analytics dashboards | Handled by `@mcv/analytics` (cross-domain reporting) |
| User authentication | Handled by `@mcv/identity` (SSO, roles, permissions) |
| File storage | Handled by `@mcv/fabric` (media, document storage) |
| Billing & subscriptions | Handled by `@mcv/billing` |
| Public API gateway | Handled by `@mcv/kernel` (rate limiting, API keys) |

---

## Module Summary

The CRM domain is organized as a monolithic package with 10 logical service modules. Each module encapsulates a coherent domain concept with its own service layer, Zod validation schemas, database queries, and (where applicable) React hooks and components.

### Contacts Management

The **contact service** manages person and company contacts as the foundational entity in the CRM. Every contact belongs to a venture (tenant), has a lifecycle stage, and can carry arbitrary custom fields and tags.

**Core capabilities:**
- Full CRUD with venture-scoped isolation
- Autocomplete search with pattern matching
- Bulk update and bulk delete operations
- Lifecycle stage progression (`lead` → `marketing_qualified` → `sales_qualified` → `opportunity` → `customer` → `evangelist` → `churned`)
- Contact type discrimination (`person` vs `company`)
- Ownership assignment (sales rep)
- Custom fields (JSONB) and freeform tags
- Lead score integration (score stored on contact, computed by lead scoring engine)
- Cursor-based and offset pagination
- Sort by any field with direction control

**Key design decisions:**
- Contacts use a `type` discriminator rather than separate person/company tables, keeping the query surface unified
- Custom fields are stored as JSONB rather than EAV to optimize read performance
- Lead score is denormalized onto the contact record for fast sorting/filtering
- Tags are JSONB arrays enabling PostgreSQL containment queries

### Company/Organization Management

The **organization service** manages company records as distinct first-class entities (separate from contact type=company) with richer firmographic data and entity linking.

**Core capabilities:**
- Full CRUD with domain-based deduplication
- Autocomplete search
- Bulk delete operations
- Domain uniqueness enforcement per venture
- Industry classification with distinct-values API
- Employee count and annual revenue tracking
- Structured address data (street, city, state, country, zip)
- Linked contacts retrieval (contacts where organizationId matches)
- Linked deals retrieval (deals where organizationId matches)
- Revenue statistics (total deal value, won revenue, pipeline value)

**Key design decisions:**
- Organizations are separate from contacts (not using contact type=company) because firmographic data and linking semantics differ substantially
- Domain deduplication prevents accidental duplicate company creation
- Revenue statistics are computed dynamically rather than cached, ensuring accuracy

### Deals & Pipeline Management

The **deal service** manages sales opportunities tracked through configurable multi-stage pipelines. This is the revenue-generating core of the CRM.

**Core capabilities:**
- Full CRUD with pipeline assignment
- Stage movement with validation (stage must exist in pipeline)
- Deal closure (won/lost) with reason tracking
- Kanban-view grouping (deals grouped by stage with per-stage totals)
- Pipeline summary statistics (total value, weighted value, deal count, stage breakdown)
- Closed deal summary for date ranges (won count, won value, lost count, average deal size)
- Autocomplete search
- Financial tracking (value, currency, probability)
- Expected and actual close date tracking
- Contact and organization linking
- Ownership assignment

**Pipeline configuration:**
- Customizable pipelines per venture
- Ordered stages with win probability per stage
- Default pipeline designation
- Enhanced V2 stages with rotting days, required fields, and stage automations (on_enter/on_exit/on_time triggers)

**Key design decisions:**
- Deals reference a stage by name (text) rather than foreign key, allowing pipeline stage reordering without deal migration
- Pipeline stages V2 adds automation capabilities without breaking V1 compatibility
- Deal value stored as `decimal(15,2)` string to avoid floating-point precision issues

### Activity Tracking

The **activity service** provides a polymorphic activity log that records every customer interaction across the CRM.

**Core capabilities:**
- Log activities: notes, emails, calls, meetings, tasks
- Polymorphic subject linking (activity → contact | deal | organization)
- Chronological timeline view with pagination
- Activity feed per entity
- Type-specific rich metadata via JSONB

**Activity types and metadata:**

| Type | Metadata Fields |
|---|---|
| `note` | tags, attachments |
| `email` | from, to[], subject, direction (inbound/outbound) |
| `call` | direction, duration (seconds), outcome, recording URL |
| `meeting` | start, end, location, URL, attendees[], outcome |
| `task` | due date, priority, status, assigned to |

**Key design decisions:**
- Polymorphic subject linking (subjectType + subjectId) rather than separate activity tables per entity type, enabling a unified activity feed
- Metadata is JSONB rather than separate columns per activity type, keeping the schema stable while allowing rich type-specific data
- Creator tracking (`createdBy`) enables attribution and audit

### Lead Scoring

The **lead scoring service** provides a configurable rule-based engine that evaluates contacts across three scoring dimensions.

**Core capabilities:**
- Rule CRUD (create, update, delete, list)
- Single contact evaluation with category breakdown
- Batch contact re-scoring (all contacts in venture)
- Score breakdown with per-rule detail
- Leaderboard (top-scored contacts)
- Score decay for inactive contacts (configurable days and percentage)
- Score distribution histogram

**Scoring categories:**

| Category | Measures | Example Rules |
|---|---|---|
| Behavioral | Activity patterns, engagement | Email opens ≥ 5 → +15 pts, Meeting booked → +20 pts |
| Demographic | Contact attributes | Job title contains "VP" → +20 pts, Industry in [SaaS, FinTech] → +10 pts |
| Firmographic | Company attributes | Employee count ≥ 100 → +10 pts, Annual revenue ≥ $10M → +15 pts |

**Score composition:** `totalScore = behavioralScore + demographicScore + firmographicScore`

**Key design decisions:**
- Three-category decomposition provides transparency into why a contact scored high/low
- Decay mechanism prevents stale leads from remaining artificially high-scored
- Batch scoring runs as a background cron job to avoid impacting real-time performance
- Contact's `leadScore` field is denormalized from the scoring result for fast queries

### AI Deal Scoring

The **deal scoring service** provides an AI-powered health assessment for open deals using a 9-factor weighted algorithm.

**Core capabilities:**
- Single deal scoring (0-100 with confidence)
- Batch scoring for all open deals
- Score history tracking (trend over time)
- Factor breakdown (9 scoring factors with detail)
- Signal identification (positive/negative indicators)
- Risk classification (low/medium/high)
- Win probability prediction (sigmoid mapping)
- Close-date prediction (based on historical data)
- At-risk deal identification

**9 Scoring Factors:**

| Factor | Weight | Measures |
|---|---|---|
| Stage Progression | 20 pts | Position in pipeline (stage N of M) |
| Deal Velocity | 15 pts | Deal age vs historical average cycle |
| Activity Recency | 15 pts | Days since last activity |
| Activity Frequency | 10 pts | Activities in last 30 days |
| Meeting Engagement | 10 pts | Meetings recorded |
| Email Engagement | 10 pts | Emails recorded |
| Deal Size | 10 pts | Value relative to pipeline average |
| Stakeholder Involvement | 5 pts | Unique participants with activities |
| Contact Engagement | 5 pts | Linked contact's lead score |

**Risk classification:**
- Score 0-29 → **High risk** (win probability < 20%)
- Score 30-59 → **Medium risk** (win probability 20-70%)
- Score 60-100 → **Low risk** (win probability > 70%)

**Win probability formula:** `P(win) = 100 / (1 + e^(-0.08 × (score - 50)))`

### Revenue Forecasting

The **forecast service** provides period-based revenue forecasting with category breakdowns and accuracy tracking.

**Core capabilities:**
- Forecast period creation (monthly, quarterly, yearly)
- Auto-population with matching open deals
- Category breakdown (commit, best_case, pipeline, omitted)
- Forecast summary with computed totals
- Forecast-vs-actual comparison with accuracy percentage
- Per-owner breakdown (sales rep performance)
- Per-pipeline breakdown
- Quota attainment tracking
- Multi-period trend analysis

**Forecast categories:**

| Category | Description | Threshold |
|---|---|---|
| Commit | High-confidence deals | Probability ≥ 90% |
| Best Case | Likely deals | Probability ≥ 70% |
| Pipeline | All other open deals | Probability < 70% |
| Omitted | Excluded from forecast | Manual exclusion |

### Duplicate Detection & Merge

The **duplicate detection service** identifies and resolves duplicate records using multiple matching strategies.

**Core capabilities:**
- Single-record duplicate search (before-create check)
- Batch duplicate scanning (find all duplicate groups)
- Duplicate group clustering
- Merge preview with conflict identification
- Merge execution with field-level control
- Full merge audit trail (history of all merges)

**Matching strategies:**

| Strategy | Confidence | Description |
|---|---|---|
| Exact email | 98% | Same email address |
| Domain match | 70% | Same email domain (organizations) |
| Fuzzy name | Variable | Levenshtein distance ≥ 85% similarity |
| Phone normalization | 90% | Normalized phone number match |

### Custom Objects

The **custom object service** allows ventures to extend the CRM data model with user-defined entities.

**Core capabilities:**
- Object definition (name, plural, slug, icon, color, field schema)
- Dynamic field types (text, number, email, phone, URL, date, datetime, boolean, select, multiselect, textarea, currency, percent)
- Field validation (min, max, pattern, required, default value)
- Full CRUD for custom records
- Inter-object relationships (has_many, belongs_to, many_to_many)
- Related record retrieval
- Limits enforcement (max 50 objects/venture, max 100 fields/object)

### Smart Views

The **smart view service** provides personalized workspace configurations for each CRM entity type.

**Core capabilities:**
- View CRUD with filter/sort/column configuration
- Filter operators: eq, neq, gt, gte, lt, lte, contains, in, between, is_null, is_not_null
- Multi-column sorting
- Column visibility and ordering
- Default view per object type
- View sharing (personal vs team-wide)
- View duplication (clone with new name)
- View execution (apply filters and return results)

### Import/Export

While not a separate service module, import and export capabilities are supported across the CRM:

- **Bulk operations** — `bulkUpdateContacts`, `bulkDeleteContacts`, `bulkDeleteOrganizations` provide batch processing
- **Batch scoring** — `batchScoreDeals`, `batchScoreContacts` handle large-scale re-computation
- **Duplicate scanning** — `scanForDuplicates` processes up to 2000 records per scan
- **Forecast auto-population** — `createForecast` auto-imports matching open deals
- **Smart view export** — View results can be extracted via `applySmartView`

Future enhancements will add dedicated CSV/Excel import and export services.

---

## Architecture Position

`@mcv/crm` sits at **Tier 5** in the MCV.ONE architecture — the domain module layer. It depends on infrastructure layers (Tiers 1-3) and the orchestration layer (Tier 4), and is consumed by integration/analytics layers above.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TIER 7: APPLICATIONS                        │
│                                                                     │
│  Portal Dashboard  ·  Admin Console  ·  Venture Apps                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                     TIER 6: INTEGRATION LAYER                       │
│                                                                     │
│  @mcv/analytics  ·  @mcv/growth  ·  @mcv/nexus  ·  @mcv/reporting  │
│                                                                     │
│  Consumes CRM data for analytics, lead generation,                  │
│  omnichannel conversations, and cross-domain reporting              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                  ╔═══════════════════════════════╗                   │
│  TIER 5:         ║         @mcv/crm              ║                  │
│  DOMAIN          ║                               ║                  │
│  MODULES         ║  Contacts · Organizations     ║                  │
│  (PUBLISHABLE)   ║  Deals · Pipelines            ║                  │
│                  ║  Activities · Scoring          ║                  │
│                  ║  Forecasting · Duplicates      ║                  │
│                  ║  Custom Objects · Smart Views  ║                  │
│                  ╚═══════════════════════════════╝                   │
│                                                                     │
│  Sibling domains: @mcv/billing, @mcv/cms, @mcv/social, etc.        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                    TIER 4: ORCHESTRATION LAYER                      │
│                                                                     │
│  @mcv/naos (AI Agent Framework)  ·  Event Bus  ·  Job Scheduler     │
│                                                                     │
│  CRM integrates with NAOS for AI agents (Sales Agent, CRM Agent)    │
│  and uses the event bus for cross-domain event propagation           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                    TIER 3: SERVICE INFRASTRUCTURE                    │
│                                                                     │
│  @mcv/connectors/email  ·  Redis  ·  Redpanda/Kafka                 │
│                                                                     │
│  Email connector provides activity sync; Redis for caching;         │
│  Redpanda for event streaming                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                     TIER 2: PLATFORM SERVICES                       │
│                                                                     │
│  @mcv/identity (Auth/RBAC)  ·  @mcv/fabric (Storage/Media)         │
│                                                                     │
│  Identity provides auth, permissions, and user context;             │
│  Fabric provides file storage for activity attachments              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                        TIER 1: KERNEL                               │
│                                                                     │
│  @mcv/kernel — Database, Config, Logging, Audit, Multi-Tenancy      │
│                                                                     │
│  Provides Drizzle ORM, Supabase client, RLS policies, config,      │
│  audit logging framework, and venture context management            │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Position

```
External Sources                    Internal Consumers
─────────────────                   ──────────────────

Web Forms ──┐                       ┌── @mcv/analytics (dashboards)
Email    ───┤                       ├── @mcv/growth (lead gen)
API      ───┼──► @mcv/crm ────────►├── @mcv/nexus (conversations)
Import   ───┤    ┌─────────┐       ├── @mcv/reporting (exports)
NAOS AI ────┘    │ Supabase │       └── @mcv/naos (AI agents)
                 │ Postgres │
                 │ + RLS    │
                 └─────────┘
```

---

## Key Interfaces & Types

### Core Entity Types

```typescript
// ─── Contact ────────────────────────────────────────────────────
interface Contact {
  id: string;                           // UUID primary key
  ventureId: string;                    // Venture scope (multi-tenancy)
  type: ContactType;                    // 'person' | 'company'
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  leadScore: number;                    // 0-100+, computed by scoring engine
  lifecycleStage: LifecycleStage;
  ownerId: string | null;
  customFields: ContactCustomFields;    // Arbitrary JSONB data
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

type ContactType = 'person' | 'company';
type LifecycleStage =
  | 'lead'
  | 'marketing_qualified'
  | 'sales_qualified'
  | 'opportunity'
  | 'customer'
  | 'evangelist'
  | 'churned';

// ─── Organization ───────────────────────────────────────────────
interface Organization {
  id: string;
  ventureId: string;
  name: string;
  domain: string | null;                // Website domain (unique per venture)
  industry: string | null;
  employeeCount: number | null;
  annualRevenue: string | null;         // Decimal as string
  address: OrganizationAddress | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  ownerId: string | null;
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface OrganizationAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

// ─── Deal ───────────────────────────────────────────────────────
interface Deal {
  id: string;
  ventureId: string;
  pipelineId: string;
  stage: string;                        // Current stage name
  contactId: string | null;
  organizationId: string | null;
  name: string;
  value: string | null;                 // Decimal as string
  currency: string;                     // Default: 'USD'
  probability: number | null;           // Win probability 0-100
  status: DealStatus;                   // 'open' | 'won' | 'lost'
  expectedCloseDate: string | null;
  actualCloseDate: string | null;
  lostReason: string | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type DealStatus = 'open' | 'won' | 'lost';

// ─── Pipeline ───────────────────────────────────────────────────
interface Pipeline {
  id: string;
  ventureId: string;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PipelineStage {
  name: string;
  order: number;
  probability: number;                  // Win probability at this stage
}

interface PipelineStageV2 extends PipelineStage {
  rottingDays: number | null;           // Days before deal is considered stale
  requiredFields: string[];             // Fields required to enter this stage
  automations: StageAutomation[];       // Triggered actions
}

interface StageAutomation {
  trigger: 'on_enter' | 'on_exit' | 'on_time';
  delayMinutes?: number;               // For on_time trigger
  action: 'send_email' | 'create_task' | 'update_field' | 'notify' | 'webhook';
  config: Record<string, unknown>;
}
```

### Activity Types

```typescript
interface CrmActivity {
  id: string;
  ventureId: string;
  subjectType: CrmActivitySubjectType;  // 'contact' | 'deal' | 'organization'
  subjectId: string;
  activityType: CrmActivityType;        // 'note' | 'email' | 'call' | 'meeting' | 'task'
  title: string | null;
  description: string | null;
  metadata: CrmActivityMetadata;        // Type-specific JSONB data
  createdBy: string | null;
  createdAt: Date;
}

interface CrmActivityMetadata {
  // Email
  emailFrom?: string;
  emailTo?: string[];
  emailSubject?: string;
  emailDirection?: 'inbound' | 'outbound';

  // Call
  callDirection?: 'inbound' | 'outbound';
  callDuration?: number;
  callOutcome?: 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number';
  callRecordingUrl?: string;

  // Meeting
  meetingStart?: string;
  meetingEnd?: string;
  meetingLocation?: string;
  meetingUrl?: string;
  meetingAttendees?: Array<{
    email: string;
    name?: string;
    status?: 'pending' | 'accepted' | 'declined' | 'tentative';
  }>;
  meetingOutcome?: 'completed' | 'no_show' | 'rescheduled' | 'cancelled';

  // Task
  taskDueDate?: string;
  taskPriority?: 'low' | 'medium' | 'high' | 'urgent';
  taskStatus?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  taskAssignedTo?: string;

  // Common
  tags?: string[];
  attachments?: Array<{ id: string; name: string; url: string; type: string; size: number }>;
  [key: string]: unknown;
}
```

### Scoring Types

```typescript
// ─── Deal Scoring ───────────────────────────────────────────────
interface ScoreResult {
  score: number;                        // 0-100 deal health score
  confidence: number;                   // 0-1 data availability confidence
  factors: ScoringFactor[];             // 9 weighted factors
  signals: ScoringSignal[];             // Positive/negative indicators
  predictedCloseDate: string | null;
  predictedAmount: string | null;
  winProbability: number;               // 0-100 sigmoid-mapped
  riskLevel: RiskLevel;                 // 'low' | 'medium' | 'high'
}

interface ScoringFactor {
  name: string;
  score: number;                        // Points earned (0 to weight)
  weight: number;                       // Maximum possible points
  detail: string;                       // Human-readable explanation
}

interface ScoringSignal {
  type: 'positive' | 'negative';
  label: string;
  detail: string;
  impact: number;                       // -100 to 100
}

type RiskLevel = 'low' | 'medium' | 'high';

// ─── Lead Scoring ───────────────────────────────────────────────
interface ContactScore {
  id: string;
  contactId: string;
  ventureId: string;
  totalScore: number;
  behavioralScore: number;
  demographicScore: number;
  firmographicScore: number;
  breakdown: ScoreBreakdown;
  lastActivityAt: Date | null;
  scoredAt: Date;
}

interface LeadScoringRule {
  id: string;
  ventureId: string;
  name: string;
  category: ScoringCategory;            // 'behavioral' | 'demographic' | 'firmographic'
  rules: ScoringRuleCondition[];
  maxScore: number;
  decayEnabled: boolean;
  decayDays: number | null;
  decayPercent: number | null;
  isActive: boolean;
}

type ScoringCategory = 'behavioral' | 'demographic' | 'firmographic';

interface ScoringRuleCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: unknown;
  points: number;
}
```

### Forecast Types

```typescript
interface Forecast {
  id: string;
  ventureId: string;
  period: ForecastPeriod;
  periodStart: string;
  periodEnd: string;
  pipelineId: string | null;
  ownerId: string | null;
  forecastAmount: string;
  weightedAmount: string;
  bestCase: string;
  worstCase: string;
  closedWonAmount: string;
  status: 'open' | 'closed';
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ForecastPeriod = 'monthly' | 'quarterly' | 'yearly';
type ForecastCategory = 'commit' | 'best_case' | 'pipeline' | 'omitted';

interface ForecastSummary {
  period: ForecastPeriod;
  periodStart: string;
  periodEnd: string;
  commit: number;
  bestCase: number;
  pipeline: number;
  closedWon: number;
  gap: number;
}
```

### Custom Object & Smart View Types

```typescript
interface CustomObject {
  id: string;
  ventureId: string;
  name: string;
  pluralName: string;
  slug: string;
  icon: string | null;
  color: string | null;
  fields: CustomObjectFieldDef[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomObjectFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'url' | 'date' | 'datetime'
      | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'currency' | 'percent';
  required?: boolean;
  options?: string[];
  defaultValue?: unknown;
  placeholder?: string;
  validation?: { min?: number; max?: number; pattern?: string };
}

interface SmartView {
  id: string;
  ventureId: string;
  name: string;
  objectType: 'contact' | 'organization' | 'deal' | 'custom';
  filters: SmartViewFilter[];
  sortBy: SmartViewSort[];
  columns: SmartViewColumn[];
  isDefault: boolean;
  isShared: boolean;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SmartViewFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains'
          | 'in' | 'between' | 'is_null' | 'is_not_null';
  value: unknown;
}

interface SmartViewSort {
  field: string;
  direction: 'asc' | 'desc';
}

interface SmartViewColumn {
  field: string;
  label: string;
  visible: boolean;
  order: number;
}
```

### Duplicate Detection Types

```typescript
interface DuplicateMatch {
  matchedRecordId: string;
  confidence: number;                   // 0-100 percentage
  matchReasons: string[];               // Human-readable match explanations
}

interface DuplicateGroup {
  records: Array<{
    id: string;
    data: Record<string, unknown>;
    confidence: number;
    matchReasons: string[];
  }>;
  bestMatch: number;                    // Highest confidence in group
}

interface MergePreview {
  survivorId: string;
  mergedId: string;
  conflicts: Array<{
    field: string;
    survivorValue: unknown;
    mergedValue: unknown;
  }>;
  autoResolved: Record<string, unknown>;
}

interface MergeHistoryRecord {
  id: string;
  objectType: string;
  survivorId: string;
  mergedId: string;
  fieldResolutions: Record<string, 'survivor' | 'merged'>;
  survivorSnapshot: Record<string, unknown>;
  mergedSnapshot: Record<string, unknown>;
  mergedBy: string;
  mergedAt: Date;
}
```

### Constants

```typescript
const CONTACT_TYPES = ['person', 'company'] as const;

const LIFECYCLE_STAGES = [
  'lead', 'marketing_qualified', 'sales_qualified',
  'opportunity', 'customer', 'evangelist', 'churned',
] as const;

const DEAL_STATUSES = ['open', 'won', 'lost'] as const;

const ACTIVITY_TYPES = ['note', 'email', 'call', 'meeting', 'task'] as const;

const ACTIVITY_SUBJECT_TYPES = ['contact', 'deal', 'organization'] as const;

const SCORING_CATEGORIES = ['behavioral', 'demographic', 'firmographic'] as const;

const FORECAST_PERIODS = ['monthly', 'quarterly', 'yearly'] as const;

const FORECAST_CATEGORIES = ['commit', 'best_case', 'pipeline', 'omitted'] as const;

const RISK_LEVELS = ['low', 'medium', 'high'] as const;

const RELATIONSHIP_TYPES = ['has_many', 'belongs_to', 'many_to_many'] as const;

const CRM_OBJECT_TYPES = ['contact', 'organization', 'deal', 'custom'] as const;

const DUPLICATE_OBJECT_TYPES = ['contact', 'organization'] as const;
```

---

## Configuration

### Environment Variables

```bash
# ─── CRM Limits ──────────────────────────────────────────────────
CRM_DEFAULT_PIPELINE_STAGES=5            # Default stages for new pipelines
CRM_MAX_CONTACTS_PER_VENTURE=1000000     # Contact limit per venture
CRM_MAX_DEALS_PER_VENTURE=100000         # Deal limit per venture
CRM_MAX_CUSTOM_OBJECTS=50                # Max custom objects per venture
CRM_MAX_CUSTOM_FIELDS=100               # Max fields per custom object

# ─── Scoring ─────────────────────────────────────────────────────
CRM_DEAL_SCORE_BATCH_SIZE=100            # Deals per batch scoring run
CRM_LEAD_SCORE_BATCH_SIZE=5000           # Contacts per batch scoring run
CRM_LEAD_DECAY_INTERVAL_DAYS=30          # Default decay period
CRM_LEAD_DECAY_PERCENT=10               # Default decay percentage

# ─── Duplicate Detection ─────────────────────────────────────────
CRM_DUPLICATE_SCAN_LIMIT=2000            # Max records per duplicate scan
CRM_DUPLICATE_CONFIDENCE_THRESHOLD=60    # Min confidence for duplicate match
CRM_FUZZY_NAME_THRESHOLD=85             # Min name similarity percentage

# ─── Forecast ────────────────────────────────────────────────────
CRM_FORECAST_AUTO_POPULATE=true          # Auto-add matching deals to forecast
CRM_FORECAST_COMMIT_THRESHOLD=90         # Probability % for commit category
CRM_FORECAST_BEST_CASE_THRESHOLD=70      # Probability % for best_case

# ─── Cron Schedules ──────────────────────────────────────────────
CRM_BATCH_SCORE_CRON="0 2 * * *"         # Batch deal scoring at 2 AM daily
CRM_LEAD_DECAY_CRON="0 3 * * 1"          # Lead decay every Monday 3 AM
CRM_DUPLICATE_SCAN_CRON="0 4 * * 0"      # Weekly duplicate scan Sundays 4 AM
```

### Runtime Configuration

The CRM module reads configuration from `@mcv/kernel`'s config service, with environment variable overrides. Configuration is venture-scoped where applicable (e.g., pipeline defaults, scoring rules).

```typescript
interface CrmConfig {
  // Limits
  maxContactsPerVenture: number;
  maxDealsPerVenture: number;
  maxCustomObjects: number;
  maxCustomFields: number;
  defaultPipelineStages: number;

  // Scoring
  dealScoreBatchSize: number;
  leadScoreBatchSize: number;
  leadDecayIntervalDays: number;
  leadDecayPercent: number;

  // Duplicate Detection
  duplicateScanLimit: number;
  duplicateConfidenceThreshold: number;
  fuzzyNameThreshold: number;

  // Forecast
  forecastAutoPopulate: boolean;
  forecastCommitThreshold: number;
  forecastBestCaseThreshold: number;

  // Cron
  batchScoreCron: string;
  leadDecayCron: string;
  duplicateScanCron: string;
}
```

---

## Dependencies

### Upstream Dependencies (consumed by @mcv/crm)

| Package | Tier | Purpose |
|---|---|---|
| `@mcv/kernel` | 1 | Database (Drizzle ORM, Supabase client), config, logging, audit trail, venture context, multi-tenancy (RLS), error handling |
| `@mcv/identity` | 2 | Authentication, authorization (RBAC), user context, permission procedures, ownership (ownerId → user) |
| `@mcv/fabric` | 2 | File storage for activity attachments (documents, recordings, images) |
| `@mcv/connectors/email` | 3 | Email delivery for stage automation actions, activity sync for email activities |

### Downstream Consumers (depend on @mcv/crm)

| Package | Tier | How It Uses CRM |
|---|---|---|
| `@mcv/nexus` | 5/6 | Links conversations to CRM contacts, creates activities from conversation events |
| `@mcv/growth` | 5/6 | Uses CRM contacts for lead generation, campaign targeting, audience segmentation |
| `@mcv/analytics` | 6 | Reads CRM data for sales dashboards, pipeline reports, conversion analytics |
| `@mcv/naos` | 4 | AI agents (Sales Agent, CRM Agent) invoke CRM services via tRPC routes |
| Portal Applications | 7 | Consume CRM React hooks and components for UI rendering |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | ^0.29.x | Database ORM — all CRM queries, schema definitions, migrations |
| `@trpc/server` | ^10.x | Type-safe API routes for CRM endpoints |
| `zod` | ^3.x | Input validation schemas for all service methods |
| `uuid` | ^9.x | UUID generation for primary keys |

### Peer Dependencies (via @mcv/kernel)

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | PostgreSQL client with RLS support |
| `redis` | Caching for scoring results, search indexes |
| `@redpanda/client` | Event streaming for cross-domain events |

---

## Multi-Tenant Design

### Venture-Scoped Isolation

Every CRM entity (contacts, organizations, deals, pipelines, activities, scores, forecasts, custom objects, smart views) is scoped to a **venture** via a required `ventureId` column. Multi-tenancy is enforced at three levels:

#### Level 1: Application Layer

Every service function requires a venture context. There are no cross-venture queries in the standard API surface.

```typescript
// Every service method is venture-scoped
const contacts = await listContacts({
  ventureId: ctx.ventureId,  // Required — from session context
  page: 1,
  pageSize: 25,
});
```

#### Level 2: ORM Layer

Drizzle queries always include `ventureId` in WHERE clauses. All composite indexes include `ventureId` as the leading column for efficient tenant-partitioned queries.

```typescript
// Example: contacts query always includes ventureId
const result = await db.select()
  .from(contacts)
  .where(
    and(
      eq(contacts.ventureId, ventureId),
      eq(contacts.lifecycleStage, 'sales_qualified'),
    )
  )
  .orderBy(desc(contacts.leadScore))
  .limit(pageSize)
  .offset((page - 1) * pageSize);
```

#### Level 3: Database Layer (RLS)

PostgreSQL Row-Level Security policies enforce venture isolation at the database level, providing defense-in-depth even if application-layer checks are bypassed.

```sql
-- RLS policy on contacts table
CREATE POLICY contacts_venture_isolation ON contacts
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- Similar policies on all CRM tables
```

### Cross-Venture Operations

Cross-venture operations (e.g., consortium-wide reporting) are limited to:
- Service role bypass (bypasses RLS for administrative queries)
- Explicit cross-venture service functions (not yet implemented for CRM)
- Analytics aggregation via `@mcv/analytics` (which has service-role access)

### Tenant Resource Limits

| Resource | Default Limit | Enterprise Limit |
|---|---|---|
| Contacts per venture | 1,000,000 | Configurable |
| Deals per venture | 100,000 | Configurable |
| Custom objects per venture | 50 | 100 |
| Custom fields per object | 100 | 200 |
| Smart views per venture | Unlimited | Unlimited |
| Pipelines per venture | Unlimited | Unlimited |

---

## Security

### Authentication & Authorization

CRM routes are protected via `@mcv/identity`'s permission system:

```typescript
// tRPC route with permission check
export const contactRouter = router({
  list: permissionProcedure('contacts', 'read')
    .input(listContactsSchema)
    .query(async ({ ctx, input }) => {
      return listContacts({ ...input, ventureId: ctx.ventureId });
    }),

  create: permissionProcedure('contacts', 'create')
    .input(createContactSchema)
    .mutation(async ({ ctx, input }) => {
      return createContact({ ...input, ventureId: ctx.ventureId });
    }),
});
```

### Permission Matrix

| Resource | Read | Create | Update | Delete | Bulk |
|---|---|---|---|---|---|
| Contacts | `contacts:read` | `contacts:create` | `contacts:update` | `contacts:delete` | `contacts:update` / `contacts:delete` |
| Organizations | `organizations:read` | `organizations:create` | `organizations:update` | `organizations:delete` | `organizations:delete` |
| Deals | `deals:read` | `deals:create` | `deals:update` | `deals:delete` | — |
| Deal Scoring | `deals:read` | `deals:create` | `deals:update` | — | — |
| Lead Scoring | `contacts:read` | `contacts:create` | `contacts:update` | `contacts:delete` | — |
| Forecasts | `deals:read` | `deals:create` | `deals:update` | — | — |
| Smart Views | Auth required | Auth required | Auth required | Auth required | — |
| Custom Objects | Auth required | Auth required | Auth required | Auth required | — |

### Data Privacy

- **Activity audit trail** — Every activity records `createdBy` for attribution
- **Merge audit trail** — All merge operations preserve complete data snapshots of both records
- **Soft referential integrity** — Deal deletion preserves contact/organization links via `onDelete: 'set null'`
- **Custom field sanitization** — User-defined fields validated against schema definitions before storage
- **Venture isolation** — No CRM data is accessible across venture boundaries without service-role access

### Input Validation

All service inputs are validated via Zod schemas:

```typescript
const createContactSchema = z.object({
  type: z.enum(['person', 'company']),
  firstName: z.string().max(255).optional(),
  lastName: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(255).optional(),
  jobTitle: z.string().max(255).optional(),
  lifecycleStage: z.enum(LIFECYCLE_STAGES).default('lead'),
  ownerId: z.string().uuid().optional(),
  customFields: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
});
```

---

## Performance

### Latency Targets

| Operation | Target | P99 |
|---|---|---|
| Contact list (paginated) | < 50ms | < 150ms |
| Contact search (autocomplete) | < 30ms | < 80ms |
| Deal by stage (Kanban) | < 100ms | < 300ms |
| Deal score (single) | < 200ms | < 500ms |
| Deal score (batch, 100 deals) | < 10s | < 30s |
| Lead score (single) | < 100ms | < 300ms |
| Lead score (batch, 5000 contacts) | < 30s | < 60s |
| Duplicate scan (1000 contacts) | < 2s | < 5s |
| Duplicate scan (2000 contacts) | < 5s | < 10s |
| Forecast summary | < 100ms | < 300ms |
| Smart view apply | < 80ms | < 200ms |

### Throughput Targets

| Metric | Standard Venture | Enterprise Venture |
|---|---|---|
| Contacts | 100,000 | 1,000,000+ |
| Deals | 10,000 | 100,000+ |
| Activities | 500,000 | 5,000,000+ |
| Concurrent users | 50 | 500+ |
| API requests/sec | 100 | 1,000+ |

### Optimization Strategies

1. **Composite indexes** — All common query patterns covered with multi-column indexes (venture + status, venture + pipeline, venture + lifecycle, etc.)
2. **Cursor-based pagination** — For large datasets, cursor-based pagination avoids OFFSET performance degradation
3. **Parallel data gathering** — Deal scoring gathers 10 context metrics via `Promise.all` for maximum concurrency
4. **Batch processing** — Scoring runs as background cron jobs, not on every page view
5. **Scan limits** — Duplicate scans capped at 2000 records to prevent timeouts
6. **JSONB indexing** — GIN indexes on custom fields and tags for containment queries
7. **Denormalized scores** — Lead scores cached on contact records for fast sort/filter
8. **Async audit logging** — Audit events written asynchronously, never blocking mutation responses
9. **Connection pooling** — Supabase connection pooler manages database connections efficiently

---

## Deployment

### Package Structure

```
packages/domains/crm/
├── client/
│   ├── components/
│   │   ├── activity-timeline.tsx
│   │   ├── contact-detail.tsx
│   │   ├── contact-list.tsx
│   │   ├── deal-kanban.tsx
│   │   ├── deal-score-card.tsx
│   │   ├── duplicate-resolver.tsx
│   │   ├── forecast-dashboard.tsx
│   │   ├── lead-score-widget.tsx
│   │   ├── pipeline-view.tsx
│   │   └── smart-view-builder.tsx
│   └── hooks/
│       ├── use-activities.ts
│       ├── use-contact.ts
│       ├── use-contacts.ts
│       ├── use-deal-pipeline.ts
│       ├── use-deal-score.ts
│       ├── use-deals.ts
│       ├── use-duplicates.ts
│       ├── use-forecast.ts
│       ├── use-lead-scoring.ts
│       └── use-smart-view.ts
├── server/
│   ├── services/
│   │   ├── activity-service.ts
│   │   ├── contact-service.ts
│   │   ├── custom-object-service.ts
│   │   ├── deal-scoring-service.ts
│   │   ├── deal-service.ts
│   │   ├── duplicate-detection-service.ts
│   │   ├── forecast-service.ts
│   │   ├── lead-scoring-service.ts
│   │   ├── organization-service.ts
│   │   └── smart-view-service.ts
│   └── schema/
│       ├── contacts.ts
│       ├── organizations.ts
│       ├── deals.ts
│       ├── pipelines.ts
│       ├── activities.ts
│       ├── deal-scores.ts
│       ├── contact-scores.ts
│       ├── lead-scoring-rules.ts
│       ├── forecasts.ts
│       ├── forecast-items.ts
│       ├── smart-views.ts
│       ├── custom-objects.ts
│       ├── custom-object-records.ts
│       ├── object-relationships.ts
│       ├── duplicate-rules.ts
│       ├── merge-history.ts
│       └── pipeline-stages-v2.ts
├── constants.ts
├── types.ts
├── index.ts
└── package.json
```

### Build & Test

```bash
# Build (via Turborepo)
turbo build --filter=@mcv/crm

# Test
turbo test --filter=@mcv/crm

# Type check
turbo typecheck --filter=@mcv/crm

# Lint
turbo lint --filter=@mcv/crm
```

### Database Migrations

CRM tables are managed via Drizzle ORM migrations:

```bash
# Generate migration from schema changes
npx drizzle-kit generate:pg --schema=packages/domains/crm/server/schema

# Apply migrations
npx drizzle-kit push:pg
```

### Cron Jobs

The CRM module requires three background cron jobs:

| Job | Schedule | Description |
|---|---|---|
| Batch Deal Scoring | `0 2 * * *` (daily 2 AM) | Re-scores all open deals |
| Lead Score Decay | `0 3 * * 1` (Monday 3 AM) | Decays inactive contact scores |
| Duplicate Scan | `0 4 * * 0` (Sunday 4 AM) | Scans for new duplicate groups |

### Health Checks

```typescript
// CRM health check endpoint
GET /api/crm/health

// Response
{
  "status": "healthy",
  "database": "connected",
  "tables": {
    "contacts": true,
    "deals": true,
    "pipelines": true,
    "activities": true
  },
  "lastBatchScore": "2026-02-09T02:00:00Z",
  "lastDecayRun": "2026-02-03T03:00:00Z"
}
```

### Standalone Deployment (Publishable)

As a PUBLISHABLE module, `@mcv/crm` can be deployed independently:

1. **Extract** — Package `@mcv/crm` with its kernel/identity/fabric dependencies
2. **Configure** — Set environment variables for database, auth, and storage
3. **Migrate** — Run Drizzle migrations to create CRM tables
4. **Deploy** — Deploy as a Next.js application with tRPC API routes
5. **Integrate** — Connect email connector for activity sync, configure cron jobs

The publishable deployment strips MCV.ONE-specific integrations (NAOS agents, growth, analytics) while preserving the complete CRM feature set.

---

*@mcv/crm — Customer Relationship Management Domain*
