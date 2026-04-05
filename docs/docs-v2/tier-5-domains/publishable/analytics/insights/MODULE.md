# @mcv/analytics/insights

> **Tier 5 Domain Module — Publishable**
>
> AI-powered analytics insights: automated discovery of patterns, anomalies, and opportunities in venture data.

---

## Purpose

The `@mcv/analytics/insights` module is the intelligent layer that sits on top of raw metrics and transforms data into actionable knowledge. Rather than requiring founders and operators to manually monitor dashboards and detect meaningful changes, this module continuously analyzes metric streams and surfaces the insights that matter.

At its core, the module answers three questions every operator asks:
1. **What happened?** — Anomaly detection identifies unusual metric changes (spikes, drops, trend breaks) and scores their severity.
2. **Why did it happen?** — Root cause analysis decomposes metric changes into contributing factors, isolating the dimensions and segments driving the change.
3. **What should I do about it?** — Recommendations engine produces actionable, prioritized suggestions with estimated impact values.

The module integrates with `@mcv/intelligence` for LLM-powered natural language generation, turning structured insight objects into human-readable summaries suitable for feeds, notifications, and reports. It consumes metric data from `@mcv/analytics/metrics` and produces a chronological insight feed that can be filtered by venture, category, severity, and metric type.

### Key Capabilities

- **Anomaly Detection** — Statistical and ML-based detection of unusual metric behavior with configurable sensitivity and severity scoring across multiple detection algorithms (Z-score, IQR, isolation forest, seasonal decomposition).
- **Trend Analysis** — Identification of emerging trends, seasonal patterns, cyclical behavior, and growth/decline trajectories with confidence intervals and projected trajectories.
- **Root Cause Analysis** — Automatic decomposition of metric changes into contributing factors across dimensions (channel, segment, geography, device, etc.) with attribution percentages.
- **Opportunity Scoring** — Identification of high-impact optimization opportunities with estimated monetary value, effort scores, and confidence levels.
- **Natural Language Insights** — LLM-generated human-readable insight summaries, explanations, and narratives via `@mcv/intelligence`.
- **Alert Rules** — Configurable alert definitions that trigger when insights match specified criteria (severity thresholds, categories, metric patterns, custom predicates).
- **Insight Feed** — Chronological feed of discovered insights with rich filtering, grouping, deduplication, and pagination.
- **Recommendations** — Actionable recommendations derived from insights, ranked by estimated impact and feasibility.

---

## Exports

```typescript
// ── Core Service ─────────────────────────────────────────────
export { InsightService }              from './service/insight-service';
export { InsightEngine }               from './engine/insight-engine';
export { InsightScheduler }            from './scheduler/insight-scheduler';

// ── Anomaly Detection ────────────────────────────────────────
export { AnomalyDetector }             from './detection/anomaly-detector';
export { ZScoreDetector }              from './detection/algorithms/z-score';
export { IQRDetector }                 from './detection/algorithms/iqr';
export { IsolationForestDetector }     from './detection/algorithms/isolation-forest';
export { SeasonalDetector }            from './detection/algorithms/seasonal';
export { EnsembleDetector }            from './detection/algorithms/ensemble';

// ── Trend Analysis ───────────────────────────────────────────
export { TrendAnalyzer }               from './trends/trend-analyzer';
export { SeasonalDecomposer }          from './trends/seasonal-decomposer';
export { GrowthClassifier }            from './trends/growth-classifier';
export { ForecastProjector }           from './trends/forecast-projector';

// ── Root Cause Analysis ──────────────────────────────────────
export { RootCauseAnalyzer }           from './rca/root-cause-analyzer';
export { DimensionDecomposer }         from './rca/dimension-decomposer';
export { ContributionCalculator }      from './rca/contribution-calculator';
export { CausalGraph }                 from './rca/causal-graph';

// ── Opportunity & Recommendations ────────────────────────────
export { OpportunityScorer }           from './opportunities/opportunity-scorer';
export { RecommendationEngine }        from './recommendations/recommendation-engine';
export { ImpactEstimator }             from './recommendations/impact-estimator';

// ── Natural Language ─────────────────────────────────────────
export { InsightNarrator }             from './narration/insight-narrator';
export { SummaryGenerator }            from './narration/summary-generator';
export { DigestComposer }              from './narration/digest-composer';

// ── Alert Rules ──────────────────────────────────────────────
export { AlertRuleEngine }             from './alerts/alert-rule-engine';
export { AlertEvaluator }              from './alerts/alert-evaluator';
export { AlertNotifier }               from './alerts/alert-notifier';

// ── Feed ─────────────────────────────────────────────────────
export { InsightFeed }                 from './feed/insight-feed';
export { InsightAggregator }           from './feed/insight-aggregator';
export { InsightDeduplicator }         from './feed/insight-deduplicator';

// ── tRPC Router ──────────────────────────────────────────────
export { insightsRouter }              from './router';

// ── Types ────────────────────────────────────────────────────
export type {
  Insight,
  InsightType,
  InsightSeverity,
  InsightCategory,
  InsightStatus,
  AnomalyInsight,
  TrendInsight,
  RootCauseInsight,
  OpportunityInsight,
  Recommendation,
  RecommendationType,
  RecommendationPriority,
  AlertRule,
  AlertRuleCondition,
  AlertTrigger,
  InsightFeedQuery,
  InsightFeedResult,
  InsightDigest,
  DetectionAlgorithm,
  DetectionConfig,
  TrendDirection,
  TrendClassification,
  SeasonalPattern,
  ContributingFactor,
  DimensionBreakdown,
  OpportunityScore,
  ImpactEstimate,
  InsightNarrative,
  InsightEngineConfig,
  InsightScheduleConfig,
} from './types';

// ── Schemas ──────────────────────────────────────────────────
export {
  insightSchema,
  alertRuleSchema,
  insightFeedQuerySchema,
  recommendationSchema,
  detectionConfigSchema,
} from './schemas';

// ── Errors ───────────────────────────────────────────────────
export {
  InsightError,
  InsightNotFoundError,
  DetectionFailedError,
  AnalysisTimeoutError,
  InsufficientDataError,
  AlertRuleValidationError,
  NarrationFailedError,
  RootCauseDepthExceededError,
  OpportunityScoringError,
  FeedQueryError,
  InsightRateLimitError,
  DuplicateInsightError,
  SchedulerConflictError,
} from './errors';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         @mcv/analytics/insights                             │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        InsightScheduler                              │   │
│  │  Cron-driven orchestrator that triggers analysis runs per venture    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │   │
│  │  │ Hourly   │  │ Daily    │  │ Weekly   │  │ On-Demand        │    │   │
│  │  │ Scan     │  │ Digest   │  │ Report   │  │ (API triggered)  │    │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘    │   │
│  │       └──────────────┴──────────────┴─────────────────┘              │   │
│  └───────────────────────────────┬──────────────────────────────────────┘   │
│                                  │                                          │
│  ┌───────────────────────────────▼──────────────────────────────────────┐   │
│  │                         InsightEngine                                │   │
│  │  Core orchestrator that coordinates all analysis pipelines           │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────┐  │   │
│  │  │  Anomaly    │  │   Trend      │  │  Root Cause │  │Opportunity│  │   │
│  │  │  Detector   │  │   Analyzer   │  │  Analyzer   │  │  Scorer  │  │   │
│  │  │             │  │              │  │             │  │          │  │   │
│  │  │ ┌─────────┐│  │ ┌──────────┐ │  │ ┌─────────┐│  │ ┌──────┐ │  │   │
│  │  │ │Z-Score  ││  │ │Seasonal  │ │  │ │Dimension││  │ │Impact│ │  │   │
│  │  │ │IQR     ││  │ │Growth    │ │  │ │Decompose││  │ │Estim.│ │  │   │
│  │  │ │Isolation││  │ │Forecast  │ │  │ │Causal   ││  │ │Rank  │ │  │   │
│  │  │ │Seasonal ││  │ │Classify  │ │  │ │Graph    ││  │ │Score │ │  │   │
│  │  │ │Ensemble ││  │ └──────────┘ │  │ └─────────┘│  │ └──────┘ │  │   │
│  │  │ └─────────┘│  └──────────────┘  └─────────────┘  └──────────┘  │   │
│  │  └─────────────┘                                                    │   │
│  └───────────────────────────────┬──────────────────────────────────────┘   │
│                                  │                                          │
│          ┌───────────────────────┼───────────────────────┐                  │
│          │                       │                       │                  │
│  ┌───────▼────────┐  ┌──────────▼──────────┐  ┌────────▼──────────┐       │
│  │  Insight Feed   │  │  Recommendation     │  │  Alert Rule       │       │
│  │                 │  │  Engine              │  │  Engine           │       │
│  │ ┌─────────────┐│  │                      │  │                   │       │
│  │ │Deduplicator ││  │ ┌──────────────────┐ │  │ ┌───────────────┐ │       │
│  │ │Aggregator   ││  │ │ Impact Estimator │ │  │ │ Evaluator     │ │       │
│  │ │Filter/Sort  ││  │ │ Priority Ranker  │ │  │ │ Notifier      │ │       │
│  │ └─────────────┘│  │ └──────────────────┘ │  │ └───────────────┘ │       │
│  └────────────────┘  └─────────────────────┘  └───────────────────┘       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                       InsightNarrator                                │   │
│  │  LLM-powered natural language generation via @mcv/intelligence       │   │
│  │  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │   │
│  │  │ Summary Gen    │  │ Digest Composer  │  │ Explanation Gen    │   │   │
│  │  └────────────────┘  └──────────────────┘  └────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        InsightService (tRPC)                         │   │
│  │  Public API surface — all client-facing operations                   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ getFeed  │ │ getById  │ │ dismiss  │ │ bookmark │ │ feedback │  │   │
│  │  │ search   │ │ digest   │ │ alerts   │ │ export   │ │ reanalyze│  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

External Dependencies:
  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐
  │ @mcv/analytics/      │  │ @mcv/intelligence    │  │ Supabase        │
  │ metrics              │  │                      │  │ PostgreSQL      │
  │                      │  │ LLM orchestration    │  │                 │
  │ Raw metric data,     │  │ for natural language  │  │ Insight storage │
  │ time series,         │  │ insight generation    │  │ Alert rules     │
  │ aggregations         │  │ and summaries         │  │ Recommendations │
  └──────────────────────┘  └──────────────────────┘  └─────────────────┘
```

### Data Flow

```
Metric Data (from @mcv/analytics/metrics)
    │
    ▼
┌─────────────────────┐
│  InsightScheduler   │──── Triggers analysis on schedule or on-demand
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  InsightEngine      │──── Runs all analysis pipelines in parallel
└─────────┬───────────┘
          │
    ┌─────┼──────┬──────────┬──────────┐
    │     │      │          │          │
    ▼     ▼      ▼          ▼          ▼
  Anomaly Trend  Root     Opportunity  ...
  Detect  Analyze Cause   Score
    │     │      │          │          │
    └─────┼──────┴──────────┴──────────┘
          │
          ▼
┌─────────────────────┐
│  Deduplication &    │──── Remove duplicate/overlapping insights
│  Aggregation        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  InsightNarrator    │──── Generate natural language via @mcv/intelligence
└─────────┬───────────┘
          │
    ┌─────┼──────────────┐
    │     │              │
    ▼     ▼              ▼
  Store  Alert          Recommendation
  in DB  Evaluation     Generation
          │              │
          ▼              ▼
        Notify         Store & Surface
        (if match)     in Feed
```

---

## Core Interfaces

### InsightService

The primary service facade that all tRPC routes delegate to. Coordinates between the engine, feed, alerts, and recommendations subsystems.

