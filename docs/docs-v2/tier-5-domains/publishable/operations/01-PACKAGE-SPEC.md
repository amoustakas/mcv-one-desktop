# @mcv/operations — Package Specification

> **Package:** `@mcv/operations`
> **Classification:** PUBLISHABLE
> **Tier:** 5 — Domain Layer
> **Submodules:** Assets · Calendar · Editor · Tasks · Time · Workflows
> **Version:** 1.0.0
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
9. [Security](#security)
10. [Performance](#performance)
11. [Deployment](#deployment)

---

## Overview

`@mcv/operations` is the complete work management backbone of the MCV.ONE enterprise platform. It orchestrates how work is defined, organized, assigned, tracked, automated, and documented across every venture in the nine-venture consortium. From individual task creation through sprint planning, dependency management, time tracking, workflow automation, and document generation — Operations is the connective tissue that turns strategic intent into measurable execution.

**This domain answers the fundamental question: "What work needs to happen, who/what does it, when, and how do we know it's done?"**

Unlike standalone project management tools, `@mcv/operations` is deeply integrated with MCV's AI-native architecture:

- **Tasks** support agentic ownership models — work items can be assigned to humans, AI agents, or hybrid teams
- **Workflows** go beyond simple automations with a full graph-based execution engine supporting parallel branches, loops, human-in-the-loop approvals, and sub-workflows
- **Time Tracking** captures effort from both human and agent contributors with billable hours and approval flows
- **Documents** provide block-based editing with AI-powered content suggestions, variable resolution from CRM data, and a full publish lifecycle
- **Assets** offer reusable content components (snippets, clauses, signatures) for document assembly
- **Calendar** provides scheduling, availability checking, and recurring event management

### Key Metrics

| Metric | Value |
|--------|-------|
| Database Tables | 20+ |
| Database Indexes | 100+ |
| API Endpoints | 90+ |
| Task Statuses | 17 |
| Workflow Node Types | 90+ |
| Document Block Types | 24 |
| Activity Log Types | 41 |
| Comparison Operators | 22 |

---

## Purpose & Scope

### Purpose

`@mcv/operations` exists to provide a unified, enterprise-grade work management system that:

1. **Centralizes Work Definition** — Every unit of work across all nine ventures lives as a typed, prioritized, trackable task with deep hierarchy support (epics → stories → tasks → subtasks)
2. **Enables Human-AI Collaboration** — First-class support for agentic task ownership with five ownership models ranging from `human_only` to `agent_only`, and four autonomy tiers (T1–T4)
3. **Automates Business Processes** — A dual-generation workflow engine (V1 simple automations + V2 graph-based execution) handles everything from simple notifications to sophisticated multi-step business processes
4. **Tracks Time & Cost** — Granular time tracking with live timers, billable hours, approval workflows, and timesheet reporting for both human and AI contributors
5. **Manages Documents** — Block-based document editing with templating, AI content suggestions, CRM variable resolution, version history, and a full publish lifecycle
6. **Provides Reusable Assets** — A library of reusable content components (text snippets, clauses, pricing tables, signatures) for rapid document assembly

### Scope

**In Scope:**

- Task CRUD, hierarchy, dependencies, and status lifecycle management
- Project and sprint management with agile methodology support
- Polymorphic task assignment (users, teams, agents, agent pools, workflows, external)
- Time entry tracking with live timers, approval, and billing
- Workflow definition, versioning, graph-based execution, and approval flows
- Block-based document editing with 24 block types
- Document templates with merge field resolution from CRM data
- AI content suggestions (rewrite, expand, summarize, translate, tone adjustment)
- Reusable document assets (snippets, clauses, signatures, pricing tables)
- Comprehensive audit logging for all mutations
- Multi-venture isolation via RLS and application-level scoping

**Out of Scope:**

- Real-time collaborative editing via CRDT (planned for Phase 3)
- Calendar scheduling UI and availability management (planned for Phase 1–2)
- Gantt chart rendering (client-side concern, not domain logic)
- File storage and CDN management (delegated to @mcv/fabric)
- Notification delivery infrastructure (delegated to @mcv/shared)
- AI model inference (delegated to @mcv/kernel via AI Gateway)
- User authentication and session management (delegated to @mcv/identity)

### Domain Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    @mcv/operations Boundary                     │
│                                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │   Tasks   │  │ Projects  │  │  Sprints  │  │ Workflows │  │
│  │           │  │           │  │           │  │           │  │
│  │ Create    │  │ Hierarchy │  │ Planning  │  │ V1 Simple │  │
│  │ Assign    │  │ Stats     │  │ Velocity  │  │ V2 Graph  │  │
│  │ Track     │  │ Archive   │  │ Capacity  │  │ Approvals │  │
│  │ Depend    │  │ Settings  │  │ Retro     │  │ Templates │  │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
│                                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────────────┐  │
│  │   Time    │  │  Editor   │  │          Assets            │  │
│  │           │  │           │  │                             │  │
│  │ Entries   │  │ Documents │  │ Snippets · Clauses         │  │
│  │ Timers    │  │ Templates │  │ Signatures · Pricing       │  │
│  │ Approval  │  │ Blocks    │  │ Headers · Footers          │  │
│  │ Sheets    │  │ AI Assist │  │ Images · Logos              │  │
│  └───────────┘  └───────────┘  └───────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                       Calendar                           │  │
│  │  Events · Availability · Recurring · Reminders           │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Summary

### 1. Tasks Submodule

The core work-item engine. Every unit of work in MCV — whether created manually, generated by AI, spawned from a template, or triggered by a webhook — lives as a task.

| Feature | Description |
|---------|-------------|
| **Task Lifecycle** | 17 statuses from `draft` through `done`/`archived`/`cancelled` |
| **Task Types** | 20 types across 4 hierarchy levels (epic, story, task, subtask, bug, chore, spike, etc.) |
| **Priority System** | 5 levels (lowest → highest) with manual and AI-computed priority scores |
| **Hierarchy** | Self-referential parent-child relationships for epic → story → task → subtask |
| **Dependencies** | 4 dependency types (FS, SS, FF, SF) with BFS cycle detection |
| **Assignments** | Polymorphic: user, team, agent, agent_pool, workflow, external |
| **Ownership Models** | 5 models: human_only, human_primary, hybrid, agent_primary, agent_only |
| **Autonomy Tiers** | T1 (full autonomy) through T4 (restricted) |
| **Activity Logging** | 41 activity types across 8 categories |
| **Templates** | Configurable templates with checklist items, subtask templates, and field defaults |
| **Estimation** | Story points (Fibonacci), time estimates, AI-refined estimates |
| **SLA Tracking** | Deadlines with breach detection |

**Key Exports:** `TaskService`, `taskRouter`, `tasks`, `taskAssignments`, `taskActivities`, `taskDependencies`, `taskTemplates`

**Database:** `tasks` (50+ cols, 18 idx), `task_assignments` (22 cols, 6 idx), `task_activities` (14 cols, 6 idx), `task_dependencies` (5 cols, 1 unique), `task_templates` (23 cols, 5 idx)

### 2. Projects Submodule

Venture-scoped organizational containers for tasks. Projects support hierarchical sub-projects via self-referential `parentId`, configurable visibility levels, and JSONB-based settings for per-project customization.

| Feature | Description |
|---------|-------------|
| **Hierarchy** | Sub-projects via self-referential `parentId` |
| **Visibility** | 4 levels: private, team, venture, global |
| **Settings** | JSONB configuration for auto-archive, custom fields, notification preferences |
| **Statistics** | Task count, completion rate, active sprint info |
| **Lifecycle** | Planning → active → on_hold → completed → archived |

**Key Exports:** `ProjectService`, `projectRouter`, `projects`

**Database:** `projects` (14 cols, 6 idx)

### 3. Sprints Submodule

Time-boxed iterations for task execution following agile methodology. Sprints are venture-scoped and optionally team-scoped, tracking capacity, velocity, and completion metrics.

| Feature | Description |
|---------|-------------|
| **Time Boxing** | Required start and end dates |
| **Capacity Planning** | Story point and hour capacity tracking |
| **Velocity** | Computed velocity (points per period) |
| **Retrospectives** | Structured notes and categorized lessons learned |
| **Lifecycle** | Planning → active → review → completed / cancelled |

**Key Exports:** `sprints`, `sprintStatuses`

**Database:** `sprints` (18 cols, 5 idx)

### 4. Workflows Submodule

A dual-generation automation engine. V1 provides simple trigger → condition → action automations. V2 extends this with a full graph-based execution engine supporting parallel branches, loops, try/catch error handling, HITL approvals, sub-workflows, versioning with rollback, split testing, business hours awareness, and rate limiting.

| Feature | Description |
|---------|-------------|
| **V1 Engine** | Simple trigger → condition → action automations |
| **V2 Engine** | Graph-based execution with 90+ node types |
| **Triggers** | Task events, CRM events, communication events, cron/manual (43+ trigger types) |
| **Actions** | Communication, CRM, AI, data manipulation, flow control (47+ action types) |
| **Condition Evaluator** | Nested AND/OR/NOT groups with 22 comparison operators |
| **Parallel Execution** | Branches with join strategies (all/any/n_of) |
| **Loop Control** | For-each and while loops with 1,000 iteration limit |
| **Error Handling** | Try/catch with retry + exponential backoff |
| **HITL Approvals** | Approval nodes with timeout, escalation, and multi-assignee support |
| **Versioning** | Snapshot-based versions with diff and rollback |
| **Split Testing** | A/B branch routing with auto-winner selection |
| **Business Hours** | Timezone, working days, holidays awareness |
| **Templates** | Reusable workflow templates with marketplace support |

**Key Exports:** `WorkflowEngine`, `WorkflowService`, `workflowRouter`, `evaluateConditionGroup`, `resolveVariable`, `interpolateTemplate`

**Database:** `workflows` (13 cols, 6 idx), `workflow_versions` (6 cols, 2 idx), `workflow_executions` (14 cols, 7 idx), `workflow_step_executions` (13 cols, 3 idx), `workflow_approvals` (12 cols, 4 idx), `workflow_templates` (12 cols, 4 idx)

### 5. Time Tracking Submodule

Granular time tracking with billable hours, live timer support, approval workflows, and timesheet reporting. Supports both human and agent-logged time entries with configurable billing rates and categories.

| Feature | Description |
|---------|-------------|
| **Time Entries** | Manual and timer-based entry creation |
| **Live Timers** | Real-time timer with one-timer-per-user constraint |
| **Billing** | Billable flag, hourly rates, currency support |
| **Approval** | Manager approval workflow for time entries |
| **Timesheets** | Period-based timesheet reports with summary statistics |
| **Sources** | Manual, timer, import, API, agent, integration |
| **Categorization** | Free-form categories and tags |
| **Agent Time** | AI agent time logging with `agentId` reference |

**Key Exports:** `timeEntryRouter`, `timeEntries`, `timeEntrySourceEnum`

**Database:** `time_entries` (19 cols, 7 idx)

### 6. Editor Submodule (Document Editor)

A block-based live editor for invoices, proposals, contracts, and general documents. Combines Notion-like block editing with PandaDoc-style document automation, AI-powered content suggestions, merge field resolution from CRM data, version history, threaded commenting, and a full publish lifecycle.

| Feature | Description |
|---------|-------------|
| **Block Editor** | 24 block types (text, media, data, interactive, layout, content, dynamic) |
| **Templates** | Document templates with merge field definitions and marketplace support |
| **AI Suggestions** | Rewrite, expand, summarize, translate, tone change, grammar correction |
| **Variables** | CRM merge field resolution (contact, deal, invoice data) |
| **Version History** | Snapshot-based versioning with restore capability |
| **Collaboration** | Pessimistic locking, collaborator roles, threaded comments |
| **Publish Flow** | Draft → review → approved → published → archived |
| **Assets** | Reusable content components (snippets, clauses, signatures, pricing tables) |
| **Comments** | Block-level threaded comments with resolve functionality |

**Key Exports:** `documentEditorRouter`, `documents`, `documentTemplates`, `documentVersions`, `documentComments`, `documentAssets`, `aiContentSuggestions`

**Database:** `documents` (17 cols, 6 idx), `document_templates` (14 cols, 5 idx), `document_versions` (6 cols, 2 idx), `document_comments` (10 cols, 4 idx), `document_assets` (9 cols, 2 idx), `ai_content_suggestions` (9 cols, 3 idx)

### 7. Calendar Submodule (Planned)

Scheduling, availability management, and recurring events for task and project timeline coordination.

| Feature | Description |
|---------|-------------|
| **Events** | Create, update, delete calendar events tied to tasks/projects |
| **Availability** | Check team/user availability for scheduling |
| **Recurring** | Recurring event patterns (daily, weekly, monthly, custom RRULE) |
| **Reminders** | Configurable reminder notifications before events |
| **Integration** | Sync with external calendar providers (Google, Outlook) |
| **Views** | Day, week, month, agenda views (client-side rendering) |

**Status:** Router planned; schema design in progress

---

## Architecture Position

`@mcv/operations` sits at Tier 5 (Domain Layer) in the MCV architecture, classified as PUBLISHABLE — meaning it is a public-facing, customer-visible domain providing core product functionality.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MCV.ONE ARCHITECTURE TIERS                           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 7 — APPLICATION LAYER                                          │  │
│  │  Next.js 15 App Router · React Server Components · Client Islands    │  │
│  │  apps/web · apps/admin · apps/mobile                                 │  │
│  └────────────────────────────────┬──────────────────────────────────────┘  │
│                                   │                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 6 — API GATEWAY                                                │  │
│  │  tRPC Routers · REST Endpoints · WebSocket Handlers                  │  │
│  │  packages/api                                                         │  │
│  └────────────────────────────────┬──────────────────────────────────────┘  │
│                                   │                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 5 — DOMAIN LAYER                                               │  │
│  │                                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │  │
│  │  │  PUBLISHABLE  │  │  PUBLISHABLE  │  │      PUBLISHABLE         │   │  │
│  │  │  @mcv/crm     │  │  @mcv/comms   │  │  ╔════════════════════╗  │   │  │
│  │  │  Contacts     │  │  SMS · Email  │  │  ║  @mcv/operations   ║  │   │  │
│  │  │  Deals        │  │  Voice · Chat │  │  ║                    ║  │   │  │
│  │  │  Pipelines    │  │  Templates    │  │  ║  Tasks · Projects  ║  │   │  │
│  │  └──────────────┘  └──────────────┘  │  ║  Sprints · Time    ║  │   │  │
│  │                                       │  ║  Workflows · Docs  ║  │   │  │
│  │  ┌──────────────┐  ┌──────────────┐  │  ║  Assets · Calendar ║  │   │  │
│  │  │  INTERNAL     │  │  INTERNAL     │  │  ╚════════════════════╝  │   │  │
│  │  │  @mcv/people  │  │  @mcv/        │  └──────────────────────────┘   │  │
│  │  │  HR · Teams   │  │   analytics   │                                 │  │
│  │  │  Profiles     │  │  Reports      │                                 │  │
│  │  └──────────────┘  └──────────────┘                                   │  │
│  └────────────────────────────────┬──────────────────────────────────────┘  │
│                                   │                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 4 — INTELLIGENCE LAYER                                         │  │
│  │  @mcv/kernel — AI Gateway · OpenRouter · RAG · Agents · Embeddings   │  │
│  └────────────────────────────────┬──────────────────────────────────────┘  │
│                                   │                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 3 — INFRASTRUCTURE LAYER                                       │  │
│  │  @mcv/fabric — Supabase · Realtime · Storage · Edge Functions        │  │
│  │  @mcv/identity — Auth · Sessions · Roles · Permissions               │  │
│  └────────────────────────────────┬──────────────────────────────────────┘  │
│                                   │                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 2 — SHARED LAYER                                               │  │
│  │  @mcv/shared — Utilities · Zod Schemas · Event Bus · Notifications   │  │
│  └────────────────────────────────┬──────────────────────────────────────┘  │
│                                   │                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 1 — FOUNDATION                                                 │  │
│  │  TypeScript · Turborepo · ESLint · Prettier · Vitest                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

  DEPENDENCY FLOW:  Higher tiers depend on lower tiers (never reverse)

  @mcv/operations (Tier 5) DEPENDS ON:
    ├── @mcv/kernel      (Tier 4) — AI content suggestions, task classification
    ├── @mcv/fabric      (Tier 3) — Database, storage, realtime
    ├── @mcv/identity    (Tier 3) — Authentication, authorization, user refs
    └── @mcv/shared      (Tier 2) — Utilities, schemas, event bus
```

### Architectural Principles

1. **Venture Isolation** — All data is scoped to a venture via RLS policies and application-level checks. No cross-venture data leakage is possible.
2. **Service Layer Pattern** — Business logic lives in service classes (`TaskService`, `WorkflowEngine`, etc.) that are venture-scoped and stateless.
3. **tRPC Router Layer** — API endpoints are defined as tRPC procedures with Zod input validation and typed output.
4. **Drizzle ORM** — All database interactions use Drizzle's type-safe query builder. No raw SQL in application code.
5. **Event-Driven** — Mutations emit audit events for downstream consumption by analytics, notifications, and workflow triggers.
6. **AI-Native** — AI is a first-class citizen: tasks can be owned by agents, workflows can invoke AI nodes, documents can receive AI suggestions.

---

## Key Interfaces & Types

### Task Core Types

```typescript
// Task status lifecycle (17 states)
type TaskStatus =
  | 'draft' | 'backlog' | 'ready' | 'queued' | 'todo'
  | 'in_progress' | 'blocked' | 'in_review'
  | 'awaiting_approval' | 'hitl_pending' | 'hitl_approved' | 'hitl_rejected'
  | 'done' | 'cancelled' | 'archived' | 'deferred';

// Task priority levels (5 levels)
type TaskPriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';

// Task hierarchy types (20 types)
type TaskType =
  | 'epic' | 'story' | 'feature' | 'task' | 'bug' | 'subtask'
  | 'chore' | 'spike' | 'research' | 'documentation'
  | 'compliance' | 'review' | 'approval' | 'deployment'
  | 'maintenance' | 'meeting' | 'decision' | 'experiment' | 'automation';

// Agentic ownership models (5 models)
type OwnerType =
  | 'human_only' | 'human_primary' | 'hybrid'
  | 'agent_primary' | 'agent_only';

// Autonomy tiers (4 levels)
type TaskTier = 'T1' | 'T2' | 'T3' | 'T4';

// Polymorphic assignee types (6 types)
type AssigneeType =
  | 'user' | 'team' | 'agent' | 'agent_pool' | 'workflow' | 'external';

// Assignment roles (4 roles)
type AssignmentRole = 'owner' | 'assignee' | 'reviewer' | 'approver';

// Assignment statuses (5 states)
type AssignmentStatus = 'pending' | 'accepted' | 'active' | 'completed' | 'declined';

// Dependency types (4 types)
type DependencyType =
  | 'finish_to_start' | 'start_to_start'
  | 'finish_to_finish' | 'start_to_finish';

// Task sources (6 origins)
type TaskSource =
  | 'manual' | 'ai_generated' | 'template'
  | 'webhook' | 'workflow' | 'import';

// Activity types (41 types across 8 categories)
type TaskActivityType =
  | 'status_change' | 'priority_change' | 'assignment_change'
  | 'created' | 'updated' | 'description_updated' | 'title_updated'
  | 'comment_added' | 'comment_edited' | 'comment_deleted' | 'mention'
  | 'time_logged' | 'estimate_updated' | 'timer_started' | 'timer_stopped'
  | 'dependency_added' | 'dependency_removed' | 'blocked' | 'unblocked'
  | 'file_attached' | 'file_removed' | 'link_added'
  | 'github_pr_linked' | 'github_pr_merged' | 'commit_linked'
  | 'notion_synced' | 'slack_notification' | 'calendar_event_created'
  | 'hitl_requested' | 'hitl_approved' | 'hitl_rejected' | 'hitl_modified'
  | 'agent_assigned' | 'agent_started' | 'agent_checkpoint'
  | 'agent_completed' | 'agent_failed' | 'agent_learning_captured'
  | 'automation_triggered' | 'workflow_started' | 'workflow_completed'
  | 'added_to_sprint' | 'removed_from_sprint' | 'sprint_changed';
```

### Project Types

```typescript
type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
type ProjectVisibility = 'private' | 'team' | 'venture' | 'global';

interface ProjectSettings {
  allowSubProjects?: boolean;
  defaultTaskStatus?: string;
  autoArchiveCompletedTasks?: boolean;
  autoArchiveDays?: number;
  notifyOnOverdue?: boolean;
  requireTaskAssignee?: boolean;
  customFields?: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
    required?: boolean;
    options?: string[];
  }>;
}
```

### Sprint Types

```typescript
type SprintStatus = 'planning' | 'active' | 'review' | 'completed' | 'cancelled';
```

### Workflow Types

```typescript
// V1 trigger types
type WorkflowTriggerType =
  | 'task_created' | 'task_status_changed' | 'task_assigned'
  | 'task_due_approaching' | 'task_overdue' | 'manual';

// V2 node types (90+ across 8 categories)
type WorkflowNodeType = string; // Extensible string enum

// Execution status
type WorkflowExecutionStatus =
  | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';

// Step execution status
type StepExecutionStatus =
  | 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting';

// Approval status
type ApprovalStatus =
  | 'pending' | 'approved' | 'rejected' | 'expired' | 'escalated';

// Condition evaluation
interface ConditionGroup {
  logic: 'AND' | 'OR' | 'NOT';
  conditions: Array<Condition | ConditionGroup>;
}

interface Condition {
  field: string;
  operator: ComparisonOperator;
  value?: unknown;
}

// 22 comparison operators
type ComparisonOperator =
  | 'equals' | 'not_equals' | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with' | 'regex_match'
  | 'greater_than' | 'less_than'
  | 'greater_than_or_equal' | 'less_than_or_equal' | 'between'
  | 'is_empty' | 'is_not_empty'
  | 'before' | 'after' | 'within_last' | 'within_next'
  | 'day_of_week' | 'hour_of_day'
  | 'includes' | 'not_includes' | 'array_length';
```

### Time Tracking Types

```typescript
type TimeEntrySource = 'manual' | 'timer' | 'import' | 'api' | 'agent' | 'integration';
```

### Document Types

```typescript
// Document block types (24 types)
type DocumentBlockType =
  | 'heading' | 'paragraph' | 'quote' | 'callout' | 'code'
  | 'image' | 'video' | 'embed'
  | 'table' | 'pricing_table' | 'comparison_table' | 'payment_schedule' | 'product_card'
  | 'checklist' | 'button' | 'signature_block' | 'faq' | 'terms'
  | 'columns' | 'spacer' | 'divider'
  | 'testimonial' | 'timeline' | 'variable';

// Document lifecycle
type DocumentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

// AI suggestion types
type SuggestionType = 'rewrite' | 'expand' | 'summarize' | 'translate' | 'tone_change' | 'grammar';

// AI suggestion status
type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

// Asset types
type AssetType =
  | 'text_snippet' | 'image' | 'logo' | 'signature'
  | 'clause' | 'pricing_table' | 'header' | 'footer';
```

### Complete Export Summary

```typescript
// ─── Services ───────────────────────────────────────────────────
export { TaskService }              from './tasks';
export { ProjectService }           from './projects';
export { WorkflowEngine }           from './workflows';
export { WorkflowService }          from './workflows';

// ─── Routers ────────────────────────────────────────────────────
export { taskRouter }               from './tasks';
export { projectRouter }            from './projects';
export { workflowRouter }           from './workflows';
export { timeEntryRouter }          from './time';
export { documentEditorRouter }     from './editor';

// ─── Database Tables (20+) ──────────────────────────────────────
export { tasks, taskAssignments, taskActivities, taskDependencies, taskTemplates }
export { projects }
export { sprints }
export { workflows, workflowVersions, workflowExecutions, workflowStepExecutions }
export { workflowApprovals, workflowTemplates }
export { timeEntries }
export { documents, documentTemplates, documentVersions }
export { documentComments, documentAssets, aiContentSuggestions }

// ─── Engine Utilities ───────────────────────────────────────────
export { evaluateConditionGroup, resolveVariable, interpolateTemplate }

// ─── 60+ Type Exports ──────────────────────────────────────────
export type { Task, NewTask, TaskStatus, TaskPriority, TaskType, ... }
export type { Project, NewProject, ProjectStatus, ProjectVisibility, ... }
export type { Sprint, NewSprint, SprintStatus, ... }
export type { Workflow, NewWorkflow, WorkflowNode, WorkflowEdge, ... }
export type { TimeEntry, NewTimeEntry, ... }
export type { Document, NewDocument, DocumentBlock, DocumentBlockType, ... }
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (Supabase) |
| `WORKFLOW_MAX_LOOP_ITERATIONS` | No | `1000` | Maximum iterations for workflow loops |
| `WORKFLOW_DEFAULT_RETRY_MAX` | No | `3` | Default retry attempts for workflow steps |
| `WORKFLOW_DEFAULT_BACKOFF_MS` | No | `1000` | Default retry backoff in milliseconds |
| `WORKFLOW_BACKOFF_MULTIPLIER` | No | `2` | Exponential backoff multiplier |
| `WORKFLOW_APPROVAL_TIMEOUT_HOURS` | No | `72` | Default approval expiry in hours |
| `TIMER_STALE_LOCK_MINUTES` | No | `30` | Auto-unlock documents after N minutes |
| `TASK_MAX_SUBTASK_DEPTH` | No | `5` | Maximum subtask hierarchy depth |
| `TASK_MAX_DEPENDENCIES` | No | `20` | Maximum dependencies per task |
| `DOCUMENT_MAX_BLOCKS` | No | `500` | Maximum blocks per document |
| `DOCUMENT_MAX_COLLABORATORS` | No | `50` | Maximum collaborators per document |
| `AI_SUGGESTION_EXPIRY_HOURS` | No | `168` | AI suggestion auto-expiry (7 days) |
| `TIME_ENTRY_APPROVAL_REQUIRED` | No | `false` | Require approval for time entries |
| `SPRINT_DEFAULT_LENGTH_WEEKS` | No | `2` | Default sprint duration in weeks |

### Resource Limits

| Resource | Default Limit | Rationale |
|----------|--------------|-----------|
| Tasks per project | 10,000 | Index performance |
| Subtask depth | 5 levels | UI rendering, query complexity |
| Dependencies per task | 20 | BFS cycle detection performance |
| Blocks per document | 500 | JSONB read/write performance |
| Workflow nodes | 200 | Graph execution memory |
| Workflow edges | 500 | Traversal performance |
| Loop iterations | 1,000 | Hard limit (`DEFAULT_MAX_LOOP_ITERATIONS`) |
| Concurrent timers per user | 1 | Business rule |
| Document collaborators | 50 | JSONB array performance |
| Template variables | 100 | Resolution loop performance |
| Approval assignees | 10 | JSONB array limit |
| Retry attempts | 3 | Exponential backoff |

### Project-Level Settings (JSONB)

Projects support per-project configuration via the `settings` JSONB column:

```typescript
{
  allowSubProjects: true,           // Enable/disable sub-project hierarchy
  defaultTaskStatus: 'todo',        // Default status for new tasks
  autoArchiveCompletedTasks: true,  // Auto-archive after N days
  autoArchiveDays: 30,              // Days before auto-archive
  notifyOnOverdue: true,            // Send notifications for overdue tasks
  requireTaskAssignee: false,       // Require assignee on task creation
  customFields: [                   // Project-specific custom fields
    { name: 'Component', type: 'select', options: ['Frontend', 'Backend', 'DevOps'] },
    { name: 'Severity', type: 'select', options: ['Critical', 'Major', 'Minor'] },
  ]
}
```

---

## Dependencies

### Upstream Dependencies (Operations depends on these)

```
@mcv/operations
  │
  ├── @mcv/kernel (Tier 4 — Intelligence)
  │   ├── AI Gateway — LLM calls for content suggestions
  │   ├── AI classification — Task and lead classification
  │   ├── AI summarization — Document and task summarization
  │   └── RAG search — Knowledge retrieval for workflow nodes
  │
  ├── @mcv/identity (Tier 3 — Infrastructure)
  │   ├── Authentication — Session validation, user identity
  │   ├── Authorization — Role-based access control
  │   ├── Venture context — Multi-tenant isolation
  │   └── User references — Assignee, reporter, comment author FKs
  │
  ├── @mcv/fabric (Tier 3 — Infrastructure)
  │   ├── Database — Supabase/PostgreSQL connection
  │   ├── Realtime — WebSocket subscriptions (planned)
  │   ├── Storage — File/image storage for document assets
  │   └── Edge Functions — Serverless compute (planned)
  │
  └── @mcv/shared (Tier 2 — Shared)
      ├── Utilities — Common helpers, date math
      ├── Zod schemas — Shared validation schemas
      ├── Event bus — Audit event emission
      └── Notifications — Email, SMS, push, in-app delivery
```

### Direct Package Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/db` | workspace | Database schema, Drizzle ORM, query helpers |
| `@mcv/document-editor/server` | workspace | Document editor service implementations |
| `@trpc/server` | ^11.x | tRPC router and procedure framework |
| `drizzle-orm` | ^0.38.x | Type-safe ORM for PostgreSQL |
| `drizzle-orm/pg-core` | ^0.38.x | PostgreSQL schema primitives |
| `zod` | ^3.x | Schema validation for all API inputs |

### Downstream Dependencies (These depend on Operations)

```
@mcv/people (Tier 5 — Internal)
  └── Uses task assignments for team workload tracking
  └── References project membership for HR analytics

@mcv/analytics (Tier 5 — Internal)
  └── Consumes task activity events for productivity dashboards
  └── Aggregates sprint velocity for venture-level reporting
  └── Tracks workflow execution metrics

@mcv/crm (Tier 5 — Publishable)
  └── Triggers workflows from CRM events (contact created, deal won)
  └── Provides contact/deal data for document variable resolution

@mcv/comms (Tier 5 — Publishable)
  └── Workflow actions trigger communication (send_email, send_sms)
  └── Task notifications delivered via communication channels
```

### Peer Dependencies (Cross-Domain Integration)

| Module | Relationship | Integration Point |
|--------|-------------|-------------------|
| `@mcv/kernel` (AI Gateway) | AI content suggestions | LLM calls for rewrite, expand, translate, tone, classify, extract, summarize |
| `@mcv/identity` (Auth) | Authentication | Session validation, procedure guards, user identity |
| `@mcv/identity` (Ventures) | Multi-tenancy | Venture context, RLS configuration |
| `@mcv/shared` (Notifications) | Workflow actions | Email, SMS, push, in-app notification delivery |
| `@mcv/crm` (Contacts) | Variable resolution | Contact data for document merge fields |
| `@mcv/crm` (Deals) | Workflow triggers | Deal stage changes trigger workflow execution |

---

## Multi-Tenant Design

### Venture Isolation Architecture

All data in `@mcv/operations` is strictly isolated per venture. No user can access data from a venture they do not belong to. Isolation is enforced at two levels:

#### 1. PostgreSQL Row-Level Security (RLS)

Tables with a direct `venture_id` column use RLS policies:

```sql
-- Enable RLS on the table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Venture isolation policy: users only see their venture's data
CREATE POLICY projects_venture_isolation ON projects
  FOR ALL
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- Service role bypass for server-side operations
CREATE POLICY projects_service_role ON projects
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

**Tables with direct RLS:** `projects`, `sprints`, `workflows`, `workflow_executions`, `workflow_templates`, `time_entries`, `documents`, `document_templates`, `document_assets`, `task_activities`

#### 2. Application-Level Scoping

Tables without a direct `venture_id` (e.g., `tasks`, `task_assignments`) are isolated through join verification:

```typescript
class TaskService {
  constructor(private ventureId: string) {}

  // Every method verifies venture ownership through project
  private async verifyProject(projectId: string): Promise<string> {
    const [project] = await this.db
      .select({ id: projects.id })
      .from(projects)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.ventureId, this.ventureId)  // Enforced
      ))
      .limit(1);

    if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
    return project.id;
  }
}
```

**Tables with application-level isolation:** `tasks` (via project → venture), `task_assignments` (via task → project → venture), `task_dependencies` (via task → project → venture)

### Venture-Scoped Entity Hierarchy

```
venture (external)
  ├── projects ──────── venture_id (RLS)
  │   ├── tasks ──────── project_id → projects.venture_id (app-level)
  │   │   ├── task_assignments
  │   │   ├── task_activities ── venture_id (RLS)
  │   │   ├── task_dependencies
  │   │   └── time_entries ──── venture_id via project_id (RLS)
  │   └── sprints ────── venture_id (RLS)
  │
  ├── workflows ────── venture_id (RLS)
  │   ├── workflow_versions
  │   ├── workflow_executions ── venture_id (RLS)
  │   │   ├── workflow_step_executions
  │   │   └── workflow_approvals
  │   └── workflow_templates ── venture_id (RLS)
  │
  ├── documents ────── venture_id (RLS)
  │   ├── document_versions
  │   ├── document_comments
  │   └── ai_content_suggestions
  │
  ├── document_templates ── venture_id (RLS)
  ├── document_assets ───── venture_id (RLS)
  └── task_templates ────── venture_id (RLS)
