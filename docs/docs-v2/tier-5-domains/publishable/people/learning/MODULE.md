# @mcv/people/learning

> Learning & Development — Course management, training programs, skill development, compliance tracking, and learning analytics for the MCV.ONE platform.

```
Status: Stable
Since: 0.9.0
Layer: Tier 5 — Domain Modules
Platform: Web, Mobile, API
Maintainer: MCV People Team
```

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

`@mcv/people/learning` is the Learning & Development (L&D) submodule of the MCV.ONE People suite. It provides a full-featured Learning Management System (LMS) that enables organizations to create, deliver, track, and analyze learning content across their workforce.

### Why This Module Exists

Organizations face critical challenges in workforce development:

1. **Compliance Risk** — Regulatory training must be tracked, enforced, and auditable. Missing a deadline can mean fines, lawsuits, or operational shutdowns.
2. **Skill Gaps** — As technology and markets evolve, employees need continuous upskilling. Without systematic tracking, organizations fly blind on workforce capabilities.
3. **Onboarding Efficiency** — New hires need structured learning paths to become productive. Ad-hoc training wastes time and produces inconsistent outcomes.
4. **Budget Accountability** — L&D budgets are significant investments. Without ROI tracking, organizations cannot justify or optimize spending.
5. **Knowledge Retention** — Institutional knowledge must be captured, structured, and made accessible. When experts leave, their knowledge shouldn't leave with them.

### What This Module Does

- **Course Catalog & Enrollment** — Centralized catalog of all learning content with self-enrollment, manager assignment, and prerequisite enforcement
- **Learning Paths** — Structured sequences of courses that guide employees through role-based or skill-based curricula
- **Compliance Training** — Mandatory training assignments with due dates, automated reminders, escalation chains, and completion certificates
- **Content Delivery** — Support for video courses, SCORM 1.2/2004 and xAPI packages, documents, quizzes, interactive modules, and external URL content
- **Skill Gap Analysis** — Compare employee competencies against role requirements, recommend learning to close gaps, and track progress over time
- **Development Plans** — Individual development plans (IDPs) linking career goals to specific learning activities and milestones
- **Social Learning** — Discussion forums, peer reviews, mentorship matching, and study groups to foster collaborative learning
- **Budget & Approvals** — Per-employee and per-department learning budgets with course request/approval workflows and vendor management
- **Manager Tools** — Team learning dashboards, training assignment, progress tracking, and budget management
- **Analytics & Reporting** — Completion rates, training hours, skill development progress, ROI analysis, and compliance status dashboards
- **External Integrations** — Connect to LinkedIn Learning, Udemy Business, Coursera, and other providers via SSO-based content access

### Design Principles

1. **Learner-Centric** — The learner experience drives design decisions. Friction-free enrollment, mobile-first content delivery, and personalized recommendations.
2. **Compliance-First** — Compliance training is treated as a first-class concern with dedicated workflows, escalation, and audit trails.
3. **Multi-Tenant Isolation** — All data is tenant-scoped via Row-Level Security. One organization's learning data is never visible to another.
4. **Content Agnostic** — The system handles any content type (video, SCORM, xAPI, documents, quizzes, external URLs) through a unified content abstraction.
5. **Manager Empowerment** — Managers have full visibility into their team's learning progress without needing HR intervention.
6. **Measurable Impact** — Every learning activity is tracked and linked to skill development outcomes, enabling ROI analysis.

---

## Exports

```typescript
// === Primary Service ===
export { LearningService } from './services/learning.service';
export { createLearningRouter } from './routers/learning.router';

// === Course Management ===
export { CourseService } from './services/course.service';
export { CourseContentService } from './services/course-content.service';
export { CourseCatalogService } from './services/course-catalog.service';
export { QuizService } from './services/quiz.service';
export { ScormRuntimeService } from './services/scorm-runtime.service';
export { XApiService } from './services/xapi.service';

// === Enrollment & Progress ===
export { EnrollmentService } from './services/enrollment.service';
export { ProgressTrackingService } from './services/progress-tracking.service';
export { CompletionService } from './services/completion.service';
export { CertificateService } from './services/certificate.service';

// === Learning Paths ===
export { LearningPathService } from './services/learning-path.service';
export { PathEnrollmentService } from './services/path-enrollment.service';
export { PathProgressService } from './services/path-progress.service';

// === Compliance Training ===
export { ComplianceTrainingService } from './services/compliance-training.service';
export { ComplianceAssignmentService } from './services/compliance-assignment.service';
export { ComplianceEscalationService } from './services/compliance-escalation.service';
export { ComplianceReportingService } from './services/compliance-reporting.service';

// === Skills & Development ===
export { SkillFrameworkService } from './services/skill-framework.service';
export { SkillGapService } from './services/skill-gap.service';
export { DevelopmentPlanService } from './services/development-plan.service';
export { CareerPathingService } from './services/career-pathing.service';
export { CompetencyService } from './services/competency.service';

// === Social Learning ===
export { DiscussionService } from './services/discussion.service';
export { PeerReviewService } from './services/peer-review.service';
export { MentorshipService } from './services/mentorship.service';
export { StudyGroupService } from './services/study-group.service';

// === Budget & Approvals ===
export { LearningBudgetService } from './services/learning-budget.service';
export { CourseApprovalService } from './services/course-approval.service';
export { VendorService } from './services/vendor.service';

// === Analytics & Reporting ===
export { LearningAnalyticsService } from './services/learning-analytics.service';
export { CompletionReportService } from './services/completion-report.service';
export { ROIAnalysisService } from './services/roi-analysis.service';
export { ComplianceStatusService } from './services/compliance-status.service';

// === External Integrations ===
export { LinkedInLearningProvider } from './providers/linkedin-learning.provider';
export { UdemyBusinessProvider } from './providers/udemy-business.provider';
export { CourseraProvider } from './providers/coursera.provider';
export { ExternalContentResolver } from './services/external-content.service';

// === Manager Tools ===
export { TeamLearningDashboard } from './services/team-learning-dashboard.service';
export { TrainingAssignmentService } from './services/training-assignment.service';
export { TeamBudgetService } from './services/team-budget.service';

// === Database Schemas ===
export {
  courses,
  courseContent,
  enrollments,
  courseCompletions,
  learningPaths,
  pathCourses,
  pathEnrollments,
  complianceAssignments,
  skillFrameworks,
  skillLevels,
  employeeSkills,
  developmentPlans,
  developmentPlanItems,
  learningBudgets,
  budgetTransactions,
  learningActivities,
  discussions,
  discussionPosts,
  peerReviews,
  mentorships,
  studyGroups,
  studyGroupMembers,
  quizzes,
  quizQuestions,
  quizAttempts,
  certificates,
  courseApprovals,
  vendors,
  vendorCourses,
  courseRatings,
  courseBookmarks,
  learningNotifications,
} from './schemas';

// === Types ===
export type {
  Course,
  CourseInsert,
  CourseContent,
  CourseContentInsert,
  Enrollment,
  EnrollmentInsert,
  CourseCompletion,
  LearningPath,
  LearningPathInsert,
  PathCourse,
  PathEnrollment,
  ComplianceAssignment,
  ComplianceAssignmentInsert,
  SkillFramework,
  SkillLevel,
  EmployeeSkill,
  DevelopmentPlan,
  DevelopmentPlanInsert,
  DevelopmentPlanItem,
  LearningBudget,
  BudgetTransaction,
  LearningActivity,
  Discussion,
  DiscussionPost,
  PeerReview,
  Mentorship,
  StudyGroup,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  Certificate,
  CourseApproval,
  Vendor,
  VendorCourse,
  CourseRating,
  LearningNotification,
  SkillGap,
  LearningAnalytics,
  ComplianceStatus,
  ROIMetrics,
  TeamLearningStats,
  ContentType,
  EnrollmentStatus,
  CompletionStatus,
  ApprovalStatus,
  ComplianceState,
  SkillProficiency,
} from './types';

// === Enums ===
export {
  ContentType,
  EnrollmentStatus,
  CompletionStatus,
  ApprovalStatus,
  ComplianceState,
  SkillProficiency,
  CourseLevel,
  CourseFormat,
  AssignmentSource,
  BudgetPeriod,
} from './enums';

// === Hooks (React) ===
export {
  useCourses,
  useCourse,
  useCourseContent,
  useEnrollment,
  useEnrollments,
  useMyEnrollments,
  useLearningPaths,
  useLearningPath,
  useComplianceAssignments,
  useMyComplianceTraining,
  useSkillGapAnalysis,
  useDevelopmentPlan,
  useLearningBudget,
  useLearningAnalytics,
  useTeamLearning,
  useCourseDiscussion,
  useCourseRatings,
  useCourseCatalog,
  useCertificates,
  useQuiz,
  useQuizAttempt,
  useMentorship,
  useStudyGroups,
  useLearningRecommendations,
} from './hooks';

// === Components (React) ===
export {
  CourseCatalog,
  CourseCard,
  CourseDetail,
  CoursePlayer,
  ScormPlayer,
  VideoPlayer,
  QuizPlayer,
  EnrollmentButton,
  ProgressBar,
  LearningPathView,
  LearningPathTimeline,
  ComplianceTrainingList,
  ComplianceBadge,
  SkillGapChart,
  SkillRadar,
  DevelopmentPlanEditor,
  LearningDashboard,
  TeamLearningDashboard as TeamLearningDashboardComponent,
  BudgetOverview,
  BudgetRequestForm,
  CertificateViewer,
  DiscussionForum,
  MentorshipFinder,
  StudyGroupCard,
  CourseRatingStars,
  LearningCalendar,
  TrainingAssignmentModal,
  CompletionCelebration,
} from './components';
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Applications                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  Learner  │  │   Manager    │  │  HR Admin │  │   L&D Admin  │  │
│  │   Portal  │  │  Dashboard   │  │  Console  │  │    Studio    │  │
│  └─────┬─────┘  └──────┬───────┘  └─────┬─────┘  └──────┬───────┘  │
└────────┼───────────────┼────────────────┼────────────────┼──────────┘
         │               │                │                │
         └───────────────┴────────┬───────┴────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      tRPC API Router       │
                    │    /api/trpc/learning.*     │
                    └─────────────┬──────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
   ┌─────▼──────┐         ┌──────▼───────┐         ┌──────▼───────┐
   │   Course    │         │  Enrollment  │         │  Compliance  │
   │  Service    │         │   Service    │         │   Service    │
   │             │         │              │         │              │
   │ • Catalog   │         │ • Enroll     │         │ • Assign     │
   │ • Content   │         │ • Progress   │         │ • Track      │
   │ • Versions  │         │ • Complete   │         │ • Escalate   │
   │ • Ratings   │         │ • Certify    │         │ • Report     │
   └─────┬───────┘         └──────┬───────┘         └──────┬───────┘
         │                        │                        │
   ┌─────▼──────┐         ┌──────▼───────┐         ┌──────▼───────┐
   │   Skills    │         │   Learning   │         │   Budget &   │
   │  Service    │         │    Path      │         │  Approvals   │
   │             │         │   Service    │         │   Service    │
   │ • Frameworks│         │              │         │              │
   │ • Gap Anlys │         │ • Paths      │         │ • Budgets    │
   │ • Dev Plans │         │ • Sequences  │         │ • Requests   │
   │ • Career    │         │ • Progress   │         │ • Vendors    │
   └─────┬───────┘         └──────┬───────┘         └──────┬───────┘
         │                        │                        │
   ┌─────▼──────┐         ┌──────▼───────┐         ┌──────▼───────┐
   │   Social    │         │  Analytics   │         │  External    │
   │  Learning   │         │   Service    │         │ Integrations │
   │             │         │              │         │              │
   │ • Forums    │         │ • Completion │         │ • LinkedIn   │
   │ • Peer Rev  │         │ • Hours      │         │ • Udemy      │
   │ • Mentors   │         │ • ROI        │         │ • Coursera   │
   │ • Groups    │         │ • Compliance │         │ • SSO/SAML   │
   └─────┬───────┘         └──────┬───────┘         └──────┬───────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Supabase PostgreSQL    │
                    │     + Storage (Content)    │
                    │     + RLS (Multi-Tenant)   │
                    └───────────────────────────┘
```

### Content Delivery Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                     Content Delivery Flow                        │
│                                                                  │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────────────┐    │
│  │  Upload   │───▶│  Content     │───▶│   Content Storage    │    │
│  │  (Admin)  │    │  Processor   │    │   (Supabase)         │    │
│  └──────────┘    │              │    │                      │    │
│                  │ • Validate   │    │  • Videos (chunked)  │    │
│                  │ • Transcode  │    │  • SCORM packages    │    │
│                  │ • Extract    │    │  • Documents (PDF)   │    │
│                  │   metadata   │    │  • Quiz definitions  │    │
│                  │ • Generate   │    │  • Thumbnails        │    │
│                  │   thumbnails │    └──────────┬───────────┘    │
│                  └─────────────┘               │                │
│                                                │                │
│  ┌──────────┐    ┌─────────────┐    ┌──────────▼───────────┐    │
│  │  Learner  │◀──│  Content     │◀──│   Content Resolver   │    │
│  │  Player   │    │  Delivery    │    │                      │    │
│  │           │    │              │    │  • Internal content  │    │
│  │ • Video   │    │ • Streaming  │    │  • External URLs     │    │
│  │ • SCORM   │    │ • SCORM API  │    │  • Provider SSO      │    │
│  │ • Quiz    │    │ • xAPI LRS   │    │  • Signed URLs       │    │
│  │ • Doc     │    │ • Progress   │    └──────────────────────┘    │
│  └──────────┘    └─────────────┘                                │
└──────────────────────────────────────────────────────────────────┘
```

### Compliance Training Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                  Compliance Training Lifecycle                      │
│                                                                    │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────────┐   │
│  │  Define  │───▶│  Assign  │───▶│  Notify  │───▶│   Track     │   │
│  │ Training │    │ to Staff │    │ Learners │    │  Progress   │   │
│  └─────────┘    └──────────┘    └──────────┘    └──────┬──────┘   │
│                                                        │          │
│                                              ┌─────────▼────────┐ │
│                                              │  Due Date Check  │ │
│                                              │   (Scheduled)    │ │
│                                              └────┬────────┬────┘ │
│                                                   │        │      │
│                                          Complete │        │ Overdue
│                                                   │        │      │
│                                    ┌──────────────▼┐  ┌────▼────┐ │
│                                    │  Certificate   │  │Escalate │ │
│                                    │  Generation    │  │         │ │
│                                    │                │  │• Remind │ │
│                                    │  • PDF cert    │  │• Manager│ │
│                                    │  • Audit log   │  │• HR     │ │
│                                    │  • Next cycle  │  │• Block  │ │
│                                    └────────────────┘  └─────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Skill Gap Analysis Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                    Skill Gap Analysis Pipeline                      │
│                                                                    │
│  ┌───────────────┐     ┌────────────────┐     ┌────────────────┐  │
│  │ Role Skill     │     │ Employee Skill  │     │   Gap Matrix   │  │
│  │ Requirements   │────▶│  Assessment     │────▶│   Calculation  │  │
│  │                │     │                 │     │                │  │
│  │ • Competency   │     │ • Self-assess   │     │ • Required vs  │  │
│  │   frameworks   │     │ • Manager eval  │     │   current      │  │
│  │ • Role mapping │     │ • Quiz scores   │     │ • Priority     │  │
│  │ • Levels       │     │ • Certifications│     │   ranking      │  │
│  └───────────────┘     └────────────────┘     └───────┬────────┘  │
│                                                       │           │
│  ┌───────────────┐     ┌────────────────┐     ┌───────▼────────┐  │
│  │  Development   │◀────│ Learning        │◀────│ Recommendation │  │
│  │  Plan          │     │ Path Match      │     │   Engine       │  │
│  │                │     │                 │     │                │  │
│  │ • Goals        │     │ • Auto-suggest  │     │ • By skill gap │  │
│  │ • Milestones   │     │ • Sequence      │     │ • By role      │  │
│  │ • Timeline     │     │ • Prereqs       │     │ • By peers     │  │
│  │ • Review dates │     │ • Duration est  │     │ • By trending  │  │
│  └───────────────┘     └────────────────┘     └────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Data Isolation

All learning data is isolated per tenant using Supabase Row-Level Security (RLS). Every table includes a `tenant_id` column, and RLS policies ensure that:

- Queries only return data belonging to the authenticated user's tenant
- Inserts automatically set `tenant_id` from the JWT claims
- Cross-tenant data access is impossible at the database level
- Superadmin queries can span tenants only via explicit service-role access

### SCORM/xAPI Runtime

The module includes a lightweight SCORM 1.2/2004 and xAPI runtime:

- **SCORM Runtime** — Implements the SCORM RTE (Run-Time Environment) API, handling `LMSInitialize`, `LMSGetValue`, `LMSSetValue`, `LMSCommit`, and `LMSFinish` calls. SCORM packages are extracted from uploaded ZIP files and served via signed URLs.
- **xAPI (Tin Can)** — Implements a basic Learning Record Store (LRS) endpoint that receives xAPI statements. Statements are validated, stored, and used for progress/completion tracking.

---

## Core Interfaces

### LearningService

The primary service orchestrating all learning operations.

```typescript
interface LearningService {
  // === Course Management ===

