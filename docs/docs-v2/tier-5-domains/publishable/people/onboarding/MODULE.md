# @mcv/people/onboarding

> **Employee Onboarding & Offboarding** — Configurable multi-step onboarding workflows, pre-boarding automation, task management, document collection, IT provisioning, training integration, buddy/mentor assignment, progress tracking, templates, offboarding, and analytics for the MCV.ONE platform.

**Module ID:** `@mcv/people/onboarding`
**Tier:** 5 (Domain)
**Parent:** `@mcv/people`
**Status:** Stable
**Since:** 0.14.0
**Maintainer:** MCV Platform Team

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

Every new hire's first weeks determine whether they become a productive, engaged team member or a flight risk. `@mcv/people/onboarding` provides a structured, automated, and fully configurable onboarding (and offboarding) system that ensures no task falls through the cracks—from the moment an offer is accepted to the final exit interview.

### Problems Solved

1. **Inconsistent Onboarding Experience** — Without a structured system, onboarding quality varies wildly between departments, managers, and ventures. Some new hires get a polished first week; others are left to figure things out alone. This module enforces consistent, repeatable workflows while allowing per-role and per-venture customization.

2. **Manual Task Coordination** — Onboarding involves HR, IT, the hiring manager, facilities, finance, and the new hire themselves. Coordinating across all these stakeholders via email and spreadsheets leads to dropped tasks, delayed access, and frustrated employees. Automated task assignment, reminders, and escalation solve this.

3. **Pre-boarding Gap** — The period between offer acceptance and Day 1 is often wasted. New hires arrive without completed paperwork, equipment isn't ready, and accounts haven't been provisioned. Pre-boarding automation ensures everything is ready before the new hire walks in.

4. **Compliance Risk** — Tax forms (W-4, I-9), policy acknowledgments, background check verifications, and training requirements have legal deadlines. Missing any of these creates regulatory exposure. Document collection with deadline tracking and e-signature integration closes this gap.

5. **IT Provisioning Delays** — New hires sitting idle because their laptop isn't configured, email isn't set up, or software licenses haven't been allocated is a common and expensive problem. Event-driven provisioning triggers ensure IT gets actionable requests with lead time.

6. **No Visibility into Progress** — Managers and HR lack real-time visibility into where each new hire stands in their onboarding journey. Dashboard views with completion percentages, overdue task alerts, and bottleneck identification provide this transparency.

7. **Offboarding Neglect** — Departing employees often retain system access, keep company equipment, or leave without transferring critical knowledge. Structured offboarding workflows with access revocation, equipment return tracking, and knowledge transfer checklists prevent security gaps and knowledge loss.

8. **Multi-Venture Complexity** — In the MCV.ONE multi-tenant architecture, each venture may have different onboarding requirements, compliance obligations, and cultural practices. Venture-scoped templates with inheritance from organization-level defaults handle this complexity.

### Design Philosophy

- **Checklist-Driven** — Every onboarding flow is a structured checklist. Checklists are proven to reduce errors in complex multi-step processes (from aviation to surgery). Each task has a clear owner, due date, and completion criteria.

- **Event-Sourced Provisioning** — IT provisioning requests are published as events via Redpanda, enabling downstream systems (identity providers, MDM, license managers) to react asynchronously without tight coupling.

- **Template Inheritance** — Templates follow a hierarchy: organization → venture → department → role. Lower levels inherit from higher levels and can override or extend. This provides consistency with flexibility.

- **Progressive Disclosure** — New hires see only what's relevant to them right now. The system reveals tasks progressively based on timeline, dependencies, and completion of prior steps.

- **Measurement-First** — Every aspect of onboarding is measured: time-to-completion per task, overall onboarding duration, satisfaction scores, and time-to-productivity metrics. You can't improve what you don't measure.

---

## Exports

### Services

| Export | Type | Description |
|--------|------|-------------|
| `OnboardingService` | Service | Primary service for managing onboarding workflows, tasks, and lifecycle |
| `PreboardingService` | Service | Manages pre-boarding packages, welcome communications, and pre-Day-1 tasks |
| `ProvisioningService` | Service | Handles IT provisioning requests, equipment assignment, and access management |
| `OffboardingService` | Service | Manages exit workflows, access revocation, and knowledge transfer |
| `OnboardingTemplateService` | Service | CRUD and inheritance logic for onboarding/offboarding templates |
| `OnboardingAnalyticsService` | Service | Metrics, reporting, and analytics for onboarding effectiveness |
| `BuddyAssignmentService` | Service | Buddy/mentor matching, assignment, and relationship management |
| `DocumentCollectionService` | Service | Document requests, upload handling, e-signature orchestration |

### Router

| Export | Type | Description |
|--------|------|-------------|
| `onboardingRouter` | tRPC Router | All onboarding-related API endpoints |

### Schemas

| Export | Type | Description |
|--------|------|-------------|
| `onboardingWorkflows` | Drizzle Table | Workflow definitions and instances |
| `onboardingTasks` | Drizzle Table | Task definitions within workflows |
| `onboardingTaskAssignments` | Drizzle Table | Task assignments to specific people |
| `preboardingPackages` | Drizzle Table | Pre-boarding configuration and tracking |
| `documentRequests` | Drizzle Table | Document collection requests and status |
| `provisioningRequests` | Drizzle Table | IT provisioning requests and fulfillment |
| `buddyAssignments` | Drizzle Table | Buddy/mentor pairings |
| `onboardingTemplates` | Drizzle Table | Reusable onboarding templates |
| `offboardingWorkflows` | Drizzle Table | Offboarding workflow instances |
| `onboardingProgress` | Drizzle Table | Progress tracking and completion snapshots |

### Types

| Export | Type | Description |
|--------|------|-------------|
| `OnboardingWorkflow` | Interface | Complete workflow representation |
| `OnboardingTask` | Interface | Individual task within a workflow |
| `OnboardingTaskAssignment` | Interface | Assignment of a task to a person |
| `PreboardingPackage` | Interface | Pre-boarding package configuration |
| `DocumentRequest` | Interface | Document collection request |
| `ProvisioningRequest` | Interface | IT provisioning request |
| `BuddyAssignment` | Interface | Buddy/mentor assignment |
| `OnboardingTemplate` | Interface | Reusable template definition |
| `OffboardingWorkflow` | Interface | Offboarding workflow representation |
| `OnboardingProgress` | Interface | Progress snapshot |
| `WorkflowStatus` | Enum | Workflow lifecycle states |
| `TaskStatus` | Enum | Task completion states |
| `TaskCategory` | Enum | Task categorization |
| `ProvisioningStatus` | Enum | Provisioning request states |
| `DocumentRequestStatus` | Enum | Document request states |
| `OffboardingStatus` | Enum | Offboarding workflow states |

### Events

| Export | Type | Description |
|--------|------|-------------|
| `OnboardingStartedEvent` | Event | Emitted when an onboarding workflow is initiated |
| `OnboardingCompletedEvent` | Event | Emitted when all onboarding tasks are complete |
| `TaskAssignedEvent` | Event | Emitted when a task is assigned to someone |
| `TaskCompletedEvent` | Event | Emitted when a task is marked complete |
| `TaskOverdueEvent` | Event | Emitted when a task passes its due date |
| `ProvisioningRequestedEvent` | Event | Emitted to trigger IT provisioning (via Redpanda) |
| `ProvisioningCompletedEvent` | Event | Emitted when provisioning is fulfilled |
| `DocumentSubmittedEvent` | Event | Emitted when a document is uploaded or signed |
| `OffboardingStartedEvent` | Event | Emitted when an offboarding workflow begins |
| `OffboardingCompletedEvent` | Event | Emitted when offboarding is finalized |
| `AccessRevokedEvent` | Event | Emitted when system access is revoked during offboarding |
| `BuddyAssignedEvent` | Event | Emitted when a buddy/mentor is paired |

### Hooks (React)

| Export | Type | Description |
|--------|------|-------------|
| `useOnboardingWorkflow` | Hook | Fetch and manage a specific onboarding workflow |
| `useOnboardingTasks` | Hook | List and manage tasks for a workflow |
| `useMyOnboardingTasks` | Hook | Current user's assigned onboarding tasks |
| `useOnboardingProgress` | Hook | Progress tracking for a workflow |
| `useOnboardingTemplates` | Hook | List and manage templates |
| `useOnboardingAnalytics` | Hook | Analytics data and metrics |
| `usePreboardingPackage` | Hook | Pre-boarding package management |
| `useBuddyAssignment` | Hook | Buddy/mentor assignment management |
| `useOffboardingWorkflow` | Hook | Offboarding workflow management |
| `useProvisioningRequests` | Hook | IT provisioning request tracking |

---

## Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Layer                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  New Hire    │  │   Manager    │  │   HR / Admin Dashboard  │ │
│  │  Portal      │  │   Dashboard  │  │                         │ │
│  └──────┬──────┘  └──────┬───────┘  └────────────┬────────────┘ │
│         │                │                        │               │
│         └────────────────┼────────────────────────┘               │
│                          │                                        │
│                    React Hooks                                    │
└──────────────────────────┼────────────────────────────────────────┘
                           │ tRPC
┌──────────────────────────┼────────────────────────────────────────┐
│                    API Layer                                      │
│              ┌───────────┴───────────┐                            │
│              │   onboardingRouter    │                            │
│              └───────────┬───────────┘                            │
│                          │                                        │
│    ┌─────────────────────┼─────────────────────────┐              │
│    │                     │                         │              │
│  ┌─┴──────────────┐  ┌──┴───────────────┐  ┌─────┴───────────┐  │
│  │ Onboarding     │  │  Preboarding     │  │  Offboarding    │  │
│  │ Service        │  │  Service         │  │  Service        │  │
│  └─┬──────────────┘  └──┬───────────────┘  └─────┬───────────┘  │
│    │                     │                         │              │
│  ┌─┴──────────────┐  ┌──┴───────────────┐  ┌─────┴───────────┐  │
│  │ Template       │  │  Document        │  │  Buddy          │  │
│  │ Service        │  │  Collection Svc  │  │  Assignment Svc │  │
│  └────────────────┘  └──────────────────┘  └─────────────────┘  │
│                                                                   │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ Provisioning   │  │  Analytics       │  │  Notification   │  │
│  │ Service        │  │  Service         │  │  Integration    │  │
│  └───────┬────────┘  └──────────────────┘  └─────────────────┘  │
│          │                                                        │
└──────────┼────────────────────────────────────────────────────────┘
           │ Events
┌──────────┼────────────────────────────────────────────────────────┐
│    ┌─────┴──────┐                                                 │
│    │  Redpanda  │  Event Bus                                      │
│    │  (Kafka)   │                                                 │
│    └─────┬──────┘                                                 │
│          │                                                        │
│    ┌─────┼──────────────────────────────┐                         │
│    │     │     │        │       │       │                         │
│  ┌─┴──┐ ┌┴──┐ ┌┴────┐ ┌┴────┐ ┌┴────┐ ┌┴─────┐                 │
│  │IDM │ │MDM│ │Email│ │HRIS │ │LMS  │ │Asset │                  │
│  │    │ │   │ │     │ │     │ │     │ │Mgmt  │                   │
│  └────┘ └───┘ └─────┘ └─────┘ └─────┘ └──────┘                  │
│  Identity Device  Comms   HR    Learning  Equipment              │
│  Provider Mgmt          System  Mgmt Sys  Tracking               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     Data Layer                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Supabase PostgreSQL                          │    │
│  │                                                           │    │
│  │  onboarding_workflows    │  onboarding_tasks              │    │
│  │  onboarding_task_assignments │ preboarding_packages       │    │
│  │  document_requests       │  provisioning_requests         │    │
│  │  buddy_assignments       │  onboarding_templates          │    │
│  │  offboarding_workflows   │  onboarding_progress           │    │
│  │                                                           │    │
│  │  Row-Level Security (RLS) — Multi-tenant isolation        │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Workflow Lifecycle

```
    Offer Accepted
         │
         ▼
  ┌──────────────┐
  │  PRE-BOARDING │ ◄── Welcome email, document collection,
  │   (Remote)    │     equipment requests, account provisioning
  └──────┬───────┘
         │ Day 1
         ▼
  ┌──────────────┐
  │   DAY ONE    │ ◄── Orientation, workspace setup, introductions,
  │              │     buddy meeting, initial training
  └──────┬───────┘
         │ Week 1
         ▼
  ┌──────────────┐
  │  FIRST WEEK  │ ◄── Team introductions, tool training,
  │              │     role-specific onboarding, 1:1 with manager
  └──────┬───────┘
         │ Month 1
         ▼
  ┌──────────────┐
  │ FIRST MONTH  │ ◄── Deep-dive training, first project,
  │              │     compliance courses, 30-day check-in
  └──────┬───────┘
         │ Month 2-3
         ▼
  ┌──────────────┐
  │  RAMP-UP     │ ◄── Increasing responsibility, 60-day review,
  │              │     90-day evaluation, goal setting
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  COMPLETED   │ ◄── Onboarding survey, metrics captured,
  │              │     transition to regular performance cycle
  └──────────────┘
```

### Template Inheritance

```
  ┌─────────────────────────┐
  │  Organization Template  │ ◄── Base policies, compliance, culture
  │  (mcv.one defaults)     │
  └──────────┬──────────────┘
             │ inherits
  ┌──────────┴──────────────┐
  │   Venture Template      │ ◄── Venture-specific tools, processes,
  │   (e.g., Acme Corp)     │     branding, local compliance
  └──────────┬──────────────┘
             │ inherits
  ┌──────────┴──────────────┐
  │  Department Template    │ ◄── Department tools, team norms,
  │  (e.g., Engineering)    │     specific access requirements
  └──────────┬──────────────┘
             │ inherits
  ┌──────────┴──────────────┐
  │    Role Template        │ ◄── Role-specific training, tools,
  │  (e.g., Sr. Engineer)   │     certification requirements
  └─────────────────────────┘
```

### Task Assignment Flow

```
  Template instantiated for new hire
         │
         ▼
  ┌──────────────────┐
  │  Task Resolution │ ◄── Resolve assignee placeholders:
  │                  │     {hiring_manager}, {it_team}, {hr_rep},
  │                  │     {new_hire}, {buddy}
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  Due Date Calc   │ ◄── Relative dates resolved:
  │                  │     "Day -5", "Day 1", "Day 7", "Day 30"
  │                  │     based on start_date
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  Assignment      │ ◄── Tasks created and assigned,
  │  Creation        │     notifications sent,
  │                  │     dependencies tracked
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  Monitoring      │ ◄── Due date tracking, overdue alerts,
  │  & Escalation    │     escalation to manager/HR,
  │                  │     completion tracking
  └──────────────────┘
```

### Event-Driven Provisioning

```
  Onboarding workflow created
         │
         ▼
  ┌──────────────────────────┐
  │  ProvisioningService     │
  │  resolves requirements   │
  │  from role template      │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │  Redpanda Topic:         │
  │  onboarding.provisioning │
  │  .requested              │
  └──────────┬───────────────┘
             │
     ┌───────┼───────────┬──────────────┐
     │       │           │              │
     ▼       ▼           ▼              ▼
  ┌──────┐ ┌──────┐ ┌────────┐ ┌────────────┐
  │Google│ │Slack │ │GitHub  │ │Equipment   │
  │Wksp  │ │Acct  │ │Access  │ │Order       │
  │Setup │ │Setup │ │Grant   │ │(MDM)       │
  └──┬───┘ └──┬───┘ └───┬────┘ └─────┬──────┘
     │        │         │             │
     └────────┼─────────┼─────────────┘
              │         │
              ▼         ▼
  ┌──────────────────────────┐
  │  Redpanda Topic:         │
  │  onboarding.provisioning │
  │  .completed              │
  └──────────────────────────┘
              │
              ▼
  ┌──────────────────────────┐
  │  ProvisioningService     │
  │  updates task status     │
  │  & notifies stakeholders │
  └──────────────────────────┘
```

---

## Core Interfaces

### Enums

