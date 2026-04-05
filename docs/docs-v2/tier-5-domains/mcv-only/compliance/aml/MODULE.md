# @mcv/compliance/aml

> **Tier 5 — MCV-Only Domain Module**
> Anti-Money Laundering (AML) transaction monitoring, suspicious activity detection, regulatory reporting, and case management.

| Field | Value |
|---|---|
| **Package** | `@mcv/compliance/aml` |
| **Tier** | 5 — Domain (MCV-Only) |
| **Owner** | Compliance Engineering |
| **Since** | 0.1.0 |
| **Status** | Production — Regulatory Critical |
| **Jurisdiction** | Global (FinCEN, FCA, AUSTRAC, MAS, FINTRAC, BaFin) |
| **Classification** | RESTRICTED — Contains regulatory logic, sanctions data references, and investigation workflows |

---

## Purpose

Anti-Money Laundering (AML) is the compliance backbone that prevents MCV platform ventures from being exploited for money laundering, terrorist financing, sanctions evasion, or other financial crimes. Every financial transaction that flows through any MCV venture — whether a BetEdge wager, a payment processed through our connectors, or a cross-border transfer — passes through the AML engine for real-time screening, risk scoring, and rule evaluation. Without this module, MCV ventures would be operating in violation of the Bank Secrecy Act (BSA), the EU Anti-Money Laundering Directives (4AMLD/5AMLD/6AMLD), and dozens of equivalent regulations across every jurisdiction in which MCV operates.

The module implements a multi-layered defense architecture: first, every transaction undergoes real-time screening against configurable rule sets that detect structuring (breaking large amounts into smaller deposits to evade reporting thresholds), smurfing (using multiple accounts or individuals to layer illicit funds), round-tripping (circular fund movements designed to obscure origin), and velocity anomalies (unusual transaction frequency or volume). Second, all parties involved in transactions are screened against global watchlists including OFAC's Specially Designated Nationals (SDN) list, EU consolidated sanctions lists, Politically Exposed Person (PEP) databases, and adverse media feeds. Third, a continuous risk scoring engine maintains per-user and per-transaction risk profiles that evolve based on behavioral patterns, geographic indicators, and historical activity.

When the system detects suspicious activity, it generates alerts that enter a structured case management workflow. Compliance analysts triage alerts, investigate flagged transactions, collect evidence, and — when warranted — file Suspicious Activity Reports (SARs) with the appropriate regulatory body. The module also handles Currency Transaction Reports (CTRs) for transactions exceeding $10,000 (or jurisdiction-specific equivalents), maintains complete audit trails for regulatory examination, and generates automated reports for FinCEN, FCA, AUSTRAC, MAS, and other regulators. Every screening decision, analyst action, and report submission is immutably logged to satisfy the record-keeping requirements that regulators enforce during examinations. This is not optional infrastructure — it is a legal requirement, and failures here carry criminal penalties.

---

## Exports

```typescript
// @mcv/compliance/aml — Public API

// ─── Core Service ────────────────────────────────────────────────
export { AMLService }                    from './services/aml-service';
export { AMLServiceConfig }              from './services/aml-service-config';

// ─── Transaction Screening ───────────────────────────────────────
export { TransactionScreener }           from './screening/transaction-screener';
export { BatchScreener }                 from './screening/batch-screener';
export { RealTimeScreener }              from './screening/realtime-screener';
export { ScreeningResult }               from './screening/screening-result';
export { ScreeningDecision }             from './screening/screening-decision';

// ─── Rule Engine ─────────────────────────────────────────────────
export { RuleEngine }                    from './rules/rule-engine';
export { RuleSet }                       from './rules/rule-set';
export { RuleEvaluator }                 from './rules/rule-evaluator';
export { RuleBuilder }                   from './rules/rule-builder';
export { StructuringDetector }           from './rules/detectors/structuring';
export { SmurfingDetector }              from './rules/detectors/smurfing';
export { RoundTripDetector }             from './rules/detectors/round-trip';
export { VelocityDetector }              from './rules/detectors/velocity';
export { LayeringDetector }              from './rules/detectors/layering';

// ─── Risk Scoring ────────────────────────────────────────────────
export { RiskScorer }                    from './risk/risk-scorer';
export { RiskProfile }                   from './risk/risk-profile';
export { RiskFactorRegistry }            from './risk/risk-factor-registry';
export { GeographicRiskEngine }          from './risk/geographic-risk';
export { BehavioralRiskEngine }          from './risk/behavioral-risk';

// ─── Watchlist Screening ─────────────────────────────────────────
export { WatchlistScreener }             from './watchlist/watchlist-screener';
export { OFACScreener }                  from './watchlist/ofac-screener';
export { EUSanctionsScreener }           from './watchlist/eu-sanctions-screener';
export { PEPScreener }                   from './watchlist/pep-screener';
export { AdverseMediaScreener }          from './watchlist/adverse-media-screener';
export { WatchlistMatch }                from './watchlist/watchlist-match';
export { FuzzyMatcher }                  from './watchlist/fuzzy-matcher';

// ─── Alert Management ────────────────────────────────────────────
export { AlertManager }                  from './alerts/alert-manager';
export { AlertTriageEngine }             from './alerts/alert-triage';
export { AlertEscalation }               from './alerts/alert-escalation';
export { FalsePositiveTracker }          from './alerts/false-positive-tracker';
export { AlertTuningAdvisor }            from './alerts/alert-tuning-advisor';

// ─── Case Management ─────────────────────────────────────────────
export { CaseManager }                   from './cases/case-manager';
export { CaseWorkflow }                  from './cases/case-workflow';
export { InvestigationService }          from './cases/investigation-service';
export { EvidenceCollector }             from './cases/evidence-collector';
export { CaseAssignment }               from './cases/case-assignment';
export { CaseTimeline }                  from './cases/case-timeline';

// ─── SAR Filing ──────────────────────────────────────────────────
export { SARService }                    from './sar/sar-service';
export { SARGenerator }                  from './sar/sar-generator';
export { SARSubmitter }                  from './sar/sar-submitter';
export { SARDeadlineTracker }            from './sar/sar-deadline-tracker';
export { CTRService }                    from './sar/ctr-service';
export { CTRGenerator }                  from './sar/ctr-generator';

// ─── Regulatory Reporting ────────────────────────────────────────
export { ReportingService }              from './reporting/reporting-service';
export { FinCENReporter }                from './reporting/fincen-reporter';
export { FCAReporter }                   from './reporting/fca-reporter';
export { AUSTRACReporter }              from './reporting/austrac-reporter';
export { MASReporter }                   from './reporting/mas-reporter';
export { FINTRACReporter }              from './reporting/fintrac-reporter';

// ─── Audit ───────────────────────────────────────────────────────
export { AuditTrail }                    from './audit/audit-trail';
export { AuditLogger }                   from './audit/audit-logger';
export { ExaminationPackager }           from './audit/examination-packager';

// ─── Streaming / Real-Time ───────────────────────────────────────
export { TransactionStreamConsumer }     from './streaming/transaction-consumer';
export { AlertStreamProducer }           from './streaming/alert-producer';
export { AMLEventBus }                   from './streaming/aml-event-bus';

// ─── Types ───────────────────────────────────────────────────────
export type {
  AMLConfig,
  TransactionPayload,
  ScreeningVerdict,
  AlertSeverity,
  AlertStatus,
  CaseStatus,
  CasePriority,
  SARStatus,
  CTRStatus,
  RiskLevel,
  RiskFactor,
  WatchlistType,
  MatchConfidence,
  RuleType,
  RuleAction,
  DetectionPattern,
  JurisdictionCode,
  ReportFormat,
  AuditAction,
  TuningRecommendation,
  VentureAMLConfig,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          AML SYSTEM ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │  BetEdge     │    │  Payment         │    │  Other Venture               │   │
│  │  Wagers      │    │  Connectors      │    │  Transactions                │   │
│  └──────┬───────┘    └────────┬─────────┘    └──────────────┬───────────────┘   │
│         │                     │                              │                   │
│         └─────────────────────┼──────────────────────────────┘                   │
│                               ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │                    REDPANDA — Transaction Stream                        │     │
│  │                    topic: aml.transactions.inbound                      │     │
│  └────────────────────────────────┬────────────────────────────────────────┘     │
│                                   ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │                 TRANSACTION STREAM CONSUMER                             │     │
│  │  • Deserialize & validate transaction payload                          │     │
│  │  • Enrich with user profile, geo data, historical context              │     │
│  │  • Route to screening pipeline                                         │     │
│  └────────────────────────────────┬────────────────────────────────────────┘     │
│                                   ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │                     SCREENING PIPELINE                                  │     │
│  │                                                                         │     │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │     │
│  │  │  WATCHLIST       │  │  RULE ENGINE      │  │  RISK SCORER          │  │     │
│  │  │  SCREENER        │  │                   │  │                       │  │     │
│  │  │                  │  │  • Structuring     │  │  • User risk profile  │  │     │
│  │  │  • OFAC/SDN      │  │  • Smurfing        │  │  • Tx risk score     │  │     │
│  │  │  • EU Sanctions  │  │  • Round-tripping  │  │  • Geo risk          │  │     │
│  │  │  • PEP lists     │  │  • Velocity        │  │  • Behavioral risk   │  │     │
│  │  │  • Adverse media │  │  • Layering        │  │  • Amount patterns   │  │     │
│  │  │  • Fuzzy match   │  │  • Custom rules    │  │  • Time patterns     │  │     │
│  │  └────────┬─────────┘  └─────────┬──────────┘  └──────────┬──────────┘  │     │
│  │           │                      │                         │             │     │
│  │           └──────────────────────┼─────────────────────────┘             │     │
│  │                                  ▼                                       │     │
│  │                    ┌─────────────────────────┐                           │     │
│  │                    │  SCREENING DECISION      │                           │     │
│  │                    │  AGGREGATOR              │                           │     │
│  │                    │                          │                           │     │
│  │                    │  PASS → log & release    │                           │     │
│  │                    │  REVIEW → generate alert │                           │     │
│  │                    │  BLOCK → hold & alert    │                           │     │
│  │                    │  ESCALATE → urgent case  │                           │     │
│  │                    └────────────┬─────────────┘                           │     │
│  └─────────────────────────────────┼───────────────────────────────────────┘     │
│                                    │                                             │
│            ┌───────────────────────┼───────────────────────┐                     │
│            ▼                       ▼                       ▼                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐       │
│  │  AUDIT TRAIL      │  │  ALERT MANAGER   │  │  CTR SERVICE             │       │
│  │                   │  │                   │  │                          │       │
│  │  • Every screen   │  │  • Triage queue   │  │  • Auto-file for > $10K │       │
│  │  • Every decision │  │  • Severity rank  │  │  • Aggregation rules     │       │
│  │  • Immutable log  │  │  • Assignment     │  │  • Batch submission      │       │
│  └──────────────────┘  │  • Escalation      │  └──────────────────────────┘       │
│                        └─────────┬──────────┘                                    │
│                                  ▼                                                │
│                    ┌──────────────────────────┐                                   │
│                    │  CASE MANAGEMENT          │                                   │
│                    │                           │                                   │
│                    │  • Investigation workflow │                                   │
│                    │  • Evidence collection    │                                   │
│                    │  • Analyst assignment     │                                   │
│                    │  • Timeline tracking      │                                   │
│                    │  • Peer review            │                                   │
│                    └────────────┬──────────────┘                                   │
│                                 │                                                 │
│                    ┌────────────┴──────────────┐                                  │
│                    ▼                           ▼                                   │
│       ┌─────────────────────┐    ┌─────────────────────────┐                     │
│       │  SAR FILING          │    │  CASE CLOSED             │                     │
│       │                      │    │                          │                     │
│       │  • Generate report   │    │  • False positive logged │                     │
│       │  • Track deadline    │    │  • Tuning recommendation │                     │
│       │  • Submit to BSA     │    │  • Audit record sealed   │                     │
│       │  • Confirm receipt   │    └──────────────────────────┘                     │
│       └──────────┬───────────┘                                                    │
│                  ▼                                                                │
│       ┌──────────────────────────────────────────────────┐                        │
│       │  REGULATORY REPORTING                             │                        │
│       │                                                   │                        │
│       │  FinCEN │ FCA │ AUSTRAC │ MAS │ FINTRAC │ BaFin  │                        │
│       └──────────────────────────────────────────────────┘                        │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

1. **Ingest** — Transactions arrive via Redpanda topics from all MCV ventures
2. **Enrich** — Transaction payloads are enriched with user profiles, KYC status, geographic data
3. **Screen** — Parallel screening: watchlist check, rule evaluation, risk scoring
4. **Decide** — Screening results aggregated into a verdict: PASS, REVIEW, BLOCK, or ESCALATE
5. **Alert** — Non-PASS verdicts generate alerts with severity and recommended action
6. **Investigate** — Alerts become cases; analysts investigate, collect evidence, build timelines
7. **Report** — Confirmed suspicious activity triggers SAR/CTR filing with appropriate regulator
8. **Audit** — Every step is immutably logged for regulatory examination readiness

---

## Core Interfaces

### AMLService

The top-level service facade that orchestrates all AML operations. This is the primary entry point for ventures integrating with the AML system.

```typescript
interface AMLService {
  // ─── Transaction Screening ─────────────────────────────────
  /**
   * Screen a single transaction in real-time.
   * Returns screening result within SLA (< 200ms for real-time).
   */
  screenTransaction(
    tx: TransactionPayload,
    opts?: ScreeningOptions,
  ): Promise<ScreeningResult>;