  /** Create a new course in the catalog */
  createCourse(input: CourseCreateInput): Promise<Course>;

  /** Update course metadata */
  updateCourse(courseId: string, input: CourseUpdateInput): Promise<Course>;

  /** Archive a course (soft delete, preserving enrollment history) */
  archiveCourse(courseId: string): Promise<void>;

  /** Publish a course, making it available in the catalog */
  publishCourse(courseId: string): Promise<Course>;

  /** Unpublish a course, hiding it from the catalog */
  unpublishCourse(courseId: string): Promise<Course>;

  /** Duplicate a course with all content */
  duplicateCourse(courseId: string, newTitle: string): Promise<Course>;

  /** Get a single course by ID */
  getCourse(courseId: string): Promise<Course | null>;

  /** Search and filter courses in the catalog */
  searchCourses(filters: CourseSearchFilters): Promise<PaginatedResult<Course>>;

  /** Get featured/recommended courses for a user */
  getRecommendedCourses(userId: string): Promise<Course[]>;

  // === Content Management ===

  /** Add content to a course (video, document, SCORM, quiz, etc.) */
  addContent(courseId: string, input: ContentCreateInput): Promise<CourseContent>;

  /** Reorder content within a course */
  reorderContent(courseId: string, contentIds: string[]): Promise<void>;

  /** Upload SCORM/xAPI package */
  uploadPackage(
    courseId: string,
    file: File,
    format: 'scorm12' | 'scorm2004' | 'xapi',
  ): Promise<CourseContent>;

  /** Get signed URL for content access */
  getContentUrl(contentId: string, userId: string): Promise<SignedContentUrl>;

  // === Enrollment ===

  /** Enroll a user in a course */
  enroll(userId: string, courseId: string, source?: EnrollmentSource): Promise<Enrollment>;

  /** Bulk enroll multiple users */
  bulkEnroll(
    userIds: string[],
    courseId: string,
    source: EnrollmentSource,
  ): Promise<BulkEnrollResult>;

  /** Cancel an enrollment */
  cancelEnrollment(enrollmentId: string, reason?: string): Promise<void>;

  /** Get user's active enrollments */
  getMyEnrollments(userId: string, filters?: EnrollmentFilters): Promise<Enrollment[]>;

  /** Get all enrollments for a course */
  getCourseEnrollments(
    courseId: string,
    filters?: EnrollmentFilters,
  ): Promise<PaginatedResult<Enrollment>>;

  // === Progress Tracking ===

  /** Record progress on a content item */
  recordProgress(input: ProgressInput): Promise<ProgressRecord>;

  /** Mark a content item as complete */
  markContentComplete(enrollmentId: string, contentId: string): Promise<void>;

  /** Get enrollment progress summary */
  getProgress(enrollmentId: string): Promise<EnrollmentProgress>;

  /** Get detailed progress for a content item */
  getContentProgress(enrollmentId: string, contentId: string): Promise<ContentProgress>;

  // === Course Completion ===

  /** Complete a course (all required content finished + passing quiz score) */
  completeCourse(enrollmentId: string): Promise<CourseCompletion>;

  /** Generate a completion certificate */
  generateCertificate(completionId: string): Promise<Certificate>;

  /** Verify a certificate by its unique code */
  verifyCertificate(code: string): Promise<CertificateVerification>;

  // === Learning Paths ===

  /** Create a learning path */
  createLearningPath(input: LearningPathCreateInput): Promise<LearningPath>;

  /** Add courses to a learning path */
  addPathCourses(pathId: string, courses: PathCourseInput[]): Promise<void>;

  /** Reorder courses in a learning path */
  reorderPathCourses(pathId: string, courseIds: string[]): Promise<void>;

  /** Enroll a user in a learning path */
  enrollInPath(userId: string, pathId: string): Promise<PathEnrollment>;

  /** Get learning path progress */
  getPathProgress(pathEnrollmentId: string): Promise<PathProgress>;

  /** List available learning paths */
  listLearningPaths(filters?: LearningPathFilters): Promise<PaginatedResult<LearningPath>>;

  // === Compliance Training ===

  /** Create a compliance training requirement */
  createComplianceTraining(input: ComplianceTrainingInput): Promise<ComplianceTraining>;

  /** Assign compliance training to users */
  assignComplianceTraining(
    trainingId: string,
    userIds: string[],
    dueDate: Date,
  ): Promise<ComplianceAssignment[]>;

  /** Auto-assign compliance training based on rules */
  autoAssignComplianceTraining(trainingId: string): Promise<ComplianceAssignment[]>;

  /** Get overdue compliance assignments */
  getOverdueAssignments(filters?: ComplianceFilters): Promise<ComplianceAssignment[]>;

  /** Escalate overdue compliance training */
  escalateOverdue(assignmentId: string): Promise<EscalationResult>;

  /** Get compliance status for the organization */
  getComplianceStatus(filters?: ComplianceFilters): Promise<ComplianceStatusReport>;

  // === Skills & Development ===

  /** Create or update a skill framework */
  upsertSkillFramework(input: SkillFrameworkInput): Promise<SkillFramework>;

  /** Assess an employee's skill level */
  assessSkill(input: SkillAssessmentInput): Promise<EmployeeSkill>;

  /** Perform skill gap analysis for a user */
  analyzeSkillGaps(userId: string, roleId?: string): Promise<SkillGap[]>;

  /** Get recommended learning based on skill gaps */
  getSkillBasedRecommendations(userId: string): Promise<Course[]>;

  /** Create a development plan */
  createDevelopmentPlan(input: DevelopmentPlanCreateInput): Promise<DevelopmentPlan>;

  /** Update development plan progress */
  updateDevelopmentPlanItem(
    itemId: string,
    input: DevelopmentPlanItemUpdate,
  ): Promise<DevelopmentPlanItem>;

  /** Get development plan with progress */
  getDevelopmentPlan(planId: string): Promise<DevelopmentPlanWithProgress>;

  // === Social Learning ===

  /** Create a discussion for a course */
  createDiscussion(courseId: string, input: DiscussionInput): Promise<Discussion>;

  /** Post to a discussion */
  postToDiscussion(discussionId: string, input: DiscussionPostInput): Promise<DiscussionPost>;

  /** Submit a peer review */
  submitPeerReview(input: PeerReviewInput): Promise<PeerReview>;

  /** Request mentorship matching */
  requestMentorship(input: MentorshipRequestInput): Promise<Mentorship>;

  /** Create a study group */
  createStudyGroup(input: StudyGroupInput): Promise<StudyGroup>;

  /** Join a study group */
  joinStudyGroup(groupId: string, userId: string): Promise<StudyGroupMember>;

  // === Budget & Approvals ===

  /** Set learning budget for a department/employee */
  setBudget(input: LearningBudgetInput): Promise<LearningBudget>;

  /** Request course approval (with budget check) */
  requestCourseApproval(input: CourseApprovalInput): Promise<CourseApproval>;

  /** Approve/reject a course request */
  processCourseApproval(
    approvalId: string,
    decision: ApprovalDecision,
  ): Promise<CourseApproval>;

  /** Get remaining budget for a user/department */
  getRemainingBudget(scope: BudgetScope): Promise<BudgetSummary>;

  /** Record a budget transaction */
  recordBudgetTransaction(input: BudgetTransactionInput): Promise<BudgetTransaction>;

  // === Analytics ===

  /** Get learning analytics dashboard data */
  getAnalytics(filters: AnalyticsFilters): Promise<LearningAnalytics>;

  /** Get completion rate metrics */
  getCompletionMetrics(filters: AnalyticsFilters): Promise<CompletionMetrics>;

  /** Get training hours report */
  getTrainingHoursReport(filters: AnalyticsFilters): Promise<TrainingHoursReport>;

  /** Calculate learning ROI */
  calculateROI(filters: AnalyticsFilters): Promise<ROIMetrics>;

  /** Get team learning statistics */
  getTeamStats(managerId: string, filters?: AnalyticsFilters): Promise<TeamLearningStats>;

  // === External Integrations ===

  /** Sync courses from an external provider */
  syncExternalCourses(provider: ExternalProvider): Promise<SyncResult>;

  /** Generate SSO launch URL for external content */
  getLaunchUrl(
    provider: ExternalProvider,
    courseId: string,
    userId: string,
  ): Promise<string>;

  /** Receive completion webhook from external provider */
  handleExternalCompletion(
    provider: ExternalProvider,
    payload: ExternalCompletionPayload,
  ): Promise<void>;
}
```

### Course

```typescript
interface Course {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnailUrl: string | null;
  bannerUrl: string | null;

  // Classification
  categoryId: string | null;
  subcategoryId: string | null;
  tags: string[];
  level: CourseLevel;
  format: CourseFormat;

  // Content metadata
  contentType: ContentType;
  durationMinutes: number;
  contentCount: number;
  language: string;
  languages: string[]; // Available translations

  // Authoring
  authorId: string;
  authorName: string;
  instructorIds: string[];
  vendorId: string | null;
  externalCourseId: string | null;
  externalProvider: ExternalProvider | null;

  // Requirements
  prerequisites: string[]; // Course IDs
  skillRequirements: SkillRequirement[];

  // Completion criteria
  passingScore: number | null; // Percentage for quizzes
  requiredContentIds: string[]; // Must complete these content items
  completionCriteria: CompletionCriteria;

  // Pricing / Budget
  cost: number;
  currency: string;
  isFree: boolean;

  // Settings
  isPublished: boolean;
  isArchived: boolean;
  isMandatory: boolean;
  allowSelfEnrollment: boolean;
  maxEnrollments: number | null;
  enrollmentDeadline: Date | null;

  // Ratings
  averageRating: number;
  totalRatings: number;
  totalEnrollments: number;
  totalCompletions: number;

  // Timestamps
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

enum ContentType {
  VIDEO = 'video',
  SCORM_12 = 'scorm_12',
  SCORM_2004 = 'scorm_2004',
  XAPI = 'xapi',
  DOCUMENT = 'document',
  QUIZ = 'quiz',
  INTERACTIVE = 'interactive',
  EXTERNAL_URL = 'external_url',
  WEBINAR = 'webinar',
  CLASSROOM = 'classroom',
  BLENDED = 'blended',
}

enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

enum CourseFormat {
  SELF_PACED = 'self_paced',
  INSTRUCTOR_LED = 'instructor_led',
  BLENDED = 'blended',
  WEBINAR = 'webinar',
  CLASSROOM = 'classroom',
  ON_THE_JOB = 'on_the_job',
}

interface CompletionCriteria {
  type: 'all_content' | 'required_content' | 'quiz_score' | 'manual';
  minimumScore?: number;
  minimumTimeMinutes?: number;
  requiredContentIds?: string[];
}
```

### Enrollment

```typescript
interface Enrollment {
  id: string;
  tenantId: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;

  // Source tracking
  source: EnrollmentSource;
  assignedBy: string | null;
  complianceAssignmentId: string | null;
  pathEnrollmentId: string | null;
  approvalId: string | null;

  // Progress
  progressPercent: number;
  lastAccessedAt: Date | null;
  completedContentIds: string[];
  currentContentId: string | null;

  // Time tracking
  totalTimeMinutes: number;
  sessionCount: number;

  // Quiz results
  bestQuizScore: number | null;
  quizAttempts: number;

  // Completion
  completedAt: Date | null;
  completionId: string | null;
  certificateId: string | null;

  // Deadlines
  dueDate: Date | null;
  enrolledAt: Date;
  startedAt: Date | null;
  expiresAt: Date | null;

  // Metadata
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  WAITLISTED = 'waitlisted',
}

enum EnrollmentSource {
  SELF = 'self',
  MANAGER = 'manager',
  HR = 'hr',
  COMPLIANCE = 'compliance',
  LEARNING_PATH = 'learning_path',
  RECOMMENDATION = 'recommendation',
  SYSTEM = 'system',
}

interface EnrollmentProgress {
  enrollmentId: string;
  courseId: string;
  userId: string;
  overallPercent: number;
  contentProgress: ContentProgress[];
  totalTimeMinutes: number;
  lastActivity: Date | null;
  estimatedRemainingMinutes: number;
  status: EnrollmentStatus;
}

interface ContentProgress {
  contentId: string;
  contentTitle: string;
  contentType: ContentType;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  timeSpentMinutes: number;
  score: number | null;
  attempts: number;
  completedAt: Date | null;
  lastAccessedAt: Date | null;
}
```

### LearningPath

```typescript
interface LearningPath {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;

  // Structure
  courses: PathCourse[];
  totalCourses: number;
  totalDurationMinutes: number;

  // Classification
  categoryId: string | null;
  tags: string[];
  level: CourseLevel;
  targetRoles: string[];
  targetSkills: string[];

  // Settings
  isPublished: boolean;
  isSequential: boolean; // Must complete courses in order
  allowSkipping: boolean;

  // Stats
  totalEnrollments: number;
  averageCompletionDays: number;
  completionRate: number;

  // Authoring
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PathCourse {
  id: string;
  pathId: string;
  courseId: string;
  course: Course;
  position: number;
  isRequired: boolean;
  isMilestone: boolean;
  milestoneTitle: string | null;
  unlockAfterCourseId: string | null;
}

interface PathEnrollment {
  id: string;
  tenantId: string;
  userId: string;
  pathId: string;
  status: EnrollmentStatus;
  progressPercent: number;
  completedCourses: number;
  totalCourses: number;
  currentCourseId: string | null;
  courseEnrollments: Enrollment[];
  enrolledAt: Date;
  completedAt: Date | null;
  estimatedCompletionDate: Date | null;
}

interface PathProgress {
  pathEnrollmentId: string;
  overallPercent: number;
  courseStatuses: Array<{
    courseId: string;
    courseTitle: string;
    position: number;
    status: EnrollmentStatus;
    progressPercent: number;
    isRequired: boolean;
    isMilestone: boolean;
    isUnlocked: boolean;
  }>;
  milestonesReached: string[];
  estimatedDaysRemaining: number;
}
```

### ComplianceTraining

```typescript
interface ComplianceTraining {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  courseId: string;
  course: Course;

  // Scheduling
  frequency: ComplianceFrequency;
  renewalPeriodDays: number | null;
  gracePeriodDays: number;

  // Assignment rules
  assignmentRules: ComplianceAssignmentRule[];
  autoAssign: boolean;
  assignOnHire: boolean;

  // Escalation
  escalationPolicy: EscalationPolicy;

  // Requirements
  regulatoryBody: string | null;
  regulationReference: string | null;
  isMandatory: boolean;

  // Status
  isActive: boolean;
  effectiveDate: Date;
  expirationDate: Date | null;

  // Stats
  totalAssigned: number;
  totalCompleted: number;
  totalOverdue: number;
  complianceRate: number;

  createdAt: Date;
  updatedAt: Date;
}

enum ComplianceFrequency {
  ONE_TIME = 'one_time',
  ANNUAL = 'annual',
  SEMI_ANNUAL = 'semi_annual',
  QUARTERLY = 'quarterly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

interface ComplianceAssignment {
  id: string;
  tenantId: string;
  complianceTrainingId: string;
  userId: string;
  enrollmentId: string | null;

  // Status
  state: ComplianceState;
  dueDate: Date;
  completedAt: Date | null;
  certificateId: string | null;

  // Renewal
  previousAssignmentId: string | null;
  renewalDate: Date | null;
  cycleNumber: number;

  // Escalation
  escalationLevel: number;
  lastEscalatedAt: Date | null;
  escalationHistory: EscalationEvent[];

  // Metadata
  assignedBy: string;
  assignedAt: Date;
  notes: string | null;
}

enum ComplianceState {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  ESCALATED = 'escalated',
  EXEMPTED = 'exempted',
  EXPIRED = 'expired',
}

interface ComplianceAssignmentRule {
  type: 'department' | 'role' | 'location' | 'all' | 'custom';
  value: string | null;
  departmentIds?: string[];
  roleIds?: string[];
  locationIds?: string[];
  customFilter?: Record<string, unknown>;
}

interface EscalationPolicy {
  levels: EscalationLevel[];
  maxEscalationLevel: number;
  blockAccessOnOverdue: boolean;
  blockAccessAfterDays: number | null;
}

interface EscalationLevel {
  level: number;
  daysOverdue: number;
  actions: EscalationAction[];
  notifyUserIds: string[];
  notifyRoles: string[];
}

interface EscalationAction {
  type: 'email' | 'notification' | 'manager_alert' | 'hr_alert' | 'block_access' | 'report';
  templateId: string | null;
  config: Record<string, unknown>;
}

interface EscalationEvent {
  level: number;
  timestamp: Date;
  actions: string[];
  notifiedUsers: string[];
}
```

### SkillGap

```typescript
interface SkillFramework {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  version: string;