```typescript
/**
 * Lifecycle states for an onboarding workflow.
 */
export enum WorkflowStatus {
  /** Workflow created but pre-boarding hasn't started */
  DRAFT = 'draft',
  /** Pre-boarding phase — before Day 1 */
  PRE_BOARDING = 'pre_boarding',
  /** Active onboarding — Day 1 and beyond */
  ACTIVE = 'active',
  /** All tasks completed, pending final review */
  PENDING_COMPLETION = 'pending_completion',
  /** Onboarding fully completed */
  COMPLETED = 'completed',
  /** Onboarding cancelled (e.g., offer rescinded) */
  CANCELLED = 'cancelled',
  /** Onboarding paused (e.g., deferred start date) */
  PAUSED = 'paused',
}

/**
 * States for individual onboarding tasks.
 */
export enum TaskStatus {
  /** Task not yet available (blocked by dependency) */
  BLOCKED = 'blocked',
  /** Task available but not started */
  PENDING = 'pending',
  /** Task currently in progress */
  IN_PROGRESS = 'in_progress',
  /** Task completed and awaiting verification */
  AWAITING_VERIFICATION = 'awaiting_verification',
  /** Task completed */
  COMPLETED = 'completed',
  /** Task skipped (not applicable) */
  SKIPPED = 'skipped',
  /** Task is overdue */
  OVERDUE = 'overdue',
  /** Task was cancelled */
  CANCELLED = 'cancelled',
}

/**
 * Categories for onboarding tasks.
 */
export enum TaskCategory {
  /** Administrative tasks (paperwork, forms) */
  ADMINISTRATIVE = 'administrative',
  /** IT and system access tasks */
  IT_PROVISIONING = 'it_provisioning',
  /** Training and learning tasks */
  TRAINING = 'training',
  /** Social and cultural tasks (introductions, buddy) */
  SOCIAL = 'social',
  /** Compliance and legal tasks */
  COMPLIANCE = 'compliance',
  /** Role-specific technical tasks */
  ROLE_SPECIFIC = 'role_specific',
  /** Equipment and workspace tasks */
  EQUIPMENT = 'equipment',
  /** Manager-specific tasks */
  MANAGER = 'manager',
  /** HR-specific tasks */
  HR = 'hr',
}

/**
 * Who is responsible for a task.
 */
export enum TaskAssigneeRole {
  /** The new hire themselves */
  NEW_HIRE = 'new_hire',
  /** The hiring manager */
  HIRING_MANAGER = 'hiring_manager',
  /** HR representative */
  HR_REPRESENTATIVE = 'hr_representative',
  /** IT team */
  IT_TEAM = 'it_team',
  /** Assigned buddy/mentor */
  BUDDY = 'buddy',
  /** Facilities team */
  FACILITIES = 'facilities',
  /** Finance/payroll team */
  FINANCE = 'finance',
  /** Custom assignee (specific user ID) */
  CUSTOM = 'custom',
}

/**
 * States for provisioning requests.
 */
export enum ProvisioningStatus {
  /** Request submitted, awaiting processing */
  REQUESTED = 'requested',
  /** Request approved, pending fulfillment */
  APPROVED = 'approved',
  /** Provisioning in progress */
  IN_PROGRESS = 'in_progress',
  /** Provisioning completed */
  COMPLETED = 'completed',
  /** Provisioning failed */
  FAILED = 'failed',
  /** Request denied */
  DENIED = 'denied',
  /** Request cancelled */
  CANCELLED = 'cancelled',
}

/**
 * States for document requests.
 */
export enum DocumentRequestStatus {
  /** Document not yet requested */
  NOT_SENT = 'not_sent',
  /** Request sent, awaiting submission */
  SENT = 'sent',
  /** Document uploaded, awaiting review */
  SUBMITTED = 'submitted',
  /** Document reviewed and approved */
  APPROVED = 'approved',
  /** Document rejected, resubmission needed */
  REJECTED = 'rejected',
  /** E-signature pending */
  AWAITING_SIGNATURE = 'awaiting_signature',
  /** E-signature completed */
  SIGNED = 'signed',
  /** Document expired */
  EXPIRED = 'expired',
}

/**
 * Types of documents that can be requested.
 */
export enum DocumentType {
  /** Tax form (W-4, W-9, etc.) */
  TAX_FORM = 'tax_form',
  /** Government-issued identification */
  GOVERNMENT_ID = 'government_id',
  /** Employment eligibility (I-9) */
  EMPLOYMENT_ELIGIBILITY = 'employment_eligibility',
  /** Bank account details for direct deposit */
  BANK_DETAILS = 'bank_details',
  /** Emergency contact information */
  EMERGENCY_CONTACT = 'emergency_contact',
  /** Policy acknowledgment */
  POLICY_ACKNOWLEDGMENT = 'policy_acknowledgment',
  /** Non-disclosure agreement */
  NDA = 'nda',
  /** Employment agreement/offer letter */
  EMPLOYMENT_AGREEMENT = 'employment_agreement',
  /** Benefits enrollment forms */
  BENEFITS_ENROLLMENT = 'benefits_enrollment',
  /** Background check authorization */
  BACKGROUND_CHECK = 'background_check',
  /** Professional certification */
  CERTIFICATION = 'certification',
  /** Other/custom document */
  OTHER = 'other',
}

/**
 * Types of provisioning requests.
 */
export enum ProvisioningType {
  /** Email/workspace account */
  EMAIL_ACCOUNT = 'email_account',
  /** Chat/messaging platform */
  CHAT_ACCOUNT = 'chat_account',
  /** Source code repository access */
  REPOSITORY_ACCESS = 'repository_access',
  /** Project management tool access */
  PROJECT_TOOL_ACCESS = 'project_tool_access',
  /** VPN/network access */
  NETWORK_ACCESS = 'network_access',
  /** Physical access (badge, keys) */
  PHYSICAL_ACCESS = 'physical_access',
  /** Software license */
  SOFTWARE_LICENSE = 'software_license',
  /** Hardware/equipment */
  HARDWARE = 'hardware',
  /** Cloud platform access */
  CLOUD_ACCESS = 'cloud_access',
  /** Database access */
  DATABASE_ACCESS = 'database_access',
  /** Custom provisioning */
  CUSTOM = 'custom',
}

/**
 * Offboarding workflow states.
 */
export enum OffboardingStatus {
  /** Offboarding initiated */
  INITIATED = 'initiated',
  /** In progress */
  IN_PROGRESS = 'in_progress',
  /** Knowledge transfer phase */
  KNOWLEDGE_TRANSFER = 'knowledge_transfer',
  /** Access revocation phase */
  ACCESS_REVOCATION = 'access_revocation',
  /** Equipment return pending */
  EQUIPMENT_RETURN = 'equipment_return',
  /** Exit interview scheduled */
  EXIT_INTERVIEW = 'exit_interview',
  /** Completed */
  COMPLETED = 'completed',
  /** Cancelled (e.g., employee decided to stay) */
  CANCELLED = 'cancelled',
}

/**
 * Reasons for offboarding.
 */
export enum OffboardingReason {
  RESIGNATION = 'resignation',
  TERMINATION = 'termination',
  LAYOFF = 'layoff',
  RETIREMENT = 'retirement',
  CONTRACT_END = 'contract_end',
  MUTUAL_AGREEMENT = 'mutual_agreement',
  TRANSFER = 'transfer',
  OTHER = 'other',
}
```

### OnboardingWorkflow

```typescript
/**
 * Represents a complete onboarding workflow instance for a specific new hire.
 * Created from a template when an employee's onboarding is initiated.
 */
export interface OnboardingWorkflow {
  /** Unique identifier */
  id: string;

  /** Tenant/organization ID for RLS */
  tenantId: string;

  /** Venture this onboarding belongs to */
  ventureId: string;

  /** The new hire's employee/user ID */
  newHireId: string;

  /** The new hire's display name (denormalized for queries) */
  newHireName: string;

  /** The new hire's email address */
  newHireEmail: string;

  /** Template this workflow was created from */
  templateId: string | null;

  /** Hiring manager's user ID */
  hiringManagerId: string;

  /** HR representative's user ID */
  hrRepresentativeId: string | null;

  /** Department ID */
  departmentId: string;

  /** Role/position title */
  roleTitle: string;

  /** Job level/seniority */
  jobLevel: string | null;

  /** Employment type (full-time, part-time, contract) */
  employmentType: string;

  /** Scheduled start date (Day 1) */
  startDate: string; // ISO date

  /** Expected onboarding completion date */
  expectedCompletionDate: string; // ISO date

  /** Actual completion date (set when completed) */
  actualCompletionDate: string | null; // ISO date

  /** Current workflow status */
  status: WorkflowStatus;

  /** Overall completion percentage (0-100) */
  completionPercentage: number;

  /** Total number of tasks */
  totalTasks: number;

  /** Number of completed tasks */
  completedTasks: number;

  /** Number of overdue tasks */
  overdueTasks: number;

  /** Work location (office, remote, hybrid) */
  workLocation: 'office' | 'remote' | 'hybrid';

  /** Office location (if applicable) */
  officeLocation: string | null;

  /** Custom metadata */
  metadata: Record<string, unknown>;

  /** Notes/comments */
  notes: string | null;

  /** Created timestamp */
  createdAt: string; // ISO datetime

  /** Last updated timestamp */
  updatedAt: string; // ISO datetime

  /** Created by user ID */
  createdBy: string;

  /** Updated by user ID */
  updatedBy: string;
}
```

### OnboardingTask

```typescript
/**
 * Represents an individual task within an onboarding workflow.
 * Tasks have owners, due dates, dependencies, and completion criteria.
 */
export interface OnboardingTask {
  /** Unique identifier */
  id: string;

  /** Tenant/organization ID for RLS */
  tenantId: string;

  /** Parent workflow ID */
  workflowId: string;

  /** Task title */
  title: string;

  /** Detailed description with instructions */
  description: string;

  /** Rich content / detailed instructions (Markdown) */
  instructions: string | null;

  /** Task category */
  category: TaskCategory;

  /** Current task status */
  status: TaskStatus;

  /** Task priority (1 = highest, 5 = lowest) */
  priority: number;

  /** Sort order within the workflow */
  sortOrder: number;

  /** Phase of onboarding this task belongs to */
  phase: 'pre_boarding' | 'day_one' | 'first_week' | 'first_month' | 'ramp_up';

  /** Relative due date (days from start date, negative = before) */
  relativeDueDay: number;

  /** Absolute due date (resolved from relativeDueDay + startDate) */
  dueDate: string; // ISO date

  /** Completed timestamp */
  completedAt: string | null; // ISO datetime

  /** Completed by user ID */
  completedBy: string | null;

  /** Assignee role (template placeholder) */
  assigneeRole: TaskAssigneeRole;

  /** Resolved assignee user ID */
  assigneeId: string | null;

  /** Whether this task requires verification after completion */
  requiresVerification: boolean;

  /** User ID of verifier (if verification required) */
  verifierId: string | null;

  /** Verified timestamp */
  verifiedAt: string | null;

  /** IDs of tasks that must be completed before this one */
  dependsOn: string[];

  /** Whether this task is mandatory or optional */
  isMandatory: boolean;

  /** Whether this task can be auto-completed (e.g., by system event) */
  isAutoCompletable: boolean;

  /** External system action (e.g., provisioning type) */
  externalAction: string | null;

  /** External system reference ID */
  externalReferenceId: string | null;

  /** URL link for task action (e.g., link to form, training course) */
  actionUrl: string | null;

  /** Attached document/file IDs */
  attachmentIds: string[];

  /** Completion notes */
  completionNotes: string | null;

  /** Reminder schedule (cron expression or relative days) */
  reminderSchedule: string | null;

  /** Whether reminders have been sent */
  remindersSent: number;

  /** Estimated duration in minutes */
  estimatedDurationMinutes: number | null;

  /** Actual duration in minutes (tracked) */
  actualDurationMinutes: number | null;

  /** Custom metadata */
  metadata: Record<string, unknown>;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}
```

### OnboardingTaskAssignment

```typescript
/**
 * Tracks the assignment of a task to a specific person.
 * Supports multiple assignees per task (e.g., task assigned to IT team).
 */
export interface OnboardingTaskAssignment {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Task ID */
  taskId: string;

  /** Workflow ID (denormalized for efficient queries) */
  workflowId: string;

  /** Assigned user ID */
  assigneeId: string;

  /** Assignee's display name (denormalized) */
  assigneeName: string;

  /** Role of the assignee in this task */
  assigneeRole: TaskAssigneeRole;

  /** Whether this is the primary assignee */
  isPrimary: boolean;

  /** Assignment status */
  status: TaskStatus;

  /** When the assignee was notified */
  notifiedAt: string | null;

  /** When the assignee acknowledged the task */
  acknowledgedAt: string | null;

  /** When the assignee completed their part */
  completedAt: string | null;

  /** Completion notes */
  notes: string | null;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}
```

### PreboardingPackage

```typescript
/**
 * Represents a pre-boarding package sent to a new hire before Day 1.
 * Includes welcome communications, document collection, and preparation tasks.
 */
export interface PreboardingPackage {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Associated workflow ID */
  workflowId: string;

  /** New hire ID */
  newHireId: string;

  /** Welcome email sent */
  welcomeEmailSent: boolean;

  /** Welcome email sent timestamp */
  welcomeEmailSentAt: string | null;

  /** Welcome email template ID */
  welcomeEmailTemplateId: string | null;

  /** Welcome kit type (digital, physical, both) */
  welcomeKitType: 'digital' | 'physical' | 'both' | 'none';

  /** Welcome kit shipped/sent status */
  welcomeKitStatus: 'pending' | 'sent' | 'delivered' | 'not_applicable';

  /** Welcome kit tracking number */
  welcomeKitTrackingNumber: string | null;

  /** Portal access link for new hire */
  portalAccessUrl: string | null;

  /** Temporary credentials sent */
  tempCredentialsSent: boolean;

  /** Document collection status summary */
  documentCollectionStatus: {
    total: number;
    submitted: number;
    approved: number;
    pending: number;
    rejected: number;
  };

  /** Equipment request status */
  equipmentRequestStatus: 'not_started' | 'requested' | 'ordered' | 'shipped' | 'ready';

  /** Parking/transit information sent */
  logisticsInfoSent: boolean;

  /** First day instructions sent */
  firstDayInstructionsSent: boolean;

  /** Day 1 schedule details */
  dayOneSchedule: {
    arrivalTime: string;
    arrivalLocation: string;
    contactPerson: string;
    contactPhone: string;
    dressCode: string | null;
    specialInstructions: string | null;
  } | null;

  /** Custom welcome message */
  customWelcomeMessage: string | null;

  /** Pre-boarding completion percentage */
  completionPercentage: number;

  /** Metadata */
  metadata: Record<string, unknown>;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}
```

### DocumentRequest

```typescript
/**
 * Represents a request for a specific document from the new hire.
 * Tracks the lifecycle from request through submission, review, and approval.
 */
export interface DocumentRequest {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Associated workflow ID */
  workflowId: string;

  /** New hire ID */
  newHireId: string;

  /** Type of document requested */
  documentType: DocumentType;

  /** Custom document name (for OTHER type) */
  customDocumentName: string | null;

  /** Description of what's needed */
  description: string;

  /** Current status */
  status: DocumentRequestStatus;

  /** Whether this document is required (vs optional) */
  isRequired: boolean;

  /** Due date for submission */
  dueDate: string; // ISO date

  /** Whether e-signature is required */
  requiresESignature: boolean;

  /** E-signature provider (e.g., DocuSign, HelloSign) */
  eSignatureProvider: string | null;

  /** E-signature envelope/request ID */
  eSignatureExternalId: string | null;

  /** E-signature status */
  eSignatureStatus: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined' | null;

  /** Pre-filled form data (for digital forms) */
  prefilledData: Record<string, unknown> | null;

  /** Form schema (for digital forms) */
  formSchema: Record<string, unknown> | null;

  /** Submitted form data */
  submittedData: Record<string, unknown> | null;

  /** Uploaded file storage reference */
  fileStorageRef: string | null;

  /** Original filename */
  originalFilename: string | null;

  /** File MIME type */
  fileMimeType: string | null;

  /** File size in bytes */
  fileSizeBytes: number | null;

  /** Submitted timestamp */
  submittedAt: string | null;

  /** Reviewer user ID */
  reviewerId: string | null;

  /** Reviewed timestamp */
  reviewedAt: string | null;

  /** Rejection reason */
  rejectionReason: string | null;

  /** Number of times resubmitted */
  resubmissionCount: number;

  /** Reminder count sent */
  remindersSent: number;

  /** Last reminder sent timestamp */
  lastReminderAt: string | null;

  /** Expiration date for the document */
  expiresAt: string | null;

  /** Metadata */
  metadata: Record<string, unknown>;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}
```

### ProvisioningRequest

```typescript
/**
 * Represents an IT provisioning request generated during onboarding.
 * Published to Redpanda for asynchronous fulfillment by downstream systems.
 */
export interface ProvisioningRequest {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Associated workflow ID */
  workflowId: string;

  /** Associated task ID (if linked to a specific task) */
  taskId: string | null;

  /** New hire ID */
  newHireId: string;

  /** Type of provisioning */
  provisioningType: ProvisioningType;

  /** Current status */
  status: ProvisioningStatus;

  /** Priority (1 = critical, 5 = low) */
  priority: number;

  /** Requested for date (when access/equipment is needed) */
  requestedForDate: string; // ISO date

  /** System/service name (e.g., "Google Workspace", "GitHub") */
  systemName: string;

  /** Specific access level or role within the system */
  accessLevel: string | null;

  /** Groups/teams to add the user to */
  groups: string[];

  /** Permissions/scopes to grant */
  permissions: string[];

  /** Equipment specifications (for hardware requests) */
  equipmentSpecs: {
    type: string;
    model: string | null;
    specifications: Record<string, unknown>;
  } | null;

  /** Software license details */
  licenseDetails: {
    software: string;
    licenseType: string;
    seats: number;
  } | null;

  /** Provisioning configuration/parameters */
  configuration: Record<string, unknown>;

  /** External system ticket/request ID */
  externalTicketId: string | null;

  /** External system reference URL */
  externalReferenceUrl: string | null;

  /** Fulfilled by user/system ID */
  fulfilledBy: string | null;

  /** Fulfilled timestamp */
  fulfilledAt: string | null;

  /** Provisioned resource details (account name, asset tag, etc.) */
  provisionedDetails: Record<string, unknown> | null;

  /** Failure reason (if failed) */
  failureReason: string | null;

  /** Retry count */
  retryCount: number;

  /** Maximum retries allowed */
  maxRetries: number;

  /** Denial reason */
  denialReason: string | null;

  /** Approved by user ID */
  approvedBy: string | null;

  /** Approved timestamp */
  approvedAt: string | null;

  /** Notes */
  notes: string | null;

  /** Metadata */
  metadata: Record<string, unknown>;

  /** Redpanda event ID (for tracking) */
  eventId: string | null;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}
```

