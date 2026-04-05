# @mcv/people — API Reference

> **Package:** `@mcv/people`
> **Classification:** PUBLISHABLE
> **Tier:** 5 — Domain Layer
> **Version:** 1.0.0
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Directory Service](#directory-service)
3. [Org Service](#org-service)
4. [Hiring Service](#hiring-service)
5. [Onboarding Service](#onboarding-service)
6. [Leave Service](#leave-service)
7. [Time Service](#time-service)
8. [Performance Service](#performance-service)
9. [Learning Service](#learning-service)
10. [Shared Types](#shared-types)
11. [Zod Schemas](#zod-schemas)
12. [Domain Events](#domain-events)
13. [Error Codes](#error-codes)
14. [Configuration](#configuration)

---

## API Overview

`@mcv/people` exposes 8 service singletons, each providing a well-typed async interface for its bounded context. All methods:

- Accept Zod-validated input objects
- Return typed Promise results
- Automatically scope queries to the current `ventureId` (via RLS)
- Publish domain events to the Redpanda event bus on mutation
- Log PII access to the `@mcv/fabric` audit trail
- Throw structured `PeopleError` instances on failure

### Common Patterns

```typescript
// All list methods return PaginatedResult<T>
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  cursor?: string;
}

// All service methods accept an optional context override
interface ServiceOptions {
  tx?: DrizzleTransaction;        // Run within an existing transaction
  skipAudit?: boolean;            // Skip audit logging (system-only)
  skipEvents?: boolean;           // Skip event publishing (migration-only)
}

// Date range filter used across modules
interface DateRange {
  from: Date;
  to: Date;
}
```

### Authentication Context

Every API call operates within an authenticated context provided by `@mcv/identity`:

```typescript
interface PeopleContext {
  userId: string;                 // Authenticated user ID
  ventureId: string;              // Current tenant/venture
  personId: string | null;        // Linked person record (if employee)
  roles: string[];                // RBAC roles: hr_admin, hr_manager, department_manager, employee
  permissions: string[];          // Granular permissions: people:pii:read, people:salary:read, ...
}
```

---

## Directory Service

The `directoryService` manages the core people registry — the golden record for every person in the venture.

### `createPerson(input): Promise<Person>`

Creates a new person record with auto-generated employee number and PII encryption.

**Parameters:**

```typescript
interface CreatePersonInput {
  // Required fields
  firstName: string;                    // min 1, max 100
  lastName: string;                     // min 1, max 100
  email: string;                        // Valid work email, unique per venture
  employmentType: EmploymentType;       // 'full_time' | 'part_time' | 'contractor' | 'intern' | 'advisor'
  title: string;                        // Job title
  hireDate: Date;                       // Employment start date
  country: string;                      // ISO 3166-1 alpha-2

  // Optional fields
  middleName?: string;
  preferredName?: string;
  personalEmail?: string;               // Encrypted PII
  phone?: string;
  personalPhone?: string;               // Encrypted PII
  pronouns?: string;
  dateOfBirth?: Date;                   // Encrypted PII
  nationality?: string;
  ssn?: string;                         // Encrypted PII (AES-256)
  taxId?: string;                       // Encrypted PII
  positionId?: string;
  departmentId?: string;
  teamId?: string;
  managerId?: string;
  startDate?: Date;
  salary?: string;                      // Encrypted PII (decimal string)
  salaryFrequency?: 'annual' | 'monthly' | 'hourly';
  currency?: string;                    // Default: 'USD'
  payGrade?: string;
  workLocation?: 'office' | 'remote' | 'hybrid';
  officeLocation?: string;
  timezone?: string;                    // Default: 'America/New_York'
  stateProvince?: string;
  city?: string;
  address?: Address;                    // Encrypted PII
  jurisdictionCode?: string;            // e.g., 'US-NY', 'CA-ON', 'GB'
  tags?: string[];
  customFields?: Record<string, unknown>;
}
```

**Returns:** `Person` — Full person record with generated `id` and `employeeNumber`.

**Events:** `person.created`

**Errors:**
- `PPL_002` — Email already exists in this venture
- Zod validation errors for invalid input

**Example:**

```typescript
const person = await directoryService.createPerson({
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@venture.mcv.one',
  employmentType: 'full_time',
  title: 'Senior Software Engineer',
  hireDate: new Date('2026-03-01'),
  country: 'US',
  departmentId: 'dept-engineering-uuid',
  managerId: 'person-manager-uuid',
  salary: '165000.00',
  salaryFrequency: 'annual',
  jurisdictionCode: 'US-CA',
});
// → { id: 'uuid-...', employeeNumber: 'EMP-000042', status: 'pending', ... }
```

---

### `updatePerson(personId, input): Promise<Person>`

Updates a person record. Automatically records employment history when key fields change (title, department, manager, salary).

**Parameters:**
- `personId: string` — UUID of the person
- `input: UpdatePersonInput` — Partial of `CreatePersonInput` (all fields optional)

**Returns:** `Person` — Updated person record.

**Events:** `person.updated`, `employment_history.recorded` (if key fields changed)

**Errors:** `PPL_001` — Person not found

---

### `getPerson(personId, options?): Promise<Person>`

Retrieves a person record with optional profile and PII inclusion.

**Parameters:**
- `personId: string` — UUID of the person
- `options.includeProfile?: boolean` — Include extended profile data (default: false)
- `options.includePII?: boolean` — Include decrypted PII fields (requires `people:pii:read` permission)

**Returns:** `Person` (with optional `profile` and decrypted PII fields)

**Events:** `person.pii_accessed` (if PII requested)

**Errors:** `PPL_001`, `PPL_015` (PII decryption failure)

---

### `listPeople(filters?): Promise<PaginatedResult<Person>>`

Lists people with filtering, sorting, and pagination.

**Parameters:**

```typescript
interface PersonSearchFilters {
  status?: PersonStatus | PersonStatus[];
  employmentType?: EmploymentType | EmploymentType[];
  departmentId?: string;
  teamId?: string;
  managerId?: string;
  country?: string;
  jurisdictionCode?: string;
  hiredAfter?: Date;
  hiredBefore?: Date;
  tags?: string[];
  search?: string;                    // Full-text search across name, email, title
  page?: number;                      // Default: 1
  pageSize?: number;                  // Default: 25, max: 100
  sortBy?: 'firstName' | 'lastName' | 'hireDate' | 'title' | 'department';
  sortOrder?: 'asc' | 'desc';
}
```

**Returns:** `PaginatedResult<Person>`

---

### `searchPeople(query, options?): Promise<Person[]>`

Full-text search powered by PostgreSQL GIN indexes.

**Parameters:**
- `query: string` — Search query (searches first name, last name, email, title, preferred name)
- `options.limit?: number` — Max results (default: 25)
- `options.includeInactive?: boolean` — Include inactive/terminated (default: false)

**Returns:** `Person[]` — Ranked by relevance

---

### `deactivatePerson(personId, reason, terminationDate): Promise<Person>`

Deactivates a person (termination, resignation, etc.). Sets status to 'terminated' and schedules PII erasure per retention policy.

**Parameters:**
- `personId: string`
- `reason: string` — Termination reason
- `terminationDate: Date`

**Events:** `person.deactivated`

---

### `bulkImport(input): Promise<BulkImportResult>`

Imports multiple person records from CSV/XLSX. All-or-nothing — either all rows succeed or none are imported.

**Parameters:**

```typescript
interface BulkImportInput {
  format: 'csv' | 'xlsx';
  fileUrl: string;                    // @mcv/fabric storage URL
  mappings?: Record<string, string>;  // Column name → field name overrides
  defaults?: Partial<CreatePersonInput>; // Default values for missing fields
  dryRun?: boolean;                   // Validate only, don't import
}
```

**Returns:**

```typescript
interface BulkImportResult {
  success: boolean;
  totalRows: number;
  importedCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value: unknown;
  }>;
  dryRun: boolean;
}
```

**Events:** `person.bulk_imported`

**Errors:** `PPL_011` — Validation failures

---

### `bulkExport(filters?, format?): Promise<ExportResult>`

Exports person records matching filters. PII fields are included only if the caller has `people:pii:read` permission.

**Parameters:**
- `filters?: PersonSearchFilters`
- `format?: 'csv' | 'xlsx'` — Default: 'csv'

**Returns:**

```typescript
interface ExportResult {
  fileUrl: string;
  format: string;
  totalRecords: number;
  includedPII: boolean;
  generatedAt: Date;
}
```

---

### `updateProfile(personId, input): Promise<PersonProfile>`

Updates extended profile data (bio, social links, education, languages, etc.).

**Parameters:**

```typescript
interface UpdateProfileInput {
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  languages?: Array<{ language: string; proficiency: 'native' | 'fluent' | 'intermediate' | 'basic' }>;
  education?: Array<{ institution: string; degree: string; field: string; startYear: number; endYear?: number }>;
  interests?: string[];
  dietaryRestrictions?: string;
  tshirtSize?: string;
  accessibilityNeeds?: string;
  bankDetails?: BankDetails;         // Encrypted PII
  taxWithholding?: TaxWithholding;   // Encrypted PII
}
```

---

### `addSkill(personId, input): Promise<PersonSkill>`

Adds a skill to a person's profile.

**Parameters:**

```typescript
interface SkillInput {
  skillName: string;
  skillCategory?: 'technical' | 'leadership' | 'domain' | 'language' | 'tool';
  proficiencyLevel?: number;          // 1-5 scale
  certificationName?: string;
  certificationIssuer?: string;
  certificationDate?: Date;
  certificationExpiry?: Date;
  certificationUrl?: string;
}
```

---

### `endorseSkill(skillId, endorserId): Promise<PersonSkill>`

Endorses a person's skill (peer/manager endorsement increases weight in skill matrix).

---

### `getSkillMatrix(departmentId?): Promise<SkillMatrixData>`

Returns a skill matrix showing skill coverage across a department or the entire venture.

**Returns:**

```typescript
interface SkillMatrixData {
  skills: Array<{
    skillName: string;
    category: string;
    peopleCount: number;
    avgProficiency: number;
    endorsedCount: number;
  }>;
  gaps: Array<{
    skillName: string;
    requiredBy: string[];         // Position titles that require this skill
    currentCoverage: number;      // Percentage of positions covered
  }>;
}
```

---

### `uploadDocument(personId, input): Promise<PersonDocument>`

Uploads an encrypted document to a person's record.

---

### `generateDataExport(personId): Promise<DataExportPackage>`

GDPR Data Subject Access Request — generates a complete data export containing all personal data across all submodules.

**Returns:**

```typescript
interface DataExportPackage {
  personId: string;
  generatedAt: Date;
  sections: {
    personalInfo: object;
    profile: object;
    skills: object[];
    documents: object[];
    employmentHistory: object[];
    orgAssignments: object;
    leaveRequests: object[];
    leaveBalances: object[];
    timeEntries: object[];
    timesheets: object[];
    performanceReviews: object[];
    goals: object[];
    feedback: object[];
    learningEnrollments: object[];
    certifications: object[];
  };
  downloadUrl: string;
  expiresAt: Date;                    // Link expires after 24 hours
}
```

---

### `processDeleteRequest(personId, reason): Promise<DeletionResult>`

GDPR Right to Erasure — anonymizes all PII across all submodules.

**Returns:**

```typescript
interface DeletionResult {
  personId: string;
  anonymizedFields: string[];
  affectedModules: string[];
  completedAt: Date;
  retainedUntil: Date;               // Full record deletion date per retention policy
}
```

**Events:** `person.gdpr_deleted`

---

## Org Service

The `orgService` manages organizational structure — departments, teams, positions, and reporting relationships.

### `createDepartment(input): Promise<Department>`

**Parameters:**

```typescript
interface CreateDepartmentInput {
  name: string;
  code: string;                       // "ENG", "MKT", "FIN"
  description?: string;
  type: DepartmentType;               // 'engineering' | 'product' | 'operations' | 'sales' | ...
  parentDepartmentId?: string;        // For nested departments
  headId?: string;                    // Department head (person ID)
  costCenter?: string;
  budgetedHeadcount?: number;
}
```

**Events:** `org.department_created`

---

### `getDepartment(departmentId): Promise<Department>`

Returns department with current headcount (auto-computed).

---

### `listDepartments(options?): Promise<Department[]>`

**Parameters:**
- `options.includeInactive?: boolean`
- `options.parentId?: string` — Filter by parent department

---

### `mergeDepartments(sourceId, targetId, reason): Promise<Department>`

Merges source department into target. Transfers all people, teams, and open requisitions. Creates org change audit record.

**Events:** `org.department_merged`

---

### `createTeam(input): Promise<Team>`

**Parameters:**

```typescript
interface CreateTeamInput {
  name: string;
  code?: string;
  description?: string;
  departmentId: string;
  leadId?: string;
  type?: 'permanent' | 'project' | 'virtual' | 'tiger_team';
  maxMembers?: number;
  tags?: string[];
}
```

---

### `addTeamMember(teamId, personId, role?): Promise<void>`

### `removeTeamMember(teamId, personId): Promise<void>`

### `getTeamMembers(teamId): Promise<Person[]>`

---

### `createPosition(input): Promise<Position>`

**Parameters:**

```typescript
interface CreatePositionInput {
  title: string;
  code?: string;                      // "SWE-III", "PM-II"
  description?: string;
  departmentId?: string;
  level?: number;                     // 1-10 seniority
  band?: string;                      // IC1, IC2, M1, M2, D1, VP, C
  isManagement?: boolean;
  minSalary?: string;
  maxSalary?: string;
  currency?: string;
  requiredSkills?: Array<{ skillName: string; minLevel: number }>;
  requiredCertifications?: string[];
  budgetedHeadcount?: number;
}
```

---

### `setReportingLine(input): Promise<ReportingLine>`

Sets a reporting relationship (solid or dotted line).

**Parameters:**

```typescript
interface ReportingLineInput {
  personId: string;
  managerId: string;
  lineType: 'solid' | 'dotted';
  isPrimary?: boolean;                // Default: true for solid lines
  role?: string;                      // 'functional_manager' | 'project_lead' | 'mentor'
  effectiveFrom: Date;
  effectiveTo?: Date;
}
```

**Errors:** `PPL_003` — Circular reporting line detected

**Events:** `org.reporting_line_changed`

---

### `getDirectReports(managerId): Promise<Person[]>`

Returns all people with a primary (solid) reporting line to this manager.

---

### `getReportingChain(personId): Promise<Person[]>`

Returns the full management chain from person to the top (CEO/founder).

---

### `getOrgChart(options?): Promise<OrgChartNode>`

Returns recursive org chart tree data.

**Parameters:**

```typescript
interface OrgChartOptions {
  rootPersonId?: string;              // Start from specific person (default: company head)
  maxDepth?: number;                  // Limit depth (default: 3, lazy-load beyond)
  includeDottedLines?: boolean;       // Include matrix relationships (default: true)
  departmentId?: string;              // Filter to a specific department
}
```

**Returns:**

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

---

### `createHeadcountPlan(input): Promise<{ plan: HeadcountPlan; lines: HeadcountPlanLine[] }>`

Creates a headcount plan with line items per department/position.

**Parameters:**

```typescript
interface HeadcountPlanInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  lines: Array<{
    departmentId: string;
    positionId?: string;
    action: 'hire' | 'backfill' | 'eliminate' | 'transfer_in' | 'transfer_out';
    quantity: number;
    targetQuarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    justification?: string;
    estimatedSalary?: string;
  }>;
}
```

---

### `getHeadcountSummary(departmentId?): Promise<HeadcountSummary>`

Returns current vs budgeted headcount.

**Returns:**

```typescript
interface HeadcountSummary {
  totalActive: number;
  totalBudgeted: number;
  variance: number;
  byDepartment: Array<{
    departmentId: string;
    departmentName: string;
    active: number;
    budgeted: number;
    openRequisitions: number;
    pendingOffers: number;
  }>;
  byEmploymentType: Record<EmploymentType, number>;
}
```

---

## Hiring Service

The `hiringService` implements a full Applicant Tracking System (ATS).

### `createRequisition(input): Promise<Requisition>`

**Parameters:**

```typescript
interface CreateRequisitionInput {
  title: string;
  positionId?: string;
  departmentId: string;
  hiringManagerId: string;
  recruiterId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  employmentType: EmploymentType;
  numberOfOpenings?: number;          // Default: 1
  description: string;
  requirements?: Array<{ type: 'must_have' | 'nice_to_have'; text: string }>;
  responsibilities?: Array<{ text: string }>;
  salaryRangeMin?: string;
  salaryRangeMax?: string;
  currency?: string;
  location?: string;
  isRemote?: boolean;
  visaSponsorshipAvailable?: boolean;
  pipelineId?: string;               // Custom pipeline (default if not specified)
  targetHireDate?: Date;
  headcountPlanLineId?: string;
}
```

**Events:** `requisition.created`

---

### `submitForApproval(requisitionId): Promise<Requisition>`

Moves requisition from 'draft' to 'pending_approval'. Triggers approval workflow via `@mcv/shared`.

---

### `approveRequisition(requisitionId, notes?): Promise<Requisition>`

Approves requisition (requires hiring manager + finance sign-off). Moves status to 'approved'.

---

### `createJobPosting(input): Promise<JobPosting>`

Creates a public job posting from an approved requisition.

**Parameters:**

```typescript
interface CreateJobPostingInput {
  requisitionId: string;
  title: string;
  slug?: string;                      // Auto-generated if not provided
  description: string;                // Rich markdown
  shortDescription?: string;
  location: string;
  isRemote?: boolean;
  salaryRange?: string;               // "$120k - $160k"
  showSalary?: boolean;               // Default: false
  applicationQuestions?: Array<{
    id: string;
    question: string;
    type: 'text' | 'select' | 'file';
    options?: string[];               // For 'select' type
    required: boolean;
  }>;
  closesAt?: Date;
}
```

---

### `publishJobPosting(postingId): Promise<JobPosting>`

Publishes a posting to the career page. Sets `publishedAt` timestamp.

---

### `getCareerPagePostings(ventureId): Promise<JobPosting[]>`

Returns only published postings with sanitized data for public consumption.

---

### `submitApplication(input): Promise<Application>`

Submits a candidate application. Deduplicates candidates by email.

**Parameters:**

```typescript
interface CreateApplicationInput {
  requisitionId: string;
  jobPostingId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  coverLetter?: string;
  source?: string;                    // 'career_page' | 'linkedin' | 'referral' | 'recruiter' | 'job_board'
  referredBy?: string;                // Person ID of referrer
  responses?: Record<string, unknown>; // Answers to application questions
}
```

**Events:** `application.submitted`

---

### `moveToStage(applicationId, stageId): Promise<Application>`

Advances an application to a pipeline stage. Validates scorecard requirements.

**Errors:** `PPL_009` — Pipeline full / scorecard requirements not met

**Events:** `application.stage_changed`

---

### `rejectApplication(applicationId, reason): Promise<Application>`

**Events:** `application.rejected`

---

### `scheduleInterview(input): Promise<Interview>`

**Parameters:**

```typescript
interface ScheduleInterviewInput {
  applicationId: string;
  interviewType: 'phone_screen' | 'technical' | 'behavioral' | 'culture' | 'panel' | 'case_study' | 'final';
  format: 'in_person' | 'video' | 'phone';
  scheduledAt: Date;
  duration: number;                   // Minutes
  location?: string;
  videoLink?: string;
  interviewerIds: string[];           // Person IDs of interviewers
}
```

**Events:** `interview.scheduled`

---

### `submitScorecard(interviewId, input): Promise<InterviewScorecard>`

**Parameters:**

```typescript
interface ScorecardInput {
  interviewerId: string;
  overallRating: number;              // 1-5
  overallRecommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  criteria?: Array<{ name: string; rating: number; notes?: string }>;
  strengths?: string;
  concerns?: string;
  notes?: string;
}
```

**Events:** `scorecard.submitted`

---

### `createOffer(input): Promise<Offer>`

**Parameters:**

```typescript
interface CreateOfferInput {
  applicationId: string;
  title: string;
  departmentId: string;
  managerId: string;
  employmentType: EmploymentType;
  salary: string;                     // Decimal string
  salaryFrequency: 'annual' | 'monthly' | 'hourly';
  currency?: string;
  signingBonus?: string;
  equityGrant?: { shares: number; vestingSchedule: string; cliffMonths: number };
  benefits?: Record<string, unknown>;
  startDate: Date;
  expiresAt: Date;
}
```

**Events:** `offer.created`

---

### `sendOffer(offerId): Promise<Offer>`

Sends the offer letter to the candidate. Requires prior approval.

**Events:** `offer.sent`

---

### `recordOfferResponse(offerId, response, reason?): Promise<Offer>`

Records candidate's response to the offer.

**Parameters:**
- `response: 'accepted' | 'declined'`
- `reason?: string` — Reason for decline

**Events:** `offer.accepted` or `offer.declined`

---

### `convertToEmployee(offerId): Promise<{ person: Person; onboardingPlan: OnboardingPlan }>`

Atomically converts an accepted offer into a person record and triggers onboarding. See Technical Architecture for transaction details.

**Events:** `candidate.converted_to_employee`

---

### `getHiringAnalytics(requisitionId?): Promise<HiringAnalytics>`

**Returns:**

```typescript
interface HiringAnalytics {
  openRequisitions: number;
  totalApplications: number;
  averageTimeToFill: number;          // Days
  offerAcceptanceRate: number;        // Percentage
  applicationsBySource: Record<string, number>;
  pipelineConversion: Array<{
    stage: string;
    count: number;
    conversionRate: number;
  }>;
}
```

---

## Onboarding Service

The `onboardingService` manages structured onboarding workflows for new hires.

### `createOnboardingPlan(personId, input): Promise<OnboardingPlan>`

Creates an onboarding plan from a checklist template. Auto-selects template by department + employment type if not specified.

**Parameters:**

```typescript
interface CreateOnboardingPlanInput {
  checklistId?: string;               // Auto-select if not provided
  startDate: Date;
  buddyId?: string;
  departmentId?: string;              // For template auto-selection
  employmentType?: EmploymentType;    // For template auto-selection
}
```

**Events:** `onboarding.plan_created`

---

### `getOnboardingPlan(planId): Promise<OnboardingPlanWithTasks>`

Returns plan with all tasks, documents, equipment, access requests, and milestones.

**Returns:**

```typescript
interface OnboardingPlanWithTasks {
  plan: OnboardingPlan;
  tasks: OnboardingTask[];
  documents: OnboardingDocument[];
  equipment: OnboardingEquipment[];
  accessRequests: OnboardingAccessRequest[];
  milestones: OnboardingMilestone[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    progressPercent: number;
  };
}
```

---

### `completeTask(taskId, completedBy, notes?): Promise<OnboardingTask>`

Marks a task as completed. Recalculates plan progress.

**Errors:** `PPL_010` — Dependent task not yet completed

**Events:** `onboarding.task_completed`

---

### `skipTask(taskId, reason): Promise<OnboardingTask>`

Skips a non-required task. Required tasks cannot be skipped.

---

### `blockTask(taskId, reason): Promise<OnboardingTask>`

Marks a task as blocked with a reason.

**Events:** `onboarding.task_blocked`

---

### `reassignTask(taskId, newAssigneeId): Promise<OnboardingTask>`

Reassigns a task to a different person.

---

### `getMyTasks(personId): Promise<OnboardingTask[]>`

Returns all onboarding tasks assigned to a person (across all active plans they're involved in).

---

### `uploadOnboardingDocument(planId, input): Promise<OnboardingDocument>`

### `verifyDocument(documentId, verifierId): Promise<OnboardingDocument>`

### `rejectDocument(documentId, reason): Promise<OnboardingDocument>`

---

### `requestEquipment(planId, input): Promise<OnboardingEquipment>`

**Parameters:**

```typescript
interface EquipmentRequestInput {
  equipmentType: 'laptop' | 'monitor' | 'keyboard' | 'mouse' | 'headset' | 'phone' | 'desk' | 'chair';
  brand?: string;
  model?: string;
  specifications?: Record<string, unknown>;
}
```

---

### `updateEquipmentStatus(equipmentId, status, details?): Promise<OnboardingEquipment>`

Updates equipment provisioning status through the lifecycle: `requested → ordered → shipped → delivered → configured → assigned`.

---

### `requestAccess(planId, input): Promise<OnboardingAccessRequest>`

**Parameters:**

```typescript
interface AccessRequestInput {
  systemName: string;                 // "GitHub", "Slack", "Google Workspace", "AWS", "Jira"
  accessLevel: 'read' | 'write' | 'admin' | 'custom';
  accessDetails?: Record<string, unknown>;
}
```

---

### `provisionAccess(requestId, accountId): Promise<OnboardingAccessRequest>`

### `denyAccess(requestId, reason): Promise<OnboardingAccessRequest>`

---

### `completeMilestone(milestoneId, input): Promise<OnboardingMilestone>`

**Parameters:**

```typescript
interface MilestoneCompletionInput {
  managerFeedback?: string;
  newHireFeedback?: string;
  buddyFeedback?: string;
  overallRating?: number;             // 1-5
  goals?: Array<{ text: string; completed: boolean }>;
}
```

---

### `createChecklist(input): Promise<OnboardingChecklist>`

Creates a reusable onboarding checklist template.

**Parameters:**

```typescript
interface OnboardingChecklistInput {
  name: string;
  description?: string;
  departmentId?: string;              // null = company-wide
  employmentType?: EmploymentType;    // null = all types
  isDefault?: boolean;
  items: Array<{
    title: string;
    description?: string;
    category: 'hr_admin' | 'it_setup' | 'manager_tasks' | 'new_hire_tasks' | 'culture' | 'compliance';
    assigneeType: 'hr' | 'it' | 'manager' | 'buddy' | 'new_hire' | 'custom';
    sortOrder: number;
    dueOffsetDays: number;            // Negative = before start date
    isRequired?: boolean;
    requiresDocument?: boolean;
    documentType?: string;
    dependsOnItemId?: string;
    instructions?: string;
  }>;
}
```

---

### `getOnboardingAnalytics(dateRange?): Promise<OnboardingAnalytics>`

**Returns:**

```typescript
interface OnboardingAnalytics {
  activePlans: number;
  completedPlans: number;
  averageCompletionDays: number;
  taskCompletionRate: number;
  overdueTasks: number;
  byDepartment: Array<{
    departmentName: string;
    activePlans: number;
    avgCompletionDays: number;
  }>;
}
```

---

## Leave Service

The `leaveService` manages multi-jurisdiction leave with policy-driven accruals and approvals.

### `createLeaveRequest(input): Promise<LeaveRequest>`

**Parameters:**

```typescript
interface CreateLeaveRequestInput {
  personId: string;
  leaveType: LeaveType;               // 'vacation' | 'sick' | 'personal' | 'parental' | ...
  startDate: Date;
  endDate: Date;
  startHalf?: 'first_half' | 'second_half';
  endHalf?: 'first_half' | 'second_half';
  reason?: string;
  documentUrl?: string;               // Supporting doc (e.g., doctor's note)
  delegateTo?: string;                // Person ID for work delegation
}
```

**Validation (automatic):**
- Checks available balance ≥ requested days
- Checks no overlap with existing approved leave
- Checks no blackout dates in range
- Checks advance notice requirement
- Checks documentation requirement (e.g., doctor's note for sick > 3 days)

**Events:** `leave.requested`

**Errors:** `PPL_004` (insufficient balance), `PPL_005` (overlap)

---

### `approveLeaveRequest(requestId, notes?): Promise<LeaveRequest>`

Approves a leave request. Moves days from 'pending' to 'used' balance. Creates calendar event.

**Events:** `leave.approved`

---

### `rejectLeaveRequest(requestId, reason): Promise<LeaveRequest>`

Rejects a leave request. Restores 'pending' balance.

**Events:** `leave.rejected`

---

### `cancelLeaveRequest(requestId, reason): Promise<LeaveRequest>`

Cancels a leave request (by the employee). Restores balance.

**Events:** `leave.cancelled`

---

### `getLeaveBalances(personId, year?): Promise<LeaveBalance[]>`

Returns all leave balances for a person for the specified year.

**Returns:**

```typescript
interface LeaveBalance {
  leaveType: LeaveType;
  year: number;
  entitled: number;                   // Total annual entitlement
  carriedOver: number;                // From previous year
  accrued: number;                    // Accrued year-to-date
  adjustment: number;                 // Manual adjustments
  used: number;                       // Days taken
  pending: number;                    // Days awaiting approval
  available: number;                  // = entitled + carriedOver + accrued + adjustment - used - pending
}
```

---

### `adjustBalance(personId, leaveType, adjustment, reason): Promise<LeaveBalance>`

Manual balance adjustment (HR admin only). Creates audit log entry.

---

### `runAccruals(asOfDate?): Promise<AccrualRunResult>`

Processes accruals for all active employees based on policy rules. Typically run by cron.

**Returns:**

```typescript
interface AccrualRunResult {
  processed: number;
  errors: Array<{ personId: string; error: string }>;
  asOfDate: Date;
}
```

---

### `processYearEndCarryOver(year): Promise<CarryOverResult>`

Calculates unused leave, applies carry-over limits, and creates next-year balances.

**Returns:**

```typescript
interface CarryOverResult {
  processed: number;
  totalCarriedOver: number;
  totalForfeited: number;
  details: Array<{
    personId: string;
    leaveType: string;
    unused: number;
    carriedOver: number;
    forfeited: number;
  }>;
}
```

---

### `getTeamLeaveCalendar(managerId, dateRange): Promise<TeamLeaveCalendarData>`

Returns a consolidated leave calendar for all direct reports.

---

### `createLeavePolicy(input): Promise<LeavePolicy>`

Creates a leave policy with per-type rules.

**Parameters:**

```typescript
interface CreateLeavePolicyInput {
  name: string;
  description?: string;
  jurisdictionCode?: string;          // null = global default
  appliesToEmploymentTypes?: EmploymentType[];
  rules: Array<{
    leaveType: LeaveType;
    name: string;
    entitlementType: 'fixed' | 'accrued' | 'unlimited';
    annualEntitlementDays?: number;
    maxBalanceDays?: number;
    accrualFrequency?: 'per_pay_period' | 'monthly' | 'quarterly' | 'annual';
    accrualRate?: number;
    tenureTiers?: Array<{ yearsOfService: number; entitlementDays: number }>;
    requiresDocumentation?: boolean;
    advanceNoticeDays?: number;
    canBeHalfDay?: boolean;
    isPaid?: boolean;
    payPercentage?: number;
  }>;
  carryOverPolicy?: {
    maxCarryOverDays: number;
    useByDate?: string;               // MM-DD format
    forfeitUnused: boolean;
  };
  approvalChain?: Array<{
    level: number;
    type: 'manager' | 'hr';
    condition?: { daysAbove: number };
  }>;
}
```

---

### `getPublicHolidays(jurisdictionCode, year): Promise<PublicHoliday[]>`

### `checkAvailability(personId, startDate, endDate): Promise<AvailabilityCheck>`

Checks if a person can take leave in the given range (balance, blackouts, overlaps).

**Returns:**

```typescript
interface AvailabilityCheck {
  available: boolean;
  totalDays: number;
  balanceRemaining: number;
  conflicts: Array<{
    type: 'insufficient_balance' | 'blackout' | 'overlap' | 'notice_period';
    message: string;
    details: Record<string, unknown>;
  }>;
}
```

---

## Time Service

The `timeService` tracks time entries, timesheets, overtime, and generates payroll feeds.

### `createTimeEntry(input): Promise<TimeEntry>`

**Parameters:**

```typescript
interface CreateTimeEntryInput {
  personId: string;
  date: Date;
  startTime?: Date;                   // Optional — can just log hours
  endTime?: Date;
  breakMinutes?: number;
  hoursWorked: number;                // Required if no startTime/endTime
  entryType?: TimeEntryType;          // Default: 'regular'
  projectId?: string;
  taskId?: string;
  isBillable?: boolean;
  billableRate?: string;
  clientId?: string;
  description?: string;
  tags?: string[];
  externalReference?: string;         // Jira ticket, GitHub issue, etc.
}
```

**Events:** `time.entry_created`

---

### `startTimer(personId, projectId?): Promise<TimeEntry>`

Starts a live timer (clock-in). Creates a time entry with `startTime` set to now and `source = 'timer'`.

**Events:** `time.timer_started`

---

### `stopTimer(entryId): Promise<TimeEntry>`

Stops a live timer (clock-out). Calculates `hoursWorked` from `startTime` to now minus breaks.

**Events:** `time.timer_stopped`

---

### `getTimeEntries(personId, dateRange): Promise<TimeEntry[]>`

Returns time entries for a person within a date range.

---

### `createTimesheet(personId, periodStart, periodEnd): Promise<Timesheet>`

Creates a timesheet for a period. Auto-populates from existing time entries.

---

### `submitTimesheet(timesheetId): Promise<Timesheet>`

Submits a timesheet for manager approval. Validates total hours, overtime calculation, and project allocation.

**Events:** `time.timesheet_submitted`

**Errors:** `PPL_006` — Already submitted

---

### `approveTimesheet(timesheetId, approverId): Promise<Timesheet>`

Approves a timesheet. Locks all associated time entries (`isLocked = true`).

**Events:** `time.timesheet_approved`

**Errors:** `PPL_007` — Approver lacks permission

---

### `rejectTimesheet(timesheetId, approverId, reason): Promise<Timesheet>`

Rejects a timesheet with a reason. Unlocks entries for editing.

**Events:** `time.timesheet_rejected`

---

### `getPendingApprovals(managerId): Promise<Timesheet[]>`

Returns all timesheets pending approval for a manager's direct reports.

---

### `calculateOvertime(personId, periodStart, periodEnd): Promise<OvertimeCalculation>`

Calculates overtime based on jurisdiction-specific rules.

**Returns:**

```typescript
interface OvertimeCalculation {
  personId: string;
  period: { start: Date; end: Date };
  jurisdictionCode: string;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  holidayHours: number;
  totalHours: number;
  rules: {
    dailyThreshold: number;
    weeklyThreshold: number;
    dailyDoubleTime: number | null;
    overtimeMultiplier: number;
    doubleTimeMultiplier: number;
    holidayMultiplier: number;
  };
  breakdown: Array<{
    date: Date;
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
    isHoliday: boolean;
    isWeekend: boolean;
  }>;
}
```

---

### `generatePayrollFeed(options): Promise<PayrollFeed>`

Generates a payroll integration feed from approved timesheets.

**Parameters:**

```typescript
interface PayrollFeedOptions {
  periodStart: Date;
  periodEnd: Date;
  format?: 'csv' | 'json' | 'adp' | 'gusto' | 'paychex';
  departmentIds?: string[];           // Filter by department
  includeLeaveHours?: boolean;        // Include PTO hours (default: true)
}
```

**Returns:**

```typescript
interface PayrollFeed {
  id: string;
  feedNumber: string;                 // "PRF-2026-W06"
  periodStart: Date;
  periodEnd: Date;
  format: string;
  totalEmployees: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalBillableHours: number;
  fileUrl: string;
  status: 'generated' | 'reviewed' | 'sent' | 'confirmed' | 'error';
}
```

**Events:** `time.payroll_feed_generated`

---

### `getUtilizationRate(personId, dateRange): Promise<UtilizationData>`

**Returns:**

```typescript
interface UtilizationData {
  personId: string;
  period: DateRange;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  utilizationRate: number;            // billable / total as percentage
  byProject: Array<{
    projectId: string;
    projectName: string;
    hours: number;
    percentage: number;
  }>;
}
```

---

### `getBillableReport(dateRange, groupBy?): Promise<BillableReport>`

Billable hours report grouped by person, department, or project.

---

## Performance Service

The `performanceService` manages reviews, goals, feedback, 1-on-1s, PIPs, and calibration.

### `createReviewCycle(input): Promise<ReviewCycle>`

**Parameters:**

```typescript
interface CreateReviewCycleInput {
  name: string;                       // "Q1 2026 Performance Review"
  description?: string;
  reviewTypes: ReviewType[];          // ['self', 'manager', 'peer', '360']
  startDate: Date;
  endDate: Date;
  selfReviewDeadline: Date;
  managerReviewDeadline: Date;
  peerReviewDeadline?: Date;
  questions?: Array<{
    text: string;
    type: 'text' | 'rating' | 'select';
    options?: string[];
    required: boolean;
    appliesToTypes: ReviewType[];
  }>;
  participantFilter?: {
    departmentIds?: string[];
    employmentTypes?: EmploymentType[];
    minTenureDays?: number;
  };
}
```

**Events:** `review.cycle_created`

---

### `submitReview(input): Promise<Review>`

**Parameters:**

```typescript
interface SubmitReviewInput {
  reviewCycleId: string;
  revieweeId: string;                 // Person being reviewed
  reviewerId: string;                 // Person writing the review
  reviewType: ReviewType;
  overallRating: number;              // 1-5
  responses: Array<{
    questionId: string;
    rating?: number;
    text?: string;
    selectedOption?: string;
  }>;
  strengths?: string;
  areasForImprovement?: string;
  comments?: string;
}
```

**Events:** `review.submitted`

**Errors:** `PPL_008` — Review cycle closed

---

### `createGoal(input): Promise<Goal>`

**Parameters:**

```typescript
interface CreateGoalInput {
  personId: string;
  title: string;
  description?: string;
  goalType: GoalType;                 // 'okr' | 'kpi' | 'project' | 'development'
  parentGoalId?: string;              // For cascading (company → dept → team → individual)
  dueDate: Date;
  weight?: number;                    // Percentage weight in overall evaluation
  keyResults?: Array<{
    title: string;
    targetValue: number;
    unit: string;                     // "percentage", "count", "revenue"
    startValue?: number;
  }>;
  metrics?: {
    targetValue: number;
    unit: string;
    measurementFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  };
}
```

**Events:** `goal.created`

---

### `updateGoalProgress(goalId, input): Promise<Goal>`

Updates goal progress. Automatically determines status (on_track, at_risk, behind).

**Parameters:**

```typescript
interface GoalProgressInput {
  currentValue?: number;
  status?: GoalStatus;
  notes?: string;
  keyResultUpdates?: Array<{
    keyResultId: string;
    currentValue: number;
    notes?: string;
  }>;
}
```

**Events:** `goal.progress_updated`, `goal.at_risk` (if status changes to at_risk)

---

### `submitFeedback(input): Promise<FeedbackEntry>`

Submits continuous feedback (not tied to a review cycle).

**Parameters:**

```typescript
interface FeedbackInput {
  fromPersonId: string;
  toPersonId: string;
  type: 'recognition' | 'constructive' | 'general';
  isPublic: boolean;                  // Visible to team or private to recipient
  content: string;
  relatedGoalId?: string;
  relatedSkillName?: string;
}
```

**Events:** `feedback.submitted`

---

### `createOneOnOne(input): Promise<OneOnOne>`

**Parameters:**

```typescript
interface OneOnOneInput {
  managerId: string;
  reportId: string;
  scheduledAt: Date;
  duration: number;                   // Minutes
  agendaItems?: Array<{
    text: string;
    addedBy: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  notes?: string;
  actionItems?: Array<{
    text: string;
    assigneeId: string;
    dueDate?: Date;
  }>;
}
```

---

### `createPip(input): Promise<Pip>`

Creates a Performance Improvement Plan.

**Parameters:**

```typescript
interface PipInput {
  personId: string;
  managerId: string;
  hrAdvisorId?: string;
  reason: string;
  startDate: Date;
  endDate: Date;                      // Typically 30, 60, or 90 days
  goals: string[];
  milestones: Array<{
    title: string;
    description: string;
    dueDate: Date;
    successCriteria: string;
  }>;
  supportProvided?: string;
  consequences?: string;
}
```

**Events:** `pip.created`

---

### `get360Feedback(personId, reviewCycleId): Promise<AggregatedFeedback>`

Returns aggregated 360° feedback for a person in a review cycle.

**Returns:**

```typescript
interface AggregatedFeedback {
  personId: string;
  reviewCycleId: string;
  selfReview: Review | null;
  managerReview: Review | null;
  peerReviews: Review[];
  upwardReviews: Review[];
  aggregatedRatings: {
    overall: number;
    byQuestion: Array<{
      questionId: string;
      questionText: string;
      averageRating: number;
      ratingsByType: Record<ReviewType, number>;
    }>;
  };
  themes: {
    strengths: string[];
    improvements: string[];
  };
}
```

---

## Learning Service

The `learningService` provides LMS functionality.

### `createCourse(input): Promise<Course>`

**Parameters:**

```typescript
interface CreateCourseInput {
  title: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  tags?: string[];
  modules: Array<{
    title: string;
    description?: string;
    contentType: 'video' | 'document' | 'quiz' | 'interactive' | 'scorm';
    contentUrl?: string;
    duration?: number;                // Minutes
    sortOrder: number;
    isRequired?: boolean;
  }>;
  prerequisites?: string[];          // Course IDs
  estimatedDuration?: number;        // Total minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  instructor?: string;
}
```

---

### `publishCourse(courseId): Promise<Course>`

Publishes a draft course to the catalog.

---

### `enrollInCourse(input): Promise<CourseEnrollment>`

**Parameters:**

```typescript
interface EnrollmentInput {
  personId: string;
  courseId: string;
  enrolledBy?: string;                // Self or manager
  deadline?: Date;                    // For mandatory training
}
```

**Events:** `enrollment.started`

---

### `recordCompletion(input): Promise<CourseCompletion>`

**Parameters:**

```typescript
interface CompletionInput {
  enrollmentId: string;
  score?: number;                     // Quiz/assessment score (0-100)
  completedModules: string[];
  feedback?: string;
  rating?: number;                    // 1-5 course rating
}
```

**Events:** `enrollment.completed`

---

### `issueCertification(input): Promise<PersonCertification>`

**Parameters:**

```typescript
interface CertificationInput {
  personId: string;
  certificationId: string;
  issuedAt: Date;
  expiresAt?: Date;
  courseCompletionId?: string;
  verificationCode?: string;
}
```

**Events:** `certification.issued`

---

### `getCertifications(personId): Promise<PersonCertification[]>`

Returns all certifications for a person with status (active, expired, revoked).

---

### `createLearningPath(input): Promise<LearningPath>`

**Parameters:**

```typescript
interface CreateLearningPathInput {
  name: string;
  description?: string;
  courses: Array<{
    courseId: string;
    sortOrder: number;
    isRequired: boolean;
  }>;
  targetRole?: string;                // Position title this path prepares for
  estimatedDuration?: number;         // Total hours
}
```

---

### `analyzeSkillGaps(personId): Promise<SkillGapAnalysis>`

**Returns:**

```typescript
interface SkillGapAnalysis {
  personId: string;
  positionId: string;
  positionTitle: string;
  gaps: Array<{
    skillName: string;
    requiredLevel: number;
    currentLevel: number | null;
    gapSeverity: 'critical' | 'moderate' | 'minor';
    recommendedCourses: Array<{
      courseId: string;
      title: string;
      estimatedDuration: number;
    }>;
  }>;
  overallReadiness: number;           // Percentage (0-100)
}
```

---

### `getComplianceStatus(departmentId?): Promise<ComplianceStatus>`

Returns compliance training completion status.

**Returns:**

```typescript
interface ComplianceStatus {
  totalRequired: number;
  completedOnTime: number;
  overdue: number;
  upcoming: number;
  byRequirement: Array<{
    requirementId: string;
    name: string;
    deadline: Date;
    completionRate: number;
    overduePersons: Array<{ personId: string; personName: string }>;
  }>;
}
```

---

## Shared Types

### Core Enums

```typescript
type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'intern' | 'advisor';

type PersonStatus = 'active' | 'inactive' | 'on_leave' | 'terminated' | 'pending';

type DepartmentType = 'engineering' | 'product' | 'operations' | 'sales' |
  'marketing' | 'finance' | 'hr' | 'legal' | 'support';

type LeaveType = 'vacation' | 'sick' | 'personal' | 'parental_maternity' |
  'parental_paternity' | 'bereavement' | 'sabbatical' | 'jury_duty' |
  'military' | 'unpaid' | 'other';

type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'taken';

type TimeEntryType = 'regular' | 'overtime' | 'holiday' | 'on_call' | 'travel';

type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'processed';

type RequisitionStatus = 'draft' | 'pending_approval' | 'approved' | 'open' |
  'on_hold' | 'filled' | 'cancelled';

type ApplicationStatus = 'applied' | 'screening' | 'phone_screen' |
  'interviewing' | 'offer' | 'hired' | 'rejected' | 'withdrawn';

type OfferStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' |
  'accepted' | 'declined' | 'expired' | 'rescinded';

type OnboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';

type OnboardingPlanStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';

type ReviewType = 'self' | 'manager' | 'peer' | 'upward' | '360';

type GoalStatus = 'not_started' | 'on_track' | 'at_risk' | 'behind' |
  'completed' | 'cancelled';

type GoalType = 'okr' | 'kpi' | 'project' | 'development';

type CourseStatus = 'draft' | 'published' | 'archived';

type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'dropped' | 'expired';

type CertificationStatus = 'active' | 'expired' | 'revoked' | 'suspended';
```

### Common Interfaces

```typescript
interface Address {
  line1: string;
  line2?: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  country: string;
}

interface BankDetails {
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  accountType?: 'checking' | 'savings';
}

interface TaxWithholding {
  filingStatus: string;
  allowances: number;
  additionalWithholding?: number;
  taxFormType: string;               // 'W-4' | 'TD1' | etc.
  lastUpdated: Date;
}
```

---

## Zod Schemas

All input types are validated using Zod schemas. These are exported for use in API routes and form validation:

```typescript
import {
  createPersonSchema,
  updatePersonSchema,
  personSearchFiltersSchema,
  createLeaveRequestSchema,
  createTimeEntrySchema,
  submitTimesheetSchema,
  createRequisitionSchema,
  createJobPostingSchema,
  submitApplicationSchema,
  scheduleInterviewSchema,
  scorecardInputSchema,
  createOfferSchema,
  createOnboardingPlanSchema,
  onboardingChecklistSchema,
  createReviewCycleSchema,
  submitReviewSchema,
  createGoalSchema,
  feedbackInputSchema,
  createCourseSchema,
  enrollmentInputSchema,
  certificationInputSchema,
  createDepartmentSchema,
  createTeamSchema,
  createPositionSchema,
  reportingLineSchema,
  headcountPlanSchema,
  createLeavePolicySchema,
  payrollFeedOptionsSchema,
} from '@mcv/people';
```

### Example Schema

```typescript
export const createPersonSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  employmentType: z.enum(['full_time', 'part_time', 'contractor', 'intern', 'advisor']),
  title: z.string().min(1).max(200),
  hireDate: z.date(),
  country: z.string().length(2),       // ISO 3166-1 alpha-2
  middleName: z.string().max(100).optional(),
  preferredName: z.string().max(100).optional(),
  personalEmail: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  departmentId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  salary: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  salaryFrequency: z.enum(['annual', 'monthly', 'hourly']).optional(),
  currency: z.string().length(3).default('USD'),
  jurisdictionCode: z.string().max(10).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
});
```

---

## Domain Events

### Event Envelope

```typescript
interface PeopleEvent<T = unknown> {
  eventId: string;
  eventType: string;
  version: number;
  timestamp: string;                  // ISO 8601
  ventureId: string;
  actorId: string;
  correlationId: string;
  payload: T;
  metadata: {
    source: 'people';
    module: string;
  };
}
```

### Complete Event Catalog

| Event Type | Module | Trigger | Payload Key Fields |
|---|---|---|---|
| `person.created` | directory | `createPerson`, `convertToEmployee` | `personId`, `employmentType`, `departmentId` |
| `person.updated` | directory | `updatePerson` | `personId`, `changedFields[]` |
| `person.deactivated` | directory | `deactivatePerson` | `personId`, `reason`, `terminationDate` |
| `person.pii_accessed` | directory | `getPerson` (with PII) | `personId`, `fields[]`, `accessorId` |
| `person.gdpr_deleted` | directory | `processDeleteRequest` | `personId`, `anonymizedFields[]` |
| `person.bulk_imported` | directory | `bulkImport` | `count`, `ventureId` |
| `skill.added` | directory | `addSkill` | `personId`, `skillName` |
| `skill.endorsed` | directory | `endorseSkill` | `skillId`, `endorserId` |
| `document.uploaded` | directory | `uploadDocument` | `personId`, `documentType` |
| `document.verified` | directory | `verifyDocument` | `documentId`, `verifierId` |
| `org.department_created` | org | `createDepartment` | `departmentId`, `name`, `parentId` |
| `org.department_merged` | org | `mergeDepartments` | `sourceId`, `targetId` |
| `org.team_created` | org | `createTeam` | `teamId`, `departmentId` |
| `org.team_member_added` | org | `addTeamMember` | `teamId`, `personId` |
| `org.team_member_removed` | org | `removeTeamMember` | `teamId`, `personId` |
| `org.reporting_line_changed` | org | `setReportingLine` | `personId`, `managerId`, `lineType` |
| `org.headcount_plan_approved` | org | `approveHeadcountPlan` | `planId` |
| `requisition.created` | hiring | `createRequisition` | `requisitionId`, `title` |
| `requisition.approved` | hiring | `approveRequisition` | `requisitionId` |
| `requisition.filled` | hiring | `convertToEmployee` | `requisitionId` |
| `posting.published` | hiring | `publishJobPosting` | `postingId`, `requisitionId` |
| `posting.closed` | hiring | `closeJobPosting` | `postingId` |
| `application.submitted` | hiring | `submitApplication` | `applicationId`, `candidateId`, `requisitionId` |
| `application.stage_changed` | hiring | `moveToStage` | `applicationId`, `fromStage`, `toStage` |
| `application.rejected` | hiring | `rejectApplication` | `applicationId`, `reason` |
| `interview.scheduled` | hiring | `scheduleInterview` | `interviewId`, `applicationId`, `scheduledAt` |
| `interview.completed` | hiring | When all scorecards submitted | `interviewId` |
| `interview.cancelled` | hiring | `cancelInterview` | `interviewId`, `reason` |
| `scorecard.submitted` | hiring | `submitScorecard` | `interviewId`, `interviewerId`, `recommendation` |
| `offer.created` | hiring | `createOffer` | `offerId`, `applicationId` |
| `offer.sent` | hiring | `sendOffer` | `offerId` |
| `offer.accepted` | hiring | `recordOfferResponse` | `offerId`, `candidateId` |
| `offer.declined` | hiring | `recordOfferResponse` | `offerId`, `reason` |
| `candidate.converted_to_employee` | hiring | `convertToEmployee` | `personId`, `offerId`, `onboardingPlanId` |
| `onboarding.plan_created` | onboarding | `createOnboardingPlan` | `planId`, `personId` |
| `onboarding.task_completed` | onboarding | `completeTask` | `taskId`, `planId` |
| `onboarding.task_overdue` | onboarding | Cron check | `taskId`, `assigneeId`, `dueDate` |
| `onboarding.task_blocked` | onboarding | `blockTask` | `taskId`, `reason` |
| `onboarding.plan_completed` | onboarding | All required tasks done | `planId`, `personId`, `completionDays` |
| `onboarding.document_uploaded` | onboarding | `uploadOnboardingDocument` | `documentId`, `planId` |
| `onboarding.equipment_delivered` | onboarding | `updateEquipmentStatus` | `equipmentId` |
| `onboarding.access_provisioned` | onboarding | `provisionAccess` | `requestId`, `systemName` |
| `onboarding.milestone_due` | onboarding | Cron (3 days before) | `milestoneId`, `dayTarget` |
| `onboarding.milestone_completed` | onboarding | `completeMilestone` | `milestoneId`, `rating` |
| `leave.requested` | leave | `createLeaveRequest` | `requestId`, `personId`, `leaveType`, `days` |
| `leave.approved` | leave | `approveLeaveRequest` | `requestId`, `approverId` |
| `leave.rejected` | leave | `rejectLeaveRequest` | `requestId`, `reason` |
| `leave.cancelled` | leave | `cancelLeaveRequest` | `requestId` |
| `leave.balance_updated` | leave | Accrual, approval, carry-over | `personId`, `leaveType`, `newBalance` |
| `leave.accrual_processed` | leave | `runAccruals` | `processed`, `errors` |
| `leave.carry_over_processed` | leave | `processYearEndCarryOver` | `year`, `totalForfeited` |
| `time.entry_created` | time | `createTimeEntry` | `entryId`, `personId`, `hours` |
| `time.timer_started` | time | `startTimer` | `entryId`, `personId` |
| `time.timer_stopped` | time | `stopTimer` | `entryId`, `hours` |
| `time.timesheet_submitted` | time | `submitTimesheet` | `timesheetId`, `personId`, `totalHours` |
| `time.timesheet_approved` | time | `approveTimesheet` | `timesheetId`, `approverId` |
| `time.timesheet_rejected` | time | `rejectTimesheet` | `timesheetId`, `reason` |
| `time.payroll_feed_generated` | time | `generatePayrollFeed` | `feedId`, `totalEmployees` |
| `time.payroll_feed_confirmed` | time | `confirmPayrollFeed` | `feedId` |
| `review.cycle_created` | performance | `createReviewCycle` | `cycleId`, `reviewTypes` |
| `review.cycle_launched` | performance | Cycle start date reached | `cycleId` |
| `review.submitted` | performance | `submitReview` | `reviewId`, `reviewType`, `rating` |
| `review.calibrated` | performance | Calibration session complete | `cycleId` |
| `goal.created` | performance | `createGoal` | `goalId`, `personId`, `goalType` |
| `goal.progress_updated` | performance | `updateGoalProgress` | `goalId`, `status` |
| `goal.at_risk` | performance | Status → at_risk | `goalId`, `personId` |
| `goal.completed` | performance | Status → completed | `goalId` |
| `feedback.submitted` | performance | `submitFeedback` | `feedbackId`, `toPersonId`, `type` |
| `pip.created` | performance | `createPip` | `pipId`, `personId` |
| `pip.milestone_checked` | performance | PIP check-in | `pipId`, `milestoneId` |
| `pip.resolved` | performance | PIP completed | `pipId`, `outcome` |
| `course.published` | learning | `publishCourse` | `courseId`, `title` |
| `enrollment.started` | learning | `enrollInCourse` | `enrollmentId`, `personId`, `courseId` |
| `enrollment.completed` | learning | `recordCompletion` | `enrollmentId`, `score` |
| `certification.issued` | learning | `issueCertification` | `certificationId`, `personId` |
| `certification.expired` | learning | Cron check | `certificationId`, `personId` |
| `compliance.assigned` | learning | Mandatory training assigned | `requirementId`, `personId` |
| `compliance.overdue` | learning | Deadline passed | `requirementId`, `personId` |

---

## Error Codes

| Code | Name | HTTP | Description |
|---|---|---|---|
| `PPL_001` | `PERSON_NOT_FOUND` | 404 | Person record does not exist |
| `PPL_002` | `DUPLICATE_EMAIL` | 409 | Email already registered in this venture |
| `PPL_003` | `INVALID_REPORTING_LINE` | 400 | Circular reporting line detected |
| `PPL_004` | `LEAVE_INSUFFICIENT_BALANCE` | 400 | Not enough leave balance for requested days |
| `PPL_005` | `LEAVE_OVERLAP` | 409 | Leave request overlaps existing approved leave |
| `PPL_006` | `TIMESHEET_ALREADY_SUBMITTED` | 409 | Cannot edit a submitted timesheet |
| `PPL_007` | `TIMESHEET_APPROVAL_DENIED` | 403 | Approver lacks permission for this timesheet |
| `PPL_008` | `REVIEW_CYCLE_CLOSED` | 400 | Cannot submit review for a closed cycle |
| `PPL_009` | `HIRING_PIPELINE_FULL` | 400 | Requisition candidate limit reached or scorecard requirements not met |
| `PPL_010` | `ONBOARDING_TASK_DEPENDENCY` | 400 | Dependent task not yet completed |
| `PPL_011` | `IMPORT_VALIDATION_FAILED` | 422 | Bulk import has validation errors |
| `PPL_012` | `PAYROLL_FEED_LOCKED` | 409 | Payroll feed already confirmed, cannot modify |
| `PPL_013` | `ORG_DEPTH_EXCEEDED` | 400 | Org hierarchy exceeds maximum allowed depth |
| `PPL_014` | `CERTIFICATION_EXPIRED` | 400 | Required certification has expired |
| `PPL_015` | `PII_DECRYPTION_FAILED` | 500 | Cannot decrypt PII field — check encryption key |

### Error Response Format

```typescript
{
  "error": {
    "code": "PPL_004",
    "name": "LEAVE_INSUFFICIENT_BALANCE",
    "message": "Insufficient leave balance. Requested 5 days but only 2 days available.",
    "httpStatus": 400,
    "details": {
      "requested": 5,
      "available": 2,
      "leaveType": "vacation",
      "personId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

---

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|---|---|---|---|
| `PEOPLE_DB_SCHEMA` | Database schema name | `people` | No |
| `PEOPLE_MAX_IMPORT_ROWS` | Max rows per bulk import | `5000` | No |
| `PEOPLE_LEAVE_ACCRUAL_CRON` | Leave accrual cron schedule | `0 1 * * *` | No |
| `PEOPLE_TIMESHEET_REMINDER_CRON` | Timesheet reminder cron | `0 9 * * 5` | No |
| `PEOPLE_PAYROLL_FEED_FORMAT` | Default payroll export format | `csv` | No |
| `PEOPLE_REVIEW_CYCLE_REMINDER_DAYS` | Days before deadline to remind | `7` | No |
| `PEOPLE_PII_ENCRYPTION_KEY` | AES-256 key for PII encryption | — | **Yes** |
| `PEOPLE_SESSION_TIMEOUT_MINUTES` | Timeout for sensitive operations | `30` | No |

### Feature Flags

| Flag | Default | Description |
|---|---|---|
| `people.hiring.career_page` | `true` | Enable public career page API |
| `people.hiring.ai_screening` | `false` | AI-powered resume screening |
| `people.learning.scorm` | `true` | SCORM content support |
| `people.performance.calibration` | `true` | Calibration session features |
| `people.time.live_timer` | `true` | Real-time clock-in/out |
| `people.leave.unlimited_pto` | `false` | Unlimited PTO policy type |
| `people.directory.ai_search` | `false` | AI semantic search |

---

*@mcv/people — People & HR Management Domain*