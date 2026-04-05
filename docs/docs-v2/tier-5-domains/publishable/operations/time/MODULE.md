# @mcv/operations/time

> **Time Tracking & Timesheet Management for MCV.ONE**

| Field | Value |
|---|---|
| **Package** | `@mcv/operations/time` |
| **Domain** | Operations |
| **Tier** | 5 — Domain Module |
| **Registry** | `@mcv` (private) |
| **Since** | 0.1.0 |
| **Status** | Stable |
| **Maintainer** | MCV Platform Team |
| **License** | Proprietary |
| **DB Provider** | Supabase PostgreSQL |
| **ORM** | Drizzle |
| **API Layer** | tRPC v11 |
| **Multi-Tenant** | Row-Level Security (RLS) |

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

`@mcv/operations/time` is the authoritative time tracking and timesheet management module for the MCV.ONE platform. It provides a comprehensive, multi-tenant solution for recording work hours, managing timesheets, tracking billable time, and integrating with payroll and invoicing systems.

### Why This Module Exists

Every professional services organization, agency, consultancy, and project-driven business lives or dies by time tracking accuracy. Billable hours fuel revenue. Non-billable hours inform operational decisions. Overtime compliance protects the business legally. Yet most time tracking solutions are standalone silos that don't integrate with the broader operational fabric — payroll, invoicing, project management, and resource planning all end up disconnected.

This module solves that by embedding time tracking directly into the MCV.ONE operations layer, where it can:

- **Feed billing pipelines** — Approved timesheets flow directly into invoice generation via `@mcv/operations/billing`
- **Inform resource planning** — Utilization data drives staffing decisions in `@mcv/operations/resources`
- **Support payroll** — Overtime calculations and approved hours sync to `@mcv/operations/payroll`
- **Enable project controls** — Budget burn rates and time-to-completion estimates come from real tracked hours
- **Enforce compliance** — Overtime rules, mandatory break tracking, and audit trails satisfy labor regulations

### Core Capabilities

| Capability | Description |
|---|---|
| **Time Entry** | Manual entry, running timers, start/stop tracking, duration-based or start-end based, rich descriptions with tags |
| **Timesheets** | Weekly and bi-weekly views, submission workflow (draft → submitted → approved → locked), bulk entry and templates |
| **Project Time Allocation** | Time linked to projects, tasks, and clients; billable vs. non-billable classification; project budget tracking |
| **Approval Workflow** | Manager approval with batch approve/reject, comments, delegation chains, configurable auto-approval rules |
| **Billing Integration** | Per-user/project/client billable rates, invoice generation from approved timesheets, unbilled time reports |
| **Overtime Tracking** | Automatic overtime calculation against daily/weekly thresholds, overtime approval workflows, compliance reporting |
| **PTO Integration** | Time-off visibility in timesheets, holiday calendar awareness, leave balance impact calculations |
| **Reporting** | Hours by project/client/user, utilization rates, billable percentages, overtime trends, budget burn analytics |
| **Reminders** | Missing timesheet notifications, incomplete day alerts, submission deadline reminders, configurable cadence |
| **Integrations** | Payroll sync, calendar integration (Google/Outlook), task management time sync, webhook events |

### Design Principles

1. **Tenant Isolation** — Every row is scoped to a tenant via RLS. No cross-tenant data leakage is possible at the database level.
2. **Immutable Audit Trail** — Once a timesheet is approved and locked, entries cannot be modified. Corrections create adjustment entries with full provenance.
3. **Flexible Time Models** — Supports duration-based entry (e.g., "3.5 hours on Project X"), start/end entry (e.g., "9:00 AM – 12:30 PM"), and running timers.
4. **Rate Hierarchy** — Billable rates cascade: entry-level override → task rate → project rate → client rate → user default rate → organization default.
5. **Workflow-Driven** — Timesheets progress through well-defined states with configurable transitions, approval chains, and automation rules.
6. **Offline-Capable** — Timer state persists locally and syncs when connectivity resumes.

---

## 2. Exports

### Services

```typescript
export { TimeService }              from './services/time.service';
export { TimesheetService }         from './services/timesheet.service';
export { TimerService }             from './services/timer.service';
export { BillingRateService }       from './services/billing-rate.service';
export { ApprovalService }          from './services/approval.service';
export { OvertimeService }          from './services/overtime.service';
export { TimeReportService }        from './services/time-report.service';
export { TimeReminderService }      from './services/time-reminder.service';
export { ProjectBudgetService }     from './services/project-budget.service';
export { TimePolicyService }        from './services/time-policy.service';
```

### Router (tRPC)

```typescript
export { timeRouter }               from './router';
export type { TimeRouter }          from './router';
```

### Schemas (Drizzle)

```typescript
export {
  timeEntries,
  timesheets,
  timesheetApprovals,
  billableRates,
  overtimeRules,
  timeTags,
  timeEntryTags,
  projectBudgets,
  timeReminders,
  timePolicies,
  timerSessions,
} from './schema';
```

### Types

```typescript
export type {
  TimeEntry,
  TimeEntryCreate,
  TimeEntryUpdate,
  TimeEntryFilter,
  Timesheet,
  TimesheetCreate,
  TimesheetStatus,
  TimesheetApproval,
  ApprovalAction,
  ApprovalDecision,
  BillableRate,
  BillableRateCreate,
  BillableRateScope,
  RateResolution,
  OvertimeRule,
  OvertimeRuleCreate,
  OvertimeCalculation,
  OvertimePeriod,
  TimeReport,
  TimeReportParams,
  TimeReportRow,
  UtilizationReport,
  BudgetBurnReport,
  TimeReminder,
  TimeReminderConfig,
  ReminderType,
  ProjectBudget,
  ProjectBudgetCreate,
  BudgetAlert,
  TimePolicy,
  TimePolicyCreate,
  TimerSession,
  TimerState,
  TimeTag,
  TimeSummary,
  WeeklyView,
  DailyBreakdown,
  BillableClassification,
} from './types';
```

### Validators (Zod)

```typescript
export {
  timeEntryCreateSchema,
  timeEntryUpdateSchema,
  timeEntryFilterSchema,
  timesheetCreateSchema,
  timesheetSubmitSchema,
  approvalDecisionSchema,
  billableRateCreateSchema,
  overtimeRuleCreateSchema,
  timeReportParamsSchema,
  reminderConfigSchema,
  projectBudgetCreateSchema,
  timePolicyCreateSchema,
  timerStartSchema,
  timerStopSchema,
} from './validators';
```

### Hooks (React)

```typescript
export { useTimeEntries }           from './hooks/useTimeEntries';
export { useTimesheet }             from './hooks/useTimesheet';
export { useTimer }                 from './hooks/useTimer';
export { useTimesheetApproval }     from './hooks/useTimesheetApproval';
export { useBillableRates }         from './hooks/useBillableRates';
export { useTimeReports }           from './hooks/useTimeReports';
export { useProjectBudget }         from './hooks/useProjectBudget';
export { useWeeklyView }            from './hooks/useWeeklyView';
export { useOvertimeSummary }       from './hooks/useOvertimeSummary';
```

### Events

```typescript
export {
  TIME_ENTRY_CREATED,
  TIME_ENTRY_UPDATED,
  TIME_ENTRY_DELETED,
  TIMESHEET_SUBMITTED,
  TIMESHEET_APPROVED,
  TIMESHEET_REJECTED,
  TIMESHEET_LOCKED,
  TIMESHEET_REOPENED,
  TIMER_STARTED,
  TIMER_STOPPED,
  TIMER_DISCARDED,
  OVERTIME_DETECTED,
  OVERTIME_APPROVED,
  BUDGET_THRESHOLD_REACHED,
  BUDGET_EXCEEDED,
  REMINDER_SENT,
  RATE_CHANGED,
} from './events';
```

### Constants

```typescript
export {
  TIMESHEET_STATUSES,
  BILLABLE_CLASSIFICATIONS,
  OVERTIME_TYPES,
  REMINDER_TYPES,
  DEFAULT_WORK_HOURS_PER_DAY,
  DEFAULT_WORK_DAYS_PER_WEEK,
  MAX_DAILY_HOURS,
  MAX_ENTRY_DURATION_HOURS,
  MINIMUM_ENTRY_MINUTES,
  ROUNDING_INCREMENTS,
  BUDGET_ALERT_THRESHOLDS,
} from './constants';
```

---

## 3. Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Client Applications                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │ Weekly View  │  │ Timer Widget │  │ Approval UI  │  │ Reports │ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └────┬────┘ │
│         │                │                  │               │       │
│  ┌──────┴──────┐  ┌──────┴───────┐  ┌──────┴───────┐  ┌────┴────┐ │
│  │useWeeklyView│  │  useTimer    │  │useApproval   │  │useReport│ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └────┬────┘ │
└─────────┼────────────────┼──────────────────┼───────────────┼──────┘
          │                │                  │               │
          ▼                ▼                  ▼               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          tRPC Router                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ timeRouter                                                    │   │
│  │  ├── entry.*        (CRUD, list, filter, bulk)               │   │
│  │  ├── timer.*        (start, stop, discard, status)           │   │
│  │  ├── timesheet.*    (create, submit, reopen, lock)           │   │
│  │  ├── approval.*     (approve, reject, batch, delegate)       │   │
│  │  ├── rate.*         (get, set, resolve, history)             │   │
│  │  ├── overtime.*     (calculate, rules, approve)              │   │
│  │  ├── budget.*       (get, set, alerts, burn)                 │   │
│  │  ├── report.*       (summary, utilization, billing, export)  │   │
│  │  ├── reminder.*     (config, send, history)                  │   │
│  │  └── policy.*       (get, set, validate)                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Service Layer                                 │
│                                                                      │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────────────┐    │
│  │ TimeService   │  │TimesheetService│  │   TimerService        │    │
│  │              │  │                │  │                       │    │
│  │ • create     │  │ • generate     │  │ • start               │    │
│  │ • update     │  │ • submit       │  │ • stop                │    │
│  │ • delete     │  │ • reopen       │  │ • discard             │    │
│  │ • list       │  │ • lock         │  │ • getActive           │    │
│  │ • bulkCreate │  │ • getWeekly    │  │ • syncOffline         │    │
│  └──────┬───────┘  └───────┬────────┘  └───────────┬───────────┘    │
│         │                  │                        │               │
│  ┌──────┴───────┐  ┌──────┴─────────┐  ┌──────────┴────────────┐   │
│  │ApprovalSvc   │  │BillingRateSvc  │  │   OvertimeService     │   │
│  │              │  │                │  │                       │   │
│  │ • approve    │  │ • resolve      │  │ • calculate           │   │
│  │ • reject     │  │ • setRate      │  │ • getRules            │   │
│  │ • delegate   │  │ • getHistory   │  │ • setRules            │   │
│  │ • batchAct   │  │ • cascade      │  │ • approveOvertime     │   │
│  └──────────────┘  └────────────────┘  └────────────────────────┘   │
│                                                                      │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────────────┐    │
│  │TimeReportSvc │  │TimeReminderSvc │  │ProjectBudgetService   │    │
│  │              │  │                │  │                       │    │
│  │ • summary    │  │ • configure    │  │ • setBudget           │    │
│  │ • utilization│  │ • sendPending  │  │ • getBurn             │    │
│  │ • billing    │  │ • getHistory   │  │ • checkAlerts         │    │
│  │ • export     │  │ • preview      │  │ • forecast            │    │
│  └──────────────┘  └────────────────┘  └───────────────────────┘    │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Data Access Layer                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Drizzle ORM + Supabase PostgreSQL                            │   │
│  │                                                              │   │
│  │  time_entries ─────────┐                                     │   │
│  │  timesheets ───────────┼── timesheet_approvals               │   │
│  │  billable_rates ───────┤                                     │   │
│  │  overtime_rules ───────┤                                     │   │
│  │  time_tags ────────────┼── time_entry_tags (junction)        │   │
│  │  project_budgets ──────┤                                     │   │
│  │  time_reminders ───────┤                                     │   │
│  │  time_policies ────────┤                                     │   │
│  │  timer_sessions ───────┘                                     │   │
│  │                                                              │   │
│  │  All tables: tenant_id column + RLS policies                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Integration Layer                                  │
│                                                                      │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────────────┐    │
│  │ @mcv/ops/    │  │ @mcv/ops/      │  │ @mcv/ops/             │    │
│  │   billing    │  │   payroll      │  │   projects            │    │
│  │              │  │                │  │                       │    │
│  │ Invoice gen  │  │ Hours export   │  │ Task time sync        │    │
│  │ Rate sync    │  │ Overtime data  │  │ Budget tracking       │    │
│  └──────────────┘  └────────────────┘  └───────────────────────┘    │
│                                                                      │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────────────┐    │
│  │ @mcv/ops/    │  │ @mcv/comms/    │  │ @mcv/ops/             │    │
│  │   leave      │  │   notify       │  │   calendar            │    │
│  │              │  │                │  │                       │    │
│  │ PTO display  │  │ Reminders      │  │ Event blocking        │    │
│  └──────────────┘  └────────────────┘  └───────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Timesheet Lifecycle

```
                    ┌─────────┐
          create    │  DRAFT  │◄──────────────────────┐
          ────────► │         │                        │
                    └────┬────┘                        │
                         │                             │
                    submit│                        reopen
                         │                             │
                         ▼                             │
                    ┌───────────┐                      │
                    │ SUBMITTED │──────────────────┐   │
                    │           │                  │   │
                    └─────┬─────┘                  │   │
                          │                        │   │
               ┌──────────┼──────────┐             │   │
               │          │          │             │   │
          approve│    reject│    request│            │   │
               │          │     changes│            │   │
               ▼          ▼          ▼             │   │
          ┌────────┐ ┌────────┐ ┌──────────┐       │   │
          │APPROVED│ │REJECTED│ │CHANGES   │       │   │
          │        │ │        │ │REQUESTED │       │   │
          └───┬────┘ └───┬────┘ └─────┬────┘       │   │
              │          │            │            │   │
         lock │     edit &│       edit &│            │   │
              │   resubmit│     resubmit│            │   │
              ▼          │            │            │   │
          ┌────────┐     │            │            │   │
          │ LOCKED │     └────────────┴────────────┘   │
          │        │                                   │
          └───┬────┘           (back to DRAFT ─────────┘
              │                 via admin reopen)
              │
         adjustment
         entry only
              │
              ▼
         (new entry with
          adjustment_for_id
          linking to original)
```

### Rate Resolution Cascade

When computing the billable rate for a time entry, the system traverses the following hierarchy from most specific to least specific. The first match wins:

```
┌─────────────────────────────────────────────────────┐
│ 1. Entry-Level Override                              │
│    (rate explicitly set on the time entry itself)    │
├─────────────────────────────────────────────────────┤
│ 2. Task Rate                                         │
│    (rate defined on the specific task)               │
├─────────────────────────────────────────────────────┤
│ 3. User + Project Rate                               │
│    (rate for this user on this specific project)     │
├─────────────────────────────────────────────────────┤
│ 4. Project Rate                                      │
│    (default rate for the project)                    │
├─────────────────────────────────────────────────────┤
│ 5. User + Client Rate                                │
│    (rate for this user with this client)             │
├─────────────────────────────────────────────────────┤
│ 6. Client Rate                                       │
│    (default rate for the client)                     │
├─────────────────────────────────────────────────────┤
│ 7. User Default Rate                                 │
│    (the user's standard billable rate)               │
├─────────────────────────────────────────────────────┤
│ 8. Organization Default Rate                         │
│    (tenant-wide fallback rate)                       │
└─────────────────────────────────────────────────────┘
```

### Event Flow

```
Time Entry Created
       │
       ├──► TIME_ENTRY_CREATED event
       │         │
       │         ├──► Update project budget burn
       │         ├──► Recalculate overtime for the day/week
       │         └──► Update timer session (if from timer)
       │
       ▼
Timesheet Submitted
       │
       ├──► TIMESHEET_SUBMITTED event
       │         │
       │         ├──► Notify approving manager
       │         ├──► Check auto-approval rules
       │         └──► Validate against time policies
       │
       ▼
Timesheet Approved
       │
       ├──► TIMESHEET_APPROVED event
       │         │
       │         ├──► Update billing pipeline (unbilled hours)
       │         ├──► Notify employee
       │         └──► Check if ready for payroll export
       │
       ▼
Timesheet Locked
       │
       ├──► TIMESHEET_LOCKED event
              │
              ├──► Freeze all entries (immutable)
              ├──► Generate billing records
              └──► Export to payroll queue
```

---

## 4. Core Interfaces

### TimeEntry

The fundamental unit of tracked time.

```typescript
/**
 * Represents a single time entry — a recorded block of work time.
 * 
 * Time entries can be created manually (duration-based or start/end),
 * from a running timer, or via bulk import. Each entry is scoped to
 * a tenant and linked to a user, with optional project/task/client
 * associations.
 */
interface TimeEntry {
  /** Unique identifier (UUID v7) */
  id: string;

  /** Tenant this entry belongs to */
  tenantId: string;

  /** User who performed the work */
  userId: string;

  /** Date the work was performed (YYYY-MM-DD, in tenant timezone) */
  date: string;

  /** 
   * Duration in minutes. Always positive. 
   * Computed from startTime/endTime if those are provided.
   * Minimum: 1 minute (configurable via time policy).
   */
  durationMinutes: number;

  /**
   * Start time (ISO 8601). Optional for duration-only entries.
   * Required when the tenant policy mandates start/end tracking.
   */
  startTime: string | null;

  /**
   * End time (ISO 8601). Optional for duration-only entries.
   * Must be after startTime when both are provided.
   */
  endTime: string | null;

  /** Free-text description of work performed */
  description: string;

  /** Optional project association */
  projectId: string | null;

  /** Optional task association (must belong to projectId if set) */
  taskId: string | null;

  /** Optional client association (inferred from project if not set) */
  clientId: string | null;

  /**
   * Billable classification.
   * - 'billable': Counts toward client invoicing
   * - 'non-billable': Internal/overhead time
   * - 'internal': Explicitly internal (training, admin, etc.)
   * - 'pro-bono': Billable-quality work provided free of charge
   */
  classification: BillableClassification;

  /**
   * Resolved billable rate in cents (e.g., 15000 = $150.00).
   * Null for non-billable entries. Computed via rate cascade at creation
   * and frozen once the parent timesheet is approved.
   */
  billableRateCents: number | null;

  /**
   * Computed billable amount in cents.
   * = (durationMinutes / 60) * billableRateCents
   * Null for non-billable entries.
   */
  billableAmountCents: number | null;

  /** 
   * Reference to the timesheet this entry belongs to.
   * Null if the entry is unassigned (standalone).
   */
  timesheetId: string | null;

  /**
   * If this entry is an adjustment, references the original entry.
   * Adjustment entries are the only way to modify locked timesheets.
   */
  adjustmentForId: string | null;

  /** Tags for categorization (e.g., 'meeting', 'code-review', 'travel') */
  tags: string[];

  /**
   * Source of the entry.
   * - 'manual': Entered by user via form
   * - 'timer': Created from a timer session
   * - 'import': Bulk imported (CSV, API)
   * - 'calendar': Synced from calendar event
   * - 'integration': From external tool (Jira, etc.)
   */
  source: 'manual' | 'timer' | 'import' | 'calendar' | 'integration';

  /** External reference (e.g., Jira ticket ID, calendar event ID) */
  externalRef: string | null;

  /** Whether this entry has been invoiced */
  invoiced: boolean;

  /** Reference to the invoice, if invoiced */
  invoiceId: string | null;

  /** Custom metadata (tenant-defined fields) */
  metadata: Record<string, unknown>;

  /** Created timestamp (ISO 8601) */
  createdAt: string;

  /** Last updated timestamp (ISO 8601) */
  updatedAt: string;

  /** Soft-delete timestamp */
  deletedAt: string | null;

  /** User who created the entry (may differ from userId for admin entries) */
  createdBy: string;
}
```

### TimeEntryCreate

```typescript
/**
 * Payload for creating a new time entry.
 * 
 * Either `durationMinutes` OR both `startTime`/`endTime` must be provided.
 * If start/end are given, duration is computed automatically.
 */
interface TimeEntryCreate {
  /** User ID (defaults to authenticated user; admins can set for others) */
  userId?: string;

  /** Date of work (YYYY-MM-DD). Defaults to today in tenant timezone. */
  date?: string;

  /** Duration in minutes (mutually exclusive with startTime/endTime) */
  durationMinutes?: number;

  /** Start time (ISO 8601) */
  startTime?: string;

  /** End time (ISO 8601) */
  endTime?: string;

  /** Description of work performed */
  description: string;

  /** Project to allocate time to */
  projectId?: string;

  /** Task within the project */
  taskId?: string;

  /** Client (inferred from project if omitted) */
  clientId?: string;

  /** Billable classification (defaults to project/tenant default) */
  classification?: BillableClassification;

  /** Override the resolved billable rate (requires permission) */
  billableRateCentsOverride?: number;

  /** Tags for the entry */
  tags?: string[];

  /** Source identifier */
  source?: 'manual' | 'timer' | 'import' | 'calendar' | 'integration';

  /** External reference ID */
  externalRef?: string;

  /** Custom metadata */
  metadata?: Record<string, unknown>;
}
```

### TimeEntryUpdate

```typescript
/**
 * Payload for updating an existing time entry.
 * 
 * Only provided fields are updated. Entries belonging to approved/locked
 * timesheets cannot be updated — create an adjustment entry instead.
 */
interface TimeEntryUpdate {
  date?: string;
  durationMinutes?: number;
  startTime?: string | null;
  endTime?: string | null;
  description?: string;
  projectId?: string | null;
  taskId?: string | null;
  clientId?: string | null;
  classification?: BillableClassification;
  billableRateCentsOverride?: number | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}
```

### TimeEntryFilter

```typescript
/**
 * Filter parameters for querying time entries.
 * All filters are AND-combined. Arrays use IN logic.
 */
interface TimeEntryFilter {
  /** Filter by user(s) */
  userIds?: string[];

  /** Filter by project(s) */
  projectIds?: string[];

  /** Filter by task(s) */
  taskIds?: string[];

  /** Filter by client(s) */
  clientIds?: string[];

  /** Filter by timesheet(s) */
  timesheetIds?: string[];

  /** Filter by classification(s) */
  classifications?: BillableClassification[];

  /** Filter by tag(s) — entries matching ANY of the provided tags */
  tags?: string[];

  /** Filter by source(s) */
  sources?: Array<'manual' | 'timer' | 'import' | 'calendar' | 'integration'>;

  /** Date range start (inclusive, YYYY-MM-DD) */
  dateFrom?: string;

  /** Date range end (inclusive, YYYY-MM-DD) */
  dateTo?: string;

  /** Minimum duration in minutes */
  minDurationMinutes?: number;

  /** Maximum duration in minutes */
  maxDurationMinutes?: number;

  /** Full-text search on description */
  search?: string;

  /** Filter by invoiced status */
  invoiced?: boolean;

  /** Include soft-deleted entries */
  includeDeleted?: boolean;

  /** Sort field */
  sortBy?: 'date' | 'createdAt' | 'durationMinutes' | 'billableAmountCents';

  /** Sort direction */
  sortDir?: 'asc' | 'desc';

  /** Pagination cursor */
  cursor?: string;

  /** Page size (default: 50, max: 200) */
  limit?: number;
}
```

### Timesheet

```typescript
/**
 * A timesheet aggregates time entries for a user over a defined period
 * (typically a week or bi-weekly period). Timesheets are the unit of
 * submission and approval.
 */
interface Timesheet {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** User this timesheet belongs to */
  userId: string;

  /** Period start date (inclusive, YYYY-MM-DD) */
  periodStart: string;

  /** Period end date (inclusive, YYYY-MM-DD) */
  periodEnd: string;

  /**
   * Period type.
   * - 'weekly': 7-day period (Mon–Sun or configurable)
   * - 'biweekly': 14-day period
   * - 'semi-monthly': 1st–15th and 16th–end
   * - 'monthly': Full calendar month
   */
  periodType: 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly';

  /**
   * Current status in the approval workflow.
   */
  status: TimesheetStatus;

  /** Total hours across all entries (computed, decimal) */
  totalHours: number;

  /** Total billable hours (computed, decimal) */
  billableHours: number;

  /** Total non-billable hours (computed, decimal) */
  nonBillableHours: number;

  /** Total billable amount in cents (computed) */
  totalBillableAmountCents: number;

  /** Total overtime hours for the period (computed) */
  overtimeHours: number;

  /** Regular (non-overtime) hours (computed) */
  regularHours: number;

  /** Submission timestamp (null if never submitted) */
  submittedAt: string | null;

  /** Notes from the submitter */
  submissionNotes: string | null;

  /** Current approver (user ID) */
  approverId: string | null;

  /** Approval timestamp */
  approvedAt: string | null;

  /** Lock timestamp (entries become immutable) */
  lockedAt: string | null;

  /** Who locked the timesheet */
  lockedBy: string | null;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

/**
 * Valid timesheet statuses.
 */
type TimesheetStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'locked';
```

### TimesheetApproval

```typescript
/**
 * Records an approval action on a timesheet. Multiple approval records
 * can exist for a single timesheet (e.g., rejected then approved).
 */
interface TimesheetApproval {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Timesheet being acted upon */
  timesheetId: string;

  /** User performing the approval action */
  approverId: string;

  /** The action taken */
  action: ApprovalAction;

  /** Comments from the approver */
  comments: string | null;

  /** Timestamp of the action */
  actionAt: string;

  /**
   * If this approval was delegated, the original approver.
   * Tracks the chain: original → delegated → actual approver.
   */
  delegatedFrom: string | null;

  /** Whether this was an auto-approval (by rule) */
  isAutoApproval: boolean;

  /** The rule that triggered auto-approval, if applicable */
  autoApprovalRuleId: string | null;
}

type ApprovalAction =
  | 'approve'
  | 'reject'
  | 'request_changes'
  | 'delegate'
  | 'reopen';

interface ApprovalDecision {
  timesheetId: string;
  action: 'approve' | 'reject' | 'request_changes';
  comments?: string;
}
```

### BillableRate

```typescript
/**
 * Defines a billable rate at a specific scope level.
 * Rates cascade from most specific to least specific.
 */
interface BillableRate {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /**
   * Scope of this rate definition.
   */
  scope: BillableRateScope;

  /** User this rate applies to (null for non-user scopes) */
  userId: string | null;

  /** Project this rate applies to (null for non-project scopes) */
  projectId: string | null;

  /** Client this rate applies to (null for non-client scopes) */
  clientId: string | null;

  /** Task this rate applies to (null for non-task scopes) */
  taskId: string | null;

  /** Rate in cents per hour (e.g., 15000 = $150.00/hr) */
  rateCentsPerHour: number;

  /** Currency code (ISO 4217, e.g., 'USD', 'CAD', 'EUR') */
  currency: string;

  /** Effective date (rate applies from this date forward) */
  effectiveFrom: string;

  /** Expiry date (null = no expiry) */
  effectiveTo: string | null;

  /** Whether this rate is currently active */
  isActive: boolean;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;

  /** Who last modified this rate */
  updatedBy: string;
}

type BillableRateScope =
  | 'organization'    // Tenant-wide default
  | 'user'            // User's default rate
  | 'client'          // Client default rate
  | 'user_client'     // User + client combination
  | 'project'         // Project default rate
  | 'user_project'    // User + project combination
  | 'task';           // Task-specific rate

/**
 * Result of resolving the applicable billable rate for a time entry.
 */
interface RateResolution {
  /** The resolved rate in cents per hour */
  rateCentsPerHour: number;

  /** Currency */
  currency: string;

  /** Which scope level the rate was resolved from */
  resolvedFrom: BillableRateScope;

  /** The specific rate record ID */
  rateId: string;

  /** Whether an override was applied at the entry level */
  isOverride: boolean;
}
```

### OvertimeRule

```typescript
/**
 * Defines overtime calculation rules for a tenant or user group.
 * 
 * Overtime is calculated automatically when time entries are created
 * or modified. Rules define thresholds (daily and/or weekly) and
 * multipliers for overtime pay.
 */
interface OvertimeRule {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Rule name (e.g., 'Standard Overtime', 'California Rules') */
  name: string;

  /** Description */
  description: string | null;

  /**
   * Daily overtime threshold in hours.
   * Hours beyond this in a single day count as overtime.
   * Null = no daily threshold (only weekly applies).
   */
  dailyThresholdHours: number | null;

  /**
   * Daily double-time threshold in hours.
   * Hours beyond this in a single day count as double-time.
   * Null = no double-time threshold.
   */
  dailyDoubleTimeThresholdHours: number | null;

  /**
   * Weekly overtime threshold in hours.
   * Hours beyond this in a work week count as overtime.
   * Null = no weekly threshold (only daily applies).
   */
  weeklyThresholdHours: number | null;

  /**
   * Weekly double-time threshold in hours.
   * Null = no weekly double-time.
   */
  weeklyDoubleTimeThresholdHours: number | null;

  /** Overtime rate multiplier (e.g., 1.5 for time-and-a-half) */
  overtimeMultiplier: number;

  /** Double-time rate multiplier (e.g., 2.0) */
  doubleTimeMultiplier: number;

  /**
   * Which day the work week starts on (0 = Sunday, 1 = Monday, etc.)
   * Used for weekly threshold calculations.
   */
  weekStartDay: number;

  /** Whether 7th consecutive workday triggers overtime (California-style) */
  seventhDayRule: boolean;

  /** User groups this rule applies to (empty = all users in tenant) */
  applicableUserGroups: string[];

  /** Specific users this rule applies to (overrides groups) */
  applicableUserIds: string[];

  /** Whether overtime requires separate approval */
  requiresApproval: boolean;

  /** Whether this rule is active */
  isActive: boolean;

  /** Priority (higher = checked first when multiple rules match) */
  priority: number;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

/**
 * Result of calculating overtime for a period.
 */
interface OvertimeCalculation {
  /** User ID */
  userId: string;

  /** Period analyzed */
  periodStart: string;
  periodEnd: string;

  /** Total hours in the period */
  totalHours: number;

  /** Regular (non-overtime) hours */
  regularHours: number;

  /** Overtime hours (1.5x) */
  overtimeHours: number;

  /** Double-time hours (2.0x) */
  doubleTimeHours: number;

  /** Daily breakdown */
  dailyBreakdown: DailyOvertimeBreakdown[];

  /** Which rule was applied */
  ruleId: string;
  ruleName: string;

  /** Whether any overtime was detected */
  hasOvertime: boolean;

  /** Whether overtime requires approval */
  requiresApproval: boolean;

  /** Approval status (null if no approval required) */
  approvalStatus: 'pending' | 'approved' | 'rejected' | null;
}

interface DailyOvertimeBreakdown {
  date: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  isSeventhConsecutiveDay: boolean;
}
```

