# @mcv/people — People Domain Module

**Parent Package:** @mcv/people  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Purpose

The `people` module provides a comprehensive human capital management (HCM) system for ventures operating within the MCV ecosystem. It implements a full employee/contractor directory with rich profiles and skills tracking, organizational structure management with matrix support, end-to-end recruiting pipelines (ATS), structured onboarding workflows, multi-jurisdiction leave management with country-specific accrual rules, time tracking with billable/non-billable allocation, 360° performance reviews with OKR/KPI goal frameworks, and a learning management system (LMS) with certification tracking.

**This is the single source of truth for all people data, employment relationships, organizational structures, and workforce lifecycle events across every venture.**

Every person who works for an MCV venture — whether full-time employee, part-time contractor, intern, or advisor — is managed through this system. From the moment a job requisition is approved, through hiring, onboarding, daily time tracking, performance reviews, learning & development, and leave management, every touchpoint is captured here, audited, and available for cross-venture workforce analytics.

### PII and Compliance

As a PUBLISHABLE package handling Personally Identifiable Information (PII), this module enforces strict data protection controls:

- **Encryption at rest**: All PII fields (SSN, bank details, medical records) are encrypted using AES-256 via `@mcv/fabric` secrets management
- **Field-level access control**: RLS policies restrict PII access to HR administrators and the employee themselves
- **GDPR/CCPA compliance**: Built-in data subject access requests (DSAR), right to deletion, data portability exports
- **Audit trail**: Every read/write to PII fields is logged to `@mcv/fabric` audit events
- **Data residency**: Jurisdiction-aware storage ensures employee data stays within required geographic boundaries
- **Retention policies**: Automated data purging after configurable retention periods post-termination

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// DIRECTORY
// ═══════════════════════════════════════════════════════════════════════════════

// Core services
export {
  directoryService,                // Employee/contractor directory operations
} from './directory/service';

export type {
  CreatePersonInput,               // Create a new person record
  UpdatePersonInput,               // Update person details
  PersonSearchFilters,             // Search/filter criteria
  BulkImportInput,                 // Bulk import payload
  BulkImportResult,                // Import results with errors
} from './directory/service';

// Schema exports
export {
  people,                          // Core people table
  personProfiles,                  // Extended profile data
  personSkills,                    // Skills & certifications
  personDocuments,                 // Document attachments (encrypted)
  personEmergencyContacts,         // Emergency contact info
  personEmploymentHistory,         // Employment history records
  employmentTypeEnum,              // full_time | part_time | contractor | intern | advisor
  personStatusEnum,                // active | inactive | on_leave | terminated | pending
} from './directory/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// ORG
// ═══════════════════════════════════════════════════════════════════════════════

export {
  orgService,                      // Organizational structure operations
} from './org/service';

export type {
  CreateDepartmentInput,           // Create a department
  CreateTeamInput,                 // Create a team
  OrgChartOptions,                 // Org chart generation options
  HeadcountPlanInput,              // Headcount planning input
} from './org/service';

export {
  departments,                     // Departments table
  teams,                           // Teams table
  positions,                       // Position definitions
  reportingLines,                  // Manager relationships
  orgChanges,                      // Org change audit log
  headcountPlans,                  // Headcount planning
  headcountPlanLines,              // Headcount plan line items
  departmentTypeEnum,              // engineering | product | operations | sales | ...
} from './org/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// HIRING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  hiringService,                   // Recruiting pipeline operations
} from './hiring/service';

export type {
  CreateRequisitionInput,          // Create a job requisition
  CreateJobPostingInput,           // Create a job posting
  CreateApplicationInput,          // Submit an application
  ScheduleInterviewInput,          // Schedule an interview
  ScorecardInput,                  // Interview scorecard
  CreateOfferInput,                // Generate an offer
} from './hiring/service';

export {
  requisitions,                    // Job requisitions (approval-gated)
  jobPostings,                     // Public job postings
  applications,                    // Candidate applications
  candidates,                      // Candidate profiles
  interviews,                      // Interview sessions
  interviewScorecards,             // Interviewer scorecards
  offers,                          // Job offers
  hiringPipelines,                 // Custom pipeline definitions
  hiringPipelineStages,            // Pipeline stage definitions
  referrals,                       // Employee referral tracking
  requisitionStatusEnum,           // draft | pending_approval | approved | open | filled | cancelled
  applicationStatusEnum,           // applied | screening | interviewing | offered | hired | rejected
  offerStatusEnum,                 // draft | pending_approval | sent | accepted | declined | expired
} from './hiring/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  onboardingService,               // Onboarding workflow operations
} from './onboarding/service';

export type {
  CreateOnboardingPlanInput,       // Create an onboarding plan
  OnboardingTaskInput,             // Individual task definition
  OnboardingChecklistInput,        // Checklist template
} from './onboarding/service';

export {
  onboardingPlans,                 // Onboarding plan instances
  onboardingTasks,                 // Individual onboarding tasks
  onboardingChecklists,            // Reusable checklist templates
  onboardingChecklistItems,        // Checklist template items
  onboardingDocuments,             // Required document collection
  onboardingEquipment,             // Equipment provisioning requests
  onboardingAccessRequests,        // System access setup
  onboardingMilestones,            // 30/60/90 day milestones
  onboardingTaskStatusEnum,        // pending | in_progress | completed | skipped | blocked
  onboardingPlanStatusEnum,        // not_started | in_progress | completed | cancelled
} from './onboarding/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// LEAVE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  leaveService,                    // Leave/PTO management operations
} from './leave/service';

export type {
  CreateLeaveRequestInput,         // Request time off
  CreateLeavePolicyInput,          // Define a leave policy
  LeaveBalanceQuery,               // Query leave balances
  AccrualCalculationInput,         // Calculate accruals
} from './leave/service';

export {
  leaveRequests,                   // Leave request records
  leavePolicies,                   // Leave policy definitions
  leavePolicyRules,                // Per-type accrual/entitlement rules
  leaveBalances,                   // Current leave balances
  leaveAccrualLogs,                // Accrual calculation audit trail
  leaveBlockoutDates,              // Company-wide blackout dates
  publicHolidays,                  // Jurisdiction-specific public holidays
  leaveTypeEnum,                   // vacation | sick | personal | parental | bereavement | ...
  leaveRequestStatusEnum,          // pending | approved | rejected | cancelled | taken
} from './leave/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// TIME
// ═══════════════════════════════════════════════════════════════════════════════

export {
  timeService,                     // Time tracking operations
} from './time/service';

export type {
  CreateTimeEntryInput,            // Log a time entry
  SubmitTimesheetInput,            // Submit a timesheet for approval
  TimesheetApprovalInput,          // Approve/reject a timesheet
  PayrollFeedOptions,              // Generate payroll feed
} from './time/service';

export {
  timeEntries,                     // Individual time entries
  timesheets,                      // Weekly/biweekly timesheet headers
  timesheetLines,                  // Timesheet line items per day
  timeProjects,                    // Project time allocation config
  overtimeRules,                   // Overtime calculation rules
  payrollFeeds,                    // Generated payroll integration feeds
  timesheetStatusEnum,             // draft | submitted | approved | rejected | processed
  timeEntryTypeEnum,               // regular | overtime | holiday | on_call | travel
} from './time/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  performanceService,              // Performance management operations
} from './performance/service';

export type {
  CreateReviewCycleInput,          // Create a review cycle
  CreateGoalInput,                 // Set a goal (OKR/KPI)
  SubmitReviewInput,               // Submit a performance review
  FeedbackInput,                   // Give continuous feedback
  OneOnOneInput,                   // Log a 1-on-1 meeting
  PipInput,                        // Create a PIP
} from './performance/service';

export {
  reviewCycles,                    // Performance review cycles
  reviews,                         // Individual review submissions
  reviewQuestions,                  // Review template questions
  reviewResponses,                 // Individual question responses
  goals,                           // Goals (OKRs / KPIs)
  goalKeyResults,                  // Key results for OKRs
  feedbackEntries,                 // Continuous feedback log
  oneOnOnes,                       // 1-on-1 meeting records
  oneOnOneAgendaItems,             // 1-on-1 agenda items
  pips,                            // Performance improvement plans
  pipMilestones,                   // PIP milestone checkpoints
  calibrationSessions,             // Rating calibration sessions
  calibrationRatings,              // Per-person calibration entries
  competencyFrameworks,            // Competency framework definitions
  competencyLevels,                // Competency level definitions
  reviewTypeEnum,                  // self | manager | peer | upward | 360
  goalStatusEnum,                  // not_started | on_track | at_risk | behind | completed | cancelled
  goalTypeEnum,                    // okr | kpi | project | development
  ratingScaleEnum,                 // 1-5 numeric or exceeds/meets/below
} from './performance/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// LEARNING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  learningService,                 // Learning management operations
} from './learning/service';

export type {
  CreateCourseInput,               // Create a course
  CreateLearningPathInput,         // Create a learning path
  EnrollmentInput,                 // Enroll in a course
  CompletionInput,                 // Record course completion
  CertificationInput,              // Issue a certification
} from './learning/service';

export {
  courses,                         // Course definitions
  courseModules,                    // Course module/lesson structure
  courseEnrollments,                // Enrollment records
  courseCompletions,                // Completion records
  learningPaths,                   // Curated learning paths
  learningPathCourses,             // Courses within a learning path
  certifications,                  // Certification definitions
  personCertifications,            // Issued certifications per person
  trainingBudgets,                 // Per-department/person training budgets
  trainingBudgetAllocations,       // Budget allocation records
  skillGapAnalyses,                // Skill gap analysis records
  complianceTrainingRequirements,  // Mandatory training requirements
  courseStatusEnum,                 // draft | published | archived
  enrollmentStatusEnum,            // enrolled | in_progress | completed | dropped | expired
  certificationStatusEnum,         // active | expired | revoked | suspended
} from './learning/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { usePeopleDirectory } from './client/hooks/use-people-directory';
export { usePersonProfile } from './client/hooks/use-person-profile';
export { useOrgChart } from './client/hooks/use-org-chart';
export { useTeams } from './client/hooks/use-teams';
export { useRequisitions } from './client/hooks/use-requisitions';
export { useApplications } from './client/hooks/use-applications';
export { useInterviews } from './client/hooks/use-interviews';
export { useOnboarding } from './client/hooks/use-onboarding';
export { useLeaveRequests } from './client/hooks/use-leave-requests';
export { useLeaveBalances } from './client/hooks/use-leave-balances';
export { useTimesheets } from './client/hooks/use-timesheets';
export { useTimeEntries } from './client/hooks/use-time-entries';
export { usePerformanceReviews } from './client/hooks/use-performance-reviews';
export { useGoals } from './client/hooks/use-goals';
export { useFeedback } from './client/hooks/use-feedback';
export { useLearningCatalog } from './client/hooks/use-learning-catalog';
export { useEnrollments } from './client/hooks/use-enrollments';
export { useCertifications } from './client/hooks/use-certifications';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { PeopleDirectoryTable } from './client/components/people-directory-table';
export { PersonProfileCard } from './client/components/person-profile-card';
export { OrgChartViewer } from './client/components/org-chart-viewer';
export { TeamRoster } from './client/components/team-roster';
export { RequisitionBoard } from './client/components/requisition-board';
export { ApplicationKanban } from './client/components/application-kanban';
export { InterviewScheduler } from './client/components/interview-scheduler';
export { ScorecardForm } from './client/components/scorecard-form';
export { OfferLetterEditor } from './client/components/offer-letter-editor';
export { OnboardingChecklist } from './client/components/onboarding-checklist';
export { OnboardingDashboard } from './client/components/onboarding-dashboard';
export { LeaveCalendar } from './client/components/leave-calendar';
export { LeaveRequestForm } from './client/components/leave-request-form';
export { LeaveBalanceWidget } from './client/components/leave-balance-widget';
export { TimesheetGrid } from './client/components/timesheet-grid';
export { TimeTracker } from './client/components/time-tracker';
export { ReviewForm } from './client/components/review-form';
export { GoalTracker } from './client/components/goal-tracker';
export { FeedbackWall } from './client/components/feedback-wall';
export { OneOnOneNotes } from './client/components/one-on-one-notes';
export { LearningCatalog } from './client/components/learning-catalog';
export { CoursePlayer } from './client/components/course-player';
export { CertificationBadge } from './client/components/certification-badge';
export { PeopleDashboard } from './client/components/people-dashboard';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  EMPLOYMENT_TYPES,
  PERSON_STATUSES,
  DEPARTMENT_TYPES,
  LEAVE_TYPES,
  LEAVE_ACCRUAL_FREQUENCIES,
  DEFAULT_LEAVE_POLICIES,
  PUBLIC_HOLIDAYS_BY_COUNTRY,
  TIME_ENTRY_TYPES,
  OVERTIME_THRESHOLDS,
  REVIEW_TYPES,
  RATING_SCALES,
  GOAL_TYPES,
  COMPETENCY_LEVELS,
  APPLICATION_STATUSES,
  INTERVIEW_TYPES,
  OFFER_STATUSES,
  ONBOARDING_TASK_CATEGORIES,
  COURSE_CATEGORIES,
  CERTIFICATION_TYPES,
  SUPPORTED_JURISDICTIONS,
  PII_FIELD_CLASSIFICATIONS,
  DATA_RETENTION_DEFAULTS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Directory types
  EmploymentType,
  PersonStatus,
  PersonRole,
  SkillLevel,
  DocumentType,
  EmergencyContactRelation,

  // Org types
  DepartmentType,
  TeamType,
  PositionLevel,
  ReportingLineType,
  OrgChangeType,

  // Hiring types
  RequisitionStatus,
  ApplicationStatus,
  InterviewType,
  InterviewFormat,
  ScorecardRating,
  OfferStatus,
  HiringStage,

  // Onboarding types
  OnboardingTaskStatus,
  OnboardingPlanStatus,
  OnboardingTaskCategory,
  EquipmentType,
  AccessLevel,

  // Leave types
  LeaveType,
  LeaveRequestStatus,
  AccrualFrequency,
  AccrualMethod,
  LeavePolicy,
  JurisdictionCode,

  // Time types
  TimeEntryType,
  TimesheetStatus,
  TimesheetPeriod,
  OvertimeRule,
  PayrollFeedFormat,

  // Performance types
  ReviewType,
  ReviewCycleStatus,
  GoalStatus,
  GoalType,
  RatingScale,
  CalibrationStatus,
  PipStatus,
  CompetencyLevel,

  // Learning types
  CourseStatus,
  EnrollmentStatus,
  CertificationStatus,
  LearningPathStatus,
  ComplianceRequirementType,
  SkillGapSeverity,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             @mcv/people — PEOPLE DOMAIN ARCHITECTURE                              │