### BuddyAssignment

```typescript
/**
 * Represents a buddy or mentor assignment for a new hire.
 * Supports automatic matching based on department, skills, and availability.
 */
export interface BuddyAssignment {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Associated workflow ID */
  workflowId: string;

  /** New hire ID */
  newHireId: string;

  /** Buddy/mentor user ID */
  buddyId: string;

  /** Buddy's display name (denormalized) */
  buddyName: string;

  /** Type of assignment */
  assignmentType: 'buddy' | 'mentor' | 'onboarding_partner';

  /** How the buddy was selected */
  selectionMethod: 'automatic' | 'manual' | 'self_selected';

  /** Match score (for automatic matching, 0-100) */
  matchScore: number | null;

  /** Matching criteria used */
  matchCriteria: {
    sameDepartment: boolean;
    sameLocation: boolean;
    similarRole: boolean;
    skillOverlap: string[];
    tenureMonths: number;
    previousBuddyCount: number;
    availabilityScore: number;
  } | null;

  /** Assignment status */
  status: 'pending' | 'accepted' | 'active' | 'completed' | 'declined' | 'reassigned';

  /** Start date of the buddy relationship */
  startDate: string;

  /** End date of the buddy relationship */
  endDate: string;

  /** Introduction meeting scheduled */
  introMeetingScheduled: boolean;

  /** Introduction meeting datetime */
  introMeetingAt: string | null;

  /** Introduction meeting location/link */
  introMeetingLocation: string | null;

  /** Check-in schedule (e.g., "weekly", "biweekly") */
  checkInFrequency: string;

  /** Number of check-ins completed */
  checkInsCompleted: number;

  /** Last check-in date */
  lastCheckInAt: string | null;

  /** Buddy feedback on the experience */
  buddyFeedback: string | null;

  /** New hire feedback on the buddy */
  newHireFeedback: string | null;

  /** Rating (1-5) from new hire */
  newHireRating: number | null;

  /** Notes */
  notes: string | null;

  /** Metadata */
  metadata: Record<string, unknown>;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}
```

### OnboardingTemplate

```typescript
/**
 * Reusable onboarding template. Templates define the tasks, documents,
 * provisioning requirements, and timeline for a specific role/department/venture.
 * Supports inheritance: organization → venture → department → role.
 */
export interface OnboardingTemplate {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Template scope level */
  scopeLevel: 'organization' | 'venture' | 'department' | 'role';

  /** Venture ID (null for organization-level) */
  ventureId: string | null;

  /** Department ID (null for venture/org-level) */
  departmentId: string | null;

  /** Role/position title (null for non-role-level) */
  roleTitle: string | null;

  /** Parent template ID (for inheritance) */
  parentTemplateId: string | null;

  /** Whether this template is active */
  isActive: boolean;

  /** Whether this is the default template for its scope */
  isDefault: boolean;

  /** Template version */
  version: number;

  /** Template type */
  templateType: 'onboarding' | 'offboarding';

  /** Expected duration in days */
  expectedDurationDays: number;

  /** Task definitions (template tasks) */
  taskDefinitions: OnboardingTaskDefinition[];

  /** Document requirements */
  documentRequirements: DocumentRequirement[];

  /** Provisioning requirements */
  provisioningRequirements: ProvisioningRequirement[];

  /** Welcome email template */
  welcomeEmailTemplate: {
    subject: string;
    bodyHtml: string;
    bodyText: string;
    variables: string[];
  } | null;

  /** Buddy assignment configuration */
  buddyConfig: {
    enabled: boolean;
    type: 'buddy' | 'mentor' | 'onboarding_partner';
    autoMatch: boolean;
    durationDays: number;
    checkInFrequency: string;
    matchCriteria: {
      preferSameDepartment: boolean;
      preferSameLocation: boolean;
      preferSimilarRole: boolean;
      minimumTenureMonths: number;
      maxActiveBuddyAssignments: number;
    };
  } | null;

  /** Training course IDs to auto-enroll */
  trainingCourseIds: string[];

  /** Tags for categorization and search */
  tags: string[];

  /** Custom metadata */
  metadata: Record<string, unknown>;

  /** Created by */
  createdBy: string;

  /** Updated by */
  updatedBy: string;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

/**
 * Task definition within a template (not yet instantiated).
 */
export interface OnboardingTaskDefinition {
  /** Unique key within the template */
  key: string;

  /** Task title */
  title: string;

  /** Task description */
  description: string;

  /** Detailed instructions (Markdown) */
  instructions: string | null;

  /** Task category */
  category: TaskCategory;

  /** Priority (1-5) */
  priority: number;

  /** Sort order */
  sortOrder: number;

  /** Onboarding phase */
  phase: 'pre_boarding' | 'day_one' | 'first_week' | 'first_month' | 'ramp_up';

  /** Due day relative to start date */
  relativeDueDay: number;

  /** Assignee role placeholder */
  assigneeRole: TaskAssigneeRole;

  /** Custom assignee ID (for CUSTOM role) */
  customAssigneeId: string | null;

  /** Whether verification is required */
  requiresVerification: boolean;

  /** Verifier role */
  verifierRole: TaskAssigneeRole | null;

  /** Task keys this depends on */
  dependsOnKeys: string[];

  /** Whether mandatory */
  isMandatory: boolean;

  /** Whether auto-completable */
  isAutoCompletable: boolean;

  /** External action reference */
  externalAction: string | null;

  /** Action URL */
  actionUrl: string | null;

  /** Estimated duration in minutes */
  estimatedDurationMinutes: number | null;

  /** Reminder schedule */
  reminderSchedule: string | null;
}

/**
 * Document requirement within a template.
 */
export interface DocumentRequirement {
  /** Document type */
  documentType: DocumentType;

  /** Custom name (for OTHER type) */
  customName: string | null;

  /** Description */
  description: string;

  /** Whether required */
  isRequired: boolean;

  /** Due day relative to start date */
  relativeDueDay: number;

  /** Whether e-signature is needed */
  requiresESignature: boolean;

  /** Form schema (for digital forms) */
  formSchema: Record<string, unknown> | null;

  /** Pre-filled field mappings */
  prefilledFieldMappings: Record<string, string> | null;
}

/**
 * Provisioning requirement within a template.
 */
export interface ProvisioningRequirement {
  /** Provisioning type */
  provisioningType: ProvisioningType;

  /** System/service name */
  systemName: string;

  /** Default access level */
  defaultAccessLevel: string | null;

  /** Default groups */
  defaultGroups: string[];

  /** Default permissions */
  defaultPermissions: string[];

  /** Equipment specifications */
  equipmentSpecs: Record<string, unknown> | null;

  /** License details */
  licenseDetails: Record<string, unknown> | null;

  /** Configuration parameters */
  configuration: Record<string, unknown>;

  /** Priority */
  priority: number;

  /** Lead time in days (how many days before needed to request) */
  leadTimeDays: number;

  /** Whether approval is required */
  requiresApproval: boolean;

  /** Approver role */
  approverRole: TaskAssigneeRole | null;
}
```

### OffboardingWorkflow

```typescript
/**
 * Represents an offboarding workflow for a departing employee.
 * Manages access revocation, equipment return, knowledge transfer, and exit processes.
 */
export interface OffboardingWorkflow {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Venture ID */
  ventureId: string;

  /** Departing employee ID */
  employeeId: string;

  /** Employee display name (denormalized) */
  employeeName: string;

  /** Employee email */
  employeeEmail: string;

  /** Template used */
  templateId: string | null;

  /** Manager ID */
  managerId: string;

  /** HR representative ID */
  hrRepresentativeId: string | null;

  /** Department ID */
  departmentId: string;

  /** Role title */
  roleTitle: string;

  /** Reason for departure */
  reason: OffboardingReason;

  /** Additional context for departure */
  reasonDetails: string | null;

  /** Whether departure is voluntary */
  isVoluntary: boolean;

  /** Last working day */
  lastWorkingDay: string; // ISO date

  /** Notice period start date */
  noticePeriodStart: string | null;

  /** Current status */
  status: OffboardingStatus;

  /** Overall completion percentage */
  completionPercentage: number;

  /** Access revocation status */
  accessRevocation: {
    totalSystems: number;
    revokedSystems: number;
    pendingSystems: string[];
    completedAt: string | null;
  };

  /** Equipment return status */
  equipmentReturn: {
    totalItems: number;
    returnedItems: number;
    pendingItems: Array<{
      name: string;
      assetTag: string;
      status: 'pending' | 'returned' | 'lost' | 'kept_with_approval';
    }>;
    completedAt: string | null;
  };

  /** Knowledge transfer status */
  knowledgeTransfer: {
    documentsCreated: number;
    handoffMeetingsCompleted: number;
    successorId: string | null;
    successorName: string | null;
    completedAt: string | null;
  };

  /** Exit interview */
  exitInterview: {
    scheduled: boolean;
    scheduledAt: string | null;
    conductedBy: string | null;
    completed: boolean;
    completedAt: string | null;
    feedbackSummary: string | null;
    overallRating: number | null;
    wouldRecommend: boolean | null;
    reasonsForLeaving: string[];
    improvementSuggestions: string | null;
  };

  /** Final payroll/benefits information */
  finalSettlement: {
    lastPaycheckDate: string | null;
    unusedPtoDays: number | null;
    benefitsEndDate: string | null;
    cobraEligible: boolean | null;
    cobraNotificationSent: boolean;
  };

  /** Rehire eligibility */
  rehireEligible: boolean | null;

  /** Notes */
  notes: string | null;

  /** Metadata */
  metadata: Record<string, unknown>;

  /** Initiated by user ID */
  initiatedBy: string;

  /** Completed timestamp */
  completedAt: string | null;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}
```

### OnboardingProgress

```typescript
/**
 * Tracks point-in-time progress snapshots for analytics and reporting.
 * Captured periodically and at key milestones.
 */
export interface OnboardingProgress {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Workflow ID */
  workflowId: string;

  /** New hire ID */
  newHireId: string;

  /** Snapshot date */
  snapshotDate: string; // ISO date

  /** Snapshot type */
  snapshotType: 'daily' | 'milestone' | 'phase_change' | 'completion';

  /** Current phase */
  currentPhase: string;

  /** Overall completion percentage */
  completionPercentage: number;

  /** Tasks by status */
  taskBreakdown: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    skipped: number;
    blocked: number;
  };

  /** Tasks by category */
  categoryBreakdown: Record<TaskCategory, {
    total: number;
    completed: number;
  }>;

  /** Document collection progress */
  documentProgress: {
    total: number;
    submitted: number;
    approved: number;
    pending: number;
  };

  /** Provisioning progress */
  provisioningProgress: {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
  };

  /** Training progress */
  trainingProgress: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    totalHoursRequired: number;
    hoursCompleted: number;
  };

  /** Days since start date */
  daysSinceStart: number;

  /** Days until expected completion */
  daysUntilExpectedCompletion: number;

  /** Whether on track */
  isOnTrack: boolean;

  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  /** Risk factors */
  riskFactors: string[];

  /** Satisfaction score (if survey completed) */
  satisfactionScore: number | null;

  /** Engagement score */
  engagementScore: number | null;

  /** Notes */
  notes: string | null;

  /** Metadata */
  metadata: Record<string, unknown>;

  /** Created timestamp */
  createdAt: string;
}
```

### Service Interfaces

```typescript
/**
 * Primary service for managing onboarding workflows.
 */
export interface IOnboardingService {
  // Workflow Management
  createWorkflow(input: CreateWorkflowInput): Promise<OnboardingWorkflow>;
  getWorkflow(workflowId: string): Promise<OnboardingWorkflow>;
  listWorkflows(filters: WorkflowFilters): Promise<PaginatedResult<OnboardingWorkflow>>;
  updateWorkflow(workflowId: string, input: UpdateWorkflowInput): Promise<OnboardingWorkflow>;
  cancelWorkflow(workflowId: string, reason: string): Promise<OnboardingWorkflow>;
  pauseWorkflow(workflowId: string, reason: string): Promise<OnboardingWorkflow>;
  resumeWorkflow(workflowId: string): Promise<OnboardingWorkflow>;
  completeWorkflow(workflowId: string): Promise<OnboardingWorkflow>;

  // Task Management
  getTask(taskId: string): Promise<OnboardingTask>;
  listTasks(workflowId: string, filters?: TaskFilters): Promise<OnboardingTask[]>;
  updateTaskStatus(taskId: string, status: TaskStatus, notes?: string): Promise<OnboardingTask>;
  completeTask(taskId: string, input: CompleteTaskInput): Promise<OnboardingTask>;
  skipTask(taskId: string, reason: string): Promise<OnboardingTask>;
  reassignTask(taskId: string, newAssigneeId: string): Promise<OnboardingTask>;
  addTask(workflowId: string, input: AddTaskInput): Promise<OnboardingTask>;
  removeTask(taskId: string): Promise<void>;

  // Assignment Management
  getMyTasks(filters?: TaskFilters): Promise<OnboardingTaskAssignment[]>;
  acknowledgeTask(assignmentId: string): Promise<OnboardingTaskAssignment>;
  getAssignmentsForWorkflow(workflowId: string): Promise<OnboardingTaskAssignment[]>;

  // Progress
  getProgress(workflowId: string): Promise<OnboardingProgress>;
  captureProgressSnapshot(workflowId: string, type: string): Promise<OnboardingProgress>;

  // Workflow from Template
  createWorkflowFromTemplate(
    templateId: string,
    input: CreateFromTemplateInput
  ): Promise<OnboardingWorkflow>;

  // Bulk Operations
  bulkUpdateTaskStatus(taskIds: string[], status: TaskStatus): Promise<OnboardingTask[]>;
  bulkReassignTasks(taskIds: string[], newAssigneeId: string): Promise<OnboardingTask[]>;
}

/**
 * Service for managing pre-boarding packages.
 */
export interface IPreboardingService {
  createPackage(workflowId: string): Promise<PreboardingPackage>;
  getPackage(packageId: string): Promise<PreboardingPackage>;
  getPackageByWorkflow(workflowId: string): Promise<PreboardingPackage>;
  sendWelcomeEmail(packageId: string): Promise<void>;
  sendFirstDayInstructions(packageId: string): Promise<void>;
  updateDayOneSchedule(packageId: string, schedule: DayOneSchedule): Promise<PreboardingPackage>;
  trackWelcomeKit(packageId: string, status: string, trackingNumber?: string): Promise<void>;
  getPreboardingChecklist(packageId: string): Promise<PreboardingChecklist>;
}

/**
 * Service for IT provisioning requests.
 */
export interface IProvisioningService {
  createRequest(input: CreateProvisioningInput): Promise<ProvisioningRequest>;
  getRequest(requestId: string): Promise<ProvisioningRequest>;
  listRequests(filters: ProvisioningFilters): Promise<PaginatedResult<ProvisioningRequest>>;
  approveRequest(requestId: string, approvedBy: string): Promise<ProvisioningRequest>;
  denyRequest(requestId: string, reason: string): Promise<ProvisioningRequest>;
  fulfillRequest(requestId: string, details: Record<string, unknown>): Promise<ProvisioningRequest>;
  failRequest(requestId: string, reason: string): Promise<ProvisioningRequest>;
  retryRequest(requestId: string): Promise<ProvisioningRequest>;
  publishProvisioningEvent(request: ProvisioningRequest): Promise<void>;
  getProvisioningStatus(workflowId: string): Promise<ProvisioningStatusSummary>;
  createBulkRequests(workflowId: string, requirements: ProvisioningRequirement[]): Promise<ProvisioningRequest[]>;
  revokeAccess(employeeId: string, systems: string[]): Promise<void>;
}

/**
 * Service for document collection.
 */
export interface IDocumentCollectionService {
  createRequest(input: CreateDocumentRequestInput): Promise<DocumentRequest>;
  getRequest(requestId: string): Promise<DocumentRequest>;
  listRequests(workflowId: string): Promise<DocumentRequest[]>;
  submitDocument(requestId: string, input: SubmitDocumentInput): Promise<DocumentRequest>;
  approveDocument(requestId: string, reviewerId: string): Promise<DocumentRequest>;
  rejectDocument(requestId: string, reason: string): Promise<DocumentRequest>;
  requestESignature(requestId: string): Promise<DocumentRequest>;
  handleESignatureWebhook(payload: ESignatureWebhookPayload): Promise<void>;
  sendReminder(requestId: string): Promise<void>;
  getCollectionStatus(workflowId: string): Promise<DocumentCollectionSummary>;
}

/**
 * Service for buddy/mentor assignments.
 */
export interface IBuddyAssignmentService {
  findMatch(workflowId: string, criteria?: MatchCriteria): Promise<BuddyCandidate[]>;
  createAssignment(input: CreateBuddyAssignmentInput): Promise<BuddyAssignment>;
  getAssignment(assignmentId: string): Promise<BuddyAssignment>;
  getAssignmentByWorkflow(workflowId: string): Promise<BuddyAssignment | null>;
  acceptAssignment(assignmentId: string): Promise<BuddyAssignment>;
  declineAssignment(assignmentId: string, reason?: string): Promise<BuddyAssignment>;
  reassign(assignmentId: string, newBuddyId: string): Promise<BuddyAssignment>;
  recordCheckIn(assignmentId: string, notes: string): Promise<BuddyAssignment>;
  submitFeedback(assignmentId: string, input: BuddyFeedbackInput): Promise<BuddyAssignment>;
  scheduleIntroMeeting(assignmentId: string, input: IntroMeetingInput): Promise<BuddyAssignment>;
  completeAssignment(assignmentId: string): Promise<BuddyAssignment>;
  getBuddyLeaderboard(ventureId: string): Promise<BuddyLeaderboardEntry[]>;
}

/**
 * Service for offboarding workflows.
 */
export interface IOffboardingService {
  initiateOffboarding(input: InitiateOffboardingInput): Promise<OffboardingWorkflow>;
  getWorkflow(workflowId: string): Promise<OffboardingWorkflow>;
  listWorkflows(filters: OffboardingFilters): Promise<PaginatedResult<OffboardingWorkflow>>;
  updateStatus(workflowId: string, status: OffboardingStatus): Promise<OffboardingWorkflow>;
  scheduleExitInterview(workflowId: string, input: ExitInterviewInput): Promise<OffboardingWorkflow>;
  recordExitInterview(workflowId: string, input: ExitInterviewResultInput): Promise<OffboardingWorkflow>;
  revokeSystemAccess(workflowId: string, system: string): Promise<OffboardingWorkflow>;
  revokeAllAccess(workflowId: string): Promise<OffboardingWorkflow>;
  trackEquipmentReturn(workflowId: string, item: string, status: string): Promise<OffboardingWorkflow>;
  recordKnowledgeTransfer(workflowId: string, input: KnowledgeTransferInput): Promise<OffboardingWorkflow>;
  assignSuccessor(workflowId: string, successorId: string): Promise<OffboardingWorkflow>;
  completeOffboarding(workflowId: string): Promise<OffboardingWorkflow>;
  cancelOffboarding(workflowId: string, reason: string): Promise<OffboardingWorkflow>;
}

/**
 * Service for onboarding templates.
 */
export interface IOnboardingTemplateService {
  createTemplate(input: CreateTemplateInput): Promise<OnboardingTemplate>;
  getTemplate(templateId: string): Promise<OnboardingTemplate>;
  listTemplates(filters: TemplateFilters): Promise<PaginatedResult<OnboardingTemplate>>;
  updateTemplate(templateId: string, input: UpdateTemplateInput): Promise<OnboardingTemplate>;
  deleteTemplate(templateId: string): Promise<void>;
  duplicateTemplate(templateId: string, name: string): Promise<OnboardingTemplate>;
  resolveTemplate(ventureId: string, departmentId: string, roleTitle?: string): Promise<OnboardingTemplate>;
  resolveInheritedTemplate(templateId: string): Promise<ResolvedTemplate>;
  setDefault(templateId: string): Promise<OnboardingTemplate>;
  getVersionHistory(templateId: string): Promise<TemplateVersion[]>;
  revertToVersion(templateId: string, version: number): Promise<OnboardingTemplate>;
}

/**
 * Service for onboarding analytics.
 */
export interface IOnboardingAnalyticsService {
  getOnboardingMetrics(filters: AnalyticsFilters): Promise<OnboardingMetrics>;
  getTimeToProductivity(filters: AnalyticsFilters): Promise<TimeToProductivityReport>;
  getCompletionRates(filters: AnalyticsFilters): Promise<CompletionRateReport>;
  getTaskBottlenecks(filters: AnalyticsFilters): Promise<BottleneckReport>;
  getSatisfactionScores(filters: AnalyticsFilters): Promise<SatisfactionReport>;
  getProvisioningMetrics(filters: AnalyticsFilters): Promise<ProvisioningMetricsReport>;
  getOffboardingMetrics(filters: AnalyticsFilters): Promise<OffboardingMetrics>;
  getActiveOnboardings(ventureId?: string): Promise<ActiveOnboardingSummary[]>;
  exportReport(filters: AnalyticsFilters, format: 'csv' | 'pdf'): Promise<string>;
  getDashboardData(ventureId?: string): Promise<OnboardingDashboard>;
}
```

