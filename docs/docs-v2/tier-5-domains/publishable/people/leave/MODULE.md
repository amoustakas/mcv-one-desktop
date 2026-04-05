# @mcv/people/leave

> Leave Management for the MCV.ONE Platform

**Module:** `@mcv/people/leave`
**Domain:** People & HR
**Tier:** 5 (Domain Module)
**Since:** 0.8.0
**Status:** Stable
**Maintainer:** MCV People Team

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

`@mcv/people/leave` provides comprehensive leave management capabilities for ventures operating on the MCV.ONE platform. It handles the full lifecycle of employee time-off — from defining leave types and policies, through request submission and approval workflows, to balance tracking, compliance reporting, and payroll integration.

### Why This Module Exists

Leave management sits at the intersection of employee experience, operational planning, and legal compliance. A venture with 50 employees across three countries faces radically different statutory requirements, cultural expectations, and operational constraints. This module abstracts that complexity into a unified system that:

- **Adapts to jurisdiction** — Statutory leave entitlements vary dramatically. Canada mandates 2 weeks vacation federally, France provides 5 weeks, and the US has no federal mandate. This module encodes jurisdiction-specific rules and enforces them automatically.
- **Scales with the venture** — A 5-person startup needs simple PTO tracking. A 500-person operation needs multi-level approvals, department-level conflict detection, and Bradford Factor analysis. The same module serves both.
- **Integrates deeply** — Leave isn't isolated. It affects payroll calculations, project scheduling, team capacity, and compliance reporting. This module provides integration points for all of these.
- **Maintains audit trails** — Every leave request, approval, denial, cancellation, and balance adjustment is recorded with full provenance for compliance and dispute resolution.

### Core Capabilities

| Capability | Description |
|---|---|
| **Leave Types** | Vacation, sick, personal, parental, bereavement, jury duty, military, sabbatical; fully configurable per venture and country |
| **Leave Policies** | Accrual rules (monthly/annual/hourly), carryover limits, negative balance allowance, probation restrictions, waiting periods |
| **Request & Approval** | Submit leave requests, manager approval workflows, multi-level approval chains, delegation during absence |
| **Balance Tracking** | Real-time balance calculation, accrual schedules, used/pending/available breakdown, projected balances |
| **Calendar View** | Team leave calendar, department view, conflict detection, blackout date enforcement |
| **Holiday Calendars** | Country/region-specific public holidays, company holidays, floating holidays, religious observances |
| **Leave Entitlements** | Tenure-based entitlements, grade-based allocations, custom entitlements, pro-rated for mid-year joins |
| **Compliance** | FMLA tracking, statutory leave requirements by jurisdiction, medical documentation management |
| **Reporting** | Leave utilization, absence patterns, department trends, cost of absence, Bradford Factor |
| **Integration** | Payroll deductions, calendar sync (Google/Outlook), timesheet integration, operations scheduling |

---

## Exports

```typescript
// === Primary Service ===
export { LeaveService } from './services/leave.service';
export { LeaveServiceFactory } from './services/leave.service.factory';

// === Domain Services ===
export { LeaveRequestService } from './services/leave-request.service';
export { LeaveBalanceService } from './services/leave-balance.service';
export { LeaveAccrualService } from './services/leave-accrual.service';
export { LeavePolicyService } from './services/leave-policy.service';
export { LeaveTypeService } from './services/leave-type.service';
export { LeaveEntitlementService } from './services/leave-entitlement.service';
export { HolidayCalendarService } from './services/holiday-calendar.service';
export { LeaveApprovalService } from './services/leave-approval.service';
export { LeaveReportService } from './services/leave-report.service';
export { LeaveComplianceService } from './services/leave-compliance.service';
export { LeaveCalendarService } from './services/leave-calendar.service';

// === tRPC Router ===
export { leaveRouter } from './trpc/leave.router';
export type { LeaveRouter } from './trpc/leave.router';

// === Core Types ===
export type {
  LeaveRequest,
  LeaveRequestCreate,
  LeaveRequestUpdate,
  LeaveRequestStatus,
  LeaveRequestFilter,
} from './types/leave-request.types';

export type {
  LeaveType,
  LeaveTypeCreate,
  LeaveTypeUpdate,
  LeaveTypeCategory,
  LeaveTypeAccrualMethod,
} from './types/leave-type.types';

export type {
  LeavePolicy,
  LeavePolicyCreate,
  LeavePolicyUpdate,
  LeavePolicyRule,
  AccrualSchedule,
  CarryoverRule,
} from './types/leave-policy.types';

export type {
  LeaveBalance,
  LeaveBalanceSummary,
  LeaveBalanceBreakdown,
  LeaveBalanceProjection,
} from './types/leave-balance.types';

export type {
  HolidayCalendar,
  HolidayCalendarCreate,
  Holiday,
  HolidayCreate,
  HolidayType,
} from './types/holiday-calendar.types';

export type {
  LeaveEntitlement,
  LeaveEntitlementCreate,
  LeaveEntitlementRule,
  EntitlementBasis,
} from './types/leave-entitlement.types';

export type {
  LeaveReport,
  LeaveUtilizationReport,
  AbsencePatternReport,
  BradfordFactorReport,
  CostOfAbsenceReport,
  DepartmentTrendReport,
} from './types/leave-report.types';

export type {
  LeaveApproval,
  ApprovalAction,
  ApprovalChain,
  ApprovalDelegate,
} from './types/leave-approval.types';

export type {
  LeaveAccrual,
  AccrualRun,
  AccrualRunResult,
} from './types/leave-accrual.types';

export type {
  LeaveAdjustment,
  LeaveAdjustmentCreate,
  AdjustmentReason,
} from './types/leave-adjustment.types';

export type {
  LeaveDocument,
  LeaveDocumentCreate,
  DocumentType,
} from './types/leave-document.types';

export type {
  LeaveCalendarEntry,
  TeamCalendarView,
  DepartmentCalendarView,
  BlackoutDate,
  ConflictDetectionResult,
} from './types/leave-calendar.types';

export type {
  FMLATracking,
  FMLAEligibility,
  FMLAUsage,
  StatutoryLeaveRequirement,
} from './types/leave-compliance.types';

// === Database Schema ===
export {
  leaveTypes,
  leavePolicies,
  leaveRequests,
  leaveBalances,
  leaveAccruals,
  holidayCalendars,
  holidays,
  leaveEntitlements,
  leaveAdjustments,
  leaveDocuments,
  leaveApprovals,
  leaveBlackoutDates,
  leavePolicyAssignments,
} from './db/schema';

// === Validators ===
export {
  leaveRequestCreateSchema,
  leaveRequestUpdateSchema,
  leaveTypeCreateSchema,
  leavePolicyCreateSchema,
  holidayCreateSchema,
  leaveEntitlementCreateSchema,
  leaveAdjustmentCreateSchema,
} from './validators';

// === Constants ===
export {
  LEAVE_STATUS,
  LEAVE_CATEGORY,
  ACCRUAL_METHOD,
  ACCRUAL_FREQUENCY,
  CARRYOVER_POLICY,
  APPROVAL_ACTION,
  HOLIDAY_TYPE,
  ENTITLEMENT_BASIS,
  DOCUMENT_TYPE,
  BRADFORD_THRESHOLDS,
} from './constants';

// === Hooks (React) ===
export {
  useLeaveRequests,
  useLeaveBalance,
  useLeaveCalendar,
  useLeaveTypes,
  useLeavePolicy,
  useHolidayCalendar,
  useSubmitLeaveRequest,
  useApproveLeaveRequest,
  useDenyLeaveRequest,
  useCancelLeaveRequest,
  useLeaveReport,
} from './hooks';

// === Events ===
export {
  LEAVE_EVENTS,
  type LeaveRequestSubmittedEvent,
  type LeaveRequestApprovedEvent,
  type LeaveRequestDeniedEvent,
  type LeaveRequestCancelledEvent,
  type LeaveBalanceUpdatedEvent,
  type LeaveAccrualProcessedEvent,
  type LeaveEntitlementGrantedEvent,
} from './events';
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        @mcv/people/leave                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐    │
│  │  tRPC Router │   │  React Hooks │   │   Event Emitters     │    │
│  │  (API Layer) │   │  (UI Layer)  │   │  (Integration Layer) │    │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘    │
│         │                  │                       │                │
│  ┌──────▼──────────────────▼───────────────────────▼───────────┐   │
│  │                    LeaveService (Facade)                     │   │
│  │  Orchestrates all leave operations, enforces business rules  │   │
│  └──────┬──────────┬──────────┬──────────┬──────────┬──────────┘   │
│         │          │          │          │          │               │
│  ┌──────▼───┐ ┌────▼────┐ ┌──▼───┐ ┌───▼────┐ ┌───▼──────────┐   │
│  │ Request  │ │ Balance │ │Policy│ │Accrual │ │  Compliance  │   │
│  │ Service  │ │ Service │ │ Svc  │ │ Svc    │ │  Service     │   │
│  └──────┬───┘ └────┬────┘ └──┬───┘ └───┬────┘ └───┬──────────┘   │
│         │          │         │         │           │               │
│  ┌──────▼───┐ ┌────▼────┐ ┌──▼────┐ ┌──▼─────┐ ┌──▼──────────┐   │
│  │ Approval │ │Calendar │ │Holiday│ │Entitle-│ │  Report     │   │
│  │ Service  │ │ Service │ │ Svc   │ │ment Svc│ │  Service    │   │
│  └──────────┘ └─────────┘ └───────┘ └────────┘ └─────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Database Layer (Drizzle ORM)               │   │
│  │  leave_types │ leave_policies │ leave_requests │ leave_      │   │
│  │  leave_balances │ leave_accruals │ holiday_calendars │ ...   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Supabase PostgreSQL (Multi-Tenant RLS)          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

A leave request flows through a well-defined lifecycle with clear state transitions:

```
                    ┌───────────┐
                    │  DRAFT    │ ← Employee saves incomplete request
                    └─────┬─────┘
                          │ submit()
                    ┌─────▼─────┐
              ┌─────│  PENDING  │─────┐
              │     └─────┬─────┘     │
     deny()   │           │           │  cancel()
              │    approve()          │
        ┌─────▼─────┐    │     ┌─────▼──────┐
        │  DENIED   │    │     │ CANCELLED  │
        └───────────┘    │     └────────────┘
                   ┌─────▼─────┐
                   │ APPROVED  │──────────┐
                   └─────┬─────┘          │ cancel()
                         │          ┌─────▼──────────┐
                  start of leave    │ CANCEL_PENDING │
                         │          └─────┬──────────┘
                   ┌─────▼─────┐          │
                   │ ACTIVE    │    approve cancel
                   └─────┬─────┘          │
                         │          ┌─────▼──────┐
                   end of leave     │ CANCELLED  │
                         │          └────────────┘
                   ┌─────▼─────┐
                   │ COMPLETED │
                   └───────────┘
```

### Accrual Processing Pipeline

Leave accruals are processed via a scheduled cron job that runs at configurable intervals:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Accrual Processing Pipeline                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. TRIGGER                                                     │
│     ├── Cron Schedule (daily/weekly/monthly)                    │
│     ├── Manual Trigger (admin)                                  │
│     └── On-Demand (hire/termination events)                     │
│                                                                 │
│  2. IDENTIFY ELIGIBLE EMPLOYEES                                 │
│     ├── Active employment status                                │
│     ├── Past probation period (if applicable)                   │
│     ├── Assigned to leave policy                                │
│     └── Not on extended leave                                   │
│                                                                 │
│  3. CALCULATE ACCRUAL AMOUNTS                                   │
│     ├── Annual → pro-rated to period                            │
│     ├── Monthly → fixed per month                               │
│     ├── Hourly → based on hours worked                          │
│     ├── Per-pay-period → based on payroll cycle                 │
│     └── Apply tenure multipliers                                │
│                                                                 │
│  4. APPLY CARRYOVER RULES (at period boundaries)                │
│     ├── Unlimited carryover                                     │
│     ├── Capped carryover (max days)                             │
│     ├── Use-it-or-lose-it                                       │
│     └── Partial carryover with expiry                           │
│                                                                 │
│  5. ENFORCE CAPS                                                │
│     ├── Maximum balance cap                                     │
│     ├── Maximum accrual per year                                │
│     └── Negative balance floor                                  │
│                                                                 │
│  6. UPDATE BALANCES                                             │
│     ├── Credit accrued amounts                                  │
│     ├── Record accrual transaction                              │
│     └── Emit LeaveAccrualProcessedEvent                         │
│                                                                 │
│  7. AUDIT & REPORT                                              │
│     ├── Log accrual run details                                 │
│     ├── Flag anomalies                                          │
│     └── Generate accrual summary                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Isolation

All leave data is tenant-scoped via Supabase Row Level Security (RLS). Every table includes a `venture_id` column, and RLS policies ensure that queries only return data for the authenticated user's venture.

```sql
-- Example RLS policy on leave_requests
CREATE POLICY "leave_requests_tenant_isolation" ON leave_requests
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- Employees can see their own requests
CREATE POLICY "leave_requests_employee_read" ON leave_requests
  FOR SELECT USING (
    employee_id = current_setting('app.current_user_id')::uuid
  );

-- Managers can see requests from their direct reports
CREATE POLICY "leave_requests_manager_read" ON leave_requests
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = current_setting('app.current_user_id')::uuid
    )
  );
```

### Event-Driven Integration

The leave module emits domain events for every significant state change, enabling loose coupling with downstream systems:

```typescript
// Event catalog
const LEAVE_EVENTS = {
  // Request lifecycle
  'leave.request.submitted':    LeaveRequestSubmittedEvent,
  'leave.request.approved':     LeaveRequestApprovedEvent,
  'leave.request.denied':       LeaveRequestDeniedEvent,
  'leave.request.cancelled':    LeaveRequestCancelledEvent,
  'leave.request.completed':    LeaveRequestCompletedEvent,

  // Balance changes
  'leave.balance.updated':      LeaveBalanceUpdatedEvent,
  'leave.balance.low':          LeaveBalanceLowEvent,
  'leave.balance.negative':     LeaveBalanceNegativeEvent,

  // Accruals
  'leave.accrual.processed':    LeaveAccrualProcessedEvent,
  'leave.accrual.failed':       LeaveAccrualFailedEvent,
  'leave.carryover.applied':    LeaveCarryoverAppliedEvent,
  'leave.carryover.expired':    LeaveCarryoverExpiredEvent,

  // Entitlements
  'leave.entitlement.granted':  LeaveEntitlementGrantedEvent,
  'leave.entitlement.adjusted': LeaveEntitlementAdjustedEvent,

  // Compliance
  'leave.fmla.eligibility':     FMLAEligibilityEvent,
  'leave.fmla.exhausted':       FMLAExhaustedEvent,
  'leave.compliance.violation':  ComplianceViolationEvent,

  // Calendar
  'leave.conflict.detected':    LeaveConflictDetectedEvent,
  'leave.blackout.violation':   BlackoutViolationEvent,
} as const;
```

### Integration Points

```
┌──────────────────────────────────────────────────────────────────┐
│                     External Integrations                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  @mcv/people/payroll ◄────── Leave deductions, unpaid leave     │
│  @mcv/people/time    ◄────── Timesheet auto-fill on leave days  │
│  @mcv/people/core    ◄────── Employee data, org structure       │
│  @mcv/ops/scheduling ◄────── Capacity planning, shift coverage  │
│  @mcv/comms/notify   ◄────── Request/approval notifications    │
│  @mcv/comms/calendar ◄────── Google/Outlook calendar sync       │
│  @mcv/docs/storage   ◄────── Medical certificates, documents   │
│  @mcv/analytics      ◄────── Leave dashboards, trend analysis  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### LeaveService

The primary facade for all leave operations. All business rules, validations, and access control checks are enforced here.