│                                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              ENTRY POINTS                                                  │   │
│  │                                                                                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │   │
│  │  │  API Routes  │  │  Cron Jobs   │  │  Webhooks    │  │ NAOS Agents  │  │  Career     │ │   │
│  │  │ /api/people  │  │  Accruals    │  │ ATS inbound  │  │  HR Agent    │  │  Portal     │ │   │
│  │  │ /api/hiring  │  │  Reviews     │  │ Background   │  │  Recruiter   │  │  /careers   │ │   │
│  │  │ /api/time    │  │  Reminders   │  │ Checks       │  │  Manager     │  │             │ │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │   │
│  │         │                 │                  │                 │                  │         │   │
│  │         └─────────────────┴──────────────────┴─────────────────┴──────────────────┘         │   │
│  │                                        │                                                    │   │
│  └────────────────────────────────────────┼────────────────────────────────────────────────────┘   │
│                                           │                                                        │
│  ┌────────────────────────────────────────▼────────────────────────────────────────────────────┐   │
│  │                              SERVICE LAYER                                                  │   │
│  │                                                                                             │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │   DIRECTORY      │  │      ORG         │  │     HIRING       │  │   ONBOARDING     │   │   │
│  │  │                  │  │                  │  │                  │  │                  │   │   │
│  │  │ • People CRUD    │  │ • Departments    │  │ • Requisitions   │  │ • Plan creation  │   │   │
│  │  │ • Profile mgmt   │  │ • Teams          │  │ • Job postings   │  │ • Task tracking  │   │   │
│  │  │ • Skills/certs   │  │ • Positions      │  │ • Applications   │  │ • Doc collection │   │   │
│  │  │ • Contact info   │  │ • Reporting lines│  │ • Interviews     │  │ • Equipment req  │   │   │
│  │  │ • Bulk import    │  │ • Org chart data │  │ • Scorecards     │  │ • Access setup   │   │   │
│  │  │ • Search/filter  │  │ • Headcount plan │  │ • Offers         │  │ • Buddy assign   │   │   │
│  │  │ • PII encryption │  │ • Change tracking│  │ • Career page    │  │ • 30/60/90 plans │   │   │
│  │  │ • Doc storage    │  │ • Matrix orgs    │  │ • Referrals      │  │ • Milestones     │   │   │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │   │
│  │           │                     │                      │                     │              │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │     LEAVE        │  │      TIME        │  │   PERFORMANCE    │  │    LEARNING      │   │   │
│  │  │                  │  │                  │  │                  │  │                  │   │   │
│  │  │ • Leave requests │  │ • Time entries   │  │ • Review cycles  │  │ • Course mgmt    │   │   │
│  │  │ • Policies/rules │  │ • Timesheets     │  │ • Goal setting   │  │ • Learning paths │   │   │
│  │  │ • Accruals       │  │ • Project alloc  │  │ • 360° reviews   │  │ • Enrollments    │   │   │
│  │  │ • Balances       │  │ • Billable track │  │ • Feedback       │  │ • Certifications │   │   │
│  │  │ • Calendar sync  │  │ • Overtime calc  │  │ • 1-on-1s        │  │ • Compliance     │   │   │
│  │  │ • Public holidays│  │ • Approval flows │  │ • PIPs           │  │ • Skill gaps     │   │   │
│  │  │ • Multi-jurisd.  │  │ • Payroll feeds  │  │ • Calibration    │  │ • Budgets        │   │   │
│  │  │ • Blockout dates │  │ • Export/reports  │  │ • Competencies   │  │ • Completions    │   │   │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │   │
│  │           │                     │                      │                     │              │   │
│  └───────────┴─────────────────────┴──────────────────────┴─────────────────────┴──────────────┘   │
│                                           │                                                        │
│  ┌────────────────────────────────────────▼────────────────────────────────────────────────────┐   │
│  │                           PERSON RECORD (Core)                                              │   │
│  │                                                                                             │   │
│  │  Every module in the system references the central person record. Hiring creates candidate  │   │
│  │  records that convert to person records on hire. Onboarding attaches to a person. Leave,    │   │
│  │  time, performance, and learning all key off the person's employment record and org         │   │
│  │  assignments. The directory is the golden record for who works where.                       │   │
│  │                                                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │   │
│  │  │   People     │  │  Profiles    │  │    Skills    │  │  Employment  │                   │   │
│  │  │   (Core)     │  │  (Extended)  │  │  (Certs &    │  │  History     │                   │   │
│  │  │              │  │              │  │   Ratings)   │  │              │                   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘                   │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                           │                                                        │
│  ┌────────────────────────────────────────▼────────────────────────────────────────────────────┐   │
│  │                           DATABASE LAYER (PostgreSQL + RLS)                                  │   │
│  │                                                                                             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │Directory │ │   Org    │ │  Hiring  │ │Onboarding│ │  Leave   │ │   Time   │           │   │
│  │  │ 6 tables │ │ 7 tables │ │10 tables │ │ 8 tables │ │ 7 tables │ │ 6 tables │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  │                                                                                             │   │
│  │  ┌──────────┐ ┌──────────┐                                                                │   │
│  │  │Performnce│ │ Learning │   Total: 60+ tables across 8 submodules                        │   │
│  │  │14 tables │ │12 tables │   All with venture_id scoping + RLS + PII encryption           │   │
│  │  └──────────┘ └──────────┘                                                                │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                           EXTERNAL DEPENDENCIES                                             │   │
│  │                                                                                             │   │
│  │  @mcv/identity         @mcv/fabric            @mcv/connectors        @mcv/shared           │   │
│  │  (Users, auth,         (Notifications,        (Email for notifs,     (Workflows for        │   │
│  │   tenants, RBAC)        events, audit,         payroll integrations,  approval chains,     │   │
│  │                         storage for docs)      calendar sync)         scheduling for       │   │
│  │                                                                       interviews)          │   │
│  │                                                                                             │   │
│  │  DOWNSTREAM CONSUMERS:                                                                     │   │
│  │  @mcv/finance          @mcv/operations         @mcv/analytics                              │   │
│  │  (Payroll feeds,       (Project staffing,     (Workforce analytics,                        │   │
│  │   expense policies)     resource planning)      headcount reporting)                       │   │
│  │                                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Hire → Onboard → Active Employee

```
Requisition Approved
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ hiring        │────▶│ hiring        │────▶│ hiring        │
│               │     │               │     │               │
│ Post job      │     │ Screen apps   │     │ Interview &   │
│ Receive apps  │     │ Move pipeline │     │ Scorecard     │
└───────┬───────┘     └───────────────┘     └───────┬───────┘
        │                                           │
        │                                           ▼
        │                                   ┌───────────────┐
        │                                   │ hiring        │
        │                                   │               │
        │                                   │ Extend offer  │
        │                                   │ Offer accepted│
        │                                   └───────┬───────┘
        │                                           │
        ▼                                           ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ directory     │────▶│ onboarding    │────▶│ org           │
│               │     │               │     │               │
│ Create person │     │ Assign tasks  │     │ Assign to     │
│ record        │     │ Collect docs  │     │ department    │
│ status=pending│     │ Provision IT  │     │ & team        │
└───────────────┘     └───────────────┘     └───────┬───────┘
                                                    │
                              ┌──────────────────────┼───────────────────────┐
                              │                      │                       │
                              ▼                      ▼                       ▼
                      ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
                      │ leave         │     │ time          │     │ performance   │
                      │               │     │               │     │               │
                      │ Initialize    │     │ Enable time   │     │ Add to review │
                      │ leave balances│     │ tracking      │     │ cycle         │
                      │ Apply policy  │     │ Assign proj.  │     │ Set goals     │
                      └───────────────┘     └───────────────┘     └───────────────┘
```

---

## Sub-Module Overview

| Module | Purpose | Tables | Key Operations |
|--------|---------|--------|----------------|
| **directory** | Employee/contractor profiles, skills, documents | 6 | create person, update profile, manage skills, bulk import/export |
| **org** | Departments, teams, positions, org chart, headcount | 7 | create dept/team, assign reporting lines, plan headcount |
| **hiring** | Full ATS — requisitions, postings, applications, interviews, offers | 10 | create requisition, post job, process application, schedule interview, extend offer |
| **onboarding** | New hire workflows, checklists, equipment, access | 8 | create plan, assign tasks, track completion, provision equipment |
| **leave** | PTO, sick, parental — multi-jurisdiction policies | 7 | request leave, approve, calculate accruals, track balances |
| **time** | Time tracking, timesheets, project allocation, payroll feeds | 6 | log time, submit timesheet, approve, generate payroll feed |
| **performance** | Reviews, goals, feedback, 1-on-1s, PIPs, calibration | 14 | create review cycle, set goals, submit reviews, run calibration |
| **learning** | LMS, courses, learning paths, certifications, compliance | 12 | create course, enroll, track completion, issue certification |

---

## Module: directory

### Purpose

Manages the core people registry — the golden record for every employee, contractor, intern, and advisor across all MCV ventures. Each person has a rich profile with personal details, employment data, skills & certifications, contact information, emergency contacts, and document attachments. The directory supports advanced search, filtering, team-based browsing, and bulk import/export for enterprise data migration.

All PII fields are encrypted at rest and access is controlled through field-level RLS policies. Only HR administrators and the person themselves can view sensitive fields like SSN, date of birth, salary, and bank details.

### Database Schema