  // Structure
  categories: SkillCategory[];
  totalSkills: number;
  proficiencyScale: ProficiencyScale;

  // Settings
  isDefault: boolean;
  isActive: boolean;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SkillCategory {
  id: string;
  frameworkId: string;
  name: string;
  description: string;
  parentCategoryId: string | null;
  skills: Skill[];
  position: number;
}

interface Skill {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  levels: SkillLevelDefinition[];
  relatedCourseIds: string[];
  position: number;
}

interface SkillLevelDefinition {
  level: SkillProficiency;
  description: string;
  criteria: string[];
}

enum SkillProficiency {
  NONE = 'none',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

interface ProficiencyScale {
  levels: SkillProficiency[];
  descriptions: Record<SkillProficiency, string>;
  numericValues: Record<SkillProficiency, number>;
}

interface EmployeeSkill {
  id: string;
  tenantId: string;
  userId: string;
  skillId: string;
  skillName: string;
  categoryName: string;

  // Assessment
  currentLevel: SkillProficiency;
  targetLevel: SkillProficiency | null;
  selfAssessedLevel: SkillProficiency | null;
  managerAssessedLevel: SkillProficiency | null;
  verifiedLevel: SkillProficiency | null;

  // Evidence
  assessmentDate: Date;
  assessmentSource: 'self' | 'manager' | 'quiz' | 'certification' | 'peer' | 'system';
  evidenceIds: string[];
  certificationIds: string[];

  // History
  levelHistory: SkillLevelChange[];
  lastUpdatedAt: Date;
}

interface SkillGap {
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
  skillId: string;
  skillName: string;
  categoryName: string;
  requiredLevel: SkillProficiency;
  currentLevel: SkillProficiency;
  gapSize: number; // Numeric gap (e.g., 2 = two levels below required)
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendedCourses: Course[];
  recommendedPaths: LearningPath[];
  estimatedClosureDays: number;
}

interface SkillLevelChange {
  fromLevel: SkillProficiency;
  toLevel: SkillProficiency;
  changedAt: Date;
  source: string;
  evidenceId: string | null;
}
```

### DevelopmentPlan

```typescript
interface DevelopmentPlan {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  managerId: string | null;
  managerName: string | null;

  // Plan details
  title: string;
  description: string;
  status: DevelopmentPlanStatus;
  type: DevelopmentPlanType;

  // Timeline
  startDate: Date;
  targetDate: Date;
  completedAt: Date | null;

  // Goals
  careerGoal: string | null;
  targetRoleId: string | null;
  targetRoleName: string | null;

  // Items
  items: DevelopmentPlanItem[];
  totalItems: number;
  completedItems: number;
  progressPercent: number;

  // Review
  lastReviewDate: Date | null;
  nextReviewDate: Date | null;
  reviewFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  reviewNotes: ReviewNote[];

  createdAt: Date;
  updatedAt: Date;
}

enum DevelopmentPlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

enum DevelopmentPlanType {
  INDIVIDUAL = 'individual',
  PERFORMANCE_IMPROVEMENT = 'performance_improvement',
  CAREER_GROWTH = 'career_growth',
  ONBOARDING = 'onboarding',
  LEADERSHIP = 'leadership',
  SUCCESSION = 'succession',
}

interface DevelopmentPlanItem {
  id: string;
  planId: string;
  title: string;
  description: string;
  type: DevelopmentItemType;

  // Learning link
  courseId: string | null;
  learningPathId: string | null;
  enrollmentId: string | null;

  // Skill link
  skillId: string | null;
  targetSkillLevel: SkillProficiency | null;

  // Status
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  progressPercent: number;
  dueDate: Date | null;
  completedAt: Date | null;

  // Ordering
  position: number;
  isMandatory: boolean;

  // Notes
  notes: string | null;
  managerFeedback: string | null;
}

enum DevelopmentItemType {
  COURSE = 'course',
  LEARNING_PATH = 'learning_path',
  ON_THE_JOB = 'on_the_job',
  MENTORSHIP = 'mentorship',
  PROJECT = 'project',
  CERTIFICATION = 'certification',
  CONFERENCE = 'conference',
  READING = 'reading',
  OTHER = 'other',
}

interface ReviewNote {
  id: string;
  date: Date;
  authorId: string;
  authorName: string;
  content: string;
  type: 'review' | 'feedback' | 'update' | 'milestone';
}
```

### LearningBudget

```typescript
interface LearningBudget {
  id: string;
  tenantId: string;

  // Scope
  scope: BudgetScopeType;
  departmentId: string | null;
  userId: string | null;
  teamId: string | null;

  // Budget amounts
  totalBudget: number;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  pendingAmount: number; // Awaiting approval
  currency: string;

  // Period
  period: BudgetPeriod;
  periodStart: Date;
  periodEnd: Date;
  fiscalYear: number;

  // Settings
  rolloverEnabled: boolean;
  rolloverPercent: number;
  rolloverFromPrevious: number;
  approvalRequired: boolean;
  approvalThreshold: number; // Auto-approve below this amount

  // Tracking
  transactionCount: number;
  averageTransactionAmount: number;
  utilizationPercent: number;

  createdAt: Date;
  updatedAt: Date;
}

enum BudgetScopeType {
  ORGANIZATION = 'organization',
  DEPARTMENT = 'department',
  TEAM = 'team',
  INDIVIDUAL = 'individual',
}

enum BudgetPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
  FISCAL_YEAR = 'fiscal_year',
}

interface BudgetTransaction {
  id: string;
  budgetId: string;
  tenantId: string;
  type: 'allocation' | 'spend' | 'refund' | 'adjustment' | 'rollover';
  amount: number;
  currency: string;
  description: string;

  // Links
  courseId: string | null;
  enrollmentId: string | null;
  approvalId: string | null;
  vendorId: string | null;
  invoiceNumber: string | null;

  // Metadata
  userId: string;
  processedBy: string;
  processedAt: Date;
  notes: string | null;
}

interface CourseApproval {
  id: string;
  tenantId: string;
  requesterId: string;
  requesterName: string;
  courseId: string;
  courseTitle: string;
  vendorId: string | null;

  // Financials
  cost: number;
  currency: string;
  budgetId: string | null;

  // Approval
  status: ApprovalStatus;
  approverId: string | null;
  approverName: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;

  // Justification
  justification: string;
  businessCase: string | null;
  skillGapIds: string[];
  developmentPlanItemId: string | null;

  // Dates
  requestedAt: Date;
  expiresAt: Date | null;
}

enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  AUTO_APPROVED = 'auto_approved',
}

interface BudgetSummary {
  totalBudget: number;
  spent: number;
  committed: number; // Approved but not yet spent
  pending: number;   // Awaiting approval
  remaining: number;
  utilizationPercent: number;
  currency: string;
  topCategories: Array<{ category: string; amount: number; percent: number }>;
  monthlyTrend: Array<{ month: string; amount: number }>;
}
```

### LearningAnalytics

```typescript
interface LearningAnalytics {
  period: { start: Date; end: Date };
  tenantId: string;

  // Overview
  overview: {
    totalCourses: number;
    activeCourses: number;
    totalLearners: number;
    activeLearners: number;
    totalEnrollments: number;
    totalCompletions: number;
    averageCompletionRate: number;
    totalTrainingHours: number;
    averageHoursPerLearner: number;
    totalCertificatesIssued: number;
  };

  // Engagement
  engagement: {
    dailyActiveUsers: number[];
    weeklyActiveUsers: number[];
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    averageCourseDuration: number;
    contentCompletionRate: number;
    enrollmentToStartRate: number;
    startToCompletionRate: number;
    dropoffPoints: Array<{ contentId: string; dropoffRate: number }>;
  };

  // Compliance
  compliance: {
    totalRequirements: number;
    overallComplianceRate: number;
    overdueAssignments: number;
    upcomingDue30Days: number;
    byTraining: Array<{
      trainingId: string;
      title: string;
      totalAssigned: number;
      completed: number;
      overdue: number;
      complianceRate: number;
    }>;
    byDepartment: Array<{
      departmentId: string;
      departmentName: string;
      complianceRate: number;
      overdueCount: number;
    }>;
  };

  // Skills
  skills: {
    topSkillGaps: SkillGap[];
    skillDevelopmentTrend: Array<{
      skillId: string;
      skillName: string;
      averageLevelStart: number;
      averageLevelEnd: number;
      improvement: number;
    }>;
    mostDevelopedSkills: Array<{ skillName: string; improvementCount: number }>;
    leastDevelopedSkills: Array<{ skillName: string; gapCount: number }>;
  };

  // Budget
  budget: {
    totalBudget: number;
    totalSpent: number;
    utilizationRate: number;
    averageCostPerLearner: number;
    averageCostPerCompletion: number;
    spendByCategory: Array<{ category: string; amount: number }>;
    spendByDepartment: Array<{ department: string; amount: number }>;
    spendTrend: Array<{ month: string; amount: number }>;
  };

  // Top content
  topCourses: Array<{
    courseId: string;
    title: string;
    enrollments: number;
    completions: number;
    averageRating: number;
    averageTimeMinutes: number;
  }>;

  // Learning paths
  pathMetrics: Array<{
    pathId: string;
    title: string;
    enrollments: number;
    completions: number;
    averageCompletionDays: number;
    dropoffRate: number;
  }>;
}

interface CompletionMetrics {
  period: { start: Date; end: Date };
  totalEnrollments: number;
  totalCompletions: number;
  completionRate: number;
  averageCompletionDays: number;
  medianCompletionDays: number;
  byContentType: Array<{ type: ContentType; completions: number; rate: number }>;
  byLevel: Array<{ level: CourseLevel; completions: number; rate: number }>;
  byDepartment: Array<{ department: string; completions: number; rate: number }>;
  byMonth: Array<{ month: string; enrollments: number; completions: number; rate: number }>;
  trend: 'improving' | 'declining' | 'stable';
  trendPercent: number;
}

interface TrainingHoursReport {
  period: { start: Date; end: Date };
  totalHours: number;
  averageHoursPerEmployee: number;
  medianHoursPerEmployee: number;
  byDepartment: Array<{ department: string; totalHours: number; averageHours: number; headcount: number }>;
  byContentType: Array<{ type: ContentType; totalHours: number; percent: number }>;
  byMonth: Array<{ month: string; totalHours: number; uniqueLearners: number }>;
  topLearners: Array<{ userId: string; name: string; totalHours: number; completions: number }>;
}

interface ROIMetrics {
  period: { start: Date; end: Date };
  totalInvestment: number;
  totalTrainingHours: number;
  totalCompletions: number;
  costPerHour: number;
  costPerCompletion: number;
  costPerLearner: number;
  skillImprovements: number;
  complianceRate: number;
  estimatedProductivityGain: number | null;
  byProgram: Array<{
    programName: string;
    investment: number;
    completions: number;
    costPerCompletion: number;
    skillImpact: number;
  }>;
  byDepartment: Array<{
    department: string;
    investment: number;
    hoursInvested: number;
    completions: number;
    roi: number;
  }>;
}

interface TeamLearningStats {
  managerId: string;
  teamSize: number;
  period: { start: Date; end: Date };

  // Summary
  totalEnrollments: number;
  totalCompletions: number;
  completionRate: number;
  totalTrainingHours: number;
  averageHoursPerMember: number;

  // Compliance
  complianceRate: number;
  overdueAssignments: number;

  // Budget
  budgetAllocated: number;
  budgetSpent: number;
  budgetUtilization: number;

  // Members
  memberStats: Array<{
    userId: string;
    name: string;
    activeEnrollments: number;
    completions: number;
    trainingHours: number;
    complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
    topSkillGaps: string[];
    hasDevelopmentPlan: boolean;
    budgetUsed: number;
  }>;

  // Trends
  monthlyTrend: Array<{
    month: string;
    enrollments: number;
    completions: number;
    hours: number;
  }>;
}
```

### Supporting Types

```typescript
// === Course Search ===
interface CourseSearchFilters {
  query?: string;
  categoryIds?: string[];
  tags?: string[];
  levels?: CourseLevel[];
  formats?: CourseFormat[];
  contentTypes?: ContentType[];
  languages?: string[];
  isFree?: boolean;
  isMandatory?: boolean;
  minRating?: number;
  maxDurationMinutes?: number;
  skillIds?: string[];
  vendorId?: string;
  isExternal?: boolean;
  sortBy?: 'relevance' | 'rating' | 'enrollments' | 'newest' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// === Course Content ===
interface CourseContent {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  type: ContentType;
  position: number;

  // Content location
  storageKey: string | null;
  externalUrl: string | null;
  scormEntryPoint: string | null;

  // Metadata
  durationMinutes: number;
  isRequired: boolean;
  isPreview: boolean; // Available before enrollment

  // Quiz specific
  quizId: string | null;
  passingScore: number | null;
  maxAttempts: number | null;

  // File metadata
  fileSize: number | null;
  mimeType: string | null;
  thumbnailUrl: string | null;

  createdAt: Date;
  updatedAt: Date;
}

// === Quiz ===
interface Quiz {
  id: string;
  courseId: string;
  contentId: string;
  title: string;
  description: string | null;
  passingScore: number;
  maxAttempts: number;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  questions: QuizQuestion[];
  totalPoints: number;
  questionCount: number;
}

interface QuizQuestion {
  id: string;
  quizId: string;
  type: 'multiple_choice' | 'multiple_select' | 'true_false' | 'short_answer' | 'essay' | 'matching' | 'ordering';
  text: string;
  explanation: string | null;
  points: number;
  position: number;
  options: QuizOption[] | null;
  correctAnswer: string | string[] | null; // For auto-grading
  matchingPairs: Array<{ left: string; right: string }> | null;
  orderItems: string[] | null;
  mediaUrl: string | null;
}

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string | null;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  enrollmentId: string;
  userId: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  answers: QuizAnswer[];
  startedAt: Date;
  completedAt: Date | null;
  timeSpentMinutes: number;
}

interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean | null; // null for essay questions
  pointsEarned: number;
  feedback: string | null;
}

// === Certificate ===
interface Certificate {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  completionId: string;

  // Certificate details
  certificateNumber: string; // Unique verification code
  issueDate: Date;
  expirationDate: Date | null;

  // Content
  templateId: string;
  pdfUrl: string;
  metadata: Record<string, string>;

  // Verification
  verificationUrl: string;
  isValid: boolean;
  revokedAt: Date | null;
  revokedReason: string | null;
}

interface CertificateVerification {
  isValid: boolean;
  certificate: Certificate | null;
  recipientName: string;
  courseTitle: string;
  issueDate: Date;
  expirationDate: Date | null;
  issuingOrganization: string;
}

// === Social Learning ===
interface Discussion {
  id: string;
  courseId: string;
  tenantId: string;
  title: string;
  contentId: string | null;
  createdBy: string;
  createdByName: string;
  postCount: number;
  lastPostAt: Date | null;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
}

interface DiscussionPost {
  id: string;
  discussionId: string;
  parentPostId: string | null;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  isInstructor: boolean;
  upvoteCount: number;
  replyCount: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Mentorship {
  id: string;
  tenantId: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  status: 'requested' | 'active' | 'completed' | 'cancelled';
  skillFocusIds: string[];
  skillFocusNames: string[];
  goals: string;
  meetingFrequency: string;
  startDate: Date;
  endDate: Date | null;
  lastMeetingDate: Date | null;
  nextMeetingDate: Date | null;
  totalMeetings: number;
  notes: string[];
  createdAt: Date;
}

interface StudyGroup {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  courseId: string | null;
  learningPathId: string | null;
  createdBy: string;
  maxMembers: number;
  currentMembers: number;
  isOpen: boolean;
  meetingSchedule: string | null;
  meetingLink: string | null;
  members: StudyGroupMember[];
  createdAt: Date;
}

interface StudyGroupMember {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  role: 'organizer' | 'member';
  joinedAt: Date;
}

// === Vendor Management ===
interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoUrl: string | null;

  // Integration
  provider: ExternalProvider | null;
  apiKey: string | null; // Encrypted
  ssoEnabled: boolean;
  ssoConfig: SSOConfig | null;

  // Contract
  contractStartDate: Date | null;
  contractEndDate: Date | null;
  totalLicenses: number | null;
  usedLicenses: number;