---

## Database Schemas

### onboarding_workflows

```typescript
import { pgTable, text, timestamp, integer, jsonb, pgEnum, boolean, date, uuid } from 'drizzle-orm/pg-core';
import { tenantId } from '@mcv/db/shared';

export const workflowStatusEnum = pgEnum('onboarding_workflow_status', [
  'draft', 'pre_boarding', 'active', 'pending_completion', 'completed', 'cancelled', 'paused',
]);

export const employmentTypeEnum = pgEnum('employment_type', [
  'full_time', 'part_time', 'contract', 'intern', 'temporary',
]);

export const workLocationEnum = pgEnum('work_location', ['office', 'remote', 'hybrid']);

export const onboardingWorkflows = pgTable('onboarding_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  newHireId: uuid('new_hire_id').notNull().references(() => users.id),
  newHireName: text('new_hire_name').notNull(),
  newHireEmail: text('new_hire_email').notNull(),
  templateId: uuid('template_id').references(() => onboardingTemplates.id),
  hiringManagerId: uuid('hiring_manager_id').notNull().references(() => users.id),
  hrRepresentativeId: uuid('hr_representative_id').references(() => users.id),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  roleTitle: text('role_title').notNull(),
  jobLevel: text('job_level'),
  employmentType: employmentTypeEnum('employment_type').notNull().default('full_time'),
  startDate: date('start_date').notNull(),
  expectedCompletionDate: date('expected_completion_date').notNull(),
  actualCompletionDate: date('actual_completion_date'),
  status: workflowStatusEnum('status').notNull().default('draft'),
  completionPercentage: integer('completion_percentage').notNull().default(0),
  totalTasks: integer('total_tasks').notNull().default(0),
  completedTasks: integer('completed_tasks').notNull().default(0),
  overdueTasks: integer('overdue_tasks').notNull().default(0),
  workLocation: workLocationEnum('work_location').notNull().default('office'),
  officeLocation: text('office_location'),
  metadata: jsonb('metadata').notNull().default({}),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
}, (table) => ({
  tenantIdx: index('onboarding_workflows_tenant_idx').on(table.tenantId),
  newHireIdx: index('onboarding_workflows_new_hire_idx').on(table.tenantId, table.newHireId),
  managerIdx: index('onboarding_workflows_manager_idx').on(table.tenantId, table.hiringManagerId),
  statusIdx: index('onboarding_workflows_status_idx').on(table.tenantId, table.status),
  ventureIdx: index('onboarding_workflows_venture_idx').on(table.tenantId, table.ventureId),
  departmentIdx: index('onboarding_workflows_dept_idx').on(table.tenantId, table.departmentId),
  startDateIdx: index('onboarding_workflows_start_date_idx').on(table.tenantId, table.startDate),
}));
```

### onboarding_tasks

```typescript
export const taskStatusEnum = pgEnum('onboarding_task_status', [
  'blocked', 'pending', 'in_progress', 'awaiting_verification', 'completed', 'skipped', 'overdue', 'cancelled',
]);

export const taskCategoryEnum = pgEnum('onboarding_task_category', [
  'administrative', 'it_provisioning', 'training', 'social', 'compliance',
  'role_specific', 'equipment', 'manager', 'hr',
]);

export const taskAssigneeRoleEnum = pgEnum('onboarding_task_assignee_role', [
  'new_hire', 'hiring_manager', 'hr_representative', 'it_team', 'buddy',
  'facilities', 'finance', 'custom',
]);

export const onboardingPhaseEnum = pgEnum('onboarding_phase', [
  'pre_boarding', 'day_one', 'first_week', 'first_month', 'ramp_up',
]);

export const onboardingTasks = pgTable('onboarding_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  workflowId: uuid('workflow_id').notNull().references(() => onboardingWorkflows.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  instructions: text('instructions'),
  category: taskCategoryEnum('category').notNull(),
  status: taskStatusEnum('status').notNull().default('pending'),
  priority: integer('priority').notNull().default(3),
  sortOrder: integer('sort_order').notNull().default(0),
  phase: onboardingPhaseEnum('phase').notNull(),
  relativeDueDay: integer('relative_due_day').notNull().default(0),
  dueDate: date('due_date').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: uuid('completed_by').references(() => users.id),
  assigneeRole: taskAssigneeRoleEnum('assignee_role').notNull(),
  assigneeId: uuid('assignee_id').references(() => users.id),
  requiresVerification: boolean('requires_verification').notNull().default(false),
  verifierId: uuid('verifier_id').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  dependsOn: uuid('depends_on').array().notNull().default([]),
  isMandatory: boolean('is_mandatory').notNull().default(true),
  isAutoCompletable: boolean('is_auto_completable').notNull().default(false),
  externalAction: text('external_action'),
  externalReferenceId: text('external_reference_id'),
  actionUrl: text('action_url'),
  attachmentIds: uuid('attachment_ids').array().notNull().default([]),
  completionNotes: text('completion_notes'),
  reminderSchedule: text('reminder_schedule'),
  remindersSent: integer('reminders_sent').notNull().default(0),
  estimatedDurationMinutes: integer('estimated_duration_minutes'),
  actualDurationMinutes: integer('actual_duration_minutes'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('onboarding_tasks_workflow_idx').on(table.tenantId, table.workflowId),
  assigneeIdx: index('onboarding_tasks_assignee_idx').on(table.tenantId, table.assigneeId),
  statusIdx: index('onboarding_tasks_status_idx').on(table.tenantId, table.status),
  dueDateIdx: index('onboarding_tasks_due_date_idx').on(table.tenantId, table.dueDate),
  categoryIdx: index('onboarding_tasks_category_idx').on(table.tenantId, table.category),
  phaseIdx: index('onboarding_tasks_phase_idx').on(table.tenantId, table.phase),
}));
```

### onboarding_task_assignments

```typescript
export const onboardingTaskAssignments = pgTable('onboarding_task_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  taskId: uuid('task_id').notNull().references(() => onboardingTasks.id, { onDelete: 'cascade' }),
  workflowId: uuid('workflow_id').notNull().references(() => onboardingWorkflows.id, { onDelete: 'cascade' }),
  assigneeId: uuid('assignee_id').notNull().references(() => users.id),
  assigneeName: text('assignee_name').notNull(),
  assigneeRole: taskAssigneeRoleEnum('assignee_role').notNull(),
  isPrimary: boolean('is_primary').notNull().default(true),
  status: taskStatusEnum('status').notNull().default('pending'),
  notifiedAt: timestamp('notified_at', { withTimezone: true }),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskIdx: index('task_assignments_task_idx').on(table.tenantId, table.taskId),
  assigneeIdx: index('task_assignments_assignee_idx').on(table.tenantId, table.assigneeId),
  workflowIdx: index('task_assignments_workflow_idx').on(table.tenantId, table.workflowId),
  statusIdx: index('task_assignments_status_idx').on(table.tenantId, table.status),
}));
```

### preboarding_packages

```typescript
export const welcomeKitStatusEnum = pgEnum('welcome_kit_status', [
  'pending', 'sent', 'delivered', 'not_applicable',
]);

export const equipmentRequestStatusEnum = pgEnum('equipment_request_status', [
  'not_started', 'requested', 'ordered', 'shipped', 'ready',
]);

export const preboardingPackages = pgTable('preboarding_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  workflowId: uuid('workflow_id').notNull().references(() => onboardingWorkflows.id, { onDelete: 'cascade' }).unique(),
  newHireId: uuid('new_hire_id').notNull().references(() => users.id),
  welcomeEmailSent: boolean('welcome_email_sent').notNull().default(false),
  welcomeEmailSentAt: timestamp('welcome_email_sent_at', { withTimezone: true }),
  welcomeEmailTemplateId: uuid('welcome_email_template_id'),
  welcomeKitType: text('welcome_kit_type').notNull().default('none'),
  welcomeKitStatus: welcomeKitStatusEnum('welcome_kit_status').notNull().default('not_applicable'),
  welcomeKitTrackingNumber: text('welcome_kit_tracking_number'),
  portalAccessUrl: text('portal_access_url'),
  tempCredentialsSent: boolean('temp_credentials_sent').notNull().default(false),
  documentCollectionStatus: jsonb('document_collection_status').notNull().default({
    total: 0, submitted: 0, approved: 0, pending: 0, rejected: 0,
  }),
  equipmentRequestStatus: equipmentRequestStatusEnum('equipment_request_status').notNull().default('not_started'),
  logisticsInfoSent: boolean('logistics_info_sent').notNull().default(false),
  firstDayInstructionsSent: boolean('first_day_instructions_sent').notNull().default(false),
  dayOneSchedule: jsonb('day_one_schedule'),
  customWelcomeMessage: text('custom_welcome_message'),
  completionPercentage: integer('completion_percentage').notNull().default(0),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('preboarding_workflow_idx').on(table.tenantId, table.workflowId),
  newHireIdx: index('preboarding_new_hire_idx').on(table.tenantId, table.newHireId),
}));
```

### document_requests

```typescript
export const documentTypeEnum = pgEnum('document_type', [
  'tax_form', 'government_id', 'employment_eligibility', 'bank_details',
  'emergency_contact', 'policy_acknowledgment', 'nda', 'employment_agreement',
  'benefits_enrollment', 'background_check', 'certification', 'other',
]);

export const documentRequestStatusEnum = pgEnum('document_request_status', [
  'not_sent', 'sent', 'submitted', 'approved', 'rejected',
  'awaiting_signature', 'signed', 'expired',
]);

export const documentRequests = pgTable('document_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  workflowId: uuid('workflow_id').notNull().references(() => onboardingWorkflows.id, { onDelete: 'cascade' }),
  newHireId: uuid('new_hire_id').notNull().references(() => users.id),
  documentType: documentTypeEnum('document_type').notNull(),
  customDocumentName: text('custom_document_name'),
  description: text('description').notNull(),
  status: documentRequestStatusEnum('status').notNull().default('not_sent'),
  isRequired: boolean('is_required').notNull().default(true),
  dueDate: date('due_date').notNull(),
  requiresESignature: boolean('requires_e_signature').notNull().default(false),
  eSignatureProvider: text('e_signature_provider'),
  eSignatureExternalId: text('e_signature_external_id'),
  eSignatureStatus: text('e_signature_status'),
  prefilledData: jsonb('prefilled_data'),
  formSchema: jsonb('form_schema'),
  submittedData: jsonb('submitted_data'),
  fileStorageRef: text('file_storage_ref'),
  originalFilename: text('original_filename'),
  fileMimeType: text('file_mime_type'),
  fileSizeBytes: integer('file_size_bytes'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  reviewerId: uuid('reviewer_id').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  resubmissionCount: integer('resubmission_count').notNull().default(0),
  remindersSent: integer('reminders_sent').notNull().default(0),
  lastReminderAt: timestamp('last_reminder_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('doc_requests_workflow_idx').on(table.tenantId, table.workflowId),
  newHireIdx: index('doc_requests_new_hire_idx').on(table.tenantId, table.newHireId),
  statusIdx: index('doc_requests_status_idx').on(table.tenantId, table.status),
  typeIdx: index('doc_requests_type_idx').on(table.tenantId, table.documentType),
  dueDateIdx: index('doc_requests_due_date_idx').on(table.tenantId, table.dueDate),
}));
```

### provisioning_requests

```typescript
export const provisioningTypeEnum = pgEnum('provisioning_type', [
  'email_account', 'chat_account', 'repository_access', 'project_tool_access',
  'network_access', 'physical_access', 'software_license', 'hardware',
  'cloud_access', 'database_access', 'custom',
]);

export const provisioningStatusEnum = pgEnum('provisioning_status', [
  'requested', 'approved', 'in_progress', 'completed', 'failed', 'denied', 'cancelled',
]);

export const provisioningRequests = pgTable('provisioning_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  workflowId: uuid('workflow_id').notNull().references(() => onboardingWorkflows.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').references(() => onboardingTasks.id),
  newHireId: uuid('new_hire_id').notNull().references(() => users.id),
  provisioningType: provisioningTypeEnum('provisioning_type').notNull(),
  status: provisioningStatusEnum('status').notNull().default('requested'),
  priority: integer('priority').notNull().default(3),
  requestedForDate: date('requested_for_date').notNull(),
  systemName: text('system_name').notNull(),
  accessLevel: text('access_level'),
  groups: text('groups').array().notNull().default([]),
  permissions: text('permissions').array().notNull().default([]),
  equipmentSpecs: jsonb('equipment_specs'),
  licenseDetails: jsonb('license_details'),
  configuration: jsonb('configuration').notNull().default({}),
  externalTicketId: text('external_ticket_id'),
  externalReferenceUrl: text('external_reference_url'),
  fulfilledBy: uuid('fulfilled_by').references(() => users.id),
  fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
  provisionedDetails: jsonb('provisioned_details'),
  failureReason: text('failure_reason'),
  retryCount: integer('retry_count').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  denialReason: text('denial_reason'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  notes: text('notes'),
  metadata: jsonb('metadata').notNull().default({}),
  eventId: text('event_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('prov_requests_workflow_idx').on(table.tenantId, table.workflowId),
  newHireIdx: index('prov_requests_new_hire_idx').on(table.tenantId, table.newHireId),
  statusIdx: index('prov_requests_status_idx').on(table.tenantId, table.status),
  typeIdx: index('prov_requests_type_idx').on(table.tenantId, table.provisioningType),
  dateIdx: index('prov_requests_date_idx').on(table.tenantId, table.requestedForDate),
}));
```

