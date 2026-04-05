# @mcv/operations — API Reference

> **Package:** `@mcv/operations`
> **Classification:** PUBLISHABLE
> **Tier:** 5 — Domain Layer
> **Protocol:** tRPC v11 (type-safe RPC)
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Tasks API](#tasks-api)
4. [Projects API](#projects-api)
5. [Workflows API](#workflows-api)
6. [Time Tracking API](#time-tracking-api)
7. [Document Editor API](#document-editor-api)
8. [Types & Schemas](#types--schemas)
9. [Events](#events)
10. [Error Codes](#error-codes)
11. [Configuration](#configuration)

---

## API Overview

All `@mcv/operations` APIs are exposed as tRPC procedures with Zod input validation. The domain provides **5 routers** with **90+ procedures** total:

| Router | Procedures | Prefix | Description |
|--------|-----------|--------|-------------|
| `taskRouter` | 16 | `task.*` | Task CRUD, dependencies, comments, history |
| `projectRouter` | 8 | `project.*` | Project CRUD, hierarchy, statistics |
| `workflowRouter` | 30+ | `workflow.*` | Workflow CRUD, V2 execution, approvals, templates |
| `timeEntryRouter` | 11 | `timeEntry.*` | Time entries, timers, approval, timesheets |
| `documentEditorRouter` | 40+ | `documentEditor.*` | Documents, blocks, templates, AI, assets, comments |

### Request Format

All requests use tRPC's type-safe calling convention:

```typescript
import { trpc } from '@/lib/trpc';

// Query (read operations)
const tasks = await trpc.task.list.query({ projectId: '...', status: 'todo' });

// Mutation (write operations)
const task = await trpc.task.create.mutate({ projectId: '...', title: '...' });
```

### Pagination

List endpoints use cursor-based pagination:

```typescript
const result = await trpc.task.list.query({
  projectId: 'proj_abc',
  limit: 50,          // Items per page (default: 50, max: 100)
  cursor: 'task_xyz', // Cursor from previous response
});

// Response:
{
  items: Task[],
  nextCursor: string | null,  // Pass to next call, null = last page
  totalCount: number,
}
```

---

## Authentication & Authorization

### Procedure Guards

| Guard | Auth Required | Venture Required | Admin Required | Used By |
|-------|--------------|-----------------|----------------|---------|
| `protectedProcedure` | ✓ | ✗ | ✗ | Workflow reads, public template list, comment creation |
| `ventureProcedure` | ✓ | ✓ | ✗ | Task CRUD, project CRUD, time entries, document reads |
| `adminProcedure` | ✓ | ✓ | ✓ | Workflow execution, document mutations, AI suggestions |

### Context Object

Every procedure receives a typed context:

```typescript
interface TRPCContext {
  session: {
    userId: string;
    email: string;
    roles: string[];
  };
  ventureId: string;        // Set by ventureProcedure
  db: DrizzleClient;        // Database connection
}
```

---

## Tasks API

### task.list

List tasks with filtering, search, and pagination.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  projectId: string;              // Required: filter by project
  status?: TaskStatus;            // Filter by status
  priority?: TaskPriority;        // Filter by priority
  type?: TaskType;                // Filter by type
  assigneeId?: string;            // Filter by assignee
  sprintId?: string;              // Filter by sprint
  parentId?: string | null;       // Filter by parent (null = top-level)
  search?: string;                // Full-text search on title/description
  tags?: string[];                // Filter by tags (AND logic)
  labels?: string[];              // Filter by labels (AND logic)
  ownerType?: OwnerType;          // Filter by ownership model
  department?: string;            // Filter by department
  sortBy?: 'position' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;                 // Default: 50, max: 100
  cursor?: string;                // Cursor for pagination
}
```

**Output:**

```typescript
{
  items: Task[];
  nextCursor: string | null;
  totalCount: number;
}
```

**Example:**

```typescript
const backlogTasks = await trpc.task.list.query({
  projectId: 'proj_abc123',
  status: 'backlog',
  priority: 'high',
  sortBy: 'priorityScore',
  sortOrder: 'desc',
  limit: 20,
});
```

---

### task.get

Get a single task with all relations.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  id: string;                     // Task UUID
}
```

**Output:** `Task` (full task object with all 50+ fields)

---

### task.create

Create a new task.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |
| **Audit Event** | `tasks.created` |

**Input:**

```typescript
{
  projectId: string;              // Required: project UUID
  title: string;                  // Required: 1-500 chars
  description?: string;           // Optional: up to 50,000 chars
  status?: TaskStatus;            // Default: 'todo'
  priority?: TaskPriority;        // Default: 'medium'
  type?: TaskType;                // Default: 'task'
  parentId?: string;              // Parent task for subtasks
  assigneeId?: string;            // Primary assignee
  reporterId?: string;            // Reporter
  ownerType?: OwnerType;          // Default: 'human_only'
  taskTier?: TaskTier;            // Default: 'T2'
  department?: string;            // Department classification
  storyPoints?: number;           // 0-100
  timeEstimateMinutes?: number;   // Time estimate
  startDate?: string;             // ISO date: YYYY-MM-DD
  dueDate?: string;               // ISO date: YYYY-MM-DD
  slaDeadline?: string;           // ISO datetime
  sprintId?: string;              // Sprint assignment
  tags?: string[];                // Freeform tags
  labels?: string[];              // Structured labels
  acceptanceCriteria?: Array<{
    criterion: string;
    completed: boolean;
  }>;
  customFields?: Record<string, unknown>;
  source?: TaskSource;            // Default: 'manual'
  sourceReference?: Record<string, unknown>;
}
```

**Output:** `Task` (created task)

**Example:**

```typescript
const task = await trpc.task.create.mutate({
  projectId: 'proj_abc123',
  title: 'Implement user dashboard analytics',
  description: 'Build the main dashboard with real-time charts...',
  type: 'story',
  priority: 'high',
  ownerType: 'hybrid',
  taskTier: 'T3',
  storyPoints: 8,
  dueDate: '2026-03-01',
  tags: ['frontend', 'analytics'],
  acceptanceCriteria: [
    { criterion: 'Dashboard loads in <2s', completed: false },
    { criterion: 'All charts render correctly', completed: false },
  ],
});
```

---

### task.update

Update an existing task.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |
| **Audit Event** | `tasks.updated` |

**Input:**

```typescript
{
  id: string;                     // Required: task UUID
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assigneeId?: string | null;
  ownerType?: OwnerType;
  taskTier?: TaskTier;
  // ... all mutable task fields
}
```

**Output:** `Task` (updated task)

---

### task.delete

Delete a task and all its dependencies (cascade).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |
| **Audit Event** | `tasks.deleted` |

**Input:**

```typescript
{
  id: string;                     // Task UUID
}
```

**Output:** `{ success: boolean }`

---

### task.updateStatus

Update task status with activity logging.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  id: string;
  status: TaskStatus;
}
```

**Output:** `Task` (updated task)

**Side Effects:**
- Sets `statusChangedAt` to current timestamp
- If `status === 'done'`, sets `completedAt`
- If `status === 'in_progress'` and no `startedAt`, sets `startedAt`
- Creates `task_activity` record with `activityType: 'status_change'`

---

### task.bulkUpdateStatus

Update status for multiple tasks at once.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  ids: string[];                  // Array of task UUIDs (max 100)
  status: TaskStatus;
}
```

**Output:** `{ updated: number }`

---

### task.addDependency

Add a dependency between two tasks with cycle detection.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  taskId: string;                 // The task that has the dependency
  dependsOnId: string;            // The task being depended upon
  type?: DependencyType;          // Default: 'finish_to_start'
  lagDays?: number;               // Default: 0
}
```

**Output:** `TaskDependency`

**Errors:**
- `"A task cannot depend on itself"` — self-dependency detected
- `"Adding this dependency would create a circular dependency"` — BFS cycle detected
- `"This dependency already exists"` — duplicate dependency
- `"One or both tasks not found"` — invalid task IDs

---

### task.removeDependency

Remove a dependency between two tasks.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  id: string;                     // Dependency UUID
}
```

**Output:** `{ success: boolean }`

---

### task.getDependencyGraph

Get the full dependency graph for a project.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  projectId: string;
}
```

**Output:**

```typescript
{
  nodes: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    dependencies: string[];       // IDs of tasks this depends on
  }>;
  edges: Array<{
    from: string;                 // Dependent task
    to: string;                   // Dependency task
    type: DependencyType;
    lagDays: number;
  }>;
  hasCycles: boolean;
}
```

---

### task.logTime

Log time spent on a task.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  taskId: string;
  durationMinutes: number;
  description?: string;
  isBillable?: boolean;
}
```

**Output:** `TimeEntry`

---

### task.getSubtasks

Get child tasks of a parent task.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  taskId: string;
}
```

**Output:** `Task[]`

---

### task.reorderTasks

Reorder tasks within a column/status group.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  projectId: string;
  taskIds: string[];              // Ordered array of task IDs
}
```

**Output:** `{ success: boolean }`

---

### task.addComment

Add a comment to a task.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  taskId: string;
  content: string;                // Comment text (max 10,000 chars)
}
```

**Output:** `TaskActivity` (with `activityType: 'comment_added'`)

---

### task.getComments

Get comments for a task.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  taskId: string;
  limit?: number;
  cursor?: string;
}
```

**Output:** `{ items: TaskActivity[], nextCursor: string | null }`

---

### task.getHistory

Get change history for a task.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  taskId: string;
  limit?: number;
  cursor?: string;
}
```

**Output:** `{ items: TaskActivity[], nextCursor: string | null }`

---

## Projects API

### project.list

List projects with cursor-based pagination.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  status?: ProjectStatus;
  visibility?: ProjectVisibility;
  ownerId?: string;
  parentId?: string | null;       // null = top-level projects
  search?: string;
  limit?: number;
  cursor?: string;
}
```

**Output:** `{ items: Project[], nextCursor: string | null, totalCount: number }`

---

### project.get

Get a single project with statistics.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:** `{ id: string }`

**Output:** `Project`

---

### project.hierarchy

Get the project hierarchy tree.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:** `{ rootId?: string }` (optional: start from specific project)

**Output:**

```typescript
Array<{
  project: Project;
  children: Array<{ project: Project; children: ... }>;  // Recursive
}>
```

---

### project.stats

Get project statistics (task counts, completion rates).

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:** `{ id: string }`

**Output:**

```typescript
{
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;         // 0-100 percentage
  activeSprint: Sprint | null;
  totalTimeMinutes: number;
  billableTimeMinutes: number;
}
```

---

### project.create

Create a new project.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |
| **Audit Event** | `projects.created` |

**Input:**

```typescript
{
  name: string;                   // Required: 1-200 chars
  description?: string;
  status?: ProjectStatus;         // Default: 'active'
  visibility?: ProjectVisibility; // Default: 'team'
  color?: string;                 // Default: '#6366f1'
  icon?: string;                  // Default: 'folder'
  ownerId?: string;
  parentId?: string;              // For sub-projects
  startDate?: string;
  targetDate?: string;
  settings?: ProjectSettings;
}
```

**Output:** `Project`

---

### project.update

Update a project.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |
| **Audit Event** | `projects.updated` |

**Input:** `{ id: string; ...partial project fields }`

**Output:** `Project`

---

### project.archive

Archive a project (soft delete).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |
| **Audit Event** | `projects.archived` |

**Input:** `{ id: string }`

**Output:** `Project`

---

### project.delete

Permanently delete a project (cascades to all tasks).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |
| **Audit Event** | `projects.deleted` |

**Input:** `{ id: string }`

**Output:** `{ success: boolean }`

---

## Workflows API

### Workflow CRUD (V1)

#### workflow.list

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `protectedProcedure` |

**Input:**

```typescript
{
  ventureId?: string;
  triggerType?: WorkflowTriggerType;
  isActive?: boolean;
  limit?: number;
  cursor?: string;
}
```

**Output:** `{ items: Workflow[], nextCursor: string | null }`

---

#### workflow.get

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `protectedProcedure` |

**Input:** `{ id: string }`

**Output:** `Workflow`

---

#### workflow.create

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.created` |

**Input:**

```typescript
{
  ventureId: string;
  name: string;
  description?: string;
  triggerType: WorkflowTriggerType;
  triggerConditions: WorkflowTriggerConditions;
  actions: WorkflowAction[];
}
```

**Output:** `Workflow`

**Example:**

```typescript
const workflow = await trpc.workflow.create.mutate({
  ventureId: 'venture_abc',
  name: 'Overdue Task Notification',
  triggerType: 'task_overdue',
  triggerConditions: {
    taskPriority: ['high', 'highest'],
    daysOverdue: 1,
  },
  actions: [
    {
      id: 'notify',
      type: 'send_notification',
      config: {
        notificationType: 'email',
        recipientType: 'assignee',
        subject: 'Task Overdue: {{task.title}}',
        message: 'Your task is now overdue.',
      },
      order: 1,
    },
  ],
});
```

---

#### workflow.update

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.updated` |

**Input:** `{ id: string; ...partial workflow fields }`

**Output:** `Workflow`

---

#### workflow.delete

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.deleted` |

**Input:** `{ id: string }`

**Output:** `{ success: boolean }`

---

#### workflow.toggle

Activate or deactivate a workflow.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.activated` or `workflows.deactivated` |

**Input:**

```typescript
{
  id: string;
  isActive: boolean;
}
```

**Output:** `Workflow`

---

#### workflow.test

Test a V1 workflow with a mock task.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.tested` |

**Input:**

```typescript
{
  id: string;
  mockTaskId?: string;            // Optional: use real task as test data
}
```

**Output:** `{ runId: string; status: string; results: unknown[] }`

---

#### workflow.runHistory

Get execution history for a V1 workflow.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `protectedProcedure` |

**Input:**

```typescript
{
  workflowId: string;
  limit?: number;
  cursor?: string;
}
```

**Output:** `{ items: WorkflowExecution[], nextCursor: string | null }`

---

### Workflow Versions (V2)

#### workflow.createVersion

Snapshot the current node/edge graph as a version.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.version_created` |

**Input:**

```typescript
{
  workflowId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  changelog?: string;
}
```

**Output:** `WorkflowVersion`

---

#### workflow.rollbackVersion

Rollback to a previous version (creates a new version with old content).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.version_rollback` |

**Input:**

```typescript
{
  workflowId: string;
  versionId: string;
}
```

**Output:** `{ newVersionId: string }`

---

#### workflow.diffVersions

Compare two workflow versions.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `protectedProcedure` |

**Input:**

```typescript
{
  versionId1: string;
  versionId2: string;
}
```

**Output:**

```typescript
{
  addedNodes: string[];
  removedNodes: string[];
  modifiedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
}
```

---

#### workflow.listVersions

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `protectedProcedure` |

**Input:** `{ workflowId: string; page?: number; pageSize?: number }`

**Output:** `{ items: WorkflowVersion[], totalCount: number }`

---

### Workflow Execution (V2)

#### workflow.executeV2

Execute a V2 workflow graph.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.execution_started` |

**Input:**

```typescript
{
  workflowId: string;
  triggerData: Record<string, unknown>;
  isTest?: boolean;               // Default: false (no real side effects)
}
```

**Output:** `{ executionId: string }`

---

#### workflow.resumeExecution

Resume a paused execution (e.g., after approval).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.execution_resumed` |

**Input:** `{ executionId: string }`

**Output:** `{ success: boolean }`

**Error:** `"Execution is {status}, not paused"` if execution is not paused.

---

#### workflow.cancelExecution

Cancel a running or paused execution.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.execution_cancelled` |

**Input:** `{ executionId: string }`

**Output:** `{ success: boolean }`

---

#### workflow.retryExecution

Retry a failed execution from a specific step.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.execution_retried` |

**Input:**

```typescript
{
  executionId: string;
  fromStepId?: string;            // Optional: retry from specific step
}
```

**Output:** `{ newExecutionId: string }`

---

#### workflow.executionTrace

Get the full execution trace for debugging.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `protectedProcedure` |

**Input:** `{ executionId: string }`

**Output:**

```typescript
{
  execution: WorkflowExecution;
  steps: Array<{
    step: WorkflowStepExecution;
    nodeLabel: string;
    nodeType: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    duration: number;             // milliseconds
    error?: string;
    retryCount: number;
  }>;
  totalDuration: number;
}
```

---

#### workflow.replayStep

Replay a single step (optionally with modified input).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.step_replayed` |

**Input:**

```typescript
{
  stepExecutionId: string;
  inputOverride?: Record<string, unknown>;
}
```

**Output:** `WorkflowStepExecution`

---

#### workflow.listExecutions

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `protectedProcedure` |

**Input:**

```typescript
{
  workflowId?: string;
  status?: WorkflowExecutionStatus;
  ventureId?: string;
  isTest?: boolean;
  limit?: number;
  cursor?: string;
}
```

**Output:** `{ items: WorkflowExecution[], nextCursor: string | null }`

---

#### workflow.testV2

Test a V2 workflow with mock data (no side effects).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.v2_tested` |

**Input:**

```typescript
{
  workflowId: string;
  triggerData: Record<string, unknown>;
}
```

**Output:** `{ executionId: string }` (execution has `isTest: true`)

---

### Workflow Approvals

#### workflow.processApproval

Approve or reject a pending approval.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.approval_approved` or `workflows.approval_rejected` |

**Input:**

```typescript
{
  approvalId: string;
  decision: 'approved' | 'rejected';
  reason?: string;
}
```

**Output:**

```typescript
{
  approval: WorkflowApproval;
  executionId: string;            // Execution resumes if approved
}
```

---

#### workflow.listApprovals

List pending approvals.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `protectedProcedure` |

**Input:**

```typescript
{
  status?: ApprovalStatus;
  ventureId?: string;
  limit?: number;
  cursor?: string;
}
```

**Output:** `{ items: WorkflowApproval[], nextCursor: string | null }`

---

#### workflow.checkApprovalTimeouts

Process expired approvals (called by cron).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.approval_timeouts_checked` |

**Input:** `{}` (no input required)

**Output:** `{ processedCount: number }`

---

### Workflow Templates

#### workflow.createTemplate

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.template_created` |

**Input:**

```typescript
{
  name: string;
  description?: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isPublic?: boolean;
}
```

**Output:** `WorkflowTemplate`

---

#### workflow.instantiateTemplate

Create a workflow from a template.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |
| **Audit Event** | `workflows.template_instantiated` |

**Input:**

```typescript
{
  templateId: string;
  workflowName: string;
  ventureId: string;
}
```

**Output:** `Workflow`

---

#### workflow.getTemplate / updateTemplate / deleteTemplate / listTemplates

Standard CRUD operations for workflow templates. Guards: read = `protectedProcedure`, mutations = `adminProcedure`.

---

## Time Tracking API

### timeEntry.list

List time entries with filtering.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  taskId?: string;
  userId?: string;
  projectId?: string;
  startDate?: string;             // ISO date
  endDate?: string;               // ISO date
  isBillable?: boolean;
  isApproved?: boolean;
  source?: TimeEntrySource;
  limit?: number;
  cursor?: string;
}
```

**Output:** `{ items: TimeEntry[], nextCursor: string | null }`

---

### timeEntry.get

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:** `{ id: string }`

**Output:** `TimeEntry`

---

### timeEntry.create

Create a manual time entry.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  taskId: string;
  description?: string;
  durationMinutes: number;        // Required for manual entries
  startedAt: string;              // ISO datetime
  endedAt?: string;               // ISO datetime
  category?: string;
  tags?: string[];
  isBillable?: boolean;
  hourlyRate?: string;            // Decimal string: "150.00"
  currency?: string;              // Default: 'USD'
}
```

