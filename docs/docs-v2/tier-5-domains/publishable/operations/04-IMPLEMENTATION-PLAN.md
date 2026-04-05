# @mcv/operations — Implementation Plan

> **Package:** `@mcv/operations`
> **Classification:** PUBLISHABLE
> **Tier:** 5 — Domain Layer
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1 — Foundation](#phase-1--foundation)
4. [Phase 2 — Core Features](#phase-2--core-features)
5. [Phase 3 — Advanced Capabilities](#phase-3--advanced-capabilities)
6. [Phase 4 — Polish & Hardening](#phase-4--polish--hardening)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risks & Mitigations](#risks--mitigations)
10. [Timeline](#timeline)

---

## Overview

This implementation plan defines the phased delivery of `@mcv/operations`, the work management backbone of the MCV.ONE platform. The domain spans six submodules — Tasks, Projects, Sprints, Workflows, Time Tracking, and Document Editor (including Assets and Calendar) — representing the most feature-dense domain in the platform.

### Delivery Philosophy

- **Incremental Value:** Each phase delivers usable, tested functionality. No phase depends on "everything else" being complete.
- **Schema-First:** Database schemas and Drizzle ORM definitions are established first, then services, then routers, then UI.
- **Test-Driven:** Every service method and router endpoint has unit and integration tests before moving to the next phase.
- **AI-Native from Day One:** Agentic ownership models and AI integration points are designed into the schema from Phase 1, not bolted on later.

### Scope Summary

| Phase | Duration | Focus | Deliverables |
|-------|----------|-------|-------------|
| **Phase 1** | 4 weeks | Foundation | Task/project/sprint schemas, basic CRUD, calendar schema |
| **Phase 2** | 6 weeks | Core Features | Full task management, time tracking, asset management, basic workflows (V1) |
| **Phase 3** | 6 weeks | Advanced | Collaborative document editor, workflow V2 engine, AI-powered suggestions |
| **Phase 4** | 3 weeks | Polish | Performance optimization, comprehensive testing, documentation, deployment hardening |

**Total Estimated Duration:** 19 weeks

---

## Prerequisites

### Infrastructure Dependencies

Before Phase 1 can begin, the following must be in place:

| Dependency | Package | Status | Blocker? |
|------------|---------|--------|----------|
| PostgreSQL database with RLS support | `@mcv/fabric` | ✅ Available | No |
| Drizzle ORM configured for the monorepo | `@mcv/db` | ✅ Available | No |
| tRPC v11 router infrastructure | `packages/api` | ✅ Available | No |
| Authentication and session management | `@mcv/identity` | ✅ Available | No |
| Venture context and multi-tenant RLS | `@mcv/identity` | ✅ Available | No |
| Zod validation schemas (shared) | `@mcv/shared` | ✅ Available | No |
| AI Gateway for LLM calls | `@mcv/kernel` | ✅ Available | Phase 3 |
| Event bus / audit logging | `@mcv/shared` | ✅ Available | No |
| Notification delivery (email, SMS, push) | `@mcv/shared` | ⏳ Partial | Phase 2 (workflows) |
| CRM contact/deal data access | `@mcv/crm` | ⏳ Partial | Phase 3 (doc variables) |
| Realtime WebSocket subscriptions | `@mcv/fabric` | 🔲 Planned | Phase 3 (collaboration) |
| Redis caching layer | `@mcv/fabric` | ✅ Available | No |

### Development Environment

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 24.x | Runtime |
| TypeScript | 5.x | Type safety |
| Turborepo | Latest | Monorepo build orchestration |
| Drizzle Kit | Latest | Schema migrations |
| Vitest | Latest | Unit and integration testing |
| Playwright | Latest | E2E testing (Phase 4) |

### Team Requirements

| Role | Count | Phase Focus |
|------|-------|-------------|
| Backend Engineer | 2 | Schema, services, routers (all phases) |
| Frontend Engineer | 2 | Views, forms, real-time UI (Phase 2+) |
| AI/ML Engineer | 1 | AI content suggestions, task classification (Phase 3) |
| QA Engineer | 1 | Testing strategy, test automation (Phase 2+) |

---

## Phase 1 — Foundation

**Duration:** 4 weeks
**Goal:** Establish the database schema, core data models, and basic CRUD operations for Tasks, Projects, Sprints, and Calendar.

### Week 1–2: Schema & Core Tables

#### Task 1.1: Project Schema & Service

Create the `projects` table with venture-scoped RLS and basic CRUD.

**Deliverables:**
- [ ] `projects` Drizzle table definition (14 columns, 6 indexes)
- [ ] `ProjectService` class with venture-scoped constructor
- [ ] `projectRouter` with 8 procedures: `list`, `get`, `create`, `update`, `delete`, `hierarchy`, `stats`, `archive`
- [ ] RLS policies for venture isolation
- [ ] Zod input schemas for all procedures
- [ ] Unit tests for `ProjectService` (hierarchy tree, stats aggregation)
- [ ] Integration tests for `projectRouter` (auth guards, RLS enforcement)

**Estimated Effort:** 3 days

#### Task 1.2: Task Schema & Basic CRUD

Create the `tasks` table with all 50+ columns, the full status enum, and basic CRUD.

**Deliverables:**
- [ ] `tasks` Drizzle table definition (50+ columns, 18 indexes)
- [ ] All task enums and constants (`taskStatuses`, `taskPriorities`, `taskTypes`, `ownerTypes`, `taskTiers`, `taskSources`)
- [ ] `TaskService` class with venture-scoped constructor and project ownership verification
- [ ] `taskRouter` with basic procedures: `list`, `get`, `create`, `update`, `delete`, `updateStatus`, `bulkUpdateStatus`
- [ ] Zod input schemas with full validation
- [ ] Unit tests for `TaskService` (create, update, status transitions, venture scoping)
- [ ] Integration tests for `taskRouter`

**Estimated Effort:** 5 days

#### Task 1.3: Task Assignment Schema

Create the `task_assignments` table with polymorphic assignee support.

**Deliverables:**
- [ ] `task_assignments` Drizzle table definition (22 columns, 6 indexes)
- [ ] Assignment CRUD in `TaskService`
- [ ] All assignment enums (`assigneeTypes`, `assignmentRoles`, `assignmentStatuses`)
- [ ] Type definitions for `TaskAssignment`, `NewTaskAssignment`
- [ ] Unit tests for polymorphic assignment (user, team, agent, agent_pool)

**Estimated Effort:** 2 days

#### Task 1.4: Sprint Schema

Create the `sprints` table with lifecycle management.

**Deliverables:**
- [ ] `sprints` Drizzle table definition (18 columns, 5 indexes)
- [ ] Sprint status enum (`sprintStatuses`)
- [ ] Sprint CRUD operations (planned as part of task/project routers initially)
- [ ] Capacity and velocity field definitions
- [ ] Unit tests for sprint lifecycle transitions

**Estimated Effort:** 2 days

### Week 3–4: Dependencies, Activity Logging & Calendar

#### Task 1.5: Task Dependencies with Cycle Detection

Implement the dependency system with BFS cycle detection.

**Deliverables:**
- [ ] `task_dependencies` Drizzle table definition (5 columns, unique constraint, self-ref check)
- [ ] Dependency types enum (`dependencyTypes`)
- [ ] `addDependency` with BFS cycle detection algorithm
- [ ] `removeDependency`
- [ ] `getDependencyGraph` (project-wide graph for visualization)
- [ ] Router procedures: `task.addDependency`, `task.removeDependency`, `task.getDependencyGraph`
- [ ] Unit tests: cycle detection (simple cycle, transitive cycle, complex DAG), self-dependency rejection
- [ ] Performance test: 1000-node graph cycle detection under 100ms

**Estimated Effort:** 3 days

#### Task 1.6: Task Activity Logging

Implement the comprehensive activity log system.

**Deliverables:**
- [ ] `task_activities` Drizzle table definition (14 columns, 6 indexes)
- [ ] All 41 activity type enums
- [ ] Polymorphic actor support (`user`, `agent`, `system`, `workflow`)
- [ ] `logActivity()` method in `TaskService`
- [ ] Activity logging on all existing mutations (create, update, status change, assignment)
- [ ] Router procedures: `task.getHistory`, `task.addComment`, `task.getComments`
- [ ] Unit tests for activity logging

**Estimated Effort:** 3 days

#### Task 1.7: Task Templates

Implement task templates with default field values and checklist items.

**Deliverables:**
- [ ] `task_templates` Drizzle table definition (23 columns, 5 indexes)
- [ ] Template CRUD operations
- [ ] Template instantiation (create task from template with subtasks and checklists)
- [ ] Type definitions for `TaskTemplate`, `TemplateChecklistItem`, `TemplateFieldDefault`
- [ ] Unit tests for template instantiation

**Estimated Effort:** 2 days

#### Task 1.8: Calendar Schema (Foundation)

Design and create the calendar schema for scheduling and availability.

**Deliverables:**
- [ ] `calendar_events` Drizzle table definition (planned columns: id, ventureId, userId, title, description, startTime, endTime, allDay, recurrenceRule, taskId, projectId, sprintId, location, reminders, metadata, createdAt, updatedAt)
- [ ] `calendar_attendees` table (eventId, userId, status, responseTime)
- [ ] `calendar_reminders` table (eventId, minutesBefore, type)
- [ ] Basic calendar event CRUD in router
- [ ] Zod schemas for calendar inputs
- [ ] Unit tests for calendar event creation

**Estimated Effort:** 3 days

#### Task 1.9: Audit Service Integration

Wire all Phase 1 mutations into the audit event system.

**Deliverables:**
- [ ] `AuditService.log()` calls on all task, project, and sprint mutations
- [ ] Audit event catalog documentation for Phase 1 events
- [ ] Integration test verifying audit events are emitted

**Estimated Effort:** 1 day

### Phase 1 Exit Criteria

- [ ] All 8 database tables created and migrated (`projects`, `tasks`, `sprints`, `task_assignments`, `task_activities`, `task_dependencies`, `task_templates`, `calendar_events`)
- [ ] RLS policies active on all venture-scoped tables
- [ ] Task CRUD with full status lifecycle (17 states)
- [ ] Dependency graph with cycle detection
- [ ] Activity logging on all mutations
- [ ] >90% unit test coverage for services
- [ ] All tRPC procedures callable with proper auth guards
- [ ] Calendar schema in place with basic CRUD

---

## Phase 2 — Core Features

**Duration:** 6 weeks
**Goal:** Build out full task management (reordering, subtasks, Kanban support), time tracking with live timers, asset management, and V1 workflow automations.

### Week 5–6: Full Task Management

#### Task 2.1: Task Reordering & Board Support

Implement position-based ordering for Kanban board views.

**Deliverables:**
- [ ] `task.reorderTasks` mutation with atomic position updates
- [ ] Board-optimized queries: tasks grouped by status with position ordering
- [ ] Drag-and-drop position calculation (midpoint algorithm for insert-between)
- [ ] Cross-column move (status change + reorder in single operation)
- [ ] Integration tests for concurrent reordering

**Estimated Effort:** 3 days

#### Task 2.2: Subtask Hierarchy

Deep subtask support with depth limiting.

**Deliverables:**
- [ ] `task.getSubtasks` query
- [ ] Parent-child validation (same project constraint)
- [ ] Depth limit enforcement (`TASK_MAX_SUBTASK_DEPTH`, default 5)
- [ ] Subtask count aggregation for parent task display
- [ ] Cascading status updates (optional: complete parent when all subtasks done)
- [ ] Unit tests for hierarchy operations

**Estimated Effort:** 2 days

#### Task 2.3: Advanced Task Filtering & Search

Full-text search and complex filtering for task lists.

**Deliverables:**
- [ ] Full-text search on `title` and `description` fields
- [ ] Multi-filter queries: status + priority + type + assignee + tags + labels + date range
- [ ] Sort by: position, priority, dueDate, createdAt, updatedAt, storyPoints
- [ ] Cursor-based pagination with total count
- [ ] Query performance benchmarks (<50ms for 10K+ task projects)

**Estimated Effort:** 3 days

### Week 7–8: Time Tracking & Asset Management

#### Task 2.4: Time Entry Schema & CRUD

Implement the time tracking system with billing support.

**Deliverables:**
- [ ] `time_entries` Drizzle table definition (19 columns, 7 indexes)
- [ ] `timeEntrySourceEnum` pgEnum
- [ ] `timeEntryRouter` with 11 procedures: `list`, `get`, `create`, `update`, `delete`, `startTimer`, `stopTimer`, `activeTimer`, `approve`, `timesheet`, `projectSummary`
- [ ] Zod input schemas for all procedures
- [ ] Unit tests for CRUD operations

**Estimated Effort:** 3 days

#### Task 2.5: Live Timer System

Implement real-time timers with one-per-user constraint.

**Deliverables:**
- [ ] `startTimer` — create running entry with `isRunning: true`
- [ ] `stopTimer` — calculate duration, set `endedAt`, update `task.timeSpentMinutes`
- [ ] `activeTimer` — query user's current running timer
- [ ] One-timer-per-user constraint enforcement
- [ ] Timer activity logging (`timer_started`, `timer_stopped`)
- [ ] Automatic `task.timeSpentMinutes` aggregation on timer stop
- [ ] Unit tests: start, stop, one-timer constraint, duration calculation
- [ ] Edge case: timer running across midnight, very long timers (>24h)

**Estimated Effort:** 3 days

#### Task 2.6: Timesheet & Approval

Implement timesheet reporting and manager approval.

**Deliverables:**
- [ ] `timesheet` query with date range, user filter, project grouping
- [ ] Day-by-day and project-by-project breakdown
- [ ] Billable vs non-billable summary
- [ ] Cost calculation (duration × hourly rate)
- [ ] Bulk approval: `approve(ids[])`
- [ ] Approval state tracking (`isApproved`, `approvedById`, `approvedAt`)
- [ ] Unit tests for timesheet generation and approval

**Estimated Effort:** 2 days

#### Task 2.7: Document Asset System

Implement reusable content assets for document assembly.

**Deliverables:**
- [ ] `document_assets` Drizzle table definition (9 columns, 2 indexes)
- [ ] Asset CRUD: `createAsset`, `getAsset`, `updateAsset`, `deleteAsset`, `listAssets`
- [ ] Tag-based search: `searchAssetsByTags`
- [ ] Usage tracking: `incrementAssetUsage`
- [ ] 8 asset types: `text_snippet`, `image`, `logo`, `signature`, `clause`, `pricing_table`, `header`, `footer`
- [ ] Zod schemas for asset content validation per type
- [ ] Unit tests for CRUD and search

**Estimated Effort:** 2 days

### Week 9–10: Workflow V1

#### Task 2.8: Workflow Schema & CRUD

Create V1 workflow definitions with trigger → condition → action chains.

**Deliverables:**
- [ ] `workflows` Drizzle table definition (13 columns, 6 indexes)
- [ ] Workflow CRUD in `WorkflowService`: `create`, `get`, `update`, `delete`, `toggle`
- [ ] `workflowRouter` V1 procedures: `list`, `get`, `create`, `update`, `delete`, `toggle`, `runHistory`
- [ ] 6 trigger types: `task_created`, `task_status_changed`, `task_assigned`, `task_due_approaching`, `task_overdue`, `manual`
- [ ] 7 action types: `send_notification`, `update_field`, `assign_user`, `create_task`, `add_comment`, `webhook`, `custom`
- [ ] Zod schemas for workflow definition
- [ ] Unit tests for CRUD operations

**Estimated Effort:** 3 days

#### Task 2.9: Workflow V1 Execution Engine

Implement the V1 trigger → condition → action execution pipeline.

**Deliverables:**
- [ ] Trigger matching: query active workflows by trigger type, evaluate conditions against event data
- [ ] Sequential action execution with error handling
- [ ] Action implementations:
  - [ ] `send_notification` — integrate with `@mcv/shared` notification service
  - [ ] `update_field` — update task fields
  - [ ] `assign_user` — create/update task assignment
  - [ ] `create_task` — create new task from template
  - [ ] `add_comment` — add activity comment to task
  - [ ] `webhook` — HTTP POST to external URL
- [ ] Run tracking: increment `runCount`, set `lastRunAt`
- [ ] `workflow.test` — test with mock data
- [ ] Audit events for all workflow lifecycle events
- [ ] Unit tests for each action type
- [ ] Integration test: full trigger → execute → verify flow

**Estimated Effort:** 5 days

#### Task 2.10: Calendar Availability & Recurring Events

Build out calendar with availability checking and recurring event support.

**Deliverables:**
- [ ] Availability query: find free slots for a user/team within a date range
- [ ] Recurring event support (RRULE patterns: daily, weekly, monthly, yearly)
- [ ] Occurrence expansion for date range queries
- [ ] Event reminder scheduling (integration with notification system)
- [ ] Task-to-event linking (due dates surface as calendar events)
- [ ] Sprint milestone events (auto-generated)
- [ ] Unit tests for recurrence expansion and availability calculation

**Estimated Effort:** 4 days

### Phase 2 Exit Criteria

- [ ] Full task management: reordering, subtasks, advanced filtering, search
- [ ] Live timer system with one-per-user constraint
- [ ] Timesheet generation and approval flow
- [ ] Document asset system with 8 asset types and tag search
- [ ] V1 workflow engine: 6 trigger types, 7 action types, test mode
- [ ] Calendar with availability and recurring events
- [ ] >85% unit test coverage across all Phase 2 deliverables
- [ ] Performance benchmarks met for task listing (<50ms) and timer operations (<20ms)

---

## Phase 3 — Advanced Capabilities

**Duration:** 6 weeks
**Goal:** Build the collaborative document editor with AI suggestions, the Workflow V2 graph-based execution engine, and AI-powered task features.

### Week 11–12: Document Editor Foundation

#### Task 3.1: Document Schema & Block System

Create the block-based document storage system.

**Deliverables:**
- [ ] `documents` Drizzle table definition (17 columns, 6 indexes)
- [ ] `document_templates` table (14 columns, 5 indexes)
- [ ] `document_versions` table (6 columns, 2 indexes)
- [ ] `document_comments` table (10 columns, 4 indexes)
- [ ] `ai_content_suggestions` table (9 columns, 3 indexes)
- [ ] 24 block type definitions with per-type property schemas
- [ ] `DocumentBlock` interface with styles, animation, visibility support
- [ ] `documentEditorRouter` — document CRUD: `createDocument`, `getDocument`, `updateDocument`, `deleteDocument`, `listDocuments`
- [ ] Block operations: `addBlock`, `updateBlock`, `removeBlock`, `moveBlock`, `duplicateBlock`
- [ ] Zod schemas for all document and block inputs
- [ ] Unit tests for document CRUD and block operations

**Estimated Effort:** 5 days

#### Task 3.2: Document Version History

Implement snapshot-based versioning with restore capability.

**Deliverables:**
- [ ] `saveVersion` — snapshot current document state (blocks, variables, metadata)
- [ ] `getVersionHistory` — paginated version list
- [ ] `restoreVersion` — restore document from version snapshot
- [ ] Version auto-save before destructive operations (publish, major edits)
- [ ] Unit tests for version save, list, restore

**Estimated Effort:** 2 days

#### Task 3.3: Document Collaboration & Locking

Implement pessimistic locking and collaborator management.

**Deliverables:**
- [ ] `lockDocument` / `unlockDocument` — pessimistic editing lock
- [ ] `forceUnlockDocument` — admin override
- [ ] Lock validation on all block mutations
- [ ] Stale lock detection and auto-unlock (30-minute default)
- [ ] `addCollaborator` / `removeCollaborator` with role-based access
- [ ] Collaborator roles: `viewer`, `commenter`, `editor`, `admin`
- [ ] Unit tests for locking behavior and collaborator access

**Estimated Effort:** 3 days

#### Task 3.4: Document Publish Flow & Templates

Implement the draft → review → approved → published → archived lifecycle.

**Deliverables:**
- [ ] `submitForReview`, `approveDocument`, `publishDocument`, `archiveDocument` mutations
- [ ] Status transition validation (only valid transitions allowed)
- [ ] Template CRUD: `createTemplate`, `getTemplate`, `updateTemplate`, `deleteTemplate`, `listTemplates`
- [ ] `cloneFromTemplate` — create document from template
- [ ] `createTemplateFromDocument` — convert document to template
- [ ] `listPublicTemplates` — marketplace template listing
- [ ] Variable definition schema for templates
- [ ] Unit tests for lifecycle transitions and template operations

**Estimated Effort:** 3 days

### Week 13–14: AI Integration & Document Variables

#### Task 3.5: AI Content Suggestions

Integrate AI Gateway for document content suggestions.

**Deliverables:**
- [ ] `generateSuggestion` — AI rewrite suggestion for a block
- [ ] `expandContent` — AI expand brief content into paragraphs
- [ ] `translateBlock` — AI translate to target language
- [ ] `adjustTone` — AI adjust tone (professional, casual, formal, etc.)
- [ ] `generateFromPrompt` — AI generate content from free-form prompt
- [ ] `acceptSuggestion` / `rejectSuggestion` — apply or dismiss AI suggestion
- [ ] `listSuggestions` — list pending suggestions for a document
- [ ] Confidence scoring for AI suggestions (0–1 scale)
- [ ] Auto-expiry for stale suggestions (`AI_SUGGESTION_EXPIRY_HOURS`)
- [ ] Integration with `@mcv/kernel` AI Gateway
- [ ] Unit tests for suggestion lifecycle
- [ ] Integration tests with mocked AI responses

**Estimated Effort:** 4 days

#### Task 3.6: Document Variable Resolution

Implement CRM merge field resolution for document templates.

**Deliverables:**
- [ ] `resolveVariables` — resolve merge fields from CRM data
- [ ] Variable definition schema: `DocumentVariableDefinition` (key, label, type, default, source, required)
- [ ] Variable types: text, number, date, currency, boolean, list
- [ ] CRM data source integration (`contact.firstName`, `deal.value`, `invoice.total`)
- [ ] Fallback to `defaultValue` when source data is unavailable
- [ ] `variable` block type rendering with resolved values
- [ ] Unit tests for variable resolution and fallback behavior

**Estimated Effort:** 3 days

#### Task 3.7: Document Comments (Threaded)

Implement block-level threaded comments with resolution.

**Deliverables:**
- [ ] `createComment` — add comment to document or specific block
- [ ] Threaded replies via `parentCommentId`
- [ ] `resolveComment` — mark thread as resolved
- [ ] `updateComment` — edit own comment
- [ ] `deleteComment` — admin deletion
- [ ] `listComments` / `listCommentReplies` — paginated listing
- [ ] Unit tests for comment CRUD, threading, resolution

**Estimated Effort:** 2 days

### Week 15–16: Workflow V2 Engine

#### Task 3.8: Workflow V2 Schema

Create the V2 graph-based workflow infrastructure.

**Deliverables:**
- [ ] `workflow_versions` Drizzle table (6 columns, 2 indexes)
- [ ] `workflow_executions` Drizzle table (14 columns, 7 indexes)
- [ ] `workflow_step_executions` Drizzle table (13 columns, 3 indexes)
- [ ] `workflow_approvals` Drizzle table (12 columns, 4 indexes)
- [ ] `workflow_templates` Drizzle table (12 columns, 4 indexes)
- [ ] `WorkflowNode`, `WorkflowEdge`, `ConditionGroup`, `Condition` type definitions
- [ ] Version management: `createVersion`, `rollbackVersion`, `diffVersions`, `listVersions`
- [ ] Unit tests for version management

**Estimated Effort:** 3 days

#### Task 3.9: Condition Evaluator

Implement the nested condition evaluation engine.

**Deliverables:**
- [ ] `evaluateConditionGroup` — nested AND/OR/NOT condition evaluation
- [ ] All 22 comparison operators
- [ ] `resolveVariable` — resolve `{{variable.path}}` references from execution context
- [ ] `interpolateTemplate` — interpolate template strings with variables
- [ ] Date math operators: `within_last`, `within_next`, `before`, `after`
- [ ] Array operators: `includes`, `not_includes`, `array_length`
- [ ] Regex support: `regex_match`
- [ ] Unit tests for every operator (22 test cases minimum)
- [ ] Edge case tests: null values, missing fields, type coercion

**Estimated Effort:** 3 days

#### Task 3.10: Graph Execution Engine

Implement the core V2 workflow graph execution engine.

**Deliverables:**
- [ ] `WorkflowEngine` class with `executeWorkflowGraph()` method
- [ ] Async BFS graph traversal with parallel execution support
- [ ] Node execution by type category:
  - [ ] Action nodes: `send_sms`, `send_email`, `create_task`, `update_contact`, `webhook_send`
  - [ ] Flow control: `if_else`, `switch`, `wait`, `loop`, `parallel`, `try_catch`, `goto`
  - [ ] AI nodes: `ai_prompt`, `ai_classify`, `ai_extract`, `ai_summarize`, `rag_search`
  - [ ] Data nodes: `set_variable`, `math_operation`, `http_request`, `json_transform`
- [ ] Parallel branches with join strategies (`all`, `any`, `n_of`)
- [ ] Loop execution with iteration limit (`WORKFLOW_MAX_LOOP_ITERATIONS`)
- [ ] Try/catch with retry and exponential backoff
- [ ] Sub-workflow execution with data passing
- [ ] Rate limiting per node
- [ ] Execution context management (variables, step outputs)
- [ ] Step-by-step execution recording for debugging
- [ ] Router procedures: `executeV2`, `resumeExecution`, `cancelExecution`, `retryExecution`, `executionTrace`, `replayStep`, `listExecutions`, `testV2`
- [ ] Unit tests for each node type
- [ ] Integration tests for complex multi-step workflows

**Estimated Effort:** 8 days

#### Task 3.11: HITL Approval System

Implement human-in-the-loop approval nodes.

**Deliverables:**
- [ ] Approval node type in graph executor (pauses execution)
- [ ] `processApproval` — approve/reject with reason
- [ ] `listApprovals` — list pending approvals
- [ ] `checkApprovalTimeouts` — process expired approvals (cron job)
- [ ] Timeout configuration with escalation (`escalateTo` user)
- [ ] Multi-assignee approval support
- [ ] Execution resume on approval, feedback on rejection
- [ ] Audit events for all approval actions
- [ ] Unit tests for approval lifecycle (approve, reject, timeout, escalate)

**Estimated Effort:** 3 days

#### Task 3.12: AI Task Features

Implement AI-powered task enhancements.

**Deliverables:**
- [ ] AI priority scoring: compute `aiPriorityScore` based on task context
- [ ] AI task description generation: auto-complete draft tasks
- [ ] AI task breakdown: suggest subtasks for epic/story tasks
- [ ] AI time estimation: suggest `estimatedMinutes` based on similar completed tasks
- [ ] Integration with `@mcv/kernel` AI Gateway
- [ ] Feature flags for all AI features (opt-in per venture)
- [ ] Unit tests with mocked AI responses

**Estimated Effort:** 3 days

### Phase 3 Exit Criteria

- [ ] Block-based document editor with 24 block types
- [ ] Document version history with save/restore
- [ ] Pessimistic document locking with collaborator roles
- [ ] Full publish lifecycle (draft → review → approved → published → archived)
- [ ] AI content suggestions (rewrite, expand, translate, tone, generate)
- [ ] CRM variable resolution for document templates
- [ ] Threaded comments with resolution
- [ ] Workflow V2 graph execution engine with 90+ node types
- [ ] Condition evaluator with 22 operators
- [ ] HITL approval system with timeout and escalation
- [ ] AI task features (priority scoring, description generation, breakdown, estimation)
- [ ] >80% unit test coverage across all Phase 3 deliverables

---

## Phase 4 — Polish & Hardening

**Duration:** 3 weeks
**Goal:** Performance optimization, comprehensive test coverage, documentation completion, and production deployment preparation.

### Week 17: Performance Optimization

#### Task 4.1: Query Performance Optimization

- [ ] Benchmark all list queries with 10K+ row datasets
- [ ] Identify and optimize slow queries (target: all <50ms)
- [ ] Verify all 100+ indexes are being used (no unused indexes)
- [ ] Add missing composite indexes if needed
- [ ] Optimize JSONB queries (blocks, tags, labels, customFields)
- [ ] Test RLS policy performance overhead

#### Task 4.2: Caching Layer

- [ ] Implement Redis caching for frequently accessed data:
  - Task list queries (30s TTL)
  - Project hierarchy (5m TTL)
  - Sprint metrics (1m TTL)
  - Workflow/document templates (10m TTL)
- [ ] Cache invalidation on mutations
- [ ] Cache hit rate monitoring

#### Task 4.3: Workflow Engine Performance

- [ ] Benchmark workflow execution with complex graphs (100+ nodes)
- [ ] Optimize parallel branch execution
- [ ] Verify loop iteration limits are enforced
- [ ] Test retry backoff timing accuracy
- [ ] Profile memory usage for large execution contexts

### Week 18: Comprehensive Testing

#### Task 4.4: Integration Test Suite

- [ ] End-to-end task lifecycle: create → assign → work → complete → archive
- [ ] Full workflow V2 execution: trigger → condition → branch → action → complete
- [ ] Document lifecycle: create → edit → review → approve → publish
- [ ] Time tracking: start timer → stop → approve → timesheet
- [ ] Cross-module: task status change → triggers workflow → sends notification
- [ ] Multi-venture isolation: verify no cross-venture data leakage

#### Task 4.5: Edge Case & Error Testing

- [ ] Concurrent task reordering (optimistic concurrency)
- [ ] Concurrent document locking (race conditions)
- [ ] Timer running across timezone changes
- [ ] Workflow with circular sub-workflow references
- [ ] 1000-iteration loop execution
- [ ] Deeply nested condition groups (10+ levels)
- [ ] Maximum dependency graph (10K tasks, 20K edges)
- [ ] Document with 500 blocks (JSONB performance)

#### Task 4.6: Security Testing

- [ ] RLS policy enforcement on all 20 tables
- [ ] Auth guard verification on all 90+ procedures
- [ ] Venture isolation testing (cannot access other venture's data)
- [ ] Admin-only procedure testing (non-admin rejected)
- [ ] Input validation fuzzing (malformed Zod inputs)
- [ ] SQL injection testing through Drizzle ORM

### Week 19: Documentation & Deployment

#### Task 4.7: Documentation Completion

- [ ] API reference documentation (this document + inline JSDoc)
- [ ] Architecture diagrams (kept up to date with implementation)
- [ ] Runbook: common operations, troubleshooting, monitoring
- [ ] Migration guide: database migration ordering and RLS setup
- [ ] Configuration reference: all environment variables documented

#### Task 4.8: Deployment Preparation

- [ ] Database migration scripts tested in staging
- [ ] RLS policies deployed and verified
- [ ] Environment variable configuration documented and set
- [ ] Health check endpoints verified
- [ ] Monitoring dashboards configured (key metrics from Observability section)
- [ ] Alert thresholds set (workflow failure rate, query latency, etc.)
- [ ] Rollback plan documented

#### Task 4.9: Production Deployment

- [ ] Deploy database migrations
- [ ] Deploy application code
- [ ] Verify health checks
- [ ] Run smoke tests
- [ ] Monitor for 24 hours
- [ ] Sign off on production readiness

### Phase 4 Exit Criteria

- [ ] All queries under 50ms target for normal datasets
- [ ] Redis caching in place with invalidation
- [ ] >85% overall test coverage
- [ ] All edge cases tested and passing
- [ ] Security audit complete (RLS, auth, input validation)
- [ ] Documentation complete and reviewed
- [ ] Deployed to staging and production
- [ ] Monitoring and alerting configured

---

## Testing Strategy

### Test Pyramid

```
                    ┌──────────────┐
                    │   E2E Tests  │     5%  — Playwright
                    │  (Phase 4)   │     Full user journeys
                    ├──────────────┤
                    │ Integration  │    25%  — Vitest + test DB
                    │   Tests      │     Router → Service → DB
                    ├──────────────┤
                    │  Unit Tests  │    70%  — Vitest
                    │              │     Service methods, utils
                    └──────────────┘
```

### Test Categories

| Category | Tool | Target Coverage | Description |
|----------|------|----------------|-------------|
| **Unit Tests** | Vitest | 85%+ | Service methods, condition evaluator, cycle detection, variable resolution |
| **Integration Tests** | Vitest + test DB | 70%+ | tRPC router calls, database operations, RLS enforcement |
| **E2E Tests** | Playwright | Critical paths | Task board interaction, document editing, timer lifecycle |
| **Performance Tests** | Custom benchmarks | Key queries | Task listing (<50ms), cycle detection (<100ms), workflow execution |
| **Security Tests** | Custom + automated | All endpoints | RLS isolation, auth guards, input validation |

### Test Database Strategy

```
Test Setup:
1. Create isolated test database (per test suite or per test)
2. Apply all migrations
3. Seed with test venture, users, projects
4. Run tests with venture context set
5. Teardown (drop or truncate)

Isolation: Each test suite gets a clean database state
Parallelism: Multiple test suites can run in parallel with separate schemas
```

---

## Acceptance Criteria

### Functional Acceptance

| # | Criterion | Verification |
|---|-----------|-------------|
| F1 | Tasks can be created, assigned, prioritized, and tracked through a 17-state lifecycle | Integration test |
| F2 | Task dependencies support 4 types with BFS cycle detection | Unit test |
| F3 | Polymorphic assignment supports 6 assignee types (user, team, agent, agent_pool, workflow, external) | Unit test |
| F4 | Projects support hierarchy, visibility levels, and JSONB settings | Integration test |
| F5 | Sprints track capacity, velocity, and retrospective notes | Unit test |
| F6 | Live timer with one-per-user constraint and automatic duration calculation | Integration test |
| F7 | Timesheet reports group by day and project with billable/non-billable breakdown | Unit test |
| F8 | V1 workflows execute trigger → condition → action chains | Integration test |
| F9 | V2 workflows execute graph-based flows with parallel branches, loops, and HITL approvals | Integration test |
| F10 | Document editor supports 24 block types with CRUD operations | Unit test |
| F11 | Document publish lifecycle: draft → review → approved → published → archived | Integration test |
| F12 | AI suggestions generate rewrite, expand, translate, tone, and prompt-based content | Integration test (mocked AI) |
| F13 | Document variables resolve from CRM data with fallback defaults | Unit test |
| F14 | Reusable assets support 8 types with tag-based search | Unit test |
| F15 | Calendar events support creation, availability checking, and recurring patterns | Integration test |

### Non-Functional Acceptance

| # | Criterion | Target | Verification |
|---|-----------|--------|-------------|
| NF1 | Task list query latency | <50ms for 10K+ tasks | Performance test |
| NF2 | Cycle detection performance | <100ms for 10K-node graph | Performance test |
| NF3 | Timer start/stop latency | <20ms | Performance test |
| NF4 | Workflow execution throughput | 100+ concurrent executions | Load test |
| NF5 | Document block operations | <100ms for 500-block doc | Performance test |
| NF6 | Venture isolation | Zero cross-venture leakage | Security test |
| NF7 | Unit test coverage | >85% | Coverage report |
| NF8 | API availability | 99.9% uptime | Monitoring |

---

## Risks & Mitigations

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Workflow V2 complexity** — Graph execution engine is the most complex component; may take longer than estimated | High | High | Start with a minimal node set (10 types), expand incrementally. Isolate engine into its own module with comprehensive tests. |
| **JSONB performance** — Document blocks stored as JSONB may degrade with large documents | Medium | Medium | Enforce `DOCUMENT_MAX_BLOCKS` limit (500). Benchmark early in Phase 3. Consider splitting large docs into sub-documents if needed. |
| **Real-time collaboration** — Pessimistic locking is a stopgap; true CRDT will be needed for multi-user editing | High | Low (Phase 3+) | Pessimistic locking is the Phase 3 deliverable. CRDT is deferred to a future phase. Document the limitation clearly. |
| **AI Gateway dependency** — AI features depend on `@mcv/kernel` availability | Low | Medium | All AI features are optional (feature-flagged). Mock AI responses in tests. Graceful degradation if AI Gateway is unavailable. |
| **CRM data dependency** — Document variable resolution requires CRM data access | Medium | Low | Variable resolution falls back to `defaultValue` if CRM data is unavailable. Phase 3 delivery is not blocked by CRM completeness. |
| **Notification system** — V1 workflow `send_notification` action requires notification infrastructure | Medium | Medium | Start with `add_comment` and `webhook` actions that don't need notification infra. Add notification actions when `@mcv/shared` is ready. |

### Schedule Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Phase 2 overrun** — Full task management + time tracking + workflows V1 in 6 weeks is ambitious | Medium | Medium | Prioritize: Tasks first, then Time, then Workflows V1. Calendar availability can slip to Phase 3 if needed. |
| **Phase 3 overrun** — Document editor + Workflow V2 + AI in 6 weeks is the densest phase | High | High | Strict scope control: V2 engine MVP with 20 node types, expand in Phase 4. AI features are feature-flagged and can be deferred. |
| **Integration delays** — Dependencies on other domain packages may not be ready | Low | Medium | Design all integration points with interfaces/adapters. Mock dependencies in tests. |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Migration complexity** — 20+ tables with foreign key dependencies require careful ordering | Low | High | Migration ordering documented (22-step sequence). Tested in staging before production. |
| **RLS policy bugs** — Incorrect RLS policies could leak data or deny access | Low | Critical | Comprehensive RLS tests for every table. Service role bypass tested separately. |
| **Workflow runaway** — Infinite loops or excessive API calls from workflow execution | Medium | High | Hard iteration limit (1000), rate limiting per node, execution timeout, test mode flag. |

---

## Timeline

### Gantt Overview

```
Week  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19
      ├──────────────┤
      │   PHASE 1    │  Foundation
      │   (4 weeks)  │  Tasks, Projects, Sprints, Calendar schema
      │              │
      └──────────────┤──────────────────────┤
                     │      PHASE 2         │  Core Features
                     │      (6 weeks)       │  Full tasks, Time, Assets, Workflows V1
                     │                      │
                     └──────────────────────┤──────────────────────┤
                                            │      PHASE 3         │  Advanced
                                            │      (6 weeks)       │  Editor, Workflows V2, AI
                                            │                      │
                                            └──────────────────────┤────────────┤
                                                                   │  PHASE 4   │  Polish
                                                                   │  (3 weeks) │  Perf, Test, Deploy
                                                                   └────────────┘
```

### Key Milestones

| Milestone | Target Date | Deliverable |
|-----------|------------|-------------|
| **M1: Schema Complete** | End of Week 2 | All Phase 1 database tables migrated |
| **M2: Basic CRUD** | End of Week 4 | Task/project/sprint CRUD operational |
| **M3: Task Board Ready** | End of Week 6 | Kanban board with reordering, subtasks, filtering |
| **M4: Time Tracking Live** | End of Week 8 | Live timers, timesheets, approval |
| **M5: V1 Workflows** | End of Week 10 | Workflow V1 engine with 6 triggers, 7 actions |
| **M6: Document Editor** | End of Week 12 | Block editor with 24 types, versions, locking |
| **M7: AI Integration** | End of Week 14 | AI suggestions, variable resolution, comments |
| **M8: V2 Engine** | End of Week 16 | Workflow V2 graph execution, approvals |
| **M9: Production Ready** | End of Week 19 | Deployed, monitored, documented |

### Dependencies Between Milestones

```
M1 (Schema) ──> M2 (CRUD) ──> M3 (Task Board)
                     │
                     ├──> M4 (Time Tracking)
                     │
                     └──> M5 (V1 Workflows) ──> M8 (V2 Engine)
                              │
                              └──> M6 (Document Editor) ──> M7 (AI Integration)
                                                                    │
All milestones ─────────────────────────────────────────────────> M9 (Production)
```

---

*@mcv/operations — Operations Management Domain*