### buddy_assignments

```typescript
export const buddyTypeEnum = pgEnum('buddy_type', ['buddy', 'mentor', 'onboarding_partner']);
export const buddySelectionMethodEnum = pgEnum('buddy_selection_method', ['automatic', 'manual', 'self_selected']);
export const buddyStatusEnum = pgEnum('buddy_status', ['pending', 'accepted', 'active', 'completed', 'declined', 'reassigned']);

export const buddyAssignments = pgTable('buddy_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  workflowId: uuid('workflow_id').notNull().references(() => onboardingWorkflows.id, { onDelete: 'cascade' }),
  newHireId: uuid('new_hire_id').notNull().references(() => users.id),
  buddyId: uuid('buddy_id').notNull().references(() => users.id),
  buddyName: text('buddy_name').notNull(),
  assignmentType: buddyTypeEnum('assignment_type').notNull().default('buddy'),
  selectionMethod: buddySelectionMethodEnum('selection_method').notNull().default('manual'),
  matchScore: integer('match_score'),
  matchCriteria: jsonb('match_criteria'),
  status: buddyStatusEnum('status').notNull().default('pending'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  introMeetingScheduled: boolean('intro_meeting_scheduled').notNull().default(false),
  introMeetingAt: timestamp('intro_meeting_at', { withTimezone: true }),
  introMeetingLocation: text('intro_meeting_location'),
  checkInFrequency: text('check_in_frequency').notNull().default('weekly'),
  checkInsCompleted: integer('check_ins_completed').notNull().default(0),
  lastCheckInAt: timestamp('last_check_in_at', { withTimezone: true }),
  buddyFeedback: text('buddy_feedback'),
  newHireFeedback: text('new_hire_feedback'),
  newHireRating: integer('new_hire_rating'),
  notes: text('notes'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('buddy_workflow_idx').on(table.tenantId, table.workflowId),
  newHireIdx: index('buddy_new_hire_idx').on(table.tenantId, table.newHireId),
  buddyIdx: index('buddy_buddy_idx').on(table.tenantId, table.buddyId),
  statusIdx: index('buddy_status_idx').on(table.tenantId, table.status),
}));
```

### onboarding_templates

```typescript
export const templateScopeEnum = pgEnum('template_scope', ['organization', 'venture', 'department', 'role']);
export const templateTypeEnum = pgEnum('template_type', ['onboarding', 'offboarding']);

export const onboardingTemplates = pgTable('onboarding_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  scopeLevel: templateScopeEnum('scope_level').notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  departmentId: uuid('department_id').references(() => departments.id),
  roleTitle: text('role_title'),
  parentTemplateId: uuid('parent_template_id').references(() => onboardingTemplates.id),
  isActive: boolean('is_active').notNull().default(true),
  isDefault: boolean('is_default').notNull().default(false),
  version: integer('version').notNull().default(1),
  templateType: templateTypeEnum('template_type').notNull().default('onboarding'),
  expectedDurationDays: integer('expected_duration_days').notNull().default(90),
  taskDefinitions: jsonb('task_definitions').notNull().default([]),
  documentRequirements: jsonb('document_requirements').notNull().default([]),
  provisioningRequirements: jsonb('provisioning_requirements').notNull().default([]),
  welcomeEmailTemplate: jsonb('welcome_email_template'),
  buddyConfig: jsonb('buddy_config'),
  trainingCourseIds: uuid('training_course_ids').array().notNull().default([]),
  tags: text('tags').array().notNull().default([]),
  metadata: jsonb('metadata').notNull().default({}),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('templates_tenant_idx').on(table.tenantId),
  scopeIdx: index('templates_scope_idx').on(table.tenantId, table.scopeLevel),
  ventureIdx: index('templates_venture_idx').on(table.tenantId, table.ventureId),
  deptIdx: index('templates_dept_idx').on(table.tenantId, table.departmentId),
  typeIdx: index('templates_type_idx').on(table.tenantId, table.templateType),
  activeIdx: index('templates_active_idx').on(table.tenantId, table.isActive),
  defaultIdx: index('templates_default_idx').on(table.tenantId, table.isDefault, table.scopeLevel),
}));
```

### offboarding_workflows

```typescript
export const offboardingStatusEnum = pgEnum('offboarding_status', [
  'initiated', 'in_progress', 'knowledge_transfer', 'access_revocation',
  'equipment_return', 'exit_interview', 'completed', 'cancelled',
]);

export const offboardingReasonEnum = pgEnum('offboarding_reason', [
  'resignation', 'termination', 'layoff', 'retirement',
  'contract_end', 'mutual_agreement', 'transfer', 'other',
]);

export const offboardingWorkflows = pgTable('offboarding_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  employeeId: uuid('employee_id').notNull().references(() => users.id),
  employeeName: text('employee_name').notNull(),
  employeeEmail: text('employee_email').notNull(),
  templateId: uuid('template_id').references(() => onboardingTemplates.id),
  managerId: uuid('manager_id').notNull().references(() => users.id),
  hrRepresentativeId: uuid('hr_representative_id').references(() => users.id),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  roleTitle: text('role_title').notNull(),
  reason: offboardingReasonEnum('reason').notNull(),
  reasonDetails: text('reason_details'),
  isVoluntary: boolean('is_voluntary').notNull().default(true),
  lastWorkingDay: date('last_working_day').notNull(),
  noticePeriodStart: date('notice_period_start'),
  status: offboardingStatusEnum('status').notNull().default('initiated'),
  completionPercentage: integer('completion_percentage').notNull().default(0),
  accessRevocation: jsonb('access_revocation').notNull().default({
    totalSystems: 0, revokedSystems: 0, pendingSystems: [], completedAt: null,
  }),
  equipmentReturn: jsonb('equipment_return').notNull().default({
    totalItems: 0, returnedItems: 0, pendingItems: [], completedAt: null,
  }),
  knowledgeTransfer: jsonb('knowledge_transfer').notNull().default({
    documentsCreated: 0, handoffMeetingsCompleted: 0, successorId: null, successorName: null, completedAt: null,
  }),
  exitInterview: jsonb('exit_interview').notNull().default({
    scheduled: false, scheduledAt: null, conductedBy: null, completed: false,
    completedAt: null, feedbackSummary: null, overallRating: null,
    wouldRecommend: null, reasonsForLeaving: [], improvementSuggestions: null,
  }),
  finalSettlement: jsonb('final_settlement').notNull().default({
    lastPaycheckDate: null, unusedPtoDays: null, benefitsEndDate: null,
    cobraEligible: null, cobraNotificationSent: false,
  }),
  rehireEligible: boolean('rehire_eligible'),
  notes: text('notes'),
  metadata: jsonb('metadata').notNull().default({}),
  initiatedBy: uuid('initiated_by').notNull().references(() => users.id),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('offboarding_tenant_idx').on(table.tenantId),
  employeeIdx: index('offboarding_employee_idx').on(table.tenantId, table.employeeId),
  statusIdx: index('offboarding_status_idx').on(table.tenantId, table.status),
  ventureIdx: index('offboarding_venture_idx').on(table.tenantId, table.ventureId),
  lastDayIdx: index('offboarding_last_day_idx').on(table.tenantId, table.lastWorkingDay),
  reasonIdx: index('offboarding_reason_idx').on(table.tenantId, table.reason),
}));
```

### onboarding_progress

```typescript
export const snapshotTypeEnum = pgEnum('snapshot_type', ['daily', 'milestone', 'phase_change', 'completion']);
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high', 'critical']);

export const onboardingProgress = pgTable('onboarding_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  workflowId: uuid('workflow_id').notNull().references(() => onboardingWorkflows.id, { onDelete: 'cascade' }),
  newHireId: uuid('new_hire_id').notNull().references(() => users.id),
  snapshotDate: date('snapshot_date').notNull(),
  snapshotType: snapshotTypeEnum('snapshot_type').notNull(),
  currentPhase: text('current_phase').notNull(),
  completionPercentage: integer('completion_percentage').notNull(),
  taskBreakdown: jsonb('task_breakdown').notNull(),
  categoryBreakdown: jsonb('category_breakdown').notNull(),
  documentProgress: jsonb('document_progress').notNull(),
  provisioningProgress: jsonb('provisioning_progress').notNull(),
  trainingProgress: jsonb('training_progress').notNull(),
  daysSinceStart: integer('days_since_start').notNull(),
  daysUntilExpectedCompletion: integer('days_until_expected_completion').notNull(),
  isOnTrack: boolean('is_on_track').notNull(),
  riskLevel: riskLevelEnum('risk_level').notNull().default('low'),
  riskFactors: text('risk_factors').array().notNull().default([]),
  satisfactionScore: integer('satisfaction_score'),
  engagementScore: integer('engagement_score'),
  notes: text('notes'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('progress_workflow_idx').on(table.tenantId, table.workflowId),
  dateIdx: index('progress_date_idx').on(table.tenantId, table.snapshotDate),
  typeIdx: index('progress_type_idx').on(table.tenantId, table.snapshotType),
  riskIdx: index('progress_risk_idx').on(table.tenantId, table.riskLevel),
}));
```

### Row-Level Security

```sql
-- All onboarding tables follow the same RLS pattern.
-- Users see data from their own tenant only.
-- Additional policies restrict visibility based on role.

-- Example: onboarding_workflows
ALTER TABLE onboarding_workflows ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: users can only see workflows in their tenant
CREATE POLICY tenant_isolation ON onboarding_workflows
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- HR can see all workflows in their venture
CREATE POLICY hr_full_access ON onboarding_workflows
  FOR ALL
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = current_setting('app.user_id')::uuid
        AND ur.role IN ('hr_admin', 'hr_manager', 'people_admin')
        AND ur.tenant_id = current_setting('app.tenant_id')::uuid
    )
  );

-- Managers can see workflows for their direct reports
CREATE POLICY manager_access ON onboarding_workflows
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND hiring_manager_id = current_setting('app.user_id')::uuid
  );

-- New hires can see only their own workflow
CREATE POLICY new_hire_access ON onboarding_workflows
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND new_hire_id = current_setting('app.user_id')::uuid
  );

-- Task assignments: users can see tasks assigned to them
CREATE POLICY task_assignment_access ON onboarding_task_assignments
  FOR ALL
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND assignee_id = current_setting('app.user_id')::uuid
  );

-- Document requests: new hires can see and submit their own documents
CREATE POLICY document_new_hire_access ON document_requests
  FOR ALL
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND new_hire_id = current_setting('app.user_id')::uuid
  );

-- Buddy assignments: buddies and new hires can see their assignments
CREATE POLICY buddy_access ON buddy_assignments
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND (
      buddy_id = current_setting('app.user_id')::uuid
      OR new_hire_id = current_setting('app.user_id')::uuid
    )
  );
```

---

## Code Examples

### Example 1: Create an Onboarding Workflow from Template

```typescript
import { OnboardingService } from '@mcv/people/onboarding';
import { TRPCError } from '@trpc/server';

/**
 * Creates a full onboarding workflow from a resolved template.
 * This is typically triggered when HR confirms a new hire's start date.
 */
async function initiateOnboarding(ctx: Context) {
  const onboardingService = new OnboardingService(ctx.db, ctx.tenant);

  // Resolve the best matching template for this role/department/venture
  const template = await onboardingService.templateService.resolveTemplate(
    'venture_abc123',
    'dept_engineering',
    'Senior Software Engineer',
  );

  if (!template) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'No onboarding template found for this role configuration',
    });
  }

  // Create the workflow from the template
  const workflow = await onboardingService.createWorkflowFromTemplate(template.id, {
    newHireId: 'user_new_hire_001',
    newHireName: 'Jane Smith',
    newHireEmail: 'jane.smith@company.com',
    hiringManagerId: 'user_manager_001',
    hrRepresentativeId: 'user_hr_001',
    ventureId: 'venture_abc123',
    departmentId: 'dept_engineering',
    roleTitle: 'Senior Software Engineer',
    jobLevel: 'L5',
    employmentType: 'full_time',
    startDate: '2026-03-15',
    workLocation: 'hybrid',
    officeLocation: 'NYC - 5th Floor',
    metadata: {
      recruiterId: 'user_recruiter_001',
      offerAcceptedDate: '2026-02-01',
      requisitionId: 'req_20260115_001',
    },
  });

  console.log(`Onboarding workflow created: ${workflow.id}`);
  console.log(`Total tasks: ${workflow.totalTasks}`);
  console.log(`Start date: ${workflow.startDate}`);
  console.log(`Expected completion: ${workflow.expectedCompletionDate}`);

  return workflow;
}

// The createWorkflowFromTemplate method internally:
// 1. Resolves template inheritance (org → venture → dept → role)
// 2. Merges task definitions from all template levels
// 3. Creates OnboardingTask records with resolved due dates
// 4. Resolves assignee placeholders to actual user IDs
// 5. Creates DocumentRequest records from document requirements
// 6. Creates ProvisioningRequest records from provisioning requirements
// 7. Creates PreboardingPackage
// 8. Sets up BuddyAssignment (if configured)
// 9. Publishes OnboardingStartedEvent
// 10. Sends initial notifications
```

### Example 2: Manage Onboarding Tasks

```typescript
import { OnboardingService, TaskStatus, TaskCategory } from '@mcv/people/onboarding';

/**
 * Demonstrates task management operations within an onboarding workflow.
 */
async function manageOnboardingTasks(ctx: Context, workflowId: string) {
  const onboardingService = new OnboardingService(ctx.db, ctx.tenant);

  // List all tasks for a workflow, filtered by phase
  const firstWeekTasks = await onboardingService.listTasks(workflowId, {
    phase: 'first_week',
    status: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
    sortBy: 'sortOrder',
    sortDirection: 'asc',
  });

  console.log(`First week tasks: ${firstWeekTasks.length}`);

  // Get tasks assigned to the current user
  const myTasks = await onboardingService.getMyTasks({
    status: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
    category: TaskCategory.IT_PROVISIONING,
  });

  for (const assignment of myTasks) {
    console.log(`Task: ${assignment.taskId} - Status: ${assignment.status}`);
  }

  // Acknowledge a task (confirms the assignee has seen it)
  await onboardingService.acknowledgeTask('assignment_001');

  // Complete a task with notes
  const completedTask = await onboardingService.completeTask('task_setup_laptop', {
    completionNotes: 'MacBook Pro 14" configured with standard dev tools. Asset tag: MBP-2026-0342',
    actualDurationMinutes: 120,
    metadata: {
      assetTag: 'MBP-2026-0342',
      serialNumber: 'C02XR1YZJGH5',
      imageVersion: 'eng-dev-v3.2',
    },
  });

  console.log(`Task completed: ${completedTask.title} at ${completedTask.completedAt}`);

  // Skip an optional task with reason
  await onboardingService.skipTask('task_parking_pass', 'Remote employee - no parking needed');

  // Add a custom task to the workflow
  const customTask = await onboardingService.addTask(workflowId, {
    title: 'Set up dual monitor configuration',
    description: 'Configure dual 27" monitors with ergonomic stand per employee request',
    category: TaskCategory.EQUIPMENT,
    phase: 'day_one',
    priority: 2,
    relativeDueDay: 1,
    assigneeRole: 'it_team',
    isMandatory: false,
    estimatedDurationMinutes: 30,
  });

  // Reassign a task to a different person
  await onboardingService.reassignTask('task_badge_setup', 'user_facilities_backup_001');

  // Bulk update tasks
  const overdueTasks = await onboardingService.listTasks(workflowId, {
    status: [TaskStatus.OVERDUE],
  });

  if (overdueTasks.length > 0) {
    // Mark overdue tasks as in-progress with escalation
    await onboardingService.bulkUpdateTaskStatus(
      overdueTasks.map(t => t.id),
      TaskStatus.IN_PROGRESS,
    );
  }
}
```

### Example 3: Pre-boarding Automation

```typescript
import { PreboardingService, DocumentCollectionService } from '@mcv/people/onboarding';

/**
 * Sets up and manages pre-boarding for a new hire.
 * Typically runs automatically after workflow creation.
 */
async function setupPreboarding(ctx: Context, workflowId: string) {
  const preboardingService = new PreboardingService(ctx.db, ctx.tenant);
  const documentService = new DocumentCollectionService(ctx.db, ctx.tenant);

  // Get or create the pre-boarding package
  const package_ = await preboardingService.getPackageByWorkflow(workflowId);

  // Send the welcome email
  await preboardingService.sendWelcomeEmail(package_.id);
  console.log('Welcome email sent');

  // Set up the Day 1 schedule
  await preboardingService.updateDayOneSchedule(package_.id, {
    arrivalTime: '09:00',
    arrivalLocation: 'Main Lobby, 123 Tech Street, NYC',
    contactPerson: 'Sarah Johnson (HR)',
    contactPhone: '+1-555-0123',
    dressCode: 'Business casual',
    specialInstructions: 'Ask for visitor badge at reception. Sarah will meet you.',
  });

  // Check document collection status
  const documents = await documentService.listRequests(workflowId);

  for (const doc of documents) {
    console.log(`${doc.documentType}: ${doc.status}`);

    // Send reminders for pending documents approaching deadline
    if (doc.status === 'sent' && isApproachingDeadline(doc.dueDate, 3)) {
      await documentService.sendReminder(doc.id);
    }
  }

  // Get the overall pre-boarding checklist
  const checklist = await preboardingService.getPreboardingChecklist(package_.id);
  console.log(`Pre-boarding completion: ${checklist.completionPercentage}%`);
  console.log('Outstanding items:');
  for (const item of checklist.items.filter(i => !i.completed)) {
    console.log(`  - ${item.name} (due: ${item.dueDate})`);
  }

  // Track welcome kit delivery
  await preboardingService.trackWelcomeKit(
    package_.id,
    'shipped',
    'FEDEX-1234567890',
  );

  // Send first-day instructions (typically 2-3 days before start)
  await preboardingService.sendFirstDayInstructions(package_.id);
}

function isApproachingDeadline(dueDate: string, daysThreshold: number): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold && diffDays > 0;
}
```