**Output:** `TimeEntry`

---

### timeEntry.update

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:** `{ id: string; ...partial time entry fields }`

**Output:** `TimeEntry`

---

### timeEntry.delete

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:** `{ id: string }`

**Output:** `{ success: boolean }`

---

### timeEntry.startTimer

Start a live timer for a task.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  taskId: string;
  description?: string;
  isBillable?: boolean;
}
```

**Output:** `TimeEntry` (with `isRunning: true`, `endedAt: null`)

**Errors:**
- `"You already have a running timer. Please stop it first."` — one timer per user constraint

**Side Effects:**
- Creates time entry with `source: 'timer'`, `isRunning: true`
- Creates task activity with `activityType: 'timer_started'`

---

### timeEntry.stopTimer

Stop a running timer.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  id: string;                     // Time entry UUID
}
```

**Output:** `TimeEntry` (with `isRunning: false`, calculated `durationMinutes`)

**Errors:**
- `"Timer not found"` — invalid timer ID
- `"Timer is not running"` — timer already stopped

**Side Effects:**
- Sets `endedAt` to current timestamp
- Calculates `durationMinutes` from `startedAt` to `endedAt`
- Updates `task.timeSpentMinutes` via aggregation query
- Creates task activity with `activityType: 'timer_stopped'`