```typescript
// people_persons — Core People Table
export const people = pgTable('people_persons', {
  ...baseColumns,                                       // id, ventureId, createdAt, updatedAt
  // ── Identity ─────────────────────────────────────────────────────────
  userId: uuid('user_id').references(() => users.id),   // Links to @mcv/identity user (nullable for pre-onboard)
  employeeNumber: text('employee_number').notNull(),    // "EMP-000042" — venture-scoped auto-increment
  firstName: text('first_name').notNull(),
  middleName: text('middle_name'),
  lastName: text('last_name').notNull(),
  preferredName: text('preferred_name'),                // Display name / nickname
  email: text('email').notNull(),                       // Work email
  personalEmail: text('personal_email'),                // Encrypted PII
  phone: text('phone'),                                 // Work phone
  personalPhone: text('personal_phone'),                // Encrypted PII
  avatarUrl: text('avatar_url'),
  pronouns: text('pronouns'),
  dateOfBirth: timestamp('date_of_birth'),              // Encrypted PII
  nationality: text('nationality'),
  ssn: text('ssn'),                                     // Encrypted PII — AES-256
  taxId: text('tax_id'),                                // Encrypted PII

  // ── Employment ───────────────────────────────────────────────────────
  employmentType: employmentTypeEnum('employment_type').notNull(), // full_time | part_time | contractor | intern | advisor
  status: personStatusEnum('status').default('pending'), // pending | active | on_leave | inactive | terminated
  title: text('title').notNull(),                       // Job title
  positionId: uuid('position_id').references(() => positions.id),
  departmentId: uuid('department_id').references(() => departments.id),
  teamId: uuid('team_id').references(() => teams.id),
  managerId: uuid('manager_id').references(() => people.id),
  hireDate: timestamp('hire_date').notNull(),
  startDate: timestamp('start_date'),                   // Actual start date (may differ from hire date)
  terminationDate: timestamp('termination_date'),
  terminationReason: text('termination_reason'),
  probationEndDate: timestamp('probation_end_date'),

  // ── Compensation (Encrypted) ─────────────────────────────────────────
  salary: numeric('salary', { precision: 19, scale: 4 }),         // Encrypted PII
  salaryFrequency: text('salary_frequency'),             // annual | monthly | hourly
  currency: text('currency').default('USD'),
  payGrade: text('pay_grade'),
  compensationBand: text('compensation_band'),

  // ── Location & Jurisdiction ──────────────────────────────────────────
  workLocation: text('work_location'),                   // office | remote | hybrid
  officeLocation: text('office_location'),               // "NYC-HQ" | "LON-01"
  timezone: text('timezone').default('America/New_York'),
  country: text('country').notNull(),                    // ISO 3166-1 alpha-2
  stateProvince: text('state_province'),
  city: text('city'),
  address: jsonb('address'),                             // Encrypted PII — full mailing address
  jurisdictionCode: text('jurisdiction_code'),           // For leave/tax policy mapping "US-NY", "CA-ON", "GB"

  // ── Metadata ─────────────────────────────────────────────────────────
  tags: text('tags').array(),
  customFields: jsonb('custom_fields'),                  // Venture-specific fields
  metadata: jsonb('metadata'),
  lastActivityAt: timestamp('last_activity_at'),
  isDeleted: boolean('is_deleted').default(false),       // Soft delete for GDPR
  deletedAt: timestamp('deleted_at'),
  deletionReason: text('deletion_reason'),
});

// people_person_profiles — Extended Profile Data
export const personProfiles = pgTable('people_person_profiles', {
  ...baseColumns,
  personId: uuid('person_id').references(() => people.id).notNull().unique(),
  bio: text('bio'),                                      // Self-written bio
  linkedinUrl: text('linkedin_url'),
  githubUrl: text('github_url'),
  portfolioUrl: text('portfolio_url'),
  languages: jsonb('languages'),                         // [{ language: 'English', proficiency: 'native' }, ...]
  education: jsonb('education'),                         // [{ institution, degree, field, startYear, endYear }]
  previousEmployment: jsonb('previous_employment'),      // [{ company, title, startDate, endDate }]
  interests: text('interests').array(),
  dietaryRestrictions: text('dietary_restrictions'),
  tshirtSize: text('tshirt_size'),
  accessibilityNeeds: text('accessibility_needs'),
  bankDetails: jsonb('bank_details'),                    // Encrypted PII — for payroll
  taxWithholding: jsonb('tax_withholding'),              // Encrypted PII — W-4 / TD1 data
});

// people_person_skills — Skills & Certifications
export const personSkills = pgTable('people_person_skills', {
  ...baseColumns,
  personId: uuid('person_id').references(() => people.id).notNull(),
  skillName: text('skill_name').notNull(),
  skillCategory: text('skill_category'),                 // technical | leadership | domain | language | tool
  proficiencyLevel: integer('proficiency_level'),        // 1-5 scale
  selfAssessed: boolean('self_assessed').default(true),
  endorsedBy: uuid('endorsed_by').references(() => people.id),
  endorsedAt: timestamp('endorsed_at'),
  certificationName: text('certification_name'),
  certificationIssuer: text('certification_issuer'),
  certificationDate: timestamp('certification_date'),
  certificationExpiry: timestamp('certification_expiry'),
  certificationUrl: text('certification_url'),
  verificationStatus: text('verification_status').default('unverified'), // unverified | verified | expired
});

// people_person_documents — Document Attachments (Encrypted Storage)
export const personDocuments = pgTable('people_person_documents', {
  ...baseColumns,
  personId: uuid('person_id').references(() => people.id).notNull(),
  documentType: text('document_type').notNull(),         // contract | id_card | passport | visa | tax_form | offer_letter | nda | ...
  name: text('name').notNull(),
  description: text('description'),
  fileUrl: text('file_url').notNull(),                   // @mcv/fabric storage URL (encrypted at rest)
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size'),                        // bytes
  isConfidential: boolean('is_confidential').default(true),
  expiresAt: timestamp('expires_at'),                    // For visas, certifications, etc.
  uploadedBy: uuid('uploaded_by'),
  verifiedBy: uuid('verified_by'),
  verifiedAt: timestamp('verified_at'),
  metadata: jsonb('metadata'),
});

// people_emergency_contacts — Emergency Contact Info
export const personEmergencyContacts = pgTable('people_emergency_contacts', {
  ...baseColumns,
  personId: uuid('person_id').references(() => people.id).notNull(),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(),          // spouse | parent | sibling | friend | other
  phone: text('phone').notNull(),                        // Encrypted PII
  alternatePhone: text('alternate_phone'),               // Encrypted PII
  email: text('email'),
  address: jsonb('address'),                             // Encrypted PII
  isPrimary: boolean('is_primary').default(false),
  notes: text('notes'),
});

// people_employment_history — Employment Status Changes
export const personEmploymentHistory = pgTable('people_employment_history', {
  ...baseColumns,
  personId: uuid('person_id').references(() => people.id).notNull(),
  eventType: text('event_type').notNull(),               // hired | promoted | transferred | demoted | terminated | rehired | leave_start | leave_end
  effectiveDate: timestamp('effective_date').notNull(),
  previousTitle: text('previous_title'),
  newTitle: text('new_title'),
  previousDepartmentId: uuid('previous_department_id'),
  newDepartmentId: uuid('new_department_id'),
  previousManagerId: uuid('previous_manager_id'),
  newManagerId: uuid('new_manager_id'),
  previousSalary: numeric('previous_salary', { precision: 19, scale: 4 }), // Encrypted PII
  newSalary: numeric('new_salary', { precision: 19, scale: 4 }),           // Encrypted PII
  reason: text('reason'),
  notes: text('notes'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  metadata: jsonb('metadata'),
});
```

### Core Interface

```typescript
export class DirectoryService {
  // ── People CRUD ──────────────────────────────────────────────────────
  createPerson(input: CreatePersonInput): Promise<Person>;
  updatePerson(personId: string, input: UpdatePersonInput): Promise<Person>;
  getPerson(personId: string, options?: { includeProfile?: boolean; includePII?: boolean }): Promise<Person>;
  listPeople(filters?: PersonSearchFilters): Promise<PaginatedResult<Person>>;
  searchPeople(query: string, options?: SearchOptions): Promise<Person[]>;
  deactivatePerson(personId: string, reason: string, terminationDate: Date): Promise<Person>;

  // ── Profile Management ───────────────────────────────────────────────
  updateProfile(personId: string, input: UpdateProfileInput): Promise<PersonProfile>;
  getProfile(personId: string): Promise<PersonProfile>;

  // ── Skills & Certifications ──────────────────────────────────────────
  addSkill(personId: string, input: SkillInput): Promise<PersonSkill>;
  removeSkill(personId: string, skillId: string): Promise<void>;
  endorseSkill(skillId: string, endorserId: string): Promise<PersonSkill>;
  getSkillMatrix(departmentId?: string): Promise<SkillMatrixData>;

  // ── Documents ────────────────────────────────────────────────────────
  uploadDocument(personId: string, input: DocumentInput): Promise<PersonDocument>;
  getDocuments(personId: string, type?: string): Promise<PersonDocument[]>;
  verifyDocument(documentId: string, verifierId: string): Promise<PersonDocument>;
  deleteDocument(documentId: string): Promise<void>;

  // ── Emergency Contacts ───────────────────────────────────────────────
  setEmergencyContacts(personId: string, contacts: EmergencyContactInput[]): Promise<EmergencyContact[]>;

  // ── Bulk Operations ──────────────────────────────────────────────────
  bulkImport(input: BulkImportInput): Promise<BulkImportResult>;
  bulkExport(filters?: PersonSearchFilters, format?: 'csv' | 'xlsx'): Promise<ExportResult>;

  // ── Employment History ───────────────────────────────────────────────
  recordEmploymentEvent(personId: string, event: EmploymentEventInput): Promise<EmploymentHistoryEntry>;
  getEmploymentHistory(personId: string): Promise<EmploymentHistoryEntry[]>;

  // ── GDPR / Compliance ────────────────────────────────────────────────
  generateDataExport(personId: string): Promise<DataExportPackage>;
  processDeleteRequest(personId: string, reason: string): Promise<DeletionResult>;
}
```

### Key Behaviors

1. **Auto-numbering**: Employee numbers follow the pattern `EMP-{sequence}` scoped per venture with zero-padded 6-digit sequences (e.g., `EMP-000042`). Contractors use `CTR-{sequence}`.
2. **PII encryption**: Fields marked as PII (`ssn`, `taxId`, `personalEmail`, `personalPhone`, `dateOfBirth`, `salary`, `bankDetails`, `address`) are encrypted using AES-256 before storage. Decryption requires the `people:pii:read` permission.
3. **Soft delete for GDPR**: `deactivatePerson` sets `isDeleted = true` and schedules PII field erasure after the configured retention period. `processDeleteRequest` performs immediate anonymization.
4. **Employment history auto-tracking**: Any change to `title`, `departmentId`, `managerId`, or `salary` on the person record automatically creates a corresponding entry in `personEmploymentHistory`.
5. **Skill endorsements**: Skills can be self-assessed (1–5 scale) and then endorsed by peers or managers. Endorsed skills carry higher weight in the skill matrix and gap analysis.
6. **Bulk import validation**: CSV/XLSX imports validate all rows against the schema, check for duplicate email addresses, validate jurisdiction codes, and return a detailed error report for any failures without importing partial data (all-or-nothing).
7. **Cross-venture visibility**: People in one venture cannot see people in another venture. The RLS policy filters by `ventureId` from the authenticated session context.

---

## Module: org

### Purpose

Manages the organizational structure — departments, teams, positions, and reporting relationships. Supports both traditional hierarchical structures and matrix organizations where a person can have a primary reporting line and one or more dotted-line (functional) reporting relationships. Provides org chart visualization data, headcount planning for workforce forecasting, and full change tracking for compliance audits.

### Database Schema

```typescript
// people_departments — Department Definitions
export const departments = pgTable('people_departments', {
  ...baseColumns,
  name: text('name').notNull(),
  code: text('code').notNull(),                          // "ENG", "MKT", "FIN"
  description: text('description'),
  type: departmentTypeEnum('type').notNull(),            // engineering | product | operations | sales | marketing | finance | hr | legal | support
  parentDepartmentId: uuid('parent_department_id').references(() => departments.id),
  headId: uuid('head_id').references(() => people.id),   // Department head
  costCenter: text('cost_center'),
  status: text('status').default('active'),              // active | inactive | planned
  headcount: integer('headcount').default(0),            // Current headcount (computed)
  budgetedHeadcount: integer('budgeted_headcount'),      // Approved headcount
  effectiveFrom: timestamp('effective_from'),
  effectiveTo: timestamp('effective_to'),
  metadata: jsonb('metadata'),
});

// people_teams — Team Definitions
export const teams = pgTable('people_teams', {
  ...baseColumns,
  name: text('name').notNull(),
  code: text('code'),
  description: text('description'),
  departmentId: uuid('department_id').references(() => departments.id).notNull(),
  leadId: uuid('lead_id').references(() => people.id),   // Team lead
  type: text('type').default('permanent'),               // permanent | project | virtual | tiger_team
  status: text('status').default('active'),              // active | inactive | forming | disbanded
  maxMembers: integer('max_members'),
  currentMembers: integer('current_members').default(0),
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
});

// people_positions — Position (Role) Definitions
export const positions = pgTable('people_positions', {
  ...baseColumns,
  title: text('title').notNull(),
  code: text('code'),                                    // "SWE-III", "PM-II"
  description: text('description'),
  departmentId: uuid('department_id').references(() => departments.id),
  level: integer('level'),                               // 1-10 seniority level
  band: text('band'),                                    // IC1, IC2, IC3, M1, M2, M3, D1, D2, VP, C
  isManagement: boolean('is_management').default(false),
  minSalary: numeric('min_salary', { precision: 19, scale: 4 }),
  maxSalary: numeric('max_salary', { precision: 19, scale: 4 }),
  currency: text('currency').default('USD'),
  requiredSkills: jsonb('required_skills'),              // [{ skillName: 'TypeScript', minLevel: 3 }]
  requiredCertifications: jsonb('required_certifications'),
  headcount: integer('headcount').default(0),             // How many people hold this position
  budgetedHeadcount: integer('budgeted_headcount'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
});

// people_reporting_lines — Manager Relationships (Supports Matrix)
export const reportingLines = pgTable('people_reporting_lines', {
  ...baseColumns,
  personId: uuid('person_id').references(() => people.id).notNull(),
  managerId: uuid('manager_id').references(() => people.id).notNull(),
  lineType: text('line_type').notNull(),                 // solid | dotted
  isPrimary: boolean('is_primary').default(false),
  role: text('role'),                                    // "functional_manager" | "project_lead" | "mentor"
  effectiveFrom: timestamp('effective_from').notNull(),
  effectiveTo: timestamp('effective_to'),
  notes: text('notes'),
});

// people_org_changes — Org Change Audit Log
export const orgChanges = pgTable('people_org_changes', {
  ...baseColumns,
  changeType: text('change_type').notNull(),             // dept_created | dept_merged | team_created | person_transferred | manager_changed | reorg
  entityType: text('entity_type').notNull(),             // department | team | position | reporting_line
  entityId: uuid('entity_id').notNull(),
  previousState: jsonb('previous_state'),
  newState: jsonb('new_state'),
  reason: text('reason'),
  effectiveDate: timestamp('effective_date').notNull(),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  impactedPersonIds: uuid('impacted_person_ids').array(),
  metadata: jsonb('metadata'),
});

// people_headcount_plans — Headcount Planning
export const headcountPlans = pgTable('people_headcount_plans', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  fiscalYearId: uuid('fiscal_year_id'),
  status: text('status').default('draft'),               // draft | pending_approval | approved | active | closed
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  totalPlannedHires: integer('total_planned_hires').default(0),
  totalPlannedDepartures: integer('total_planned_departures').default(0),
  netHeadcountChange: integer('net_headcount_change').default(0),
  budgetImpact: numeric('budget_impact', { precision: 19, scale: 4 }),
  currency: text('currency').default('USD'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  metadata: jsonb('metadata'),
});

// people_headcount_plan_lines — Individual Line Items
export const headcountPlanLines = pgTable('people_headcount_plan_lines', {
  ...baseColumns,
  headcountPlanId: uuid('headcount_plan_id').references(() => headcountPlans.id).notNull(),
  departmentId: uuid('department_id').references(() => departments.id).notNull(),
  positionId: uuid('position_id').references(() => positions.id),
  action: text('action').notNull(),                      // hire | backfill | eliminate | transfer_in | transfer_out
  quantity: integer('quantity').notNull(),
  targetQuarter: text('target_quarter'),                 // "Q1", "Q2", "Q3", "Q4"
  justification: text('justification'),
  estimatedSalary: numeric('estimated_salary', { precision: 19, scale: 4 }),
  status: text('status').default('planned'),             // planned | approved | in_progress | completed | cancelled
  linkedRequisitionId: uuid('linked_requisition_id'),
  metadata: jsonb('metadata'),
});
```

