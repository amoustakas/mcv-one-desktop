# @mcv/portfolio/strategy

> **Tier 5 — MCV-Only Domain**
> Strategic planning, portfolio governance, and investment oversight for the MCV consortium.

---

## Purpose

The `@mcv/portfolio/strategy` module is the strategic brain of the MCV consortium. It provides the tooling, data models, and services required to plan, measure, and govern a portfolio of nine ventures operating across diverse market segments. Strategy is not an afterthought bolted onto operational dashboards — it is the foundational layer that drives capital allocation decisions, informs board-level governance, and ensures every venture's day-to-day execution ladders up to consortium-wide objectives. From OKR cascading to competitive intelligence, from market sizing to M&A due diligence, this module centralizes strategic reasoning so that leadership can act with conviction rather than intuition.

At its core, the module answers three questions that every multi-venture portfolio must continuously resolve: **Where are we going?** (OKRs, strategic roadmaps, investment theses), **How are we performing?** (venture scoring, KPI dashboards, board reporting), and **What's changing around us?** (competitive analysis, market sizing, pivot management). By unifying these concerns into a single domain with well-defined interfaces, the strategy module eliminates the fragmented spreadsheet-and-slide-deck approach that plagues most venture studios. Every strategic artifact — from a quarterly OKR review to an M&A target profile — lives in a structured, auditable, query-able system that feeds downstream consumers like investor relations, venture health dashboards, and resource allocation engines.

The module is designed for consortium-level oversight. While individual ventures own their operational metrics, the strategy module aggregates, normalizes, and synthesizes those signals into portfolio-level views. It respects multi-tenant isolation through Supabase RLS policies — a venture lead sees their own strategic context, while consortium leadership sees the full portfolio. This layered visibility model ensures strategic alignment without sacrificing the autonomy that makes each venture effective.

---

## Exports

```typescript
// @mcv/portfolio/strategy — public API surface

// ── Core Services ──────────────────────────────────────────────
export { StrategyService }             from './services/strategy.service';
export { OKRService }                  from './services/okr.service';
export { CompetitiveAnalysisService }  from './services/competitive-analysis.service';
export { MarketSizingService }         from './services/market-sizing.service';
export { VentureScoringService }       from './services/venture-scoring.service';
export { InvestmentThesisService }     from './services/investment-thesis.service';
export { RoadmapService }             from './services/roadmap.service';
export { BoardReportingService }       from './services/board-reporting.service';
export { MandAService }               from './services/m-and-a.service';
export { PivotManagementService }      from './services/pivot-management.service';
export { PortfolioDashboardService }   from './services/portfolio-dashboard.service';

// ── tRPC Router ────────────────────────────────────────────────
export { strategyRouter }              from './trpc/strategy.router';
export type { StrategyRouter }         from './trpc/strategy.router';

// ── Types & Interfaces ────────────────────────────────────────
export type {
  OKR,
  KeyResult,
  KeyResultUpdate,
  OKRAlignment,
  OKRCascade,
  OKRPeriod,
  OKRStatus,
} from './types/okr.types';

export type {
  CompetitorProfile,
  SWOTAnalysis,
  CompetitivePositioning,
  CompetitorIntelligence,
  MarketPositionMap,
  CompetitiveThreatLevel,
} from './types/competitive.types';

export type {
  MarketAnalysis,
  TAMSAMSOMEstimate,
  MarketSegment,
  GrowthProjection,
  MarketResearchSource,
  MarketTrend,
} from './types/market.types';

export type {
  VentureScore,
  ScoringDimension,
  ScoreWeight,
  ScoringRubric,
  VentureRanking,
  HealthIndicator,
  VentureScoreHistory,
} from './types/scoring.types';

export type {
  InvestmentThesis,
  ThesisHypothesis,
  HypothesisStatus,
  PivotDecision,
  ThesisEvolution,
  InvestmentRationale,
} from './types/thesis.types';

export type {
  StrategicRoadmap,
  RoadmapItem,
  RoadmapMilestone,
  RoadmapDependency,
  ResourceAllocation,
  RoadmapQuarter,
  RoadmapPhase,
} from './types/roadmap.types';

export type {
  BoardReport,
  BoardReportSection,
  KPIDashboard,
  DecisionLog,
  DecisionLogEntry,
  BoardMeeting,
  BoardResolution,
} from './types/board.types';

export type {
  MandATarget,
  DueDiligenceChecklist,
  DueDiligenceItem,
  IntegrationPlan,
  AcquisitionStage,
  MandAValuation,
  SynergyEstimate,
} from './types/m-and-a.types';

export type {
  PivotRecord,
  PivotFramework,
  PivotTrigger,
  PivotOutcome,
  LessonLearned,
  BeforeAfterSnapshot,
} from './types/pivot.types';

export type {
  PortfolioDashboard,
  PortfolioView,
  ResourceOptimization,
  CrossVentureMetric,
  AllocationRecommendation,
  StrategicAlert,
} from './types/dashboard.types';

// ── DB Schemas ─────────────────────────────────────────────────
export {
  okrs,
  keyResults,
  competitors,
  marketAnalyses,
  ventureScores,
  investmentTheses,
  roadmapItems,
  roadmapMilestones,
  roadmapDependencies,
  boardReports,
  boardDecisionLogs,
  mandaTargets,
  dueDiligenceItems,
  pivotRecords,
  lessonsLearned,
} from './db/schema';

// ── Validators ─────────────────────────────────────────────────
export {
  createOKRSchema,
  updateOKRSchema,
  createKeyResultSchema,
  updateKeyResultSchema,
  createCompetitorSchema,
  createMarketAnalysisSchema,
  createVentureScoreSchema,
  createInvestmentThesisSchema,
  createRoadmapItemSchema,
  createBoardReportSchema,
  createMandATargetSchema,
  createPivotRecordSchema,
} from './validators';

// ── Constants & Enums ──────────────────────────────────────────
export {
  OKR_STATUSES,
  SCORING_DIMENSIONS,
  DEFAULT_SCORING_WEIGHTS,
  HYPOTHESIS_STATUSES,
  ACQUISITION_STAGES,
  PIVOT_TRIGGER_TYPES,
  THREAT_LEVELS,
  REPORT_FREQUENCIES,
  STRATEGY_ERROR_CODES,
} from './constants';

// ── Utilities ──────────────────────────────────────────────────
export { calculateVentureScore }       from './utils/scoring';
export { cascadeOKRs }                from './utils/okr-cascade';
export { generateSWOT }               from './utils/swot';
export { computeTAMSAMSOM }           from './utils/market-sizing';
export { buildRoadmapTimeline }        from './utils/roadmap';
export { aggregatePortfolioMetrics }   from './utils/portfolio';
export { formatBoardReport }           from './utils/board-formatting';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        @mcv/portfolio/strategy                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         tRPC Router                                 │   │
│  │  strategy.router.ts                                                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │  │   OKR    │ │ Compete  │ │  Market  │ │ Scoring  │ │  Thesis  │ │   │
│  │  │ sub-rtr  │ │ sub-rtr  │ │ sub-rtr  │ │ sub-rtr  │ │ sub-rtr  │ │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │  │ Roadmap  │ │  Board   │ │   M&A    │ │  Pivot   │ │Dashboard │ │   │
│  │  │ sub-rtr  │ │ sub-rtr  │ │ sub-rtr  │ │ sub-rtr  │ │ sub-rtr  │ │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │   │
│  └───────┼────────────┼────────────┼────────────┼────────────┼────────┘   │
│          │            │            │            │            │             │
│  ┌───────▼────────────▼────────────▼────────────▼────────────▼────────┐   │
│  │                        Service Layer                                │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │   │
│  │  │  OKRService      │  │ CompetitiveAnl  │  │ MarketSizing    │    │   │
│  │  │  - create/update │  │ - trackCompete  │  │ - estimateTAM   │    │   │
│  │  │  - cascade       │  │ - buildSWOT     │  │ - projectGrowth │    │   │
│  │  │  - align         │  │ - positionMap   │  │ - segmentMkt    │    │   │
│  │  │  - reviewPeriod  │  │ - intelGather   │  │ - trendAnalyze  │    │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │   │
│  │  │ VentureScoring  │  │ InvestThesis    │  │ RoadmapService  │    │   │
│  │  │ - scoreVenture  │  │ - defineThesis  │  │ - planQuarter   │    │   │
│  │  │ - rankPortfolio │  │ - trackHypoth  │  │ - addDependency │    │   │
│  │  │ - trendAnalyze  │  │ - decidePivot  │  │ - allocateRes   │    │   │
│  │  │ - alertThresh   │  │ - evolveThesis │  │ - trackMileston │    │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │   │
│  │  │ BoardReporting  │  │ MandAService    │  │ PivotMgmt       │    │   │
│  │  │ - genReport     │  │ - trackTarget   │  │ - recordPivot   │    │   │
│  │  │ - kpiDashboard  │  │ - dueDiligence  │  │ - snapshotB/A   │    │   │
│  │  │ - decisionLog   │  │ - integratePlan │  │ - extractLesson │    │   │
│  │  │ - formatExport  │  │ - valuateTarget │  │ - triggerEval   │    │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │                  PortfolioDashboardService                   │  │   │
│  │  │  - crossVentureView  - resourceOptimization  - alerts       │  │   │
│  │  │  - allocationRecs    - executiveSummary       - trends      │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                    │                                      │
│  ┌─────────────────────────────────▼──────────────────────────────────┐   │
│  │                         Data Layer                                  │   │
│  │  Drizzle ORM + Supabase PostgreSQL + Multi-Tenant RLS             │   │
│  │                                                                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │   │
│  │  │   okrs   │ │key_result│ │competitor│ │  market_analyses     │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │   │
│  │  │ venture  │ │investmnt │ │ roadmap  │ │  roadmap_milestones  │  │   │
│  │  │ _scores  │ │ _theses  │ │ _items   │ │                      │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │   │
│  │  │  board   │ │  board   │ │  manda   │ │  due_diligence       │  │   │
│  │  │ _reports │ │_decision │ │ _targets │ │  _items              │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────────────────┐   │   │
│  │  │  pivot   │ │ lessons  │ │  roadmap_dependencies            │   │   │
│  │  │ _records │ │ _learned │ │                                  │   │   │
│  │  └──────────┘ └──────────┘ └──────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Downstream Consumers                             │   │
│  │  @mcv/portfolio/investor-relations  │  @mcv/portfolio/ventures     │   │
│  │  @mcv/portfolio/financial           │  @mcv/shared/notifications   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### StrategyService

The top-level orchestration service that coordinates all strategy sub-services and provides unified access to strategic intelligence.

```typescript
import { TRPCError } from '@trpc/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * StrategyService — top-level orchestrator for all strategic planning
 * and portfolio governance operations.
 *
 * This service coordinates sub-services, enforces cross-cutting concerns
 * (tenant isolation, audit logging, permission checks), and provides
 * high-level composite operations like "generate quarterly strategy review."
 */
