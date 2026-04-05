# @mcv/operations/tasks

> **Task & Project Management** — Boards, sprints, time tracking, and work orchestration for the MCV.ONE platform.

| Field | Value |
|---|---|
| **Package** | `@mcv/operations/tasks` |
| **Domain** | Operations |
| **Layer** | Tier 5 — Domain Modules |
| **Status** | Stable |
| **Since** | 0.12.0 |
| **Maintainer** | MCV Operations Team |
| **License** | Proprietary |

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

`@mcv/operations/tasks` provides a full-featured task and project management system built for multi-tenant SaaS environments. It serves as the operational backbone for teams that need to plan, track, and deliver work — from simple to-do lists to complex sprint-based agile workflows.

### What It Does

- **Task lifecycle management** — Create, assign, prioritize, track, and complete tasks with rich metadata including descriptions (rich text / Markdown), assignees, due dates, priority levels, labels, story points, and custom fields.
- **Multiple view paradigms** — Kanban boards with drag-and-drop columns, list views with sorting/filtering, table views with inline editing, Gantt charts for timeline visualization, and calendar views for date-based planning. All views are saveable, shareable, and configurable per user.
- **Project organization** — Group tasks into projects with their own settings, templates, milestones, status tracking, and fine-grained permissions. Projects support hierarchical structure with sub-projects and cross-project task references.
- **Sprint management** — Full agile sprint support including sprint planning, backlog grooming, velocity tracking, burndown/burnup charts, and sprint retrospectives. Supports both Scrum and Kanban methodologies.
- **Dependency tracking** — Model task dependencies (blocks/blocked-by, predecessor/successor) with automatic critical path analysis, circular dependency detection, and cascade status updates.
- **Time tracking** — Log time against tasks with start/stop timers, manual entry, billable vs. non-billable classification, time reports, and integration with invoicing modules.
- **Subtasks & checklists** — Unlimited-depth nested subtasks with independent status tracking, plus lightweight checklists within tasks for quick progress tracking.
- **Automation engine** — Rule-based automation (e.g., "on status change to Done → notify watchers", "on due date passed → escalate priority") with custom triggers, conditions, and webhook-based actions.
- **Collaboration** — Task comments with @mentions, activity timeline, file attachments, task history with full audit trail, and real-time updates via WebSocket.
- **Reporting & analytics** — Velocity charts, throughput metrics, cycle time analysis, lead time tracking, burndown/burnup charts, workload distribution, and custom report builder.

### What It Does NOT Do

- **Document management** — Use `@mcv/operations/docs` for document storage, wikis, and knowledge bases.
- **Chat / messaging** — Use `@mcv/communications/messaging` for real-time team communication.
- **Invoicing / billing** — Use `@mcv/finance/invoicing` for converting tracked time into invoices.
- **Calendar events** — Use `@mcv/operations/calendar` for standalone calendar event management. This module only provides a calendar *view* of tasks.
- **User management** — Use `@mcv/iam/users` for user profiles, roles, and authentication.

### Design Philosophy

1. **View-agnostic data model** — Tasks are stored independently of how they're displayed. A single task can appear on a Kanban board, in a Gantt chart, and on a calendar simultaneously without data duplication.
2. **Real-time first** — All mutations broadcast via WebSocket channels so every connected client sees changes instantly. Optimistic updates on the client, conflict resolution on the server.
3. **Tenant isolation by default** — Every query is scoped by `tenant_id` through Supabase Row-Level Security (RLS). No task, project, or board leaks across tenants.
4. **Composable automation** — The automation engine uses a trigger → condition → action pipeline that's extensible without code changes. New triggers and actions can be registered at runtime.
5. **Performance at scale** — Designed for tenants with 100K+ tasks. Aggressive indexing, cursor-based pagination, materialized views for analytics, and lazy-loading for board rendering.

---

## Exports

### Services

| Export | Type | Description |
|---|---|---|
| `TaskService` | Class | Core task CRUD, search, bulk operations, and lifecycle management |
| `ProjectService` | Class | Project CRUD, templates, milestones, and project-level settings |
| `SprintService` | Class | Sprint lifecycle, planning, velocity tracking, and retrospectives |
| `BoardService` | Class | Board configuration, column management, and drag-and-drop state |
| `DependencyService` | Class | Task dependency management, critical path analysis, cycle detection |
| `TimeTrackingService` | Class | Time entries, timers, billable tracking, and time reports |
| `TaskAutomationService` | Class | Automation rules, triggers, conditions, actions, and execution |
| `TaskCommentService` | Class | Comments, @mentions, activity feed, and file attachments |
| `TaskReportService` | Class | Analytics, charts, velocity, cycle time, and custom reports |
| `TaskViewService` | Class | Saved views, view sharing, view configuration, and defaults |
| `SubtaskService` | Class | Subtask hierarchy, checklist management, and progress rollup |

### Types & Interfaces

| Export | Kind | Description |
|---|---|---|
| `Task` | Interface | Core task entity with all metadata fields |
| `TaskCreate` | Interface | Input type for task creation |
| `TaskUpdate` | Interface | Partial input type for task updates |
| `TaskFilter` | Interface | Filter/search criteria for task queries |
| `Project` | Interface | Project entity with settings and metadata |
| `ProjectCreate` | Interface | Input type for project creation |
| `Sprint` | Interface | Sprint entity with date range and goal |
| `SprintCreate` | Interface | Input type for sprint creation |
| `Board` | Interface | Board configuration with columns and settings |
| `BoardColumn` | Interface | Individual board column with WIP limits and rules |
| `TaskDependency` | Interface | Dependency link between two tasks |
| `TimeEntry` | Interface | Time log entry against a task |
| `TaskComment` | Interface | Comment on a task with author and content |
| `TaskAttachment` | Interface | File attachment metadata for a task |
| `TaskLabel` | Interface | Label/tag definition for task categorization |
| `TaskAutomation` | Interface | Automation rule definition |
| `AutomationTrigger` | Interface | Trigger condition for an automation rule |
| `AutomationAction` | Interface | Action to execute when automation fires |
| `TaskWatcher` | Interface | User watching a task for notifications |
| `TaskActivity` | Interface | Activity log entry for task history |
| `TaskReport` | Interface | Report definition and configuration |
| `VelocityData` | Interface | Sprint velocity metrics |
| `BurndownData` | Interface | Burndown/burnup chart data points |
| `CycleTimeData` | Interface | Cycle time analytics per task |
| `WorkloadData` | Interface | Workload distribution per assignee |
| `TaskView` | Interface | Saved view configuration |
| `Milestone` | Interface | Project milestone with target date |
| `Checklist` | Interface | Checklist within a task |
| `ChecklistItem` | Interface | Individual checklist item |
| `TaskPriority` | Enum | `critical`, `high`, `medium`, `low`, `none` |
| `TaskStatus` | Enum | `backlog`, `todo`, `in_progress`, `in_review`, `done`, `cancelled` |
| `DependencyType` | Enum | `blocks`, `blocked_by`, `relates_to`, `duplicates` |
| `SprintStatus` | Enum | `planning`, `active`, `completed`, `cancelled` |
| `ProjectStatus` | Enum | `active`, `paused`, `completed`, `archived` |
| `ViewType` | Enum | `kanban`, `list`, `table`, `gantt`, `calendar` |
| `TimeEntryType` | Enum | `manual`, `timer`, `imported` |
| `AutomationTriggerType` | Enum | `status_change`, `assignment_change`, `due_date`, `priority_change`, `label_change`, `comment_added`, `custom` |

### Router

| Export | Type | Description |
|---|---|---|
| `tasksRouter` | tRPC Router | All task management endpoints as tRPC procedures |

### Utilities

| Export | Type | Description |
|---|---|---|
| `criticalPath` | Function | Compute critical path through task dependency graph |
| `calculateVelocity` | Function | Calculate velocity from completed sprint data |
| `calculateBurndown` | Function | Generate burndown chart data from sprint tasks |
| `calculateCycleTime` | Function | Compute cycle time metrics for a set of tasks |
| `resolveTaskOrder` | Function | Topological sort of tasks respecting dependencies |
| `parseTaskFilter` | Function | Parse URL query params into `TaskFilter` |
| `formatDuration` | Function | Format milliseconds into human-readable duration |
| `isCircularDependency` | Function | Check if adding a dependency would create a cycle |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Applications                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────────┐ │
│  │  Kanban   │ │   List   │ │  Gantt   │ │Calendar│ │   Table    │ │
│  │  Board    │ │   View   │ │  Chart   │ │  View  │ │   View     │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ └─────┬──────┘ │
│       │             │            │            │             │        │
│       └─────────────┴────────┬───┴────────────┴─────────────┘        │
│                              │                                       │
│                    ┌─────────▼──────────┐                            │
│                    │   View Adapter      │  (normalizes task data    │
│                    │   Layer             │   for each view type)     │
│                    └─────────┬──────────┘                            │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ tRPC / WebSocket
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                        API Layer                                     │
│                    ┌─────────▼──────────┐                            │
│                    │    tasksRouter      │  tRPC procedures           │
│                    │    (tRPC)           │  with Zod validation       │
│                    └─────────┬──────────┘                            │
│                              │                                       │
│         ┌────────────────────┼────────────────────┐                  │
│         │                    │                    │                  │
│  ┌──────▼──────┐  ┌─────────▼────────┐  ┌───────▼────────┐         │
│  │ TaskService  │  │ ProjectService   │  │ SprintService  │         │
│  │             │  │                  │  │                │         │
│  │ • CRUD      │  │ • CRUD           │  │ • Planning     │         │
│  │ • Search    │  │ • Templates      │  │ • Velocity     │         │
│  │ • Bulk ops  │  │ • Milestones     │  │ • Burndown     │         │
│  └──────┬──────┘  └─────────┬────────┘  └───────┬────────┘         │
│         │                    │                    │                  │
│  ┌──────▼──────┐  ┌─────────▼────────┐  ┌───────▼────────┐         │
│  │ Board       │  │ Dependency       │  │ TimeTracking   │         │
│  │ Service     │  │ Service          │  │ Service        │         │
│  │             │  │                  │  │                │         │
│  │ • Columns   │  │ • Links          │  │ • Timers       │         │
│  │ • WIP limits│  │ • Critical path  │  │ • Reports      │         │
│  │ • Ordering  │  │ • Cycle detect   │  │ • Billable     │         │
│  └──────┬──────┘  └─────────┬────────┘  └───────┬────────┘         │
│         │                    │                    │                  │
│  ┌──────▼──────┐  ┌─────────▼────────┐  ┌───────▼────────┐         │
│  │ Automation  │  │ Comment          │  │ Report         │         │
│  │ Service     │  │ Service          │  │ Service        │         │
│  │             │  │                  │  │                │         │
│  │ • Rules     │  │ • @mentions      │  │ • Velocity     │         │
│  │ • Triggers  │  │ • Activity feed  │  │ • Cycle time   │         │
│  │ • Actions   │  │ • Attachments    │  │ • Workload     │         │
│  └──────┬──────┘  └─────────┬────────┘  └───────┬────────┘         │
│         │                    │                    │                  │
│         └────────────────────┼────────────────────┘                  │
│                              │                                       │
│                    ┌─────────▼──────────┐                            │
│                    │   Event Bus        │  (WebSocket broadcast      │
│                    │   (real-time)      │   + automation triggers)   │
│                    └─────────┬──────────┘                            │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Supabase PostgreSQL │
                    │  (Drizzle ORM)      │
                    │                     │
                    │  • RLS policies      │
                    │  • Triggers          │
                    │  • Materialized views│
                    │  • Full-text search  │
                    └─────────────────────┘
```

### Task Lifecycle

A task moves through a well-defined lifecycle. Status transitions are validated by the `TaskService` and can trigger automations at each step.

```
                    ┌──────────┐
                    │ BACKLOG  │  (Default for new tasks)
                    └────┬─────┘
                         │
                    ┌────▼─────┐
              ┌─────│   TODO   │─────┐
              │     └────┬─────┘     │
              │          │           │
              │     ┌────▼─────┐     │
              │     │IN_PROGRESS│     │
              │     └────┬─────┘     │
              │          │           │
              │     ┌────▼─────┐     │
              │     │IN_REVIEW │     │
              │     └────┬─────┘     │
              │          │           │
              │     ┌────▼─────┐     │
              └────►│   DONE   │     │
                    └──────────┘     │
                                     │
                    ┌──────────┐     │
                    │CANCELLED │◄────┘
                    └──────────┘
```

**Status transition rules:**

| From | Allowed Transitions |
|---|---|
| `backlog` | `todo`, `cancelled` |
| `todo` | `in_progress`, `backlog`, `cancelled` |
| `in_progress` | `in_review`, `todo`, `done`, `cancelled` |
| `in_review` | `done`, `in_progress`, `cancelled` |
| `done` | `todo`, `in_progress` (reopen) |
| `cancelled` | `backlog`, `todo` (reopen) |

Custom workflows can override these defaults at the project level by configuring `project.workflow_config`.

### Board Rendering Pipeline

The board view (Kanban) follows a specific rendering pipeline to ensure consistency across clients:

```
1. Fetch board config          → BoardService.getBoard(boardId)
   └─ columns, WIP limits, column order, swimlane config

2. Fetch tasks for board       → TaskService.list({ boardId, ...filters })
   └─ returns tasks with current column assignment

3. Group by column             → client-side grouping by task.board_column_id
   └─ respects column order from board config