  /**
   * Screen a batch of transactions (e.g., end-of-day reconciliation).
   * Returns results keyed by transaction ID.
   */
  screenBatch(
    transactions: TransactionPayload[],
    opts?: BatchScreeningOptions,
  ): Promise<Map<string, ScreeningResult>>;

  /**
   * Re-screen a previously screened transaction (e.g., after rule update).
   */
  rescreenTransaction(
    transactionId: string,
    opts?: ScreeningOptions,
  ): Promise<ScreeningResult>;

  // ─── Watchlist Operations ──────────────────────────────────
  /**
   * Screen an individual against all configured watchlists.
   */
  screenIndividual(
    individual: IndividualPayload,
    watchlists?: WatchlistType[],
  ): Promise<WatchlistScreenResult>;

  /**
   * Screen an entity (business, organization) against watchlists.
   */
  screenEntity(
    entity: EntityPayload,
    watchlists?: WatchlistType[],
  ): Promise<WatchlistScreenResult>;

  /**
   * Trigger a full portfolio re-screen against updated watchlists.
   */
  rescreenPortfolio(
    ventureId: string,
    watchlists?: WatchlistType[],
  ): Promise<PortfolioScreenJob>;

  // ─── Risk Operations ───────────────────────────────────────
  /**
   * Get the current risk profile for a user.
   */
  getRiskProfile(userId: string, ventureId: string): Promise<RiskProfile>;

  /**
   * Recalculate risk score for a user based on latest data.
   */
  recalculateRisk(userId: string, ventureId: string): Promise<RiskScore>;

  /**
   * Get risk score for a specific transaction.
   */
  getTransactionRisk(transactionId: string): Promise<TransactionRiskScore>;

  // ─── Alert Operations ──────────────────────────────────────
  /**
   * Get alerts with filtering and pagination.
   */
  getAlerts(filter: AlertFilter): Promise<PaginatedResult<Alert>>;

  /**
   * Triage an alert (assign severity, analyst, priority).
   */
  triageAlert(
    alertId: string,
    triage: AlertTriageInput,
  ): Promise<Alert>;

  /**
   * Mark an alert as false positive with justification.
   */
  dismissAlert(
    alertId: string,
    dismissal: AlertDismissal,
  ): Promise<Alert>;

  /**
   * Escalate an alert to a case.
   */
  escalateToCase(
    alertId: string,
    caseInput: CaseCreationInput,
  ): Promise<Case>;

  // ─── Case Operations ───────────────────────────────────────
  /**
   * Get cases with filtering and pagination.
   */
  getCases(filter: CaseFilter): Promise<PaginatedResult<Case>>;

  /**
   * Get a single case with full details.
   */
  getCase(caseId: string): Promise<CaseDetail>;

  /**
   * Assign a case to an analyst.
   */
  assignCase(
    caseId: string,
    analystId: string,
    opts?: AssignmentOptions,
  ): Promise<Case>;

  /**
   * Add evidence to a case.
   */
  addEvidence(
    caseId: string,
    evidence: EvidenceInput,
  ): Promise<Evidence>;

  /**
   * Add a note to a case timeline.
   */
  addCaseNote(
    caseId: string,
    note: CaseNoteInput,
  ): Promise<CaseNote>;

  /**
   * Close a case with resolution.
   */
  closeCase(
    caseId: string,
    resolution: CaseResolution,
  ): Promise<Case>;

  // ─── SAR / CTR Operations ─────────────────────────────────
  /**
   * Generate a SAR from a case.
   */
  generateSAR(
    caseId: string,
    opts?: SARGenerationOptions,
  ): Promise<SARReport>;

  /**
   * Submit a SAR to the appropriate regulatory body.
   */
  submitSAR(sarId: string): Promise<SARSubmission>;

  /**
   * Get SAR filing deadlines and status.
   */
  getSARDeadlines(filter?: DeadlineFilter): Promise<SARDeadline[]>;

  /**
   * Generate a CTR for a transaction exceeding the threshold.
   */
  generateCTR(
    transactionId: string,
    opts?: CTRGenerationOptions,
  ): Promise<CTRReport>;

  /**
   * Submit a batch of CTRs.
   */
  submitCTRBatch(ctrIds: string[]): Promise<CTRBatchSubmission>;

  // ─── Reporting ─────────────────────────────────────────────
  /**
   * Generate a regulatory report for a specific jurisdiction.
   */
  generateReport(
    jurisdiction: JurisdictionCode,
    period: ReportPeriod,
    opts?: ReportOptions,
  ): Promise<RegulatoryReport>;

  /**
   * Get report submission history.
   */
  getReportHistory(
    jurisdiction: JurisdictionCode,
    filter?: ReportHistoryFilter,
  ): Promise<PaginatedResult<RegulatoryReport>>;

  // ─── Rule Management ───────────────────────────────────────
  /**
   * Get all active rules for a venture.
   */
  getRules(ventureId: string): Promise<AMLRule[]>;

  /**
   * Create or update a rule.
   */
  upsertRule(rule: AMLRuleInput): Promise<AMLRule>;

  /**
   * Disable a rule (soft delete — rules are never hard-deleted).
   */
  disableRule(ruleId: string, reason: string): Promise<AMLRule>;

  /**
   * Test a rule against historical transactions.
   */
  backtestRule(
    rule: AMLRuleInput,
    period: DateRange,
  ): Promise<BacktestResult>;

  // ─── Audit ─────────────────────────────────────────────────
  /**
   * Query the audit trail.
   */
  getAuditTrail(filter: AuditFilter): Promise<PaginatedResult<AuditEntry>>;

  /**
   * Package audit data for regulatory examination.
   */
  packageForExamination(
    examinationRequest: ExaminationRequest,
  ): Promise<ExaminationPackage>;

  // ─── Configuration ─────────────────────────────────────────
  /**
   * Get AML configuration for a venture.
   */
  getVentureConfig(ventureId: string): Promise<VentureAMLConfig>;

  /**
   * Update AML configuration for a venture.
   */
  updateVentureConfig(
    ventureId: string,
    config: Partial<VentureAMLConfig>,
  ): Promise<VentureAMLConfig>;
}
```

### TransactionPayload

```typescript
interface TransactionPayload {
  /** Unique transaction identifier from source system */
  transactionId: string;

  /** MCV venture originating the transaction */
  ventureId: string;

  /** Transaction type classification */
  type: TransactionType;

  /** Direction of funds */
  direction: 'inbound' | 'outbound' | 'internal';

  /** Transaction amount */
  amount: {
    value: number;
    currency: string;       // ISO 4217
    valueUSD: number;       // Normalized to USD for threshold checks
  };

  /** Originator details */
  originator: {
    userId: string;
    name: string;
    accountId: string;
    accountType: string;
    country: string;        // ISO 3166-1 alpha-2
    ip?: string;
    deviceFingerprint?: string;
  };

  /** Beneficiary details */
  beneficiary: {
    userId?: string;        // null for external transfers
    name: string;
    accountId: string;
    accountType: string;
    country: string;
    institution?: string;   // Bank/payment provider
    institutionBIC?: string;
  };

  /** Payment method details */
  paymentMethod: {
    type: PaymentMethodType;
    provider: string;
    instrumentId?: string;
    instrumentLast4?: string;
  };

  /** Temporal data */
  timestamp: Date;
  settlementDate?: Date;

  /** Source system metadata */
  metadata: {
    sourceSystem: string;
    sourceTransactionId: string;
    channel: 'web' | 'mobile' | 'api' | 'batch';
    sessionId?: string;
    referenceNote?: string;
  };
}

type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'wager'
  | 'payout'
  | 'refund'
  | 'fee'
  | 'adjustment'
  | 'conversion';

type PaymentMethodType =
  | 'card'
  | 'bank_transfer'
  | 'wire'
  | 'crypto'
  | 'ewallet'
  | 'prepaid'
  | 'cash'
  | 'ach'
  | 'sepa';
```

### ScreeningResult

```typescript
interface ScreeningResult {
  /** Unique screening ID */
  screeningId: string;

  /** Reference to the screened transaction */
  transactionId: string;

  /** Overall verdict */
  verdict: ScreeningVerdict;

  /** Individual screening component results */
  components: {
    watchlist: WatchlistScreenResult;
    rules: RuleEvaluationResult;
    riskScore: TransactionRiskScore;
  };

  /** Aggregated risk score (0-1000) */
  aggregateRiskScore: number;

  /** Rules that triggered */
  triggeredRules: TriggeredRule[];

  /** Watchlist matches found */
  watchlistMatches: WatchlistMatch[];

  /** Recommended action */
  recommendedAction: RecommendedAction;

  /** Whether the transaction should be held pending review */
  holdTransaction: boolean;

  /** Processing time in milliseconds */
  processingTimeMs: number;

  /** Timestamp of screening */
  screenedAt: Date;

  /** Screening version (for reproducibility) */
  ruleSetVersion: string;
}

type ScreeningVerdict =
  | 'PASS'       // No issues detected — transaction proceeds
  | 'REVIEW'     // Potential issue — generate alert for analyst review
  | 'BLOCK'      // High confidence issue — hold transaction, generate alert
  | 'ESCALATE';  // Critical match — immediate escalation, hold transaction

interface RecommendedAction {
  action: 'release' | 'hold' | 'block' | 'escalate';
  reason: string;
  alertSeverity?: AlertSeverity;
  autoFileRequired?: boolean;  // true if CTR threshold met
}
```

### Alert

```typescript
interface Alert {
  /** Unique alert identifier */
  alertId: string;

  /** MCV venture context */
  ventureId: string;

  /** Alert type classification */
  type: AlertType;

  /** Severity level */
  severity: AlertSeverity;

  /** Current status */
  status: AlertStatus;

  /** Priority for triage */
  priority: AlertPriority;

  /** Transaction(s) that triggered the alert */
  transactionIds: string[];

  /** User(s) involved */
  userIds: string[];

  /** Rules that triggered */
  triggeredRules: TriggeredRule[];

  /** Risk score at time of alert */
  riskScore: number;

  /** Assigned analyst */
  assignedTo?: string;

  /** Case ID if escalated */
  caseId?: string;

  /** Alert narrative (auto-generated summary) */
  narrative: string;

  /** Detection details */
  detection: {
    pattern: DetectionPattern;
    confidence: number;         // 0.0 - 1.0
    lookbackPeriod: string;     // e.g., '24h', '7d', '30d'
    relatedTransactionCount: number;
    aggregateAmount: number;
    aggregateCurrency: string;
  };

  /** Triage metadata */
  triage?: {
    triagedBy: string;
    triagedAt: Date;
    originalSeverity: AlertSeverity;
    adjustedSeverity?: AlertSeverity;
    notes: string;
  };

  /** Disposition if resolved */
  disposition?: {
    outcome: 'true_positive' | 'false_positive' | 'inconclusive';
    resolvedBy: string;
    resolvedAt: Date;
    justification: string;
  };

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  slaDeadline: Date;           // Must be triaged before this time
}

type AlertType =
  | 'structuring'
  | 'smurfing'
  | 'round_trip'
  | 'velocity_anomaly'
  | 'layering'
  | 'watchlist_match'
  | 'threshold_breach'
  | 'geographic_risk'
  | 'behavioral_anomaly'
  | 'adverse_media'
  | 'pep_match'
  | 'custom_rule';

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
type AlertStatus = 'new' | 'triaged' | 'investigating' | 'escalated' | 'resolved' | 'dismissed';
type AlertPriority = 'P1' | 'P2' | 'P3' | 'P4';
```

### Case

```typescript
interface Case {
  /** Unique case identifier */
  caseId: string;

  /** MCV venture context */
  ventureId: string;

  /** Case title */
  title: string;

  /** Case type */
  type: CaseType;

  /** Current status */
  status: CaseStatus;

  /** Priority */
  priority: CasePriority;

  /** Subject(s) of the investigation */
  subjects: CaseSubject[];

  /** Alert(s) that originated the case */
  alertIds: string[];

  /** All related transaction IDs */
  transactionIds: string[];

  /** Assigned analyst */
  assignedAnalyst: {
    analystId: string;
    name: string;
    assignedAt: Date;
  };

  /** Reviewing analyst (peer review) */
  reviewer?: {
    analystId: string;
    name: string;
    assignedAt: Date;
  };

  /** Investigation summary */
  summary: string;

  /** Total suspicious amount identified */
  suspiciousAmount: {
    value: number;
    currency: string;
  };

  /** Risk assessment */
  riskAssessment: {
    level: RiskLevel;
    factors: RiskFactor[];
    narrative: string;
  };