### TimeReport

```typescript
/**
 * Parameters for generating time reports.
 */
interface TimeReportParams {
  /** Report type */
  type: 'summary' | 'detailed' | 'utilization' | 'billing' | 'overtime' | 'budget_burn';

  /** Date range */
  dateFrom: string;
  dateTo: string;

  /** Group results by */
  groupBy: Array<'user' | 'project' | 'client' | 'task' | 'tag' | 'date' | 'week' | 'month'>;

  /** Filter by users */
  userIds?: string[];

  /** Filter by projects */
  projectIds?: string[];

  /** Filter by clients */
  clientIds?: string[];

  /** Filter by classifications */
  classifications?: BillableClassification[];

  /** Include inactive users/projects */
  includeInactive?: boolean;

  /** Export format (null = JSON response) */
  exportFormat?: 'csv' | 'xlsx' | 'pdf' | null;

  /** Currency for monetary values */
  currency?: string;

  /** Timezone for date grouping */
  timezone?: string;
}

/**
 * Time report result.
 */
interface TimeReport {
  /** Report parameters used */
  params: TimeReportParams;

  /** Generated timestamp */
  generatedAt: string;

  /** Report rows */
  rows: TimeReportRow[];

  /** Summary totals */
  totals: {
    totalHours: number;
    billableHours: number;
    nonBillableHours: number;
    billableAmountCents: number;
    overtimeHours: number;
    entryCount: number;
  };

  /** If exported, the download URL */
  exportUrl?: string;
}

interface TimeReportRow {
  /** Group key values (matches groupBy params) */
  groupKeys: Record<string, string>;

  /** Group labels for display */
  groupLabels: Record<string, string>;

  /** Hours */
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;

  /** Monetary */
  billableAmountCents: number;

  /** Counts */
  entryCount: number;
  dayCount: number;

  /** Computed metrics */
  billablePercentage: number;
  averageHoursPerDay: number;

  /** Overtime (if applicable) */
  overtimeHours: number;

  /** Nested children (for multi-level grouping) */
  children?: TimeReportRow[];
}

/**
 * Utilization report — shows how team members' time is allocated.
 */
interface UtilizationReport {
  /** Period */
  dateFrom: string;
  dateTo: string;

  /** Per-user utilization */
  users: UserUtilization[];

  /** Team-wide averages */
  teamAverages: {
    utilizationRate: number;     // billable / available
    billablePercentage: number;  // billable / total tracked
    averageHoursPerDay: number;
    overtimeRate: number;
  };
}

interface UserUtilization {
  userId: string;
  userName: string;

  /** Available hours in the period (based on work schedule & PTO) */
  availableHours: number;

  /** Total tracked hours */
  trackedHours: number;

  /** Billable hours */
  billableHours: number;

  /** Non-billable hours */
  nonBillableHours: number;

  /** Utilization rate: billable / available (0–1) */
  utilizationRate: number;

  /** Billable %: billable / tracked (0–1) */
  billablePercentage: number;

  /** Overtime hours */
  overtimeHours: number;

  /** PTO hours taken in the period */
  ptoHours: number;

  /** Holiday hours in the period */
  holidayHours: number;

  /** Target utilization (from policy, if defined) */
  targetUtilization: number | null;

  /** Variance from target */
  utilizationVariance: number | null;
}
```

### ProjectBudget

```typescript
/**
 * Tracks time budget allocation and burn for a project.
 */
interface ProjectBudget {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Project this budget is for */
  projectId: string;

  /**
   * Budget type.
   * - 'hours': Budget is in hours
   * - 'amount': Budget is in monetary amount (cents)
   * - 'both': Both hours and amount are tracked
   */
  budgetType: 'hours' | 'amount' | 'both';

  /** Budgeted hours (null if amount-only) */
  budgetHours: number | null;

  /** Budgeted amount in cents (null if hours-only) */
  budgetAmountCents: number | null;

  /** Hours consumed so far (computed from approved timesheets) */
  consumedHours: number;

  /** Amount consumed in cents (computed) */
  consumedAmountCents: number;

  /** Remaining hours (computed) */
  remainingHours: number | null;

  /** Remaining amount in cents (computed) */
  remainingAmountCents: number | null;

  /** Burn percentage (0–100+, can exceed 100 if over-budget) */
  burnPercentage: number;

  /**
   * Alert thresholds (percentages at which alerts fire).
   * Default: [50, 75, 90, 100]
   */
  alertThresholds: number[];

  /** Highest threshold that has been triggered */
  lastAlertThreshold: number | null;

  /** Whether to block new entries when budget is exhausted */
  blockOnExhaustion: boolean;

  /** Budget period (null = lifetime of project) */
  periodStart: string | null;
  periodEnd: string | null;

  /** Notes */
  notes: string | null;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

/**
 * Budget alert triggered when a threshold is reached.
 */
interface BudgetAlert {
  projectId: string;
  projectName: string;
  budgetId: string;
  threshold: number;
  burnPercentage: number;
  consumedHours: number;
  budgetHours: number | null;
  consumedAmountCents: number;
  budgetAmountCents: number | null;
  isExhausted: boolean;
}
```

### TimeReminder

```typescript
/**
 * Configuration for time tracking reminders.
 */
interface TimeReminder {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Reminder type */
  type: ReminderType;

  /** Whether this reminder is enabled */
  enabled: boolean;

  /**
   * Schedule configuration.
   */
  schedule: ReminderSchedule;

  /** Who receives this reminder */
  recipientFilter: {
    /** All users in tenant */
    allUsers?: boolean;
    /** Specific user IDs */
    userIds?: string[];
    /** User groups */
    groupIds?: string[];
    /** Department IDs */
    departmentIds?: string[];
    /** Exclude specific users */
    excludeUserIds?: string[];
  };

  /** Notification channels */
  channels: Array<'email' | 'in_app' | 'slack' | 'teams' | 'push'>;

  /** Custom message template (supports variables) */
  messageTemplate: string | null;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

type ReminderType =
  | 'missing_timesheet'      // No timesheet submitted for period
  | 'incomplete_day'         // Day has < minimum hours logged
  | 'submission_deadline'    // Approaching submission cutoff
  | 'approval_pending'       // Timesheets waiting for approval
  | 'running_timer'          // Timer running for too long
  | 'weekly_summary';        // End-of-week summary

interface ReminderSchedule {
  /** Day(s) of week (0=Sun, 1=Mon, ..., 6=Sat) */
  daysOfWeek?: number[];

  /** Time of day (HH:mm in tenant timezone) */
  timeOfDay: string;

  /** For deadline reminders: hours before deadline */
  hoursBeforeDeadline?: number;

  /** For running timer: max hours before alert */
  maxTimerHours?: number;

  /** Timezone (defaults to tenant timezone) */
  timezone?: string;
}
```

### TimePolicy

```typescript
/**
 * Tenant-level time tracking policies that govern behavior and constraints.
 */
interface TimePolicy {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Policy name */
  name: string;

  /** Description */
  description: string | null;

  /**
   * Time entry requirements.
   */
  entryRequirements: {
    /** Whether start/end times are required (vs. duration-only) */
    requireStartEndTime: boolean;

    /** Whether a project is required on every entry */
    requireProject: boolean;

    /** Whether a task is required on every entry */
    requireTask: boolean;

    /** Whether a description is required */
    requireDescription: boolean;

    /** Minimum description length */
    minDescriptionLength: number;

    /** Minimum entry duration in minutes */
    minDurationMinutes: number;

    /** Maximum entry duration in hours (prevents accidental large entries) */
    maxDurationHours: number;

    /** Maximum hours per day (validation guard) */
    maxDailyHours: number;

    /** 
     * Rounding increment in minutes. 
     * 0 = no rounding, 6 = round to nearest 6 min (0.1 hr),
     * 15 = round to nearest quarter hour, 30 = half hour
     */
    roundingIncrement: number;

    /** Rounding direction */
    roundingDirection: 'nearest' | 'up' | 'down';
  };

  /**
   * Timesheet settings.
   */
  timesheetSettings: {
    /** Period type */
    periodType: 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly';

    /** Week start day (0=Sun, 1=Mon, ...) */
    weekStartDay: number;

    /** Auto-create timesheets for each period */
    autoCreate: boolean;

    /** Submission deadline: day of week (for weekly) or day of month */
    submissionDeadlineDay: number;

    /** Submission deadline: time of day (HH:mm) */
    submissionDeadlineTime: string;

    /** Allow late submissions */
    allowLateSubmission: boolean;

    /** Maximum days in the past for entry creation */
    maxRetroactiveDays: number;

    /** Maximum days in the future for entry creation */
    maxFutureDays: number;

    /** Lock timesheets automatically after approval */
    autoLockAfterApproval: boolean;

    /** Days after approval before auto-lock */
    autoLockDelayDays: number;
  };

  /**
   * Approval settings.
   */
  approvalSettings: {
    /** Whether timesheet approval is required */
    requireApproval: boolean;

    /** Auto-approve timesheets matching certain criteria */
    autoApprovalEnabled: boolean;

    /** Auto-approve if total hours <= this threshold */
    autoApprovalMaxHours: number | null;

    /** Auto-approve if no overtime */
    autoApprovalNoOvertimeOnly: boolean;

    /** Auto-approve for specific user groups */
    autoApprovalUserGroups: string[];

    /** Approval chain: ordered list of approver role/user resolution */
    approvalChain: ApprovalChainStep[];

    /** Allow self-approval (for managers/admins) */
    allowSelfApproval: boolean;

    /** Escalation: auto-approve after N days without action */
    escalationDays: number | null;

    /** Escalation: notify this user/role */
    escalationTarget: string | null;
  };

  /**
   * Work schedule defaults.
   */
  workSchedule: {
    /** Standard work hours per day */
    standardHoursPerDay: number;

    /** Standard work days per week */
    standardDaysPerWeek: number;

    /** Work days (0=Sun, ..., 6=Sat) */
    workDays: number[];

    /** Target utilization rate (0–1, e.g., 0.8 = 80%) */
    targetUtilization: number | null;
  };

  /** Whether this is the default policy for the tenant */
  isDefault: boolean;

  /** User groups this policy applies to (empty = all) */
  applicableUserGroups: string[];

  /** Priority (higher = checked first) */
  priority: number;

  /** Active flag */
  isActive: boolean;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

interface ApprovalChainStep {
  /** Step order (1-based) */
  order: number;

  /** How to resolve the approver */
  resolverType: 'direct_manager' | 'project_manager' | 'specific_user' | 'role';

  /** User ID (for specific_user resolver) */
  userId?: string;

  /** Role name (for role resolver) */
  roleName?: string;

  /** Whether this step is required or optional */
  required: boolean;
}
```

### TimerSession

```typescript
/**
 * Represents an active or completed timer session.
 * Timers run client-side with periodic server sync.
 */
interface TimerSession {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** User running the timer */
  userId: string;

  /** Current state */
  state: TimerState;

  /** When the timer was started (ISO 8601) */
  startedAt: string;

  /** When the timer was stopped (null if still running) */
  stoppedAt: string | null;

  /** When the timer was last paused (null if not paused) */
  pausedAt: string | null;

  /** Total paused duration in seconds */
  totalPausedSeconds: number;

  /** Effective elapsed seconds (total - paused) */
  elapsedSeconds: number;

  /** Description (can be updated while timer runs) */
  description: string;

  /** Pre-associated project */
  projectId: string | null;

  /** Pre-associated task */
  taskId: string | null;

  /** Pre-associated client */
  clientId: string | null;

  /** Tags */
  tags: string[];

  /** Classification */
  classification: BillableClassification | null;

  /**
   * If the timer was converted to a time entry, the entry ID.
   * Null if discarded or still running.
   */
  timeEntryId: string | null;

  /** Last sync timestamp (client → server) */
  lastSyncAt: string;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

type TimerState = 'running' | 'paused' | 'stopped' | 'discarded';
```

### TimeService