### Core Interface

```typescript
export class OrgService {
  // ── Departments ──────────────────────────────────────────────────────
  createDepartment(input: CreateDepartmentInput): Promise<Department>;
  updateDepartment(departmentId: string, input: UpdateDepartmentInput): Promise<Department>;
  getDepartment(departmentId: string): Promise<Department>;
  listDepartments(options?: { includeInactive?: boolean; parentId?: string }): Promise<Department[]>;
  mergeDepartments(sourceId: string, targetId: string, reason: string): Promise<Department>;

  // ── Teams ────────────────────────────────────────────────────────────
  createTeam(input: CreateTeamInput): Promise<Team>;
  updateTeam(teamId: string, input: UpdateTeamInput): Promise<Team>;
  addTeamMember(teamId: string, personId: string, role?: string): Promise<void>;
  removeTeamMember(teamId: string, personId: string): Promise<void>;
  getTeamMembers(teamId: string): Promise<Person[]>;

  // ── Positions ────────────────────────────────────────────────────────
  createPosition(input: CreatePositionInput): Promise<Position>;
  updatePosition(positionId: string, input: UpdatePositionInput): Promise<Position>;
  getPositionHolders(positionId: string): Promise<Person[]>;

  // ── Reporting Lines ──────────────────────────────────────────────────
  setReportingLine(input: ReportingLineInput): Promise<ReportingLine>;
  getDirectReports(managerId: string): Promise<Person[]>;
  getReportingChain(personId: string): Promise<Person[]>;

  // ── Org Chart ────────────────────────────────────────────────────────
  getOrgChart(options?: OrgChartOptions): Promise<OrgChartNode>;
  getOrgChartForDepartment(departmentId: string, depth?: number): Promise<OrgChartNode>;

  // ── Headcount Planning ───────────────────────────────────────────────
  createHeadcountPlan(input: HeadcountPlanInput): Promise<{ plan: HeadcountPlan; lines: HeadcountPlanLine[] }>;
  approveHeadcountPlan(planId: string): Promise<HeadcountPlan>;
  getHeadcountSummary(departmentId?: string): Promise<HeadcountSummary>;

  // ── Change Tracking ──────────────────────────────────────────────────
  getOrgChanges(filters?: OrgChangeFilters): Promise<OrgChange[]>;
}
```

### Org Chart Data Structure

```typescript
interface OrgChartNode {
  person: {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    avatarUrl: string | null;
    employmentType: EmploymentType;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
  team: {
    id: string;
    name: string;
  } | null;
  directReports: OrgChartNode[];   // Recursive children
  dottedLineReports: Array<{       // Matrix relationships
    person: OrgChartNode['person'];
    role: string;                   // "functional_manager" | "project_lead"
  }>;
  metadata: {
    totalReports: number;           // Including transitive
    depth: number;                  // Levels below this node
    span: number;                   // Direct report count
  };
}
```

### Key Behaviors

1. **Hierarchical departments**: Departments can nest (e.g., "Engineering" → "Platform Engineering" → "Infrastructure"). The org chart traverses the full tree recursively.
2. **Matrix support**: A person can have one `solid` (primary) reporting line and multiple `dotted` lines. The primary manager handles leave approvals, performance reviews, and compensation. Dotted-line managers provide functional guidance.
3. **Change tracking**: Every structural change (department creation, merger, person transfer, manager change) is recorded in `orgChanges` with before/after state snapshots for compliance auditing.
4. **Headcount validation**: Headcount plan lines validate against budgeted headcount for each position/department. Over-budget plans are flagged for finance approval.
5. **Auto-computed headcount**: When a person is added to or removed from a department, the department's `headcount` field is automatically recomputed via a database trigger.

---

## Module: hiring

### Purpose

Implements a full Applicant Tracking System (ATS) with customizable hiring pipelines. Covers the entire recruiting lifecycle: requisition creation with multi-level approval, job posting to the venture's career page and external job boards, candidate application processing with resume parsing, structured interview scheduling (via `@mcv/shared` scheduling), interviewer scorecards with standardized rating criteria, offer generation with approval workflows, and hiring analytics for time-to-fill and pipeline conversion metrics.

### Database Schema

```typescript
// people_requisitions — Job Requisitions (Approval-Gated)
export const requisitions = pgTable('people_requisitions', {
  ...baseColumns,
  requisitionNumber: text('requisition_number').notNull(), // "REQ-2026-000012"
  title: text('title').notNull(),                        // "Senior Software Engineer"
  positionId: uuid('position_id').references(() => positions.id),
  departmentId: uuid('department_id').references(() => departments.id).notNull(),
  hiringManagerId: uuid('hiring_manager_id').references(() => people.id).notNull(),
  recruiterId: uuid('recruiter_id').references(() => people.id),
  status: requisitionStatusEnum('status').default('draft'), // draft | pending_approval | approved | open | on_hold | filled | cancelled
  priority: text('priority').default('medium'),          // low | medium | high | urgent
  employmentType: employmentTypeEnum('employment_type').notNull(),
  headcountPlanLineId: uuid('headcount_plan_line_id').references(() => headcountPlanLines.id),
  numberOfOpenings: integer('number_of_openings').default(1),
  filledCount: integer('filled_count').default(0),

  // ── Job Details ──────────────────────────────────────────────────────
  description: text('description').notNull(),
  requirements: jsonb('requirements'),                   // [{ type: 'must_have', text: '5+ years TypeScript' }, ...]
  responsibilities: jsonb('responsibilities'),           // [{ text: 'Lead frontend architecture' }, ...]
  qualifications: jsonb('qualifications'),
  salaryRangeMin: numeric('salary_range_min', { precision: 19, scale: 4 }),
  salaryRangeMax: numeric('salary_range_max', { precision: 19, scale: 4 }),
  currency: text('currency').default('USD'),
  benefits: jsonb('benefits'),
  location: text('location'),
  isRemote: boolean('is_remote').default(false),
  visaSponsorshipAvailable: boolean('visa_sponsorship_available').default(false),

  // ── Pipeline ─────────────────────────────────────────────────────────
  pipelineId: uuid('pipeline_id').references(() => hiringPipelines.id),
  targetHireDate: timestamp('target_hire_date'),
  actualFillDate: timestamp('actual_fill_date'),

  // ── Approval ─────────────────────────────────────────────────────────
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  approvalNotes: text('approval_notes'),
  budgetApprovedBy: uuid('budget_approved_by'),          // Finance sign-off
  budgetApprovedAt: timestamp('budget_approved_at'),

  metadata: jsonb('metadata'),
});

// people_job_postings — Public Job Postings
export const jobPostings = pgTable('people_job_postings', {
  ...baseColumns,
  requisitionId: uuid('requisition_id').references(() => requisitions.id).notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),                          // URL-friendly slug for career page
  description: text('description').notNull(),            // Rich HTML/markdown
  shortDescription: text('short_description'),           // For listing cards
  location: text('location').notNull(),
  isRemote: boolean('is_remote').default(false),
  employmentType: employmentTypeEnum('employment_type').notNull(),
  salaryRange: text('salary_range'),                     // "$120k – $160k" (display format)
  showSalary: boolean('show_salary').default(false),
  department: text('department'),
  benefits: jsonb('benefits'),
  applicationQuestions: jsonb('application_questions'),   // [{ id, question, type: 'text'|'select'|'file', required }]
  status: text('status').default('draft'),               // draft | published | closed | archived
  publishedAt: timestamp('published_at'),
  closesAt: timestamp('closes_at'),
  externalPostings: jsonb('external_postings'),          // [{ board: 'LinkedIn', url, postedAt, externalId }]
  viewCount: integer('view_count').default(0),
  applicationCount: integer('application_count').default(0),
  metadata: jsonb('metadata'),
});

// people_candidates — Candidate Profiles (Deduplicated Across Applications)
export const candidates = pgTable('people_candidates', {
  ...baseColumns,
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  linkedinUrl: text('linkedin_url'),
  portfolioUrl: text('portfolio_url'),
  resumeUrl: text('resume_url'),
  resumeParsedData: jsonb('resume_parsed_data'),         // Parsed resume structured data
  source: text('source'),                                // career_page | linkedin | referral | recruiter | job_board
  referredBy: uuid('referred_by').references(() => people.id),
  tags: text('tags').array(),
  notes: text('notes'),
  isBlacklisted: boolean('is_blacklisted').default(false),
  blacklistReason: text('blacklist_reason'),
  totalApplications: integer('total_applications').default(0),
  metadata: jsonb('metadata'),
});

// people_applications — Candidate Applications
export const applications = pgTable('people_applications', {
  ...baseColumns,
  applicationNumber: text('application_number').notNull(), // "APP-2026-000345"
  candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
  requisitionId: uuid('requisition_id').references(() => requisitions.id).notNull(),
  jobPostingId: uuid('job_posting_id').references(() => jobPostings.id),
  status: applicationStatusEnum('status').default('applied'), // applied | screening | phone_screen | interviewing | offer | hired | rejected | withdrawn
  currentStageId: uuid('current_stage_id').references(() => hiringPipelineStages.id),
  appliedAt: timestamp('applied_at').notNull(),
  source: text('source'),                                // How they found this specific posting
  coverLetter: text('cover_letter'),
  responses: jsonb('responses'),                         // Answers to application questions
  resumeUrl: text('resume_url'),
  screeningScore: numeric('screening_score', { precision: 5, scale: 2 }),
  screeningNotes: text('screening_notes'),
  overallRating: numeric('overall_rating', { precision: 3, scale: 2 }),
  rejectionReason: text('rejection_reason'),
  rejectedAt: timestamp('rejected_at'),
  rejectedBy: uuid('rejected_by'),
  withdrawnAt: timestamp('withdrawn_at'),
  withdrawalReason: text('withdrawal_reason'),
  hiredAt: timestamp('hired_at'),
  metadata: jsonb('metadata'),
});

// people_interviews — Interview Sessions
export const interviews = pgTable('people_interviews', {
  ...baseColumns,
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  interviewType: text('interview_type').notNull(),       // phone_screen | technical | behavioral | culture | panel | case_study | final
  format: text('format').notNull(),                      // in_person | video | phone
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: integer('duration').notNull(),               // minutes
  location: text('location'),                            // Room name or video link
  videoLink: text('video_link'),
  status: text('status').default('scheduled'),           // scheduled | confirmed | in_progress | completed | cancelled | no_show
  interviewerIds: uuid('interviewer_ids').array(),
  feedback: text('feedback'),
  overallRating: numeric('overall_rating', { precision: 3, scale: 2 }),
  calendarEventId: text('calendar_event_id'),            // Linked calendar event (@mcv/shared)
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  rescheduledFrom: uuid('rescheduled_from'),
  metadata: jsonb('metadata'),
});

// people_interview_scorecards — Interviewer Scorecards
export const interviewScorecards = pgTable('people_interview_scorecards', {
  ...baseColumns,
  interviewId: uuid('interview_id').references(() => interviews.id).notNull(),
  interviewerId: uuid('interviewer_id').references(() => people.id).notNull(),
  status: text('status').default('pending'),             // pending | submitted
  overallRating: integer('overall_rating'),              // 1-5
  overallRecommendation: text('overall_recommendation'), // strong_hire | hire | no_hire | strong_no_hire
  criteria: jsonb('criteria'),                           // [{ name, rating: 1-5, notes }]
  strengths: text('strengths'),
  concerns: text('concerns'),
  notes: text('notes'),
  submittedAt: timestamp('submitted_at'),
});

// people_offers — Job Offers
export const offers = pgTable('people_offers', {
  ...baseColumns,
  offerNumber: text('offer_number').notNull(),           // "OFR-2026-000015"
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
  requisitionId: uuid('requisition_id').references(() => requisitions.id).notNull(),
  status: offerStatusEnum('status').default('draft'),    // draft | pending_approval | approved | sent | accepted | declined | expired | rescinded
  title: text('title').notNull(),
  departmentId: uuid('department_id').references(() => departments.id).notNull(),
  managerId: uuid('manager_id').references(() => people.id).notNull(),
  employmentType: employmentTypeEnum('employment_type').notNull(),

  // ── Compensation Package ─────────────────────────────────────────────
  salary: numeric('salary', { precision: 19, scale: 4 }).notNull(),
  salaryFrequency: text('salary_frequency').notNull(),   // annual | monthly | hourly
  currency: text('currency').default('USD'),
  signingBonus: numeric('signing_bonus', { precision: 19, scale: 4 }),
  equityGrant: jsonb('equity_grant'),                    // { shares, vestingSchedule, cliffMonths }
  benefits: jsonb('benefits'),
  otherCompensation: jsonb('other_compensation'),

  // ── Dates ────────────────────────────────────────────────────────────
  startDate: timestamp('start_date').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  sentAt: timestamp('sent_at'),
  respondedAt: timestamp('responded_at'),
  acceptedAt: timestamp('accepted_at'),
  declinedAt: timestamp('declined_at'),
  declineReason: text('decline_reason'),
  rescindedAt: timestamp('rescinded_at'),
  rescindReason: text('rescind_reason'),

  // ── Approval ─────────────────────────────────────────────────────────
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  offerLetterUrl: text('offer_letter_url'),
  signedOfferUrl: text('signed_offer_url'),

  notes: text('notes'),
  metadata: jsonb('metadata'),
});

// people_hiring_pipelines — Custom Pipeline Definitions
export const hiringPipelines = pgTable('people_hiring_pipelines', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
});

// people_hiring_pipeline_stages — Pipeline Stage Definitions
export const hiringPipelineStages = pgTable('people_hiring_pipeline_stages', {
  ...baseColumns,
  pipelineId: uuid('pipeline_id').references(() => hiringPipelines.id).notNull(),
  name: text('name').notNull(),                          // "Applied", "Phone Screen", "Technical Interview", etc.
  stageOrder: integer('stage_order').notNull(),
  type: text('type').notNull(),                          // applied | screening | interview | assessment | offer | hired
  autoActions: jsonb('auto_actions'),                    // [{ trigger: 'enter', action: 'send_email', template: 'application_received' }]
  requiredScorecards: integer('required_scorecards').default(0),
  daysTimeout: integer('days_timeout'),                  // Auto-reject if inactive for X days
  metadata: jsonb('metadata'),
});

// people_referrals — Employee Referral Tracking
export const referrals = pgTable('people_referrals', {
  ...baseColumns,
  referrerId: uuid('referrer_id').references(() => people.id).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
  requisitionId: uuid('requisition_id').references(() => requisitions.id),
  status: text('status').default('pending'),             // pending | reviewing | hired | not_hired | bonus_paid
  referralBonus: numeric('referral_bonus', { precision: 19, scale: 4 }),
  bonusPaidAt: timestamp('bonus_paid_at'),
  notes: text('notes'),
});
```

