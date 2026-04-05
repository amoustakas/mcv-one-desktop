# @mcv/apps — API Reference

| Field            | Value                                    |
| ---------------- | ---------------------------------------- |
| **Package**      | `@mcv/apps`                              |
| **Scope**        | INTERNAL                                 |
| **Tier**         | 6 — Presentation Layer                   |
| **Last Updated** | February 2026                            |

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Server Actions](#server-actions)
3. [API Route Handlers](#api-route-handlers)
4. [Middleware Chain](#middleware-chain)
5. [Route Definitions](#route-definitions)
6. [Page Props & Params](#page-props--params)
7. [Type Definitions](#type-definitions)
8. [Error Handling Patterns](#error-handling-patterns)
9. [Config Reference](#config-reference)

---

## API Overview

The `@mcv/apps` package exposes backend functionality through three mechanisms:

### 1. tRPC Procedures (Primary)

The primary data channel. All type-safe API calls flow through the tRPC catch-all handler at `/api/trpc/[trpc]`. The unified `AppRouter` from `@mcv/api` aggregates all domain routers:

```typescript
// lib/trpc/client.ts — Client-side tRPC setup
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@mcv/api';

export const trpc = createTRPCReact<AppRouter>();
```

tRPC provides:
- **End-to-end type safety** — Router types flow from server to client without code generation
- **Automatic batching** — `httpBatchLink` combines concurrent calls into a single HTTP request
- **SuperJSON serialization** — Transparent Date, Map, Set, BigInt serialization
- **React Query integration** — Full cache management, refetching, optimistic updates

### 2. REST API Routes (75 handlers)

REST API routes handle domain-specific operations that benefit from traditional REST semantics or are called by external services:

| Domain | Handler Count | Purpose |
|--------|--------------|---------|
| Auth | 1 (catch-all) | Better Auth session management |
| Users | 10 | User CRUD, roles, invitations, impersonation |
| Ventures | 13 | Venture lifecycle, settings, API keys |
| Flags | 5 | Feature flag management and evaluation |
| Audit | 7 | Audit logs, exports, timelines |
| Activities | 6 | Activity feed, engagement, subscriptions |
| Storage | 7 | File upload, management, signed URLs |
| Notifications | 7 | Notification delivery and preferences |
| Gateway | 5 | AI model routing and completions |
| Permissions | 1 | Permission listing |
| Roles | 1 | Role management |
| Public | 8 | Public endpoints (cart, checkout, forms) |
| Webhooks | 3 | Stripe, storage event handlers |
| Health | 1 | Application health check |
| **Total** | **75** | |

### 3. Server Actions (Next.js)

Server Actions provide a direct RPC mechanism from Client Components to server-side functions without an explicit API route. They are used for form submissions and simple mutations where tRPC is overhead.

---

## Server Actions

### Authentication Actions

Server actions for authentication flows, wrapping `@mcv/auth` (Better Auth) client methods:

#### `signIn`

Signs in a user with email/password credentials.

```typescript
'use server';

import { authClient } from '@/lib/auth';

export async function signIn(formData: FormData): Promise<SignInResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const rememberMe = formData.get('rememberMe') === 'on';

  const result = await authClient.signIn.email({
    email,
    password,
    callbackURL: '/',
    rememberMe,
  });

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  if (result.data?.twoFactorRedirect) {
    return { success: true, redirect: '/mfa/verify' };
  }

  return { success: true, redirect: '/' };
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | ✓ | User email address |
| `password` | `string` | ✓ | User password |
| `rememberMe` | `boolean` | ✗ | Extend session duration |

**Returns:** `SignInResult`

```typescript
type SignInResult = {
  success: boolean;
  error?: string;
  redirect?: string;  // '/mfa/verify' if MFA required, '/' on success
};
```

#### `signOut`

Signs out the current user and redirects to the login page.

```typescript
'use server';

import { authClient } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function signOut(): Promise<void> {
  await authClient.signOut();
  redirect('/login');
}
```

**Parameters:** None

**Returns:** `void` (redirects to `/login`)

#### `signInWithMagicLink`

Sends a passwordless magic link to the user's email.

```typescript
'use server';

export async function signInWithMagicLink(formData: FormData): Promise<MagicLinkResult> {
  const email = formData.get('email') as string;

  const result = await authClient.signIn.magicLink({
    email,
    callbackURL: '/',
  });

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  return { success: true, message: 'Check your email for the login link.' };
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | ✓ | User email address |

**Returns:** `MagicLinkResult`

#### `verifyMFA`

Verifies a TOTP code during MFA-required login.

```typescript
'use server';

export async function verifyMFA(formData: FormData): Promise<MFAResult> {
  const code = formData.get('code') as string;
  const trustDevice = formData.get('trustDevice') === 'on';

  const result = await authClient.twoFactor.verify({
    code,
    trustDevice,
  });

  if (result.error) {
    return { success: false, error: 'Invalid code. Please try again.' };
  }

  return { success: true, redirect: '/' };
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | ✓ | 6-digit TOTP code |
| `trustDevice` | `boolean` | ✗ | Skip MFA on future logins from this device |

**Returns:** `MFAResult`

#### `setupMFA`

Initiates TOTP MFA setup, returning a QR code URI.

```typescript
'use server';

export async function setupMFA(): Promise<MFASetupResult> {
  const result = await authClient.twoFactor.enable();

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  return {
    success: true,
    totpURI: result.data.totpURI,
    backupCodes: result.data.backupCodes,
  };
}
```

**Returns:** `MFASetupResult`

```typescript
type MFASetupResult = {
  success: boolean;
  error?: string;
  totpURI?: string;         // URI for QR code generation
  backupCodes?: string[];   // One-time backup codes
};
```

#### `switchVenture`

Switches the active venture context (Super-Admin only).

```typescript
'use server';

import { revalidatePath } from 'next/cache';

export async function switchVenture(
  ventureSlug: VentureSlug | null,
): Promise<SwitchResult> {
  // Validate venture access
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  const hasAccess = ventureSlug === null || 
    session.user.ventureAccess.includes(ventureSlug);

  if (!hasAccess) {
    return { success: false, error: 'No access to this venture' };
  }

  // Update server-side venture context
  await setVentureContext(ventureSlug);

  // Revalidate affected paths
  revalidatePath('/(dashboard)', 'layout');

  const redirect = ventureSlug ? `/v/${ventureSlug}` : '/';
  return { success: true, redirect };
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureSlug` | `VentureSlug \| null` | ✓ | Venture to switch to, or `null` for global mode |

**Returns:** `SwitchResult`

### Venture Management Actions

Server actions for venture lifecycle management:

#### `createVenture`

Creates a new venture in the consortium.

```typescript
'use server';

export async function createVenture(data: CreateVentureInput): Promise<VentureResult> {
  const session = await requireSession();
  requireTier(session, 0); // Super Admin only

  const validated = createVentureSchema.parse(data);

  const venture = await db.insert(ventures).values({
    name: validated.name,
    slug: validated.slug,
    color: validated.color,
    domain: validated.domain,
    category: validated.category,
    status: 'development',
    createdBy: session.user.id,
  }).returning();

  await auditLog({
    action: 'venture.create',
    resourceType: 'venture',
    resourceId: venture[0].id,
    userId: session.user.id,
    metadata: { name: validated.name, slug: validated.slug },
  });

  revalidatePath('/admin/ventures');
  revalidatePath('/portfolio');

  return { success: true, venture: venture[0] };
}
```

**Input Schema:**

```typescript
const createVentureSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  domain: z.string().url().optional(),
  adminDomain: z.string().optional(),
  category: z.enum(['consumer', 'platform', 'service']),
  icon: z.string().optional(),
  hasEdgeToken: z.boolean().default(false),
});
```

#### `updateVenture`

Updates an existing venture's configuration.

```typescript
'use server';

export async function updateVenture(
  ventureId: string,
  data: UpdateVentureInput,
): Promise<VentureResult> {
  const session = await requireSession();
  requireTier(session, 0); // Super Admin only

  const validated = updateVentureSchema.parse(data);

  const venture = await db.update(ventures)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(ventures.id, ventureId))
    .returning();

  await auditLog({
    action: 'venture.update',
    resourceType: 'venture',
    resourceId: ventureId,
    userId: session.user.id,
    metadata: { changes: Object.keys(validated) },
  });

  revalidatePath('/admin/ventures');
  revalidatePath(`/admin/ventures/${ventureId}`);
  revalidatePath('/portfolio');

  return { success: true, venture: venture[0] };
}
```

#### `activateVenture` / `archiveVenture` / `suspendVenture`

Venture lifecycle state transitions:

```typescript
'use server';

export async function activateVenture(ventureId: string): Promise<VentureResult>;
export async function archiveVenture(ventureId: string): Promise<VentureResult>;
export async function suspendVenture(ventureId: string): Promise<VentureResult>;
```

### User Management Actions

#### `inviteUser`

Invites a new user to the platform with a specified role and venture access.

```typescript
'use server';

export async function inviteUser(data: InviteUserInput): Promise<InviteResult> {
  const session = await requireSession();
  requirePermission(session, 'users.invite');

  const validated = inviteUserSchema.parse(data);

  // Check for existing user or pending invitation
  const existing = await db.select()
    .from(users)
    .where(eq(users.email, validated.email))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: 'User already exists' };
  }

  const invitation = await db.insert(invitations).values({
    email: validated.email,
    role: validated.role,
    tier: validated.tier,
    ventureAccess: validated.ventureAccess,
    invitedBy: session.user.id,
    expiresAt: addDays(new Date(), 7),
  }).returning();

  // Send invitation email via Resend
  await sendInvitationEmail({
    to: validated.email,
    invitedBy: session.user.name,
    role: validated.role,
    token: invitation[0].token,
  });

  await auditLog({
    action: 'user.invite',
    resourceType: 'invitation',
    resourceId: invitation[0].id,
    userId: session.user.id,
    metadata: { email: validated.email, role: validated.role },
  });

  revalidatePath('/admin/users/invitations');

  return { success: true, invitation: invitation[0] };
}
```

**Input Schema:**

```typescript
const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'venture-admin', 'manager', 'operator']),
  tier: z.number().min(0).max(3),
  ventureAccess: z.array(z.string()).optional(),   // VentureSlug[]
  message: z.string().max(500).optional(),
});
```

#### `updateRole`

Updates a user's role and tier assignment.

```typescript
'use server';

export async function updateRole(
  userId: string,
  data: UpdateRoleInput,
): Promise<RoleResult> {
  const session = await requireSession();
  requirePermission(session, 'users.manage');

  // Prevent self-demotion for Super Admins
  if (userId === session.user.id && data.tier > session.user.tier) {
    return { success: false, error: 'Cannot demote yourself' };
  }

  const validated = updateRoleSchema.parse(data);

  await db.update(users)
    .set({
      role: validated.role,
      tier: validated.tier,
      ventureAccess: validated.ventureAccess,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await auditLog({
    action: 'user.role.update',
    resourceType: 'user',
    resourceId: userId,
    userId: session.user.id,
    metadata: { newRole: validated.role, newTier: validated.tier },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);

  return { success: true };
}
```

**Input Schema:**

```typescript
const updateRoleSchema = z.object({
  role: z.enum(['super-admin', 'admin', 'venture-admin', 'manager', 'operator']),
  tier: z.number().min(0).max(3),
  ventureAccess: z.array(z.string()).optional(),
});
```

#### `banUser` / `suspendUser`

User account actions with audit logging:

```typescript
'use server';

export async function banUser(userId: string, reason?: string): Promise<UserActionResult>;
export async function suspendUser(userId: string, until: Date, reason?: string): Promise<UserActionResult>;
export async function unbanUser(userId: string): Promise<UserActionResult>;
export async function unsuspendUser(userId: string): Promise<UserActionResult>;
```

### System Configuration Actions

#### `getConfig`

Retrieves system configuration values.

```typescript
'use server';

export async function getConfig(keys: string[]): Promise<ConfigResult> {
  const session = await requireSession();
  requireTier(session, 0); // Super Admin only

  const configs = await db.select()
    .from(systemConfig)
    .where(inArray(systemConfig.key, keys));

  return {
    success: true,
    config: Object.fromEntries(configs.map((c) => [c.key, c.value])),
  };
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `keys` | `string[]` | ✓ | Configuration key names to retrieve |

**Returns:** `ConfigResult`

```typescript
type ConfigResult = {
  success: boolean;
  config: Record<string, unknown>;
};
```

#### `updateConfig`

Updates system configuration values.

```typescript
'use server';

export async function updateConfig(
  updates: Record<string, unknown>,
): Promise<ConfigResult> {
  const session = await requireSession();
  requireTier(session, 0); // Super Admin only

  const validated = configUpdateSchema.parse(updates);

  for (const [key, value] of Object.entries(validated)) {
    await db.insert(systemConfig)
      .values({ key, value: JSON.stringify(value) })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { value: JSON.stringify(value), updatedAt: new Date() },
      });
  }

  await auditLog({
    action: 'system.config.update',
    resourceType: 'config',
    userId: session.user.id,
    metadata: { keys: Object.keys(validated) },
  });

  revalidatePath('/settings');

  return { success: true, config: validated };
}
```

### Feature Flag Actions

#### `evaluateFlags`

Evaluates feature flags for the current user and context.

```typescript
'use server';

export async function evaluateFlags(
  flagKeys: string[],
): Promise<FlagEvaluationResult> {
  const session = await requireSession();

  const context = {
    userId: session.user.id,
    userTier: session.user.tier,
    ventureSlug: session.activeVenture,
    environment: process.env.NODE_ENV,
  };

  const evaluations = await flagService.evaluateMultiple(flagKeys, context);

  return {
    success: true,
    flags: Object.fromEntries(
      evaluations.map((e) => [e.key, { enabled: e.enabled, value: e.value }])
    ),
  };
}
```

#### `toggleFlag`

Toggles a feature flag on/off (Super Admin only).

```typescript
'use server';

export async function toggleFlag(
  flagId: string,
  enabled: boolean,
): Promise<FlagResult> {
  const session = await requireSession();
  requireTier(session, 0);

  await db.update(featureFlags)
    .set({ enabled, updatedAt: new Date(), updatedBy: session.user.id })
    .where(eq(featureFlags.id, flagId));

  await auditLog({
    action: enabled ? 'flag.enable' : 'flag.disable',
    resourceType: 'feature-flag',
    resourceId: flagId,
    userId: session.user.id,
  });

  revalidatePath('/admin/flags');

  return { success: true };
}
```

---

## API Route Handlers

### tRPC Handler

**Endpoint:** `GET/POST /api/trpc/[trpc]`

The catch-all tRPC handler processes all type-safe RPC calls from the client. It connects to the unified `@mcv/api` router (`AppRouter`) which aggregates all domain routers.

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@mcv/api';
import { createContext } from '@mcv/api/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

### Authentication API

**Endpoint:** `ALL /api/auth/[...all]`

Better Auth catch-all handler. Handles all authentication flows:

| Sub-route | Method | Description |
|-----------|--------|-------------|
| `/api/auth/sign-in/email` | POST | Email/password sign-in |
| `/api/auth/sign-up/email` | POST | Email registration |
| `/api/auth/sign-out` | POST | Sign out (clear session) |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/verify-email` | GET | Verify email with token |
| `/api/auth/magic-link` | POST | Send magic link |
| `/api/auth/two-factor/enable` | POST | Enable TOTP MFA |
| `/api/auth/two-factor/verify` | POST | Verify TOTP code |
| `/api/auth/two-factor/disable` | POST | Disable MFA |
| `/api/auth/oauth/callback/*` | GET | OAuth redirect callback |
| `/api/auth/passkey/register` | POST | Register WebAuthn passkey |
| `/api/auth/passkey/authenticate` | POST | Authenticate with passkey |

### User Management API

#### `GET /api/users/[id]`

Retrieves a user by ID.

```typescript
// Response
{
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  tier: number;
  status: 'active' | 'banned' | 'suspended';
  ventureAccess: string[];
  createdAt: string;
  lastLoginAt: string | null;
}
```

#### `PATCH /api/users/[id]`

Updates a user's profile fields.

**Request Body:**

```typescript
{
  name?: string;
  image?: string;
  role?: string;
  tier?: number;
  ventureAccess?: string[];
}
```

#### `DELETE /api/users/[id]`

Soft-deletes a user (marks as deleted, does not remove data).

#### `POST /api/users/[id]/ban`

Bans or unbans a user.

**Request Body:**

```typescript
{
  action: 'ban' | 'unban';
  reason?: string;
}
```

#### `POST /api/users/[id]/suspend`

Suspends or unsuspends a user.

**Request Body:**

```typescript
{
  action: 'suspend' | 'unsuspend';
  until?: string;  // ISO date string
  reason?: string;
}
```

#### `GET /api/users/[id]/roles`

Lists all roles assigned to a user.

#### `PUT /api/users/[id]/roles`

Replaces all roles for a user.

**Request Body:**

```typescript
{
  roles: string[];
  tier: number;
  ventureAccess?: string[];
}
```

#### `GET /api/users/invitations`

Lists all pending invitations with pagination.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `status` | string | — | Filter by status: `pending`, `accepted`, `expired`, `revoked` |

#### `POST /api/users/invitations`

Creates a new user invitation.

**Request Body:**

```typescript
{
  email: string;
  role: string;
  tier: number;
  ventureAccess?: string[];
  message?: string;
}
```

#### `POST /api/users/invitations/[id]/resend`

Resends an invitation email.

#### `DELETE /api/users/invitations/[id]`

Revokes a pending invitation.

#### `POST /api/users/invitations/accept`

Accepts an invitation with a registration token.

**Request Body:**

```typescript
{
  token: string;
  name: string;
  password: string;
}
```

#### `POST /api/users/impersonation/[id]`

Starts or stops impersonation of a user (Super Admin only).

**Request Body:**

```typescript
{
  action: 'start' | 'stop';
}
```

### Venture Management API

#### `GET /api/ventures`

Lists all ventures with optional filtering.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `status` | string | — | Filter: `development`, `active`, `maintenance`, `archived` |
| `category` | string | — | Filter: `consumer`, `platform`, `service` |
| `search` | string | — | Name search |

#### `POST /api/ventures`

Creates a new venture (Super Admin only).

**Request Body:** See `createVentureSchema` in Server Actions section.

#### `GET /api/ventures/[id]`

Retrieves a venture by ID with full configuration.

#### `PATCH /api/ventures/[id]`

Updates a venture's configuration.

#### `DELETE /api/ventures/[id]`

Archives a venture (soft delete).

#### `POST /api/ventures/[id]/activate`

Transitions a venture to `active` status.

#### `POST /api/ventures/[id]/archive`

Transitions a venture to `archived` status.

#### `POST /api/ventures/[id]/suspend`

Transitions a venture to `maintenance` status.

#### `GET /api/ventures/[id]/settings`

Retrieves venture-specific settings.

#### `PATCH /api/ventures/[id]/settings`

Updates venture-specific settings.

#### `GET /api/ventures/by-slug/[slug]`

Looks up a venture by its URL slug.

#### `GET /api/ventures/mine`

Returns ventures the current user has access to.

#### Venture API Keys

| Route | Method | Description |
|-------|--------|-------------|
| `GET /api/ventures/api-keys` | GET | List API keys for a venture |
| `POST /api/ventures/api-keys` | POST | Create a new API key |
| `GET /api/ventures/api-keys/[id]` | GET | Get API key details |
| `DELETE /api/ventures/api-keys/[id]` | DELETE | Delete an API key |
| `POST /api/ventures/api-keys/[id]/revoke` | POST | Revoke an API key |
| `POST /api/ventures/api-keys/validate` | POST | Validate an API key |

### Feature Flags API

#### `GET /api/flags`

Lists all feature flags with optional filtering.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |
| `search` | string | — | Name search |
| `enabled` | boolean | — | Filter by enabled state |

#### `POST /api/flags`

Creates a new feature flag.

**Request Body:**

```typescript
{
  key: string;            // Unique flag key (e.g., 'crm.kanban-view')
  name: string;           // Human-readable name
  description?: string;
  enabled: boolean;
  targeting?: {
    rules: TargetingRule[];
    defaultValue: boolean;
  };
}
```

#### `POST /api/flags/evaluate`

Evaluates multiple flags for a given context.

**Request Body:**

```typescript
{
  flags: string[];        // Flag keys to evaluate
  context?: {
    userId?: string;
    ventureSlug?: string;
    environment?: string;
    attributes?: Record<string, unknown>;
  };
}
```

**Response:**

```typescript
{
  evaluations: {
    [key: string]: {
      enabled: boolean;
      value: unknown;
      reason: string;      // 'default' | 'targeting' | 'override'
    };
  };
}
```

### Audit API

#### `GET /api/audit/logs`

Queries audit logs with filtering and pagination.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |
| `action` | string | — | Filter by action type |
| `userId` | string | — | Filter by user |
| `resourceType` | string | — | Filter by resource type |
| `resourceId` | string | — | Filter by resource ID |
| `dateFrom` | string | — | ISO date filter start |
| `dateTo` | string | — | ISO date filter end |
| `ventureId` | string | — | Filter by venture |

#### `GET /api/audit/logs/[id]`

Retrieves detailed information for a single audit entry.

#### `GET /api/audit/stats`

Returns aggregate audit statistics.

**Response:**

```typescript
{
  totalEvents: number;
  eventsToday: number;
  topActions: { action: string; count: number }[];
  topUsers: { userId: string; name: string; count: number }[];
  recentActivity: AuditEntry[];
}
```

#### `POST /api/audit/exports`

Initiates an async audit data export.

**Request Body:**

```typescript
{
  format: 'csv' | 'json';
  filters: AuditFilters;
  dateRange: { from: string; to: string };
}
```

#### `GET /api/audit/exports/[id]`

Checks export status or downloads the completed export.

#### `GET /api/audit/timeline`

Returns audit events in a timeline format.

#### `GET /api/audit/timeline/user`

Returns a user-specific audit timeline.

#### `GET /api/audit/timeline/resource`

Returns a resource-specific audit timeline.

### Storage API

#### `POST /api/storage/upload`

Handles file upload with multipart form data.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✓ | The file to upload |
| `folder` | string | ✗ | Target folder path |
| `ventureId` | string | ✗ | Venture scope |
| `public` | boolean | ✗ | Public or private file |

**Response:**

```typescript
{
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  signedUrl?: string;
}
```

#### `GET /api/storage/files`

Lists files with pagination and filtering.

#### `GET /api/storage/files/[id]/signed-url`

Generates a time-limited signed URL for private file access.

**Response:**

```typescript
{
  signedUrl: string;
  expiresAt: string;  // ISO date, typically 1 hour
}
```

#### `GET /api/storage/quota`

Returns storage usage and quota information.

**Response:**

```typescript
{
  used: number;        // bytes
  limit: number;       // bytes
  percentage: number;  // 0-100
  breakdown: {
    venture: string;
    used: number;
  }[];
}
```

### AI Gateway API

#### `POST /api/gateway/chat`

Sends a chat completion request through the AI Gateway.

**Request Body:**

```typescript
{
  model: string;               // e.g., 'gpt-4o', 'claude-3-sonnet'
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  ventureId?: string;
}
```

#### `POST /api/gateway/stream`

Streaming chat completion (Server-Sent Events).

Returns `text/event-stream` with SSE format.

#### `GET /api/gateway/models`

Lists available AI models with their capabilities and costs.

#### `GET /api/gateway/budget`

Returns AI usage budget status.

**Response:**

```typescript
{
  monthlyLimit: number;
  currentUsage: number;
  remaining: number;
  breakdown: {
    model: string;
    requests: number;
    tokens: number;
    cost: number;
  }[];
}
```

### Notification API

#### `GET /api/notifications`

Lists notifications for the current user.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `unreadOnly` | boolean | false | Filter to unread only |
| `type` | string | — | Filter by type |

#### `GET /api/notifications/unread-count`

Returns the current user's unread notification count.

**Response:**

```typescript
{
  count: number;
}
```

#### `POST /api/notifications/mark-read`

Marks specific notifications as read.

**Request Body:**

```typescript
{
  ids: string[];
}
```

#### `POST /api/notifications/mark-all-read`

Marks all notifications as read.

#### `GET /api/notifications/preferences`

Returns notification preferences for the current user.

#### `PATCH /api/notifications/preferences`

Updates notification preferences.

**Request Body:**

```typescript
{
  email: boolean;
  push: boolean;
  inApp: boolean;
  channels: {
    [channelType: string]: boolean;
  };
}
```

### Webhook Handlers

#### `POST /api/webhooks/stripe`

Handles Stripe webhook events (payment confirmations, subscription changes, disputes).

**Headers:** `Stripe-Signature` (verified against `STRIPE_WEBHOOK_SECRET`)

#### `POST /api/webhooks/storage`

Handles storage event webhooks (file processing, virus scanning results).

#### `POST /api/webhooks/storage/optimize`

Handles image optimization webhook callbacks.

### Public API

Unauthenticated endpoints for public-facing features:

| Route | Method | Description |
|-------|--------|-------------|
| `POST /api/public/booking` | POST | Submit a booking request |
| `GET /api/public/cart` | GET | Get cart contents (session-based) |
| `POST /api/public/cart` | POST | Add item to cart |
| `POST /api/public/checkout` | POST | Process checkout |
| `POST /api/public/contact` | POST | Submit contact form |
| `GET /api/public/forms` | GET | List available public forms |
| `GET /api/public/forms/[id]` | GET | Get form definition |
| `POST /api/public/forms/[id]` | POST | Submit form response |
| `POST /api/public/newsletter` | POST | Newsletter signup |
| `GET /api/public/reviews` | GET | List product reviews |
| `POST /api/public/reviews` | POST | Submit product review |

### Health API

#### `GET /api/health`

Application health check endpoint.

**Response:**

```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
    redis: 'ok' | 'error';
    storage: 'ok' | 'error';
  };
}
```

---

## Middleware Chain

Requests flow through the following middleware chain:

```
Request
  │
  ▼
┌─────────────────────────────────────────┐
│  1. Next.js Edge Middleware              │
│     src/middleware.ts                     │
│                                         │
│  a) Path classification (public/private)│
│  b) Session cookie check                │
│  c) Rate limiting (auth routes)         │
│  d) Security header injection           │
│                                         │
│  Runs: Every request (except static)    │
│  Runtime: Edge (Vercel/Cloudflare)      │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  2. Next.js Route Handler               │
│     app/api/*/route.ts                   │
│                                         │
│  a) Parse request body/params           │
│  b) Validate input (Zod)               │
│  c) Execute business logic              │
│  d) Return JSON response                │
│                                         │
│  Runs: API requests only                │
│  Runtime: Node.js (Serverless)          │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  3. tRPC Context Middleware              │
│     @mcv/api/context.ts                  │
│                                         │
│  a) Extract session from request        │
│  b) Resolve user with permissions       │
│  c) Resolve active venture context      │
│  d) Set database session variables      │
│                                         │
│  Runs: tRPC requests only               │
│  Runtime: Node.js (Serverless)          │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  4. tRPC Procedure Middleware            │
│     @mcv/api/middleware.ts               │
│                                         │
│  a) isAuthenticated — verify session    │
│  b) isAuthorized(permission) — RBAC     │
│  c) isVentureScoped — tenant check      │
│  d) Input validation (Zod)              │
│                                         │
│  Runs: Per tRPC procedure               │
│  Runtime: Node.js (Serverless)          │
└─────────────────────────────────────────┘
```

---

## Route Definitions

### Complete Route Map

#### Authentication Routes (`/`)

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/login` | `LoginPage` | Public | Email/password login |
| `/register` | `RegisterPage` | Public | New account registration |
| `/forgot-password` | `ForgotPasswordPage` | Public | Password reset request |
| `/reset-password` | `ResetPasswordPage` | Public | Password reset form |
| `/magic-link` | `MagicLinkPage` | Public | Passwordless login |
| `/mfa/setup` | `MFASetupPage` | Auth | MFA configuration |
| `/mfa/verify` | `MFAVerifyPage` | Partial | MFA code verification |
| `/oauth/callback` | `OAuthCallbackPage` | Public | OAuth redirect |
| `/verify-email` | `VerifyEmailPage` | Public | Email verification |