### Example 4: IT Provisioning via Redpanda Events

```typescript
import {
  ProvisioningService,
  ProvisioningStatus,
  ProvisioningType,
  ProvisioningRequestedEvent,
  ProvisioningCompletedEvent,
} from '@mcv/people/onboarding';
import { RedpandaProducer, RedpandaConsumer } from '@mcv/events';

/**
 * Demonstrates IT provisioning request creation and event-driven fulfillment.
 */
async function handleProvisioning(ctx: Context) {
  const provisioningService = new ProvisioningService(ctx.db, ctx.tenant);
  const producer = new RedpandaProducer(ctx.redpanda);

  // Create provisioning requests for a new hire
  const requests = await provisioningService.createBulkRequests('workflow_001', [
    {
      provisioningType: ProvisioningType.EMAIL_ACCOUNT,
      systemName: 'Google Workspace',
      defaultAccessLevel: 'standard',
      defaultGroups: ['engineering@company.com', 'all-hands@company.com'],
      defaultPermissions: ['drive', 'calendar', 'meet'],
      configuration: {
        orgUnit: '/Engineering',
        aliases: ['j.smith@company.com'],
      },
      priority: 1,
      leadTimeDays: 3,
      requiresApproval: false,
      approverRole: null,
    },
    {
      provisioningType: ProvisioningType.REPOSITORY_ACCESS,
      systemName: 'GitHub',
      defaultAccessLevel: 'write',
      defaultGroups: ['engineering-team', 'backend-team'],
      defaultPermissions: ['repo:write', 'packages:read'],
      configuration: {
        organization: 'company-org',
        teams: ['engineering', 'backend'],
      },
      priority: 2,
      leadTimeDays: 1,
      requiresApproval: false,
      approverRole: null,
    },
    {
      provisioningType: ProvisioningType.HARDWARE,
      systemName: 'IT Asset Management',
      defaultAccessLevel: null,
      defaultGroups: [],
      defaultPermissions: [],
      equipmentSpecs: {
        type: 'laptop',
        model: 'MacBook Pro 14"',
        specifications: {
          processor: 'M3 Pro',
          ram: '36GB',
          storage: '1TB SSD',
          color: 'Space Black',
        },
      },
      configuration: {
        mdmProfile: 'engineering-standard',
        softwareBundle: 'eng-dev-tools',
      },
      priority: 1,
      leadTimeDays: 7,
      requiresApproval: true,
      approverRole: 'hiring_manager' as any,
    },
  ]);

  // Each request is published to Redpanda for async fulfillment
  for (const request of requests) {
    await provisioningService.publishProvisioningEvent(request);
    console.log(`Published provisioning event for ${request.systemName}: ${request.eventId}`);
  }

  // Check overall provisioning status
  const status = await provisioningService.getProvisioningStatus('workflow_001');
  console.log(`Provisioning: ${status.completed}/${status.total} completed`);
  console.log(`Pending: ${status.pending.map(p => p.systemName).join(', ')}`);
}

/**
 * Consumer that listens for provisioning completion events
 * from downstream systems and updates request status.
 */
async function setupProvisioningConsumer(ctx: Context) {
  const provisioningService = new ProvisioningService(ctx.db, ctx.tenant);
  const consumer = new RedpandaConsumer(ctx.redpanda, {
    groupId: 'onboarding-provisioning-handler',
    topics: ['onboarding.provisioning.completed', 'onboarding.provisioning.failed'],
  });

  await consumer.subscribe(async (event: ProvisioningCompletedEvent) => {
    if (event.type === 'onboarding.provisioning.completed') {
      await provisioningService.fulfillRequest(event.payload.requestId, {
        accountName: event.payload.accountName,
        accountUrl: event.payload.accountUrl,
        credentials: event.payload.credentials, // Encrypted
        additionalDetails: event.payload.details,
      });

      console.log(`Provisioning fulfilled: ${event.payload.requestId}`);
    } else if (event.type === 'onboarding.provisioning.failed') {
      const request = await provisioningService.failRequest(
        event.payload.requestId,
        event.payload.reason,
      );

      // Auto-retry if under max retries
      if (request.retryCount < request.maxRetries) {
        await provisioningService.retryRequest(request.id);
        console.log(`Retrying provisioning: ${request.id} (attempt ${request.retryCount + 1})`);
      } else {
        console.error(`Provisioning permanently failed: ${request.id} - ${event.payload.reason}`);
        // Escalate to IT admin
      }
    }
  });
}
```

### Example 5: Document Collection with E-Signature

```typescript
import {
  DocumentCollectionService,
  DocumentType,
  DocumentRequestStatus,
} from '@mcv/people/onboarding';

/**
 * Manages document collection for a new hire, including
 * digital forms and e-signature workflows.
 */
async function handleDocumentCollection(ctx: Context, workflowId: string) {
  const documentService = new DocumentCollectionService(ctx.db, ctx.tenant);

  // Create document requests (usually done automatically from template)
  const w4Request = await documentService.createRequest({
    workflowId,
    newHireId: 'user_new_hire_001',
    documentType: DocumentType.TAX_FORM,
    description: 'Federal W-4 Employee Withholding Certificate',
    isRequired: true,
    dueDate: '2026-03-14', // Day before start
    requiresESignature: false,
    formSchema: {
      type: 'object',
      properties: {
        filingStatus: {
          type: 'string',
          enum: ['single', 'married_filing_jointly', 'head_of_household'],
          title: 'Filing Status',
        },
        multipleJobs: { type: 'boolean', title: 'Multiple Jobs or Spouse Works' },
        dependentsAmount: { type: 'number', title: 'Dependents Amount ($)' },
        otherAdjustments: {
          type: 'object',
          properties: {
            otherIncome: { type: 'number', title: 'Other Income' },
            deductions: { type: 'number', title: 'Deductions' },
            extraWithholding: { type: 'number', title: 'Extra Withholding per Period' },
          },
        },
      },
      required: ['filingStatus'],
    },
    prefilledData: {
      employeeName: 'Jane Smith',
      ssn: '***-**-1234', // Masked; actual data via secure channel
      address: '123 Main St, New York, NY 10001',
    },
  });

  // Create an NDA request with e-signature
  const ndaRequest = await documentService.createRequest({
    workflowId,
    newHireId: 'user_new_hire_001',
    documentType: DocumentType.NDA,
    description: 'Non-Disclosure Agreement',
    isRequired: true,
    dueDate: '2026-03-14',
    requiresESignature: true,
  });

  // Trigger e-signature flow (integrates with DocuSign/HelloSign)
  await documentService.requestESignature(ndaRequest.id);
  console.log(`E-signature request sent for NDA: ${ndaRequest.eSignatureExternalId}`);

  // Handle document submission (from new hire portal)
  const submittedDoc = await documentService.submitDocument(w4Request.id, {
    submittedData: {
      filingStatus: 'single',
      multipleJobs: false,
      dependentsAmount: 0,
      otherAdjustments: {
        otherIncome: 0,
        deductions: 0,
        extraWithholding: 50,
      },
    },
    // Or file upload:
    // fileStorageRef: 'uploads/onboarding/w4_jane_smith.pdf',
    // originalFilename: 'W-4_JaneSmith_2026.pdf',
    // fileMimeType: 'application/pdf',
    // fileSizeBytes: 245760,
  });

  console.log(`Document submitted: ${submittedDoc.documentType} - ${submittedDoc.status}`);

  // HR reviews and approves the document
  await documentService.approveDocument(w4Request.id, ctx.userId);

  // Or reject with reason
  // await documentService.rejectDocument(w4Request.id, 'Filing status not selected. Please complete Step 1.');

  // Handle e-signature webhook from DocuSign
  // This is called by the webhook handler when DocuSign sends a callback
  await documentService.handleESignatureWebhook({
    provider: 'docusign',
    envelopeId: 'envelope_abc123',
    event: 'completed',
    signedAt: '2026-03-10T14:30:00Z',
    signerEmail: 'jane.smith@company.com',
    documentUrl: 'https://docusign.com/documents/envelope_abc123',
  });

  // Check overall collection status
  const collectionStatus = await documentService.getCollectionStatus(workflowId);
  console.log(`Documents: ${collectionStatus.approved}/${collectionStatus.total} approved`);
  console.log(`Pending: ${collectionStatus.pending} | Rejected: ${collectionStatus.rejected}`);
}
```

### Example 6: Buddy/Mentor Assignment

```typescript
import { BuddyAssignmentService } from '@mcv/people/onboarding';

/**
 * Demonstrates automatic buddy matching and assignment management.
 */
async function manageBuddyAssignment(ctx: Context, workflowId: string) {
  const buddyService = new BuddyAssignmentService(ctx.db, ctx.tenant);

  // Find potential buddy matches using the matching algorithm
  const candidates = await buddyService.findMatch(workflowId, {
    preferSameDepartment: true,
    preferSameLocation: true,
    preferSimilarRole: true,
    minimumTenureMonths: 6,
    maxActiveBuddyAssignments: 2,
  });

  console.log('Top buddy candidates:');
  for (const candidate of candidates.slice(0, 5)) {
    console.log(`  ${candidate.name} (score: ${candidate.matchScore})`);
    console.log(`    Department match: ${candidate.sameDepartment}`);
    console.log(`    Location match: ${candidate.sameLocation}`);
    console.log(`    Tenure: ${candidate.tenureMonths} months`);
    console.log(`    Active buddy assignments: ${candidate.activeBuddyCount}`);
  }

  // Assign the top-scoring buddy
  const topCandidate = candidates[0];
  const assignment = await buddyService.createAssignment({
    workflowId,
    newHireId: 'user_new_hire_001',
    buddyId: topCandidate.userId,
    assignmentType: 'buddy',
    selectionMethod: 'automatic',
    matchScore: topCandidate.matchScore,
    startDate: '2026-03-15', // Same as start date
    endDate: '2026-06-15',   // 90-day buddy period
    checkInFrequency: 'weekly',
  });

  console.log(`Buddy assigned: ${assignment.buddyName} (score: ${assignment.matchScore})`);

  // Schedule the intro meeting
  await buddyService.scheduleIntroMeeting(assignment.id, {
    dateTime: '2026-03-15T10:00:00Z',
    location: 'https://meet.google.com/abc-defg-hij',
    notes: 'Casual intro - get to know each other, answer any questions',
  });

  // Buddy accepts the assignment
  await buddyService.acceptAssignment(assignment.id);

  // Record weekly check-ins
  await buddyService.recordCheckIn(assignment.id, 
    'First week check-in: Jane is settling in well. Helped with office navigation and introduced to key team members.'
  );

  // At the end of the buddy period, submit feedback
  await buddyService.submitFeedback(assignment.id, {
    fromBuddy: {
      feedback: 'Jane was enthusiastic and quick to learn. Great questions about team culture.',
      wouldBuddyAgain: true,
    },
    fromNewHire: {
      feedback: 'Alex was incredibly helpful. Made my first weeks so much smoother.',
      rating: 5,
    },
  });

  // Complete the assignment
  await buddyService.completeAssignment(assignment.id);

  // View buddy leaderboard (gamification)
  const leaderboard = await buddyService.getBuddyLeaderboard('venture_abc123');
  console.log('\nBuddy Leaderboard:');
  for (const entry of leaderboard.slice(0, 10)) {
    console.log(`  ${entry.rank}. ${entry.name} — ${entry.totalAssignments} buddies, avg rating: ${entry.averageRating}`);
  }
}
```

### Example 7: Offboarding Workflow

```typescript
import {
  OffboardingService,
  OffboardingStatus,
  OffboardingReason,
  ProvisioningService,
} from '@mcv/people/onboarding';

/**
 * Demonstrates the full offboarding lifecycle — from initiation
 * through access revocation, equipment return, and exit interview.
 */
async function handleOffboarding(ctx: Context) {
  const offboardingService = new OffboardingService(ctx.db, ctx.tenant);
  const provisioningService = new ProvisioningService(ctx.db, ctx.tenant);

  // Initiate offboarding
  const workflow = await offboardingService.initiateOffboarding({
    employeeId: 'user_departing_001',
    employeeName: 'John Doe',
    employeeEmail: 'john.doe@company.com',
    ventureId: 'venture_abc123',
    departmentId: 'dept_engineering',
    roleTitle: 'Software Engineer',
    managerId: 'user_manager_001',
    hrRepresentativeId: 'user_hr_001',
    reason: OffboardingReason.RESIGNATION,
    reasonDetails: 'Accepted a position at another company',
    isVoluntary: true,
    lastWorkingDay: '2026-04-15',
    noticePeriodStart: '2026-03-15',
  });

  console.log(`Offboarding initiated: ${workflow.id}`);

  // Assign a successor for knowledge transfer
  await offboardingService.assignSuccessor(workflow.id, 'user_successor_001');

  // Record knowledge transfer activities
  await offboardingService.recordKnowledgeTransfer(workflow.id, {
    type: 'document',
    title: 'Service Architecture Documentation',
    description: 'Updated docs for payment processing service architecture and runbooks',
  });

  await offboardingService.recordKnowledgeTransfer(workflow.id, {
    type: 'meeting',
    title: 'Handoff Meeting - Payment Service',
    description: 'Walkthrough of payment processing codebase, deployment procedures, and on-call playbook',
    attendees: ['user_successor_001', 'user_manager_001'],
  });

  // Revoke system access progressively
  const systemsToRevoke = [
    'Google Workspace',
    'GitHub',
    'Slack',
    'AWS Console',
    'Jira',
    'Confluence',
    'VPN',
  ];

  // On last day: revoke all access
  for (const system of systemsToRevoke) {
    await offboardingService.revokeSystemAccess(workflow.id, system);
  }

  // Or revoke all at once
  // await offboardingService.revokeAllAccess(workflow.id);

  // Also revoke provisioning-level access
  await provisioningService.revokeAccess('user_departing_001', systemsToRevoke);

  // Track equipment return
  await offboardingService.trackEquipmentReturn(workflow.id, 'MacBook Pro 14" (MBP-2025-0123)', 'returned');
  await offboardingService.trackEquipmentReturn(workflow.id, 'Monitor - Dell 27" (MON-2025-0456)', 'returned');
  await offboardingService.trackEquipmentReturn(workflow.id, 'Access Badge (BADGE-0789)', 'returned');

  // Schedule exit interview
  await offboardingService.scheduleExitInterview(workflow.id, {
    scheduledAt: '2026-04-14T14:00:00Z',
    conductedBy: 'user_hr_001',
    format: 'in_person',
    location: 'HR Conference Room B',
  });

  // Record exit interview results
  await offboardingService.recordExitInterview(workflow.id, {
    overallRating: 4,
    wouldRecommend: true,
    reasonsForLeaving: [
      'Career growth opportunity',
      'Higher compensation',
    ],
    feedbackSummary: 'John had a positive experience overall. Appreciated the team culture and technical challenges. Felt there were limited senior IC growth paths.',
    improvementSuggestions: 'More clarity on IC career ladder beyond L5. Cross-team rotation opportunities.',
  });

  // Set rehire eligibility
  const completed = await offboardingService.completeOffboarding(workflow.id);

  console.log(`Offboarding completed: ${completed.id}`);
  console.log(`Access revoked: ${completed.accessRevocation.revokedSystems}/${completed.accessRevocation.totalSystems}`);
  console.log(`Equipment returned: ${completed.equipmentReturn.returnedItems}/${completed.equipmentReturn.totalItems}`);
  console.log(`Rehire eligible: ${completed.rehireEligible}`);
}
```

### Example 8: Onboarding Analytics Dashboard

