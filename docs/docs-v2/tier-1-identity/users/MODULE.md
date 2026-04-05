# @mcv/identity/users — User Management Module

**Parent Package:** @mcv/identity  
**Tier:** 1 (Security Boundary)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `users` module provides comprehensive user lifecycle management for the MCV ecosystem. It handles user CRUD operations, profile management, status transitions (suspend/ban/delete), search and filtering, invitation workflows, and impersonation for support purposes. All operations integrate with the audit system and respect venture-scoped access controls.

**Every user action is logged. Every status change is auditable.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SERVER — CORE USER OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// User CRUD
export {
  listUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  searchUsers,
} from './server/services/user-service';

// Status Management
export {
  suspendUser,
  unsuspendUser,
  banUser,
  deleteUser,
} from './server/services/user-service';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER — INVITATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createInvitation,
  getInvitationById,
  getInvitationByToken,
  acceptInvitation,
  revokeInvitation,
  resendInvitation,
  bulkInvite,
  listInvitations,
} from './server/services/invite-service';

// Email sending
export { sendInvitationEmail } from './server/services/auth-emails';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER — IMPERSONATION (Admin Support)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  startImpersonation,
  endImpersonation,
  logImpersonationAction,
  getImpersonationById,
  getImpersonationHistory,
  getActiveImpersonation,
} from './server/services/impersonation-service';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER — VENTURE MEMBERSHIP
// ═══════════════════════════════════════════════════════════════════════════════

export {
  addUserToVenture,
  removeUserFromVenture,
  getUserVentures,
  getVentureMembers,
} from './server/services/membership-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT — REACT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export { useUser, useCurrentUser } from './client/hooks/use-user';
export { useUsers } from './client/hooks/use-users';
export { useUserSearch } from './client/hooks/use-user-search';
export { useUserActions } from './client/hooks/use-user-actions';
export { useInvitations, useInvitationActions } from './client/hooks/use-invitations';
export { useImpersonation } from './client/hooks/use-impersonation';
export { useAvailableRoles } from './client/hooks/use-available-roles';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT — UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  formatUserName,
  getInitials,
  getAvatarFallback,
  formatLastActive,
} from './client/utils';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Core user types
  User,
  NewUser,
  UserStatus,
  UserProfile,
  UserListItem,
  UserWithDetails,
  
  // Filter and pagination
  UserFilters,
  UserSortOptions,
  UserPaginationOptions,
  UserCursorPaginationOptions,
  UserListOptions,
  PaginatedResult,
  CursorPaginatedResult,
  
  // Invitation types
  InviteUserInput,
  InvitationWithDetails,
  BulkInviteInput,
  BulkInviteResult,
  InvitationStatus,
  
  // Impersonation types
  StartImpersonationInput,
  ImpersonationLog,
  ImpersonationAction,
  
  // Activity types
  UserActivity,
  ActivityType,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              USER MANAGEMENT ARCHITECTURE                               │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              API LAYER (tRPC)                                        │ │
