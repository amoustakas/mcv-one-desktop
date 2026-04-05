# @mcv/compliance/responsible-gaming

> **Tier 5 Domain Module — MCV-Only**
> Player protection, harm prevention, and responsible gaming enforcement.

| Field | Value |
|---|---|
| **Package** | `@mcv/compliance/responsible-gaming` |
| **Tier** | 5 (Domain) |
| **Scope** | MCV-Only (BetEdge primary, MCV Studios secondary) |
| **Owner** | Compliance & Player Safety Team |
| **Since** | 0.1.0 |
| **Status** | Production — Regulatory Critical |

---

## Purpose

Responsible gaming is the ethical and legal cornerstone of any gambling operation. This module implements comprehensive player protection mechanisms that detect, prevent, and mitigate gambling-related harm. It enforces self-exclusion programs, deposit and loss limits, session time controls, reality checks, and behavioral risk detection — all of which are mandatory under the regulatory frameworks of every jurisdiction in which MCV operates. This is not optional functionality; it is a hard legal requirement, and failures here carry license-revocation consequences.

The system operates on a defense-in-depth philosophy: multiple overlapping safeguards ensure that no single point of failure can leave a vulnerable player unprotected. Deposit limits cap financial exposure. Time limits prevent marathon sessions. Reality checks interrupt play to force reflection. Behavioral risk models continuously analyze player activity for patterns associated with problem gambling — chasing losses, escalating bet sizes, late-night sessions, rapid deposit cycles — and trigger automated interventions ranging from gentle nudges to forced account restrictions. Self-exclusion provides the ultimate safety valve, allowing players to lock themselves out entirely with legally mandated cooling-off periods before any reversal.

Every interaction with this module is immutably audited. Regulatory bodies (UK Gambling Commission, Malta Gaming Authority, state-level US gaming commissions) require complete audit trails demonstrating that responsible gaming controls were active, that interventions fired when they should have, and that self-exclusion was enforced without exception. This module integrates with external exclusion registries (GAMSTOP, state-level exclusion databases), KYC/age-verification pipelines, and the ML-based intelligence layer for real-time risk scoring. It is, by design, the one system that cannot be overridden by business logic — player safety always wins.

---

## Exports

```typescript
// @mcv/compliance/responsible-gaming

// ── Core Service ─────────────────────────────────────────────
export { ResponsibleGamingService } from './services/responsible-gaming.service';
export { ResponsibleGamingRouter } from './router';

// ── Limit Management ─────────────────────────────────────────
export { DepositLimitService } from './services/deposit-limit.service';
export { LossLimitService } from './services/loss-limit.service';
export { TimeLimitService } from './services/time-limit.service';
export { WagerLimitService } from './services/wager-limit.service';
export { LimitEnforcementEngine } from './engines/limit-enforcement.engine';
export { CoolingOffManager } from './services/cooling-off.manager';

// ── Self-Exclusion ───────────────────────────────────────────
export { SelfExclusionService } from './services/self-exclusion.service';
export { GamstopIntegration } from './integrations/gamstop.integration';
export { MultiVenueExclusionSync } from './integrations/multi-venue-exclusion.sync';
export { ExclusionRegistryAdapter } from './adapters/exclusion-registry.adapter';

// ── Reality Checks ───────────────────────────────────────────
export { RealityCheckService } from './services/reality-check.service';
export { RealityCheckScheduler } from './schedulers/reality-check.scheduler';
export { SessionTracker } from './services/session-tracker.service';

// ── Risk Assessment ──────────────────────────────────────────
export { RiskAssessmentEngine } from './engines/risk-assessment.engine';
export { BehavioralAnalyzer } from './analyzers/behavioral.analyzer';
export { PatternDetector } from './analyzers/pattern-detector.analyzer';
export { RiskScorer } from './engines/risk-scorer.engine';
export { RiskModelRegistry } from './models/risk-model.registry';

// ── Interventions ────────────────────────────────────────────
export { InterventionService } from './services/intervention.service';
export { InterventionOrchestrator } from './engines/intervention.orchestrator';
export { InterventionTemplates } from './templates/intervention.templates';
export { EscalationManager } from './services/escalation.manager';

// ── Underage Prevention ──────────────────────────────────────
export { UnderagePreventionService } from './services/underage-prevention.service';
export { AgeVerificationGate } from './gates/age-verification.gate';

// ── Messaging & Resources ────────────────────────────────────
export { ResponsibleGamingMessaging } from './services/rg-messaging.service';
export { HelpResourceDirectory } from './resources/help-resource.directory';

// ── Event Streams ────────────────────────────────────────────
export { ResponsibleGamingEvents } from './events/rg.events';
export { RGEventConsumer } from './events/rg-event.consumer';
export { RGEventProducer } from './events/rg-event.producer';

// ── Types ────────────────────────────────────────────────────
export type {
  PlayerLimits,
  DepositLimit,
  LossLimit,
  TimeLimit,
  WagerLimit,
  LimitChangeRequest,
  LimitHistory,
  CoolingOffPeriod,
  SelfExclusionRecord,
  SelfExclusionRequest,
  ExclusionScope,
  ExclusionStatus,
  RealityCheckConfig,
  RealityCheckSnapshot,
  SessionSummary,
  RiskAssessment,
  RiskScore,
  RiskFactor,
  RiskLevel,
  BehavioralIndicator,
  PatternMatch,
  Intervention,
  InterventionType,
  InterventionOutcome,
  EscalationLevel,
  InterventionTemplate,
  ResponsibleGamingConfig,
  JurisdictionRules,
  RegulatoryReport,
  AuditEntry,
} from './types';

// ── Schemas (Drizzle) ────────────────────────────────────────
export {
  playerLimits,
  selfExclusions,
  realityChecks,
  riskAssessments,
  interventions,
  gamingSessions,
  limitChangeHistory,
  rgAuditLog,
  exclusionRegistrySync,
  interventionTemplates,
} from './schema';

// ── tRPC Router ──────────────────────────────────────────────
export { responsibleGamingRouter } from './router';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        RESPONSIBLE GAMING ARCHITECTURE                          │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         PLAYER ACTIVITY LAYER                            │   │
│  │                                                                          │   │
│  │   Deposits    Wagers     Logins     Session     Withdrawals   Account    │   │
│  │      │          │          │        Duration        │         Changes    │   │
│  │      └──────────┴──────────┴────┬───────┴───────────┴────────────┘      │   │
│  └─────────────────────────────────┼────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                      REDPANDA EVENT STREAM                               │   │
│  │                                                                          │   │
│  │   Topic: rg.player.activity    Topic: rg.limits.events                   │   │
│  │   Topic: rg.risk.signals       Topic: rg.interventions                   │   │
│  │   Topic: rg.exclusions         Topic: rg.audit                           │   │
│  └────────────────────────┬─────────────────────────────────────────────────┘   │
│                           │                                                     │
│              ┌────────────┼────────────┐                                        │
│              ▼            ▼            ▼                                         │
│  ┌───────────────┐ ┌───────────┐ ┌──────────────┐                              │
│  │    LIMIT      │ │  SESSION  │ │  BEHAVIORAL   │                              │
│  │  ENFORCEMENT  │ │  TRACKER  │ │   ANALYZER    │                              │
│  │    ENGINE     │ │           │ │               │                              │
│  │               │ │ • Duration│ │ • Pattern     │                              │
│  │ • Deposit     │ │ • Breaks  │ │   detection   │                              │
│  │ • Loss        │ │ • Time-of │ │ • Chasing     │                              │
│  │ • Wager       │ │   -day    │ │   losses      │                              │
│  │ • Time        │ │ • Reality │ │ • Escalation  │                              │
│  │               │ │   checks  │ │ • Late-night  │                              │
│  └──────┬────────┘ └─────┬─────┘ │ • Velocity    │                              │
│         │                │       └──────┬─────────┘                              │
│         │                │              │                                        │
│         └────────────────┼──────────────┘                                        │
│                          │                                                       │
│                          ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                       RISK ASSESSMENT ENGINE                             │   │
│  │                                                                          │   │
│  │   ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────┐     │   │
│  │   │  Rule-   │  │  ML Risk     │  │  Composite │  │  Jurisdiction│     │   │
│  │   │  Based   │──│  Model       │──│  Risk      │──│  Rules       │     │   │
│  │   │  Checks  │  │  (via @mcv/  │  │  Scorer    │  │  Overlay     │     │   │
│  │   │          │  │  intelligence│  │            │  │              │     │   │
│  │   └──────────┘  └──────────────┘  └─────┬──────┘  └──────────────┘     │   │
│  │                                         │                               │   │
│  │                          Risk Score: 0-1000                             │   │
│  │                    LOW (0-250) │ MED (251-500)                          │   │
│  │                   HIGH (501-750) │ CRITICAL (751-1000)                  │   │
│  └─────────────────────────────────┼────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    INTERVENTION ORCHESTRATOR                              │   │
│  │                                                                          │   │
│  │   Level 1 (Nudge)        Level 2 (Warning)      Level 3 (Restriction)   │   │
│  │   ┌──────────────┐       ┌──────────────┐       ┌──────────────┐        │   │
│  │   │ • RG message │       │ • Popup alert│       │ • Forced     │        │   │
│  │   │ • Helpline   │       │ • Forced     │       │   cool-down  │        │   │
│  │   │   info       │       │   break      │       │ • Deposit    │        │   │
│  │   │ • Session    │       │ • Limit      │       │   freeze     │        │   │
│  │   │   summary    │       │   suggestion │       │ • Account    │        │   │
│  │   └──────────────┘       └──────────────┘       │   review     │        │   │
│  │                                                  └──────────────┘        │   │
│  │   Level 4 (Escalation)   Level 5 (Lock)                                 │   │
│  │   ┌──────────────┐       ┌──────────────┐                               │   │
│  │   │ • Manual     │       │ • Account    │                               │   │
│  │   │   review     │       │   suspended  │                               │   │
│  │   │ • Outbound   │       │ • Mandatory  │                               │   │
│  │   │   call       │       │   exclusion  │                               │   │
│  │   │ • Restrict   │       │ • Regulator  │                               │   │
│  │   │   products   │       │   notified   │                               │   │
│  │   └──────────────┘       └──────────────┘                               │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                      EXTERNAL INTEGRATIONS                               │   │
│  │                                                                          │   │
│  │   ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────┐     │   │
│  │   │ GAMSTOP  │  │  State-Level │  │  KYC / Age │  │  Support     │     │   │
│  │   │ (UK)     │  │  Exclusion   │  │  Verify    │  │  Channels    │     │   │
│  │   │          │  │  Databases   │  │  (@mcv/    │  │  (Phone,     │     │   │
│  │   │          │  │  (US/AU)     │  │  kyc)      │  │   Chat)      │     │   │
│  │   └──────────┘  └──────────────┘  └────────────┘  └──────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                       AUDIT & REPORTING                                  │   │
│  │                                                                          │   │
│  │   Immutable audit log  →  Regulatory reports  →  Compliance dashboard    │   │
│  │   (every action, every limit change, every intervention, every outcome)  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### ResponsibleGamingService

The top-level orchestration service. All responsible gaming operations route through here.

```typescript
import { z } from 'zod';

// ── Enumerations ─────────────────────────────────────────────

export const RiskLevel = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type RiskLevel = z.infer<typeof RiskLevel>;

export const LimitType = z.enum(['DEPOSIT', 'LOSS', 'WAGER', 'TIME', 'SESSION']);
export type LimitType = z.infer<typeof LimitType>;

export const LimitPeriod = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL']);
export type LimitPeriod = z.infer<typeof LimitPeriod>;

export const ExclusionScope = z.enum([
  'SINGLE_BRAND',     // Just this operator
  'MULTI_VENUE',      // All venues under this license
  'NATIONAL',         // GAMSTOP / national registry
  'JURISDICTION',     // All operators in jurisdiction
]);
export type ExclusionScope = z.infer<typeof ExclusionScope>;

export const ExclusionDuration = z.enum([
  'SIX_MONTHS',
  'ONE_YEAR',
  'TWO_YEARS',
  'FIVE_YEARS',
  'PERMANENT',
]);
export type ExclusionDuration = z.infer<typeof ExclusionDuration>;

export const InterventionType = z.enum([
  'NUDGE',              // Gentle reminder / RG message
  'REALITY_CHECK',      // Session stats popup
  'WARNING',            // Explicit warning about behavior
  'FORCED_BREAK',       // Mandatory session pause
  'LIMIT_SUGGESTION',   // Suggest setting/lowering a limit
  'DEPOSIT_FREEZE',     // Temporary deposit block
  'PRODUCT_RESTRICTION',// Block certain high-risk products
  'ACCOUNT_REVIEW',     // Flag for manual compliance review
  'OUTBOUND_CONTACT',   // Phone/email from support team
  'ACCOUNT_SUSPENSION', // Temporary account lock
  'MANDATORY_EXCLUSION',// Operator-initiated exclusion
]);
export type InterventionType = z.infer<typeof InterventionType>;

export const InterventionOutcome = z.enum([
  'ACKNOWLEDGED',       // Player saw and dismissed
  'ACCEPTED',           // Player accepted suggestion
  'DECLINED',           // Player declined suggestion
  'ENFORCED',           // Automatically enforced (no choice)
  'ESCALATED',          // Escalated to next level
  'EXPIRED',            // Timed out without response
  'PENDING',            // Awaiting player or staff action
]);
export type InterventionOutcome = z.infer<typeof InterventionOutcome>;