#### Dashboard Routes (`/`)

| Path | Component | Auth | Permission | Description |
|------|-----------|------|-----------|-------------|
| `/` | `MissionControlPage` | Auth | — | Executive dashboard |
| `/analytics` | `AnalyticsPage` | Auth | — | Portfolio analytics |
| `/approvals` | `ApprovalsPage` | Auth | `approvals.view` | Approval queue |
| `/signals` | `SignalFeedPage` | Auth | — | Live signal feed |
| `/swarm` | `SwarmPage` | Auth | `ai.view` | AI swarm dashboard |

#### Admin Routes (`/admin/*`)

| Path | Auth | Permission | Description |
|------|------|-----------|-------------|
| `/admin/users` | Auth | `users.view` | User management |
| `/admin/users/[id]` | Auth | `users.view` | User detail |
| `/admin/users/invitations` | Auth | `users.invite` | Invitations |
| `/admin/roles` | Auth | `roles.manage` | Role management |
| `/admin/permissions` | Auth | `permissions.manage` | Permission matrix |
| `/admin/ventures` | Auth | `ventures.view` | Venture list |
| `/admin/ventures/[id]` | Auth | `ventures.view` | Venture detail |
| `/admin/ventures/new` | Auth | `ventures.create` | Create venture |
| `/admin/flags` | Auth | `flags.view` | Feature flags |
| `/admin/flags/[id]` | Auth | `flags.view` | Flag detail |
| `/admin/audit` | Auth | `audit.view` | Audit log |
| `/admin/audit/[id]` | Auth | `audit.view` | Audit detail |
| `/admin/storage` | Auth | `storage.manage` | Storage admin |
| `/admin/email` | Auth | `email.manage` | Email config |
| `/admin/email/templates` | Auth | `email.manage` | Email templates |
| `/admin/email/logs` | Auth | `email.view` | Email logs |
| `/admin/gateway` | Auth | `gateway.manage` | AI Gateway |
| `/admin/activity` | Auth | — | Activity feed |

