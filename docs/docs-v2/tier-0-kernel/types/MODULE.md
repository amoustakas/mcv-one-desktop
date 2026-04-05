# @mcv/kernel/types — Types Module

**Parent Package:** @mcv/kernel  
**Classification:** INTERNAL  
**Last Updated:** February 9, 2026

---

## Purpose

The `types` module provides shared TypeScript type definitions, branded types for compile-time safety, and common interfaces used across all MCV.ONE SDK packages.

---

## Branded Types

Branded types prevent accidental mixing of IDs:

```typescript
// This compiles but is WRONG - mixing user and order IDs
function getOrder(orderId: string) { ... }
getOrder(userId); // No error with plain strings!

// With branded types:
function getOrder(orderId: OrderID) { ... }
getOrder(userId); // TypeScript ERROR!
```

---

## Core Types

### ID Types

```typescript
// Base branded type utility
declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

// Branded ID types
export type UUID = Brand<string, 'UUID'>;
export type VentureID = Brand<UUID, 'VentureID'>;
export type UserID = Brand<UUID, 'UserID'>;
export type OrganizationID = Brand<UUID, 'OrganizationID'>;
export type SessionID = Brand<UUID, 'SessionID'>;
export type RequestID = Brand<string, 'RequestID'>;
```

### Creating Branded IDs

```typescript
// Cast from string (use when you trust the source)
const userId = 'usr_abc123' as UserID;
const ventureId = 'ven_xyz789' as VentureID;

// From database result (already validated)
const user = await db.query.users.findFirst({ where: eq(id, rawId) });
const userId: UserID = user.id; // Schema types should align

// With validation helper
function toUserID(id: string): UserID {
  if (!isValidUUID(id)) throw new ValidationError('Invalid user ID');
  return id as UserID;
}
```

---

## Timestamp Types

```typescript
export type ISOTimestamp = Brand<string, 'ISOTimestamp'>;
export type UnixTimestamp = Brand<number, 'UnixTimestamp'>;
```

### Usage

```typescript
// ISO string timestamp
const createdAt: ISOTimestamp = new Date().toISOString() as ISOTimestamp;

// Unix timestamp (seconds)
const expiresAt: UnixTimestamp = Math.floor(Date.now() / 1000) as UnixTimestamp;
```

---

## JSON Types

```typescript
export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];
```

### Usage

```typescript
// For JSONB columns
interface User {
  id: UserID;
  metadata: JSONObject; // Arbitrary JSON object
  preferences: JSONValue; // Any JSON value
}

// Type-safe JSON parsing
function parseConfig(json: string): JSONObject {
  const parsed = JSON.parse(json);
  // Validated as JSONObject
  return parsed as JSONObject;
}
```

---

## Nullability Helpers

```typescript
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Deep nullable
export type DeepNullable<T> = {
  [K in keyof T]: T[K] extends object 
    ? DeepNullable<T[K]> | null 
    : T[K] | null;
};
```

### Usage

```typescript
interface UserProfile {
  name: string;
  bio: Nullable<string>;        // null allowed
  twitter: Optional<string>;    // undefined allowed
  avatar: Maybe<string>;        // null or undefined
}

// For partial updates
type UserUpdate = DeepNullable<Omit<UserProfile, 'id'>>;
```

---

## Pagination Types

```typescript
export interface PaginationParams {
  page: number;
  limit: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

export interface CursorPaginatedResult<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
}
```

### Usage

```typescript
async function listUsers(params: PaginationParams): Promise<PaginatedResult<User>> {
  const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = params;
  
  const [users, total] = await Promise.all([
    db.select().from(schema.users)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(sortOrder === 'asc' ? asc(schema.users[sortBy]) : desc(schema.users[sortBy])),
    db.select({ count: count() }).from(schema.users),
  ]);
  
  return {
    data: users,
    pagination: {
      page,
      limit,
      total: total[0].count,
      totalPages: Math.ceil(total[0].count / limit),
      hasNext: page * limit < total[0].count,
      hasPrev: page > 1,
    },
  };
}
```

---

## API Types

```typescript
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    duration: number;
  };
}

export interface APIError {
  code: number;
  message: string;
  details?: Record<string, unknown>;
}

export type APIResult<T> = 
  | { success: true; data: T }
  | { success: false; error: APIError };
```

### Usage

```typescript
function createResponse<T>(data: T, requestId: string, startTime: number): APIResponse<T> {
  return {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    },
  };
}

function createErrorResponse(error: MCVError, requestId: string): APIResponse<never> {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      duration: 0,
    },
  };
}
```

---

## Entity Types

```typescript
export interface BaseEntity {
  id: UUID;
  ventureId: VentureID;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  createdBy: UserID | null;
  updatedBy: UserID | null;
  deletedAt: ISOTimestamp | null;
}

// For creating new entities
export type CreateEntity<T extends BaseEntity> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deletedAt'
>;

// For updating entities
export type UpdateEntity<T extends BaseEntity> = Partial<
  Omit<T, 'id' | 'ventureId' | 'createdAt' | 'createdBy'>
>;

// Entity without base columns
export type EntityWithoutBase<T extends BaseEntity> = Omit<T, keyof BaseEntity>;
```

### Usage

```typescript
interface Product extends BaseEntity {
  name: string;
  slug: string;
  price: number;
  isActive: boolean;
}

// For creating
type CreateProduct = CreateEntity<Product>;
// = { ventureId, name, slug, price, isActive }

// For updating
type UpdateProduct = UpdateEntity<Product>;
// = Partial<{ name, slug, price, isActive, updatedBy, updatedAt, deletedAt }>

// Service implementation
async function createProduct(data: CreateProduct): Promise<Product> {
  const [product] = await db.insert(schema.products).values({
    ...data,
    createdBy: ctx.user.id,
  }).returning();
  
  return product;
}
```

---

## Utility Types

```typescript
// Make specific keys required
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Make specific keys optional
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Extract function return type (async-aware)
export type AsyncReturnType<T extends (...args: any) => any> = 
  T extends (...args: any) => Promise<infer R> ? R : ReturnType<T>;

// Non-empty array
export type NonEmptyArray<T> = [T, ...T[]];
```

---

## Best Practices

### Use Branded Types for IDs

```typescript
// Good
function getUser(id: UserID): Promise<User>;

// Avoid
function getUser(id: string): Promise<User>;
```

### Type API Responses

```typescript
// Good
async function getUsers(): Promise<PaginatedResult<User>>;

// Avoid
async function getUsers(): Promise<any>;
```

### Use Utility Types for CRUD

```typescript
// Consistent create/update types
type CreateUser = CreateEntity<User>;
type UpdateUser = UpdateEntity<User>;
```

---

*@mcv/kernel/types — Types Module*