```typescript
import { type SupabaseClient } from '@supabase/supabase-js';
import { type IntelligenceClient } from '@mcv/intelligence';
import { type MetricsClient } from '@mcv/analytics/metrics';

/**
 * InsightService — main entry point for all insight operations.
 *
 * Orchestrates analysis runs, manages the insight feed, handles alert
 * rules, and surfaces recommendations. All methods are venture-scoped
 * and enforce row-level security through the Supabase client.
 */
export class InsightService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly intelligence: IntelligenceClient,
    private readonly metrics: MetricsClient,
    private readonly config: InsightServiceConfig,
  ) {}

  // ── Analysis ───────────────────────────────────────────────

  /**
   * Run a full insight analysis for a venture. Executes all enabled
   * detection pipelines (anomaly, trend, RCA, opportunity) against
   * the specified time range and metric set.
   */
  async analyzeVenture(
    ventureId: string,
    options?: AnalysisOptions,
  ): Promise<AnalysisResult>;

  /**
   * Run analysis for a single metric. Useful for on-demand deep-dives
   * when a user notices something and wants the system to investigate.
   */
  async analyzeMetric(
    ventureId: string,
    metricId: string,
    options?: MetricAnalysisOptions,
  ): Promise<MetricAnalysisResult> ;

  /**
   * Re-analyze an existing insight with updated parameters or
   * additional context. Useful when an insight seems stale or
   * the user provides domain knowledge.
   */
  async reanalyzeInsight(
    insightId: string,
    context?: ReanalysisContext,
  ): Promise<Insight>;

  // ── Feed ───────────────────────────────────────────────────

  /**
   * Query the insight feed with filtering, sorting, and pagination.
   * The feed is the primary UI surface for insights.
   */
  async getFeed(
    ventureId: string,
    query: InsightFeedQuery,
  ): Promise<InsightFeedResult>;

  /**
   * Get a single insight by ID with full detail, including
   * related insights, recommendations, and narrative.
   */
  async getInsightById(
    insightId: string,
  ): Promise<InsightDetail | null>;

  /**
   * Search insights using full-text search across narratives,
   * metric names, and dimension values.
   */
  async searchInsights(
    ventureId: string,
    query: string,
    options?: SearchOptions,
  ): Promise<InsightSearchResult>;

  /**
   * Get a digest summary for a time period. Aggregates insights
   * into a structured digest with LLM-generated narrative.
   */
  async getDigest(
    ventureId: string,
    period: DigestPeriod,
    options?: DigestOptions,
  ): Promise<InsightDigest>;

  // ── Insight Actions ────────────────────────────────────────

  /**
   * Dismiss an insight. Dismissed insights are hidden from the
   * default feed but remain queryable. Dismissal trains the
   * relevance model over time.
   */
  async dismissInsight(
    insightId: string,
    reason?: DismissReason,
  ): Promise<void>;

  /**
   * Bookmark an insight for later reference. Bookmarked insights
   * appear in a dedicated section and are never auto-archived.
   */
  async bookmarkInsight(
    insightId: string,
    note?: string,
  ): Promise<void>;

  /**
   * Provide feedback on an insight (helpful, not helpful, inaccurate).
   * Feedback is used to improve detection accuracy over time.
   */
  async provideFeedback(
    insightId: string,
    feedback: InsightFeedback,
  ): Promise<void>;

  /**
   * Mark an insight as resolved/acted-upon. Tracks which insights
   * led to actual changes.
   */
  async resolveInsight(
    insightId: string,
    resolution: InsightResolution,
  ): Promise<void>;

  // ── Alert Rules ────────────────────────────────────────────

  /**
   * Create a new alert rule. When future insights match the rule's
   * conditions, notifications are triggered.
   */
  async createAlertRule(
    ventureId: string,
    rule: CreateAlertRuleInput,
  ): Promise<AlertRule>;

  /**
   * Update an existing alert rule.
   */
  async updateAlertRule(
    ruleId: string,
    updates: UpdateAlertRuleInput,
  ): Promise<AlertRule>;

  /**
   * Delete an alert rule.
   */
  async deleteAlertRule(ruleId: string): Promise<void>;

  /**
   * List all alert rules for a venture.
   */
  async listAlertRules(
    ventureId: string,
    options?: ListAlertRulesOptions,
  ): Promise<AlertRule[]>;

  /**
   * Get alert history — past triggers and their outcomes.
   */
  async getAlertHistory(
    ventureId: string,
    options?: AlertHistoryOptions,
  ): Promise<AlertTrigger[]>;

  // ── Recommendations ────────────────────────────────────────

  /**
   * Get active recommendations for a venture, ranked by
   * estimated impact and feasibility.
   */
  async getRecommendations(
    ventureId: string,
    options?: RecommendationOptions,
  ): Promise<Recommendation[]>;

  /**
   * Accept a recommendation, marking it as in-progress.
   * Can optionally create a task/action item.
   */
  async acceptRecommendation(
    recommendationId: string,
    options?: AcceptOptions,
  ): Promise<void>;

  /**
   * Dismiss a recommendation with a reason.
   */
  async dismissRecommendation(
    recommendationId: string,
    reason: string,
  ): Promise<void>;

  // ── Export ─────────────────────────────────────────────────

  /**
   * Export insights for a venture in various formats.
   */
  async exportInsights(
    ventureId: string,
    format: ExportFormat,
    options?: ExportOptions,
  ): Promise<ExportResult>;
}

interface InsightServiceConfig {
  /** Maximum concurrent analysis pipelines per venture */
  maxConcurrentPipelines: number;
  /** Default lookback window for analysis */
  defaultLookbackDays: number;
  /** Enable/disable specific detection algorithms */
  enabledAlgorithms: DetectionAlgorithm[];
  /** Minimum data points required before analysis runs */
  minimumDataPoints: number;
  /** LLM model to use for narration */
  narrationModel: string;
  /** Maximum insights per analysis run (prevents flood) */
  maxInsightsPerRun: number;
  /** Deduplication window in hours */
  deduplicationWindowHours: number;
  /** Enable opportunity scoring (computationally expensive) */
  enableOpportunityScoring: boolean;
}
```

### Insight Types

```typescript
/**
 * The core Insight type — represents a single discovered insight
 * about a venture's data. All insight subtypes extend this base.
 */
export interface Insight {
  /** Unique identifier */
  id: string;
  /** Venture this insight belongs to */
  ventureId: string;
  /** Type discriminator */
  type: InsightType;
  /** Severity level (how important/urgent) */
  severity: InsightSeverity;
  /** Category for filtering */
  category: InsightCategory;
  /** Current status */
  status: InsightStatus;
  /** The metric(s) this insight relates to */
  metricIds: string[];
  /** Primary metric name for display */
  primaryMetricName: string;
  /** Short title (generated) */
  title: string;
  /** Detailed narrative (LLM-generated) */
  narrative: string;
  /** Structured data specific to the insight type */
  data: AnomalyData | TrendData | RootCauseData | OpportunityData;
  /** Related recommendations */
  recommendations: Recommendation[];
  /** IDs of related/similar insights */
  relatedInsightIds: string[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Impact score (0-100) for ranking */
  impactScore: number;
  /** Time range the insight covers */
  timeRange: {
    start: Date;
    end: Date;
  };
  /** When the insight was discovered */
  discoveredAt: Date;
  /** When the insight was last updated */
  updatedAt: Date;
  /** When the insight expires (auto-archive) */
  expiresAt: Date | null;
  /** User interactions */
  interactions: {
    dismissed: boolean;
    dismissedAt: Date | null;
    dismissedReason: string | null;
    bookmarked: boolean;
    bookmarkedAt: Date | null;
    bookmarkNote: string | null;
    resolved: boolean;
    resolvedAt: Date | null;
    resolution: string | null;
    feedbackScore: number | null;
    feedbackComment: string | null;
  };
  /** Analysis metadata */
  metadata: {
    analysisRunId: string;
    algorithmUsed: string;
    processingTimeMs: number;
    dataPointsAnalyzed: number;
    modelVersion: string;
  };
}

export type InsightType =
  | 'anomaly'
  | 'trend'
  | 'root_cause'
  | 'opportunity'
  | 'correlation'
  | 'forecast'
  | 'benchmark';

export type InsightSeverity =
  | 'critical'   // Requires immediate attention
  | 'high'       // Important, review soon
  | 'medium'     // Notable, review when convenient
  | 'low'        // Informational
  | 'info';      // Background context

export type InsightCategory =
  | 'revenue'
  | 'growth'
  | 'engagement'
  | 'retention'
  | 'acquisition'
  | 'conversion'
  | 'performance'
  | 'cost'
  | 'churn'
  | 'product'
  | 'marketing'
  | 'operational';

export type InsightStatus =
  | 'active'      // Currently relevant
  | 'dismissed'   // User dismissed
  | 'resolved'    // User acted on it
  | 'expired'     // No longer relevant
  | 'superseded'  // Replaced by newer insight
  | 'archived';   // Auto-archived after expiry
```

### Anomaly Detection

```typescript
/**
 * Anomaly-specific data attached to an anomaly insight.
 */
export interface AnomalyData {
  /** Type of anomaly detected */
  anomalyType: AnomalyType;
  /** The metric value that triggered the anomaly */
  observedValue: number;
  /** What the expected value was */
  expectedValue: number;
  /** The expected range (lower, upper) */
  expectedRange: {
    lower: number;
    upper: number;
  };
  /** How many standard deviations from expected */
  deviationScore: number;
  /** Direction of the anomaly */
  direction: 'spike' | 'drop' | 'shift' | 'volatility';
  /** Duration of the anomaly (if sustained) */
  duration: {
    start: Date;
    end: Date | null;  // null if ongoing
    dataPoints: number;
  };
  /** Detection algorithm that identified this */
  algorithm: DetectionAlgorithm;
  /** Historical context */
  historicalContext: {
    previousOccurrences: number;
    lastOccurrence: Date | null;
    baselinePeriod: { start: Date; end: Date };
    baselineMean: number;
    baselineStdDev: number;
  };
  /** Dimensions where the anomaly is concentrated */
  affectedDimensions: DimensionAnomaly[];
}

export type AnomalyType =
  | 'point'       // Single data point anomaly
  | 'contextual'  // Anomalous given the context (e.g., weekday vs weekend)
  | 'collective'  // Group of data points are anomalous together
  | 'seasonal'    // Deviation from seasonal pattern
  | 'trend_break' // Sudden change in trend direction
  | 'level_shift'; // Permanent shift in baseline level

export type DetectionAlgorithm =
  | 'z_score'
  | 'modified_z_score'
  | 'iqr'
  | 'isolation_forest'
  | 'seasonal_decomposition'
  | 'prophet'
  | 'ensemble'
  | 'custom';

export interface DimensionAnomaly {
  /** Dimension name (e.g., "channel", "country") */
  dimension: string;
  /** Specific value (e.g., "organic", "US") */
  value: string;
  /** Contribution to the overall anomaly (0-1) */
  contribution: number;
  /** Whether this dimension alone would trigger the anomaly */
  isDriverDimension: boolean;
}

/**
 * Configuration for anomaly detection behavior.
 */
export interface DetectionConfig {
  /** Which algorithms to run */
  algorithms: DetectionAlgorithm[];
  /** Sensitivity level (higher = more anomalies detected) */
  sensitivity: 'low' | 'medium' | 'high' | 'custom';
  /** Custom Z-score threshold (when sensitivity is 'custom') */
  customThreshold?: number;
  /** Minimum number of data points for analysis */
  minimumDataPoints: number;
  /** Lookback window for baseline calculation */
  baselineDays: number;
  /** Whether to account for seasonality */
  seasonalAdjustment: boolean;
  /** Seasonal period (e.g., 7 for weekly, 30 for monthly) */
  seasonalPeriod?: number;
  /** Dimensions to analyze for drill-down */
  dimensions?: string[];
  /** Metrics to exclude from detection */
  excludeMetrics?: string[];
  /** Custom detection rules per metric */
  metricOverrides?: Record<string, Partial<DetectionConfig>>;
}

/**
 * AnomalyDetector — runs detection algorithms against metric data.
 */
export class AnomalyDetector {
  constructor(
    private readonly metrics: MetricsClient,
    private readonly config: DetectionConfig,
  ) {}

  /**
   * Detect anomalies in a metric's time series data.
   * Runs all configured algorithms and returns a merged result set.
   */
  async detect(
    ventureId: string,
    metricId: string,
    timeRange: TimeRange,
  ): Promise<AnomalyResult[]>;

  /**
   * Detect anomalies across all metrics for a venture.
   * Parallelizes detection and handles rate limiting.
   */
  async detectAll(
    ventureId: string,
    timeRange: TimeRange,
    options?: DetectAllOptions,
  ): Promise<Map<string, AnomalyResult[]>>;

  /**
   * Evaluate a single data point against the baseline.
   * Used for real-time/streaming anomaly detection.
   */
  async evaluatePoint(
    ventureId: string,
    metricId: string,
    value: number,
    timestamp: Date,
  ): Promise<PointEvaluation>;
}

interface AnomalyResult {
  metricId: string;
  anomaly: AnomalyData;
  severity: InsightSeverity;
  confidence: number;
  rawScores: Record<DetectionAlgorithm, number>;
}

interface PointEvaluation {
  isAnomaly: boolean;
  severity: InsightSeverity | null;
  score: number;
  expectedRange: { lower: number; upper: number };
  algorithms: Record<DetectionAlgorithm, {
    isAnomaly: boolean;
    score: number;
  }>;
}
```

### Trend Analysis

```typescript
/**
 * Trend-specific data attached to a trend insight.
 */
export interface TrendData {
  /** Direction of the trend */
  direction: TrendDirection;
  /** Classification of the trend pattern */
  classification: TrendClassification;
  /** Trend strength (0-1, where 1 is perfectly linear) */
  strength: number;
  /** Rate of change (per day) */
  rateOfChange: number;
  /** Rate of change as percentage */
  rateOfChangePercent: number;
  /** When the trend started */
  trendStart: Date;
  /** When the trend is projected to end (if applicable) */
  projectedEnd: Date | null;
  /** Seasonal patterns detected */
  seasonalPatterns: SeasonalPattern[];
  /** Forecast for the next period */
  forecast: ForecastPoint[];
  /** Comparison to historical trends */
  historicalComparison: {
    percentileRank: number;
    similarPeriods: SimilarPeriod[];
  };
  /** Statistical details */
  statistics: {
    r_squared: number;
    p_value: number;
    slope: number;
    intercept: number;
    residualStdDev: number;
  };
}

export type TrendDirection =
  | 'accelerating_growth'
  | 'linear_growth'
  | 'decelerating_growth'
  | 'stable'
  | 'decelerating_decline'
  | 'linear_decline'
  | 'accelerating_decline'
  | 'volatile';

export type TrendClassification =
  | 'exponential_growth'
  | 'linear_growth'
  | 'logarithmic_growth'
  | 'plateau'
  | 'cyclical'
  | 'seasonal'
  | 'linear_decline'
  | 'exponential_decline'
  | 'recovery'
  | 'disruption'
  | 'step_change';

export interface SeasonalPattern {
  /** Period of the pattern (e.g., 7 = weekly) */
  period: number;
  /** Human-readable period name */
  periodName: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  /** Strength of the seasonal signal (0-1) */
  strength: number;
  /** Peak timing within the period */
  peakOffset: number;
  /** Trough timing within the period */
  troughOffset: number;
  /** Amplitude (peak-to-trough range) */
  amplitude: number;
}

export interface ForecastPoint {
  /** Timestamp of the forecast */
  timestamp: Date;
  /** Predicted value */
  predicted: number;
  /** Confidence interval */
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;  // e.g., 0.95 for 95%
  };
}

export interface SimilarPeriod {
  /** Start of the similar historical period */
  start: Date;
  /** End of the similar period */
  end: Date;
  /** Similarity score (0-1) */
  similarity: number;
  /** What happened after this period (for context) */
  outcome: string;
}

/**
 * TrendAnalyzer — identifies and classifies trends in metric data.
 */
export class TrendAnalyzer {
  constructor(
    private readonly metrics: MetricsClient,
    private readonly config: TrendAnalysisConfig,
  ) {}

  /**
   * Analyze trends for a single metric over a time range.
   * Returns trend classification, direction, and forecast.
   */
  async analyzeTrend(
    ventureId: string,
    metricId: string,
    timeRange: TimeRange,
  ): Promise<TrendResult>;

  /**
   * Detect seasonal patterns in a metric's history.
   * Requires at least 2 full cycles of data.
   */
  async detectSeasonality(
    ventureId: string,
    metricId: string,
    options?: SeasonalityOptions,
  ): Promise<SeasonalPattern[]>;

  /**
   * Generate a forecast for a metric based on historical trends
   * and seasonal patterns.
   */
  async forecast(
    ventureId: string,
    metricId: string,
    horizonDays: number,
    options?: ForecastOptions,
  ): Promise<ForecastPoint[]>;

  /**
   * Find historical periods that resemble the current pattern.
   * Useful for "this happened before" context.
   */
  async findSimilarPeriods(
    ventureId: string,
    metricId: string,
    currentPattern: TimeRange,
    options?: SimilarPeriodOptions,
  ): Promise<SimilarPeriod[]>;

  /**
   * Classify the growth stage of a metric (early growth,
   * acceleration, maturity, decline, etc.).
   */
  async classifyGrowthStage(
    ventureId: string,
    metricId: string,
  ): Promise<GrowthClassification>;
}

interface TrendAnalysisConfig {
  /** Minimum data points for trend detection */
  minimumDataPoints: number;
  /** Confidence level for forecasts */
  forecastConfidenceLevel: number;
  /** Maximum forecast horizon in days */
  maxForecastHorizonDays: number;
  /** Whether to decompose into trend + seasonal + residual */
  decompose: boolean;
  /** Minimum R² to report a trend */
  minimumR2: number;
  /** Growth classification thresholds */
  growthThresholds: {
    accelerating: number;
    linear: number;
    decelerating: number;
  };
}

interface TrendResult {
  metricId: string;
  trend: TrendData;
  severity: InsightSeverity;
  confidence: number;
  isSignificant: boolean;
}

interface GrowthClassification {
  stage: 'nascent' | 'early_growth' | 'acceleration' | 'maturity' | 'saturation' | 'decline' | 'revival';
  confidence: number;
  transitionLikelihood: Record<string, number>;
  timeInCurrentStage: number;  // days
}
```

