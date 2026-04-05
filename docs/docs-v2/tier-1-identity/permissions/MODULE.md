# @mcv/identity/permissions — Authorization Module

**Parent Package:** @mcv/identity  
**Tier:** 1 (Security Boundary)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `permissions` module is the authorization backbone of the MCV ecosystem. It implements a hybrid RBAC (Role-Based Access Control) + ABAC (Attribute-Based Access Control) system that governs access to every protected resource across all ventures. The module supports hierarchical roles, wildcard permissions, conditional access policies, and enterprise features like time-based restrictions and IP allowlists.

**Authorization is evaluated on every request. Performance and correctness are non-negotiable.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CORE PERMISSION EVALUATION
// ═══════════════════════════════════════════════════════════════════════════════

// Evaluator class (for dependency injection)
export { PermissionEvaluator, permissionEvaluator } from './server/evaluator';

// Service functions
export { 
  checkPermission, 
  loadUserPermissions,
  hasRole,
  meetsTierRequirement,
} from './server/services/permission-service';

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

export { requirePermission } from './server/middleware/require-permission';
export { requireRole } from './server/middleware/require-role';
export { requireTier } from './server/middleware/require-tier';

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createRole,
  updateRole,
  deleteRole,
  getRole,
  listRoles,
} from './server/services/role-service';

export {
  assignRole,
  revokeRole,
  getUserRoles,
  getRoleMembers,
} from './server/services/user-role-service';

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createPermission,
  updatePermission,
  deletePermission,
  listPermissions,
  getPermissionsByModule,
} from './server/services/permission-crud-service';

export {
  grantPermission,
  revokePermission,
  getRolePermissions,
} from './server/services/role-permission-service';

// ═══════════════════════════════════════════════════════════════════════════════
// RLS (ROW-LEVEL SECURITY)
// ═══════════════════════════════════════════════════════════════════════════════

export { generateRlsPolicies } from './server/rls/generate-policies';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from './constants/roles';
export { MODULES, RESOURCES, ACTIONS, permission } from './constants/module-permissions';
export { SYSTEM_ROLES, ROLE_LEVEL_THRESHOLDS } from './constants';
export { USER_TIERS, TIER_NAMES, TIER_COLORS } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT / REACT
// ═══════════════════════════════════════════════════════════════════════════════

export { PermissionsProvider, usePermissionsContext } from './client/context';
export { useCan, useCanMany, usePermission } from './client/hooks/use-can';
export { useRole, useTier } from './client/hooks/use-role';
export { CanAccess, RequirePermission } from './client/components';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Permission,
  Role,
  UserRole,
  PermissionConditions,
  PermissionContext,
  EvaluationResult,
  PermissionCheckContext,
  PermissionCheckResult,
  UserPermissions,
  UserTier,
  PermissionString,
  ModulePermissionsConfig,
  ConditionOperator,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PERMISSION SYSTEM ARCHITECTURE                              │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              REQUEST FLOW                                            │ │