---

### timeEntry.activeTimer

Get the current user's active timer.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:** `{}` (uses authenticated user from context)

**Output:** `TimeEntry | null`

---

### timeEntry.approve

Bulk approve time entries.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  ids: string[];                  // Array of time entry UUIDs
}
```

**Output:** `{ approved: number }`

---

### timeEntry.timesheet

Generate a timesheet report for a date range.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  startDate: string;              // ISO date
  endDate: string;                // ISO date
  userId?: string;                // Default: current user
  projectId?: string;
}
```

**Output:**

```typescript
{
  entries: TimeEntry[];
  totalMinutes: number;
  billableMinutes: number;
  totalCost: number;              // Sum of (durationMinutes/60 * hourlyRate)
  byDay: Array<{
    date: string;
    minutes: number;
    billableMinutes: number;
  }>;
  byProject: Array<{
    projectId: string;
    projectName: string;
    minutes: number;
    billableMinutes: number;
  }>;
}
```

---

### timeEntry.projectSummary

Get time summary grouped by project.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  startDate?: string;
  endDate?: string;
}
```

**Output:**

```typescript
Array<{
  projectId: string;
  projectName: string;
  totalMinutes: number;
  billableMinutes: number;
  entryCount: number;
}>
```

---

## Document Editor API

### Documents

#### documentEditor.createDocument

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  title: string;
  templateId?: string;
  parentType?: 'invoice' | 'proposal' | 'estimate' | 'standalone';
  parentId?: string;
  blocks?: DocumentBlock[];
  variables?: Record<string, unknown>;
}
```