### Root Cause Analysis

```typescript
/**
 * Root cause data attached to a root_cause insight.
 * Produced when a significant metric change is detected
 * and the system decomposes it into contributing factors.
 */
export interface RootCauseData {
  /** The metric that changed */
  targetMetric: {
    id: string;
    name: string;
    previousValue: number;
    currentValue: number;
    changePercent: number;
    changePeriod: { start: Date; end: Date };
  };
  /** Contributing factors ranked by impact */
  factors: ContributingFactor[];
  /** Dimension breakdowns showing where the change is concentrated */
  dimensionBreakdowns: DimensionBreakdown[];
  /** Causal chain (if determinable) */
  causalChain: CausalLink[];
  /** Total attribution coverage (how much of the change is explained) */
  totalAttribution: number;
  /** Unexplained portion of the change */
  unexplainedPortion: number;
  /** Analysis depth reached */
  depth: number;
  /** Maximum depth allowed */
  maxDepth: number;
}

export interface ContributingFactor {
  /** Unique identifier for this factor */
  id: string;
  /** Human-readable description of the factor */
  description: string;
  /** The dimension this factor belongs to */
  dimension: string;
  /** The specific value within the dimension */
  dimensionValue: string;
  /** Absolute contribution to the change */
  absoluteContribution: number;
  /** Percentage of total change explained by this factor */
  relativeContribution: number;
  /** Direction of this factor's influence */
  direction: 'positive' | 'negative' | 'neutral';
  /** Confidence in this attribution (0-1) */
  confidence: number;
  /** Whether this factor was expected (seasonal, known event) */
  isExpected: boolean;
  /** Additional context about this factor */
  context: string | null;
  /** Sub-factors (recursive decomposition) */
  subFactors: ContributingFactor[];
}

export interface DimensionBreakdown {
  /** Dimension name */
  dimension: string;
  /** Total values in this dimension */
  totalValues: number;
  /** Values that contributed to the change */
  contributingValues: number;
  /** Breakdown by value */
  values: Array<{
    value: string;
    previousMetric: number;
    currentMetric: number;
    changePercent: number;
    contribution: number;
    isSignificant: boolean;
  }>;
  /** Concentration score (1 = all change in one value, 0 = evenly spread) */
  concentration: number;
}

export interface CausalLink {
  /** Source factor/event */
  source: string;
  /** Target factor/metric affected */
  target: string;
  /** Strength of the causal relationship (0-1) */
  strength: number;
  /** Time lag between cause and effect */
  lagDays: number;
  /** Whether this is a known/modeled relationship or inferred */
  type: 'modeled' | 'inferred' | 'user_defined';
  /** Evidence supporting this link */
  evidence: string;
}

/**
 * RootCauseAnalyzer — decomposes metric changes into contributing factors.
 */
export class RootCauseAnalyzer {
  constructor(
    private readonly metrics: MetricsClient,
    private readonly intelligence: IntelligenceClient,
    private readonly config: RootCauseConfig,
  ) {}

  /**
   * Analyze root causes for a metric change. Decomposes the change
   * across all available dimensions and identifies the primary
   * contributing factors.
   */
  async analyze(
    ventureId: string,
    metricId: string,
    changePeriod: TimeRange,
    baselinePeriod: TimeRange,
  ): Promise<RootCauseResult>;

  /**
   * Decompose a change along a specific dimension.
   * Shows how each value in the dimension contributed.
   */
  async decomposeByDimension(
    ventureId: string,
    metricId: string,
    dimension: string,
    changePeriod: TimeRange,
    baselinePeriod: TimeRange,
  ): Promise<DimensionBreakdown>;

  /**
   * Build a causal graph for a set of metrics.
   * Uses Granger causality tests and known relationships
   * to construct a directed graph of influences.
   */
  async buildCausalGraph(
    ventureId: string,
    metricIds: string[],
    timeRange: TimeRange,
  ): Promise<CausalGraph>;

  /**
   * Given a set of anomalies, find the most likely root cause
   * by tracing through the causal graph.
   */
  async traceRootCause(
    ventureId: string,
    anomalyInsightId: string,
    options?: TraceOptions,
  ): Promise<RootCauseData>;
}

interface RootCauseConfig {
  /** Maximum decomposition depth */
  maxDepth: number;
  /** Minimum contribution threshold to report a factor */
  minimumContribution: number;
  /** Maximum factors to return per analysis */
  maxFactors: number;
  /** Dimensions to decompose by (or 'all') */
  dimensions: string[] | 'all';
  /** Whether to build causal graph */
  enableCausalAnalysis: boolean;
  /** Granger causality significance level */
  causalitySignificanceLevel: number;
  /** Maximum lag to test for causality (days) */
  maxCausalLagDays: number;
  /** Whether to use LLM for factor interpretation */
  enableLLMInterpretation: boolean;
}

interface RootCauseResult {
  rootCause: RootCauseData;
  severity: InsightSeverity;
  confidence: number;
  processingTimeMs: number;
}
```

### Recommendations

```typescript
/**
 * A recommendation — an actionable suggestion derived from insights.
 */
export interface Recommendation {
  /** Unique identifier */
  id: string;
  /** Venture this belongs to */
  ventureId: string;
  /** The insight(s) that generated this recommendation */
  sourceInsightIds: string[];
  /** Type of recommendation */
  type: RecommendationType;
  /** Priority level */
  priority: RecommendationPriority;
  /** Short action-oriented title */
  title: string;
  /** Detailed description of what to do and why */
  description: string;
  /** Specific steps to implement */
  steps: RecommendationStep[];
  /** Estimated impact */
  impact: ImpactEstimate;
  /** Estimated effort to implement */
  effort: EffortEstimate;
  /** ROI score (impact / effort, normalized 0-100) */
  roiScore: number;
  /** Confidence in the recommendation (0-1) */
  confidence: number;
  /** Time sensitivity — when this should be acted on */
  urgency: 'immediate' | 'this_week' | 'this_month' | 'when_convenient';
  /** Current status */
  status: RecommendationStatus;
  /** Category tag for filtering */
  category: InsightCategory;
  /** Related metrics */
  metricIds: string[];
  /** When this was generated */
  createdAt: Date;
  /** When this expires (no longer relevant) */
  expiresAt: Date | null;
  /** User interaction tracking */
  interaction: {
    accepted: boolean;
    acceptedAt: Date | null;
    dismissed: boolean;
    dismissedAt: Date | null;
    dismissedReason: string | null;
    completedAt: Date | null;
    outcomeNotes: string | null;
  };
}

export type RecommendationType =
  | 'increase_spend'
  | 'decrease_spend'
  | 'reallocate_budget'
  | 'fix_churn'
  | 'optimize_conversion'
  | 'investigate_anomaly'
  | 'capitalize_trend'
  | 'adjust_pricing'
  | 'improve_retention'
  | 'expand_segment'
  | 'reduce_cost'
  | 'test_hypothesis'
  | 'monitor_metric'
  | 'update_target'
  | 'custom';

export type RecommendationPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export type RecommendationStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'dismissed'
  | 'expired';

export interface RecommendationStep {
  /** Step number */
  order: number;
  /** What to do */
  action: string;
  /** Additional detail */
  detail: string | null;
  /** Estimated time for this step */
  estimatedMinutes: number | null;
  /** Whether this step can be automated */
  automatable: boolean;
}

export interface ImpactEstimate {
  /** Primary metric affected */
  metricName: string;
  /** Estimated change in the metric */
  estimatedChange: number;
  /** Estimated change as percentage */
  estimatedChangePercent: number;
  /** Estimated monetary value (if applicable) */
  estimatedMonetaryValue: number | null;
  /** Currency for monetary estimate */
  currency: string | null;
  /** Confidence interval for the estimate */
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
  /** Time to realize the impact */
  timeToImpactDays: number;
  /** Model/method used for estimation */
  estimationMethod: string;
}

export interface EffortEstimate {
  /** Effort level */
  level: 'trivial' | 'low' | 'medium' | 'high' | 'very_high';
  /** Estimated person-hours */
  estimatedHours: number;
  /** Required skills/roles */
  requiredSkills: string[];
  /** Whether external resources are needed */
  needsExternalResources: boolean;
  /** Complexity score (1-10) */
  complexityScore: number;
}

/**
 * RecommendationEngine — generates recommendations from insights.
 */
export class RecommendationEngine {
  constructor(
    private readonly intelligence: IntelligenceClient,
    private readonly config: RecommendationConfig,
  ) {}

  /**
   * Generate recommendations from a set of insights.
   * Uses rule-based logic and LLM augmentation.
   */
  async generateRecommendations(
    ventureId: string,
    insights: Insight[],
    context?: VentureContext,
  ): Promise<Recommendation[]>;

  /**
   * Re-rank recommendations based on current context
   * (e.g., new insights, user feedback, time sensitivity).
   */
  async rerankRecommendations(
    recommendations: Recommendation[],
    context: RerankContext,
  ): Promise<Recommendation[]>;

  /**
   * Estimate the impact of a specific action on a metric.
   * Uses historical data and causal models.
   */
  async estimateImpact(
    ventureId: string,
    action: ProposedAction,
    targetMetricId: string,
  ): Promise<ImpactEstimate>;

  /**
   * Validate a recommendation is still relevant given
   * current data. Used for periodic refresh.
   */
  async validateRecommendation(
    recommendation: Recommendation,
  ): Promise<ValidationResult>;
}

interface RecommendationConfig {
  /** Maximum recommendations per insight */
  maxPerInsight: number;
  /** Maximum total active recommendations per venture */
  maxActivePerVenture: number;
  /** Minimum ROI score to surface a recommendation */
  minimumROIScore: number;
  /** Whether to use LLM for recommendation generation */
  enableLLMGeneration: boolean;
  /** Recommendation expiry (days) */
  defaultExpiryDays: number;
  /** Whether to auto-dismiss low-priority expired recommendations */
  autoDismissExpired: boolean;
}
```

### Alert Rules

```typescript
/**
 * Alert rule — triggers notifications when insights match conditions.
 */
export interface AlertRule {
  /** Unique identifier */
  id: string;
  /** Venture this rule belongs to */
  ventureId: string;
  /** Human-readable name */
  name: string;
  /** Description of what this rule watches for */
  description: string;
  /** Whether the rule is currently active */
  enabled: boolean;
  /** Conditions that must all be met to trigger */
  conditions: AlertRuleCondition[];
  /** How conditions are combined */
  conditionLogic: 'all' | 'any';
  /** Notification channels */
  notifications: AlertNotification[];
  /** Cooldown period after trigger (prevent spam) */
  cooldownMinutes: number;
  /** Maximum triggers per day */
  maxTriggersPerDay: number;
  /** When the rule was created */
  createdAt: Date;
  /** Last time this rule triggered */
  lastTriggeredAt: Date | null;
  /** Total trigger count */
  triggerCount: number;
  /** Created by user */
  createdBy: string;
}

export interface AlertRuleCondition {
  /** What field to evaluate */
  field: AlertConditionField;
  /** Comparison operator */
  operator: AlertConditionOperator;
  /** Value to compare against */
  value: string | number | string[];
}

export type AlertConditionField =
  | 'insight.type'
  | 'insight.severity'
  | 'insight.category'
  | 'insight.confidence'
  | 'insight.impactScore'
  | 'insight.metricName'
  | 'anomaly.direction'
  | 'anomaly.deviationScore'
  | 'trend.direction'
  | 'trend.rateOfChangePercent'
  | 'recommendation.priority'
  | 'recommendation.roiScore'
  | 'recommendation.type';

export type AlertConditionOperator =
  | 'eq'         // equals
  | 'neq'        // not equals
  | 'gt'         // greater than
  | 'gte'        // greater than or equal
  | 'lt'         // less than
  | 'lte'        // less than or equal
  | 'in'         // value in array
  | 'not_in'     // value not in array
  | 'contains'   // string contains
  | 'matches';   // regex match

export interface AlertNotification {
  /** Channel type */
  channel: 'email' | 'slack' | 'webhook' | 'in_app' | 'sms';
  /** Channel-specific target (email address, Slack channel, URL) */
  target: string;
  /** Whether to include full insight detail in the notification */
  includeDetail: boolean;
  /** Custom message template (supports variables) */
  messageTemplate?: string;
}

export interface AlertTrigger {
  /** Unique identifier */
  id: string;
  /** Rule that triggered */
  ruleId: string;
  /** Insight that matched the rule */
  insightId: string;
  /** When the trigger fired */
  triggeredAt: Date;
  /** Notification delivery status */
  notifications: Array<{
    channel: string;
    target: string;
    status: 'sent' | 'failed' | 'pending';
    sentAt: Date | null;
    error: string | null;
  }>;
  /** Whether the user acknowledged the alert */
  acknowledged: boolean;
  /** When acknowledged */
  acknowledgedAt: Date | null;
}

/**
 * AlertRuleEngine — evaluates insights against alert rules.
 */
export class AlertRuleEngine {
  constructor(
    private readonly db: SupabaseClient,
    private readonly notifier: AlertNotifier,
  ) {}

  /**
   * Evaluate a newly discovered insight against all active
   * alert rules for the venture. Triggers notifications for
   * any matching rules.
   */
  async evaluate(
    insight: Insight,
  ): Promise<AlertTrigger[]>;

  /**
   * Evaluate an insight against a specific rule.
   * Used for testing rules before enabling.
   */
  async evaluateRule(
    insight: Insight,
    rule: AlertRule,
  ): Promise<{ matches: boolean; details: ConditionEvaluation[] }>;

  /**
   * Test a rule against historical insights to estimate
   * trigger frequency.
   */
  async testRule(
    ventureId: string,
    rule: CreateAlertRuleInput,
    lookbackDays: number,
  ): Promise<RuleTestResult>;
}

interface ConditionEvaluation {
  condition: AlertRuleCondition;
  matched: boolean;
  actualValue: string | number | null;
  explanation: string;
}

interface RuleTestResult {
  wouldHaveTriggered: number;
  matchingInsights: Array<{
    insightId: string;
    title: string;
    discoveredAt: Date;
  }>;
  estimatedTriggersPerWeek: number;
}
```