│  │                                                                                      │ │
│  │    Request ──▶ Auth Middleware ──▶ Permission Middleware ──▶ Handler                │ │
│  │                      │                     │                                         │ │
│  │                      ▼                     ▼                                         │ │
│  │              [Session Valid?]      [Permission Check]                                │ │
│  │                      │                     │                                         │ │
│  │                      │            ┌────────┴────────┐                                │ │
│  │                      │            ▼                 ▼                                │ │
│  │                      │      [Tier Check]     [RBAC + ABAC]                           │ │
│  │                      │            │                 │                                │ │
│  │                      │            ▼                 ▼                                │ │
│  │                      │     Tier 0 = Allow    Evaluate Rules                          │ │
│  │                      │                              │                                │ │
│  │                      └──────────────────────────────┘                                │ │
│  │                                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                            PERMISSION EVALUATOR                                      │ │
│  │                                                                                      │ │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐                │ │
│  │  │   Tier System     │  │   RBAC Engine     │  │   ABAC Engine     │                │ │
│  │  │                   │  │                   │  │                   │                │ │
│  │  │  Tier 0: Super    │  │  Role Hierarchy   │  │  Conditions:      │                │ │
│  │  │  Tier 1: Venture  │  │  Permission       │  │  • ownerOnly      │                │ │
│  │  │  Tier 2: Manager  │  │    Inheritance    │  │  • teamOnly       │                │ │
│  │  │  Tier 3: Member   │  │  Wildcard Match   │  │  • requireMfa     │                │ │
│  │  │                   │  │                   │  │  • ipRanges       │                │ │
│  │  │                   │  │                   │  │  • schedule       │                │ │
│  │  │                   │  │                   │  │  • filters        │                │ │
│  │  └───────────────────┘  └───────────────────┘  └───────────────────┘                │ │
│  │                                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              DATA LAYER                                              │ │
│  │                                                                                      │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │ │
│  │  │    Redis    │    │  PostgreSQL │    │    users    │    │  ventures   │           │ │
│  │  │    Cache    │    │             │    │             │    │             │           │ │
│  │  │             │    │  • roles    │    │ User joins  │    │ Role scoped │           │ │
│  │  │ • 5 min TTL │    │  • perms    │    │ to venture  │    │ to venture  │           │ │
│  │  │ • Per user  │    │  • user_    │    │             │    │             │           │ │
│  │  │             │    │    roles    │    │             │    │             │           │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘           │ │
│  │                                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tier System

The tier system provides a simple numeric hierarchy for quick access level checks. Tier 0 (Super Admin) bypasses all permission checks.

| Tier | Role Level Threshold | Name | Scope | Capabilities |
|------|---------------------|------|-------|--------------|
| **0** | ≥900 | Super Admin | Global | Full system access, bypass all checks |
| **1** | ≥700 | Venture Admin | Per-Venture | Full venture access, manage all members |
| **2** | ≥400 | Manager | Per-Venture | Manage team resources, limited admin |
| **3** | 0-399 | Member | Per-Venture | Access assigned resources only |

```typescript
// Tier constants
export const USER_TIERS = {
  SUPER_ADMIN: 0,
  VENTURE_ADMIN: 1,
  MANAGER: 2,
  MEMBER: 3,
} as const;

export type UserTier = 0 | 1 | 2 | 3;

// Role level thresholds
export const ROLE_LEVEL_THRESHOLDS = {
  SUPER_ADMIN: 900,
  VENTURE_ADMIN: 700,
  MANAGER: 400,
} as const;

// Example: Check tier requirement
import { meetsTierRequirement, USER_TIERS } from '@mcv/identity/permissions';

const canAccessAdminPanel = await meetsTierRequirement(
  userId,
  USER_TIERS.VENTURE_ADMIN,  // Require tier 1 or higher (0, 1)
  ventureId,
  db
);
```

---

## Permission Format

Permissions follow a `resource:action` string format. Wildcards are supported at both levels.

```typescript
// Permission string format
type PermissionString = `${string}:${string}`;

// Examples
'users:read'           // Read any user
'users:*'              // All actions on users
'*:read'               // Read any resource
'*:*'                  // Full access (super admin)
'deals:close'          // Specific action
'analytics:export'     // Custom action
```

### Resource Categories

| Module | Resources | Actions |
|--------|-----------|---------|
| **identity** | users, roles, sessions | create, read, update, delete, invite, suspend, ban, impersonate |
| **ventures** | ventures | create, read, update, delete, configure |
| **crm** | contacts, organizations, deals | create, read, update, delete, close, reassign |
| **analytics** | analytics, dashboards | read, export, create, share |
| **engagement** | engagement, points | create, read, update, delete |
| **web3** | wallets, tokens | create, read, update, delete |
| **audit** | audit | read, export |

---

## Permission Evaluation

### Evaluation Order