**Output:** `Document`

---

#### documentEditor.getDocument

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:** `{ id: string }`

**Output:** `Document`

---

#### documentEditor.updateDocument

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:** `{ id: string; title?: string; blocks?: DocumentBlock[]; variables?: Record<string, unknown> }`

**Output:** `Document`

---

#### documentEditor.deleteDocument / listDocuments

Standard CRUD. `deleteDocument` requires `adminProcedure`, `listDocuments` uses `ventureProcedure`.

---

### Block Operations

#### documentEditor.addBlock

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  documentId: string;
  block: DocumentBlock;
  afterBlockId?: string;          // Insert after this block
}
```

**Output:** `Document` (with updated blocks)

---

#### documentEditor.updateBlock

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  documentId: string;
  blockId: string;
  content?: string;
  properties?: Record<string, unknown>;
  styles?: DocumentBlockStyles;
}
```

**Output:** `Document`

---

#### documentEditor.removeBlock / moveBlock / duplicateBlock

Standard block manipulation. All require `adminProcedure`.

---

### Version Management

#### documentEditor.saveVersion

Save a version snapshot.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  documentId: string;
  changeDescription?: string;
}
```

**Output:** `DocumentVersion`

---

#### documentEditor.getVersionHistory

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:** `{ documentId: string; page?: number; pageSize?: number }`

**Output:** `{ items: DocumentVersion[], totalCount: number }`

---

#### documentEditor.restoreVersion

Restore document to a previous version.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:** `{ documentId: string; versionId: string }`

**Output:** `Document`

---

### Collaboration

#### documentEditor.lockDocument

Lock a document for exclusive editing.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `protectedProcedure` |

**Input:** `{ documentId: string }`

**Output:** `Document`

---

#### documentEditor.unlockDocument

Unlock a document (only by lock holder).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `protectedProcedure` |

**Input:** `{ documentId: string }`

**Output:** `Document`

---

#### documentEditor.forceUnlockDocument

Admin force unlock.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:** `{ documentId: string }`

**Output:** `Document`

---

#### documentEditor.addCollaborator / removeCollaborator

Manage document collaborators. Require `adminProcedure`.

**Input (add):**

```typescript
{
  documentId: string;
  userId: string;
  role: 'viewer' | 'commenter' | 'editor' | 'admin';
}
```

---

### Variables

#### documentEditor.resolveVariables

Resolve CRM merge fields in a document.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  documentId: string;
  data: Record<string, unknown>;  // Key-value pairs for variable resolution
}
```