```typescript
/**
 * Core service for managing time entries.
 * 
 * All methods enforce tenant isolation via RLS context and validate
 * inputs against the applicable time policy.
 */
interface TimeService {
  /**
   * Create a new time entry.
   * 
   * - Validates against time policy (min/max duration, required fields, etc.)
   * - Resolves billable rate via the rate cascade
   * - Associates with an existing or auto-created timesheet
   * - Emits TIME_ENTRY_CREATED event
   * - Triggers budget recalculation if project is set
   * - Triggers overtime recalculation for the affected day/week
   * 
   * @throws TIME_ENTRY_POLICY_VIOLATION if the entry violates the tenant's time policy
   * @throws TIME_ENTRY_LOCKED_TIMESHEET if the target timesheet is locked
   * @throws TIME_ENTRY_DAILY_LIMIT_EXCEEDED if max daily hours would be exceeded
   * @throws TIME_ENTRY_OVERLAP if start/end overlaps with an existing entry
   * @throws TIME_ENTRY_FUTURE_DATE if the date exceeds the allowed future window
   * @throws TIME_ENTRY_RETROACTIVE_LIMIT if the date exceeds the allowed past window
   */
  create(input: TimeEntryCreate, ctx: TenantContext): Promise<TimeEntry>;

  /**
   * Update an existing time entry.
   * 
   * - Cannot update entries in approved/locked timesheets
   * - Recalculates billable amount if duration or rate changes
   * - Emits TIME_ENTRY_UPDATED event
   * 
   * @throws TIME_ENTRY_NOT_FOUND if the entry doesn't exist
   * @throws TIME_ENTRY_LOCKED_TIMESHEET if the parent timesheet is approved/locked
   * @throws TIME_ENTRY_PERMISSION_DENIED if the user can't edit this entry
   */
  update(id: string, input: TimeEntryUpdate, ctx: TenantContext): Promise<TimeEntry>;

  /**
   * Soft-delete a time entry.
   * 
   * - Cannot delete entries in approved/locked timesheets
   * - Emits TIME_ENTRY_DELETED event
   * - Recalculates timesheet totals
   */
  delete(id: string, ctx: TenantContext): Promise<void>;

  /**
   * Get a single time entry by ID.
   */
  getById(id: string, ctx: TenantContext): Promise<TimeEntry | null>;

  /**
   * List time entries with filtering and pagination.
   * Returns a cursor-paginated result set.
   */
  list(filter: TimeEntryFilter, ctx: TenantContext): Promise<{
    items: TimeEntry[];
    nextCursor: string | null;
    totalCount: number;
  }>;

  /**
   * Bulk create time entries.
   * 
   * Useful for weekly grid entry, CSV import, or template application.
   * Each entry is validated individually; the operation is atomic
   * (all succeed or all fail).
   * 
   * @param entries Array of entries to create (max 100 per call)
   * @throws TIME_ENTRY_BULK_LIMIT_EXCEEDED if > 100 entries
   */
  bulkCreate(entries: TimeEntryCreate[], ctx: TenantContext): Promise<TimeEntry[]>;

  /**
   * Bulk update time entries.
   * 
   * @param updates Array of { id, ...changes }
   */
  bulkUpdate(updates: Array<{ id: string } & TimeEntryUpdate>, ctx: TenantContext): Promise<TimeEntry[]>;

  /**
   * Bulk delete time entries.
   */
  bulkDelete(ids: string[], ctx: TenantContext): Promise<void>;

  /**
   * Create an adjustment entry for a locked timesheet.
   * 
   * The adjustment entry references the original and contains the delta.
   * Both positive (additional time) and negative (reduction) adjustments
   * are supported.
   */
  createAdjustment(
    originalEntryId: string,
    adjustment: TimeEntryCreate & { adjustmentReason: string },
    ctx: TenantContext,
  ): Promise<TimeEntry>;

  /**
   * Get a weekly view of time entries for a user.
   * Returns a structured grid suitable for rendering in a weekly timesheet UI.
   */
  getWeeklyView(
    userId: string,
    weekStart: string,
    ctx: TenantContext,
  ): Promise<WeeklyView>;

  /**
   * Get a daily breakdown of time for a specific date.
   */
  getDailyBreakdown(
    userId: string,
    date: string,
    ctx: TenantContext,
  ): Promise<DailyBreakdown>;

  /**
   * Get summary statistics for a date range.
   */
  getSummary(
    userId: string,
    dateFrom: string,
    dateTo: string,
    ctx: TenantContext,
  ): Promise<TimeSummary>;

  /**
   * Duplicate entries from one period to another (template application).
   * Copies project/task/description/tags but not times/durations.
   */
  duplicateEntries(
    sourceFrom: string,
    sourceTo: string,
    targetFrom: string,
    userId: string,
    ctx: TenantContext,
  ): Promise<TimeEntry[]>;
}
```

### WeeklyView & DailyBreakdown

```typescript
/**
 * Structured weekly view for rendering in a timesheet grid.
 */
interface WeeklyView {
  /** Week start date (YYYY-MM-DD) */
  weekStart: string;

  /** Week end date (YYYY-MM-DD) */
  weekEnd: string;

  /** User ID */
  userId: string;

  /** The associated timesheet (if one exists for this period) */
  timesheet: Timesheet | null;

  /**
   * Rows in the grid. Each row represents a project/task combination.
   */
  rows: WeeklyViewRow[];

  /**
   * Daily totals (index 0 = weekStart, index 6 = weekEnd).
   */
  dailyTotals: DailyTotal[];

  /** Week total hours */
  weekTotalHours: number;

  /** Week billable hours */
  weekBillableHours: number;

  /** Week overtime hours */
  weekOvertimeHours: number;

  /** PTO / holidays visible in this week */
  timeOff: TimeOffEntry[];
}

interface WeeklyViewRow {
  /** Project */
  projectId: string | null;
  projectName: string | null;

  /** Task */
  taskId: string | null;
  taskName: string | null;

  /** Client */
  clientId: string | null;
  clientName: string | null;

  /** Classification */
  classification: BillableClassification;

  /**
   * Hours per day (index 0 = weekStart, index 6 = weekEnd).
   * Each cell may have multiple entries.
   */
  dailyCells: DailyCell[];

  /** Row total hours */
  rowTotalHours: number;
}

interface DailyCell {
  /** Date (YYYY-MM-DD) */
  date: string;

  /** Total hours for this project/task on this day */
  totalHours: number;

  /** Individual entries */
  entries: TimeEntry[];
}

interface DailyTotal {
  date: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  isWorkDay: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  hasTimeOff: boolean;
  timeOffHours: number;
}

interface DailyBreakdown {
  date: string;
  userId: string;
  entries: TimeEntry[];
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  overtimeHours: number;
  regularHours: number;
  isComplete: boolean; // meets minimum daily hours
  targetHours: number; // from work schedule policy
  gaps: TimeGap[]; // untracked gaps (if start/end tracking enabled)
}

interface TimeGap {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

interface TimeOffEntry {
  date: string;
  type: 'pto' | 'holiday' | 'sick' | 'other';
  hours: number;
  description: string;
}
```

### Additional Supporting Types

```typescript
type BillableClassification = 'billable' | 'non-billable' | 'internal' | 'pro-bono';

interface TimeSummary {
  userId: string;
  dateFrom: string;
  dateTo: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  internalHours: number;
  proBonoHours: number;
  billableAmountCents: number;
  overtimeHours: number;
  regularHours: number;
  entryCount: number;
  dayCount: number;
  averageHoursPerDay: number;
  billablePercentage: number;
  utilizationRate: number;
  topProjects: Array<{ projectId: string; projectName: string; hours: number }>;
  topClients: Array<{ clientId: string; clientName: string; hours: number }>;
  topTags: Array<{ tag: string; hours: number }>;
}

interface BillableRateCreate {
  scope: BillableRateScope;
  userId?: string;
  projectId?: string;
  clientId?: string;
  taskId?: string;
  rateCentsPerHour: number;
  currency?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

interface OvertimeRuleCreate {
  name: string;
  description?: string;
  dailyThresholdHours?: number;
  dailyDoubleTimeThresholdHours?: number;
  weeklyThresholdHours?: number;
  weeklyDoubleTimeThresholdHours?: number;
  overtimeMultiplier?: number;
  doubleTimeMultiplier?: number;
  weekStartDay?: number;
  seventhDayRule?: boolean;
  applicableUserGroups?: string[];
  applicableUserIds?: string[];
  requiresApproval?: boolean;
  priority?: number;
}

interface ProjectBudgetCreate {
  projectId: string;
  budgetType: 'hours' | 'amount' | 'both';
  budgetHours?: number;
  budgetAmountCents?: number;
  alertThresholds?: number[];
  blockOnExhaustion?: boolean;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
}

interface TimePolicyCreate {
  name: string;
  description?: string;
  entryRequirements: TimePolicy['entryRequirements'];
  timesheetSettings: TimePolicy['timesheetSettings'];
  approvalSettings: TimePolicy['approvalSettings'];
  workSchedule: TimePolicy['workSchedule'];
  isDefault?: boolean;
  applicableUserGroups?: string[];
  priority?: number;
}

interface TimeReminderConfig {
  type: ReminderType;
  enabled: boolean;
  schedule: ReminderSchedule;
  recipientFilter: TimeReminder['recipientFilter'];
  channels: TimeReminder['channels'];
  messageTemplate?: string;
}

interface TimeTag {
  id: string;
  tenantId: string;
  name: string;
  color: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}
```

---

## 5. Database Schemas

### time_entries

```typescript
import { pgTable, uuid, text, integer, timestamp, date, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { tenantId } from '@mcv/db/columns';

export const timeEntries = pgTable('time_entries', {
  id:                    uuid('id').defaultRandom().primaryKey(),
  tenantId:              tenantId(),
  userId:                uuid('user_id').notNull().references(() => users.id),
  date:                  date('date').notNull(),
  durationMinutes:       integer('duration_minutes').notNull(),
  startTime:             timestamp('start_time', { withTimezone: true }),
  endTime:               timestamp('end_time', { withTimezone: true }),
  description:           text('description').notNull().default(''),
  projectId:             uuid('project_id').references(() => projects.id),
  taskId:                uuid('task_id').references(() => tasks.id),
  clientId:              uuid('client_id').references(() => clients.id),
  classification:        text('classification').notNull().default('billable'),
  billableRateCents:     integer('billable_rate_cents'),
  billableAmountCents:   integer('billable_amount_cents'),
  timesheetId:           uuid('timesheet_id').references(() => timesheets.id),
  adjustmentForId:       uuid('adjustment_for_id').references(() => timeEntries.id),
  source:                text('source').notNull().default('manual'),
  externalRef:           text('external_ref'),
  invoiced:              boolean('invoiced').notNull().default(false),
  invoiceId:             uuid('invoice_id'),
  metadata:              jsonb('metadata').notNull().default({}),
  createdBy:             uuid('created_by').notNull().references(() => users.id),
  createdAt:             timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt:             timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  tenantUserDateIdx:     index('idx_time_entries_tenant_user_date')
                           .on(table.tenantId, table.userId, table.date),
  tenantProjectIdx:      index('idx_time_entries_tenant_project')
                           .on(table.tenantId, table.projectId),
  tenantClientIdx:       index('idx_time_entries_tenant_client')
                           .on(table.tenantId, table.clientId),
  timesheetIdx:          index('idx_time_entries_timesheet')
                           .on(table.timesheetId),
  tenantDateIdx:         index('idx_time_entries_tenant_date')
                           .on(table.tenantId, table.date),
  adjustmentIdx:         index('idx_time_entries_adjustment')
                           .on(table.adjustmentForId),
  invoiceIdx:            index('idx_time_entries_invoice')
                           .on(table.invoiceId),
  sourceIdx:             index('idx_time_entries_source')
                           .on(table.tenantId, table.source),
}));
```

### timesheets

```typescript
export const timesheets = pgTable('timesheets', {
  id:                       uuid('id').defaultRandom().primaryKey(),
  tenantId:                 tenantId(),
  userId:                   uuid('user_id').notNull().references(() => users.id),
  periodStart:              date('period_start').notNull(),
  periodEnd:                date('period_end').notNull(),
  periodType:               text('period_type').notNull().default('weekly'),
  status:                   text('status').notNull().default('draft'),
  totalHours:               integer('total_hours_minutes').notNull().default(0), // stored in minutes for precision
  billableHours:            integer('billable_hours_minutes').notNull().default(0),
  nonBillableHours:         integer('non_billable_hours_minutes').notNull().default(0),
  totalBillableAmountCents: integer('total_billable_amount_cents').notNull().default(0),
  overtimeMinutes:          integer('overtime_minutes').notNull().default(0),
  regularMinutes:           integer('regular_minutes').notNull().default(0),
  submittedAt:              timestamp('submitted_at', { withTimezone: true }),
  submissionNotes:          text('submission_notes'),
  approverId:               uuid('approver_id').references(() => users.id),
  approvedAt:               timestamp('approved_at', { withTimezone: true }),
  lockedAt:                 timestamp('locked_at', { withTimezone: true }),
  lockedBy:                 uuid('locked_by').references(() => users.id),
  createdAt:                timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:                timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantUserPeriodIdx:      index('idx_timesheets_tenant_user_period')
                              .on(table.tenantId, table.userId, table.periodStart),
  tenantStatusIdx:          index('idx_timesheets_tenant_status')
                              .on(table.tenantId, table.status),
  approverIdx:              index('idx_timesheets_approver')
                              .on(table.approverId, table.status),
  uniqueUserPeriod:         index('idx_timesheets_unique_user_period')
                              .on(table.tenantId, table.userId, table.periodStart, table.periodEnd)
                              .unique(),
}));
```

### timesheet_approvals

```typescript
export const timesheetApprovals = pgTable('timesheet_approvals', {
  id:                   uuid('id').defaultRandom().primaryKey(),
  tenantId:             tenantId(),
  timesheetId:          uuid('timesheet_id').notNull().references(() => timesheets.id),
  approverId:           uuid('approver_id').notNull().references(() => users.id),
  action:               text('action').notNull(), // 'approve' | 'reject' | 'request_changes' | 'delegate' | 'reopen'
  comments:             text('comments'),
  actionAt:             timestamp('action_at', { withTimezone: true }).defaultNow().notNull(),
  delegatedFrom:        uuid('delegated_from').references(() => users.id),
  isAutoApproval:       boolean('is_auto_approval').notNull().default(false),
  autoApprovalRuleId:   uuid('auto_approval_rule_id'),
  createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  timesheetIdx:         index('idx_timesheet_approvals_timesheet')
                          .on(table.timesheetId),
  approverIdx:          index('idx_timesheet_approvals_approver')
                          .on(table.approverId),
  tenantActionIdx:      index('idx_timesheet_approvals_tenant_action')
                          .on(table.tenantId, table.action, table.actionAt),
}));
```

### billable_rates

```typescript
export const billableRates = pgTable('billable_rates', {
  id:                uuid('id').defaultRandom().primaryKey(),
  tenantId:          tenantId(),
  scope:             text('scope').notNull(), // BillableRateScope
  userId:            uuid('user_id').references(() => users.id),
  projectId:         uuid('project_id').references(() => projects.id),
  clientId:          uuid('client_id').references(() => clients.id),
  taskId:            uuid('task_id').references(() => tasks.id),
  rateCentsPerHour:  integer('rate_cents_per_hour').notNull(),
  currency:          text('currency').notNull().default('USD'),
  effectiveFrom:     date('effective_from').notNull(),
  effectiveTo:       date('effective_to'),
  isActive:          boolean('is_active').notNull().default(true),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy:         uuid('updated_by').notNull().references(() => users.id),
}, (table) => ({
  tenantScopeIdx:    index('idx_billable_rates_tenant_scope')
                       .on(table.tenantId, table.scope),
  userIdx:           index('idx_billable_rates_user')
                       .on(table.tenantId, table.userId),
  projectIdx:        index('idx_billable_rates_project')
                       .on(table.tenantId, table.projectId),
  clientIdx:         index('idx_billable_rates_client')
                       .on(table.tenantId, table.clientId),
  effectiveIdx:      index('idx_billable_rates_effective')
                       .on(table.tenantId, table.effectiveFrom, table.effectiveTo),
}));
```

### overtime_rules