```typescript
import { OnboardingAnalyticsService } from '@mcv/people/onboarding';

/**
 * Demonstrates analytics queries for onboarding effectiveness reporting.
 */
async function generateAnalyticsDashboard(ctx: Context) {
  const analyticsService = new OnboardingAnalyticsService(ctx.db, ctx.tenant);

  // Get the main dashboard data
  const dashboard = await analyticsService.getDashboardData('venture_abc123');

  console.log('=== Onboarding Dashboard ===');
  console.log(`Active onboardings: ${dashboard.activeCount}`);
  console.log(`Completed this month: ${dashboard.completedThisMonth}`);
  console.log(`Average completion time: ${dashboard.avgCompletionDays} days`);
  console.log(`Average satisfaction: ${dashboard.avgSatisfactionScore}/5`);
  console.log(`On-track rate: ${dashboard.onTrackRate}%`);

  // Time-to-productivity analysis
  const ttpReport = await analyticsService.getTimeToProductivity({
    ventureId: 'venture_abc123',
    dateRange: { start: '2025-01-01', end: '2026-01-31' },
    groupBy: 'department',
  });

  console.log('\n=== Time to Productivity by Department ===');
  for (const dept of ttpReport.departments) {
    console.log(`${dept.name}: ${dept.avgDays} days (target: ${dept.targetDays})`);
    console.log(`  Trend: ${dept.trend > 0 ? '↑' : '↓'} ${Math.abs(dept.trend)}% vs last quarter`);
  }

  // Completion rate analysis
  const completionReport = await analyticsService.getCompletionRates({
    ventureId: 'venture_abc123',
    dateRange: { start: '2025-01-01', end: '2026-01-31' },
  });

  console.log('\n=== Completion Rates ===');
  console.log(`Overall: ${completionReport.overallRate}%`);
  console.log(`By phase:`);
  for (const phase of completionReport.byPhase) {
    console.log(`  ${phase.name}: ${phase.onTimeRate}% on-time`);
  }

  // Task bottleneck identification
  const bottlenecks = await analyticsService.getTaskBottlenecks({
    ventureId: 'venture_abc123',
    dateRange: { start: '2025-07-01', end: '2026-01-31' },
    limit: 10,
  });

  console.log('\n=== Top 10 Task Bottlenecks ===');
  for (const task of bottlenecks.tasks) {
    console.log(`${task.title}`);
    console.log(`  Category: ${task.category}`);
    console.log(`  Avg delay: ${task.avgDelayDays} days`);
    console.log(`  Overdue rate: ${task.overdueRate}%`);
    console.log(`  Assigned to: ${task.primaryAssigneeRole}`);
    console.log(`  Suggestion: ${task.improvementSuggestion}`);
  }

  // Satisfaction scores
  const satisfaction = await analyticsService.getSatisfactionScores({
    ventureId: 'venture_abc123',
    dateRange: { start: '2025-01-01', end: '2026-01-31' },
    groupBy: 'month',
  });

  console.log('\n=== Monthly Satisfaction Scores ===');
  for (const month of satisfaction.monthly) {
    console.log(`${month.month}: ${month.avgScore}/5 (${month.responseCount} responses)`);
    const bar = '█'.repeat(Math.round(month.avgScore * 4));
    console.log(`  ${bar}`);
  }

  // Provisioning efficiency
  const provMetrics = await analyticsService.getProvisioningMetrics({
    ventureId: 'venture_abc123',
    dateRange: { start: '2025-07-01', end: '2026-01-31' },
  });

  console.log('\n=== Provisioning Metrics ===');
  console.log(`Avg fulfillment time: ${provMetrics.avgFulfillmentHours} hours`);
  console.log(`Day-1 readiness rate: ${provMetrics.dayOneReadinessRate}%`);
  console.log(`Failure rate: ${provMetrics.failureRate}%`);
  console.log('By system:');
  for (const system of provMetrics.bySystem) {
    console.log(`  ${system.name}: ${system.avgFulfillmentHours}h avg, ${system.successRate}% success`);
  }

  // Get active onboarding summaries for HR dashboard
  const activeOnboardings = await analyticsService.getActiveOnboardings('venture_abc123');
  console.log(`\n=== Active Onboardings (${activeOnboardings.length}) ===`);
  for (const ob of activeOnboardings) {
    const riskEmoji = { low: '🟢', medium: '🟡', high: '🟠', critical: '🔴' }[ob.riskLevel];
    console.log(`${riskEmoji} ${ob.newHireName} — ${ob.roleTitle}`);
    console.log(`   Progress: ${ob.completionPercentage}% | Day ${ob.daysSinceStart} | ${ob.overdueTasks} overdue`);
  }

  // Export report
  const reportUrl = await analyticsService.exportReport(
    { ventureId: 'venture_abc123', dateRange: { start: '2025-01-01', end: '2026-01-31' } },
    'pdf',
  );
  console.log(`\nReport exported: ${reportUrl}`);
}
```

---

## Error Codes

| Code | Name | HTTP | Description | Resolution |
|------|------|------|-------------|------------|
| `ONBOARDING_001` | `WORKFLOW_NOT_FOUND` | 404 | Onboarding workflow does not exist or is not accessible | Verify workflow ID and ensure user has access permissions |
| `ONBOARDING_002` | `WORKFLOW_ALREADY_COMPLETED` | 409 | Cannot modify a completed workflow | Create a new workflow if re-onboarding is needed |
| `ONBOARDING_003` | `WORKFLOW_CANCELLED` | 409 | Cannot modify a cancelled workflow | Restore or create a new workflow |
| `ONBOARDING_004` | `TASK_NOT_FOUND` | 404 | Onboarding task does not exist | Verify task ID belongs to the correct workflow |
| `ONBOARDING_005` | `TASK_ALREADY_COMPLETED` | 409 | Task has already been completed | No action needed; task is done |
| `ONBOARDING_006` | `TASK_BLOCKED` | 409 | Task cannot be started due to unmet dependencies | Complete dependent tasks first |
| `ONBOARDING_007` | `TASK_NOT_ASSIGNED` | 403 | Current user is not assigned to this task | Request assignment or contact HR |
| `ONBOARDING_008` | `INVALID_STATUS_TRANSITION` | 422 | The requested status change is not valid | Check the allowed status transitions for the current state |
| `ONBOARDING_009` | `TEMPLATE_NOT_FOUND` | 404 | Onboarding template does not exist | Verify template ID or create a new template |
| `ONBOARDING_010` | `TEMPLATE_INACTIVE` | 409 | Template is inactive and cannot be used | Activate the template or use an alternative |
| `ONBOARDING_011` | `TEMPLATE_CIRCULAR_INHERITANCE` | 422 | Template inheritance creates a circular reference | Review parent template chain and remove cycles |
| `ONBOARDING_012` | `DUPLICATE_TEMPLATE_DEFAULT` | 409 | Another default template exists for this scope | Unset the existing default before setting a new one |
| `ONBOARDING_013` | `DOCUMENT_REQUEST_NOT_FOUND` | 404 | Document request does not exist | Verify document request ID |
| `ONBOARDING_014` | `DOCUMENT_ALREADY_APPROVED` | 409 | Document has already been approved | No action needed |
| `ONBOARDING_015` | `DOCUMENT_UPLOAD_FAILED` | 500 | Failed to upload document to storage | Retry upload; check file size and format |
| `ONBOARDING_016` | `ESIGNATURE_PROVIDER_ERROR` | 502 | E-signature provider returned an error | Check provider status; retry or use alternative signing method |
| `ONBOARDING_017` | `PROVISIONING_REQUEST_NOT_FOUND` | 404 | Provisioning request does not exist | Verify request ID |
| `ONBOARDING_018` | `PROVISIONING_ALREADY_FULFILLED` | 409 | Provisioning request has already been fulfilled | No action needed |
| `ONBOARDING_019` | `PROVISIONING_MAX_RETRIES` | 422 | Maximum retry count reached for provisioning | Manual intervention required; contact IT |
| `ONBOARDING_020` | `PROVISIONING_EVENT_PUBLISH_FAILED` | 500 | Failed to publish provisioning event to Redpanda | Check Redpanda cluster health; retry |
| `ONBOARDING_021` | `BUDDY_NOT_FOUND` | 404 | Buddy assignment does not exist | Verify assignment ID |
| `ONBOARDING_022` | `BUDDY_NOT_AVAILABLE` | 409 | Selected buddy has too many active assignments | Choose a different buddy or wait for capacity |
| `ONBOARDING_023` | `BUDDY_SELF_ASSIGNMENT` | 422 | Cannot assign someone as their own buddy | Select a different person |
| `ONBOARDING_024` | `OFFBOARDING_NOT_FOUND` | 404 | Offboarding workflow does not exist | Verify workflow ID |
| `ONBOARDING_025` | `OFFBOARDING_ALREADY_COMPLETED` | 409 | Offboarding has already been completed | No further action needed |
| `ONBOARDING_026` | `OFFBOARDING_ACCESS_PENDING` | 422 | Cannot complete offboarding with pending access revocations | Revoke all system access before completing |
| `ONBOARDING_027` | `OFFBOARDING_EQUIPMENT_PENDING` | 422 | Cannot complete offboarding with unreturned equipment | Track all equipment returns or mark as exceptions |
| `ONBOARDING_028` | `INVALID_START_DATE` | 422 | Start date is in the past or too far in the future | Use a valid future start date within policy limits |
| `ONBOARDING_029` | `DUPLICATE_WORKFLOW` | 409 | An active onboarding workflow already exists for this employee | Complete or cancel the existing workflow first |
| `ONBOARDING_030` | `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions for this operation | Contact HR admin for access |
| `ONBOARDING_031` | `VENTURE_MISMATCH` | 403 | Workflow venture does not match user's venture access | Ensure user has cross-venture permissions |
| `ONBOARDING_032` | `TASK_VERIFICATION_REQUIRED` | 422 | Task requires verification before it can be marked complete | Submit for verification by the designated verifier |
| `ONBOARDING_033` | `ANALYTICS_DATE_RANGE_INVALID` | 422 | Invalid date range for analytics query | Ensure start date is before end date and range is ≤ 2 years |
| `ONBOARDING_034` | `TEMPLATE_VERSION_CONFLICT` | 409 | Template was modified by another user since last read | Refresh and retry with the latest version |
| `ONBOARDING_035` | `DOCUMENT_FILE_TOO_LARGE` | 413 | Uploaded file exceeds maximum size limit | Reduce file size or compress before uploading |
| `ONBOARDING_036` | `DOCUMENT_INVALID_FORMAT` | 422 | Uploaded file type is not accepted | Upload in an accepted format (PDF, PNG, JPG, DOCX) |

---

## Security

### Authentication & Authorization

All endpoints require authentication via Supabase Auth JWT tokens. Authorization is enforced at multiple levels:

```typescript
// Role-based access matrix
const accessMatrix = {
  // HR Admin: Full access to all onboarding/offboarding operations
  hr_admin: {
    workflows: ['create', 'read', 'update', 'delete', 'cancel'],
    tasks: ['create', 'read', 'update', 'delete', 'reassign', 'skip'],
    templates: ['create', 'read', 'update', 'delete'],
    documents: ['create', 'read', 'approve', 'reject'],
    provisioning: ['create', 'read', 'approve', 'deny', 'fulfill'],
    offboarding: ['create', 'read', 'update', 'complete'],
    analytics: ['read', 'export'],
    buddies: ['create', 'read', 'update', 'reassign'],
  },

  // HR Manager: Most operations except template management
  hr_manager: {
    workflows: ['create', 'read', 'update', 'cancel'],
    tasks: ['create', 'read', 'update', 'reassign'],
    templates: ['read'],
    documents: ['create', 'read', 'approve', 'reject'],
    provisioning: ['create', 'read', 'approve'],
    offboarding: ['create', 'read', 'update'],
    analytics: ['read'],
    buddies: ['create', 'read', 'update'],
  },

  // Hiring Manager: Manage their direct reports' onboarding
  hiring_manager: {
    workflows: ['read'],
    tasks: ['read', 'update'], // Only their assigned tasks
    templates: [],
    documents: ['read'],
    provisioning: ['read', 'approve'], // For their reports
    offboarding: ['read'],
    analytics: ['read'], // Limited to their department
    buddies: ['read'],
  },

  // New Hire: Self-service for their own onboarding
  new_hire: {
    workflows: ['read'], // Own workflow only
    tasks: ['read', 'update'], // Own tasks only
    templates: [],
    documents: ['read', 'submit'], // Own documents only
    provisioning: ['read'], // Own requests only
    offboarding: [],
    analytics: [],
    buddies: ['read'], // Own buddy assignment
  },

  // IT Team: Provisioning management
  it_team: {
    workflows: ['read'],
    tasks: ['read', 'update'], // IT tasks only
    templates: [],
    documents: [],
    provisioning: ['read', 'fulfill', 'fail'],
    offboarding: ['read'], // Access revocation tasks
    analytics: ['read'], // Provisioning metrics
    buddies: [],
  },

  // Buddy: View assigned new hire's relevant info
  buddy: {
    workflows: ['read'], // Limited view of assigned new hire
    tasks: ['read'], // Social/buddy tasks only
    templates: [],
    documents: [],
    provisioning: [],
    offboarding: [],
    analytics: [],
    buddies: ['read', 'update'], // Own assignment only
  },
};
```

### Data Protection

| Data Type | Classification | Protection |
|-----------|---------------|------------|
| SSN / Tax ID | PII - Critical | Encrypted at rest (AES-256), masked in UI, audit-logged access |
| Bank account details | PII - Critical | Encrypted at rest, never stored in plaintext, tokenized for display |
| Government ID copies | PII - Sensitive | Encrypted storage, auto-expiry, access-logged |
| Home address | PII - Standard | Encrypted at rest, visible only to HR and employee |
| Emergency contacts | PII - Standard | Encrypted at rest, visible to HR and employee |
| Salary information | Confidential | Encrypted, restricted to HR and finance roles |
| Performance feedback | Confidential | Encrypted, restricted to HR and direct manager |
| Exit interview data | Confidential | Anonymizable for aggregate reporting |
| E-signature documents | Legal | Tamper-evident storage, legal retention policies |
| Provisioning credentials | Secret | Encrypted in transit and at rest, one-time display, auto-rotate |

### Audit Trail

All onboarding operations are audit-logged:

```typescript
interface OnboardingAuditEntry {
  /** Unique audit entry ID */
  id: string;
  /** Tenant ID */
  tenantId: string;
  /** Timestamp */
  timestamp: string;
  /** Actor user ID */
  actorId: string;
  /** Actor role */
  actorRole: string;
  /** Action performed */
  action: string;
  /** Resource type */
  resourceType: 'workflow' | 'task' | 'document' | 'provisioning' | 'buddy' | 'offboarding' | 'template';
  /** Resource ID */
  resourceId: string;
  /** Changes made (before/after) */
  changes: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  /** IP address */
  ipAddress: string;
  /** User agent */
  userAgent: string;
  /** Additional context */
  metadata: Record<string, unknown>;
}
```

### Multi-Tenant Isolation

- **Database Level:** Row-Level Security (RLS) policies enforce tenant isolation on all tables
- **Application Level:** Tenant context is set via `app.tenant_id` session variable before every query
- **API Level:** tRPC middleware validates tenant membership and injects tenant context
- **Event Level:** Redpanda events include tenant ID; consumers filter by tenant
- **Storage Level:** Document uploads are stored in tenant-isolated storage paths

### Compliance Considerations

| Regulation | Requirement | Implementation |
|------------|-------------|----------------|
| GDPR | Right to erasure | Anonymization support for departed employees; document retention policies |
| GDPR | Data minimization | Collect only required documents; auto-delete after retention period |
| SOX | Audit trail | Full audit logging of all access and modifications |
| HIPAA | Protected health info | Benefits enrollment data encrypted; access restricted |
| I-9 / IRCA | Employment eligibility | Deadline tracking; Section 2 reminder automation |
| CCPA | Data access requests | Export all employee onboarding data on request |
| SOC 2 | Access controls | Role-based access; provisioning audit trail |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ONBOARDING_DB_URL` | Yes | — | PostgreSQL connection string for onboarding data |
| `ONBOARDING_REDPANDA_BROKERS` | Yes | — | Comma-separated list of Redpanda broker addresses |
| `ONBOARDING_REDPANDA_TOPIC_PREFIX` | No | `onboarding` | Prefix for Redpanda topic names |
| `ONBOARDING_ESIGNATURE_PROVIDER` | No | `docusign` | Default e-signature provider (`docusign`, `hellosign`, `adobe_sign`) |
| `ONBOARDING_DOCUSIGN_API_KEY` | Cond. | — | DocuSign API key (required if provider is `docusign`) |
| `ONBOARDING_DOCUSIGN_ACCOUNT_ID` | Cond. | — | DocuSign account ID |
| `ONBOARDING_DOCUSIGN_BASE_URL` | No | `https://demo.docusign.net` | DocuSign API base URL |
| `ONBOARDING_HELLOSIGN_API_KEY` | Cond. | — | HelloSign API key (required if provider is `hellosign`) |
| `ONBOARDING_STORAGE_BUCKET` | Yes | — | Supabase Storage bucket for document uploads |
| `ONBOARDING_STORAGE_MAX_FILE_SIZE_MB` | No | `25` | Maximum file upload size in MB |
| `ONBOARDING_ENCRYPTION_KEY` | Yes | — | AES-256 encryption key for PII data at rest |
| `ONBOARDING_WELCOME_EMAIL_FROM` | No | `hr@company.com` | Sender address for welcome emails |
| `ONBOARDING_PORTAL_BASE_URL` | Yes | — | Base URL for the new hire onboarding portal |
| `ONBOARDING_TASK_REMINDER_CRON` | No | `0 9 * * *` | Cron schedule for task reminder checks |
| `ONBOARDING_OVERDUE_CHECK_CRON` | No | `0 */4 * * *` | Cron schedule for overdue task detection |
| `ONBOARDING_PROGRESS_SNAPSHOT_CRON` | No | `0 0 * * *` | Cron schedule for daily progress snapshots |
| `ONBOARDING_BUDDY_MATCH_MIN_TENURE_MONTHS` | No | `6` | Minimum tenure for buddy eligibility |
| `ONBOARDING_BUDDY_MAX_ACTIVE` | No | `2` | Maximum concurrent buddy assignments per person |
| `ONBOARDING_DEFAULT_DURATION_DAYS` | No | `90` | Default onboarding duration in days |
| `ONBOARDING_PREBOARDING_LEAD_DAYS` | No | `14` | Days before start date to begin pre-boarding |
| `ONBOARDING_I9_DEADLINE_DAYS` | No | `3` | Days after start date for I-9 Section 2 completion |
| `ONBOARDING_OFFBOARDING_ACCESS_GRACE_HOURS` | No | `24` | Hours after last working day before mandatory access revocation |
| `ONBOARDING_ANALYTICS_RETENTION_MONTHS` | No | `36` | Months to retain detailed analytics data |
| `ONBOARDING_WEBHOOK_SECRET` | Cond. | — | Webhook signing secret for e-signature callbacks |
| `ONBOARDING_NOTIFICATION_CHANNEL` | No | `email` | Default notification channel (`email`, `slack`, `both`) |
| `ONBOARDING_SLACK_WEBHOOK_URL` | Cond. | — | Slack webhook URL (required if notification channel includes `slack`) |

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/db` | `^0.14.0` | Drizzle ORM schemas, database connection, shared tenant utilities |
| `@mcv/auth` | `^0.14.0` | Authentication, JWT validation, role-based access control |
| `@mcv/events` | `^0.14.0` | Redpanda producer/consumer for event-driven provisioning |
| `@mcv/people/core` | `^0.14.0` | Employee records, department structures, organizational hierarchy |
| `@mcv/people/directory` | `^0.14.0` | User lookup, team membership, manager relationships |
| `@mcv/notifications` | `^0.14.0` | Email, Slack, and in-app notification delivery |
| `@mcv/storage` | `^0.14.0` | Supabase Storage integration for document uploads |
| `@mcv/audit` | `^0.14.0` | Audit trail logging |
| `@mcv/ventures` | `^0.14.0` | Venture management and multi-tenant context |
| `@mcv/learning` | `^0.14.0` | Training course enrollment and progress tracking |
| `@mcv/calendar` | `^0.14.0` | Meeting scheduling for buddy intros and exit interviews |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.0` | Database ORM for type-safe queries |
| `@trpc/server` | `^10.45.0` | API router and procedure definitions |
| `@trpc/client` | `^10.45.0` | Client-side tRPC integration |
| `zod` | `^3.22.0` | Input validation and schema definition |
| `kafkajs` | `^2.2.0` | Redpanda/Kafka client for event publishing/consumption |
| `date-fns` | `^3.3.0` | Date manipulation for due date calculations |
| `nanoid` | `^5.0.0` | Short unique ID generation |
| `@tanstack/react-query` | `^5.17.0` | React hooks for data fetching and caching |
| `nodemailer` | `^6.9.0` | Email sending for welcome emails and reminders |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | `^18.2.0` | React hooks require React as a peer |
| `@supabase/supabase-js` | `^2.39.0` | Supabase client for auth and storage |