4. Apply swimlanes (optional)  → group within columns by assignee/priority/label
   └─ configurable per board

5. Sort within column          → by task.column_position (drag-and-drop order)
   └─ stable sort, gaps allowed for O(1) reordering

6. Render with virtual scroll  → only visible cards are in DOM
   └─ intersection observer triggers load of off-screen cards

7. WebSocket subscription      → listen for task.updated, task.created, task.moved
   └─ patch local state, animate card movement
```

### Real-Time Update Flow

```
Client A (drags card)
    │
    ├─ Optimistic UI update (instant)
    │
    ├─ tRPC mutation: task.move({ taskId, columnId, position })
    │       │
    │       ├─ Validate WIP limit on target column
    │       ├─ Update task.board_column_id + task.column_position
    │       ├─ Fire automation triggers (status_change if column maps to status)
    │       ├─ Record activity log entry
    │       │
    │       └─ Broadcast via WebSocket:
    │           {
    │             event: "task.moved",
    │             payload: { taskId, fromColumn, toColumn, position }
    │           }
    │
Client B, C, D (subscribed to board channel)
    │
    └─ Receive WebSocket event → animate card to new position
```

### Automation Pipeline

```
Event occurs (e.g., task status changed to "done")
    │
    ▼
┌────────────────────┐
│  Event Dispatcher  │  Receives all task-related events
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Rule Matcher      │  Queries task_automations table for matching rules
│                    │  Filters by: tenant_id, project_id, trigger_type
└────────┬───────────┘
         │
         ▼ (for each matching rule)
┌────────────────────┐
│  Condition Evaluator│  Evaluates rule conditions:
│                    │  - Field matches (priority == "high")
│                    │  - Label presence (has label "bug")
│                    │  - Assignee checks
│                    │  - Custom expressions
└────────┬───────────┘
         │ (if conditions pass)
         ▼
┌────────────────────┐
│  Action Executor   │  Executes configured actions:
│                    │  - Update task fields
│                    │  - Send notification
│                    │  - Call webhook
│                    │  - Create subtask
│                    │  - Move to board column
│                    │  - Add comment
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Audit Logger      │  Records automation execution in task_activity
└────────────────────┘
```

---

## Core Interfaces

### Task

The central entity. Every task belongs to a tenant and optionally to a project.

```typescript
/**
 * Core task entity representing a unit of work.
 *
 * Tasks are the fundamental building blocks of the task management system.
 * They can exist independently or within projects, be organized on boards,
 * assigned to sprints, and tracked through their complete lifecycle.
 */
interface Task {
  /** Unique task identifier (UUID v7 for time-sortability) */
  id: string;

  /** Tenant this task belongs to — enforced by RLS */
  tenant_id: string;

  /** Project this task belongs to (null for standalone tasks) */
  project_id: string | null;

  /** Sprint this task is assigned to (null if not in a sprint) */
  sprint_id: string | null;

  /** Board column this task sits in (null if not on a board) */
  board_column_id: string | null;

  /** Position within the board column (float for gap-based ordering) */
  column_position: number | null;

  /** Parent task ID for subtask hierarchy (null for top-level tasks) */
  parent_task_id: string | null;

  /**
   * Human-readable task key (e.g., "PROJ-123").
   * Auto-generated from project prefix + incrementing counter.
   */
  task_key: string;

  /** Task title — required, 1-500 characters */
  title: string;

  /**
   * Task description in Markdown/rich text.
   * Supports standard Markdown plus @mentions, task references (#PROJ-123),
   * and embedded images.
   */
  description: string | null;

  /** Current task status */
  status: TaskStatus;

  /** Task priority level */
  priority: TaskPriority;

  /** Story points estimate (Fibonacci scale: 1, 2, 3, 5, 8, 13, 21) */
  story_points: number | null;

  /** Due date (date only, no time component) */
  due_date: string | null;

  /** Start date for Gantt/timeline views */
  start_date: string | null;

  /**
   * Assigned user IDs. Supports multiple assignees.
   * References users in @mcv/iam/users.
   */
  assignee_ids: string[];

  /** User who created this task */
  creator_id: string;

  /** Label IDs attached to this task */
  label_ids: string[];

  /**
   * Custom fields as a flexible JSON object.
   * Schema is defined at the project level via project.custom_field_schema.
   */
  custom_fields: Record<string, unknown>;

  /** Estimated time in minutes */
  estimated_minutes: number | null;

  /** Total tracked time in minutes (computed, read-only) */
  tracked_minutes: number;

  /** Number of subtasks (computed, read-only) */
  subtask_count: number;

  /** Number of completed subtasks (computed, read-only) */
  subtask_done_count: number;

  /** Number of comments (computed, read-only) */
  comment_count: number;

  /** Number of attachments (computed, read-only) */
  attachment_count: number;

  /** Depth in subtask hierarchy (0 = top-level) */
  depth: number;

  /**
   * Task position in list/backlog views.
   * Separate from column_position to allow independent ordering.
   */
  list_position: number;

  /** Whether this task is archived (soft-deleted from views) */
  is_archived: boolean;

  /** Timestamp when task was completed (status changed to done) */
  completed_at: string | null;

  /** Timestamp when task entered "in_progress" for the first time */
  started_at: string | null;

  /** ISO 8601 creation timestamp */
  created_at: string;

  /** ISO 8601 last-update timestamp */
  updated_at: string;
}
```

### TaskCreate / TaskUpdate

```typescript
/**
 * Input for creating a new task.
 * Only `title` is strictly required — all other fields have sensible defaults.
 */
interface TaskCreate {
  title: string;
  description?: string | null;
  project_id?: string | null;
  sprint_id?: string | null;
  board_column_id?: string | null;
  parent_task_id?: string | null;
  status?: TaskStatus;            // default: "backlog"
  priority?: TaskPriority;        // default: "medium"
  story_points?: number | null;
  due_date?: string | null;
  start_date?: string | null;
  assignee_ids?: string[];        // default: []
  label_ids?: string[];           // default: []
  custom_fields?: Record<string, unknown>;
  estimated_minutes?: number | null;
}

/**
 * Input for updating an existing task.
 * All fields are optional — only provided fields are updated.
 */
interface TaskUpdate {
  title?: string;
  description?: string | null;
  project_id?: string | null;
  sprint_id?: string | null;
  board_column_id?: string | null;
  column_position?: number | null;
  parent_task_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  story_points?: number | null;
  due_date?: string | null;
  start_date?: string | null;
  assignee_ids?: string[];
  label_ids?: string[];
  custom_fields?: Record<string, unknown>;
  estimated_minutes?: number | null;
  is_archived?: boolean;
}
```

### TaskFilter

```typescript
/**
 * Comprehensive filter for querying tasks.
 * All fields are optional. Multiple filters are AND-ed together.
 * Array fields use IN semantics (task matches if value is in the array).
 */
interface TaskFilter {
  /** Full-text search across title + description */
  search?: string;

  /** Filter by project(s) */
  project_ids?: string[];

  /** Filter by sprint(s) */
  sprint_ids?: string[];

  /** Filter by board column(s) */
  board_column_ids?: string[];

  /** Filter by status(es) */
  statuses?: TaskStatus[];

  /** Filter by priority(ies) */
  priorities?: TaskPriority[];

  /** Filter by assignee(s) — pass empty array for unassigned */
  assignee_ids?: string[];

  /** Filter by label(s) — task must have ALL specified labels */
  label_ids?: string[];

  /** Filter by creator */
  creator_id?: string;

  /** Filter by parent task (null = top-level only) */
  parent_task_id?: string | null;

  /** Due date range — inclusive start */
  due_date_from?: string;

  /** Due date range — inclusive end */
  due_date_to?: string;

  /** Created date range — inclusive start */
  created_from?: string;

  /** Created date range — inclusive end */
  created_to?: string;

  /** Include archived tasks (default: false) */
  include_archived?: boolean;

  /** Minimum story points */
  story_points_min?: number;

  /** Maximum story points */
  story_points_max?: number;

  /** Has any dependencies */
  has_dependencies?: boolean;

  /** Has time entries */
  has_time_entries?: boolean;

  /** Sort field */
  sort_by?: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'title' | 'story_points' | 'list_position';

  /** Sort direction */
  sort_dir?: 'asc' | 'desc';

  /** Cursor-based pagination — task ID to start after */
  cursor?: string;

  /** Page size (default: 50, max: 200) */
  limit?: number;
}
```

### Project

```typescript
/**
 * A project groups related tasks and provides shared configuration.
 *
 * Projects define the task key prefix (e.g., "PROJ" → "PROJ-1", "PROJ-2"),
 * default workflow, board configuration, and access permissions.
 */
interface Project {
  /** Unique project identifier */
  id: string;

  /** Tenant this project belongs to */
  tenant_id: string;

  /** Project name — unique within tenant, 1-200 characters */
  name: string;

  /** Project description (Markdown) */
  description: string | null;

  /**
   * Task key prefix (e.g., "PROJ").
   * Must be unique within tenant, 2-10 uppercase alphanumeric characters.
   */
  key_prefix: string;

  /** Current incrementing counter for task keys */
  key_counter: number;

  /** Project status */
  status: ProjectStatus;

  /** Project owner (user ID) */
  owner_id: string;

  /** Default board ID for this project */
  default_board_id: string | null;

  /** Project color for UI display (hex color code) */
  color: string;

  /** Project icon (emoji or icon identifier) */
  icon: string | null;

  /**
   * Custom workflow configuration.
   * Overrides default status transitions for this project's tasks.
   */
  workflow_config: WorkflowConfig | null;

  /**
   * Custom field schema definition.
   * Defines available custom fields for tasks in this project.
   */
  custom_field_schema: CustomFieldDefinition[];

  /**
   * Project-level permissions.
   * Controls who can view, create, edit, and manage tasks.
   */
  permissions: ProjectPermissions;

  /** Template ID this project was created from (null if not from template) */
  template_id: string | null;

  /** Whether this project can be used as a template */
  is_template: boolean;

  /** ISO 8601 creation timestamp */
  created_at: string;

  /** ISO 8601 last-update timestamp */
  updated_at: string;
}

/**
 * Custom workflow configuration for a project.
 * Defines which statuses are available and valid transitions.
 */
interface WorkflowConfig {
  /** Available statuses for tasks in this project */
  statuses: WorkflowStatus[];

  /** Valid transitions between statuses */
  transitions: WorkflowTransition[];
}

interface WorkflowStatus {
  /** Status key (e.g., "in_qa") */
  key: string;

  /** Display name (e.g., "In QA") */
  label: string;

  /** Category for grouping: not_started, in_progress, completed, cancelled */
  category: 'not_started' | 'in_progress' | 'completed' | 'cancelled';

  /** Color for UI display */
  color: string;
}

interface WorkflowTransition {
  /** Source status key */
  from: string;

  /** Target status key */
  to: string;

  /** Optional: required role to perform this transition */
  required_role?: string;
}

/**
 * Custom field definition for a project.
 * Defines a structured field that can be set on tasks within the project.
 */
interface CustomFieldDefinition {
  /** Field key (used in task.custom_fields) */
  key: string;

  /** Display label */
  label: string;

  /** Field type */
  type: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'checkbox' | 'url' | 'user';

  /** Whether this field is required on task creation */
  required: boolean;

  /** Default value */
  default_value?: unknown;

  /** Options for select/multi_select types */
  options?: { value: string; label: string; color?: string }[];

  /** Validation rules */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    min_length?: number;
    max_length?: number;
  };
}

/**
 * Project-level permissions configuration.
 * Uses a role-based model: owner > admin > member > viewer.
 */
interface ProjectPermissions {
  /** User IDs with admin access (full project management) */
  admin_ids: string[];

  /** User IDs with member access (create/edit tasks) */
  member_ids: string[];

  /** User IDs with viewer access (read-only) */
  viewer_ids: string[];

  /** Whether this project is visible to all tenant members */
  is_public: boolean;

  /** Role-based access rules (maps roles from @mcv/iam to project roles) */
  role_mappings: { iam_role: string; project_role: 'admin' | 'member' | 'viewer' }[];
}
```

### Sprint

```typescript
/**
 * A time-boxed iteration for Scrum-style development.
 *
 * Sprints have a fixed start/end date and contain a subset of tasks
 * from the project backlog. Velocity is computed from completed story points.
 */
interface Sprint {
  /** Unique sprint identifier */
  id: string;

  /** Tenant this sprint belongs to */
  tenant_id: string;

  /** Project this sprint belongs to */
  project_id: string;

  /** Sprint name (e.g., "Sprint 14" or "Feb 2026 - Week 1") */
  name: string;

  /** Sprint goal — what the team aims to accomplish */
  goal: string | null;

  /** Sprint status */
  status: SprintStatus;

  /** Sprint start date (inclusive) */
  start_date: string;

  /** Sprint end date (inclusive) */
  end_date: string;

  /**
   * Total story points committed at sprint start.
   * Captured when sprint moves to "active" status.
   */
  committed_points: number;

  /**
   * Total story points completed when sprint ends.
   * Captured when sprint moves to "completed" status.
   */
  completed_points: number;

  /**
   * Sprint velocity (completed_points / committed_points).
   * Null until sprint is completed.
   */
  velocity: number | null;

  /**
   * Sprint retrospective notes (Markdown).
   * Captured after sprint completion.
   */
  retrospective: SprintRetrospective | null;

