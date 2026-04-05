# @mcv/nexus/contact-center

> Omnichannel contact center operations — agent management, queue orchestration, intelligent routing, workforce optimization, quality assurance, and real-time analytics for the MCV.ONE platform.

**Module:** `@mcv/nexus/contact-center`
**Layer:** Tier 5 — Domain
**Domain:** Nexus (Communications & Collaboration)
**Since:** 0.12.0
**Status:** Stable
**Maintainer:** MCV Platform Team

---

## Table of Contents

1. [Purpose](#purpose)
2. [Exports](#exports)
3. [Architecture](#architecture)
4. [Core Interfaces](#core-interfaces)
5. [Database Schemas](#database-schemas)
6. [Code Examples](#code-examples)
7. [Error Codes](#error-codes)
8. [Security](#security)
9. [Environment Variables](#environment-variables)
10. [Dependencies](#dependencies)
11. [Testing](#testing)

---

## Purpose

`@mcv/nexus/contact-center` delivers a complete, enterprise-grade contact center platform within the MCV.ONE ecosystem. It provides the infrastructure to operate omnichannel customer service operations — routing voice calls, chats, emails, and social media interactions to skilled agents through intelligent queues, while giving supervisors real-time visibility and workforce managers the tools to forecast, schedule, and optimize.

### What This Module Does

- **Agent Lifecycle Management** — Onboard, profile, skill-tag, schedule, and track the availability of every contact center agent across shifts and channels.
- **Queue Orchestration** — Create priority queues with SLA targets, overflow rules, callback mechanisms, and estimated wait-time calculations to ensure customers reach the right agent at the right time.
- **Omnichannel Routing** — Unify voice, chat, email, SMS, and social media interactions into a single routing engine that matches customer needs to agent skills regardless of channel.
- **Supervisor Operations** — Provide real-time dashboards for monitoring queue depth, agent states, active interactions, and enable whisper coaching and barge-in capabilities for live calls and chats.
- **Workforce Management (WFM)** — Forecast interaction volumes using Erlang-C models, generate optimized schedules, track adherence in real-time, and manage overtime and shift-swap workflows.
- **Quality Assurance (QA)** — Define scoring rubrics, assign evaluations to QA analysts, run calibration sessions, and build coaching plans tied to evaluation outcomes.
- **IVR Builder** — Design interactive voice response flows with a visual builder supporting DTMF input, speech recognition, database lookups, API integrations, and conditional branching.
- **Wallboard & Real-Time Analytics** — Display live KPIs on configurable wallboards with alert thresholds, TV-mode rendering, and WebSocket-driven updates for the contact center floor.
- **Reporting & Analytics** — Generate agent performance reports, queue metrics, SLA compliance dashboards, first-contact resolution (FCR) tracking, and average handle time (AHT) analysis.
- **Customer Feedback** — Capture post-interaction CSAT and NPS surveys, route feedback to appropriate teams, and analyze satisfaction trends over time.

### What This Module Does NOT Do

- **Telephony Infrastructure** — Does not provide SIP trunking, PBX, or PSTN connectivity directly. Integrates with Twilio and other providers via `@mcv/nexus/telephony`.
- **CRM** — Does not manage customer records or deal pipelines. Integrates with `@mcv/nexus/crm` for customer context during interactions.
- **Billing** — Does not handle subscription or usage billing. Defers to `@mcv/ledger/billing` for agent seat licensing.
- **AI/ML Model Training** — Does not train ML models for sentiment analysis or intent detection. Consumes models provided by `@mcv/cortex/ml`.

### Design Principles

1. **Omnichannel-First** — Every interaction, regardless of channel, flows through the same routing engine, skill-matching logic, and reporting pipeline. Agents are blended by default.
2. **Real-Time by Default** — Agent states, queue depths, and KPIs update via WebSocket subscriptions. Supervisors see changes within 500ms.
3. **SLA-Driven** — Queues, routing, and workforce forecasting are anchored to SLA targets. The system continuously optimizes toward service-level goals.
4. **Tenant-Isolated** — Every table enforces row-level security (RLS) scoped to `tenant_id`. Cross-tenant data access is impossible at the database layer.
5. **Composable** — Each capability (routing, WFM, QA, IVR) is independently configurable and can be adopted incrementally.

---

## Exports

```typescript
// ── Service Layer ──────────────────────────────────────────────
export { ContactCenterService }    from './services/contact-center.service';
export { AgentService }            from './services/agent.service';
export { QueueService }            from './services/queue.service';
export { RoutingService }          from './services/routing.service';
export { SupervisorService }       from './services/supervisor.service';
export { WFMService }              from './services/wfm.service';
export { QAService }               from './services/qa.service';
export { IVRService }              from './services/ivr.service';
export { WallboardService }        from './services/wallboard.service';
export { ReportingService }        from './services/reporting.service';
export { FeedbackService }         from './services/feedback.service';

// ── tRPC Router ────────────────────────────────────────────────
export { contactCenterRouter }     from './trpc/contact-center.router';
export { agentRouter }             from './trpc/agent.router';
export { queueRouter }             from './trpc/queue.router';
export { routingRouter }           from './trpc/routing.router';
export { supervisorRouter }        from './trpc/supervisor.router';
export { wfmRouter }               from './trpc/wfm.router';
export { qaRouter }                from './trpc/qa.router';
export { ivrRouter }               from './trpc/ivr.router';
export { wallboardRouter }         from './trpc/wallboard.router';
export { reportingRouter }         from './trpc/reporting.router';
export { feedbackRouter }          from './trpc/feedback.router';

// ── Database Schemas (Drizzle) ─────────────────────────────────
export {
  agents,
  agentSkills,
  agentSchedules,
  agentAvailabilityLog,
  queues,
  queueEntries,
  queueCallbacks,
  routingRules,
  routingConditions,
  interactions,
  interactionSegments,
  qaScorecards,
  qaEvaluations,
  qaEvaluationItems,
  qaCalibraSessions,
  coachingPlans,
  ivrFlows,
  ivrNodes,
  ivrEdges,
  wallboardConfigs,
  wallboardWidgets,
  interactionSurveys,
  surveyResponses,
  wfmForecasts,
  wfmSchedules,
  wfmAdherenceLog,
  supervisorSessions,
}                                  from './db/schema';

// ── Types & Interfaces ─────────────────────────────────────────
export type { Agent }              from './types/agent';
export type { AgentSkill }         from './types/agent';
export type { AgentSchedule }      from './types/agent';
export type { AgentState }         from './types/agent';
export type { Queue }              from './types/queue';
export type { QueueEntry }         from './types/queue';
export type { QueueCallback }      from './types/queue';
export type { QueueStats }         from './types/queue';
export type { RoutingRule }        from './types/routing';
export type { RoutingCondition }   from './types/routing';
export type { RoutingDecision }    from './types/routing';
export type { Interaction }        from './types/interaction';
export type { InteractionSegment } from './types/interaction';
export type { InteractionChannel } from './types/interaction';
export type { Supervisor }         from './types/supervisor';
export type { SupervisorAction }   from './types/supervisor';
export type { MonitorSession }     from './types/supervisor';
export type { WFMForecast }        from './types/wfm';
export type { WFMSchedule }        from './types/wfm';
export type { WFMAdherenceRecord } from './types/wfm';
export type { QAScorecard }        from './types/qa';
export type { QAEvaluation }       from './types/qa';
export type { QAEvaluationItem }   from './types/qa';
export type { CalibrationSession } from './types/qa';
export type { CoachingPlan }       from './types/qa';
export type { IVRFlow }            from './types/ivr';
export type { IVRNode }            from './types/ivr';
export type { IVREdge }            from './types/ivr';
export type { IVRNodeType }        from './types/ivr';
export type { Wallboard }          from './types/wallboard';
export type { WallboardWidget }    from './types/wallboard';
export type { WidgetType }         from './types/wallboard';
export type { InteractionSurvey }  from './types/feedback';
export type { SurveyResponse }     from './types/feedback';
export type { SurveyType }         from './types/feedback';

// ── Enums ──────────────────────────────────────────────────────
export {
  AgentAvailability,
  InteractionChannelEnum,
  InteractionStatus,
  QueuePriority,
  RoutingStrategy,
  EvaluationStatus,
  IVRNodeTypeEnum,
  WidgetTypeEnum,
  SurveyTypeEnum,
  AdherenceStatus,
  SupervisorActionType,
}                                  from './types/enums';

// ── Utilities ──────────────────────────────────────────────────
export { ErlangCCalculator }       from './utils/erlang-c';
export { WaitTimeEstimator }       from './utils/wait-time';
export { SkillMatcher }            from './utils/skill-matcher';
export { SLACalculator }           from './utils/sla-calculator';
export { RoutingEngine }           from './utils/routing-engine';
export { ScheduleOptimizer }       from './utils/schedule-optimizer';

// ── Constants ──────────────────────────────────────────────────
export {
  DEFAULT_SLA_THRESHOLD_SECONDS,
  DEFAULT_SLA_TARGET_PERCENT,
  MAX_QUEUE_DEPTH,
  MAX_WRAP_TIME_SECONDS,
  DEFAULT_FORECAST_INTERVAL_MINUTES,
  WALLBOARD_REFRESH_INTERVAL_MS,
  AGENT_HEARTBEAT_INTERVAL_MS,
  MAX_CONCURRENT_INTERACTIONS,
}                                  from './constants';

// ── Events ─────────────────────────────────────────────────────
export {
  AgentStateChangedEvent,
  InteractionRoutedEvent,
  InteractionCompletedEvent,
  QueueThresholdBreachedEvent,
  SLABreachWarningEvent,
  EvaluationCompletedEvent,
  CallbackRequestedEvent,
  AdherenceViolationEvent,
  SupervisorActionEvent,
  WallboardAlertEvent,
}                                  from './events';
```

---

## Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        CONTACT CENTER MODULE                             │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │   Channels   │  │   Channels   │  │   Channels   │  │   Channels    │   │
│  │    Voice     │  │    Chat      │  │    Email     │  │  Social/SMS   │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘   │
│         │                │                │                 │            │
│         └────────────────┼────────────────┼─────────────────┘            │
│                          ▼                                               │
│              ┌───────────────────────┐                                    │
│              │   Interaction Intake   │ ◄── Normalize all channels        │
│              └───────────┬───────────┘                                    │
│                          ▼                                               │
│              ┌───────────────────────┐    ┌──────────────────┐           │
│              │    Routing Engine      │◄───│   Routing Rules   │           │
│              │  (Skill + Priority +   │    │  (Conditions &    │           │
│              │   SLA-aware matching)  │    │   Strategies)     │           │
│              └───────────┬───────────┘    └──────────────────┘           │
│                          │                                               │
│              ┌───────────▼───────────┐                                    │
│              │    Queue Manager       │                                    │
│              │  ┌─────┐ ┌─────┐      │    ┌──────────────────┐           │
│              │  │ Q1  │ │ Q2  │ ...  │◄───│  Queue Overflow   │           │
│              │  └──┬──┘ └──┬──┘      │    │  & Callback Mgr   │           │
│              │     │       │         │    └──────────────────┘           │
│              └─────┼───────┼─────────┘                                    │
│                    ▼       ▼                                              │
│              ┌───────────────────────┐                                    │
│              │   Agent Pool Manager   │                                    │
│              │  ┌─────────────────┐  │    ┌──────────────────┐           │
│              │  │ Skills │ States │  │◄───│  WFM Scheduler    │           │
│              │  │ Matrix │ Engine │  │    │  & Forecasting    │           │
│              │  └─────────────────┘  │    └──────────────────┘           │
│              └───────────┬───────────┘                                    │
│                          │                                               │
│         ┌────────────────┼──────────────────┐                            │
│         ▼                ▼                  ▼                             │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────┐                      │
│  │  Supervisor  │  │  Quality   │  │   Customer   │                      │
│  │  Dashboard   │  │ Assurance  │  │   Feedback   │                      │
│  │ (Realtime)   │  │ (Scoring)  │  │  (Surveys)   │                      │
│  └──────┬──────┘  └─────┬──────┘  └──────┬───────┘                      │
│         │               │                │                               │
│         └───────────────┼────────────────┘                               │
│                         ▼                                                │
│              ┌───────────────────────┐    ┌──────────────────┐           │
│              │   Reporting Engine     │───▶│    Wallboard      │           │
│              │  (Metrics, SLA, AHT)  │    │  (Live KPI TV)    │           │
│              └───────────────────────┘    └──────────────────┘           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Omnichannel Routing Pipeline

The routing engine is the heart of the contact center. Every interaction — regardless of channel — passes through the same pipeline:

```
Customer Interaction Arrives
         │
         ▼
┌─────────────────┐
│ 1. INTAKE        │  Normalize interaction into canonical format.
│    - Channel ID  │  Extract customer ID, language, priority hints.
│    - Customer    │  Check for VIP status, open tickets, recent history.
│    - Context     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. CLASSIFY      │  Apply routing rules to determine:
│    - Skills      │  - Required agent skills (language, product, tier)
│    - Priority    │  - Queue priority (VIP, SLA risk, first-contact)
│    - Queue       │  - Target queue (or create ad-hoc queue)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. QUEUE         │  Insert into priority queue. Start SLA timer.
│    - Position    │  Calculate estimated wait time (EWT).
│    - SLA Timer   │  Check overflow thresholds.
│    - EWT Calc    │  Offer callback if wait exceeds threshold.
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. MATCH         │  Find best available agent:
│    - Skill Match │  - Required skills satisfied?
│    - Load Balance│  - Longest idle? Least loaded? Round robin?
│    - Channel Cap │  - Channel concurrency limits respected?
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. DELIVER       │  Route interaction to matched agent.
│    - Agent Alert │  Agent receives notification in their client.
│    - Timer Start │  Interaction timer begins (for AHT tracking).
│    - Supervisor  │  Supervisor dashboard updates in real-time.
│      Notify      │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 6. HANDLE        │  Agent works the interaction.
│    - Transfers   │  May transfer (warm/cold), conference, or escalate.
│    - Hold/Resume │  Hold times tracked separately.
│    - Wrap-up     │  Post-interaction wrap-up / disposition codes.
└────────┬────────┘
         ▼
┌─────────────────┐
│ 7. COMPLETE      │  Interaction ends.
│    - Disposition │  Agent selects disposition code.
│    - Survey      │  Customer receives CSAT/NPS survey (if configured).
│    - QA Queue    │  Interaction enters QA evaluation pool.
│    - Analytics   │  Metrics recorded for reporting.
└─────────────────┘
```

### Routing Strategies

The module supports multiple routing strategies, configurable per queue:

| Strategy | Description | Best For |
|---|---|---|
| `longest-idle` | Route to agent idle longest | Fair distribution |
| `most-skilled` | Route to agent with highest skill match score | Complex inquiries |
| `least-loaded` | Route to agent with fewest concurrent interactions | Blended agents |
| `round-robin` | Rotate through available agents sequentially | Even distribution |
| `priority-skill` | Skill match first, then longest-idle tiebreaker | Specialized queues |
| `predictive` | ML-based matching using historical performance | High-volume centers |

### Workforce Management Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                   WFM LIFECYCLE                               │
│                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │ FORECAST  │───▶│ SCHEDULE  │───▶│ PUBLISH   │───▶│ TRACK  │ │
│  │           │    │           │    │           │    │        │ │
│  │ Erlang-C  │    │ Optimizer │    │ Agent     │    │ Real-  │ │
│  │ modeling  │    │ algorithm │    │ self-svc  │    │ time   │ │
│  │ + history │    │ + rules   │    │ + notify  │    │ adhere │ │
│  └──────────┘    └──────────┘    └──────────┘    └────────┘ │
│       │                                               │      │
│       └───────────── Feedback Loop ◄──────────────────┘      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Forecast → Schedule → Publish → Track → Adjust**

1. **Forecast**: Use historical interaction volumes, Erlang-C calculations, and seasonal patterns to predict staffing needs per interval (typically 15 or 30 minutes).
2. **Schedule**: Run the schedule optimizer to assign shifts, breaks, lunches, and off-phone activities while meeting forecast requirements and respecting labor rules.
3. **Publish**: Release schedules to agents. Agents can view, request swaps, bid on overtime, and submit time-off requests.
4. **Track**: Monitor real-time adherence — compare actual agent state to scheduled activity. Flag out-of-adherence events.
5. **Adjust**: Intraday management — adjust schedules in response to unexpected volume spikes or staffing shortfalls.

### Real-Time Data Flow

```
┌──────────────┐     WebSocket      ┌──────────────────┐
│  Agent Client │◄──────────────────▶│  Contact Center   │
│  (State sync) │                    │  WebSocket Server  │
└──────────────┘                    │                    │
                                     │  Publishes:        │
┌──────────────┐     WebSocket      │  - agent.state     │
│  Supervisor   │◄──────────────────▶│  - queue.update    │
│  Dashboard    │                    │  - interaction.*   │
└──────────────┘                    │  - sla.breach      │
                                     │  - wallboard.kpi   │
┌──────────────┐     WebSocket      │  - adherence.*     │
│  Wallboard    │◄──────────────────▶│                    │
│  (TV Display) │                    └──────────────────┘
└──────────────┘
```

All real-time updates flow through a WebSocket pub/sub layer. Clients subscribe to topic channels scoped by tenant and resource:

- `cc:{tenantId}:agent:{agentId}:state` — Agent state changes
- `cc:{tenantId}:queue:{queueId}:stats` — Queue depth, EWT updates
- `cc:{tenantId}:interaction:{interactionId}` — Interaction lifecycle events
- `cc:{tenantId}:wallboard:{wallboardId}` — Wallboard KPI refreshes
- `cc:{tenantId}:sla:breach` — SLA breach warnings
- `cc:{tenantId}:adherence:{agentId}` — Schedule adherence events

---

## Core Interfaces

### Agent

```typescript
/**
 * Represents a contact center agent — a human operator who handles
 * customer interactions across one or more channels.
 */
interface Agent {
  /** Unique agent identifier (UUID) */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** Reference to the user account in the identity system */
  userId: string;

  /** Display name shown in dashboards and to supervisors */
  displayName: string;

  /** Agent's email address */
  email: string;

  /** Current availability state */
  availability: AgentAvailability;

  /** Reason code for current state (e.g., "lunch", "meeting", "training") */
  availabilityReason?: string;

  /** Channels this agent can handle */
  enabledChannels: InteractionChannel[];

  /** Maximum concurrent interactions per channel */
  concurrencyLimits: Record<InteractionChannel, number>;

  /** Current active interaction count per channel */
  activeInteractions: Record<InteractionChannel, number>;

  /** Agent's skill set with proficiency levels */
  skills: AgentSkill[];

  /** Assigned team/group ID */
  teamId?: string;

  /** Assigned supervisor ID */
  supervisorId?: string;

  /** Agent's current shift schedule */
  currentSchedule?: AgentSchedule;

  /** Timestamp when agent last became available */
  lastAvailableAt?: Date;

  /** Timestamp when agent last completed an interaction */
  lastInteractionAt?: Date;

  /** Agent's timezone (IANA format) */
  timezone: string;

  /** Whether the agent is currently logged into the agent client */
  isLoggedIn: boolean;

  /** ISO timestamp of last heartbeat from agent client */
  lastHeartbeatAt?: string;

  /** Metadata and custom fields */
  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

/** Agent availability states */
enum AgentAvailability {
  /** Ready to receive interactions */
  Available = 'available',
  /** Currently handling an interaction */
  Busy = 'busy',
  /** Temporarily away (break, meeting, etc.) */
  Away = 'away',
  /** In post-interaction wrap-up */
  WrapUp = 'wrap_up',
  /** Logged out or offline */
  Offline = 'offline',
}

/** Agent skill with proficiency level */
interface AgentSkill {
  /** Skill identifier */
  skillId: string;

  /** Skill name (e.g., "Spanish", "Billing", "Technical Support") */
  skillName: string;

  /** Proficiency level: 1 (novice) to 10 (expert) */
  proficiency: number;

  /** Whether this skill is currently active for routing */
  isActive: boolean;
}

/** Agent shift schedule */
interface AgentSchedule {
  id: string;
  agentId: string;
  tenantId: string;

  /** Schedule date */
  date: string; // YYYY-MM-DD

  /** Shift start time (ISO 8601) */
  shiftStart: string;

  /** Shift end time (ISO 8601) */
  shiftEnd: string;

  /** Scheduled activities within the shift */
  activities: ScheduleActivity[];

  /** Whether the agent has acknowledged this schedule */
  acknowledged: boolean;

  /** Schedule status */
  status: 'draft' | 'published' | 'acknowledged' | 'modified';

  createdAt: Date;
  updatedAt: Date;
}

/** A scheduled activity block within a shift */
interface ScheduleActivity {
  /** Activity type */
  type: 'on_queue' | 'break' | 'lunch' | 'training' | 'meeting' | 'coaching' | 'off_phone';

  /** Start time (ISO 8601) */
  startTime: string;

  /** End time (ISO 8601) */
  endTime: string;

  /** Optional description */
  description?: string;

  /** Whether this activity is paid */
  isPaid: boolean;
}

/** Records a state transition for an agent */
interface AgentStateTransition {
  agentId: string;
  tenantId: string;
  previousState: AgentAvailability;
  newState: AgentAvailability;
  reason?: string;
  triggeredBy: 'agent' | 'system' | 'supervisor';
  timestamp: Date;
}
```

### Queue

```typescript
/**
 * A routing queue that holds interactions waiting to be delivered
 * to available agents. Queues have SLA targets, priority levels,
 * overflow rules, and routing strategies.
 */
interface Queue {
  /** Unique queue identifier (UUID) */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** Queue display name */
  name: string;

  /** Human-readable description */
  description?: string;

  /** Routing strategy for this queue */
  routingStrategy: RoutingStrategy;

  /** Required skills for agents in this queue */
  requiredSkills: QueueSkillRequirement[];

  /** SLA configuration */
  sla: QueueSLA;

  /** Priority level (higher = more urgent) */
  priority: number;

  /** Maximum queue depth before overflow triggers */
  maxDepth: number;

  /** Overflow configuration */
  overflow?: QueueOverflow;

  /** Callback configuration */
  callbackEnabled: boolean;
  callbackThresholdSeconds?: number;

  /** Supported channels */
  channels: InteractionChannel[];

  /** Whether the queue is currently active */
  isActive: boolean;

  /** Operating hours (null = 24/7) */
  operatingHours?: OperatingHours;

  /** Current real-time statistics */
  stats?: QueueStats;

  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/** SLA configuration for a queue */
interface QueueSLA {
  /** Target answer time in seconds (e.g., 20 for "80/20" SLA) */
  targetAnswerTimeSeconds: number;

  /** Target percentage of interactions answered within target time */
  targetPercentage: number;

  /** Warning threshold in seconds (fire alert before breach) */
  warningThresholdSeconds: number;

  /** Critical threshold in seconds (escalation trigger) */
  criticalThresholdSeconds: number;
}

/** Queue overflow configuration */
interface QueueOverflow {
  /** Action to take when overflow triggers */
  action: 'route_to_queue' | 'voicemail' | 'callback' | 'disconnect_with_message';

  /** Target queue ID for route_to_queue action */
  targetQueueId?: string;

  /** Message to play/display for disconnect */
  overflowMessage?: string;

  /** Trigger conditions */
  triggers: {
    /** Max wait time in seconds before overflow */
    maxWaitSeconds?: number;
    /** Max queue depth before overflow */
    maxDepth?: number;
    /** Min available agents (overflow when below) */
    minAvailableAgents?: number;
  };
}

/** Real-time queue statistics */
interface QueueStats {
  /** Queue identifier */
  queueId: string;

  /** Number of interactions currently waiting */
  waitingCount: number;

  /** Number of interactions currently being handled */
  activeCount: number;

  /** Number of available agents for this queue */
  availableAgents: number;

  /** Number of logged-in agents assigned to this queue */
  totalAgents: number;

  /** Longest current wait time in seconds */
  longestWaitSeconds: number;

  /** Estimated wait time for new interaction in seconds */
  estimatedWaitSeconds: number;

  /** Current SLA percentage (interactions answered within target) */
  currentSLAPercent: number;

  /** Interactions handled in current interval */
  handledThisInterval: number;

  /** Interactions abandoned in current interval */
  abandonedThisInterval: number;

  /** Average handle time in seconds (rolling window) */
  averageHandleTimeSeconds: number;

  /** Average speed of answer in seconds (rolling window) */
  averageSpeedOfAnswerSeconds: number;

  /** Timestamp of this statistics snapshot */
  timestamp: Date;
}

/** A single entry (waiting interaction) in a queue */
interface QueueEntry {
  id: string;
  queueId: string;
  tenantId: string;
  interactionId: string;

  /** Priority within the queue (higher = served first) */
  priority: number;

  /** Time the interaction entered the queue */
  enqueuedAt: Date;

  /** Current position in queue (1-indexed) */
  position: number;

  /** Current estimated wait time in seconds */
  estimatedWaitSeconds: number;

  /** Whether this entry has been offered to an agent */
  isOffered: boolean;

  /** Number of times this entry was offered and rejected/timed out */
  offerAttempts: number;

  /** Skills requested for this interaction */
  requestedSkills: string[];

  /** Customer identifier */
  customerId?: string;

  /** Channel of the interaction */
  channel: InteractionChannel;

  status: 'waiting' | 'offered' | 'connected' | 'abandoned' | 'overflowed' | 'callback_scheduled';
}

/** Callback request from a customer who doesn't want to wait */
interface QueueCallback {
  id: string;
  queueId: string;
  tenantId: string;
  customerId: string;
  phoneNumber: string;
  requestedAt: Date;
  scheduledAt?: Date;
  attemptedAt?: Date;
  completedAt?: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  originalInteractionId?: string;
}

/** Routing strategy enum */
enum RoutingStrategy {
  LongestIdle = 'longest_idle',
  MostSkilled = 'most_skilled',
  LeastLoaded = 'least_loaded',
  RoundRobin = 'round_robin',
  PrioritySkill = 'priority_skill',
  Predictive = 'predictive',
}

/** Skill requirement for a queue */
interface QueueSkillRequirement {
  skillId: string;
  skillName: string;
  minimumProficiency: number;
  isRequired: boolean; // true = mandatory, false = preferred
}
```

### Routing Rule

```typescript
/**
 * A routing rule defines conditions under which interactions are
 * directed to specific queues with specific priority adjustments.
 */
interface RoutingRule {
  id: string;
  tenantId: string;

  /** Rule name for identification */
  name: string;

  /** Rule description */
  description?: string;

  /** Rule priority (lower number = evaluated first) */
  evaluationOrder: number;

  /** Conditions that must be met for this rule to apply */
  conditions: RoutingCondition[];

  /** Logical operator for combining conditions */
  conditionOperator: 'and' | 'or';

  /** Actions to take when rule matches */
  actions: RoutingAction;

  /** Whether this rule is currently active */
  isActive: boolean;

  /** Schedule during which this rule applies (null = always) */
  schedule?: RuleSchedule;

  createdAt: Date;
  updatedAt: Date;
}

/** A single condition in a routing rule */
interface RoutingCondition {
  /** Field to evaluate */
  field: RoutingConditionField;

  /** Comparison operator */
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' |
            'greater_than' | 'less_than' | 'in' | 'not_in' | 'regex';

  /** Value to compare against */
  value: string | number | string[];
}

/** Fields available for routing conditions */
type RoutingConditionField =
  | 'channel'
  | 'customer.id'
  | 'customer.tier'
  | 'customer.language'
  | 'customer.segment'
  | 'interaction.type'
  | 'interaction.subject'
  | 'interaction.priority'
  | 'caller.ani'        // Automatic Number Identification (phone)
  | 'caller.dnis'       // Dialed Number Identification
  | 'ivr.selection'
  | 'ivr.intent'
  | 'time.hour'
  | 'time.day_of_week'
  | 'queue.wait_time'
  | 'queue.depth';

/** Actions applied when a routing rule matches */
interface RoutingAction {
  /** Target queue ID */
  targetQueueId: string;

  /** Priority adjustment (+/- from base) */
  priorityAdjustment?: number;

  /** Override required skills */
  skillOverrides?: QueueSkillRequirement[];

  /** Tags to add to the interaction */
  addTags?: string[];

  /** Whisper message to play to the agent */
  agentWhisper?: string;

  /** Custom metadata to attach */
  metadata?: Record<string, unknown>;
}

/** The result of routing engine evaluation */
interface RoutingDecision {
  interactionId: string;
  matchedRuleId?: string;
  targetQueueId: string;
  assignedAgentId?: string;
  priority: number;
  requiredSkills: string[];
  estimatedWaitSeconds: number;
  routingStrategy: RoutingStrategy;
  decisionTimestamp: Date;
  decisionDurationMs: number;
}
```

### Interaction

```typescript
/**
 * An interaction represents a single customer contact — a phone call,
 * chat session, email, or social media conversation. It is the atomic
 * unit of work in the contact center.
 */
interface Interaction {
  id: string;
  tenantId: string;

  /** Channel through which this interaction arrived */
  channel: InteractionChannel;

  /** Current status */
  status: InteractionStatus;

  /** Direction: inbound or outbound */
  direction: 'inbound' | 'outbound';

  /** Customer identifier (from CRM or anonymous) */
  customerId?: string;

  /** Customer's display name */
  customerName?: string;

  /** Customer's contact info for this channel */
  customerContact: string; // phone number, email, chat handle, etc.

  /** Currently assigned agent ID */
  agentId?: string;

  /** Queue ID this interaction is/was in */
  queueId?: string;

  /** Priority level */
  priority: number;

  /** Subject or topic */
  subject?: string;

  /** IVR selections made before reaching agent */
  ivrPath?: string[];

  /** Skills required for this interaction */
  requiredSkills: string[];

  /** Disposition code selected by agent */
  dispositionCode?: string;

  /** Wrap-up notes from agent */
  wrapUpNotes?: string;

  /** Tags applied to this interaction */
  tags: string[];

  /** Segments (transfers, holds, conferences) within this interaction */
  segments: InteractionSegment[];

  /** Timestamps */
  createdAt: Date;
  queuedAt?: Date;
  answeredAt?: Date;
  completedAt?: Date;

  /** Duration metrics (in seconds) */
  waitTimeSeconds?: number;
  handleTimeSeconds?: number;
  holdTimeSeconds?: number;
  wrapUpTimeSeconds?: number;
  talkTimeSeconds?: number;

  /** Whether this was a first-contact resolution */
  isFirstContactResolution?: boolean;

  /** Transfer count */
  transferCount: number;

  /** Associated recording IDs */
  recordingIds: string[];

  /** External reference (e.g., Twilio call SID) */
  externalRef?: string;

  metadata: Record<string, unknown>;
}

/** Interaction channels */
type InteractionChannel = 'voice' | 'chat' | 'email' | 'sms' | 'social_facebook' |
                          'social_twitter' | 'social_instagram' | 'social_whatsapp' | 'video';

/** Interaction status lifecycle */
enum InteractionStatus {
  /** Just created, not yet queued */
  Initiated = 'initiated',
  /** In IVR flow */
  InIVR = 'in_ivr',
  /** Waiting in queue */
  Queued = 'queued',
  /** Offered to an agent, awaiting acceptance */
  Offered = 'offered',
  /** Connected to an agent */
  Connected = 'connected',
  /** On hold */
  OnHold = 'on_hold',
  /** Being transferred */
  Transferring = 'transferring',
  /** In conference with multiple parties */
  Conference = 'conference',
  /** Agent is in wrap-up */
  WrapUp = 'wrap_up',
  /** Interaction completed normally */
  Completed = 'completed',
  /** Customer abandoned while waiting */
  Abandoned = 'abandoned',
  /** Interaction failed (technical error) */
  Failed = 'failed',
}

/** A segment within an interaction (transfer, hold, conference leg) */
interface InteractionSegment {
  id: string;
  interactionId: string;

  /** Segment type */
  type: 'initial' | 'transfer_warm' | 'transfer_cold' | 'conference' | 'hold' | 'ivr';

  /** Agent handling this segment */
  agentId?: string;

  /** Queue ID for this segment */
  queueId?: string;

  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;

  /** For transfers: who initiated it */
  initiatedBy?: string;

  /** For transfers: reason */
  transferReason?: string;
}
```

### Supervisor

```typescript
/**
 * Supervisor capabilities for monitoring and managing
 * contact center operations in real-time.
 */
interface Supervisor {
  id: string;
  tenantId: string;
  userId: string;
  displayName: string;

  /** Queues this supervisor can monitor */
  monitoredQueueIds: string[];

  /** Teams this supervisor manages */
  managedTeamIds: string[];

  /** Permissions */
  permissions: SupervisorPermissions;
}

interface SupervisorPermissions {
  canMonitorCalls: boolean;
  canWhisper: boolean;
  canBarge: boolean;
  canForceLogout: boolean;
  canChangeAgentState: boolean;
  canModifyQueues: boolean;
  canViewReports: boolean;
  canManageSchedules: boolean;
  canEvaluateQuality: boolean;
}

/** A live monitoring session */
interface MonitorSession {
  id: string;
  supervisorId: string;
  interactionId: string;
  agentId: string;
  tenantId: string;

  /** Monitor mode */
  mode: 'silent' | 'whisper' | 'barge';

  startedAt: Date;
  endedAt?: Date;
}

/** Actions a supervisor can perform */
interface SupervisorAction {
  id: string;
  supervisorId: string;
  tenantId: string;
  actionType: SupervisorActionType;
  targetType: 'agent' | 'queue' | 'interaction';
  targetId: string;
  reason?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

enum SupervisorActionType {
  ForceLogout = 'force_logout',
  ChangeState = 'change_state',
  StartMonitor = 'start_monitor',
  StopMonitor = 'stop_monitor',
  Whisper = 'whisper',
  Barge = 'barge',
  ForceTransfer = 'force_transfer',
  QueuePause = 'queue_pause',
  QueueResume = 'queue_resume',
  OverrideRouting = 'override_routing',
  SendBroadcast = 'send_broadcast',
}
```

### WFM (Workforce Management)

```typescript
/**
 * Workforce management forecast — predicts interaction volumes
 * and staffing requirements for a given time period.
 */
interface WFMForecast {
  id: string;
  tenantId: string;

  /** Forecast name/label */
  name: string;

  /** Queue or queue group this forecast covers */
  queueId?: string;
  queueGroupId?: string;

  /** Channel this forecast is for (null = all channels) */
  channel?: InteractionChannel;

  /** Forecast period */
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD

  /** Interval granularity in minutes (15 or 30) */
  intervalMinutes: 15 | 30;

  /** Forecast method used */
  method: 'erlang_c' | 'historical_average' | 'weighted_moving_average' | 'regression';

  /** Forecast data points */
  intervals: ForecastInterval[];

  /** SLA target used for staffing calculation */
  slaTarget: QueueSLA;

  /** Shrinkage factor (0-1, e.g., 0.3 = 30% shrinkage) */
  shrinkageFactor: number;

  /** Model accuracy metrics */
  accuracy?: {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
  };

  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A single interval in a forecast */
interface ForecastInterval {
  /** Interval start time (ISO 8601) */
  startTime: string;

  /** Predicted interaction volume */
  predictedVolume: number;

  /** Predicted average handle time in seconds */
  predictedAHTSeconds: number;

  /** Required staff (from Erlang-C or other model) */
  requiredStaff: number;

  /** Required staff adjusted for shrinkage */
  requiredStaffAdjusted: number;

  /** Scheduled staff (filled in after scheduling) */
  scheduledStaff?: number;

  /** Predicted service level at scheduled staff */
  predictedServiceLevel?: number;
}

/** WFM schedule for an agent */
interface WFMSchedule {
  id: string;
  tenantId: string;
  agentId: string;

  /** Week start date */
  weekStartDate: string; // YYYY-MM-DD

  /** Daily schedules */
  days: AgentSchedule[];

  /** Total scheduled hours for the week */
  totalHours: number;

  /** Overtime hours included */
  overtimeHours: number;

  status: 'draft' | 'published' | 'acknowledged';
  publishedAt?: Date;
  acknowledgedAt?: Date;
}

/** Real-time adherence record */
interface WFMAdherenceRecord {
  id: string;
  agentId: string;
  tenantId: string;

  /** What the agent was scheduled to be doing */
  scheduledActivity: string;

  /** What the agent is actually doing */
  actualActivity: string;

  /** Adherence status */
  status: AdherenceStatus;

  /** Duration of this adherence state in seconds */
  durationSeconds: number;

  /** Timestamp of the adherence observation */
  timestamp: Date;
}

enum AdherenceStatus {
  /** Agent is doing what they're scheduled to do */
  InAdherence = 'in_adherence',
  /** Agent is doing something different than scheduled */
  OutOfAdherence = 'out_of_adherence',
  /** Agent is on a permitted exception (approved break extension, etc.) */
  Exception = 'exception',
}

/** Erlang-C calculation inputs */
interface ErlangCInput {
  /** Interactions per interval */
  volume: number;
  /** Average handle time in seconds */
  ahtSeconds: number;
  /** Interval duration in seconds */
  intervalSeconds: number;
  /** Target answer time in seconds */
  targetAnswerTimeSeconds: number;
  /** Target service level percentage (0-1) */
  targetServiceLevel: number;
}

/** Erlang-C calculation result */
interface ErlangCResult {
  /** Minimum agents needed to meet SLA */
  requiredAgents: number;
  /** Predicted service level at that staffing */
  serviceLevel: number;
  /** Predicted average speed of answer in seconds */
  averageSpeedOfAnswer: number;
  /** Predicted probability of waiting */
  probabilityOfWaiting: number;
  /** Predicted average wait time in seconds */
  averageWaitTime: number;
  /** Traffic intensity (Erlangs) */
  trafficIntensity: number;
  /** Agent occupancy rate (0-1) */
  occupancy: number;
}
```

### Quality Assurance

```typescript
/**
 * A QA scorecard defines the rubric used to evaluate
 * agent interactions for quality.
 */
interface QAScorecard {
  id: string;
  tenantId: string;

  /** Scorecard name */
  name: string;

  /** Description of what this scorecard measures */
  description?: string;

  /** Version number (scorecards are versioned) */
  version: number;

  /** Sections within the scorecard */
  sections: QAScorecardSection[];

  /** Total possible points */
  totalPoints: number;

  /** Minimum passing score (percentage) */
  passingScorePercent: number;

  /** Channels this scorecard applies to */
  applicableChannels: InteractionChannel[];

  /** Whether this is the active version */
  isActive: boolean;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A section within a scorecard */
interface QAScorecardSection {
  id: string;
  name: string;
  weight: number; // percentage weight of total score
  items: QAScorecardItem[];
}

/** A single evaluation item within a section */
interface QAScorecardItem {
  id: string;
  label: string;
  description?: string;
  maxPoints: number;
  isAutoFail: boolean; // if failed, entire evaluation fails regardless of score
  scoringType: 'points' | 'yes_no' | 'scale_1_5' | 'scale_1_10';
}

/**
 * A completed QA evaluation of a specific interaction.
 */
interface QAEvaluation {
  id: string;
  tenantId: string;
  scorecardId: string;
  scorecardVersion: number;
  interactionId: string;
  agentId: string;
  evaluatorId: string;

  /** Individual item scores */
  items: QAEvaluationItem[];

  /** Total score (points) */
  totalScore: number;

  /** Total score (percentage) */
  scorePercent: number;

  /** Whether the evaluation passed */
  passed: boolean;

  /** Whether an auto-fail item was triggered */
  hasAutoFail: boolean;

  /** Evaluator's overall comments */
  comments?: string;

  /** Agent's dispute/response */
  agentResponse?: string;

  /** Calibration session this evaluation belongs to (if any) */
  calibrationSessionId?: string;

  status: EvaluationStatus;

  evaluatedAt: Date;
  disputedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

/** A scored item within an evaluation */
interface QAEvaluationItem {
  scorecardItemId: string;
  score: number;
  maxPoints: number;
  comments?: string;
  isAutoFail: boolean;
  failTriggered: boolean;
}

enum EvaluationStatus {
  InProgress = 'in_progress',
  Completed = 'completed',
  Disputed = 'disputed',
  Resolved = 'resolved',
  Calibration = 'calibration',
}

/** A calibration session for QA consistency */
interface CalibrationSession {
  id: string;
  tenantId: string;
  name: string;
  interactionId: string;
  scorecardId: string;
  facilitatorId: string;

  /** Evaluator IDs participating */
  evaluatorIds: string[];

  /** Evaluations submitted for this session */
  evaluationIds: string[];

  /** Score variance statistics */
  scoreVariance?: {
    mean: number;
    standardDeviation: number;
    range: number;
    outlierEvaluatorIds: string[];
  };

  status: 'scheduled' | 'in_progress' | 'completed';
  scheduledAt: Date;
  completedAt?: Date;
}

/** A coaching plan based on QA evaluations */
interface CoachingPlan {
  id: string;
  tenantId: string;
  agentId: string;
  supervisorId: string;

  /** Evaluation IDs that prompted this plan */
  relatedEvaluationIds: string[];

  /** Areas for improvement */
  focusAreas: CoachingFocusArea[];

  /** Plan status */
  status: 'draft' | 'active' | 'completed' | 'cancelled';

  /** Target completion date */
  targetDate: string;

  /** Overall notes */
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

interface CoachingFocusArea {
  area: string;
  currentScore: number;
  targetScore: number;
  actionItems: string[];
  resources: string[];
  progress?: number; // 0-100
}
```

### IVR (Interactive Voice Response)

```typescript
/**
 * An IVR flow defines the automated menu tree that customers
 * navigate before reaching a live agent.
 */
interface IVRFlow {
  id: string;
  tenantId: string;

  /** Flow name */
  name: string;

  /** Description */
  description?: string;

  /** Version number */
  version: number;

  /** Entry point node ID */
  entryNodeId: string;

  /** All nodes in this flow */
  nodes: IVRNode[];

  /** Edges connecting nodes */
  edges: IVREdge[];

  /** Associated phone number(s) / channel entry points */
  entryPoints: IVREntryPoint[];

  /** Whether this is the active version */
  isActive: boolean;

  /** Whether this flow is published (vs. draft) */
  isPublished: boolean;

  /** Last published timestamp */
  publishedAt?: Date;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A node in the IVR flow */
interface IVRNode {
  id: string;
  flowId: string;

  /** Node type */
  type: IVRNodeType;

  /** Display label in the visual builder */
  label: string;

  /** Position in the visual builder canvas */
  position: { x: number; y: number };

  /** Node-specific configuration */
  config: IVRNodeConfig;
}

/** IVR node types */
type IVRNodeType =
  | 'start'           // Entry point
  | 'menu'            // DTMF menu ("Press 1 for...")
  | 'play_message'    // Play audio or TTS message
  | 'collect_digits'  // Collect DTMF input (e.g., account number)
  | 'speech_input'    // Speech recognition input
  | 'route_to_queue'  // Transfer to a queue
  | 'route_to_agent'  // Transfer to a specific agent
  | 'route_to_number' // Transfer to an external number
  | 'db_lookup'       // Database lookup (e.g., check account status)
  | 'api_call'        // External API integration
  | 'condition'       // Conditional branching
  | 'set_variable'    // Set a flow variable
  | 'time_check'      // Check current time against schedule
  | 'callback_offer'  // Offer callback to caller
  | 'voicemail'       // Send to voicemail
  | 'survey'          // Post-call survey
  | 'end'             // End the IVR flow (hang up)
  | 'subflow'         // Jump to another IVR flow
  ;

/** Node-type-specific configuration (union of configs) */
type IVRNodeConfig = {
  // Menu node
  prompt?: string;
  promptAudioUrl?: string;
  options?: Array<{ digit: string; label: string }>;
  timeout?: number;
  maxRetries?: number;
  invalidPrompt?: string;

  // Collect digits
  minDigits?: number;
  maxDigits?: number;
  terminationDigit?: string;

  // Speech input
  grammar?: string;
  language?: string;
  confidence?: number;
  hints?: string[];

  // Route to queue
  queueId?: string;
  priority?: number;
  skills?: string[];

  // Route to agent
  agentId?: string;

  // Route to number
  phoneNumber?: string;

  // DB lookup
  query?: string;
  connectionId?: string;
  resultVariable?: string;

  // API call
  url?: string;
  method?: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  body?: string;
  responseVariable?: string;

  // Condition
  expression?: string;

  // Set variable
  variableName?: string;
  variableValue?: string;

  // Time check
  scheduleId?: string;
  timezone?: string;

  // Callback offer
  callbackQueueId?: string;
  maxWaitThreshold?: number;

  // Play message
  message?: string;
  audioUrl?: string;
  ttsVoice?: string;

  // Survey
  surveyId?: string;

  // Subflow
  subflowId?: string;

  // Generic
  metadata?: Record<string, unknown>;
};

/** An edge connecting two IVR nodes */
interface IVREdge {
  id: string;
  flowId: string;
  sourceNodeId: string;
  targetNodeId: string;

  /** Condition that triggers this edge (e.g., "digit:1", "default", "timeout") */
  condition?: string;

  /** Label displayed on the edge in the visual builder */
  label?: string;

  /** Order for evaluation (lower = first) */
  order: number;
}

/** An entry point that triggers an IVR flow */
interface IVREntryPoint {
  type: 'phone_number' | 'sip_uri' | 'chat_widget' | 'api';
  value: string; // e.g., "+15551234567", "sip:support@company.com"
  label?: string;
}
```

### Wallboard

```typescript
/**
 * A wallboard configuration for displaying real-time contact
 * center KPIs on screens throughout the contact center floor.
 */
interface Wallboard {
  id: string;
  tenantId: string;

  /** Wallboard name */
  name: string;

  /** Description */
  description?: string;

  /** Layout grid dimensions */
  layout: {
    columns: number;
    rows: number;
  };

  /** Widgets displayed on this wallboard */
  widgets: WallboardWidget[];

  /** Refresh interval in milliseconds */
  refreshIntervalMs: number;

  /** Theme */
  theme: 'dark' | 'light' | 'high_contrast';

  /** Whether TV mode is enabled (auto-rotate pages, hide controls) */
  tvMode: boolean;

  /** Page rotation interval in seconds (for TV mode) */
  pageRotationSeconds?: number;

  /** Alert configuration */
  alerts: WallboardAlert[];

  /** Whether this wallboard is active */
  isActive: boolean;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A widget on the wallboard */
interface WallboardWidget {
  id: string;
  wallboardId: string;

  /** Widget type */
  type: WidgetType;

  /** Widget title */
  title: string;

  /** Grid position */
  position: { column: number; row: number; width: number; height: number };

  /** Widget-specific configuration */
  config: WallboardWidgetConfig;

  /** Page number (for multi-page wallboards) */
  page: number;
}

/** Widget types */
type WidgetType =
  | 'queue_depth'          // Number of callers waiting
  | 'agents_available'     // Count of available agents
  | 'agents_by_state'      // Agent state breakdown (pie/bar)
  | 'sla_gauge'            // SLA percentage gauge
  | 'average_wait_time'    // Average wait time display
  | 'average_handle_time'  // AHT display
  | 'longest_wait'         // Longest current wait
  | 'interactions_today'   // Total interactions handled today
  | 'abandoned_rate'       // Abandonment rate
  | 'fcr_rate'             // First-contact resolution rate
  | 'csat_score'           // Customer satisfaction score
  | 'agent_leaderboard'    // Top agents by metrics
  | 'queue_table'          // Table of queue stats
  | 'ticker'               // Scrolling text ticker (announcements)
  | 'clock'                // Current time display
  | 'chart_line'           // Line chart (trend over time)
  | 'chart_bar'            // Bar chart
  | 'custom_metric'        // Custom metric from reporting API
  ;

/** Widget configuration (varies by type) */
interface WallboardWidgetConfig {
  /** Queue IDs to display data for (null = all) */
  queueIds?: string[];

  /** Team IDs to filter agents */
  teamIds?: string[];

  /** Time range for historical widgets */
  timeRange?: 'today' | 'this_hour' | 'last_30_min' | 'this_week';

  /** Thresholds for color coding */
  thresholds?: {
    warning: number;
    critical: number;
    direction: 'above' | 'below'; // "above" = critical when value > threshold
  };

  /** Chart-specific config */
  chartConfig?: {
    dataPoints: number;
    intervalMinutes: number;
    showTrend: boolean;
  };

  /** Ticker text content */
  tickerMessages?: string[];
  tickerSpeed?: 'slow' | 'medium' | 'fast';

  /** Metric name for custom_metric type */
  metricName?: string;

  /** Number formatting */
  format?: 'number' | 'percentage' | 'duration' | 'currency';
  decimalPlaces?: number;
}

/** Alert configuration for wallboard */
interface WallboardAlert {
  id: string;
  metric: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  queueId?: string;

  /** Visual alert */
  flashScreen: boolean;
  borderColor?: string;

  /** Audio alert */
  playSound: boolean;
  soundUrl?: string;

  /** Duration to show alert in seconds */
  durationSeconds: number;
}
```

### Customer Feedback

```typescript
/**
 * Post-interaction survey configuration.
 */
interface InteractionSurvey {
  id: string;
  tenantId: string;

  /** Survey name */
  name: string;

  /** Survey type */
  type: SurveyType;

  /** Questions in the survey */
  questions: SurveyQuestion[];

  /** Channels this survey is offered on */
  channels: InteractionChannel[];

  /** Queues this survey applies to (null = all) */
  queueIds?: string[];

  /** Sampling rate (0-1, e.g., 0.5 = 50% of interactions) */
  samplingRate: number;

  /** Delay before sending survey (seconds) */
  delaySeconds: number;

  /** Survey expiration (hours after interaction) */
  expirationHours: number;

  /** Whether the survey is active */
  isActive: boolean;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

enum SurveyType {
  CSAT = 'csat',        // Customer Satisfaction (1-5 scale)
  NPS = 'nps',          // Net Promoter Score (0-10 scale)
  CES = 'ces',          // Customer Effort Score (1-7 scale)
  Custom = 'custom',    // Custom survey
}

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'rating' | 'scale' | 'text' | 'yes_no' | 'multiple_choice';
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  order: number;
}

/** A completed survey response */
interface SurveyResponse {
  id: string;
  surveyId: string;
  interactionId: string;
  agentId: string;
  customerId?: string;
  tenantId: string;

  /** Answers keyed by question ID */
  answers: Record<string, SurveyAnswer>;

  /** Calculated scores */
  csatScore?: number;     // 1-5
  npsScore?: number;      // 0-10
  cesScore?: number;      // 1-7

  /** NPS category */
  npsCategory?: 'promoter' | 'passive' | 'detractor';

  /** Response channel */
  responseChannel: InteractionChannel;

  submittedAt: Date;
}

interface SurveyAnswer {
  questionId: string;
  value: string | number;
  textResponse?: string;
}
```

### ContactCenterService (Main Facade)

```typescript
/**
 * The primary service facade for the contact center module.
 * Coordinates between agents, queues, routing, and all subsystems.
 */
interface ContactCenterService {
  // ── Agent Operations ────────────────────────────────────
  getAgent(agentId: string): Promise<Agent>;
  listAgents(filters: AgentFilters): Promise<PaginatedResult<Agent>>;
  createAgent(input: CreateAgentInput): Promise<Agent>;
  updateAgent(agentId: string, input: UpdateAgentInput): Promise<Agent>;
  setAgentState(agentId: string, state: AgentAvailability, reason?: string): Promise<void>;
  getAgentSkills(agentId: string): Promise<AgentSkill[]>;
  updateAgentSkills(agentId: string, skills: AgentSkill[]): Promise<void>;
  getAgentStats(agentId: string, dateRange: DateRange): Promise<AgentPerformanceStats>;

  // ── Queue Operations ────────────────────────────────────
  getQueue(queueId: string): Promise<Queue>;
  listQueues(filters?: QueueFilters): Promise<Queue[]>;
  createQueue(input: CreateQueueInput): Promise<Queue>;
  updateQueue(queueId: string, input: UpdateQueueInput): Promise<Queue>;
  getQueueStats(queueId: string): Promise<QueueStats>;
  getAllQueueStats(): Promise<QueueStats[]>;
  getQueueEntries(queueId: string): Promise<QueueEntry[]>;

  // ── Interaction Operations ──────────────────────────────
  createInteraction(input: CreateInteractionInput): Promise<Interaction>;
  getInteraction(interactionId: string): Promise<Interaction>;
  routeInteraction(interactionId: string): Promise<RoutingDecision>;
  transferInteraction(interactionId: string, input: TransferInput): Promise<void>;
  completeInteraction(interactionId: string, input: CompleteInput): Promise<void>;

  // ── Routing ─────────────────────────────────────────────
  getRoutingRules(): Promise<RoutingRule[]>;
  createRoutingRule(input: CreateRoutingRuleInput): Promise<RoutingRule>;
  updateRoutingRule(ruleId: string, input: UpdateRoutingRuleInput): Promise<RoutingRule>;
  evaluateRouting(interaction: Interaction): Promise<RoutingDecision>;

  // ── Supervisor ──────────────────────────────────────────
  startMonitoring(supervisorId: string, interactionId: string, mode: MonitorMode): Promise<MonitorSession>;
  stopMonitoring(sessionId: string): Promise<void>;
  bargeIn(supervisorId: string, interactionId: string): Promise<void>;
  whisper(supervisorId: string, interactionId: string, message: string): Promise<void>;
  forceAgentState(supervisorId: string, agentId: string, state: AgentAvailability): Promise<void>;
  broadcastMessage(supervisorId: string, teamIds: string[], message: string): Promise<void>;

  // ── WFM ─────────────────────────────────────────────────
  generateForecast(input: GenerateForecastInput): Promise<WFMForecast>;
  getForecast(forecastId: string): Promise<WFMForecast>;
  generateSchedules(forecastId: string, options: ScheduleOptions): Promise<WFMSchedule[]>;
  getAgentSchedule(agentId: string, weekStart: string): Promise<WFMSchedule>;
  getAdherence(agentId: string): Promise<WFMAdherenceRecord>;
  getTeamAdherence(teamId: string): Promise<WFMAdherenceRecord[]>;

  // ── Quality Assurance ───────────────────────────────────
  getScorecards(): Promise<QAScorecard[]>;
  createScorecard(input: CreateScorecardInput): Promise<QAScorecard>;
  submitEvaluation(input: SubmitEvaluationInput): Promise<QAEvaluation>;
  getEvaluation(evaluationId: string): Promise<QAEvaluation>;
  getAgentEvaluations(agentId: string, dateRange: DateRange): Promise<QAEvaluation[]>;
  createCalibrationSession(input: CreateCalibrationInput): Promise<CalibrationSession>;
  createCoachingPlan(input: CreateCoachingPlanInput): Promise<CoachingPlan>;

  // ── IVR ─────────────────────────────────────────────────
  getIVRFlow(flowId: string): Promise<IVRFlow>;
  listIVRFlows(): Promise<IVRFlow[]>;
  createIVRFlow(input: CreateIVRFlowInput): Promise<IVRFlow>;
  updateIVRFlow(flowId: string, input: UpdateIVRFlowInput): Promise<IVRFlow>;
  publishIVRFlow(flowId: string): Promise<IVRFlow>;
  executeIVRNode(flowId: string, nodeId: string, context: IVRContext): Promise<IVRExecutionResult>;

  // ── Wallboard ───────────────────────────────────────────
  getWallboard(wallboardId: string): Promise<Wallboard>;
  listWallboards(): Promise<Wallboard[]>;
  createWallboard(input: CreateWallboardInput): Promise<Wallboard>;
  updateWallboard(wallboardId: string, input: UpdateWallboardInput): Promise<Wallboard>;
  getWallboardData(wallboardId: string): Promise<WallboardData>;

  // ── Feedback ────────────────────────────────────────────
  getSurvey(surveyId: string): Promise<InteractionSurvey>;
  listSurveys(): Promise<InteractionSurvey[]>;
  createSurvey(input: CreateSurveyInput): Promise<InteractionSurvey>;
  submitSurveyResponse(input: SubmitSurveyResponseInput): Promise<SurveyResponse>;
  getSurveyResults(surveyId: string, dateRange: DateRange): Promise<SurveyResultsAggregate>;

  // ── Reporting ───────────────────────────────────────────
  getAgentPerformanceReport(filters: ReportFilters): Promise<AgentPerformanceReport>;
  getQueueMetricsReport(filters: ReportFilters): Promise<QueueMetricsReport>;
  getSLAComplianceReport(filters: ReportFilters): Promise<SLAComplianceReport>;
  getFCRReport(filters: ReportFilters): Promise<FCRReport>;
  getAHTReport(filters: ReportFilters): Promise<AHTReport>;
  getAbandonmentReport(filters: ReportFilters): Promise<AbandonmentReport>;
  exportReport(reportType: string, filters: ReportFilters, format: 'csv' | 'xlsx' | 'pdf'): Promise<string>;
}
```

---

## Database Schemas

### agents

```sql
CREATE TABLE agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  user_id       UUID NOT NULL REFERENCES users(id),
  display_name  TEXT NOT NULL,
  email         TEXT NOT NULL,
  availability  TEXT NOT NULL DEFAULT 'offline'
                  CHECK (availability IN ('available', 'busy', 'away', 'wrap_up', 'offline')),
  availability_reason TEXT,
  enabled_channels    TEXT[] NOT NULL DEFAULT '{}',
  concurrency_limits  JSONB NOT NULL DEFAULT '{"voice": 1, "chat": 3, "email": 5}',
  active_interactions JSONB NOT NULL DEFAULT '{"voice": 0, "chat": 0, "email": 0}',
  team_id       UUID REFERENCES teams(id),
  supervisor_id UUID REFERENCES agents(id),
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  is_logged_in  BOOLEAN NOT NULL DEFAULT FALSE,
  last_available_at   TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ,
  last_heartbeat_at   TIMESTAMPTZ,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, user_id),
  UNIQUE (tenant_id, email)
);

-- RLS Policy
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY agents_tenant_isolation ON agents
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Indexes
CREATE INDEX idx_agents_tenant_avail ON agents(tenant_id, availability);
CREATE INDEX idx_agents_tenant_team ON agents(tenant_id, team_id);
CREATE INDEX idx_agents_supervisor ON agents(tenant_id, supervisor_id);
CREATE INDEX idx_agents_last_available ON agents(tenant_id, last_available_at);
```

### agent_skills

```sql
CREATE TABLE agent_skills (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  skill_id      UUID NOT NULL,
  skill_name    TEXT NOT NULL,
  proficiency   INTEGER NOT NULL CHECK (proficiency BETWEEN 1 AND 10),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (agent_id, skill_id)
);

ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_skills_tenant_isolation ON agent_skills
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_agent_skills_agent ON agent_skills(agent_id);
CREATE INDEX idx_agent_skills_skill ON agent_skills(tenant_id, skill_id, proficiency);
```

### agent_schedules

```sql
CREATE TABLE agent_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  schedule_date DATE NOT NULL,
  shift_start   TIMESTAMPTZ NOT NULL,
  shift_end     TIMESTAMPTZ NOT NULL,
  activities    JSONB NOT NULL DEFAULT '[]',
  acknowledged  BOOLEAN NOT NULL DEFAULT FALSE,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'published', 'acknowledged', 'modified')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (agent_id, schedule_date),
  CHECK (shift_end > shift_start)
);

ALTER TABLE agent_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_schedules_tenant_isolation ON agent_schedules
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_agent_schedules_date ON agent_schedules(tenant_id, schedule_date);
CREATE INDEX idx_agent_schedules_agent_date ON agent_schedules(agent_id, schedule_date);
```

### queues

```sql
CREATE TABLE queues (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  name              TEXT NOT NULL,
  description       TEXT,
  routing_strategy  TEXT NOT NULL DEFAULT 'longest_idle'
                      CHECK (routing_strategy IN (
                        'longest_idle', 'most_skilled', 'least_loaded',
                        'round_robin', 'priority_skill', 'predictive'
                      )),
  required_skills   JSONB NOT NULL DEFAULT '[]',
  sla_config        JSONB NOT NULL DEFAULT '{
    "targetAnswerTimeSeconds": 20,
    "targetPercentage": 80,
    "warningThresholdSeconds": 15,
    "criticalThresholdSeconds": 30
  }',
  priority          INTEGER NOT NULL DEFAULT 5,
  max_depth         INTEGER NOT NULL DEFAULT 100,
  overflow_config   JSONB,
  callback_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  callback_threshold_seconds INTEGER,
  channels          TEXT[] NOT NULL DEFAULT '{voice, chat, email}',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  operating_hours   JSONB,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, name)
);

ALTER TABLE queues ENABLE ROW LEVEL SECURITY;
CREATE POLICY queues_tenant_isolation ON queues
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_queues_tenant_active ON queues(tenant_id, is_active);
```

### queue_entries

```sql
CREATE TABLE queue_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id          UUID NOT NULL REFERENCES queues(id),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  interaction_id    UUID NOT NULL,
  priority          INTEGER NOT NULL DEFAULT 5,
  enqueued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  position          INTEGER NOT NULL,
  estimated_wait_seconds INTEGER,
  is_offered        BOOLEAN NOT NULL DEFAULT FALSE,
  offer_attempts    INTEGER NOT NULL DEFAULT 0,
  requested_skills  TEXT[] NOT NULL DEFAULT '{}',
  customer_id       TEXT,
  channel           TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'waiting'
                      CHECK (status IN (
                        'waiting', 'offered', 'connected', 'abandoned',
                        'overflowed', 'callback_scheduled'
                      )),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY queue_entries_tenant_isolation ON queue_entries
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_queue_entries_queue_status ON queue_entries(queue_id, status);
CREATE INDEX idx_queue_entries_queue_priority ON queue_entries(queue_id, priority DESC, enqueued_at ASC);
CREATE INDEX idx_queue_entries_interaction ON queue_entries(interaction_id);
```

### routing_rules

```sql
CREATE TABLE routing_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  name              TEXT NOT NULL,
  description       TEXT,
  evaluation_order  INTEGER NOT NULL,
  conditions        JSONB NOT NULL DEFAULT '[]',
  condition_operator TEXT NOT NULL DEFAULT 'and'
                      CHECK (condition_operator IN ('and', 'or')),
  actions           JSONB NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  schedule          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, name)
);

ALTER TABLE routing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY routing_rules_tenant_isolation ON routing_rules
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_routing_rules_order ON routing_rules(tenant_id, evaluation_order, is_active);
```

### interactions

```sql
CREATE TABLE interactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  channel           TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'initiated'
                      CHECK (status IN (
                        'initiated', 'in_ivr', 'queued', 'offered', 'connected',
                        'on_hold', 'transferring', 'conference', 'wrap_up',
                        'completed', 'abandoned', 'failed'
                      )),
  direction         TEXT NOT NULL DEFAULT 'inbound'
                      CHECK (direction IN ('inbound', 'outbound')),
  customer_id       TEXT,
  customer_name     TEXT,
  customer_contact  TEXT NOT NULL,
  agent_id          UUID REFERENCES agents(id),
  queue_id          UUID REFERENCES queues(id),
  priority          INTEGER NOT NULL DEFAULT 5,
  subject           TEXT,
  ivr_path          TEXT[],
  required_skills   TEXT[] NOT NULL DEFAULT '{}',
  disposition_code  TEXT,
  wrap_up_notes     TEXT,
  tags              TEXT[] NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  queued_at         TIMESTAMPTZ,
  answered_at       TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  wait_time_seconds       INTEGER,
  handle_time_seconds     INTEGER,
  hold_time_seconds       INTEGER,
  wrap_up_time_seconds    INTEGER,
  talk_time_seconds       INTEGER,
  is_first_contact_resolution BOOLEAN,
  transfer_count    INTEGER NOT NULL DEFAULT 0,
  recording_ids     TEXT[] NOT NULL DEFAULT '{}',
  external_ref      TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}',

  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY interactions_tenant_isolation ON interactions
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_interactions_tenant_status ON interactions(tenant_id, status);
CREATE INDEX idx_interactions_agent ON interactions(agent_id, created_at);
CREATE INDEX idx_interactions_queue ON interactions(queue_id, status);
CREATE INDEX idx_interactions_customer ON interactions(tenant_id, customer_id, created_at);
CREATE INDEX idx_interactions_created ON interactions(tenant_id, created_at);
CREATE INDEX idx_interactions_channel ON interactions(tenant_id, channel, status);
```

### interaction_segments

```sql
CREATE TABLE interaction_segments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id  UUID NOT NULL REFERENCES interactions(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  type            TEXT NOT NULL
                    CHECK (type IN ('initial', 'transfer_warm', 'transfer_cold', 'conference', 'hold', 'ivr')),
  agent_id        UUID REFERENCES agents(id),
  queue_id        UUID REFERENCES queues(id),
  start_time      TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time        TIMESTAMPTZ,
  duration_seconds INTEGER,
  initiated_by    TEXT,
  transfer_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE interaction_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY segments_tenant_isolation ON interaction_segments
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_segments_interaction ON interaction_segments(interaction_id);
```

### qa_scorecards

```sql
CREATE TABLE qa_scorecards (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  name              TEXT NOT NULL,
  description       TEXT,
  version           INTEGER NOT NULL DEFAULT 1,
  sections          JSONB NOT NULL DEFAULT '[]',
  total_points      INTEGER NOT NULL,
  passing_score_pct NUMERIC(5,2) NOT NULL DEFAULT 70.00,
  applicable_channels TEXT[] NOT NULL DEFAULT '{voice, chat, email}',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_by        UUID NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, name, version)
);

ALTER TABLE qa_scorecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_scorecards_tenant_isolation ON qa_scorecards
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### qa_evaluations

```sql
CREATE TABLE qa_evaluations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  scorecard_id        UUID NOT NULL REFERENCES qa_scorecards(id),
  scorecard_version   INTEGER NOT NULL,
  interaction_id      UUID NOT NULL REFERENCES interactions(id),
  agent_id            UUID NOT NULL REFERENCES agents(id),
  evaluator_id        UUID NOT NULL,
  items               JSONB NOT NULL DEFAULT '[]',
  total_score         NUMERIC(10,2) NOT NULL,
  score_percent       NUMERIC(5,2) NOT NULL,
  passed              BOOLEAN NOT NULL,
  has_auto_fail       BOOLEAN NOT NULL DEFAULT FALSE,
  comments            TEXT,
  agent_response      TEXT,
  calibration_session_id UUID,
  status              TEXT NOT NULL DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress', 'completed', 'disputed', 'resolved', 'calibration')),
  evaluated_at        TIMESTAMPTZ,
  disputed_at         TIMESTAMPTZ,
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE qa_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_evaluations_tenant_isolation ON qa_evaluations
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_qa_evaluations_agent ON qa_evaluations(agent_id, evaluated_at);
CREATE INDEX idx_qa_evaluations_interaction ON qa_evaluations(interaction_id);
CREATE INDEX idx_qa_evaluations_scorecard ON qa_evaluations(scorecard_id);
CREATE INDEX idx_qa_evaluations_evaluator ON qa_evaluations(evaluator_id, evaluated_at);
```

### ivr_flows

```sql
CREATE TABLE ivr_flows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  name            TEXT NOT NULL,
  description     TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  entry_node_id   UUID,
  entry_points    JSONB NOT NULL DEFAULT '[]',
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, name, version)
);

ALTER TABLE ivr_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY ivr_flows_tenant_isolation ON ivr_flows
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### ivr_nodes

```sql
CREATE TABLE ivr_nodes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id     UUID NOT NULL REFERENCES ivr_flows(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  type        TEXT NOT NULL
                CHECK (type IN (
                  'start', 'menu', 'play_message', 'collect_digits', 'speech_input',
                  'route_to_queue', 'route_to_agent', 'route_to_number',
                  'db_lookup', 'api_call', 'condition', 'set_variable',
                  'time_check', 'callback_offer', 'voicemail', 'survey',
                  'end', 'subflow'
                )),
  label       TEXT NOT NULL,
  position    JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  config      JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ivr_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY ivr_nodes_tenant_isolation ON ivr_nodes
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_ivr_nodes_flow ON ivr_nodes(flow_id);
```

### wallboard_configs

```sql
CREATE TABLE wallboard_configs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  name                TEXT NOT NULL,
  description         TEXT,
  layout              JSONB NOT NULL DEFAULT '{"columns": 4, "rows": 3}',
  widgets             JSONB NOT NULL DEFAULT '[]',
  refresh_interval_ms INTEGER NOT NULL DEFAULT 5000,
  theme               TEXT NOT NULL DEFAULT 'dark'
                        CHECK (theme IN ('dark', 'light', 'high_contrast')),
  tv_mode             BOOLEAN NOT NULL DEFAULT FALSE,
  page_rotation_secs  INTEGER,
  alerts              JSONB NOT NULL DEFAULT '[]',
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_by          UUID NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, name)
);

ALTER TABLE wallboard_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallboard_configs_tenant_isolation ON wallboard_configs
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### interaction_surveys

```sql
CREATE TABLE interaction_surveys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('csat', 'nps', 'ces', 'custom')),
  questions       JSONB NOT NULL DEFAULT '[]',
  channels        TEXT[] NOT NULL DEFAULT '{voice, chat, email}',
  queue_ids       UUID[],
  sampling_rate   NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (sampling_rate BETWEEN 0 AND 1),
  delay_seconds   INTEGER NOT NULL DEFAULT 0,
  expiration_hours INTEGER NOT NULL DEFAULT 48,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, name)
);

ALTER TABLE interaction_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY surveys_tenant_isolation ON interaction_surveys
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### survey_responses

```sql
CREATE TABLE survey_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id       UUID NOT NULL REFERENCES interaction_surveys(id),
  interaction_id  UUID NOT NULL REFERENCES interactions(id),
  agent_id        UUID NOT NULL REFERENCES agents(id),
  customer_id     TEXT,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  answers         JSONB NOT NULL DEFAULT '{}',
  csat_score      NUMERIC(3,1),
  nps_score       INTEGER CHECK (nps_score BETWEEN 0 AND 10),
  ces_score       NUMERIC(3,1),
  nps_category    TEXT CHECK (nps_category IN ('promoter', 'passive', 'detractor')),
  response_channel TEXT NOT NULL,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY survey_responses_tenant_isolation ON survey_responses
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id, submitted_at);
CREATE INDEX idx_survey_responses_agent ON survey_responses(agent_id, submitted_at);
CREATE INDEX idx_survey_responses_interaction ON survey_responses(interaction_id);
```

### wfm_forecasts

```sql
CREATE TABLE wfm_forecasts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  name              TEXT NOT NULL,
  queue_id          UUID REFERENCES queues(id),
  queue_group_id    UUID,
  channel           TEXT,
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  interval_minutes  INTEGER NOT NULL DEFAULT 30 CHECK (interval_minutes IN (15, 30)),
  method            TEXT NOT NULL DEFAULT 'erlang_c'
                      CHECK (method IN ('erlang_c', 'historical_average', 'weighted_moving_average', 'regression')),
  intervals         JSONB NOT NULL DEFAULT '[]',
  sla_target        JSONB NOT NULL,
  shrinkage_factor  NUMERIC(3,2) NOT NULL DEFAULT 0.30,
  accuracy          JSONB,
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'published', 'archived')),
  created_by        UUID NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (end_date >= start_date)
);

ALTER TABLE wfm_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY wfm_forecasts_tenant_isolation ON wfm_forecasts
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_wfm_forecasts_dates ON wfm_forecasts(tenant_id, start_date, end_date);
```

### wfm_adherence_log

```sql
CREATE TABLE wfm_adherence_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            UUID NOT NULL REFERENCES agents(id),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  scheduled_activity  TEXT NOT NULL,
  actual_activity     TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('in_adherence', 'out_of_adherence', 'exception')),
  duration_seconds    INTEGER NOT NULL DEFAULT 0,
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE wfm_adherence_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY adherence_tenant_isolation ON wfm_adherence_log
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE INDEX idx_adherence_agent_time ON wfm_adherence_log(agent_id, timestamp);
CREATE INDEX idx_adherence_tenant_time ON wfm_adherence_log(tenant_id, timestamp);
CREATE INDEX idx_adherence_status ON wfm_adherence_log(tenant_id, status, timestamp);
```

### Drizzle ORM Schema Definition

```typescript
import {
  pgTable, uuid, text, integer, boolean, timestamp,
  jsonb, numeric, date, uniqueIndex, index, check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── Agents ────────────────────────────────────────────────────

export const agents = pgTable('agents', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  tenantId:           uuid('tenant_id').notNull().references(() => tenants.id),
  userId:             uuid('user_id').notNull().references(() => users.id),
  displayName:        text('display_name').notNull(),
  email:              text('email').notNull(),
  availability:       text('availability').notNull().default('offline'),
  availabilityReason: text('availability_reason'),
  enabledChannels:    text('enabled_channels').array().notNull().default(sql`'{}'`),
  concurrencyLimits:  jsonb('concurrency_limits').notNull().default({ voice: 1, chat: 3, email: 5 }),
  activeInteractions: jsonb('active_interactions').notNull().default({ voice: 0, chat: 0, email: 0 }),
  teamId:             uuid('team_id'),
  supervisorId:       uuid('supervisor_id'),
  timezone:           text('timezone').notNull().default('UTC'),
  isLoggedIn:         boolean('is_logged_in').notNull().default(false),
  lastAvailableAt:    timestamp('last_available_at', { withTimezone: true }),
  lastInteractionAt:  timestamp('last_interaction_at', { withTimezone: true }),
  lastHeartbeatAt:    timestamp('last_heartbeat_at', { withTimezone: true }),
  metadata:           jsonb('metadata').notNull().default({}),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUserUnique:  uniqueIndex('agents_tenant_user_idx').on(table.tenantId, table.userId),
  tenantEmailUnique: uniqueIndex('agents_tenant_email_idx').on(table.tenantId, table.email),
  tenantAvailIdx:    index('idx_agents_tenant_avail').on(table.tenantId, table.availability),
  tenantTeamIdx:     index('idx_agents_tenant_team').on(table.tenantId, table.teamId),
}));

export const agentSkills = pgTable('agent_skills', {
  id:          uuid('id').primaryKey().defaultRandom(),
  agentId:     uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id),
  skillId:     uuid('skill_id').notNull(),
  skillName:   text('skill_name').notNull(),
  proficiency: integer('proficiency').notNull(),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  agentSkillUnique: uniqueIndex('agent_skills_agent_skill_idx').on(table.agentId, table.skillId),
  skillProfIdx:     index('idx_agent_skills_skill').on(table.tenantId, table.skillId, table.proficiency),
}));

export const agentSchedules = pgTable('agent_schedules', {
  id:           uuid('id').primaryKey().defaultRandom(),
  agentId:      uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  scheduleDate: date('schedule_date').notNull(),
  shiftStart:   timestamp('shift_start', { withTimezone: true }).notNull(),
  shiftEnd:     timestamp('shift_end', { withTimezone: true }).notNull(),
  activities:   jsonb('activities').notNull().default([]),
  acknowledged: boolean('acknowledged').notNull().default(false),
  status:       text('status').notNull().default('draft'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  agentDateUnique: uniqueIndex('agent_schedules_agent_date_idx').on(table.agentId, table.scheduleDate),
  tenantDateIdx:   index('idx_agent_schedules_date').on(table.tenantId, table.scheduleDate),
}));

// ── Queues ────────────────────────────────────────────────────

export const queues = pgTable('queues', {
  id:                uuid('id').primaryKey().defaultRandom(),
  tenantId:          uuid('tenant_id').notNull().references(() => tenants.id),
  name:              text('name').notNull(),
  description:       text('description'),
  routingStrategy:   text('routing_strategy').notNull().default('longest_idle'),
  requiredSkills:    jsonb('required_skills').notNull().default([]),
  slaConfig:         jsonb('sla_config').notNull(),
  priority:          integer('priority').notNull().default(5),
  maxDepth:          integer('max_depth').notNull().default(100),
  overflowConfig:    jsonb('overflow_config'),
  callbackEnabled:   boolean('callback_enabled').notNull().default(false),
  callbackThresholdSeconds: integer('callback_threshold_seconds'),
  channels:          text('channels').array().notNull().default(sql`'{voice,chat,email}'`),
  isActive:          boolean('is_active').notNull().default(true),
  operatingHours:    jsonb('operating_hours'),
  metadata:          jsonb('metadata').notNull().default({}),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantNameUnique: uniqueIndex('queues_tenant_name_idx').on(table.tenantId, table.name),
  tenantActiveIdx:  index('idx_queues_tenant_active').on(table.tenantId, table.isActive),
}));

export const queueEntries = pgTable('queue_entries', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  queueId:            uuid('queue_id').notNull().references(() => queues.id),
  tenantId:           uuid('tenant_id').notNull().references(() => tenants.id),
  interactionId:      uuid('interaction_id').notNull(),
  priority:           integer('priority').notNull().default(5),
  enqueuedAt:         timestamp('enqueued_at', { withTimezone: true }).notNull().defaultNow(),
  position:           integer('position').notNull(),
  estimatedWaitSeconds: integer('estimated_wait_seconds'),
  isOffered:          boolean('is_offered').notNull().default(false),
  offerAttempts:      integer('offer_attempts').notNull().default(0),
  requestedSkills:    text('requested_skills').array().notNull().default(sql`'{}'`),
  customerId:         text('customer_id'),
  channel:            text('channel').notNull(),
  status:             text('status').notNull().default('waiting'),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  queueStatusIdx:   index('idx_queue_entries_queue_status').on(table.queueId, table.status),
  queuePriorityIdx: index('idx_queue_entries_queue_priority').on(table.queueId, table.priority, table.enqueuedAt),
}));

// ── Interactions ──────────────────────────────────────────────

export const interactions = pgTable('interactions', {
  id:                uuid('id').primaryKey().defaultRandom(),
  tenantId:          uuid('tenant_id').notNull().references(() => tenants.id),
  channel:           text('channel').notNull(),
  status:            text('status').notNull().default('initiated'),
  direction:         text('direction').notNull().default('inbound'),
  customerId:        text('customer_id'),
  customerName:      text('customer_name'),
  customerContact:   text('customer_contact').notNull(),
  agentId:           uuid('agent_id').references(() => agents.id),
  queueId:           uuid('queue_id').references(() => queues.id),
  priority:          integer('priority').notNull().default(5),
  subject:           text('subject'),
  ivrPath:           text('ivr_path').array(),
  requiredSkills:    text('required_skills').array().notNull().default(sql`'{}'`),
  dispositionCode:   text('disposition_code'),
  wrapUpNotes:       text('wrap_up_notes'),
  tags:              text('tags').array().notNull().default(sql`'{}'`),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  queuedAt:          timestamp('queued_at', { withTimezone: true }),
  answeredAt:        timestamp('answered_at', { withTimezone: true }),
  completedAt:       timestamp('completed_at', { withTimezone: true }),
  waitTimeSeconds:   integer('wait_time_seconds'),
  handleTimeSeconds: integer('handle_time_seconds'),
  holdTimeSeconds:   integer('hold_time_seconds'),
  wrapUpTimeSeconds: integer('wrap_up_time_seconds'),
  talkTimeSeconds:   integer('talk_time_seconds'),
  isFirstContactResolution: boolean('is_first_contact_resolution'),
  transferCount:     integer('transfer_count').notNull().default(0),
  recordingIds:      text('recording_ids').array().notNull().default(sql`'{}'`),
  externalRef:       text('external_ref'),
  metadata:          jsonb('metadata').notNull().default({}),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantStatusIdx:   index('idx_interactions_tenant_status').on(table.tenantId, table.status),
  agentIdx:          index('idx_interactions_agent').on(table.agentId, table.createdAt),
  queueIdx:          index('idx_interactions_queue').on(table.queueId, table.status),
  customerIdx:       index('idx_interactions_customer').on(table.tenantId, table.customerId, table.createdAt),
}));

// Additional tables (ivr_flows, ivr_nodes, qa_scorecards, qa_evaluations,
// wallboard_configs, interaction_surveys, survey_responses, wfm_forecasts,
// wfm_adherence_log) follow the same pattern — see SQL definitions above.
```

---

## Code Examples

### Example 1: Create and Configure an Agent

```typescript
import { ContactCenterService } from '@mcv/nexus/contact-center';

const cc = new ContactCenterService({ tenantId: 'tenant_abc' });

// Create a new agent
const agent = await cc.createAgent({
  userId: 'user_123',
  displayName: 'Maria Santos',
  email: 'maria.santos@company.com',
  enabledChannels: ['voice', 'chat', 'email'],
  concurrencyLimits: {
    voice: 1,    // 1 call at a time
    chat: 4,     // Up to 4 concurrent chats
    email: 8,    // Up to 8 concurrent emails
    sms: 3,
  },
  teamId: 'team_support_tier1',
  supervisorId: 'agent_sup_001',
  timezone: 'America/Sao_Paulo',
});

// Assign skills to the agent
await cc.updateAgentSkills(agent.id, [
  { skillId: 'skill_portuguese', skillName: 'Portuguese', proficiency: 10, isActive: true },
  { skillId: 'skill_english', skillName: 'English', proficiency: 8, isActive: true },
  { skillId: 'skill_billing', skillName: 'Billing', proficiency: 7, isActive: true },
  { skillId: 'skill_technical', skillName: 'Technical Support', proficiency: 5, isActive: true },
]);

// Agent logs in and becomes available
await cc.setAgentState(agent.id, 'available');
console.log(`Agent ${agent.displayName} is now available for interactions`);

// Later: agent goes on break
await cc.setAgentState(agent.id, 'away', 'scheduled_break');
```

### Example 2: Set Up a Queue with SLA and Overflow

```typescript
import { ContactCenterService, RoutingStrategy } from '@mcv/nexus/contact-center';

const cc = new ContactCenterService({ tenantId: 'tenant_abc' });

// Create a priority support queue
const queue = await cc.createQueue({
  name: 'Premium Support',
  description: 'Queue for premium/VIP customers with aggressive SLAs',
  routingStrategy: RoutingStrategy.MostSkilled,
  requiredSkills: [
    { skillId: 'skill_premium', skillName: 'Premium Support', minimumProficiency: 7, isRequired: true },
    { skillId: 'skill_english', skillName: 'English', minimumProficiency: 5, isRequired: true },
  ],
  sla: {
    targetAnswerTimeSeconds: 15,     // Answer within 15 seconds
    targetPercentage: 90,            // 90% of the time
    warningThresholdSeconds: 10,     // Warn at 10 seconds
    criticalThresholdSeconds: 25,    // Critical at 25 seconds
  },
  priority: 10,  // High priority queue
  maxDepth: 50,
  callbackEnabled: true,
  callbackThresholdSeconds: 30, // Offer callback after 30s wait
  channels: ['voice', 'chat'],
  overflow: {
    action: 'route_to_queue',
    targetQueueId: 'queue_general_support',
    triggers: {
      maxWaitSeconds: 60,       // Overflow after 1 minute wait
      maxDepth: 40,             // Overflow when 40+ waiting
      minAvailableAgents: 1,    // Overflow when <1 agent available
    },
  },
  operatingHours: {
    timezone: 'America/New_York',
    schedule: {
      monday:    { open: '08:00', close: '22:00' },
      tuesday:   { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday:  { open: '08:00', close: '22:00' },
      friday:    { open: '08:00', close: '20:00' },
      saturday:  { open: '10:00', close: '18:00' },
      sunday:    null, // Closed
    },
    holidays: ['2026-12-25', '2027-01-01'],
    afterHoursAction: 'voicemail',
  },
});

console.log(`Queue "${queue.name}" created with ${queue.sla.targetAnswerTimeSeconds}s SLA target`);
```

### Example 3: Configure Routing Rules

```typescript
import { ContactCenterService } from '@mcv/nexus/contact-center';

const cc = new ContactCenterService({ tenantId: 'tenant_abc' });

// Route VIP customers to premium queue with elevated priority
await cc.createRoutingRule({
  name: 'VIP Customer Routing',
  description: 'Route VIP-tier customers to premium support with +5 priority boost',
  evaluationOrder: 1, // Evaluate first
  conditions: [
    { field: 'customer.tier', operator: 'equals', value: 'vip' },
  ],
  conditionOperator: 'and',
  actions: {
    targetQueueId: 'queue_premium_support',
    priorityAdjustment: 5,
    addTags: ['vip', 'priority'],
    agentWhisper: 'VIP customer incoming. Account tier: Premium.',
  },
  isActive: true,
});

// Route Spanish-speaking callers to bilingual queue
await cc.createRoutingRule({
  name: 'Spanish Language Routing',
  description: 'Route Spanish-speaking customers to bilingual agents',
  evaluationOrder: 2,
  conditions: [
    { field: 'customer.language', operator: 'equals', value: 'es' },
    { field: 'channel', operator: 'in', value: ['voice', 'chat'] },
  ],
  conditionOperator: 'and',
  actions: {
    targetQueueId: 'queue_spanish_support',
    skillOverrides: [
      { skillId: 'skill_spanish', skillName: 'Spanish', minimumProficiency: 7, isRequired: true },
    ],
  },
  isActive: true,
});

// After-hours routing to voicemail
await cc.createRoutingRule({
  name: 'After Hours Routing',
  description: 'Route calls after business hours to voicemail',
  evaluationOrder: 0, // Evaluate first
  conditions: [
    { field: 'time.hour', operator: 'greater_than', value: 22 },
    { field: 'channel', operator: 'equals', value: 'voice' },
  ],
  conditionOperator: 'and',
  actions: {
    targetQueueId: 'queue_voicemail',
    addTags: ['after_hours'],
    metadata: { afterHours: true },
  },
  schedule: {
    // Only active outside business hours
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
    timeRanges: [
      { start: '22:00', end: '23:59' },
      { start: '00:00', end: '08:00' },
    ],
  },
  isActive: true,
});

console.log('Routing rules configured');
```

### Example 4: Supervisor Real-Time Monitoring

```typescript
import { ContactCenterService } from '@mcv/nexus/contact-center';

const cc = new ContactCenterService({ tenantId: 'tenant_abc' });
const supervisorId = 'agent_sup_001';

// Get real-time stats for all queues
const allStats = await cc.getAllQueueStats();
for (const stats of allStats) {
  console.log(`Queue ${stats.queueId}:`);
  console.log(`  Waiting: ${stats.waitingCount} | Active: ${stats.activeCount}`);
  console.log(`  Available Agents: ${stats.availableAgents}/${stats.totalAgents}`);
  console.log(`  SLA: ${stats.currentSLAPercent.toFixed(1)}%`);
  console.log(`  EWT: ${stats.estimatedWaitSeconds}s | Longest Wait: ${stats.longestWaitSeconds}s`);
  console.log(`  AHT: ${stats.averageHandleTimeSeconds}s | ASA: ${stats.averageSpeedOfAnswerSeconds}s`);
}

// Start silent monitoring of a live call
const monitorSession = await cc.startMonitoring(
  supervisorId,
  'interaction_789',
  'silent'
);
console.log(`Monitoring session ${monitorSession.id} started (silent mode)`);

// Escalate to whisper mode (agent hears supervisor, customer does not)
await cc.whisper(supervisorId, 'interaction_789', 'Ask the customer for their order number.');

// Escalate to barge-in (supervisor joins the call)
await cc.bargeIn(supervisorId, 'interaction_789');

// Force an agent back to available
await cc.forceAgentState(supervisorId, 'agent_456', 'available');

// Send broadcast to all agents on a team
await cc.broadcastMessage(
  supervisorId,
  ['team_support_tier1', 'team_support_tier2'],
  '⚠️ High volume alert: Please minimize wrap-up time. All hands needed.'
);
```

### Example 5: Workforce Management — Forecast and Schedule

```typescript
import { ContactCenterService, ErlangCCalculator } from '@mcv/nexus/contact-center';

const cc = new ContactCenterService({ tenantId: 'tenant_abc' });

// ── Erlang-C Calculation ──────────────────────────────────────
const erlang = new ErlangCCalculator();

const result = erlang.calculate({
  volume: 120,                    // 120 calls per 30 minutes
  ahtSeconds: 300,                // 5 minute average handle time
  intervalSeconds: 1800,          // 30 minute interval
  targetAnswerTimeSeconds: 20,    // 80/20 SLA
  targetServiceLevel: 0.80,       // 80% target
});

console.log(`Required agents: ${result.requiredAgents}`);
console.log(`Service level: ${(result.serviceLevel * 100).toFixed(1)}%`);
console.log(`ASA: ${result.averageSpeedOfAnswer.toFixed(1)}s`);
console.log(`P(wait): ${(result.probabilityOfWaiting * 100).toFixed(1)}%`);
console.log(`Occupancy: ${(result.occupancy * 100).toFixed(1)}%`);
console.log(`Traffic intensity: ${result.trafficIntensity.toFixed(2)} Erlangs`);

// ── Generate a Weekly Forecast ────────────────────────────────
const forecast = await cc.generateForecast({
  name: 'Week 7 Forecast - General Support',
  queueId: 'queue_general_support',
  startDate: '2026-02-09',
  endDate: '2026-02-15',
  intervalMinutes: 30,
  method: 'erlang_c',
  slaTarget: {
    targetAnswerTimeSeconds: 20,
    targetPercentage: 80,
    warningThresholdSeconds: 15,
    criticalThresholdSeconds: 30,
  },
  shrinkageFactor: 0.30, // 30% shrinkage (breaks, meetings, absenteeism)
});

console.log(`Forecast "${forecast.name}" generated with ${forecast.intervals.length} intervals`);
console.log(`Accuracy: MAPE=${forecast.accuracy?.mape.toFixed(2)}%, RMSE=${forecast.accuracy?.rmse.toFixed(2)}`);

// Preview staffing requirements
const peakInterval = forecast.intervals.reduce(
  (max, iv) => iv.requiredStaffAdjusted > max.requiredStaffAdjusted ? iv : max,
  forecast.intervals[0]
);
console.log(`Peak staffing: ${peakInterval.requiredStaffAdjusted} agents at ${peakInterval.startTime}`);

// ── Generate Optimized Schedules ──────────────────────────────
const schedules = await cc.generateSchedules(forecast.id, {
  respectLaborRules: true,
  maxShiftLength: 9,          // 9 hours including break
  minShiftLength: 4,          // Minimum 4-hour shift
  breakDuration: 15,          // 15-minute breaks
  lunchDuration: 30,          // 30-minute lunch
  maxConsecutiveDays: 5,      // Max 5 days in a row
  preferredShiftPatterns: ['8am-4pm', '12pm-8pm', '4pm-12am'],
  overtimeAllowed: true,
  maxOvertimeHoursPerWeek: 10,
});

console.log(`Generated ${schedules.length} agent schedules`);

// ── Check Real-Time Adherence ─────────────────────────────────
const adherence = await cc.getTeamAdherence('team_support_tier1');
const outOfAdherence = adherence.filter(a => a.status === 'out_of_adherence');
if (outOfAdherence.length > 0) {
  console.log(`⚠️ ${outOfAdherence.length} agents out of adherence:`);
  for (const record of outOfAdherence) {
    console.log(`  Agent ${record.agentId}: scheduled=${record.scheduledActivity}, actual=${record.actualActivity}`);
    console.log(`    Out of adherence for ${record.durationSeconds}s`);
  }
}
```

### Example 6: Build an IVR Flow

```typescript
import { ContactCenterService } from '@mcv/nexus/contact-center';

const cc = new ContactCenterService({ tenantId: 'tenant_abc' });

// Create an IVR flow
const flow = await cc.createIVRFlow({
  name: 'Main Support IVR',
  description: 'Primary inbound IVR for customer support',
  entryPoints: [
    { type: 'phone_number', value: '+15551234567', label: 'Main Support Line' },
  ],
});

// Define nodes in the IVR flow
const updatedFlow = await cc.updateIVRFlow(flow.id, {
  nodes: [
    {
      id: 'node_start',
      type: 'start',
      label: 'Start',
      position: { x: 100, y: 100 },
      config: {},
    },
    {
      id: 'node_welcome',
      type: 'play_message',
      label: 'Welcome Message',
      position: { x: 100, y: 200 },
      config: {
        message: 'Thank you for calling Acme Support. Your call may be recorded for quality assurance.',
        ttsVoice: 'en-US-Neural2-F',
      },
    },
    {
      id: 'node_time_check',
      type: 'time_check',
      label: 'Business Hours Check',
      position: { x: 100, y: 300 },
      config: {
        scheduleId: 'schedule_business_hours',
        timezone: 'America/New_York',
      },
    },
    {
      id: 'node_after_hours',
      type: 'play_message',
      label: 'After Hours Message',
      position: { x: 300, y: 400 },
      config: {
        message: 'We are currently closed. Our hours are Monday through Friday, 8 AM to 10 PM Eastern. Please leave a message after the tone.',
      },
    },
    {
      id: 'node_voicemail',
      type: 'voicemail',
      label: 'Voicemail',
      position: { x: 300, y: 500 },
      config: { metadata: { type: 'after_hours' } },
    },
    {
      id: 'node_main_menu',
      type: 'menu',
      label: 'Main Menu',
      position: { x: 100, y: 400 },
      config: {
        prompt: 'For billing, press 1. For technical support, press 2. For sales, press 3. To speak with an agent, press 0.',
        options: [
          { digit: '1', label: 'Billing' },
          { digit: '2', label: 'Technical Support' },
          { digit: '3', label: 'Sales' },
          { digit: '0', label: 'Agent' },
        ],
        timeout: 10,
        maxRetries: 3,
        invalidPrompt: 'Sorry, that was not a valid option. Please try again.',
      },
    },
    {
      id: 'node_account_lookup',
      type: 'collect_digits',
      label: 'Account Number',
      position: { x: 0, y: 550 },
      config: {
        prompt: 'Please enter your account number followed by the pound sign.',
        minDigits: 6,
        maxDigits: 10,
        terminationDigit: '#',
        timeout: 15,
      },
    },
    {
      id: 'node_db_lookup',
      type: 'db_lookup',
      label: 'Verify Account',
      position: { x: 0, y: 650 },
      config: {
        query: 'SELECT id, name, tier FROM customers WHERE account_number = $1',
        connectionId: 'conn_crm_db',
        resultVariable: 'customer',
      },
    },
    {
      id: 'node_billing_queue',
      type: 'route_to_queue',
      label: 'Route to Billing',
      position: { x
```

---

## Error Codes

The contact center module uses the prefix `CC_` for all error codes. Errors are thrown as `TRPCError` instances with structured `cause` objects containing the error code, a human-readable message, and optional metadata.

| Code | HTTP | Name | Description | Resolution |
|------|------|------|-------------|------------|
| `CC_001` | 404 | `AGENT_NOT_FOUND` | The specified agent ID does not exist or has been deactivated in this tenant. | Verify the agent ID exists and belongs to the current tenant. Check agent status is not `TERMINATED`. |
| `CC_002` | 409 | `AGENT_ALREADY_EXISTS` | An agent record with the same user ID or extension already exists for this tenant. | Use the existing agent record or deactivate the duplicate before creating a new one. |
| `CC_003` | 422 | `AGENT_STATE_TRANSITION_INVALID` | The requested agent state transition is not allowed (e.g., `OFFLINE` ? `ON_CALL`). | Follow the valid state machine transitions: `OFFLINE` ? `AVAILABLE` ? `ON_CALL` / `ACW` / `BREAK`. |
| `CC_004` | 409 | `AGENT_ALREADY_ON_CALL` | The agent is already handling an active interaction and cannot accept another (unless blending is enabled). | Wait for the current interaction to complete, or enable multi-channel blending for the agent's skill group. |
| `CC_005` | 429 | `QUEUE_FULL` | The queue has reached its maximum capacity (`maxSize` configuration). | Increase queue capacity, add overflow routing, or activate additional agents. |
| `CC_006` | 404 | `QUEUE_NOT_FOUND` | The specified queue ID does not exist or is not active for this tenant. | Verify the queue ID and ensure the queue has not been archived or deleted. |
| `CC_007` | 422 | `QUEUE_ROUTING_INVALID` | The queue routing strategy configuration is invalid (e.g., missing skill requirements for skills-based routing). | Review the routing strategy configuration. Ensure all referenced skills and priorities are properly defined. |
| `CC_008` | 408 | `SLA_BREACH` | The interaction has exceeded the configured SLA threshold for the queue. Emitted as an event, not typically thrown. | Investigate staffing levels. Adjust SLA targets or increase agent capacity for the affected queue. |
| `CC_009` | 422 | `SLA_CONFIG_INVALID` | SLA configuration is invalid (e.g., threshold <= 0, target percentage > 100). | Ensure SLA threshold is a positive duration and target percentage is between 1 and 100. |
| `CC_010` | 422 | `IVR_NODE_INVALID` | An IVR flow node has an invalid configuration (e.g., missing prompt, invalid DTMF mapping, unreachable branch). | Validate the IVR flow using the built-in flow validator. Check all nodes have valid connections and configurations. |
| `CC_011` | 422 | `IVR_FLOW_CYCLE_DETECTED` | The IVR flow contains a cycle that could cause infinite loops (no exit path detected). | Review the flow graph and ensure all paths eventually reach a terminal node (hangup, transfer, or queue). |
| `CC_012` | 404 | `IVR_FLOW_NOT_FOUND` | The specified IVR flow ID does not exist or is not published. | Verify the flow ID. Ensure the flow has been published (draft flows cannot be assigned to channels). |
| `CC_013` | 409 | `SCHEDULE_CONFLICT` | The proposed agent schedule overlaps with an existing schedule entry for the same agent. | Adjust the schedule times to avoid overlap, or remove the conflicting existing entry first. |
| `CC_014` | 422 | `SCHEDULE_INVALID` | Schedule entry is invalid (e.g., end time before start time, shift exceeds maximum duration). | Ensure start time precedes end time and shift duration falls within configured limits (default max: 12 hours). |
| `CC_015` | 422 | `WFM_DATA_INSUFFICIENT` | Insufficient historical data to generate a reliable workforce management forecast. Minimum 2 weeks of data required. | Accumulate more historical interaction data before running forecasts, or provide manual volume estimates. |
| `CC_016` | 422 | `WFM_FORECAST_PARAMS_INVALID` | WFM forecast parameters are invalid (e.g., negative service level, AHT <= 0, shrinkage > 100%). | Review forecast parameters: service level (0-1), AHT (positive seconds), shrinkage (0-99%). |
| `CC_017` | 500 | `WFM_ERLANG_CONVERGENCE_FAILURE` | The Erlang-C iterative calculation failed to converge within the maximum iteration limit. | Check for extreme input values. Reduce the target service level or increase the iteration limit in configuration. |
| `CC_018` | 422 | `QA_SCORECARD_INVALID` | QA scorecard definition is invalid (e.g., weights don't sum to 100, missing required sections, invalid scoring scale). | Ensure all section weights sum to 100%, all criteria have valid min/max scores, and required sections are present. |
| `CC_019` | 404 | `QA_SCORECARD_NOT_FOUND` | The specified QA scorecard template ID does not exist. | Verify the scorecard template ID. Check if it was archived or belongs to a different tenant. |
| `CC_020` | 422 | `QA_EVALUATION_INCOMPLETE` | A QA evaluation submission is missing required scores or mandatory comments for failing criteria. | Complete all required scoring fields and add mandatory justification comments for any criteria scored below threshold. |
| `CC_021` | 422 | `WALLBOARD_CONFIG_INVALID` | Wallboard layout or widget configuration is invalid (e.g., overlapping grid positions, unknown metric type). | Validate grid positions don't overlap and all metric references point to valid, available metrics. |
| `CC_022` | 404 | `INTERACTION_NOT_FOUND` | The specified interaction (call, chat, email) ID does not exist or has been purged. | Verify the interaction ID. Interactions older than the retention period may have been archived. |
| `CC_023` | 403 | `SUPERVISOR_ACTION_UNAUTHORIZED` | The requesting user lacks supervisor permissions for the target agent's team or queue. | Ensure the user has the `contact_center:supervisor` role and is assigned to the relevant team or queue. |
| `CC_024` | 429 | `RATE_LIMIT_EXCEEDED` | Too many API requests from this agent/session. Applies to state changes, transfers, and conference operations. | Implement exponential backoff. Default limits: 60 state changes/min, 30 transfers/min per agent. |
| `CC_025` | 422 | `CHANNEL_CONFIG_INVALID` | Channel configuration is invalid (e.g., missing Twilio credentials for voice, invalid webhook URL for chat). | Verify all required channel provider credentials and webhook URLs are correctly configured. |
| `CC_026` | 503 | `TELEPHONY_PROVIDER_UNAVAILABLE` | The telephony provider (Twilio) is unreachable or returning errors. | Check Twilio service status. Verify API credentials. Retry with exponential backoff. |
| `CC_027` | 422 | `SKILL_NOT_FOUND` | A referenced skill does not exist in the skill catalog for this tenant. | Create the skill in the skill catalog before assigning it to agents or using it in routing rules. |
| `CC_028` | 409 | `INTERACTION_ALREADY_ASSIGNED` | The interaction is already assigned to another agent and cannot be reassigned without transfer. | Use the transfer or conference API instead of direct assignment. |
| `CC_029` | 422 | `WRAP_UP_CODE_REQUIRED` | The interaction cannot be completed without a wrap-up (disposition) code when the queue requires one. | Select a valid wrap-up code from the queue's configured disposition code list before completing the interaction. |
| `CC_030` | 422 | `RECORDING_CONSENT_REQUIRED` | Call recording or monitoring cannot proceed without required consent acknowledgment (based on jurisdiction config). | Ensure recording consent has been captured per the tenant's configured consent requirements (one-party/two-party). |

### Error Response Format

```json
{
  "error": {
    "code": "CC_005",
    "name": "QUEUE_FULL",
    "message": "Queue 'sales-inbound' has reached maximum capacity (150/150)",
    "metadata": {
      "queueId": "queue_abc123",
      "queueName": "sales-inbound",
      "currentSize": 150,
      "maxSize": 150,
      "oldestWaitTime": "00:12:34"
    },
    "timestamp": "2025-01-15T14:30:00.000Z",
    "traceId": "cc-trace-7f8a9b0c"
  }
}
```


---

## Security

### Authentication & Authorization

The contact center module enforces multi-layered security appropriate for handling sensitive customer interactions and PII data.

#### Role-Based Access Control

| Role | Scope | Capabilities |
|------|-------|-------------|
| `contact_center:agent` | Assigned queues | Handle interactions, update own status, view own metrics, submit wrap-up codes |
| `contact_center:supervisor` | Assigned teams/queues | Monitor agents, barge/whisper on calls, manage schedules, run QA evaluations, view team metrics |
| `contact_center:admin` | Tenant-wide | Configure queues, IVR flows, skills, SLAs, wallboards, WFM parameters, channel integrations |
| `contact_center:qa_evaluator` | Assigned evaluation pools | Score interactions, submit QA evaluations, view calibration sessions |
| `contact_center:wfm_planner` | Tenant-wide | Run forecasts, create schedules, manage shift templates, view adherence reports |
| `contact_center:wallboard_viewer` | Specific wallboards | View-only access to assigned real-time wallboard displays |

#### Agent Authentication

```typescript
// Agents authenticate via standard tenant auth, then establish a WebSocket session
// Agent session tokens are short-lived (15 min) with automatic refresh
const agentSession = await trpc.contactCenter.agent.authenticate.mutate({
  agentId: 'agent_001',
  extension: '5001',
  stationMode: 'webrtc' | 'pstn' | 'sip',
});
// Returns: { sessionToken, wsEndpoint, refreshToken, expiresAt }
```

- Agent sessions are bound to a single WebSocket connection; disconnection triggers configurable grace period before auto-logout
- Concurrent session prevention: one active session per agent per tenant (configurable)
- Session tokens include embedded queue assignments and skill certifications

### Row-Level Security (RLS)

All contact center data is tenant-isolated via Supabase RLS policies:

```sql
-- Interactions are strictly tenant-isolated
CREATE POLICY "tenant_isolation_interactions" ON contact_center.interactions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Agents can only view their own interaction history
CREATE POLICY "agent_own_interactions" ON contact_center.interaction_assignments
  FOR SELECT USING (
    agent_id = current_setting('app.current_agent_id')::uuid
    OR has_role('contact_center:supervisor')
  );

-- QA evaluations restricted to authorized evaluators and the evaluated agent
CREATE POLICY "qa_evaluation_access" ON contact_center.qa_evaluations
  FOR SELECT USING (
    evaluator_id = current_setting('app.current_user_id')::uuid
    OR agent_id = current_setting('app.current_agent_id')::uuid
    OR has_role('contact_center:admin')
  );

-- Recordings access requires explicit permission
CREATE POLICY "recording_access" ON contact_center.recordings
  FOR SELECT USING (
    has_any_role(ARRAY['contact_center:supervisor', 'contact_center:qa_evaluator', 'contact_center:admin'])
  );
```

### Call Monitoring & Consent

| Monitoring Mode | Description | Consent Requirement |
|----------------|-------------|-------------------|
| **Silent Monitor** | Supervisor listens to live call without agent/customer awareness | Configurable per jurisdiction |
| **Whisper** | Supervisor speaks to agent only; customer cannot hear | Agent notification required |
| **Barge-In** | Supervisor joins call as active participant; all parties hear | All-party notification |
| **Call Recording** | Automatic or on-demand recording of interactions | Per tenant consent configuration |

```typescript
// Consent configuration per tenant
interface ConsentConfig {
  recordingConsent: 'one-party' | 'two-party' | 'all-party' | 'notification-only';
  monitoringConsent: 'supervisor-only' | 'agent-notified' | 'all-party';
  consentPromptIvrNodeId?: string; // IVR node that plays consent message
  retainConsentProof: boolean;     // Store consent acknowledgment records
  jurisdictionOverrides: Record<string, ConsentConfig>; // Per-region overrides
}
```

### PCI DSS Compliance (Payment IVR)

For IVR flows that handle payment card data:

- **Pause/Resume Recording**: Automatic recording pause when IVR enters a payment collection node; resumed after token is returned
- **DTMF Masking**: DTMF tones are suppressed from call recordings and real-time audio streams during payment entry
- **No PAN Storage**: Credit card numbers are never stored in contact center databases; tokenized via payment processor
- **Secure Transfer**: Payment IVR nodes use TLS 1.3 for all communication with payment gateways
- **Audit Logging**: All payment IVR node entries/exits are logged with timestamps (without card data)
- **Agent Screen Masking**: Card entry fields are masked on agent desktop when customer enters payment data via IVR

```typescript
// Payment IVR node configuration
interface PaymentIvrNode extends IvrNode {
  type: 'payment_collection';
  config: {
    paymentGatewayId: string;
    pauseRecording: true;        // Always true, enforced by validation
    maskDtmf: true;              // Always true, enforced by validation
    tokenizationEndpoint: string;
    timeoutSeconds: number;
    maxRetries: number;
    fallbackAction: 'transfer_agent' | 'retry' | 'hangup';
  };
}
```

### Data Protection

- **PII Handling**: Customer PII (name, phone, email) is encrypted at rest via Supabase column-level encryption for sensitive fields
- **Data Retention**: Configurable per-tenant retention policies for interactions, recordings, and QA evaluations
- **Recording Storage**: Call recordings stored in tenant-isolated cloud storage buckets with server-side encryption (AES-256)
- **Transcript Redaction**: Automatic PII redaction in call transcripts (SSN, credit card patterns, etc.) via configurable regex patterns
- **Right to Erasure**: GDPR/CCPA deletion workflows for customer interaction history with cascading purge across recordings, transcripts, and QA evaluations
- **Audit Trail**: All data access, modifications, and deletions are logged to an immutable audit table

### Rate Limiting

| Operation | Limit | Window | Scope |
|-----------|-------|--------|-------|
| Agent state changes | 60 | 1 minute | Per agent |
| Transfer/conference | 30 | 1 minute | Per agent |
| Queue lookups | 200 | 1 minute | Per session |
| Wallboard refresh | 10 | 1 minute | Per wallboard |
| IVR flow updates | 20 | 1 minute | Per tenant |
| QA evaluation submissions | 30 | 1 minute | Per evaluator |
| WFM forecast generation | 5 | 1 minute | Per tenant |
| Bulk schedule operations | 10 | 1 minute | Per tenant |
| Recording access | 50 | 1 minute | Per user |
| Webhook dispatches | 1000 | 1 minute | Per tenant |

Rate limits return `CC_024` with a `Retry-After` header indicating seconds until the limit resets.


---

## Environment Variables

All environment variables are prefixed with the module namespace. Variables marked as **required** must be set for the module to initialize. Variables with defaults will use the default value if not explicitly configured.

### Telephony Provider (Twilio)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `CC_TWILIO_ACCOUNT_SID` | `string` | Yes | � | Twilio account SID for the tenant's telephony integration |
| `CC_TWILIO_AUTH_TOKEN` | `string` | Yes | � | Twilio auth token (stored encrypted, never logged) |
| `CC_TWILIO_API_KEY_SID` | `string` | Yes | � | Twilio API key SID for WebRTC token generation |
| `CC_TWILIO_API_KEY_SECRET` | `string` | Yes | � | Twilio API key secret for WebRTC token generation |
| `CC_TWILIO_TRUNKING_SID` | `string` | No | � | Twilio SIP trunking SID for PSTN connectivity |
| `CC_TWILIO_WEBHOOK_BASE_URL` | `string` | Yes | � | Base URL for Twilio status callback webhooks |
| `CC_TWILIO_REGION` | `string` | No | `us1` | Twilio region for latency optimization (`us1`, `ie1`, `au1`, `sg1`) |

### Queue Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `CC_QUEUE_MAX_SIZE` | `number` | No | `500` | Global maximum queue size (per queue). Override per-queue via config. |
| `CC_QUEUE_MAX_WAIT_SECONDS` | `number` | No | `3600` | Maximum wait time before automatic overflow routing (seconds) |
| `CC_QUEUE_PRIORITY_LEVELS` | `number` | No | `10` | Number of priority levels supported (1 = lowest, N = highest) |
| `CC_QUEUE_ROUTING_INTERVAL_MS` | `number` | No | `1000` | Interval between routing engine evaluation cycles (milliseconds) |
| `CC_QUEUE_OVERFLOW_STRATEGY` | `string` | No | `voicemail` | Default overflow strategy: `voicemail`, `callback`, `transfer`, `disconnect` |
| `CC_QUEUE_POSITION_ANNOUNCE_INTERVAL` | `number` | No | `60` | Seconds between queue position announcements to waiting callers |

### Agent Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `CC_AGENT_SESSION_TTL_MINUTES` | `number` | No | `15` | Agent session token TTL before refresh required |
| `CC_AGENT_DISCONNECT_GRACE_SECONDS` | `number` | No | `30` | Grace period after WebSocket disconnect before auto-logout |
| `CC_AGENT_MAX_CONCURRENT_CHATS` | `number` | No | `3` | Default maximum concurrent chat interactions per agent |
| `CC_AGENT_ACW_TIMEOUT_SECONDS` | `number` | No | `120` | Auto-available timeout after After Call Work (0 = manual) |
| `CC_AGENT_IDLE_TIMEOUT_MINUTES` | `number` | No | `30` | Auto-break timeout for idle agents (0 = disabled) |

### Workforce Management (WFM)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `CC_WFM_FORECAST_HISTORY_WEEKS` | `number` | No | `8` | Weeks of historical data used for forecasting |
| `CC_WFM_ERLANG_MAX_ITERATIONS` | `number` | No | `1000` | Maximum iterations for Erlang-C convergence calculation |
| `CC_WFM_ERLANG_CONVERGENCE_THRESHOLD` | `number` | No | `0.0001` | Convergence threshold for Erlang-C iterative solver |
| `CC_WFM_DEFAULT_SHRINKAGE_PCT` | `number` | No | `30` | Default shrinkage percentage (breaks, training, meetings, absenteeism) |
| `CC_WFM_SCHEDULE_GRANULARITY_MINUTES` | `number` | No | `15` | Schedule interval granularity in minutes (15, 30, or 60) |
| `CC_WFM_ADHERENCE_TOLERANCE_SECONDS` | `number` | No | `60` | Tolerance window for schedule adherence calculation |

### Quality Assurance (QA)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `CC_QA_AUTO_SAMPLE_PCT` | `number` | No | `5` | Percentage of interactions auto-sampled for QA evaluation |
| `CC_QA_CALIBRATION_THRESHOLD` | `number` | No | `10` | Maximum allowed score variance (%) in calibration sessions before flagging |
| `CC_QA_EVALUATION_LOCK_HOURS` | `number` | No | `24` | Hours after submission before QA evaluation becomes immutable |
| `CC_QA_MIN_RECORDING_DURATION_SECONDS` | `number` | No | `30` | Minimum interaction duration to be eligible for QA sampling |

### Wallboard & Real-Time

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `CC_WALLBOARD_REFRESH_INTERVAL_MS` | `number` | No | `5000` | Wallboard metric refresh interval (milliseconds) |
| `CC_WALLBOARD_MAX_WIDGETS` | `number` | No | `20` | Maximum widgets per wallboard layout |
| `CC_WS_HEARTBEAT_INTERVAL_MS` | `number` | No | `15000` | WebSocket heartbeat ping interval for agent connections |
| `CC_WS_MAX_CONNECTIONS_PER_TENANT` | `number` | No | `500` | Maximum concurrent WebSocket connections per tenant |
| `CC_REALTIME_EVENT_BUFFER_SIZE` | `number` | No | `1000` | In-memory event buffer size for real-time metric aggregation |
| `CC_REALTIME_SNAPSHOT_INTERVAL_MS` | `number` | No | `10000` | Interval for persisting real-time metric snapshots to database |

### IVR Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `CC_IVR_MAX_FLOW_DEPTH` | `number` | No | `50` | Maximum node depth for IVR flow traversal (cycle protection) |
| `CC_IVR_DTMF_TIMEOUT_SECONDS` | `number` | No | `10` | Default timeout for DTMF input collection in IVR nodes |
| `CC_IVR_TTS_PROVIDER` | `string` | No | `twilio` | TTS provider for IVR prompts: `twilio`, `aws-polly`, `google-tts` |
| `CC_IVR_MAX_RETRIES` | `number` | No | `3` | Default retry count for IVR input nodes before fallback |


---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/nexus/core` | `workspace:*` | Tenant context, RLS helpers, base entity types, audit logging |
| `@mcv/nexus/auth` | `workspace:*` | Authentication, role-based access control, session management |
| `@mcv/nexus/realtime` | `workspace:*` | WebSocket infrastructure, pub/sub channels, presence tracking |
| `@mcv/nexus/notifications` | `workspace:*` | Alert delivery for SLA breaches, schedule changes, QA assignments |
| `@mcv/nexus/storage` | `workspace:*` | File storage abstraction for call recordings, voicemail attachments |
| `@mcv/nexus/analytics` | `workspace:*` | Metric aggregation pipeline, historical reporting, data warehouse exports |
| `@mcv/nexus/scheduling` | `workspace:*` | Cron job management for WFM forecast generation, report scheduling |
| `@mcv/nexus/audit` | `workspace:*` | Immutable audit trail for compliance-sensitive operations |
| `@mcv/nexus/telephony` | `workspace:*` | Telephony abstraction layer, provider adapters (Twilio, SIP) |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.0` | Type-safe SQL query builder and ORM for all database operations |
| `drizzle-kit` | `^0.22.0` | Database migration generation and management |
| `@trpc/server` | `^10.45.0` | End-to-end type-safe API layer for all contact center procedures |
| `@trpc/client` | `^10.45.0` | Client-side tRPC bindings for agent desktop and supervisor dashboard |
| `twilio` | `^5.0.0` | Twilio SDK for voice calls, SMS, WebRTC token generation, SIP trunking |
| `zod` | `^3.22.0` | Runtime schema validation for all API inputs, IVR flow definitions, configurations |
| `ws` | `^8.16.0` | WebSocket server for real-time agent state, wallboard updates, event streaming |
| `ioredis` | `^5.3.0` | Redis client for queue state caching, real-time metric buffering, pub/sub |
| `date-fns` | `^3.0.0` | Date/time manipulation for scheduling, SLA calculations, timezone handling |
| `date-fns-tz` | `^3.0.0` | Timezone-aware operations for multi-timezone WFM scheduling |
| `bullmq` | `^5.0.0` | Job queue for async operations: recording processing, report generation, WFM forecasts |
| `@supabase/supabase-js` | `^2.39.0` | Supabase client for RLS-enabled database access and real-time subscriptions |
| `uuid` | `^9.0.0` | UUID generation for interaction IDs, session tokens, correlation IDs |
| `pino` | `^8.17.0` | Structured logging for all contact center operations and audit events |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/postgres-js` | `^3.4.0` | PostgreSQL driver required by Drizzle ORM for Supabase connections |
| `typescript` | `^5.3.0` | TypeScript compiler for type-safe development |


---

## Testing

### Testing Strategy

The contact center module employs a comprehensive testing strategy with emphasis on correctness of routing algorithms, real-time state management, and telephony integration reliability.

### Unit Tests

#### Routing Algorithm Tests

```typescript
describe('QueueRoutingEngine', () => {
  describe('round-robin routing', () => {
    it('should distribute interactions evenly across available agents', () => {
      const agents = createMockAgents(5, { state: 'AVAILABLE' });
      const engine = new RoutingEngine({ strategy: 'round-robin' });

      const assignments = Array.from({ length: 10 }, () =>
        engine.selectAgent(agents, createMockInteraction())
      );

      // Each agent should receive exactly 2 interactions
      const distribution = countBy(assignments, 'agentId');
      expect(Object.values(distribution)).toEqual([2, 2, 2, 2, 2]);
    });

    it('should skip agents in non-available states', () => {
      const agents = [
        createMockAgent({ state: 'AVAILABLE' }),
        createMockAgent({ state: 'ON_CALL' }),
        createMockAgent({ state: 'BREAK' }),
        createMockAgent({ state: 'AVAILABLE' }),
      ];
      const engine = new RoutingEngine({ strategy: 'round-robin' });

      const selected = engine.selectAgent(agents, createMockInteraction());
      expect(['AVAILABLE']).toContain(agents.find(a => a.id === selected.agentId)?.state);
    });
  });

  describe('skills-based routing', () => {
    it('should match interaction required skills to agent skill set', () => {
      const agents = [
        createMockAgent({ skills: [{ name: 'spanish', level: 8 }, { name: 'billing', level: 5 }] }),
        createMockAgent({ skills: [{ name: 'english', level: 10 }, { name: 'technical', level: 7 }] }),
        createMockAgent({ skills: [{ name: 'spanish', level: 6 }, { name: 'technical', level: 9 }] }),
      ];
      const interaction = createMockInteraction({
        requiredSkills: [{ name: 'spanish', minLevel: 5 }],
      });
      const engine = new RoutingEngine({ strategy: 'skills-based' });

      const selected = engine.selectAgent(agents, interaction);
      // Should select agent with highest matching skill level
      expect(selected.agentId).toBe(agents[0].id); // spanish level 8
    });

    it('should return null when no agents match required skills', () => {
      const agents = [createMockAgent({ skills: [{ name: 'english', level: 10 }] })];
      const interaction = createMockInteraction({
        requiredSkills: [{ name: 'mandarin', minLevel: 5 }],
      });
      const engine = new RoutingEngine({ strategy: 'skills-based' });

      const selected = engine.selectAgent(agents, interaction);
      expect(selected).toBeNull();
    });
  });

  describe('longest-idle routing', () => {
    it('should select the agent who has been idle the longest', () => {
      const now = Date.now();
      const agents = [
        createMockAgent({ state: 'AVAILABLE', lastStateChangeAt: now - 60000 }),  // 1 min idle
        createMockAgent({ state: 'AVAILABLE', lastStateChangeAt: now - 300000 }), // 5 min idle
        createMockAgent({ state: 'AVAILABLE', lastStateChangeAt: now - 120000 }), // 2 min idle
      ];
      const engine = new RoutingEngine({ strategy: 'longest-idle' });

      const selected = engine.selectAgent(agents, createMockInteraction());
      expect(selected.agentId).toBe(agents[1].id); // 5 min idle
    });
  });

  describe('priority-weighted routing', () => {
    it('should respect interaction priority when multiple interactions compete', () => {
      const queue = new PriorityQueue();
      queue.enqueue(createMockInteraction({ priority: 3 })); // medium
      queue.enqueue(createMockInteraction({ priority: 9 })); // critical
      queue.enqueue(createMockInteraction({ priority: 1 })); // low

      const next = queue.dequeue();
      expect(next.priority).toBe(9); // highest priority first
    });
  });
});
```

#### Erlang-C Forecasting Tests

```typescript
describe('ErlangCCalculator', () => {
  const calculator = new ErlangCCalculator();

  it('should calculate correct staffing for standard parameters', () => {
    const result = calculator.calculateStaffing({
      callVolume: 100,          // 100 calls per interval
      averageHandleTime: 300,   // 5 minutes AHT
      intervalDuration: 1800,   // 30-minute interval
      targetServiceLevel: 0.80, // 80% answered
      targetAnswerTime: 20,     // within 20 seconds
      shrinkage: 0.30,          // 30% shrinkage
    });

    expect(result.rawAgentsRequired).toBeGreaterThanOrEqual(12);
    expect(result.adjustedAgentsRequired).toBeGreaterThanOrEqual(17); // after shrinkage
    expect(result.achievedServiceLevel).toBeGreaterThanOrEqual(0.80);
    expect(result.occupancy).toBeLessThan(1.0);
    expect(result.averageSpeedOfAnswer).toBeLessThanOrEqual(20);
  });

  it('should handle edge case of zero call volume', () => {
    const result = calculator.calculateStaffing({
      callVolume: 0,
      averageHandleTime: 300,
      intervalDuration: 1800,
      targetServiceLevel: 0.80,
      targetAnswerTime: 20,
      shrinkage: 0.30,
    });

    expect(result.rawAgentsRequired).toBe(0);
    expect(result.adjustedAgentsRequired).toBe(0);
  });

  it('should converge for high traffic intensity', () => {
    const result = calculator.calculateStaffing({
      callVolume: 500,
      averageHandleTime: 600,   // 10 minutes AHT
      intervalDuration: 1800,
      targetServiceLevel: 0.95, // aggressive SLA
      targetAnswerTime: 10,
      shrinkage: 0.25,
    });

    expect(result.converged).toBe(true);
    expect(result.iterations).toBeLessThan(1000);
    expect(result.achievedServiceLevel).toBeGreaterThanOrEqual(0.95);
  });

  it('should throw CC_017 when convergence fails', () => {
    expect(() =>
      calculator.calculateStaffing({
        callVolume: 10000,
        averageHandleTime: 3600,
        intervalDuration: 60,     // impossibly short interval
        targetServiceLevel: 0.999,
        targetAnswerTime: 1,
        shrinkage: 0.99,          // 99% shrinkage
      })
    ).toThrowError(expect.objectContaining({ code: 'CC_017' }));
  });

  it('should produce accurate Erlang-C probability', () => {
    // Known reference: traffic intensity = 10 Erlangs, 12 agents
    // P(wait) should be approximately 0.6346
    const pWait = calculator.erlangCProbability(10, 12);
    expect(pWait).toBeCloseTo(0.6346, 2);
  });
});
```

#### IVR Flow Traversal Tests

```typescript
describe('IvrFlowEngine', () => {
  it('should traverse a simple menu ? queue flow', () => {
    const flow = createMockFlow([
      { id: 'start', type: 'greeting', next: 'menu' },
      { id: 'menu', type: 'dtmf_menu', options: { '1': 'sales', '2': 'support' } },
      { id: 'sales', type: 'queue_transfer', queueId: 'queue_sales' },
      { id: 'support', type: 'queue_transfer', queueId: 'queue_support' },
    ]);
    const engine = new IvrFlowEngine(flow);

    const result = engine.traverse('start', [{ type: 'dtmf', value: '1' }]);
    expect(result.terminalNode).toBe('sales');
    expect(result.action).toEqual({ type: 'queue_transfer', queueId: 'queue_sales' });
  });

  it('should detect cycles and throw CC_011', () => {
    const flow = createMockFlow([
      { id: 'a', type: 'greeting', next: 'b' },
      { id: 'b', type: 'dtmf_menu', options: { '1': 'a' } }, // cycle: b ? a ? b
    ]);
    const engine = new IvrFlowEngine(flow);

    expect(() => engine.validate()).toThrowError(
      expect.objectContaining({ code: 'CC_011' })
    );
  });

  it('should handle timeout fallback in DTMF nodes', () => {
    const flow = createMockFlow([
      { id: 'menu', type: 'dtmf_menu', options: { '1': 'sales' }, timeout: 'retry', maxRetries: 3, fallback: 'operator' },
      { id: 'sales', type: 'queue_transfer', queueId: 'queue_sales' },
      { id: 'operator', type: 'queue_transfer', queueId: 'queue_operator' },
    ]);
    const engine = new IvrFlowEngine(flow);

    // Simulate 3 timeouts ? should fall back to operator
    const result = engine.traverse('menu', [
      { type: 'timeout' },
      { type: 'timeout' },
      { type: 'timeout' },
    ]);
    expect(result.terminalNode).toBe('operator');
  });

  it('should validate all nodes have valid connections', () => {
    const flow = createMockFlow([
      { id: 'start', type: 'greeting', next: 'nonexistent' },
    ]);
    const engine = new IvrFlowEngine(flow);

    expect(() => engine.validate()).toThrowError(
      expect.objectContaining({ code: 'CC_010' })
    );
  });

  it('should enforce max depth limit', () => {
    // Create a chain of 60 nodes (exceeds CC_IVR_MAX_FLOW_DEPTH of 50)
    const nodes = Array.from({ length: 60 }, (_, i) => ({
      id: `node_${i}`,
      type: 'greeting' as const,
      next: i < 59 ? `node_${i + 1}` : undefined,
    }));
    const flow = createMockFlow(nodes);
    const engine = new IvrFlowEngine(flow, { maxDepth: 50 });

    expect(() => engine.validate()).toThrowError(/max depth/i);
  });
});
```

### Integration Tests

#### Queue Lifecycle Tests

```typescript
describe('Queue Lifecycle (Integration)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext({ module: 'contact-center' });
    await ctx.seed.queues(['sales-inbound', 'support-tier1']);
    await ctx.seed.agents(5, { state: 'AVAILABLE', queues: ['sales-inbound'] });
  });

  afterEach(() => ctx.cleanup());

  it('should route interaction through full lifecycle: enqueue ? assign ? handle ? wrap-up ? complete', async () => {
    // 1. Enqueue interaction
    const interaction = await ctx.trpc.contactCenter.queue.enqueue.mutate({
      queueId: 'sales-inbound',
      channel: 'voice',
      customerId: 'cust_001',
      priority: 5,
    });
    expect(interaction.status).toBe('QUEUED');

    // 2. Routing engine assigns to available agent
    await ctx.advanceRoutingCycle();
    const assigned = await ctx.trpc.contactCenter.interaction.get.query({
      interactionId: interaction.id,
    });
    expect(assigned.status).toBe('ASSIGNED');
    expect(assigned.agentId).toBeDefined();

    // 3. Agent accepts and handles
    await ctx.trpc.contactCenter.agent.acceptInteraction.mutate({
      interactionId: interaction.id,
    });
    const handling = await ctx.trpc.contactCenter.interaction.get.query({
      interactionId: interaction.id,
    });
    expect(handling.status).toBe('HANDLING');

    // 4. Agent completes with wrap-up code
    await ctx.trpc.contactCenter.agent.completeInteraction.mutate({
      interactionId: interaction.id,
      wrapUpCode: 'SALE_COMPLETED',
      notes: 'Customer purchased premium plan',
    });
    const completed = await ctx.trpc.contactCenter.interaction.get.query({
      interactionId: interaction.id,
    });
    expect(completed.status).toBe('COMPLETED');
    expect(completed.wrapUpCode).toBe('SALE_COMPLETED');

    // 5. Agent transitions through ACW back to available
    const agent = await ctx.trpc.contactCenter.agent.get.query({
      agentId: assigned.agentId,
    });
    expect(agent.state).toBe('ACW');

    // After ACW timeout
    await ctx.advanceTime(120_000); // 2 minutes
    const readyAgent = await ctx.trpc.contactCenter.agent.get.query({
      agentId: assigned.agentId,
    });
    expect(readyAgent.state).toBe('AVAILABLE');
  });

  it('should handle queue overflow when capacity is reached', async () => {
    // Fill queue to capacity
    const queue = await ctx.trpc.contactCenter.queue.get.query({ queueId: 'sales-inbound' });
    await ctx.seed.interactions(queue.maxSize, { queueId: 'sales-inbound', status: 'QUEUED' });

    // Next enqueue should trigger overflow
    await expect(
      ctx.trpc.contactCenter.queue.enqueue.mutate({
        queueId: 'sales-inbound',
        channel: 'voice',
        customerId: 'cust_overflow',
      })
    ).rejects.toThrowError(expect.objectContaining({ code: 'CC_005' }));
  });

  it('should emit SLA breach event when threshold exceeded', async () => {
    const events: any[] = [];
    ctx.on('sla:breach', (e) => events.push(e));

    const interaction = await ctx.trpc.contactCenter.queue.enqueue.mutate({
      queueId: 'sales-inbound',
      channel: 'voice',
      customerId: 'cust_sla',
    });

    // Set all agents to unavailable so interaction waits
    await ctx.setAllAgentStates('sales-inbound', 'BREAK');

    // Advance past SLA threshold (default: 20 seconds for 80% target)
    await ctx.advanceTime(25_000);
    await ctx.advanceRoutingCycle();

    expect(events).toHaveLength(1);
    expect(events[0].interactionId).toBe(interaction.id);
    expect(events[0].code).toBe('CC_008');
  });
});
```

#### Agent State Transition Tests

```typescript
describe('Agent State Machine (Integration)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext({ module: 'contact-center' });
    await ctx.seed.agents(1, { state: 'OFFLINE' });
  });

  afterEach(() => ctx.cleanup());

  const validTransitions: [string, string][] = [
    ['OFFLINE', 'AVAILABLE'],
    ['AVAILABLE', 'ON_CALL'],
    ['AVAILABLE', 'BREAK'],
    ['AVAILABLE', 'OFFLINE'],
    ['ON_CALL', 'ACW'],
    ['ON_CALL', 'AVAILABLE'],    // direct available (no ACW required)
    ['ACW', 'AVAILABLE'],
    ['ACW', 'BREAK'],
    ['BREAK', 'AVAILABLE'],
    ['BREAK', 'OFFLINE'],
  ];

  const invalidTransitions: [string, string][] = [
    ['OFFLINE', 'ON_CALL'],
    ['OFFLINE', 'ACW'],
    ['OFFLINE', 'BREAK'],
    ['ON_CALL', 'OFFLINE'],
    ['ON_CALL', 'BREAK'],
    ['ACW', 'ON_CALL'],
    ['ACW', 'OFFLINE'],
    ['BREAK', 'ON_CALL'],
    ['BREAK', 'ACW'],
  ];

  validTransitions.forEach(([from, to]) => {
    it(`should allow transition: ${from} ? ${to}`, async () => {
      await ctx.setAgentState(0, from);
      await expect(
        ctx.trpc.contactCenter.agent.changeState.mutate({
          agentId: ctx.agents[0].id,
          newState: to,
        })
      ).resolves.toMatchObject({ state: to });
    });
  });

  invalidTransitions.forEach(([from, to]) => {
    it(`should reject transition: ${from} ? ${to}`, async () => {
      await ctx.setAgentState(0, from);
      await expect(
        ctx.trpc.contactCenter.agent.changeState.mutate({
          agentId: ctx.agents[0].id,
          newState: to,
        })
      ).rejects.toThrowError(expect.objectContaining({ code: 'CC_003' }));
    });
  });

  it('should track state change history with timestamps', async () => {
    await ctx.setAgentState(0, 'OFFLINE');
    await ctx.trpc.contactCenter.agent.changeState.mutate({
      agentId: ctx.agents[0].id,
      newState: 'AVAILABLE',
    });
    await ctx.trpc.contactCenter.agent.changeState.mutate({
      agentId: ctx.agents[0].id,
      newState: 'BREAK',
      reason: 'lunch',
    });

    const history = await ctx.trpc.contactCenter.agent.stateHistory.query({
      agentId: ctx.agents[0].id,
      limit: 10,
    });

    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({ fromState: 'OFFLINE', toState: 'AVAILABLE' });
    expect(history[1]).toMatchObject({ fromState: 'AVAILABLE', toState: 'BREAK', reason: 'lunch' });
    expect(new Date(history[1].timestamp).getTime()).toBeGreaterThan(
      new Date(history[0].timestamp).getTime()
    );
  });

  it('should broadcast state change events via WebSocket', async () => {
    const wsMessages: any[] = [];
    const ws = ctx.createWebSocket('supervisor');
    ws.on('agent:state_change', (msg: any) => wsMessages.push(msg));

    await ctx.setAgentState(0, 'OFFLINE');
    await ctx.trpc.contactCenter.agent.changeState.mutate({
      agentId: ctx.agents[0].id,
      newState: 'AVAILABLE',
    });

    await ctx.waitForWsMessage();
    expect(wsMessages).toHaveLength(1);
    expect(wsMessages[0]).toMatchObject({
      agentId: ctx.agents[0].id,
      previousState: 'OFFLINE',
      newState: 'AVAILABLE',
    });
  });
});
```

### Coverage Targets

| Category | Target | Current | Notes |
|----------|--------|---------|-------|
| **Overall** | = 85% | � | Line coverage across all source files |
| **Routing Algorithms** | = 95% | � | Critical path: all routing strategies and edge cases |
| **Erlang-C Calculator** | = 98% | � | Mathematical correctness is paramount |
| **IVR Flow Engine** | = 95% | � | All node types, traversal paths, and validation rules |
| **Agent State Machine** | 100% | � | All valid/invalid transitions must be tested |
| **Queue Operations** | = 90% | � | Enqueue, dequeue, overflow, priority handling |
| **QA Scoring** | = 90% | � | Scorecard validation, weight calculations, calibration |
| **WFM Scheduling** | = 90% | � | Schedule generation, conflict detection, adherence |
| **WebSocket Events** | = 85% | � | Real-time event emission and subscription handling |
| **API Endpoints (tRPC)** | = 90% | � | All mutations and queries with auth/validation |
| **Error Paths** | = 90% | � | All CC_xxx error codes should have triggering tests |

### Test Commands

```bash
# Run all contact center tests
pnpm test --filter=@mcv/nexus-contact-center

# Run unit tests only
pnpm test:unit --filter=@mcv/nexus-contact-center

# Run integration tests only (requires test database)
pnpm test:integration --filter=@mcv/nexus-contact-center

# Run with coverage report
pnpm test:coverage --filter=@mcv/nexus-contact-center

# Run specific test suite
pnpm test --filter=@mcv/nexus-contact-center -- --grep "ErlangC"

# Run tests in watch mode during development
pnpm test:watch --filter=@mcv/nexus-contact-center
```