```
1. Tier Check
   └── Tier 0 (Super Admin) → ALLOW immediately

2. Global Wildcard Check
   └── Has `*:*` permission → ALLOW

3. Resource Wildcard Check
   └── Has `{resource}:*` → Check conditions → ALLOW/DENY

4. Action Wildcard Check
   └── Has `*:{action}` → Check conditions → ALLOW/DENY

5. Exact Match Check
   └── Has `{resource}:{action}` → Check conditions → ALLOW/DENY

6. No Match
   └── DENY
```

### Using the Evaluator

```typescript
import { permissionEvaluator } from '@mcv/identity/permissions';
import { db } from '@mcv/kernel';

// Initialize once at app startup
permissionEvaluator.setDatabase(db);

// Evaluate permission
const result = await permissionEvaluator.evaluate({
  userId: 'user-123',
  organizationId: 'venture-456',  // Optional: scope to venture
  resource: 'deals',
  action: 'create',
  attributes: {                    // Optional: for ABAC conditions
    dealValue: 50000,
    customerId: 'cust-789',
  },
});

// Result structure
interface EvaluationResult {
  allowed: boolean;
  reason?: string;              // 'super-admin' | 'no-permission' | 'conditions-not-met'
  matchedPermission?: string;   // e.g., 'deals:create' or 'deals:*'
  conditions?: PermissionConditions;
}

if (!result.allowed) {
  throw new ForbiddenError(result.reason);
}
```

### Using the Service Functions

```typescript
import { checkPermission, loadUserPermissions } from '@mcv/identity/permissions';

// Simple permission check
const result = await checkPermission({
  userId: 'user-123',
  organizationId: 'venture-456',
  resource: 'users',
  action: 'delete',
  resourceId: 'target-user-789',
  resourceOwnerId: 'owner-user-id',  // For ownerOnly checks
  additionalContext: {
    mfaVerified: true,
    ipAddress: '192.168.1.100',
  },
}, db);

// Load all permissions for a user (for client-side checks)
const permissions = await loadUserPermissions(userId, ventureId, db);
// Returns: { userId, roles, permissions, tier, isGlobalAdmin }
```

---

## ABAC Conditions

ABAC (Attribute-Based Access Control) conditions allow fine-grained access rules beyond simple role checks.

### Condition Interface

```typescript
interface PermissionConditions {
  // ═══════════════════════════════════════════════════════════════════════════
  // OWNERSHIP CONDITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Only allow access if the user owns the resource.
   * Compares `context.resourceOwnerId` with `context.userId`.
   */
  ownerOnly?: boolean;
  
  /**
   * Only allow access if user is on the same team as the resource.
   * Compares `context.teamId` with `context.userTeamIds`.
   */
  teamOnly?: boolean;

  // ═══════════════════════════════════════════════════════════════════════════
  // ATTRIBUTE FILTERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Array of attribute conditions that must all be met.
   * Supports nested field access via dot notation.
   */
  filters?: Array<{
    field: string;                    // e.g., 'deal.value', 'status'
    operator: ConditionOperator;
    value: unknown;
  }>;

  // ═══════════════════════════════════════════════════════════════════════════
  // TIME-BASED CONDITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Restrict access to specific days/hours.
   * Useful for business hours restrictions.
   */
  schedule?: {
    allowedDays?: number[];           // 0=Sunday, 6=Saturday
    allowedHours?: {
      start: number;                  // 0-23
      end: number;                    // 0-23 (exclusive)
    };
    timezone?: string;                // IANA timezone, e.g., 'America/New_York'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY CONDITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Require MFA verification for this permission.
   * Checks `context.mfaVerified`.
   */
  requireMfa?: boolean;
  
  /**
   * Restrict to specific IP addresses or CIDR ranges.
   * Supports: '192.168.1.0/24', '10.0.0.0/8', '1.2.3.4' (single IP)
   */
  allowedIpRanges?: string[];

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOM RULES
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Reference to a custom OPA (Open Policy Agent) policy.
   * For complex rules that can't be expressed in conditions.
   */
  customRule?: string;
}

type ConditionOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
```

### Condition Examples