```typescript
interface LeaveService {
  // ─── Leave Request Management ──────────────────────────────────
  /**
   * Submit a new leave request.
   * Validates balance availability, blackout dates, and conflict rules
   * before creating the request in PENDING status.
   */
  submitRequest(input: LeaveRequestCreate, ctx: RequestContext): Promise<LeaveRequest>;

  /**
   * Save a draft leave request without submitting for approval.
   * Drafts do not affect balances or trigger approval workflows.
   */
  saveDraft(input: LeaveRequestCreate, ctx: RequestContext): Promise<LeaveRequest>;

  /**
   * Update a pending or draft leave request.
   * Only the requesting employee can update; re-validates all rules.
   */
  updateRequest(id: string, input: LeaveRequestUpdate, ctx: RequestContext): Promise<LeaveRequest>;

  /**
   * Cancel a leave request.
   * Can cancel PENDING, APPROVED, or ACTIVE requests.
   * ACTIVE cancellations may require manager approval.
   */
  cancelRequest(id: string, reason: string, ctx: RequestContext): Promise<LeaveRequest>;

  /**
   * Get a single leave request by ID with full details.
   */
  getRequest(id: string, ctx: RequestContext): Promise<LeaveRequest>;

  /**
   * List leave requests with filtering, sorting, and pagination.
   */
  listRequests(filter: LeaveRequestFilter, ctx: RequestContext): Promise<PaginatedResult<LeaveRequest>>;

  /**
   * Get leave requests for the calling employee.
   */
  getMyRequests(filter: LeaveRequestFilter, ctx: RequestContext): Promise<PaginatedResult<LeaveRequest>>;

  /**
   * Get leave requests pending the caller's approval.
   */
  getPendingApprovals(filter: LeaveRequestFilter, ctx: RequestContext): Promise<PaginatedResult<LeaveRequest>>;

  // ─── Approval Workflow ─────────────────────────────────────────
  /**
   * Approve a leave request. Deducts from balance if fully approved.
   * For multi-level approval, advances to the next approver.
   */
  approveRequest(id: string, comment?: string, ctx?: RequestContext): Promise<LeaveRequest>;

  /**
   * Deny a leave request with a required reason.
   */
  denyRequest(id: string, reason: string, ctx: RequestContext): Promise<LeaveRequest>;

  /**
   * Delegate approval authority to another user for a time period.
   */
  delegateApproval(input: ApprovalDelegateCreate, ctx: RequestContext): Promise<ApprovalDelegate>;

  /**
   * Revoke an approval delegation.
   */
  revokeDelegation(delegationId: string, ctx: RequestContext): Promise<void>;

  /**
   * Get active delegations for the calling user.
   */
  getMyDelegations(ctx: RequestContext): Promise<ApprovalDelegate[]>;

  // ─── Balance Management ────────────────────────────────────────
  /**
   * Get current leave balance for an employee across all leave types.
   */
  getBalance(employeeId: string, ctx: RequestContext): Promise<LeaveBalanceSummary>;

  /**
   * Get detailed balance breakdown for a specific leave type.
   * Includes accrued, used, pending, available, and projected values.
   */
  getBalanceDetail(
    employeeId: string,
    leaveTypeId: string,
    ctx: RequestContext
  ): Promise<LeaveBalanceBreakdown>;

  /**
   * Project future balance at a given date, accounting for
   * scheduled accruals, pending requests, and carryover rules.
   */
  projectBalance(
    employeeId: string,
    leaveTypeId: string,
    asOfDate: Date,
    ctx: RequestContext
  ): Promise<LeaveBalanceProjection>;

  /**
   * Manually adjust an employee's leave balance (admin operation).
   * Requires a reason and creates an audit trail.
   */
  adjustBalance(input: LeaveAdjustmentCreate, ctx: RequestContext): Promise<LeaveAdjustment>;

  /**
   * Get balance adjustment history for an employee.
   */
  getAdjustmentHistory(
    employeeId: string,
    filter?: AdjustmentFilter,
    ctx?: RequestContext
  ): Promise<PaginatedResult<LeaveAdjustment>>;

  // ─── Leave Types ───────────────────────────────────────────────
  /**
   * Create a new leave type for the venture.
   */
  createLeaveType(input: LeaveTypeCreate, ctx: RequestContext): Promise<LeaveType>;

  /**
   * Update an existing leave type.
   * Changes do not retroactively affect existing requests.
   */
  updateLeaveType(id: string, input: LeaveTypeUpdate, ctx: RequestContext): Promise<LeaveType>;

  /**
   * List all leave types available in the venture.
   */
  listLeaveTypes(ctx: RequestContext): Promise<LeaveType[]>;

  /**
   * Get leave types available to a specific employee based on
   * their country, employment type, and policy assignments.
   */
  getAvailableLeaveTypes(employeeId: string, ctx: RequestContext): Promise<LeaveType[]>;

  /**
   * Deactivate a leave type. Existing balances are preserved but
   * no new requests can be submitted against this type.
   */
  deactivateLeaveType(id: string, ctx: RequestContext): Promise<LeaveType>;

  // ─── Leave Policies ────────────────────────────────────────────
  /**
   * Create a new leave policy defining accrual and usage rules.
   */
  createPolicy(input: LeavePolicyCreate, ctx: RequestContext): Promise<LeavePolicy>;

  /**
   * Update a leave policy. Changes take effect from the next accrual period.
   */
  updatePolicy(id: string, input: LeavePolicyUpdate, ctx: RequestContext): Promise<LeavePolicy>;

  /**
   * List all leave policies in the venture.
   */
  listPolicies(ctx: RequestContext): Promise<LeavePolicy[]>;

  /**
   * Assign a leave policy to employees matching given criteria.
   */
  assignPolicy(input: PolicyAssignment, ctx: RequestContext): Promise<void>;

  /**
   * Get the effective policy for a specific employee and leave type.
   */
  getEffectivePolicy(
    employeeId: string,
    leaveTypeId: string,
    ctx: RequestContext
  ): Promise<LeavePolicy>;

  // ─── Holiday Calendars ─────────────────────────────────────────
  /**
   * Create a holiday calendar for a country/region.
   */
  createHolidayCalendar(input: HolidayCalendarCreate, ctx: RequestContext): Promise<HolidayCalendar>;

  /**
   * Add holidays to a calendar.
   */
  addHolidays(calendarId: string, holidays: HolidayCreate[], ctx: RequestContext): Promise<Holiday[]>;

  /**
   * Get holidays for a given year and calendar.
   */
  getHolidays(calendarId: string, year: number, ctx: RequestContext): Promise<Holiday[]>;

  /**
   * Get holidays applicable to a specific employee based on
   * their work location and assigned calendars.
   */
  getEmployeeHolidays(employeeId: string, year: number, ctx: RequestContext): Promise<Holiday[]>;

  /**
   * Import public holidays for a country/year from the holiday data provider.
   */
  importPublicHolidays(
    countryCode: string,
    year: number,
    calendarId: string,
    ctx: RequestContext
  ): Promise<Holiday[]>;

  // ─── Leave Entitlements ────────────────────────────────────────
  /**
   * Define an entitlement rule (tenure-based, grade-based, etc.).
   */
  createEntitlementRule(input: LeaveEntitlementCreate, ctx: RequestContext): Promise<LeaveEntitlement>;

  /**
   * Calculate and grant entitlements for an employee based on
   * their tenure, grade, and applicable rules.
   */
  calculateEntitlements(employeeId: string, year: number, ctx: RequestContext): Promise<LeaveEntitlement[]>;

  /**
   * Get entitlements for an employee in a given year.
   */
  getEntitlements(employeeId: string, year: number, ctx: RequestContext): Promise<LeaveEntitlement[]>;

  /**
   * Pro-rate entitlements for mid-year joins or departures.
   */
  proRateEntitlements(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    ctx: RequestContext
  ): Promise<LeaveEntitlement[]>;

  // ─── Calendar & Scheduling ─────────────────────────────────────
  /**
   * Get team leave calendar for a date range.
   */
  getTeamCalendar(
    managerId: string,
    startDate: Date,
    endDate: Date,
    ctx: RequestContext
  ): Promise<TeamCalendarView>;

  /**
   * Get department leave calendar for a date range.
   */
  getDepartmentCalendar(
    departmentId: string,
    startDate: Date,
    endDate: Date,
    ctx: RequestContext
  ): Promise<DepartmentCalendarView>;

  /**
   * Detect leave conflicts within a team for a proposed request.
   */
  detectConflicts(
    request: LeaveRequestCreate,
    ctx: RequestContext
  ): Promise<ConflictDetectionResult>;

  /**
   * Create a blackout date range during which leave cannot be requested.
   */
  createBlackoutDate(input: BlackoutDateCreate, ctx: RequestContext): Promise<BlackoutDate>;

  /**
   * List blackout dates for the venture.
   */
  listBlackoutDates(ctx: RequestContext): Promise<BlackoutDate[]>;

  // ─── Compliance ────────────────────────────────────────────────
  /**
   * Check FMLA eligibility for an employee.
   */
  checkFMLAEligibility(employeeId: string, ctx: RequestContext): Promise<FMLAEligibility>;

  /**
   * Get FMLA usage tracking for an employee in the rolling 12-month period.
   */
  getFMLAUsage(employeeId: string, ctx: RequestContext): Promise<FMLAUsage>;

  /**
   * Get statutory leave requirements for a jurisdiction.
   */
  getStatutoryRequirements(
    countryCode: string,
    regionCode?: string,
    ctx?: RequestContext
  ): Promise<StatutoryLeaveRequirement[]>;

  /**
   * Upload a supporting document (medical certificate, etc.) for a leave request.
   */
  uploadDocument(
    requestId: string,
    input: LeaveDocumentCreate,
    ctx: RequestContext
  ): Promise<LeaveDocument>;

  /**
   * Get documents attached to a leave request.
   */
  getDocuments(requestId: string, ctx: RequestContext): Promise<LeaveDocument[]>;

  // ─── Reporting ─────────────────────────────────────────────────
  /**
   * Generate a leave utilization report.
   */
  getUtilizationReport(
    filter: ReportFilter,
    ctx: RequestContext
  ): Promise<LeaveUtilizationReport>;

  /**
   * Generate an absence pattern report (identifies concerning patterns).
   */
  getAbsencePatternReport(
    filter: ReportFilter,
    ctx: RequestContext
  ): Promise<AbsencePatternReport>;

  /**
   * Calculate Bradford Factor scores for employees.
   */
  getBradfordFactorReport(
    filter: ReportFilter,
    ctx: RequestContext
  ): Promise<BradfordFactorReport>;

  /**
   * Calculate the cost of absence for the venture.
   */
  getCostOfAbsenceReport(
    filter: ReportFilter,
    ctx: RequestContext
  ): Promise<CostOfAbsenceReport>;

  /**
   * Get department-level leave trends over time.
   */
  getDepartmentTrendReport(
    filter: ReportFilter,
    ctx: RequestContext
  ): Promise<DepartmentTrendReport>;

  // ─── Accrual Processing ────────────────────────────────────────
  /**
   * Run accrual processing for all eligible employees.
   * Typically invoked by cron but can be triggered manually.
   */
  runAccruals(options?: AccrualRunOptions, ctx?: RequestContext): Promise<AccrualRunResult>;

  /**
   * Process year-end carryover for all employees.
   */
  processCarryover(year: number, ctx: RequestContext): Promise<CarryoverResult>;

  /**
   * Get accrual history for an employee.
   */
  getAccrualHistory(
    employeeId: string,
    filter?: AccrualFilter,
    ctx?: RequestContext
  ): Promise<PaginatedResult<LeaveAccrual>>;
}
```

### LeaveRequest

```typescript
interface LeaveRequest {
  /** Unique identifier (UUID v7) */
  id: string;

  /** Venture (tenant) this request belongs to */
  ventureId: string;

  /** Employee submitting the request */
  employeeId: string;

  /** Leave type being requested */
  leaveTypeId: string;

  /** Current status in the lifecycle */
  status: LeaveRequestStatus;

  /** Start date of the leave */
  startDate: Date;

  /** End date of the leave (inclusive) */
  endDate: Date;

  /**
   * Whether start/end are half-days.
   * 'none' = full days, 'start' = first day is half,
   * 'end' = last day is half, 'both' = both are half
   */
  halfDay: 'none' | 'start' | 'end' | 'both';

  /** Total working days requested (excludes weekends, holidays) */
  totalDays: number;

  /** Total working hours (for hourly leave types) */
  totalHours: number | null;

  /** Reason provided by the employee */
  reason: string;

  /** Whether emergency/unplanned (e.g., sick leave same day) */
  isEmergency: boolean;

  /** Current approver in the chain */
  currentApproverId: string | null;

  /** Approval chain progression */
  approvalChain: ApprovalChainEntry[];

  /** Attached documents (medical certs, etc.) */
  documents: LeaveDocument[];

  /** Linked FMLA tracking record if applicable */
  fmlaTrackingId: string | null;

  /** Contact information while on leave */
  emergencyContact: {
    name: string;
    phone: string;
    email: string;
  } | null;

  /** Delegate who handles responsibilities during absence */
  delegateId: string | null;

  /** Additional metadata */
  metadata: Record<string, unknown>;

  /** Timestamps */
  submittedAt: Date | null;
  approvedAt: Date | null;
  deniedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type LeaveRequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'denied'
  | 'cancelled'
  | 'active'
  | 'completed'
  | 'cancel_pending';

interface LeaveRequestCreate {
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  halfDay?: 'none' | 'start' | 'end' | 'both';
  reason: string;
  isEmergency?: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    email: string;
  };
  delegateId?: string;
  metadata?: Record<string, unknown>;
}

interface LeaveRequestUpdate {
  startDate?: Date;
  endDate?: Date;
  halfDay?: 'none' | 'start' | 'end' | 'both';
  reason?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    email: string;
  };
  delegateId?: string;
}

interface LeaveRequestFilter {
  employeeId?: string;
  leaveTypeId?: string;
  status?: LeaveRequestStatus | LeaveRequestStatus[];
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  departmentId?: string;
  managerId?: string;
  isEmergency?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'startDate' | 'submittedAt' | 'status' | 'totalDays';
  sortOrder?: 'asc' | 'desc';
}
```

### LeaveType

```typescript
interface LeaveType {
  /** Unique identifier */
  id: string;

  /** Venture this type belongs to */
  ventureId: string;

  /** Human-readable name (e.g., "Annual Vacation") */
  name: string;

  /** Unique code within the venture (e.g., "VACATION", "SICK") */
  code: string;

  /** Description of the leave type */
  description: string;

  /** Category for grouping and reporting */
  category: LeaveTypeCategory;

  /** Color for calendar display (hex) */
  color: string;

  /** Icon identifier for UI */
  icon: string;

  /** Whether this is a paid leave type */
  isPaid: boolean;

  /** Whether a reason is required when requesting */
  requiresReason: boolean;

  /** Whether supporting documentation is required */
  requiresDocumentation: boolean;

  /** Minimum documentation threshold (e.g., sick > 3 days needs a note) */
  documentationThresholdDays: number | null;

  /** Whether this type allows negative balances */
  allowNegativeBalance: boolean;

  /** Maximum negative balance allowed (days) */
  maxNegativeBalance: number | null;

  /** Whether half-day requests are allowed */
  allowHalfDay: boolean;

  /** Whether hourly requests are allowed */
  allowHourly: boolean;

  /** Minimum request duration (days or hours) */
  minDuration: number;

  /** Maximum request duration (days or hours) */
  maxDuration: number | null;

  /** Minimum advance notice required (days) */
  minNoticeDays: number;

  /** Whether this leave counts toward FMLA */
  fmlaEligible: boolean;

  /** Country codes where this leave type applies (empty = all) */
  applicableCountries: string[];

  /** Employment types this applies to (empty = all) */
  applicableEmploymentTypes: string[];

  /** Gender restrictions if any (e.g., maternity leave) */
  genderRestriction: 'male' | 'female' | 'any';

  /** Whether this type is currently active */
  isActive: boolean;

  /** Display order in UI */
  sortOrder: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type LeaveTypeCategory =
  | 'vacation'
  | 'sick'
  | 'personal'
  | 'parental'
  | 'bereavement'
  | 'jury_duty'
  | 'military'
  | 'sabbatical'
  | 'religious'
  | 'study'
  | 'compensatory'
  | 'unpaid'
  | 'other';

interface LeaveTypeCreate {
  name: string;
  code: string;
  description?: string;
  category: LeaveTypeCategory;
  color?: string;
  icon?: string;
  isPaid?: boolean;
  requiresReason?: boolean;
  requiresDocumentation?: boolean;
  documentationThresholdDays?: number;
  allowNegativeBalance?: boolean;
  maxNegativeBalance?: number;
  allowHalfDay?: boolean;
  allowHourly?: boolean;
  minDuration?: number;
  maxDuration?: number;
  minNoticeDays?: number;
  fmlaEligible?: boolean;
  applicableCountries?: string[];
  applicableEmploymentTypes?: string[];
  genderRestriction?: 'male' | 'female' | 'any';
  sortOrder?: number;
}

interface LeaveTypeUpdate extends Partial<Omit<LeaveTypeCreate, 'code'>> {}
```