  /** Ordering position among sprints in the project */
  position: number;

  /** ISO 8601 creation timestamp */
  created_at: string;

  /** ISO 8601 last-update timestamp */
  updated_at: string;
}

/**
 * Structured retrospective data for a completed sprint.
 */
interface SprintRetrospective {
  /** What went well */
  went_well: string[];

  /** What could be improved */
  to_improve: string[];

  /** Action items for next sprint */
  action_items: string[];

  /** Additional notes */
  notes: string | null;
}

interface SprintCreate {
  project_id: string;
  name: string;
  goal?: string | null;
  start_date: string;
  end_date: string;
}
```

### Board

```typescript
/**
 * A board represents a visual layout for organizing tasks into columns.
 *
 * Boards are typically Kanban-style with configurable columns,
 * WIP limits, and optional swimlanes.
 */
interface Board {
  /** Unique board identifier */
  id: string;

  /** Tenant this board belongs to */
  tenant_id: string;

  /** Project this board belongs to (null for cross-project boards) */
  project_id: string | null;

  /** Board name */
  name: string;

  /** Board description */
  description: string | null;

  /** Ordered list of columns */
  columns: BoardColumn[];

  /**
   * Swimlane configuration.
   * Null means no swimlanes. Otherwise, tasks within each column
   * are grouped by the specified field.
   */
  swimlane_field: 'assignee' | 'priority' | 'label' | null;

  /** Default filter applied to the board */
  default_filter: TaskFilter | null;

  /** Whether this board is the default for its project */
  is_default: boolean;

  /** ISO 8601 creation timestamp */
  created_at: string;

  /** ISO 8601 last-update timestamp */
  updated_at: string;
}

/**
 * A single column on a board.
 *
 * Each column maps to a task status (or a custom grouping).
 * Columns have optional WIP (Work In Progress) limits to enforce
 * flow-based development practices.
 */
interface BoardColumn {
  /** Unique column identifier */
  id: string;

  /** Board this column belongs to */
  board_id: string;

  /** Column display name */
  name: string;

  /**
   * Task status that maps to this column.
   * When a task is moved to this column, its status is updated accordingly.
   * Multiple columns can map to the same status (e.g., sub-columns).
   */
  mapped_status: TaskStatus | null;

  /**
   * Maximum number of tasks allowed in this column (WIP limit).
   * Null means no limit. Moving a task into a full column is blocked
   * unless the user has admin permissions.
   */
  wip_limit: number | null;

  /** Current task count in this column (computed, read-only) */
  task_count: number;

  /** Column position (0-indexed, left to right) */
  position: number;

  /** Column color for UI display */
  color: string;

  /** Whether this column is collapsed in the board view */
  is_collapsed: boolean;
}
```

### TaskDependency

```typescript
/**
 * A directional dependency link between two tasks.
 *
 * Dependencies encode relationships like "Task A blocks Task B" or
 * "Task C is related to Task D". The system enforces acyclicity
 * for blocking dependencies and computes critical paths.
 */
interface TaskDependency {
  /** Unique dependency identifier */
  id: string;

  /** Tenant (for RLS) */
  tenant_id: string;

  /** The source task (the one that blocks/relates) */
  source_task_id: string;

  /** The target task (the one that is blocked/related) */
  target_task_id: string;

  /** Type of dependency relationship */
  dependency_type: DependencyType;

  /**
   * Lag time in days (for predecessor/successor relationships).
   * Positive = target starts N days after source completes.
   * Negative = target can start N days before source completes.
   * Zero = target starts when source completes.
   */
  lag_days: number;

  /** User who created this dependency */
  created_by: string;

  /** ISO 8601 creation timestamp */
  created_at: string;
}

enum DependencyType {
  /** Source task must be completed before target can start */
  BLOCKS = 'blocks',

  /** Source task is blocked by target task */
  BLOCKED_BY = 'blocked_by',

  /** Tasks are related but not blocking */
  RELATES_TO = 'relates_to',

  /** Source is a duplicate of target */
  DUPLICATES = 'duplicates',
}
```

### TimeEntry

```typescript
/**
 * A time tracking entry logged against a task.
 *
 * Supports both manual time entry and timer-based tracking.
 * Time entries can be marked as billable for invoicing integration.
 */
interface TimeEntry {
  /** Unique time entry identifier */
  id: string;

  /** Tenant (for RLS) */
  tenant_id: string;

  /** Task this time was logged against */
  task_id: string;

  /** User who logged the time */
  user_id: string;

  /** Duration in minutes */
  duration_minutes: number;

  /** Description of work performed */
  description: string | null;

  /** Date the work was performed (YYYY-MM-DD) */
  work_date: string;

  /** How this entry was created */
  entry_type: TimeEntryType;

  /** Whether this time is billable */
  is_billable: boolean;

  /**
   * Billing rate override (per hour, in cents).
   * Null uses the default rate from the project or user settings.
   */
  billing_rate: number | null;

  /** Timer start timestamp (for timer-based entries) */
  timer_started_at: string | null;

  /** Timer stop timestamp (for timer-based entries) */
  timer_stopped_at: string | null;

  /** ISO 8601 creation timestamp */
  created_at: string;

  /** ISO 8601 last-update timestamp */
  updated_at: string;
}

enum TimeEntryType {
  /** Manually entered duration */
  MANUAL = 'manual',

  /** Recorded via start/stop timer */
  TIMER = 'timer',

  /** Imported from external system */
  IMPORTED = 'imported',
}
```

### TaskAutomation

```typescript
/**
 * An automation rule that fires when specific conditions are met.
 *
 * Automations follow a trigger → condition → action pipeline.
 * They execute asynchronously after the triggering mutation commits.
 */
interface TaskAutomation {
  /** Unique automation identifier */
  id: string;

  /** Tenant (for RLS) */
  tenant_id: string;

  /** Project this automation applies to (null for tenant-wide) */
  project_id: string | null;

  /** Human-readable name for this automation */
  name: string;

  /** Description of what this automation does */
  description: string | null;

  /** Whether this automation is currently active */
  is_enabled: boolean;

  /** Trigger that starts this automation */
  trigger: AutomationTrigger;

  /** Conditions that must be met (all must pass — AND logic) */
  conditions: AutomationCondition[];

  /** Actions to execute when trigger fires and conditions pass */
  actions: AutomationAction[];

  /** Number of times this automation has fired */
  execution_count: number;

  /** Timestamp of last execution */
  last_executed_at: string | null;

  /** User who created this automation */
  created_by: string;

  /** ISO 8601 creation timestamp */
  created_at: string;

  /** ISO 8601 last-update timestamp */
  updated_at: string;
}

/**
 * Defines when an automation should fire.
 */
interface AutomationTrigger {
  /** Type of event that triggers this automation */
  type: AutomationTriggerType;

  /**
   * Additional trigger configuration.
   * Varies by trigger type.
   */
  config: Record<string, unknown>;
}

enum AutomationTriggerType {
  /** Task status changed */
  STATUS_CHANGE = 'status_change',

  /** Task assignee changed */
  ASSIGNMENT_CHANGE = 'assignment_change',

  /** Task due date passed (checked on schedule) */
  DUE_DATE = 'due_date',

  /** Task priority changed */
  PRIORITY_CHANGE = 'priority_change',

  /** Task label added or removed */
  LABEL_CHANGE = 'label_change',

  /** Comment added to task */
  COMMENT_ADDED = 'comment_added',

  /** Task created */
  TASK_CREATED = 'task_created',

  /** Task moved on board */
  TASK_MOVED = 'task_moved',

  /** Scheduled (cron expression) */
  SCHEDULED = 'scheduled',

  /** Custom webhook trigger */
  CUSTOM = 'custom',
}

/**
 * A condition that must be met for the automation to execute.
 */
interface AutomationCondition {
  /** Field to evaluate */
  field: string;

  /** Comparison operator */
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'is_empty' | 'is_not_empty';

  /** Value to compare against */
  value: unknown;
}

/**
 * An action to execute when automation conditions are met.
 */
interface AutomationAction {
  /** Type of action */
  type: 'update_field' | 'add_label' | 'remove_label' | 'assign_user' | 'unassign_user' | 'add_comment' | 'send_notification' | 'call_webhook' | 'create_subtask' | 'move_to_column' | 'change_priority';

  /**
   * Action configuration.
   * Structure depends on action type.
   */
  config: Record<string, unknown>;
}
```

### TaskComment

```typescript
/**
 * A comment on a task.
 *
 * Comments support Markdown formatting, @mentions (resolved to user IDs),
 * and can optionally include file attachments.
 */
interface TaskComment {
  /** Unique comment identifier */
  id: string;

  /** Tenant (for RLS) */
  tenant_id: string;

  /** Task this comment belongs to */
  task_id: string;

  /** User who authored this comment */
  author_id: string;

  /**
   * Comment content in Markdown.
   * @mentions are formatted as `@[Display Name](user:USER_ID)`.
   */
  content: string;

  /** User IDs mentioned in this comment */
  mentioned_user_ids: string[];

  /** Attachment IDs included with this comment */
  attachment_ids: string[];

  /** Whether this comment has been edited */
  is_edited: boolean;

  /** Parent comment ID for threaded replies (null for top-level) */
  parent_comment_id: string | null;

  /** ISO 8601 creation timestamp */
  created_at: string;

  /** ISO 8601 last-update timestamp */
  updated_at: string;
}
```

### TaskAttachment

```typescript
/**
 * A file attachment associated with a task.
 *
 * Files are stored in Supabase Storage under the tenant's bucket.
 * The actual binary is NOT stored in the database.
 */
interface TaskAttachment {
  /** Unique attachment identifier */
  id: string;

  /** Tenant (for RLS) */
  tenant_id: string;

  /** Task this attachment belongs to */
  task_id: string;

  /** User who uploaded this attachment */
  uploaded_by: string;

  /** Original filename */
  filename: string;

  /** MIME type */
  content_type: string;

  /** File size in bytes */
  size_bytes: number;

  /** Storage path in Supabase Storage */
  storage_path: string;

  /** Thumbnail URL for image attachments (null for non-images) */
  thumbnail_url: string | null;

  /** ISO 8601 upload timestamp */
  created_at: string;
}
```

### TaskReport

```typescript
/**
 * Report definition and output.
 *
 * Reports are configurable analytics views that can be saved,
 * shared, and scheduled for periodic generation.
 */
interface TaskReport {
  /** Unique report identifier */
  id: string;

  /** Tenant (for RLS) */
  tenant_id: string;

  /** Report name */
  name: string;

  /** Report type */
  type: 'velocity' | 'burndown' | 'burnup' | 'cycle_time' | 'lead_time' | 'throughput' | 'workload' | 'cumulative_flow' | 'custom';

  /** Project scope (null for cross-project reports) */
  project_id: string | null;

  /** Filter applied to tasks included in this report */
  filter: TaskFilter;

  /** Date range for the report */
  date_range: {
    from: string;
    to: string;
  };

  /** Report configuration (varies by type) */
  config: Record<string, unknown>;

  /** User who created this report */
  created_by: string;

  /** Whether this report is shared with the team */
  is_shared: boolean;

  /** ISO 8601 creation timestamp */
  created_at: string;

  /** ISO 8601 last-update timestamp */
  updated_at: string;
}

/** Velocity data for a single sprint */
interface VelocityData {
  sprint_id: string;
  sprint_name: string;
  start_date: string;
  end_date: string;
  committed_points: number;
  completed_points: number;
  velocity_ratio: number;
  tasks_committed: number;
  tasks_completed: number;
}

/** Burndown/burnup chart data for a single day */
interface BurndownData {
  date: string;
  remaining_points: number;
  completed_points: number;
  ideal_remaining: number;
  scope_change: number;
  total_scope: number;
}

/** Cycle time data for a single task */
interface CycleTimeData {
  task_id: string;
  task_key: string;
  title: string;
  story_points: number | null;
  /** Time from first "in_progress" to "done" in hours */
  cycle_time_hours: number;
  /** Time from creation to "done" in hours */
  lead_time_hours: number;
  /** Time spent in each status (status → hours) */
  time_in_status: Record<string, number>;
  completed_at: string;
}

/** Workload data for a single assignee */
interface WorkloadData {
  user_id: string;
  user_name: string;
  assigned_tasks: number;
  total_story_points: number;
  tasks_in_progress: number;
  tasks_completed: number;
  tracked_hours: number;
  estimated_hours: number;
  utilization_percent: number;
}
```

### TaskView

```typescript
/**
 * A saved view configuration.
 *
 * Views persist filter, sort, grouping, and display settings
 * so users can quickly switch between common task perspectives.
 */
interface TaskView {
  /** Unique view identifier */
  id: string;

  /** Tenant (for RLS) */
  tenant_id: string;

  /** Project scope (null for cross-project views) */
  project_id: string | null;

  /** View name */
  name: string;

  /** View type (determines rendering) */
  type: ViewType;

  /** Saved filter configuration */
  filter: TaskFilter;

  /**
   * Display settings specific to the view type.
   * - Kanban: { swimlane_field, show_labels, show_avatars, card_fields }
   * - Table: { visible_columns, column_widths, row_height }
   * - Gantt: { zoom_level, show_dependencies, show_milestones }
   * - Calendar: { color_by, show_weekends }
   * - List: { group_by, show_subtasks, compact }
   */
  display_config: Record<string, unknown>;

  /** User who created this view */
  created_by: string;

  /** Whether this view is shared with the team */
  is_shared: boolean;