```typescript
// Example 1: Owner can edit, but only their own resources
const ownerEditPermission: PermissionConditions = {
  ownerOnly: true,
};

// Example 2: High-value deals require MFA
const highValueDealPermission: PermissionConditions = {
  requireMfa: true,
  filters: [
    { field: 'value', operator: 'gte', value: 100000 },
  ],
};

// Example 3: Billing access only during business hours from office IPs
const billingAccessPermission: PermissionConditions = {
  requireMfa: true,
  allowedIpRanges: ['10.0.0.0/8', '192.168.1.0/24'],
  schedule: {
    allowedDays: [1, 2, 3, 4, 5],  // Monday-Friday
    allowedHours: { start: 9, end: 18 },  // 9 AM - 6 PM
    timezone: 'America/New_York',
  },
};

// Example 4: Manager can reassign deals only within their team
const managerReassignPermission: PermissionConditions = {
  teamOnly: true,
  filters: [
    { field: 'status', operator: 'in', value: ['open', 'pending'] },
  ],
};
```

---

## Role Management

### System Roles

| Slug | Name | Level | Scope | Description |
|------|------|-------|-------|-------------|
| `super_admin` | Super Admin | 1000 | Global | Consortium-level administrator |
| `venture_owner` | Venture Owner | 800 | Venture | Venture creator/owner |
| `venture_admin` | Venture Admin | 700 | Venture | Full venture administration |
| `manager` | Manager | 500 | Venture | Team/department manager |
| `member` | Member | 100 | Venture | Standard venture member |
| `billing` | Billing | 300 | Venture | Billing-only access |
| `readonly` | Read Only | 50 | Venture | View-only access |

### Role Operations

```typescript
import { 
  createRole, 
  assignRole, 
  revokeRole,
  getUserRoles,
} from '@mcv/identity/permissions';

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE CUSTOM ROLE
// ═══════════════════════════════════════════════════════════════════════════════

const role = await createRole({
  slug: 'sales_manager',
  name: 'Sales Manager',
  description: 'Manages sales team and deals',
  level: 550,                          // Between manager (500) and admin (700)
  ventureId: 'venture-123',            // Scoped to venture (null = global)
  isSystem: false,                     // Can be deleted
  isDefault: false,                    // Not auto-assigned
  color: 'primary',                    // UI badge color
  icon: 'briefcase',                   // Lucide icon name
}, db);

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGN ROLE TO USER
// ═══════════════════════════════════════════════════════════════════════════════

await assignRole({
  userId: 'user-456',
  roleId: role.id,
  ventureId: 'venture-123',           // Scope assignment to venture
  assignedBy: 'admin-user-id',
  expiresAt: addDays(new Date(), 90), // Optional: temporary assignment
}, db);

// ═══════════════════════════════════════════════════════════════════════════════
// REVOKE ROLE
// ═══════════════════════════════════════════════════════════════════════════════

await revokeRole({
  userId: 'user-456',
  roleId: role.id,
  ventureId: 'venture-123',
  revokedBy: 'admin-user-id',
}, db);

// ═══════════════════════════════════════════════════════════════════════════════
// GET USER'S ROLES
// ═══════════════════════════════════════════════════════════════════════════════

const userRoles = await getUserRoles(userId, ventureId, db);
// Returns: Array<{ id, slug, name, level, ventureId, expiresAt }>
```

### Permission Assignment

```typescript
import { 
  grantPermission, 
  revokePermission,
  getRolePermissions,
} from '@mcv/identity/permissions';

// Grant permission to role
await grantPermission({
  roleId: role.id,
  permissionId: 'perm-deals-close',
  conditions: {
    filters: [
      { field: 'value', operator: 'lte', value: 50000 },
    ],
  },
}, db);

// Revoke permission from role
await revokePermission({
  roleId: role.id,
  permissionId: 'perm-deals-close',
}, db);

// Get all permissions for a role
const permissions = await getRolePermissions(role.id, db);
```

---

## Middleware

### tRPC Middleware

