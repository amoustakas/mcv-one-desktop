# @mcv/people/performance

> **Performance Management** — Comprehensive performance review cycles, goal & OKR tracking, competency assessment, continuous feedback, calibration, and performance improvement plans for the MCV.ONE People platform.

**Domain:** `people` · **Module:** `performance` · **Tier:** 5 (Domain)
**Package:** `@mcv/people/performance`
**Since:** 0.12.0
**Status:** Stable

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

`@mcv/people/performance` provides a full-featured performance management system that supports configurable review cycles, goal management, competency assessment, continuous feedback, calibration, and analytics. It is designed for multi-tenant SaaS environments where organizations need fine-grained control over how they evaluate, develop, and compensate their people.

### Why This Module Exists

Performance management is the connective tissue between talent development, compensation planning, and organizational strategy. Without a unified system, organizations suffer from:

- **Disconnected reviews** — Feedback lives in spreadsheets, emails, and one-off forms with no aggregation or historical tracking
- **Goal misalignment** — Individual goals drift from team and company objectives, with no mechanism for cascading or real-time progress tracking
- **Inconsistent evaluation** — Managers apply different standards without calibration, leading to rating inflation and perceived unfairness
- **Reactive intervention** — Performance issues are identified too late; improvement plans are informal and untracked
- **Compensation guesswork** — Merit increases and bonuses are disconnected from documented performance data

This module solves these problems by providing:

1. **Configurable review cycles** with multi-rater (360°) feedback, self-assessment, and customizable question templates
2. **Goal & OKR frameworks** with cascading alignment from individual through team to company level
3. **Competency frameworks** with proficiency levels, gap analysis, and development path recommendations
4. **Continuous feedback** mechanisms including peer recognition, manager check-ins, and real-time notes
5. **Rating systems** with configurable scales, forced distribution support, and cross-team calibration
6. **Performance Improvement Plans (PIPs)** with milestone tracking, progress reviews, and outcome documentation
7. **Calibration sessions** with rating distribution views, adjustment workflows, and fairness analysis
8. **Compensation integration** with merit increase recommendations and bonus calculations based on performance data
9. **Rich analytics** covering performance distribution, goal completion, feedback frequency, and calibration impact

### Design Principles

- **Tenant isolation** — All data is scoped by `tenant_id` and enforced via Row-Level Security (RLS) policies in PostgreSQL
- **Cycle-centric architecture** — Reviews, goals, and calibration are organized around review cycles that define time boundaries and evaluation criteria
- **Role-based access** — Granular permissions control who can create cycles, submit reviews, view feedback, and approve calibration changes
- **Auditability** — Every review submission, rating change, calibration adjustment, and PIP update is logged with timestamps and actor information
- **Extensibility** — Templates, rating scales, competency frameworks, and question libraries are fully customizable per tenant

---

## Exports

```typescript
// === Primary Service ===
export { PerformanceService } from './service';

// === Review Cycles ===
export {
  createReviewCycle,
  updateReviewCycle,
  deleteReviewCycle,
  getReviewCycle,
  listReviewCycles,
  launchReviewCycle,
  closeReviewCycle,
  reopenReviewCycle,
} from './cycles';

// === Reviews ===
export {
  createReview,
  getReview,
  listReviews,
  submitReview,
  approveReview,
  rejectReview,
  reopenReview,
  getReviewSummary,
  getReviewTimeline,
} from './reviews';

// === Review Responses ===
export {
  saveReviewResponse,
  submitReviewResponse,
  getReviewResponse,
  listReviewResponses,
  getResponsesByReviewer,
  getResponsesBySubject,
} from './responses';

// === Goals ===
export {
  createGoal,
  updateGoal,
  deleteGoal,
  getGoal,
  listGoals,
  updateGoalProgress,
  completeGoal,
  cancelGoal,
  alignGoal,
  unalignGoal,
  getGoalTree,
  getGoalAlignmentMap,
} from './goals';

// === OKRs ===
export {
  createOKR,
  updateOKR,
  deleteOKR,
  getOKR,
  listOKRs,
  addKeyResult,
  updateKeyResult,
  removeKeyResult,
  updateKeyResultProgress,
  getOKRProgress,
  getOKRAlignmentTree,
} from './okrs';

// === Competencies ===
export {
  createCompetencyFramework,
  updateCompetencyFramework,
  deleteCompetencyFramework,
  getCompetencyFramework,
  listCompetencyFrameworks,
  addCompetency,
  updateCompetency,
  removeCompetency,
  assessCompetency,
  getCompetencyAssessment,
  getCompetencyGapAnalysis,
  getCompetencyHeatmap,
} from './competencies';

// === Feedback ===
export {
  createFeedbackItem,
  getFeedbackItem,
  listFeedbackItems,
  requestFeedback,
  acknowledgeFeedback,
  getFeedbackSummary,
  getFeedbackTimeline,
} from './feedback';

// === Rating Systems ===
export {
  createRatingScale,
  updateRatingScale,
  deleteRatingScale,
  getRatingScale,
  listRatingScales,
  calculateOverallRating,
  getRatingDistribution,
} from './ratings';

// === PIPs ===
export {
  createPIP,
  updatePIP,
  getPIP,
  listPIPs,
  addPIPMilestone,
  updatePIPMilestone,
  removePIPMilestone,
  completePIPMilestone,
  closePIP,
  getPIPProgress,
  getPIPTimeline,
} from './pips';

// === Calibration ===
export {
  createCalibrationSession,
  updateCalibrationSession,
  getCalibrationSession,
  listCalibrationSessions,
  addCalibrationRating,
  adjustCalibrationRating,
  finalizeCalibration,
  getCalibrationDistribution,
  getCalibrationComparison,
  exportCalibrationResults,
} from './calibration';

// === Templates ===
export {
  createReviewTemplate,
  updateReviewTemplate,
  deleteReviewTemplate,
  getReviewTemplate,
  listReviewTemplates,
  cloneReviewTemplate,
  addTemplateQuestion,
  updateTemplateQuestion,
  removeTemplateQuestion,
  reorderTemplateQuestions,
} from './templates';

// === Compensation Link ===
export {
  getCompensationRecommendation,
  calculateMeritIncrease,
  calculateBonus,
  getPerformanceCompensationMap,
  exportCompensationReport,
} from './compensation';

// === Analytics ===
export {
  PerformanceAnalytics,
  getPerformanceDistribution,
  getGoalCompletionRates,
  getFeedbackFrequency,
  getReviewCompletionStats,
  getCalibrationImpact,
  getPerformanceTrends,
  getTeamPerformanceSummary,
  getOrganizationPerformanceDashboard,
} from './analytics';

// === Types ===
export type {
  // Core entities
  ReviewCycle,
  ReviewCycleConfig,
  ReviewCycleStatus,
  ReviewCycleFrequency,
  Review,
  ReviewStatus,
  ReviewType,
  ReviewResponse,
  ReviewResponseStatus,

  // Goals & OKRs
  Goal,
  GoalStatus,
  GoalPriority,
  GoalAlignment,
  OKR,
  OKRStatus,
  KeyResult,
  KeyResultType,

  // Competencies
  CompetencyFramework,
  Competency,
  CompetencyLevel,
  CompetencyAssessment,
  CompetencyGap,

  // Feedback
  FeedbackItem,
  FeedbackType,
  FeedbackVisibility,
  FeedbackRequest,

  // Ratings
  RatingScale,
  RatingLevel,
  RatingValue,
  OverallRating,
  RatingDistribution,

  // PIPs
  PIP,
  PIPStatus,
  PIPMilestone,
  PIPMilestoneStatus,
  PIPOutcome,

  // Calibration
  CalibrationSession,
  CalibrationSessionStatus,
  CalibrationRating,
  CalibrationAdjustment,
  CalibrationDistribution,

  // Templates
  ReviewTemplate,
  TemplateQuestion,
  QuestionType,
  QuestionConfig,

  // Compensation
  CompensationRecommendation,
  MeritIncreaseParams,
  BonusCalculationParams,

  // Analytics
  PerformanceDistribution,
  GoalCompletionRate,
  FeedbackFrequencyData,
  ReviewCompletionStats,
  CalibrationImpactData,
  PerformanceTrend,
  TeamPerformanceSummary,

  // Service
  PerformanceServiceConfig,
  PerformanceContext,
} from './types';

// === Router ===
export { performanceRouter } from './router';

// === Schemas (Drizzle) ===
export {
  reviewCyclesTable,
  reviewsTable,
  reviewResponsesTable,
  goalsTable,
  okrsTable,
  keyResultsTable,
  competencyFrameworksTable,
  competenciesTable,
  competencyAssessmentsTable,
  feedbackItemsTable,
  feedbackRequestsTable,
  pipsTable,
  pipMilestonesTable,
  calibrationSessionsTable,
  calibrationRatingsTable,
  reviewTemplatesTable,
  templateQuestionsTable,
  ratingScalesTable,
  ratingLevelsTable,
} from './schema';
```

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     @mcv/people/performance                         │
│                                                                     │
│  ┌─────────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────┐  │
│  │   Review     │  │  Goal &   │  │Competency│  │  Continuous   │  │
│  │   Cycles     │  │   OKR     │  │Framework │  │   Feedback    │  │
│  │  Management  │  │ Tracking  │  │Assessment│  │   Engine      │  │
│  └──────┬───────┘  └─────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│         │                │              │               │           │
│  ┌──────┴───────┐  ┌─────┴─────┐  ┌────┴─────┐  ┌──────┴────────┐  │
│  │   Review     │  │  Rating   │  │   PIP    │  │  Calibration  │  │
│  │  Templates   │  │  Systems  │  │  Engine  │  │    Engine     │  │
│  └──────┬───────┘  └─────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│         │                │              │               │           │
│         └────────────────┴──────┬───────┴───────────────┘           │
│                                 │                                   │
│                    ┌────────────┴────────────┐                      │
│                    │  PerformanceService      │                      │
│                    │  (Unified Orchestrator)  │                      │
│                    └────────────┬────────────┘                      │
│                                 │                                   │
│              ┌──────────────────┼──────────────────┐                │
│              │                  │                   │                │
│    ┌─────────┴──────┐  ┌───────┴───────┐  ┌───────┴──────────┐    │
│    │  Compensation   │  │   Analytics   │  │   Notification   │    │
│    │     Link        │  │    Engine     │  │     Bridge       │    │
│    └─────────────────┘  └───────────────┘  └──────────────────┘    │
│                                                                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                        │
┌───────┴────────┐   ┌─────────┴──────────┐   ┌────────┴─────────┐
│  Supabase PG   │   │  @mcv/people/core  │   │  @mcv/platform   │
│  (RLS-enabled) │   │  (Employee data)   │   │  (Auth, Tenancy) │
└────────────────┘   └────────────────────┘   └──────────────────┘
```

### Module Decomposition

The performance module is organized into cohesive submodules, each responsible for a distinct capability:

| Submodule | Responsibility | Key Tables |
|-----------|---------------|------------|
| **cycles** | Review cycle lifecycle (create, launch, close, reopen) | `review_cycles` |
| **reviews** | Individual review management, approval workflow | `reviews`, `review_responses` |
| **goals** | SMART goal setting, progress tracking, alignment | `goals` |
| **okrs** | OKR framework with key results and progress | `okrs`, `key_results` |
| **competencies** | Competency frameworks, assessment, gap analysis | `competency_frameworks`, `competencies`, `competency_assessments` |
| **feedback** | Continuous feedback, recognition, check-ins | `feedback_items`, `feedback_requests` |
| **ratings** | Configurable rating scales, distribution analysis | `rating_scales`, `rating_levels` |
| **pips** | Performance improvement plans, milestone tracking | `pips`, `pip_milestones` |
| **calibration** | Cross-team calibration sessions, fairness analysis | `calibration_sessions`, `calibration_ratings` |
| **templates** | Review templates, question libraries | `review_templates`, `template_questions` |
| **compensation** | Performance-to-compensation mapping | References external comp tables |
| **analytics** | Performance metrics, trends, dashboards | Aggregates across all tables |

### Data Flow: Review Cycle Lifecycle

```
                        ┌──────────┐
                        │  DRAFT   │
                        └────┬─────┘
                             │ launchReviewCycle()
                             ▼
                      ┌──────────────┐
                      │   LAUNCHED   │ ← Reviews created for all participants
                      └──────┬───────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌───────────┐ ┌───────────┐ ┌───────────┐
        │Self-Review│ │Peer Review│ │Mgr Review │
        │ (Draft)   │ │ (Draft)   │ │ (Draft)   │
        └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
              │              │              │
              ▼              ▼              ▼
        ┌───────────┐ ┌───────────┐ ┌───────────┐
        │ Submitted │ │ Submitted │ │ Submitted │
        └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   CALIBRATION   │ ← Optional calibration phase
                    └────────┬────────┘
                             │ finalizeCalibration()
                             ▼
                    ┌─────────────────┐
                    │   COMPLETED     │ ← Results shared with employees
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  COMPENSATION   │ ← Merit/bonus recommendations
                    └─────────────────┘
```

### Goal Alignment Architecture

```
┌────────────────────────────────────────────────────┐
│                  COMPANY LEVEL                      │
│                                                     │
│   ┌──────────────────────────────────────────┐     │
│   │ OKR: Increase revenue by 40% this year   │     │
│   └────────┬─────────────────────┬───────────┘     │
│            │                     │                  │
├────────────┼─────────────────────┼──────────────────┤
│            │   TEAM LEVEL        │                  │
│            ▼                     ▼                  │
│  ┌─────────────────┐  ┌──────────────────┐         │
│  │ OKR: Expand to  │  │ OKR: Launch new  │         │
│  │ 3 new markets   │  │ product line     │         │
│  └───┬─────────┬───┘  └───┬──────────────┘         │
│      │         │           │                        │
├──────┼─────────┼───────────┼────────────────────────┤
│      │  INDIVIDUAL LEVEL   │                        │
│      ▼         ▼           ▼                        │
│  ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │Goal: EU│ │Goal:   │ │Goal:   │                  │
│  │market  │ │APAC    │ │MVP by  │                  │
│  │launch  │ │market  │ │Q2      │                  │
│  └────────┘ └────────┘ └────────┘                  │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Integration Points

| Integration | Direction | Description |
|-------------|-----------|-------------|
| `@mcv/people/core` | Inbound | Employee data, org hierarchy, reporting lines |
| `@mcv/people/compensation` | Outbound | Merit increase and bonus recommendations |
| `@mcv/people/learning` | Outbound | Development plan creation from competency gaps |
| `@mcv/people/recruiting` | Inbound | Competency frameworks shared for job matching |
| `@mcv/platform/auth` | Inbound | Authentication, role resolution, permission checks |
| `@mcv/platform/notifications` | Outbound | Review reminders, feedback requests, PIP alerts |
| `@mcv/platform/audit` | Outbound | All performance actions logged for compliance |
| `@mcv/platform/files` | Outbound | Document attachments on reviews, PIPs, feedback |

---

## Core Interfaces

### PerformanceService

The unified orchestrator that coordinates all performance management operations. All operations are tenant-scoped and permission-checked.

