# @mcv/people — Package Specification

> **Package:** `@mcv/people`
> **Classification:** PUBLISHABLE
> **Tier:** 5 — Domain Layer
> **Version:** 1.0.0
> **Status:** Active Development
> **Owner:** People & HR Engineering Team
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Purpose & Scope](#purpose--scope)
3. [Module Summary](#module-summary)
4. [Architecture Position](#architecture-position)
5. [Key Interfaces & Types](#key-interfaces--types)
6. [Configuration](#configuration)
7. [Dependencies](#dependencies)
8. [Multi-Tenant Design](#multi-tenant-design)
9. [Security & Compliance](#security--compliance)
10. [Performance](#performance)
11. [Deployment](#deployment)

---

## Overview

`@mcv/people` is the comprehensive Human Capital Management (HCM) domain within the MCV.ONE enterprise platform. It provides a full-spectrum workforce lifecycle management system encompassing employee directory management, organizational structure, recruiting and applicant tracking (ATS), structured onboarding workflows, multi-jurisdiction leave management, time tracking and timesheets, 360° performance management, and a complete Learning Management System (LMS).

As a **PUBLISHABLE** Tier 5 domain package, `@mcv/people` is designed to be a standalone, market-ready HR platform that can be offered to ventures both within and outside the MCV consortium. Every feature is built with multi-tenancy, data isolation, regulatory compliance (GDPR, CCPA, PIPEDA), and enterprise scalability as first-class concerns.

### At a Glance

| Attribute | Value |
|---|---|
| **Submodules** | 8 (directory, hiring, learning, leave, onboarding, org, performance, time) |
| **Database Tables** | 60+ across all submodules |
| **React Hooks** | 18 client-side hooks |
| **React Components** | 25 pre-built UI components |
| **Service Classes** | 8 domain service classes |
| **PII Fields** | 15+ encrypted fields per person record |
| **Supported Jurisdictions** | 8+ countries with jurisdiction-specific policies |
| **Event Types** | 40+ domain events published to Redpanda/Kafka |

---

## Purpose & Scope

### Purpose

`@mcv/people` serves as the **single source of truth for all people data, employment relationships, organizational structures, and workforce lifecycle events** across every venture in the MCV ecosystem. Every person who works for an MCV venture — whether full-time employee, part-time contractor, intern, or advisor — is managed through this system.

From the moment a job requisition is approved through hiring, onboarding, daily time tracking, performance reviews, learning & development, and leave management, every touchpoint is captured, audited, and available for cross-venture workforce analytics.

### Scope — What's Included

- **Employee & Contractor Directory** — Rich profiles with personal details, employment data, skills and certifications, contact information, emergency contacts, and encrypted document attachments
- **Organizational Structure** — Departments, teams, positions, hierarchical and matrix reporting lines, org chart visualization, and headcount planning
- **Applicant Tracking System (ATS)** — Full recruiting pipeline from requisition through job posting, application, interviews, scorecards, offers, and conversion to employee
- **Structured Onboarding** — Template-based checklists, task assignment across stakeholders (HR, IT, manager, buddy, new hire), document collection, equipment provisioning, access requests, and 30/60/90-day milestones
- **Multi-Jurisdiction Leave Management** — PTO policies with country-specific accrual rules, balance tracking, carry-over calculations, public holidays, blackout dates, half-day support, and calendar integration
- **Time Tracking & Timesheets** — Clock-in/out, project-based time allocation, billable/non-billable classification, overtime calculation, timesheet approval workflows, and payroll feed generation
- **Performance Management** — Review cycles (self, manager, peer, 360°), OKR/KPI goal frameworks, continuous feedback, 1-on-1 meeting tracking, PIPs, calibration sessions, and competency frameworks
- **Learning Management System (LMS)** — Course creation and delivery, learning paths, certification tracking, compliance training, skill gap analysis, and training budget management

### Scope — What's Excluded

- **Payroll Processing** — Handled by `@mcv/connectors/payroll` and `@mcv/finance`. People generates payroll feeds but does not calculate wages, deductions, or tax withholdings.
- **Benefits Administration** — Detailed benefits enrollment and management are outside the scope; People stores reference data for offer letters and compensation packages.
- **Physical Access Control** — Badge/keycard access is managed by facility management systems; People provides employee data for integration.
- **Project Management** — Detailed project planning, sprints, and task management are in `@mcv/operations`. People integrates for time tracking project references.
- **Communication** — Email, chat, and notification delivery are handled by `@mcv/fabric` and `@mcv/connectors`. People triggers notifications but does not deliver them.

---

## Module Summary

### 1. Directory (`directory/`)

**Purpose:** Manages the core people registry — the golden record for every employee, contractor, intern, and advisor across all MCV ventures.

| Aspect | Details |
|---|---|
| **Tables** | 6 (`people_persons`, `people_person_profiles`, `people_person_skills`, `people_person_documents`, `people_emergency_contacts`, `people_employment_history`) |
| **Service** | `directoryService` — People CRUD, profile management, skills, documents, bulk import/export, GDPR compliance |
| **Key Features** | Auto-numbering (EMP-000042 / CTR-000042), PII encryption (AES-256), soft delete for GDPR, employment history auto-tracking, skill endorsements, bulk import validation (all-or-nothing), cross-venture isolation via RLS |
| **React Hooks** | `usePeopleDirectory`, `usePersonProfile` |
| **Components** | `PeopleDirectoryTable`, `PersonProfileCard`, `PeopleDashboard` |

**Key Types:**

```typescript
type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'intern' | 'advisor';
type PersonStatus = 'active' | 'inactive' | 'on_leave' | 'terminated' | 'pending';
```

### 2. Hiring (`hiring/`)

**Purpose:** Implements a full Applicant Tracking System (ATS) with customizable hiring pipelines covering the entire recruiting lifecycle.

| Aspect | Details |
|---|---|
| **Tables** | 10 (`people_requisitions`, `people_job_postings`, `people_candidates`, `people_applications`, `people_interviews`, `people_interview_scorecards`, `people_offers`, `people_hiring_pipelines`, `people_hiring_pipeline_stages`, `people_referrals`) |
| **Service** | `hiringService` — Requisitions, job postings, applications, interviews, scorecards, offers, hire conversion, analytics, referrals |
| **Key Features** | Multi-level requisition approval, candidate deduplication, customizable pipelines with auto-actions, scorecard requirements per stage, offer-to-employee atomic conversion, career page API, time-to-fill analytics |
| **React Hooks** | `useRequisitions`, `useApplications`, `useInterviews` |
| **Components** | `RequisitionBoard`, `ApplicationKanban`, `InterviewScheduler`, `ScorecardForm`, `OfferLetterEditor` |

**Key Types:**

```typescript
type RequisitionStatus = 'draft' | 'pending_approval' | 'approved' | 'open' | 'filled' | 'cancelled';
type ApplicationStatus = 'applied' | 'screening' | 'interviewing' | 'offered' | 'hired' | 'rejected';
type OfferStatus = 'draft' | 'pending_approval' | 'sent' | 'accepted' | 'declined' | 'expired';
```

### 3. Learning (`learning/`)

**Purpose:** Provides Learning Management System (LMS) functionality including course management, learning paths, certification tracking, compliance training, and skill gap analysis.

| Aspect | Details |
|---|---|
| **Tables** | 12 (`courses`, `course_modules`, `course_enrollments`, `course_completions`, `learning_paths`, `learning_path_courses`, `certifications`, `person_certifications`, `training_budgets`, `training_budget_allocations`, `skill_gap_analyses`, `compliance_training_requirements`) |
| **Service** | `learningService` — Course CRUD, learning paths, enrollment, completion tracking, certifications, compliance, skill gaps, budgets |
| **Key Features** | SCORM/xAPI compatible content, learning path branching, certification issuance with renewal tracking, compliance deadline enforcement, role-based skill gap analysis, per-person and per-team training budgets, completion analytics |
| **React Hooks** | `useLearningCatalog`, `useEnrollments`, `useCertifications` |
| **Components** | `LearningCatalog`, `CoursePlayer`, `CertificationBadge` |

**Key Types:**

```typescript
type CourseStatus = 'draft' | 'published' | 'archived';
type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'dropped' | 'expired';
type CertificationStatus = 'active' | 'expired' | 'revoked' | 'suspended';
```

### 4. Leave (`leave/`)

**Purpose:** Manages all types of leave across multiple jurisdictions with country-specific policies, complex accrual rules, and multi-level approval workflows.

| Aspect | Details |
|---|---|
| **Tables** | 7 (`people_leave_requests`, `people_leave_policies`, `people_leave_policy_rules`, `people_leave_balances`, `people_leave_accrual_logs`, `people_leave_blockout_dates`, `people_public_holidays`) |
| **Service** | `leaveService` — Leave requests, balance management, accrual processing, policy management, holidays and blackouts, analytics |
| **Key Features** | Multi-jurisdiction policies (US, CA, GB, DE, AU, IN, JP, etc.), tenure-based entitlement tiers, automated accrual with audit trail, carry-over calculations, blackout date enforcement, half-day support, calendar integration, work delegation, team leave calendar |
| **React Hooks** | `useLeaveRequests`, `useLeaveBalances` |
| **Components** | `LeaveCalendar`, `LeaveRequestForm`, `LeaveBalanceWidget` |

**Key Types:**

```typescript
type LeaveType = 'vacation' | 'sick' | 'personal' | 'parental' | 'bereavement' | 'sabbatical' | 'jury_duty' | 'military' | 'unpaid' | 'other';
type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'taken';
```

### 5. Onboarding (`onboarding/`)

**Purpose:** Manages the structured onboarding experience for new hires with template-based checklists, multi-stakeholder task coordination, and milestone tracking.

| Aspect | Details |
|---|---|
| **Tables** | 8 (`people_onboarding_checklists`, `people_onboarding_checklist_items`, `people_onboarding_plans`, `people_onboarding_tasks`, `people_onboarding_documents`, `people_onboarding_equipment`, `people_onboarding_access_requests`, `people_onboarding_milestones`) |
| **Service** | `onboardingService` — Plan creation, task management, document collection, equipment provisioning, access setup, milestones, analytics |
| **Key Features** | Auto-plan generation on hire conversion, pre-start tasks (negative offset days), progress tracking with percentage, overdue detection via cron, buddy assignment, 30/60/90-day milestone scheduling, equipment and access provisioning workflows |
| **React Hooks** | `useOnboarding` |
| **Components** | `OnboardingChecklist`, `OnboardingDashboard` |

**Key Types:**

```typescript
type OnboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
type OnboardingPlanStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';
```

### 6. Org (`org/`)

**Purpose:** Manages organizational structure — departments, teams, positions, and reporting relationships with support for both hierarchical and matrix organizations.

| Aspect | Details |
|---|---|
| **Tables** | 7 (`people_departments`, `people_teams`, `people_positions`, `people_reporting_lines`, `people_org_changes`, `people_headcount_plans`, `people_headcount_plan_lines`) |
| **Service** | `orgService` — Department/team management, positions, reporting lines, org chart, headcount planning, change tracking |
| **Key Features** | Hierarchical department nesting, matrix org support (solid + dotted reporting lines), org chart visualization with recursive traversal, headcount planning with budget validation, auto-computed headcount via triggers, full change audit logging |
| **React Hooks** | `useOrgChart`, `useTeams` |
| **Components** | `OrgChartViewer`, `TeamRoster` |

**Key Types:**

```typescript
type DepartmentType = 'engineering' | 'product' | 'operations' | 'sales' | 'marketing' | 'finance' | 'hr' | 'legal' | 'support';
type ReportingLineType = 'solid' | 'dotted';
```

### 7. Performance (`performance/`)

**Purpose:** Delivers comprehensive performance management including 360° reviews, OKR/KPI goal frameworks, continuous feedback, 1-on-1 tracking, PIPs, calibration sessions, and competency frameworks.

| Aspect | Details |
|---|---|
| **Tables** | 14 (`review_cycles`, `reviews`, `review_questions`, `review_responses`, `goals`, `goal_key_results`, `feedback_entries`, `one_on_ones`, `one_on_one_agenda_items`, `pips`, `pip_milestones`, `calibration_sessions`, `calibration_ratings`, `competency_frameworks`, `competency_levels`) |
| **Service** | `performanceService` — Review cycles, goal management, feedback, 1-on-1s, PIPs, calibration, competencies |
| **Key Features** | Multiple review types (self, manager, peer, upward, 360°), OKR cascading from company to individual, continuous feedback with public/private toggle, PIP creation with milestone tracking, cross-team calibration sessions, role-based competency frameworks with level definitions |
| **React Hooks** | `usePerformanceReviews`, `useGoals`, `useFeedback` |
| **Components** | `ReviewForm`, `GoalTracker`, `FeedbackWall`, `OneOnOneNotes` |

**Key Types:**

```typescript
type ReviewType = 'self' | 'manager' | 'peer' | 'upward' | '360';
type GoalStatus = 'not_started' | 'on_track' | 'at_risk' | 'behind' | 'completed' | 'cancelled';
type GoalType = 'okr' | 'kpi' | 'project' | 'development';
```

### 8. Time (`time/`)

**Purpose:** Tracks time spent on projects, tasks, and general work with timesheet submission, manager approval, overtime calculation, and payroll feed generation.

| Aspect | Details |
|---|---|
| **Tables** | 6 (`people_time_entries`, `people_timesheets`, `people_timesheet_lines`, `people_time_projects`, `people_overtime_rules`, `people_payroll_feeds`) |
| **Service** | `timeService` — Time entries, timesheets, project time, overtime calculation, payroll feeds, analytics |
| **Key Features** | Clock-in/out with timer support, project-based time allocation, billable/non-billable tracking, jurisdiction-specific overtime rules (daily, weekly, double-time), timesheet approval workflow, payroll feed generation in multiple formats (CSV, JSON, ADP, Gusto, Paychex), utilization reporting |
| **React Hooks** | `useTimesheets`, `useTimeEntries` |
| **Components** | `TimesheetGrid`, `TimeTracker` |

**Key Types:**

```typescript
type TimeEntryType = 'regular' | 'overtime' | 'holiday' | 'on_call' | 'travel';
type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'processed';
```

---

## Architecture Position

`@mcv/people` sits at **Tier 5 (Domain Layer)** in the MCV architecture, consuming infrastructure and platform services from lower tiers and exposing people/HR capabilities to higher-tier applications and cross-cutting concerns.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MCV.ONE ARCHITECTURE                             │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  TIER 7 — APPLICATIONS                                            │  │
│  │  Venture apps, admin panels, career portal, self-service portal   │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
│                                      │                                  │
│  ┌───────────────────────────────────┴───────────────────────────────┐  │
│  │  TIER 6 — CROSS-CUTTING                                           │  │
│  │  @mcv/analytics, @mcv/compliance, @mcv/connectors                 │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
│                                      │                                  │
│  ┌───────────────────────────────────┴───────────────────────────────┐  │
│  │  TIER 5 — DOMAIN LAYER                                            │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │  │
│  │  │ @mcv/people  │ │@mcv/finance  │ │@mcv/operations│              │  │
│  │  │ ★ THIS PKG ★ │ │              │ │              │               │  │
│  │  │              │ │              │ │              │               │  │
│  │  │  directory   │ │  accounting  │ │  projects    │               │  │
│  │  │  hiring      │ │  invoicing   │ │  resources   │               │  │
│  │  │  learning    │ │  budgets     │ │  scheduling  │               │  │
│  │  │  leave       │ │  expenses    │ │  assets      │               │  │
│  │  │  onboarding  │ │  payroll     │ │  workflows   │               │  │
│  │  │  org         │ │              │ │              │               │  │
│  │  │  performance │ │              │ │              │               │  │
│  │  │  time        │ │              │ │              │               │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘               │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
│                                      │                                  │
│  ┌───────────────────────────────────┴───────────────────────────────┐  │
│  │  TIER 4 — PLATFORM SERVICES                                       │  │
│  │  @mcv/shared (workflows, scheduling, validation)                  │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
│                                      │                                  │
│  ┌───────────────────────────────────┴───────────────────────────────┐  │
│  │  TIER 3 — INFRASTRUCTURE                                          │  │
│  │  @mcv/fabric (events, audit, notifications, storage)              │  │
│  │  @mcv/identity (auth, users, tenants, RBAC, SSO)                  │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
│                                      │                                  │
│  ┌───────────────────────────────────┴───────────────────────────────┐  │
│  │  TIER 2 — CORE                                                    │  │
│  │  @mcv/kernel (config, logging, DI, base schemas, multi-tenancy)   │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
│                                      │                                  │
│  ┌───────────────────────────────────┴───────────────────────────────┐  │
│  │  TIER 1 — FOUNDATION                                              │  │
│  │  Supabase/PostgreSQL, Redpanda/Kafka, Redis, OpenRouter AI        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Position

```
               ┌──────────────┐
               │  @mcv/kernel  │  Config, logging, base schemas
               └──────┬───────┘
                      │
          ┌───────────┼──────────────┐
          │           │              │
   ┌──────┴───┐ ┌────┴────┐  ┌─────┴─────┐
   │@mcv/     │ │@mcv/    │  │@mcv/      │
   │identity  │ │fabric   │  │shared     │
   │          │ │         │  │           │
   │Users     │ │Events   │  │Workflows  │
   │Auth      │ │Audit    │  │Scheduling │
   │Tenants   │ │Storage  │  │Validation │
   │RBAC      │ │Notifs   │  │           │
   └──────┬───┘ └────┬────┘  └─────┬─────┘
          │          │              │
          └──────────┼──────────────┘
                     │
              ┌──────┴──────┐
              │ @mcv/people │  ← THIS PACKAGE
              │             │
              │  8 modules  │
              │  60+ tables │
              └──────┬──────┘
                     │
       ┌─────────────┼──────────────┐
       │             │              │
┌──────┴───┐  ┌─────┴─────┐  ┌────┴──────┐
│@mcv/     │  │@mcv/      │  │@mcv/      │
│finance   │  │operations │  │analytics  │
│          │  │           │  │           │
│Payroll   │  │Projects   │  │Workforce  │
│Expenses  │  │Resources  │  │Dashboards │
└──────────┘  └───────────┘  └───────────┘
```

---

## Key Interfaces & Types

### Service Interfaces

Each submodule exposes a singleton service class with a well-defined API:

| Service | Class | Key Methods |
|---|---|---|
| **Directory** | `DirectoryService` | `createPerson`, `updatePerson`, `getPerson`, `searchPeople`, `bulkImport`, `bulkExport`, `processDeleteRequest` |
| **Org** | `OrgService` | `createDepartment`, `createTeam`, `setReportingLine`, `getOrgChart`, `createHeadcountPlan` |
| **Hiring** | `HiringService` | `createRequisition`, `createJobPosting`, `submitApplication`, `scheduleInterview`, `createOffer`, `convertToEmployee` |
| **Onboarding** | `OnboardingService` | `createOnboardingPlan`, `completeTask`, `uploadOnboardingDocument`, `requestEquipment`, `requestAccess`, `completeMilestone` |
| **Leave** | `LeaveService` | `createLeaveRequest`, `approveLeaveRequest`, `getLeaveBalances`, `runAccruals`, `processYearEndCarryOver` |
| **Time** | `TimeService` | `createTimeEntry`, `submitTimesheet`, `approveTimesheet`, `calculateOvertime`, `generatePayrollFeed` |
| **Performance** | `PerformanceService` | `createReviewCycle`, `submitReview`, `createGoal`, `submitFeedback`, `createPip`, `runCalibration` |
| **Learning** | `LearningService` | `createCourse`, `enrollInCourse`, `recordCompletion`, `issueCertification`, `analyzeSkillGaps` |

### Core Types

```typescript
// Person — Central entity in the entire system
interface Person {
  id: string;
  ventureId: string;
  userId: string | null;             // Links to @mcv/identity
  employeeNumber: string;            // "EMP-000042"
  firstName: string;
  lastName: string;
  preferredName: string | null;
  email: string;
  employmentType: EmploymentType;
  status: PersonStatus;
  title: string;
  departmentId: string | null;
  teamId: string | null;
  managerId: string | null;
  hireDate: Date;
  country: string;
  jurisdictionCode: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// PaginatedResult — Standard pagination envelope
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  cursor?: string;
}

// OrgChartNode — Recursive org chart structure
interface OrgChartNode {
  person: {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    avatarUrl: string | null;
    employmentType: EmploymentType;
  };
  department: { id: string; name: string; code: string };
  team: { id: string; name: string } | null;
  directReports: OrgChartNode[];
  dottedLineReports: Array<{
    person: OrgChartNode['person'];
    role: string;
  }>;
  metadata: {
    totalReports: number;
    depth: number;
    span: number;
  };
}
```

### Exported Constants

```typescript
export {
  EMPLOYMENT_TYPES,              // All employment type values
  PERSON_STATUSES,               // All person status values
  DEPARTMENT_TYPES,              // Department type catalog
  LEAVE_TYPES,                   // Leave type catalog
  LEAVE_ACCRUAL_FREQUENCIES,     // Accrual frequency options
  DEFAULT_LEAVE_POLICIES,        // Default policies by jurisdiction
  PUBLIC_HOLIDAYS_BY_COUNTRY,    // Public holiday database
  TIME_ENTRY_TYPES,              // Time entry type catalog
  OVERTIME_THRESHOLDS,           // Default overtime thresholds
  REVIEW_TYPES,                  // Performance review type catalog
  RATING_SCALES,                 // Rating scale definitions
  GOAL_TYPES,                    // Goal type catalog
  COMPETENCY_LEVELS,             // Competency level definitions
  APPLICATION_STATUSES,          // ATS application status catalog
  INTERVIEW_TYPES,               // Interview type catalog
  OFFER_STATUSES,                // Offer status catalog
  ONBOARDING_TASK_CATEGORIES,    // Onboarding task category catalog
  COURSE_CATEGORIES,             // Learning course category catalog
  CERTIFICATION_TYPES,           // Certification type catalog
  SUPPORTED_JURISDICTIONS,       // Supported jurisdiction codes
  PII_FIELD_CLASSIFICATIONS,     // PII field classification map
  DATA_RETENTION_DEFAULTS,       // Default retention periods
};
```

### Client-Side Exports

**React Hooks (18):**

| Hook | Module | Purpose |
|---|---|---|
| `usePeopleDirectory` | directory | Search and list employees with filters |
| `usePersonProfile` | directory | Fetch and manage individual person profiles |
| `useOrgChart` | org | Fetch org chart data with lazy-loading |
| `useTeams` | org | List and manage teams |
| `useRequisitions` | hiring | Manage job requisitions |
| `useApplications` | hiring | Track candidate applications |
| `useInterviews` | hiring | Schedule and manage interviews |
| `useOnboarding` | onboarding | Track onboarding plan progress |
| `useLeaveRequests` | leave | Submit and manage leave requests |
| `useLeaveBalances` | leave | View leave balance summaries |
| `useTimesheets` | time | Submit and approve timesheets |
| `useTimeEntries` | time | Log and manage time entries |
| `usePerformanceReviews` | performance | Manage review submissions |
| `useGoals` | performance | Track OKR/KPI goals |
| `useFeedback` | performance | Submit and view feedback |
| `useLearningCatalog` | learning | Browse available courses |
| `useEnrollments` | learning | Track course enrollments |
| `useCertifications` | learning | Manage certifications |

**React Components (25):**

| Component | Module | Purpose |
|---|---|---|
| `PeopleDirectoryTable` | directory | Searchable employee directory with filters |
| `PersonProfileCard` | directory | Employee profile display card |
| `PeopleDashboard` | directory | HR overview dashboard |
| `OrgChartViewer` | org | Interactive org chart visualization |
| `TeamRoster` | org | Team member listing |
| `RequisitionBoard` | hiring | Kanban board for requisitions |
| `ApplicationKanban` | hiring | Pipeline view for applications |
| `InterviewScheduler` | hiring | Calendar-based interview scheduling |
| `ScorecardForm` | hiring | Structured interviewer scorecard |
| `OfferLetterEditor` | hiring | Offer letter composition tool |
| `OnboardingChecklist` | onboarding | Interactive task checklist |
| `OnboardingDashboard` | onboarding | Onboarding progress overview |
| `LeaveCalendar` | leave | Team leave calendar view |
| `LeaveRequestForm` | leave | Leave request submission form |
| `LeaveBalanceWidget` | leave | Balance summary widget |
| `TimesheetGrid` | time | Weekly/biweekly timesheet entry grid |
| `TimeTracker` | time | Live timer with start/stop controls |
| `ReviewForm` | performance | Performance review submission form |
| `GoalTracker` | performance | OKR/KPI goal progress tracker |
| `FeedbackWall` | performance | Team feedback stream |
| `OneOnOneNotes` | performance | 1-on-1 meeting notes editor |
| `LearningCatalog` | learning | Course catalog browser |
| `CoursePlayer` | learning | Course content player |
| `CertificationBadge` | learning | Certification display badge |

---

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|---|---|---|---|
| `PEOPLE_DB_SCHEMA` | Database schema name | `people` | No |
| `PEOPLE_MAX_IMPORT_ROWS` | Maximum rows per bulk import | `5000` | No |
| `PEOPLE_LEAVE_ACCRUAL_CRON` | Cron schedule for leave accrual calculation | `0 1 * * *` (daily 01:00) | No |
| `PEOPLE_TIMESHEET_REMINDER_CRON` | Cron schedule for timesheet submission reminders | `0 9 * * 5` (Fri 09:00) | No |
| `PEOPLE_PAYROLL_FEED_FORMAT` | Default payroll export format | `csv` | No |
| `PEOPLE_REVIEW_CYCLE_REMINDER_DAYS` | Days before review deadline to send reminders | `7` | No |
| `PEOPLE_PII_ENCRYPTION_KEY` | AES-256 encryption key for PII fields | — | **Yes** |
| `PEOPLE_SESSION_TIMEOUT_MINUTES` | Session timeout for sensitive operations | `30` | No |

### Cron Jobs

| Job | Schedule | Description |
|---|---|---|
| `leave-accrual` | Daily 01:00 | Calculate and credit leave accruals based on policy rules |
| `timesheet-reminder` | Friday 09:00 | Remind employees with incomplete timesheets |
| `review-reminder` | Daily 09:00 | Nudge pending review submissions approaching deadline |
| `certification-expiry` | Daily 06:00 | Alert employees/managers of expiring certifications |
| `probation-check` | Daily 08:00 | Flag employees approaching probation end date |
| `headcount-snapshot` | Monthly 1st 02:00 | Snapshot headcount per department for trend analysis |

### Feature Flags

| Flag | Description | Default |
|---|---|---|
| `people.hiring.career_page` | Enable public career page API | `true` |
| `people.hiring.ai_screening` | Enable AI-powered resume screening | `false` |
| `people.learning.scorm` | Enable SCORM content support | `true` |
| `people.performance.calibration` | Enable calibration session features | `true` |
| `people.time.live_timer` | Enable real-time clock-in/out timer | `true` |
| `people.leave.unlimited_pto` | Enable unlimited PTO policy type | `false` |
| `people.directory.ai_search` | Enable AI-powered semantic search | `false` |
| `people.onboarding.ai_buddy_match` | Enable AI-powered buddy matching | `false` |

---

## Dependencies

### Upstream Dependencies (Consumed)

| Package | Tier | What People Uses |
|---|---|---|
| **@mcv/kernel** | 2 | Base configuration, logging infrastructure, dependency injection container, base database schemas (`baseColumns`), multi-tenancy context (`ventureId`), error handling primitives |
| **@mcv/identity** | 3 | User authentication and session management, tenant context for RLS policies, RBAC role definitions (`hr_admin`, `hr_manager`, `department_manager`, `employee`), SSO integration for employee login, user-to-person linkage (`userId` reference) |
| **@mcv/fabric** | 3 | Event bus (Redpanda/Kafka) for publishing domain events, audit logging for all PII access and mutations, notification triggers (email, push, in-app), encrypted document storage for employee files, secrets management for PII encryption keys |
| **@mcv/shared** | 4 | Workflow engine for approval chains (requisition approval, offer approval, leave approval), scheduling service for interview calendar management, input validation schemas (Zod), pagination utilities, date/time utilities |

### Downstream Dependencies (Consumed by)

| Package | Tier | What They Use From People |
|---|---|---|
| **@mcv/finance** | 5 | Payroll feeds from time module, employee compensation data for payroll processing, expense policy enforcement based on department/position |
| **@mcv/operations** | 5 | Employee data for project staffing and resource allocation, time tracking project references, team/department data for resource planning |
| **@mcv/analytics** | 6 | Workforce analytics data (headcount, attrition, time-to-fill, utilization), performance metrics, learning completion rates, leave utilization |
| **@mcv/connectors** | 6 | Email delivery for notifications (offer letters, review reminders, leave approvals), payroll system integration (ADP, Gusto, Paychex), calendar sync for interview scheduling and leave calendars |
| **@mcv/compliance** | 6 | Employment law compliance data, mandatory training completion tracking, data retention policy enforcement, DSAR processing support |

### External System Integrations

| System | Integration Type | Purpose |
|---|---|---|
| **ADP / Gusto / Paychex** | Payroll feed export | Time and attendance data for payroll processing |
| **LinkedIn** | Job posting syndication | Cross-post job postings from career page |
| **Google Workspace / O365** | Calendar sync | Interview scheduling, leave calendar events |
| **Slack / Teams** | Notifications | Real-time notifications for approvals, onboarding tasks |
| **GitHub / Jira** | Time entry linking | Reference external tickets in time entries |
| **Background check services** | Pre-hire verification | Initiate background checks from hiring pipeline |

---

## Multi-Tenant Design

### Venture Isolation

Every table in `@mcv/people` includes a `ventureId` column that participates in Row-Level Security (RLS) policies. Data isolation between ventures is enforced at the database level — not the application level — ensuring no accidental data leakage:

```sql
-- RLS Policy Example (applied to every people_* table)
CREATE POLICY "venture_isolation" ON people_persons
  USING (venture_id = current_setting('app.current_venture_id')::uuid);
```

### Cross-Venture Considerations

- **People in one venture cannot see people in another venture.** The RLS policy filters by `ventureId` from the authenticated session context.
- **Cross-venture analytics** are only available to super-admins through the `@mcv/analytics` package, which aggregates anonymized headcount and workforce metrics.
- **Employee transfers** between ventures create a new person record in the target venture and deactivate the source record, maintaining a cross-reference in employment history.
- **Shared candidate pool** — When enabled, candidates who apply to one venture can be considered for openings in other ventures (with consent), using a consortium-level candidate deduplication strategy.

### Tenant-Specific Configuration

Each venture can customize:

- Leave policies and accrual rules
- Hiring pipeline stages and scorecard criteria
- Onboarding checklist templates
- Performance review cycle cadence
- Overtime rules and payroll feed format
- Position bands and compensation ranges
- Department and team structure

---

## Security & Compliance

### PII Protection

As a PUBLISHABLE package handling Personally Identifiable Information (PII), `@mcv/people` enforces strict data protection controls at every layer:

| Protection | Implementation |
|---|---|
| **Encryption at rest** | All PII fields (`ssn`, `taxId`, `personalEmail`, `personalPhone`, `dateOfBirth`, `salary`, `bankDetails`, `address`) are encrypted using AES-256 via `@mcv/fabric` secrets management |
| **Field-level access control** | RLS policies restrict PII access to HR administrators and the employee themselves. The `people:pii:read` permission is required for decryption |
| **Encryption in transit** | TLS 1.3 for all API communication |
| **Data masking** | Non-production environments use anonymized/masked data. Salary shows as `***`, SSN shows last 4 digits only |
| **Audit trail** | Every read/write to PII fields is logged to `@mcv/fabric` audit events with actor, action, IP, timestamp, before/after state |

### GDPR / CCPA / PIPEDA Compliance

| Requirement | Implementation |
|---|---|
| **Right to access (DSAR)** | `generateDataExport(personId)` produces a complete data export package containing all personal data across all submodules |
| **Right to erasure** | `processDeleteRequest(personId)` performs immediate anonymization across all tables. Soft delete (`isDeleted = true`) followed by PII field erasure |
| **Data portability** | Export in standard JSON/CSV formats via the bulk export API |
| **Consent management** | Data processing consent records tracked per person |
| **Data retention** | Automated data purging after configurable retention periods post-termination (default: 7 years for employment records, 2 years for applicant data) |
| **Data residency** | Jurisdiction-aware storage ensures employee data stays within required geographic boundaries |
| **Breach notification** | Audit logs enable rapid identification of affected records in case of a breach |

### Access Control Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                      RBAC ROLE HIERARCHY                             │
│                                                                      │
│  ┌────────────┐                                                      │
│  │ Super Admin │  Full access across all ventures (MCV consortium)   │
│  └──────┬─────┘                                                      │
│         │                                                            │
│  ┌──────┴─────┐                                                      │
│  │  HR Admin   │  Full people access within venture                  │
│  │             │  PII read/write, salary data, all modules           │
│  └──────┬─────┘                                                      │
│         │                                                            │
│  ┌──────┴─────┐                                                      │
│  │ HR Manager  │  People management within assigned scope            │
│  │             │  Hiring, onboarding, leave approvals                │
│  └──────┬─────┘                                                      │
│         │                                                            │
│  ┌──────┴──────────┐                                                 │
│  │Dept/Team Manager │  Direct/indirect report management             │
│  │                  │  Leave approval, time approval, reviews        │
│  └──────┬───────────┘                                                │
│         │                                                            │
│  ┌──────┴─────┐                                                      │
│  │  Employee   │  Self-service access only                           │
│  │             │  Own profile, leave, time, goals, learning          │
│  └────────────┘                                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Permission Matrix (Key Operations)

| Operation | Employee | Manager | HR Manager | HR Admin |
|---|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| View PII fields | Own only | ❌ | ❌ | ✅ |
| View salary data | Own only | ❌ | Reports | ✅ |
| Edit person record | Limited | ❌ | Reports | ✅ |
| Submit leave request | ✅ | ✅ | ✅ | ✅ |
| Approve leave | ❌ | Reports | Scope | ✅ |
| Submit timesheet | ✅ | ✅ | ✅ | ✅ |
| Approve timesheet | ❌ | Reports | Scope | ✅ |
| Create requisition | ❌ | ✅ | ✅ | ✅ |
| View applications | ❌ | Own reqs | All | ✅ |
| Submit review | ✅ | ✅ | ✅ | ✅ |
| View team reviews | ❌ | Reports | Scope | ✅ |
| Create course | ❌ | ❌ | ✅ | ✅ |
| Enroll in course | ✅ | ✅ | ✅ | ✅ |
| Generate payroll feed | ❌ | ❌ | ❌ | ✅ |
| Process DSAR | ❌ | ❌ | ❌ | ✅ |

---

## Performance

### Performance Targets

| Metric | Target | Strategy |
|---|---|---|
| Directory search | < 100ms | PostgreSQL full-text search with GIN indexes on `firstName`, `lastName`, `email`, `title` |
| Org chart render | < 500ms | Materialized closure table for hierarchies, lazy-loading beyond depth 3 |
| Leave balance calculation | < 200ms | Pre-computed balances with event-sourced accruals, no recalculation on read |
| Timesheet queries | < 150ms | Partitioned by period, indexed by `personId` + `status` |
| Review cycle load | < 300ms | Cursor-based pagination, partial loading of review responses |
| Bulk import (1,000 records) | < 30s | Batch insert with streaming CSV parser, parallel validation |
| Career page listings | < 100ms | Cached with Redis, 5-minute TTL |
| Payroll feed generation | < 60s | Background job with progress tracking |

### Optimization Strategies

- **Read replicas** for reporting-heavy queries (payroll analytics, workforce dashboards, time utilization reports)
- **Materialized views** for org chart and headcount rollups, refreshed on structural changes
- **Background jobs** for bulk operations (import, payroll feed generation, year-end carry-over)
- **Partition time-series data** (time entries, leave accrual logs) by quarter for efficient range queries
- **Redis caching** for frequently-accessed immutable data (public holidays, leave policies, org chart snapshots)
- **Cursor-based pagination** throughout all list endpoints for consistent performance at scale
- **Database connection pooling** via Supabase's built-in PgBouncer for high-concurrency workloads

### Index Strategy

```sql
-- Directory search (full-text)
CREATE INDEX idx_people_persons_search ON people_persons
  USING GIN (to_tsvector('english', first_name || ' ' || last_name || ' ' || email || ' ' || title));

-- Venture + status filtering
CREATE INDEX idx_people_persons_venture_status ON people_persons (venture_id, status);

-- Manager lookups (for org chart, approvals)
CREATE INDEX idx_people_persons_manager ON people_persons (manager_id) WHERE manager_id IS NOT NULL;

-- Leave balance lookups
CREATE INDEX idx_leave_balances_person_year ON people_leave_balances (person_id, year, leave_type);

-- Time entry range queries
CREATE INDEX idx_time_entries_person_date ON people_time_entries (person_id, date);

-- Application pipeline queries
CREATE INDEX idx_applications_req_status ON people_applications (requisition_id, status);
```

---

## Deployment

### Package Structure

```
packages/people/
├── src/
│   ├── index.ts                    # Package entry point (all exports)
│   ├── constants.ts                # Shared constants
│   ├── types.ts                    # Shared type definitions
│   ├── directory/
│   │   ├── schema.ts               # Drizzle ORM schema
│   │   ├── service.ts              # DirectoryService class
│   │   └── __tests__/              # Unit & integration tests
│   ├── org/
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── __tests__/
│   ├── hiring/
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── __tests__/
│   ├── onboarding/
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── __tests__/
│   ├── leave/
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── __tests__/
│   ├── time/
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── __tests__/
│   ├── performance/
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── __tests__/
│   ├── learning/
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── __tests__/
│   └── client/
│       ├── hooks/                   # 18 React hooks
│       └── components/              # 25 React components
├── drizzle/
│   └── migrations/                  # Database migration files
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Migration Strategy

Database migrations are managed via Drizzle Kit and applied during the CI/CD pipeline:

1. **Schema changes** are defined in `*/schema.ts` files
2. **Migration generation**: `drizzle-kit generate:pg` creates migration SQL files
3. **Migration application**: Migrations run in the deployment pipeline before the application starts
4. **Rollback**: Each migration includes a rollback script for emergency reversions
5. **RLS policies** are applied as part of the migration and validated in integration tests

### Deployment Checklist

- [ ] `PEOPLE_PII_ENCRYPTION_KEY` secret is set in the environment
- [ ] Database migrations have been applied
- [ ] RLS policies are verified for all 60+ tables
- [ ] Cron jobs are registered (leave accrual, timesheet reminders, review reminders, certification expiry, probation check, headcount snapshot)
- [ ] Redis cache is available for career page and org chart caching
- [ ] Event bus (Redpanda) topics are created for people domain events
- [ ] Feature flags are configured per venture
- [ ] Public holiday data is seeded for supported jurisdictions
- [ ] Default leave policies are seeded for each venture
- [ ] Default onboarding checklists are created
- [ ] Default hiring pipeline is configured

### Health Checks

```typescript
// Exposed at /api/people/health
{
  status: 'healthy',
  version: '1.0.0',
  database: { connected: true, migrationVersion: '20260209_001' },
  cache: { connected: true },
  eventBus: { connected: true },
  encryption: { configured: true },
  submodules: {
    directory: 'ok',
    org: 'ok',
    hiring: 'ok',
    onboarding: 'ok',
    leave: 'ok',
    time: 'ok',
    performance: 'ok',
    learning: 'ok',
  }
}
```

---

## Error Codes

| Code | Name | Description | HTTP |
|---|---|---|---|
| `PPL_001` | `PERSON_NOT_FOUND` | Person record does not exist | 404 |
| `PPL_002` | `DUPLICATE_EMAIL` | Email already registered in tenant | 409 |
| `PPL_003` | `INVALID_REPORTING_LINE` | Circular reporting line detected | 400 |
| `PPL_004` | `LEAVE_INSUFFICIENT_BALANCE` | Not enough leave balance | 400 |
| `PPL_005` | `LEAVE_OVERLAP` | Leave request overlaps existing approved leave | 409 |
| `PPL_006` | `TIMESHEET_ALREADY_SUBMITTED` | Cannot edit a submitted timesheet | 409 |
| `PPL_007` | `TIMESHEET_APPROVAL_DENIED` | Approver lacks permission for this timesheet | 403 |
| `PPL_008` | `REVIEW_CYCLE_CLOSED` | Cannot submit review for closed cycle | 400 |
| `PPL_009` | `HIRING_PIPELINE_FULL` | Requisition candidate limit reached | 400 |
| `PPL_010` | `ONBOARDING_TASK_DEPENDENCY` | Dependent task not yet completed | 400 |
| `PPL_011` | `IMPORT_VALIDATION_FAILED` | Bulk import has validation errors | 422 |
| `PPL_012` | `PAYROLL_FEED_LOCKED` | Payroll feed already confirmed | 409 |
| `PPL_013` | `ORG_DEPTH_EXCEEDED` | Org hierarchy exceeds max depth | 400 |
| `PPL_014` | `CERTIFICATION_EXPIRED` | Required certification has expired | 400 |
| `PPL_015` | `PII_DECRYPTION_FAILED` | Cannot decrypt PII field | 500 |

---

*@mcv/people — People & HR Management Domain*