  /** SAR filing details (if applicable) */
  sarFiling?: {
    sarId: string;
    status: SARStatus;
    filedAt?: Date;
    deadline: Date;
  };

  /** Resolution */
  resolution?: CaseResolution;

  /** Key dates */
  dates: {
    created: Date;
    updated: Date;
    sarDeadline?: Date;       // 30 days from detection (FinCEN)
    targetClose?: Date;
    closed?: Date;
  };

  /** Audit trail reference */
  auditTrailId: string;
}

interface CaseSubject {
  userId: string;
  name: string;
  role: 'primary' | 'associated' | 'counterparty';
  riskProfile: RiskProfile;
  kycStatus: string;
}

interface CaseResolution {
  outcome: 'sar_filed' | 'no_action' | 'account_closed' | 'referred_to_law_enforcement' | 'monitoring_enhanced';
  justification: string;
  resolvedBy: string;
  reviewedBy: string;
  resolvedAt: Date;
}

type CaseType = 'suspicious_activity' | 'watchlist_match' | 'threshold_reporting' | 'regulatory_referral' | 'law_enforcement_request';
type CaseStatus = 'open' | 'investigating' | 'pending_review' | 'pending_sar' | 'closed';
type CasePriority = 'critical' | 'high' | 'medium' | 'low';
```

### SARReport

```typescript
interface SARReport {
  /** Unique SAR identifier */
  sarId: string;

  /** Associated case */
  caseId: string;

  /** MCV venture context */
  ventureId: string;

  /** Target regulatory body */
  jurisdiction: JurisdictionCode;

  /** SAR status */
  status: SARStatus;

  /** Filing type */
  filingType: 'initial' | 'continuing' | 'corrective';

  /** Subject information */
  subjects: SARSubject[];

  /** Suspicious activity details */
  activity: {
    dateRange: {
      start: Date;
      end: Date;
    };
    totalAmount: number;
    currency: string;
    instrumentTypes: string[];
    activityTypes: SuspiciousActivityType[];
    narrative: string;          // BSA narrative (max 20,000 chars)
  };

  /** Financial institution filing details */
  filingInstitution: {
    name: string;
    ein: string;               // Employer Identification Number
    address: string;
    regulatorId: string;
  };

  /** Submission tracking */
  submission?: {
    submittedAt: Date;
    confirmationNumber: string;
    bsaId?: string;            // BSA E-Filing confirmation
    acknowledgedAt?: Date;
  };

  /** Key dates */
  dates: {
    created: Date;
    deadline: Date;             // Must file within 30 days of detection
    submitted?: Date;
    acknowledged?: Date;
  };

  /** Generated by */
  preparedBy: string;

  /** Reviewed by */
  reviewedBy?: string;

  /** Document attachments */
  attachments: SARAttachment[];
}

type SARStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'submitted'
  | 'acknowledged'
  | 'rejected'
  | 'amendment_required';

type SuspiciousActivityType =
  | 'structuring'
  | 'money_laundering'
  | 'terrorist_financing'
  | 'fraud'
  | 'identity_theft'
  | 'sanctions_evasion'
  | 'bribery_corruption'
  | 'tax_evasion'
  | 'insider_trading'
  | 'other';

interface SARSubject {
  name: string;
  dateOfBirth?: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  country: string;
  role: 'subject' | 'beneficiary' | 'conductor';
  relationship?: string;
}
```

### RiskScore & RiskProfile

```typescript
interface RiskScore {
  /** Overall risk score (0-1000) */
  score: number;

  /** Risk level classification */
  level: RiskLevel;

  /** Individual risk factor scores */
  factors: RiskFactorScore[];

  /** Score explanation */
  explanation: string;

  /** Model version used */
  modelVersion: string;

  /** Calculated at */
  calculatedAt: Date;
}

interface RiskProfile {
  /** User identifier */
  userId: string;

  /** Venture context */
  ventureId: string;

  /** Current overall risk score */
  currentScore: RiskScore;

  /** Historical score trajectory */
  scoreHistory: {
    date: Date;
    score: number;
    level: RiskLevel;
  }[];

  /** User risk factors */
  factors: {
    geographic: GeographicRiskFactor;
    transactional: TransactionalRiskFactor;
    behavioral: BehavioralRiskFactor;
    kyc: KYCRiskFactor;
    network: NetworkRiskFactor;
  };

  /** Enhanced due diligence required */
  eddRequired: boolean;

  /** Monitoring level */
  monitoringLevel: 'standard' | 'enhanced' | 'intensive';

  /** Last review date */
  lastReviewDate: Date;

  /** Next scheduled review */
  nextReviewDate: Date;

  /** Profile metadata */
  createdAt: Date;
  updatedAt: Date;
}

interface RiskFactorScore {
  factor: string;
  score: number;              // 0-1000
  weight: number;             // 0.0-1.0
  weightedScore: number;      // score * weight
  details: string;
  dataPoints: Record<string, unknown>;
}

interface GeographicRiskFactor {
  residenceCountry: string;
  residenceRiskScore: number;
  transactionCountries: string[];
  highRiskCountryExposure: boolean;
  fatfGreyList: boolean;
  fatfBlackList: boolean;
  sanctionedJurisdiction: boolean;
}

interface TransactionalRiskFactor {
  averageTransactionSize: number;
  transactionFrequency: number;
  largestTransaction: number;
  cashIntensive: boolean;
  crossBorderRatio: number;
  structuringIndicators: number;
  velocityAnomalies: number;
}

interface BehavioralRiskFactor {
  accountAge: number;          // days
  loginPatternAnomaly: boolean;
  deviceChanges: number;
  ipChanges: number;
  unusualTimingPatterns: boolean;
  rapidSuccessionTransactions: boolean;
}

type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal';
```

### WatchlistMatch

```typescript
interface WatchlistMatch {
  /** Unique match identifier */
  matchId: string;

  /** Watchlist source */
  watchlistType: WatchlistType;

  /** Watchlist entry matched */
  watchlistEntry: {
    entryId: string;
    listName: string;
    listVersion: string;
    lastUpdated: Date;
  };

  /** Screened party */
  screenedParty: {
    name: string;
    dateOfBirth?: string;
    country?: string;
    idNumber?: string;
    entityType: 'individual' | 'entity';
  };

  /** Match details */
  match: {
    confidence: MatchConfidence;
    score: number;              // 0-100 fuzzy match score
    matchedFields: MatchedField[];
    algorithm: string;          // e.g., 'jaro-winkler', 'levenshtein', 'phonetic'
  };

  /** Disposition */
  disposition?: {
    status: 'confirmed' | 'false_positive' | 'pending';
    reviewedBy?: string;
    reviewedAt?: Date;
    justification?: string;
  };

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface MatchedField {
  field: string;               // e.g., 'name', 'dob', 'country'
  screenedValue: string;
  watchlistValue: string;
  similarity: number;          // 0.0-1.0
}

type WatchlistType =
  | 'ofac_sdn'
  | 'ofac_consolidated'
  | 'eu_sanctions'
  | 'un_sanctions'
  | 'uk_sanctions'
  | 'pep_global'
  | 'pep_domestic'
  | 'adverse_media'
  | 'custom';

type MatchConfidence = 'exact' | 'strong' | 'moderate' | 'weak';
```

---

## Database Schemas

All AML tables use Supabase PostgreSQL via Drizzle ORM. Tables are partitioned by venture for multi-tenant isolation and include row-level security (RLS) policies. Audit-critical tables use append-only patterns with no UPDATE or DELETE operations permitted.

### aml_alerts

```typescript
import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const alertSeverityEnum = pgEnum('alert_severity', [
  'critical', 'high', 'medium', 'low',
]);

export const alertStatusEnum = pgEnum('alert_status', [
  'new', 'triaged', 'investigating', 'escalated', 'resolved', 'dismissed',
]);

export const alertPriorityEnum = pgEnum('alert_priority', [
  'P1', 'P2', 'P3', 'P4',
]);

export const amlAlerts = pgTable('aml_alerts', {
  id:               uuid('id').primaryKey().defaultRandom(),
  ventureId:        uuid('venture_id').notNull().references(() => ventures.id),
  type:             text('type').notNull(),                    // AlertType
  severity:         alertSeverityEnum('severity').notNull(),
  status:           alertStatusEnum('status').notNull().default('new'),
  priority:         alertPriorityEnum('priority').notNull(),
  transactionIds:   jsonb('transaction_ids').notNull().$type<string[]>(),
  userIds:          jsonb('user_ids').notNull().$type<string[]>(),
  triggeredRules:   jsonb('triggered_rules').notNull().$type<TriggeredRule[]>(),
  riskScore:        integer('risk_score').notNull(),
  assignedTo:       uuid('assigned_to').references(() => analysts.id),
  caseId:           uuid('case_id').references(() => amlCases.id),
  narrative:        text('narrative').notNull(),
  detection:        jsonb('detection').notNull().$type<AlertDetection>(),
  triage:           jsonb('triage').$type<AlertTriage>(),
  disposition:      jsonb('disposition').$type<AlertDisposition>(),
  slaDeadline:      timestamp('sla_deadline', { withTimezone: true }).notNull(),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:       index('idx_aml_alerts_venture').on(table.ventureId),
  statusIdx:        index('idx_aml_alerts_status').on(table.status),
  severityIdx:      index('idx_aml_alerts_severity').on(table.severity),
  assignedIdx:      index('idx_aml_alerts_assigned').on(table.assignedTo),
  createdIdx:       index('idx_aml_alerts_created').on(table.createdAt),
  slaIdx:           index('idx_aml_alerts_sla').on(table.slaDeadline),
  ventureStatusIdx: index('idx_aml_alerts_venture_status').on(table.ventureId, table.status),
}));
```

### aml_cases

```typescript
export const caseStatusEnum = pgEnum('case_status', [
  'open', 'investigating', 'pending_review', 'pending_sar', 'closed',
]);

export const casePriorityEnum = pgEnum('case_priority', [
  'critical', 'high', 'medium', 'low',
]);

export const amlCases = pgTable('aml_cases', {
  id:                uuid('id').primaryKey().defaultRandom(),
  ventureId:         uuid('venture_id').notNull().references(() => ventures.id),
  title:             text('title').notNull(),
  type:              text('type').notNull(),                  // CaseType
  status:            caseStatusEnum('status').notNull().default('open'),
  priority:          casePriorityEnum('priority').notNull(),
  subjects:          jsonb('subjects').notNull().$type<CaseSubject[]>(),
  alertIds:          jsonb('alert_ids').notNull().$type<string[]>(),
  transactionIds:    jsonb('transaction_ids').notNull().$type<string[]>(),
  assignedAnalystId: uuid('assigned_analyst_id').notNull().references(() => analysts.id),
  reviewerId:        uuid('reviewer_id').references(() => analysts.id),
  summary:           text('summary').notNull().default(''),
  suspiciousAmount:  jsonb('suspicious_amount').notNull().$type<{ value: number; currency: string }>(),
  riskAssessment:    jsonb('risk_assessment').notNull().$type<CaseRiskAssessment>(),
  resolution:        jsonb('resolution').$type<CaseResolution>(),
  sarId:             uuid('sar_id').references(() => sarReports.id),
  sarDeadline:       timestamp('sar_deadline', { withTimezone: true }),
  targetCloseDate:   timestamp('target_close_date', { withTimezone: true }),
  closedAt:          timestamp('closed_at', { withTimezone: true }),
  auditTrailId:      uuid('audit_trail_id').notNull(),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:        index('idx_aml_cases_venture').on(table.ventureId),
  statusIdx:         index('idx_aml_cases_status').on(table.status),
  analystIdx:        index('idx_aml_cases_analyst').on(table.assignedAnalystId),
  sarDeadlineIdx:    index('idx_aml_cases_sar_deadline').on(table.sarDeadline),
  createdIdx:        index('idx_aml_cases_created').on(table.createdAt),
}));
```

### aml_rules

```typescript
export const amlRules = pgTable('aml_rules', {
  id:              uuid('id').primaryKey().defaultRandom(),
  ventureId:       uuid('venture_id').references(() => ventures.id),  // null = global rule
  name:            text('name').notNull(),
  description:     text('description').notNull(),
  type:            text('type').notNull(),                            // RuleType
  category:        text('category').notNull(),                        // DetectionPattern
  enabled:         boolean('enabled').notNull().default(true),
  priority:        integer('priority').notNull().default(100),        // Lower = higher priority

  /** Rule configuration — varies by type */
  config:          jsonb('config').notNull().$type<RuleConfig>(),

  /** Thresholds and parameters */
  thresholds:      jsonb('thresholds').notNull().$type<RuleThresholds>(),

  /** Action to take when rule triggers */
  action:          text('action').notNull(),                          // RuleAction
  alertSeverity:   alertSeverityEnum('alert_severity').notNull(),

  /** Rule versioning */
  version:         integer('version').notNull().default(1),
  previousVersion: uuid('previous_version'),

  /** Metadata */
  createdBy:       uuid('created_by').notNull(),
  approvedBy:      uuid('approved_by'),
  effectiveFrom:   timestamp('effective_from', { withTimezone: true }).notNull(),
  effectiveTo:     timestamp('effective_to', { withTimezone: true }),
  disabledAt:      timestamp('disabled_at', { withTimezone: true }),
  disabledReason:  text('disabled_reason'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:      index('idx_aml_rules_venture').on(table.ventureId),
  typeIdx:         index('idx_aml_rules_type').on(table.type),
  enabledIdx:      index('idx_aml_rules_enabled').on(table.enabled),
  categoryIdx:     index('idx_aml_rules_category').on(table.category),
}));

