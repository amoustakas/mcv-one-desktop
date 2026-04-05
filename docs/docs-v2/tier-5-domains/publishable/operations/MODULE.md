# @mcv/operations — Operations Domain Module

**Parent Package:** @mcv/domains  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Submodules:** Assets · Calendar · Editor · Tasks · Time · Workflows  
**Last Updated:** February 8, 2026

---

## Purpose

The `operations` domain provides the complete work management backbone for the MCV platform. It orchestrates how work is defined, organized, assigned, tracked, automated, and documented across every venture. From a single task creation through sprint planning, dependency management, time tracking, workflow automation, and document generation — Operations is the connective tissue that turns strategic intent into measurable execution.

**This domain answers the fundamental question: "What work needs to happen, who/what does it, when, and how do we know it's done?"**

Unlike standalone project management tools, Operations is deeply integrated with MCV's AI-native architecture:
- **Tasks** support agentic ownership models — work items can be assigned to humans, AI agents, or hybrid teams
- **Workflows** go beyond simple automations with a full graph-based execution engine supporting parallel branches, loops, human-in-the-loop approvals, and sub-workflows
- **Time Tracking** captures effort from both human and agent contributors with billable hours and approval flows
- **Documents** provide block-based editing with AI-powered content suggestions, variable resolution from CRM data, and full publish lifecycle
- **Assets** offer reusable content components (snippets, clauses, signatures) for document assembly

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// TASKS SUBMODULE
// ═══════════════════════════════════════════════════════════════════════════════

// Core task operations
export {
  TaskService,               // Venture-scoped task CRUD + business logic
  taskRouter,                // tRPC router for task endpoints
} from './tasks';

// Task schemas & tables
export {
  tasks,                     // Drizzle table: tasks
  taskAssignments,           // Drizzle table: task_assignments
  taskActivities,            // Drizzle table: task_activities
  taskDependencies,          // Drizzle table: task_dependencies
  taskTemplates,             // Drizzle table: task_templates
} from './tasks/schema';

// Task enums & constants
export {
  taskStatuses,              // ['draft','backlog','ready','queued','todo',...]
  taskPriorities,            // ['lowest','low','medium','high','highest']
  taskTypes,                 // ['epic','story','task','bug','subtask',...]
  ownerTypes,                // ['human_only','human_primary','hybrid',...]
  taskTiers,                 // ['T1','T2','T3','T4']
  taskSources,               // ['manual','ai_generated','template',...]
  assigneeTypes,             // ['user','team','agent','agent_pool',...]
  assignmentRoles,           // ['owner','assignee','reviewer','approver',...]
  assignmentStatuses,        // ['pending','accepted','active','completed',...]
  taskActivityTypes,         // ['status_change','created','agent_assigned',...]
  dependencyTypes,           // ['finish_to_start','start_to_start',...]
} from './tasks/constants';

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS SUBMODULE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  ProjectService,            // Venture-scoped project CRUD + hierarchy
  projectRouter,             // tRPC router for project endpoints
} from './projects';

export {
  projects,                  // Drizzle table: projects
  projectStatuses,           // ['planning','active','on_hold','completed','archived']
  projectVisibilities,       // ['private','team','venture','global']
} from './projects/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINTS SUBMODULE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  sprints,                   // Drizzle table: sprints
  sprintStatuses,            // ['planning','active','review','completed','cancelled']
} from './sprints/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOWS SUBMODULE
// ═══════════════════════════════════════════════════════════════════════════════

// Core workflow operations
export {
  WorkflowEngine,            // V2 graph-based execution engine
  WorkflowService,           // Workflow CRUD + management
  workflowRouter,            // tRPC router for workflow endpoints
} from './workflows';

// Workflow schemas & tables
export {
  workflows,                 // Drizzle table: workflows (v1 definitions)
  workflowVersions,          // Drizzle table: workflow_versions
  workflowExecutions,        // Drizzle table: workflow_executions
  workflowStepExecutions,    // Drizzle table: workflow_step_executions
  workflowApprovals,         // Drizzle table: workflow_approvals
  workflowTemplates,         // Drizzle table: workflow_templates
} from './workflows/schema';

// Condition evaluator (exported from engine)
export {
  evaluateConditionGroup,    // Evaluate nested AND/OR/NOT conditions
  resolveVariable,           // Resolve {{variable.path}} references
  interpolateTemplate,       // Interpolate template strings
} from './workflows/engine';

// ═══════════════════════════════════════════════════════════════════════════════
// TIME TRACKING SUBMODULE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  timeEntryRouter,           // tRPC router for time entries
} from './time';

export {
  timeEntries,               // Drizzle table: time_entries
  timeEntrySourceEnum,       // pgEnum: 'manual'|'timer'|'import'|'api'|'agent'|'integration'
} from './time/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// EDITOR SUBMODULE (Document Editor)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  documentEditorRouter,      // tRPC router: full document CRUD, blocks, AI, publish
} from './editor';

export {
  documents,                 // Drizzle table: documents
  documentTemplates,         // Drizzle table: document_templates
  documentVersions,          // Drizzle table: document_versions
  documentComments,          // Drizzle table: document_comments
  documentAssets,            // Drizzle table: document_assets
  aiContentSuggestions,      // Drizzle table: ai_content_suggestions
} from './editor/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Task types
  Task,
  NewTask,
  TaskStatus,
  TaskPriority,
  TaskType,
  OwnerType,
  TaskTier,
  VentureScope,
  Department,
  TaskSource,

  // Assignment types
  TaskAssignment,
  NewTaskAssignment,
  AssigneeType,
  AssignmentRole,
  AssignmentStatus,

  // Activity types
  TaskActivity,
  NewTaskActivity,
  TaskActivityType,
  ActorType,

  // Dependency types
  TaskDependency,
  NewTaskDependency,
  DependencyType,

  // Template types
  TaskTemplate,
  NewTaskTemplate,
  TemplateChecklistItem,
  TemplateFieldDefault,

  // Project types
  Project,
  NewProject,
  ProjectStatus,
  ProjectVisibility,
  ProjectSettings,

  // Sprint types
  Sprint,
  NewSprint,
  SprintStatus,

  // Workflow types
  Workflow,
  NewWorkflow,
  WorkflowTriggerType,
  WorkflowTriggerConditions,
  WorkflowAction,
  WorkflowNode,
  WorkflowNodeType,
  WorkflowEdge,
  ConditionGroup,
  Condition,
  ComparisonOperator,
  BusinessHoursConfig,
  WorkflowVersion,
  NewWorkflowVersion,
  WorkflowExecution,
  NewWorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowStepExecution,
  NewWorkflowStepExecution,
  StepExecutionStatus,
  WorkflowApproval,
  NewWorkflowApproval,
  ApprovalStatus,
  WorkflowTemplate,
  NewWorkflowTemplate,

  // Time entry types
  TimeEntry,
  NewTimeEntry,

  // Document types
  Document,
  NewDocument,
  DocumentTemplate,
  NewDocumentTemplate,
  DocumentVersion,
  NewDocumentVersion,
  DocumentComment,
  NewDocumentComment,
  DocumentAsset,
  NewDocumentAsset,
  AiContentSuggestion,
  NewAiContentSuggestion,
  DocumentBlock,
  DocumentBlockType,
  DocumentBlockStyles,
  DocumentBlockAnimation,
  DocumentBlockVisibility,
  DocumentVariableDefinition,
  DocumentCollaborator,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          OPERATIONS DOMAIN ARCHITECTURE                                  │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                             CLIENT LAYER                                           │  │
│  │                                                                                    │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │  │
│  │  │  Board View  │ │  List View   │ │  Gantt View  │ │  Calendar    │             │  │
│  │  │  (Kanban)    │ │  (Table)     │ │  (Timeline)  │ │  View        │             │  │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘             │  │
│  │         │                │                │                │                      │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │  │
│  │  │  Sprint      │ │  Time Sheet  │ │  Document    │ │  Workflow    │             │  │
│  │  │  Planner     │ │  Dashboard   │ │  Editor      │ │  Builder     │             │  │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘             │  │
│  │         │                │                │                │                      │  │
│  └─────────┴────────────────┴────────────────┴────────────────┴──────────────────────┘  │
│                                       │                                                  │
│                              tRPC Procedures                                             │
│                                       │                                                  │
│  ┌────────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                             API ROUTER LAYER                                       │  │
│  │                                                                                    │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │  │
│  │  │ taskRouter   │ │ projectRouter│ │ workflowRouter│ │ timeEntry-   │             │  │
│  │  │              │ │              │ │              │ │ Router       │             │  │
│  │  │ • list       │ │ • list       │ │ • list       │ │ • list       │             │  │
│  │  │ • get        │ │ • get        │ │ • get        │ │ • get        │             │  │
│  │  │ • create     │ │ • create     │ │ • create     │ │ • create     │             │  │
│  │  │ • update     │ │ • update     │ │ • update     │ │ • update     │             │  │
│  │  │ • delete     │ │ • delete     │ │ • delete     │ │ • delete     │             │  │
│  │  │ • status     │ │ • hierarchy  │ │ • executeV2  │ │ • startTimer │             │  │
│  │  │ • deps       │ │ • stats      │ │ • approvals  │ │ • stopTimer  │             │  │
│  │  │ • comments   │ │ • archive    │ │ • templates  │ │ • approve    │             │  │
│  │  │ • subtasks   │ │              │ │ • versions   │ │ • timesheet  │             │  │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘             │  │
│  │         │                │                │                │                      │  │
│  │  ┌──────────────────────────────────┐ ┌──────────────────────────┐               │  │
│  │  │ documentEditorRouter             │ │ (Sprint/Calendar         │               │  │
│  │  │                                  │ │  routers planned)        │               │  │
│  │  │ • documents (CRUD, blocks, lock) │ │                          │               │  │
│  │  │ • templates (CRUD, clone)        │ └──────────────────────────┘               │  │
│  │  │ • AI suggestions (generate,      │                                             │  │
│  │  │   expand, translate, tone)       │                                             │  │
│  │  │ • assets (CRUD, search by tags)  │                                             │  │
│  │  │ • comments (threaded, resolve)   │                                             │  │
│  │  │ • versions (save, restore)       │                                             │  │
│  │  │ • publish flow (review→approve→  │                                             │  │
│  │  │   publish→archive)               │                                             │  │
│  │  └──────────────┬───────────────────┘                                             │  │
│  │                 │                                                                  │  │
│  └─────────────────┴──────────────────────────────────────────────────────────────────┘  │
│                                       │                                                  │
│  ┌────────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                           SERVICE LAYER                                            │  │
│  │                                                                                    │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐       │  │
│  │  │   TaskService       │  │   WorkflowEngine    │  │   DocumentService   │       │  │
│  │  │                     │  │                     │  │                     │       │  │
│  │  │ • Venture-scoped    │  │ • Graph execution   │  │ • Block CRUD       │       │  │
│  │  │ • Dependency graph  │  │ • Parallel branches │  │ • Version history  │       │  │
│  │  │ • Cycle detection   │  │ • Loop control      │  │ • Lock management  │       │  │
│  │  │ • Bulk operations   │  │ • Try/catch/retry   │  │ • Variable resolve │       │  │
│  │  │ • History tracking  │  │ • HITL approvals    │  │ • Publish flow     │       │  │
│  │  │ • Comment threads   │  │ • Sub-workflows     │  │ • AI suggestions   │       │  │
│  │  │ • Position reorder  │  │ • Condition eval    │  │ • Collaboration    │       │  │
│  │  └────────┬────────────┘  │ • Business hours    │  └────────┬────────────┘       │  │
│  │           │               │ • Rate limiting     │           │                     │  │
│  │  ┌────────┴────────────┐  │ • Split testing     │  ┌────────┴────────────┐       │  │
│  │  │  ProjectService     │  │ • Version rollback  │  │  AiContentService   │       │  │
│  │  │                     │  └─────────┬───────────┘  │                     │       │  │
│  │  │ • Hierarchy tree    │            │              │ • Rewrite           │       │  │
│  │  │ • Stats aggregation │            │              │ • Expand            │       │  │
│  │  │ • Archive logic     │            │              │ • Translate         │       │  │
│  │  └─────────────────────┘            │              │ • Tone adjust      │       │  │
│  │                                     │              │ • Prompt generate  │       │  │
│  │                          ┌──────────┴──────────┐   └─────────────────────┘       │  │
│  │                          │  AuditService       │                                  │  │
│  │                          │                     │                                  │  │
│  │                          │ • All mutations     │                                  │  │
│  │                          │   emit audit logs   │                                  │  │
│  │                          └─────────────────────┘                                  │  │
│  │                                                                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                                  │
│  ┌────────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                          DATABASE LAYER (PostgreSQL + Drizzle ORM)                 │  │
│  │                                                                                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌────────────────┐      │  │
│  │  │  tasks   │ │ projects │ │ sprints  │ │ task_        │ │ task_          │      │  │
│  │  │          │ │          │ │          │ │ assignments  │ │ activities     │      │  │
│  │  │ 50+ cols │ │ 14 cols  │ │ 18 cols  │ │ 22 cols      │ │ 14 cols        │      │  │
│  │  │ 18 idx   │ │ 6 idx    │ │ 5 idx    │ │ 6 idx        │ │ 6 idx          │      │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ └────────────────┘      │  │
│  │                                                                                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │  │
│  │  │task_deps │ │task_     │ │ workflows    │ │ workflow_    │ │ workflow_    │    │  │
│  │  │          │ │templates │ │              │ │ versions     │ │ executions   │    │  │
│  │  │ 5 cols   │ │ 23 cols  │ │ 13 cols      │ │ 6 cols       │ │ 14 cols      │    │  │
│  │  │ 1 uniq   │ │ 5 idx    │ │ 6 idx        │ │ 2 idx        │ │ 7 idx        │    │  │
│  │  └──────────┘ └──────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │  │
│  │                                                                                    │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │  │
│  │  │ workflow_    │ │ workflow_    │ │ time_entries │ │ documents    │             │  │
│  │  │ step_execs   │ │ approvals    │ │              │ │              │             │  │
│  │  │ 13 cols      │ │ 12 cols      │ │ 19 cols      │ │ 17 cols      │             │  │
│  │  │ 3 idx        │ │ 4 idx        │ │ 7 idx        │ │ 6 idx        │             │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘             │  │
│  │                                                                                    │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │  │
│  │  │ document_    │ │ document_    │ │ document_    │ │ ai_content_  │             │  │
│  │  │ templates    │ │ versions     │ │ comments     │ │ suggestions  │             │  │
│  │  │ 14 cols      │ │ 6 cols       │ │ 10 cols      │ │ 9 cols       │             │  │
│  │  │ 5 idx        │ │ 2 idx        │ │ 4 idx        │ │ 3 idx        │             │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘             │  │
│  │                                                                                    │  │
│  │  ┌──────────────┐ ┌──────────────┐                                                │  │
│  │  │ document_    │ │ workflow_    │                                                │  │
│  │  │ assets       │ │ templates    │                                                │  │
│  │  │ 9 cols       │ │ 12 cols      │                                                │  │
│  │  │ 2 idx        │ │ 4 idx        │                                                │  │
│  │  └──────────────┘ └──────────────┘                                                │  │
│  │                                                                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          ENTITY RELATIONSHIP MAP                                   │  │
│  │                                                                                    │  │
│  │    ventures ──┬──< projects ──< tasks ──<── task_assignments                      │  │
│  │               │       │          │  ├──<── task_activities                         │  │
│  │               │       │          │  ├──<── task_dependencies                       │  │
│  │               │       │          │  ├──<── task_comments                           │  │
│  │               │       │          │  ├──<── task_history                            │  │
│  │               │       │          │  └──<── time_entries                            │  │
│  │               │       │          │                                                 │  │
│  │               │       │          └──── tasks (parent_id → self)                    │  │
│  │               │       │                                                            │  │
│  │               │       └──< sprints ──< tasks (sprint_id)                          │  │
│  │               │                                                                    │  │
│  │               ├──< workflows ──< workflow_versions                                │  │
│  │               │       │   └──< workflow_executions ──< workflow_step_executions    │  │
│  │               │       │                    └──< workflow_approvals                 │  │
│  │               │       └──< workflow_templates                                     │  │
│  │               │                                                                    │  │
│  │               ├──< documents ──< document_versions                                │  │
│  │               │       │   ├──< document_comments (threaded via parent_comment_id) │  │
│  │               │       │   └──< ai_content_suggestions                             │  │
│  │               │       │                                                            │  │
│  │               ├──< document_templates ──< documents (template_id)                 │  │
│  │               │                                                                    │  │
│  │               ├──< document_assets                                                │  │
│  │               │                                                                    │  │
│  │               └──< task_templates                                                 │  │
│  │                                                                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Submodule 1: Tasks