#### Venture Routes (`/v/[ventureSlug]/*`)

| Path | Auth | Permission | Description |
|------|------|-----------|-------------|
| `/v/[ventureSlug]` | Auth | Venture access | Venture dashboard |
| `/v/[ventureSlug]/engineering` | Auth | Venture access | Engineering |
| `/v/[ventureSlug]/engineering/ops` | Auth | Venture access | DevOps |
| `/v/[ventureSlug]/growth` | Auth | Venture access | Growth metrics |
| `/v/[ventureSlug]/growth/analytics` | Auth | Venture access | Analytics |
| `/v/[ventureSlug]/operations` | Auth | Venture access | Operations |
| `/v/[ventureSlug]/settings` | Auth | `venture.settings` | Settings |
| `/v/[ventureSlug]/tasks` | Auth | Venture access | Tasks |
| `/v/[ventureSlug]/tasks/sprints` | Auth | Venture access | Sprints |

---

## Page Props & Params

### Dynamic Route Parameters

```typescript
// Venture-scoped pages
interface VenturePageProps {
  params: Promise<{ ventureSlug: string }>;
}

// Entity detail pages
interface EntityPageProps {
  params: Promise<{ id: string }>;
}

// Combined params
interface VentureEntityPageProps {
  params: Promise<{ ventureSlug: string; id: string }>;
}

// Usage in a page component
export default async function VentureDashboard({ params }: VenturePageProps) {
  const { ventureSlug } = await params;
  // ... fetch venture data
}
```