interface RuleConfig {
  /** Lookback window for pattern detection */
  lookbackPeriod: string;       // ISO 8601 duration, e.g., 'P1D', 'P7D'

  /** Minimum number of transactions to trigger */
  minTransactionCount?: number;

  /** Amount thresholds */
  amountThreshold?: number;
  aggregateAmountThreshold?: number;

  /** Velocity parameters */
  maxTransactionsPerHour?: number;
  maxTransactionsPerDay?: number;

  /** Geographic parameters */
  highRiskCountries?: string[];
  crossBorderOnly?: boolean;

  /** Pattern-specific parameters */
  structuringBandWidth?: number;    // e.g., 500 — detect amounts within $500 of threshold
  roundTripMaxHops?: number;
  smurfingMinAccounts?: number;

  /** Custom rule expression (for advanced rules) */
  expression?: string;              // Safe expression DSL
}

interface RuleThresholds {
  /** Score threshold to trigger (0-1000) */
  scoreThreshold: number;

  /** Confidence threshold (0.0-1.0) */
  confidenceThreshold: number;

  /** Maximum false positive rate target */
  targetFalsePositiveRate?: number;
}
```

### transaction_screens

```typescript
export const transactionScreens = pgTable('transaction_screens', {
  id:               uuid('id').primaryKey().defaultRandom(),
  ventureId:        uuid('venture_id').notNull().references(() => ventures.id),
  transactionId:    text('transaction_id').notNull(),
  verdict:          text('verdict').notNull(),                  // ScreeningVerdict
  aggregateRisk:    integer('aggregate_risk_score').notNull(),
  triggeredRuleIds: jsonb('triggered_rule_ids').$type<string[]>(),
  watchlistMatchIds:jsonb('watchlist_match_ids').$type<string[]>(),
  holdTransaction:  boolean('hold_transaction').notNull().default(false),
  ruleSetVersion:   text('rule_set_version').notNull(),
  processingTimeMs: integer('processing_time_ms').notNull(),

  /** Full screening result (for audit) */
  fullResult:       jsonb('full_result').notNull().$type<ScreeningResult>(),

  /** Transaction snapshot at time of screening */
  transactionSnapshot: jsonb('transaction_snapshot').notNull().$type<TransactionPayload>(),

  screenedAt:       timestamp('screened_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:       index('idx_tx_screens_venture').on(table.ventureId),
  transactionIdx:   index('idx_tx_screens_transaction').on(table.transactionId),
  verdictIdx:       index('idx_tx_screens_verdict').on(table.verdict),
  screenedAtIdx:    index('idx_tx_screens_screened_at').on(table.screenedAt),
  riskIdx:          index('idx_tx_screens_risk').on(table.aggregateRisk),
}));
```

### sar_reports

```typescript
export const sarStatusEnum = pgEnum('sar_status', [
  'draft', 'pending_review', 'approved', 'submitted', 'acknowledged', 'rejected', 'amendment_required',
]);

export const sarReports = pgTable('sar_reports', {
  id:                uuid('id').primaryKey().defaultRandom(),
  caseId:            uuid('case_id').notNull().references(() => amlCases.id),
  ventureId:         uuid('venture_id').notNull().references(() => ventures.id),
  jurisdiction:      text('jurisdiction').notNull(),           // JurisdictionCode
  status:            sarStatusEnum('status').notNull().default('draft'),
  filingType:        text('filing_type').notNull(),            // 'initial' | 'continuing' | 'corrective'
  subjects:          jsonb('subjects').notNull().$type<SARSubject[]>(),
  activity:          jsonb('activity').notNull().$type<SARActivity>(),
  filingInstitution: jsonb('filing_institution').notNull().$type<FilingInstitution>(),
  narrative:         text('narrative').notNull(),               // BSA narrative text
  submission:        jsonb('submission').$type<SARSubmissionRecord>(),
  attachments:       jsonb('attachments').$type<SARAttachment[]>(),
  preparedBy:        uuid('prepared_by').notNull().references(() => analysts.id),
  reviewedBy:        uuid('reviewed_by').references(() => analysts.id),
  deadline:          timestamp('deadline', { withTimezone: true }).notNull(),
  submittedAt:       timestamp('submitted_at', { withTimezone: true }),
  acknowledgedAt:    timestamp('acknowledged_at', { withTimezone: true }),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  caseIdx:           index('idx_sar_reports_case').on(table.caseId),
  ventureIdx:        index('idx_sar_reports_venture').on(table.ventureId),
  statusIdx:         index('idx_sar_reports_status').on(table.status),
  deadlineIdx:       index('idx_sar_reports_deadline').on(table.deadline),
  jurisdictionIdx:   index('idx_sar_reports_jurisdiction').on(table.jurisdiction),
}));
```

### watchlist_matches

```typescript
export const watchlistMatches = pgTable('watchlist_matches', {
  id:              uuid('id').primaryKey().defaultRandom(),
  ventureId:       uuid('venture_id').notNull().references(() => ventures.id),
  watchlistType:   text('watchlist_type').notNull(),           // WatchlistType
  screeningId:     uuid('screening_id').references(() => transactionScreens.id),
  watchlistEntry:  jsonb('watchlist_entry').notNull().$type<WatchlistEntry>(),
  screenedParty:   jsonb('screened_party').notNull().$type<ScreenedParty>(),
  matchDetails:    jsonb('match_details').notNull().$type<MatchDetails>(),
  confidence:      text('confidence').notNull(),               // MatchConfidence
  score:           integer('score').notNull(),                  // 0-100
  disposition:     jsonb('disposition').$type<WatchlistDisposition>(),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:      index('idx_wl_matches_venture').on(table.ventureId),
  typeIdx:         index('idx_wl_matches_type').on(table.watchlistType),
  screeningIdx:    index('idx_wl_matches_screening').on(table.screeningId),
  confidenceIdx:   index('idx_wl_matches_confidence').on(table.confidence),
  createdIdx:      index('idx_wl_matches_created').on(table.createdAt),
}));
```

### risk_profiles

```typescript
export const riskProfiles = pgTable('risk_profiles', {
  id:                uuid('id').primaryKey().defaultRandom(),
  userId:            uuid('user_id').notNull(),
  ventureId:         uuid('venture_id').notNull().references(() => ventures.id),
  currentScore:      integer('current_score').notNull(),
  riskLevel:         text('risk_level').notNull(),              // RiskLevel
  factors:           jsonb('factors').notNull().$type<RiskProfileFactors>(),
  scoreHistory:      jsonb('score_history').notNull().$type<ScoreHistoryEntry[]>(),
  eddRequired:       boolean('edd_required').notNull().default(false),
  monitoringLevel:   text('monitoring_level').notNull().default('standard'),
  lastReviewDate:    timestamp('last_review_date', { withTimezone: true }),
  nextReviewDate:    timestamp('next_review_date', { withTimezone: true }),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userVentureIdx:    uniqueIndex('idx_risk_profiles_user_venture').on(table.userId, table.ventureId),
  riskLevelIdx:      index('idx_risk_profiles_risk_level').on(table.riskLevel),
  eddIdx:            index('idx_risk_profiles_edd').on(table.eddRequired),
  nextReviewIdx:     index('idx_risk_profiles_next_review').on(table.nextReviewDate),
  scoreIdx:          index('idx_risk_profiles_score').on(table.currentScore),
}));
```

### aml_audit_log (Append-Only)

```typescript
/**
 * Append-only audit log. No UPDATE or DELETE operations are permitted.
 * Row-level security enforces read-only access for all roles except the audit writer.
 * Table is partitioned by month for performance.
 */
export const amlAuditLog = pgTable('aml_audit_log', {
  id:            uuid('id').primaryKey().defaultRandom(),
  ventureId:     uuid('venture_id').notNull(),
  action:        text('action').notNull(),                    // AuditAction
  entityType:    text('entity_type').notNull(),               // 'alert' | 'case' | 'sar' | 'screen' | 'rule' | 'config'
  entityId:      uuid('entity_id').notNull(),
  actorId:       uuid('actor_id'),                            // null for system actions
  actorType:     text('actor_type').notNull(),                // 'system' | 'analyst' | 'admin' | 'api'
  before:        jsonb('before'),                             // State before change
  after:         jsonb('after'),                              // State after change
  metadata:      jsonb('metadata').$type<Record<string, unknown>>(),
  ipAddress:     text('ip_address'),
  userAgent:     text('user_agent'),
  timestamp:     timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:    index('idx_aml_audit_venture').on(table.ventureId),
  entityIdx:     index('idx_aml_audit_entity').on(table.entityType, table.entityId),
  actorIdx:      index('idx_aml_audit_actor').on(table.actorId),
  timestampIdx:  index('idx_aml_audit_timestamp').on(table.timestamp),
  actionIdx:     index('idx_aml_audit_action').on(table.action),
}));
```

---

## Code Examples

### 1. Screen a Transaction in Real-Time

```typescript
import { AMLService } from '@mcv/compliance/aml';
import type { TransactionPayload } from '@mcv/compliance/aml';

const aml = new AMLService({
  ventureId: 'venture-betedge-001',
  redpankaUrl: process.env.REDPANDA_BROKER_URL!,
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY!,
});

// Transaction from BetEdge — user depositing funds
const transaction: TransactionPayload = {
  transactionId: 'tx-20260208-abc123',
  ventureId: 'venture-betedge-001',
  type: 'deposit',
  direction: 'inbound',
  amount: {
    value: 9800,
    currency: 'USD',
    valueUSD: 9800,
  },
  originator: {
    userId: 'user-john-doe-001',
    name: 'John Doe',
    accountId: 'acct-001',
    accountType: 'player',
    country: 'US',
    ip: '203.0.113.42',
    deviceFingerprint: 'fp-a1b2c3d4',
  },
  beneficiary: {
    name: 'BetEdge Platform',
    accountId: 'betedge-omnibus',
    accountType: 'platform',
    country: 'US',
  },
  paymentMethod: {
    type: 'card',
    provider: 'stripe',
    instrumentId: 'pm_card_visa_001',
    instrumentLast4: '4242',
  },
  timestamp: new Date(),
  metadata: {
    sourceSystem: 'betedge-payments',
    sourceTransactionId: 'be-pay-123',
    channel: 'web',
    sessionId: 'sess-xyz',
  },
};

const result = await aml.screenTransaction(transaction);

console.log(`Verdict: ${result.verdict}`);
console.log(`Risk Score: ${result.aggregateRiskScore}`);
console.log(`Processing Time: ${result.processingTimeMs}ms`);
console.log(`Hold Transaction: ${result.holdTransaction}`);

if (result.verdict !== 'PASS') {
  console.log(`Triggered Rules: ${result.triggeredRules.map(r => r.ruleName).join(', ')}`);
  console.log(`Recommended Action: ${result.recommendedAction.action}`);
  console.log(`Reason: ${result.recommendedAction.reason}`);
}

// Example output for a structuring suspect:
// Verdict: REVIEW
// Risk Score: 720
// Processing Time: 87ms
// Hold Transaction: false
// Triggered Rules: STRUCT-001 (Near-threshold deposit pattern)
// Recommended Action: hold
// Reason: User has made 4 deposits between $9,500-$9,900 in the past 48 hours.
//         Aggregate amount: $38,700. Potential structuring to avoid $10K CTR threshold.
```

### 2. Detect Structuring Patterns

```typescript
import { RuleEngine, StructuringDetector } from '@mcv/compliance/aml';

const ruleEngine = new RuleEngine({
  ventureId: 'venture-betedge-001',
  db: supabaseClient,
});

// Configure structuring detection rule
const structuringRule = ruleEngine.createRule({
  name: 'STRUCT-001: Near-Threshold Structuring',
  description: 'Detects deposits clustered just below the $10,000 CTR threshold',
  type: 'pattern',
  category: 'structuring',
  config: {
    lookbackPeriod: 'P2D',            // 2-day lookback
    amountThreshold: 10000,            // CTR threshold
    structuringBandWidth: 1000,        // Flag amounts between $9,000-$10,000
    minTransactionCount: 3,            // Minimum 3 transactions to trigger
    aggregateAmountThreshold: 10000,   // Aggregate must exceed threshold
  },
  thresholds: {
    scoreThreshold: 600,
    confidenceThreshold: 0.7,
  },
  action: 'alert',
  alertSeverity: 'high',
});

// The structuring detector evaluates transaction history
const detector = new StructuringDetector(ruleEngine);