  // Financials
  totalSpent: number;
  currency: string;
  courseCount: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type ExternalProvider = 'linkedin_learning' | 'udemy_business' | 'coursera' | 'pluralsight' | 'skillsoft' | 'custom';

interface SSOConfig {
  type: 'saml' | 'oauth2' | 'oidc';
  issuer: string;
  loginUrl: string;
  certificateFingerprint: string | null;
  clientId: string | null;
  clientSecret: string | null; // Encrypted
  scopes: string[];
  attributeMapping: Record<string, string>;
}

// === Pagination ===
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// === Activity Logging ===
interface LearningActivity {
  id: string;
  tenantId: string;
  userId: string;
  type: LearningActivityType;
  courseId: string | null;
  contentId: string | null;
  enrollmentId: string | null;
  pathId: string | null;
  description: string;
  metadata: Record<string, unknown>;
  durationMinutes: number | null;
  timestamp: Date;
}

type LearningActivityType =
  | 'enrollment'
  | 'content_start'
  | 'content_complete'
  | 'course_complete'
  | 'quiz_attempt'
  | 'quiz_pass'
  | 'quiz_fail'
  | 'certificate_earned'
  | 'path_enrollment'
  | 'path_complete'
  | 'skill_assessment'
  | 'skill_level_change'
  | 'discussion_post'
  | 'peer_review'
  | 'budget_request'
  | 'budget_approved'
  | 'scorm_interaction'
  | 'xapi_statement';
```

---

## Database Schemas

### courses

The primary course catalog table.

```typescript
import { pgTable, text, timestamp, integer, boolean, numeric, jsonb, uuid, varchar, index } from 'drizzle-orm/pg-core';
import { tenantId } from '@mcv/database/common';

export const courses = pgTable('learning_courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  title: text('title').notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  shortDescription: text('short_description').default(''),
  thumbnailUrl: text('thumbnail_url'),
  bannerUrl: text('banner_url'),

  // Classification
  categoryId: uuid('category_id'),
  subcategoryId: uuid('subcategory_id'),
  tags: jsonb('tags').$type<string[]>().default([]),
  level: varchar('level', { length: 50 }).notNull().default('beginner'),
  format: varchar('format', { length: 50 }).notNull().default('self_paced'),

  // Content metadata
  contentType: varchar('content_type', { length: 50 }).notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  contentCount: integer('content_count').notNull().default(0),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  languages: jsonb('languages').$type<string[]>().default(['en']),

  // Authoring
  authorId: uuid('author_id').notNull(),
  authorName: text('author_name').notNull(),
  instructorIds: jsonb('instructor_ids').$type<string[]>().default([]),
  vendorId: uuid('vendor_id'),
  externalCourseId: text('external_course_id'),
  externalProvider: varchar('external_provider', { length: 50 }),

  // Requirements
  prerequisites: jsonb('prerequisites').$type<string[]>().default([]),
  skillRequirements: jsonb('skill_requirements').$type<SkillRequirement[]>().default([]),

  // Completion criteria
  passingScore: integer('passing_score'),
  requiredContentIds: jsonb('required_content_ids').$type<string[]>().default([]),
  completionCriteria: jsonb('completion_criteria').$type<CompletionCriteria>().notNull()
    .default({ type: 'all_content' }),

  // Pricing / Budget
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  isFree: boolean('is_free').notNull().default(true),

  // Settings
  isPublished: boolean('is_published').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),
  isMandatory: boolean('is_mandatory').notNull().default(false),
  allowSelfEnrollment: boolean('allow_self_enrollment').notNull().default(true),
  maxEnrollments: integer('max_enrollments'),
  enrollmentDeadline: timestamp('enrollment_deadline', { withTimezone: true }),

  // Ratings (denormalized for performance)
  averageRating: numeric('average_rating', { precision: 3, scale: 2 }).notNull().default('0'),
  totalRatings: integer('total_ratings').notNull().default(0),
  totalEnrollments: integer('total_enrollments').notNull().default(0),
  totalCompletions: integer('total_completions').notNull().default(0),

  // Timestamps
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('courses_tenant_idx').on(table.tenantId),
  slugIdx: index('courses_slug_idx').on(table.tenantId, table.slug),
  categoryIdx: index('courses_category_idx').on(table.tenantId, table.categoryId),
  publishedIdx: index('courses_published_idx').on(table.tenantId, table.isPublished),
  searchIdx: index('courses_search_idx').on(table.tenantId, table.title),
  vendorIdx: index('courses_vendor_idx').on(table.tenantId, table.vendorId),
  externalIdx: index('courses_external_idx').on(table.tenantId, table.externalProvider, table.externalCourseId),
}));
```

### course_content

Content items within a course.

```typescript
export const courseContent = pgTable('learning_course_content', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(),
  position: integer('position').notNull().default(0),

  // Content location
  storageKey: text('storage_key'),
  externalUrl: text('external_url'),
  scormEntryPoint: text('scorm_entry_point'),

  // Metadata
  durationMinutes: integer('duration_minutes').notNull().default(0),
  isRequired: boolean('is_required').notNull().default(true),
  isPreview: boolean('is_preview').notNull().default(false),

  // Quiz specific
  quizId: uuid('quiz_id'),
  passingScore: integer('passing_score'),
  maxAttempts: integer('max_attempts'),

  // File metadata
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 255 }),
  thumbnailUrl: text('thumbnail_url'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  courseIdx: index('content_course_idx').on(table.courseId),
  tenantCourseIdx: index('content_tenant_course_idx').on(table.tenantId, table.courseId),
  positionIdx: index('content_position_idx').on(table.courseId, table.position),
}));
```

### enrollments

Tracks user enrollment in courses.

```typescript
export const enrollments = pgTable('learning_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  userId: uuid('user_id').notNull(),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  status: varchar('status', { length: 50 }).notNull().default('enrolled'),

  // Source tracking
  source: varchar('source', { length: 50 }).notNull().default('self'),
  assignedBy: uuid('assigned_by'),
  complianceAssignmentId: uuid('compliance_assignment_id'),
  pathEnrollmentId: uuid('path_enrollment_id'),
  approvalId: uuid('approval_id'),

  // Progress
  progressPercent: integer('progress_percent').notNull().default(0),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  completedContentIds: jsonb('completed_content_ids').$type<string[]>().default([]),
  currentContentId: uuid('current_content_id'),

  // Time tracking
  totalTimeMinutes: integer('total_time_minutes').notNull().default(0),
  sessionCount: integer('session_count').notNull().default(0),

  // Quiz results
  bestQuizScore: integer('best_quiz_score'),
  quizAttempts: integer('quiz_attempts').notNull().default(0),

  // Completion
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completionId: uuid('completion_id'),
  certificateId: uuid('certificate_id'),

  // Deadlines
  dueDate: timestamp('due_date', { withTimezone: true }),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  // Metadata
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUserIdx: index('enrollments_tenant_user_idx').on(table.tenantId, table.userId),
  tenantCourseIdx: index('enrollments_tenant_course_idx').on(table.tenantId, table.courseId),
  userCourseIdx: index('enrollments_user_course_idx').on(table.tenantId, table.userId, table.courseId),
  statusIdx: index('enrollments_status_idx').on(table.tenantId, table.status),
  dueDateIdx: index('enrollments_due_date_idx').on(table.tenantId, table.dueDate),
  complianceIdx: index('enrollments_compliance_idx').on(table.complianceAssignmentId),
  pathIdx: index('enrollments_path_idx').on(table.pathEnrollmentId),
}));
```

### course_completions

Records of completed courses.

```typescript
export const courseCompletions = pgTable('learning_course_completions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  userId: uuid('user_id').notNull(),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id),

  // Completion details
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  finalScore: integer('final_score'),
  totalTimeMinutes: integer('total_time_minutes').notNull().default(0),
  grade: varchar('grade', { length: 10 }),

  // Certificate
  certificateId: uuid('certificate_id'),
  certificateNumber: varchar('certificate_number', { length: 100 }),

  // Compliance
  complianceAssignmentId: uuid('compliance_assignment_id'),
  satisfiesCompliance: boolean('satisfies_compliance').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUserIdx: index('completions_tenant_user_idx').on(table.tenantId, table.userId),
  tenantCourseIdx: index('completions_tenant_course_idx').on(table.tenantId, table.courseId),
  completedAtIdx: index('completions_completed_at_idx').on(table.tenantId, table.completedAt),
  complianceIdx: index('completions_compliance_idx').on(table.complianceAssignmentId),
}));
```

### learning_paths

Structured sequences of courses.

```typescript
export const learningPaths = pgTable('learning_paths', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  title: text('title').notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  thumbnailUrl: text('thumbnail_url'),

  // Classification
  categoryId: uuid('category_id'),
  tags: jsonb('tags').$type<string[]>().default([]),
  level: varchar('level', { length: 50 }).notNull().default('beginner'),
  targetRoles: jsonb('target_roles').$type<string[]>().default([]),
  targetSkills: jsonb('target_skills').$type<string[]>().default([]),

  // Settings
  isPublished: boolean('is_published').notNull().default(false),
  isSequential: boolean('is_sequential').notNull().default(true),
  allowSkipping: boolean('allow_skipping').notNull().default(false),

  // Stats (denormalized)
  totalCourses: integer('total_courses').notNull().default(0),
  totalDurationMinutes: integer('total_duration_minutes').notNull().default(0),
  totalEnrollments: integer('total_enrollments').notNull().default(0),
  averageCompletionDays: integer('average_completion_days').notNull().default(0),
  completionRate: numeric('completion_rate', { precision: 5, scale: 2 }).notNull().default('0'),

  // Authoring
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('paths_tenant_idx').on(table.tenantId),
  slugIdx: index('paths_slug_idx').on(table.tenantId, table.slug),
  publishedIdx: index('paths_published_idx').on(table.tenantId, table.isPublished),
}));

export const pathCourses = pgTable('learning_path_courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  pathId: uuid('path_id').notNull().references(() => learningPaths.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  position: integer('position').notNull().default(0),
  isRequired: boolean('is_required').notNull().default(true),
  isMilestone: boolean('is_milestone').notNull().default(false),
  milestoneTitle: text('milestone_title'),
  unlockAfterCourseId: uuid('unlock_after_course_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pathIdx: index('path_courses_path_idx').on(table.pathId),
  positionIdx: index('path_courses_position_idx').on(table.pathId, table.position),
}));

export const pathEnrollments = pgTable('learning_path_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  userId: uuid('user_id').notNull(),
  pathId: uuid('path_id').notNull().references(() => learningPaths.id),
  status: varchar('status', { length: 50 }).notNull().default('enrolled'),
  progressPercent: integer('progress_percent').notNull().default(0),
  completedCourses: integer('completed_courses').notNull().default(0),
  totalCourses: integer('total_courses').notNull().default(0),
  currentCourseId: uuid('current_course_id'),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  estimatedCompletionDate: timestamp('estimated_completion_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUserIdx: index('path_enrollments_tenant_user_idx').on(table.tenantId, table.userId),
  pathIdx: index('path_enrollments_path_idx').on(table.tenantId, table.pathId),
  userPathIdx: index('path_enrollments_user_path_idx').on(table.tenantId, table.userId, table.pathId),
}));
```

### compliance_assignments

Compliance training tracking.

```typescript
export const complianceTrainings = pgTable('learning_compliance_trainings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  courseId: uuid('course_id').notNull().references(() => courses.id),

  // Scheduling
  frequency: varchar('frequency', { length: 50 }).notNull().default('annual'),
  renewalPeriodDays: integer('renewal_period_days'),
  gracePeriodDays: integer('grace_period_days').notNull().default(0),

  // Assignment rules
  assignmentRules: jsonb('assignment_rules').$type<ComplianceAssignmentRule[]>().default([]),
  autoAssign: boolean('auto_assign').notNull().default(false),
  assignOnHire: boolean('assign_on_hire').notNull().default(false),

  // Escalation
  escalationPolicy: jsonb('escalation_policy').$type<EscalationPolicy>().notNull()
    .default({ levels: [], maxEscalationLevel: 3, blockAccessOnOverdue: false, blockAccessAfterDays: null }),

  // Requirements
  regulatoryBody: text('regulatory_body'),
  regulationReference: text('regulation_reference'),
  isMandatory: boolean('is_mandatory').notNull().default(true),

  // Status
  isActive: boolean('is_active').notNull().default(true),
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull().defaultNow(),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),

  // Stats (denormalized)
  totalAssigned: integer('total_assigned').notNull().default(0),
  totalCompleted: integer('total_completed').notNull().default(0),
  totalOverdue: integer('total_overdue').notNull().default(0),
  complianceRate: numeric('compliance_rate', { precision: 5, scale: 2 }).notNull().default('0'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('compliance_trainings_tenant_idx').on(table.tenantId),
  activeIdx: index('compliance_trainings_active_idx').on(table.tenantId, table.isActive),
}));

export const complianceAssignments = pgTable('learning_compliance_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  complianceTrainingId: uuid('compliance_training_id').notNull()
    .references(() => complianceTrainings.id),
  userId: uuid('user_id').notNull(),
  enrollmentId: uuid('enrollment_id'),

  // Status
  state: varchar('state', { length: 50 }).notNull().default('assigned'),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  certificateId: uuid('certificate_id'),

  // Renewal
  previousAssignmentId: uuid('previous_assignment_id'),
  renewalDate: timestamp('renewal_date', { withTimezone: true }),
  cycleNumber: integer('cycle_number').notNull().default(1),

  // Escalation
  escalationLevel: integer('escalation_level').notNull().default(0),
  lastEscalatedAt: timestamp('last_escalated_at', { withTimezone: true }),
  escalationHistory: jsonb('escalation_history').$type<EscalationEvent[]>().default([]),

  // Metadata
  assignedBy: uuid('assigned_by').notNull(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUserIdx: index('compliance_assignments_tenant_user_idx').on(table.tenantId, table.userId),
  trainingIdx: index('compliance_assignments_training_idx').on(table.tenantId, table.complianceTrainingId),
  stateIdx: index('compliance_assignments_state_idx').on(table.tenantId, table.state),
  dueDateIdx: index('compliance_assignments_due_date_idx').on(table.tenantId, table.dueDate),
  overdueIdx: index('compliance_assignments_overdue_idx').on(table.tenantId, table.state, table.dueDate),
}));
```

### skill_frameworks

Competency and skill tracking.

```typescript
export const skillFrameworks = pgTable('learning_skill_frameworks', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  version: varchar('version', { length: 50 }).notNull().default('1.0'),
  categories: jsonb('categories').$type<SkillCategory[]>().default([]),
  totalSkills: integer('total_skills').notNull().default(0),
  proficiencyScale: jsonb('proficiency_scale').$type<ProficiencyScale>().notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('skill_frameworks_tenant_idx').on(table.tenantId),
  activeIdx: index('skill_frameworks_active_idx').on(table.tenantId, table.isActive),
}));

export const skillLevels = pgTable('learning_skill_levels', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  frameworkId: uuid('framework_id').notNull().references(() => skillFrameworks.id, { onDelete: 'cascade' }),
  skillId: varchar('skill_id', { length: 255 }).notNull(),
  skillName: text('skill_name').notNull(),
  categoryName: text('category_name').notNull(),
  roleId: uuid('role_id'),
  requiredLevel: varchar('required_level', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  frameworkIdx: index('skill_levels_framework_idx').on(table.frameworkId),
  roleIdx: index('skill_levels_role_idx').on(table.tenantId, table.roleId),
  skillIdx: index('skill_levels_skill_idx').on(table.tenantId, table.skillId),
}));

export const employeeSkills = pgTable('learning_employee_skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  userId: uuid('user_id').notNull(),
  skillId: varchar('skill_id', { length: 255 }).notNull(),
  skillName: text('skill_name').notNull(),
  categoryName: text('category_name').notNull(),
  frameworkId: uuid('framework_id').notNull().references(() => skillFrameworks.id),

  // Assessment
  currentLevel: varchar('current_level', { length: 50 }).notNull().default('none'),
  targetLevel: varchar('target_level', { length: 50 }),
  selfAssessedLevel: varchar('self_assessed_level', { length: 50 }),
  managerAssessedLevel: varchar('manager_assessed_level', { length: 50 }),
  verifiedLevel: varchar('verified_level', { length: 50 }),

  // Evidence
  assessmentDate: timestamp('assessment_date', { withTimezone: true }).notNull().defaultNow(),
  assessmentSource: varchar('assessment_source', { length: 50 }).notNull().default('self'),
  evidenceIds: jsonb('evidence_ids').$type<string[]>().default([]),
  certificationIds: jsonb('certification_ids').$type<string[]>().default([]),

  // History
  levelHistory: jsonb('level_history').$type<SkillLevelChange[]>().default([]),
  lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUserIdx: index('employee_skills_tenant_user_idx').on(table.tenantId, table.userId),
  skillIdx: index('employee_skills_skill_idx').on(table.tenantId, table.skillId),
  userSkillIdx: index('employee_skills_user_skill_idx').on(table.tenantId, table.userId, table.skillId),
}));
```

### development_plans

Individual development plans.

```typescript
export const developmentPlans = pgTable('learning_development_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  userId: uuid('user_id').notNull(),
  userName: text('user_name').notNull(),
  managerId: uuid('manager_id'),
  managerName: text('manager_name'),

  // Plan details
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  type: varchar('type', { length: 50 }).notNull().default('individual'),

  // Timeline
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  targetDate: timestamp('target_date', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),

  // Goals
  careerGoal: text('career_goal'),
  targetRoleId: uuid('target_role_id'),
  targetRoleName: text('target_role_name'),

  // Progress (denormalized)
  totalItems: integer('total_items').notNull().default(0),
  completedItems: integer('completed_items').notNull().default(0),
  progressPercent: integer('progress_percent').notNull().default(0),

  // Review
  lastReviewDate: timestamp('last_review_date', { withTimezone: true }),
  nextReviewDate: timestamp('next_review_date', { withTimezone: true }),
  reviewFrequency: varchar('review_frequency', { length: 50 }).notNull().default('monthly'),
  reviewNotes: jsonb('review_notes').$type<ReviewNote[]>().default([]),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUserIdx: index('dev_plans_tenant_user_idx').on(table.tenantId, table.userId),
  managerIdx: index('dev_plans_manager_idx').on(table.tenantId, table.managerId),
  statusIdx: index('dev_plans_status_idx').on(table.tenantId, table.status),
}));