  /** Whether this is the default view for the project */
  is_default: boolean;

  /** Icon for the view (emoji or icon identifier) */
  icon: string | null;

  /** ISO 8601 creation timestamp */
  created_at: string;

  /** ISO 8601 last-update timestamp */
  updated_at: string;
}

enum ViewType {
  KANBAN = 'kanban',
  LIST = 'list',
  TABLE = 'table',
  GANTT = 'gantt',
  CALENDAR = 'calendar',
}
```

### Milestone & Checklist

```typescript
/**
 * A project milestone — a significant target date or achievement.
 */
interface Milestone {
  /** Unique milestone identifier */
  id: string;

  /** Tenant (for RLS) */
  tenant_id: string;

  /** Project this milestone belongs to */
  project_id: string;

  /** Milestone name */
  name: string;

  /** Milestone description */
  description: string | null;

  /** Target date */
  target_date: string;

  /** Whether this milestone has been reached */
  is_completed: boolean;

  /** Timestamp when milestone was completed */
  completed_at: string | null;

  /**
   * Task IDs that must be completed for this milestone.
   * Milestone progress = completed tasks / total tasks.
   */
  task_ids: string[];

  /** Computed: progress percentage (0-100) */
  progress: number;

  /** ISO 8601 creation timestamp */
  created_at: string;

  /** ISO 8601 last-update timestamp */
  updated_at: string;
}

/**
 * A checklist within a task — lightweight sub-items without full task overhead.
 */
interface Checklist {
  /** Unique checklist identifier */
  id: string;

  /** Task this checklist belongs to */
  task_id: string;

  /** Checklist title */
  title: string;

  /** Ordered list of items */
  items: ChecklistItem[];

  /** Position among checklists in the task */
  position: number;
}

/**
 * A single item in a checklist.
 */
interface ChecklistItem {
  /** Unique item identifier */
  id: string;

  /** Item text */
  text: string;

  /** Whether this item is completed */
  is_completed: boolean;

  /** User who completed this item */
  completed_by: string | null;

  /** Timestamp when item was completed */
  completed_at: string | null;

  /** Position within the checklist */
  position: number;

  /** Optional assignee for this checklist item */
  assignee_id: string | null;

  /** Optional due date for this checklist item */
  due_date: string | null;
}
```

### Enums

```typescript
enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NONE = 'none',
}

enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

enum SprintStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

enum ProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}
```

---

## Database Schemas

All tables use UUID v7 primary keys, include `tenant_id` for RLS, and have `created_at`/`updated_at` timestamps with automatic triggers.

### tasks

The primary table. Heavily indexed for the diverse query patterns (filter by status, assignee, project, date ranges, full-text search).

```typescript
import { pgTable, uuid, text, timestamp, integer, real, boolean, jsonb, index } from 'drizzle-orm/pg-core';

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  project_id: uuid('project_id').references(() => projects.id),
  sprint_id: uuid('sprint_id').references(() => sprints.id),
  board_column_id: uuid('board_column_id').references(() => boardColumns.id),
  column_position: real('column_position'),
  parent_task_id: uuid('parent_task_id').references(() => tasks.id),

  task_key: text('task_key').notNull(),
  title: text('title').notNull(),
  description: text('description'),

  status: text('status').notNull().default('backlog'),
  priority: text('priority').notNull().default('medium'),
  story_points: integer('story_points'),

  due_date: text('due_date'),
  start_date: text('start_date'),

  assignee_ids: jsonb('assignee_ids').notNull().default([]),
  creator_id: uuid('creator_id').notNull().references(() => users.id),
  label_ids: jsonb('label_ids').notNull().default([]),

  custom_fields: jsonb('custom_fields').notNull().default({}),

  estimated_minutes: integer('estimated_minutes'),
  tracked_minutes: integer('tracked_minutes').notNull().default(0),

  subtask_count: integer('subtask_count').notNull().default(0),
  subtask_done_count: integer('subtask_done_count').notNull().default(0),
  comment_count: integer('comment_count').notNull().default(0),
  attachment_count: integer('attachment_count').notNull().default(0),

  depth: integer('depth').notNull().default(0),
  list_position: real('list_position').notNull().default(0),

  is_archived: boolean('is_archived').notNull().default(false),

  completed_at: timestamp('completed_at', { withTimezone: true }),
  started_at: timestamp('started_at', { withTimezone: true }),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Primary query indexes
  tenantIdx: index('tasks_tenant_id_idx').on(table.tenant_id),
  projectIdx: index('tasks_project_id_idx').on(table.tenant_id, table.project_id),
  sprintIdx: index('tasks_sprint_id_idx').on(table.tenant_id, table.sprint_id),
  statusIdx: index('tasks_status_idx').on(table.tenant_id, table.status),
  assigneeIdx: index('tasks_assignee_idx').using('gin', table.assignee_ids),
  parentIdx: index('tasks_parent_id_idx').on(table.parent_task_id),
  dueDateIdx: index('tasks_due_date_idx').on(table.tenant_id, table.due_date),
  boardColumnIdx: index('tasks_board_column_idx').on(table.board_column_id, table.column_position),
  taskKeyIdx: index('tasks_task_key_idx').on(table.tenant_id, table.task_key).unique(),
  listPositionIdx: index('tasks_list_position_idx').on(table.tenant_id, table.project_id, table.list_position),

  // Full-text search index (created via raw SQL migration)
  // CREATE INDEX tasks_fts_idx ON tasks USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));
}));
```

### projects

```typescript
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),

  name: text('name').notNull(),
  description: text('description'),
  key_prefix: text('key_prefix').notNull(),
  key_counter: integer('key_counter').notNull().default(0),

  status: text('status').notNull().default('active'),
  owner_id: uuid('owner_id').notNull().references(() => users.id),
  default_board_id: uuid('default_board_id'),

  color: text('color').notNull().default('#6366f1'),
  icon: text('icon'),

  workflow_config: jsonb('workflow_config'),
  custom_field_schema: jsonb('custom_field_schema').notNull().default([]),
  permissions: jsonb('permissions').notNull().default({}),

  template_id: uuid('template_id'),
  is_template: boolean('is_template').notNull().default(false),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('projects_tenant_id_idx').on(table.tenant_id),
  keyPrefixIdx: index('projects_key_prefix_idx').on(table.tenant_id, table.key_prefix).unique(),
  statusIdx: index('projects_status_idx').on(table.tenant_id, table.status),
}));
```

### sprints

```typescript
export const sprints = pgTable('sprints', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  project_id: uuid('project_id').notNull().references(() => projects.id),

  name: text('name').notNull(),
  goal: text('goal'),
  status: text('status').notNull().default('planning'),

  start_date: text('start_date').notNull(),
  end_date: text('end_date').notNull(),

  committed_points: integer('committed_points').notNull().default(0),
  completed_points: integer('completed_points').notNull().default(0),
  velocity: real('velocity'),

  retrospective: jsonb('retrospective'),
  position: integer('position').notNull().default(0),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  projectIdx: index('sprints_project_id_idx').on(table.tenant_id, table.project_id),
  statusIdx: index('sprints_status_idx').on(table.tenant_id, table.project_id, table.status),
}));
```

### sprint_tasks

Junction table for the many-to-many relationship between sprints and tasks. A task can appear in multiple sprints (if moved between sprints).

```typescript
export const sprintTasks = pgTable('sprint_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  sprint_id: uuid('sprint_id').notNull().references(() => sprints.id, { onDelete: 'cascade' }),
  task_id: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),

  /** Story points at the time the task was added to the sprint */
  points_at_add: integer('points_at_add'),

  /** Whether the task was added after sprint start (scope change) */
  is_scope_change: boolean('is_scope_change').notNull().default(false),

  added_at: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sprintIdx: index('sprint_tasks_sprint_idx').on(table.sprint_id),
  taskIdx: index('sprint_tasks_task_idx').on(table.task_id),
  uniqueIdx: index('sprint_tasks_unique_idx').on(table.sprint_id, table.task_id).unique(),
}));
```

### boards & board_columns

```typescript
export const boards = pgTable('boards', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  project_id: uuid('project_id').references(() => projects.id),

  name: text('name').notNull(),
  description: text('description'),

  swimlane_field: text('swimlane_field'),
  default_filter: jsonb('default_filter'),
  is_default: boolean('is_default').notNull().default(false),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('boards_tenant_id_idx').on(table.tenant_id),
  projectIdx: index('boards_project_id_idx').on(table.tenant_id, table.project_id),
}));

export const boardColumns = pgTable('board_columns', {
  id: uuid('id').primaryKey().defaultRandom(),
  board_id: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  mapped_status: text('mapped_status'),
  wip_limit: integer('wip_limit'),
  task_count: integer('task_count').notNull().default(0),
  position: integer('position').notNull(),
  color: text('color').notNull().default('#e5e7eb'),
  is_collapsed: boolean('is_collapsed').notNull().default(false),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  boardIdx: index('board_columns_board_idx').on(table.board_id, table.position),
}));
```

### task_dependencies

```typescript
export const taskDependencies = pgTable('task_dependencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),

  source_task_id: uuid('source_task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  target_task_id: uuid('target_task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),

  dependency_type: text('dependency_type').notNull(),
  lag_days: integer('lag_days').notNull().default(0),

  created_by: uuid('created_by').notNull().references(() => users.id),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sourceIdx: index('task_deps_source_idx').on(table.source_task_id),
  targetIdx: index('task_deps_target_idx').on(table.target_task_id),
  uniqueIdx: index('task_deps_unique_idx').on(table.source_task_id, table.target_task_id, table.dependency_type).unique(),
}));
```

### time_entries

```typescript
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  task_id: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id),

  duration_minutes: integer('duration_minutes').notNull(),
  description: text('description'),
  work_date: text('work_date').notNull(),

  entry_type: text('entry_type').notNull().default('manual'),
  is_billable: boolean('is_billable').notNull().default(false),
  billing_rate: integer('billing_rate'),

  timer_started_at: timestamp('timer_started_at', { withTimezone: true }),
  timer_stopped_at: timestamp('timer_stopped_at', { withTimezone: true }),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskIdx: index('time_entries_task_idx').on(table.task_id),
  userIdx: index('time_entries_user_idx').on(table.tenant_id, table.user_id),
  workDateIdx: index('time_entries_work_date_idx').on(table.tenant_id, table.work_date),
  billableIdx: index('time_entries_billable_idx').on(table.tenant_id, table.is_billable),
}));
```

### task_comments

```typescript
export const taskComments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  task_id: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  author_id: uuid('author_id').notNull().references(() => users.id),

  content: text('content').notNull(),
  mentioned_user_ids: jsonb('mentioned_user_ids').notNull().default([]),
  attachment_ids: jsonb('attachment_ids').notNull().default([]),

  is_edited: boolean('is_edited').notNull().default(false),
  parent_comment_id: uuid('parent_comment_id').references(() => taskComments.id),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskIdx: index('task_comments_task_idx').on(table.task_id, table.created_at),
  authorIdx: index('task_comments_author_idx').on(table.author_id),
}));
```

### task_attachments

```typescript
export const taskAttachments = pgTable('task_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  task_id: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  uploaded_by: uuid('uploaded_by').notNull().references(() => users.id),

  filename: text('filename').notNull(),
  content_type: text('content_type').notNull(),
  size_bytes: integer('size_bytes').notNull(),
  storage_path: text('storage_path').notNull(),
  thumbnail_url: text('thumbnail_url'),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskIdx: index('task_attachments_task_idx').on(table.task_id),
}));
```

### task_labels

```typescript
export const taskLabels = pgTable('task_labels', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  project_id: uuid('project_id').references(() => projects.id),

  name: text('name').notNull(),
  color: text('color').notNull().default('#6366f1'),
  description: text('description'),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('task_labels_tenant_idx').on(table.tenant_id),
  projectIdx: index('task_labels_project_idx').on(table.tenant_id, table.project_id),
  nameIdx: index('task_labels_name_idx').on(table.tenant_id, table.project_id, table.name).unique(),
}));
```

### task_automations

```typescript
export const taskAutomations = pgTable('task_automations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  project_id: uuid('project_id').references(() => projects.id),

  name: text('name').notNull(),
  description: text('description'),
  is_enabled: boolean('is_enabled').notNull().default(true),

  trigger: jsonb('trigger').notNull(),
  conditions: jsonb('conditions').notNull().default([]),
  actions: jsonb('actions').notNull(),

  execution_count: integer('execution_count').notNull().default(0),
  last_executed_at: timestamp('last_executed_at', { withTimezone: true }),

  created_by: uuid('created_by').notNull().references(() => users.id),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('task_automations_tenant_idx').on(table.tenant_id),
  projectIdx: index('task_automations_project_idx').on(table.tenant_id, table.project_id),
  enabledIdx: index('task_automations_enabled_idx').on(table.tenant_id, table.is_enabled),
}));
```

### task_watchers

```typescript
export const taskWatchers = pgTable('task_watchers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  task_id: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskIdx: index('task_watchers_task_idx').on(table.task_id),
  uniqueIdx: index('task_watchers_unique_idx').on(table.task_id, table.user_id).unique(),
}));
```

### task_activity (Audit Log)

```typescript
export const taskActivity = pgTable('task_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  task_id: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').references(() => users.id),

  /** Activity type: created, updated, status_changed, assigned, commented, etc. */
  activity_type: text('activity_type').notNull(),

  /** Human-readable summary of the change */
  summary: text('summary').notNull(),

  /**
   * Detailed change data.
   * For field updates: { field: "status", old: "todo", new: "in_progress" }
   * For assignments: { added: ["user1"], removed: ["user2"] }
   */
  details: jsonb('details').notNull().default({}),

  /** Whether this activity was triggered by an automation (vs. human) */
  is_automated: boolean('is_automated').notNull().default(false),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskIdx: index('task_activity_task_idx').on(table.task_id, table.created_at),
  tenantIdx: index('task_activity_tenant_idx').on(table.tenant_id, table.created_at),
}));
```

### Row-Level Security (RLS)

All tables enforce tenant isolation through Supabase RLS policies:

```sql
-- Example RLS policy for tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: users can only see tasks in their tenant
CREATE POLICY "tasks_tenant_isolation" ON tasks
  FOR ALL
  USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Project-level access: users with project permissions can see project tasks