### Core Interface

```typescript
export class HiringService {
  // ── Requisitions ─────────────────────────────────────────────────────
  createRequisition(input: CreateRequisitionInput): Promise<Requisition>;
  submitForApproval(requisitionId: string): Promise<Requisition>;
  approveRequisition(requisitionId: string, notes?: string): Promise<Requisition>;
  rejectRequisition(requisitionId: string, reason: string): Promise<Requisition>;

  // ── Job Postings ─────────────────────────────────────────────────────
  createJobPosting(input: CreateJobPostingInput): Promise<JobPosting>;
  publishJobPosting(postingId: string): Promise<JobPosting>;
  closeJobPosting(postingId: string): Promise<JobPosting>;
  getCareerPagePostings(ventureId: string): Promise<JobPosting[]>;

  // ── Applications ─────────────────────────────────────────────────────
  submitApplication(input: CreateApplicationInput): Promise<Application>;
  moveToStage(applicationId: string, stageId: string): Promise<Application>;
  rejectApplication(applicationId: string, reason: string): Promise<Application>;
  getApplicationsByRequisition(requisitionId: string, filters?: ApplicationFilters): Promise<PaginatedResult<Application>>;

  // ── Interviews ───────────────────────────────────────────────────────
  scheduleInterview(input: ScheduleInterviewInput): Promise<Interview>;
  rescheduleInterview(interviewId: string, newDateTime: Date): Promise<Interview>;
  cancelInterview(interviewId: string, reason: string): Promise<Interview>;
  submitScorecard(interviewId: string, input: ScorecardInput): Promise<InterviewScorecard>;

  // ── Offers ───────────────────────────────────────────────────────────
  createOffer(input: CreateOfferInput): Promise<Offer>;
  submitOfferForApproval(offerId: string): Promise<Offer>;
  approveOffer(offerId: string): Promise<Offer>;
  sendOffer(offerId: string): Promise<Offer>;
  recordOfferResponse(offerId: string, response: 'accepted' | 'declined', reason?: string): Promise<Offer>;

  // ── Conversion ───────────────────────────────────────────────────────
  convertToEmployee(offerId: string): Promise<{ person: Person; onboardingPlan: OnboardingPlan }>;

  // ── Analytics ────────────────────────────────────────────────────────
  getHiringAnalytics(requisitionId?: string): Promise<HiringAnalytics>;
  getPipelineMetrics(requisitionId: string): Promise<PipelineMetrics>;
  getTimeToFill(departmentId?: string, dateRange?: DateRange): Promise<TimeToFillData>;

  // ── Referrals ────────────────────────────────────────────────────────
  createReferral(input: ReferralInput): Promise<Referral>;
  processReferralBonus(referralId: string, amount: string): Promise<Referral>;
}
```

### Hiring Pipeline State Machine

```
┌──────────┐   publish    ┌──────────────┐   apply     ┌────────────────┐
│          │─────────────▶│              │────────────▶│                │
│ REQ OPEN │              │  JOB POSTED  │             │   APPLIED      │
│          │              │              │             │                │
└──────────┘              └──────────────┘             └───────┬────────┘
                                                               │
                                                        screen │
                                                               ▼
                          ┌──────────────┐             ┌────────────────┐
                          │              │◀────────────│                │
                          │   REJECTED   │   reject    │   SCREENING    │
                          │              │             │                │
                          └──────────────┘             └───────┬────────┘
                                  ▲                            │
                                  │                     advance│
                                  │                            ▼
                                  │                    ┌────────────────┐
                                  │     reject         │                │
                                  ├────────────────────│  INTERVIEWING  │
                                  │                    │                │
                                  │                    └───────┬────────┘
                                  │                            │
                                  │                    scorecards complete
                                  │                            ▼
                                  │                    ┌────────────────┐
                                  │     reject         │                │
                                  ├────────────────────│   OFFER STAGE  │
                                  │                    │                │
                                  │                    └───────┬────────┘
                                  │                            │
                                  │                     send offer
                                  │                            ▼
                          ┌──────────────┐             ┌────────────────┐
                          │              │  declined   │                │
                          │  DECLINED    │◀────────────│    OFFERED     │
                          │              │             │                │
                          └──────────────┘             └───────┬────────┘
                                                               │
                                                        accepted│
                                                               ▼
                                                       ┌────────────────┐
                                                       │                │
                                                       │    HIRED       │──▶ Creates Person record
                                                       │                │──▶ Triggers Onboarding
                                                       └────────────────┘
```

### Key Behaviors

1. **Requisition approval gate**: Job postings cannot be created until the requisition is approved. Requisitions require both hiring manager approval and finance sign-off (for budget validation against headcount plans).
2. **Candidate deduplication**: When an application is submitted, the system checks for existing candidates by email. If found, the application is linked to the existing candidate profile and `totalApplications` is incremented.
3. **Auto-stage transitions**: Pipeline stages can define `autoActions` that fire on enter/exit. Common examples: send acknowledgment email on "Applied", send rejection email on "Rejected", create calendar event on "Interview".
4. **Scorecard requirements**: A pipeline stage can require a minimum number of completed scorecards before the application can be advanced. E.g., "Technical Interview" requires 2 scorecards before moving to "Offer Stage".
5. **Offer-to-employee conversion**: `convertToEmployee()` atomically creates a person record in the directory, assigns them to the department/team, triggers onboarding plan creation, and updates the requisition's `filledCount`.
6. **Career page API**: `getCareerPagePostings()` returns only published postings with sanitized data suitable for public consumption — no internal notes, no salary details unless `showSalary` is enabled.

---

## Module: onboarding

### Purpose

Manages the structured onboarding experience for new hires. When an offer is accepted and the candidate converts to an employee, an onboarding plan is automatically generated from configurable checklist templates. The plan orchestrates task completion across multiple stakeholders (HR, IT, manager, buddy, new hire), tracks document collection, manages equipment provisioning, handles system access requests, and monitors progress through 30/60/90-day milestones.

### Database Schema

```typescript
// people_onboarding_checklists — Reusable Checklist Templates
export const onboardingChecklists = pgTable('people_onboarding_checklists', {
  ...baseColumns,
  name: text('name').notNull(),                          // "Standard Engineering Onboarding"
  description: text('description'),
  departmentId: uuid('department_id'),                   // null = company-wide
  employmentType: employmentTypeEnum('employment_type'), // null = all types
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  version: integer('version').default(1),
  estimatedDays: integer('estimated_days'),              // Expected completion time
  metadata: jsonb('metadata'),
});

// people_onboarding_checklist_items — Checklist Template Items
export const onboardingChecklistItems = pgTable('people_onboarding_checklist_items', {
  ...baseColumns,
  checklistId: uuid('checklist_id').references(() => onboardingChecklists.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),                  // hr_admin | it_setup | manager_tasks | new_hire_tasks | culture | compliance
  assigneeType: text('assignee_type').notNull(),         // hr | it | manager | buddy | new_hire | custom
  customAssigneeId: uuid('custom_assignee_id'),
  sortOrder: integer('sort_order').notNull(),
  dueOffsetDays: integer('due_offset_days').notNull(),   // Days from start date (negative = before start)
  isRequired: boolean('is_required').default(true),
  requiresDocument: boolean('requires_document').default(false),
  documentType: text('document_type'),                   // Required document type if applicable
  dependsOnItemId: uuid('depends_on_item_id'),           // Task dependency
  instructions: text('instructions'),
  metadata: jsonb('metadata'),
});

// people_onboarding_plans — Plan Instances for Each New Hire
export const onboardingPlans = pgTable('people_onboarding_plans', {
  ...baseColumns,
  personId: uuid('person_id').references(() => people.id).notNull(),
  checklistId: uuid('checklist_id').references(() => onboardingChecklists.id).notNull(),
  status: onboardingPlanStatusEnum('status').default('not_started'), // not_started | in_progress | completed | cancelled
  startDate: timestamp('start_date').notNull(),          // First day of work
  targetCompletionDate: timestamp('target_completion_date'),
  actualCompletionDate: timestamp('actual_completion_date'),
  buddyId: uuid('buddy_id').references(() => people.id),
  totalTasks: integer('total_tasks').default(0),
  completedTasks: integer('completed_tasks').default(0),
  progressPercent: numeric('progress_percent', { precision: 5, scale: 2 }).default('0'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
});

// people_onboarding_tasks — Individual Task Instances
export const onboardingTasks = pgTable('people_onboarding_tasks', {
  ...baseColumns,
  onboardingPlanId: uuid('onboarding_plan_id').references(() => onboardingPlans.id).notNull(),
  checklistItemId: uuid('checklist_item_id').references(() => onboardingChecklistItems.id),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  assigneeId: uuid('assignee_id').references(() => people.id),
  assigneeType: text('assignee_type').notNull(),
  status: onboardingTaskStatusEnum('status').default('pending'), // pending | in_progress | completed | skipped | blocked
  dueDate: timestamp('due_date').notNull(),
  completedAt: timestamp('completed_at'),
  completedBy: uuid('completed_by'),
  isRequired: boolean('is_required').default(true),
  isOverdue: boolean('is_overdue').default(false),
  blockedReason: text('blocked_reason'),
  notes: text('notes'),
  documentId: uuid('document_id'),                       // Linked uploaded document
  sortOrder: integer('sort_order').notNull(),
  metadata: jsonb('metadata'),
});

// people_onboarding_documents — Required Document Collection
export const onboardingDocuments = pgTable('people_onboarding_documents', {
  ...baseColumns,
  onboardingPlanId: uuid('onboarding_plan_id').references(() => onboardingPlans.id).notNull(),
  taskId: uuid('task_id').references(() => onboardingTasks.id),
  documentType: text('document_type').notNull(),         // id_card | passport | tax_form_w4 | tax_form_td1 | direct_deposit | nda | ip_agreement | handbook_ack
  name: text('name').notNull(),
  description: text('description'),
  isRequired: boolean('is_required').default(true),
  status: text('status').default('pending'),             // pending | uploaded | verified | rejected
  fileUrl: text('file_url'),
  uploadedAt: timestamp('uploaded_at'),
  uploadedBy: uuid('uploaded_by'),
  verifiedBy: uuid('verified_by'),
  verifiedAt: timestamp('verified_at'),
  rejectionReason: text('rejection_reason'),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata'),
});

// people_onboarding_equipment — Equipment Provisioning
export const onboardingEquipment = pgTable('people_onboarding_equipment', {
  ...baseColumns,
  onboardingPlanId: uuid('onboarding_plan_id').references(() => onboardingPlans.id).notNull(),
  taskId: uuid('task_id').references(() => onboardingTasks.id),
  equipmentType: text('equipment_type').notNull(),       // laptop | monitor | keyboard | mouse | headset | phone | desk | chair
  brand: text('brand'),
  model: text('model'),
  specifications: jsonb('specifications'),               // { ram: '32GB', storage: '1TB', os: 'macOS' }
  status: text('status').default('requested'),           // requested | ordered | shipped | delivered | configured | assigned
  requestedBy: uuid('requested_by'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  orderedAt: timestamp('ordered_at'),
  deliveredAt: timestamp('delivered_at'),
  serialNumber: text('serial_number'),
  assetTag: text('asset_tag'),
  trackingNumber: text('tracking_number'),
  estimatedDelivery: timestamp('estimated_delivery'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
});

// people_onboarding_access_requests — System Access Setup
export const onboardingAccessRequests = pgTable('people_onboarding_access_requests', {
  ...baseColumns,
  onboardingPlanId: uuid('onboarding_plan_id').references(() => onboardingPlans.id).notNull(),
  taskId: uuid('task_id').references(() => onboardingTasks.id),
  systemName: text('system_name').notNull(),             // "GitHub", "Slack", "Google Workspace", "AWS", "Jira", "Figma"
  accessLevel: text('access_level').notNull(),           // read | write | admin | custom
  accessDetails: jsonb('access_details'),                // { org: 'mcv-one', teams: ['engineering'], role: 'member' }
  status: text('status').default('pending'),             // pending | approved | provisioned | denied
  requestedBy: uuid('requested_by'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  provisionedAt: timestamp('provisioned_at'),
  provisionedBy: uuid('provisioned_by'),
  accountId: text('account_id'),                         // Created account ID in external system
  denialReason: text('denial_reason'),
  metadata: jsonb('metadata'),
});

// people_onboarding_milestones — 30/60/90 Day Milestones
export const onboardingMilestones = pgTable('people_onboarding_milestones', {
  ...baseColumns,
  onboardingPlanId: uuid('onboarding_plan_id').references(() => onboardingPlans.id).notNull(),
  name: text('name').notNull(),                          // "30-Day Check-in", "60-Day Review", "90-Day Assessment"
  description: text('description'),
  dayTarget: integer('day_target').notNull(),            // 30, 60, 90
  dueDate: timestamp('due_date').notNull(),
  status: text('status').default('upcoming'),            // upcoming | due | completed | overdue
  goals: jsonb('goals'),                                 // [{ text: 'Complete all training modules', completed: false }]
  managerFeedback: text('manager_feedback'),
  newHireFeedback: text('new_hire_feedback'),
  buddyFeedback: text('buddy_feedback'),
  overallRating: integer('overall_rating'),              // 1-5
  completedAt: timestamp('completed_at'),
  meetingScheduledAt: timestamp('meeting_scheduled_at'),
  metadata: jsonb('metadata'),
});
```