```typescript
interface PerformanceService {
  // === Review Cycles ===
  createReviewCycle(params: CreateReviewCycleParams): Promise<ReviewCycle>;
  updateReviewCycle(cycleId: string, params: UpdateReviewCycleParams): Promise<ReviewCycle>;
  deleteReviewCycle(cycleId: string): Promise<void>;
  getReviewCycle(cycleId: string): Promise<ReviewCycle>;
  listReviewCycles(params?: ListReviewCyclesParams): Promise<PaginatedResult<ReviewCycle>>;
  launchReviewCycle(cycleId: string, params?: LaunchParams): Promise<ReviewCycle>;
  closeReviewCycle(cycleId: string): Promise<ReviewCycle>;
  reopenReviewCycle(cycleId: string, reason: string): Promise<ReviewCycle>;

  // === Reviews ===
  createReview(params: CreateReviewParams): Promise<Review>;
  getReview(reviewId: string): Promise<Review>;
  listReviews(params?: ListReviewsParams): Promise<PaginatedResult<Review>>;
  submitReview(reviewId: string): Promise<Review>;
  approveReview(reviewId: string, comments?: string): Promise<Review>;
  rejectReview(reviewId: string, reason: string): Promise<Review>;
  reopenReview(reviewId: string, reason: string): Promise<Review>;
  getReviewSummary(subjectId: string, cycleId: string): Promise<ReviewSummary>;
  getReviewTimeline(subjectId: string): Promise<ReviewTimelineEntry[]>;

  // === Review Responses ===
  saveReviewResponse(params: SaveResponseParams): Promise<ReviewResponse>;
  submitReviewResponse(responseId: string): Promise<ReviewResponse>;
  getReviewResponse(responseId: string): Promise<ReviewResponse>;
  listReviewResponses(reviewId: string): Promise<ReviewResponse[]>;

  // === Goals ===
  createGoal(params: CreateGoalParams): Promise<Goal>;
  updateGoal(goalId: string, params: UpdateGoalParams): Promise<Goal>;
  deleteGoal(goalId: string): Promise<void>;
  getGoal(goalId: string): Promise<Goal>;
  listGoals(params?: ListGoalsParams): Promise<PaginatedResult<Goal>>;
  updateGoalProgress(goalId: string, progress: number, note?: string): Promise<Goal>;
  completeGoal(goalId: string, outcome?: string): Promise<Goal>;
  cancelGoal(goalId: string, reason: string): Promise<Goal>;
  alignGoal(goalId: string, parentGoalId: string): Promise<Goal>;
  unalignGoal(goalId: string): Promise<Goal>;
  getGoalTree(rootGoalId: string): Promise<GoalTreeNode>;
  getGoalAlignmentMap(cycleId: string): Promise<GoalAlignmentMap>;

  // === OKRs ===
  createOKR(params: CreateOKRParams): Promise<OKR>;
  updateOKR(okrId: string, params: UpdateOKRParams): Promise<OKR>;
  deleteOKR(okrId: string): Promise<void>;
  getOKR(okrId: string): Promise<OKR>;
  listOKRs(params?: ListOKRsParams): Promise<PaginatedResult<OKR>>;
  addKeyResult(okrId: string, params: CreateKeyResultParams): Promise<KeyResult>;
  updateKeyResult(keyResultId: string, params: UpdateKeyResultParams): Promise<KeyResult>;
  removeKeyResult(keyResultId: string): Promise<void>;
  updateKeyResultProgress(keyResultId: string, currentValue: number, note?: string): Promise<KeyResult>;
  getOKRProgress(okrId: string): Promise<OKRProgress>;
  getOKRAlignmentTree(params?: OKRAlignmentParams): Promise<OKRAlignmentNode>;

  // === Competencies ===
  createCompetencyFramework(params: CreateFrameworkParams): Promise<CompetencyFramework>;
  updateCompetencyFramework(frameworkId: string, params: UpdateFrameworkParams): Promise<CompetencyFramework>;
  deleteCompetencyFramework(frameworkId: string): Promise<void>;
  getCompetencyFramework(frameworkId: string): Promise<CompetencyFramework>;
  listCompetencyFrameworks(params?: ListFrameworksParams): Promise<PaginatedResult<CompetencyFramework>>;
  addCompetency(frameworkId: string, params: CreateCompetencyParams): Promise<Competency>;
  updateCompetency(competencyId: string, params: UpdateCompetencyParams): Promise<Competency>;
  removeCompetency(competencyId: string): Promise<void>;
  assessCompetency(params: AssessCompetencyParams): Promise<CompetencyAssessment>;
  getCompetencyAssessment(employeeId: string, frameworkId: string): Promise<CompetencyAssessment[]>;
  getCompetencyGapAnalysis(employeeId: string, targetRoleId?: string): Promise<CompetencyGap[]>;
  getCompetencyHeatmap(params: HeatmapParams): Promise<CompetencyHeatmap>;

  // === Feedback ===
  createFeedbackItem(params: CreateFeedbackParams): Promise<FeedbackItem>;
  getFeedbackItem(feedbackId: string): Promise<FeedbackItem>;
  listFeedbackItems(params?: ListFeedbackParams): Promise<PaginatedResult<FeedbackItem>>;
  requestFeedback(params: RequestFeedbackParams): Promise<FeedbackRequest>;
  acknowledgeFeedback(feedbackId: string): Promise<FeedbackItem>;
  getFeedbackSummary(employeeId: string, dateRange?: DateRange): Promise<FeedbackSummary>;
  getFeedbackTimeline(employeeId: string, params?: TimelineParams): Promise<FeedbackTimelineEntry[]>;

  // === Rating Systems ===
  createRatingScale(params: CreateRatingScaleParams): Promise<RatingScale>;
  updateRatingScale(scaleId: string, params: UpdateRatingScaleParams): Promise<RatingScale>;
  deleteRatingScale(scaleId: string): Promise<void>;
  getRatingScale(scaleId: string): Promise<RatingScale>;
  listRatingScales(): Promise<RatingScale[]>;
  calculateOverallRating(reviewId: string): Promise<OverallRating>;
  getRatingDistribution(cycleId: string, params?: DistributionParams): Promise<RatingDistribution>;

  // === PIPs ===
  createPIP(params: CreatePIPParams): Promise<PIP>;
  updatePIP(pipId: string, params: UpdatePIPParams): Promise<PIP>;
  getPIP(pipId: string): Promise<PIP>;
  listPIPs(params?: ListPIPsParams): Promise<PaginatedResult<PIP>>;
  addPIPMilestone(pipId: string, params: CreateMilestoneParams): Promise<PIPMilestone>;
  updatePIPMilestone(milestoneId: string, params: UpdateMilestoneParams): Promise<PIPMilestone>;
  removePIPMilestone(milestoneId: string): Promise<void>;
  completePIPMilestone(milestoneId: string, evidence?: string): Promise<PIPMilestone>;
  closePIP(pipId: string, outcome: PIPOutcome, notes: string): Promise<PIP>;
  getPIPProgress(pipId: string): Promise<PIPProgressReport>;
  getPIPTimeline(pipId: string): Promise<PIPTimelineEntry[]>;

  // === Calibration ===
  createCalibrationSession(params: CreateCalibrationParams): Promise<CalibrationSession>;
  updateCalibrationSession(sessionId: string, params: UpdateCalibrationParams): Promise<CalibrationSession>;
  getCalibrationSession(sessionId: string): Promise<CalibrationSession>;
  listCalibrationSessions(params?: ListCalibrationParams): Promise<PaginatedResult<CalibrationSession>>;
  addCalibrationRating(sessionId: string, params: AddCalibrationRatingParams): Promise<CalibrationRating>;
  adjustCalibrationRating(ratingId: string, params: AdjustRatingParams): Promise<CalibrationRating>;
  finalizeCalibration(sessionId: string): Promise<CalibrationSession>;
  getCalibrationDistribution(sessionId: string): Promise<CalibrationDistribution>;
  getCalibrationComparison(sessionId: string): Promise<CalibrationComparison>;
  exportCalibrationResults(sessionId: string, format: ExportFormat): Promise<ExportResult>;

  // === Templates ===
  createReviewTemplate(params: CreateTemplateParams): Promise<ReviewTemplate>;
  updateReviewTemplate(templateId: string, params: UpdateTemplateParams): Promise<ReviewTemplate>;
  deleteReviewTemplate(templateId: string): Promise<void>;
  getReviewTemplate(templateId: string): Promise<ReviewTemplate>;
  listReviewTemplates(params?: ListTemplatesParams): Promise<PaginatedResult<ReviewTemplate>>;
  cloneReviewTemplate(templateId: string, name: string): Promise<ReviewTemplate>;
  addTemplateQuestion(templateId: string, params: CreateQuestionParams): Promise<TemplateQuestion>;
  updateTemplateQuestion(questionId: string, params: UpdateQuestionParams): Promise<TemplateQuestion>;
  removeTemplateQuestion(questionId: string): Promise<void>;
  reorderTemplateQuestions(templateId: string, questionIds: string[]): Promise<void>;

  // === Compensation Link ===
  getCompensationRecommendation(employeeId: string, cycleId: string): Promise<CompensationRecommendation>;
  calculateMeritIncrease(params: MeritIncreaseParams): Promise<MeritIncreaseResult>;
  calculateBonus(params: BonusCalculationParams): Promise<BonusResult>;
  getPerformanceCompensationMap(cycleId: string): Promise<PerformanceCompensationMap>;
  exportCompensationReport(cycleId: string, format: ExportFormat): Promise<ExportResult>;

  // === Analytics ===
  getPerformanceDistribution(cycleId: string, params?: DistributionParams): Promise<PerformanceDistribution>;
  getGoalCompletionRates(params: GoalCompletionParams): Promise<GoalCompletionRate[]>;
  getFeedbackFrequency(params: FeedbackFrequencyParams): Promise<FeedbackFrequencyData>;
  getReviewCompletionStats(cycleId: string): Promise<ReviewCompletionStats>;
  getCalibrationImpact(sessionId: string): Promise<CalibrationImpactData>;
  getPerformanceTrends(employeeId: string, params?: TrendParams): Promise<PerformanceTrend[]>;
  getTeamPerformanceSummary(managerId: string, cycleId: string): Promise<TeamPerformanceSummary>;
  getOrganizationPerformanceDashboard(cycleId: string): Promise<OrgPerformanceDashboard>;
}
```

### ReviewCycle

Represents a time-bounded performance evaluation period with configurable parameters.

```typescript
interface ReviewCycle {
  /** Unique identifier */
  id: string;
  /** Tenant scope */
  tenantId: string;
  /** Human-readable name (e.g., "2025 Annual Review") */
  name: string;
  /** Optional description */
  description: string | null;
  /** Cycle frequency */
  frequency: ReviewCycleFrequency;
  /** Current lifecycle status */
  status: ReviewCycleStatus;
  /** Cycle configuration */
  config: ReviewCycleConfig;
  /** Period start date */
  periodStart: Date;
  /** Period end date */
  periodEnd: Date;
  /** Review submission deadline */
  reviewDeadline: Date;
  /** Calibration deadline (if applicable) */
  calibrationDeadline: Date | null;
  /** Rating scale used for this cycle */
  ratingScaleId: string;
  /** Review template used for this cycle */
  templateId: string;
  /** Participant selection criteria */
  participantCriteria: ParticipantCriteria;
  /** Number of reviews created */
  reviewCount: number;
  /** Number of reviews submitted */
  submittedCount: number;
  /** Number of reviews completed (approved/calibrated) */
  completedCount: number;
  /** Who created this cycle */
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  launchedAt: Date | null;
  closedAt: Date | null;
}

type ReviewCycleFrequency = 'annual' | 'semi_annual' | 'quarterly' | 'monthly' | 'custom';

type ReviewCycleStatus =
  | 'draft'           // Being configured
  | 'launched'        // Active, reviews in progress
  | 'in_calibration'  // Reviews submitted, calibration underway
  | 'completed'       // Finalized and shared
  | 'archived';       // Historical record

interface ReviewCycleConfig {
  /** Enable self-assessment */
  selfAssessment: boolean;
  /** Enable peer reviews */
  peerReview: boolean;
  /** Number of peer reviewers required */
  minPeerReviewers: number;
  /** Maximum peer reviewers allowed */
  maxPeerReviewers: number;
  /** Allow employees to nominate peer reviewers */
  allowPeerNomination: boolean;
  /** Enable upward (subordinate → manager) reviews */
  upwardReview: boolean;
  /** Enable manager reviews */
  managerReview: boolean;
  /** Enable skip-level reviews */
  skipLevelReview: boolean;
  /** Require calibration before sharing results */
  requireCalibration: boolean;
  /** Enable goal assessment as part of review */
  includeGoals: boolean;
  /** Enable competency assessment as part of review */
  includeCompetencies: boolean;
  /** Allow reviewers to see other responses before submitting */
  transparentReviews: boolean;
  /** Enable anonymous peer feedback */
  anonymousPeerFeedback: boolean;
  /** Auto-remind reviewers before deadline */
  autoReminders: boolean;
  /** Days before deadline to send reminders */
  reminderDaysBefore: number[];
  /** Require manager approval before sharing */
  requireManagerApproval: boolean;
  /** Enable forced distribution for ratings */
  forcedDistribution: ForcedDistributionConfig | null;
}

interface ForcedDistributionConfig {
  /** Whether forced distribution is strictly enforced or advisory */
  mode: 'strict' | 'advisory';
  /** Target distribution per rating level (must sum to 100) */
  distribution: Record<string, number>;
  /** Allowed deviation percentage per level */
  tolerance: number;
}

interface ParticipantCriteria {
  /** Include all active employees */
  allActive: boolean;
  /** Filter by department IDs */
  departmentIds: string[];
  /** Filter by location IDs */
  locationIds: string[];
  /** Filter by employment type */
  employmentTypes: string[];
  /** Minimum tenure in months */
  minTenureMonths: number;
  /** Exclude specific employee IDs */
  excludeEmployeeIds: string[];
  /** Include specific employee IDs (overrides other filters) */
  includeEmployeeIds: string[];
}
```

### Review

An individual review linking a subject (reviewee) to a reviewer within a cycle.

```typescript
interface Review {
  id: string;
  tenantId: string;
  /** The review cycle this belongs to */
  cycleId: string;
  /** The employee being reviewed */
  subjectId: string;
  /** The person writing the review (null for self-assessment) */
  reviewerId: string | null;
  /** Type of review */
  type: ReviewType;
  /** Current status */
  status: ReviewStatus;
  /** Overall rating (after calculation/calibration) */
  overallRating: number | null;
  /** Calibrated rating (if calibration occurred) */
  calibratedRating: number | null;
  /** Manager summary/comments */
  managerSummary: string | null;
  /** Whether the subject has acknowledged the review */
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  /** Submitted timestamp */
  submittedAt: Date | null;
  /** Approved timestamp */
  approvedAt: Date | null;
  /** Approved by (manager/HR) */
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ReviewType =
  | 'self'           // Self-assessment
  | 'manager'        // Direct manager review
  | 'peer'           // Peer review
  | 'upward'         // Subordinate reviewing manager
  | 'skip_level'     // Skip-level manager review
  | 'external';      // External stakeholder review

type ReviewStatus =
  | 'pending'        // Created, not started
  | 'in_progress'    // Reviewer has started
  | 'submitted'      // Reviewer completed and submitted
  | 'approved'       // Manager/HR approved
  | 'rejected'       // Sent back for revision
  | 'calibrated'     // Rating adjusted via calibration
  | 'shared'         // Shared with the subject
  | 'acknowledged';  // Subject acknowledged receipt
```

### ReviewResponse

Individual answers within a review, corresponding to template questions.

```typescript
interface ReviewResponse {
  id: string;
  tenantId: string;
  /** Parent review */
  reviewId: string;
  /** Template question being answered */
  questionId: string;
  /** Text response */
  textResponse: string | null;
  /** Numeric rating response */
  ratingResponse: number | null;
  /** Selected options (for multi-choice questions) */
  selectedOptions: string[] | null;
  /** Response status */
  status: ReviewResponseStatus;
  /** Response metadata */
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

type ReviewResponseStatus = 'draft' | 'submitted';
```

### Goal

A performance goal with SMART criteria support and alignment capabilities.

