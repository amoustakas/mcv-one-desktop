# @mcv/operations — Technical Architecture

> **Package:** `@mcv/operations`
> **Classification:** PUBLISHABLE
> **Tier:** 5 — Domain Layer
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
   - [Tasks](#tasks-module)
   - [Projects](#projects-module)
   - [Sprints](#sprints-module)
   - [Workflows](#workflows-module)
   - [Time Tracking](#time-tracking-module)
   - [Document Editor](#document-editor-module)
   - [Assets](#assets-module)
   - [Calendar](#calendar-module-planned)
4. [Data Models (Drizzle ORM)](#data-models-drizzle-orm)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance](#performance)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security](#security)

---

## Architecture Overview

`@mcv/operations` follows a layered architecture within MCV's Tier 5 domain layer. The domain is composed of six active submodules (Tasks, Projects, Sprints, Workflows, Time, Editor) and one planned submodule (Calendar), each following the same structural pattern:

```
┌─────────────────────────────────────────────────┐
│                 CLIENT LAYER                     │
│  React Components · Views · Forms · Modals      │
└───────────────────────┬─────────────────────────┘
                        │  tRPC Calls
┌───────────────────────┼─────────────────────────┐
│              tRPC ROUTER LAYER                   │
│  Input Validation (Zod) · Procedure Guards      │
│  ventureProcedure · adminProcedure              │
└───────────────────────┬─────────────────────────┘
                        │  Service Calls
┌───────────────────────┼─────────────────────────┐
│              SERVICE LAYER                       │
│  Business Logic · Venture Scoping               │
│  TaskService · WorkflowEngine · ProjectService  │
└───────────────────────┬─────────────────────────┘
                        │  Drizzle Queries
┌───────────────────────┼─────────────────────────┐
│              DATABASE LAYER                      │
│  PostgreSQL + Drizzle ORM + RLS Policies        │
│  20 Tables · 100+ Indexes                       │
└─────────────────────────────────────────────────┘
```

### Design Principles

1. **Venture-First Isolation** — Every operation is scoped to a venture. RLS policies and application-level checks ensure zero cross-venture data leakage.
2. **Service Layer Authority** — Business logic lives in service classes, not routers. Routers are thin wrappers for input validation and procedure guards.
3. **Type-Safe Throughout** — Drizzle ORM provides compile-time type safety from schema definition through query execution. Zod validates all API inputs.
4. **AI-Native Design** — Tasks support agentic ownership models, workflows support AI action nodes, documents support AI content suggestions. AI is not bolted on — it's architectural.
5. **Event-Driven Audit** — Every mutation emits structured audit events via `AuditService.log()` for downstream analytics, compliance, and workflow triggering.
6. **Optimistic Concurrency** — Tasks use a `version` column for optimistic locking to prevent lost updates in concurrent editing scenarios.

---

## System Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                            @mcv/operations — SYSTEM ARCHITECTURE                     │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              CLIENT LAYER (Tier 7)                              │  │
│  │                                                                                │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │  │
│  │  │  Board View   │ │  List View   │ │  Gantt View  │ │  Calendar    │         │  │
│  │  │  (Kanban)     │ │  (Table)     │ │  (Timeline)  │ │  View        │         │  │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘         │  │
│  │         │                │                │                │                   │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │  │
│  │  │  Sprint       │ │  Time Sheet  │ │  Document    │ │  Workflow    │         │  │
│  │  │  Planner      │ │  Dashboard   │ │  Editor      │ │  Builder     │         │  │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘         │  │
│  │         └────────────────┴────────────────┴────────────────┘                   │  │
│  └───────────────────────────────────┬────────────────────────────────────────────┘  │
│                                      │                                                │
│                             tRPC Procedures (Tier 6)                                  │
│                                      │                                                │
│  ┌───────────────────────────────────┼────────────────────────────────────────────┐  │
│  │                          API ROUTER LAYER                                      │  │
│  │                                                                                │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │  │
│  │  │ taskRouter   │ │ projectRouter│ │workflowRouter│ │ timeEntry-   │         │  │
│  │  │              │ │              │ │              │ │ Router       │         │  │
│  │  │  16 procs    │ │  8 procs     │ │  30+ procs   │ │  11 procs    │         │  │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘         │  │
│  │         │                │                │                │                   │  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐      │  │
│  │  │             documentEditorRouter (40+ procedures)                    │      │  │
│  │  │  Documents · Blocks · Versions · Collaboration · Variables          │      │  │
│  │  │  Publish Flow · Templates · AI Suggestions · Assets · Comments      │      │  │
│  │  └──────────────────────────────────┬───────────────────────────────────┘      │  │
│  │                                     │                                          │  │
│  └─────────────────────────────────────┼──────────────────────────────────────────┘  │
│                                        │                                              │
│  ┌─────────────────────────────────────┼──────────────────────────────────────────┐  │
│  │                            SERVICE LAYER                                       │  │
│  │                                                                                │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐   │  │
│  │  │    TaskService       │  │   WorkflowEngine    │  │  DocumentService    │   │  │
│  │  │                      │  │                      │  │                      │   │  │
│  │  │  Venture-scoped     │  │  Graph execution    │  │  Block CRUD        │   │  │
│  │  │  Dependency graph   │  │  Parallel branches  │  │  Version history   │   │  │
│  │  │  Cycle detection    │  │  Loop control       │  │  Lock management   │   │  │
│  │  │  Bulk operations    │  │  Try/catch/retry    │  │  Variable resolve  │   │  │
│  │  │  History tracking   │  │  HITL approvals     │  │  Publish flow      │   │  │
│  │  │  Comment threads    │  │  Sub-workflows      │  │  AI suggestions    │   │  │
│  │  │  Position reorder   │  │  Condition eval     │  │  Collaboration     │   │  │
│  │  └──────────┬──────────┘  │  Business hours     │  └──────────┬──────────┘   │  │
│  │             │              │  Rate limiting      │             │               │  │
│  │  ┌─────────────────────┐  │  Split testing      │  ┌─────────────────────┐   │  │
│  │  │   ProjectService    │  │  Version rollback   │  │  AiContentService   │   │  │
│  │  │                      │  └──────────┬──────────┘  │                      │   │  │
│  │  │  Hierarchy tree     │             │              │  Rewrite · Expand   │   │  │
│  │  │  Stats aggregation  │             │              │  Translate · Tone   │   │  │
│  │  │  Archive logic      │             │              │  Prompt generate    │   │  │
│  │  └──────────┬──────────┘             │              └──────────┬──────────┘   │  │
│  │             │                        │                         │               │  │
│  │             │              ┌─────────────────────┐             │               │  │
│  │             │              │   AuditService       │             │               │  │
│  │             │              │                      │             │               │  │
│  │             │              │  All mutations emit  │             │               │  │
│  │             └──────────────│  structured audit    │─────────────┘               │  │
│  │                            │  log entries         │                             │  │
│  │                            └──────────┬──────────┘                             │  │
│  └───────────────────────────────────────┼────────────────────────────────────────┘  │
│                                          │                                            │
│  ┌───────────────────────────────────────┼────────────────────────────────────────┐  │
│  │                      DATABASE LAYER (PostgreSQL + Drizzle ORM)                 │  │
│  │                                                                                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ ┌──────────────┐  │  │
│  │  │  tasks   │ │ projects │ │ sprints  │ │ task_          │ │ task_        │  │  │
│  │  │  50+ col │ │  14 col  │ │  18 col  │ │ assignments    │ │ activities   │  │  │
│  │  │  18 idx  │ │   6 idx  │ │   5 idx  │ │  22 col, 6 idx │ │ 14 col,6 idx│  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────┘ └──────────────┘  │  │
│  │                                                                                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐   │  │
│  │  │task_deps │ │task_tmpl │ │ workflows  │ │ wf_versions│ │ wf_executions│   │  │
│  │  │  5 col   │ │  23 col  │ │  13 col    │ │   6 col    │ │  14 col      │   │  │
│  │  └──────────┘ └──────────┘ └────────────┘ └────────────┘ └──────────────┘   │  │
│  │                                                                                │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────────┐          │  │
│  │  │ wf_step_exec │ │ wf_approvals │ │ time_entry │ │  documents   │          │  │
│  │  │  13 col      │ │  12 col      │ │  19 col    │ │   17 col     │          │  │
│  │  └──────────────┘ └──────────────┘ └────────────┘ └──────────────┘          │  │
│  │                                                                                │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │  │
│  │  │ doc_templates│ │ doc_versions │ │ doc_comments │ │ doc_assets   │        │  │
│  │  │  14 col      │ │   6 col      │ │  10 col      │ │   9 col      │        │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        │  │
│  │                                                                                │  │
│  │  ┌──────────────┐ ┌──────────────┐                                           │  │
│  │  │ ai_suggest   │ │ wf_templates │    Total: 20 tables, 100+ indexes         │  │
│  │  │   9 col      │ │  12 col      │                                           │  │
│  │  └──────────────┘ └──────────────┘                                           │  │
│  │                                                                                │  │
│  │  Row-Level Security (RLS) on all venture-scoped tables                        │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐    │
│  │                     EXTERNAL INTEGRATION POINTS                              │    │
│  │                                                                              │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │    │
│  │  │ @mcv/kernel  │ │ @mcv/identity│ │ @mcv/fabric  │ │ @mcv/shared  │       │    │
│  │  │ AI Gateway   │ │ Auth + RLS   │ │ DB + Storage │ │ Events + Notif│       │    │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │    │
│  │                                                                              │    │
│  │  ┌──────────────┐ ┌──────────────┐                                          │    │
│  │  │ @mcv/crm     │ │ @mcv/comms   │                                          │    │
│  │  │ Contacts/Deals│ │ Email/SMS    │                                          │    │
│  │  └──────────────┘ └──────────────┘                                          │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Architecture

### Tasks Module

The Tasks module is the core work-item engine. It manages the entire lifecycle of work items from creation through completion, with support for deep hierarchy, polymorphic assignments, dependency graphs, and comprehensive activity auditing.

#### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      TASKS MODULE                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    taskRouter                         │   │
│  │                                                      │   │
│  │  list ─┐  create ─┐  updateStatus ─┐  addDep ─┐    │   │
│  │  get  ─┤  update ─┤  bulkUpdate  ─┤  rmDep  ─┤    │   │
│  │         │  delete ─┘  reorder     ─┘  graph  ─┘    │   │
│  │         │                                            │   │
│  │  subtasks ── comments ── history ── logTime         │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┼─────────────────────────────┐   │
│  │                   TaskService                         │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ Venture Scoping                              │    │   │
│  │  │  constructor(ventureId: string)              │    │   │
│  │  │  verifyProject() — ownership check           │    │   │
│  │  │  verifyParentTask() — same-project check     │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ Dependency Engine                            │    │   │
│  │  │  addDependency() — with cycle detection      │    │   │
│  │  │  removeDependency()                          │    │   │
│  │  │  getDependencyGraph() — project-wide graph   │    │   │
│  │  │  hasCyclicDependency() — BFS traversal       │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ Activity Logger                              │    │   │
│  │  │  logActivity() — 41 activity types           │    │   │
│  │  │  emitAuditEvent() — structured audit log     │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Database Tables                    │   │
│  │                                                      │   │
│  │  tasks ──────── 50+ columns, 18 indexes              │   │
│  │  task_assignments ── 22 columns, 6 indexes           │   │
│  │  task_activities ─── 14 columns, 6 indexes           │   │
│  │  task_dependencies ── 5 columns, 1 unique constraint │   │
│  │  task_templates ───── 23 columns, 5 indexes          │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

#### Task Status State Machine

The task lifecycle is a 17-state finite state machine with well-defined transitions:

```
                      ┌─────────┐
                      │  draft  │
                      └────┬────┘
                           │
                      ┌────┴────┐
             ┌────────│ backlog │────────┐
             │        └────┬────┘        │
             │             │             │
        ┌────┴────┐  ┌────┴────┐  ┌─────┴─────┐
        │  ready  │  │ queued  │  │ deferred  │
        └────┬────┘  └────┬────┘  └───────────┘
             │             │
             └──────┬──────┘
                    │
               ┌────┴────┐
               │  todo   │
               └────┬────┘
                    │
          ┌─────────┴─────────┐
          │   in_progress     │ ←── timer_started
          └─────────┬─────────┘
                    │
         ┌──────────┼──────────────┐
         │          │              │
    ┌────┴────┐     │       ┌──────┴──────┐
    │ blocked │     │       │  in_review  │
    └────┬────┘     │       └──────┬──────┘
         │          │              │
         └────┬─────┘     ┌────────┴─────────┐
              │           │awaiting_approval │
              │           └────────┬─────────┘
              │                    │
              │           ┌────────┴──────┐      ┌──────────────┐
              │           │ hitl_pending  │──?──│ hitl_rejected│
              │           └────────┬──────┘      └──────────────┘
              │                    │
              │           ┌────────┴──────┐
              │           │ hitl_approved │
              │           └────────┬──────┘
              │                    │
              └────────┬───────────┘
                       │
                  ┌────┴────┐
                  │  done   │ ←── completedAt set
                  └────┬────┘
                       │
                  ┌────┴──────┐
                  │ archived  │
                  └───────────┘

                  ┌───────────┐
                  │ cancelled │ (reachable from ANY state)
                  └───────────┘
```

#### Dependency Engine — Cycle Detection Algorithm

The dependency engine uses Breadth-First Search (BFS) to detect cycles before adding new edges:

```
Algorithm: hasCyclicDependency(taskId, dependsOnId)

Input:  taskId (the task that would have the dependency)
        dependsOnId (the task being depended upon)

1. If taskId === dependsOnId → REJECT (self-dependency)

2. Load all dependencies for the project:
   SELECT task_id, depends_on_id FROM task_dependencies
   WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)

3. Build adjacency list:
   graph[dependsOnId] = [...existing dependents]

4. BFS from dependsOnId:
   queue = [dependsOnId]
   visited = Set()

   while queue is not empty:
     current = queue.dequeue()
     if current === taskId → CYCLE DETECTED → REJECT
     if current in visited → skip
     visited.add(current)
     for each dependent of current:
       queue.enqueue(dependent)

5. No cycle found → ALLOW dependency

Complexity: O(V + E) where V = tasks, E = dependencies
```

#### Polymorphic Assignment Model

Task assignments support six assignee types through a polymorphic pattern:

```
┌──────────────────────────────────────────────────────────────┐
│                  TaskAssignment (Polymorphic)                 │
│                                                              │
│  assigneeType  │  Active Column     │  Resolution            │
│  ─────────────────────────────────────────────────────────── │
│  'user'        │  userId            │  users table FK        │
│  'team'        │  teamId            │  teams table FK        │
│  'agent'       │  agentId           │  ai_agents table (text)│
│  'agent_pool'  │  agentPoolId       │  Round-robin routing   │
│  'workflow'    │  workflowId        │  Automation-assigned   │
│  'external'    │  externalReference │  JSONB external ref    │
│                                                              │
│  Additional fields:                                          │
│  ─────────────────                                           │
│  role: 'owner' | 'assignee' | 'reviewer' | 'approver'      │
│  allocationPercent: 0-100 (capacity planning)               │
│  agentAutonomyLevel: 1-10 (agent-specific)                  │
│  hitlRequired: boolean (agent checkpoint flag)              │
│  agentSessionId: string (active agent session)              │
└──────────────────────────────────────────────────────────────┘
```

### Projects Module

Projects are venture-scoped organizational containers. They provide the top-level grouping for tasks and enforce venture isolation.

```
┌──────────────────────────────────────────────────────────────┐
│                     PROJECTS MODULE                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  projectRouter                        │   │
│  │  list · get · create · update · delete               │   │
│  │  hierarchy · stats · archive                          │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                     │
│  ┌─────────────────────┼────────────────────────────────┐   │
│  │               ProjectService                          │   │
│  │                                                      │   │
│  │  Venture-scoped constructor                          │   │
│  │  Hierarchy tree traversal (parentId self-ref)        │   │
│  │  Statistics aggregation (task counts, completion %)  │   │
│  │  Archive logic (soft delete with cascade options)    │   │
│  │  JSONB settings management                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  projects table — 14 columns, 6 indexes               │   │
│  │                                                      │   │
│  │  RLS Policy: venture_id = app.current_venture_id     │   │
│  │  Self-ref FK: parent_id → projects.id                │   │
│  │  Visibility: private | team | venture | global        │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

#### Project Hierarchy

```
Venture A
├── Project: Platform Core (visibility: venture)
│   ├── Sub-project: Frontend (visibility: team)
│   │   ├── Task: Implement Dashboard
│   │   └── Task: Fix Navigation Bug
│   ├── Sub-project: Backend (visibility: team)
│   │   ├── Task: API Rate Limiting
│   │   └── Task: Database Migration
│   └── Sub-project: DevOps (visibility: private)
│       └── Task: CI/CD Pipeline
└── Project: Client Portal (visibility: venture)
    ├── Task: User Onboarding Flow
    └── Task: Billing Integration
```

### Sprints Module

Sprints are time-boxed iterations following agile methodology. They track capacity, velocity, and provide structured retrospective documentation.

```
┌──────────────────────────────────────────────────────────────┐
│                     SPRINTS MODULE                           │
│                                                              │
│  Sprint Lifecycle:                                           │
│                                                              │
│  ┌──────────┐    ┌────────┐    ┌────────┐    ┌───────────┐ │
│  │ planning │───>│ active │───>│ review │───>│ completed │ │
│  └──────────┘    └────────┘    └────────┘    └───────────┘ │
│        │                                                     │
│        └──────────────────────────────>┌───────────┐        │
│                                        │ cancelled │        │
│                                        └───────────┘        │
│                                                              │
│  Capacity Planning:                                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │  capacityPoints: 34    (story points available)    │     │
│  │  capacityHours:  80    (hours available)           │     │
│  │  committedPoints: 34   (points committed at start) │     │
│  │  completedPoints: 29   (points completed)          │     │
│  │  velocity: 14.5        (points per week)           │     │
│  │  taskCount: 8          (total tasks)               │     │
│  │  completedTaskCount: 7 (completed tasks)           │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Database: sprints table — 18 columns, 5 indexes            │
│  RLS: venture_id = app.current_venture_id                   │
│  Optional: team_id for team-scoped sprints                  │
└──────────────────────────────────────────────────────────────┘
```

### Workflows Module

The Workflows module is the most complex component in `@mcv/operations`. It provides a dual-generation automation engine:

- **V1 (Simple):** Trigger → Condition → Action automations for common task events
- **V2 (Graph):** Full graph-based execution engine with 90+ node types

#### V1 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   WORKFLOW V1 — SIMPLE AUTOMATIONS            │
│                                                              │
│  Trigger Event                                               │
│  (task_created, task_status_changed, task_overdue, etc.)    │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────┐                        │
│  │  Condition Matching             │                        │
│  │  triggerConditions: {           │                        │
│  │    taskPriority: ['high'],     │                        │
│  │    daysOverdue: 1,             │                        │
│  │  }                              │                        │
│  └──────────────┬──────────────────┘                        │
│                 │ Match?                                     │
│           ┌─────┴─────┐                                     │
│           │ Yes       │ No → Skip                           │
│           ▼                                                  │
│  ┌─────────────────────────────────┐                        │
│  │  Sequential Action Execution   │                        │
│  │  actions[0] → actions[1] → ... │                        │
│  │                                 │                        │
│  │  Types:                         │                        │
│  │   send_notification             │                        │
│  │   update_field                  │                        │
│  │   assign_user                   │                        │
│  │   create_task                   │                        │
│  │   add_comment                   │                        │
│  │   webhook                       │                        │
│  │   custom                        │                        │
│  └─────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

#### V2 Architecture — Graph-Based Execution Engine

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW ENGINE V2 — GRAPH EXECUTION                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                        TRIGGER LAYER                           │     │
│  │                                                                │     │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │     │
│  │  │Task Events│ │CRM Events │ │Comm Events│ │Cron/Manual│   │     │
│  │  │  6 types  │ │  20+ types│ │  12+ types│ │  5 types  │   │     │
│  │  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘   │     │
│  │        └─────────────┴─────────────┴─────────────┘           │     │
│  └──────────────────────────┬─────────────────────────────────────┘     │
│                             │                                            │
│  ┌──────────────────────────┼─────────────────────────────────────┐     │
│  │                   CONDITION EVALUATOR                           │     │
│  │                                                                │     │
│  │  Nested condition groups:                                      │     │
│  │  {                                                             │     │
│  │    logic: 'AND',                                               │     │
│  │    conditions: [                                               │     │
│  │      { field: 'contact.email', operator: 'ends_with',        │     │
│  │        value: '@enterprise.com' },                             │     │
│  │      { logic: 'OR', conditions: [                             │     │
│  │        { field: 'deal.value', operator: 'greater_than',      │     │
│  │          value: 10000 },                                       │     │
│  │        { field: 'contact.tags', operator: 'includes',        │     │
│  │          value: 'vip' },                                       │     │
│  │      ]}                                                        │     │
│  │    ]                                                           │     │
│  │  }                                                             │     │
│  │                                                                │     │
│  │  22 comparison operators                                       │     │
│  │  Variable resolution: {{trigger.taskStatus}}, {{contact.email}}│     │
│  │  Template interpolation: "Hello {{contact.firstName}}"         │     │
│  └──────────────────────────┬─────────────────────────────────────┘     │
│                             │                                            │
│  ┌──────────────────────────┼─────────────────────────────────────┐     │
│  │                    GRAPH EXECUTOR                               │     │
│  │                                                                │     │
│  │  Node Categories:                                              │     │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │     │
│  │  │  Actions  │ │Flow Control│ │ AI Actions│ │Data Actions│   │     │
│  │  │           │ │           │ │           │ │           │   │     │
│  │  │ send_sms │ │ if_else  │ │ ai_prompt │ │ set_var  │   │     │
│  │  │ send_    │ │ switch   │ │ ai_       │ │ math_op  │   │     │
│  │  │  email   │ │ wait     │ │  classify │ │ http_    │   │     │
│  │  │ create_  │ │ loop     │ │ ai_       │ │  request │   │     │
│  │  │  task    │ │ parallel │ │  extract  │ │ json_    │   │     │
│  │  │ update_  │ │ try_catch│ │ ai_       │ │  transform│  │     │
│  │  │  contact │ │ approval │ │  summarize│ │ text_    │   │     │
│  │  │ webhook  │ │ goto     │ │ rag_     │ │  format  │   │     │
│  │  │          │ │ sub_wf   │ │  search  │ │          │   │     │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │     │
│  │                                                                │     │
│  │  Execution Features:                                           │     │
│  │  ├── Parallel branches: join (all | any | n_of)              │     │
│  │  ├── Loop execution: for-each, while (max 1000 iterations)  │     │
│  │  ├── Try/catch: retry + exponential backoff (3 retries)      │     │
│  │  ├── Rate limiting: per-node throttling                       │     │
│  │  ├── Split testing: A/B routing with auto-winner             │     │
│  │  ├── Business hours: timezone, working days, holidays        │     │
│  │  ├── Sub-workflows: data passing, parent-child hierarchy     │     │
│  │  └── Test mode: isTest flag, no real side effects            │     │
│  └──────────────────────────┬─────────────────────────────────────┘     │
│                             │                                            │
│  ┌──────────────────────────┼─────────────────────────────────────┐     │
│  │                   EXECUTION TRACKING                           │     │
│  │                                                                │     │
│  │  workflow_executions ──> workflow_step_executions              │     │
│  │       │                       │                                │     │
│  │       │  status: running |    │  Per-step:                    │     │
│  │       │    completed |        │  input/output capture         │     │
│  │       │    failed |           │  retry count tracking         │     │
│  │       │    paused |           │  execution duration           │     │
│  │       │    cancelled          │  error messages               │     │
│  │       │                       │                                │     │
│  │       └── workflow_approvals                                  │     │
│  │            status: pending | approved | rejected |            │     │
│  │            expired | escalated                                 │     │
│  │            timeout + escalation logic                          │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Version Management:                                                     │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  workflow_versions — snapshot nodes/edges at a point in time  │     │
│  │  createVersion() — capture current graph state                │     │
│  │  rollbackVersion() — restore previous graph (creates new v)  │     │
│  │  diffVersions() — compare node/edge changes between versions │     │
│  └────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Graph Execution Algorithm

```
Algorithm: executeWorkflowGraph(workflowId, triggerData)

1. LOAD workflow and latest version (nodes, edges)
2. CREATE execution record (status: 'running')
3. FIND trigger node(s) — nodes with no incoming edges
4. INITIALIZE execution context: { variables: {}, stepOutputs: {} }

5. TRAVERSE graph using async BFS:
   queue = [triggerNodes]

   while queue is not empty:
     batch = queue.drain()     // Get all current-level nodes

     for each node in batch (parallel where possible):
       a. EVALUATE incoming edge conditions
       b. If conditions not met → SKIP node, mark 'skipped'
       c. CREATE step_execution record (status: 'running')

       d. EXECUTE node based on type:
          - Action nodes: execute side effect (send email, create task, etc.)
          - Flow control: evaluate condition, determine next path
          - AI nodes: call AI Gateway, store response
          - Data nodes: transform/compute data
          - Approval nodes: PAUSE execution, create approval record
          - Loop nodes: iterate with max_iterations guard
          - Parallel nodes: spawn branches, await join strategy
          - Try/catch: wrap in error handler with retry logic
          - Sub-workflow: recursive executeWorkflowGraph()

       e. STORE step output in execution context
       f. UPDATE step_execution (status: 'completed', output)
       g. FIND outgoing edges → add target nodes to queue

6. When all nodes processed:
   UPDATE execution (status: 'completed', completedAt: now())

Special Cases:
  - APPROVAL NODE: execution pauses (status: 'paused'), resumes on processApproval()
  - LOOP NODE: creates child step_executions per iteration, max 1000
  - PARALLEL NODE: Promise.all() or Promise.race() based on join strategy
  - TRY/CATCH: on failure, retry with exponential backoff, then execute catch branch
  - ERROR: execution fails (status: 'failed', error: message)
```

### Time Tracking Module

The Time Tracking module provides granular time tracking with live timers, billing support, and approval workflows.

```
┌──────────────────────────────────────────────────────────────┐
│                   TIME TRACKING MODULE                        │
│                                                              │
│  Timer Lifecycle:                                            │
│                                                              │
│  startTimer(taskId)                                          │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────┐                                │
│  │  Running Time Entry     │                                │
│  │  isRunning: true        │    Constraint:                 │
│  │  startedAt: now()       │    ONE running timer           │
│  │  endedAt: null          │    per user at a time          │
│  │  durationMinutes: 0     │                                │
│  └────────────┬────────────┘                                │
│               │                                              │
│          stopTimer(id)                                       │
│               │                                              │
│               ▼                                              │
│  ┌─────────────────────────┐                                │
│  │  Completed Time Entry   │                                │
│  │  isRunning: false       │                                │
│  │  endedAt: now()         │                                │
│  │  durationMinutes: calc  │─── Updates task.timeSpentMinutes│
│  └────────────┬────────────┘    (aggregated from all entries)│
│               │                                              │
│          approve(ids)    (optional, if TIME_ENTRY_APPROVAL)  │
│               │                                              │
│               ▼                                              │
│  ┌─────────────────────────┐                                │
│  │  Approved Time Entry    │                                │
│  │  isApproved: true       │                                │
│  │  approvedById: userId   │                                │
│  │  approvedAt: timestamp  │                                │
│  └─────────────────────────┘                                │
│                                                              │
│  Timesheet Aggregation:                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  SELECT task_id, SUM(duration_minutes) as total,    │    │
│  │         SUM(CASE WHEN is_billable THEN              │    │
│  │           duration_minutes ELSE 0 END) as billable  │    │
│  │  FROM time_entries                                   │    │
│  │  WHERE started_at BETWEEN :start AND :end           │    │
│  │    AND user_id = :userId                             │    │
│  │  GROUP BY task_id                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Entry Sources:                                              │
│  manual | timer | import | api | agent | integration        │
│                                                              │
│  Database: time_entries — 19 columns, 7 indexes             │
└──────────────────────────────────────────────────────────────┘
```

### Document Editor Module

The Document Editor module provides a block-based live editor combining Notion-like editing with PandaDoc-style automation.

#### Document Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                      DOCUMENT EDITOR MODULE                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                documentEditorRouter (40+ procedures)        │     │
│  │                                                            │     │
│  │  Documents:  create · get · update · delete · list         │     │
│  │  Blocks:     add · update · remove · move · duplicate      │     │
│  │  Versions:   save · history · restore                      │     │
│  │  Collab:     lock · unlock · forceLock · addCollab · rm    │     │
│  │  Variables:  resolve (CRM merge fields)                    │     │
│  │  Publish:    submit → approve → publish → archive          │     │
│  │  Templates:  create · get · update · delete · list · clone │     │
│  │  AI:         suggest · expand · translate · tone · prompt  │     │
│  │  Assets:     create · get · update · delete · list · search│     │
│  │  Comments:   create · update · delete · resolve · list     │     │
│  └───────────────────────────┬────────────────────────────────┘     │
│                              │                                       │
│  ┌───────────────────────────┼────────────────────────────────┐     │
│  │                    Service Layer                            │     │
│  │                                                            │     │
│  │  ┌─────────────────┐  ┌─────────────────┐                │     │
│  │  │DocumentService  │  │TemplateService  │                │     │
│  │  │                  │  │                  │                │     │
│  │  │ Block CRUD      │  │ CRUD            │                │     │
│  │  │ Version history │  │ Clone from tmpl │                │     │
│  │  │ Lock management │  │ Marketplace     │                │     │
│  │  │ Variable resolve│  │ Convert doc→tmpl│                │     │
│  │  │ Publish flow    │  │                  │                │     │
│  │  └─────────────────┘  └─────────────────┘                │     │
│  │                                                            │     │
│  │  ┌─────────────────┐  ┌─────────────────┐                │     │
│  │  │AiContentService │  │  AssetService   │                │     │
│  │  │                  │  │                  │                │     │
│  │  │ Generate suggest│  │ CRUD            │                │     │
│  │  │ Expand content  │  │ Tag search      │                │     │
│  │  │ Translate block │  │ Usage tracking  │                │     │
│  │  │ Adjust tone     │  │                  │                │     │
│  │  │ Prompt generate │  │                  │                │     │
│  │  └─────────────────┘  └─────────────────┘                │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  Document Block Architecture:                                        │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  Document                                                  │     │
│  │  ├── blocks: DocumentBlock[] (JSONB)                      │     │
│  │  │   ├── { id, type: 'heading', content, properties,     │     │
│  │  │   │     styles, animation?, visibility?, sortOrder }   │     │
│  │  │   ├── { id, type: 'paragraph', ... }                  │     │
│  │  │   ├── { id, type: 'pricing_table', ... }              │     │
│  │  │   ├── { id, type: 'columns', children: [...], ... }   │     │
│  │  │   └── { id, type: 'signature_block', ... }            │     │
│  │  │                                                        │     │
│  │  ├── variables: Record<string, unknown> (resolved values) │     │
│  │  ├── collaborators: DocumentCollaborator[]                │     │
│  │  └── lockedBy / lockedAt (pessimistic locking)           │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  Block Types (24):                                                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ TEXT       │ │ MEDIA      │ │ DATA       │ │INTERACTIVE │      │
│  │ heading   │ │ image      │ │ table      │ │ checklist  │      │
│  │ paragraph │ │ video      │ │ pricing_tb │ │ button     │      │
│  │ quote     │ │ embed      │ │ compare_tb │ │ signature  │      │
│  │ callout   │ │            │ │ payment_sc │ │ faq        │      │
│  │ code      │ │            │ │ product_cd │ │ terms      │      │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                     │
│  │ LAYOUT     │ │ CONTENT    │ │ DYNAMIC    │                     │
│  │ columns   │ │ testimonial│ │ variable   │                     │
│  │ spacer    │ │ timeline   │ │            │                     │
│  │ divider   │ │            │ │            │                     │
│  └────────────┘ └────────────┘ └────────────┘                     │
│                                                                      │
│  Document Lifecycle:                                                 │
│  ┌───────┐  submit  ┌────────┐  approve  ┌──────────┐              │
│  │ draft │────────>│ review │────────>│ approved │              │
│  └───────┘         └────┬───┘          └─────┬────┘              │
│      │                  │ reject              │ publish           │
│      │                  └──→ draft            ▼                   │
│      │                                 ┌───────────┐              │
│      │                                 │ published │              │
│      │                                 └─────┬─────┘              │
│      └─────────────────────────────────────→ archive              │
│                                               ▼                   │
│                                         ┌──────────┐              │
│                                         │ archived │              │
│                                         └──────────┘              │
│                                                                      │
│  Database: 6 tables                                                  │
│  documents (17 col, 6 idx)  document_templates (14 col, 5 idx)      │
│  document_versions (6 col, 2 idx)  document_comments (10 col, 4 idx)│
│  document_assets (9 col, 2 idx)  ai_content_suggestions (9 col,3 idx)│
└──────────────────────────────────────────────────────────────────────┘
```

### Assets Module

The Assets module provides reusable content components that can be inserted into documents. It's part of the Document Editor's tRPC router but conceptually distinct.

```
┌──────────────────────────────────────────────────────────────┐
│                      ASSETS MODULE                           │
│                                                              │
│  Asset Types:                                                │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│  │ text_snippet  │ │ clause        │ │ pricing_table │    │
│  │               │ │               │ │               │    │
│  │ Reusable text │ │ Legal clauses │ │ Product/service│    │
│  │ blocks for    │ │ NDA, terms,   │ │ pricing with  │    │
│  │ documents     │ │ indemnity     │ │ tiers         │    │
│  └───────────────┘ └───────────────┘ └───────────────┘    │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│  │ signature     │ │ header/footer │ │ image/logo    │    │
│  │               │ │               │ │               │    │
│  │ E-signature   │ │ Branded doc   │ │ Brand images  │    │
│  │ capture areas │ │ headers and   │ │ and logos for │    │
│  │               │ │ footers       │ │ documents     │    │
│  └───────────────┘ └───────────────┘ └───────────────┘    │
│                                                              │
│  Features:                                                   │
│  ├── Tag-based search for quick asset discovery             │
│  ├── Usage count tracking for popularity metrics            │
│  ├── JSONB content storage (flexible per-type schema)       │
│  └── Venture-scoped isolation                               │
│                                                              │
│  Database: document_assets — 9 columns, 2 indexes           │
└──────────────────────────────────────────────────────────────┘
```

### Calendar Module (Planned)

The Calendar module is planned for implementation in Phase 1–2. It will provide scheduling, availability, and recurring event management.

```
┌──────────────────────────────────────────────────────────────┐
│                   CALENDAR MODULE (PLANNED)                   │
│                                                              │
│  Planned Features:                                           │
│  ├── Event CRUD (createEvent, updateEvent, deleteEvent)     │
│  ├── Availability checking (getAvailability for user/team)  │
│  ├── Recurring events (RRULE support: daily, weekly, etc.)  │
│  ├── Reminders (configurable notification timing)           │
│  ├── Task-to-event linking (task due dates as events)       │
│  ├── Sprint milestone events (auto-generated)               │
│  ├── External sync (Google Calendar, Outlook)               │
│  └── Views: day, week, month, agenda                        │
│                                                              │
│  Planned Tables:                                             │
│  ├── calendar_events (id, venture_id, user_id, title,      │
│  │   start_time, end_time, recurrence_rule, task_id, etc.) │
│  ├── calendar_attendees (event_id, user_id, status)        │
│  └── calendar_reminders (event_id, minutes_before, type)   │
│                                                              │
│  Integration Points:                                         │
│  ├── Tasks: task due dates surface as calendar events       │
│  ├── Sprints: sprint start/end dates as milestone events    │
│  ├── Workflows: calendar triggers (event_approaching, etc.) │
│  └── @mcv/shared: notification delivery for reminders       │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Models (Drizzle ORM)

### Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ENTITY RELATIONSHIP MAP                               │
│                                                                              │
│  ventures ─────< projects ──< tasks ──<── task_assignments                  │
│             │       │          │  ───<── task_activities                     │
│             │       │          │  ───<── task_dependencies                   │
│             │       │          │  ───<── task_comments                       │
│             │       │          │  ───<── task_history                        │
│             │       │          │  ───<── time_entries                        │
│             │       │          │                                              │
│             │       │          └──── tasks (parent_id → self)                │
│             │       │                                                        │
│             │       └──< sprints ──< tasks (sprint_id)                      │
│             │                                                                │
│             ├──< workflows ──< workflow_versions                            │
│             │       │   ───< workflow_executions ──< workflow_step_executions│
│             │       │                    ───< workflow_approvals             │
│             │       └──< workflow_templates                                  │
│             │                                                                │
│             ├──< documents ──< document_versions                            │
│             │       │   ───< document_comments (threaded: parent_comment_id)│
│             │       │   ───< ai_content_suggestions                         │
│             │                                                                │
│             ├──< document_templates ──< documents (template_id)             │
│             │                                                                │
│             ├──< document_assets                                             │
│             │                                                                │
│             └──< task_templates                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Complete Table Catalog

#### tasks (50+ columns, 18 indexes)

The central work item table. Each row represents a single unit of work.

```typescript
// Drizzle schema definition (simplified)
export const tasks = pgTable('tasks', {
  // Identity
  id:            uuid('id').primaryKey().defaultRandom(),
  projectId:     uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  parentId:      uuid('parent_id').references(() => tasks.id, { onDelete: 'set null' }),
  title:         varchar('title', { length: 500 }).notNull(),
  description:   text('description'),

  // Workflow state
  status:        varchar('status', { length: 50 }).notNull().default('todo'),
  priority:      varchar('priority', { length: 20 }).default('medium'),
  type:          varchar('type', { length: 30 }).default('task'),

  // Assignment
  assigneeId:    uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  reporterId:    uuid('reporter_id').references(() => users.id),

  // Estimation
  storyPoints:   integer('story_points'),
  timeEstimateMinutes: integer('time_estimate_minutes'),
  timeSpentMinutes:    integer('time_spent_minutes').notNull().default(0),

  // Timeline
  startDate:     date('start_date'),
  dueDate:       date('due_date'),
  startedAt:     timestamp('started_at'),
  completedAt:   timestamp('completed_at'),
  statusChangedAt: timestamp('status_changed_at').notNull().defaultNow(),
  slaDeadline:   timestamp('sla_deadline'),
  slaBreached:   boolean('sla_breached').notNull().default(false),

  // Agentic fields
  ownerType:     varchar('owner_type', { length: 30 }).notNull().default('human_only'),
  taskTier:      varchar('task_tier', { length: 5 }).notNull().default('T2'),
  ventureId:     uuid('venture_id'),
  ventureScope:  varchar('venture_scope', { length: 20 }).notNull().default('venture'),
  crossVentureIds: jsonb('cross_venture_ids').notNull().default([]),
  department:    varchar('department', { length: 50 }),

  // Sprint & milestone
  sprintId:      uuid('sprint_id').references(() => sprints.id),
  milestoneId:   uuid('milestone_id'),

  // Priority scoring
  priorityScore: integer('priority_score').notNull().default(50),
  aiPriorityScore: integer('ai_priority_score'),
  urgencyScore:  integer('urgency_score').notNull().default(50),
  impactScore:   integer('impact_score').notNull().default(50),

  // Metadata
  position:      integer('position').notNull().default(0),
  tags:          jsonb('tags').notNull().default([]),
  labels:        jsonb('labels').notNull().default([]),
  customFields:  jsonb('custom_fields').notNull().default({}),
  source:        varchar('source', { length: 30 }).notNull().default('manual'),
  sourceReference: jsonb('source_reference'),
  acceptanceCriteria: jsonb('acceptance_criteria').notNull().default([]),
  aiMetadata:    jsonb('ai_metadata').notNull().default({}),

  // Audit
  createdBy:     uuid('created_by'),
  updatedBy:     uuid('updated_by'),
  version:       integer('version').notNull().default(1),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  updatedAt:     timestamp('updated_at').notNull().defaultNow(),
});
```

**Indexes (18):**
```
idx_tasks_project_id           ON (project_id)
idx_tasks_parent_id            ON (parent_id)
idx_tasks_status               ON (status)
idx_tasks_assignee_id          ON (assignee_id)
idx_tasks_reporter_id          ON (reporter_id)
idx_tasks_type                 ON (type)
idx_tasks_priority             ON (priority)
idx_tasks_project_status       ON (project_id, status)
idx_tasks_project_assignee     ON (project_id, assignee_id)
idx_tasks_project_type         ON (project_id, type)
idx_tasks_project_position     ON (project_id, position)
idx_tasks_due_date             ON (due_date)
idx_tasks_owner_type           ON (owner_type)
idx_tasks_venture_id           ON (venture_id)
idx_tasks_venture_status       ON (venture_id, status)
idx_tasks_sprint_id            ON (sprint_id)
idx_tasks_department           ON (department)
idx_tasks_labels               ON (labels) -- GIN index on JSONB
```

#### task_assignments (22 columns, 6 indexes)

Polymorphic assignment table supporting 6 assignee types.

```
Primary columns: id, taskId, assigneeType, userId, teamId, agentId,
  agentPoolId, workflowId, externalReference, role, status,
  allocationPercent, workloadUnits, assignedAt, acceptedAt,
  startedAt, completedAt, dueDate, agentSessionId,
  agentAutonomyLevel, hitlRequired, assignmentReason,
  assignmentMetadata, assignedBy, createdAt, updatedAt

Indexes: task_id, user_id, agent_id, role, status, (task_id, role)
```

#### task_activities (14 columns, 6 indexes)

Comprehensive activity log with 41 activity types and polymorphic actor support.

```
Primary columns: id, taskId, activityType, actorType, userId, agentId,
  summary, details, previousValue, newValue, ventureId, sessionId,
  isInternal, isVisibleToAgents, createdAt

Indexes: (task_id, created_at), activity_type, user_id, agent_id,
  venture_id, session_id
```

#### task_dependencies (5 columns, 1 unique constraint)

Dependency relationships between tasks with cycle detection.

```
Columns: id, taskId, dependsOnId, type, lagDays, createdAt
Unique: (task_id, depends_on_id)
Check: task_id != depends_on_id (no self-dependencies)
```

#### workflows (13 columns, 6 indexes)

V1 workflow definitions with trigger → condition → action chains.

```
Primary columns: id, ventureId, name, description, triggerType,
  triggerConditions, actions, isActive, runCount, lastRunAt,
  createdBy, createdAt, updatedAt

Indexes: venture_id, trigger_type, is_active, (venture_id, is_active),
  (venture_id, trigger_type), created_by
```

#### workflow_executions (14 columns, 7 indexes)

Execution records for V2 graph-based workflow runs.

```
Primary columns: id, workflowId, versionId, triggerId, triggerData,
  status, startedAt, completedAt, error, contactId, ventureId,
  parentExecutionId, variables, isTest, createdAt

Indexes: workflow_id, status, venture_id, contact_id, parent_execution_id,
  started_at, (workflow_id, status)
```

#### documents (17 columns, 6 indexes)

Block-based document storage with collaboration and versioning.

```
Primary columns: id, ventureId, templateId, parentType, parentId,
  title, status, blocks (JSONB), variables (JSONB),
  collaborators (JSONB), lockedBy, lockedAt, version,
  publishedVersion, publishedAt, metadata, createdBy,
  createdAt, updatedAt

Indexes: venture_id, template_id, (venture_id, status),
  (parent_type, parent_id), locked_by, created_at
```

### Complete Index Map (100+ Indexes)

| Table | Count | Key Patterns |
|-------|-------|--------------|
| `tasks` | 18 | Project filter, status, assignee, type, position, sprint, venture |
| `projects` | 6 | Venture, owner, parent, status, composite |
| `sprints` | 5 | Venture, status, team, date range |
| `task_assignments` | 6 | Task, user, agent, role, status |
| `task_activities` | 6 | Task+time, type, user, agent, venture, session |
| `task_dependencies` | 1 | Unique (task, depends_on) |
| `task_templates` | 5 | Venture, category, scope, active, creator |
| `workflows` | 6 | Venture, trigger, active, composite |
| `workflow_versions` | 2 | Workflow, workflow+version |
| `workflow_executions` | 7 | Workflow, status, venture, contact, parent, time, composite |
| `workflow_step_executions` | 3 | Execution, execution+node, status |
| `workflow_approvals` | 4 | Step, workflow, status, expires |
| `workflow_templates` | 4 | Venture, category, public, author |
| `time_entries` | 7 | Task, user, project, time, billable, running, agent |
| `documents` | 6 | Venture, template, venture+status, parent, lock, time |
| `document_templates` | 5 | Venture, venture+slug, venture+category, public, system |
| `document_versions` | 2 | Document, document+version |
| `document_comments` | 4 | Document, document+block, user, parent |
| `document_assets` | 2 | Venture, venture+type |
| `ai_content_suggestions` | 3 | Document, document+block, status |
| **TOTAL** | **100+** | |

---

## Data Flow & Events

### Request Flow

```
Client Request
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│  tRPC Router                                                 │
│  1. Parse input with Zod schema                             │
│  2. Verify authentication (protectedProcedure)              │
│  3. Verify venture membership (ventureProcedure)            │
│  4. Verify admin role if needed (adminProcedure)            │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Service Layer                                               │
│  1. Verify ownership (venture → project → task chain)       │
│  2. Execute business logic                                   │
│  3. Perform database operations via Drizzle                 │
│  4. Emit audit event via AuditService.log()                 │
│  5. Return typed response                                    │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Database Layer                                              │
│  1. RLS policy check (venture_id = current_venture)         │
│  2. Execute query with Drizzle-generated SQL                │
│  3. Return typed results                                     │
└──────────────────────────────────────────────────────────────┘
```

### Audit Event Flow

Every mutation in the Operations domain emits structured audit events:

```
Mutation (create/update/delete)
     │
     ▼
AuditService.log({
  action: 'tasks.created',
  userId: ctx.session.userId,
  ventureId: ctx.ventureId,
  ipAddress: ctx.ip,
  metadata: { taskTitle, projectId }
})
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│  Downstream Consumers                                        │
│                                                              │
│  ├── @mcv/analytics — Dashboard metrics, reports            │
│  ├── @mcv/shared/events — Event bus for cross-domain        │
│  ├── Workflow triggers — CRM/task events trigger workflows  │
│  └── Compliance — Audit trail for regulatory requirements   │
└──────────────────────────────────────────────────────────────┘
```

### Event Catalog (40+ Events)

| Category | Events | Description |
|----------|--------|-------------|
| **Tasks** | `tasks.created`, `tasks.updated`, `tasks.deleted` | Core task lifecycle |
| **Projects** | `projects.created`, `projects.updated`, `projects.archived`, `projects.deleted` | Project lifecycle |
| **Workflows (V1)** | `workflows.created`, `workflows.updated`, `workflows.deleted`, `workflows.activated`, `workflows.deactivated`, `workflows.tested` | V1 workflow management |
| **Workflows (V2)** | `workflows.version_created`, `workflows.version_rollback`, `workflows.execution_started`, `workflows.execution_resumed`, `workflows.execution_cancelled`, `workflows.execution_retried`, `workflows.step_replayed`, `workflows.v2_tested` | V2 graph execution |
| **Approvals** | `workflows.approval_approved`, `workflows.approval_rejected`, `workflows.approval_timeouts_checked` | Approval decisions |
| **Templates** | `workflows.template_created`, `workflows.template_updated`, `workflows.template_deleted`, `workflows.template_instantiated` | Workflow templates |

### Workflow Trigger Event Flow

```
External Event (task_created, contact_created, etc.)
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│  Workflow Trigger Matching                                    │
│                                                              │
│  1. Query active workflows with matching triggerType          │
│  2. For each matching workflow:                               │
│     a. Evaluate triggerConditions against event data          │
│     b. If conditions match:                                   │
│        - V1: Execute action chain sequentially               │
│        - V2: Start graph execution (executeV2)               │
│     c. Increment runCount, update lastRunAt                  │
│  3. Emit audit event for execution                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### Operations ↔ Intelligence (@mcv/kernel, Tier 4)

```
┌────────────────────────────────────────────────────────────┐
│  AI INTEGRATION POINTS                                      │
│                                                             │
│  Document Editor → AI Gateway:                              │
│  ├── generateSuggestion(blockContent) → rewritten content  │
│  ├── expandContent(brief) → expanded content               │
│  ├── translateBlock(content, lang) → translated content    │
│  ├── adjustTone(content, tone) → toned content             │
│  └── generateFromPrompt(prompt) → generated content        │
│                                                             │
│  Workflow V2 → AI Gateway:                                  │
│  ├── ai_prompt(template, variables) → AI response          │
│  ├── ai_classify(data, categories) → classification        │
│  ├── ai_extract(data, schema) → structured extraction      │
│  ├── ai_summarize(content) → summary                       │
│  └── rag_search(query) → knowledge results                 │
│                                                             │
│  Tasks → AI:                                                │
│  ├── aiPriorityScore computation                           │
│  └── AI-generated task descriptions (planned)              │
└────────────────────────────────────────────────────────────┘
```

### Operations ↔ CRM (@mcv/crm, Tier 5)

```
┌────────────────────────────────────────────────────────────┐
│  CRM INTEGRATION POINTS                                     │
│                                                             │
│  Document Variables → CRM Data:                             │
│  resolveVariables({                                         │
│    'contact.firstName': → Contact.firstName,               │
│    'contact.company':   → Contact.company,                 │
│    'deal.value':        → Deal.value,                      │
│    'invoice.total':     → Invoice.total,                   │
│  })                                                         │
│                                                             │
│  CRM Events → Workflow Triggers:                            │
│  ├── trigger_contact_created                                │
│  ├── trigger_contact_updated                                │
│  ├── trigger_deal_stage_changed                             │
│  ├── trigger_deal_won                                       │
│  └── trigger_deal_lost                                      │
│                                                             │
│  Workflow Actions → CRM Mutations:                          │
│  ├── create_contact                                         │
│  ├── update_contact                                         │
│  ├── add_tag / remove_tag                                   │
│  ├── create_deal                                            │
│  ├── update_deal_stage                                      │
│  └── add_note                                               │
└────────────────────────────────────────────────────────────┘
```

### Operations ↔ Identity (@mcv/identity, Tier 3)

```
┌────────────────────────────────────────────────────────────┐
│  IDENTITY INTEGRATION POINTS                                │
│                                                             │
│  Authentication:                                            │
│  ├── Session validation on every tRPC call                 │
│  ├── User identity for assignee, reporter, commenter FKs  │
│  └── Service role for server-side RLS bypass               │
│                                                             │
│  Authorization:                                             │
│  ├── protectedProcedure → any authenticated user           │
│  ├── ventureProcedure → authenticated + venture member     │
│  └── adminProcedure → authenticated + admin role           │
│                                                             │
│  Venture Context:                                           │
│  ├── app.current_venture_id → RLS policy enforcement       │
│  └── ventureId → service constructor parameter             │
└────────────────────────────────────────────────────────────┘
```

### Operations ↔ Shared (@mcv/shared, Tier 2)

```
┌────────────────────────────────────────────────────────────┐
│  SHARED INTEGRATION POINTS                                  │
│                                                             │
│  Notifications (via workflow actions):                       │
│  ├── send_notification → email, in-app, push               │
│  ├── send_email → email templates                           │
│  ├── send_sms → SMS delivery                                │
│  └── send_whatsapp → WhatsApp messaging                    │
│                                                             │
│  Event Bus:                                                 │
│  ├── AuditService.log() → structured audit events          │
│  └── Task/workflow events → cross-domain subscribers       │
│                                                             │
│  Utilities:                                                 │
│  ├── Date math for SLA calculations                        │
│  ├── Zod schema helpers                                     │
│  └── Common validation patterns                             │
└────────────────────────────────────────────────────────────┘
```

### Operations ↔ Fabric (@mcv/fabric, Tier 3)

```
┌────────────────────────────────────────────────────────────┐
│  FABRIC INTEGRATION POINTS                                  │
│                                                             │
│  Database:                                                  │
│  ├── Supabase PostgreSQL connection                        │
│  ├── RLS policy enforcement via service role               │
│  └── Drizzle ORM query execution                           │
│                                                             │
│  Storage (planned):                                         │
│  ├── Document asset file storage (images, logos)           │
│  └── Attachment storage for tasks                          │
│                                                             │
│  Realtime (planned):                                        │
│  ├── Live document collaboration via WebSocket             │
│  ├── Real-time task board updates                          │
│  └── Timer state synchronization                           │
└────────────────────────────────────────────────────────────┘
```

---

## Performance

### Query Optimization Strategies

#### Task Listing (Most Common Query)

```sql
-- Optimized by composite index: (project_id, status)
SELECT t.*, ta.user_id as assignee_name
FROM tasks t
LEFT JOIN task_assignments ta ON ta.task_id = t.id AND ta.role = 'assignee'
WHERE t.project_id = $1
  AND t.status = $2
ORDER BY t.position ASC
LIMIT 50 OFFSET 0;

-- Target: <50ms for 10K+ task projects
-- Index: idx_tasks_project_status ON (project_id, status)
```

#### Dependency Cycle Detection

```
Algorithm complexity: O(V + E)
Where: V = number of tasks in project, E = number of dependencies
Typical: V=100, E=200 → <5ms
Maximum: V=10000, E=20000 → <100ms
Strategy: BFS with visited set, no re-scanning
```

#### Bulk Status Updates

```sql
-- Single UPDATE for N tasks (vs N individual updates)
UPDATE tasks
SET status = $1, status_changed_at = NOW(), updated_at = NOW()
WHERE id = ANY($2::uuid[])
  AND project_id = $3;

-- Batch insert activity records
INSERT INTO task_activities (task_id, activity_type, ...)
SELECT unnest($1::uuid[]), 'status_change', ...;
```

#### Time Entry Aggregation

```sql
-- Push aggregation to DB, update task atomically
UPDATE tasks
SET time_spent_minutes = (
  SELECT COALESCE(SUM(duration_minutes), 0)
  FROM time_entries
  WHERE task_id = $1 AND is_running = false
)
WHERE id = $1;

-- Target: <20ms
-- Index: idx_time_entries_task_id ON (task_id)
```

### Workflow Execution Performance

| Feature | Strategy | Performance |
|---------|----------|-------------|
| Parallel branches | `Promise.all()` for concurrent node execution | Branches execute simultaneously |
| Loop execution | Iteration counter with hard limit (1000) | O(n) where n = iterations |
| Try/catch retry | Exponential backoff: 1s → 2s → 4s | 3 retries = 7s total wait |
| Sub-workflows | Recursive execution with shared context | Adds ~50ms per sub-workflow |
| Condition evaluation | In-memory evaluation, no DB queries | <1ms per condition group |
| Variable resolution | String template interpolation with caching | <1ms per variable |

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHING ARCHITECTURE                       │
│                                                             │
│  Hot Path (No Cache):                                       │
│  ├── Active timer queries (real-time accuracy required)    │
│  ├── Document lock checks (consistency required)           │
│  └── Approval status checks (time-sensitive)               │
│                                                             │
│  Application Cache (30s–10m TTL):                           │
│  ├── Task list queries (30s, invalidate on mutation)       │
│  ├── Project hierarchy (5m, invalidate on project change)  │
│  ├── Sprint metrics (1m, invalidate on task status change) │
│  ├── Dependency graph (1m, invalidate on dep change)       │
│  ├── Workflow templates (10m, invalidate on mutation)       │
│  └── Document templates (10m, invalidate on mutation)       │
│                                                             │
│  CDN Cache (1h+):                                           │
│  └── Public templates (1h, manual purge)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Scalability

### Horizontal Scaling Considerations

| Component | Scaling Strategy | Bottleneck |
|-----------|-----------------|------------|
| Task queries | Read replicas for list queries | Write throughput on single primary |
| Workflow execution | Stateless engine, can scale workers | Database write contention |
| Document editing | Lock-based (single editor at a time) | Pessimistic locking limits concurrency |
| Time tracking | Low write volume, scales naturally | Timer constraint (1 per user) |
| Audit logging | Async event emission, buffered writes | Event bus throughput |

### Recommended Limits & Scaling Thresholds

| Metric | Comfortable Range | Warning | Action Required |
|--------|-------------------|---------|-----------------|
| Tasks per venture | <100K | 100K–500K | Add read replicas |
| Tasks per project | <10K | 10K–50K | Partition or archive |
| Concurrent workflow executions | <100 | 100–500 | Add worker instances |
| Active timers globally | <10K | 10K–50K | Timer service scale-out |
| Documents per venture | <50K | 50K–200K | Archive old documents |
| Blocks per document | <500 | 500–1000 | Split into sub-documents |

### Partitioning Strategy (Future)

```
Phase 1 (Current): Single PostgreSQL database with RLS
Phase 2 (10K+ users): Read replicas for query scaling
Phase 3 (100K+ users): Table partitioning by venture_id
Phase 4 (1M+ users): Sharding by venture with routing layer
```

---

## Error Handling

### Error Classification

```
┌──────────────────────────────────────────────────────────────┐
│                     ERROR HANDLING ARCHITECTURE               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Layer 1: Input Validation (Zod)                      │   │
│  │  - Invalid field types → BAD_REQUEST                  │   │
│  │  - Missing required fields → BAD_REQUEST              │   │
│  │  - Value out of range → BAD_REQUEST                   │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┼─────────────────────────────┐   │
│  │  Layer 2: Business Logic (Service)                    │   │
│  │  - Self-dependency → BAD_REQUEST                      │   │
│  │  - Cyclic dependency → BAD_REQUEST                    │   │
│  │  - Running timer exists → CONFLICT                    │   │
│  │  - Invalid status transition → BAD_REQUEST            │   │
│  │  - Resource not found → NOT_FOUND                     │   │
│  │  - Not in venture → NOT_FOUND                         │   │
│  │  - Comment not owned → FORBIDDEN                      │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┼─────────────────────────────┐   │
│  │  Layer 3: Database (Drizzle/PostgreSQL)               │   │
│  │  - Unique constraint → CONFLICT                       │   │
│  │  - FK constraint → BAD_REQUEST                        │   │
│  │  - RLS denied → NOT_FOUND (invisible to user)        │   │
│  │  - Connection failure → INTERNAL_SERVER_ERROR         │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┼─────────────────────────────┐   │
│  │  Layer 4: Infrastructure                              │   │
│  │  - Database unavailable → INTERNAL_SERVER_ERROR       │   │
│  │  - AI Gateway timeout → INTERNAL_SERVER_ERROR         │   │
│  │  - Notification failure → logged, non-blocking        │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Domain-Specific Error Messages

| Error | Context | HTTP | Recovery |
|-------|---------|------|----------|
| `"Task not found"` | Task CRUD | 404 | Verify task ID and venture |
| `"Project not found in this venture"` | Task creation | 404 | Verify project is in current venture |
| `"Parent task not found in this project"` | Subtask creation | 404 | Parent must be in same project |
| `"A task cannot depend on itself"` | Add dependency | 400 | Use different task IDs |
| `"Adding this dependency would create a circular dependency"` | Add dependency | 400 | Remove conflicting dependency first |
| `"This dependency already exists"` | Add dependency | 409 | Dependency already created |
| `"You already have a running timer. Please stop it first."` | Start timer | 409 | Stop existing timer |
| `"Timer not found"` | Stop timer | 404 | Verify timer ID |
| `"Timer is not running"` | Stop timer | 400 | Timer already stopped |
| `"Document not found"` | Document CRUD | 404 | Verify document ID and venture |
| `"Execution is {status}, not paused"` | Resume execution | 400 | Can only resume paused executions |
| `"Database not available"` | Any operation | 500 | Check database connectivity |

### Workflow Execution Error Handling

```
Workflow Step Execution:
  ┌─────────┐
  │ Execute │
  │  Step   │
  └────┬────┘
       │
  ┌────┴────┐
  │ Success?│
  └────┬────┘
     ┌─┴─┐
    Yes   No
     │     │
     │  ┌──┴─────────────────────────────┐
     │  │ Retry Logic (if try/catch)     │
     │  │                                │
     │  │ Attempt 1: immediate          │
     │  │ Attempt 2: wait 1s (backoff)  │
     │  │ Attempt 3: wait 2s (backoff)  │
     │  │ Attempt 4: wait 4s (backoff)  │
     │  │                                │
     │  │ If all retries fail:           │
     │  │ → Execute catch branch         │
     │  │ → If no catch: fail execution  │
     │  └────────────────────────────────┘
     │
     ▼
  Continue to
  next nodes
```

---

## Observability

### Structured Logging

All operations emit structured log entries with consistent fields:

```typescript
{
  level: 'info' | 'warn' | 'error',
  domain: 'operations',
  module: 'tasks' | 'workflows' | 'time' | 'editor' | 'projects',
  action: 'create' | 'update' | 'delete' | 'execute' | ...,
  ventureId: string,
  userId: string,
  resourceId: string,
  duration: number,       // ms
  metadata: Record<string, unknown>
}
```

### Key Metrics

| Metric | Type | Source | Alert Threshold |
|--------|------|--------|-----------------|
| `ops.task.created` | Counter | Audit events | >1000/min (spike) |
| `ops.task.status_change` | Counter | Activity log | Normal |
| `ops.workflow.execution_duration_ms` | Histogram | Execution records | p95 >30s |
| `ops.workflow.failure_rate` | Rate | Execution status | >5%/hour |
| `ops.workflow.approval_timeout_rate` | Rate | Approval status | >10%/day |
| `ops.timer.active_count` | Gauge | Time entries | Informational |
| `ops.document.lock_age_seconds` | Gauge | Document records | >1800s (30min) |
| `ops.ai.suggestion_acceptance_rate` | Rate | Suggestion status | <10% (quality) |
| `ops.db.query_duration_ms` | Histogram | Query execution | p95 >500ms |

### Health Check Endpoints

| Check | Target | Frequency | Action on Failure |
|-------|--------|-----------|-------------------|
| Database connectivity | PostgreSQL | 30s | Alert + circuit breaker |
| Active timer consistency | `isRunning` entries | 5m | Log warning |
| Pending approval count | `status: 'pending'` | 5m | Notify approvers |
| Stale document locks | `lockedAt > 30min` | 30m | Auto-unlock |
| Expired AI suggestions | `status: 'pending', age > 7d` | Daily | Auto-expire |

### Execution Tracing

Workflow V2 provides full execution tracing for debugging:

```
Execution: exec_abc123
├── Step 1: trigger_contact_created (completed, 2ms)
│   └── Output: { contact: { firstName: 'Sarah', ... } }
├── Step 2: ai_classify (completed, 450ms)
│   └── Output: { category: 'hot', confidence: 0.92 }
├── Step 3: if_else (completed, 1ms)
│   └── Output: { branch: 'true' }
├── Step 4: send_email (completed, 230ms)
│   └── Output: { messageId: 'msg_xyz', status: 'sent' }
└── Step 5: create_deal (completed, 45ms)
    └── Output: { dealId: 'deal_123' }

Total Duration: 728ms
Status: completed
```

---

## Security

### Authentication & Authorization Flow

```
Client Request
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│  @mcv/identity — Authentication                              │
│  1. Validate session token (JWT or session cookie)           │
│  2. Extract userId, roles, ventureId                         │
│  3. Set PostgreSQL session: app.current_venture_id           │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  tRPC Procedure Guards                                       │
│                                                              │
│  protectedProcedure:                                         │
│    ✓ Valid session exists                                    │
│    ✓ User is authenticated                                   │
│                                                              │
│  ventureProcedure:                                           │
│    ✓ protectedProcedure checks                               │
│    ✓ User belongs to the specified venture                   │
│    ✓ Venture context is set in session                       │
│                                                              │
│  adminProcedure:                                             │
│    ✓ ventureProcedure checks                                 │
│    ✓ User has admin role in the venture                      │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Row-Level Security (Database Layer)                         │
│                                                              │
│  Every query is filtered by:                                 │
│  WHERE venture_id = current_setting('app.current_venture_id')│
│                                                              │
│  Service role bypasses RLS for server-side operations        │
└──────────────────────────────────────────────────────────────┘
```

### Data Protection

| Concern | Mitigation |
|---------|-----------|
| Cross-venture data leak | RLS policies + application-level venture scoping |
| Unauthorized workflow execution | adminProcedure guard on all execution endpoints |
| Concurrent document editing | Pessimistic locking with auto-expiry |
| Workflow infinite loops | Hard iteration limit (1000) + rate limiting |
| Approval bypass | Only adminProcedure can process approvals |
| Comment impersonation | protectedProcedure + ownership check on edit |
| Timer manipulation | One-timer-per-user constraint, server-side time calculation |
| AI content injection | Sanitized AI responses, confidence scoring |
| Test mode data leakage | `isTest` flag prevents all side effects |

### Input Validation

All API inputs are validated with Zod schemas at the router layer:

```typescript
// Example: task creation input validation
const createTaskInput = z.object({
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
  acceptanceCriteria: z.array(z.object({
    criterion: z.string().max(500),
    completed: z.boolean(),
  })).max(50).optional(),
});
```

---

*@mcv/operations — Operations Management Domain*