### Core Interface

```typescript
export class OnboardingService {
  // ── Plan Management ──────────────────────────────────────────────────
  createOnboardingPlan(personId: string, input: CreateOnboardingPlanInput): Promise<OnboardingPlan>;
  getOnboardingPlan(planId: string): Promise<OnboardingPlanWithTasks>;
  cancelOnboardingPlan(planId: string, reason: string): Promise<OnboardingPlan>;

  // ── Task Management ──────────────────────────────────────────────────
  completeTask(taskId: string, completedBy: string, notes?: string): Promise<OnboardingTask>;
  skipTask(taskId: string, reason: string): Promise<OnboardingTask>;
  blockTask(taskId: string, reason: string): Promise<OnboardingTask>;
  reassignTask(taskId: string, newAssigneeId: string): Promise<OnboardingTask>;
  getMyTasks(personId: string): Promise<OnboardingTask[]>;

  // ── Document Collection ──────────────────────────────────────────────
  uploadOnboardingDocument(planId: string, input: DocumentUploadInput): Promise<OnboardingDocument>;
  verifyDocument(documentId: string, verifierId: string): Promise<OnboardingDocument>;
  rejectDocument(documentId: string, reason: string): Promise<OnboardingDocument>;

  // ── Equipment Provisioning ───────────────────────────────────────────
  requestEquipment(planId: string, input: EquipmentRequestInput): Promise<OnboardingEquipment>;
  updateEquipmentStatus(equipmentId: string, status: string, details?: Partial<OnboardingEquipment>): Promise<OnboardingEquipment>;

  // ── Access Provisioning ──────────────────────────────────────────────
  requestAccess(planId: string, input: AccessRequestInput): Promise<OnboardingAccessRequest>;
  provisionAccess(requestId: string, accountId: string): Promise<OnboardingAccessRequest>;
  denyAccess(requestId: string, reason: string): Promise<OnboardingAccessRequest>;

  // ── Milestones ───────────────────────────────────────────────────────
  completeMilestone(milestoneId: string, input: MilestoneCompletionInput): Promise<OnboardingMilestone>;
  getMilestoneProgress(planId: string): Promise<MilestoneProgress>;

  // ── Checklist Templates ──────────────────────────────────────────────
  createChecklist(input: OnboardingChecklistInput): Promise<OnboardingChecklist>;
  updateChecklist(checklistId: string, input: UpdateChecklistInput): Promise<OnboardingChecklist>;

  // ── Analytics ────────────────────────────────────────────────────────
  getOnboardingAnalytics(dateRange?: DateRange): Promise<OnboardingAnalytics>;
  getOverdueTasks(): Promise<OnboardingTask[]>;
}
```

### Key Behaviors

1. **Auto-plan generation**: When `convertToEmployee()` is called from the hiring module, the onboarding service automatically selects the matching checklist (by department + employment type) and instantiates all tasks with calculated due dates based on `dueOffsetDays` relative to the start date.
2. **Pre-start tasks**: Tasks with negative `dueOffsetDays` (e.g., −5) are due before the start date. This enables IT to provision equipment and accounts before day one.
3. **Progress tracking**: Every task completion recalculates `completedTasks` and `progressPercent` on the plan. When all required tasks are done, the plan status moves to `completed`.
4. **Overdue detection**: A cron job runs daily to mark tasks as `isOverdue = true` when past their due date and still pending. Notifications are sent to the task assignee and the onboarding coordinator.
5. **Buddy assignment**: Each onboarding plan can have an assigned buddy. Buddy tasks (orientation, social introductions, coffee chats) are auto-created from the checklist template.
6. **Milestone scheduling**: 30/60/90 day milestones are automatically created with due dates calculated from the start date. Manager and new hire are notified 3 days before each milestone is due.

---

## Module: leave

### Purpose

Manages all types of leave (PTO, vacation, sick, personal, parental, bereavement, sabbatical, jury duty, military, etc.) across multiple jurisdictions with country-specific policies. Handles complex accrual rules (annual grant, per-pay-period, hourly-based), multi-level approval workflows, balance tracking with carry-over calculations, calendar integration, public holiday management, and blackout date enforcement.

This module is jurisdiction-aware: leave entitlements, accrual rules, and statutory minimums vary by country and state/province. The system maintains a comprehensive public holiday database and applies the correct policy based on each employee's `jurisdictionCode`.

### Multi-Jurisdiction Leave Policies

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    JURISDICTION-AWARE LEAVE POLICIES                      │
│                                                                          │
│  US (Federal)     US-CA (California)   CA-ON (Ontario)    GB (UK)       │
│  ──────────────   ──────────────────   ──────────────     ─────────     │
│  No federal PTO   Paid sick: 5 days    Vacation: 2 wks   Statutory:    │
│  FMLA: 12 wks     Pregnancy: 4 mo      (min, first 5y)   28 days/yr   │
│  No paid parental CA FMLA: 12 wks      Sick: 3 days/yr   Maternity:   │
│                   Bereavement: 5 days   Parental: 63 wks  52 weeks     │
│                                         Public: 9 days    Paternity:   │
│                                                           2 weeks      │
│                                                                          │
│  DE (Germany)     AU (Australia)       IN (India)         JP (Japan)   │
│  ──────────────   ──────────────────   ──────────────     ─────────    │
│  Vacation: 20d    Annual: 4 wks        Earned: 15 days   Annual: 10d  │
│  Sick: unlimited  Sick: 10 days        Sick: varies      Sick: varies │
│  Parental: 14 mo  Parental: 18 wks     Maternity: 26 wks Maternity:  │
│  Public: 9-13d    Public: 8 days       Public: varies     14 weeks    │
│                                         Casual: 12 days   Public: 16d │
└──────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```typescript
// people_leave_policies — Leave Policy Definitions
export const leavePolicies = pgTable('people_leave_policies', {
  ...baseColumns,
  name: text('name').notNull(),                          // "US Standard Leave Policy"
  description: text('description'),
  jurisdictionCode: text('jurisdiction_code'),           // "US", "US-CA", "CA-ON", "GB", "DE" — null = global
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  appliesToEmploymentTypes: text('applies_to_employment_types').array(), // ['full_time', 'part_time']
  appliesToDepartments: uuid('applies_to_departments').array(),
  effectiveFrom: timestamp('effective_from'),
  effectiveTo: timestamp('effective_to'),
  carryOverPolicy: jsonb('carry_over_policy'),
  // { maxCarryOverDays: 5, useByDate: '03-31', forfeitUnused: true }
  probationaryRestrictions: jsonb('probationary_restrictions'),
  // { restrictedTypes: ['vacation'], probationDays: 90, accrualDuringProbation: false }
  approvalChain: jsonb('approval_chain'),
  // [{ level: 1, type: 'manager' }, { level: 2, type: 'hr', condition: { daysAbove: 10 } }]
  metadata: jsonb('metadata'),
});

// people_leave_policy_rules — Per-Type Accrual/Entitlement Rules
export const leavePolicyRules = pgTable('people_leave_policy_rules', {
  ...baseColumns,
  policyId: uuid('policy_id').references(() => leavePolicies.id).notNull(),
  leaveType: leaveTypeEnum('leave_type').notNull(),      // vacation | sick | personal | parental_maternity | parental_paternity | bereavement | sabbatical | jury_duty | military | unpaid | other
  name: text('name').notNull(),                          // "Annual Vacation"
  description: text('description'),

  // ── Entitlement ──────────────────────────────────────────────────────
  entitlementType: text('entitlement_type').notNull(),   // fixed | accrued | unlimited
  annualEntitlementDays: numeric('annual_entitlement_days', { precision: 6, scale: 2 }),
  maxBalanceDays: numeric('max_balance_days', { precision: 6, scale: 2 }),

  // ── Accrual (for accrued type) ───────────────────────────────────────
  accrualFrequency: text('accrual_frequency'),           // per_pay_period | monthly | quarterly | annual | hourly
  accrualRate: numeric('accrual_rate', { precision: 8, scale: 4 }), // Days per period
  accrualStartsAfterDays: integer('accrual_starts_after_days').default(0),
  maxAccrualDays: numeric('max_accrual_days', { precision: 6, scale: 2 }),

  // ── Tenure-Based Tiers ───────────────────────────────────────────────
  tenureTiers: jsonb('tenure_tiers'),
  // [{ yearsOfService: 0, entitlementDays: 15 },
  //  { yearsOfService: 3, entitlementDays: 20 },
  //  { yearsOfService: 7, entitlementDays: 25 },
  //  { yearsOfService: 15, entitlementDays: 30 }]

  // ── Rules ────────────────────────────────────────────────────────────
  requiresDocumentation: boolean('requires_documentation').default(false),
  documentationType: text('documentation_type'),          // doctor_note | death_certificate | court_summons
  minConsecutiveDays: integer('min_consecutive_days'),
  maxConsecutiveDays: integer('max_consecutive_days'),
  advanceNoticeDays: integer('advance_notice_days'),      // Days before leave starts
  canBeHalfDay: boolean('can_be_half_day').default(true),
  isPaid: boolean('is_paid').default(true),
  payPercentage: numeric('pay_percentage', { precision: 5, scale: 2 }).default('100'),
  waitingPeriodDays: integer('waiting_period_days').default(0),
  genderRestriction: text('gender_restriction'),          // null | male | female | non_binary (for parental)
  metadata: jsonb('metadata'),
});

// people_leave_requests — Leave Request Records
export const leaveRequests = pgTable('people_leave_requests', {
  ...baseColumns,
  requestNumber: text('request_number').notNull(),       // "LV-2026-000123"
  personId: uuid('person_id').references(() => people.id).notNull(),
  leaveType: leaveTypeEnum('leave_type').notNull(),
  policyRuleId: uuid('policy_rule_id').references(() => leavePolicyRules.id),
  status: leaveRequestStatusEnum('status').default('pending'), // pending | approved | rejected | cancelled | taken
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  startHalf: text('start_half'),                         // 'first_half' | 'second_half' | null (full day)
  endHalf: text('end_half'),
  totalDays: numeric('total_days', { precision: 6, scale: 2 }).notNull(),
  reason: text('reason'),
  documentUrl: text('document_url'),                     // Supporting document if required
  approverId: uuid('approver_id').references(() => people.id),
  approvedAt: timestamp('approved_at'),
  approverNotes: text('approver_notes'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  calendarEventId: text('calendar_event_id'),            // Linked calendar event
  delegateTo: uuid('delegate_to').references(() => people.id), // Work delegation during leave
  metadata: jsonb('metadata'),
});

// people_leave_balances — Current Leave Balances
export const leaveBalances = pgTable('people_leave_balances', {
  ...baseColumns,
  personId: uuid('person_id').references(() => people.id).notNull(),
  leaveType: leaveTypeEnum('leave_type').notNull(),
  policyRuleId: uuid('policy_rule_id').references(() => leavePolicyRules.id),
  year: integer('year').notNull(),
  entitled: numeric('entitled', { precision: 6, scale: 2 }).notNull(),       // Total entitlement for the year
  accrued: numeric('accrued', { precision: 6, scale: 2 }).default('0'),      // Accrued so far
  used: numeric('used', { precision: 6, scale: 2 }).default('0'),            // Used/taken
  pending: numeric('pending', { precision: 6, scale: 2 }).default('0'),      // Pending approval
  carriedOver: numeric('carried_over', { precision: 6, scale: 2 }).default('0'), // From previous year
  adjustment: numeric('adjustment', { precision: 6, scale: 2 }).default('0'), // Manual adjustments
  available: numeric('available', { precision: 6, scale: 2 }).default('0'),  // = entitled + carriedOver + accrued + adjustment - used - pending
  lastAccrualDate: timestamp('last_accrual_date'),
  metadata: jsonb('metadata'),
});

// people_leave_accrual_logs — Accrual Audit Trail
export const leaveAccrualLogs = pgTable('people_leave_accrual_logs', {
  ...baseColumns,
  personId: uuid('person_id').references(() => people.id).notNull(),
  leaveType: leaveTypeEnum('leave_type').notNull(),
  balanceId: uuid('balance_id').references(() => leaveBalances.id).notNull(),
  accrualDate: timestamp('accrual_date').notNull(),
  daysAccrued: numeric('days_accrued', { precision: 6, scale: 4 }).notNull(),
  runningBalance: numeric('running_balance', { precision: 6, scale: 2 }).notNull(),
  source: text('source').notNull(),                      // scheduled_accrual | manual_adjustment | carry_over | correction
  notes: text('notes'),
  processedBy: text('processed_by'),                     // 'system' | userId
});

// people_leave_blockout_dates — Company-Wide Blackout Dates
export const leaveBlockoutDates = pgTable('people_leave_blockout_dates', {
  ...baseColumns,
  name: text('name').notNull(),                          // "Year-End Close Period"
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  leaveTypes: text('leave_types').array(),               // Which leave types are blocked (null = all)
  departmentIds: uuid('department_ids').array(),          // null = all departments
  reason: text('reason'),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by'),
});

// people_public_holidays — Jurisdiction-Specific Public Holidays
export const publicHolidays = pgTable('people_public_holidays', {
  ...baseColumns,
  name: text('name').notNull(),                          // "New Year's Day"
  date: timestamp('date').notNull(),
  jurisdictionCode: text('jurisdiction_code').notNull(), // "US", "US-CA", "CA-ON", "GB"
  isObserved: boolean('is_observed').default(true),      // Whether the company observes it
  observedDate: timestamp('observed_date'),              // If observed on a different day (e.g., Monday after)
  isHalfDay: boolean('is_half_day').default(false),
  year: integer('year').notNull(),
  notes: text('notes'),
});
```