### Insight Feed

```typescript
/**
 * Query parameters for the insight feed.
 */
export interface InsightFeedQuery {
  /** Filter by insight types */
  types?: InsightType[];
  /** Filter by severity levels */
  severities?: InsightSeverity[];
  /** Filter by categories */
  categories?: InsightCategory[];
  /** Filter by status */
  statuses?: InsightStatus[];
  /** Filter by specific metric IDs */
  metricIds?: string[];
  /** Filter by minimum confidence */
  minConfidence?: number;
  /** Filter by minimum impact score */
  minImpactScore?: number;
  /** Filter by time range */
  timeRange?: {
    start: Date;
    end: Date;
  };
  /** Full-text search query */
  search?: string;
  /** Sort field */
  sortBy?: 'discoveredAt' | 'severity' | 'impactScore' | 'confidence';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Pagination cursor */
  cursor?: string;
  /** Page size */
  limit?: number;
  /** Whether to include dismissed insights */
  includeDismissed?: boolean;
  /** Whether to include resolved insights */
  includeResolved?: boolean;
  /** Group by field */
  groupBy?: 'category' | 'type' | 'severity' | 'metric';
}

export interface InsightFeedResult {
  /** The insights */
  insights: Insight[];
  /** Total count matching the query (without pagination) */
  totalCount: number;
  /** Next page cursor */
  nextCursor: string | null;
  /** Whether there are more results */
  hasMore: boolean;
  /** Aggregation summaries */
  aggregations: {
    byType: Record<InsightType, number>;
    bySeverity: Record<InsightSeverity, number>;
    byCategory: Record<InsightCategory, number>;
    byStatus: Record<InsightStatus, number>;
  };
  /** Grouped results (if groupBy was specified) */
  groups?: Array<{
    key: string;
    count: number;
    insights: Insight[];
  }>;
}

/**
 * Insight digest — a summary of insights over a time period.
 */
export interface InsightDigest {
  /** The venture */
  ventureId: string;
  /** Period covered */
  period: {
    start: Date;
    end: Date;
    label: string;  // e.g., "Week of Jan 6, 2025"
  };
  /** LLM-generated executive summary */
  executiveSummary: string;
  /** Top insights by impact */
  topInsights: Insight[];
  /** Key metrics and their status */
  metricHighlights: Array<{
    metricId: string;
    metricName: string;
    currentValue: number;
    changePercent: number;
    trend: TrendDirection;
    relatedInsights: number;
  }>;
  /** Aggregate statistics */
  stats: {
    totalInsights: number;
    byType: Record<InsightType, number>;
    bySeverity: Record<InsightSeverity, number>;
    avgConfidence: number;
    avgImpactScore: number;
    resolvedCount: number;
    dismissedCount: number;
  };
  /** Active recommendations */
  activeRecommendations: Recommendation[];
  /** Comparison to previous period */
  periodComparison: {
    insightCountChange: number;
    severityDistributionChange: Record<InsightSeverity, number>;
    topNewCategories: string[];
  };
}

export type DigestPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * InsightFeed — manages the insight feed and aggregations.
 */
export class InsightFeed {
  constructor(
    private readonly db: SupabaseClient,
    private readonly narrator: InsightNarrator,
  ) {}

  /**
   * Query the insight feed with full filtering and pagination.
   */
  async query(
    ventureId: string,
    params: InsightFeedQuery,
  ): Promise<InsightFeedResult>;

  /**
   * Generate a digest for a time period.
   */
  async generateDigest(
    ventureId: string,
    period: DigestPeriod,
    options?: DigestOptions,
  ): Promise<InsightDigest>;

  /**
   * Get the count of unread/new insights since a timestamp.
   */
  async getUnreadCount(
    ventureId: string,
    since: Date,
  ): Promise<number>;

  /**
   * Mark insights as read.
   */
  async markAsRead(
    ventureId: string,
    insightIds: string[],
  ): Promise<void>;
}
```

### Natural Language Generation

```typescript
/**
 * InsightNarrator — generates human-readable text from structured insights.
 * Delegates to @mcv/intelligence for LLM inference.
 */
export class InsightNarrator {
  constructor(
    private readonly intelligence: IntelligenceClient,
    private readonly config: NarratorConfig,
  ) {}

  /**
   * Generate a narrative for a single insight.
   * Produces a title, summary, detailed explanation, and
   * optionally a list of action items.
   */
  async narrateInsight(
    insight: Insight,
    context?: NarrationContext,
  ): Promise<InsightNarrative>;

  /**
   * Generate a digest narrative summarizing multiple insights.
   * Produces an executive summary and per-category summaries.
   */
  async narrateDigest(
    insights: Insight[],
    period: { start: Date; end: Date },
    context?: NarrationContext,
  ): Promise<DigestNarrative>;

  /**
   * Generate a natural language explanation of a root cause analysis.
   */
  async explainRootCause(
    rootCause: RootCauseData,
    context?: NarrationContext,
  ): Promise<string>;

  /**
   * Generate a natural language recommendation.
   */
  async narrateRecommendation(
    recommendation: Recommendation,
    insight: Insight,
    context?: NarrationContext,
  ): Promise<string>;
}

export interface InsightNarrative {
  /** Short headline (< 100 chars) */
  title: string;
  /** One-sentence summary (< 200 chars) */
  summary: string;
  /** Detailed explanation (1-3 paragraphs) */
  explanation: string;
  /** Action items (if applicable) */
  actionItems: string[];
  /** Key numbers to highlight in UI */
  highlights: Array<{
    label: string;
    value: string;
    change?: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
}

interface DigestNarrative {
  /** Executive summary paragraph */
  executiveSummary: string;
  /** Per-category summaries */
  categorySummaries: Record<InsightCategory, string>;
  /** Key takeaways (3-5 bullet points) */
  keyTakeaways: string[];
  /** Outlook / what to watch */
  outlook: string;
}

interface NarratorConfig {
  /** LLM model to use */
  model: string;
  /** Maximum tokens for narrative generation */
  maxTokens: number;
  /** Temperature for generation */
  temperature: number;
  /** Tone of the narratives */
  tone: 'professional' | 'conversational' | 'technical' | 'executive';
  /** Language for output */
  language: string;
  /** Whether to include technical details in narratives */
  includeTechnicalDetails: boolean;
  /** Custom system prompt additions */
  customPromptSuffix?: string;
}

interface NarrationContext {
  /** Venture name and description for context */
  ventureName: string;
  ventureDescription?: string;
  /** Industry vertical for relevant language */
  industry?: string;
  /** Target audience for the narrative */
  audience?: 'founder' | 'operator' | 'investor' | 'technical';
  /** Additional context to inject into the prompt */
  additionalContext?: string;
}
```

---

## Database Schema

### Table: `insights`

Primary storage for all discovered insights.

```sql
CREATE TABLE insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
                    'anomaly', 'trend', 'root_cause', 'opportunity',
                    'correlation', 'forecast', 'benchmark'
                  )),
  severity        TEXT NOT NULL CHECK (severity IN (
                    'critical', 'high', 'medium', 'low', 'info'
                  )),
  category        TEXT NOT NULL CHECK (category IN (
                    'revenue', 'growth', 'engagement', 'retention',
                    'acquisition', 'conversion', 'performance',
                    'cost', 'churn', 'product', 'marketing', 'operational'
                  )),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                    'active', 'dismissed', 'resolved', 'expired',
                    'superseded', 'archived'
                  )),

  -- Content
  title           TEXT NOT NULL,
  narrative       TEXT,
  metric_ids      UUID[] NOT NULL DEFAULT '{}',
  primary_metric  TEXT NOT NULL,

  -- Structured data (type-specific)
  data            JSONB NOT NULL DEFAULT '{}',

  -- Scoring
  confidence      NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  impact_score    NUMERIC(5,1) NOT NULL CHECK (impact_score BETWEEN 0 AND 100),

  -- Time range
  time_range_start TIMESTAMPTZ NOT NULL,
  time_range_end   TIMESTAMPTZ NOT NULL,

  -- Lifecycle
  discovered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,

  -- User interactions
  dismissed       BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed_at    TIMESTAMPTZ,
  dismissed_reason TEXT,
  bookmarked      BOOLEAN NOT NULL DEFAULT FALSE,
  bookmarked_at   TIMESTAMPTZ,
  bookmark_note   TEXT,
  resolved        BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at     TIMESTAMPTZ,
  resolution      TEXT,
  feedback_score  SMALLINT CHECK (feedback_score BETWEEN -1 AND 1),
  feedback_comment TEXT,

  -- Metadata
  analysis_run_id UUID,
  algorithm_used  TEXT,
  processing_time_ms INTEGER,
  data_points_analyzed INTEGER,
  model_version   TEXT,

  -- Related
  related_insight_ids UUID[] DEFAULT '{}',
  superseded_by   UUID REFERENCES insights(id),

  -- Search
  search_vector   TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(narrative, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(primary_metric, '')), 'C')
  ) STORED,

  CONSTRAINT valid_time_range CHECK (time_range_end >= time_range_start)
);

-- Indexes for common query patterns
CREATE INDEX idx_insights_venture_discovered
  ON insights (venture_id, discovered_at DESC);
CREATE INDEX idx_insights_venture_severity
  ON insights (venture_id, severity, discovered_at DESC);
CREATE INDEX idx_insights_venture_type
  ON insights (venture_id, type, discovered_at DESC);
CREATE INDEX idx_insights_venture_category
  ON insights (venture_id, category, discovered_at DESC);
CREATE INDEX idx_insights_venture_status
  ON insights (venture_id, status, discovered_at DESC);
CREATE INDEX idx_insights_venture_impact
  ON insights (venture_id, impact_score DESC);
CREATE INDEX idx_insights_metric_ids
  ON insights USING GIN (metric_ids);
CREATE INDEX idx_insights_search
  ON insights USING GIN (search_vector);
CREATE INDEX idx_insights_expires
  ON insights (expires_at) WHERE expires_at IS NOT NULL AND status = 'active';
CREATE INDEX idx_insights_analysis_run
  ON insights (analysis_run_id);
CREATE INDEX idx_insights_data
  ON insights USING GIN (data jsonb_path_ops);

-- RLS
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY insights_venture_isolation ON insights
  USING (venture_id IN (
    SELECT venture_id FROM venture_members
    WHERE user_id = auth.uid()
  ));
```

### Table: `insight_recommendations`

Actionable recommendations derived from insights.

```sql
CREATE TABLE insight_recommendations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id        UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  source_insight_ids UUID[] NOT NULL DEFAULT '{}',
  type              TEXT NOT NULL CHECK (type IN (
                      'increase_spend', 'decrease_spend', 'reallocate_budget',
                      'fix_churn', 'optimize_conversion', 'investigate_anomaly',
                      'capitalize_trend', 'adjust_pricing', 'improve_retention',
                      'expand_segment', 'reduce_cost', 'test_hypothesis',
                      'monitor_metric', 'update_target', 'custom'
                    )),
  priority          TEXT NOT NULL CHECK (priority IN (
                      'critical', 'high', 'medium', 'low'
                    )),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                      'pending', 'accepted', 'in_progress', 'completed',
                      'dismissed', 'expired'
                    )),

  -- Content
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  steps             JSONB NOT NULL DEFAULT '[]',

  -- Scoring
  impact_estimate   JSONB NOT NULL DEFAULT '{}',
  effort_estimate   JSONB NOT NULL DEFAULT '{}',
  roi_score         NUMERIC(5,1) NOT NULL CHECK (roi_score BETWEEN 0 AND 100),
  confidence        NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),

  -- Urgency
  urgency           TEXT NOT NULL DEFAULT 'when_convenient' CHECK (urgency IN (
                      'immediate', 'this_week', 'this_month', 'when_convenient'
                    )),
  category          TEXT NOT NULL,
  metric_ids        UUID[] DEFAULT '{}',

  -- Lifecycle
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,

  -- User interaction
  accepted          BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at       TIMESTAMPTZ,
  dismissed         BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed_at      TIMESTAMPTZ,
  dismissed_reason  TEXT,
  completed_at      TIMESTAMPTZ,
  outcome_notes     TEXT,

  -- Who created/accepted
  created_by        TEXT NOT NULL DEFAULT 'system',
  accepted_by       UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_recommendations_venture_status
  ON insight_recommendations (venture_id, status, roi_score DESC);
CREATE INDEX idx_recommendations_venture_priority
  ON insight_recommendations (venture_id, priority, created_at DESC);
CREATE INDEX idx_recommendations_source_insights
  ON insight_recommendations USING GIN (source_insight_ids);
CREATE INDEX idx_recommendations_expires
  ON insight_recommendations (expires_at)
  WHERE expires_at IS NOT NULL AND status IN ('pending', 'accepted');

ALTER TABLE insight_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY recommendations_venture_isolation ON insight_recommendations
  USING (venture_id IN (
    SELECT venture_id FROM venture_members
    WHERE user_id = auth.uid()
  ));
```

### Table: `insight_alert_rules`

Configurable alert rules for insight-based notifications.

