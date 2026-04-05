# @mcv/nexus/support

> **Help Desk & Support** — Customer support ticketing, knowledge management, SLA enforcement, and self-service capabilities for the MCV.ONE platform.

**Package:** `@mcv/nexus/support`  
**Domain:** Nexus (Customer Engagement)  
**Tier:** 5 (Domain Module)  
**Since:** 0.12.0  
**Status:** Stable  
**Maintainer:** MCV Platform Team

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Ticket Lifecycle](#ticket-lifecycle)
  - [SLA Engine](#sla-engine)
  - [Routing Engine](#routing-engine)
  - [Multi-Channel Ingestion](#multi-channel-ingestion)
  - [Knowledge Base Engine](#knowledge-base-engine)
  - [Automation Pipeline](#automation-pipeline)
- [Core Interfaces](#core-interfaces)
  - [SupportService](#supportservice)
  - [Ticket](#ticket)
  - [TicketComment](#ticketcomment)
  - [SLA](#sla)
  - [SLAInstance](#slainstance)
  - [Macro](#macro)
  - [Automation](#automation)
  - [AutomationAction](#automationaction)
  - [SelfServicePortal](#selfserviceportal)
  - [KBArticle](#kbarticle)
  - [KBCategory](#kbcategory)
  - [CSATSurvey](#csatsurvey)
  - [CSATResponse](#csatresponse)
  - [SupportReport](#supportreport)
  - [TicketFollower](#ticketfollower)
  - [TicketLink](#ticketlink)
  - [TicketTag](#tickettag)
  - [EscalationRule](#escalationrule)
  - [RoutingConfig](#routingconfig)
  - [AgentAvailability](#agentavailability)
  - [ChannelConfig](#channelconfig)
- [Database Schemas](#database-schemas)
  - [tickets](#tickets)
  - [ticket_comments](#ticket_comments)
  - [ticket_tags](#ticket_tags)
  - [ticket_followers](#ticket_followers)
  - [ticket_links](#ticket_links)
  - [sla_policies](#sla_policies)
  - [sla_instances](#sla_instances)
  - [macros](#macros)
  - [automations](#automations)
  - [automation_actions](#automation_actions)
  - [kb_articles](#kb_articles)
  - [kb_categories](#kb_categories)
  - [csat_responses](#csat_responses)
  - [channel_configs](#channel_configs)
  - [escalation_rules](#escalation_rules)
  - [agent_skills](#agent_skills)
- [Code Examples](#code-examples)
  - [1 — Creating and Assigning a Ticket](#1--creating-and-assigning-a-ticket)
  - [2 — SLA Policy Configuration and Breach Detection](#2--sla-policy-configuration-and-breach-detection)
  - [3 — Ticket Routing with Skill-Based Assignment](#3--ticket-routing-with-skill-based-assignment)
  - [4 — Knowledge Base Article Management](#4--knowledge-base-article-management)
  - [5 — Macro Execution and Automation Triggers](#5--macro-execution-and-automation-triggers)
  - [6 — Multi-Channel Ticket Ingestion](#6--multi-channel-ticket-ingestion)
  - [7 — CSAT Survey and Satisfaction Reporting](#7--csat-survey-and-satisfaction-reporting)
  - [8 — Ticket Collaboration: Merging, Linking, and Side Conversations](#8--ticket-collaboration-merging-linking-and-side-conversations)
- [Error Codes](#error-codes)
- [Security](#security)
  - [Multi-Tenant Isolation](#multi-tenant-isolation)
  - [Role-Based Access Control](#role-based-access-control)
  - [Data Protection](#data-protection)
  - [Audit Trail](#audit-trail)
  - [API Security](#api-security)
  - [Self-Service Portal Security](#self-service-portal-security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [End-to-End Tests](#end-to-end-tests)
  - [Performance Tests](#performance-tests)
  - [Test Utilities](#test-utilities)

---

## Purpose

`@mcv/nexus/support` provides a complete help desk and customer support system within the MCV.ONE platform. It enables organizations to manage customer inquiries through a structured ticketing system, enforce service level agreements, empower customers with self-service capabilities, and derive actionable insights from support interactions.

### What It Does

- **Ticket Management** — Full CRUD lifecycle for support tickets with status tracking (new → open → pending → resolved → closed), priority classification (critical, high, normal, low), hierarchical categories, and free-form tagging. Tickets maintain a complete audit trail of every state transition, assignment change, and field modification.

- **Ticket Routing** — Intelligent automatic assignment of incoming tickets to the right agent using configurable strategies: round-robin for even distribution, load-balanced based on current workload, or skill-based matching that pairs ticket categories with agent expertise. Supports fallback chains and overflow handling.

- **SLA Management** — Define service level agreements with first-response time and resolution time targets per priority level. The SLA engine continuously monitors active tickets, calculates remaining time accounting for business hours, fires warning alerts before breaches, and escalates automatically when targets are missed.

- **Self-Service Portal** — Customer-facing portal where end users can submit new tickets, track the status of existing tickets, search the knowledge base, and participate in community forums. Reduces support volume by deflecting common inquiries to self-service content.

- **Knowledge Base** — Author, version, and publish help articles organized into categories. Articles can be internal (agent-only) or external (customer-facing). When agents work on tickets, the system suggests relevant articles based on ticket content. Supports rich text, embedded media, and article feedback ratings.

- **Macros & Automation** — Macros provide one-click shortcuts for common agent actions (canned responses, status changes, field updates). Automations are event-driven rules that execute actions when conditions are met — on ticket creation, on update, on SLA breach, or on a time-based schedule. Supports automated tagging, routing, notifications, and webhook triggers.

- **Multi-Channel Ingestion** — Create tickets from email, live chat, phone calls, social media (Twitter, Facebook), or direct API calls. Each channel has its own configuration for parsing, authentication, and response formatting. Channel-aware responses ensure replies go back through the originating channel.

- **Customer Satisfaction** — Automatically send CSAT surveys after ticket resolution. Track satisfaction scores per agent, per category, and over time. Support NPS (Net Promoter Score) campaigns. Surface trends and outliers in satisfaction dashboards.

- **Reporting** — Comprehensive analytics covering ticket volume trends, average resolution time, first-contact resolution rate, backlog aging distribution, agent productivity metrics, SLA compliance rates, and channel distribution. Reports can be scheduled, exported, or consumed via API.

- **Collaboration** — Internal notes invisible to customers, @mention agents for input, follow tickets for updates, conduct side conversations with third parties, merge duplicate tickets, and link related tickets for cross-reference.

### Why It Exists

Customer support is a critical touchpoint that directly impacts retention, satisfaction, and revenue. Organizations need a system that:

1. **Centralizes** all customer inquiries regardless of channel into a single queue
2. **Prioritizes** work based on urgency, customer value, and contractual obligations
3. **Automates** repetitive tasks so agents focus on complex, high-value interactions
4. **Measures** performance to identify bottlenecks and drive continuous improvement
5. **Empowers** customers to resolve issues independently when possible
6. **Scales** from small teams to enterprise support operations without re-platforming

`@mcv/nexus/support` delivers all of this as a first-class module in the MCV.ONE ecosystem, fully integrated with identity (`@mcv/nexus/iam`), notifications (`@mcv/nexus/notifications`), billing (`@mcv/nexus/billing`), and analytics (`@mcv/nexus/analytics`).

### Design Principles

- **Tenant-First** — Every record is scoped to a tenant. Row-level security ensures complete data isolation. There is no global ticket queue — each organization sees only their own data.
- **Event-Driven** — All ticket mutations emit events to Redpanda, enabling real-time automations, SLA tracking, analytics pipelines, and external integrations without coupling.
- **Channel-Agnostic** — The core ticket model is independent of the originating channel. Channel adapters normalize inbound messages into a common format, and format outbound responses for the target channel.
- **Business-Hours Aware** — SLA calculations, automation schedules, and reporting respect configurable business hours and holiday calendars per tenant.
- **Composable** — Each capability (routing, SLA, knowledge base, automation) is a discrete, testable subsystem. They compose together but can be adopted incrementally.

---

## Exports

```typescript
// ── Primary Service ──────────────────────────────────────────────
export { SupportService }             from './services/support.service';
export { createSupportRouter }        from './router';

// ── Ticket Management ────────────────────────────────────────────
export { TicketService }              from './services/ticket.service';
export { TicketCommentService }       from './services/ticket-comment.service';
export { TicketTagService }           from './services/ticket-tag.service';
export { TicketFollowerService }      from './services/ticket-follower.service';
export { TicketLinkService }          from './services/ticket-link.service';
export { TicketMergeService }         from './services/ticket-merge.service';

// ── Routing ──────────────────────────────────────────────────────
export { RoutingEngine }              from './engines/routing.engine';
export { RoundRobinStrategy }         from './strategies/round-robin.strategy';
export { LoadBalancedStrategy }       from './strategies/load-balanced.strategy';
export { SkillBasedStrategy }         from './strategies/skill-based.strategy';

// ── SLA ──────────────────────────────────────────────────────────
export { SLAEngine }                  from './engines/sla.engine';
export { SLAPolicyService }          from './services/sla-policy.service';
export { SLAInstanceService }        from './services/sla-instance.service';
export { BusinessHoursCalculator }    from './utils/business-hours';

// ── Knowledge Base ───────────────────────────────────────────────
export { KBArticleService }          from './services/kb-article.service';
export { KBCategoryService }         from './services/kb-category.service';
export { ArticleSuggestionEngine }   from './engines/article-suggestion.engine';

// ── Self-Service ─────────────────────────────────────────────────
export { SelfServicePortalService }  from './services/self-service-portal.service';
export { PortalAuthService }         from './services/portal-auth.service';
export { CommunityForumService }     from './services/community-forum.service';

// ── Macros & Automation ──────────────────────────────────────────
export { MacroService }              from './services/macro.service';
export { MacroExecutor }             from './engines/macro-executor.engine';
export { AutomationService }         from './services/automation.service';
export { AutomationEngine }          from './engines/automation.engine';
export { TriggerEvaluator }          from './engines/trigger-evaluator.engine';

// ── Multi-Channel ────────────────────────────────────────────────
export { ChannelRouter }             from './channels/channel-router';
export { EmailChannelAdapter }       from './channels/email.adapter';
export { ChatChannelAdapter }        from './channels/chat.adapter';
export { PhoneChannelAdapter }       from './channels/phone.adapter';
export { SocialChannelAdapter }      from './channels/social.adapter';
export { APIChannelAdapter }         from './channels/api.adapter';

// ── CSAT ─────────────────────────────────────────────────────────
export { CSATService }               from './services/csat.service';
export { CSATSurveyEngine }         from './engines/csat-survey.engine';
export { NPSService }               from './services/nps.service';

// ── Reporting ────────────────────────────────────────────────────
export { SupportReportService }      from './services/support-report.service';
export { TicketAnalyticsService }    from './services/ticket-analytics.service';
export { AgentProductivityService }  from './services/agent-productivity.service';
export { SLAComplianceReporter }     from './services/sla-compliance-reporter.service';

// ── Collaboration ────────────────────────────────────────────────
export { InternalNoteService }       from './services/internal-note.service';
export { SideConversationService }   from './services/side-conversation.service';
export { MentionService }           from './services/mention.service';

// ── Event Producers ──────────────────────────────────────────────
export { TicketEventProducer }       from './events/ticket-event.producer';
export { SLAEventProducer }         from './events/sla-event.producer';
export { CSATEventProducer }        from './events/csat-event.producer';

// ── Event Consumers ──────────────────────────────────────────────
export { TicketEventConsumer }       from './events/ticket-event.consumer';
export { SLAMonitorConsumer }       from './events/sla-monitor.consumer';
export { AutomationTriggerConsumer } from './events/automation-trigger.consumer';

// ── Types ────────────────────────────────────────────────────────
export type {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketComment,
  TicketCommentType,
  TicketTag,
  TicketFollower,
  TicketLink,
  TicketLinkType,
  TicketChannel,
  TicketFilter,
  TicketSort,
  TicketCreateInput,
  TicketUpdateInput,
  TicketBulkUpdateInput,
} from './types/ticket.types';

export type {
  SLA,
  SLAPolicy,
  SLAInstance,
  SLAStatus,
  SLATarget,
  SLAMetric,
  SLABreachSeverity,
} from './types/sla.types';

export type {
  Macro,
  MacroAction,
  MacroActionType,
  MacroScope,
  MacroExecutionResult,
} from './types/macro.types';

export type {
  Automation,
  AutomationAction,
  AutomationTrigger,
  AutomationTriggerType,
  AutomationCondition,
  AutomationConditionOperator,
  AutomationStatus,
} from './types/automation.types';

export type {
  SelfServicePortal,
  PortalConfig,
  PortalTheme,
  PortalSession,
} from './types/portal.types';

export type {
  KBArticle,
  KBArticleStatus,
  KBArticleVisibility,
  KBCategory,
  KBCategoryTree,
  KBSearchResult,
  KBArticleVersion,
  KBArticleFeedback,
} from './types/kb.types';

export type {
  CSATSurvey,
  CSATResponse,
  CSATScore,
  CSATTrend,
  NPSResponse,
  NPSScore,
  SatisfactionReport,
} from './types/csat.types';

export type {
  SupportReport,
  SupportReportType,
  ReportDateRange,
  TicketVolumeReport,
  ResolutionTimeReport,
  FirstContactResolutionReport,
  BacklogAgingReport,
  AgentProductivityReport,
  SLAComplianceReport,
  ChannelDistributionReport,
} from './types/report.types';

export type {
  RoutingConfig,
  RoutingStrategy,
  RoutingResult,
  AgentAvailability,
  AgentSkill,
  AgentWorkload,
} from './types/routing.types';

export type {
  ChannelConfig,
  ChannelType,
  InboundMessage,
  OutboundMessage,
  ChannelCredentials,
} from './types/channel.types';

export type {
  EscalationRule,
  EscalationLevel,
  EscalationAction,
  EscalationTrigger,
} from './types/escalation.types';

// ── Schemas (Drizzle) ────────────────────────────────────────────
export {
  tickets,
  ticketComments,
  ticketTags,
  ticketFollowers,
  ticketLinks,
  slaPolicies,
  slaInstances,
  macros,
  automations,
  automationActions,
  kbArticles,
  kbCategories,
  csatResponses,
  channelConfigs,
  escalationRules,
  agentSkills,
} from './schemas';

// ── tRPC Router ──────────────────────────────────────────────────
export { supportRouter }             from './router';

// ── Constants ────────────────────────────────────────────────────
export {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CHANNELS,
  SLA_METRICS,
  AUTOMATION_TRIGGER_TYPES,
  MACRO_ACTION_TYPES,
  KB_ARTICLE_STATUSES,
  CSAT_SCORE_RANGE,
  NPS_SCORE_RANGE,
  DEFAULT_BUSINESS_HOURS,
  SUPPORT_EVENTS,
} from './constants';
```

---

## Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     Multi-Channel Ingestion                       │
│  ┌─────────┐ ┌──────┐ ┌───────┐ ┌────────┐ ┌─────┐ ┌─────┐    │
│  │  Email   │ │ Chat │ │ Phone │ │ Social │ │ API │ │ Web │    │
│  └────┬────┘ └──┬───┘ └──┬────┘ └───┬────┘ └──┬──┘ └──┬──┘    │
│       └─────────┴────────┴──────────┴─────────┴───────┘         │
│                           │                                       │
│                    ChannelRouter                                  │
│                    (normalize → InboundMessage)                   │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Ticket Service                              │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │   Create    │  │    Update     │  │   Comment / Collaborate  │ │
│  │  (validate  │  │  (transition  │  │  (notes, @mentions,     │ │
│  │   + persist)│  │   + events)   │  │   side conversations)   │ │
│  └─────┬──────┘  └──────┬───────┘  └────────────┬────────────┘ │
│        │                │                         │               │
│        └────────────────┴─────────────────────────┘               │
│                           │                                       │
│                    TicketEventProducer                            │
│                    (emit to Redpanda)                             │
└──────────────────────────┬───────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
┌──────────────────┐ ┌──────────┐ ┌─────────────────┐
│   Routing Engine  │ │SLA Engine│ │Automation Engine │
│  ┌────────────┐  │ │          │ │                  │
│  │Round-Robin  │  │ │ Monitor  │ │  Evaluate        │
│  │Load-Balance │  │ │ Warn     │ │  Triggers →      │
│  │Skill-Based  │  │ │ Breach   │ │  Execute Actions │
│  └────────────┘  │ │ Escalate │ │                  │
└──────────────────┘ └──────────┘ └─────────────────┘
              │            │            │
              └────────────┼────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Supporting Systems                              │
│  ┌───────────────┐  ┌────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Knowledge Base │  │ Macros │  │ CSAT Surveys  │  │Reporting │ │
│  │ (articles,     │  │(quick  │  │(post-resolve, │  │(volume,  │ │
│  │  suggestions)  │  │ reply) │  │ NPS, trends)  │  │ SLA,     │ │
│  └───────────────┘  └────────┘  └──────────────┘  │ agents)  │ │
│                                                     └──────────┘ │
└──────────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Self-Service Portal                             │
│  ┌───────────────┐  ┌────────────────┐  ┌───────────────────┐   │
│  │ Ticket Submit  │  │ Ticket Tracker  │  │ KB Search / Browse│   │
│  └───────────────┘  └────────────────┘  └───────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Ticket Lifecycle

Tickets follow a strict state machine with defined transitions:

```
              ┌─────────────────────────────────────────┐
              │                                         │
              ▼                                         │
         ┌─────────┐                                    │
         │   NEW   │ ← Ticket created                   │
         └────┬────┘                                    │
              │ Agent assigned / first action            │
              ▼                                         │
         ┌─────────┐    agent replies     ┌──────────┐ │
         │  OPEN   │ ←──────────────────── │ PENDING  │ │
         └────┬────┘                      └─────┬────┘ │
              │                                  ▲      │
              │ awaiting customer response        │      │
              └──────────────────────────────────┘      │
              │                                         │
              │ issue resolved                          │
              ▼                                         │
         ┌──────────┐                                   │
         │ RESOLVED │                                   │
         └────┬─────┘                                   │
              │                                         │
         ┌────┴──────────────────┐                      │
         │                       │                      │
         ▼                       ▼                      │
    ┌──────────┐          customer reopens               │
    │  CLOSED  │          (within window)───────────────┘
    └──────────┘
    (auto after
     72h or manual)
```

**State Definitions:**

| Status | Description | SLA Clock | Visible to Customer |
|--------|-------------|-----------|---------------------|
| `new` | Freshly created, unassigned or not yet triaged | Running | Yes |
| `open` | Assigned to an agent, actively being worked | Running | Yes |
| `pending` | Waiting for customer response | Paused | Yes |
| `resolved` | Agent believes the issue is fixed | Stopped | Yes |
| `closed` | Confirmed resolved, archived | Stopped | Yes |

**Transition Rules:**

```typescript
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  new:      ['open', 'pending', 'resolved', 'closed'],
  open:     ['pending', 'resolved', 'closed'],
  pending:  ['open', 'resolved', 'closed'],
  resolved: ['open', 'closed'],          // reopen or close
  closed:   ['open'],                     // reopen only
};
```

Every transition is recorded as a `ticket_event` and emitted to Redpanda with the schema:

```typescript
interface TicketTransitionEvent {
  eventType: 'ticket.status_changed';
  ticketId: string;
  tenantId: string;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  changedBy: string;            // agent or system user ID
  reason?: string;
  timestamp: string;            // ISO 8601
  metadata: Record<string, unknown>;
}
```

### SLA Engine

The SLA engine is a background process that continuously evaluates active SLA instances against their targets. It operates on a polling loop supplemented by event-driven triggers for immediate re-evaluation.

```
┌───────────────────────────────────────────────────────────────┐
│                        SLA Engine                              │
│                                                                │
│  ┌────────────────┐     ┌────────────────────────────────┐   │
│  │ SLA Policy      │     │ SLA Instance                    │   │
│  │ (template)      │     │ (per-ticket binding)            │   │
│  │                 │     │                                 │   │
│  │ priority: high  │────→│ ticket_id: tk_abc123            │   │
│  │ first_response: │     │ policy_id: sla_pol_001          │   │
│  │   2h            │     │ first_response_due: 2026-02-09  │   │
│  │ resolution:     │     │   T14:00:00Z                    │   │
│  │   8h            │     │ resolution_due: 2026-02-09      │   │
│  │ business_hours: │     │   T20:00:00Z                    │   │
│  │   true          │     │ status: active                  │   │
│  └────────────────┘     └────────────┬───────────────────┘   │
│                                       │                       │
│                              ┌────────┴────────┐              │
│                              ▼                 ▼              │
│                     ┌──────────────┐  ┌──────────────┐       │
│                     │   Monitor    │  │   Monitor     │       │
│                     │ First Resp.  │  │  Resolution   │       │
│                     └──────┬───────┘  └──────┬───────┘       │
│                            │                  │               │
│                    ┌───────┴──────┐   ┌──────┴───────┐       │
│                    ▼              ▼   ▼              ▼       │
│              ┌──────────┐ ┌─────────┐┌──────────┐ ┌────────┐│
│              │ On Track │ │ Warning ││ Breached │ │Achieved││
│              └──────────┘ └─────────┘└──────────┘ └────────┘│
│                                │            │                 │
│                                ▼            ▼                 │
│                          ┌──────────┐ ┌───────────┐          │
│                          │  Alert   │ │ Escalate  │          │
│                          │  Agent   │ │ to Manager│          │
│                          └──────────┘ └───────────┘          │
└───────────────────────────────────────────────────────────────┘
```

**Business Hours Calculation:**

The SLA engine uses `BusinessHoursCalculator` to accurately compute elapsed time within business hours:

```typescript
interface BusinessHours {
  timezone: string;                    // e.g., 'America/New_York'
  schedule: {
    [day in DayOfWeek]?: {
      start: string;                   // '09:00'
      end: string;                     // '17:00'
    };
  };
  holidays: Array<{
    date: string;                      // 'YYYY-MM-DD'
    name: string;
    recurring: boolean;                // annual recurrence
  }>;
}
```

**SLA Metric States:**

| State | Description | Action |
|-------|-------------|--------|
| `on_track` | Within target, no concern | None |
| `warning` | Within configurable threshold (default 75% elapsed) | Notify assigned agent |
| `breached` | Target exceeded | Notify agent + escalate per rules |
| `achieved` | Metric met within target | Record achievement |
| `paused` | Ticket in `pending` status (clock stopped) | Resume on status change |

### Routing Engine

The routing engine evaluates incoming tickets and assigns them to the most appropriate agent. It supports three pluggable strategies and a fallback mechanism:

```
                    Incoming Ticket
                         │
                         ▼
                 ┌───────────────┐
                 │ RoutingEngine │
                 └───────┬───────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
       ┌────────────┐ ┌──────────┐ ┌────────────┐
       │Round-Robin  │ │  Load    │ │   Skill    │
       │             │ │ Balanced │ │   Based    │
       │ Next agent  │ │ Fewest   │ │ Category → │
       │ in rotation │ │ open tix │ │ agent skill│
       └──────┬─────┘ └────┬─────┘ └─────┬──────┘
              │             │              │
              └─────────────┼──────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │ Availability   │
                   │ Filter         │
                   │ (online, not   │
                   │  at capacity)  │
                   └───────┬────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌──────────┐ ┌──────────┐
              │ Assigned │ │ Fallback │
              │ to Agent │ │ (queue,  │
              └──────────┘ │  unassign│
                           │  or      │
                           │  default)│
                           └──────────┘
```

**Strategy Selection Logic:**

```typescript
interface RoutingConfig {
  id: string;
  tenantId: string;
  strategy: 'round_robin' | 'load_balanced' | 'skill_based';
  fallbackStrategy: 'queue' | 'unassigned' | 'default_agent';
  fallbackAgentId?: string;
  maxTicketsPerAgent: number;
  respectBusinessHours: boolean;
  autoAssignOnCreate: boolean;
  reassignOnEscalation: boolean;
  skillMatchThreshold: number;         // 0.0 - 1.0
}
```

### Multi-Channel Ingestion

Each support channel has a dedicated adapter that normalizes inbound messages into a common `InboundMessage` format:

```
  ┌─────────────────────────────────────────────────────────┐
  │                  Channel Adapters                        │
  │                                                          │
  │  ┌──────────────┐   Incoming email                      │
  │  │EmailAdapter   │ → Parse subject, body, attachments    │
  │  │(IMAP/webhook) │ → Extract reply thread ID             │
  │  └──────┬───────┘ → Map sender to customer               │
  │         │                                                │
  │  ┌──────────────┐   Chat message                         │
  │  │ChatAdapter    │ → Extract conversation context         │
  │  │(WebSocket)    │ → Attach chat transcript               │
  │  └──────┬───────┘                                        │
  │         │                                                │
  │  ┌──────────────┐   Phone call log                       │
  │  │PhoneAdapter   │ → Transcribe voicemail                 │
  │  │(Telephony API)│ → Attach recording URL                 │
  │  └──────┬───────┘                                        │
  │         │                                                │
  │  ┌──────────────┐   Social mention/DM                    │
  │  │SocialAdapter  │ → Parse platform-specific format       │
  │  │(Twitter/FB)   │ → Normalize author identity            │
  │  └──────┬───────┘                                        │
  │         │                                                │
  │  ┌──────────────┐   Direct API call                      │
  │  │APIAdapter     │ → Validate payload                     │
  │  │(REST/tRPC)    │ → Already normalized                   │
  │  └──────┬───────┘                                        │
  │         │                                                │
  │         └────────────────┐                               │
  │                          ▼                               │
  │                  ┌───────────────┐                        │
  │                  │InboundMessage │                        │
  │                  │(normalized)   │                        │
  │                  └───────┬───────┘                        │
  │                          │                               │
  │                          ▼                               │
  │                  ┌───────────────┐                        │
  │                  │ChannelRouter  │                        │
  │                  │(create or     │                        │
  │                  │ update ticket)│                        │
  │                  └───────────────┘                        │
  └─────────────────────────────────────────────────────────┘
```

### Knowledge Base Engine

The knowledge base supports article authoring, versioning, categorization, and intelligent suggestion:

```
  ┌─────────────────────────────────────────────────┐
  │              Knowledge Base Engine               │
  │                                                  │
  │  ┌──────────────────────────────────────────┐   │
  │  │           Article Management              │   │
  │  │  Create → Draft → Review → Published     │   │
  │  │                         ↓                 │   │
  │  │                      Archived             │   │
  │  │  Versioning: each publish = new version   │   │
  │  └──────────────────────────────────────────┘   │
  │                                                  │
  │  ┌──────────────────────────────────────────┐   │
  │  │        Article Suggestion Engine          │   │
  │  │                                           │   │
  │  │  Ticket Content ──→ Tokenize              │   │
  │  │                     + Category Match      │   │
  │  │                     + Full-text Search    │   │
  │  │                     ──→ Ranked Articles   │   │
  │  └──────────────────────────────────────────┘   │
  │                                                  │
  │  ┌──────────────────────────────────────────┐   │
  │  │           Category Tree                   │   │
  │  │                                           │   │
  │  │  Getting Started                          │   │
  │  │  ├── Account Setup                        │   │
  │  │  ├── First Steps                          │   │
  │  │  └── FAQ                                  │   │
  │  │  Billing                                  │   │
  │  │  ├── Plans & Pricing                      │   │
  │  │  ├── Invoices                             │   │
  │  │  └── Refunds                              │   │
  │  │  Technical                                │   │
  │  │  ├── API Reference                        │   │
  │  │  └── Troubleshooting                      │   │
  │  └──────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────┘
```

### Automation Pipeline

Automations are evaluated in an event-driven pipeline that processes triggers, evaluates conditions, and executes actions:

```
  Event (ticket.created, ticket.updated, sla.breached, ...)
       │
       ▼
  ┌──────────────────┐
  │ AutomationEngine │
  │                  │
  │  1. Load active  │
  │     automations  │
  │     for event    │
  │                  │
  │  2. For each:    │
  │     ┌──────────┐ │
  │     │ Evaluate │ │  ← TriggerEvaluator
  │     │Conditions│ │     checks: priority, category,
  │     └────┬─────┘ │     channel, tags, custom fields
  │          │        │
  │     if match:     │
  │     ┌──────────┐ │
  │     │ Execute  │ │  ← Actions: set_field, add_tag,
  │     │ Actions  │ │     assign, notify, webhook,
  │     └──────────┘ │     add_comment, change_priority
  │                  │
  │  3. Log execution│
  │     result       │
  └──────────────────┘
```

---

## Core Interfaces

### SupportService

The primary facade that orchestrates all support subsystems. Injected via DI in the tRPC router.

```typescript
interface SupportService {
  // ── Tickets ──────────────────────────────────────────
  createTicket(input: TicketCreateInput): Promise<Ticket>;
  getTicket(ticketId: string): Promise<Ticket | null>;
  getTicketByNumber(ticketNumber: number): Promise<Ticket | null>;
  updateTicket(ticketId: string, input: TicketUpdateInput): Promise<Ticket>;
  deleteTicket(ticketId: string): Promise<void>;
  listTickets(filter: TicketFilter, sort?: TicketSort, pagination?: PaginationInput): Promise<PaginatedResult<Ticket>>;
  bulkUpdateTickets(input: TicketBulkUpdateInput): Promise<BulkResult<Ticket>>;
  searchTickets(query: string, filter?: TicketFilter): Promise<SearchResult<Ticket>>;

  // ── Ticket Status ────────────────────────────────────
  transitionStatus(ticketId: string, newStatus: TicketStatus, reason?: string): Promise<Ticket>;
  resolveTicket(ticketId: string, resolution: string): Promise<Ticket>;
  closeTicket(ticketId: string): Promise<Ticket>;
  reopenTicket(ticketId: string, reason: string): Promise<Ticket>;

  // ── Comments ─────────────────────────────────────────
  addComment(ticketId: string, input: TicketCommentCreateInput): Promise<TicketComment>;
  updateComment(commentId: string, input: TicketCommentUpdateInput): Promise<TicketComment>;
  deleteComment(commentId: string): Promise<void>;
  listComments(ticketId: string, pagination?: PaginationInput): Promise<PaginatedResult<TicketComment>>;

  // ── Internal Notes ───────────────────────────────────
  addInternalNote(ticketId: string, content: string, mentionedAgentIds?: string[]): Promise<TicketComment>;

  // ── Assignment & Routing ─────────────────────────────
  assignTicket(ticketId: string, agentId: string): Promise<Ticket>;
  unassignTicket(ticketId: string): Promise<Ticket>;
  autoAssignTicket(ticketId: string): Promise<Ticket>;
  getRoutingConfig(): Promise<RoutingConfig>;
  updateRoutingConfig(input: RoutingConfigUpdateInput): Promise<RoutingConfig>;

  // ── Tags ─────────────────────────────────────────────
  addTag(ticketId: string, tag: string): Promise<TicketTag>;
  removeTag(ticketId: string, tag: string): Promise<void>;
  listTags(ticketId: string): Promise<TicketTag[]>;
  listAllTags(): Promise<TagSummary[]>;

  // ── Followers ────────────────────────────────────────
  addFollower(ticketId: string, userId: string): Promise<TicketFollower>;
  removeFollower(ticketId: string, userId: string): Promise<void>;
  listFollowers(ticketId: string): Promise<TicketFollower[]>;

  // ── Links & Merges ───────────────────────────────────
  linkTickets(sourceId: string, targetId: string, linkType: TicketLinkType): Promise<TicketLink>;
  unlinkTickets(linkId: string): Promise<void>;
  listLinks(ticketId: string): Promise<TicketLink[]>;
  mergeTickets(primaryId: string, duplicateIds: string[]): Promise<Ticket>;

  // ── Side Conversations ───────────────────────────────
  createSideConversation(ticketId: string, input: SideConversationInput): Promise<SideConversation>;
  replySideConversation(conversationId: string, content: string): Promise<SideConversationMessage>;
  listSideConversations(ticketId: string): Promise<SideConversation[]>;

  // ── SLA ──────────────────────────────────────────────
  createSLAPolicy(input: SLAPolicyCreateInput): Promise<SLAPolicy>;
  updateSLAPolicy(policyId: string, input: SLAPolicyUpdateInput): Promise<SLAPolicy>;
  deleteSLAPolicy(policyId: string): Promise<void>;
  listSLAPolicies(): Promise<SLAPolicy[]>;
  getSLAInstance(ticketId: string): Promise<SLAInstance | null>;
  getSLAStatus(ticketId: string): Promise<SLAStatusSummary>;

  // ── Knowledge Base ───────────────────────────────────
  createArticle(input: KBArticleCreateInput): Promise<KBArticle>;
  updateArticle(articleId: string, input: KBArticleUpdateInput): Promise<KBArticle>;
  publishArticle(articleId: string): Promise<KBArticle>;
  archiveArticle(articleId: string): Promise<KBArticle>;
  deleteArticle(articleId: string): Promise<void>;
  getArticle(articleId: string): Promise<KBArticle | null>;
  listArticles(filter?: KBArticleFilter, pagination?: PaginationInput): Promise<PaginatedResult<KBArticle>>;
  searchArticles(query: string, visibility?: KBArticleVisibility): Promise<KBSearchResult[]>;
  suggestArticles(ticketId: string, limit?: number): Promise<KBSearchResult[]>;
  getArticleVersions(articleId: string): Promise<KBArticleVersion[]>;
  rateArticle(articleId: string, rating: number, feedback?: string): Promise<KBArticleFeedback>;

  // ── KB Categories ────────────────────────────────────
  createCategory(input: KBCategoryCreateInput): Promise<KBCategory>;
  updateCategory(categoryId: string, input: KBCategoryUpdateInput): Promise<KBCategory>;
  deleteCategory(categoryId: string): Promise<void>;
  listCategories(): Promise<KBCategoryTree[]>;

  // ── Macros ───────────────────────────────────────────
  createMacro(input: MacroCreateInput): Promise<Macro>;
  updateMacro(macroId: string, input: MacroUpdateInput): Promise<Macro>;
  deleteMacro(macroId: string): Promise<void>;
  listMacros(scope?: MacroScope): Promise<Macro[]>;
  executeMacro(macroId: string, ticketId: string): Promise<MacroExecutionResult>;

  // ── Automations ──────────────────────────────────────
  createAutomation(input: AutomationCreateInput): Promise<Automation>;
  updateAutomation(automationId: string, input: AutomationUpdateInput): Promise<Automation>;
  deleteAutomation(automationId: string): Promise<void>;
  listAutomations(): Promise<Automation[]>;
  toggleAutomation(automationId: string, enabled: boolean): Promise<Automation>;
  testAutomation(automationId: string, ticketId: string): Promise<AutomationTestResult>;

  // ── CSAT ─────────────────────────────────────────────
  sendCSATSurvey(ticketId: string): Promise<CSATSurvey>;
  submitCSATResponse(surveyId: string, input: CSATResponseInput): Promise<CSATResponse>;
  getCSATSummary(filter?: CSATFilter): Promise<CSATSummary>;
  getCSATTrends(dateRange: ReportDateRange, groupBy: 'day' | 'week' | 'month'): Promise<CSATTrend[]>;
  getAgentCSAT(agentId: string, dateRange: ReportDateRange): Promise<AgentCSATSummary>;

  // ── NPS ──────────────────────────────────────────────
  sendNPSSurvey(customerId: string): Promise<NPSSurvey>;
  submitNPSResponse(surveyId: string, input: NPSResponseInput): Promise<NPSResponse>;
  getNPSScore(dateRange: ReportDateRange): Promise<NPSScore>;

  // ── Reports ──────────────────────────────────────────
  getTicketVolumeReport(dateRange: ReportDateRange): Promise<TicketVolumeReport>;
  getResolutionTimeReport(dateRange: ReportDateRange): Promise<ResolutionTimeReport>;
  getFirstContactResolutionReport(dateRange: ReportDateRange): Promise<FirstContactResolutionReport>;
  getBacklogAgingReport(): Promise<BacklogAgingReport>;
  getAgentProductivityReport(dateRange: ReportDateRange): Promise<AgentProductivityReport>;
  getSLAComplianceReport(dateRange: ReportDateRange): Promise<SLAComplianceReport>;
  getChannelDistributionReport(dateRange: ReportDateRange): Promise<ChannelDistributionReport>;

  // ── Self-Service Portal ──────────────────────────────
  getPortalConfig(): Promise<PortalConfig>;
  updatePortalConfig(input: PortalConfigUpdateInput): Promise<PortalConfig>;
  portalCreateTicket(input: PortalTicketInput, customerId: string): Promise<Ticket>;
  portalGetTicket(ticketId: string, customerId: string): Promise<PortalTicketView>;
  portalListTickets(customerId: string, pagination?: PaginationInput): Promise<PaginatedResult<PortalTicketView>>;
  portalAddComment(ticketId: string, customerId: string, content: string): Promise<TicketComment>;
  portalSearchArticles(query: string): Promise<KBSearchResult[]>;

  // ── Multi-Channel ────────────────────────────────────
  getChannelConfig(channel: TicketChannel): Promise<ChannelConfig>;
  updateChannelConfig(channel: TicketChannel, input: ChannelConfigUpdateInput): Promise<ChannelConfig>;
  listChannelConfigs(): Promise<ChannelConfig[]>;
  processInboundMessage(message: InboundMessage): Promise<Ticket>;
  sendOutboundMessage(ticketId: string, message: OutboundMessage): Promise<void>;

  // ── Agent Management ─────────────────────────────────
  getAgentAvailability(agentId: string): Promise<AgentAvailability>;
  setAgentAvailability(agentId: string, available: boolean): Promise<AgentAvailability>;
  getAgentSkills(agentId: string): Promise<AgentSkill[]>;
  setAgentSkills(agentId: string, skills: AgentSkillInput[]): Promise<AgentSkill[]>;
  getAgentWorkload(agentId: string): Promise<AgentWorkload>;

  // ── Escalation ───────────────────────────────────────
  createEscalationRule(input: EscalationRuleCreateInput): Promise<EscalationRule>;
  updateEscalationRule(ruleId: string, input: EscalationRuleUpdateInput): Promise<EscalationRule>;
  deleteEscalationRule(ruleId: string): Promise<void>;
  listEscalationRules(): Promise<EscalationRule[]>;
  escalateTicket(ticketId: string, level: number, reason: string): Promise<Ticket>;
}
```

### Ticket

```typescript
interface Ticket {
  id: string;                          // 'tk_' prefixed CUID
  tenantId: string;
  ticketNumber: number;                // auto-incrementing per tenant
  subject: string;
  description: string;                 // rich text (HTML)
  descriptionPlainText: string;        // plain text extraction
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  subcategory: string | null;
  channel: TicketChannel;
  channelRef: string | null;           // external ID from channel (email msgID, etc.)

  // ── People ────────────────────────────────────────────
  requesterId: string;                 // customer who submitted
  requesterEmail: string;
  requesterName: string;
  assigneeId: string | null;           // assigned agent
  assigneeName: string | null;
  teamId: string | null;               // assigned team/group

  // ── Resolution ────────────────────────────────────────
  resolution: string | null;           // resolution summary
  resolvedAt: string | null;
  closedAt: string | null;
  firstResponseAt: string | null;
  reopenCount: number;

  // ── Metadata ──────────────────────────────────────────
  tags: string[];
  customFields: Record<string, unknown>;
  attachmentCount: number;

  // ── Relations ─────────────────────────────────────────
  mergedIntoId: string | null;         // if this ticket was merged
  parentTicketId: string | null;       // for sub-tickets

  // ── Timestamps ────────────────────────────────────────
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;               // manual or SLA-derived due date
}

type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed';

type TicketPriority = 'critical' | 'high' | 'normal' | 'low';

type TicketChannel = 'email' | 'chat' | 'phone' | 'social' | 'api' | 'web' | 'internal';
```

### TicketComment

```typescript
interface TicketComment {
  id: string;                          // 'tc_' prefixed CUID
  ticketId: string;
  tenantId: string;
  authorId: string;
  authorName: string;
  authorType: 'agent' | 'customer' | 'system';
  type: TicketCommentType;
  content: string;                     // rich text (HTML)
  contentPlainText: string;
  attachments: Attachment[];
  mentionedUserIds: string[];
  channel: TicketChannel | null;       // channel used for this comment
  isFirstResponse: boolean;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type TicketCommentType = 'public' | 'internal_note' | 'system' | 'side_conversation';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl: string | null;
}
```

### SLA

```typescript
interface SLAPolicy {
  id: string;                          // 'sla_pol_' prefixed
  tenantId: string;
  name: string;
  description: string | null;
  priority: TicketPriority;            // which priority this applies to
  isDefault: boolean;                  // default policy for this priority

  // ── Targets ───────────────────────────────────────────
  firstResponseTarget: number;         // minutes
  resolutionTarget: number;            // minutes
  nextResponseTarget: number | null;   // minutes (optional)

  // ── Configuration ─────────────────────────────────────
  useBusinessHours: boolean;
  businessHoursId: string | null;      // reference to business hours config
  warningThresholdPercent: number;     // e.g., 75 → warn at 75% elapsed

  // ── Scope ─────────────────────────────────────────────
  applyToCategories: string[] | null;  // null = all categories
  applyToChannels: TicketChannel[] | null;

  active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### SLAInstance

```typescript
interface SLAInstance {
  id: string;                          // 'sla_inst_' prefixed
  tenantId: string;
  ticketId: string;
  policyId: string;

  // ── First Response ────────────────────────────────────
  firstResponseDue: string | null;     // ISO 8601
  firstResponseAt: string | null;      // when first response happened
  firstResponseStatus: SLAMetricStatus;
  firstResponseBreachedAt: string | null;

  // ── Resolution ────────────────────────────────────────
  resolutionDue: string | null;
  resolvedAt: string | null;
  resolutionStatus: SLAMetricStatus;
  resolutionBreachedAt: string | null;

  // ── Next Response ─────────────────────────────────────
  nextResponseDue: string | null;
  nextResponseAt: string | null;
  nextResponseStatus: SLAMetricStatus;
  nextResponseBreachedAt: string | null;

  // ── Pause Tracking ────────────────────────────────────
  isPaused: boolean;
  pausedAt: string | null;
  totalPausedMinutes: number;          // cumulative pause time

  // ── Overall ───────────────────────────────────────────
  overallStatus: SLAStatus;           // worst of all metrics
  escalationLevel: number;             // 0 = none, 1+ = escalated

  createdAt: string;
  updatedAt: string;
}

type SLAMetricStatus = 'on_track' | 'warning' | 'breached' | 'achieved' | 'paused';

type SLAStatus = 'active' | 'fulfilled' | 'breached' | 'paused';
```

### Macro

```typescript
interface Macro {
  id: string;                          // 'macro_' prefixed
  tenantId: string;
  name: string;
  description: string | null;
  scope: MacroScope;
  createdById: string;

  // ── Actions ───────────────────────────────────────────
  actions: MacroAction[];

  // ── Usage ─────────────────────────────────────────────
  usageCount: number;
  lastUsedAt: string | null;

  active: boolean;
  position: number;                    // display order
  createdAt: string;
  updatedAt: string;
}

type MacroScope = 'global' | 'team' | 'personal';

interface MacroAction {
  type: MacroActionType;
  field?: string;
  value?: unknown;
  content?: string;                    // for add_comment
}

type MacroActionType =
  | 'set_status'
  | 'set_priority'
  | 'set_category'
  | 'set_assignee'
  | 'set_team'
  | 'add_tag'
  | 'remove_tag'
  | 'add_comment'                      // public reply
  | 'add_internal_note'
  | 'set_custom_field'
  | 'add_follower'
  | 'set_due_date';

interface MacroExecutionResult {
  macroId: string;
  ticketId: string;
  actionsExecuted: number;
  actionsFailed: number;
  errors: Array<{ action: MacroAction; error: string }>;
  executedAt: string;
  executedBy: string;
  ticketAfter: Ticket;
}
```

### Automation

```typescript
interface Automation {
  id: string;                          // 'auto_' prefixed
  tenantId: string;
  name: string;
  description: string | null;
  enabled: boolean;
  position: number;                    // execution order

  // ── Trigger ───────────────────────────────────────────
  trigger: AutomationTrigger;

  // ── Conditions ────────────────────────────────────────
  conditions: AutomationConditionGroup;

  // ── Actions ───────────────────────────────────────────
  actions: AutomationAction[];

  // ── Statistics ────────────────────────────────────────
  executionCount: number;
  lastExecutedAt: string | null;
  lastError: string | null;

  createdAt: string;
  updatedAt: string;
}

interface AutomationTrigger {
  type: AutomationTriggerType;
  config?: Record<string, unknown>;
}

type AutomationTriggerType =
  | 'ticket_created'
  | 'ticket_updated'
  | 'ticket_status_changed'
  | 'ticket_assigned'
  | 'ticket_commented'
  | 'sla_warning'
  | 'sla_breached'
  | 'ticket_reopened'
  | 'csat_received'
  | 'schedule';                        // cron-based

interface AutomationConditionGroup {
  operator: 'all' | 'any';            // AND / OR
  conditions: AutomationCondition[];
}

interface AutomationCondition {
  field: string;                       // e.g., 'status', 'priority', 'tags', 'category'
  operator: AutomationConditionOperator;
  value: unknown;
}

type AutomationConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'greater_than'
  | 'less_than'
  | 'is_set'
  | 'is_not_set'
  | 'matches_regex';
```

### AutomationAction

```typescript
interface AutomationAction {
  id: string;
  automationId: string;
  type: AutomationActionType;
  config: Record<string, unknown>;
  position: number;                    // execution order within automation
}

type AutomationActionType =
  | 'set_field'                        // { field: 'priority', value: 'high' }
  | 'add_tag'                          // { tag: 'escalated' }
  | 'remove_tag'                       // { tag: 'needs-triage' }
  | 'assign_agent'                     // { agentId: '...' }
  | 'assign_team'                      // { teamId: '...' }
  | 'auto_route'                       // trigger routing engine
  | 'add_comment'                      // { content: '...', type: 'public' | 'internal' }
  | 'send_notification'                // { channel: 'email', template: '...' }
  | 'send_webhook'                     // { url: '...', method: 'POST', headers: {} }
  | 'change_priority'                  // { priority: 'critical' }
  | 'change_status'                    // { status: 'open' }
  | 'escalate'                         // { level: 1, reason: '...' }
  | 'send_csat_survey'                 // {}
  | 'link_ticket'                      // { targetTicketId: '...', linkType: '...' }
  | 'suggest_articles';                // { limit: 3 }
```

### SelfServicePortal

```typescript
interface SelfServicePortal {
  id: string;
  tenantId: string;
  enabled: boolean;
  config: PortalConfig;
  theme: PortalTheme;
  createdAt: string;
  updatedAt: string;
}

interface PortalConfig {
  portalName: string;
  portalUrl: string;                   // custom subdomain or path
  logoUrl: string | null;
  faviconUrl: string | null;
  welcomeMessage: string;

  // ── Features ──────────────────────────────────────────
  allowTicketCreation: boolean;
  allowTicketTracking: boolean;
  showKnowledgeBase: boolean;
  showCommunityForum: boolean;
  requireAuthForTickets: boolean;
  requireAuthForArticles: boolean;

  // ── Ticket Submission ─────────────────────────────────
  ticketFormFields: PortalFormField[];
  ticketCategories: string[];          // allowed categories in portal
  maxAttachmentSize: number;           // bytes
  allowedAttachmentTypes: string[];    // MIME types

  // ── Customization ─────────────────────────────────────
  customCSS: string | null;
  customJS: string | null;
  headerHTML: string | null;
  footerHTML: string | null;
}

interface PortalTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  headerBackground: string;
}

interface PortalFormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'file' | 'email';
  required: boolean;
  options?: string[];                  // for select/multiselect
  placeholder?: string;
  helpText?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}
```

### KBArticle

```typescript
interface KBArticle {
  id: string;                          // 'kb_' prefixed
  tenantId: string;
  categoryId: string | null;
  title: string;
  slug: string;                        // URL-friendly slug
  content: string;                     // rich text (HTML)
  contentPlainText: string;
  excerpt: string;                     // auto-generated or manual

  // ── Visibility ────────────────────────────────────────
  visibility: KBArticleVisibility;
  status: KBArticleStatus;

  // ── Authoring ─────────────────────────────────────────
  authorId: string;
  authorName: string;
  version: number;                     // incremented on publish
  publishedAt: string | null;

  // ── Metrics ───────────────────────────────────────────
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  averageRating: number | null;
  feedbackCount: number;

  // ── SEO ───────────────────────────────────────────────
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;

  // ── Relations ─────────────────────────────────────────
  relatedArticleIds: string[];
  tags: string[];

  createdAt: string;
  updatedAt: string;
}

type KBArticleVisibility = 'external' | 'internal' | 'restricted';

type KBArticleStatus = 'draft' | 'in_review' | 'published' | 'archived';

interface KBCategory {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;             // for nesting
  icon: string | null;
  position: number;
  articleCount: number;
  visibility: KBArticleVisibility;
  createdAt: string;
  updatedAt: string;
}

interface KBCategoryTree extends KBCategory {
  children: KBCategoryTree[];
}

interface KBSearchResult {
  article: KBArticle;
  score: number;                       // relevance score 0-1
  matchedContent: string;              // highlighted snippet
}

interface KBArticleVersion {
  id: string;
  articleId: string;
  version: number;
  title: string;
  content: string;
  authorId: string;
  publishedAt: string;
  changelog: string | null;
  createdAt: string;
}

interface KBArticleFeedback {
  id: string;
  articleId: string;
  userId: string | null;               // null = anonymous
  rating: number;                      // 1-5
  feedback: string | null;
  createdAt: string;
}
```

### CSATSurvey

```typescript
interface CSATSurvey {
  id: string;                          // 'csat_' prefixed
  tenantId: string;
  ticketId: string;
  customerId: string;
  agentId: string | null;
  status: 'pending' | 'responded' | 'expired';
  sentAt: string;
  respondedAt: string | null;
  expiresAt: string;
  channel: TicketChannel;              // survey delivery channel
  surveyUrl: string;
  createdAt: string;
}
```

### CSATResponse

```typescript
interface CSATResponse {
  id: string;
  surveyId: string;
  tenantId: string;
  ticketId: string;
  customerId: string;
  agentId: string | null;

  score: CSATScore;                    // 1-5
  comment: string | null;             // optional free-text feedback

  // ── Categorized Feedback ──────────────────────────────
  aspects: {
    responseTime: CSATScore | null;
    resolution: CSATScore | null;
    professionalism: CSATScore | null;
    knowledge: CSATScore | null;
  };

  createdAt: string;
}

type CSATScore = 1 | 2 | 3 | 4 | 5;

interface CSATTrend {
  period: string;                      // date or period label
  averageScore: number;
  responseCount: number;
  satisfiedPercent: number;            // score 4-5
  dissatisfiedPercent: number;         // score 1-2
}
```

### SupportReport

```typescript
interface SupportReport {
  type: SupportReportType;
  tenantId: string;
  dateRange: ReportDateRange;
  generatedAt: string;
  data: Record<string, unknown>;
}

type SupportReportType =
  | 'ticket_volume'
  | 'resolution_time'
  | 'first_contact_resolution'
  | 'backlog_aging'
  | 'agent_productivity'
  | 'sla_compliance'
  | 'channel_distribution'
  | 'csat_summary'
  | 'category_breakdown';

interface ReportDateRange {
  start: string;                       // ISO 8601 date
  end: string;                         // ISO 8601 date
  timezone: string;
}

interface TicketVolumeReport {
  dateRange: ReportDateRange;
  totalCreated: number;
  totalResolved: number;
  totalClosed: number;
  netChange: number;                   // created - closed
  byPriority: Record<TicketPriority, number>;
  byCategory: Record<string, number>;
  byChannel: Record<TicketChannel, number>;
  byDay: Array<{
    date: string;
    created: number;
    resolved: number;
    closed: number;
  }>;
}

interface ResolutionTimeReport {
  dateRange: ReportDateRange;
  averageMinutes: number;
  medianMinutes: number;
  p90Minutes: number;
  p95Minutes: number;
  byPriority: Record<TicketPriority, {
    average: number;
    median: number;
    count: number;
  }>;
  distribution: Array<{
    bucket: string;                    // '<1h', '1-4h', '4-8h', '8-24h', '1-3d', '>3d'
    count: number;
    percent: number;
  }>;
}

interface AgentProductivityReport {
  dateRange: ReportDateRange;
  agents: Array<{
    agentId: string;
    agentName: string;
    ticketsAssigned: number;
    ticketsResolved: number;
    averageResolutionMinutes: number;
    firstContactResolutionRate: number;
    averageResponseMinutes: number;
    csatAverage: number | null;
    slaComplianceRate: number;
    publicReplies: number;
    internalNotes: number;
  }>;
}

interface SLAComplianceReport {
  dateRange: ReportDateRange;
  totalTicketsWithSLA: number;
  firstResponseCompliance: number;     // percentage
  resolutionCompliance: number;        // percentage
  overallCompliance: number;           // percentage
  byPriority: Record<TicketPriority, {
    total: number;
    firstResponseMet: number;
    resolutionMet: number;
    complianceRate: number;
  }>;
  breachTrend: Array<{
    date: string;
    breaches: number;
    total: number;
  }>;
}

interface BacklogAgingReport {
  totalOpen: number;
  byAge: Array<{
    bucket: string;                    // '<1d', '1-3d', '3-7d', '1-2w', '2-4w', '>4w'
    count: number;
    percent: number;
    tickets: Array<{
      ticketId: string;
      ticketNumber: number;
      subject: string;
      priority: TicketPriority;
      ageHours: number;
      assigneeName: string | null;
    }>;
  }>;
}
```

### TicketFollower

```typescript
interface TicketFollower {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  reason: 'manual' | 'mentioned' | 'assigned' | 'created' | 'cc';
  createdAt: string;
}
```

### TicketLink

```typescript
interface TicketLink {
  id: string;
  tenantId: string;
  sourceTicketId: string;
  targetTicketId: string;
  linkType: TicketLinkType;
  createdById: string;
  createdAt: string;
}

type TicketLinkType =
  | 'related'                          // general relation
  | 'duplicate'                        // source is duplicate of target
  | 'blocks'                           // source blocks target
  | 'blocked_by'                       // source is blocked by target
  | 'parent'                           // source is parent of target
  | 'child';                           // source is child of target
```

### TicketTag

```typescript
interface TicketTag {
  id: string;
  ticketId: string;
  tenantId: string;
  tag: string;                         // normalized lowercase
  createdById: string;
  createdAt: string;
}

interface TagSummary {
  tag: string;
  count: number;                       // number of tickets with this tag
  lastUsedAt: string;
}
```

### EscalationRule

```typescript
interface EscalationRule {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  enabled: boolean;
  position: number;

  // ── Trigger ───────────────────────────────────────────
  trigger: EscalationTrigger;

  // ── Levels ────────────────────────────────────────────
  levels: EscalationLevel[];

  createdAt: string;
  updatedAt: string;
}

interface EscalationTrigger {
  type: 'sla_breach' | 'sla_warning' | 'no_response' | 'reopen_count' | 'priority_change';
  config: Record<string, unknown>;     // e.g., { metric: 'first_response' }
}

interface EscalationLevel {
  level: number;                       // 1, 2, 3...
  delayMinutes: number;                // delay after trigger before escalating to this level
  actions: EscalationAction[];
}

interface EscalationAction {
  type: 'notify_agent' | 'notify_team' | 'notify_manager' | 'reassign' | 'change_priority' | 'webhook';
  config: Record<string, unknown>;
}
```

### RoutingConfig

```typescript
interface RoutingConfig {
  id: string;
  tenantId: string;
  strategy: RoutingStrategy;
  fallbackStrategy: 'queue' | 'unassigned' | 'default_agent';
  fallbackAgentId: string | null;
  maxTicketsPerAgent: number;
  respectBusinessHours: boolean;
  autoAssignOnCreate: boolean;
  reassignOnEscalation: boolean;
  skillMatchThreshold: number;         // minimum skill match score (0.0-1.0)
  roundRobinState: {
    lastAssignedIndex: number;
    agentPool: string[];
  } | null;
  createdAt: string;
  updatedAt: string;
}

type RoutingStrategy = 'round_robin' | 'load_balanced' | 'skill_based';

interface AgentAvailability {
  agentId: string;
  tenantId: string;
  available: boolean;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentTicketCount: number;
  maxTickets: number;
  lastActivityAt: string;
  updatedAt: string;
}

interface AgentSkill {
  id: string;
  agentId: string;
  tenantId: string;
  category: string;
  proficiency: number;                 // 0.0-1.0
  createdAt: string;
  updatedAt: string;
}

interface AgentWorkload {
  agentId: string;
  agentName: string;
  openTickets: number;
  pendingTickets: number;
  totalActive: number;
  maxCapacity: number;
  utilizationPercent: number;
  averageResponseTimeMinutes: number;
  oldestTicketAge: number;             // hours
}
```

### ChannelConfig

```typescript
interface ChannelConfig {
  id: string;
  tenantId: string;
  channel: TicketChannel;
  enabled: boolean;
  displayName: string;

  // ── Credentials ───────────────────────────────────────
  credentials: ChannelCredentials;

  // ── Inbound Settings ──────────────────────────────────
  inbound: {
    enabled: boolean;
    autoCreateTicket: boolean;
    defaultPriority: TicketPriority;
    defaultCategory: string | null;
    defaultAssigneeId: string | null;
    spamFilter: boolean;
    deduplication: boolean;
  };

  // ── Outbound Settings ─────────────────────────────────
  outbound: {
    enabled: boolean;
    replyFromName: string;
    replyFromAddress: string | null;   // for email
    signature: string | null;
    includeTicketNumber: boolean;
  };

  createdAt: string;
  updatedAt: string;
}

type ChannelCredentials =
  | { type: 'email'; imapHost: string; imapPort: number; smtpHost: string; smtpPort: number; username: string; password: string; useTLS: boolean }
  | { type: 'chat'; webhookUrl: string; apiKey: string }
  | { type: 'phone'; provider: string; apiKey: string; phoneNumber: string }
  | { type: 'social'; platform: 'twitter' | 'facebook' | 'instagram'; accessToken: string; pageId?: string }
  | { type: 'api'; apiKeyHash: string }
  | { type: 'web'; portalId: string };

interface InboundMessage {
  id: string;
  channel: TicketChannel;
  channelRef: string;                  // external message ID
  sender: {
    email?: string;
    name?: string;
    phone?: string;
    socialHandle?: string;
    externalId?: string;
  };
  subject: string | null;
  body: string;
  bodyHtml: string | null;
  attachments: Array<{
    fileName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
  threadRef: string | null;            // for threading to existing ticket
  receivedAt: string;
  rawPayload: Record<string, unknown>; // original payload for debugging
}

interface OutboundMessage {
  channel: TicketChannel;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientSocialHandle?: string;
  subject?: string;
  body: string;
  bodyHtml?: string;
  attachments?: Array<{
    fileName: string;
    mimeType: string;
    content: Buffer | string;
  }>;
}
```

---

## Database Schemas

All tables enforce multi-tenant isolation through `tenant_id` columns and PostgreSQL Row-Level Security (RLS) policies. The `tenant_id` is set from the Supabase JWT claims and cannot be overridden by application code.

### tickets

```typescript
import { pgTable, text, integer, timestamp, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const tickets = pgTable('support_tickets', {
  id:                    text('id').primaryKey().$defaultFn(() => `tk_${createId()}`),
  tenantId:              text('tenant_id').notNull(),
  ticketNumber:          integer('ticket_number').notNull(),    // auto-increment per tenant
  subject:               text('subject').notNull(),
  description:           text('description').notNull(),         // HTML
  descriptionPlainText:  text('description_plain_text').notNull(),
  status:                text('status').notNull().default('new'),
  priority:              text('priority').notNull().default('normal'),
  category:              text('category'),
  subcategory:           text('subcategory'),
  channel:               text('channel').notNull().default('web'),
  channelRef:            text('channel_ref'),

  // People
  requesterId:           text('requester_id').notNull(),
  requesterEmail:        text('requester_email').notNull(),
  requesterName:         text('requester_name').notNull(),
  assigneeId:            text('assignee_id'),
  assigneeName:          text('assignee_name'),
  teamId:                text('team_id'),

  // Resolution
  resolution:            text('resolution'),
  resolvedAt:            timestamp('resolved_at', { withTimezone: true }),
  closedAt:              timestamp('closed_at', { withTimezone: true }),
  firstResponseAt:       timestamp('first_response_at', { withTimezone: true }),
  reopenCount:           integer('reopen_count').notNull().default(0),

  // Metadata
  tags:                  jsonb('tags').notNull().default([]),
  customFields:          jsonb('custom_fields').notNull().default({}),
  attachmentCount:       integer('attachment_count').notNull().default(0),

  // Relations
  mergedIntoId:          text('merged_into_id'),
  parentTicketId:        text('parent_ticket_id'),

  // Timestamps
  dueAt:                 timestamp('due_at', { withTimezone: true }),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx:             index('idx_tickets_tenant').on(table.tenantId),
  tenantStatusIdx:       index('idx_tickets_tenant_status').on(table.tenantId, table.status),
  tenantPriorityIdx:     index('idx_tickets_tenant_priority').on(table.tenantId, table.priority),
  tenantAssigneeIdx:     index('idx_tickets_tenant_assignee').on(table.tenantId, table.assigneeId),
  tenantCategoryIdx:     index('idx_tickets_tenant_category').on(table.tenantId, table.category),
  tenantChannelIdx:      index('idx_tickets_tenant_channel').on(table.tenantId, table.channel),
  tenantCreatedIdx:      index('idx_tickets_tenant_created').on(table.tenantId, table.createdAt),
  tenantNumberIdx:       uniqueIndex('idx_tickets_tenant_number').on(table.tenantId, table.ticketNumber),
  mergedIntoIdx:         index('idx_tickets_merged_into').on(table.mergedIntoId),
  parentTicketIdx:       index('idx_tickets_parent').on(table.parentTicketId),
  requesterIdx:          index('idx_tickets_requester').on(table.tenantId, table.requesterId),
  dueDateIdx:            index('idx_tickets_due').on(table.tenantId, table.dueAt),
  fullTextIdx:           index('idx_tickets_fulltext').using('gin',
    sql`to_tsvector('english', ${table.subject} || ' ' || ${table.descriptionPlainText})`
  ),
}));

// RLS Policy
// CREATE POLICY tenant_isolation ON support_tickets
//   USING (tenant_id = current_setting('app.tenant_id'));
```

### ticket_comments

```typescript
export const ticketComments = pgTable('support_ticket_comments', {
  id:                    text('id').primaryKey().$defaultFn(() => `tc_${createId()}`),
  ticketId:              text('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  tenantId:              text('tenant_id').notNull(),
  authorId:              text('author_id').notNull(),
  authorName:            text('author_name').notNull(),
  authorType:            text('author_type').notNull(),         // 'agent' | 'customer' | 'system'
  type:                  text('type').notNull().default('public'), // 'public' | 'internal_note' | 'system' | 'side_conversation'
  content:               text('content').notNull(),
  contentPlainText:      text('content_plain_text').notNull(),
  attachments:           jsonb('attachments').notNull().default([]),
  mentionedUserIds:      jsonb('mentioned_user_ids').notNull().default([]),
  channel:               text('channel'),
  isFirstResponse:       boolean('is_first_response').notNull().default(false),
  editedAt:              timestamp('edited_at', { withTimezone: true }),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ticketIdx:             index('idx_comments_ticket').on(table.ticketId),
  tenantIdx:             index('idx_comments_tenant').on(table.tenantId),
  authorIdx:             index('idx_comments_author').on(table.authorId),
  typeIdx:               index('idx_comments_type').on(table.ticketId, table.type),
  createdIdx:            index('idx_comments_created').on(table.ticketId, table.createdAt),
}));
```

### ticket_tags

```typescript
export const ticketTags = pgTable('support_ticket_tags', {
  id:                    text('id').primaryKey().$defaultFn(() => createId()),
  ticketId:              text('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  tenantId:              text('tenant_id').notNull(),
  tag:                   text('tag').notNull(),                 // normalized lowercase
  createdById:           text('created_by_id').notNull(),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ticketTagIdx:          uniqueIndex('idx_ticket_tags_unique').on(table.ticketId, table.tag),
  tenantTagIdx:          index('idx_ticket_tags_tenant').on(table.tenantId, table.tag),
}));
```

### ticket_followers

```typescript
export const ticketFollowers = pgTable('support_ticket_followers', {
  id:                    text('id').primaryKey().$defaultFn(() => createId()),
  ticketId:              text('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  userId:                text('user_id').notNull(),
  userName:              text('user_name').notNull(),
  reason:                text('reason').notNull().default('manual'),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueFollowerIdx:     uniqueIndex('idx_ticket_followers_unique').on(table.ticketId, table.userId),
  userIdx:               index('idx_ticket_followers_user').on(table.userId),
}));
```

### ticket_links

```typescript
export const ticketLinks = pgTable('support_ticket_links', {
  id:                    text('id').primaryKey().$defaultFn(() => createId()),
  tenantId:              text('tenant_id').notNull(),
  sourceTicketId:        text('source_ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  targetTicketId:        text('target_ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  linkType:              text('link_type').notNull(),           // 'related' | 'duplicate' | 'blocks' | etc.
  createdById:           text('created_by_id').notNull(),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sourceIdx:             index('idx_ticket_links_source').on(table.sourceTicketId),
  targetIdx:             index('idx_ticket_links_target').on(table.targetTicketId),
  uniqueLinkIdx:         uniqueIndex('idx_ticket_links_unique').on(table.sourceTicketId, table.targetTicketId, table.linkType),
}));
```

### sla_policies

```typescript
export const slaPolicies = pgTable('support_sla_policies', {
  id:                        text('id').primaryKey().$defaultFn(() => `sla_pol_${createId()}`),
  tenantId:                  text('tenant_id').notNull(),
  name:                      text('name').notNull(),
  description:               text('description'),
  priority:                  text('priority').notNull(),
  isDefault:                 boolean('is_default').notNull().default(false),
  firstResponseTarget:       integer('first_response_target').notNull(),       // minutes
  resolutionTarget:          integer('resolution_target').notNull(),           // minutes
  nextResponseTarget:        integer('next_response_target'),                  // minutes
  useBusinessHours:          boolean('use_business_hours').notNull().default(true),
  businessHoursId:           text('business_hours_id'),
  warningThresholdPercent:   integer('warning_threshold_percent').notNull().default(75),
  applyToCategories:         jsonb('apply_to_categories'),                     // string[] | null
  applyToChannels:           jsonb('apply_to_channels'),                       // string[] | null
  active:                    boolean('active').notNull().default(true),
  createdAt:                 timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                 timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx:                 index('idx_sla_policies_tenant').on(table.tenantId),
  tenantPriorityIdx:         index('idx_sla_policies_tenant_priority').on(table.tenantId, table.priority),
  tenantDefaultIdx:          index('idx_sla_policies_tenant_default').on(table.tenantId, table.isDefault),
}));
```

### sla_instances

```typescript
export const slaInstances = pgTable('support_sla_instances', {
  id:                        text('id').primaryKey().$defaultFn(() => `sla_inst_${createId()}`),
  tenantId:                  text('tenant_id').notNull(),
  ticketId:                  text('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  policyId:                  text('policy_id').notNull().references(() => slaPolicies.id),

  // First Response
  firstResponseDue:          timestamp('first_response_due', { withTimezone: true }),
  firstResponseAt:           timestamp('first_response_at', { withTimezone: true }),
  firstResponseStatus:       text('first_response_status').notNull().default('on_track'),
  firstResponseBreachedAt:   timestamp('first_response_breached_at', { withTimezone: true }),

  // Resolution
  resolutionDue:             timestamp('resolution_due', { withTimezone: true }),
  resolvedAt:                timestamp('resolved_at', { withTimezone: true }),
  resolutionStatus:          text('resolution_status').notNull().default('on_track'),
  resolutionBreachedAt:      timestamp('resolution_breached_at', { withTimezone: true }),

  // Next Response
  nextResponseDue:           timestamp('next_response_due', { withTimezone: true }),
  nextResponseAt:            timestamp('next_response_at', { withTimezone: true }),
  nextResponseStatus:        text('next_response_status').notNull().default('on_track'),
  nextResponseBreachedAt:    timestamp('next_response_breached_at', { withTimezone: true }),

  // Pause tracking
  isPaused:                  boolean('is_paused').notNull().default(false),
  pausedAt:                  timestamp('paused_at', { withTimezone: true }),
  totalPausedMinutes:        integer('total_paused_minutes').notNull().default(0),

  // Overall
  overallStatus:             text('overall_status').notNull().default('active'),
  escalationLevel:           integer('escalation_level').notNull().default(0),

  createdAt:                 timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                 timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ticketIdx:                 uniqueIndex('idx_sla_instances_ticket').on(table.ticketId),
  tenantIdx:                 index('idx_sla_instances_tenant').on(table.tenantId),
  tenantStatusIdx:           index('idx_sla_instances_tenant_status').on(table.tenantId, table.overallStatus),
  policyIdx:                 index('idx_sla_instances_policy').on(table.policyId),
  firstResponseDueIdx:       index('idx_sla_instances_fr_due').on(table.firstResponseDue),
  resolutionDueIdx:          index('idx_sla_instances_res_due').on(table.resolutionDue),
}));
```

### macros

```typescript
export const macros = pgTable('support_macros', {
  id:                    text('id').primaryKey().$defaultFn(() => `macro_${createId()}`),
  tenantId:              text('tenant_id').notNull(),
  name:                  text('name').notNull(),
  description:           text('description'),
  scope:                 text('scope').notNull().default('global'),
  createdById:           text('created_by_id').notNull(),
  actions:               jsonb('actions').notNull().default([]),
  usageCount:            integer('usage_count').notNull().default(0),
  lastUsedAt:            timestamp('last_used_at', { withTimezone: true }),
  active:                boolean('active').notNull().default(true),
  position:              integer('position').notNull().default(0),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx:             index('idx_macros_tenant').on(table.tenantId),
  tenantScopeIdx:        index('idx_macros_tenant_scope').on(table.tenantId, table.scope),
  createdByIdx:          index('idx_macros_created_by').on(table.createdById),
}));
```

### automations

```typescript
export const automations = pgTable('support_automations', {
  id:                    text('id').primaryKey().$defaultFn(() => `auto_${createId()}`),
  tenantId:              text('tenant_id').notNull(),
  name:                  text('name').notNull(),
  description:           text('description'),
  enabled:               boolean('enabled').notNull().default(true),
  position:              integer('position').notNull().default(0),
  trigger:               jsonb('trigger').notNull(),
  conditions:            jsonb('conditions').notNull(),
  executionCount:        integer('execution_count').notNull().default(0),
  lastExecutedAt:        timestamp('last_executed_at', { withTimezone: true }),
  lastError:             text('last_error'),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx:             index('idx_automations_tenant').on(table.tenantId),
  tenantEnabledIdx:      index('idx_automations_tenant_enabled').on(table.tenantId, table.enabled),
}));
```

### automation_actions

```typescript
export const automationActions = pgTable('support_automation_actions', {
  id:                    text('id').primaryKey().$defaultFn(() => createId()),
  automationId:          text('automation_id').notNull().references(() => automations.id, { onDelete: 'cascade' }),
  type:                  text('type').notNull(),
  config:                jsonb('config').notNull().default({}),
  position:              integer('position').notNull().default(0),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  automationIdx:         index('idx_auto_actions_automation').on(table.automationId),
}));
```

### kb_articles

```typescript
export const kbArticles = pgTable('support_kb_articles', {
  id:                    text('id').primaryKey().$defaultFn(() => `kb_${createId()}`),
  tenantId:              text('tenant_id').notNull(),
  categoryId:            text('category_id').references(() => kbCategories.id, { onDelete: 'set null' }),
  title:                 text('title').notNull(),
  slug:                  text('slug').notNull(),
  content:               text('content').notNull(),
  contentPlainText:      text('content_plain_text').notNull(),
  excerpt:               text('excerpt').notNull(),
  visibility:            text('visibility').notNull().default('external'),
  status:                text('status').notNull().default('draft'),
  authorId:              text('author_id').notNull(),
  authorName:            text('author_name').notNull(),
  version:               integer('version').notNull().default(1),
  publishedAt:           timestamp('published_at', { withTimezone: true }),

  // Metrics
  viewCount:             integer('view_count').notNull().default(0),
  helpfulCount:          integer('helpful_count').notNull().default(0),
  notHelpfulCount:       integer('not_helpful_count').notNull().default(0),
  averageRating:         integer('average_rating'),              // stored as integer (10x) for precision
  feedbackCount:         integer('feedback_count').notNull().default(0),

  // SEO
  metaTitle:             text('meta_title'),
  metaDescription:       text('meta_description'),
  canonicalUrl:          text('canonical_url'),

  // Relations
  relatedArticleIds:     jsonb('related_article_ids').notNull().default([]),
  tags:                  jsonb('tags').notNull().default([]),

  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx:             index('idx_kb_articles_tenant').on(table.tenantId),
  tenantSlugIdx:         uniqueIndex('idx_kb_articles_tenant_slug').on(table.tenantId, table.slug),
  tenantStatusIdx:       index('idx_kb_articles_tenant_status').on(table.tenantId, table.status),
  tenantVisibilityIdx:   index('idx_kb_articles_tenant_visibility').on(table.tenantId, table.visibility),
  categoryIdx:           index('idx_kb_articles_category').on(table.categoryId),
  authorIdx:             index('idx_kb_articles_author').on(table.authorId),
  fullTextIdx:           index('idx_kb_articles_fulltext').using('gin',
    sql`to_tsvector('english', ${table.title} || ' ' || ${table.contentPlainText})`
  ),
}));
```

### kb_categories

```typescript
export const kbCategories = pgTable('support_kb_categories', {
  id:                    text('id').primaryKey().$defaultFn(() => createId()),
  tenantId:              text('tenant_id').notNull(),
  name:                  text('name').notNull(),
  slug:                  text('slug').notNull(),
  description:           text('description'),
  parentId:              text('parent_id'),                     // self-referencing for nesting
  icon:                  text('icon'),
  position:              integer('position').notNull().default(0),
  articleCount:          integer('article_count').notNull().default(0),
  visibility:            text('visibility').notNull().default('external'),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx:             index('idx_kb_categories_tenant').on(table.tenantId),
  tenantSlugIdx:         uniqueIndex('idx_kb_categories_tenant_slug').on(table.tenantId, table.slug),
  parentIdx:             index('idx_kb_categories_parent').on(table.parentId),
}));
```

### csat_responses

```typescript
export const csatResponses = pgTable('support_csat_responses', {
  id:                    text('id').primaryKey().$defaultFn(() => createId()),
  surveyId:              text('survey_id').notNull(),
  tenantId:              text('tenant_id').notNull(),
  ticketId:              text('ticket_id').notNull().references(() => tickets.id),
  customerId:            text('customer_id').notNull(),
  agentId:               text('agent_id'),
  score:                 integer('score').notNull(),             // 1-5
  comment:               text('comment'),
  aspects:               jsonb('aspects').notNull().default({}),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx:             index('idx_csat_responses_tenant').on(table.tenantId),
  ticketIdx:             index('idx_csat_responses_ticket').on(table.ticketId),
  agentIdx:              index('idx_csat_responses_agent').on(table.agentId),
  tenantCreatedIdx:      index('idx_csat_responses_tenant_created').on(table.tenantId, table.createdAt),
  scoreIdx:              index('idx_csat_responses_score').on(table.tenantId, table.score),
}));
```

### channel_configs

```typescript
export const channelConfigs = pgTable('support_channel_configs', {
  id:                    text('id').primaryKey().$defaultFn(() => createId()),
  tenantId:              text('tenant_id').notNull(),
  channel:               text('channel').notNull(),
  enabled:               boolean('enabled').notNull().default(false),
  displayName:           text('display_name').notNull(),
  credentials:           jsonb('credentials').notNull().default({}),
  inbound:               jsonb('inbound').notNull().default({}),
  outbound:              jsonb('outbound').notNull().default({}),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantChannelIdx:      uniqueIndex('idx_channel_configs_tenant_channel').on(table.tenantId, table.channel),
}));
```

### escalation_rules

```typescript
export const escalationRules = pgTable('support_escalation_rules', {
  id:                    text('id').primaryKey().$defaultFn(() => createId()),
  tenantId:              text('tenant_id').notNull(),
  name:                  text('name').notNull(),
  description:           text('description'),
  enabled:               boolean('enabled').notNull().default(true),
  position:              integer('position').notNull().default(0),
  trigger:               jsonb('trigger').notNull(),
  levels:                jsonb('levels').notNull().default([]),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx:             index('idx_escalation_rules_tenant').on(table.tenantId),
  tenantEnabledIdx:      index('idx_escalation_rules_tenant_enabled').on(table.tenantId, table.enabled),
}));
```

### agent_skills

```typescript
export const agentSkills = pgTable('support_agent_skills', {
  id:                    text('id').primaryKey().$defaultFn(() => createId()),
  agentId:               text('agent_id').notNull(),
  tenantId:              text('tenant_id').notNull(),
  category:              text('category').notNull(),
  proficiency:           integer('proficiency').notNull().default(50),  // 0-100, stored as integer
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  agentIdx:              index('idx_agent_skills_agent').on(table.agentId),
  tenantIdx:             index('idx_agent_skills_tenant').on(table.tenantId),
  agentCategoryIdx:      uniqueIndex('idx_agent_skills_unique').on(table.agentId, table.category),
}));
```

---

## Code Examples

### 1 — Creating and Assigning a Ticket

```typescript
import { SupportService } from '@mcv/nexus/support';

// Inject the support service via DI (tRPC context)
async function handleNewCustomerInquiry(
  support: SupportService,
  ctx: { tenantId: string; userId: string },
) {
  // ── Create a new ticket ──────────────────────────────
  const ticket = await support.createTicket({
    subject: 'Unable to access billing dashboard',
    description: `
      <p>I've been trying to access my billing dashboard since this morning
      but keep getting a 403 error. I've tried clearing my cache and using
      a different browser.</p>
      <p>My account email is jane@acme.com</p>
    `,
    priority: 'high',
    category: 'billing',
    subcategory: 'access_issues',
    channel: 'web',
    requesterId: 'cust_abc123',
    requesterEmail: 'jane@acme.com',
    requesterName: 'Jane Smith',
    tags: ['billing', 'access-denied', '403-error'],
    customFields: {
      browser: 'Chrome 120',
      os: 'macOS 14.2',
      accountTier: 'enterprise',
    },
  });

  console.log(`Created ticket #${ticket.ticketNumber}: ${ticket.id}`);
  // → Created ticket #1042: tk_clx7abc123def456

  // ── Auto-assign via routing engine ───────────────────
  const assignedTicket = await support.autoAssignTicket(ticket.id);

  console.log(`Assigned to: ${assignedTicket.assigneeName}`);
  // → Assigned to: Alex Johnson

  // ── Verify SLA was attached ──────────────────────────
  const slaStatus = await support.getSLAStatus(ticket.id);

  console.log(`SLA Policy: ${slaStatus.policyName}`);
  console.log(`First response due: ${slaStatus.firstResponseDue}`);
  console.log(`Resolution due: ${slaStatus.resolutionDue}`);
  // → SLA Policy: High Priority SLA
  // → First response due: 2026-02-09T14:53:00Z (2h from creation)
  // → Resolution due: 2026-02-09T20:53:00Z (8h from creation)

  // ── Add an internal note ─────────────────────────────
  await support.addInternalNote(
    ticket.id,
    'Checked IAM logs — customer role was revoked during last night\'s migration. @mike.ops can you verify?',
    ['usr_mike_ops'],
  );

  // ── Send first public response ───────────────────────
  const comment = await support.addComment(ticket.id, {
    content: `
      <p>Hi Jane,</p>
      <p>Thank you for reaching out. I can see your account and I'm looking into
      the 403 error right now. I'll have an update for you within the hour.</p>
      <p>Best regards,<br/>Alex</p>
    `,
    type: 'public',
    channel: 'web',
  });

  // First response recorded, SLA clock updated
  console.log(`First response at: ${comment.createdAt}`);
  console.log(`Is first response: ${comment.isFirstResponse}`);
  // → Is first response: true

  // ── Transition to open status ────────────────────────
  await support.transitionStatus(ticket.id, 'open');

  return ticket;
}
```

### 2 — SLA Policy Configuration and Breach Detection

```typescript
import { SupportService, SLAEngine } from '@mcv/nexus/support';

async function configureSLAPolicies(support: SupportService) {
  // ── Create SLA policies per priority ─────────────────
  const criticalSLA = await support.createSLAPolicy({
    name: 'Critical Priority SLA',
    description: 'For system outages and data loss scenarios',
    priority: 'critical',
    isDefault: true,
    firstResponseTarget: 15,           // 15 minutes
    resolutionTarget: 120,             // 2 hours
    nextResponseTarget: 30,            // 30 minutes between updates
    useBusinessHours: false,           // 24/7 for critical
    warningThresholdPercent: 50,       // warn at 50% elapsed
    applyToCategories: null,           // all categories
    applyToChannels: null,             // all channels
  });

  const highSLA = await support.createSLAPolicy({
    name: 'High Priority SLA',
    description: 'For significant functionality impairment',
    priority: 'high',
    isDefault: true,
    firstResponseTarget: 120,          // 2 hours
    resolutionTarget: 480,             // 8 hours
    nextResponseTarget: 120,           // 2 hours between updates
    useBusinessHours: true,            // business hours only
    warningThresholdPercent: 75,
    applyToCategories: null,
    applyToChannels: null,
  });

  const normalSLA = await support.createSLAPolicy({
    name: 'Normal Priority SLA',
    description: 'Standard support requests',
    priority: 'normal',
    isDefault: true,
    firstResponseTarget: 480,          // 8 hours
    resolutionTarget: 2880,            // 48 hours (2 business days)
    nextResponseTarget: 480,           // 8 hours
    useBusinessHours: true,
    warningThresholdPercent: 75,
    applyToCategories: null,
    applyToChannels: null,
  });

  const lowSLA = await support.createSLAPolicy({
    name: 'Low Priority SLA',
    description: 'Nice-to-have requests and general questions',
    priority: 'low',
    isDefault: true,
    firstResponseTarget: 1440,         // 24 hours
    resolutionTarget: 7200,            // 5 business days
    nextResponseTarget: 1440,          // 24 hours
    useBusinessHours: true,
    warningThresholdPercent: 75,
    applyToCategories: null,
    applyToChannels: null,
  });

  console.log('SLA policies configured:');
  console.log(`  Critical: ${criticalSLA.firstResponseTarget}m / ${criticalSLA.resolutionTarget}m`);
  console.log(`  High:     ${highSLA.firstResponseTarget}m / ${highSLA.resolutionTarget}m`);
  console.log(`  Normal:   ${normalSLA.firstResponseTarget}m / ${normalSLA.resolutionTarget}m`);
  console.log(`  Low:      ${lowSLA.firstResponseTarget}m / ${lowSLA.resolutionTarget}m`);
}

// ── SLA Breach Detection (runs as background consumer) ─
async function monitorSLABreaches(slaEngine: SLAEngine) {
  // The SLA engine polls active instances and checks for breaches.
  // This is typically run as a Redpanda consumer that reacts to tick events.

  const breaches = await slaEngine.checkForBreaches();

  for (const breach of breaches) {
    console.log(`SLA BREACH: Ticket #${breach.ticketNumber}`);
    console.log(`  Metric: ${breach.metric}`);           // 'first_response' | 'resolution'
    console.log(`  Due at: ${breach.dueAt}`);
    console.log(`  Elapsed: ${breach.elapsedMinutes}m`);
    console.log(`  Target: ${breach.targetMinutes}m`);
    console.log(`  Overdue by: ${breach.overdueMinutes}m`);

    // The engine automatically:
    // 1. Updates SLA instance status to 'breached'
    // 2. Emits 'sla.breached' event to Redpanda
    // 3. Triggers escalation rules
    // 4. Sends notifications to assigned agent + manager
  }

  // ── Check for warnings (approaching breach) ──────────
  const warnings = await slaEngine.checkForWarnings();

  for (const warning of warnings) {
    console.log(`SLA WARNING: Ticket #${warning.ticketNumber}`);
    console.log(`  Metric: ${warning.metric}`);
    console.log(`  Due at: ${warning.dueAt}`);
    console.log(`  Remaining: ${warning.remainingMinutes}m`);
    console.log(`  Threshold: ${warning.thresholdPercent}%`);
    // Notification sent to assigned agent
  }
}

// ── SLA Compliance Reporting ───────────────────────────
async function generateSLAReport(support: SupportService) {
  const report = await support.getSLAComplianceReport({
    start: '2026-01-01',
    end: '2026-01-31',
    timezone: 'America/New_York',
  });

  console.log('=== SLA Compliance Report (January 2026) ===');
  console.log(`Total tickets with SLA: ${report.totalTicketsWithSLA}`);
  console.log(`First response compliance: ${report.firstResponseCompliance}%`);
  console.log(`Resolution compliance: ${report.resolutionCompliance}%`);
  console.log(`Overall compliance: ${report.overallCompliance}%`);
  console.log('');
  console.log('By Priority:');
  for (const [priority, data] of Object.entries(report.byPriority)) {
    console.log(`  ${priority}: ${data.complianceRate}% (${data.firstResponseMet}/${data.total} FR, ${data.resolutionMet}/${data.total} Res)`);
  }
}
```

### 3 — Ticket Routing with Skill-Based Assignment

```typescript
import { SupportService, RoutingEngine, SkillBasedStrategy } from '@mcv/nexus/support';

async function configureSkillBasedRouting(support: SupportService) {
  // ── Configure routing strategy ───────────────────────
  await support.updateRoutingConfig({
    strategy: 'skill_based',
    fallbackStrategy: 'load_balanced',  // fallback if no skill match
    maxTicketsPerAgent: 15,
    respectBusinessHours: true,
    autoAssignOnCreate: true,
    reassignOnEscalation: true,
    skillMatchThreshold: 0.6,          // require 60% skill match
  });

  // ── Configure agent skills ───────────────────────────
  // Agent: Alex — billing & account expert
  await support.setAgentSkills('usr_alex', [
    { category: 'billing', proficiency: 0.95 },
    { category: 'account', proficiency: 0.90 },
    { category: 'subscription', proficiency: 0.85 },
  ]);

  // Agent: Sarah — technical support expert
  await support.setAgentSkills('usr_sarah', [
    { category: 'technical', proficiency: 0.95 },
    { category: 'api', proficiency: 0.90 },
    { category: 'integration', proficiency: 0.85 },
    { category: 'billing', proficiency: 0.40 },  // basic billing knowledge
  ]);

  // Agent: Mike — general support
  await support.setAgentSkills('usr_mike', [
    { category: 'general', proficiency: 0.80 },
    { category: 'billing', proficiency: 0.70 },
    { category: 'technical', proficiency: 0.60 },
    { category: 'account', proficiency: 0.75 },
  ]);

  // ── Set agent availability ───────────────────────────
  await support.setAgentAvailability('usr_alex', true);
  await support.setAgentAvailability('usr_sarah', true);
  await support.setAgentAvailability('usr_mike', true);
}

async function demonstrateRouting(support: SupportService) {
  // ── Billing ticket → should route to Alex ────────────
  const billingTicket = await support.createTicket({
    subject: 'Incorrect charge on invoice #4521',
    description: '<p>I was charged $299 instead of $199 on my latest invoice.</p>',
    priority: 'high',
    category: 'billing',
    channel: 'email',
    requesterId: 'cust_001',
    requesterEmail: 'customer@example.com',
    requesterName: 'Customer One',
  });

  // Auto-assignment happens on create (autoAssignOnCreate = true)
  console.log(`Billing ticket assigned to: ${billingTicket.assigneeName}`);
  // → Billing ticket assigned to: Alex (95% billing proficiency)

  // ── API ticket → should route to Sarah ───────────────
  const apiTicket = await support.createTicket({
    subject: 'OAuth2 token refresh failing with 401',
    description: '<p>Our integration started failing after the API v3 migration.</p>',
    priority: 'critical',
    category: 'api',
    channel: 'api',
    requesterId: 'cust_002',
    requesterEmail: 'dev@techcorp.com',
    requesterName: 'Tech Corp Dev',
  });

  console.log(`API ticket assigned to: ${apiTicket.assigneeName}`);
  // → API ticket assigned to: Sarah (90% API proficiency)

  // ── Check agent workloads ────────────────────────────
  const alexWorkload = await support.getAgentWorkload('usr_alex');
  const sarahWorkload = await support.getAgentWorkload('usr_sarah');

  console.log(`Alex: ${alexWorkload.openTickets} open, ${alexWorkload.utilizationPercent}% utilized`);
  console.log(`Sarah: ${sarahWorkload.openTickets} open, ${sarahWorkload.utilizationPercent}% utilized`);

  // ── If Alex is at capacity, billing falls to Mike ────
  // (load_balanced fallback picks the agent with fewest tickets
  //  who has at least 60% billing proficiency → Mike at 70%)
}
```

### 4 — Knowledge Base Article Management

```typescript
import { SupportService } from '@mcv/nexus/support';

async function manageKnowledgeBase(support: SupportService) {
  // ── Create KB categories ─────────────────────────────
  const gettingStarted = await support.createCategory({
    name: 'Getting Started',
    slug: 'getting-started',
    description: 'Guides for new users',
    icon: '🚀',
    position: 0,
    visibility: 'external',
  });

  const billing = await support.createCategory({
    name: 'Billing & Payments',
    slug: 'billing',
    description: 'Invoice, payment, and subscription help',
    icon: '💳',
    position: 1,
    visibility: 'external',
  });

  const internalOps = await support.createCategory({
    name: 'Internal Operations',
    slug: 'internal-ops',
    description: 'Internal SOPs and runbooks',
    icon: '🔧',
    position: 0,
    visibility: 'internal',
  });

  // ── Create and publish an article ────────────────────
  const article = await support.createArticle({
    categoryId: billing.id,
    title: 'How to Update Your Payment Method',
    slug: 'update-payment-method',
    content: `
      <h2>Updating Your Payment Method</h2>
      <p>Follow these steps to update your credit card or payment method:</p>
      <ol>
        <li>Navigate to <strong>Settings → Billing</strong></li>
        <li>Click <strong>Payment Methods</strong></li>
        <li>Click <strong>Add New</strong> or <strong>Edit</strong> on an existing method</li>
        <li>Enter your new payment details</li>
        <li>Click <strong>Save</strong></li>
      </ol>
      <div class="callout callout-info">
        <p>Changes take effect on your next billing cycle. Your current
        cycle will still charge to the previous method.</p>
      </div>
      <h3>Accepted Payment Methods</h3>
      <ul>
        <li>Visa, Mastercard, American Express</li>
        <li>Bank transfer (ACH) — US accounts only</li>
        <li>Wire transfer — Enterprise plans only</li>
      </ul>
    `,
    visibility: 'external',
    tags: ['billing', 'payment', 'credit-card'],
    relatedArticleIds: [],
    metaTitle: 'Update Payment Method | Help Center',
    metaDescription: 'Learn how to update your credit card or payment method in your account settings.',
  });

  console.log(`Article created: ${article.id} (v${article.version}, status: ${article.status})`);
  // → Article created: kb_clx8def456 (v1, status: draft)

  // ── Publish the article ──────────────────────────────
  const published = await support.publishArticle(article.id);
  console.log(`Published: v${published.version} at ${published.publishedAt}`);
  // → Published: v1 at 2026-02-09T12:53:00Z

  // ── Update and publish a new version ─────────────────
  const updated = await support.updateArticle(article.id, {
    content: article.content + `
      <h3>Troubleshooting</h3>
      <p>If your card is declined, please verify:</p>
      <ul>
        <li>The card number and expiry date are correct</li>
        <li>Your card supports online/international transactions</li>
        <li>You have sufficient funds or credit limit</li>
      </ul>
    `,
  });

  const republished = await support.publishArticle(updated.id);
  console.log(`Republished: v${republished.version}`);
  // → Republished: v2

  // ── View version history ─────────────────────────────
  const versions = await support.getArticleVersions(article.id);
  for (const v of versions) {
    console.log(`  v${v.version} — ${v.publishedAt} by ${v.authorId}`);
  }

  // ── Search articles ──────────────────────────────────
  const results = await support.searchArticles('payment method update');
  for (const result of results) {
    console.log(`  [${result.score.toFixed(2)}] ${result.article.title}`);
    console.log(`    ${result.matchedContent}`);
  }
  // → [0.94] How to Update Your Payment Method
  // →   ...update your credit card or <mark>payment method</mark>...

  // ── Suggest articles for a ticket ────────────────────
  // Given a ticket about billing issues, find relevant KB articles
  const suggestions = await support.suggestArticles('tk_clx7abc123def456', 3);
  console.log(`Top ${suggestions.length} suggested articles:`);
  for (const s of suggestions) {
    console.log(`  ${s.article.title} (relevance: ${s.score.toFixed(2)})`);
  }

  // ── Article feedback ─────────────────────────────────
  await support.rateArticle(article.id, 5, 'Very helpful, solved my problem!');
  await support.rateArticle(article.id, 4, 'Good but could include PayPal info');

  const refreshed = await support.getArticle(article.id);
  console.log(`Rating: ${refreshed!.averageRating} (${refreshed!.feedbackCount} reviews)`);
  // → Rating: 4.5 (2 reviews)
}
```

---

## Error Codes

The `@mcv/nexus/support` module uses structured error codes prefixed with `SUP_` for all support-domain operations. Each error includes a machine-readable code, HTTP status mapping, and human-readable message.

### Ticket Errors (SUP_001–SUP_008)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `SUP_001` | `TICKET_NOT_FOUND` | 404 | Ticket with the specified ID does not exist or has been permanently deleted |
| `SUP_002` | `TICKET_ALREADY_CLOSED` | 409 | Attempted operation on a ticket that has already been closed/resolved |
| `SUP_003` | `TICKET_INVALID_TRANSITION` | 422 | Invalid status transition (e.g., `closed` → `open` without reopen permission) |
| `SUP_004` | `TICKET_DUPLICATE_DETECTED` | 409 | Duplicate ticket detected based on content fingerprinting within the dedup window |
| `SUP_005` | `TICKET_LOCKED` | 423 | Ticket is locked by another agent for editing |
| `SUP_006` | `TICKET_MERGE_CONFLICT` | 409 | Cannot merge tickets due to conflicting states or different tenants |
| `SUP_007` | `TICKET_ATTACHMENT_TOO_LARGE` | 413 | Attachment exceeds the maximum allowed file size (default: 25MB) |
| `SUP_008` | `TICKET_CREATION_RATE_LIMITED` | 429 | Customer has exceeded the ticket creation rate limit |

### SLA Errors (SUP_009–SUP_013)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `SUP_009` | `SLA_POLICY_NOT_FOUND` | 404 | Referenced SLA policy does not exist |
| `SUP_010` | `SLA_BREACHED` | 200* | SLA target time has been exceeded (event, not HTTP error — logged as domain event) |
| `SUP_011` | `SLA_ALREADY_PAUSED` | 409 | Attempted to pause an SLA timer that is already paused |
| `SUP_012` | `SLA_INVALID_BUSINESS_HOURS` | 422 | Business hours configuration is invalid or has overlapping ranges |
| `SUP_013` | `SLA_ESCALATION_FAILED` | 500 | Failed to execute SLA escalation action (e.g., notification delivery failure) |

### Agent & Assignment Errors (SUP_014–SUP_017)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `SUP_014` | `AGENT_NOT_FOUND` | 404 | Agent with the specified ID does not exist in this tenant |
| `SUP_015` | `AGENT_UNAVAILABLE` | 409 | Agent is offline, at capacity, or outside of scheduled hours |
| `SUP_016` | `AGENT_GROUP_NOT_FOUND` | 404 | The specified agent group/team does not exist |
| `SUP_017` | `ASSIGNMENT_FAILED` | 500 | Auto-assignment failed — no eligible agents available matching skill/load criteria |

### Knowledge Base Errors (SUP_018–SUP_021)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `SUP_018` | `KB_ARTICLE_NOT_FOUND` | 404 | Knowledge base article does not exist or is not published |
| `SUP_019` | `KB_CATEGORY_NOT_FOUND` | 404 | Knowledge base category does not exist |
| `SUP_020` | `KB_ARTICLE_SLUG_CONFLICT` | 409 | Article slug already exists within the same category |
| `SUP_021` | `KB_SEARCH_INDEX_UNAVAILABLE` | 503 | Full-text search index is temporarily unavailable |

### Macro & Automation Errors (SUP_022–SUP_025)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `SUP_022` | `MACRO_NOT_FOUND` | 404 | Macro with the specified ID does not exist |
| `SUP_023` | `MACRO_EXECUTION_FAILED` | 500 | Macro action execution failed (e.g., invalid field reference, permission denied) |
| `SUP_024` | `MACRO_CIRCULAR_REFERENCE` | 422 | Macro contains circular trigger references that would cause infinite loops |
| `SUP_025` | `MACRO_VARIABLE_UNRESOLVED` | 422 | Template variable in macro could not be resolved against ticket context |

### Channel & Communication Errors (SUP_026–SUP_030)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `SUP_026` | `CHANNEL_NOT_CONFIGURED` | 422 | Support channel (email, chat, phone) is not configured for this tenant |
| `SUP_027` | `CHANNEL_DELIVERY_FAILED` | 502 | Failed to deliver outbound message via the specified channel |
| `SUP_028` | `CSAT_SURVEY_EXPIRED` | 410 | CSAT survey link has expired (past the configured response window) |
| `SUP_029` | `CSAT_ALREADY_SUBMITTED` | 409 | Customer has already submitted a satisfaction rating for this ticket |
| `SUP_030` | `PORTAL_SESSION_EXPIRED` | 401 | Self-service portal session has expired; customer must re-authenticate |

### General Errors (SUP_031–SUP_035)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `SUP_031` | `TENANT_SUPPORT_DISABLED` | 403 | Support module is not enabled for this tenant |
| `SUP_032` | `INVALID_PRIORITY` | 422 | Priority value is not one of the allowed levels (low, normal, high, urgent) |
| `SUP_033` | `TAG_LIMIT_EXCEEDED` | 422 | Ticket exceeds the maximum number of tags allowed (default: 20) |
| `SUP_034` | `CUSTOM_FIELD_VALIDATION` | 422 | Custom field value does not match the field's validation rules |
| `SUP_035` | `BULK_OPERATION_PARTIAL` | 207 | Bulk operation completed with partial failures; response contains per-item results |

### Error Response Format

```typescript
interface SupportErrorResponse {
  success: false;
  error: {
    code: string;        // e.g., "SUP_001"
    name: string;        // e.g., "TICKET_NOT_FOUND"
    message: string;     // Human-readable description
    details?: Record<string, unknown>;  // Additional context
    ticketId?: string;   // Related ticket ID if applicable
    retryable: boolean;  // Whether the client should retry
    retryAfterMs?: number; // Suggested retry delay
  };
  requestId: string;     // Correlation ID for tracing
  timestamp: string;     // ISO 8601 timestamp
}
```

### Error Handling Patterns

```typescript
// tRPC error mapping in support router
import { TRPCError } from '@trpc/server';
import { SupportErrorCode } from './errors';

function mapSupportError(code: SupportErrorCode, detail?: string): TRPCError {
  const mapping: Record<SupportErrorCode, { trpcCode: string; http: number }> = {
    SUP_001: { trpcCode: 'NOT_FOUND', http: 404 },
    SUP_003: { trpcCode: 'BAD_REQUEST', http: 422 },
    SUP_005: { trpcCode: 'CONFLICT', http: 423 },
    SUP_008: { trpcCode: 'TOO_MANY_REQUESTS', http: 429 },
    SUP_017: { trpcCode: 'INTERNAL_SERVER_ERROR', http: 500 },
    // ... additional mappings
  };

  const { trpcCode } = mapping[code] ?? { trpcCode: 'INTERNAL_SERVER_ERROR' };
  return new TRPCError({
    code: trpcCode as any,
    message: `[${code}] ${detail ?? 'Support operation failed'}`,
  });
}
```

---

## Security

### Overview

The support module implements defense-in-depth security spanning tenant isolation, ticket-level access control, agent permission management, customer data protection, and comprehensive audit logging. All security measures operate within the MCV platform's multi-tenant architecture using Supabase Row-Level Security (RLS) as the foundational enforcement layer.

### Tenant Isolation

All support data — tickets, comments, attachments, KB articles, macros, SLA policies, and CSAT responses — is scoped to a tenant via `tenant_id` foreign keys with mandatory RLS policies.

```sql
-- Core RLS policy for support_tickets
CREATE POLICY tenant_isolation_tickets ON support.tickets
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Cross-tenant access is impossible at the database level
-- Even superadmin queries go through RLS when using the application connection
CREATE POLICY tenant_isolation_comments ON support.ticket_comments
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_kb ON support.kb_articles
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**Tenant Context Propagation:**
- Tenant ID is extracted from JWT claims at the API gateway
- Set via `SET LOCAL app.current_tenant_id` at the start of each transaction
- All Drizzle ORM queries automatically include tenant scoping via middleware
- No support API endpoint operates without a valid tenant context

### Ticket Access Control

Ticket visibility follows a role-based model with contextual overrides:

| Role | Own Tickets | Group Tickets | All Tickets | Internal Notes | Admin Actions |
|------|-------------|---------------|-------------|----------------|---------------|
| **Customer** | ✅ Read/Reply | ❌ | ❌ | ❌ | ❌ |
| **Agent** | ✅ Full | ✅ Assigned Group | ❌ | ✅ Read/Write | ❌ |
| **Senior Agent** | ✅ Full | ✅ All Groups | ✅ Read | ✅ Read/Write | ❌ |
| **Supervisor** | ✅ Full | ✅ All Groups | ✅ Full | ✅ Read/Write | ✅ Limited |
| **Support Admin** | ✅ Full | ✅ All Groups | ✅ Full | ✅ Read/Write | ✅ Full |

```typescript
// Ticket access control middleware
const ticketAccessGuard = t.middleware(async ({ ctx, next, rawInput }) => {
  const input = rawInput as { ticketId: string };
  const ticket = await ctx.db.query.tickets.findFirst({
    where: and(
      eq(tickets.id, input.ticketId),
      eq(tickets.tenantId, ctx.tenantId),
    ),
  });

  if (!ticket) throw mapSupportError('SUP_001');

  const hasAccess = await checkTicketAccess({
    userId: ctx.userId,
    userRole: ctx.supportRole,
    ticket,
    agentGroups: ctx.agentGroups,
  });

  if (!hasAccess) throw new TRPCError({ code: 'FORBIDDEN' });

  return next({ ctx: { ...ctx, ticket } });
});
```

### Agent Permissions

Agent capabilities are governed by a granular permission system:

```typescript
enum SupportPermission {
  // Ticket operations
  TICKET_CREATE           = 'support:ticket:create',
  TICKET_VIEW_OWN         = 'support:ticket:view:own',
  TICKET_VIEW_GROUP       = 'support:ticket:view:group',
  TICKET_VIEW_ALL         = 'support:ticket:view:all',
  TICKET_UPDATE           = 'support:ticket:update',
  TICKET_DELETE           = 'support:ticket:delete',
  TICKET_ASSIGN           = 'support:ticket:assign',
  TICKET_MERGE            = 'support:ticket:merge',
  TICKET_CLOSE            = 'support:ticket:close',
  TICKET_REOPEN           = 'support:ticket:reopen',

  // Knowledge Base
  KB_ARTICLE_CREATE       = 'support:kb:create',
  KB_ARTICLE_EDIT         = 'support:kb:edit',
  KB_ARTICLE_PUBLISH      = 'support:kb:publish',
  KB_ARTICLE_DELETE       = 'support:kb:delete',

  // Macros & Automation
  MACRO_CREATE            = 'support:macro:create',
  MACRO_EDIT              = 'support:macro:edit',
  MACRO_EXECUTE           = 'support:macro:execute',
  MACRO_DELETE            = 'support:macro:delete',

  // SLA & Configuration
  SLA_POLICY_MANAGE       = 'support:sla:manage',
  CSAT_CONFIG_MANAGE      = 'support:csat:manage',
  CHANNEL_CONFIG_MANAGE   = 'support:channel:manage',

  // Reporting
  REPORT_VIEW_OWN         = 'support:report:view:own',
  REPORT_VIEW_ALL         = 'support:report:view:all',
  REPORT_EXPORT           = 'support:report:export',
}
```

### Customer Data Protection

- **PII Handling:** Customer email, name, and phone are stored encrypted at rest using Supabase's column-level encryption for sensitive fields
- **Data Retention:** Configurable per-tenant retention policies; tickets auto-archive after the retention window (default: 2 years)
- **Right to Erasure:** GDPR-compliant deletion endpoint that anonymizes customer data across all tickets, comments, and CSAT responses
- **Attachment Security:** Files stored in tenant-scoped Supabase Storage buckets with signed URLs (default expiry: 1 hour)
- **Comment Redaction:** Agents with supervisor+ role can redact sensitive information from ticket comments, replacing content with `[REDACTED]` while preserving audit trail

```typescript
// GDPR erasure handler
async function eraseCustomerData(tenantId: string, customerId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // Anonymize ticket requester info
    await tx.update(tickets)
      .set({
        requesterName: '[Deleted User]',
        requesterEmail: `deleted-${nanoid(8)}@anonymized.local`,
        requesterPhone: null,
        metadata: sql`metadata - 'pii_fields'`,
      })
      .where(and(
        eq(tickets.tenantId, tenantId),
        eq(tickets.requesterId, customerId),
      ));

    // Anonymize comments
    await tx.update(ticketComments)
      .set({ authorName: '[Deleted User]' })
      .where(and(
        eq(ticketComments.tenantId, tenantId),
        eq(ticketComments.authorId, customerId),
      ));

    // Delete CSAT responses
    await tx.delete(csatResponses)
      .where(and(
        eq(csatResponses.tenantId, tenantId),
        eq(csatResponses.customerId, customerId),
      ));

    // Emit domain event for downstream cleanup
    await emitDomainEvent('support.customer.erased', { tenantId, customerId });
  });
}
```

### Rate Limiting

| Endpoint Category | Rate Limit | Window | Scope |
|-------------------|-----------|--------|-------|
| Ticket creation | 10 requests | 1 minute | Per customer |
| Ticket updates | 30 requests | 1 minute | Per agent |
| Comment creation | 20 requests | 1 minute | Per user |
| KB article search | 60 requests | 1 minute | Per session |
| Portal authentication | 5 attempts | 5 minutes | Per email |
| CSAT submission | 3 requests | 1 hour | Per ticket |
| Macro execution | 50 requests | 1 minute | Per agent |
| Bulk operations | 5 requests | 1 minute | Per agent |
| Attachment upload | 10 requests | 5 minutes | Per user |
| API (general) | 200 requests | 1 minute | Per tenant |

Rate limiting is enforced at the API gateway layer using sliding window counters backed by Redis/Upstash:

```typescript
const supportRateLimiter = createRateLimiter({
  prefix: 'support',
  rules: [
    { key: 'ticket:create:{customerId}', limit: 10, windowMs: 60_000 },
    { key: 'comment:create:{userId}', limit: 20, windowMs: 60_000 },
    { key: 'portal:auth:{email}', limit: 5, windowMs: 300_000 },
    { key: 'global:{tenantId}', limit: 200, windowMs: 60_000 },
  ],
});
```

### Audit Trail

Every mutation in the support module emits an audit event to the platform's audit log:

```typescript
interface SupportAuditEvent {
  eventId: string;           // Unique event ID
  tenantId: string;          // Tenant scope
  actorId: string;           // User who performed the action
  actorType: 'agent' | 'customer' | 'system' | 'automation';
  action: string;            // e.g., 'ticket.created', 'ticket.status_changed', 'macro.executed'
  resourceType: string;      // e.g., 'ticket', 'kb_article', 'macro'
  resourceId: string;        // ID of the affected resource
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  metadata?: Record<string, unknown>;  // Additional context
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;         // ISO 8601
}

// Audit events tracked:
// - ticket.created, ticket.updated, ticket.status_changed, ticket.assigned
// - ticket.merged, ticket.deleted, ticket.reopened
// - comment.created, comment.redacted, comment.deleted
// - sla.breached, sla.paused, sla.resumed
// - macro.executed, macro.created, macro.updated, macro.deleted
// - kb.article.created, kb.article.published, kb.article.deleted
// - csat.submitted, csat.config_changed
// - agent.role_changed, agent.group_changed
// - customer.data_erased (GDPR)
```

### Input Validation & Sanitization

- All user-provided HTML content (ticket descriptions, KB articles) is sanitized using `DOMPurify` with a strict allowlist
- Attachment filenames are sanitized to prevent path traversal attacks
- Custom field values are validated against per-field schemas (regex, enum, range)
- SQL injection is prevented by Drizzle ORM's parameterized queries — raw SQL is never used with user input
- XSS protection on the self-service portal via Content Security Policy headers

---

## Environment Variables

The support module uses the following environment variables for configuration. All variables are prefixed with `SUPPORT_` to avoid collisions with other modules.

### Core Configuration

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `SUPPORT_ENABLED` | `boolean` | `true` | No | Master toggle to enable/disable the support module |
| `SUPPORT_DEFAULT_PRIORITY` | `string` | `normal` | No | Default ticket priority when not specified (`low`, `normal`, `high`, `urgent`) |
| `SUPPORT_MAX_TICKETS_PER_CUSTOMER` | `number` | `100` | No | Maximum open tickets allowed per customer |
| `SUPPORT_TICKET_DEDUP_WINDOW_MS` | `number` | `300000` | No | Time window (ms) for duplicate ticket detection (default: 5 minutes) |
| `SUPPORT_MAX_ATTACHMENT_SIZE_MB` | `number` | `25` | No | Maximum attachment file size in megabytes |
| `SUPPORT_MAX_TAGS_PER_TICKET` | `number` | `20` | No | Maximum number of tags per ticket |

### SLA Configuration

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `SUPPORT_SLA_CHECK_INTERVAL_MS` | `number` | `60000` | No | Interval for SLA breach checking (default: 1 minute) |
| `SUPPORT_SLA_DEFAULT_FIRST_RESPONSE_MINS` | `number` | `60` | No | Default SLA first-response target in minutes |
| `SUPPORT_SLA_DEFAULT_RESOLUTION_MINS` | `number` | `480` | No | Default SLA resolution target in minutes (default: 8 hours) |
| `SUPPORT_SLA_BREACH_NOTIFICATION_BUFFER_MINS` | `number` | `15` | No | Minutes before SLA breach to send warning notification |
| `SUPPORT_SLA_BUSINESS_HOURS_TIMEZONE` | `string` | `UTC` | No | Default timezone for business hours calculation |
| `SUPPORT_SLA_BUSINESS_HOURS_START` | `string` | `09:00` | No | Business hours start time (HH:mm) |
| `SUPPORT_SLA_BUSINESS_HOURS_END` | `string` | `17:00` | No | Business hours end time (HH:mm) |
| `SUPPORT_SLA_BUSINESS_DAYS` | `string` | `1,2,3,4,5` | No | Business days (1=Monday, 7=Sunday) |

### Email Integration

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `SUPPORT_EMAIL_INBOUND_ENABLED` | `boolean` | `false` | No | Enable inbound email-to-ticket conversion |
| `SUPPORT_EMAIL_INBOUND_ADDRESS` | `string` | — | Cond. | Inbound support email address (required if inbound enabled) |
| `SUPPORT_EMAIL_OUTBOUND_FROM_NAME` | `string` | `Support` | No | Display name for outbound support emails |
| `SUPPORT_EMAIL_OUTBOUND_FROM_ADDRESS` | `string` | — | Cond. | From address for outbound emails |
| `SUPPORT_EMAIL_REPLY_SEPARATOR` | `string` | `---` | No | Separator pattern to strip quoted replies from inbound emails |

### Notification Settings

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `SUPPORT_NOTIFY_ON_NEW_TICKET` | `boolean` | `true` | No | Send notification to assigned agent/group on new ticket |
| `SUPPORT_NOTIFY_ON_CUSTOMER_REPLY` | `boolean` | `true` | No | Notify assigned agent when customer adds a reply |
| `SUPPORT_NOTIFY_ON_SLA_WARNING` | `boolean` | `true` | No | Send SLA breach warning notifications |
| `SUPPORT_NOTIFY_ON_ASSIGNMENT` | `boolean` | `true` | No | Notify agent when a ticket is assigned to them |
| `SUPPORT_NOTIFY_CHANNEL` | `string` | `in-app` | No | Default notification channel (`in-app`, `email`, `both`) |

### Knowledge Base Configuration

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `SUPPORT_KB_ENABLED` | `boolean` | `true` | No | Enable the knowledge base module |
| `SUPPORT_KB_PUBLIC_ACCESS` | `boolean` | `true` | No | Allow unauthenticated access to published KB articles |
| `SUPPORT_KB_SEARCH_MIN_QUERY_LENGTH` | `number` | `3` | No | Minimum characters for KB search queries |
| `SUPPORT_KB_ARTICLE_SLUG_MAX_LENGTH` | `number` | `128` | No | Maximum length for article URL slugs |
| `SUPPORT_KB_SUGGESTED_ARTICLES_COUNT` | `number` | `5` | No | Number of suggested articles to show during ticket creation |

### CSAT (Customer Satisfaction) Settings

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `SUPPORT_CSAT_ENABLED` | `boolean` | `true` | No | Enable CSAT surveys after ticket resolution |
| `SUPPORT_CSAT_SURVEY_DELAY_MINS` | `number` | `60` | No | Delay after resolution before sending CSAT survey |
| `SUPPORT_CSAT_SURVEY_EXPIRY_DAYS` | `number` | `7` | No | Days before CSAT survey link expires |
| `SUPPORT_CSAT_SCALE` | `string` | `1-5` | No | CSAT rating scale (`1-5`, `1-10`, `thumbs`) |
| `SUPPORT_CSAT_REQUIRE_COMMENT` | `boolean` | `false` | No | Require a comment with CSAT rating |

### Self-Service Portal

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `SUPPORT_PORTAL_ENABLED` | `boolean` | `true` | No | Enable the customer self-service portal |
| `SUPPORT_PORTAL_SESSION_TTL_MINS` | `number` | `60` | No | Portal session timeout in minutes |
| `SUPPORT_PORTAL_ALLOW_TICKET_CREATION` | `boolean` | `true` | No | Allow customers to create tickets via portal |
| `SUPPORT_PORTAL_SHOW_TICKET_HISTORY` | `boolean` | `true` | No | Show customer their past tickets in the portal |

### Event Streaming

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `SUPPORT_EVENTS_TOPIC` | `string` | `support.events` | No | Redpanda topic for support domain events |
| `SUPPORT_EVENTS_CONSUMER_GROUP` | `string` | `support-consumer` | No | Consumer group ID for support event processing |
| `SUPPORT_EVENTS_BATCH_SIZE` | `number` | `50` | No | Batch size for event consumption |
| `SUPPORT_EVENTS_RETRY_MAX` | `number` | `3` | No | Maximum retry attempts for failed event processing |

### Example `.env` Configuration

```bash
# Core
SUPPORT_ENABLED=true
SUPPORT_DEFAULT_PRIORITY=normal
SUPPORT_MAX_ATTACHMENT_SIZE_MB=25

# SLA
SUPPORT_SLA_CHECK_INTERVAL_MS=60000
SUPPORT_SLA_DEFAULT_FIRST_RESPONSE_MINS=60
SUPPORT_SLA_DEFAULT_RESOLUTION_MINS=480
SUPPORT_SLA_BUSINESS_HOURS_TIMEZONE=America/New_York
SUPPORT_SLA_BUSINESS_HOURS_START=09:00
SUPPORT_SLA_BUSINESS_HOURS_END=17:00
SUPPORT_SLA_BUSINESS_DAYS=1,2,3,4,5

# Email
SUPPORT_EMAIL_INBOUND_ENABLED=true
SUPPORT_EMAIL_INBOUND_ADDRESS=support@acme.com
SUPPORT_EMAIL_OUTBOUND_FROM_NAME="ACME Support"
SUPPORT_EMAIL_OUTBOUND_FROM_ADDRESS=noreply-support@acme.com

# CSAT
SUPPORT_CSAT_ENABLED=true
SUPPORT_CSAT_SURVEY_DELAY_MINS=60
SUPPORT_CSAT_SCALE=1-5

# Events
SUPPORT_EVENTS_TOPIC=support.events
```

---

## Dependencies

### Internal Dependencies

These are MCV platform modules that `@mcv/nexus/support` depends on:

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/core/auth` | `workspace:*` | Authentication, JWT validation, session management, and user identity resolution |
| `@mcv/core/tenancy` | `workspace:*` | Multi-tenant context propagation, tenant configuration, and RLS session variable management |
| `@mcv/core/events` | `workspace:*` | Domain event bus abstraction over Redpanda — publish/subscribe for support events |
| `@mcv/core/notifications` | `workspace:*` | Notification delivery (in-app, email, push) for SLA alerts, assignment notifications, CSAT surveys |
| `@mcv/core/storage` | `workspace:*` | File upload/download via Supabase Storage — ticket attachments and KB article assets |
| `@mcv/core/audit` | `workspace:*` | Audit trail logging — all support mutations are recorded for compliance |
| `@mcv/core/search` | `workspace:*` | Full-text search infrastructure — powers KB article search and ticket search |
| `@mcv/core/scheduler` | `workspace:*` | Cron and interval scheduling — SLA timer checks, CSAT survey dispatch, auto-close stale tickets |
| `@mcv/core/email` | `workspace:*` | Email send/receive abstraction — inbound email-to-ticket and outbound reply delivery |
| `@mcv/nexus/contacts` | `workspace:*` | Customer/contact records — links ticket requesters to the CRM contact model |
| `@mcv/shared/errors` | `workspace:*` | Shared error code infrastructure, error serialization, and tRPC error mapping |
| `@mcv/shared/validation` | `workspace:*` | Shared Zod schemas, input validation helpers, and sanitization utilities |

### External Dependencies

Production runtime dependencies:

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.34.x` | Type-safe SQL query builder — all database operations for tickets, KB, macros, SLA |
| `@trpc/server` | `^11.x` | tRPC router and procedure definitions for the support API layer |
| `zod` | `^3.23.x` | Runtime schema validation for all tRPC inputs and configuration |
| `nanoid` | `^5.x` | Compact unique ID generation for ticket numbers, comment IDs, and macro IDs |
| `date-fns` | `^4.x` | Date manipulation for SLA calculations, business hours, and time-based queries |
| `date-fns-tz` | `^3.x` | Timezone-aware date operations for SLA business hours across timezones |
| `dompurify` | `^3.x` | HTML sanitization for ticket descriptions, KB articles, and customer-submitted content |
| `isomorphic-dompurify` | `^2.x` | Server-side DOMPurify wrapper for Node.js environments |
| `slugify` | `^1.6.x` | URL slug generation for KB articles and category paths |
| `marked` | `^14.x` | Markdown parsing for KB article rendering and rich-text ticket content |
| `fast-json-stringify` | `^6.x` | High-performance JSON serialization for event payloads to Redpanda |
| `p-queue` | `^8.x` | Promise-based concurrency control for bulk ticket operations and macro execution |
| `cron-parser` | `^4.x` | Cron expression parsing for scheduled automation rules and SLA check intervals |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | `^2.x` | Test runner for unit and integration tests |
| `@faker-js/faker` | `^9.x` | Fake data generation for test fixtures (tickets, customers, agents) |
| `testcontainers` | `^10.x` | Docker-based PostgreSQL containers for integration tests |
| `msw` | `^2.x` | Mock Service Worker for HTTP mocking in email and notification tests |
| `drizzle-kit` | `^0.30.x` | Database migration tooling and schema introspection |
| `@vitest/coverage-v8` | `^2.x` | Code coverage reporting |

### Dependency Graph

```
@mcv/nexus/support
├── @mcv/core/auth          (authentication & authorization)
├── @mcv/core/tenancy       (multi-tenant context)
├── @mcv/core/events        (Redpanda event bus)
│   └── redpanda / kafkajs
├── @mcv/core/notifications (alert delivery)
│   └── @mcv/core/email
├── @mcv/core/storage       (file attachments)
│   └── @supabase/storage-js
├── @mcv/core/audit         (compliance logging)
├── @mcv/core/search        (full-text search)
├── @mcv/core/scheduler     (timed operations)
├── @mcv/nexus/contacts     (customer records)
├── @mcv/shared/errors      (error infrastructure)
├── @mcv/shared/validation  (Zod schemas)
├── drizzle-orm             (database ORM)
├── @trpc/server            (API layer)
├── zod                     (validation)
├── date-fns + date-fns-tz  (SLA time calculations)
├── dompurify               (HTML sanitization)
├── marked                  (Markdown rendering)
└── nanoid                  (ID generation)
```

### Peer Dependencies

The following are expected to be provided by the host application:

```json
{
  "peerDependencies": {
    "@supabase/supabase-js": "^2.x",
    "drizzle-orm": "^0.34.x",
    "@trpc/server": "^11.x",
    "zod": "^3.23.x"
  }
}
```

---

## Testing

### Overview

The support module maintains comprehensive test coverage across unit, integration, and end-to-end test layers. Tests are organized by domain concern (tickets, SLA, KB, macros, CSAT) and use Vitest as the test runner with PostgreSQL testcontainers for integration tests.

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── ticket-lifecycle.test.ts
│   │   ├── ticket-validation.test.ts
│   │   ├── sla-calculator.test.ts
│   │   ├── sla-business-hours.test.ts
│   │   ├── sla-breach-detection.test.ts
│   │   ├── macro-engine.test.ts
│   │   ├── macro-variable-resolver.test.ts
│   │   ├── kb-slug-generation.test.ts
│   │   ├── kb-search-ranking.test.ts
│   │   ├── csat-scoring.test.ts
│   │   ├── assignment-round-robin.test.ts
│   │   ├── assignment-skill-based.test.ts
│   │   ├── email-parser.test.ts
│   │   ├── error-mapping.test.ts
│   │   └── priority-escalation.test.ts
│   ├── integration/
│   │   ├── ticket-crud.integration.test.ts
│   │   ├── ticket-assignment.integration.test.ts
│   │   ├── ticket-merge.integration.test.ts
│   │   ├── sla-timer.integration.test.ts
│   │   ├── sla-escalation.integration.test.ts
│   │   ├── kb-article-lifecycle.integration.test.ts
│   │   ├── kb-search.integration.test.ts
│   │   ├── macro-execution.integration.test.ts
│   │   ├── csat-survey-flow.integration.test.ts
│   │   ├── multi-channel.integration.test.ts
│   │   ├── portal-access.integration.test.ts
│   │   ├── tenant-isolation.integration.test.ts
│   │   ├── event-emission.integration.test.ts
│   │   └── gdpr-erasure.integration.test.ts
│   └── fixtures/
│       ├── tickets.fixture.ts
│       ├── agents.fixture.ts
│       ├── customers.fixture.ts
│       ├── sla-policies.fixture.ts
│       ├── macros.fixture.ts
│       ├── kb-articles.fixture.ts
│       └── tenant.fixture.ts
```

### Unit Tests

Unit tests cover pure business logic without database or external service dependencies.

#### Ticket Lifecycle Tests

```typescript
describe('Ticket Lifecycle', () => {
  it('should create ticket with default priority when not specified', () => {
    const ticket = createTicket({
      subject: 'Cannot login to dashboard',
      description: 'Getting 401 error after password reset',
      requesterId: 'cust_123',
      tenantId: 'tenant_abc',
    });

    expect(ticket.priority).toBe('normal');
    expect(ticket.status).toBe('open');
    expect(ticket.createdAt).toBeDefined();
  });

  it('should enforce valid status transitions', () => {
    const transitions = getValidTransitions('open');
    expect(transitions).toContain('pending');
    expect(transitions).toContain('solved');
    expect(transitions).not.toContain('closed'); // open → closed requires solve first
  });

  it('should reject invalid status transitions', () => {
    expect(() => validateTransition('closed', 'open')).toThrow('SUP_003');
  });

  it('should detect duplicate tickets within dedup window', () => {
    const existing = createTicket({
      subject: 'Login issue',
      requesterId: 'cust_123',
      tenantId: 'tenant_abc',
      createdAt: new Date(Date.now() - 60_000), // 1 min ago
    });

    const isDuplicate = checkDuplicate(
      { subject: 'Login issue', requesterId: 'cust_123' },
      [existing],
      { windowMs: 300_000 },
    );

    expect(isDuplicate).toBe(true);
  });

  it('should generate sequential ticket numbers per tenant', () => {
    const num1 = generateTicketNumber('tenant_abc', 1);
    const num2 = generateTicketNumber('tenant_abc', 2);
    expect(num1).toBe('SUP-0001');
    expect(num2).toBe('SUP-0002');
  });
});
```

#### SLA Calculator Tests

```typescript
describe('SLA Calculator', () => {
  const businessHours = {
    timezone: 'America/New_York',
    start: '09:00',
    end: '17:00',
    businessDays: [1, 2, 3, 4, 5], // Mon-Fri
  };

  it('should calculate elapsed business time correctly', () => {
    const start = new Date('2026-01-05T14:00:00-05:00'); // Monday 2pm
    const end = new Date('2026-01-05T16:00:00-05:00');   // Monday 4pm

    const elapsed = calculateBusinessMinutes(start, end, businessHours);
    expect(elapsed).toBe(120); // 2 hours
  });

  it('should exclude non-business hours from SLA calculation', () => {
    const start = new Date('2026-01-05T16:00:00-05:00'); // Monday 4pm
    const end = new Date('2026-01-06T10:00:00-05:00');   // Tuesday 10am

    const elapsed = calculateBusinessMinutes(start, end, businessHours);
    expect(elapsed).toBe(120); // 1h Monday + 1h Tuesday = 2h
  });

  it('should skip weekends in business time calculation', () => {
    const start = new Date('2026-01-09T16:00:00-05:00'); // Friday 4pm
    const end = new Date('2026-01-12T10:00:00-05:00');   // Monday 10am

    const elapsed = calculateBusinessMinutes(start, end, businessHours);
    expect(elapsed).toBe(120); // 1h Friday + 1h Monday
  });

  it('should detect SLA breach when elapsed exceeds target', () => {
    const result = checkSlaBreach({
      targetMinutes: 60,
      elapsedMinutes: 75,
      status: 'active',
    });

    expect(result.breached).toBe(true);
    expect(result.breachedByMinutes).toBe(15);
  });

  it('should pause SLA timer when ticket status is pending', () => {
    const timer = createSlaTimer({
      targetMinutes: 60,
      startedAt: new Date('2026-01-05T10:00:00Z'),
    });

    const paused = pauseSlaTimer(timer, new Date('2026-01-05T10:30:00Z'));
    expect(paused.status).toBe('paused');
    expect(paused.elapsedAtPause).toBe(30);
  });

  it('should resume SLA timer from paused state', () => {
    const timer = createSlaTimer({
      targetMinutes: 60,
      startedAt: new Date('2026-01-05T10:00:00Z'),
      status: 'paused',
      elapsedAtPause: 30,
      pausedAt: new Date('2026-01-05T10:30:00Z'),
    });

    const resumed = resumeSlaTimer(timer, new Date('2026-01-05T11:00:00Z'));
    expect(resumed.status).toBe('active');
    expect(resumed.elapsedAtPause).toBeNull();
  });

  it('should handle timezone transitions (DST) correctly', () => {
    // Spring forward: March 8, 2026 2am → 3am
    const start = new Date('2026-03-08T01:00:00-05:00'); // 1am EST
    const end = new Date('2026-03-08T04:00:00-04:00');   // 4am EDT (only 2 real hours)

    const elapsed = calculateBusinessMinutes(start, end, {
      ...businessHours,
      start: '00:00',
      end: '23:59',
      businessDays: [1, 2, 3, 4, 5, 6, 7],
    });

    expect(elapsed).toBe(120); // 2 actual hours despite clock showing 3
  });
});
```

#### Macro Engine Tests

```typescript
describe('Macro Engine', () => {
  it('should resolve template variables from ticket context', () => {
    const template = 'Hello {{requester.name}}, your ticket {{ticket.number}} is being reviewed.';
    const context = {
      requester: { name: 'Alice Johnson' },
      ticket: { number: 'SUP-0042' },
    };

    const resolved = resolveTemplate(template, context);
    expect(resolved).toBe('Hello Alice Johnson, your ticket SUP-0042 is being reviewed.');
  });

  it('should throw on unresolved template variables', () => {
    const template = 'Hello {{requester.name}}, agent {{agent.name}} will assist you.';
    const context = {
      requester: { name: 'Bob' },
      // agent is missing
    };

    expect(() => resolveTemplate(template, context, { strict: true })).toThrow('SUP_025');
  });

  it('should detect circular macro references', () => {
    const macros = [
      { id: 'macro_a', triggers: ['macro_b'] },
      { id: 'macro_b', triggers: ['macro_a'] },
    ];

    expect(() => validateMacroChain(macros)).toThrow('SUP_024');
  });

  it('should execute macro actions in sequence', async () => {
    const macro = createMacro({
      name: 'Escalate to Engineering',
      actions: [
        { type: 'set_priority', value: 'urgent' },
        { type: 'assign_group', value: 'group_engineering' },
        { type: 'add_tag', value: 'escalated' },
        { type: 'add_internal_note', value: 'Auto-escalated via macro' },
      ],
    });

    const result = await executeMacro(macro, mockTicket);
    expect(result.actionsExecuted).toBe(4);
    expect(result.ticket.priority).toBe('urgent');
    expect(result.ticket.tags).toContain('escalated');
  });
});
```

### Integration Tests

Integration tests run against a real PostgreSQL database via testcontainers and verify end-to-end data flows.

```typescript
describe('Ticket CRUD (Integration)', () => {
  let db: DrizzleClient;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('support_test')
      .start();

    db = createDrizzleClient(container.getConnectionUri());
    await runMigrations(db);
    await seedTenant(db, 'tenant_test');
  });

  afterAll(async () => {
    await db.$client.end();
    await container.stop();
  });

  it('should create a ticket and persist to database', async () => {
    const caller = createTestCaller(db, { tenantId: 'tenant_test', role: 'agent' });

    const ticket = await caller.support.ticket.create({
      subject: 'Integration test ticket',
      description: 'Testing end-to-end ticket creation',
      priority: 'high',
      requesterId: 'customer_001',
    });

    expect(ticket.id).toBeDefined();
    expect(ticket.number).toMatch(/^SUP-\d{4}$/);
    expect(ticket.status).toBe('open');

    // Verify persisted
    const found = await caller.support.ticket.getById({ ticketId: ticket.id });
    expect(found.subject).toBe('Integration test ticket');
  });

  it('should enforce tenant isolation between tenants', async () => {
    const callerA = createTestCaller(db, { tenantId: 'tenant_a', role: 'agent' });
    const callerB = createTestCaller(db, { tenantId: 'tenant_b', role: 'agent' });

    const ticket = await callerA.support.ticket.create({
      subject: 'Tenant A ticket',
      description: 'Should not be visible to Tenant B',
      requesterId: 'customer_a_001',
    });

    await expect(
      callerB.support.ticket.getById({ ticketId: ticket.id })
    ).rejects.toThrow('SUP_001'); // Not found in tenant_b context
  });

  it('should emit domain event on ticket creation', async () => {
    const events: DomainEvent[] = [];
    const caller = createTestCaller(db, {
      tenantId: 'tenant_test',
      role: 'agent',
      onEvent: (e) => events.push(e),
    });

    await caller.support.ticket.create({
      subject: 'Event test',
      description: 'Should emit event',
      requesterId: 'customer_001',
    });

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('support.ticket.created');
    expect(events[0].payload.subject).toBe('Event test');
  });
});
```

#### SLA Timer Integration Tests

```typescript
describe('SLA Timer (Integration)', () => {
  it('should create SLA timers when ticket is assigned a policy', async () => {
    const caller = createTestCaller(db, { tenantId: 'tenant_test', role: 'agent' });

    // Create SLA policy
    const policy = await caller.support.sla.createPolicy({
      name: 'Premium SLA',
      firstResponseMins: 30,
      resolutionMins: 240,
      priorities: ['high', 'urgent'],
    });

    // Create ticket matching the policy
    const ticket = await caller.support.ticket.create({
      subject: 'Urgent issue',
      priority: 'urgent',
      requesterId: 'customer_001',
    });

    // Verify SLA timers were created
    const timers = await caller.support.sla.getTimers({ ticketId: ticket.id });
    expect(timers).toHaveLength(2);
    expect(timers.find(t => t.metric === 'first_response')?.targetMins).toBe(30);
    expect(timers.find(t => t.metric === 'resolution')?.targetMins).toBe(240);
  });

  it('should pause SLA timer when ticket moves to pending status', async () => {
    const caller = createTestCaller(db, { tenantId: 'tenant_test', role: 'agent' });

    const ticket = await caller.support.ticket.create({
      subject: 'Pause test',
      priority: 'high',
      requesterId: 'customer_001',
    });

    await caller.support.ticket.updateStatus({
      ticketId: ticket.id,
      status: 'pending',
    });

    const timers = await caller.support.sla.getTimers({ ticketId: ticket.id });
    expect(timers.every(t => t.status === 'paused')).toBe(true);
  });
});
```

### Test Fixtures

```typescript
// fixtures/tickets.fixture.ts
import { faker } from '@faker-js/faker';

export function createTicketFixture(overrides?: Partial<TicketInput>): TicketInput {
  return {
    subject: faker.lorem.sentence({ min: 3, max: 8 }),
    description: faker.lorem.paragraphs(2),
    priority: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
    requesterId: `customer_${faker.string.nanoid(8)}`,
    tags: faker.helpers.arrayElements(['billing', 'technical', 'account', 'bug', 'feature'], { min: 0, max: 3 }),
    channel: faker.helpers.arrayElement(['email', 'portal', 'chat', 'phone']),
    ...overrides,
  };
}

export function createAgentFixture(overrides?: Partial<AgentInput>): AgentInput {
  return {
    userId: `user_${faker.string.nanoid(8)}`,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: faker.helpers.arrayElement(['agent', 'senior_agent', 'supervisor']),
    groups: [faker.helpers.arrayElement(['general', 'billing', 'technical', 'engineering'])],
    maxConcurrentTickets: faker.number.int({ min: 5, max: 20 }),
    skills: faker.helpers.arrayElements(['javascript', 'python', 'billing', 'networking', 'security'], { min: 1, max: 3 }),
    ...overrides,
  };
}

export function createSlaFixture(overrides?: Partial<SlaPolicyInput>): SlaPolicyInput {
  return {
    name: `${faker.helpers.arrayElement(['Premium', 'Standard', 'Enterprise', 'Basic'])} SLA`,
    firstResponseMins: faker.helpers.arrayElement([15, 30, 60, 120]),
    resolutionMins: faker.helpers.arrayElement([120, 240, 480, 1440]),
    priorities: faker.helpers.arrayElements(['low', 'normal', 'high', 'urgent'], { min: 1, max: 4 }),
    businessHoursOnly: faker.datatype.boolean(),
    ...overrides,
  };
}
```

### Coverage Targets

| Category | Target | Enforcement |
|----------|--------|-------------|
| **Overall Line Coverage** | ≥ 85% | CI gate — build fails below threshold |
| **Branch Coverage** | ≥ 80% | CI gate |
| **Function Coverage** | ≥ 90% | CI gate |
| **SLA Calculator** | ≥ 95% | Critical path — enforced per-file |
| **Ticket Lifecycle** | ≥ 90% | Core domain — enforced per-file |
| **Macro Engine** | ≥ 85% | Business logic — enforced per-file |
| **Error Mapping** | 100% | All error codes must have corresponding tests |
| **Integration Tests** | ≥ 70% | Measured separately via testcontainers runs |

### Running Tests

```bash
# Run all support module tests
pnpm --filter @mcv/nexus/support test

# Run unit tests only
pnpm --filter @mcv/nexus/support test:unit

# Run integration tests (requires Docker)
pnpm --filter @mcv/nexus/support test:integration

# Run with coverage report
pnpm --filter @mcv/nexus/support test:coverage

# Run specific test file
pnpm --filter @mcv/nexus/support test -- sla-calculator

# Watch mode during development
pnpm --filter @mcv/nexus/support test:watch
```

### CI Pipeline Configuration

```yaml
# .github/workflows/support-tests.yml
support-tests:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16-alpine
      env:
        POSTGRES_DB: support_test
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
      ports:
        - 5432:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'pnpm'

    - run: pnpm install --frozen-lockfile
    - run: pnpm --filter @mcv/nexus/support test:coverage
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/support_test

    - uses: codecov/codecov-action@v4
      with:
        files: packages/nexus/support/coverage/lcov.info
        flags: nexus-support
```