interface StrategyService {
  // ── OKR Operations ─────────────────────────────────────────────
  /**
   * Create a new OKR at any level (consortium, venture, team).
   * Automatically validates cascading alignment if parentOkrId is set.
   */
  createOKR(input: CreateOKRInput): Promise<OKR>;

  /**
   * Update an OKR's status, progress, or metadata.
   * Triggers cascade recalculation for child OKRs.
   */
  updateOKR(id: string, input: UpdateOKRInput): Promise<OKR>;

  /**
   * Retrieve the full OKR tree for a given period and scope.
   * Returns nested structure with alignment scores.
   */
  getOKRTree(params: OKRTreeParams): Promise<OKRCascade>;

  /**
   * Review all OKRs for a period — marks overdue, calculates completion,
   * generates summary statistics.
   */
  reviewOKRPeriod(periodId: string): Promise<OKRPeriodReview>;

  // ── Competitive Intelligence ───────────────────────────────────
  /**
   * Create or update a competitor profile for a venture.
   */
  upsertCompetitor(input: UpsertCompetitorInput): Promise<CompetitorProfile>;

  /**
   * Generate a SWOT analysis for a venture based on current data.
   * Can be fully manual, AI-assisted, or template-based.
   */
  generateSWOT(ventureId: string, options?: SWOTOptions): Promise<SWOTAnalysis>;

  /**
   * Build a competitive positioning map showing all ventures'
   * positions relative to their market competitors.
   */
  buildPositioningMap(ventureId: string): Promise<MarketPositionMap>;

  // ── Market Sizing ──────────────────────────────────────────────
  /**
   * Create or update TAM/SAM/SOM estimates for a venture.
   */
  upsertMarketAnalysis(input: UpsertMarketAnalysisInput): Promise<MarketAnalysis>;

  /**
   * Generate growth projections based on historical data and assumptions.
   */
  projectGrowth(ventureId: string, params: GrowthProjectionParams): Promise<GrowthProjection[]>;

  // ── Venture Scoring ────────────────────────────────────────────
  /**
   * Score a venture across all dimensions using the current rubric.
   * Returns individual dimension scores and weighted composite.
   */
  scoreVenture(ventureId: string, input: ScoreVentureInput): Promise<VentureScore>;

  /**
   * Rank all ventures in the portfolio by composite score.
   * Supports custom weight overrides for scenario planning.
   */
  rankPortfolio(options?: RankingOptions): Promise<VentureRanking[]>;

  /**
   * Get score history for trend analysis.
   */
  getScoreHistory(ventureId: string, params: HistoryParams): Promise<VentureScoreHistory>;

  // ── Investment Thesis ──────────────────────────────────────────
  /**
   * Define or update the investment thesis for a venture.
   */
  upsertInvestmentThesis(input: UpsertThesisInput): Promise<InvestmentThesis>;

  /**
   * Track a hypothesis within an investment thesis.
   */
  updateHypothesis(thesisId: string, hypothesisId: string, input: HypothesisUpdateInput): Promise<ThesisHypothesis>;

  /**
   * Record a pivot decision, capturing before/after state.
   */
  recordPivotDecision(input: PivotDecisionInput): Promise<PivotDecision>;

  // ── Strategic Roadmap ──────────────────────────────────────────
  /**
   * Create a roadmap item with optional dependencies and milestones.
   */
  createRoadmapItem(input: CreateRoadmapItemInput): Promise<RoadmapItem>;

  /**
   * Get the full roadmap for a quarter or date range, with dependencies resolved.
   */
  getRoadmap(params: RoadmapParams): Promise<StrategicRoadmap>;

  /**
   * Allocate or reallocate resources across roadmap items.
   */
  allocateResources(input: ResourceAllocationInput): Promise<ResourceAllocation[]>;

  // ── Board Reporting ────────────────────────────────────────────
  /**
   * Generate a board report from current data across all strategic dimensions.
   */
  generateBoardReport(params: BoardReportParams): Promise<BoardReport>;

  /**
   * Build a KPI dashboard snapshot for a given date.
   */
  buildKPIDashboard(params: DashboardParams): Promise<KPIDashboard>;

  /**
   * Log a board-level decision with rationale and follow-up actions.
   */
  logDecision(input: DecisionLogInput): Promise<DecisionLogEntry>;

  // ── M&A Tracking ───────────────────────────────────────────────
  /**
   * Create or update an M&A target profile.
   */
  upsertMandATarget(input: UpsertMandATargetInput): Promise<MandATarget>;

  /**
   * Manage due diligence checklist items for a target.
   */
  updateDueDiligence(targetId: string, input: DueDiligenceUpdateInput): Promise<DueDiligenceChecklist>;

  /**
   * Create an integration plan for a target post-acquisition.
   */
  createIntegrationPlan(targetId: string, input: IntegrationPlanInput): Promise<IntegrationPlan>;

  // ── Pivot Management ───────────────────────────────────────────
  /**
   * Record a pivot with before/after snapshots and reasoning.
   */
  recordPivot(input: RecordPivotInput): Promise<PivotRecord>;

  /**
   * Extract lessons learned from a completed pivot.
   */
  extractLessons(pivotId: string, input: LessonsInput): Promise<LessonLearned[]>;

  // ── Portfolio Dashboard ────────────────────────────────────────
  /**
   * Generate a cross-venture portfolio dashboard with all key metrics.
   */
  getPortfolioDashboard(params: DashboardParams): Promise<PortfolioDashboard>;

  /**
   * Get resource allocation optimization recommendations.
   */
  getOptimizationRecommendations(): Promise<AllocationRecommendation[]>;

  /**
   * Get active strategic alerts (ventures trending down, missed milestones, etc.).
   */
  getStrategicAlerts(): Promise<StrategicAlert[]>;
}
```

### OKR Types

```typescript
/**
 * Represents a single Objective with its associated Key Results.
 * OKRs cascade from consortium → venture → team level.
 */
interface OKR {
  id: string;
  tenantId: string;

  /** The venture this OKR belongs to (null = consortium-level) */
  ventureId: string | null;

  /** The team within a venture (null = venture-level) */
  teamId: string | null;

  /** Parent OKR for cascading alignment */
  parentOkrId: string | null;

  /** The objective statement — qualitative, inspirational */
  objective: string;

  /** Additional context or rationale */
  description: string | null;

  /** Which OKR period this belongs to (e.g., "2026-Q1") */
  periodId: string;

  /** Cascading level: 'consortium' | 'venture' | 'team' */
  level: OKRLevel;

  /** Current status */
  status: OKRStatus;

  /** Overall progress (0.0 – 1.0), computed from key results */
  progress: number;

  /** Alignment score with parent OKR (0.0 – 1.0, null if no parent) */
  alignmentScore: number | null;

  /** Who owns this OKR */
  ownerId: string;

  /** Key results attached to this objective */
  keyResults: KeyResult[];

  /** Child OKRs that cascade from this one */
  children: OKR[];

  createdAt: Date;
  updatedAt: Date;
}

type OKRLevel = 'consortium' | 'venture' | 'team';

type OKRStatus =
  | 'draft'
  | 'active'
  | 'on_track'
  | 'at_risk'
  | 'behind'
  | 'completed'
  | 'cancelled';

/**
 * A measurable key result within an OKR.
 */
interface KeyResult {
  id: string;
  okrId: string;

  /** What we're measuring */
  title: string;

  /** Metric type determines how progress is calculated */
  metricType: 'number' | 'percentage' | 'currency' | 'boolean' | 'milestone';

  /** Starting value at period begin */
  startValue: number;

  /** Current value */
  currentValue: number;

  /** Target value to achieve */
  targetValue: number;

  /** Unit label (e.g., "users", "ARR", "%") */
  unit: string;

  /** Computed progress: (current - start) / (target - start) */
  progress: number;

  /** Confidence level from the owner (0.0 – 1.0) */
  confidence: number;

  /** Owner of this key result */
  ownerId: string;

