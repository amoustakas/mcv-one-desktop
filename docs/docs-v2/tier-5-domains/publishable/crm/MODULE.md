# @mcv/domains/crm — Customer Relationship Management

**Parent Package:** @mcv/domains  
**Tier:** 5 (Domain Modules — Publishable)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Purpose

The `crm` module provides a full-featured Customer Relationship Management system that operates as a standalone publishable domain. It manages the complete sales lifecycle: contacts and organizations, deal pipelines, activity tracking, lead scoring, revenue forecasting, duplicate detection, custom objects, and smart views. Unlike traditional CRMs, MCV's CRM includes AI-powered deal scoring that evaluates win probability using heuristic signals, configurable lead scoring with behavioral/demographic/firmographic rules, and intelligent duplicate detection with Levenshtein-distance fuzzy matching.

**This module is designed to be publishable as a standalone SaaS product, independent of MCV's internal venture management.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  listContacts,              // List contacts with cursor-based pagination
  getContact,                // Get single contact by ID
  createContact,             // Create new contact
  updateContact,             // Update contact fields
  deleteContact,             // Delete single contact
  searchContacts,            // Autocomplete search contacts
  bulkUpdateContacts,        // Bulk update multiple contacts
  bulkDeleteContacts,        // Bulk delete multiple contacts
} from './server/services/contact-service';

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIZATION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  listOrganizations,         // List organizations with filters
  getOrganization,           // Get single organization by ID
  createOrganization,        // Create new organization
  updateOrganization,        // Update organization fields
  deleteOrganization,        // Delete single organization
  searchOrganizations,       // Autocomplete search organizations
  bulkDeleteOrganizations,   // Bulk delete multiple organizations
  getOrganizationContacts,   // Get contacts linked to organization
  getOrganizationDeals,      // Get deals linked to organization
  getOrganizationRevenue,    // Revenue statistics for organization
  getIndustries,             // Distinct industries for filtering
} from './server/services/organization-service';

// ═══════════════════════════════════════════════════════════════════════════════
// DEAL & PIPELINE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  listDeals,                 // List deals with pagination and filters
  getDeal,                   // Get single deal by ID
  createDeal,                // Create new deal in pipeline
  updateDeal,                // Update deal fields
  deleteDeal,                // Delete deal
  moveDealStage,             // Move deal to different pipeline stage
  closeDeal,                 // Close deal as won or lost
  searchDeals,               // Autocomplete search deals
  getDealsByStage,           // Deals grouped by stage (Kanban view)
  getPipelineSummary,        // Pipeline statistics
  getClosedSummary,          // Won/lost summary for period
} from './server/services/deal-service';

// ═══════════════════════════════════════════════════════════════════════════════
// AI DEAL SCORING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  scoreDeal,                 // Score a single deal (0-100)
  batchScoreDeals,           // Score all open deals for venture
  getScoreHistory,           // Historical score trend for deal
  getScoringFactors,         // Detailed scoring breakdown
  getAtRiskDeals,            // Deals with declining/low scores
  predictCloseDate,          // Predict close date from historical data
} from './server/services/deal-scoring-service';

// ═══════════════════════════════════════════════════════════════════════════════
// LEAD SCORING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createScoringRule,         // Create lead scoring rule
  updateScoringRule,         // Update scoring rule
  deleteScoringRule,         // Delete scoring rule
  listScoringRules,          // List all active scoring rules
  evaluateContact,           // Score a single contact
  batchScoreContacts,        // Re-score all contacts
  getScoreBreakdown,         // Detailed score breakdown
  getLeaderboard,            // Top-scored contacts
  applyDecay,                // Decay scores for inactive contacts
  getScoreDistribution,      // Score distribution histogram
} from './server/services/lead-scoring-service';

// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE FORECASTING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createForecast,            // Create forecast period
  updateForecastItem,        // Update item category/amount
  getForecastSummary,        // Summary with category breakdown
  getForecastVsActual,       // Compare forecast to closed-won
  getForecastByOwner,        // Breakdown by sales rep
  getForecastByPipeline,     // Breakdown by pipeline
  getQuotaAttainment,        // Quota attainment for user
  getTrendAnalysis,          // Multi-period trend analysis
} from './server/services/forecast-service';

// ═══════════════════════════════════════════════════════════════════════════════
// DUPLICATE DETECTION & MERGE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  findDuplicates,            // Find duplicates for a record
  scanForDuplicates,         // Batch scan for duplicate groups
  mergeRecords,              // Merge two records with field control
  getMergePreview,           // Preview merge result + conflicts
  getDuplicateGroups,        // Get clustered duplicate groups
  getMergeHistory,           // Merge audit trail
} from './server/services/duplicate-detection-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM OBJECTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createCustomObject,        // Define custom CRM entity
  updateCustomObject,        // Update object definition
  deleteCustomObject,        // Delete custom object + records
  getCustomObject,           // Get object definition
  listCustomObjects,         // List all custom objects
  createCustomRecord,        // Create record in custom object
  updateCustomRecord,        // Update custom record data
  deleteCustomRecord,        // Delete custom record
  listCustomRecords,         // List records with pagination
  createRelationship,        // Link objects via relationship
  deleteRelationship,        // Remove object relationship
  getRelatedRecords,         // Get related records for object
} from './server/services/custom-object-service';