---

## Testing

### Test Strategy

The onboarding module uses a layered testing approach:

1. **Unit Tests** — Individual service methods, validation logic, template resolution
2. **Integration Tests** — Database operations, RLS policies, event publishing
3. **End-to-End Tests** — Full onboarding workflow from creation to completion
4. **Load Tests** — Concurrent onboarding creation, bulk provisioning

### Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingService } from '../services/onboarding.service';
import { TaskStatus, WorkflowStatus } from '../types';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let mockDb: any;
  let mockTenant: any;

  beforeEach(() => {
    mockDb = createMockDb();
    mockTenant = { id: 'tenant_001', name: 'Test Org' };
    service = new OnboardingService(mockDb, mockTenant);
  });

  describe('createWorkflowFromTemplate', () => {
    it('should create a workflow with resolved tasks from template', async () => {
      const template = createMockTemplate({
        taskDefinitions: [
          { key: 'welcome', title: 'Send welcome email', relativeDueDay: -7, assigneeRole: 'hr_representative' },
          { key: 'laptop', title: 'Provision laptop', relativeDueDay: -3, assigneeRole: 'it_team' },
          { key: 'orientation', title: 'Attend orientation', relativeDueDay: 1, assigneeRole: 'new_hire' },
        ],
      });

      mockDb.query.onboardingTemplates.findFirst.mockResolvedValue(template);

      const workflow = await service.createWorkflowFromTemplate(template.id, {
        newHireId: 'user_001',
        newHireName: 'Jane Smith',
        newHireEmail: 'jane@example.com',
        hiringManagerId: 'manager_001',
        ventureId: 'venture_001',
        departmentId: 'dept_001',
        roleTitle: 'Engineer',
        employmentType: 'full_time',
        startDate: '2026-04-01',
        workLocation: 'office',
      });

      expect(workflow.status).toBe(WorkflowStatus.PRE_BOARDING);
      expect(workflow.totalTasks).toBe(3);
      expect(workflow.completionPercentage).toBe(0);
    });

    it('should resolve relative due dates based on start date', async () => {
      const template = createMockTemplate({
        taskDefinitions: [
          { key: 'pre_task', relativeDueDay: -5 },
          { key: 'day_one', relativeDueDay: 1 },
          { key: 'week_one', relativeDueDay: 7 },
        ],
      });

      mockDb.query.onboardingTemplates.findFirst.mockResolvedValue(template);

      const workflow = await service.createWorkflowFromTemplate(template.id, {
        ...defaultInput,
        startDate: '2026-04-01',
      });

      const tasks = await service.listTasks(workflow.id);
      expect(tasks[0].dueDate).toBe('2026-03-27'); // Day -5
      expect(tasks[1].dueDate).toBe('2026-04-02'); // Day 1
      expect(tasks[2].dueDate).toBe('2026-04-08'); // Day 7
    });

    it('should reject if active workflow already exists for employee', async () => {
      mockDb.query.onboardingWorkflows.findFirst.mockResolvedValue({
        id: 'existing_001',
        status: WorkflowStatus.ACTIVE,
      });

      await expect(
        service.createWorkflowFromTemplate('template_001', {
          ...defaultInput,
          newHireId: 'user_001',
        }),
      ).rejects.toThrow('ONBOARDING_029');
    });
  });

  describe('completeTask', () => {
    it('should complete a task and update workflow progress', async () => {
      const task = createMockTask({
        status: TaskStatus.IN_PROGRESS,
        requiresVerification: false,
      });

      mockDb.query.onboardingTasks.findFirst.mockResolvedValue(task);

      const result = await service.completeTask(task.id, {
        completionNotes: 'Done',
      });

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
    });

    it('should set status to AWAITING_VERIFICATION when verification required', async () => {
      const task = createMockTask({
        status: TaskStatus.IN_PROGRESS,
        requiresVerification: true,
        verifierId: 'verifier_001',
      });

      mockDb.query.onboardingTasks.findFirst.mockResolvedValue(task);

      const result = await service.completeTask(task.id, {
        completionNotes: 'Ready for review',
      });

      expect(result.status).toBe(TaskStatus.AWAITING_VERIFICATION);
    });

    it('should unblock dependent tasks when completed', async () => {
      const task = createMockTask({ id: 'task_a', status: TaskStatus.IN_PROGRESS });
      const blockedTask = createMockTask({
        id: 'task_b',
        status: TaskStatus.BLOCKED,
        dependsOn: ['task_a'],
      });

      mockDb.query.onboardingTasks.findFirst.mockResolvedValue(task);
      mockDb.query.onboardingTasks.findMany.mockResolvedValue([blockedTask]);

      await service.completeTask(task.id, {});

      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'task_b' }),
        expect.objectContaining({ status: TaskStatus.PENDING }),
      );
    });

    it('should reject completion of blocked tasks', async () => {
      const task = createMockTask({ status: TaskStatus.BLOCKED });
      mockDb.query.onboardingTasks.findFirst.mockResolvedValue(task);

      await expect(
        service.completeTask(task.id, {}),
      ).rejects.toThrow('ONBOARDING_006');
    });
  });

  describe('template resolution', () => {
    it('should resolve inherited template by merging parent tasks', async () => {
      const orgTemplate = createMockTemplate({
        scopeLevel: 'organization',
        taskDefinitions: [
          { key: 'compliance', title: 'Complete compliance training' },
          { key: 'nda', title: 'Sign NDA' },
        ],
      });

      const deptTemplate = createMockTemplate({
        scopeLevel: 'department',
        parentTemplateId: orgTemplate.id,
        taskDefinitions: [
          { key: 'tools', title: 'Set up department tools' },
          { key: 'nda', title: 'Sign Department NDA' }, // Override
        ],
      });

      const resolved = await service.templateService.resolveInheritedTemplate(deptTemplate.id);

      expect(resolved.taskDefinitions).toHaveLength(3); // compliance, nda (overridden), tools
      expect(resolved.taskDefinitions.find(t => t.key === 'nda')?.title).toBe('Sign Department NDA');
    });
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, seedTestData, cleanupTestDb } from '@mcv/testing';
import { OnboardingService } from '../services/onboarding.service';

describe('Onboarding Integration', () => {
  let db: TestDb;
  let service: OnboardingService;

  beforeAll(async () => {
    db = await createTestDb();
    await seedTestData(db, {
      tenants: [{ id: 'tenant_001' }],
      ventures: [{ id: 'venture_001', tenantId: 'tenant_001' }],
      users: [
        { id: 'new_hire_001', tenantId: 'tenant_001', name: 'Jane Smith' },
        { id: 'manager_001', tenantId: 'tenant_001', name: 'Bob Manager' },
        { id: 'hr_001', tenantId: 'tenant_001', name: 'Alice HR' },
      ],
      departments: [{ id: 'dept_001', tenantId: 'tenant_001', name: 'Engineering' }],
    });
    service = new OnboardingService(db, { id: 'tenant_001' });
  });

  afterAll(async () => {
    await cleanupTestDb(db);
  });

  it('should enforce RLS — users cannot see other tenants workflows', async () => {
    // Create workflow in tenant_001
    const workflow = await service.createWorkflow({
      newHireId: 'new_hire_001',
      ventureId: 'venture_001',
      // ...
    });

    // Switch to tenant_002 context
    const otherService = new OnboardingService(db, { id: 'tenant_002' });
    const result = await otherService.listWorkflows({});

    expect(result.items).toHaveLength(0);
    expect(result.items.find(w => w.id === workflow.id)).toBeUndefined();
  });

  it('should complete full onboarding lifecycle', async () => {
    // Create template
    const template = await service.templateService.createTemplate({
      name: 'Engineering Onboarding',
      scopeLevel: 'department',
      departmentId: 'dept_001',
      ventureId: 'venture_001',
      taskDefinitions: [
        { key: 'welcome', title: 'Welcome meeting', phase: 'day_one', relativeDueDay: 1, assigneeRole: 'hiring_manager', priority: 1, sortOrder: 1, category: 'social', isMandatory: true },
        { key: 'setup', title: 'Setup workstation', phase: 'day_one', relativeDueDay: 1, assigneeRole: 'it_team', priority: 1, sortOrder: 2, category: 'it_provisioning', isMandatory: true },
      ],
    });

    // Create workflow from template
    const workflow = await service.createWorkflowFromTemplate(template.id, {
      newHireId: 'new_hire_001',
      newHireName: 'Jane Smith',
      newHireEmail: 'jane@test.com',
      hiringManagerId: 'manager_001',
      ventureId: 'venture_001',
      departmentId: 'dept_001',
      roleTitle: 'Software Engineer',
      employmentType: 'full_time',
      startDate: '2026-04-01',
      workLocation: 'office',
    });

    expect(workflow.status).toBe('pre_boarding');
    expect(workflow.totalTasks).toBe(2);

    // Complete tasks
    const tasks = await service.listTasks(workflow.id);
    for (const task of tasks) {
      await service.completeTask(task.id, { completionNotes: 'Done' });
    }

    // Verify workflow is completed
    const updated = await service.getWorkflow(workflow.id);
    expect(updated.completionPercentage).toBe(100);
    expect(updated.completedTasks).toBe(2);
  });

  it('should publish provisioning events to Redpanda', async () => {
    const mockProducer = vi.fn();

    const request = await service.provisioningService.createRequest({
      workflowId: 'workflow_001',
      newHireId: 'new_hire_001',
      provisioningType: 'email_account',
      systemName: 'Google Workspace',
      requestedForDate: '2026-04-01',
      priority: 1,
    });

    await service.provisioningService.publishProvisioningEvent(request);

    expect(mockProducer).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'onboarding.provisioning.requested',
        messages: expect.arrayContaining([
          expect.objectContaining({
            key: request.id,
            value: expect.stringContaining('email_account'),
          }),
        ]),
      }),
    );
  });
});
```

### Test Utilities

```typescript
// test-utils/onboarding-factories.ts

import { faker } from '@faker-js/faker';

export function createMockTemplate(overrides: Partial<OnboardingTemplate> = {}): OnboardingTemplate {
  return {
    id: faker.string.uuid(),
    tenantId: 'tenant_001',
    name: faker.company.buzzPhrase() + ' Onboarding',
    description: faker.lorem.paragraph(),
    scopeLevel: 'department',
    ventureId: 'venture_001',
    departmentId: 'dept_001',
    roleTitle: null,
    parentTemplateId: null,
    isActive: true,
    isDefault: false,
    version: 1,
    templateType: 'onboarding',
    expectedDurationDays: 90,
    taskDefinitions: [],
    documentRequirements: [],
    provisioningRequirements: [],
    welcomeEmailTemplate: null,
    buddyConfig: null,
    trainingCourseIds: [],
    tags: [],
    metadata: {},
    createdBy: 'user_001',
    updatedBy: 'user_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockTask(overrides: Partial<OnboardingTask> = {}): OnboardingTask {
  return {
    id: faker.string.uuid(),
    tenantId: 'tenant_001',
    workflowId: 'workflow_001',
    title: faker.lorem.sentence(4),
    description: faker.lorem.paragraph(),
    instructions: null,
    category: 'administrative',
    status: 'pending',
    priority: 3,
    sortOrder: 1,
    phase: 'day_one',
    relativeDueDay: 1,
    dueDate: '2026-04-02',
    completedAt: null,
    completedBy: null,
    assigneeRole: 'new_hire',
    assigneeId: 'user_001',
    requiresVerification: false,
    verifierId: null,
    verifiedAt: null,
    dependsOn: [],
    isMandatory: true,
    isAutoCompletable: false,
    externalAction: null,
    externalReferenceId: null,
    actionUrl: null,
    attachmentIds: [],
    completionNotes: null,
    reminderSchedule: null,
    remindersSent: 0,
    estimatedDurationMinutes: null,
    actualDurationMinutes: null,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockWorkflow(overrides: Partial<OnboardingWorkflow> = {}): OnboardingWorkflow {
  return {
    id: faker.string.uuid(),
    tenantId: 'tenant_001',
    ventureId: 'venture_001',
    newHireId: faker.string.uuid(),
    newHireName: faker.person.fullName(),
    newHireEmail: faker.internet.email(),
    templateId: null,
    hiringManagerId: faker.string.uuid(),
    hrRepresentativeId: faker.string.uuid(),
    departmentId: faker.string.uuid(),
    roleTitle: faker.person.jobTitle(),
    jobLevel: 'L4',
    employmentType: 'full_time',
    startDate: '2026-04-01',
    expectedCompletionDate: '2026-07-01',
    actualCompletionDate: null,
    status: 'active',
    completionPercentage: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    workLocation: 'office',
    officeLocation: null,
    metadata: {},
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: faker.string.uuid(),
    updatedBy: faker.string.uuid(),
    ...overrides,
  };
}
```

### Running Tests

```bash
# Run all onboarding tests
pnpm test --filter @mcv/people/onboarding

# Run unit tests only
pnpm test:unit --filter @mcv/people/onboarding

# Run integration tests (requires database)
pnpm test:integration --filter @mcv/people/onboarding

# Run with coverage
pnpm test:coverage --filter @mcv/people/onboarding

# Run specific test file
pnpm test -- src/services/__tests__/onboarding.service.test.ts

# Watch mode during development
pnpm test:watch --filter @mcv/people/onboarding
```

### Coverage Targets

| Category | Target | Description |
|----------|--------|-------------|
| Statements | ≥ 85% | Overall code statement coverage |
| Branches | ≥ 80% | Conditional branch coverage (status transitions, validation) |
| Functions | ≥ 90% | All exported service methods must have tests |
| Lines | ≥ 85% | Line-level coverage |

### Key Test Scenarios

| Scenario | Type | Priority |
|----------|------|----------|
| Full onboarding lifecycle (create → complete) | E2E | Critical |
| Template inheritance resolution (4 levels) | Unit | Critical |
| Task dependency chain resolution | Unit | Critical |
| RLS tenant isolation | Integration | Critical |
| Provisioning event publish/consume | Integration | High |
| Document upload and e-signature flow | Integration | High |
| Buddy matching algorithm | Unit | High |
| Overdue task detection and escalation | Unit | High |
| Concurrent workflow creation for same employee | Integration | High |
| Offboarding with complete access revocation | E2E | High |
| Template version conflict handling | Integration | Medium |
| Analytics date range queries | Integration | Medium |
| Bulk task operations | Unit | Medium |
| Pre-boarding package completeness | Unit | Medium |
| Exit interview data anonymization | Integration | Medium |

---

*Last updated: 2026-02-09*
*Module version: 0.14.0*
*Documentation version: 1.0.0*