export const developmentPlanItems = pgTable('learning_development_plan_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  planId: uuid('plan_id').notNull().references(() => developmentPlans.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  type: varchar('type', { length: 50 }).notNull(),

  // Learning link
  courseId: uuid('course_id'),
  learningPathId: uuid('learning_path_id'),
  enrollmentId: uuid('enrollment_id'),

  // Skill link
  skillId: varchar('skill_id', { length: 255 }),
  targetSkillLevel: varchar('target_skill_level', { length: 50 }),

  // Status
  status: varchar('status', { length: 50 }).notNull().default('not_started'),
  progressPercent: integer('progress_percent').notNull().default(0),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),

  // Ordering
  position: integer('position').notNull().default(0),
  isMandatory: boolean('is_mandatory').notNull().default(false),

  // Notes
  notes: text('notes'),
  managerFeedback: text('manager_feedback'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  planIdx: index('dev_plan_items_plan_idx').on(table.planId),
  positionIdx: index('dev_plan_items_position_idx').on(table.planId, table.position),
}));
```

### learning_budgets

Budget tracking for learning investments.

```typescript
export const learningBudgets = pgTable('learning_budgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),

  // Scope
  scope: varchar('scope', { length: 50 }).notNull(),
  departmentId: uuid('department_id'),
  userId: uuid('user_id'),
  teamId: uuid('team_id'),

  // Budget amounts
  totalBudget: numeric('total_budget', { precision: 12, scale: 2 }).notNull().default('0'),
  allocatedAmount: numeric('allocated_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  spentAmount: numeric('spent_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  remainingAmount: numeric('remaining_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  pendingAmount: numeric('pending_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),

  // Period
  period: varchar('period', { length: 50 }).notNull().default('annual'),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  fiscalYear: integer('fiscal_year').notNull(),

  // Settings
  rolloverEnabled: boolean('rollover_enabled').notNull().default(false),
  rolloverPercent: integer('rollover_percent').notNull().default(0),
  rolloverFromPrevious: numeric('rollover_from_previous', { precision: 12, scale: 2 }).notNull().default('0'),
  approvalRequired: boolean('approval_required').notNull().default(true),
  approvalThreshold: numeric('approval_threshold', { precision: 10, scale: 2 }).notNull().default('0'),

  // Tracking (denormalized)
  transactionCount: integer('transaction_count').notNull().default(0),
  averageTransactionAmount: numeric('average_transaction_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  utilizationPercent: numeric('utilization_percent', { precision: 5, scale: 2 }).notNull().default('0'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('budgets_tenant_idx').on(table.tenantId),
  scopeIdx: index('budgets_scope_idx').on(table.tenantId, table.scope),
  departmentIdx: index('budgets_department_idx').on(table.tenantId, table.departmentId),
  userIdx: index('budgets_user_idx').on(table.tenantId, table.userId),
  periodIdx: index('budgets_period_idx').on(table.tenantId, table.fiscalYear, table.period),
}));

export const budgetTransactions = pgTable('learning_budget_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  budgetId: uuid('budget_id').notNull().references(() => learningBudgets.id),
  tenantId: tenantId(),
  type: varchar('type', { length: 50 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  description: text('description').notNull(),

  // Links
  courseId: uuid('course_id'),
  enrollmentId: uuid('enrollment_id'),
  approvalId: uuid('approval_id'),
  vendorId: uuid('vendor_id'),
  invoiceNumber: varchar('invoice_number', { length: 100 }),

  // Metadata
  userId: uuid('user_id').notNull(),
  processedBy: uuid('processed_by').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  budgetIdx: index('budget_txns_budget_idx').on(table.budgetId),
  tenantIdx: index('budget_txns_tenant_idx').on(table.tenantId),
  userIdx: index('budget_txns_user_idx').on(table.tenantId, table.userId),
  typeIdx: index('budget_txns_type_idx').on(table.tenantId, table.type),
  dateIdx: index('budget_txns_date_idx').on(table.tenantId, table.processedAt),
}));
```

### learning_activities

Activity log for all learning events.

```typescript
export const learningActivities = pgTable('learning_activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  userId: uuid('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  courseId: uuid('course_id'),
  contentId: uuid('content_id'),
  enrollmentId: uuid('enrollment_id'),
  pathId: uuid('path_id'),
  description: text('description').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  durationMinutes: integer('duration_minutes'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUserIdx: index('activities_tenant_user_idx').on(table.tenantId, table.userId),
  typeIdx: index('activities_type_idx').on(table.tenantId, table.type),
  courseIdx: index('activities_course_idx').on(table.tenantId, table.courseId),
  timestampIdx: index('activities_timestamp_idx').on(table.tenantId, table.timestamp),
  enrollmentIdx: index('activities_enrollment_idx').on(table.enrollmentId),
}));
```

### Additional Tables

```typescript
// === Quizzes ===
export const quizzes = pgTable('learning_quizzes', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  passingScore: integer('passing_score').notNull().default(70),
  maxAttempts: integer('max_attempts').notNull().default(3),
  timeLimitMinutes: integer('time_limit_minutes'),
  shuffleQuestions: boolean('shuffle_questions').notNull().default(false),
  shuffleAnswers: boolean('shuffle_answers').notNull().default(false),
  showResults: boolean('show_results').notNull().default(true),
  showCorrectAnswers: boolean('show_correct_answers').notNull().default(false),
  totalPoints: integer('total_points').notNull().default(0),
  questionCount: integer('question_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  courseIdx: index('quizzes_course_idx').on(table.courseId),
  contentIdx: index('quizzes_content_idx').on(table.contentId),
}));

export const quizQuestions = pgTable('learning_quiz_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  text: text('text').notNull(),
  explanation: text('explanation'),
  points: integer('points').notNull().default(1),
  position: integer('position').notNull().default(0),
  options: jsonb('options').$type<QuizOption[]>(),
  correctAnswer: jsonb('correct_answer'),
  matchingPairs: jsonb('matching_pairs'),
  orderItems: jsonb('order_items').$type<string[]>(),
  mediaUrl: text('media_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  quizIdx: index('quiz_questions_quiz_idx').on(table.quizId),
  positionIdx: index('quiz_questions_position_idx').on(table.quizId, table.position),
}));

export const quizAttempts = pgTable('learning_quiz_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id),
  userId: uuid('user_id').notNull(),
  attemptNumber: integer('attempt_number').notNull(),
  score: integer('score').notNull().default(0),
  maxScore: integer('max_score').notNull(),
  percentage: integer('percentage').notNull().default(0),
  passed: boolean('passed').notNull().default(false),
  answers: jsonb('answers').$type<QuizAnswer[]>().default([]),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  timeSpentMinutes: integer('time_spent_minutes').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  quizIdx: index('quiz_attempts_quiz_idx').on(table.quizId),
  enrollmentIdx: index('quiz_attempts_enrollment_idx').on(table.enrollmentId),
  userIdx: index('quiz_attempts_user_idx').on(table.tenantId, table.userId),
}));

// === Certificates ===
export const certificates = pgTable('learning_certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  userId: uuid('user_id').notNull(),
  userName: text('user_name').notNull(),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  courseTitle: text('course_title').notNull(),
  completionId: uuid('completion_id').notNull().references(() => courseCompletions.id),
  certificateNumber: varchar('certificate_number', { length: 100 }).notNull().unique(),
  issueDate: timestamp('issue_date', { withTimezone: true }).notNull().defaultNow(),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  templateId: varchar('template_id', { length: 100 }).notNull().default('default'),
  pdfUrl: text('pdf_url').notNull(),
  metadata: jsonb('metadata').$type<Record<string, string>>().default({}),
  verificationUrl: text('verification_url').notNull(),
  isValid: boolean('is_valid').notNull().default(true),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokedReason: text('revoked_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUserIdx: index('certificates_tenant_user_idx').on(table.tenantId, table.userId),
  numberIdx: index('certificates_number_idx').on(table.certificateNumber),
  courseIdx: index('certificates_course_idx').on(table.tenantId, table.courseId),
}));

// === Course Approvals ===
export const courseApprovals = pgTable('learning_course_approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  requesterId: uuid('requester_id').notNull(),
  requesterName: text('requester_name').notNull(),
  courseId: uuid('course_id').notNull(),
  courseTitle: text('course_title').notNull(),
  vendorId: uuid('vendor_id'),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  budgetId: uuid('budget_id'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  approverId: uuid('approver_id'),
  approverName: text('approver_name'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  justification: text('justification').notNull(),
  businessCase: text('business_case'),
  skillGapIds: jsonb('skill_gap_ids').$type<string[]>().default([]),
  developmentPlanItemId: uuid('development_plan_item_id'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('approvals_tenant_idx').on(table.tenantId),
  requesterIdx: index('approvals_requester_idx').on(table.tenantId, table.requesterId),
  statusIdx: index('approvals_status_idx').on(table.tenantId, table.status),
  approverIdx: index('approvals_approver_idx').on(table.tenantId, table.approverId),
}));

// === Vendors ===
export const vendors = pgTable('learning_vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  name: text('name').notNull(),
  description: text('description'),
  website: text('website'),
  contactEmail: text('contact_email'),
  contactPhone: varchar('contact_phone', { length: 50 }),
  logoUrl: text('logo_url'),
  provider: varchar('provider', { length: 50 }),
  apiKeyEncrypted: text('api_key_encrypted'),
  ssoEnabled: boolean('sso_enabled').notNull().default(false),
  ssoConfig: jsonb('sso_config').$type<SSOConfig>(),
  contractStartDate: timestamp('contract_start_date', { withTimezone: true }),
  contractEndDate: timestamp('contract_end_date', { withTimezone: true }),
  totalLicenses: integer('total_licenses'),
  usedLicenses: integer('used_licenses').notNull().default(0),
  totalSpent: numeric('total_spent', { precision: 12, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  courseCount: integer('course_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('vendors_tenant_idx').on(table.tenantId),
  activeIdx: index('vendors_active_idx').on(table.tenantId, table.isActive),
  providerIdx: index('vendors_provider_idx').on(table.tenantId, table.provider),
}));

// === Course Ratings ===
export const courseRatings = pgTable('learning_course_ratings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  rating: integer('rating').notNull(), // 1-5
  review: text('review'),
  isVerifiedCompletion: boolean('is_verified_completion').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  courseIdx: index('ratings_course_idx').on(table.tenantId, table.courseId),
  userCourseIdx: index('ratings_user_course_idx').on(table.tenantId, table.userId, table.courseId),
}));

// === Discussions ===
export const discussions = pgTable('learning_discussions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id'),
  title: text('title').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdByName: text('created_by_name').notNull(),
  postCount: integer('post_count').notNull().default(0),
  lastPostAt: timestamp('last_post_at', { withTimezone: true }),
  isPinned: boolean('is_pinned').notNull().default(false),
  isLocked: boolean('is_locked').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  courseIdx: index('discussions_course_idx').on(table.tenantId, table.courseId),
  contentIdx: index('discussions_content_idx').on(table.courseId, table.contentId),
}));

export const discussionPosts = pgTable('learning_discussion_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  discussionId: uuid('discussion_id').notNull().references(() => discussions.id, { onDelete: 'cascade' }),
  parentPostId: uuid('parent_post_id'),
  authorId: uuid('author_id').notNull(),
  authorName: text('author_name').notNull(),
  authorAvatarUrl: text('author_avatar_url'),
  content: text('content').notNull(),
  isInstructor: boolean('is_instructor').notNull().default(false),
  upvoteCount: integer('upvote_count').notNull().default(0),
  replyCount: integer('reply_count').notNull().default(0),
  isEdited: boolean('is_edited').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  discussionIdx: index('discussion_posts_discussion_idx').on(table.discussionId),
  parentIdx: index('discussion_posts_parent_idx').on(table.parentPostId),
}));

// === Mentorships ===
export const mentorships = pgTable('learning_mentorships', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  mentorId: uuid('mentor_id').notNull(),
  mentorName: text('mentor_name').notNull(),
  menteeId: uuid('mentee_id').notNull(),
  menteeName: text('mentee_name').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('requested'),
  skillFocusIds: jsonb('skill_focus_ids').$type<string[]>().default([]),
  skillFocusNames: jsonb('skill_focus_names').$type<string[]>().default([]),
  goals: text('goals').notNull(),
  meetingFrequency: varchar('meeting_frequency', { length: 50 }),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  lastMeetingDate: timestamp('last_meeting_date', { withTimezone: true }),
  nextMeetingDate: timestamp('next_meeting_date', { withTimezone: true }),
  totalMeetings: integer('total_meetings').notNull().default(0),
  notes: jsonb('notes').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('mentorships_tenant_idx').on(table.tenantId),
  mentorIdx: index('mentorships_mentor_idx').on(table.tenantId, table.mentorId),
  menteeIdx: index('mentorships_mentee_idx').on(table.tenantId, table.menteeId),
  statusIdx: index('mentorships_status_idx').on(table.tenantId, table.status),
}));

// === Study Groups ===
export const studyGroups = pgTable('learning_study_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  courseId: uuid('course_id'),
  learningPathId: uuid('learning_path_id'),
  createdBy: uuid('created_by').notNull(),
  maxMembers: integer('max_members').notNull().default(20),
  currentMembers: integer('current_members').notNull().default(0),
  isOpen: boolean('is_open').notNull().default(true),
  meetingSchedule: text('meeting_schedule'),
  meetingLink: text('meeting_link'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('study_groups_tenant_idx').on(table.tenantId),
  courseIdx: index('study_groups_course_idx').on(table.tenantId, table.courseId),
}));

export const studyGroupMembers = pgTable('learning_study_group_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').notNull().references(() => studyGroups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  userName: text('user_name').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  groupIdx: index('study_group_members_group_idx').on(table.groupId),
  userIdx: index('study_group_members_user_idx').on(table.userId),
}));

// === Notifications ===
export const learningNotifications = pgTable('learning_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  userId: uuid('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  courseId: uuid('course_id'),
  enrollmentId: uuid('enrollment_id'),
  complianceAssignmentId: uuid('compliance_assignment_id'),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  actionUrl: text('action_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUserIdx: index('learning_notifs_tenant_user_idx').on(table.tenantId, table.userId),
  unreadIdx: index('learning_notifs_unread_idx').on(table.tenantId, table.userId, table.isRead),
}));

// === Course Bookmarks ===
export const courseBookmarks = pgTable('learning_course_bookmarks', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  userId: uuid('user_id').notNull(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('bookmarks_user_idx').on(table.tenantId, table.userId),
  userCourseIdx: index('bookmarks_user_course_idx').on(table.tenantId, table.userId, table.courseId),
}));
```

### Row-Level Security Policies

All tables use the shared `tenantId()` column and standard RLS policies:

```sql
-- Example: courses table RLS
ALTER TABLE learning_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON learning_courses
  USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "tenant_insert" ON learning_courses
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

-- Enrollments: users can see their own, managers can see team
CREATE POLICY "own_enrollments" ON learning_enrollments
  FOR SELECT USING (
    user_id = auth.uid()
    OR tenant_id = auth.jwt() ->> 'tenant_id'
      AND EXISTS (
        SELECT 1 FROM people_employees
        WHERE id = learning_enrollments.user_id
        AND manager_id = auth.uid()
      )
  );

-- Compliance assignments: HR and managers have broader access
CREATE POLICY "compliance_access" ON learning_compliance_assignments
  FOR SELECT USING (
    user_id = auth.uid()
    OR tenant_id = auth.jwt() ->> 'tenant_id'
      AND (
        auth.jwt() ->> 'role' IN ('hr_admin', 'learning_admin')
        OR EXISTS (
          SELECT 1 FROM people_employees
          WHERE id = learning_compliance_assignments.user_id
          AND manager_id = auth.uid()
        )
      )
  );
```

---

## Code Examples

### Example 1: Creating a Course with Content

```typescript
import { LearningService } from '@mcv/people/learning';

