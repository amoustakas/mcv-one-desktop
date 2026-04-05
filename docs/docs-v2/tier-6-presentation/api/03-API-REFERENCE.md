# @mcv/api — API Reference
## Complete Endpoint & Configuration Reference

**Package:** `@mcv/api`  
**Version:** 0.1.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [tRPC Router Hierarchy](#trpc-router-hierarchy)
3. [Procedure Groups](#procedure-groups)
   - [Authentication & Identity](#1-authentication--identity)
   - [Multi-Tenancy & Access Control](#2-multi-tenancy--access-control)
   - [AI & Intelligence](#3-ai--intelligence)
   - [CRM & Contacts](#4-crm--contacts)
   - [Task & Project Management](#5-task--project-management)
   - [Communication & Contact Center](#6-communication--contact-center)
   - [Calendar & Scheduling](#7-calendar--scheduling)
   - [Commerce & Payments](#8-commerce--payments)
   - [Marketing & Content](#9-marketing--content)
   - [Documents & Storage](#10-documents--storage)
   - [Analytics & Observability](#11-analytics--observability)
   - [Platform Operations](#12-platform-operations)
   - [Grants & Funding](#13-grants--funding)
   - [Tags & Metadata](#14-tags--metadata)
4. [Middleware Chain](#middleware-chain)
5. [Error Codes & Handling](#error-codes--handling)
6. [WebSocket Subscriptions](#websocket-subscriptions)
7. [Schema Reference](#schema-reference)
8. [Configuration Reference](#configuration-reference)

---

## API Overview

`@mcv/api` is the **single API surface** for the MCV.ONE platform. It exposes a unified tRPC `appRouter` that merges **61 domain routers** into one type-safe, end-to-end API. All clients — Next.js App Router, Hono edge workers, React Query hooks, and AI agents — connect exclusively through this package.

### Key Characteristics

| Property | Value |
|----------|-------|
| **Protocol** | tRPC v11 over HTTP (JSON-RPC 2.0 wire format) |
| **Serialization** | SuperJSON (Date, Map, Set, BigInt, undefined preserved) |
| **Validation** | Zod-first — every input validated before handler execution |
| **Authentication** | Better Auth sessions via cookies / Authorization header |
| **Authorization** | 14 procedure types enforcing RBAC tiers, venture context, agent identity |
| **Rate Limiting** | Sliding window algorithm, 5 presets, per-route composite keys |
| **Transport** | HTTP GET (queries), HTTP POST (mutations), WebSocket (subscriptions) |
| **OpenAPI** | Auto-generated OpenAPI 3.0 spec for external consumers |

### Base URLs

| Environment | Endpoint | Adapter |
|-------------|----------|---------|
| Next.js App Router | `/api/trpc/*` | `fetchRequestHandler` |
| Hono Edge Worker | `/trpc/*` | `@hono/trpc-server` |
| Server Components | Direct caller (no HTTP) | `createCallerFactory` |

### Request Format

```
# Query (GET)
GET /api/trpc/auth.getSession?input={encoded_json}

# Mutation (POST)
POST /api/trpc/auth.login
Content-Type: application/json
{
  "json": { "email": "user@example.com", "password": "..." }
}

# Batch (GET/POST)
GET /api/trpc/users.me,ventures.list?batch=1&input={}
```

### Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Cookie` | Conditional | Better Auth session cookie (browser clients) |
| `Authorization` | Conditional | `Bearer <token>` for non-browser clients |
| `x-request-id` | Optional | Client-provided request ID for tracing (auto-generated if missing) |
| `x-agent-id` | Conditional | AI agent identifier (required for `agentProcedure` endpoints) |
| `x-venture-id` | Optional | Override active venture context |
| `Content-Type` | POST only | `application/json` |

---

## tRPC Router Hierarchy

The `appRouter` is composed by merging 61 domain routers. Each router is mounted at a namespace key:

```typescript
export const appRouter = router({
  // Authentication & Identity
  auth:             authRouter,           // ~20 procedures
  mfa:              mfaRouter,            // ~6 procedures
  passkey:          passkeyRouter,        // ~6 procedures
  wallet:           walletRouter,         // ~4 procedures
  users:            usersRouter,          // ~12 procedures
  roles:            rolesRouter,          // ~8 procedures

  // Multi-Tenancy & Access Control
  ventures:         venturesRouter,       // ~10 procedures
  ventureMembers:   ventureMembersRouter, // ~8 procedures
  permissions:      permissionsRouter,    // ~6 procedures
  settings:         settingsRouter,       // ~8 procedures

  // AI & Intelligence
  gateway:          gatewayRouter,        // ~18 procedures
  rag:              ragRouter,            // ~14 procedures (nested)
  ai:               aiRouter,            // varies
  intelligence:     intelligenceRouter,   // ~8 procedures (nested)
  hitl:             hitlRouter,           // ~6 procedures
  agentTasks:       agentTasksRouter,     // ~8 procedures
  workbench:        workbenchRouter,      // varies

  // CRM & Contacts
  contacts:         contactRouter,        // ~8 procedures
  organizations:    organizationRouter,   // ~8 procedures
  deals:            dealRouter,           // ~10 procedures
  activities:       activityRouter,       // ~6 procedures
  crmV2:            crmV2Router,          // ~20+ procedures
  entityGraph:      entityGraphRouter,    // ~10 procedures

  // Task & Project Management
  tasks:            taskRouter,           // ~12 procedures
  projects:         projectRouter,        // ~10 procedures
  sprints:          sprintRouter,         // ~8 procedures
  taskTemplates:    taskTemplateRouter,   // ~6 procedures
  timeEntries:      timeEntryRouter,      // ~8 procedures
  automationRules:  automationRuleRouter, // ~8 procedures
  taskAnalytics:    taskAnalyticsRouter,  // ~6 procedures
  workflows:        workflowRouter,       // ~20+ procedures

  // Communication & Contact Center
  conversations:    conversationRouter,   // ~10 procedures
  queues:           queueRouter,          // ~8 procedures
  twilio:           twilioRouter,         // ~10 procedures
  contactCenter:    contactCenterRouter,  // ~15+ procedures

  // Calendar & Scheduling
  calendar:         calendarRouter,       // ~32 procedures

  // Commerce & Payments
  catalog:          catalogRouter,        // ~48 procedures
  payments:         paymentsRouter,       // varies
  invoicing:        invoicingRouter,      // ~15+ procedures
  tokenEconomy:     tokenEconomyRouter,   // ~12 procedures

  // Marketing & Content
  email:            emailRouter,          // ~8 procedures
  marketing:        marketingRouter,      // ~10 procedures
  forms:            formRouter,           // ~12 procedures
  reputation:       reputationRouter,     // ~12 procedures
  cms:              cmsRouter,            // ~10 procedures

  // Documents & Storage
  documentEditor:   documentEditorRouter, // ~8 procedures
  storage:          storageRouter,        // ~8 procedures
  comments:         commentsRouter,       // ~6 procedures

  // Analytics & Observability
  analytics:        analyticsRouter,      // ~10 procedures
  stats:            statsRouter,          // ~8 procedures
  audit:            auditRouter,          // ~6 procedures
  notifications:    notificationsRouter,  // ~8 procedures

  // Platform Operations
  flags:            flagsRouter,          // ~6 procedures
  webhooks:         webhookRouter,        // ~8 procedures
  integrations:     integrationRouter,    // ~8 procedures
  portfolio:        portfolioRouter,      // ~8 procedures
  treasury:         treasuryRouter,       // ~10 procedures
  strategy:         strategyRouter,       // ~10 procedures

  // Grants & Funding
  grants:           grantConciergeRouter, // ~12 procedures

  // Tags & Metadata
  tags:             tagsRouter,           // ~6 procedures
  branding:         brandingRouter,       // ~6 procedures
});

export type AppRouter = typeof appRouter;
```

### Accessing Procedures

Procedures are called using dot-notation paths: `{namespace}.{procedure}`.

```typescript
// Client-side (React Query)
const session = trpc.auth.getSession.useQuery();
const login   = trpc.auth.login.useMutation();

// Server-side (RSC / server caller)
const caller = createCaller(ctx);
const user   = await caller.users.me();

// Nested routers use multiple dots
const health = await caller.intelligence.ventureHealth({ ventureId: "..." });
```

---

## Procedure Groups

### 1. Authentication & Identity

#### `auth` — Core Authentication (~20 procedures)

| Procedure | Type | Input Schema | Output | Auth | Rate Limit | Description |
|-----------|------|-------------|--------|------|------------|-------------|
| `auth.login` | mutation | `loginSchema` | `AuthResult` | public | `auth` (5/min) | Email + password login. Returns session + user. |
| `auth.signup` | mutation | `signupSchema` | `AuthResult` | public | `auth` (5/min) | Create account. Sends verification email. |
| `auth.logout` | mutation | — | `{ success }` | protected | — | Destroy current session. |
| `auth.getSession` | query | — | `SessionInfo \| null` | public | — | Return current session if authenticated. |
| `auth.refreshSession` | mutation | — | `SessionInfo` | protected | — | Refresh expiring session token. |
| `auth.forgotPassword` | mutation | `{ email }` | `{ success }` | public | `strict` (3/min) | Send password reset email. |
| `auth.resetPassword` | mutation | `resetPasswordSchema` | `{ success }` | public | `strict` (3/min) | Confirm password reset with token. |
| `auth.verifyEmail` | mutation | `{ token }` | `{ success }` | public | `auth` (5/min) | Confirm email address. |
| `auth.resendVerification` | mutation | `{ email }` | `{ success }` | public | `auth` (5/min) | Re-send verification email. |
| `auth.changePassword` | mutation | `changePasswordSchema` | `{ success }` | protected | — | Change password (requires current). |
| `auth.switchVenture` | mutation | `{ ventureId }` | `SessionInfo` | protected | — | Switch active venture context. |
| `auth.listSessions` | query | — | `Session[]` | protected | — | List all active sessions. |
| `auth.revokeSession` | mutation | `{ sessionId }` | `{ success }` | protected | — | Revoke a specific session. |
| `auth.revokeAllSessions` | mutation | — | `{ success }` | protected | — | Revoke all sessions except current. |

**Example — Login:**
```typescript
// Input
const result = await trpc.auth.login.mutate({
  email: "user@mcv.one",
  password: "securePassword123",
});

// Output (AuthResult)
{
  session: {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@mcv.one",
    ventureId: "venture-uuid-here",
    sessionId: "session-uuid",
    expiresAt: "2026-03-09T07:00:00.000Z"
  },
  user: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@mcv.one",
    firstName: "Jane",
    lastName: "Doe",
    displayName: "Jane Doe",
    avatarUrl: "https://...",
    status: "active",
    emailVerified: true,
    mfaEnabled: false,
    role: "member",
    createdAt: "2025-01-15T..."
  }
}
```

#### `mfa` — Multi-Factor Authentication (~6 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `mfa.setup` | mutation | — | `{ secret, qrCodeUrl, backupCodes }` | protected | Generate TOTP secret and QR code. |
| `mfa.verify` | mutation | `{ code }` | `{ success }` | protected | Verify TOTP and enable MFA. |
| `mfa.disable` | mutation | `{ code }` | `{ success }` | protected | Disable MFA (requires valid code). |
| `mfa.validateLogin` | mutation | `completeMfaLoginSchema` | `AuthResult` | public | Complete login with MFA code. |
| `mfa.regenerateBackupCodes` | mutation | `{ code }` | `{ backupCodes }` | protected | Generate new backup codes. |
| `mfa.status` | query | — | `{ enabled, methods }` | protected | Check MFA enrollment status. |

#### `passkey` — WebAuthn/FIDO2 (~6 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `passkey.registrationOptions` | query | — | `PublicKeyCredentialCreationOptions` | protected | Get WebAuthn registration challenge. |
| `passkey.register` | mutation | `registrationSchema` | `{ credentialId }` | protected | Register a passkey credential. |
| `passkey.authenticationOptions` | query | `{ email? }` | `PublicKeyCredentialRequestOptions` | public | Get WebAuthn authentication challenge. |
| `passkey.authenticate` | mutation | `verificationSchema` | `AuthResult` | public | Authenticate with a passkey. |
| `passkey.list` | query | — | `Passkey[]` | protected | List registered passkeys. |
| `passkey.delete` | mutation | `{ credentialId }` | `{ success }` | protected | Remove a passkey. |

#### `wallet` — Web3 Wallet Authentication (~4 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `wallet.getNonce` | query | `{ address }` | `{ nonce }` | public | Generate sign-in nonce for wallet. |
| `wallet.verify` | mutation | `walletVerifySchema` | `AuthResult` | public | Verify wallet signature + login/register. |
| `wallet.link` | mutation | `{ address, signature }` | `{ success }` | protected | Link wallet to existing account. |
| `wallet.unlink` | mutation | `{ address }` | `{ success }` | protected | Unlink wallet from account. |

#### `users` — User Management (~12 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `users.me` | query | — | `AuthenticatedUser` | protected | Get current user profile. |
| `users.updateProfile` | mutation | `updateUserSchema` | `User` | protected | Update own profile fields. |
| `users.getById` | query | `idParamSchema` | `User` | admin | Get any user by ID. |
| `users.list` | query | `listUsersSchema` | `PaginatedResponse<User>` | admin | List users with filters + pagination. |
| `users.create` | mutation | `createUserSchema` | `User` | admin | Create a new user account. |
| `users.update` | mutation | `updateUserSchema & idParamSchema` | `User` | admin | Update any user's profile. |
| `users.delete` | mutation | `idParamSchema` | `{ success }` | superAdmin | Soft-delete a user account. |
| `users.suspend` | mutation | `idParamSchema` | `{ success }` | admin | Suspend a user account. |
| `users.reactivate` | mutation | `idParamSchema` | `{ success }` | admin | Reactivate a suspended user. |
| `users.assignRole` | mutation | `{ userId, roleId }` | `{ success }` | admin | Assign a role to a user. |
| `users.removeRole` | mutation | `{ userId, roleId }` | `{ success }` | admin | Remove a role from a user. |
| `users.invite` | mutation | `{ email, roleId?, ventureId? }` | `{ invitationId }` | admin | Send invitation email. |

**Example — List Users with Pagination:**
```typescript
const result = await trpc.users.list.query({
  page: 1,
  pageSize: 25,
  sort: { field: "createdAt", direction: "desc" },
  filter: { status: "active" },
  search: "jane",
});

// Output
{
  items: [{ id: "...", email: "jane@...", firstName: "Jane", ... }],
  meta: {
    total: 142,
    page: 1,
    pageSize: 25,
    totalPages: 6,
    hasMore: true,
    hasPrevious: false
  }
}
```

#### `roles` — Role Management (~8 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `roles.list` | query | `offsetPaginationSchema` | `PaginatedResponse<Role>` | admin | List all roles. |
| `roles.getById` | query | `idParamSchema` | `Role` | admin | Get role by ID. |
| `roles.create` | mutation | `createRoleSchema` | `Role` | admin | Create a new role. |
| `roles.update` | mutation | `updateRoleSchema` | `Role` | admin | Update role name/description. |
| `roles.delete` | mutation | `idParamSchema` | `{ success }` | superAdmin | Delete a role. |
| `roles.assignPermission` | mutation | `{ roleId, permissionId }` | `{ success }` | admin | Grant permission to role. |
| `roles.removePermission` | mutation | `{ roleId, permissionId }` | `{ success }` | admin | Revoke permission from role. |
| `roles.getPermissions` | query | `idParamSchema` | `Permission[]` | admin | List permissions for a role. |

---

### 2. Multi-Tenancy & Access Control

#### `ventures` — Venture (Tenant) Management (~10 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `ventures.list` | query | `offsetPaginationSchema` | `PaginatedResponse<Venture>` | protected | List user's ventures. |
| `ventures.getById` | query | `idParamSchema` | `VentureWithStats` | protected | Get venture with stats. |
| `ventures.create` | mutation | `createVentureSchema` | `Venture` | admin | Create a new venture. |
| `ventures.update` | mutation | `updateVentureSchema` | `Venture` | admin | Update venture settings. |
| `ventures.delete` | mutation | `idParamSchema` | `{ success }` | superAdmin | Archive a venture. |
| `ventures.suspend` | mutation | `idParamSchema` | `{ success }` | superAdmin | Suspend a venture. |
| `ventures.reactivate` | mutation | `idParamSchema` | `{ success }` | superAdmin | Reactivate a venture. |
| `ventures.getSettings` | query | `idParamSchema` | `VentureSettings` | admin | Get venture configuration. |
| `ventures.updateSettings` | mutation | `{ id, settings }` | `VentureSettings` | admin | Update venture configuration. |
| `ventures.listAll` | query | `offsetPaginationSchema` | `PaginatedResponse<Venture>` | superAdmin | List all ventures (cross-tenant). |

#### `ventureMembers` — Membership Management (~8 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `ventureMembers.list` | query | `offsetPaginationSchema` | `PaginatedResponse<Member>` | admin | List venture members. |
| `ventureMembers.add` | mutation | `{ userId, roleId }` | `Member` | admin | Add user to venture. |
| `ventureMembers.remove` | mutation | `{ userId }` | `{ success }` | admin | Remove user from venture. |
| `ventureMembers.updateRole` | mutation | `{ userId, roleId }` | `Member` | admin | Change member's role. |
| `ventureMembers.invite` | mutation | `{ email, roleId }` | `{ invitationId }` | admin | Invite external user. |
| `ventureMembers.acceptInvitation` | mutation | `{ token }` | `{ success }` | public | Accept an invitation. |
| `ventureMembers.listInvitations` | query | — | `Invitation[]` | admin | List pending invitations. |
| `ventureMembers.revokeInvitation` | mutation | `{ invitationId }` | `{ success }` | admin | Revoke a pending invitation. |

#### `permissions` — Permission Queries (~6 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `permissions.list` | query | — | `Permission[]` | admin | List all defined permissions. |
| `permissions.check` | query | `{ resource, action }` | `{ allowed }` | protected | Check current user's permission. |
| `permissions.checkBulk` | query | `{ checks: [{resource, action}] }` | `{ results }` | protected | Batch permission check. |
| `permissions.getMyPermissions` | query | — | `UserPermissions` | protected | Get all resolved permissions. |
| `permissions.getUserPermissions` | query | `{ userId }` | `UserPermissions` | admin | Get another user's permissions. |
| `permissions.getEffective` | query | `{ userId, ventureId }` | `UserPermissions` | superAdmin | Get effective permissions in context. |

#### `settings` — System & Venture Settings (~8 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `settings.get` | query | `{ key }` | `SettingValue` | admin | Get a setting by key. |
| `settings.set` | mutation | `{ key, value }` | `{ success }` | admin | Set a setting value. |
| `settings.getBulk` | query | `{ keys }` | `Record<string, SettingValue>` | admin | Get multiple settings. |
| `settings.setBulk` | mutation | `{ settings }` | `{ success }` | admin | Set multiple settings. |
| `settings.listByCategory` | query | `{ category }` | `Setting[]` | admin | List settings by category. |
| `settings.getSystem` | query | `{ key }` | `SettingValue` | superAdmin | Get system-level setting. |
| `settings.setSystem` | mutation | `{ key, value }` | `{ success }` | superAdmin | Set system-level setting. |
| `settings.reset` | mutation | `{ key }` | `{ success }` | admin | Reset setting to default. |

---

### 3. AI & Intelligence

#### `gateway` — LLM Gateway (~18 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `gateway.chat` | mutation | `chatCompletionSchema` | `ChatResponse` | protected | Send LLM chat completion request. |
| `gateway.chatStream` | mutation | `chatCompletionSchema` | `AsyncIterable<Chunk>` | protected | Streaming chat completion. |
| `gateway.listModels` | query | — | `Model[]` | protected | List available models. |
| `gateway.getModelConfig` | query | `{ modelId }` | `ModelConfig` | admin | Get model configuration. |
| `gateway.updateModelConfig` | mutation | `modelConfigSchema` | `ModelConfig` | superAdmin | Update model config. |
| `gateway.getUsage` | query | `dateRangeSchema` | `UsageStats` | protected | Get personal usage stats. |
| `gateway.getVentureUsage` | query | `dateRangeSchema` | `UsageStats` | admin | Get venture-level usage. |
| `gateway.getSystemUsage` | query | `dateRangeSchema` | `UsageStats` | superAdmin | Get platform-wide usage. |
| `gateway.getBudget` | query | — | `BudgetInfo` | admin | Get venture LLM budget. |
| `gateway.setBudget` | mutation | `{ ventureId, limit }` | `BudgetInfo` | admin | Set venture LLM budget. |
| `gateway.listProviders` | query | — | `Provider[]` | superAdmin | List configured LLM providers. |
| `gateway.tierRouting` | query | — | `TierRoutingConfig` | admin | Get tier-based model routing rules. |
| `gateway.updateTierRouting` | mutation | `tierRoutingSchema` | `TierRoutingConfig` | superAdmin | Update tier routing. |

#### `rag` — RAG (Retrieval-Augmented Generation) (~14 procedures, nested)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `rag.stores.list` | query | — | `RagStore[]` | admin | List RAG stores. |
| `rag.stores.create` | mutation | `createStoreSchema` | `RagStore` | admin | Create a RAG store. |
| `rag.stores.delete` | mutation | `idParamSchema` | `{ success }` | admin | Delete a RAG store. |
| `rag.documents.upload` | mutation | `uploadSchema` | `Document` | protected | Upload document for ingestion. |
| `rag.documents.list` | query | `{ storeId }` | `Document[]` | protected | List documents in store. |
| `rag.documents.delete` | mutation | `idParamSchema` | `{ success }` | admin | Delete a document. |
| `rag.query.basic` | query | `querySchema` | `QueryResult` | protected | Basic vector similarity search. |
| `rag.query.synthesis` | query | `querySchema` | `SynthesisResult` | protected | Query + LLM synthesis answer. |
| `rag.query.deep` | query | `querySchema` | `DeepResult` | protected | Multi-step deep research query. |
| `rag.costs.get` | query | `dateRangeSchema` | `CostReport` | admin | Get RAG usage costs. |
| `rag.costs.getByStore` | query | `{ storeId } & dateRangeSchema` | `CostReport` | admin | Per-store cost breakdown. |

#### `intelligence` — Venture Intelligence (~8 procedures, nested)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `intelligence.ventureHealth` | query | `ventureIntelligenceSchema` | `HealthReport` | admin | Comprehensive venture health report. |
| `intelligence.entityProfile` | query | `entityIntelligenceSchema` | `EntityProfile` | admin | Deep entity intelligence profile. |
| `intelligence.comparison` | query | `{ ventureIds }` | `ComparisonReport` | superAdmin | Cross-venture comparison. |
| `intelligence.timeline` | query | `{ entityId, range }` | `TimelineEvent[]` | admin | Unified entity timeline. |
| `intelligence.insights` | query | `{ ventureId }` | `Insight[]` | admin | Actionable AI-generated insights. |
| `intelligence.anomalies` | query | `{ ventureId, range }` | `Anomaly[]` | admin | Anomaly detection results. |
| `intelligence.forecast` | query | `{ ventureId, metric }` | `Forecast` | admin | Predictive metric forecast. |
| `intelligence.recommendations` | query | `{ ventureId }` | `Recommendation[]` | admin | Prioritized recommendations. |

#### `hitl` — Human-in-the-Loop (~6 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `hitl.list` | query | `offsetPaginationSchema` | `PaginatedResponse<HITLApproval>` | protected | List pending approvals. |
| `hitl.getById` | query | `idParamSchema` | `HITLApproval` | protected | Get approval details. |
| `hitl.create` | mutation | `createHITLApprovalSchema` | `HITLApproval` | protected | Queue an item for human review. |
| `hitl.resolve` | mutation | `resolveHITLApprovalSchema` | `HITLApproval` | protected | Approve or reject an item. |
| `hitl.escalate` | mutation | `{ id, reason }` | `HITLApproval` | protected | Escalate to higher authority. |
| `hitl.metrics` | query | `dateRangeSchema` | `HITLMetrics` | admin | Approval queue metrics. |

#### `agentTasks` — AI Agent Task Queue (~8 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `agentTasks.queue` | mutation | `queueForAgentSchema` | `AgentTask` | venture | Queue task for agent processing. |
| `agentTasks.claim` | mutation | `agentClaimTaskSchema` | `AgentTask` | agent | Agent claims a queued task. |
| `agentTasks.progress` | mutation | `{ taskId, progress }` | `AgentTask` | agent | Update task progress. |
| `agentTasks.complete` | mutation | `agentCompleteTaskSchema` | `AgentTask` | agent | Mark task as completed. |
| `agentTasks.fail` | mutation | `{ taskId, error }` | `AgentTask` | agent | Mark task as failed. |
| `agentTasks.list` | query | `{ status?, agentId? }` | `AgentTask[]` | venture | List agent tasks. |
| `agentTasks.getById` | query | `idParamSchema` | `AgentTask` | venture | Get task details. |
| `agentTasks.metrics` | query | `dateRangeSchema` | `AgentMetrics` | admin | Agent task performance metrics. |

---

### 4. CRM & Contacts

#### `contacts` — Contact Management (~8 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `contacts.list` | query | `listContactsSchema` | `PaginatedResponse<Contact>` | venture | List contacts with filters. |
| `contacts.getById` | query | `idParamSchema` | `Contact` | venture | Get contact details. |
| `contacts.create` | mutation | `createContactSchema` | `Contact` | venture | Create a new contact. |
| `contacts.update` | mutation | `updateContactSchema` | `Contact` | venture | Update contact fields. |
| `contacts.delete` | mutation | `idParamSchema` | `{ success }` | venture | Soft-delete a contact. |
| `contacts.search` | query | `searchSchema` | `Contact[]` | venture | Full-text contact search. |
| `contacts.merge` | mutation | `{ sourceId, targetId }` | `Contact` | venture | Merge duplicate contacts. |
| `contacts.bulkImport` | mutation | `{ contacts }` | `BatchResult` | venture | Bulk import contacts. |

#### `deals` — Deal Pipeline (~10 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `deals.list` | query | `listDealsSchema` | `PaginatedResponse<Deal>` | venture | List deals with pipeline view. |
| `deals.getById` | query | `idParamSchema` | `Deal` | venture | Get deal details. |
| `deals.create` | mutation | `createDealSchema` | `Deal` | venture | Create a new deal. |
| `deals.update` | mutation | `updateDealSchema` | `Deal` | venture | Update deal fields. |
| `deals.delete` | mutation | `idParamSchema` | `{ success }` | venture | Delete a deal. |
| `deals.moveStage` | mutation | `{ dealId, stageId }` | `Deal` | venture | Move deal to pipeline stage. |
| `deals.won` | mutation | `{ dealId, amount? }` | `Deal` | venture | Mark deal as won. |
| `deals.lost` | mutation | `{ dealId, reason }` | `Deal` | venture | Mark deal as lost. |
| `deals.listPipelines` | query | — | `Pipeline[]` | venture | List deal pipelines. |
| `deals.getPipelineStats` | query | `{ pipelineId }` | `PipelineStats` | venture | Get pipeline stage statistics. |

#### `crmV2` — Advanced CRM (~20+ procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `crmV2.customObjects.list` | query | — | `CustomObject[]` | admin | List custom object definitions. |
| `crmV2.customObjects.create` | mutation | `customObjectSchema` | `CustomObject` | admin | Define a new custom object type. |
| `crmV2.customObjects.records` | query | `{ objectId, filters }` | `PaginatedResponse<Record>` | venture | Query custom object records. |
| `crmV2.scoring.getDealScore` | query | `{ dealId }` | `DealScore` | venture | Get AI-generated deal score. |
| `crmV2.scoring.getLeadScore` | query | `{ contactId }` | `LeadScore` | venture | Get AI-generated lead score. |
| `crmV2.scoring.recalculate` | mutation | `{ entityType, entityId }` | `Score` | venture | Force score recalculation. |
| `crmV2.forecast.get` | query | `forecastSchema` | `Forecast` | admin | Get revenue forecast. |
| `crmV2.forecast.scenarios` | query | `{ pipelineId }` | `Scenario[]` | admin | Generate forecast scenarios. |
| `crmV2.duplicates.detect` | query | `{ entityType }` | `DuplicateSet[]` | venture | Find potential duplicates. |
| `crmV2.duplicates.merge` | mutation | `{ sourceId, targetId }` | `{ success }` | venture | Merge duplicate records. |
| `crmV2.smartViews.list` | query | — | `SmartView[]` | venture | List saved smart views. |
| `crmV2.smartViews.create` | mutation | `smartViewSchema` | `SmartView` | venture | Create a saved view. |

#### `entityGraph` — Cross-Entity Relationships (~10 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `entityGraph.getNode` | query | `{ entityType, entityId }` | `GraphNode` | admin | Get graph node for entity. |
| `entityGraph.getEdges` | query | `{ nodeId, direction? }` | `GraphEdge[]` | admin | Get node's relationships. |
| `entityGraph.createEdge` | mutation | `createEdgeSchema` | `GraphEdge` | admin | Create a relationship. |
| `entityGraph.deleteEdge` | mutation | `{ edgeId }` | `{ success }` | admin | Remove a relationship. |
| `entityGraph.traverse` | query | `{ startNodeId, depth, edgeTypes? }` | `GraphTraversal` | admin | Traverse the graph. |
| `entityGraph.search` | query | `{ query, entityTypes? }` | `GraphNode[]` | admin | Search across entities. |

---

### 5. Task & Project Management

#### `tasks` — Task CRUD (~12 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `tasks.list` | query | `listTasksSchema` | `PaginatedResponse<Task>` | venture | List tasks with filters. |
| `tasks.getById` | query | `idParamSchema` | `Task` | venture | Get task with subtasks and comments. |
| `tasks.create` | mutation | `createTaskSchema` | `Task` | venture | Create a new task. |
| `tasks.update` | mutation | `updateTaskSchema` | `Task` | venture | Update task fields. |
| `tasks.delete` | mutation | `idParamSchema` | `{ success }` | venture | Soft-delete a task. |
| `tasks.transition` | mutation | `{ taskId, status }` | `Task` | venture | Transition task status. |
| `tasks.assign` | mutation | `{ taskId, userId }` | `Task` | venture | Assign task to user. |
| `tasks.unassign` | mutation | `{ taskId, userId }` | `Task` | venture | Remove assignment. |
| `tasks.bulkUpdate` | mutation | `{ taskIds, fields }` | `BatchResult` | venture | Bulk update tasks. |
| `tasks.bulkDelete` | mutation | `idsParamSchema` | `BatchResult` | venture | Bulk delete tasks. |
| `tasks.search` | query | `{ query, filters? }` | `Task[]` | venture | Full-text task search. |
| `tasks.getSubtasks` | query | `{ parentId }` | `Task[]` | venture | List subtasks. |

#### `workflows` — Workflow Engine (~20+ procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `workflows.list` | query | `offsetPaginationSchema` | `PaginatedResponse<Workflow>` | venture | List workflows. |
| `workflows.getById` | query | `idParamSchema` | `Workflow` | venture | Get workflow definition. |
| `workflows.create` | mutation | `createWorkflowSchema` | `Workflow` | venture | Create a workflow. |
| `workflows.update` | mutation | `updateWorkflowSchema` | `Workflow` | venture | Update workflow graph. |
| `workflows.delete` | mutation | `idParamSchema` | `{ success }` | admin | Delete a workflow. |
| `workflows.publish` | mutation | `{ workflowId }` | `WorkflowVersion` | admin | Publish a workflow version. |
| `workflows.execute` | mutation | `{ workflowId, input }` | `Execution` | venture | Start workflow execution. |
| `workflows.getExecution` | query | `{ executionId }` | `Execution` | venture | Get execution status. |
| `workflows.listExecutions` | query | `{ workflowId }` | `Execution[]` | venture | List past executions. |
| `workflows.cancelExecution` | mutation | `{ executionId }` | `{ success }` | venture | Cancel running execution. |
| `workflows.retryStep` | mutation | `{ executionId, stepId }` | `{ success }` | venture | Retry a failed step. |
| `workflows.listTemplates` | query | — | `WorkflowTemplate[]` | venture | List workflow templates. |
| `workflows.createFromTemplate` | mutation | `{ templateId, name }` | `Workflow` | venture | Instantiate from template. |

#### `taskAnalytics` — Task Performance Metrics (~6 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `taskAnalytics.burndown` | query | `burndownSchema` | `BurndownData` | venture | Sprint burndown chart data. |
| `taskAnalytics.velocity` | query | `velocitySchema` | `VelocityData` | venture | Team velocity over sprints. |
| `taskAnalytics.throughput` | query | `dateRangeSchema` | `ThroughputData` | venture | Task completion throughput. |
| `taskAnalytics.cycleTime` | query | `dateRangeSchema` | `CycleTimeData` | venture | Average cycle time by type. |
| `taskAnalytics.distribution` | query | — | `DistributionData` | venture | Task distribution by status/assignee. |
| `taskAnalytics.aging` | query | — | `AgingData` | venture | Aging of open tasks. |

---

### 6. Communication & Contact Center

#### `conversations` — Conversation Management (~10 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `conversations.list` | query | `listConversationsSchema` | `PaginatedResponse<Conversation>` | protected | List conversations. |
| `conversations.getById` | query | `idParamSchema` | `ConversationWithMessages` | protected | Get conversation + messages. |
| `conversations.create` | mutation | `createConversationSchema` | `Conversation` | protected | Start a new conversation. |
| `conversations.sendMessage` | mutation | `messageSchema` | `Message` | protected | Send a message. |
| `conversations.close` | mutation | `{ conversationId }` | `{ success }` | protected | Close a conversation. |
| `conversations.assign` | mutation | `{ conversationId, agentId }` | `{ success }` | admin | Assign to an agent. |
| `conversations.transfer` | mutation | `{ conversationId, queueId }` | `{ success }` | protected | Transfer to a queue. |
| `conversations.addNote` | mutation | `{ conversationId, note }` | `Note` | protected | Add internal note. |

#### `contactCenter` — Advanced Contact Center (~15+ procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `contactCenter.powerDialer.start` | mutation | `{ listId }` | `DialerSession` | admin | Start a power dialer session. |
| `contactCenter.powerDialer.stop` | mutation | `{ sessionId }` | `{ success }` | admin | Stop a dialer session. |
| `contactCenter.powerDialer.next` | mutation | `{ sessionId }` | `DialerCall` | admin | Get next number to dial. |
| `contactCenter.supervisor.monitor` | query | — | `SupervisorDashboard` | admin | Real-time queue dashboard. |
| `contactCenter.supervisor.whisper` | mutation | `{ conversationId, message }` | `{ success }` | admin | Whisper to agent. |
| `contactCenter.supervisor.barge` | mutation | `{ conversationId }` | `{ success }` | admin | Barge into conversation. |
| `contactCenter.sla.list` | query | — | `SLAPolicy[]` | admin | List SLA policies. |
| `contactCenter.sla.create` | mutation | `slaPolicySchema` | `SLAPolicy` | admin | Create an SLA policy. |
| `contactCenter.sla.breaches` | query | `dateRangeSchema` | `SLABreach[]` | admin | List SLA breaches. |
| `contactCenter.csat.send` | mutation | `{ conversationId }` | `{ success }` | admin | Send CSAT survey. |
| `contactCenter.csat.results` | query | `dateRangeSchema` | `CSATResults` | admin | Get CSAT analytics. |
| `contactCenter.routing.getRules` | query | — | `RoutingRule[]` | admin | Get routing rules. |
| `contactCenter.routing.setRules` | mutation | `{ rules }` | `{ success }` | admin | Update routing rules. |

---

### 7. Calendar & Scheduling

#### `calendar` — Full Calendar System (~32 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `calendar.list` | query | — | `Calendar[]` | permission | List user's calendars. |
| `calendar.create` | mutation | `createCalendarSchema` | `Calendar` | permission | Create a new calendar. |
| `calendar.update` | mutation | `updateCalendarSchema` | `Calendar` | permission | Update calendar settings. |
| `calendar.delete` | mutation | `idParamSchema` | `{ success }` | permission | Delete a calendar. |
| `calendar.events.list` | query | `dateRangeSchema` | `Event[]` | permission | List events in range. |
| `calendar.events.create` | mutation | `createEventSchema` | `Event` | permission | Create an event. |
| `calendar.events.update` | mutation | `updateEventSchema` | `Event` | permission | Update an event. |
| `calendar.events.delete` | mutation | `idParamSchema` | `{ success }` | permission | Delete an event. |
| `calendar.availability.get` | query | `{ userId, date }` | `AvailabilitySlots` | permission | Get user availability. |
| `calendar.availability.setRules` | mutation | `availabilityRulesSchema` | `{ success }` | permission | Set availability rules. |
| `calendar.availability.overrides` | mutation | `overrideSchema` | `{ success }` | permission | Add date overrides. |
| `calendar.availability.team` | query | `{ userIds, date }` | `TeamAvailability` | permission | Team availability matrix. |
| `calendar.appointments.book` | mutation | `bookAppointmentSchema` | `Appointment` | permission | Book an appointment. |
| `calendar.appointments.reschedule` | mutation | `rescheduleSchema` | `Appointment` | permission | Reschedule appointment. |
| `calendar.appointments.cancel` | mutation | `{ appointmentId, reason? }` | `{ success }` | permission | Cancel appointment. |
| `calendar.appointments.agenda` | query | `dateRangeSchema` | `Appointment[]` | permission | Get appointment agenda. |
| `calendar.reminders.list` | query | `{ appointmentId }` | `Reminder[]` | permission | List reminders. |
| `calendar.reminders.create` | mutation | `reminderSchema` | `Reminder` | permission | Create a reminder. |
| `calendar.roundRobin.configure` | mutation | `roundRobinSchema` | `{ success }` | admin | Configure round-robin. |
| `calendar.bookingPages.list` | query | — | `BookingPage[]` | permission | List booking pages. |
| `calendar.bookingPages.create` | mutation | `bookingPageSchema` | `BookingPage` | permission | Create booking page. |
| `calendar.bookingPages.update` | mutation | `updateBookingPageSchema` | `BookingPage` | permission | Update booking page. |
| `calendar.public.getPage` | query | `{ slug }` | `PublicBookingPage` | public | Get public booking page. |
| `calendar.public.getSlots` | query | `{ pageId, date }` | `Slot[]` | public | Get available slots (public). |
| `calendar.public.book` | mutation | `publicBookSchema` | `Booking` | public | Book from public page. |
| `calendar.googleSync.connect` | mutation | `{ authCode }` | `{ success }` | permission | Connect Google Calendar. |
| `calendar.googleSync.disconnect` | mutation | — | `{ success }` | permission | Disconnect Google Calendar. |
| `calendar.googleSync.sync` | mutation | — | `SyncResult` | permission | Trigger manual sync. |
| `calendar.googleSync.status` | query | — | `SyncStatus` | permission | Get sync status. |

---

### 8. Commerce & Payments

#### `catalog` — Product Catalog (~48 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `catalog.products.list` | query | `listProductsSchema` | `PaginatedResponse<Product>` | venture | List products. |
| `catalog.products.create` | mutation | `createProductSchema` | `Product` | admin | Create a product. |
| `catalog.products.update` | mutation | `updateProductSchema` | `Product` | admin | Update a product. |
| `catalog.products.delete` | mutation | `idParamSchema` | `{ success }` | admin | Delete a product. |
| `catalog.categories.list` | query | — | `Category[]` | venture | List categories. |
| `catalog.categories.create` | mutation | `createCategorySchema` | `Category` | admin | Create a category. |
| `catalog.discounts.list` | query | — | `Discount[]` | admin | List discounts. |
| `catalog.discounts.create` | mutation | `createDiscountSchema` | `Discount` | admin | Create a discount. |
| `catalog.discounts.validate` | query | `{ code, cartTotal }` | `DiscountResult` | venture | Validate a discount code. |
| `catalog.inventory.get` | query | `{ productId }` | `InventoryLevel` | venture | Get stock level. |
| `catalog.inventory.adjust` | mutation | `adjustInventorySchema` | `InventoryLevel` | admin | Adjust stock. |
| `catalog.priceRules.list` | query | — | `PriceRule[]` | admin | List pricing rules. |
| `catalog.priceRules.create` | mutation | `priceRuleSchema` | `PriceRule` | admin | Create pricing rule. |
| `catalog.collections.list` | query | — | `Collection[]` | venture | List collections. |
| `catalog.collections.create` | mutation | `collectionSchema` | `Collection` | admin | Create a collection. |
| `catalog.tax.getRates` | query | `{ region }` | `TaxRate[]` | admin | Get tax rates by region. |
| `catalog.tax.setRates` | mutation | `taxRateSchema` | `{ success }` | superAdmin | Configure tax rates. |

#### `payments` — Stripe Connect Payments (varies)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `payments.createCheckout` | mutation | `checkoutSchema` | `{ url, sessionId }` | venture | Create Stripe Checkout session. |
| `payments.getSession` | query | `{ sessionId }` | `PaymentSession` | venture | Get payment session status. |
| `payments.listTransactions` | query | `dateRangeSchema` | `Transaction[]` | admin | List transactions. |
| `payments.refund` | mutation | `{ transactionId, amount? }` | `Refund` | admin | Issue a refund. |
| `payments.connect.onboard` | mutation | `{ ventureId }` | `{ url }` | admin | Start Stripe Connect onboarding. |
| `payments.connect.status` | query | — | `ConnectStatus` | admin | Get Connect account status. |
| `payments.subscriptions.list` | query | — | `Subscription[]` | admin | List subscriptions. |
| `payments.subscriptions.cancel` | mutation | `{ subscriptionId }` | `{ success }` | admin | Cancel a subscription. |

#### `invoicing` — Advanced Invoicing (~15+ procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `invoicing.create` | mutation | `createInvoiceSchema` | `Invoice` | admin | Create an invoice. |
| `invoicing.update` | mutation | `updateInvoiceSchema` | `Invoice` | admin | Update draft invoice. |
| `invoicing.send` | mutation | `{ invoiceId }` | `{ success }` | admin | Send invoice to client. |
| `invoicing.list` | query | `listInvoicesSchema` | `PaginatedResponse<Invoice>` | admin | List invoices. |
| `invoicing.getById` | query | `idParamSchema` | `Invoice` | admin | Get invoice details. |
| `invoicing.markPaid` | mutation | `{ invoiceId, amount }` | `Invoice` | admin | Record payment. |
| `invoicing.void` | mutation | `{ invoiceId }` | `{ success }` | admin | Void an invoice. |
| `invoicing.recurring.create` | mutation | `recurringSchema` | `RecurringInvoice` | admin | Set up recurring invoice. |
| `invoicing.recurring.list` | query | — | `RecurringInvoice[]` | admin | List recurring invoices. |
| `invoicing.creditNote.create` | mutation | `creditNoteSchema` | `CreditNote` | admin | Issue a credit note. |
| `invoicing.proposals.create` | mutation | `proposalSchema` | `Proposal` | admin | Create a proposal. |
| `invoicing.proposals.accept` | mutation | `{ proposalId }` | `Invoice` | public | Accept → auto-generate invoice. |
| `invoicing.platformFees.configure` | mutation | `feeSchema` | `{ success }` | superAdmin | Configure platform fees. |

---

### 9. Marketing & Content

#### `marketing` — Marketing Automation (~10 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `marketing.campaigns.list` | query | `offsetPaginationSchema` | `PaginatedResponse<Campaign>` | admin | List campaigns. |
| `marketing.campaigns.create` | mutation | `createCampaignSchema` | `Campaign` | admin | Create a campaign. |
| `marketing.campaigns.update` | mutation | `updateCampaignSchema` | `Campaign` | admin | Update a campaign. |
| `marketing.campaigns.activate` | mutation | `{ campaignId }` | `{ success }` | admin | Activate a campaign. |
| `marketing.campaigns.pause` | mutation | `{ campaignId }` | `{ success }` | admin | Pause a campaign. |
| `marketing.campaigns.analytics` | query | `{ campaignId }` | `CampaignAnalytics` | admin | Get campaign performance. |
| `marketing.social.connect` | mutation | `{ platform, authCode }` | `{ success }` | admin | Connect social platform. |
| `marketing.social.post` | mutation | `socialPostSchema` | `Post` | admin | Publish social media post. |
| `marketing.ads.create` | mutation | `adCampaignSchema` | `AdCampaign` | admin | Create ad campaign. |
| `marketing.creatives.upload` | mutation | `creativeSchema` | `Creative` | admin | Upload creative asset. |

#### `reputation` — Reviews & Reputation (~12 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `reputation.reviews.list` | query | `listReviewsSchema` | `PaginatedResponse<Review>` | venture | List reviews. |
| `reputation.reviews.sync` | mutation | — | `SyncResult` | admin | Sync reviews from platforms. |
| `reputation.reviews.respond` | mutation | `{ reviewId, response }` | `Review` | admin | Respond to a review. |
| `reputation.reviews.aiResponse` | mutation | `{ reviewId }` | `{ response }` | admin | Generate AI response. |
| `reputation.requests.send` | mutation | `reviewRequestSchema` | `{ success }` | admin | Send review request. |
| `reputation.requests.campaign` | mutation | `campaignSchema` | `Campaign` | admin | Create review request campaign. |
| `reputation.analytics.overview` | query | `dateRangeSchema` | `ReputationOverview` | admin | Get reputation overview. |
| `reputation.analytics.sentiment` | query | `dateRangeSchema` | `SentimentReport` | admin | Sentiment analysis report. |
| `reputation.competitors.list` | query | — | `Competitor[]` | admin | List tracked competitors. |
| `reputation.competitors.add` | mutation | `{ name, placeId }` | `Competitor` | admin | Track a competitor. |
| `reputation.widgets.create` | mutation | `widgetSchema` | `Widget` | admin | Create embeddable widget. |
| `reputation.widgets.getEmbed` | query | `{ widgetId }` | `EmbedCode` | public | Get widget embed code. |

#### `forms` — Form Builder (~12 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `forms.list` | query | `offsetPaginationSchema` | `PaginatedResponse<Form>` | venture | List forms. |
| `forms.create` | mutation | `formBuilderSchema` | `Form` | venture | Create a form. |
| `forms.update` | mutation | `updateFormSchema` | `Form` | venture | Update form definition. |
| `forms.delete` | mutation | `idParamSchema` | `{ success }` | venture | Delete a form. |
| `forms.publish` | mutation | `{ formId }` | `{ success }` | venture | Publish a form. |
| `forms.submissions.list` | query | `{ formId }` | `PaginatedResponse<Submission>` | venture | List form submissions. |
| `forms.submissions.export` | query | `{ formId, format }` | `ExportData` | venture | Export submissions. |
| `forms.analytics.get` | query | `{ formId }` | `FormAnalytics` | venture | Get form performance analytics. |
| `forms.embed.getCode` | query | `{ formId }` | `EmbedCode` | venture | Get embed code. |
| `forms.public.getForm` | query | `{ slug }` | `PublicForm` | public | Get public form. |
| `forms.public.submit` | mutation | `submissionSchema` | `{ success }` | public | Submit a public form. |

---

### 10. Documents & Storage

#### `storage` — File Management (~8 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `storage.upload` | mutation | `uploadSchema` | `FileRecord` | protected | Upload a file. |
| `storage.getUrl` | query | `{ fileId }` | `{ url, expiresAt }` | protected | Get signed download URL. |
| `storage.list` | query | `{ folder? }` | `FileRecord[]` | protected | List files. |
| `storage.delete` | mutation | `idParamSchema` | `{ success }` | protected | Delete a file. |
| `storage.move` | mutation | `{ fileId, folder }` | `FileRecord` | protected | Move file to folder. |
| `storage.createFolder` | mutation | `{ name, parent? }` | `Folder` | protected | Create a folder. |
| `storage.getUsage` | query | — | `StorageUsage` | protected | Get storage usage stats. |
| `storage.bulkDelete` | mutation | `idsParamSchema` | `BatchResult` | protected | Bulk delete files. |

#### `documentEditor` — Block Document Editor (~8 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `documentEditor.list` | query | `offsetPaginationSchema` | `PaginatedResponse<Document>` | venture | List documents. |
| `documentEditor.create` | mutation | `createDocumentSchema` | `Document` | venture | Create a document. |
| `documentEditor.getById` | query | `idParamSchema` | `DocumentWithBlocks` | venture | Get document + blocks. |
| `documentEditor.update` | mutation | `updateDocumentSchema` | `Document` | venture | Update document metadata. |
| `documentEditor.updateBlocks` | mutation | `{ documentId, blocks }` | `{ success }` | venture | Save block content. |
| `documentEditor.delete` | mutation | `idParamSchema` | `{ success }` | venture | Delete a document. |
| `documentEditor.duplicate` | mutation | `{ documentId }` | `Document` | venture | Duplicate a document. |
| `documentEditor.export` | query | `{ documentId, format }` | `ExportData` | venture | Export as PDF/HTML. |

#### `comments` — Universal Comments (~6 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `comments.list` | query | `{ entityType, entityId }` | `Comment[]` | protected | List comments on entity. |
| `comments.create` | mutation | `createCommentSchema` | `Comment` | protected | Add a comment. |
| `comments.update` | mutation | `updateCommentSchema` | `Comment` | protected | Edit own comment. |
| `comments.delete` | mutation | `idParamSchema` | `{ success }` | protected | Delete own comment. |
| `comments.reply` | mutation | `{ parentId, content }` | `Comment` | protected | Reply to a comment. |
| `comments.react` | mutation | `{ commentId, emoji }` | `{ success }` | protected | React to a comment. |

---

### 11. Analytics & Observability

#### `analytics` — Analytics Hub (~10 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `analytics.dashboards.list` | query | — | `Dashboard[]` | admin | List dashboards. |
| `analytics.dashboards.create` | mutation | `dashboardSchema` | `Dashboard` | admin | Create a dashboard. |
| `analytics.dashboards.getById` | query | `idParamSchema` | `DashboardWithWidgets` | admin | Get dashboard + widgets. |
| `analytics.metrics.query` | query | `metricSchema` | `MetricResult` | admin | Query a metric. |
| `analytics.metrics.aggregate` | query | `aggregateSchema` | `AggregateResult` | admin | Aggregate across metrics. |
| `analytics.metrics.timeSeries` | query | `timeSeriesSchema` | `TimeSeriesData` | admin | Time series data. |
| `analytics.reports.generate` | mutation | `reportSchema` | `Report` | admin | Generate a report. |
| `analytics.reports.schedule` | mutation | `scheduleSchema` | `ScheduledReport` | admin | Schedule recurring report. |
| `analytics.exports.csv` | query | `exportSchema` | `ExportData` | admin | Export data as CSV. |
| `analytics.realtime.snapshot` | query | — | `RealtimeSnapshot` | admin | Real-time metrics snapshot. |

#### `audit` — Audit Trail (~6 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `audit.list` | query | `listAuditSchema` | `PaginatedResponse<AuditEntry>` | admin | List audit entries. |
| `audit.getById` | query | `idParamSchema` | `AuditEntry` | admin | Get audit entry details. |
| `audit.search` | query | `{ query, filters }` | `AuditEntry[]` | admin | Search audit log. |
| `audit.export` | query | `dateRangeSchema` | `ExportData` | admin | Export audit log. |
| `audit.getEntityHistory` | query | `{ entityType, entityId }` | `AuditEntry[]` | admin | Get entity change history. |
| `audit.getUserActivity` | query | `{ userId, range }` | `AuditEntry[]` | admin | Get user activity log. |

#### `notifications` — Notification System (~8 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `notifications.list` | query | `offsetPaginationSchema` | `PaginatedResponse<Notification>` | protected | List notifications. |
| `notifications.markRead` | mutation | `{ notificationId }` | `{ success }` | protected | Mark as read. |
| `notifications.markAllRead` | mutation | — | `{ success }` | protected | Mark all as read. |
| `notifications.delete` | mutation | `idParamSchema` | `{ success }` | protected | Delete a notification. |
| `notifications.getPreferences` | query | — | `NotificationPreferences` | protected | Get delivery preferences. |
| `notifications.updatePreferences` | mutation | `preferencesSchema` | `{ success }` | protected | Update preferences. |
| `notifications.unreadCount` | query | — | `{ count }` | protected | Get unread count. |
| `notifications.send` | mutation | `sendNotificationSchema` | `{ success }` | admin | Send a notification to users. |

---

### 12. Platform Operations

#### `flags` — Feature Flags (~6 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `flags.list` | query | — | `FeatureFlag[]` | admin | List all feature flags. |
| `flags.get` | query | `{ key }` | `FeatureFlag` | admin | Get flag by key. |
| `flags.create` | mutation | `createFlagSchema` | `FeatureFlag` | admin | Create a feature flag. |
| `flags.update` | mutation | `updateFlagSchema` | `FeatureFlag` | admin | Update flag configuration. |
| `flags.toggle` | mutation | `{ key, enabled }` | `{ success }` | admin | Toggle flag on/off. |
| `flags.evaluate` | query | `{ key, context? }` | `{ value }` | protected | Evaluate flag for current user. |

#### `webhooks` — Webhook Management (~8 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `webhooks.list` | query | — | `Webhook[]` | admin | List webhooks. |
| `webhooks.create` | mutation | `createWebhookSchema` | `Webhook` | admin | Create a webhook. |
| `webhooks.update` | mutation | `updateWebhookSchema` | `Webhook` | admin | Update a webhook. |
| `webhooks.delete` | mutation | `idParamSchema` | `{ success }` | admin | Delete a webhook. |
| `webhooks.test` | mutation | `{ webhookId }` | `TestResult` | admin | Send test payload. |
| `webhooks.getDeliveries` | query | `{ webhookId }` | `Delivery[]` | admin | List delivery history. |
| `webhooks.retryDelivery` | mutation | `{ deliveryId }` | `{ success }` | admin | Retry failed delivery. |
| `webhooks.rotateSecret` | mutation | `{ webhookId }` | `{ secret }` | admin | Rotate signing secret. |

#### `integrations` — OAuth Integrations (~8 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `integrations.list` | query | — | `Integration[]` | admin | List connected integrations. |
| `integrations.connect` | mutation | `{ provider, authCode }` | `Integration` | admin | Connect an OAuth integration. |
| `integrations.disconnect` | mutation | `{ integrationId }` | `{ success }` | admin | Disconnect integration. |
| `integrations.getStatus` | query | `{ integrationId }` | `IntegrationStatus` | admin | Get connection status. |
| `integrations.refreshToken` | mutation | `{ integrationId }` | `{ success }` | admin | Force token refresh. |
| `integrations.listAvailable` | query | — | `AvailableIntegration[]` | admin | List available providers. |
| `integrations.getConfig` | query | `{ integrationId }` | `IntegrationConfig` | admin | Get integration config. |
| `integrations.updateConfig` | mutation | `{ integrationId, config }` | `{ success }` | admin | Update integration config. |

#### `portfolio` — Cross-Venture Portfolio (~8 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `portfolio.overview` | query | — | `PortfolioOverview` | superAdmin | Get portfolio-wide overview. |
| `portfolio.ventures` | query | `portfolioQuerySchema` | `VentureMetric[]` | superAdmin | Get per-venture metrics. |
| `portfolio.compare` | query | `{ ventureIds, metrics }` | `ComparisonData` | superAdmin | Compare ventures. |
| `portfolio.trends` | query | `dateRangeSchema` | `TrendData` | superAdmin | Portfolio trend analysis. |
| `portfolio.allocations` | query | — | `AllocationData` | superAdmin | Resource allocation view. |
| `portfolio.risks` | query | — | `RiskAssessment[]` | superAdmin | Risk assessment across ventures. |
| `portfolio.reports.generate` | mutation | `reportSchema` | `Report` | superAdmin | Generate portfolio report. |
| `portfolio.reports.schedule` | mutation | `scheduleSchema` | `ScheduledReport` | superAdmin | Schedule portfolio report. |

#### `treasury` — Financial Oversight (~10 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `treasury.overview` | query | — | `TreasuryOverview` | admin | Treasury dashboard. |
| `treasury.budgets.list` | query | — | `Budget[]` | admin | List budgets. |
| `treasury.budgets.create` | mutation | `budgetSchema` | `Budget` | admin | Create a budget. |
| `treasury.budgets.update` | mutation | `updateBudgetSchema` | `Budget` | admin | Update a budget. |
| `treasury.transactions.list` | query | `dateRangeSchema` | `Transaction[]` | admin | List transactions. |
| `treasury.transactions.categorize` | mutation | `{ transactionId, category }` | `{ success }` | admin | Categorize transaction. |
| `treasury.reports.cashflow` | query | `dateRangeSchema` | `CashflowReport` | admin | Cash flow report. |
| `treasury.reports.pnl` | query | `dateRangeSchema` | `PnLReport` | admin | Profit & loss report. |
| `treasury.forecasts.get` | query | `{ horizon }` | `FinancialForecast` | admin | Financial forecast. |
| `treasury.tokenEconomy.overview` | query | — | `TokenOverview` | superAdmin | Token economy overview. |

#### `strategy` — Strategic Planning (~10 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `strategy.objectives.list` | query | — | `Objective[]` | admin | List strategic objectives. |
| `strategy.objectives.create` | mutation | `objectiveSchema` | `Objective` | admin | Create an objective. |
| `strategy.objectives.update` | mutation | `updateObjectiveSchema` | `Objective` | admin | Update an objective. |
| `strategy.roadmap.get` | query | `{ ventureId }` | `Roadmap` | admin | Get venture roadmap. |
| `strategy.roadmap.update` | mutation | `roadmapSchema` | `Roadmap` | admin | Update roadmap. |
| `strategy.kpis.list` | query | — | `KPI[]` | admin | List KPIs. |
| `strategy.kpis.track` | mutation | `{ kpiId, value }` | `{ success }` | admin | Record KPI measurement. |
| `strategy.investors.list` | query | — | `InvestorRelation[]` | superAdmin | List investor relations. |
| `strategy.investors.report` | query | `{ investorId }` | `InvestorReport` | superAdmin | Generate investor report. |
| `strategy.ma.opportunities` | query | — | `MAOpportunity[]` | superAdmin | List M&A opportunities. |

---

### 13. Grants & Funding

#### `grants` — Grant Concierge (~12 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `grants.opportunities.list` | query | `listOpportunitiesSchema` | `PaginatedResponse<Opportunity>` | venture | List grant opportunities. |
| `grants.opportunities.getById` | query | `idParamSchema` | `OpportunityDetail` | venture | Get opportunity details. |
| `grants.opportunities.match` | query | `{ ventureId }` | `MatchedOpportunity[]` | venture | AI-matched opportunities. |
| `grants.applications.list` | query | `offsetPaginationSchema` | `PaginatedResponse<Application>` | venture | List applications. |
| `grants.applications.create` | mutation | `applicationSchema` | `Application` | venture | Start an application. |
| `grants.applications.update` | mutation | `updateApplicationSchema` | `Application` | venture | Update application. |
| `grants.applications.submit` | mutation | `{ applicationId }` | `{ success }` | venture | Submit application. |
| `grants.applications.getStatus` | query | `{ applicationId }` | `ApplicationStatus` | venture | Get application status. |
| `grants.documents.list` | query | `{ applicationId }` | `Document[]` | venture | List application documents. |
| `grants.documents.upload` | mutation | `{ applicationId, file }` | `Document` | venture | Upload application document. |
| `grants.calendar.deadlines` | query | `dateRangeSchema` | `Deadline[]` | venture | Get upcoming grant deadlines. |
| `grants.analytics.overview` | query | — | `GrantAnalytics` | admin | Grant application analytics. |

---

### 14. Tags & Metadata

#### `tags` — Universal Tagging (~6 procedures)

| Procedure | Type | Input Schema | Output | Auth | Description |
|-----------|------|-------------|--------|------|-------------|
| `tags.list` | query | `{ entityType? }` | `Tag[]` | protected | List tags. |
| `tags.create` | mutation | `{ name, color? }` | `Tag` | protected | Create a tag. |
| `tags.update` | mutation | `{ tagId, name?, color? }` | `Tag` | protected | Update a tag. |
| `tags.delete` | mutation | `idParamSchema` | `{ success }` | protected | Delete a tag. |
| `tags.attach` | mutation | `{ tagId, entityType, entityId }` | `{ success }` | protected | Attach tag to entity. |
| `tags.detach` | mutation | `{ tagId, entityType, entityId }` | `{ success }` | protected | Detach tag from entity. |

---

## Middleware Chain

Every request passes through a composable middleware pipeline. The chain varies by procedure type.

### Pipeline Order

```
Request → HTTP Adapter → createContext() → [Middleware Chain] → Zod Input Validation → Handler → SuperJSON Serialize → Response

Middleware Chain (varies by procedure):
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    Logger     │ → │ Rate Limiter │ → │    Auth      │ → │  Permission  │
│  (always)     │   │ (if needed)  │   │ (if needed)  │   │ (if needed)  │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

### Logger Middleware

Applied to **every** procedure. Logs request lifecycle:

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | tRPC path (e.g., `auth.login`, `catalog.products.list`) |
| `type` | string | `query` or `mutation` |
| `requestId` | string | UUID from `x-request-id` or auto-generated |
| `userId` | string? | Authenticated user's ID |
| `durationMs` | number | Wall-clock execution time |
| `error` | object? | Error details on failure |

### Rate Limiter Middleware

Sliding window algorithm with in-memory storage. Five presets:

| Preset | Limit | Window | Key Strategy | Applied To |
|--------|-------|--------|-------------|------------|
| `auth` | 5 req | 60s | Client IP | Login, signup, password reset |
| `general` | 100 req | 60s | User ID (fallback: IP) | Standard authenticated endpoints |
| `public` | 50 req | 60s | Client IP | Unauthenticated public APIs |
| `strict` | 3 req | 60s | Client IP | Highly sensitive operations |
| `relaxed` | 500 req | 60s | User ID (fallback: IP) | High-throughput endpoints |

**Composite key format:** `{tRPC_path}:{identifier}`

**Response Headers:**

```
# Normal response
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706300060

# 429 response (additional)
Retry-After: 15
```

### Authentication Middleware

Six auth enforcement middlewares, each narrowing `Context`:

| Middleware | Validates | Throws | Context Narrowing |
|-----------|----------|--------|-------------------|
| `isAuthenticated` | Session + user + "active" status | `UNAUTHORIZED` / `FORBIDDEN` | `→ AuthenticatedContext` |
| `isAdmin` | Permissions tier 0 or 1 | `FORBIDDEN` | `→ AdminContext` |
| `isSuperAdmin` | Permissions tier 0 | `FORBIDDEN` | `→ SuperAdminContext` |
| `hasVentureContext` | Auth + `ctx.venture` exists | `BAD_REQUEST` | `→ VentureContextRequired` |
| `isAgent` | `x-agent-id` header present | `UNAUTHORIZED` | `→ AgentContext` |
| `requirePermission(r,a)` | Auth + `checkPermission(resource, action)` | `FORBIDDEN` | `→ AuthenticatedContext` |

---

## Error Codes & Handling

### tRPC Error Codes

| Code | HTTP Status | Description | Common Causes |
|------|-------------|-------------|---------------|
| `BAD_REQUEST` | 400 | Invalid input | Zod validation failure, missing required fields |
| `UNAUTHORIZED` | 401 | Not authenticated | Missing/expired session, invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions | RBAC tier too low, permission denied, suspended user |
| `NOT_FOUND` | 404 | Resource not found | Invalid ID, deleted record, wrong venture scope |
| `METHOD_NOT_SUPPORTED` | 405 | Wrong HTTP method | GET for mutation, POST for query |
| `TIMEOUT` | 408 | Request timeout | Long-running operation exceeded deadline |
| `CONFLICT` | 409 | Resource conflict | Duplicate entry, concurrent modification |
| `PAYLOAD_TOO_LARGE` | 413 | Request too large | File upload exceeds limit |
| `TOO_MANY_REQUESTS` | 429 | Rate limited | Exceeded rate limit preset |
| `INTERNAL_SERVER_ERROR` | 500 | Server error | Unhandled exception, database error |

### Error Response Shape

```typescript
{
  error: {
    message: "Validation failed",
    code: "BAD_REQUEST",
    data: {
      code: "BAD_REQUEST",
      httpStatus: 400,
      path: "auth.login",
      // Zod errors (only on validation failures)
      zodError: {
        fieldErrors: {
          email: ["Invalid email format"],
          password: ["String must contain at least 8 characters"]
        },
        formErrors: []
      },
      // Stack trace (development only)
      stack: "Error: Validation failed\n    at ..."
    }
  }
}
```

### Domain-Specific Error Patterns

```typescript
// Venture suspended
throw new TRPCError({
  code: "FORBIDDEN",
  message: "Venture is suspended. Contact support.",
});

// Resource not found (venture-scoped)
throw new TRPCError({
  code: "NOT_FOUND",
  message: `Contact ${id} not found in venture ${ventureId}`,
});

// Rate limited
throw new TRPCError({
  code: "TOO_MANY_REQUESTS",
  message: "Rate limit exceeded. Retry after 15 seconds.",
  cause: { retryAfter: 15, limit: 5, windowMs: 60000 },
});

// Permission denied
throw new TRPCError({
  code: "FORBIDDEN",
  message: "Permission denied: requires 'contacts:write'",
});
```

---

## WebSocket Subscriptions

tRPC subscriptions enable real-time data delivery over WebSocket connections. The API uses `wsLink` for persistent bidirectional communication.

### Subscription Endpoints

| Subscription | Input | Emits | Description |
|-------------|-------|-------|-------------|
| `notifications.onNew` | — | `Notification` | Real-time notification delivery |
| `conversations.onMessage` | `{ conversationId }` | `Message` | New messages in conversation |
| `conversations.onTyping` | `{ conversationId }` | `TypingIndicator` | Typing indicators |
| `tasks.onUpdate` | `{ projectId? }` | `TaskEvent` | Task status changes |
| `workflows.onExecutionUpdate` | `{ executionId }` | `ExecutionEvent` | Workflow execution progress |
| `analytics.realtime` | `{ dashboardId }` | `MetricUpdate` | Real-time metric updates |
| `agentTasks.onAssigned` | `{ agentId }` | `AgentTask` | New task assigned to agent |
| `contactCenter.onQueueUpdate` | `{ queueId }` | `QueueUpdate` | Queue status changes |
| `hitl.onPending` | — | `HITLApproval` | New items pending approval |

### WebSocket Connection

```typescript
// Client setup
import { createWSClient, wsLink } from '@trpc/client';

const wsClient = createWSClient({
  url: 'wss://app.mcv.one/api/trpc',
});

const trpc = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: wsLink({ client: wsClient }),
      false: httpBatchLink({ url: '/api/trpc' }),
    }),
  ],
});

// Subscribe to notifications
const unsubscribe = trpc.notifications.onNew.subscribe(undefined, {
  onData: (notification) => {
    console.log('New notification:', notification);
  },
  onError: (err) => {
    console.error('Subscription error:', err);
  },
});
```

---

## Schema Reference

### Common Schema Primitives

All schemas are Zod-based and reusable across routers.

```typescript
// IDs
uuidSchema          // z.string().uuid()
uuidArraySchema     // z.array(uuidSchema)
idParamSchema       // z.object({ id: uuidSchema })
idsParamSchema      // z.object({ ids: uuidArraySchema.min(1).max(100) })

// Pagination
offsetPaginationSchema   // { page: 1..∞ (default 1), pageSize: 1..100 (default 20) }
cursorPaginationSchema   // { cursor: string?, limit: 1..100 (default 20) }
paginationMetaSchema     // { total, page, pageSize, totalPages, hasMore, hasPrevious }

// Sorting & Filtering
sortDirectionSchema      // z.enum(["asc", "desc"])
sortSchema               // { field: string, direction: sortDirectionSchema }
dateRangeSchema          // { from?: Date, to?: Date }
filterOperatorSchema     // z.enum(["eq","neq","gt","gte","lt","lte","like","in","nin","null","notNull"])

// Status
statusSchema             // z.enum(["active","inactive","pending","suspended","archived"])
userStatusSchema         // z.enum(["active","suspended","banned","deleted"])
ventureStatusSchema      // z.enum(["active","suspended","archived","pending"])

// Response Wrappers
successResponseSchema(T) // { success: boolean, data: T }
listResponseSchema(T)    // { items: T[], meta: paginationMeta }
batchResultSchema        // { succeeded: number, failed: number, errors: [{ id, error }] }
```

### Schema Module Catalog (42 modules)

| Module | Domain | Key Schemas |
|--------|--------|-------------|
| `auth.schema.ts` | Authentication | `loginSchema`, `signupSchema`, `resetPasswordSchema`, `walletVerifySchema` |
| `common.schema.ts` | Shared | `offsetPaginationSchema`, `dateRangeSchema`, `uuidSchema` |
| `user.schema.ts` | Users | `createUserSchema`, `updateUserSchema`, `listUsersSchema` |
| `venture.schema.ts` | Ventures | `createVentureSchema`, `updateVentureSchema` |
| `task.schema.ts` | Tasks | `createTaskSchema`, `updateTaskSchema`, `listTasksSchema` |
| `task-extended.schema.ts` | Agent Tasks | `queueForAgentSchema`, `agentClaimTaskSchema` |
| `workflow.schema.ts` | Workflows | `workflowNodeSchema`, `workflowEdgeSchema`, `conditionGroupSchema` |
| `calendar.schema.ts` | Calendar | `createCalendarSchema`, `bookAppointmentSchema`, `publicBookSchema` |
| `contact.schema.ts` | CRM | `createContactSchema`, `searchSchema` |
| `deal.schema.ts` | Deals | `createDealSchema`, `pipelineSchema` |
| `catalog.schema.ts` | Commerce | `createProductSchema`, `createDiscountSchema` |
| `crm-v2.schema.ts` | Advanced CRM | `customObjectSchema`, `forecastSchema` |
| `intelligence.schema.ts` | Intelligence | `ventureIntelligenceSchema`, `entityIntelligenceSchema` |
| `hitl.schema.ts` | HITL | `createHITLApprovalSchema`, `resolveHITLApprovalSchema` |
| `rag.schema.ts` | RAG | `querySchema`, `uploadSchema` |
| `form.schema.ts` | Forms | `formBuilderSchema`, `submissionSchema` |
| `reputation.schema.ts` | Reviews | `reviewRequestSchema`, `responseSchema` |
| `grant-concierge.schema.ts` | Grants | `applicationSchema`, `opportunitySchema` |
| `entity-graph.schema.ts` | Graph | `createNodeSchema`, `createEdgeSchema` |
| `token-economy.schema.ts` | Web3 | `stakingSchema`, `governanceSchema` |
| `strategy.schema.ts` | Strategy | `objectiveSchema`, `roadmapSchema` |
| `treasury.schema.ts` | Treasury | `budgetSchema`, `transactionSchema` |
| `portfolio.schema.ts` | Portfolio | `portfolioQuerySchema` |
| `sprint.schema.ts` | Sprints | `createSprintSchema` |
| `time-entry.schema.ts` | Time Tracking | `createTimeEntrySchema` |
| `automation-rule.schema.ts` | Automation | `createRuleSchema`, `conditionSchema` |
| `role.schema.ts` | Roles | `createRoleSchema` |
| `project.schema.ts` | Projects | `createProjectSchema` |
| `branding.schema.ts` | Branding | `brandingConfigSchema` |
| `passkey.schema.ts` | WebAuthn | `registrationSchema`, `verificationSchema` |

---

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | — | Better Auth JWT signing secret |
| `BETTER_AUTH_URL` | Yes | — | Better Auth base URL |
| `RATE_LIMIT_ENABLED` | No | `true` | Enable/disable rate limiting |
| `RATE_LIMIT_STORE` | No | `memory` | Rate limit store (`memory` / `redis`) |
| `REDIS_URL` | Conditional | — | Redis URL (required if `RATE_LIMIT_STORE=redis`) |
| `OPENROUTER_API_KEY` | Yes | — | OpenRouter API key for LLM gateway |
| `STRIPE_SECRET_KEY` | Yes | — | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | — | Stripe webhook signing secret |
| `TWILIO_ACCOUNT_SID` | Conditional | — | Twilio SID (for contact center) |
| `TWILIO_AUTH_TOKEN` | Conditional | — | Twilio auth token |
| `SENDGRID_API_KEY` | Conditional | — | SendGrid API key (for email) |
| `GOOGLE_CLIENT_ID` | Conditional | — | Google OAuth client ID (calendar sync) |
| `GOOGLE_CLIENT_SECRET` | Conditional | — | Google OAuth client secret |
| `LOG_LEVEL` | No | `info` | Logger level (`debug`, `info`, `warn`, `error`) |
| `NODE_ENV` | No | `development` | Environment (`development`, `production`, `test`) |
| `SUPERJSON_ENABLED` | No | `true` | Enable SuperJSON transformer |

### tRPC Configuration

```typescript
// src/trpc/init.ts
const t = initTRPC.context<Context>().create({
  transformer: superjson,           // SuperJSON for rich type serialization
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError
          ? error.cause.flatten()
          : null,
        stack: process.env.NODE_ENV === 'development'
          ? error.stack
          : undefined,
      },
    };
  },
});
```

### Rate Limit Configuration

```typescript
// Custom rate limit factory
const customRateLimited = rateLimitedProcedure({
  limit: 30,               // Max requests
  windowMs: 60_000,        // 60 second window
  keyGenerator: (ctx) =>   // Custom key (default: userId || IP)
    ctx.session?.userId ?? ctx.ip ?? 'anonymous',
  skip: (ctx) =>           // Skip rate limiting for super admins
    ctx.permissions?.tier === 0,
  message: 'Custom rate limit exceeded',
});
```

### Adapter Configuration

```typescript
// Next.js App Router — app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@mcv/api';
import { createFetchContext } from '@mcv/api/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createFetchContext,
    onError: ({ path, error }) => {
      console.error(`tRPC error on ${path}:`, error);
    },
  });

export { handler as GET, handler as POST };
```

```typescript
// Hono Edge Worker
import { Hono } from 'hono';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from '@mcv/api';
import { createFetchContext } from '@mcv/api/trpc';

const app = new Hono();
app.use('/trpc/*', trpcServer({
  router: appRouter,
  createContext: createFetchContext,
}));
```

```typescript
// Server-side Caller (RSC / Server Actions)
import { createCallerFactory } from '@mcv/api/trpc';
import { appRouter } from '@mcv/api';

const createCaller = createCallerFactory(appRouter);

export async function getServerSession() {
  const caller = createCaller(await createContext({ headers: headers() }));
  return caller.auth.getSession();
}
```

### Client Configuration

```typescript
// React Query client setup
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@mcv/api';

export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
          headers: () => ({
            'x-request-id': crypto.randomUUID(),
          }),
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

---

*@mcv/api — API Layer*