### Overview

The Tasks submodule is the core work-item engine. Every unit of work in MCV — whether created manually, generated by AI, spawned from a template, or triggered by a webhook — lives as a task. Tasks support deep hierarchy (epics → stories → tasks → subtasks), agentic ownership models, polymorphic assignments, SLA tracking, priority scoring, and comprehensive activity auditing.

### Task Status Lifecycle

```
                    ┌─────────┐
                    │  draft  │
                    └────┬────┘
                         │
                    ┌────▼────┐
           ┌────── │ backlog │ ──────┐
           │       └────┬────┘       │
           │            │            │
      ┌────▼────┐  ┌────▼────┐  ┌───▼──────┐
      │  ready  │  │ queued  │  │ deferred │
      └────┬────┘  └────┬────┘  └──────────┘
           │            │
           └─────┬──────┘
                 │
            ┌────▼────┐
            │  todo   │
            └────┬────┘
                 │
            ┌────▼────────┐
            │ in_progress │ ◄──── timer_started
            └────┬────────┘
                 │
         ┌───────┼───────────────┐
         │       │               │
    ┌────▼────┐  │          ┌────▼──────────┐
    │ blocked │  │          │  in_review    │
    └────┬────┘  │          └────┬──────────┘
         │       │               │
         └───────┤          ┌────▼──────────────┐
                 │          │ awaiting_approval  │
                 │          └────┬───────────────┘
                 │               │
                 │          ┌────▼──────────┐      ┌────────────────┐
                 │          │ hitl_pending  │──────▶│ hitl_rejected  │
                 │          └────┬──────────┘      └────────────────┘
                 │               │
                 │          ┌────▼──────────┐
                 │          │ hitl_approved │
                 │          └────┬──────────┘
                 │               │
                 └───────┬───────┘
                         │
                    ┌────▼────┐
                    │  done   │ ──── completedAt set
                    └────┬────┘
                         │
                    ┌────▼────────┐
                    │  archived   │
                    └─────────────┘

                    ┌─────────────┐
                    │  cancelled  │ (reachable from any state)
                    └─────────────┘
```

### Task Statuses

| Status | Description | AI Relevance |
|--------|-------------|--------------|
| `draft` | Incomplete specification, not ready for work | AI can auto-complete fields |
| `backlog` | Prioritized but not scheduled | AI can prioritize via scoring |
| `ready` | All prerequisites met, can be started | Eligible for auto-assignment |
| `queued` | Waiting in assignment queue | Agent pool routing |
| `todo` | Assigned and ready for execution | Default creation status |
| `in_progress` | Actively being worked on | Timer tracking active |
| `blocked` | Waiting on dependency or external input | Triggers escalation workflows |
| `in_review` | Work completed, awaiting peer review | Code review integrations |
| `awaiting_approval` | Formal approval required | Manager/stakeholder gate |
| `hitl_pending` | Awaiting human-in-the-loop decision | AI agent checkpoint |
| `hitl_approved` | HITL approved, proceeding | Agent resumes execution |
| `hitl_rejected` | HITL rejected, needs revision | Agent receives feedback |
| `done` | Successfully completed | `completedAt` timestamp set |
| `cancelled` | Abandoned, won't be done | Excluded from metrics |
| `archived` | Completed and filed away | Read-only state |
| `deferred` | Postponed to future sprint/milestone | Backlog re-entry |

### Task Priorities

| Priority | Score Weight | Description |
|----------|-------------|-------------|
| `lowest` | 10 | Nice-to-have, no urgency |
| `low` | 25 | Can wait for next sprint |
| `medium` | 50 | Standard priority (default) |
| `high` | 75 | Should be addressed soon |
| `highest` | 100 | Critical, immediate attention |

### Task Types

| Type | Hierarchy Level | Description |
|------|----------------|-------------|
| `epic` | L1 | Large body of work spanning multiple stories |
| `story` | L2 | User-facing feature or requirement |
| `feature` | L2 | Product feature (alias for story) |
| `task` | L3 | General work item (default) |
| `bug` | L3 | Defect or issue to fix |
| `subtask` | L4 | Child task broken down from parent |
| `chore` | L3 | Maintenance, cleanup, housekeeping |
| `spike` | L3 | Research/investigation with time-box |
| `research` | L3 | In-depth research without deliverable |
| `documentation` | L3 | Documentation writing/updating |
| `compliance` | L3 | Regulatory or compliance work |
| `review` | L3 | Code review, PR review |
| `approval` | L3 | Formal approval checkpoint |
| `deployment` | L3 | Release/deployment activity |
| `maintenance` | L3 | System maintenance window |
| `meeting` | L3 | Meeting or ceremony |
| `decision` | L3 | Decision record |
| `experiment` | L3 | A/B test or experiment |
| `automation` | L3 | Automation development |

### Agentic Ownership Model

Tasks support five ownership models that determine how work is routed between humans and AI:

| Owner Type | Description | Routing Behavior |
|------------|-------------|------------------|
| `human_only` | Traditional human-assigned work | Standard assignment, no agent involvement |
| `human_primary` | Human leads, AI assists | Agent can provide suggestions, draft work |
| `hybrid` | Shared human/agent responsibility | Both contribute, HITL at checkpoints |
| `agent_primary` | AI leads, human oversees | Agent executes, human reviews results |
| `agent_only` | Fully autonomous agent execution | No human intervention unless SLA breach |

### Task Tiers

| Tier | Autonomy Level | Description |
|------|---------------|-------------|
| `T1` | Full Autonomy | Agent can complete without any approval |
| `T2` | Supervised | Agent works with periodic checkpoints |
| `T3` | Collaborative | Requires human involvement at key stages |
| `T4` | Restricted | Minimal agent involvement, mostly human |

### Core Interfaces

#### Task

```typescript
interface Task {
  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════

  /** UUID primary key */
  id: string;

  /** Parent project (required, CASCADE delete) */
  projectId: string;

  /** Parent task for hierarchy (self-referential) */
  parentId: string | null;

  /** Task title */
  title: string;

  /** Rich-text description */
  description: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOW STATE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Current status in lifecycle */
  status: TaskStatus;               // default: 'todo'

  /** Priority level */
  priority: TaskPriority | null;    // default: 'medium'

  /** Work item type */
  type: TaskType | null;            // default: 'task'

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSIGNMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /** Primary assignee (user FK, SET NULL on delete) */
  assigneeId: string | null;

  /** Reporter who created the task (user FK) */
  reporterId: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTIMATION & TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  /** Story points (Fibonacci: 1, 2, 3, 5, 8, 13, 21) */
  storyPoints: number | null;

  /** Original time estimate in minutes */
  timeEstimateMinutes: number | null;

  /** Accumulated time spent in minutes (aggregated from time entries) */
  timeSpentMinutes: number;         // default: 0

  /** Refined estimate from task service */
  estimatedMinutes: number | null;

  /** Actual minutes on completion */
  actualMinutes: number | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMELINE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Planned start date (ISO date string) */
  startDate: string | null;

  /** Due date (ISO date string) */
  dueDate: string | null;

  /** When work actually started */
  startedAt: Date | null;

  /** When completed (set automatically on status→done) */
  completedAt: Date | null;

  /** When status last changed */
  statusChangedAt: Date;

  /** SLA deadline for response/completion */
  slaDeadline: Date | null;

  /** Whether SLA has been breached */
  slaBreached: boolean;             // default: false

  // ═══════════════════════════════════════════════════════════════════════════
  // AGENTIC FIELDS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Ownership model for human/AI routing */
  ownerType: OwnerType;             // default: 'human_only'

  /** Complexity/autonomy tier */
  taskTier: TaskTier;               // default: 'T2'

  /** Venture scope for multi-venture tasks */
  ventureId: string | null;
  ventureScope: VentureScope;       // default: 'venture'
  crossVentureIds: string[];        // default: []

  /** Department classification */
  department: Department | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // SPRINT & MILESTONE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Sprint this task belongs to */
  sprintId: string | null;

  /** Milestone reference */
  milestoneId: string | null;

  /** Hierarchy level override */
  hierarchyLevel: string;           // default: 'task'

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIORITY SCORING
  // ═══════════════════════════════════════════════════════════════════════════

  /** Manual priority score (0-100) */
  priorityScore: number;            // default: 50

  /** AI-computed priority score */
  aiPriorityScore: number | null;

  /** Urgency score (0-100) */
  urgencyScore: number;             // default: 50

  /** Impact score (0-100) */
  impactScore: number;              // default: 50

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  /** Board position for ordering */
  position: number;                 // default: 0

  /** Freeform tags */
  tags: string[];                   // default: []

  /** Structured labels (separate from tags) */
  labels: string[];                 // default: []

  /** Custom field values (JSONB) */
  customFields: Record<string, unknown>;  // default: {}

  /** Source of task creation */
  source: TaskSource;               // default: 'manual'

  /** Source-specific reference data (e.g., GitHub issue URL) */
  sourceReference: Record<string, unknown> | null;

  /** Acceptance criteria checklist */
  acceptanceCriteria: Array<{
    criterion: string;
    completed: boolean;
  }>;                               // default: []

  /** AI metadata (prompt history, agent decisions, etc.) */
  aiMetadata: Record<string, unknown>;  // default: {}

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT
  // ═══════════════════════════════════════════════════════════════════════════

  /** User who created the task */
  createdBy: string | null;

  /** User who last updated the task */
  updatedBy: string | null;

  /** Optimistic concurrency version */
  version: number;                  // default: 1

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

#### TaskAssignment

```typescript
interface TaskAssignment {
  id: string;

  /** Task being assigned */
  taskId: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // POLYMORPHIC ASSIGNEE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Type of assignee: 'user' | 'team' | 'agent' | 'agent_pool' | 'workflow' | 'external' */
  assigneeType: AssigneeType;

  /** Human user reference (when assigneeType = 'user') */
  userId: string | null;

  /** Team reference (when assigneeType = 'team') */
  teamId: string | null;

  /** AI agent reference (when assigneeType = 'agent') */
  agentId: string | null;          // text ID (cuid2 from ai_agents table)

  /** Agent pool for round-robin (when assigneeType = 'agent_pool') */
  agentPoolId: string | null;

  /** Workflow automation (when assigneeType = 'workflow') */
  workflowId: string | null;

  /** External system reference (when assigneeType = 'external') */
  externalReference: Record<string, unknown> | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // ROLE & STATE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Assignment role */
  role: AssignmentRole;             // default: 'assignee'