// Evaluate a user's recent transactions
const evaluation = await detector.evaluate({
  userId: 'user-john-doe-001',
  ventureId: 'venture-betedge-001',
  currentTransaction: transaction,
  lookbackPeriod: 'P2D',
});

if (evaluation.triggered) {
  console.log('⚠️ Structuring pattern detected!');
  console.log(`Pattern: ${evaluation.pattern.description}`);
  console.log(`Confidence: ${(evaluation.confidence * 100).toFixed(1)}%`);
  console.log(`Transactions in pattern:`);
  for (const tx of evaluation.relatedTransactions) {
    console.log(`  ${tx.transactionId}: $${tx.amount.value} at ${tx.timestamp}`);
  }
  console.log(`Aggregate: $${evaluation.aggregateAmount}`);
}

// Example output:
// ⚠️ Structuring pattern detected!
// Pattern: 4 deposits between $9,000-$10,000 within 48 hours, aggregate $38,700
// Confidence: 89.2%
// Transactions in pattern:
//   tx-20260206-def456: $9,500 at 2026-02-06T14:22:00Z
//   tx-20260207-ghi789: $9,900 at 2026-02-07T09:15:00Z
//   tx-20260207-jkl012: $9,500 at 2026-02-07T18:30:00Z
//   tx-20260208-abc123: $9,800 at 2026-02-08T11:45:00Z
// Aggregate: $38,700
```

### 3. Create and Investigate a Case

```typescript
import { CaseManager, EvidenceCollector } from '@mcv/compliance/aml';

const caseManager = new CaseManager({
  ventureId: 'venture-betedge-001',
  db: supabaseClient,
});

// Escalate an alert to a case
const amlCase = await caseManager.createFromAlert({
  alertId: 'alert-struct-001',
  title: 'Potential Structuring — John Doe (4 near-threshold deposits)',
  type: 'suspicious_activity',
  priority: 'high',
  subjects: [
    {
      userId: 'user-john-doe-001',
      name: 'John Doe',
      role: 'primary',
    },
  ],
  assignedAnalystId: 'analyst-sarah-chen',
});

console.log(`Case created: ${amlCase.caseId}`);
console.log(`SAR Deadline: ${amlCase.dates.sarDeadline}`);
// SAR must be filed within 30 days of detection per FinCEN rules

// Collect evidence
const evidence = new EvidenceCollector(caseManager);

// Pull transaction history for the subject
const txEvidence = await evidence.collectTransactionHistory({
  caseId: amlCase.caseId,
  userId: 'user-john-doe-001',
  dateRange: { start: new Date('2026-01-01'), end: new Date() },
});

// Pull KYC records
const kycEvidence = await evidence.collectKYCRecords({
  caseId: amlCase.caseId,
  userId: 'user-john-doe-001',
});

// Pull login/session data for behavioral analysis
const sessionEvidence = await evidence.collectSessionData({
  caseId: amlCase.caseId,
  userId: 'user-john-doe-001',
  dateRange: { start: new Date('2026-01-01'), end: new Date() },
});

// Analyst adds investigation notes
await caseManager.addNote({
  caseId: amlCase.caseId,
  analystId: 'analyst-sarah-chen',
  content: `Reviewed transaction history for subject John Doe. Found 12 deposits 
    ranging from $9,200-$9,900 over the past 30 days, totaling $116,400. All deposits 
    made via same Visa card ending 4242. Deposits cluster during business hours ET.
    
    KYC shows subject is a verified US resident, employed as a software engineer.
    Declared annual income of $120,000. Deposit volume appears inconsistent with 
    declared income profile.
    
    Session data shows consistent IP (residential) and device. No indicators of 
    account takeover. Pattern appears intentional.
    
    RECOMMENDATION: Escalate to SAR filing. Pattern is consistent with deliberate 
    structuring to avoid CTR reporting threshold.`,
  type: 'investigation_note',
});

// Submit for peer review
await caseManager.submitForReview({
  caseId: amlCase.caseId,
  reviewerId: 'analyst-mike-johnson',
});
```

### 4. File a Suspicious Activity Report (SAR)

```typescript
import { SARService, SARGenerator } from '@mcv/compliance/aml';

const sarService = new SARService({
  ventureId: 'venture-betedge-001',
  db: supabaseClient,
  bsaEfilingConfig: {
    apiUrl: process.env.BSA_EFILING_URL!,
    apiKey: process.env.BSA_EFILING_API_KEY!,
    filingInstitution: {
      name: 'BetEdge Inc.',
      ein: '12-3456789',
      address: '123 Main Street, Suite 400, New York, NY 10001',
      regulatorId: 'FinCEN-REG-001',
    },
  },
});

// Generate SAR from the case
const sarReport = await sarService.generate({
  caseId: 'case-struct-john-doe-001',
  filingType: 'initial',
  jurisdiction: 'US_FINCEN',
  subjects: [
    {
      name: 'John Doe',
      dateOfBirth: '1988-05-15',
      idType: 'SSN',
      idNumber: '***-**-6789',    // Masked in logs, full in submission
      address: '456 Oak Avenue, Brooklyn, NY 11201',
      country: 'US',
      role: 'subject',
    },
  ],
  activity: {
    dateRange: {
      start: new Date('2026-01-08'),
      end: new Date('2026-02-08'),
    },
    totalAmount: 116400,
    currency: 'USD',
    instrumentTypes: ['credit_card'],
    activityTypes: ['structuring'],
  },
});

// Generate the BSA narrative
const narrative = await SARGenerator.generateNarrative({
  sarId: sarReport.sarId,
  case: caseDetails,
  transactions: relatedTransactions,
  template: 'fincen_structuring',
});

// The narrative follows FinCEN's recommended format:
// WHO is conducting the suspicious activity?
// WHAT instruments or mechanisms are being used?
// WHEN did the suspicious activity take place?
// WHERE did the suspicious activity take place?
// WHY does the filer believe the activity is suspicious?
// HOW was the suspicious activity conducted?

console.log(`SAR Draft: ${sarReport.sarId}`);
console.log(`Status: ${sarReport.status}`);
console.log(`Deadline: ${sarReport.dates.deadline}`);

// After review and approval...
await sarService.approve({
  sarId: sarReport.sarId,
  reviewerId: 'analyst-mike-johnson',
});

// Submit to FinCEN BSA E-Filing
const submission = await sarService.submit(sarReport.sarId);

console.log(`SAR Submitted!`);
console.log(`Confirmation: ${submission.confirmationNumber}`);
console.log(`BSA ID: ${submission.bsaId}`);
// SAR Submitted!
// Confirmation: SAR-2026-0208-001
// BSA ID: 31000012345678

// Track acknowledgment
const ack = await sarService.checkAcknowledgment(sarReport.sarId);
if (ack.acknowledged) {
  console.log(`SAR acknowledged by FinCEN at ${ack.acknowledgedAt}`);
}
```

### 5. Calculate and Update Risk Scores

```typescript
import { RiskScorer, RiskProfile } from '@mcv/compliance/aml';

const riskScorer = new RiskScorer({
  ventureId: 'venture-betedge-001',
  db: supabaseClient,
  config: {
    // Factor weights (must sum to 1.0)
    weights: {
      geographic:    0.20,
      transactional: 0.30,
      behavioral:    0.20,
      kyc:           0.15,
      network:       0.15,
    },
    // Score thresholds
    thresholds: {
      minimal:  { min: 0,   max: 200 },
      low:      { min: 201, max: 400 },
      medium:   { min: 401, max: 600 },
      high:     { min: 601, max: 800 },
      critical: { min: 801, max: 1000 },
    },
    // Enhanced Due Diligence trigger
    eddThreshold: 600,
    // Monitoring level escalation
    enhancedMonitoringThreshold: 400,
    intensiveMonitoringThreshold: 700,
  },
});

// Calculate risk score for a user
const riskScore = await riskScorer.calculateUserRisk({
  userId: 'user-john-doe-001',
  ventureId: 'venture-betedge-001',
});

console.log(`Overall Risk Score: ${riskScore.score} (${riskScore.level})`);
console.log(`\nFactor Breakdown:`);
for (const factor of riskScore.factors) {
  console.log(`  ${factor.factor}: ${factor.score} × ${factor.weight} = ${factor.weightedScore}`);
  console.log(`    ${factor.details}`);
}

// Example output:
// Overall Risk Score: 720 (high)
//
// Factor Breakdown:
//   geographic: 200 × 0.20 = 40
//     US resident, no high-risk country exposure
//   transactional: 890 × 0.30 = 267
//     12 near-threshold deposits in 30 days, structuring pattern detected
//   behavioral: 650 × 0.20 = 130
//     Consistent device/IP but unusual deposit timing patterns
//   kyc: 400 × 0.15 = 60
//     Verified identity, income inconsistent with deposit volume
//   network: 480 × 0.15 = 72
//     No known associations with flagged accounts

// Update the risk profile
const profile = await riskScorer.updateProfile({
  userId: 'user-john-doe-001',
  ventureId: 'venture-betedge-001',
  score: riskScore,
  eddRequired: riskScore.score >= 600,
  monitoringLevel: riskScore.score >= 700 ? 'intensive' :
                   riskScore.score >= 400 ? 'enhanced' : 'standard',
});

console.log(`\nProfile Updated:`);
console.log(`  EDD Required: ${profile.eddRequired}`);
console.log(`  Monitoring Level: ${profile.monitoringLevel}`);
console.log(`  Next Review: ${profile.nextReviewDate}`);
```

### 6. Watchlist Screening

```typescript
import { WatchlistScreener, OFACScreener, PEPScreener } from '@mcv/compliance/aml';

const screener = new WatchlistScreener({
  db: supabaseClient,
  watchlists: {
    ofac: {
      sdnUrl: process.env.OFAC_SDN_URL!,
      consolidatedUrl: process.env.OFAC_CONSOLIDATED_URL!,
      refreshIntervalHours: 24,
    },
    euSanctions: {
      url: process.env.EU_SANCTIONS_URL!,
      refreshIntervalHours: 24,
    },
    pep: {
      provider: 'dow-jones',
      apiKey: process.env.DOW_JONES_API_KEY!,
    },
    adverseMedia: {
      provider: 'lexis-nexis',
      apiKey: process.env.LEXIS_NEXIS_API_KEY!,
    },
  },
  matching: {
    defaultAlgorithm: 'jaro-winkler',
    minimumScore: 85,            // 0-100 fuzzy match score
    phoneticEnabled: true,       // Soundex/Metaphone matching
    transliterationEnabled: true, // Handle non-Latin scripts
  },
});

// Screen an individual against all watchlists
const result = await screener.screenIndividual({
  name: 'Mohammad Al-Rashid',
  dateOfBirth: '1975-03-22',
  country: 'AE',
  entityType: 'individual',
});

console.log(`Matches Found: ${result.matches.length}`);
for (const match of result.matches) {
  console.log(`\n  List: ${match.watchlistType} (${match.watchlistEntry.listName})`);
  console.log(`  Score: ${match.match.score}/100`);
  console.log(`  Confidence: ${match.match.confidence}`);
  console.log(`  Algorithm: ${match.match.algorithm}`);
  console.log(`  Matched Fields:`);
  for (const field of match.match.matchedFields) {
    console.log(`    ${field.field}: "${field.screenedValue}" ≈ "${field.watchlistValue}" (${(field.similarity * 100).toFixed(0)}%)`);
  }
}

// Example output:
// Matches Found: 2
//
//   List: ofac_sdn (Specially Designated Nationals)
//   Score: 92/100
//   Confidence: strong
//   Algorithm: jaro-winkler
//   Matched Fields:
//     name: "Mohammad Al-Rashid" ≈ "Mohammed Al-Rasheed" (91%)
//     country: "AE" ≈ "AE" (100%)
//
//   List: pep_global (Politically Exposed Persons)
//   Score: 88/100
//   Confidence: moderate
//   Algorithm: jaro-winkler
//   Matched Fields:
//     name: "Mohammad Al-Rashid" ≈ "Mohammad bin Rashid" (87%)
//     country: "AE" ≈ "AE" (100%)

// Record disposition after analyst review
await screener.recordDisposition({
  matchId: result.matches[0].matchId,
  status: 'false_positive',
  reviewedBy: 'analyst-sarah-chen',
  justification: 'Different date of birth (1975 vs 1960). Different nationality context. SDN entry refers to sanctioned entity in Syria, not UAE-based individual.',
});
```

### 7. Real-Time Transaction Stream Processing

```typescript
import { TransactionStreamConsumer, AlertStreamProducer, AMLEventBus } from '@mcv/compliance/aml';

// Set up the real-time transaction consumer from Redpanda
const consumer = new TransactionStreamConsumer({
  brokerUrl: process.env.REDPANDA_BROKER_URL!,
  groupId: 'aml-screening-group',
  topics: ['aml.transactions.inbound'],
  concurrency: 10,               // Process 10 transactions concurrently
  maxBatchSize: 100,              // Batch up to 100 for efficiency
  commitIntervalMs: 5000,         // Commit offsets every 5 seconds
});