### LeavePolicy

```typescript
interface LeavePolicy {
  /** Unique identifier */
  id: string;

  /** Venture this policy belongs to */
  ventureId: string;

  /** Human-readable policy name */
  name: string;

  /** Policy description */
  description: string;

  /** Leave type this policy governs */
  leaveTypeId: string;

  /** How leave is accrued */
  accrualMethod: LeaveTypeAccrualMethod;

  /** Accrual schedule details */
  accrualSchedule: AccrualSchedule;

  /** Annual entitlement in days (base amount before tenure adjustments) */
  annualEntitlementDays: number;

  /** How many days can carry over to the next year */
  carryoverRule: CarryoverRule;

  /** Waiting/probation period before accrual starts (days) */
  waitingPeriodDays: number;

  /** Whether new hires get pro-rated entitlement */
  proRateForNewHires: boolean;

  /** Pro-ration method */
  proRationMethod: 'calendar_days' | 'working_days' | 'monthly';

  /** Maximum balance cap (prevents excessive accumulation) */
  maxBalanceDays: number | null;

  /** Whether this policy allows negative balances */
  allowNegativeBalance: boolean;

  /** Maximum negative balance allowed */
  maxNegativeBalanceDays: number | null;

  /** Encashment allowed (can be paid out instead of taken) */
  allowEncashment: boolean;

  /** Maximum days that can be encashed per year */
  maxEncashmentDays: number | null;

  /** Tenure-based entitlement tiers */
  tenureTiers: TenureTier[];

  /** Whether this is the default policy for new assignments */
  isDefault: boolean;

  /** Countries where this policy applies */
  applicableCountries: string[];

  /** Whether this policy is currently active */
  isActive: boolean;

  /** Effective from date */
  effectiveFrom: Date;

  /** Effective until date (null = indefinite) */
  effectiveUntil: Date | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type LeaveTypeAccrualMethod =
  | 'annual_grant'      // Full amount granted at start of year
  | 'monthly'           // Fixed amount each month
  | 'bi_weekly'         // Fixed amount every two weeks
  | 'per_pay_period'    // Accrued each pay period
  | 'hourly'            // Accrued per hour worked
  | 'none';             // No accrual (fixed entitlement, e.g., bereavement)

interface AccrualSchedule {
  /** Frequency of accrual processing */
  frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'annual';

  /** Day of month for monthly accrual (1-28) */
  dayOfMonth?: number;

  /** Day of week for weekly accrual (0=Sunday, 6=Saturday) */
  dayOfWeek?: number;

  /** Month for annual grant (1-12) */
  grantMonth?: number;

  /** Day of month for annual grant */
  grantDayOfMonth?: number;

  /** Per-period accrual amount (hours or days depending on method) */
  amountPerPeriod: number;

  /** Unit of the accrual amount */
  unit: 'days' | 'hours';

  /** Whether partial periods are accrued (e.g., if hired mid-month) */
  accruePartialPeriods: boolean;

  /** Rounding rule for partial period calculations */
  roundingRule: 'none' | 'round_up' | 'round_down' | 'nearest_half' | 'nearest_quarter';
}

interface CarryoverRule {
  /** Type of carryover policy */
  type: 'unlimited' | 'capped' | 'use_it_or_lose_it' | 'partial_with_expiry';

  /** Maximum days that can carry over (for 'capped' and 'partial_with_expiry') */
  maxDays?: number;

  /** Number of months after which carryover expires (for 'partial_with_expiry') */
  expiryMonths?: number;

  /** Date by which carryover must be used (month-day, e.g., "03-31") */
  useByDate?: string;

  /** Whether to auto-process carryover at year-end */
  autoProcess: boolean;

  /** Which year-end to use (calendar year, fiscal year, hire anniversary) */
  yearEndBasis: 'calendar' | 'fiscal' | 'hire_anniversary';
}

interface TenureTier {
  /** Minimum years of service for this tier */
  minYears: number;

  /** Maximum years of service (null = no upper limit) */
  maxYears: number | null;

  /** Additional days granted at this tier */
  additionalDays: number;

  /** Total days at this tier (alternative to additionalDays) */
  totalDays?: number;
}

interface LeavePolicyCreate {
  name: string;
  description?: string;
  leaveTypeId: string;
  accrualMethod: LeaveTypeAccrualMethod;
  accrualSchedule: AccrualSchedule;
  annualEntitlementDays: number;
  carryoverRule: CarryoverRule;
  waitingPeriodDays?: number;
  proRateForNewHires?: boolean;
  proRationMethod?: 'calendar_days' | 'working_days' | 'monthly';
  maxBalanceDays?: number;
  allowNegativeBalance?: boolean;
  maxNegativeBalanceDays?: number;
  allowEncashment?: boolean;
  maxEncashmentDays?: number;
  tenureTiers?: TenureTier[];
  isDefault?: boolean;
  applicableCountries?: string[];
  effectiveFrom?: Date;
  effectiveUntil?: Date;
}

interface LeavePolicyUpdate extends Partial<LeavePolicyCreate> {}
```

### LeaveBalance

```typescript
interface LeaveBalance {
  /** Unique identifier */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Employee ID */
  employeeId: string;

  /** Leave type ID */
  leaveTypeId: string;

  /** Calendar year this balance applies to */
  year: number;

  /** Days carried over from previous year */
  carriedOver: number;

  /** Days accrued in current year so far */
  accrued: number;

  /** Manual adjustments (positive or negative) */
  adjustments: number;

  /** Days used (approved and taken) */
  used: number;

  /** Days pending approval */
  pending: number;

  /** Days encashed */
  encashed: number;

  /** Current available balance (carried + accrued + adjustments - used - pending - encashed) */
  available: number;

  /** Last accrual date */
  lastAccrualDate: Date | null;

  /** Last updated timestamp */
  updatedAt: Date;
}

interface LeaveBalanceSummary {
  /** Employee ID */
  employeeId: string;

  /** Year */
  year: number;

  /** Balances by leave type */
  balances: {
    leaveType: LeaveType;
    balance: LeaveBalance;
  }[];

  /** Total available days across all types */
  totalAvailable: number;

  /** Total used days across all types */
  totalUsed: number;

  /** Total pending days across all types */
  totalPending: number;

  /** Last updated timestamp */
  asOf: Date;
}

interface LeaveBalanceBreakdown {
  /** Core balance record */
  balance: LeaveBalance;

  /** Detailed transaction history */
  transactions: LeaveBalanceTransaction[];

  /** Upcoming scheduled accruals */
  scheduledAccruals: ScheduledAccrual[];

  /** Carryover details */
  carryover: {
    carriedFromPreviousYear: number;
    expiresOn: Date | null;
    remainingCarryover: number;
  } | null;

  /** Encashment details */
  encashment: {
    encashedDays: number;
    maxEncashable: number;
    encashmentValue: number;
  } | null;
}

interface LeaveBalanceProjection {
  /** Projected balance at the target date */
  projectedBalance: number;

  /** Current balance */
  currentBalance: number;

  /** Expected accruals between now and target date */
  expectedAccruals: number;

  /** Approved leaves between now and target date */
  scheduledLeaves: number;

  /** Pending leaves between now and target date */
  pendingLeaves: number;

  /** Carryover expiry impact (if applicable) */
  carryoverExpiry: number;

  /** Target date */
  asOfDate: Date;

  /** Calculation details */
  details: ProjectionDetail[];
}

interface LeaveBalanceTransaction {
  /** Transaction date */
  date: Date;

  /** Type of transaction */
  type: 'accrual' | 'used' | 'adjustment' | 'carryover' | 'carryover_expiry' | 'encashment' | 'reversal';

  /** Amount (positive = credit, negative = debit) */
  amount: number;

  /** Running balance after this transaction */
  runningBalance: number;

  /** Description */
  description: string;

  /** Reference (leave request ID, accrual run ID, etc.) */
  referenceId: string | null;

  /** Reference type */
  referenceType: 'leave_request' | 'accrual_run' | 'adjustment' | 'carryover' | null;
}

interface ScheduledAccrual {
  /** Scheduled date */
  date: Date;

  /** Amount to be accrued */
  amount: number;

  /** Leave type */
  leaveTypeId: string;

  /** Status (whether it has been processed) */
  status: 'scheduled' | 'processed' | 'skipped';
}

interface ProjectionDetail {
  /** Date of the projected event */
  date: Date;

  /** Type of event */
  type: 'accrual' | 'leave' | 'carryover_expiry';

  /** Amount */
  amount: number;

  /** Running projected balance */
  projectedBalance: number;

  /** Description */
  description: string;
}
```

### HolidayCalendar

```typescript
interface HolidayCalendar {
  /** Unique identifier */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Calendar name (e.g., "Canada - Ontario", "US - Federal") */
  name: string;

  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string;

  /** Region/state/province code */
  regionCode: string | null;

  /** Description */
  description: string;

  /** Whether this is the default calendar for the country */
  isDefault: boolean;

  /** Whether this calendar is active */
  isActive: boolean;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface Holiday {
  /** Unique identifier */
  id: string;

  /** Calendar this holiday belongs to */
  calendarId: string;

  /** Holiday name */
  name: string;

  /** Date of the holiday */
  date: Date;

  /** Observed date (if different, e.g., when holiday falls on weekend) */
  observedDate: Date | null;

  /** Type of holiday */
  type: HolidayType;

  /** Whether this is a full day or half day */
  isHalfDay: boolean;

  /** Whether this holiday is optional/floating */
  isOptional: boolean;

  /** Whether this is a recurring annual holiday */
  isRecurring: boolean;

  /** Description / notes */
  description: string | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type HolidayType =
  | 'public'        // Government-mandated public holiday
  | 'company'       // Company-specific holiday
  | 'floating'      // Employee-chosen floating holiday
  | 'religious'     // Religious observance
  | 'cultural'      // Cultural celebration
  | 'restricted';   // Restricted holiday (choose from a list)

interface HolidayCalendarCreate {
  name: string;
  countryCode: string;
  regionCode?: string;
  description?: string;
  isDefault?: boolean;
}

interface HolidayCreate {
  name: string;
  date: Date;
  observedDate?: Date;
  type: HolidayType;
  isHalfDay?: boolean;
  isOptional?: boolean;
  isRecurring?: boolean;
  description?: string;
}
```

### LeaveEntitlement

```typescript
interface LeaveEntitlement {
  /** Unique identifier */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Employee ID (null if this is a rule template) */
  employeeId: string | null;

  /** Leave type ID */
  leaveTypeId: string;

  /** Year this entitlement applies to */
  year: number;

  /** Basis for the entitlement */
  basis: EntitlementBasis;

  /** Total entitled days */
  entitledDays: number;

  /** Pro-rated days (if applicable) */
  proRatedDays: number | null;

  /** Whether this has been granted (credited to balance) */
  isGranted: boolean;

  /** Date the entitlement was granted */
  grantedAt: Date | null;

  /** Expiry date for this entitlement */
  expiresAt: Date | null;

  /** Notes */
  notes: string | null;

  /** The rule that generated this entitlement */
  ruleId: string | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type EntitlementBasis =
  | 'policy_default'    // From leave policy base entitlement
  | 'tenure'            // Tenure-based additional days
  | 'grade'             // Job grade/level based
  | 'custom'            // Manually assigned
  | 'compensatory'      // Earned from overtime/work on holidays
  | 'statutory'         // Legal minimum requirement
  | 'contractual';      // Per employment contract

interface LeaveEntitlementRule {
  /** Unique identifier */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Leave type this rule applies to */
  leaveTypeId: string;

  /** Rule name */
  name: string;

  /** Basis for entitlement calculation */
  basis: EntitlementBasis;

  /** Criteria for matching employees */
  criteria: EntitlementCriteria;

  /** Days to grant */
  days: number;

  /** Whether this adds to or replaces the base entitlement */
  mode: 'additive' | 'replacement';

  /** Priority (higher priority rules take precedence for 'replacement' mode) */
  priority: number;

  /** Whether this rule is active */
  isActive: boolean;
}

interface EntitlementCriteria {
  /** Minimum tenure in years */
  minTenureYears?: number;

  /** Maximum tenure in years */
  maxTenureYears?: number;

  /** Job grade/level codes */
  grades?: string[];

  /** Department IDs */
  departments?: string[];

  /** Country codes */
  countries?: string[];

  /** Employment types */
  employmentTypes?: string[];

  /** Custom criteria as JSON */
  custom?: Record<string, unknown>;
}

interface LeaveEntitlementCreate {
  employeeId?: string;
  leaveTypeId: string;
  year: number;
  basis: EntitlementBasis;
  entitledDays: number;
  expiresAt?: Date;
  notes?: string;
}
```

### LeaveReport

```typescript
interface LeaveReport {
  /** Report type */
  type: string;

  /** Date range */
  period: {
    startDate: Date;
    endDate: Date;
  };

  /** Venture ID */
  ventureId: string;

  /** Generated at timestamp */
  generatedAt: Date;

  /** Filters applied */
  filters: Record<string, unknown>;
}

interface LeaveUtilizationReport extends LeaveReport {
  type: 'utilization';

  /** Overall utilization metrics */
  summary: {
    totalEmployees: number;
    totalEntitledDays: number;
    totalUsedDays: number;
    totalPendingDays: number;
    totalRemainingDays: number;
    utilizationRate: number;       // percentage
    averageDaysUsed: number;
    medianDaysUsed: number;
  };

  /** Breakdown by leave type */
  byLeaveType: {
    leaveType: LeaveType;
    totalEntitled: number;
    totalUsed: number;
    totalPending: number;
    totalRemaining: number;
    utilizationRate: number;
  }[];

  /** Breakdown by department */
  byDepartment: {
    departmentId: string;
    departmentName: string;
    employeeCount: number;
    totalUsed: number;
    averageUsed: number;
    utilizationRate: number;
  }[];

  /** Monthly trend */
  monthlyTrend: {
    month: string;               // YYYY-MM
    daysUsed: number;
    requestCount: number;
  }[];
}

interface AbsencePatternReport extends LeaveReport {
  type: 'absence_pattern';

  /** Employees with concerning patterns */
  flaggedPatterns: {
    employeeId: string;
    employeeName: string;
    departmentName: string;
    pattern: string;             // Description of the pattern
    severity: 'low' | 'medium' | 'high';
    occurrences: number;
    details: {
      dates: Date[];
      dayOfWeek: string;
      description: string;
    }[];
  }[];

  /** Day-of-week distribution */
  dayOfWeekDistribution: {
    dayOfWeek: string;
    count: number;
    percentage: number;
  }[];

  /** Month distribution */
  monthDistribution: {
    month: string;
    count: number;
    percentage: number;
  }[];

  /** Patterns around holidays/weekends */
  extensionPatterns: {
    type: 'pre_weekend' | 'post_weekend' | 'pre_holiday' | 'post_holiday' | 'bridge';
    count: number;
    percentage: number;
    employees: { employeeId: string; employeeName: string; count: number }[];
  }[];
}

interface BradfordFactorReport extends LeaveReport {
  type: 'bradford_factor';

  /** Explanation of Bradford Factor scoring */
  methodology: string;

  /** Thresholds used for scoring */
  thresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };

  /** Employee Bradford Factor scores */
  scores: {
    employeeId: string;
    employeeName: string;
    departmentName: string;
    spellCount: number;           // S = number of absence spells
    totalDays: number;            // D = total days absent
    bradfordFactor: number;       // B = S² × D
    rating: 'low' | 'medium' | 'high' | 'critical';
    spells: {
      startDate: Date;
      endDate: Date;
      days: number;
      leaveType: string;
    }[];
  }[];

  /** Summary statistics */
  summary: {
    averageBradfordFactor: number;
    medianBradfordFactor: number;
    employeesAboveThreshold: {
      medium: number;
      high: number;
      critical: number;
    };
  };
}

interface CostOfAbsenceReport extends LeaveReport {
  type: 'cost_of_absence';

  /** Total cost metrics */
  summary: {
    totalCost: number;
    totalDaysAbsent: number;
    averageDailyCost: number;
    costPerEmployee: number;
    currency: string;
  };

  /** Cost by leave type */
  byLeaveType: {
    leaveType: LeaveType;
    days: number;
    cost: number;
    percentage: number;
  }[];

  /** Cost by department */
  byDepartment: {
    departmentId: string;
    departmentName: string;
    days: number;
    cost: number;
    employeeCount: number;
    costPerEmployee: number;
  }[];

  /** Monthly cost trend */
  monthlyTrend: {
    month: string;
    days: number;
    cost: number;
  }[];
}

interface DepartmentTrendReport extends LeaveReport {
  type: 'department_trend';

  /** Trends by department over time */
  departments: {
    departmentId: string;
    departmentName: string;
    headcount: number;

    /** Monthly data points */
    monthly: {
      month: string;
      daysUsed: number;
      requestCount: number;
      averageDaysPerEmployee: number;
      utilizationRate: number;
      topLeaveTypes: {
        leaveType: string;
        days: number;
      }[];
    }[];

    /** Year-over-year comparison */
    yearOverYear: {
      currentYear: number;
      previousYear: number;
      changePercent: number;
    };
  }[];
}

interface ReportFilter {
  startDate: Date;
  endDate: Date;
  departmentId?: string;
  departmentIds?: string[];
  leaveTypeId?: string;
  leaveTypeIds?: string[];
  employeeIds?: string[];
  managerId?: string;
  countryCode?: string;
  includeInactive?: boolean;
}
```

