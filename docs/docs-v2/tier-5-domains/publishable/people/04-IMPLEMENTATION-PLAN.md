# @mcv/people — Implementation Plan

> **Package:** `@mcv/people`
> **Classification:** PUBLISHABLE
> **Tier:** 5 — Domain Layer
> **Version:** 1.0.0
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1 — Foundation](#phase-1--foundation)
4. [Phase 2 — Core Modules](#phase-2--core-modules)
5. [Phase 3 — Advanced Features](#phase-3--advanced-features)
6. [Phase 4 — Polish & Hardening](#phase-4--polish--hardening)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risks & Mitigations](#risks--mitigations)
10. [Timeline](#timeline)

---

## Overview

This plan outlines the phased implementation of `@mcv/people`, the comprehensive Human Capital Management (HCM) domain for MCV.ONE. The package encompasses 8 submodules (directory, org, hiring, onboarding, leave, time, performance, learning) with 60+ database tables and is classified as PUBLISHABLE — meaning it must meet external product quality standards.

### Implementation Philosophy

- **Foundational first:** Build the person record and org structure before any dependent modules
- **Iterative delivery:** Each phase delivers working, tested, deployable functionality
- **Schema-driven:** Drizzle ORM schemas define the data model; services are built on top
- **Event-driven from day one:** All modules publish domain events even in early phases
- **Security by default:** PII encryption, RLS policies, and audit logging are not afterthoughts — they go in during Phase 1
- **Multi-tenant always:** Every table, every query, every test includes venture isolation

### Delivery Scope

| Phase | Focus | Submodules | Duration |
|---|---|---|---|
| **Phase 1** | Foundation | directory, org | 4 weeks |
| **Phase 2** | Core HR Operations | hiring, onboarding, leave, time | 8 weeks |
| **Phase 3** | Advanced & AI | performance, learning, AI features, analytics | 6 weeks |
| **Phase 4** | Polish & Hardening | All modules — testing, docs, optimization, security audit | 3 weeks |
| **Total** | | | **21 weeks** |

---

## Prerequisites

Before implementation begins, the following must be in place:

### Infrastructure Dependencies

| Dependency | Required For | Status |
|---|---|---|
| **@mcv/kernel** (Tier 2) | Base schemas (`baseColumns`), config, logging, DI container, multi-tenancy context | Must be stable |
| **@mcv/identity** (Tier 3) | User authentication, JWT validation, tenant context, RBAC role definitions | Must be stable |
| **@mcv/fabric** (Tier 3) | Event bus (Redpanda), audit logging, notifications, encrypted file storage | Must be stable |
| **@mcv/shared** (Tier 4) | Workflow engine (approval chains), scheduling service, Zod utilities, pagination helpers | Must be stable |
| **Supabase PostgreSQL** | Database with RLS support | Must be provisioned |
| **Redis** | Caching layer | Must be provisioned |
| **Redpanda/Kafka** | Event bus | Must be provisioned |

### Environment Setup

- [ ] `PEOPLE_PII_ENCRYPTION_KEY` generated and stored in secrets management
- [ ] Database schema `people` created in PostgreSQL
- [ ] Redpanda topics provisioned: `people.domain`, `people.audit`
- [ ] Redis namespace allocated: `people:*`
- [ ] RBAC roles defined in `@mcv/identity`: `hr_admin`, `hr_manager`, `department_manager`, `employee`
- [ ] File storage bucket created: `people-documents`
- [ ] CI/CD pipeline configured for the `packages/people` workspace

### Team & Expertise

| Role | Responsibility | Count |
|---|---|---|
| **Backend Engineer** | Service layer, Drizzle schemas, event publishing, integrations | 2-3 |
| **Frontend Engineer** | React hooks, components, forms, dashboards | 1-2 |
| **Database Engineer** | Schema design, RLS policies, migrations, indexes, partitioning | 1 |
| **Security Engineer** | PII encryption, GDPR compliance, penetration testing, audit review | 1 (part-time) |
| **QA Engineer** | Test strategy, integration tests, E2E tests, load testing | 1 |

---

## Phase 1 — Foundation

**Duration:** 4 weeks
**Goal:** Establish the person record (golden record), organizational structure, PII encryption pipeline, and RLS foundation that every other module depends on.

### Week 1-2: Employee Schema & Directory Core

#### Tasks

1. **Drizzle Schema: Directory Tables (6 tables)**
   - `people_persons` — Core person record with all fields
   - `people_person_profiles` — Extended profile data
   - `people_person_skills` — Skills & certifications
   - `people_person_documents` — Document attachments
   - `people_emergency_contacts` — Emergency contacts
   - `people_employment_history` — Status change log
   - All tables include `baseColumns` (id, ventureId, createdAt, updatedAt)
   - Enum types: `employmentTypeEnum`, `personStatusEnum`
   - Run initial migration

2. **PII Encryption Pipeline**
   - Implement AES-256-GCM encryption/decryption utility using `@mcv/fabric` secrets
   - Build Drizzle ORM interceptor that encrypts on write, decrypts on read
   - Define PII field classification map (`PII_FIELD_CLASSIFICATIONS`)
   - Permission gate: decryption requires `people:pii:read`
   - Data masking for unauthorized access (SSN shows `***-**-1234`, salary shows `***`)

3. **Row-Level Security (RLS) Policies**
   - Venture isolation policy on all 6 directory tables
   - Self-access policy (employees can view their own record)
   - Manager access policy (managers can view direct reports)
   - HR admin override policy
   - Write RLS integration tests

4. **DirectoryService — Core CRUD**
   - `createPerson()` — with auto-numbering (EMP-000042 / CTR-000007), PII encryption, Zod validation
   - `updatePerson()` — with employment history auto-tracking on key field changes
   - `getPerson()` — with optional PII inclusion (permission-gated)
   - `listPeople()` — with filtering, sorting, cursor-based pagination
   - `deactivatePerson()` — soft delete, schedule PII erasure

5. **Full-Text Search**
   - Create GIN index on person name, email, title, preferred name
   - Implement `searchPeople()` with relevance ranking
   - Add faceted filtering (department, status, employment type)

6. **Event Publishing**
   - Set up Redpanda producer for `people.domain` topic
   - Publish events: `person.created`, `person.updated`, `person.deactivated`, `person.pii_accessed`
   - Implement event envelope (eventId, eventType, version, timestamp, ventureId, actorId, payload)

7. **Audit Logging**
   - Integrate with `@mcv/fabric` audit logger
   - Log all PII field access (read and write) with actor, IP, timestamp, field names
   - Log all mutation operations

#### Deliverables
- 6 database tables with migrations applied
- PII encryption working end-to-end
- RLS policies enforced and tested
- DirectoryService with full CRUD + search
- Domain events publishing
- Audit logging active

### Week 3-4: Org Structure & Directory Extensions

#### Tasks

8. **Drizzle Schema: Org Tables (7 tables)**
   - `people_departments` — Department definitions with hierarchical nesting
   - `people_teams` — Team definitions linked to departments
   - `people_positions` — Position/role definitions with bands and salary ranges
   - `people_reporting_lines` — Manager relationships (solid + dotted lines)
   - `people_org_changes` — Org change audit log
   - `people_headcount_plans` — Workforce planning
   - `people_headcount_plan_lines` — Plan line items
   - Run migration

9. **OrgService — Core Operations**
   - `createDepartment()`, `getDepartment()`, `listDepartments()` — with hierarchical nesting
   - `mergeDepartments()` — atomic merge with people transfer
   - `createTeam()`, `addTeamMember()`, `removeTeamMember()`, `getTeamMembers()`
   - `createPosition()` — with skill requirements and salary bands
   - `setReportingLine()` — with circular reference detection
   - `getDirectReports()`, `getReportingChain()`

10. **Org Chart**
    - Implement recursive CTE query for org chart generation
    - `getOrgChart()` with depth limiting and lazy-loading
    - `getOrgChartForDepartment()` — department-scoped subtree
    - Create materialized closure table for O(1) subtree queries
    - Auto-refresh materialized view on structure changes (via trigger)

11. **Headcount Planning**
    - `createHeadcountPlan()` — with line items per department/position
    - `approveHeadcountPlan()` — approval workflow via `@mcv/shared`
    - `getHeadcountSummary()` — current vs budgeted with variance
    - Auto-computed headcount via database trigger on person add/remove

12. **Directory Extensions**
    - `updateProfile()` — extended profile management
    - `addSkill()`, `removeSkill()`, `endorseSkill()` — skills management with peer endorsement
    - `getSkillMatrix()` — department/venture-wide skill coverage
    - `uploadDocument()`, `getDocuments()`, `verifyDocument()` — encrypted document management
    - `setEmergencyContacts()` — emergency contact management
    - `recordEmploymentEvent()`, `getEmploymentHistory()` — manual history entries

13. **GDPR Compliance**
    - `generateDataExport()` — DSAR implementation collecting data from all tables
    - `processDeleteRequest()` — cascade anonymization across directory + future module stubs
    - Data retention configuration and enforcement scaffolding

14. **Bulk Operations**
    - `bulkImport()` — streaming CSV/XLSX parser, all-or-nothing validation, batch insert
    - `bulkExport()` — filtered export with optional PII inclusion
    - Max row limit enforcement (`PEOPLE_MAX_IMPORT_ROWS`)

15. **Client-Side: React Hooks & Components**
    - `usePeopleDirectory` hook — search, filter, paginate
    - `usePersonProfile` hook — fetch and update profiles
    - `useOrgChart` hook — org chart data with lazy-loading
    - `useTeams` hook — team management
    - `PeopleDirectoryTable` component — searchable, sortable directory
    - `PersonProfileCard` component — profile display with edit mode
    - `OrgChartViewer` component — interactive org chart visualization
    - `TeamRoster` component — team member listing
    - `PeopleDashboard` component — HR overview dashboard

#### Deliverables
- 13 database tables total (6 directory + 7 org)
- Full org structure management with matrix support
- Org chart visualization with materialized views
- Headcount planning with approval workflow
- Skill management with endorsements
- GDPR compliance (DSAR + right to erasure)
- Bulk import/export
- 4 React hooks + 5 React components
- Full test coverage for Phase 1

---

## Phase 2 — Core Modules

**Duration:** 8 weeks
**Goal:** Deliver the four core operational modules: Hiring (ATS), Leave Management, Onboarding, and Time & Attendance.

### Week 5-6: Hiring / ATS

#### Tasks

16. **Drizzle Schema: Hiring Tables (10 tables)**
    - `people_requisitions` — Job requisitions with approval gates
    - `people_job_postings` — Public job postings for career page
    - `people_candidates` — Deduplicated candidate profiles
    - `people_applications` — Application records with pipeline tracking
    - `people_interviews` — Interview session scheduling
    - `people_interview_scorecards` — Structured scorecards
    - `people_offers` — Offer generation and tracking
    - `people_hiring_pipelines` — Custom pipeline definitions
    - `people_hiring_pipeline_stages` — Stage definitions with auto-actions
    - `people_referrals` — Employee referral tracking
    - Run migration, apply RLS

17. **HiringService — Requisition Flow**
    - `createRequisition()` — with auto-numbering (REQ-2026-000012)
    - `submitForApproval()` — triggers `@mcv/shared` approval workflow
    - `approveRequisition()` — requires hiring manager + finance sign-off
    - Budget validation against headcount plans

18. **HiringService — Job Postings**
    - `createJobPosting()` — from approved requisition
    - `publishJobPosting()` — makes posting live on career page
    - `closeJobPosting()` — closes to new applications
    - `getCareerPagePostings()` — public-safe API (sanitized data)
    - Career page slug generation and uniqueness

19. **HiringService — Applications & Pipeline**
    - `submitApplication()` — with candidate deduplication by email
    - Auto-application numbering (APP-2026-000345)
    - `moveToStage()` — pipeline stage advancement with scorecard validation
    - `rejectApplication()` — with reason tracking
    - Auto-stage actions (send acknowledgment email, etc.)
    - Pipeline state machine enforcement

20. **HiringService — Interviews & Scorecards**
    - `scheduleInterview()` — with calendar event creation via `@mcv/shared`
    - `rescheduleInterview()`, `cancelInterview()`
    - `submitScorecard()` — structured rating with criteria
    - Scorecard requirement enforcement before stage advancement

21. **HiringService — Offers & Conversion**
    - `createOffer()` — with compensation package details
    - `submitOfferForApproval()`, `approveOffer()`, `sendOffer()`
    - `recordOfferResponse()` — accepted/declined tracking
    - **`convertToEmployee()`** — atomic transaction:
      1. Create person record in directory
      2. Assign to department/team
      3. Trigger onboarding plan creation
      4. Initialize leave balances
      5. Update requisition filledCount
    - Auto-numbering for offers (OFR-2026-000015)

22. **Hiring Analytics**
    - `getHiringAnalytics()` — open reqs, applications, time-to-fill, offer acceptance rate
    - `getPipelineMetrics()` — conversion rates per stage
    - `getTimeToFill()` — average days from open to fill

23. **Client-Side: Hiring Components**
    - `useRequisitions`, `useApplications`, `useInterviews` hooks
    - `RequisitionBoard` — Kanban board for requisitions
    - `ApplicationKanban` — Pipeline view for applications
    - `InterviewScheduler` — Calendar-based scheduling
    - `ScorecardForm` — Structured interviewer scorecard
    - `OfferLetterEditor` — Offer letter composition tool

### Week 7-8: Leave Management

#### Tasks

24. **Drizzle Schema: Leave Tables (7 tables)**
    - `people_leave_policies` — Policy definitions per jurisdiction
    - `people_leave_policy_rules` — Per-type accrual/entitlement rules with tenure tiers
    - `people_leave_requests` — Leave request records
    - `people_leave_balances` — Current leave balances (pre-computed)
    - `people_leave_accrual_logs` — Accrual audit trail
    - `people_leave_blockout_dates` — Company blackout periods
    - `people_public_holidays` — Jurisdiction-specific public holidays
    - Run migration, apply RLS

25. **LeaveService — Policy Engine**
    - `createLeavePolicy()` — with per-type rules, tenure tiers, carry-over config
    - `getApplicablePolicy()` — jurisdiction matching (most specific wins: US-CA > US > default)
    - `assignPolicy()` — assign policy to a person
    - Seed default policies for supported jurisdictions (US, US-CA, CA-ON, GB, DE, AU, IN, JP)

26. **LeaveService — Request Flow**
    - `createLeaveRequest()` — with comprehensive validation:
      - Balance check (available ≥ requested days)
      - Overlap detection (no conflict with existing approved leave)
      - Blackout date enforcement
      - Advance notice requirement
      - Documentation requirement (e.g., doctor's note)
      - Half-day support (first_half / second_half)
    - `approveLeaveRequest()` — move days from pending to used, create calendar event
    - `rejectLeaveRequest()` — restore pending balance
    - `cancelLeaveRequest()` — restore balance
    - Auto-numbering (LV-2026-000123)
    - Work delegation notification

27. **LeaveService — Balance Management**
    - `getLeaveBalances()` — pre-computed balances per type per year
    - `adjustBalance()` — manual HR adjustments with audit log
    - Balance formula: `available = entitled + carriedOver + accrued + adjustment - used - pending`
    - Balance initialization for new hires (pro-rated based on hire date)

28. **LeaveService — Accrual Processing**
    - `runAccruals()` — cron job processing for accrual-based policies
    - Tenure-tier calculation (auto-upgrade entitlement based on years of service)
    - Accrual log with running balance for audit trail
    - Cron registration: daily 01:00

29. **LeaveService — Year-End Processing**
    - `processYearEndCarryOver()` — calculate unused, apply carry-over limits, forfeit excess
    - Create next-year balances with carried-over amounts
    - Forfeiture logging and notification

30. **LeaveService — Holidays & Blackouts**
    - `getPublicHolidays()` — by jurisdiction and year
    - `createBlockoutDate()` — company/department blackout periods
    - `checkAvailability()` — pre-check before request submission
    - Seed public holiday data for 2026-2027 for all supported jurisdictions

31. **Client-Side: Leave Components**
    - `useLeaveRequests`, `useLeaveBalances` hooks
    - `LeaveCalendar` — team leave calendar view
    - `LeaveRequestForm` — leave request submission with validation
    - `LeaveBalanceWidget` — balance summary with visual indicators

### Week 9-10: Onboarding

#### Tasks

32. **Drizzle Schema: Onboarding Tables (8 tables)**
    - `people_onboarding_checklists` — Reusable templates
    - `people_onboarding_checklist_items` — Template items with dependencies
    - `people_onboarding_plans` — Plan instances per new hire
    - `people_onboarding_tasks` — Individual task instances
    - `people_onboarding_documents` — Required document collection
    - `people_onboarding_equipment` — Equipment provisioning
    - `people_onboarding_access_requests` — System access setup
    - `people_onboarding_milestones` — 30/60/90-day milestones
    - Run migration, apply RLS

33. **OnboardingService — Template Management**
    - `createChecklist()` — template with categorized items and dependencies
    - `updateChecklist()` — versioned updates
    - Auto-selection logic: match by department + employment type → fallback to default
    - Seed default checklists (Standard Engineering, Standard Operations, Contractor, Intern)

34. **OnboardingService — Plan Lifecycle**
    - `createOnboardingPlan()` — auto-generate from template:
      - Instantiate all tasks with calculated due dates (`startDate + dueOffsetDays`)
      - Pre-start tasks (negative offset, due before day 1)
      - Auto-create 30/60/90-day milestones
      - Auto-create equipment and access requests from template
    - Progress tracking: `completedTasks / totalTasks = progressPercent`
    - Auto-complete plan when all required tasks are done

35. **OnboardingService — Task Management**
    - `completeTask()` — with dependency checking (`PPL_010`)
    - `skipTask()` — non-required only
    - `blockTask()` — with reason
    - `reassignTask()` — change assignee
    - `getMyTasks()` — cross-plan task list for any person
    - Overdue detection cron (daily): mark `isOverdue = true`, send notifications

36. **OnboardingService — Document, Equipment & Access**
    - Document upload, verification, and rejection workflow
    - Equipment provisioning lifecycle: requested → ordered → shipped → delivered → configured → assigned
    - Access request lifecycle: pending → approved → provisioned (or denied)
    - Integration stubs for IT provisioning automation

37. **OnboardingService — Milestones**
    - `completeMilestone()` — manager + new hire + buddy feedback
    - Milestone due notification (3 days before)
    - Milestone summary with goal tracking

38. **Client-Side: Onboarding Components**
    - `useOnboarding` hook
    - `OnboardingChecklist` — interactive task checklist with progress bar
    - `OnboardingDashboard` — overview of all active onboarding plans

### Week 11-12: Time & Attendance

#### Tasks

39. **Drizzle Schema: Time Tables (6 tables)**
    - `people_time_entries` — Individual time entries (with partitioning by quarter)
    - `people_timesheets` — Weekly/biweekly timesheet headers
    - `people_timesheet_lines` — Daily breakdown
    - `people_time_projects` — Project time allocation config
    - `people_overtime_rules` — Jurisdiction-specific overtime rules
    - `people_payroll_feeds` — Generated payroll integration feeds
    - Run migration, apply RLS, set up table partitioning

40. **TimeService — Time Entry Management**
    - `createTimeEntry()` — manual time logging with project/task allocation
    - `startTimer()` / `stopTimer()` — live clock-in/out timer
    - `updateTimeEntry()` / `deleteTimeEntry()` — edit/remove (if not locked)
    - Billable/non-billable classification
    - External reference linking (Jira, GitHub)

41. **TimeService — Timesheet Workflow**
    - `createTimesheet()` — auto-populate from time entries for period
    - `submitTimesheet()` — manager approval submission
    - `approveTimesheet()` — lock entries, calculate overtime
    - `rejectTimesheet()` — unlock entries with rejection reason
    - `getPendingApprovals()` — manager's approval queue
    - Timesheet reminder cron (Friday 09:00)

42. **TimeService — Overtime Calculation**
    - `calculateOvertime()` — jurisdiction-aware calculation engine:
      - Daily threshold (e.g., 8 hours → OT)
      - Weekly threshold (e.g., 40 hours → OT)
      - Double-time (California-specific: 12 hours daily)
      - Weekend and holiday multipliers
      - Exempt employment type handling
    - Seed overtime rules for supported jurisdictions

43. **TimeService — Payroll Feed Generation**
    - `generatePayrollFeed()` — aggregate approved timesheets with overtime
    - Multiple format support: CSV, JSON, ADP, Gusto, Paychex
    - `confirmPayrollFeed()` — lock feed after sending to payroll
    - Background job execution with progress tracking

44. **TimeService — Analytics & Reporting**
    - `getUtilizationRate()` — billable vs total hours per person
    - `getTeamUtilization()` — team-level utilization dashboard
    - `getBillableReport()` — grouped by person/department/project
    - `getProjectTimeReport()` — hours logged per project with budget tracking
    - `getProjectBudgetUtilization()` — budget burn-down

45. **Client-Side: Time Components**
    - `useTimesheets`, `useTimeEntries` hooks
    - `TimesheetGrid` — weekly/biweekly entry grid with project rows
    - `TimeTracker` — live timer with start/stop and project selection

---

## Phase 3 — Advanced Features

**Duration:** 6 weeks
**Goal:** Deliver performance management, learning management, AI-powered features, and cross-venture analytics.

### Week 13-15: Performance Management

#### Tasks

46. **Drizzle Schema: Performance Tables (14 tables)**
    - `people_review_cycles` — Review cycle definitions
    - `people_reviews` — Individual review submissions
    - `people_review_questions` — Question templates
    - `people_review_responses` — Per-question answers
    - `people_goals` — OKR/KPI goals
    - `people_goal_key_results` — Key results for OKRs
    - `people_feedback_entries` — Continuous feedback
    - `people_one_on_ones` — 1-on-1 meeting records
    - `people_one_on_one_agenda_items` — Agenda items
    - `people_pips` — Performance improvement plans
    - `people_pip_milestones` — PIP milestones
    - `people_calibration_sessions` — Rating calibration
    - `people_calibration_ratings` — Per-person calibration entries
    - `people_competency_frameworks` / `people_competency_levels` — Competency definitions
    - Run migration, apply RLS

47. **PerformanceService — Review Cycles**
    - `createReviewCycle()` — configure types, deadlines, questions, participant filters
    - `launchReviewCycle()` — auto-create review assignments for participants
    - `submitReview()` — validate cycle status, store responses
    - 360° data aggregation: self, manager, peer, upward reviews
    - Review reminder cron (daily 09:00)
    - `get360Feedback()` — aggregated feedback with anonymized peer/upward data

48. **PerformanceService — Goal Management**
    - `createGoal()` — OKR/KPI with optional key results
    - Goal cascading: company → department → team → individual
    - `updateGoalProgress()` — auto-status determination (on_track, at_risk, behind)
    - Key result tracking with current vs target value
    - Goal alignment visualization

49. **PerformanceService — Continuous Feedback**
    - `submitFeedback()` — recognition, constructive, general
    - Public/private visibility toggle
    - Skill and goal linkage
    - Feedback wall: chronological feed of public feedback

50. **PerformanceService — 1-on-1 Tracking**
    - `createOneOnOne()` — schedule with agenda items
    - Action item tracking with assignments and due dates
    - Meeting notes with privacy controls

51. **PerformanceService — PIPs**
    - `createPip()` — structured improvement plan with milestones
    - Milestone check-ins with progress tracking
    - PIP outcome recording (improved, extended, terminated)

52. **PerformanceService — Calibration**
    - `createCalibrationSession()` — cross-team rating normalization
    - `addCalibrationRatings()` — per-person ratings by calibrators
    - Session facilitation tools: compare ratings, identify outliers
    - Finalization: normalized ratings applied to reviews

53. **Client-Side: Performance Components**
    - `usePerformanceReviews`, `useGoals`, `useFeedback` hooks
    - `ReviewForm` — multi-question review submission
    - `GoalTracker` — OKR/KPI progress visualization
    - `FeedbackWall` — team feedback stream
    - `OneOnOneNotes` — meeting notes editor with action items

### Week 16-18: Learning Management & AI Features

#### Tasks

54. **Drizzle Schema: Learning Tables (12 tables)**
    - `people_courses` — Course definitions
    - `people_course_modules` — Module/lesson structure
    - `people_course_enrollments` — Enrollment records
    - `people_course_completions` — Completion records with scores
    - `people_learning_paths` — Curated learning paths
    - `people_learning_path_courses` — Path → course links
    - `people_certifications` — Certification definitions
    - `people_person_certifications` — Issued certifications
    - `people_training_budgets` — Budget allocations
    - `people_training_budget_allocations` — Spend tracking
    - `people_skill_gap_analyses` — Gap analysis records
    - `people_compliance_training_requirements` — Mandatory training
    - Run migration, apply RLS

55. **LearningService — Course Management**
    - `createCourse()` — with module structure, prerequisites
    - `publishCourse()` / `archiveCourse()` — lifecycle management
    - SCORM/xAPI content support (via iFrame integration)
    - Course catalog with filtering, search, and recommendations

56. **LearningService — Enrollment & Completion**
    - `enrollInCourse()` — self-enrollment or manager-assigned
    - Progress tracking per module
    - `recordCompletion()` — with score, feedback, rating
    - Certificate generation on completion (for qualifying courses)

57. **LearningService — Learning Paths**
    - `createLearningPath()` — sequenced courses with prerequisites
    - Role-based path recommendations
    - Path completion tracking

58. **LearningService — Certifications**
    - `issueCertification()` — with expiry and verification
    - Certification renewal tracking
    - Expiry alert cron (daily 06:00)
    - Verification code generation for external validation

59. **LearningService — Compliance & Skill Gaps**
    - Mandatory training assignment with deadline enforcement
    - Compliance status dashboard
    - `analyzeSkillGaps()` — position requirements vs current skills
    - Course recommendations based on gap analysis
    - Training budget tracking per person/department

60. **AI-Powered Features (OpenRouter Integration)**
    - **AI Resume Screening** — Parse and score resumes against requisition requirements
    - **AI Talent Insights** — Identify flight risk, promotion readiness, skill trends
    - **AI Skill Matching** — Match internal candidates to open requisitions
    - **AI Course Recommendations** — Personalized learning suggestions based on career goals
    - **AI Buddy Matching** — Match new hires with compatible buddies
    - Feature-flagged: all AI features disabled by default, opt-in per venture

61. **Cross-Venture HR Analytics**
    - Workforce analytics materialized views:
      - Headcount by venture/department/employment type
      - Attrition rate and trends
      - Time-to-fill metrics
      - Leave utilization
      - Time utilization and billable ratios
      - Performance distribution
      - Learning completion rates
    - Analytics API for `@mcv/analytics` consumption
    - Super-admin only: cross-venture aggregation (anonymized)

62. **Client-Side: Learning Components**
    - `useLearningCatalog`, `useEnrollments`, `useCertifications` hooks
    - `LearningCatalog` — course catalog browser with search and filters
    - `CoursePlayer` — course content player (video, document, quiz viewer)
    - `CertificationBadge` — certification display badge

---

## Phase 4 — Polish & Hardening

**Duration:** 3 weeks
**Goal:** Production readiness — comprehensive testing, performance optimization, security audit, documentation, and deployment preparation.

### Week 19: Testing & Quality

#### Tasks

63. **Unit Test Completion**
    - Achieve ≥ 90% code coverage across all 8 service classes
    - Test all error paths and edge cases
    - PII encryption/decryption round-trip tests
    - Zod schema validation edge cases
    - Balance calculation precision tests (leave, time)

64. **Integration Test Suite**
    - Full hire-to-active workflow test (requisition → posting → application → interview → offer → convert → onboard)
    - Leave request lifecycle with accrual and carry-over
    - Timesheet submission and payroll feed generation
    - Performance review cycle end-to-end
    - Course enrollment through completion and certification
    - Multi-tenant isolation verification
    - GDPR DSAR and deletion cascade

65. **End-to-End Tests**
    - Career page: browse postings → apply → receive confirmation
    - Employee self-service: view profile → request leave → submit timesheet → set goals
    - Manager workflows: approve leave → approve timesheet → submit review → view team dashboard
    - HR admin: bulk import → create policy → generate payroll feed → run reports

66. **Load Testing**
    - Directory search: < 100ms with 50,000 records
    - Org chart render: < 500ms for 5-level hierarchy
    - Concurrent leave requests: 100 simultaneous submissions
    - Bulk import: 5,000 records < 60s
    - Payroll feed generation: 10,000 employees < 120s

### Week 20: Security & Performance

#### Tasks

67. **Security Audit**
    - PII encryption verification: all classified fields encrypted in database
    - RLS policy audit: verify venture isolation on all 60+ tables
    - RBAC permission matrix verification against specification
    - PII access audit log verification: every read logged
    - Penetration testing: SQL injection, XSS, IDOR, privilege escalation
    - Data retention enforcement verification
    - GDPR compliance checklist sign-off

68. **Performance Optimization**
    - Index audit: verify all query plans use indexes
    - Add missing indexes based on slow query analysis
    - Materialized view refresh optimization
    - Redis cache implementation for hot paths (career page, org chart, policies, holidays)
    - Connection pool tuning (PgBouncer)
    - Query optimization for complex joins (hiring pipeline, 360 reviews)

69. **Observability Setup**
    - Structured logging audit: verify all operations logged with correlation IDs
    - Metrics implementation: latency histograms, counters, gauges
    - Health check endpoint: `/api/people/health`
    - Alerting rules configuration (PII access spike, payroll failure, accrual errors)
    - Dashboard creation (Grafana/DataDog)

### Week 21: Documentation & Deployment

#### Tasks

70. **Documentation Finalization**
    - API Reference review and completeness check
    - Inline code documentation (TSDoc) for all public interfaces
    - Migration guide for ventures onboarding to the people module
    - Administrator guide: policy setup, cron configuration, data seeding
    - User guide: employee self-service features

71. **Deployment Preparation**
    - Deployment checklist validation (encryption key, migrations, RLS, crons, Redis, events, feature flags)
    - Seed data scripts: public holidays, default leave policies, default onboarding checklists, default hiring pipeline
    - Feature flag configuration per venture
    - Rollback plan documentation
    - Run full regression test suite

72. **Soft Launch**
    - Deploy to staging environment
    - Internal dogfooding with the MCV team
    - Collect feedback, fix critical issues
    - Production deployment with feature flags

---

## Testing Strategy

### Test Pyramid

```
         ╱╲
        ╱  ╲
       ╱ E2E╲           5-10 critical user journeys
      ╱──────╲
     ╱        ╲
    ╱Integration╲       30-50 cross-module workflows
   ╱────────────╲
  ╱              ╲
 ╱   Unit Tests   ╲     200+ service method tests
╱──────────────────╲
```

### Test Categories

| Category | Count | Tools | Coverage Target |
|---|---|---|---|
| **Unit** | 200+ | Vitest | ≥ 90% code coverage |
| **Integration** | 30-50 | Vitest + test database | All cross-module flows |
| **E2E** | 5-10 | Playwright | Critical user journeys |
| **Load** | 5-8 | k6 | Performance targets met |
| **Security** | 10-15 | Manual + OWASP ZAP | All OWASP Top 10 checked |

### Key Test Scenarios

```typescript
// Unit: Leave balance validation
describe('LeaveService.createLeaveRequest', () => {
  it('should reject when balance insufficient', async () => {
    const person = await createTestPerson({ leaveBalance: { vacation: 2 } });
    await expect(leaveService.createLeaveRequest({
      personId: person.id,
      leaveType: 'vacation',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-05'), // 5 days, only 2 available
    })).rejects.toThrow('PPL_004');
  });

  it('should reject when overlapping with existing leave', async () => {
    // ... existing approved leave Mar 3-5
    await expect(leaveService.createLeaveRequest({
      // ... requesting Mar 4-6 (overlaps)
    })).rejects.toThrow('PPL_005');
  });
});

// Integration: Hire-to-active workflow
describe('HiringPipeline → Directory → Onboarding', () => {
  it('should convert offer to employee with onboarding', async () => {
    const req = await hiringService.createRequisition({ ... });
    await hiringService.approveRequisition(req.id);
    const posting = await hiringService.createJobPosting({ requisitionId: req.id, ... });
    await hiringService.publishJobPosting(posting.id);
    const app = await hiringService.submitApplication({ requisitionId: req.id, ... });
    await hiringService.moveToStage(app.id, 'interview');
    const interview = await hiringService.scheduleInterview({ applicationId: app.id, ... });
    await hiringService.submitScorecard(interview.id, { ... });
    const offer = await hiringService.createOffer({ applicationId: app.id, ... });
    await hiringService.approveOffer(offer.id);
    await hiringService.sendOffer(offer.id);
    await hiringService.recordOfferResponse(offer.id, 'accepted');

    const { person, onboardingPlan } = await hiringService.convertToEmployee(offer.id);

    expect(person.status).toBe('pending');
    expect(person.employeeNumber).toMatch(/^EMP-\d{6}$/);
    expect(onboardingPlan.status).toBe('not_started');
    expect(onboardingPlan.totalTasks).toBeGreaterThan(0);

    // Verify leave balances initialized
    const balances = await leaveService.getLeaveBalances(person.id);
    expect(balances.length).toBeGreaterThan(0);
  });
});

// Security: RLS isolation
describe('Multi-Tenant Isolation', () => {
  it('should not allow Venture A to see Venture B people', async () => {
    const personA = await createTestPerson({ ventureId: 'venture-a' });
    const personB = await createTestPerson({ ventureId: 'venture-b' });

    const ctx = createTestContext({ ventureId: 'venture-a' });
    const results = await directoryService.listPeople({}, { ctx });

    expect(results.data.map(p => p.id)).toContain(personA.id);
    expect(results.data.map(p => p.id)).not.toContain(personB.id);
  });
});
```

---

## Acceptance Criteria

### Module-Level Criteria

| Module | Acceptance Criteria |
|---|---|
| **Directory** | Create/update/search persons with PII encryption verified, bulk import 1000 records < 30s, GDPR DSAR generates complete export, soft delete with PII erasure works across all modules |
| **Org** | Department hierarchy renders correctly for 5+ levels, matrix reporting lines (solid + dotted) work, org chart loads < 500ms, headcount summary matches actual count, circular reporting line detection works |
| **Hiring** | Full pipeline from requisition to hire works end-to-end, candidate deduplication by email works, scorecard requirements enforce before stage advancement, offer-to-employee conversion is atomic, career page API returns only published sanitized postings |
| **Onboarding** | Plan auto-generates from template on hire conversion, task dependencies enforce completion order, overdue detection cron marks tasks correctly, progress percentage is accurate, 30/60/90 milestones auto-created |
| **Leave** | Multi-jurisdiction policies apply correctly (US, CA, GB, DE), balance calculation is accurate to 0.01 days, accrual cron processes all active employees, year-end carry-over respects limits and forfeits excess, blackout dates block leave requests, half-day requests calculate correctly |
| **Time** | Time entries log correctly with project allocation, timesheet approval locks entries, overtime calculation matches jurisdiction rules (daily/weekly/double-time), payroll feed generates in all formats (CSV, ADP, Gusto), timer start/stop calculates accurate hours |
| **Performance** | 360° review cycle collects self/manager/peer/upward reviews, goal cascading (company → individual) works, continuous feedback is delivered in real-time, PIP milestones track and alert correctly, calibration session normalizes ratings |
| **Learning** | Course enrollment through completion works, certification issuance with expiry tracking works, compliance training deadline enforcement works, skill gap analysis produces actionable recommendations |

### Cross-Cutting Criteria

| Criteria | Target |
|---|---|
| **Test Coverage** | ≥ 90% unit test code coverage across all modules |
| **Performance** | All latency targets met (see Performance section) |
| **Security** | Zero PII leaks in security audit, all RLS policies verified |
| **Multi-Tenancy** | Zero cross-venture data leakage in isolation tests |
| **GDPR** | DSAR generates complete export, right to erasure cascades correctly |
| **Events** | All 40+ domain events publish correctly with complete payloads |
| **Error Handling** | All 15 error codes return correct HTTP status and structured response |
| **Documentation** | API reference is complete and accurate for all public methods |

---

## Risks & Mitigations

| # | Risk | Impact | Probability | Mitigation |
|---|---|---|---|---|
| **R1** | PII encryption adds significant query latency | High | Medium | Encrypt only classified fields, use separate encrypted columns, benchmark early in Phase 1 |
| **R2** | Multi-jurisdiction leave policies are more complex than estimated | Medium | High | Start with 3 jurisdictions (US, CA-ON, GB), add others incrementally; build policy engine to be extensible |
| **R3** | Org chart materialized view refresh causes lock contention | Medium | Medium | Use `CONCURRENTLY` refresh, schedule during low-traffic windows, add cache layer |
| **R4** | 60+ tables with RLS creates migration complexity | Medium | Medium | Automate RLS policy generation from schema metadata, create migration test suite |
| **R5** | Overtime calculation rules vary significantly by jurisdiction | High | High | Build a rule engine with jurisdiction configs, not hardcoded logic; validate with payroll experts |
| **R6** | GDPR deletion cascade across 60+ tables is error-prone | High | Medium | Build deletion registry mapping person ID to all referencing tables; test cascade with integration tests for each module |
| **R7** | Bulk import at scale (5000+ records) may timeout | Medium | Medium | Implement streaming parser, batch inserts, background job with progress tracking |
| **R8** | AI features (resume screening, talent insights) produce biased results | High | Medium | Human-in-the-loop for all AI decisions, bias monitoring, explainability logging, feature flags to disable |
| **R9** | Upstream dependency (@mcv/identity, @mcv/fabric) instability blocks progress | High | Low | Define clear interface contracts early, use mock implementations for development, integration test against real services weekly |
| **R10** | Scope creep from stakeholder feature requests during implementation | Medium | High | Strict phase boundaries, change request process, defer non-essential features to post-launch |

---

## Timeline

```
2026
Feb         Mar         Apr         May         Jun         Jul
│           │           │           │           │           │
▼           ▼           ▼           ▼           ▼           ▼

├── Phase 1: Foundation (4 weeks) ─────────────────────────────┤
│   W1-2: Directory Schema + Service + PII + RLS               │
│   W3-4: Org Structure + Extensions + GDPR + Bulk             │
├──────────────────────────────────────────────────────────────┤

            ├── Phase 2: Core Modules (8 weeks) ──────────────────────────────┤
            │   W5-6: Hiring / ATS                                             │
            │   W7-8: Leave Management                                         │
            │   W9-10: Onboarding                                              │
            │   W11-12: Time & Attendance                                      │
            ├─────────────────────────────────────────────────────────────────┤

                                    ├── Phase 3: Advanced (6 weeks) ──────────────────────┤
                                    │   W13-15: Performance Management                     │
                                    │   W16-18: Learning + AI + Analytics                  │
                                    ├─────────────────────────────────────────────────────┤

                                                            ├── Phase 4: Polish (3 weeks) ┤
                                                            │   W19: Testing & QA          │
                                                            │   W20: Security & Perf       │
                                                            │   W21: Docs & Deploy         │
                                                            ├─────────────────────────────┤

Key Milestones:
  ● Week 4:  Foundation complete — directory + org operational
  ● Week 8:  Hiring ATS live — can post jobs and process applications
  ● Week 12: Core HR live — leave, onboarding, time all operational
  ● Week 18: Full feature set — performance, learning, AI features
  ● Week 21: Production ready — tested, secured, documented, deployed
```

### Milestone Summary

| Week | Milestone | Key Deliverable |
|---|---|---|
| 4 | **Foundation Complete** | Person directory, org structure, PII encryption, RLS, 13 tables |
| 6 | **ATS Operational** | Full hiring pipeline from requisition to offer, 23 tables |
| 8 | **Leave Management Live** | Multi-jurisdiction leave with accruals, 30 tables |
| 10 | **Onboarding Launched** | Template-based onboarding with automation, 38 tables |
| 12 | **Core HR Complete** | Time tracking, timesheets, payroll feeds, 44 tables |
| 15 | **Performance Management** | 360° reviews, goals, feedback, PIPs, 58 tables |
| 18 | **Full Feature Set** | LMS, certifications, AI features, analytics, 70 tables |
| 21 | **Production Ready** | Tested, secured, optimized, documented, deployed |

---

*@mcv/people — People & HR Management Domain*