// ── Core Types ───────────────────────────────────────────────

export interface PlayerLimits {
  playerId: string;
  tenantId: string;
  limits: LimitEntry[];
  pendingChanges: LimitChangeRequest[];
  effectiveAt: Date;
}

export interface LimitEntry {
  id: string;
  type: LimitType;
  period: LimitPeriod;
  /** Limit amount in minor currency units (cents/pence) */
  amount: number;
  /** Amount consumed in current period */
  consumed: number;
  /** Currency code (ISO 4217) */
  currency: string;
  /** When this limit was set */
  setAt: Date;
  /** When this period resets */
  resetsAt: Date;
  /** Whether this limit was operator-imposed (vs player-chosen) */
  operatorImposed: boolean;
  /** Jurisdiction that mandates this limit (if any) */
  jurisdictionMandate: string | null;
}

export interface LimitChangeRequest {
  id: string;
  playerId: string;
  tenantId: string;
  limitType: LimitType;
  period: LimitPeriod;
  /** Current limit amount */
  currentAmount: number;
  /** Requested new amount */
  requestedAmount: number;
  currency: string;
  /** Direction: 'INCREASE' requires cooling-off; 'DECREASE' is immediate */
  direction: 'INCREASE' | 'DECREASE';
  /** When the request was submitted */
  requestedAt: Date;
  /** When the change takes effect (after cooling-off for increases) */
  effectiveAt: Date;
  /** Cooling-off duration in hours */
  coolingOffHours: number;
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
}

export interface SelfExclusionRecord {
  id: string;
  playerId: string;
  tenantId: string;
  scope: ExclusionScope;
  duration: ExclusionDuration;
  /** Exact start timestamp */
  startedAt: Date;
  /** Exact end timestamp (null for permanent) */
  endsAt: Date | null;
  /** Whether this is currently active */
  active: boolean;
  /** External registry ID (e.g., GAMSTOP reference) */
  externalRegistryId: string | null;
  /** Reason provided by player (optional) */
  playerReason: string | null;
  /** Whether the player was offered support resources at time of exclusion */
  supportOffered: boolean;
  /** Reversal details (if applicable, only after cooling-off) */
  reversal: ExclusionReversal | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExclusionReversal {
  requestedAt: Date;
  coolingOffEndsAt: Date;
  /** Minimum 24h cooling-off; some jurisdictions require 7+ days */
  coolingOffHours: number;
  /** Whether a support interaction was completed before reversal */
  supportInteractionCompleted: boolean;
  /** Staff member who approved (if manual approval required) */
  approvedBy: string | null;
  status: 'COOLING_OFF' | 'PENDING_APPROVAL' | 'APPROVED' | 'DENIED' | 'CANCELLED';
}

export interface RealityCheckConfig {
  playerId: string;
  tenantId: string;
  /** Interval in minutes between reality checks */
  intervalMinutes: number;
  /** Whether reality checks are enabled (player can't disable if jurisdiction mandates) */
  enabled: boolean;
  /** Whether the jurisdiction mandates reality checks */
  mandated: boolean;
  /** Minimum interval allowed by jurisdiction (in minutes) */
  minimumIntervalMinutes: number;
  /** What information to include in the reality check */
  includeFields: RealityCheckField[];
}

export type RealityCheckField =
  | 'TIME_PLAYED'
  | 'TOTAL_DEPOSITED'
  | 'TOTAL_WAGERED'
  | 'TOTAL_WON'
  | 'TOTAL_LOST'
  | 'NET_POSITION'
  | 'SESSION_DURATION'
  | 'HELP_RESOURCES';

export interface RealityCheckSnapshot {
  id: string;
  playerId: string;
  tenantId: string;
  sessionId: string;
  /** When this reality check was triggered */
  triggeredAt: Date;
  /** When the player responded (null if still pending) */
  respondedAt: Date | null;
  /** Time played in current session (minutes) */
  sessionDurationMinutes: number;
  /** Net position in minor currency units (negative = net loss) */
  netPosition: number;
  /** Total deposited in minor currency units since session start */
  totalDeposited: number;
  /** Total wagered in minor currency units since session start */
  totalWagered: number;
  currency: string;
  /** Player's response */
  response: 'CONTINUE' | 'END_SESSION' | 'SET_LIMIT' | 'TIMEOUT';
  /** If response was SET_LIMIT, the limit they set */
  limitSet: LimitEntry | null;
}

export interface RiskAssessment {
  id: string;
  playerId: string;
  tenantId: string;
  /** Composite risk score (0-1000) */
  score: number;
  level: RiskLevel;
  /** Individual risk factors contributing to the score */
  factors: RiskFactor[];
  /** ML model version used for assessment */
  modelVersion: string;
  /** Raw model output (for audit) */
  modelOutput: Record<string, unknown>;
  /** Whether this assessment triggered an intervention */
  triggeredIntervention: boolean;
  /** Assessment timestamp */
  assessedAt: Date;
  /** Time window this assessment covers */
  windowStart: Date;
  windowEnd: Date;
}

export interface RiskFactor {
  name: string;
  category: RiskFactorCategory;
  /** Weight of this factor in composite score (0-1) */
  weight: number;
  /** Raw value of the indicator */
  value: number;
  /** Normalized score for this factor (0-1000) */
  normalizedScore: number;
  /** Human-readable description */
  description: string;
  /** Evidence supporting this factor */
  evidence: Record<string, unknown>;
}

export type RiskFactorCategory =
  | 'FINANCIAL'        // Deposit velocity, loss chasing, spend vs income
  | 'TEMPORAL'         // Late-night play, session duration, frequency
  | 'BEHAVIORAL'       // Bet escalation, chasing patterns, product switching
  | 'ACCOUNT'          // Multiple payment methods, limit changes, bonus abuse
  | 'ENGAGEMENT'       // Login frequency, time between sessions, obsessive patterns
  | 'CONTEXTUAL';      // Time of month (payday), event-driven spikes

export interface Intervention {
  id: string;
  playerId: string;
  tenantId: string;
  /** Risk assessment that triggered this intervention */
  riskAssessmentId: string;
  type: InterventionType;
  /** Escalation level (1-5) */
  level: number;
  /** The message/content shown to the player */
  content: InterventionContent;
  /** When the intervention was created */
  createdAt: Date;
  /** When it was delivered to the player */
  deliveredAt: Date | null;
  /** Player's response */
  outcome: InterventionOutcome;
  /** When the outcome was recorded */
  outcomeAt: Date | null;
  /** If escalated, the next intervention ID */
  escalatedToId: string | null;
  /** Staff notes (for manual review interventions) */
  staffNotes: string | null;
  /** Whether this intervention was auto-generated or manual */
  automated: boolean;
}

export interface InterventionContent {
  title: string;
  body: string;
  /** Call-to-action buttons */
  actions: InterventionAction[];
  /** Help resources to display */
  helpResources: HelpResource[];
  /** Whether the player must interact before continuing */
  blocking: boolean;
  /** Timeout in seconds (null = no timeout, must interact) */
  timeoutSeconds: number | null;
}

export interface InterventionAction {
  label: string;
  action: string;
  /** Whether this action is the "safe" choice (visually emphasized) */
  recommended: boolean;
}

export interface HelpResource {
  name: string;
  description: string;
  url: string | null;
  phone: string | null;
  available24h: boolean;
  jurisdictions: string[];
}

export interface SessionSummary {
  sessionId: string;
  playerId: string;
  tenantId: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number;
  /** Number of bets placed */
  betCount: number;
  /** Total wagered in minor currency units */
  totalWagered: number;
  /** Total won in minor currency units */
  totalWon: number;
  /** Net position (won - wagered) */
  netPosition: number;
  currency: string;
  /** Number of deposits during session */
  depositCount: number;
  /** Total deposited during session */
  totalDeposited: number;
  /** Number of reality checks shown */
  realityChecksShown: number;
  /** Number of interventions triggered */
  interventionsTriggered: number;
  /** How the session ended */
  endReason: 'PLAYER_LOGOUT' | 'TIME_LIMIT' | 'FORCED_BREAK' | 'SELF_EXCLUSION' | 'TIMEOUT' | 'INTERVENTION' | null;
  /** Products used during session */
  productsUsed: string[];
}

// ── Service Interface ────────────────────────────────────────

export interface IResponsibleGamingService {
  // Limits
  getPlayerLimits(playerId: string, tenantId: string): Promise<PlayerLimits>;
  setLimit(playerId: string, tenantId: string, req: SetLimitRequest): Promise<LimitEntry>;
  requestLimitIncrease(playerId: string, tenantId: string, req: LimitIncreaseRequest): Promise<LimitChangeRequest>;
  cancelLimitIncrease(playerId: string, tenantId: string, requestId: string): Promise<void>;
  checkLimitAvailability(playerId: string, tenantId: string, type: LimitType, amount: number): Promise<LimitCheckResult>;

  // Self-Exclusion
  selfExclude(playerId: string, tenantId: string, req: SelfExclusionRequest): Promise<SelfExclusionRecord>;
  getExclusionStatus(playerId: string, tenantId: string): Promise<SelfExclusionRecord | null>;
  requestExclusionReversal(playerId: string, tenantId: string, exclusionId: string): Promise<ExclusionReversal>;
  checkExternalExclusion(playerId: string, tenantId: string): Promise<ExternalExclusionCheck>;

  // Reality Checks
  getRealityCheckConfig(playerId: string, tenantId: string): Promise<RealityCheckConfig>;
  updateRealityCheckConfig(playerId: string, tenantId: string, config: Partial<RealityCheckConfig>): Promise<RealityCheckConfig>;
  triggerRealityCheck(playerId: string, tenantId: string, sessionId: string): Promise<RealityCheckSnapshot>;
  recordRealityCheckResponse(snapshotId: string, response: RealityCheckSnapshot['response']): Promise<void>;

  // Risk Assessment
  assessRisk(playerId: string, tenantId: string): Promise<RiskAssessment>;
  getRiskHistory(playerId: string, tenantId: string, opts: PaginationOpts): Promise<RiskAssessment[]>;
  getCurrentRiskLevel(playerId: string, tenantId: string): Promise<RiskLevel>;

  // Interventions
  getActiveInterventions(playerId: string, tenantId: string): Promise<Intervention[]>;
  recordInterventionOutcome(interventionId: string, outcome: InterventionOutcome): Promise<void>;
  createManualIntervention(req: ManualInterventionRequest): Promise<Intervention>;

  // Sessions
  startSession(playerId: string, tenantId: string, metadata: SessionMetadata): Promise<string>;
  endSession(sessionId: string, reason: SessionSummary['endReason']): Promise<SessionSummary>;
  getActiveSession(playerId: string, tenantId: string): Promise<SessionSummary | null>;