**Output:** `Document` (with resolved variables)

**Example:**

```typescript
await trpc.documentEditor.resolveVariables.mutate({
  documentId: 'doc_abc',
  data: {
    'contact.firstName': 'Sarah',
    'contact.company': 'Enterprise Corp',
    'invoice.total': '$45,000',
  },
});
```

---

### Publish Flow

#### documentEditor.submitForReview

Transition document from `draft` → `review`.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:** `{ documentId: string }`

**Output:** `Document`

---

#### documentEditor.approveDocument

Transition document from `review` → `approved`.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:** `{ documentId: string }`

**Output:** `Document`

---

#### documentEditor.publishDocument

Transition document from `approved` → `published`.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:** `{ documentId: string }`

**Output:** `Document` (sets `publishedAt`, increments `publishedVersion`)

---

#### documentEditor.archiveDocument

Transition any document → `archived`.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:** `{ documentId: string }`

**Output:** `Document`

---

#### documentEditor.cloneFromTemplate

Create a document from a template.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  templateId: string;
  title: string;
  parentType?: string;
  parentId?: string;
}
```

**Output:** `Document`

---

### Templates

Standard CRUD: `createTemplate`, `getTemplate`, `updateTemplate`, `deleteTemplate`, `listTemplates` (venture-scoped), `listPublicTemplates` (marketplace).

Additional:

#### documentEditor.createTemplateFromDocument

Convert an existing document into a reusable template.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  documentId: string;
  name: string;
  category: 'invoice' | 'proposal' | 'estimate' | 'contract' | 'report' | 'custom';
  description?: string;
  isPublic?: boolean;
}
```

