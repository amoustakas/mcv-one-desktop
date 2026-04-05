# @mcv/nexus/crm

> Customer Relationship Management for the MCV.ONE platform — contacts, companies, deals/pipeline, activities, lead management, and workflow automation with multi-tenant isolation and real-time event-driven architecture.

**Package:** `@mcv/nexus/crm`  
**Layer:** Tier 5 — Domain Module (Nexus)  
**Since:** 0.14.0  
**Status:** Stable  
**Maintainer:** MCV Platform Team  

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
- [Core Interfaces](#core-interfaces)
- [Database Schemas](#database-schemas)
- [Code Examples](#code-examples)
- [Error Codes](#error-codes)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

`@mcv/nexus/crm` provides a full-featured CRM system purpose-built for the MCV.ONE multi-venture platform. Every venture on the platform gets its own isolated CRM with customizable pipelines, contact management, deal tracking, and activity logging — all underpinned by PostgreSQL row-level security and event-driven automation via Redpanda.

### Why This Exists

Most CRM systems are monolithic SaaS products that assume a single organization. MCV.ONE ventures need CRM capabilities that are:

1. **Multi-tenant by default** — Each venture's data is strictly isolated via RLS policies. A venture never sees another venture's contacts, deals, or pipelines.
2. **Composable** — The CRM integrates with `@mcv/growth/marketing` for lead scoring, `@mcv/nexus/billing` for revenue tracking, and `@mcv/comms` for communication logging.
3. **Event-driven** — Every mutation (contact created, deal stage changed, activity logged) emits a Redpanda event, enabling workflow automations and cross-module reactions.
4. **Customizable** — Ventures define their own pipelines, deal stages, custom fields, views, and automation rules without code changes.

### Core Capabilities

| Capability | Description |
|---|---|
| **Contacts** | Full CRUD, custom fields, timeline, merge duplicates, import/export, scoring |
| **Companies** | Profiles, parent/child hierarchy, industry classification, associated contacts |
| **Deals/Pipeline** | Customizable stages, deal values, win probability, weighted pipeline, forecasting |
| **Activities** | Calls, emails, meetings, notes, tasks; timeline, reminders, automatic logging |
| **Pipeline Management** | Multiple pipelines per venture, stage automation, deal rotation, stale alerts |
| **Lead Management** | Capture, scoring integration, assignment rules, lead-to-contact conversion |
| **Custom Fields** | Dynamic definitions (text, number, date, enum, multi-select, user, currency) |
| **Views & Filters** | Saved views, advanced filters, kanban/list/table, column customization, bulk actions |
| **Workflow Automation** | Trigger-based rules: stage change → task, lead score → email, round-robin assign |
| **Reporting** | Pipeline value, conversion rates, sales velocity, forecast accuracy, rep metrics |

---

## Exports

```typescript
// === Core Service ===
export { CRMService }                    from './services/crm.service';
export { createCRMRouter }               from './router';

// === Contact Management ===
export { ContactService }                from './services/contact.service';
export { ContactMergeService }           from './services/contact-merge.service';
export { ContactImportService }          from './services/contact-import.service';
export { ContactScoringService }         from './services/contact-scoring.service';

// === Company Management ===
export { CompanyService }                from './services/company.service';
export { CompanyHierarchyService }       from './services/company-hierarchy.service';

// === Deal & Pipeline ===
export { DealService }                   from './services/deal.service';
export { PipelineService }               from './services/pipeline.service';
export { PipelineForecastService }       from './services/pipeline-forecast.service';
export { DealRotationService }           from './services/deal-rotation.service';
export { StaleDealService }              from './services/stale-deal.service';

// === Activities ===
export { ActivityService }               from './services/activity.service';
export { ActivityReminderService }       from './services/activity-reminder.service';
export { AutoLogService }               from './services/auto-log.service';

// === Lead Management ===
export { LeadService }                   from './services/lead.service';
export { LeadAssignmentService }         from './services/lead-assignment.service';
export { LeadConversionService }         from './services/lead-conversion.service';

// === Custom Fields ===
export { CustomFieldService }            from './services/custom-field.service';
export { CustomFieldValidationService }  from './services/custom-field-validation.service';

// === Views & Filters ===
export { CRMViewService }               from './services/crm-view.service';
export { BulkActionService }            from './services/bulk-action.service';

// === Workflow Automation ===
export { WorkflowAutomationService }     from './services/workflow-automation.service';
export { WorkflowExecutionEngine }       from './services/workflow-execution.engine';

// === Reporting ===
export { CRMReportingService }           from './services/crm-reporting.service';
export { ForecastService }               from './services/forecast.service';

// === Types ===
export type {
  Contact,
  ContactCreateInput,
  ContactUpdateInput,
  ContactFilter,
  ContactTimeline,
  ContactScore,
  ContactMergeResult,
  ContactImportJob,
  ContactImportMapping,
} from './types/contact.types';

export type {
  Company,
  CompanyCreateInput,
  CompanyUpdateInput,
  CompanyFilter,
  CompanyHierarchy,
  CompanySize,
  IndustryClassification,
} from './types/company.types';

export type {
  Deal,
  DealCreateInput,
  DealUpdateInput,
  DealFilter,
  DealStage,
  DealStageCreateInput,
  Pipeline,
  PipelineCreateInput,
  PipelineUpdateInput,
  PipelineForecast,
  WeightedPipelineValue,
} from './types/deal.types';

export type {
  Activity,
  ActivityCreateInput,
  ActivityUpdateInput,
  ActivityFilter,
  ActivityType,
  ActivityReminder,
} from './types/activity.types';

export type {
  Lead,
  LeadCreateInput,
  LeadUpdateInput,
  LeadFilter,
  LeadStatus,
  LeadSource,
  LeadAssignmentRule,
  LeadConversionResult,
} from './types/lead.types';

export type {
  CustomField,
  CustomFieldDefinition,
  CustomFieldCreateInput,
  CustomFieldValue,
  CustomFieldType,
  FieldValidationRule,
} from './types/custom-field.types';

export type {
  CRMView,
  CRMViewCreateInput,
  CRMViewUpdateInput,
  ViewType,
  ViewColumn,
  ViewFilter,
  ViewSort,
  BulkAction,
  BulkActionResult,
} from './types/view.types';

export type {
  WorkflowAutomation,
  WorkflowAutomationCreateInput,
  WorkflowTrigger,
  WorkflowAction,
  WorkflowCondition,
  WorkflowExecutionLog,
} from './types/workflow.types';

export type {
  PipelineReport,
  ConversionReport,
  SalesVelocityReport,
  ForecastReport,
  ActivityMetrics,
  RepPerformanceReport,
} from './types/reporting.types';

// === Schemas (Drizzle) ===
export {
  contacts,
  companies,
  deals,
  dealStages,
  pipelines,
  activities,
  leads,
  customFieldDefinitions,
  customFieldValues,
  crmViews,
  workflowAutomations,
  contactCompanies,
} from './schema';

// === Events ===
export {
  CRM_EVENTS,
  type CRMEvent,
  type ContactCreatedEvent,
  type ContactUpdatedEvent,
  type ContactDeletedEvent,
  type ContactMergedEvent,
  type DealCreatedEvent,
  type DealStageChangedEvent,
  type DealWonEvent,
  type DealLostEvent,
  type ActivityLoggedEvent,
  type LeadCapturedEvent,
  type LeadConvertedEvent,
  type LeadScoredEvent,
  type WorkflowTriggeredEvent,
} from './events';

// === Constants ===
export {
  DEFAULT_PIPELINE_STAGES,
  INDUSTRY_CODES,
  COMPANY_SIZES,
  LEAD_SOURCES,
  ACTIVITY_TYPES,
  CRM_PERMISSIONS,
} from './constants';
```

---

## Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        tRPC Router Layer                         │
│  contacts.* │ companies.* │ deals.* │ activities.* │ leads.*    │
│  pipelines.* │ customFields.* │ views.* │ automations.*        │
└──────────┬───────────────────────────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────────────────────────┐
│                        CRMService (Facade)                       │
│                                                                   │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────┐ │
│  │  Contact     │ │  Company     │ │  Deal      │ │ Activity  │ │
│  │  Service     │ │  Service     │ │  Service   │ │ Service   │ │
│  └──────┬──────┘ └──────┬───────┘ └─────┬──────┘ └─────┬─────┘ │
│         │               │               │               │        │
│  ┌──────┴──────┐ ┌──────┴───────┐ ┌─────┴──────┐              │
│  │  Lead       │ │  CustomField │ │  Pipeline  │              │
│  │  Service    │ │  Service     │ │  Service   │              │
│  └──────┬──────┘ └──────┬───────┘ └─────┬──────┘              │
│         │               │               │                       │
│  ┌──────┴──────┐ ┌──────┴───────┐ ┌─────┴──────┐              │
│  │  CRMView   │ │  Workflow    │ │  Reporting │              │
│  │  Service    │ │  Automation  │ │  Service   │              │
│  └─────────────┘ └──────────────┘ └────────────┘              │
└──────────┬───────────────────────────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────────────────────────┐
│                     Data & Event Layer                            │
│                                                                   │
│  ┌──────────────────┐        ┌────────────────────────────────┐ │
│  │  Supabase        │        │  Redpanda (Event Bus)          │ │
│  │  PostgreSQL      │        │                                │ │
│  │  + Drizzle ORM   │◄──────►│  crm.contacts.created         │ │
│  │  + RLS Policies  │        │  crm.deals.stage-changed      │ │
│  │                  │        │  crm.leads.scored              │ │
│  │  contacts        │        │  crm.activities.logged         │ │
│  │  companies       │        │  crm.workflows.triggered       │ │
│  │  deals           │        │  ...                           │ │
│  │  pipelines       │        └────────────────────────────────┘ │
│  │  activities      │                                           │
│  │  leads           │                                           │
│  │  custom_fields   │                                           │
│  │  crm_views       │                                           │
│  │  automations     │                                           │
│  └──────────────────┘                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Deal Pipeline Architecture

The pipeline system is the central organizing concept for sales processes. Each venture can have multiple pipelines (e.g., "Enterprise Sales", "Self-Serve", "Partnerships"), each with its own ordered stages.

```
Pipeline: "Enterprise Sales"
┌────────────┐    ┌──────────┐    ┌────────────┐    ┌───────────┐    ┌────────┐
│ Qualified  │───►│ Meeting  │───►│ Proposal   │───►│ Negotia-  │───►│ Closed │
│ Lead       │    │ Booked   │    │ Sent       │    │ tion      │    │ Won    │
│            │    │          │    │            │    │           │    │        │
│ P(win)=10% │    │ P(win)=25│    │ P(win)=50% │    │ P(win)=75%│    │ 100%   │
│ $2.4M      │    │ $1.8M    │    │ $900K      │    │ $600K     │    │ $450K  │
│ (12 deals) │    │ (8 deals)│    │ (6 deals)  │    │ (4 deals) │    │(3 deal)│
└────────────┘    └──────────┘    └────────────┘    └───────────┘    └────────┘
Weighted: $240K    $450K           $450K             $450K            $450K

                                                              ┌────────┐
                                                         ───►│ Closed │
                                                              │ Lost   │
                                                              └────────┘

Total Pipeline Value: $6.15M
Weighted Pipeline:    $2.04M
```

**Key concepts:**

- **Pipeline** — A named sales process with ordered stages. Ventures define as many as needed.
- **Deal Stage** — A step in the pipeline with a name, position, win probability, and optional automation triggers.
- **Win Probability** — Each stage has a default probability (0–100%). Used for weighted pipeline calculation and forecasting.
- **Weighted Value** — `deal_value × win_probability`. Gives a realistic view of expected revenue.
- **Forecast** — Aggregated weighted values over a time period, with historical accuracy adjustments.

### Stage Transitions & Automation

```
Deal Stage Change Event
         │
         ▼
┌──────────────────┐
│  Event Emitted   │
│  to Redpanda     │
│                  │
│  topic: crm.     │
│  deals.stage-    │
│  changed         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌────────────────────────┐
│ Workflow Engine  │────►│ Evaluate Conditions     │
│ (Consumer)       │     │                         │
└──────────────────┘     │ IF stage = "Proposal"   │
                         │ AND value > $50K        │
                         │ THEN:                   │
                         │   1. Create task for     │
                         │      manager review     │
                         │   2. Send Slack notify  │
                         │   3. Update forecast    │
                         └────────────────────────┘
```

### Activity Tracking Architecture

Activities create a complete timeline of every interaction with a contact, company, or deal. Activities can be manually logged or automatically captured from integrations.

```
┌───────────────────────────────────────────────────────────────┐
│                    Activity Sources                            │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Manual   │  │ Email    │  │ Calendar │  │ @mcv/comms   │ │
│  │ Entry    │  │ Tracking │  │ Sync     │  │ Integration  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘ │
│       │              │              │               │         │
│       ▼              ▼              ▼               ▼         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              ActivityService.log()                      │  │
│  │                                                         │  │
│  │  Validates → Stores → Links → Emits Event → Schedules │  │
│  │  input       to DB    to       to Redpanda   reminder  │  │
│  │                       entity                  (if any)  │  │
│  └─────────────────────────┬──────────────────────────────┘  │
│                            │                                  │
│                            ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                 Activity Timeline                       │  │
│  │                                                         │  │
│  │  Contact: John Smith                                   │  │
│  │  ─────────────────────────────────────                 │  │
│  │  📞 Call — 15 min — Discussed pricing    (2h ago)     │  │
│  │  📧 Email — Follow-up sent               (1d ago)     │  │
│  │  📅 Meeting — Demo scheduled              (3d ago)     │  │
│  │  📝 Note — Budget confirmed at $50K       (5d ago)     │  │
│  │  🎯 Deal — Moved to "Proposal Sent"      (5d ago)     │  │
│  │  ✅ Task — Completed: Send case study     (7d ago)     │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Isolation

Every CRM table enforces venture-level isolation through PostgreSQL RLS:

```sql
-- Every CRM table includes venture_id
-- RLS policy pattern (applied to all CRM tables):
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_venture_isolation ON contacts
  USING (venture_id = current_setting('app.current_venture_id')::uuid)
  WITH CHECK (venture_id = current_setting('app.current_venture_id')::uuid);
```

The `venture_id` is injected into every database session via the Supabase client middleware in `@mcv/nexus/core`, ensuring that no cross-venture data leakage is possible even if application code has bugs.

### Event Flow

All CRM mutations emit events to Redpanda topics for downstream consumption:

```
Topic Naming: crm.<entity>.<action>

crm.contacts.created       — New contact added
crm.contacts.updated       — Contact fields changed
crm.contacts.deleted       — Contact removed (soft delete)
crm.contacts.merged        — Two contacts merged into one
crm.companies.created      — New company added
crm.companies.updated      — Company fields changed
crm.deals.created          — New deal added to pipeline
crm.deals.stage-changed    — Deal moved between stages
crm.deals.won              — Deal marked as won
crm.deals.lost             — Deal marked as lost
crm.deals.value-changed    — Deal monetary value changed
crm.activities.logged      — Activity recorded
crm.leads.captured         — New lead from external source
crm.leads.scored           — Lead score recalculated
crm.leads.converted        — Lead converted to contact
crm.leads.assigned         — Lead assigned to user
crm.workflows.triggered    — Automation rule fired
crm.workflows.completed    — Automation execution finished
crm.workflows.failed       — Automation execution errored
```

---

## Core Interfaces

### CRMService

The top-level facade that aggregates all CRM sub-services.

```typescript
interface CRMService {
  // Sub-service accessors
  readonly contacts: ContactService;
  readonly companies: CompanyService;
  readonly deals: DealService;
  readonly pipelines: PipelineService;
  readonly activities: ActivityService;
  readonly leads: LeadService;
  readonly customFields: CustomFieldService;
  readonly views: CRMViewService;
  readonly automations: WorkflowAutomationService;
  readonly reporting: CRMReportingService;

  /**
   * Initialize the CRM module for a venture.
   * Creates default pipeline and stages if none exist.
   */
  initialize(ventureId: string): Promise<void>;

  /**
   * Full-text search across contacts, companies, and deals.
   */
  search(query: string, options?: CRMSearchOptions): Promise<CRMSearchResult>;

  /**
   * Get a unified timeline across all entities for a venture.
   */
  getTimeline(options: TimelineOptions): Promise<TimelineEntry[]>;
}

interface CRMSearchOptions {
  entities?: ('contacts' | 'companies' | 'deals' | 'leads')[];
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

interface CRMSearchResult {
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  leads: Lead[];
  totalCount: number;
}

interface TimelineOptions {
  entityType?: 'contact' | 'company' | 'deal';
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  activityTypes?: ActivityType[];
  limit?: number;
  offset?: number;
}

interface TimelineEntry {
  id: string;
  type: 'activity' | 'deal_stage_change' | 'note' | 'email' | 'system';
  timestamp: Date;
  entityType: 'contact' | 'company' | 'deal' | 'lead';
  entityId: string;
  userId: string;
  summary: string;
  metadata: Record<string, unknown>;
}
```

### Contact

```typescript
interface Contact {
  id: string;
  ventureId: string;
  
  // Identity
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
  
  // Associations
  companyIds: string[];
  primaryCompanyId: string | null;
  ownerId: string | null;           // Assigned sales rep
  
  // Scoring
  score: number;                     // 0–100 composite score
  scoreBreakdown: ContactScoreBreakdown | null;
  
  // Lifecycle
  lifecycleStage: ContactLifecycleStage;
  source: string | null;             // How they entered the CRM
  sourceDetail: string | null;       // Specific campaign, form, etc.
  
  // Custom fields (stored as key-value)
  customFields: Record<string, CustomFieldValue>;
  
  // Tags
  tags: string[];
  
  // Communication preferences
  doNotEmail: boolean;
  doNotCall: boolean;
  unsubscribedAt: Date | null;
  
  // Metadata
  lastActivityAt: Date | null;
  lastContactedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  createdBy: string;
  updatedBy: string;
}

type ContactLifecycleStage =
  | 'subscriber'
  | 'lead'
  | 'marketing_qualified'
  | 'sales_qualified'
  | 'opportunity'
  | 'customer'
  | 'evangelist'
  | 'other';

interface ContactScoreBreakdown {
  demographic: number;        // Fit score (job title, company size, industry)
  behavioral: number;         // Engagement score (email opens, page visits)
  firmographic: number;       // Company-level score
  recency: number;            // Time since last engagement
  total: number;              // Weighted composite
  calculatedAt: Date;
}

interface ContactCreateInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  primaryCompanyId?: string;
  ownerId?: string;
  lifecycleStage?: ContactLifecycleStage;
  source?: string;
  sourceDetail?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
  doNotEmail?: boolean;
  doNotCall?: boolean;
}

interface ContactUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  primaryCompanyId?: string;
  ownerId?: string;
  lifecycleStage?: ContactLifecycleStage;
  customFields?: Record<string, unknown>;
  tags?: string[];
  doNotEmail?: boolean;
  doNotCall?: boolean;
}

interface ContactFilter {
  search?: string;
  email?: string;
  companyId?: string;
  ownerId?: string;
  lifecycleStage?: ContactLifecycleStage | ContactLifecycleStage[];
  tags?: string[];
  tagsMode?: 'any' | 'all';
  scoreMin?: number;
  scoreMax?: number;
  source?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  lastActivityAfter?: Date;
  lastActivityBefore?: Date;
  hasEmail?: boolean;
  hasPhone?: boolean;
  isArchived?: boolean;
  customFieldFilters?: CustomFieldFilter[];
  sortBy?: ContactSortField;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

type ContactSortField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'score'
  | 'lastActivityAt'
  | 'createdAt'
  | 'updatedAt';

interface ContactMergeResult {
  survivingContactId: string;
  mergedContactId: string;
  fieldsKept: Record<string, 'surviving' | 'merged'>;
  activitiesMoved: number;
  dealsMoved: number;
  duplicateRemoved: boolean;
}

interface ContactImportJob {
  id: string;
  ventureId: string;
  status: 'pending' | 'validating' | 'importing' | 'completed' | 'failed';
  fileName: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skipCount: number;
  errors: ContactImportError[];
  mapping: ContactImportMapping;
  createdAt: Date;
  completedAt: Date | null;
}

interface ContactImportMapping {
  columns: Record<string, string | null>;  // CSV column → Contact field
  defaultValues: Record<string, unknown>;
  deduplicateOn: 'email' | 'phone' | 'name' | 'none';
  onDuplicate: 'skip' | 'update' | 'create_new';
  tags?: string[];
  ownerId?: string;
  lifecycleStage?: ContactLifecycleStage;
}

interface ContactImportError {
  row: number;
  field: string;
  value: unknown;
  message: string;
}
```

### Company

```typescript
interface Company {
  id: string;
  ventureId: string;
  
  // Identity
  name: string;
  domain: string | null;
  logoUrl: string | null;
  description: string | null;
  
  // Classification
  industry: string | null;
  industryCode: string | null;      // NAICS or SIC
  companySize: CompanySize | null;
  annualRevenue: number | null;
  annualRevenueCurrency: string;     // ISO 4217
  employeeCount: number | null;
  
  // Hierarchy
  parentCompanyId: string | null;
  childCompanyIds: string[];
  
  // Location
  address: Address | null;
  
  // Ownership
  ownerId: string | null;
  
  // Social & web
  website: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  
  // Custom fields
  customFields: Record<string, CustomFieldValue>;
  
  // Tags
  tags: string[];
  
  // Metadata
  contactCount: number;              // Denormalized for list views
  openDealCount: number;             // Denormalized
  totalDealValue: number;            // Denormalized
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  createdBy: string;
  updatedBy: string;
}

type CompanySize =
  | 'solo'           // 1 person
  | 'micro'          // 2-10
  | 'small'          // 11-50
  | 'medium'         // 51-200
  | 'large'          // 201-1000
  | 'enterprise'     // 1001-5000
  | 'mega';          // 5000+

interface Address {
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;             // ISO 3166-1 alpha-2
}

interface CompanyCreateInput {
  name: string;
  domain?: string;
  description?: string;
  industry?: string;
  industryCode?: string;
  companySize?: CompanySize;
  annualRevenue?: number;
  annualRevenueCurrency?: string;
  employeeCount?: number;
  parentCompanyId?: string;
  address?: Address;
  ownerId?: string;
  website?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

interface CompanyUpdateInput {
  name?: string;
  domain?: string;
  description?: string;
  industry?: string;
  industryCode?: string;
  companySize?: CompanySize;
  annualRevenue?: number;
  annualRevenueCurrency?: string;
  employeeCount?: number;
  parentCompanyId?: string | null;
  address?: Address | null;
  ownerId?: string | null;
  website?: string | null;
  linkedinUrl?: string | null;
  twitterHandle?: string | null;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

interface CompanyFilter {
  search?: string;
  domain?: string;
  industry?: string;
  companySize?: CompanySize | CompanySize[];
  ownerId?: string;
  parentCompanyId?: string | null;
  tags?: string[];
  tagsMode?: 'any' | 'all';
  minRevenue?: number;
  maxRevenue?: number;
  minEmployees?: number;
  maxEmployees?: number;
  hasOpenDeals?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  isArchived?: boolean;
  customFieldFilters?: CustomFieldFilter[];
  sortBy?: CompanySortField;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

type CompanySortField =
  | 'name'
  | 'industry'
  | 'employeeCount'
  | 'annualRevenue'
  | 'contactCount'
  | 'openDealCount'
  | 'lastActivityAt'
  | 'createdAt';

interface CompanyHierarchy {
  company: Company;
  parent: Company | null;
  children: Company[];
  depth: number;
  totalContactCount: number;        // Including children
  totalDealValue: number;           // Including children
}
```

### Deal & Pipeline

```typescript
interface Deal {
  id: string;
  ventureId: string;
  pipelineId: string;
  
  // Core
  title: string;
  description: string | null;
  
  // Value
  value: number | null;
  currency: string;                  // ISO 4217
  
  // Stage
  stageId: string;
  stageName: string;                 // Denormalized for convenience
  stagePosition: number;             // Denormalized
  stageEnteredAt: Date;
  
  // Probability
  winProbability: number;            // 0–100, can override stage default
  weightedValue: number | null;      // value × (winProbability / 100)
  
  // Dates
  expectedCloseDate: Date | null;
  actualCloseDate: Date | null;
  
  // Outcome
  status: DealStatus;
  lostReason: string | null;
  lostReasonDetail: string | null;
  wonAt: Date | null;
  lostAt: Date | null;
  
  // Associations
  contactIds: string[];
  primaryContactId: string | null;
  companyId: string | null;
  ownerId: string | null;
  
  // Custom fields
  customFields: Record<string, CustomFieldValue>;
  
  // Tags
  tags: string[];
  
  // Metadata
  lastActivityAt: Date | null;
  daysSinceLastActivity: number | null;
  daysInCurrentStage: number;
  totalDaysOpen: number;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  createdBy: string;
  updatedBy: string;
}

type DealStatus = 'open' | 'won' | 'lost' | 'archived';

interface DealCreateInput {
  title: string;
  pipelineId: string;
  stageId: string;
  description?: string;
  value?: number;
  currency?: string;
  winProbability?: number;
  expectedCloseDate?: Date;
  primaryContactId?: string;
  contactIds?: string[];
  companyId?: string;
  ownerId?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

interface DealUpdateInput {
  title?: string;
  stageId?: string;
  description?: string;
  value?: number;
  currency?: string;
  winProbability?: number;
  expectedCloseDate?: Date;
  primaryContactId?: string;
  contactIds?: string[];
  companyId?: string;
  ownerId?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

interface DealFilter {
  search?: string;
  pipelineId?: string;
  stageId?: string | string[];
  status?: DealStatus | DealStatus[];
  ownerId?: string;
  companyId?: string;
  contactId?: string;
  minValue?: number;
  maxValue?: number;
  currency?: string;
  expectedCloseDateAfter?: Date;
  expectedCloseDateBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  tags?: string[];
  tagsMode?: 'any' | 'all';
  isStale?: boolean;
  staleDays?: number;
  customFieldFilters?: CustomFieldFilter[];
  sortBy?: DealSortField;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

type DealSortField =
  | 'title'
  | 'value'
  | 'weightedValue'
  | 'winProbability'
  | 'expectedCloseDate'
  | 'stagePosition'
  | 'lastActivityAt'
  | 'daysInCurrentStage'
  | 'createdAt'
  | 'updatedAt';

interface DealStage {
  id: string;
  pipelineId: string;
  ventureId: string;
  name: string;
  position: number;                  // 0-indexed ordering
  winProbability: number;            // Default probability for deals in this stage
  color: string;                     // Hex color for UI
  description: string | null;
  isClosedWon: boolean;              // Terminal stage — deal won
  isClosedLost: boolean;             // Terminal stage — deal lost
  rottingDays: number | null;        // Days before deal is flagged stale
  automationTriggerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DealStageCreateInput {
  name: string;
  position: number;
  winProbability: number;
  color?: string;
  description?: string;
  isClosedWon?: boolean;
  isClosedLost?: boolean;
  rottingDays?: number;
}

interface Pipeline {
  id: string;
  ventureId: string;
  name: string;
  description: string | null;
  isDefault: boolean;                // One pipeline per venture is the default
  currency: string;                  // Default currency for deals in this pipeline
  stages: DealStage[];
  
  // Aggregated stats (denormalized)
  openDealCount: number;
  totalValue: number;
  weightedValue: number;
  
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  createdBy: string;
}

interface PipelineCreateInput {
  name: string;
  description?: string;
  isDefault?: boolean;
  currency?: string;
  stages: DealStageCreateInput[];
}

interface PipelineUpdateInput {
  name?: string;
  description?: string;
  isDefault?: boolean;
  currency?: string;
}

interface PipelineForecast {
  pipelineId: string;
  pipelineName: string;
  period: { start: Date; end: Date };
  
  // Raw totals
  totalOpenValue: number;
  totalWeightedValue: number;
  openDealCount: number;
  
  // By stage
  stageBreakdown: Array<{
    stageId: string;
    stageName: string;
    dealCount: number;
    totalValue: number;
    weightedValue: number;
    avgDaysInStage: number;
  }>;
  
  // Forecast categories
  commit: number;                    // Deals with >75% probability
  bestCase: number;                  // Deals with >50% probability
  pipeline: number;                  // All open deals
  
  // Historical accuracy
  forecastAccuracy: number | null;   // % accuracy of previous period forecast
  historicalConversionRate: number;  // Actual win rate over time
}

interface WeightedPipelineValue {
  pipelineId: string;
  totalRawValue: number;
  totalWeightedValue: number;
  byStage: Array<{
    stageId: string;
    stageName: string;
    rawValue: number;
    weightedValue: number;
    dealCount: number;
  }>;
  currency: string;
  calculatedAt: Date;
}
```

### Activity

```typescript
interface Activity {
  id: string;
  ventureId: string;
  
  // Type
  type: ActivityType;
  subType: string | null;            // E.g., "outbound" for call type
  
  // Content
  subject: string;
  body: string | null;               // Meeting notes, email body, etc.
  
  // Timing
  occurredAt: Date;                  // When the activity happened
  durationMinutes: number | null;    // For calls, meetings
  
  // Associations (polymorphic)
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
  leadId: string | null;
  
  // Participants
  participants: ActivityParticipant[];
  
  // Reminder
  reminderAt: Date | null;
  reminderCompleted: boolean;
  
  // Task-specific (when type = 'task')
  taskDueDate: Date | null;
  taskCompleted: boolean;
  taskCompletedAt: Date | null;
  taskPriority: 'low' | 'medium' | 'high' | null;
  taskAssigneeId: string | null;
  
  // Auto-logging metadata
  isAutoLogged: boolean;
  autoLogSource: string | null;      // 'email_tracking', 'calendar_sync', etc.
  externalId: string | null;         // ID in the source system
  
  // Custom fields
  customFields: Record<string, CustomFieldValue>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'task'
  | 'sms'
  | 'chat'
  | 'document'
  | 'custom';

interface ActivityParticipant {
  type: 'contact' | 'user' | 'external';
  id: string | null;                 // Contact or user ID
  name: string;
  email: string | null;
  role: 'organizer' | 'attendee' | 'optional' | null;
}

interface ActivityCreateInput {
  type: ActivityType;
  subType?: string;
  subject: string;
  body?: string;
  occurredAt?: Date;                 // Defaults to now
  durationMinutes?: number;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  leadId?: string;
  participants?: ActivityParticipant[];
  reminderAt?: Date;
  taskDueDate?: Date;
  taskPriority?: 'low' | 'medium' | 'high';
  taskAssigneeId?: string;
  customFields?: Record<string, unknown>;
}

interface ActivityUpdateInput {
  subject?: string;
  body?: string;
  occurredAt?: Date;
  durationMinutes?: number;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  reminderAt?: Date | null;
  taskDueDate?: Date | null;
  taskCompleted?: boolean;
  taskPriority?: 'low' | 'medium' | 'high' | null;
  taskAssigneeId?: string | null;
  customFields?: Record<string, unknown>;
}

interface ActivityFilter {
  search?: string;
  type?: ActivityType | ActivityType[];
  contactId?: string;
  companyId?: string;
  dealId?: string;
  leadId?: string;
  userId?: string;                   // Created by
  occurredAfter?: Date;
  occurredBefore?: Date;
  isAutoLogged?: boolean;
  isTask?: boolean;
  taskCompleted?: boolean;
  taskOverdue?: boolean;
  taskAssigneeId?: string;
  taskPriority?: ('low' | 'medium' | 'high')[];
  hasReminder?: boolean;
  customFieldFilters?: CustomFieldFilter[];
  sortBy?: ActivitySortField;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

type ActivitySortField =
  | 'occurredAt'
  | 'type'
  | 'subject'
  | 'taskDueDate'
  | 'createdAt';

interface ActivityReminder {
  id: string;
  activityId: string;
  userId: string;
  reminderAt: Date;
  completed: boolean;
  notifiedAt: Date | null;
  createdAt: Date;
}
```

### Lead

```typescript
interface Lead {
  id: string;
  ventureId: string;
  
  // Identity
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  companyName: string | null;
  
  // Source
  source: LeadSource;
  sourceDetail: string | null;       // Campaign name, form name, etc.
  referrerUrl: string | null;
  landingPageUrl: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  
  // Scoring
  score: number;                     // 0–100
  scoreSource: 'manual' | 'marketing' | 'behavioral' | 'composite';
  qualificationStatus: LeadQualificationStatus;
  
  // Assignment
  ownerId: string | null;
  assignedAt: Date | null;
  assignmentMethod: 'manual' | 'round_robin' | 'territory' | 'score_based' | null;
  
  // Status
  status: LeadStatus;
  statusChangedAt: Date;
  
  // Conversion
  convertedAt: Date | null;
  convertedContactId: string | null;
  convertedCompanyId: string | null;
  convertedDealId: string | null;
  convertedBy: string | null;
  
  // Custom fields
  customFields: Record<string, CustomFieldValue>;
  
  // Tags
  tags: string[];
  
  // Metadata
  lastActivityAt: Date | null;
  firstTouchAt: Date;
  lastTouchAt: Date;
  touchCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'unqualified'
  | 'nurturing'
  | 'converted'
  | 'lost';

type LeadQualificationStatus =
  | 'unscored'
  | 'cold'
  | 'warm'
  | 'hot'
  | 'marketing_qualified'
  | 'sales_qualified'
  | 'sales_accepted';

type LeadSource =
  | 'website_form'
  | 'landing_page'
  | 'chat_widget'
  | 'email_campaign'
  | 'social_media'
  | 'referral'
  | 'paid_ad'
  | 'organic_search'
  | 'event'
  | 'cold_outreach'
  | 'api'
  | 'import'
  | 'manual'
  | 'other';

interface LeadCreateInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  companyName?: string;
  source: LeadSource;
  sourceDetail?: string;
  referrerUrl?: string;
  landingPageUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  score?: number;
  ownerId?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

interface LeadUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  companyName?: string;
  status?: LeadStatus;
  qualificationStatus?: LeadQualificationStatus;
  score?: number;
  ownerId?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

interface LeadFilter {
  search?: string;
  status?: LeadStatus | LeadStatus[];
  qualificationStatus?: LeadQualificationStatus | LeadQualificationStatus[];
  source?: LeadSource | LeadSource[];
  ownerId?: string;
  unassigned?: boolean;
  scoreMin?: number;
  scoreMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  lastActivityAfter?: Date;
  lastActivityBefore?: Date;
  tags?: string[];
  tagsMode?: 'any' | 'all';
  isConverted?: boolean;
  customFieldFilters?: CustomFieldFilter[];
  sortBy?: LeadSortField;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

type LeadSortField =
  | 'firstName'
  | 'lastName'
  | 'score'
  | 'status'
  | 'source'
  | 'createdAt'
  | 'lastActivityAt';

interface LeadAssignmentRule {
  id: string;
  ventureId: string;
  name: string;
  isActive: boolean;
  priority: number;                  // Lower = higher priority
  method: 'round_robin' | 'territory' | 'score_based' | 'load_balanced';
  
  // Conditions for this rule to apply
  conditions: LeadAssignmentCondition[];
  
  // Target users
  assignees: string[];               // User IDs in the rotation
  currentIndex: number;              // For round-robin tracking
  
  // Limits
  maxLeadsPerAssignee: number | null;
  
  createdAt: Date;
  updatedAt: Date;
}

interface LeadAssignmentCondition {
  field: string;                     // 'source', 'score', 'companyName', custom field
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: unknown;
}

interface LeadConversionResult {
  leadId: string;
  contact: Contact;
  company: Company | null;
  deal: Deal | null;
  activities: Activity[];            // Activities moved from lead to contact
}
```

### CustomField

```typescript
interface CustomFieldDefinition {
  id: string;
  ventureId: string;
  
  // Identity
  name: string;
  label: string;                     // Display label
  description: string | null;
  
  // Type
  fieldType: CustomFieldType;
  
  // Applicability
  entityType: 'contact' | 'company' | 'deal' | 'lead' | 'activity';
  
  // Options (for enum / multi-select)
  options: CustomFieldOption[] | null;
  
  // Validation
  isRequired: boolean;
  validation: FieldValidationRule | null;
  
  // Default
  defaultValue: unknown | null;
  
  // Display
  position: number;                  // Ordering in forms
  groupName: string | null;          // Field grouping
  isVisibleInList: boolean;          // Show in list/table views
  isVisibleInForm: boolean;          // Show in create/edit forms
  isSearchable: boolean;             // Include in full-text search
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'enum'            // Single select from options
  | 'multi_select'    // Multiple select from options
  | 'user'            // Reference to a user ID
  | 'contact'         // Reference to a contact ID
  | 'company'         // Reference to a company ID
  | 'url'
  | 'email'
  | 'phone';

interface CustomFieldOption {
  value: string;
  label: string;
  color: string | null;              // Hex color for UI badges
  position: number;
  isDefault: boolean;
  isArchived: boolean;
}

type CustomFieldValue =
  | string
  | number
  | boolean
  | Date
  | string[]          // For multi_select
  | null;

interface CustomFieldCreateInput {
  name: string;
  label: string;
  description?: string;
  fieldType: CustomFieldType;
  entityType: 'contact' | 'company' | 'deal' | 'lead' | 'activity';
  options?: Array<{
    value: string;
    label: string;
    color?: string;
  }>;
  isRequired?: boolean;
  validation?: FieldValidationRule;
  defaultValue?: unknown;
  position?: number;
  groupName?: string;
  isVisibleInList?: boolean;
  isVisibleInForm?: boolean;
  isSearchable?: boolean;
}

interface FieldValidationRule {
  // Text
  minLength?: number;
  maxLength?: number;
  pattern?: string;                  // Regex
  
  // Number
  min?: number;
  max?: number;
  decimalPlaces?: number;
  
  // Date
  minDate?: string;                  // ISO date string
  maxDate?: string;
  
  // Currency
  currencyCode?: string;             // ISO 4217
  
  // General
  customMessage?: string;            // Error message override
}

interface CustomFieldFilter {
  fieldId: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in' | 'is_set' | 'is_not_set';
  value: unknown;
}
```

### CRMView

```typescript
interface CRMView {
  id: string;
  ventureId: string;
  
  // Identity
  name: string;
  description: string | null;
  
  // Scope
  entityType: 'contacts' | 'companies' | 'deals' | 'leads' | 'activities';
  viewType: ViewType;
  
  // Configuration
  columns: ViewColumn[];
  filters: ViewFilter[];
  sorts: ViewSort[];
  groupBy: string | null;            // Field to group by (for kanban/grouped list)
  
  // Kanban-specific (deals)
  kanbanConfig: KanbanConfig | null;
  
  // Sharing
  visibility: 'private' | 'team' | 'venture';
  ownerId: string;
  
  // Pinning
  isPinned: boolean;
  pinnedPosition: number | null;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

type ViewType = 'table' | 'list' | 'kanban' | 'calendar';

interface ViewColumn {
  fieldId: string;                   // Built-in field name or custom field ID
  label: string;
  width: number | null;              // Pixel width, null = auto
  isVisible: boolean;
  position: number;
  format: string | null;             // Date format, number format, etc.
}

interface ViewFilter {
  fieldId: string;
  operator: string;
  value: unknown;
  logicalOperator: 'and' | 'or';    // How this combines with previous filter
}

interface ViewSort {
  fieldId: string;
  direction: 'asc' | 'desc';
  position: number;                  // Multi-sort priority
}

interface KanbanConfig {
  groupField: string;                // Usually 'stageId' for deals
  cardFields: string[];              // Fields to show on kanban cards
  showValues: boolean;               // Show deal value on cards
  showOwner: boolean;                // Show avatar of owner
  collapsedGroups: string[];         // Groups that are collapsed by default
}

interface CRMViewCreateInput {
  name: string;
  description?: string;
  entityType: 'contacts' | 'companies' | 'deals' | 'leads' | 'activities';
  viewType: ViewType;
  columns?: ViewColumn[];
  filters?: ViewFilter[];
  sorts?: ViewSort[];
  groupBy?: string;
  kanbanConfig?: KanbanConfig;
  visibility?: 'private' | 'team' | 'venture';
  isPinned?: boolean;
}

interface CRMViewUpdateInput {
  name?: string;
  description?: string;
  columns?: ViewColumn[];
  filters?: ViewFilter[];
  sorts?: ViewSort[];
  groupBy?: string | null;
  kanbanConfig?: KanbanConfig | null;
  visibility?: 'private' | 'team' | 'venture';
  isPinned?: boolean;
  pinnedPosition?: number;
}

interface BulkAction {
  entityType: 'contacts' | 'companies' | 'deals' | 'leads';
  entityIds: string[];
  action: BulkActionType;
  params: Record<string, unknown>;
}

type BulkActionType =
  | 'update_field'
  | 'add_tags'
  | 'remove_tags'
  | 'assign_owner'
  | 'change_stage'          // Deals only
  | 'change_status'         // Leads only
  | 'change_lifecycle'      // Contacts only
  | 'archive'
  | 'unarchive'
  | 'delete'
  | 'export'
  | 'merge';                // Contacts only, requires exactly 2

interface BulkActionResult {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: Array<{
    entityId: string;
    message: string;
  }>;
  executedAt: Date;
  executedBy: string;
}
```

### WorkflowAutomation

```typescript
interface WorkflowAutomation {
  id: string;
  ventureId: string;
  
  // Identity
  name: string;
  description: string | null;
  isActive: boolean;
  
  // Trigger
  trigger: WorkflowTrigger;
  
  // Conditions (all must be true)
  conditions: WorkflowCondition[];
  
  // Actions (executed in order)
  actions: WorkflowAction[];
  
  // Limits
  maxExecutionsPerHour: number | null;
  maxExecutionsPerDay: number | null;
  cooldownMinutes: number | null;    // Min time between executions for same entity
  
  // Stats
  totalExecutions: number;
  lastExecutedAt: Date | null;
  lastErrorAt: Date | null;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface WorkflowTrigger {
  type: WorkflowTriggerType;
  entityType: 'contact' | 'company' | 'deal' | 'lead' | 'activity';
  
  // Specific trigger config
  config: Record<string, unknown>;
  
  /**
   * Examples:
   * - { type: 'entity_created', entityType: 'deal' }
   * - { type: 'field_changed', entityType: 'deal', config: { field: 'stageId' } }
   * - { type: 'field_changed', entityType: 'deal', config: { field: 'stageId', fromValue: 'stage1', toValue: 'stage2' } }
   * - { type: 'score_reached', entityType: 'lead', config: { threshold: 80 } }
   * - { type: 'inactivity', entityType: 'deal', config: { days: 14 } }
   */
}

type WorkflowTriggerType =
  | 'entity_created'
  | 'entity_updated'
  | 'entity_deleted'
  | 'field_changed'
  | 'stage_changed'           // Deal-specific
  | 'status_changed'          // Lead-specific
  | 'score_reached'           // Lead/contact scoring threshold
  | 'score_dropped'           // Score fell below threshold
  | 'deal_won'
  | 'deal_lost'
  | 'inactivity'              // No activity for N days
  | 'date_reached'            // Expected close date, task due date, etc.
  | 'tag_added'
  | 'tag_removed';

interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'is_set' | 'is_not_set';
  value: unknown;
  logicalOperator: 'and' | 'or';
}

interface WorkflowAction {
  type: WorkflowActionType;
  config: Record<string, unknown>;
  delayMinutes: number;              // Delay before executing (0 = immediate)
  position: number;                  // Order of execution
  
  /**
   * Examples:
   * - { type: 'update_field', config: { entityType: 'deal', field: 'ownerId', value: 'user123' } }
   * - { type: 'create_activity', config: { type: 'task', subject: 'Follow up', assigneeId: '{{deal.ownerId}}' } }
   * - { type: 'send_notification', config: { userId: '{{deal.ownerId}}', message: 'Deal {{deal.title}} needs attention' } }
   * - { type: 'move_stage', config: { stageId: 'next' } }  // 'next' = auto-advance
   * - { type: 'assign_owner', config: { method: 'round_robin', pool: ['user1', 'user2', 'user3'] } }
   * - { type: 'webhook', config: { url: 'https://...', method: 'POST', headers: {}, bodyTemplate: '{}' } }
   */
}

type WorkflowActionType =
  | 'update_field'
  | 'create_activity'
  | 'create_deal'
  | 'move_stage'
  | 'assign_owner'
  | 'add_tag'
  | 'remove_tag'
  | 'send_notification'
  | 'send_email'
  | 'send_webhook'
  | 'convert_lead'
  | 'change_lifecycle'
  | 'delay'                   // Wait N minutes before next action
  | 'condition';              // If/else branching

interface WorkflowExecutionLog {
  id: string;
  automationId: string;
  ventureId: string;
  
  // Trigger info
  triggerEntityType: string;
  triggerEntityId: string;
  triggerEvent: string;
  
  // Execution
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt: Date | null;
  
  // Actions executed
  actionResults: Array<{
    actionType: string;
    status: 'success' | 'failed' | 'skipped';
    result: Record<string, unknown> | null;
    error: string | null;
    executedAt: Date;
  }>;
  
  // Error info
  errorMessage: string | null;
  errorStack: string | null;
}
```

### Reporting Types

```typescript
interface PipelineReport {
  pipelineId: string;
  pipelineName: string;
  period: { start: Date; end: Date };
  
  summary: {
    totalDeals: number;
    openDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalValue: number;
    wonValue: number;
    lostValue: number;
    weightedValue: number;
    avgDealSize: number;
    winRate: number;                 // % of closed deals that were won
    currency: string;
  };
  
  byStage: Array<{
    stageId: string;
    stageName: string;
    dealCount: number;
    totalValue: number;
    avgTimeInStage: number;          // Days
    conversionRate: number;          // % that move to next stage
  }>;
  
  trends: Array<{
    date: string;                    // YYYY-MM-DD
    newDeals: number;
    dealsWon: number;
    dealsLost: number;
    valueWon: number;
    valueLost: number;
  }>;
}

interface ConversionReport {
  period: { start: Date; end: Date };
  
  overall: {
    leadsCreated: number;
    leadsConverted: number;
    conversionRate: number;          // %
    avgTimeToConversion: number;     // Days
  };
  
  bySource: Array<{
    source: LeadSource;
    leadsCreated: number;
    leadsConverted: number;
    conversionRate: number;
    avgTimeToConversion: number;
  }>;
  
  byOwner: Array<{
    ownerId: string;
    ownerName: string;
    leadsAssigned: number;
    leadsConverted: number;
    conversionRate: number;
    avgTimeToConversion: number;
  }>;
  
  funnel: Array<{
    stage: string;
    count: number;
    dropoffRate: number;             // % that don't move to next stage
  }>;
}

interface SalesVelocityReport {
  period: { start: Date; end: Date };
  pipelineId: string;
  
  /**
   * Sales Velocity = (opportunities × avg_deal_value × win_rate) / avg_sales_cycle
   * Measures revenue generated per day
   */
  velocity: number;
  velocityCurrency: string;
  
  components: {
    opportunities: number;           // Number of deals in pipeline
    avgDealValue: number;
    winRate: number;                 // 0-1
    avgSalesCycleDays: number;       // Days from creation to close
  };
  
  trend: Array<{
    period: string;                  // YYYY-MM or YYYY-Wnn
    velocity: number;
    opportunities: number;
    avgDealValue: number;
    winRate: number;
    avgSalesCycleDays: number;
  }>;
}

interface ForecastReport {
  period: { start: Date; end: Date };
  pipelineId: string;
  
  categories: {
    closed: number;                  // Already won in period
    commit: number;                  // >75% probability
    bestCase: number;                // >50% probability
    pipeline: number;                // All open
    total: number;                   // closed + weighted open
  };
  
  byOwner: Array<{
    ownerId: string;
    ownerName: string;
    closed: number;
    commit: number;
    bestCase: number;
    pipeline: number;
    quota: number | null;
    attainment: number | null;       // % of quota
  }>;
  
  accuracy: {
    previousPeriodForecast: number;
    previousPeriodActual: number;
    accuracyPercent: number;
  } | null;
}

interface ActivityMetrics {
  period: { start: Date; end: Date };
  
  totals: {
    calls: number;
    emails: number;
    meetings: number;
    notes: number;
    tasks: number;
    tasksCompleted: number;
    totalActivities: number;
  };
  
  byUser: Array<{
    userId: string;
    userName: string;
    calls: number;
    emails: number;
    meetings: number;
    notes: number;
    tasks: number;
    tasksCompleted: number;
    totalActivities: number;
    avgActivitiesPerDay: number;
  }>;
  
  trends: Array<{
    date: string;
    calls: number;
    emails: number;
    meetings: number;
    total: number;
  }>;
}

interface RepPerformanceReport {
  period: { start: Date; end: Date };
  
  reps: Array<{
    userId: string;
    userName: string;
    
    // Deals
    dealsCreated: number;
    dealsWon: number;
    dealsLost: number;
    winRate: number;
    revenueWon: number;
    avgDealSize: number;
    avgSalesCycle: number;           // Days
    
    // Activities
    totalActivities: number;
    callsMade: number;
    emailsSent: number;
    meetingsHeld: number;
    tasksCompleted: number;
    
    // Pipeline
    openDeals: number;
    pipelineValue: number;
    weightedPipelineValue: number;
    
    // Efficiency
    activitiesToWin: number;         // Avg activities per won deal
    revenuePerActivity: number;
    
    // Quota
    quota: number | null;
    attainment: number | null;
  }>;
  
  teamSummary: {
    totalRevenueWon: number;
    avgWinRate: number;
    avgDealSize: number;
    avgSalesCycle: number;
    totalActivities: number;
    teamQuota: number | null;
    teamAttainment: number | null;
  };
}
```

---

## Database Schemas

### contacts

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const contacts = pgTable('crm_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Identity
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  jobTitle: varchar('job_title', { length: 255 }),
  avatarUrl: text('avatar_url'),
  
  // Associations
  primaryCompanyId: uuid('primary_company_id').references(() => companies.id, { onDelete: 'set null' }),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  
  // Scoring
  score: integer('score').notNull().default(0),
  scoreBreakdown: jsonb('score_breakdown'),
  
  // Lifecycle
  lifecycleStage: varchar('lifecycle_stage', { length: 50 }).notNull().default('lead'),
  source: varchar('source', { length: 100 }),
  sourceDetail: varchar('source_detail', { length: 255 }),
  
  // Custom fields
  customFields: jsonb('custom_fields').notNull().default({}),
  
  // Tags
  tags: jsonb('tags').notNull().default([]),
  
  // Communication preferences
  doNotEmail: boolean('do_not_email').notNull().default(false),
  doNotCall: boolean('do_not_call').notNull().default(false),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  
  // Activity tracking
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
}, (table) => ({
  ventureIdx: index('crm_contacts_venture_idx').on(table.ventureId),
  emailIdx: index('crm_contacts_email_idx').on(table.ventureId, table.email),
  ownerIdx: index('crm_contacts_owner_idx').on(table.ventureId, table.ownerId),
  lifecycleIdx: index('crm_contacts_lifecycle_idx').on(table.ventureId, table.lifecycleStage),
  scoreIdx: index('crm_contacts_score_idx').on(table.ventureId, table.score),
  lastActivityIdx: index('crm_contacts_last_activity_idx').on(table.ventureId, table.lastActivityAt),
  createdAtIdx: index('crm_contacts_created_at_idx').on(table.ventureId, table.createdAt),
  searchIdx: index('crm_contacts_search_idx').on(table.ventureId, table.firstName, table.lastName, table.email),
}));
```

### companies

```typescript
export const companies = pgTable('crm_companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Identity
  name: varchar('name', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 255 }),
  logoUrl: text('logo_url'),
  description: text('description'),
  
  // Classification
  industry: varchar('industry', { length: 255 }),
  industryCode: varchar('industry_code', { length: 20 }),
  companySize: varchar('company_size', { length: 50 }),
  annualRevenue: integer('annual_revenue'),
  annualRevenueCurrency: varchar('annual_revenue_currency', { length: 3 }).notNull().default('USD'),
  employeeCount: integer('employee_count'),
  
  // Hierarchy
  parentCompanyId: uuid('parent_company_id').references(() => companies.id, { onDelete: 'set null' }),
  
  // Location
  address: jsonb('address'),
  
  // Ownership
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  
  // Social & web
  website: text('website'),
  linkedinUrl: text('linkedin_url'),
  twitterHandle: varchar('twitter_handle', { length: 255 }),
  
  // Custom fields
  customFields: jsonb('custom_fields').notNull().default({}),
  
  // Tags
  tags: jsonb('tags').notNull().default([]),
  
  // Denormalized counts
  contactCount: integer('contact_count').notNull().default(0),
  openDealCount: integer('open_deal_count').notNull().default(0),
  totalDealValue: integer('total_deal_value').notNull().default(0),
  
  // Metadata
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
}, (table) => ({
  ventureIdx: index('crm_companies_venture_idx').on(table.ventureId),
  domainIdx: uniqueIndex('crm_companies_domain_idx').on(table.ventureId, table.domain),
  nameIdx: index('crm_companies_name_idx').on(table.ventureId, table.name),
  industryIdx: index('crm_companies_industry_idx').on(table.ventureId, table.industry),
  ownerIdx: index('crm_companies_owner_idx').on(table.ventureId, table.ownerId),
  parentIdx: index('crm_companies_parent_idx').on(table.ventureId, table.parentCompanyId),
  sizeIdx: index('crm_companies_size_idx').on(table.ventureId, table.companySize),
}));
```

### contact_companies (junction table)

```typescript
export const contactCompanies = pgTable('crm_contact_companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  isPrimary: boolean('is_primary').notNull().default(false),
  role: varchar('role', { length: 255 }),        // Their role at this company
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  contactCompanyIdx: uniqueIndex('crm_contact_companies_unique_idx').on(table.contactId, table.companyId),
  ventureIdx: index('crm_contact_companies_venture_idx').on(table.ventureId),
  contactIdx: index('crm_contact_companies_contact_idx').on(table.contactId),
  companyIdx: index('crm_contact_companies_company_idx').on(table.companyId),
}));
```

### pipelines

```typescript
export const pipelines = pgTable('crm_pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  
  // Denormalized
  openDealCount: integer('open_deal_count').notNull().default(0),
  totalValue: integer('total_value').notNull().default(0),
  weightedValue: integer('weighted_value').notNull().default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
}, (table) => ({
  ventureIdx: index('crm_pipelines_venture_idx').on(table.ventureId),
  defaultIdx: uniqueIndex('crm_pipelines_default_idx')
    .on(table.ventureId, table.isDefault)
    .where(sql`is_default = true`),
}));
```

### deal_stages

```typescript
export const dealStages = pgTable('crm_deal_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  position: integer('position').notNull(),
  winProbability: integer('win_probability').notNull().default(0),
  color: varchar('color', { length: 7 }).notNull().default('#6B7280'),
  description: text('description'),
  isClosedWon: boolean('is_closed_won').notNull().default(false),
  isClosedLost: boolean('is_closed_lost').notNull().default(false),
  rottingDays: integer('rotting_days'),
  automationTriggerId: uuid('automation_trigger_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pipelineIdx: index('crm_deal_stages_pipeline_idx').on(table.pipelineId),
  positionIdx: uniqueIndex('crm_deal_stages_position_idx').on(table.pipelineId, table.position),
  ventureIdx: index('crm_deal_stages_venture_idx').on(table.ventureId),
}));
```

### deals

```typescript
export const deals = pgTable('crm_deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id),
  
  // Core
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  
  // Value
  value: integer('value'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  
  // Stage
  stageId: uuid('stage_id').notNull().references(() => dealStages.id),
  stageEnteredAt: timestamp('stage_entered_at', { withTimezone: true }).notNull().defaultNow(),
  
  // Probability
  winProbability: integer('win_probability').notNull().default(0),
  weightedValue: integer('weighted_value'),
  
  // Dates
  expectedCloseDate: timestamp('expected_close_date', { withTimezone: true }),
  actualCloseDate: timestamp('actual_close_date', { withTimezone: true }),
  
  // Outcome
  status: varchar('status', { length: 20 }).notNull().default('open'),
  lostReason: varchar('lost_reason', { length: 255 }),
  lostReasonDetail: text('lost_reason_detail'),
  wonAt: timestamp('won_at', { withTimezone: true }),
  lostAt: timestamp('lost_at', { withTimezone: true }),
  
  // Associations
  primaryContactId: uuid('primary_contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  
  // Custom fields
  customFields: jsonb('custom_fields').notNull().default({}),
  
  // Tags
  tags: jsonb('tags').notNull().default([]),
  
  // Metadata
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
}, (table) => ({
  ventureIdx: index('crm_deals_venture_idx').on(table.ventureId),
  pipelineIdx: index('crm_deals_pipeline_idx').on(table.ventureId, table.pipelineId),
  stageIdx: index('crm_deals_stage_idx').on(table.ventureId, table.stageId),
  statusIdx: index('crm_deals_status_idx').on(table.ventureId, table.status),
  ownerIdx: index('crm_deals_owner_idx').on(table.ventureId, table.ownerId),
  companyIdx: index('crm_deals_company_idx').on(table.ventureId, table.companyId),
  contactIdx: index('crm_deals_contact_idx').on(table.ventureId, table.primaryContactId),
  valueIdx: index('crm_deals_value_idx').on(table.ventureId, table.value),
  closeDateIdx: index('crm_deals_close_date_idx').on(table.ventureId, table.expectedCloseDate),
  lastActivityIdx: index('crm_deals_last_activity_idx').on(table.ventureId, table.lastActivityAt),
}));
```

### activities

```typescript
export const activities = pgTable('crm_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Type
  type: varchar('type', { length: 50 }).notNull(),
  subType: varchar('sub_type', { length: 50 }),
  
  // Content
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body'),
  
  // Timing
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  durationMinutes: integer('duration_minutes'),
  
  // Associations (polymorphic)
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'set null' }),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  
  // Participants
  participants: jsonb('participants').notNull().default([]),
  
  // Reminder
  reminderAt: timestamp('reminder_at', { withTimezone: true }),
  reminderCompleted: boolean('reminder_completed').notNull().default(false),
  
  // Task-specific
  taskDueDate: timestamp('task_due_date', { withTimezone: true }),
  taskCompleted: boolean('task_completed').notNull().default(false),
  taskCompletedAt: timestamp('task_completed_at', { withTimezone: true }),
  taskPriority: varchar('task_priority', { length: 10 }),
  taskAssigneeId: uuid('task_assignee_id').references(() => users.id, { onDelete: 'set null' }),
  
  // Auto-logging
  isAutoLogged: boolean('is_auto_logged').notNull().default(false),
  autoLogSource: varchar('auto_log_source', { length: 100 }),
  externalId: varchar('external_id', { length: 255 }),
  
  // Custom fields
  customFields: jsonb('custom_fields').notNull().default({}),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
}, (table) => ({
  ventureIdx: index('crm_activities_venture_idx').on(table.ventureId),
  typeIdx: index('crm_activities_type_idx').on(table.ventureId, table.type),
  contactIdx: index('crm_activities_contact_idx').on(table.ventureId, table.contactId),
  companyIdx: index('crm_activities_company_idx').on(table.ventureId, table.companyId),
  dealIdx: index('crm_activities_deal_idx').on(table.ventureId, table.dealId),
  leadIdx: index('crm_activities_lead_idx').on(table.ventureId, table.leadId),
  occurredAtIdx: index('crm_activities_occurred_at_idx').on(table.ventureId, table.occurredAt),
  taskDueDateIdx: index('crm_activities_task_due_idx').on(table.ventureId, table.taskDueDate)
    .where(sql`type = 'task'`),
  taskAssigneeIdx: index('crm_activities_task_assignee_idx').on(table.ventureId, table.taskAssigneeId)
    .where(sql`type = 'task'`),
  autoLogIdx: index('crm_activities_auto_log_idx').on(table.ventureId, table.autoLogSource, table.externalId)
    .where(sql`is_auto_logged = true`),
}));
```

### leads

```typescript
export const leads = pgTable('crm_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Identity
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  jobTitle: varchar('job_title', { length: 255 }),
  companyName: varchar('company_name', { length: 255 }),
  
  // Source
  source: varchar('source', { length: 50 }).notNull(),
  sourceDetail: varchar('source_detail', { length: 255 }),
  referrerUrl: text('referrer_url'),
  landingPageUrl: text('landing_page_url'),
  utmSource: varchar('utm_source', { length: 255 }),
  utmMedium: varchar('utm_medium', { length: 255 }),
  utmCampaign: varchar('utm_campaign', { length: 255 }),
  utmTerm: varchar('utm_term', { length: 255 }),
  utmContent: varchar('utm_content', { length: 255 }),
  
  // Scoring
  score: integer('score').notNull().default(0),
  scoreSource: varchar('score_source', { length: 50 }).notNull().default('manual'),
  qualificationStatus: varchar('qualification_status', { length: 50 }).notNull().default('unscored'),
  
  // Assignment
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  assignmentMethod: varchar('assignment_method', { length: 50 }),
  
  // Status
  status: varchar('status', { length: 50 }).notNull().default('new'),
  statusChangedAt: timestamp('status_changed_at', { withTimezone: true }).notNull().defaultNow(),
  
  // Conversion
  convertedAt: timestamp('converted_at', { withTimezone: true }),
  convertedContactId: uuid('converted_contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  convertedCompanyId: uuid('converted_company_id').references(() => companies.id, { onDelete: 'set null' }),
  convertedDealId: uuid('converted_deal_id').references(() => deals.id, { onDelete: 'set null' }),
  convertedBy: uuid('converted_by').references(() => users.id, { onDelete: 'set null' }),
  
  // Custom fields
  customFields: jsonb('custom_fields').notNull().default({}),
  
  // Tags
  tags: jsonb('tags').notNull().default([]),
  
  // Activity tracking
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  firstTouchAt: timestamp('first_touch_at', { withTimezone: true }).notNull().defaultNow(),
  lastTouchAt: timestamp('last_touch_at', { withTimezone: true }).notNull().defaultNow(),
  touchCount: integer('touch_count').notNull().default(1),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
}, (table) => ({
  ventureIdx: index('crm_leads_venture_idx').on(table.ventureId),
  emailIdx: index('crm_leads_email_idx').on(table.ventureId, table.email),
  statusIdx: index('crm_leads_status_idx').on(table.ventureId, table.status),
  scoreIdx: index('crm_leads_score_idx').on(table.ventureId, table.score),
  sourceIdx: index('crm_leads_source_idx').on(table.ventureId, table.source),
  ownerIdx: index('crm_leads_owner_idx').on(table.ventureId, table.ownerId),
  qualificationIdx: index('crm_leads_qualification_idx').on(table.ventureId, table.qualificationStatus),
  createdAtIdx: index('crm_leads_created_at_idx').on(table.ventureId, table.createdAt),
  convertedIdx: index('crm_leads_converted_idx').on(table.ventureId, table.convertedAt)
    .where(sql`converted_at IS NOT NULL`),
}));
```

### custom_field_definitions

```typescript
export const customFieldDefinitions = pgTable('crm_custom_field_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 100 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  description: text('description'),
  
  fieldType: varchar('field_type', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  
  options: jsonb('options'),
  
  isRequired: boolean('is_required').notNull().default(false),
  validation: jsonb('validation'),
  defaultValue: jsonb('default_value'),
  
  position: integer('position').notNull().default(0),
  groupName: varchar('group_name', { length: 255 }),
  isVisibleInList: boolean('is_visible_in_list').notNull().default(false),
  isVisibleInForm: boolean('is_visible_in_form').notNull().default(true),
  isSearchable: boolean('is_searchable').notNull().default(false),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
}, (table) => ({
  ventureEntityIdx: index('crm_custom_fields_venture_entity_idx').on(table.ventureId, table.entityType),
  nameIdx: uniqueIndex('crm_custom_fields_name_idx').on(table.ventureId, table.entityType, table.name),
}));
```

### custom_field_values

```typescript
export const customFieldValues = pgTable('crm_custom_field_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  fieldDefinitionId: uuid('field_definition_id').notNull().references(() => customFieldDefinitions.id, { onDelete: 'cascade' }),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  value: jsonb('value'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  entityIdx: uniqueIndex('crm_custom_field_values_entity_idx').on(table.fieldDefinitionId, table.entityId),
  ventureIdx: index('crm_custom_field_values_venture_idx').on(table.ventureId),
  entityTypeIdx: index('crm_custom_field_values_entity_type_idx').on(table.ventureId, table.entityType, table.entityId),
}));
```

### crm_views

```typescript
export const crmViews = pgTable('crm_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  viewType: varchar('view_type', { length: 20 }).notNull().default('table'),
  
  columns: jsonb('columns').notNull().default([]),
  filters: jsonb('filters').notNull().default([]),
  sorts: jsonb('sorts').notNull().default([]),
  groupBy: varchar('group_by', { length: 255 }),
  kanbanConfig: jsonb('kanban_config'),
  
  visibility: varchar('visibility', { length: 20 }).notNull().default('private'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  
  isPinned: boolean('is_pinned').notNull().default(false),
  pinnedPosition: integer('pinned_position'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('crm_views_venture_idx').on(table.ventureId),
  ownerIdx: index('crm_views_owner_idx').on(table.ventureId, table.ownerId),
  entityTypeIdx: index('crm_views_entity_type_idx').on(table.ventureId, table.entityType),
}));
```

### workflow_automations

```typescript
export const workflowAutomations = pgTable('crm_workflow_automations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  
  trigger: jsonb('trigger').notNull(),
  conditions: jsonb('conditions').notNull().default([]),
  actions: jsonb('actions').notNull(),
  
  maxExecutionsPerHour: integer('max_executions_per_hour'),
  maxExecutionsPerDay: integer('max_executions_per_day'),
  cooldownMinutes: integer('cooldown_minutes'),
  
  totalExecutions: integer('total_executions').notNull().default(0),
  lastExecutedAt: timestamp('last_executed_at', { withTimezone: true }),
  lastErrorAt: timestamp('last_error_at', { withTimezone: true }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
}, (table) => ({
  ventureIdx: index('crm_automations_venture_idx').on(table.ventureId),
  activeIdx: index('crm_automations_active_idx').on(table.ventureId, table.isActive),
}));

export const workflowExecutionLogs = pgTable('crm_workflow_execution_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  automationId: uuid('automation_id').notNull().references(() => workflowAutomations.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  triggerEntityType: varchar('trigger_entity_type', { length: 50 }).notNull(),
  triggerEntityId: uuid('trigger_entity_id').notNull(),
  triggerEvent: varchar('trigger_event', { length: 100 }).notNull(),
  
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  
  actionResults: jsonb('action_results').notNull().default([]),
  
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
}, (table) => ({
  automationIdx: index('crm_execution_logs_automation_idx').on(table.automationId),
  ventureIdx: index('crm_execution_logs_venture_idx').on(table.ventureId),
  statusIdx: index('crm_execution_logs_status_idx').on(table.ventureId, table.status),
  startedAtIdx: index('crm_execution_logs_started_at_idx').on(table.ventureId, table.startedAt),
}));
```

---

## Code Examples

### Example 1: Initialize CRM and Create a Pipeline

```typescript
import { CRMService } from '@mcv/nexus/crm';

const crm = new CRMService({ db, eventBus, ventureId });

// Initialize CRM for a new venture (creates default pipeline)
await crm.initialize(ventureId);

// Create a custom pipeline for enterprise sales
const pipeline = await crm.pipelines.create({
  name: 'Enterprise Sales',
  description: 'For deals over $50K with extended sales cycles',
  currency: 'USD',
  stages: [
    { name: 'Discovery',        position: 0, winProbability: 10, color: '#6B7280' },
    { name: 'Qualification',    position: 1, winProbability: 20, color: '#3B82F6' },
    { name: 'Demo/Evaluation',  position: 2, winProbability: 40, color: '#8B5CF6' },
    { name: 'Proposal',         position: 3, winProbability: 60, color: '#F59E0B' },
    { name: 'Negotiation',      position: 4, winProbability: 80, color: '#EF4444' },
    { name: 'Closed Won',       position: 5, winProbability: 100, color: '#10B981', isClosedWon: true },
    { name: 'Closed Lost',      position: 6, winProbability: 0,   color: '#6B7280', isClosedLost: true },
  ],
});

console.log(`Pipeline "${pipeline.name}" created with ${pipeline.stages.length} stages`);
// Pipeline "Enterprise Sales" created with 7 stages
```

### Example 2: Contact CRUD and Custom Fields

```typescript
import { ContactService, CustomFieldService } from '@mcv/nexus/crm';

const contacts = new ContactService({ db, eventBus, ventureId });
const customFields = new CustomFieldService({ db, ventureId });

// First, define a custom field for contacts
await customFields.create({
  name: 'preferred_language',
  label: 'Preferred Language',
  fieldType: 'enum',
  entityType: 'contact',
  options: [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'French' },
    { value: 'es', label: 'Spanish' },
    { value: 'de', label: 'German' },
  ],
  isRequired: false,
  isVisibleInList: true,
});

// Create a contact with custom fields
const contact = await contacts.create({
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'sarah.chen@acmecorp.com',
  phone: '+1-555-0123',
  jobTitle: 'VP of Engineering',
  lifecycleStage: 'sales_qualified',
  source: 'referral',
  sourceDetail: 'Referred by John Doe',
  tags: ['enterprise', 'technical-buyer'],
  customFields: {
    preferred_language: 'en',
  },
});

// Update the contact
const updated = await contacts.update(contact.id, {
  jobTitle: 'CTO',
  tags: ['enterprise', 'technical-buyer', 'decision-maker'],
});

// List contacts with filters
const sqlContacts = await contacts.list({
  lifecycleStage: ['sales_qualified', 'opportunity'],
  tags: ['enterprise'],
  tagsMode: 'any',
  scoreMin: 50,
  sortBy: 'score',
  sortOrder: 'desc',
  limit: 25,
});

console.log(`Found ${sqlContacts.totalCount} contacts`);

// Get contact timeline
const timeline = await contacts.getTimeline(contact.id, {
  limit: 20,
});

for (const entry of timeline) {
  console.log(`${entry.timestamp}: [${entry.type}] ${entry.summary}`);
}
```

### Example 3: Deal Pipeline Management

```typescript
import { DealService, PipelineService } from '@mcv/nexus/crm';

const deals = new DealService({ db, eventBus, ventureId });
const pipelines = new PipelineService({ db, ventureId });

// Get the default pipeline
const defaultPipeline = await pipelines.getDefault();
const stages = defaultPipeline.stages;

// Create a deal
const deal = await deals.create({
  title: 'Acme Corp - Platform License',
  pipelineId: defaultPipeline.id,
  stageId: stages.find(s => s.name === 'Discovery')!.id,
  value: 75000,
  currency: 'USD',
  expectedCloseDate: new Date('2026-06-30'),
  primaryContactId: contact.id,
  companyId: acmeCompany.id,
  ownerId: salesRepUserId,
  customFields: {
    deal_source: 'inbound',
    competitor: 'SalesForce',
  },
});

// Move deal to the next stage
const proposalStage = stages.find(s => s.name === 'Proposal')!;
await deals.update(deal.id, {
  stageId: proposalStage.id,
  winProbability: 65,  // Override default stage probability
});
// This emits: crm.deals.stage-changed event
// Which may trigger workflow automations

// Mark deal as won
await deals.win(deal.id, {
  actualCloseDate: new Date(),
  value: 82000,  // Final negotiated value
  notes: 'Closed with 3-year commitment at $82K/year',
});
// This emits: crm.deals.won event

// Get weighted pipeline value
const weighted = await pipelines.getWeightedValue(defaultPipeline.id);
console.log(`Pipeline: ${weighted.totalRawValue} raw, ${weighted.totalWeightedValue} weighted`);

for (const stage of weighted.byStage) {
  console.log(`  ${stage.stageName}: ${stage.dealCount} deals, $${stage.weightedValue} weighted`);
}

// Get pipeline forecast
const forecast = await pipelines.getForecast(defaultPipeline.id, {
  start: new Date('2026-04-01'),
  end: new Date('2026-06-30'),
});

console.log(`Q2 Forecast:`);
console.log(`  Commit:    $${forecast.commit}`);
console.log(`  Best Case: $${forecast.bestCase}`);
console.log(`  Pipeline:  $${forecast.pipeline}`);
```

### Example 4: Activity Logging and Reminders

```typescript
import { ActivityService } from '@mcv/nexus/crm';

const activities = new ActivityService({ db, eventBus, ventureId });

// Log a call
const call = await activities.log({
  type: 'call',
  subType: 'outbound',
  subject: 'Discovery call with Sarah Chen',
  body: `
    Discussed current pain points:
    - Manual data entry taking 4 hours/day
    - No visibility into pipeline metrics
    - Team of 12 sales reps growing to 20
    
    Next steps:
    - Schedule product demo for next Tuesday
    - Send case study from similar company
    
    Budget: $50-80K range, decision by end of Q2
  `,
  occurredAt: new Date(),
  durationMinutes: 35,
  contactId: contact.id,
  companyId: acmeCompany.id,
  dealId: deal.id,
  participants: [
    { type: 'contact', id: contact.id, name: 'Sarah Chen', email: 'sarah@acme.com', role: 'attendee' },
    { type: 'user', id: currentUserId, name: 'Alex Rivera', email: null, role: 'organizer' },
  ],
});

// Create a follow-up task
const task = await activities.log({
  type: 'task',
  subject: 'Send Acme Corp case study',
  body: 'Sarah requested the FinTech case study showing 60% time savings',
  contactId: contact.id,
  dealId: deal.id,
  taskDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  taskPriority: 'high',
  taskAssigneeId: currentUserId,
  reminderAt: new Date(Date.now() + 20 * 60 * 60 * 1000),  // Reminder 4h before due
});

// Complete a task
await activities.completeTask(task.id);

// List overdue tasks for a user
const overdueTasks = await activities.list({
  type: ['task'],
  taskAssigneeId: currentUserId,
  taskCompleted: false,
  taskOverdue: true,
  sortBy: 'taskDueDate',
  sortOrder: 'asc',
});

console.log(`You have ${overdueTasks.totalCount} overdue tasks`);
```

### Example 5: Lead Capture, Scoring, and Conversion

```typescript
import { LeadService, LeadAssignmentService, LeadConversionService } from '@mcv/nexus/crm';

const leads = new LeadService({ db, eventBus, ventureId });
const assignment = new LeadAssignmentService({ db, ventureId });
const conversion = new LeadConversionService({ db, eventBus, ventureId });

// Capture a lead from a website form
const lead = await leads.create({
  firstName: 'Michael',
  lastName: 'Torres',
  email: 'michael.torres@startup.io',
  phone: '+1-555-0456',
  jobTitle: 'Head of Sales',
  companyName: 'Startup.io',
  source: 'website_form',
  sourceDetail: 'pricing-page-form',
  utmSource: 'google',
  utmMedium: 'cpc',
  utmCampaign: 'crm-comparison-q2',
  tags: ['pricing-page', 'google-ads'],
});
// Emits: crm.leads.captured

// Update lead score (or receive from @mcv/growth/marketing)
await leads.updateScore(lead.id, {
  score: 78,
  scoreSource: 'composite',
  qualificationStatus: 'marketing_qualified',
});
// Emits: crm.leads.scored

// Auto-assign via round-robin rule
await assignment.autoAssign(lead.id);
// Checks assignment rules, picks next rep in rotation
// Emits: crm.leads.assigned

// Convert lead to contact + company + deal
const conversionResult = await conversion.convert(lead.id, {
  createCompany: true,
  companyOverrides: {
    industry: 'Technology',
    companySize: 'small',
    employeeCount: 45,
  },
  createDeal: true,
  dealOverrides: {
    title: 'Startup.io - CRM License',
    pipelineId: defaultPipeline.id,
    stageId: qualifiedStageId,
    value: 24000,
    expectedCloseDate: new Date('2026-05-15'),
  },
  preserveActivities: true,  // Move all lead activities to the new contact
});

console.log(`Lead converted:`);
console.log(`  Contact: ${conversionResult.contact.id}`);
console.log(`  Company: ${conversionResult.company?.id}`);
console.log(`  Deal:    ${conversionResult.deal?.id}`);
console.log(`  Activities moved: ${conversionResult.activities.length}`);
// Emits: crm.leads.converted
```

### Example 6: Workflow Automation Setup

```typescript
import { WorkflowAutomationService } from '@mcv/nexus/crm';

const automations = new WorkflowAutomationService({ db, eventBus, ventureId });

// Automation 1: Notify manager when deal enters negotiation
await automations.create({
  name: 'Manager Alert — High-Value Negotiation',
  description: 'Notifies sales manager when a deal >$50K enters negotiation stage',
  trigger: {
    type: 'stage_changed',
    entityType: 'deal',
    config: {
      toStageId: negotiationStageId,
    },
  },
  conditions: [
    {
      field: 'value',
      operator: 'gte',
      value: 50000,
      logicalOperator: 'and',
    },
  ],
  actions: [
    {
      type: 'send_notification',
      config: {
        userId: '{{venture.salesManagerId}}',
        message: 'Deal "{{deal.title}}" (${{deal.value}}) has entered Negotiation. Owner: {{deal.owner.name}}',
      },
      delayMinutes: 0,
      position: 0,
    },
    {
      type: 'create_activity',
      config: {
        type: 'task',
        subject: 'Review deal: {{deal.title}}',
        body: 'High-value deal in negotiation. Review terms and approve discount if needed.',
        taskAssigneeId: '{{venture.salesManagerId}}',
        taskDueDate: '+2d',   // 2 days from trigger
        taskPriority: 'high',
      },
      delayMinutes: 0,
      position: 1,
    },
  ],
  maxExecutionsPerDay: 50,
});

// Automation 2: Stale deal alert
await automations.create({
  name: 'Stale Deal Reminder',
  description: 'Nudges deal owner when no activity for 7 days',
  trigger: {
    type: 'inactivity',
    entityType: 'deal',
    config: {
      days: 7,
    },
  },
  conditions: [
    {
      field: 'status',
      operator: 'eq',
      value: 'open',
      logicalOperator: 'and',
    },
  ],
  actions: [
    {
      type: 'send_notification',
      config: {
        userId: '{{deal.ownerId}}',
        message: '⚠️ Deal "{{deal.title}}" has had no activity for 7 days. Time for a follow-up?',
      },
      delayMinutes: 0,
      position: 0,
    },
    {
      type: 'add_tag',
      config: {
        tag: 'stale',
      },
      delayMinutes: 0,
      position: 1,
    },
  ],
  cooldownMinutes: 7 * 24 * 60,  // Don't re-trigger for 7 more days
});

// Automation 3: Lead round-robin assignment
await automations.create({
  name: 'Auto-Assign New Leads',
  description: 'Assigns new website leads to sales team via round-robin',
  trigger: {
    type: 'entity_created',
    entityType: 'lead',
    config: {},
  },
  conditions: [
    {
      field: 'source',
      operator: 'in',
      value: ['website_form', 'landing_page', 'chat_widget'],
      logicalOperator: 'and',
    },
  ],
  actions: [
    {
      type: 'assign_owner',
      config: {
        method: 'round_robin',
        pool: [salesRep1Id, salesRep2Id, salesRep3Id],
      },
      delayMinutes: 0,
      position: 0,
    },
    {
      type: 'send_notification',
      config: {
        userId: '{{lead.ownerId}}',
        message: '🎯 New lead assigned: {{lead.firstName}} {{lead.lastName}} from {{lead.companyName}}',
      },
      delayMinutes: 0,
      position: 1,
    },
    {
      type: 'create_activity',
      config: {
        type: 'task',
        subject: 'Initial outreach: {{lead.firstName}} {{lead.lastName}}',
        body: 'New lead from {{lead.source}}. Reach out within 5 minutes for best conversion rate.',
        taskAssigneeId: '{{lead.ownerId}}',
        taskDueDate: '+1h',
        taskPriority: 'high',
      },
      delayMinutes: 0,
      position: 2,
    },
  ],
  maxExecutionsPerHour: 100,
});

// List active automations
const activeAutomations = await automations.list({ isActive: true });
console.log(`${activeAutomations.length} active automations`);

// Check execution logs
const logs = await automations.getExecutionLogs(automationId, {
  status: 'failed',
  limit: 10,
});
for (const log of logs) {
  console.log(`Failed: ${log.triggerEvent} on ${log.triggerEntityId}: ${log.errorMessage}`);
}
```

### Example 7: Views, Filters, and Bulk Actions

```typescript
import { CRMViewService, BulkActionService } from '@mcv/nexus/crm';

const views = new CRMViewService({ db, ventureId, userId: currentUserId });
const bulk = new BulkActionService({ db, eventBus, ventureId });

// Create a saved view for high-value open deals
const view = await views.create({
  name: 'High-Value Open Deals',
  description: 'Open deals worth $25K+ closing this quarter',
  entityType: 'deals',
  viewType: 'kanban',
  columns: [
    { fieldId: 'title', label: 'Deal', width: 200, isVisible: true, position: 0, format: null },
    { fieldId: 'value', label: 'Value', width: 120, isVisible: true, position: 1, format: 'currency' },
    { fieldId: 'ownerId', label: 'Owner', width: 150, isVisible: true, position: 2, format: null },
    { fieldId: 'expectedCloseDate', label: 'Close Date', width: 130, isVisible: true, position: 3, format: 'date' },
    { fieldId: 'companyId', label: 'Company', width: 180, isVisible: true, position: 4, format: null },
  ],
  filters: [
    { fieldId: 'status', operator: 'eq', value: 'open', logicalOperator: 'and' },
    { fieldId: 'value', operator: 'gte', value: 25000, logicalOperator: 'and' },
    { fieldId: 'expectedCloseDate', operator: 'gte', value: '2026-04-01', logicalOperator: 'and' },
    { fieldId: 'expectedCloseDate', operator: 'lte', value: '2026-06-30', logicalOperator: 'and' },
  ],
  sorts: [
    { fieldId: 'value', direction: 'desc', position: 0 },
  ],
  kanbanConfig: {
    groupField: 'stageId',
    cardFields: ['title', 'value', 'ownerId', 'expectedCloseDate'],
    showValues: true,
    showOwner: true,
    collapsedGroups: [],
  },
  visibility: 'team',
  isPinned: true,
});

// List all views for the current user
const myViews = await views.list({
  entityType: 'deals',
  includeTeamViews: true,
});

// Execute a bulk action: reassign deals to new owner
const result = await bulk.execute({
  entityType: 'deals',
  entityIds: [deal1.id, deal2.id, deal3.id],
  action: 'assign_owner',
  params: {
    ownerId: newSalesRepId,
  },
});

console.log(`Bulk assign: ${result.successCount} success, ${result.failureCount} failed`);

// Bulk add tags
const tagResult = await bulk.execute({
  entityType: 'contacts',
  entityIds: contactIds,
  action: 'add_tags',
  params: {
    tags: ['q2-campaign', 'priority'],
  },
});

// Bulk export contacts
const exportResult = await bulk.execute({
  entityType: 'contacts',
  entityIds: [], // Empty = use current view filters
  action: 'export',
  params: {
    format: 'csv',
    fields: ['firstName', 'lastName', 'email', 'phone', 'companyName', 'lifecycleStage'],
    viewId: view.id,  // Apply view filters
  },
});
```

### Example 8: Contact Import and Merge

```typescript
import { ContactImportService, ContactMergeService } from '@mcv/nexus/crm';

const importer = new ContactImportService({ db, eventBus, ventureId });
const merger = new ContactMergeService({ db, eventBus, ventureId });

// Start a CSV import
const importJob = await importer.start({
  fileName: 'hubspot-export-2026-02.csv',
  fileContent: csvBuffer,
  mapping: {
    columns: {
      'First Name': 'firstName',
      'Last Name': 'lastName',
      'Email Address': 'email',
      'Phone Number': 'phone',
      'Job Title': 'jobTitle',
      'Company': null,               // Skip this column
      'Lead Status': 'lifecycleStage',
    },
    defaultValues: {
      source: 'import',
      sourceDetail: 'hubspot-migration-2026',
    },
    deduplicateOn: 'email',
    onDuplicate: 'update',
    tags: ['hubspot-import'],
    lifecycleStage: 'lead',
  },
});

console.log(`Import started: ${importJob.id}, ${importJob.totalRows} rows`);

// Poll for completion
const completed = await importer.waitForCompletion(importJob.id, {
  pollIntervalMs: 2000,
  timeoutMs: 300000,
});

console.log(`Import complete:`);
console.log(`  Success: ${completed.successCount}`);
console.log(`  Errors:  ${completed.errorCount}`);
console.log(`  Skipped: ${completed.skipCount}`);

if (completed.errors.length > 0) {
  for (const error of completed.errors.slice(0, 5)) {
    console.log(`  Row ${error.row}: ${error.field} — ${error.message}`);
  }
}

// Find and merge duplicate contacts
const duplicates = await merger.findDuplicates({
  strategy: 'email',       // Match on email address
  threshold: 0.9,          // 90% confidence
  limit: 50,
});

console.log(`Found ${duplicates.length} potential duplicate pairs`);

for (const pair of duplicates) {
  console.log(`  ${pair.contact1.firstName} ${pair.contact1.lastName} ↔ ${pair.contact2.firstName} ${pair.contact2.lastName} (${pair.confidence}%)`);
}

// Merge two contacts (keep the first, merge data from the second)
const mergeResult = await merger.merge({
  survivingContactId: duplicates[0].contact1.id,
  mergedContactId: duplicates[0].contact2.id,
  fieldResolution: {
    email: 'surviving',            // Keep surviving contact's email
    phone: 'merged',              // Use merged contact's phone
    jobTitle: 'merged',           // Use merged contact's job title
    tags: 'combine',              // Combine tags from both
    customFields: 'surviving',    // Keep surviving's custom fields
  },
});

console.log(`Merge complete:`);
console.log(`  Activities moved: ${mergeResult.activitiesMoved}`);
console.log(`  Deals moved:      ${mergeResult.dealsMoved}`);
console.log(`  Duplicate removed: ${mergeResult.duplicateRemoved}`);
// Emits: crm.contacts.merged
```

---

## Error Codes

All CRM errors extend the base `CRMError` class and include a machine-readable error code, a human-readable message, and optional context metadata.

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `CRM_CONTACT_NOT_FOUND` | Contact Not Found | 404 | Contact ID does not exist or is not accessible in the current venture |
| `CRM_CONTACT_DUPLICATE_EMAIL` | Duplicate Email | 409 | A contact with this email already exists in the venture |
| `CRM_CONTACT_MERGE_SELF` | Cannot Merge Self | 400 | Attempted to merge a contact with itself |
| `CRM_CONTACT_MERGE_DIFFERENT_VENTURE` | Cross-Venture Merge | 403 | Attempted to merge contacts from different ventures |
| `CRM_CONTACT_IMPORT_INVALID_FORMAT` | Invalid Import Format | 400 | Import file is not a valid CSV or has no parseable headers |
| `CRM_CONTACT_IMPORT_MAPPING_REQUIRED` | Mapping Required | 400 | Column mapping must include at least firstName and lastName |
| `CRM_CONTACT_IMPORT_ROW_INVALID` | Import Row Invalid | 422 | Individual row failed validation (included in import job errors) |
| `CRM_COMPANY_NOT_FOUND` | Company Not Found | 404 | Company ID does not exist or is not accessible |
| `CRM_COMPANY_CIRCULAR_HIERARCHY` | Circular Hierarchy | 400 | Setting parent company would create a circular reference |
| `CRM_COMPANY_DUPLICATE_DOMAIN` | Duplicate Domain | 409 | A company with this domain already exists in the venture |
| `CRM_DEAL_NOT_FOUND` | Deal Not Found | 404 | Deal ID does not exist or is not accessible |
| `CRM_DEAL_INVALID_STAGE` | Invalid Stage | 400 | Target stage does not belong to the deal's pipeline |
| `CRM_DEAL_ALREADY_CLOSED` | Deal Already Closed | 400 | Attempted to update a deal that is already won or lost |
| `CRM_DEAL_NEGATIVE_VALUE` | Negative Deal Value | 400 | Deal value must be zero or positive |
| `CRM_DEAL_INVALID_PROBABILITY` | Invalid Probability | 400 | Win probability must be between 0 and 100 |
| `CRM_PIPELINE_NOT_FOUND` | Pipeline Not Found | 404 | Pipeline ID does not exist or is not accessible |
| `CRM_PIPELINE_DELETE_HAS_DEALS` | Pipeline Has Deals | 400 | Cannot delete a pipeline that contains open deals |
| `CRM_PIPELINE_DUPLICATE_DEFAULT` | Duplicate Default | 409 | Only one pipeline can be marked as default per venture |
| `CRM_PIPELINE_MIN_STAGES` | Minimum Stages | 400 | Pipeline must have at least two stages (one open, one closed) |
| `CRM_PIPELINE_MISSING_CLOSED_STAGE` | No Closed Stage | 400 | Pipeline must have at least one closed-won or closed-lost stage |
| `CRM_ACTIVITY_NOT_FOUND` | Activity Not Found | 404 | Activity ID does not exist or is not accessible |
| `CRM_ACTIVITY_INVALID_TYPE` | Invalid Activity Type | 400 | Activity type is not one of the supported types |
| `CRM_ACTIVITY_TASK_ALREADY_COMPLETE` | Task Already Complete | 400 | Task has already been marked as completed |
| `CRM_LEAD_NOT_FOUND` | Lead Not Found | 404 | Lead ID does not exist or is not accessible |
| `CRM_LEAD_ALREADY_CONVERTED` | Lead Already Converted | 400 | Lead has already been converted to a contact |
| `CRM_LEAD_INVALID_STATUS_TRANSITION` | Invalid Status Transition | 400 | Requested status transition is not allowed (e.g., converted → new) |
| `CRM_LEAD_ASSIGNMENT_NO_AVAILABLE_REPS` | No Available Reps | 503 | All assignees in the rotation have reached their max lead limit |
| `CRM_CUSTOM_FIELD_NOT_FOUND` | Custom Field Not Found | 404 | Custom field definition does not exist |
| `CRM_CUSTOM_FIELD_DUPLICATE_NAME` | Duplicate Field Name | 409 | A custom field with this name already exists for this entity type |
| `CRM_CUSTOM_FIELD_VALIDATION_FAILED` | Field Validation Failed | 422 | Custom field value does not pass validation rules |
| `CRM_CUSTOM_FIELD_TYPE_MISMATCH` | Type Mismatch | 400 | Provided value does not match the field's declared type |
| `CRM_CUSTOM_FIELD_INVALID_OPTION` | Invalid Option | 400 | Selected value is not in the field's option list (enum/multi-select) |
| `CRM_VIEW_NOT_FOUND` | View Not Found | 404 | Saved view does not exist or is not accessible |
| `CRM_VIEW_PERMISSION_DENIED` | View Permission Denied | 403 | User does not have access to this private view |
| `CRM_AUTOMATION_NOT_FOUND` | Automation Not Found | 404 | Workflow automation does not exist |
| `CRM_AUTOMATION_RATE_LIMITED` | Automation Rate Limited | 429 | Automation has exceeded its hourly or daily execution limit |
| `CRM_AUTOMATION_COOLDOWN` | Automation Cooldown | 429 | Automation is in cooldown period for this entity |
| `CRM_AUTOMATION_INVALID_TRIGGER` | Invalid Trigger | 400 | Trigger configuration is invalid or references non-existent entities |
| `CRM_AUTOMATION_INVALID_ACTION` | Invalid Action | 400 | Action configuration is invalid or uses unsupported action type |
| `CRM_AUTOMATION_EXECUTION_FAILED` | Execution Failed | 500 | Automation execution failed (see execution log for details) |
| `CRM_BULK_ACTION_TOO_MANY` | Too Many Entities | 400 | Bulk action exceeds maximum entity count (default: 1000) |
| `CRM_BULK_ACTION_MIXED_TYPES` | Mixed Entity Types | 400 | Bulk action entities must all be the same type |
| `CRM_SEARCH_QUERY_TOO_SHORT` | Query Too Short | 400 | Search query must be at least 2 characters |
| `CRM_VENTURE_NOT_INITIALIZED` | Venture Not Initialized | 400 | CRM has not been initialized for this venture. Call `crm.initialize()` first |
| `CRM_PERMISSION_DENIED` | Permission Denied | 403 | User does not have the required CRM permission for this action |
| `CRM_RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | 429 | Too many API requests. Back off and retry |

### Error Usage

```typescript
import { CRMError } from '@mcv/nexus/crm';

try {
  await deals.update(dealId, { stageId: invalidStageId });
} catch (error) {
  if (error instanceof CRMError) {
    switch (error.code) {
      case 'CRM_DEAL_INVALID_STAGE':
        console.error(`Stage ${invalidStageId} is not valid for this pipeline`);
        break;
      case 'CRM_DEAL_ALREADY_CLOSED':
        console.error('Cannot modify a closed deal');
        break;
      case 'CRM_DEAL_NOT_FOUND':
        console.error('Deal not found');
        break;
      default:
        console.error(`CRM Error [${error.code}]: ${error.message}`);
    }
  }
  throw error;
}
```

---

## Security

### Row-Level Security (RLS)

Every CRM table enforces venture-level isolation through PostgreSQL RLS. This is the primary security boundary — even if application code has bugs, data cannot leak between ventures.

```sql
-- Pattern applied to all CRM tables:
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_contacts_venture_isolation ON crm_contacts
  USING (venture_id = current_setting('app.current_venture_id')::uuid)
  WITH CHECK (venture_id = current_setting('app.current_venture_id')::uuid);

-- Service role can bypass RLS for admin operations
CREATE POLICY crm_contacts_service_role ON crm_contacts
  USING (current_setting('role') = 'service_role');
```

### Permission Model

CRM access is governed by venture-scoped permissions defined in `@mcv/nexus/iam`:

```typescript
const CRM_PERMISSIONS = {
  // Contact permissions
  'crm:contacts:read':       'View contacts and contact details',
  'crm:contacts:create':     'Create new contacts',
  'crm:contacts:update':     'Edit existing contacts',
  'crm:contacts:delete':     'Archive/delete contacts',
  'crm:contacts:merge':      'Merge duplicate contacts',
  'crm:contacts:import':     'Import contacts from CSV',
  'crm:contacts:export':     'Export contacts to CSV',

  // Company permissions
  'crm:companies:read':      'View companies and company details',
  'crm:companies:create':    'Create new companies',
  'crm:companies:update':    'Edit existing companies',
  'crm:companies:delete':    'Archive/delete companies',

  // Deal permissions
  'crm:deals:read':          'View deals and pipeline',
  'crm:deals:create':        'Create new deals',
  'crm:deals:update':        'Edit existing deals',
  'crm:deals:delete':        'Archive/delete deals',
  'crm:deals:close':         'Mark deals as won or lost',

  // Pipeline permissions
  'crm:pipelines:read':      'View pipeline configuration',
  'crm:pipelines:manage':    'Create, edit, and delete pipelines and stages',

  // Activity permissions
  'crm:activities:read':     'View activities and timeline',
  'crm:activities:create':   'Log new activities',
  'crm:activities:update':   'Edit existing activities',
  'crm:activities:delete':   'Delete activities',

  // Lead permissions
  'crm:leads:read':          'View leads',
  'crm:leads:create':        'Create new leads',
  'crm:leads:update':        'Edit existing leads',
  'crm:leads:delete':        'Delete leads',
  'crm:leads:convert':       'Convert leads to contacts',
  'crm:leads:assign':        'Assign leads to users',

  // Custom field permissions
  'crm:custom-fields:read':  'View custom field definitions',
  'crm:custom-fields:manage':'Create, edit, and delete custom field definitions',

  // View permissions
  'crm:views:read':          'View saved views',
  'crm:views:manage':        'Create, edit, and delete views',

  // Automation permissions
  'crm:automations:read':    'View workflow automations',
  'crm:automations:manage':  'Create, edit, and delete automations',
  'crm:automations:logs':    'View automation execution logs',

  // Reporting permissions
  'crm:reports:read':        'View CRM reports and analytics',
  'crm:reports:export':      'Export report data',

  // Admin permissions
  'crm:admin':               'Full CRM administration access',
} as const;
```

### Data Access Patterns

```typescript
// Owner-based access control
// Users with 'crm:contacts:read' see only contacts they own
// Users with 'crm:contacts:read:all' see all contacts in the venture
// The 'crm:admin' permission grants full access

// Middleware enforces permissions before service calls
const contactRouter = createTRPCRouter({
  list: protectedProcedure
    .meta({ permission: 'crm:contacts:read' })
    .input(contactFilterSchema)
    .query(async ({ ctx, input }) => {
      // ctx.ventureId is set by middleware
      // ctx.userId is authenticated user
      // RLS automatically filters by venture
      return ctx.crm.contacts.list(input, {
        ownedOnly: !ctx.hasPermission('crm:contacts:read:all'),
      });
    }),
});
```

### Audit Logging

All CRM mutations are logged to the venture audit trail:

```typescript
// Every create, update, delete, merge, import, and conversion
// is recorded with:
{
  ventureId: string;
  userId: string;
  action: string;          // 'crm.contact.created', 'crm.deal.stage_changed', etc.
  entityType: string;      // 'contact', 'deal', 'lead', etc.
  entityId: string;
  changes: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  metadata: Record<string, unknown>;
  timestamp: Date;
  ipAddress: string;
}
```

### Data Sanitization

- All user inputs are sanitized before storage (XSS prevention)
- Email addresses are normalized (lowercased, trimmed)
- Phone numbers are validated and formatted (E.164 when possible)
- Custom field values are validated against their definitions before storage
- Import data passes through validation pipeline before insertion
- HTML in activity body fields is sanitized (allowlisted tags only)

### Soft Deletes

All CRM entities use soft deletes (`archivedAt` timestamp) rather than hard deletes. This ensures:
- Accidental deletions are recoverable
- Audit trail integrity is maintained
- Historical reports remain accurate
- Compliance requirements for data retention are met

Hard deletion is available through the admin API for GDPR right-to-erasure requests.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CRM_DEFAULT_PIPELINE_NAME` | No | `"Sales Pipeline"` | Name for the auto-created default pipeline |
| `CRM_DEFAULT_CURRENCY` | No | `"USD"` | Default currency for new pipelines and deals |
| `CRM_MAX_CONTACTS_PER_VENTURE` | No | `1000000` | Maximum contacts per venture (plan-based limit) |
| `CRM_MAX_DEALS_PER_VENTURE` | No | `500000` | Maximum deals per venture |
| `CRM_MAX_CUSTOM_FIELDS_PER_ENTITY` | No | `100` | Maximum custom field definitions per entity type |
| `CRM_MAX_IMPORT_ROWS` | No | `50000` | Maximum rows per import job |
| `CRM_IMPORT_BATCH_SIZE` | No | `500` | Rows processed per batch during import |
| `CRM_STALE_DEAL_CHECK_INTERVAL_HOURS` | No | `6` | How often to check for stale deals |
| `CRM_STALE_DEAL_DEFAULT_DAYS` | No | `14` | Default days of inactivity before a deal is flagged stale |
| `CRM_LEAD_ASSIGNMENT_TIMEOUT_MINUTES` | No | `5` | Time before unacknowledged lead is reassigned |
| `CRM_AUTOMATION_MAX_PER_VENTURE` | No | `200` | Maximum workflow automations per venture |
| `CRM_AUTOMATION_MAX_ACTIONS` | No | `20` | Maximum actions per automation |
| `CRM_AUTOMATION_EXECUTION_TIMEOUT_MS` | No | `30000` | Timeout for individual automation execution |
| `CRM_BULK_ACTION_MAX_ENTITIES` | No | `1000` | Maximum entities per bulk action |
| `CRM_SEARCH_MIN_QUERY_LENGTH` | No | `2` | Minimum characters for search queries |
| `CRM_CONTACT_SCORE_RECALC_INTERVAL_HOURS` | No | `24` | How often to recalculate contact scores |
| `CRM_DUPLICATE_DETECTION_THRESHOLD` | No | `0.85` | Confidence threshold for duplicate detection (0–1) |
| `CRM_REDPANDA_TOPIC_PREFIX` | No | `"crm"` | Prefix for all CRM Redpanda topics |
| `CRM_REDPANDA_CONSUMER_GROUP` | No | `"crm-automation"` | Consumer group for automation event processing |
| `CRM_REMINDER_CHECK_INTERVAL_MINUTES` | No | `5` | How often to check for activity reminders |
| `CRM_FORECAST_HISTORY_MONTHS` | No | `12` | Months of history to use for forecast accuracy calculation |

---

## Dependencies

### Internal Dependencies

| Package | Usage |
|---------|-------|
| `@mcv/nexus/core` | Venture context, multi-tenant middleware, base service patterns |
| `@mcv/nexus/iam` | Permission checks, role-based access control |
| `@mcv/nexus/billing` | Revenue tracking when deals close (optional integration) |
| `@mcv/growth/marketing` | Lead scoring signals, campaign attribution (optional) |
| `@mcv/comms` | Auto-log emails, chat messages as activities (optional) |
| `@mcv/common/events` | Redpanda event bus client, topic management |
| `@mcv/common/errors` | Base error classes, error code registry |
| `@mcv/common/validation` | Zod schema helpers, input sanitization |
| `@mcv/common/pagination` | Cursor-based and offset pagination helpers |
| `@mcv/common/audit` | Audit trail logging |

### External Dependencies

| Package | Version | Usage |
|---------|---------|-------|
| `drizzle-orm` | `^0.30.x` | PostgreSQL ORM for type-safe queries |
| `@supabase/supabase-js` | `^2.x` | Supabase client for auth context and RLS |
| `zod` | `^3.22.x` | Input validation schemas for tRPC procedures |
| `@trpc/server` | `^10.x` | tRPC router definitions |
| `kafkajs` | `^2.x` | Redpanda/Kafka client for event production/consumption |
| `csv-parse` | `^5.x` | CSV parsing for contact imports |
| `csv-stringify` | `^6.x` | CSV generation for contact exports |
| `fast-levenshtein` | `^3.x` | String similarity for duplicate detection |
| `date-fns` | `^3.x` | Date manipulation for forecasting and activity timelines |
| `nanoid` | `^5.x` | Short ID generation for import job tracking |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── contact.service.test.ts
│   │   ├── company.service.test.ts
│   │   ├── deal.service.test.ts
│   │   ├── pipeline.service.test.ts
│   │   ├── activity.service.test.ts
│   │   ├── lead.service.test.ts
│   │   ├── lead-assignment.service.test.ts
│   │   ├── lead-conversion.service.test.ts
│   │   ├── custom-field.service.test.ts
│   │   ├── custom-field-validation.test.ts
│   │   ├── crm-view.service.test.ts
│   │   ├── bulk-action.service.test.ts
│   │   ├── workflow-automation.service.test.ts
│   │   ├── workflow-execution.engine.test.ts
│   │   ├── contact-merge.service.test.ts
│   │   ├── contact-import.service.test.ts
│   │   ├── contact-scoring.service.test.ts
│   │   ├── pipeline-forecast.service.test.ts
│   │   ├── deal-rotation.service.test.ts
│   │   ├── stale-deal.service.test.ts
│   │   ├── crm-reporting.service.test.ts
│   │   └── crm-search.test.ts
│   ├── integration/
│   │   ├── contact-lifecycle.test.ts
│   │   ├── deal-pipeline-flow.test.ts
│   │   ├── lead-to-deal.test.ts
│   │   ├── automation-execution.test.ts
│   │   ├── import-export-roundtrip.test.ts
│   │   ├── contact-merge-integrity.test.ts
│   │   ├── multi-tenant-isolation.test.ts
│   │   ├── custom-field-persistence.test.ts
│   │   ├── event-emission.test.ts
│   │   └── reporting-accuracy.test.ts
│   └── e2e/
│       ├── crm-full-workflow.test.ts
│       └── crm-api-endpoints.test.ts
```

### Running Tests

```bash
# All CRM tests
pnpm test --filter @mcv/nexus/crm

# Unit tests only
pnpm test --filter @mcv/nexus/crm -- --testPathPattern=unit

# Integration tests (requires database)
pnpm test --filter @mcv/nexus/crm -- --testPathPattern=integration

# Specific service
pnpm test --filter @mcv/nexus/crm -- deal.service

# With coverage
pnpm test --filter @mcv/nexus/crm -- --coverage
```

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DealService } from '../services/deal.service';
import { createMockDb, createMockEventBus } from '@mcv/testing';

describe('DealService', () => {
  let service: DealService;
  let mockDb: ReturnType<typeof createMockDb>;
  let mockEventBus: ReturnType<typeof createMockEventBus>;

  const ventureId = 'venture-001';
  const pipelineId = 'pipeline-001';
  const discoveryStageId = 'stage-001';
  const proposalStageId = 'stage-002';
  const closedWonStageId = 'stage-003';
  const closedLostStageId = 'stage-004';

  beforeEach(() => {
    mockDb = createMockDb();
    mockEventBus = createMockEventBus();
    service = new DealService({ db: mockDb, eventBus: mockEventBus, ventureId });

    // Mock pipeline stages
    mockDb.mockQuery('dealStages.findMany', [
      { id: discoveryStageId, pipelineId, name: 'Discovery', position: 0, winProbability: 10, isClosedWon: false, isClosedLost: false },
      { id: proposalStageId, pipelineId, name: 'Proposal', position: 1, winProbability: 50, isClosedWon: false, isClosedLost: false },
      { id: closedWonStageId, pipelineId, name: 'Closed Won', position: 2, winProbability: 100, isClosedWon: true, isClosedLost: false },
      { id: closedLostStageId, pipelineId, name: 'Closed Lost', position: 3, winProbability: 0, isClosedWon: false, isClosedLost: true },
    ]);
  });

  describe('create', () => {
    it('should create a deal with calculated weighted value', async () => {
      const deal = await service.create({
        title: 'Test Deal',
        pipelineId,
        stageId: discoveryStageId,
        value: 100000,
        currency: 'USD',
      });

      expect(deal.title).toBe('Test Deal');
      expect(deal.value).toBe(100000);
      expect(deal.winProbability).toBe(10);  // From stage default
      expect(deal.weightedValue).toBe(10000); // 100000 × 0.10
      expect(deal.status).toBe('open');
    });

    it('should emit deal.created event', async () => {
      await service.create({
        title: 'Test Deal',
        pipelineId,
        stageId: discoveryStageId,
        value: 50000,
      });

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'crm.deals.created',
        expect.objectContaining({
          ventureId,
          dealId: expect.any(String),
          title: 'Test Deal',
          value: 50000,
        }),
      );
    });

    it('should reject negative deal values', async () => {
      await expect(service.create({
        title: 'Bad Deal',
        pipelineId,
        stageId: discoveryStageId,
        value: -5000,
      })).rejects.toThrow('CRM_DEAL_NEGATIVE_VALUE');
    });

    it('should reject invalid stage for pipeline', async () => {
      await expect(service.create({
        title: 'Bad Deal',
        pipelineId,
        stageId: 'nonexistent-stage',
      })).rejects.toThrow('CRM_DEAL_INVALID_STAGE');
    });
  });

  describe('stage transitions', () => {
    it('should emit stage-changed event when moving stages', async () => {
      const deal = await service.create({
        title: 'Stage Test',
        pipelineId,
        stageId: discoveryStageId,
        value: 75000,
      });

      await service.update(deal.id, { stageId: proposalStageId });

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'crm.deals.stage-changed',
        expect.objectContaining({
          dealId: deal.id,
          fromStageId: discoveryStageId,
          toStageId: proposalStageId,
          fromStageName: 'Discovery',
          toStageName: 'Proposal',
        }),
      );
    });

    it('should update weighted value when stage changes', async () => {
      const deal = await service.create({
        title: 'Weight Test',
        pipelineId,
        stageId: discoveryStageId,
        value: 100000,
      });

      const updated = await service.update(deal.id, { stageId: proposalStageId });

      expect(updated.winProbability).toBe(50);      // From Proposal stage
      expect(updated.weightedValue).toBe(50000);     // 100000 × 0.50
    });

    it('should reject updates to closed deals', async () => {
      const deal = await service.create({
        title: 'Closed Deal',
        pipelineId,
        stageId: discoveryStageId,
        value: 30000,
      });

      await service.win(deal.id);

      await expect(service.update(deal.id, {
        stageId: proposalStageId,
      })).rejects.toThrow('CRM_DEAL_ALREADY_CLOSED');
    });
  });

  describe('win/loss', () => {
    it('should set status and timestamp when deal is won', async () => {
      const deal = await service.create({
        title: 'Win Test',
        pipelineId,
        stageId: proposalStageId,
        value: 50000,
      });

      const won = await service.win(deal.id);

      expect(won.status).toBe('won');
      expect(won.wonAt).toBeInstanceOf(Date);
      expect(won.stageId).toBe(closedWonStageId);
      expect(won.winProbability).toBe(100);
      expect(won.weightedValue).toBe(50000);
    });

    it('should emit deal.won event', async () => {
      const deal = await service.create({
        title: 'Won Deal',
        pipelineId,
        stageId: proposalStageId,
        value: 80000,
      });

      await service.win(deal.id);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'crm.deals.won',
        expect.objectContaining({
          dealId: deal.id,
          value: 80000,
        }),
      );
    });

    it('should require lost reason when losing a deal', async () => {
      const deal = await service.create({
        title: 'Lost Deal',
        pipelineId,
        stageId: proposalStageId,
        value: 60000,
      });

      const lost = await service.lose(deal.id, {
        reason: 'competitor',
        detail: 'Went with SalesForce — better enterprise features',
      });

      expect(lost.status).toBe('lost');
      expect(lost.lostReason).toBe('competitor');
      expect(lost.lostAt).toBeInstanceOf(Date);
    });
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, seedTestVenture, cleanupTestDatabase } from '@mcv/testing';
import { CRMService } from '../services/crm.service';

describe('CRM Multi-Tenant Isolation (integration)', () => {
  let db: TestDatabase;
  let crmVenture1: CRMService;
  let crmVenture2: CRMService;

  beforeAll(async () => {
    db = await createTestDatabase();
    const venture1 = await seedTestVenture(db, { name: 'Venture A' });
    const venture2 = await seedTestVenture(db, { name: 'Venture B' });
    
    crmVenture1 = new CRMService({ db, eventBus: createTestEventBus(), ventureId: venture1.id });
    crmVenture2 = new CRMService({ db, eventBus: createTestEventBus(), ventureId: venture2.id });
    
    await crmVenture1.initialize(venture1.id);
    await crmVenture2.initialize(venture2.id);
  });

  afterAll(async () => {
    await cleanupTestDatabase(db);
  });

  it('should isolate contacts between ventures', async () => {
    // Create contact in Venture A
    const contactA = await crmVenture1.contacts.create({
      firstName: 'Alice',
      lastName: 'Venture-A',
      email: 'alice@a.com',
    });

    // Create contact in Venture B
    const contactB = await crmVenture2.contacts.create({
      firstName: 'Bob',
      lastName: 'Venture-B',
      email: 'bob@b.com',
    });

    // Venture A should only see its own contacts
    const listA = await crmVenture1.contacts.list({});
    expect(listA.data).toHaveLength(1);
    expect(listA.data[0].id).toBe(contactA.id);

    // Venture B should only see its own contacts
    const listB = await crmVenture2.contacts.list({});
    expect(listB.data).toHaveLength(1);
    expect(listB.data[0].id).toBe(contactB.id);

    // Venture A cannot access Venture B's contact
    await expect(
      crmVenture1.contacts.getById(contactB.id)
    ).rejects.toThrow('CRM_CONTACT_NOT_FOUND');
  });

  it('should isolate pipelines and deals between ventures', async () => {
    const pipelineA = await crmVenture1.pipelines.getDefault();
    const pipelineB = await crmVenture2.pipelines.getDefault();

    expect(pipelineA.id).not.toBe(pipelineB.id);

    const dealA = await crmVenture1.deals.create({
      title: 'Deal in Venture A',
      pipelineId: pipelineA.id,
      stageId: pipelineA.stages[0].id,
      value: 10000,
    });

    // Venture B cannot see Venture A's deal
    await expect(
      crmVenture2.deals.getById(dealA.id)
    ).rejects.toThrow('CRM_DEAL_NOT_FOUND');

    // Venture B cannot use Venture A's pipeline
    await expect(
      crmVenture2.deals.create({
        title: 'Attempted cross-venture deal',
        pipelineId: pipelineA.id,
        stageId: pipelineA.stages[0].id,
      })
    ).rejects.toThrow('CRM_PIPELINE_NOT_FOUND');
  });
});
```

### Test Coverage Targets

| Area | Target | Notes |
|------|--------|-------|
| Contact CRUD | 95% | Core functionality, critical path |
| Company CRUD | 90% | Standard CRUD patterns |
| Deal/Pipeline | 95% | Stage transitions, probability, weighted values |
| Activity Logging | 90% | All activity types, reminders, auto-logging |
| Lead Management | 95% | Scoring, assignment, conversion are critical |
| Custom Fields | 90% | Type validation, option management |
| Views & Filters | 85% | Filter logic, column configuration |
| Workflow Automation | 95% | Trigger evaluation, action execution, rate limits |
| Import/Export | 90% | CSV parsing, mapping, deduplication |
| Contact Merge | 95% | Data integrity, relationship preservation |
| Reporting | 85% | Aggregation accuracy, period calculations |
| Multi-Tenant Isolation | 100% | Must verify RLS on every table |
| Event Emission | 95% | Every mutation must emit correct event |

---

*Last updated: 2026-02-09*