│  │                                                                                      │ │
│  │  users.list  users.getById  users.update  users.suspend  users.ban  users.delete   │ │
│  │                                                                                      │ │
│  │  invitations.create  invitations.accept  invitations.revoke  invitations.resend    │ │
│  │                                                                                      │ │
│  │  impersonation.start  impersonation.end  impersonation.history                      │ │
│  │                                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                          │                                               │
│                                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              SERVICE LAYER                                           │ │
│  │                                                                                      │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                       │ │
│  │  │  user-service   │  │  invite-service │  │  impersonation  │                       │ │
│  │  │                 │  │                 │  │    -service     │                       │ │
│  │  │ • CRUD ops      │  │ • Token gen     │  │                 │                       │ │
│  │  │ • Status mgmt   │  │ • Email send    │  │ • Session mgmt  │                       │ │
│  │  │ • Search/filter │  │ • Acceptance    │  │ • Action logging│                       │ │
│  │  │ • Soft delete   │  │ • Bulk ops      │  │ • Audit trail   │                       │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                       │ │
│  │           │                   │                     │                                │ │
│  │           └───────────────────┼─────────────────────┘                                │ │
│  │                               ▼                                                      │ │
│  │                       ┌───────────────┐                                              │ │
│  │                       │  @mcv/audit   │ ──────────▶ Audit Logs                       │ │
│  │                       └───────────────┘                                              │ │
│  │                                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                          │                                               │
│                                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              DATA LAYER                                              │ │
│  │                                                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │ │
│  │  │    users     │  │    user_     │  │   venture_   │  │impersonation_│              │ │
│  │  │              │  │ invitations  │  │ memberships  │  │    logs      │              │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘              │ │
│  │                                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## User Status Lifecycle

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
              ┌──────────┐                                    │
              │  active  │◄────────────────────────────────┐  │
              └────┬─────┘                                 │  │
                   │                                       │  │
      ┌────────────┼────────────────────┐                 │  │
      │            │                    │                 │  │
      ▼            ▼                    ▼                 │  │
┌───────────┐ ┌──────────┐        ┌──────────┐           │  │
│ suspended │ │  banned  │        │ deleted  │           │  │
└─────┬─────┘ └──────────┘        └──────────┘           │  │
      │                                                   │  │
      │ unsuspend                                         │  │
      └───────────────────────────────────────────────────┘  │
                                                             │
      Note: 'banned' and 'deleted' are terminal states       │
      Recovery requires manual database intervention         │
      ───────────────────────────────────────────────────────┘
```

| Status | Description | Reversible | Sessions | Can Login |
|--------|-------------|------------|----------|-----------|
| `active` | Normal active user | — | Active | Yes |
| `suspended` | Temporarily blocked | Yes | Revoked | No |
| `banned` | Permanently blocked | No* | Revoked | No |
| `deleted` | Soft-deleted (PII anonymized) | No* | Revoked | No |

*\*Requires database admin intervention to reverse.*

---

## Core Types

### User Entity

```typescript
interface User {
  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════
  id: string;                          // UUID primary key
  email: string;                       // Unique, required
  username: string | null;             // Unique, optional (Better Auth Username plugin)
  emailVerified: boolean;              // true after verification
  phone: string | null;                // E.164 format
  phoneVerified: boolean;              // true after SMS verification

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════════════════════════════════════════
  displayName: string | null;          // Preferred display name
  firstName: string | null;            // Legal first name
  lastName: string | null;             // Legal last name
  avatarUrl: string | null;            // URL to profile image

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN/MODERATION
  // ═══════════════════════════════════════════════════════════════════════════
  role: string;                        // Legacy role field ('user' | 'admin')
  banned: boolean;                     // Quick ban flag
  banReason: string | null;            // Human-readable reason
  banExpires: Date | null;             // Optional expiry for temp bans

  // ═══════════════════════════════════════════════════════════════════════════
  // PREFERENCES
  // ═══════════════════════════════════════════════════════════════════════════
  timezone: string;                    // IANA timezone (default: 'UTC')
  locale: string;                      // BCP 47 language tag (default: 'en')

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS & SECURITY
  // ═══════════════════════════════════════════════════════════════════════════
  status: UserStatus;                  // 'active' | 'suspended' | 'banned' | 'deleted'
  mfaEnabled: boolean;                 // MFA configured
  twoFactorEnabled: boolean;           // Better Auth 2FA flag

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  metadata: Record<string, unknown> | null;  // Arbitrary JSON

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════
  createdAt: Date;                     // Account creation time
  updatedAt: Date;                     // Last modification
  lastLoginAt: Date | null;            // Most recent successful login
}