CREATE POLICY "tasks_project_access" ON tasks
  FOR SELECT
  USING (
    tenant_id = auth.jwt() ->> 'tenant_id'
    AND (
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = tasks.project_id
        AND (
          p.permissions->>'is_public' = 'true'
          OR p.owner_id = auth.uid()
          OR p.permissions->'admin_ids' ? auth.uid()::text
          OR p.permissions->'member_ids' ? auth.uid()::text
          OR p.permissions->'viewer_ids' ? auth.uid()::text
        )
      )
    )
  );

-- Write access: only project members and admins can modify tasks
CREATE POLICY "tasks_write_access" ON tasks
  FOR UPDATE
  USING (
    tenant_id = auth.jwt() ->> 'tenant_id'
    AND (
      project_id IS NULL
      OR creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = tasks.project_id
        AND (
          p.owner_id = auth.uid()
          OR p.permissions->'admin_ids' ? auth.uid()::text
          OR p.permissions->'member_ids' ? auth.uid()::text
        )
      )
    )
  );
```

### Materialized Views (Analytics)

For expensive analytics queries, materialized views are refreshed periodically:

```sql
-- Daily task metrics materialized view
CREATE MATERIALIZED VIEW task_daily_metrics AS
SELECT
  tenant_id,
  project_id,
  date_trunc('day', created_at) AS day,
  COUNT(*) FILTER (WHERE status = 'done') AS completed_count,
  COUNT(*) FILTER (WHERE status NOT IN ('done', 'cancelled')) AS open_count,
  COALESCE(SUM(story_points) FILTER (WHERE status = 'done'), 0) AS completed_points,
  COALESCE(SUM(story_points) FILTER (WHERE status NOT IN ('done', 'cancelled')), 0) AS open_points,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600)
    FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) AS avg_cycle_time_hours
FROM tasks
WHERE NOT is_archived
GROUP BY tenant_id, project_id, date_trunc('day', created_at);

-- Refresh daily via pg_cron
SELECT cron.schedule('refresh_task_metrics', '0 2 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY task_daily_metrics');
```

### Database Triggers

```sql
-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-increment task key counter and set task_key
CREATE OR REPLACE FUNCTION set_task_key()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  counter INTEGER;
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    UPDATE projects
    SET key_counter = key_counter + 1
    WHERE id = NEW.project_id
    RETURNING key_prefix, key_counter INTO prefix, counter;

    NEW.task_key = prefix || '-' || counter;
  ELSE
    -- Standalone tasks get a tenant-level key
    NEW.task_key = 'TASK-' || substr(NEW.id::text, 1, 8);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_set_key
  BEFORE INSERT ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_task_key();

-- Auto-update parent task subtask counts
CREATE OR REPLACE FUNCTION update_subtask_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.parent_task_id IS NOT NULL THEN
      UPDATE tasks SET
        subtask_count = (
          SELECT COUNT(*) FROM tasks WHERE parent_task_id = NEW.parent_task_id
        ),
        subtask_done_count = (
          SELECT COUNT(*) FROM tasks
          WHERE parent_task_id = NEW.parent_task_id AND status = 'done'
        )
      WHERE id = NEW.parent_task_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.parent_task_id IS NOT NULL THEN
      UPDATE tasks SET
        subtask_count = (
          SELECT COUNT(*) FROM tasks WHERE parent_task_id = OLD.parent_task_id
        ),
        subtask_done_count = (
          SELECT COUNT(*) FROM tasks
          WHERE parent_task_id = OLD.parent_task_id AND status = 'done'
        )
      WHERE id = OLD.parent_task_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_subtask_counts
  AFTER INSERT OR UPDATE OF status, parent_task_id OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_subtask_counts();

-- Auto-update tracked_minutes when time entries change
CREATE OR REPLACE FUNCTION update_tracked_minutes()
RETURNS TRIGGER AS $$
DECLARE
  target_task_id UUID;
BEGIN
  target_task_id := COALESCE(NEW.task_id, OLD.task_id);

  UPDATE tasks SET
    tracked_minutes = COALESCE(
      (SELECT SUM(duration_minutes) FROM time_entries WHERE task_id = target_task_id),
      0
    )
  WHERE id = target_task_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_entries_update_tracked
  AFTER INSERT OR UPDATE OR DELETE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_tracked_minutes();

-- Auto-update comment_count
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
DECLARE
  target_task_id UUID;
BEGIN
  target_task_id := COALESCE(NEW.task_id, OLD.task_id);

  UPDATE tasks SET
    comment_count = (SELECT COUNT(*) FROM task_comments WHERE task_id = target_task_id)
  WHERE id = target_task_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_update_count
  AFTER INSERT OR DELETE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Set completed_at and started_at timestamps on status changes
CREATE OR REPLACE FUNCTION track_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set started_at when first entering in_progress
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' AND NEW.started_at IS NULL THEN
    NEW.started_at = NOW();
  END IF;

  -- Set completed_at when entering done
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = NOW();
  END IF;

  -- Clear completed_at when reopened from done
  IF OLD.status = 'done' AND NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_status_timestamps
  BEFORE UPDATE OF status ON tasks
  FOR EACH ROW EXECUTE FUNCTION track_status_timestamps();
```

---

## Code Examples

### 1. Creating a Project with a Board

```typescript
import { ProjectService, BoardService } from '@mcv/operations/tasks';

const projectService = new ProjectService(ctx);
const boardService = new BoardService(ctx);

// Create the project
const project = await projectService.create({
  name: 'Website Redesign',
  description: 'Complete overhaul of the marketing website with new brand guidelines.',
  key_prefix: 'WEB',
  color: '#8b5cf6',
  icon: '🌐',
  permissions: {
    admin_ids: ['user-alice-id'],
    member_ids: ['user-bob-id', 'user-carol-id'],
    viewer_ids: [],
    is_public: false,
    role_mappings: [
      { iam_role: 'engineering', project_role: 'member' },
      { iam_role: 'design', project_role: 'member' },
    ],
  },
  custom_field_schema: [
    {
      key: 'component',
      label: 'Component',
      type: 'select',
      required: false,
      options: [
        { value: 'header', label: 'Header', color: '#3b82f6' },
        { value: 'hero', label: 'Hero Section', color: '#10b981' },
        { value: 'footer', label: 'Footer', color: '#f59e0b' },
        { value: 'nav', label: 'Navigation', color: '#ef4444' },
      ],
    },
    {
      key: 'design_link',
      label: 'Figma Link',
      type: 'url',
      required: false,
    },
  ],
});

// Create a board for the project
const board = await boardService.create({
  project_id: project.id,
  name: 'Development Board',
  is_default: true,
  columns: [
    { name: 'Backlog', mapped_status: 'backlog', color: '#94a3b8' },
    { name: 'To Do', mapped_status: 'todo', wip_limit: 10, color: '#60a5fa' },
    { name: 'In Progress', mapped_status: 'in_progress', wip_limit: 5, color: '#f59e0b' },
    { name: 'In Review', mapped_status: 'in_review', wip_limit: 3, color: '#a78bfa' },
    { name: 'Done', mapped_status: 'done', color: '#34d399' },
  ],
});

console.log(`Project created: ${project.key_prefix} (${project.id})`);
console.log(`Board created: ${board.name} with ${board.columns.length} columns`);
// Output:
// Project created: WEB (f47ac10b-58cc-4372-a567-0e02b2c3d479)
// Board created: Development Board with 5 columns
```

### 2. Creating and Managing Tasks

```typescript
import { TaskService } from '@mcv/operations/tasks';

const taskService = new TaskService(ctx);

// Create a parent task
const epicTask = await taskService.create({
  project_id: project.id,
  title: 'Implement new navigation system',
  description: `## Requirements\n\n- Responsive mega menu\n- Mobile hamburger menu\n- Keyboard accessibility\n- Search integration`,
  priority: 'high',
  story_points: 13,
  assignee_ids: ['user-alice-id'],
  label_ids: ['label-feature-id', 'label-frontend-id'],
  due_date: '2026-03-15',
  start_date: '2026-02-10',
  custom_fields: {
    component: 'nav',
    design_link: 'https://figma.com/file/xxx/navigation',
  },
});

console.log(`Created: ${epicTask.task_key} — ${epicTask.title}`);
// Output: Created: WEB-1 — Implement new navigation system

// Create subtasks
const subtasks = await Promise.all([
  taskService.create({
    project_id: project.id,
    parent_task_id: epicTask.id,
    title: 'Design mega menu component',
    priority: 'high',
    story_points: 5,
    assignee_ids: ['user-bob-id'],
  }),
  taskService.create({
    project_id: project.id,
    parent_task_id: epicTask.id,
    title: 'Implement mobile hamburger menu',
    priority: 'medium',
    story_points: 3,
    assignee_ids: ['user-carol-id'],
  }),
  taskService.create({
    project_id: project.id,
    parent_task_id: epicTask.id,
    title: 'Add keyboard navigation support',
    priority: 'medium',
    story_points: 3,
    assignee_ids: ['user-alice-id'],
  }),
  taskService.create({
    project_id: project.id,
    parent_task_id: epicTask.id,
    title: 'Integrate search into navigation',
    priority: 'low',
    story_points: 2,
    assignee_ids: ['user-bob-id'],
  }),
]);

console.log(`Created ${subtasks.length} subtasks under ${epicTask.task_key}`);
// Output: Created 4 subtasks under WEB-1

// Update task status
await taskService.update(subtasks[0].id, {
  status: 'in_progress',
});

// Bulk update — move multiple tasks to a sprint
await taskService.bulkUpdate(
  subtasks.map(t => t.id),
  { sprint_id: sprint.id },
);
```

### 3. Querying Tasks with Filters

```typescript
import { TaskService, type TaskFilter } from '@mcv/operations/tasks';

const taskService = new TaskService(ctx);

// Find all high-priority tasks assigned to Alice that are overdue
const overdueFilter: TaskFilter = {
  project_ids: [project.id],
  assignee_ids: ['user-alice-id'],
  priorities: ['critical', 'high'],
  statuses: ['todo', 'in_progress', 'in_review'],
  due_date_to: '2026-02-08', // yesterday
  sort_by: 'due_date',
  sort_dir: 'asc',
  limit: 20,
};

const overdueTasks = await taskService.list(overdueFilter);

console.log(`Found ${overdueTasks.items.length} overdue tasks:`);
for (const task of overdueTasks.items) {
  console.log(`  ${task.task_key} [${task.priority}] ${task.title} — due ${task.due_date}`);
}
// Output:
// Found 2 overdue tasks:
//   WEB-3 [high] Review design mockups — due 2026-02-05
//   WEB-7 [critical] Fix navigation regression — due 2026-02-07

// Full-text search
const searchResults = await taskService.list({
  search: 'responsive mega menu',
  project_ids: [project.id],
  limit: 10,
});

console.log(`Search found ${searchResults.items.length} tasks`);

// Cursor-based pagination
let cursor: string | undefined;
let allTasks: Task[] = [];

do {
  const page = await taskService.list({
    project_ids: [project.id],
    statuses: ['in_progress'],
    cursor,
    limit: 50,
  });

  allTasks = allTasks.concat(page.items);
  cursor = page.next_cursor ?? undefined;
} while (cursor);

console.log(`Total in-progress tasks: ${allTasks.length}`);
```

### 4. Sprint Planning and Velocity Tracking

```typescript
import { SprintService, TaskService, TaskReportService } from '@mcv/operations/tasks';

const sprintService = new SprintService(ctx);
const taskService = new TaskService(ctx);
const reportService = new TaskReportService(ctx);

// Create a new sprint
const sprint = await sprintService.create({
  project_id: project.id,
  name: 'Sprint 14',
  goal: 'Complete navigation system and begin hero section redesign',
  start_date: '2026-02-10',
  end_date: '2026-02-21',
});

// Add tasks to the sprint (from the project backlog)
const backlogTasks = await taskService.list({
  project_ids: [project.id],
  statuses: ['backlog', 'todo'],
  priorities: ['critical', 'high', 'medium'],
  sort_by: 'priority',
  sort_dir: 'asc',
  limit: 20,
});

// Select tasks for the sprint (team capacity: ~30 story points)
let totalPoints = 0;
const tasksToAdd: string[] = [];

for (const task of backlogTasks.items) {
  const points = task.story_points ?? 0;
  if (totalPoints + points <= 30) {
    tasksToAdd.push(task.id);
    totalPoints += points;
  }
}