### Search Params

```typescript
// Pages with search/filter/pagination
interface SearchablePageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    limit?: string;
    sort?: string;
    order?: string;
    status?: string;
    venture?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

// Usage
export default async function UsersPage({ searchParams }: SearchablePageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? '1');
  const limit = parseInt(params.limit ?? '20');
  const users = await trpc.users.list({ page, limit, search: params.q });
  // ...
}
```

---

## Type Definitions

### Core Types

```typescript
// User type (from AuthProvider)
interface User {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: 'super-admin' | 'admin' | 'venture-admin' | 'manager' | 'operator';
  tier: 0 | 1 | 2 | 3;
  status: 'active' | 'banned' | 'suspended';
  ventureAccess: VentureSlug[];
  permissions: string[];
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

// Session type
interface Session {
  token: string;
  userId: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  impersonatingUserId?: string;
}

// Venture type
interface Venture {
  id: string;
  name: string;
  slug: VentureSlug;
  color: string;
  accentColor: string;
  icon: string;
  domain: string;
  adminDomain: string;
  category: 'consumer' | 'platform' | 'service';
  status: 'development' | 'active' | 'maintenance' | 'archived';
  hasEdgeToken: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Venture slug union type
type VentureSlug = 'betedge' | 'edgeiq' | 'mcvgg' | 'studio' | 'agency' | 'sentinel';
```