```typescript
export const overtimeRules = pgTable('overtime_rules', {
  id:                              uuid('id').defaultRandom().primaryKey(),
  tenantId:                        tenantId(),
  name:                            text('name').notNull(),
  description:                     text('description'),
  dailyThresholdHours:             integer('daily_threshold_hours'),
  dailyDoubleTimeThresholdHours:   integer('daily_double_time_threshold_hours'),
  weeklyThresholdHours:            integer('weekly_threshold_hours'),
  weeklyDoubleTimeThresholdHours:  integer('weekly_double_time_threshold_hours'),
  overtimeMultiplier:              integer('overtime_multiplier_x100').notNull().default(150), // 150 = 1.5x
  doubleTimeMultiplier:            integer('double_time_multiplier_x100').notNull().default(200), // 200 = 2.0x
  weekStartDay:                    integer('week_start_day').notNull().default(1), // Monday
  seventhDayRule:                  boolean('seventh_day_rule').notNull().default(false),
  applicableUserGroups:            jsonb('applicable_user_groups').notNull().default([]),
  applicableUserIds:               jsonb('applicable_user_ids').notNull().default([]),
  requiresApproval:                boolean('requires_approval').notNull().default(true),
  isActive:                        boolean('is_active').notNull().default(true),
  priority:                        integer('priority').notNull().default(0),
  createdAt:                       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:                       timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantActiveIdx:                 index('idx_overtime_rules_tenant_active')
                                     .on(table.tenantId, table.isActive, table.priority),
}));
```

### time_tags

```typescript
export const timeTags = pgTable('time_tags', {
  id:          uuid('id').defaultRandom().primaryKey(),
  tenantId:    tenantId(),
  name:        text('name').notNull(),
  color:       text('color'),
  description: text('description'),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantNameIdx: index('idx_time_tags_tenant_name')
                   .on(table.tenantId, table.name).unique(),
}));

/**
 * Junction table for time entry ↔ tag many-to-many relationship.
 */
export const timeEntryTags = pgTable('time_entry_tags', {
  timeEntryId: uuid('time_entry_id').notNull().references(() => timeEntries.id, { onDelete: 'cascade' }),
  tagId:       uuid('tag_id').notNull().references(() => timeTags.id, { onDelete: 'cascade' }),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk:          index('pk_time_entry_tags').on(table.timeEntryId, table.tagId).unique(),
  tagIdx:      index('idx_time_entry_tags_tag').on(table.tagId),
}));
```

### project_budgets

```typescript
export const projectBudgets = pgTable('project_budgets', {
  id:                      uuid('id').defaultRandom().primaryKey(),
  tenantId:                tenantId(),
  projectId:               uuid('project_id').notNull().references(() => projects.id),
  budgetType:              text('budget_type').notNull().default('hours'),
  budgetHours:             integer('budget_hours_minutes'), // stored in minutes
  budgetAmountCents:       integer('budget_amount_cents'),
  consumedHoursMinutes:    integer('consumed_hours_minutes').notNull().default(0),
  consumedAmountCents:     integer('consumed_amount_cents').notNull().default(0),
  alertThresholds:         jsonb('alert_thresholds').notNull().default([50, 75, 90, 100]),
  lastAlertThreshold:      integer('last_alert_threshold'),
  blockOnExhaustion:       boolean('block_on_exhaustion').notNull().default(false),
  periodStart:             date('period_start'),
  periodEnd:               date('period_end'),
  notes:                   text('notes'),
  createdAt:               timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:               timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantProjectIdx:        index('idx_project_budgets_tenant_project')
                             .on(table.tenantId, table.projectId),
  projectUniqueIdx:        index('idx_project_budgets_unique')
                             .on(table.tenantId, table.projectId, table.periodStart)
                             .unique(),
}));
```

### time_reminders

```typescript
export const timeReminders = pgTable('time_reminders', {
  id:               uuid('id').defaultRandom().primaryKey(),
  tenantId:         tenantId(),
  type:             text('type').notNull(),
  enabled:          boolean('enabled').notNull().default(true),
  schedule:         jsonb('schedule').notNull(),
  recipientFilter:  jsonb('recipient_filter').notNull(),
  channels:         jsonb('channels').notNull().default(['email', 'in_app']),
  messageTemplate:  text('message_template'),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantTypeIdx:    index('idx_time_reminders_tenant_type')
                      .on(table.tenantId, table.type),
}));
```

### time_policies

```typescript
export const timePolicies = pgTable('time_policies', {
  id:                     uuid('id').defaultRandom().primaryKey(),
  tenantId:               tenantId(),
  name:                   text('name').notNull(),
  description:            text('description'),
  entryRequirements:      jsonb('entry_requirements').notNull(),
  timesheetSettings:      jsonb('timesheet_settings').notNull(),
  approvalSettings:       jsonb('approval_settings').notNull(),
  workSchedule:           jsonb('work_schedule').notNull(),
  isDefault:              boolean('is_default').notNull().default(false),
  applicableUserGroups:   jsonb('applicable_user_groups').notNull().default([]),
  priority:               integer('priority').notNull().default(0),
  isActive:               boolean('is_active').notNull().default(true),
  createdAt:              timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantDefaultIdx:       index('idx_time_policies_tenant_default')
                            .on(table.tenantId, table.isDefault),
  tenantActiveIdx:        index('idx_time_policies_tenant_active')
                            .on(table.tenantId, table.isActive, table.priority),
}));
```

### timer_sessions

```typescript
export const timerSessions = pgTable('timer_sessions', {
  id:                  uuid('id').defaultRandom().primaryKey(),
  tenantId:            tenantId(),
  userId:              uuid('user_id').notNull().references(() => users.id),
  state:               text('state').notNull().default('running'),
  startedAt:           timestamp('started_at', { withTimezone: true }).notNull(),
  stoppedAt:           timestamp('stopped_at', { withTimezone: true }),
  pausedAt:            timestamp('paused_at', { withTimezone: true }),
  totalPausedSeconds:  integer('total_paused_seconds').notNull().default(0),
  elapsedSeconds:      integer('elapsed_seconds').notNull().default(0),
  description:         text('description').notNull().default(''),
  projectId:           uuid('project_id').references(() => projects.id),
  taskId:              uuid('task_id').references(() => tasks.id),
  clientId:            uuid('client_id').references(() => clients.id),
  tags:                jsonb('tags').notNull().default([]),
  classification:      text('classification'),
  timeEntryId:         uuid('time_entry_id').references(() => timeEntries.id),
  lastSyncAt:          timestamp('last_sync_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantUserStateIdx:  index('idx_timer_sessions_tenant_user_state')
                         .on(table.tenantId, table.userId, table.state),
  activeTimerIdx:      index('idx_timer_sessions_active')
                         .on(table.tenantId, table.userId)
                         .where(sql`state = 'running' OR state = 'paused'`),
}));
```

### Row-Level Security Policies

All tables follow the standard MCV.ONE RLS pattern:

```sql
-- Example for time_entries (same pattern for all tables)
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Tenant isolation
CREATE POLICY "tenant_isolation" ON time_entries
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Users can see their own entries
CREATE POLICY "user_own_entries" ON time_entries
  FOR SELECT
  USING (
    user_id = current_setting('app.user_id')::uuid
    OR EXISTS (
      SELECT 1 FROM tenant_memberships
      WHERE tenant_id = time_entries.tenant_id
        AND user_id = current_setting('app.user_id')::uuid
        AND role IN ('admin', 'manager')
    )
  );

-- Users can insert their own entries (admins can insert for others)
CREATE POLICY "user_insert_entries" ON time_entries
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('app.user_id')::uuid
    OR EXISTS (
      SELECT 1 FROM tenant_memberships
      WHERE tenant_id = time_entries.tenant_id
        AND user_id = current_setting('app.user_id')::uuid
        AND role = 'admin'
    )
  );

-- Users can update their own draft entries; admins can update any
CREATE POLICY "user_update_entries" ON time_entries
  FOR UPDATE
  USING (
    (
      user_id = current_setting('app.user_id')::uuid
      AND timesheet_id IS NULL
      OR EXISTS (
        SELECT 1 FROM timesheets
        WHERE id = time_entries.timesheet_id
          AND status IN ('draft', 'rejected', 'changes_requested')
      )
    )
    OR EXISTS (
      SELECT 1 FROM tenant_memberships
      WHERE tenant_id = time_entries.tenant_id
        AND user_id = current_setting('app.user_id')::uuid
        AND role = 'admin'
    )
  );

-- Soft-delete only (no hard deletes except by system)
CREATE POLICY "user_soft_delete" ON time_entries
  FOR UPDATE
  USING (
    user_id = current_setting('app.user_id')::uuid
    OR EXISTS (
      SELECT 1 FROM tenant_memberships
      WHERE tenant_id = time_entries.tenant_id
        AND user_id = current_setting('app.user_id')::uuid
        AND role = 'admin'
    )
  );

-- Timesheet approvers can view entries for timesheets they approve
CREATE POLICY "approver_view_entries" ON time_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM timesheets
      WHERE id = time_entries.timesheet_id
        AND approver_id = current_setting('app.user_id')::uuid
    )
  );
```

### Materialized Views

```sql
-- Cached daily aggregation for reporting performance
CREATE MATERIALIZED VIEW mv_daily_time_summary AS
SELECT
  tenant_id,
  user_id,
  date,
  SUM(duration_minutes) AS total_minutes,
  SUM(CASE WHEN classification = 'billable' THEN duration_minutes ELSE 0 END) AS billable_minutes,
  SUM(CASE WHEN classification != 'billable' THEN duration_minutes ELSE 0 END) AS non_billable_minutes,
  SUM(COALESCE(billable_amount_cents, 0)) AS total_billable_cents,
  COUNT(*) AS entry_count,
  array_agg(DISTINCT project_id) FILTER (WHERE project_id IS NOT NULL) AS project_ids,
  array_agg(DISTINCT client_id) FILTER (WHERE client_id IS NOT NULL) AS client_ids
FROM time_entries
WHERE deleted_at IS NULL
GROUP BY tenant_id, user_id, date;

CREATE UNIQUE INDEX ON mv_daily_time_summary (tenant_id, user_id, date);

-- Refresh strategy: triggered by time entry changes, max once per minute
-- via pg_cron or application-level debounced refresh
```

---

## 6. Code Examples

### Example 1: Creating a Time Entry

```typescript
import { TimeService } from '@mcv/operations/time';

const timeService = new TimeService(db, eventBus);

// Duration-based entry
const entry = await timeService.create({
  description: 'Sprint planning meeting',
  durationMinutes: 90,
  date: '2026-02-09',
  projectId: 'proj_abc123',
  taskId: 'task_xyz789',
  classification: 'billable',
  tags: ['meeting', 'sprint-planning'],
}, ctx);

console.log(entry);
// {
//   id: '01956a3e-...',
//   tenantId: 'tenant_001',
//   userId: 'user_jane',
//   date: '2026-02-09',
//   durationMinutes: 90,
//   startTime: null,
//   endTime: null,
//   description: 'Sprint planning meeting',
//   projectId: 'proj_abc123',
//   taskId: 'task_xyz789',
//   clientId: 'client_acme',       // inferred from project
//   classification: 'billable',
//   billableRateCents: 15000,       // resolved: $150/hr
//   billableAmountCents: 22500,     // 1.5 hrs × $150 = $225
//   timesheetId: 'ts_wk202606',    // auto-associated
//   tags: ['meeting', 'sprint-planning'],
//   source: 'manual',
//   ...
// }

// Start/end-based entry
const detailedEntry = await timeService.create({
  description: 'Code review for PR #1234',
  startTime: '2026-02-09T14:00:00Z',
  endTime: '2026-02-09T16:30:00Z',
  projectId: 'proj_abc123',
  classification: 'billable',
  tags: ['code-review'],
}, ctx);
// durationMinutes is auto-computed as 150 (2.5 hours)
```

### Example 2: Using the Timer

```typescript
import { TimerService } from '@mcv/operations/time';

const timerService = new TimerService(db, eventBus);

// Start a timer
const session = await timerService.start({
  description: 'Working on feature #567',
  projectId: 'proj_abc123',
  taskId: 'task_feature567',
  tags: ['development'],
}, ctx);

console.log(session);
// {
//   id: 'timer_001',
//   state: 'running',
//   startedAt: '2026-02-09T10:00:00Z',
//   description: 'Working on feature #567',
//   ...
// }

// Pause the timer
await timerService.pause(session.id, ctx);

// Resume the timer
await timerService.resume(session.id, ctx);

// Update description while running
await timerService.updateDescription(session.id, 'Feature #567 — API endpoints', ctx);

// Stop and convert to time entry
const entry = await timerService.stop(session.id, {
  // Optionally override fields before saving
  classification: 'billable',
  roundToNearest: 15, // round to nearest 15 minutes
}, ctx);

console.log(entry);
// {
//   id: 'entry_from_timer',
//   durationMinutes: 120, // 2 hours (rounded from 1h52m)
//   source: 'timer',
//   ...
// }

// Discard a timer (no time entry created)
const anotherSession = await timerService.start({
  description: 'Quick test',
}, ctx);
await timerService.discard(anotherSession.id, ctx);

// Get current active timer for the user
const active = await timerService.getActive(ctx);
// Returns null if no timer is running, or the active TimerSession
```

### Example 3: Weekly Timesheet View & Submission

```typescript
import { TimeService, TimesheetService } from '@mcv/operations/time';

const timeService = new TimeService(db, eventBus);
const timesheetService = new TimesheetService(db, eventBus);

// Get the weekly view for rendering a timesheet grid
const weeklyView = await timeService.getWeeklyView(
  'user_jane',
  '2026-02-02', // Monday
  ctx,
);

console.log(weeklyView);
// {
//   weekStart: '2026-02-02',
//   weekEnd: '2026-02-08',
//   userId: 'user_jane',
//   timesheet: { id: 'ts_001', status: 'draft', ... },
//   rows: [
//     {
//       projectName: 'Acme Website Redesign',
//       taskName: 'Frontend Development',
//       classification: 'billable',
//       dailyCells: [
//         { date: '2026-02-02', totalHours: 8, entries: [...] },  // Mon
//         { date: '2026-02-03', totalHours: 7.5, entries: [...] }, // Tue
//         { date: '2026-02-04', totalHours: 6, entries: [...] },   // Wed
//         { date: '2026-02-05', totalHours: 8, entries: [...] },   // Thu
//         { date: '2026-02-06', totalHours: 4, entries: [...] },   // Fri
//         { date: '2026-02-07', totalHours: 0, entries: [] },      // Sat
//         { date: '2026-02-08', totalHours: 0, entries: [] },      // Sun
//       ],
//       rowTotalHours: 33.5,
//     },
//     {
//       projectName: 'Internal — Team Meetings',
//       taskName: null,
//       classification: 'non-billable',
//       dailyCells: [ ... ],
//       rowTotalHours: 5,
//     },
//   ],
//   dailyTotals: [
//     { date: '2026-02-02', totalHours: 8.5, billableHours: 8, ... },
//     ...
//   ],
//   weekTotalHours: 38.5,
//   weekBillableHours: 33.5,
//   weekOvertimeHours: 0,
//   timeOff: [],
// }

// Submit the timesheet for approval
const submitted = await timesheetService.submit(
  weeklyView.timesheet!.id,
  {
    notes: 'Completed sprint 14 frontend tasks. Thursday was client workshop.',
  },
  ctx,
);

console.log(submitted.status); // 'submitted'
console.log(submitted.submittedAt); // '2026-02-09T...'
```