  /** Assignment state */
  status: AssignmentStatus;         // default: 'pending'

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKLOAD
  // ═══════════════════════════════════════════════════════════════════════════

  /** Percentage of capacity allocated (0-100) */
  allocationPercent: number;        // default: 100

  /** Workload units for capacity planning */
  workloadUnits: number;            // default: 1

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMELINE
  // ═══════════════════════════════════════════════════════════════════════════

  assignedAt: Date;
  acceptedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  dueDate: string | null;          // ISO date string

  // ═══════════════════════════════════════════════════════════════════════════
  // AGENT-SPECIFIC
  // ═══════════════════════════════════════════════════════════════════════════

  /** Active agent session ID */
  agentSessionId: string | null;

  /** Agent autonomy level (1-10) */
  agentAutonomyLevel: number | null;

  /** Whether HITL review is required for this assignment */
  hitlRequired: boolean;            // default: false

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA & AUDIT
  // ═══════════════════════════════════════════════════════════════════════════

  /** Reason for assignment (manual, auto-routing, escalation) */
  assignmentReason: string | null;

  /** Additional assignment metadata */
  assignmentMetadata: Record<string, unknown>;  // default: {}

  /** User who made the assignment */
  assignedBy: string | null;

  createdAt: Date;
  updatedAt: Date;
}
```

#### TaskActivity

```typescript
interface TaskActivity {
  id: string;

  /** Task this activity belongs to */
  taskId: string;

  /** Activity type categorization */
  activityType: TaskActivityType;

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTOR (polymorphic)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Who performed the action: 'user' | 'agent' | 'system' | 'workflow' */
  actorType: ActorType;

  /** Human user reference */
  userId: string | null;

  /** AI agent reference */
  agentId: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  /** Human-readable summary */
  summary: string;

  /** Structured detail data */
  details: Record<string, unknown>;

  /** Previous value (for change tracking) */
  previousValue: unknown | null;

  /** New value (for change tracking) */
  newValue: unknown | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT
  // ═══════════════════════════════════════════════════════════════════════════

  ventureId: string | null;
  sessionId: string | null;

  /** Hide from external viewers */
  isInternal: boolean;              // default: false

  /** Visible to AI agents for learning */
  isVisibleToAgents: boolean;       // default: true

  createdAt: Date;
}
```

**Activity Types (41 types across 8 categories):**

| Category | Types |
|----------|-------|
| Status Changes | `status_change`, `priority_change`, `assignment_change` |
| Content Changes | `created`, `updated`, `description_updated`, `title_updated` |
| Comments | `comment_added`, `comment_edited`, `comment_deleted`, `mention` |
| Time Tracking | `time_logged`, `estimate_updated`, `timer_started`, `timer_stopped` |
| Dependencies | `dependency_added`, `dependency_removed`, `blocked`, `unblocked` |
| Attachments | `file_attached`, `file_removed`, `link_added` |
| Integrations | `github_pr_linked`, `github_pr_merged`, `commit_linked`, `notion_synced`, `slack_notification`, `calendar_event_created` |
| HITL Events | `hitl_requested`, `hitl_approved`, `hitl_rejected`, `hitl_modified` |
| Agent Events | `agent_assigned`, `agent_started`, `agent_checkpoint`, `agent_completed`, `agent_failed`, `agent_learning_captured` |
| Automation | `automation_triggered`, `workflow_started`, `workflow_completed` |
| Sprint Events | `added_to_sprint`, `removed_from_sprint`, `sprint_changed` |

#### TaskDependency

```typescript
interface TaskDependency {
  id: string;

  /** The task that has the dependency */
  taskId: string;

  /** The task being depended upon */
  dependsOnId: string;

  /** Dependency relationship type */
  type: DependencyType;             // default: 'finish_to_start'

  /** Lag days (delay between dependency satisfaction and dependent start) */
  lagDays: number;                  // default: 0

  createdAt: Date;
}
```

**Dependency Types:**

| Type | Description | Example |
|------|-------------|---------|
| `finish_to_start` | B cannot start until A finishes | Design → Development |
| `start_to_start` | B cannot start until A starts | Development → Testing (parallel) |
| `finish_to_finish` | B cannot finish until A finishes | Documentation → Release |
| `start_to_finish` | B cannot finish until A starts | Rare scheduling constraint |

**Constraints:**
- Unique index on `(taskId, dependsOnId)` prevents duplicate dependencies
- Check constraint prevents self-dependencies: `taskId != dependsOnId`
- Cycle detection via BFS traversal before adding edges

#### TaskTemplate

```typescript
interface TaskTemplate {
  id: string;

  /** Template identity */
  name: string;
  description: string | null;
  category: 'bug_report' | 'feature_request' | 'user_story' | 'spike'
    | 'deployment' | 'incident' | 'maintenance' | 'documentation'
    | 'review' | 'onboarding' | 'custom';
  scope: 'global' | 'venture' | 'team' | 'personal';
  icon: string | null;
  color: string | null;

  /** Ownership */
  ventureId: string | null;
  teamId: string | null;
  createdById: string | null;

  /** Template content */
  titleTemplate: string | null;      // e.g., "[BUG] {summary}"
  descriptionTemplate: string | null; // Markdown template with variables
  defaultFields: TemplateFieldDefault[];
  checklist: TemplateChecklistItem[];
  subtaskTemplates: Array<{
    title: string;
    description?: string;
    type?: string;
    assigneeRole?: string;
    estimatedMinutes?: number;
  }>;

  /** Default task properties */
  defaultStatus: string;
  defaultPriority: string;
  defaultType: string;
  defaultOwnerType: string | null;
  defaultTaskTier: string | null;
  defaultDepartment: string | null;
  defaultLabels: string[];
  defaultStoryPoints: number | null;
  defaultEstimatedMinutes: number | null;

  /** Acceptance criteria template */
  acceptanceCriteriaTemplate: Array<{ criterion: string }>;

  /** Settings */
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;

  createdAt: Date;
  updatedAt: Date;
}
```

### Task API Endpoints

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `task.list` | query | ventureProcedure | List tasks with filtering, search, pagination |
| `task.get` | query | ventureProcedure | Get single task with relations |
| `task.create` | mutation | ventureProcedure | Create new task |
| `task.update` | mutation | ventureProcedure | Update existing task |
| `task.delete` | mutation | ventureProcedure | Delete task (cascades) |
| `task.updateStatus` | mutation | ventureProcedure | Update single task status |
| `task.bulkUpdateStatus` | mutation | ventureProcedure | Bulk status update |
| `task.addDependency` | mutation | ventureProcedure | Add dependency with cycle detection |
| `task.removeDependency` | mutation | ventureProcedure | Remove dependency |
| `task.getDependencyGraph` | query | ventureProcedure | Full project dependency graph |
| `task.logTime` | mutation | ventureProcedure | Log time spent on task |
| `task.getSubtasks` | query | ventureProcedure | Get child tasks |
| `task.reorderTasks` | mutation | ventureProcedure | Reorder tasks in column |
| `task.addComment` | mutation | ventureProcedure | Add comment to task |
| `task.getComments` | query | ventureProcedure | Get task comments |
| `task.getHistory` | query | ventureProcedure | Get change history |

---

## Submodule 2: Projects

### Overview

Projects are venture-scoped organizational containers for tasks. They support hierarchical sub-projects via self-referential `parentId`, configurable visibility levels, and JSONB-based settings for per-project customization. Every task must belong to exactly one project, and projects enforce venture isolation through Row-Level Security policies.

### Core Interface

#### Project

```typescript
interface Project {
  id: string;

  /** Venture scope (CASCADE delete, RLS enforcement) */
  ventureId: string;

  /** Project identity */
  name: string;
  description: string | null;

  /** Lifecycle status */
  status: ProjectStatus;            // default: 'active'

  /** Access control level */
  visibility: ProjectVisibility;    // default: 'team'

  /** Visual appearance */
  color: string;                    // default: '#6366f1'
  icon: string;                     // default: 'folder'

  /** Project owner */
  ownerId: string | null;

  /** Sub-project hierarchy (self-referential) */
  parentId: string | null;

  /** Timeline */
  startDate: string | null;
  targetDate: string | null;
  completedAt: Date | null;

  /** Configurable project settings (JSONB) */
  settings: ProjectSettings;

  createdAt: Date;
  updatedAt: Date;
}

interface ProjectSettings {
  /** Allow sub-projects */
  allowSubProjects?: boolean;

  /** Default status for new tasks */
  defaultTaskStatus?: string;

  /** Auto-archive completed tasks */
  autoArchiveCompletedTasks?: boolean;
  autoArchiveDays?: number;

  /** Notification on overdue tasks */
  notifyOnOverdue?: boolean;

  /** Require assignee on task creation */
  requireTaskAssignee?: boolean;

  /** Custom field definitions for tasks in this project */
  customFields?: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
    required?: boolean;
    options?: string[];             // For 'select' type
  }>;
}
```

### Project Visibility

| Level | Description | Access |
|-------|-------------|--------|
| `private` | Only owner can see | Single user |
| `team` | Team members only (default) | Team scope |
| `venture` | All venture members | Venture-wide |
| `global` | Visible across ventures | Super Admin only |

### Project API Endpoints

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `project.list` | query | ventureProcedure | List projects (cursor-paginated) |
| `project.get` | query | ventureProcedure | Get single project with stats |
| `project.hierarchy` | query | ventureProcedure | Get project hierarchy tree |
| `project.stats` | query | ventureProcedure | Get project statistics |
| `project.create` | mutation | ventureProcedure | Create new project |
| `project.update` | mutation | ventureProcedure | Update project |
| `project.archive` | mutation | ventureProcedure | Archive project |
| `project.delete` | mutation | ventureProcedure | Delete project |

### Row-Level Security (RLS)

Projects enforce venture isolation via PostgreSQL RLS policies:

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Venture isolation: users only see projects in their venture
CREATE POLICY projects_venture_isolation ON projects
  FOR ALL
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- Service role bypass for server-side operations
CREATE POLICY projects_service_role ON projects
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## Submodule 3: Sprints

### Overview

Sprints are time-boxed iterations for task execution, following agile methodology. They are venture-scoped and optionally team-scoped, tracking capacity, velocity, and completion metrics. Sprints support retrospective documentation with structured lessons learned.

### Core Interface

#### Sprint

```typescript
interface Sprint {
  id: string;

  /** Sprint identity */
  name: string;
  number: number | null;            // Sprint number for sequencing
  goal: string | null;              // Sprint goal statement
  description: string | null;

  /** Scope */
  ventureId: string;                // CASCADE delete
  teamId: string | null;            // Optional team scope

  /** Time box */
  startDate: string;                // Required start date
  endDate: string;                  // Required end date

  /** Capacity planning */
  capacityPoints: number | null;    // Total story points available
  capacityHours: number | null;     // Total hours available

  /** Lifecycle status */
  status: SprintStatus;             // default: 'planning'

  /** Metrics (computed during sprint) */
  committedPoints: number;          // Points committed at sprint start
  completedPoints: number;          // Points completed
  velocity: number | null;          // Computed velocity
  taskCount: number;                // Total tasks in sprint
  completedTaskCount: number;       // Completed tasks

  /** Retrospective */
  retrospectiveNotes: string | null;
  lessonsLearned: Array<{
    category: string;
    content: string;
  }>;

  /** Configuration */
  settings: Record<string, unknown>;