```sql
CREATE TABLE insight_alert_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id        UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  enabled           BOOLEAN NOT NULL DEFAULT TRUE,

  -- Conditions
  conditions        JSONB NOT NULL DEFAULT '[]',
  condition_logic   TEXT NOT NULL DEFAULT 'all' CHECK (condition_logic IN ('all', 'any')),

  -- Notifications
  notifications     JSONB NOT NULL DEFAULT '[]',

  -- Throttling
  cooldown_minutes  INTEGER NOT NULL DEFAULT 60,
  max_triggers_day  INTEGER NOT NULL DEFAULT 10,

  -- Lifecycle
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,
  trigger_count     INTEGER NOT NULL DEFAULT 0,

  -- Ownership
  created_by        UUID NOT NULL REFERENCES auth.users(id),

  CONSTRAINT valid_cooldown CHECK (cooldown_minutes >= 1),
  CONSTRAINT valid_max_triggers CHECK (max_triggers_day >= 1)
);

CREATE INDEX idx_alert_rules_venture_enabled
  ON insight_alert_rules (venture_id, enabled);
CREATE INDEX idx_alert_rules_conditions
  ON insight_alert_rules USING GIN (conditions jsonb_path_ops);

ALTER TABLE insight_alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY alert_rules_venture_isolation ON insight_alert_rules
  USING (venture_id IN (
    SELECT venture_id FROM venture_members
    WHERE user_id = auth.uid()
  ));
```

### Table: `insight_alert_triggers`

History of triggered alerts for audit and review.

```sql
CREATE TABLE insight_alert_triggers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id           UUID NOT NULL REFERENCES insight_alert_rules(id) ON DELETE CASCADE,
  insight_id        UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  venture_id        UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,

  -- Trigger details
  triggered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  condition_results JSONB NOT NULL DEFAULT '[]',

  -- Notification delivery
  notifications     JSONB NOT NULL DEFAULT '[]',

  -- Acknowledgement
  acknowledged      BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at   TIMESTAMPTZ,
  acknowledged_by   UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_alert_triggers_rule
  ON insight_alert_triggers (rule_id, triggered_at DESC);
CREATE INDEX idx_alert_triggers_venture
  ON insight_alert_triggers (venture_id, triggered_at DESC);
CREATE INDEX idx_alert_triggers_insight
  ON insight_alert_triggers (insight_id);
CREATE INDEX idx_alert_triggers_unacknowledged
  ON insight_alert_triggers (venture_id, acknowledged, triggered_at DESC)
  WHERE acknowledged = FALSE;

ALTER TABLE insight_alert_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY alert_triggers_venture_isolation ON insight_alert_triggers
  USING (venture_id IN (
    SELECT venture_id FROM venture_members
    WHERE user_id = auth.uid()
  ));
```

### Table: `insight_analysis_runs`

Tracks analysis runs for debugging, auditing, and performance monitoring.

```sql
CREATE TABLE insight_analysis_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id        UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,

  -- Configuration
  trigger_type      TEXT NOT NULL CHECK (trigger_type IN (
                      'scheduled_hourly', 'scheduled_daily', 'scheduled_weekly',
                      'on_demand', 'metric_event', 'system'
                    )),
  config            JSONB NOT NULL DEFAULT '{}',

  -- Time range analyzed
  analysis_start    TIMESTAMPTZ NOT NULL,
  analysis_end      TIMESTAMPTZ NOT NULL,

  -- Execution
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'running' CHECK (status IN (
                      'running', 'completed', 'failed', 'cancelled', 'timeout'
                    )),
  error_message     TEXT,
  error_stack       TEXT,

  -- Results
  metrics_analyzed  INTEGER NOT NULL DEFAULT 0,
  insights_created  INTEGER NOT NULL DEFAULT 0,
  insights_deduplicated INTEGER NOT NULL DEFAULT 0,
  recommendations_created INTEGER NOT NULL DEFAULT 0,
  alerts_triggered  INTEGER NOT NULL DEFAULT 0,

  -- Performance
  total_duration_ms INTEGER,
  anomaly_duration_ms INTEGER,
  trend_duration_ms INTEGER,
  rca_duration_ms   INTEGER,
  opportunity_duration_ms INTEGER,
  narration_duration_ms INTEGER,

  -- Pipeline details
  pipeline_results  JSONB DEFAULT '{}',

  -- Model versions
  model_versions    JSONB DEFAULT '{}'
);

CREATE INDEX idx_analysis_runs_venture
  ON insight_analysis_runs (venture_id, started_at DESC);
CREATE INDEX idx_analysis_runs_status
  ON insight_analysis_runs (status, started_at DESC);
CREATE INDEX idx_analysis_runs_trigger
  ON insight_analysis_runs (trigger_type, started_at DESC);

ALTER TABLE insight_analysis_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY analysis_runs_venture_isolation ON insight_analysis_runs
  USING (venture_id IN (
    SELECT venture_id FROM venture_members
    WHERE user_id = auth.uid()
  ));
```

### Table: `insight_feedback`

Detailed feedback tracking for model improvement.

```sql
CREATE TABLE insight_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id      UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id),

  -- Feedback
  score           SMALLINT NOT NULL CHECK (score BETWEEN -1 AND 1),
  -- -1 = not helpful, 0 = neutral, 1 = helpful
  accuracy        TEXT CHECK (accuracy IN ('accurate', 'partially_accurate', 'inaccurate')),
  relevance       TEXT CHECK (relevance IN ('relevant', 'somewhat_relevant', 'irrelevant')),
  actionability   TEXT CHECK (actionability IN ('actionable', 'somewhat_actionable', 'not_actionable')),
  comment         TEXT,

  -- Context
  insight_type    TEXT NOT NULL,
  insight_severity TEXT NOT NULL,
  algorithm_used  TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_insight
  ON insight_feedback (insight_id);
CREATE INDEX idx_feedback_venture
  ON insight_feedback (venture_id, created_at DESC);
CREATE INDEX idx_feedback_algorithm
  ON insight_feedback (algorithm_used, score);

ALTER TABLE insight_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY feedback_venture_isolation ON insight_feedback
  USING (venture_id IN (
    SELECT venture_id FROM venture_members
    WHERE user_id = auth.uid()
  ));
```

---

## tRPC Router

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '@mcv/trpc';
import {
  insightFeedQuerySchema,
  alertRuleSchema,
  insightFeedbackSchema,
  detectionConfigSchema,
  recommendationActionSchema,
} from './schemas';

export const insightsRouter = router({
  // ── Feed ───────────────────────────────────────────────────

  /**
   * Get the insight feed for a venture with filtering and pagination.
   */
  getFeed: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      query: insightFeedQuerySchema.optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.insightService.getFeed(
        input.ventureId,
        input.query ?? {},
      );
    }),

  /**
   * Get a single insight by ID with full detail.
   */
  getById: protectedProcedure
    .input(z.object({
      insightId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.insightService.getInsightById(input.insightId);
    }),

  /**
   * Search insights via full-text search.
   */
  search: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      query: z.string().min(1).max(500),
      types: z.array(z.string()).optional(),
      severities: z.array(z.string()).optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.insightService.searchInsights(
        input.ventureId,
        input.query,
        {
          types: input.types as InsightType[],
          severities: input.severities as InsightSeverity[],
          limit: input.limit,
        },
      );
    }),

  /**
   * Get an insight digest for a time period.
   */
  getDigest: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      period: z.enum(['daily', 'weekly', 'monthly']),
      date: z.string().datetime().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.insightService.getDigest(
        input.ventureId,
        input.period,
        { referenceDate: input.date ? new Date(input.date) : undefined },
      );
    }),

  /**
   * Get unread insight count.
   */
  getUnreadCount: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      since: z.string().datetime(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.insightService.feed.getUnreadCount(
        input.ventureId,
        new Date(input.since),
      );
    }),

  // ── Insight Actions ────────────────────────────────────────

  /**
   * Dismiss an insight.
   */
  dismiss: protectedProcedure
    .input(z.object({
      insightId: z.string().uuid(),
      reason: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.dismissInsight(
        input.insightId,
        input.reason,
      );
    }),

  /**
   * Bookmark an insight.
   */
  bookmark: protectedProcedure
    .input(z.object({
      insightId: z.string().uuid(),
      note: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.bookmarkInsight(
        input.insightId,
        input.note,
      );
    }),

  /**
   * Resolve an insight.
   */
  resolve: protectedProcedure
    .input(z.object({
      insightId: z.string().uuid(),
      resolution: z.string().max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.resolveInsight(
        input.insightId,
        { resolution: input.resolution },
      );
    }),

  /**
   * Provide feedback on an insight.
   */
  feedback: protectedProcedure
    .input(insightFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.provideFeedback(
        input.insightId,
        input,
      );
    }),

  /**
   * Re-analyze an insight with fresh data.
   */
  reanalyze: protectedProcedure
    .input(z.object({
      insightId: z.string().uuid(),
      additionalContext: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.reanalyzeInsight(
        input.insightId,
        { additionalContext: input.additionalContext },
      );
    }),

  // ── Analysis ───────────────────────────────────────────────

  /**
   * Trigger an on-demand analysis for a venture.
   */
  analyzeVenture: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      metricIds: z.array(z.string().uuid()).optional(),
      lookbackDays: z.number().min(1).max(365).default(30),
      algorithms: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.analyzeVenture(
        input.ventureId,
        {
          metricIds: input.metricIds,
          lookbackDays: input.lookbackDays,
          algorithms: input.algorithms as DetectionAlgorithm[],
        },
      );
    }),

  /**
   * Analyze a specific metric.
   */
  analyzeMetric: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      metricId: z.string().uuid(),
      lookbackDays: z.number().min(1).max(365).default(30),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.analyzeMetric(
        input.ventureId,
        input.metricId,
        { lookbackDays: input.lookbackDays },
      );
    }),

  // ── Alert Rules ────────────────────────────────────────────

  /**
   * Create an alert rule.
   */
  createAlertRule: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      rule: alertRuleSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.createAlertRule(
        input.ventureId,
        input.rule,
      );
    }),

  /**
   * Update an alert rule.
   */
  updateAlertRule: protectedProcedure
    .input(z.object({
      ruleId: z.string().uuid(),
      updates: alertRuleSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.updateAlertRule(
        input.ruleId,
        input.updates,
      );
    }),

  /**
   * Delete an alert rule.
   */
  deleteAlertRule: protectedProcedure
    .input(z.object({
      ruleId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.deleteAlertRule(input.ruleId);
    }),

  /**
   * List alert rules for a venture.
   */
  listAlertRules: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      enabledOnly: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.insightService.listAlertRules(
        input.ventureId,
        { enabledOnly: input.enabledOnly },
      );
    }),

  /**
   * Get alert trigger history.
   */
  getAlertHistory: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      ruleId: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.insightService.getAlertHistory(
        input.ventureId,
        { ruleId: input.ruleId, limit: input.limit },
      );
    }),

  /**
   * Test an alert rule against historical insights.
   */
  testAlertRule: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      rule: alertRuleSchema,
      lookbackDays: z.number().min(1).max(90).default(30),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.alertEngine.testRule(
        input.ventureId,
        input.rule,
        input.lookbackDays,
      );
    }),

  // ── Recommendations ────────────────────────────────────────

  /**
   * Get active recommendations.
   */
  getRecommendations: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      status: z.array(z.string()).optional(),
      category: z.array(z.string()).optional(),
      minROI: z.number().min(0).max(100).optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.insightService.getRecommendations(
        input.ventureId,
        {
          statuses: input.status as RecommendationStatus[],
          categories: input.category as InsightCategory[],
          minROIScore: input.minROI,
          limit: input.limit,
        },
      );
    }),

  /**
   * Accept a recommendation.
   */
  acceptRecommendation: protectedProcedure
    .input(z.object({
      recommendationId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.acceptRecommendation(
        input.recommendationId,
      );
    }),

  /**
   * Dismiss a recommendation.
   */
  dismissRecommendation: protectedProcedure
    .input(z.object({
      recommendationId: z.string().uuid(),
      reason: z.string().max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.dismissRecommendation(
        input.recommendationId,
        input.reason,
      );
    }),

  // ── Export ─────────────────────────────────────────────────

  /**
   * Export insights in various formats.
   */
  export: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      format: z.enum(['json', 'csv', 'pdf']),
      types: z.array(z.string()).optional(),
      severities: z.array(z.string()).optional(),
      dateRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.insightService.exportInsights(
        input.ventureId,
        input.format,
        {
          types: input.types as InsightType[],
          severities: input.severities as InsightSeverity[],
          dateRange: input.dateRange ? {
            start: new Date(input.dateRange.start),
            end: new Date(input.dateRange.end),
          } : undefined,
        },
      );
    }),
});
```

---

## Code Examples

### Example 1: Running an On-Demand Analysis

```typescript
import { InsightService } from '@mcv/analytics/insights';

const service = new InsightService(supabase, intelligence, metrics, config);

// Run a full analysis for a venture
const result = await service.analyzeVenture('venture-123', {
  lookbackDays: 30,
  algorithms: ['z_score', 'isolation_forest', 'seasonal_decomposition'],
  enableRootCause: true,
  enableOpportunityScoring: true,
});

console.log(`Analysis complete in ${result.durationMs}ms`);
console.log(`Metrics analyzed: ${result.metricsAnalyzed}`);
console.log(`Insights discovered: ${result.insightsCreated}`);
console.log(`Duplicates filtered: ${result.insightsDeduplicated}`);
console.log(`Recommendations generated: ${result.recommendationsCreated}`);
console.log(`Alerts triggered: ${result.alertsTriggered}`);

// Iterate through discovered insights
for (const insight of result.insights) {
  console.log(`[${insight.severity}] ${insight.title}`);
  console.log(`  Type: ${insight.type}, Confidence: ${insight.confidence}`);
  console.log(`  Narrative: ${insight.narrative}`);
  if (insight.recommendations.length > 0) {
    console.log(`  Recommendations:`);
    for (const rec of insight.recommendations) {
      console.log(`    → ${rec.title} (ROI: ${rec.roiScore})`);
    }
  }
}
```

### Example 2: Querying the Insight Feed

```typescript
import { InsightService } from '@mcv/analytics/insights';

const service = new InsightService(supabase, intelligence, metrics, config);