type UserStatus = 'active' | 'suspended' | 'banned' | 'deleted';
```

### User with Details (Rich View)

```typescript
interface UserWithDetails extends User {
  // Roles assigned to this user
  roles: Array<{
    id: string;
    slug: string;
    name: string;
    level: number;
    ventureId: string | null;  // null = global role
  }>;

  // Ventures the user belongs to
  ventures: Array<{
    id: string;
    slug: string;
    name: string;
    joinedAt: Date;
  }>;

  // Computed statistics
  stats: {
    totalSessions: number;      // All-time session count
    lastActiveAt: Date | null;  // Most recent activity
    createdAt: Date;           // Convenience duplicate
  };
}
```

### User List Item (Optimized for Tables)

```typescript
interface UserListItem {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  roles: Array<{ slug: string; name: string }>;
  lastLoginAt: Date | null;
  createdAt: Date;
}
```

### User Profile (Editable Fields)

```typescript
interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  timezone: string;
  locale: string;
  status: UserStatus;
  mfaEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## User CRUD Operations

### List Users (Paginated)

```typescript
import { listUsers } from '@mcv/identity/users';
import type { UserFilters, UserSortOptions, PaginatedResult, UserListItem } from '@mcv/identity/users';

// ═══════════════════════════════════════════════════════════════════════════════
// BASIC LIST WITH PAGINATION
// ═══════════════════════════════════════════════════════════════════════════════

const result: PaginatedResult<UserListItem> = await listUsers({
  pagination: { page: 1, limit: 20 },
});

console.log(result);
// {
//   items: [...],        // 20 users
//   total: 1234,         // Total matching users
//   page: 1,
//   limit: 20,
//   totalPages: 62,
//   hasMore: true,
// }

// ═══════════════════════════════════════════════════════════════════════════════
// FILTERED + SORTED LIST
// ═══════════════════════════════════════════════════════════════════════════════

const filteredResult = await listUsers({
  filters: {
    search: 'john',                          // Search email, displayName, firstName, lastName
    status: ['active', 'suspended'],         // Multiple statuses
    roles: ['venture_admin', 'manager'],     // Has any of these roles
    ventureId: 'venture-123',                // Member of specific venture
    mfaEnabled: true,                        // MFA is configured
    emailVerified: true,                     // Email verified
    createdAfter: new Date('2024-01-01'),   // Created on or after
    lastActiveAfter: subDays(new Date(), 30), // Active in last 30 days
  },
  sort: {
    field: 'lastLoginAt',                   // Sort by last login
    direction: 'desc',                      // Most recent first
  },
  pagination: {
    page: 1,
    limit: 50,
  },
});
```

### Filter Options

```typescript
interface UserFilters {
  // Text search (iLIKE on email, displayName, firstName, lastName)
  search?: string;

  // Status filter (single or array)
  status?: UserStatus | UserStatus[];

  // Role filter (user has any of these role slugs)
  roles?: string[];

  // Venture membership filter
  ventureId?: string;

  // MFA status
  mfaEnabled?: boolean;

  // Email verification status
  emailVerified?: boolean;

  // Date range filters
  createdAfter?: Date;
  createdBefore?: Date;
  lastActiveAfter?: Date;
  lastActiveBefore?: Date;
}

interface UserSortOptions {
  field: 'displayName' | 'email' | 'createdAt' | 'lastLoginAt' | 'status';
  direction: 'asc' | 'desc';
}
```

### Get User by ID

```typescript
import { getUserById } from '@mcv/identity/users';

const user = await getUserById('user-123');

if (!user) {
  throw new NotFoundError('User not found');
}

// user has full details: roles, ventures, stats
console.log(user.roles);      // [{ slug: 'admin', name: 'Admin', level: 700 }]
console.log(user.ventures);   // [{ id: 'v-1', slug: 'acme', name: 'ACME Corp' }]
console.log(user.stats);      // { totalSessions: 45, lastActiveAt: Date }
```

### Update User Profile