### LeaveApproval

```typescript
interface LeaveApproval {
  /** Unique identifier */
  id: string;

  /** Leave request this approval is for */
  leaveRequestId: string;

  /** Approver employee ID */
  approverId: string;

  /** Level in the approval chain (1 = first approver) */
  level: number;

  /** Action taken */
  action: ApprovalAction;

  /** Comment from approver */
  comment: string | null;

  /** Whether this approval was done by a delegate */
  isDelegated: boolean;

  /** If delegated, the original approver ID */
  delegatedFromId: string | null;

  /** Timestamp of the action */
  actionAt: Date;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type ApprovalAction = 'pending' | 'approved' | 'denied' | 'escalated' | 'delegated';

interface ApprovalChain {
  /** Leave request ID */
  leaveRequestId: string;

  /** Ordered list of approvers */
  levels: ApprovalChainLevel[];

  /** Current level awaiting action */
  currentLevel: number;

  /** Whether the chain is complete */
  isComplete: boolean;

  /** Final outcome */
  outcome: 'pending' | 'approved' | 'denied' | null;
}

interface ApprovalChainLevel {
  /** Level number (1-based) */
  level: number;

  /** Approver employee ID */
  approverId: string;

  /** Approver name */
  approverName: string;

  /** Status of this level */
  status: ApprovalAction;

  /** Comment if action taken */
  comment: string | null;

  /** Timestamp of action */
  actionAt: Date | null;

  /** Whether this was a delegated action */
  isDelegated: boolean;
}

interface ApprovalDelegate {
  /** Unique identifier */
  id: string;

  /** Delegator (the person delegating their approval authority) */
  delegatorId: string;

  /** Delegate (the person receiving approval authority) */
  delegateId: string;

  /** Start date of delegation */
  startDate: Date;

  /** End date of delegation */
  endDate: Date;

  /** Reason for delegation */
  reason: string;

  /** Whether this delegation is currently active */
  isActive: boolean;

  /** Leave types this delegation applies to (empty = all) */
  leaveTypeIds: string[];

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface ApprovalDelegateCreate {
  delegateId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  leaveTypeIds?: string[];
}
```

### LeaveAccrual

```typescript
interface LeaveAccrual {
  /** Unique identifier */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Employee ID */
  employeeId: string;

  /** Leave type ID */
  leaveTypeId: string;

  /** Leave policy ID */
  policyId: string;

  /** Accrual run ID (batch reference) */
  accrualRunId: string;

  /** Period start date */
  periodStart: Date;

  /** Period end date */
  periodEnd: Date;

  /** Amount accrued */
  amount: number;

  /** Unit (days or hours) */
  unit: 'days' | 'hours';

  /** Balance before accrual */
  balanceBefore: number;

  /** Balance after accrual */
  balanceAfter: number;

  /** Whether a cap was applied */
  capApplied: boolean;

  /** Amount lost to cap */
  capLoss: number;

  /** Notes */
  notes: string | null;

  /** Timestamps */
  createdAt: Date;
}

interface AccrualRun {
  /** Unique identifier */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Run timestamp */
  runAt: Date;

  /** Trigger type */
  trigger: 'scheduled' | 'manual' | 'event';

  /** Period being processed */
  periodStart: Date;
  periodEnd: Date;

  /** Run status */
  status: 'running' | 'completed' | 'failed' | 'partial';

  /** Counts */
  employeesProcessed: number;
  employeesSkipped: number;
  employeesFailed: number;

  /** Total amount accrued across all employees */
  totalAccrued: number;

  /** Error details if any */
  errors: AccrualError[];

  /** Duration in milliseconds */
  durationMs: number;

  /** Timestamps */
  createdAt: Date;
  completedAt: Date | null;
}

interface AccrualRunResult {
  /** The accrual run record */
  run: AccrualRun;

  /** Summary of results */
  summary: {
    totalEmployees: number;
    processed: number;
    skipped: number;
    failed: number;
    totalDaysAccrued: number;
    totalHoursAccrued: number;
    capsApplied: number;
  };

  /** Per-employee results (for review) */
  details: AccrualDetail[];
}

interface AccrualDetail {
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  amount: number;
  unit: 'days' | 'hours';
  balanceBefore: number;
  balanceAfter: number;
  capApplied: boolean;
  capLoss: number;
  status: 'success' | 'skipped' | 'failed';
  reason?: string;
}

interface AccrualError {
  employeeId: string;
  leaveTypeId: string;
  error: string;
  stack?: string;
}

interface AccrualRunOptions {
  /** Process only specific employees */
  employeeIds?: string[];

  /** Process only specific leave types */
  leaveTypeIds?: string[];

  /** Override the period (default: current period based on schedule) */
  periodStart?: Date;
  periodEnd?: Date;

  /** Dry run mode (calculate but don't apply) */
  dryRun?: boolean;

  /** Force processing even if already processed for this period */
  force?: boolean;
}

interface AccrualFilter {
  leaveTypeId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  page?: number;
  pageSize?: number;
}

interface CarryoverResult {
  /** Year processed */
  year: number;

  /** Counts */
  employeesProcessed: number;

  /** Total days carried over */
  totalCarriedOver: number;

  /** Total days forfeited */
  totalForfeited: number;

  /** Per-employee details */
  details: {
    employeeId: string;
    employeeName: string;
    leaveTypeName: string;
    previousBalance: number;
    carriedOver: number;
    forfeited: number;
    carryoverExpiry: Date | null;
  }[];
}
```

### Additional Supporting Types

```typescript
interface LeaveAdjustment {
  /** Unique identifier */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Employee ID */
  employeeId: string;

  /** Leave type ID */
  leaveTypeId: string;

  /** Amount (positive = credit, negative = debit) */
  amount: number;

  /** Unit */
  unit: 'days' | 'hours';

  /** Reason for adjustment */
  reason: AdjustmentReason;

  /** Detailed notes */
  notes: string;

  /** Who made the adjustment */
  adjustedBy: string;

  /** Balance before adjustment */
  balanceBefore: number;

  /** Balance after adjustment */
  balanceAfter: number;

  /** Effective date of adjustment */
  effectiveDate: Date;

  /** Timestamps */
  createdAt: Date;
}

type AdjustmentReason =
  | 'correction'           // Fix a previous error
  | 'policy_change'        // Leave policy was updated
  | 'manual_grant'         // Admin grant of additional leave
  | 'compensatory'         // Compensatory time off earned
  | 'disciplinary'         // Leave deducted as disciplinary action
  | 'encashment_reversal'  // Reversal of a previous encashment
  | 'transfer'             // Leave transferred between types
  | 'other';

interface LeaveAdjustmentCreate {
  employeeId: string;
  leaveTypeId: string;
  amount: number;
  unit?: 'days' | 'hours';
  reason: AdjustmentReason;
  notes: string;
  effectiveDate?: Date;
}

interface LeaveDocument {
  /** Unique identifier */
  id: string;

  /** Leave request this document is for */
  leaveRequestId: string;

  /** Document type */
  type: DocumentType;

  /** Original filename */
  filename: string;

  /** MIME type */
  mimeType: string;

  /** File size in bytes */
  sizeBytes: number;

  /** Storage path (Supabase Storage) */
  storagePath: string;

  /** Uploaded by */
  uploadedBy: string;

  /** Timestamps */
  createdAt: Date;
}

type DocumentType =
  | 'medical_certificate'
  | 'doctor_note'
  | 'hospital_record'
  | 'birth_certificate'
  | 'death_certificate'
  | 'court_summons'
  | 'military_orders'
  | 'adoption_papers'
  | 'marriage_certificate'
  | 'other';

interface LeaveDocumentCreate {
  type: DocumentType;
  filename: string;
  mimeType: string;
  data: Buffer | Uint8Array;
}

interface LeaveCalendarEntry {
  /** Leave request ID */
  requestId: string;

  /** Employee ID */
  employeeId: string;

  /** Employee name */
  employeeName: string;

  /** Leave type */
  leaveType: {
    id: string;
    name: string;
    color: string;
    category: LeaveTypeCategory;
  };

  /** Start date */
  startDate: Date;

  /** End date */
  endDate: Date;

  /** Status */
  status: LeaveRequestStatus;

  /** Half-day indicator */
  halfDay: 'none' | 'start' | 'end' | 'both';

  /** Total days */
  totalDays: number;
}

interface TeamCalendarView {
  /** Manager ID */
  managerId: string;

  /** Date range */
  startDate: Date;
  endDate: Date;

  /** Team members */
  members: {
    employeeId: string;
    employeeName: string;
    role: string;
  }[];

  /** Leave entries for the team */
  entries: LeaveCalendarEntry[];

  /** Holidays in the range */
  holidays: Holiday[];

  /** Blackout dates in the range */
  blackoutDates: BlackoutDate[];
}

interface DepartmentCalendarView extends TeamCalendarView {
  /** Department ID */
  departmentId: string;

  /** Department name */
  departmentName: string;

  /** Coverage percentage by day */
  dailyCoverage: {
    date: Date;
    totalMembers: number;
    presentMembers: number;
    coveragePercent: number;
    belowMinimum: boolean;
  }[];
}

interface ConflictDetectionResult {
  /** Whether there are conflicts */
  hasConflicts: boolean;

  /** Severity of the conflict */
  severity: 'none' | 'warning' | 'critical';

  /** Conflicts found */
  conflicts: {
    type: 'team_overlap' | 'blackout' | 'minimum_coverage' | 'same_role';
    description: string;
    severity: 'warning' | 'critical';
    overlappingRequests?: LeaveCalendarEntry[];
    blackoutDate?: BlackoutDate;
    coverageDetails?: {
      minimumRequired: number;
      currentAvailable: number;
      afterApproval: number;
    };
  }[];

  /** Whether the request should be auto-blocked */
  shouldBlock: boolean;
}

interface BlackoutDate {
  /** Unique identifier */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Name/reason for the blackout */
  name: string;

  /** Start date */
  startDate: Date;

  /** End date */
  endDate: Date;

  /** Departments affected (empty = all) */
  departmentIds: string[];

  /** Leave types blocked (empty = all) */
  leaveTypeIds: string[];

  /** Whether exceptions can be granted */
  allowExceptions: boolean;

  /** Description */
  description: string | null;

  /** Who created this */
  createdBy: string;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface BlackoutDateCreate {
  name: string;
  startDate: Date;
  endDate: Date;
  departmentIds?: string[];
  leaveTypeIds?: string[];
  allowExceptions?: boolean;
  description?: string;
}

// ─── FMLA Compliance Types ──────────────────────────────────────

interface FMLATracking {
  /** Unique identifier */
  id: string;

  /** Employee ID */
  employeeId: string;

  /** FMLA reason */
  reason: FMLAReason;

  /** Start of the 12-month measurement period */
  measurementPeriodStart: Date;

  /** End of the 12-month measurement period */
  measurementPeriodEnd: Date;

  /** Total FMLA entitlement (typically 12 weeks = 60 days) */
  totalEntitlementWeeks: number;

  /** Weeks used in the current measurement period */
  weeksUsed: number;

  /** Weeks remaining */
  weeksRemaining: number;

  /** Whether on intermittent FMLA */
  isIntermittent: boolean;

  /** Certification status */
  certificationStatus: 'pending' | 'received' | 'approved' | 'denied' | 'expired';

  /** Certification expiry date */
  certificationExpiryDate: Date | null;

  /** Linked leave request IDs */
  leaveRequestIds: string[];

  /** Status */
  status: 'active' | 'exhausted' | 'expired' | 'closed';

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type FMLAReason =
  | 'serious_health_condition'      // Employee's own condition
  | 'family_care'                    // Care for family member
  | 'birth_bonding'                  // Birth and bonding with newborn
  | 'adoption_foster'               // Placement of child for adoption/foster
  | 'qualifying_exigency'           // Military qualifying exigency
  | 'military_caregiver';           // Care for injured service member

interface FMLAEligibility {
  /** Employee ID */
  employeeId: string;

  /** Whether the employee is eligible */
  isEligible: boolean;

  /** Reasons for ineligibility (if not eligible) */
  ineligibilityReasons: string[];

  /** Eligibility criteria */
  criteria: {
    /** Employed for at least 12 months */
    twelveMonthsEmployed: boolean;
    monthsEmployed: number;

    /** Worked at least 1,250 hours in the past 12 months */
    hoursRequirementMet: boolean;
    hoursWorked: number;

    /** Works at a location with 50+ employees within 75 miles */
    locationRequirementMet: boolean;
    employeesAtLocation: number;
  };

  /** Remaining FMLA entitlement */
  remainingWeeks: number;

  /** Current measurement period */
  measurementPeriod: {
    start: Date;
    end: Date;
    method: 'calendar_year' | 'fixed_year' | 'rolling_forward' | 'rolling_backward';
  };
}

interface FMLAUsage {
  /** Employee ID */
  employeeId: string;

  /** Measurement period */
  measurementPeriod: {
    start: Date;
    end: Date;
  };

  /** Total entitlement */
  totalWeeks: number;

  /** Used weeks */
  usedWeeks: number;

  /** Remaining weeks */
  remainingWeeks: number;

  /** Usage breakdown */
  usage: {
    leaveRequestId: string;
    reason: FMLAReason;
    startDate: Date;
    endDate: Date;
    weeksUsed: number;
    isIntermittent: boolean;
  }[];
}

interface StatutoryLeaveRequirement {
  /** Country code */
  countryCode: string;

  /** Region code (if region-specific) */
  regionCode: string | null;

  /** Leave type category */
  category: LeaveTypeCategory;

  /** Statutory name */
  name: string;

  /** Minimum entitlement (days per year) */
  minimumDays: number;

  /** Whether the minimum is in calendar days or working days */
  daysType: 'calendar' | 'working';

  /** Eligibility criteria */
  eligibility: string;

  /** Whether employer must pay during this leave */
  isPaid: boolean;

  /** Pay rate (percentage of salary) */
  payRate: number | null;

  /** Maximum duration */
  maxDuration: string | null;

  /** Legal reference */
  legalReference: string;

  /** Additional notes */
  notes: string | null;
}
```

---

## Database Schemas

### leave_types