**Output:** `DocumentTemplate`

---

### AI Suggestions

#### documentEditor.generateSuggestion

Generate an AI rewrite suggestion for a block.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  documentId: string;
  blockId: string;
  suggestionType: 'rewrite' | 'expand' | 'summarize' | 'translate' | 'tone_change' | 'grammar';
}
```

**Output:** `AiContentSuggestion`

---

#### documentEditor.expandContent

AI-expand brief content into full paragraphs.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  documentId: string;
  blockId: string;
}
```

**Output:** `AiContentSuggestion`

---

#### documentEditor.translateBlock

Translate block content to a target language.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  documentId: string;
  blockId: string;
  targetLanguage: string;         // ISO language code: 'fr', 'es', 'de', etc.
}
```

**Output:** `AiContentSuggestion`

---

#### documentEditor.adjustTone

Adjust block tone/voice.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  documentId: string;
  blockId: string;
  targetTone: string;             // 'professional' | 'casual' | 'formal' | 'friendly' | etc.
}
```

**Output:** `AiContentSuggestion`

---

#### documentEditor.generateFromPrompt

Generate new content from a free-form prompt.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  documentId: string;
  prompt: string;
  afterBlockId?: string;
}
```

**Output:** `DocumentBlock` (inserted into document)

---

#### documentEditor.acceptSuggestion / rejectSuggestion

Accept or reject an AI suggestion.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:** `{ suggestionId: string }`

**Output:** `AiContentSuggestion` (updated status)

**Side Effects (accept):** Applies suggested content to the document block.

---

#### documentEditor.listSuggestions

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:** `{ documentId: string; status?: SuggestionStatus }`

**Output:** `AiContentSuggestion[]`

---

### Assets

#### documentEditor.createAsset

Create a reusable content asset.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:**

```typescript
{
  name: string;
  type: 'text_snippet' | 'image' | 'logo' | 'signature'
    | 'clause' | 'pricing_table' | 'header' | 'footer';
  content: Record<string, unknown>;
  tags?: string[];
}
```

**Output:** `DocumentAsset`

---

#### documentEditor.searchAssetsByTags

Search assets by tags.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Guard** | `ventureProcedure` |

**Input:**

```typescript
{
  tags: string[];
  page?: number;
  pageSize?: number;
}
```

**Output:** `{ items: DocumentAsset[], totalCount: number }`

---

#### documentEditor.incrementAssetUsage

Track asset usage when inserted into a document.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `protectedProcedure` |

**Input:** `{ id: string }`

**Output:** `DocumentAsset` (with incremented `usageCount`)

---

Standard asset CRUD: `getAsset`, `updateAsset`, `deleteAsset`, `listAssets`.

---

### Comments

#### documentEditor.createComment

Add a block-level comment.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `protectedProcedure` |

**Input:**

```typescript
{
  documentId: string;
  blockId?: string;               // Optional: attach to specific block
  content: string;
  parentCommentId?: string;       // For threaded replies
}
```

**Output:** `DocumentComment`

---

#### documentEditor.resolveComment

Resolve a comment thread.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Guard** | `adminProcedure` |

**Input:** `{ id: string }`

**Output:** `DocumentComment`

---

Standard comment operations: `updateComment` (own only, `protectedProcedure`), `deleteComment` (`adminProcedure`), `listComments`, `listCommentReplies` (`ventureProcedure`).

---

## Types & Schemas

### Core Type Exports

```typescript
// Task types
export type { Task, NewTask, TaskStatus, TaskPriority, TaskType }
export type { OwnerType, TaskTier, VentureScope, Department, TaskSource }
export type { TaskAssignment, NewTaskAssignment, AssigneeType, AssignmentRole, AssignmentStatus }
export type { TaskActivity, NewTaskActivity, TaskActivityType, ActorType }
export type { TaskDependency, NewTaskDependency, DependencyType }
export type { TaskTemplate, NewTaskTemplate, TemplateChecklistItem, TemplateFieldDefault }