  // Audit
  getAuditLog(playerId: string, tenantId: string, opts: AuditQueryOpts): Promise<AuditEntry[]>;
  generateRegulatoryReport(tenantId: string, jurisdiction: string, period: DateRange): Promise<RegulatoryReport>;
}

export interface SetLimitRequest {
  type: LimitType;
  period: LimitPeriod;
  amount: number;
  currency: string;
}

export interface LimitIncreaseRequest {
  limitId: string;
  newAmount: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  consumed: number;
  resetsAt: Date;
  /** If not allowed, reason */
  reason: string | null;
}

export interface SelfExclusionRequest {
  scope: ExclusionScope;
  duration: ExclusionDuration;
  reason?: string;
}

export interface ExternalExclusionCheck {
  excluded: boolean;
  registry: string;
  externalId: string | null;
  checkedAt: Date;
}

export interface ManualInterventionRequest {
  playerId: string;
  tenantId: string;
  type: InterventionType;
  content: InterventionContent;
  staffId: string;
  reason: string;
}

export interface SessionMetadata {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  geoLocation: { country: string; region: string };
}

export interface AuditQueryOpts {
  startDate: Date;
  endDate: Date;
  eventTypes?: string[];
  limit?: number;
  offset?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PaginationOpts {
  limit: number;
  offset: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditEntry {
  id: string;
  playerId: string;
  tenantId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  /** IP address at time of event */
  ipAddress: string;
  /** Staff ID if action was staff-initiated */
  staffId: string | null;
  timestamp: Date;
  /** Cryptographic hash for tamper detection */
  integrityHash: string;
}

export interface RegulatoryReport {
  tenantId: string;
  jurisdiction: string;
  period: DateRange;
  generatedAt: Date;
  summary: {
    totalPlayers: number;
    playersWithLimits: number;
    selfExclusions: number;
    interventionsTriggered: number;
    highRiskPlayers: number;
    realityChecksShown: number;
    averageSessionDuration: number;
  };
  /** Full report data for regulatory submission */
  data: Record<string, unknown>;
  /** Report format (PDF, CSV, XML as required by jurisdiction) */
  format: 'PDF' | 'CSV' | 'XML' | 'JSON';
}
```

---

## Database Schemas

All tables use multi-tenant RLS (Row-Level Security) via `tenantId`. Audit-critical tables are append-only.

```typescript
import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── Enums ────────────────────────────────────────────────────

export const limitTypeEnum = pgEnum('rg_limit_type', [
  'DEPOSIT', 'LOSS', 'WAGER', 'TIME', 'SESSION',
]);

export const limitPeriodEnum = pgEnum('rg_limit_period', [
  'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL',
]);

export const limitChangeStatusEnum = pgEnum('rg_limit_change_status', [
  'PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED',
]);

export const exclusionScopeEnum = pgEnum('rg_exclusion_scope', [
  'SINGLE_BRAND', 'MULTI_VENUE', 'NATIONAL', 'JURISDICTION',
]);

export const exclusionDurationEnum = pgEnum('rg_exclusion_duration', [
  'SIX_MONTHS', 'ONE_YEAR', 'TWO_YEARS', 'FIVE_YEARS', 'PERMANENT',
]);

export const exclusionStatusEnum = pgEnum('rg_exclusion_status', [
  'ACTIVE', 'EXPIRED', 'REVERSED', 'SUSPENDED',
]);

export const riskLevelEnum = pgEnum('rg_risk_level', [
  'LOW', 'MEDIUM', 'HIGH', 'CRITICAL',
]);

export const interventionTypeEnum = pgEnum('rg_intervention_type', [
  'NUDGE', 'REALITY_CHECK', 'WARNING', 'FORCED_BREAK',
  'LIMIT_SUGGESTION', 'DEPOSIT_FREEZE', 'PRODUCT_RESTRICTION',
  'ACCOUNT_REVIEW', 'OUTBOUND_CONTACT', 'ACCOUNT_SUSPENSION',
  'MANDATORY_EXCLUSION',
]);

export const interventionOutcomeEnum = pgEnum('rg_intervention_outcome', [
  'ACKNOWLEDGED', 'ACCEPTED', 'DECLINED', 'ENFORCED',
  'ESCALATED', 'EXPIRED', 'PENDING',
]);

export const sessionEndReasonEnum = pgEnum('rg_session_end_reason', [
  'PLAYER_LOGOUT', 'TIME_LIMIT', 'FORCED_BREAK',
  'SELF_EXCLUSION', 'TIMEOUT', 'INTERVENTION',
]);

export const realityCheckResponseEnum = pgEnum('rg_reality_check_response', [
  'CONTINUE', 'END_SESSION', 'SET_LIMIT', 'TIMEOUT',
]);

export const reversalStatusEnum = pgEnum('rg_reversal_status', [
  'COOLING_OFF', 'PENDING_APPROVAL', 'APPROVED', 'DENIED', 'CANCELLED',
]);

// ── Tables ───────────────────────────────────────────────────

/**
 * Player Limits
 *
 * Stores active deposit, loss, wager, and time limits for each player.
 * Limits are per-tenant, per-player, per-type, per-period (unique combo).
 * Decreases take effect immediately. Increases require cooling-off.
 */
export const playerLimits = pgTable('rg_player_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  playerId: uuid('player_id').notNull(),
  type: limitTypeEnum('type').notNull(),
  period: limitPeriodEnum('period').notNull(),
  /** Limit amount in minor currency units */
  amount: bigint('amount', { mode: 'number' }).notNull(),
  /** Amount consumed in current period */
  consumed: bigint('consumed', { mode: 'number' }).notNull().default(0),
  /** ISO 4217 currency code */
  currency: text('currency').notNull().default('USD'),
  /** When the current period started */
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  /** When the current period resets */
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  /** Whether limit was imposed by operator (can't be removed by player) */
  operatorImposed: boolean('operator_imposed').notNull().default(false),
  /** Jurisdiction that mandates this limit */
  jurisdictionMandate: text('jurisdiction_mandate'),
  /** Whether this limit is currently active */
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPlayerIdx: index('rg_pl_tenant_player_idx')
    .on(table.tenantId, table.playerId),
  uniqueLimit: uniqueIndex('rg_pl_unique_limit_idx')
    .on(table.tenantId, table.playerId, table.type, table.period)
    .where(sql`active = true`),
  periodEndIdx: index('rg_pl_period_end_idx')
    .on(table.periodEnd),
}));

/**
 * Limit Change History
 *
 * Tracks every limit change request. Increases have a mandatory cooling-off
 * period (jurisdiction-dependent, minimum 24h for most). Decreases are
 * logged but take effect immediately.
 */
export const limitChangeHistory = pgTable('rg_limit_change_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  playerId: uuid('player_id').notNull(),
  limitId: uuid('limit_id').notNull().references(() => playerLimits.id),
  limitType: limitTypeEnum('limit_type').notNull(),
  period: limitPeriodEnum('period').notNull(),
  previousAmount: bigint('previous_amount', { mode: 'number' }),
  requestedAmount: bigint('requested_amount', { mode: 'number' }).notNull(),
  currency: text('currency').notNull(),
  direction: text('direction').notNull(), // 'INCREASE' | 'DECREASE' | 'NEW'
  /** Cooling-off period in hours (0 for immediate changes) */
  coolingOffHours: integer('cooling_off_hours').notNull().default(0),
  /** When the change takes effect */
  effectiveAt: timestamp('effective_at', { withTimezone: true }).notNull(),
  status: limitChangeStatusEnum('status').notNull().default('PENDING'),
  /** IP address of the requester */
  ipAddress: text('ip_address'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
}, (table) => ({
  tenantPlayerIdx: index('rg_lch_tenant_player_idx')
    .on(table.tenantId, table.playerId),
  statusIdx: index('rg_lch_status_idx')
    .on(table.status),
  effectiveIdx: index('rg_lch_effective_idx')
    .on(table.effectiveAt)
    .where(sql`status = 'PENDING'`),
}));

/**
 * Self-Exclusions
 *
 * Records all self-exclusion events. This is an append-only audit table;
 * exclusions are never deleted, only marked as expired/reversed.
 * Permanent exclusions have endsAt = NULL and cannot be reversed.
 */
export const selfExclusions = pgTable('rg_self_exclusions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  playerId: uuid('player_id').notNull(),
  scope: exclusionScopeEnum('scope').notNull(),
  duration: exclusionDurationEnum('duration').notNull(),
  status: exclusionStatusEnum('status').notNull().default('ACTIVE'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  /** NULL for permanent exclusions */
  endsAt: timestamp('ends_at', { withTimezone: true }),
  /** External registry reference (e.g., GAMSTOP ID) */
  externalRegistryId: text('external_registry_id'),
  /** Name of external registry */
  externalRegistryName: text('external_registry_name'),
  /** Optional reason from the player */
  playerReason: text('player_reason'),
  /** Proof that support resources were offered */
  supportOffered: boolean('support_offered').notNull().default(true),
  /** Timestamp of support resource display (for audit) */
  supportOfferedAt: timestamp('support_offered_at', { withTimezone: true }),
  /** IP address at time of exclusion */
  ipAddress: text('ip_address'),
  /** All products frozen (JSON array) */
  frozenProducts: jsonb('frozen_products').notNull().default(sql`'[]'::jsonb`),
  /** Open bets voided at time of exclusion (JSON) */
  voidedBets: jsonb('voided_bets').notNull().default(sql`'[]'::jsonb`),
  /** Balance at time of exclusion (for refund processing) */
  balanceAtExclusion: bigint('balance_at_exclusion', { mode: 'number' }),
  /** Reversal details (JSON, null if not reversed) */
  reversal: jsonb('reversal'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPlayerIdx: index('rg_se_tenant_player_idx')
    .on(table.tenantId, table.playerId),
  statusIdx: index('rg_se_status_idx')
    .on(table.status),
  activeIdx: index('rg_se_active_idx')
    .on(table.tenantId, table.playerId)
    .where(sql`status = 'ACTIVE'`),
  externalIdx: index('rg_se_external_idx')
    .on(table.externalRegistryId)
    .where(sql`external_registry_id IS NOT NULL`),
}));

/**
 * Reality Checks
 *
 * Logs every reality check shown to a player, their response, and
 * the session data displayed. Required for UK GC compliance.
 */
export const realityChecks = pgTable('rg_reality_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  playerId: uuid('player_id').notNull(),
  sessionId: uuid('session_id').notNull().references(() => gamingSessions.id),
  triggeredAt: timestamp('triggered_at', { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
  /** Minutes into the session when triggered */
  sessionMinutesAtTrigger: integer('session_minutes_at_trigger').notNull(),
  /** Net position shown in minor currency units */
  netPositionShown: bigint('net_position_shown', { mode: 'number' }).notNull(),
  /** Total deposited shown */
  totalDepositedShown: bigint('total_deposited_shown', { mode: 'number' }).notNull(),
  /** Total wagered shown */
  totalWageredShown: bigint('total_wagered_shown', { mode: 'number' }).notNull(),
  currency: text('currency').notNull(),
  response: realityCheckResponseEnum('response'),
  /** If SET_LIMIT, details of the limit set */
  limitSetDetails: jsonb('limit_set_details'),
  /** Full snapshot of what was displayed (for audit) */
  displayedContent: jsonb('displayed_content').notNull(),
  /** Whether the check was jurisdiction-mandated */
  mandated: boolean('mandated').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPlayerIdx: index('rg_rc_tenant_player_idx')
    .on(table.tenantId, table.playerId),
  sessionIdx: index('rg_rc_session_idx')
    .on(table.sessionId),
  triggeredIdx: index('rg_rc_triggered_idx')
    .on(table.triggeredAt),
}));

/**
 * Risk Assessments
 *
 * Stores every risk assessment performed by the ML engine.
 * Assessments are immutable audit records.
 */
export const riskAssessments = pgTable('rg_risk_assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  playerId: uuid('player_id').notNull(),
  /** Composite risk score (0-1000) */
  score: integer('score').notNull(),
  level: riskLevelEnum('level').notNull(),
  /** Individual risk factors (JSON array) */
  factors: jsonb('factors').notNull(),
  /** ML model identifier and version */
  modelVersion: text('model_version').notNull(),
  /** Raw model output for auditability */
  modelOutput: jsonb('model_output').notNull(),
  /** Whether this assessment triggered an intervention */
  triggeredIntervention: boolean('triggered_intervention').notNull().default(false),
  /** Intervention ID if triggered */
  interventionId: uuid('intervention_id'),
  /** Start of the assessment time window */
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  /** End of the assessment time window */
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
  assessedAt: timestamp('assessed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPlayerIdx: index('rg_ra_tenant_player_idx')
    .on(table.tenantId, table.playerId),
  levelIdx: index('rg_ra_level_idx')
    .on(table.level),
  scoreIdx: index('rg_ra_score_idx')
    .on(table.score),
  assessedIdx: index('rg_ra_assessed_idx')
    .on(table.assessedAt),
  highRiskIdx: index('rg_ra_high_risk_idx')
    .on(table.tenantId, table.playerId, table.level)
    .where(sql`level IN ('HIGH', 'CRITICAL')`),
}));

/**
 * Interventions
 *
 * Every intervention delivered to a player, with outcome tracking.
 * Interventions form a chain via escalatedToId for escalation tracking.
 */
export const interventions = pgTable('rg_interventions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  playerId: uuid('player_id').notNull(),
  riskAssessmentId: uuid('risk_assessment_id').references(() => riskAssessments.id),
  type: interventionTypeEnum('type').notNull(),
  /** Escalation level (1-5) */
  level: integer('level').notNull().default(1),
  /** Intervention content (title, body, actions, resources) */
  content: jsonb('content').notNull(),
  /** Whether the intervention blocks the player from continuing */
  blocking: boolean('blocking').notNull().default(false),
  /** Whether this was automatically triggered vs manually created */
  automated: boolean('automated').notNull().default(true),
  /** Staff who created manual intervention */
  createdByStaffId: uuid('created_by_staff_id'),
  /** Reason for manual intervention */
  manualReason: text('manual_reason'),
  /** When delivered to the player */
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  outcome: interventionOutcomeEnum('outcome').notNull().default('PENDING'),
  outcomeAt: timestamp('outcome_at', { withTimezone: true }),
  /** If escalated, pointer to the next intervention */
  escalatedToId: uuid('escalated_to_id'),
  /** Staff notes */
  staffNotes: text('staff_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPlayerIdx: index('rg_int_tenant_player_idx')
    .on(table.tenantId, table.playerId),
  typeIdx: index('rg_int_type_idx')
    .on(table.type),
  outcomeIdx: index('rg_int_outcome_idx')
    .on(table.outcome),
  pendingIdx: index('rg_int_pending_idx')
    .on(table.tenantId, table.playerId)
    .where(sql`outcome = 'PENDING'`),
  escalationIdx: index('rg_int_escalation_idx')
    .on(table.escalatedToId)
    .where(sql`escalated_to_id IS NOT NULL`),
}));

/**
 * Gaming Sessions
 *
 * Tracks player sessions from login to logout with running tallies.
 * Used for time limits, reality check scheduling, and session-based analytics.
 */
