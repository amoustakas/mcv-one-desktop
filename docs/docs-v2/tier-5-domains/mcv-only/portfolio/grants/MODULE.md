# @mcv/portfolio/grants

> **Tier 5 Domain Module — MCV-Only**
> Grant lifecycle management: discovery, application, tracking, disbursement, compliance, and analytics.
> Part of the **Full Gain** venture — MCV's dedicated grant management platform.

| Field        | Value                        |
|-------------|------------------------------|
| Package     | `@mcv/portfolio/grants`      |
| Tier        | 5 (Domain)                   |
| Access      | MCV-Only                     |
| Venture     | Full Gain                    |
| Since       | 0.1.0                        |
| Status      | Active                       |
| Owner       | Portfolio Team                |

---

## Purpose

Grant funding represents one of the most significant — and most underutilized — capital sources available to organizations, nonprofits, municipalities, and startups. Billions of dollars in federal, state, and private grant funding go unclaimed every year, not because organizations are ineligible, but because the grant lifecycle is extraordinarily complex: discovery requires navigating fragmented databases, applications demand precise narrative and budgetary alignment, compliance reporting imposes rigid schedules with severe penalties for non-compliance, and disbursement tracking requires forensic-level financial accounting. **@mcv/portfolio/grants** exists to tame this complexity, providing a unified platform that manages every stage of the grant lifecycle from initial discovery through final closeout.

This module is the technical backbone of the **Full Gain** venture — MCV's grant management platform designed to democratize access to grant funding. Full Gain serves grant-seeking organizations of all sizes, from solo nonprofit founders managing their first $10,000 community development grant to large institutions juggling dozens of concurrent federal awards totaling millions. The grants module provides intelligent discovery and eligibility matching against a continuously updated database of available grants, structured application workflows with collaborative drafting and review, real-time tracking of active grants with milestone management, automated compliance reporting that maps to each grantor's specific requirements, disbursement tracking with line-item-level budget accountability, and comprehensive analytics that help organizations optimize their grant strategy over time.

Architecturally, `@mcv/portfolio/grants` is built on Supabase PostgreSQL with multi-tenant row-level security, ensuring that each organization's grant data is strictly isolated. It exposes its functionality through tRPC endpoints and integrates deeply with `@mcv/finance` for budget management and financial tracking, `@mcv/documents` for proposal generation and report assembly, and `@mcv/notifications` for deadline alerts and status change notifications. The module supports the full spectrum of grant types — federal formula grants, competitive discretionary grants, state block grants, private foundation grants, corporate giving programs, and pass-through awards — each with their own compliance frameworks and reporting cadences.

---

## Exports

```typescript
// === Main Barrel Export ===
// @mcv/portfolio/grants/index.ts

// --- Core Service ---
export { GrantService } from './services/grant.service';
export { GrantDiscoveryService } from './services/discovery.service';
export { GrantApplicationService } from './services/application.service';
export { GrantTrackingService } from './services/tracking.service';
export { GrantMilestoneService } from './services/milestone.service';
export { GrantDisbursementService } from './services/disbursement.service';
export { GrantComplianceService } from './services/compliance.service';
export { GrantBudgetService } from './services/budget.service';
export { GrantDeadlineService } from './services/deadline.service';
export { GrantDocumentService } from './services/document.service';
export { GrantAnalyticsService } from './services/analytics.service';

// --- Types & Interfaces ---
export type {
  Grant,
  GrantSummary,
  GrantDetail,
  GrantSource,
  GrantType,
  GrantStatus,
  GrantCategory,
  EligibilityCriteria,
  EligibilityMatch,
  EligibilityScore,
} from './types/grant.types';

export type {
  GrantApplication,
  ApplicationStatus,
  ApplicationDraft,
  ApplicationSection,
  ApplicationReview,
  ReviewComment,
  ReviewDecision,
  SubmissionPackage,
  SubmissionResult,
} from './types/application.types';

export type {
  GrantMilestone,
  MilestoneStatus,
  MilestoneType,
  MilestoneDeliverable,
  MilestoneCompletionCriteria,
  MilestonePaymentTrigger,
  MilestoneEvidence,
} from './types/milestone.types';

export type {
  Disbursement,
  DisbursementStatus,
  DisbursementType,
  DisbursementAllocation,
  DisbursementReceipt,
  FundingDrawdown,
  DrawdownRequest,
} from './types/disbursement.types';

export type {
  ComplianceReport,
  ReportType,
  ReportStatus,
  ReportSchedule,
  ReportTemplate,
  ReportSection,
  ComplianceRequirement,
  ComplianceStatus,
  AuditTrailEntry,
} from './types/compliance.types';

export type {
  GrantBudget,
  BudgetLineItem,
  BudgetCategory,
  BudgetModification,
  BudgetModificationStatus,
  BurnRate,
  BurnRateProjection,
  CostShareRequirement,
  MatchingFunds,
} from './types/budget.types';

export type {
  GrantDeadline,
  DeadlineType,
  DeadlineAlert,
  DeadlineAlertConfig,
  DeadlineEscalation,
} from './types/deadline.types';

export type {
  GrantDocument,
  DocumentType,
  DocumentVersion,
  DocumentMetadata,
} from './types/document.types';

export type {
  GrantAnalytics,
  SuccessRateMetrics,
  FundingTrends,
  GrantROI,
  PipelineMetrics,
  PortfolioSummary,
  GrantorAnalytics,
  CategoryAnalytics,
} from './types/analytics.types';

// --- Schemas (Drizzle ORM) ---
export {
  grants,
  grantApplications,
  grantMilestones,
  disbursements,
  grantBudgets,
  grantBudgetLineItems,
  grantReports,
  grantDocuments,
  grantDeadlines,
  grantEligibilityCriteria,
  grantCategories,
  grantSources,
  grantNotes,
  grantTeamMembers,
} from './db/schema';

// --- tRPC Router ---
export { grantRouter } from './trpc/grant.router';
export { discoveryRouter } from './trpc/discovery.router';
export { applicationRouter } from './trpc/application.router';
export { milestoneRouter } from './trpc/milestone.router';
export { disbursementRouter } from './trpc/disbursement.router';
export { complianceRouter } from './trpc/compliance.router';
export { budgetRouter } from './trpc/budget.router';
export { deadlineRouter } from './trpc/deadline.router';
export { analyticsRouter } from './trpc/analytics.router';

// --- Validators (Zod) ---
export {
  createGrantSchema,
  updateGrantSchema,
  grantFilterSchema,
  createApplicationSchema,
  submitApplicationSchema,
  createMilestoneSchema,
  completeMilestoneSchema,
  createDisbursementSchema,
  createBudgetSchema,
  modifyBudgetSchema,
  createReportSchema,
  eligibilityQuerySchema,
} from './validators';

// --- Constants ---
export {
  GRANT_STATUSES,
  APPLICATION_STATUSES,
  MILESTONE_STATUSES,
  DISBURSEMENT_STATUSES,
  REPORT_TYPES,
  GRANT_TYPES,
  GRANT_SOURCES,
  BUDGET_CATEGORIES,
  FEDERAL_CFDA_CATEGORIES,
  COMPLIANCE_FRAMEWORKS,
  DEADLINE_ALERT_DEFAULTS,
} from './constants';

// --- Errors ---
export {
  GrantError,
  GrantNotFoundError,
  ApplicationNotFoundError,
  ApplicationAlreadySubmittedError,
  MilestoneNotFoundError,
  MilestoneAlreadyCompleteError,
  DisbursementExceedsBudgetError,
  BudgetOverrunError,
  ComplianceViolationError,
  DeadlinePassedError,
  EligibilityCheckFailedError,
  InsufficientGrantPermissionsError,
  GrantCloseoutIncompleteError,
  DuplicateGrantError,
} from './errors';

// --- Hooks (React) ---
export {
  useGrants,
  useGrant,
  useGrantDiscovery,
  useGrantApplication,
  useGrantApplications,
  useGrantMilestones,
  useGrantDisbursements,
  useGrantBudget,
  useGrantCompliance,
  useGrantDeadlines,
  useGrantDocuments,
  useGrantAnalytics,
  useGrantPipeline,
  useEligibilityCheck,
} from './hooks';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         @mcv/portfolio/grants                               │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          tRPC Router Layer                             │ │
│  │                                                                        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │ │
│  │  │Discovery │ │Applicat- │ │Milestone │ │Disburse- │ │ Compliance │  │ │
│  │  │ Router   │ │ion Router│ │ Router   │ │ment Router│ │   Router   │  │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │ │
│  │       │             │            │             │              │         │ │
│  │  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌─────┴──────┐  │ │
│  │  │ Budget   │ │ Deadline │ │ Document │ │Analytics │ │   Grant    │  │ │
│  │  │ Router   │ │ Router   │ │ Router   │ │ Router   │ │   Router   │  │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │ │
│  └───────┼─────────────┼────────────┼─────────────┼──────────────┼────────┘ │
│          │             │            │             │              │           │
│  ┌───────┴─────────────┴────────────┴─────────────┴──────────────┴────────┐ │
│  │                        Service Layer                                   │ │
│  │                                                                        │ │
│  │  ┌──────────────────┐  ┌────────────────────┐  ┌───────────────────┐   │ │
│  │  │  GrantService    │  │DiscoveryService    │  │ApplicationService │   │ │
│  │  │  ─────────────── │  │──────────────────  │  │───────────────────│   │ │
│  │  │  CRUD, status    │  │Eligibility match   │  │Draft, review,     │   │ │
│  │  │  transitions,    │  │Grant DB search     │  │submit, track      │   │ │
│  │  │  lifecycle mgmt  │  │Recommendation      │  │Application flow   │   │ │
│  │  └──────────────────┘  └────────────────────┘  └───────────────────┘   │ │
│  │                                                                        │ │
│  │  ┌──────────────────┐  ┌────────────────────┐  ┌───────────────────┐   │ │
│  │  │MilestoneService  │  │DisbursementService │  │ComplianceService  │   │ │
│  │  │──────────────────│  │────────────────────│  │───────────────────│   │ │
│  │  │Define, track,    │  │Record receipts,    │  │Report generation, │   │ │
│  │  │complete, verify  │  │allocate, drawdown  │  │schedule tracking, │   │ │
│  │  │Payment triggers  │  │Spending tracking   │  │audit trail        │   │ │
│  │  └──────────────────┘  └────────────────────┘  └───────────────────┘   │ │
│  │                                                                        │ │
│  │  ┌──────────────────┐  ┌────────────────────┐  ┌───────────────────┐   │ │
│  │  │BudgetService     │  │DeadlineService     │  │AnalyticsService   │   │ │
│  │  │──────────────────│  │────────────────────│  │───────────────────│   │ │
│  │  │Line items, mods  │  │Alerts, escalation  │  │Success rates, ROI │   │ │
│  │  │Burn rate, match  │  │Calendar sync       │  │Trends, pipeline   │   │ │
│  │  │Cost share track  │  │Notification rules  │  │Portfolio analysis  │   │ │
│  │  └──────────────────┘  └────────────────────┘  └───────────────────┘   │ │
│  │                                                                        │ │
│  │  ┌──────────────────┐                                                  │ │
│  │  │DocumentService   │                                                  │ │
│  │  │──────────────────│                                                  │ │
│  │  │Proposals, awards │                                                  │ │
│  │  │Amendments, corr. │                                                  │ │
│  │  │Version control   │                                                  │ │
│  │  └──────────────────┘                                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│          │             │            │             │              │           │
│  ┌───────┴─────────────┴────────────┴─────────────┴──────────────┴────────┐ │
│  │                     Data Access Layer (Drizzle ORM)                     │ │
│  │                                                                        │ │
│  │  ┌─────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────────┐  │ │
│  │  │ grants  │ │grant_applica-│ │grant_mile-    │ │ disbursements   │  │ │
│  │  │         │ │tions         │ │stones         │ │                  │  │ │
│  │  └─────────┘ └──────────────┘ └───────────────┘ └──────────────────┘  │ │
│  │  ┌─────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────────┐  │ │
│  │  │grant_   │ │grant_budget_ │ │grant_reports  │ │grant_documents  │  │ │
│  │  │budgets  │ │line_items    │ │               │ │                  │  │ │
│  │  └─────────┘ └──────────────┘ └───────────────┘ └──────────────────┘  │ │
│  │  ┌─────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────────┐  │ │
│  │  │grant_   │ │grant_        │ │grant_         │ │grant_team_      │  │ │
│  │  │deadlines│ │eligibility   │ │categories     │ │members          │  │ │
│  │  └─────────┘ └──────────────┘ └───────────────┘ └──────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      External Integrations                          │    │
│  │                                                                     │    │
│  │   @mcv/finance ◄──── Budget sync, financial tracking                │    │
│  │   @mcv/documents ◄── Proposal generation, report assembly           │    │
│  │   @mcv/notifications ◄── Deadline alerts, status notifications      │    │
│  │   @mcv/auth ◄──── RBAC, tenant isolation, team permissions          │    │
│  │   @mcv/audit ◄──── Compliance audit trail, change logging           │    │
│  │   Grants.gov API ◄── Federal grant discovery, SAM.gov integration   │    │
│  │   Foundation Directory ◄── Private foundation grant database        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                Supabase PostgreSQL (Multi-Tenant RLS)               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Grant Lifecycle State Machine

```
                    ┌──────────────────────────────────────────────────┐
                    │                 GRANT LIFECYCLE                    │
                    └──────────────────────────────────────────────────┘

  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────┐
  │DISCOVERED│────►│EVALUATING│────►│APPLYING  │────►│SUBMITTED     │
  └──────────┘     └────┬─────┘     └────┬─────┘     └──────┬───────┘
                        │                │                    │
                   ┌────▼─────┐     ┌────▼─────┐        ┌────▼───────┐
                   │NOT_FIT   │     │WITHDRAWN │        │UNDER_REVIEW│
                   └──────────┘     └──────────┘        └──────┬─────┘
                                                               │
                        ┌──────────────────────────────────────┤
                        │                                      │
                   ┌────▼─────┐                          ┌─────▼──────┐
                   │DECLINED  │                          │AWARDED     │
                   └──────────┘                          └─────┬──────┘
                                                               │
                                                         ┌─────▼──────┐
                                                         │ACTIVE      │
                                                         └─────┬──────┘
                                                               │
                        ┌──────────────┬───────────────────────┤
                        │              │                        │
                   ┌────▼─────┐  ┌─────▼──────┐         ┌─────▼──────┐
                   │SUSPENDED │  │ON_EXTENSION │         │CLOSING_OUT │
                   └────┬─────┘  └─────┬──────┘         └─────┬──────┘
                        │              │                        │
                        └──────┬───────┘                 ┌─────▼──────┐
                               │                         │CLOSED      │
                          ┌────▼─────┐                   └────────────┘
                          │TERMINATED│
                          └──────────┘


  APPLICATION LIFECYCLE:
  ┌──────┐   ┌────────┐   ┌──────────┐   ┌─────────┐   ┌─────────┐
  │DRAFT │──►│IN_REVIEW│──►│APPROVED  │──►│SUBMITTED│──►│ACCEPTED │
  └──┬───┘   └────┬───┘   └──────────┘   └─────────┘   └─────────┘
     │            │
     │       ┌────▼────────┐                             ┌─────────┐
     │       │REVISION_REQ │                             │REJECTED │
     │       └─────────────┘                             └─────────┘
     │
  ┌──▼──────┐
  │ABANDONED│
  └─────────┘
