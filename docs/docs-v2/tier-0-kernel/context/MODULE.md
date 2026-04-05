# @mcv/kernel/context — Context Module

**Parent Package:** @mcv/kernel  
**Classification:** INTERNAL  
**Last Updated:** February 9, 2026

---

## Purpose

The `context` module provides request-scoped context management using AsyncLocalStorage, enabling access to user, venture, and permission information throughout the request lifecycle without explicit parameter passing.

---

## Key Features

- **Request Scoping**: Context isolated per request
- **AsyncLocalStorage**: Works with async/await
- **Type Safety**: Fully typed context object
- **Permission Helpers**: Built-in authorization checks
- **Context Propagation**: Child contexts for sub-operations

---

## Exports

```typescript
// Context Management
export { createContext } from './context';
export { withContext } from './context';
export { getContext } from './context';
export { tryGetContext } from './context';
export { getCurrentUser } from './context';
export { getCurrentVenture } from './context';

// Types
export type { MCVContext } from './types';
export type { MCVUser } from './types';
export type { MCVVenture } from './types';
export type { MCVOrganization } from './types';
```

---

## Context Types

### MCVContext

```typescript
interface MCVContext {
  // Request metadata
  requestId: UUID;
  timestamp: Date;
  
  // Authentication
  user: MCVUser | null;
  isAuthenticated: boolean;
  
  // Multi-tenancy
  venture: MCVVenture;
  organization: MCVOrganization | null;
  
  // Authorization helpers
  hasPermission(permission: string): boolean;
  hasRole(role: string): boolean;
  hasAnyRole(roles: string[]): boolean;
  hasAllRoles(roles: string[]): boolean;
  
  // Feature flags
  hasFeature(feature: string): boolean;
  
  // Context propagation
  child(overrides: Partial<MCVContext>): MCVContext;
}
```

### MCVUser

```typescript
interface MCVUser {
  id: UserID;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, unknown>;
}
```

### MCVVenture

```typescript
interface MCVVenture {
  id: VentureID;
  slug: string;
  name: string;
  domain: string;
  settings: Record<string, unknown>;
  features: string[];
}
```

### MCVOrganization

```typescript
interface MCVOrganization {
  id: OrganizationID;
  name: string;
  ventureId: VentureID;
}
```

---

## Creating Context

```typescript
import { createContext } from '@mcv/kernel';

const ctx = createContext({
  user: {
    id: 'usr_abc123' as UserID,
    email: 'user@example.com',
    name: 'John Doe',
    roles: ['user', 'admin'],
    permissions: ['users:read', 'users:write', 'orders:read'],
  },
  venture: {
    id: 'ven_xyz789' as VentureID,
    slug: 'betedge',
    name: 'BetEdge AI',
    domain: 'betedge.app',
    settings: { theme: 'dark' },
    features: ['advanced-analytics', 'ai-predictions'],
  },
  organization: {
    id: 'org_def456' as OrganizationID,
    name: 'BetEdge Inc.',
    ventureId: 'ven_xyz789' as VentureID,
  },
  requestId: 'req_12345',
});
```

---

## Using Context

### Running with Context

```typescript
import { withContext, getContext } from '@mcv/kernel';

// Wrap operation with context
await withContext(ctx, async () => {
  // Context available anywhere in this call stack
  const result = await someService.doSomething();
  return result;
});

// Inside the operation
async function someService.doSomething() {
  const ctx = getContext();
  console.log(ctx.user.email); // "user@example.com"
  console.log(ctx.venture.slug); // "betedge"
}
```

### Getting Context

```typescript
import { getContext, tryGetContext } from '@mcv/kernel';

// Throws if no context (use when context is required)
const ctx = getContext();

// Returns null if no context (use for optional context)
const ctx = tryGetContext();
if (ctx) {
  // Has context
}
```

### Accessing User

```typescript
import { getCurrentUser, getContext } from '@mcv/kernel';

// Get authenticated user (throws if not authenticated)
const user = getCurrentUser();

// Or check first
const ctx = getContext();
if (ctx.isAuthenticated) {
  const user = ctx.user!;
}
```

---

## Permission Checks

### hasPermission

```typescript
const ctx = getContext();

// Check single permission
if (ctx.hasPermission('orders:write')) {
  // Can write orders
}

// In guard/middleware
function requirePermission(permission: string) {
  const ctx = getContext();
  if (!ctx.hasPermission(permission)) {
    throw new UnauthorizedError(`Permission '${permission}' required`);
  }
}
```

### hasRole