export const gamingSessions = pgTable('rg_gaming_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  playerId: uuid('player_id').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  /** Duration in minutes (updated periodically and on close) */
  durationMinutes: integer('duration_minutes').notNull().default(0),
  endReason: sessionEndReasonEnum('end_reason'),
  betCount: integer('bet_count').notNull().default(0),
  totalWagered: bigint('total_wagered', { mode: 'number' }).notNull().default(0),
  totalWon: bigint('total_won', { mode: 'number' }).notNull().default(0),
  netPosition: bigint('net_position', { mode: 'number' }).notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  depositCount: integer('deposit_count').notNull().default(0),
  totalDeposited: bigint('total_deposited', { mode: 'number' }).notNull().default(0),
  realityChecksShown: integer('reality_checks_shown').notNull().default(0),
  interventionsTriggered: integer('interventions_triggered').notNull().default(0),
  /** Products the player interacted with (JSON array) */
  productsUsed: jsonb('products_used').notNull().default(sql`'[]'::jsonb`),
  /** IP address at session start */
  ipAddress: text('ip_address'),
  /** User agent string */
  userAgent: text('user_agent'),
  /** Device fingerprint for multi-account detection */
  deviceFingerprint: text('device_fingerprint'),
  /** Geolocation at session start */
  geoLocation: jsonb('geo_location'),
  /** Last activity timestamp (for timeout detection) */
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  /** Next scheduled reality check */
  nextRealityCheckAt: timestamp('next_reality_check_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPlayerIdx: index('rg_gs_tenant_player_idx')
    .on(table.tenantId, table.playerId),
  activeSessionIdx: index('rg_gs_active_idx')
    .on(table.tenantId, table.playerId)
    .where(sql`ended_at IS NULL`),
  realityCheckIdx: index('rg_gs_reality_check_idx')
    .on(table.nextRealityCheckAt)
    .where(sql`ended_at IS NULL AND next_reality_check_at IS NOT NULL`),
  startedIdx: index('rg_gs_started_idx')
    .on(table.startedAt),
}));

/**
 * Exclusion Registry Sync
 *
 * Tracks synchronization with external exclusion registries
 * (GAMSTOP, state databases). Ensures we always have current data.
 */
export const exclusionRegistrySync = pgTable('rg_exclusion_registry_sync', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  registryName: text('registry_name').notNull(),
  /** Last successful sync timestamp */
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  /** Last attempted sync */
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  /** Whether the last sync was successful */
  lastSyncSuccess: boolean('last_sync_success'),
  /** Error message if last sync failed */
  lastSyncError: text('last_sync_error'),
  /** Number of records synced in last batch */
  recordsSynced: integer('records_synced').default(0),
  /** Sync frequency in minutes */
  syncFrequencyMinutes: integer('sync_frequency_minutes').notNull().default(60),
  /** Whether auto-sync is enabled */
  enabled: boolean('enabled').notNull().default(true),
  /** Registry API endpoint */
  endpoint: text('endpoint').notNull(),
  /** Configuration (encrypted credentials reference, not actual creds) */
  config: jsonb('config').notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantRegistryIdx: uniqueIndex('rg_ers_tenant_registry_idx')
    .on(table.tenantId, table.registryName),
  syncDueIdx: index('rg_ers_sync_due_idx')
    .on(table.lastSyncAt)
    .where(sql`enabled = true`),
}));

/**
 * Intervention Templates
 *
 * Pre-defined intervention content for each type and escalation level.
 * Allows jurisdiction-specific messaging and localization.
 */
export const interventionTemplates = pgTable('rg_intervention_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  type: interventionTypeEnum('type').notNull(),
  level: integer('level').notNull(),
  jurisdiction: text('jurisdiction').notNull().default('DEFAULT'),
  locale: text('locale').notNull().default('en'),
  /** Template content (title, body with placeholders, actions) */
  template: jsonb('template').notNull(),
  /** Whether this is the active template for this combo */
  active: boolean('active').notNull().default(true),
  /** Version for template auditing */
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  lookupIdx: uniqueIndex('rg_it_lookup_idx')
    .on(table.tenantId, table.type, table.level, table.jurisdiction, table.locale)
    .where(sql`active = true`),
}));

/**
 * Responsible Gaming Audit Log
 *
 * Immutable, append-only audit trail for every responsible gaming event.
 * Uses cryptographic chaining for tamper detection.
 * This table should be backed by a write-once storage policy.
 */
export const rgAuditLog = pgTable('rg_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  playerId: uuid('player_id').notNull(),
  eventType: text('event_type').notNull(),
  /** Full event payload */
  eventData: jsonb('event_data').notNull(),
  /** IP address at time of event */
  ipAddress: text('ip_address'),
  /** User agent at time of event */
  userAgent: text('user_agent'),
  /** Staff ID if this was a staff-initiated action */
  staffId: uuid('staff_id'),
  /** Hash of previous audit entry (for chain integrity) */
  previousHash: text('previous_hash'),
  /** SHA-256 hash of this entry's content */
  integrityHash: text('integrity_hash').notNull(),
  /** Timestamp (immutable) */
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPlayerIdx: index('rg_al_tenant_player_idx')
    .on(table.tenantId, table.playerId),
  eventTypeIdx: index('rg_al_event_type_idx')
    .on(table.eventType),
  timestampIdx: index('rg_al_timestamp_idx')
    .on(table.timestamp),
  staffIdx: index('rg_al_staff_idx')
    .on(table.staffId)
    .where(sql`staff_id IS NOT NULL`),
}));
```

### Row-Level Security Policy

```sql
-- All RG tables enforce tenant isolation via RLS
ALTER TABLE rg_player_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_self_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_reality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_gaming_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_audit_log ENABLE ROW LEVEL SECURITY;

-- Example policy (applied to all tables)
CREATE POLICY rg_tenant_isolation ON rg_player_limits
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Audit log is append-only: no updates or deletes
CREATE POLICY rg_audit_append_only ON rg_audit_log
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Deny UPDATE and DELETE on audit log
REVOKE UPDATE, DELETE ON rg_audit_log FROM app_role;

-- Self-exclusion checks bypass normal auth (must always be enforced)
-- This uses a SECURITY DEFINER function to check exclusion status
CREATE OR REPLACE FUNCTION check_player_excluded(p_player_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM rg_self_exclusions
    WHERE player_id = p_player_id
      AND tenant_id = p_tenant_id
      AND status = 'ACTIVE'
      AND (ends_at IS NULL OR ends_at > now())
  );
$$;
```

---

## Code Examples

### 1. Setting a Deposit Limit

Decreases take effect immediately. The system enforces that the player cannot increase a limit without a cooling-off period.

```typescript
import { ResponsibleGamingService } from '@mcv/compliance/responsible-gaming';
import { TRPCError } from '@trpc/server';

const rgService = new ResponsibleGamingService(deps);

// ── Player sets a daily deposit limit ────────────────────────
async function setDailyDepositLimit(
  playerId: string,
  tenantId: string,
  amountCents: number,
  currency: string,
) {
  // Check if player is excluded (excluded players can't interact at all)
  const exclusion = await rgService.getExclusionStatus(playerId, tenantId);
  if (exclusion?.active) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Account is self-excluded. No actions permitted.',
    });
  }

  // Get current limits to determine if this is an increase or decrease
  const currentLimits = await rgService.getPlayerLimits(playerId, tenantId);
  const existingDeposit = currentLimits.limits.find(
    (l) => l.type === 'DEPOSIT' && l.period === 'DAILY',
  );

  if (existingDeposit && amountCents > existingDeposit.amount) {
    // INCREASE → requires cooling-off period
    const changeRequest = await rgService.requestLimitIncrease(playerId, tenantId, {
      limitId: existingDeposit.id,
      newAmount: amountCents,
    });

    await rgService.audit(playerId, tenantId, 'LIMIT_INCREASE_REQUESTED', {
      limitType: 'DEPOSIT',
      period: 'DAILY',
      currentAmount: existingDeposit.amount,
      requestedAmount: amountCents,
      coolingOffHours: changeRequest.coolingOffHours,
      effectiveAt: changeRequest.effectiveAt,
    });

    return {
      status: 'PENDING',
      message: `Limit increase will take effect after ${changeRequest.coolingOffHours}h cooling-off period.`,
      effectiveAt: changeRequest.effectiveAt,
      canCancel: true,
    };
  }

  // DECREASE or NEW → takes effect immediately
  const limit = await rgService.setLimit(playerId, tenantId, {
    type: 'DEPOSIT',
    period: 'DAILY',
    amount: amountCents,
    currency,
  });

  await rgService.audit(playerId, tenantId, 'LIMIT_SET', {
    limitType: 'DEPOSIT',
    period: 'DAILY',
    previousAmount: existingDeposit?.amount ?? null,
    newAmount: amountCents,
    immediate: true,
  });

  return {
    status: 'ACTIVE',
    message: 'Daily deposit limit is now active.',
    limit,
  };
}

// ── Enforce limit at deposit time ────────────────────────────
async function enforceDepositLimit(
  playerId: string,
  tenantId: string,
  depositAmountCents: number,
): Promise<{ allowed: boolean; maxAllowed: number; reason?: string }> {
  const check = await rgService.checkLimitAvailability(
    playerId,
    tenantId,
    'DEPOSIT',
    depositAmountCents,
  );

  if (!check.allowed) {
    await rgService.audit(playerId, tenantId, 'DEPOSIT_LIMIT_BLOCKED', {
      attemptedAmount: depositAmountCents,
      limit: check.limit,
      consumed: check.consumed,
      remaining: check.remaining,
    });

    return {
      allowed: false,
      maxAllowed: check.remaining,
      reason: `Daily deposit limit reached. Remaining: ${check.remaining} cents. Resets at ${check.resetsAt.toISOString()}.`,
    };
  }

  return { allowed: true, maxAllowed: check.remaining };
}
```

### 2. Self-Exclusion with GAMSTOP Integration

Self-exclusion must immediately freeze the account, void open bets, and sync with external registries.

```typescript
import { SelfExclusionService } from '@mcv/compliance/responsible-gaming';
import { GamstopIntegration } from '@mcv/compliance/responsible-gaming';
import { db } from '@mcv/database';
import { eq, and } from 'drizzle-orm';

const exclusionService = new SelfExclusionService(deps);
const gamstop = new GamstopIntegration(deps);

async function selfExcludePlayer(
  playerId: string,
  tenantId: string,
  scope: ExclusionScope,
  duration: ExclusionDuration,
  reason?: string,
) {
  // Start a transaction — exclusion must be atomic
  return await db.transaction(async (tx) => {
    // 1. Create the exclusion record
    const exclusion = await exclusionService.create(tx, {
      playerId,
      tenantId,
      scope,
      duration,
      reason,
    });

    // 2. Immediately freeze all player activity
    await exclusionService.freezeAccount(tx, playerId, tenantId, {
      // Void all open/unsettled bets
      voidOpenBets: true,
      // Block all deposits
      blockDeposits: true,
      // Block all wagers
      blockWagers: true,
      // Block login (after current session ends)
      blockLogin: true,
      // Preserve withdrawal ability (regulatory requirement)
      allowWithdrawals: true,
    });

    // 3. Record the player's balance for refund processing
    const balance = await exclusionService.captureBalance(tx, playerId, tenantId);
    await tx.update(selfExclusions)
      .set({ balanceAtExclusion: balance.totalCents })
      .where(eq(selfExclusions.id, exclusion.id));

    // 4. Terminate active sessions
    const activeSession = await exclusionService.getActiveSession(playerId, tenantId);
    if (activeSession) {
      await exclusionService.terminateSession(tx, activeSession.id, 'SELF_EXCLUSION');
    }

    // 5. Sync with external registries
    if (scope === 'NATIONAL' || scope === 'JURISDICTION') {
      try {
        const gamstopResult = await gamstop.registerExclusion({
          playerId,
          firstName: /* from KYC */ '',
          lastName: '',
          dateOfBirth: '',
          postcode: '',
          email: '',
          duration,
        });
        await tx.update(selfExclusions)
          .set({
            externalRegistryId: gamstopResult.referenceId,
            externalRegistryName: 'GAMSTOP',
          })
          .where(eq(selfExclusions.id, exclusion.id));
      } catch (error) {
        // GAMSTOP sync failure must NOT prevent exclusion
        // Log the error and retry asynchronously
        logger.error('GAMSTOP sync failed during self-exclusion', {
          playerId,
          exclusionId: exclusion.id,
          error,
        });
        await exclusionService.scheduleRegistryRetry(exclusion.id, 'GAMSTOP');
      }
    }

    // 6. Send confirmation with support resources
    await exclusionService.sendExclusionConfirmation(playerId, tenantId, {
      exclusionId: exclusion.id,
      duration,
      helpResources: await getHelpResources(tenantId),
    });

    // 7. Immutable audit entry
    await rgService.audit(playerId, tenantId, 'SELF_EXCLUSION_ACTIVATED', {
      exclusionId: exclusion.id,
      scope,
      duration,
      reason,
      openBetsVoided: true,
      balanceAtExclusion: balance.totalCents,
      gamstopSynced: scope === 'NATIONAL' || scope === 'JURISDICTION',
    });

    return exclusion;
  });
}

// ── Check exclusion on every login attempt ───────────────────
async function checkExclusionOnLogin(
  playerId: string,
  tenantId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  // Check internal exclusion
  const internalExclusion = await exclusionService.getActiveExclusion(playerId, tenantId);
  if (internalExclusion) {
    return {
      allowed: false,
      reason: `You are self-excluded until ${internalExclusion.endsAt?.toISOString() ?? 'permanently'}. ` +
        `If you need support, please contact the National Gambling Helpline: 1-800-522-4700.`,
    };
  }

  // Check external registries (GAMSTOP, state databases)
  const externalCheck = await rgService.checkExternalExclusion(playerId, tenantId);
  if (externalCheck.excluded) {
    // Player is on an external exclusion list — block and log
    await rgService.audit(playerId, tenantId, 'EXTERNAL_EXCLUSION_BLOCKED', {
      registry: externalCheck.registry,
      externalId: externalCheck.externalId,
    });
    return {
      allowed: false,
      reason: `You are registered on the ${externalCheck.registry} exclusion list. Access is denied.`,
    };
  }

  return { allowed: true };
}
```

### 3. Reality Check System

Reality checks are periodic interruptions that show the player their session stats, forcing a moment of reflection.

```typescript
import { RealityCheckService, RealityCheckScheduler } from '@mcv/compliance/responsible-gaming';
import { SessionTracker } from '@mcv/compliance/responsible-gaming';