### Example 4: Approval Workflow

```typescript
import { ApprovalService, TimesheetService } from '@mcv/operations/time';

const approvalService = new ApprovalService(db, eventBus);
const timesheetService = new TimesheetService(db, eventBus);

// Manager views pending timesheets
const pending = await timesheetService.listPendingApproval(managerCtx);
// [
//   { id: 'ts_001', userId: 'user_jane', totalHours: 38.5, ... },
//   { id: 'ts_002', userId: 'user_bob', totalHours: 42.0, overtimeHours: 2, ... },
//   { id: 'ts_003', userId: 'user_alice', totalHours: 40.0, ... },
// ]

// Approve a single timesheet
const approval = await approvalService.decide({
  timesheetId: 'ts_001',
  action: 'approve',
  comments: 'Looks good. Nice work on the sprint deliverables.',
}, managerCtx);

// Reject with change requests
await approvalService.decide({
  timesheetId: 'ts_002',
  action: 'request_changes',
  comments: 'Please split the 10-hour Thursday entry — need to see client workshop vs. travel time.',
}, managerCtx);

// Batch approve multiple timesheets
const batchResults = await approvalService.batchDecide([
  { timesheetId: 'ts_003', action: 'approve' },
  { timesheetId: 'ts_004', action: 'approve' },
  { timesheetId: 'ts_005', action: 'approve', comments: 'Approved — overtime pre-authorized.' },
], managerCtx);
// Returns array of results, one per timesheet

// Delegate approval to another manager
await approvalService.delegate({
  timesheetId: 'ts_006',
  delegateTo: 'user_otherManager',
  reason: 'On vacation this week — delegating to Sarah.',
}, managerCtx);

// Auto-approval check (called by system on submission)
const autoResult = await approvalService.checkAutoApproval('ts_007', ctx);
// { autoApproved: true, ruleId: 'rule_001', reason: 'Under 40 hours, no overtime' }
// or
// { autoApproved: false, reason: 'Contains overtime — requires manual review' }
```

### Example 5: Billable Rate Management

```typescript
import { BillingRateService } from '@mcv/operations/time';

const rateService = new BillingRateService(db, eventBus);

// Set organization default rate
await rateService.setRate({
  scope: 'organization',
  rateCentsPerHour: 12500, // $125/hr
  currency: 'USD',
  effectiveFrom: '2026-01-01',
}, adminCtx);

// Set a user's default rate
await rateService.setRate({
  scope: 'user',
  userId: 'user_jane',
  rateCentsPerHour: 17500, // $175/hr (senior developer)
  currency: 'USD',
  effectiveFrom: '2026-01-01',
}, adminCtx);

// Set a client-specific rate
await rateService.setRate({
  scope: 'client',
  clientId: 'client_acme',
  rateCentsPerHour: 15000, // $150/hr for Acme
  currency: 'USD',
  effectiveFrom: '2026-01-01',
}, adminCtx);

// Set a special rate for a specific user on a specific project
await rateService.setRate({
  scope: 'user_project',
  userId: 'user_jane',
  projectId: 'proj_special',
  rateCentsPerHour: 20000, // $200/hr
  currency: 'USD',
  effectiveFrom: '2026-02-01',
  effectiveTo: '2026-06-30', // expires after 5 months
}, adminCtx);

// Resolve the effective rate for a time entry
const resolution = await rateService.resolve({
  userId: 'user_jane',
  projectId: 'proj_special',
  clientId: 'client_acme',
  date: '2026-03-15',
}, ctx);

console.log(resolution);
// {
//   rateCentsPerHour: 20000,
//   currency: 'USD',
//   resolvedFrom: 'user_project',
//   rateId: 'rate_xyz',
//   isOverride: false,
// }

// Get rate history for audit
const history = await rateService.getHistory({
  userId: 'user_jane',
  scope: 'user',
}, ctx);
// Returns all rate records, including expired ones, sorted by effectiveFrom
```

### Example 6: Overtime Calculation

```typescript
import { OvertimeService } from '@mcv/operations/time';

const overtimeService = new OvertimeService(db, eventBus);

// Configure overtime rules
await overtimeService.createRule({
  name: 'Standard US Overtime',
  dailyThresholdHours: 8,            // OT after 8 hrs/day
  dailyDoubleTimeThresholdHours: 12, // double-time after 12 hrs/day
  weeklyThresholdHours: 40,          // OT after 40 hrs/week
  overtimeMultiplier: 1.5,
  doubleTimeMultiplier: 2.0,
  weekStartDay: 1, // Monday
  seventhDayRule: false,
  requiresApproval: true,
}, adminCtx);

// Calculate overtime for a user's week
const overtime = await overtimeService.calculate(
  'user_bob',
  '2026-02-02', // Monday
  '2026-02-08', // Sunday
  ctx,
);

console.log(overtime);
// {
//   userId: 'user_bob',
//   periodStart: '2026-02-02',
//   periodEnd: '2026-02-08',
//   totalHours: 47,
//   regularHours: 40,
//   overtimeHours: 7,
//   doubleTimeHours: 0,
//   dailyBreakdown: [
//     { date: '2026-02-02', totalHours: 9, regularHours: 8, overtimeHours: 1, ... },
//     { date: '2026-02-03', totalHours: 10, regularHours: 8, overtimeHours: 2, ... },
//     { date: '2026-02-04', totalHours: 8, regularHours: 8, overtimeHours: 0, ... },
//     { date: '2026-02-05', totalHours: 10, regularHours: 8, overtimeHours: 2, ... },
//     { date: '2026-02-06', totalHours: 8, regularHours: 8, overtimeHours: 0, ... },
//     { date: '2026-02-07', totalHours: 2, regularHours: 0, overtimeHours: 2, ... },
//     // Note: Sat hours are weekly OT since daily < 8 but weekly > 40
//     { date: '2026-02-08', totalHours: 0, ... },
//   ],
//   hasOvertime: true,
//   requiresApproval: true,
//   approvalStatus: 'pending',
// }

// Approve overtime
await overtimeService.approveOvertime({
  userId: 'user_bob',
  periodStart: '2026-02-02',
  periodEnd: '2026-02-08',
  comments: 'Approved — sprint deadline required extra hours.',
}, managerCtx);
```

### Example 7: Generating Reports

```typescript
import { TimeReportService } from '@mcv/operations/time';

const reportService = new TimeReportService(db);

// Summary report grouped by project and user
const summary = await reportService.generate({
  type: 'summary',
  dateFrom: '2026-01-01',
  dateTo: '2026-01-31',
  groupBy: ['project', 'user'],
}, ctx);

console.log(summary.totals);
// {
//   totalHours: 1240,
//   billableHours: 992,
//   nonBillableHours: 248,
//   billableAmountCents: 14880000, // $148,800
//   overtimeHours: 47,
//   entryCount: 845,
// }

// Utilization report
const utilization = await reportService.generateUtilization({
  dateFrom: '2026-01-01',
  dateTo: '2026-01-31',
}, ctx);

console.log(utilization.teamAverages);
// {
//   utilizationRate: 0.78,       // 78% utilization
//   billablePercentage: 0.80,    // 80% of tracked time is billable
//   averageHoursPerDay: 7.8,
//   overtimeRate: 0.037,         // 3.7% overtime
// }

utilization.users.forEach(u => {
  console.log(`${u.userName}: ${(u.utilizationRate * 100).toFixed(1)}% utilized`);
});
// Jane Smith: 85.2% utilized
// Bob Johnson: 72.1% utilized
// Alice Williams: 78.4% utilized

// Budget burn report
const budgetReport = await reportService.generateBudgetBurn({
  projectIds: ['proj_abc123'],
  dateFrom: '2026-01-01',
  dateTo: '2026-02-28',
}, ctx);

// Export to CSV
const csvReport = await reportService.generate({
  type: 'detailed',
  dateFrom: '2026-01-01',
  dateTo: '2026-01-31',
  groupBy: ['date', 'user', 'project'],
  exportFormat: 'csv',
}, ctx);

console.log(csvReport.exportUrl);
// 'https://storage.mcv.one/reports/time/2026-01-report.csv?token=...'
```

### Example 8: Configuring Reminders & Policies

```typescript
import { TimeReminderService, TimePolicyService } from '@mcv/operations/time';

const reminderService = new TimeReminderService(db, eventBus);
const policyService = new TimePolicyService(db);

// Configure missing timesheet reminder
await reminderService.configure({
  type: 'missing_timesheet',
  enabled: true,
  schedule: {
    daysOfWeek: [5], // Friday
    timeOfDay: '16:00',
    timezone: 'America/Toronto',
  },
  recipientFilter: { allUsers: true },
  channels: ['email', 'in_app', 'slack'],
  messageTemplate:
    'Hey {{userName}}, your timesheet for {{periodLabel}} is still missing. ' +
    'Please submit by {{deadlineTime}} on {{deadlineDay}}.',
}, adminCtx);

// Configure running timer alert (timer running > 10 hours)
await reminderService.configure({
  type: 'running_timer',
  enabled: true,
  schedule: {
    maxTimerHours: 10,
    timeOfDay: '09:00',
  },
  recipientFilter: { allUsers: true },
  channels: ['in_app', 'push'],
}, adminCtx);

// Create a time policy for the engineering department
await policyService.create({
  name: 'Engineering Time Policy',
  description: 'Standard time tracking policy for engineering teams',
  entryRequirements: {
    requireStartEndTime: false,      // Duration-only is fine
    requireProject: true,            // Must associate with a project
    requireTask: false,              // Task optional
    requireDescription: true,        // Description required
    minDescriptionLength: 5,         // At least 5 chars
    minDurationMinutes: 15,          // Minimum 15-minute entries
    maxDurationHours: 12,            // Max 12 hours per entry
    maxDailyHours: 16,               // Sanity limit
    roundingIncrement: 15,           // Round to nearest 15 min
    roundingDirection: 'nearest',
  },
  timesheetSettings: {
    periodType: 'weekly',
    weekStartDay: 1,                 // Monday
    autoCreate: true,                // Auto-generate each week
    submissionDeadlineDay: 1,        // Monday (following week)
    submissionDeadlineTime: '12:00', // Noon
    allowLateSubmission: true,
    maxRetroactiveDays: 14,          // Can log up to 2 weeks back
    maxFutureDays: 1,                // Can log 1 day ahead
    autoLockAfterApproval: true,
    autoLockDelayDays: 3,            // Lock 3 days after approval
  },
  approvalSettings: {
    requireApproval: true,
    autoApprovalEnabled: true,
    autoApprovalMaxHours: 45,        // Auto-approve ≤ 45 hours
    autoApprovalNoOvertimeOnly: false,
    autoApprovalUserGroups: [],
    approvalChain: [
      { order: 1, resolverType: 'direct_manager', required: true },
    ],
    allowSelfApproval: false,
    escalationDays: 5,               // Auto-escalate after 5 days
    escalationTarget: 'role:hr_admin',
  },
  workSchedule: {
    standardHoursPerDay: 8,
    standardDaysPerWeek: 5,
    workDays: [1, 2, 3, 4, 5],      // Mon–Fri
    targetUtilization: 0.80,         // 80% target
  },
  applicableUserGroups: ['engineering'],
  priority: 10,
}, adminCtx);
```

---

## 7. Error Codes

All errors extend the base `McvError` class with a structured `code` field following the pattern `TIME_*`.

| Code | HTTP | Description |
|---|---|---|
| `TIME_ENTRY_NOT_FOUND` | 404 | Time entry with the given ID does not exist or is not accessible |
| `TIME_ENTRY_POLICY_VIOLATION` | 422 | Time entry violates the applicable time policy (e.g., missing required fields, duration out of range) |
| `TIME_ENTRY_LOCKED_TIMESHEET` | 409 | Cannot modify an entry belonging to an approved or locked timesheet |
| `TIME_ENTRY_DAILY_LIMIT_EXCEEDED` | 422 | Creating/updating this entry would exceed the maximum daily hours configured in the time policy |
| `TIME_ENTRY_OVERLAP` | 409 | Start/end time overlaps with an existing entry for the same user on the same day |
| `TIME_ENTRY_FUTURE_DATE` | 422 | Entry date exceeds the allowed future window defined by time policy `maxFutureDays` |
| `TIME_ENTRY_RETROACTIVE_LIMIT` | 422 | Entry date exceeds the allowed retroactive window defined by time policy `maxRetroactiveDays` |
| `TIME_ENTRY_PERMISSION_DENIED` | 403 | User does not have permission to create/edit/delete this time entry |
| `TIME_ENTRY_BULK_LIMIT_EXCEEDED` | 422 | Bulk operation exceeds the maximum entries per call (default: 100) |
| `TIME_ENTRY_INVALID_DURATION` | 422 | Duration is negative, zero (below minimum), or exceeds maximum allowed |
| `TIME_ENTRY_INVALID_TIME_RANGE` | 422 | End time is before start time, or the range spans midnight without explicit permission |
| `TIME_TIMESHEET_NOT_FOUND` | 404 | Timesheet with the given ID does not exist or is not accessible |
| `TIME_TIMESHEET_ALREADY_SUBMITTED` | 409 | Timesheet is already in submitted status; cannot submit again |
| `TIME_TIMESHEET_NOT_SUBMITTABLE` | 422 | Timesheet cannot be submitted (e.g., no entries, incomplete required days) |
| `TIME_TIMESHEET_INVALID_STATUS_TRANSITION` | 409 | Attempted status transition is not allowed (e.g., draft → locked, locked → draft without admin) |
| `TIME_APPROVAL_NOT_AUTHORIZED` | 403 | User is not authorized to approve/reject this timesheet |
| `TIME_APPROVAL_SELF_NOT_ALLOWED` | 403 | Self-approval is disabled by the time policy |
| `TIME_APPROVAL_ALREADY_DECIDED` | 409 | Timesheet has already been approved/rejected since the user last viewed it |
| `TIME_RATE_NOT_FOUND` | 404 | No billable rate found for the given scope and parameters |
| `TIME_RATE_OVERLAP` | 409 | New rate's effective date range overlaps with an existing rate for the same scope |
| `TIME_RATE_INVALID_AMOUNT` | 422 | Rate amount is negative or exceeds the configured maximum |
| `TIME_TIMER_ALREADY_RUNNING` | 409 | User already has an active timer; stop or discard it before starting a new one |
| `TIME_TIMER_NOT_FOUND` | 404 | Timer session does not exist or is not accessible |
| `TIME_TIMER_NOT_RUNNING` | 409 | Cannot stop/pause a timer that is not in the 'running' state |
| `TIME_TIMER_ALREADY_STOPPED` | 409 | Timer has already been stopped or discarded |
| `TIME_OVERTIME_RULE_NOT_FOUND` | 404 | Overtime rule with the given ID does not exist |
| `TIME_OVERTIME_RULE_CONFLICT` | 409 | New rule conflicts with an existing rule for the same user group |
| `TIME_BUDGET_NOT_FOUND` | 404 | Project budget configuration not found |
| `TIME_BUDGET_EXHAUSTED` | 422 | Project budget has been exhausted and `blockOnExhaustion` is enabled |
| `TIME_BUDGET_INVALID_AMOUNT` | 422 | Budget amount is negative or logically invalid |
| `TIME_POLICY_NOT_FOUND` | 404 | Time policy not found |
| `TIME_POLICY_CONFLICT` | 409 | Multiple default policies detected or conflicting policy priorities |
| `TIME_REMINDER_NOT_FOUND` | 404 | Reminder configuration not found |
| `TIME_REMINDER_INVALID_SCHEDULE` | 422 | Reminder schedule is invalid (e.g., no days selected, invalid time format) |
| `TIME_REPORT_INVALID_PARAMS` | 422 | Report parameters are invalid (e.g., dateFrom > dateTo, unknown groupBy field) |
| `TIME_REPORT_TOO_LARGE` | 413 | Report result set exceeds the maximum allowed size; narrow the date range or filters |
| `TIME_EXPORT_FAILED` | 500 | Report export to file failed (storage error, timeout, etc.) |
| `TIME_INTEGRATION_SYNC_FAILED` | 502 | External integration sync failed (calendar, payroll, etc.) |