await sprintService.addTasks(sprint.id, tasksToAdd);
console.log(`Added ${tasksToAdd.length} tasks (${totalPoints} points) to ${sprint.name}`);
// Output: Added 8 tasks (28 points) to Sprint 14

// Start the sprint
await sprintService.start(sprint.id);
console.log(`Sprint started! Committed points: ${totalPoints}`);

// ... during the sprint, tasks are completed ...

// Generate burndown data mid-sprint
const burndown = await reportService.burndown({
  sprint_id: sprint.id,
});

for (const day of burndown) {
  console.log(
    `${day.date}: ${day.remaining_points} pts remaining ` +
    `(ideal: ${day.ideal_remaining.toFixed(1)})`
  );
}
// Output:
// 2026-02-10: 28 pts remaining (ideal: 28.0)
// 2026-02-11: 25 pts remaining (ideal: 25.5)
// 2026-02-12: 22 pts remaining (ideal: 22.9)
// ...

// Complete the sprint
await sprintService.complete(sprint.id);

// Get velocity for the last 6 sprints
const velocityData = await reportService.velocity({
  project_id: project.id,
  sprint_count: 6,
});

console.log('Velocity trend:');
for (const v of velocityData) {
  console.log(
    `  ${v.sprint_name}: ${v.completed_points}/${v.committed_points} pts ` +
    `(${(v.velocity_ratio * 100).toFixed(0)}%)`
  );
}
// Output:
// Velocity trend:
//   Sprint 9: 18/24 pts (75%)
//   Sprint 10: 22/26 pts (85%)
//   Sprint 11: 20/22 pts (91%)
//   Sprint 12: 25/28 pts (89%)
//   Sprint 13: 27/30 pts (90%)
//   Sprint 14: 24/28 pts (86%)

// Save sprint retrospective
await sprintService.saveRetrospective(sprint.id, {
  went_well: [
    'Navigation system shipped on time',
    'Good collaboration between frontend and design',
    'Zero regressions from previous sprint',
  ],
  to_improve: [
    'Estimation for hero section tasks was too optimistic',
    'Code reviews took longer than expected',
  ],
  action_items: [
    'Break hero section into smaller tasks (max 5 points each)',
    'Set 24-hour SLA for code reviews',
  ],
  notes: 'Team morale is high. Consider increasing sprint capacity to 32 points.',
});
```

### 5. Time Tracking

```typescript
import { TimeTrackingService } from '@mcv/operations/tasks';

const timeService = new TimeTrackingService(ctx);

// Start a timer
const timer = await timeService.startTimer({
  task_id: 'task-web-1-id',
  description: 'Implementing mega menu dropdown animations',
  is_billable: true,
});

console.log(`Timer started at ${timer.timer_started_at}`);

// ... some time later ...

// Stop the timer
const entry = await timeService.stopTimer(timer.id);
console.log(`Logged ${entry.duration_minutes} minutes`);
// Output: Logged 47 minutes

// Manual time entry
await timeService.create({
  task_id: 'task-web-2-id',
  duration_minutes: 120,
  description: 'Design review meeting + implementation',
  work_date: '2026-02-09',
  is_billable: true,
  billing_rate: 15000, // $150.00/hr in cents
});

// Get time report for a date range
const report = await timeService.report({
  project_id: project.id,
  date_from: '2026-02-03',
  date_to: '2026-02-09',
  group_by: 'user',
});

console.log('Time Report (Feb 3–9):');
for (const row of report.rows) {
  console.log(
    `  ${row.user_name}: ${row.total_hours.toFixed(1)}h ` +
    `(${row.billable_hours.toFixed(1)}h billable, ` +
    `$${(row.billable_amount / 100).toFixed(2)})`
  );
}
// Output:
// Time Report (Feb 3–9):
//   Alice: 32.5h (28.0h billable, $4,200.00)
//   Bob: 28.0h (24.5h billable, $3,675.00)
//   Carol: 30.0h (26.0h billable, $3,900.00)

// Get active timers for the current user
const activeTimers = await timeService.getActiveTimers();
if (activeTimers.length > 0) {
  console.log(`You have ${activeTimers.length} running timer(s)`);
  for (const t of activeTimers) {
    const elapsed = Date.now() - new Date(t.timer_started_at!).getTime();
    console.log(`  ${t.description} — ${formatDuration(elapsed)}`);
  }
}
```

### 6. Task Dependencies and Critical Path

```typescript
import {
  DependencyService,
  criticalPath,
  isCircularDependency,
  resolveTaskOrder,
} from '@mcv/operations/tasks';

const depService = new DependencyService(ctx);

// Create dependencies
await depService.create({
  source_task_id: taskDesign.id,   // Design mega menu
  target_task_id: taskImpl.id,     // Implement mega menu
  dependency_type: 'blocks',
  lag_days: 0,
});

await depService.create({
  source_task_id: taskImpl.id,     // Implement mega menu
  target_task_id: taskIntegrate.id, // Integrate search
  dependency_type: 'blocks',
  lag_days: 1, // can start 1 day after implementation
});

await depService.create({
  source_task_id: taskDesign.id,   // Design mega menu
  target_task_id: taskMobile.id,   // Mobile hamburger menu
  dependency_type: 'blocks',
  lag_days: 0,
});

// Check for circular dependency before adding
const wouldCycle = await isCircularDependency(ctx, {
  source_task_id: taskIntegrate.id,
  target_task_id: taskDesign.id,
  dependency_type: 'blocks',
});

if (wouldCycle) {
  console.log('Cannot add dependency: would create a circular reference');
}
// Output: Cannot add dependency: would create a circular reference

// Compute critical path
const path = await criticalPath(ctx, { project_id: project.id });

console.log('Critical path:');
for (const node of path.nodes) {
  console.log(
    `  ${node.task_key} (${node.story_points ?? '?'} pts) — ` +
    `earliest start: ${node.earliest_start}, latest finish: ${node.latest_finish}`
  );
}
console.log(`Total duration: ${path.total_days} days`);
// Output:
// Critical path:
//   WEB-2 (5 pts) — earliest start: 2026-02-10, latest finish: 2026-02-14
//   WEB-5 (3 pts) — earliest start: 2026-02-14, latest finish: 2026-02-19
//   WEB-8 (2 pts) — earliest start: 2026-02-20, latest finish: 2026-02-24
// Total duration: 14 days

// Get all tasks in dependency-respecting order
const orderedTasks = await resolveTaskOrder(ctx, { project_id: project.id });
console.log('Execution order:');
orderedTasks.forEach((t, i) => console.log(`  ${i + 1}. ${t.task_key} ${t.title}`));
```

### 7. Task Automations

```typescript
import { TaskAutomationService } from '@mcv/operations/tasks';

const automationService = new TaskAutomationService(ctx);

// Automation: When a task moves to "Done", notify all watchers
await automationService.create({
  project_id: project.id,
  name: 'Notify on completion',
  description: 'Send notification to all watchers when a task is completed',
  trigger: {
    type: 'status_change',
    config: { to_status: 'done' },
  },
  conditions: [],
  actions: [
    {
      type: 'send_notification',
      config: {
        recipients: 'watchers',
        template: 'task_completed',
        message: '{{task.task_key}} "{{task.title}}" has been completed by {{actor.name}}.',
      },
    },
  ],
});

// Automation: Auto-assign reviewer when task enters "In Review"
await automationService.create({
  project_id: project.id,
  name: 'Auto-assign reviewer',
  description: 'When a task moves to In Review, assign the tech lead',
  trigger: {
    type: 'status_change',
    config: { to_status: 'in_review' },
  },
  conditions: [
    {
      field: 'labels',
      operator: 'contains',
      value: 'needs-review',
    },
  ],
  actions: [
    {
      type: 'assign_user',
      config: { user_id: 'user-tech-lead-id', append: true },
    },
    {
      type: 'add_comment',
      config: {
        content: '@[Tech Lead](user:user-tech-lead-id) — this task is ready for your review.',
      },
    },
  ],
});

// Automation: Escalate overdue tasks
await automationService.create({
  project_id: project.id,
  name: 'Escalate overdue tasks',
  description: 'Bump priority of overdue tasks that are still in progress',
  trigger: {
    type: 'due_date',
    config: { when: 'overdue', check_interval: 'daily' },
  },
  conditions: [
    { field: 'status', operator: 'in', value: ['todo', 'in_progress'] },
    { field: 'priority', operator: 'not_equals', value: 'critical' },
  ],
  actions: [
    {
      type: 'change_priority',
      config: { priority: 'critical' },
    },
    {
      type: 'send_notification',
      config: {
        recipients: 'assignees',
        template: 'task_overdue',
        message: '⚠️ {{task.task_key}} is overdue! Priority escalated to critical.',
      },
    },
  ],
});

// Automation: Webhook on task creation (for external integration)
await automationService.create({
  project_id: project.id,
  name: 'Sync new tasks to external tracker',
  description: 'POST to external system whenever a new task is created',
  trigger: {
    type: 'task_created',
    config: {},
  },
  conditions: [
    { field: 'labels', operator: 'contains', value: 'external-sync' },
  ],
  actions: [
    {
      type: 'call_webhook',
      config: {
        url: 'https://api.external-tracker.com/tasks/sync',
        method: 'POST',
        headers: { 'Authorization': 'Bearer {{env.EXTERNAL_TRACKER_TOKEN}}' },
        body: {
          key: '{{task.task_key}}',
          title: '{{task.title}}',
          priority: '{{task.priority}}',
          url: '{{task.url}}',
        },
      },
    },
  ],
});

// List all automations for the project
const automations = await automationService.list({ project_id: project.id });
console.log(`${automations.length} automations configured:`);
for (const a of automations) {
  console.log(
    `  ${a.is_enabled ? '✅' : '⏸️'} ${a.name} — ` +
    `fired ${a.execution_count} times`
  );
}
// Output:
// 4 automations configured:
//   ✅ Notify on completion — fired 12 times
//   ✅ Auto-assign reviewer — fired 5 times
//   ✅ Escalate overdue tasks — fired 2 times
//   ✅ Sync new tasks to external tracker — fired 8 times
```

### 8. Comments, Activity Feed, and Real-Time Updates

```typescript
import { TaskCommentService, TaskService } from '@mcv/operations/tasks';

const commentService = new TaskCommentService(ctx);
const taskService = new TaskService(ctx);

// Add a comment with @mention
const comment = await commentService.create({
  task_id: epicTask.id,
  content: `## Design Review Notes\n\nThe mega menu design looks great! A few suggestions:\n\n1. Add a subtle shadow to the dropdown panel\n2. The hover animation should be 200ms, not 300ms\n3. Consider adding a "Recently visited" section\n\n@[Bob](user:user-bob-id) can you update the Figma file?\n\nAlso, this is related to #WEB-3 (mobile menu) — we should use the same color tokens.`,
});

console.log(`Comment added (${comment.id}), mentioned: ${comment.mentioned_user_ids}`);
// Output: Comment added (abc-123), mentioned: ["user-bob-id"]

// Reply to a comment (threaded)
await commentService.create({
  task_id: epicTask.id,
  parent_comment_id: comment.id,
  content: 'On it! Will update by EOD. The shadow is already in the design system — just need to reference the right token.',
});

// Get activity feed for a task
const activity = await taskService.getActivity(epicTask.id, {
  limit: 20,
});

for (const event of activity.items) {
  const time = new Date(event.created_at).toLocaleString();
  const actor = event.is_automated ? '🤖 Automation' : event.user_name;
  console.log(`  [${time}] ${actor}: ${event.summary}`);
}
// Output:
//   [2/9/2026, 2:30 PM] Alice: Created task WEB-1
//   [2/9/2026, 2:31 PM] Alice: Added subtasks WEB-2, WEB-3, WEB-4, WEB-5
//   [2/9/2026, 2:35 PM] Alice: Changed priority from medium to high
//   [2/9/2026, 3:00 PM] Bob: Changed status from backlog to in_progress
//   [2/9/2026, 3:45 PM] Alice: Added comment (design review notes)
//   [2/9/2026, 4:00 PM] Bob: Replied to comment
//   [2/9/2026, 4:30 PM] 🤖 Automation: Added label "in-progress" (Auto-label rule)

// Subscribe to real-time updates (client-side)
// This is typically done in the frontend, but the pattern is:
const channel = ctx.supabase
  .channel(`board:${board.id}`)
  .on('broadcast', { event: 'task.moved' }, (payload) => {
    console.log(`Task ${payload.taskId} moved to ${payload.toColumn}`);
    // Update local board state
  })
  .on('broadcast', { event: 'task.updated' }, (payload) => {
    console.log(`Task ${payload.taskId} updated: ${JSON.stringify(payload.changes)}`);
    // Patch local task data
  })
  .on('broadcast', { event: 'task.created' }, (payload) => {
    console.log(`New task: ${payload.task.task_key}`);
    // Add card to board
  })
  .subscribe();