const alertProducer = new AlertStreamProducer({
  brokerUrl: process.env.REDPANDA_BROKER_URL!,
  topic: 'aml.alerts.new',
});

const amlService = new AMLService({ /* ... config ... */ });

// Process incoming transactions
consumer.on('transaction', async (tx: TransactionPayload) => {
  try {
    const result = await amlService.screenTransaction(tx, {
      timeout: 200,                // 200ms SLA for real-time screening
      includeWatchlist: true,
      includeRules: true,
      includeRiskScore: true,
    });

    // Log screening result to audit trail (always, even for PASS)
    await amlService.logScreening(result);

    // Handle non-PASS verdicts
    if (result.verdict !== 'PASS') {
      // Publish alert to alert stream
      await alertProducer.publish({
        screeningId: result.screeningId,
        transactionId: tx.transactionId,
        ventureId: tx.ventureId,
        verdict: result.verdict,
        riskScore: result.aggregateRiskScore,
        triggeredRules: result.triggeredRules,
        watchlistMatches: result.watchlistMatches,
        recommendedAction: result.recommendedAction,
      });

      // If transaction should be held, signal the payment system
      if (result.holdTransaction) {
        await AMLEventBus.emit('transaction.hold', {
          transactionId: tx.transactionId,
          reason: result.recommendedAction.reason,
          screeningId: result.screeningId,
        });
      }
    }

    // Check if CTR filing is required (> $10K or aggregate threshold)
    if (result.recommendedAction.autoFileRequired) {
      await amlService.generateCTR(tx.transactionId, {
        autoSubmit: false,          // Queue for batch submission
      });
    }

  } catch (error) {
    // Screening failures are critical — log and alert operations
    console.error(`AML screening failed for ${tx.transactionId}:`, error);
    await AMLEventBus.emit('screening.failure', {
      transactionId: tx.transactionId,
      error: error.message,
    });
    // Default-deny: hold transaction on screening failure
    await AMLEventBus.emit('transaction.hold', {
      transactionId: tx.transactionId,
      reason: 'AML screening system failure — default deny',
    });
  }
});

// Handle consumer errors
consumer.on('error', async (error) => {
  console.error('Transaction stream consumer error:', error);
  // Alert operations team
  await AMLEventBus.emit('consumer.error', {
    consumer: 'aml-screening-group',
    error: error.message,
  });
});

// Start consuming
await consumer.start();
console.log('AML transaction stream consumer started');
```

### 8. Alert Triage and Management

```typescript
import { AlertManager, AlertTriageEngine, AlertTuningAdvisor } from '@mcv/compliance/aml';

const alertManager = new AlertManager({
  ventureId: 'venture-betedge-001',
  db: supabaseClient,
});

// Get new alerts awaiting triage
const newAlerts = await alertManager.getAlerts({
  status: 'new',
  ventureId: 'venture-betedge-001',
  sortBy: 'severity',
  sortOrder: 'desc',
  limit: 50,
});

console.log(`${newAlerts.total} alerts awaiting triage`);

// Auto-triage using the triage engine
const triageEngine = new AlertTriageEngine({
  db: supabaseClient,
  rules: {
    // Auto-escalate critical watchlist matches
    autoEscalate: [
      { condition: 'watchlist_match AND confidence >= strong', action: 'escalate' },
      { condition: 'severity == critical', action: 'escalate' },
    ],
    // Auto-assign based on alert type
    autoAssign: {
      structuring: 'team-financial-patterns',
      watchlist_match: 'team-sanctions',
      velocity_anomaly: 'team-behavioral',
      geographic_risk: 'team-geographic',
    },
    // SLA definitions
    sla: {
      critical: { triageWithin: '1h', resolveWithin: '24h' },
      high:     { triageWithin: '4h', resolveWithin: '72h' },
      medium:   { triageWithin: '24h', resolveWithin: '7d' },
      low:      { triageWithin: '72h', resolveWithin: '30d' },
    },
  },
});

// Run auto-triage on new alerts
const triageResults = await triageEngine.triageBatch(newAlerts.items);
console.log(`Auto-triaged: ${triageResults.triaged} alerts`);
console.log(`Auto-escalated: ${triageResults.escalated} alerts`);
console.log(`Needs manual review: ${triageResults.needsManualReview} alerts`);

// Get tuning recommendations based on false positive rates
const tuningAdvisor = new AlertTuningAdvisor({
  db: supabaseClient,
  ventureId: 'venture-betedge-001',
});

const recommendations = await tuningAdvisor.analyze({
  lookbackPeriod: 'P90D',      // 90-day analysis window
  minAlertCount: 50,           // Only rules with 50+ alerts
});

for (const rec of recommendations) {
  console.log(`\nRule: ${rec.ruleName}`);
  console.log(`  Alerts: ${rec.totalAlerts}`);
  console.log(`  False Positive Rate: ${(rec.falsePositiveRate * 100).toFixed(1)}%`);
  console.log(`  True Positive Rate: ${(rec.truePositiveRate * 100).toFixed(1)}%`);
  console.log(`  Recommendation: ${rec.recommendation}`);
  if (rec.suggestedThresholdChange) {
    console.log(`  Suggested Change: ${rec.suggestedThresholdChange.description}`);
  }
}

// Example output:
// Rule: VELOCITY-003 (High-frequency small deposits)
//   Alerts: 312
//   False Positive Rate: 82.4%
//   True Positive Rate: 17.6%
//   Recommendation: Increase minimum transaction count threshold
//   Suggested Change: Raise minTransactionCount from 5 to 8 (projected FP reduction: 45%)
```

### 9. Regulatory Reporting (Multi-Jurisdiction)

```typescript
import { ReportingService, FinCENReporter } from '@mcv/compliance/aml';

const reportingService = new ReportingService({
  db: supabaseClient,
  ventures: ['venture-betedge-001', 'venture-payments-002'],
});

// Generate FinCEN quarterly report
const fincenReport = await reportingService.generateReport('US_FINCEN', {
  period: {
    start: new Date('2026-01-01'),
    end: new Date('2026-03-31'),
    type: 'quarterly',
  },
  includeMetrics: true,
});

console.log('=== FinCEN Q1 2026 Report ===');
console.log(`SARs Filed: ${fincenReport.metrics.sarsFilied}`);
console.log(`CTRs Filed: ${fincenReport.metrics.ctrsFilied}`);
console.log(`Alerts Generated: ${fincenReport.metrics.alertsGenerated}`);
console.log(`Alerts Resolved: ${fincenReport.metrics.alertsResolved}`);
console.log(`False Positive Rate: ${(fincenReport.metrics.falsePositiveRate * 100).toFixed(1)}%`);
console.log(`Average Case Duration: ${fincenReport.metrics.avgCaseDurationDays} days`);
console.log(`Total Suspicious Amount: $${fincenReport.metrics.totalSuspiciousAmount.toLocaleString()}`);

// Generate FCA (UK) annual report
const fcaReport = await reportingService.generateReport('UK_FCA', {
  period: {
    start: new Date('2025-04-01'),
    end: new Date('2026-03-31'),
    type: 'annual',
  },
  format: 'REP-CRIM',         // FCA's REP-CRIM reporting format
});

// Generate AUSTRAC (Australia) report
const austracReport = await reportingService.generateReport('AU_AUSTRAC', {
  period: {
    start: new Date('2025-07-01'),
    end: new Date('2026-06-30'),
    type: 'annual',
  },
  format: 'AUSTRAC_XML',
});

// Submit reports
for (const report of [fincenReport, fcaReport, austracReport]) {
  const submission = await reportingService.submitReport(report.reportId);
  console.log(`${report.jurisdiction} report submitted: ${submission.confirmationId}`);
}
```

### 10. Examination Readiness — Packaging Audit Data

```typescript
import { AuditTrail, ExaminationPackager } from '@mcv/compliance/aml';

const auditTrail = new AuditTrail({
  db: supabaseClient,
  ventureId: 'venture-betedge-001',
});

// Regulatory examiner has requested records for a specific period
const packager = new ExaminationPackager({
  db: supabaseClient,
  auditTrail,
});

const examinationPackage = await packager.package({
  requestedBy: 'FinCEN Examination Team',
  referenceNumber: 'EXAM-2026-001',
  ventureId: 'venture-betedge-001',
  dateRange: {
    start: new Date('2025-01-01'),
    end: new Date('2025-12-31'),
  },
  include: {
    screeningDecisions: true,     // All transaction screening records
    alerts: true,                  // All alerts generated
    cases: true,                   // All investigation cases
    sarFilings: true,             // All SAR/CTR filings
    ruleConfigurations: true,     // Rule sets active during period
    riskProfiles: true,           // Risk profiles of flagged users
    dispositions: true,           // All false positive/true positive decisions
    analystActions: true,         // Complete audit trail of analyst activity
    systemConfigurations: true,   // AML system configuration changes
  },
  format: 'structured_json',     // Also supports 'csv', 'pdf_bundle'
  encryption: {
    enabled: true,
    algorithm: 'AES-256-GCM',
    recipientPublicKey: process.env.FINCEN_PUBLIC_KEY!,
  },
});

console.log(`Examination Package: ${examinationPackage.packageId}`);
console.log(`Records Included:`);
console.log(`  Screening Decisions: ${examinationPackage.counts.screeningDecisions}`);
console.log(`  Alerts: ${examinationPackage.counts.alerts}`);
console.log(`  Cases: ${examinationPackage.counts.cases}`);
console.log(`  SARs Filed: ${examinationPackage.counts.sars}`);
console.log(`  CTRs Filed: ${examinationPackage.counts.ctrs}`);
console.log(`  Audit Trail Entries: ${examinationPackage.counts.auditEntries}`);
console.log(`Package Size: ${examinationPackage.sizeBytes} bytes`);
console.log(`Checksum: ${examinationPackage.sha256}`);
console.log(`Encrypted: ${examinationPackage.encrypted}`);