```

### Cross-Venture Tasks

Tasks support optional cross-venture visibility via:

- `ventureScope: 'venture' | 'cross_venture' | 'global'`
- `crossVentureIds: string[]` — List of additional ventures that can view this task

Cross-venture tasks are visible to users in any listed venture but are still owned by the originating venture.

---

## Security

### Access Control Model

`@mcv/operations` uses a three-tier procedure guard system provided by `@mcv/identity`:

| Guard | Authentication | Authorization | Venture Context |
|-------|---------------|---------------|-----------------|
| `protectedProcedure` | Required | Any authenticated user | Not required |
| `ventureProcedure` | Required | Venture member | Required |
| `adminProcedure` | Required | Admin role in venture | Required |

### Access Control Matrix

| Resource | Read | Create | Update | Delete | Special |
|----------|------|--------|--------|--------|---------|
| **Tasks** | venture | venture | venture | venture | bulkUpdateStatus: venture |
| **Projects** | venture | venture | venture | venture | archive: venture |
| **Sprints** | venture | venture | venture | venture | — |
| **Workflows** | protected | admin | admin | admin | execute/toggle: admin |
| **Workflow Approvals** | protected | — | admin | — | processApproval: admin |
| **Time Entries** | venture | venture | venture | venture | approve: venture |
| **Documents** | venture | admin | admin | admin | publish: admin |
| **Doc Templates** | venture | admin | admin | admin | publicList: protected |
| **Doc Assets** | venture | admin | admin | admin | incrementUsage: protected |
| **Doc Comments** | venture | protected | protected (own) | admin | resolve: admin |
| **AI Suggestions** | venture | admin | admin | — | accept/reject: admin |

### Document Locking

Documents use pessimistic locking to prevent concurrent editing conflicts:

- `lockDocument` sets `lockedBy` and `lockedAt` fields
- Only the lock holder can make block mutations
- Admins can force-unlock via `forceUnlockDocument`
- Stale locks (older than `TIMER_STALE_LOCK_MINUTES`) should be cleaned up periodically

### Workflow Execution Security

- Only `adminProcedure` can execute workflows, process approvals, or modify templates
- Test mode (`isTest: true`) prevents real side effects (no emails, no CRM updates)
- Sub-workflow execution inherits parent's venture context
- Approval timeout prevents indefinite workflow pauses
- Rate limiting per node prevents infinite loops in webhooks/API calls
- Loop iteration hard limit (default 1,000) prevents runaway loops

### Audit Trail

All mutations emit structured audit events via `AuditService.log()`:

```typescript
interface AuditLogEntry {
  action: string;           // Namespaced: 'tasks.created', 'workflows.executed'
  userId: string;           // Authenticated user
  ventureId: string;        // Venture context
  ipAddress: string;        // Client IP
  metadata: Record<string, unknown>;  // Action-specific details
}
```

40+ distinct audit events are cataloged across all submodules.

---

## Performance

### Database Query Optimization

| Pattern | Strategy | Target Latency |
|---------|----------|---------------|
| Task listing with filters | Composite indexes on `(projectId, status)`, `(projectId, assignee)`, `(projectId, type)` | <50ms for 10K+ tasks |
| Dependency cycle detection | BFS traversal with visited set | O(V + E) per check |
| Bulk status updates | Single `UPDATE ... WHERE id IN (...)` + batch history inserts | Linear vs N individual updates |
| Time entry aggregation | Subquery `SUM()` pushed to DB; atomic `task.timeSpentMinutes` update | <20ms |
| Workflow graph execution | Async traversal with `Promise.all()` for parallel branches | Concurrent node execution |
| Document block operations | JSONB `blocks[]` updated in-place; version snapshots before mutations | <100ms for ≤500 blocks |
| Sprint velocity | Pre-computed columns (`completedPoints`, `velocity`); no runtime aggregation | O(1) reads |
| Approval timeout scan | Index on `expiresAt`; periodic scan via `WHERE expires_at < NOW()` | <50ms sweep |

### Caching Strategy

| Data | Cache Layer | TTL | Invalidation |
|------|------------|-----|--------------|
| Task list queries | tRPC cache | 30s | On task mutation |
| Project hierarchy | Application | 5m | On project mutation |
| Sprint metrics | Application | 1m | On task status change |
| Workflow templates | Application | 10m | On template mutation |
| Document templates | Application | 10m | On template mutation |
| Public templates | CDN | 1h | Manual purge |
| Dependency graph | Application | 1m | On dependency mutation |
| Active timer | None | — | Real-time from DB |

### Index Summary

| Table | Index Count | Primary Access Patterns |
|-------|------------|------------------------|
| `tasks` | 18 | Project filter, status filter, assignee lookup, sprint membership |
| `projects` | 6 | Venture filter, owner lookup, parent hierarchy |
| `sprints` | 5 | Venture filter, status filter, date range |
| `task_assignments` | 6 | Task lookup, user lookup, agent lookup, role filter |
| `task_activities` | 6 | Task+time range, activity type, venture filter |
| `workflows` | 6 | Venture filter, trigger type, active state |
| `workflow_executions` | 7 | Workflow lookup, status filter, venture filter |
| `time_entries` | 7 | Task lookup, user lookup, date range, billing filter |
| `documents` | 6 | Venture filter, template lookup, status filter |
| **Total** | **100+** | |

---

## Deployment

### Turborepo Package Structure

```
packages/
  domains/
    operations/
      ├── package.json           # @mcv/operations
      ├── tsconfig.json          # TypeScript configuration
      ├── index.ts               # Main exports barrel
      ├── types.ts               # All type definitions
      │
      ├── tasks/
      │   ├── index.ts           # TaskService + taskRouter exports
      │   ├── schema.ts          # Drizzle table definitions
      │   ├── constants.ts       # Status, priority, type enums
      │   ├── service.ts         # TaskService class
      │   └── router.ts          # tRPC router definitions
      │
      ├── projects/
      │   ├── index.ts           # ProjectService + projectRouter
      │   ├── schema.ts          # Drizzle table
      │   ├── service.ts         # ProjectService class
      │   └── router.ts          # tRPC router
      │
      ├── sprints/
      │   └── schema.ts          # Drizzle table
      │
      ├── workflows/
      │   ├── index.ts           # WorkflowEngine + WorkflowService + router
      │   ├── schema.ts          # 6 Drizzle tables
      │   ├── engine/
      │   │   ├── index.ts       # WorkflowEngine class
      │   │   ├── evaluator.ts   # Condition evaluator
      │   │   └── resolver.ts    # Variable resolution + template interpolation
      │   ├── service.ts         # WorkflowService class
      │   └── router.ts          # tRPC router (30+ endpoints)
      │
      ├── time/
      │   ├── index.ts           # timeEntryRouter export
      │   ├── schema.ts          # Drizzle table
      │   └── router.ts          # tRPC router
      │
      └── editor/
          ├── index.ts           # documentEditorRouter export
          ├── schema.ts          # 6 Drizzle tables
          └── router.ts          # tRPC router (40+ endpoints)