const realityCheckService = new RealityCheckService(deps);
const sessionTracker = new SessionTracker(deps);
const scheduler = new RealityCheckScheduler(deps);

// ── Schedule reality checks for a session ────────────────────
async function onSessionStart(sessionId: string, playerId: string, tenantId: string) {
  // Get player's reality check config (or jurisdiction defaults)
  const config = await realityCheckService.getConfig(playerId, tenantId);

  if (!config.enabled) {
    // Check if jurisdiction mandates reality checks
    const jurisdictionRules = await getJurisdictionRules(tenantId);
    if (jurisdictionRules.realityCheckMandatory) {
      // Override player preference — jurisdiction rules always win
      config.enabled = true;
      config.intervalMinutes = Math.min(
        config.intervalMinutes,
        jurisdictionRules.realityCheckMaxIntervalMinutes, // e.g., 60 for UK GC
      );
    }
  }

  if (config.enabled) {
    await scheduler.scheduleNext(sessionId, playerId, tenantId, {
      intervalMinutes: config.intervalMinutes,
      firstCheckAt: new Date(Date.now() + config.intervalMinutes * 60_000),
    });
  }
}

// ── Trigger a reality check ──────────────────────────────────
async function triggerRealityCheck(sessionId: string, playerId: string, tenantId: string) {
  // Gather current session stats
  const session = await sessionTracker.getSession(sessionId);
  if (!session || session.endedAt) return; // Session already ended

  const config = await realityCheckService.getConfig(playerId, tenantId);

  const snapshot: RealityCheckSnapshot = {
    id: crypto.randomUUID(),
    playerId,
    tenantId,
    sessionId,
    triggeredAt: new Date(),
    respondedAt: null,
    sessionDurationMinutes: session.durationMinutes,
    netPosition: session.netPosition,
    totalDeposited: session.totalDeposited,
    totalWagered: session.totalWagered,
    currency: session.currency,
    response: null as any, // Will be set when player responds
    limitSet: null,
  };

  // Persist the snapshot
  await realityCheckService.saveSnapshot(snapshot);

  // Build the display content
  const displayContent = buildRealityCheckDisplay(snapshot, config.includeFields);

  // Emit event for the frontend to show the popup
  await rgEvents.emit('rg.reality-check.triggered', {
    playerId,
    tenantId,
    sessionId,
    snapshotId: snapshot.id,
    content: displayContent,
    blocking: true, // Player must interact before continuing
    timeoutSeconds: 120, // Auto-end session after 2 minutes of no response
  });

  // Schedule the next reality check
  await scheduler.scheduleNext(sessionId, playerId, tenantId, {
    intervalMinutes: config.intervalMinutes,
  });

  // Audit
  await rgService.audit(playerId, tenantId, 'REALITY_CHECK_TRIGGERED', {
    snapshotId: snapshot.id,
    sessionId,
    sessionMinutes: session.durationMinutes,
    netPosition: session.netPosition,
  });
}

// ── Build reality check display content ──────────────────────
function buildRealityCheckDisplay(
  snapshot: RealityCheckSnapshot,
  fields: RealityCheckField[],
): InterventionContent {
  const lines: string[] = [];

  if (fields.includes('SESSION_DURATION') || fields.includes('TIME_PLAYED')) {
    const hours = Math.floor(snapshot.sessionDurationMinutes / 60);
    const mins = snapshot.sessionDurationMinutes % 60;
    lines.push(`⏱️ You have been playing for ${hours}h ${mins}m.`);
  }

  if (fields.includes('NET_POSITION')) {
    const netFormatted = formatCurrency(snapshot.netPosition, snapshot.currency);
    const emoji = snapshot.netPosition >= 0 ? '📈' : '📉';
    lines.push(`${emoji} Net position: ${netFormatted}`);
  }

  if (fields.includes('TOTAL_WAGERED')) {
    lines.push(`🎰 Total wagered: ${formatCurrency(snapshot.totalWagered, snapshot.currency)}`);
  }

  if (fields.includes('TOTAL_DEPOSITED')) {
    lines.push(`💳 Total deposited: ${formatCurrency(snapshot.totalDeposited, snapshot.currency)}`);
  }

  return {
    title: 'Reality Check',
    body: [
      'Here\'s a summary of your session so far:',
      '',
      ...lines,
      '',
      'Would you like to continue playing?',
    ].join('\n'),
    actions: [
      { label: 'Take a Break', action: 'END_SESSION', recommended: true },
      { label: 'Set a Limit', action: 'SET_LIMIT', recommended: false },
      { label: 'Continue Playing', action: 'CONTINUE', recommended: false },
    ],
    helpResources: [
      {
        name: 'National Council on Problem Gambling',
        description: '24/7 confidential helpline',
        url: 'https://www.ncpgambling.org/',
        phone: '1-800-522-4700',
        available24h: true,
        jurisdictions: ['US'],
      },
      {
        name: 'GamCare',
        description: 'Free advice, support, and counselling',
        url: 'https://www.gamcare.org.uk/',
        phone: '0808 8020 133',
        available24h: true,
        jurisdictions: ['UK'],
      },
    ],
    blocking: true,
    timeoutSeconds: 120,
  };
}

// ── Handle player response ───────────────────────────────────
async function handleRealityCheckResponse(
  snapshotId: string,
  response: 'CONTINUE' | 'END_SESSION' | 'SET_LIMIT',
  limitDetails?: SetLimitRequest,
) {
  const snapshot = await realityCheckService.getSnapshot(snapshotId);
  if (!snapshot) throw new Error('Reality check snapshot not found');

  await realityCheckService.recordResponse(snapshotId, response);

  switch (response) {
    case 'END_SESSION':
      await sessionTracker.endSession(snapshot.sessionId, 'PLAYER_LOGOUT');
      break;

    case 'SET_LIMIT':
      if (limitDetails) {
        await rgService.setLimit(snapshot.playerId, snapshot.tenantId, limitDetails);
      }
      break;

    case 'CONTINUE':
      // Player chose to continue — logged for analytics
      break;
  }

  await rgService.audit(snapshot.playerId, snapshot.tenantId, 'REALITY_CHECK_RESPONSE', {
    snapshotId,
    response,
    sessionMinutes: snapshot.sessionDurationMinutes,
    limitSet: limitDetails ?? null,
  });
}
```

### 4. Behavioral Risk Assessment

The risk engine combines rule-based checks with ML model predictions to produce a composite risk score.

```typescript
import { RiskAssessmentEngine, BehavioralAnalyzer, RiskScorer } from '@mcv/compliance/responsible-gaming';
import { IntelligenceClient } from '@mcv/intelligence';

const riskEngine = new RiskAssessmentEngine(deps);
const behavioralAnalyzer = new BehavioralAnalyzer(deps);
const riskScorer = new RiskScorer(deps);
const mlClient = new IntelligenceClient(deps);

// ── Perform a full risk assessment ───────────────────────────
async function assessPlayerRisk(
  playerId: string,
  tenantId: string,
): Promise<RiskAssessment> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60_000); // 30-day window

  // 1. Gather behavioral signals
  const signals = await behavioralAnalyzer.analyze(playerId, tenantId, {
    windowStart,
    windowEnd: now,
  });

  // 2. Run rule-based checks
  const ruleFactors: RiskFactor[] = [];

  // Deposit velocity: >5 deposits in 24h is concerning
  if (signals.depositsLast24h > 5) {
    ruleFactors.push({
      name: 'HIGH_DEPOSIT_VELOCITY',
      category: 'FINANCIAL',
      weight: 0.15,
      value: signals.depositsLast24h,
      normalizedScore: Math.min(1000, signals.depositsLast24h * 100),
      description: `${signals.depositsLast24h} deposits in the last 24 hours`,
      evidence: { deposits: signals.depositHistory24h },
    });
  }

  // Loss chasing: increasing bet size after losses
  if (signals.lossChasingScore > 0.6) {
    ruleFactors.push({
      name: 'LOSS_CHASING',
      category: 'BEHAVIORAL',
      weight: 0.25,
      value: signals.lossChasingScore,
      normalizedScore: Math.round(signals.lossChasingScore * 1000),
      description: 'Pattern of increasing bets after losses detected',
      evidence: {
        betSequence: signals.recentBetSequence,
        chasingScore: signals.lossChasingScore,
      },
    });
  }

  // Late-night sessions: >2h of play between midnight and 5am
  if (signals.lateNightMinutesLast7d > 120) {
    ruleFactors.push({
      name: 'LATE_NIGHT_PLAY',
      category: 'TEMPORAL',
      weight: 0.1,
      value: signals.lateNightMinutesLast7d,
      normalizedScore: Math.min(1000, (signals.lateNightMinutesLast7d / 120) * 500),
      description: `${signals.lateNightMinutesLast7d} minutes of late-night play in the last 7 days`,
      evidence: { sessions: signals.lateNightSessions },
    });
  }

  // Bet escalation: average bet size increasing week over week
  if (signals.betEscalationRate > 1.5) {
    ruleFactors.push({
      name: 'BET_ESCALATION',
      category: 'BEHAVIORAL',
      weight: 0.2,
      value: signals.betEscalationRate,
      normalizedScore: Math.min(1000, (signals.betEscalationRate - 1) * 500),
      description: `Average bet size increased ${((signals.betEscalationRate - 1) * 100).toFixed(0)}% week-over-week`,
      evidence: {
        weeklyAverageBets: signals.weeklyAverageBets,
        escalationRate: signals.betEscalationRate,
      },
    });
  }

  // Deposit-to-loss ratio: depositing much more than winning
  if (signals.depositToLossRatio > 3) {
    ruleFactors.push({
      name: 'HIGH_DEPOSIT_LOSS_RATIO',
      category: 'FINANCIAL',
      weight: 0.15,
      value: signals.depositToLossRatio,
      normalizedScore: Math.min(1000, signals.depositToLossRatio * 200),
      description: `Depositing ${signals.depositToLossRatio.toFixed(1)}x more than net losses suggest sustainable`,
      evidence: {
        totalDeposited: signals.totalDeposited30d,
        totalLost: signals.totalLost30d,
      },
    });
  }

  // Session frequency: daily sessions with increasing duration
  if (signals.sessionsPerWeek > 14 && signals.avgSessionDurationTrend > 1.2) {
    ruleFactors.push({
      name: 'OBSESSIVE_ENGAGEMENT',
      category: 'ENGAGEMENT',
      weight: 0.1,
      value: signals.sessionsPerWeek,
      normalizedScore: Math.min(1000, signals.sessionsPerWeek * 50),
      description: `${signals.sessionsPerWeek} sessions/week with increasing duration`,
      evidence: {
        sessionsPerWeek: signals.sessionsPerWeek,
        durationTrend: signals.avgSessionDurationTrend,
      },
    });
  }

  // Payday spike: significant increase in deposits around payday
  if (signals.paydayDepositSpike > 2.0) {
    ruleFactors.push({
      name: 'PAYDAY_SPIKE',
      category: 'CONTEXTUAL',
      weight: 0.05,
      value: signals.paydayDepositSpike,
      normalizedScore: Math.min(1000, signals.paydayDepositSpike * 300),
      description: `Deposits spike ${signals.paydayDepositSpike.toFixed(1)}x around payday`,
      evidence: { depositPattern: signals.monthlyDepositPattern },
    });
  }

  // 3. Run ML model for composite prediction
  const mlPrediction = await mlClient.predict('responsible-gaming-risk-v3', {
    playerId,
    tenantId,
    signals,
    ruleFactors: ruleFactors.map((f) => ({
      name: f.name,
      value: f.value,
      normalizedScore: f.normalizedScore,
    })),
  });

  // 4. Compute composite score
  const compositeScore = riskScorer.compute({
    ruleFactors,
    mlScore: mlPrediction.score,
    mlWeight: 0.4, // ML gets 40% weight, rules get 60%
  });

  // 5. Determine risk level
  const level = riskScorer.classifyLevel(compositeScore);

  // 6. Persist the assessment
  const assessment: RiskAssessment = {
    id: crypto.randomUUID(),
    playerId,
    tenantId,
    score: compositeScore,
    level,
    factors: ruleFactors,
    modelVersion: mlPrediction.modelVersion,
    modelOutput: mlPrediction.raw,
    triggeredIntervention: false,
    assessedAt: now,
    windowStart,
    windowEnd: now,
  };

  await riskEngine.saveAssessment(assessment);

  // 7. Check if intervention is needed
  if (level === 'HIGH' || level === 'CRITICAL') {
    const intervention = await triggerIntervention(assessment);
    assessment.triggeredIntervention = true;
    await riskEngine.updateAssessment(assessment.id, {
      triggeredIntervention: true,
    });
  }

  // 8. Audit
  await rgService.audit(playerId, tenantId, 'RISK_ASSESSMENT_COMPLETED', {
    assessmentId: assessment.id,
    score: compositeScore,
    level,
    factorCount: ruleFactors.length,
    mlModelVersion: mlPrediction.modelVersion,
    triggeredIntervention: assessment.triggeredIntervention,
  });

  return assessment;
}
```

### 5. Intervention Trigger and Escalation

When risk thresholds are crossed, the intervention orchestrator determines the appropriate response and escalates if needed.

```typescript
import { InterventionOrchestrator, EscalationManager } from '@mcv/compliance/responsible-gaming';