```typescript
import { updateUser } from '@mcv/identity/users';

// Only profile fields can be updated (no status, email, etc.)
const updated = await updateUser(
  'user-123',
  {
    displayName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: 'https://cdn.example.com/avatars/john.jpg',
    phone: '+1-555-123-4567',
    timezone: 'America/New_York',
    locale: 'en-US',
  },
  actorId  // Who made the change (for audit)
);

// Automatically logs to @mcv/audit with field-level changes
```

### Search Users (Typeahead)

```typescript
import { searchUsers } from '@mcv/identity/users';

// Quick search for autocomplete/typeahead
const results = await searchUsers('joh', {
  ventureId: 'venture-123',  // Optional: scope to venture
  limit: 10,
});

// Returns: [{ id, email, displayName, avatarUrl }]
// Only returns active users
```

---

## Status Management

### Suspend User

```typescript
import { suspendUser, unsuspendUser } from '@mcv/identity/users';

// Suspend a user (reversible)
await suspendUser(
  'user-123',
  'Policy violation: spam behavior',
  actorId
);
// - Sets status = 'suspended'
// - Sets banned = true
// - Stores banReason
// - Revokes ALL active sessions
// - Logs to audit (isSensitive: true)

// Unsuspend (reinstate)
await unsuspendUser('user-123', actorId);
// - Sets status = 'active'
// - Clears banned, banReason, banExpires
// - Logs to audit
```

### Ban User

```typescript
import { banUser } from '@mcv/identity/users';

// Ban permanently (admin action)
await banUser(
  'user-123',
  'Repeated ToS violations',
  actorId
);
// - Sets status = 'banned'
// - Sets banned = true
// - Stores banReason
// - Revokes ALL active sessions
// - Logs to audit (isSensitive: true)

// ⚠️ CANNOT BE REVERSED via API
// Requires manual database intervention
```

### Delete User (Soft)

```typescript
import { deleteUser } from '@mcv/identity/users';

// Soft delete with PII anonymization
await deleteUser('user-123', actorId);
// - Sets status = 'deleted'
// - Transforms email: 'deleted_{id}_{original_email}'
// - Revokes ALL active sessions
// - Logs to audit (isSensitive: true)

// ⚠️ User data is preserved but anonymized
// ⚠️ CANNOT BE REVERSED via API
```

---

## Invitation System

### Create Invitation

```typescript
import { createInvitation } from '@mcv/identity/users';
import type { InvitationWithDetails } from '@mcv/identity/users';

const invitation: InvitationWithDetails = await createInvitation(
  {
    email: 'newuser@example.com',
    ventureId: 'venture-123',
    roleId: 'role-manager-id',  // Optional: assign role on acceptance
    message: 'Welcome to the team!',  // Optional: included in email
    expiresInDays: 7,  // Default: 7
  },
  inviterUserId  // Who sent the invitation
);

// Returns full invitation details including:
// - Generated secure token
// - Venture and role info
// - Inviter details

// Automatically:
// - Generates secure 64-character hex token
// - Sends invitation email
// - Logs to audit
```

### Invitation Validation

```typescript
// Checks performed before creating invitation:
// 1. User doesn't already exist in venture
// 2. No pending invitation for same email + venture
// 3. Venture exists and inviter has permission
```

### Accept Invitation

```typescript
import { getInvitationByToken, acceptInvitation } from '@mcv/identity/users';

// Validate token first
const invitation = await getInvitationByToken(token);

if (!invitation) {
  throw new Error('Invalid invitation');
}

if (invitation.status !== 'pending') {
  throw new Error(`Invitation is ${invitation.status}`);
}

// Accept the invitation
await acceptInvitation(token, acceptingUserId);
// - Adds user to venture (venture_memberships)
// - Assigns specified role (user_roles)
// - Updates invitation status to 'accepted'
// - Logs to audit
```

### Manage Invitations