// Project types
export type { Project, NewProject, ProjectStatus, ProjectVisibility, ProjectSettings }

// Sprint types
export type { Sprint, NewSprint, SprintStatus }

// Workflow types
export type { Workflow, NewWorkflow, WorkflowTriggerType, WorkflowTriggerConditions, WorkflowAction }
export type { WorkflowNode, WorkflowNodeType, WorkflowEdge }
export type { ConditionGroup, Condition, ComparisonOperator, BusinessHoursConfig }
export type { WorkflowVersion, NewWorkflowVersion }
export type { WorkflowExecution, NewWorkflowExecution, WorkflowExecutionStatus }
export type { WorkflowStepExecution, NewWorkflowStepExecution, StepExecutionStatus }
export type { WorkflowApproval, NewWorkflowApproval, ApprovalStatus }
export type { WorkflowTemplate, NewWorkflowTemplate }

// Time entry types
export type { TimeEntry, NewTimeEntry }

// Document types
export type { Document, NewDocument }
export type { DocumentTemplate, NewDocumentTemplate }
export type { DocumentVersion, NewDocumentVersion }
export type { DocumentComment, NewDocumentComment }
export type { DocumentAsset, NewDocumentAsset }
export type { AiContentSuggestion, NewAiContentSuggestion }
export type { DocumentBlock, DocumentBlockType, DocumentBlockStyles }
export type { DocumentBlockAnimation, DocumentBlockVisibility }
export type { DocumentVariableDefinition, DocumentCollaborator }
```

### Zod Input Schemas

All API inputs are validated with Zod schemas. Key schemas:

```typescript
// Task creation
const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(50000).optional(),
  status: z.enum(taskStatuses).optional(),
  priority: z.enum(taskPriorities).optional(),
  type: z.enum(taskTypes).optional(),
  ownerType: z.enum(ownerTypes).optional(),
  taskTier: z.enum(taskTiers).optional(),
  storyPoints: z.number().int().min(0).max(100).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tags: z.array(z.string().max(50)).max(50).optional(),
});

// Workflow execution
const executeV2Schema = z.object({
  workflowId: z.string().uuid(),
  triggerData: z.record(z.unknown()),
  isTest: z.boolean().optional().default(false),
});