// Get high-severity revenue insights from the past week
const feed = await service.getFeed('venture-123', {
  types: ['anomaly', 'trend'],
  severities: ['critical', 'high'],
  categories: ['revenue', 'growth'],
  timeRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  sortBy: 'impactScore',
  sortOrder: 'desc',
  limit: 10,
  includeDismissed: false,
});

console.log(`Found ${feed.totalCount} matching insights`);
console.log(`Showing ${feed.insights.length} of ${feed.totalCount}`);

// Display aggregation summary
console.log('By severity:', feed.aggregations.bySeverity);
console.log('By category:', feed.aggregations.byCategory);

// Paginate through results
let cursor = feed.nextCursor;
while (cursor) {
  const nextPage = await service.getFeed('venture-123', {
    ...feed,
    cursor,
  });
  // Process nextPage.insights...
  cursor = nextPage.nextCursor;
}
```

### Example 3: Configuring Anomaly Detection

```typescript
import { AnomalyDetector } from '@mcv/analytics/insights';

const detector = new AnomalyDetector(metrics, {
  algorithms: ['z_score', 'iqr', 'seasonal_decomposition'],
  sensitivity: 'medium',
  minimumDataPoints: 30,
  baselineDays: 90,
  seasonalAdjustment: true,
  seasonalPeriod: 7, // Weekly seasonality
  dimensions: ['channel', 'country', 'device_type'],
  metricOverrides: {
    'revenue': {
      sensitivity: 'high', // Be more sensitive for revenue
      algorithms: ['ensemble'], // Use all algorithms
    },
    'page_views': {
      sensitivity: 'low', // Less sensitive for noisy metrics
      minimumDataPoints: 60,
    },
  },
});

// Detect anomalies for a single metric
const anomalies = await detector.detect(
  'venture-123',
  'metric-revenue-daily',
  {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
  },
);

for (const anomaly of anomalies) {
  console.log(`Anomaly detected: ${anomaly.anomaly.anomalyType}`);
  console.log(`  Direction: ${anomaly.anomaly.direction}`);
  console.log(`  Observed: ${anomaly.anomaly.observedValue}`);
  console.log(`  Expected: ${anomaly.anomaly.expectedValue}`);
  console.log(`  Range: [${anomaly.anomaly.expectedRange.lower}, ${anomaly.anomaly.expectedRange.upper}]`);
  console.log(`  Deviation: ${anomaly.anomaly.deviationScore.toFixed(2)}σ`);
  console.log(`  Severity: ${anomaly.severity}`);
  console.log(`  Algorithm: ${anomaly.anomaly.algorithm}`);

  // Show which dimensions are driving the anomaly
  for (const dim of anomaly.anomaly.affectedDimensions) {
    if (dim.isDriverDimension) {
      console.log(`  Driver: ${dim.dimension}=${dim.value} (${(dim.contribution * 100).toFixed(1)}%)`);
    }
  }
}
```

### Example 4: Setting Up Alert Rules

```typescript
import { InsightService } from '@mcv/analytics/insights';

const service = new InsightService(supabase, intelligence, metrics, config);

// Create an alert for critical revenue anomalies
const revenueAlert = await service.createAlertRule('venture-123', {
  name: 'Revenue Anomaly Alert',
  description: 'Alert when revenue shows a significant spike or drop',
  enabled: true,
  conditions: [
    {
      field: 'insight.type',
      operator: 'eq',
      value: 'anomaly',
    },
    {
      field: 'insight.severity',
      operator: 'in',
      value: ['critical', 'high'],
    },
    {
      field: 'insight.category',
      operator: 'eq',
      value: 'revenue',
    },
    {
      field: 'anomaly.deviationScore',
      operator: 'gte',
      value: 3.0, // 3+ standard deviations
    },
  ],
  conditionLogic: 'all',
  notifications: [
    {
      channel: 'email',
      target: 'founder@startup.com',
      includeDetail: true,
    },
    {
      channel: 'slack',
      target: '#analytics-alerts',
      includeDetail: true,
      messageTemplate: '🚨 *Revenue Alert*: {{insight.title}}\n{{insight.narrative}}',
    },
    {
      channel: 'webhook',
      target: 'https://hooks.example.com/insights',
      includeDetail: true,
    },
  ],
  cooldownMinutes: 120, // Don't re-trigger for 2 hours
  maxTriggersPerDay: 5,
});

console.log(`Alert rule created: ${revenueAlert.id}`);

// Test the rule against historical data to see trigger frequency
const testResult = await service.alertEngine.testRule(
  'venture-123',
  revenueAlert,
  30, // Look back 30 days
);

console.log(`Would have triggered ${testResult.wouldHaveTriggered} times`);
console.log(`Estimated ${testResult.estimatedTriggersPerWeek} triggers/week`);
for (const match of testResult.matchingInsights) {
  console.log(`  Match: ${match.title} (${match.discoveredAt})`);
}
```

### Example 5: Root Cause Analysis Deep Dive

```typescript
import { RootCauseAnalyzer } from '@mcv/analytics/insights';

const rca = new RootCauseAnalyzer(metrics, intelligence, {
  maxDepth: 3,
  minimumContribution: 0.05, // Ignore factors < 5%
  maxFactors: 10,
  dimensions: 'all',
  enableCausalAnalysis: true,
  causalitySignificanceLevel: 0.05,
  maxCausalLagDays: 7,
  enableLLMInterpretation: true,
});

// Analyze why revenue dropped this week vs last week
const result = await rca.analyze(
  'venture-123',
  'metric-revenue-daily',
  { start: new Date('2025-01-20'), end: new Date('2025-01-26') }, // Change period
  { start: new Date('2025-01-13'), end: new Date('2025-01-19') }, // Baseline
);

const rootCause = result.rootCause;
console.log(`Revenue change: ${rootCause.targetMetric.changePercent.toFixed(1)}%`);
console.log(`Total attribution: ${(rootCause.totalAttribution * 100).toFixed(1)}%`);
console.log(`Unexplained: ${(rootCause.unexplainedPortion * 100).toFixed(1)}%`);

// Show top contributing factors
console.log('\nTop Contributing Factors:');
for (const factor of rootCause.factors.slice(0, 5)) {
  const dir = factor.direction === 'positive' ? '↑' : '↓';
  console.log(`  ${dir} ${factor.description}`);
  console.log(`    Dimension: ${factor.dimension}=${factor.dimensionValue}`);
  console.log(`    Contribution: ${(factor.relativeContribution * 100).toFixed(1)}%`);
  console.log(`    Confidence: ${(factor.confidence * 100).toFixed(0)}%`);
  if (factor.context) {
    console.log(`    Context: ${factor.context}`);
  }
}

// Show dimension breakdowns
console.log('\nDimension Breakdowns:');
for (const breakdown of rootCause.dimensionBreakdowns) {
  console.log(`  ${breakdown.dimension} (concentration: ${breakdown.concentration.toFixed(2)}):`);
  for (const val of breakdown.values.filter(v => v.isSignificant)) {
    console.log(`    ${val.value}: ${val.changePercent > 0 ? '+' : ''}${val.changePercent.toFixed(1)}% (contribution: ${(val.contribution * 100).toFixed(1)}%)`);
  }
}

// Show causal chain
if (rootCause.causalChain.length > 0) {
  console.log('\nCausal Chain:');
  for (const link of rootCause.causalChain) {
    console.log(`  ${link.source} → ${link.target}`);
    console.log(`    Strength: ${link.strength.toFixed(2)}, Lag: ${link.lagDays}d`);
    console.log(`    Evidence: ${link.evidence}`);
  }
}
```

### Example 6: Generating a Weekly Digest

```typescript
import { InsightService } from '@mcv/analytics/insights';

const service = new InsightService(supabase, intelligence, metrics, config);

const digest = await service.getDigest('venture-123', 'weekly', {
  referenceDate: new Date('2025-01-26'), // End of week
  includeRecommendations: true,
  narrativeOptions: {
    tone: 'executive',
    audience: 'founder',
    language: 'en',
  },
});

// Executive summary (LLM-generated)
console.log(`=== ${digest.period.label} ===`);
console.log(digest.executiveSummary);

// Metric highlights
console.log('\n📊 Key Metrics:');
for (const metric of digest.metricHighlights) {
  const arrow = metric.changePercent > 0 ? '📈' : metric.changePercent < 0 ? '📉' : '➡️';
  console.log(`  ${arrow} ${metric.metricName}: ${metric.currentValue} (${metric.changePercent > 0 ? '+' : ''}${metric.changePercent.toFixed(1)}%)`);
  console.log(`    Trend: ${metric.trend}, Related insights: ${metric.relatedInsights}`);
}

// Top insights
console.log(`\n🔍 Top Insights (${digest.stats.totalInsights} total):`);
for (const insight of digest.topInsights) {
  console.log(`  [${insight.severity.toUpperCase()}] ${insight.title}`);
}

// Recommendations
if (digest.activeRecommendations.length > 0) {
  console.log('\n💡 Recommendations:');
  for (const rec of digest.activeRecommendations) {
    console.log(`  [${rec.priority}] ${rec.title}`);
    console.log(`    ROI Score: ${rec.roiScore}, Urgency: ${rec.urgency}`);
    if (rec.impact.estimatedMonetaryValue) {
      console.log(`    Est. Value: $${rec.impact.estimatedMonetaryValue.toLocaleString()}`);
    }
  }
}

// Period comparison
console.log('\n📈 vs Previous Period:');
console.log(`  Insight count: ${digest.periodComparison.insightCountChange > 0 ? '+' : ''}${digest.periodComparison.insightCountChange}`);
```

### Example 7: Working with Recommendations

```typescript
import { InsightService } from '@mcv/analytics/insights';

const service = new InsightService(supabase, intelligence, metrics, config);

// Get top recommendations sorted by ROI
const recommendations = await service.getRecommendations('venture-123', {
  statuses: ['pending'],
  minROIScore: 50,
  limit: 10,
});

for (const rec of recommendations) {
  console.log(`\n═══ ${rec.title} ═══`);
  console.log(`Type: ${rec.type} | Priority: ${rec.priority} | Urgency: ${rec.urgency}`);
  console.log(`ROI Score: ${rec.roiScore} | Confidence: ${(rec.confidence * 100).toFixed(0)}%`);
  console.log(`\nDescription: ${rec.description}`);

  // Impact estimate
  const impact = rec.impact;
  console.log(`\n📊 Estimated Impact:`);
  console.log(`  Metric: ${impact.metricName}`);
  console.log(`  Change: ${impact.estimatedChangePercent > 0 ? '+' : ''}${impact.estimatedChangePercent.toFixed(1)}%`);
  if (impact.estimatedMonetaryValue) {
    console.log(`  Value: $${impact.estimatedMonetaryValue.toLocaleString()} ${impact.currency}`);
  }
  console.log(`  Time to impact: ${impact.timeToImpactDays} days`);
  console.log(`  CI: [${impact.confidenceInterval.lower.toFixed(1)}, ${impact.confidenceInterval.upper.toFixed(1)}] @ ${(impact.confidenceInterval.level * 100).toFixed(0)}%`);

  // Effort estimate
  const effort = rec.effort;
  console.log(`\n⏱️ Estimated Effort:`);
  console.log(`  Level: ${effort.level} (~${effort.estimatedHours}h)`);
  console.log(`  Skills: ${effort.requiredSkills.join(', ')}`);
  console.log(`  Complexity: ${effort.complexityScore}/10`);

  // Steps
  console.log(`\n📋 Steps:`);
  for (const step of rec.steps) {
    console.log(`  ${step.order}. ${step.action}`);
    if (step.detail) console.log(`     ${step.detail}`);
    if (step.automatable) console.log(`     ⚡ Automatable`);
  }
}

// Accept the top recommendation
if (recommendations.length > 0) {
  await service.acceptRecommendation(recommendations[0].id);
  console.log(`\n✅ Accepted: ${recommendations[0].title}`);
}
```

### Example 8: Trend Analysis with Forecasting

```typescript
import { TrendAnalyzer } from '@mcv/analytics/insights';

const analyzer = new TrendAnalyzer(metrics, {
  minimumDataPoints: 30,
  forecastConfidenceLevel: 0.95,
  maxForecastHorizonDays: 90,
  decompose: true,
  minimumR2: 0.3,
  growthThresholds: {
    accelerating: 0.02,
    linear: 0.005,
    decelerating: -0.005,
  },
});

// Analyze MRR trend
const trend = await analyzer.analyzeTrend(
  'venture-123',
  'metric-mrr-daily',
  { start: new Date('2024-07-01'), end: new Date('2025-01-31') },
);

console.log(`Direction: ${trend.trend.direction}`);
console.log(`Classification: ${trend.trend.classification}`);
console.log(`Strength: ${trend.trend.strength.toFixed(3)}`);
console.log(`Rate of change: ${trend.trend.rateOfChangePercent.toFixed(2)}%/day`);
console.log(`R²: ${trend.trend.statistics.r_squared.toFixed(4)}`);
console.log(`p-value: ${trend.trend.statistics.p_value.toExponential(2)}`);

// Seasonal patterns
if (trend.trend.seasonalPatterns.length > 0) {
  console.log('\n🔄 Seasonal Patterns:');
  for (const pattern of trend.trend.seasonalPatterns) {
    console.log(`  ${pattern.periodName} (period=${pattern.period})`);
    console.log(`    Strength: ${pattern.strength.toFixed(3)}`);
    console.log(`    Amplitude: ${pattern.amplitude.toFixed(2)}`);
  }
}

// Generate 30-day forecast
const forecast = await analyzer.forecast(
  'venture-123',
  'metric-mrr-daily',
  30,
);

console.log('\n📈 30-Day Forecast:');
for (const point of forecast) {
  const ci = point.confidenceInterval;
  console.log(`  ${point.timestamp.toISOString().split('T')[0]}: ${point.predicted.toFixed(0)} [${ci.lower.toFixed(0)}, ${ci.upper.toFixed(0)}]`);
}

// Growth stage classification
const growth = await analyzer.classifyGrowthStage(
  'venture-123',
  'metric-mrr-daily',
);