```typescript
import { 
  revokeInvitation, 
  resendInvitation, 
  listInvitations 
} from '@mcv/identity/users';

// Revoke a pending invitation
await revokeInvitation(invitationId, actorId);
// Sets status = 'revoked'

// Resend with new token and extended expiry
await resendInvitation(invitationId);
// - Generates new secure token
// - Extends expiry by 7 days
// - Sends new email

// List all invitations for a venture
const invitations = await listInvitations(
  'venture-123',
  'pending'  // Optional: filter by status
);
```

### Bulk Invite

```typescript
import { bulkInvite } from '@mcv/identity/users';

const result = await bulkInvite(
  {
    emails: [
      'user1@example.com',
      'user2@example.com',
      'user3@example.com',
    ],
    ventureId: 'venture-123',
    roleId: 'role-member-id',
    message: 'You have been invited to join our team.',
  },
  inviterUserId
);

console.log(result);
// {
//   successful: ['user1@example.com', 'user3@example.com'],
//   failed: [
//     { email: 'user2@example.com', reason: 'User is already a member' }
//   ]
// }
```

### Invitation Types

```typescript
interface InviteUserInput {
  email: string;
  ventureId: string;
  roleId?: string;
  message?: string;
  expiresInDays?: number;
}

interface InvitationWithDetails {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  message: string | null;
  venture: {
    id: string;
    slug: string;
    name: string;
  };
  role: {
    id: string;
    slug: string;
    name: string;
  } | null;
  inviter: {
    id: string;
    displayName: string | null;
    email: string | null;
  };
  createdAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
}

interface BulkInviteInput {
  emails: string[];
  ventureId: string;
  roleId?: string;
  message?: string;
}

interface BulkInviteResult {
  successful: string[];
  failed: Array<{ email: string; reason: string }>;
}
```

---

## Impersonation (Admin Support)

Impersonation allows administrators to act as another user for troubleshooting purposes. **All actions during impersonation are logged.**

### Start Impersonation

```typescript
import { startImpersonation } from '@mcv/identity/users';

const { impersonationId, sessionToken } = await startImpersonation({
  adminId: 'admin-user-id',
  targetUserId: 'target-user-id',
  ventureId: 'venture-123',  // Optional: scope to venture
  reason: 'Debugging user-reported dashboard issue',  // Required
  ticketId: 'SUPPORT-456',  // Optional: link to support ticket
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});

// Validation checks:
// - Target user exists and is active
// - Admin is not impersonating themselves
// - Admin has impersonation permission

// Logs to audit with category: 'security', isSensitive: true
```

### Log Actions During Impersonation

```typescript
import { logImpersonationAction } from '@mcv/identity/users';

// Every significant action during impersonation should be logged
await logImpersonationAction(impersonationId, {
  action: 'update',
  resource: 'deal',
  details: {
    dealId: 'deal-789',
    changes: { status: 'won' },
  },
});

// Actions are appended to actionsLog array in impersonation_logs
```

### End Impersonation

```typescript
import { endImpersonation } from '@mcv/identity/users';

await endImpersonation(impersonationId);
// - Sets endedAt timestamp
// - Logs to audit
```

### View Impersonation History

```typescript
import { 
  getImpersonationById, 
  getImpersonationHistory,
  getActiveImpersonation,
} from '@mcv/identity/users';

// Get single impersonation with admin/target details
const log = await getImpersonationById(impersonationId);

// Get history with filters
const history = await getImpersonationHistory({
  adminId: 'admin-user-id',      // Filter by admin
  targetUserId: 'user-123',      // Filter by target
  ventureId: 'venture-123',      // Filter by venture
  limit: 50,
});

// Check if admin has active impersonation session
const active = await getActiveImpersonation(adminId);
if (active) {
  console.log('Currently impersonating:', active.targetUser.email);
}
```

### Impersonation Types