  /** Audit */
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Sprint Statuses

| Status | Description | Task Behavior |
|--------|-------------|---------------|
| `planning` | Sprint is being prepared (default) | Tasks can be added/removed freely |
| `active` | Sprint is in progress | Tasks locked, new items need approval |
| `review` | Sprint ending, reviewing results | No new tasks, completing stragglers |
| `completed` | Sprint finished | Metrics finalized, velocity calculated |
| `cancelled` | Sprint abandoned | All tasks returned to backlog |

---

## Submodule 4: Workflows

### Overview

The Workflows submodule provides a dual-generation automation engine. **V1** offers simple trigger → condition → action automations for common task events. **V2** extends this with a full graph-based execution engine supporting parallel branches, loops, try/catch error handling, human-in-the-loop approvals, sub-workflows, versioning with rollback, split testing, business hours awareness, and rate limiting.

The Workflow Engine is the most complex component in the Operations domain, powering everything from simple "notify on overdue" rules to sophisticated multi-step business processes that rival dedicated workflow platforms.

### Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WORKFLOW ENGINE V2                                     │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                         TRIGGER LAYER                                  │  │
│  │                                                                        │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │  │
│  │  │  Task Events│ │  CRM Events │ │ Comm Events │ │ Cron/Manual │    │  │
│  │  │             │ │             │ │             │ │             │    │  │
│  │  │ • created   │ │ • contact_  │ │ • sms_recv  │ │ • cron      │    │  │
│  │  │ • status Δ  │ │   created   │ │ • email_    │ │ • webhook   │    │  │
│  │  │ • assigned  │ │ • deal_     │ │   opened    │ │ • manual    │    │  │
│  │  │ • overdue   │ │   stage Δ   │ │ • call_     │ │ • custom    │    │  │
│  │  │ • completed │ │ • scored    │ │   completed │ │   event     │    │  │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘    │  │
│  │         └───────────────┴───────────────┴───────────────┘            │  │
│  │                                   │                                   │  │
│  └───────────────────────────────────┼───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │                      CONDITION EVALUATOR                              │  │
│  │                                                                       │  │
│  │  • Nested AND/OR/NOT groups                                          │  │
│  │  • 22 comparison operators (equals, contains, regex, between, ...)   │  │
│  │  • Variable resolution: {{trigger.taskStatus}}, {{contact.email}}    │  │
│  │  • Template interpolation: "Hello {{contact.firstName}}"             │  │
│  │  • Date math: within_last, within_next, before, after                │  │
│  │  • Array operations: includes, not_includes, array_length            │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │                      GRAPH EXECUTOR                                    │  │
│  │                                                                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐               │  │
│  │  │ Actions │  │  Flow   │  │   AI    │  │  Data   │               │  │
│  │  │         │  │ Control │  │ Actions │  │ Actions │               │  │
│  │  │         │  │         │  │         │  │         │               │  │
│  │  │• send_  │  │• if_else│  │• ai_    │  │• set_   │               │  │
│  │  │  sms    │  │• switch │  │  prompt │  │  variable│               │  │
│  │  │• send_  │  │• wait   │  │• ai_    │  │• math_  │               │  │
│  │  │  email  │  │• loop   │  │  classify│  │  operation│               │  │
│  │  │• create_│  │• parallel│ │• ai_    │  │• http_  │               │  │
│  │  │  task   │  │• try_   │  │  extract│  │  request│               │  │
│  │  │• update_│  │  catch  │  │• ai_    │  │• json_  │               │  │
│  │  │  contact│  │• approval│ │  summarize│ │  transform│             │  │
│  │  │• webhook│  │• goto   │  │• rag_   │  │• text_  │               │  │
│  │  │  _send  │  │• sub_   │  │  search │  │  formatter│              │  │
│  │  │         │  │  workflow│ │         │  │         │               │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘               │  │
│  │                                                                       │  │
│  │  Execution Features:                                                  │  │
│  │  • Parallel branches with join strategies (all/any/n_of)             │  │
│  │  • Loop execution (for-each, while) with max 1000 iterations        │  │
│  │  • Try/catch with retry + exponential backoff (3 retries default)    │  │
│  │  • Rate limiting per node                                            │  │
│  │  • Split testing with auto-winner selection                          │  │
│  │  • Business hours awareness (timezone, working days, holidays)       │  │
│  │  • Sub-workflow execution with data passing                          │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │                      EXECUTION TRACKING                               │  │
│  │                                                                       │  │
│  │  workflow_executions → workflow_step_executions → workflow_approvals  │  │
│  │                                                                       │  │
│  │  • Full execution trace for visual debugging                         │  │
│  │  • Per-step input/output capture                                     │  │
│  │  • Retry count tracking                                              │  │
│  │  • Approval flow with timeout and escalation                         │  │
│  │  • Test mode (isTest flag, no side effects)                          │  │
│  │  • Parent/child execution hierarchy (sub-workflows)                  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Core Interfaces

#### Workflow (V1 Definition)

```typescript
interface Workflow {
  id: string;

  /** Venture scope (CASCADE delete) */
  ventureId: string;

  /** Workflow identity */
  name: string;
  description: string | null;

  /** What triggers this workflow */
  triggerType: WorkflowTriggerType;

  /** Conditions for trigger matching */
  triggerConditions: WorkflowTriggerConditions;

  /** Actions to execute */
  actions: WorkflowAction[];

  /** Active state */
  isActive: boolean;                // default: true

  /** Run statistics */
  runCount: number;                 // default: 0
  lastRunAt: Date | null;

  /** Audit */
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**V1 Trigger Types:**

| Trigger | Description | Event Data |
|---------|-------------|------------|
| `task_created` | New task created in venture | Task object |
| `task_status_changed` | Task status transitioned | Old status → new status |
| `task_assigned` | Task assigned to user/agent | Assignee info |
| `task_due_approaching` | Task approaching due date | Days remaining |
| `task_overdue` | Task past due date | Days overdue |
| `manual` | Manually triggered by user | Custom payload |

**V1 Action Types:**

| Action | Description | Configuration |
|--------|-------------|---------------|
| `send_notification` | Send email/in-app/SMS/push | Template, recipients, type |
| `update_field` | Update task field value | Field name, new value |
| `assign_user` | Assign to user/role | User ID or role name |
| `create_task` | Create a new task | Task template |
| `add_comment` | Add comment to task | Comment text |
| `webhook` | Call external webhook | URL, method, headers, payload |
| `custom` | Custom action handler | Arbitrary config |

#### WorkflowNode (V2 Graph Node)

```typescript
interface WorkflowNode {
  /** Unique node identifier within the graph */
  id: string;

  /** Node type (90+ supported types) */
  type: WorkflowNodeType;

  /** Display label in workflow builder */
  label: string;

  /** Visual position in the builder canvas */
  position: { x: number; y: number };

  /** Type-specific configuration */
  config: Record<string, unknown>;

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}
```

**V2 Node Types (90+ types across 8 categories):**

| Category | Types | Count |
|----------|-------|-------|
| **Task Triggers** | `trigger_task_created`, `trigger_task_completed`, `trigger_task_overdue`, `trigger_task_status_changed`, `trigger_task_assigned`, `trigger_task_due_approaching` | 6 |
| **CRM Triggers** | `trigger_contact_created`, `trigger_contact_updated`, `trigger_contact_tagged`, `trigger_deal_stage_changed`, `trigger_deal_won`, `trigger_deal_lost`, etc. | 20+ |
| **Communication Triggers** | `trigger_sms_received`, `trigger_email_opened`, `trigger_email_clicked`, `trigger_call_completed`, `trigger_voicemail_received`, etc. | 12+ |
| **System Triggers** | `trigger_cron`, `trigger_webhook_received`, `trigger_manual`, `trigger_custom_event`, `trigger_workflow_completed` | 5 |
| **Communication Actions** | `send_sms`, `send_email`, `send_whatsapp`, `make_call`, `voicemail_drop`, `send_internal_notification` | 6 |
| **CRM Actions** | `create_contact`, `update_contact`, `add_tag`, `remove_tag`, `create_deal`, `update_deal_stage`, `add_note`, `assign_user` | 10 |
| **AI Actions** | `ai_prompt`, `ai_classify`, `ai_extract`, `ai_summarize`, `rag_search` | 5 |
| **Flow Control** | `if_else`, `switch`, `split_test`, `wait`, `loop`, `parallel`, `try_catch`, `approval`, `goto`, `sub_workflow`, `delay_until`, `rate_limit` | 12 |
| **Data Actions** | `set_variable`, `math_operation`, `text_formatter`, `array_operation`, `json_transform`, `http_request` | 6 |

#### WorkflowEdge

```typescript
interface WorkflowEdge {
  /** Unique edge identifier */
  id: string;

  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /** Source handle (for multi-output nodes like if/else) */
  sourceHandle?: string;

  /** Target handle (for multi-input nodes) */
  targetHandle?: string;

  /** Edge label for conditional branches */
  label?: string;

  /** Condition for conditional edges */
  condition?: ConditionGroup;
}
```

#### Condition Evaluator

```typescript
interface ConditionGroup {
  /** Logical operator: AND, OR, NOT */
  logic: 'AND' | 'OR' | 'NOT';

  /** Array of conditions or nested groups */
  conditions: Array<Condition | ConditionGroup>;
}

interface Condition {
  /** Field path (dot notation): 'contact.email', 'trigger.taskStatus' */
  field: string;

  /** Comparison operator */
  operator: ComparisonOperator;

  /** Value to compare against */
  value?: unknown;
}
```

**Comparison Operators (22 operators):**

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `status equals "done"` |
| `not_equals` | Not equal | `priority not_equals "low"` |
| `contains` | String contains | `title contains "urgent"` |
| `not_contains` | String doesn't contain | `email not_contains "spam"` |
| `starts_with` | String prefix | `name starts_with "VIP"` |
| `ends_with` | String suffix | `email ends_with "@company.com"` |
| `regex_match` | Regular expression | `phone regex_match "^\+1"` |
| `greater_than` | Numeric greater | `score greater_than 80` |
| `less_than` | Numeric less | `age less_than 30` |
| `greater_than_or_equal` | Numeric GTE | `points >= 100` |
| `less_than_or_equal` | Numeric LTE | `balance <= 0` |
| `between` | Numeric range | `score between [50, 100]` |
| `is_empty` | Null/empty check | `notes is_empty` |
| `is_not_empty` | Not null/empty | `assigneeId is_not_empty` |
| `before` | Date before | `dueDate before "2026-03-01"` |
| `after` | Date after | `createdAt after "2026-01-01"` |
| `within_last` | Within past period | `lastContact within_last "7d"` |
| `within_next` | Within future period | `dueDate within_next "3d"` |
| `day_of_week` | Specific day | `createdAt day_of_week 1` (Monday) |
| `hour_of_day` | Specific hour | `timestamp hour_of_day 14` |
| `includes` | Array contains | `tags includes "vip"` |
| `not_includes` | Array doesn't contain | `labels not_includes "spam"` |
| `array_length` | Array size check | `attachments array_length 3` |

#### WorkflowExecution

```typescript
interface WorkflowExecution {
  id: string;

  /** Workflow being executed */
  workflowId: string;

  /** Version snapshot used for this execution */
  versionId: string | null;

  /** Trigger identification */
  triggerId: string | null;
  triggerData: Record<string, unknown>;

  /** Execution status */
  status: WorkflowExecutionStatus;  // 'running' | 'completed' | 'failed' | 'paused' | 'cancelled'

  /** Timing */
  startedAt: Date;
  completedAt: Date | null;

  /** Error message (if failed) */
  error: string | null;

  /** Contact being processed */
  contactId: string | null;

  /** Venture scope */
  ventureId: string;

  /** Sub-workflow parent */
  parentExecutionId: string | null;

  /** Runtime variables accumulated during execution */
  variables: Record<string, unknown>;

  /** Test mode flag (no real side effects) */
  isTest: boolean;

  createdAt: Date;
}
```

#### WorkflowApproval

```typescript
interface WorkflowApproval {
  id: string;

  /** Step execution requiring approval */
  stepExecutionId: string;

  /** Workflow reference */
  workflowId: string;

  /** Who requested the approval */
  requestedBy: string | null;

  /** Users who can approve */
  assignedTo: string[];

  /** Approval status */
  status: ApprovalStatus;           // 'pending' | 'approved' | 'rejected' | 'expired' | 'escalated'

  /** Decision reason */
  reason: string | null;

  /** Auto-expiry timestamp */
  expiresAt: Date | null;

  /** Escalation target user */
  escalateTo: string | null;
  escalatedAt: Date | null;

  /** Who made the decision */
  decidedBy: string | null;

  createdAt: Date;
  updatedAt: Date;
}
```

#### BusinessHoursConfig

```typescript
interface BusinessHoursConfig {
  /** IANA timezone string */
  timezone: string;                  // e.g., 'America/New_York'

  /** Working days (0=Sunday, 6=Saturday) */
  workingDays: number[];             // e.g., [1, 2, 3, 4, 5]

  /** Working hours */
  workingHours: {
    start: string;                   // e.g., '09:00'
    end: string;                     // e.g., '17:00'
  };

  /** Holiday dates (ISO date strings) */
  holidays: string[];                // e.g., ['2026-12-25']
}
```

### Workflow API Endpoints

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| **V1 CRUD** | | | |
| `workflow.list` | query | protectedProcedure | List workflows |
| `workflow.get` | query | protectedProcedure | Get single workflow |
| `workflow.create` | mutation | adminProcedure | Create workflow |
| `workflow.update` | mutation | adminProcedure | Update workflow |
| `workflow.delete` | mutation | adminProcedure | Delete workflow |
| `workflow.toggle` | mutation | adminProcedure | Activate/deactivate |
| `workflow.test` | mutation | adminProcedure | Test with mock task |
| `workflow.runHistory` | query | protectedProcedure | Get run history |
| **V2 Versions** | | | |
| `workflow.createVersion` | mutation | adminProcedure | Snapshot node/edge graph |
| `workflow.rollbackVersion` | mutation | adminProcedure | Rollback to version |
| `workflow.diffVersions` | query | protectedProcedure | Diff two versions |
| `workflow.listVersions` | query | protectedProcedure | List version history |
| **V2 Execution** | | | |
| `workflow.executeV2` | mutation | adminProcedure | Execute workflow graph |
| `workflow.resumeExecution` | mutation | adminProcedure | Resume paused execution |
| `workflow.cancelExecution` | mutation | adminProcedure | Cancel running execution |
| `workflow.retryExecution` | mutation | adminProcedure | Retry from step |
| `workflow.executionTrace` | query | protectedProcedure | Get execution trace |
| `workflow.replayStep` | mutation | adminProcedure | Replay single step |
| `workflow.listExecutions` | query | protectedProcedure | List executions |
| `workflow.testV2` | mutation | adminProcedure | Test with mock data |
| **V2 Approvals** | | | |
| `workflow.processApproval` | mutation | adminProcedure | Approve/reject approval |
| `workflow.listApprovals` | query | protectedProcedure | List pending approvals |
| `workflow.checkApprovalTimeouts` | mutation | adminProcedure | Process expired approvals |
| **V2 Templates** | | | |
| `workflow.createTemplate` | mutation | adminProcedure | Create template |
| `workflow.updateTemplate` | mutation | adminProcedure | Update template |
| `workflow.deleteTemplate` | mutation | adminProcedure | Delete template |
| `workflow.getTemplate` | query | protectedProcedure | Get template |
| `workflow.listTemplates` | query | protectedProcedure | List templates |
| `workflow.instantiateTemplate` | mutation | adminProcedure | Create workflow from template |

---

## Submodule 5: Time Tracking

### Overview

The Time Tracking submodule provides granular time tracking with billable hours, live timer support, approval workflows, and timesheet reporting. Inspired by Jira worklogs, ClickUp timers, and Tempo timesheets, it supports both human and agent-logged time entries with configurable billing rates and categories.

### Core Interface

#### TimeEntry

```typescript
interface TimeEntry {
  id: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // REFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Task being tracked (CASCADE delete) */
  taskId: string;