// Cleanup on unmount
// channel.unsubscribe();
```

---

## Error Codes

All errors thrown by `@mcv/operations/tasks` use the `TaskError` class which extends the platform's `AppError` base class. Errors include a machine-readable code, HTTP status, and human-readable message.

| Code | HTTP | Description |
|---|---|---|
| `TASK_NOT_FOUND` | 404 | Task with the specified ID does not exist or is not accessible |
| `TASK_VALIDATION_FAILED` | 400 | Task creation/update input failed validation (missing title, invalid dates, etc.) |
| `TASK_KEY_CONFLICT` | 409 | Generated task key already exists (race condition on key_counter) |
| `TASK_STATUS_TRANSITION_INVALID` | 400 | Requested status transition is not allowed by the workflow configuration |
| `TASK_ARCHIVED` | 400 | Cannot modify an archived task — unarchive first |
| `TASK_CIRCULAR_DEPENDENCY` | 400 | Adding the dependency would create a circular reference |
| `TASK_DEPTH_EXCEEDED` | 400 | Subtask nesting depth would exceed the configured maximum (default: 10) |
| `TASK_PERMISSION_DENIED` | 403 | Current user lacks permission to perform this operation on the task |
| `PROJECT_NOT_FOUND` | 404 | Project with the specified ID does not exist or is not accessible |
| `PROJECT_KEY_CONFLICT` | 409 | A project with this key_prefix already exists in the tenant |
| `PROJECT_PERMISSION_DENIED` | 403 | Current user lacks the required project role for this operation |
| `PROJECT_ARCHIVED` | 400 | Cannot create tasks in an archived project |
| `SPRINT_NOT_FOUND` | 404 | Sprint with the specified ID does not exist |
| `SPRINT_ALREADY_ACTIVE` | 400 | Cannot start sprint — another sprint is already active in this project |
| `SPRINT_NOT_PLANNING` | 400 | Sprint can only be started from "planning" status |
| `SPRINT_ALREADY_COMPLETED` | 400 | Cannot modify a completed sprint |
| `SPRINT_DATE_OVERLAP` | 400 | Sprint dates overlap with an existing sprint in the project |
| `BOARD_NOT_FOUND` | 404 | Board with the specified ID does not exist |
| `BOARD_COLUMN_NOT_FOUND` | 404 | Board column with the specified ID does not exist |
| `BOARD_WIP_LIMIT_EXCEEDED` | 400 | Target column has reached its WIP (Work In Progress) limit |
| `DEPENDENCY_NOT_FOUND` | 404 | Dependency with the specified ID does not exist |
| `DEPENDENCY_DUPLICATE` | 409 | This dependency already exists between these tasks |
| `DEPENDENCY_SELF_REFERENCE` | 400 | A task cannot depend on itself |
| `TIME_ENTRY_NOT_FOUND` | 404 | Time entry with the specified ID does not exist |
| `TIME_ENTRY_OVERLAP` | 400 | Timer-based entry overlaps with another active timer |
| `TIMER_ALREADY_RUNNING` | 400 | User already has an active timer for this task |
| `TIMER_NOT_RUNNING` | 400 | Cannot stop timer — no active timer found for this entry |
| `COMMENT_NOT_FOUND` | 404 | Comment with the specified ID does not exist |
| `COMMENT_EDIT_FORBIDDEN` | 403 | Only the comment author can edit their comment |
| `ATTACHMENT_TOO_LARGE` | 413 | File exceeds the maximum allowed attachment size (default: 50MB) |
| `ATTACHMENT_TYPE_FORBIDDEN` | 400 | File type is not allowed (blocked MIME types) |
| `AUTOMATION_NOT_FOUND` | 404 | Automation with the specified ID does not exist |
| `AUTOMATION_LIMIT_REACHED` | 400 | Maximum number of automations per project reached (default: 50) |
| `AUTOMATION_EXECUTION_FAILED` | 500 | Automation action failed during execution (see details for specifics) |
| `VIEW_NOT_FOUND` | 404 | Saved view with the specified ID does not exist |
| `LABEL_NOT_FOUND` | 404 | Label with the specified ID does not exist |
| `LABEL_DUPLICATE` | 409 | A label with this name already exists in the project |
| `MILESTONE_NOT_FOUND` | 404 | Milestone with the specified ID does not exist |
| `CHECKLIST_NOT_FOUND` | 404 | Checklist with the specified ID does not exist |
| `BULK_OPERATION_PARTIAL_FAILURE` | 207 | Some tasks in the bulk operation failed (partial success — see details) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests — back off and retry |
| `TENANT_TASK_LIMIT_REACHED` | 400 | Tenant has reached its maximum task count for the current plan |

### Error Response Shape

```typescript
interface TaskError {
  code: string;           // Machine-readable error code (e.g., "TASK_NOT_FOUND")
  message: string;        // Human-readable error message
  status: number;         // HTTP status code
  details?: {
    field?: string;       // Field that caused the error (for validation)
    constraint?: string;  // Database constraint that was violated
    task_id?: string;     // Related task ID
    max?: number;         // Maximum allowed value
    current?: number;     // Current value
    [key: string]: unknown;
  };
}
```

### Error Handling Example

```typescript
import { TaskService, TaskError } from '@mcv/operations/tasks';

const taskService = new TaskService(ctx);

try {
  await taskService.update(taskId, { status: 'done' });
} catch (error) {
  if (error instanceof TaskError) {
    switch (error.code) {
      case 'TASK_NOT_FOUND':
        console.error(`Task ${taskId} not found — may have been deleted`);
        break;
      case 'TASK_STATUS_TRANSITION_INVALID':
        console.error(
          `Cannot move to "done" from current status. ` +
          `Allowed transitions: ${error.details?.allowed_transitions}`
        );
        break;
      case 'TASK_PERMISSION_DENIED':
        console.error('You do not have permission to modify this task');
        break;
      default:
        console.error(`Task error: ${error.code} — ${error.message}`);
    }
  } else {
    throw error; // Re-throw unexpected errors
  }
}
```

---

## Security

### Tenant Isolation

Every table includes a `tenant_id` column enforced by Supabase Row-Level Security (RLS). The `tenant_id` is extracted from the JWT token and cannot be spoofed by the client.

```
Client Request
    │
    ▼
┌─────────────────────────┐
│  JWT Token Verification  │  Supabase Auth extracts tenant_id
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  RLS Policy Evaluation   │  WHERE tenant_id = jwt.tenant_id (automatic)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Query Execution         │  Only rows matching tenant_id are visible
└─────────────────────────┘
```

**Guarantees:**
- No task, project, board, sprint, or any other entity is ever returned across tenant boundaries.
- Even SQL injection attempts are bounded by the RLS policy layer.
- Service-level code adds `tenant_id` to every `INSERT` and filters it on every `SELECT`/`UPDATE`/`DELETE` as a defense-in-depth measure (belt + suspenders).

### Project-Level Access Control

Within a tenant, project-level permissions control who can see and modify tasks:

| Role | View Tasks | Create Tasks | Edit Tasks | Delete Tasks | Manage Project |
|---|---|---|---|---|---|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Member** | ✅ | ✅ | ✅ | Own only | ❌ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |

**Public projects** (`is_public: true`) are visible to all tenant members with at least viewer-level access.

### Input Validation

All inputs are validated using Zod schemas at the tRPC layer before reaching service code:

```typescript
const taskCreateSchema = z.object({
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(100_000).nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'none']).optional(),
  story_points: z.number().int().min(0).max(1000).nullable().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  assignee_ids: z.array(z.string().uuid()).max(50).optional(),
  label_ids: z.array(z.string().uuid()).max(100).optional(),
  estimated_minutes: z.number().int().min(0).max(525_600).nullable().optional(), // max 1 year
  custom_fields: z.record(z.unknown()).optional(),
});
```

### Content Sanitization

- **Task descriptions** — HTML is sanitized using DOMPurify. Only safe Markdown elements are allowed. Script tags, event handlers, and data URIs are stripped.
- **Comment content** — Same sanitization as descriptions. @mentions are resolved to user IDs server-side to prevent mention spoofing.
- **Custom fields** — Values are validated against the project's `custom_field_schema`. Type mismatches are rejected.
- **Attachment filenames** — Sanitized to prevent path traversal and XSS in filenames.

### Rate Limiting

| Operation | Limit | Window |
|---|---|---|
| Task creation | 100 tasks | Per minute, per user |
| Task updates | 300 updates | Per minute, per user |
| Comment creation | 60 comments | Per minute, per user |
| File upload | 20 files | Per minute, per user |
| Bulk operations | 10 operations | Per minute, per user |
| Search queries | 120 queries | Per minute, per user |
| Report generation | 10 reports | Per minute, per user |

### Audit Trail

Every mutation to a task generates an entry in the `task_activity` table. The audit trail is:

- **Immutable** — Activity records cannot be updated or deleted (no `UPDATE` or `DELETE` policies on `task_activity`).
- **Attributable** — Every entry includes the `user_id` of the actor (or `null` + `is_automated: true` for automation-triggered changes).
- **Detailed** — Field-level change tracking (old value → new value) for all task updates.
- **Retained** — Audit logs are retained for the duration of the tenant's subscription plus 90 days.

### Webhook Security

Outbound webhooks (from automation actions) include:

- **HMAC signature** — `X-MCV-Signature` header with HMAC-SHA256 of the request body, using a per-automation secret key.
- **Timestamp** — `X-MCV-Timestamp` header to prevent replay attacks (recipients should reject requests older than 5 minutes).
- **Retry policy** — Failed webhooks are retried up to 3 times with exponential backoff (1s, 5s, 25s). After 3 failures, the webhook is marked as failed in the activity log.
- **Timeout** — Webhook requests time out after 10 seconds.
- **Allowlist** — Webhook URLs can be restricted to specific domains via tenant-level configuration.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | ✅ | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Supabase service role key (server-side only) |
| `SUPABASE_ANON_KEY` | ✅ | — | Supabase anonymous key (for client-side RLS) |
| `TASKS_DATABASE_URL` | ❌ | `$SUPABASE_URL` | Direct PostgreSQL connection string (for Drizzle migrations) |
| `TASKS_MAX_DEPTH` | ❌ | `10` | Maximum subtask nesting depth |
| `TASKS_MAX_ATTACHMENTS_PER_TASK` | ❌ | `50` | Maximum file attachments per task |
| `TASKS_MAX_ATTACHMENT_SIZE_MB` | ❌ | `50` | Maximum single file size in megabytes |
| `TASKS_MAX_AUTOMATIONS_PER_PROJECT` | ❌ | `50` | Maximum automation rules per project |
| `TASKS_MAX_LABELS_PER_TASK` | ❌ | `100` | Maximum labels per task |
| `TASKS_MAX_ASSIGNEES_PER_TASK` | ❌ | `50` | Maximum assignees per task |
| `TASKS_MAX_TASKS_PER_TENANT` | ❌ | `1000000` | Maximum total tasks per tenant (plan-based) |
| `TASKS_WEBSOCKET_URL` | ❌ | `$SUPABASE_URL` | WebSocket endpoint for real-time subscriptions |
| `TASKS_WEBHOOK_SECRET` | ❌ | — | Global HMAC secret for outbound webhooks (overridden per automation) |
| `TASKS_WEBHOOK_TIMEOUT_MS` | ❌ | `10000` | Webhook request timeout in milliseconds |
| `TASKS_WEBHOOK_MAX_RETRIES` | ❌ | `3` | Maximum webhook retry attempts |
| `TASKS_SEARCH_MIN_LENGTH` | ❌ | `2` | Minimum query length for full-text search |
| `TASKS_METRICS_REFRESH_CRON` | ❌ | `0 2 * * *` | Cron schedule for refreshing materialized views |
| `TASKS_STORAGE_BUCKET` | ❌ | `task-attachments` | Supabase Storage bucket for task attachments |
| `TASKS_ALLOWED_MIME_TYPES` | ❌ | `*` | Comma-separated list of allowed MIME types for attachments (or `*` for all) |
| `TASKS_BLOCKED_MIME_TYPES` | ❌ | `application/x-executable,application/x-msdownload` | MIME types that are always blocked |
| `TASKS_RATE_LIMIT_ENABLED` | ❌ | `true` | Enable/disable rate limiting |
| `TASKS_AUDIT_RETENTION_DAYS` | ❌ | `365` | How long to retain audit log entries |

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@mcv/core` | `^0.12.0` | Base error classes, logging, configuration, tenant context |
| `@mcv/database` | `^0.12.0` | Drizzle ORM setup, connection pooling, migration runner |
| `@mcv/auth` | `^0.12.0` | JWT verification, user context extraction, permission helpers |
| `@mcv/realtime` | `^0.12.0` | WebSocket channel management, broadcast utilities |
| `@mcv/storage` | `^0.12.0` | Supabase Storage integration for file attachments |
| `@mcv/notifications` | `^0.12.0` | Notification delivery (email, push, in-app) |
| `@mcv/iam/users` | `^0.12.0` | User profile resolution for @mentions and assignee display |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.34.0` | Type-safe SQL query builder and ORM |
| `drizzle-kit` | `^0.26.0` | Migration generation and management |
| `@trpc/server` | `^11.0.0` | Type-safe API layer (procedure definitions) |
| `zod` | `^3.23.0` | Runtime schema validation for all inputs |
| `@supabase/supabase-js` | `^2.45.0` | Supabase client (auth, storage, realtime) |
| `dompurify` | `^3.1.0` | HTML/Markdown sanitization for descriptions and comments |
| `date-fns` | `^3.6.0` | Date manipulation, formatting, and comparison |
| `nanoid` | `^5.0.0` | Short unique ID generation (for checklist items, etc.) |
| `superjson` | `^2.2.0` | JSON serialization with Date/BigInt support (tRPC transformer) |

### Peer Dependencies

| Package | Version | Purpose |
|---|---|---|
| `postgres` | `^3.4.0` | PostgreSQL driver (used by Drizzle for direct connections) |

---

## Testing

### Test Strategy

The test suite covers four layers:

1. **Unit tests** — Pure logic (cycle detection, critical path, velocity calculation, duration formatting)
2. **Service tests** — Service methods with mocked database (business logic validation)
3. **Integration tests** — Full database round-trips against a test Supabase instance (RLS verification, triggers, indexes)
4. **E2E tests** — Complete API flows through tRPC (create project → add tasks → run sprint → generate reports)

### Running Tests

```bash
# Run all tests
pnpm test --filter=@mcv/operations-tasks