```typescript
interface StartImpersonationInput {
  adminId: string;
  targetUserId: string;
  ventureId?: string;
  reason: string;           // Required for audit trail
  ticketId?: string;        // Optional support ticket reference
  ipAddress?: string;
  userAgent?: string;
}

interface ImpersonationAction {
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

interface ImpersonationLog {
  id: string;
  adminId: string;
  targetUserId: string;
  ventureId: string | null;
  reason: string;
  ticketId: string | null;
  actionsLog: ImpersonationAction[];
  ipAddress: string | null;
  userAgent: string | null;
  startedAt: Date;
  endedAt: Date | null;
}
```

---

## React Hooks

### useUsers (List with Filters)

```tsx
import { useUsers } from '@mcv/identity/users';

function UserTable() {
  const {
    data,          // PaginatedResult<UserListItem>
    isLoading,
    error,
    filters,
    setFilters,
    sort,
    setSort,
    page,
    setPage,
    refresh,
  } = useUsers({
    ventureId: currentVenture.id,
    initialLimit: 20,
  });

  return (
    <div>
      <SearchInput
        value={filters.search}
        onChange={(search) => setFilters({ ...filters, search })}
      />
      
      <StatusFilter
        value={filters.status}
        onChange={(status) => setFilters({ ...filters, status })}
      />

      <Table
        data={data?.items ?? []}
        columns={columns}
        sort={sort}
        onSort={setSort}
      />

      <Pagination
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### useUser (Single User)

```tsx
import { useUser } from '@mcv/identity/users';

function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error, refetch } = useUser(userId);

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} />;
  if (!user) return <NotFound />;

  return (
    <Card>
      <Avatar src={user.avatarUrl} fallback={getInitials(user)} />
      <h2>{formatUserName(user)}</h2>
      <p>{user.email}</p>
      
      <RoleBadges roles={user.roles} />
      <VentureList ventures={user.ventures} />
    </Card>
  );
}
```

### useUserActions (Admin Actions)

```tsx
import { useUserActions } from '@mcv/identity/users';