```

---

## Core Interfaces

### GrantService

```typescript
// services/grant.service.ts

import { TRPCError } from '@trpc/server';
import { eq, and, desc, sql, ilike, inArray, gte, lte, between } from 'drizzle-orm';
import { db } from '@mcv/database';
import { grants, grantCategories, grantSources } from '../db/schema';
import type {
  Grant,
  GrantSummary,
  GrantDetail,
  GrantStatus,
  GrantType,
  CreateGrantInput,
  UpdateGrantInput,
  GrantFilter,
} from '../types/grant.types';

export class GrantService {
  /**
   * Create a new grant record — typically from discovery or manual entry.
   * Initializes the grant in DISCOVERED status with associated metadata.
   */
  async createGrant(
    tenantId: string,
    input: CreateGrantInput,
    userId: string,
  ): Promise<Grant> {
    const [grant] = await db
      .insert(grants)
      .values({
        tenantId,
        title: input.title,
        description: input.description,
        grantorName: input.grantorName,
        grantorType: input.grantorType,
        grantType: input.grantType,
        fundingAmount: input.fundingAmount,
        fundingAmountMin: input.fundingAmountMin,
        fundingAmountMax: input.fundingAmountMax,
        currency: input.currency ?? 'USD',
        applicationDeadline: input.applicationDeadline,
        startDate: input.startDate,
        endDate: input.endDate,
        status: 'discovered',
        sourceUrl: input.sourceUrl,
        cfdaNumber: input.cfdaNumber,
        fundingOpportunityNumber: input.fundingOpportunityNumber,
        eligibilityRequirements: input.eligibilityRequirements,
        matchingRequired: input.matchingRequired ?? false,
        matchingPercentage: input.matchingPercentage,
        costShareRequired: input.costShareRequired ?? false,
        costSharePercentage: input.costSharePercentage,
        indirectCostRate: input.indirectCostRate,
        tags: input.tags ?? [],
        metadata: input.metadata ?? {},
        createdBy: userId,
      })
      .returning();

    // Create category associations
    if (input.categoryIds?.length) {
      await this.associateCategories(grant.id, input.categoryIds);
    }

    return grant;
  }

  /**
   * Retrieve a single grant with full detail, including related
   * applications, milestones, budgets, and documents.
   */
  async getGrantDetail(
    tenantId: string,
    grantId: string,
  ): Promise<GrantDetail> {
    const grant = await db.query.grants.findFirst({
      where: and(eq(grants.id, grantId), eq(grants.tenantId, tenantId)),
      with: {
        applications: { orderBy: desc(grantApplications.createdAt) },
        milestones: { orderBy: grantMilestones.dueDate },
        budgets: true,
        documents: { orderBy: desc(grantDocuments.createdAt) },
        deadlines: { orderBy: grantDeadlines.dueDate },
        teamMembers: { with: { user: true } },
        notes: { orderBy: desc(grantNotes.createdAt), limit: 50 },
      },
    });

    if (!grant) {
      throw new GrantNotFoundError(grantId);
    }

    return this.enrichGrantDetail(grant);
  }