```typescript
import { pgTable, uuid, text, boolean, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const leaveTypes = pgTable('leave_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description').default(''),
  category: text('category').notNull(), // LeaveTypeCategory enum
  color: text('color').default('#4A90D9'),
  icon: text('icon').default('calendar'),
  isPaid: boolean('is_paid').default(true),
  requiresReason: boolean('requires_reason').default(false),
  requiresDocumentation: boolean('requires_documentation').default(false),
  documentationThresholdDays: integer('documentation_threshold_days'),
  allowNegativeBalance: boolean('allow_negative_balance').default(false),
  maxNegativeBalance: integer('max_negative_balance'),
  allowHalfDay: boolean('allow_half_day').default(true),
  allowHourly: boolean('allow_hourly').default(false),
  minDuration: integer('min_duration').default(1),
  maxDuration: integer('max_duration'),
  minNoticeDays: integer('min_notice_days').default(0),
  fmlaEligible: boolean('fmla_eligible').default(false),
  applicableCountries: jsonb('applicable_countries').default([]),
  applicableEmploymentTypes: jsonb('applicable_employment_types').default([]),
  genderRestriction: text('gender_restriction').default('any'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureCodeUnique: uniqueIndex('leave_types_venture_code_idx')
    .on(table.ventureId, table.code),
  ventureActiveIdx: index('leave_types_venture_active_idx')
    .on(table.ventureId, table.isActive),
}));
```

### leave_policies

```typescript
export const leavePolicies = pgTable('leave_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  name: text('name').notNull(),
  description: text('description').default(''),
  leaveTypeId: uuid('leave_type_id').notNull().references(() => leaveTypes.id),
  accrualMethod: text('accrual_method').notNull(), // LeaveTypeAccrualMethod
  accrualSchedule: jsonb('accrual_schedule').notNull(), // AccrualSchedule
  annualEntitlementDays: integer('annual_entitlement_days').notNull(),
  carryoverRule: jsonb('carryover_rule').notNull(), // CarryoverRule
  waitingPeriodDays: integer('waiting_period_days').default(0),
  proRateForNewHires: boolean('pro_rate_for_new_hires').default(true),
  proRationMethod: text('pro_ration_method').default('calendar_days'),
  maxBalanceDays: integer('max_balance_days'),
  allowNegativeBalance: boolean('allow_negative_balance').default(false),
  maxNegativeBalanceDays: integer('max_negative_balance_days'),
  allowEncashment: boolean('allow_encashment').default(false),
  maxEncashmentDays: integer('max_encashment_days'),
  tenureTiers: jsonb('tenure_tiers').default([]), // TenureTier[]
  isDefault: boolean('is_default').default(false),
  applicableCountries: jsonb('applicable_countries').default([]),
  isActive: boolean('is_active').default(true),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).defaultNow(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureLeaveTypeIdx: index('leave_policies_venture_leave_type_idx')
    .on(table.ventureId, table.leaveTypeId),
  ventureDefaultIdx: index('leave_policies_venture_default_idx')
    .on(table.ventureId, table.isDefault),
}));
```

### leave_policy_assignments

```typescript
export const leavePolicyAssignments = pgTable('leave_policy_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  policyId: uuid('policy_id').notNull().references(() => leavePolicies.id),
  employeeId: uuid('employee_id').references(() => employees.id),
  departmentId: uuid('department_id').references(() => departments.id),
  countryCode: text('country_code'),
  employmentType: text('employment_type'),
  gradeCode: text('grade_code'),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).defaultNow(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureEmployeeIdx: index('leave_policy_assign_venture_emp_idx')
    .on(table.ventureId, table.employeeId),
  venturePolicyIdx: index('leave_policy_assign_venture_policy_idx')
    .on(table.ventureId, table.policyId),
}));
```

### leave_requests

```typescript
export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  leaveTypeId: uuid('leave_type_id').notNull().references(() => leaveTypes.id),
  status: text('status').notNull().default('draft'), // LeaveRequestStatus
  startDate: timestamp('start_date', { mode: 'date' }).notNull(),
  endDate: timestamp('end_date', { mode: 'date' }).notNull(),
  halfDay: text('half_day').default('none'),
  totalDays: integer('total_days').notNull(),
  totalHours: integer('total_hours'),
  reason: text('reason').notNull(),
  isEmergency: boolean('is_emergency').default(false),
  currentApproverId: uuid('current_approver_id').references(() => employees.id),
  emergencyContact: jsonb('emergency_contact'),
  delegateId: uuid('delegate_id').references(() => employees.id),
  fmlaTrackingId: uuid('fmla_tracking_id'),
  metadata: jsonb('metadata').default({}),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  deniedAt: timestamp('denied_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureEmployeeIdx: index('leave_requests_venture_employee_idx')
    .on(table.ventureId, table.employeeId),
  ventureStatusIdx: index('leave_requests_venture_status_idx')
    .on(table.ventureId, table.status),
  ventureDateRangeIdx: index('leave_requests_venture_date_range_idx')
    .on(table.ventureId, table.startDate, table.endDate),
  currentApproverIdx: index('leave_requests_current_approver_idx')
    .on(table.currentApproverId, table.status),
  employeeDateIdx: index('leave_requests_employee_date_idx')
    .on(table.employeeId, table.startDate, table.endDate),
}));
```

### leave_approvals

```typescript
export const leaveApprovals = pgTable('leave_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  leaveRequestId: uuid('leave_request_id').notNull().references(() => leaveRequests.id),
  approverId: uuid('approver_id').notNull().references(() => employees.id),
  level: integer('level').notNull(),
  action: text('action').notNull().default('pending'), // ApprovalAction
  comment: text('comment'),
  isDelegated: boolean('is_delegated').default(false),
  delegatedFromId: uuid('delegated_from_id').references(() => employees.id),
  actionAt: timestamp('action_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  requestIdx: index('leave_approvals_request_idx')
    .on(table.leaveRequestId),
  approverPendingIdx: index('leave_approvals_approver_pending_idx')
    .on(table.approverId, table.action),
}));
```

### leave_balances

```typescript
export const leaveBalances = pgTable('leave_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  leaveTypeId: uuid('leave_type_id').notNull().references(() => leaveTypes.id),
  year: integer('year').notNull(),
  carriedOver: integer('carried_over').default(0),
  accrued: integer('accrued').default(0),
  adjustments: integer('adjustments').default(0),
  used: integer('used').default(0),
  pending: integer('pending').default(0),
  encashed: integer('encashed').default(0),
  available: integer('available').default(0), // computed/maintained
  lastAccrualDate: timestamp('last_accrual_date', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  employeeYearIdx: uniqueIndex('leave_balances_emp_type_year_idx')
    .on(table.employeeId, table.leaveTypeId, table.year),
  ventureYearIdx: index('leave_balances_venture_year_idx')
    .on(table.ventureId, table.year),
}));
```

### leave_accruals

```typescript
export const leaveAccruals = pgTable('leave_accruals', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  leaveTypeId: uuid('leave_type_id').notNull().references(() => leaveTypes.id),
  policyId: uuid('policy_id').notNull().references(() => leavePolicies.id),
  accrualRunId: uuid('accrual_run_id').notNull(),
  periodStart: timestamp('period_start', { mode: 'date' }).notNull(),
  periodEnd: timestamp('period_end', { mode: 'date' }).notNull(),
  amount: integer('amount').notNull(),
  unit: text('unit').notNull().default('days'),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  capApplied: boolean('cap_applied').default(false),
  capLoss: integer('cap_loss').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  employeePeriodIdx: index('leave_accruals_emp_period_idx')
    .on(table.employeeId, table.periodStart, table.periodEnd),
  accrualRunIdx: index('leave_accruals_run_idx')
    .on(table.accrualRunId),
  venturePeriodIdx: index('leave_accruals_venture_period_idx')
    .on(table.ventureId, table.periodStart),
}));
```

### holiday_calendars

```typescript
export const holidayCalendars = pgTable('holiday_calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  name: text('name').notNull(),
  countryCode: text('country_code').notNull(),
  regionCode: text('region_code'),
  description: text('description').default(''),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureCountryIdx: index('holiday_calendars_venture_country_idx')
    .on(table.ventureId, table.countryCode),
  ventureDefaultIdx: index('holiday_calendars_venture_default_idx')
    .on(table.ventureId, table.countryCode, table.isDefault),
}));
```

### holidays

```typescript
export const holidays = pgTable('holidays', {
  id: uuid('id').primaryKey().defaultRandom(),
  calendarId: uuid('calendar_id').notNull().references(() => holidayCalendars.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  observedDate: timestamp('observed_date', { mode: 'date' }),
  type: text('type').notNull(), // HolidayType
  isHalfDay: boolean('is_half_day').default(false),
  isOptional: boolean('is_optional').default(false),
  isRecurring: boolean('is_recurring').default(true),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  calendarDateIdx: index('holidays_calendar_date_idx')
    .on(table.calendarId, table.date),
  calendarYearIdx: index('holidays_calendar_year_idx')
    .on(table.calendarId),
}));
```

### leave_entitlements

```typescript
export const leaveEntitlements = pgTable('leave_entitlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  employeeId: uuid('employee_id').references(() => employees.id),
  leaveTypeId: uuid('leave_type_id').notNull().references(() => leaveTypes.id),
  year: integer('year').notNull(),
  basis: text('basis').notNull(), // EntitlementBasis
  entitledDays: integer('entitled_days').notNull(),
  proRatedDays: integer('pro_rated_days'),
  isGranted: boolean('is_granted').default(false),
  grantedAt: timestamp('granted_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  notes: text('notes'),
  ruleId: uuid('rule_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  employeeYearIdx: index('leave_entitlements_emp_year_idx')
    .on(table.employeeId, table.year),
  ventureYearIdx: index('leave_entitlements_venture_year_idx')
    .on(table.ventureId, table.year),
}));
```

### leave_adjustments

```typescript
export const leaveAdjustments = pgTable('leave_adjustments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  leaveTypeId: uuid('leave_type_id').notNull().references(() => leaveTypes.id),
  amount: integer('amount').notNull(),
  unit: text('unit').notNull().default('days'),
  reason: text('reason').notNull(), // AdjustmentReason
  notes: text('notes').notNull(),
  adjustedBy: uuid('adjusted_by').notNull().references(() => employees.id),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  effectiveDate: timestamp('effective_date', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  employeeIdx: index('leave_adjustments_employee_idx')
    .on(table.employeeId),
  ventureDateIdx: index('leave_adjustments_venture_date_idx')
    .on(table.ventureId, table.effectiveDate),
}));
```

### leave_documents

```typescript
export const leaveDocuments = pgTable('leave_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  leaveRequestId: uuid('leave_request_id').notNull().references(() => leaveRequests.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // DocumentType
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storagePath: text('storage_path').notNull(),
  uploadedBy: uuid('uploaded_by').notNull().references(() => employees.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  requestIdx: index('leave_documents_request_idx')
    .on(table.leaveRequestId),
}));
```

### leave_blackout_dates

```typescript
export const leaveBlackoutDates = pgTable('leave_blackout_dates', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  name: text('name').notNull(),
  startDate: timestamp('start_date', { mode: 'date' }).notNull(),
  endDate: timestamp('end_date', { mode: 'date' }).notNull(),
  departmentIds: jsonb('department_ids').default([]),
  leaveTypeIds: jsonb('leave_type_ids').default([]),
  allowExceptions: boolean('allow_exceptions').default(false),
  description: text('description'),
  createdBy: uuid('created_by').notNull().references(() => employees.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureDateIdx: index('leave_blackout_venture_date_idx')
    .on(table.ventureId, table.startDate, table.endDate),
}));
```

### Accrual Runs (Internal Tracking)

```typescript
export const leaveAccrualRuns = pgTable('leave_accrual_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  runAt: timestamp('run_at', { withTimezone: true }).defaultNow(),
  trigger: text('trigger').notNull(), // 'scheduled' | 'manual' | 'event'
  periodStart: timestamp('period_start', { mode: 'date' }).notNull(),
  periodEnd: timestamp('period_end', { mode: 'date' }).notNull(),
  status: text('status').notNull().default('running'),
  employeesProcessed: integer('employees_processed').default(0),
  employeesSkipped: integer('employees_skipped').default(0),
  employeesFailed: integer('employees_failed').default(0),
  totalAccrued: integer('total_accrued').default(0),
  errors: jsonb('errors').default([]),
  durationMs: integer('duration_ms'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureDateIdx: index('leave_accrual_runs_venture_date_idx')
    .on(table.ventureId, table.periodStart),
  statusIdx: index('leave_accrual_runs_status_idx')
    .on(table.status),
}));
```

### FMLA Tracking

```typescript
export const fmlaTracking = pgTable('fmla_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  reason: text('reason').notNull(), // FMLAReason
  measurementPeriodStart: timestamp('measurement_period_start', { mode: 'date' }).notNull(),
  measurementPeriodEnd: timestamp('measurement_period_end', { mode: 'date' }).notNull(),
  totalEntitlementWeeks: integer('total_entitlement_weeks').default(12),
  weeksUsed: integer('weeks_used').default(0),
  weeksRemaining: integer('weeks_remaining').default(12),
  isIntermittent: boolean('is_intermittent').default(false),
  certificationStatus: text('certification_status').default('pending'),
  certificationExpiryDate: timestamp('certification_expiry_date', { mode: 'date' }),
  leaveRequestIds: jsonb('leave_request_ids').default([]),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  employeeStatusIdx: index('fmla_tracking_emp_status_idx')
    .on(table.employeeId, table.status),
  venturePeriodIdx: index('fmla_tracking_venture_period_idx')
    .on(table.ventureId, table.measurementPeriodStart),
}));
```

### Approval Delegates

```typescript
export const leaveApprovalDelegates = pgTable('leave_approval_delegates', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  delegatorId: uuid('delegator_id').notNull().references(() => employees.id),
  delegateId: uuid('delegate_id').notNull().references(() => employees.id),
  startDate: timestamp('start_date', { mode: 'date' }).notNull(),
  endDate: timestamp('end_date', { mode: 'date' }).notNull(),
  reason: text('reason').notNull(),
  isActive: boolean('is_active').default(true),
  leaveTypeIds: jsonb('leave_type_ids').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  delegatorActiveIdx: index('leave_delegates_delegator_active_idx')
    .on(table.delegatorId, table.isActive),
  delegateActiveIdx: index('leave_delegates_delegate_active_idx')
    .on(table.delegateId, table.isActive),
  dateRangeIdx: index('leave_delegates_date_range_idx')
    .on(table.startDate, table.endDate),
}));
```

### Entity-Relationship Summary

```
ventures ─────────────────────┐
  │                           │
  ├── leave_types             │
  │     │                     │
  │     ├── leave_policies    │
  │     │     │               │
  │     │     └── leave_policy_assignments
  │     │           │
  │     ├── leave_requests ───┤
  │     │     │               │
  │     │     ├── leave_approvals
  │     │     └── leave_documents
  │     │                     │
  │     ├── leave_balances    │
  │     ├── leave_accruals    │
  │     └── leave_entitlements│
  │                           │
  ├── holiday_calendars       │
  │     └── holidays          │
  │                           │
  ├── leave_blackout_dates    │
  ├── leave_adjustments       │
  ├── leave_accrual_runs      │
  ├── leave_approval_delegates│
  └── fmla_tracking           │
                              │
employees ────────────────────┘
```

---

## Code Examples

### Example 1: Creating Leave Types and Policies