  /** User who logged the time (SET NULL on delete) */
  userId: string | null;

  /** Project reference (CASCADE delete) */
  projectId: string | null;

  /** Agent ID for AI-logged time */
  agentId: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // TIME DATA
  // ═══════════════════════════════════════════════════════════════════════════

  /** When work started */
  startedAt: Date;

  /** When work ended (null if timer is running) */
  endedAt: Date | null;

  /** Duration in minutes */
  durationMinutes: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // DESCRIPTION & CATEGORIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /** Work description */
  description: string | null;

  /** Time category */
  category: string | null;          // e.g., 'development', 'review', 'meeting', 'debugging'

  /** Tags for filtering */
  tags: string[];

  // ═══════════════════════════════════════════════════════════════════════════
  // BILLING
  // ═══════════════════════════════════════════════════════════════════════════

  /** Whether this time is billable */
  isBillable: boolean;              // default: false

  /** Hourly rate for billing */
  hourlyRate: string | null;        // numeric(10,2)

  /** Currency code */
  currency: string;                 // default: 'USD'

  // ═══════════════════════════════════════════════════════════════════════════
  // SOURCE & TIMER
  // ═══════════════════════════════════════════════════════════════════════════

  /** How this entry was created */
  source: 'manual' | 'timer' | 'import' | 'api' | 'agent' | 'integration';

  /** Whether the timer is currently running */
  isRunning: boolean;               // default: false

  // ═══════════════════════════════════════════════════════════════════════════
  // APPROVAL
  // ═══════════════════════════════════════════════════════════════════════════

  /** Whether entry has been approved */
  isApproved: boolean;              // default: false

  /** Approver reference */
  approvedById: string | null;

  /** Approval timestamp */
  approvedAt: Date | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}
```

### Timer Lifecycle

```
  startTimer(taskId) ─────────────► Running Entry
       │                                │
       │   isRunning: true              │  endedAt: null
       │   startedAt: now()             │  durationMinutes: 0
       │                                │
       │                          stopTimer(id)
       │                                │
       │                                ▼
       │                          Completed Entry
       │                                │
       │                          endedAt: now()
       │                          durationMinutes: calculated
       │                          isRunning: false
       │                                │
       │                       Updates task.timeSpentMinutes
       │                       (aggregated from all entries)
       │
  Constraint: Only ONE running timer per user at a time
```

### Time Entry API Endpoints

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `timeEntry.list` | query | ventureProcedure | List entries with filters |
| `timeEntry.get` | query | ventureProcedure | Get single entry |
| `timeEntry.create` | mutation | ventureProcedure | Create manual entry |
| `timeEntry.update` | mutation | ventureProcedure | Update entry |
| `timeEntry.delete` | mutation | ventureProcedure | Delete entry |
| `timeEntry.startTimer` | mutation | ventureProcedure | Start live timer |
| `timeEntry.stopTimer` | mutation | ventureProcedure | Stop running timer |
| `timeEntry.activeTimer` | query | ventureProcedure | Get user's active timer |
| `timeEntry.approve` | mutation | ventureProcedure | Bulk approve entries |
| `timeEntry.timesheet` | query | ventureProcedure | Timesheet report |
| `timeEntry.projectSummary` | query | ventureProcedure | Summary by project |

---

## Submodule 6: Editor (Document Editor)

### Overview

The Document Editor submodule provides a block-based live editor for invoices, proposals, contracts, and general documents. It combines Notion-like block editing with PandaDoc-style document automation, AI-powered content suggestions, merge field resolution from CRM data, version history, threaded commenting, and a full publish lifecycle.

### Document Lifecycle

```
  ┌─────────┐     submitForReview     ┌──────────┐     approve      ┌──────────┐
  │  draft  │ ──────────────────────▶ │  review  │ ───────────────▶ │ approved │
  └─────────┘                         └──────────┘                   └──────────┘
       │                                   │                              │
       │                                   │ (reject → back to draft)    │
       │                                   │                         publish
       │                                   │                              │
       │                                   │                         ┌────▼─────┐
       │                                   │                         │published │
       │                                   │                         └──────────┘
       │                                                                  │
       └──────────────────────────────────────────────────────────── archive
                                                                          │
                                                                    ┌─────▼────┐
                                                                    │ archived │
                                                                    └──────────┘
```

### Core Interfaces

#### Document

```typescript
interface Document {
  id: string;

  /** Venture scope */
  ventureId: string;

  /** Template used to create this document */
  templateId: string | null;

  /** Document parent context */
  parentType: 'invoice' | 'proposal' | 'estimate' | 'standalone';
  parentId: string | null;

  /** Document title */
  title: string;

  /** Lifecycle status */
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';

  /** Block-based content */
  blocks: DocumentBlock[];

  /** Resolved variable values */
  variables: Record<string, unknown>;

  /** Collaborators with roles */
  collaborators: DocumentCollaborator[];

  /** Editing lock */
  lockedBy: string | null;
  lockedAt: Date | null;

  /** Versioning */
  version: number;                   // Current version
  publishedVersion: number | null;   // Last published version
  publishedAt: Date | null;

  /** Additional metadata */
  metadata: Record<string, unknown> | null;

  /** Audit */
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### DocumentBlock

```typescript
interface DocumentBlock {
  /** Unique block identifier */
  id: string;

  /** Block type (24 supported types) */
  type: DocumentBlockType;

  /** Block content (HTML or markdown) */
  content: string;

  /** Type-specific properties */
  properties: Record<string, unknown>;

  /** Nested blocks (for columns, layouts) */
  children?: DocumentBlock[];

  /** Visual styling */
  styles: DocumentBlockStyles;

  /** Entry animation */
  animation?: DocumentBlockAnimation;

  /** Conditional visibility */
  visibility?: DocumentBlockVisibility;

  /** Position in document */
  sortOrder: number;

  /** Prevent editing (for approved sections) */
  locked?: boolean;
}
```

**Block Types (24 types):**

| Type | Category | Description |
|------|----------|-------------|
| `heading` | Text | Heading (h1-h6) |
| `paragraph` | Text | Body text paragraph |
| `quote` | Text | Blockquote |
| `callout` | Text | Highlighted callout box |
| `code` | Text | Code block with syntax highlighting |
| `image` | Media | Image with caption |
| `video` | Media | Embedded video |
| `embed` | Media | External embed (iframe) |
| `table` | Data | Standard data table |
| `pricing_table` | Data | Product/service pricing |
| `comparison_table` | Data | Feature comparison |
| `payment_schedule` | Data | Payment installments |
| `product_card` | Data | Product showcase card |
| `checklist` | Interactive | Checkbox list |
| `button` | Interactive | CTA button |
| `signature_block` | Interactive | E-signature capture |
| `faq` | Interactive | Expandable FAQ |
| `terms` | Legal | Terms and conditions |
| `columns` | Layout | Multi-column layout (children) |
| `spacer` | Layout | Vertical spacing |
| `divider` | Layout | Horizontal rule |
| `testimonial` | Content | Customer testimonial card |
| `timeline` | Content | Timeline visualization |
| `variable` | Dynamic | CRM merge field |

#### DocumentBlockStyles

```typescript
interface DocumentBlockStyles {
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  border?: string;
  maxWidth?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: string;
  fontWeight?: string;
}
```

#### DocumentTemplate

```typescript
interface DocumentTemplate {
  id: string;
  ventureId: string;

  /** Template identity */
  name: string;
  slug: string;                     // URL-safe identifier
  category: 'invoice' | 'proposal' | 'estimate' | 'contract' | 'report' | 'custom';
  description: string | null;
  thumbnailUrl: string | null;

  /** Template content */
  blocks: DocumentBlock[];
  variables: DocumentVariableDefinition[];

  /** Marketplace visibility */
  isPublic: boolean;
  isSystem: boolean;                 // System-provided templates

  /** Versioning */
  version: number;

  /** Audit */
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### DocumentVariableDefinition

```typescript
interface DocumentVariableDefinition {
  /** Variable key for resolution */
  key: string;                       // e.g., 'contact.firstName'

  /** Display label */
  label: string;                     // e.g., 'First Name'

  /** Value type */
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'list';

  /** Default value if not resolved */
  defaultValue?: string;

  /** CRM data source path */
  source?: string;                   // e.g., 'contact.firstName', 'invoice.total'

  /** Whether this variable must be filled */
  required?: boolean;
}
```

#### DocumentAsset

```typescript
interface DocumentAsset {
  id: string;
  ventureId: string;

  /** Asset identity */
  name: string;

  /** Asset type */
  type: 'text_snippet' | 'image' | 'logo' | 'signature'
    | 'clause' | 'pricing_table' | 'header' | 'footer';

  /** Asset content (type-specific JSONB) */
  content: Record<string, unknown>;

  /** Searchable tags */
  tags: string[];

  /** Usage tracking */
  usageCount: number;

