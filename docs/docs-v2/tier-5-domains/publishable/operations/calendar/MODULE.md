# @mcv/operations/calendar

> Operational scheduling engine for the MCV.ONE platform — shift management, resource allocation, capacity planning, on-call rotations, and compliance-aware schedule generation.

**Module:** `@mcv/operations/calendar`  
**Layer:** Tier 5 — Domain (Operations)  
**Since:** 0.19.0  
**Status:** Stable  
**Maintainers:** MCV Operations Team

---

## Table of Contents

- [Purpose](#purpose)
- [Key Concepts](#key-concepts)
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
- [Changelog](#changelog)

---

## Purpose

The Operations Calendar module provides enterprise-grade operational scheduling capabilities that are fundamentally distinct from the personal calendar found in `@mcv/nexus/calendar`. While the Nexus calendar manages individual user schedules (meetings, reminders, personal events), the Operations Calendar is concerned with **organizational scheduling** — the coordination of people, resources, and time across operational workflows.

### Why a Separate Operations Calendar?

Personal calendars and operational calendars serve different masters:

| Dimension | Nexus Calendar | Operations Calendar |
|-----------|---------------|---------------------|
| **Scope** | Individual user | Organization / team / department |
| **Primary entities** | Events, meetings | Shifts, resource blocks, capacity plans |
| **Ownership** | User-owned | Org-owned, role-managed |
| **Conflict model** | Soft (double-booking allowed) | Hard (constraint-enforced) |
| **Compliance** | None | Labor law, union rules, overtime |
| **Recurrence** | iCal RRULE | Rotation patterns, rolling schedules |
| **Time horizon** | Days to weeks | Weeks to quarters |
| **Integration** | CalDAV, Google, Outlook | HRIS, payroll, incident management |

### Core Responsibilities

1. **Shift Management** — Define shift templates, assign personnel to shifts, handle swap requests and trades, manage open shift boards, and track overtime accumulation against configurable thresholds.

2. **Resource Scheduling** — Schedule shared resources (equipment, rooms, vehicles, licenses) with hard conflict detection, utilization optimization, and maintenance window awareness.

3. **Capacity Planning** — Forecast demand based on historical patterns, model capacity against staffing levels, identify bottlenecks before they occur, and run what-if scenarios for planning.

4. **Operational Calendars** — Maintain shared calendars for maintenance windows, deployment schedules, release calendars, and other cross-team operational events.

5. **On-Call Schedules** — Generate and manage rotation schedules with escalation chains, handle overrides and swap requests, ensure 24/7 coverage with gap detection.

6. **Blackout Periods** — Define and enforce scheduling blackouts for holidays, change-freeze windows, and other restricted periods with configurable exception handling.

7. **Schedule Templates** — Create reusable schedule patterns that can be auto-filled, support rolling generation, and adapt to changing organizational needs.

8. **Compliance Engine** — Enforce labor law constraints (minimum rest periods, maximum consecutive hours, weekly hour caps), union rules, and overtime thresholds automatically during schedule generation.

9. **Notifications** — Deliver schedule change alerts, shift reminders, coverage gap warnings, and overtime alerts through the platform notification system.

10. **Reporting** — Generate coverage analysis, overtime reports, schedule adherence metrics, and resource utilization dashboards.

### Design Philosophy

The Operations Calendar is built on several key principles:

- **Constraint-first scheduling**: Schedules are generated and validated against a constraint engine that enforces business rules, labor laws, and organizational policies before any assignment is committed.
- **Temporal correctness**: All scheduling operations are timezone-aware, DST-safe, and use half-open intervals `[start, end)` to prevent off-by-one errors at boundaries.
- **Multi-tenant isolation**: Every schedule, shift, and resource exists within a tenant boundary enforced by PostgreSQL Row-Level Security.
- **Audit everything**: Every schedule change, swap, override, and approval is recorded in an immutable audit trail with actor attribution.
- **Optimistic concurrency**: Schedule modifications use version vectors to detect and resolve concurrent edits without locks.

---

## Key Concepts

### Shifts vs. Events

A **shift** is a scheduled block of work assigned to one or more people. Unlike calendar events, shifts carry operational semantics: they have roles, skill requirements, coverage obligations, and labor-law implications. Shifts are the atomic unit of workforce scheduling.

### Schedule Periods

Schedules are generated in **periods** — typically weekly or biweekly blocks that align with payroll cycles. Each period has a lifecycle:

```
DRAFT → PUBLISHED → LOCKED → ARCHIVED
```

- **DRAFT**: Being built, editable by schedulers
- **PUBLISHED**: Visible to assignees, swap requests allowed
- **LOCKED**: Payroll-frozen, no further changes
- **ARCHIVED**: Historical, read-only

### Coverage Requirements

A **coverage requirement** defines the minimum (and optionally maximum) staffing level for a given role, skill, or position during a time window. The schedule engine validates that all coverage requirements are met before a period can be published.

### Constraint Engine

The constraint engine evaluates proposed schedules against a hierarchy of rules:

1. **Hard constraints** (must satisfy): Labor law minimums, blackout periods, qualification requirements
2. **Soft constraints** (should satisfy): Preference matching, fairness balancing, consecutive-day limits
3. **Optimization objectives**: Minimize overtime, maximize preference satisfaction, balance workload

---

## Exports

```typescript
// === Core Service ===
export { OpsCalendarService } from './service';
export { createOpsCalendarRouter } from './router';

// === Shift Management ===
export { ShiftService } from './shifts/shift-service';
export { ShiftTemplateService } from './shifts/template-service';
export { ShiftAssignmentService } from './shifts/assignment-service';
export { ShiftSwapService } from './shifts/swap-service';
export { OpenShiftBoard } from './shifts/open-shift-board';
export { OvertimeTracker } from './shifts/overtime-tracker';

// === Resource Scheduling ===
export { ResourceScheduleService } from './resources/schedule-service';
export { ResourceConflictDetector } from './resources/conflict-detector';
export { ResourceUtilizationOptimizer } from './resources/utilization-optimizer';

// === Capacity Planning ===
export { CapacityPlanService } from './capacity/plan-service';
export { DemandForecaster } from './capacity/demand-forecaster';
export { CapacityModeler } from './capacity/capacity-modeler';
export { BottleneckAnalyzer } from './capacity/bottleneck-analyzer';
export { WhatIfEngine } from './capacity/what-if-engine';

// === Operational Calendars ===
export { OpsCalendarManager } from './calendars/calendar-manager';
export { MaintenanceWindowService } from './calendars/maintenance-windows';
export { DeploymentScheduleService } from './calendars/deployment-schedules';
export { ReleaseCalendarService } from './calendars/release-calendars';

// === On-Call ===
export { OnCallScheduleService } from './oncall/schedule-service';
export { OnCallRotationEngine } from './oncall/rotation-engine';
export { EscalationChainService } from './oncall/escalation-chain';
export { OnCallOverrideService } from './oncall/override-service';

// === Blackout Periods ===
export { BlackoutPeriodService } from './blackouts/period-service';
export { BlackoutExceptionHandler } from './blackouts/exception-handler';

// === Schedule Templates ===
export { ScheduleTemplateService } from './templates/template-service';
export { AutoFillEngine } from './templates/auto-fill-engine';
export { RollingScheduleGenerator } from './templates/rolling-generator';

// === Compliance ===
export { ComplianceEngine } from './compliance/compliance-engine';
export { LaborLawValidator } from './compliance/labor-law-validator';
export { UnionRuleValidator } from './compliance/union-rule-validator';
export { OvertimeThresholdChecker } from './compliance/overtime-threshold';

// === Notifications ===
export { ScheduleNotificationService } from './notifications/notification-service';
export { ShiftReminderService } from './notifications/shift-reminders';
export { CoverageGapAlertService } from './notifications/coverage-gap-alerts';
export { OvertimeAlertService } from './notifications/overtime-alerts';

// === Reporting ===
export { CoverageReportService } from './reporting/coverage-report';
export { OvertimeReportService } from './reporting/overtime-report';
export { AdherenceReportService } from './reporting/adherence-report';
export { UtilizationReportService } from './reporting/utilization-report';

// === Constraint Engine ===
export { ConstraintEngine } from './constraints/constraint-engine';
export { ConstraintDefinition } from './constraints/constraint-definition';
export { ConstraintEvaluator } from './constraints/constraint-evaluator';
export { ConstraintViolation } from './constraints/constraint-violation';

// === Types ===
export type {
  Shift,
  ShiftTemplate,
  ShiftAssignment,
  ShiftSwapRequest,
  ShiftSwapStatus,
  ShiftStatus,
  ShiftRole,
  OpenShift,
  OvertimeRecord,
  ResourceSchedule,
  ResourceType,
  ResourceConflict,
  ResourceAvailability,
  CapacityPlan,
  CapacityModel,
  DemandForecast,
  BottleneckReport,
  WhatIfScenario,
  WhatIfResult,
  OpsCalendarEntry,
  OpsCalendarType,
  MaintenanceWindow,
  DeploymentSchedule,
  ReleaseCalendarEntry,
  OnCallSchedule,
  OnCallRotation,
  OnCallOverride,
  OnCallSwapRequest,
  EscalationChain,
  EscalationStep,
  BlackoutPeriod,
  BlackoutException,
  BlackoutScope,
  ScheduleTemplate,
  SchedulePattern,
  SchedulePeriod,
  SchedulePeriodStatus,
  CoverageRequirement,
  CoverageGap,
  CoverageReport,
  ComplianceRule,
  ComplianceViolation,
  ComplianceRuleSet,
  LaborLawConfig,
  UnionRuleConfig,
  OvertimeThreshold,
  ScheduleNotification,
  NotificationType,
  ConstraintType,
  ConstraintSeverity,
  ConstraintResult,
} from './types';

// === Schemas (Drizzle) ===
export {
  shifts,
  shiftTemplates,
  shiftAssignments,
  shiftSwaps,
  resourceSchedules,
  capacityPlans,
  onCallSchedules,
  onCallRotations,
  blackoutPeriods,
  scheduleTemplates,
  coverageGaps,
  coverageRequirements,
  overtimeRecords,
  complianceViolations,
  schedulePeriods,
  scheduleAuditLog,
} from './schema';

// === Router ===
export { opsCalendarRouter } from './router';

// === Constants ===
export {
  SHIFT_STATUSES,
  SCHEDULE_PERIOD_STATUSES,
  SWAP_STATUSES,
  RESOURCE_TYPES,
  OVERTIME_THRESHOLDS_DEFAULT,
  NOTIFICATION_TYPES,
  BLACKOUT_SCOPES,
  COMPLIANCE_RULE_TYPES,
  ESCALATION_METHODS,
} from './constants';
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        tRPC API Layer                               │
│  opsCalendarRouter                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │  shifts   │ resources│ capacity │  oncall  │ blackouts│          │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘          │
│       │          │          │          │          │                  │
├───────┼──────────┼──────────┼──────────┼──────────┼─────────────────┤
│       ▼          ▼          ▼          ▼          ▼                  │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │              OpsCalendarService (Facade)                 │        │
│  │  Coordinates all sub-services, enforces tenancy          │        │
│  └──────────────────────┬──────────────────────────────────┘        │
│                         │                                           │
│  ┌──────────────────────┼──────────────────────────────────┐        │
│  │          ┌───────────┼───────────┐                      │        │
│  │          ▼           ▼           ▼                      │        │
│  │  ┌────────────┐ ┌──────────┐ ┌──────────────┐          │        │
│  │  │   Shift    │ │ Resource │ │   Capacity   │          │        │
│  │  │  Service   │ │ Schedule │ │   Planning   │          │        │
│  │  │            │ │ Service  │ │   Service    │          │        │
│  │  └─────┬──────┘ └────┬─────┘ └──────┬───────┘          │        │
│  │        │              │              │                  │        │
│  │  ┌─────┼──────────────┼──────────────┼──────────┐       │        │
│  │  │     ▼              ▼              ▼          │       │        │
│  │  │  ┌─────────────────────────────────────────┐ │       │        │
│  │  │  │         Constraint Engine               │ │       │        │
│  │  │  │  ┌────────────┬────────────┬──────────┐ │ │       │        │
│  │  │  │  │ Labor Law  │ Union Rule │ Business │ │ │       │        │
│  │  │  │  │ Validator  │ Validator  │  Rules   │ │ │       │        │
│  │  │  │  └────────────┴────────────┴──────────┘ │ │       │        │
│  │  │  └─────────────────────────────────────────┘ │       │        │
│  │  │         Compliance Layer                     │       │        │
│  │  └──────────────────────────────────────────────┘       │        │
│  │                                                         │        │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │        │
│  │  │   On-Call     │  │  Blackout    │  │   Schedule    │ │        │
│  │  │   Rotation    │  │  Period      │  │   Template    │ │        │
│  │  │   Engine      │  │  Service     │  │   Engine      │ │        │
│  │  └──────────────┘  └──────────────┘  └───────────────┘ │        │
│  │                                                         │        │
│  │  ┌──────────────────────────────────────────────────┐   │        │
│  │  │           Notification & Reporting               │   │        │
│  │  │  ┌──────────┬──────────┬──────────┬───────────┐  │   │        │
│  │  │  │ Schedule │  Shift   │ Coverage │ Overtime  │  │   │        │
│  │  │  │ Changes  │ Reminders│ Gap Warns│  Alerts   │  │   │        │
│  │  │  └──────────┴──────────┴──────────┴───────────┘  │   │        │
│  │  └──────────────────────────────────────────────────┘   │        │
│  │                     Service Layer                       │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                    Supabase PostgreSQL + RLS                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │  shifts   │ shift_   │ resource_│ capacity_│ on_call_ │          │
│  │          │ templates│ schedules│  plans   │ schedules│          │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┤          │
│  │ shift_   │ shift_   │ blackout_│ schedule_│ coverage_│          │
│  │assignments│ swaps   │ periods  │ templates│  gaps    │          │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┤          │
│  │ overtime_│compliance│ schedule_│ schedule_│ coverage_│          │
│  │ records  │violations│ periods  │audit_log │ reqs     │          │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘          │
│                      Data Layer                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Schedule Generation

```
1. Scheduler initiates period creation
   │
2. Load coverage requirements for period
   │
3. Load employee availability & preferences
   │
4. Load active constraints (labor law, union, business)
   │
5. Load blackout periods affecting date range
   │
6. Apply schedule template (if selected)
   │
7. Auto-fill engine generates candidate assignments
   │  ┌─────────────────────────────────────┐
   │  │ For each candidate assignment:      │
   │  │  a. Check hard constraints          │
   │  │  b. Check resource conflicts        │
   │  │  c. Validate overtime thresholds    │
   │  │  d. Score soft constraints          │
   │  │  e. Accept or reject assignment     │
   │  └─────────────────────────────────────┘
   │
8. Coverage gap analysis
   │  ├── All covered → proceed to step 9
   │  └── Gaps found → flag for manual review
   │
9. Compliance validation pass
   │  ├── All compliant → proceed to step 10
   │  └── Violations found → flag with severity
   │
10. Schedule period enters DRAFT status
    │
11. Scheduler reviews, adjusts, publishes
    │
12. Notifications dispatched to all assignees
```

### Temporal Model

All time handling in the Operations Calendar follows strict rules:

- **Storage**: All timestamps stored as `timestamptz` (UTC) in PostgreSQL
- **Intervals**: Half-open `[start, end)` — start is inclusive, end is exclusive
- **Timezone context**: Operations carry a `timezone` field for display and rule evaluation
- **DST handling**: Shift boundaries are defined in local time and converted to UTC; DST transitions create 23h or 25h days which are handled explicitly
- **Granularity**: Minimum scheduling granularity is 15 minutes
- **Week boundaries**: Configurable per tenant (ISO Monday or Sunday start)

```typescript
// Half-open interval prevents boundary issues
// Shift A: [08:00, 16:00) and Shift B: [16:00, 00:00)
// No overlap at 16:00 — A ends before B starts

interface TimeInterval {
  /** Inclusive start (UTC) */
  start: Date;
  /** Exclusive end (UTC) */
  end: Date;
  /** Timezone for local display and rule evaluation */
  timezone: string;
}

function intervalsOverlap(a: TimeInterval, b: TimeInterval): boolean {
  return a.start < b.end && b.start < a.end;
}
```

### Cron-Based Schedule Generation

The module uses scheduled cron jobs for automated operations:

| Cron Expression | Job | Description |
|----------------|-----|-------------|
| `0 0 * * 0` | `rolling-schedule-gen` | Generate next rolling schedule period |
| `0 6 * * *` | `coverage-gap-check` | Scan for coverage gaps in next 7 days |
| `*/15 * * * *` | `shift-reminders` | Send shift start reminders (1h before) |
| `0 * * * *` | `overtime-check` | Check approaching overtime thresholds |
| `0 2 * * *` | `on-call-rotation` | Advance on-call rotation schedules |
| `0 3 * * 1` | `compliance-audit` | Weekly compliance audit scan |
| `0 0 1 * *` | `utilization-report` | Monthly resource utilization report |

---

## Core Interfaces

### Shift

```typescript
/**
 * Represents a single shift — a scheduled block of work
 * with role requirements and assignment slots.
 */
interface Shift {
  /** Unique shift identifier */
  id: string;

  /** Tenant ID for multi-tenant isolation */
  tenantId: string;

  /** Reference to the schedule period this shift belongs to */
  periodId: string;

  /** Optional reference to the template this shift was generated from */
  templateId: string | null;

  /** Human-readable shift name (e.g., "Morning ER", "Night Security") */
  name: string;

  /** Shift start time (UTC, inclusive) */
  startTime: Date;

  /** Shift end time (UTC, exclusive) */
  endTime: Date;

  /** Timezone for local display and compliance evaluation */
  timezone: string;

  /** Duration in minutes (computed, accounts for DST) */
  durationMinutes: number;

  /** Role required for this shift */
  roleId: string;

  /** Minimum number of assignees required */
  minStaff: number;

  /** Maximum number of assignees allowed */
  maxStaff: number;

  /** Current number of confirmed assignees */
  confirmedStaff: number;

  /** Department or team this shift belongs to */
  departmentId: string;

  /** Location or site for this shift */
  locationId: string | null;

  /** Required skills/certifications for assignees */
  requiredSkills: string[];

  /** Shift status */
  status: ShiftStatus;

  /** Whether this shift is available on the open shift board */
  isOpen: boolean;

  /** Pay rate multiplier (1.0 = regular, 1.5 = time-and-a-half, etc.) */
  payMultiplier: number;

  /** Color code for calendar display */
  color: string | null;

  /** Arbitrary metadata */
  metadata: Record<string, unknown>;

  /** Row version for optimistic concurrency */
  version: number;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

type ShiftStatus =
  | 'draft'       // Being planned
  | 'published'   // Visible, accepting assignments
  | 'filled'      // All slots filled
  | 'in_progress' // Currently active
  | 'completed'   // Past, finalized
  | 'cancelled';  // Cancelled
```

### ShiftTemplate

```typescript
/**
 * Reusable shift definition that can generate concrete shifts
 * across schedule periods.
 */
interface ShiftTemplate {
  id: string;
  tenantId: string;

  /** Template name (e.g., "Standard Day Shift") */
  name: string;

  /** Description of when/how this template is used */
  description: string | null;

  /** Start time as local time offset from midnight (minutes) */
  startTimeOffset: number;

  /** End time as local time offset from midnight (minutes) */
  endTimeOffset: number;

  /** Duration in minutes */
  durationMinutes: number;

  /** Days of week this template applies to (0=Sunday, 6=Saturday) */
  daysOfWeek: number[];

  /** Role required */
  roleId: string;

  /** Default min/max staffing */
  defaultMinStaff: number;
  defaultMaxStaff: number;

  /** Department */
  departmentId: string;

  /** Location */
  locationId: string | null;

  /** Required skills */
  requiredSkills: string[];

  /** Pay multiplier */
  payMultiplier: number;

  /** Color for display */
  color: string | null;

  /** Whether this template is active for auto-generation */
  isActive: boolean;

  /** Effective date range for this template */
  effectiveFrom: Date;
  effectiveTo: Date | null;

  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

### ShiftAssignment

```typescript
/**
 * Links a user to a shift with status tracking.
 */
interface ShiftAssignment {
  id: string;
  tenantId: string;
  shiftId: string;
  userId: string;

  /** Assignment status */
  status: ShiftAssignmentStatus;

  /** How this assignment was created */
  assignmentMethod: 'auto' | 'manual' | 'swap' | 'self_assign' | 'callback';

  /** Timestamp when user confirmed/acknowledged */
  confirmedAt: Date | null;

  /** Actual clock-in time (if time tracking enabled) */
  clockInTime: Date | null;

  /** Actual clock-out time */
  clockOutTime: Date | null;

  /** Adherence status */
  adherenceStatus: 'on_time' | 'late' | 'early' | 'no_show' | 'pending' | null;

  /** Minutes of overtime this assignment contributes */
  overtimeMinutes: number;

  /** Notes from scheduler or assignee */
  notes: string | null;

  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

type ShiftAssignmentStatus =
  | 'pending'     // Assigned, awaiting confirmation
  | 'confirmed'   // User confirmed
  | 'declined'    // User declined
  | 'completed'   // Shift completed
  | 'no_show'     // User did not show up
  | 'cancelled';  // Assignment cancelled
```

### ShiftSwapRequest

```typescript
/**
 * A request to swap or trade a shift between two users.
 */
interface ShiftSwapRequest {
  id: string;
  tenantId: string;

  /** Type of swap */
  type: 'swap' | 'giveaway' | 'pickup';

  /** The assignment being offered */
  sourceAssignmentId: string;
  sourceUserId: string;

  /** The assignment being offered in return (null for giveaway/pickup) */
  targetAssignmentId: string | null;
  targetUserId: string | null;

  /** Current status */
  status: ShiftSwapStatus;

  /** Reason for the swap request */
  reason: string | null;

  /** Whether manager approval is required */
  requiresApproval: boolean;

  /** Manager who approved/denied */
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;

  /** Compliance check result at time of request */
  complianceCheckPassed: boolean;
  complianceViolations: ComplianceViolation[];

  /** Expiry time for the request */
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

type ShiftSwapStatus =
  | 'pending_peer'     // Awaiting target user acceptance
  | 'pending_approval' // Peer accepted, awaiting manager
  | 'approved'         // Fully approved, swap executed
  | 'denied'           // Denied by manager
  | 'declined'         // Declined by target user
  | 'expired'          // Timed out
  | 'cancelled';       // Cancelled by requester
```

### ResourceSchedule

```typescript
/**
 * A scheduled reservation for a shared resource.
 */
interface ResourceSchedule {
  id: string;
  tenantId: string;

  /** The resource being scheduled */
  resourceId: string;
  resourceType: ResourceType;

  /** Booking details */
  title: string;
  description: string | null;

  /** Time block (UTC, half-open) */
  startTime: Date;
  endTime: Date;
  timezone: string;

  /** Who booked this resource */
  bookedBy: string;

  /** Associated entity (shift, project, department) */
  associatedEntityType: string | null;
  associatedEntityId: string | null;

  /** Booking status */
  status: 'confirmed' | 'tentative' | 'cancelled' | 'completed';

  /** Whether this is a recurring booking */
  isRecurring: boolean;
  recurrenceRule: string | null;
  recurrenceGroupId: string | null;

  /** Conflict detection */
  allowDoubleBooking: boolean;
  priority: number;

  /** Maintenance flag */
  isMaintenanceBlock: boolean;

  notes: string | null;
  metadata: Record<string, unknown>;

  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

type ResourceType =
  | 'room'
  | 'equipment'
  | 'vehicle'
  | 'license'
  | 'workstation'
  | 'dock'
  | 'custom';
```

### CapacityPlan

```typescript
/**
 * A capacity plan that models staffing needs against demand forecasts.
 */
interface CapacityPlan {
  id: string;
  tenantId: string;

  /** Plan name and description */
  name: string;
  description: string | null;

  /** Plan time range */
  startDate: Date;
  endDate: Date;
  timezone: string;

  /** Granularity of the plan */
  granularity: 'hourly' | 'daily' | 'weekly';

  /** Department or team scope */
  departmentId: string | null;
  roleId: string | null;

  /** Demand forecast data points */
  demandForecast: DemandDataPoint[];

  /** Current capacity data points */
  capacityBaseline: CapacityDataPoint[];

  /** Identified bottlenecks */
  bottlenecks: Bottleneck[];

  /** Plan status */
  status: 'draft' | 'active' | 'archived';

  /** Model parameters */
  modelConfig: CapacityModelConfig;

  /** Plan version for scenario tracking */
  scenarioName: string | null;
  parentPlanId: string | null;

  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface DemandDataPoint {
  timestamp: Date;
  demandUnits: number;
  confidence: number;
  source: 'historical' | 'manual' | 'forecast';
}

interface CapacityDataPoint {
  timestamp: Date;
  availableCapacity: number;
  scheduledCapacity: number;
  utilizationPercent: number;
}

interface Bottleneck {
  timestamp: Date;
  durationMinutes: number;
  shortfall: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  roleId: string | null;
  suggestion: string;
}

interface CapacityModelConfig {
  /** Historical lookback period in days */
  lookbackDays: number;
  /** Seasonal adjustment enabled */
  seasonalAdjustment: boolean;
  /** Trend detection */
  trendDetection: boolean;
  /** Confidence interval (0-1) */
  confidenceLevel: number;
  /** Custom demand multipliers by day-of-week */
  dayOfWeekMultipliers: Record<number, number>;
}
```

### OnCallSchedule

```typescript
/**
 * An on-call schedule with rotation and escalation configuration.
 */
interface OnCallSchedule {
  id: string;
  tenantId: string;

  /** Schedule name (e.g., "Production Incidents - Primary") */
  name: string;
  description: string | null;

  /** Team or service this on-call covers */
  teamId: string;
  serviceId: string | null;

  /** Rotation configuration */
  rotationType: 'daily' | 'weekly' | 'biweekly' | 'custom';
  rotationStartDay: number;
  rotationStartTime: string;
  timezone: string;

  /** Participants in rotation order */
  participants: OnCallParticipant[];

  /** Current on-call person */
  currentOnCallUserId: string;
  currentRotationIndex: number;

  /** Handoff time of current rotation */
  currentRotationStart: Date;
  currentRotationEnd: Date;

  /** Escalation chain */
  escalationChainId: string;

  /** Schedule constraints */
  maxConsecutiveRotations: number;
  minimumRestHoursBetween: number;

  /** Status */
  isActive: boolean;

  metadata: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface OnCallParticipant {
  userId: string;
  order: number;
  isActive: boolean;
  unavailableDates: DateRange[];
}

interface DateRange {
  start: Date;
  end: Date;
}
```

### EscalationChain

```typescript
/**
 * Defines how alerts escalate when the on-call person doesn't respond.
 */
interface EscalationChain {
  id: string;
  tenantId: string;

  name: string;
  description: string | null;

  /** Ordered escalation steps */
  steps: EscalationStep[];

  /** What happens if all steps are exhausted */
  fallbackAction: 'loop' | 'notify_all' | 'notify_manager' | 'page_everyone';
  fallbackTargetId: string | null;

  /** Number of times to repeat the chain before fallback */
  maxRepetitions: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface EscalationStep {
  order: number;

  /** Who to notify at this step */
  targetType: 'on_call_current' | 'user' | 'role' | 'team' | 'schedule';
  targetId: string;

  /** How long to wait before escalating (minutes) */
  timeoutMinutes: number;

  /** Notification methods */
  notificationMethods: EscalationMethod[];

  /** Optional condition to skip this step */
  condition: string | null;
}

type EscalationMethod =
  | 'push'
  | 'sms'
  | 'phone'
  | 'email'
  | 'slack'
  | 'teams'
  | 'pagerduty'
  | 'webhook';
```

### BlackoutPeriod

```typescript
/**
 * A period during which scheduling is restricted or blocked.
 */
interface BlackoutPeriod {
  id: string;
  tenantId: string;

  /** Blackout name (e.g., "Holiday Freeze", "Maintenance Window") */
  name: string;
  description: string | null;

  /** Time range */
  startTime: Date;
  endTime: Date;
  timezone: string;

  /** Scope of the blackout */
  scope: BlackoutScope;

  /** What entity the scope applies to */
  scopeEntityId: string | null;

  /** What actions are blocked */
  blockedActions: BlackoutAction[];

  /** Whether exceptions can be granted */
  allowExceptions: boolean;

  /** Required approval level for exceptions */
  exceptionApprovalLevel: 'manager' | 'director' | 'vp' | 'none';

  /** Recurrence (e.g., annual holidays) */
  isRecurring: boolean;
  recurrenceRule: string | null;

  /** Active flag */
  isActive: boolean;

  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

type BlackoutScope =
  | 'global'       // Entire tenant
  | 'department'   // Specific department
  | 'team'         // Specific team
  | 'location'     // Specific location
  | 'resource'     // Specific resource
  | 'service';     // Specific service (for deployments)

type BlackoutAction =
  | 'shift_change'      // No shift modifications
  | 'deployment'        // No deployments
  | 'maintenance'       // No maintenance
  | 'resource_booking'  // No resource bookings
  | 'schedule_publish'  // No schedule publishing
  | 'all';              // Everything blocked
```

### ScheduleTemplate

```typescript
/**
 * A reusable pattern for generating schedules across periods.
 */
interface ScheduleTemplate {
  id: string;
  tenantId: string;

  /** Template name */
  name: string;
  description: string | null;

  /** Department or team this template applies to */
  departmentId: string | null;
  teamId: string | null;

  /** Pattern definition */
  pattern: SchedulePattern;

  /** Auto-generation configuration */
  autoGenerate: boolean;
  generateLeadDays: number;
  generationFrequency: 'weekly' | 'biweekly' | 'monthly';

  /** Coverage requirements embedded in this template */
  coverageRequirements: CoverageRequirement[];

  /** Shift templates referenced by this schedule template */
  shiftTemplateIds: string[];

  /** Whether this template is the default for its scope */
  isDefault: boolean;

  /** Active flag */
  isActive: boolean;

  /** Effective date range */
  effectiveFrom: Date;
  effectiveTo: Date | null;

  metadata: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface SchedulePattern {
  /** Pattern type */
  type: 'fixed_weekly' | 'rotating' | 'custom';

  /** For rotating patterns: rotation length in days */
  rotationLengthDays: number | null;

  /** Pattern entries defining the template structure */
  entries: SchedulePatternEntry[];
}

interface SchedulePatternEntry {
  /** Day offset from pattern start (0-indexed) */
  dayOffset: number;

  /** Shift template to use */
  shiftTemplateId: string;

  /** Optional: specific user or role assignment */
  assigneeType: 'role' | 'user' | 'pool' | null;
  assigneeId: string | null;
}
```

### CoverageRequirement

```typescript
/**
 * Defines minimum staffing levels for a time window.
 */
interface CoverageRequirement {
  id: string;
  tenantId: string;

  /** What needs coverage */
  departmentId: string;
  roleId: string;
  locationId: string | null;

  /** Time window (local time offsets from midnight, in minutes) */
  startTimeOffset: number;
  endTimeOffset: number;

  /** Days of week this requirement applies to */
  daysOfWeek: number[];

  /** Staffing levels */
  minimumStaff: number;
  idealStaff: number;
  maximumStaff: number | null;

  /** Required skills */
  requiredSkills: string[];

  /** Priority (higher = more critical to fill) */
  priority: number;

  /** Effective date range */
  effectiveFrom: Date;
  effectiveTo: Date | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

### CoverageReport

```typescript
/**
 * Analysis of schedule coverage against requirements.
 */
interface CoverageReport {
  /** Report metadata */
  reportId: string;
  tenantId: string;
  generatedAt: Date;
  generatedBy: string;

  /** Report scope */
  periodId: string;
  departmentId: string | null;
  startDate: Date;
  endDate: Date;

  /** Summary metrics */
  summary: {
    totalRequiredHours: number;
    totalScheduledHours: number;
    coveragePercent: number;
    totalGaps: number;
    totalOverstaffedHours: number;
    totalUnderstaffedHours: number;
  };

  /** Per-day breakdown */
  dailyBreakdown: DailyCoverage[];

  /** Identified gaps */
  gaps: CoverageGap[];

  /** Recommendations */
  recommendations: CoverageRecommendation[];
}

interface DailyCoverage {
  date: Date;
  requiredHours: number;
  scheduledHours: number;
  coveragePercent: number;
  gapCount: number;
  overstaffHours: number;
}

interface CoverageGap {
  id: string;
  startTime: Date;
  endTime: Date;
  roleId: string;
  departmentId: string;
  requiredStaff: number;
  scheduledStaff: number;
  shortfall: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedActions: string[];
}

interface CoverageRecommendation {
  type: 'hire' | 'redistribute' | 'overtime' | 'cross_train' | 'adjust_requirement';
  description: string;
  impact: string;
  priority: number;
}
```

### ComplianceRule & Violation

```typescript
/**
 * A compliance rule that the constraint engine evaluates.
 */
interface ComplianceRule {
  id: string;
  tenantId: string;

  /** Rule name and description */
  name: string;
  description: string;

  /** Rule category */
  category: 'labor_law' | 'union' | 'organizational' | 'custom';

  /** Jurisdiction or union this rule applies to */
  jurisdictionId: string | null;
  unionId: string | null;

  /** Rule type */
  type: ComplianceRuleType;

  /** Rule parameters */
  parameters: Record<string, unknown>;

  /** Severity if violated */
  severity: 'warning' | 'error' | 'critical';

  /** Whether this rule blocks schedule publishing */
  isBlocking: boolean;

  /** Applicable roles (empty = all) */
  applicableRoleIds: string[];

  /** Effective dates */
  effectiveFrom: Date;
  effectiveTo: Date | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

type ComplianceRuleType =
  | 'max_hours_per_day'
  | 'max_hours_per_week'
  | 'min_rest_between_shifts'
  | 'max_consecutive_days'
  | 'min_days_off_per_week'
  | 'max_overtime_per_week'
  | 'max_overtime_per_month'
  | 'mandatory_break_after'
  | 'max_night_shifts_consecutive'
  | 'min_notice_for_schedule_change'
  | 'max_split_shifts_per_week'
  | 'custom';

/**
 * A recorded compliance violation.
 */
interface ComplianceViolation {
  id: string;
  tenantId: string;

  /** The rule that was violated */
  ruleId: string;
  ruleName: string;

  /** Who is affected */
  userId: string;

  /** When the violation occurs */
  violationDate: Date;
  periodId: string;

  /** Violation details */
  description: string;
  severity: 'warning' | 'error' | 'critical';

  /** The actual value vs the limit */
  actualValue: number;
  limitValue: number;
  unit: string;

  /** Resolution */
  status: 'open' | 'acknowledged' | 'resolved' | 'waived';
  resolvedBy: string | null;
  resolvedAt: Date | null;
  resolution: string | null;

  /** Whether a waiver/exception was granted */
  waiverGranted: boolean;
  waiverApprovedBy: string | null;
  waiverReason: string | null;

  createdAt: Date;
  updatedAt: Date;
}
```

### OpsCalendarService (Facade)

```typescript
/**
 * Primary service facade for the Operations Calendar module.
 * Coordinates all sub-services and enforces tenant isolation.
 */
interface OpsCalendarService {
  // === Schedule Periods ===
  createPeriod(input: CreatePeriodInput): Promise<SchedulePeriod>;
  getPeriod(periodId: string): Promise<SchedulePeriod>;
  listPeriods(filter: PeriodFilter): Promise<PaginatedResult<SchedulePeriod>>;
  publishPeriod(periodId: string): Promise<PublishResult>;
  lockPeriod(periodId: string): Promise<SchedulePeriod>;

  // === Shifts ===
  createShift(input: CreateShiftInput): Promise<Shift>;
  updateShift(shiftId: string, input: UpdateShiftInput): Promise<Shift>;
  deleteShift(shiftId: string): Promise<void>;
  getShift(shiftId: string): Promise<Shift>;
  listShifts(filter: ShiftFilter): Promise<PaginatedResult<Shift>>;
  generateShiftsFromTemplate(
    periodId: string,
    templateId: string
  ): Promise<Shift[]>;

  // === Assignments ===
  assignShift(input: AssignShiftInput): Promise<ShiftAssignment>;
  unassignShift(assignmentId: string, reason: string): Promise<void>;
  confirmAssignment(assignmentId: string): Promise<ShiftAssignment>;
  declineAssignment(assignmentId: string, reason: string): Promise<ShiftAssignment>;
  getMyAssignments(filter: AssignmentFilter): Promise<ShiftAssignment[]>;
  recordClockIn(assignmentId: string): Promise<ShiftAssignment>;
  recordClockOut(assignmentId: string): Promise<ShiftAssignment>;

  // === Swaps ===
  requestSwap(input: SwapRequestInput): Promise<ShiftSwapRequest>;
  respondToSwap(swapId: string, accept: boolean, notes?: string): Promise<ShiftSwapRequest>;
  approveSwap(swapId: string, notes?: string): Promise<ShiftSwapRequest>;
  denySwap(swapId: string, reason: string): Promise<ShiftSwapRequest>;
  listSwapRequests(filter: SwapFilter): Promise<PaginatedResult<ShiftSwapRequest>>;

  // === Open Shift Board ===
  listOpenShifts(filter: OpenShiftFilter): Promise<PaginatedResult<Shift>>;
  claimOpenShift(shiftId: string): Promise<ShiftAssignment>;

  // === Resources ===
  scheduleResource(input: ScheduleResourceInput): Promise<ResourceSchedule>;
  updateResourceSchedule(
    scheduleId: string,
    input: UpdateResourceScheduleInput
  ): Promise<ResourceSchedule>;
  cancelResourceBooking(scheduleId: string, reason: string): Promise<void>;
  checkResourceAvailability(
    resourceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<ResourceAvailability>;
  listResourceSchedules(filter: ResourceFilter): Promise<PaginatedResult<ResourceSchedule>>;

  // === Capacity Planning ===
  createCapacityPlan(input: CreateCapacityPlanInput): Promise<CapacityPlan>;
  generateForecast(planId: string): Promise<DemandForecast>;
  runWhatIfScenario(planId: string, scenario: WhatIfScenario): Promise<WhatIfResult>;
  identifyBottlenecks(planId: string): Promise<Bottleneck[]>;

  // === On-Call ===
  createOnCallSchedule(input: CreateOnCallScheduleInput): Promise<OnCallSchedule>;
  updateOnCallSchedule(
    scheduleId: string,
    input: UpdateOnCallScheduleInput
  ): Promise<OnCallSchedule>;
  getCurrentOnCall(scheduleId: string): Promise<OnCallParticipant>;
  createOverride(input: CreateOverrideInput): Promise<OnCallOverride>;
  requestOnCallSwap(input: OnCallSwapInput): Promise<OnCallSwapRequest>;
  advanceRotation(scheduleId: string): Promise<OnCallSchedule>;

  // === Blackouts ===
  createBlackoutPeriod(input: CreateBlackoutInput): Promise<BlackoutPeriod>;
  updateBlackoutPeriod(
    blackoutId: string,
    input: UpdateBlackoutInput
  ): Promise<BlackoutPeriod>;
  deleteBlackoutPeriod(blackoutId: string): Promise<void>;
  requestBlackoutException(input: BlackoutExceptionInput): Promise<BlackoutException>;
  checkBlackoutConflicts(
    startTime: Date,
    endTime: Date,
    action: BlackoutAction
  ): Promise<BlackoutPeriod[]>;

  // === Templates ===
  createScheduleTemplate(input: CreateTemplateInput): Promise<ScheduleTemplate>;
  updateScheduleTemplate(
    templateId: string,
    input: UpdateTemplateInput
  ): Promise<ScheduleTemplate>;
  autoFillPeriod(periodId: string, templateId: string): Promise<AutoFillResult>;
  generateRollingSchedule(templateId: string): Promise<SchedulePeriod>;

  // === Compliance ===
  validateSchedule(periodId: string): Promise<ComplianceValidationResult>;
  getComplianceViolations(filter: ViolationFilter): Promise<ComplianceViolation[]>;
  waiveViolation(violationId: string, reason: string): Promise<ComplianceViolation>;

  // === Reporting ===
  generateCoverageReport(periodId: string): Promise<CoverageReport>;
  generateOvertimeReport(filter: OvertimeReportFilter): Promise<OvertimeReport>;
  generateAdherenceReport(filter: AdherenceFilter): Promise<AdherenceReport>;
  generateUtilizationReport(filter: UtilizationFilter): Promise<UtilizationReport>;

  // === Notifications ===
  getScheduleNotifications(filter: NotificationFilter): Promise<ScheduleNotification[]>;
  acknowledgeNotification(notificationId: string): Promise<void>;
  configureNotificationPreferences(
    userId: string,
    prefs: NotificationPreferences
  ): Promise<void>;
}
```

---

## Database Schemas

### shifts

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  real,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const shifts = pgTable(
  'ops_cal_shifts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    periodId: uuid('period_id').notNull().references(() => schedulePeriods.id),
    templateId: uuid('template_id').references(() => shiftTemplates.id),
    name: text('name').notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    timezone: text('timezone').notNull().default('UTC'),
    durationMinutes: integer('duration_minutes').notNull(),
    roleId: uuid('role_id').notNull(),
    minStaff: integer('min_staff').notNull().default(1),
    maxStaff: integer('max_staff').notNull().default(1),
    confirmedStaff: integer('confirmed_staff').notNull().default(0),
    departmentId: uuid('department_id').notNull(),
    locationId: uuid('location_id'),
    requiredSkills: jsonb('required_skills').notNull().default([]),
    status: text('status').notNull().default('draft'),
    isOpen: boolean('is_open').notNull().default(false),
    payMultiplier: real('pay_multiplier').notNull().default(1.0),
    color: text('color'),
    metadata: jsonb('metadata').notNull().default({}),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
  },
  (table) => ({
    tenantIdx: index('shifts_tenant_idx').on(table.tenantId),
    periodIdx: index('shifts_period_idx').on(table.tenantId, table.periodId),
    timeRangeIdx: index('shifts_time_range_idx').on(
      table.tenantId,
      table.startTime,
      table.endTime
    ),
    departmentIdx: index('shifts_department_idx').on(
      table.tenantId,
      table.departmentId
    ),
    statusIdx: index('shifts_status_idx').on(table.tenantId, table.status),
    openShiftsIdx: index('shifts_open_idx').on(table.tenantId, table.isOpen)
      .where(sql`is_open = true`),
  })
);
```

### shift_templates

```typescript
export const shiftTemplates = pgTable(
  'ops_cal_shift_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    name: text('name').notNull(),
    description: text('description'),
    startTimeOffset: integer('start_time_offset').notNull(),
    endTimeOffset: integer('end_time_offset').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    daysOfWeek: jsonb('days_of_week').notNull().default([]),
    roleId: uuid('role_id').notNull(),
    defaultMinStaff: integer('default_min_staff').notNull().default(1),
    defaultMaxStaff: integer('default_max_staff').notNull().default(1),
    departmentId: uuid('department_id').notNull(),
    locationId: uuid('location_id'),
    requiredSkills: jsonb('required_skills').notNull().default([]),
    payMultiplier: real('pay_multiplier').notNull().default(1.0),
    color: text('color'),
    isActive: boolean('is_active').notNull().default(true),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    tenantIdx: index('shift_templates_tenant_idx').on(table.tenantId),
    activeIdx: index('shift_templates_active_idx').on(
      table.tenantId,
      table.isActive
    ),
    departmentIdx: index('shift_templates_dept_idx').on(
      table.tenantId,
      table.departmentId
    ),
  })
);
```

### shift_assignments

```typescript
export const shiftAssignments = pgTable(
  'ops_cal_shift_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    shiftId: uuid('shift_id').notNull().references(() => shifts.id, {
      onDelete: 'cascade',
    }),
    userId: uuid('user_id').notNull(),
    status: text('status').notNull().default('pending'),
    assignmentMethod: text('assignment_method').notNull().default('manual'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    clockInTime: timestamp('clock_in_time', { withTimezone: true }),
    clockOutTime: timestamp('clock_out_time', { withTimezone: true }),
    adherenceStatus: text('adherence_status'),
    overtimeMinutes: integer('overtime_minutes').notNull().default(0),
    notes: text('notes'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    tenantIdx: index('shift_assignments_tenant_idx').on(table.tenantId),
    shiftIdx: index('shift_assignments_shift_idx').on(
      table.tenantId,
      table.shiftId
    ),
    userIdx: index('shift_assignments_user_idx').on(
      table.tenantId,
      table.userId
    ),
    userShiftUnique: uniqueIndex('shift_assignments_user_shift_uniq').on(
      table.shiftId,
      table.userId
    ),
    statusIdx: index('shift_assignments_status_idx').on(
      table.tenantId,
      table.status
    ),
  })
);
```

### shift_swaps

```typescript
export const shiftSwaps = pgTable(
  'ops_cal_shift_swaps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    type: text('type').notNull(),
    sourceAssignmentId: uuid('source_assignment_id')
      .notNull()
      .references(() => shiftAssignments.id),
    sourceUserId: uuid('source_user_id').notNull(),
    targetAssignmentId: uuid('target_assignment_id').references(
      () => shiftAssignments.id
    ),
    targetUserId: uuid('target_user_id'),
    status: text('status').notNull().default('pending_peer'),
    reason: text('reason'),
    requiresApproval: boolean('requires_approval').notNull().default(true),
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNotes: text('review_notes'),
    complianceCheckPassed: boolean('compliance_check_passed')
      .notNull()
      .default(false),
    complianceViolations: jsonb('compliance_violations').notNull().default([]),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('shift_swaps_tenant_idx').on(table.tenantId),
    sourceUserIdx: index('shift_swaps_source_user_idx').on(
      table.tenantId,
      table.sourceUserId
    ),
    targetUserIdx: index('shift_swaps_target_user_idx').on(
      table.tenantId,
      table.targetUserId
    ),
    statusIdx: index('shift_swaps_status_idx').on(table.tenantId, table.status),
    expiresIdx: index('shift_swaps_expires_idx').on(table.expiresAt),
  })
);
```

### resource_schedules

```typescript
export const resourceSchedules = pgTable(
  'ops_cal_resource_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    resourceId: uuid('resource_id').notNull(),
    resourceType: text('resource_type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    timezone: text('timezone').notNull().default('UTC'),
    bookedBy: uuid('booked_by').notNull(),
    associatedEntityType: text('associated_entity_type'),
    associatedEntityId: uuid('associated_entity_id'),
    status: text('status').notNull().default('confirmed'),
    isRecurring: boolean('is_recurring').notNull().default(false),
    recurrenceRule: text('recurrence_rule'),
    recurrenceGroupId: uuid('recurrence_group_id'),
    allowDoubleBooking: boolean('allow_double_booking').notNull().default(false),
    priority: integer('priority').notNull().default(0),
    isMaintenanceBlock: boolean('is_maintenance_block').notNull().default(false),
    notes: text('notes'),
    metadata: jsonb('metadata').notNull().default({}),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    tenantIdx: index('resource_schedules_tenant_idx').on(table.tenantId),
    resourceIdx: index('resource_schedules_resource_idx').on(
      table.tenantId,
      table.resourceId
    ),
    timeRangeIdx: index('resource_schedules_time_idx').on(
      table.tenantId,
      table.resourceId,
      table.startTime,
      table.endTime
    ),
    statusIdx: index('resource_schedules_status_idx').on(
      table.tenantId,
      table.status
    ),
    recurringGroupIdx: index('resource_schedules_recurrence_idx').on(
      table.recurrenceGroupId
    ),
  })
);
```

### capacity_plans

```typescript
export const capacityPlans = pgTable(
  'ops_cal_capacity_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    name: text('name').notNull(),
    description: text('description'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    timezone: text('timezone').notNull().default('UTC'),
    granularity: text('granularity').notNull().default('daily'),
    departmentId: uuid('department_id'),
    roleId: uuid('role_id'),
    demandForecast: jsonb('demand_forecast').notNull().default([]),
    capacityBaseline: jsonb('capacity_baseline').notNull().default([]),
    bottlenecks: jsonb('bottlenecks').notNull().default([]),
    status: text('status').notNull().default('draft'),
    modelConfig: jsonb('model_config').notNull().default({}),
    scenarioName: text('scenario_name'),
    parentPlanId: uuid('parent_plan_id').references(() => capacityPlans.id),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    tenantIdx: index('capacity_plans_tenant_idx').on(table.tenantId),
    dateRangeIdx: index('capacity_plans_date_idx').on(
      table.tenantId,
      table.startDate,
      table.endDate
    ),
    departmentIdx: index('capacity_plans_dept_idx').on(
      table.tenantId,
      table.departmentId
    ),
    statusIdx: index('capacity_plans_status_idx').on(
      table.tenantId,
      table.status
    ),
    parentIdx: index('capacity_plans_parent_idx').on(table.parentPlanId),
  })
);
```

### on_call_schedules

```typescript
export const onCallSchedules = pgTable(
  'ops_cal_on_call_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    name: text('name').notNull(),
    description: text('description'),
    teamId: uuid('team_id').notNull(),
    serviceId: uuid('service_id'),
    rotationType: text('rotation_type').notNull().default('weekly'),
    rotationStartDay: integer('rotation_start_day').notNull().default(1),
    rotationStartTime: text('rotation_start_time').notNull().default('09:00'),
    timezone: text('timezone').notNull().default('UTC'),
    participants: jsonb('participants').notNull().default([]),
    currentOnCallUserId: uuid('current_on_call_user_id'),
    currentRotationIndex: integer('current_rotation_index').notNull().default(0),
    currentRotationStart: timestamp('current_rotation_start', {
      withTimezone: true,
    }),
    currentRotationEnd: timestamp('current_rotation_end', {
      withTimezone: true,
    }),
    escalationChainId: uuid('escalation_chain_id'),
    maxConsecutiveRotations: integer('max_consecutive_rotations')
      .notNull()
      .default(3),
    minimumRestHoursBetween: integer('minimum_rest_hours_between')
      .notNull()
      .default(24),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').notNull().default({}),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    tenantIdx: index('on_call_schedules_tenant_idx').on(table.tenantId),
    teamIdx: index('on_call_schedules_team_idx').on(
      table.tenantId,
      table.teamId
    ),
    serviceIdx: index('on_call_schedules_service_idx').on(
      table.tenantId,
      table.serviceId
    ),
    activeIdx: index('on_call_schedules_active_idx').on(
      table.tenantId,
      table.isActive
    ),
  })
);
```

### on_call_rotations

```typescript
export const onCallRotations = pgTable(
  'ops_cal_on_call_rotations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => onCallSchedules.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    rotationIndex: integer('rotation_index').notNull(),
    isOverride: boolean('is_override').notNull().default(false),
    overrideReason: text('override_reason'),
    overriddenBy: uuid('overridden_by'),
    status: text('status').notNull().default('scheduled'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    tenantIdx: index('on_call_rotations_tenant_idx').on(table.tenantId),
    scheduleIdx: index('on_call_rotations_schedule_idx').on(
      table.tenantId,
      table.scheduleId
    ),
    userIdx: index('on_call_rotations_user_idx').on(
      table.tenantId,
      table.userId
    ),
    timeRangeIdx: index('on_call_rotations_time_idx').on(
      table.tenantId,
      table.scheduleId,
      table.startTime,
      table.endTime
    ),
    currentIdx: index('on_call_rotations_current_idx').on(
      table.tenantId,
      table.scheduleId,
      table.status
    ),
  })
);
```

### blackout_periods

```typescript
export const blackoutPeriods = pgTable(
  'ops_cal_blackout_periods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    name: text('name').notNull(),
    description: text('description'),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    timezone: text('timezone').notNull().default('UTC'),
    scope: text('scope').notNull().default('global'),
    scopeEntityId: uuid('scope_entity_id'),
    blockedActions: jsonb('blocked_actions').notNull().default(['all']),
    allowExceptions: boolean('allow_exceptions').notNull().default(false),
    exceptionApprovalLevel: text('exception_approval_level')
      .notNull()
      .default('manager'),
    isRecurring: boolean('is_recurring').notNull().default(false),
    recurrenceRule: text('recurrence_rule'),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    tenantIdx: index('blackout_periods_tenant_idx').on(table.tenantId),
    timeRangeIdx: index('blackout_periods_time_idx').on(
      table.tenantId,
      table.startTime,
      table.endTime
    ),
    scopeIdx: index('blackout_periods_scope_idx').on(
      table.tenantId,
      table.scope,
      table.scopeEntityId
    ),
    activeIdx: index('blackout_periods_active_idx').on(
      table.tenantId,
      table.isActive
    ),
  })
);
```

### schedule_templates

```typescript
export const scheduleTemplates = pgTable(
  'ops_cal_schedule_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    name: text('name').notNull(),
    description: text('description'),
    departmentId: uuid('department_id'),
    teamId: uuid('team_id'),
    pattern: jsonb('pattern').notNull(),
    autoGenerate: boolean('auto_generate').notNull().default(false),
    generateLeadDays: integer('generate_lead_days').notNull().default(14),
    generationFrequency: text('generation_frequency')
      .notNull()
      .default('weekly'),
    coverageRequirements: jsonb('coverage_requirements').notNull().default([]),
    shiftTemplateIds: jsonb('shift_template_ids').notNull().default([]),
    isDefault: boolean('is_default').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    metadata: jsonb('metadata').notNull().default({}),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    tenantIdx: index('schedule_templates_tenant_idx').on(table.tenantId),
    departmentIdx: index('schedule_templates_dept_idx').on(
      table.tenantId,
      table.departmentId
    ),
    activeIdx: index('schedule_templates_active_idx').on(
      table.tenantId,
      table.isActive
    ),
    defaultIdx: index('schedule_templates_default_idx').on(
      table.tenantId,
      table.departmentId,
      table.isDefault
    ),
  })
);
```

### coverage_gaps

```typescript
export const coverageGaps = pgTable(
  'ops_cal_coverage_gaps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    periodId: uuid('period_id').notNull().references(() => schedulePeriods.id),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    roleId: uuid('role_id').notNull(),
    departmentId: uuid('department_id').notNull(),
    requiredStaff: integer('required_staff').notNull(),
    scheduledStaff: integer('scheduled_staff').notNull(),
    shortfall: integer('shortfall').notNull(),
    severity: text('severity').notNull().default('medium'),
    status: text('status').notNull().default('open'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: uuid('resolved_by'),
    resolution: text('resolution'),
    suggestedActions: jsonb('suggested_actions').notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('coverage_gaps_tenant_idx').on(table.tenantId),
    periodIdx: index('coverage_gaps_period_idx').on(
      table.tenantId,
      table.periodId
    ),
    severityIdx: index('coverage_gaps_severity_idx').on(
      table.tenantId,
      table.severity
    ),
    openIdx: index('coverage_gaps_open_idx').on(
      table.tenantId,
      table.status
    ).where(sql`status = 'open'`),
  })
);
```

### Additional Supporting Tables

```typescript
// === Schedule Periods ===
export const schedulePeriods = pgTable(
  'ops_cal_schedule_periods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    name: text('name').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    timezone: text('timezone').notNull().default('UTC'),
    status: text('status').notNull().default('draft'),
    departmentId: uuid('department_id').notNull(),
    templateId: uuid('template_id').references(() => scheduleTemplates.id),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    publishedBy: uuid('published_by'),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    lockedBy: uuid('locked_by'),
    version: integer('version').notNull().default(1),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    tenantIdx: index('schedule_periods_tenant_idx').on(table.tenantId),
    dateRangeIdx: index('schedule_periods_date_idx').on(
      table.tenantId,
      table.startDate,
      table.endDate
    ),
    departmentIdx: index('schedule_periods_dept_idx').on(
      table.tenantId,
      table.departmentId
    ),
    statusIdx: index('schedule_periods_status_idx').on(
      table.tenantId,
      table.status
    ),
  })
);

// === Coverage Requirements ===
export const coverageRequirements = pgTable(
  'ops_cal_coverage_requirements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    departmentId: uuid('department_id').notNull(),
    roleId: uuid('role_id').notNull(),
    locationId: uuid('location_id'),
    startTimeOffset: integer('start_time_offset').notNull(),
    endTimeOffset: integer('end_time_offset').notNull(),
    daysOfWeek: jsonb('days_of_week').notNull().default([]),
    minimumStaff: integer('minimum_staff').notNull().default(1),
    idealStaff: integer('ideal_staff').notNull().default(1),
    maximumStaff: integer('maximum_staff'),
    requiredSkills: jsonb('required_skills').notNull().default([]),
    priority: integer('priority').notNull().default(0),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').notNull(),
  },
  (table) => ({
    tenantIdx: index('coverage_reqs_tenant_idx').on(table.tenantId),
    departmentIdx: index('coverage_reqs_dept_idx').on(
      table.tenantId,
      table.departmentId
    ),
    roleIdx: index('coverage_reqs_role_idx').on(
      table.tenantId,
      table.roleId
    ),
    activeIdx: index('coverage_reqs_active_idx').on(
      table.tenantId,
      table.isActive
    ),
  })
);

// === Overtime Records ===
export const overtimeRecords = pgTable(
  'ops_cal_overtime_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    userId: uuid('user_id').notNull(),
    periodId: uuid('period_id').notNull().references(() => schedulePeriods.id),
    weekStartDate: timestamp('week_start_date', { withTimezone: true }).notNull(),
    regularMinutes: integer('regular_minutes').notNull().default(0),
    overtimeMinutes: integer('overtime_minutes').notNull().default(0),
    doubleTimeMinutes: integer('double_time_minutes').notNull().default(0),
    totalMinutes: integer('total_minutes').notNull().default(0),
    thresholdWeekly: integer('threshold_weekly').notNull(),
    thresholdDaily: integer('threshold_daily').notNull(),
    status: text('status').notNull().default('calculated'),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('overtime_records_tenant_idx').on(table.tenantId),
    userIdx: index('overtime_records_user_idx').on(
      table.tenantId,
      table.userId
    ),
    periodIdx: index('overtime_records_period_idx').on(
      table.tenantId,
      table.periodId
    ),
    weekIdx: index('overtime_records_week_idx').on(
      table.tenantId,
      table.userId,
      table.weekStartDate
    ),
  })
);

// === Compliance Violations ===
export const complianceViolations = pgTable(
  'ops_cal_compliance_violations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    ruleId: uuid('rule_id').notNull(),
    ruleName: text('rule_name').notNull(),
    userId: uuid('user_id').notNull(),
    violationDate: timestamp('violation_date', { withTimezone: true }).notNull(),
    periodId: uuid('period_id').notNull().references(() => schedulePeriods.id),
    description: text('description').notNull(),
    severity: text('severity').notNull().default('warning'),
    actualValue: real('actual_value').notNull(),
    limitValue: real('limit_value').notNull(),
    unit: text('unit').notNull(),
    status: text('status').notNull().default('open'),
    resolvedBy: uuid('resolved_by'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolution: text('resolution'),
    waiverGranted: boolean('waiver_granted').notNull().default(false),
    waiverApprovedBy: uuid('waiver_approved_by'),
    waiverReason: text('waiver_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('compliance_violations_tenant_idx').on(table.tenantId),
    userIdx: index('compliance_violations_user_idx').on(
      table.tenantId,
      table.userId
    ),
    periodIdx: index('compliance_violations_period_idx').on(
      table.tenantId,
      table.periodId
    ),
    severityIdx: index('compliance_violations_severity_idx').on(
      table.tenantId,
      table.severity
    ),
    statusIdx: index('compliance_violations_status_idx').on(
      table.tenantId,
      table.status
    ),
  })
);

// === Schedule Audit Log ===
export const scheduleAuditLog = pgTable(
  'ops_cal_schedule_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    action: text('action').notNull(),
    actorId: uuid('actor_id').notNull(),
    actorType: text('actor_type').notNull().default('user'),
    previousState: jsonb('previous_state'),
    newState: jsonb('new_state'),
    diff: jsonb('diff'),
    reason: text('reason'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('schedule_audit_tenant_idx').on(table.tenantId),
    entityIdx: index('schedule_audit_entity_idx').on(
      table.tenantId,
      table.entityType,
      table.entityId
    ),
    actorIdx: index('schedule_audit_actor_idx').on(
      table.tenantId,
      table.actorId
    ),
    createdAtIdx: index('schedule_audit_created_idx').on(
      table.tenantId,
      table.createdAt
    ),
  })
);
```

### Row-Level Security Policies

```sql
-- All tables follow the same RLS pattern for tenant isolation
-- Example for shifts table:

ALTER TABLE ops_cal_shifts ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: users can only see shifts in their tenant
CREATE POLICY "shifts_tenant_isolation" ON ops_cal_shifts
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Read access: all authenticated users in the tenant
CREATE POLICY "shifts_select" ON ops_cal_shifts
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Insert: users with scheduler or admin role
CREATE POLICY "shifts_insert" ON ops_cal_shifts
  FOR INSERT
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = current_setting('app.current_user_id')::uuid
        AND role IN ('scheduler', 'ops_admin', 'admin')
        AND tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );

-- Update: schedulers can update draft/published, admins can update any
CREATE POLICY "shifts_update" ON ops_cal_shifts
  FOR UPDATE
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      -- Schedulers can update non-locked shifts
      (status NOT IN ('locked', 'archived') AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = current_setting('app.current_user_id')::uuid
          AND role IN ('scheduler', 'ops_admin')
          AND tenant_id = current_setting('app.current_tenant_id')::uuid
      ))
      OR
      -- Admins can update anything
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = current_setting('app.current_user_id')::uuid
          AND role = 'admin'
          AND tenant_id = current_setting('app.current_tenant_id')::uuid
      )
    )
  );

-- Delete: admin only, and only draft shifts
CREATE POLICY "shifts_delete" ON ops_cal_shifts
  FOR DELETE
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND status = 'draft'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = current_setting('app.current_user_id')::uuid
        AND role IN ('ops_admin', 'admin')
        AND tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );

-- Similar policies applied to all ops_cal_* tables
-- shift_assignments has additional policy allowing users to update their own assignments
-- shift_swaps allows source/target users to update their own swap requests
```

---

## Code Examples

### Example 1: Creating a Schedule Period and Generating Shifts

```typescript
import { OpsCalendarService } from '@mcv/operations/calendar';
import { addDays, startOfWeek, endOfWeek } from 'date-fns';

async function createWeeklySchedule(
  calendarService: OpsCalendarService,
  departmentId: string,
  templateId: string
) {
  // Step 1: Create a new schedule period for next week
  const nextMonday = startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 });
  const nextSunday = endOfWeek(nextMonday, { weekStartsOn: 1 });

  const period = await calendarService.createPeriod({
    name: `Week of ${nextMonday.toISOString().split('T')[0]}`,
    startDate: nextMonday,
    endDate: nextSunday,
    timezone: 'America/Toronto',
    departmentId,
    templateId,
  });

  console.log(`Created period: ${period.id} (${period.status})`);
  // → Created period: a1b2c3d4-... (draft)

  // Step 2: Generate shifts from the template
  const shifts = await calendarService.generateShiftsFromTemplate(
    period.id,
    templateId
  );

  console.log(`Generated ${shifts.length} shifts for the period`);
  // → Generated 21 shifts for the period (3 shifts/day × 7 days)

  // Step 3: Auto-fill assignments based on availability and preferences
  const autoFillResult = await calendarService.autoFillPeriod(
    period.id,
    templateId
  );

  console.log(`Auto-fill: ${autoFillResult.assignedCount} assigned, ` +
    `${autoFillResult.unfilledCount} unfilled, ` +
    `${autoFillResult.violations.length} violations`);

  // Step 4: Validate compliance before publishing
  const validation = await calendarService.validateSchedule(period.id);

  if (validation.isValid) {
    // Step 5: Publish the schedule
    const publishResult = await calendarService.publishPeriod(period.id);
    console.log(`Published! ${publishResult.notificationsSent} notifications sent`);
  } else {
    console.error('Compliance issues found:');
    for (const violation of validation.violations) {
      console.error(`  [${violation.severity}] ${violation.description}`);
    }
  }

  return period;
}
```

### Example 2: Handling Shift Swap Requests

```typescript
import { OpsCalendarService } from '@mcv/operations/calendar';

async function handleShiftSwap(
  calendarService: OpsCalendarService,
  sourceAssignmentId: string,
  targetAssignmentId: string,
  reason: string
) {
  // Step 1: Request a swap
  const swapRequest = await calendarService.requestSwap({
    type: 'swap',
    sourceAssignmentId,
    targetAssignmentId,
    reason,
  });

  console.log(`Swap request created: ${swapRequest.id}`);
  console.log(`Status: ${swapRequest.status}`);
  // → Status: pending_peer
  console.log(`Compliance check: ${swapRequest.complianceCheckPassed ? '✓' : '✗'}`);

  if (!swapRequest.complianceCheckPassed) {
    console.warn('Compliance warnings:');
    for (const v of swapRequest.complianceViolations) {
      console.warn(`  - ${v.description} (${v.severity})`);
    }
  }

  return swapRequest;
}

// Target user responds to the swap request
async function respondToSwapRequest(
  calendarService: OpsCalendarService,
  swapId: string,
  accept: boolean
) {
  const updated = await calendarService.respondToSwap(swapId, accept, 'Works for me');

  if (updated.status === 'pending_approval') {
    console.log('Swap accepted by peer, awaiting manager approval');
  } else if (updated.status === 'approved') {
    console.log('Swap approved (no manager approval required)');
  } else if (updated.status === 'declined') {
    console.log('Swap declined by peer');
  }

  return updated;
}

// Manager approves the swap
async function managerApproveSwap(
  calendarService: OpsCalendarService,
  swapId: string
) {
  const approved = await calendarService.approveSwap(
    swapId,
    'Approved — both employees are qualified for the swapped shifts'
  );

  // At this point, the assignments have been automatically swapped
  console.log(`Swap executed: ${approved.status}`);
  // → Swap executed: approved

  return approved;
}
```

### Example 3: Resource Scheduling with Conflict Detection

```typescript
import { OpsCalendarService } from '@mcv/operations/calendar';

async function scheduleConferenceRoom(
  calendarService: OpsCalendarService,
  roomId: string
) {
  const startTime = new Date('2026-02-10T14:00:00Z');
  const endTime = new Date('2026-02-10T16:00:00Z');

  // Step 1: Check availability
  const availability = await calendarService.checkResourceAvailability(
    roomId,
    startTime,
    endTime
  );

  if (!availability.isAvailable) {
    console.log('Room is not available. Conflicts:');
    for (const conflict of availability.conflicts) {
      console.log(`  ${conflict.title}: ${conflict.startTime} - ${conflict.endTime}`);
      console.log(`  Booked by: ${conflict.bookedBy}`);
    }

    // Suggest alternative times
    console.log('\nAlternative slots:');
    for (const slot of availability.alternativeSlots) {
      console.log(`  ${slot.startTime} - ${slot.endTime}`);
    }
    return null;
  }

  // Step 2: Book the resource
  const booking = await calendarService.scheduleResource({
    resourceId: roomId,
    resourceType: 'room',
    title: 'Sprint Planning',
    description: 'Q2 sprint planning session',
    startTime,
    endTime,
    timezone: 'America/Toronto',
    associatedEntityType: 'meeting',
    associatedEntityId: 'meeting-123',
  });

  console.log(`Booked: ${booking.id} (${booking.status})`);
  // → Booked: r1s2t3u4-... (confirmed)

  return booking;
}

// Schedule equipment with recurring booking
async function scheduleVehicle(
  calendarService: OpsCalendarService,
  vehicleId: string
) {
  const booking = await calendarService.scheduleResource({
    resourceId: vehicleId,
    resourceType: 'vehicle',
    title: 'Daily delivery route',
    startTime: new Date('2026-02-10T08:00:00Z'),
    endTime: new Date('2026-02-10T17:00:00Z'),
    timezone: 'America/Toronto',
    isRecurring: true,
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=52',
    metadata: {
      route: 'Route A - Downtown',
      driver: 'user-456',
    },
  });

  return booking;
}
```

### Example 4: On-Call Schedule with Escalation

```typescript
import { OpsCalendarService } from '@mcv/operations/calendar';

async function setupOnCallSchedule(calendarService: OpsCalendarService) {
  // Step 1: Create an escalation chain
  const escalationChain = await calendarService.createEscalationChain({
    name: 'Production Incident Escalation',
    steps: [
      {
        order: 1,
        targetType: 'on_call_current',
        targetId: 'current',
        timeoutMinutes: 5,
        notificationMethods: ['push', 'sms'],
      },
      {
        order: 2,
        targetType: 'on_call_current',
        targetId: 'current',
        timeoutMinutes: 10,
        notificationMethods: ['phone'],
      },
      {
        order: 3,
        targetType: 'role',
        targetId: 'engineering-lead',
        timeoutMinutes: 15,
        notificationMethods: ['push', 'sms', 'phone'],
      },
      {
        order: 4,
        targetType: 'team',
        targetId: 'team-sre',
        timeoutMinutes: 10,
        notificationMethods: ['push', 'sms'],
      },
    ],
    fallbackAction: 'page_everyone',
    maxRepetitions: 2,
  });

  // Step 2: Create the on-call schedule
  const schedule = await calendarService.createOnCallSchedule({
    name: 'Production On-Call - Primary',
    teamId: 'team-backend',
    serviceId: 'service-api',
    rotationType: 'weekly',
    rotationStartDay: 1, // Monday
    rotationStartTime: '09:00',
    timezone: 'America/Toronto',
    participants: [
      { userId: 'user-alice', order: 1, isActive: true, unavailableDates: [] },
      { userId: 'user-bob', order: 2, isActive: true, unavailableDates: [] },
      { userId: 'user-charlie', order: 3, isActive: true, unavailableDates: [] },
      { userId: 'user-diana', order: 4, isActive: true, unavailableDates: [] },
    ],
    escalationChainId: escalationChain.id,
    maxConsecutiveRotations: 2,
    minimumRestHoursBetween: 48,
  });

  console.log(`On-call schedule created: ${schedule.name}`);
  console.log(`Current on-call: ${schedule.currentOnCallUserId}`);

  return schedule;
}

// Create a temporary override
async function createOnCallOverride(
  calendarService: OpsCalendarService,
  scheduleId: string
) {
  const override = await calendarService.createOverride({
    scheduleId,
    originalUserId: 'user-alice',
    replacementUserId: 'user-bob',
    startTime: new Date('2026-02-14T09:00:00-05:00'),
    endTime: new Date('2026-02-15T09:00:00-05:00'),
    reason: 'Alice has a doctor appointment',
  });

  console.log(`Override created: ${override.id}`);
  console.log(`Bob covers for Alice: ${override.startTime} - ${override.endTime}`);

  return override;
}

// Query who is currently on-call
async function whoIsOnCall(
  calendarService: OpsCalendarService,
  scheduleId: string
) {
  const current = await calendarService.getCurrentOnCall(scheduleId);
  console.log(`Currently on-call: ${current.userId}`);
  return current;
}
```

### Example 5: Capacity Planning with What-If Scenarios

```typescript
import { OpsCalendarService } from '@mcv/operations/calendar';

async function planNextQuarterCapacity(calendarService: OpsCalendarService) {
  // Step 1: Create a baseline capacity plan
  const plan = await calendarService.createCapacityPlan({
    name: 'Q2 2026 — Customer Support',
    description: 'Capacity planning for customer support team',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-06-30'),
    timezone: 'America/Toronto',
    granularity: 'daily',
    departmentId: 'dept-support',
    roleId: 'role-support-agent',
    modelConfig: {
      lookbackDays: 365,
      seasonalAdjustment: true,
      trendDetection: true,
      confidenceLevel: 0.85,
      dayOfWeekMultipliers: {
        0: 0.6,  // Sunday
        1: 1.2,  // Monday (post-weekend surge)
        2: 1.0,
        3: 1.0,
        4: 1.0,
        5: 0.9,  // Friday
        6: 0.5,  // Saturday
      },
    },
  });

  // Step 2: Generate demand forecast from historical data
  const forecast = await calendarService.generateForecast(plan.id);
  console.log(`Forecast generated: ${forecast.dataPoints.length} data points`);
  console.log(`Average daily demand: ${forecast.averageDailyDemand}`);
  console.log(`Peak demand day: ${forecast.peakDemandDate} (${forecast.peakDemandValue})`);

  // Step 3: Identify bottlenecks
  const bottlenecks = await calendarService.identifyBottlenecks(plan.id);
  console.log(`\nBottlenecks identified: ${bottlenecks.length}`);
  for (const bn of bottlenecks) {
    console.log(`  ${bn.timestamp.toISOString().split('T')[0]}: ` +
      `${bn.severity} — shortfall of ${bn.shortfall} (${bn.suggestion})`);
  }

  // Step 4: Run what-if scenario — "What if we hire 2 more agents?"
  const whatIf = await calendarService.runWhatIfScenario(plan.id, {
    name: 'Hire 2 additional agents',
    adjustments: [
      {
        type: 'add_capacity',
        value: 2,
        startDate: new Date('2026-04-15'), // After onboarding
        endDate: new Date('2026-06-30'),
      },
    ],
  });

  console.log(`\nWhat-if: "${whatIf.scenario.name}"`);
  console.log(`  Bottlenecks reduced: ${bottlenecks.length} → ${whatIf.remainingBottlenecks}`);
  console.log(`  Coverage improvement: +${whatIf.coverageImprovementPercent}%`);
  console.log(`  Additional cost: $${whatIf.additionalCostEstimate}/month`);

  return plan;
}
```

### Example 6: Blackout Period with Exception Handling

```typescript
import { OpsCalendarService } from '@mcv/operations/calendar';

async function setupHolidayFreeze(calendarService: OpsCalendarService) {
  // Step 1: Create a deployment freeze for the holiday season
  const blackout = await calendarService.createBlackoutPeriod({
    name: 'Holiday Deployment Freeze 2026',
    description: 'No production deployments during holiday period',
    startTime: new Date('2026-12-20T00:00:00-05:00'),
    endTime: new Date('2027-01-03T00:00:00-05:00'),
    timezone: 'America/Toronto',
    scope: 'global',
    blockedActions: ['deployment', 'maintenance'],
    allowExceptions: true,
    exceptionApprovalLevel: 'vp',
    isRecurring: true,
    recurrenceRule: 'FREQ=YEARLY',
    metadata: {
      policy: 'SEC-2024-FREEZE-001',
      notifyChannel: '#engineering-all',
    },
  });

  console.log(`Blackout created: ${blackout.name}`);
  console.log(`Period: ${blackout.startTime} - ${blackout.endTime}`);
  console.log(`Exceptions allowed: ${blackout.allowExceptions} (requires ${blackout.exceptionApprovalLevel} approval)`);

  return blackout;
}

// Check if a proposed action conflicts with any blackout
async function checkBeforeDeployment(
  calendarService: OpsCalendarService,
  deploymentTime: Date
) {
  const conflicts = await calendarService.checkBlackoutConflicts(
    deploymentTime,
    new Date(deploymentTime.getTime() + 2 * 60 * 60 * 1000), // 2-hour window
    'deployment'
  );

  if (conflicts.length > 0) {
    console.log('⚠️ Deployment blocked by blackout periods:');
    for (const conflict of conflicts) {
      console.log(`  ${conflict.name}: ${conflict.startTime} - ${conflict.endTime}`);
      if (conflict.allowExceptions) {
        console.log(`  Exception possible with ${conflict.exceptionApprovalLevel} approval`);
      } else {
        console.log('  No exceptions allowed');
      }
    }
    return false;
  }

  console.log('✅ No blackout conflicts — deployment can proceed');
  return true;
}

// Request an exception for a critical hotfix
async function requestBlackoutException(
  calendarService: OpsCalendarService,
  blackoutId: string
) {
  const exception = await calendarService.requestBlackoutException({
    blackoutId,
    requestedAction: 'deployment',
    requestedStartTime: new Date('2026-12-24T10:00:00-05:00'),
    requestedEndTime: new Date('2026-12-24T11:00:00-05:00'),
    reason: 'Critical security hotfix — CVE-2026-XXXXX affects payment processing',
    riskAssessment: 'Low — single-service deployment with rollback plan',
    rollbackPlan: 'Automated rollback via ArgoCD if health checks fail',
    approverIds: ['user-vp-engineering'],
  });

  console.log(`Exception request: ${exception.id} (${exception.status})`);
  // → Exception request: ex-1234-... (pending_approval)

  return exception;
}
```

### Example 7: Compliance Engine — Labor Law Validation

```typescript
import { ComplianceEngine, LaborLawValidator } from '@mcv/operations/calendar';

async function configureLaborCompliance(complianceEngine: ComplianceEngine) {
  // Configure Ontario labor law rules
  const rules = [
    {
      name: 'ESA — Maximum Daily Hours',
      category: 'labor_law' as const,
      jurisdictionId: 'CA-ON',
      type: 'max_hours_per_day' as const,
      parameters: { maxHours: 13 },
      severity: 'critical' as const,
      isBlocking: true,
      description: 'Ontario ESA: No employee shall work more than 13 hours per day without written agreement',
    },
    {
      name: 'ESA — Maximum Weekly Hours',
      category: 'labor_law' as const,
      jurisdictionId: 'CA-ON',
      type: 'max_hours_per_week' as const,
      parameters: { maxHours: 48 },
      severity: 'critical' as const,
      isBlocking: true,
      description: 'Ontario ESA: Maximum 48 hours per work week without overtime agreement',
    },
    {
      name: 'ESA — Minimum Rest Between Shifts',
      category: 'labor_law' as const,
      jurisdictionId: 'CA-ON',
      type: 'min_rest_between_shifts' as const,
      parameters: { minHours: 8 },
      severity: 'critical' as const,
      isBlocking: true,
      description: 'Ontario ESA: Minimum 8 consecutive hours free from work between shifts',
    },
    {
      name: 'ESA — Eating Period',
      category: 'labor_law' as const,
      jurisdictionId: 'CA-ON',
      type: 'mandatory_break_after' as const,
      parameters: { workHours: 5, breakMinutes: 30 },
      severity: 'error' as const,
      isBlocking: true,
      description: 'Ontario ESA: 30-minute eating period after every 5 hours of work',
    },
    {
      name: 'ESA — Weekly Day Off',
      category: 'labor_law' as const,
      jurisdictionId: 'CA-ON',
      type: 'min_days_off_per_week' as const,
      parameters: { minDaysOff: 1, perWeeks: 1 },
      severity: 'critical' as const,
      isBlocking: true,
      description: 'Ontario ESA: At least 1 day off per work week (or 2 consecutive days per 2 work weeks)',
    },
    {
      name: 'Overtime Alert — Approaching Weekly Max',
      category: 'organizational' as const,
      type: 'max_overtime_per_week' as const,
      parameters: { maxOvertimeHours: 8, warnAtHours: 6 },
      severity: 'warning' as const,
      isBlocking: false,
      description: 'Alert when employee approaches weekly overtime cap',
    },
    {
      name: 'Consecutive Days Limit',
      category: 'organizational' as const,
      type: 'max_consecutive_days' as const,
      parameters: { maxDays: 6 },
      severity: 'error' as const,
      isBlocking: true,
      description: 'No more than 6 consecutive working days without a rest day',
    },
    {
      name: 'Night Shift Limit',
      category: 'organizational' as const,
      type: 'max_night_shifts_consecutive' as const,
      parameters: { maxShifts: 4, nightStartHour: 22, nightEndHour: 6 },
      severity: 'warning' as const,
      isBlocking: false,
      description: 'Maximum 4 consecutive night shifts before mandatory rest',
    },
  ];

  for (const rule of rules) {
    await complianceEngine.addRule(rule);
  }

  console.log(`Configured ${rules.length} compliance rules`);
}

// Validate a schedule period against all rules
async function validatePeriodCompliance(
  calendarService: OpsCalendarService,
  periodId: string
) {
  const result = await calendarService.validateSchedule(periodId);

  console.log(`Compliance validation for period ${periodId}:`);
  console.log(`  Valid: ${result.isValid}`);
  console.log(`  Critical: ${result.criticalCount}`);
  console.log(`  Errors: ${result.errorCount}`);
  console.log(`  Warnings: ${result.warningCount}`);

  if (!result.isValid) {
    console.log('\nBlocking violations:');
    for (const v of result.violations.filter((v) => v.severity === 'critical')) {
      console.log(`  ❌ ${v.ruleName}: ${v.description}`);
      console.log(`     User: ${v.userId} | Actual: ${v.actualValue}${v.unit} | Limit: ${v.limitValue}${v.unit}`);
    }
  }

  return result;
}
```

### Example 8: Coverage Analysis and Reporting

```typescript
import { OpsCalendarService } from '@mcv/operations/calendar';

async function analyzeCoverage(
  calendarService: OpsCalendarService,
  periodId: string
) {
  // Step 1: Generate coverage report
  const report = await calendarService.generateCoverageReport(periodId);

  console.log('=== Coverage Report ===');
  console.log(`Period: ${report.startDate.toISOString().split('T')[0]} to ${report.endDate.toISOString().split('T')[0]}`);
  console.log(`\nSummary:`);
  console.log(`  Total required hours: ${report.summary.totalRequiredHours}`);
  console.log(`  Total scheduled hours: ${report.summary.totalScheduledHours}`);
  console.log(`  Coverage: ${report.summary.coveragePercent.toFixed(1)}%`);
  console.log(`  Gaps: ${report.summary.totalGaps}`);
  console.log(`  Overstaffed hours: ${report.summary.totalOverstaffedHours}`);
  console.log(`  Understaffed hours: ${report.summary.totalUnderstaffedHours}`);

  // Step 2: Highlight critical gaps
  const criticalGaps = report.gaps.filter((g) => g.severity === 'critical');
  if (criticalGaps.length > 0) {
    console.log(`\n⚠️ Critical Coverage Gaps (${criticalGaps.length}):`);
    for (const gap of criticalGaps) {
      console.log(`  ${gap.startTime.toISOString()} - ${gap.endTime.toISOString()}`);
      console.log(`    Role: ${gap.roleId} | Need: ${gap.requiredStaff} | Have: ${gap.scheduledStaff} | Short: ${gap.shortfall}`);
      console.log(`    Suggestions: ${gap.suggestedActions.join(', ')}`);
    }
  }

  // Step 3: Show recommendations
  if (report.recommendations.length > 0) {
    console.log(`\n📋 Recommendations (${report.recommendations.length}):`);
    for (const rec of report.recommendations) {
      console.log(`  [${rec.type}] ${rec.description}`);
      console.log(`    Impact: ${rec.impact}`);
    }
  }

  // Step 4: Generate overtime report
  const overtimeReport = await calendarService.generateOvertimeReport({
    periodId,
    includeProjections: true,
  });

  console.log(`\n=== Overtime Report ===`);
  console.log(`Total overtime hours: ${overtimeReport.totalOvertimeHours}`);
  console.log(`Employees with overtime: ${overtimeReport.employeesWithOvertime}`);
  console.log(`Estimated overtime cost: $${overtimeReport.estimatedCost.toFixed(2)}`);

  if (overtimeReport.projections) {
    console.log(`\nProjection for rest of period:`);
    console.log(`  Projected additional OT: ${overtimeReport.projections.additionalHours}h`);
    console.log(`  Projected additional cost: $${overtimeReport.projections.additionalCost.toFixed(2)}`);
  }

  // Step 5: Utilization report for resources
  const utilization = await calendarService.generateUtilizationReport({
    startDate: report.startDate,
    endDate: report.endDate,
    resourceTypes: ['room', 'equipment'],
  });

  console.log(`\n=== Resource Utilization ===`);
  for (const resource of utilization.resources) {
    console.log(`  ${resource.name} (${resource.type}): ${resource.utilizationPercent.toFixed(1)}%`);
    if (resource.utilizationPercent < 30) {
      console.log(`    ⚡ Underutilized — consider consolidating`);
    } else if (resource.utilizationPercent > 90) {
      console.log(`    🔥 Near capacity — consider adding capacity`);
    }
  }

  return report;
}
```

---

## Error Codes

All errors follow the MCV error format with the `OPS_CAL_` prefix.

| Code | HTTP | Description |
|------|------|-------------|
| `OPS_CAL_SHIFT_NOT_FOUND` | 404 | Shift with the specified ID does not exist or is not accessible |
| `OPS_CAL_SHIFT_CONFLICT` | 409 | Shift assignment conflicts with an existing assignment for the user |
| `OPS_CAL_SHIFT_FULL` | 409 | Shift has reached maximum staff capacity |
| `OPS_CAL_SHIFT_LOCKED` | 403 | Cannot modify a shift in a locked or archived period |
| `OPS_CAL_SHIFT_NOT_OPEN` | 400 | Shift is not on the open shift board |
| `OPS_CAL_ASSIGNMENT_NOT_FOUND` | 404 | Shift assignment does not exist |
| `OPS_CAL_ASSIGNMENT_ALREADY_EXISTS` | 409 | User is already assigned to this shift |
| `OPS_CAL_ASSIGNMENT_INVALID_STATUS` | 400 | Assignment cannot transition to the requested status |
| `OPS_CAL_SWAP_NOT_FOUND` | 404 | Swap request does not exist |
| `OPS_CAL_SWAP_EXPIRED` | 410 | Swap request has expired |
| `OPS_CAL_SWAP_INVALID_STATUS` | 400 | Swap request cannot transition to the requested status |
| `OPS_CAL_SWAP_SELF_NOT_ALLOWED` | 400 | Cannot swap a shift with yourself |
| `OPS_CAL_SWAP_COMPLIANCE_BLOCK` | 422 | Swap would create a compliance violation that cannot be waived |
| `OPS_CAL_PERIOD_NOT_FOUND` | 404 | Schedule period does not exist |
| `OPS_CAL_PERIOD_LOCKED` | 403 | Schedule period is locked and cannot be modified |
| `OPS_CAL_PERIOD_NOT_DRAFT` | 400 | Operation requires the period to be in draft status |
| `OPS_CAL_PERIOD_PUBLISH_FAILED` | 422 | Period cannot be published due to unresolved issues |
| `OPS_CAL_RESOURCE_NOT_FOUND` | 404 | Resource does not exist |
| `OPS_CAL_RESOURCE_CONFLICT` | 409 | Resource scheduling conflict — double-booking not allowed |
| `OPS_CAL_RESOURCE_UNAVAILABLE` | 409 | Resource is unavailable during the requested time (maintenance, etc.) |
| `OPS_CAL_RESOURCE_INVALID_TYPE` | 400 | Unknown or unsupported resource type |
| `OPS_CAL_BLACKOUT_ACTIVE` | 403 | Action blocked by an active blackout period |
| `OPS_CAL_BLACKOUT_NOT_FOUND` | 404 | Blackout period does not exist |
| `OPS_CAL_BLACKOUT_EXCEPTION_DENIED` | 403 | Blackout exception request was denied |
| `OPS_CAL_BLACKOUT_NO_EXCEPTIONS` | 400 | This blackout period does not allow exceptions |
| `OPS_CAL_ONCALL_NOT_FOUND` | 404 | On-call schedule does not exist |
| `OPS_CAL_ONCALL_NO_PARTICIPANTS` | 400 | On-call schedule has no active participants |
| `OPS_CAL_ONCALL_OVERRIDE_CONFLICT` | 409 | Override conflicts with an existing override |
| `OPS_CAL_ONCALL_REST_VIOLATION` | 422 | Override would violate minimum rest requirements |
| `OPS_CAL_COMPLIANCE_CRITICAL` | 422 | Critical compliance violation blocks the operation |
| `OPS_CAL_COMPLIANCE_RULE_NOT_FOUND` | 404 | Compliance rule does not exist |
| `OPS_CAL_COMPLIANCE_WAIVER_DENIED` | 403 | Insufficient permission to waive this violation |
| `OPS_CAL_TEMPLATE_NOT_FOUND` | 404 | Schedule or shift template does not exist |
| `OPS_CAL_TEMPLATE_INACTIVE` | 400 | Template is inactive and cannot be used for generation |
| `OPS_CAL_TEMPLATE_EXPIRED` | 400 | Template is past its effective end date |
| `OPS_CAL_CAPACITY_PLAN_NOT_FOUND` | 404 | Capacity plan does not exist |
| `OPS_CAL_FORECAST_INSUFFICIENT_DATA` | 422 | Not enough historical data to generate a forecast |
| `OPS_CAL_AUTOFILL_FAILED` | 500 | Auto-fill engine encountered an unrecoverable error |
| `OPS_CAL_AUTOFILL_NO_CANDIDATES` | 422 | No eligible employees found for auto-fill |
| `OPS_CAL_COVERAGE_REQ_NOT_FOUND` | 404 | Coverage requirement does not exist |
| `OPS_CAL_COVERAGE_GAP_CRITICAL` | 422 | Critical coverage gap prevents period publishing |
| `OPS_CAL_VERSION_CONFLICT` | 409 | Optimistic concurrency conflict — entity was modified by another user |
| `OPS_CAL_NOTIFICATION_FAILED` | 500 | Failed to send schedule notification |
| `OPS_CAL_UNAUTHORIZED` | 403 | User does not have permission for this operation |
| `OPS_CAL_TENANT_MISMATCH` | 403 | Entity belongs to a different tenant |
| `OPS_CAL_INVALID_TIME_RANGE` | 400 | End time must be after start time |
| `OPS_CAL_INVALID_TIMEZONE` | 400 | Unrecognized timezone identifier |
| `OPS_CAL_CLOCK_IN_TOO_EARLY` | 400 | Clock-in attempted more than N minutes before shift start |
| `OPS_CAL_CLOCK_OUT_MISMATCH` | 400 | Clock-out without a preceding clock-in |

### Error Response Format

```typescript
interface OpsCalendarError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  violations?: ComplianceViolation[];
  conflicts?: Array<{
    entityType: string;
    entityId: string;
    description: string;
  }>;
}

// Example error response:
{
  "code": "OPS_CAL_SWAP_COMPLIANCE_BLOCK",
  "message": "Shift swap would violate minimum rest period between shifts",
  "statusCode": 422,
  "details": {
    "userId": "user-alice",
    "restHoursActual": 6,
    "restHoursRequired": 8
  },
  "violations": [
    {
      "ruleId": "rule-rest-period",
      "ruleName": "ESA — Minimum Rest Between Shifts",
      "severity": "critical",
      "actualValue": 6,
      "limitValue": 8,
      "unit": "hours"
    }
  ]
}
```

---

## Security

### Authentication & Authorization

All Operations Calendar endpoints require authentication via the MCV auth middleware. Authorization is role-based with the following hierarchy:

| Role | Permissions |
|------|------------|
| `admin` | Full access to all operations, can override locks |
| `ops_admin` | Manage schedules, templates, compliance rules, blackouts |
| `scheduler` | Create/edit periods, assign shifts, manage swaps |
| `team_lead` | View team schedules, approve swaps for their team |
| `employee` | View own assignments, request swaps, claim open shifts |
| `viewer` | Read-only access to published schedules |

### Permission Matrix

| Operation | admin | ops_admin | scheduler | team_lead | employee | viewer |
|-----------|-------|-----------|-----------|-----------|----------|--------|
| Create period | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Publish period | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lock period | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all shifts | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| View own shifts | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create/edit shifts | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign staff | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Confirm own assignment | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Request swap | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve swap | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Claim open shift | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage templates | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage blackouts | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage compliance rules | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Waive compliance violations | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage on-call schedules | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create on-call override | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Schedule resources | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage capacity plans | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View reports | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Access audit logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Data Protection

#### Multi-Tenant Isolation

Every database query is scoped by `tenant_id` through PostgreSQL Row-Level Security (RLS) policies. The tenant ID is set in the database session context via `app.current_tenant_id` and cannot be overridden by application code.

```typescript
// Tenant context is set automatically by the middleware
// No application code can bypass tenant isolation
await db.execute(sql`
  SET LOCAL app.current_tenant_id = ${tenantId};
  SET LOCAL app.current_user_id = ${userId};
`);
```

#### Sensitive Data Handling

- **Employee availability data** is visible only to schedulers and above
- **Overtime records** are accessible to the employee and their managers
- **Compliance violations** containing personal data are restricted to ops_admin and above
- **Salary/pay multiplier data** in shifts is hidden from viewer role
- **Audit logs** contain actor IDs but no credentials or tokens

#### Data Retention

| Data Type | Retention | Notes |
|-----------|-----------|-------|
| Active schedules | Indefinite | Until archived |
| Archived periods | 7 years | Labor law requirement |
| Audit logs | 7 years | Immutable, append-only |
| Compliance violations | 7 years | Legal compliance |
| Overtime records | 7 years | Payroll/tax requirement |
| Swap request history | 3 years | Operational reference |
| Coverage gap reports | 2 years | Trend analysis |
| Capacity plan scenarios | 1 year | Except active plans |

#### API Rate Limiting

| Endpoint Category | Rate Limit | Burst |
|------------------|------------|-------|
| Read operations | 200/min | 50 |
| Write operations | 60/min | 15 |
| Bulk operations | 10/min | 3 |
| Report generation | 5/min | 2 |
| Auto-fill / schedule generation | 2/min | 1 |

### Audit Trail

Every state-changing operation in the Operations Calendar creates an audit log entry:

```typescript
interface AuditLogEntry {
  entityType: 'shift' | 'assignment' | 'swap' | 'period' | 'resource' | 'blackout' | 'oncall' | 'template' | 'compliance';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'lock' | 'assign' | 'unassign' | 'approve' | 'deny' | 'waive';
  actorId: string;
  actorType: 'user' | 'system' | 'cron';
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  diff: Record<string, { old: unknown; new: unknown }> | null;
  reason: string | null;
}
```

Audit logs are:
- **Immutable**: No update or delete operations are permitted
- **Tenant-scoped**: RLS ensures cross-tenant isolation
- **Indexed**: By entity, actor, and timestamp for efficient querying
- **Queryable**: Available through the admin API for compliance audits

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPS_CAL_ENABLED` | No | `true` | Enable/disable the operations calendar module |
| `OPS_CAL_DEFAULT_TIMEZONE` | No | `UTC` | Default timezone for new schedules |
| `OPS_CAL_WEEK_START_DAY` | No | `1` | Default week start day (0=Sunday, 1=Monday) |
| `OPS_CAL_MIN_SCHEDULING_GRANULARITY_MINUTES` | No | `15` | Minimum scheduling block size in minutes |
| `OPS_CAL_SWAP_EXPIRY_HOURS` | No | `72` | Hours before unanswered swap requests expire |
| `OPS_CAL_SWAP_REQUIRE_APPROVAL` | No | `true` | Whether swaps require manager approval by default |
| `OPS_CAL_OPEN_SHIFT_CLAIM_WINDOW_HOURS` | No | `2` | Minimum hours before shift start to allow claiming |
| `OPS_CAL_CLOCK_IN_EARLY_MINUTES` | No | `15` | How early (minutes) before shift start clock-in is allowed |
| `OPS_CAL_CLOCK_IN_LATE_THRESHOLD_MINUTES` | No | `5` | Minutes after shift start before marking as "late" |
| `OPS_CAL_OVERTIME_WEEKLY_THRESHOLD_MINUTES` | No | `2400` | Weekly overtime threshold in minutes (default: 40h) |
| `OPS_CAL_OVERTIME_DAILY_THRESHOLD_MINUTES` | No | `480` | Daily overtime threshold in minutes (default: 8h) |
| `OPS_CAL_MAX_CONSECUTIVE_DAYS` | No | `6` | Default max consecutive working days |
| `OPS_CAL_MIN_REST_BETWEEN_SHIFTS_HOURS` | No | `8` | Default minimum rest hours between shifts |
| `OPS_CAL_ROLLING_SCHEDULE_LEAD_DAYS` | No | `14` | Days ahead for rolling schedule generation |
| `OPS_CAL_COVERAGE_GAP_CHECK_DAYS_AHEAD` | No | `7` | Days ahead to check for coverage gaps |
| `OPS_CAL_SHIFT_REMINDER_HOURS_BEFORE` | No | `1` | Hours before shift to send reminder |
| `OPS_CAL_FORECAST_MIN_DATA_POINTS` | No | `90` | Minimum historical data points for forecasting |
| `OPS_CAL_FORECAST_LOOKBACK_DAYS` | No | `365` | Default lookback period for demand forecasting |
| `OPS_CAL_NOTIFICATION_BATCH_SIZE` | No | `100` | Max notifications sent per batch |
| `OPS_CAL_AUDIT_RETENTION_DAYS` | No | `2555` | Audit log retention in days (~7 years) |
| `OPS_CAL_RESOURCE_CONFLICT_CHECK` | No | `strict` | Resource conflict mode: `strict` or `warn` |
| `OPS_CAL_AUTOFILL_MAX_ITERATIONS` | No | `1000` | Max iterations for auto-fill constraint solver |
| `OPS_CAL_AUTOFILL_TIMEOUT_MS` | No | `30000` | Auto-fill computation timeout in milliseconds |
| `OPS_CAL_CRON_SCHEDULE_GENERATION` | No | `0 0 * * 0` | Cron expression for rolling schedule generation |
| `OPS_CAL_CRON_COVERAGE_CHECK` | No | `0 6 * * *` | Cron expression for coverage gap check |
| `OPS_CAL_CRON_SHIFT_REMINDERS` | No | `*/15 * * * *` | Cron expression for shift reminders |
| `OPS_CAL_CRON_OVERTIME_CHECK` | No | `0 * * * *` | Cron expression for overtime threshold check |
| `OPS_CAL_CRON_ONCALL_ROTATION` | No | `0 2 * * *` | Cron expression for on-call rotation advancement |

---

## Dependencies

### Internal Dependencies

| Module | Purpose | Import |
|--------|---------|--------|
| `@mcv/core/auth` | Authentication and session management | `getCurrentUser`, `requireAuth` |
| `@mcv/core/tenant` | Multi-tenant context and RLS setup | `TenantContext`, `withTenant` |
| `@mcv/core/db` | Database connection and Drizzle ORM instance | `db`, `sql` |
| `@mcv/core/trpc` | tRPC router and procedure definitions | `router`, `protectedProcedure` |
| `@mcv/core/errors` | Error class definitions and formatting | `AppError`, `ErrorCode` |
| `@mcv/core/logger` | Structured logging | `logger` |
| `@mcv/core/cron` | Cron job scheduling | `CronService`, `registerJob` |
| `@mcv/core/notifications` | Notification dispatch (push, email, SMS) | `NotificationService` |
| `@mcv/core/audit` | Audit log infrastructure | `AuditService`, `auditLog` |
| `@mcv/core/rbac` | Role-based access control | `requireRole`, `checkPermission` |
| `@mcv/org/departments` | Department and team structure | `Department`, `Team` |
| `@mcv/org/users` | User profiles and availability | `User`, `UserAvailability` |
| `@mcv/org/roles` | Organizational role definitions | `OrgRole`, `RoleAssignment` |
| `@mcv/nexus/calendar` | Personal calendar (for conflict checking) | `PersonalCalendarService` |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.x` | Database ORM and query builder |
| `zod` | `^3.22.x` | Input validation and schema definition |
| `date-fns` | `^3.x` | Date manipulation and formatting |
| `date-fns-tz` | `^3.x` | Timezone-aware date operations |
| `rrule` | `^2.8.x` | iCal RRULE recurrence rule parsing |
| `cron-parser` | `^4.x` | Cron expression parsing and validation |
| `nanoid` | `^5.x` | Short unique ID generation |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.x` | Supabase client (provided by host) |
| `@trpc/server` | `^10.x` | tRPC server (provided by host) |

---

## Testing

### Test Structure

```
tests/
├── unit/
│   ├── shifts/
│   │   ├── shift-service.test.ts
│   │   ├── template-service.test.ts
│   │   ├── assignment-service.test.ts
│   │   ├── swap-service.test.ts
│   │   └── overtime-tracker.test.ts
│   ├── resources/
│   │   ├── schedule-service.test.ts
│   │   ├── conflict-detector.test.ts
│   │   └── utilization-optimizer.test.ts
│   ├── capacity/
│   │   ├── plan-service.test.ts
│   │   ├── demand-forecaster.test.ts
│   │   └── what-if-engine.test.ts
│   ├── oncall/
│   │   ├── schedule-service.test.ts
│   │   ├── rotation-engine.test.ts
│   │   └── escalation-chain.test.ts
│   ├── blackouts/
│   │   ├── period-service.test.ts
│   │   └── exception-handler.test.ts
│   ├── compliance/
│   │   ├── compliance-engine.test.ts
│   │   ├── labor-law-validator.test.ts
│   │   └── union-rule-validator.test.ts
│   ├── templates/
│   │   ├── template-service.test.ts
│   │   ├── auto-fill-engine.test.ts
│   │   └── rolling-generator.test.ts
│   └── notifications/
│       ├── notification-service.test.ts
│       └── shift-reminders.test.ts
├── integration/
│   ├── schedule-lifecycle.test.ts
│   ├── shift-swap-flow.test.ts
│   ├── resource-booking-flow.test.ts
│   ├── oncall-rotation-flow.test.ts
│   ├── compliance-validation-flow.test.ts
│   ├── blackout-exception-flow.test.ts
│   ├── auto-fill-flow.test.ts
│   └── coverage-report-flow.test.ts
├── e2e/
│   ├── full-schedule-cycle.test.ts
│   ├── multi-department-schedule.test.ts
│   └── compliance-enforcement.test.ts
└── fixtures/
    ├── shifts.ts
    ├── templates.ts
    ├── users.ts
    ├── departments.ts
    └── compliance-rules.ts
```

### Unit Test Examples

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShiftService } from '../shifts/shift-service';
import { ComplianceEngine } from '../compliance/compliance-engine';
import { createMockDb, createMockTenantContext } from './test-helpers';

describe('ShiftService', () => {
  let shiftService: ShiftService;
  let mockDb: ReturnType<typeof createMockDb>;
  let tenantCtx: ReturnType<typeof createMockTenantContext>;

  beforeEach(() => {
    mockDb = createMockDb();
    tenantCtx = createMockTenantContext({
      tenantId: 'tenant-1',
      userId: 'scheduler-1',
      roles: ['scheduler'],
    });
    shiftService = new ShiftService(mockDb, tenantCtx);
  });

  describe('createShift', () => {
    it('should create a shift with valid input', async () => {
      const input = {
        name: 'Morning Shift',
        periodId: 'period-1',
        startTime: new Date('2026-02-10T08:00:00Z'),
        endTime: new Date('2026-02-10T16:00:00Z'),
        timezone: 'America/Toronto',
        roleId: 'role-nurse',
        minStaff: 2,
        maxStaff: 4,
        departmentId: 'dept-er',
      };

      const shift = await shiftService.create(input);

      expect(shift.name).toBe('Morning Shift');
      expect(shift.durationMinutes).toBe(480);
      expect(shift.status).toBe('draft');
      expect(shift.tenantId).toBe('tenant-1');
    });

    it('should reject shifts with end time before start time', async () => {
      const input = {
        name: 'Invalid Shift',
        periodId: 'period-1',
        startTime: new Date('2026-02-10T16:00:00Z'),
        endTime: new Date('2026-02-10T08:00:00Z'),
        timezone: 'America/Toronto',
        roleId: 'role-nurse',
        departmentId: 'dept-er',
      };

      await expect(shiftService.create(input)).rejects.toThrow(
        'OPS_CAL_INVALID_TIME_RANGE'
      );
    });

    it('should reject shifts in a locked period', async () => {
      mockDb.mockPeriodStatus('period-locked', 'locked');

      const input = {
        name: 'Late Shift',
        periodId: 'period-locked',
        startTime: new Date('2026-02-10T08:00:00Z'),
        endTime: new Date('2026-02-10T16:00:00Z'),
        timezone: 'America/Toronto',
        roleId: 'role-nurse',
        departmentId: 'dept-er',
      };

      await expect(shiftService.create(input)).rejects.toThrow(
        'OPS_CAL_PERIOD_LOCKED'
      );
    });

    it('should handle DST transitions correctly', async () => {
      // March 8, 2026: DST spring-forward in America/Toronto
      const input = {
        name: 'DST Transition Shift',
        periodId: 'period-1',
        startTime: new Date('2026-03-08T06:00:00Z'), // 1:00 AM EST
        endTime: new Date('2026-03-08T14:00:00Z'),   // 10:00 AM EDT
        timezone: 'America/Toronto',
        roleId: 'role-nurse',
        departmentId: 'dept-er',
      };

      const shift = await shiftService.create(input);

      // 8 hours UTC difference, but only 7 "local" hours due to spring-forward
      expect(shift.durationMinutes).toBe(480); // Still 8h in UTC
    });
  });

  describe('assignShift', () => {
    it('should prevent double-assignment', async () => {
      mockDb.mockExistingAssignment('shift-1', 'user-alice');

      await expect(
        shiftService.assign({
          shiftId: 'shift-1',
          userId: 'user-alice',
        })
      ).rejects.toThrow('OPS_CAL_ASSIGNMENT_ALREADY_EXISTS');
    });

    it('should prevent exceeding max staff', async () => {
      mockDb.mockShift('shift-full', { maxStaff: 2, confirmedStaff: 2 });

      await expect(
        shiftService.assign({
          shiftId: 'shift-full',
          userId: 'user-new',
        })
      ).rejects.toThrow('OPS_CAL_SHIFT_FULL');
    });
  });
});

describe('ComplianceEngine', () => {
  let engine: ComplianceEngine;

  beforeEach(() => {
    engine = new ComplianceEngine();
    engine.addRule({
      name: 'Max 8h rest',
      type: 'min_rest_between_shifts',
      parameters: { minHours: 8 },
      severity: 'critical',
      isBlocking: true,
    });
    engine.addRule({
      name: 'Max 48h/week',
      type: 'max_hours_per_week',
      parameters: { maxHours: 48 },
      severity: 'critical',
      isBlocking: true,
    });
  });

  it('should detect rest period violations', async () => {
    const assignments = [
      {
        userId: 'user-1',
        shiftStart: new Date('2026-02-10T22:00:00Z'),
        shiftEnd: new Date('2026-02-11T06:00:00Z'),
      },
      {
        userId: 'user-1',
        shiftStart: new Date('2026-02-11T08:00:00Z'), // Only 2h rest
        shiftEnd: new Date('2026-02-11T16:00:00Z'),
      },
    ];

    const result = await engine.validate(assignments);

    expect(result.isValid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('min_rest_between_shifts');
    expect(result.violations[0].actualValue).toBe(2);
    expect(result.violations[0].limitValue).toBe(8);
  });

  it('should detect weekly hour limit violations', async () => {
    // 7 days × 8h = 56h (exceeds 48h limit)
    const assignments = Array.from({ length: 7 }, (_, i) => ({
      userId: 'user-1',
      shiftStart: new Date(`2026-02-${10 + i}T08:00:00Z`),
      shiftEnd: new Date(`2026-02-${10 + i}T16:00:00Z`),
    }));

    const result = await engine.validate(assignments);

    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.type === 'max_hours_per_week')).toBe(true);
  });

  it('should pass with compliant assignments', async () => {
    const assignments = [
      {
        userId: 'user-1',
        shiftStart: new Date('2026-02-10T08:00:00Z'),
        shiftEnd: new Date('2026-02-10T16:00:00Z'),
      },
      {
        userId: 'user-1',
        shiftStart: new Date('2026-02-11T08:00:00Z'), // 16h rest ✓
        shiftEnd: new Date('2026-02-11T16:00:00Z'),
      },
    ];

    const result = await engine.validate(assignments);

    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});

describe('ResourceConflictDetector', () => {
  let detector: ResourceConflictDetector;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
    detector = new ResourceConflictDetector(mockDb);
  });

  it('should detect overlapping bookings', async () => {
    mockDb.mockExistingBooking('room-1', {
      startTime: new Date('2026-02-10T14:00:00Z'),
      endTime: new Date('2026-02-10T16:00:00Z'),
      title: 'Existing Meeting',
    });

    const conflicts = await detector.check({
      resourceId: 'room-1',
      startTime: new Date('2026-02-10T15:00:00Z'),
      endTime: new Date('2026-02-10T17:00:00Z'),
    });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].title).toBe('Existing Meeting');
  });

  it('should not flag adjacent bookings (half-open intervals)', async () => {
    mockDb.mockExistingBooking('room-1', {
      startTime: new Date('2026-02-10T14:00:00Z'),
      endTime: new Date('2026-02-10T16:00:00Z'),
    });

    const conflicts = await detector.check({
      resourceId: 'room-1',
      startTime: new Date('2026-02-10T16:00:00Z'), // Starts exactly when previous ends
      endTime: new Date('2026-02-10T18:00:00Z'),
    });

    expect(conflicts).toHaveLength(0);
  });

  it('should allow double-booking when configured', async () => {
    mockDb.mockExistingBooking('room-1', {
      startTime: new Date('2026-02-10T14:00:00Z'),
      endTime: new Date('2026-02-10T16:00:00Z'),
      allowDoubleBooking: true,
    });

    const conflicts = await detector.check({
      resourceId: 'room-1',
      startTime: new Date('2026-02-10T15:00:00Z'),
      endTime: new Date('2026-02-10T17:00:00Z'),
      allowDoubleBooking: true,
    });

    expect(conflicts).toHaveLength(0); // No conflict reported
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext, seedTestData, cleanupTestData } from './test-helpers';
import { OpsCalendarService } from '../service';

describe('Schedule Lifecycle (Integration)', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let calendarService: OpsCalendarService;

  beforeAll(async () => {
    ctx = await createTestContext();
    calendarService = new OpsCalendarService(ctx.db, ctx.tenantCtx);
    await seedTestData(ctx, {
      departments: ['dept-er'],
      roles: ['role-nurse', 'role-doctor'],
      users: ['user-alice', 'user-bob', 'user-charlie'],
      shiftTemplates: ['template-day', 'template-night'],
    });
  });

  afterAll(async () => {
    await cleanupTestData(ctx);
    await ctx.dispose();
  });

  it('should complete a full schedule lifecycle: create → generate → fill → validate → publish → lock', async () => {
    // Create period
    const period = await calendarService.createPeriod({
      name: 'Integration Test Week',
      startDate: new Date('2026-03-02T00:00:00Z'),
      endDate: new Date('2026-03-08T23:59:59Z'),
      timezone: 'America/Toronto',
      departmentId: 'dept-er',
    });
    expect(period.status).toBe('draft');

    // Generate shifts
    const shifts = await calendarService.generateShiftsFromTemplate(
      period.id,
      'template-day'
    );
    expect(shifts.length).toBeGreaterThan(0);

    // Auto-fill
    const fillResult = await calendarService.autoFillPeriod(
      period.id,
      'template-day'
    );
    expect(fillResult.assignedCount).toBeGreaterThan(0);

    // Validate
    const validation = await calendarService.validateSchedule(period.id);
    expect(validation.isValid).toBe(true);

    // Publish
    const publishResult = await calendarService.publishPeriod(period.id);
    expect(publishResult.period.status).toBe('published');

    // Verify shifts are now visible to employees
    const published = await calendarService.getPeriod(period.id);
    expect(published.status).toBe('published');
    expect(published.publishedAt).toBeDefined();

    // Lock for payroll
    const locked = await calendarService.lockPeriod(period.id);
    expect(locked.status).toBe('locked');

    // Verify no modifications allowed
    await expect(
      calendarService.createShift({
        name: 'Extra Shift',
        periodId: period.id,
        startTime: new Date('2026-03-05T08:00:00Z'),
        endTime: new Date('2026-03-05T16:00:00Z'),
        timezone: 'America/Toronto',
        roleId: 'role-nurse',
        departmentId: 'dept-er',
      })
    ).rejects.toThrow('OPS_CAL_PERIOD_LOCKED');
  });

  it('should enforce compliance during swap approval', async () => {
    // Setup: Create a period with shifts that leave minimal rest gap
    const period = await calendarService.createPeriod({
      name: 'Compliance Test Period',
      startDate: new Date('2026-03-09T00:00:00Z'),
      endDate: new Date('2026-03-15T23:59:59Z'),
      timezone: 'America/Toronto',
      departmentId: 'dept-er',
    });

    // Alice: Day shift Mon, Bob: Night shift Mon
    const dayShift = await calendarService.createShift({
      name: 'Day Shift Mon',
      periodId: period.id,
      startTime: new Date('2026-03-09T13:00:00Z'), // 8AM EST
      endTime: new Date('2026-03-09T21:00:00Z'),   // 4PM EST
      timezone: 'America/Toronto',
      roleId: 'role-nurse',
      departmentId: 'dept-er',
    });

    const nightShift = await calendarService.createShift({
      name: 'Night Shift Mon',
      periodId: period.id,
      startTime: new Date('2026-03-09T03:00:00Z'),  // 10PM EST Sun
      endTime: new Date('2026-03-09T11:00:00Z'),    // 6AM EST Mon
      timezone: 'America/Toronto',
      roleId: 'role-nurse',
      departmentId: 'dept-er',
    });

    // Alice also has Tue day shift
    const tueDayShift = await calendarService.createShift({
      name: 'Day Shift Tue',
      periodId: period.id,
      startTime: new Date('2026-03-10T13:00:00Z'),
      endTime: new Date('2026-03-10T21:00:00Z'),
      timezone: 'America/Toronto',
      roleId: 'role-nurse',
      departmentId: 'dept-er',
    });

    const aliceDayAssign = await calendarService.assignShift({
      shiftId: dayShift.id,
      userId: 'user-alice',
    });
    const bobNightAssign = await calendarService.assignShift({
      shiftId: nightShift.id,
      userId: 'user-bob',
    });
    await calendarService.assignShift({
      shiftId: tueDayShift.id,
      userId: 'user-alice',
    });

    // Bob tries to swap his night shift for Alice's day shift
    // This would give Alice: Night Mon (ends 6AM) + Day Tue (starts 8AM) = only 2h rest
    const swapReq = await calendarService.requestSwap({
      type: 'swap',
      sourceAssignmentId: bobNightAssign.id,
      targetAssignmentId: aliceDayAssign.id,
      reason: 'Want to switch to days',
    });

    // Compliance check should flag the rest period violation
    expect(swapReq.complianceCheckPassed).toBe(false);
    expect(swapReq.complianceViolations.length).toBeGreaterThan(0);
    expect(swapReq.complianceViolations[0].type).toBe('min_rest_between_shifts');
  });
});
```

### Test Utilities

```typescript
// tests/test-helpers.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';

export async function createTestContext() {
  const connectionString = process.env.TEST_DATABASE_URL!;
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  const tenantId = uuidv4();
  const tenantCtx = createMockTenantContext({
    tenantId,
    userId: 'test-scheduler',
    roles: ['scheduler', 'ops_admin'],
  });

  return { db, sql, tenantId, tenantCtx, dispose: () => sql.end() };
}

export function createMockTenantContext(options: {
  tenantId: string;
  userId: string;
  roles: string[];
}) {
  return {
    tenantId: options.tenantId,
    userId: options.userId,
    roles: options.roles,
    hasRole: (role: string) => options.roles.includes(role),
    requireRole: (role: string) => {
      if (!options.roles.includes(role)) {
        throw new Error(`OPS_CAL_UNAUTHORIZED: requires ${role}`);
      }
    },
  };
}

export function createMockDb() {
  const mockData: Record<string, unknown[]> = {};

  return {
    query: vi.fn(),
    insert: vi.fn().mockReturnValue({ returning: vi.fn() }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
    delete: vi.fn().mockReturnValue({ where: vi.fn() }),
    mockPeriodStatus: (periodId: string, status: string) => {
      mockData[`period:${periodId}`] = [{ id: periodId, status }];
    },
    mockShift: (shiftId: string, data: Partial<Shift>) => {
      mockData[`shift:${shiftId}`] = [{ id: shiftId, ...data }];
    },
    mockExistingAssignment: (shiftId: string, userId: string) => {
      mockData[`assignment:${shiftId}:${userId}`] = [{ shiftId, userId }];
    },
    mockExistingBooking: (resourceId: string, data: Record<string, unknown>) => {
      const key = `booking:${resourceId}`;
      if (!mockData[key]) mockData[key] = [];
      (mockData[key] as unknown[]).push({ resourceId, ...data });
    },
    getMockData: (key: string) => mockData[key] || [],
  };
}

export async function seedTestData(
  ctx: Awaited<ReturnType<typeof createTestContext>>,
  config: {
    departments?: string[];
    roles?: string[];
    users?: string[];
    shiftTemplates?: string[];
  }
) {
  // Seed tenant
  await ctx.db.execute(sql`
    INSERT INTO tenants (id, name) VALUES (${ctx.tenantId}, 'Test Tenant')
    ON CONFLICT DO NOTHING
  `);

  // Seed departments
  for (const dept of config.departments || []) {
    await ctx.db.execute(sql`
      INSERT INTO departments (id, tenant_id, name)
      VALUES (${dept}, ${ctx.tenantId}, ${dept})
      ON CONFLICT DO NOTHING
    `);
  }

  // Seed users and role assignments
  for (const user of config.users || []) {
    await ctx.db.execute(sql`
      INSERT INTO users (id, tenant_id, name, email)
      VALUES (${user}, ${ctx.tenantId}, ${user}, ${user + '@test.com'})
      ON CONFLICT DO NOTHING
    `);
  }
}

export async function cleanupTestData(
  ctx: Awaited<ReturnType<typeof createTestContext>>
) {
  await ctx.db.execute(sql`
    DELETE FROM ops_cal_schedule_audit_log WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_compliance_violations WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_overtime_records WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_coverage_gaps WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_shift_swaps WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_shift_assignments WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_shifts WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_schedule_periods WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_resource_schedules WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_on_call_rotations WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_on_call_schedules WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_blackout_periods WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_schedule_templates WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_shift_templates WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_capacity_plans WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM ops_cal_coverage_requirements WHERE tenant_id = ${ctx.tenantId};
    DELETE FROM tenants WHERE id = ${ctx.tenantId};
  `);
}
```

### Running Tests

```bash
# Run all operations calendar tests
pnpm test --filter @mcv/operations-calendar

# Run unit tests only
pnpm test --filter @mcv/operations-calendar -- --dir tests/unit

# Run integration tests (requires test database)
DATABASE_URL=postgresql://... pnpm test --filter @mcv/operations-calendar -- --dir tests/integration

# Run with coverage
pnpm test --filter @mcv/operations-calendar -- --coverage

# Run specific test file
pnpm test --filter @mcv/operations-calendar -- tests/unit/compliance/compliance-engine.test.ts

# Watch mode during development
pnpm test --filter @mcv/operations-calendar -- --watch
```

### Coverage Targets

| Category | Target | Notes |
|----------|--------|-------|
| Statements | ≥ 90% | Core business logic |
| Branches | ≥ 85% | Especially constraint evaluation paths |
| Functions | ≥ 90% | All public API methods |
| Lines | ≥ 90% | Excluding generated code |

### Critical Test Scenarios

The following scenarios **must** have test coverage:

1. **Shift creation with DST boundary** — Verify correct duration calculation when shifts cross a DST transition
2. **Swap compliance check** — Ensure compliance engine catches rest-period violations in swap scenarios
3. **Resource double-booking prevention** — Confirm hard conflict detection for non-double-bookable resources
4. **On-call rotation advancement** — Verify correct next-person selection accounting for unavailability
5. **Blackout enforcement** — Confirm blocked actions are rejected during active blackouts
6. **Coverage gap detection** — Verify gaps are identified when staffing drops below requirements
7. **Overtime threshold alerts** — Confirm alerts fire when employees approach weekly limits
8. **Schedule period state machine** — Verify all valid and invalid state transitions
9. **Auto-fill with constraints** — Confirm auto-fill respects all hard constraints
10. **Optimistic concurrency** — Verify version conflict detection and error reporting
11. **Multi-tenant isolation** — Confirm tenant A cannot access tenant B's schedules
12. **Half-open interval boundary** — Verify `[start, end)` semantics in overlap detection
13. **Escalation chain timeout** — Verify escalation advances after timeout
14. **Rolling schedule generation** — Confirm correct period creation with template application
15. **Compliance waiver flow** — Verify waiver grants, denials, and audit trail

---

## Changelog

### 0.19.0 (Initial Release)

- Core shift management (create, assign, swap)
- Resource scheduling with conflict detection
- On-call rotation engine with escalation chains
- Blackout period management
- Compliance engine with Ontario ESA rules
- Coverage requirement and gap analysis
- Schedule templates and auto-fill
- Overtime tracking and alerting
- Full audit trail
- Multi-tenant RLS policies
- tRPC API with role-based authorization

### 0.19.1

- Fixed DST boundary calculation in shift duration
- Added `what-if` scenario engine for capacity planning
- Improved auto-fill performance with constraint pruning
- Added bulk assignment endpoint

### 0.20.0

- Rolling schedule generation via cron
- Union rule validator module
- Resource utilization optimizer
- Enhanced coverage report with recommendations
- Notification preferences per user
- Schedule adherence tracking (clock-in/clock-out)

---

*For questions or contributions, see the [MCV.ONE Contributing Guide](../../../CONTRIBUTING.md) or reach out to the Operations team.*