```typescript
import { LeaveService } from '@mcv/people/leave';

const leaveService = LeaveServiceFactory.create({ db, ventureId });

// ─── Create leave types ─────────────────────────────────────────
const vacation = await leaveService.createLeaveType({
  name: 'Annual Vacation',
  code: 'VACATION',
  category: 'vacation',
  color: '#4CAF50',
  icon: 'palm-tree',
  isPaid: true,
  allowHalfDay: true,
  allowNegativeBalance: false,
  minNoticeDays: 14,
  minDuration: 0.5,
  maxDuration: 20,
  applicableCountries: [],       // All countries
  applicableEmploymentTypes: ['full_time', 'part_time'],
}, ctx);

const sickLeave = await leaveService.createLeaveType({
  name: 'Sick Leave',
  code: 'SICK',
  category: 'sick',
  color: '#F44336',
  icon: 'thermometer',
  isPaid: true,
  requiresDocumentation: true,
  documentationThresholdDays: 3, // Doctor's note after 3 consecutive days
  allowHalfDay: true,
  allowNegativeBalance: true,
  maxNegativeBalance: 5,
  minNoticeDays: 0,              // No advance notice for sick leave
  fmlaEligible: true,
}, ctx);

const parentalLeave = await leaveService.createLeaveType({
  name: 'Parental Leave',
  code: 'PARENTAL',
  category: 'parental',
  color: '#9C27B0',
  icon: 'baby',
  isPaid: true,
  requiresDocumentation: true,
  allowHalfDay: false,
  minDuration: 5,
  maxDuration: 78,               // Up to 78 weeks (Canada)
  minNoticeDays: 28,
  fmlaEligible: true,
  genderRestriction: 'any',
}, ctx);

// ─── Create a vacation policy ───────────────────────────────────
const vacationPolicy = await leaveService.createPolicy({
  name: 'Standard Vacation Policy',
  description: 'Default vacation policy for full-time employees',
  leaveTypeId: vacation.id,
  accrualMethod: 'monthly',
  accrualSchedule: {
    frequency: 'monthly',
    dayOfMonth: 1,
    amountPerPeriod: 1.25,       // 15 days / 12 months
    unit: 'days',
    accruePartialPeriods: true,
    roundingRule: 'nearest_quarter',
  },
  annualEntitlementDays: 15,
  carryoverRule: {
    type: 'capped',
    maxDays: 5,
    autoProcess: true,
    yearEndBasis: 'calendar',
  },
  waitingPeriodDays: 90,          // 3-month probation
  proRateForNewHires: true,
  proRationMethod: 'calendar_days',
  maxBalanceDays: 25,
  tenureTiers: [
    { minYears: 0, maxYears: 3, additionalDays: 0 },
    { minYears: 3, maxYears: 5, additionalDays: 2 },
    { minYears: 5, maxYears: 10, additionalDays: 5 },
    { minYears: 10, maxYears: null, additionalDays: 10 },
  ],
  isDefault: true,
}, ctx);

console.log(`Created vacation policy: ${vacationPolicy.name}`);
// → Created vacation policy: Standard Vacation Policy
```

### Example 2: Submitting and Approving Leave Requests

```typescript
import { LeaveService, LEAVE_STATUS } from '@mcv/people/leave';

const leaveService = LeaveServiceFactory.create({ db, ventureId });

// ─── Employee submits a vacation request ────────────────────────
const request = await leaveService.submitRequest({
  leaveTypeId: 'lt_vacation_001',
  startDate: new Date('2026-03-16'),
  endDate: new Date('2026-03-20'),
  halfDay: 'none',
  reason: 'Family vacation to Costa Rica',
  emergencyContact: {
    name: 'Jane Smith',
    phone: '+1-555-0123',
    email: 'jane@example.com',
  },
  delegateId: 'emp_colleague_001',
}, employeeCtx);

console.log(`Request ${request.id} submitted: ${request.totalDays} days`);
// → Request lr_abc123 submitted: 5 days
console.log(`Status: ${request.status}`);
// → Status: pending

// ─── Check for conflicts before approving ───────────────────────
const conflicts = await leaveService.detectConflicts({
  leaveTypeId: request.leaveTypeId,
  startDate: request.startDate,
  endDate: request.endDate,
  reason: request.reason,
}, managerCtx);

if (conflicts.hasConflicts) {
  console.log('Conflicts detected:');
  conflicts.conflicts.forEach(c => {
    console.log(`  [${c.severity}] ${c.type}: ${c.description}`);
  });
  // → [warning] team_overlap: 2 of 8 team members already on leave
  // → [warning] minimum_coverage: Team coverage drops to 62% (minimum: 50%)
}

// ─── Manager approves the request ───────────────────────────────
const approved = await leaveService.approveRequest(
  request.id,
  'Approved. Enjoy Costa Rica!',
  managerCtx
);

console.log(`Request ${approved.id} status: ${approved.status}`);
// → Request lr_abc123 status: approved
console.log(`Approved at: ${approved.approvedAt}`);
// → Approved at: 2026-02-10T14:30:00.000Z

// ─── Employee checks their updated balance ──────────────────────
const balance = await leaveService.getBalance(employeeCtx.userId, employeeCtx);
const vacationBalance = balance.balances.find(
  b => b.leaveType.code === 'VACATION'
);

console.log('Vacation balance:');
console.log(`  Accrued:   ${vacationBalance.balance.accrued} days`);
console.log(`  Used:      ${vacationBalance.balance.used} days`);
console.log(`  Pending:   ${vacationBalance.balance.pending} days`);
console.log(`  Available: ${vacationBalance.balance.available} days`);
// → Vacation balance:
// →   Accrued:   2.5 days
// →   Used:      0 days
// →   Pending:   0 days (now moved to "used" upon approval)
// →   Available: -2.5 days (will accrue more before leave starts)
```

### Example 3: Balance Projection and Accrual Processing

```typescript
import { LeaveService } from '@mcv/people/leave';

const leaveService = LeaveServiceFactory.create({ db, ventureId });

// ─── Project what balance will be on a future date ──────────────
const projection = await leaveService.projectBalance(
  'emp_alice_001',
  'lt_vacation_001',
  new Date('2026-06-30'),
  ctx
);

console.log('Balance projection as of 2026-06-30:');
console.log(`  Current balance:    ${projection.currentBalance} days`);
console.log(`  Expected accruals:  +${projection.expectedAccruals} days`);
console.log(`  Scheduled leaves:   -${projection.scheduledLeaves} days`);
console.log(`  Pending leaves:     -${projection.pendingLeaves} days`);
console.log(`  Carryover expiry:   -${projection.carryoverExpiry} days`);
console.log(`  Projected balance:  ${projection.projectedBalance} days`);
// → Balance projection as of 2026-06-30:
// →   Current balance:    7.5 days
// →   Expected accruals:  +6.25 days
// →   Scheduled leaves:   -5 days
// →   Pending leaves:     -0 days
// →   Carryover expiry:   -2 days (carryover expires March 31)
// →   Projected balance:  6.75 days

// ─── View projection timeline ───────────────────────────────────
projection.details.forEach(d => {
  const sign = d.amount >= 0 ? '+' : '';
  console.log(
    `  ${d.date.toISOString().slice(0, 10)} | ${sign}${d.amount} | ` +
    `Balance: ${d.projectedBalance} | ${d.description}`
  );
});
// →   2026-03-01 | +1.25 | Balance: 8.75  | Monthly accrual
// →   2026-03-16 | -5    | Balance: 3.75  | Vacation: Family trip
// →   2026-03-31 | -2    | Balance: 1.75  | Carryover expiry
// →   2026-04-01 | +1.25 | Balance: 3.0   | Monthly accrual
// →   2026-05-01 | +1.25 | Balance: 4.25  | Monthly accrual
// →   2026-06-01 | +1.25 | Balance: 5.5   | Monthly accrual

// ─── Run accrual processing (typically via cron) ────────────────
const accrualResult = await leaveService.runAccruals({
  dryRun: false,
  force: false,
}, adminCtx);

console.log('Accrual run completed:');
console.log(`  Run ID:      ${accrualResult.run.id}`);
console.log(`  Status:      ${accrualResult.run.status}`);
console.log(`  Processed:   ${accrualResult.summary.processed} employees`);
console.log(`  Skipped:     ${accrualResult.summary.skipped}`);
console.log(`  Failed:      ${accrualResult.summary.failed}`);
console.log(`  Total days:  ${accrualResult.summary.totalDaysAccrued}`);
console.log(`  Caps hit:    ${accrualResult.summary.capsApplied}`);
console.log(`  Duration:    ${accrualResult.run.durationMs}ms`);
// → Accrual run completed:
// →   Run ID:      ar_20260301_001
// →   Status:      completed
// →   Processed:   127 employees
// →   Skipped:     3 (on unpaid leave / probation)
// →   Failed:      0
// →   Total days:  158.75
// →   Caps hit:    4
// →   Duration:    2341ms
```

### Example 4: Holiday Calendar Management

```typescript
import { LeaveService } from '@mcv/people/leave';

const leaveService = LeaveServiceFactory.create({ db, ventureId });

// ─── Create a holiday calendar for Canada - Ontario ─────────────
const calendar = await leaveService.createHolidayCalendar({
  name: 'Canada - Ontario',
  countryCode: 'CA',
  regionCode: 'ON',
  description: 'Public holidays for Ontario, Canada',
  isDefault: true,
}, ctx);

// ─── Add statutory holidays ────────────────────────────────────
const holidays = await leaveService.addHolidays(calendar.id, [
  {
    name: "New Year's Day",
    date: new Date('2026-01-01'),
    type: 'public',
    isRecurring: true,
  },
  {
    name: 'Family Day',
    date: new Date('2026-02-16'),
    type: 'public',
    isRecurring: true,
    description: 'Third Monday in February',
  },
  {
    name: 'Good Friday',
    date: new Date('2026-04-03'),
    type: 'public',
    isRecurring: true,
    description: 'Varies each year',
  },
  {
    name: 'Victoria Day',
    date: new Date('2026-05-18'),
    type: 'public',
    isRecurring: true,
    description: 'Monday before May 25',
  },
  {
    name: 'Canada Day',
    date: new Date('2026-07-01'),
    type: 'public',
    isRecurring: true,
  },
  {
    name: 'Civic Holiday',
    date: new Date('2026-08-03'),
    type: 'public',
    isRecurring: true,
    description: 'First Monday in August (optional in Ontario)',
  },
  {
    name: 'Labour Day',
    date: new Date('2026-09-07'),
    type: 'public',
    isRecurring: true,
  },
  {
    name: 'Thanksgiving',
    date: new Date('2026-10-12'),
    type: 'public',
    isRecurring: true,
    description: 'Second Monday in October',
  },
  {
    name: 'Christmas Day',
    date: new Date('2026-12-25'),
    type: 'public',
    isRecurring: true,
  },
  {
    name: 'Boxing Day',
    date: new Date('2026-12-26'),
    type: 'public',
    isRecurring: true,
  },
], ctx);

console.log(`Added ${holidays.length} holidays to ${calendar.name}`);
// → Added 10 holidays to Canada - Ontario

// ─── Add a company-specific holiday ─────────────────────────────
await leaveService.addHolidays(calendar.id, [
  {
    name: 'Company Founding Day',
    date: new Date('2026-06-15'),
    type: 'company',
    isRecurring: true,
    description: 'Annual celebration of company founding',
  },
  {
    name: 'Holiday Shutdown',
    date: new Date('2026-12-24'),
    type: 'company',
    isHalfDay: true,
    description: 'Office closes at noon on Christmas Eve',
  },
], ctx);

// ─── Import holidays from external provider ────────────────────
const imported = await leaveService.importPublicHolidays('US', 2026, usCalendarId, ctx);
console.log(`Imported ${imported.length} US public holidays for 2026`);

// ─── Get holidays for a specific employee ───────────────────────
const employeeHolidays = await leaveService.getEmployeeHolidays(
  'emp_alice_001',
  2026,
  ctx
);

console.log('Alice\'s holidays in 2026:');
employeeHolidays.forEach(h => {
  const marker = h.isOptional ? ' (optional)' : '';
  console.log(`  ${h.date.toISOString().slice(0, 10)} - ${h.name}${marker}`);
});
```

### Example 5: Team Calendar and Conflict Detection

```typescript
import { LeaveService } from '@mcv/people/leave';

const leaveService = LeaveServiceFactory.create({ db, ventureId });

// ─── View team leave calendar ───────────────────────────────────
const teamCalendar = await leaveService.getTeamCalendar(
  'emp_manager_001',
  new Date('2026-03-01'),
  new Date('2026-03-31'),
  managerCtx
);

console.log(`Team calendar for ${teamCalendar.members.length} members:`);
teamCalendar.entries.forEach(entry => {
  console.log(
    `  ${entry.employeeName}: ${entry.leaveType.name} ` +
    `${entry.startDate.toISOString().slice(0, 10)} to ` +
    `${entry.endDate.toISOString().slice(0, 10)} ` +
    `(${entry.totalDays} days) [${entry.status}]`
  );
});
// → Team calendar for 8 members:
// →   Alice Johnson: Annual Vacation 2026-03-16 to 2026-03-20 (5 days) [approved]
// →   Bob Chen: Sick Leave 2026-03-10 to 2026-03-11 (2 days) [completed]
// →   Carol Kim: Annual Vacation 2026-03-18 to 2026-03-19 (2 days) [pending]

console.log('\nHolidays in March:');
teamCalendar.holidays.forEach(h => {
  console.log(`  ${h.date.toISOString().slice(0, 10)} - ${h.name}`);
});

// ─── Department calendar with coverage analysis ─────────────────
const deptCalendar = await leaveService.getDepartmentCalendar(
  'dept_engineering_001',
  new Date('2026-03-01'),
  new Date('2026-03-31'),
  managerCtx
);

console.log(`\nDepartment: ${deptCalendar.departmentName}`);
console.log('Daily coverage (March 16-20):');
deptCalendar.dailyCoverage
  .filter(d => {
    const date = d.date.toISOString().slice(0, 10);
    return date >= '2026-03-16' && date <= '2026-03-20';
  })
  .forEach(d => {
    const warning = d.belowMinimum ? ' ⚠️ BELOW MINIMUM' : '';
    console.log(
      `  ${d.date.toISOString().slice(0, 10)}: ` +
      `${d.presentMembers}/${d.totalMembers} present ` +
      `(${d.coveragePercent}%)${warning}`
    );
  });
// → Department: Engineering
// → Daily coverage (March 16-20):
// →   2026-03-16: 18/24 present (75%)
// →   2026-03-17: 17/24 present (71%)
// →   2026-03-18: 16/24 present (67%)
// →   2026-03-19: 16/24 present (67%)
// →   2026-03-20: 18/24 present (75%)

// ─── Set up blackout dates ──────────────────────────────────────
const blackout = await leaveService.createBlackoutDate({
  name: 'Q4 Code Freeze',
  startDate: new Date('2026-12-15'),
  endDate: new Date('2026-12-31'),
  departmentIds: ['dept_engineering_001'],
  leaveTypeIds: [],  // Block all leave types
  allowExceptions: true,
  description: 'No vacation during year-end code freeze. Exceptions require VP approval.',
}, adminCtx);

console.log(`Blackout created: ${blackout.name} (${blackout.startDate.toISOString().slice(0, 10)} to ${blackout.endDate.toISOString().slice(0, 10)})`);
```

### Example 6: FMLA Compliance Tracking

```typescript
import { LeaveService } from '@mcv/people/leave';

const leaveService = LeaveServiceFactory.create({ db, ventureId });

// ─── Check FMLA eligibility ────────────────────────────────────
const eligibility = await leaveService.checkFMLAEligibility(
  'emp_david_001',
  ctx
);

console.log('FMLA Eligibility Check:');
console.log(`  Eligible: ${eligibility.isEligible}`);
console.log(`  12 months employed: ${eligibility.criteria.twelveMonthsEmployed} (${eligibility.criteria.monthsEmployed} months)`);
console.log(`  1,250 hours: ${eligibility.criteria.hoursRequirementMet} (${eligibility.criteria.hoursWorked} hours)`);
console.log(`  50 employees at location: ${eligibility.criteria.locationRequirementMet} (${eligibility.criteria.employeesAtLocation} employees)`);
console.log(`  Remaining weeks: ${eligibility.remainingWeeks}`);
// → FMLA Eligibility Check:
// →   Eligible: true
// →   12 months employed: true (36 months)
// →   1,250 hours: true (1,892 hours)
// →   50 employees at location: true (127 employees)
// →   Remaining weeks: 12

// ─── Track FMLA usage ──────────────────────────────────────────
const fmlaUsage = await leaveService.getFMLAUsage('emp_david_001', ctx);

console.log('\nFMLA Usage (rolling 12-month period):');
console.log(`  Period: ${fmlaUsage.measurementPeriod.start.toISOString().slice(0, 10)} to ${fmlaUsage.measurementPeriod.end.toISOString().slice(0, 10)}`);
console.log(`  Total entitlement: ${fmlaUsage.totalWeeks} weeks`);
console.log(`  Used: ${fmlaUsage.usedWeeks} weeks`);
console.log(`  Remaining: ${fmlaUsage.remainingWeeks} weeks`);

if (fmlaUsage.usage.length > 0) {
  console.log('  Usage breakdown:');
  fmlaUsage.usage.forEach(u => {
    console.log(
      `    ${u.startDate.toISOString().slice(0, 10)} to ${u.endDate.toISOString().slice(0, 10)}: ` +
      `${u.weeksUsed} weeks (${u.reason})${u.isIntermittent ? ' [intermittent]' : ''}`
    );
  });
}

// ─── Get statutory requirements for a jurisdiction ──────────────
const statutory = await leaveService.getStatutoryRequirements('CA', 'ON', ctx);

console.log('\nStatutory Leave Requirements - Ontario, Canada:');
statutory.forEach(req => {
  console.log(`  ${req.name}:`);
  console.log(`    Minimum: ${req.minimumDays} ${req.daysType} days`);
  console.log(`    Paid: ${req.isPaid}${req.payRate ? ` (${req.payRate}%)` : ''}`);
  console.log(`    Reference: ${req.legalReference}`);
});
// → Statutory Leave Requirements - Ontario, Canada:
// →   Annual Vacation:
// →     Minimum: 10 working days
// →     Paid: true (100%)
// →     Reference: Employment Standards Act, 2000, Part XI
// →   Sick Leave:
// →     Minimum: 3 working days
// →     Paid: false
// →     Reference: Employment Standards Act, 2000, s. 50
// →   Parental Leave:
// →     Minimum: 63 calendar days
// →     Paid: true (55% via EI)
// →     Reference: Employment Standards Act, 2000, s. 48-49

// ─── Upload medical documentation ───────────────────────────────
const doc = await leaveService.uploadDocument(
  'lr_sick_001',
  {
    type: 'medical_certificate',
    filename: 'dr_note_2026_02.pdf',
    mimeType: 'application/pdf',
    data: fileBuffer,
  },
  employeeCtx
);

console.log(`Document uploaded: ${doc.filename} (${doc.sizeBytes} bytes)`);
```