### Core Interface

```typescript
export class LeaveService {
  // ── Leave Requests ───────────────────────────────────────────────────
  createLeaveRequest(input: CreateLeaveRequestInput): Promise<LeaveRequest>;
  approveLeaveRequest(requestId: string, notes?: string): Promise<LeaveRequest>;
  rejectLeaveRequest(requestId: string, reason: string): Promise<LeaveRequest>;
  cancelLeaveRequest(requestId: string, reason: string): Promise<LeaveRequest>;
  getLeaveRequests(personId: string, options?: LeaveRequestFilters): Promise<PaginatedResult<LeaveRequest>>;
  getTeamLeaveCalendar(managerId: string, dateRange: DateRange): Promise<TeamLeaveCalendarData>;

  // ── Balance Management ───────────────────────────────────────────────
  getLeaveBalances(personId: string, year?: number): Promise<LeaveBalance[]>;
  adjustBalance(personId: string, leaveType: string, adjustment: number, reason: string): Promise<LeaveBalance>;
  processYearEndCarryOver(year: number): Promise<CarryOverResult>;

  // ── Accrual Processing ───────────────────────────────────────────────
  runAccruals(asOfDate?: Date): Promise<AccrualRunResult>;
  getAccrualHistory(personId: string, leaveType: string): Promise<LeaveAccrualLog[]>;

  // ── Policy Management ────────────────────────────────────────────────
  createLeavePolicy(input: CreateLeavePolicyInput): Promise<LeavePolicy>;
  updateLeavePolicy(policyId: string, input: UpdateLeavePolicyInput): Promise<LeavePolicy>;
  getApplicablePolicy(personId: string): Promise<LeavePolicy>;
  assignPolicy(personId: string, policyId: string): Promise<void>;

  // ── Holidays & Blackouts ─────────────────────────────────────────────
  getPublicHolidays(jurisdictionCode: string, year: number): Promise<PublicHoliday[]>;
  createBlockoutDate(input: BlockoutDateInput): Promise<LeaveBlockoutDate>;
  checkAvailability(personId: string, startDate: Date, endDate: Date): Promise<AvailabilityCheck>;

  // ── Analytics ────────────────────────────────────────────────────────
  getLeaveAnalytics(options?: LeaveAnalyticsOptions): Promise<LeaveAnalytics>;
  getAbsenteeismRate(departmentId?: string, dateRange?: DateRange): Promise<AbsenteeismData>;
}
```

### Leave Request Flow

```
Employee submits leave request
        │
        ▼
┌───────────────────┐    ┌─────────────────┐
│ Validate           │    │ Check:           │
│                    │────│ • Balance ≥ days │
│ Check policy rules │    │ • No blackout    │
│                    │    │ • Advance notice  │
│                    │    │ • Documentation   │
└────────┬──────────┘    └─────────────────┘
         │
         │ valid
         ▼
┌───────────────────┐    ┌─────────────────┐
│ PENDING            │    │ Deduct from      │
│                    │────│ 'pending' balance│
│ Notify approver(s) │    │                  │
│                    │    │ Create calendar  │
└────────┬──────────┘    │ hold event       │
         │               └─────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌────────┐
│APPROVED│  │REJECTED│
│        │  │        │
│Move to │  │Restore │
│'used'  │  │pending │
│balance │  │balance │
└────┬───┘  └────────┘
     │
     │ dates pass
     ▼
┌────────┐
│ TAKEN  │
│        │
│ Final  │
└────────┘
```

### Key Behaviors

1. **Jurisdiction matching**: When a leave request is created, the system identifies the employee's `jurisdictionCode` and applies the matching leave policy. If no jurisdiction-specific policy exists, it falls back to the venture's default policy.
2. **Balance validation**: Leave requests are validated against available balance (`entitled + carriedOver + accrued + adjustment - used - pending`). Requests exceeding the balance are rejected unless the leave type is `unpaid` or `unlimited`.
3. **Accrual automation**: A cron job runs accruals per the configured frequency (per pay period, monthly, etc.). Each accrual is logged in `leaveAccrualLogs` with a running balance for audit purposes.
4. **Year-end carry-over**: `processYearEndCarryOver()` calculates unused leave, applies carry-over limits from the policy, and creates new-year balances with the carried-over amount. Forfeited days are logged.
5. **Blackout enforcement**: Leave requests that overlap with active blockout dates for the employee's department and leave type are rejected with a clear error message.
6. **Half-day support**: Leave can be taken in half-day increments (first half or second half). The system correctly calculates total days (e.g., a Monday first-half to Friday second-half = 5 full days).
7. **Calendar integration**: Approved leave requests create calendar events via `@mcv/connectors` for team visibility. Team lead can view a consolidated leave calendar.
8. **Work delegation**: Employees can designate a delegate to handle their responsibilities during leave. The delegate is notified and can optionally receive forwarded notifications.

---

## Module: time

### Purpose

Tracks time spent by employees and contractors on projects, tasks, and general work. Supports daily time entry logging, weekly/biweekly timesheet submission with manager approval, project-based time allocation with billable/non-billable classification, overtime calculation based on jurisdiction-specific rules, and payroll integration feed generation for downstream processing by `@mcv/finance`.

### Database Schema

```typescript
// people_time_entries — Individual Time Entries
export const timeEntries = pgTable('people_time_entries', {
  ...baseColumns,
  personId: uuid('person_id').references(() => people.id).notNull(),
  timesheetId: uuid('timesheet_id').references(() => timesheets.id),
  date: timestamp('date').notNull(),
  startTime: timestamp('start_time'),                    // Clock-in (optional — can just log hours)
  endTime: timestamp('end_time'),                        // Clock-out
  breakMinutes: integer('break_minutes').default(0),
  hoursWorked: numeric('hours_worked', { precision: 6, scale: 2 }).notNull(),
  entryType: timeEntryTypeEnum('entry_type').default('regular'), // regular | overtime | holiday | on_call | travel
  projectId: uuid('project_id'),                         // @mcv/operations project
  taskId: uuid('task_id'),
  isBillable: boolean('is_billable').default(false),
  billableRate: numeric('billable_rate', { precision: 10, scale: 2 }),
  billableAmount: numeric('billable_amount', { precision: 19, scale: 4 }),
  clientId: uuid('client_id'),
  description: text('description'),
  tags: text('tags').array(),
  isLocked: boolean('is_locked').default(false),         // Locked after timesheet approval
  source: text('source').default('manual'),              // manual | timer | calendar_sync | api
  externalReference: text('external_reference'),         // Jira ticket, GitHub issue, etc.
  metadata: jsonb('metadata'),
});

// people_timesheets — Weekly/Biweekly Timesheet Headers
export const timesheets = pgTable('people_timesheets', {
  ...baseColumns,
  personId: uuid('person_id').references(() => people.id).notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  periodType: text('period_type').default('weekly'),     // weekly | biweekly | monthly
  status: timesheetStatusEnum('status').default('draft'), // draft | submitted | approved | rejected | processed
  totalHours: numeric('total_hours', { precision: 8, scale: 2 }).default('0'),
  regularHours: numeric('regular_hours', { precision: 8, scale: 2 }).default('0'),
  overtimeHours: numeric('overtime_hours', { precision: 8, scale: 2 }).default('0'),
  billableHours: numeric('billable_hours', { precision: 8, scale: 2 }).default('0'),
  nonBillableHours: numeric('non_billable_hours', { precision: 8, scale: 2 }).default('0'),
  submittedAt: timestamp('submitted_at'),
  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by'),
  rejectedAt: timestamp('rejected_at'),
  rejectedBy: uuid('rejected_by'),
  rejectionReason: text('rejection_reason'),
  processedAt: timestamp('processed_at'),                // Sent to payroll
  payrollFeedId: uuid('payroll_feed_id'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
});

// people_timesheet_lines — Daily Breakdown Within Timesheet
export const timesheetLines = pgTable('people_timesheet_lines', {
  ...baseColumns,
  timesheetId: uuid('timesheet_id').references(() => timesheets.id).notNull(),
  date: timestamp('date').notNull(),
  projectId: uuid('project_id'),
  taskDescription: text('task_description'),
  regularHours: numeric('regular_hours', { precision: 6, scale: 2 }).default('0'),
  overtimeHours: numeric('overtime_hours', { precision: 6, scale: 2 }).default('0'),
  totalHours: numeric('total_hours', { precision: 6, scale: 2 }).default('0'),
  isBillable: boolean('is_billable').default(false),
  isHoliday: boolean('is_holiday').default(false),
  isLeaveDay: boolean('is_leave_day').default(false),
  leaveRequestId: uuid('leave_request_id'),
  notes: text('notes'),
});

// people_time_projects — Project Time Allocation Configuration
export const timeProjects = pgTable('people_time_projects', {
  ...baseColumns,
  name: text('name').notNull(),
  code: text('code').notNull(),                          // "PRJ-001"
  description: text('description'),
  clientId: uuid('client_id'),
  clientName: text('client_name'),
  externalProjectId: uuid('external_project_id'),        // Link to @mcv/operations project
  isBillable: boolean('is_billable').default(true),
  defaultBillableRate: numeric('default_billable_rate', { precision: 10, scale: 2 }),
  budgetHours: numeric('budget_hours', { precision: 10, scale: 2 }),
  usedHours: numeric('used_hours', { precision: 10, scale: 2 }).default('0'),
  status: text('status').default('active'),              // active | completed | on_hold | archived
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  allowedPersonIds: uuid('allowed_person_ids').array(),  // null = everyone
  metadata: jsonb('metadata'),
});

// people_overtime_rules — Overtime Calculation Rules
export const overtimeRules = pgTable('people_overtime_rules', {
  ...baseColumns,
  name: text('name').notNull(),
  jurisdictionCode: text('jurisdiction_code'),           // "US", "US-CA", "CA-ON" — null = default
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  rules: jsonb('rules').notNull(),
  // {
  //   dailyThreshold: 8,            // Hours before daily OT kicks in
  //   weeklyThreshold: 40,          // Hours before weekly OT kicks in
  //   dailyDoubleTime: 12,          // Hours before double-time (CA-specific)
  //   weekendMultiplier: 1.5,       // Weekend pay multiplier
  //   holidayMultiplier: 2.0,       // Holiday pay multiplier
  //   overtimeMultiplier: 1.5,      // Standard OT multiplier
  //   doubleTimeMultiplier: 2.0,    // Double-time multiplier
  //   exemptEmploymentTypes: ['contractor', 'intern'],
  //   workweekStart: 'monday',
  // }
  appliesToEmploymentTypes: text('applies_to_employment_types').array(),
  metadata: jsonb('metadata'),
});

// people_payroll_feeds — Generated Payroll Integration Feeds
export const payrollFeeds = pgTable('people_payroll_feeds', {
  ...baseColumns,
  feedNumber: text('feed_number').notNull(),             // "PRF-2026-W06"
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  status: text('status').default('generated'),           // generated | reviewed | sent | confirmed | error
  format: text('format').default('csv'),                 // csv | json | adp | gusto | paychex
  totalEmployees: integer('total_employees').default(0),
  totalRegularHours: numeric('total_regular_hours', { precision: 10, scale: 2 }),
  totalOvertimeHours: numeric('total_overtime_hours', { precision: 10, scale: 2 }),
  totalBillableHours: numeric('total_billable_hours', { precision: 10, scale: 2 }),
  feedData: jsonb('feed_data'),                          // Complete payroll feed payload
  fileUrl: text('file_url'),
  sentAt: timestamp('sent_at'),
  sentTo: text('sent_to'),                               // Integration target
  confirmedAt: timestamp('confirmed_at'),
  errorMessage: text('error_message'),
  generatedBy: uuid('generated_by'),
  metadata: jsonb('metadata'),
});
```