```typescript
interface Goal {
  id: string;
  tenantId: string;
  /** Employee who owns this goal */
  ownerId: string;
  /** Associated review cycle (optional) */
  cycleId: string | null;
  /** Goal title */
  title: string;
  /** Detailed description */
  description: string;
  /** SMART criteria breakdown */
  smartCriteria: SMARTCriteria | null;
  /** Goal category */
  category: GoalCategory;
  /** Priority level */
  priority: GoalPriority;
  /** Current status */
  status: GoalStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Weight in overall goal assessment (0-100) */
  weight: number;
  /** Due date */
  dueDate: Date;
  /** Start date */
  startDate: Date;
  /** Parent goal for alignment */
  parentGoalId: string | null;
  /** Alignment level */
  alignmentLevel: GoalAlignmentLevel;
  /** Key metrics for measuring success */
  successMetrics: SuccessMetric[];
  /** Progress updates log */
  progressUpdates: GoalProgressUpdate[];
  /** Tags for categorization */
  tags: string[];
  /** Completed date */
  completedAt: Date | null;
  /** Completion outcome */
  outcome: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SMARTCriteria {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
}

type GoalCategory =
  | 'performance'     // Job performance
  | 'development'     // Personal/professional development
  | 'project'         // Project deliverable
  | 'behavioral'      // Behavioral/cultural
  | 'stretch';        // Stretch/aspirational

type GoalPriority = 'critical' | 'high' | 'medium' | 'low';

type GoalStatus =
  | 'draft'
  | 'active'
  | 'on_track'
  | 'at_risk'
  | 'behind'
  | 'completed'
  | 'cancelled'
  | 'deferred';

type GoalAlignmentLevel = 'individual' | 'team' | 'department' | 'company';

interface SuccessMetric {
  name: string;
  targetValue: number;
  currentValue: number;
  unit: string;
}

interface GoalProgressUpdate {
  date: Date;
  progress: number;
  note: string;
  updatedBy: string;
}
```

### OKR

Objectives and Key Results framework for structured goal tracking.

```typescript
interface OKR {
  id: string;
  tenantId: string;
  /** Objective owner */
  ownerId: string;
  /** Associated review cycle */
  cycleId: string | null;
  /** Objective title */
  objective: string;
  /** Objective description */
  description: string | null;
  /** Current status */
  status: OKRStatus;
  /** OKR level */
  level: OKRLevel;
  /** Time period */
  periodStart: Date;
  periodEnd: Date;
  /** Parent OKR for alignment */
  parentOKRId: string | null;
  /** Calculated progress (average of key results) */
  progress: number;
  /** Associated key results */
  keyResults: KeyResult[];
  /** Tags */
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

type OKRStatus = 'draft' | 'active' | 'completed' | 'cancelled';
type OKRLevel = 'individual' | 'team' | 'department' | 'company';

interface KeyResult {
  id: string;
  tenantId: string;
  /** Parent OKR */
  okrId: string;
  /** Key result title */
  title: string;
  /** Description */
  description: string | null;
  /** Measurement type */
  type: KeyResultType;
  /** Starting value */
  startValue: number;
  /** Target value */
  targetValue: number;
  /** Current value */
  currentValue: number;
  /** Unit of measurement */
  unit: string;
  /** Calculated progress (0-100) */
  progress: number;
  /** Weight relative to other KRs in this OKR */
  weight: number;
  /** Confidence level (0-100) */
  confidence: number;
  /** Owner (may differ from OKR owner) */
  ownerId: string;
  /** Due date */
  dueDate: Date;
  /** Progress updates */
  updates: KeyResultUpdate[];
  createdAt: Date;
  updatedAt: Date;
}

type KeyResultType =
  | 'number'          // Increase/decrease a metric to target
  | 'percentage'      // Reach a percentage target
  | 'currency'        // Monetary target
  | 'binary'          // Done/not done
  | 'milestone';      // Series of milestones

interface KeyResultUpdate {
  date: Date;
  previousValue: number;
  newValue: number;
  note: string;
  updatedBy: string;
}
```

### Competency

Competency frameworks and assessment structures.

```typescript
interface CompetencyFramework {
  id: string;
  tenantId: string;
  /** Framework name */
  name: string;
  /** Description */
  description: string | null;
  /** Version number */
  version: number;
  /** Whether this is the active version */
  isActive: boolean;
  /** Applicable roles (empty = all roles) */
  applicableRoles: string[];
  /** Applicable levels (empty = all levels) */
  applicableLevels: string[];
  /** Competencies in this framework */
  competencies: Competency[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Competency {
  id: string;
  tenantId: string;
  /** Parent framework */
  frameworkId: string;
  /** Competency name */
  name: string;
  /** Description */
  description: string;
  /** Category (e.g., "Leadership", "Technical", "Communication") */
  category: string;
  /** Sort order within framework */
  sortOrder: number;
  /** Weight in overall assessment */
  weight: number;
  /** Proficiency levels defined for this competency */
  levels: CompetencyLevel[];
  /** Behavioral indicators per level */
  behavioralIndicators: Record<string, string[]>;
  createdAt: Date;
  updatedAt: Date;
}

interface CompetencyLevel {
  /** Level number (1 = lowest) */
  level: number;
  /** Level name (e.g., "Beginner", "Intermediate", "Advanced", "Expert") */
  name: string;
  /** Description of what this level means */
  description: string;
}

interface CompetencyAssessment {
  id: string;
  tenantId: string;
  /** Employee being assessed */
  employeeId: string;
  /** Competency being assessed */
  competencyId: string;
  /** Framework version at time of assessment */
  frameworkId: string;
  /** Assessed level */
  assessedLevel: number;
  /** Expected level for employee's role/position */
  expectedLevel: number;
  /** Gap (expected - assessed, positive = gap) */
  gap: number;
  /** Assessor */
  assessorId: string;
  /** Assessment type */
  assessmentType: 'self' | 'manager' | 'peer' | 'calibrated';
  /** Supporting evidence/comments */
  evidence: string | null;
  /** Assessment date */
  assessedAt: Date;
  /** Associated review cycle */
  cycleId: string | null;
  createdAt: Date;
}

interface CompetencyGap {
  competencyId: string;
  competencyName: string;
  category: string;
  currentLevel: number;
  expectedLevel: number;
  gap: number;
  /** Recommended development actions */
  recommendations: DevelopmentRecommendation[];
}

interface DevelopmentRecommendation {
  type: 'course' | 'mentoring' | 'project' | 'reading' | 'coaching';
  title: string;
  description: string;
  estimatedDuration: string;
  priority: 'high' | 'medium' | 'low';
}
```

### FeedbackItem

Continuous feedback entry supporting multiple feedback types.