### Example 7: Leave Reporting and Analytics

```typescript
import { LeaveService } from '@mcv/people/leave';

const leaveService = LeaveServiceFactory.create({ db, ventureId });
const reportFilter = {
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
};

// ─── Leave utilization report ───────────────────────────────────
const utilization = await leaveService.getUtilizationReport(reportFilter, ctx);

console.log('Leave Utilization Report (2025):');
console.log(`  Total employees: ${utilization.summary.totalEmployees}`);
console.log(`  Total entitled: ${utilization.summary.totalEntitledDays} days`);
console.log(`  Total used: ${utilization.summary.totalUsedDays} days`);
console.log(`  Utilization rate: ${utilization.summary.utilizationRate}%`);
console.log(`  Average days used: ${utilization.summary.averageDaysUsed}`);

console.log('\nBy leave type:');
utilization.byLeaveType.forEach(lt => {
  console.log(
    `  ${lt.leaveType.name}: ${lt.totalUsed}/${lt.totalEntitled} days ` +
    `(${lt.utilizationRate}%)`
  );
});
// →   Annual Vacation: 1,847/2,025 days (91.2%)
// →   Sick Leave: 342/1,350 days (25.3%)
// →   Personal Leave: 89/270 days (33.0%)

console.log('\nBy department:');
utilization.byDepartment.forEach(dept => {
  console.log(
    `  ${dept.departmentName}: ${dept.averageUsed} avg days/employee ` +
    `(${dept.utilizationRate}%)`
  );
});

// ─── Bradford Factor report ─────────────────────────────────────
const bradford = await leaveService.getBradfordFactorReport(reportFilter, ctx);

console.log('\nBradford Factor Report:');
console.log(`  Formula: B = S² × D (S = spells, D = total days)`);
console.log(`  Average score: ${bradford.summary.averageBradfordFactor}`);
console.log(`  Employees above medium threshold: ${bradford.summary.employeesAboveThreshold.medium}`);
console.log(`  Employees above high threshold: ${bradford.summary.employeesAboveThreshold.high}`);
console.log(`  Employees critical: ${bradford.summary.employeesAboveThreshold.critical}`);

console.log('\nTop 5 highest scores:');
bradford.scores
  .sort((a, b) => b.bradfordFactor - a.bradfordFactor)
  .slice(0, 5)
  .forEach((s, i) => {
    console.log(
      `  ${i + 1}. ${s.employeeName} (${s.departmentName}): ` +
      `B=${s.bradfordFactor} (${s.spellCount} spells, ${s.totalDays} days) ` +
      `[${s.rating}]`
    );
  });
// →   1. John Smith (Sales): B=900 (15 spells, 4 days) [critical]
// →   2. Jane Doe (Marketing): B=392 (14 spells, 2 days) [high]
// →   3. Bob Wilson (Engineering): B=200 (10 spells, 2 days) [medium]

// ─── Cost of absence report ─────────────────────────────────────
const costReport = await leaveService.getCostOfAbsenceReport(reportFilter, ctx);

console.log('\nCost of Absence Report:');
console.log(`  Total cost: $${costReport.summary.totalCost.toLocaleString()} ${costReport.summary.currency}`);
console.log(`  Total days absent: ${costReport.summary.totalDaysAbsent}`);
console.log(`  Average daily cost: $${costReport.summary.averageDailyCost.toFixed(2)}`);
console.log(`  Cost per employee: $${costReport.summary.costPerEmployee.toFixed(2)}`);

console.log('\nBy leave type:');
costReport.byLeaveType.forEach(lt => {
  console.log(
    `  ${lt.leaveType.name}: $${lt.cost.toLocaleString()} ` +
    `(${lt.days} days, ${lt.percentage.toFixed(1)}%)`
  );
});

// ─── Absence pattern analysis ───────────────────────────────────
const patterns = await leaveService.getAbsencePatternReport(reportFilter, ctx);

console.log('\nAbsence Pattern Analysis:');
console.log(`  Flagged employees: ${patterns.flaggedPatterns.length}`);

patterns.flaggedPatterns
  .filter(p => p.severity === 'high')
  .forEach(p => {
    console.log(
      `  ⚠️ ${p.employeeName} (${p.departmentName}): ${p.pattern} ` +
      `[${p.severity}] - ${p.occurrences} occurrences`
    );
  });

console.log('\nDay-of-week distribution:');
patterns.dayOfWeekDistribution.forEach(d => {
  const bar = '█'.repeat(Math.round(d.percentage / 2));
  console.log(`  ${d.dayOfWeek.padEnd(9)}: ${bar} ${d.percentage.toFixed(1)}%`);
});
// →   Monday   : ████████████ 23.5%
// →   Tuesday  : ██████████ 19.8%
// →   Wednesday: ████████ 16.2%
// →   Thursday : █████████ 17.1%
// →   Friday   : ████████████ 23.4%

console.log('\nWeekend/holiday extension patterns:');
patterns.extensionPatterns.forEach(ep => {
  console.log(
    `  ${ep.type}: ${ep.count} occurrences (${ep.percentage.toFixed(1)}% of all sick days)`
  );
});
```

### Example 8: Multi-Level Approval and Delegation

```typescript
import { LeaveService } from '@mcv/people/leave';

const leaveService = LeaveServiceFactory.create({ db, ventureId });

// ─── Set up approval delegation ─────────────────────────────────
// Manager going on vacation, delegates approval to a peer
const delegation = await leaveService.delegateApproval({
  delegateId: 'emp_peer_manager_001',
  startDate: new Date('2026-03-16'),
  endDate: new Date('2026-03-20'),
  reason: 'On vacation - Carol will handle approvals',
  leaveTypeIds: [],  // All leave types
}, managerCtx);

console.log(`Approval delegated to ${delegation.delegateId} from ${delegation.startDate.toISOString().slice(0, 10)} to ${delegation.endDate.toISOString().slice(0, 10)}`);

// ─── View pending approvals (as delegate) ───────────────────────
const pendingApprovals = await leaveService.getPendingApprovals(
  { status: 'pending' },
  delegateCtx
);

console.log(`\nPending approvals (including delegated): ${pendingApprovals.total}`);
pendingApprovals.items.forEach(req => {
  console.log(
    `  ${req.id}: ${req.employeeId} requesting ${req.totalDays} days ` +
    `${req.leaveTypeId} (${req.startDate.toISOString().slice(0, 10)} - ${req.endDate.toISOString().slice(0, 10)})`
  );
});

// ─── Approve as delegate ────────────────────────────────────────
const approvedByDelegate = await leaveService.approveRequest(
  pendingApprovals.items[0].id,
  'Approved on behalf of the team manager',
  delegateCtx
);

console.log(`Request ${approvedByDelegate.id} approved by delegate`);
// The approval record will show isDelegated=true and delegatedFromId=manager's ID

// ─── View approval chain for a request ──────────────────────────
const request = await leaveService.getRequest('lr_multi_001', ctx);
console.log(`\nApproval chain for request ${request.id}:`);
request.approvalChain.forEach(level => {
  const status = level.status === 'approved' ? '✅' :
                 level.status === 'denied' ? '❌' :
                 level.status === 'pending' ? '⏳' : '↗️';
  const delegated = level.isDelegated ? ' (delegated)' : '';
  console.log(
    `  Level ${level.level}: ${level.approverName} - ${status} ${level.status}${delegated}` +
    (level.comment ? ` - "${level.comment}"` : '') +
    (level.actionAt ? ` at ${level.actionAt.toISOString().slice(0, 16)}` : '')
  );
});
// → Approval chain for request lr_multi_001:
// →   Level 1: Alice Manager - ✅ approved - "Looks good" at 2026-02-10T14:30
// →   Level 2: Bob Director - ✅ approved (delegated) - "Approved on behalf" at 2026-02-10T16:00
// →   Level 3: Carol VP - ⏳ pending

// ─── Revoke delegation when back ────────────────────────────────
await leaveService.revokeDelegation(delegation.id, managerCtx);
console.log('Delegation revoked');
```

---

## Error Codes

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `LEAVE_001` | `LEAVE_TYPE_NOT_FOUND` | 404 | The specified leave type does not exist or is not active |
| `LEAVE_002` | `LEAVE_TYPE_CODE_EXISTS` | 409 | A leave type with this code already exists in the venture |
| `LEAVE_003` | `LEAVE_POLICY_NOT_FOUND` | 404 | The specified leave policy does not exist |
| `LEAVE_004` | `LEAVE_REQUEST_NOT_FOUND` | 404 | The specified leave request does not exist |
| `LEAVE_005` | `INSUFFICIENT_BALANCE` | 422 | Employee does not have enough leave balance for this request |
| `LEAVE_006` | `NEGATIVE_BALANCE_NOT_ALLOWED` | 422 | Negative balance is not allowed for this leave type |
| `LEAVE_007` | `NEGATIVE_BALANCE_EXCEEDED` | 422 | Request would exceed the maximum allowed negative balance |
| `LEAVE_008` | `BLACKOUT_DATE_VIOLATION` | 422 | The requested dates fall within a blackout period |
| `LEAVE_009` | `MIN_NOTICE_VIOLATION` | 422 | Request does not meet the minimum advance notice requirement |
| `LEAVE_010` | `MAX_DURATION_EXCEEDED` | 422 | Request exceeds the maximum duration for this leave type |
| `LEAVE_011` | `MIN_DURATION_NOT_MET` | 422 | Request is below the minimum duration for this leave type |
| `LEAVE_012` | `HALF_DAY_NOT_ALLOWED` | 422 | Half-day requests are not allowed for this leave type |
| `LEAVE_013` | `HOURLY_NOT_ALLOWED` | 422 | Hourly requests are not allowed for this leave type |
| `LEAVE_014` | `DOCUMENTATION_REQUIRED` | 422 | Supporting documentation is required for this request (e.g., sick leave exceeds threshold) |
| `LEAVE_015` | `PROBATION_RESTRICTION` | 422 | Employee is still in the probation/waiting period for this leave type |
| `LEAVE_016` | `OVERLAPPING_REQUEST` | 409 | Employee already has a leave request for the same dates |
| `LEAVE_017` | `INVALID_DATE_RANGE` | 422 | End date must be on or after start date |
| `LEAVE_018` | `WEEKEND_ONLY_REQUEST` | 422 | The request dates span only weekends/holidays (no working days) |
| `LEAVE_019` | `REQUEST_NOT_PENDING` | 422 | Cannot approve/deny a request that is not in pending status |
| `LEAVE_020` | `REQUEST_NOT_CANCELLABLE` | 422 | Request cannot be cancelled in its current status |
| `LEAVE_021` | `NOT_AUTHORIZED_APPROVER` | 403 | The current user is not authorized to approve this request |
| `LEAVE_022` | `SELF_APPROVAL_NOT_ALLOWED` | 422 | Employees cannot approve their own leave requests |
| `LEAVE_023` | `DELEGATION_OVERLAP` | 409 | An approval delegation already exists for this period |
| `LEAVE_024` | `DELEGATION_NOT_FOUND` | 404 | The specified delegation does not exist |
| `LEAVE_025` | `DELEGATION_EXPIRED` | 422 | The approval delegation has expired |
| `LEAVE_026` | `HOLIDAY_CALENDAR_NOT_FOUND` | 404 | The specified holiday calendar does not exist |
| `LEAVE_027` | `HOLIDAY_DUPLICATE` | 409 | A holiday with this name already exists on this date in the calendar |
| `LEAVE_028` | `ENTITLEMENT_ALREADY_GRANTED` | 409 | Entitlement for this employee/type/year has already been granted |
| `LEAVE_029` | `ACCRUAL_ALREADY_PROCESSED` | 409 | Accruals have already been processed for this period (use `force` to override) |
| `LEAVE_030` | `ACCRUAL_RUN_IN_PROGRESS` | 409 | Another accrual run is currently in progress |
| `LEAVE_031` | `BALANCE_CAP_REACHED` | 422 | Employee has reached the maximum balance cap; accrual will be lost |
| `LEAVE_032` | `FMLA_NOT_ELIGIBLE` | 422 | Employee does not meet FMLA eligibility requirements |
| `LEAVE_033` | `FMLA_EXHAUSTED` | 422 | Employee has exhausted their FMLA entitlement for the measurement period |
| `LEAVE_034` | `LEAVE_TYPE_NOT_APPLICABLE` | 422 | This leave type is not available for the employee's country/employment type |
| `LEAVE_035` | `GENDER_RESTRICTION_VIOLATION` | 422 | This leave type is restricted based on gender |
| `LEAVE_036` | `ENCASHMENT_NOT_ALLOWED` | 422 | Leave encashment is not enabled for this leave type/policy |
| `LEAVE_037` | `ENCASHMENT_LIMIT_EXCEEDED` | 422 | Encashment request exceeds the annual maximum |
| `LEAVE_038` | `ADJUSTMENT_INVALID_AMOUNT` | 422 | Adjustment amount is invalid (e.g., would create impossible balance) |
| `LEAVE_039` | `DOCUMENT_TOO_LARGE` | 413 | Uploaded document exceeds the maximum file size |
| `LEAVE_040` | `DOCUMENT_TYPE_NOT_ALLOWED` | 422 | The uploaded file type is not allowed |
| `LEAVE_041` | `CARRYOVER_ALREADY_PROCESSED` | 409 | Year-end carryover has already been processed for this year |
| `LEAVE_042` | `POLICY_ASSIGNMENT_CONFLICT` | 409 | Conflicting policy assignment exists for the same criteria |
| `LEAVE_043` | `INVALID_APPROVAL_CHAIN` | 422 | The approval chain configuration is invalid |
| `LEAVE_044` | `TEAM_COVERAGE_CRITICAL` | 422 | Approving this request would drop team coverage below the critical minimum |
| `LEAVE_045` | `EMERGENCY_CONTACT_REQUIRED` | 422 | Emergency contact is required for leave requests exceeding the threshold |

---

## Security

### Access Control Matrix

| Operation | Employee | Manager | HR Admin | System Admin |
|---|:---:|:---:|:---:|:---:|
| Submit own leave request | ✅ | ✅ | ✅ | ✅ |
| View own leave requests | ✅ | ✅ | ✅ | ✅ |
| View own balance | ✅ | ✅ | ✅ | ✅ |
| Cancel own request | ✅ | ✅ | ✅ | ✅ |
| View team requests | ❌ | ✅ | ✅ | ✅ |
| Approve/deny requests | ❌ | ✅ | ✅ | ✅ |
| View team calendar | ❌ | ✅ | ✅ | ✅ |
| View department calendar | ❌ | ❌ | ✅ | ✅ |
| Adjust employee balance | ❌ | ❌ | ✅ | ✅ |
| Manage leave types | ❌ | ❌ | ✅ | ✅ |
| Manage leave policies | ❌ | ❌ | ✅ | ✅ |
| Manage holiday calendars | ❌ | ❌ | ✅ | ✅ |
| Manage entitlement rules | ❌ | ❌ | ✅ | ✅ |
| Manage blackout dates | ❌ | ❌ | ✅ | ✅ |
| View all reports | ❌ | ❌ | ✅ | ✅ |
| Run accruals | ❌ | ❌ | ❌ | ✅ |
| Process carryover | ❌ | ❌ | ❌ | ✅ |
| Manage FMLA tracking | ❌ | ❌ | ✅ | ✅ |
| Delegate approvals | ❌ | ✅ | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ✅ | ✅ |

