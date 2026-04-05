# @mcv/people/time

> **People Time & Attendance** — Employee clock-in/out, attendance tracking, overtime calculation, break compliance, geofenced time capture, and payroll-ready time export for the MCV.ONE platform.

| Field | Value |
|---|---|
| **Package** | `@mcv/people/time` |
| **Layer** | Tier 5 — Domain Module |
| **Domain** | People (HR & Workforce) |
| **Since** | 0.14.0 |
| **Status** | Stable |
| **Depends on** | `@mcv/people/core`, `@mcv/people/scheduling`, `@mcv/platform/auth`, `@mcv/platform/tenancy`, `@mcv/platform/audit`, `@mcv/platform/notifications`, `@mcv/platform/geo` |
| **Distinct from** | `@mcv/operations/time` (project-based time tracking for billing & resource allocation) |
| **DB schema** | `people_time` |
| **API namespace** | `people.time.*` |
| **RLS** | Multi-tenant row-level security via `tenant_id` on all tables |

---

## Table of Contents

- [Purpose](#purpose)
- [Key Distinctions from @mcv/operations/time](#key-distinctions-from-mcvoperationstime)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Clock Event Pipeline](#clock-event-pipeline)
  - [Overtime Calculation Engine](#overtime-calculation-engine)
  - [Break Compliance Monitor](#break-compliance-monitor)
  - [Payroll Export Pipeline](#payroll-export-pipeline)
- [Core Interfaces](#core-interfaces)
  - [ClockEvent](#clockevent)
  - [AttendanceRecord](#attendancerecord)
  - [ShiftActual](#shiftactual)
  - [OvertimeCalculation](#overtimecalculation)
  - [BreakRecord](#breakrecord)
  - [Geofence](#geofence)
  - [GeofenceLog](#geofencelog)
  - [TimeException](#timeexception)
  - [PayrollExport](#payrollexport)
  - [AttendancePolicy](#attendancepolicy)
  - [MinorRestriction](#minorrestriction)
  - [AttendanceService](#attendanceservice)
- [Database Schemas](#database-schemas)
  - [clock_events](#clock_events)
  - [attendance_records](#attendance_records)
  - [shift_actuals](#shift_actuals)
  - [overtime_records](#overtime_records)
  - [break_records](#break_records)
  - [geofences](#geofences)
  - [geofence_logs](#geofence_logs)
  - [time_exceptions](#time_exceptions)
  - [payroll_exports](#payroll_exports)
  - [attendance_policies](#attendance_policies)
  - [minor_restrictions](#minor_restrictions)
- [Code Examples](#code-examples)
  - [1 — Clock In with Geofence Validation](#1--clock-in-with-geofence-validation)
  - [2 — Process Attendance for a Pay Period](#2--process-attendance-for-a-pay-period)
  - [3 — Calculate Weekly Overtime (FLSA)](#3--calculate-weekly-overtime-flsa)
  - [4 — Break Compliance Monitoring](#4--break-compliance-monitoring)
  - [5 — Resolve Missing Punch Exception](#5--resolve-missing-punch-exception)
  - [6 — Export Approved Time to Payroll](#6--export-approved-time-to-payroll)
  - [7 — Geofence Management](#7--geofence-management)
  - [8 — Attendance Analytics Dashboard](#8--attendance-analytics-dashboard)
- [Error Codes](#error-codes)
- [Security](#security)
  - [Row-Level Security](#row-level-security)
  - [Clock Event Integrity](#clock-event-integrity)
  - [Geofence Security](#geofence-security)
  - [Audit Trail](#audit-trail)
  - [RBAC Permissions](#rbac-permissions)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [Compliance Tests](#compliance-tests)
  - [Performance Benchmarks](#performance-benchmarks)

---

## Purpose

`@mcv/people/time` is the **workforce time & attendance** module within the MCV.ONE People domain. It captures, validates, calculates, and exports employee work time from clock-in through payroll submission.

### What This Module Does

1. **Captures clock events** — Digital time clock supporting web, mobile, kiosk, biometric, and NFC tap-in. Every clock event is validated against geofences, IP allowlists, scheduling rules, and minor labor restrictions before persistence.

2. **Builds attendance records** — Raw clock events are paired (in/out), deduplicated, and assembled into daily attendance records that reflect actual hours worked, tardiness, early departures, and absences.

3. **Tracks shift actuals** — Compares actual attendance against scheduled shifts from `@mcv/people/scheduling`, computing variances, shift differentials, and split-shift premiums.

4. **Calculates overtime** — Applies configurable overtime rules per jurisdiction: FLSA 40-hour weekly, California daily/weekly/consecutive-day, Canadian provincial rules, EU Working Time Directive limits, and custom employer policies.

5. **Monitors break compliance** — Tracks meal and rest breaks against jurisdiction-specific requirements (California meal/rest break laws, Oregon break laws, EU break directives), triggers alerts for missed breaks, and auto-deducts breaks where policy requires.

6. **Enforces geofencing** — Uses PostGIS to define job site boundaries, validates clock-in coordinates against allowed geofences, logs GPS trails, detects remote-work vs. on-site patterns, and flags anomalous location data.

7. **Manages exceptions** — Surfaces missing punches, overlapping shifts, implausible durations, policy violations, and other anomalies for manager review. Supports correction workflows with full audit trails.

8. **Ensures compliance** — Enforces FLSA, state/provincial labor laws, EU Working Time Directive, predictive scheduling ordinances, and minor labor restrictions. Generates compliance reports and flags violations before they become liability.

9. **Integrates with payroll** — Exports approved, calculated time data to `@mcv/people/payroll` or external payroll providers. Handles pay period processing, retroactive corrections, and approval workflows.

10. **Provides analytics** — Attendance rates, overtime trends, punctuality scores, labor cost projections, absenteeism patterns, and department-level workforce metrics.

### What This Module Does NOT Do

| Concern | Handled By |
|---|---|
| Project time tracking & billing | `@mcv/operations/time` |
| Shift scheduling & roster management | `@mcv/people/scheduling` |
| Payroll calculation & tax withholding | `@mcv/people/payroll` |
| Leave/PTO request management | `@mcv/people/leave` |
| Employee profile management | `@mcv/people/core` |
| Benefits administration | `@mcv/people/benefits` |

---

## Key Distinctions from @mcv/operations/time

These two modules serve fundamentally different purposes and should never be confused:

| Aspect | `@mcv/people/time` (this module) | `@mcv/operations/time` |
|---|---|---|
| **Purpose** | Employee attendance & labor compliance | Project time tracking & resource billing |
| **Who uses it** | HR, payroll, managers, employees | Project managers, consultants, clients |
| **What it tracks** | Clock in/out, attendance, breaks | Time entries against projects/tasks |
| **Compliance focus** | FLSA, labor laws, break laws | SLA adherence, budget tracking |
| **Output** | Payroll-ready hours | Billable hours, utilization reports |
| **Granularity** | To the minute (clock events) | Typically 15-min or hourly blocks |
| **Validation** | Geofence, biometric, IP | Project assignment, task existence |
| **Approval flow** | Manager → Payroll | PM → Client → Billing |

An employee might clock in at 8:57 AM (captured here) and then log 2 hours to Project Alpha and 3 hours to Project Beta (captured in `@mcv/operations/time`). Both records coexist; reconciliation between them is handled by `@mcv/people/payroll`.

---

## Exports

```typescript
// ── Services ─────────────────────────────────────────────
export { AttendanceService }        from './services/attendance.service';
export { ClockService }             from './services/clock.service';
export { OvertimeService }          from './services/overtime.service';
export { BreakService }             from './services/break.service';
export { GeofenceService }          from './services/geofence.service';
export { ExceptionService }         from './services/exception.service';
export { PayrollExportService }     from './services/payroll-export.service';
export { ComplianceService }        from './services/compliance.service';
export { AttendanceAnalytics }      from './services/attendance-analytics.service';

// ── tRPC Router ──────────────────────────────────────────
export { peopleTimeRouter }         from './trpc/people-time.router';

// ── Types & Interfaces ──────────────────────────────────
export type { ClockEvent }          from './types/clock-event';
export type { ClockEventType }      from './types/clock-event';
export type { ClockSource }         from './types/clock-event';
export type { AttendanceRecord }    from './types/attendance-record';
export type { AttendanceStatus }    from './types/attendance-record';
export type { ShiftActual }         from './types/shift-actual';
export type { ShiftVariance }       from './types/shift-actual';
export type { OvertimeCalculation } from './types/overtime';
export type { OvertimeRule }        from './types/overtime';
export type { OvertimeTier }        from './types/overtime';
export type { BreakRecord }         from './types/break-record';
export type { BreakType }           from './types/break-record';
export type { BreakCompliance }     from './types/break-record';
export type { Geofence }            from './types/geofence';
export type { GeofenceLog }         from './types/geofence';
export type { GeofenceValidation }  from './types/geofence';
export type { TimeException }       from './types/time-exception';
export type { ExceptionType }       from './types/time-exception';
export type { ExceptionResolution } from './types/time-exception';
export type { PayrollExport }       from './types/payroll-export';
export type { PayrollExportLine }   from './types/payroll-export';
export type { AttendancePolicy }    from './types/attendance-policy';
export type { MinorRestriction }    from './types/minor-restriction';

// ── DB Schema (Drizzle) ─────────────────────────────────
export {
  clockEvents,
  attendanceRecords,
  shiftActuals,
  overtimeRecords,
  breakRecords,
  geofences,
  geofenceLogs,
  timeExceptions,
  payrollExports,
  attendancePolicies,
  minorRestrictions,
} from './db/schema';

// ── Validators (Zod) ────────────────────────────────────
export {
  clockInSchema,
  clockOutSchema,
  exceptionResolutionSchema,
  geofenceCreateSchema,
  payrollExportRequestSchema,
  attendancePolicySchema,
} from './validators';

// ── Constants ────────────────────────────────────────────
export { OVERTIME_RULES }           from './constants/overtime-rules';
export { BREAK_REQUIREMENTS }       from './constants/break-requirements';
export { MINOR_LABOR_RULES }        from './constants/minor-labor-rules';
export { CLOCK_EVENT_TYPES }        from './constants/clock-event-types';
export { EXCEPTION_TYPES }          from './constants/exception-types';

// ── Hooks (React) ────────────────────────────────────────
export { useClockStatus }           from './hooks/use-clock-status';
export { useAttendance }            from './hooks/use-attendance';
export { useTimecardApproval }      from './hooks/use-timecard-approval';
export { useBreakTimer }            from './hooks/use-break-timer';
export { useOvertimeAlert }         from './hooks/use-overtime-alert';
```

---

## Architecture

### Clock Event Pipeline

The clock event pipeline processes every clock-in and clock-out action from capture through attendance record creation. It is the core real-time path of the module.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLOCK EVENT SOURCES                             │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌────────────┐  │
│  │   Web   │ │ Mobile  │ │  Kiosk   │ │Biometric│ │  NFC/RFID  │  │
│  │  Clock  │ │   App   │ │ Terminal │ │ Scanner │ │    Tap     │  │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └────┬────┘ └─────┬──────┘  │
│       │           │           │             │            │          │
│       └───────────┴───────────┴──────┬──────┴────────────┘          │
│                                      │                              │
│                              ┌───────▼───────┐                      │
│                              │  Clock Event  │                      │
│                              │   Ingestion   │                      │
│                              └───────┬───────┘                      │
└──────────────────────────────────────┼──────────────────────────────┘
                                       │
                              ┌────────▼────────┐
                              │   VALIDATION    │
                              │    PIPELINE     │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
           ┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
           │  Identity    │  │  Geofence    │  │   Policy     │
           │ Verification │  │  Validation  │  │  Validation  │
           │              │  │  (PostGIS)   │  │              │
           │ • Auth token │  │ • GPS coords │  │ • Shift      │
           │ • Biometric  │  │ • IP check   │  │ • Minor hrs  │
           │ • Device ID  │  │ • Radius     │  │ • Dup check  │
           └───────┬──────┘  └───────┬──────┘  └───────┬──────┘
                   │                 │                  │
                   └─────────┬───────┴──────────┬──────┘
                             │                  │
                     ┌───────▼──────┐   ┌───────▼──────┐
                     │   PASS ✓     │   │   FAIL ✗     │
                     │              │   │              │
                     │ Persist      │   │ Create       │
                     │ ClockEvent   │   │ Exception    │
                     └───────┬──────┘   └───────┬──────┘
                             │                  │
                    ┌────────▼────────┐  ┌──────▼───────┐
                    │   Attendance    │  │  Exception   │
                    │   Record       │  │  Queue       │
                    │   Assembly     │  │  (Manager    │
                    │                │  │   Review)    │
                    │ • Pair in/out  │  └──────────────┘
                    │ • Calc hours   │
                    │ • Detect tardy │
                    │ • Mark absent  │
                    └────────┬───────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼───────┐ ┌───▼────────┐
     │  Break        │ │  Overtime  │ │  Shift     │
     │  Tracking     │ │  Calc      │ │  Actual    │
     │               │ │            │ │  Assembly  │
     │ • Auto-deduct │ │ • Daily OT │ │ • Variance │
     │ • Compliance  │ │ • Weekly   │ │ • Diff pay │
     │ • Reminders   │ │ • Holiday  │ │ • Splits   │
     └───────────────┘ └────────────┘ └────────────┘
```

### Overtime Calculation Engine

Overtime calculation is jurisdiction-aware and supports stacking multiple rule sets for employees who work across jurisdictions.

```
┌────────────────────────────────────────────────────────────────┐
│                    OVERTIME CALCULATION                         │
│                                                                │
│  Input: AttendanceRecord[] for pay period                      │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Rule Resolution                         │      │
│  │                                                      │      │
│  │  1. Employee jurisdiction (work location)            │      │
│  │  2. Employer policy overrides (more generous only)   │      │
│  │  3. Union/CBA rules (if applicable)                  │      │
│  │  4. Stacking order for multi-jurisdiction            │      │
│  └───────────────────────┬──────────────────────────────┘      │
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────────┐      │
│  │              Calculation Tiers                        │      │
│  │                                                      │      │
│  │  ┌─────────────────────────────────────────────┐     │      │
│  │  │ Tier 1: Regular Time                        │     │      │
│  │  │ • First 8 hrs/day (CA) or 40 hrs/week (FLSA)│     │      │
│  │  │ • Multiplier: 1.0x                          │     │      │
│  │  └─────────────────────────────────────────────┘     │      │
│  │  ┌─────────────────────────────────────────────┐     │      │
│  │  │ Tier 2: Overtime (1.5x)                     │     │      │
│  │  │ • Hours 8-12/day (CA daily)                 │     │      │
│  │  │ • Hours 40-48/week (FLSA weekly)            │     │      │
│  │  │ • 7th consecutive day first 8 hrs (CA)      │     │      │
│  │  └─────────────────────────────────────────────┘     │      │
│  │  ┌─────────────────────────────────────────────┐     │      │
│  │  │ Tier 3: Double Time (2.0x)                  │     │      │
│  │  │ • Hours beyond 12/day (CA daily)            │     │      │
│  │  │ • 7th consecutive day beyond 8 hrs (CA)     │     │      │
│  │  └─────────────────────────────────────────────┘     │      │
│  │  ┌─────────────────────────────────────────────┐     │      │
│  │  │ Tier 4: Holiday / Special Premium           │     │      │
│  │  │ • Holiday pay (configurable multiplier)     │     │      │
│  │  │ • Weekend premium                           │     │      │
│  │  │ • Shift differential                        │     │      │
│  │  └─────────────────────────────────────────────┘     │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  Output: OvertimeCalculation with tier breakdown               │
└────────────────────────────────────────────────────────────────┘
```

### Break Compliance Monitor

The break compliance monitor runs as a background process during active shifts, comparing elapsed work time against jurisdiction-specific break requirements.

```
┌────────────────────────────────────────────────────────────┐
│                BREAK COMPLIANCE MONITOR                     │
│                                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Active Shift │───▶│ Break Rule   │───▶│ Compliance   │  │
│  │ Detection    │    │ Lookup       │    │ Check        │  │
│  └──────────────┘    └──────────────┘    └──────┬───────┘  │
│                                                 │          │
│                              ┌──────────────────┼────────┐ │
│                              │                  │        │ │
│                     ┌────────▼──────┐  ┌────────▼──────┐ │ │
│                     │  Break Due    │  │  Break        │ │ │
│                     │  (Reminder)   │  │  Overdue      │ │ │
│                     │               │  │  (Violation)  │ │ │
│                     │ • Push notify │  │ • Alert mgr   │ │ │
│                     │ • Kiosk popup │  │ • Log event   │ │ │
│                     │ • SMS (opt)   │  │ • Flag record │ │ │
│                     └───────────────┘  └───────────────┘ │ │
│                                                          │ │
│  Break Rules by Jurisdiction:                            │ │
│  ┌─────────────────────────────────────────────────────┐ │ │
│  │ California: 30-min meal by 5th hr, 10-min rest/4hr │ │ │
│  │ Oregon:     30-min meal by 6th hr, 10-min rest/4hr │ │ │
│  │ Washington: 30-min meal by 5th hr, 10-min rest/4hr │ │ │
│  │ EU:         20-min break for 6+ hr shifts           │ │ │
│  │ Federal:    Nursing mothers break (FLSA)            │ │ │
│  └─────────────────────────────────────────────────────┘ │ │
└──────────────────────────────────────────────────────────┘ │
                                                             │
```

### Payroll Export Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                   PAYROLL EXPORT PIPELINE                     │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │ Select   │──▶│ Validate │──▶│ Calculate│──▶│ Approve  │  │
│  │ Pay      │   │ Records  │   │ Totals   │   │ & Lock   │  │
│  │ Period   │   │          │   │          │   │          │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
│                                                    │         │
│                                           ┌────────▼───────┐ │
│                                           │   Generate     │ │
│                                           │   Export       │ │
│                                           │                │ │
│                                           │ • Pay codes    │ │
│                                           │ • Hour totals  │ │
│                                           │ • OT breakdown │ │
│                                           │ • Differentials│ │
│                                           └────────┬───────┘ │
│                                                    │         │
│                                     ┌──────────────┼───────┐ │
│                                     │              │       │ │
│                              ┌──────▼─────┐ ┌─────▼─────┐ │ │
│                              │ Internal   │ │ External  │ │ │
│                              │ @mcv/      │ │ ADP, Gusto│ │ │
│                              │ payroll    │ │ Paychex   │ │ │
│                              └────────────┘ └───────────┘ │ │
└──────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### ClockEvent

Represents a single clock-in or clock-out action captured from any source.

```typescript
/**
 * A discrete clock event — the atomic unit of time capture.
 * Each clock-in and clock-out is a separate event; they are paired
 * during attendance record assembly.
 */
interface ClockEvent {
  /** UUID primary key */
  id: string;

  /** Tenant isolation */
  tenantId: string;

  /** Employee who clocked in/out */
  employeeId: string;

  /** Type of clock event */
  type: ClockEventType;

  /** UTC timestamp of the event (server-normalized) */
  timestamp: Date;

  /** Original timestamp from the client device (may differ from server) */
  clientTimestamp: Date;

  /** Timezone of the employee at time of punch */
  timezone: string;

  /** Source device/method */
  source: ClockSource;

  /** GPS coordinates at time of punch (nullable for non-mobile) */
  latitude: number | null;
  longitude: number | null;

  /** GPS accuracy in meters */
  gpsAccuracy: number | null;

  /** IP address of the request */
  ipAddress: string;

  /** Device identifier (for mobile/kiosk) */
  deviceId: string | null;

  /** Biometric verification method used (nullable) */
  biometricMethod: 'fingerprint' | 'facial' | 'iris' | 'palm' | null;

  /** Whether the event passed all validation checks */
  validated: boolean;

  /** Validation failures (empty array if all passed) */
  validationErrors: ClockValidationError[];

  /** Geofence that was matched (nullable) */
  matchedGeofenceId: string | null;

  /** Optional employee note (e.g., "forgot badge, used PIN") */
  note: string | null;

  /** Photo capture for face-verify kiosks (S3 path) */
  photoUrl: string | null;

  /** Whether this event was created via manager override */
  isManualEntry: boolean;

  /** Manager who approved manual entry (nullable) */
  approvedBy: string | null;

  /** Audit timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type ClockEventType =
  | 'clock_in'
  | 'clock_out'
  | 'break_start'
  | 'break_end'
  | 'transfer_in'   // department/job transfer mid-shift
  | 'transfer_out';

type ClockSource =
  | 'web'
  | 'mobile_app'
  | 'kiosk'
  | 'biometric_terminal'
  | 'nfc_tap'
  | 'api'           // external system integration
  | 'manual'        // manager manual entry
  | 'import';       // bulk import from legacy system

interface ClockValidationError {
  code: string;
  message: string;
  severity: 'warning' | 'error';
  details?: Record<string, unknown>;
}
```

### AttendanceRecord

A daily attendance record assembled from paired clock events.

```typescript
/**
 * Daily attendance record for one employee.
 * Assembled from paired ClockEvents, enriched with policy checks.
 */
interface AttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;

  /** The calendar date this record covers (YYYY-MM-DD) */
  date: string;

  /** Overall attendance status */
  status: AttendanceStatus;

  /** Paired clock events for this day */
  clockEventIds: string[];

  /** First clock-in of the day */
  firstClockIn: Date | null;

  /** Last clock-out of the day */
  lastClockOut: Date | null;

  /** Total hours worked (decimal, after break deductions) */
  totalHoursWorked: number;

  /** Total hours before break deductions */
  grossHours: number;

  /** Total break time in hours */
  totalBreakHours: number;

  /** Regular (non-overtime) hours */
  regularHours: number;

  /** Overtime hours at 1.5x */
  overtimeHours: number;

  /** Double-time hours at 2.0x */
  doubleTimeHours: number;

  /** Holiday premium hours */
  holidayHours: number;

  /** Shift differential hours breakdown */
  differentialHours: DifferentialBreakdown[];

  /** Whether the employee was tardy */
  isTardy: boolean;

  /** Minutes late (0 if not tardy) */
  tardyMinutes: number;

  /** Whether the employee left early */
  isEarlyDeparture: boolean;

  /** Minutes early (0 if not early departure) */
  earlyDepartureMinutes: number;

  /** Scheduled shift ID (from @mcv/people/scheduling) */
  scheduledShiftId: string | null;

  /** Approval status */
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'locked';

  /** Manager who approved */
  approvedBy: string | null;
  approvedAt: Date | null;

  /** Open exceptions on this record */
  exceptionIds: string[];

  /** Whether record has been exported to payroll */
  exported: boolean;
  exportId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'tardy'
  | 'early_departure'
  | 'tardy_early_departure'
  | 'partial_day'
  | 'on_leave'
  | 'holiday'
  | 'rest_day'
  | 'not_scheduled'
  | 'pending';       // clock-in without clock-out yet

interface DifferentialBreakdown {
  differentialCode: string;
  differentialName: string;
  hours: number;
  multiplier: number;
}
```

### ShiftActual

Tracks what actually happened vs. what was scheduled.

```typescript
/**
 * Actual shift worked vs. the scheduled shift.
 * Links attendance to scheduling for variance analysis.
 */
interface ShiftActual {
  id: string;
  tenantId: string;
  employeeId: string;
  date: string;

  /** Reference to the scheduled shift */
  scheduledShiftId: string | null;

  /** Reference to the attendance record */
  attendanceRecordId: string;

  /** Scheduled start/end */
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  scheduledHours: number | null;

  /** Actual start/end */
  actualStart: Date;
  actualEnd: Date | null;
  actualHours: number;

  /** Variance analysis */
  variance: ShiftVariance;

  /** Whether this was a split shift */
  isSplitShift: boolean;

  /** Split shift segments (if applicable) */
  segments: ShiftSegment[];

  /** Shift differential code applied */
  differentialCode: string | null;

  /** Department/cost center for this shift */
  departmentId: string;
  costCenterId: string | null;

  /** Job code (if employee transferred mid-shift) */
  jobCode: string;

  createdAt: Date;
  updatedAt: Date;
}

interface ShiftVariance {
  /** Minutes difference for start time (negative = early, positive = late) */
  startVarianceMinutes: number;

  /** Minutes difference for end time (negative = early, positive = late) */
  endVarianceMinutes: number;

  /** Hours difference (negative = under, positive = over) */
  hoursVariance: number;

  /** Whether variance exceeds policy threshold */
  exceedsThreshold: boolean;

  /** Grace period applied (minutes) */
  gracePeriodMinutes: number;
}

interface ShiftSegment {
  segmentIndex: number;
  start: Date;
  end: Date;
  hours: number;
  departmentId: string;
  jobCode: string;
}
```

### OvertimeCalculation

The result of applying overtime rules to a set of attendance records.

```typescript
/**
 * Overtime calculation result for an employee over a period.
 * Captures which rules were applied and the resulting hour breakdown.
 */
interface OvertimeCalculation {
  id: string;
  tenantId: string;
  employeeId: string;

  /** Pay period this calculation covers */
  payPeriodStart: string;
  payPeriodEnd: string;

  /** Calculation date/time */
  calculatedAt: Date;

  /** Which rule sets were applied */
  rulesApplied: OvertimeRule[];

  /** Day-by-day breakdown */
  dailyBreakdown: DailyOvertimeBreakdown[];

  /** Weekly totals (for weekly OT rules) */
  weeklyBreakdown: WeeklyOvertimeBreakdown[];

  /** Grand totals for the period */
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalDoubleTimeHours: number;
  totalHolidayHours: number;

  /** Estimated cost impact (hours × rate × multiplier) */
  estimatedCost: {
    regular: number;
    overtime: number;
    doubleTime: number;
    holiday: number;
    total: number;
    currency: string;
  };

  /** Whether any compliance violations were detected */
  hasViolations: boolean;
  violations: OvertimeViolation[];

  /** Approval chain */
  status: 'calculated' | 'reviewed' | 'approved' | 'exported';
  reviewedBy: string | null;
  approvedBy: string | null;
}

interface OvertimeRule {
  ruleId: string;
  name: string;
  jurisdiction: string;
  type: 'daily' | 'weekly' | 'consecutive_day' | 'holiday' | 'custom';
  threshold: number;
  multiplier: number;
  description: string;
}

type OvertimeTier = 'regular' | 'overtime_1_5x' | 'double_2x' | 'holiday';

interface DailyOvertimeBreakdown {
  date: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  isHoliday: boolean;
  holidayHours: number;
  isConsecutiveDay: boolean;
  consecutiveDayNumber: number;
  rulesTriggered: string[];
}

interface WeeklyOvertimeBreakdown {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  weeklyOvertimeThreshold: number;
}

interface OvertimeViolation {
  type: 'max_daily_hours' | 'max_weekly_hours' | 'insufficient_rest' | 'minor_hours_exceeded';
  date: string;
  description: string;
  severity: 'warning' | 'violation';
  regulationReference: string;
}
```

### BreakRecord

Tracks individual break periods within a shift.

```typescript
/**
 * A single break period within a shift.
 * Tracked for compliance with meal/rest break laws.
 */
interface BreakRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  attendanceRecordId: string;

  /** Type of break */
  type: BreakType;

  /** When the break started */
  startTime: Date;

  /** When the break ended (null if still on break) */
  endTime: Date | null;

  /** Duration in minutes */
  durationMinutes: number | null;

  /** Required duration per policy/law */
  requiredDurationMinutes: number;

  /** Whether this break was paid */
  isPaid: boolean;

  /** Whether this was auto-deducted (vs. explicitly clocked) */
  isAutoDeducted: boolean;

  /** Compliance check result */
  compliance: BreakCompliance;

  /** Whether employee waived this break (where legally allowed) */
  isWaived: boolean;

  /** Waiver document ID (if waived) */
  waiverId: string | null;

  /** Clock events for break start/end */
  breakStartEventId: string | null;
  breakEndEventId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

type BreakType =
  | 'meal'
  | 'rest'
  | 'nursing'
  | 'prayer'
  | 'smoke'
  | 'custom';

interface BreakCompliance {
  /** Whether the break met requirements */
  isCompliant: boolean;

  /** Jurisdiction rule that was checked */
  jurisdictionRule: string;

  /** What went wrong (empty if compliant) */
  violations: BreakViolation[];

  /** Premium penalty owed (e.g., CA 1-hour premium for missed meal) */
  penaltyHours: number;

  /** Penalty pay code */
  penaltyPayCode: string | null;
}

interface BreakViolation {
  code: string;
  description: string;
  /** e.g., "Meal break started at 5:15 (past 5th hour)" */
  detail: string;
}
```

### Geofence

Defines a geographic boundary for clock-in validation.

```typescript
/**
 * A geofence boundary for location-based clock validation.
 * Uses PostGIS geometry for precise boundary matching.
 */
interface Geofence {
  id: string;
  tenantId: string;

  /** Human-readable name (e.g., "Main Office", "Warehouse B") */
  name: string;

  /** Description */
  description: string | null;

  /** Center point coordinates */
  latitude: number;
  longitude: number;

  /** Radius in meters (for circular geofences) */
  radiusMeters: number;

  /** PostGIS polygon (for complex boundaries, overrides radius) */
  polygon: GeoJSON.Polygon | null;

  /** Type of location */
  locationType: 'office' | 'warehouse' | 'job_site' | 'remote_hub' | 'client_site' | 'custom';

  /** Whether this geofence is active */
  isActive: boolean;

  /** Allowed IP ranges for this location (CIDR notation) */
  allowedIpRanges: string[];

  /** Whether WiFi SSID matching is enabled */
  wifiValidation: boolean;

  /** Allowed WiFi SSIDs */
  allowedSsids: string[];

  /** Address (for display purposes) */
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  /** Departments that can clock in at this location */
  allowedDepartmentIds: string[] | null;

  /** Time restrictions (e.g., only valid during business hours) */
  activeHours: {
    start: string;    // "06:00"
    end: string;      // "22:00"
    timezone: string;
    daysOfWeek: number[];  // 0=Sun, 6=Sat
  } | null;

  /** Tolerance beyond radius for GPS inaccuracy (meters) */
  gpsTolerance: number;

  createdAt: Date;
  updatedAt: Date;
}
```

### GeofenceLog

Records every geofence check performed during clock events.

```typescript
/**
 * Log entry for a geofence validation check.
 * Created every time a clock event is validated against geofences.
 */
interface GeofenceLog {
  id: string;
  tenantId: string;
  employeeId: string;
  clockEventId: string;

  /** The geofence that was checked */
  geofenceId: string;

  /** Employee's coordinates at time of check */
  latitude: number;
  longitude: number;

  /** GPS accuracy reported by device */
  gpsAccuracy: number;

  /** Distance from geofence center in meters */
  distanceFromCenter: number;

  /** Whether the employee was within the geofence */
  isWithinBoundary: boolean;

  /** IP address match result */
  ipMatchResult: 'match' | 'no_match' | 'not_checked';

  /** WiFi SSID match result */
  wifiMatchResult: 'match' | 'no_match' | 'not_checked';

  /** Overall validation result */
  validationResult: 'pass' | 'fail' | 'override';

  /** If overridden, who approved */
  overrideBy: string | null;
  overrideReason: string | null;

  createdAt: Date;
}
```

### TimeException

Represents an anomaly or issue that requires attention.

```typescript
/**
 * A time exception — an issue detected in the attendance data
 * that needs review or resolution.
 */
interface TimeException {
  id: string;
  tenantId: string;
  employeeId: string;

  /** The attendance record this exception relates to */
  attendanceRecordId: string | null;

  /** Type of exception */
  type: ExceptionType;

  /** Severity */
  severity: 'info' | 'warning' | 'critical';

  /** Date the exception pertains to */
  date: string;

  /** Human-readable description */
  description: string;

  /** Machine-readable details */
  details: Record<string, unknown>;

  /** Current resolution status */
  status: 'open' | 'in_review' | 'resolved' | 'dismissed';

  /** Resolution details */
  resolution: ExceptionResolution | null;

  /** Who is responsible for resolving */
  assignedTo: string | null;

  /** Deadline for resolution (before payroll lock) */
  resolveBy: Date | null;

  /** Related clock event IDs */
  relatedClockEventIds: string[];

  /** Whether this blocks payroll export */
  blocksPayroll: boolean;

  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

type ExceptionType =
  | 'missing_clock_out'
  | 'missing_clock_in'
  | 'overlapping_shifts'
  | 'excessive_hours'
  | 'implausible_duration'
  | 'geofence_violation'
  | 'ip_violation'
  | 'missed_break'
  | 'short_break'
  | 'minor_violation'
  | 'consecutive_day_violation'
  | 'max_hours_violation'
  | 'unscheduled_work'
  | 'early_clock_in'
  | 'late_clock_out'
  | 'duplicate_punch'
  | 'device_mismatch'
  | 'retroactive_edit'
  | 'approval_required'
  | 'policy_violation';

interface ExceptionResolution {
  /** How it was resolved */
  method: 'corrected' | 'approved_as_is' | 'dismissed' | 'auto_resolved';

  /** Who resolved it */
  resolvedBy: string;

  /** Explanation */
  note: string;

  /** Corrections applied (if any) */
  corrections: TimeCorrection[];

  /** When it was resolved */
  resolvedAt: Date;
}

interface TimeCorrection {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
}
```

### PayrollExport

Represents a batch export of approved time data to payroll.

```typescript
/**
 * A payroll export batch containing approved time records
 * for a specific pay period.
 */
interface PayrollExport {
  id: string;
  tenantId: string;

  /** Pay period boundaries */
  payPeriodStart: string;
  payPeriodEnd: string;

  /** Pay period type */
  payPeriodType: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

  /** Export status */
  status: 'draft' | 'pending_approval' | 'approved' | 'exported' | 'confirmed' | 'error';

  /** Number of employees in this export */
  employeeCount: number;

  /** Line items (one per employee per pay code) */
  lines: PayrollExportLine[];

  /** Summary totals */
  summary: {
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalDoubleTimeHours: number;
    totalHolidayHours: number;
    totalPtoHours: number;
    totalAllHours: number;
    estimatedGrossPay: number;
    currency: string;
  };

  /** Unresolved exceptions that were included (should be 0) */
  unresolvedExceptions: number;

  /** Target payroll system */
  targetSystem: 'internal' | 'adp' | 'gusto' | 'paychex' | 'quickbooks' | 'custom';

  /** External reference ID (from payroll provider) */
  externalReferenceId: string | null;

  /** Export file path (CSV/JSON) */
  exportFilePath: string | null;

  /** Who created and approved */
  createdBy: string;
  approvedBy: string | null;
  exportedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

interface PayrollExportLine {
  employeeId: string;
  employeeNumber: string;
  departmentId: string;
  costCenterId: string | null;

  /** Pay code (maps to payroll system) */
  payCode: string;

  /** Description (e.g., "Regular", "OT 1.5x", "Holiday") */
  payCodeDescription: string;

  /** Hours for this pay code */
  hours: number;

  /** Rate multiplier */
  rateMultiplier: number;

  /** Dollar amount (if known) */
  amount: number | null;

  /** Source attendance record IDs */
  attendanceRecordIds: string[];
}
```

### AttendancePolicy

Tenant-configurable attendance rules.

```typescript
/**
 * Attendance policy configuration for a tenant.
 * Controls rounding, grace periods, auto-deductions, and thresholds.
 */
interface AttendancePolicy {
  id: string;
  tenantId: string;

  /** Policy name */
  name: string;

  /** Which employee groups this applies to */
  scope: {
    allEmployees: boolean;
    departmentIds: string[];
    locationIds: string[];
    employeeTypeIds: string[];
  };

  /** Clock rounding rules */
  rounding: {
    enabled: boolean;
    /** Rounding interval in minutes (e.g., 15) */
    intervalMinutes: number;
    /** Rounding method */
    method: 'nearest' | 'up' | 'down' | 'seventh_minute';
  };

  /** Grace period for tardiness */
  gracePeriod: {
    enabled: boolean;
    /** Minutes after shift start before marking tardy */
    tardyGraceMinutes: number;
    /** Minutes before shift end before marking early departure */
    earlyDepartureGraceMinutes: number;
  };

  /** Auto-deduction rules */
  autoDeductions: {
    enabled: boolean;
    /** Auto-deduct meal break if shift exceeds threshold */
    mealBreak: {
      enabled: boolean;
      thresholdHours: number;
      deductionMinutes: number;
    };
    /** Additional auto-deductions */
    custom: Array<{
      name: string;
      thresholdHours: number;
      deductionMinutes: number;
    }>;
  };

  /** Early clock-in restriction */
  earlyClockIn: {
    restrictEnabled: boolean;
    /** Minutes before shift start that clock-in is allowed */
    allowedMinutesBefore: number;
  };

  /** Maximum shift duration before auto-clock-out */
  maxShiftHours: number;

  /** Overtime rules for this policy */
  overtimeRuleIds: string[];

  /** Whether to require geofence validation */
  requireGeofence: boolean;

  /** Whether to require photo verification at kiosks */
  requirePhoto: boolean;

  /** IP restriction mode */
  ipRestriction: 'none' | 'warn' | 'block';

  /** Allowed IP ranges (CIDR) */
  allowedIpRanges: string[];

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### MinorRestriction

Special rules for employees who are minors.

```typescript
/**
 * Labor restriction rules for minor employees.
 * Enforced during clock-in validation and overtime calculation.
 */
interface MinorRestriction {
  id: string;
  tenantId: string;

  /** Jurisdiction this rule applies to */
  jurisdiction: string;

  /** Age range */
  minAge: number;
  maxAge: number;

  /** Maximum hours per day */
  maxDailyHours: number;

  /** Maximum hours per week */
  maxWeeklyHours: number;

  /** Maximum hours per week during school year */
  maxWeeklyHoursSchoolYear: number;

  /** Earliest allowed start time */
  earliestStartTime: string;

  /** Latest allowed end time */
  latestEndTime: string;

  /** Latest end time during school year */
  latestEndTimeSchoolYear: string;

  /** Required break rules (more restrictive than adult) */
  breakRequirements: {
    mealBreakAfterHours: number;
    mealBreakDurationMinutes: number;
    restBreakEveryHours: number;
    restBreakDurationMinutes: number;
  };

  /** Whether work permit is required */
  requiresWorkPermit: boolean;

  /** Prohibited job types */
  prohibitedJobCodes: string[];

  /** Effective dates */
  effectiveFrom: string;
  effectiveTo: string | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### AttendanceService

The primary service facade for the module.

```typescript
/**
 * Primary service for time & attendance operations.
 * Orchestrates clock events, attendance records, and compliance checks.
 */
interface AttendanceService {
  // ── Clock Operations ──────────────────────────────────────

  /** Process a clock-in event with full validation pipeline */
  clockIn(params: ClockInParams): Promise<ClockResult>;

  /** Process a clock-out event with full validation pipeline */
  clockOut(params: ClockOutParams): Promise<ClockResult>;

  /** Start a break */
  startBreak(params: StartBreakParams): Promise<BreakRecord>;

  /** End a break */
  endBreak(params: EndBreakParams): Promise<BreakRecord>;

  /** Get current clock status for an employee */
  getClockStatus(employeeId: string): Promise<ClockStatus>;

  /** Get current clock status for all employees in a department */
  getDepartmentClockStatus(departmentId: string): Promise<ClockStatus[]>;

  // ── Attendance Records ────────────────────────────────────

  /** Get attendance records for an employee in a date range */
  getAttendanceRecords(params: AttendanceQuery): Promise<PaginatedResult<AttendanceRecord>>;

  /** Get a single attendance record by ID */
  getAttendanceRecord(id: string): Promise<AttendanceRecord>;

  /** Get daily attendance summary for a department */
  getDailyAttendanceSummary(params: DailySummaryParams): Promise<DailySummary>;

  /** Recalculate attendance record after corrections */
  recalculateAttendance(attendanceRecordId: string): Promise<AttendanceRecord>;

  // ── Approval Workflow ─────────────────────────────────────

  /** Approve a timecard (individual attendance record) */
  approveTimecard(id: string, approverId: string): Promise<AttendanceRecord>;

  /** Bulk approve timecards for a department/period */
  bulkApproveTimecards(params: BulkApproveParams): Promise<BulkApproveResult>;

  /** Reject a timecard with reason */
  rejectTimecard(id: string, approverId: string, reason: string): Promise<AttendanceRecord>;

  /** Lock timecards for a pay period (prevents further edits) */
  lockPayPeriod(params: LockPeriodParams): Promise<void>;

  // ── Exceptions ────────────────────────────────────────────

  /** Get open exceptions for a manager's reports */
  getOpenExceptions(managerId: string): Promise<TimeException[]>;

  /** Resolve an exception */
  resolveException(id: string, resolution: ExceptionResolution): Promise<TimeException>;

  /** Dismiss an exception */
  dismissException(id: string, reason: string, dismissedBy: string): Promise<TimeException>;

  // ── Overtime ──────────────────────────────────────────────

  /** Calculate overtime for a pay period */
  calculateOvertime(params: OvertimeCalcParams): Promise<OvertimeCalculation>;

  /** Get overtime forecast (hours remaining before OT triggers) */
  getOvertimeForecast(employeeId: string): Promise<OvertimeForecast>;

  /** Get real-time overtime alerts for a department */
  getOvertimeAlerts(departmentId: string): Promise<OvertimeAlert[]>;

  // ── Payroll Export ────────────────────────────────────────

  /** Generate a payroll export for a pay period */
  generatePayrollExport(params: PayrollExportParams): Promise<PayrollExport>;

  /** Approve a payroll export */
  approvePayrollExport(exportId: string, approverId: string): Promise<PayrollExport>;

  /** Submit export to payroll provider */
  submitToPayroll(exportId: string): Promise<PayrollExport>;

  // ── Analytics ─────────────────────────────────────────────

  /** Get attendance analytics for a period */
  getAttendanceAnalytics(params: AnalyticsParams): Promise<AttendanceAnalytics>;

  /** Get overtime trend analysis */
  getOvertimeTrends(params: TrendParams): Promise<OvertimeTrend[]>;

  /** Get punctuality scores */
  getPunctualityScores(params: ScoreParams): Promise<PunctualityScore[]>;
}

interface ClockInParams {
  employeeId: string;
  source: ClockSource;
  timestamp?: Date;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  ipAddress: string;
  deviceId?: string;
  biometricMethod?: 'fingerprint' | 'facial' | 'iris' | 'palm';
  note?: string;
  photoUrl?: string;
  departmentId?: string;
  jobCode?: string;
}

interface ClockResult {
  success: boolean;
  clockEvent: ClockEvent | null;
  attendanceRecord: AttendanceRecord | null;
  exceptions: TimeException[];
  warnings: string[];
}

interface ClockStatus {
  employeeId: string;
  employeeName: string;
  isClockedIn: boolean;
  currentShiftStart: Date | null;
  currentBreak: BreakRecord | null;
  hoursWorkedToday: number;
  scheduledShift: {
    start: Date;
    end: Date;
  } | null;
  overtimeForecast: {
    weeklyHoursSoFar: number;
    weeklyOvertimeThreshold: number;
    hoursUntilOvertime: number;
  };
  breaksDue: {
    type: BreakType;
    dueAt: Date;
    required: boolean;
  }[];
}
```

---

## Database Schemas

All tables are created in the `people_time` schema with multi-tenant RLS policies keyed on `tenant_id`.

### clock_events

```typescript
import { pgSchema, pgTable, uuid, text, timestamp, numeric, boolean, jsonb, inet, pgEnum } from 'drizzle-orm/pg-core';

export const peopleTimeSchema = pgSchema('people_time');

export const clockEventTypeEnum = peopleTimeSchema.enum('clock_event_type', [
  'clock_in',
  'clock_out',
  'break_start',
  'break_end',
  'transfer_in',
  'transfer_out',
]);

export const clockSourceEnum = peopleTimeSchema.enum('clock_source', [
  'web',
  'mobile_app',
  'kiosk',
  'biometric_terminal',
  'nfc_tap',
  'api',
  'manual',
  'import',
]);

export const clockEvents = peopleTimeSchema.table('clock_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  type: clockEventTypeEnum('type').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  clientTimestamp: timestamp('client_timestamp', { withTimezone: true }).notNull(),
  timezone: text('timezone').notNull(),
  source: clockSourceEnum('source').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  gpsAccuracy: numeric('gps_accuracy', { precision: 8, scale: 2 }),
  ipAddress: inet('ip_address').notNull(),
  deviceId: text('device_id'),
  biometricMethod: text('biometric_method'),
  validated: boolean('validated').notNull().default(false),
  validationErrors: jsonb('validation_errors').notNull().default([]),
  matchedGeofenceId: uuid('matched_geofence_id').references(() => geofences.id),
  note: text('note'),
  photoUrl: text('photo_url'),
  isManualEntry: boolean('is_manual_entry').notNull().default(false),
  approvedBy: uuid('approved_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantEmployeeIdx: index('idx_clock_events_tenant_employee')
    .on(table.tenantId, table.employeeId),
  timestampIdx: index('idx_clock_events_timestamp')
    .on(table.tenantId, table.timestamp),
  employeeDateIdx: index('idx_clock_events_employee_date')
    .on(table.tenantId, table.employeeId, table.timestamp),
}));
```

### attendance_records

```typescript
export const attendanceStatusEnum = peopleTimeSchema.enum('attendance_status', [
  'present',
  'absent',
  'tardy',
  'early_departure',
  'tardy_early_departure',
  'partial_day',
  'on_leave',
  'holiday',
  'rest_day',
  'not_scheduled',
  'pending',
]);

export const approvalStatusEnum = peopleTimeSchema.enum('approval_status', [
  'pending',
  'approved',
  'rejected',
  'locked',
]);

export const attendanceRecords = peopleTimeSchema.table('attendance_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  date: text('date').notNull(),  // YYYY-MM-DD
  status: attendanceStatusEnum('status').notNull().default('pending'),
  clockEventIds: jsonb('clock_event_ids').notNull().default([]),
  firstClockIn: timestamp('first_clock_in', { withTimezone: true }),
  lastClockOut: timestamp('last_clock_out', { withTimezone: true }),
  totalHoursWorked: numeric('total_hours_worked', { precision: 6, scale: 2 }).notNull().default('0'),
  grossHours: numeric('gross_hours', { precision: 6, scale: 2 }).notNull().default('0'),
  totalBreakHours: numeric('total_break_hours', { precision: 6, scale: 2 }).notNull().default('0'),
  regularHours: numeric('regular_hours', { precision: 6, scale: 2 }).notNull().default('0'),
  overtimeHours: numeric('overtime_hours', { precision: 6, scale: 2 }).notNull().default('0'),
  doubleTimeHours: numeric('double_time_hours', { precision: 6, scale: 2 }).notNull().default('0'),
  holidayHours: numeric('holiday_hours', { precision: 6, scale: 2 }).notNull().default('0'),
  differentialHours: jsonb('differential_hours').notNull().default([]),
  isTardy: boolean('is_tardy').notNull().default(false),
  tardyMinutes: numeric('tardy_minutes', { precision: 5, scale: 0 }).notNull().default('0'),
  isEarlyDeparture: boolean('is_early_departure').notNull().default(false),
  earlyDepartureMinutes: numeric('early_departure_minutes', { precision: 5, scale: 0 }).notNull().default('0'),
  scheduledShiftId: uuid('scheduled_shift_id'),
  approvalStatus: approvalStatusEnum('approval_status').notNull().default('pending'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  exceptionIds: jsonb('exception_ids').notNull().default([]),
  exported: boolean('exported').notNull().default(false),
  exportId: uuid('export_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantEmployeeDateIdx: uniqueIndex('idx_attendance_records_tenant_employee_date')
    .on(table.tenantId, table.employeeId, table.date),
  statusIdx: index('idx_attendance_records_status')
    .on(table.tenantId, table.status),
  approvalIdx: index('idx_attendance_records_approval')
    .on(table.tenantId, table.approvalStatus),
  exportIdx: index('idx_attendance_records_export')
    .on(table.tenantId, table.exported),
}));
```

### shift_actuals

```typescript
export const shiftActuals = peopleTimeSchema.table('shift_actuals', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  date: text('date').notNull(),
  scheduledShiftId: uuid('scheduled_shift_id'),
  attendanceRecordId: uuid('attendance_record_id').notNull().references(() => attendanceRecords.id),
  scheduledStart: timestamp('scheduled_start', { withTimezone: true }),
  scheduledEnd: timestamp('scheduled_end', { withTimezone: true }),
  scheduledHours: numeric('scheduled_hours', { precision: 6, scale: 2 }),
  actualStart: timestamp('actual_start', { withTimezone: true }).notNull(),
  actualEnd: timestamp('actual_end', { withTimezone: true }),
  actualHours: numeric('actual_hours', { precision: 6, scale: 2 }).notNull().default('0'),
  startVarianceMinutes: numeric('start_variance_minutes', { precision: 6, scale: 0 }).notNull().default('0'),
  endVarianceMinutes: numeric('end_variance_minutes', { precision: 6, scale: 0 }).notNull().default('0'),
  hoursVariance: numeric('hours_variance', { precision: 6, scale: 2 }).notNull().default('0'),
  exceedsThreshold: boolean('exceeds_threshold').notNull().default(false),
  gracePeriodMinutes: numeric('grace_period_minutes', { precision: 4, scale: 0 }).notNull().default('0'),
  isSplitShift: boolean('is_split_shift').notNull().default(false),
  segments: jsonb('segments').notNull().default([]),
  differentialCode: text('differential_code'),
  departmentId: uuid('department_id').notNull(),
  costCenterId: uuid('cost_center_id'),
  jobCode: text('job_code').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantDateIdx: index('idx_shift_actuals_tenant_date')
    .on(table.tenantId, table.date),
  employeeDateIdx: index('idx_shift_actuals_employee_date')
    .on(table.tenantId, table.employeeId, table.date),
}));
```

### overtime_records

```typescript
export const overtimeRecords = peopleTimeSchema.table('overtime_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  payPeriodStart: text('pay_period_start').notNull(),
  payPeriodEnd: text('pay_period_end').notNull(),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  rulesApplied: jsonb('rules_applied').notNull().default([]),
  dailyBreakdown: jsonb('daily_breakdown').notNull().default([]),
  weeklyBreakdown: jsonb('weekly_breakdown').notNull().default([]),
  totalRegularHours: numeric('total_regular_hours', { precision: 8, scale: 2 }).notNull().default('0'),
  totalOvertimeHours: numeric('total_overtime_hours', { precision: 8, scale: 2 }).notNull().default('0'),
  totalDoubleTimeHours: numeric('total_double_time_hours', { precision: 8, scale: 2 }).notNull().default('0'),
  totalHolidayHours: numeric('total_holiday_hours', { precision: 8, scale: 2 }).notNull().default('0'),
  estimatedCost: jsonb('estimated_cost'),
  hasViolations: boolean('has_violations').notNull().default(false),
  violations: jsonb('violations').notNull().default([]),
  status: text('status').notNull().default('calculated'),
  reviewedBy: uuid('reviewed_by'),
  approvedBy: uuid('approved_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPeriodIdx: index('idx_overtime_records_tenant_period')
    .on(table.tenantId, table.payPeriodStart, table.payPeriodEnd),
  employeePeriodIdx: uniqueIndex('idx_overtime_records_employee_period')
    .on(table.tenantId, table.employeeId, table.payPeriodStart, table.payPeriodEnd),
}));
```

### break_records

```typescript
export const breakTypeEnum = peopleTimeSchema.enum('break_type', [
  'meal',
  'rest',
  'nursing',
  'prayer',
  'smoke',
  'custom',
]);

export const breakRecords = peopleTimeSchema.table('break_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  attendanceRecordId: uuid('attendance_record_id').notNull().references(() => attendanceRecords.id),
  type: breakTypeEnum('type').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  durationMinutes: numeric('duration_minutes', { precision: 5, scale: 0 }),
  requiredDurationMinutes: numeric('required_duration_minutes', { precision: 5, scale: 0 }).notNull(),
  isPaid: boolean('is_paid').notNull().default(false),
  isAutoDeducted: boolean('is_auto_deducted').notNull().default(false),
  compliance: jsonb('compliance').notNull().default({}),
  isWaived: boolean('is_waived').notNull().default(false),
  waiverId: uuid('waiver_id'),
  breakStartEventId: uuid('break_start_event_id').references(() => clockEvents.id),
  breakEndEventId: uuid('break_end_event_id').references(() => clockEvents.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  attendanceIdx: index('idx_break_records_attendance')
    .on(table.attendanceRecordId),
  employeeDateIdx: index('idx_break_records_employee')
    .on(table.tenantId, table.employeeId, table.startTime),
}));
```

### geofences

```typescript
export const geofences = peopleTimeSchema.table('geofences', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  description: text('description'),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),
  radiusMeters: numeric('radius_meters', { precision: 10, scale: 2 }).notNull(),
  // PostGIS geometry column added via raw SQL migration:
  // polygon GEOMETRY(Polygon, 4326)
  locationType: text('location_type').notNull().default('office'),
  isActive: boolean('is_active').notNull().default(true),
  allowedIpRanges: jsonb('allowed_ip_ranges').notNull().default([]),
  wifiValidation: boolean('wifi_validation').notNull().default(false),
  allowedSsids: jsonb('allowed_ssids').notNull().default([]),
  address: jsonb('address').notNull(),
  allowedDepartmentIds: jsonb('allowed_department_ids'),
  activeHours: jsonb('active_hours'),
  gpsTolerance: numeric('gps_tolerance', { precision: 8, scale: 2 }).notNull().default('50'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_geofences_tenant').on(table.tenantId),
  activeIdx: index('idx_geofences_active').on(table.tenantId, table.isActive),
  // PostGIS spatial index added via raw SQL:
  // CREATE INDEX idx_geofences_polygon ON people_time.geofences USING GIST(polygon);
}));
```

### geofence_logs

```typescript
export const geofenceLogs = peopleTimeSchema.table('geofence_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  clockEventId: uuid('clock_event_id').notNull().references(() => clockEvents.id),
  geofenceId: uuid('geofence_id').notNull().references(() => geofences.id),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),
  gpsAccuracy: numeric('gps_accuracy', { precision: 8, scale: 2 }).notNull(),
  distanceFromCenter: numeric('distance_from_center', { precision: 10, scale: 2 }).notNull(),
  isWithinBoundary: boolean('is_within_boundary').notNull(),
  ipMatchResult: text('ip_match_result').notNull().default('not_checked'),
  wifiMatchResult: text('wifi_match_result').notNull().default('not_checked'),
  validationResult: text('validation_result').notNull(),
  overrideBy: uuid('override_by'),
  overrideReason: text('override_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clockEventIdx: index('idx_geofence_logs_clock_event').on(table.clockEventId),
  geofenceIdx: index('idx_geofence_logs_geofence').on(table.geofenceId),
  tenantDateIdx: index('idx_geofence_logs_tenant_date').on(table.tenantId, table.createdAt),
}));
```

### time_exceptions

```typescript
export const exceptionTypeEnum = peopleTimeSchema.enum('exception_type', [
  'missing_clock_out',
  'missing_clock_in',
  'overlapping_shifts',
  'excessive_hours',
  'implausible_duration',
  'geofence_violation',
  'ip_violation',
  'missed_break',
  'short_break',
  'minor_violation',
  'consecutive_day_violation',
  'max_hours_violation',
  'unscheduled_work',
  'early_clock_in',
  'late_clock_out',
  'duplicate_punch',
  'device_mismatch',
  'retroactive_edit',
  'approval_required',
  'policy_violation',
]);

export const exceptionStatusEnum = peopleTimeSchema.enum('exception_status', [
  'open',
  'in_review',
  'resolved',
  'dismissed',
]);

export const timeExceptions = peopleTimeSchema.table('time_exceptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  attendanceRecordId: uuid('attendance_record_id').references(() => attendanceRecords.id),
  type: exceptionTypeEnum('type').notNull(),
  severity: text('severity').notNull().default('warning'),
  date: text('date').notNull(),
  description: text('description').notNull(),
  details: jsonb('details').notNull().default({}),
  status: exceptionStatusEnum('status').notNull().default('open'),
  resolution: jsonb('resolution'),
  assignedTo: uuid('assigned_to'),
  resolveBy: timestamp('resolve_by', { withTimezone: true }),
  relatedClockEventIds: jsonb('related_clock_event_ids').notNull().default([]),
  blocksPayroll: boolean('blocks_payroll').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (table) => ({
  tenantStatusIdx: index('idx_time_exceptions_tenant_status')
    .on(table.tenantId, table.status),
  employeeDateIdx: index('idx_time_exceptions_employee_date')
    .on(table.tenantId, table.employeeId, table.date),
  assignedIdx: index('idx_time_exceptions_assigned')
    .on(table.tenantId, table.assignedTo, table.status),
  blocksPayrollIdx: index('idx_time_exceptions_blocks_payroll')
    .on(table.tenantId, table.blocksPayroll, table.status),
}));
```

### payroll_exports

```typescript
export const payrollExportStatusEnum = peopleTimeSchema.enum('payroll_export_status', [
  'draft',
  'pending_approval',
  'approved',
  'exported',
  'confirmed',
  'error',
]);

export const payrollExports = peopleTimeSchema.table('payroll_exports', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  payPeriodStart: text('pay_period_start').notNull(),
  payPeriodEnd: text('pay_period_end').notNull(),
  payPeriodType: text('pay_period_type').notNull(),
  status: payrollExportStatusEnum('status').notNull().default('draft'),
  employeeCount: numeric('employee_count', { precision: 6, scale: 0 }).notNull().default('0'),
  lines: jsonb('lines').notNull().default([]),
  summary: jsonb('summary').notNull().default({}),
  unresolvedExceptions: numeric('unresolved_exceptions', { precision: 6, scale: 0 }).notNull().default('0'),
  targetSystem: text('target_system').notNull().default('internal'),
  externalReferenceId: text('external_reference_id'),
  exportFilePath: text('export_file_path'),
  createdBy: uuid('created_by').notNull(),
  approvedBy: uuid('approved_by'),
  exportedAt: timestamp('exported_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPeriodIdx: index('idx_payroll_exports_tenant_period')
    .on(table.tenantId, table.payPeriodStart, table.payPeriodEnd),
  statusIdx: index('idx_payroll_exports_status')
    .on(table.tenantId, table.status),
}));
```

### attendance_policies

```typescript
export const attendancePolicies = peopleTimeSchema.table('attendance_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  scope: jsonb('scope').notNull(),
  rounding: jsonb('rounding').notNull().default({}),
  gracePeriod: jsonb('grace_period').notNull().default({}),
  autoDeductions: jsonb('auto_deductions').notNull().default({}),
  earlyClockIn: jsonb('early_clock_in').notNull().default({}),
  maxShiftHours: numeric('max_shift_hours', { precision: 4, scale: 1 }).notNull().default('16'),
  overtimeRuleIds: jsonb('overtime_rule_ids').notNull().default([]),
  requireGeofence: boolean('require_geofence').notNull().default(false),
  requirePhoto: boolean('require_photo').notNull().default(false),
  ipRestriction: text('ip_restriction').notNull().default('none'),
  allowedIpRanges: jsonb('allowed_ip_ranges').notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_attendance_policies_tenant').on(table.tenantId),
  activeIdx: index('idx_attendance_policies_active').on(table.tenantId, table.isActive),
}));
```

### minor_restrictions

```typescript
export const minorRestrictions = peopleTimeSchema.table('minor_restrictions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  jurisdiction: text('jurisdiction').notNull(),
  minAge: numeric('min_age', { precision: 2, scale: 0 }).notNull(),
  maxAge: numeric('max_age', { precision: 2, scale: 0 }).notNull(),
  maxDailyHours: numeric('max_daily_hours', { precision: 4, scale: 1 }).notNull(),
  maxWeeklyHours: numeric('max_weekly_hours', { precision: 4, scale: 1 }).notNull(),
  maxWeeklyHoursSchoolYear: numeric('max_weekly_hours_school_year', { precision: 4, scale: 1 }).notNull(),
  earliestStartTime: text('earliest_start_time').notNull(),
  latestEndTime: text('latest_end_time').notNull(),
  latestEndTimeSchoolYear: text('latest_end_time_school_year').notNull(),
  breakRequirements: jsonb('break_requirements').notNull(),
  requiresWorkPermit: boolean('requires_work_permit').notNull().default(true),
  prohibitedJobCodes: jsonb('prohibited_job_codes').notNull().default([]),
  effectiveFrom: text('effective_from').notNull(),
  effectiveTo: text('effective_to'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantJurisdictionIdx: index('idx_minor_restrictions_jurisdiction')
    .on(table.tenantId, table.jurisdiction),
  ageRangeIdx: index('idx_minor_restrictions_age')
    .on(table.tenantId, table.minAge, table.maxAge),
}));
```

### RLS Policies (applied via migration)

```sql
-- Enable RLS on all people_time tables
ALTER TABLE people_time.clock_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_time.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_time.shift_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_time.overtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_time.break_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_time.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_time.geofence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_time.time_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_time.payroll_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_time.attendance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_time.minor_restrictions ENABLE ROW LEVEL SECURITY;

-- Standard tenant isolation policy (repeated for each table)
CREATE POLICY tenant_isolation ON people_time.clock_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation ON people_time.attendance_records
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- ... (same pattern for all tables)

-- Employee self-service: employees can read their own records
CREATE POLICY employee_self_read ON people_time.clock_events
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND employee_id = current_setting('app.current_employee_id')::uuid
  );

CREATE POLICY employee_self_read ON people_time.attendance_records
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND employee_id = current_setting('app.current_employee_id')::uuid
  );

-- Manager read: managers can read records for their direct reports
CREATE POLICY manager_read ON people_time.attendance_records
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND employee_id IN (
      SELECT id FROM people.employees
      WHERE manager_id = current_setting('app.current_employee_id')::uuid
    )
  );
```

---

## Code Examples

### 1 — Clock In with Geofence Validation

```typescript
import { AttendanceService } from '@mcv/people/time';
import { inject } from '@mcv/platform/di';

const attendance = inject(AttendanceService);

// Employee clocks in from mobile app with GPS
const result = await attendance.clockIn({
  employeeId: 'emp_01J7X2K...',
  source: 'mobile_app',
  latitude: 43.6532,
  longitude: -79.3832,
  gpsAccuracy: 12.5,   // meters
  ipAddress: '192.168.1.105',
  deviceId: 'device_abc123',
  note: 'Arrived at front entrance',
});

if (result.success) {
  console.log('Clocked in successfully');
  console.log('Clock event:', result.clockEvent!.id);
  console.log('Attendance record:', result.attendanceRecord!.id);
  console.log('Matched geofence:', result.clockEvent!.matchedGeofenceId);
} else {
  // Clock-in was rejected — show validation errors
  console.error('Clock-in failed');
  for (const exception of result.exceptions) {
    console.error(`[${exception.type}] ${exception.description}`);
    // e.g., [geofence_violation] Employee is 2.3 km from nearest allowed location
  }
}

// Check warnings even on success (e.g., GPS accuracy is low)
for (const warning of result.warnings) {
  console.warn(warning);
  // e.g., "GPS accuracy is 12.5m — below recommended 10m threshold"
}
```

### 2 — Process Attendance for a Pay Period

```typescript
import { AttendanceService } from '@mcv/people/time';
import { inject } from '@mcv/platform/di';

const attendance = inject(AttendanceService);

// Get all attendance records for a department in a pay period
const records = await attendance.getAttendanceRecords({
  departmentId: 'dept_engineering',
  startDate: '2026-01-13',
  endDate: '2026-01-26',
  includeExceptions: true,
  page: 1,
  pageSize: 100,
});

console.log(`Total records: ${records.total}`);
console.log(`Page: ${records.page} of ${records.totalPages}`);

// Summary statistics
const summary = {
  totalPresent: records.data.filter(r => r.status === 'present').length,
  totalTardy: records.data.filter(r => r.isTardy).length,
  totalAbsent: records.data.filter(r => r.status === 'absent').length,
  totalHoursWorked: records.data.reduce((sum, r) => sum + r.totalHoursWorked, 0),
  totalOvertimeHours: records.data.reduce((sum, r) => sum + r.overtimeHours, 0),
  pendingApproval: records.data.filter(r => r.approvalStatus === 'pending').length,
  openExceptions: records.data.reduce((sum, r) => sum + r.exceptionIds.length, 0),
};

console.log('Pay period summary:', summary);

// Bulk approve all records without exceptions
const approvableRecords = records.data.filter(
  r => r.approvalStatus === 'pending' && r.exceptionIds.length === 0
);

if (approvableRecords.length > 0) {
  const bulkResult = await attendance.bulkApproveTimecards({
    attendanceRecordIds: approvableRecords.map(r => r.id),
    approverId: 'mgr_01J7X2K...',
  });

  console.log(`Approved: ${bulkResult.approved}`);
  console.log(`Skipped (has exceptions): ${bulkResult.skipped}`);
  console.log(`Failed: ${bulkResult.failed}`);
}
```

### 3 — Calculate Weekly Overtime (FLSA)

```typescript
import { OvertimeService } from '@mcv/people/time';
import { OVERTIME_RULES } from '@mcv/people/time';
import { inject } from '@mcv/platform/di';

const overtime = inject(OvertimeService);

// Calculate overtime for an employee for a pay period
const calculation = await overtime.calculate({
  employeeId: 'emp_01J7X2K...',
  payPeriodStart: '2026-01-13',
  payPeriodEnd: '2026-01-26',
});

console.log('Rules applied:', calculation.rulesApplied.map(r => r.name));
// e.g., ["FLSA Weekly 40-Hour", "California Daily 8-Hour"]

console.log('Period totals:');
console.log(`  Regular:     ${calculation.totalRegularHours}h`);
console.log(`  Overtime:    ${calculation.totalOvertimeHours}h @ 1.5x`);
console.log(`  Double Time: ${calculation.totalDoubleTimeHours}h @ 2.0x`);
console.log(`  Holiday:     ${calculation.totalHolidayHours}h`);

// Day-by-day breakdown
for (const day of calculation.dailyBreakdown) {
  const flags = [];
  if (day.isHoliday) flags.push('HOLIDAY');
  if (day.isConsecutiveDay) flags.push(`CONSEC-DAY-${day.consecutiveDayNumber}`);
  if (day.overtimeHours > 0) flags.push('OT');
  if (day.doubleTimeHours > 0) flags.push('DT');

  console.log(
    `  ${day.date}: ${day.totalHours}h ` +
    `(reg: ${day.regularHours}, OT: ${day.overtimeHours}, DT: ${day.doubleTimeHours}) ` +
    `${flags.join(' ')}`
  );
}

// Weekly breakdown (for FLSA weekly OT)
for (const week of calculation.weeklyBreakdown) {
  console.log(
    `  Week ${week.weekStart} → ${week.weekEnd}: ` +
    `${week.totalHours}h total, ${week.overtimeHours}h weekly OT`
  );
}

// Check violations
if (calculation.hasViolations) {
  console.warn('⚠️ Compliance violations detected:');
  for (const v of calculation.violations) {
    console.warn(`  [${v.severity}] ${v.description} (${v.regulationReference})`);
  }
}

// Estimated cost impact
console.log('Estimated cost:', calculation.estimatedCost);
// {
//   regular: 4800.00,
//   overtime: 720.00,
//   doubleTime: 240.00,
//   holiday: 0,
//   total: 5760.00,
//   currency: 'USD'
// }

// Real-time overtime forecast for current week
const forecast = await overtime.getOvertimeForecast('emp_01J7X2K...');
console.log(`Hours worked this week: ${forecast.weeklyHoursSoFar}`);
console.log(`Hours until OT: ${forecast.hoursUntilOvertime}`);
console.log(`Projected weekly total: ${forecast.projectedWeeklyTotal}`);
if (forecast.projectedWeeklyTotal > 40) {
  console.warn(`⚠️ On track for ${forecast.projectedWeeklyTotal - 40}h overtime this week`);
}
```

### 4 — Break Compliance Monitoring

```typescript
import { BreakService } from '@mcv/people/time';
import { BREAK_REQUIREMENTS } from '@mcv/people/time';
import { inject } from '@mcv/platform/di';

const breaks = inject(BreakService);

// Check what breaks an employee is due for
const status = await breaks.getBreakStatus('emp_01J7X2K...');

console.log('Current shift started:', status.shiftStartTime);
console.log('Hours worked so far:', status.hoursWorkedSoFar);
console.log('Breaks taken:', status.breaksTaken.length);

// Check upcoming required breaks
for (const upcoming of status.upcomingBreaks) {
  console.log(
    `${upcoming.type} break due by ${upcoming.dueBy} ` +
    `(${upcoming.durationMinutes} min, ${upcoming.isPaid ? 'paid' : 'unpaid'})`
  );
}

// Check compliance for completed breaks
for (const taken of status.breaksTaken) {
  if (!taken.compliance.isCompliant) {
    console.warn(`⚠️ Break violation: ${taken.type}`);
    for (const v of taken.compliance.violations) {
      console.warn(`  ${v.description}: ${v.detail}`);
    }
    if (taken.compliance.penaltyHours > 0) {
      console.warn(
        `  Penalty: ${taken.compliance.penaltyHours}h ` +
        `(pay code: ${taken.compliance.penaltyPayCode})`
      );
    }
  }
}

// Employee starts a meal break
const breakRecord = await breaks.startBreak({
  employeeId: 'emp_01J7X2K...',
  type: 'meal',
  source: 'mobile_app',
  latitude: 43.6532,
  longitude: -79.3832,
});

console.log('Break started:', breakRecord.id);
console.log('Required duration:', breakRecord.requiredDurationMinutes, 'min');

// ... employee takes their break ...

// Employee ends the break
const completed = await breaks.endBreak({
  breakId: breakRecord.id,
  source: 'mobile_app',
  latitude: 43.6532,
  longitude: -79.3832,
});

console.log('Break duration:', completed.durationMinutes, 'min');
console.log('Compliant:', completed.compliance.isCompliant);

// Generate break compliance report for a department
const report = await breaks.getComplianceReport({
  departmentId: 'dept_warehouse',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  jurisdiction: 'US-CA',
});

console.log('Break compliance report:');
console.log(`  Total shifts: ${report.totalShifts}`);
console.log(`  Compliant: ${report.compliantShifts} (${report.complianceRate}%)`);
console.log(`  Missed meals: ${report.missedMealBreaks}`);
console.log(`  Short meals: ${report.shortMealBreaks}`);
console.log(`  Missed rests: ${report.missedRestBreaks}`);
console.log(`  Total penalties: ${report.totalPenaltyHours}h`);
console.log(`  Estimated penalty cost: $${report.estimatedPenaltyCost}`);
```

### 5 — Resolve Missing Punch Exception

```typescript
import { ExceptionService, AttendanceService } from '@mcv/people/time';
import { inject } from '@mcv/platform/di';

const exceptions = inject(ExceptionService);
const attendance = inject(AttendanceService);

// Manager reviews open exceptions
const openExceptions = await exceptions.getOpenExceptions('mgr_01J7X2K...');

console.log(`Open exceptions: ${openExceptions.length}`);

// Filter by type
const missingPunches = openExceptions.filter(e => e.type === 'missing_clock_out');
console.log(`Missing clock-outs: ${missingPunches.length}`);

// Resolve a specific missing clock-out
const exception = missingPunches[0];
console.log(`Employee: ${exception.employeeId}`);
console.log(`Date: ${exception.date}`);
console.log(`Description: ${exception.description}`);
// "Employee clocked in at 08:57 but no clock-out was recorded for 2026-01-15"

// Option A: Add the missing clock-out time
const resolved = await exceptions.resolve(exception.id, {
  method: 'corrected',
  resolvedBy: 'mgr_01J7X2K...',
  note: 'Employee confirmed they left at 5:15 PM — forgot to clock out',
  corrections: [
    {
      field: 'lastClockOut',
      oldValue: null,
      newValue: '2026-01-15T17:15:00-05:00',
      reason: 'Employee verbal confirmation',
    },
  ],
});

console.log('Exception resolved:', resolved.status); // 'resolved'
console.log('Attendance record recalculated');

// Option B: Dismiss the exception (e.g., employee was terminated)
const dismissed = await exceptions.dismiss(
  'exc_02...',
  'Employee terminated — attendance record voided',
  'mgr_01J7X2K...',
);

// Bulk resolve: auto-resolve all "duplicate_punch" exceptions
const duplicates = openExceptions.filter(e => e.type === 'duplicate_punch');
const bulkResult = await exceptions.bulkResolve(
  duplicates.map(e => e.id),
  {
    method: 'auto_resolved',
    resolvedBy: 'system',
    note: 'Duplicate punches auto-deduplicated',
    corrections: [],
  }
);
console.log(`Auto-resolved: ${bulkResult.resolved} of ${bulkResult.total}`);
```

### 6 — Export Approved Time to Payroll

```typescript
import { PayrollExportService } from '@mcv/people/time';
import { inject } from '@mcv/platform/di';

const payrollExport = inject(PayrollExportService);

// Generate a payroll export for the current pay period
const exportBatch = await payrollExport.generate({
  payPeriodStart: '2026-01-13',
  payPeriodEnd: '2026-01-26',
  payPeriodType: 'biweekly',
  targetSystem: 'adp',
  createdBy: 'payroll_admin_01...',
});

console.log('Export ID:', exportBatch.id);
console.log('Status:', exportBatch.status); // 'draft'
console.log('Employees:', exportBatch.employeeCount);
console.log('Summary:', exportBatch.summary);
// {
//   totalRegularHours: 12480.00,
//   totalOvertimeHours: 342.50,
//   totalDoubleTimeHours: 12.00,
//   totalHolidayHours: 640.00,
//   totalPtoHours: 280.00,
//   totalAllHours: 13754.50,
//   estimatedGrossPay: 687725.00,
//   currency: 'USD'
// }

// Check for blockers
if (exportBatch.unresolvedExceptions > 0) {
  console.warn(
    `⚠️ ${exportBatch.unresolvedExceptions} unresolved exceptions — ` +
    'resolve before approving export'
  );
}

// Review line items
for (const line of exportBatch.lines.slice(0, 5)) {
  console.log(
    `  ${line.employeeNumber} | ${line.payCodeDescription}: ` +
    `${line.hours}h @ ${line.rateMultiplier}x`
  );
}

// Approve the export
const approved = await payrollExport.approve(
  exportBatch.id,
  'payroll_director_01...',
);
console.log('Approved:', approved.status); // 'approved'

// Submit to ADP
const submitted = await payrollExport.submitToPayroll(exportBatch.id);
console.log('Submitted:', submitted.status); // 'exported'
console.log('ADP reference:', submitted.externalReferenceId);
console.log('Export file:', submitted.exportFilePath);

// Lock the pay period (prevents further edits)
await payrollExport.lockPayPeriod({
  payPeriodStart: '2026-01-13',
  payPeriodEnd: '2026-01-26',
  lockedBy: 'payroll_director_01...',
});
console.log('Pay period locked — no further edits allowed');

// Handle retroactive corrections (if needed after lock)
const correction = await payrollExport.createRetroactiveCorrection({
  originalExportId: exportBatch.id,
  employeeId: 'emp_01J7X2K...',
  payCode: 'REG',
  originalHours: 80.00,
  correctedHours: 82.50,
  reason: 'Missing 2.5h recovered from exception resolution',
  approvedBy: 'payroll_director_01...',
});
console.log('Retroactive correction created:', correction.id);
```

### 7 — Geofence Management

```typescript
import { GeofenceService } from '@mcv/people/time';
import { inject } from '@mcv/platform/di';

const geofenceService = inject(GeofenceService);

// Create a circular geofence for the main office
const officeGeofence = await geofenceService.create({
  name: 'Toronto Headquarters',
  description: 'Main office — 120 Adelaide St W',
  latitude: 43.6490,
  longitude: -79.3840,
  radiusMeters: 150,
  locationType: 'office',
  allowedIpRanges: ['10.0.0.0/8', '172.16.50.0/24'],
  wifiValidation: true,
  allowedSsids: ['MCV-Corp', 'MCV-Guest'],
  address: {
    street: '120 Adelaide St W',
    city: 'Toronto',
    state: 'ON',
    postalCode: 'M5H 1T1',
    country: 'CA',
  },
  activeHours: {
    start: '05:00',
    end: '23:00',
    timezone: 'America/Toronto',
    daysOfWeek: [1, 2, 3, 4, 5, 6],  // Mon-Sat
  },
  gpsTolerance: 50,
});

console.log('Geofence created:', officeGeofence.id);

// Create a polygon geofence for a large warehouse complex
const warehouseGeofence = await geofenceService.create({
  name: 'Brampton Distribution Center',
  description: 'Warehouse complex — requires polygon boundary',
  latitude: 43.7315,  // center point (for display)
  longitude: -79.7624,
  radiusMeters: 0,  // not used when polygon is set
  polygon: {
    type: 'Polygon',
    coordinates: [[
      [-79.7650, 43.7330],
      [-79.7600, 43.7330],
      [-79.7600, 43.7300],
      [-79.7650, 43.7300],
      [-79.7650, 43.7330],
    ]],
  },
  locationType: 'warehouse',
  allowedDepartmentIds: ['dept_warehouse', 'dept_logistics'],
  address: {
    street: '500 Chrysler Dr',
    city: 'Brampton',
    state: 'ON',
    postalCode: 'L6S 6K2',
    country: 'CA',
  },
  gpsTolerance: 75,  // larger tolerance for outdoor GPS
});

// Validate a position against geofences
const validation = await geofenceService.validate({
  employeeId: 'emp_01J7X2K...',
  latitude: 43.6492,
  longitude: -79.3838,
  gpsAccuracy: 8.0,
  ipAddress: '10.0.5.42',
});

console.log('Validation result:', validation.result); // 'pass'
console.log('Matched geofence:', validation.matchedGeofence?.name); // 'Toronto Headquarters'
console.log('Distance from center:', validation.distanceMeters, 'm'); // 28.5
console.log('IP match:', validation.ipMatch); // true
console.log('WiFi match:', validation.wifiMatch); // null (not checked on this request)

// List all active geofences
const fences = await geofenceService.list({ isActive: true });
console.log(`Active geofences: ${fences.length}`);
for (const f of fences) {
  console.log(`  ${f.name} (${f.locationType}) — ${f.radiusMeters}m radius`);
}

// Get geofence activity logs
const logs = await geofenceService.getLogs({
  geofenceId: officeGeofence.id,
  startDate: '2026-01-20',
  endDate: '2026-01-20',
});

console.log('Today\'s geofence activity:');
for (const log of logs) {
  console.log(
    `  ${log.createdAt} — Employee ${log.employeeId}: ` +
    `${log.validationResult} (${log.distanceFromCenter}m from center)`
  );
}
```

### 8 — Attendance Analytics Dashboard

```typescript
import { AttendanceAnalytics } from '@mcv/people/time';
import { inject } from '@mcv/platform/di';

const analytics = inject(AttendanceAnalytics);

// Get comprehensive attendance analytics for a department
const report = await analytics.getAttendanceAnalytics({
  departmentId: 'dept_engineering',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  groupBy: 'week',
});

console.log('=== Attendance Analytics: Engineering — January 2026 ===');
console.log();

// Overall metrics
console.log('Attendance Rate:', `${report.attendanceRate}%`);
console.log('Punctuality Rate:', `${report.punctualityRate}%`);
console.log('Avg Hours/Day:', report.avgHoursPerDay);
console.log('Total Overtime Hours:', report.totalOvertimeHours);
console.log('Absenteeism Rate:', `${report.absenteeismRate}%`);

// Weekly breakdown
console.log('\nWeekly Breakdown:');
for (const week of report.weeklyBreakdown) {
  console.log(
    `  Week of ${week.weekStart}: ` +
    `${week.attendanceRate}% attendance, ` +
    `${week.totalHours}h worked, ` +
    `${week.overtimeHours}h OT`
  );
}

// Top tardiness offenders (for management attention)
console.log('\nTardiness Leaders (highest tardy count):');
for (const emp of report.tardinessByEmployee.slice(0, 5)) {
  console.log(
    `  ${emp.employeeName}: ${emp.tardyCount} times ` +
    `(avg ${emp.avgMinutesLate} min late)`
  );
}

// Overtime trend analysis
const overtimeTrends = await analytics.getOvertimeTrends({
  departmentId: 'dept_engineering',
  startDate: '2025-10-01',
  endDate: '2026-01-31',
  groupBy: 'month',
});

console.log('\nOvertime Trends (last 4 months):');
for (const month of overtimeTrends) {
  const bar = '█'.repeat(Math.round(month.overtimeHours / 10));
  console.log(
    `  ${month.period}: ${month.overtimeHours}h OT ` +
    `($${month.estimatedCost}) ${bar}`
  );
}

// Punctuality scores (for individual performance reviews)
const scores = await analytics.getPunctualityScores({
  departmentId: 'dept_engineering',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
});

console.log('\nPunctuality Scores:');
for (const score of scores) {
  const emoji = score.score >= 95 ? '🟢' : score.score >= 85 ? '🟡' : '🔴';
  console.log(
    `  ${emoji} ${score.employeeName}: ${score.score}/100 ` +
    `(${score.onTimeCount}/${score.totalScheduled} on-time)`
  );
}

// Labor cost analysis
const laborCost = await analytics.getLaborCostAnalysis({
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  groupBy: 'department',
});

console.log('\nLabor Cost by Department:');
for (const dept of laborCost.departments) {
  console.log(
    `  ${dept.departmentName}: $${dept.totalCost.toLocaleString()} ` +
    `(reg: $${dept.regularCost.toLocaleString()}, ` +
    `OT: $${dept.overtimeCost.toLocaleString()}, ` +
    `DT: $${dept.doubleTimeCost.toLocaleString()})`
  );
}
console.log(`  TOTAL: $${laborCost.grandTotal.toLocaleString()}`);

// Absenteeism pattern detection
const patterns = await analytics.getAbsenteeismPatterns({
  startDate: '2025-07-01',
  endDate: '2026-01-31',
});

console.log('\nAbsenteeism Patterns Detected:');
for (const pattern of patterns) {
  console.log(
    `  ⚠️ ${pattern.employeeName}: ${pattern.patternType} — ${pattern.description}`
  );
  // e.g., "Friday pattern — 6 of 8 absences were on Fridays"
  // e.g., "Increasing trend — absences doubled in last 3 months"
}
```

---

## Error Codes

All errors are thrown as `PeopleTimeError` extending the platform `AppError` base class. Error codes are prefixed with `PTIME_`.

| Code | HTTP | Description | Resolution |
|---|---|---|---|
| `PTIME_CLOCK_001` | 400 | Employee is already clocked in | Clock out before clocking in again |
| `PTIME_CLOCK_002` | 400 | Employee is not clocked in | Cannot clock out when not clocked in |
| `PTIME_CLOCK_003` | 400 | Clock-in too early before scheduled shift | Wait until allowed early clock-in window |
| `PTIME_CLOCK_004` | 400 | Clock-in outside allowed hours | Check active hours for the location |
| `PTIME_CLOCK_005` | 400 | Duplicate punch detected (within 2 min window) | Ignore — previous clock event is valid |
| `PTIME_CLOCK_006` | 400 | Maximum shift duration exceeded | Auto-clock-out triggered; verify hours |
| `PTIME_GEO_001` | 403 | Employee outside all allowed geofences | Must be within a registered location to clock in |
| `PTIME_GEO_002` | 403 | IP address not in allowed range | Connect to authorized network |
| `PTIME_GEO_003` | 400 | GPS coordinates missing (geofence required) | Enable location services on device |
| `PTIME_GEO_004` | 400 | GPS accuracy too low (> configured threshold) | Move to area with better GPS signal |
| `PTIME_GEO_005` | 400 | Geofence not found | Verify geofence ID exists and is active |
| `PTIME_BRK_001` | 400 | Employee already on break | End current break before starting a new one |
| `PTIME_BRK_002` | 400 | Employee not on break | Cannot end a break that hasn't started |
| `PTIME_BRK_003` | 409 | Break waiver not allowed in this jurisdiction | Jurisdiction requires mandatory breaks; waiver not permitted |
| `PTIME_BRK_004` | 400 | Break type not valid for this shift | Check allowed break types for shift policy |
| `PTIME_OT_001` | 400 | No attendance records found for pay period | Verify employee has clock events in the date range |
| `PTIME_OT_002` | 400 | Overtime rules not configured for jurisdiction | Configure overtime rules for the employee's work location |
| `PTIME_OT_003` | 409 | Overtime calculation already locked for this period | Period has been exported; use retroactive correction |
| `PTIME_EXC_001` | 404 | Exception not found | Verify exception ID |
| `PTIME_EXC_002` | 409 | Exception already resolved | Cannot modify a resolved exception |
| `PTIME_EXC_003` | 403 | Not authorized to resolve this exception | Must be the assigned manager or have payroll admin role |
| `PTIME_EXC_004` | 400 | Correction creates new exception | The correction would cause another anomaly — review |
| `PTIME_PAY_001` | 400 | Pay period has unresolved blocking exceptions | Resolve all blocking exceptions before export |
| `PTIME_PAY_002` | 400 | Pay period has unapproved timecards | All timecards must be approved before export |
| `PTIME_PAY_003` | 409 | Pay period already exported | Use retroactive correction for changes |
| `PTIME_PAY_004` | 409 | Pay period is locked | Contact payroll administrator to unlock |
| `PTIME_PAY_005` | 502 | Payroll provider integration error | Check external system status; retry |
| `PTIME_MINOR_001` | 403 | Minor employee exceeds daily hour limit | Minor cannot work more than configured daily maximum |
| `PTIME_MINOR_002` | 403 | Minor employee outside allowed work hours | Minors cannot clock in before/after configured times |
| `PTIME_MINOR_003` | 403 | Minor employee assigned to prohibited job | This job code is restricted for minor employees |
| `PTIME_POL_001` | 404 | Attendance policy not found | Verify policy ID and tenant |
| `PTIME_POL_002` | 409 | Conflicting policies for employee | Employee matches multiple active policies — resolve overlap |
| `PTIME_AUTH_001` | 403 | Insufficient permissions for this operation | Requires specific RBAC permission |
| `PTIME_AUTH_002` | 403 | Cannot modify locked timecard | Contact manager or payroll admin to unlock |

---

## Security

### Row-Level Security

All tables in the `people_time` schema are protected by PostgreSQL RLS policies:

```
┌─────────────────────────────────────────────────────────────┐
│                   RLS POLICY LAYERS                          │
│                                                             │
│  Layer 1: Tenant Isolation                                  │
│  ├── Every query filtered by tenant_id                      │
│  ├── Set via app.current_tenant_id session variable         │
│  └── Cannot access other tenants' data                      │
│                                                             │
│  Layer 2: Role-Based Access                                 │
│  ├── Employees: read own records only                       │
│  ├── Managers: read direct reports' records                 │
│  ├── HR Admin: read/write department records                │
│  ├── Payroll Admin: read/write/export all records           │
│  └── System Admin: full access                              │
│                                                             │
│  Layer 3: Operation-Specific                                │
│  ├── Clock events: INSERT only for self (except manual)     │
│  ├── Attendance records: UPDATE only by manager+             │
│  ├── Payroll exports: CREATE/APPROVE by payroll roles       │
│  └── Geofences: CRUD by HR admin+                           │
└─────────────────────────────────────────────────────────────┘
```

### Clock Event Integrity

Clock events are designed to be **append-only** with high integrity:

- **No deletion** — Clock events are never deleted. Invalid events are flagged with `validated: false` and linked to an exception.
- **No direct updates** — Corrections are applied through the exception resolution workflow, which creates audit-trail entries.
- **Timestamp validation** — Server timestamp is always recorded alongside client timestamp. Drift > 5 minutes triggers a warning.
- **Device fingerprinting** — Mobile and kiosk sources include device identifiers to detect proxy clock-ins.
- **Photo verification** — Kiosk terminals can capture photos for facial comparison (stored encrypted in S3).
- **Biometric verification** — Supports fingerprint, facial recognition, iris, and palm-print verification via terminal integrations.
- **Rate limiting** — Maximum one clock event per employee per 2-minute window to prevent accidental duplicates.

### Geofence Security

- **GPS spoofing detection** — Sudden location jumps (> 100 km/h travel speed between events) are flagged.
- **Accuracy threshold** — GPS readings with accuracy worse than the configured threshold are rejected.
- **Multi-factor location** — Combines GPS, IP range, and WiFi SSID matching for high-confidence location verification.
- **PostGIS server-side** — All geofence boundary calculations happen server-side in PostgreSQL, not on the client device.

### Audit Trail

Every modification to attendance data is recorded in the platform audit log:

```typescript
// Audit events emitted by this module
type PeopleTimeAuditEvent =
  | 'people.time.clock_in'
  | 'people.time.clock_out'
  | 'people.time.break_start'
  | 'people.time.break_end'
  | 'people.time.manual_entry'
  | 'people.time.timecard_approved'
  | 'people.time.timecard_rejected'
  | 'people.time.exception_resolved'
  | 'people.time.exception_dismissed'
  | 'people.time.attendance_corrected'
  | 'people.time.payroll_exported'
  | 'people.time.payroll_approved'
  | 'people.time.period_locked'
  | 'people.time.period_unlocked'
  | 'people.time.geofence_created'
  | 'people.time.geofence_updated'
  | 'people.time.geofence_deactivated'
  | 'people.time.policy_created'
  | 'people.time.policy_updated'
  | 'people.time.retroactive_correction';
```

Each audit entry includes: actor, timestamp, tenant, target entity, old values, new values, IP address, and session ID.

### RBAC Permissions

| Permission | Description | Default Roles |
|---|---|---|
| `people.time.clock.self` | Clock in/out for self | All employees |
| `people.time.clock.others` | Clock in/out on behalf of others | HR Admin, System Admin |
| `people.time.attendance.read.self` | View own attendance | All employees |
| `people.time.attendance.read.reports` | View direct reports' attendance | Managers |
| `people.time.attendance.read.department` | View department attendance | HR Admin |
| `people.time.attendance.read.all` | View all attendance | Payroll Admin, System Admin |
| `people.time.attendance.approve` | Approve/reject timecards | Managers, HR Admin |
| `people.time.attendance.correct` | Make timecard corrections | HR Admin, Payroll Admin |
| `people.time.exception.resolve` | Resolve time exceptions | Managers, HR Admin |
| `people.time.overtime.view` | View overtime calculations | Managers, HR Admin, Payroll Admin |
| `people.time.overtime.approve` | Approve overtime | HR Admin, Payroll Admin |
| `people.time.payroll.export` | Generate payroll exports | Payroll Admin |
| `people.time.payroll.approve` | Approve payroll exports | Payroll Director |
| `people.time.payroll.lock` | Lock/unlock pay periods | Payroll Director |
| `people.time.geofence.manage` | Create/edit/deactivate geofences | HR Admin, System Admin |
| `people.time.policy.manage` | Manage attendance policies | HR Admin, System Admin |
| `people.time.analytics.view` | View attendance analytics | Managers, HR Admin |
| `people.time.analytics.export` | Export analytics data | HR Admin, System Admin |
| `people.time.minor.manage` | Manage minor restriction rules | HR Admin, Compliance Officer |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PEOPLE_TIME_SCHEMA` | No | `people_time` | PostgreSQL schema name |
| `PEOPLE_TIME_GEOFENCE_DEFAULT_RADIUS` | No | `150` | Default geofence radius in meters |
| `PEOPLE_TIME_GEOFENCE_GPS_TOLERANCE` | No | `50` | Default GPS tolerance in meters |
| `PEOPLE_TIME_GEOFENCE_MAX_ACCURACY` | No | `100` | Maximum GPS accuracy (meters) before rejection |
| `PEOPLE_TIME_GPS_SPOOF_SPEED_KMH` | No | `200` | Max travel speed (km/h) before spoofing alert |
| `PEOPLE_TIME_CLOCK_DUPLICATE_WINDOW_SEC` | No | `120` | Duplicate punch detection window (seconds) |
| `PEOPLE_TIME_MAX_SHIFT_HOURS` | No | `16` | Default maximum shift duration (hours) |
| `PEOPLE_TIME_ROUNDING_INTERVAL` | No | `15` | Default rounding interval (minutes) |
| `PEOPLE_TIME_ROUNDING_METHOD` | No | `nearest` | Default rounding method |
| `PEOPLE_TIME_TARDY_GRACE_MINUTES` | No | `5` | Default tardy grace period (minutes) |
| `PEOPLE_TIME_EARLY_CLOCK_IN_MINUTES` | No | `15` | Minutes before shift that clock-in is allowed |
| `PEOPLE_TIME_BREAK_REMINDER_MINUTES` | No | `15` | Minutes before break is due to send reminder |
| `PEOPLE_TIME_OVERTIME_DEFAULT_RULE` | No | `flsa_weekly_40` | Default overtime rule set |
| `PEOPLE_TIME_PAYROLL_LOCK_DAYS_AFTER` | No | `3` | Days after period end before auto-lock |
| `PEOPLE_TIME_EXPORT_FORMAT` | No | `csv` | Default payroll export format (`csv`, `json`, `xml`) |
| `PEOPLE_TIME_PHOTO_BUCKET` | No | `mcv-clock-photos` | S3 bucket for kiosk clock-in photos |
| `PEOPLE_TIME_PHOTO_RETENTION_DAYS` | No | `90` | Days to retain clock-in photos |
| `PEOPLE_TIME_BIOMETRIC_TIMEOUT_SEC` | No | `30` | Timeout for biometric verification response |
| `PEOPLE_TIME_MINOR_ENFORCEMENT` | No | `strict` | Minor labor restriction enforcement (`strict`, `warn`, `off`) |
| `PEOPLE_TIME_EXCEPTION_AUTO_RESOLVE` | No | `true` | Auto-resolve trivial exceptions (e.g., duplicates) |
| `PEOPLE_TIME_EXCEPTION_DEADLINE_DAYS` | No | `5` | Days to resolve exceptions before escalation |
| `PEOPLE_TIME_NOTIFICATION_CHANNELS` | No | `email,push` | Channels for break reminders and OT alerts |
| `POSTGIS_ENABLED` | No | `true` | Whether PostGIS extension is available |
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key (server-side only) |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---|---|
| `@mcv/people/core` | Employee records, department hierarchy, employment types |
| `@mcv/people/scheduling` | Scheduled shifts (for variance calculation, tardy detection) |
| `@mcv/people/leave` | Leave records (to mark attendance as `on_leave`) |
| `@mcv/people/payroll` | Payroll processing (receives exported time data) |
| `@mcv/platform/auth` | Authentication, session management, JWT validation |
| `@mcv/platform/tenancy` | Multi-tenant context, tenant_id resolution |
| `@mcv/platform/audit` | Audit log recording for all attendance modifications |
| `@mcv/platform/notifications` | Push notifications, email for break reminders, OT alerts |
| `@mcv/platform/geo` | PostGIS utilities, coordinate validation, distance calculation |
| `@mcv/platform/storage` | S3 integration for clock-in photos |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.30.0` | ORM for schema definition and queries |
| `@trpc/server` | `^10.45.0` | tRPC router definitions |
| `zod` | `^3.22.0` | Input validation schemas |
| `date-fns` | `^3.3.0` | Date arithmetic, timezone handling |
| `date-fns-tz` | `^2.0.0` | Timezone-aware date operations |
| `luxon` | `^3.4.0` | Complex duration and interval calculations |
| `@turf/turf` | `^7.0.0` | GeoJSON operations (client-side geofence preview) |
| `decimal.js` | `^10.4.0` | Precise decimal arithmetic for hour calculations |
| `ioredis` | `^5.3.0` | Redis for real-time clock status caching |
| `bullmq` | `^5.1.0` | Job queue for async attendance processing |
| `csv-stringify` | `^6.4.0` | CSV generation for payroll exports |
| `fast-xml-parser` | `^4.3.0` | XML generation for ADP/Paychex integrations |

### Peer Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | `^2.39.0` | Supabase client (provided by platform) |
| `react` | `^18.2.0` | React hooks (optional, for UI components) |

---

## Testing

### Unit Tests

```bash
# Run all people/time unit tests
pnpm test packages/people/time

# Run specific test suite
pnpm test packages/people/time/src/services/overtime.service.test.ts

# Run with coverage
pnpm test:coverage packages/people/time
```

#### Key Unit Test Suites

| Suite | File | Tests | Description |
|---|---|---|---|
| Clock Service | `clock.service.test.ts` | 42 | Clock in/out validation, duplicate detection, source handling |
| Overtime Engine | `overtime.service.test.ts` | 68 | FLSA weekly, CA daily, consecutive day, holiday, double-time |
| Break Compliance | `break.service.test.ts` | 35 | CA meal/rest, OR breaks, EU breaks, waiver rules, penalties |
| Geofence Validation | `geofence.service.test.ts` | 28 | Radius check, polygon check, IP matching, WiFi matching |
| Exception Resolution | `exception.service.test.ts` | 24 | Missing punch, corrections, bulk resolve, audit trail |
| Payroll Export | `payroll-export.service.test.ts` | 31 | Generation, approval, locking, retroactive corrections |
| Attendance Assembly | `attendance.service.test.ts` | 45 | Record pairing, status detection, tardy/early calculation |
| Policy Evaluation | `policy.service.test.ts` | 22 | Rounding, grace periods, auto-deductions, IP restrictions |
| Minor Restrictions | `minor.service.test.ts` | 18 | Hour limits, time restrictions, break requirements |

#### Overtime Calculation Test Examples

```typescript
describe('OvertimeService', () => {
  describe('FLSA Weekly 40-Hour Rule', () => {
    it('should calculate no overtime for 40-hour week', async () => {
      const records = createWeekRecords([8, 8, 8, 8, 8]); // Mon-Fri, 8h each
      const result = await overtime.calculate({
        employeeId: 'emp_1',
        payPeriodStart: '2026-01-12',
        payPeriodEnd: '2026-01-18',
      });
      expect(result.totalRegularHours).toBe(40);
      expect(result.totalOvertimeHours).toBe(0);
    });

    it('should calculate overtime beyond 40 hours', async () => {
      const records = createWeekRecords([9, 9, 9, 9, 9]); // 45h total
      const result = await overtime.calculate({
        employeeId: 'emp_1',
        payPeriodStart: '2026-01-12',
        payPeriodEnd: '2026-01-18',
      });
      expect(result.totalRegularHours).toBe(40);
      expect(result.totalOvertimeHours).toBe(5);
    });
  });

  describe('California Daily Overtime', () => {
    it('should calculate daily OT after 8 hours', async () => {
      const records = createWeekRecords([10, 8, 8, 8, 6]); // 40h total
      const result = await overtime.calculate({
        employeeId: 'emp_ca',
        payPeriodStart: '2026-01-12',
        payPeriodEnd: '2026-01-18',
      });
      // 40h total but 2h daily OT on Monday
      expect(result.totalRegularHours).toBe(38);
      expect(result.totalOvertimeHours).toBe(2);
    });

    it('should calculate double time after 12 hours', async () => {
      const records = createWeekRecords([14, 8, 8, 8, 2]); // 40h total
      const result = await overtime.calculate({
        employeeId: 'emp_ca',
        payPeriodStart: '2026-01-12',
        payPeriodEnd: '2026-01-18',
      });
      // Monday: 8 reg + 4 OT + 2 DT
      expect(result.totalRegularHours).toBe(34);
      expect(result.totalOvertimeHours).toBe(4);
      expect(result.totalDoubleTimeHours).toBe(2);
    });

    it('should apply 7th consecutive day rule', async () => {
      const records = createWeekRecords([8, 8, 8, 8, 8, 8, 10]); // 7 days
      const result = await overtime.calculate({
        employeeId: 'emp_ca',
        payPeriodStart: '2026-01-12',
        payPeriodEnd: '2026-01-18',
      });
      // Sunday (7th day): first 8h at 1.5x, next 2h at 2.0x
      expect(result.dailyBreakdown[6].isConsecutiveDay).toBe(true);
      expect(result.dailyBreakdown[6].consecutiveDayNumber).toBe(7);
      expect(result.dailyBreakdown[6].overtimeHours).toBe(8); // all at 1.5x
      expect(result.dailyBreakdown[6].doubleTimeHours).toBe(2); // beyond 8h at 2.0x
    });
  });

  describe('Holiday Pay', () => {
    it('should apply holiday multiplier', async () => {
      // Martin Luther King Jr. Day
      const records = createWeekRecords([8, 8, 8, 8, 8]); // Mon is holiday
      mockHolidays(['2026-01-19']); // Monday

      const result = await overtime.calculate({
        employeeId: 'emp_1',
        payPeriodStart: '2026-01-19',
        payPeriodEnd: '2026-01-25',
      });
      expect(result.dailyBreakdown[0].isHoliday).toBe(true);
      expect(result.dailyBreakdown[0].holidayHours).toBe(8);
      expect(result.totalHolidayHours).toBe(8);
    });
  });
});
```

### Integration Tests

```bash
# Run integration tests (requires test database)
pnpm test:integration packages/people/time

# Run with test containers
pnpm test:integration:docker packages/people/time
```

#### Integration Test Coverage

| Test Area | Description |
|---|---|
| Full clock-in/out cycle | End-to-end from API call through DB persistence and record assembly |
| Geofence + PostGIS | Actual PostGIS spatial queries with real coordinates |
| Payroll export pipeline | Full generation → approval → export → lock cycle |
| Exception workflow | Create exception → assign → resolve → recalculate |
| Multi-tenant isolation | Verify RLS prevents cross-tenant data access |
| Concurrent clock events | Race condition testing for simultaneous punches |
| Timezone handling | Clock events across timezone boundaries (DST transitions) |
| Pay period rollover | Attendance records spanning pay period boundaries |

### Compliance Tests

Dedicated test suites for regulatory compliance:

```bash
# Run all compliance tests
pnpm test packages/people/time/src/__tests__/compliance/

# Run jurisdiction-specific
pnpm test packages/people/time/src/__tests__/compliance/flsa.test.ts
pnpm test packages/people/time/src/__tests__/compliance/california.test.ts
pnpm test packages/people/time/src/__tests__/compliance/eu-wtd.test.ts
```

| Suite | Regulations Tested |
|---|---|
| `flsa.test.ts` | FLSA overtime (29 USC §207), recordkeeping (29 USC §211) |
| `california.test.ts` | CA Labor Code §510 (daily OT), §512 (meal breaks), IWC Wage Orders |
| `oregon.test.ts` | OR break laws, ORS 653.261 |
| `washington.test.ts` | WA break laws, WAC 296-126-092 |
| `eu-wtd.test.ts` | EU Working Time Directive 2003/88/EC, rest periods, max weekly hours |
| `minor-labor.test.ts` | FLSA child labor provisions, state-specific minor restrictions |
| `predictive.test.ts` | Seattle, Oregon, NYC predictive scheduling ordinances |

### Performance Benchmarks

```bash
# Run performance benchmarks
pnpm test:bench packages/people/time
```

| Benchmark | Target | Description |
|---|---|---|
| Clock event ingestion | < 100ms p99 | Single clock-in including all validations |
| Geofence validation (10 fences) | < 50ms p99 | PostGIS query against 10 active geofences |
| Geofence validation (100 fences) | < 150ms p99 | PostGIS query against 100 active geofences |
| Attendance assembly (1 day) | < 200ms p99 | Build daily record from clock events |
| Overtime calculation (biweekly) | < 500ms p99 | Full biweekly OT calc for 1 employee |
| Overtime calculation (500 employees) | < 30s | Batch biweekly OT calc for department |
| Payroll export (500 employees) | < 45s | Full export generation with all pay codes |
| Analytics query (monthly) | < 2s | Department-level analytics for 1 month |
| Break compliance scan (1000 shifts) | < 5s | Batch compliance check for all shifts |

---

*This module is part of the [MCV.ONE](https://mcv.one) platform. For questions about time & attendance configuration, see the [People Administration Guide](/docs/guides/people-admin). For payroll integration setup, see [@mcv/people/payroll](/docs/tier-5-domains/people/payroll/MODULE.md).*