  /** Ordered updates / check-ins */
  updates: KeyResultUpdate[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * A point-in-time update to a key result's progress.
 */
interface KeyResultUpdate {
  id: string;
  keyResultId: string;
  value: number;
  confidence: number;
  note: string | null;
  updatedBy: string;
  createdAt: Date;
}

/**
 * Represents the alignment relationship between OKRs at different levels.
 */
interface OKRAlignment {
  parentOkrId: string;
  childOkrId: string;
  alignmentScore: number;
  alignmentNotes: string | null;
  lastReviewedAt: Date;
  reviewedBy: string;
}

/**
 * A full cascade view showing how OKRs flow from consortium down to teams.
 */
interface OKRCascade {
  period: OKRPeriod;
  consortiumOkrs: OKR[];
  totalObjectives: number;
  totalKeyResults: number;
  overallProgress: number;
  alignmentHealth: number; // Average alignment score across all parent-child pairs
  ventureBreakdown: Array<{
    ventureId: string;
    ventureName: string;
    objectives: number;
    progress: number;
    alignment: number;
  }>;
}

/**
 * An OKR period (typically quarterly).
 */
interface OKRPeriod {
  id: string;
  tenantId: string;
  name: string;        // e.g., "2026 Q1"
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'review' | 'closed';
  createdAt: Date;
}
```

### Competitive Analysis Types

```typescript
/**
 * A profile of a competitor relevant to one or more ventures.
 */
interface CompetitorProfile {
  id: string;
  tenantId: string;
  ventureId: string;

  /** Company or product name */
  name: string;

  /** Website / primary URL */
  url: string | null;

  /** Brief description */
  description: string;

  /** Funding stage or total funding */
  fundingInfo: string | null;

  /** Estimated employee count range */
  employeeRange: string | null;

  /** Key product features or capabilities */
  keyFeatures: string[];

  /** Pricing model summary */
  pricingModel: string | null;

  /** Where they are strong */
  strengths: string[];

  /** Where they are weak */
  weaknesses: string[];

  /** How much of a threat (1-5 scale) */
  threatLevel: CompetitiveThreatLevel;

  /** Last time this profile was reviewed / updated */
  lastResearchedAt: Date;

  /** Most recent SWOT analysis */
  latestSWOT: SWOTAnalysis | null;

  /** Market share estimate (0.0 – 1.0) */
  estimatedMarketShare: number | null;

  /** Tags for categorization */
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

type CompetitiveThreatLevel = 1 | 2 | 3 | 4 | 5;

/**
 * SWOT analysis for a venture relative to its competitive landscape.
 */
interface SWOTAnalysis {
  id: string;
  ventureId: string;

  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];

  /** Overall strategic recommendation */
  strategicImplications: string;

  /** Who conducted this analysis */
  analyzedBy: string;
  analyzedAt: Date;

  /** Next review date */
  nextReviewDate: Date | null;
}

interface SWOTItem {
  id: string;
  text: string;
  impact: 'low' | 'medium' | 'high';
  confidence: 'low' | 'medium' | 'high';
  relatedCompetitorIds: string[];
  notes: string | null;
}

/**
 * Competitive positioning data for visualizing market position.
 */
interface CompetitivePositioning {
  ventureId: string;
  axes: {
    x: { label: string; description: string };
    y: { label: string; description: string };
  };
  positions: Array<{
    entityId: string;
    entityName: string;
    entityType: 'venture' | 'competitor';
    x: number; // -1.0 to 1.0
    y: number; // -1.0 to 1.0
    bubbleSize: number; // Relative size (market share, revenue, etc.)
  }>;
}

/**
 * Market position map aggregating competitive positioning data.
 */
interface MarketPositionMap {
  ventureId: string;
  ventureName: string;
  positioning: CompetitivePositioning;
  competitors: CompetitorProfile[];
  updatedAt: Date;
}

/**
 * Intelligence gathered about a competitor from various sources.
 */
interface CompetitorIntelligence {
  id: string;
  competitorId: string;
  source: 'news' | 'product_update' | 'hiring' | 'funding' | 'partnership' | 'user_feedback' | 'manual';
  title: string;
  content: string;
  url: string | null;
  impactAssessment: string | null;
  discoveredAt: Date;
  addedBy: string;
}
```

### Market Analysis Types

```typescript
/**
 * Complete market analysis for a venture including TAM/SAM/SOM.
 */
interface MarketAnalysis {
  id: string;
  tenantId: string;
  ventureId: string;

  /** Human-readable name for this analysis */
  name: string;

  /** Market being analyzed */
  marketName: string;

  /** Version number (analyses evolve over time) */
  version: number;

  /** TAM/SAM/SOM breakdown */
  sizing: TAMSAMSOMEstimate;

  /** Market segments identified */
  segments: MarketSegment[];

  /** Growth projections */
  growthProjections: GrowthProjection[];

  /** Key trends affecting this market */
  trends: MarketTrend[];

  /** Data sources and methodology */
  sources: MarketResearchSource[];

  /** Assumptions underlying the analysis */
  assumptions: string[];

  /** Confidence level in the analysis */
  confidence: 'low' | 'medium' | 'high';

  /** Analysis date */
  analyzedAt: Date;

  /** Next scheduled review */
  nextReviewDate: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Total Addressable Market, Serviceable Addressable Market,
 * Serviceable Obtainable Market estimates.
 */
interface TAMSAMSOMEstimate {
  /** Total Addressable Market */
  tam: MarketSizeEstimate;

  /** Serviceable Addressable Market */
  sam: MarketSizeEstimate;

  /** Serviceable Obtainable Market */
  som: MarketSizeEstimate;

  /** Currency for all values */
  currency: string;

  /** Base year for estimates */
  baseYear: number;

  /** Methodology used (top-down, bottom-up, value-theory) */
  methodology: 'top_down' | 'bottom_up' | 'value_theory' | 'hybrid';
}

interface MarketSizeEstimate {
  /** Estimated value in currency units */
  value: number;

  /** Low-end estimate */
  lowEstimate: number;

  /** High-end estimate */
  highEstimate: number;

  /** Annual growth rate (CAGR) */
  cagr: number;

  /** How we arrived at this number */
  rationale: string;
}

/**
 * A segment within the broader market.
 */
interface MarketSegment {
  id: string;
  name: string;
  description: string;
  size: number;
  growthRate: number;
  ventureRelevance: 'primary' | 'secondary' | 'adjacent';
  characteristics: string[];
  penetrationEstimate: number; // 0.0 – 1.0
}

/**
 * A growth projection for a specific time horizon.
 */
interface GrowthProjection {
  year: number;
  projectedTAM: number;
  projectedSAM: number;
  projectedSOM: number;
  projectedRevenue: number;
  assumptions: string[];
  scenario: 'conservative' | 'base' | 'optimistic';
}

/**
 * A market trend that could impact strategy.
 */
interface MarketTrend {
  id: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: 'low' | 'medium' | 'high';
  timeHorizon: 'short_term' | 'medium_term' | 'long_term';
  confidence: 'low' | 'medium' | 'high';
  sources: string[];
}

/**
 * A research source used in market analysis.
 */
interface MarketResearchSource {
  id: string;
  title: string;
  publisher: string;
  url: string | null;
  publishedAt: Date | null;
  credibility: 'low' | 'medium' | 'high';
  keyFindings: string[];
}
```

### Venture Scoring Types

```typescript
/**
 * A composite score for a venture across multiple dimensions.
 * Used for portfolio ranking, resource allocation, and health monitoring.
 */
interface VentureScore {
  id: string;
  tenantId: string;
  ventureId: string;

  /** The scoring period (e.g., "2026-Q1") */
  periodId: string;

  /** Individual dimension scores */
  dimensions: ScoringDimensionResult[];

  /** Weighted composite score (0 – 100) */
  compositeScore: number;

  /** Percentile rank in portfolio (0.0 – 1.0) */
  portfolioPercentile: number | null;

  /** Score trend (compared to previous period) */
  trend: 'improving' | 'stable' | 'declining';

  /** Change from previous period's composite score */
  scoreChange: number;

  /** Health indicators derived from scores */
  healthIndicators: HealthIndicator[];

  /** Any override or manual adjustment */
  manualAdjustment: number | null;
  adjustmentReason: string | null;

  /** Who performed this scoring */
  scoredBy: string;
  scoredAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Scoring result for a single dimension.
 */
interface ScoringDimensionResult {
  dimension: ScoringDimension;
  score: number;         // Raw score (0 – 100)
  weight: number;        // Weight applied (0.0 – 1.0)
  weightedScore: number; // score × weight
  evidence: string;      // Justification for the score
  dataPoints: Record<string, number | string>; // Supporting metrics
}

/**
 * The dimensions along which ventures are scored.
 */
type ScoringDimension =
  | 'market_opportunity'
  | 'product_maturity'
  | 'team_strength'
  | 'financial_health'
  | 'growth_trajectory'
  | 'competitive_position'
  | 'strategic_alignment'
  | 'execution_velocity'
  | 'customer_traction'
  | 'technical_moat';

/**
 * Weight configuration for scoring dimensions.
 */
interface ScoreWeight {
  dimension: ScoringDimension;
  weight: number; // 0.0 – 1.0, all weights must sum to 1.0
  description: string;
}

/**
 * Rubric defining how to score each dimension.
 */
interface ScoringRubric {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  weights: ScoreWeight[];
  dimensionDescriptions: Record<ScoringDimension, {
    description: string;
    scoringGuidelines: {
      range: [number, number];
      label: string;
      criteria: string[];
    }[];
  }>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ranked list of ventures based on scoring.
 */
interface VentureRanking {
  rank: number;
  ventureId: string;
  ventureName: string;
  compositeScore: number;
  trend: 'improving' | 'stable' | 'declining';
  topStrength: ScoringDimension;
  topWeakness: ScoringDimension;
  alerts: string[];
}

/**
 * Health indicator derived from venture scores.
 */
interface HealthIndicator {
  category: 'critical' | 'warning' | 'healthy' | 'thriving';
  dimension: ScoringDimension;
  message: string;
  threshold: number;
  actual: number;
}

/**
 * Historical score data for trend analysis.
 */
interface VentureScoreHistory {
  ventureId: string;
  scores: Array<{
    periodId: string;
    compositeScore: number;
    dimensions: Record<ScoringDimension, number>;
    scoredAt: Date;
  }>;
}
```

### Investment Thesis Types

```typescript
/**
 * The investment thesis for a venture — why we're investing,
 * what we believe, and what would make us stop.
 */
interface InvestmentThesis {
  id: string;
  tenantId: string;
  ventureId: string;

  /** Version number (theses evolve) */
  version: number;

  /** One-line thesis statement */
  statement: string;

  /** Full thesis narrative */
  narrative: string;

  /** The core hypotheses that must hold true */
  hypotheses: ThesisHypothesis[];

  /** Investment rationale breakdown */
  rationale: InvestmentRationale;

  /** What would make us exit / shut down */
  killCriteria: string[];

  /** Total capital allocated */
  capitalAllocated: number;

  /** Capital deployed to date */
  capitalDeployed: number;

  /** Target return multiple */
  targetMultiple: number | null;

  /** Target timeline (months) */
  targetTimelineMonths: number | null;

  /** Current thesis status */
  status: 'active' | 'under_review' | 'pivoting' | 'validated' | 'invalidated';

  /** Evolution history — how the thesis has changed */
  evolution: ThesisEvolution[];

  /** When this version was established */
  establishedAt: Date;

  /** Next review date */
  nextReviewDate: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * A single hypothesis within an investment thesis.
 */
interface ThesisHypothesis {
  id: string;
  thesisId: string;

  /** The hypothesis statement */
  statement: string;

  /** What category this hypothesis falls into */
  category: 'market' | 'product' | 'team' | 'business_model' | 'technology' | 'timing';

  /** Current status */
  status: HypothesisStatus;

  /** How critical is this hypothesis to the thesis */
  criticality: 'must_have' | 'important' | 'nice_to_have';

  /** Evidence supporting or refuting */
  evidence: Array<{
    type: 'supporting' | 'refuting' | 'neutral';
    description: string;
    source: string;
    date: Date;
  }>;

  /** Confidence level (0.0 – 1.0) */
  confidence: number;

  /** Metrics that test this hypothesis */
  testMetrics: string[];

  /** What would validate this hypothesis */
  validationCriteria: string;

  /** What would invalidate it */
  invalidationCriteria: string;

  createdAt: Date;
  updatedAt: Date;
}

type HypothesisStatus =
  | 'untested'
  | 'testing'
  | 'partially_validated'
  | 'validated'
  | 'invalidated'
  | 'pivoted';

/**
 * The rationale breakdown for an investment.
 */
interface InvestmentRationale {
  /** Why this market */
  marketRationale: string;

  /** Why this product approach */
  productRationale: string;

  /** Why this team */
  teamRationale: string;

  /** Why now */
  timingRationale: string;

  /** Expected competitive advantages */
  competitiveAdvantages: string[];

  /** Key risks identified */
  keyRisks: Array<{
    risk: string;
    likelihood: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
}

/**
 * A record of how the thesis has evolved over time.
 */
interface ThesisEvolution {
  id: string;
  thesisId: string;
  fromVersion: number;
  toVersion: number;
  changeType: 'minor_update' | 'major_revision' | 'pivot' | 'initial';
  changeSummary: string;
  changedBy: string;
  changedAt: Date;
}

/**
 * A pivot decision — when a venture changes direction.
 */
interface PivotDecision {
  id: string;
  thesisId: string;
  ventureId: string;

  /** What triggered the pivot */
  trigger: string;

  /** What we're pivoting from */
  from: string;

  /** What we're pivoting to */
  to: string;

  /** Detailed rationale */
  rationale: string;

  /** Impact on investment thesis */
  thesisImpact: string;

  /** New capital requirements, if any */
  additionalCapitalNeeded: number | null;

  /** Decision status */
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'abandoned';

  /** Who proposed and who approved */
  proposedBy: string;
  approvedBy: string | null;

  proposedAt: Date;
  decidedAt: Date | null;
}
```

### Strategic Roadmap Types

```typescript
/**
 * A strategic roadmap covering a time range with items, milestones,
 * dependencies, and resource allocations.
 */
interface StrategicRoadmap {
  id: string;
  tenantId: string;

  /** Roadmap scope (consortium-wide or single venture) */
  ventureId: string | null;

  /** Roadmap name */
  name: string;

  /** Time range covered */
  startDate: Date;
  endDate: Date;

  /** Quarters within this roadmap */
  quarters: RoadmapQuarter[];

  /** All items in the roadmap */
  items: RoadmapItem[];

  /** All milestones */
  milestones: RoadmapMilestone[];

  /** Dependencies between items */
  dependencies: RoadmapDependency[];

  /** Resource allocations across items */
  allocations: ResourceAllocation[];

  /** Overall roadmap status */
  status: 'draft' | 'active' | 'completed' | 'archived';

  createdAt: Date;
  updatedAt: Date;
}

/**
 * A single item on the strategic roadmap.
 */
interface RoadmapItem {
  id: string;
  roadmapId: string;
  ventureId: string;

  /** Item title */
  title: string;

  /** Detailed description */
  description: string;

  /** Strategic category */
  category: 'product' | 'growth' | 'operations' | 'technology' | 'people' | 'finance' | 'partnerships';

  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';

  /** Which phase of the roadmap */
  phase: RoadmapPhase;

  /** Time bounds */
  startDate: Date;
  endDate: Date;

  /** Current status */
  status: 'planned' | 'in_progress' | 'blocked' | 'completed' | 'deferred' | 'cancelled';

  /** Completion percentage (0 – 100) */
  completionPercent: number;

  /** Owner of this item */
  ownerId: string;

  /** Related OKR IDs */
  linkedOkrIds: string[];

  /** Tags for filtering */
  tags: string[];

  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high';

  /** Notes / updates */
  notes: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * A milestone — a significant checkpoint within the roadmap.
 */
interface RoadmapMilestone {
  id: string;
  roadmapId: string;
  ventureId: string | null;

  /** Milestone name */
  name: string;

  /** Description of what achieving this milestone means */
  description: string;

  /** Target date */
  targetDate: Date;

  /** Actual completion date */
  actualDate: Date | null;

  /** Status */
  status: 'upcoming' | 'on_track' | 'at_risk' | 'missed' | 'achieved';

  /** Linked roadmap item IDs */
  linkedItemIds: string[];

  /** Success criteria */
  successCriteria: string[];

  createdAt: Date;
}

/**
 * A dependency between two roadmap items.
 */
interface RoadmapDependency {
  id: string;
  /** The item that must complete first */
  predecessorId: string;
  /** The item that depends on the predecessor */
  successorId: string;
  /** Type of dependency */
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  /** Optional lag in days */
  lagDays: number;
  /** Status of the dependency */
  status: 'pending' | 'satisfied' | 'blocking';
}

/**
 * Resource allocation for a roadmap item.
 */
interface ResourceAllocation {
  id: string;
  roadmapItemId: string;
  ventureId: string;

  /** Resource type */
  resourceType: 'budget' | 'headcount' | 'time' | 'external';

  /** Amount allocated */
  amount: number;

  /** Unit (e.g., "USD", "FTEs", "hours", "contractors") */
  unit: string;

  /** Time period for this allocation */
  periodStart: Date;
  periodEnd: Date;

  /** Notes */
  notes: string | null;
}

type RoadmapPhase = 'discovery' | 'validation' | 'build' | 'launch' | 'scale' | 'optimize';

/**
 * A quarter within the roadmap, summarizing its items and progress.
 */
interface RoadmapQuarter {
  label: string;       // e.g., "2026 Q1"
  startDate: Date;
  endDate: Date;
  itemCount: number;
  completedCount: number;
  blockedCount: number;
  totalBudget: number;
  budgetSpent: number;
}
```

### Board Reporting Types

```typescript
/**
 * A board report — a structured document for board meetings.
 */
interface BoardReport {
  id: string;
  tenantId: string;

  /** Report title */
  title: string;

  /** Reporting period */
  periodStart: Date;
  periodEnd: Date;

  /** Report type */
  reportType: 'quarterly' | 'monthly' | 'annual' | 'ad_hoc';

  /** Executive summary */
  executiveSummary: string;

  /** Structured sections */
  sections: BoardReportSection[];

  /** KPI dashboard snapshot */
  kpiDashboard: KPIDashboard;

  /** Decisions requiring board attention */
  decisionsRequired: string[];

  /** Status */
  status: 'draft' | 'review' | 'approved' | 'presented';

  /** Generated by */
  generatedBy: string;
  generatedAt: Date;

  /** Approval chain */
  approvedBy: string | null;
  approvedAt: Date | null;

  /** Board meeting this was presented at, if any */
  boardMeetingId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * A section within a board report.
 */
interface BoardReportSection {
  id: string;
  title: string;
  order: number;
  content: string;
  sectionType:
    | 'portfolio_overview'
    | 'venture_spotlight'
    | 'financial_summary'
    | 'strategic_update'
    | 'risk_assessment'
    | 'competitive_landscape'
    | 'team_update'
    | 'decisions_needed'
    | 'appendix';
  ventureId: string | null;
  charts: Array<{
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'table';
    title: string;
    data: Record<string, unknown>;
  }>;
}

/**
 * KPI dashboard — a snapshot of key performance indicators.
 */
interface KPIDashboard {
  id: string;
  tenantId: string;
  snapshotDate: Date;

  /** Portfolio-level KPIs */
  portfolioKPIs: Array<{
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'flat';
    changePercent: number;
    target: number | null;
    status: 'on_track' | 'at_risk' | 'behind';
  }>;

  /** Per-venture KPI summaries */
  ventureKPIs: Array<{
    ventureId: string;
    ventureName: string;
    kpis: Array<{
      name: string;
      value: number;
      unit: string;
      trend: 'up' | 'down' | 'flat';
      changePercent: number;
      target: number | null;
    }>;
    overallHealth: 'critical' | 'warning' | 'healthy' | 'thriving';
  }>;
}

/**
 * A decision logged for board records.
 */
interface DecisionLogEntry {
  id: string;
  tenantId: string;

  /** What was decided */
  decision: string;

  /** Context and background */
  context: string;

  /** Rationale for the decision */
  rationale: string;

  /** Who made the decision */
  decidedBy: string[];

  /** When it was decided */
  decidedAt: Date;

  /** Impact area */
  impactArea: 'portfolio' | 'venture' | 'financial' | 'strategic' | 'operational';

  /** Related venture, if applicable */
  ventureId: string | null;

  /** Follow-up actions */
  followUpActions: Array<{
    action: string;
    ownerId: string;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'completed';
  }>;

  /** Related board meeting */
  boardMeetingId: string | null;

  createdAt: Date;
}

/**
 * A board meeting record.
 */
interface BoardMeeting {
  id: string;
  tenantId: string;
  title: string;
  date: Date;
  attendees: string[];
  agendaItems: string[];
  reportId: string | null;
  decisions: DecisionLogEntry[];
  resolutions: BoardResolution[];
  minutesUrl: string | null;
  status: 'scheduled' | 'in_progress' | 'completed';
  createdAt: Date;
}

/**
 * A formal board resolution.
 */
interface BoardResolution {
  id: string;
  meetingId: string;
  resolutionNumber: string;
  title: string;
  text: string;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  passed: boolean;
  effectiveDate: Date;
}
```

### M&A Types

```typescript
/**
 * An M&A target — a company being evaluated for acquisition.
 */
interface MandATarget {
  id: string;
  tenantId: string;

  /** Which venture would this acquisition benefit */
  ventureId: string;

  /** Target company name */
  companyName: string;

  /** Brief description */
  description: string;

  /** Website */
  url: string | null;

  /** Why we're interested */
  strategicRationale: string;

  /** Current acquisition stage */
  stage: AcquisitionStage;

  /** Valuation estimates */
  valuation: MandAValuation | null;

  /** Expected synergies */
  synergies: SynergyEstimate[];

  /** Due diligence checklist */
  dueDiligence: DueDiligenceChecklist;

  /** Integration plan (post-LOI stage) */
  integrationPlan: IntegrationPlan | null;

  /** Key contacts at the target */
  contacts: Array<{
    name: string;
    role: string;
    email: string | null;
    notes: string | null;
  }>;

  /** Internal champion / deal lead */
  dealLeadId: string;

  /** Priority ranking among targets */
  priority: 'high' | 'medium' | 'low';

  /** Deal status */
  status: 'active' | 'on_hold' | 'passed' | 'acquired' | 'lost';

  /** Key dates */
  identifiedAt: Date;
  firstContactAt: Date | null;
  loiSignedAt: Date | null;
  closedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

type AcquisitionStage =
  | 'identified'
  | 'initial_research'
  | 'first_contact'
  | 'exploratory'
  | 'due_diligence'
  | 'negotiation'
  | 'loi_signed'
  | 'closing'
  | 'closed'
  | 'integration'
  | 'passed';

/**
 * Valuation data for an M&A target.
 */
interface MandAValuation {
  estimatedValue: number;
  valuationMethod: 'dcf' | 'revenue_multiple' | 'ebitda_multiple' | 'comparable' | 'asset_based' | 'custom';
  currency: string;
  lowEstimate: number;
  highEstimate: number;
  assumptions: string[];
  valuedAt: Date;
  valuedBy: string;
}

/**
 * Expected synergy from an acquisition.
 */
interface SynergyEstimate {
  id: string;
  type: 'revenue' | 'cost' | 'technology' | 'talent' | 'market_access' | 'ip';
  description: string;
  estimatedValue: number;
  timeToRealize: number; // months
  confidence: 'low' | 'medium' | 'high';
  assumptions: string[];
}

/**
 * Due diligence checklist for an M&A target.
 */
interface DueDiligenceChecklist {
  targetId: string;
  items: DueDiligenceItem[];
  overallProgress: number; // 0.0 – 1.0
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
}

/**
 * A single due diligence item.
 */
interface DueDiligenceItem {
  id: string;
  category: 'financial' | 'legal' | 'technical' | 'operational' | 'hr' | 'ip' | 'regulatory' | 'commercial';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'flagged' | 'waived';
  assigneeId: string | null;
  findings: string | null;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  documents: string[]; // Reference to document IDs
  dueDate: Date | null;
  completedAt: Date | null;
}

/**
 * Integration plan for post-acquisition.
 */
interface IntegrationPlan {
  id: string;
  targetId: string;
  phases: Array<{
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    tasks: Array<{
      title: string;
      ownerId: string;
      status: 'planned' | 'in_progress' | 'completed';
      dueDate: Date;
    }>;
  }>;
  keyDecisions: string[];
  riskMitigations: string[];
  communicationPlan: string;
  status: 'planning' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

### Pivot Management Types

```typescript
/**
 * A record of a venture pivot — when strategic direction changes significantly.
 */
interface PivotRecord {
  id: string;
  tenantId: string;
  ventureId: string;

  /** What type of pivot */
  pivotType: 'market' | 'product' | 'business_model' | 'technology' | 'customer_segment' | 'channel' | 'full';

  /** What triggered the pivot */
  trigger: PivotTrigger;

  /** Before/after snapshot */
  beforeAfter: BeforeAfterSnapshot;

  /** Detailed rationale */
  rationale: string;

  /** Who proposed and who approved */
  proposedBy: string;
  approvedBy: string;

  /** Impact on resources */
  resourceImpact: {
    budgetChange: number;
    headcountChange: number;
    timelineExtension: number; // months
  };

  /** Status */
  status: 'proposed' | 'approved' | 'executing' | 'completed' | 'abandoned';

  /** Outcome assessment (filled after completion) */
  outcome: PivotOutcome | null;

  /** Lessons learned */
  lessonsLearned: LessonLearned[];

  /** Dates */
  proposedAt: Date;
  approvedAt: Date | null;
  completedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * What triggered a pivot decision.
 */
interface PivotTrigger {
  type: 'market_shift' | 'customer_feedback' | 'competitive_pressure' | 'financial_performance' | 'technology_change' | 'regulatory' | 'team_insight' | 'data_driven';
  description: string;
  evidence: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Before/after snapshot capturing the state change during a pivot.
 */
interface BeforeAfterSnapshot {
  before: {
    targetMarket: string;
    valueProposition: string;
    revenueModel: string;
    keyMetrics: Record<string, number>;
    customerSegment: string;
    channels: string[];
    techStack: string[];
    teamSize: number;
    monthlyBurnRate: number;
  };
  after: {
    targetMarket: string;
    valueProposition: string;
    revenueModel: string;
    projectedMetrics: Record<string, number>;
    customerSegment: string;
    channels: string[];
    techStack: string[];
    teamSize: number;
    monthlyBurnRate: number;
  };
}

/**
 * The outcome of a completed pivot.
 */
interface PivotOutcome {
  success: boolean;
  assessment: string;
  metricsComparison: Record<string, {
    before: number;
    projected: number;
    actual: number;
  }>;
  timeToResults: number; // months
  unexpectedConsequences: string[];
}

/**
 * A lesson learned from a pivot or strategic decision.
 */
interface LessonLearned {
  id: string;
  pivotId: string | null;
  ventureId: string;
  tenantId: string;

  /** The lesson */
  title: string;
  description: string;

  /** Categorization */
  category: 'market' | 'product' | 'team' | 'process' | 'technology' | 'financial' | 'timing';

  /** Applicability */
  applicableTo: 'all_ventures' | 'similar_stage' | 'same_market' | 'specific_venture';

  /** Actionable recommendations */
  recommendations: string[];

  /** Who documented this */
  documentedBy: string;
  documentedAt: Date;
}
```

### Portfolio Dashboard Types

```typescript
/**
 * A comprehensive portfolio dashboard combining all strategic views.
 */
interface PortfolioDashboard {
  tenantId: string;
  generatedAt: Date;

  /** High-level portfolio summary */
  summary: {
    totalVentures: number;
    activeVentures: number;
    totalCapitalDeployed: number;
    totalRevenue: number;
    portfolioHealth: 'critical' | 'warning' | 'healthy' | 'thriving';
    overallOKRProgress: number;
  };

  /** Per-venture views */
  ventureViews: PortfolioView[];

  /** Cross-venture metrics */
  crossVentureMetrics: CrossVentureMetric[];

  /** Resource allocation overview */
  resourceAllocation: {
    totalBudget: number;
    allocated: number;
    unallocated: number;
    byVenture: Array<{
      ventureId: string;
      ventureName: string;
      amount: number;
      percentage: number;
    }>;
  };

  /** Active alerts */
  alerts: StrategicAlert[];

  /** Optimization recommendations */
  recommendations: AllocationRecommendation[];
}

/**
 * A single venture's view within the portfolio dashboard.
 */
interface PortfolioView {
  ventureId: string;
  ventureName: string;
  stage: string;

  /** Venture score summary */
  score: {
    composite: number;
    trend: 'improving' | 'stable' | 'declining';
    topStrength: string;
    topWeakness: string;
  };

  /** OKR progress */
  okrProgress: number;

  /** Financial snapshot */
  financials: {
    revenue: number;
    revenueGrowth: number;
    burnRate: number;
    runway: number; // months
  };

  /** Roadmap status */
  roadmapStatus: {
    totalItems: number;
    completedItems: number;
    blockedItems: number;
    nextMilestone: string | null;
    nextMilestoneDate: Date | null;
  };

  /** Health indicators */
  health: HealthIndicator[];
}

/**
 * A metric calculated across all ventures in the portfolio.
 */
interface CrossVentureMetric {
  name: string;
  description: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'flat';
  ventureBreakdown: Array<{
    ventureId: string;
    ventureName: string;
    value: number;
  }>;
}

/**
 * A recommendation for reallocating resources.
 */
interface AllocationRecommendation {
  id: string;
  type: 'increase' | 'decrease' | 'reallocate' | 'pause' | 'accelerate';
  ventureId: string;
  ventureName: string;
  resourceType: 'budget' | 'headcount' | 'attention';
  currentAllocation: number;
  recommendedAllocation: number;
  rationale: string;
  confidence: 'low' | 'medium' | 'high';
  expectedImpact: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * A strategic alert requiring attention.
 */
interface StrategicAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'score_decline' | 'milestone_missed' | 'budget_overrun' | 'okr_behind' | 'competitive_threat' | 'hypothesis_invalidated' | 'runway_low' | 'team_issue';
  ventureId: string | null;
  ventureName: string | null;
  title: string;
  message: string;
  actionRequired: string;
  createdAt: Date;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
}
```

---

## Database Schemas

All schemas use Drizzle ORM with Supabase PostgreSQL. Every table enforces multi-tenant isolation via `tenant_id` and RLS policies.

### OKR Tables

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  real,
  integer,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ── Enums ─────────────────────────────────────────────────────

export const okrLevelEnum = pgEnum('okr_level', [
  'consortium',
  'venture',
  'team',
]);

export const okrStatusEnum = pgEnum('okr_status', [
  'draft',
  'active',
  'on_track',
  'at_risk',
  'behind',
  'completed',
  'cancelled',
]);

export const periodStatusEnum = pgEnum('period_status', [
  'planning',
  'active',
  'review',
  'closed',
]);

export const keyResultMetricEnum = pgEnum('kr_metric_type', [
  'number',
  'percentage',
  'currency',
  'boolean',
  'milestone',
]);

// ── OKR Periods ───────────────────────────────────────────────

export const okrPeriods = pgTable('okr_periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),                 // "2026 Q1"
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: periodStatusEnum('status').default('planning').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('okr_periods_tenant_idx').on(table.tenantId),
  statusIdx: index('okr_periods_status_idx').on(table.tenantId, table.status),
}));

// ── OKRs ──────────────────────────────────────────────────────

export const okrs = pgTable('okrs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  ventureId: uuid('venture_id'),               // null = consortium-level
  teamId: uuid('team_id'),                     // null = venture-level
  parentOkrId: uuid('parent_okr_id'),          // for cascading
  periodId: uuid('period_id').notNull().references(() => okrPeriods.id),
  objective: text('objective').notNull(),
  description: text('description'),
  level: okrLevelEnum('level').notNull(),
  status: okrStatusEnum('status').default('draft').notNull(),
  progress: real('progress').default(0).notNull(),
  alignmentScore: real('alignment_score'),
  ownerId: uuid('owner_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('okrs_tenant_idx').on(table.tenantId),
  ventureIdx: index('okrs_venture_idx').on(table.tenantId, table.ventureId),
  periodIdx: index('okrs_period_idx').on(table.tenantId, table.periodId),
  parentIdx: index('okrs_parent_idx').on(table.parentOkrId),
  levelIdx: index('okrs_level_idx').on(table.tenantId, table.level),
}));

// ── Key Results ───────────────────────────────────────────────

export const keyResults = pgTable('key_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  okrId: uuid('okr_id').notNull().references(() => okrs.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  metricType: keyResultMetricEnum('metric_type').notNull(),
  startValue: real('start_value').default(0).notNull(),
  currentValue: real('current_value').default(0).notNull(),
  targetValue: real('target_value').notNull(),
  unit: text('unit').notNull(),
  progress: real('progress').default(0).notNull(),
  confidence: real('confidence').default(0.5).notNull(),
  ownerId: uuid('owner_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  okrIdx: index('kr_okr_idx').on(table.okrId),
}));

// ── Key Result Updates ────────────────────────────────────────

export const keyResultUpdates = pgTable('key_result_updates', {
  id: uuid('id').defaultRandom().primaryKey(),
  keyResultId: uuid('key_result_id').notNull().references(() => keyResults.id, { onDelete: 'cascade' }),
  value: real('value').notNull(),
  confidence: real('confidence').notNull(),
  note: text('note'),
  updatedBy: uuid('updated_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  krIdx: index('kru_kr_idx').on(table.keyResultId),
}));
```

### Competitor & Market Analysis Tables

```typescript
// ── Competitor Profiles ───────────────────────────────────────

export const competitors = pgTable('competitors', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  ventureId: uuid('venture_id').notNull(),
  name: text('name').notNull(),
  url: text('url'),
  description: text('description').notNull(),
  fundingInfo: text('funding_info'),
  employeeRange: text('employee_range'),
  keyFeatures: jsonb('key_features').$type<string[]>().default([]),
  pricingModel: text('pricing_model'),
  strengths: jsonb('strengths').$type<string[]>().default([]),
  weaknesses: jsonb('weaknesses').$type<string[]>().default([]),
  threatLevel: integer('threat_level').default(3).notNull(),
  estimatedMarketShare: real('estimated_market_share'),
  tags: jsonb('tags').$type<string[]>().default([]),
  lastResearchedAt: timestamp('last_researched_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('comp_tenant_idx').on(table.tenantId),
  ventureIdx: index('comp_venture_idx').on(table.tenantId, table.ventureId),
  threatIdx: index('comp_threat_idx').on(table.tenantId, table.threatLevel),
}));

// ── SWOT Analyses ─────────────────────────────────────────────

export const swotAnalyses = pgTable('swot_analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  ventureId: uuid('venture_id').notNull(),
  strengths: jsonb('strengths').$type<SWOTItem[]>().default([]),
  weaknesses: jsonb('weaknesses').$type<SWOTItem[]>().default([]),
  opportunities: jsonb('opportunities').$type<SWOTItem[]>().default([]),
  threats: jsonb('threats').$type<SWOTItem[]>().default([]),
  strategicImplications: text('strategic_implications').notNull(),
  analyzedBy: uuid('analyzed_by').notNull(),
  analyzedAt: timestamp('analyzed_at').defaultNow().notNull(),
  nextReviewDate: timestamp('next_review_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('swot_tenant_idx').on(table.tenantId),
  ventureIdx: index('swot_venture_idx').on(table.tenantId, table.ventureId),
}));

// ── Competitor Intelligence ───────────────────────────────────

export const competitorIntelligence = pgTable('competitor_intelligence', {
  id: uuid('id').defaultRandom().primaryKey(),
  competitorId: uuid('competitor_id').notNull().references(() => competitors.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull(),
  source: text('source').notNull(), // 'news' | 'product_update' | 'hiring' | etc.
  title: text('title').notNull(),
  content: text('content').notNull(),
  url: text('url'),
  impactAssessment: text('impact_assessment'),
  discoveredAt: timestamp('discovered_at').defaultNow().notNull(),
  addedBy: uuid('added_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  competitorIdx: index('ci_competitor_idx').on(table.competitorId),
  tenantIdx: index('ci_tenant_idx').on(table.tenantId),
}));

// ── Market Analyses ───────────────────────────────────────────

export const marketAnalyses = pgTable('market_analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  ventureId: uuid('venture_id').notNull(),
  name: text('name').notNull(),
  marketName: text('market_name').notNull(),
  version: integer('version').default(1).notNull(),
  sizing: jsonb('sizing').$type<TAMSAMSOMEstimate>().notNull(),
  segments: jsonb('segments').$type<MarketSegment[]>().default([]),
  growthProjections: jsonb('growth_projections').$type<GrowthProjection[]>().default([]),
  trends: jsonb('trends').$type<MarketTrend[]>().default([]),
  sources: jsonb('sources').$type<MarketResearchSource[]>().default([]),
  assumptions: jsonb('assumptions').$type<string[]>().default([]),
  confidence: text('confidence').default('medium').notNull(),
  analyzedAt: timestamp('analyzed_at').defaultNow().notNull(),
  nextReviewDate: timestamp('next_review_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('ma_tenant_idx').on(table.tenantId),
  ventureIdx: index('ma_venture_idx').on(table.tenantId, table.ventureId),
}));
```

### Venture Scoring & Investment Thesis Tables

```typescript
// ── Scoring Rubrics ───────────────────────────────────────────

export const scoringRubrics = pgTable('scoring_rubrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  weights: jsonb('weights').$type<ScoreWeight[]>().notNull(),
  dimensionDescriptions: jsonb('dimension_descriptions').notNull(),
  isDefault: integer('is_default').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('sr_tenant_idx').on(table.tenantId),
}));

// ── Venture Scores ────────────────────────────────────────────

export const ventureScores = pgTable('venture_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  ventureId: uuid('venture_id').notNull(),
  periodId: text('period_id').notNull(),
  rubricId: uuid('rubric_id').references(() => scoringRubrics.id),
  dimensions: jsonb('dimensions').$type<ScoringDimensionResult[]>().notNull(),
  compositeScore: real('composite_score').notNull(),
  portfolioPercentile: real('portfolio_percentile'),
  trend: text('trend').notNull(), // 'improving' | 'stable' | 'declining'
  scoreChange: real('score_change').default(0).notNull(),
  healthIndicators: jsonb('health_indicators').$type<HealthIndicator[]>().default([]),
  manualAdjustment: real('manual_adjustment'),
  adjustmentReason: text('adjustment_reason'),
  scoredBy: uuid('scored_by').notNull(),
  scoredAt: timestamp('scored_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('vs_tenant_idx').on(table.tenantId),
  ventureIdx: index('vs_venture_idx').on(table.tenantId, table.ventureId),
  periodIdx: index('vs_period_idx').on(table.tenantId, table.periodId),
  compositeIdx: index('vs_composite_idx').on(table.tenantId, table.compositeScore),
  uniqueVenturePeriod: uniqueIndex('vs_venture_period_uniq').on(
    table.tenantId,
    table.ventureId,
    table.periodId,
  ),
}));

// ── Investment Theses ─────────────────────────────────────────

export const investmentTheses = pgTable('investment_theses', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  ventureId: uuid('venture_id').notNull(),
  version: integer('version').default(1).notNull(),
  statement: text('statement').notNull(),
  narrative: text('narrative').notNull(),
  hypotheses: jsonb('hypotheses').$type<ThesisHypothesis[]>().default([]),
  rationale: jsonb('rationale').$type<InvestmentRationale>().notNull(),
  killCriteria: jsonb('kill_criteria').$type<string[]>().default([]),
  capitalAllocated: real('capital_allocated').default(0).notNull(),
  capitalDeployed: real('capital_deployed').default(0).notNull(),
  targetMultiple: real('target_multiple'),
  targetTimelineMonths: integer('target_timeline_months'),
  status: text('status').default('active').notNull(),
  evolution: jsonb('evolution').$type<ThesisEvolution[]>().default([]),
  establishedAt: timestamp('established_at').defaultNow().notNull(),
  nextReviewDate: timestamp('next_review_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('it_tenant_idx').on(table.tenantId),
  ventureIdx: index('it_venture_idx').on(table.tenantId, table.ventureId),
  statusIdx: index('it_status_idx').on(table.tenantId, table.status),
}));
```

### Roadmap & Board Reporting Tables

```typescript
// ── Roadmap Items ─────────────────────────────────────────────

export const roadmapItems = pgTable('roadmap_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  ventureId: uuid('venture_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  priority: text('priority').default('medium').notNull(),
  phase: text('phase').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: text('status').default('planned').notNull(),
  completionPercent: integer('completion_percent').default(0).notNull(),
  ownerId: uuid('owner_id').notNull(),
  linkedOkrIds: jsonb('linked_okr_ids').$type<string[]>().default([]),
  tags: jsonb('tags').$type<string[]>().default([]),
  riskLevel: text('risk_level').default('low').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('ri_tenant_idx').on(table.tenantId),
  ventureIdx: index('ri_venture_idx').on(table.tenantId, table.ventureId),
  statusIdx: index('ri_status_idx').on(table.tenantId, table.status),
  dateIdx: index('ri_date_idx').on(table.startDate, table.endDate),
  priorityIdx: index('ri_priority_idx').on(table.tenantId, table.priority),
}));