### API Response Types

```typescript
// Standard success response
interface ApiResponse<T> {
  success: true;
  data: T;
}

// Standard error response
interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;  // Zod validation errors
}

// Paginated response
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Server action result
interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
  redirect?: string;
}
```

### Navigation Types

```typescript
type NavigationLayer = 'global' | 'venture' | 'module';

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  permission?: string;
  children?: NavigationItem[];
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

interface Breadcrumb {
  label: string;
  href?: string;
  icon?: LucideIcon;
}
```

### Audit Types

```typescript
interface AuditEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  ventureId?: string;
  createdAt: Date;
}

type AuditAction =
  | 'user.create' | 'user.update' | 'user.delete'
  | 'user.invite' | 'user.ban' | 'user.suspend'
  | 'user.role.update' | 'user.impersonate'
  | 'venture.create' | 'venture.update' | 'venture.activate'
  | 'venture.archive' | 'venture.suspend'
  | 'flag.create' | 'flag.enable' | 'flag.disable'
  | 'system.config.update'
  | 'auth.login' | 'auth.logout' | 'auth.mfa.enable';
```

---

## Error Handling Patterns

### Server Action Errors

All server actions return a consistent result type:

```typescript
type ActionResult<T = void> = 
  | { success: true; data?: T; redirect?: string }
  | { success: false; error: string; code?: string };
```