// ═══════════════════════════════════════════════════════════════════════════════
// SMART VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createSmartView,           // Create saved view with filters
  updateSmartView,           // Update view configuration
  deleteSmartView,           // Delete smart view
  getSmartView,              // Get single view
  listSmartViews,            // List views for object type
  applySmartView,            // Execute view and return results
  shareSmartView,            // Make view shared/unshared
  duplicateSmartView,        // Clone view with new name
} from './server/services/smart-view-service';

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  logActivity,               // Log note, email, call, meeting, or task
  getActivities,             // Get activity feed for entity
  getTimeline,               // Chronological activity timeline
} from './server/services/activity-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useContacts } from './client/hooks/use-contacts';
export { useContact } from './client/hooks/use-contact';
export { useDeals } from './client/hooks/use-deals';
export { useDealPipeline } from './client/hooks/use-deal-pipeline';
export { useDealScore } from './client/hooks/use-deal-score';
export { useLeadScoring } from './client/hooks/use-lead-scoring';
export { useForecast } from './client/hooks/use-forecast';
export { useDuplicates } from './client/hooks/use-duplicates';
export { useSmartView } from './client/hooks/use-smart-view';
export { useActivities } from './client/hooks/use-activities';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { ContactList } from './client/components/contact-list';
export { ContactDetail } from './client/components/contact-detail';
export { DealKanban } from './client/components/deal-kanban';
export { DealScoreCard } from './client/components/deal-score-card';
export { PipelineView } from './client/components/pipeline-view';
export { ForecastDashboard } from './client/components/forecast-dashboard';
export { LeadScoreWidget } from './client/components/lead-score-widget';
export { DuplicateResolver } from './client/components/duplicate-resolver';
export { ActivityTimeline } from './client/components/activity-timeline';
export { SmartViewBuilder } from './client/components/smart-view-builder';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  CONTACT_TYPES,
  LIFECYCLE_STAGES,
  DEAL_STATUSES,
  ACTIVITY_TYPES,
  ACTIVITY_SUBJECT_TYPES,
  SCORING_CATEGORIES,
  FORECAST_PERIODS,
  FORECAST_CATEGORIES,
  RISK_LEVELS,
  RELATIONSHIP_TYPES,
  CRM_OBJECT_TYPES,
  DUPLICATE_OBJECT_TYPES,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Contact types
  Contact,
  NewContact,
  ContactType,
  LifecycleStage,
  ContactCustomFields,

  // Organization types
  Organization,
  NewOrganization,
  OrganizationAddress,

  // Deal types
  Deal,
  NewDeal,
  DealStatus,
  Pipeline,
  NewPipeline,
  PipelineStage,
  PipelineStageV2,

  // Activity types
  CrmActivity,
  NewCrmActivity,
  CrmActivityType,
  CrmActivitySubjectType,
  CrmActivityMetadata,

  // Scoring types
  DealScore,
  ScoreResult,
  ScoringFactor,
  ScoringSignal,
  RiskLevel,
  ContactScore,
  LeadScoringRule,
  ScoringCategory,
  ScoringRuleCondition,
  ScoreBreakdown,

  // Forecast types
  Forecast,
  ForecastItem,
  ForecastPeriod,
  ForecastCategory,
  ForecastSummary,
  ForecastByOwner,
  QuotaAttainment,
  TrendPeriod,

  // Duplicate types
  DuplicateMatch,
  DuplicateGroup,
  MergePreview,
  DuplicateRule,
  MergeHistoryRecord,

  // Custom object types
  CustomObject,
  CustomObjectRecord,
  CustomObjectFieldDef,
  ObjectRelationship,
  CrmObjectType,
  CrmRelationshipType,

  // Smart view types
  SmartView,
  SmartViewFilter,
  SmartViewSort,
  SmartViewColumn,

  // Stage automation
  StageAutomation,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              CRM DOMAIN ARCHITECTURE                                  │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐   │
│  │                             ENTRY POINTS                                       │   │
│  │                                                                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │  tRPC Routes │  │  React Hooks │  │ NAOS Agents  │  │  Cron Jobs   │      │   │
│  │  │  /api/crm    │  │  useContacts │  │  Sales Agent │  │  Batch Score │      │   │
│  │  │  /api/crm-v2 │  │  useDeals    │  │  CRM Agent   │  │  Decay       │      │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │   │
│  │         │                 │                 │                 │                │   │
│  │         └─────────────────┴─────────────────┴─────────────────┘                │   │
│  │                                    │                                            │   │
│  └────────────────────────────────────┼────────────────────────────────────────────┘   │
│                                       │                                                │
│  ┌────────────────────────────────────▼────────────────────────────────────────────┐   │
│  │                          SERVICE LAYER                                           │   │
│  │                                                                                  │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────────────┐    │   │
│  │  │  Contact      │ │ Organization  │ │    Deal       │ │   Activity       │    │   │
│  │  │  Service      │ │ Service       │ │  Service      │ │   Service        │    │   │
│  │  │               │ │               │ │               │ │                  │    │   │
│  │  │ • CRUD        │ │ • CRUD        │ │ • CRUD        │ │ • Notes          │    │   │
│  │  │ • Search      │ │ • Search      │ │ • Stage mgmt  │ │ • Emails         │    │   │
│  │  │ • Bulk ops    │ │ • Revenue     │ │ • Close       │ │ • Calls          │    │   │
│  │  │ • Lifecycle   │ │ • Industries  │ │ • Pipeline    │ │ • Meetings       │    │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ │ • Tasks          │    │   │
│  │                                                         └──────────────────┘    │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────────────┐    │   │
│  │  │ Deal Scoring  │ │ Lead Scoring  │ │  Forecast     │ │   Duplicate      │    │   │
│  │  │ Service       │ │ Service       │ │  Service      │ │   Detection      │    │   │
│  │  │               │ │               │ │               │ │   Service        │    │   │
│  │  │ • AI scoring  │ │ • Rule engine │ │ • Period mgmt │ │                  │    │   │
│  │  │ • 9 factors   │ │ • 3 categories│ │ • Categories  │ │ • Exact email    │    │   │
│  │  │ • Risk level  │ │ • Decay       │ │ • Quota       │ │ • Fuzzy name     │    │   │
│  │  │ • Win prob    │ │ • Distribution│ │ • Trends      │ │ • Phone norm     │    │   │
│  │  │ • Prediction  │ │ • Leaderboard │ │ • By owner    │ │ • Domain match   │    │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ │ • Merge          │    │   │
│  │                                                         └──────────────────┘    │   │
│  │  ┌───────────────┐ ┌───────────────┐                                            │   │
│  │  │ Custom Object │ │  Smart View   │                                            │   │
│  │  │ Service       │ │  Service      │                                            │   │
│  │  │               │ │               │                                            │   │
│  │  │ • User-defined│ │ • Saved filters│                                           │   │
│  │  │ • Dynamic     │ │ • Columns     │                                            │   │
│  │  │ • Relations   │ │ • Sharing     │                                            │   │
│  │  └───────────────┘ └───────────────┘                                            │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           DATABASE LAYER                                          │  │
│  │                                                                                   │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐   │  │
│  │  │  contacts    │ │organizations │ │    deals     │ │  crm_activities      │   │  │
│  │  │              │ │              │ │              │ │                      │   │  │
│  │  │ Person or    │ │ Company      │ │ Open/Won/    │ │ Notes, emails,       │   │  │
│  │  │ company with │ │ with domain, │ │ Lost with    │ │ calls, meetings,     │   │  │
│  │  │ lifecycle    │ │ industry,    │ │ pipeline,    │ │ tasks. Polymorphic   │   │  │
│  │  │ stage, tags  │ │ revenue      │ │ stage, value │ │ subject (contact/    │   │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ │ deal/organization)   │   │  │
│  │                                                      └──────────────────────┘   │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐   │  │
│  │  │  pipelines   │ │ deal_scores  │ │contact_scores│ │  lead_scoring_rules  │   │  │
│  │  │              │ │              │ │              │ │                      │   │  │
│  │  │ Configurable │ │ AI scoring   │ │ 3-category   │ │ Behavioral,          │   │  │
│  │  │ multi-stage  │ │ with factors,│ │ scoring with │ │ demographic,         │   │  │
│  │  │ pipelines    │ │ signals, win │ │ breakdown    │ │ firmographic rules   │   │  │
│  │  │ per venture  │ │ probability  │ │ and decay    │ │ with decay config    │   │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────────┘   │  │
│  │                                                                                   │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐   │  │
│  │  │  forecasts   │ │forecast_items│ │ smart_views  │ │  custom_objects      │   │  │
│  │  │              │ │              │ │              │ │  custom_object_       │   │  │
│  │  │ Period-based │ │ Per-deal     │ │ Saved filter │ │  records             │   │  │
│  │  │ revenue      │ │ categorized  │ │ + column     │ │  object_             │   │  │
│  │  │ forecasts    │ │ as commit/   │ │ configs,     │ │  relationships       │   │  │
│  │  │              │ │ best/pipeline│ │ shareable    │ │                      │   │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────────┘   │  │
│  │                                                                                   │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────────────────────┐ │  │
│  │  │duplicate_    │ │ merge_       │ │  pipeline_stages_v2                      │ │  │
│  │  │rules         │ │ history      │ │                                          │ │  │
│  │  │              │ │              │ │ Enhanced stages with probability,         │ │  │
│  │  │ Match field  │ │ Full audit   │ │ rotting days, required fields,            │ │  │
│  │  │ configs per  │ │ trail of     │ │ automations (on_enter/on_exit/on_time)   │ │  │
│  │  │ object type  │ │ all merges   │ │                                          │ │  │
│  │  └──────────────┘ └──────────────┘ └──────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Submodules