// ── Roadmap Milestones ────────────────────────────────────────

export const roadmapMilestones = pgTable('roadmap_milestones', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  ventureId: uuid('venture_id'),
  name: text('name').notNull(),
  description: text('description').notNull(),
  targetDate: timestamp('target_date').notNull(),
  actualDate: timestamp('actual_date'),
  status: text('status').default('upcoming').notNull(),
  linkedItemIds: jsonb('linked_item_ids').$type<string[]>().default([]),
  successCriteria: jsonb('success_criteria').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('rm_tenant_idx').on(table.tenantId),
  statusIdx: index('rm_status_idx').on(table.tenantId, table.status),
  dateIdx: index('rm_date_idx').on(table.targetDate),
}));

// ── Roadmap Dependencies ──────────────────────────────────────

export const roadmapDependencies = pgTable('roadmap_dependencies', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  predecessorId: uuid('predecessor_id').notNull().references(() => roadmapItems.id, { onDelete: 'cascade' }),
  successorId: uuid('successor_id').notNull().references(() => roadmapItems.id, { onDelete: 'cascade' }),
  type: text('type').default('finish_to_start').notNull(),
  lagDays: integer('lag_days').default(0).notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('rd_tenant_idx').on(table.tenantId),
  predecessorIdx: index('rd_predecessor_idx').on(table.predecessorId),
  successorIdx: index('rd_successor_idx').on(table.successorId),
}));