const learning = new LearningService(supabase, tenantId);

// Create a course
const course = await learning.createCourse({
  title: 'Introduction to Data Privacy',
  description: 'Learn the fundamentals of data privacy regulations including GDPR, CCPA, and organizational best practices.',
  shortDescription: 'Master data privacy fundamentals',
  contentType: ContentType.BLENDED,
  level: CourseLevel.BEGINNER,
  format: CourseFormat.SELF_PACED,
  categoryId: 'compliance-category-id',
  tags: ['privacy', 'gdpr', 'ccpa', 'compliance'],
  language: 'en',
  durationMinutes: 120,
  isMandatory: true,
  allowSelfEnrollment: true,
  completionCriteria: {
    type: 'quiz_score',
    minimumScore: 80,
  },
});

// Add video content
await learning.addContent(course.id, {
  title: 'Module 1: What is Data Privacy?',
  type: ContentType.VIDEO,
  storageKey: 'courses/data-privacy/module-1.mp4',
  durationMinutes: 25,
  isRequired: true,
  position: 1,
});

// Add a document
await learning.addContent(course.id, {
  title: 'GDPR Quick Reference Guide',
  type: ContentType.DOCUMENT,
  storageKey: 'courses/data-privacy/gdpr-reference.pdf',
  durationMinutes: 15,
  isRequired: false,
  isPreview: true,
  position: 2,
});

// Add a quiz
await learning.addContent(course.id, {
  title: 'Data Privacy Assessment',
  type: ContentType.QUIZ,
  quizId: quiz.id,
  passingScore: 80,
  maxAttempts: 3,
  durationMinutes: 30,
  isRequired: true,
  position: 3,
});

// Publish the course
await learning.publishCourse(course.id);
console.log(`Course published: ${course.title} (${course.slug})`);
```

### Example 2: Enrolling Users and Tracking Progress

```typescript
import { LearningService, EnrollmentSource } from '@mcv/people/learning';

const learning = new LearningService(supabase, tenantId);

// Self-enrollment
const enrollment = await learning.enroll(userId, courseId, EnrollmentSource.SELF);
console.log(`Enrolled: ${enrollment.id}, status: ${enrollment.status}`);

// Manager assigns training to team
const teamIds = ['user-1', 'user-2', 'user-3', 'user-4'];
const bulkResult = await learning.bulkEnroll(teamIds, courseId, EnrollmentSource.MANAGER);
console.log(`Enrolled ${bulkResult.successCount}/${bulkResult.totalCount} users`);
for (const failure of bulkResult.failures) {
  console.warn(`Failed to enroll ${failure.userId}: ${failure.reason}`);
}

// Record progress as learner completes content
await learning.recordProgress({
  enrollmentId: enrollment.id,
  contentId: 'module-1-id',
  progressPercent: 100,
  timeSpentMinutes: 22,
  position: 1450, // Video position in seconds
});

// Mark content item as complete
await learning.markContentComplete(enrollment.id, 'module-1-id');

// Check overall progress
const progress = await learning.getProgress(enrollment.id);
console.log(`Overall: ${progress.overallPercent}%`);
console.log(`Time spent: ${progress.totalTimeMinutes} minutes`);
console.log(`Estimated remaining: ${progress.estimatedRemainingMinutes} minutes`);

for (const item of progress.contentProgress) {
  console.log(`  ${item.contentTitle}: ${item.status} (${item.progressPercent}%)`);
}
```

### Example 3: Setting Up Compliance Training

```typescript
import { LearningService, ComplianceFrequency } from '@mcv/people/learning';

const learning = new LearningService(supabase, tenantId);

// Create compliance training requirement
const compliance = await learning.createComplianceTraining({
  title: 'Annual Security Awareness Training',
  description: 'Mandatory security awareness training required by company policy and SOC 2 compliance.',
  courseId: securityCourseId,
  frequency: ComplianceFrequency.ANNUAL,
  renewalPeriodDays: 365,
  gracePeriodDays: 30,
  isMandatory: true,
  regulatoryBody: 'SOC 2 / ISO 27001',
  regulationReference: 'SOC 2 CC1.4, ISO 27001 A.7.2.2',
  assignOnHire: true,
  autoAssign: true,
  assignmentRules: [
    { type: 'all', value: null }, // All employees
  ],
  escalationPolicy: {
    maxEscalationLevel: 3,
    blockAccessOnOverdue: true,
    blockAccessAfterDays: 45,
    levels: [
      {
        level: 1,
        daysOverdue: 7,
        actions: [{ type: 'email', templateId: 'compliance-reminder', config: {} }],
        notifyUserIds: [],
        notifyRoles: [],
      },
      {
        level: 2,
        daysOverdue: 14,
        actions: [
          { type: 'email', templateId: 'compliance-urgent', config: {} },
          { type: 'manager_alert', templateId: 'manager-compliance-alert', config: {} },
        ],
        notifyUserIds: [],
        notifyRoles: ['manager'],
      },
      {
        level: 3,
        daysOverdue: 30,
        actions: [
          { type: 'hr_alert', templateId: 'hr-compliance-escalation', config: {} },
          { type: 'block_access', templateId: null, config: { systems: ['all'] } },
        ],
        notifyUserIds: [],
        notifyRoles: ['hr_admin'],
      },
    ],
  },
});

// Auto-assign to all current employees
const assignments = await learning.autoAssignComplianceTraining(compliance.id);
console.log(`Assigned to ${assignments.length} employees`);

// Manually assign to specific new hires with a custom due date
const dueDate = new Date();
dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

await learning.assignComplianceTraining(compliance.id, ['new-hire-1', 'new-hire-2'], dueDate);

// Check overdue assignments
const overdue = await learning.getOverdueAssignments({
  complianceTrainingId: compliance.id,
});
console.log(`${overdue.length} overdue assignments`);