function UserAdminActions({ userId }: { userId: string }) {
  const { 
    suspendUser, 
    unsuspendUser, 
    banUser, 
    deleteUser,
    isLoading,
  } = useUserActions();

  const handleSuspend = async () => {
    const reason = await prompt('Enter suspension reason:');
    if (reason) {
      await suspendUser(userId, reason);
      toast.success('User suspended');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuItem onClick={handleSuspend} disabled={isLoading}>
        Suspend User
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={() => banUser(userId, 'Terms violation')}
        variant="destructive"
      >
        Ban User
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
```

### useInvitations

```tsx
import { useInvitations, useInvitationActions } from '@mcv/identity/users';

function InvitationsPanel({ ventureId }: { ventureId: string }) {
  const { data: invitations, isLoading } = useInvitations(ventureId);
  const { createInvitation, revokeInvitation, resendInvitation } = useInvitationActions();

  const handleInvite = async (email: string, roleId?: string) => {
    await createInvitation({ email, ventureId, roleId });
    toast.success(`Invitation sent to ${email}`);
  };

  return (
    <div>
      <InviteForm onSubmit={handleInvite} />
      
      <InvitationList
        invitations={invitations}
        onRevoke={revokeInvitation}
        onResend={resendInvitation}
      />
    </div>
  );
}
```

### useImpersonation

```tsx
import { useImpersonation } from '@mcv/identity/users';

function ImpersonationBanner() {
  const { 
    isImpersonating, 
    targetUser, 
    endImpersonation,
    actionsLogged,
  } = useImpersonation();

  if (!isImpersonating) return null;

  return (
    <Banner variant="warning">
      <span>
        You are viewing as <strong>{targetUser?.email}</strong>
      </span>
      <span className="muted">
        {actionsLogged} actions logged
      </span>
      <Button onClick={endImpersonation}>
        End Impersonation
      </Button>
    </Banner>
  );
}
```

---

## Database Schema

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// USERS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Identity
  email: text('email').unique().notNull(),
  username: text('username').unique(),              // Better Auth Username plugin
  emailVerified: boolean('email_verified').default(false),
  phone: text('phone'),
  phoneVerified: boolean('phone_verified').default(false),

  // Profile
  displayName: text('display_name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatarUrl: text('avatar_url'),

  // Admin Plugin (Better Auth)
  role: text('role').default('user'),               // Legacy role
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { withTimezone: true }),

  // Preferences
  timezone: text('timezone').default('UTC'),
  locale: text('locale').default('en'),

  // Status
  status: text('status', {
    enum: ['active', 'suspended', 'banned', 'deleted'],
  }).default('active'),

  // MFA
  mfaEnabled: boolean('mfa_enabled').default(false),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),

  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_status_idx').on(table.status),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// USER INVITATIONS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const userInvitations = pgTable('user_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Target
  email: text('email').notNull(),

  // Scope
  ventureId: uuid('venture_id')
    .references(() => ventures.id, { onDelete: 'cascade' })
    .notNull(),
  organizationId: uuid('organization_id')
    .references(() => ventures.id, { onDelete: 'cascade' }),

  // Role assignment
  roleId: uuid('role_id')
    .references(() => roles.id, { onDelete: 'set null' }),
  role: text('role'),  // Legacy text role

  // Security
  token: text('token').unique().notNull(),

  // Status
  status: text('status', {
    enum: ['pending', 'accepted', 'expired', 'revoked'],
  }).default('pending').notNull(),

  // Content
  message: text('message'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  // Audit
  invitedBy: uuid('invited_by')
    .references(() => users.id, { onDelete: 'restrict' })
    .notNull(),
  acceptedBy: uuid('accepted_by')
    .references(() => users.id),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('invitation_email_venture_idx').on(table.email, table.ventureId),
  uniqueIndex('invitation_email_organization_idx').on(table.email, table.organizationId),
  index('user_invitations_email_idx').on(table.email),
  index('user_invitations_status_idx').on(table.status),
  index('user_invitations_expires_at_idx').on(table.expiresAt),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// VENTURE MEMBERSHIPS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const ventureMemberRoleEnum = pgEnum('venture_member_role', [
  'admin',
  'member',
  'billing',
]);

export const ventureMemberships = pgTable('venture_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  ventureId: uuid('venture_id')
    .references(() => ventures.id, { onDelete: 'cascade' })
    .notNull(),
  organizationId: uuid('organization_id')
    .references(() => ventures.id, { onDelete: 'cascade' }),
  role: ventureMemberRoleEnum('role').default('member').notNull(),

  // Legacy
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  leftAt: timestamp('left_at', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('venture_membership_idx').on(table.userId, table.ventureId),
  uniqueIndex('venture_membership_org_idx').on(table.userId, table.organizationId),
  index('venture_memberships_user_id_idx').on(table.userId),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// IMPERSONATION LOGS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const impersonationLogs = pgTable('impersonation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Actors
  adminId: uuid('admin_id')
    .references(() => users.id, { onDelete: 'restrict' })
    .notNull(),
  targetUserId: uuid('target_user_id')
    .references(() => users.id, { onDelete: 'restrict' })
    .notNull(),

  // Scope
  ventureId: uuid('venture_id')
    .references(() => ventures.id, { onDelete: 'set null' }),

  // Context
  reason: text('reason').notNull(),
  ticketId: text('ticket_id'),

  // Actions performed during impersonation
  actionsLog: jsonb('actions_log').$type<ImpersonationAction[]>().default([]),

  // Request metadata
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  // Timestamps
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
}, (table) => [
  index('impersonation_logs_admin_id_idx').on(table.adminId),
  index('impersonation_logs_target_user_id_idx').on(table.targetUserId),
  index('impersonation_logs_started_at_idx').on(table.startedAt),
]);
```

---

## Audit Events

| Event | Category | Severity | Data Captured |
|-------|----------|----------|---------------|
| `user.updated` | admin | info | userId, changes (field-level diff), actorId |
| `user.suspended` | admin | warning | userId, reason, actorId |
| `user.unsuspended` | admin | info | userId, actorId |
| `user.banned` | admin | warning | userId, reason, actorId |
| `user.deleted` | admin | warning | userId, actorId |
| `invitation.created` | admin | info | email, ventureId, roleId, inviterId |
| `invitation.accepted` | admin | info | invitationId, userId, ventureId |
| `invitation.revoked` | admin | info | invitationId, email, actorId |
| `impersonation.started` | security | warning | adminId, targetUserId, reason, ticketId |
| `impersonation.ended` | security | info | impersonationId, duration, actionCount |
| `impersonation.action` | security | info | impersonationId, action, resource, details |

---

## Error Handling

| Code | HTTP Status | Description | User Message |
|------|-------------|-------------|--------------|
| `USER_NOT_FOUND` | 404 | User ID doesn't exist | User not found |
| `EMAIL_ALREADY_EXISTS` | 409 | Email is taken | A user with this email already exists |
| `USER_ALREADY_MEMBER` | 409 | User in venture | User is already a member of this venture |
| `INVITATION_PENDING` | 409 | Duplicate invitation | An invitation is already pending for this email |
| `INVALID_INVITATION_TOKEN` | 400 | Token not found | Invalid invitation link |
| `INVITATION_EXPIRED` | 400 | Past expiry date | This invitation has expired |
| `INVITATION_NOT_PENDING` | 400 | Already processed | Invitation is no longer pending |
| `CANNOT_SUSPEND_SELF` | 400 | Self-suspension | You cannot suspend yourself |
| `CANNOT_IMPERSONATE_SELF` | 400 | Self-impersonation | You cannot impersonate yourself |
| `CANNOT_IMPERSONATE_INACTIVE` | 400 | Inactive target | Cannot impersonate an inactive user |

---

## Performance Considerations

| Operation | Target Latency | Strategy |
|-----------|---------------|----------|
| listUsers (cached) | < 50ms | Indexed queries, limited JOINs |
| getUserById | < 20ms | Primary key lookup + 2 JOINs |
| searchUsers | < 30ms | iLIKE with limit, no count |
| createInvitation | < 100ms | Includes email send (async) |
| Status change | < 50ms | Single UPDATE + session revoke |

### Query Optimization

```typescript
// ❌ BAD: N+1 query pattern
const users = await listUsers({ pagination: { page: 1, limit: 20 } });
for (const user of users.items) {
  const roles = await getRolesForUser(user.id);  // N additional queries
}

// ✅ GOOD: Batch load roles in listUsers
// listUsers already loads roles for all users in a single query
const users = await listUsers({ pagination: { page: 1, limit: 20 } });
// users.items[0].roles is already populated
```

---

## Security Checklist

- [ ] All status changes are logged to audit with `isSensitive: true`
- [ ] Impersonation requires explicit permission (`users:impersonate`)
- [ ] Impersonation logs are immutable (append-only actionsLog)
- [ ] Invitation tokens are cryptographically random (32 bytes hex)
- [ ] Soft delete preserves data but anonymizes PII
- [ ] Session revocation happens immediately on suspend/ban/delete
- [ ] Email sending failures don't block invitation creation
- [ ] Venture membership checked before invitation acceptance
- [ ] Admin cannot suspend/ban themselves

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-orm | ^0.29.x | Database queries |
| @mcv/kernel | workspace | Core utilities, database client |
| @mcv/identity/auth | workspace | Session management |
| @mcv/audit | workspace | Audit logging |

---

## Environment Variables

```bash
# No module-specific env vars required.
# Uses database connection from @mcv/kernel.
# Email sending configured in @mcv/connectors/email.
```

---

*@mcv/identity/users — User Management Module*