### Core Interface

```typescript
export class TimeService {
  // ── Time Entries ─────────────────────────────────────────────────────
  createTimeEntry(input: CreateTimeEntryInput): Promise<TimeEntry>;
  updateTimeEntry(entryId: string, input: UpdateTimeEntryInput): Promise<TimeEntry>;
  deleteTimeEntry(entryId: string): Promise<void>;
  startTimer(personId: string, projectId?: string): Promise<TimeEntry>;
  stopTimer(entryId: string): Promise<TimeEntry>;
  getTimeEntries(personId: string, dateRange: DateRange): Promise<TimeEntry[]>;

  // ── Timesheets ───────────────────────────────────────────────────────
  createTimesheet(personId: string, periodStart: Date, periodEnd: Date): Promise<Timesheet>;
  submitTimesheet(timesheetId: string): Promise<Timesheet>;
  approveTimesheet(timesheetId: string, approverId: string): Promise<Timesheet>;
  rejectTimesheet(timesheetId: string, approverId: string, reason: string): Promise<Timesheet>;
  getTimesheets(personId: string, options?: TimesheetFilters): Promise<PaginatedResult<Timesheet>>;
  getPendingApprovals(managerId: string): Promise<Timesheet[]>;

  // ── Project Time ─────────────────────────────────────────────────────
  getProjectTimeReport(projectId: string, dateRange?: DateRange): Promise<ProjectTimeReport>;
  getProjectBudgetUtilization(projectId: string): Promise<BudgetUtilization>;

  // ── Overtime ─────────────────────────────────────────────────────────
  calculateOvertime(personId: string, periodStart: Date, periodEnd: Date): Promise<OvertimeCalculation>;
  getOvertimeReport(departmentId?: string, dateRange?: DateRange): Promise<OvertimeReport>;

  // ── Payroll Feeds ────────────────────────────────────────────────────
  generatePayrollFeed(options: PayrollFeedOptions): Promise<PayrollFeed>;
  getPayrollFeed(feedId: string): Promise<PayrollFeed>;
  confirmPayrollFeed(feedId: string): Promise<PayrollFeed>;

  // ── Analytics ────────────────────────────────────────────────────────
  getUtilizationRate(personId: string, dateRange: DateRange): Promise<UtilizationData>;
  getTeamUtilization(managerId: string, dateRange: DateRange): Promise<TeamUtilizationData>;
  getBillableReport(dateRange: DateRange, groupBy?: 'person' | 'department' | 'project'): Promise<BillableReport>;
  getCostReport(dateRange: DateRange): Promise<CostReport>;
}
`

---

## Module: performance

### Purpose
The performance submodule delivers comprehensive performance management including 360° reviews, goal setting with OKR/KPI frameworks, continuous feedback loops, 1-on-1 meeting tracking, performance improvement plans (PIPs), calibration sessions, and competency frameworks. It enables data-driven talent decisions across all ventures.

### Key Capabilities
- **Review cycles** — 360°, manager, self-assessment, peer reviews with configurable cadence
- **Goal management** — OKR and KPI tracking with cascading alignment from company to individual
- **Continuous feedback** — Real-time recognition, constructive feedback, skill endorsements
- **1-on-1 tracking** — Agenda items, action items, talking points, meeting notes
- **PIPs** — Structured improvement plans with milestones, check-ins, and outcomes
- **Calibration** — Cross-team rating normalization sessions with facilitator tools
- **Competency frameworks** — Role-based skill matrices, gap analysis, development paths

*Full interfaces, schemas, and examples in performance/MODULE.md.*

---

## Module: learning

### Purpose
The learning submodule provides LMS (Learning Management System) functionality including course creation and management, learning paths, certification tracking, compliance training, skill gap analysis, training budget management, and completion tracking across the organization.

### Key Capabilities
- **Course management** — SCORM/xAPI compatible, video, quiz, interactive content
- **Learning paths** — Sequenced courses with prerequisites, branching logic
- **Certifications** — Issuance, renewal tracking, expiry alerts, verification
- **Compliance training** — Mandatory assignments, deadline enforcement, audit trails
- **Skill gap analysis** — Role requirements vs current skills, recommended courses
- **Training budgets** — Per-person/team allocations, spend tracking, ROI measurement
- **Analytics** — Completion rates, quiz scores, time-to-competency, engagement metrics

*Full interfaces, schemas, and examples in learning/MODULE.md.*

---

## Performance & Scaling

| Metric | Target | Strategy |
|--------|--------|----------|
| Directory search | < 100ms | PostgreSQL full-text search + GIN indexes |
| Org chart render | < 500ms | Materialized closure table for hierarchies |
| Leave balance calc | < 200ms | Pre-computed balances with event-sourced accruals |
| Timesheet queries | < 150ms | Partitioned by period, indexed by person + status |
| Review cycle load | < 300ms | Paginated with cursor-based pagination |
| Bulk import (1000 records) | < 30s | Batch insert with streaming CSV parser |

### Scaling Strategy
- Read replicas for reporting-heavy queries (payroll, analytics)
- Materialized views for org chart and headcount rollups
- Background jobs for bulk operations (import, payroll feed generation)
- Partition time-series data (time entries, leave records) by quarter

---

## Security

### PII Protection
- All personal data encrypted at rest (AES-256) and in transit (TLS 1.3)
- Field-level encryption for SSN, bank details, salary information
- Data masking in non-production environments
- Right to erasure (GDPR Article 17) with cascade across all submodules

### Access Control
- Role-based: HR Admin, HR Manager, Department Manager, Employee (self-service)
- Row-level security via Supabase RLS policies scoped to tenant + department
- Manager hierarchy enforcement — managers see only their direct/indirect reports
- Salary data restricted to HR Admin + Finance roles

### Audit Trail
All mutations logged to @mcv/fabric/audit with actor, action, before/after state, IP, timestamp.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PEOPLE_DB_SCHEMA` | Database schema name | `people` |
| `PEOPLE_MAX_IMPORT_ROWS` | Max rows per bulk import | `5000` |
| `PEOPLE_LEAVE_ACCRUAL_CRON` | Cron for leave accrual calculation | `0 1 * * *` |
| `PEOPLE_TIMESHEET_REMINDER_CRON` | Cron for timesheet submission reminders | `0 9 * * 5` |
| `PEOPLE_PAYROLL_FEED_FORMAT` | Default payroll export format | `csv` |
| `PEOPLE_REVIEW_CYCLE_REMINDER_DAYS` | Days before deadline to send reminders | `7` |
| `PEOPLE_PII_ENCRYPTION_KEY` | Encryption key for PII fields | (required) |
| `PEOPLE_SESSION_TIMEOUT_MINUTES` | Session timeout for sensitive operations | `30` |

---

## Error Codes

| Code | Name | Description | HTTP |
|------|------|-------------|------|
| `PPL_001` | PERSON_NOT_FOUND | Person record does not exist | 404 |
| `PPL_002` | DUPLICATE_EMAIL | Email already registered in tenant | 409 |
| `PPL_003` | INVALID_REPORTING_LINE | Circular reporting line detected | 400 |
| `PPL_004` | LEAVE_INSUFFICIENT_BALANCE | Not enough leave balance | 400 |
| `PPL_005` | LEAVE_OVERLAP | Leave request overlaps existing approved leave | 409 |
| `PPL_006` | TIMESHEET_ALREADY_SUBMITTED | Cannot edit a submitted timesheet | 409 |
| `PPL_007` | TIMESHEET_APPROVAL_DENIED | Approver lacks permission for this timesheet | 403 |
| `PPL_008` | REVIEW_CYCLE_CLOSED | Cannot submit review for closed cycle | 400 |
| `PPL_009` | HIRING_PIPELINE_FULL | Requisition candidate limit reached | 400 |
| `PPL_010` | ONBOARDING_TASK_DEPENDENCY | Dependent task not yet completed | 400 |
| `PPL_011` | IMPORT_VALIDATION_FAILED | Bulk import has validation errors | 422 |
| `PPL_012` | PAYROLL_FEED_LOCKED | Payroll feed already confirmed | 409 |
| `PPL_013` | ORG_DEPTH_EXCEEDED | Org hierarchy exceeds max depth | 400 |
| `PPL_014` | CERTIFICATION_EXPIRED | Required certification has expired | 400 |
| `PPL_015` | PII_DECRYPTION_FAILED | Cannot decrypt PII field | 500 |

---

## Dependencies

### Upstream
- `@mcv/identity` — auth, users, tenants (SSO, user accounts, multi-tenancy)
- `@mcv/fabric` — audit, events, notifications, storage (audit trail, event bus, email/push, document storage)
- `@mcv/shared` — workflows, scheduling, validation (approval chains, interview scheduling, input validation)
- `@mcv/connectors` — email, payroll (notification delivery, ADP/Gusto integration)

### Downstream
- `@mcv/finance` — payroll feeds, expense policy enforcement
- `@mcv/operations` — project staffing, resource allocation
- `@mcv/analytics` — workforce analytics, headcount dashboards
- `@mcv/compliance` — employment law compliance, mandatory training tracking

---

## Testing

`	ypescript
// Unit test example
describe('LeaveService', () => {
  it('should reject leave when balance insufficient', async () => {
    const person = await createTestPerson({ leaveBalance: { annual: 2 } });
    await expect(
      leaveService.requestLeave({
        personId: person.id,
        type: 'annual',
        startDate: '2026-03-01',
        endDate: '2026-03-05', // 5 days requested, only 2 available
      })
    ).rejects.toThrow('PPL_004');
  });
});

// Integration test example
describe('HiringPipeline', () => {
  it('should move candidate through stages', async () => {
    const req = await hiringService.createRequisition({ title: 'Senior Engineer', departmentId: 'eng-01' });
    const app = await hiringService.submitApplication({ requisitionId: req.id, candidateEmail: 'test@example.com' });
    const moved = await hiringService.moveToStage(app.id, 'phone_screen');
    expect(moved.currentStage).toBe('phone_screen');
    expect(moved.stageHistory).toHaveLength(2);
  });
});
`

---

## Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `leave-accrual` | Daily 01:00 | Calculate and credit leave accruals based on policy rules |
| `timesheet-reminder` | Friday 09:00 | Remind employees with incomplete timesheets |
| `review-reminder` | Daily 09:00 | Nudge pending review submissions approaching deadline |
| `certification-expiry` | Daily 06:00 | Alert employees/managers of expiring certifications |
| `probation-check` | Daily 08:00 | Flag employees approaching probation end date |
| `headcount-snapshot` | Monthly 1st 02:00 | Snapshot headcount per department for trend analysis |

---

*Generated for @mcv/people — Tier 5 Domain (Publishable) — February 2026*