```

### Build Configuration

```json
{
  "name": "@mcv/operations",
  "version": "1.0.0",
  "private": true,
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@mcv/db": "workspace:*",
    "@mcv/document-editor": "workspace:*",
    "@trpc/server": "^11.0.0",
    "drizzle-orm": "^0.38.0",
    "zod": "^3.23.0"
  }
}
```

### Database Migration Strategy

Tables must be created in dependency order (22 tables):

1. External dependencies: `ventures`, `users`
2. Root tables: `projects`, `task_templates`
3. Task tables: `tasks`, `sprints`, `task_assignments`, `task_activities`, `task_dependencies`
4. Time tables: `time_entries`
5. Workflow tables: `workflows` → `workflow_versions` → `workflow_executions` → `workflow_step_executions` → `workflow_approvals`, `workflow_templates`
6. Document tables: `document_templates` → `documents` → `document_versions`, `document_comments`, `document_assets`, `ai_content_suggestions`

### RLS Policy Deployment

Apply venture isolation RLS to all venture-scoped tables:

```sql
-- Template for each venture-scoped table:
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY <table>_venture_isolation ON <table_name>
  FOR ALL
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

CREATE POLICY <table>_service_role ON <table_name>
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

### Health Checks

| Check | Endpoint | Frequency |
|-------|----------|-----------|
| Database connectivity | Internal | Every 30s |
| Active timer count | `timeEntry.activeTimer` | On demand |
| Pending approvals | `workflow.listApprovals` | Every 5m |
| Approval timeouts | `workflow.checkApprovalTimeouts` | Every 15m |
| Stale document locks | Internal cron | Every 30m |

### Monitoring & Observability

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Task creation rate | Audit events | >1000/min (spike detection) |
| Workflow execution duration | Execution records | >30s (slow workflow) |
| Workflow failure rate | Execution status | >5% per hour |
| Approval timeout rate | Approval status | >10% per day |
| Timer count per user | Time entries | >1 (constraint violation) |
| Document lock age | Document records | >30min (stale lock) |
| AI suggestion acceptance rate | Suggestion status | <10% (quality concern) |

---

*@mcv/operations — Operations Management Domain*