### Error Response Format

```typescript
{
  "error": {
    "code": "TIME_ENTRY_DAILY_LIMIT_EXCEEDED",
    "message": "Adding 4 hours on 2026-02-09 would bring the daily total to 18 hours, exceeding the maximum of 16 hours.",
    "details": {
      "date": "2026-02-09",
      "currentDailyHours": 14,
      "requestedHours": 4,
      "maxDailyHours": 16,
      "policyId": "policy_eng_001"
    },
    "traceId": "tr_abc123def456"
  }
}
```

---

## 8. Security

### Authentication & Authorization

| Operation | Required Role | Additional Conditions |
|---|---|---|
| Create own time entry | `member` | Must not violate time policy |
| Create entry for another user | `admin` | — |
| View own entries | `member` | — |
| View team entries | `manager` | Must be direct/indirect manager |
| View all entries | `admin` | — |
| Submit own timesheet | `member` | Timesheet must be in `draft` or `changes_requested` |
| Approve/reject timesheet | `manager` | Must be assigned approver or admin |
| Batch approve | `manager` | — |
| Delegate approval | `manager` | — |
| Set billable rates | `admin` | — |
| View billable rates | `manager` | — |
| Configure overtime rules | `admin` | — |
| Approve overtime | `manager` | — |
| Configure time policies | `admin` | — |
| Configure reminders | `admin` | — |
| Generate reports (own) | `member` | — |
| Generate reports (team) | `manager` | — |
| Generate reports (all) | `admin` | — |
| Lock/unlock timesheets | `admin` | — |
| Create adjustment entries | `admin` | Requires adjustment reason |
| Delete time entries | `member` (own) / `admin` (others) | Cannot delete from approved/locked timesheets |
| Set project budgets | `manager` / `admin` | Must be project manager or admin |

### Tenant Isolation

All database operations are scoped by `tenant_id` via PostgreSQL Row-Level Security. The tenant context is injected at the connection level:

```sql
-- Set at the beginning of each request
SET LOCAL app.tenant_id = '<tenant-uuid>';
SET LOCAL app.user_id = '<user-uuid>';
SET LOCAL app.user_role = '<role>';
```

**No application code can bypass RLS.** Even if a bug constructs a query without a `WHERE tenant_id = ...` clause, the RLS policy prevents cross-tenant data access at the database level.

### Data Protection

| Protection | Implementation |
|---|---|
| **Immutability** | Locked timesheets cannot be modified; corrections create adjustment entries with full audit trail |
| **Audit Logging** | All mutations (create, update, delete, approve, reject) are logged to the platform audit log with actor, timestamp, and before/after state |
| **Soft Deletes** | Time entries use soft deletes (`deleted_at` timestamp); hard deletes are disabled at the RLS level |
| **Rate Privacy** | Billable rates are only visible to `admin` and `manager` roles; regular users see their own resolved rate on entries but not the rate table |
| **PII Scope** | User IDs and names are referenced; no additional PII is stored in time tracking tables |
| **Input Validation** | All inputs are validated via Zod schemas before reaching the service layer |
| **SQL Injection** | Prevented by Drizzle ORM parameterized queries; no raw SQL interpolation |
| **Rate Limiting** | tRPC routes enforce per-user rate limits: 100 entries/min for creates, 1000 reads/min |

### Sensitive Fields

Fields that require elevated permissions to read or write:

| Field | Read | Write |
|---|---|---|
| `billableRateCents` | `member` (own entry) / `manager` / `admin` | `admin` only (via rate override) |
| `billableAmountCents` | `member` (own entry) / `manager` / `admin` | Computed (cannot be set directly) |
| Other user's entries | `manager` / `admin` | `admin` only |
| Approval history | `member` (own timesheet) / `manager` / `admin` | System-generated |
| Rate configurations | `manager` / `admin` | `admin` only |

### Compliance Considerations

- **Labor Law Compliance**: Overtime rules can be configured to match jurisdiction-specific requirements (FLSA, California, EU Working Time Directive, etc.)
- **Record Retention**: Time entries and timesheets are never hard-deleted; retention policies can be configured per tenant
- **Break Tracking**: For jurisdictions requiring break documentation, gaps in tracked time can be analyzed and reported
- **Data Export**: Users can request a full export of their time data (GDPR data portability)
- **Right to Erasure**: Anonymization (replacing user details while retaining aggregate data) is supported for GDPR compliance

---

## 9. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (Supabase) |
| `TIME_DEFAULT_TIMEZONE` | No | `UTC` | Default timezone for date calculations when tenant has no timezone configured |
| `TIME_MAX_BULK_ENTRIES` | No | `100` | Maximum entries per bulk create/update call |
| `TIME_MAX_DAILY_HOURS` | No | `24` | Absolute maximum hours per day (system-wide guard, policies can set lower) |
| `TIME_MAX_ENTRY_DURATION_HOURS` | No | `24` | Maximum duration for a single entry |
| `TIME_MIN_ENTRY_MINUTES` | No | `1` | Minimum duration for a single entry |
| `TIME_TIMER_MAX_HOURS` | No | `24` | Maximum hours a timer can run before auto-stop |
| `TIME_TIMER_SYNC_INTERVAL_SECONDS` | No | `60` | How often the client should sync timer state to the server |
| `TIME_REPORT_MAX_DATE_RANGE_DAYS` | No | `366` | Maximum date range for a single report query |
| `TIME_REPORT_MAX_ROWS` | No | `50000` | Maximum rows in a report before requiring export |
| `TIME_MATERIALIZED_VIEW_REFRESH_INTERVAL_MS` | No | `60000` | Minimum interval between materialized view refreshes |
| `TIME_RATE_MAX_CENTS_PER_HOUR` | No | `100000` | Maximum billable rate ($1,000/hr) — sanity guard |
| `TIME_BUDGET_ALERT_CHANNELS` | No | `email,in_app` | Default notification channels for budget alerts |
| `TIME_REMINDER_FROM_EMAIL` | No | `timesheets@mcv.one` | Sender email address for timesheet reminders |
| `TIME_REMINDER_BATCH_SIZE` | No | `50` | Maximum reminders sent per batch (rate limiting) |
| `TIME_OVERTIME_CALC_CACHE_TTL_SECONDS` | No | `300` | Cache TTL for overtime calculations |
| `TIME_EXPORT_STORAGE_BUCKET` | No | `time-reports` | Supabase storage bucket for report exports |
| `TIME_EXPORT_URL_EXPIRY_SECONDS` | No | `3600` | Signed URL expiry for report downloads |
| `TIME_CALENDAR_SYNC_ENABLED` | No | `false` | Enable calendar integration for time entry suggestions |
| `TIME_PAYROLL_EXPORT_FORMAT` | No | `csv` | Default format for payroll exports (`csv`, `json`, `aba`) |

### Example `.env`

```env
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
TIME_DEFAULT_TIMEZONE=America/Toronto
TIME_MAX_BULK_ENTRIES=100
TIME_MAX_DAILY_HOURS=24
TIME_TIMER_MAX_HOURS=24
TIME_TIMER_SYNC_INTERVAL_SECONDS=60
TIME_REPORT_MAX_DATE_RANGE_DAYS=366
TIME_REPORT_MAX_ROWS=50000
TIME_RATE_MAX_CENTS_PER_HOUR=100000
TIME_BUDGET_ALERT_CHANNELS=email,in_app
TIME_EXPORT_STORAGE_BUCKET=time-reports
TIME_EXPORT_URL_EXPIRY_SECONDS=3600
TIME_CALENDAR_SYNC_ENABLED=false
TIME_PAYROLL_EXPORT_FORMAT=csv
```

---

## 10. Dependencies

### Internal Dependencies

| Package | Purpose |
|---|---|
| `@mcv/db` | Database connection, Drizzle instance, tenant RLS helpers, shared column types |
| `@mcv/auth` | Authentication context, user identity, role verification |
| `@mcv/events` | Event bus for publishing domain events (TIME_ENTRY_CREATED, etc.) |
| `@mcv/validation` | Shared Zod utilities, common validators (UUID, ISO date, etc.) |
| `@mcv/errors` | Base `McvError` class, error code registry, HTTP status mapping |
| `@mcv/audit` | Audit log integration for mutation tracking |
| `@mcv/notifications` | Notification delivery (email, in-app, Slack, push) for reminders |
| `@mcv/storage` | File storage for report exports (Supabase Storage wrapper) |
| `@mcv/operations/projects` | Project and task references, project manager resolution |
| `@mcv/operations/clients` | Client references, client-level rate resolution |
| `@mcv/operations/billing` | Invoice generation from approved timesheets, billing pipeline |
| `@mcv/operations/payroll` | Payroll export integration, approved hours sync |
| `@mcv/operations/leave` | PTO and holiday data for timesheet views and utilization calculations |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.36.x` | SQL query builder and ORM |
| `@trpc/server` | `^11.x` | tRPC router and procedure definitions |
| `zod` | `^3.23.x` | Runtime input validation |
| `date-fns` | `^4.x` | Date arithmetic (week boundaries, period calculations, etc.) |
| `date-fns-tz` | `^3.x` | Timezone-aware date operations |
| `decimal.js` | `^10.x` | Precise decimal arithmetic for rate calculations (avoids floating-point errors) |
| `csv-stringify` | `^6.x` | CSV generation for report exports |
| `exceljs` | `^4.x` | XLSX generation for report exports |
| `uuid` | `^10.x` | UUID v7 generation for time-ordered IDs |

### Peer Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | `^2.x` | Supabase client (provided by host application) |
| `react` | `^18.x \|\| ^19.x` | Required for hooks (optional — server-only usage doesn't need React) |

---

## 11. Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── time-entry.service.test.ts
│   │   ├── timesheet.service.test.ts
│   │   ├── timer.service.test.ts
│   │   ├── approval.service.test.ts
│   │   ├── billing-rate.service.test.ts
│   │   ├── overtime.service.test.ts
│   │   ├── time-report.service.test.ts
│   │   ├── project-budget.service.test.ts
│   │   ├── time-policy.service.test.ts
│   │   ├── time-reminder.service.test.ts
│   │   ├── rate-resolution.test.ts
│   │   └── validators.test.ts
│   ├── integration/
│   │   ├── time-entry.integration.test.ts
│   │   ├── timesheet-workflow.integration.test.ts
│   │   ├── approval-workflow.integration.test.ts
│   │   ├── overtime-calculation.integration.test.ts
│   │   ├── billing-integration.integration.test.ts
│   │   ├── budget-tracking.integration.test.ts
│   │   └── rls-isolation.integration.test.ts
│   └── e2e/
│       ├── weekly-timesheet.e2e.test.ts
│       ├── timer-workflow.e2e.test.ts
│       └── report-export.e2e.test.ts
```

### Running Tests

```bash
# All tests
pnpm test --filter=@mcv/operations-time

# Unit tests only
pnpm test --filter=@mcv/operations-time -- --testPathPattern=unit

# Integration tests (requires database)
pnpm test --filter=@mcv/operations-time -- --testPathPattern=integration

# E2E tests
pnpm test --filter=@mcv/operations-time -- --testPathPattern=e2e

# Watch mode
pnpm test --filter=@mcv/operations-time -- --watch

# Coverage
pnpm test --filter=@mcv/operations-time -- --coverage
```

### Unit Test Example: Time Entry Creation

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeService } from '../services/time.service';
import { createMockDb, createMockEventBus, createMockContext } from '@mcv/testing';