### contacts — Contact Management

Manages person and company contacts with lifecycle tracking, custom fields, tags, lead scoring integration, and ownership assignment.

### companies — Organization Management

Company/organization records with domain deduplication, industry classification, employee count, annual revenue, address data, and linked contacts/deals.

### deals — Deal & Pipeline Management

Sales opportunities tracked through configurable multi-stage pipelines. Supports stage movement, won/lost closing with reasons, Kanban-view grouping, and pipeline-level analytics.

### pipelines — Pipeline Configuration

Customizable sales pipelines per venture with ordered stages, win probabilities per stage, and default pipeline designation.

### activities — Activity Tracking

Polymorphic activity log supporting notes, emails, calls, meetings, and tasks. Each activity links to a contact, deal, or organization and stores type-specific metadata.

### automation — Stage Automation

Pipeline stage automations triggered on entry, exit, or time-delay. Actions include send email, create task, update field, notify, and webhook.

---

## Core Interfaces

### Contact

```typescript
interface Contact {
  id: string;                           // UUID primary key
  ventureId: string;                    // Venture scope for multi-tenancy

  // Type
  type: ContactType;                    // 'person' | 'company'

  // Personal Information
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;

  // Company Information
  company: string | null;
  jobTitle: string | null;

  // Lead Scoring & Lifecycle
  leadScore: number;                    // 0-100+, computed by lead scoring engine
  lifecycleStage: LifecycleStage;       // 'lead' → 'customer' → 'churned'

  // Ownership
  ownerId: string | null;              // Assigned sales rep

  // Extensibility
  customFields: ContactCustomFields;    // Arbitrary key-value data
  tags: string[];                       // Freeform tags

  // Timestamps
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
```

### Deal

```typescript
interface Deal {
  id: string;                           // UUID primary key
  ventureId: string;                    // Venture scope

  // Pipeline Assignment
  pipelineId: string;                   // Which pipeline this deal belongs to
  stage: string;                        // Current stage name within pipeline

  // Related Entities
  contactId: string | null;             // Primary contact
  organizationId: string | null;        // Related company

  // Deal Identity
  name: string;                         // Deal name/title

  // Financial
  value: string | null;                 // Deal value (decimal as string)
  currency: string;                     // Default: 'USD'
  probability: number | null;           // Win probability 0-100

  // Status
  status: DealStatus;                   // 'open' | 'won' | 'lost'

  // Dates
  expectedCloseDate: string | null;     // ISO date string
  actualCloseDate: string | null;       // Set when deal closes

  // Lost reason
  lostReason: string | null;            // Reason when status = 'lost'

  // Ownership
  ownerId: string | null;              // Sales rep

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

type DealStatus = 'open' | 'won' | 'lost';
```

### ScoreResult (Deal Scoring)

```typescript
interface ScoreResult {
  /** Overall deal health score (0-100) */
  score: number;

  /** Data availability confidence (0-1) */
  confidence: number;

  /** Detailed scoring breakdown by category */
  factors: ScoringFactor[];

  /** Positive and negative signals */
  signals: ScoringSignal[];

  /** AI-predicted close date based on historical data */
  predictedCloseDate: string | null;

  /** Predicted deal amount (from deal value or historical average) */
  predictedAmount: string | null;

  /** Sigmoid-mapped win probability (0-100) */
  winProbability: number;

  /** Computed risk level: 'low' | 'medium' | 'high' */
  riskLevel: RiskLevel;
}

interface ScoringFactor {
  name: string;       // e.g., 'Stage Progression', 'Activity Recency'
  score: number;      // Points earned (0 to weight)
  weight: number;     // Maximum possible points
  detail: string;     // Human-readable explanation
}

interface ScoringSignal {
  type: 'positive' | 'negative';
  label: string;      // e.g., 'Late stage', 'Stale deal'
  detail: string;     // e.g., 'Deal is in advanced pipeline stage'
  impact: number;     // Relative importance (-100 to 100)
}

type RiskLevel = 'low' | 'medium' | 'high';
```

### CrmActivity

```typescript
interface CrmActivity {
  id: string;                           // UUID primary key
  ventureId: string;                    // Venture scope

  // Polymorphic Subject
  subjectType: CrmActivitySubjectType;  // 'contact' | 'deal' | 'organization'
  subjectId: string;                    // ID of the linked entity

  // Activity Type
  activityType: CrmActivityType;        // 'note' | 'email' | 'call' | 'meeting' | 'task'

  // Content
  title: string | null;
  description: string | null;

  // Rich Metadata (type-specific data)
  metadata: CrmActivityMetadata;

  // Creator
  createdBy: string | null;             // User ID

  // Timestamps
  createdAt: Date;
}

type CrmActivityType = 'note' | 'email' | 'call' | 'meeting' | 'task';
type CrmActivitySubjectType = 'contact' | 'deal' | 'organization';

interface CrmActivityMetadata {
  // Email-specific
  emailFrom?: string;
  emailTo?: string[];
  emailSubject?: string;
  emailDirection?: 'inbound' | 'outbound';

  // Call-specific
  callDirection?: 'inbound' | 'outbound';
  callDuration?: number;                // seconds
  callOutcome?: 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number';
  callRecordingUrl?: string;

  // Meeting-specific
  meetingStart?: string;                // ISO timestamp
  meetingEnd?: string;
  meetingLocation?: string;
  meetingUrl?: string;                  // Video call link
  meetingAttendees?: Array<{
    email: string;
    name?: string;
    status?: 'pending' | 'accepted' | 'declined' | 'tentative';
  }>;
  meetingOutcome?: 'completed' | 'no_show' | 'rescheduled' | 'cancelled';

  // Task-specific
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

### Forecast

```typescript
interface Forecast {
  id: string;
  ventureId: string;

  period: ForecastPeriod;               // 'monthly' | 'quarterly' | 'yearly'
  periodStart: string;                  // YYYY-MM-DD
  periodEnd: string;