# Run unit tests only
pnpm test --filter=@mcv/operations-tasks -- --grep "unit"

# Run integration tests (requires SUPABASE_URL)
pnpm test:integration --filter=@mcv/operations-tasks

# Run with coverage
pnpm test:coverage --filter=@mcv/operations-tasks

# Run a specific test file
pnpm vitest run src/services/__tests__/task-service.test.ts
```

### Test Structure

```
src/
├── services/
│   └── __tests__/
│       ├── task-service.test.ts          # TaskService unit + service tests
│       ├── project-service.test.ts       # ProjectService tests
│       ├── sprint-service.test.ts        # SprintService + velocity tests
│       ├── board-service.test.ts         # BoardService + column management
│       ├── dependency-service.test.ts    # Dependency CRUD + cycle detection
│       ├── time-tracking-service.test.ts # Timer + manual entry tests
│       ├── automation-service.test.ts    # Automation rule execution tests
│       ├── comment-service.test.ts       # Comment CRUD + @mention parsing
│       └── report-service.test.ts        # Report generation + chart data
├── utils/
│   └── __tests__/
│       ├── critical-path.test.ts         # Critical path algorithm tests
│       ├── cycle-detection.test.ts       # Circular dependency detection
│       ├── velocity.test.ts              # Velocity calculation edge cases
│       ├── burndown.test.ts              # Burndown/burnup data generation
│       └── task-filter.test.ts           # Filter parsing + SQL generation
├── router/
│   └── __tests__/
│       └── tasks-router.test.ts          # tRPC endpoint integration tests
└── __tests__/
    ├── integration/
    │   ├── rls-policies.test.ts          # RLS policy verification
    │   ├── triggers.test.ts              # Database trigger verification
    │   ├── full-workflow.test.ts          # Complete sprint workflow
    │   └── concurrent-access.test.ts     # Race condition + WIP limit tests
    └── e2e/
        ├── task-crud.e2e.test.ts         # Full task lifecycle via tRPC
        ├── board-kanban.e2e.test.ts       # Board operations + drag-and-drop
        └── sprint-cycle.e2e.test.ts       # Sprint planning → completion
```

### Example Test: Task Status Transitions

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TaskService } from '../task-service';
import { createTestContext, createTestTask } from '../../test-utils';

describe('TaskService - Status Transitions', () => {
  let ctx: TestContext;
  let taskService: TaskService;

  beforeEach(async () => {
    ctx = await createTestContext();
    taskService = new TaskService(ctx);
  });

  it('should allow valid transition: backlog → todo', async () => {
    const task = await createTestTask(ctx, { status: 'backlog' });
    const updated = await taskService.update(task.id, { status: 'todo' });
    expect(updated.status).toBe('todo');
  });

  it('should allow valid transition: in_progress → done', async () => {
    const task = await createTestTask(ctx, { status: 'in_progress' });
    const updated = await taskService.update(task.id, { status: 'done' });
    expect(updated.status).toBe('done');
    expect(updated.completed_at).not.toBeNull();
  });

  it('should reject invalid transition: backlog → in_review', async () => {
    const task = await createTestTask(ctx, { status: 'backlog' });
    await expect(
      taskService.update(task.id, { status: 'in_review' })
    ).rejects.toMatchObject({
      code: 'TASK_STATUS_TRANSITION_INVALID',
      status: 400,
    });
  });

  it('should set started_at on first transition to in_progress', async () => {
    const task = await createTestTask(ctx, { status: 'todo' });
    expect(task.started_at).toBeNull();

    const updated = await taskService.update(task.id, { status: 'in_progress' });
    expect(updated.started_at).not.toBeNull();
  });

  it('should preserve started_at on subsequent transitions through in_progress', async () => {
    const task = await createTestTask(ctx, { status: 'in_progress' });
    const originalStarted = task.started_at;

    // Move to review and back
    await taskService.update(task.id, { status: 'in_review' });
    const updated = await taskService.update(task.id, { status: 'in_progress' });

    expect(updated.started_at).toBe(originalStarted);
  });

  it('should clear completed_at when reopening from done', async () => {
    const task = await createTestTask(ctx, { status: 'done' });
    expect(task.completed_at).not.toBeNull();

    const updated = await taskService.update(task.id, { status: 'in_progress' });
    expect(updated.completed_at).toBeNull();
  });

  it('should allow any task to be cancelled', async () => {
    for (const status of ['backlog', 'todo', 'in_progress', 'in_review'] as const) {
      const task = await createTestTask(ctx, { status });
      const updated = await taskService.update(task.id, { status: 'cancelled' });
      expect(updated.status).toBe('cancelled');
    }
  });

  it('should respect custom workflow config', async () => {
    const project = await createTestProject(ctx, {
      workflow_config: {
        statuses: [
          { key: 'draft', label: 'Draft', category: 'not_started', color: '#gray' },
          { key: 'in_qa', label: 'In QA', category: 'in_progress', color: '#purple' },
          { key: 'deployed', label: 'Deployed', category: 'completed', color: '#green' },
        ],
        transitions: [
          { from: 'draft', to: 'in_qa' },
          { from: 'in_qa', to: 'deployed' },
          { from: 'in_qa', to: 'draft' }, // Can go back
        ],
      },
    });

    const task = await createTestTask(ctx, {
      project_id: project.id,
      status: 'draft',
    });

    // Valid custom transition
    const updated = await taskService.update(task.id, { status: 'in_qa' });
    expect(updated.status).toBe('in_qa');

    // Invalid custom transition (no direct draft → deployed)
    await expect(
      taskService.update(task.id, { status: 'deployed' })
    ).rejects.toMatchObject({ code: 'TASK_STATUS_TRANSITION_INVALID' });
  });
});
```

### Example Test: Circular Dependency Detection

```typescript
import { describe, it, expect } from 'vitest';
import { isCircularDependency } from '../critical-path';

describe('isCircularDependency', () => {
  it('should detect a direct cycle (A→B→A)', async () => {
    const ctx = await createTestContext();
    const [taskA, taskB] = await createTestTasks(ctx, 2);

    await createDependency(ctx, taskA.id, taskB.id, 'blocks');

    const result = await isCircularDependency(ctx, {
      source_task_id: taskB.id,
      target_task_id: taskA.id,
      dependency_type: 'blocks',
    });

    expect(result).toBe(true);
  });

  it('should detect an indirect cycle (A→B→C→A)', async () => {
    const ctx = await createTestContext();
    const [taskA, taskB, taskC] = await createTestTasks(ctx, 3);

    await createDependency(ctx, taskA.id, taskB.id, 'blocks');
    await createDependency(ctx, taskB.id, taskC.id, 'blocks');

    const result = await isCircularDependency(ctx, {
      source_task_id: taskC.id,
      target_task_id: taskA.id,
      dependency_type: 'blocks',
    });

    expect(result).toBe(true);
  });

  it('should allow non-circular dependencies', async () => {
    const ctx = await createTestContext();
    const [taskA, taskB, taskC] = await createTestTasks(ctx, 3);

    await createDependency(ctx, taskA.id, taskB.id, 'blocks');

    // C→A is fine (no cycle: C→A→B)
    const result = await isCircularDependency(ctx, {
      source_task_id: taskC.id,
      target_task_id: taskA.id,
      dependency_type: 'blocks',
    });

    expect(result).toBe(false);
  });

  it('should reject self-reference', async () => {
    const ctx = await createTestContext();
    const [taskA] = await createTestTasks(ctx, 1);

    const result = await isCircularDependency(ctx, {
      source_task_id: taskA.id,
      target_task_id: taskA.id,
      dependency_type: 'blocks',
    });

    expect(result).toBe(true);
  });

  it('should ignore "relates_to" dependencies for cycle check', async () => {
    const ctx = await createTestContext();
    const [taskA, taskB] = await createTestTasks(ctx, 2);

    await createDependency(ctx, taskA.id, taskB.id, 'relates_to');

    // relates_to is bidirectional and non-blocking — no cycle concern
    const result = await isCircularDependency(ctx, {
      source_task_id: taskB.id,
      target_task_id: taskA.id,
      dependency_type: 'relates_to',
    });

    expect(result).toBe(false);
  });
});
```

### Example Test: RLS Policy Verification

```typescript
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('RLS Policies - Tenant Isolation', () => {
  it('should prevent cross-tenant task access', async () => {
    // Create tasks in tenant A
    const ctxA = await createTestContext({ tenant_id: 'tenant-a' });
    const taskA = await createTestTask(ctxA, { title: 'Tenant A task' });

    // Try to access from tenant B
    const ctxB = await createTestContext({ tenant_id: 'tenant-b' });
    const taskService = new TaskService(ctxB);

    const result = await taskService.getById(taskA.id);
    expect(result).toBeNull(); // Not visible to tenant B
  });

  it('should prevent cross-tenant task updates', async () => {
    const ctxA = await createTestContext({ tenant_id: 'tenant-a' });
    const taskA = await createTestTask(ctxA, { title: 'Tenant A task' });

    const ctxB = await createTestContext({ tenant_id: 'tenant-b' });
    const taskService = new TaskService(ctxB);

    await expect(
      taskService.update(taskA.id, { title: 'Hacked!' })
    ).rejects.toMatchObject({ code: 'TASK_NOT_FOUND' });
  });

  it('should enforce project viewer cannot create tasks', async () => {
    const ctx = await createTestContext({ tenant_id: 'tenant-a' });
    const project = await createTestProject(ctx, {
      permissions: {
        admin_ids: ['user-admin'],
        member_ids: [],
        viewer_ids: ['user-viewer'],
        is_public: false,
        role_mappings: [],
      },
    });

    const viewerCtx = await createTestContext({
      tenant_id: 'tenant-a',
      user_id: 'user-viewer',
    });
    const taskService = new TaskService(viewerCtx);

    await expect(
      taskService.create({ project_id: project.id, title: 'Viewer task' })
    ).rejects.toMatchObject({ code: 'PROJECT_PERMISSION_DENIED' });
  });
});
```

### Example Test: WIP Limit Enforcement

```typescript
import { describe, it, expect } from 'vitest';

describe('BoardService - WIP Limits', () => {
  it('should reject moving a task to a column at WIP limit', async () => {
    const ctx = await createTestContext();
    const board = await createTestBoard(ctx, {
      columns: [
        { name: 'To Do', mapped_status: 'todo', wip_limit: 2 },
        { name: 'In Progress', mapped_status: 'in_progress', wip_limit: 1 },
      ],
    });

    const inProgressColumn = board.columns.find(c => c.name === 'In Progress')!;

    // Add one task to fill the WIP limit
    const task1 = await createTestTask(ctx, {
      board_column_id: inProgressColumn.id,
    });

    // Try to add a second — should fail
    const task2 = await createTestTask(ctx, {
      board_column_id: board.columns[0].id,
    });

    const boardService = new BoardService(ctx);
    await expect(
      boardService.moveTask(task2.id, inProgressColumn.id, 1)
    ).rejects.toMatchObject({
      code: 'BOARD_WIP_LIMIT_EXCEEDED',
      details: { column_name: 'In Progress', wip_limit: 1, current_count: 1 },
    });
  });

  it('should allow admins to override WIP limits', async () => {
    const adminCtx = await createTestContext({ role: 'admin' });
    const board = await createTestBoard(adminCtx, {
      columns: [
        { name: 'Review', mapped_status: 'in_review', wip_limit: 1 },
      ],
    });

    const reviewColumn = board.columns[0];

    // Fill the column
    await createTestTask(adminCtx, { board_column_id: reviewColumn.id });

    // Admin can override
    const task2 = await createTestTask(adminCtx);
    const boardService = new BoardService(adminCtx);
    const moved = await boardService.moveTask(task2.id, reviewColumn.id, 1, {
      override_wip_limit: true,
    });

    expect(moved.board_column_id).toBe(reviewColumn.id);
  });
});
```

### Coverage Targets

| Category | Target | Current |
|---|---|---|
| **Statements** | ≥ 90% | 93% |
| **Branches** | ≥ 85% | 88% |
| **Functions** | ≥ 90% | 94% |
| **Lines** | ≥ 90% | 93% |

### Performance Benchmarks

Key operations are benchmarked to ensure they stay within acceptable latencies:

| Operation | Target (p95) | Measured (p95) |
|---|---|---|
| Task creation | < 50ms | 32ms |
| Task update (single field) | < 30ms | 18ms |
| Task list (50 items, indexed filter) | < 100ms | 65ms |
| Task list (50 items, full-text search) | < 200ms | 142ms |
| Board load (5 columns, 100 tasks) | < 150ms | 98ms |
| Sprint burndown calculation | < 500ms | 310ms |
| Critical path (50 tasks, 80 deps) | < 200ms | 124ms |
| Velocity report (10 sprints) | < 300ms | 185ms |
| Automation rule evaluation | < 20ms | 8ms |

---

*This module is part of the MCV.ONE platform. For questions, contact the Operations team or open an issue in the monorepo.*