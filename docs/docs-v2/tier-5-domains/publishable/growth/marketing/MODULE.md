# @mcv/growth/marketing

> **Marketing Automation** — Campaign orchestration, journey building, lead scoring, audience segmentation, and cross-channel coordination for the MCV.ONE platform.

| Field | Value |
|---|---|
| **Package** | `@mcv/growth/marketing` |
| **Domain** | `growth` |
| **Tier** | 5 — Domain Module |
| **Runtime** | Server (Node.js 20+) |
| **DB** | Supabase PostgreSQL via Drizzle ORM |
| **Transport** | tRPC v11 + Redpanda (journey events) |
| **Multi-tenant** | Row-Level Security (RLS) on all tables |
| **Since** | 0.14.0 |
| **Status** | Stable |

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Exports](#2-exports)
3. [Architecture](#3-architecture)
4. [Core Interfaces](#4-core-interfaces)
5. [Database Schemas](#5-database-schemas)
6. [Code Examples](#6-code-examples)
7. [Error Codes](#7-error-codes)
8. [Security](#8-security)
9. [Environment Variables](#9-environment-variables)
10. [Dependencies](#10-dependencies)
11. [Testing](#11-testing)

---

## 1. Purpose

Modern marketing demands coordinated execution across dozens of channels — email, social, paid ads, SMS, push notifications, in-app messaging — all while respecting user consent, optimizing budgets, and measuring attribution down to the individual touchpoint. `@mcv/growth/marketing` is the orchestration layer that makes this possible.

### What This Module Solves

**Fragmented campaign execution.** Marketing teams juggle separate tools for email, ads, and social. This module unifies campaign creation, scheduling, and tracking into a single multi-channel model. One campaign can span email sequences, social posts, ad placements, and SMS blasts — all tracked under a shared budget and goal framework.

**Manual customer journeys.** Instead of writing code for every drip sequence, the Journey Builder provides a visual, declarative model: triggers fire, conditions branch, actions execute, delays wait, and A/B splits test — all evaluated by a stateful engine backed by Redpanda event streams.

**Lead scoring guesswork.** Behavioral events (page views, email opens, form submissions) and demographic attributes (job title, company size, industry) feed a configurable scoring pipeline. Scores decay over time to reflect engagement recency. When a lead crosses MQL or SQL thresholds, routing rules push them to sales automatically.

**Consent chaos.** GDPR, CCPA, LGPD, and evolving privacy regulations require explicit consent tracking per channel and purpose. The Consent Management subsystem maintains a complete audit trail of opt-in/opt-out events, powers a self-service preference center, and enforces suppression at send time.

**Budget blindness.** Marketing budgets flow through the Budget & Planning engine, which tracks spend per channel, forecasts ROI based on historical performance, and recommends channel mix optimization to maximize return.

### Design Philosophy

- **Event-driven first** — Every meaningful marketing action produces a domain event. Journey evaluation, lead scoring, and analytics all consume these events asynchronously via Redpanda.
- **Multi-tenant by default** — All tables enforce RLS. Tenant isolation is guaranteed at the database level, not just the application level.
- **Composable** — Each subsystem (campaigns, journeys, scoring, consent) is independently usable. You can use lead scoring without the journey builder, or consent management without campaigns.
- **Privacy-centric** — Consent checks are enforced at the service layer, not delegated to callers. If consent is missing or withdrawn, the system refuses to send.
- **Auditable** — Campaign sends, journey state transitions, consent changes, and score mutations all produce immutable audit records.

---

## 2. Exports

### Service Layer

```typescript
// Primary service — orchestrates all marketing capabilities
export { MarketingService } from './services/marketing.service';
export { createMarketingService } from './services/marketing.service';

// Campaign management
export { CampaignService } from './services/campaign.service';
export { CampaignScheduler } from './services/campaign-scheduler.service';
export { CampaignAnalyticsService } from './services/campaign-analytics.service';

// Journey builder & engine
export { JourneyService } from './services/journey.service';
export { JourneyEngine } from './engine/journey.engine';
export { JourneyStepExecutor } from './engine/step-executor';
export { JourneyEventProcessor } from './engine/event-processor';

// Lead scoring
export { LeadScoringService } from './services/lead-scoring.service';
export { ScoreDecayProcessor } from './services/score-decay.processor';
export { LeadRoutingService } from './services/lead-routing.service';

// Audience segmentation
export { AudienceService } from './services/audience.service';
export { SegmentEvaluator } from './services/segment-evaluator.service';

// Landing pages
export { LandingPageService } from './services/landing-page.service';
export { ConversionTracker } from './services/conversion-tracker.service';

// Personalization
export { PersonalizationService } from './services/personalization.service';
export { PersonalizationEngine } from './engine/personalization.engine';

// Consent management
export { ConsentService } from './services/consent.service';
export { PreferenceCenterService } from './services/preference-center.service';

// Budget & planning
export { MarketingBudgetService } from './services/marketing-budget.service';
export { ROIForecastService } from './services/roi-forecast.service';
export { ChannelMixOptimizer } from './services/channel-mix-optimizer.service';

// Marketing analytics
export { MarketingAnalyticsService } from './services/marketing-analytics.service';
export { AttributionService } from './services/attribution.service';
export { FunnelAnalyticsService } from './services/funnel-analytics.service';
```

### Types & Interfaces

```typescript
export type {
  Campaign,
  CampaignStatus,
  CampaignChannel,
  CampaignGoal,
  CampaignCreate,
  CampaignUpdate,
  CampaignFilter,
  CampaignMetrics,
  CampaignCalendarEntry,
} from './types/campaign.types';

export type {
  Journey,
  JourneyStatus,
  JourneyStep,
  JourneyStepType,
  JourneyTrigger,
  JourneyCondition,
  JourneyAction,
  JourneyDelay,
  JourneyBranch,
  JourneySplit,
  JourneyEnrollment,
  JourneyEnrollmentStatus,
  JourneyCreate,
  JourneyUpdate,
  JourneyFilter,
  JourneyMetrics,
} from './types/journey.types';

export type {
  LeadScore,
  LeadScoreEvent,
  ScoringRule,
  ScoringRuleType,
  ScoreThreshold,
  ScoreDecayConfig,
  LeadScoreCreate,
  LeadScoreFilter,
  LeadRoutingRule,
  LeadQualificationLevel,
} from './types/lead-score.types';

export type {
  LandingPage,
  LandingPageStatus,
  LandingPageVersion,
  LandingPageConversion,
  LandingPageCreate,
  LandingPageUpdate,
  LandingPageFilter,
  LandingPageMetrics,
  FormField,
  FormSubmission,
  UTMParams,
} from './types/landing-page.types';

export type {
  MarketingConsent,
  ConsentChannel,
  ConsentPurpose,
  ConsentStatus,
  ConsentEvent,
  ConsentCreate,
  ConsentUpdate,
  ConsentFilter,
  PreferenceCenter,
  PreferenceCenterConfig,
} from './types/consent.types';

export type {
  MarketingBudget,
  BudgetAllocation,
  BudgetPeriod,
  BudgetStatus,
  SpendEntry,
  ROIForecast,
  ChannelMixRecommendation,
  BudgetCreate,
  BudgetUpdate,
  BudgetFilter,
} from './types/budget.types';

export type {
  PersonalizationRule,
  PersonalizationRuleType,
  PersonalizationCondition,
  PersonalizationAction,
  PersonalizationCreate,
  PersonalizationUpdate,
  PersonalizationFilter,
  PersonalizationResult,
} from './types/personalization.types';

export type {
  AttributionModel,
  AttributionTouch,
  AttributionResult,
  ChannelAttribution,
  FunnelStage,
  FunnelConversion,
  EngagementScore,
} from './types/analytics.types';
```

### Database Schema

```typescript
export {
  campaigns,
  campaignChannels,
  campaignGoals,
  journeys,
  journeySteps,
  journeyEnrollments,
  journeyEnrollmentEvents,
  leadScores,
  leadScoreEvents,
  scoringRules,
  landingPages,
  landingPageVersions,
  landingPageConversions,
  formSubmissions,
  marketingConsents,
  consentEvents,
  marketingBudgets,
  budgetAllocations,
  spendEntries,
  personalizationRules,
} from './schema';

export { marketingRelations } from './schema/relations';
```

### tRPC Router

```typescript
export { marketingRouter } from './router';
export type { MarketingRouter } from './router';
```

### Events

```typescript
export {
  MARKETING_EVENTS,
  CampaignCreatedEvent,
  CampaignLaunchedEvent,
  CampaignPausedEvent,
  CampaignCompletedEvent,
  JourneyEnrolledEvent,
  JourneyStepExecutedEvent,
  JourneyCompletedEvent,
  JourneyExitedEvent,
  LeadScoreChangedEvent,
  LeadQualifiedEvent,
  LeadRoutedEvent,
  ConsentGrantedEvent,
  ConsentRevokedEvent,
  LandingPageConvertedEvent,
  PersonalizationAppliedEvent,
  BudgetAllocatedEvent,
  BudgetExhaustedEvent,
} from './events';
```

### Constants

```typescript
export {
  CAMPAIGN_STATUSES,
  CAMPAIGN_CHANNEL_TYPES,
  JOURNEY_STEP_TYPES,
  JOURNEY_STATUSES,
  ENROLLMENT_STATUSES,
  CONSENT_CHANNELS,
  CONSENT_PURPOSES,
  CONSENT_STATUSES,
  SCORING_RULE_TYPES,
  LEAD_QUALIFICATION_LEVELS,
  ATTRIBUTION_MODELS,
  LANDING_PAGE_STATUSES,
  BUDGET_PERIODS,
  DEFAULT_SCORE_DECAY_RATE,
  DEFAULT_MQL_THRESHOLD,
  DEFAULT_SQL_THRESHOLD,
  MAX_JOURNEY_STEPS,
  MAX_JOURNEY_ENROLLMENTS_BATCH,
  MAX_AB_SPLIT_VARIANTS,
} from './constants';
```

---

## 3. Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        tRPC API Layer                               │
│  campaignRouter · journeyRouter · scoringRouter · consentRouter     │
│  landingPageRouter · budgetRouter · personalizationRouter           │
└─────────┬────────────────────────┬──────────────────────┬───────────┘
          │                        │                      │
          ▼                        ▼                      ▼
┌─────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│ MarketingService │  │   JourneyEngine      │  │ LeadScoringServ. │
│                 │  │                      │  │                  │
│ • createCampaign│  │ • evaluateEnrollment │  │ • recordEvent    │
│ • launchCampaign│  │ • executeStep        │  │ • calculateScore │
│ • pauseCampaign │  │ • evaluateCondition  │  │ • applyDecay     │
│ • trackGoal     │  │ • processSplit       │  │ • checkThresholds│
│ • getMetrics    │  │ • handleDelay        │  │ • routeLead      │
└────────┬────────┘  └──────────┬───────────┘  └────────┬─────────┘
         │                      │                       │
         ▼                      ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Redpanda Event Bus                                │
│                                                                     │
│  Topics:                                                            │
│  • marketing.campaigns       — campaign lifecycle events            │
│  • marketing.journeys        — journey enrollment & step events     │
│  • marketing.scoring         — lead score changes                   │
│  • marketing.consent         — consent grant/revoke events          │
│  • marketing.conversions     — landing page & goal conversions      │
│  • marketing.personalization — personalization decisions            │
└─────────┬────────────────────────┬──────────────────────┬───────────┘
          │                        │                      │
          ▼                        ▼                      ▼
┌─────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│  Analytics      │  │  Consent Enforcer    │  │  Budget Tracker  │
│  Aggregator     │  │                      │  │                  │
│                 │  │ • checkSendConsent   │  │ • trackSpend     │
│ • attribution   │  │ • recordOptIn       │  │ • checkBudget    │
│ • funnelMetrics │  │ • recordOptOut      │  │ • forecastROI    │
│ • engagementScr │  │ • enforceSuppress   │  │ • optimizeMix    │
└─────────────────┘  └──────────────────────┘  └──────────────────┘
          │                        │                      │
          ▼                        ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL (with RLS)                          │
│                                                                     │
│  campaigns · campaign_channels · campaign_goals                     │
│  journeys · journey_steps · journey_enrollments                     │
│  journey_enrollment_events                                          │
│  lead_scores · lead_score_events · scoring_rules                    │
│  landing_pages · landing_page_versions · landing_page_conversions   │
│  form_submissions                                                   │
│  marketing_consents · consent_events                                │
│  marketing_budgets · budget_allocations · spend_entries             │
│  personalization_rules                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Journey Engine — Deep Dive

The Journey Engine is the heart of the marketing automation system. It evaluates enrolled contacts through a directed acyclic graph (DAG) of steps, executing actions, evaluating conditions, waiting on delays, and splitting traffic for A/B tests.

```
┌──────────────────────────────────────────────────────────────────┐
│                    Journey Engine Pipeline                        │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Trigger  │───▶│ Evaluate │───▶│ Execute  │───▶│ Advance  │  │
│  │ Detector │    │ Condition│    │ Action   │    │ Position │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │         │
│       ▼               ▼               ▼               ▼         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Enroll   │    │ Branch   │    │ Record   │    │ Check    │  │
│  │ Contact  │    │ or Skip  │    │ Event    │    │ Complete │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

#### Journey Step Types

| Step Type | Description | Configuration |
|-----------|-------------|---------------|
| `trigger` | Entry point — event-based, segment-based, or manual | `{ event?: string; segmentId?: string; schedule?: CronExpr }` |
| `condition` | Boolean evaluation — branches into yes/no paths | `{ field: string; operator: ComparisonOp; value: any }` |
| `action` | Executes a marketing action (send email, tag, etc.) | `{ actionType: ActionType; config: ActionConfig }` |
| `delay` | Waits a specified duration or until a date/time | `{ duration?: Duration; until?: DateExpr; businessDays?: boolean }` |
| `branch` | Multi-way conditional branch (if/else-if/else) | `{ conditions: BranchCondition[]; defaultStepId?: string }` |
| `split` | A/B or multivariate traffic split | `{ variants: SplitVariant[]; winnerCriteria?: WinnerCriteria }` |
| `wait_for_event` | Pauses until a specific event occurs or times out | `{ event: string; timeout: Duration; timeoutStepId?: string }` |
| `goal` | Marks a conversion goal — optionally exits journey | `{ goalId: string; exitOnGoal?: boolean }` |
| `exit` | Removes enrollment from the journey | `{ reason?: string }` |

#### Enrollment State Machine

```
                    ┌──────────┐
                    │  PENDING  │
                    └─────┬────┘
                          │ trigger matches
                          ▼
                    ┌──────────┐
              ┌────▶│  ACTIVE   │◀────┐
              │     └─────┬────┘     │
              │           │          │
              │     ┌─────┼─────┐   │
              │     │     │     │   │
              │     ▼     ▼     ▼   │
              │  ┌────┐┌────┐┌────┐ │
              │  │WAIT││COND││ACTN│ │
              │  └──┬─┘└──┬─┘└──┬─┘ │
              │     │     │     │   │
              │     └─────┼─────┘   │
              │           │         │
              │     step complete   │
              └───────────┘         │
                                    │
              ┌──────────┐          │
              │ COMPLETED │◀─── last step reached
              └──────────┘
              ┌──────────┐
              │  EXITED   │◀─── exit step or goal met
              └──────────┘
              ┌──────────┐
              │  FAILED   │◀─── unrecoverable error
              └──────────┘
              ┌──────────┐
              │  PAUSED   │◀─── journey paused by admin
              └──────────┘
```

#### Event-Driven Processing

Journey events flow through Redpanda for reliable, ordered processing:

```typescript
// Topic: marketing.journeys
interface JourneyEvent {
  eventId: string;
  tenantId: string;
  journeyId: string;
  enrollmentId: string;
  contactId: string;
  stepId: string;
  eventType: 'enrolled' | 'step_entered' | 'step_executed' | 'step_skipped'
    | 'condition_evaluated' | 'split_assigned' | 'delay_started'
    | 'delay_completed' | 'goal_reached' | 'exited' | 'completed' | 'failed';
  metadata: Record<string, unknown>;
  timestamp: string; // ISO 8601
}
```

The `JourneyEventProcessor` consumes events in partition-key order (keyed by `enrollmentId`) to guarantee per-enrollment ordering:

```
Redpanda topic: marketing.journeys
  ├── Partition 0: enrollments A, D, G  →  Consumer 0
  ├── Partition 1: enrollments B, E, H  →  Consumer 1
  └── Partition 2: enrollments C, F, I  →  Consumer 2
```

### Lead Scoring Pipeline

The lead scoring system operates as a real-time event processing pipeline that aggregates behavioral and demographic signals into a composite score.

```
┌─────────────────────────────────────────────────────────────┐
│                Lead Scoring Pipeline                         │
│                                                             │
│  ┌──────────────┐                                           │
│  │ Behavioral   │  page_view (+2)                           │
│  │ Events       │  email_open (+5)                          │
│  │              │  email_click (+10)                         │
│  │ (Redpanda)   │  form_submit (+20)                        │
│  │              │  demo_request (+50)                        │
│  │              │  pricing_page (+15)                        │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │ Score        │    │ Demographic  │  job_title (+10-30)    │
│  │ Calculator   │◀──▶│ Enrichment   │  company_size (+5-25) │
│  │              │    │              │  industry (+5-20)      │
│  │ behavioral + │    │ (on profile  │  revenue (+5-30)      │
│  │ demographic  │    │  update)     │                       │
│  └──────┬───────┘    └──────────────┘                       │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │ Score Decay  │  Reduces score by configurable %          │
│  │ Processor    │  per day/week of inactivity.              │
│  │              │  Runs on cron schedule.                    │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │ Threshold    │───▶│ Lead Routing │                       │
│  │ Evaluator    │    │ Service      │                       │
│  │              │    │              │                       │
│  │ MQL ≥ 50     │    │ → assign rep │                       │
│  │ SQL ≥ 100    │    │ → create opp │                       │
│  │              │    │ → notify CRM │                       │
│  └──────────────┘    └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

#### Scoring Formula

```
total_score = behavioral_score + demographic_score

behavioral_score = Σ(event_points × recency_weight) − decay_penalty
demographic_score = Σ(attribute_points)

recency_weight = e^(−λ × days_since_event)
decay_penalty = Σ(daily_decay_rate × days_inactive)
```

### Consent Enforcement Architecture

Consent is not advisory — it is enforced at the service layer before any marketing communication is attempted.

```
┌──────────────────────────────────────────────────────────┐
│                Consent Enforcement Flow                   │
│                                                          │
│  Marketing Action Request                                │
│         │                                                │
│         ▼                                                │
│  ┌──────────────┐                                        │
│  │ Consent      │  Check: does contact have active       │
│  │ Enforcer     │  consent for this channel + purpose?   │
│  └──────┬───────┘                                        │
│         │                                                │
│    ┌────┴────┐                                           │
│    │         │                                           │
│    ▼         ▼                                           │
│  ┌────┐   ┌────────┐                                    │
│  │ YES│   │   NO   │                                    │
│  └──┬─┘   └───┬────┘                                    │
│     │         │                                          │
│     ▼         ▼                                          │
│  Proceed   ┌──────────┐                                  │
│  with      │ Suppress │  Log suppression event.          │
│  send      │ & Log    │  Return MKTG_CONSENT_MISSING.    │
│            └──────────┘                                  │
└──────────────────────────────────────────────────────────┘
```

### Personalization Engine

The Personalization Engine evaluates rules at render time to tailor content, offers, and experiences to individual users.

```
┌────────────────────────────────────────────────────────────┐
│              Personalization Pipeline                       │
│                                                            │
│  Request Context                                           │
│  ┌──────────────────┐                                      │
│  │ user attributes  │                                      │
│  │ behavioral data  │                                      │
│  │ segment members  │                                      │
│  │ device / geo     │                                      │
│  └────────┬─────────┘                                      │
│           │                                                │
│           ▼                                                │
│  ┌──────────────────┐                                      │
│  │ Rule Evaluator   │  Evaluates rules in priority order.  │
│  │                  │  First matching rule wins.            │
│  │  Rule 1: VIP     │  ──▶ Show premium offer              │
│  │  Rule 2: New     │  ──▶ Show onboarding                 │
│  │  Rule 3: Churn   │  ──▶ Show retention offer            │
│  │  Default         │  ──▶ Show standard content            │
│  └────────┬─────────┘                                      │
│           │                                                │
│           ▼                                                │
│  ┌──────────────────┐                                      │
│  │ Content Resolver │  Fetches the content variant          │
│  │                  │  associated with the matched rule.    │
│  └────────┬─────────┘                                      │
│           │                                                │
│           ▼                                                │
│  PersonalizationResult                                     │
│  { ruleId, variant, content, metadata }                    │
└────────────────────────────────────────────────────────────┘
```

### Attribution Models

```
┌────────────────────────────────────────────────────────────┐
│              Multi-Touch Attribution                       │
│                                                            │
│  Touchpoint Timeline:                                      │
│                                                            │
│  ──○──────○──────○──────○──────○──────●                    │
│    │      │      │      │      │      │                    │
│  Email  Social  Blog   Ad    Email  Convert               │
│  Open   Click   Visit  Click  Click                       │
│                                                            │
│  Models:                                                   │
│  ┌──────────────┬──────────────────────────────────┐       │
│  │ first_touch  │ 100% to Email Open               │       │
│  │ last_touch   │ 100% to Email Click              │       │
│  │ linear       │ 20% each touchpoint              │       │
│  │ time_decay   │ Weighted by recency              │       │
│  │ u_shaped     │ 40/20/20/20/40 (first+last)     │       │
│  │ w_shaped     │ 30% first, 30% mid, 30% last    │       │
│  │ custom       │ User-defined weights             │       │
│  └──────────────┴──────────────────────────────────┘       │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Core Interfaces

### MarketingService

The primary entry point for all marketing automation operations.

```typescript
interface MarketingService {
  // Campaign management
  campaigns: CampaignService;

  // Journey builder & engine
  journeys: JourneyService;

  // Lead scoring
  scoring: LeadScoringService;

  // Audience segmentation
  audiences: AudienceService;

  // Landing pages
  landingPages: LandingPageService;

  // Personalization
  personalization: PersonalizationService;

  // Consent management
  consent: ConsentService;

  // Budget & planning
  budget: MarketingBudgetService;

  // Analytics
  analytics: MarketingAnalyticsService;

  // Health check
  healthCheck(): Promise<MarketingHealthStatus>;
}

interface MarketingHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    campaigns: ServiceHealth;
    journeys: ServiceHealth;
    scoring: ServiceHealth;
    consent: ServiceHealth;
    eventBus: ServiceHealth;
  };
  metrics: {
    activeCampaigns: number;
    activeJourneys: number;
    activeEnrollments: number;
    pendingEvents: number;
  };
}
```

### Campaign

```typescript
interface Campaign {
  /** Unique campaign identifier. */
  id: string;

  /** Tenant this campaign belongs to. */
  tenantId: string;

  /** Human-readable campaign name. */
  name: string;

  /** Detailed description / brief. */
  description: string | null;

  /** Campaign lifecycle status. */
  status: CampaignStatus;

  /** Campaign type categorization. */
  type: CampaignType;

  /** Channels this campaign is active on. */
  channels: CampaignChannel[];

  /** Campaign goals and KPIs. */
  goals: CampaignGoal[];

  /** Tags for organization and filtering. */
  tags: string[];

  /** Scheduled start date/time. */
  startDate: string | null;

  /** Scheduled end date/time. */
  endDate: string | null;

  /** Actual launch timestamp. */
  launchedAt: string | null;

  /** Actual completion timestamp. */
  completedAt: string | null;

  /** Associated audience/segment IDs. */
  audienceIds: string[];

  /** Budget allocated to this campaign. */
  budgetAmount: number | null;

  /** Currency code (ISO 4217). */
  budgetCurrency: string;

  /** Amount spent so far. */
  spentAmount: number;

  /** User who created this campaign. */
  createdBy: string;

  /** Creation timestamp. */
  createdAt: string;

  /** Last update timestamp. */
  updatedAt: string;

  /** Metadata / custom fields. */
  metadata: Record<string, unknown>;
}

type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'archived';

type CampaignType =
  | 'email'
  | 'social'
  | 'ads'
  | 'sms'
  | 'push'
  | 'multi_channel'
  | 'event'
  | 'content'
  | 'referral'
  | 'retention';

interface CampaignChannel {
  id: string;
  campaignId: string;
  channelType: ChannelType;
  config: ChannelConfig;
  budgetAmount: number | null;
  spentAmount: number;
  status: 'active' | 'paused' | 'completed';
  metrics: ChannelMetrics;
}

type ChannelType = 'email' | 'sms' | 'social' | 'ads' | 'push' | 'in_app' | 'webhook';

interface CampaignGoal {
  id: string;
  campaignId: string;
  name: string;
  type: 'conversion' | 'engagement' | 'revenue' | 'acquisition' | 'custom';
  targetValue: number;
  currentValue: number;
  targetDate: string | null;
  achieved: boolean;
  achievedAt: string | null;
}

interface CampaignCreate {
  name: string;
  description?: string;
  type: CampaignType;
  channels?: Omit<CampaignChannel, 'id' | 'campaignId' | 'spentAmount' | 'metrics'>[];
  goals?: Omit<CampaignGoal, 'id' | 'campaignId' | 'currentValue' | 'achieved' | 'achievedAt'>[];
  tags?: string[];
  startDate?: string;
  endDate?: string;
  audienceIds?: string[];
  budgetAmount?: number;
  budgetCurrency?: string;
  metadata?: Record<string, unknown>;
}

interface CampaignUpdate {
  name?: string;
  description?: string;
  type?: CampaignType;
  tags?: string[];
  startDate?: string | null;
  endDate?: string | null;
  audienceIds?: string[];
  budgetAmount?: number | null;
  budgetCurrency?: string;
  metadata?: Record<string, unknown>;
}

interface CampaignFilter {
  status?: CampaignStatus | CampaignStatus[];
  type?: CampaignType | CampaignType[];
  tags?: string[];
  startDateFrom?: string;
  startDateTo?: string;
  createdBy?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'startDate' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface CampaignMetrics {
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpens: number;
  uniqueOpens: number;
  totalClicks: number;
  uniqueClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalUnsubscribes: number;
  totalComplaints: number;
  totalBounces: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  roi: number | null;
  cpa: number | null;
}
```

### CampaignService

```typescript
interface CampaignService {
  create(input: CampaignCreate, ctx: ServiceContext): Promise<Campaign>;
  getById(id: string, ctx: ServiceContext): Promise<Campaign>;
  list(filter: CampaignFilter, ctx: ServiceContext): Promise<PaginatedResult<Campaign>>;
  update(id: string, input: CampaignUpdate, ctx: ServiceContext): Promise<Campaign>;
  launch(id: string, ctx: ServiceContext): Promise<Campaign>;
  pause(id: string, ctx: ServiceContext): Promise<Campaign>;
  resume(id: string, ctx: ServiceContext): Promise<Campaign>;
  complete(id: string, ctx: ServiceContext): Promise<Campaign>;
  cancel(id: string, reason: string, ctx: ServiceContext): Promise<Campaign>;
  getMetrics(id: string, ctx: ServiceContext): Promise<CampaignMetrics>;
  getCalendar(startDate: string, endDate: string, ctx: ServiceContext): Promise<CampaignCalendarEntry[]>;
  duplicate(id: string, overrides: Partial<CampaignCreate>, ctx: ServiceContext): Promise<Campaign>;
  addChannel(campaignId: string, channel: Omit<CampaignChannel, 'id' | 'campaignId' | 'spentAmount' | 'metrics'>, ctx: ServiceContext): Promise<CampaignChannel>;
  removeChannel(campaignId: string, channelId: string, ctx: ServiceContext): Promise<void>;
  addGoal(campaignId: string, goal: Omit<CampaignGoal, 'id' | 'campaignId' | 'currentValue' | 'achieved' | 'achievedAt'>, ctx: ServiceContext): Promise<CampaignGoal>;
  trackGoal(campaignId: string, goalId: string, value: number, ctx: ServiceContext): Promise<CampaignGoal>;
  archive(id: string, ctx: ServiceContext): Promise<Campaign>;
}
```

### Journey

```typescript
interface Journey {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  status: JourneyStatus;
  version: number;
  steps: JourneyStep[];
  trigger: JourneyTrigger;
  settings: JourneySettings;
  activeEnrollments: number;
  completedEnrollments: number;
  exitedEnrollments: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

type JourneyStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

interface JourneySettings {
  maxEnrollments: number | null;
  allowReEntry: boolean;
  reEntryDelay: Duration | null;
  maxDuration: Duration | null;
  respectQuietHours: boolean;
  quietHours: QuietHoursConfig | null;
  enforceConsent: boolean;
  exitGoalId: string | null;
  suppressionListIds: string[];
}

interface JourneyTrigger {
  type: 'event' | 'segment_entry' | 'segment_exit' | 'manual' | 'schedule' | 'api';
  eventName?: string;
  eventConditions?: EventCondition[];
  segmentId?: string;
  schedule?: string;
  timezone?: string;
  filters?: TriggerFilter[];
}

interface JourneyStep {
  id: string;
  journeyId: string;
  type: JourneyStepType;
  name: string;
  description: string | null;
  config: JourneyStepConfig;
  nextStepId: string | null;
  yesStepId: string | null;
  noStepId: string | null;
  position: { x: number; y: number };
  order: number;
  metrics: StepMetrics;
}

type JourneyStepType =
  | 'trigger'
  | 'condition'
  | 'action'
  | 'delay'
  | 'branch'
  | 'split'
  | 'wait_for_event'
  | 'goal'
  | 'exit';

type JourneyStepConfig =
  | TriggerStepConfig
  | ConditionStepConfig
  | ActionStepConfig
  | DelayStepConfig
  | BranchStepConfig
  | SplitStepConfig
  | WaitForEventStepConfig
  | GoalStepConfig
  | ExitStepConfig;

interface ActionStepConfig {
  actionType: ActionType;
  actionConfig: ActionConfig;
  skipOnNoConsent: boolean;
}

type ActionType =
  | 'send_email'
  | 'send_sms'
  | 'send_push'
  | 'add_tag'
  | 'remove_tag'
  | 'update_attribute'
  | 'add_to_segment'
  | 'remove_from_segment'
  | 'create_task'
  | 'notify_team'
  | 'webhook'
  | 'update_score'
  | 'assign_owner'
  | 'create_deal';

interface ConditionStepConfig {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
  source: 'contact' | 'event' | 'custom' | 'score' | 'segment';
}

type ComparisonOperator =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'in' | 'not_in'
  | 'is_set' | 'is_not_set'
  | 'between' | 'regex';

interface DelayStepConfig {
  delayType: 'duration' | 'until_date' | 'until_day_of_week' | 'until_time';
  duration?: Duration;
  untilDate?: string;
  untilDayOfWeek?: number;
  untilTime?: string;
  timezone?: string;
  businessDaysOnly?: boolean;
}

interface SplitStepConfig {
  variants: SplitVariant[];
  winnerCriteria?: WinnerCriteria;
  testDuration?: Duration;
  minSampleSize?: number;
}

interface SplitVariant {
  id: string;
  name: string;
  percentage: number;
  nextStepId: string;
}

interface WinnerCriteria {
  metric: 'open_rate' | 'click_rate' | 'conversion_rate' | 'revenue';
  confidenceLevel: number;
  autoSelect: boolean;
}

interface BranchStepConfig {
  branches: BranchCondition[];
  defaultStepId: string | null;
}

interface BranchCondition {
  name: string;
  conditions: ConditionStepConfig[];
  nextStepId: string;
}

interface StepMetrics {
  entered: number;
  completed: number;
  skipped: number;
  failed: number;
  avgDurationMs: number;
}
```

### JourneyService

```typescript
interface JourneyService {
  create(input: JourneyCreate, ctx: ServiceContext): Promise<Journey>;
  getById(id: string, ctx: ServiceContext): Promise<Journey>;
  list(filter: JourneyFilter, ctx: ServiceContext): Promise<PaginatedResult<Journey>>;
  update(id: string, input: JourneyUpdate, ctx: ServiceContext): Promise<Journey>;
  addStep(journeyId: string, step: Omit<JourneyStep, 'id' | 'journeyId' | 'metrics'>, ctx: ServiceContext): Promise<JourneyStep>;
  updateStep(journeyId: string, stepId: string, input: Partial<Omit<JourneyStep, 'id' | 'journeyId' | 'metrics'>>, ctx: ServiceContext): Promise<JourneyStep>;
  removeStep(journeyId: string, stepId: string, ctx: ServiceContext): Promise<void>;
  validate(id: string, ctx: ServiceContext): Promise<JourneyValidationResult>;
  publish(id: string, ctx: ServiceContext): Promise<Journey>;
  pause(id: string, ctx: ServiceContext): Promise<Journey>;
  resume(id: string, ctx: ServiceContext): Promise<Journey>;
  enrollContacts(journeyId: string, contactIds: string[], ctx: ServiceContext): Promise<JourneyEnrollment[]>;
  exitContact(journeyId: string, contactId: string, reason: string, ctx: ServiceContext): Promise<JourneyEnrollment>;
  getMetrics(id: string, ctx: ServiceContext): Promise<JourneyMetrics>;
  getEnrollments(journeyId: string, filter: EnrollmentFilter, ctx: ServiceContext): Promise<PaginatedResult<JourneyEnrollment>>;
  archive(id: string, ctx: ServiceContext): Promise<Journey>;
}

interface JourneyEnrollment {
  id: string;
  journeyId: string;
  journeyVersion: number;
  contactId: string;
  status: JourneyEnrollmentStatus;
  currentStepId: string | null;
  enrolledAt: string;
  completedAt: string | null;
  exitedAt: string | null;
  exitReason: string | null;
  context: Record<string, unknown>;
  events: JourneyEnrollmentEvent[];
}

type JourneyEnrollmentStatus =
  | 'active'
  | 'waiting'
  | 'paused'
  | 'completed'
  | 'exited'
  | 'failed';

interface JourneyValidationResult {
  valid: boolean;
  errors: JourneyValidationError[];
  warnings: JourneyValidationWarning[];
}

interface JourneyMetrics {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  exitedEnrollments: number;
  failedEnrollments: number;
  avgDurationMs: number;
  completionRate: number;
  stepMetrics: Record<string, StepMetrics>;
  goalConversions: Record<string, number>;
}
```

### LeadScore

```typescript
interface LeadScore {
  id: string;
  tenantId: string;
  contactId: string;
  totalScore: number;
  behavioralScore: number;
  demographicScore: number;
  qualificationLevel: LeadQualificationLevel;
  lastActivityAt: string;
  lastDecayAt: string | null;
  recentEvents: LeadScoreEvent[];
  createdAt: string;
  updatedAt: string;
}

type LeadQualificationLevel =
  | 'cold'         // score < 20
  | 'warm'         // 20 ≤ score < 50
  | 'mql'          // 50 ≤ score < 100 (Marketing Qualified Lead)
  | 'sql'          // 100 ≤ score (Sales Qualified Lead)
  | 'disqualified'; // manually disqualified

interface LeadScoreEvent {
  id: string;
  leadScoreId: string;
  contactId: string;
  eventType: string;
  points: number;
  scoreBefore: number;
  scoreAfter: number;
  source: 'behavioral' | 'demographic' | 'manual' | 'decay';
  ruleId: string | null;
  metadata: Record<string, unknown>;
  timestamp: string;
}

interface ScoringRule {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  type: ScoringRuleType;
  active: boolean;
  eventName: string | null;
  attribute: string | null;
  condition: ScoringCondition | null;
  points: number;
  maxOccurrences: number | null;
  occurrenceWindow: Duration | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

type ScoringRuleType = 'behavioral' | 'demographic' | 'custom';

interface ScoreDecayConfig {
  enabled: boolean;
  rate: number;         // 0-1 (e.g. 0.05 = 5%)
  period: 'daily' | 'weekly' | 'monthly';
  minScore: number;
  gracePeriod: Duration;
}

interface LeadRoutingRule {
  id: string;
  tenantId: string;
  name: string;
  triggerLevel: LeadQualificationLevel;
  actions: LeadRoutingAction[];
  active: boolean;
  priority: number;
}

type LeadRoutingAction =
  | { type: 'assign_owner'; ownerId: string }
  | { type: 'create_opportunity'; pipelineId: string; stageId: string }
  | { type: 'notify'; channelType: 'email' | 'slack' | 'webhook'; target: string }
  | { type: 'add_to_sequence'; sequenceId: string }
  | { type: 'webhook'; url: string; headers?: Record<string, string> };
```

### LeadScoringService

```typescript
interface LeadScoringService {
  recordEvent(contactId: string, eventType: string, metadata: Record<string, unknown>, ctx: ServiceContext): Promise<LeadScore>;
  updateDemographicScore(contactId: string, attributes: Record<string, unknown>, ctx: ServiceContext): Promise<LeadScore>;
  adjustScore(contactId: string, points: number, reason: string, ctx: ServiceContext): Promise<LeadScore>;
  getScore(contactId: string, ctx: ServiceContext): Promise<LeadScore>;
  listScores(filter: LeadScoreFilter, ctx: ServiceContext): Promise<PaginatedResult<LeadScore>>;
  getScoreHistory(contactId: string, limit: number, ctx: ServiceContext): Promise<LeadScoreEvent[]>;
  applyDecay(config: ScoreDecayConfig, ctx: ServiceContext): Promise<DecayResult>;
  createRule(input: Omit<ScoringRule, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>, ctx: ServiceContext): Promise<ScoringRule>;
  updateRule(id: string, input: Partial<Omit<ScoringRule, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>, ctx: ServiceContext): Promise<ScoringRule>;
  deleteRule(id: string, ctx: ServiceContext): Promise<void>;
  listRules(ctx: ServiceContext): Promise<ScoringRule[]>;
  setRoutingRules(rules: Omit<LeadRoutingRule, 'id' | 'tenantId'>[], ctx: ServiceContext): Promise<LeadRoutingRule[]>;
  disqualify(contactId: string, reason: string, ctx: ServiceContext): Promise<LeadScore>;
  requalify(contactId: string, ctx: ServiceContext): Promise<LeadScore>;
}

interface DecayResult {
  decayedCount: number;
  thresholdCrossings: number;
  durationMs: number;
}
```

### LandingPage

```typescript
interface LandingPage {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  status: LandingPageStatus;
  activeVersion: number;
  versions: LandingPageVersion[];
  formFields: FormField[];
  campaignId: string | null;
  customDomain: string | null;
  seo: SEOConfig;
  tracking: TrackingConfig;
  metrics: LandingPageMetrics;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

type LandingPageStatus = 'draft' | 'published' | 'paused' | 'archived';

interface LandingPageVersion {
  version: number;
  name: string;
  html: string;
  css: string;
  js: string | null;
  builderData: Record<string, unknown> | null;
  trafficPercentage: number;
  active: boolean;
  metrics: VersionMetrics;
  createdAt: string;
}

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'checkbox'
    | 'radio' | 'textarea' | 'date' | 'hidden';
  required: boolean;
  placeholder: string | null;
  defaultValue: string | null;
  options: string[] | null;
  validationPattern: string | null;
  validationMessage: string | null;
  order: number;
  mapToAttribute: string | null;
}

interface UTMParams {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
}

interface LandingPageMetrics {
  totalViews: number;
  uniqueVisitors: number;
  totalConversions: number;
  conversionRate: number;
  avgTimeOnPage: number;
  bounceRate: number;
  versionMetrics: Record<number, VersionMetrics>;
}
```

### MarketingConsent

```typescript
interface MarketingConsent {
  id: string;
  tenantId: string;
  contactId: string;
  channel: ConsentChannel;
  purpose: ConsentPurpose;
  status: ConsentStatus;
  grantedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
  source: ConsentSource;
  ipAddress: string | null;
  userAgent: string | null;
  doubleOptIn: boolean;
  confirmedAt: string | null;
  legalBasis: LegalBasis | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

type ConsentChannel = 'email' | 'sms' | 'push' | 'social' | 'phone' | 'direct_mail' | 'in_app';
type ConsentPurpose = 'marketing' | 'transactional' | 'newsletter' | 'product_updates'
  | 'promotions' | 'events' | 'surveys' | 'third_party';
type ConsentStatus = 'granted' | 'revoked' | 'expired' | 'pending';
type ConsentSource = 'preference_center' | 'api' | 'import' | 'double_opt_in'
  | 'signup_form' | 'checkout' | 'manual';
type LegalBasis = 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
```

### ConsentService

```typescript
interface ConsentService {
  grantConsent(input: ConsentCreate, ctx: ServiceContext): Promise<MarketingConsent>;
  revokeConsent(contactId: string, channel: ConsentChannel, purpose: ConsentPurpose, source: ConsentSource, ctx: ServiceContext): Promise<MarketingConsent>;
  checkConsent(contactId: string, channel: ConsentChannel, purpose: ConsentPurpose, ctx: ServiceContext): Promise<boolean>;
  bulkCheckConsent(contactIds: string[], channel: ConsentChannel, purpose: ConsentPurpose, ctx: ServiceContext): Promise<Map<string, boolean>>;
  getContactConsents(contactId: string, ctx: ServiceContext): Promise<MarketingConsent[]>;
  getConsentHistory(contactId: string, ctx: ServiceContext): Promise<ConsentEvent[]>;
  globalUnsubscribe(contactId: string, source: ConsentSource, ctx: ServiceContext): Promise<MarketingConsent[]>;
  confirmDoubleOptIn(token: string, ctx: ServiceContext): Promise<MarketingConsent>;
  expireConsents(ctx: ServiceContext): Promise<number>;
  exportConsents(contactId: string, ctx: ServiceContext): Promise<ConsentExport>;
  deleteConsents(contactId: string, ctx: ServiceContext): Promise<void>;
}
```

### MarketingBudget

```typescript
interface MarketingBudget {
  id: string;
  tenantId: string;
  name: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  totalAmount: number;
  currency: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  status: BudgetStatus;
  allocations: BudgetAllocation[];
  spendEntries: SpendEntry[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

type BudgetPeriod = 'monthly' | 'quarterly' | 'annual' | 'campaign' | 'custom';
type BudgetStatus = 'draft' | 'active' | 'paused' | 'exhausted' | 'closed';

interface BudgetAllocation {
  id: string;
  budgetId: string;
  channelType: ChannelType;
  amount: number;
  spentAmount: number;
  campaignId: string | null;
  alertThreshold: number;
  alertTriggered: boolean;
}

interface ROIForecast {
  budgetId: string;
  period: { start: string; end: string };
  projectedSpend: number;
  projectedRevenue: number;
  projectedROI: number;
  confidence: { low: number; mid: number; high: number };
  channelForecasts: ChannelForecast[];
  generatedAt: string;
}

interface ChannelMixRecommendation {
  current: Record<ChannelType, number>;
  recommended: Record<ChannelType, number>;
  projectedImprovement: number;
  rationale: Record<ChannelType, string>;
  generatedAt: string;
}
```

### PersonalizationRule

```typescript
interface PersonalizationRule {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  type: PersonalizationRuleType;
  active: boolean;
  priority: number;
  conditions: PersonalizationCondition[];
  action: PersonalizationAction;
  locations: string[];
  startDate: string | null;
  endDate: string | null;
  metrics: PersonalizationMetrics;
  createdAt: string;
  updatedAt: string;
}

type PersonalizationRuleType =
  | 'content' | 'offer' | 'cta' | 'layout' | 'redirect' | 'popup' | 'banner';

interface PersonalizationCondition {
  type: 'attribute' | 'behavior' | 'segment' | 'geo' | 'device' | 'referrer' | 'url_param';
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

interface PersonalizationAction {
  type: 'show_content' | 'show_offer' | 'set_cta' | 'redirect' | 'show_popup' | 'show_banner';
  contentId: string | null;
  content: string | null;
  variables: Record<string, unknown>;
  redirectUrl: string | null;
}

interface PersonalizationResult {
  matched: boolean;
  ruleId: string | null;
  ruleName: string | null;
  action: PersonalizationAction | null;
  content: string | null;
  debug?: {
    evaluatedRules: number;
    matchedRuleIndex: number;
    evaluationTimeMs: number;
  };
}
```

### Analytics Types

```typescript
type AttributionModel =
  | 'first_touch' | 'last_touch' | 'linear'
  | 'time_decay' | 'u_shaped' | 'w_shaped' | 'custom';

interface AttributionResult {
  conversionId: string;
  contactId: string;
  conversionValue: number;
  model: AttributionModel;
  touchpoints: AttributionTouchCredit[];
  channelAttribution: ChannelAttribution[];
}

interface ChannelAttribution {
  channelType: ChannelType;
  totalCredit: number;
  totalCreditValue: number;
  conversions: number;
  touchpoints: number;
  avgCreditPerConversion: number;
}

interface FunnelConversion {
  stages: FunnelStage[];
  overallConversionRate: number;
  totalEntries: number;
  totalCompletions: number;
  avgFunnelDurationMs: number;
}

interface EngagementScore {
  contactId: string;
  score: number;
  dimensions: {
    emailEngagement: number;
    webEngagement: number;
    socialEngagement: number;
    eventEngagement: number;
    contentEngagement: number;
  };
  trend: 'increasing' | 'stable' | 'decreasing';
  daysSinceLastEngagement: number;
  calculatedAt: string;
}
```

---

## 5. Database Schemas

### campaigns

```typescript
import { pgTable, text, timestamp, jsonb, numeric, integer } from 'drizzle-orm/pg-core';
import { tenantId, primaryId, timestamps } from '@mcv/db/shared';

export const campaigns = pgTable('campaigns', {
  id: primaryId(),
  tenantId: tenantId(),

  name: text('name').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled', 'archived'],
  }).notNull().default('draft'),
  type: text('type', {
    enum: ['email', 'social', 'ads', 'sms', 'push', 'multi_channel', 'event', 'content', 'referral', 'retention'],
  }).notNull(),

  tags: jsonb('tags').$type<string[]>().default([]),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  launchedAt: timestamp('launched_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),

  audienceIds: jsonb('audience_ids').$type<string[]>().default([]),
  budgetAmount: numeric('budget_amount', { precision: 12, scale: 2 }),
  budgetCurrency: text('budget_currency').notNull().default('USD'),
  spentAmount: numeric('spent_amount', { precision: 12, scale: 2 }).notNull().default('0'),

  createdBy: text('created_by').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

  ...timestamps(),
});
```

### campaign_channels

```typescript
export const campaignChannels = pgTable('campaign_channels', {
  id: primaryId(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),

  channelType: text('channel_type', {
    enum: ['email', 'sms', 'social', 'ads', 'push', 'in_app', 'webhook'],
  }).notNull(),
  config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),

  budgetAmount: numeric('budget_amount', { precision: 12, scale: 2 }),
  spentAmount: numeric('spent_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status', { enum: ['active', 'paused', 'completed'] }).notNull().default('active'),

  metrics: jsonb('metrics').$type<Record<string, unknown>>().default({}),

  ...timestamps(),
});
```

### journeys

```typescript
export const journeys = pgTable('journeys', {
  id: primaryId(),
  tenantId: tenantId(),

  name: text('name').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
  }).notNull().default('draft'),
  version: integer('version').notNull().default(1),

  trigger: jsonb('trigger').$type<JourneyTrigger>().notNull(),
  settings: jsonb('settings').$type<JourneySettings>().notNull(),

  activeEnrollments: integer('active_enrollments').notNull().default(0),
  completedEnrollments: integer('completed_enrollments').notNull().default(0),
  exitedEnrollments: integer('exited_enrollments').notNull().default(0),

  createdBy: text('created_by').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),

  ...timestamps(),
});
```

### journey_steps

```typescript
export const journeySteps = pgTable('journey_steps', {
  id: primaryId(),
  journeyId: text('journey_id').notNull().references(() => journeys.id, { onDelete: 'cascade' }),

  type: text('type', {
    enum: ['trigger', 'condition', 'action', 'delay', 'branch', 'split', 'wait_for_event', 'goal', 'exit'],
  }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  config: jsonb('config').$type<JourneyStepConfig>().notNull(),

  nextStepId: text('next_step_id'),
  yesStepId: text('yes_step_id'),
  noStepId: text('no_step_id'),

  position: jsonb('position').$type<{ x: number; y: number }>().notNull().default({ x: 0, y: 0 }),
  order: integer('order').notNull().default(0),
  metrics: jsonb('metrics').$type<StepMetrics>().default({ entered: 0, completed: 0, skipped: 0, failed: 0, avgDurationMs: 0 }),

  ...timestamps(),
});
```

### journey_enrollments

```typescript
export const journeyEnrollments = pgTable('journey_enrollments', {
  id: primaryId(),
  journeyId: text('journey_id').notNull().references(() => journeys.id, { onDelete: 'cascade' }),
  journeyVersion: integer('journey_version').notNull(),
  contactId: text('contact_id').notNull(),

  status: text('status', {
    enum: ['active', 'waiting', 'paused', 'completed', 'exited', 'failed'],
  }).notNull().default('active'),

  currentStepId: text('current_step_id'),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  exitedAt: timestamp('exited_at', { withTimezone: true }),
  exitReason: text('exit_reason'),
  context: jsonb('context').$type<Record<string, unknown>>().default({}),

  ...timestamps(),
});
```

### lead_scores

```typescript
export const leadScores = pgTable('lead_scores', {
  id: primaryId(),
  tenantId: tenantId(),
  contactId: text('contact_id').notNull(),

  totalScore: numeric('total_score', { precision: 10, scale: 2 }).notNull().default('0'),
  behavioralScore: numeric('behavioral_score', { precision: 10, scale: 2 }).notNull().default('0'),
  demographicScore: numeric('demographic_score', { precision: 10, scale: 2 }).notNull().default('0'),

  qualificationLevel: text('qualification_level', {
    enum: ['cold', 'warm', 'mql', 'sql', 'disqualified'],
  }).notNull().default('cold'),

  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  lastDecayAt: timestamp('last_decay_at', { withTimezone: true }),

  ...timestamps(),
});
```

### lead_score_events

```typescript
export const leadScoreEvents = pgTable('lead_score_events', {
  id: primaryId(),
  leadScoreId: text('lead_score_id').notNull().references(() => leadScores.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),

  eventType: text('event_type').notNull(),
  points: numeric('points', { precision: 10, scale: 2 }).notNull(),
  scoreBefore: numeric('score_before', { precision: 10, scale: 2 }).notNull(),
  scoreAfter: numeric('score_after', { precision: 10, scale: 2 }).notNull(),

  source: text('source', { enum: ['behavioral', 'demographic', 'manual', 'decay'] }).notNull(),
  ruleId: text('rule_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
});
```

### scoring_rules

```typescript
export const scoringRules = pgTable('scoring_rules', {
  id: primaryId(),
  tenantId: tenantId(),

  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: ['behavioral', 'demographic', 'custom'] }).notNull(),
  active: integer('active').notNull().default(1),

  eventName: text('event_name'),
  attribute: text('attribute'),
  condition: jsonb('condition').$type<ScoringCondition | null>(),
  points: numeric('points', { precision: 10, scale: 2 }).notNull(),
  maxOccurrences: integer('max_occurrences'),
  occurrenceWindow: jsonb('occurrence_window').$type<Duration | null>(),
  priority: integer('priority').notNull().default(100),

  ...timestamps(),
});
```

### landing_pages

```typescript
export const landingPages = pgTable('landing_pages', {
  id: primaryId(),
  tenantId: tenantId(),

  name: text('name').notNull(),
  slug: text('slug').notNull(),
  status: text('status', { enum: ['draft', 'published', 'paused', 'archived'] }).notNull().default('draft'),
  activeVersion: integer('active_version').notNull().default(1),

  campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  customDomain: text('custom_domain'),
  formFields: jsonb('form_fields').$type<FormField[]>().default([]),
  seo: jsonb('seo').$type<SEOConfig>().default({ title: null, description: null, ogImage: null, noIndex: false, canonicalUrl: null }),
  tracking: jsonb('tracking').$type<TrackingConfig>().default({ gaId: null, fbPixelId: null, customScripts: [], captureUtm: true, trackScrollDepth: true, trackTimeOnPage: true }),

  publishedAt: timestamp('published_at', { withTimezone: true }),

  ...timestamps(),
});
```

### landing_page_conversions

```typescript
export const landingPageConversions = pgTable('landing_page_conversions', {
  id: primaryId(),
  landingPageId: text('landing_page_id').notNull().references(() => landingPages.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),

  contactId: text('contact_id'),
  visitorId: text('visitor_id').notNull(),
  formData: jsonb('form_data').$type<Record<string, unknown>>().default({}),
  utmParams: jsonb('utm_params').$type<UTMParams>().default({ source: null, medium: null, campaign: null, term: null, content: null }),

  referrer: text('referrer'),
  ipHash: text('ip_hash').notNull(),
  userAgent: text('user_agent').notNull(),
  convertedAt: timestamp('converted_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### marketing_consents

```typescript
export const marketingConsents = pgTable('marketing_consents', {
  id: primaryId(),
  tenantId: tenantId(),
  contactId: text('contact_id').notNull(),

  channel: text('channel', { enum: ['email', 'sms', 'push', 'social', 'phone', 'direct_mail', 'in_app'] }).notNull(),
  purpose: text('purpose', { enum: ['marketing', 'transactional', 'newsletter', 'product_updates', 'promotions', 'events', 'surveys', 'third_party'] }).notNull(),
  status: text('status', { enum: ['granted', 'revoked', 'expired', 'pending'] }).notNull().default('pending'),

  grantedAt: timestamp('granted_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  source: text('source', { enum: ['preference_center', 'api', 'import', 'double_opt_in', 'signup_form', 'checkout', 'manual'] }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  doubleOptIn: integer('double_opt_in').notNull().default(0),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  legalBasis: text('legal_basis', { enum: ['consent', 'legitimate_interest', 'contract', 'legal_obligation'] }),
  notes: text('notes'),

  ...timestamps(),
});
```

### marketing_budgets

```typescript
export const marketingBudgets = pgTable('marketing_budgets', {
  id: primaryId(),
  tenantId: tenantId(),

  name: text('name').notNull(),
  period: text('period', { enum: ['monthly', 'quarterly', 'annual', 'campaign', 'custom'] }).notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),

  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  allocatedAmount: numeric('allocated_amount', { precision: 14, scale: 2 }).notNull().default('0'),
  spentAmount: numeric('spent_amount', { precision: 14, scale: 2 }).notNull().default('0'),

  status: text('status', { enum: ['draft', 'active', 'paused', 'exhausted', 'closed'] }).notNull().default('draft'),
  notes: text('notes'),

  ...timestamps(),
});
```

### budget_allocations

```typescript
export const budgetAllocations = pgTable('budget_allocations', {
  id: primaryId(),
  budgetId: text('budget_id').notNull().references(() => marketingBudgets.id, { onDelete: 'cascade' }),

  channelType: text('channel_type', { enum: ['email', 'sms', 'social', 'ads', 'push', 'in_app', 'webhook'] }).notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  spentAmount: numeric('spent_amount', { precision: 14, scale: 2 }).notNull().default('0'),

  campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  alertThreshold: integer('alert_threshold').notNull().default(80),
  alertTriggered: integer('alert_triggered').notNull().default(0),

  ...timestamps(),
});
```

### personalization_rules

```typescript
export const personalizationRules = pgTable('personalization_rules', {
  id: primaryId(),
  tenantId: tenantId(),

  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: ['content', 'offer', 'cta', 'layout', 'redirect', 'popup', 'banner'] }).notNull(),
  active: integer('active').notNull().default(1),
  priority: integer('priority').notNull().default(100),

  conditions: jsonb('conditions').$type<PersonalizationCondition[]>().notNull().default([]),
  action: jsonb('action').$type<PersonalizationAction>().notNull(),
  locations: jsonb('locations').$type<string[]>().default([]),

  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  metrics: jsonb('metrics').$type<PersonalizationMetrics>().default({ evaluations: 0, matches: 0, conversions: 0, matchRate: 0, conversionRate: 0 }),

  ...timestamps(),
});
```

### Key Indexes

```sql
-- Campaigns
CREATE INDEX idx_campaigns_tenant_status ON campaigns (tenant_id, status);
CREATE INDEX idx_campaigns_tenant_type ON campaigns (tenant_id, type);
CREATE INDEX idx_campaigns_start_date ON campaigns (start_date);
CREATE INDEX idx_campaigns_created_by ON campaigns (tenant_id, created_by);

-- Journeys
CREATE INDEX idx_journeys_tenant_status ON journeys (tenant_id, status);
CREATE INDEX idx_journeys_created_by ON journeys (tenant_id, created_by);

-- Journey Enrollments
CREATE INDEX idx_enrollments_journey_status ON journey_enrollments (journey_id, status);
CREATE INDEX idx_enrollments_contact ON journey_enrollments (contact_id, status);
CREATE INDEX idx_enrollments_current_step ON journey_enrollments (current_step_id) WHERE status = 'active';
CREATE UNIQUE INDEX idx_enrollments_unique_active ON journey_enrollments (journey_id, contact_id) WHERE status IN ('active', 'waiting');

-- Lead Scores
CREATE UNIQUE INDEX idx_lead_scores_tenant_contact ON lead_scores (tenant_id, contact_id);
CREATE INDEX idx_lead_scores_qualification ON lead_scores (tenant_id, qualification_level);
CREATE INDEX idx_lead_scores_total ON lead_scores (tenant_id, total_score DESC);
CREATE INDEX idx_lead_scores_last_activity ON lead_scores (last_activity_at);

-- Lead Score Events
CREATE INDEX idx_score_events_contact ON lead_score_events (contact_id, timestamp DESC);
CREATE INDEX idx_score_events_type ON lead_score_events (event_type, timestamp DESC);

-- Landing Pages
CREATE UNIQUE INDEX idx_landing_pages_tenant_slug ON landing_pages (tenant_id, slug);
CREATE INDEX idx_landing_pages_campaign ON landing_pages (campaign_id);

-- Landing Page Conversions
CREATE INDEX idx_conversions_page_version ON landing_page_conversions (landing_page_id, version);
CREATE INDEX idx_conversions_contact ON landing_page_conversions (contact_id);
CREATE INDEX idx_conversions_date ON landing_page_conversions (converted_at);

-- Marketing Consents
CREATE UNIQUE INDEX idx_consents_contact_channel_purpose ON marketing_consents (tenant_id, contact_id, channel, purpose);
CREATE INDEX idx_consents_status ON marketing_consents (tenant_id, status);
CREATE INDEX idx_consents_expires ON marketing_consents (expires_at) WHERE status = 'granted';

-- Budgets
CREATE INDEX idx_budgets_tenant_status ON marketing_budgets (tenant_id, status);
CREATE INDEX idx_budgets_period ON marketing_budgets (tenant_id, start_date, end_date);

-- Personalization Rules
CREATE INDEX idx_personalization_tenant_active ON personalization_rules (tenant_id, active, priority);
CREATE INDEX idx_personalization_type ON personalization_rules (tenant_id, type);
```

### RLS Policies

```sql
-- Enable RLS on all marketing tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE spend_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalization_rules ENABLE ROW LEVEL SECURITY;

-- Standard tenant isolation policy (example for campaigns)
CREATE POLICY tenant_isolation ON campaigns
  USING (tenant_id = current_setting('app.current_tenant_id')::text);

-- Child tables inherit isolation via foreign key joins
CREATE POLICY tenant_isolation ON campaign_channels
  USING (campaign_id IN (
    SELECT id FROM campaigns
    WHERE tenant_id = current_setting('app.current_tenant_id')::text
  ));
```

---

## 6. Code Examples

### Example 1 — Create and Launch a Multi-Channel Campaign

```typescript
import { createMarketingService } from '@mcv/growth/marketing';

const marketing = createMarketingService({ db, eventBus, config });

// Create the campaign
const campaign = await marketing.campaigns.create({
  name: 'Q1 Product Launch',
  description: 'Multi-channel campaign for the new analytics dashboard release',
  type: 'multi_channel',
  tags: ['product-launch', 'q1-2025', 'analytics'],
  startDate: '2025-03-01T09:00:00Z',
  endDate: '2025-03-31T23:59:59Z',
  audienceIds: ['seg_power_users', 'seg_trial_active'],
  budgetAmount: 25000,
  budgetCurrency: 'USD',
  channels: [
    {
      channelType: 'email',
      config: {
        templateId: 'tpl_product_launch_v2',
        subject: 'Introducing the New Analytics Dashboard',
        fromName: 'Product Team',
        replyTo: 'product@example.com',
      },
      budgetAmount: 5000,
      status: 'active',
    },
    {
      channelType: 'social',
      config: {
        platforms: ['twitter', 'linkedin'],
        postSchedule: 'spread_evenly',
        hashtags: ['#analytics', '#newfeature'],
      },
      budgetAmount: 8000,
      status: 'active',
    },
    {
      channelType: 'ads',
      config: {
        platform: 'google_ads',
        campaignType: 'search',
        keywords: ['analytics dashboard', 'business intelligence'],
        dailyBudget: 200,
      },
      budgetAmount: 12000,
      status: 'active',
    },
  ],
  goals: [
    {
      name: 'Trial Signups',
      type: 'acquisition',
      targetValue: 500,
      targetDate: '2025-03-31T23:59:59Z',
    },
    {
      name: 'Revenue from Upsells',
      type: 'revenue',
      targetValue: 50000,
      targetDate: '2025-04-30T23:59:59Z',
    },
  ],
}, ctx);

// Launch the campaign
const launched = await marketing.campaigns.launch(campaign.id, ctx);
console.log(`Campaign "${launched.name}" is now ${launched.status}`);
// → Campaign "Q1 Product Launch" is now active

// Track goal progress
await marketing.campaigns.trackGoal(
  campaign.id,
  campaign.goals[0].id,
  15, // 15 new signups
  ctx,
);
```

### Example 2 — Build and Publish a Customer Journey

```typescript
const journey = await marketing.journeys.create({
  name: 'Onboarding Drip Sequence',
  description: 'Guides new users through product features over 14 days',
  trigger: {
    type: 'event',
    eventName: 'user.signed_up',
    filters: [
      { field: 'plan', operator: 'in', value: ['trial', 'starter'] },
    ],
  },
  settings: {
    allowReEntry: false,
    enforceConsent: true,
    maxDuration: { days: 30 },
    respectQuietHours: true,
    quietHours: {
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York',
    },
  },
}, ctx);

// Add trigger step
const trigger = await marketing.journeys.addStep(journey.id, {
  type: 'trigger',
  name: 'New Signup',
  description: 'Triggered when a user signs up for trial or starter plan',
  config: { eventName: 'user.signed_up' },
  nextStepId: null,
  yesStepId: null,
  noStepId: null,
  position: { x: 400, y: 50 },
  order: 0,
}, ctx);

// Welcome email
const welcomeEmail = await marketing.journeys.addStep(journey.id, {
  type: 'action',
  name: 'Send Welcome Email',
  description: null,
  config: {
    actionType: 'send_email',
    actionConfig: {
      templateId: 'tpl_welcome_v3',
      subject: 'Welcome to {{product_name}}!',
    },
    skipOnNoConsent: false,
  },
  nextStepId: null,
  yesStepId: null,
  noStepId: null,
  position: { x: 400, y: 150 },
  order: 1,
}, ctx);

// Wait 2 days
const delay1 = await marketing.journeys.addStep(journey.id, {
  type: 'delay',
  name: 'Wait 2 Days',
  description: null,
  config: {
    delayType: 'duration',
    duration: { days: 2 },
    businessDaysOnly: false,
  },
  nextStepId: null,
  yesStepId: null,
  noStepId: null,
  position: { x: 400, y: 250 },
  order: 2,
}, ctx);

// Check if user has completed setup
const setupCheck = await marketing.journeys.addStep(journey.id, {
  type: 'condition',
  name: 'Completed Setup?',
  description: 'Check if the user finished the onboarding wizard',
  config: {
    field: 'onboarding_completed',
    operator: 'eq',
    value: true,
    source: 'contact',
  },
  nextStepId: null,
  yesStepId: null, // will be linked
  noStepId: null,   // will be linked
  position: { x: 400, y: 350 },
  order: 3,
}, ctx);

// A/B split for non-completers
const split = await marketing.journeys.addStep(journey.id, {
  type: 'split',
  name: 'A/B Test: Nudge Style',
  description: 'Test whether a tutorial video or checklist email converts better',
  config: {
    variants: [
      { id: 'A', name: 'Tutorial Video', percentage: 50, nextStepId: '' },
      { id: 'B', name: 'Checklist Email', percentage: 50, nextStepId: '' },
    ],
    winnerCriteria: {
      metric: 'click_rate',
      confidenceLevel: 0.95,
      autoSelect: true,
    },
    testDuration: { days: 7 },
    minSampleSize: 100,
  },
  nextStepId: null,
  yesStepId: null,
  noStepId: null,
  position: { x: 300, y: 450 },
  order: 4,
}, ctx);

// Link steps together
await marketing.journeys.updateStep(journey.id, trigger.id, { nextStepId: welcomeEmail.id }, ctx);
await marketing.journeys.updateStep(journey.id, welcomeEmail.id, { nextStepId: delay1.id }, ctx);
await marketing.journeys.updateStep(journey.id, delay1.id, { nextStepId: setupCheck.id }, ctx);
await marketing.journeys.updateStep(journey.id, setupCheck.id, { noStepId: split.id }, ctx);

// Validate and publish
const validation = await marketing.journeys.validate(journey.id, ctx);
if (validation.valid) {
  const published = await marketing.journeys.publish(journey.id, ctx);
  console.log(`Journey v${published.version} is now active`);
}
```

### Example 3 — Lead Scoring with Behavioral Events

```typescript
// Configure scoring rules
await marketing.scoring.createRule({
  name: 'Email Open',
  type: 'behavioral',
  active: true,
  eventName: 'email.opened',
  condition: null,
  points: 5,
  maxOccurrences: 10,
  occurrenceWindow: { days: 7 },
  priority: 50,
  description: 'Award points when a contact opens a marketing email',
}, ctx);

await marketing.scoring.createRule({
  name: 'Pricing Page Visit',
  type: 'behavioral',
  active: true,
  eventName: 'page.viewed',
  condition: { field: 'url', operator: 'contains', value: '/pricing' },
  points: 15,
  maxOccurrences: 3,
  occurrenceWindow: { days: 30 },
  priority: 30,
  description: 'High-intent signal: visited pricing page',
}, ctx);

await marketing.scoring.createRule({
  name: 'Demo Requested',
  type: 'behavioral',
  active: true,
  eventName: 'demo.requested',
  condition: null,
  points: 50,
  maxOccurrences: 1,
  occurrenceWindow: null,
  priority: 10,
  description: 'Highest-intent signal: requested a live demo',
}, ctx);

await marketing.scoring.createRule({
  name: 'VP/C-Level Title',
  type: 'demographic',
  active: true,
  eventName: null,
  attribute: 'job_title',
  condition: { field: 'job_title', operator: 'regex', value: '^(VP|Vice President|C[A-Z]O|Chief)' },
  points: 25,
  maxOccurrences: 1,
  occurrenceWindow: null,
  priority: 40,
  description: 'Award points for decision-maker job titles',
}, ctx);

// Record behavioral events as they happen
const score = await marketing.scoring.recordEvent(
  'contact_abc123',
  'page.viewed',
  { url: '/pricing', duration: 45, referrer: 'google.com' },
  ctx,
);

console.log(`Score: ${score.totalScore} (${score.qualificationLevel})`);
// → Score: 67 (mql)

// Configure routing for MQL leads
await marketing.scoring.setRoutingRules([
  {
    name: 'MQL → Sales Team',
    triggerLevel: 'mql',
    active: true,
    priority: 1,
    actions: [
      { type: 'notify', channelType: 'slack', target: '#sales-leads' },
      { type: 'add_to_sequence', sequenceId: 'seq_mql_nurture' },
    ],
  },
  {
    name: 'SQL → Account Executive',
    triggerLevel: 'sql',
    active: true,
    priority: 1,
    actions: [
      { type: 'assign_owner', ownerId: 'round_robin_ae' },
      { type: 'create_opportunity', pipelineId: 'pipe_main', stageId: 'stage_qualified' },
      { type: 'notify', channelType: 'email', target: 'ae-team@example.com' },
    ],
  },
], ctx);

// Apply score decay (typically called by cron)
const decayResult = await marketing.scoring.applyDecay({
  enabled: true,
  rate: 0.05,
  period: 'weekly',
  minScore: 0,
  gracePeriod: { days: 14 },
}, ctx);

console.log(`Decayed ${decayResult.decayedCount} scores, ${decayResult.thresholdCrossings} crossed thresholds`);
```

### Example 4 — Consent Management with GDPR Compliance

```typescript
// Grant email marketing consent with double opt-in
const consent = await marketing.consent.grantConsent({
  contactId: 'contact_xyz789',
  channel: 'email',
  purpose: 'marketing',
  source: 'signup_form',
  legalBasis: 'consent',
  requireDoubleOptIn: true,
  ipAddress: '198.51.100.42',
  userAgent: 'Mozilla/5.0...',
  notes: 'Consent granted during account signup',
}, ctx);

console.log(consent.status);
// → 'pending' (waiting for double opt-in confirmation)

// User clicks the confirmation link in their email
const confirmed = await marketing.consent.confirmDoubleOptIn(
  'doi_token_abc123',
  ctx,
);
console.log(confirmed.status);
// → 'granted'

// Check consent before sending
const hasConsent = await marketing.consent.checkConsent(
  'contact_xyz789',
  'email',
  'marketing',
  ctx,
);

if (hasConsent) {
  // Safe to send marketing email
}

// Bulk consent check for a campaign send
const consentMap = await marketing.consent.bulkCheckConsent(
  ['contact_1', 'contact_2', 'contact_3', 'contact_4'],
  'email',
  'marketing',
  ctx,
);

const sendable = [...consentMap.entries()]
  .filter(([_, hasConsent]) => hasConsent)
  .map(([id]) => id);
console.log(`${sendable.length} of 4 contacts have consent`);

// Handle unsubscribe (global opt-out)
await marketing.consent.globalUnsubscribe(
  'contact_xyz789',
  'preference_center',
  ctx,
);

// GDPR: Export all consent data for a contact
const exportData = await marketing.consent.exportConsents('contact_xyz789', ctx);
// Returns: { contactId, consents: [...], events: [...], exportedAt, format: 'json' }

// GDPR: Right to erasure
await marketing.consent.deleteConsents('contact_xyz789', ctx);
```

### Example 5 — Landing Page with A/B Testing and Conversion Tracking

```typescript
import { LandingPageService } from '@mcv/growth/marketing';

const landingPages = marketing.landingPages;

// Create a landing page with A/B test
const page = await landingPages.create({
  name: 'Free Trial Signup',
  slug: 'free-trial',
  campaignId: campaign.id,
  formFields: [
    {
      id: 'f1',
      name: 'email',
      label: 'Work Email',
      type: 'email',
      required: true,
      placeholder: 'you@company.com',
      defaultValue: null,
      options: null,
      validationPattern: null,
      validationMessage: null,
      order: 1,
      mapToAttribute: 'email',
    },
    {
      id: 'f2',
      name: 'company',
      label: 'Company Name',
      type: 'text',
      required: true,
      placeholder: 'Acme Inc.',
      defaultValue: null,
      options: null,
      validationPattern: null,
      validationMessage: null,
      order: 2,
      mapToAttribute: 'company_name',
    },
    {
      id: 'f3',
      name: 'company_size',
      label: 'Company Size',
      type: 'select',
      required: false,
      placeholder: null,
      defaultValue: null,
      options: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
      validationPattern: null,
      validationMessage: null,
      order: 3,
      mapToAttribute: 'company_size',
    },
  ],
  seo: {
    title: 'Start Your Free Trial | Analytics Dashboard',
    description: 'Get started with our analytics dashboard in under 5 minutes.',
    ogImage: 'https://cdn.example.com/og-trial.png',
    noIndex: false,
    canonicalUrl: null,
  },
  tracking: {
    gaId: 'G-XXXXXXXXXX',
    fbPixelId: '1234567890',
    customScripts: [],
    captureUtm: true,
    trackScrollDepth: true,
    trackTimeOnPage: true,
  },
}, ctx);

// Add A/B test variant
await landingPages.addVersion(page.id, {
  name: 'Variant B - Social Proof',
  html: '<div>... variant with testimonials ...</div>',
  css: '.testimonials { ... }',
  trafficPercentage: 50,
}, ctx);

// Update original variant to 50%
await landingPages.updateVersion(page.id, 1, {
  trafficPercentage: 50,
}, ctx);

// Publish
await landingPages.publish(page.id, ctx);

// Track a conversion
await landingPages.trackConversion({
  landingPageId: page.id,
  version: 2,
  visitorId: 'vis_abc123',
  formData: {
    email: 'jane@acme.com',
    company: 'Acme Inc.',
    company_size: '51-200',
  },
  utmParams: {
    source: 'google',
    medium: 'cpc',
    campaign: 'q1-trial',
    term: 'analytics tool',
    content: 'ad-variant-a',
  },
  referrer: 'https://www.google.com',
  ipHash: 'sha256:abc...',
  userAgent: 'Mozilla/5.0...',
}, ctx);

// Get page metrics
const metrics = await landingPages.getMetrics(page.id, ctx);
console.log(`Overall CR: ${metrics.conversionRate}%`);
console.log(`Variant A CR: ${metrics.versionMetrics[1].conversionRate}%`);
console.log(`Variant B CR: ${metrics.versionMetrics[2].conversionRate}%`);
```

### Example 6 — Personalization Engine

```typescript
// Create personalization rules
await marketing.personalization.createRule({
  name: 'VIP Customer Offer',
  type: 'offer',
  active: true,
  priority: 10,
  conditions: [
    { type: 'segment', field: 'segment_id', operator: 'eq', value: 'seg_vip' },
    { type: 'behavior', field: 'last_purchase_days', operator: 'lte', value: 90 },
  ],
  action: {
    type: 'show_offer',
    contentId: 'offer_vip_exclusive',
    content: null,
    variables: { discountPercent: 20, offerName: 'VIP Exclusive' },
    redirectUrl: null,
  },
  locations: ['homepage_hero', 'product_page_banner'],
  startDate: null,
  endDate: null,
}, ctx);

await marketing.personalization.createRule({
  name: 'New Visitor Onboarding',
  type: 'cta',
  active: true,
  priority: 20,
  conditions: [
    { type: 'behavior', field: 'visit_count', operator: 'lte', value: 3 },
    { type: 'attribute', field: 'account_created', operator: 'is_not_set', value: null },
  ],
  action: {
    type: 'set_cta',
    contentId: null,
    content: 'Start Your Free Trial — No Credit Card Required',
    variables: { ctaColor: '#4CAF50', ctaUrl: '/signup' },
    redirectUrl: null,
  },
  locations: ['homepage_hero', 'blog_sidebar'],
  startDate: null,
  endDate: null,
}, ctx);

await marketing.personalization.createRule({
  name: 'Churning User Retention',
  type: 'popup',
  active: true,
  priority: 15,
  conditions: [
    { type: 'behavior', field: 'days_since_login', operator: 'gte', value: 14 },
    { type: 'segment', field: 'segment_id', operator: 'eq', value: 'seg_at_risk' },
  ],
  action: {
    type: 'show_popup',
    contentId: 'popup_win_back',
    content: null,
    variables: { headline: 'We Miss You!', offer: '30% off for 3 months' },
    redirectUrl: null,
  },
  locations: ['any_page'],
  startDate: null,
  endDate: null,
}, ctx);

// Evaluate personalization at render time
const result = await marketing.personalization.evaluate({
  location: 'homepage_hero',
  user: {
    contactId: 'contact_abc123',
    attributes: { plan: 'enterprise', account_created: '2024-01-15' },
    segments: ['seg_vip', 'seg_enterprise'],
    behavior: { visit_count: 45, last_purchase_days: 12 },
    geo: { country: 'US', region: 'CA' },
    device: { type: 'desktop', browser: 'chrome' },
  },
}, ctx);

if (result.matched) {
  console.log(`Rule: ${result.ruleName}`);
  console.log(`Action: ${result.action!.type}`);
  console.log(`Variables:`, result.action!.variables);
  // → Rule: VIP Customer Offer
  // → Action: show_offer
  // → Variables: { discountPercent: 20, offerName: 'VIP Exclusive' }
}
```

### Example 7 — Budget Planning and ROI Forecasting

```typescript
// Create a quarterly marketing budget
const budget = await marketing.budget.create({
  name: 'Q1 2025 Marketing Budget',
  period: 'quarterly',
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-03-31T23:59:59Z',
  totalAmount: 150000,
  currency: 'USD',
  notes: 'Focused on product launch and lead generation',
}, ctx);

// Allocate budget across channels
await marketing.budget.allocate(budget.id, [
  { channelType: 'ads', amount: 60000, alertThreshold: 80 },
  { channelType: 'email', amount: 15000, alertThreshold: 90 },
  { channelType: 'social', amount: 35000, alertThreshold: 80 },
  { channelType: 'sms', amount: 10000, alertThreshold: 85 },
  { channelType: 'push', amount: 5000, alertThreshold: 90 },
], ctx);

// Activate the budget
await marketing.budget.activate(budget.id, ctx);

// Record spend
await marketing.budget.recordSpend({
  budgetId: budget.id,
  channelType: 'ads',
  amount: 1250.00,
  description: 'Google Ads - Week 1 spend',
  spendDate: '2025-01-07T00:00:00Z',
  campaignId: campaign.id,
  externalRef: 'INV-2025-0042',
}, ctx);

// Get ROI forecast
const forecast = await marketing.budget.forecast(budget.id, ctx);
console.log(`Projected ROI: ${forecast.projectedROI}%`);
console.log(`Confidence: ${forecast.confidence.low}% - ${forecast.confidence.high}%`);

// Get channel mix optimization recommendations
const recommendation = await marketing.budget.optimizeMix(budget.id, ctx);
for (const [channel, rationale] of Object.entries(recommendation.rationale)) {
  console.log(`${channel}: ${rationale}`);
}
// → ads: Increase by 12% — highest historical ROAS at $4.20 per dollar
// → social: Decrease by 5% — declining engagement trend over last 60 days
// → email: Maintain — stable performance with best cost per MQL

console.log(`Projected improvement: +${recommendation.projectedImprovement}% overall ROI`);
```

### Example 8 — Marketing Analytics and Attribution

```typescript
// Get campaign ROI
const campaignMetrics = await marketing.analytics.getCampaignMetrics(campaign.id, ctx);
console.log(`Open Rate: ${campaignMetrics.openRate}%`);
console.log(`Click Rate: ${campaignMetrics.clickRate}%`);
console.log(`Conversion Rate: ${campaignMetrics.conversionRate}%`);
console.log(`ROI: ${campaignMetrics.roi}%`);
console.log(`CPA: $${campaignMetrics.cpa}`);

// Multi-touch attribution analysis
const attribution = await marketing.analytics.getAttribution({
  model: 'u_shaped',
  dateRange: { start: '2025-01-01', end: '2025-03-31' },
  conversionEvent: 'purchase',
}, ctx);

for (const channel of attribution.channelAttribution) {
  console.log(`${channel.channelType}: ${channel.totalCreditValue.toFixed(2)} ` +
    `(${channel.conversions} conversions, avg credit $${channel.avgCreditPerConversion.toFixed(2)})`);
}
// → email: $45,200.00 (180 conversions, avg credit $251.11)
// → ads: $38,750.00 (155 conversions, avg credit $250.00)
// → social: $12,300.00 (62 conversions, avg credit $198.39)

// Funnel analysis
const funnel = await marketing.analytics.getFunnelConversion({
  stages: [
    { name: 'Website Visit', event: 'page.viewed' },
    { name: 'Signup', event: 'user.signed_up' },
    { name: 'Onboarding Complete', event: 'onboarding.completed' },
    { name: 'First Purchase', event: 'purchase.completed' },
  ],
  dateRange: { start: '2025-01-01', end: '2025-03-31' },
}, ctx);

console.log(`Overall funnel CR: ${funnel.overallConversionRate}%`);
for (const stage of funnel.stages) {
  console.log(`  ${stage.name}: ${stage.count} contacts ` +
    `(${stage.conversionRate}% from previous, ` +
    `${stage.dropOff} drop-offs)`);
}

// Engagement scoring
const engagement = await marketing.analytics.getEngagementScore('contact_abc123', ctx);
console.log(`Engagement Score: ${engagement.score}/100 (${engagement.trend})`);
console.log(`  Email: ${engagement.dimensions.emailEngagement}`);
console.log(`  Web: ${engagement.dimensions.webEngagement}`);
console.log(`  Social: ${engagement.dimensions.socialEngagement}`);

// List MQLs generated this month
const mqls = await marketing.scoring.listScores({
  qualificationLevel: ['mql', 'sql'],
  lastActivityFrom: '2025-03-01T00:00:00Z',
  sortBy: 'totalScore',
  sortOrder: 'desc',
  pageSize: 50,
}, ctx);

console.log(`${mqls.total} qualified leads this month`);
```

---

## 7. Error Codes

All errors extend the base `MktgError` class and include a machine-readable `code`, human-readable `message`, and optional `details` object.

| Code | HTTP | Description |
|------|------|-------------|
| `MKTG_CAMPAIGN_NOT_FOUND` | 404 | Campaign with the given ID does not exist or is not accessible in the current tenant. |
| `MKTG_CAMPAIGN_NAME_REQUIRED` | 400 | Campaign name is required and cannot be empty. |
| `MKTG_CAMPAIGN_INVALID_DATES` | 400 | Campaign start date must be before end date, and both must be in the future for new campaigns. |
| `MKTG_CAMPAIGN_NOT_EDITABLE` | 409 | Campaign cannot be edited in its current status. Only `draft` and `paused` campaigns are editable. |
| `MKTG_CAMPAIGN_NOT_LAUNCHABLE` | 409 | Campaign cannot be launched. Must be in `draft` or `scheduled` status with at least one channel and audience. |
| `MKTG_CAMPAIGN_NOT_ACTIVE` | 409 | Operation requires the campaign to be in `active` status. |
| `MKTG_CAMPAIGN_NOT_PAUSED` | 409 | Resume operation requires the campaign to be in `paused` status. |
| `MKTG_CAMPAIGN_ALREADY_COMPLETED` | 409 | Campaign has already been completed and cannot be modified or cancelled. |
| `MKTG_CAMPAIGN_NOT_ARCHIVABLE` | 409 | Campaign must be in `completed` or `cancelled` status to be archived. |
| `MKTG_CAMPAIGN_NO_CHANNELS` | 400 | Campaign must have at least one configured channel before launch. |
| `MKTG_CAMPAIGN_NO_AUDIENCE` | 400 | Campaign must have at least one audience/segment assigned before launch. |
| `MKTG_CHANNEL_NOT_FOUND` | 404 | Campaign channel with the given ID was not found. |
| `MKTG_CHANNEL_ALREADY_EXISTS` | 409 | A channel of this type already exists on the campaign. |
| `MKTG_GOAL_NOT_FOUND` | 404 | Campaign goal with the given ID was not found. |
| `MKTG_JOURNEY_NOT_FOUND` | 404 | Journey with the given ID does not exist or is not accessible. |
| `MKTG_JOURNEY_NAME_REQUIRED` | 400 | Journey name is required and cannot be empty. |
| `MKTG_JOURNEY_NOT_EDITABLE` | 409 | Journey can only be edited in `draft` status. |
| `MKTG_JOURNEY_NOT_ACTIVE` | 409 | Operation requires the journey to be in `active` status. |
| `MKTG_JOURNEY_NOT_PAUSED` | 409 | Resume operation requires the journey to be in `paused` status. |
| `MKTG_JOURNEY_VALIDATION_FAILED` | 400 | Journey DAG validation failed. The response includes specific validation errors (cycles, unreachable steps, missing configs). |
| `MKTG_JOURNEY_MAX_STEPS_EXCEEDED` | 400 | Journey exceeds the maximum allowed number of steps (default: 100). |
| `MKTG_JOURNEY_HAS_ACTIVE_ENROLLMENTS` | 409 | Journey cannot be archived while contacts are still actively enrolled. |
| `MKTG_STEP_NOT_FOUND` | 404 | Journey step with the given ID was not found. |
| `MKTG_ENROLLMENT_NOT_FOUND` | 404 | Journey enrollment for the given contact was not found. |
| `MKTG_ENROLLMENT_DUPLICATE` | 409 | Contact is already enrolled in this journey and re-entry is not allowed. |
| `MKTG_ENROLLMENT_MAX_EXCEEDED` | 400 | Batch enrollment exceeds the maximum batch size (default: 10,000). |
| `MKTG_CONTACT_NOT_FOUND` | 404 | Contact with the given ID does not exist. |
| `MKTG_CONSENT_NOT_FOUND` | 404 | No consent record exists for this contact/channel/purpose combination. |
| `MKTG_CONSENT_ALREADY_GRANTED` | 409 | Consent for this channel and purpose has already been granted. |
| `MKTG_CONSENT_ALREADY_CONFIRMED` | 409 | Double opt-in has already been confirmed for this consent record. |
| `MKTG_CONSENT_TOKEN_EXPIRED` | 410 | The double opt-in confirmation token has expired. |
| `MKTG_CONSENT_MISSING` | 403 | Contact does not have active consent for the requested channel and purpose. Marketing action suppressed. |
| `MKTG_SCORING_RULE_NOT_FOUND` | 404 | Scoring rule with the given ID does not exist. |
| `MKTG_LEAD_NOT_DISQUALIFIED` | 409 | Cannot re-qualify a lead that is not currently disqualified. |
| `MKTG_LANDING_PAGE_NOT_FOUND` | 404 | Landing page with the given ID does not exist. |
| `MKTG_LANDING_PAGE_SLUG_TAKEN` | 409 | The requested slug is already in use by another landing page in this tenant. |
| `MKTG_LANDING_PAGE_NOT_PUBLISHED` | 409 | Landing page must be published before it can accept conversions. |
| `MKTG_BUDGET_NOT_FOUND` | 404 | Marketing budget with the given ID does not exist. |
| `MKTG_BUDGET_EXHAUSTED` | 409 | Budget has been fully spent. No further spend can be recorded. |
| `MKTG_BUDGET_ALLOCATION_EXCEEDED` | 400 | Total channel allocations exceed the budget's total amount. |
| `MKTG_SPLIT_PERCENTAGES_INVALID` | 400 | A/B split variant percentages must sum to exactly 100. |
| `MKTG_PERSONALIZATION_RULE_NOT_FOUND` | 404 | Personalization rule with the given ID does not exist. |
| `MKTG_RATE_LIMITED` | 429 | Request rate limit exceeded. Retry after the specified delay. |
| `MKTG_INTERNAL_ERROR` | 500 | An unexpected internal error occurred. Check logs for details. |

### Error Response Format

```typescript
interface MktgError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  requestId?: string;
  timestamp: string;
}

// Example error response
{
  "code": "MKTG_JOURNEY_VALIDATION_FAILED",
  "message": "Journey validation failed with 2 errors",
  "statusCode": 400,
  "details": {
    "errors": [
      { "stepId": "step_3", "code": "UNREACHABLE_STEP", "message": "Step 'Send SMS' is not reachable from the trigger" },
      { "stepId": "step_5", "code": "MISSING_CONFIG", "message": "Split step 'A/B Test' has variants that sum to 80%, not 100%" }
    ],
    "warnings": [
      { "stepId": "step_2", "code": "NO_EXIT_PATH", "message": "Condition 'Is VIP?' has no 'no' path — contacts will be stuck" }
    ]
  },
  "requestId": "req_abc123",
  "timestamp": "2025-03-15T14:32:00Z"
}
```

---

## 8. Security

### Authentication & Authorization

All marketing endpoints require authentication via the standard MCV.ONE auth middleware. Authorization is enforced at two levels:

1. **Tenant isolation** — RLS policies ensure queries only return data belonging to the authenticated tenant.
2. **Permission checks** — Fine-grained permissions control who can create, edit, launch, and delete marketing resources.

```typescript
// Required permissions by operation
const MARKETING_PERMISSIONS = {
  // Campaigns
  'campaign.create':   ['marketing.campaigns.create'],
  'campaign.read':     ['marketing.campaigns.read'],
  'campaign.update':   ['marketing.campaigns.update'],
  'campaign.launch':   ['marketing.campaigns.launch'],
  'campaign.pause':    ['marketing.campaigns.manage'],
  'campaign.cancel':   ['marketing.campaigns.manage'],
  'campaign.delete':   ['marketing.campaigns.delete'],

  // Journeys
  'journey.create':    ['marketing.journeys.create'],
  'journey.read':      ['marketing.journeys.read'],
  'journey.update':    ['marketing.journeys.update'],
  'journey.publish':   ['marketing.journeys.publish'],
  'journey.manage':    ['marketing.journeys.manage'],

  // Scoring
  'scoring.read':      ['marketing.scoring.read'],
  'scoring.manage':    ['marketing.scoring.manage'],

  // Consent
  'consent.read':      ['marketing.consent.read'],
  'consent.manage':    ['marketing.consent.manage'],
  'consent.delete':    ['marketing.consent.delete'],  // GDPR erasure

  // Budgets
  'budget.read':       ['marketing.budgets.read'],
  'budget.manage':     ['marketing.budgets.manage'],

  // Landing pages
  'landing.create':    ['marketing.landing.create'],
  'landing.read':      ['marketing.landing.read'],
  'landing.publish':   ['marketing.landing.publish'],

  // Personalization
  'personalization.read':   ['marketing.personalization.read'],
  'personalization.manage': ['marketing.personalization.manage'],

  // Analytics
  'analytics.read':    ['marketing.analytics.read'],
} as const;
```

### Data Protection

| Concern | Approach |
|---------|----------|
| **PII in form submissions** | IP addresses are stored as SHA-256 hashes. Form data containing PII is encrypted at rest using tenant-specific keys. |
| **Consent audit trail** | Consent events are append-only. IP addresses and user agents are captured for legal compliance but accessible only to `consent.read` permission holders. |
| **Landing page scripts** | Custom JavaScript in landing page versions is sanitized using a CSP-compatible allowlist. Inline event handlers are stripped. |
| **Email content** | Email templates are rendered server-side. User-supplied merge fields are HTML-escaped to prevent XSS. |
| **Journey context** | Enrollment context data (accumulated during journey execution) is scoped to the enrollment and cannot be accessed across contacts. |
| **Score data** | Lead scores are not exposed to contacts. Score-based routing rules operate server-side only. |

### Rate Limiting

| Operation | Limit | Window |
|-----------|-------|--------|
| Campaign CRUD | 100 | 1 minute |
| Campaign launch | 10 | 1 minute |
| Journey publish | 10 | 1 minute |
| Batch enrollment | 5 | 1 minute |
| Score event recording | 1,000 | 1 minute |
| Consent operations | 200 | 1 minute |
| Personalization evaluation | 10,000 | 1 minute |
| Landing page conversion | 5,000 | 1 minute |
| Analytics queries | 60 | 1 minute |

### Input Validation

- All string inputs are validated for length (campaign names max 255 chars, descriptions max 5000 chars).
- JSON configs (journey step configs, channel configs) are validated against strict TypeScript schemas.
- URL fields are validated for format and protocol (HTTPS only in production).
- Numeric values (budget amounts, scores, percentages) are bounds-checked.
- Date/time inputs must be valid ISO 8601 strings.

### Webhook Security

Outbound webhooks (from journey actions and lead routing) include:
- HMAC-SHA256 signature in `X-Webhook-Signature` header
- Unique delivery ID in `X-Webhook-Id` header
- Timestamp in `X-Webhook-Timestamp` header
- Retry with exponential backoff (3 attempts, 1s → 5s → 25s)

---

## 9. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MARKETING_DATABASE_URL` | Yes | — | PostgreSQL connection string for marketing tables. Falls back to `DATABASE_URL`. |
| `MARKETING_REDPANDA_BROKERS` | Yes | — | Comma-separated Redpanda broker addresses. Falls back to `REDPANDA_BROKERS`. |
| `MARKETING_REDPANDA_GROUP_ID` | No | `mcv-marketing` | Redpanda consumer group ID for journey event processing. |
| `MARKETING_EVENT_TOPIC_PREFIX` | No | `marketing` | Prefix for all marketing Redpanda topics. |
| `MARKETING_EVENT_PARTITIONS` | No | `6` | Number of partitions for marketing topics. |
| `MARKETING_JOURNEY_MAX_STEPS` | No | `100` | Maximum number of steps allowed per journey. |
| `MARKETING_JOURNEY_MAX_ENROLLMENTS_BATCH` | No | `10000` | Maximum contacts per batch enrollment call. |
| `MARKETING_JOURNEY_PROCESSOR_CONCURRENCY` | No | `10` | Number of concurrent journey event processors. |
| `MARKETING_SCORE_DECAY_SCHEDULE` | No | `0 2 * * *` | Cron schedule for score decay processing (default: 2 AM daily). |
| `MARKETING_SCORE_MQL_THRESHOLD` | No | `50` | Score threshold for Marketing Qualified Lead status. |
| `MARKETING_SCORE_SQL_THRESHOLD` | No | `100` | Score threshold for Sales Qualified Lead status. |
| `MARKETING_CONSENT_DOI_TOKEN_TTL` | No | `72h` | Time-to-live for double opt-in confirmation tokens. |
| `MARKETING_CONSENT_EXPIRY_SCHEDULE` | No | `0 3 * * *` | Cron schedule for consent expiry processing (default: 3 AM daily). |
| `MARKETING_LANDING_PAGE_DOMAIN` | No | — | Default domain for landing page URLs. |
| `MARKETING_LANDING_PAGE_CDN_URL` | No | — | CDN base URL for landing page static assets. |
| `MARKETING_WEBHOOK_SECRET` | No | auto-generated | Secret key for HMAC-SHA256 webhook signatures. |
| `MARKETING_WEBHOOK_TIMEOUT_MS` | No | `10000` | Timeout for outbound webhook requests. |
| `MARKETING_RATE_LIMIT_ENABLED` | No | `true` | Whether to enforce API rate limiting. |
| `MARKETING_PERSONALIZATION_CACHE_TTL` | No | `300` | TTL in seconds for personalization rule cache. |
| `MARKETING_ANALYTICS_CACHE_TTL` | No | `600` | TTL in seconds for analytics query cache. |
| `MARKETING_ENCRYPTION_KEY` | Yes (prod) | — | AES-256-GCM key for encrypting PII in form submissions. |
| `MARKETING_LOG_LEVEL` | No | `info` | Log level for the marketing module (`debug`, `info`, `warn`, `error`). |

---

## 10. Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/db` | Drizzle ORM setup, shared schema utilities (`primaryId`, `tenantId`, `timestamps`), database connection pool |
| `@mcv/auth` | Authentication middleware, permission checks, tenant context extraction |
| `@mcv/events` | Event bus abstraction over Redpanda — publish/subscribe, topic management, consumer groups |
| `@mcv/trpc` | tRPC router setup, middleware chain, error formatting |
| `@mcv/logger` | Structured logging with tenant and request context |
| `@mcv/config` | Environment variable parsing, validation, and typed config objects |
| `@mcv/crypto` | AES-256-GCM encryption for PII, HMAC-SHA256 for webhook signatures, secure token generation |
| `@mcv/cache` | Redis-backed caching for personalization rules, analytics queries, and consent lookups |
| `@mcv/jobs` | Cron job scheduling for score decay, consent expiry, and analytics aggregation |
| `@mcv/growth/cdp` | Customer Data Platform — contact profiles, segment evaluation, event tracking |
| `@mcv/growth/crm` | CRM integration — deal creation, owner assignment, activity logging |
| `@mcv/comms/email` | Email sending service — template rendering, delivery tracking |
| `@mcv/comms/sms` | SMS sending service — message delivery, opt-out handling |
| `@mcv/comms/push` | Push notification service — device tokens, delivery |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.34` | Type-safe SQL query builder and ORM |
| `@trpc/server` | `^11` | End-to-end typesafe API layer |
| `kafkajs` | `^2.2` | Redpanda/Kafka client for event streaming |
| `zod` | `^3.22` | Runtime schema validation for all inputs |
| `date-fns` | `^3.6` | Date manipulation for delays, schedules, and business day calculations |
| `cron-parser` | `^4.9` | Cron expression parsing for scheduled triggers |
| `nanoid` | `^5` | Compact, URL-safe unique ID generation |
| `ioredis` | `^5.3` | Redis client for caching layer |
| `prom-client` | `^15` | Prometheus metrics for monitoring journey throughput and scoring latency |

### Peer Dependencies

| Package | Version | Notes |
|---------|---------|-------|
| `@supabase/supabase-js` | `^2` | Required for RLS policy enforcement via Supabase client |

---

## 11. Testing

### Test Structure

```
src/
├── __tests__/
│   ├── services/
│   │   ├── campaign.service.test.ts
│   │   ├── journey.service.test.ts
│   │   ├── lead-scoring.service.test.ts
│   │   ├── consent.service.test.ts
│   │   ├── landing-page.service.test.ts
│   │   ├── personalization.service.test.ts
│   │   ├── marketing-budget.service.test.ts
│   │   ├── attribution.service.test.ts
│   │   └── funnel-analytics.service.test.ts
│   ├── engine/
│   │   ├── journey.engine.test.ts
│   │   ├── step-executor.test.ts
│   │   ├── event-processor.test.ts
│   │   ├── personalization.engine.test.ts
│   │   └── score-decay.processor.test.ts
│   ├── router/
│   │   ├── campaign.router.test.ts
│   │   ├── journey.router.test.ts
│   │   ├── scoring.router.test.ts
│   │   ├── consent.router.test.ts
│   │   └── landing-page.router.test.ts
│   ├── integration/
│   │   ├── campaign-lifecycle.test.ts
│   │   ├── journey-execution.test.ts
│   │   ├── lead-scoring-pipeline.test.ts
│   │   ├── consent-enforcement.test.ts
│   │   └── budget-tracking.test.ts
│   └── fixtures/
│       ├── campaigns.fixtures.ts
│       ├── journeys.fixtures.ts
│       ├── contacts.fixtures.ts
│       └── events.fixtures.ts
```

### Running Tests

```bash
# All marketing tests
pnpm test --filter=@mcv/growth/marketing

# Unit tests only
pnpm test --filter=@mcv/growth/marketing -- --testPathPattern='services|engine'

# Integration tests only (requires database)
pnpm test:integration --filter=@mcv/growth/marketing

# Specific test file
pnpm test --filter=@mcv/growth/marketing -- journey.engine.test

# With coverage
pnpm test:coverage --filter=@mcv/growth/marketing
```

### Unit Test Examples

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CampaignService } from '../services/campaign.service';
import { createTestContext, createMockDb, createMockEventBus } from '@mcv/test-utils';
import { campaignFixtures } from './fixtures/campaigns.fixtures';

describe('CampaignService', () => {
  let service: CampaignService;
  let db: ReturnType<typeof createMockDb>;
  let eventBus: ReturnType<typeof createMockEventBus>;
  let ctx: ReturnType<typeof createTestContext>;

  beforeEach(() => {
    db = createMockDb();
    eventBus = createMockEventBus();
    ctx = createTestContext({ tenantId: 'tenant_test' });
    service = new CampaignService({ db, eventBus });
  });

  describe('create', () => {
    it('should create a campaign in draft status', async () => {
      const input = campaignFixtures.validCreate();
      const campaign = await service.create(input, ctx);

      expect(campaign.status).toBe('draft');
      expect(campaign.name).toBe(input.name);
      expect(campaign.tenantId).toBe('tenant_test');
      expect(campaign.createdBy).toBe(ctx.userId);
    });

    it('should reject empty campaign name', async () => {
      const input = campaignFixtures.validCreate({ name: '' });

      await expect(service.create(input, ctx))
        .rejects.toThrow('MKTG_CAMPAIGN_NAME_REQUIRED');
    });

    it('should reject invalid date range', async () => {
      const input = campaignFixtures.validCreate({
        startDate: '2025-04-01T00:00:00Z',
        endDate: '2025-03-01T00:00:00Z',
      });

      await expect(service.create(input, ctx))
        .rejects.toThrow('MKTG_CAMPAIGN_INVALID_DATES');
    });
  });

  describe('launch', () => {
    it('should transition draft campaign to active', async () => {
      db.mockCampaign(campaignFixtures.draft());

      const launched = await service.launch('camp_1', ctx);

      expect(launched.status).toBe('active');
      expect(launched.launchedAt).toBeDefined();
      expect(eventBus.published).toContainEqual(
        expect.objectContaining({ type: 'campaign.launched' }),
      );
    });

    it('should reject launch without channels', async () => {
      db.mockCampaign(campaignFixtures.draft({ channels: [] }));

      await expect(service.launch('camp_1', ctx))
        .rejects.toThrow('MKTG_CAMPAIGN_NO_CHANNELS');
    });

    it('should reject launch without audience', async () => {
      db.mockCampaign(campaignFixtures.draft({ audienceIds: [] }));

      await expect(service.launch('camp_1', ctx))
        .rejects.toThrow('MKTG_CAMPAIGN_NO_AUDIENCE');
    });
  });
});
```

```typescript
describe('JourneyEngine', () => {
  let engine: JourneyEngine;
  let executor: ReturnType<typeof createMockStepExecutor>;

  beforeEach(() => {
    executor = createMockStepExecutor();
    engine = new JourneyEngine({ executor, db, eventBus });
  });

  describe('evaluateCondition', () => {
    it('should evaluate simple equality condition', async () => {
      const step: ConditionStepConfig = {
        field: 'plan',
        operator: 'eq',
        value: 'enterprise',
        source: 'contact',
      };

      const contact = { plan: 'enterprise', name: 'Test' };
      const result = await engine.evaluateCondition(step, { contact });

      expect(result).toBe(true);
    });

    it('should evaluate "in" operator with array', async () => {
      const step: ConditionStepConfig = {
        field: 'country',
        operator: 'in',
        value: ['US', 'CA', 'UK'],
        source: 'contact',
      };

      const contact = { country: 'CA' };
      expect(await engine.evaluateCondition(step, { contact })).toBe(true);

      const contact2 = { country: 'FR' };
      expect(await engine.evaluateCondition(step, { contact2 })).toBe(false);
    });

    it('should handle nested field paths', async () => {
      const step: ConditionStepConfig = {
        field: 'company.size',
        operator: 'gte',
        value: 50,
        source: 'contact',
      };

      const contact = { company: { size: 200, name: 'Acme' } };
      expect(await engine.evaluateCondition(step, { contact })).toBe(true);
    });
  });

  describe('processSplit', () => {
    it('should assign contacts to variants based on percentages', async () => {
      const splitConfig: SplitStepConfig = {
        variants: [
          { id: 'A', name: 'Control', percentage: 50, nextStepId: 'step_a' },
          { id: 'B', name: 'Test', percentage: 50, nextStepId: 'step_b' },
        ],
      };

      const assignments = new Map<string, number>();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const result = engine.processSplit(splitConfig, `enrollment_${i}`);
        const count = assignments.get(result.variantId) ?? 0;
        assignments.set(result.variantId, count + 1);
      }

      // Should be roughly 50/50 (within 5% tolerance)
      const aCount = assignments.get('A') ?? 0;
      expect(aCount).toBeGreaterThan(iterations * 0.45);
      expect(aCount).toBeLessThan(iterations * 0.55);
    });

    it('should reject split where percentages do not sum to 100', () => {
      const splitConfig: SplitStepConfig = {
        variants: [
          { id: 'A', name: 'A', percentage: 40, nextStepId: 'step_a' },
          { id: 'B', name: 'B', percentage: 40, nextStepId: 'step_b' },
        ],
      };

      expect(() => engine.processSplit(splitConfig, 'enrollment_1'))
        .toThrow('MKTG_SPLIT_PERCENTAGES_INVALID');
    });
  });
});
```

```typescript
describe('LeadScoringService', () => {
  describe('recordEvent', () => {
    it('should increase score based on matching rule', async () => {
      db.mockScoringRules([
        scoringFixtures.rule({ eventName: 'page.viewed', points: 5 }),
      ]);
      db.mockLeadScore(scoringFixtures.score({ totalScore: 20 }));

      const score = await service.recordEvent(
        'contact_1',
        'page.viewed',
        { url: '/features' },
        ctx,
      );

      expect(score.totalScore).toBe(25);
      expect(score.behavioralScore).toBe(25);
    });

    it('should respect max occurrences per window', async () => {
      db.mockScoringRules([
        scoringFixtures.rule({
          eventName: 'email.opened',
          points: 5,
          maxOccurrences: 3,
          occurrenceWindow: { days: 7 },
        }),
      ]);
      db.mockLeadScore(scoringFixtures.score({ totalScore: 10 }));
      db.mockScoreEvents([
        scoringFixtures.event({ eventType: 'email.opened', timestamp: '2025-03-14T10:00:00Z' }),
        scoringFixtures.event({ eventType: 'email.opened', timestamp: '2025-03-13T10:00:00Z' }),
        scoringFixtures.event({ eventType: 'email.opened', timestamp: '2025-03-12T10:00:00Z' }),
      ]);

      const score = await service.recordEvent('contact_1', 'email.opened', {}, ctx);

      // Should NOT increase — max 3 occurrences in 7 days already hit
      expect(score.totalScore).toBe(10);
    });

    it('should trigger MQL routing when threshold crossed', async () => {
      db.mockScoringRules([
        scoringFixtures.rule({ eventName: 'demo.requested', points: 50 }),
      ]);
      db.mockLeadScore(scoringFixtures.score({
        totalScore: 45,
        qualificationLevel: 'warm',
      }));
      db.mockRoutingRules([
        scoringFixtures.routingRule({
          triggerLevel: 'mql',
          actions: [{ type: 'notify', channelType: 'slack', target: '#sales' }],
        }),
      ]);

      const score = await service.recordEvent('contact_1', 'demo.requested', {}, ctx);

      expect(score.totalScore).toBe(95);
      expect(score.qualificationLevel).toBe('mql');
      expect(eventBus.published).toContainEqual(
        expect.objectContaining({ type: 'lead.qualified', data: expect.objectContaining({ level: 'mql' }) }),
      );
      expect(eventBus.published).toContainEqual(
        expect.objectContaining({ type: 'lead.routed' }),
      );
    });
  });

  describe('applyDecay', () => {
    it('should reduce scores by the configured rate', async () => {
      db.mockLeadScores([
        scoringFixtures.score({ contactId: 'c1', totalScore: 100, lastActivityAt: '2025-02-01' }),
        scoringFixtures.score({ contactId: 'c2', totalScore: 60, lastActivityAt: '2025-02-20' }),
      ]);

      const result = await service.applyDecay({
        enabled: true,
        rate: 0.05,
        period: 'weekly',
        minScore: 0,
        gracePeriod: { days: 14 },
      }, ctx);

      expect(result.decayedCount).toBe(1); // only c1 (c2 within grace period)
    });

    it('should not reduce scores below minScore', async () => {
      db.mockLeadScores([
        scoringFixtures.score({ contactId: 'c1', totalScore: 3, lastActivityAt: '2025-01-01' }),
      ]);

      await service.applyDecay({
        enabled: true,
        rate: 0.10,
        period: 'weekly',
        minScore: 2,
        gracePeriod: { days: 7 },
      }, ctx);

      const score = await service.getScore('c1', ctx);
      expect(score.totalScore).toBeGreaterThanOrEqual(2);
    });
  });
});
```

```typescript
describe('ConsentService', () => {
  describe('enforcement', () => {
    it('should block marketing action when consent is missing', async () => {
      db.mockConsent(null); // no consent record

      const hasConsent = await service.checkConsent(
        'contact_1', 'email', 'marketing', ctx,
      );

      expect(hasConsent).toBe(false);
    });

    it('should allow action when consent is granted', async () => {
      db.mockConsent(consentFixtures.granted({
        channel: 'email',
        purpose: 'marketing',
      }));

      const hasConsent = await service.checkConsent(
        'contact_1', 'email', 'marketing', ctx,
      );

      expect(hasConsent).toBe(true);
    });

    it('should block action when consent is revoked', async () => {
      db.mockConsent(consentFixtures.revoked({
        channel: 'email',
        purpose: 'marketing',
      }));

      const hasConsent = await service.checkConsent(
        'contact_1', 'email', 'marketing', ctx,
      );

      expect(hasConsent).toBe(false);
    });

    it('should block action when consent has expired', async () => {
      db.mockConsent(consentFixtures.granted({
        channel: 'email',
        purpose: 'marketing',
        expiresAt: '2024-12-31T23:59:59Z', // expired
      }));

      const hasConsent = await service.checkConsent(
        'contact_1', 'email', 'marketing', ctx,
      );

      expect(hasConsent).toBe(false);
    });
  });

  describe('globalUnsubscribe', () => {
    it('should revoke all marketing consents for a contact', async () => {
      db.mockConsents([
        consentFixtures.granted({ channel: 'email', purpose: 'marketing' }),
        consentFixtures.granted({ channel: 'sms', purpose: 'marketing' }),
        consentFixtures.granted({ channel: 'email', purpose: 'transactional' }),
      ]);

      const revoked = await service.globalUnsubscribe(
        'contact_1', 'preference_center', ctx,
      );

      // Should revoke marketing consents but NOT transactional
      expect(revoked).toHaveLength(2);
      expect(revoked.every(c => c.status === 'revoked')).toBe(true);
    });
  });
});
```

### Integration Test Example

```typescript
describe('Journey Execution (integration)', () => {
  let marketing: MarketingService;

  beforeAll(async () => {
    marketing = await setupIntegrationTest();
  });

  afterAll(async () => {
    await teardownIntegrationTest();
  });

  it('should execute a complete journey from trigger to completion', async () => {
    // 1. Create and publish a simple journey
    const journey = await marketing.journeys.create({
      name: 'Integration Test Journey',
      trigger: { type: 'manual' },
      settings: { enforceConsent: false },
    }, ctx);

    const step1 = await marketing.journeys.addStep(journey.id, {
      type: 'action',
      name: 'Tag Contact',
      config: {
        actionType: 'add_tag',
        actionConfig: { tag: 'journey_completed' },
        skipOnNoConsent: false,
      },
      nextStepId: null,
      yesStepId: null,
      noStepId: null,
      position: { x: 0, y: 0 },
      order: 1,
      description: null,
    }, ctx);

    await marketing.journeys.publish(journey.id, ctx);

    // 2. Enroll a contact
    const [enrollment] = await marketing.journeys.enrollContacts(
      journey.id,
      ['contact_integration_1'],
      ctx,
    );

    expect(enrollment.status).toBe('active');

    // 3. Wait for async processing
    await waitForCondition(async () => {
      const updated = await marketing.journeys.getEnrollments(
        journey.id,
        { page: 1, pageSize: 1 },
        ctx,
      );
      return updated.items[0].status === 'completed';
    }, { timeoutMs: 10000, intervalMs: 500 });

    // 4. Verify completion
    const metrics = await marketing.journeys.getMetrics(journey.id, ctx);
    expect(metrics.completedEnrollments).toBe(1);
    expect(metrics.completionRate).toBe(1);
  });

  it('should respect consent enforcement in journey actions', async () => {
    const journey = await marketing.journeys.create({
      name: 'Consent Test Journey',
      trigger: { type: 'manual' },
      settings: { enforceConsent: true },
    }, ctx);

    await marketing.journeys.addStep(journey.id, {
      type: 'action',
      name: 'Send Email',
      config: {
        actionType: 'send_email',
        actionConfig: { templateId: 'tpl_test', subject: 'Test' },
        skipOnNoConsent: true, // skip instead of fail
      },
      nextStepId: null,
      yesStepId: null,
      noStepId: null,
      position: { x: 0, y: 0 },
      order: 1,
      description: null,
    }, ctx);

    await marketing.journeys.publish(journey.id, ctx);

    // Contact has NO email marketing consent
    const [enrollment] = await marketing.journeys.enrollContacts(
      journey.id,
      ['contact_no_consent'],
      ctx,
    );

    await waitForCondition(async () => {
      const updated = await marketing.journeys.getEnrollments(
        journey.id, { page: 1, pageSize: 1 }, ctx,
      );
      return updated.items[0].status === 'completed';
    }, { timeoutMs: 10000 });

    // Step should have been skipped, not failed
    const finalMetrics = await marketing.journeys.getMetrics(journey.id, ctx);
    const stepMetrics = Object.values(finalMetrics.stepMetrics)[0];
    expect(stepMetrics.skipped).toBe(1);
    expect(stepMetrics.failed).toBe(0);
  });
});
```

### Coverage Targets

| Category | Target | Notes |
|----------|--------|-------|
| **Services** | ≥ 90% | All public methods must be covered |
| **Engine** | ≥ 95% | Journey engine and scoring pipeline are critical paths |
| **Router** | ≥ 85% | Input validation and error mapping |
| **Schema** | ≥ 80% | Relation definitions and migrations |
| **Integration** | ≥ 75% | End-to-end flows covering happy paths and key edge cases |
| **Overall** | ≥ 88% | Maintained via CI gate |

---

*Last updated: 2025-03-15. Module version: 0.14.0.*