const orchestrator = new InterventionOrchestrator(deps);
const escalation = new EscalationManager(deps);

// ── Trigger intervention based on risk assessment ────────────
async function triggerIntervention(assessment: RiskAssessment): Promise<Intervention> {
  const { playerId, tenantId, level, score } = assessment;

  // Get the player's intervention history
  const history = await orchestrator.getRecentInterventions(playerId, tenantId, {
    windowDays: 30,
  });

  // Determine escalation level based on risk and history
  const escalationLevel = escalation.determineLevel({
    currentRiskLevel: level,
    riskScore: score,
    recentInterventionCount: history.length,
    lastInterventionOutcome: history[0]?.outcome ?? null,
    daysSinceLastIntervention: history[0]
      ? daysBetween(history[0].createdAt, new Date())
      : null,
  });

  // Map escalation level to intervention type
  const interventionType = mapEscalationToType(escalationLevel, level);

  // Get the localized template
  const jurisdictionRules = await getJurisdictionRules(tenantId);
  const template = await orchestrator.getTemplate(
    tenantId,
    interventionType,
    escalationLevel,
    jurisdictionRules.jurisdiction,
  );

  // Build the intervention content
  const content = orchestrator.renderTemplate(template, {
    playerName: await getPlayerName(playerId, tenantId),
    riskLevel: level,
    sessionDuration: await getCurrentSessionDuration(playerId, tenantId),
    netPosition: await getCurrentNetPosition(playerId, tenantId),
    helpResources: await getHelpResources(tenantId, jurisdictionRules.jurisdiction),
  });

  // Create and deliver the intervention
  const intervention = await orchestrator.create({
    playerId,
    tenantId,
    riskAssessmentId: assessment.id,
    type: interventionType,
    level: escalationLevel,
    content,
    automated: true,
    blocking: escalationLevel >= 3, // Level 3+ blocks the player
  });

  // For high-level interventions, take immediate action
  if (escalationLevel >= 3) {
    await enforceInterventionActions(intervention, playerId, tenantId);
  }

  // Emit event for frontend delivery
  await rgEvents.emit('rg.intervention.triggered', {
    playerId,
    tenantId,
    interventionId: intervention.id,
    type: interventionType,
    level: escalationLevel,
    content,
    blocking: intervention.blocking,
  });

  // Audit
  await rgService.audit(playerId, tenantId, 'INTERVENTION_TRIGGERED', {
    interventionId: intervention.id,
    type: interventionType,
    level: escalationLevel,
    riskScore: score,
    riskLevel: level,
    automated: true,
    blocking: intervention.blocking,
  });

  return intervention;
}

// ── Map escalation level to intervention type ────────────────
function mapEscalationToType(
  escalationLevel: number,
  riskLevel: RiskLevel,
): InterventionType {
  const mapping: Record<number, InterventionType> = {
    1: 'NUDGE',
    2: 'WARNING',
    3: 'FORCED_BREAK',
    4: 'ACCOUNT_REVIEW',
    5: 'ACCOUNT_SUSPENSION',
  };

  // Critical risk can skip directly to higher levels
  if (riskLevel === 'CRITICAL' && escalationLevel < 3) {
    return 'FORCED_BREAK';
  }

  return mapping[escalationLevel] ?? 'NUDGE';
}

// ── Enforce actions for high-level interventions ─────────────
async function enforceInterventionActions(
  intervention: Intervention,
  playerId: string,
  tenantId: string,
) {
  switch (intervention.type) {
    case 'FORCED_BREAK': {
      // Force end the current session
      const session = await sessionTracker.getActiveSession(playerId, tenantId);
      if (session) {
        await sessionTracker.endSession(session.sessionId, 'FORCED_BREAK');
      }
      // Set a mandatory cool-down (no login for X hours)
      await setCoolDown(playerId, tenantId, { hours: 1 });
      break;
    }

    case 'DEPOSIT_FREEZE': {
      // Block deposits for 24 hours
      await blockDeposits(playerId, tenantId, { hours: 24 });
      break;
    }

    case 'PRODUCT_RESTRICTION': {
      // Block high-risk products (e.g., in-play betting, slots)
      await restrictProducts(playerId, tenantId, ['IN_PLAY', 'SLOTS', 'VIRTUAL']);
      break;
    }

    case 'ACCOUNT_REVIEW': {
      // Flag for compliance team manual review
      await createComplianceReview(playerId, tenantId, {
        reason: 'Automated risk escalation',
        interventionId: intervention.id,
        priority: 'HIGH',
      });
      break;
    }

    case 'ACCOUNT_SUSPENSION': {
      // Suspend the account pending review
      await suspendAccount(playerId, tenantId, {
        reason: 'Critical risk level detected',
        interventionId: intervention.id,
      });
      // Notify the regulator if required
      const rules = await getJurisdictionRules(tenantId);
      if (rules.notifyRegulatorOnSuspension) {
        await notifyRegulator(tenantId, playerId, 'ACCOUNT_SUSPENDED', intervention);
      }
      break;
    }
  }
}

// ── Handle escalation when intervention is declined ──────────
async function handleInterventionDeclined(interventionId: string) {
  const intervention = await orchestrator.get(interventionId);
  if (!intervention) return;

  // Record the decline
  await orchestrator.recordOutcome(interventionId, 'DECLINED');

  // Check if we should escalate
  const shouldEscalate = await escalation.shouldEscalate({
    currentLevel: intervention.level,
    outcome: 'DECLINED',
    playerId: intervention.playerId,
    tenantId: intervention.tenantId,
  });

  if (shouldEscalate) {
    // Create a higher-level intervention
    const nextLevel = Math.min(intervention.level + 1, 5);
    const escalatedIntervention = await triggerIntervention({
      ...await riskEngine.getLatestAssessment(intervention.playerId, intervention.tenantId),
      // Override the score to force escalation
    } as RiskAssessment);

    // Link the escalation chain
    await orchestrator.linkEscalation(interventionId, escalatedIntervention.id);

    await rgService.audit(intervention.playerId, intervention.tenantId, 'INTERVENTION_ESCALATED', {
      fromInterventionId: interventionId,
      toInterventionId: escalatedIntervention.id,
      fromLevel: intervention.level,
      toLevel: nextLevel,
      reason: 'Player declined previous intervention',
    });
  }
}
```

### 6. Real-Time Event Stream Processing

Responsible gaming events flow through Redpanda/Kafka for real-time monitoring.

```typescript
import { RGEventConsumer, RGEventProducer } from '@mcv/compliance/responsible-gaming';
import { RedpandaConsumer } from '@mcv/messaging';

// ── Event producer: emit RG events to the stream ─────────────
const rgProducer = new RGEventProducer({
  brokers: process.env.REDPANDA_BROKERS!.split(','),
  clientId: 'rg-producer',
});

// ── Event consumer: process activity events for risk scoring ─
const activityConsumer = new RGEventConsumer({
  brokers: process.env.REDPANDA_BROKERS!.split(','),
  groupId: 'rg-risk-assessment',
  topics: [
    'player.deposit.completed',
    'player.wager.placed',
    'player.session.started',
    'player.session.heartbeat',
    'player.login.completed',
    'player.limit.changed',
  ],
});

// ── Process incoming activity events ─────────────────────────
activityConsumer.on('message', async (event) => {
  const { playerId, tenantId, type, data, timestamp } = event;

  switch (type) {
    case 'player.deposit.completed': {
      // Update deposit limit consumption
      await limitEnforcementEngine.recordConsumption(playerId, tenantId, 'DEPOSIT', data.amount);

      // Check for rapid deposit pattern
      const recentDeposits = await getRecentDeposits(playerId, tenantId, { hours: 1 });
      if (recentDeposits.length >= 3) {
        await rgProducer.emit('rg.risk.signal', {
          playerId,
          tenantId,
          signal: 'RAPID_DEPOSITS',
          value: recentDeposits.length,
          metadata: { deposits: recentDeposits },
        });
      }
      break;
    }

    case 'player.wager.placed': {
      // Update loss/wager limit consumption
      await limitEnforcementEngine.recordConsumption(playerId, tenantId, 'WAGER', data.stake);

      // Update session stats
      await sessionTracker.recordWager(data.sessionId, {
        stake: data.stake,
        potentialWin: data.potentialWin,
      });

      // Check for bet escalation in real-time
      const recentBets = await getRecentBets(playerId, tenantId, { count: 10 });
      if (isEscalatingPattern(recentBets)) {
        await rgProducer.emit('rg.risk.signal', {
          playerId,
          tenantId,
          signal: 'BET_ESCALATION',
          value: calculateEscalationRate(recentBets),
          metadata: { bets: recentBets },
        });
      }
      break;
    }

    case 'player.session.heartbeat': {
      // Update session duration
      await sessionTracker.heartbeat(data.sessionId);

      // Check if time limit is approaching
      const session = await sessionTracker.getSession(data.sessionId);
      const timeLimit = await limitEnforcementEngine.getActiveLimit(
        playerId, tenantId, 'TIME', 'DAILY',
      );

      if (timeLimit && session) {
        const remaining = timeLimit.amount - timeLimit.consumed - session.durationMinutes;
        if (remaining <= 5) {
          await rgProducer.emit('rg.limit.approaching', {
            playerId,
            tenantId,
            limitType: 'TIME',
            remaining,
            sessionId: data.sessionId,
          });
        }
        if (remaining <= 0) {
          // Time limit exceeded — force end session
          await sessionTracker.endSession(data.sessionId, 'TIME_LIMIT');
          await rgProducer.emit('rg.limit.exceeded', {
            playerId,
            tenantId,
            limitType: 'TIME',
            sessionId: data.sessionId,
          });
        }
      }

      // Check if reality check is due
      if (session?.nextRealityCheckAt && new Date() >= session.nextRealityCheckAt) {
        await triggerRealityCheck(data.sessionId, playerId, tenantId);
      }
      break;
    }

    case 'player.login.completed': {
      // Run exclusion check (defense in depth — should already be checked at auth layer)
      const exclusionCheck = await checkExclusionOnLogin(playerId, tenantId);
      if (!exclusionCheck.allowed) {
        // This should never happen (auth layer should catch it), but log it
        logger.warn('Excluded player passed auth layer', { playerId, tenantId });
        await forceLogout(playerId, tenantId);
      }
      break;
    }
  }
});

// ── Risk signal consumer: aggregate signals into assessments ─
const riskSignalConsumer = new RGEventConsumer({
  brokers: process.env.REDPANDA_BROKERS!.split(','),
  groupId: 'rg-risk-aggregation',
  topics: ['rg.risk.signal'],
});

riskSignalConsumer.on('message', async (event) => {
  const { playerId, tenantId, signal } = event;

  // Debounce: don't reassess if we just assessed this player
  const lastAssessment = await riskEngine.getLatestAssessment(playerId, tenantId);
  if (lastAssessment && minutesSince(lastAssessment.assessedAt) < 5) {
    return; // Skip, too soon
  }

  // Run a full risk assessment
  await assessPlayerRisk(playerId, tenantId);
});
```

### 7. Underage Prevention Gate

```typescript
import { UnderagePreventionService, AgeVerificationGate } from '@mcv/compliance/responsible-gaming';

const underagePrevention = new UnderagePreventionService(deps);
const ageGate = new AgeVerificationGate(deps);

// ── Pre-registration age gate ────────────────────────────────
async function verifyAgeForRegistration(
  dateOfBirth: string,
  tenantId: string,
  ipCountry: string,
): Promise<AgeVerificationResult> {
  const dob = new Date(dateOfBirth);
  const age = calculateAge(dob);

  // Get minimum age for jurisdiction
  const jurisdictionRules = await getJurisdictionRules(tenantId);
  const minimumAge = jurisdictionRules.minimumGamblingAge; // 18 (UK), 21 (US varies)

  if (age < minimumAge) {
    await underagePrevention.logRejection({
      tenantId,
      dateOfBirth,
      ipCountry,
      reason: `Age ${age} below minimum ${minimumAge}`,
    });

    return {
      verified: false,
      reason: `You must be at least ${minimumAge} years old to register.`,
      minimumAge,
    };
  }

  // Borderline case: within 1 year of minimum age — require enhanced verification
  if (age < minimumAge + 1) {
    return {
      verified: false,
      requiresEnhancedVerification: true,
      reason: 'Additional age verification required. Please upload a valid ID document.',
      minimumAge,
    };
  }

  return { verified: true, minimumAge };
}