console.log(`\n🌱 Growth Stage: ${growth.stage}`);
console.log(`Confidence: ${(growth.confidence * 100).toFixed(0)}%`);
console.log(`Time in stage: ${growth.timeInCurrentStage} days`);
console.log('Transition probabilities:');
for (const [stage, prob] of Object.entries(growth.transitionLikelihood)) {
  if (prob > 0.05) {
    console.log(`  → ${stage}: ${(prob * 100).toFixed(1)}%`);
  }
}
```

---

## Error Codes

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| `INSIGHT_NOT_FOUND` | `InsightNotFoundError` | 404 | The requested insight does not exist or the user lacks access. |
| `DETECTION_FAILED` | `DetectionFailedError` | 500 | An anomaly detection algorithm failed during execution. Includes algorithm name and error detail. |
| `ANALYSIS_TIMEOUT` | `AnalysisTimeoutError` | 408 | The analysis run exceeded the configured timeout. May indicate too many metrics or overly complex configuration. |
| `INSUFFICIENT_DATA` | `InsufficientDataError` | 422 | Not enough data points to run the requested analysis. Includes minimum required and actual count. |
| `ALERT_RULE_VALIDATION` | `AlertRuleValidationError` | 400 | Alert rule configuration is invalid. Includes specific validation failures (invalid field, operator, etc.). |
| `NARRATION_FAILED` | `NarrationFailedError` | 502 | LLM-powered narrative generation failed. May indicate intelligence service unavailability or token limit exceeded. |
| `ROOT_CAUSE_DEPTH_EXCEEDED` | `RootCauseDepthExceededError` | 422 | Root cause analysis exceeded maximum decomposition depth without converging. |
| `OPPORTUNITY_SCORING_ERROR` | `OpportunityScoringError` | 500 | Opportunity scoring model failed. May indicate missing baseline data or model misconfiguration. |
| `FEED_QUERY_ERROR` | `FeedQueryError` | 400 | Invalid feed query parameters (invalid filter combination, malformed cursor, etc.). |
| `INSIGHT_RATE_LIMIT` | `InsightRateLimitError` | 429 | Too many analysis requests. Enforced per-venture to prevent resource exhaustion. |
| `DUPLICATE_INSIGHT` | `DuplicateInsightError` | 409 | The insight was deduplicated because an equivalent active insight already exists. |
| `SCHEDULER_CONFLICT` | `SchedulerConflictError` | 409 | An analysis run is already in progress for this venture. Wait for completion or cancel. |
| `INVALID_ALGORITHM` | `InvalidAlgorithmError` | 400 | The specified detection algorithm is not available or not enabled. |
| `RECOMMENDATION_EXPIRED` | `RecommendationExpiredError` | 410 | The recommendation has expired and can no longer be accepted. |
| `EXPORT_TOO_LARGE` | `ExportTooLargeError` | 413 | The export request would produce a file exceeding the size limit. Narrow the filter criteria. |

### Error Response Shape

```typescript
interface InsightErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  insightId?: string;
  ventureId?: string;
  algorithmName?: string;
  requiredDataPoints?: number;
  actualDataPoints?: number;
  retryAfterMs?: number;
}
```

### Error Handling Example

```typescript
import {
  InsightError,
  InsufficientDataError,
  AnalysisTimeoutError,
  InsightRateLimitError,
} from '@mcv/analytics/insights';

try {
  const result = await insightService.analyzeVenture('venture-123');
} catch (error) {
  if (error instanceof InsufficientDataError) {
    console.warn(
      `Need ${error.requiredDataPoints} data points, ` +
      `but only have ${error.actualDataPoints}. ` +
      `Wait for more data to accumulate.`
    );
  } else if (error instanceof AnalysisTimeoutError) {
    console.warn(
      `Analysis timed out after ${error.timeoutMs}ms. ` +
      `Try reducing the lookback window or metric count.`
    );
  } else if (error instanceof InsightRateLimitError) {
    console.warn(
      `Rate limited. Retry after ${error.retryAfterMs}ms.`
    );
    await delay(error.retryAfterMs);
    // Retry...
  } else if (error instanceof InsightError) {
    console.error(`Insight error [${error.code}]: ${error.message}`);
  } else {
    throw error; // Unknown error, re-throw
  }
}
```

---

## Security

### Row-Level Security (RLS)

All tables enforce Supabase RLS ensuring ventures can only access their own insights:

- **Venture isolation**: Users can only query/modify insights belonging to ventures they are members of. The `venture_members` join table is used for all RLS policies.
- **No cross-venture leakage**: Even when querying by insight ID directly, RLS ensures the requesting user is a member of the insight's venture.
- **Service role bypass**: Background analysis runs use the Supabase service role, which bypasses RLS for write operations. Read operations through the API always use the user's JWT.

### Data Sensitivity

- **Insight narratives** may contain specific business metrics and operational details. These are scoped to the venture and should not be exposed in shared/public contexts.
- **Alert rule targets** (email addresses, Slack channels, webhook URLs) are stored encrypted at rest using the venture's encryption key.
- **Feedback data** is anonymized before being used for model improvement across ventures.

### Rate Limiting

| Operation | Limit | Window |
|-----------|-------|--------|
| `analyzeVenture` | 10 requests | per hour per venture |
| `analyzeMetric` | 30 requests | per hour per venture |
| `getFeed` | 100 requests | per minute per user |
| `search` | 50 requests | per minute per user |
| `createAlertRule` | 20 rules | per venture total |
| `getDigest` | 10 requests | per hour per venture |
| `exportInsights` | 5 requests | per hour per venture |

### Input Validation

- All inputs are validated through Zod schemas before processing.
- Metric IDs and venture IDs are validated as UUIDs.
- Free-text fields (search queries, comments, notes) are sanitized to prevent XSS.
- Alert rule conditions are validated against the allowed field/operator combinations.
- LLM prompts are constructed server-side; user input is interpolated into safe template positions only.
- Export size limits prevent memory exhaustion from overly broad queries.

### Audit Trail

All insight interactions (dismiss, bookmark, resolve, feedback) are logged in the `insight_feedback` and insight state columns with timestamps and user IDs for full auditability. Analysis runs are tracked in `insight_analysis_runs` with complete configuration and result metadata.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `INSIGHTS_ENABLED` | No | `true` | Master toggle for the insights module. Set to `false` to disable all insight generation. |
| `INSIGHTS_SCHEDULER_ENABLED` | No | `true` | Whether the automated scheduler runs. Disable for manual-only analysis. |
| `INSIGHTS_HOURLY_SCAN` | No | `true` | Enable hourly anomaly scanning. |
| `INSIGHTS_DAILY_DIGEST` | No | `true` | Enable daily digest generation. |
| `INSIGHTS_WEEKLY_REPORT` | No | `true` | Enable weekly report generation. |
| `INSIGHTS_MAX_CONCURRENT_PIPELINES` | No | `4` | Maximum concurrent analysis pipelines per venture. |
| `INSIGHTS_DEFAULT_LOOKBACK_DAYS` | No | `30` | Default lookback window for analysis in days. |
| `INSIGHTS_MIN_DATA_POINTS` | No | `14` | Minimum data points required before analysis runs. |
| `INSIGHTS_MAX_PER_RUN` | No | `50` | Maximum insights generated per analysis run (flood prevention). |
| `INSIGHTS_DEDUP_WINDOW_HOURS` | No | `24` | Window in hours for insight deduplication. |
| `INSIGHTS_ANOMALY_SENSITIVITY` | No | `medium` | Default anomaly detection sensitivity (`low`, `medium`, `high`). |
| `INSIGHTS_ANOMALY_BASELINE_DAYS` | No | `90` | Number of days used for anomaly baseline calculation. |
| `INSIGHTS_TREND_MIN_R2` | No | `0.3` | Minimum R² to report a trend as significant. |
| `INSIGHTS_FORECAST_CONFIDENCE` | No | `0.95` | Confidence level for forecast intervals. |
| `INSIGHTS_FORECAST_MAX_HORIZON` | No | `90` | Maximum forecast horizon in days. |
| `INSIGHTS_RCA_MAX_DEPTH` | No | `3` | Maximum root cause decomposition depth. |
| `INSIGHTS_RCA_MIN_CONTRIBUTION` | No | `0.05` | Minimum factor contribution to report (0-1). |
| `INSIGHTS_OPPORTUNITY_ENABLED` | No | `true` | Enable opportunity scoring (computationally expensive). |
| `INSIGHTS_NARRATION_MODEL` | No | `gpt-4o` | LLM model for narrative generation (via `@mcv/intelligence`). |
| `INSIGHTS_NARRATION_MAX_TOKENS` | No | `2000` | Maximum tokens for narrative generation. |
| `INSIGHTS_NARRATION_TEMPERATURE` | No | `0.3` | Temperature for narrative generation. |
| `INSIGHTS_NARRATION_TONE` | No | `professional` | Narrative tone (`professional`, `conversational`, `technical`, `executive`). |
| `INSIGHTS_ALERT_MAX_RULES_PER_VENTURE` | No | `20` | Maximum alert rules per venture. |
| `INSIGHTS_ALERT_DEFAULT_COOLDOWN` | No | `60` | Default alert cooldown in minutes. |
| `INSIGHTS_RECOMMENDATION_MAX_ACTIVE` | No | `25` | Maximum active recommendations per venture. |
| `INSIGHTS_RECOMMENDATION_EXPIRY_DAYS` | No | `30` | Default recommendation expiry in days. |
| `INSIGHTS_RECOMMENDATION_MIN_ROI` | No | `20` | Minimum ROI score to surface a recommendation. |
| `INSIGHTS_EXPORT_MAX_SIZE_MB` | No | `50` | Maximum export file size in megabytes. |
| `INSIGHTS_ANALYSIS_TIMEOUT_MS` | No | `300000` | Analysis run timeout in milliseconds (default 5 minutes). |
| `INSIGHTS_RATE_LIMIT_ANALYSIS_PER_HOUR` | No | `10` | Rate limit for analysis requests per venture per hour. |
| `INSIGHTS_FEEDBACK_ANONYMIZE` | No | `true` | Whether to anonymize feedback before cross-venture model training. |
| `SUPABASE_URL` | Yes | — | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key (for background analysis). |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/analytics/metrics` | Source of all metric data, time series, and aggregations. The insights module reads from metrics but never writes. |
| `@mcv/intelligence` | LLM orchestration for natural language insight generation, root cause interpretation, and recommendation narratives. |
| `@mcv/trpc` | tRPC router and procedure definitions, middleware, and context types. |
| `@mcv/auth` | Authentication context, user identity, and venture membership verification. |
| `@mcv/db` | Supabase client factory, connection pooling, and database utilities. |
| `@mcv/common` | Shared types (TimeRange, UUID helpers, pagination), error base classes, and logging utilities. |
| `@mcv/notifications` | Notification delivery for alert triggers (email, Slack, webhook, in-app, SMS). |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.x` | Supabase client for PostgreSQL access and RLS-enforced queries. |
| `zod` | `^3.x` | Runtime schema validation for all inputs and configurations. |
| `simple-statistics` | `^7.x` | Statistical functions: Z-score, IQR, regression, standard deviation, percentiles. |
| `ml-isolation-forest` | `^1.x` | Isolation forest anomaly detection algorithm implementation. |
| `date-fns` | `^3.x` | Date manipulation for time ranges, periods, seasonal calculations. |
| `cron-parser` | `^4.x` | Cron expression parsing for the insight scheduler. |
| `p-limit` | `^5.x` | Concurrency control for parallel analysis pipelines. |
| `p-retry` | `^6.x` | Retry logic for transient failures (LLM calls, database timeouts). |
| `nanoid` | `^5.x` | Short ID generation for deduplication keys and export filenames. |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnomalyDetector } from '../detection/anomaly-detector';
import { ZScoreDetector } from '../detection/algorithms/z-score';

describe('ZScoreDetector', () => {
  it('detects a point anomaly when value exceeds threshold', () => {
    const detector = new ZScoreDetector({ threshold: 3.0 });
    const data = [10, 12, 11, 10, 13, 11, 12, 10, 11, 50]; // 50 is anomalous
    const baseline = { mean: 11.1, stdDev: 1.1 };

    const result = detector.evaluate(50, baseline);

    expect(result.isAnomaly).toBe(true);
    expect(result.score).toBeGreaterThan(3.0);
    expect(result.direction).toBe('spike');
  });

  it('does not flag normal variation', () => {
    const detector = new ZScoreDetector({ threshold: 3.0 });
    const baseline = { mean: 100, stdDev: 10 };

    const result = detector.evaluate(115, baseline);

    expect(result.isAnomaly).toBe(false);
    expect(result.score).toBeLessThan(3.0);
  });

  it('detects drops as well as spikes', () => {
    const detector = new ZScoreDetector({ threshold: 3.0 });
    const baseline = { mean: 100, stdDev: 5 };

    const result = detector.evaluate(70, baseline);

    expect(result.isAnomaly).toBe(true);
    expect(result.direction).toBe('drop');
    expect(result.score).toBeGreaterThan(3.0);
  });
});

describe('AnomalyDetector (ensemble)', () => {
  const mockMetrics = {
    getTimeSeries: vi.fn(),
    getDimensionBreakdown: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs all configured algorithms and merges results', async () => {
    const detector = new AnomalyDetector(mockMetrics as any, {
      algorithms: ['z_score', 'iqr'],
      sensitivity: 'medium',
      minimumDataPoints: 14,
      baselineDays: 30,
      seasonalAdjustment: false,
    });

    mockMetrics.getTimeSeries.mockResolvedValue({
      dataPoints: Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(2025, 0, i + 1),
        value: i === 29 ? 500 : 100 + Math.random() * 10,
      })),
    });

    const results = await detector.detect('v1', 'm1', {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-30'),
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].rawScores).toHaveProperty('z_score');
    expect(results[0].rawScores).toHaveProperty('iqr');
  });

  it('returns empty array when data is below minimum threshold', async () => {
    const detector = new AnomalyDetector(mockMetrics as any, {
      algorithms: ['z_score'],
      sensitivity: 'medium',
      minimumDataPoints: 30,
      baselineDays: 30,
      seasonalAdjustment: false,
    });

    mockMetrics.getTimeSeries.mockResolvedValue({
      dataPoints: Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(2025, 0, i + 1),
        value: 100,
      })),
    });

    await expect(
      detector.detect('v1', 'm1', {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-10'),
      }),
    ).rejects.toThrow(InsufficientDataError);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestSupabase, seedTestVenture } from '@mcv/test-utils';
import { InsightService } from '../service/insight-service';

describe('InsightService integration', () => {
  let supabase: SupabaseClient;
  let service: InsightService;
  let ventureId: string;

  beforeAll(async () => {
    supabase = createTestSupabase();
    const venture = await seedTestVenture(supabase, {
      metrics: [
        { name: 'revenue', values: generateTimeSeriesWithAnomaly(90) },
        { name: 'signups', values: generateGrowingTimeSeries(90) },
        { name: 'churn_rate', values: generateStableTimeSeries(90) },
      ],
    });
    ventureId = venture.id;

    service = new InsightService(supabase, mockIntelligence, mockMetrics, {
      maxConcurrentPipelines: 2,
      defaultLookbackDays: 30,
      enabledAlgorithms: ['z_score', 'iqr'],
      minimumDataPoints: 14,
      narrationModel: 'gpt-4o',
      maxInsightsPerRun: 20,
      deduplicationWindowHours: 24,
      enableOpportunityScoring: false,
    });
  });

  afterAll(async () => {
    await cleanupTestVenture(supabase, ventureId);
  });

  it('discovers anomalies in seeded metric data', async () => {
    const result = await service.analyzeVenture(ventureId, {
      lookbackDays: 30,
    });

    expect(result.insightsCreated).toBeGreaterThan(0);

    const anomalies = result.insights.filter(i => i.type === 'anomaly');
    expect(anomalies.length).toBeGreaterThan(0);

    // Verify the anomaly targets the revenue metric
    const revenueAnomaly = anomalies.find(a =>
      a.primaryMetricName === 'revenue'
    );
    expect(revenueAnomaly).toBeDefined();
    expect(revenueAnomaly!.severity).toMatch(/critical|high/);
  });

  it('detects growth trends in signup data', async () => {
    const result = await service.analyzeVenture(ventureId);

    const trends = result.insights.filter(i => i.type === 'trend');
    const signupTrend = trends.find(t =>
      t.primaryMetricName === 'signups'
    );

    expect(signupTrend).toBeDefined();
    expect(signupTrend!.data.direction).toMatch(/growth/);
  });

  it('persists insights to the database', async () => {
    await service.analyzeVenture(ventureId);

    const feed = await service.getFeed(ventureId, { limit: 50 });
    expect(feed.totalCount).toBeGreaterThan(0);
    expect(feed.insights[0]).toHaveProperty('id');
    expect(feed.insights[0]).toHaveProperty('narrative');
  });

  it('deduplicates insights within the window', async () => {
    // Run analysis twice in quick succession
    const result1 = await service.analyzeVenture(ventureId);
    const result2 = await service.analyzeVenture(ventureId);

    // Second run should deduplicate most insights
    expect(result2.insightsDeduplicated).toBeGreaterThan(0);
    expect(result2.insightsCreated).toBeLessThan(result1.insightsCreated);
  });

  it('supports dismissing and bookmarking insights', async () => {
    const feed = await service.getFeed(ventureId, { limit: 1 });
    const insightId = feed.insights[0].id;

    // Dismiss
    await service.dismissInsight(insightId, 'Not relevant');
    const dismissed = await service.getInsightById(insightId);
    expect(dismissed!.interactions.dismissed).toBe(true);
    expect(dismissed!.status).toBe('dismissed');

    // Bookmark another
    const feed2 = await service.getFeed(ventureId, {
      limit: 1,
      statuses: ['active'],
    });
    if (feed2.insights.length > 0) {
      await service.bookmarkInsight(feed2.insights[0].id, 'Review later');
      const bookmarked = await service.getInsightById(feed2.insights[0].id);
      expect(bookmarked!.interactions.bookmarked).toBe(true);
    }
  });
});
```