  pipelineId: string | null;            // Optional pipeline filter
  ownerId: string | null;              // Optional owner filter

  // Computed totals
  forecastAmount: string;               // Sum of non-omitted items
  weightedAmount: string;               // Probability-weighted sum
  bestCase: string;                     // commit + best_case items
  worstCase: string;                    // commit items only
  closedWonAmount: string;              // Actual closed-won in period

  status: ForecastStatus;               // 'open' | 'closed'

  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ForecastPeriod = 'monthly' | 'quarterly' | 'yearly';
type ForecastCategory = 'commit' | 'best_case' | 'pipeline' | 'omitted';
```

### SmartView

```typescript
interface SmartView {
  id: string;
  ventureId: string;

  name: string;                         // View name
  objectType: SmartViewObjectType;      // 'contact' | 'organization' | 'deal' | 'custom'

  // Filters
  filters: SmartViewFilter[];           // Filter conditions
  sortBy: SmartViewSort[];              // Sort configuration
  columns: SmartViewColumn[];           // Column visibility and order

  // Sharing
  isDefault: boolean;                   // Default view for object type
  isShared: boolean;                    // Visible to all team members
  ownerId: string | null;              // Creator

  createdAt: Date;
  updatedAt: Date;
}

interface SmartViewFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between' | 'is_null' | 'is_not_null';
  value: unknown;
}
```

### CustomObject

```typescript
interface CustomObject {
  id: string;
  ventureId: string;

  name: string;                         // Singular name (e.g., 'Project')
  pluralName: string;                   // Plural name (e.g., 'Projects')
  slug: string;                         // URL-safe identifier
  icon: string | null;                  // Display icon
  color: string | null;                 // Display color

  // Schema definition
  fields: CustomObjectFieldDef[];       // Dynamic field definitions
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
  options?: string[];                   // For select/multiselect
  defaultValue?: unknown;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}
```

---

## Database Schema

### contacts Table

```typescript
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),

  // Contact Type
  type: text('type', { enum: ['person', 'company'] }).notNull(),

  // Personal Information
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  phone: text('phone'),

  // Company Information
  company: text('company'),
  jobTitle: text('job_title'),

  // Lead Scoring & Lifecycle
  leadScore: integer('lead_score').default(0),
  lifecycleStage: text('lifecycle_stage', {
    enum: ['lead', 'marketing_qualified', 'sales_qualified',
           'opportunity', 'customer', 'evangelist', 'churned'],
  }).default('lead'),

  // Ownership
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),

  // Extensibility
  customFields: jsonb('custom_fields').$type<ContactCustomFields>().default({}),
  tags: jsonb('tags').$type<string[]>().default([]),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_contacts_venture').on(table.ventureId),
  index('idx_contacts_email').on(table.email),
  index('idx_contacts_owner').on(table.ownerId),
  index('idx_contacts_type').on(table.type),
  index('idx_contacts_lifecycle_stage').on(table.lifecycleStage),
  index('idx_contacts_venture_type').on(table.ventureId, table.type),
  index('idx_contacts_venture_lifecycle').on(table.ventureId, table.lifecycleStage),
  index('idx_contacts_venture_owner').on(table.ventureId, table.ownerId),
  index('idx_contacts_lead_score').on(table.leadScore),
]);
```

### deals Table

```typescript
export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),

  // Pipeline Assignment
  pipelineId: uuid('pipeline_id').notNull()
    .references(() => pipelines.id, { onDelete: 'restrict' }),

  // Related Entities
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'set null' }),

  // Deal Identity
  name: text('name').notNull(),

  // Financial
  value: decimal('value', { precision: 15, scale: 2 }),
  currency: text('currency').default('USD'),

  // Pipeline Position
  stage: text('stage').notNull(),
  probability: integer('probability'),

  // Status & Dates
  status: text('status', { enum: ['open', 'won', 'lost'] }).default('open'),
  expectedCloseDate: date('expected_close_date'),
  actualCloseDate: date('actual_close_date'),
  lostReason: text('lost_reason'),

  // Ownership
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_deals_venture').on(table.ventureId),
  index('idx_deals_pipeline').on(table.pipelineId),
  index('idx_deals_contact').on(table.contactId),
  index('idx_deals_organization').on(table.organizationId),
  index('idx_deals_status').on(table.status),
  index('idx_deals_owner').on(table.ownerId),
  index('idx_deals_venture_status').on(table.ventureId, table.status),
  index('idx_deals_venture_pipeline').on(table.ventureId, table.pipelineId),
  index('idx_deals_expected_close').on(table.expectedCloseDate),
]);
```

### deal_scores Table

```typescript
export const dealScores = pgTable('deal_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull()
    .references(() => deals.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),

  // Score
  score: integer('score').notNull().default(0),
  confidence: decimal('confidence', { precision: 5, scale: 2 }),

  // Breakdown
  factors: jsonb('factors').$type<ScoringFactor[]>().notNull().default([]),
  signals: jsonb('signals').$type<ScoringSignal[]>().notNull().default([]),

  // Predictions
  predictedCloseDate: date('predicted_close_date'),
  predictedAmount: decimal('predicted_amount', { precision: 15, scale: 2 }),
  winProbability: decimal('win_probability', { precision: 5, scale: 2 }),
  riskLevel: text('risk_level', { enum: ['low', 'medium', 'high'] }).default('medium'),

  scoredAt: timestamp('scored_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_deal_scores_deal').on(table.dealId),
  index('idx_deal_scores_venture').on(table.ventureId),
  index('idx_deal_scores_score').on(table.score),
  index('idx_deal_scores_risk').on(table.riskLevel),
  index('idx_deal_scores_scored_at').on(table.scoredAt),
]);
```

### contact_scores Table

```typescript
export const contactScores = pgTable('contact_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull()
    .references(() => contacts.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),

  // Scores by category
  totalScore: integer('total_score').notNull().default(0),
  behavioralScore: integer('behavioral_score').notNull().default(0),
  demographicScore: integer('demographic_score').notNull().default(0),
  firmographicScore: integer('firmographic_score').notNull().default(0),

  // Detailed breakdown
  breakdown: jsonb('breakdown').$type<ScoreBreakdown>().notNull().default({ rules: [] }),

  // Activity tracking
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  scoredAt: timestamp('scored_at', { withTimezone: true }).defaultNow().notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_contact_scores_contact').on(table.contactId),
  index('idx_contact_scores_venture').on(table.ventureId),
  index('idx_contact_scores_total').on(table.totalScore),
  index('idx_contact_scores_venture_total').on(table.ventureId, table.totalScore),
]);
```

### forecasts & forecast_items Tables

```typescript
export const forecasts = pgTable('forecasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  period: text('period', { enum: ['monthly', 'quarterly', 'yearly'] }).notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id, { onDelete: 'set null' }),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  forecastAmount: decimal('forecast_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  weightedAmount: decimal('weighted_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  bestCase: decimal('best_case', { precision: 15, scale: 2 }).notNull().default('0'),
  worstCase: decimal('worst_case', { precision: 15, scale: 2 }).notNull().default('0'),
  closedWonAmount: decimal('closed_won_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  status: text('status', { enum: ['open', 'closed'] }).default('open'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_forecasts_venture').on(table.ventureId),
  index('idx_forecasts_period').on(table.period, table.periodStart, table.periodEnd),
  index('idx_forecasts_venture_period').on(table.ventureId, table.period, table.periodStart),
]);