describe('TimeService.create', () => {
  let service: TimeService;
  let db: ReturnType<typeof createMockDb>;
  let eventBus: ReturnType<typeof createMockEventBus>;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    db = createMockDb();
    eventBus = createMockEventBus();
    service = new TimeService(db, eventBus);
    ctx = createMockContext({
      tenantId: 'tenant_001',
      userId: 'user_jane',
      role: 'member',
    });
  });

  it('should create a duration-based time entry', async () => {
    db.query.timeEntries.findMany.mockResolvedValue([]);
    db.query.timePolicies.findFirst.mockResolvedValue({
      entryRequirements: {
        requireProject: false,
        requireDescription: true,
        minDescriptionLength: 1,
        minDurationMinutes: 1,
        maxDurationHours: 24,
        maxDailyHours: 24,
        roundingIncrement: 0,
        roundingDirection: 'nearest',
      },
    });
    db.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'entry_001',
          tenantId: 'tenant_001',
          userId: 'user_jane',
          date: '2026-02-09',
          durationMinutes: 90,
          description: 'Sprint planning',
          classification: 'billable',
          billableRateCents: 15000,
          billableAmountCents: 22500,
        }]),
      }),
    });

    const entry = await service.create({
      description: 'Sprint planning',
      durationMinutes: 90,
      date: '2026-02-09',
      classification: 'billable',
    }, ctx);

    expect(entry.id).toBe('entry_001');
    expect(entry.durationMinutes).toBe(90);
    expect(entry.billableAmountCents).toBe(22500); // 1.5h × $150
    expect(eventBus.emit).toHaveBeenCalledWith(
      'TIME_ENTRY_CREATED',
      expect.objectContaining({ entryId: 'entry_001' }),
    );
  });

  it('should reject entries exceeding daily limit', async () => {
    // Existing entries total 14 hours
    db.query.timeEntries.findMany.mockResolvedValue([
      { durationMinutes: 480 }, // 8h
      { durationMinutes: 360 }, // 6h
    ]);
    db.query.timePolicies.findFirst.mockResolvedValue({
      entryRequirements: {
        maxDailyHours: 16,
        minDurationMinutes: 1,
        maxDurationHours: 24,
        roundingIncrement: 0,
      },
    });

    await expect(
      service.create({
        description: 'Extra work',
        durationMinutes: 240, // 4h — would make 18h total
        date: '2026-02-09',
      }, ctx),
    ).rejects.toThrow('TIME_ENTRY_DAILY_LIMIT_EXCEEDED');
  });

  it('should auto-compute duration from start/end times', async () => {
    db.query.timeEntries.findMany.mockResolvedValue([]);
    db.query.timePolicies.findFirst.mockResolvedValue({
      entryRequirements: {
        minDurationMinutes: 1,
        maxDurationHours: 24,
        maxDailyHours: 24,
        roundingIncrement: 0,
      },
    });
    db.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'entry_002',
          durationMinutes: 150,
          startTime: '2026-02-09T14:00:00Z',
          endTime: '2026-02-09T16:30:00Z',
        }]),
      }),
    });

    const entry = await service.create({
      description: 'Code review',
      startTime: '2026-02-09T14:00:00Z',
      endTime: '2026-02-09T16:30:00Z',
    }, ctx);

    expect(entry.durationMinutes).toBe(150); // 2.5 hours
  });

  it('should reject overlapping time entries', async () => {
    db.query.timeEntries.findMany.mockResolvedValue([{
      startTime: '2026-02-09T13:00:00Z',
      endTime: '2026-02-09T15:00:00Z',
    }]);
    db.query.timePolicies.findFirst.mockResolvedValue({
      entryRequirements: {
        minDurationMinutes: 1,
        maxDurationHours: 24,
        maxDailyHours: 24,
        roundingIncrement: 0,
      },
    });

    await expect(
      service.create({
        description: 'Overlapping meeting',
        startTime: '2026-02-09T14:00:00Z', // Overlaps with existing
        endTime: '2026-02-09T16:00:00Z',
      }, ctx),
    ).rejects.toThrow('TIME_ENTRY_OVERLAP');
  });

  it('should round duration to nearest increment', async () => {
    db.query.timeEntries.findMany.mockResolvedValue([]);
    db.query.timePolicies.findFirst.mockResolvedValue({
      entryRequirements: {
        minDurationMinutes: 1,
        maxDurationHours: 24,
        maxDailyHours: 24,
        roundingIncrement: 15,
        roundingDirection: 'nearest',
      },
    });
    db.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockImplementation(async () => [{
          id: 'entry_003',
          durationMinutes: 30, // 22 minutes rounds to 30
        }]),
      }),
    });

    const entry = await service.create({
      description: 'Quick call',
      durationMinutes: 22, // Should round to 30 (nearest 15)
    }, ctx);

    expect(entry.durationMinutes).toBe(30);
  });
});
```

### Integration Test Example: Timesheet Approval Workflow

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, seedTestData, cleanupTestDb } from '@mcv/testing/db';
import { TimeService } from '../services/time.service';
import { TimesheetService } from '../services/timesheet.service';
import { ApprovalService } from '../services/approval.service';
import { EventBus } from '@mcv/events';

describe('Timesheet Approval Workflow', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  let timeService: TimeService;
  let timesheetService: TimesheetService;
  let approvalService: ApprovalService;
  let eventBus: EventBus;

  const tenantId = 'test_tenant';
  const userId = 'test_user';
  const managerId = 'test_manager';

  beforeAll(async () => {
    db = await createTestDb();
    eventBus = new EventBus();
    timeService = new TimeService(db, eventBus);
    timesheetService = new TimesheetService(db, eventBus);
    approvalService = new ApprovalService(db, eventBus);

    await seedTestData(db, {
      tenants: [{ id: tenantId }],
      users: [
        { id: userId, tenantId, role: 'member' },
        { id: managerId, tenantId, role: 'manager' },
      ],
      timePolicies: [{
        tenantId,
        isDefault: true,
        timesheetSettings: { periodType: 'weekly', weekStartDay: 1 },
        approvalSettings: {
          requireApproval: true,
          approvalChain: [{ order: 1, resolverType: 'direct_manager', required: true }],
        },
      }],
    });
  });

  afterAll(async () => {
    await cleanupTestDb(db);
  });

  it('should complete full workflow: draft → submitted → approved → locked', async () => {
    const userCtx = { tenantId, userId, role: 'member' as const };
    const managerCtx = { tenantId, userId: managerId, role: 'manager' as const };

    // Step 1: Create time entries for the week
    for (let day = 2; day <= 6; day++) {
      await timeService.create({
        description: `Work on day ${day}`,
        durationMinutes: 480, // 8 hours
        date: `2026-02-0${day}`,
        classification: 'billable',
      }, userCtx);
    }

    // Step 2: Verify timesheet was auto-created
    const weeklyView = await timeService.getWeeklyView(userId, '2026-02-02', userCtx);
    expect(weeklyView.timesheet).not.toBeNull();
    expect(weeklyView.timesheet!.status).toBe('draft');
    expect(weeklyView.weekTotalHours).toBe(40);

    const timesheetId = weeklyView.timesheet!.id;

    // Step 3: Submit the timesheet
    const submitted = await timesheetService.submit(timesheetId, {
      notes: 'Complete week, all billable.',
    }, userCtx);
    expect(submitted.status).toBe('submitted');
    expect(submitted.submittedAt).not.toBeNull();

    // Step 4: Verify it appears in manager's pending list
    const pending = await timesheetService.listPendingApproval(managerCtx);
    expect(pending.some(ts => ts.id === timesheetId)).toBe(true);

    // Step 5: Manager approves
    const approval = await approvalService.decide({
      timesheetId,
      action: 'approve',
      comments: 'Looks good.',
    }, managerCtx);
    expect(approval.action).toBe('approve');

    // Step 6: Verify status is approved
    const approved = await timesheetService.getById(timesheetId, userCtx);
    expect(approved!.status).toBe('approved');
    expect(approved!.approvedAt).not.toBeNull();

    // Step 7: Lock the timesheet
    const locked = await timesheetService.lock(timesheetId, managerCtx);
    expect(locked.status).toBe('locked');
    expect(locked.lockedAt).not.toBeNull();

    // Step 8: Verify entries cannot be modified
    const entries = await timeService.list({ timesheetIds: [timesheetId] }, userCtx);
    await expect(
      timeService.update(entries.items[0].id, { durationMinutes: 600 }, userCtx),
    ).rejects.toThrow('TIME_ENTRY_LOCKED_TIMESHEET');
  });

  it('should handle rejection and resubmission', async () => {
    const userCtx = { tenantId, userId, role: 'member' as const };
    const managerCtx = { tenantId, userId: managerId, role: 'manager' as const };

    // Create and submit a timesheet
    await timeService.create({
      description: 'Vague work',
      durationMinutes: 2400, // 40 hours in one entry (suspicious)
      date: '2026-02-09',
    }, userCtx);

    const view = await timeService.getWeeklyView(userId, '2026-02-09', userCtx);
    await timesheetService.submit(view.timesheet!.id, {}, userCtx);

    // Manager rejects
    await approvalService.decide({
      timesheetId: view.timesheet!.id,
      action: 'request_changes',
      comments: 'Please break this into individual daily entries with specific descriptions.',
    }, managerCtx);

    // Verify status
    const rejected = await timesheetService.getById(view.timesheet!.id, userCtx);
    expect(rejected!.status).toBe('changes_requested');

    // User can now edit entries
    const entries = await timeService.list(
      { timesheetIds: [view.timesheet!.id] },
      userCtx,
    );
    await timeService.update(entries.items[0].id, {
      description: 'Client meeting and development work — detailed breakdown',
      durationMinutes: 480,
    }, userCtx);

    // Resubmit
    const resubmitted = await timesheetService.submit(view.timesheet!.id, {
      notes: 'Revised with detailed entries.',
    }, userCtx);
    expect(resubmitted.status).toBe('submitted');
  });
});
```

### RLS Isolation Test

```typescript
import { describe, it, expect } from 'vitest';
import { createTestDb, seedTestData } from '@mcv/testing/db';
import { TimeService } from '../services/time.service';
import { EventBus } from '@mcv/events';

describe('RLS Tenant Isolation', () => {
  it('should prevent cross-tenant data access', async () => {
    const db = await createTestDb();
    const eventBus = new EventBus();
    const service = new TimeService(db, eventBus);

    await seedTestData(db, {
      tenants: [{ id: 'tenant_a' }, { id: 'tenant_b' }],
      users: [
        { id: 'user_a', tenantId: 'tenant_a', role: 'admin' },
        { id: 'user_b', tenantId: 'tenant_b', role: 'admin' },
      ],
    });

    // Create entry in tenant A
    const entryA = await service.create({
      description: 'Tenant A work',
      durationMinutes: 60,
    }, { tenantId: 'tenant_a', userId: 'user_a', role: 'admin' });

    // Tenant B cannot see tenant A's entry
    const resultB = await service.getById(
      entryA.id,
      { tenantId: 'tenant_b', userId: 'user_b', role: 'admin' },
    );
    expect(resultB).toBeNull();

    // Tenant B cannot list tenant A's entries
    const listB = await service.list(
      {},
      { tenantId: 'tenant_b', userId: 'user_b', role: 'admin' },
    );
    expect(listB.items).toHaveLength(0);

    // Tenant A can see their own entry
    const resultA = await service.getById(
      entryA.id,
      { tenantId: 'tenant_a', userId: 'user_a', role: 'admin' },
    );
    expect(resultA).not.toBeNull();
    expect(resultA!.id).toBe(entryA.id);
  });
});
```

### Test Coverage Targets

| Category | Target | Rationale |
|---|---|---|
| **Unit Tests** | ≥ 90% line coverage | Core business logic (rate resolution, overtime calc, policy validation) |
| **Integration Tests** | ≥ 80% line coverage | Database interactions, RLS policies, workflow transitions |
| **E2E Tests** | Key user flows | Weekly timesheet completion, timer workflow, report export |
| **Mutation Testing** | ≥ 70% mutation score | Ensures tests actually validate behavior, not just coverage |

### Test Fixtures

```typescript
// fixtures/time-entry.fixture.ts
export const createTimeEntryFixture = (overrides?: Partial<TimeEntry>): TimeEntry => ({
  id: 'entry_fixture_001',
  tenantId: 'tenant_test',
  userId: 'user_test',
  date: '2026-02-09',
  durationMinutes: 480,
  startTime: null,
  endTime: null,
  description: 'Test entry',
  projectId: null,
  taskId: null,
  clientId: null,
  classification: 'billable',
  billableRateCents: 15000,
  billableAmountCents: 120000,
  timesheetId: null,
  adjustmentForId: null,
  tags: [],
  source: 'manual',
  externalRef: null,
  invoiced: false,
  invoiceId: null,
  metadata: {},
  createdAt: '2026-02-09T10:00:00Z',
  updatedAt: '2026-02-09T10:00:00Z',
  deletedAt: null,
  createdBy: 'user_test',
  ...overrides,
});

// fixtures/timesheet.fixture.ts
export const createTimesheetFixture = (overrides?: Partial<Timesheet>): Timesheet => ({
  id: 'ts_fixture_001',
  tenantId: 'tenant_test',
  userId: 'user_test',
  periodStart: '2026-02-02',
  periodEnd: '2026-02-08',
  periodType: 'weekly',
  status: 'draft',
  totalHours: 40,
  billableHours: 32,
  nonBillableHours: 8,
  totalBillableAmountCents: 480000,
  overtimeHours: 0,
  regularHours: 40,
  submittedAt: null,
  submissionNotes: null,
  approverId: null,
  approvedAt: null,
  lockedAt: null,
  lockedBy: null,
  createdAt: '2026-02-02T00:00:00Z',
  updatedAt: '2026-02-08T23:59:59Z',
  ...overrides,
});
```

---

## Appendix: Migration SQL

```sql
-- Migration: 001_create_time_tracking_tables.sql

-- Time entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  description TEXT NOT NULL DEFAULT '',
  project_id UUID REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id),
  client_id UUID REFERENCES clients(id),
  classification TEXT NOT NULL DEFAULT 'billable'
    CHECK (classification IN ('billable', 'non-billable', 'internal', 'pro-bono')),
  billable_rate_cents INTEGER,
  billable_amount_cents INTEGER,
  timesheet_id UUID REFERENCES timesheets(id),
  adjustment_for_id UUID REFERENCES time_entries(id),
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'timer', 'import', 'calendar', 'integration')),
  external_ref TEXT,
  invoiced BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT chk_time_range CHECK (
    start_time IS NULL OR end_time IS NULL OR end_time > start_time
  ),
  CONSTRAINT chk_billable_amount CHECK (
    (classification != 'billable' AND billable_amount_cents IS NULL)
    OR (classification = 'billable')
  )
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Timesheets
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'weekly'
    CHECK (period_type IN ('weekly', 'biweekly', 'semi-monthly', 'monthly')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'changes_requested', 'locked')),
  total_hours_minutes INTEGER NOT NULL DEFAULT 0,
  billable_hours_minutes INTEGER NOT NULL DEFAULT 0,
  non_billable_hours_minutes INTEGER NOT NULL DEFAULT 0,
  total_billable_amount_cents INTEGER NOT NULL DEFAULT 0,
  overtime_minutes INTEGER NOT NULL DEFAULT 0,
  regular_minutes INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  submission_notes TEXT,
  approver_id UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT chk_period CHECK (period_end >= period_start),
  CONSTRAINT uq_user_period UNIQUE (tenant_id, user_id, period_start, period_end)
);

ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Indexes (abbreviated — see schema section for full list)
CREATE INDEX idx_time_entries_tenant_user_date ON time_entries(tenant_id, user_id, date);
CREATE INDEX idx_time_entries_tenant_project ON time_entries(tenant_id, project_id);
CREATE INDEX idx_timesheets_tenant_user_period ON timesheets(tenant_id, user_id, period_start);
CREATE INDEX idx_timesheets_tenant_status ON timesheets(tenant_id, status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_timesheets_updated_at
  BEFORE UPDATE ON timesheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

*This document is auto-generated from source and manually curated. Last updated: 2026-02-09.*