// ── Resource Allocations ──────────────────────────────────────

export const resourceAllocations = pgTable('resource_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  roadmapItemId: uuid('roadmap_item_id').notNull().references(() => roadmapItems.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull(),
  resourceType: text('resource_type').notNull(),
  amount: real('amount').notNull(),
  unit: text('unit').notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('ra_tenant_idx').on(table.tenantId),
  itemIdx: index('ra_item_idx').on(table.roadmapItemId),
  ventureIdx: index('ra_venture_idx').on(table.tenantId, table.ventureId),
}));

// ── Board Reports ─────────────────────────────────────────────

export const boardReports = pgTable('board_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  title: text('title').notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  reportType: text('report_type').default('quarterly').notNull(),
  executiveSummary: text('executive_summary').notNull(),
  sections: jsonb('sections').$type<BoardReportSection[]>().default([]),
  kpiDashboard: jsonb('kpi_dashboard').$type<KPIDashboard>().notNull(),
  decisionsRequired: jsonb('decisions_required').$type<string[]>().default([]),
  status: text('status').default('draft').notNull(),
  generatedBy: uuid('generated_by').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  boardMeetingId: uuid('board_meeting_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('br_tenant_idx').on(table.tenantId),
  statusIdx: index('br_status_idx').on(table.tenantId, table.status),
  periodIdx: index('br_period_idx').on(table.periodStart, table.periodEnd),
}));