export const forecastItems = pgTable('forecast_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  forecastId: uuid('forecast_id').notNull()
    .references(() => forecasts.id, { onDelete: 'cascade' }),
  dealId: uuid('deal_id').notNull()
    .references(() => deals.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull().default('0'),
  probability: integer('probability'),
  category: text('category', {
    enum: ['commit', 'best_case', 'pipeline', 'omitted'],
  }).notNull().default('pipeline'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_forecast_items_forecast').on(table.forecastId),
  index('idx_forecast_items_deal').on(table.dealId),
  index('idx_forecast_items_category').on(table.category),
]);
```

### crm_activities Table

```typescript
export const crmActivities = pgTable('crm_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),

  // Polymorphic Subject
  subjectType: text('subject_type', {
    enum: ['contact', 'deal', 'organization'],
  }).notNull(),
  subjectId: uuid('subject_id').notNull(),

  // Activity Type
  activityType: text('activity_type', {
    enum: ['note', 'email', 'call', 'meeting', 'task'],
  }).notNull(),

  // Content
  title: text('title'),
  description: text('description'),

  // Rich Metadata
  metadata: jsonb('metadata').$type<CrmActivityMetadata>().default({}),

  // Creator
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_crm_activities_subject').on(table.subjectType, table.subjectId),
  index('idx_crm_activities_venture').on(table.ventureId),
  index('idx_crm_activities_type').on(table.activityType),
  index('idx_crm_activities_created_by').on(table.createdBy),
  index('idx_crm_activities_venture_feed').on(table.ventureId, table.createdAt),
  index('idx_crm_activities_subject_feed').on(table.subjectType, table.subjectId, table.createdAt),
]);
```

---

## Deal Scoring Algorithm

The deal scoring engine evaluates 9 weighted factors to produce a 0-100 score:

| Factor | Weight | What It Measures |
|--------|--------|-----------------|
| Stage Progression | 20 pts | Position in pipeline (stage N of M) |
| Deal Velocity | 15 pts | Deal age vs historical average cycle |
| Activity Recency | 15 pts | Days since last activity on deal |
| Activity Frequency | 10 pts | Activities in last 30 days |
| Meeting Engagement | 10 pts | Number of meetings recorded |
| Email Engagement | 10 pts | Number of emails recorded |
| Deal Size | 10 pts | Value relative to pipeline average |
| Stakeholder Involvement | 5 pts | Unique participants with activities |
| Contact Engagement | 5 pts | Linked contact's lead score |

### Risk Classification

| Score Range | Risk Level | Win Probability |
|-------------|------------|-----------------|
| 0-29 | High | < 20% |
| 30-59 | Medium | 20-70% |
| 60-100 | Low | > 70% |

Win probability uses sigmoid mapping: `P(win) = 100 / (1 + e^(-0.08 × (score - 50)))`

---

## Usage Examples

### Contact Lifecycle Management

```typescript
import { createContact, updateContact, listContacts } from '@mcv/crm';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Create a contact and advance through lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

const contact = await createContact({
  type: 'person',
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'sarah@acmecorp.com',
  company: 'Acme Corp',
  jobTitle: 'VP Engineering',
  lifecycleStage: 'lead',
  tags: ['enterprise', 'inbound-demo'],
  customFields: {
    linkedin: 'https://linkedin.com/in/sarahchen',
    industry: 'SaaS',
    employees: 500,
  },
});