// ── Enhanced verification for borderline ages ────────────────
async function enhancedAgeVerification(
  playerId: string,
  tenantId: string,
  documentId: string,
): Promise<EnhancedVerificationResult> {
  // Delegate to KYC module for document verification
  const kycResult = await kycService.verifyAgeDocument(playerId, tenantId, documentId);

  if (!kycResult.verified) {
    await underagePrevention.logEnhancedRejection({
      playerId,
      tenantId,
      documentId,
      reason: kycResult.reason,
    });

    // Block account until resolved
    await suspendAccount(playerId, tenantId, {
      reason: 'Age verification failed',
      type: 'PENDING_VERIFICATION',
    });
  }

  await rgService.audit(playerId, tenantId, 'AGE_VERIFICATION_COMPLETED', {
    documentId,
    verified: kycResult.verified,
    method: 'ENHANCED_DOCUMENT',
  });

  return kycResult;
}
```

---

## Error Codes

| Code | Name | Description | HTTP |
|------|------|-------------|------|
| `RG_001` | `PLAYER_EXCLUDED` | Player is self-excluded and cannot perform this action. All activity is blocked during exclusion. | 403 |
| `RG_002` | `DEPOSIT_LIMIT_EXCEEDED` | Deposit would exceed the player's active deposit limit for this period. | 400 |
| `RG_003` | `LOSS_LIMIT_EXCEEDED` | Player has reached their loss limit for this period. Further wagering is blocked. | 400 |
| `RG_004` | `WAGER_LIMIT_EXCEEDED` | Player has reached their wager limit for this period. | 400 |
| `RG_005` | `TIME_LIMIT_EXCEEDED` | Player has exceeded their daily/session time limit. Session terminated. | 400 |
| `RG_006` | `COOLING_OFF_ACTIVE` | A cooling-off period is active for this limit change. Cannot modify until it expires. | 409 |
| `RG_007` | `EXCLUSION_REVERSAL_DENIED` | Self-exclusion cannot be reversed (permanent exclusion, or cooling-off not met). | 403 |
| `RG_008` | `EXTERNAL_EXCLUSION_DETECTED` | Player is on an external exclusion registry (e.g., GAMSTOP). Access denied. | 403 |
| `RG_009` | `UNDERAGE_DETECTED` | Player does not meet the minimum age requirement for this jurisdiction. | 403 |
| `RG_010` | `INTERVENTION_BLOCKING` | A blocking intervention is active. Player must respond before continuing. | 423 |
| `RG_011` | `SESSION_TERMINATED` | Player's session was terminated by a responsible gaming control (time limit, forced break, exclusion). | 400 |
| `RG_012` | `LIMIT_BELOW_JURISDICTION_MINIMUM` | Requested limit is below the jurisdiction-mandated minimum (for operator-set limits). | 400 |
| `RG_013` | `LIMIT_ABOVE_JURISDICTION_MAXIMUM` | Requested limit exceeds the jurisdiction-mandated maximum. | 400 |
| `RG_014` | `REALITY_CHECK_INTERVAL_INVALID` | Reality check interval is below the jurisdiction-mandated minimum. | 400 |
| `RG_015` | `EXCLUSION_ALREADY_ACTIVE` | Player already has an active self-exclusion. Cannot create a duplicate. | 409 |
| `RG_016` | `REGISTRY_SYNC_FAILED` | External exclusion registry synchronization failed. Operations continue with local data. | 502 |
| `RG_017` | `ACCOUNT_SUSPENDED` | Account is suspended pending compliance review. | 403 |
| `RG_018` | `FORCED_BREAK_ACTIVE` | Player is in a mandatory cooling-off break and cannot log in. | 403 |
| `RG_019` | `PRODUCT_RESTRICTED` | Player is restricted from accessing this product due to a responsible gaming intervention. | 403 |
| `RG_020` | `AUDIT_INTEGRITY_VIOLATION` | Audit log integrity check failed. Possible tampering detected. Critical alert raised. | 500 |

### Error Response Format

```typescript
interface RGError {
  code: string;          // e.g., 'RG_001'
  message: string;       // Human-readable message
  details: {
    playerId: string;
    tenantId: string;
    /** Relevant limit/exclusion/intervention ID */
    resourceId?: string;
    /** When the restriction lifts (if temporary) */
    expiresAt?: string;
    /** Help resources always included in RG errors */
    helpResources: HelpResource[];
  };
}

// Example error response
{
  "code": "RG_002",
  "message": "Daily deposit limit reached. You have $25.00 remaining today.",
  "details": {
    "playerId": "usr_abc123",
    "tenantId": "tenant_betedge",
    "resourceId": "limit_xyz789",
    "expiresAt": "2026-02-09T00:00:00Z",
    "helpResources": [
      {
        "name": "National Problem Gambling Helpline",
        "phone": "1-800-522-4700",
        "url": "https://www.ncpgambling.org/",
        "available24h": true
      }
    ]
  }
}
```

---

## Security & Regulatory Compliance

### Regulatory Framework Support

This module is designed to comply with responsible gaming requirements across multiple jurisdictions. Jurisdiction-specific rules are loaded at runtime and enforce the strictest applicable standards.

#### UK Gambling Commission (UKGC)

| Requirement | Implementation |
|---|---|
| **LCCP 3.9.1** — Customer interaction | Automated behavioral monitoring with intervention triggers at configurable thresholds |
| **LCCP 3.9.2** — Self-exclusion | Full support for self-exclusion with minimum 6-month duration, GAMSTOP integration |
| **LCCP 3.10.1** — Reality checks | Mandatory reality checks at minimum 60-minute intervals showing time played and net spend |
| **LCCP 3.5.1** — Deposit limits | Mandatory deposit limit setting during registration, with 24h cooling-off for increases |
| **LCCP 3.2.1** — Age verification | Integration with KYC module; must verify age within 72h of account creation |
| **RTS 17B** — Financial limits | Support for daily, weekly, and monthly deposit/loss/time limits |
| **RTS 17C** — Reality checks | Configurable intervals, must show elapsed time and net position |

#### Malta Gaming Authority (MGA)

| Requirement | Implementation |
|---|---|
| **Player Protection Directive 2018** | Self-exclusion for 6 months, 1 year, or permanent; 24h cooling-off for limit increases |
| **Responsible gaming messaging** | Mandatory RG messages on all pages; links to help organizations |
| **Session duration** | Automatic logout after configurable maximum session duration |
| **Net deposit limits** | Support for net deposit limits (deposits minus withdrawals) |

#### US State-Level Regulations

| State/Jurisdiction | Key Requirements |
|---|---|
| **New Jersey (NJ DGE)** | Self-exclusion integration with NJ state list; mandatory deposit limits; annual responsible gaming reports |
| **Pennsylvania (PGCB)** | Self-exclusion with state registry; loss limits mandatory; cooling-off periods |
| **Michigan (MGCB)** | Voluntary self-exclusion; deposit/wager/time limits; responsible gaming messaging |
| **Ontario (AGCO)** | Mandatory play-break reminders; deposit limits at registration; self-exclusion with iGO integration |

### Jurisdiction Rules Configuration

```typescript
interface JurisdictionRules {
  jurisdiction: string;
  minimumGamblingAge: number;
  
  // Limit rules
  depositLimitMandatoryAtRegistration: boolean;
  coolingOffHoursForIncrease: number;
  maxDepositLimitCents: number | null;
  defaultDepositLimitCents: number | null;
  
  // Self-exclusion rules
  minimumExclusionDuration: ExclusionDuration;
  permanentExclusionAvailable: boolean;
  exclusionReversalCoolingOffHours: number;
  exclusionReversalRequiresStaffApproval: boolean;
  externalRegistryIntegration: string | null; // 'GAMSTOP', 'NJ_STATE', etc.
  
  // Reality check rules
  realityCheckMandatory: boolean;
  realityCheckMaxIntervalMinutes: number;
  realityCheckMinimumFields: RealityCheckField[];
  
  // Session rules
  maxSessionDurationMinutes: number | null;
  mandatoryBreakDurationMinutes: number | null;
  
  // Intervention rules
  autoInterventionEnabled: boolean;
  notifyRegulatorOnSuspension: boolean;
  
  // Messaging rules
  rgMessageOnEveryPage: boolean;
  helplineNumberMandatory: boolean;
}

// Example: UK configuration
const ukRules: JurisdictionRules = {
  jurisdiction: 'UK',
  minimumGamblingAge: 18,
  depositLimitMandatoryAtRegistration: true,
  coolingOffHoursForIncrease: 24,
  maxDepositLimitCents: null,
  defaultDepositLimitCents: null,
  minimumExclusionDuration: 'SIX_MONTHS',
  permanentExclusionAvailable: true,
  exclusionReversalCoolingOffHours: 24,
  exclusionReversalRequiresStaffApproval: false,
  externalRegistryIntegration: 'GAMSTOP',
  realityCheckMandatory: true,
  realityCheckMaxIntervalMinutes: 60,
  realityCheckMinimumFields: ['TIME_PLAYED', 'NET_POSITION'],
  maxSessionDurationMinutes: null,
  mandatoryBreakDurationMinutes: null,
  autoInterventionEnabled: true,
  notifyRegulatorOnSuspension: true,
  rgMessageOnEveryPage: true,
  helplineNumberMandatory: true,
};
```

### Security Controls

#### Data Protection

- **All player limit data** is encrypted at rest (AES-256) and in transit (TLS 1.3)
- **PII in audit logs** is pseudonymized; real player IDs are stored but accessible only with `rg:audit:read` permission
- **Risk assessment model outputs** are retained for regulatory audit but access-controlled
- **Self-exclusion records** are never deleted, even after expiration (regulatory retention requirement)

#### Access Control

```typescript
// Permission model for responsible gaming operations
const rgPermissions = {
  // Player-facing (self-service)
  'rg:limits:read':       'Player can view their own limits',
  'rg:limits:set':        'Player can set or decrease their own limits',
  'rg:limits:increase':   'Player can request a limit increase (with cooling-off)',
  'rg:exclusion:self':    'Player can self-exclude',
  'rg:reality-check:config': 'Player can configure their reality check interval',
  
  // Staff-facing
  'rg:player:view':       'Staff can view any player\'s RG status',
  'rg:intervention:create': 'Staff can create manual interventions',
  'rg:intervention:resolve': 'Staff can resolve/close interventions',
  'rg:exclusion:reverse':  'Staff can approve exclusion reversals',
  'rg:account:suspend':   'Staff can suspend accounts for RG reasons',
  'rg:audit:read':        'Staff can read audit logs',
  'rg:report:generate':   'Staff can generate regulatory reports',
  
  // System
  'rg:risk:assess':       'System can run risk assessments',
  'rg:intervention:auto':  'System can trigger automated interventions',
  'rg:exclusion:sync':    'System can sync with external registries',
  'rg:limits:enforce':    'System can enforce limits on transactions',
};
```

#### Audit Trail Integrity

The audit log uses cryptographic hash chaining to detect tampering:

```typescript
import { createHash } from 'crypto';

function computeAuditHash(entry: Omit<AuditEntry, 'integrityHash'>, previousHash: string | null): string {
  const payload = JSON.stringify({
    id: entry.id,
    tenantId: entry.tenantId,
    playerId: entry.playerId,
    eventType: entry.eventType,
    eventData: entry.eventData,
    ipAddress: entry.ipAddress,
    staffId: entry.staffId,
    timestamp: entry.timestamp.toISOString(),
    previousHash,
  });

  return createHash('sha256').update(payload).digest('hex');
}