```typescript
interface FeedbackItem {
  id: string;
  tenantId: string;
  /** Employee receiving feedback */
  recipientId: string;
  /** Employee giving feedback */
  giverId: string;
  /** Feedback type */
  type: FeedbackType;
  /** Visibility setting */
  visibility: FeedbackVisibility;
  /** Feedback content */
  content: string;
  /** Structured feedback fields (if using a template) */
  structuredContent: Record<string, unknown> | null;
  /** Optional rating accompanying the feedback */
  rating: number | null;
  /** Associated competencies */
  competencyIds: string[];
  /** Associated goal */
  goalId: string | null;
  /** Whether the recipient has acknowledged/read this feedback */
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  /** Tags */
  tags: string[];
  /** Associated review cycle (if collected during a cycle) */
  cycleId: string | null;
  /** Request that triggered this feedback */
  requestId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type FeedbackType =
  | 'praise'           // Recognition/kudos
  | 'constructive'     // Improvement-focused
  | 'observation'      // Neutral observation
  | 'check_in'         // Manager check-in note
  | 'peer_feedback'    // Peer-to-peer
  | 'self_reflection'; // Self-reflection note

type FeedbackVisibility =
  | 'private'          // Only giver and recipient
  | 'manager'          // Also visible to recipient's manager
  | 'hr'              // Also visible to HR
  | 'public'          // Visible to all in organization
  | 'anonymous';       // Recipient sees content but not giver

interface FeedbackRequest {
  id: string;
  tenantId: string;
  /** Who is requesting feedback */
  requesterId: string;
  /** Who should provide feedback */
  responderId: string;
  /** About whom (usually the requester or their report) */
  subjectId: string;
  /** Specific questions or topics to address */
  prompts: string[];
  /** Status */
  status: 'pending' | 'completed' | 'declined' | 'expired';
  /** Due date */
  dueDate: Date;
  /** Associated feedback item (when completed) */
  feedbackItemId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### PIP (Performance Improvement Plan)

Structured performance improvement plan with milestone tracking.

```typescript
interface PIP {
  id: string;
  tenantId: string;
  /** Employee on the PIP */
  employeeId: string;
  /** Manager overseeing the PIP */
  managerId: string;
  /** HR representative */
  hrRepresentativeId: string | null;
  /** PIP title */
  title: string;
  /** Detailed description of performance concerns */
  description: string;
  /** Current status */
  status: PIPStatus;
  /** Areas of concern */
  areasOfConcern: string[];
  /** Expected outcomes at PIP completion */
  expectedOutcomes: string[];
  /** Support and resources provided */
  supportProvided: string[];
  /** Start date */
  startDate: Date;
  /** Target end date */
  endDate: Date;
  /** Actual end date */
  actualEndDate: Date | null;
  /** Check-in frequency */
  checkInFrequency: 'weekly' | 'biweekly' | 'monthly';
  /** Next scheduled check-in */
  nextCheckIn: Date | null;
  /** Milestones */
  milestones: PIPMilestone[];
  /** Final outcome */
  outcome: PIPOutcome | null;
  /** Outcome notes */
  outcomeNotes: string | null;
  /** Associated review that triggered the PIP */
  triggeringReviewId: string | null;
  /** Attached documents */
  documentIds: string[];
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

type PIPStatus =
  | 'draft'           // Being prepared
  | 'pending_approval'// Awaiting HR approval
  | 'active'          // In progress
  | 'extended'        // Extended beyond original end date
  | 'completed'       // Successfully completed
  | 'failed'          // Employee did not meet expectations
  | 'cancelled';      // Cancelled (e.g., employee left)

interface PIPMilestone {
  id: string;
  tenantId: string;
  /** Parent PIP */
  pipId: string;
  /** Milestone title */
  title: string;
  /** Detailed description */
  description: string;
  /** Success criteria */
  successCriteria: string;
  /** Current status */
  status: PIPMilestoneStatus;
  /** Due date */
  dueDate: Date;
  /** Completion date */
  completedAt: Date | null;
  /** Evidence/proof of completion */
  evidence: string | null;
  /** Manager assessment */
  managerAssessment: string | null;
  /** Sort order */
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

type PIPMilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'missed'
  | 'deferred';

type PIPOutcome =
  | 'successful'             // Employee met expectations
  | 'partially_successful'   // Some improvement but not full
  | 'unsuccessful'           // Did not meet expectations
  | 'terminated'             // Employment ended
  | 'resigned'               // Employee resigned during PIP
  | 'cancelled';             // PIP cancelled for other reasons
```

### CalibrationSession

Cross-team rating calibration to ensure fairness and consistency.

```typescript
interface CalibrationSession {
  id: string;
  tenantId: string;
  /** Session name */
  name: string;
  /** Description */
  description: string | null;
  /** Associated review cycle */
  cycleId: string;
  /** Current status */
  status: CalibrationSessionStatus;
  /** Facilitator (typically HR or senior leader) */
  facilitatorId: string;
  /** Participating managers */
  participantIds: string[];
  /** Departments/teams being calibrated */
  departmentIds: string[];
  /** Rating scale used */
  ratingScaleId: string;
  /** Target distribution (if forced distribution enabled) */
  targetDistribution: Record<string, number> | null;
  /** Scheduled date/time */
  scheduledAt: Date;
  /** Actual start time */
  startedAt: Date | null;
  /** Completion time */
  completedAt: Date | null;
  /** Number of employees calibrated */
  employeeCount: number;
  /** Number of rating adjustments made */
  adjustmentCount: number;
  /** Session notes */
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type CalibrationSessionStatus =
  | 'scheduled'       // Planned but not started
  | 'in_progress'     // Currently in session
  | 'pending_review'  // Adjustments made, pending final review
  | 'finalized'       // All adjustments approved
  | 'cancelled';      // Session cancelled

interface CalibrationRating {
  id: string;
  tenantId: string;
  /** Parent calibration session */
  sessionId: string;
  /** Employee being calibrated */
  employeeId: string;
  /** Original manager rating */
  originalRating: number;
  /** Calibrated (adjusted) rating */
  calibratedRating: number;
  /** Whether the rating was changed */
  wasAdjusted: boolean;
  /** Justification for the adjustment */
  adjustmentReason: string | null;
  /** Who made the adjustment */
  adjustedBy: string | null;
  /** Manager who submitted the original rating */
  managerId: string;
  /** Additional context/notes */
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CalibrationAdjustment {
  ratingId: string;
  previousRating: number;
  newRating: number;
  reason: string;
  adjustedBy: string;
  adjustedAt: Date;
}

interface CalibrationDistribution {
  /** Rating level → count mapping */
  distribution: Record<string, number>;
  /** Target distribution (if set) */
  target: Record<string, number> | null;
  /** Total employees */
  totalEmployees: number;
  /** Deviation from target per level */
  deviations: Record<string, number> | null;
  /** Before/after comparison */
  beforeAdjustment: Record<string, number>;
  afterAdjustment: Record<string, number>;
}
```

### ReviewTemplate

Configurable templates with question libraries for review forms.

```typescript
interface ReviewTemplate {
  id: string;
  tenantId: string;
  /** Template name */
  name: string;
  /** Description */
  description: string | null;
  /** Template version */
  version: number;
  /** Whether this is the active version */
  isActive: boolean;
  /** Applicable review types */
  applicableTypes: ReviewType[];
  /** Applicable roles (empty = all) */
  applicableRoles: string[];
  /** Applicable levels (empty = all) */
  applicableLevels: string[];
  /** Questions in this template */
  questions: TemplateQuestion[];
  /** Sections for grouping questions */
  sections: TemplateSection[];
  /** Template tags */
  tags: string[];
  /** Created by */
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateQuestion {
  id: string;
  tenantId: string;
  /** Parent template */
  templateId: string;
  /** Section within the template */
  sectionId: string | null;
  /** Question text */
  text: string;
  /** Help text / instructions */
  helpText: string | null;
  /** Question type */
  type: QuestionType;
  /** Question configuration */
  config: QuestionConfig;
  /** Whether this question is required */
  required: boolean;
  /** Weight in overall rating calculation */
  weight: number;
  /** Sort order */
  sortOrder: number;
  /** Applicable review types (empty = follows template) */
  applicableTypes: ReviewType[];
  createdAt: Date;
  updatedAt: Date;
}

type QuestionType =
  | 'text'            // Free text response
  | 'long_text'       // Extended text response
  | 'rating'          // Numeric rating
  | 'scale'           // Likert scale
  | 'single_choice'   // Single selection
  | 'multi_choice'    // Multiple selection
  | 'yes_no'          // Boolean
  | 'competency'      // Competency assessment
  | 'goal_assessment'; // Goal progress assessment

interface QuestionConfig {
  /** For rating/scale: min value */
  minValue?: number;
  /** For rating/scale: max value */
  maxValue?: number;
  /** For rating/scale: step increment */
  step?: number;
  /** For rating/scale: label per value */
  labels?: Record<number, string>;
  /** For choice questions: available options */
  options?: ChoiceOption[];
  /** For text: max length */
  maxLength?: number;
  /** For text: min length */
  minLength?: number;
  /** For text: placeholder */
  placeholder?: string;
  /** For competency: framework ID */
  frameworkId?: string;
  /** For goal assessment: include goal details */
  showGoalDetails?: boolean;
}

interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

interface TemplateSection {
  id: string;
  /** Section title */
  title: string;
  /** Section description */
  description: string | null;
  /** Sort order */
  sortOrder: number;
}
```

### RatingScale

Configurable rating systems supporting numeric, letter, and descriptive scales.

```typescript
interface RatingScale {
  id: string;
  tenantId: string;
  /** Scale name */
  name: string;
  /** Description */
  description: string | null;
  /** Scale type */
  type: 'numeric' | 'letter' | 'descriptive';
  /** Rating levels (ordered lowest to highest) */
  levels: RatingLevel[];
  /** Whether this is the default scale for the tenant */
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RatingLevel {
  /** Numeric value (for calculations) */
  value: number;
  /** Display label */
  label: string;
  /** Short code (e.g., "EE" for "Exceeds Expectations") */
  shortCode: string;
  /** Detailed description */
  description: string;
  /** Color for UI display */
  color: string;
}

interface OverallRating {
  /** Review ID */
  reviewId: string;
  /** Calculated numeric rating */
  numericRating: number;
  /** Mapped to rating scale level */
  ratingLevel: RatingLevel;
  /** Breakdown by section/question */
  breakdown: RatingBreakdown[];
  /** Calculation method used */
  method: 'weighted_average' | 'simple_average' | 'manager_override';
}

interface RatingBreakdown {
  questionId: string;
  questionText: string;
  weight: number;
  rating: number;
  weightedRating: number;
}

interface RatingDistribution {
  /** Cycle ID */
  cycleId: string;
  /** Distribution data */
  data: RatingDistributionEntry[];
  /** Total reviews included */
  totalReviews: number;
  /** Average rating */
  averageRating: number;
  /** Median rating */
  medianRating: number;
  /** Standard deviation */
  standardDeviation: number;
}

interface RatingDistributionEntry {
  level: RatingLevel;
  count: number;
  percentage: number;
  targetPercentage: number | null;
}
```

### PerformanceAnalytics

Analytics data structures for performance insights.

```typescript
interface PerformanceAnalytics {
  getPerformanceDistribution(cycleId: string, params?: DistributionParams): Promise<PerformanceDistribution>;
  getGoalCompletionRates(params: GoalCompletionParams): Promise<GoalCompletionRate[]>;
  getFeedbackFrequency(params: FeedbackFrequencyParams): Promise<FeedbackFrequencyData>;
  getReviewCompletionStats(cycleId: string): Promise<ReviewCompletionStats>;
  getCalibrationImpact(sessionId: string): Promise<CalibrationImpactData>;
  getPerformanceTrends(employeeId: string, params?: TrendParams): Promise<PerformanceTrend[]>;
  getTeamPerformanceSummary(managerId: string, cycleId: string): Promise<TeamPerformanceSummary>;
  getOrganizationPerformanceDashboard(cycleId: string): Promise<OrgPerformanceDashboard>;
}

interface PerformanceDistribution {
  cycleId: string;
  cycleName: string;
  totalEmployees: number;
  ratingsDistribution: RatingDistributionEntry[];
  byDepartment: Record<string, RatingDistributionEntry[]>;
  byLevel: Record<string, RatingDistributionEntry[]>;
  byLocation: Record<string, RatingDistributionEntry[]>;
}

interface GoalCompletionRate {
  period: string;
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
  averageProgress: number;
  byCategory: Record<GoalCategory, { total: number; completed: number; rate: number }>;
  byPriority: Record<GoalPriority, { total: number; completed: number; rate: number }>;
}

interface FeedbackFrequencyData {
  period: string;
  totalFeedbackItems: number;
  byType: Record<FeedbackType, number>;
  byMonth: { month: string; count: number }[];
  topGivers: { employeeId: string; count: number }[];
  topReceivers: { employeeId: string; count: number }[];
  averageTimeBetweenFeedback: number; // days
}

interface ReviewCompletionStats {
  cycleId: string;
  cycleName: string;
  totalReviews: number;
  completedReviews: number;
  completionRate: number;
  byType: Record<ReviewType, { total: number; completed: number; rate: number }>;
  byDepartment: Record<string, { total: number; completed: number; rate: number }>;
  overdueReviews: number;
  averageCompletionDays: number;
  completionTimeline: { date: string; cumulativeCompleted: number }[];
}

interface CalibrationImpactData {
  sessionId: string;
  totalEmployees: number;
  adjustedCount: number;
  adjustedPercentage: number;
  averageAdjustment: number;
  adjustmentDirection: {
    increased: number;
    decreased: number;
    unchanged: number;
  };
  distributionBefore: Record<string, number>;
  distributionAfter: Record<string, number>;
  largestAdjustments: {
    employeeId: string;
    originalRating: number;
    calibratedRating: number;
    difference: number;
  }[];
}

interface PerformanceTrend {
  cycleId: string;
  cycleName: string;
  period: string;
  overallRating: number;
  goalCompletionRate: number;
  feedbackCount: number;
  competencyScore: number | null;
}

interface TeamPerformanceSummary {
  managerId: string;
  cycleId: string;
  teamSize: number;
  averageRating: number;
  ratingDistribution: RatingDistributionEntry[];
  goalCompletionRate: number;
  feedbackGiven: number;
  feedbackReceived: number;
  topPerformers: { employeeId: string; rating: number }[];
  needsAttention: { employeeId: string; rating: number; flags: string[] }[];
  activePIPs: number;
}

interface OrgPerformanceDashboard {
  cycleId: string;
  cycleName: string;
  totalEmployees: number;
  reviewCompletionRate: number;
  averageRating: number;
  ratingDistribution: RatingDistributionEntry[];
  goalCompletionRate: number;
  feedbackMetrics: FeedbackFrequencyData;
  topPerformingDepartments: { departmentId: string; averageRating: number }[];
  calibrationSummary: {
    sessionsCompleted: number;
    totalAdjustments: number;
    averageAdjustment: number;
  };
  yearOverYearComparison: {
    previousCycleId: string;
    ratingChange: number;
    goalCompletionChange: number;
    feedbackFrequencyChange: number;
  } | null;
}

interface CompensationRecommendation {
  employeeId: string;
  cycleId: string;
  overallRating: number;
  ratingLabel: string;
  currentSalary: number;
  meritIncreasePercentage: number;
  meritIncreaseAmount: number;
  bonusPercentage: number;
  bonusAmount: number;
  totalRecommendedCompensation: number;
  compaRatio: number;
  marketPosition: string;
  justification: string;
  approvalStatus: 'pending' | 'approved' | 'modified' | 'rejected';
}
```

---

## Database Schemas

### review_cycles

```typescript
import { pgTable, uuid, text, timestamp, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';

export const reviewCycleFrequencyEnum = pgEnum('review_cycle_frequency', [
  'annual',
  'semi_annual',
  'quarterly',
  'monthly',
  'custom',
]);

export const reviewCycleStatusEnum = pgEnum('review_cycle_status', [
  'draft',
  'launched',
  'in_calibration',
  'completed',
  'archived',
]);

export const reviewCyclesTable = pgTable('review_cycles', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  name: text('name').notNull(),
  description: text('description'),
  frequency: reviewCycleFrequencyEnum('frequency').notNull(),
  status: reviewCycleStatusEnum('status').notNull().default('draft'),
  config: jsonb('config').notNull().$type<ReviewCycleConfig>(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  reviewDeadline: timestamp('review_deadline', { withTimezone: true }).notNull(),
  calibrationDeadline: timestamp('calibration_deadline', { withTimezone: true }),
  ratingScaleId: uuid('rating_scale_id').notNull().references(() => ratingScalesTable.id),
  templateId: uuid('template_id').notNull().references(() => reviewTemplatesTable.id),
  participantCriteria: jsonb('participant_criteria').notNull().$type<ParticipantCriteria>(),
  reviewCount: integer('review_count').notNull().default(0),
  submittedCount: integer('submitted_count').notNull().default(0),
  completedCount: integer('completed_count').notNull().default(0),
  createdBy: uuid('created_by').notNull().references(() => employeesTable.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  launchedAt: timestamp('launched_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
});
```

### reviews

```typescript
export const reviewTypeEnum = pgEnum('review_type', [
  'self',
  'manager',
  'peer',
  'upward',
  'skip_level',
  'external',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'pending',
  'in_progress',
  'submitted',
  'approved',
  'rejected',
  'calibrated',
  'shared',
  'acknowledged',
]);

export const reviewsTable = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  cycleId: uuid('cycle_id').notNull().references(() => reviewCyclesTable.id),
  subjectId: uuid('subject_id').notNull().references(() => employeesTable.id),
  reviewerId: uuid('reviewer_id').references(() => employeesTable.id),
  type: reviewTypeEnum('type').notNull(),
  status: reviewStatusEnum('status').notNull().default('pending'),
  overallRating: integer('overall_rating'),
  calibratedRating: integer('calibrated_rating'),
  managerSummary: text('manager_summary'),
  acknowledged: integer('acknowledged').notNull().default(0), // boolean via integer
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: uuid('approved_by').references(() => employeesTable.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### review_responses

```typescript
export const reviewResponseStatusEnum = pgEnum('review_response_status', [
  'draft',
  'submitted',
]);

export const reviewResponsesTable = pgTable('review_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  reviewId: uuid('review_id').notNull().references(() => reviewsTable.id),
  questionId: uuid('question_id').notNull().references(() => templateQuestionsTable.id),
  textResponse: text('text_response'),
  ratingResponse: integer('rating_response'),
  selectedOptions: jsonb('selected_options').$type<string[]>(),
  status: reviewResponseStatusEnum('status').notNull().default('draft'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### goals

```typescript
export const goalCategoryEnum = pgEnum('goal_category', [
  'performance',
  'development',
  'project',
  'behavioral',
  'stretch',
]);

export const goalPriorityEnum = pgEnum('goal_priority', [
  'critical',
  'high',
  'medium',
  'low',
]);

export const goalStatusEnum = pgEnum('goal_status', [
  'draft',
  'active',
  'on_track',
  'at_risk',
  'behind',
  'completed',
  'cancelled',
  'deferred',
]);

export const goalAlignmentLevelEnum = pgEnum('goal_alignment_level', [
  'individual',
  'team',
  'department',
  'company',
]);

export const goalsTable = pgTable('goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  ownerId: uuid('owner_id').notNull().references(() => employeesTable.id),
  cycleId: uuid('cycle_id').references(() => reviewCyclesTable.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  smartCriteria: jsonb('smart_criteria').$type<SMARTCriteria>(),
  category: goalCategoryEnum('category').notNull(),
  priority: goalPriorityEnum('priority').notNull().default('medium'),
  status: goalStatusEnum('status').notNull().default('draft'),
  progress: integer('progress').notNull().default(0),
  weight: integer('weight').notNull().default(100),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  parentGoalId: uuid('parent_goal_id').references((): any => goalsTable.id),
  alignmentLevel: goalAlignmentLevelEnum('alignment_level').notNull().default('individual'),
  successMetrics: jsonb('success_metrics').notNull().$type<SuccessMetric[]>().default([]),
  progressUpdates: jsonb('progress_updates').notNull().$type<GoalProgressUpdate[]>().default([]),
  tags: jsonb('tags').notNull().$type<string[]>().default([]),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  outcome: text('outcome'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### okrs

```typescript
export const okrStatusEnum = pgEnum('okr_status', [
  'draft',
  'active',
  'completed',
  'cancelled',
]);

export const okrLevelEnum = pgEnum('okr_level', [
  'individual',
  'team',
  'department',
  'company',
]);

export const okrsTable = pgTable('okrs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  ownerId: uuid('owner_id').notNull().references(() => employeesTable.id),
  cycleId: uuid('cycle_id').references(() => reviewCyclesTable.id),
  objective: text('objective').notNull(),
  description: text('description'),
  status: okrStatusEnum('status').notNull().default('draft'),
  level: okrLevelEnum('level').notNull().default('individual'),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  parentOKRId: uuid('parent_okr_id').references((): any => okrsTable.id),
  progress: integer('progress').notNull().default(0),
  tags: jsonb('tags').notNull().$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### key_results

```typescript
export const keyResultTypeEnum = pgEnum('key_result_type', [
  'number',
  'percentage',
  'currency',
  'binary',
  'milestone',
]);

export const keyResultsTable = pgTable('key_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  okrId: uuid('okr_id').notNull().references(() => okrsTable.id),
  title: text('title').notNull(),
  description: text('description'),
  type: keyResultTypeEnum('type').notNull().default('number'),
  startValue: integer('start_value').notNull().default(0),
  targetValue: integer('target_value').notNull(),
  currentValue: integer('current_value').notNull().default(0),
  unit: text('unit').notNull().default(''),
  progress: integer('progress').notNull().default(0),
  weight: integer('weight').notNull().default(100),
  confidence: integer('confidence').notNull().default(50),
  ownerId: uuid('owner_id').notNull().references(() => employeesTable.id),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  updates: jsonb('updates').notNull().$type<KeyResultUpdate[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### competency_frameworks

```typescript
export const competencyFrameworksTable = pgTable('competency_frameworks', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  name: text('name').notNull(),
  description: text('description'),
  version: integer('version').notNull().default(1),
  isActive: integer('is_active').notNull().default(1),
  applicableRoles: jsonb('applicable_roles').notNull().$type<string[]>().default([]),
  applicableLevels: jsonb('applicable_levels').notNull().$type<string[]>().default([]),
  createdBy: uuid('created_by').notNull().references(() => employeesTable.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### competencies

```typescript
export const competenciesTable = pgTable('competencies', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  frameworkId: uuid('framework_id').notNull().references(() => competencyFrameworksTable.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  weight: integer('weight').notNull().default(100),
  levels: jsonb('levels').notNull().$type<CompetencyLevel[]>(),
  behavioralIndicators: jsonb('behavioral_indicators').notNull().$type<Record<string, string[]>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### competency_assessments

```typescript
export const competencyAssessmentTypeEnum = pgEnum('competency_assessment_type', [
  'self',
  'manager',
  'peer',
  'calibrated',
]);

export const competencyAssessmentsTable = pgTable('competency_assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  employeeId: uuid('employee_id').notNull().references(() => employeesTable.id),
  competencyId: uuid('competency_id').notNull().references(() => competenciesTable.id),
  frameworkId: uuid('framework_id').notNull().references(() => competencyFrameworksTable.id),
  assessedLevel: integer('assessed_level').notNull(),
  expectedLevel: integer('expected_level').notNull(),
  gap: integer('gap').notNull(),
  assessorId: uuid('assessor_id').notNull().references(() => employeesTable.id),
  assessmentType: competencyAssessmentTypeEnum('assessment_type').notNull(),
  evidence: text('evidence'),
  assessedAt: timestamp('assessed_at', { withTimezone: true }).notNull().defaultNow(),
  cycleId: uuid('cycle_id').references(() => reviewCyclesTable.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### feedback_items

```typescript
export const feedbackTypeEnum = pgEnum('feedback_type', [
  'praise',
  'constructive',
  'observation',
  'check_in',
  'peer_feedback',
  'self_reflection',
]);

export const feedbackVisibilityEnum = pgEnum('feedback_visibility', [
  'private',
  'manager',
  'hr',
  'public',
  'anonymous',
]);

export const feedbackItemsTable = pgTable('feedback_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  recipientId: uuid('recipient_id').notNull().references(() => employeesTable.id),
  giverId: uuid('giver_id').notNull().references(() => employeesTable.id),
  type: feedbackTypeEnum('type').notNull(),
  visibility: feedbackVisibilityEnum('visibility').notNull().default('private'),
  content: text('content').notNull(),
  structuredContent: jsonb('structured_content').$type<Record<string, unknown>>(),
  rating: integer('rating'),
  competencyIds: jsonb('competency_ids').notNull().$type<string[]>().default([]),
  goalId: uuid('goal_id').references(() => goalsTable.id),
  acknowledged: integer('acknowledged').notNull().default(0),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  tags: jsonb('tags').notNull().$type<string[]>().default([]),
  cycleId: uuid('cycle_id').references(() => reviewCyclesTable.id),
  requestId: uuid('request_id').references(() => feedbackRequestsTable.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### feedback_requests

```typescript
export const feedbackRequestStatusEnum = pgEnum('feedback_request_status', [
  'pending',
  'completed',
  'declined',
  'expired',
]);

export const feedbackRequestsTable = pgTable('feedback_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  requesterId: uuid('requester_id').notNull().references(() => employeesTable.id),
  responderId: uuid('responder_id').notNull().references(() => employeesTable.id),
  subjectId: uuid('subject_id').notNull().references(() => employeesTable.id),
  prompts: jsonb('prompts').notNull().$type<string[]>(),
  status: feedbackRequestStatusEnum('status').notNull().default('pending'),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  feedbackItemId: uuid('feedback_item_id').references(() => feedbackItemsTable.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### pips

```typescript
export const pipStatusEnum = pgEnum('pip_status', [
  'draft',
  'pending_approval',
  'active',
  'extended',
  'completed',
  'failed',
  'cancelled',
]);

export const pipCheckInFrequencyEnum = pgEnum('pip_check_in_frequency', [
  'weekly',
  'biweekly',
  'monthly',
]);

export const pipsTable = pgTable('pips', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  employeeId: uuid('employee_id').notNull().references(() => employeesTable.id),
  managerId: uuid('manager_id').notNull().references(() => employeesTable.id),
  hrRepresentativeId: uuid('hr_representative_id').references(() => employeesTable.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: pipStatusEnum('status').notNull().default('draft'),
  areasOfConcern: jsonb('areas_of_concern').notNull().$type<string[]>(),
  expectedOutcomes: jsonb('expected_outcomes').notNull().$type<string[]>(),
  supportProvided: jsonb('support_provided').notNull().$type<string[]>(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  actualEndDate: timestamp('actual_end_date', { withTimezone: true }),
  checkInFrequency: pipCheckInFrequencyEnum('check_in_frequency').notNull().default('weekly'),
  nextCheckIn: timestamp('next_check_in', { withTimezone: true }),
  outcome: text('outcome'),
  outcomeNotes: text('outcome_notes'),
  triggeringReviewId: uuid('triggering_review_id').references(() => reviewsTable.id),
  documentIds: jsonb('document_ids').notNull().$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
});
```

### pip_milestones

```typescript
export const pipMilestoneStatusEnum = pgEnum('pip_milestone_status', [
  'pending',
  'in_progress',
  'completed',
  'missed',
  'deferred',
]);

export const pipMilestonesTable = pgTable('pip_milestones', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  pipId: uuid('pip_id').notNull().references(() => pipsTable.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  successCriteria: text('success_criteria').notNull(),
  status: pipMilestoneStatusEnum('status').notNull().default('pending'),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  evidence: text('evidence'),
  managerAssessment: text('manager_assessment'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### calibration_sessions

```typescript
export const calibrationSessionStatusEnum = pgEnum('calibration_session_status', [
  'scheduled',
  'in_progress',
  'pending_review',
  'finalized',
  'cancelled',
]);

export const calibrationSessionsTable = pgTable('calibration_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  name: text('name').notNull(),
  description: text('description'),
  cycleId: uuid('cycle_id').notNull().references(() => reviewCyclesTable.id),
  status: calibrationSessionStatusEnum('status').notNull().default('scheduled'),
  facilitatorId: uuid('facilitator_id').notNull().references(() => employeesTable.id),
  participantIds: jsonb('participant_ids').notNull().$type<string[]>(),
  departmentIds: jsonb('department_ids').notNull().$type<string[]>(),
  ratingScaleId: uuid('rating_scale_id').notNull().references(() => ratingScalesTable.id),
  targetDistribution: jsonb('target_distribution').$type<Record<string, number>>(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  employeeCount: integer('employee_count').notNull().default(0),
  adjustmentCount: integer('adjustment_count').notNull().default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### calibration_ratings

```typescript
export const calibrationRatingsTable = pgTable('calibration_ratings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  sessionId: uuid('session_id').notNull().references(() => calibrationSessionsTable.id),
  employeeId: uuid('employee_id').notNull().references(() => employeesTable.id),
  originalRating: integer('original_rating').notNull(),
  calibratedRating: integer('calibrated_rating').notNull(),
  wasAdjusted: integer('was_adjusted').notNull().default(0),
  adjustmentReason: text('adjustment_reason'),
  adjustedBy: uuid('adjusted_by').references(() => employeesTable.id),
  managerId: uuid('manager_id').notNull().references(() => employeesTable.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### review_templates

```typescript
export const reviewTemplatesTable = pgTable('review_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  name: text('name').notNull(),
  description: text('description'),
  version: integer('version').notNull().default(1),
  isActive: integer('is_active').notNull().default(1),
  applicableTypes: jsonb('applicable_types').notNull().$type<ReviewType[]>().default([]),
  applicableRoles: jsonb('applicable_roles').notNull().$type<string[]>().default([]),
  applicableLevels: jsonb('applicable_levels').notNull().$type<string[]>().default([]),
  sections: jsonb('sections').notNull().$type<TemplateSection[]>().default([]),
  tags: jsonb('tags').notNull().$type<string[]>().default([]),
  createdBy: uuid('created_by').notNull().references(() => employeesTable.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### template_questions

```typescript
export const questionTypeEnum = pgEnum('question_type', [
  'text',
  'long_text',
  'rating',
  'scale',
  'single_choice',
  'multi_choice',
  'yes_no',
  'competency',
  'goal_assessment',
]);

export const templateQuestionsTable = pgTable('template_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  templateId: uuid('template_id').notNull().references(() => reviewTemplatesTable.id),
  sectionId: text('section_id'),
  text: text('text').notNull(),
  helpText: text('help_text'),
  type: questionTypeEnum('type').notNull(),
  config: jsonb('config').notNull().$type<QuestionConfig>(),
  required: integer('required').notNull().default(1),
  weight: integer('weight').notNull().default(100),
  sortOrder: integer('sort_order').notNull().default(0),
  applicableTypes: jsonb('applicable_types').notNull().$type<ReviewType[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### rating_scales

```typescript
export const ratingScaleTypeEnum = pgEnum('rating_scale_type', [
  'numeric',
  'letter',
  'descriptive',
]);

export const ratingScalesTable = pgTable('rating_scales', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  name: text('name').notNull(),
  description: text('description'),
  type: ratingScaleTypeEnum('type').notNull().default('numeric'),
  levels: jsonb('levels').notNull().$type<RatingLevel[]>(),
  isDefault: integer('is_default').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### Row-Level Security Policies

All tables include RLS policies enforcing tenant isolation:

```sql
-- Example RLS policies for review_cycles
ALTER TABLE review_cycles ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: users can only access their own tenant's data
CREATE POLICY review_cycles_tenant_isolation ON review_cycles
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Read access: employees can view cycles in their tenant
CREATE POLICY review_cycles_read ON review_cycles
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
  );

-- Write access: only HR admins and cycle creators can modify
CREATE POLICY review_cycles_write ON review_cycles
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      current_setting('app.current_role') IN ('hr_admin', 'super_admin')
      OR created_by = current_setting('app.current_user_id')::uuid
    )
  );

-- Review visibility: employees see their own reviews, managers see reports' reviews
CREATE POLICY reviews_read ON reviews
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      subject_id = current_setting('app.current_user_id')::uuid
      OR reviewer_id = current_setting('app.current_user_id')::uuid
      OR current_setting('app.current_role') IN ('hr_admin', 'super_admin')
      OR EXISTS (
        SELECT 1 FROM employees e
        WHERE e.id = reviews.subject_id
        AND e.manager_id = current_setting('app.current_user_id')::uuid
      )
    )
  );

-- Feedback visibility based on visibility setting
CREATE POLICY feedback_items_read ON feedback_items
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      giver_id = current_setting('app.current_user_id')::uuid
      OR (
        recipient_id = current_setting('app.current_user_id')::uuid
        AND visibility != 'anonymous'
      )
      OR (
        recipient_id = current_setting('app.current_user_id')::uuid
        AND visibility = 'anonymous'
        -- Anonymous: hide giver_id in application layer
      )
      OR (
        visibility IN ('manager', 'hr', 'public')
        AND EXISTS (
          SELECT 1 FROM employees e
          WHERE e.id = feedback_items.recipient_id
          AND e.manager_id = current_setting('app.current_user_id')::uuid
        )
      )
      OR (
        visibility IN ('hr', 'public')
        AND current_setting('app.current_role') IN ('hr_admin', 'super_admin')
      )
      OR visibility = 'public'
    )
  );

-- PIP access: employee, manager, HR representative
CREATE POLICY pips_read ON pips
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      employee_id = current_setting('app.current_user_id')::uuid
      OR manager_id = current_setting('app.current_user_id')::uuid
      OR hr_representative_id = current_setting('app.current_user_id')::uuid
      OR current_setting('app.current_role') IN ('hr_admin', 'super_admin')
    )
  );

-- Calibration access: facilitators and participants only
CREATE POLICY calibration_sessions_read ON calibration_sessions
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      facilitator_id = current_setting('app.current_user_id')::uuid
      OR current_setting('app.current_user_id')::text = ANY(
        SELECT jsonb_array_elements_text(participant_ids)
      )
      OR current_setting('app.current_role') IN ('hr_admin', 'super_admin')
    )
  );
```

### Indexes

```sql
-- Review cycles
CREATE INDEX idx_review_cycles_tenant_status ON review_cycles(tenant_id, status);
CREATE INDEX idx_review_cycles_period ON review_cycles(tenant_id, period_start, period_end);

-- Reviews
CREATE INDEX idx_reviews_cycle ON reviews(tenant_id, cycle_id);
CREATE INDEX idx_reviews_subject ON reviews(tenant_id, subject_id);
CREATE INDEX idx_reviews_reviewer ON reviews(tenant_id, reviewer_id);
CREATE INDEX idx_reviews_status ON reviews(tenant_id, status);
CREATE INDEX idx_reviews_subject_cycle ON reviews(tenant_id, subject_id, cycle_id);

-- Review responses
CREATE INDEX idx_review_responses_review ON review_responses(tenant_id, review_id);

-- Goals
CREATE INDEX idx_goals_owner ON goals(tenant_id, owner_id);
CREATE INDEX idx_goals_cycle ON goals(tenant_id, cycle_id);
CREATE INDEX idx_goals_parent ON goals(tenant_id, parent_goal_id);
CREATE INDEX idx_goals_status ON goals(tenant_id, status);

-- OKRs
CREATE INDEX idx_okrs_owner ON okrs(tenant_id, owner_id);
CREATE INDEX idx_okrs_cycle ON okrs(tenant_id, cycle_id);
CREATE INDEX idx_okrs_parent ON okrs(tenant_id, parent_okr_id);
CREATE INDEX idx_okrs_level ON okrs(tenant_id, level);

-- Key results
CREATE INDEX idx_key_results_okr ON key_results(tenant_id, okr_id);
CREATE INDEX idx_key_results_owner ON key_results(tenant_id, owner_id);

-- Competency assessments
CREATE INDEX idx_competency_assessments_employee ON competency_assessments(tenant_id, employee_id);
CREATE INDEX idx_competency_assessments_competency ON competency_assessments(tenant_id, competency_id);
CREATE INDEX idx_competency_assessments_cycle ON competency_assessments(tenant_id, cycle_id);

-- Feedback
CREATE INDEX idx_feedback_items_recipient ON feedback_items(tenant_id, recipient_id);
CREATE INDEX idx_feedback_items_giver ON feedback_items(tenant_id, giver_id);
CREATE INDEX idx_feedback_items_type ON feedback_items(tenant_id, type);
CREATE INDEX idx_feedback_items_cycle ON feedback_items(tenant_id, cycle_id);
CREATE INDEX idx_feedback_requests_responder ON feedback_requests(tenant_id, responder_id, status);

-- PIPs
CREATE INDEX idx_pips_employee ON pips(tenant_id, employee_id);
CREATE INDEX idx_pips_manager ON pips(tenant_id, manager_id);
CREATE INDEX idx_pips_status ON pips(tenant_id, status);
CREATE INDEX idx_pip_milestones_pip ON pip_milestones(tenant_id, pip_id);

-- Calibration
CREATE INDEX idx_calibration_sessions_cycle ON calibration_sessions(tenant_id, cycle_id);
CREATE INDEX idx_calibration_ratings_session ON calibration_ratings(tenant_id, session_id);
CREATE INDEX idx_calibration_ratings_employee ON calibration_ratings(tenant_id, employee_id);

-- Templates
CREATE INDEX idx_review_templates_active ON review_templates(tenant_id, is_active);
CREATE INDEX idx_template_questions_template ON template_questions(tenant_id, template_id);
```

---

## Code Examples

### Example 1: Creating and Launching a Review Cycle

```typescript
import { PerformanceService } from '@mcv/people/performance';

const performance = new PerformanceService({ db, tenantId, userId });

// Step 1: Create the review cycle
const cycle = await performance.createReviewCycle({
  name: '2025 Annual Performance Review',
  description: 'Company-wide annual performance evaluation for fiscal year 2025',
  frequency: 'annual',
  periodStart: new Date('2025-01-01'),
  periodEnd: new Date('2025-12-31'),
  reviewDeadline: new Date('2026-01-31'),
  calibrationDeadline: new Date('2026-02-15'),
  ratingScaleId: 'scale-5-point',
  templateId: 'template-annual-review',
  config: {
    selfAssessment: true,
    peerReview: true,
    minPeerReviewers: 2,
    maxPeerReviewers: 5,
    allowPeerNomination: true,
    upwardReview: true,
    managerReview: true,
    skipLevelReview: false,
    requireCalibration: true,
    includeGoals: true,
    includeCompetencies: true,
    transparentReviews: false,
    anonymousPeerFeedback: true,
    autoReminders: true,
    reminderDaysBefore: [14, 7, 3, 1],
    requireManagerApproval: true,
    forcedDistribution: {
      mode: 'advisory',
      distribution: {
        '1': 5,    // Does Not Meet: 5%
        '2': 15,   // Partially Meets: 15%
        '3': 50,   // Meets Expectations: 50%
        '4': 25,   // Exceeds Expectations: 25%
        '5': 5,    // Exceptional: 5%
      },
      tolerance: 5,
    },
  },
  participantCriteria: {
    allActive: true,
    departmentIds: [],
    locationIds: [],
    employmentTypes: ['full_time', 'part_time'],
    minTenureMonths: 3,
    excludeEmployeeIds: [],
    includeEmployeeIds: [],
  },
});

console.log(`Created cycle: ${cycle.id} (${cycle.status})`);
// → Created cycle: abc-123 (draft)

// Step 2: Launch the cycle (creates reviews for all participants)
const launchedCycle = await performance.launchReviewCycle(cycle.id, {
  sendNotifications: true,
  notificationMessage: 'The 2025 Annual Performance Review is now open. Please complete your self-assessment and peer nominations by January 15, 2026.',
});

console.log(`Launched cycle: ${launchedCycle.reviewCount} reviews created`);
// → Launched cycle: 342 reviews created
```

### Example 2: Setting Goals with SMART Criteria and Alignment

```typescript
import { PerformanceService } from '@mcv/people/performance';

const performance = new PerformanceService({ db, tenantId, userId });

// Create a company-level goal
const companyGoal = await performance.createGoal({
  ownerId: 'ceo-id',
  title: 'Achieve $50M ARR by end of 2025',
  description: 'Drive growth to reach $50M in annual recurring revenue through new market expansion and customer retention',
  category: 'performance',
  priority: 'critical',
  alignmentLevel: 'company',
  startDate: new Date('2025-01-01'),
  dueDate: new Date('2025-12-31'),
  weight: 100,
  smartCriteria: {
    specific: 'Increase ARR from $35M to $50M',
    measurable: 'Track monthly ARR in finance dashboard',
    achievable: 'Based on current growth rate of 30% YoY and planned market expansion',
    relevant: 'Directly supports Series C fundraising targets',
    timeBound: 'By December 31, 2025',
  },
  successMetrics: [
    { name: 'ARR', targetValue: 50000000, currentValue: 35000000, unit: 'USD' },
    { name: 'Net Revenue Retention', targetValue: 120, currentValue: 110, unit: '%' },
  ],
  tags: ['revenue', 'growth', 'strategic'],
});

// Create a team-level goal aligned to the company goal
const teamGoal = await performance.createGoal({
  ownerId: 'vp-sales-id',
  title: 'Expand into European market',
  description: 'Establish sales operations in EU, targeting UK, Germany, and France',
  category: 'performance',
  priority: 'high',
  alignmentLevel: 'team',
  parentGoalId: companyGoal.id,
  startDate: new Date('2025-01-01'),
  dueDate: new Date('2025-09-30'),
  weight: 40,
  successMetrics: [
    { name: 'EU Revenue', targetValue: 5000000, currentValue: 0, unit: 'USD' },
    { name: 'EU Customers', targetValue: 50, currentValue: 0, unit: 'count' },
  ],
  tags: ['eu-expansion', 'sales'],
});

// Create an individual goal aligned to the team goal
const individualGoal = await performance.createGoal({
  ownerId: 'sales-rep-id',
  title: 'Close 15 enterprise deals in UK market',
  description: 'Target FTSE 250 companies in financial services and healthcare verticals',
  category: 'performance',
  priority: 'high',
  alignmentLevel: 'individual',
  parentGoalId: teamGoal.id,
  cycleId: 'cycle-2025-annual',
  startDate: new Date('2025-02-01'),
  dueDate: new Date('2025-09-30'),
  weight: 35,
  successMetrics: [
    { name: 'Deals Closed', targetValue: 15, currentValue: 0, unit: 'count' },
    { name: 'Pipeline Value', targetValue: 3000000, currentValue: 0, unit: 'USD' },
  ],
  tags: ['uk-sales', 'enterprise'],
});

// Update progress on the individual goal
await performance.updateGoalProgress(individualGoal.id, 33, 'Closed 5 deals so far, strong pipeline for Q2');

// Visualize goal alignment tree
const tree = await performance.getGoalTree(companyGoal.id);
console.log(JSON.stringify(tree, null, 2));
// → Shows company goal with team goals as children, and individual goals as grandchildren
```

### Example 3: OKR Framework with Key Results

```typescript
import { PerformanceService } from '@mcv/people/performance';

const performance = new PerformanceService({ db, tenantId, userId });

// Create a company-level OKR
const companyOKR = await performance.createOKR({
  ownerId: 'ceo-id',
  objective: 'Become the market leader in HR tech for mid-market companies',
  description: 'Capture dominant market share in the 100-5000 employee segment',
  level: 'company',
  periodStart: new Date('2025-01-01'),
  periodEnd: new Date('2025-06-30'),
  tags: ['strategy', 'market-leadership'],
});

// Add key results
const kr1 = await performance.addKeyResult(companyOKR.id, {
  title: 'Achieve 25% market share in mid-market HR tech',
  type: 'percentage',
  startValue: 12,
  targetValue: 25,
  unit: '%',
  weight: 40,
  ownerId: 'vp-marketing-id',
  dueDate: new Date('2025-06-30'),
});

const kr2 = await performance.addKeyResult(companyOKR.id, {
  title: 'Launch in 5 new geographic markets',
  type: 'number',
  startValue: 0,
  targetValue: 5,
  unit: 'markets',
  weight: 30,
  ownerId: 'vp-sales-id',
  dueDate: new Date('2025-06-30'),
});

const kr3 = await performance.addKeyResult(companyOKR.id, {
  title: 'Achieve NPS score of 70+',
  type: 'number',
  startValue: 55,
  targetValue: 70,
  unit: 'NPS',
  weight: 30,
  ownerId: 'vp-product-id',
  dueDate: new Date('2025-06-30'),
});

// Update key result progress
await performance.updateKeyResultProgress(kr1.id, 18, 'Q1 campaign drove strong brand awareness');
await performance.updateKeyResultProgress(kr2.id, 3, 'Launched in UK, Germany, and Australia');
await performance.updateKeyResultProgress(kr3.id, 62, 'Product improvements in Q1 moving the needle');

// Get overall OKR progress
const progress = await performance.getOKRProgress(companyOKR.id);
console.log(`OKR Progress: ${progress.overallProgress}%`);
console.log(`Key Results: ${progress.keyResults.map(kr => `${kr.title}: ${kr.progress}%`).join(', ')}`);
// → OKR Progress: 62%
// → Key Results: Market share: 46%, Geographic expansion: 60%, NPS: 47%
```

### Example 4: Submitting a Multi-Rater Review

```typescript
import { PerformanceService } from '@mcv/people/performance';

const performance = new PerformanceService({ db, tenantId, userId });

// Get the review assigned to current user
const reviews = await performance.listReviews({
  cycleId: 'cycle-2025-annual',
  reviewerId: userId,
  status: ['pending', 'in_progress'],
});

const review = reviews.items[0];
console.log(`Review type: ${review.type}, Subject: ${review.subjectId}`);

// Get the template questions for this review
const template = await performance.getReviewTemplate(review.cycleId);

// Save individual responses (auto-saves as draft)
for (const question of template.questions) {
  if (question.type === 'rating') {
    await performance.saveReviewResponse({
      reviewId: review.id,
      questionId: question.id,
      ratingResponse: 4,
    });
  } else if (question.type === 'long_text') {
    await performance.saveReviewResponse({
      reviewId: review.id,
      questionId: question.id,
      textResponse: 'Sarah has demonstrated exceptional leadership this year. She successfully led the platform migration project, mentored two junior engineers, and consistently delivered high-quality work ahead of deadlines.',
    });
  } else if (question.type === 'competency') {
    await performance.saveReviewResponse({
      reviewId: review.id,
      questionId: question.id,
      ratingResponse: 4, // Competency level
      textResponse: 'Strong technical skills with growing leadership capability',
    });
  }
}

// Submit the review (validates all required questions are answered)
try {
  const submitted = await performance.submitReview(review.id);
  console.log(`Review submitted at ${submitted.submittedAt}`);
} catch (error) {
  if (error.code === 'PERF_REVIEW_INCOMPLETE') {
    console.error('Missing required responses:', error.details.missingQuestions);
  }
}

// Manager approves the review
const approved = await performance.approveReview(review.id, 'Thorough and constructive review. Approved.');
console.log(`Review approved by ${approved.approvedBy} at ${approved.approvedAt}`);
```

### Example 5: Continuous Feedback and Recognition

```typescript
import { PerformanceService } from '@mcv/people/performance';

const performance = new PerformanceService({ db, tenantId, userId });

// Give public praise/recognition
const praise = await performance.createFeedbackItem({
  recipientId: 'colleague-id',
  type: 'praise',
  visibility: 'public',
  content: 'Huge shoutout to Alex for stepping up during the production incident last Thursday. His quick diagnosis and clear communication kept the team calm and we resolved the issue in under 30 minutes. True engineering leadership! 🙌',
  tags: ['incident-response', 'leadership', 'engineering'],
  competencyIds: ['comp-problem-solving', 'comp-communication'],
});

// Manager check-in note (private between manager and report)
const checkIn = await performance.createFeedbackItem({
  recipientId: 'direct-report-id',
  type: 'check_in',
  visibility: 'private',
  content: 'Weekly 1:1 notes: Discussed Q2 goals progress. On track for the API redesign milestone. We agreed to shift focus to documentation quality starting next sprint. Action items: 1) Draft API docs by Friday, 2) Schedule knowledge transfer session with backend team.',
  goalId: 'goal-api-redesign',
  tags: ['1on1', 'weekly'],
});

// Request feedback from peers (e.g., before a review cycle)
const request = await performance.requestFeedback({
  responderId: 'peer-1-id',
  subjectId: userId, // requesting feedback about yourself
  prompts: [
    'What are the key strengths you've observed in my work this quarter?',
    'What is one area where I could improve my collaboration with the team?',
    'How effective have I been at communicating project updates?',
  ],
  dueDate: new Date('2026-01-15'),
});

// View feedback summary for an employee
const summary = await performance.getFeedbackSummary('employee-id', {
  start: new Date('2025-01-01'),
  end: new Date('2025-12-31'),
});

console.log(`Total feedback items: ${summary.totalItems}`);
console.log(`Praise: ${summary.byType.praise}, Constructive: ${summary.byType.constructive}`);
console.log(`Most frequent topics: ${summary.topTags.join(', ')}`);
// → Total feedback items: 24
// → Praise: 15, Constructive: 6
// → Most frequent topics: leadership, communication, technical-excellence
```

### Example 6: Performance Improvement Plan (PIP) Workflow

```typescript
import { PerformanceService } from '@mcv/people/performance';

const performance = new PerformanceService({ db, tenantId, userId });

// Create a PIP based on review results
const pip = await performance.createPIP({
  employeeId: 'employee-id',
  managerId: userId,
  hrRepresentativeId: 'hr-rep-id',
  title: 'Performance Improvement Plan - Code Quality & Delivery',
  description: 'Following the 2025 mid-year review, we have identified consistent issues with code quality and on-time delivery. This plan outlines specific, measurable improvements expected over the next 60 days.',
  areasOfConcern: [
    'Code review feedback not being addressed consistently',
    'Missing sprint commitments in 4 of last 6 sprints',
    'Unit test coverage below team standard (45% vs 80% target)',
  ],
  expectedOutcomes: [
    'Address all code review feedback before merging PRs',
    'Complete 90%+ of sprint commitments for 4 consecutive sprints',
    'Achieve 75%+ unit test coverage on all new code',
  ],
  supportProvided: [
    'Weekly 1:1 meetings with manager to review progress',
    'Pairing sessions with senior engineer twice per week',
    'Access to code quality workshops and testing courses',
    'Reduced on-call rotation during PIP period',
  ],
  startDate: new Date('2025-07-01'),
  endDate: new Date('2025-08-30'),
  checkInFrequency: 'weekly',
  triggeringReviewId: 'review-mid-year-id',
});

// Add milestones
await performance.addPIPMilestone(pip.id, {
  title: 'Address all outstanding code review comments',
  description: 'Go through all open PRs and address reviewer feedback',
  successCriteria: 'Zero open review comments older than 48 hours',
  dueDate: new Date('2025-07-15'),
  sortOrder: 1,
});

await performance.addPIPMilestone(pip.id, {
  title: 'Achieve 70% test coverage on current sprint work',
  description: 'Write unit tests for all new code in the next two sprints',
  successCriteria: 'Code coverage report shows 70%+ on new files',
  dueDate: new Date('2025-07-31'),
  sortOrder: 2,
});

await performance.addPIPMilestone(pip.id, {
  title: 'Complete 3 consecutive sprints at 90%+ completion',
  description: 'Demonstrate consistent delivery by completing committed sprint work',
  successCriteria: 'Sprint reports show 90%+ story point completion for 3 sprints',
  dueDate: new Date('2025-08-22'),
  sortOrder: 3,
});

await performance.addPIPMilestone(pip.id, {
  title: 'Final assessment and PIP review',
  description: 'Comprehensive review of all PIP criteria with manager and HR',
  successCriteria: 'All previous milestones met, sustained improvement demonstrated',
  dueDate: new Date('2025-08-30'),
  sortOrder: 4,
});

// Complete a milestone with evidence
await performance.completePIPMilestone('milestone-1-id', 
  'All open PRs reviewed and feedback addressed. See PR links: #452, #457, #461. Code review turnaround now averaging 12 hours.'
);

// Track PIP progress
const progress = await performance.getPIPProgress(pip.id);
console.log(`PIP Progress: ${progress.completedMilestones}/${progress.totalMilestones} milestones completed`);
console.log(`Days remaining: ${progress.daysRemaining}`);
console.log(`Status: ${progress.overallAssessment}`);

// Close PIP with outcome
await performance.closePIP(pip.id, 'successful',
  'Employee has met all PIP criteria. Code quality has improved significantly with test coverage at 82%. Sprint completion at 95% for last 3 sprints. Recommending removal from PIP with continued monitoring.'
);
```

### Example 7: Running a Calibration Session

```typescript
import { PerformanceService } from '@mcv/people/performance';

const performance = new PerformanceService({ db, tenantId, userId });

// Create a calibration session for the engineering department
const session = await performance.createCalibrationSession({
  name: '2025 Annual Review - Engineering Calibration',
  description: 'Cross-team calibration for all engineering managers',
  cycleId: 'cycle-2025-annual',
  facilitatorId: 'vp-engineering-id',
  participantIds: [
    'eng-manager-1-id',
    'eng-manager-2-id',
    'eng-manager-3-id',
    'eng-manager-4-id',
  ],
  departmentIds: ['dept-engineering'],
  ratingScaleId: 'scale-5-point',
  targetDistribution: {
    '1': 5,
    '2': 15,
    '3': 50,
    '4': 25,
    '5': 5,
  },
  scheduledAt: new Date('2026-02-10T10:00:00Z'),
});

// During the session: view current rating distribution
const distribution = await performance.getCalibrationDistribution(session.id);
console.log('Current distribution:');
for (const [level, count] of Object.entries(distribution.distribution)) {
  const target = distribution.target?.[level] ?? 'N/A';
  console.log(`  Level ${level}: ${count} (${((count / distribution.totalEmployees) * 100).toFixed(1)}%) - Target: ${target}%`);
}
// → Current distribution:
// →   Level 1: 2 (2.5%) - Target: 5%
// →   Level 2: 8 (10.0%) - Target: 15%
// →   Level 3: 35 (43.8%) - Target: 50%
// →   Level 4: 28 (35.0%) - Target: 25%
// →   Level 5: 7 (8.8%) - Target: 5%

// Adjust a rating during calibration
await performance.adjustCalibrationRating('rating-abc-id', {
  newRating: 3,
  reason: 'After cross-team comparison, the deliverables are more consistent with "Meets Expectations" rather than "Exceeds". Compared to similar-level engineers in Team B who delivered higher-impact projects.',
});

// After all adjustments, view before/after comparison
const comparison = await performance.getCalibrationComparison(session.id);
console.log(`Adjustments made: ${comparison.adjustedCount}`);
console.log(`Average adjustment: ${comparison.averageAdjustment.toFixed(2)}`);

// Finalize calibration (locks ratings, updates reviews)
const finalized = await performance.finalizeCalibration(session.id);
console.log(`Calibration finalized: ${finalized.adjustmentCount} adjustments applied to reviews`);

// Export results
const report = await performance.exportCalibrationResults(session.id, 'xlsx');
console.log(`Report generated: ${report.url}`);
```

### Example 8: Performance Analytics Dashboard

```typescript
import { PerformanceAnalytics } from '@mcv/people/performance';

const analytics = new PerformanceAnalytics({ db, tenantId });

// Get organization-wide performance dashboard
const dashboard = await analytics.getOrganizationPerformanceDashboard('cycle-2025-annual');

console.log('=== Organization Performance Dashboard ===');
console.log(`Cycle: ${dashboard.cycleName}`);
console.log(`Total Employees: ${dashboard.totalEmployees}`);
console.log(`Review Completion: ${(dashboard.reviewCompletionRate * 100).toFixed(1)}%`);
console.log(`Average Rating: ${dashboard.averageRating.toFixed(2)}`);
console.log(`Goal Completion: ${(dashboard.goalCompletionRate * 100).toFixed(1)}%`);
console.log('');
console.log('Rating Distribution:');
for (const entry of dashboard.ratingDistribution) {
  const bar = '█'.repeat(Math.round(entry.percentage / 2));
  console.log(`  ${entry.level.label}: ${bar} ${entry.count} (${entry.percentage.toFixed(1)}%)`);
}

// Get performance trends for an individual
const trends = await analytics.getPerformanceTrends('employee-id', {
  cycleCount: 4, // Last 4 review cycles
});

console.log('\nPerformance Trends:');
for (const trend of trends) {
  console.log(`  ${trend.period}: Rating ${trend.overallRating}, Goals ${(trend.goalCompletionRate * 100).toFixed(0)}%, Feedback ${trend.feedbackCount}`);
}
// → Performance Trends:
// →   2022 Annual: Rating 3, Goals 72%, Feedback 8
// →   2023 Annual: Rating 3, Goals 78%, Feedback 12
// →   2024 Annual: Rating 4, Goals 85%, Feedback 18
// →   2025 Annual: Rating 4, Goals 91%, Feedback 24

// Team performance summary for a manager
const teamSummary = await analytics.getTeamPerformanceSummary('manager-id', 'cycle-2025-annual');

console.log('\nTeam Summary:');
console.log(`  Team size: ${teamSummary.teamSize}`);
console.log(`  Average rating: ${teamSummary.averageRating.toFixed(2)}`);
console.log(`  Goal completion: ${(teamSummary.goalCompletionRate * 100).toFixed(1)}%`);
console.log(`  Top performers: ${teamSummary.topPerformers.length}`);
console.log(`  Needs attention: ${teamSummary.needsAttention.length}`);
console.log(`  Active PIPs: ${teamSummary.activePIPs}`);

// Calibration impact analysis
const impact = await analytics.getCalibrationImpact('calibration-session-id');

console.log('\nCalibration Impact:');
console.log(`  Employees calibrated: ${impact.totalEmployees}`);
console.log(`  Ratings adjusted: ${impact.adjustedCount} (${impact.adjustedPercentage.toFixed(1)}%)`);
console.log(`  Increased: ${impact.adjustmentDirection.increased}`);
console.log(`  Decreased: ${impact.adjustmentDirection.decreased}`);
console.log(`  Unchanged: ${impact.adjustmentDirection.unchanged}`);
console.log(`  Average adjustment magnitude: ${Math.abs(impact.averageAdjustment).toFixed(2)}`);
```

---

## Error Codes

All errors thrown by `@mcv/people/performance` extend the base `PerformanceError` class and include a machine-readable error code, HTTP status code, and descriptive message.

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `PERF_CYCLE_NOT_FOUND` | 404 | Review cycle with the specified ID does not exist or is not accessible |
| `PERF_CYCLE_INVALID_STATUS` | 409 | Operation not allowed in the cycle's current status (e.g., launching an already-launched cycle) |
| `PERF_CYCLE_INVALID_DATES` | 400 | Period start must be before period end; review deadline must be after period end |
| `PERF_CYCLE_HAS_REVIEWS` | 409 | Cannot delete a cycle that has associated reviews |
| `PERF_CYCLE_LAUNCH_FAILED` | 500 | Failed to create reviews during cycle launch (partial failure) |
| `PERF_REVIEW_NOT_FOUND` | 404 | Review with the specified ID does not exist or is not accessible |
| `PERF_REVIEW_INCOMPLETE` | 400 | Cannot submit review — required questions are unanswered |
| `PERF_REVIEW_ALREADY_SUBMITTED` | 409 | Review has already been submitted and cannot be re-submitted |
| `PERF_REVIEW_NOT_REVIEWER` | 403 | Current user is not the assigned reviewer for this review |
| `PERF_REVIEW_APPROVAL_DENIED` | 403 | Current user does not have permission to approve this review |
| `PERF_RESPONSE_NOT_FOUND` | 404 | Review response with the specified ID does not exist |
| `PERF_RESPONSE_ALREADY_SUBMITTED` | 409 | Response has already been submitted and is locked |
| `PERF_GOAL_NOT_FOUND` | 404 | Goal with the specified ID does not exist or is not accessible |
| `PERF_GOAL_INVALID_PROGRESS` | 400 | Progress must be between 0 and 100 |
| `PERF_GOAL_CIRCULAR_ALIGNMENT` | 400 | Goal alignment would create a circular dependency |
| `PERF_GOAL_ALREADY_COMPLETED` | 409 | Goal is already completed or cancelled |
| `PERF_GOAL_WEIGHT_OVERFLOW` | 400 | Total goal weights for an employee exceed 100% |
| `PERF_OKR_NOT_FOUND` | 404 | OKR with the specified ID does not exist or is not accessible |
| `PERF_OKR_MAX_KEY_RESULTS` | 400 | Maximum number of key results (10) reached for this OKR |
| `PERF_OKR_CIRCULAR_ALIGNMENT` | 400 | OKR alignment would create a circular dependency |
| `PERF_KEY_RESULT_NOT_FOUND` | 404 | Key result with the specified ID does not exist |
| `PERF_KEY_RESULT_INVALID_VALUE` | 400 | Current value exceeds target value or is below start value |
| `PERF_COMPETENCY_FRAMEWORK_NOT_FOUND` | 404 | Competency framework not found |
| `PERF_COMPETENCY_NOT_FOUND` | 404 | Competency not found within the specified framework |
| `PERF_COMPETENCY_INVALID_LEVEL` | 400 | Assessed level is not a valid level in the competency definition |
| `PERF_FEEDBACK_NOT_FOUND` | 404 | Feedback item not found or not accessible |
| `PERF_FEEDBACK_SELF_FEEDBACK` | 400 | Cannot give feedback to yourself (use self_reflection type instead) |
| `PERF_FEEDBACK_REQUEST_EXPIRED` | 410 | Feedback request has expired past its due date |
| `PERF_FEEDBACK_REQUEST_ALREADY_COMPLETED` | 409 | Feedback request has already been fulfilled |
| `PERF_RATING_SCALE_NOT_FOUND` | 404 | Rating scale not found |
| `PERF_RATING_SCALE_IN_USE` | 409 | Cannot delete rating scale that is used by active review cycles |
| `PERF_RATING_INVALID_VALUE` | 400 | Rating value is not within the scale's defined range |
| `PERF_PIP_NOT_FOUND` | 404 | PIP not found or not accessible |
| `PERF_PIP_ALREADY_CLOSED` | 409 | PIP is already closed and cannot be modified |
| `PERF_PIP_MILESTONE_NOT_FOUND` | 404 | PIP milestone not found |
| `PERF_PIP_MILESTONE_ALREADY_COMPLETED` | 409 | Milestone is already completed |
| `PERF_PIP_APPROVAL_REQUIRED` | 403 | PIP must be approved by HR before activation |
| `PERF_CALIBRATION_NOT_FOUND` | 404 | Calibration session not found |
| `PERF_CALIBRATION_NOT_PARTICIPANT` | 403 | Current user is not a participant in this calibration session |
| `PERF_CALIBRATION_ALREADY_FINALIZED` | 409 | Calibration session has been finalized and ratings are locked |
| `PERF_CALIBRATION_RATING_NOT_FOUND` | 404 | Calibration rating entry not found |
| `PERF_TEMPLATE_NOT_FOUND` | 404 | Review template not found |
| `PERF_TEMPLATE_IN_USE` | 409 | Cannot delete template used by active review cycles |
| `PERF_TEMPLATE_QUESTION_NOT_FOUND` | 404 | Template question not found |
| `PERF_COMPENSATION_INSUFFICIENT_DATA` | 400 | Not enough performance data to generate compensation recommendation |
| `PERF_UNAUTHORIZED` | 403 | User does not have permission to perform this action |
| `PERF_TENANT_MISMATCH` | 403 | Resource belongs to a different tenant |
| `PERF_RATE_LIMITED` | 429 | Too many requests — please retry after the specified cooldown |
| `PERF_EXPORT_FAILED` | 500 | Failed to generate export file |
| `PERF_INVALID_DATE_RANGE` | 400 | Start date must be before end date |
| `PERF_CONCURRENT_MODIFICATION` | 409 | Resource was modified by another user — please refresh and retry |

### Error Response Format

```typescript
interface PerformanceError {
  code: string;           // Machine-readable error code (e.g., 'PERF_REVIEW_NOT_FOUND')
  message: string;        // Human-readable message
  status: number;         // HTTP status code
  details?: {
    field?: string;       // Field that caused the error
    expected?: unknown;   // Expected value
    received?: unknown;   // Received value
    missingQuestions?: string[];  // For PERF_REVIEW_INCOMPLETE
    conflictingId?: string;      // For conflict errors
    retryAfter?: number;         // For rate limiting (seconds)
  };
}
```

### Error Handling Example

```typescript
import { PerformanceService, PerformanceError } from '@mcv/people/performance';

try {
  await performance.submitReview(reviewId);
} catch (error) {
  if (error instanceof PerformanceError) {
    switch (error.code) {
      case 'PERF_REVIEW_INCOMPLETE':
        // Show user which questions need answers
        const missing = error.details?.missingQuestions ?? [];
        console.error(`Please answer these required questions: ${missing.join(', ')}`);
        break;
      case 'PERF_REVIEW_ALREADY_SUBMITTED':
        console.warn('This review has already been submitted.');
        break;
      case 'PERF_REVIEW_NOT_REVIEWER':
        console.error('You are not authorized to submit this review.');
        break;
      case 'PERF_CONCURRENT_MODIFICATION':
        console.warn('Someone else modified this review. Please refresh and try again.');
        break;
      default:
        console.error(`Performance error: ${error.message}`);
    }
  } else {
    throw error; // Re-throw unexpected errors
  }
}
```

---

## Security

### Authentication & Authorization

All `PerformanceService` operations require an authenticated context with tenant and user identification. The service enforces a role-based permission model:

| Role | Permissions |
|------|-------------|
| **Employee** | View own reviews, submit self-assessments, manage own goals, give/receive feedback, view own PIP |
| **Manager** | All employee permissions + view/approve direct reports' reviews, create goals for reports, create feedback for reports, create PIPs, participate in calibration |
| **HR Admin** | All manager permissions + create/manage review cycles, manage templates, manage rating scales, manage competency frameworks, facilitate calibration, access all PIPs, access analytics |
| **Super Admin** | Full access to all performance data and operations within the tenant |

### Data Protection

- **Tenant Isolation**: All database queries are scoped by `tenant_id` through PostgreSQL RLS policies. Cross-tenant data access is impossible at the database level.
- **Anonymous Feedback**: When feedback visibility is set to `anonymous`, the `giver_id` is masked in API responses. The actual giver identity is stored in the database for audit purposes but is only accessible to super admins via a separate audit endpoint.
- **Review Confidentiality**: Peer review responses are not visible to the subject until the review cycle is completed and results are explicitly shared. Manager reviews follow the same pattern.
- **PIP Confidentiality**: PIP data is restricted to the employee, their manager, the HR representative, and HR admins. Other employees cannot see that a PIP exists.
- **Calibration Confidentiality**: Calibration session data (including individual rating adjustments) is only visible to session participants, facilitators, and HR admins.

### Input Validation

All inputs are validated using Zod schemas before processing:

```typescript
import { z } from 'zod';

const createReviewCycleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  frequency: z.enum(['annual', 'semi_annual', 'quarterly', 'monthly', 'custom']),
  periodStart: z.date(),
  periodEnd: z.date(),
  reviewDeadline: z.date(),
  calibrationDeadline: z.date().nullable().optional(),
  ratingScaleId: z.string().uuid(),
  templateId: z.string().uuid(),
  config: reviewCycleConfigSchema,
  participantCriteria: participantCriteriaSchema,
}).refine(
  (data) => data.periodStart < data.periodEnd,
  { message: 'Period start must be before period end', path: ['periodStart'] }
).refine(
  (data) => data.reviewDeadline > data.periodEnd,
  { message: 'Review deadline must be after period end', path: ['reviewDeadline'] }
);

const createGoalSchema = z.object({
  ownerId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  category: z.enum(['performance', 'development', 'project', 'behavioral', 'stretch']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  startDate: z.date(),
  dueDate: z.date(),
  weight: z.number().min(0).max(100),
  smartCriteria: smartCriteriaSchema.nullable().optional(),
  successMetrics: z.array(successMetricSchema).optional(),
  parentGoalId: z.string().uuid().nullable().optional(),
  cycleId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
}).refine(
  (data) => data.startDate < data.dueDate,
  { message: 'Start date must be before due date', path: ['startDate'] }
);

const createFeedbackSchema = z.object({
  recipientId: z.string().uuid(),
  type: z.enum(['praise', 'constructive', 'observation', 'check_in', 'peer_feedback', 'self_reflection']),
  visibility: z.enum(['private', 'manager', 'hr', 'public', 'anonymous']),
  content: z.string().min(1).max(10000),
  rating: z.number().min(1).max(5).nullable().optional(),
  competencyIds: z.array(z.string().uuid()).optional(),
  goalId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});
```

### Audit Trail

All performance-related actions are logged to the platform audit system:

```typescript
interface PerformanceAuditEntry {
  action: PerformanceAuditAction;
  resourceType: 'review_cycle' | 'review' | 'review_response' | 'goal' | 'okr'
    | 'key_result' | 'competency_assessment' | 'feedback_item' | 'pip'
    | 'pip_milestone' | 'calibration_session' | 'calibration_rating'
    | 'review_template' | 'rating_scale';
  resourceId: string;
  actorId: string;
  tenantId: string;
  timestamp: Date;
  changes: Record<string, { before: unknown; after: unknown }>;
  metadata: Record<string, unknown>;
}

type PerformanceAuditAction =
  | 'created' | 'updated' | 'deleted'
  | 'launched' | 'closed' | 'reopened'
  | 'submitted' | 'approved' | 'rejected'
  | 'calibrated' | 'finalized'
  | 'shared' | 'acknowledged'
  | 'progress_updated' | 'completed' | 'cancelled'
  | 'milestone_completed' | 'milestone_missed'
  | 'rating_adjusted' | 'exported';
```

### Rate Limiting

To prevent abuse, the following rate limits apply:

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|--------|
| Read operations | 200 requests | 1 minute |
| Write operations | 50 requests | 1 minute |
| Feedback creation | 20 items | 1 hour |
| Export operations | 5 requests | 5 minutes |
| Analytics queries | 30 requests | 1 minute |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PERFORMANCE_DATABASE_URL` | Yes | — | PostgreSQL connection string for performance data (uses shared Supabase instance) |
| `PERFORMANCE_MAX_PEER_REVIEWERS` | No | `10` | Maximum peer reviewers allowed per review |
| `PERFORMANCE_MAX_KEY_RESULTS` | No | `10` | Maximum key results per OKR |
| `PERFORMANCE_MAX_PIP_MILESTONES` | No | `20` | Maximum milestones per PIP |
| `PERFORMANCE_MAX_TEMPLATE_QUESTIONS` | No | `50` | Maximum questions per review template |
| `PERFORMANCE_MAX_GOAL_DEPTH` | No | `5` | Maximum depth of goal alignment hierarchy |
| `PERFORMANCE_FEEDBACK_COOLDOWN_SECONDS` | No | `60` | Minimum time between feedback submissions to same recipient |
| `PERFORMANCE_REVIEW_AUTO_SAVE_INTERVAL_MS` | No | `30000` | Auto-save interval for review responses (client hint) |
| `PERFORMANCE_EXPORT_MAX_ROWS` | No | `10000` | Maximum rows in exported reports |
| `PERFORMANCE_EXPORT_STORAGE_BUCKET` | No | `performance-exports` | Supabase storage bucket for exported files |
| `PERFORMANCE_NOTIFICATION_ENABLED` | No | `true` | Enable/disable performance notifications |
| `PERFORMANCE_REMINDER_CRON` | No | `0 9 * * 1` | Cron expression for review deadline reminders (default: Monday 9am) |
| `PERFORMANCE_CALIBRATION_MIN_PARTICIPANTS` | No | `2` | Minimum participants required for a calibration session |
| `PERFORMANCE_ANONYMOUS_FEEDBACK_MIN_RESPONSES` | No | `3` | Minimum anonymous responses before showing aggregated feedback (k-anonymity) |
| `PERFORMANCE_COMPENSATION_MERIT_BUDGET_PERCENTAGE` | No | `3.0` | Default merit increase budget as percentage of payroll |
| `PERFORMANCE_COMPENSATION_BONUS_POOL_PERCENTAGE` | No | `10.0` | Default bonus pool as percentage of eligible payroll |
| `PERFORMANCE_AUDIT_RETENTION_DAYS` | No | `2555` | Days to retain audit log entries (default: ~7 years) |
| `PERFORMANCE_CACHE_TTL_SECONDS` | No | `300` | Cache TTL for analytics queries |
| `PERFORMANCE_RATE_LIMIT_READ` | No | `200` | Read operations rate limit per minute |
| `PERFORMANCE_RATE_LIMIT_WRITE` | No | `50` | Write operations rate limit per minute |

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/platform/auth` | `^0.12.0` | Authentication context, role resolution, permission checks |
| `@mcv/platform/db` | `^0.12.0` | Database connection pool, Drizzle ORM configuration, RLS context |
| `@mcv/platform/tenancy` | `^0.12.0` | Tenant resolution, tenant-scoped operations |
| `@mcv/platform/audit` | `^0.12.0` | Audit logging for all performance actions |
| `@mcv/platform/notifications` | `^0.12.0` | Email/push notifications for review reminders, feedback requests |
| `@mcv/platform/files` | `^0.12.0` | File storage for PIP documents, exported reports |
| `@mcv/platform/cache` | `^0.12.0` | Caching for analytics queries and frequently-read data |
| `@mcv/people/core` | `^0.12.0` | Employee data, organizational hierarchy, reporting relationships |
| `@mcv/people/compensation` | `^0.12.0` | Salary data for merit increase and bonus calculations |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.0` | Type-safe SQL query builder and ORM |
| `@trpc/server` | `^10.45.0` | Type-safe API router definitions |
| `zod` | `^3.22.0` | Runtime schema validation for all inputs |
| `date-fns` | `^3.0.0` | Date manipulation for cycle periods, deadlines, schedules |
| `nanoid` | `^5.0.0` | Short unique ID generation for template sections |
| `xlsx` | `^0.18.0` | Excel export for calibration results and analytics reports |
| `csv-stringify` | `^6.4.0` | CSV export for performance data |
| `lodash` | `^4.17.0` | Utility functions (groupBy, sortBy, etc.) |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.39.0` | Supabase client for storage and real-time subscriptions |
| `postgres` | `^3.4.0` | PostgreSQL driver |

---

## Testing

### Test Strategy

The performance module uses a layered testing strategy:

1. **Unit Tests** — Test individual functions, validators, and calculations in isolation
2. **Integration Tests** — Test database operations with a real PostgreSQL instance (via Testcontainers)
3. **E2E Tests** — Test complete workflows through the tRPC router

### Running Tests

```bash
# Run all performance module tests
pnpm test --filter=@mcv/people/performance

# Run specific test suite
pnpm test --filter=@mcv/people/performance -- --grep "review cycle"

# Run with coverage
pnpm test --filter=@mcv/people/performance -- --coverage

# Run integration tests (requires Docker)
pnpm test:integration --filter=@mcv/people/performance
```

### Test Fixtures

```typescript
import { createTestContext, createTestTenant, createTestEmployee } from '@mcv/testing';

describe('PerformanceService', () => {
  let ctx: TestContext;
  let tenant: TestTenant;
  let manager: TestEmployee;
  let employee: TestEmployee;
  let performance: PerformanceService;

  beforeAll(async () => {
    ctx = await createTestContext();
    tenant = await createTestTenant(ctx);
    manager = await createTestEmployee(ctx, tenant, { role: 'manager' });
    employee = await createTestEmployee(ctx, tenant, { managerId: manager.id });
    performance = new PerformanceService({
      db: ctx.db,
      tenantId: tenant.id,
      userId: manager.id,
    });
  });

  afterAll(async () => {
    await ctx.cleanup();
  });
});
```

### Unit Test Examples

```typescript
import { describe, it, expect } from 'vitest';
import { calculateOverallRating } from '@mcv/people/performance';

describe('calculateOverallRating', () => {
  it('calculates weighted average of question ratings', () => {
    const responses = [
      { questionId: 'q1', ratingResponse: 4, weight: 30 },
      { questionId: 'q2', ratingResponse: 5, weight: 40 },
      { questionId: 'q3', ratingResponse: 3, weight: 30 },
    ];

    const result = calculateOverallRating(responses, 'weighted_average');

    // (4*30 + 5*40 + 3*30) / 100 = (120 + 200 + 90) / 100 = 4.1
    expect(result.numericRating).toBeCloseTo(4.1);
  });

  it('handles equal weights as simple average', () => {
    const responses = [
      { questionId: 'q1', ratingResponse: 3, weight: 100 },
      { questionId: 'q2', ratingResponse: 4, weight: 100 },
      { questionId: 'q3', ratingResponse: 5, weight: 100 },
    ];

    const result = calculateOverallRating(responses, 'simple_average');

    expect(result.numericRating).toBeCloseTo(4.0);
  });

  it('maps numeric rating to correct rating level', () => {
    const scale: RatingLevel[] = [
      { value: 1, label: 'Does Not Meet', shortCode: 'DNM', description: '', color: '#FF0000' },
      { value: 2, label: 'Partially Meets', shortCode: 'PM', description: '', color: '#FFA500' },
      { value: 3, label: 'Meets Expectations', shortCode: 'ME', description: '', color: '#FFFF00' },
      { value: 4, label: 'Exceeds Expectations', shortCode: 'EE', description: '', color: '#90EE90' },
      { value: 5, label: 'Exceptional', shortCode: 'EX', description: '', color: '#00FF00' },
    ];

    const responses = [
      { questionId: 'q1', ratingResponse: 4, weight: 100 },
      { questionId: 'q2', ratingResponse: 5, weight: 100 },
    ];

    const result = calculateOverallRating(responses, 'simple_average', scale);

    expect(result.numericRating).toBeCloseTo(4.5);
    expect(result.ratingLevel.label).toBe('Exceeds Expectations'); // Rounds to nearest
  });

  it('throws on empty responses', () => {
    expect(() => calculateOverallRating([], 'weighted_average')).toThrow('PERF_RATING_INVALID_VALUE');
  });
});

describe('Goal Progress Validation', () => {
  it('rejects progress below 0', () => {
    expect(() => validateGoalProgress(-1)).toThrow('PERF_GOAL_INVALID_PROGRESS');
  });

  it('rejects progress above 100', () => {
    expect(() => validateGoalProgress(101)).toThrow('PERF_GOAL_INVALID_PROGRESS');
  });

  it('accepts valid progress values', () => {
    expect(() => validateGoalProgress(0)).not.toThrow();
    expect(() => validateGoalProgress(50)).not.toThrow();
    expect(() => validateGoalProgress(100)).not.toThrow();
  });
});

describe('OKR Progress Calculation', () => {
  it('calculates progress as weighted average of key results', () => {
    const keyResults = [
      { startValue: 0, targetValue: 100, currentValue: 50, weight: 50 },
      { startValue: 0, targetValue: 10, currentValue: 8, weight: 50 },
    ];

    const progress = calculateOKRProgress(keyResults);

    // KR1: 50/100 = 50%, KR2: 8/10 = 80%
    // Weighted: (50*50 + 80*50) / 100 = 65%
    expect(progress).toBeCloseTo(65);
  });

  it('handles binary key results', () => {
    const keyResults = [
      { startValue: 0, targetValue: 1, currentValue: 1, weight: 100, type: 'binary' as const },
    ];

    const progress = calculateOKRProgress(keyResults);
    expect(progress).toBe(100);
  });

  it('clamps progress at 100% even if currentValue exceeds target', () => {
    const keyResults = [
      { startValue: 0, targetValue: 10, currentValue: 15, weight: 100 },
    ];

    const progress = calculateOKRProgress(keyResults);
    expect(progress).toBe(100);
  });
});
```

### Integration Test Examples

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext } from '@mcv/testing';
import { PerformanceService } from '@mcv/people/performance';

describe('Review Cycle Integration', () => {
  let ctx: TestContext;
  let performance: PerformanceService;

  beforeAll(async () => {
    ctx = await createTestContext();
    performance = new PerformanceService({
      db: ctx.db,
      tenantId: ctx.tenant.id,
      userId: ctx.hrAdmin.id,
    });
  });

  afterAll(() => ctx.cleanup());

  it('creates and launches a review cycle', async () => {
    // Create template and rating scale first
    const scale = await performance.createRatingScale({
      name: 'Test 5-Point Scale',
      type: 'numeric',
      levels: [
        { value: 1, label: 'Poor', shortCode: '1', description: 'Below minimum', color: '#FF0000' },
        { value: 2, label: 'Below', shortCode: '2', description: 'Below expectations', color: '#FFA500' },
        { value: 3, label: 'Meets', shortCode: '3', description: 'Meets expectations', color: '#FFFF00' },
        { value: 4, label: 'Exceeds', shortCode: '4', description: 'Exceeds expectations', color: '#90EE90' },
        { value: 5, label: 'Outstanding', shortCode: '5', description: 'Outstanding', color: '#00FF00' },
      ],
    });

    const template = await performance.createReviewTemplate({
      name: 'Test Template',
      applicableTypes: ['self', 'manager'],
    });

    await performance.addTemplateQuestion(template.id, {
      text: 'How would you rate overall performance?',
      type: 'rating',
      config: { minValue: 1, maxValue: 5 },
      required: true,
      weight: 100,
      sortOrder: 1,
    });

    // Create cycle
    const cycle = await performance.createReviewCycle({
      name: 'Integration Test Cycle',
      frequency: 'annual',
      periodStart: new Date('2025-01-01'),
      periodEnd: new Date('2025-12-31'),
      reviewDeadline: new Date('2026-01-31'),
      ratingScaleId: scale.id,
      templateId: template.id,
      config: {
        selfAssessment: true,
        peerReview: false,
        minPeerReviewers: 0,
        maxPeerReviewers: 0,
        allowPeerNomination: false,
        upwardReview: false,
        managerReview: true,
        skipLevelReview: false,
        requireCalibration: false,
        includeGoals: false,
        includeCompetencies: false,
        transparentReviews: false,
        anonymousPeerFeedback: false,
        autoReminders: false,
        reminderDaysBefore: [],
        requireManagerApproval: false,
        forcedDistribution: null,
      },
      participantCriteria: {
        allActive: true,
        departmentIds: [],
        locationIds: [],
        employmentTypes: [],
        minTenureMonths: 0,
        excludeEmployeeIds: [],
        includeEmployeeIds: [],
      },
    });

    expect(cycle.status).toBe('draft');

    // Launch cycle
    const launched = await performance.launchReviewCycle(cycle.id);
    expect(launched.status).toBe('launched');
    expect(launched.reviewCount).toBeGreaterThan(0);
    expect(launched.launchedAt).toBeTruthy();
  });

  it('enforces tenant isolation', async () => {
    const otherTenantPerformance = new PerformanceService({
      db: ctx.db,
      tenantId: 'other-tenant-id',
      userId: ctx.hrAdmin.id,
    });

    // Should not find cycles from the test tenant
    const cycles = await otherTenantPerformance.listReviewCycles();
    expect(cycles.items).toHaveLength(0);
  });

  it('prevents launching a cycle with invalid status', async () => {
    const cycle = await performance.createReviewCycle({ /* ... */ });
    await performance.launchReviewCycle(cycle.id);

    // Trying to launch again should fail
    await expect(performance.launchReviewCycle(cycle.id))
      .rejects.toThrow('PERF_CYCLE_INVALID_STATUS');
  });
});

describe('Feedback Integration', () => {
  let ctx: TestContext;
  let performance: PerformanceService;

  beforeAll(async () => {
    ctx = await createTestContext();
    performance = new PerformanceService({
      db: ctx.db,
      tenantId: ctx.tenant.id,
      userId: ctx.manager.id,
    });
  });

  afterAll(() => ctx.cleanup());

  it('creates feedback and respects visibility rules', async () => {
    // Manager creates private feedback for report
    const feedback = await performance.createFeedbackItem({
      recipientId: ctx.employee.id,
      type: 'check_in',
      visibility: 'private',
      content: 'Great progress on the project this week.',
    });

    expect(feedback.id).toBeTruthy();
    expect(feedback.visibility).toBe('private');

    // Employee can see their own feedback
    const employeePerformance = new PerformanceService({
      db: ctx.db,
      tenantId: ctx.tenant.id,
      userId: ctx.employee.id,
    });

    const visible = await employeePerformance.getFeedbackItem(feedback.id);
    expect(visible).toBeTruthy();

    // Other employee cannot see private feedback
    const otherPerformance = new PerformanceService({
      db: ctx.db,
      tenantId: ctx.tenant.id,
      userId: ctx.otherEmployee.id,
    });

    await expect(otherPerformance.getFeedbackItem(feedback.id))
      .rejects.toThrow('PERF_FEEDBACK_NOT_FOUND');
  });

  it('enforces anonymous feedback masking', async () => {
    const feedback = await performance.createFeedbackItem({
      recipientId: ctx.employee.id,
      type: 'peer_feedback',
      visibility: 'anonymous',
      content: 'Could improve communication during standups.',
    });

    const employeePerformance = new PerformanceService({
      db: ctx.db,
      tenantId: ctx.tenant.id,
      userId: ctx.employee.id,
    });

    const visible = await employeePerformance.getFeedbackItem(feedback.id);
    expect(visible.content).toBe('Could improve communication during standups.');
    expect(visible.giverId).toBeNull(); // Masked for anonymous
  });
});

describe('PIP Workflow Integration', () => {
  let ctx: TestContext;
  let performance: PerformanceService;

  beforeAll(async () => {
    ctx = await createTestContext();
    performance = new PerformanceService({
      db: ctx.db,
      tenantId: ctx.tenant.id,
      userId: ctx.manager.id,
    });
  });

  afterAll(() => ctx.cleanup());

  it('manages complete PIP lifecycle', async () => {
    // Create PIP
    const pip = await performance.createPIP({
      employeeId: ctx.employee.id,
      managerId: ctx.manager.id,
      title: 'Test PIP',
      description: 'Integration test PIP',
      areasOfConcern: ['Area 1'],
      expectedOutcomes: ['Outcome 1'],
      supportProvided: ['Support 1'],
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-08-30'),
      checkInFrequency: 'weekly',
    });

    expect(pip.status).toBe('draft');

    // Add milestone
    const milestone = await performance.addPIPMilestone(pip.id, {
      title: 'Test Milestone',
      description: 'First milestone',
      successCriteria: 'Criteria met',
      dueDate: new Date('2025-07-15'),
      sortOrder: 1,
    });

    expect(milestone.status).toBe('pending');

    // Complete milestone
    const completed = await performance.completePIPMilestone(milestone.id, 'Evidence provided');
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeTruthy();

    // Close PIP successfully
    const closed = await performance.closePIP(pip.id, 'successful', 'All criteria met');
    expect(closed.status).toBe('completed');
    expect(closed.outcome).toBe('successful');
    expect(closed.closedAt).toBeTruthy();

    // Cannot modify closed PIP
    await expect(performance.updatePIP(pip.id, { title: 'Updated' }))
      .rejects.toThrow('PERF_PIP_ALREADY_CLOSED');
  });
});
```

### Test Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| **Unit tests** | ≥ 90% line coverage | Core calculations (ratings, progress, distributions) must be thoroughly tested |
| **Integration tests** | ≥ 80% line coverage | All CRUD operations, RLS enforcement, and state transitions |
| **E2E tests** | Key workflows | Review cycle lifecycle, feedback flow, PIP lifecycle, calibration |
| **Security tests** | 100% of RLS policies | Every permission boundary must have an explicit test |
| **Error path tests** | All error codes | Every documented error code must have at least one triggering test |

---

*Last updated: 2026-02-09 · Module version: 0.12.0*