```typescript
import { requirePermission, requireRole, requireTier } from '@mcv/identity/permissions';
import { initTRPC, TRPCError } from '@trpc/server';

const t = initTRPC.context<Context>().create();

// ═══════════════════════════════════════════════════════════════════════════════
// REQUIRE SPECIFIC PERMISSION
// ═══════════════════════════════════════════════════════════════════════════════

const protectedProcedure = t.procedure.use(
  requirePermission('deals', 'create')
);

// With dynamic resource from input
const dealProcedure = t.procedure.use(
  requirePermission('deals', 'update', {
    getResourceId: (input) => input.dealId,
    getResourceOwnerId: async (input, ctx) => {
      const deal = await ctx.db.query.deals.findFirst({
        where: eq(deals.id, input.dealId),
      });
      return deal?.ownerId;
    },
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// REQUIRE ROLE
// ═══════════════════════════════════════════════════════════════════════════════

const adminProcedure = t.procedure.use(
  requireRole('venture_admin')
);

// ═══════════════════════════════════════════════════════════════════════════════
// REQUIRE MINIMUM TIER
// ═══════════════════════════════════════════════════════════════════════════════

const managerProcedure = t.procedure.use(
  requireTier(USER_TIERS.MANAGER)  // Tier 2 or higher
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMBINING MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

const sensitiveAdminProcedure = t.procedure
  .use(requireTier(USER_TIERS.VENTURE_ADMIN))
  .use(requirePermission('ventures', 'delete'))
  .use(async ({ ctx, next }) => {
    // Additional check: require MFA
    if (!ctx.session.mfaVerified) {
      throw new TRPCError({ 
        code: 'FORBIDDEN', 
        message: 'MFA verification required for this action' 
      });
    }
    return next();
  });
```

### Middleware Implementation

```typescript
// require-permission.ts
import { TRPCError } from '@trpc/server';
import { permissionEvaluator } from '../evaluator';

interface RequirePermissionOptions {
  getResourceId?: (input: any) => string;
  getResourceOwnerId?: (input: any, ctx: any) => Promise<string | undefined>;
}

export function requirePermission(
  resource: string,
  action: string,
  options: RequirePermissionOptions = {}
) {
  return async function permissionMiddleware({ ctx, input, next }: any) {
    const { user, session, db, venture } = ctx;
    
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    
    const resourceId = options.getResourceId?.(input);
    const resourceOwnerId = await options.getResourceOwnerId?.(input, ctx);
    
    const result = await permissionEvaluator.evaluate({
      userId: user.id,
      organizationId: venture?.id,
      resource,
      action,
      attributes: {
        resourceId,
        resourceOwnerId,
        userId: user.id,
        mfaVerified: session.mfaVerified,
        ipAddress: ctx.ipAddress,
      },
    });
    
    if (!result.allowed) {
      // Audit log the denial
      await auditLog({
        action: 'permission.denied',
        actorId: user.id,
        resourceType: resource,
        resourceId,
        metadata: {
          permission: `${resource}:${action}`,
          reason: result.reason,
        },
        severity: 'warning',
      });
      
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You don't have permission to ${action} this ${resource}`,
      });
    }
    
    return next({ ctx });
  };
}
```

---

## Client-Side (React)

### PermissionsProvider

```tsx
import { PermissionsProvider } from '@mcv/identity/permissions';

// Wrap your app with the provider
function App() {
  return (
    <PermissionsProvider 
      userId={session.user.id}
      ventureId={currentVenture?.id}
    >
      <RouterProvider router={router} />
    </PermissionsProvider>
  );
}
```

### Permission Hooks

```tsx
import { useCan, useCanMany, usePermission, useTier } from '@mcv/identity/permissions';

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK SINGLE PERMISSION
// ═══════════════════════════════════════════════════════════════════════════════