// Advance to sales qualified after discovery call
await updateContact(contact.id, {
  lifecycleStage: 'sales_qualified',
  ownerId: salesRep.id,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: List contacts with filters
// ═══════════════════════════════════════════════════════════════════════════════

const qualified = await listContacts({
  lifecycleStage: 'sales_qualified',
  ownerId: salesRep.id,
  page: 1,
  pageSize: 25,
  sortBy: 'leadScore',
  sortOrder: 'desc',
});

console.log(`${qualified.meta.total} sales-qualified leads`);
```

### Deal Pipeline Operations

```typescript
import { createDeal, moveDealStage, closeDeal, getDealsByStage } from '@mcv/crm';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Create and manage a deal through pipeline
// ═══════════════════════════════════════════════════════════════════════════════

const deal = await createDeal({
  name: 'Acme Corp Enterprise License',
  contactId: contact.id,
  organizationId: acmeCorp.id,
  pipelineId: enterprisePipeline.id,
  stage: 'Discovery',
  value: '150000',
  currency: 'USD',
  probability: 20,
  expectedCloseDate: '2026-06-30',
  ownerId: salesRep.id,
});

// Move deal through stages
await moveDealStage({ id: deal.id, stage: 'Proposal' });
await moveDealStage({ id: deal.id, stage: 'Negotiation' });

// Close deal as won
await closeDeal({
  id: deal.id,
  status: 'won',
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Kanban board view with pipeline summary
// ═══════════════════════════════════════════════════════════════════════════════

const kanban = await getDealsByStage({ pipelineId: enterprisePipeline.id });
// Returns: { stages: [{ name: 'Discovery', deals: [...], totalValue: 450000 }, ...] }

const summary = await getPipelineSummary(enterprisePipeline.id);
console.log(`Pipeline: $${summary.totalValue} across ${summary.dealCount} deals`);
console.log(`Weighted: $${summary.weightedValue}`);
```

### AI Deal Scoring

```typescript
import { scoreDeal, getAtRiskDeals, predictCloseDate } from '@mcv/crm';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Score a deal and inspect factors
// ═══════════════════════════════════════════════════════════════════════════════

const result = await scoreDeal(deal.id);

console.log(`Score: ${result.score}/100 (${result.riskLevel} risk)`);
console.log(`Win probability: ${result.winProbability}%`);
console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
console.log(`Predicted close: ${result.predictedCloseDate}`);

// Inspect scoring factors
for (const factor of result.factors) {
  console.log(`  ${factor.name}: ${factor.score}/${factor.weight} — ${factor.detail}`);
}
// Output:
//   Stage Progression: 12/20 — Stage 3 of 5
//   Deal Velocity: 10/15 — 45 days old (avg: 60 days)
//   Activity Recency: 15/15 — Last activity 2 days ago
//   Meeting Engagement: 9/10 — 3 meetings recorded
//   ...

// Inspect signals
for (const signal of result.signals) {
  console.log(`  ${signal.type === 'positive' ? '✅' : '⚠️'} ${signal.label}: ${signal.detail}`);
}
// Output:
//   ✅ Late stage: Deal is in advanced pipeline stage
//   ✅ High engagement: 8 recent activities
//   ✅ Multiple meetings: Strong meeting engagement

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Monitor at-risk deals
// ═══════════════════════════════════════════════════════════════════════════════

const atRisk = await getAtRiskDeals(10);

for (const deal of atRisk) {
  console.log(`⚠️ ${deal.dealName}: score ${deal.score} (${deal.riskLevel})`);
  if (deal.scoreDelta !== null) {
    console.log(`   Trend: ${deal.scoreDelta > 0 ? '📈' : '📉'} ${deal.scoreDelta} pts`);
  }
}

// Predict close date
const prediction = await predictCloseDate(deal.id);
if (prediction) {
  console.log(`Predicted close: ${prediction.predictedDate}`);
  console.log(`Confidence: ${(prediction.confidence * 100).toFixed(0)}%`);
  console.log(`Based on ${prediction.basedOnDeals} historical deals`);
}
```

### Lead Scoring Engine

```typescript
import {
  createScoringRule,
  evaluateContact,
  getLeaderboard,
  getScoreDistribution,
} from '@mcv/crm';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Configure lead scoring rules
// ═══════════════════════════════════════════════════════════════════════════════

// Behavioral rule: reward active contacts
await createScoringRule({
  name: 'Email Engagement',
  category: 'behavioral',
  rules: [
    { field: 'activity.emailCount', operator: 'gte', value: 5, points: 15 },
    { field: 'activity.meetingCount', operator: 'gte', value: 1, points: 20 },
    { field: 'activity.recentActivities', operator: 'gte', value: 3, points: 10 },
  ],
  maxScore: 45,
  decayEnabled: true,
  decayDays: 30,
  decayPercent: 10,
});

// Demographic rule: ideal customer profile
await createScoringRule({
  name: 'ICP Match',
  category: 'demographic',
  rules: [
    { field: 'jobTitle', operator: 'contains', value: 'VP', points: 20 },
    { field: 'jobTitle', operator: 'contains', value: 'Director', points: 15 },
    { field: 'custom.industry', operator: 'in', value: ['SaaS', 'FinTech'], points: 10 },
  ],
  maxScore: 30,
});

// Firmographic rule: company size
await createScoringRule({
  name: 'Company Fit',
  category: 'firmographic',
  rules: [
    { field: 'org.employeeCount', operator: 'gte', value: 100, points: 10 },
    { field: 'org.annualRevenue', operator: 'gte', value: 10000000, points: 15 },
  ],
  maxScore: 25,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Evaluate and rank contacts
// ═══════════════════════════════════════════════════════════════════════════════

const scoreResult = await evaluateContact(contact.id);
console.log(`Total: ${scoreResult.totalScore}`);
console.log(`  Behavioral: ${scoreResult.behavioralScore}`);
console.log(`  Demographic: ${scoreResult.demographicScore}`);
console.log(`  Firmographic: ${scoreResult.firmographicScore}`);

// Top leads leaderboard
const leaders = await getLeaderboard(20);
for (const lead of leaders) {
  console.log(`${lead.contactName} (${lead.company}): ${lead.totalScore} pts`);
}

// Score distribution for analytics
const distribution = await getScoreDistribution();
// [{ range: '0-10', count: 45 }, { range: '11-20', count: 23 }, ...]
```

### Revenue Forecasting

```typescript
import {
  createForecast,
  getForecastSummary,
  getForecastVsActual,
  getQuotaAttainment,
  getTrendAnalysis,
} from '@mcv/crm';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Create and manage revenue forecast
// ═══════════════════════════════════════════════════════════════════════════════

// Create Q1 forecast — auto-populates with matching open deals
const forecast = await createForecast({
  period: 'quarterly',
  periodStart: '2026-01-01',
  periodEnd: '2026-03-31',
  pipelineId: salesPipeline.id,
});

// Get forecast summary with category breakdown
const summary = await getForecastSummary('quarterly');
for (const fc of summary) {
  console.log(`${fc.period} ${fc.periodStart} → ${fc.periodEnd}`);
  console.log(`  Commit:    $${fc.commit.toLocaleString()}`);
  console.log(`  Best Case: $${fc.bestCase.toLocaleString()}`);
  console.log(`  Pipeline:  $${fc.pipeline.toLocaleString()}`);
  console.log(`  Closed Won: $${fc.closedWon.toLocaleString()}`);
  console.log(`  Gap:        $${fc.gap.toLocaleString()}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Forecast accuracy and quota tracking
// ═══════════════════════════════════════════════════════════════════════════════

const actual = await getForecastVsActual('2026-01-01', '2026-03-31');
console.log(`Forecast: $${actual.forecastAmount.toLocaleString()}`);
console.log(`Actual:   $${actual.closedWonAmount.toLocaleString()}`);
console.log(`Accuracy: ${actual.accuracy}%`);
console.log(`Deals closed: ${actual.dealsClosed}`);

const quota = await getQuotaAttainment(salesRep.id, '2026-01-01', '2026-03-31', 500000);
console.log(`${quota.userName}: ${quota.attainmentPercent}% of quota`);
console.log(`  Closed: $${quota.closedWon.toLocaleString()} / $${quota.quota.toLocaleString()}`);
console.log(`  Gap: $${quota.gap.toLocaleString()}`);

// Multi-quarter trend
const trends = await getTrendAnalysis([
  { start: '2025-07-01', end: '2025-09-30' },
  { start: '2025-10-01', end: '2025-12-31' },
  { start: '2026-01-01', end: '2026-03-31' },
]);
for (const t of trends) {
  console.log(`${t.periodStart}: forecast $${t.forecastAmount} → actual $${t.closedWon} (${t.accuracy}%)`);
}
```

### Duplicate Detection & Merge

```typescript
import { findDuplicates, getMergePreview, mergeRecords, scanForDuplicates } from '@mcv/crm';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Find and merge duplicate contacts
// ═══════════════════════════════════════════════════════════════════════════════

// Check for duplicates before creating a contact
const duplicates = await findDuplicates('contact', {
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'sarah@acmecorp.com',
  phone: '+1 (555) 123-4567',
});

for (const match of duplicates) {
  console.log(`Match: ${match.matchedRecordId} (${match.confidence}% confidence)`);
  console.log(`  Reasons: ${match.matchReasons.join(', ')}`);
  // "Reasons: Exact email match, Name similarity: 100%"
}

// Preview merge before executing
const preview = await getMergePreview('contact', survivor.id, duplicate.id);
console.log(`Conflicts: ${preview.conflicts.length}`);
for (const c of preview.conflicts) {
  console.log(`  ${c.field}: "${c.survivorValue}" vs "${c.mergedValue}"`);
}

// Merge with field-level control
await mergeRecords('contact', survivor.id, duplicate.id, {
  phone: 'merged',       // Keep the duplicate's phone
  jobTitle: 'survivor',  // Keep the survivor's job title
}, currentUser.id);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: Batch scan for duplicate groups
// ═══════════════════════════════════════════════════════════════════════════════

const groups = await scanForDuplicates('contact');
console.log(`Found ${groups.length} duplicate groups`);

for (const group of groups) {
  console.log(`Group: ${group.records.length} records (best match: ${group.bestMatch}%)`);
  for (const record of group.records) {
    const data = record.data as { firstName: string; lastName: string; email: string };
    console.log(`  ${data.firstName} ${data.lastName} <${data.email}> — ${record.confidence}%`);
    console.log(`    Reasons: ${record.matchReasons.join(', ')}`);
  }
}
```

### Custom Objects & Smart Views

```typescript
import { createCustomObject, createCustomRecord, createSmartView, applySmartView } from '@mcv/crm';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Define and use custom CRM objects
// ═══════════════════════════════════════════════════════════════════════════════

// Define a custom "Subscription" object
const subscriptionObj = await createCustomObject({
  name: 'Subscription',
  pluralName: 'Subscriptions',
  slug: 'subscriptions',
  icon: '📋',
  color: '#4F46E5',
  fields: [
    { key: 'plan', label: 'Plan', type: 'select', options: ['starter', 'pro', 'enterprise'], required: true },
    { key: 'mrr', label: 'MRR', type: 'currency', required: true },
    { key: 'start_date', label: 'Start Date', type: 'date', required: true },
    { key: 'renewal_date', label: 'Renewal Date', type: 'date' },
    { key: 'auto_renew', label: 'Auto-Renew', type: 'boolean' },
    { key: 'seats', label: 'Seats', type: 'number', validation: { min: 1, max: 10000 } },
  ],
});

// Create records in the custom object
const sub = await createCustomRecord(subscriptionObj.id, {
  plan: 'enterprise',
  mrr: 5000,
  start_date: '2026-01-01',
  renewal_date: '2027-01-01',
  auto_renew: true,
  seats: 50,
});

// Link subscription to a contact
await createRelationship({
  sourceObjectType: 'contact',
  sourceObjectId: contact.id,
  targetObjectType: 'custom',
  targetObjectId: sub.id,
  relationshipType: 'has_many',
  label: 'Subscriptions',
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: Create and apply smart views
// ═══════════════════════════════════════════════════════════════════════════════

const hotLeadsView = await createSmartView({
  name: 'Hot Leads',
  objectType: 'contact',
  filters: [
    { field: 'leadScore', operator: 'gte', value: 80 },
    { field: 'lifecycleStage', operator: 'in', value: ['sales_qualified', 'opportunity'] },
    { field: 'ownerId', operator: 'is_not_null', value: true },
  ],
  sortBy: [{ field: 'leadScore', direction: 'desc' }],
  columns: [
    { field: 'firstName', label: 'First Name', visible: true, order: 0 },
    { field: 'lastName', label: 'Last Name', visible: true, order: 1 },
    { field: 'email', label: 'Email', visible: true, order: 2 },
    { field: 'company', label: 'Company', visible: true, order: 3 },
    { field: 'leadScore', label: 'Score', visible: true, order: 4 },
    { field: 'lifecycleStage', label: 'Stage', visible: true, order: 5 },
  ],
  isShared: true,
  isDefault: false,
});

// Apply the view to get filtered results
const results = await applySmartView(hotLeadsView.id);
```

### Activity Timeline

```typescript
import { logActivity, getActivities } from '@mcv/crm';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: Log various activity types
// ═══════════════════════════════════════════════════════════════════════════════

// Log a discovery call
await logActivity({
  subjectType: 'deal',
  subjectId: deal.id,
  activityType: 'call',
  title: 'Discovery call with VP Engineering',
  description: 'Discussed pain points, current tooling, and budget timeline.',
  metadata: {
    callDirection: 'outbound',
    callDuration: 1800, // 30 minutes
    callOutcome: 'answered',
    phoneNumber: '+1-555-123-4567',
  },
});

// Log a meeting with attendees
await logActivity({
  subjectType: 'deal',
  subjectId: deal.id,
  activityType: 'meeting',
  title: 'Technical deep dive',
  metadata: {
    meetingStart: '2026-02-15T14:00:00Z',
    meetingEnd: '2026-02-15T15:30:00Z',
    meetingUrl: 'https://zoom.us/j/123456789',
    meetingAttendees: [
      { email: 'sarah@acmecorp.com', name: 'Sarah Chen', status: 'accepted' },
      { email: 'dev@acmecorp.com', name: 'Dev Lead', status: 'pending' },
    ],
    meetingOutcome: 'completed',
  },
});

// Get chronological timeline for a deal
const timeline = await getActivities({
  subjectType: 'deal',
  subjectId: deal.id,
  limit: 50,
});

for (const activity of timeline) {
  console.log(`${activity.createdAt}: [${activity.activityType}] ${activity.title}`);
}
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 |
|-----------|--------|-----|
| Contact list (paginated) | < 50ms | < 150ms |
| Contact search (autocomplete) | < 30ms | < 80ms |
| Deal by stage (Kanban) | < 100ms | < 300ms |
| Deal score (single) | < 200ms | < 500ms |
| Deal score (batch, 100 deals) | < 10s | < 30s |
| Lead score (single) | < 100ms | < 300ms |
| Duplicate scan (1000 contacts) | < 2s | < 5s |
| Forecast summary | < 100ms | < 300ms |
| Smart view apply | < 80ms | < 200ms |

### Throughput

| Metric | Standard | Enterprise |
|--------|----------|------------|
| Contacts per venture | 100,000 | 1,000,000+ |
| Deals per venture | 10,000 | 100,000+ |
| Activities per venture | 500,000 | 5,000,000+ |
| Concurrent CRM users | 50 | 500+ |

### Optimization Strategies

1. **Composite indexes** — All common query patterns covered (venture + status, venture + pipeline, etc.)
2. **Paginated queries** — Cursor-based and offset pagination for large datasets
3. **Parallel context building** — Deal scoring gathers 10 metrics via `Promise.all`
4. **Batch scoring** — Score all open deals in background cron, not on every view
5. **Duplicate scan limits** — Capped at 1000/2000 records per scan to prevent timeouts
6. **Async audit logging** — Audit events don't block mutation responses

---

## Security Considerations

### Multi-Tenancy & Isolation

- **Venture-scoped queries**: Every query includes `ventureId` filter for tenant isolation
- **Row-Level Security (RLS)**: PostgreSQL RLS policies enforce venture isolation at database level
- **Permission procedures**: All routes use `permissionProcedure('resource', 'action')` for RBAC
- **Service role bypass**: Service role can bypass RLS for cross-venture operations

### Data Privacy

- **Activity creator tracking**: Activities record `createdBy` for attribution
- **Merge audit trail**: All merge operations preserve `mergeHistory` with full data snapshots
- **Soft deletion**: Deals use `onDelete: 'set null'` for contacts/orgs to preserve referential data
- **Custom field sanitization**: User-defined custom fields validated against schema definitions

### Access Control

| Resource | Read | Create | Update | Delete |
|----------|------|--------|--------|--------|
| Contacts | `contacts:read` | `contacts:create` | `contacts:update` | `contacts:delete` |
| Organizations | `organizations:read` | `organizations:create` | `organizations:update` | `organizations:delete` |
| Deals | `deals:read` | `deals:create` | `deals:update` | `deals:delete` |
| CRM V2 (scoring, forecast) | `deals:read` / `contacts:read` | `deals:create` / `contacts:create` | `deals:update` / `contacts:update` | `contacts:delete` |
| Smart Views | Protected (auth) | Protected | Protected | Protected |

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `contacts.created` | data | New contact created |
| `contacts.updated` | data | Contact fields updated |
| `contacts.deleted` | data | Contact deleted |
| `contacts.bulk_updated` | data | Bulk contact update |
| `contacts.bulk_deleted` | data | Bulk contact deletion |
| `organizations.created` | data | New organization created |
| `organizations.updated` | data | Organization updated |
| `organizations.deleted` | data | Organization deleted |
| `organizations.bulk_deleted` | data | Bulk organization deletion |
| `deals.created` | data | New deal created |
| `deals.updated` | data | Deal fields updated |
| `deals.stage_changed` | workflow | Deal moved to new stage |
| `deals.closed_won` | revenue | Deal closed as won |
| `deals.closed_lost` | revenue | Deal closed as lost |
| `deals.deleted` | data | Deal deleted |
| `deals.scored` | analytics | Deal AI score computed |
| `contacts.scored` | analytics | Contact lead score computed |
| `contacts.merged` | data | Two contacts merged |
| `organizations.merged` | data | Two organizations merged |
| `forecast.created` | analytics | New forecast period created |
| `smart_view.created` | config | Smart view saved |
| `custom_object.created` | config | Custom object defined |

---

## Environment Variables

```bash
# CRM Configuration
CRM_DEFAULT_PIPELINE_STAGES=5            # Default stages for new pipelines
CRM_MAX_CONTACTS_PER_VENTURE=1000000     # Contact limit per venture
CRM_MAX_DEALS_PER_VENTURE=100000         # Deal limit per venture
CRM_MAX_CUSTOM_OBJECTS=50                # Max custom objects per venture
CRM_MAX_CUSTOM_FIELDS=100               # Max fields per custom object

# Scoring Configuration
CRM_DEAL_SCORE_BATCH_SIZE=100            # Deals per batch scoring run
CRM_LEAD_SCORE_BATCH_SIZE=5000           # Contacts per batch scoring run
CRM_LEAD_DECAY_INTERVAL_DAYS=30          # Default decay period
CRM_LEAD_DECAY_PERCENT=10               # Default decay percentage

# Duplicate Detection
CRM_DUPLICATE_SCAN_LIMIT=2000            # Max records per duplicate scan
CRM_DUPLICATE_CONFIDENCE_THRESHOLD=60    # Min confidence for duplicate match
CRM_FUZZY_NAME_THRESHOLD=85             # Min name similarity percentage

# Forecast
CRM_FORECAST_AUTO_POPULATE=true          # Auto-add matching deals to forecast
CRM_FORECAST_COMMIT_THRESHOLD=90         # Probability % for commit category
CRM_FORECAST_BEST_CASE_THRESHOLD=70      # Probability % for best_case category

# Cron Schedules
CRM_BATCH_SCORE_CRON="0 2 * * *"         # Batch deal scoring at 2 AM daily
CRM_LEAD_DECAY_CRON="0 3 * * 1"          # Lead decay every Monday 3 AM
CRM_DUPLICATE_SCAN_CRON="0 4 * * 0"      # Weekly duplicate scan Sundays 4 AM
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `CONTACT_NOT_FOUND` | 404 | Contact does not exist or not in venture |
| `ORGANIZATION_NOT_FOUND` | 404 | Organization does not exist |
| `DEAL_NOT_FOUND` | 404 | Deal does not exist |
| `PIPELINE_NOT_FOUND` | 404 | Pipeline does not exist |
| `DUPLICATE_DOMAIN` | 409 | Organization with this domain already exists |
| `INVALID_STAGE` | 400 | Stage does not exist in pipeline |
| `VENTURE_REQUIRED` | 400 | Venture context required for CRM operations |
| `SCORING_RULE_NOT_FOUND` | 404 | Lead scoring rule does not exist |
| `FORECAST_NOT_FOUND` | 404 | Forecast period does not exist |
| `FORECAST_ITEM_NOT_FOUND` | 404 | Forecast item does not exist |
| `MERGE_RECORD_NOT_FOUND` | 404 | One or both records not found for merge |
| `VIEW_NOT_FOUND` | 404 | Smart view does not exist |
| `CUSTOM_OBJECT_NOT_FOUND` | 404 | Custom object definition does not exist |
| `CUSTOM_OBJECT_SLUG_EXISTS` | 409 | Custom object slug already in use |
| `DATABASE_UNAVAILABLE` | 500 | Database connection not available |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-orm | ^0.29.x | Database ORM for all CRM queries |
| @trpc/server | ^10.x | Type-safe API router |
| zod | ^3.x | Schema validation for inputs |
| uuid | ^9.x | UUID generation for primary keys |

---

## Testing Notes

### Unit Testing

```typescript
import { DealScoringService } from '@mcv/crm';

describe('Deal Scoring', () => {
  it('should score a deal with full context', async () => {
    const service = new DealScoringService('test-venture');
    const result = await service.scoreDeal(testDeal.id);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.factors).toHaveLength(9);
    expect(result.riskLevel).toMatch(/^(low|medium|high)$/);
    expect(result.winProbability).toBeGreaterThanOrEqual(0);
  });

  it('should classify high-risk deals correctly', async () => {
    // Deal with no activities, old, no meetings
    const result = await service.scoreDeal(staleDeal.id);
    expect(result.score).toBeLessThan(30);
    expect(result.riskLevel).toBe('high');
    expect(result.signals.some(s => s.label === 'No recent activity')).toBe(true);
  });
});

describe('Duplicate Detection', () => {
  it('should detect exact email matches at 98% confidence', async () => {
    const service = new DuplicateDetectionService('test-venture');
    const matches = await service.findDuplicates('contact', {
      email: 'sarah@acmecorp.com',
    });

    expect(matches[0]?.confidence).toBe(98);
    expect(matches[0]?.matchReasons).toContain('Exact email match');
  });

  it('should detect fuzzy name matches above threshold', async () => {
    const matches = await service.findDuplicates('contact', {
      firstName: 'Sara',  // Missing 'h'
      lastName: 'Chen',
    });

    expect(matches[0]?.confidence).toBeGreaterThanOrEqual(85);
    expect(matches[0]?.matchReasons[0]).toContain('Name similarity');
  });
});

describe('Lead Scoring', () => {
  it('should evaluate contact across all rule categories', async () => {
    const service = new LeadScoringService('test-venture');
    const result = await service.evaluateContact(contact.id);

    expect(result.totalScore).toBe(
      result.behavioralScore + result.demographicScore + result.firmographicScore
    );
    expect(result.breakdown.rules.length).toBeGreaterThan(0);
  });
});
```

---

*@mcv/domains/crm — Customer Relationship Management*