// Verify chain integrity
async function verifyAuditChain(
  tenantId: string,
  playerId: string,
  startDate: Date,
  endDate: Date,
): Promise<{ valid: boolean; brokenAt?: string }> {
  const entries = await db.query.rgAuditLog.findMany({
    where: and(
      eq(rgAuditLog.tenantId, tenantId),
      eq(rgAuditLog.playerId, playerId),
      gte(rgAuditLog.timestamp, startDate),
      lte(rgAuditLog.timestamp, endDate),
    ),
    orderBy: asc(rgAuditLog.timestamp),
  });

  let previousHash: string | null = null;

  for (const entry of entries) {
    const expectedHash = computeAuditHash(entry, previousHash);
    if (expectedHash !== entry.integrityHash) {
      logger.critical('AUDIT CHAIN INTEGRITY VIOLATION', {
        entryId: entry.id,
        expected: expectedHash,
        actual: entry.integrityHash,
      });
      return { valid: false, brokenAt: entry.id };
    }
    previousHash = entry.integrityHash;
  }

  return { valid: true };
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `RG_ENABLED` | Yes | `true` | Master switch for responsible gaming module. **Must be `true` in production.** |
| `RG_DEFAULT_JURISDICTION` | Yes | — | Default jurisdiction code (e.g., `UK`, `MT`, `NJ`) |
| `RG_COOLING_OFF_HOURS_INCREASE` | No | `24` | Default cooling-off period (hours) for limit increases |
| `RG_COOLING_OFF_HOURS_EXCLUSION_REVERSAL` | No | `24` | Cooling-off period (hours) for self-exclusion reversal |
| `RG_REALITY_CHECK_DEFAULT_INTERVAL_MINUTES` | No | `60` | Default reality check interval in minutes |
| `RG_REALITY_CHECK_MIN_INTERVAL_MINUTES` | No | `15` | Minimum allowed reality check interval |
| `RG_SESSION_TIMEOUT_MINUTES` | No | `30` | Inactivity timeout for sessions (minutes) |
| `RG_MAX_SESSION_DURATION_MINUTES` | No | — | Maximum session duration (null = no limit) |
| `RG_RISK_ASSESSMENT_DEBOUNCE_MINUTES` | No | `5` | Minimum time between risk assessments for same player |
| `RG_RISK_THRESHOLD_HIGH` | No | `500` | Risk score threshold for HIGH classification |
| `RG_RISK_THRESHOLD_CRITICAL` | No | `750` | Risk score threshold for CRITICAL classification |
| `RG_ML_MODEL_VERSION` | No | `v3` | Active ML risk model version |
| `RG_INTERVENTION_ESCALATION_WINDOW_DAYS` | No | `30` | Window for counting recent interventions in escalation logic |
| `GAMSTOP_API_URL` | Cond. | — | GAMSTOP API endpoint (required for UK operations) |
| `GAMSTOP_API_KEY` | Cond. | — | GAMSTOP API key (required for UK operations) |
| `GAMSTOP_OPERATOR_ID` | Cond. | — | GAMSTOP operator identifier |
| `GAMSTOP_SYNC_FREQUENCY_MINUTES` | No | `60` | How often to sync with GAMSTOP registry |
| `RG_EXCLUSION_REGISTRY_NJ_URL` | Cond. | — | New Jersey state exclusion registry endpoint |
| `RG_EXCLUSION_REGISTRY_NJ_KEY` | Cond. | — | NJ registry API key |
| `RG_EXCLUSION_REGISTRY_PA_URL` | Cond. | — | Pennsylvania state exclusion registry endpoint |
| `RG_EXCLUSION_REGISTRY_PA_KEY` | Cond. | — | PA registry API key |
| `REDPANDA_BROKERS` | Yes | — | Comma-separated Redpanda/Kafka broker addresses |
| `RG_AUDIT_RETENTION_DAYS` | No | `2555` | Audit log retention period (default: 7 years) |
| `RG_HELP_PHONE_US` | No | `1-800-522-4700` | US gambling helpline number |
| `RG_HELP_PHONE_UK` | No | `0808 8020 133` | UK GamCare helpline number |
| `RG_HELP_URL_US` | No | `https://www.ncpgambling.org/` | US help resource URL |
| `RG_HELP_URL_UK` | No | `https://www.gamcare.org.uk/` | UK help resource URL |

> **⚠️ Critical:** `RG_ENABLED` must never be set to `false` in any environment that processes real player activity. Disabling responsible gaming controls in production is a license-revocation event.

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@mcv/database` | `workspace:*` | Drizzle ORM, Supabase PostgreSQL connection, multi-tenant RLS |
| `@mcv/messaging` | `workspace:*` | Redpanda/Kafka event streaming for real-time monitoring |
| `@mcv/intelligence` | `workspace:*` | ML model inference for behavioral risk scoring |
| `@mcv/compliance/kyc` | `workspace:*` | KYC integration for age verification and identity checks |
| `@mcv/auth` | `workspace:*` | Authentication context, session management, permission enforcement |
| `@mcv/notifications` | `workspace:*` | Multi-channel notification delivery (email, push, SMS, in-app) |
| `@trpc/server` | `^11.x` | tRPC router for type-safe API endpoints |
| `zod` | `^3.x` | Runtime schema validation for all inputs |
| `drizzle-orm` | `^0.35.x` | Database ORM with type-safe queries |
| `date-fns` | `^3.x` | Date manipulation for cooling-off calculations, period resets |
| `ioredis` | `^5.x` | Redis for rate limiting, real-time session tracking, debouncing |
| `pino` | `^9.x` | Structured logging for audit and operational logs |

### Peer Dependencies

| Package | Purpose |
|---|---|
| `@mcv/compliance/aml` | Anti-money laundering integration (shared risk signals) |
| `@mcv/payments` | Deposit/withdrawal hooks for limit enforcement |
| `@mcv/betting` | Wager placement hooks for loss/wager limit enforcement |

---

## Testing Notes

### Test Categories

#### Unit Tests

```typescript
// ── Limit enforcement logic ──────────────────────────────────
describe('LimitEnforcementEngine', () => {
  it('should allow deposit within limit', async () => {
    // Set a $100/day limit, attempt $50 deposit → allowed
  });

  it('should block deposit exceeding limit', async () => {
    // Set a $100/day limit, consume $80, attempt $30 → blocked, maxAllowed = $20
  });

  it('should reset consumption on period boundary', async () => {
    // Set daily limit, consume $100, advance clock past midnight → consumption resets
  });

  it('should apply cooling-off for limit increases', async () => {
    // Request increase from $100 → $200 → status PENDING, effectiveAt = now + 24h
  });

  it('should apply limit decreases immediately', async () => {
    // Decrease from $200 → $100 → effective immediately
  });

  it('should allow cancellation of pending increase', async () => {
    // Request increase, then cancel → increase cancelled, original limit preserved
  });

  it('should enforce operator-imposed limits over player limits', async () => {
    // Operator sets $500/month; player tries to set $1000/month → capped at $500
  });
});

// ── Risk scoring ─────────────────────────────────────────────
describe('RiskScorer', () => {
  it('should classify score 0-250 as LOW', () => { /* ... */ });
  it('should classify score 251-500 as MEDIUM', () => { /* ... */ });
  it('should classify score 501-750 as HIGH', () => { /* ... */ });
  it('should classify score 751-1000 as CRITICAL', () => { /* ... */ });
  
  it('should weight ML and rule factors correctly', () => {
    // ML score 600 (weight 0.4) + rule avg 400 (weight 0.6) → composite ~480
  });

  it('should detect loss chasing pattern', () => {
    // Sequence: lose $10, bet $20, lose $20, bet $40 → lossChasingScore > 0.8
  });

  it('should detect late-night play pattern', () => {
    // Sessions at 1am, 2am, 3am over last week → lateNightMinutes > 120
  });
});

// ── Self-exclusion ───────────────────────────────────────────
describe('SelfExclusionService', () => {
  it('should freeze account immediately on self-exclusion', async () => {
    // Self-exclude → all deposits blocked, all wagers blocked, open bets voided
  });

  it('should allow withdrawals during exclusion', async () => {
    // Regulatory requirement: player can always withdraw their balance
  });

  it('should prevent login during active exclusion', async () => {
    // Login attempt → blocked with RG_001 error + helpline info
  });

  it('should sync with GAMSTOP for national scope', async () => {
    // National exclusion → GAMSTOP API called, external ID stored
  });

  it('should not block exclusion if GAMSTOP sync fails', async () => {
    // GAMSTOP API down → exclusion still applied locally, retry scheduled
  });

  it('should enforce cooling-off for exclusion reversal', async () => {
    // Request reversal → minimum 24h cooling-off before processing
  });

  it('should prevent reversal of permanent exclusion', async () => {
    // Permanent exclusion reversal request → RG_007 error
  });
});

// ── Reality checks ───────────────────────────────────────────
describe('RealityCheckService', () => {
  it('should trigger reality check at configured interval', async () => {
    // Session starts, 60 minutes pass → reality check triggered
  });

  it('should end session on timeout without response', async () => {
    // Reality check shown, 120s pass with no response → session ended
  });

  it('should override player config with jurisdiction minimum', async () => {
    // Player sets 120min interval, UK jurisdiction requires 60min → 60min used
  });

  it('should include all mandated fields in display', async () => {
    // UK GC requires TIME_PLAYED and NET_POSITION → both shown
  });
});

// ── Interventions ────────────────────────────────────────────
describe('InterventionOrchestrator', () => {
  it('should escalate when previous intervention was declined', async () => {
    // Level 1 declined → Level 2 created and linked
  });

  it('should cap escalation at level 5', async () => {
    // Already at level 5, declined → stays at level 5 (account suspension)
  });

  it('should skip to level 3 for critical risk', async () => {
    // CRITICAL risk, no history → directly creates level 3 (forced break)
  });

  it('should block player on level 3+ interventions', async () => {
    // Level 3 intervention → blocking = true, player must respond
  });
});
```

#### Integration Tests

```typescript
describe('Responsible Gaming Integration', () => {
  it('should enforce deposit limit across the full stack', async () => {
    // 1. Set limit via tRPC
    // 2. Attempt deposit via payments module
    // 3. Verify limit enforced
    // 4. Verify audit entry created
    // 5. Verify event emitted to Redpanda
  });

  it('should complete self-exclusion lifecycle', async () => {
    // 1. Self-exclude via tRPC
    // 2. Verify account frozen
    // 3. Verify GAMSTOP sync (mock)
    // 4. Attempt login → blocked
    // 5. Wait for exclusion to expire
    // 6. Request reversal → cooling-off
    // 7. After cooling-off → access restored
  });

  it('should flow from activity → risk assessment → intervention', async () => {
    // 1. Simulate rapid deposits via event stream
    // 2. Verify risk signal emitted
    // 3. Verify risk assessment created with HIGH score
    // 4. Verify intervention triggered
    // 5. Verify frontend event emitted
  });

  it('should maintain audit chain integrity', async () => {
    // 1. Perform multiple RG actions
    // 2. Verify each audit entry has correct hash
    // 3. Verify chain integrity check passes
    // 4. Tamper with one entry
    // 5. Verify chain integrity check fails at tampered entry
  });
});
```

#### Regulatory Compliance Tests

```typescript
describe('UKGC Compliance', () => {
  it('should require deposit limit at registration (LCCP 3.5.1)', async () => {
    // UK tenant → registration without deposit limit → blocked
  });

  it('should enforce 24h cooling-off for limit increases', async () => {
    // UK tenant → limit increase → effectiveAt = now + 24h
  });

  it('should mandate reality checks at max 60min intervals (RTS 17C)', async () => {
    // UK tenant → player sets 120min → capped at 60min
  });

  it('should integrate with GAMSTOP for national exclusion (LCCP 3.9.2)', async () => {
    // UK tenant → national exclusion → GAMSTOP API called
  });

  it('should show time played and net position in reality checks', async () => {
    // UK tenant → reality check → includes TIME_PLAYED and NET_POSITION
  });
});

describe('MGA Compliance', () => {
  it('should support 6-month minimum exclusion', async () => {
    // Malta tenant → exclusion < 6 months → rejected
  });

  it('should include RG messaging on all pages', async () => {
    // Malta tenant → RG messaging config → rgMessageOnEveryPage = true
  });
});

describe('US State Compliance', () => {
  it('NJ: should sync with state exclusion list', async () => {
    // NJ tenant → check state registry on login
  });

  it('PA: should enforce mandatory loss limits', async () => {
    // PA tenant → loss limit required → enforce
  });

  it('MI: should display responsible gaming messaging', async () => {
    // MI tenant → RG messaging visible
  });

  it('ON: should require deposit limit at registration', async () => {
    // Ontario tenant → registration without limit → blocked
  });
});
```

### Load Testing Considerations

```typescript
/**
 * The responsible gaming system must handle peak load without
 * introducing latency that could degrade the player experience
 * or, more importantly, delay safety interventions.
 *
 * Performance targets:
 * - Limit check (checkLimitAvailability):  < 5ms p99
 * - Exclusion check (login gate):          < 10ms p99
 * - Risk assessment (full):                < 500ms p99
 * - Reality check trigger:                 < 50ms p99
 * - Audit log write:                       < 20ms p99
 *
 * The limit check and exclusion check are on the critical path
 * for every deposit and login respectively. They must be fast.
 * Use Redis caching for hot-path checks with DB as source of truth.
 */
```

### Test Data Fixtures

```typescript
/**
 * Test fixtures for responsible gaming tests.
 * 
 * IMPORTANT: Never use real player data in tests.
 * All test players must have clearly synthetic identifiers.
 */
export const testPlayers = {
  normalPlayer: {
    id: 'test-player-normal-001',
    tenantId: 'test-tenant-001',
    age: 35,
    jurisdiction: 'UK',
  },
  highRiskPlayer: {
    id: 'test-player-highrisk-001',
    tenantId: 'test-tenant-001',
    age: 22,
    jurisdiction: 'UK',
    // Simulated high-risk behaviors
    depositsLast24h: 8,
    lossChasingScore: 0.85,
    lateNightMinutes: 240,
  },
  excludedPlayer: {
    id: 'test-player-excluded-001',
    tenantId: 'test-tenant-001',
    exclusionScope: 'NATIONAL',
    exclusionDuration: 'ONE_YEAR',
    gamstopId: 'GAMSTOP-TEST-001',
  },
  underagePlayer: {
    id: 'test-player-underage-001',
    tenantId: 'test-tenant-001',
    age: 17,
    jurisdiction: 'UK',
  },
  borderlineAgePlayer: {
    id: 'test-player-borderline-001',
    tenantId: 'test-tenant-001',
    age: 18,
    jurisdiction: 'UK',
  },
};
```

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| `0.1.0` | 2025-06-01 | Initial implementation — deposit/loss/time limits, self-exclusion, reality checks |
| `0.2.0` | 2025-08-15 | Added ML-based risk assessment engine, behavioral analyzer |
| `0.3.0` | 2025-10-01 | GAMSTOP integration, multi-venue exclusion sync |
| `0.4.0` | 2025-11-15 | Intervention orchestrator with 5-level escalation |
| `0.5.0` | 2025-12-01 | Underage prevention gate, enhanced age verification |
| `0.6.0` | 2026-01-15 | US state-level registry integrations (NJ, PA, MI) |
| `0.7.0` | 2026-02-01 | Cryptographic audit chain, tamper detection |

---

*This module is regulatory-critical. Changes require compliance team sign-off and must pass all regulatory compliance test suites before deployment.*