// ── Board Decision Logs ───────────────────────────────────────

export const boardDecisionLogs = pgTable('board_decision_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  decision: text('decision').notNull(),
  context: text('context').notNull(),
  rationale: text('rationale').notNull(),
  decidedBy: jsonb('decided_by').$type<string[]>().notNull(),
  decidedAt: timestamp('decided_at').notNull(),
  impactArea: text('impact_area').notNull(),
  ventureId: uuid('venture_id'),
  followUpActions: jsonb('follow_up_actions').$type<Array<{
    action: string;
    ownerId: string;
    dueDate: string;
    status: string;
  }>>().default([]),
  boardMeetingId: uuid('board_meeting_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('bdl_tenant_idx').on(table.tenantId),
  ventureIdx: index('bdl_venture_idx').on(table.tenantId, table.ventureId),
  dateIdx: index('bdl_date_idx').on(table.decidedAt),
}));
```

### M&A & Pivot Management Tables

```typescript
// ── M&A Targets ───────────────────────────────────────────────

export const mandaTargets = pgTable('manda_targets', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  ventureId: uuid('venture_id').notNull(),
  companyName: text('company_name').notNull(),
  description: text('description').notNull(),
  url: text('url'),
  strategicRationale: text('strategic_rationale').notNull(),
  stage: text('stage').default('identified').notNull(),
  valuation: jsonb('valuation').$type<MandAValuation | null>(),
  synergies: jsonb('synergies').$type<SynergyEstimate[]>().default([]),
  contacts: jsonb('contacts').$type<Array<{
    name: string;
    role: string;
    email: string | null;
    notes: string | null;
  }>>().default([]),
  dealLeadId: uuid('deal_lead_id').notNull(),
  priority: text('priority').default('medium').notNull(),
  status: text('status').default('active').notNull(),
  identifiedAt: timestamp('identified_at').defaultNow().notNull(),
  firstContactAt: timestamp('first_contact_at'),
  loiSignedAt: timestamp('loi_signed_at'),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('mt_tenant_idx').on(table.tenantId),
  ventureIdx: index('mt_venture_idx').on(table.tenantId, table.ventureId),
  stageIdx: index('mt_stage_idx').on(table.tenantId, table.stage),
  statusIdx: index('mt_status_idx').on(table.tenantId, table.status),
}));

// ── Due Diligence Items ───────────────────────────────────────

export const dueDiligenceItems = pgTable('due_diligence_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  targetId: uuid('target_id').notNull().references(() => mandaTargets.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').default('pending').notNull(),
  assigneeId: uuid('assignee_id'),
  findings: text('findings'),
  riskLevel: text('risk_level').default('none').notNull(),
  documents: jsonb('documents').$type<string[]>().default([]),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('ddi_tenant_idx').on(table.tenantId),
  targetIdx: index('ddi_target_idx').on(table.targetId),
  statusIdx: index('ddi_status_idx').on(table.targetId, table.status),
  categoryIdx: index('ddi_category_idx').on(table.targetId, table.category),
}));