Usage in Client Components:

```typescript
'use client';

function CreateVentureForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createVenture(Object.fromEntries(formData));
      if (!result.success) {
        setError(result.error);
      } else if (result.redirect) {
        router.push(result.redirect);
      }
    });
  }

  return (
    <form action={handleSubmit}>
      {error && <Alert variant="error">{error}</Alert>}
      {/* form fields */}
    </form>
  );
}
```

### tRPC Error Handling

tRPC errors use standard error codes:

```typescript
import { TRPCError } from '@trpc/server';

// In tRPC procedures
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Venture not found',
});

throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'Insufficient permissions',
});

throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'Invalid input',
  cause: zodError,      // Zod validation error
});
```

| tRPC Code | HTTP Status | Usage |
|-----------|-------------|-------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid input / validation error |
| `CONFLICT` | 409 | Duplicate resource |
| `TOO_MANY_REQUESTS` | 429 | Rate limited |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

### Client-Side Error Handling

```typescript
// Global error handler for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      onError: (error) => {
        if (error instanceof TRPCClientError) {
          if (error.data?.code === 'UNAUTHORIZED') {
            router.push('/login');
          }
        }
      },
    },
    mutations: {
      onError: (error) => {
        toast.error(error.message || 'An error occurred');
      },
    },
  },
});
```