// The package includes a manifest for easy navigation
// ├── manifest.json
// ├── screening/
// │   ├── 2025-Q1.json
// │   ├── 2025-Q2.json
// │   ├── 2025-Q3.json
// │   └── 2025-Q4.json
// ├── alerts/
// │   └── all-alerts.json
// ├── cases/
// │   ├── case-001.json
// │   ├── case-002.json
// │   └── ...
// ├── sar-filings/
// │   ├── SAR-2025-001.json
// │   └── ...
// ├── ctr-filings/
// │   └── all-ctrs.json
// ├── rules/
// │   └── rule-snapshots.json
// ├── risk-profiles/
// │   └── flagged-users.json
// └── audit-trail/
//     └── complete-audit.json
```

---

## Error Codes

| Code | Name | HTTP | Description | Recovery |
|------|------|------|-------------|----------|
| `AML_SCREENING_TIMEOUT` | Screening Timeout | 504 | Transaction screening exceeded SLA timeout | Retry with extended timeout. Transaction held by default-deny policy. |
| `AML_SCREENING_FAILURE` | Screening System Failure | 500 | Internal error during screening pipeline | Transaction automatically held. Investigate system health. Retry after resolution. |
| `AML_RULE_INVALID` | Invalid Rule Configuration | 400 | Rule definition contains invalid parameters or expression | Validate rule config against schema. Check expression syntax. |
| `AML_RULE_CONFLICT` | Rule Conflict | 409 | New rule conflicts with existing active rule (overlapping conditions) | Review existing rules. Disable conflicting rule or adjust parameters. |
| `AML_WATCHLIST_UNAVAILABLE` | Watchlist Data Unavailable | 503 | Watchlist data feed is stale or unreachable | Check watchlist provider connectivity. Last-known-good data used as fallback. Screening continues with stale data flag. |
| `AML_WATCHLIST_EXPIRED` | Watchlist Data Expired | 503 | Watchlist data has not been refreshed within required interval | Force watchlist refresh. If provider is down, escalate to operations. Screening may be blocked for high-risk transactions. |
| `AML_CASE_ASSIGNMENT_FAILED` | Case Assignment Failed | 500 | Could not assign case to analyst (capacity, permissions) | Check analyst availability and permissions. Assign manually or use round-robin fallback. |
| `AML_SAR_DEADLINE_BREACH` | SAR Deadline Breach | 500 | SAR filing deadline has been missed | CRITICAL — Immediate escalation to BSA Officer. Document delay reason. File SAR immediately. Late filing may require regulatory notification. |
| `AML_SAR_SUBMISSION_FAILED` | SAR Submission Failed | 502 | Failed to submit SAR to regulatory body | Retry submission. If persistent, prepare for manual submission via BSA E-Filing portal. Track resubmission deadline. |
| `AML_SAR_REJECTED` | SAR Rejected by Regulator | 422 | Regulatory body rejected the SAR filing | Review rejection reason. Correct errors. Refile within required timeframe. |
| `AML_CTR_THRESHOLD_ERROR` | CTR Threshold Calculation Error | 500 | Error calculating aggregate amounts for CTR threshold | Verify transaction data integrity. Recalculate aggregates. Manual CTR filing may be required. |
| `AML_RISK_CALCULATION_FAILED` | Risk Score Calculation Failed | 500 | Could not calculate risk score (missing data, model error) | Check data dependencies. Use last-known-good score with stale flag. Investigate model health. |
| `AML_AUDIT_WRITE_FAILED` | Audit Trail Write Failed | 500 | CRITICAL — Could not write to audit trail | Halt processing. Audit trail integrity is legally required. Queue entries for retry. Alert operations immediately. |
| `AML_CONFIG_INVALID` | Invalid Venture Configuration | 400 | Venture AML configuration is invalid or incomplete | Validate configuration against schema. Ensure all required fields are present. |
| `AML_TENANT_NOT_CONFIGURED` | Venture Not Configured | 404 | No AML configuration exists for the specified venture | Create AML configuration for the venture before processing transactions. |
| `AML_CONCURRENT_CASE_EDIT` | Concurrent Case Modification | 409 | Two analysts attempted to modify the same case simultaneously | Refresh case data and retry. Only one analyst can edit a case section at a time. |
| `AML_EXAMINATION_PACKAGE_FAILED` | Examination Package Generation Failed | 500 | Could not generate regulatory examination package | Verify data availability for requested period. Check storage capacity. Retry with smaller date range. |

### Error Severity Classification

| Severity | Codes | Response |
|----------|-------|----------|
| **CRITICAL** | `AML_SAR_DEADLINE_BREACH`, `AML_AUDIT_WRITE_FAILED` | Immediate human escalation. Potential regulatory violation. |
| **HIGH** | `AML_SCREENING_FAILURE`, `AML_WATCHLIST_EXPIRED`, `AML_SAR_SUBMISSION_FAILED` | Automated retry + operations alert. Default-deny for transactions. |
| **MEDIUM** | `AML_SCREENING_TIMEOUT`, `AML_WATCHLIST_UNAVAILABLE`, `AML_RISK_CALCULATION_FAILED` | Automated retry with fallback behavior. Monitor for persistence. |
| **LOW** | `AML_RULE_CONFLICT`, `AML_CONFIG_INVALID`, `AML_CONCURRENT_CASE_EDIT` | User-correctable. Return clear error message with remediation steps. |

---

## Security & Compliance

### Regulatory Framework

The AML module is designed to satisfy the following regulatory requirements:

#### United States — Bank Secrecy Act (BSA) / FinCEN

| Requirement | Implementation |
|---|---|
| **SAR Filing** | Automated SAR generation within 30 days of suspicious activity detection. Continuing SARs filed every 90 days for ongoing activity. |
| **CTR Filing** | Automatic Currency Transaction Report for transactions > $10,000 (31 CFR 1010.311). Aggregation of related transactions within a business day. |
| **Record Retention** | All AML records retained for minimum 5 years (31 CFR 1010.430). Audit trail is append-only and tamper-evident. |
| **Customer Identification** | Integration with @mcv/compliance/kyc for CIP (Customer Identification Program) data. |
| **Suspicious Activity Monitoring** | Continuous real-time and batch monitoring. All transaction types screened. |
| **Information Sharing** | Support for 314(a) and 314(b) information sharing requests. |

#### European Union — Anti-Money Laundering Directives

| Directive | Implementation |
|---|---|
| **4AMLD (2015/849/EU)** | Risk-based approach to customer due diligence. Enhanced due diligence for high-risk customers. |
| **5AMLD (2018/843/EU)** | Extended scope to virtual currencies and prepaid cards. Beneficial ownership registers integration. Public access to PEP lists. |
| **6AMLD (2018/1673/EU)** | Extended predicate offenses (22 categories). Criminal liability for legal persons. Aiding and abetting coverage. Minimum 4-year imprisonment standard for sanctions. |
| **EU Transfer of Funds Regulation** | Full originator and beneficiary information for all transfers. Travel rule compliance for crypto. |

#### Other Jurisdictions

| Jurisdiction | Regulator | Key Requirements |
|---|---|---|
| **United Kingdom** | FCA | MLR 2017, REP-CRIM annual reporting, NCA SAR submissions |
| **Australia** | AUSTRAC | AML/CTF Act 2006, threshold transaction reports (AUD $10,000), IFTI reports |
| **Singapore** | MAS | MAS Notice 626, suspicious transaction reporting, cash threshold reporting (SGD $20,000) |
| **Canada** | FINTRAC | PCMLTFA, large cash transaction reports (CAD $10,000), EFT reports |
| **Germany** | BaFin | GwG (Geldwäschegesetz), suspicious transaction reporting via goAML |

### FATF Recommendations

The module implements controls aligned with the Financial Action Task Force (FATF) 40 Recommendations:

- **Recommendation 1** — Risk-based approach with venture-specific risk assessments
- **Recommendation 10** — Customer due diligence (via @mcv/compliance/kyc integration)
- **Recommendation 11** — Record keeping (5+ year retention, tamper-evident audit trail)
- **Recommendation 13** — Correspondent banking controls (cross-venture transaction monitoring)
- **Recommendation 15** — New technologies (cryptocurrency transaction monitoring)
- **Recommendation 20** — Suspicious transaction reporting (automated SAR/STR filing)
- **Recommendation 23** — DNFBP (gambling-specific AML for BetEdge)

### Data Security Controls

```
┌─────────────────────────────────────────────────────────────────┐
│                    AML DATA SECURITY LAYERS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ENCRYPTION AT REST                                          │
│     • All AML tables encrypted with AES-256                    │
│     • Encryption keys managed via Supabase Vault               │
│     • SAR/CTR documents encrypted with separate keys           │
│                                                                 │
│  2. ENCRYPTION IN TRANSIT                                       │
│     • TLS 1.3 for all API communications                       │
│     • mTLS for Redpanda transaction streams                    │
│     • Encrypted connections to watchlist providers              │
│                                                                 │
│  3. ACCESS CONTROL                                              │
│     • Row-Level Security (RLS) per venture                     │
│     • Role-based access: analyst, senior_analyst, bsa_officer  │
│     • Audit trail has read-only RLS for all except writer      │
│     • SAR content restricted to BSA Officer + assigned analyst │
│                                                                 │
│  4. DATA MASKING                                                │
│     • PII masked in logs (SSN: ***-**-1234)                   │
│     • Full PII only in encrypted SAR submissions               │
│     • Watchlist match details masked in API responses           │
│                                                                 │
│  5. AUDIT & MONITORING                                          │
│     • All data access logged with actor, timestamp, IP         │
│     • Anomalous access patterns trigger security alerts         │
│     • Quarterly access reviews by BSA Officer                  │
│                                                                 │
│  6. SAR CONFIDENTIALITY (31 USC § 5318(g)(2))                  │
│     • SAR existence/content is NOT disclosed to subjects       │
│     • "Tipping off" prevention controls                        │
│     • SAR-related data segregated from general AML data        │
│     • API responses never indicate SAR filing status to        │
│       non-authorized users                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Gambling-Specific AML (BetEdge)

BetEdge operates in the gambling sector, which carries elevated AML risk under FATF guidelines and most jurisdictions. Additional controls include:

| Control | Description |
|---|---|
| **Player spend monitoring** | Track cumulative deposits vs. wagering activity to detect "pass-through" laundering |
| **Minimal play detection** | Flag accounts that deposit significant funds but engage in minimal gambling |
| **Chip dumping detection** | Monitor peer-to-peer poker/game scenarios for deliberate losing to transfer funds |
| **Bonus abuse patterns** | Detect abuse of promotional bonuses as part of layering schemes |
| **Cross-platform play** | Correlate activity across multiple gambling platforms (where data sharing agreements exist) |
| **Source of funds** | Enhanced SoF checks for deposits > $3,000 (below regulatory threshold for early detection) |
| **Win-loss ratio analysis** | Statistical analysis of win/loss patterns for anomalies indicating collusion |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `AML_SUPABASE_URL` | ✅ | — | Supabase PostgreSQL connection URL |
| `AML_SUPABASE_SERVICE_KEY` | ✅ | — | Supabase service role key (elevated permissions for AML) |
| `AML_REDPANDA_BROKER_URL` | ✅ | — | Redpanda broker URL for transaction streaming |
| `AML_REDPANDA_SASL_USERNAME` | ✅ | — | Redpanda SASL authentication username |
| `AML_REDPANDA_SASL_PASSWORD` | ✅ | — | Redpanda SASL authentication password |
| `AML_REDPANDA_TLS_ENABLED` | ❌ | `true` | Enable TLS for Redpanda connections |
| `AML_OFAC_SDN_URL` | ✅ | — | OFAC SDN list download URL |
| `AML_OFAC_CONSOLIDATED_URL` | ✅ | — | OFAC consolidated sanctions list URL |
| `AML_EU_SANCTIONS_URL` | ✅ | — | EU consolidated sanctions list URL |
| `AML_UN_SANCTIONS_URL` | ❌ | — | UN Security Council sanctions list URL |
| `AML_UK_SANCTIONS_URL` | ❌ | — | UK OFSI consolidated list URL |
| `AML_PEP_PROVIDER` | ✅ | — | PEP data provider (`dow-jones`, `refinitiv`, `complyadvantage`) |
| `AML_PEP_API_KEY` | ✅ | — | PEP provider API key |
| `AML_PEP_API_URL` | ✅ | — | PEP provider API endpoint |
| `AML_ADVERSE_MEDIA_PROVIDER` | ❌ | — | Adverse media provider (`lexis-nexis`, `refinitiv`) |
| `AML_ADVERSE_MEDIA_API_KEY` | ❌ | — | Adverse media provider API key |
| `AML_BSA_EFILING_URL` | ✅ (US) | — | FinCEN BSA E-Filing system URL |
| `AML_BSA_EFILING_API_KEY` | ✅ (US) | — | BSA E-Filing API authentication key |
| `AML_BSA_EFILING_CERT_PATH` | ✅ (US) | — | Path to BSA E-Filing client certificate |
| `AML_FCA_API_URL` | ❌ | — | UK FCA reporting API URL |
| `AML_FCA_API_KEY` | ❌ | — | UK FCA reporting API key |
| `AML_AUSTRAC_API_URL` | ❌ | — | AUSTRAC reporting API URL |
| `AML_AUSTRAC_API_KEY` | ❌ | — | AUSTRAC reporting API key |
| `AML_MAS_API_URL` | ❌ | — | MAS (Singapore) reporting API URL |
| `AML_MAS_API_KEY` | ❌ | — | MAS reporting API key |
| `AML_FINTRAC_API_URL` | ❌ | — | FINTRAC (Canada) reporting API URL |
| `AML_FINTRAC_API_KEY` | ❌ | — | FINTRAC reporting API key |
| `AML_WATCHLIST_REFRESH_HOURS` | ❌ | `24` | Hours between watchlist data refreshes |
| `AML_FUZZY_MATCH_THRESHOLD` | ❌ | `85` | Minimum fuzzy match score (0-100) for watchlist hits |
| `AML_SCREENING_TIMEOUT_MS` | ❌ | `200` | Real-time screening SLA in milliseconds |
| `AML_BATCH_SCREENING_TIMEOUT_MS` | ❌ | `5000` | Batch screening timeout per transaction |
| `AML_CTR_THRESHOLD_USD` | ❌ | `10000` | USD threshold for Currency Transaction Reports |
| `AML_SAR_DEADLINE_DAYS` | ❌ | `30` | Days from detection to SAR filing deadline |
| `AML_CONTINUING_SAR_DAYS` | ❌ | `90` | Days between continuing SAR filings |
| `AML_RECORD_RETENTION_YEARS` | ❌ | `5` | Years to retain AML records (BSA minimum) |
| `AML_DEFAULT_DENY` | ❌ | `true` | Hold transactions when screening fails (fail-closed) |
| `AML_ENCRYPTION_KEY_ID` | ✅ | — | Supabase Vault key ID for AML data encryption |
| `AML_SAR_ENCRYPTION_KEY_ID` | ✅ | — | Separate encryption key for SAR documents |
| `AML_ALERT_SLA_CRITICAL_HOURS` | ❌ | `1` | SLA hours for critical alert triage |
| `AML_ALERT_SLA_HIGH_HOURS` | ❌ | `4` | SLA hours for high alert triage |
| `AML_ALERT_SLA_MEDIUM_HOURS` | ❌ | `24` | SLA hours for medium alert triage |
| `AML_ALERT_SLA_LOW_HOURS` | ❌ | `72` | SLA hours for low alert triage |
| `AML_LOG_LEVEL` | ❌ | `info` | Logging level (`debug`, `info`, `warn`, `error`) |
| `AML_METRICS_ENABLED` | ❌ | `true` | Enable Prometheus metrics export |
| `AML_METRICS_PORT` | ❌ | `9090` | Prometheus metrics port |

---

## Dependencies

### Internal Dependencies