// Time entry
const createTimeEntrySchema = z.object({
  taskId: z.string().uuid(),
  durationMinutes: z.number().int().min(1),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  description: z.string().max(5000).optional(),
  isBillable: z.boolean().optional().default(false),
  hourlyRate: z.string().regex(/^\d+\.\d{2}$/).optional(),
  currency: z.string().length(3).optional().default('USD'),
});
```

---

## Events

### Audit Event Catalog

All mutations emit structured audit events via `AuditService.log()`:

```typescript
interface AuditLogEntry {
  action: string;           // Namespaced event identifier
  userId: string;           // Authenticated user
  ventureId: string;        // Venture context
  ipAddress: string;        // Client IP
  metadata: Record<string, unknown>;
}
```

| Event | Trigger | Key Metadata |
|-------|---------|-------------|
| `tasks.created` | Task creation | `taskTitle`, `projectId` |
| `tasks.updated` | Task update | `taskId`, changed fields |
| `tasks.deleted` | Task deletion | `taskId` |
| `projects.created` | Project creation | `projectId`, `name` |
| `projects.updated` | Project update | `projectId`, `changes` |
| `projects.archived` | Project archived | `projectId` |
| `projects.deleted` | Project deletion | `projectId` |
| `workflows.created` | Workflow creation | `workflowId`, `workflowName`, `triggerType`, `actionCount` |
| `workflows.updated` | Workflow update | `workflowId`, `changes` |
| `workflows.deleted` | Workflow deletion | `workflowId` |
| `workflows.activated` | Workflow enabled | `workflowId`, `isActive: true` |
| `workflows.deactivated` | Workflow disabled | `workflowId`, `isActive: false` |
| `workflows.tested` | V1 test run | `workflowId`, `taskId`, `runId`, `runStatus` |
| `workflows.version_created` | Version snapshot | `workflowId`, `versionId`, `nodeCount`, `edgeCount` |
| `workflows.version_rollback` | Version rollback | `workflowId`, `rolledBackTo`, `newVersionId` |
| `workflows.execution_started` | V2 execution | `workflowId`, `executionId`, `isTest` |
| `workflows.execution_resumed` | Execution resumed | `executionId` |
| `workflows.execution_cancelled` | Execution cancelled | `executionId` |
| `workflows.execution_retried` | Execution retried | `originalExecutionId`, `newExecutionId`, `fromStepId` |
| `workflows.step_replayed` | Step replayed | `stepExecutionId`, `hasOverride` |
| `workflows.v2_tested` | V2 test | `workflowId`, `executionId` |
| `workflows.approval_approved` | Approval granted | `approvalId`, `decision`, `reason`, `executionId` |
| `workflows.approval_rejected` | Approval denied | `approvalId`, `decision`, `reason`, `executionId` |
| `workflows.approval_timeouts_checked` | Timeout scan | `processedCount` |
| `workflows.template_created` | Template creation | `templateId`, `templateName`, `category`, `isPublic` |
| `workflows.template_updated` | Template update | `templateId` |
| `workflows.template_deleted` | Template deletion | `templateId` |
| `workflows.template_instantiated` | Template → workflow | `templateId`, `workflowId`, `workflowName` |

---

## Error Codes

### HTTP Error Mapping

| Code | HTTP | tRPC Code | Description |
|------|------|-----------|-------------|
| 400 | Bad Request | `BAD_REQUEST` | Invalid input, self-dependency, invalid status transition |
| 401 | Unauthorized | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | Forbidden | `FORBIDDEN` | Insufficient permissions (admin required) |
| 404 | Not Found | `NOT_FOUND` | Resource not found or not in venture scope |
| 409 | Conflict | `CONFLICT` | Duplicate dependency, running timer exists |
| 500 | Internal Error | `INTERNAL_SERVER_ERROR` | Database unavailable, unexpected failure |

### Domain-Specific Errors

| Error Message | Context | Code | Resolution |
|---------------|---------|------|------------|
| `"Task not found"` | Task CRUD | 404 | Verify task ID and venture |
| `"Project not found in this venture"` | Task creation | 404 | Verify project is in current venture |
| `"Parent task not found in this project"` | Subtask creation | 404 | Parent must be in same project |
| `"A task cannot depend on itself"` | Add dependency | 400 | Use different task IDs |
| `"Adding this dependency would create a circular dependency"` | Add dependency | 400 | Remove conflicting dependency first |
| `"This dependency already exists"` | Add dependency | 409 | Dependency already exists |
| `"One or both tasks not found"` | Add dependency | 404 | Verify both task IDs |
| `"You already have a running timer. Please stop it first."` | Start timer | 409 | Stop existing timer |
| `"Timer not found"` | Stop timer | 404 | Verify timer ID |
| `"Timer is not running"` | Stop timer | 400 | Timer already stopped |
| `"Venture context required"` | Document ops | 400 | Missing venture context |
| `"Document not found"` | Document CRUD | 404 | Verify document ID and venture |
| `"Template not found"` | Template lookup | 404 | Verify template ID |
| `"Asset not found"` | Asset lookup | 404 | Verify asset ID |
| `"Comment not found or not owned by you"` | Comment edit | 403 | Only owner can edit |
| `"Workflow not found"` | Workflow CRUD | 404 | Verify workflow ID |
| `"Execution not found"` | Execution control | 404 | Verify execution ID |
| `"Execution is {status}, not paused"` | Resume execution | 400 | Only paused executions can resume |
| `"Version not found"` | Version rollback | 404 | Verify version ID matches workflow |
| `"Failed to create execution"` | Execution start | 500 | Database issue |
| `"Database not available"` | Any operation | 500 | Check DB connectivity |

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `WORKFLOW_MAX_LOOP_ITERATIONS` | No | `1000` | Max loop iterations in V2 engine |
| `WORKFLOW_DEFAULT_RETRY_MAX` | No | `3` | Default retry attempts |
| `WORKFLOW_DEFAULT_BACKOFF_MS` | No | `1000` | Default retry backoff (ms) |
| `WORKFLOW_BACKOFF_MULTIPLIER` | No | `2` | Exponential backoff multiplier |
| `WORKFLOW_APPROVAL_TIMEOUT_HOURS` | No | `72` | Approval expiry (hours) |
| `TIMER_STALE_LOCK_MINUTES` | No | `30` | Document lock auto-expiry |
| `TASK_MAX_SUBTASK_DEPTH` | No | `5` | Max subtask hierarchy depth |
| `TASK_MAX_DEPENDENCIES` | No | `20` | Max dependencies per task |
| `DOCUMENT_MAX_BLOCKS` | No | `500` | Max blocks per document |
| `DOCUMENT_MAX_COLLABORATORS` | No | `50` | Max collaborators per document |
| `AI_SUGGESTION_EXPIRY_HOURS` | No | `168` | AI suggestion auto-expiry (7 days) |
| `TIME_ENTRY_APPROVAL_REQUIRED` | No | `false` | Require time entry approval |
| `SPRINT_DEFAULT_LENGTH_WEEKS` | No | `2` | Default sprint duration |

---

*@mcv/operations — Operations Management Domain*