### Error Boundary Pattern

```typescript
// app/(dashboard)/(global)/[module]/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@heroui/button';

export default function ModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Module error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold text-zinc-200">
        Something went wrong
      </h2>
      <p className="text-zinc-400 text-center max-w-md">
        {error.message}
      </p>
      {error.digest && (
        <p className="text-xs text-zinc-500">Error ID: {error.digest}</p>
      )}
      <Button onPress={reset} variant="bordered">
        Try Again
      </Button>
    </div>
  );
}
```

### HTTP Status Code Usage

| Status | When Used |
|--------|-----------|
| `200` | Successful GET, PATCH |
| `201` | Successful POST (creation) |
| `204` | Successful DELETE |
| `302` | Authentication redirect |
| `400` | Validation error (Zod) |
| `401` | Not authenticated (middleware) |
| `403` | Insufficient permissions |
| `404` | Resource not found |
| `429` | Rate limited (middleware) |
| `500` | Unexpected server error |

---

## Config Reference

### Environment Variable Schema

All environment variables are validated at startup using `@t3-oss/env-nextjs`:

```typescript
// src/env.ts
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    AI_GATEWAY_BUDGET_LIMIT: z.coerce.number().optional(),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_CONNECT_CLIENT_ID: z.string().optional(),
    PUSHER_APP_ID: z.string().optional(),
    PUSHER_KEY: z.string().optional(),
    PUSHER_SECRET: z.string().optional(),
    PUSHER_CLUSTER: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
    NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    // ... all other env vars mapped
  },
});
```