| Package | Purpose | Required |
|---|---|---|
| `@mcv/compliance/kyc` | KYC/CDD data for risk scoring and SAR subject details | ✅ |
| `@mcv/connectors/payments` | Payment transaction data, hold/release controls | ✅ |
| `@mcv/core/db` | Supabase client, Drizzle ORM schemas, migrations | ✅ |
| `@mcv/core/auth` | Authentication, role-based access control | ✅ |
| `@mcv/core/events` | Event bus for cross-module communication | ✅ |
| `@mcv/core/crypto` | Encryption utilities, key management via Vault | ✅ |
| `@mcv/core/logging` | Structured logging with PII masking | ✅ |
| `@mcv/core/config` | Venture configuration management | ✅ |
| `@mcv/compliance/sanctions` | Shared sanctions list management and distribution | ✅ |
| `@mcv/observability/metrics` | Prometheus metrics, alerting, dashboards | ❌ |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.30.x` | Database ORM for PostgreSQL |
| `kafkajs` | `^2.2.x` | Redpanda/Kafka client for transaction streaming |
| `jaro-winkler` | `^0.2.x` | Fuzzy string matching for watchlist screening |
| `soundex-code` | `^1.0.x` | Phonetic matching for name screening |
| `transliteration` | `^2.3.x` | Script transliteration for international name matching |
| `croner` | `^8.x` | Cron scheduling for batch operations and watchlist refreshes |
| `zod` | `^3.22.x` | Runtime schema validation for transaction payloads and configs |
| `prom-client` | `^15.x` | Prometheus metrics client |
| `winston` | `^3.11.x` | Structured logging |
| `node-cache` | `^5.1.x` | Local caching for watchlist data and rule sets |
| `pdf-lib` | `^1.17.x` | PDF generation for SAR documents and examination packages |
| `archiver` | `^6.x` | ZIP packaging for examination data exports |
| `fast-xml-parser` | `^4.x` | XML parsing/generation for AUSTRAC and regulatory submissions |

---

## Testing Notes

### Test Categories

#### Unit Tests

```bash
# Run all AML unit tests
pnpm test --filter @mcv/compliance/aml

# Run specific test suites
pnpm test --filter @mcv/compliance/aml -- --grep "StructuringDetector"
pnpm test --filter @mcv/compliance/aml -- --grep "WatchlistScreener"
pnpm test --filter @mcv/compliance/aml -- --grep "RiskScorer"
```

| Suite | Coverage Target | Description |
|---|---|---|
| `rule-engine.test.ts` | 95% | Rule evaluation, all detection patterns |
| `structuring-detector.test.ts` | 98% | Structuring pattern detection with edge cases |
| `smurfing-detector.test.ts` | 98% | Multi-account smurfing detection |
| `round-trip-detector.test.ts` | 95% | Circular fund flow detection |
| `velocity-detector.test.ts` | 95% | Transaction frequency anomaly detection |
| `watchlist-screener.test.ts` | 98% | OFAC, EU, PEP, adverse media matching |
| `fuzzy-matcher.test.ts` | 99% | Name matching algorithms (critical for false positives) |
| `risk-scorer.test.ts` | 95% | Risk score calculation, factor weighting |
| `sar-generator.test.ts` | 98% | SAR narrative generation, data formatting |
| `ctr-service.test.ts` | 98% | CTR threshold calculation, aggregation |
| `alert-triage.test.ts` | 90% | Auto-triage rules, SLA calculation |
| `case-workflow.test.ts` | 90% | Case state machine, assignment, resolution |
| `audit-trail.test.ts` | 99% | Append-only guarantees, tamper detection |

#### Integration Tests

```bash
# Run integration tests (requires running Supabase + Redpanda)
pnpm test:integration --filter @mcv/compliance/aml
```

| Suite | Description |
|---|---|
| `screening-pipeline.integration.ts` | End-to-end transaction screening through all components |
| `alert-to-case-flow.integration.ts` | Alert creation → triage → case → resolution |
| `sar-filing-flow.integration.ts` | Case → SAR generation → submission (mocked BSA E-Filing) |
| `watchlist-refresh.integration.ts` | Watchlist data download, parsing, and indexing |
| `redpanda-consumer.integration.ts` | Transaction stream consumption and processing |
| `multi-venture.integration.ts` | Multi-tenant isolation and venture-specific rules |

#### Regulatory Scenario Tests

These tests validate specific regulatory scenarios and are derived from FinCEN, FCA, and FATF guidance:

```bash
# Run regulatory scenario tests
pnpm test:regulatory --filter @mcv/compliance/aml
```

| Scenario | Source | Description |
|---|---|---|
| `structuring-basic.scenario.ts` | FinCEN Advisory FIN-2010-A001 | Basic structuring with multiple sub-threshold deposits |
| `structuring-multi-branch.scenario.ts` | FinCEN Advisory | Structuring across multiple accounts/branches |
| `smurfing-network.scenario.ts` | FATF Typology | Multiple individuals depositing on behalf of one person |
| `round-trip-layering.scenario.ts` | FATF Typology | Circular transactions through multiple entities |
| `trade-based-laundering.scenario.ts` | FATF Typology | Over/under-invoicing patterns |
| `gambling-pass-through.scenario.ts` | FATF Casino Typology | Minimal play with large deposit/withdrawal |
| `crypto-conversion.scenario.ts` | FinCEN Advisory FIN-2019-A003 | Crypto-to-fiat conversion patterns |
| `sanctions-evasion.scenario.ts` | OFAC Guidance | Attempts to transact with sanctioned parties via intermediaries |
| `pep-bribery.scenario.ts` | FATF Typology | PEP-linked transactions with corruption indicators |
| `insider-collusion.scenario.ts` | FCA Guidance | Employee facilitating suspicious transactions |

#### Performance Tests

```bash
# Run performance benchmarks
pnpm test:perf --filter @mcv/compliance/aml
```

| Benchmark | Target | Description |
|---|---|---|
| `screening-latency.perf.ts` | p99 < 200ms | Single transaction real-time screening |
| `screening-throughput.perf.ts` | > 1000 tx/sec | Sustained transaction screening throughput |
| `watchlist-lookup.perf.ts` | p99 < 50ms | Individual watchlist lookup |
| `batch-screening.perf.ts` | > 5000 tx/batch | Batch screening performance |
| `risk-calculation.perf.ts` | p99 < 100ms | User risk score calculation |
| `fuzzy-matching.perf.ts` | p99 < 10ms/name | Name fuzzy matching performance |

### Test Data

⚠️ **IMPORTANT**: Never use real PII, real sanctions data, or real SAR content in tests. All test data must use synthetic names, addresses, and identifiers.

Test fixtures are located in `__tests__/fixtures/`:

```
__tests__/fixtures/
├── transactions/
│   ├── clean-transactions.json          # Normal, non-suspicious transactions
│   ├── structuring-patterns.json        # Known structuring patterns
│   ├── smurfing-patterns.json           # Multi-account deposit patterns
│   ├── round-trip-patterns.json         # Circular transaction flows
│   └── velocity-anomalies.json          # High-frequency transaction bursts
├── watchlists/
│   ├── mock-ofac-sdn.json              # Synthetic OFAC SDN entries
│   ├── mock-eu-sanctions.json           # Synthetic EU sanctions entries
│   ├── mock-pep-list.json              # Synthetic PEP entries
│   └── mock-adverse-media.json          # Synthetic adverse media entries
├── users/
│   ├── low-risk-profiles.json           # Users with minimal risk indicators
│   ├── medium-risk-profiles.json        # Users with some risk factors
│   └── high-risk-profiles.json          # Users with multiple risk indicators
└── sar/
    ├── sample-sar-narrative.txt         # Example SAR narrative template
    └── sample-ctr-data.json             # Example CTR filing data
```

### Continuous Monitoring

The AML system includes production monitoring that doubles as ongoing validation:

| Metric | Alert Threshold | Description |
|---|---|---|
| `aml_screening_latency_p99` | > 200ms | Real-time screening latency |
| `aml_screening_errors_rate` | > 0.1% | Screening pipeline error rate |
| `aml_watchlist_staleness_hours` | > 48h | Hours since last watchlist refresh |
| `aml_alert_sla_breach_count` | > 0 | Alerts that breached triage SLA |
| `aml_sar_deadline_approaching` | < 5 days | SARs approaching filing deadline |
| `aml_false_positive_rate_30d` | > 90% | 30-day rolling false positive rate (rule tuning needed) |
| `aml_audit_trail_write_failures` | > 0 | CRITICAL — Audit integrity at risk |
| `aml_consumer_lag` | > 10000 | Redpanda consumer lag (transactions queued) |
| `aml_default_deny_count` | increasing | Transactions held due to screening failure |

---

## Multi-Tenant Configuration

Each MCV venture has its own AML configuration, allowing jurisdiction-specific rules, thresholds, and reporting requirements:

```typescript
interface VentureAMLConfig {
  ventureId: string;
  ventureName: string;

  /** Jurisdictions this venture operates in */
  jurisdictions: JurisdictionCode[];

  /** Primary regulatory body */
  primaryRegulator: JurisdictionCode;

  /** Industry vertical (affects risk weighting) */
  industryVertical: 'gambling' | 'payments' | 'fintech' | 'marketplace' | 'crypto';

  /** Screening configuration */
  screening: {
    enabled: boolean;
    realTimeEnabled: boolean;
    batchEnabled: boolean;
    watchlists: WatchlistType[];
    customRuleIds: string[];
    screeningTimeout: number;
  };

  /** Threshold configuration */
  thresholds: {
    ctrThreshold: number;          // Currency-specific CTR threshold
    ctrCurrency: string;           // Currency for threshold
    aggregationWindow: string;     // e.g., 'P1D' for daily aggregation
    enhancedDueDiligenceThreshold: number;  // Risk score trigger for EDD
  };

  /** Reporting configuration */
  reporting: {
    sarEnabled: boolean;
    ctrEnabled: boolean;
    automatedReporting: boolean;
    reportingSchedule: string;     // Cron expression
    reportFormats: Record<JurisdictionCode, string>;
  };

  /** Alert configuration */
  alerts: {
    slaOverrides?: Partial<Record<AlertSeverity, string>>;
    autoEscalationRules?: AutoEscalationRule[];
    notificationChannels: string[];
  };

  /** Risk scoring overrides */
  riskScoring: {
    factorWeightOverrides?: Partial<Record<string, number>>;
    highRiskCountries?: string[];
    exemptCountries?: string[];
  };
}

// Example: BetEdge configuration
const betEdgeConfig: VentureAMLConfig = {
  ventureId: 'venture-betedge-001',
  ventureName: 'BetEdge',
  jurisdictions: ['US_FINCEN', 'UK_FCA', 'AU_AUSTRAC'],
  primaryRegulator: 'US_FINCEN',
  industryVertical: 'gambling',
  screening: {
    enabled: true,
    realTimeEnabled: true,
    batchEnabled: true,
    watchlists: ['ofac_sdn', 'ofac_consolidated', 'eu_sanctions', 'pep_global', 'adverse_media'],
    customRuleIds: ['GAMBLING-001', 'GAMBLING-002', 'GAMBLING-003'],
    screeningTimeout: 200,
  },
  thresholds: {
    ctrThreshold: 10000,
    ctrCurrency: 'USD',
    aggregationWindow: 'P1D',
    enhancedDueDiligenceThreshold: 600,
  },
  reporting: {
    sarEnabled: true,
    ctrEnabled: true,
    automatedReporting: true,
    reportingSchedule: '0 6 1 * *',   // 6 AM on the 1st of each month
    reportFormats: {
      US_FINCEN: 'BSA_XML',
      UK_FCA: 'REP-CRIM',
      AU_AUSTRAC: 'AUSTRAC_XML',
    },
  },
  alerts: {
    slaOverrides: {
      critical: '30m',            // Gambling: tighter SLA for critical alerts
    },
    autoEscalationRules: [
      {
        condition: 'amount > 50000 AND type == deposit',
        action: 'escalate',
        severity: 'critical',
      },
    ],
    notificationChannels: ['slack-aml-alerts', 'email-bsa-officer'],
  },
  riskScoring: {
    factorWeightOverrides: {
      transactional: 0.35,        // Higher weight for gambling transaction patterns
      behavioral: 0.25,           // Higher weight for behavioral anomalies
      geographic: 0.15,           // Slightly lower for domestic-focused gambling
    },
    highRiskCountries: ['IR', 'KP', 'SY', 'CU', 'VE'],
    exemptCountries: [],
  },
};
```

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| `0.1.0` | 2025-06-01 | Initial AML module — transaction screening, basic rules, OFAC screening |
| `0.2.0` | 2025-08-15 | Added SAR/CTR filing, case management, multi-jurisdiction support |
| `0.3.0` | 2025-10-01 | Real-time Redpanda streaming, risk scoring engine, PEP screening |
| `0.4.0` | 2025-12-01 | Alert tuning advisor, examination packager, regulatory scenario tests |
| `0.5.0` | 2026-02-01 | Gambling-specific rules (BetEdge), adverse media screening, 6AMLD compliance |

---

> **⚠️ Regulatory Notice**: This module implements controls required by law. Modifications to screening rules, thresholds, or reporting logic must be approved by the BSA Officer and documented in the audit trail. Unauthorized changes to AML controls may constitute a federal offense under 31 USC § 5322.