### Multi-Tenant Isolation

All data access is scoped by `venture_id` through Supabase Row Level Security (RLS). This is enforced at the database level and cannot be bypassed by application code:

```sql
-- Every table has an RLS policy ensuring tenant isolation
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON leave_requests
  FOR ALL
  USING (venture_id = current_setting('app.current_venture_id')::uuid);
```

### Data Privacy

- **Medical information** — Leave reason fields for sick leave and FMLA requests are treated as sensitive health information. Access is restricted to the employee, their direct manager, and HR administrators.
- **Document storage** — Medical certificates and supporting documents are stored in Supabase Storage with private access policies. URLs are signed and expire after 1 hour.
- **Audit trail** — All state changes are logged with the acting user, timestamp, and previous/new values. Audit logs are immutable and retained per the venture's data retention policy.
- **FMLA records** — FMLA tracking data is classified as protected health information (PHI) where applicable. Access is restricted to HR administrators and the employee.

### Input Validation

All inputs are validated using Zod schemas before processing:

```typescript
import { z } from 'zod';

export const leaveRequestCreateSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  halfDay: z.enum(['none', 'start', 'end', 'both']).default('none'),
  reason: z.string().min(1).max(2000),
  isEmergency: z.boolean().default(false),
  emergencyContact: z.object({
    name: z.string().min(1).max(200),
    phone: z.string().min(1).max(50),
    email: z.string().email().max(200),
  }).optional(),
  delegateId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(
  data => data.endDate >= data.startDate,
  { message: 'End date must be on or after start date', path: ['endDate'] }
);
```

### Rate Limiting

| Operation | Rate Limit | Window |
|---|---|---|
| Submit leave request | 10 | per hour |
| Balance inquiry | 60 | per minute |
| Calendar view | 30 | per minute |
| Report generation | 5 | per minute |
| Accrual run (manual) | 2 | per hour |
| Document upload | 20 | per hour |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `LEAVE_ACCRUAL_CRON` | No | `0 2 1 * *` | Cron schedule for accrual processing (default: 2 AM on 1st of each month) |
| `LEAVE_CARRYOVER_CRON` | No | `0 3 1 1 *` | Cron schedule for year-end carryover processing |
| `LEAVE_MAX_DOCUMENT_SIZE_MB` | No | `10` | Maximum size for uploaded documents in megabytes |
| `LEAVE_ALLOWED_DOCUMENT_TYPES` | No | `pdf,jpg,jpeg,png,doc,docx` | Comma-separated list of allowed document file extensions |
| `LEAVE_APPROVAL_REMINDER_HOURS` | No | `48` | Hours before sending a reminder for pending approvals |
| `LEAVE_APPROVAL_ESCALATION_HOURS` | No | `72` | Hours before escalating an unapproved request |
| `LEAVE_BALANCE_LOW_THRESHOLD` | No | `3` | Days remaining to trigger a low balance notification |
| `LEAVE_CONFLICT_MIN_COVERAGE_PCT` | No | `50` | Minimum team coverage percentage before blocking leave |
| `LEAVE_CONFLICT_SAME_ROLE_MAX` | No | `1` | Maximum number of people in the same role who can be on leave simultaneously |
| `LEAVE_HOLIDAY_PROVIDER` | No | `nager` | Holiday data provider (`nager`, `calendarific`, `none`) |
| `LEAVE_HOLIDAY_PROVIDER_API_KEY` | No | — | API key for the holiday data provider (if required) |
| `LEAVE_FMLA_MEASUREMENT_METHOD` | No | `rolling_backward` | FMLA measurement period method |
| `LEAVE_BRADFORD_THRESHOLD_MEDIUM` | No | `200` | Bradford Factor threshold for medium severity |
| `LEAVE_BRADFORD_THRESHOLD_HIGH` | No | `500` | Bradford Factor threshold for high severity |
| `LEAVE_BRADFORD_THRESHOLD_CRITICAL` | No | `900` | Bradford Factor threshold for critical severity |
| `LEAVE_CALENDAR_SYNC_ENABLED` | No | `false` | Enable Google/Outlook calendar sync for approved leaves |
| `LEAVE_NOTIFICATIONS_ENABLED` | No | `true` | Enable email/push notifications for leave events |
| `LEAVE_AUDIT_RETENTION_DAYS` | No | `2555` | Number of days to retain audit logs (default: 7 years) |

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@mcv/core` | `workspace:*` | Core utilities, types, error handling |
| `@mcv/db` | `workspace:*` | Database connection, Drizzle ORM setup, migration tools |
| `@mcv/auth` | `workspace:*` | Authentication context, permission checks |
| `@mcv/events` | `workspace:*` | Event bus for domain event publishing |
| `@mcv/people/core` | `workspace:*` | Employee data, org structure, department info |
| `@mcv/comms/notify` | `workspace:*` | Notification delivery (email, push, in-app) |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.36.x` | ORM for type-safe database queries |
| `@supabase/supabase-js` | `^2.x` | Supabase client for storage and auth |
| `zod` | `^3.x` | Runtime schema validation |
| `@trpc/server` | `^11.x` | Type-safe API layer |
| `date-fns` | `^4.x` | Date manipulation and formatting |
| `cron-parser` | `^5.x` | Cron expression parsing for accrual schedules |
| `uuid` | `^11.x` | UUID v7 generation for primary keys |

### Peer Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | `^19.x` | Required for hook exports |
| `@tanstack/react-query` | `^5.x` | Required for hook data fetching |

---

## Testing

### Test Categories

#### Unit Tests

Unit tests cover individual service methods, business rule validation, and calculation logic:

```typescript
describe('LeaveBalanceService', () => {
  describe('calculateAvailableBalance', () => {
    it('should calculate available = carried + accrued + adjustments - used - pending - encashed', () => {
      const balance = calculateAvailableBalance({
        carriedOver: 5,
        accrued: 10,
        adjustments: 2,
        used: 7,
        pending: 3,
        encashed: 0,
      });
      expect(balance).toBe(7); // 5 + 10 + 2 - 7 - 3 - 0
    });

    it('should allow negative balance when policy permits', () => {
      const balance = calculateAvailableBalance({
        carriedOver: 0,
        accrued: 5,
        adjustments: 0,
        used: 8,
        pending: 0,
        encashed: 0,
      });
      expect(balance).toBe(-3);
    });
  });

  describe('proRateEntitlement', () => {
    it('should pro-rate for mid-year hire (calendar_days method)', () => {
      // Hired July 1 = 184 remaining days / 365 total
      const proRated = proRateEntitlement({
        fullEntitlement: 15,
        hireDate: new Date('2026-07-01'),
        yearEnd: new Date('2026-12-31'),
        method: 'calendar_days',
      });
      expect(proRated).toBe(7.5); // 15 × (184/365) ≈ 7.56, rounded to nearest 0.5
    });

    it('should pro-rate for mid-year hire (monthly method)', () => {
      // Hired July 1 = 6 remaining months / 12 total
      const proRated = proRateEntitlement({
        fullEntitlement: 15,
        hireDate: new Date('2026-07-01'),
        yearEnd: new Date('2026-12-31'),
        method: 'monthly',
      });
      expect(proRated).toBe(7.5); // 15 × (6/12)
    });
  });
});

describe('BradfordFactorCalculator', () => {
  it('should calculate Bradford Factor as S² × D', () => {
    // 10 separate spells of 1 day each = 10² × 10 = 1000
    const factor = calculateBradfordFactor({
      spellCount: 10,
      totalDays: 10,
    });
    expect(factor).toBe(1000);
  });

  it('should show lower score for fewer, longer absences', () => {
    // 2 spells totaling 10 days = 2² × 10 = 40
    const factor = calculateBradfordFactor({
      spellCount: 2,
      totalDays: 10,
    });
    expect(factor).toBe(40);
  });

  it('should return 0 for no absences', () => {
    const factor = calculateBradfordFactor({
      spellCount: 0,
      totalDays: 0,
    });
    expect(factor).toBe(0);
  });
});
```

#### Integration Tests

Integration tests verify service interactions, database operations, and event emissions:

```typescript
describe('LeaveRequestService (integration)', () => {
  let service: LeaveService;
  let testEmployee: Employee;
  let testManager: Employee;
  let vacationType: LeaveType;

  beforeEach(async () => {
    service = LeaveServiceFactory.create({ db: testDb, ventureId: testVentureId });
    testEmployee = await createTestEmployee({ managerId: testManager.id });
    vacationType = await createTestLeaveType({ code: 'VACATION' });
    await createTestPolicy({ leaveTypeId: vacationType.id, annualEntitlementDays: 15 });
    await grantTestEntitlement({ employeeId: testEmployee.id, leaveTypeId: vacationType.id, days: 15 });
  });

  it('should submit a leave request and update balance', async () => {
    const request = await service.submitRequest({
      leaveTypeId: vacationType.id,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-05'),
      reason: 'Vacation',
    }, createCtx(testEmployee));

    expect(request.status).toBe('pending');
    expect(request.totalDays).toBe(5);

    const balance = await service.getBalance(testEmployee.id, createCtx(testEmployee));
    const vacBalance = balance.balances.find(b => b.leaveType.id === vacationType.id);
    expect(vacBalance?.balance.pending).toBe(5);
    expect(vacBalance?.balance.available).toBe(10); // 15 - 5 pending
  });

  it('should prevent submission during blackout period', async () => {
    await service.createBlackoutDate({
      name: 'Test Blackout',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-30'),
    }, adminCtx);

    await expect(
      service.submitRequest({
        leaveTypeId: vacationType.id,
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-06-16'),
        reason: 'Vacation',
      }, createCtx(testEmployee))
    ).rejects.toThrow('LEAVE_008');
  });

  it('should enforce minimum notice days', async () => {
    // Update leave type to require 14 days notice
    await service.updateLeaveType(vacationType.id, { minNoticeDays: 14 }, adminCtx);

    // Try to submit request for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    await expect(
      service.submitRequest({
        leaveTypeId: vacationType.id,
        startDate: tomorrow,
        endDate: dayAfter,
        reason: 'Short notice vacation',
      }, createCtx(testEmployee))
    ).rejects.toThrow('LEAVE_009');
  });

  it('should emit events on approval', async () => {
    const events: unknown[] = [];
    eventBus.on('leave.request.approved', (e) => events.push(e));

    const request = await service.submitRequest({
      leaveTypeId: vacationType.id,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-05'),
      reason: 'Vacation',
    }, createCtx(testEmployee));

    await service.approveRequest(request.id, 'Approved', createCtx(testManager));

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      requestId: request.id,
      employeeId: testEmployee.id,
      totalDays: 5,
    });
  });

  it('should restore balance on cancellation', async () => {
    const request = await service.submitRequest({
      leaveTypeId: vacationType.id,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-05'),
      reason: 'Vacation',
    }, createCtx(testEmployee));

    await service.approveRequest(request.id, 'OK', createCtx(testManager));

    let balance = await service.getBalance(testEmployee.id, createCtx(testEmployee));
    let vacBalance = balance.balances.find(b => b.leaveType.id === vacationType.id);
    expect(vacBalance?.balance.used).toBe(5);

    await service.cancelRequest(request.id, 'Plans changed', createCtx(testEmployee));

    balance = await service.getBalance(testEmployee.id, createCtx(testEmployee));
    vacBalance = balance.balances.find(b => b.leaveType.id === vacationType.id);
    expect(vacBalance?.balance.used).toBe(0);
    expect(vacBalance?.balance.available).toBe(15);
  });
});
```

#### Accrual Processing Tests

```typescript
describe('LeaveAccrualService (integration)', () => {
  it('should accrue monthly and respect balance cap', async () => {
    // Employee has 24 days balance, cap is 25
    await setBalance(testEmployee.id, vacationType.id, { accrued: 24 });

    const result = await service.runAccruals({
      employeeIds: [testEmployee.id],
    }, adminCtx);

    expect(result.summary.processed).toBe(1);
    expect(result.summary.capsApplied).toBe(1);

    // Should only accrue 1 day (cap = 25, current = 24)
    const detail = result.details[0];
    expect(detail.amount).toBe(1);
    expect(detail.capApplied).toBe(true);
    expect(detail.capLoss).toBe(0.25); // Would have accrued 1.25 but capped
  });

  it('should skip employees in probation period', async () => {
    const newHire = await createTestEmployee({
      hireDate: new Date(), // Hired today, 90-day probation
    });

    const result = await service.runAccruals({
      employeeIds: [newHire.id],
    }, adminCtx);

    expect(result.summary.skipped).toBe(1);
    const detail = result.details.find(d => d.employeeId === newHire.id);
    expect(detail?.status).toBe('skipped');
    expect(detail?.reason).toContain('probation');
  });

  it('should support dry run mode', async () => {
    const balanceBefore = await getBalance(testEmployee.id, vacationType.id);

    const result = await service.runAccruals({
      dryRun: true,
    }, adminCtx);

    expect(result.summary.processed).toBeGreaterThan(0);

    // Balance should not have changed
    const balanceAfter = await getBalance(testEmployee.id, vacationType.id);
    expect(balanceAfter.accrued).toBe(balanceBefore.accrued);
  });
});
```

#### Working Days Calculation Tests

```typescript
describe('WorkingDaysCalculator', () => {
  it('should exclude weekends from leave count', () => {
    // Monday to Friday = 5 working days
    const days = calculateWorkingDays(
      new Date('2026-03-16'), // Monday
      new Date('2026-03-20'), // Friday
      [],
    );
    expect(days).toBe(5);
  });

  it('should exclude holidays from leave count', () => {
    // Monday to Friday with 1 holiday = 4 working days
    const days = calculateWorkingDays(
      new Date('2026-03-16'),
      new Date('2026-03-20'),
      [new Date('2026-03-18')], // Wednesday is a holiday
    );
    expect(days).toBe(4);
  });

  it('should handle half-day start', () => {
    const days = calculateWorkingDays(
      new Date('2026-03-16'),
      new Date('2026-03-20'),
      [],
      { halfDay: 'start' }
    );
    expect(days).toBe(4.5);
  });

  it('should handle half-day both', () => {
    const days = calculateWorkingDays(
      new Date('2026-03-16'),
      new Date('2026-03-20'),
      [],
      { halfDay: 'both' }
    );
    expect(days).toBe(4);
  });

  it('should handle cross-weekend spans', () => {
    // Monday 3/16 to Wednesday 3/25 = 8 working days (skip 3/21-22)
    const days = calculateWorkingDays(
      new Date('2026-03-16'),
      new Date('2026-03-25'),
      [],
    );
    expect(days).toBe(8);
  });
});
```

### Running Tests

```bash
# Run all leave module tests
pnpm test --filter @mcv/people/leave

# Run unit tests only
pnpm test --filter @mcv/people/leave -- --grep "unit"

# Run integration tests (requires database)
pnpm test:integration --filter @mcv/people/leave

# Run with coverage
pnpm test:coverage --filter @mcv/people/leave

# Run a specific test file
pnpm test --filter @mcv/people/leave -- src/services/__tests__/leave-balance.test.ts
```

### Test Coverage Requirements

| Category | Target | Current |
|---|---|---|
| Statements | ≥ 90% | — |
| Branches | ≥ 85% | — |
| Functions | ≥ 90% | — |
| Lines | ≥ 90% | — |

Critical paths require 100% coverage:
- Balance calculations (accrual, deduction, available)
- Working days calculations (weekends, holidays, half-days)
- Accrual processing pipeline
- Approval workflow state transitions
- Carryover processing
- FMLA eligibility checks

---

*Last updated: 2026-02-09*
*Module version: 0.8.0*