  /**
   * List grants with filtering, sorting, and pagination.
   * Supports full-text search across title, description, and grantor name.
   */
  async listGrants(
    tenantId: string,
    filter: GrantFilter,
  ): Promise<{ grants: GrantSummary[]; total: number; hasMore: boolean }> {
    const conditions = [eq(grants.tenantId, tenantId)];

    if (filter.status?.length) {
      conditions.push(inArray(grants.status, filter.status));
    }
    if (filter.grantType?.length) {
      conditions.push(inArray(grants.grantType, filter.grantType));
    }
    if (filter.search) {
      conditions.push(
        sql`to_tsvector('english', ${grants.title} || ' ' || ${grants.description} || ' ' || ${grants.grantorName})
            @@ plainto_tsquery('english', ${filter.search})`,
      );
    }
    if (filter.minAmount) {
      conditions.push(gte(grants.fundingAmount, filter.minAmount));
    }
    if (filter.maxAmount) {
      conditions.push(lte(grants.fundingAmount, filter.maxAmount));
    }
    if (filter.deadlineBefore) {
      conditions.push(lte(grants.applicationDeadline, filter.deadlineBefore));
    }
    if (filter.deadlineAfter) {
      conditions.push(gte(grants.applicationDeadline, filter.deadlineAfter));
    }
    if (filter.tags?.length) {
      conditions.push(sql`${grants.tags} && ${filter.tags}`);
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(grants)
      .where(and(...conditions));

    const limit = filter.limit ?? 25;
    const offset = filter.offset ?? 0;

    const results = await db
      .select()
      .from(grants)
      .where(and(...conditions))
      .orderBy(this.buildSortClause(filter.sortBy, filter.sortOrder))
      .limit(limit)
      .offset(offset);

    return {
      grants: results.map(this.toSummary),
      total: count,
      hasMore: offset + limit < count,
    };
  }

  /**
   * Transition a grant to a new status, enforcing valid state transitions.
   * Logs the transition in the audit trail with the reason.
   */
  async transitionStatus(
    tenantId: string,
    grantId: string,
    newStatus: GrantStatus,
    userId: string,
    reason?: string,
  ): Promise<Grant> {
    const grant = await this.getGrant(tenantId, grantId);
    const validTransitions = this.getValidTransitions(grant.status);

    if (!validTransitions.includes(newStatus)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot transition from '${grant.status}' to '${newStatus}'. Valid transitions: ${validTransitions.join(', ')}`,
      });
    }

    const [updated] = await db
      .update(grants)
      .set({
        status: newStatus,
        statusChangedAt: new Date(),
        statusChangedBy: userId,
        statusChangeReason: reason,
        updatedAt: new Date(),
        ...(newStatus === 'active' ? { activatedAt: new Date() } : {}),
        ...(newStatus === 'closed' ? { closedAt: new Date() } : {}),
      })
      .where(and(eq(grants.id, grantId), eq(grants.tenantId, tenantId)))
      .returning();

    // Emit status change event for notification system
    await this.emitGrantEvent('grant.status_changed', {
      tenantId,
      grantId,
      previousStatus: grant.status,
      newStatus,
      userId,
      reason,
    });

    return updated;
  }

  /**
   * Archive a closed grant, preserving all data but removing
   * it from active views and dashboards.
   */
  async archiveGrant(
    tenantId: string,
    grantId: string,
    userId: string,
  ): Promise<void> {
    const grant = await this.getGrant(tenantId, grantId);

    if (grant.status !== 'closed') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Only closed grants can be archived',
      });
    }

    await db
      .update(grants)
      .set({ archivedAt: new Date(), archivedBy: userId })
      .where(and(eq(grants.id, grantId), eq(grants.tenantId, tenantId)));
  }

  /**
   * Duplicate an existing grant record as a template for a new
   * grant cycle (common for recurring annual grants).
   */
  async duplicateGrant(
    tenantId: string,
    sourceGrantId: string,
    overrides: Partial<CreateGrantInput>,
    userId: string,
  ): Promise<Grant> {
    const source = await this.getGrantDetail(tenantId, sourceGrantId);

    return this.createGrant(
      tenantId,
      {
        title: overrides.title ?? `${source.title} (Copy)`,
        description: overrides.description ?? source.description,
        grantorName: source.grantorName,
        grantorType: source.grantorType,
        grantType: source.grantType,
        fundingAmount: overrides.fundingAmount ?? source.fundingAmount,
        applicationDeadline: overrides.applicationDeadline,
        ...overrides,
      },
      userId,
    );
  }

  // --- Private Helpers ---

  private getValidTransitions(currentStatus: GrantStatus): GrantStatus[] {
    const transitions: Record<GrantStatus, GrantStatus[]> = {
      discovered: ['evaluating', 'not_fit'],
      evaluating: ['applying', 'not_fit'],
      applying: ['submitted', 'withdrawn'],
      submitted: ['under_review', 'withdrawn'],
      under_review: ['awarded', 'declined'],
      awarded: ['active'],
      active: ['suspended', 'on_extension', 'closing_out'],
      suspended: ['active', 'terminated'],
      on_extension: ['active', 'closing_out', 'terminated'],
      closing_out: ['closed'],
      closed: [],
      not_fit: ['evaluating'], // Can re-evaluate
      withdrawn: ['applying'], // Can re-apply
      declined: ['applying'],  // Can re-apply next cycle
      terminated: [],
    };

    return transitions[currentStatus] ?? [];
  }

  private async emitGrantEvent(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    // Emit to event bus for notifications, audit, etc.
    await eventBus.emit(eventType, payload);
  }
}
```

### Grant

```typescript
// types/grant.types.ts

export type GrantStatus =
  | 'discovered'
  | 'evaluating'
  | 'applying'
  | 'submitted'
  | 'under_review'
  | 'awarded'
  | 'active'
  | 'suspended'
  | 'on_extension'
  | 'closing_out'
  | 'closed'
  | 'not_fit'
  | 'withdrawn'
  | 'declined'
  | 'terminated';

export type GrantType =
  | 'federal_competitive'
  | 'federal_formula'
  | 'federal_block'
  | 'federal_earmark'
  | 'state_competitive'
  | 'state_formula'
  | 'state_block'
  | 'local_government'
  | 'private_foundation'
  | 'corporate'
  | 'community_foundation'
  | 'pass_through'
  | 'cooperative_agreement'
  | 'other';

export type GrantorType =
  | 'federal_agency'
  | 'state_agency'
  | 'local_government'
  | 'private_foundation'
  | 'corporate_foundation'
  | 'community_foundation'
  | 'nonprofit'
  | 'international_org'
  | 'other';

export interface Grant {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  grantorName: string;
  grantorType: GrantorType;
  grantType: GrantType;
  fundingAmount: number;
  fundingAmountMin: number | null;
  fundingAmountMax: number | null;
  currency: string;
  applicationDeadline: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  status: GrantStatus;
  sourceUrl: string | null;
  cfdaNumber: string | null;
  fundingOpportunityNumber: string | null;
  eligibilityRequirements: EligibilityCriteria | null;
  matchingRequired: boolean;
  matchingPercentage: number | null;
  costShareRequired: boolean;
  costSharePercentage: number | null;
  indirectCostRate: number | null;
  tags: string[];
  metadata: Record<string, unknown>;
  awardNumber: string | null;
  awardDate: Date | null;
  awardAmount: number | null;
  totalDisbursed: number;
  totalRemaining: number;
  activatedAt: Date | null;
  closedAt: Date | null;
  archivedAt: Date | null;
  statusChangedAt: Date | null;
  statusChangedBy: string | null;
  statusChangeReason: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrantSummary {
  id: string;
  title: string;
  grantorName: string;
  grantType: GrantType;
  fundingAmount: number;
  status: GrantStatus;
  applicationDeadline: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  awardAmount: number | null;
  totalDisbursed: number;
  totalRemaining: number;
  milestoneProgress: { completed: number; total: number };
  nextDeadline: { type: string; date: Date; label: string } | null;
}

export interface GrantDetail extends Grant {
  applications: GrantApplication[];
  milestones: GrantMilestone[];
  budgets: GrantBudget[];
  documents: GrantDocument[];
  deadlines: GrantDeadline[];
  teamMembers: GrantTeamMember[];
  notes: GrantNote[];
  disbursementSummary: DisbursementSummary;
  complianceSummary: ComplianceSummary;
}

export interface EligibilityCriteria {
  organizationTypes: string[];
  geographicRestrictions: string[];
  minimumYearsOperation: number | null;
  minimumAnnualBudget: number | null;
  maximumAnnualBudget: number | null;
  requiredRegistrations: string[]; // e.g., ['SAM.gov', 'Grants.gov']
  requiredCertifications: string[];
  prohibitedActivities: string[];
  additionalCriteria: Record<string, string>;
}

export interface EligibilityMatch {
  grantId: string;
  overallScore: number; // 0-100
  matchDetails: EligibilityMatchDetail[];
  disqualifiers: string[];
  recommendations: string[];
}

export interface EligibilityMatchDetail {
  criterion: string;
  met: boolean;
  score: number;
  notes: string;
}

export interface GrantFilter {
  status?: GrantStatus[];
  grantType?: GrantType[];
  grantorType?: GrantorType[];
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  deadlineBefore?: Date;
  deadlineAfter?: Date;
  tags?: string[];
  categoryIds?: string[];
  assignedTo?: string;
  sortBy?: 'title' | 'deadline' | 'amount' | 'status' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

export interface CreateGrantInput {
  title: string;
  description: string;
  grantorName: string;
  grantorType: GrantorType;
  grantType: GrantType;
  fundingAmount: number;
  fundingAmountMin?: number;
  fundingAmountMax?: number;
  currency?: string;
  applicationDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  sourceUrl?: string;
  cfdaNumber?: string;
  fundingOpportunityNumber?: string;
  eligibilityRequirements?: EligibilityCriteria;
  matchingRequired?: boolean;
  matchingPercentage?: number;
  costShareRequired?: boolean;
  costSharePercentage?: number;
  indirectCostRate?: number;
  tags?: string[];
  categoryIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateGrantInput extends Partial<CreateGrantInput> {
  awardNumber?: string;
  awardDate?: Date;
  awardAmount?: number;
}
```

### GrantApplication

```typescript
// types/application.types.ts

export type ApplicationStatus =
  | 'draft'
  | 'in_review'
  | 'revision_requested'
  | 'approved'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'abandoned';

export interface GrantApplication {
  id: string;
  tenantId: string;
  grantId: string;
  title: string;
  applicationNumber: string | null;
  status: ApplicationStatus;
  version: number;
  narrative: ApplicationNarrative;
  proposedBudget: ProposedBudget;
  projectTimeline: ProjectTimelineItem[];
  keyPersonnel: KeyPersonnel[];
  supportingDocumentIds: string[];
  submissionMethod: 'online_portal' | 'email' | 'mail' | 'grants_gov' | 'other';
  submissionUrl: string | null;
  submissionConfirmation: string | null;
  submittedAt: Date | null;
  submittedBy: string | null;
  dueDate: Date;
  reviewers: ApplicationReviewer[];
  reviewComments: ReviewComment[];
  score: number | null;
  feedback: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationNarrative {
  executiveSummary: string;
  statementOfNeed: string;
  projectDescription: string;
  goalsAndObjectives: string;
  methodology: string;
  evaluationPlan: string;
  sustainabilityPlan: string;
  organizationBackground: string;
  additionalSections: { title: string; content: string }[];
}

export interface ProposedBudget {
  totalRequested: number;
  matchingContribution: number;
  inKindContribution: number;
  totalProjectCost: number;
  lineItems: ProposedBudgetLineItem[];
  justification: string;
}

export interface ProposedBudgetLineItem {
  category: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  grantFunded: number;
  matchFunded: number;
  notes: string;
}

export interface KeyPersonnel {
  name: string;
  title: string;
  role: string;
  percentEffort: number;
  annualSalary: number;
  grantSalary: number;
  qualifications: string;
  biosSketchDocumentId: string | null;
}

export interface ProjectTimelineItem {
  phase: string;
  description: string;
  startMonth: number;
  endMonth: number;
  milestones: string[];
  deliverables: string[];
}

export interface ApplicationReviewer {
  userId: string;
  role: 'primary_reviewer' | 'secondary_reviewer' | 'approver';
  status: 'pending' | 'in_progress' | 'completed';
  assignedAt: Date;
  completedAt: Date | null;
  decision: 'approve' | 'request_revision' | 'reject' | null;
}

export interface ReviewComment {
  id: string;
  applicationId: string;
  userId: string;
  section: string;
  content: string;
  type: 'comment' | 'suggestion' | 'issue' | 'approval';
  resolved: boolean;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdAt: Date;
}

export interface ReviewDecision {
  applicationId: string;
  decision: 'approve' | 'request_revision' | 'reject';
  comments: string;
  conditions: string[];
  userId: string;
}
```

### GrantMilestone

```typescript
// types/milestone.types.ts

export type MilestoneStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_verification'
  | 'completed'
  | 'overdue'
  | 'waived'
  | 'failed';

export type MilestoneType =
  | 'programmatic'
  | 'financial'
  | 'reporting'
  | 'deliverable'
  | 'administrative'
  | 'custom';

export interface GrantMilestone {
  id: string;
  tenantId: string;
  grantId: string;
  title: string;
  description: string;
  type: MilestoneType;
  status: MilestoneStatus;
  sequenceNumber: number;
  dueDate: Date;
  completedDate: Date | null;
  completionCriteria: MilestoneCompletionCriteria;
  deliverables: MilestoneDeliverable[];
  paymentTrigger: MilestonePaymentTrigger | null;
  evidence: MilestoneEvidence[];
  verifiedBy: string | null;
  verifiedAt: Date | null;
  verificationNotes: string | null;
  dependencies: string[]; // IDs of prerequisite milestones
  percentComplete: number;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MilestoneCompletionCriteria {
  description: string;
  checklistItems: { item: string; completed: boolean; completedAt: Date | null }[];
  requiresEvidence: boolean;
  requiredEvidenceTypes: string[];
  requiresVerification: boolean;
  verificationMethod: 'self' | 'peer' | 'supervisor' | 'external' | 'automatic';
}

export interface MilestoneDeliverable {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'data' | 'report' | 'product' | 'service' | 'other';
  status: 'pending' | 'in_progress' | 'submitted' | 'accepted' | 'rejected';
  dueDate: Date;
  submittedDate: Date | null;
  documentId: string | null;
  feedback: string | null;
}

export interface MilestonePaymentTrigger {
  triggerType: 'on_completion' | 'on_verification' | 'on_deliverable_acceptance' | 'scheduled';
  amount: number;
  percentage: number | null; // % of total grant
  disbursementId: string | null;
  triggered: boolean;
  triggeredAt: Date | null;
  conditions: string[];
}

export interface MilestoneEvidence {
  id: string;
  milestoneId: string;
  type: 'document' | 'photo' | 'data' | 'attestation' | 'third_party_verification';
  title: string;
  description: string;
  documentId: string | null;
  url: string | null;
  uploadedBy: string;
  uploadedAt: Date;
  verified: boolean;
}
```

### Disbursement

```typescript
// types/disbursement.types.ts

export type DisbursementStatus =
  | 'pending'
  | 'requested'
  | 'approved'
  | 'in_transit'
  | 'received'
  | 'allocated'
  | 'partially_allocated'
  | 'rejected'
  | 'returned';

export type DisbursementType =
  | 'advance'
  | 'reimbursement'
  | 'milestone_payment'
  | 'scheduled_payment'
  | 'final_payment'
  | 'cost_share_match'
  | 'adjustment';

export interface Disbursement {
  id: string;
  tenantId: string;
  grantId: string;
  milestoneId: string | null;
  type: DisbursementType;
  status: DisbursementStatus;
  requestedAmount: number;
  approvedAmount: number | null;
  receivedAmount: number | null;
  currency: string;
  requestDate: Date;
  approvalDate: Date | null;
  receivedDate: Date | null;
  reference: string | null;
  drawdownRequestId: string | null;
  allocations: DisbursementAllocation[];
  receipts: DisbursementReceipt[];
  notes: string | null;
  approvedBy: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisbursementAllocation {
  id: string;
  disbursementId: string;
  budgetLineItemId: string;
  budgetCategory: string;
  amount: number;
  description: string;
  allocatedAt: Date;
  allocatedBy: string;
}

export interface DisbursementReceipt {
  id: string;
  disbursementId: string;
  receiptNumber: string;
  amount: number;
  vendor: string;
  description: string;
  date: Date;
  documentId: string | null;
  category: string;
  verified: boolean;
  verifiedBy: string | null;
  verifiedAt: Date | null;
}

export interface FundingDrawdown {
  id: string;
  tenantId: string;
  grantId: string;
  requestNumber: string;
  period: { start: Date; end: Date };
  requestedAmount: number;
  approvedAmount: number | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  lineItems: DrawdownLineItem[];
  supportingDocumentIds: string[];
  submittedAt: Date | null;
  approvedAt: Date | null;
  paidAt: Date | null;
  createdBy: string;
  createdAt: Date;
}

export interface DrawdownLineItem {
  budgetCategory: string;
  previouslyDrawn: number;
  thisRequest: number;
  cumulativeDrawn: number;
  budgetRemaining: number;
}

export interface DrawdownRequest {
  grantId: string;
  period: { start: Date; end: Date };
  lineItems: { budgetLineItemId: string; amount: number; description: string }[];
  supportingDocumentIds: string[];
  notes: string;
}
```

### ComplianceReport

```typescript
// types/compliance.types.ts

export type ReportType =
  | 'progress'
  | 'financial'
  | 'performance'
  | 'annual'
  | 'quarterly'
  | 'semi_annual'
  | 'final'
  | 'closeout'
  | 'sf_425'    // Federal Financial Report
  | 'sf_428'    // Tangible Personal Property Report
  | 'sf_429'    // Real Property Status Report
  | 'custom';

export type ReportStatus =
  | 'not_started'
  | 'in_progress'
  | 'in_review'
  | 'approved'
  | 'submitted'
  | 'accepted'
  | 'revision_requested'
  | 'overdue';

export interface ComplianceReport {
  id: string;
  tenantId: string;
  grantId: string;
  reportType: ReportType;
  reportPeriod: { start: Date; end: Date };
  status: ReportStatus;
  title: string;
  templateId: string | null;
  sections: ReportSection[];
  financialData: ReportFinancialData | null;
  performanceData: ReportPerformanceData | null;
  dueDate: Date;
  submittedDate: Date | null;
  submittedBy: string | null;
  submissionMethod: string | null;
  submissionConfirmation: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  documentId: string | null;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  description: string;
  content: string;
  required: boolean;
  completed: boolean;
  order: number;
  templateSectionId: string | null;
}

export interface ReportFinancialData {
  budgetedAmount: number;
  actualExpenses: number;
  variance: number;
  variancePercentage: number;
  periodExpenses: number;
  cumulativeExpenses: number;
  remainingBudget: number;
  burnRate: number;
  projectedEndDate: Date | null;
  lineItemBreakdown: {
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentUsed: number;
  }[];
  matchingFundsReport: {
    required: number;
    provided: number;
    deficit: number;
  } | null;
}

export interface ReportPerformanceData {
  objectivesProgress: {
    objective: string;
    target: string;
    actual: string;
    percentComplete: number;
    status: 'on_track' | 'behind' | 'at_risk' | 'exceeded' | 'not_started';
    narrative: string;
  }[];
  outputMetrics: {
    metric: string;
    target: number;
    actual: number;
    unit: string;
    period: string;
  }[];
  outcomeMetrics: {
    metric: string;
    baseline: number;
    target: number;
    actual: number;
    unit: string;
  }[];
  challengesAndBarriers: string;
  lessonsLearned: string;
  nextSteps: string;
}

export interface ComplianceRequirement {
  id: string;
  tenantId: string;
  grantId: string;
  requirementType: 'reporting' | 'audit' | 'documentation' | 'certification' | 'registration';
  title: string;
  description: string;
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'as_needed';
  dueDate: Date | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'waived';
  completedDate: Date | null;
  notes: string | null;
}

export interface ReportSchedule {
  grantId: string;
  schedules: {
    reportType: ReportType;
    frequency: string;
    startDate: Date;
    endDate: Date;
    dueDates: Date[];
    reminderDaysBefore: number[];
  }[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  reportType: ReportType;
  grantorName: string | null;
  sections: {
    title: string;
    description: string;
    required: boolean;
    helpText: string;
    order: number;
  }[];
  financialTemplate: boolean;
  performanceTemplate: boolean;
}

export interface AuditTrailEntry {
  id: string;
  tenantId: string;
  grantId: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  timestamp: Date;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
}
```

### GrantBudget

```typescript
// types/budget.types.ts

export type BudgetModificationStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'implemented';

export interface GrantBudget {
  id: string;
  tenantId: string;
  grantId: string;
  version: number;
  title: string;
  totalBudgeted: number;
  totalSpent: number;
  totalCommitted: number;
  totalRemaining: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  lineItems: BudgetLineItem[];
  modifications: BudgetModification[];
  costShare: CostShareRequirement | null;
  indirectCosts: IndirectCostConfig | null;
  approved: boolean;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetLineItem {
  id: string;
  budgetId: string;
  category: BudgetCategory;
  subcategory: string | null;
  description: string;
  quantity: number;
  unitCost: number;
  totalBudgeted: number;
  totalSpent: number;
  totalCommitted: number;
  totalRemaining: number;
  grantFunded: number;
  matchFunded: number;
  inKindValue: number;
  order: number;
  notes: string | null;
  isModified: boolean;
  originalAmount: number | null;
}

export type BudgetCategory =
  | 'personnel'
  | 'fringe_benefits'
  | 'travel'
  | 'equipment'
  | 'supplies'
  | 'contractual'
  | 'construction'
  | 'other_direct'
  | 'indirect_costs'
  | 'participant_support'
  | 'subawards'
  | 'training'
  | 'occupancy'
  | 'communications'
  | 'printing'
  | 'other';

export interface BudgetModification {
  id: string;
  budgetId: string;
  grantId: string;
  tenantId: string;
  modificationNumber: number;
  status: BudgetModificationStatus;
  reason: string;
  description: string;
  effectiveDate: Date;
  changes: BudgetModificationChange[];
  totalBefore: number;
  totalAfter: number;
  netChange: number;
  requiresGrantorApproval: boolean;
  grantorApproved: boolean | null;
  grantorApprovalDate: Date | null;
  grantorApprovalRef: string | null;
  internalApprovedBy: string | null;
  internalApprovedAt: Date | null;
  requestedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetModificationChange {
  lineItemId: string;
  category: BudgetCategory;
  description: string;
  previousAmount: number;
  newAmount: number;
  changeAmount: number;
  justification: string;
}

export interface BurnRate {
  grantId: string;
  budgetId: string;
  calculatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  daysElapsed: number;
  daysRemaining: number;
  dailyBurnRate: number;
  monthlyBurnRate: number;
  projectedTotalSpend: number;
  projectedOverUnder: number;
  burnRateStatus: 'on_track' | 'underspending' | 'overspending' | 'critical';
  categoryBurnRates: {
    category: BudgetCategory;
    budgeted: number;
    spent: number;
    burnRate: number;
    projectedTotal: number;
    status: string;
  }[];
}

export interface BurnRateProjection {
  grantId: string;
  projectionDate: Date;
  scenarioName: string;
  monthlyProjections: {
    month: Date;
    projectedSpend: number;
    cumulativeSpend: number;
    remainingBudget: number;
  }[];
  exhaustionDate: Date | null;
  recommendations: string[];
}

export interface CostShareRequirement {
  required: boolean;
  type: 'cash' | 'in_kind' | 'both';
  percentage: number;
  minimumAmount: number;
  totalRequired: number;
  totalProvided: number;
  cashProvided: number;
  inKindProvided: number;
  deficit: number;
  sources: { source: string; type: 'cash' | 'in_kind'; amount: number; verified: boolean }[];
}

export interface MatchingFunds {
  grantId: string;
  requiredPercentage: number;
  requiredAmount: number;
  totalMatched: number;
  remainingToMatch: number;
  sources: MatchingFundSource[];
  status: 'met' | 'partial' | 'unmet';
}

export interface MatchingFundSource {
  id: string;
  name: string;
  type: 'cash' | 'in_kind' | 'volunteer_time' | 'donated_goods' | 'donated_services';
  committedAmount: number;
  receivedAmount: number;
  verificationDocumentId: string | null;
  verified: boolean;
}

export interface IndirectCostConfig {
  rateType: 'negotiated' | 'de_minimis' | 'none';
  rate: number;
  base: 'mtdc' | 'total_direct' | 'salaries_wages' | 'custom';
  negotiatedRateAgreementId: string | null;
  effectiveDate: Date | null;
  expirationDate: Date | null;
}
```

---

## Database Schemas

### grants

```typescript
// db/schema/grants.ts

import {
  pgTable,
  uuid,
  text,
  varchar,
  decimal,
  boolean,
  timestamp,
  jsonb,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const grants = pgTable(
  'grants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    grantorName: varchar('grantor_name', { length: 500 }).notNull(),
    grantorType: varchar('grantor_type', { length: 50 }).notNull(),
    grantType: varchar('grant_type', { length: 50 }).notNull(),
    fundingAmount: decimal('funding_amount', { precision: 15, scale: 2 }).notNull(),
    fundingAmountMin: decimal('funding_amount_min', { precision: 15, scale: 2 }),
    fundingAmountMax: decimal('funding_amount_max', { precision: 15, scale: 2 }),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    applicationDeadline: timestamp('application_deadline', { withTimezone: true }),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    status: varchar('status', { length: 30 }).notNull().default('discovered'),
    sourceUrl: text('source_url'),
    cfdaNumber: varchar('cfda_number', { length: 20 }),
    fundingOpportunityNumber: varchar('funding_opportunity_number', { length: 100 }),
    eligibilityRequirements: jsonb('eligibility_requirements'),
    matchingRequired: boolean('matching_required').notNull().default(false),
    matchingPercentage: decimal('matching_percentage', { precision: 5, scale: 2 }),
    costShareRequired: boolean('cost_share_required').notNull().default(false),
    costSharePercentage: decimal('cost_share_percentage', { precision: 5, scale: 2 }),
    indirectCostRate: decimal('indirect_cost_rate', { precision: 5, scale: 2 }),
    tags: jsonb('tags').notNull().default([]),
    metadata: jsonb('metadata').notNull().default({}),

    // Award fields (populated when grant is awarded)
    awardNumber: varchar('award_number', { length: 100 }),
    awardDate: timestamp('award_date', { withTimezone: true }),
    awardAmount: decimal('award_amount', { precision: 15, scale: 2 }),
    totalDisbursed: decimal('total_disbursed', { precision: 15, scale: 2 }).notNull().default('0'),
    totalRemaining: decimal('total_remaining', { precision: 15, scale: 2 }).notNull().default('0'),

    // Lifecycle timestamps
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedBy: uuid('archived_by'),

    // Status tracking
    statusChangedAt: timestamp('status_changed_at', { withTimezone: true }),
    statusChangedBy: uuid('status_changed_by'),
    statusChangeReason: text('status_change_reason'),

    // Audit
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('grants_tenant_idx').on(table.tenantId),
    statusIdx: index('grants_status_idx').on(table.tenantId, table.status),
    typeIdx: index('grants_type_idx').on(table.tenantId, table.grantType),
    deadlineIdx: index('grants_deadline_idx').on(table.tenantId, table.applicationDeadline),
    grantorIdx: index('grants_grantor_idx').on(table.tenantId, table.grantorName),
    awardNumberIdx: index('grants_award_number_idx').on(table.tenantId, table.awardNumber),
    searchIdx: index('grants_search_idx').using(
      'gin',
      sql`to_tsvector('english', title || ' ' || description || ' ' || grantor_name)`,
    ),
  }),
);

export const grantsRelations = relations(grants, ({ many }) => ({
  applications: many(grantApplications),
  milestones: many(grantMilestones),
  disbursements: many(disbursements),
  budgets: many(grantBudgets),
  reports: many(grantReports),
  documents: many(grantDocuments),
  deadlines: many(grantDeadlines),
  teamMembers: many(grantTeamMembers),
  notes: many(grantNotes),
}));
```

### grant_applications

```typescript
// db/schema/grant_applications.ts

export const grantApplications = pgTable(
  'grant_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    grantId: uuid('grant_id')
      .notNull()
      .references(() => grants.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    applicationNumber: varchar('application_number', { length: 100 }),
    status: varchar('status', { length: 30 }).notNull().default('draft'),
    version: integer('version').notNull().default(1),
    narrative: jsonb('narrative').notNull().default({}),
    proposedBudget: jsonb('proposed_budget').notNull().default({}),
    projectTimeline: jsonb('project_timeline').notNull().default([]),
    keyPersonnel: jsonb('key_personnel').notNull().default([]),
    supportingDocumentIds: jsonb('supporting_document_ids').notNull().default([]),
    submissionMethod: varchar('submission_method', { length: 30 }),
    submissionUrl: text('submission_url'),
    submissionConfirmation: text('submission_confirmation'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    submittedBy: uuid('submitted_by'),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    reviewers: jsonb('reviewers').notNull().default([]),
    reviewComments: jsonb('review_comments').notNull().default([]),
    score: decimal('score', { precision: 5, scale: 2 }),
    feedback: text('feedback'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('grant_apps_tenant_idx').on(table.tenantId),
    grantIdx: index('grant_apps_grant_idx').on(table.tenantId, table.grantId),
    statusIdx: index('grant_apps_status_idx').on(table.tenantId, table.status),
    dueDateIdx: index('grant_apps_due_date_idx').on(table.tenantId, table.dueDate),
  }),
);

export const grantApplicationsRelations = relations(grantApplications, ({ one }) => ({
  grant: one(grants, {
    fields: [grantApplications.grantId],
    references: [grants.id],
  }),
}));
```

### grant_milestones

```typescript
// db/schema/grant_milestones.ts

export const grantMilestones = pgTable(
  'grant_milestones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    grantId: uuid('grant_id')
      .notNull()
      .references(() => grants.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description').notNull(),
    type: varchar('type', { length: 30 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('not_started'),
    sequenceNumber: integer('sequence_number').notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    completedDate: timestamp('completed_date', { withTimezone: true }),
    completionCriteria: jsonb('completion_criteria').notNull().default({}),
    deliverables: jsonb('deliverables').notNull().default([]),
    paymentTrigger: jsonb('payment_trigger'),
    evidence: jsonb('evidence').notNull().default([]),
    verifiedBy: uuid('verified_by'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verificationNotes: text('verification_notes'),
    dependencies: jsonb('dependencies').notNull().default([]),
    percentComplete: integer('percent_complete').notNull().default(0),
    notes: text('notes'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('grant_milestones_tenant_idx').on(table.tenantId),
    grantIdx: index('grant_milestones_grant_idx').on(table.tenantId, table.grantId),
    statusIdx: index('grant_milestones_status_idx').on(table.tenantId, table.status),
    dueDateIdx: index('grant_milestones_due_date_idx').on(table.tenantId, table.dueDate),
    sequenceIdx: index('grant_milestones_sequence_idx').on(table.grantId, table.sequenceNumber),
  }),
);

export const grantMilestonesRelations = relations(grantMilestones, ({ one }) => ({
  grant: one(grants, {
    fields: [grantMilestones.grantId],
    references: [grants.id],
  }),
}));
```

### disbursements

```typescript
// db/schema/disbursements.ts

export const disbursements = pgTable(
  'disbursements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    grantId: uuid('grant_id')
      .notNull()
      .references(() => grants.id, { onDelete: 'cascade' }),
    milestoneId: uuid('milestone_id').references(() => grantMilestones.id),
    type: varchar('type', { length: 30 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    requestedAmount: decimal('requested_amount', { precision: 15, scale: 2 }).notNull(),
    approvedAmount: decimal('approved_amount', { precision: 15, scale: 2 }),
    receivedAmount: decimal('received_amount', { precision: 15, scale: 2 }),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    requestDate: timestamp('request_date', { withTimezone: true }).notNull(),
    approvalDate: timestamp('approval_date', { withTimezone: true }),
    receivedDate: timestamp('received_date', { withTimezone: true }),
    reference: varchar('reference', { length: 200 }),
    drawdownRequestId: uuid('drawdown_request_id'),
    allocations: jsonb('allocations').notNull().default([]),
    receipts: jsonb('receipts').notNull().default([]),
    notes: text('notes'),
    approvedBy: uuid('approved_by'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('disbursements_tenant_idx').on(table.tenantId),
    grantIdx: index('disbursements_grant_idx').on(table.tenantId, table.grantId),
    statusIdx: index('disbursements_status_idx').on(table.tenantId, table.status),
    typeIdx: index('disbursements_type_idx').on(table.tenantId, table.type),
    dateIdx: index('disbursements_date_idx').on(table.tenantId, table.requestDate),
    milestoneIdx: index('disbursements_milestone_idx').on(table.milestoneId),
  }),
);

export const disbursementsRelations = relations(disbursements, ({ one }) => ({
  grant: one(grants, {
    fields: [disbursements.grantId],
    references: [grants.id],
  }),
  milestone: one(grantMilestones, {
    fields: [disbursements.milestoneId],
    references: [grantMilestones.id],
  }),
}));
```

### grant_budgets

```typescript
// db/schema/grant_budgets.ts

export const grantBudgets = pgTable(
  'grant_budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    grantId: uuid('grant_id')
      .notNull()
      .references(() => grants.id, { onDelete: 'cascade' }),
    version: integer('version').notNull().default(1),
    title: varchar('title', { length: 300 }).notNull(),
    totalBudgeted: decimal('total_budgeted', { precision: 15, scale: 2 }).notNull(),
    totalSpent: decimal('total_spent', { precision: 15, scale: 2 }).notNull().default('0'),
    totalCommitted: decimal('total_committed', { precision: 15, scale: 2 }).notNull().default('0'),
    totalRemaining: decimal('total_remaining', { precision: 15, scale: 2 }).notNull().default('0'),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    costShare: jsonb('cost_share'),
    indirectCosts: jsonb('indirect_costs'),
    approved: boolean('approved').notNull().default(false),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('grant_budgets_tenant_idx').on(table.tenantId),
    grantIdx: index('grant_budgets_grant_idx').on(table.tenantId, table.grantId),
    versionIdx: index('grant_budgets_version_idx').on(table.grantId, table.version),
  }),
);

export const grantBudgetLineItems = pgTable(
  'grant_budget_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    budgetId: uuid('budget_id')
      .notNull()
      .references(() => grantBudgets.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id').notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    subcategory: varchar('subcategory', { length: 100 }),
    description: text('description').notNull(),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
    unitCost: decimal('unit_cost', { precision: 15, scale: 2 }).notNull(),
    totalBudgeted: decimal('total_budgeted', { precision: 15, scale: 2 }).notNull(),
    totalSpent: decimal('total_spent', { precision: 15, scale: 2 }).notNull().default('0'),
    totalCommitted: decimal('total_committed', { precision: 15, scale: 2 }).notNull().default('0'),
    totalRemaining: decimal('total_remaining', { precision: 15, scale: 2 }).notNull().default('0'),
    grantFunded: decimal('grant_funded', { precision: 15, scale: 2 }).notNull(),
    matchFunded: decimal('match_funded', { precision: 15, scale: 2 }).notNull().default('0'),
    inKindValue: decimal('in_kind_value', { precision: 15, scale: 2 }).notNull().default('0'),
    order: integer('order').notNull().default(0),
    notes: text('notes'),
    isModified: boolean('is_modified').notNull().default(false),
    originalAmount: decimal('original_amount', { precision: 15, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    budgetIdx: index('grant_budget_items_budget_idx').on(table.budgetId),
    tenantIdx: index('grant_budget_items_tenant_idx').on(table.tenantId),
    categoryIdx: index('grant_budget_items_category_idx').on(table.budgetId, table.category),
  }),
);

export const grantBudgetsRelations = relations(grantBudgets, ({ one, many }) => ({
  grant: one(grants, {
    fields: [grantBudgets.grantId],
    references: [grants.id],
  }),
  lineItems: many(grantBudgetLineItems),
}));

export const grantBudgetLineItemsRelations = relations(grantBudgetLineItems, ({ one }) => ({
  budget: one(grantBudgets, {
    fields: [grantBudgetLineItems.budgetId],
    references: [grantBudgets.id],
  }),
}));
```

### grant_reports

```typescript
// db/schema/grant_reports.ts

export const grantReports = pgTable(
  'grant_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    grantId: uuid('grant_id')
      .notNull()
      .references(() => grants.id, { onDelete: 'cascade' }),
    reportType: varchar('report_type', { length: 30 }).notNull(),
    reportPeriodStart: timestamp('report_period_start', { withTimezone: true }).notNull(),
    reportPeriodEnd: timestamp('report_period_end', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('not_started'),
    title: varchar('title', { length: 500 }).notNull(),
    templateId: uuid('template_id'),
    sections: jsonb('sections').notNull().default([]),
    financialData: jsonb('financial_data'),
    performanceData: jsonb('performance_data'),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    submittedDate: timestamp('submitted_date', { withTimezone: true }),
    submittedBy: uuid('submitted_by'),
    submissionMethod: varchar('submission_method', { length: 50 }),
    submissionConfirmation: text('submission_confirmation'),
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNotes: text('review_notes'),
    documentId: uuid('document_id'),
    version: integer('version').notNull().default(1),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('grant_reports_tenant_idx').on(table.tenantId),
    grantIdx: index('grant_reports_grant_idx').on(table.tenantId, table.grantId),
    statusIdx: index('grant_reports_status_idx').on(table.tenantId, table.status),
    dueDateIdx: index('grant_reports_due_date_idx').on(table.tenantId, table.dueDate),
    typeIdx: index('grant_reports_type_idx').on(table.tenantId, table.reportType),
    periodIdx: index('grant_reports_period_idx').on(
      table.grantId,
      table.reportPeriodStart,
      table.reportPeriodEnd,
    ),
  }),
);

export const grantReportsRelations = relations(grantReports, ({ one }) => ({
  grant: one(grants, {
    fields: [grantReports.grantId],
    references: [grants.id],
  }),
}));
```

### grant_documents

```typescript
// db/schema/grant_documents.ts

export const grantDocuments = pgTable(
  'grant_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    grantId: uuid('grant_id')
      .notNull()
      .references(() => grants.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id').references(() => grantApplications.id),
    reportId: uuid('report_id').references(() => grantReports.id),
    milestoneId: uuid('milestone_id').references(() => grantMilestones.id),
    documentType: varchar('document_type', { length: 50 }).notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    fileName: varchar('file_name', { length: 500 }).notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    storagePath: text('storage_path').notNull(),
    storageProvider: varchar('storage_provider', { length: 30 }).notNull().default('supabase'),
    version: integer('version').notNull().default(1),
    parentDocumentId: uuid('parent_document_id'), // For versioning
    checksum: varchar('checksum', { length: 64 }),
    metadata: jsonb('metadata').notNull().default({}),
    tags: jsonb('tags').notNull().default([]),
    uploadedBy: uuid('uploaded_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('grant_docs_tenant_idx').on(table.tenantId),
    grantIdx: index('grant_docs_grant_idx').on(table.tenantId, table.grantId),
    typeIdx: index('grant_docs_type_idx').on(table.tenantId, table.documentType),
    applicationIdx: index('grant_docs_application_idx').on(table.applicationId),
    reportIdx: index('grant_docs_report_idx').on(table.reportId),
    milestoneIdx: index('grant_docs_milestone_idx').on(table.milestoneId),
  }),
);

export const grantDocumentsRelations = relations(grantDocuments, ({ one }) => ({
  grant: one(grants, {
    fields: [grantDocuments.grantId],
    references: [grants.id],
  }),
  application: one(grantApplications, {
    fields: [grantDocuments.applicationId],
    references: [grantApplications.id],
  }),
  report: one(grantReports, {
    fields: [grantDocuments.reportId],
    references: [grantReports.id],
  }),
  milestone: one(grantMilestones, {
    fields: [grantDocuments.milestoneId],
    references: [grantMilestones.id],
  }),
}));
```

### Supporting Tables

```typescript
// db/schema/supporting.ts

export const grantDeadlines = pgTable(
  'grant_deadlines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    grantId: uuid('grant_id')
      .notNull()
      .references(() => grants.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id').references(() => grantApplications.id),
    reportId: uuid('report_id').references(() => grantReports.id),
    milestoneId: uuid('milestone_id').references(() => grantMilestones.id),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    completedDate: timestamp('completed_date', { withTimezone: true }),
    status: varchar('status', { length: 30 }).notNull().default('upcoming'),
    priority: varchar('priority', { length: 20 }).notNull().default('normal'),
    alertConfig: jsonb('alert_config').notNull().default({}),
    alertsSent: jsonb('alerts_sent').notNull().default([]),
    assignedTo: uuid('assigned_to'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('grant_deadlines_tenant_idx').on(table.tenantId),
    grantIdx: index('grant_deadlines_grant_idx').on(table.tenantId, table.grantId),
    dueDateIdx: index('grant_deadlines_due_date_idx').on(table.tenantId, table.dueDate),
    statusIdx: index('grant_deadlines_status_idx').on(table.tenantId, table.status),
    typeIdx: index('grant_deadlines_type_idx').on(table.tenantId, table.type),
  }),
);

export const grantEligibilityCriteria = pgTable(
  'grant_eligibility_criteria',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    grantId: uuid('grant_id')
      .notNull()
      .references(() => grants.id, { onDelete: 'cascade' }),
    criterionType: varchar('criterion_type', { length: 50 }).notNull(),
    criterion: text('criterion').notNull(),
    required: boolean('required').notNull().default(true),
    weight: integer('weight').notNull().default(1),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    grantIdx: index('grant_eligibility_grant_idx').on(table.grantId),
    tenantIdx: index('grant_eligibility_tenant_idx').on(table.tenantId),
  }),
);

export const grantCategories = pgTable('grant_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id'),
  color: varchar('color', { length: 7 }),
  icon: varchar('icon', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const grantSources = pgTable('grant_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 300 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  url: text('url'),
  description: text('description'),
  apiEndpoint: text('api_endpoint'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  syncEnabled: boolean('sync_enabled').notNull().default(false),
  syncFrequency: varchar('sync_frequency', { length: 30 }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const grantNotes = pgTable(
  'grant_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    grantId: uuid('grant_id')
      .notNull()
      .references(() => grants.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    type: varchar('type', { length: 30 }).notNull().default('general'),
    isPinned: boolean('is_pinned').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    grantIdx: index('grant_notes_grant_idx').on(table.tenantId, table.grantId),
  }),
);

export const grantTeamMembers = pgTable(
  'grant_team_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    grantId: uuid('grant_id')
      .notNull()
      .references(() => grants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    role: varchar('role', { length: 50 }).notNull(),
    permissions: jsonb('permissions').notNull().default([]),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    assignedBy: uuid('assigned_by').notNull(),
  },
  (table) => ({
    grantIdx: index('grant_team_grant_idx').on(table.tenantId, table.grantId),
    userIdx: index('grant_team_user_idx').on(table.tenantId, table.userId),
    uniqueAssignment: index('grant_team_unique_idx').on(table.grantId, table.userId),
  }),
);
```

### Row-Level Security Policies

```sql
-- RLS Policies for multi-tenant isolation

-- Enable RLS on all grant tables
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_budget_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_eligibility_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_team_members ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy (applied to all tables)
CREATE POLICY "tenant_isolation" ON grants
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON grant_applications
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON grant_milestones
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON disbursements
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON grant_budgets
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON grant_budget_line_items
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON grant_reports
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON grant_documents
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON grant_deadlines
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON grant_notes
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON grant_team_members
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Team member access policy (optional, grants visible only to assigned team)
CREATE POLICY "team_member_access" ON grants
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND (
      created_by = current_setting('app.user_id')::uuid
      OR EXISTS (
        SELECT 1 FROM grant_team_members
        WHERE grant_team_members.grant_id = grants.id
        AND grant_team_members.user_id = current_setting('app.user_id')::uuid
      )
      OR current_setting('app.user_role') IN ('admin', 'grant_manager')
    )
  );
```

---

## Code Examples

### 1. Discover Grants and Check Eligibility

```typescript
import { GrantDiscoveryService } from '@mcv/portfolio/grants';

const discoveryService = new GrantDiscoveryService();

// Define organization profile for eligibility matching
const organizationProfile = {
  type: 'nonprofit_501c3',
  state: 'California',
  county: 'Los Angeles',
  yearsInOperation: 5,
  annualBudget: 2_500_000,
  registrations: ['SAM.gov', 'Grants.gov', 'California_Registry'],
  certifications: ['audit_completed', 'non_debarment'],
  focusAreas: ['education', 'youth_development', 'workforce'],
  servingPopulations: ['low_income', 'youth', 'immigrants'],
};

// Search for matching grants
const discoveryResults = await discoveryService.discoverGrants(tenantId, {
  query: 'youth workforce development',
  grantTypes: ['federal_competitive', 'state_competitive', 'private_foundation'],
  minAmount: 50_000,
  maxAmount: 500_000,
  deadlineAfter: new Date(),
  categories: ['education', 'workforce_development'],
  organizationProfile,
});

console.log(`Found ${discoveryResults.total} matching grants`);

for (const result of discoveryResults.matches) {
  console.log(`
    Grant: ${result.grant.title}
    Grantor: ${result.grant.grantorName}
    Amount: $${result.grant.fundingAmount.toLocaleString()}
    Deadline: ${result.grant.applicationDeadline?.toLocaleDateString()}
    Eligibility Score: ${result.eligibilityScore}/100
    Match Details:
    ${result.matchDetails
      .map((d) => `  - ${d.criterion}: ${d.met ? '✅' : '❌'} (${d.score}/100)`)
      .join('\n')}
    ${result.disqualifiers.length ? `⚠️ Disqualifiers: ${result.disqualifiers.join(', ')}` : ''}
    Recommendations: ${result.recommendations.join('; ')}
  `);
}

// Save a promising grant to our pipeline
const selectedGrant = discoveryResults.matches[0];
if (selectedGrant.eligibilityScore >= 70) {
  const grant = await grantService.createGrant(
    tenantId,
    {
      title: selectedGrant.grant.title,
      description: selectedGrant.grant.description,
      grantorName: selectedGrant.grant.grantorName,
      grantorType: 'federal_agency',
      grantType: 'federal_competitive',
      fundingAmount: selectedGrant.grant.fundingAmount,
      applicationDeadline: selectedGrant.grant.applicationDeadline,
      sourceUrl: selectedGrant.grant.sourceUrl,
      cfdaNumber: selectedGrant.grant.cfdaNumber,
      fundingOpportunityNumber: selectedGrant.grant.fundingOpportunityNumber,
      eligibilityRequirements: selectedGrant.grant.eligibilityRequirements,
      matchingRequired: selectedGrant.grant.matchingRequired,
      matchingPercentage: selectedGrant.grant.matchingPercentage,
      tags: ['youth', 'workforce', 'federal', 'high_priority'],
    },
    userId,
  );

  // Move to evaluating status
  await grantService.transitionStatus(
    tenantId,
    grant.id,
    'evaluating',
    userId,
    'High eligibility score (85/100), strong alignment with organizational mission',
  );

  console.log(`Grant saved to pipeline: ${grant.id}`);
}
```

### 2. Create and Submit a Grant Application

```typescript
import {
  GrantApplicationService,
  GrantDocumentService,
} from '@mcv/portfolio/grants';

const applicationService = new GrantApplicationService();
const documentService = new GrantDocumentService();

// Create the application draft
const application = await applicationService.createApplication(tenantId, {
  grantId: 'grant-uuid-here',
  title: 'Youth Workforce Innovation Program - Year 1',
  dueDate: new Date('2026-06-15'),
  narrative: {
    executiveSummary:
      'The Youth Workforce Innovation Program (YWIP) will serve 500 underserved youth ages 16-24 ' +
      'in Los Angeles County through a comprehensive workforce development approach combining ' +
      'skills training, mentorship, and employer partnerships...',
    statementOfNeed:
      'Los Angeles County faces a youth unemployment crisis, with 18.5% of 16-24 year olds ' +
      'neither employed nor in education (Bureau of Labor Statistics, 2025). In South LA, ' +
      'this figure rises to 32.1%...',
    projectDescription:
      'YWIP operates through three interconnected components: (1) Digital Skills Academy — ' +
      'an intensive 12-week training program in high-demand tech skills; (2) Mentorship Network — ' +
      'pairing each participant with an industry professional; (3) Employer Pipeline — ' +
      'guaranteed interview opportunities with 50+ partner employers...',
    goalsAndObjectives:
      'Goal 1: Increase employability of 500 underserved youth\n' +
      '  Objective 1.1: 80% of participants complete the 12-week training program\n' +
      '  Objective 1.2: 70% of completers obtain industry-recognized certification\n' +
      'Goal 2: Establish sustainable employer partnerships\n' +
      '  Objective 2.1: Recruit 50 employer partners by month 6\n' +
      '  Objective 2.2: 60% of completers secure employment within 90 days...',
    methodology:
      'We employ an evidence-based approach grounded in the Positive Youth Development framework...',
    evaluationPlan:
      'An independent evaluator (Dr. Sarah Chen, UCLA) will conduct a mixed-methods evaluation...',
    sustainabilityPlan:
      'YWIP is designed for long-term sustainability through three revenue streams: ' +
      'employer partnership fees, social enterprise income, and diversified grant funding...',
    organizationBackground:
      'Founded in 2019, our organization has served over 2,000 youth in LA County...',
    additionalSections: [],
  },
  proposedBudget: {
    totalRequested: 350_000,
    matchingContribution: 50_000,
    inKindContribution: 25_000,
    totalProjectCost: 425_000,
    lineItems: [
      {
        category: 'personnel',
        description: 'Program Director (1.0 FTE)',
        quantity: 1,
        unitCost: 85_000,
        totalCost: 85_000,
        grantFunded: 75_000,
        matchFunded: 10_000,
        notes: 'Experienced workforce development professional',
      },
      {
        category: 'personnel',
        description: 'Program Coordinators (2 x 0.5 FTE)',
        quantity: 2,
        unitCost: 27_500,
        totalCost: 55_000,
        grantFunded: 55_000,
        matchFunded: 0,
        notes: '',
      },
      {
        category: 'fringe_benefits',
        description: 'Benefits at 25% of salaries',
        quantity: 1,
        unitCost: 35_000,
        totalCost: 35_000,
        grantFunded: 32_500,
        matchFunded: 2_500,
        notes: 'Health, dental, retirement, FICA',
      },
      {
        category: 'participant_support',
        description: 'Participant stipends ($500 x 500)',
        quantity: 500,
        unitCost: 500,
        totalCost: 250_000,
        grantFunded: 150_000,
        matchFunded: 37_500,
        notes: 'Transportation and meal support during training',
      },
      {
        category: 'supplies',
        description: 'Training materials and equipment',
        quantity: 1,
        unitCost: 15_000,
        totalCost: 15_000,
        grantFunded: 15_000,
        matchFunded: 0,
        notes: 'Laptops, software licenses, course materials',
      },
      {
        category: 'contractual',
        description: 'External evaluation (Dr. Chen, UCLA)',
        quantity: 1,
        unitCost: 22_500,
        totalCost: 22_500,
        grantFunded: 22_500,
        matchFunded: 0,
        notes: 'Independent program evaluation',
      },
    ],
    justification:
      'Budget reflects a lean operational model that maximizes direct participant investment...',
  },
  keyPersonnel: [
    {
      name: 'Maria Rodriguez',
      title: 'Executive Director',
      role: 'Principal Investigator',
      percentEffort: 25,
      annualSalary: 120_000,
      grantSalary: 0,
      qualifications: '15 years in workforce development, PhD in Public Policy...',
      biosSketchDocumentId: null,
    },
    {
      name: 'James Park',
      title: 'Program Director',
      role: 'Program Lead',
      percentEffort: 100,
      annualSalary: 85_000,
      grantSalary: 75_000,
      qualifications: '8 years in youth program management, MSW...',
      biosSketchDocumentId: null,
    },
  ],
  projectTimeline: [
    {
      phase: 'Planning & Setup',
      description: 'Staff hiring, curriculum development, partner recruitment',
      startMonth: 1,
      endMonth: 3,
      milestones: ['Staff hired', 'Curriculum finalized', '25 employers recruited'],
      deliverables: ['Staffing plan', 'Curriculum document', 'Partner MOUs'],
    },
    {
      phase: 'Cohort 1 Implementation',
      description: 'First training cohort of 125 participants',
      startMonth: 4,
      endMonth: 6,
      milestones: ['125 youth enrolled', 'Training completed', 'Certifications awarded'],
      deliverables: ['Enrollment records', 'Training completion report'],
    },
    {
      phase: 'Cohort 2-4 Implementation',
      description: 'Remaining three training cohorts',
      startMonth: 7,
      endMonth: 12,
      milestones: ['375 additional youth enrolled', 'All cohorts complete'],
      deliverables: ['Quarterly progress reports', 'Employment outcomes data'],
    },
  ],
  submissionMethod: 'grants_gov',
  submissionUrl: 'https://www.grants.gov/apply/opportunity/12345',
});

console.log(`Application created: ${application.id} (v${application.version})`);

// Upload supporting documents
const documents = [
  { file: boardResolutionBuffer, name: 'board_resolution.pdf', type: 'board_resolution' },
  { file: auditReportBuffer, name: 'audit_report_2025.pdf', type: 'audit_report' },
  { file: orgChartBuffer, name: 'organizational_chart.pdf', type: 'organizational_chart' },
];

for (const doc of documents) {
  await documentService.uploadDocument(tenantId, {
    grantId: application.grantId,
    applicationId: application.id,
    documentType: doc.type,
    title: doc.name,
    file: doc.file,
    fileName: doc.name,
  });
}

// Assign reviewers for internal review
await applicationService.assignReviewers(tenantId, application.id, [
  { userId: 'reviewer-1-uuid', role: 'primary_reviewer' },
  { userId: 'reviewer-2-uuid', role: 'secondary_reviewer' },
  { userId: 'approver-uuid', role: 'approver' },
]);

// Transition to in_review
await applicationService.transitionStatus(
  tenantId,
  application.id,
  'in_review',
  userId,
);

// After reviews are completed, submit the application
await applicationService.submitApplication(tenantId, application.id, userId, {
  submissionMethod: 'grants_gov',
  submissionConfirmation: 'GRANTS-GOV-CONF-2026-12345',
  submittedAt: new Date(),
});

console.log('Application submitted successfully');
```

### 3. Track Milestones and Record Completion

```typescript
import { GrantMilestoneService } from '@mcv/portfolio/grants';

const milestoneService = new GrantMilestoneService();

// Create milestones for an awarded grant
const milestones = await milestoneService.createMilestones(tenantId, grantId, [
  {
    title: 'Program Launch',
    description: 'Complete staff hiring and program setup',
    type: 'programmatic',
    sequenceNumber: 1,
    dueDate: new Date('2026-09-30'),
    completionCriteria: {
      description: 'All key staff positions filled, curriculum finalized, and partnerships executed',
      checklistItems: [
        { item: 'Program Director hired and onboarded', completed: false, completedAt: null },
        { item: '2 Program Coordinators hired', completed: false, completedAt: null },
        { item: 'Curriculum reviewed and approved', completed: false, completedAt: null },
        { item: '25 employer MOUs signed', completed: false, completedAt: null },
        { item: 'Participant recruitment materials prepared', completed: false, completedAt: null },
      ],
      requiresEvidence: true,
      requiredEvidenceTypes: ['document', 'attestation'],
      requiresVerification: true,
      verificationMethod: 'supervisor',
    },
    deliverables: [
      {
        title: 'Staffing Completion Report',
        description: 'Summary of all hired staff with qualifications',
        type: 'document',
        dueDate: new Date('2026-09-30'),
      },
      {
        title: 'Finalized Curriculum',
        description: '12-week training curriculum document',
        type: 'document',
        dueDate: new Date('2026-09-15'),
      },
      {
        title: 'Executed MOUs',
        description: 'Signed MOUs with employer partners',
        type: 'document',
        dueDate: new Date('2026-09-30'),
      },
    ],
    paymentTrigger: {
      triggerType: 'on_verification',
      amount: 87_500,
      percentage: 25,
      conditions: ['All checklist items verified', 'All deliverables submitted'],
    },
  },
  {
    title: 'Cohort 1 Completion',
    description: 'First 125 youth complete 12-week training program',
    type: 'programmatic',
    sequenceNumber: 2,
    dueDate: new Date('2026-12-31'),
    completionCriteria: {
      description: '125 youth enrolled and 80% complete training with certification',
      checklistItems: [
        { item: '125 youth enrolled', completed: false, completedAt: null },
        { item: '100+ youth complete training (80%)', completed: false, completedAt: null },
        { item: '70+ youth obtain certification', completed: false, completedAt: null },
        { item: 'Pre/post assessment data collected', completed: false, completedAt: null },
      ],
      requiresEvidence: true,
      requiredEvidenceTypes: ['data', 'document'],
      requiresVerification: true,
      verificationMethod: 'external',
    },
    paymentTrigger: {
      triggerType: 'on_deliverable_acceptance',
      amount: 87_500,
      percentage: 25,
      conditions: ['Enrollment data verified', 'Completion rates meet 80% threshold'],
    },
    dependencies: [], // Will be populated after creation with milestone 1's ID
  },
  // ... additional milestones for cohorts 2-4 and program closeout
]);

console.log(`Created ${milestones.length} milestones`);

// --- Later: Update milestone progress ---

// Complete individual checklist items
await milestoneService.updateChecklistItem(
  tenantId,
  milestones[0].id,
  0, // index of checklist item
  { completed: true, completedAt: new Date() },
  userId,
);

// Upload evidence
await milestoneService.addEvidence(tenantId, milestones[0].id, {
  type: 'document',
  title: 'Program Director Offer Letter & Start Date Confirmation',
  description: 'Signed offer letter and HR onboarding confirmation for James Park',
  documentId: 'uploaded-doc-uuid',
  uploadedBy: userId,
});

// Update overall progress
await milestoneService.updateProgress(tenantId, milestones[0].id, {
  percentComplete: 60,
  notes: '3 of 5 checklist items completed. Awaiting final employer MOUs.',
}, userId);

// --- Mark milestone as complete and trigger verification ---

// When all criteria are met
await milestoneService.requestVerification(tenantId, milestones[0].id, userId, {
  completionNotes: 'All staff hired, curriculum finalized, 27 employer MOUs signed (exceeds target of 25)',
  evidenceIds: ['evidence-1', 'evidence-2', 'evidence-3'],
});

// Supervisor verifies
await milestoneService.verifyMilestone(tenantId, milestones[0].id, supervisorUserId, {
  verified: true,
  notes: 'All completion criteria verified. Excellent progress on employer partnerships.',
});

// Check if payment trigger fires
const milestone = await milestoneService.getMilestone(tenantId, milestones[0].id);
if (milestone.paymentTrigger?.triggered) {
  console.log(`Payment triggered: $${milestone.paymentTrigger.amount.toLocaleString()}`);
  console.log(`Disbursement: ${milestone.paymentTrigger.disbursementId}`);
}
```

### 4. Record and Track Disbursements

```typescript
import {
  GrantDisbursementService,
  GrantBudgetService,
} from '@mcv/portfolio/grants';

const disbursementService = new GrantDisbursementService();
const budgetService = new GrantBudgetService();

// Record a milestone payment received
const disbursement = await disbursementService.createDisbursement(tenantId, {
  grantId: 'grant-uuid',
  milestoneId: 'milestone-1-uuid',
  type: 'milestone_payment',
  requestedAmount: 87_500,
  currency: 'USD',
  requestDate: new Date('2026-10-01'),
  notes: 'First milestone payment — Program Launch completion',
});

// Record approval and receipt
await disbursementService.recordApproval(tenantId, disbursement.id, {
  approvedAmount: 87_500,
  approvalDate: new Date('2026-10-10'),
  approvedBy: 'finance-officer-uuid',
  reference: 'FED-DISB-2026-001',
});

await disbursementService.recordReceipt(tenantId, disbursement.id, {
  receivedAmount: 87_500,
  receivedDate: new Date('2026-10-15'),
  reference: 'ACH-DEPOSIT-20261015-87500',
});

// Allocate funds to budget categories
await disbursementService.allocateFunds(tenantId, disbursement.id, [
  {
    budgetLineItemId: 'personnel-line-item-uuid',
    budgetCategory: 'personnel',
    amount: 32_500,
    description: 'Q1 Program Director and Coordinator salaries',
  },
  {
    budgetLineItemId: 'fringe-line-item-uuid',
    budgetCategory: 'fringe_benefits',
    amount: 8_125,
    description: 'Q1 Benefits (25% of salaries)',
  },
  {
    budgetLineItemId: 'supplies-line-item-uuid',
    budgetCategory: 'supplies',
    amount: 15_000,
    description: 'Training laptops and software licenses',
  },
  {
    budgetLineItemId: 'contractual-line-item-uuid',
    budgetCategory: 'contractual',
    amount: 7_500,
    description: 'Evaluation setup costs (Dr. Chen)',
  },
  {
    budgetLineItemId: 'participant-line-item-uuid',
    budgetCategory: 'participant_support',
    amount: 24_375,
    description: 'Initial participant stipend pool',
  },
]);

console.log('Disbursement recorded and allocated');

// Record individual receipts/expenses against the disbursement
await disbursementService.addReceipt(tenantId, disbursement.id, {
  receiptNumber: 'INV-2026-1001',
  amount: 4_500,
  vendor: 'Dell Technologies',
  description: '15 training laptops',
  date: new Date('2026-10-20'),
  category: 'supplies',
  documentId: 'receipt-doc-uuid',
});

// --- Create a drawdown request (federal reimbursement model) ---

const drawdown = await disbursementService.createDrawdownRequest(tenantId, {
  grantId: 'grant-uuid',
  period: {
    start: new Date('2026-10-01'),
    end: new Date('2026-12-31'),
  },
  lineItems: [
    {
      budgetLineItemId: 'personnel-uuid',
      amount: 32_500,
      description: 'Q4 2026 personnel costs',
    },
    {
      budgetLineItemId: 'fringe-uuid',
      amount: 8_125,
      description: 'Q4 2026 fringe benefits',
    },
    {
      budgetLineItemId: 'participant-uuid',
      amount: 62_500,
      description: 'Cohort 1 participant stipends',
    },
  ],
  supportingDocumentIds: ['payroll-summary-uuid', 'stipend-log-uuid'],
  notes: 'Q4 2026 drawdown for direct costs incurred',
});

console.log(`Drawdown request ${drawdown.requestNumber} submitted for $${drawdown.requestedAmount}`);

// --- Check burn rate ---

const burnRate = await budgetService.calculateBurnRate(tenantId, 'grant-uuid');

console.log(`
  Budget: $${burnRate.totalBudget.toLocaleString()}
  Spent: $${burnRate.totalSpent.toLocaleString()}
  Remaining: $${burnRate.totalRemaining.toLocaleString()}
  Daily Burn: $${burnRate.dailyBurnRate.toFixed(2)}
  Monthly Burn: $${burnRate.monthlyBurnRate.toFixed(2)}
  Projected Total: $${burnRate.projectedTotalSpend.toLocaleString()}
  Status: ${burnRate.burnRateStatus}
  
  Category Breakdown:
  ${burnRate.categoryBurnRates
    .map(
      (c) =>
        `  ${c.category}: $${c.spent.toLocaleString()} / $${c.budgeted.toLocaleString()} ` +
        `(${((c.spent / c.budgeted) * 100).toFixed(1)}%) — ${c.status}`,
    )
    .join('\n')}
`);
```

### 5. Generate Compliance Reports

```typescript
import { GrantComplianceService } from '@mcv/portfolio/grants';

const complianceService = new GrantComplianceService();

// Set up report schedule for the grant
await complianceService.createReportSchedule(tenantId, {
  grantId: 'grant-uuid',
  schedules: [
    {
      reportType: 'quarterly',
      frequency: 'quarterly',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-06-30'),
      dueDates: [
        new Date('2026-10-30'),
        new Date('2027-01-30'),
        new Date('2027-04-30'),
        new Date('2027-07-30'),
      ],
      reminderDaysBefore: [30, 14, 7, 3, 1],
    },
    {
      reportType: 'sf_425',
      frequency: 'quarterly',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-06-30'),
      dueDates: [
        new Date('2026-10-30'),
        new Date('2027-01-30'),
        new Date('2027-04-30'),
        new Date('2027-07-30'),
      ],
      reminderDaysBefore: [30, 14, 7, 1],
    },
    {
      reportType: 'annual',
      frequency: 'annual',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-06-30'),
      dueDates: [new Date('2027-09-30')],
      reminderDaysBefore: [60, 30, 14, 7],
    },
    {
      reportType: 'final',
      frequency: 'one_time',
      startDate: new Date('2027-04-01'),
      endDate: new Date('2027-06-30'),
      dueDates: [new Date('2027-09-30')],
      reminderDaysBefore: [90, 60, 30, 14, 7],
    },
  ],
});

// Generate a quarterly progress report
const report = await complianceService.generateReport(tenantId, {
  grantId: 'grant-uuid',
  reportType: 'quarterly',
  reportPeriod: {
    start: new Date('2026-10-01'),
    end: new Date('2026-12-31'),
  },
  title: 'Q1 FY2027 Quarterly Progress Report — YWIP',
  templateId: 'federal-quarterly-template-uuid',
});

// Auto-populate financial data from budget tracking
const financialData = await complianceService.generateFinancialData(
  tenantId,
  'grant-uuid',
  {
    start: new Date('2026-10-01'),
    end: new Date('2026-12-31'),
  },
);

await complianceService.updateReportSection(tenantId, report.id, {
  sectionId: 'financial-summary',
  financialData,
});

// Add performance data
await complianceService.updateReportSection(tenantId, report.id, {
  sectionId: 'performance-data',
  performanceData: {
    objectivesProgress: [
      {
        objective: 'Enroll 125 youth in Cohort 1',
        target: '125 enrolled',
        actual: '132 enrolled',
        percentComplete: 100,
        status: 'exceeded',
        narrative:
          'Cohort 1 enrollment exceeded target by 5.6%. Strong community interest ' +
          'and partner referrals drove higher-than-expected demand.',
      },
      {
        objective: '80% training completion rate',
        target: '100 completers',
        actual: '108 completers',
        percentComplete: 100,
        status: 'exceeded',
        narrative:
          'Completion rate of 81.8% (108/132) exceeded the 80% target. Peer mentoring ' +
          'and flexible scheduling contributed to high retention.',
      },
      {
        objective: '70% certification rate among completers',
        target: '70 certified',
        actual: '82 certified',
        percentComplete: 100,
        status: 'exceeded',
        narrative:
          'Certification rate of 75.9% (82/108) exceeded the 70% threshold. Additional ' +
          'study sessions and practice exams were key success factors.',
      },
    ],
    outputMetrics: [
      { metric: 'Youth enrolled', target: 125, actual: 132, unit: 'participants', period: 'Q1' },
      { metric: 'Training hours delivered', target: 15_000, actual: 15_840, unit: 'hours', period: 'Q1' },
      { metric: 'Certifications awarded', target: 70, actual: 82, unit: 'certifications', period: 'Q1' },
      { metric: 'Employer partners active', target: 25, actual: 27, unit: 'partners', period: 'Q1' },
    ],
    outcomeMetrics: [
      { metric: 'Digital skills proficiency', baseline: 22, target: 75, actual: 78, unit: 'percent' },
      { metric: 'Job readiness assessment', baseline: 35, target: 80, actual: 76, unit: 'percent' },
    ],
    challengesAndBarriers:
      'Transportation remained the primary barrier to participation. 12 participants dropped ' +
      'out citing inability to reach training sites consistently. We addressed this by adding ' +
      'a virtual attendance option for 2 days per week starting in week 6.',
    lessonsLearned:
      'Hybrid delivery model significantly improves retention for participants with transportation ' +
      'challenges. Peer mentoring pairs outperformed individual mentoring in engagement metrics.',
    nextSteps:
      'Cohort 2 launches January 15, 2027 with expanded hybrid delivery model. Employer partners ' +
      'have committed to 45 interview slots for Cohort 1 graduates in January.',
  },
});

// Review and submit the report
await complianceService.submitReport(tenantId, report.id, userId, {
  submissionMethod: 'online_portal',
  submissionConfirmation: 'RPT-2027-Q1-CONFIRMED',
});

console.log(`Report ${report.id} submitted successfully`);

// --- Check overall compliance status ---

const complianceStatus = await complianceService.getComplianceStatus(tenantId, 'grant-uuid');

console.log(`
  Grant Compliance Status: ${complianceStatus.overallStatus}
  
  Reports Due:
  ${complianceStatus.upcomingReports
    .map((r) => `  - ${r.title}: due ${r.dueDate.toLocaleDateString()} (${r.status})`)
    .join('\n')}
  
  Overdue Items:
  ${complianceStatus.overdueItems
    .map((i) => `  ⚠️ ${i.title}: was due ${i.dueDate.toLocaleDateString()}`)
    .join('\n') || '  None'}
  
  Requirements Status:
  ${complianceStatus.requirements
    .map((r) => `  - ${r.title}: ${r.status} ${r.status === 'completed' ? '✅' : '⏳'}`)
    .join('\n')}
`);
```

### 6. Grant Analytics and Portfolio Summary

```typescript
import { GrantAnalyticsService } from '@mcv/portfolio/grants';

const analyticsService = new GrantAnalyticsService();

// Get portfolio-level analytics
const portfolio = await analyticsService.getPortfolioSummary(tenantId, {
  dateRange: {
    start: new Date('2025-01-01'),
    end: new Date('2026-12-31'),
  },
});

console.log(`
  === Grant Portfolio Summary ===
  
  Pipeline:
    Discovered: ${portfolio.pipeline.discovered}
    Evaluating: ${portfolio.pipeline.evaluating}
    Applying: ${portfolio.pipeline.applying}
    Submitted: ${portfolio.pipeline.submitted}
    Under Review: ${portfolio.pipeline.underReview}
  
  Active Grants: ${portfolio.activeGrants}
  Total Award Value: $${portfolio.totalAwardValue.toLocaleString()}
  Total Disbursed: $${portfolio.totalDisbursed.toLocaleString()}
  Total Remaining: $${portfolio.totalRemaining.toLocaleString()}
  
  Success Metrics:
    Applications Submitted: ${portfolio.successMetrics.applicationsSubmitted}
    Applications Awarded: ${portfolio.successMetrics.applicationsAwarded}
    Success Rate: ${(portfolio.successMetrics.successRate * 100).toFixed(1)}%
    Average Award: $${portfolio.successMetrics.averageAward.toLocaleString()}
    
  Compliance:
    Reports On Time: ${portfolio.compliance.onTimeReports}/${portfolio.compliance.totalReports}
    On-Time Rate: ${(portfolio.compliance.onTimeRate * 100).toFixed(1)}%
    Overdue Reports: ${portfolio.compliance.overdueReports}
`);

// Get grantor-specific analytics
const grantorAnalytics = await analyticsService.getGrantorAnalytics(tenantId, {
  dateRange: { start: new Date('2023-01-01'), end: new Date('2026-12-31') },
  limit: 10,
});

console.log('\n  === Top Grantors ===');
for (const grantor of grantorAnalytics) {
  console.log(`
    ${grantor.grantorName}:
      Total Applications: ${grantor.totalApplications}
      Awards: ${grantor.totalAwards}
      Success Rate: ${(grantor.successRate * 100).toFixed(1)}%
      Total Funding: $${grantor.totalFunding.toLocaleString()}
      Avg Award: $${grantor.averageAward.toLocaleString()}
      Avg Time to Decision: ${grantor.avgDaysToDecision} days
  `);
}

// Get ROI analysis per grant
const roiAnalysis = await analyticsService.getGrantROI(tenantId, 'grant-uuid');

console.log(`
  === Grant ROI Analysis ===
  Grant: ${roiAnalysis.grantTitle}
  Award Amount: $${roiAnalysis.awardAmount.toLocaleString()}
  
  Costs:
    Application Preparation: $${roiAnalysis.costs.applicationPreparation.toLocaleString()}
    Staff Time (Grant Mgmt): $${roiAnalysis.costs.managementStaffTime.toLocaleString()}
    Compliance/Reporting: $${roiAnalysis.costs.complianceReporting.toLocaleString()}
    Total Overhead: $${roiAnalysis.costs.totalOverhead.toLocaleString()}
  
  Net Value: $${roiAnalysis.netValue.toLocaleString()}
  ROI: ${(roiAnalysis.roi * 100).toFixed(1)}%
  Cost per Dollar Received: $${roiAnalysis.costPerDollar.toFixed(2)}
  
  Program Outcomes:
  ${roiAnalysis.outcomes
    .map((o) => `    ${o.metric}: ${o.actual} (target: ${o.target})`)
    .join('\n')}
`);

// Funding trends analysis
const trends = await analyticsService.getFundingTrends(tenantId, {
  dateRange: { start: new Date('2022-01-01'), end: new Date('2026-12-31') },
  groupBy: 'year',
});

console.log('\n  === Funding Trends ===');
for (const period of trends.periods) {
  console.log(`
    ${period.label}:
      Applied: $${period.amountApplied.toLocaleString()} (${period.applicationsSubmitted} apps)
      Awarded: $${period.amountAwarded.toLocaleString()} (${period.grantsAwarded} grants)
      Success Rate: ${(period.successRate * 100).toFixed(1)}%
      By Type: ${period.byType
        .map((t) => `${t.type}: $${t.amount.toLocaleString()}`)
        .join(', ')}
  `);
}
```

### 7. Budget Modification Workflow

```typescript
import { GrantBudgetService } from '@mcv/portfolio/grants';

const budgetService = new GrantBudgetService();

// Request a budget modification (reallocating between categories)
const modification = await budgetService.createModification(tenantId, {
  budgetId: 'budget-uuid',
  grantId: 'grant-uuid',
  reason: 'Reallocation from travel to participant support',
  description:
    'Due to shift to hybrid delivery model, travel costs are under budget while ' +
    'participant support costs (technology stipends for remote participants) exceed ' +
    'original estimates. Requesting reallocation of $5,000 from travel to participant support.',
  effectiveDate: new Date('2027-02-01'),
  changes: [
    {
      lineItemId: 'travel-line-item-uuid',
      category: 'travel',
      description: 'Reduce travel budget — hybrid model reduces site visits',
      previousAmount: 15_000,
      newAmount: 10_000,
      changeAmount: -5_000,
      justification: 'Hybrid delivery model has reduced travel needs by approximately 40%',
    },
    {
      lineItemId: 'participant-support-line-item-uuid',
      category: 'participant_support',
      description: 'Increase participant technology stipends',
      previousAmount: 62_500,
      newAmount: 67_500,
      changeAmount: 5_000,
      justification: 'Technology stipends ($100/participant) needed for remote participants in hybrid cohorts',
    },
  ],
  requiresGrantorApproval: false, // Under 10% threshold
});

// Internal approval
await budgetService.approveModification(tenantId, modification.id, approverUserId, {
  approved: true,
  notes: 'Reallocation within allowable threshold. Good adaptation to hybrid model.',
});

// Implement the modification
await budgetService.implementModification(tenantId, modification.id, userId);

console.log(`Budget modification #${modification.modificationNumber} implemented`);

// Check updated burn rate projections
const projection = await budgetService.getBurnRateProjection(tenantId, 'grant-uuid', {
  scenarioName: 'Post-Modification Projection',
  projectionMonths: 6,
});

console.log(`
  Burn Rate Projection (Post-Modification):
  ${projection.monthlyProjections
    .map(
      (p) =>
        `  ${p.month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}: ` +
        `Spend $${p.projectedSpend.toLocaleString()} | ` +
        `Cumulative $${p.cumulativeSpend.toLocaleString()} | ` +
        `Remaining $${p.remainingBudget.toLocaleString()}`,
    )
    .join('\n')}
  
  ${projection.exhaustionDate
    ? `⚠️ Budget exhaustion projected: ${projection.exhaustionDate.toLocaleDateString()}`
    : '✅ Budget projected to last through grant period'}
  
  Recommendations:
  ${projection.recommendations.map((r) => `  - ${r}`).join('\n')}
`);
```

---

## Error Codes

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| `GRANT_NOT_FOUND` | `GrantNotFoundError` | 404 | Grant with the specified ID does not exist or is not accessible to the current tenant |
| `APPLICATION_NOT_FOUND` | `ApplicationNotFoundError` | 404 | Grant application with the specified ID does not exist |
| `APPLICATION_ALREADY_SUBMITTED` | `ApplicationAlreadySubmittedError` | 409 | Application has already been submitted and cannot be modified; create a new version instead |
| `MILESTONE_NOT_FOUND` | `MilestoneNotFoundError` | 404 | Grant milestone with the specified ID does not exist |
| `MILESTONE_ALREADY_COMPLETE` | `MilestoneAlreadyCompleteError` | 409 | Milestone has already been verified as complete; cannot modify completion status |
| `DISBURSEMENT_EXCEEDS_BUDGET` | `DisbursementExceedsBudgetError` | 422 | Disbursement allocation exceeds the remaining budget for one or more line items |
| `BUDGET_OVERRUN` | `BudgetOverrunError` | 422 | Operation would cause spending to exceed the approved budget amount |
| `COMPLIANCE_VIOLATION` | `ComplianceViolationError` | 422 | Action violates a grant compliance requirement (e.g., spending on prohibited category) |
| `DEADLINE_PASSED` | `DeadlinePassedError` | 422 | The deadline for this action has passed; contact grantor for extension |
| `ELIGIBILITY_CHECK_FAILED` | `EligibilityCheckFailedError` | 422 | Organization does not meet one or more required eligibility criteria for this grant |
| `INSUFFICIENT_GRANT_PERMISSIONS` | `InsufficientGrantPermissionsError` | 403 | User does not have the required role/permission for this grant operation |
| `GRANT_CLOSEOUT_INCOMPLETE` | `GrantCloseoutIncompleteError` | 422 | Cannot close grant: outstanding milestones, pending reports, or unreconciled disbursements |
| `DUPLICATE_GRANT` | `DuplicateGrantError` | 409 | A grant with the same funding opportunity number already exists in this tenant |
| `INVALID_STATUS_TRANSITION` | `InvalidStatusTransitionError` | 422 | The requested status transition is not valid from the current grant/application status |
| `BUDGET_MODIFICATION_THRESHOLD` | `BudgetModificationThresholdError` | 422 | Budget modification exceeds the allowable threshold and requires grantor prior approval |
| `MATCHING_FUNDS_DEFICIT` | `MatchingFundsDeficitError` | 422 | Matching fund requirements are not met; current match is below the required percentage |
| `REPORT_NOT_FOUND` | `ReportNotFoundError` | 404 | Compliance report with the specified ID does not exist |
| `REPORT_ALREADY_SUBMITTED` | `ReportAlreadySubmittedError` | 409 | Report has already been submitted to the grantor |

### Error Implementation

```typescript
// errors/index.ts

import { TRPCError } from '@trpc/server';

export class GrantError extends TRPCError {
  public readonly grantErrorCode: string;

  constructor(code: string, message: string, trpcCode: TRPCError['code'] = 'BAD_REQUEST') {
    super({ code: trpcCode, message });
    this.grantErrorCode = code;
  }
}

export class GrantNotFoundError extends GrantError {
  constructor(grantId: string) {
    super('GRANT_NOT_FOUND', `Grant not found: ${grantId}`, 'NOT_FOUND');
  }
}

export class ApplicationAlreadySubmittedError extends GrantError {
  constructor(applicationId: string) {
    super(
      'APPLICATION_ALREADY_SUBMITTED',
      `Application ${applicationId} has already been submitted. Create a new version to make changes.`,
      'CONFLICT',
    );
  }
}

export class DisbursementExceedsBudgetError extends GrantError {
  constructor(details: { lineItemId: string; budgeted: number; spent: number; requested: number }) {
    super(
      'DISBURSEMENT_EXCEEDS_BUDGET',
      `Disbursement of $${details.requested} for line item ${details.lineItemId} would exceed ` +
        `remaining budget (budgeted: $${details.budgeted}, spent: $${details.spent}, ` +
        `remaining: $${details.budgeted - details.spent})`,
      'UNPROCESSABLE_CONTENT',
    );
  }
}

export class GrantCloseoutIncompleteError extends GrantError {
  constructor(
    grantId: string,
    outstanding: { milestones: number; reports: number; disbursements: number },
  ) {
    const issues: string[] = [];
    if (outstanding.milestones > 0) issues.push(`${outstanding.milestones} incomplete milestones`);
    if (outstanding.reports > 0) issues.push(`${outstanding.reports} pending reports`);
    if (outstanding.disbursements > 0) issues.push(`${outstanding.disbursements} unreconciled disbursements`);

    super(
      'GRANT_CLOSEOUT_INCOMPLETE',
      `Cannot close grant ${grantId}: ${issues.join(', ')}`,
      'UNPROCESSABLE_CONTENT',
    );
  }
}

export class ComplianceViolationError extends GrantError {
  constructor(grantId: string, violation: string) {
    super(
      'COMPLIANCE_VIOLATION',
      `Compliance violation for grant ${grantId}: ${violation}`,
      'UNPROCESSABLE_CONTENT',
    );
  }
}

export class DeadlinePassedError extends GrantError {
  constructor(deadlineType: string, dueDate: Date) {
    super(
      'DEADLINE_PASSED',
      `The ${deadlineType} deadline of ${dueDate.toLocaleDateString()} has passed`,
      'UNPROCESSABLE_CONTENT',
    );
  }
}

export class InsufficientGrantPermissionsError extends GrantError {
  constructor(userId: string, requiredRole: string) {
    super(
      'INSUFFICIENT_GRANT_PERMISSIONS',
      `User ${userId} requires '${requiredRole}' role for this operation`,
      'FORBIDDEN',
    );
  }
}

export class MatchingFundsDeficitError extends GrantError {
  constructor(grantId: string, required: number, provided: number) {
    super(
      'MATCHING_FUNDS_DEFICIT',
      `Grant ${grantId} matching funds deficit: required $${required.toLocaleString()}, ` +
        `provided $${provided.toLocaleString()}, deficit $${(required - provided).toLocaleString()}`,
      'UNPROCESSABLE_CONTENT',
    );
  }
}
```

---

## Security

### Authentication & Authorization

- All endpoints require valid JWT authentication via `@mcv/auth`
- Multi-tenant isolation enforced at the database level via Supabase RLS policies
- `tenant_id` is injected from the authenticated session — never accepted from client input
- Grant-level RBAC with the following roles:

| Role | Permissions |
|------|------------|
| `grant_viewer` | Read-only access to assigned grants |
| `grant_writer` | Create/edit grants, applications, milestones, documents |
| `grant_manager` | Full CRUD, budget modifications, disbursement recording |
| `grant_admin` | All permissions plus team management, archiving, and analytics |
| `compliance_officer` | Report generation, submission, compliance requirement management |
| `finance_officer` | Budget management, disbursement tracking, financial reporting |

### Data Protection

- Grant financial data encrypted at rest (Supabase encryption)
- Document storage uses signed URLs with time-limited access (15-minute expiry)
- PII in grant applications (personnel data, salary information) requires additional access check
- Audit trail for all write operations — immutable log of who changed what and when
- API rate limiting: 100 requests/minute per user, 1000 requests/minute per tenant

### Compliance-Specific Security

- Federal grant data handling follows NIST 800-171 guidelines where applicable
- Document checksums verify integrity of uploaded files
- Report submissions are signed with user identity and timestamp
- Budget modifications maintain full change history with before/after snapshots
- Disbursement records cannot be deleted — only voided with reason

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GRANTS_DB_URL` | Yes | — | Supabase PostgreSQL connection string |
| `GRANTS_DB_POOL_SIZE` | No | `10` | Database connection pool size |
| `GRANTS_STORAGE_BUCKET` | Yes | — | Supabase storage bucket for grant documents |
| `GRANTS_STORAGE_PROVIDER` | No | `supabase` | Document storage provider (`supabase`, `s3`) |
| `GRANTS_MAX_DOCUMENT_SIZE_MB` | No | `50` | Maximum upload size for grant documents |
| `GRANTS_GOV_API_KEY` | No | — | Grants.gov API key for federal grant discovery |
| `GRANTS_GOV_API_URL` | No | `https://api.grants.gov/v1` | Grants.gov API base URL |
| `SAM_GOV_API_KEY` | No | — | SAM.gov API key for entity validation |
| `GRANTS_DEADLINE_ALERT_DAYS` | No | `30,14,7,3,1` | Default alert days before deadlines |
| `GRANTS_NOTIFICATION_CHANNEL` | No | `email` | Default notification channel for alerts |
| `GRANTS_BURN_RATE_ALERT_THRESHOLD` | No | `0.15` | Burn rate deviation threshold for alerts (15%) |
| `GRANTS_INDIRECT_COST_RATE_DEFAULT` | No | `0.10` | Default de minimis indirect cost rate (10%) |
| `GRANTS_AUDIT_RETENTION_DAYS` | No | `2555` | Audit trail retention (default: 7 years — federal requirement) |
| `GRANTS_ENCRYPTION_KEY` | Yes | — | Encryption key for sensitive grant data |
| `GRANTS_REPORT_TEMPLATE_PATH` | No | `./templates` | Path to report template files |

---

## Dependencies

### Internal Dependencies

| Package | Purpose | Integration Point |
|---------|---------|-------------------|
| `@mcv/database` | Database client, Drizzle ORM config | Schema definitions, query builder |
| `@mcv/auth` | Authentication, RBAC, tenant context | JWT validation, role checks, tenant extraction |
| `@mcv/finance` | Financial tracking, account management | Budget sync, expense categorization, financial reports |
| `@mcv/documents` | Document management, storage, versioning | Proposal storage, report assembly, evidence files |
| `@mcv/notifications` | Alert delivery (email, SMS, in-app) | Deadline alerts, status change notifications |
| `@mcv/audit` | Audit trail, change logging | Immutable operation logs, compliance audit support |
| `@mcv/trpc` | tRPC router setup, middleware | Router composition, error handling, context |
| `@mcv/validators` | Shared Zod schemas, validation utilities | Input validation, data sanitization |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.36.x` | Type-safe SQL query builder and ORM |
| `@trpc/server` | `^11.x` | Type-safe API layer |
| `zod` | `^3.23.x` | Runtime schema validation |
| `date-fns` | `^4.x` | Date manipulation for deadlines and schedules |
| `decimal.js` | `^10.x` | Precise financial calculations |
| `node-cron` | `^3.x` | Deadline monitoring and scheduled report generation |
| `@supabase/supabase-js` | `^2.x` | Supabase client for storage and realtime |
| `pdf-lib` | `^1.17.x` | PDF generation for compliance reports |
| `handlebars` | `^4.x` | Report template rendering |
| `csv-stringify` | `^6.x` | CSV export for financial data |

---

## Testing

### Unit Test Strategy

```typescript
// __tests__/services/grant.service.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GrantService } from '../services/grant.service';
import { createTestDB, seedGrant, seedTenant } from '@mcv/testing';

describe('GrantService', () => {
  let service: GrantService;
  let tenantId: string;
  let userId: string;

  beforeEach(async () => {
    const db = await createTestDB();
    service = new GrantService(db);
    tenantId = await seedTenant(db);
    userId = 'test-user-uuid';
  });

  describe('createGrant', () => {
    it('creates a grant in discovered status', async () => {
      const grant = await service.createGrant(tenantId, {
        title: 'Test Grant',
        description: 'A test grant for unit testing',
        grantorName: 'Test Foundation',
        grantorType: 'private_foundation',
        grantType: 'private_foundation',
        fundingAmount: 50_000,
      }, userId);

      expect(grant.id).toBeDefined();
      expect(grant.status).toBe('discovered');
      expect(grant.title).toBe('Test Grant');
      expect(grant.fundingAmount).toBe(50_000);
      expect(grant.tenantId).toBe(tenantId);
    });

    it('enforces tenant isolation', async () => {
      const otherTenantId = 'other-tenant-uuid';
      const grant = await service.createGrant(tenantId, {
        title: 'Tenant A Grant',
        description: 'test',
        grantorName: 'Foundation',
        grantorType: 'private_foundation',
        grantType: 'private_foundation',
        fundingAmount: 10_000,
      }, userId);

      await expect(
        service.getGrant(otherTenantId, grant.id),
      ).rejects.toThrow('GRANT_NOT_FOUND');
    });
  });

  describe('transitionStatus', () => {
    it('allows valid status transitions', async () => {
      const grant = await seedGrant(tenantId, { status: 'discovered' });

      const updated = await service.transitionStatus(
        tenantId,
        grant.id,
        'evaluating',
        userId,
        'Promising opportunity',
      );

      expect(updated.status).toBe('evaluating');
      expect(updated.statusChangedBy).toBe(userId);
      expect(updated.statusChangeReason).toBe('Promising opportunity');
    });

    it('rejects invalid status transitions', async () => {
      const grant = await seedGrant(tenantId, { status: 'discovered' });

      await expect(
        service.transitionStatus(tenantId, grant.id, 'active', userId),
      ).rejects.toThrow("Cannot transition from 'discovered' to 'active'");
    });

    it('prevents transitioning closed grants', async () => {
      const grant = await seedGrant(tenantId, { status: 'closed' });

      await expect(
        service.transitionStatus(tenantId, grant.id, 'active', userId),
      ).rejects.toThrow();
    });
  });

  describe('listGrants', () => {
    it('filters by status', async () => {
      await seedGrant(tenantId, { status: 'active' });
      await seedGrant(tenantId, { status: 'closed' });
      await seedGrant(tenantId, { status: 'active' });

      const result = await service.listGrants(tenantId, {
        status: ['active'],
      });

      expect(result.total).toBe(2);
      result.grants.forEach((g) => expect(g.status).toBe('active'));
    });

    it('supports full-text search', async () => {
      await seedGrant(tenantId, { title: 'Youth Workforce Development Program' });
      await seedGrant(tenantId, { title: 'Community Health Initiative' });

      const result = await service.listGrants(tenantId, {
        search: 'workforce development',
      });

      expect(result.total).toBe(1);
      expect(result.grants[0].title).toContain('Workforce');
    });

    it('paginates results correctly', async () => {
      for (let i = 0; i < 15; i++) {
        await seedGrant(tenantId, { title: `Grant ${i}` });
      }

      const page1 = await service.listGrants(tenantId, { limit: 10, offset: 0 });
      const page2 = await service.listGrants(tenantId, { limit: 10, offset: 10 });

      expect(page1.grants.length).toBe(10);
      expect(page1.hasMore).toBe(true);
      expect(page2.grants.length).toBe(5);
      expect(page2.hasMore).toBe(false);
    });
  });
});
```

### Integration Test Patterns

```typescript
// __tests__/integration/grant-lifecycle.test.ts

import { describe, it, expect } from 'vitest';
import { createIntegrationContext } from '@mcv/testing';

describe('Grant Lifecycle (Integration)', () => {
  it('supports full grant lifecycle from discovery to closeout', async () => {
    const ctx = await createIntegrationContext();

    // 1. Create grant from discovery
    const grant = await ctx.grantService.createGrant(ctx.tenantId, {
      title: 'Integration Test Grant',
      description: 'End-to-end lifecycle test',
      grantorName: 'Test Agency',
      grantorType: 'federal_agency',
      grantType: 'federal_competitive',
      fundingAmount: 100_000,
      applicationDeadline: new Date('2027-06-01'),
    }, ctx.userId);
    expect(grant.status).toBe('discovered');

    // 2. Evaluate → Apply
    await ctx.grantService.transitionStatus(ctx.tenantId, grant.id, 'evaluating', ctx.userId);
    await ctx.grantService.transitionStatus(ctx.tenantId, grant.id, 'applying', ctx.userId);

    // 3. Create and submit application
    const app = await ctx.applicationService.createApplication(ctx.tenantId, {
      grantId: grant.id,
      title: 'Test Application',
      dueDate: new Date('2027-06-01'),
      narrative: { executiveSummary: 'Test', /* ... */ },
      proposedBudget: { totalRequested: 100_000, lineItems: [], /* ... */ },
    });
    await ctx.applicationService.submitApplication(ctx.tenantId, app.id, ctx.userId, {
      submissionMethod: 'online_portal',
      submissionConfirmation: 'TEST-CONF-001',
    });

    // 4. Grant awarded
    await ctx.grantService.transitionStatus(ctx.tenantId, grant.id, 'submitted', ctx.userId);
    await ctx.grantService.transitionStatus(ctx.tenantId, grant.id, 'under_review', ctx.userId);
    await ctx.grantService.transitionStatus(ctx.tenantId, grant.id, 'awarded', ctx.userId);

    const awarded = await ctx.grantService.updateGrant(ctx.tenantId, grant.id, {
      awardNumber: 'FED-2027-001',
      awardDate: new Date(),
      awardAmount: 95_000,
    });
    expect(awarded.awardAmount).toBe(95_000);

    // 5. Activate and create budget
    await ctx.grantService.transitionStatus(ctx.tenantId, grant.id, 'active', ctx.userId);
    const budget = await ctx.budgetService.createBudget(ctx.tenantId, {
      grantId: grant.id,
      title: 'Year 1 Budget',
      totalBudgeted: 95_000,
      periodStart: new Date('2027-07-01'),
      periodEnd: new Date('2028-06-30'),
      lineItems: [
        { category: 'personnel', description: 'Staff', totalBudgeted: 50_000 },
        { category: 'supplies', description: 'Materials', totalBudgeted: 25_000 },
        { category: 'contractual', description: 'Evaluation', totalBudgeted: 20_000 },
      ],
    });

    // 6. Record disbursement
    const disbursement = await ctx.disbursementService.createDisbursement(ctx.tenantId, {
      grantId: grant.id,
      type: 'advance',
      requestedAmount: 47_500,
      requestDate: new Date(),
    });

    // 7. Create milestone
    const [milestone] = await ctx.milestoneService.createMilestones(ctx.tenantId, grant.id, [{
      title: 'Program Launch',
      description: 'Complete setup',
      type: 'programmatic',
      sequenceNumber: 1,
      dueDate: new Date('2027-10-01'),
      completionCriteria: { description: 'All staff hired', checklistItems: [] },
    }]);

    // 8. Close out
    await ctx.milestoneService.completeMilestone(ctx.tenantId, milestone.id, ctx.userId);
    await ctx.grantService.transitionStatus(ctx.tenantId, grant.id, 'closing_out', ctx.userId);

    // Submit final report
    const finalReport = await ctx.complianceService.generateReport(ctx.tenantId, {
      grantId: grant.id,
      reportType: 'final',
      title: 'Final Report',
      reportPeriod: { start: new Date('2027-07-01'), end: new Date('2028-06-30') },
    });
    await ctx.complianceService.submitReport(ctx.tenantId, finalReport.id, ctx.userId, {});

    // Close grant
    await ctx.grantService.transitionStatus(ctx.tenantId, grant.id, 'closed', ctx.userId);

    const finalGrant = await ctx.grantService.getGrant(ctx.tenantId, grant.id);
    expect(finalGrant.status).toBe('closed');
    expect(finalGrant.closedAt).toBeDefined();
  });
});
```

### Test Coverage Requirements

| Area | Minimum Coverage | Critical Paths |
|------|-----------------|----------------|
| GrantService | 90% | Status transitions, tenant isolation, CRUD |
| ApplicationService | 85% | Draft → submit workflow, review flow, version management |
| MilestoneService | 85% | Completion criteria, payment triggers, dependency chains |
| DisbursementService | 90% | Amount validation, budget checks, allocation accuracy |
| BudgetService | 90% | Line item math, burn rate calculations, modification workflow |
| ComplianceService | 85% | Report generation, schedule management, financial data accuracy |
| DeadlineService | 80% | Alert generation, escalation, overdue detection |
| DiscoveryService | 75% | Eligibility scoring, search, recommendation engine |
| AnalyticsService | 75% | Aggregation accuracy, trend calculations, ROI formulas |

### Testing Utilities

```typescript
// testing/helpers.ts

export function seedGrant(
  tenantId: string,
  overrides?: Partial<Grant>,
): Promise<Grant> {
  return grantService.createGrant(tenantId, {
    title: `Test Grant ${Date.now()}`,
    description: 'Auto-generated test grant',
    grantorName: 'Test Foundation',
    grantorType: 'private_foundation',
    grantType: 'private_foundation',
    fundingAmount: 100_000,
    ...overrides,
  }, 'test-user');
}

export function createTestBudget(grantId: string, amount: number) {
  return budgetService.createBudget(testTenantId, {
    grantId,
    title: 'Test Budget',
    totalBudgeted: amount,
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-12-31'),
    lineItems: [
      { category: 'personnel', description: 'Staff', totalBudgeted: amount * 0.5 },
      { category: 'supplies', description: 'Materials', totalBudgeted: amount * 0.3 },
      { category: 'other', description: 'Other', totalBudgeted: amount * 0.2 },
    ],
  });
}

export function createTestMilestone(grantId: string, sequence: number) {
  return milestoneService.createMilestones(testTenantId, grantId, [{
    title: `Milestone ${sequence}`,
    description: `Test milestone ${sequence}`,
    type: 'programmatic',
    sequenceNumber: sequence,
    dueDate: new Date(Date.now() + sequence * 90 * 24 * 60 * 60 * 1000),
    completionCriteria: {
      description: 'Test criteria',
      checklistItems: [{ item: 'Test item', completed: false, completedAt: null }],
    },
  }]);
}
```

---

## Related Modules

| Module | Relationship | Description |
|--------|-------------|-------------|
| `@mcv/finance` | Bidirectional | Grant budgets sync with organizational financial tracking; disbursements flow to accounting |
| `@mcv/documents` | Consumes | Grant proposals, reports, and evidence stored via document management system |
| `@mcv/notifications` | Produces | Deadline alerts, status changes, and compliance reminders trigger notifications |
| `@mcv/auth` | Consumes | Authentication, tenant context, and role-based access control |
| `@mcv/audit` | Produces | All grant operations emit audit events for compliance trail |
| `@mcv/portfolio/projects` | Bidirectional | Grants may fund specific projects; project milestones may link to grant milestones |
| `@mcv/analytics` | Produces | Grant data feeds into organization-wide analytics and dashboards |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2025-01-15 | Initial module — grant CRUD, basic application workflow |
| 0.2.0 | 2025-03-01 | Added milestone tracking, payment triggers |
| 0.3.0 | 2025-05-01 | Budget management with line items and burn rate |
| 0.4.0 | 2025-07-01 | Compliance reporting engine, report templates |
| 0.5.0 | 2025-09-01 | Disbursement tracking, drawdown requests |
| 0.6.0 | 2025-11-01 | Grant discovery service, eligibility matching |
| 0.7.0 | 2026-01-15 | Analytics dashboard, ROI calculations, portfolio summary |
| 0.8.0 | 2026-03-01 | Deadline management with escalation rules |
| 0.9.0 | 2026-05-01 | Document versioning, federal report templates (SF-425, SF-428) |
| 1.0.0 | 2026-07-01 | Production release — Full Gain launch |