function DealActions({ deal }: { deal: Deal }) {
  const canEdit = useCan('deals', 'update');
  const canDelete = useCan('deals', 'delete', { 
    resourceOwnerId: deal.ownerId  // For ownerOnly checks
  });
  const canClose = useCan('deals', 'close');
  
  return (
    <div>
      {canEdit && <Button onClick={handleEdit}>Edit</Button>}
      {canClose && <Button onClick={handleClose}>Close Deal</Button>}
      {canDelete && <Button variant="danger" onClick={handleDelete}>Delete</Button>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK MULTIPLE PERMISSIONS
// ═══════════════════════════════════════════════════════════════════════════════

function DealPage({ deal }: { deal: Deal }) {
  const { canRead, canUpdate, canDelete, canClose } = useCanMany('deals', [
    'read', 'update', 'delete', 'close'
  ]);
  
  if (!canRead) {
    return <AccessDenied />;
  }
  
  return (
    <DealDetails 
      deal={deal}
      showEditButton={canUpdate}
      showDeleteButton={canDelete}
      showCloseButton={canClose}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK PERMISSION STRING
// ═══════════════════════════════════════════════════════════════════════════════

function QuickCheck() {
  const canExportAnalytics = usePermission('analytics:export');
  const canManageBilling = usePermission('billing:manage');
  
  return (
    <Menu>
      {canExportAnalytics && <MenuItem>Export Data</MenuItem>}
      {canManageBilling && <MenuItem>Billing Settings</MenuItem>}
    </Menu>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK TIER
// ═══════════════════════════════════════════════════════════════════════════════

function AdminSection() {
  const { tier, isAdmin, isManager } = useTier();
  
  if (tier > USER_TIERS.MANAGER) {
    return null; // Hide from members
  }
  
  return (
    <AdminPanel>
      {isAdmin && <VentureSettings />}
      {isManager && <TeamManagement />}
    </AdminPanel>
  );
}
```

### Permission Components

```tsx
import { CanAccess, RequirePermission } from '@mcv/identity/permissions';

// ═══════════════════════════════════════════════════════════════════════════════
// CONDITIONAL RENDER
// ═══════════════════════════════════════════════════════════════════════════════

function Dashboard() {
  return (
    <div>
      <CanAccess resource="analytics" action="read">
        <AnalyticsWidget />
      </CanAccess>
      
      <CanAccess resource="users" action="invite" fallback={<UpgradePrompt />}>
        <InviteUserButton />
      </CanAccess>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUIRE PERMISSION (REDIRECT/ERROR IF DENIED)
// ═══════════════════════════════════════════════════════════════════════════════

function ProtectedRoute() {
  return (
    <RequirePermission 
      resource="ventures" 
      action="configure"
      fallback={<Navigate to="/dashboard" />}
    >
      <VentureSettings />
    </RequirePermission>
  );
}
```

---

## Permission Caching

The evaluator uses an in-memory cache with 5-minute TTL to minimize database queries.

```typescript
// Cache configuration (in evaluator)
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache key format
private getCacheKey(userId: string, organizationId?: string): string {
  return `${userId}:${organizationId ?? 'global'}`;
}

// Cache structure
interface CachedPermissions {
  permissions: CachedPermission[];
  tier: UserTier;
  isGlobalAdmin: boolean;
  timestamp: number;
}
```

### Cache Invalidation

```typescript
import { permissionEvaluator } from '@mcv/identity/permissions';

// Clear cache for specific user (after role/permission change)
permissionEvaluator.clearCache(userId);

// Clear entire cache (after bulk changes)
permissionEvaluator.clearCache();

// Check cache stats (debugging)
const stats = permissionEvaluator.getCacheStats();
// { size: 150, entries: ['user-1:venture-a', 'user-2:global', ...] }
```

### When to Invalidate

| Event | Invalidation Scope |
|-------|-------------------|
| Role assigned to user | User's cache (all ventures) |
| Role revoked from user | User's cache (all ventures) |
| Role permissions changed | All users with that role |
| Permission definition changed | All caches (full clear) |
| User deleted | User's cache |

---

## Database Schema

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSIONS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Identity
  slug: text('slug').unique().notNull(),        // 'users:read', 'deals:create'
  name: text('name').notNull(),                 // 'Read Users'
  description: text('description'),             // 'View user profiles and details'
  
  // Resource mapping
  resource: text('resource').notNull(),         // 'users', 'deals', 'analytics'
  action: text('action').notNull(),             // 'create', 'read', 'update', 'delete', '*'
  
  // Organization
  module: text('module'),                       // 'crm', 'engagement', 'web3'
  category: text('category'),                   // For UI grouping
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
});

// Indexes
// CREATE UNIQUE INDEX permissions_slug_idx ON permissions (slug);
// CREATE INDEX permissions_resource_action_idx ON permissions (resource, action);
// CREATE INDEX permissions_module_idx ON permissions (module);

// ═══════════════════════════════════════════════════════════════════════════════
// ROLES TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Identity
  slug: text('slug').notNull(),                 // 'venture_admin', 'sales_manager'
  name: text('name').notNull(),                 // 'Venture Admin'
  description: text('description'),
  
  // Hierarchy
  level: integer('level').default(0),           // Higher = more power (0-1000)
  
  // Scope
  ventureId: uuid('venture_id')                 // null = global role
    .references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Flags
  isSystem: boolean('is_system').default(false),  // Cannot be deleted
  isDefault: boolean('is_default').default(false), // Auto-assigned on venture join
  
  // UI
  color: text('color').default('default'),      // Badge color
  icon: text('icon'),                           // Lucide icon name
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('role_slug_venture_idx').on(table.slug, table.ventureId),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// USER_ROLES TABLE (Junction)
// ═══════════════════════════════════════════════════════════════════════════════

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // References
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  roleId: uuid('role_id')
    .references(() => roles.id, { onDelete: 'cascade' })
    .notNull(),
  
  // Scope (role can be scoped to specific venture even if role itself is global)
  ventureId: uuid('venture_id')
    .references(() => ventures.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')        // Legacy alias for ventureId
    .references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Temporary assignment
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  
  // Audit
  assignedBy: uuid('assigned_by')
    .references(() => users.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('user_role_venture_idx').on(table.userId, table.roleId, table.ventureId),
  uniqueIndex('user_role_organization_idx').on(table.userId, table.roleId, table.organizationId),
  index('user_roles_user_id_idx').on(table.userId),
  index('user_roles_expires_at_idx').on(table.expiresAt),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE_PERMISSIONS TABLE (Junction with Conditions)
// ═══════════════════════════════════════════════════════════════════════════════

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // References
  roleId: uuid('role_id')
    .references(() => roles.id, { onDelete: 'cascade' })
    .notNull(),
  permissionId: uuid('permission_id')
    .references(() => permissions.id, { onDelete: 'cascade' })
    .notNull(),
  
  // ABAC conditions (optional)
  conditions: jsonb('conditions').$type<PermissionConditions>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('role_permission_idx').on(table.roleId, table.permissionId),
  index('role_permissions_role_id_idx').on(table.roleId),
]);
```

### Entity Relationships

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      users      │       │    user_roles   │       │      roles      │
│─────────────────│       │─────────────────│       │─────────────────│
│ id              │◄──────│ user_id         │       │ id              │
│ email           │       │ role_id         │──────►│ slug            │
│ ...             │       │ venture_id      │       │ name            │
└─────────────────┘       │ expires_at      │       │ level           │
                          │ assigned_by     │       │ venture_id      │
                          └─────────────────┘       │ is_system       │
                                                    └────────┬────────┘
                                                             │
                                                             │
                          ┌─────────────────┐                │
                          │role_permissions │                │
                          │─────────────────│                │
                          │ role_id         │◄───────────────┘
                          │ permission_id   │
                          │ conditions      │───────► ABAC Rules
                          └────────┬────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │   permissions   │
                          │─────────────────│
                          │ id              │
                          │ slug            │
                          │ resource        │
                          │ action          │
                          │ module          │
                          └─────────────────┘
```

---

## Audit Events

| Event | Severity | Data Captured |
|-------|----------|---------------|
| `permission.check.allowed` | info | userId, permission, matchedPermission, ventureId |
| `permission.check.denied` | warning | userId, permission, reason, ventureId, ipAddress |
| `permission.role.assigned` | info | userId, roleId, ventureId, assignedBy, expiresAt |
| `permission.role.revoked` | info | userId, roleId, ventureId, revokedBy |
| `permission.role.created` | info | roleId, slug, ventureId, createdBy |
| `permission.role.updated` | info | roleId, changes, updatedBy |
| `permission.role.deleted` | warning | roleId, slug, deletedBy |
| `permission.granted` | info | roleId, permissionId, conditions, grantedBy |
| `permission.revoked` | info | roleId, permissionId, revokedBy |
| `permission.cache.cleared` | info | scope (userId or 'all'), clearedBy |

---

## Error Handling

| Code | HTTP Status | Description | User Message |
|------|-------------|-------------|--------------|
| `PERMISSION_DENIED` | 403 | No matching permission | You don't have permission to perform this action |
| `ROLE_NOT_FOUND` | 404 | Role doesn't exist | Role not found |
| `PERMISSION_NOT_FOUND` | 404 | Permission doesn't exist | Permission not found |
| `INVALID_ROLE_ASSIGNMENT` | 400 | Cannot assign this role | Cannot assign this role to this user |
| `ROLE_LEVEL_EXCEEDED` | 403 | Assigning role above own level | Cannot assign a role higher than your own |
| `SYSTEM_ROLE_PROTECTED` | 403 | Cannot modify system role | This role cannot be modified |
| `CONDITIONS_NOT_MET` | 403 | ABAC conditions failed | Access denied based on policy conditions |
| `MFA_REQUIRED` | 403 | MFA not verified | Multi-factor authentication required |
| `IP_NOT_ALLOWED` | 403 | IP not in allowlist | Access not allowed from your location |
| `SCHEDULE_RESTRICTED` | 403 | Outside allowed hours | Access not allowed at this time |

---

## Performance Considerations

| Operation | Target Latency | Strategy |
|-----------|---------------|----------|
| Permission check (cached) | < 1ms | In-memory cache lookup |
| Permission check (uncached) | < 15ms | Single DB query with JOINs |
| Cache hit rate | > 95% | 5-minute TTL, per-user + venture |
| Role assignment | < 50ms | Immediate + cache invalidation |
| Permission grant | < 50ms | Immediate + batch cache invalidation |

### Optimization Tips

```typescript
// ❌ BAD: Multiple separate checks
const canRead = await checkPermission({ ...ctx, action: 'read' });
const canUpdate = await checkPermission({ ...ctx, action: 'update' });
const canDelete = await checkPermission({ ...ctx, action: 'delete' });

// ✅ GOOD: Load all permissions once
const permissions = await loadUserPermissions(userId, ventureId, db);
const canRead = hasPermissionInList(permissions, 'deals', 'read');
const canUpdate = hasPermissionInList(permissions, 'deals', 'update');
const canDelete = hasPermissionInList(permissions, 'deals', 'delete');
```

---

## Security Checklist

- [ ] Permission evaluator initialized with database at app startup
- [ ] Tier 0 (super admin) access is highly restricted and audited
- [ ] All permission denials are logged to audit system
- [ ] Role level escalation prevented (users can't assign higher roles)
- [ ] System roles are protected from modification/deletion
- [ ] ABAC conditions properly validated before evaluation
- [ ] Cache invalidation triggered on all role/permission changes
- [ ] Expired role assignments cleaned up by background job
- [ ] IP allowlists use proper CIDR parsing
- [ ] Time-based restrictions respect timezone configuration
- [ ] MFA requirement enforced at evaluation time

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-orm | ^0.29.x | Database queries |
| @mcv/kernel | workspace | Core utilities, database client |
| @mcv/identity/auth | workspace | Session context |

---

## Environment Variables

```bash
# No module-specific env vars required.
# Uses database connection from @mcv/kernel.
```

---

*@mcv/identity/permissions — Authorization Module*