// ── Integration Plans ─────────────────────────────────────────

export const integrationPlans = pgTable('integration_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  targetId: uuid('target_id').notNull().references(() => mandaTargets.id, { onDelete: 'cascade' }),
  phases: jsonb('phases').notNull(),
  keyDecisions: jsonb('key_decisions').$type<string[]>().default([]),
  riskMitigations: jsonb('risk_mitigations').$type<string[]>().default([]),
  communicationPlan: text('communication_plan').notNull(),
  status: text('status').default('planning').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('ip_tenant_idx').on(table.tenantId),
  targetIdx: index('ip_target_idx').on(table.targetId),
}));

// ── Pivot Records ─────────────────────────────────────────────

export const pivotRecords = pgTable('pivot_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  ventureId: uuid('venture_id').notNull(),
  pivotType: text('pivot_type').notNull(),
  trigger: jsonb('trigger').$type<PivotTrigger>().notNull(),
  beforeAfter: jsonb('before_after').$type<BeforeAfterSnapshot>().notNull(),
  rationale: text('rationale').notNull(),
  proposedBy: uuid('proposed_by').notNull(),
  approvedBy: uuid('approved_by'),
  resourceImpact: jsonb('resource_impact').$type<{
    budgetChange: number;
    headcountChange: number;
    timelineExtension: number;
  }>().notNull(),
  status: text('status').default('proposed').notNull(),
  outcome: jsonb('outcome').$type<PivotOutcome | null>(),
  proposedAt: timestamp('proposed_at').defaultNow().notNull(),
  approvedAt: timestamp('approved_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('pr_tenant_idx').on(table.tenantId),
  ventureIdx: index('pr_venture_idx').on(table.tenantId, table.ventureId),
  statusIdx: index('pr_status_idx').on(table.tenantId, table.status),
}));

// ── Lessons Learned ───────────────────────────────────────────

export const lessonsLearned = pgTable('lessons_learned', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  pivotId: uuid('pivot_id').references(() => pivotRecords.id),
  ventureId: uuid('venture_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  applicableTo: text('applicable_to').default('all_ventures').notNull(),
  recommendations: jsonb('recommendations').$type<string[]>().default([]),
  documentedBy: uuid('documented_by').notNull(),
  documentedAt: timestamp('documented_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('ll_tenant_idx').on(table.tenantId),
  ventureIdx: index('ll_venture_idx').on(table.tenantId, table.ventureId),
  pivotIdx: index('ll_pivot_idx').on(table.pivotId),
  categoryIdx: index('ll_category_idx').on(table.tenantId, table.category),
}));
```

---

## Code Examples

### Example 1: Setting and Cascading OKRs

```typescript
import { StrategyService } from '@mcv/portfolio/strategy';

/**
 * Create a consortium-level OKR and cascade it to venture and team levels.
 * This demonstrates the three-tier OKR hierarchy.
 */
async function setupQ1OKRs(strategy: StrategyService) {
  // 1. Create the OKR period
  const period = await strategy.createOKRPeriod({
    name: '2026 Q1',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-03-31'),
  });

  // 2. Create a consortium-level OKR
  const consortiumOkr = await strategy.createOKR({
    periodId: period.id,
    objective: 'Achieve $2M portfolio ARR with 3+ ventures generating revenue',
    description: 'Drive the portfolio toward sustainable revenue across multiple ventures, reducing concentration risk.',
    level: 'consortium',
    ventureId: null,
    teamId: null,
    parentOkrId: null,
    ownerId: 'user_ceo_001',
    keyResults: [
      {
        title: 'Total portfolio ARR',
        metricType: 'currency',
        startValue: 850_000,
        targetValue: 2_000_000,
        unit: 'USD',
        ownerId: 'user_cfo_001',
      },
      {
        title: 'Number of revenue-generating ventures',
        metricType: 'number',
        startValue: 2,
        targetValue: 3,
        unit: 'ventures',
        ownerId: 'user_ceo_001',
      },
      {
        title: 'Average venture health score',
        metricType: 'number',
        startValue: 62,
        targetValue: 75,
        unit: 'score',
        ownerId: 'user_ops_001',
      },
    ],
  });

  console.log(`Consortium OKR created: ${consortiumOkr.id}`);

  // 3. Create a venture-level OKR that cascades from the consortium OKR
  const ventureOkr = await strategy.createOKR({
    periodId: period.id,
    objective: 'Scale Venture Alpha to $500K ARR with 85% gross margin',
    description: 'Drive Venture Alpha to be a significant revenue contributor to the portfolio.',
    level: 'venture',
    ventureId: 'venture_alpha_001',
    teamId: null,
    parentOkrId: consortiumOkr.id, // ← Cascading alignment
    ownerId: 'user_vp_alpha_001',
    keyResults: [
      {
        title: 'Venture Alpha ARR',
        metricType: 'currency',
        startValue: 200_000,
        targetValue: 500_000,
        unit: 'USD',
        ownerId: 'user_vp_alpha_001',
      },
      {
        title: 'Gross margin',
        metricType: 'percentage',
        startValue: 72,
        targetValue: 85,
        unit: '%',
        ownerId: 'user_finance_alpha_001',
      },
      {
        title: 'Customer retention rate',
        metricType: 'percentage',
        startValue: 88,
        targetValue: 95,
        unit: '%',
        ownerId: 'user_cs_alpha_001',
      },
    ],
  });

  // 4. Create a team-level OKR under the venture OKR
  const teamOkr = await strategy.createOKR({
    periodId: period.id,
    objective: 'Grow enterprise pipeline to support $500K ARR target',
    level: 'team',
    ventureId: 'venture_alpha_001',
    teamId: 'team_sales_alpha_001',
    parentOkrId: ventureOkr.id,
    ownerId: 'user_sales_lead_001',
    keyResults: [
      {
        title: 'Qualified pipeline value',
        metricType: 'currency',
        startValue: 150_000,
        targetValue: 800_000,
        unit: 'USD',
        ownerId: 'user_sales_lead_001',
      },
      {
        title: 'Enterprise deals closed',
        metricType: 'number',
        startValue: 0,
        targetValue: 5,
        unit: 'deals',
        ownerId: 'user_ae_001',
      },
    ],
  });

  // 5. View the full cascade
  const cascade = await strategy.getOKRTree({
    periodId: period.id,
    level: 'consortium',
  });

  console.log(`Portfolio OKR cascade:
    - Total objectives: ${cascade.totalObjectives}
    - Total key results: ${cascade.totalKeyResults}
    - Alignment health: ${(cascade.alignmentHealth * 100).toFixed(1)}%
  `);

  // 6. Update a key result with a check-in
  await strategy.updateKeyResult(ventureOkr.keyResults[0].id, {
    currentValue: 280_000,
    confidence: 0.7,
    note: 'Closed two new enterprise deals this month. Pipeline looking strong for Feb.',
  });

  // The OKR service automatically recalculates:
  // - Key result progress: (280k - 200k) / (500k - 200k) = 26.7%
  // - Parent OKR progress (weighted average of key results)
  // - Consortium OKR alignment score based on child progress

  return { consortiumOkr, ventureOkr, teamOkr };
}
```

### Example 2: Scoring and Ranking Ventures

```typescript
import { StrategyService } from '@mcv/portfolio/strategy';

/**
 * Score all ventures in the portfolio and generate rankings.
 * Demonstrates the venture scoring framework with 10 dimensions.
 */
async function scoreAndRankPortfolio(strategy: StrategyService) {
  // 1. Score individual ventures
  const alphaScore = await strategy.scoreVenture('venture_alpha_001', {
    periodId: '2026-Q1',
    dimensions: [
      {
        dimension: 'market_opportunity',
        score: 82,
        evidence: 'TAM of $4.2B with 18% CAGR. Strong product-market fit signals from customer interviews.',
        dataPoints: { tam: 4_200_000_000, cagr: 0.18, pmfScore: 4.2 },
      },
      {
        dimension: 'product_maturity',
        score: 68,
        evidence: 'Core product stable, but enterprise features (SSO, audit logging) still in development.',
        dataPoints: { featureCompleteness: 0.72, techDebt: 'medium', uptime: 99.8 },
      },
      {
        dimension: 'team_strength',
        score: 75,
        evidence: 'Strong founding team with domain expertise. Need to hire VP Engineering.',
        dataPoints: { headcount: 12, keyHires: 1, retention: 0.92 },
      },
      {
        dimension: 'financial_health',
        score: 61,
        evidence: 'ARR growing but burn rate high. 14 months runway at current pace.',
        dataPoints: { arr: 280_000, burnRate: 85_000, runway: 14 },
      },
      {
        dimension: 'growth_trajectory',
        score: 79,
        evidence: 'MoM revenue growth of 12%. Accelerating from 8% last quarter.',
        dataPoints: { momGrowth: 0.12, qoqGrowth: 0.38, yoyGrowth: 2.1 },
      },
      {
        dimension: 'competitive_position',
        score: 70,
        evidence: 'Top 3 in the segment. Differentiated on UX but losing ground on integrations.',
        dataPoints: { marketRank: 3, nps: 52, churnRate: 0.05 },
      },
      {
        dimension: 'strategic_alignment',
        score: 90,
        evidence: 'Directly supports consortium thesis of AI-native vertical SaaS.',
        dataPoints: { alignmentScore: 0.92 },
      },
      {
        dimension: 'execution_velocity',
        score: 73,
        evidence: 'Shipping bi-weekly. Roadmap adherence at 78%.',
        dataPoints: { deployFrequency: 'biweekly', roadmapAdherence: 0.78, cycleTime: 4.2 },
      },
      {
        dimension: 'customer_traction',
        score: 77,
        evidence: '45 paying customers, 3 enterprise. Pipeline suggests 60+ by end of quarter.',
        dataPoints: { customers: 45, enterprise: 3, pipeline: 15, acv: 6_222 },
      },
      {
        dimension: 'technical_moat',
        score: 65,
        evidence: 'Proprietary ML models show 15% accuracy advantage over competitors, but not patented.',
        dataPoints: { patents: 0, proprietaryTech: true, switchingCost: 'medium' },
      },
    ],
  });

  console.log(`Venture Alpha composite score: ${alphaScore.compositeScore}`);
  console.log(`Trend: ${alphaScore.trend}`);
  console.log(`Health indicators:`);
  alphaScore.healthIndicators.forEach((h) => {
    console.log(`  [${h.category}] ${h.dimension}: ${h.message}`);
  });

  // 2. Repeat for other ventures (simplified)
  await strategy.scoreVenture('venture_beta_001', {
    periodId: '2026-Q1',
    dimensions: [
      { dimension: 'market_opportunity', score: 90, evidence: '...', dataPoints: {} },
      { dimension: 'product_maturity', score: 45, evidence: '...', dataPoints: {} },
      { dimension: 'team_strength', score: 80, evidence: '...', dataPoints: {} },
      { dimension: 'financial_health', score: 40, evidence: '...', dataPoints: {} },
      { dimension: 'growth_trajectory', score: 55, evidence: '...', dataPoints: {} },
      { dimension: 'competitive_position', score: 60, evidence: '...', dataPoints: {} },
      { dimension: 'strategic_alignment', score: 85, evidence: '...', dataPoints: {} },
      { dimension: 'execution_velocity', score: 50, evidence: '...', dataPoints: {} },
      { dimension: 'customer_traction', score: 35, evidence: '...', dataPoints: {} },
      { dimension: 'technical_moat', score: 72, evidence: '...', dataPoints: {} },
    ],
  });

  // 3. Rank the entire portfolio
  const rankings = await strategy.rankPortfolio({
    periodId: '2026-Q1',
    // Optional: override weights for scenario planning
    // weightOverrides: { market_opportunity: 0.20, financial_health: 0.15, ... }
  });

  console.log('\n📊 Portfolio Rankings (2026 Q1):');
  console.log('─'.repeat(70));
  rankings.forEach((r) => {
    const trendIcon = r.trend === 'improving' ? '📈' : r.trend === 'declining' ? '📉' : '➡️';
    console.log(
      `  #${r.rank} ${r.ventureName} — ${r.compositeScore.toFixed(1)} ${trendIcon}`
    );
    console.log(
      `     💪 ${r.topStrength}  |  ⚠️ ${r.topWeakness}`
    );
    if (r.alerts.length > 0) {
      console.log(`     🚨 ${r.alerts.join(', ')}`);
    }
  });

  // 4. Get score history for trend analysis
  const history = await strategy.getScoreHistory('venture_alpha_001', {
    periods: ['2025-Q3', '2025-Q4', '2026-Q1'],
  });

  console.log('\nVenture Alpha Score Trend:');
  history.scores.forEach((s) => {
    console.log(`  ${s.periodId}: ${s.compositeScore.toFixed(1)}`);
  });

  return rankings;
}
```

### Example 3: Competitive Analysis and SWOT

```typescript
import { StrategyService } from '@mcv/portfolio/strategy';