for (const assignment of overdue) {
  const daysOverdue = Math.floor(
    (Date.now() - assignment.dueDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  console.log(
    `  ${assignment.userId}: ${daysOverdue} days overdue (escalation level: ${assignment.escalationLevel})`,
  );
}

// Get compliance status report
const status = await learning.getComplianceStatus({});
console.log(`Overall compliance rate: ${status.compliance.overallComplianceRate}%`);
```

### Example 4: Skill Gap Analysis and Development Plans

```typescript
import { LearningService, SkillProficiency, DevelopmentPlanType } from '@mcv/people/learning';

const learning = new LearningService(supabase, tenantId);

// Run skill gap analysis for a specific employee
const gaps = await learning.analyzeSkillGaps(employeeId, targetRoleId);

console.log('Skill Gap Analysis Results:');
for (const gap of gaps) {
  console.log(`  ${gap.skillName}: ${gap.currentLevel} → ${gap.requiredLevel} (gap: ${gap.gapSize}, priority: ${gap.priority})`);
  if (gap.recommendedCourses.length > 0) {
    console.log(`    Recommended: ${gap.recommendedCourses.map(c => c.title).join(', ')}`);
  }
}

// Get AI-recommended learning based on skill gaps
const recommendations = await learning.getSkillBasedRecommendations(employeeId);
console.log(`\n${recommendations.length} recommended courses`);

// Create a development plan based on the gaps
const plan = await learning.createDevelopmentPlan({
  userId: employeeId,
  managerId: managerId,
  title: 'Q1 2026 Growth Plan: Senior Engineer Readiness',
  description: 'Development plan to prepare for promotion to Senior Engineer by closing key skill gaps.',
  type: DevelopmentPlanType.CAREER_GROWTH,
  startDate: new Date('2026-01-01'),
  targetDate: new Date('2026-06-30'),
  careerGoal: 'Promotion to Senior Engineer',
  targetRoleId: seniorEngineerRoleId,
  reviewFrequency: 'biweekly',
  items: [
    {
      title: 'Complete System Design Course',
      type: 'course',
      courseId: systemDesignCourseId,
      skillId: 'system-design',
      targetSkillLevel: SkillProficiency.ADVANCED,
      isMandatory: true,
      dueDate: new Date('2026-03-15'),
    },
    {
      title: 'Lead a cross-team architecture review',
      type: 'on_the_job',
      skillId: 'technical-leadership',
      targetSkillLevel: SkillProficiency.INTERMEDIATE,
      isMandatory: true,
      dueDate: new Date('2026-04-30'),
    },
    {
      title: 'AWS Solutions Architect Certification',
      type: 'certification',
      courseId: awsCertCourseId,
      skillId: 'cloud-architecture',
      targetSkillLevel: SkillProficiency.ADVANCED,
      isMandatory: false,
      dueDate: new Date('2026-06-30'),
    },
    {
      title: 'Mentorship with Staff Engineer',
      type: 'mentorship',
      skillId: 'technical-leadership',
      targetSkillLevel: SkillProficiency.ADVANCED,
      isMandatory: true,
      dueDate: new Date('2026-06-30'),
    },
  ],
});

console.log(`Development plan created: ${plan.id}`);
console.log(`Total items: ${plan.totalItems}, Progress: ${plan.progressPercent}%`);
```

### Example 5: Learning Path Creation and Management

```typescript
import { LearningService, CourseLevel } from '@mcv/people/learning';

const learning = new LearningService(supabase, tenantId);

// Create a learning path for new engineering hires
const path = await learning.createLearningPath({
  title: 'Engineering Onboarding',
  description: 'Complete onboarding program for new engineering team members. Covers tools, processes, architecture, and culture.',
  level: CourseLevel.BEGINNER,
  tags: ['onboarding', 'engineering', 'new-hire'],
  targetRoles: ['software-engineer', 'senior-engineer', 'staff-engineer'],
  isSequential: true,
  allowSkipping: false,
});

// Add courses in sequence
await learning.addPathCourses(path.id, [
  {
    courseId: companyCultureCourseId,
    position: 1,
    isRequired: true,
    isMilestone: true,
    milestoneTitle: 'Week 1: Culture & Values',
  },
  {
    courseId: devToolsCourseId,
    position: 2,
    isRequired: true,
    isMilestone: false,
  },
  {
    courseId: gitWorkflowCourseId,
    position: 3,
    isRequired: true,
    isMilestone: false,
  },
  {
    courseId: architectureOverviewCourseId,
    position: 4,
    isRequired: true,
    isMilestone: true,
    milestoneTitle: 'Week 2: Architecture Deep Dive',
  },
  {
    courseId: securityPracticesCourseId,
    position: 5,
    isRequired: true,
    isMilestone: false,
  },
  {
    courseId: cicdPipelineCourseId,
    position: 6,
    isRequired: false, // Optional deep dive
    isMilestone: false,
  },
  {
    courseId: firstPRCourseId,
    position: 7,
    isRequired: true,
    isMilestone: true,
    milestoneTitle: 'Week 3: First Contribution',
  },
]);

// Enroll a new hire in the path
const pathEnrollment = await learning.enrollInPath(newHireUserId, path.id);

// Track path progress
const pathProgress = await learning.getPathProgress(pathEnrollment.id);
console.log(`Path progress: ${pathProgress.overallPercent}%`);
console.log(`Milestones reached: ${pathProgress.milestonesReached.join(', ')}`);
console.log(`Estimated days remaining: ${pathProgress.estimatedDaysRemaining}`);

for (const course of pathProgress.courseStatuses) {
  const lockIcon = course.isUnlocked ? '🔓' : '🔒';
  const milestoneIcon = course.isMilestone ? '🏁' : '  ';
  console.log(
    `  ${lockIcon} ${milestoneIcon} ${course.courseTitle}: ${course.status} (${course.progressPercent}%)`,
  );
}
```

### Example 6: Budget Management and Course Approvals

```typescript
import { LearningService, BudgetScopeType, BudgetPeriod } from '@mcv/people/learning';

const learning = new LearningService(supabase, tenantId);

// Set department learning budget
const budget = await learning.setBudget({
  scope: BudgetScopeType.DEPARTMENT,
  departmentId: engineeringDeptId,
  totalBudget: 50000,
  currency: 'USD',
  period: BudgetPeriod.ANNUAL,
  periodStart: new Date('2026-01-01'),
  periodEnd: new Date('2026-12-31'),
  fiscalYear: 2026,
  approvalRequired: true,
  approvalThreshold: 500, // Auto-approve under $500
  rolloverEnabled: true,
  rolloverPercent: 25, // 25% rollover to next year
});

// Set per-employee budget within the department
await learning.setBudget({
  scope: BudgetScopeType.INDIVIDUAL,
  userId: employeeId,
  departmentId: engineeringDeptId,
  totalBudget: 2500,
  currency: 'USD',
  period: BudgetPeriod.ANNUAL,
  periodStart: new Date('2026-01-01'),
  periodEnd: new Date('2026-12-31'),
  fiscalYear: 2026,
  approvalRequired: true,
  approvalThreshold: 200,
});

// Employee requests a course
const approval = await learning.requestCourseApproval({
  courseId: externalCourseId,
  courseTitle: 'Advanced Kubernetes Administration',
  cost: 1200,
  currency: 'USD',
  vendorId: udemyVendorId,
  justification: 'Need advanced K8s skills for the migration project starting Q2.',
  businessCase: 'The Q2 cloud migration project requires the team to manage production K8s clusters. This course covers advanced topics including multi-cluster management, security hardening, and disaster recovery.',
  skillGapIds: ['kubernetes-skill-gap-id'],
  developmentPlanItemId: 'dev-plan-item-id',
});

console.log(`Approval request: ${approval.id}, status: ${approval.status}`);

// Manager approves
const approved = await learning.processCourseApproval(approval.id, {
  decision: 'approved',
  approverId: managerId,
  notes: 'Approved — aligns with Q2 migration objectives.',
});

// Check remaining budget
const remaining = await learning.getRemainingBudget({
  scope: BudgetScopeType.INDIVIDUAL,
  userId: employeeId,
});

console.log(`Budget remaining: $${remaining.remaining} of $${remaining.totalBudget}`);
console.log(`Utilization: ${remaining.utilizationPercent}%`);
console.log(`Pending requests: $${remaining.pending}`);
```

### Example 7: Social Learning — Discussions and Mentorship

```typescript
import { LearningService } from '@mcv/people/learning';

const learning = new LearningService(supabase, tenantId);

// Create a discussion thread for a course
const discussion = await learning.createDiscussion(courseId, {
  title: 'Best practices for implementing GDPR consent flows',
  contentId: module3ContentId, // Linked to a specific course module
});

// Post to the discussion
const post = await learning.postToDiscussion(discussion.id, {
  authorId: userId,
  content: 'Has anyone implemented a consent management platform (CMP) that integrates well with our React stack? Looking for recommendations.',
});

// Reply to a post
await learning.postToDiscussion(discussion.id, {
  authorId: otherUserId,
  parentPostId: post.id,
  content: 'We used OneTrust with a custom React wrapper. Happy to share our implementation details if you\'re interested.',
});

// Request mentorship matching
const mentorship = await learning.requestMentorship({
  menteeId: juniorDevId,
  skillFocusIds: ['system-design', 'technical-leadership'],
  goals: 'Develop system design skills and prepare for senior engineer promotion within 6 months.',
  meetingFrequency: 'biweekly',
  startDate: new Date(),
});

console.log(`Mentorship request created: ${mentorship.id}`);
console.log(`Matched mentor: ${mentorship.mentorName}`);
console.log(`Skills: ${mentorship.skillFocusNames.join(', ')}`);

// Create a study group
const group = await learning.createStudyGroup({
  name: 'AWS Certification Study Group',
  description: 'Weekly study sessions for AWS Solutions Architect certification prep.',
  courseId: awsCertCourseId,
  maxMembers: 10,
  meetingSchedule: 'Thursdays 12:00-13:00 EST',
  meetingLink: 'https://meet.example.com/aws-study',
  createdBy: userId,
});

// Join the study group
await learning.joinStudyGroup(group.id, anotherUserId);
console.log(`Study group "${group.name}": ${group.currentMembers}/${group.maxMembers} members`);
```

### Example 8: Analytics and Reporting

```typescript
import { LearningService } from '@mcv/people/learning';

const learning = new LearningService(supabase, tenantId);

const period = {
  start: new Date('2026-01-01'),
  end: new Date('2026-03-31'),
};

// Get comprehensive learning analytics
const analytics = await learning.getAnalytics({ period });

console.log('=== Learning Analytics Q1 2026 ===');
console.log(`Active learners: ${analytics.overview.activeLearners}`);
console.log(`Total enrollments: ${analytics.overview.totalEnrollments}`);
console.log(`Completions: ${analytics.overview.totalCompletions}`);
console.log(`Average completion rate: ${analytics.overview.averageCompletionRate}%`);
console.log(`Total training hours: ${analytics.overview.totalTrainingHours}`);
console.log(`Hours per learner: ${analytics.overview.averageHoursPerLearner}`);

// Compliance report
console.log(`\n=== Compliance Status ===`);
console.log(`Overall compliance: ${analytics.compliance.overallComplianceRate}%`);
console.log(`Overdue: ${analytics.compliance.overdueAssignments}`);
console.log(`Due in 30 days: ${analytics.compliance.upcomingDue30Days}`);

for (const dept of analytics.compliance.byDepartment) {
  const icon = dept.complianceRate >= 95 ? '✅' : dept.complianceRate >= 80 ? '⚠️' : '❌';
  console.log(`  ${icon} ${dept.departmentName}: ${dept.complianceRate}% (${dept.overdueCount} overdue)`);
}

// ROI Analysis
const roi = await learning.calculateROI({ period });
console.log(`\n=== ROI Analysis ===`);
console.log(`Total investment: $${roi.totalInvestment.toLocaleString()}`);
console.log(`Cost per completion: $${roi.costPerCompletion.toFixed(2)}`);
console.log(`Cost per learner: $${roi.costPerLearner.toFixed(2)}`);
console.log(`Skill improvements: ${roi.skillImprovements}`);

for (const program of roi.byProgram) {
  console.log(`  ${program.programName}: $${program.investment} → ${program.completions} completions ($${program.costPerCompletion.toFixed(2)}/each)`);
}

// Manager team stats
const teamStats = await learning.getTeamStats(managerId, { period });
console.log(`\n=== Team Learning Stats ===`);
console.log(`Team size: ${teamStats.teamSize}`);
console.log(`Completion rate: ${teamStats.completionRate}%`);
console.log(`Compliance rate: ${teamStats.complianceRate}%`);
console.log(`Budget utilization: ${teamStats.budgetUtilization}%`);

for (const member of teamStats.memberStats) {
  const complianceIcon =
    member.complianceStatus === 'compliant' ? '✅' :
    member.complianceStatus === 'at_risk' ? '⚠️' : '❌';
  console.log(
    `  ${complianceIcon} ${member.name}: ${member.completions} completions, ${member.trainingHours}h, $${member.budgetUsed} spent`,
  );
  if (member.topSkillGaps.length > 0) {
    console.log(`     Gaps: ${member.topSkillGaps.join(', ')}`);
  }
}
```

---

## Error Codes

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| `LEARNING_001` | `COURSE_NOT_FOUND` | 404 | Course with the specified ID does not exist or is not accessible |
| `LEARNING_002` | `COURSE_NOT_PUBLISHED` | 400 | Cannot enroll in an unpublished course |
| `LEARNING_003` | `COURSE_ARCHIVED` | 400 | Cannot enroll in an archived course |
| `LEARNING_004` | `ENROLLMENT_EXISTS` | 409 | User is already enrolled in this course |
| `LEARNING_005` | `ENROLLMENT_NOT_FOUND` | 404 | Enrollment with the specified ID does not exist |
| `LEARNING_006` | `ENROLLMENT_CANCELLED` | 400 | Cannot update progress on a cancelled enrollment |
| `LEARNING_007` | `ENROLLMENT_COMPLETED` | 400 | Cannot update progress on an already completed enrollment |
| `LEARNING_008` | `MAX_ENROLLMENTS_REACHED` | 409 | Course has reached maximum enrollment capacity |
| `LEARNING_009` | `ENROLLMENT_DEADLINE_PASSED` | 400 | Course enrollment deadline has passed |
| `LEARNING_010` | `PREREQUISITES_NOT_MET` | 400 | User has not completed required prerequisite courses |
| `LEARNING_011` | `SELF_ENROLLMENT_DISABLED` | 403 | Self-enrollment is not allowed for this course; manager assignment required |
| `LEARNING_012` | `CONTENT_NOT_FOUND` | 404 | Course content item not found |
| `LEARNING_013` | `INVALID_CONTENT_TYPE` | 400 | Unsupported or invalid content type |
| `LEARNING_014` | `SCORM_PACKAGE_INVALID` | 400 | SCORM package is invalid, corrupt, or missing required manifest |
| `LEARNING_015` | `SCORM_RUNTIME_ERROR` | 500 | Error in SCORM runtime communication |
| `LEARNING_016` | `XAPI_STATEMENT_INVALID` | 400 | xAPI statement is malformed or missing required fields |
| `LEARNING_017` | `QUIZ_NOT_FOUND` | 404 | Quiz not found |
| `LEARNING_018` | `QUIZ_MAX_ATTEMPTS` | 400 | Maximum quiz attempts exceeded |
| `LEARNING_019` | `QUIZ_TIME_EXPIRED` | 400 | Quiz time limit has expired |
| `LEARNING_020` | `QUIZ_ALREADY_SUBMITTED` | 400 | Quiz attempt has already been submitted |
| `LEARNING_021` | `COMPLETION_CRITERIA_NOT_MET` | 400 | Course completion criteria not satisfied (required content, minimum score, etc.) |
| `LEARNING_022` | `CERTIFICATE_NOT_FOUND` | 404 | Certificate not found |
| `LEARNING_023` | `CERTIFICATE_REVOKED` | 400 | Certificate has been revoked |
| `LEARNING_024` | `CERTIFICATE_EXPIRED` | 400 | Certificate has expired |
| `LEARNING_025` | `PATH_NOT_FOUND` | 404 | Learning path not found |
| `LEARNING_026` | `PATH_COURSE_LOCKED` | 400 | Cannot access this course; previous course in the path must be completed first |
| `LEARNING_027` | `PATH_ENROLLMENT_EXISTS` | 409 | User is already enrolled in this learning path |
| `LEARNING_028` | `COMPLIANCE_TRAINING_NOT_FOUND` | 404 | Compliance training requirement not found |
| `LEARNING_029` | `COMPLIANCE_ALREADY_ASSIGNED` | 409 | User already has an active compliance assignment for this training |
| `LEARNING_030` | `COMPLIANCE_ASSIGNMENT_NOT_FOUND` | 404 | Compliance assignment not found |
| `LEARNING_031` | `COMPLIANCE_EXEMPTION_DENIED` | 403 | Insufficient permissions to grant compliance exemption |
| `LEARNING_032` | `SKILL_FRAMEWORK_NOT_FOUND` | 404 | Skill framework not found |
| `LEARNING_033` | `SKILL_NOT_IN_FRAMEWORK` | 400 | Specified skill does not exist in the framework |
| `LEARNING_034` | `INVALID_SKILL_LEVEL` | 400 | Invalid skill proficiency level |
| `LEARNING_035` | `DEVELOPMENT_PLAN_NOT_FOUND` | 404 | Development plan not found |
| `LEARNING_036` | `DEVELOPMENT_PLAN_LOCKED` | 400 | Development plan is in a completed or cancelled state and cannot be modified |
| `LEARNING_037` | `BUDGET_NOT_FOUND` | 404 | Learning budget not found for the specified scope |
| `LEARNING_038` | `BUDGET_EXCEEDED` | 400 | Requested amount exceeds available budget |
| `LEARNING_039` | `BUDGET_PERIOD_MISMATCH` | 400 | Transaction date falls outside the budget period |
| `LEARNING_040` | `APPROVAL_NOT_FOUND` | 404 | Course approval request not found |
| `LEARNING_041` | `APPROVAL_ALREADY_PROCESSED` | 400 | Approval has already been approved or rejected |
| `LEARNING_042` | `APPROVAL_EXPIRED` | 400 | Approval request has expired |
| `LEARNING_043` | `APPROVAL_UNAUTHORIZED` | 403 | User is not authorized to approve this request |
| `LEARNING_044` | `VENDOR_NOT_FOUND` | 404 | Vendor not found |
| `LEARNING_045` | `VENDOR_LICENSE_EXHAUSTED` | 400 | All vendor licenses are in use |
| `LEARNING_046` | `EXTERNAL_PROVIDER_ERROR` | 502 | Error communicating with external learning provider |
| `LEARNING_047` | `EXTERNAL_SYNC_FAILED` | 500 | Failed to sync courses from external provider |
| `LEARNING_048` | `SSO_LAUNCH_FAILED` | 500 | Failed to generate SSO launch URL for external content |
| `LEARNING_049` | `DISCUSSION_LOCKED` | 400 | Discussion is locked and does not accept new posts |
| `LEARNING_050` | `STUDY_GROUP_FULL` | 400 | Study group has reached maximum member capacity |
| `LEARNING_051` | `MENTORSHIP_NOT_AVAILABLE` | 400 | No suitable mentors available for the requested skills |
| `LEARNING_052` | `UPLOAD_TOO_LARGE` | 413 | Content file exceeds maximum upload size |
| `LEARNING_053` | `UNSUPPORTED_FILE_FORMAT` | 400 | File format is not supported for this content type |
| `LEARNING_054` | `TENANT_MISMATCH` | 403 | Operation attempted across tenant boundary |
| `LEARNING_055` | `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions for this operation |

---

## Security

### Authentication & Authorization

All learning endpoints require authentication via Supabase Auth JWT tokens. Authorization is enforced at multiple levels:

```typescript
// Role-based access control
enum LearningRole {
  LEARNER = 'learner',           // All authenticated users
  MANAGER = 'manager',           // Can manage team learning
  INSTRUCTOR = 'instructor',     // Can create and manage courses
  HR_ADMIN = 'hr_admin',         // Can manage compliance, budgets
  LEARNING_ADMIN = 'learning_admin', // Full learning system access
  SYSTEM_ADMIN = 'system_admin', // Superadmin
}

// Permission matrix
const permissions = {
  // Courses
  'course.create':    ['instructor', 'learning_admin'],
  'course.publish':   ['learning_admin'],
  'course.archive':   ['learning_admin'],
  'course.view':      ['learner', 'manager', 'instructor', 'hr_admin', 'learning_admin'],
  'course.enroll':    ['learner', 'manager', 'hr_admin', 'learning_admin'],

  // Compliance
  'compliance.create':    ['hr_admin', 'learning_admin'],
  'compliance.assign':    ['hr_admin', 'learning_admin'],
  'compliance.exempt':    ['hr_admin'],
  'compliance.view_all':  ['hr_admin', 'learning_admin'],
  'compliance.view_team': ['manager'],
  'compliance.view_own':  ['learner'],

  // Skills & Development
  'skill.framework.manage': ['hr_admin', 'learning_admin'],
  'skill.assess_self':      ['learner'],
  'skill.assess_team':      ['manager'],
  'dev_plan.create':        ['learner', 'manager', 'hr_admin'],
  'dev_plan.review':        ['manager', 'hr_admin'],

  // Budget
  'budget.set':          ['hr_admin', 'learning_admin'],
  'budget.view_org':     ['hr_admin', 'learning_admin'],
  'budget.view_dept':    ['manager', 'hr_admin'],
  'budget.approve':      ['manager', 'hr_admin'],
  'budget.request':      ['learner'],

  // Analytics
  'analytics.org':       ['hr_admin', 'learning_admin'],
  'analytics.dept':      ['manager', 'hr_admin'],
  'analytics.team':      ['manager'],
  'analytics.personal':  ['learner'],
};
```

### Data Protection

- **Tenant Isolation** — Row-Level Security (RLS) on all tables ensures strict tenant data separation at the database level
- **Content Access Control** — Course content is served via time-limited signed URLs from Supabase Storage, preventing unauthorized direct access
- **SCORM Package Sandboxing** — SCORM content is served within a sandboxed iframe with restrictive `Content-Security-Policy` headers
- **API Key Encryption** — External provider API keys are encrypted at rest using AES-256-GCM before storage
- **SSO Configuration Secrets** — OAuth client secrets and SAML certificates are encrypted and never exposed in API responses
- **Certificate Verification** — Certificates use cryptographically unique verification codes that can be validated without authentication
- **Quiz Answer Protection** — Correct answers are never sent to the client before quiz submission; validation occurs server-side
- **Progress Integrity** — Progress updates are validated server-side to prevent manipulation (e.g., marking content complete without time spent)
- **Audit Trail** — All significant actions (enrollment, completion, compliance state changes, approval decisions, budget transactions) are logged to the `learning_activities` table with full context

### Input Validation

```typescript
// All inputs are validated via Zod schemas
import { z } from 'zod';

const courseCreateSchema = z.object({
  title: z.string().min(3).max(500),
  description: z.string().max(10000),
  contentType: z.nativeEnum(ContentType),
  level: z.nativeEnum(CourseLevel),
  format: z.nativeEnum(CourseFormat),
  cost: z.number().min(0).max(999999),
  currency: z.string().length(3),
  tags: z.array(z.string().max(50)).max(20),
  language: z.string().min(2).max(10),
  durationMinutes: z.number().int().min(0).max(99999),
  passingScore: z.number().int().min(0).max(100).optional(),
  // ... additional fields
});

const progressInputSchema = z.object({
  enrollmentId: z.string().uuid(),
  contentId: z.string().uuid(),
  progressPercent: z.number().int().min(0).max(100),
  timeSpentMinutes: z.number().int().min(0).max(1440),
  position: z.number().int().min(0).optional(),
});

const quizAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.union([z.string(), z.array(z.string())]),
});
```

### Rate Limiting

```typescript
// Rate limits per endpoint category
const rateLimits = {
  'course.search':         { windowMs: 60_000, max: 60 },
  'course.enroll':         { windowMs: 60_000, max: 10 },
  'progress.update':       { windowMs: 10_000, max: 20 },
  'quiz.submit':           { windowMs: 60_000, max: 5 },
  'scorm.api':             { windowMs: 1_000, max: 50 },  // SCORM API is chatty
  'xapi.statement':        { windowMs: 1_000, max: 30 },
  'approval.request':      { windowMs: 60_000, max: 5 },
  'analytics.query':       { windowMs: 60_000, max: 10 },
  'content.upload':        { windowMs: 300_000, max: 10 },
  'certificate.verify':    { windowMs: 60_000, max: 30 },
};
```

### Content Security

```typescript
// Content upload restrictions
const contentLimits = {
  maxFileSize: {
    video: 2 * 1024 * 1024 * 1024,    // 2 GB
    scorm: 500 * 1024 * 1024,          // 500 MB
    document: 50 * 1024 * 1024,        // 50 MB
    image: 10 * 1024 * 1024,           // 10 MB
  },
  allowedMimeTypes: {
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    document: ['application/pdf', 'application/vnd.openxmlformats-officedocument.*'],
    scorm: ['application/zip', 'application/x-zip-compressed'],
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  signedUrlExpiry: 3600, // 1 hour
};

// SCORM iframe Content-Security-Policy
const scormCSP = `
  default-src 'none';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  media-src 'self' blob:;
  connect-src 'self';
  frame-src 'none';
`;
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | — | Supabase anonymous key for client-side operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key for server-side operations |
| `LEARNING_STORAGE_BUCKET` | No | `learning-content` | Supabase Storage bucket for course content |
| `LEARNING_SCORM_BUCKET` | No | `learning-scorm` | Supabase Storage bucket for extracted SCORM packages |
| `LEARNING_CERTIFICATES_BUCKET` | No | `learning-certificates` | Supabase Storage bucket for generated certificate PDFs |
| `LEARNING_MAX_UPLOAD_SIZE_MB` | No | `2048` | Maximum file upload size in megabytes |
| `LEARNING_SIGNED_URL_EXPIRY` | No | `3600` | Signed URL expiry time in seconds |
| `LEARNING_CONTENT_CDN_URL` | No | — | CDN base URL for content delivery (if using CDN) |
| `LEARNING_CERTIFICATE_BASE_URL` | No | `{APP_URL}/verify` | Base URL for certificate verification links |
| `LEARNING_ENCRYPTION_KEY` | Yes | — | AES-256 key for encrypting vendor API keys and SSO secrets |
| `LINKEDIN_LEARNING_CLIENT_ID` | No | — | LinkedIn Learning OAuth2 client ID |
| `LINKEDIN_LEARNING_CLIENT_SECRET` | No | — | LinkedIn Learning OAuth2 client secret |
| `LINKEDIN_LEARNING_ORG_ID` | No | — | LinkedIn Learning organization ID |
| `UDEMY_BUSINESS_API_KEY` | No | — | Udemy Business API key |
| `UDEMY_BUSINESS_ACCOUNT_ID` | No | — | Udemy Business account ID |
| `UDEMY_BUSINESS_BASE_URL` | No | `https://api.udemy.com/api-2.0` | Udemy Business API base URL |
| `COURSERA_API_KEY` | No | — | Coursera for Business API key |
| `COURSERA_ORG_ID` | No | — | Coursera organization ID |
| `LEARNING_COMPLIANCE_CHECK_CRON` | No | `0 8 * * *` | Cron schedule for compliance due date checks (daily at 8am) |
| `LEARNING_ESCALATION_CRON` | No | `0 9 * * *` | Cron schedule for escalation processing |
| `LEARNING_EXTERNAL_SYNC_CRON` | No | `0 2 * * *` | Cron schedule for external provider course sync |
| `LEARNING_ANALYTICS_CACHE_TTL` | No | `300` | Cache TTL for analytics queries in seconds |
| `LEARNING_RECOMMENDATION_MODEL` | No | `collaborative` | Recommendation algorithm: `collaborative`, `content_based`, `hybrid` |
| `XAPI_ENDPOINT` | No | — | xAPI LRS endpoint URL (if using external LRS) |
| `XAPI_AUTH_TOKEN` | No | — | xAPI LRS authentication token |
| `SCORM_DEBUG_MODE` | No | `false` | Enable SCORM runtime debug logging |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/database` | Drizzle ORM schemas, connection management, tenant utilities |
| `@mcv/auth` | Authentication, JWT validation, role checks |
| `@mcv/storage` | Supabase Storage abstraction for file uploads/downloads |
| `@mcv/notifications` | Email, in-app, and push notification delivery |
| `@mcv/people/core` | Employee records, department structure, role definitions |
| `@mcv/people/org` | Organization hierarchy, manager relationships |
| `@mcv/jobs` | Background job scheduling for compliance checks, sync, escalation |
| `@mcv/audit` | Audit trail logging for compliance-sensitive operations |
| `@mcv/cache` | Redis-based caching for analytics and catalog queries |
| `@mcv/pdf` | PDF generation for certificates |
| `@mcv/trpc` | tRPC router and middleware infrastructure |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.0` | Type-safe SQL query builder and ORM |
| `@supabase/supabase-js` | `^2.39.0` | Supabase client for database and storage operations |
| `zod` | `^3.22.0` | Runtime type validation for all inputs |
| `@trpc/server` | `^10.45.0` | Type-safe API router |
| `nanoid` | `^5.0.0` | Unique certificate number generation |
| `date-fns` | `^3.3.0` | Date manipulation for due dates, periods, scheduling |
| `jszip` | `^3.10.0` | SCORM package extraction |
| `xml2js` | `^0.6.0` | SCORM manifest (imsmanifest.xml) parsing |
| `uuid` | `^9.0.0` | UUID generation for xAPI statement IDs |
| `lodash-es` | `^4.17.0` | Utility functions for data transformation |
| `sharp` | `^0.33.0` | Thumbnail generation for uploaded content |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | `^18.2.0` | React hooks and components |
| `@tanstack/react-query` | `^5.17.0` | Data fetching and caching for React hooks |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── services/
│   │   ├── course.service.test.ts
│   │   ├── enrollment.service.test.ts
│   │   ├── compliance-training.service.test.ts
│   │   ├── skill-gap.service.test.ts
│   │   ├── development-plan.service.test.ts
│   │   ├── learning-path.service.test.ts
│   │   ├── quiz.service.test.ts
│   │   ├── certificate.service.test.ts
│   │   ├── learning-budget.service.test.ts
│   │   ├── course-approval.service.test.ts
│   │   ├── scorm-runtime.service.test.ts
│   │   ├── discussion.service.test.ts
│   │   ├── mentorship.service.test.ts
│   │   ├── learning-analytics.service.test.ts
│   │   └── external-content.service.test.ts
│   ├── routers/
│   │   ├── learning.router.test.ts
│   │   └── learning.router.integration.test.ts
│   ├── schemas/
│   │   └── schemas.validation.test.ts
│   └── e2e/
│       ├── enrollment-flow.e2e.test.ts
│       ├── compliance-flow.e2e.test.ts
│       ├── learning-path-flow.e2e.test.ts
│       ├── budget-approval-flow.e2e.test.ts
│       └── scorm-playback.e2e.test.ts
├── __fixtures__/
│   ├── courses.fixture.ts
│   ├── enrollments.fixture.ts
│   ├── compliance.fixture.ts
│   ├── skills.fixture.ts
│   ├── budgets.fixture.ts
│   ├── scorm-package.fixture.zip
│   └── quiz.fixture.ts
└── __mocks__/
    ├── supabase.mock.ts
    ├── storage.mock.ts
    ├── notifications.mock.ts
    └── external-providers.mock.ts
```

### Running Tests

```bash
# All learning module tests
pnpm test --filter @mcv/people-learning

# Service tests only
pnpm test --filter @mcv/people-learning -- --testPathPattern="services"

# Integration tests (requires database)
pnpm test:integration --filter @mcv/people-learning

# E2E tests
pnpm test:e2e --filter @mcv/people-learning

# Coverage report
pnpm test:coverage --filter @mcv/people-learning

# Watch mode during development
pnpm test --filter @mcv/people-learning -- --watch
```

### Test Examples

#### Unit Test: Enrollment Service

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnrollmentService } from '../services/enrollment.service';
import { createMockSupabase, createTestCourse, createTestUser } from '../__mocks__/supabase.mock';

describe('EnrollmentService', () => {
  let service: EnrollmentService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new EnrollmentService(mockSupabase, 'test-tenant-id');
  });

  describe('enroll', () => {
    it('should create an enrollment for a published course', async () => {
      const course = createTestCourse({ isPublished: true, allowSelfEnrollment: true });
      const user = createTestUser();

      mockSupabase.from('learning_courses').select.mockResolvedValueOnce({
        data: course,
        error: null,
      });
      mockSupabase.from('learning_enrollments').select.mockResolvedValueOnce({
        data: [],
        error: null,
      });
      mockSupabase.from('learning_enrollments').insert.mockResolvedValueOnce({
        data: {
          id: 'enrollment-1',
          userId: user.id,
          courseId: course.id,
          status: 'enrolled',
          progressPercent: 0,
          source: 'self',
        },
        error: null,
      });

      const enrollment = await service.enroll(user.id, course.id, 'self');

      expect(enrollment.status).toBe('enrolled');
      expect(enrollment.progressPercent).toBe(0);
      expect(enrollment.source).toBe('self');
    });

    it('should reject enrollment for unpublished course', async () => {
      const course = createTestCourse({ isPublished: false });
      const user = createTestUser();

      mockSupabase.from('learning_courses').select.mockResolvedValueOnce({
        data: course,
        error: null,
      });

      await expect(service.enroll(user.id, course.id, 'self')).rejects.toThrow(
        'COURSE_NOT_PUBLISHED',
      );
    });

    it('should reject duplicate enrollment', async () => {
      const course = createTestCourse({ isPublished: true });
      const user = createTestUser();

      mockSupabase.from('learning_courses').select.mockResolvedValueOnce({
        data: course,
        error: null,
      });
      mockSupabase.from('learning_enrollments').select.mockResolvedValueOnce({
        data: [{ id: 'existing-enrollment', status: 'enrolled' }],
        error: null,
      });

      await expect(service.enroll(user.id, course.id, 'self')).rejects.toThrow(
        'ENROLLMENT_EXISTS',
      );
    });

    it('should reject when prerequisites not met', async () => {
      const prereqCourse = createTestCourse({ id: 'prereq-1' });
      const course = createTestCourse({
        isPublished: true,
        prerequisites: [prereqCourse.id],
      });
      const user = createTestUser();

      mockSupabase.from('learning_courses').select.mockResolvedValueOnce({
        data: course,
        error: null,
      });
      mockSupabase.from('learning_enrollments').select.mockResolvedValueOnce({
        data: [],
        error: null,
      });
      // No completion record for prerequisite
      mockSupabase.from('learning_course_completions').select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await expect(service.enroll(user.id, course.id, 'self')).rejects.toThrow(
        'PREREQUISITES_NOT_MET',
      );
    });

    it('should reject when max enrollments reached', async () => {
      const course = createTestCourse({
        isPublished: true,
        maxEnrollments: 50,
        totalEnrollments: 50,
      });
      const user = createTestUser();

      mockSupabase.from('learning_courses').select.mockResolvedValueOnce({
        data: course,
        error: null,
      });

      await expect(service.enroll(user.id, course.id, 'self')).rejects.toThrow(
        'MAX_ENROLLMENTS_REACHED',
      );
    });
  });

  describe('recordProgress', () => {
    it('should update progress and recalculate overall percentage', async () => {
      const enrollment = {
        id: 'enrollment-1',
        status: 'in_progress',
        completedContentIds: ['content-1'],
        courseId: 'course-1',
      };

      const courseContent = [
        { id: 'content-1', isRequired: true },
        { id: 'content-2', isRequired: true },
        { id: 'content-3', isRequired: false },
      ];

      mockSupabase.from('learning_enrollments').select.mockResolvedValueOnce({
        data: enrollment,
        error: null,
      });
      mockSupabase.from('learning_course_content').select.mockResolvedValueOnce({
        data: courseContent,
        error: null,
      });

      const progress = await service.recordProgress({
        enrollmentId: 'enrollment-1',
        contentId: 'content-2',
        progressPercent: 100,
        timeSpentMinutes: 15,
      });

      // 2 of 2 required content items complete = 100%
      expect(progress.overallPercent).toBe(100);
    });
  });
});
```

#### Integration Test: Compliance Training Flow

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient, seedTestData, cleanupTestData } from '../__fixtures__/test-helpers';

describe('Compliance Training Flow (Integration)', () => {
  let client: TestClient;
  let testData: TestData;

  beforeAll(async () => {
    client = await createTestClient();
    testData = await seedTestData(client, {
      users: 5,
      courses: 1,
      departments: 2,
    });
  });

  afterAll(async () => {
    await cleanupTestData(client, testData);
  });

  it('should execute full compliance lifecycle: create → assign → complete → certify → renew', async () => {
    // 1. Create compliance training
    const training = await client.learning.createComplianceTraining({
      title: 'Test Compliance Training',
      courseId: testData.courses[0].id,
      frequency: 'annual',
      renewalPeriodDays: 365,
      gracePeriodDays: 14,
      isMandatory: true,
      autoAssign: false,
      escalationPolicy: {
        levels: [
          { level: 1, daysOverdue: 7, actions: [{ type: 'email', templateId: null, config: {} }], notifyUserIds: [], notifyRoles: [] },
        ],
        maxEscalationLevel: 1,
        blockAccessOnOverdue: false,
        blockAccessAfterDays: null,
      },
    });

    expect(training.id).toBeDefined();
    expect(training.isActive).toBe(true);

    // 2. Assign to users
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const assignments = await client.learning.assignComplianceTraining(
      training.id,
      testData.users.map(u => u.id),
      dueDate,
    );

    expect(assignments).toHaveLength(testData.users.length);
    expect(assignments[0].state).toBe('assigned');

    // 3. User completes the course
    const userId = testData.users[0].id;
    const assignment = assignments.find(a => a.userId === userId)!;

    // Enroll and complete
    const enrollment = await client.learning.enroll(userId, testData.courses[0].id, 'compliance');
    await client.learning.markContentComplete(enrollment.id, testData.courses[0].contentIds[0]);
    const completion = await client.learning.completeCourse(enrollment.id);

    expect(completion.satisfiesCompliance).toBe(true);

    // 4. Verify compliance assignment is updated
    const updatedAssignment = await client.learning.getComplianceAssignment(assignment.id);
    expect(updatedAssignment.state).toBe('completed');
    expect(updatedAssignment.completedAt).toBeDefined();
    expect(updatedAssignment.certificateId).toBeDefined();
    expect(updatedAssignment.renewalDate).toBeDefined();

    // 5. Verify certificate
    const cert = await client.learning.verifyCertificate(updatedAssignment.certificateId!);
    expect(cert.isValid).toBe(true);
    expect(cert.recipientName).toBe(testData.users[0].name);
  });

  it('should escalate overdue assignments', async () => {
    // Create training with past due date
    const training = await client.learning.createComplianceTraining({
      title: 'Overdue Test Training',
      courseId: testData.courses[0].id,
      frequency: 'one_time',
      isMandatory: true,
      autoAssign: false,
      escalationPolicy: {
        levels: [
          { level: 1, daysOverdue: 0, actions: [{ type: 'email', templateId: null, config: {} }], notifyUserIds: [], notifyRoles: [] },
        ],
        maxEscalationLevel: 1,
        blockAccessOnOverdue: false,
        blockAccessAfterDays: null,
      },
    });

    const pastDue = new Date();
    pastDue.setDate(pastDue.getDate() - 10);

    const assignments = await client.learning.assignComplianceTraining(
      training.id,
      [testData.users[1].id],
      pastDue,
    );

    // Run escalation
    const result = await client.learning.escalateOverdue(assignments[0].id);

    expect(result.escalated).toBe(true);
    expect(result.newLevel).toBe(1);

    // Verify state change
    const updated = await client.learning.getComplianceAssignment(assignments[0].id);
    expect(updated.state).toBe('escalated');
    expect(updated.escalationLevel).toBe(1);
  });
});
```

#### E2E Test: Learning Path Completion

```typescript
import { describe, it, expect } from 'vitest';
import { createE2EClient } from '../__fixtures__/e2e-helpers';

describe('Learning Path E2E', () => {
  it('should complete a sequential learning path with milestones', async () => {
    const client = await createE2EClient('learner');

    // Get available learning paths
    const paths = await client.learning.listLearningPaths({ isPublished: true });
    expect(paths.data.length).toBeGreaterThan(0);

    const path = paths.data[0];
    expect(path.isSequential).toBe(true);

    // Enroll in path
    const enrollment = await client.learning.enrollInPath(client.userId, path.id);
    expect(enrollment.status).toBe('enrolled');
    expect(enrollment.progressPercent).toBe(0);

    // Complete courses in sequence
    for (const pathCourse of path.courses) {
      if (!pathCourse.isRequired) continue;

      // Verify unlock status
      const progress = await client.learning.getPathProgress(enrollment.id);
      const courseStatus = progress.courseStatuses.find(c => c.courseId === pathCourse.courseId)!;
      expect(courseStatus.isUnlocked).toBe(true);

      // Complete the course
      const courseEnrollment = enrollment.courseEnrollments.find(
        e => e.courseId === pathCourse.courseId,
      )!;

      // Simulate content completion
      const course = await client.learning.getCourse(pathCourse.courseId);
      for (const content of course!.requiredContentIds) {
        await client.learning.markContentComplete(courseEnrollment.id, content);
      }
      await client.learning.completeCourse(courseEnrollment.id);
    }

    // Verify path completion
    const finalProgress = await client.learning.getPathProgress(enrollment.id);
    expect(finalProgress.overallPercent).toBe(100);
    expect(finalProgress.milestonesReached.length).toBeGreaterThan(0);
  });
});
```

### Test Coverage Targets

| Area | Target | Notes |
|------|--------|-------|
| Services (unit) | ≥ 90% | Core business logic must be thoroughly tested |
| Router (integration) | ≥ 85% | All tRPC procedures tested with auth context |
| Schema validation | 100% | All Zod schemas tested with valid and invalid inputs |
| Error paths | ≥ 90% | Every error code must have at least one test |
| Compliance flows | 100% | Compliance logic is audit-critical |
| SCORM runtime | ≥ 80% | SCORM API methods and state management |
| Analytics queries | ≥ 75% | Complex aggregation queries |
| E2E flows | Key flows | Enrollment, compliance, learning paths, budget approval |

### Test Fixtures

```typescript
// courses.fixture.ts
export function createTestCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: overrides.id ?? randomUUID(),
    tenantId: overrides.tenantId ?? 'test-tenant',
    title: overrides.title ?? 'Test Course',
    slug: overrides.slug ?? 'test-course',
    description: overrides.description ?? 'A test course for unit testing.',
    shortDescription: 'Test course',
    thumbnailUrl: null,
    bannerUrl: null,
    categoryId: null,
    subcategoryId: null,
    tags: overrides.tags ?? ['test'],
    level: overrides.level ?? CourseLevel.BEGINNER,
    format: overrides.format ?? CourseFormat.SELF_PACED,
    contentType: overrides.contentType ?? ContentType.VIDEO,
    durationMinutes: overrides.durationMinutes ?? 60,
    contentCount: overrides.contentCount ?? 3,
    language: 'en',
    languages: ['en'],
    authorId: overrides.authorId ?? 'author-1',
    authorName: 'Test Author',
    instructorIds: [],
    vendorId: null,
    externalCourseId: null,
    externalProvider: null,
    prerequisites: overrides.prerequisites ?? [],
    skillRequirements: [],
    passingScore: overrides.passingScore ?? null,
    requiredContentIds: overrides.requiredContentIds ?? [],
    completionCriteria: overrides.completionCriteria ?? { type: 'all_content' },
    cost: overrides.cost ?? 0,
    currency: 'USD',
    isFree: overrides.isFree ?? true,
    isPublished: overrides.isPublished ?? true,
    isArchived: overrides.isArchived ?? false,
    isMandatory: overrides.isMandatory ?? false,
    allowSelfEnrollment: overrides.allowSelfEnrollment ?? true,
    maxEnrollments: overrides.maxEnrollments ?? null,
    enrollmentDeadline: null,
    averageRating: 0,
    totalRatings: 0,
    totalEnrollments: overrides.totalEnrollments ?? 0,
    totalCompletions: 0,
    publishedAt: overrides.isPublished ? new Date() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    ...overrides,
  };
}
```

---

*Last updated: 2026-02-09*
*Module version: 0.9.0*
*Documentation version: 2.0.0*