### Alert Rule Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { AlertRuleEngine } from '../alerts/alert-rule-engine';

describe('AlertRuleEngine', () => {
  const mockDb = { from: vi.fn() };
  const mockNotifier = { send: vi.fn() };

  it('triggers when all conditions match (AND logic)', async () => {
    const engine = new AlertRuleEngine(mockDb as any, mockNotifier as any);

    const rule: AlertRule = {
      id: 'rule-1',
      ventureId: 'v1',
      name: 'Test Rule',
      description: '',
      enabled: true,
      conditions: [
        { field: 'insight.type', operator: 'eq', value: 'anomaly' },
        { field: 'insight.severity', operator: 'in', value: ['critical', 'high'] },
      ],
      conditionLogic: 'all',
      notifications: [{ channel: 'email', target: 'test@test.com', includeDetail: true }],
      cooldownMinutes: 60,
      maxTriggersPerDay: 10,
      createdAt: new Date(),
      lastTriggeredAt: null,
      triggerCount: 0,
      createdBy: 'user-1',
    };

    const insight: Partial<Insight> = {
      type: 'anomaly',
      severity: 'critical',
    };

    const result = await engine.evaluateRule(insight as Insight, rule);

    expect(result.matches).toBe(true);
    expect(result.details).toHaveLength(2);
    expect(result.details.every(d => d.matched)).toBe(true);
  });

  it('does not trigger when conditions do not match', async () => {
    const engine = new AlertRuleEngine(mockDb as any, mockNotifier as any);

    const rule: AlertRule = {
      id: 'rule-1',
      ventureId: 'v1',
      name: 'Test Rule',
      description: '',
      enabled: true,
      conditions: [
        { field: 'insight.severity', operator: 'eq', value: 'critical' },
      ],
      conditionLogic: 'all',
      notifications: [],
      cooldownMinutes: 60,
      maxTriggersPerDay: 10,
      createdAt: new Date(),
      lastTriggeredAt: null,
      triggerCount: 0,
      createdBy: 'user-1',
    };

    const insight: Partial<Insight> = {
      type: 'trend',
      severity: 'low',
    };

    const result = await engine.evaluateRule(insight as Insight, rule);
    expect(result.matches).toBe(false);
  });

  it('respects cooldown period', async () => {
    const engine = new AlertRuleEngine(mockDb as any, mockNotifier as any);

    const rule: AlertRule = {
      id: 'rule-1',
      ventureId: 'v1',
      name: 'Test Rule',
      description: '',
      enabled: true,
      conditions: [
        { field: 'insight.type', operator: 'eq', value: 'anomaly' },
      ],
      conditionLogic: 'all',
      notifications: [{ channel: 'email', target: 'test@test.com', includeDetail: true }],
      cooldownMinutes: 60,
      maxTriggersPerDay: 10,
      createdAt: new Date(),
      lastTriggeredAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      triggerCount: 1,
      createdBy: 'user-1',
    };

    const insight: Partial<Insight> = {
      type: 'anomaly',
      severity: 'critical',
    };

    // Should match conditions but be suppressed by cooldown
    const result = await engine.evaluateRule(insight as Insight, rule);
    expect(result.matches).toBe(true);

    // But evaluate() should not actually trigger due to cooldown
    mockDb.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [rule] }),
        }),
      }),
    });

    const triggers = await engine.evaluate(insight as Insight);
    expect(mockNotifier.send).not.toHaveBeenCalled();
  });
});
```

### Feed Query Tests

```typescript
import { describe, it, expect } from 'vitest';
import { InsightFeed } from '../feed/insight-feed';

describe('InsightFeed query building', () => {
  it('applies type filters correctly', async () => {
    const feed = new InsightFeed(mockDb as any, mockNarrator as any);

    const result = await feed.query('v1', {
      types: ['anomaly', 'trend'],
      limit: 10,
    });

    // All returned insights should be anomaly or trend type
    for (const insight of result.insights) {
      expect(['anomaly', 'trend']).toContain(insight.type);
    }
  });

  it('returns correct aggregation counts', async () => {
    const feed = new InsightFeed(mockDb as any, mockNarrator as any);

    const result = await feed.query('v1', { limit: 100 });

    // Aggregation totals should sum to totalCount
    const typeSum = Object.values(result.aggregations.byType)
      .reduce((a, b) => a + b, 0);
    expect(typeSum).toBe(result.totalCount);
  });

  it('supports cursor-based pagination', async () => {
    const feed = new InsightFeed(mockDb as any, mockNarrator as any);

    const page1 = await feed.query('v1', { limit: 5 });
    expect(page1.insights).toHaveLength(5);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).toBeTruthy();

    const page2 = await feed.query('v1', {
      limit: 5,
      cursor: page1.nextCursor!,
    });

    // No overlap between pages
    const page1Ids = new Set(page1.insights.map(i => i.id));
    for (const insight of page2.insights) {
      expect(page1Ids.has(insight.id)).toBe(false);
    }
  });

  it('excludes dismissed insights by default', async () => {
    const feed = new InsightFeed(mockDb as any, mockNarrator as any);

    const result = await feed.query('v1', {});

    for (const insight of result.insights) {
      expect(insight.status).not.toBe('dismissed');
    }
  });

  it('includes dismissed when requested', async () => {
    const feed = new InsightFeed(mockDb as any, mockNarrator as any);

    const result = await feed.query('v1', {
      includeDismissed: true,
    });

    // Should contain at least one dismissed insight (from test data)
    const hasDismissed = result.insights.some(i => i.status === 'dismissed');
    expect(hasDismissed).toBe(true);
  });
});
```

### Testing Utilities

```typescript
/**
 * Generate a time series with a planted anomaly for testing.
 */
function generateTimeSeriesWithAnomaly(
  days: number,
  anomalyDay?: number,
): Array<{ date: Date; value: number }> {
  const data = [];
  const target = anomalyDay ?? Math.floor(days * 0.8);

  for (let i = 0; i < days; i++) {
    const date = new Date(2025, 0, i + 1);
    let value = 1000 + Math.sin(i * 0.3) * 50 + (Math.random() - 0.5) * 30;

    if (i === target) {
      value *= 3; // Plant a 3x spike
    }

    data.push({ date, value: Math.round(value) });
  }

  return data;
}

/**
 * Generate a steadily growing time series for trend testing.
 */
function generateGrowingTimeSeries(
  days: number,
  dailyGrowthRate = 0.02,
): Array<{ date: Date; value: number }> {
  const data = [];
  let value = 100;

  for (let i = 0; i < days; i++) {
    const date = new Date(2025, 0, i + 1);
    value *= (1 + dailyGrowthRate + (Math.random() - 0.5) * 0.01);
    data.push({ date, value: Math.round(value) });
  }

  return data;
}

/**
 * Generate a stable time series with low variance.
 */
function generateStableTimeSeries(
  days: number,
  baseValue = 5.2,
): Array<{ date: Date; value: number }> {
  const data = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(2025, 0, i + 1);
    const value = baseValue + (Math.random() - 0.5) * 0.4;
    data.push({ date, value: Math.round(value * 100) / 100 });
  }

  return data;
}
```

### Test Coverage Targets

| Area | Target | Notes |
|------|--------|-------|
| Anomaly detection algorithms | 95% | Each algorithm tested independently with known anomaly patterns |
| Trend analysis | 90% | Test with linear, exponential, seasonal, and flat patterns |
| Root cause decomposition | 85% | Test with multi-dimensional data and known contributing factors |
| Alert rule evaluation | 95% | All operators, condition logic, cooldown, and throttling |
| Feed query building | 90% | All filter combinations, pagination, sorting, aggregations |
| Insight deduplication | 90% | Exact matches, near-matches, time window boundaries |
| Recommendation engine | 80% | Rule-based generation, impact estimation, ranking |
| Natural language generation | 70% | Mock LLM responses; test prompt construction and response parsing |
| tRPC router | 85% | Input validation, authorization, error handling |
| Database operations | 80% | CRUD, RLS enforcement, index usage, constraint validation |

### Running Tests

```bash
# Run all insight module tests
pnpm vitest run --project analytics-insights

# Run with coverage
pnpm vitest run --project analytics-insights --coverage

# Run specific test file
pnpm vitest run src/detection/algorithms/z-score.test.ts

# Run in watch mode during development
pnpm vitest watch --project analytics-insights

# Run integration tests only (requires test database)
pnpm vitest run --project analytics-insights --testPathPattern="integration"
```

---

## Performance Considerations

### Analysis Pipeline Optimization

- **Parallel execution**: The `InsightEngine` runs anomaly detection, trend analysis, and opportunity scoring in parallel using `p-limit` for concurrency control. Only root cause analysis waits for anomaly results (dependency).
- **Incremental analysis**: Hourly scans only analyze the delta since the last run, not the full lookback window. This reduces data volume by ~95% for frequent scans.
- **Metric prioritization**: Metrics are analyzed in priority order (revenue > growth > engagement > other). If the analysis times out, high-priority metrics have already been processed.
- **Baseline caching**: Statistical baselines (mean, stddev, seasonal decomposition) are cached in Redis with venture-scoped keys and TTLs matching the analysis schedule.
- **Batch LLM calls**: The `InsightNarrator` batches multiple insight narratives into a single LLM call where possible, reducing API round-trips by ~60%.

### Database Performance

- **Cursor-based pagination**: All feed queries use cursor-based pagination (keyset pagination on `(discovered_at, id)`) instead of OFFSET for consistent performance regardless of page depth.
- **Partial indexes**: The `expires_at` index only covers active insights, and the `unacknowledged` trigger index only covers unacknowledged rows, keeping index sizes small.
- **JSONB indexing**: The `data` column uses `jsonb_path_ops` GIN indexing for efficient queries against insight type-specific fields.
- **Full-text search**: The `search_vector` TSVECTOR column with weighted terms (title=A, narrative=B, metric=C) enables fast full-text search without external search infrastructure.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2025-01-15 | Initial module structure, anomaly detection (Z-score, IQR) |
| 0.2.0 | 2025-02-01 | Added trend analysis, seasonal decomposition, growth classification |
| 0.3.0 | 2025-02-15 | Root cause analysis, dimension decomposition, causal graph |
| 0.4.0 | 2025-03-01 | Alert rules engine, notification delivery, cooldown/throttling |
| 0.5.0 | 2025-03-15 | Recommendation engine, impact estimation, ROI scoring |
| 0.6.0 | 2025-04-01 | Natural language generation via @mcv/intelligence, digest composer |
| 0.7.0 | 2025-04-15 | Insight feed with aggregations, deduplication, cursor pagination |
| 0.8.0 | 2025-05-01 | Opportunity scoring, ensemble detection, isolation forest |
| 0.9.0 | 2025-05-15 | Feedback loop, model improvement pipeline, export functionality |
| 1.0.0 | 2025-06-01 | Production release, full test coverage, performance optimization |