### React Query Default Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      staleTime: 60 * 1000,         // 1 minute
      gcTime: 5 * 60 * 1000,        // 5 minutes (garbage collection)
      retry: 1,                      // Retry once
      retryDelay: 1000,              // 1 second delay before retry
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Rate Limit Configuration

```typescript
const rateLimits: Record<string, RateLimitConfig> = {
  '/login':           { limit: 5,  window: '1m'  },
  '/register':        { limit: 3,  window: '1m'  },
  '/forgot-password': { limit: 3,  window: '5m'  },
  '/mfa/verify':      { limit: 5,  window: '5m'  },
  '/magic-link':      { limit: 3,  window: '5m'  },
  '/passkey':         { limit: 10, window: '1m'  },
};
```

### Next.js Configuration Summary

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: [/* 53 packages */],
  serverExternalPackages: ['handlebars'],
  webpack: (config) => {
    config.resolve.alias.handlebars = 'handlebars/dist/handlebars.js';
    return config;
  },
};
```

### Middleware Matcher

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
```

### Provider Configuration

```typescript
// Theme provider
<NextThemesProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem={false}
  disableTransitionOnChange
/>

// HeroUI provider
<HeroUIProvider navigate={router.push}>
  {/* routing integration */}
</HeroUIProvider>
```

### RBAC Tier Configuration

| Tier | Role | Numeric | Access Level |
|------|------|---------|-------------|
| 0 | Super Admin | `0` | Full platform — all ventures, all modules |
| 1 | Venture Admin | `1` | Full venture — all modules within assigned ventures |
| 2 | Manager | `2` | Module level — manage specific modules within ventures |
| 3 | Operator | `3` | Operational — read/execute within assigned modules |

---

*@mcv/apps — Application Layer*