```typescript
const ctx = getContext();

// Check single role
if (ctx.hasRole('admin')) {
  // Is admin
}

// Check any of multiple roles
if (ctx.hasAnyRole(['admin', 'moderator'])) {
  // Is admin OR moderator
}

// Check all roles required
if (ctx.hasAllRoles(['verified', 'premium'])) {
  // Has both verified AND premium
}
```

---

## Feature Flags

```typescript
const ctx = getContext();

// Check if venture has feature
if (ctx.hasFeature('ai-predictions')) {
  // Show AI predictions UI
}

// In service
function getAnalytics() {
  const ctx = getContext();
  
  if (ctx.hasFeature('advanced-analytics')) {
    return advancedAnalytics();
  }
  
  return basicAnalytics();
}
```

---

## Child Contexts

Create derived contexts for sub-operations:

```typescript
const ctx = getContext();

// Create child with different user (e.g., for impersonation)
const impersonatedCtx = ctx.child({
  user: targetUser,
});

// Create child for background job
const jobCtx = ctx.child({
  requestId: generateId('job'),
});

await withContext(jobCtx, async () => {
  await processBackgroundJob();
});
```

---

## Integration with tRPC

### Middleware

```typescript
import { createContext, withContext } from '@mcv/kernel';

export const contextMiddleware = t.middleware(async ({ ctx, next }) => {
  const mcvContext = createContext({
    user: ctx.session?.user ?? null,
    venture: await resolveVenture(ctx.req),
    requestId: ctx.req.headers['x-request-id'] as string,
  });
  
  return withContext(mcvContext, () => 
    next({ ctx: { ...ctx, mcv: mcvContext } })
  );
});
```

### In Procedures

```typescript
export const getOrders = protectedProcedure.query(async () => {
  const ctx = getContext();
  
  // User and venture automatically available
  const orders = await orderService.list({
    userId: ctx.user!.id,
    ventureId: ctx.venture.id,
  });
  
  return orders;
});
```

---

## Database Integration

### Setting Venture for RLS

```typescript
import { getContext, db } from '@mcv/kernel';

async function withVentureRLS<T>(fn: () => Promise<T>): Promise<T> {
  const ctx = getContext();
  
  // Set PostgreSQL session variable for RLS
  await db.execute(sql`
    SET app.current_venture_id = ${ctx.venture.id}
  `);
  
  return fn();
}

// Usage
const users = await withVentureRLS(async () => {
  return db.select().from(schema.users);
  // RLS automatically filters by venture_id
});
```

---

## Logging Integration

```typescript
import { getContext, createRequestLogger } from '@mcv/kernel';

function getLogger() {
  const ctx = tryGetContext();
  
  if (ctx) {
    return createRequestLogger(
      ctx.requestId,
      ctx.venture.id,
      ctx.user?.id
    );
  }
  
  return logger; // Root logger as fallback
}
```

---

## Best Practices

### Do

```typescript
// Use getContext in services
async function getUserOrders() {
  const ctx = getContext();
  return orderRepo.findByUser(ctx.user!.id);
}

// Check permissions before operations
async function deleteOrder(orderId: string) {
  const ctx = getContext();
  if (!ctx.hasPermission('orders:delete')) {
    throw new UnauthorizedError();
  }
  // ...
}

// Use tryGetContext for optional context
function getLogger() {
  const ctx = tryGetContext();
  if (ctx) return ctx.logger;
  return rootLogger;
}
```

### Don't

```typescript
// Don't store context in variables across async boundaries
const ctx = getContext();
await someAsyncOp();
ctx.user; // Might be stale!

// Don't modify context directly
ctx.user.name = 'New Name'; // BAD - use child()

// Don't use context outside withContext
getContext(); // Throws! No context available
```

---

## Error Handling

### No Context Available

```typescript
import { getContext, tryGetContext } from '@mcv/kernel';

// Throws MCVError with CONFIGURATION_ERROR
try {
  getContext();
} catch (error) {
  // "No context available. Ensure withContext() is used."
}

// Safe alternative
const ctx = tryGetContext();
if (!ctx) {
  // Handle missing context
}
```

### Not Authenticated

```typescript
import { getCurrentUser } from '@mcv/kernel';

try {
  const user = getCurrentUser();
} catch (error) {
  // Throws UnauthenticatedError
}

// Check first
const ctx = getContext();
if (!ctx.isAuthenticated) {
  throw new UnauthenticatedError();
}
```

---

## Performance

- AsyncLocalStorage overhead: ~100ns per access
- Context creation: Lightweight object allocation
- Permission checks: Array.includes() - O(n), cached
- Consider caching expensive permission computations

---

*@mcv/kernel/context — Context Module*