  /** Audit */
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### AiContentSuggestion

```typescript
interface AiContentSuggestion {
  id: string;

  /** Document and block reference */
  documentId: string;
  blockId: string;

  /** Suggestion type */
  suggestionType: 'rewrite' | 'expand' | 'summarize' | 'translate' | 'tone_change' | 'grammar';

  /** Content comparison */
  originalContent: string;
  suggestedContent: string;

  /** Review status */
  status: 'pending' | 'accepted' | 'rejected' | 'expired';

  /** AI confidence score (0-1) */
  confidence: string | null;        // numeric(5,4)

  createdAt: Date;
  respondedAt: Date | null;
}
```

### Document Editor API Endpoints

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| **Documents** | | | |
| `documentEditor.createDocument` | mutation | adminProcedure | Create new document |
| `documentEditor.getDocument` | query | ventureProcedure | Get document by ID |
| `documentEditor.updateDocument` | mutation | adminProcedure | Update document |
| `documentEditor.deleteDocument` | mutation | adminProcedure | Delete document |
| `documentEditor.listDocuments` | query | ventureProcedure | List with filters |
| **Block Operations** | | | |
| `documentEditor.addBlock` | mutation | adminProcedure | Add block to document |
| `documentEditor.updateBlock` | mutation | adminProcedure | Update block content/styles |
| `documentEditor.removeBlock` | mutation | adminProcedure | Remove block |
| `documentEditor.moveBlock` | mutation | adminProcedure | Move block to new position |
| `documentEditor.duplicateBlock` | mutation | adminProcedure | Duplicate a block |
| **Versions** | | | |
| `documentEditor.saveVersion` | mutation | adminProcedure | Save version snapshot |
| `documentEditor.getVersionHistory` | query | ventureProcedure | Get version history |
| `documentEditor.restoreVersion` | mutation | adminProcedure | Restore from version |
| **Collaboration** | | | |
| `documentEditor.lockDocument` | mutation | protectedProcedure | Lock for editing |
| `documentEditor.unlockDocument` | mutation | protectedProcedure | Unlock document |
| `documentEditor.forceUnlockDocument` | mutation | adminProcedure | Admin force unlock |
| `documentEditor.addCollaborator` | mutation | adminProcedure | Add collaborator |
| `documentEditor.removeCollaborator` | mutation | adminProcedure | Remove collaborator |
| **Variables** | | | |
| `documentEditor.resolveVariables` | mutation | adminProcedure | Resolve CRM variables |
| **Publish Flow** | | | |
| `documentEditor.submitForReview` | mutation | adminProcedure | Draft → Review |
| `documentEditor.approveDocument` | mutation | adminProcedure | Review → Approved |
| `documentEditor.publishDocument` | mutation | adminProcedure | Approved → Published |
| `documentEditor.archiveDocument` | mutation | adminProcedure | → Archived |
| `documentEditor.cloneFromTemplate` | mutation | adminProcedure | Create from template |
| **Templates** | | | |
| `documentEditor.createTemplate` | mutation | adminProcedure | Create template |
| `documentEditor.getTemplate` | query | ventureProcedure | Get template |
| `documentEditor.updateTemplate` | mutation | adminProcedure | Update template |
| `documentEditor.deleteTemplate` | mutation | adminProcedure | Delete template |
| `documentEditor.listTemplates` | query | ventureProcedure | List templates |
| `documentEditor.listPublicTemplates` | query | protectedProcedure | Marketplace templates |
| `documentEditor.createTemplateFromDocument` | mutation | adminProcedure | Convert doc to template |
| **AI Suggestions** | | | |
| `documentEditor.generateSuggestion` | mutation | adminProcedure | Generate AI suggestion |
| `documentEditor.expandContent` | mutation | adminProcedure | AI expand from brief |
| `documentEditor.translateBlock` | mutation | adminProcedure | AI translate block |
| `documentEditor.adjustTone` | mutation | adminProcedure | AI adjust tone |
| `documentEditor.generateFromPrompt` | mutation | adminProcedure | AI generate from prompt |
| `documentEditor.acceptSuggestion` | mutation | adminProcedure | Accept suggestion |
| `documentEditor.rejectSuggestion` | mutation | adminProcedure | Reject suggestion |
| `documentEditor.listSuggestions` | query | ventureProcedure | List suggestions |
| **Assets** | | | |
| `documentEditor.createAsset` | mutation | adminProcedure | Create reusable asset |
| `documentEditor.getAsset` | query | ventureProcedure | Get asset |
| `documentEditor.updateAsset` | mutation | adminProcedure | Update asset |
| `documentEditor.deleteAsset` | mutation | adminProcedure | Delete asset |
| `documentEditor.listAssets` | query | ventureProcedure | List assets |
| `documentEditor.searchAssetsByTags` | query | ventureProcedure | Search by tags |
| `documentEditor.incrementAssetUsage` | mutation | protectedProcedure | Track usage |
| **Comments** | | | |
| `documentEditor.createComment` | mutation | protectedProcedure | Add comment |
| `documentEditor.updateComment` | mutation | protectedProcedure | Edit own comment |
| `documentEditor.deleteComment` | mutation | adminProcedure | Delete comment |
| `documentEditor.resolveComment` | mutation | adminProcedure | Resolve thread |
| `documentEditor.listComments` | query | ventureProcedure | List top-level comments |
| `documentEditor.listCommentReplies` | query | ventureProcedure | List replies |

---

## Database Schemas

### Complete Index Map

| Table | Indexes | Purpose |
|-------|---------|---------|
| `tasks` | 18 indexes | Project, parent, status, assignee, reporter, type, priority, project+status, project+assignee, project+type, project+position, dueDate, ownerType, ventureId, venture+status, sprint, department, labels, sla |
| `projects` | 6 indexes | Venture, owner, parent, status, venture+status, venture+owner |
| `sprints` | 5 indexes | Venture, status, venture+status, team, date range |
| `task_assignments` | 6 indexes | Task, user, agent, role, status, task+role |
| `task_activities` | 6 indexes | Task+createdAt, activityType, user, agent, venture, session |
| `task_dependencies` | 1 unique | task+dependsOn (unique), self-ref check constraint |
| `task_templates` | 5 indexes | Venture, category, scope, isActive, createdBy |
| `workflows` | 6 indexes | Venture, triggerType, isActive, venture+active, venture+trigger, createdBy |
| `workflow_versions` | 2 indexes | Workflow, workflow+version |
| `workflow_executions` | 7 indexes | Workflow, status, venture, contact, parent, startedAt, workflow+status |
| `workflow_step_executions` | 3 indexes | Execution, execution+node, status |
| `workflow_approvals` | 4 indexes | StepExecution, workflow, status, expiresAt |
| `workflow_templates` | 4 indexes | Venture, category, isPublic, author |
| `time_entries` | 7 indexes | Task, user, project, startedAt, billable, running, agent |
| `documents` | 6 indexes | Venture, template, venture+status, parent+parentId, lockedBy, createdAt |
| `document_templates` | 5 indexes | Venture, venture+slug, venture+category, isPublic, isSystem |
| `document_versions` | 2 indexes | Document, document+version |
| `document_comments` | 4 indexes | Document, document+block, user, parentComment |
| `document_assets` | 2 indexes | Venture, venture+type |
| `ai_content_suggestions` | 3 indexes | Document, document+block, status |

**Total:** 20 tables, 100+ indexes

---

## Code Examples

### Example 1: Creating a Task with Agentic Ownership

```typescript
import { trpc } from '@/lib/trpc';

// Create a task that an AI agent can autonomously execute
const task = await trpc.task.create.mutate({
  projectId: 'proj_abc123',
  title: 'Analyze Q4 revenue trends and generate summary report',
  description: `
    Pull revenue data from the last quarter, identify trends,
    outliers, and growth opportunities. Generate a summary
    report with visualizations.
  `,
  type: 'research',
  priority: 'high',
  ownerType: 'agent_primary',      // AI leads, human oversees
  taskTier: 'T2',                  // Supervised autonomy
  department: 'finance',
  tags: ['analytics', 'q4-2025'],
  labels: ['automated', 'report'],
  acceptanceCriteria: [
    { criterion: 'Revenue trends identified for all product lines', completed: false },
    { criterion: 'YoY comparison included', completed: false },
    { criterion: 'Summary report generated in document editor', completed: false },
  ],
  dueDate: '2026-02-15',
  storyPoints: 5,
  timeEstimateMinutes: 120,
});
```

### Example 2: Dependency Graph with Cycle Detection

```typescript
import { trpc } from '@/lib/trpc';

// Add dependencies between tasks
await trpc.task.addDependency.mutate({
  taskId: 'task_develop',
  dependsOnId: 'task_design',
  type: 'finish_to_start',          // Can't develop until design is done
});

await trpc.task.addDependency.mutate({
  taskId: 'task_test',
  dependsOnId: 'task_develop',
  type: 'start_to_start',           // Testing can start when dev starts
});

// This would throw: "Adding this dependency would create a circular dependency"
try {
  await trpc.task.addDependency.mutate({
    taskId: 'task_design',
    dependsOnId: 'task_test',        // design → develop → test → design = CYCLE
    type: 'finish_to_start',
  });
} catch (error) {
  console.error(error.message);
  // "Adding this dependency would create a circular dependency"
}

// Get the full dependency graph for visualization
const graph = await trpc.task.getDependencyGraph.query({
  projectId: 'proj_abc123',
});

console.log(graph);
// {
//   nodes: [
//     { id: 'task_design', title: 'Design UI', status: 'done', dependencies: [] },
//     { id: 'task_develop', title: 'Develop', status: 'in_progress', dependencies: [...] },
//     { id: 'task_test', title: 'Testing', status: 'todo', dependencies: [...] },
//   ],
//   edges: [
//     { from: 'task_develop', to: 'task_design', type: 'finish_to_start' },
//     { from: 'task_test', to: 'task_develop', type: 'start_to_start' },
//   ],
//   hasCycles: false,
// }
```

### Example 3: Sprint Planning and Velocity Tracking

```typescript
import { db, sprints, tasks, eq } from '@mcv/db';

// Create a new sprint
const [sprint] = await db.insert(sprints).values({
  name: 'Sprint 14',
  number: 14,
  goal: 'Complete v2 workflow engine and time tracking integration',
  ventureId: 'venture_abc',
  teamId: 'team_eng',
  startDate: '2026-02-10',
  endDate: '2026-02-24',
  capacityPoints: 34,
  capacityHours: 80,
  status: 'planning',
}).returning();

// Assign tasks to the sprint
await db.update(tasks)
  .set({ sprintId: sprint.id })
  .where(eq(tasks.id, 'task_wf_engine'));

// Activate the sprint
await db.update(sprints)
  .set({
    status: 'active',
    committedPoints: 34,
    taskCount: 8,
  })
  .where(eq(sprints.id, sprint.id));

// After sprint completion, record metrics
await db.update(sprints)
  .set({
    status: 'completed',
    completedPoints: 29,
    completedTaskCount: 7,
    velocity: 29 / 2,               // Points per week
    retrospectiveNotes: 'Good sprint overall. Workflow engine landed on time.',
    lessonsLearned: [
      { category: 'process', content: 'Earlier code reviews reduced rework' },
      { category: 'technical', content: 'Split testing needs better test data' },
    ],
  })
  .where(eq(sprints.id, sprint.id));
```

### Example 4: Time Tracking with Live Timer

```typescript
import { trpc } from '@/lib/trpc';

// Start a live timer
const timer = await trpc.timeEntry.startTimer.mutate({
  taskId: 'task_develop',
  description: 'Implementing workflow condition evaluator',
  isBillable: true,
});
// timer.isRunning === true
// timer.startedAt === "2026-02-08T19:30:00Z"

// Check active timer
const active = await trpc.timeEntry.activeTimer.query();
// Returns the running entry or null

// Stop the timer (calculates duration automatically)
const completed = await trpc.timeEntry.stopTimer.mutate({
  id: timer.id,
});
// completed.isRunning === false
// completed.endedAt === "2026-02-08T21:15:00Z"
// completed.durationMinutes === 105
// task.timeSpentMinutes is auto-updated via aggregation query

// Create a manual entry (for past work)
const manual = await trpc.timeEntry.create.mutate({
  taskId: 'task_docs',
  description: 'Writing operations MODULE.md',
  durationMinutes: 90,
  startedAt: '2026-02-08T14:00:00Z',
  endedAt: '2026-02-08T15:30:00Z',
  isBillable: false,
});

// Bulk approve time entries
await trpc.timeEntry.approve.mutate({
  ids: [timer.id, manual.id],
});

// Generate timesheet
const timesheet = await trpc.timeEntry.timesheet.query({
  startDate: '2026-02-01',
  endDate: '2026-02-08',
});
// {
//   entries: [...],
//   totalMinutes: 2340,
//   billableMinutes: 1680,
//   totalCost: 3500.00,
// }
```

### Example 5: Workflow V1 — Simple Automation

```typescript
import { trpc } from '@/lib/trpc';

// Create a workflow: notify assignee when task becomes overdue
const workflow = await trpc.workflow.create.mutate({
  ventureId: 'venture_abc',
  name: 'Overdue Task Notification',
  description: 'Sends notification when a task becomes overdue',
  triggerType: 'task_overdue',
  triggerConditions: {
    taskPriority: ['high', 'highest'],   // Only high-priority tasks
    daysOverdue: 1,                      // After 1 day overdue
  },
  actions: [
    {
      id: 'notify_assignee',
      type: 'send_notification',
      config: {
        notificationType: 'email',
        recipientType: 'assignee',
        subject: 'Task Overdue: {{task.title}}',
        message: 'Your task "{{task.title}}" is now overdue. Please update status.',
      },
      order: 1,
    },
    {
      id: 'escalate_to_manager',
      type: 'send_notification',
      config: {
        notificationType: 'in_app',
        recipientType: 'role',
        recipientIds: ['manager'],
        message: 'Task "{{task.title}}" is overdue and assigned to {{task.assignee}}.',
      },
      order: 2,
      condition: {
        field: 'daysOverdue',
        operator: 'gte',
        value: 3,
      },
    },
  ],
});

// Toggle workflow active/inactive
await trpc.workflow.toggle.mutate({
  id: workflow.id,
  isActive: true,
});
```

### Example 6: Workflow V2 — Graph-Based Execution

```typescript
import { trpc } from '@/lib/trpc';

// Create a V2 workflow version with complex graph
const version = await trpc.workflow.createVersion.mutate({
  workflowId: 'wf_onboarding',
  nodes: [
    {
      id: 'trigger',
      type: 'trigger_contact_created',
      label: 'New Contact',
      position: { x: 100, y: 100 },
      config: {},
    },
    {
      id: 'classify',
      type: 'ai_classify',
      label: 'Classify Lead',
      position: { x: 300, y: 100 },
      config: {
        categories: ['hot', 'warm', 'cold'],
        prompt: 'Classify this lead based on: {{contact.company}}, {{contact.title}}',
      },
    },
    {
      id: 'branch',
      type: 'if_else',
      label: 'Is Hot Lead?',
      position: { x: 500, y: 100 },
      config: {
        condition: {
          logic: 'AND',
          conditions: [
            { field: 'steps.classify.output.category', operator: 'equals', value: 'hot' },
          ],
        },
      },
    },
    {
      id: 'send_vip',
      type: 'send_email',
      label: 'VIP Welcome',
      position: { x: 700, y: 50 },
      config: {
        templateId: 'tpl_vip_welcome',
        subject: 'Welcome {{contact.firstName}}!',
      },
    },
    {
      id: 'create_deal',
      type: 'create_deal',
      label: 'Create Deal',
      position: { x: 700, y: 150 },
      config: {
        pipelineId: 'pipeline_sales',
        stage: 'qualified',
        value: 10000,
      },
    },
    {
      id: 'send_nurture',
      type: 'send_email',
      label: 'Nurture Email',
      position: { x: 700, y: 250 },
      config: {
        templateId: 'tpl_nurture_sequence',
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'trigger', target: 'classify' },
    { id: 'e2', source: 'classify', target: 'branch' },
    { id: 'e3', source: 'branch', target: 'send_vip', sourceHandle: 'true' },
    { id: 'e4', source: 'branch', target: 'send_nurture', sourceHandle: 'false' },
    { id: 'e5', source: 'send_vip', target: 'create_deal' },
  ],
  changelog: 'Added AI lead classification step',
});

// Execute the workflow
const { executionId } = await trpc.workflow.executeV2.mutate({
  workflowId: 'wf_onboarding',
  triggerData: {
    contact: {
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah@enterprise.com',
      company: 'Enterprise Corp',
      title: 'VP Engineering',
    },
  },
  isTest: false,
});

// Get execution trace for debugging
const trace = await trpc.workflow.executionTrace.query({
  executionId,
});
```

### Example 7: Workflow Approvals (HITL)

```typescript
import { trpc } from '@/lib/trpc';

// List pending approvals for the current user
const approvals = await trpc.workflow.listApprovals.query({
  status: 'pending',
  ventureId: 'venture_abc',
});

// Process an approval
const result = await trpc.workflow.processApproval.mutate({
  approvalId: approvals[0].id,
  decision: 'approved',
  reason: 'Contract terms look good, proceed with sending.',
});
// result.executionId — the execution resumes automatically

// Reject with reason
await trpc.workflow.processApproval.mutate({
  approvalId: approvals[1].id,
  decision: 'rejected',
  reason: 'Pricing needs revision. Discount too steep for this deal size.',
});
```

### Example 8: Document Creation from Template

```typescript
import { trpc } from '@/lib/trpc';

// Create a document from a template
const document = await trpc.documentEditor.cloneFromTemplate.mutate({
  templateId: 'tpl_proposal',
  title: 'Enterprise Corp — Platform Proposal Q1 2026',
  parentType: 'proposal',
  parentId: 'proposal_xyz',
});

// Resolve CRM variables (merge fields)
await trpc.documentEditor.resolveVariables.mutate({
  documentId: document.id,
  data: {
    'contact.firstName': 'Sarah',
    'contact.lastName': 'Chen',
    'contact.company': 'Enterprise Corp',
    'invoice.total': '$45,000',
    'proposal.validUntil': '2026-03-15',
  },
});

// Add a custom block
await trpc.documentEditor.addBlock.mutate({
  documentId: document.id,
  block: {
    id: 'custom_testimonial',
    type: 'testimonial',
    content: '"MCV transformed our operations in 3 months."',
    properties: {
      author: 'Previous Client',
      company: 'Tech Corp',
      rating: 5,
    },
    styles: { textAlign: 'center', padding: '24px' },
    sortOrder: 15,
  },
  afterBlockId: 'block_pricing',
});
```

### Example 9: AI Content Suggestions

```typescript
import { trpc } from '@/lib/trpc';

// Generate a rewrite suggestion
const suggestion = await trpc.documentEditor.generateSuggestion.mutate({
  documentId: 'doc_proposal',
  blockId: 'block_intro',
  suggestionType: 'rewrite',
});
// suggestion = {
//   id: 'sug_abc',
//   originalContent: 'We offer a platform...',
//   suggestedContent: 'Our enterprise-grade platform delivers...',
//   confidence: 0.92,
//   status: 'pending',
// }

// Translate a block to French
const translated = await trpc.documentEditor.translateBlock.mutate({
  documentId: 'doc_proposal',
  blockId: 'block_intro',
  targetLanguage: 'fr',
});

// Adjust tone to professional
await trpc.documentEditor.adjustTone.mutate({
  documentId: 'doc_proposal',
  blockId: 'block_conclusion',
  targetTone: 'professional',
});

// Generate content from a prompt
await trpc.documentEditor.generateFromPrompt.mutate({
  documentId: 'doc_proposal',
  prompt: 'Write a compelling ROI analysis section for a SaaS platform implementation',
  afterBlockId: 'block_pricing',
});

// Accept a suggestion (applies it to the document)
await trpc.documentEditor.acceptSuggestion.mutate({
  suggestionId: suggestion.id,
});
```

### Example 10: Document Collaboration and Locking

```typescript
import { trpc } from '@/lib/trpc';

// Lock document for editing (prevents concurrent edits)
await trpc.documentEditor.lockDocument.mutate({
  documentId: 'doc_contract',
});

// Add collaborators with specific roles
await trpc.documentEditor.addCollaborator.mutate({
  documentId: 'doc_contract',
  userId: 'user_legal',
  role: 'commenter',                // Can comment but not edit
});

await trpc.documentEditor.addCollaborator.mutate({
  documentId: 'doc_contract',
  userId: 'user_sales',
  role: 'editor',                   // Can edit blocks
});

// Add a block-level comment
const comment = await trpc.documentEditor.createComment.mutate({
  documentId: 'doc_contract',
  blockId: 'block_terms',
  content: 'We should revise the indemnification clause for enterprise clients.',
});

// Reply to comment (threaded)
await trpc.documentEditor.createComment.mutate({
  documentId: 'doc_contract',
  blockId: 'block_terms',
  content: 'Agreed. I\'ll update with the standard enterprise template language.',
  parentCommentId: comment.id,
});

// Resolve the comment thread
await trpc.documentEditor.resolveComment.mutate({
  id: comment.id,
});

// Unlock when done
await trpc.documentEditor.unlockDocument.mutate({
  documentId: 'doc_contract',
});
```

### Example 11: Document Publish Flow

```typescript
import { trpc } from '@/lib/trpc';

// Save a version snapshot before submitting
await trpc.documentEditor.saveVersion.mutate({
  documentId: 'doc_proposal',
  changeDescription: 'Final pricing updates before review',
});

// Submit for review (draft → review)
await trpc.documentEditor.submitForReview.mutate({
  documentId: 'doc_proposal',
});

// Approve the document (review → approved)
await trpc.documentEditor.approveDocument.mutate({
  documentId: 'doc_proposal',
});

// Publish (approved → published)
await trpc.documentEditor.publishDocument.mutate({
  documentId: 'doc_proposal',
});

// Later: restore a previous version
const history = await trpc.documentEditor.getVersionHistory.query({
  documentId: 'doc_proposal',
  page: 1,
  pageSize: 10,
});

await trpc.documentEditor.restoreVersion.mutate({
  documentId: 'doc_proposal',
  versionId: history.items[2].id,    // Restore version 3
});
```

### Example 12: Polymorphic Task Assignment

```typescript
import { db, taskAssignments } from '@mcv/db';

// Assign to a human user
await db.insert(taskAssignments).values({
  taskId: 'task_design',
  assigneeType: 'user',
  userId: 'user_designer',
  role: 'assignee',
  status: 'pending',
  allocationPercent: 80,
});

// Assign an AI agent as primary worker
await db.insert(taskAssignments).values({
  taskId: 'task_research',
  assigneeType: 'agent',
  agentId: 'agent_ralph',
  role: 'assignee',
  status: 'active',
  agentAutonomyLevel: 7,
  hitlRequired: true,
  assignmentReason: 'Auto-routed: research task with agent_primary ownership',
});

// Add a human reviewer
await db.insert(taskAssignments).values({
  taskId: 'task_research',
  assigneeType: 'user',
  userId: 'user_manager',
  role: 'reviewer',
  status: 'pending',
});

// Assign to agent pool for round-robin
await db.insert(taskAssignments).values({
  taskId: 'task_classify',
  assigneeType: 'agent_pool',
  agentPoolId: 'pool_data_agents',
  role: 'assignee',
  status: 'pending',
  workloadUnits: 1,
});
```

### Example 13: Task Activity Logging (Audit Trail)

```typescript
import { db, taskActivities } from '@mcv/db';

// Log a status change by a human
await db.insert(taskActivities).values({
  taskId: 'task_feature',
  activityType: 'status_change',
  actorType: 'user',
  userId: 'user_dev',
  summary: 'Status changed from in_progress to in_review',
  previousValue: 'in_progress',
  newValue: 'in_review',
  ventureId: 'venture_abc',
});

// Log an agent starting work
await db.insert(taskActivities).values({
  taskId: 'task_research',
  activityType: 'agent_started',
  actorType: 'agent',
  agentId: 'agent_ralph',
  summary: 'Agent Ralph started research on Q4 revenue trends',
  details: {
    sessionId: 'session_xyz',
    autonomyLevel: 7,
    estimatedDuration: '45 minutes',
  },
  ventureId: 'venture_abc',
  isVisibleToAgents: true,
});

// Log a HITL checkpoint
await db.insert(taskActivities).values({
  taskId: 'task_research',
  activityType: 'hitl_requested',
  actorType: 'agent',
  agentId: 'agent_ralph',
  summary: 'Agent requesting approval for data export exceeding 10GB threshold',
  details: {
    dataSize: '12.4GB',
    reason: 'Export size exceeds configured HITL threshold',
    checkpoint: 'data_export_approval',
  },
  ventureId: 'venture_abc',
});
```

### Example 14: Workflow Version Diffing

```typescript
import { trpc } from '@/lib/trpc';

// List versions for a workflow
const versions = await trpc.workflow.listVersions.query({
  workflowId: 'wf_onboarding',
  page: 1,
  pageSize: 10,
});

// Diff two versions
const diff = await trpc.workflow.diffVersions.query({
  versionId1: versions.items[0].id,  // v3
  versionId2: versions.items[2].id,  // v1
});

console.log(diff);
// {
//   addedNodes: ['classify', 'branch'],
//   removedNodes: ['old_manual_check'],
//   modifiedNodes: ['send_email'],       // Config changed
//   addedEdges: ['e2', 'e3', 'e4'],
//   removedEdges: ['e_old'],
// }

// Rollback to a previous version
const { newVersionId } = await trpc.workflow.rollbackVersion.mutate({
  workflowId: 'wf_onboarding',
  versionId: versions.items[2].id,   // Rollback to v1
});
// Creates a new version (v4) with v1's content
```

### Example 15: Reusable Document Assets

```typescript
import { trpc } from '@/lib/trpc';

// Create a reusable text snippet
const snippet = await trpc.documentEditor.createAsset.mutate({
  name: 'Standard NDA Clause',
  type: 'clause',
  content: {
    text: 'Both parties agree to maintain confidentiality of all proprietary information...',
    format: 'markdown',
    category: 'legal',
  },
  tags: ['nda', 'legal', 'confidentiality'],
});

// Create a reusable pricing table
const pricingTable = await trpc.documentEditor.createAsset.mutate({
  name: 'SaaS Pricing Tiers',
  type: 'pricing_table',
  content: {
    tiers: [
      { name: 'Starter', price: 49, features: ['5 users', '10GB', 'Email support'] },
      { name: 'Business', price: 149, features: ['25 users', '100GB', 'Priority support'] },
      { name: 'Enterprise', price: 'Custom', features: ['Unlimited', '1TB', 'Dedicated CSM'] },
    ],
    currency: 'USD',
    billingPeriod: 'monthly',
  },
  tags: ['pricing', 'saas', 'proposal'],
});

// Search assets by tags
const legalAssets = await trpc.documentEditor.searchAssetsByTags.query({
  tags: ['legal'],
  page: 1,
  pageSize: 20,
});

// Track usage when inserting into a document
await trpc.documentEditor.incrementAssetUsage.mutate({
  id: snippet.id,
});
```

---

## Performance Considerations

### Database Query Optimization

| Pattern | Strategy | Impact |
|---------|----------|--------|
| **Task listing with filters** | Composite indexes on `(projectId, status)`, `(projectId, assignee)`, `(projectId, type)` | <50ms for 10K+ task projects |
| **Dependency cycle detection** | BFS traversal with visited set; avoids re-scanning explored nodes | O(V + E) per check |
| **Bulk status updates** | Single `UPDATE ... WHERE id IN (...)` + batch history inserts | Linear vs N individual updates |
| **Time entry aggregation** | Subquery `SUM()` pushed to DB; updates `task.timeSpentMinutes` atomically | Avoids N+1 reads |
| **Workflow execution graph** | Async graph traversal with `Promise.all()` for parallel branches | Concurrent node execution |
| **Document block operations** | JSONB `blocks[]` updated in-place; version snapshots taken before mutations | Efficient for < 500 blocks |
| **Sprint velocity queries** | Pre-computed `completedPoints`, `velocity` columns; no runtime aggregation | O(1) reads |
| **Approval timeout checks** | Index on `expiresAt`; periodic scan via `WHERE expires_at < NOW()` | Efficient cron sweep |

### Recommended Limits

| Resource | Recommended Limit | Rationale |
|----------|------------------|-----------|
| Tasks per project | 10,000 | Index performance degrades beyond this |
| Subtask depth | 5 levels | UI rendering, query complexity |
| Dependencies per task | 20 | Cycle detection BFS performance |
| Blocks per document | 500 | JSONB read/write performance |
| Workflow nodes | 200 | Graph execution memory |
| Workflow edges | 500 | Traversal performance |
| Loop iterations | 1,000 | `DEFAULT_MAX_LOOP_ITERATIONS` hard limit |
| Concurrent timers per user | 1 | Business rule, enforced on `startTimer` |
| Document collaborators | 50 | JSONB array in `collaborators` column |
| Template variables | 100 | Resolution loop performance |
| Approval assignees | 10 | JSONB array in `assigned_to` |
| Retry attempts | 3 | `DEFAULT_RETRY.maxRetries`, exponential backoff |

### Caching Strategy

| Data | Cache Layer | TTL | Invalidation |
|------|------------|-----|--------------|
| Task list queries | Application (tRPC cache) | 30s | On task mutation |
| Project hierarchy | Application | 5m | On project mutation |
| Sprint metrics | Application | 1m | On task status change |
| Workflow templates | Application | 10m | On template mutation |
| Document templates | Application | 10m | On template mutation |
| Public templates | CDN | 1h | Manual purge |
| Dependency graph | Application | 1m | On dependency mutation |
| Active timer | No cache | — | Real-time from DB |

---

## Security

### Access Control Matrix

| Resource | Read | Create | Update | Delete | Special |
|----------|------|--------|--------|--------|---------|
| **Tasks** | ventureProcedure | ventureProcedure | ventureProcedure | ventureProcedure | bulkUpdateStatus: venture |
| **Projects** | ventureProcedure | ventureProcedure | ventureProcedure | ventureProcedure | archive: venture |
| **Sprints** | ventureProcedure | ventureProcedure | ventureProcedure | ventureProcedure | — |
| **Workflows** | protectedProcedure | adminProcedure | adminProcedure | adminProcedure | execute/toggle: admin |
| **Workflow Approvals** | protectedProcedure | — | adminProcedure | — | processApproval: admin |
| **Time Entries** | ventureProcedure | ventureProcedure | ventureProcedure | ventureProcedure | approve: venture |
| **Documents** | ventureProcedure | adminProcedure | adminProcedure | adminProcedure | publish: admin |
| **Doc Templates** | ventureProcedure | adminProcedure | adminProcedure | adminProcedure | publicList: protected |
| **Doc Assets** | ventureProcedure | adminProcedure | adminProcedure | adminProcedure | incrementUsage: protected |
| **Doc Comments** | ventureProcedure | protectedProcedure | protectedProcedure (own) | adminProcedure | resolve: admin |
| **AI Suggestions** | ventureProcedure | adminProcedure | adminProcedure | — | accept/reject: admin |

### Venture Isolation

All operations are venture-scoped through one of two mechanisms:

1. **RLS Policies (projects):** PostgreSQL row-level security using `current_setting('app.current_venture_id')::uuid`
2. **Application-level scoping:** `TaskService`, `ProjectService` are instantiated with `ventureId` and verify ownership on every operation

```typescript
// Every TaskService method verifies venture ownership
class TaskService {
  constructor(ventureId: string) {
    this.ventureId = ventureId;
  }

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

### Document Locking

Documents use pessimistic locking to prevent concurrent editing conflicts:

- `lockDocument` sets `lockedBy` and `lockedAt`
- Only the lock holder or admins (via `forceUnlockDocument`) can unlock
- Block mutations check lock status before proceeding
- Stale locks should be cleaned up periodically (e.g., locks older than 30 minutes)

### Workflow Execution Security

- Only `adminProcedure` can execute workflows, process approvals, or modify templates
- Test mode (`isTest: true`) prevents real side effects (no emails, no CRM updates)
- Sub-workflow execution inherits parent's venture context
- Approval timeout prevents indefinite workflow pauses
- Rate limiting per node prevents infinite loops in webhooks/API calls

---

## Audit Events

All mutations in the Operations domain emit structured audit logs via `AuditService.log()`. Each log entry includes:

```typescript
interface AuditLogEntry {
  action: string;           // Namespaced action identifier
  userId: string;           // Authenticated user
  ventureId: string;        // Venture context
  ipAddress: string;        // Client IP
  metadata: Record<string, unknown>;  // Action-specific details
}
```

### Event Catalog

| Event | Trigger | Metadata |
|-------|---------|----------|
| **Tasks** | | |
| `tasks.created` | Task creation | `taskTitle`, `projectId` |
| `tasks.updated` | Task field update | `taskId` |
| `tasks.deleted` | Task deletion | `taskId` |
| **Projects** | | |
| `projects.created` | Project creation | `projectId`, `name` |
| `projects.updated` | Project update | `projectId`, `changes` |
| `projects.archived` | Project archived | `projectId` |
| `projects.deleted` | Project deletion | `projectId` |
| **Workflows** | | |
| `workflows.created` | Workflow creation | `workflowId`, `workflowName`, `triggerType`, `actionCount` |
| `workflows.updated` | Workflow update | `workflowId`, `changes` |
| `workflows.deleted` | Workflow deletion | `workflowId` |
| `workflows.activated` | Workflow enabled | `workflowId`, `isActive: true` |
| `workflows.deactivated` | Workflow disabled | `workflowId`, `isActive: false` |
| `workflows.tested` | Workflow test run | `workflowId`, `taskId`, `runId`, `runStatus` |
| **Workflow V2** | | |
| `workflows.version_created` | Version snapshot | `workflowId`, `versionId`, `version`, `nodeCount`, `edgeCount` |
| `workflows.version_rollback` | Version rollback | `workflowId`, `rolledBackTo`, `newVersionId` |
| `workflows.execution_started` | V2 execution started | `workflowId`, `executionId`, `isTest` |
| `workflows.execution_resumed` | Execution resumed | `executionId` |
| `workflows.execution_cancelled` | Execution cancelled | `executionId` |
| `workflows.execution_retried` | Execution retried | `originalExecutionId`, `newExecutionId`, `fromStepId` |
| `workflows.step_replayed` | Step replayed | `stepExecutionId`, `hasOverride` |
| `workflows.v2_tested` | V2 test execution | `workflowId`, `executionId` |
| **Workflow Approvals** | | |
| `workflows.approval_approved` | Approval granted | `approvalId`, `decision`, `reason`, `executionId` |
| `workflows.approval_rejected` | Approval denied | `approvalId`, `decision`, `reason`, `executionId` |
| `workflows.approval_timeouts_checked` | Timeout scan | `processedCount` |
| **Workflow Templates** | | |
| `workflows.template_created` | Template creation | `templateId`, `templateName`, `category`, `isPublic` |
| `workflows.template_updated` | Template update | `templateId` |
| `workflows.template_deleted` | Template deletion | `templateId` |
| `workflows.template_instantiated` | Template → workflow | `templateId`, `workflowId`, `workflowName` |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `WORKFLOW_MAX_LOOP_ITERATIONS` | No | `1000` | Maximum iterations for workflow loops |
| `WORKFLOW_DEFAULT_RETRY_MAX` | No | `3` | Default retry attempts for workflow steps |
| `WORKFLOW_DEFAULT_BACKOFF_MS` | No | `1000` | Default retry backoff (milliseconds) |
| `WORKFLOW_BACKOFF_MULTIPLIER` | No | `2` | Exponential backoff multiplier |
| `WORKFLOW_APPROVAL_TIMEOUT_HOURS` | No | `72` | Default approval expiry (hours) |
| `TIMER_STALE_LOCK_MINUTES` | No | `30` | Auto-unlock documents after N minutes |
| `TASK_MAX_SUBTASK_DEPTH` | No | `5` | Maximum subtask hierarchy depth |
| `TASK_MAX_DEPENDENCIES` | No | `20` | Maximum dependencies per task |
| `DOCUMENT_MAX_BLOCKS` | No | `500` | Maximum blocks per document |
| `DOCUMENT_MAX_COLLABORATORS` | No | `50` | Maximum collaborators per document |
| `AI_SUGGESTION_EXPIRY_HOURS` | No | `168` | AI suggestion auto-expiry (7 days) |
| `TIME_ENTRY_APPROVAL_REQUIRED` | No | `false` | Require approval for time entries |
| `SPRINT_DEFAULT_LENGTH_WEEKS` | No | `2` | Default sprint duration |

---

## Error Codes

| Code | HTTP | Cause | Resolution |
|------|------|-------|------------|
| `NOT_FOUND` | 404 | Task, project, workflow, document, or template not found | Verify resource ID and venture context |
| `BAD_REQUEST` | 400 | Self-dependency, invalid status transition, timer already running | Check input validation rules |
| `CONFLICT` | 409 | Duplicate dependency, running timer exists | Resolve conflict or stop existing timer |
| `INTERNAL_SERVER_ERROR` | 500 | Database unavailable, insert/update failure | Check database connectivity |
| `UNAUTHORIZED` | 401 | Missing authentication | Provide valid session token |
| `FORBIDDEN` | 403 | Insufficient permissions (admin required) | Use appropriate access level |

### Domain-Specific Errors

| Error Message | Context | Details |
|---------------|---------|---------|
| `"Task not found"` | Task CRUD | Task doesn't exist or is in different venture |
| `"Project not found in this venture"` | Task creation | Project ID doesn't match current venture |
| `"Parent task not found in this project"` | Subtask creation | Parent must be in same project |
| `"A task cannot depend on itself"` | Dependency | `taskId === dependsOnId` |
| `"Adding this dependency would create a circular dependency"` | Dependency | BFS detected cycle in graph |
| `"This dependency already exists"` | Dependency | Unique constraint violation |
| `"One or both tasks not found"` | Dependency | Task IDs not in venture scope |
| `"You already have a running timer. Please stop it first."` | Start timer | One timer per user constraint |
| `"Timer not found"` | Stop timer | Timer ID invalid or not owned by user |
| `"Timer is not running"` | Stop timer | `isRunning === false` |
| `"Venture context required"` | Document operations | Missing venture ID in context |
| `"Document not found"` | Document CRUD | Document doesn't exist in venture |
| `"Template not found"` | Template lookup | Template ID invalid |
| `"Asset not found"` | Asset lookup | Asset ID invalid |
| `"Comment not found or not owned by you"` | Comment edit | Non-owner attempting edit |
| `"Workflow not found"` | Workflow CRUD | Workflow ID invalid |
| `"Execution not found"` | Execution control | Execution ID invalid |
| `"Execution is {status}, not paused"` | Resume execution | Can only resume paused executions |
| `"Version not found"` | Version rollback | Version ID or workflow mismatch |
| `"Failed to create execution"` | Execution start | Database insert failure |
| `"Database not available"` | Any operation | `db` is null/undefined |

---

## Dependencies

### Internal Dependencies

| Package | Purpose | Usage |
|---------|---------|-------|
| `@mcv/db` | Database schema, Drizzle ORM, query helpers | All table definitions, relations, types |
| `@mcv/document-editor/server` | Document editor service implementations | `documentService`, `templateService`, `aiContentService`, `assetService` |
| `@trpc/server` | API framework | Router definitions, procedure types, TRPCError |
| `drizzle-orm` | ORM and query builder | Schema definitions, query execution, relations |
| `drizzle-orm/pg-core` | PostgreSQL schema primitives | Table, column, index definitions |
| `zod` | Input validation | Schema definitions for all API inputs |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@trpc/server` | ^11.x | tRPC router and procedure framework |
| `drizzle-orm` | ^0.38.x | Type-safe ORM for PostgreSQL |
| `zod` | ^3.x | Schema validation for API inputs |

### Peer Dependencies

| Module | Relationship | Description |
|--------|-------------|-------------|
| `@mcv/intelligence/gateway` | AI content suggestions | LLM calls for rewrite, expand, translate, tone |
| `@mcv/auth` | Authentication | Session validation, user identity |
| `@mcv/ventures` | Multi-tenancy | Venture context, RLS configuration |
| `@mcv/notifications` | Workflow actions | Email, SMS, push, in-app notifications |
| `@mcv/crm/contacts` | Variable resolution | Contact data for document merge fields |
| `@mcv/crm/deals` | Workflow triggers | Deal stage changes trigger workflows |

---

## Cross-Domain Integration Points

### Operations → Intelligence (Tier 4)

- **AI Content Suggestions:** Document editor calls the AI Gateway for `rewrite`, `expand`, `summarize`, `translate`, `tone_change`, and `grammar` operations
- **AI Task Classification:** Workflow V2 `ai_classify`, `ai_extract`, `ai_summarize`, `ai_prompt` nodes route through the Gateway
- **AI Priority Scoring:** Tasks store `aiPriorityScore` computed by AI models analyzing task context

### Operations → CRM (Tier 5)

- **Document Variables:** Merge fields resolve from CRM contact/deal/invoice data
- **Workflow Triggers:** CRM events (contact created, deal won, etc.) trigger workflow execution
- **Workflow Actions:** CRM mutations (create contact, update deal stage, add tag) as workflow action nodes

### Operations → Auth (Tier 3)

- **Venture Scoping:** All operations isolated by venture via RLS and application-level checks
- **Procedure Guards:** `ventureProcedure` (authenticated + venture), `adminProcedure` (admin role), `protectedProcedure` (authenticated)
- **User References:** Task assignee, reporter, comment author, approval decider — all reference `users` table

### Operations → Notifications

- **Workflow Actions:** `send_notification`, `send_email`, `send_sms` actions in workflow execution
- **Task Events:** Overdue notifications, assignment notifications, SLA breach alerts

---

## Migration Notes

### Schema Creation Order

Due to foreign key dependencies, tables must be created in this order:

1. `ventures` (external dependency)
2. `users` (external dependency)
3. `projects` (references ventures, users)
4. `tasks` (references projects, users)
5. `sprints` (references ventures, users)
6. `task_assignments` (references tasks, users)
7. `task_activities` (references tasks, users)
8. `task_dependencies` (references tasks)
9. `task_templates` (references ventures, users)
10. `time_entries` (references tasks, users, projects)
11. `workflows` (references ventures, users)
12. `workflow_versions` (references workflows, users)
13. `workflow_executions` (references workflows, workflow_versions, ventures)
14. `workflow_step_executions` (references workflow_executions, users)
15. `workflow_approvals` (references workflow_step_executions, workflows, users)
16. `workflow_templates` (references ventures, users)
17. `document_templates` (references ventures)
18. `documents` (references ventures, document_templates)
19. `document_versions` (references documents)
20. `document_comments` (references documents, self-referential)
21. `document_assets` (references ventures)
22. `ai_content_suggestions` (references documents)

### Recommended RLS Policies

Apply venture isolation RLS to all venture-scoped tables:

```sql
-- For each table with venture_id:
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY <table>_venture_isolation ON <table_name>
  FOR ALL
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

CREATE POLICY <table>_service_role ON <table_name>
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

Tables requiring venture isolation via joins (no direct `venture_id`):
- `tasks` — join through `projects.venture_id`
- `task_assignments` — join through `tasks.project_id → projects.venture_id`
- `task_activities` — has `venture_id` column (direct)
- `task_dependencies` — join through `tasks.project_id → projects.venture_id`
- `time_entries` — join through `tasks.project_id → projects.venture_id` or `projects.venture_id`

---

## Glossary

| Term | Definition |
|------|-----------|
| **Agentic Task** | A task with `ownerType` set to `agent_primary` or `agent_only`, indicating AI agent execution |
| **HITL** | Human-in-the-Loop — a checkpoint where an AI agent pauses for human review/approval |
| **Sprint Velocity** | The rate of story point completion per time period (typically per week) |
| **SLA Breach** | When a task's `slaDeadline` passes without completion; triggers `slaBreached = true` |
| **Venture Isolation** | Security boundary ensuring users can only access data within their venture |
| **Block-Based Editor** | Document editing paradigm where content is composed of discrete, typed blocks |
| **Merge Field** | A variable placeholder in a document template (e.g., `{{contact.firstName}}`) that resolves from CRM data |
| **Condition Group** | Nested logical structure (AND/OR/NOT) for evaluating workflow trigger conditions |
| **Graph Execution** | Workflow V2 engine that traverses a directed acyclic graph of nodes and edges |
| **Approval Escalation** | When an approval request times out and is automatically forwarded to an escalation contact |
| **Split Testing** | Workflow feature that routes traffic through multiple branches and selects a winner based on metrics |
| **Business Hours** | Workflow timing configuration that restricts execution to working days/hours with timezone and holiday awareness |

---

*Operations Domain Module — @mcv/operations v1.0*  
*Generated from DB schemas and API source — February 8, 2026*