/**
 * Track competitors and generate a SWOT analysis for a venture.
 * Demonstrates the competitive intelligence workflow.
 */
async function runCompetitiveAnalysis(strategy: StrategyService) {
  const ventureId = 'venture_alpha_001';

  // 1. Add competitor profiles
  const competitor1 = await strategy.upsertCompetitor({
    ventureId,
    name: 'CompetitorX',
    url: 'https://competitorx.com',
    description: 'Incumbent player in the vertical SaaS space. Well-funded, slow to innovate.',
    fundingInfo: 'Series C — $45M raised',
    employeeRange: '200-500',
    keyFeatures: [
      'Enterprise SSO',
      'Advanced reporting',
      'API marketplace',
      'White-label options',
      'Legacy system integrations',
    ],
    pricingModel: 'Per-seat pricing, $49-199/seat/month, annual contracts',
    strengths: [
      'Large existing customer base (2,000+)',
      'Deep integrations with legacy systems',
      'Established brand in the vertical',
      'Enterprise-grade compliance (SOC2, HIPAA)',
    ],
    weaknesses: [
      'Slow product development cycle (quarterly releases)',
      'Poor mobile experience',
      'High customer support ticket volume',
      'Technical debt in core platform',
      'No AI/ML capabilities',
    ],
    threatLevel: 4,
    estimatedMarketShare: 0.25,
    tags: ['incumbent', 'enterprise', 'vertical-saas'],
  });

  const competitor2 = await strategy.upsertCompetitor({
    ventureId,
    name: 'NimbleStartup',
    url: 'https://nimble.io',
    description: 'Fast-moving startup targeting the same segment with an AI-first approach.',
    fundingInfo: 'Seed — $3M raised',
    employeeRange: '10-25',
    keyFeatures: [
      'AI-powered automation',
      'Modern UX',
      'Real-time collaboration',
      'API-first architecture',
    ],
    pricingModel: 'Usage-based pricing, starts at $29/month',
    strengths: [
      'Modern tech stack',
      'Strong AI capabilities',
      'Excellent developer experience',
      'Fast iteration speed',
    ],
    weaknesses: [
      'Small team — execution risk',
      'No enterprise features (SSO, audit)',
      'Limited funding runway',
      'Brand unknown in the vertical',
    ],
    threatLevel: 3,
    estimatedMarketShare: 0.02,
    tags: ['startup', 'ai-first', 'disruptor'],
  });

  // 2. Log competitive intelligence
  await strategy.addCompetitorIntelligence(competitor1.id, {
    source: 'news',
    title: 'CompetitorX announces layoffs, restructuring engineering team',
    content: 'CompetitorX laid off 15% of engineering staff as part of a cost-reduction initiative. Product roadmap reportedly delayed by 2 quarters.',
    url: 'https://techcrunch.com/2026/01/15/competitorx-layoffs',
    impactAssessment: 'Positive for us — their product velocity will decrease. Window of opportunity to capture enterprise accounts during transition.',
  });

  await strategy.addCompetitorIntelligence(competitor2.id, {
    source: 'funding',
    title: 'NimbleStartup raises $12M Series A led by Tier-1 VC',
    content: 'NimbleStartup closed a $12M Series A. Plans to triple engineering team and launch enterprise tier by Q3.',
    url: 'https://nimble.io/blog/series-a',
    impactAssessment: 'Threat escalation — they will be more competitive in 6 months. We need to accelerate our AI roadmap.',
  });

  // 3. Generate a SWOT analysis
  const swot = await strategy.generateSWOT(ventureId, {
    includeCompetitors: [competitor1.id, competitor2.id],
    includeMarketData: true,
    mode: 'comprehensive',
  });

  console.log('🔍 SWOT Analysis for Venture Alpha:');
  console.log('\n✅ STRENGTHS:');
  swot.strengths.forEach((s) => {
    console.log(`  [${s.impact}] ${s.text}`);
  });
  console.log('\n⚠️ WEAKNESSES:');
  swot.weaknesses.forEach((w) => {
    console.log(`  [${w.impact}] ${w.text}`);
  });
  console.log('\n🚀 OPPORTUNITIES:');
  swot.opportunities.forEach((o) => {
    console.log(`  [${o.impact}] ${o.text}`);
  });
  console.log('\n🔥 THREATS:');
  swot.threats.forEach((t) => {
    console.log(`  [${t.impact}] ${t.text}`);
  });
  console.log(`\n📋 Strategic Implications:\n  ${swot.strategicImplications}`);

  // 4. Build positioning map
  const positionMap = await strategy.buildPositioningMap(ventureId);

  console.log(`\nPositioning Map (${positionMap.positioning.axes.x.label} vs ${positionMap.positioning.axes.y.label}):`);
  positionMap.positioning.positions.forEach((p) => {
    const icon = p.entityType === 'venture' ? '⭐' : '🔴';
    console.log(`  ${icon} ${p.entityName}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) size=${p.bubbleSize}`);
  });

  return { swot, positionMap };
}
```

### Example 4: Strategic Roadmap Planning

```typescript
import { StrategyService } from '@mcv/portfolio/strategy';

/**
 * Build a strategic roadmap with items, milestones, dependencies,
 * and resource allocations across ventures.
 */
async function planStrategicRoadmap(strategy: StrategyService) {
  // 1. Create roadmap items for a venture
  const alphaItem1 = await strategy.createRoadmapItem({
    ventureId: 'venture_alpha_001',
    title: 'Launch Enterprise Tier with SSO and Audit Logging',
    description: 'Ship enterprise-grade features to unlock $50K+ ACV deals.',
    category: 'product',
    priority: 'critical',
    phase: 'build',
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-03-15'),
    ownerId: 'user_vp_eng_001',
    linkedOkrIds: ['okr_alpha_revenue_001'],
    tags: ['enterprise', 'security', 'compliance'],
    riskLevel: 'medium',
  });

  const alphaItem2 = await strategy.createRoadmapItem({
    ventureId: 'venture_alpha_001',
    title: 'Hire VP Engineering',
    description: 'Critical leadership hire to scale the engineering team from 5 to 12.',
    category: 'people',
    priority: 'high',
    phase: 'discovery',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-02-28'),
    ownerId: 'user_ceo_alpha_001',
    linkedOkrIds: ['okr_alpha_team_001'],
    tags: ['hiring', 'leadership'],
    riskLevel: 'high',
  });

  const alphaItem3 = await strategy.createRoadmapItem({
    ventureId: 'venture_alpha_001',
    title: 'Scale Go-To-Market Motion for Enterprise Segment',
    description: 'Build outbound sales process, hire 2 AEs, establish enterprise sales playbook.',
    category: 'growth',
    priority: 'high',
    phase: 'build',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-04-30'),
    ownerId: 'user_vp_sales_001',
    linkedOkrIds: ['okr_alpha_pipeline_001'],
    tags: ['sales', 'enterprise', 'gtm'],
    riskLevel: 'medium',
  });

  // 2. Add dependencies between items
  // The GTM scaling depends on the enterprise tier being ready
  await strategy.addRoadmapDependency({
    predecessorId: alphaItem1.id,
    successorId: alphaItem3.id,
    type: 'finish_to_start',
    lagDays: 0, // GTM can start immediately after enterprise tier ships
  });

  // 3. Add milestones
  const entMilestone = await strategy.createRoadmapMilestone({
    ventureId: 'venture_alpha_001',
    name: 'Enterprise Tier GA Launch',
    description: 'Enterprise features generally available to all customers.',
    targetDate: new Date('2026-03-15'),
    linkedItemIds: [alphaItem1.id],
    successCriteria: [
      'SSO integration tested with 3+ IdPs (Okta, Azure AD, Google)',
      'Audit logging captures all data mutations with 30-day retention',
      'SOC2 Type II audit initiated',
      'Enterprise pricing page live',
      'First 2 enterprise beta customers onboarded',
    ],
  });

  // 4. Allocate resources
  await strategy.allocateResources({
    allocations: [
      {
        roadmapItemId: alphaItem1.id,
        ventureId: 'venture_alpha_001',
        resourceType: 'headcount',
        amount: 3,
        unit: 'FTEs',
        periodStart: new Date('2026-01-15'),
        periodEnd: new Date('2026-03-15'),
        notes: '2 backend engineers + 1 security specialist',
      },
      {
        roadmapItemId: alphaItem1.id,
        ventureId: 'venture_alpha_001',
        resourceType: 'budget',
        amount: 45_000,
        unit: 'USD',
        periodStart: new Date('2026-01-15'),
        periodEnd: new Date('2026-03-15'),
        notes: 'Third-party security audit + IdP integration costs',
      },
      {
        roadmapItemId: alphaItem2.id,
        ventureId: 'venture_alpha_001',
        resourceType: 'budget',
        amount: 25_000,
        unit: 'USD',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-02-28'),
        notes: 'Recruiting fees + hiring pipeline tools',
      },
      {
        roadmapItemId: alphaItem3.id,
        ventureId: 'venture_alpha_001',
        resourceType: 'budget',
        amount: 120_000,
        unit: 'USD',
        periodStart: new Date('2026-02-01'),
        periodEnd: new Date('2026-04-30'),
        notes: '2 AE salaries (3 months) + sales tooling + collateral',
      },
    ],
  });

  // 5.