# Tier 6: Presentation — API Reference

| Field              | Value                                           |
| ------------------ | ----------------------------------------------- |
| **Tier**           | 6 — Presentation                                |
| **Classification** | INTERNAL                                        |
| **Packages**       | `@mcv/api`, `@mcv/apps`, `@mcv/ui`             |
| **API Surface**    | tRPC v11, Server Actions, Route Handlers        |
| **Last Updated**   | February 2026                                   |

---

## Table of Contents

1. [API Overview](#api-overview)
2. [tRPC Router Structure](#trpc-router-structure)
3. [Server Actions Catalog](#server-actions-catalog)
4. [API Route Handlers](#api-route-handlers)
5. [Middleware Chain](#middleware-chain)
6. [Component API Reference](#component-api-reference)
7. [Theme API](#theme-api)
8. [Route Definitions](#route-definitions)
9. [Type Definitions](#type-definitions)
10. [Error Handling Patterns](#error-handling-patterns)
11. [Config Reference](#config-reference)

---

## 1. API Overview

Tier 6 exposes three categories of APIs:

| API Type | Package | Transport | Count | Purpose |
|----------|---------|-----------|-------|---------|
| **tRPC Procedures** | `@mcv/api` | HTTP (GET/POST) | 300+ procedures across 61 routers | Primary data API |
| **Server Actions** | `@mcv/apps` | HTTP (POST) | ~40 actions | Form mutations, RSC actions |
| **Route Handlers** | `@mcv/apps` | HTTP (various) | 75 handlers | Webhooks, auth, file serving |

### Entry Points

```typescript
// tRPC — primary API
import { appRouter, type AppRouter } from '@mcv/api';
import { createCaller } from '@mcv/api/trpc';

// Server-side direct call
const caller = createCaller(await createContext(headers));
const result = await caller.ventures.list();

// Client-side React Query
const { data } = trpc.ventures.list.useQuery();
const mutation = trpc.ventures.create.useMutation();
```

### Package Export Map

```jsonc
{
  "@mcv/api":            "Root — appRouter, types, schemas, services",
  "@mcv/api/trpc":       "tRPC primitives — procedures, context, types",
  "@mcv/api/routers":    "AppRouter + 61 individual routers",
  "@mcv/api/middleware":  "Rate limiter, logger middleware",
  "@mcv/api/services":   "68 domain service classes",
  "@mcv/api/schemas":    "42 Zod schema modules",
  "@mcv/api/schemas/*":  "Individual schema modules",
  "@mcv/api/types":      "TypeScript type definitions"
}
```

---

## 2. tRPC Router Structure

### Complete Router Catalog

All 61 domain routers merged into the `appRouter`, organized by functional area.

---

### Authentication & Identity (6 routers)

#### `auth` — AuthRouter

Core authentication flows.

| Procedure | Type | Auth | Rate Limit | Description |
|-----------|------|------|------------|-------------|
| `auth.register` | mutation | public | 5/min (auth) | Create new account |
| `auth.login` | mutation | public | 5/min (auth) | Email/password login |
| `auth.logout` | mutation | protected | — | Destroy session |
| `auth.getSession` | query | protected | — | Get current session |
| `auth.refreshSession` | mutation | protected | — | Refresh session token |
| `auth.forgotPassword` | mutation | public | 5/min (auth) | Send password reset email |
| `auth.resetPassword` | mutation | public | 3/min (strict) | Reset password with token |
| `auth.verifyEmail` | mutation | public | — | Email verification |
| `auth.resendVerification` | mutation | public | 5/min (auth) | Resend verification email |
| `auth.switchVenture` | mutation | protected | — | Change active venture context |
| `auth.listSessions` | query | protected | — | List active sessions |
| `auth.revokeSession` | mutation | protected | — | Revoke a session |
| `auth.revokeAllSessions` | mutation | protected | — | Revoke all sessions except current |
| `auth.socialAuth` | mutation | public | — | OAuth callback handler |
| `auth.linkSocialAccount` | mutation | protected | — | Link social account to existing user |
| `auth.unlinkSocialAccount` | mutation | protected | — | Unlink social account |
| `auth.changePassword` | mutation | protected | — | Change current password |
| `auth.changeEmail` | mutation | protected | 3/min (strict) | Change email with verification |
| `auth.deleteAccount` | mutation | protected | — | Soft-delete user account |
| `auth.web3Nonce` | query | public | — | Get nonce for Web3 wallet auth |

#### `mfa` — MfaRouter

Multi-factor authentication management.

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `mfa.setup` | mutation | protected | Generate TOTP secret + QR code |
| `mfa.verify` | mutation | protected | Verify TOTP code during setup |
| `mfa.disable` | mutation | protected | Disable MFA (requires password confirmation) |
| `mfa.challenge` | mutation | public | Present MFA challenge during login |
| `mfa.verifyChallenge` | mutation | public | Verify MFA code during login |
| `mfa.generateBackupCodes` | mutation | protected | Generate recovery codes |

#### `passkey` — PasskeyRouter

WebAuthn/FIDO2 passkey management.

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `passkey.registerOptions` | query | protected | Get WebAuthn registration options |
| `passkey.registerVerify` | mutation | protected | Verify and store passkey registration |
| `passkey.authOptions` | query | public | Get WebAuthn authentication options |
| `passkey.authVerify` | mutation | public | Verify passkey authentication |
| `passkey.list` | query | protected | List registered passkeys |
| `passkey.delete` | mutation | protected | Remove a passkey |

#### `wallet` — WalletRouter

Web3 wallet authentication.

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `wallet.getNonce` | query | public | Generate nonce for wallet signature |
| `wallet.verify` | mutation | public | Verify wallet signature |
| `wallet.link` | mutation | protected | Link wallet to existing account |
| `wallet.unlink` | mutation | protected | Unlink wallet from account |

#### `users` — UsersRouter

User management (admin).

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `users.list` | query | admin | List users with filters, pagination |
| `users.getById` | query | admin | Get user by ID |
| `users.create` | mutation | admin | Create new user |
| `users.update` | mutation | admin | Update user profile |
| `users.updateRole` | mutation | superAdmin | Change user role/tier |
| `users.suspend` | mutation | admin | Suspend user account |
| `users.activate` | mutation | admin | Reactivate user account |
| `users.delete` | mutation | superAdmin | Soft-delete user |
| `users.invite` | mutation | admin | Send invitation email |
| `users.bulkInvite` | mutation | admin | Bulk send invitations |
| `users.search` | query | admin | Full-text user search |
| `users.stats` | query | admin | User statistics and counts |

#### `roles` — RolesRouter

Role and tier management (admin).

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `roles.list` | query | admin | List all roles |
| `roles.getById` | query | admin | Get role by ID with permissions |
| `roles.create` | mutation | superAdmin | Create new role |
| `roles.update` | mutation | superAdmin | Update role configuration |
| `roles.delete` | mutation | superAdmin | Delete role |
| `roles.assignPermissions` | mutation | superAdmin | Assign permissions to role |
| `roles.removePermissions` | mutation | superAdmin | Remove permissions from role |
| `roles.listPermissions` | query | admin | List all available permissions |

---

### Multi-Tenancy & Access Control (4 routers)

#### `ventures` — VenturesRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `ventures.list` | query | admin | List all ventures |
| `ventures.getById` | query | admin | Get venture by ID |
| `ventures.getBySlug` | query | admin | Get venture by slug |
| `ventures.create` | mutation | superAdmin | Create new venture |
| `ventures.update` | mutation | admin | Update venture settings |
| `ventures.updateStatus` | mutation | superAdmin | Change venture status |
| `ventures.delete` | mutation | superAdmin | Archive venture |
| `ventures.getSettings` | query | admin | Get venture settings |
| `ventures.updateSettings` | mutation | admin | Update venture settings |
| `ventures.getHealth` | query | admin | Get venture health metrics |

#### `ventureMembers` — VentureMembersRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `ventureMembers.list` | query | admin | List members of a venture |
| `ventureMembers.add` | mutation | admin | Add member to venture |
| `ventureMembers.remove` | mutation | admin | Remove member from venture |
| `ventureMembers.updateRole` | mutation | admin | Change member's venture role |
| `ventureMembers.invite` | mutation | admin | Invite user to venture |
| `ventureMembers.acceptInvite` | mutation | protected | Accept venture invitation |
| `ventureMembers.declineInvite` | mutation | protected | Decline venture invitation |
| `ventureMembers.listInvitations` | query | admin | List pending invitations |

#### `permissions` — PermissionsRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `permissions.list` | query | protected | List user's permissions |
| `permissions.check` | query | protected | Check single permission |
| `permissions.checkBatch` | query | protected | Check multiple permissions |
| `permissions.getForRole` | query | admin | Get permissions for a role |
| `permissions.getMatrix` | query | admin | Get full permission matrix |
| `permissions.getResources` | query | admin | List all permissionable resources |

#### `settings` — SettingsRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `settings.getSystem` | query | superAdmin | Get system-wide settings |
| `settings.updateSystem` | mutation | superAdmin | Update system settings |
| `settings.getVenture` | query | admin | Get venture-specific settings |
| `settings.updateVenture` | mutation | admin | Update venture settings |
| `settings.getUser` | query | protected | Get user preferences |
| `settings.updateUser` | mutation | protected | Update user preferences |
| `settings.getFeatureConfig` | query | admin | Get feature configuration |
| `settings.updateFeatureConfig` | mutation | superAdmin | Update feature configuration |

---

### AI & Intelligence (7 routers)

#### `gateway` — GatewayRouter

AI Gateway for LLM interactions.

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `gateway.chat` | mutation | protected | Chat completion (OpenAI/Anthropic/Google) |
| `gateway.chatStream` | subscription | protected | Streaming chat completion |
| `gateway.listModels` | query | protected | Available AI models |
| `gateway.getUsage` | query | protected | User's AI usage stats |
| `gateway.getUsageByVenture` | query | admin | Venture AI usage breakdown |
| `gateway.getBudget` | query | admin | Current budget utilization |
| `gateway.updateBudget` | mutation | superAdmin | Set budget limits |
| `gateway.listConversations` | query | protected | User's conversation history |
| `gateway.getConversation` | query | protected | Single conversation with messages |
| `gateway.deleteConversation` | mutation | protected | Delete a conversation |
| `gateway.getModelConfig` | query | admin | Model routing configuration |
| `gateway.updateModelConfig` | mutation | superAdmin | Update model routing |
| `gateway.getTierRouting` | query | admin | Tier-based model routing rules |
| `gateway.updateTierRouting` | mutation | superAdmin | Update tier routing |
| `gateway.getAnalytics` | query | admin | Gateway analytics (cost, latency, tokens) |
| `gateway.getTopUsers` | query | admin | Top AI users by usage |
| `gateway.getCostBreakdown` | query | admin | Cost breakdown by model/venture |
| `gateway.getHealthCheck` | query | admin | Gateway health status |

#### `rag` — RagRouter

RAG (Retrieval-Augmented Generation) system.

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `rag.stores.list` | query | admin | List RAG stores |
| `rag.stores.create` | mutation | admin | Create RAG store |
| `rag.stores.delete` | mutation | admin | Delete RAG store |
| `rag.stores.getStats` | query | admin | Store statistics |
| `rag.files.upload` | mutation | protected | Upload file for ingestion |
| `rag.files.list` | query | protected | List ingested files |
| `rag.files.delete` | mutation | protected | Delete ingested file |
| `rag.files.getStatus` | query | protected | Get file ingestion status |
| `rag.query.basic` | mutation | protected | Basic RAG query |
| `rag.query.synthesis` | mutation | protected | Multi-source synthesis query |
| `rag.query.deep` | mutation | protected | Deep research query |
| `rag.costs.getUsage` | query | admin | RAG usage and costs |
| `rag.costs.getByVenture` | query | superAdmin | Per-venture RAG costs |
| `rag.config.get` | query | admin | RAG configuration |

#### `hitl` — HitlRouter

Human-in-the-Loop approval queue.

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `hitl.list` | query | protected | List pending HITL items |
| `hitl.getById` | query | protected | Get HITL item detail |
| `hitl.create` | mutation | protected | Create HITL review request |
| `hitl.approve` | mutation | protected | Approve HITL item |
| `hitl.reject` | mutation | protected | Reject HITL item |
| `hitl.escalate` | mutation | protected | Escalate to higher tier |

#### `agentTasks` — AgentTasksRouter

AI agent task queue.

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `agentTasks.list` | query | venture | List agent tasks |
| `agentTasks.assign` | mutation | admin | Assign task to agent |
| `agentTasks.claim` | mutation | agent | Agent claims a task |
| `agentTasks.progress` | mutation | agent | Update task progress |
| `agentTasks.complete` | mutation | agent | Mark task complete |
| `agentTasks.fail` | mutation | agent | Mark task failed |
| `agentTasks.getMetrics` | query | admin | Agent task metrics |
| `agentTasks.getQueue` | query | admin | View task queue |

---

### CRM & Contacts (6 routers)

#### `contacts` — ContactRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `contacts.list` | query | venture | List contacts with filters |
| `contacts.getById` | query | venture | Get contact detail |
| `contacts.create` | mutation | venture | Create contact |
| `contacts.update` | mutation | venture | Update contact |
| `contacts.delete` | mutation | venture | Soft-delete contact |
| `contacts.search` | query | venture | Full-text contact search |
| `contacts.merge` | mutation | venture | Merge duplicate contacts |
| `contacts.stats` | query | venture | Contact statistics |

#### `deals` — DealRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `deals.list` | query | venture | List deals |
| `deals.getById` | query | venture | Get deal detail |
| `deals.create` | mutation | venture | Create deal |
| `deals.update` | mutation | venture | Update deal |
| `deals.moveStage` | mutation | venture | Move deal to new pipeline stage |
| `deals.close` | mutation | venture | Close deal (won/lost) |
| `deals.getPipeline` | query | venture | Get pipeline view |
| `deals.getForecast` | query | venture | Revenue forecast |
| `deals.getAnalytics` | query | venture | Deal analytics (velocity, win rate) |
| `deals.bulkUpdate` | mutation | venture | Bulk deal updates |

#### `crmV2` — CrmV2Router (Advanced)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `crmV2.customObjects.list` | query | venture | Custom object definitions |
| `crmV2.customObjects.create` | mutation | admin | Define custom object |
| `crmV2.scoring.getDealScore` | query | venture | AI-powered deal scoring |
| `crmV2.scoring.getLeadScore` | query | venture | Lead scoring |
| `crmV2.forecasting.getRevenue` | query | venture | Revenue forecasting |
| `crmV2.forecasting.getScenarios` | query | venture | Forecast scenarios |
| `crmV2.duplicates.detect` | query | venture | Duplicate detection |
| `crmV2.duplicates.merge` | mutation | venture | Merge duplicates |
| `crmV2.smartViews.list` | query | venture | Saved smart views |
| `crmV2.smartViews.create` | mutation | venture | Create smart view |
| *+ more* | — | — | Additional advanced CRM procedures |

---

### Task & Project Management (8 routers)

#### `tasks` — TaskRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `tasks.list` | query | venture | List tasks with filters, sort |
| `tasks.getById` | query | venture | Get task detail |
| `tasks.create` | mutation | venture | Create task |
| `tasks.update` | mutation | venture | Update task |
| `tasks.updateStatus` | mutation | venture | Transition task status |
| `tasks.delete` | mutation | venture | Soft-delete task |
| `tasks.assign` | mutation | venture | Assign task to user |
| `tasks.addComment` | mutation | venture | Add comment to task |
| `tasks.search` | query | venture | Full-text task search |
| `tasks.bulkUpdate` | mutation | venture | Bulk status/assignment changes |
| `tasks.getKanban` | query | venture | Kanban board view |
| `tasks.reorder` | mutation | venture | Reorder tasks in kanban |

#### `workflows` — WorkflowRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `workflows.list` | query | venture | List workflow definitions |
| `workflows.getById` | query | venture | Get workflow detail |
| `workflows.create` | mutation | admin | Create workflow |
| `workflows.update` | mutation | admin | Update workflow |
| `workflows.publish` | mutation | admin | Publish workflow version |
| `workflows.execute` | mutation | venture | Trigger workflow execution |
| `workflows.getRunHistory` | query | venture | Execution history |
| `workflows.getRunDetail` | query | venture | Single execution detail |
| `workflows.pause` | mutation | admin | Pause running workflow |
| `workflows.resume` | mutation | admin | Resume paused workflow |
| `workflows.cancel` | mutation | admin | Cancel running workflow |
| `workflows.listTemplates` | query | venture | Pre-built workflow templates |
| `workflows.createFromTemplate` | mutation | admin | Create workflow from template |
| *+ more* | — | — | V2 graph-based workflows, approvals, versioning |

#### `calendar` — CalendarRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `calendar.events.list` | query | permission | List calendar events |
| `calendar.events.create` | mutation | permission | Create event |
| `calendar.events.update` | mutation | permission | Update event |
| `calendar.events.delete` | mutation | permission | Delete event |
| `calendar.availability.get` | query | permission | Get user availability |
| `calendar.availability.set` | mutation | permission | Set availability blocks |
| `calendar.appointments.list` | query | permission | List appointments |
| `calendar.appointments.book` | mutation | public | Book appointment (public) |
| `calendar.appointments.cancel` | mutation | permission | Cancel appointment |
| `calendar.appointments.reschedule` | mutation | permission | Reschedule appointment |
| `calendar.reminders.list` | query | permission | List reminders |
| `calendar.reminders.create` | mutation | permission | Create reminder |
| `calendar.roundRobin.config` | query | admin | Round-robin configuration |
| `calendar.roundRobin.update` | mutation | admin | Update round-robin rules |
| `calendar.bookingPages.list` | query | permission | List booking pages |
| `calendar.bookingPages.create` | mutation | permission | Create booking page |
| `calendar.googleSync.connect` | mutation | permission | Connect Google Calendar |
| `calendar.googleSync.disconnect` | mutation | permission | Disconnect Google Calendar |
| `calendar.googleSync.sync` | mutation | permission | Trigger manual sync |
| `calendar.publicBooking.getSlots` | query | public | Get available booking slots |
| `calendar.publicBooking.book` | mutation | public | Book from public page |
| *+ more* | — | — | ~32 total procedures |

---

### Commerce & Payments (4 routers)

#### `invoicing` — InvoicingRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `invoicing.list` | query | venture | List invoices |
| `invoicing.getById` | query | venture | Get invoice detail |
| `invoicing.create` | mutation | venture | Create invoice |
| `invoicing.update` | mutation | venture | Update draft invoice |
| `invoicing.send` | mutation | venture | Send invoice to client |
| `invoicing.markPaid` | mutation | venture | Mark invoice as paid |
| `invoicing.void` | mutation | venture | Void invoice |
| `invoicing.duplicate` | mutation | venture | Duplicate invoice |
| `invoicing.getProposals` | query | venture | List proposals |
| `invoicing.createProposal` | mutation | venture | Create proposal |
| `invoicing.getEstimates` | query | venture | List estimates |
| `invoicing.createEstimate` | mutation | venture | Create estimate |
| `invoicing.getCreditNotes` | query | venture | List credit notes |
| `invoicing.createCreditNote` | mutation | venture | Create credit note |
| `invoicing.getRecurring` | query | venture | List recurring invoices |
| `invoicing.createRecurring` | mutation | venture | Create recurring schedule |
| `invoicing.getDashboard` | query | venture | Invoice dashboard stats |
| `invoicing.getPlatformFees` | query | admin | Platform fee overview |

#### `catalog` — CatalogRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `catalog.products.list` | query | venture | List products |
| `catalog.products.getById` | query | venture | Get product detail |
| `catalog.products.create` | mutation | venture | Create product |
| `catalog.products.update` | mutation | venture | Update product |
| `catalog.products.delete` | mutation | venture | Delete product |
| `catalog.categories.list` | query | venture | List categories |
| `catalog.categories.create` | mutation | venture | Create category |
| `catalog.inventory.get` | query | venture | Get inventory levels |
| `catalog.inventory.update` | mutation | venture | Update inventory |
| `catalog.discounts.list` | query | venture | List discounts |
| `catalog.discounts.create` | mutation | venture | Create discount |

---

### Operations & Monitoring (5 routers)

#### `audit` — AuditRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `audit.list` | query | admin | List audit log entries |
| `audit.getById` | query | admin | Get audit entry detail |
| `audit.search` | query | admin | Search audit logs |
| `audit.getStats` | query | admin | Audit statistics |
| `audit.export` | mutation | superAdmin | Export audit logs |

#### `flags` — FlagsRouter

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `flags.list` | query | admin | List feature flags |
| `flags.getById` | query | admin | Get flag detail |
| `flags.create` | mutation | admin | Create feature flag |
| `flags.update` | mutation | admin | Update flag configuration |
| `flags.toggle` | mutation | admin | Toggle flag on/off |
| `flags.evaluate` | query | protected | Evaluate flag for current user |
| `flags.bulkEvaluate` | query | protected | Evaluate multiple flags |

---

## 3. Server Actions Catalog

Server Actions in `@mcv/apps` handle form submissions and mutations from React Server Components.

### Auth Actions

| Action | File | Description |
|--------|------|-------------|
| `loginAction` | `actions/auth.ts` | Process login form |
| `registerAction` | `actions/auth.ts` | Process registration form |
| `forgotPasswordAction` | `actions/auth.ts` | Send password reset |
| `resetPasswordAction` | `actions/auth.ts` | Process password reset |

### CRM Actions

| Action | File | Description |
|--------|------|-------------|
| `createContactAction` | `actions/crm.ts` | Create new contact from form |
| `updateContactAction` | `actions/crm.ts` | Update contact from form |
| `createDealAction` | `actions/crm.ts` | Create new deal |
| `moveDealStageAction` | `actions/crm.ts` | Move deal in pipeline |

### Invoice Actions

| Action | File | Description |
|--------|------|-------------|
| `createInvoiceAction` | `actions/invoicing.ts` | Create invoice from form |
| `sendInvoiceAction` | `actions/invoicing.ts` | Send invoice to client |
| `markPaidAction` | `actions/invoicing.ts` | Mark invoice paid |

### Task Actions

| Action | File | Description |
|--------|------|-------------|
| `createTaskAction` | `actions/tasks.ts` | Create task from form |
| `updateTaskStatusAction` | `actions/tasks.ts` | Quick status update |
| `assignTaskAction` | `actions/tasks.ts` | Assign task to user |

### Settings Actions

| Action | File | Description |
|--------|------|-------------|
| `updateProfileAction` | `actions/settings.ts` | Update user profile |
| `updatePasswordAction` | `actions/settings.ts` | Change password |
| `updateAppearanceAction` | `actions/settings.ts` | Update appearance preferences |
| `createApiKeyAction` | `actions/settings.ts` | Generate new API key |
| `revokeApiKeyAction` | `actions/settings.ts` | Revoke API key |

### Admin Actions

| Action | File | Description |
|--------|------|-------------|
| `createVentureAction` | `actions/admin.ts` | Create new venture |
| `inviteUserAction` | `actions/admin.ts` | Invite user to platform |
| `bulkInviteAction` | `actions/admin.ts` | Bulk user invitation |
| `toggleFeatureFlagAction` | `actions/admin.ts` | Toggle feature flag |
| `updateVentureBrandingAction` | `actions/admin.ts` | Update venture branding |

### Server Action Pattern

```typescript
// actions/crm.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createCaller, createContext } from '@mcv/api/trpc';
import { headers } from 'next/headers';
import { contactCreateSchema } from '@mcv/api/schemas';

export async function createContactAction(formData: FormData) {
  const headersList = await headers();
  const caller = createCaller(await createContext(headersList));

  const input = contactCreateSchema.parse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    organizationId: formData.get('organizationId'),
  });

  const contact = await caller.contacts.create(input);

  revalidatePath('/crm/contacts');
  return { success: true, id: contact.id };
}
```

---

## 4. API Route Handlers

75 route handlers in `@mcv/apps` handle non-tRPC HTTP endpoints.

### tRPC Handler

```typescript
// app/api/trpc/[...trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@mcv/api';
import { createFetchContext } from '@mcv/api/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createFetchContext(req),
  });

export { handler as GET, handler as POST };
```

### Auth Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...all]` | ALL | Better Auth route handler |
| `/api/auth/callback/google` | GET | Google OAuth callback |
| `/api/auth/callback/github` | GET | GitHub OAuth callback |

### Webhook Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/webhooks/stripe` | POST | Stripe webhook handler |
| `/api/webhooks/twilio` | POST | Twilio webhook handler |
| `/api/webhooks/resend` | POST | Resend email webhook |
| `/api/webhooks/supabase` | POST | Supabase realtime webhook |

### File Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/files/upload` | POST | File upload (multipart) |
| `/api/files/[id]` | GET | File download |
| `/api/files/[id]/thumbnail` | GET | Image thumbnail |

### OpenAPI

| Route | Method | Description |
|-------|--------|-------------|
| `/api/openapi.json` | GET | OpenAPI 3.0 spec |
| `/api/docs` | GET | Swagger UI |

### Cron Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/cron/cleanup-sessions` | POST | Expired session cleanup |
| `/api/cron/send-reminders` | POST | Calendar reminder dispatch |
| `/api/cron/sync-analytics` | POST | Analytics data sync |

---

## 5. Middleware Chain

### tRPC Middleware Stack

Each procedure type composes middleware in a specific order:

```typescript
// Base: All procedures get logging
const baseProcedure = t.procedure.use(loggerMiddleware);

// Public: Base only
const publicProcedure = baseProcedure;

// Protected: Base + auth check
const protectedProcedure = baseProcedure.use(isAuthenticated);

// Admin: Base + admin check (inherits auth)
const adminProcedure = baseProcedure.use(isAdmin);

// Super Admin: Base + super admin check
const superAdminProcedure = baseProcedure.use(isSuperAdmin);

// Venture: Base + auth + venture context
const ventureProcedure = baseProcedure
  .use(isAuthenticated)
  .use(hasVentureContext);

// Agent: Base + agent identity check
const agentProcedure = baseProcedure.use(isAgent);

// Permission: Base + auth + specific permission
const permissionProcedure = (resource: string, action: string) =>
  baseProcedure
    .use(isAuthenticated)
    .use(requirePermission(resource, action));

// Rate-limited variants
const rateLimitedPublicProcedure = baseProcedure
  .use(createRateLimitMiddleware('public'));

const rateLimitedProtectedProcedure = baseProcedure
  .use(createRateLimitMiddleware('general'))
  .use(isAuthenticated);

const rateLimitedAuthProcedure = baseProcedure
  .use(createRateLimitMiddleware('auth'));

const strictRateLimitedProcedure = baseProcedure
  .use(createRateLimitMiddleware('strict'));
```

### Procedure Reference Table

| Procedure | Chain | Auth | Rate Limit | Use Case |
|-----------|-------|------|------------|----------|
| `publicProcedure` | logger | None | None | Health, public booking |
| `protectedProcedure` | logger → isAuth | Session | None | General endpoints |
| `adminProcedure` | logger → isAdmin | Tier 0/1 | None | Admin operations |
| `superAdminProcedure` | logger → isSuperAdmin | Tier 0 | None | System config |
| `ventureProcedure` | logger → isAuth → hasVenture | Session + venture | None | Venture-scoped |
| `agentProcedure` | logger → isAgent | x-agent-id | None | AI agent endpoints |
| `permissionProcedure(r,a)` | logger → isAuth → requirePerm | Session + RBAC | None | Granular access |
| `rateLimitedPublicProcedure` | logger → rateLimit(50) | None | 50/min/IP | Public APIs |
| `rateLimitedProtectedProcedure` | logger → rateLimit(100) → isAuth | Session | 100/min/user | Dashboard polling |
| `rateLimitedAuthProcedure` | logger → rateLimit(5) | None | 5/min/IP | Login, signup |
| `strictRateLimitedProcedure` | logger → rateLimit(3) | None | 3/min/IP | Password reset |

### Edge Middleware Pipeline

```typescript
// Next.js Edge middleware order
1. Security Headers    → CSP, HSTS, X-Frame-Options
2. Request ID          → Generate/forward x-request-id
3. Rate Limiting       → Check IP against Upstash Redis
4. Session Validation  → Verify Better Auth cookie
5. Route Protection    → Match protected/public routes
6. Venture Resolution  → Resolve active venture from session
7. Permission Check    → Verify RBAC for protected routes
8. Logging             → Log request metadata
```

---

## 6. Component API Reference

### Core Component Props

Every `@mcv/ui` component extends a base props interface:

```typescript
interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

interface InteractiveComponentProps extends BaseComponentProps {
  isDisabled?: boolean;
  isLoading?: boolean;
  isActive?: boolean;
}

interface VariantComponentProps extends InteractiveComponentProps {
  variant?: 'solid' | 'outline' | 'ghost' | 'link' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
}
```

### Key Component APIs

#### Button

```typescript
interface ButtonProps extends VariantComponentProps {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}
```

#### DataTable

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  selection?: RowSelectionState;
  onSelectionChange?: (selection: RowSelectionState) => void;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  stickyHeader?: boolean;
  virtualScroll?: boolean;
  rowHeight?: number;
}
```

#### StatCard

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  trend?: number[];
  sparkline?: boolean;
  loading?: boolean;
  href?: string;
}
```

#### Modal

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  placement?: 'center' | 'top' | 'bottom';
  isDismissable?: boolean;
  hideCloseButton?: boolean;
  scrollBehavior?: 'inside' | 'outside';
  children: React.ReactNode;
}
```

#### Form Components

```typescript
// Input
interface InputProps {
  label?: string;
  placeholder?: string;
  description?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  isReadOnly?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  variant?: 'flat' | 'bordered' | 'underlined' | 'faded';
  size?: 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

// Select
interface SelectProps<T> {
  label?: string;
  placeholder?: string;
  options: SelectOption<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  isMulti?: boolean;
  isSearchable?: boolean;
  isLoading?: boolean;
  isClearable?: boolean;
  isGrouped?: boolean;
  renderOption?: (option: SelectOption<T>) => React.ReactNode;
}

// DatePicker
interface DatePickerProps {
  label?: string;
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  granularity?: 'day' | 'hour' | 'minute' | 'second';
  isDateUnavailable?: (date: Date) => boolean;
  showMonthAndYearPickers?: boolean;
}
```

#### Chart Components

```typescript
// LineChart
interface LineChartProps {
  data: DataPoint[];
  series: SeriesDef[];
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  responsive?: boolean;
  colors?: string[];
}

// BarChart
interface BarChartProps {
  data: DataPoint[];
  series: SeriesDef[];
  orientation?: 'vertical' | 'horizontal';
  stacked?: boolean;
  grouped?: boolean;
  height?: number;
  barSize?: number;
  showValues?: boolean;
}
```

#### Admin Components

```typescript
// MCVShell
interface MCVShellProps {
  sidebarCollapsed: boolean;
  headerProps: AdminHeaderProps;
  sidebarProps: AdminSidebarProps;
  children: React.ReactNode;
}

// AdminSidebar
interface AdminSidebarProps {
  navigation: NavigationSection[];
  navigationState: NavigationState;
  activeVenture: VentureConfig | null;
  ventures: VentureConfig[];
  isCollapsed: boolean;
  currentPath: string;
  onVentureSwitch?: (slug: string) => void;
  onToggleCollapse?: () => void;
}

// PermissionGate
interface PermissionGateProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}
```

---

## 7. Theme API

### ThemeProvider

```typescript
import { ThemeProvider } from '@mcv/ui';

<ThemeProvider
  defaultTheme="dark"          // 'light' | 'dark' | 'system'
  ventureId="betedge"          // Venture slug for branding
  storageKey="mcv-theme"       // localStorage key
>
  {children}
</ThemeProvider>
```

### Theme Hooks

```typescript
// Get/set theme mode
const { theme, setTheme } = useTheme();

// Get active venture theme
const venture = useVenture();

// Get design tokens
const tokens = useTokens();

// Check dark mode
const isDark = useIsDark();
```

### Design Token API

```typescript
import { tokens } from '@mcv/ui/branding';

// Colors
tokens.colors.primary[500]       // 'hsl(var(--primary-500))'
tokens.colors.success[600]       // 'hsl(var(--success-600))'
tokens.colors.background.default // 'hsl(var(--background))'

// Typography
tokens.typography.fonts.sans     // 'var(--font-sans)'
tokens.typography.fontSizes.lg   // '1.125rem'
tokens.typography.fontWeights.semibold // '600'

// Spacing
tokens.spacing[4]                // '1rem'
tokens.spacing[8]                // '2rem'

// Radii
tokens.radii.lg                  // '0.5rem'
tokens.radii.full                // '9999px'

// Shadows
tokens.shadows.md                // '0 4px 6px -1px ...'

// Breakpoints
tokens.breakpoints.lg            // '1024px'

// Z-Indices
tokens.zIndices.modal            // 1400
tokens.zIndices.toast            // 1700
```

### Venture Theme Configuration

```typescript
interface VentureTheme {
  id: string;
  name: string;

  colors: {
    primary: Record<50 | 100 | ... | 950, string>;
    secondary: { 500: string };
    accent: { 500: string };
  };

  typography: {
    fonts: {
      sans: string;
      display: string;
      mono: string;
    };
  };

  components: {
    [componentName: string]: {
      defaultProps?: Record<string, unknown>;
    };
  };

  assets: {
    logo: string;
    logomark: string;
    favicon: string;
    ogImage: string;
  };
}
```

### Available Venture Themes

| Theme ID | Venture | Primary | Display Font |
|----------|---------|---------|-------------|
| `mcv` | MCV Global (base) | `#6366f1` (Indigo) | Inter |
| `betedge` | BetEdge AI | `#22c55e` (Green) | Clash Display |
| `edgeiq` | EdgeIQ | `#3b82f6` (Blue) | Inter |
| `mcvgg` | MCVGG | `#8b5cf6` (Purple) | Space Grotesk |
| `studio` | Studio | `#f59e0b` (Amber) | Inter |
| `agency` | Agency | `#ec4899` (Pink) | Satoshi |
| `sentinel` | Sentinel | `#ef4444` (Red) | Inter |

---

## 8. Route Definitions

### Super-Admin Routes

#### Route Groups

| Group | Prefix | Auth | Layout |
|-------|--------|------|--------|
| `(auth)` | `/login`, `/register`, etc. | None | Auth layout (centered) |
| `(dashboard)` | `/`, `/admin/*`, `/crm/*`, etc. | Required | MCVShell (sidebar + header) |
| `(public)` | `/portfolio` | None | Public layout |
| `api` | `/api/*` | Varies | None (JSON) |

#### Dashboard Routes (169 pages)

```
/                                    → Mission Control
/admin/users                         → User Management
/admin/users/[id]                    → User Detail
/admin/roles                         → Role Management
/admin/ventures                      → Venture Management
/admin/ventures/[id]                 → Venture Detail
/admin/flags                         → Feature Flags
/admin/audit                         → Audit Log
/admin/email                         → Email Management
/admin/storage                       → Storage Management
/admin/gateway                       → AI Gateway Config
/admin/marketing                     → Marketing Hub
/ai-command                          → AI Command Center
/ai-command/swarm                    → Swarm Overview
/ai-command/agents                   → Agent Management
/ai-command/hitl                     → HITL Center
/ai-command/naos                     → NAOS Registry
/ai-command/queen                    → Queen Orchestrator
/ai-command/configs                  → Agent Configurations
/ai-command/prompts                  → Prompt Library
/analytics                           → Portfolio Analytics
/approvals                           → Approval Workflows
/crm                                 → CRM Dashboard
/crm/contacts                        → Contact List
/crm/contacts/[id]                   → Contact Detail
/crm/organizations                   → Organization List
/crm/organizations/[id]              → Organization Detail
/crm/deals                           → Deal Pipeline
/crm/deals/[id]                      → Deal Detail
/crm/forecast                        → Revenue Forecast
/crm/data-quality                    → Data Quality
/catalog                             → Product Catalog
/catalog/products                    → Product List
/catalog/categories                  → Categories
/catalog/inventory                   → Inventory
/catalog/discounts                   → Discounts
/contact-center                      → Unified Inbox
/contact-center/dialer               → Outbound Dialer
/documents                           → Document Studio
/documents/templates                 → Template Gallery
/documents/editor/[id]               → Document Editor
/documents/library                   → Content Library
/engineering                         → Engineering Workbench
/grants                              → Grant Concierge
/integrations                        → Integration Hub
/intelligence                        → Intelligence Hub
/invoicing                           → Invoice Dashboard
/invoicing/invoices                  → Invoice List
/invoicing/invoices/[id]             → Invoice Detail
/invoicing/proposals                 → Proposals
/invoicing/estimates                 → Estimates
/invoicing/credit-notes              → Credit Notes
/invoicing/recurring                 → Recurring Invoices
/invoicing/platform-fees             → Platform Fees
/knowledge                           → Documentation Hub
/knowledge/api-reference             → API Reference
/knowledge/training                  → Training Center
/knowledge/changelog                 → Changelog
/onboarding                          → Onboarding Wizard
/ops                                 → Operations Center
/platform                            → Module Marketplace
/platform/assets                     → Asset Library
/platform/forge                      → The Forge
/platform/prompts                    → Prompt Library
/portfolio                           → Venture Registry
/portfolio/capital                   → Capital Stack
/portfolio/domains                   → Domain Portfolio
/portfolio/entities                  → Entity Management
/portfolio/health                    → Portfolio Health
/portfolio/[slug]                    → Venture Profile
/settings                            → Settings Index
/settings/profile                    → Profile Settings
/settings/security                   → Security Settings
/settings/sessions                   → Active Sessions
/settings/api-keys                   → API Keys
/settings/appearance                 → Appearance
/settings/notifications              → Notification Preferences
/settings/workspace                  → Workspace Settings
/settings/billing                    → Billing
/settings/audit                      → Personal Audit Log
/signals                             → Real-time Signal Feed
/strategy                            → Strategy Overview
/strategy/roadmap                    → Master Roadmap
/strategy/ir                         → Investor Relations
/strategy/ma                         → M&A Pipeline
/swarm                               → AI Swarm Dashboard
/tasks                               → Task List
/tasks/[projectId]                   → Project Detail
/tasks/hitl                          → HITL Tasks
/token-economy                       → EDGE Token Dashboard
/treasury                            → Treasury Overview
/workflows                           → Workflow Builder
/workflows/history                   → Run History
/cms                                 → CMS Dashboard
/cms/posts                           → Post List
/cms/categories                      → Categories
/cms/tags                            → Tags
/cms/comments                        → Comments
/media                               → Media Library
/v/[ventureSlug]                     → Venture Dashboard
/v/[ventureSlug]/engineering         → Venture Engineering
/v/[ventureSlug]/growth              → Venture Growth
/v/[ventureSlug]/operations          → Venture Operations
/v/[ventureSlug]/tasks               → Venture Tasks
/v/[ventureSlug]/crm                 → Venture CRM
/v/[ventureSlug]/settings            → Venture Settings
/v/[ventureSlug]/users               → Venture Users
/v/[ventureSlug]/analytics           → Venture Analytics
/forbidden                           → 403 Page
/maintenance                         → Maintenance Page
```

---

## 9. Type Definitions

### Core Types

```typescript
// Session types
type Session = {
  userId: string;
  email: string;
  ventureId: string | null;
  sessionId: string;
  expiresAt: Date;
};

type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  image: string | null;
  status: 'active' | 'suspended' | 'banned' | 'deleted';
  emailVerified: boolean;
  mfaEnabled: boolean;
  role: string | null;
  createdAt: Date;
};

type VentureContext = {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'suspended' | 'archived' | 'pending';
  settings: Record<string, unknown> | null;
};

type UserPermissions = {
  permissions: string[];
  check(resource: string, action: string): boolean;
  checkAny(checks: Array<{ resource: string; action: string }>): boolean;
};
```

### Pagination Types

```typescript
// Offset-based
type PaginatedResponse<T> = {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// Cursor-based
type CursorPaginatedResponse<T> = {
  items: T[];
  meta: {
    nextCursor: string | null;
    prevCursor: string | null;
    hasMore: boolean;
    total?: number;
  };
};
```

### Rate Limit Types

```typescript
type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetIn: number;
};

type RateLimitInfo = {
  current: number;
  limit: number;
  remaining: number;
  resetIn: number;
};

type RateLimitPreset = 'public' | 'general' | 'auth' | 'strict' | 'relaxed';
```

### Navigation Types

```typescript
type NavigationLayer = 'global' | 'venture' | 'module';

type VentureSlug =
  | 'betedge' | 'edgeiq' | 'mcvgg'
  | 'studio' | 'agency' | 'sentinel';

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  permission?: string;
  children?: NavigationItem[];
};

type NavigationSection = {
  title: string;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

type Breadcrumb = {
  label: string;
  href?: string;
  icon?: LucideIcon;
};
```

### Context Types

```typescript
type Context = {
  db: DrizzleClient;
  logger: Logger;
  headers: Headers;
  requestId: string;
  ip: string | null;
  userAgent: string | null;
  session: Session | null;
  user: AuthenticatedUser | null;
  venture: VentureContext | null;
  permissions: UserPermissions | null;
  rateLimit?: RateLimitInfo;
};

type AuthenticatedContext = Context & {
  session: Session;
  user: AuthenticatedUser;
  permissions: UserPermissions;
};

type VentureContextRequired = AuthenticatedContext & {
  venture: VentureContext;
};

type AdminContext = AuthenticatedContext;
type SuperAdminContext = AuthenticatedContext;

type AgentContext = Context & {
  agent: {
    id: string;
    name: string;
    agentType: string;
    autonomyLevel: number;
    ventureScope: string[];
  };
};
```

---

## 10. Error Handling Patterns

### tRPC Error Codes

| Code | HTTP Status | When Used | UI Response |
|------|-------------|-----------|-------------|
| `UNAUTHORIZED` | 401 | No valid session | Redirect to `/login` |
| `FORBIDDEN` | 403 | Insufficient permissions | 403 page or permission toast |
| `NOT_FOUND` | 404 | Entity not found | 404 page or empty state |
| `BAD_REQUEST` | 400 | Invalid input | Field-level validation errors |
| `CONFLICT` | 409 | Duplicate or stale data | Conflict resolution UI |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded | Retry countdown toast |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server error | Error boundary with retry |
| `TIMEOUT` | 408 | Request timeout | Timeout message with retry |
| `PRECONDITION_FAILED` | 412 | Business rule violation | Contextual error message |

### Error Response Format

```typescript
// tRPC error shape (via SuperJSON)
{
  error: {
    message: string;
    code: TRPCErrorCode;
    data: {
      code: string;        // e.g., 'UNAUTHORIZED'
      httpStatus: number;  // e.g., 401
      path: string;        // e.g., 'ventures.list'
      stack?: string;      // Dev only
    };
  };
}
```

### Client-Side Error Handling

```typescript
// Global error handler for React Query / tRPC
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error.data?.httpStatus === 401) return false;
        if (error.data?.httpStatus === 403) return false;
        // Retry up to 3 times for server errors
        return failureCount < 3;
      },
      staleTime: 30_000,     // 30 seconds
      gcTime: 5 * 60_000,    // 5 minutes
    },
    mutations: {
      onError: (error) => {
        // Global mutation error handler
        if (error.data?.httpStatus === 429) {
          toast.error(`Rate limited. Retry in ${error.data.retryAfter}s`);
        } else if (error.data?.httpStatus === 401) {
          // Session expired — show re-auth modal
          authStore.getState().setShowSessionExpiredModal(true);
        } else {
          toast.error(error.message);
        }
      },
    },
  },
});
```

### Error Boundary Hierarchy

```typescript
// Level 1: Root error boundary
// app/error.tsx
'use client';
export default function RootError({ error, reset }: ErrorBoundaryProps) {
  return (
    <ErrorPage
      title="Something went wrong"
      description={error.message}
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}

// Level 2: Route group error
// app/(dashboard)/error.tsx
'use client';
export default function DashboardError({ error, reset }: ErrorBoundaryProps) {
  if (error.message.includes('UNAUTHORIZED')) {
    redirect('/login');
  }
  return <ErrorState error={error} onRetry={reset} />;
}

// Level 3: Feature-level boundary
<ErrorBoundary fallback={<InlineError onRetry={refetch} />}>
  <CRMPipeline />
</ErrorBoundary>
```

---

## 11. Config Reference

### Environment Variables

#### Server-Only

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | — | Session signing secret |
| `BETTER_AUTH_URL` | ✅ | — | Auth callback URL |
| `GOOGLE_CLIENT_ID` | ✅ | — | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ✅ | — | Google OAuth |
| `GITHUB_CLIENT_ID` | ✅ | — | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | ✅ | — | GitHub OAuth |
| `RESEND_API_KEY` | ✅ | — | Email service |
| `UPSTASH_REDIS_REST_URL` | ✅ | — | Redis for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | — | Redis auth |
| `SUPABASE_URL` | ✅ | — | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | — | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Supabase service role key |
| `OPENAI_API_KEY` | ✅ | — | OpenAI API |
| `ANTHROPIC_API_KEY` | ✅ | — | Anthropic API |
| `AI_GATEWAY_BUDGET_LIMIT` | ❌ | `1000` | Monthly AI spend limit ($) |
| `S3_BUCKET` | ✅ | — | S3 bucket name |
| `S3_REGION` | ✅ | — | S3 region |
| `S3_ACCESS_KEY_ID` | ✅ | — | S3 access key |
| `S3_SECRET_ACCESS_KEY` | ✅ | — | S3 secret key |
| `STRIPE_SECRET_KEY` | ✅ | — | Stripe secret |
| `STRIPE_WEBHOOK_SECRET` | ✅ | — | Stripe webhook signing |
| `TWILIO_ACCOUNT_SID` | ❌ | — | Twilio SID |
| `TWILIO_AUTH_TOKEN` | ❌ | — | Twilio auth |
| `TWILIO_PHONE_NUMBER` | ❌ | — | Twilio phone number |

#### Client-Side (NEXT_PUBLIC_)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | ✅ | — | Public application URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | — | Stripe publishable key |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | — | Supabase URL (client) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | — | Supabase anon key (client) |
| `NEXT_PUBLIC_POSTHOG_KEY` | ❌ | — | PostHog analytics |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | — | Sentry error tracking |

### Rate Limit Configuration

```typescript
const RATE_LIMIT_PRESETS: Record<RateLimitPreset, RateLimitConfig> = {
  public:  { maxRequests: 50,  windowMs: 60_000 },
  general: { maxRequests: 100, windowMs: 60_000 },
  auth:    { maxRequests: 5,   windowMs: 60_000 },
  strict:  { maxRequests: 3,   windowMs: 60_000 },
  relaxed: { maxRequests: 200, windowMs: 60_000 },
};
```

### React Query Configuration

```typescript
const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 30_000,         // 30s before refetch
      gcTime: 5 * 60_000,        // 5min cache retention
      retry: 3,                   // 3 retries on failure
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,               // No auto-retry for mutations
    },
  },
};
```

### Tailwind Theme Extension

```typescript
// tailwind.config.ts
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../node_modules/@heroui/**/*.{js,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary-500))',
          foreground: 'hsl(var(--primary-foreground))',
          // ... all shades
        },
        // ... semantic colors
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        // Map to tokens
      },
    },
  },
  plugins: [
    require('@heroui/theme'),
    // Custom venture branding plugin
    // Animation utilities plugin
  ],
};
```

### SuperJSON Configuration

```typescript
// Configured on the tRPC transformer
import superjson from 'superjson';

// Handles: Date, Map, Set, BigInt, undefined, RegExp, Error, URL
export const transformer = superjson;

// Used in tRPC init:
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});
```

### Next.js Configuration

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      handlebars: 'handlebars/dist/handlebars.js',
    };
    return config;
  },
  transpilePackages: [
    // 33 @heroui/* packages
    '@heroui/react', '@heroui/button', '@heroui/input',
    '@heroui/table', '@heroui/modal', '@heroui/dropdown',
    // ... all 33

    // 17 @mcv/* workspace packages
    '@mcv/api', '@mcv/ui', '@mcv/kernel', '@mcv/db',
    '@mcv/auth', '@mcv/permissions', '@mcv/flags',
    // ... all 17

    // 3 @trpc/* packages
    '@trpc/server', '@trpc/client', '@trpc/react-query',
  ],
  serverExternalPackages: ['handlebars'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};
```

---

*Tier 6: Presentation — The MCV.ONE User Interface Layer*
