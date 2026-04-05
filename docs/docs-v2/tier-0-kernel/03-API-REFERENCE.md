# @mcv/kernel — API Reference
## Schemas, Types & Interfaces

**Package:** `@mcv/kernel`  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Database (db)](#database-db)
2. [Configuration (config)](#configuration-config)
3. [Logger](#logger)
4. [Errors](#errors)
5. [Utilities (utils)](#utilities-utils)
6. [Types](#types)
7. [Context](#context)

---

## Database (db)

### Connection Client

```typescript
import { db, withTransaction } from '@mcv/kernel';

// Direct query
const users = await db.select().from(schema.users);

// With transaction
const result = await withTransaction(async (tx) => {
  const user = await tx.insert(schema.users).values({ ... }).returning();
  await tx.insert(schema.audit).values({ ... });
  return user;
});
```

### Base Schema Columns

```typescript
// @mcv/kernel/db/base.ts

import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';

/**
 * Base columns applied to all tables
 */
export const baseColumns = {
  /** Primary key - auto-generated UUID */
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Venture ID for multi-tenant isolation */
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  
  /** Creation timestamp */
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  
  /** Last update timestamp */
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  
  /** User who created this record */
  createdBy: uuid('created_by').references(() => users.id),
  
  /** User who last updated this record */
  updatedBy: uuid('updated_by').references(() => users.id),
  
  /** Soft delete timestamp (null = not deleted) */
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

/**
 * Factory function to create tables with base columns
 */
export function createTable<T extends Record<string, any>>(
  name: string,
  columns: T
): PgTableWithColumns<...> {
  return pgTable(name, { ...baseColumns, ...columns });
}
```

### Schema Helpers

```typescript
// @mcv/kernel/db/helpers.ts

import { sql, eq, and, isNull } from 'drizzle-orm';

/**
 * Filter for non-deleted records
 */
export function notDeleted<T extends { deletedAt: any }>(table: T) {
  return isNull(table.deletedAt);
}

/**
 * Filter by venture ID
 */
export function forVenture<T extends { ventureId: any }>(
  table: T,
  ventureId: string
) {
  return eq(table.ventureId, ventureId);
}

/**
 * Combined filter for active records in venture
 */
export function activeInVenture<T extends { ventureId: any; deletedAt: any }>(
  table: T,
  ventureId: string
) {
  return and(forVenture(table, ventureId), notDeleted(table));
}

/**
 * Soft delete a record
 */
export async function softDelete<T extends { id: any; deletedAt: any }>(
  table: T,
  id: string
) {
  return db
    .update(table)
    .set({ deletedAt: new Date() })
    .where(eq(table.id, id));
}
```

### Migration Functions

```typescript
// @mcv/kernel/db/migrate.ts

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void>;

/**
 * Generate a new migration file
 */
export async function generateMigration(name: string): Promise<string>;

/**
 * Rollback last migration
 */
export async function rollbackMigration(): Promise<void>;

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  applied: string[];
  pending: string[];
}>;
```

---

## Configuration (config)

### Config Schema

```typescript
// @mcv/kernel/config/schema.ts

import { z } from 'zod';

export const configSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Server
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().min(1).max(100).default(20),
  DATABASE_SSL: z.coerce.boolean().default(true),
  
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  REDIS_TLS: z.coerce.boolean().default(true),
  
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  
  // Security
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().length(64),
  
  // Feature Flags
  ENABLE_DEBUG_MODE: z.coerce.boolean().default(false),
  ENABLE_TELEMETRY: z.coerce.boolean().default(true),
  ENABLE_RATE_LIMITING: z.coerce.boolean().default(true),
});

export type Config = z.infer<typeof configSchema>;
```

### Config Functions

```typescript
// @mcv/kernel/config/index.ts

/**
 * Load and validate configuration from environment
 * @throws Error if validation fails
 */
export function loadConfig(): Config;

/**
 * Get the loaded configuration (cached)
 */
export const config: Config;

/**
 * Get a specific config value with type safety
 */
export function getConfig<K extends keyof Config>(key: K): Config[K];

/**
 * Check if running in production
 */
export function isProduction(): boolean;

/**
 * Check if running in development
 */
export function isDevelopment(): boolean;
```

### Secrets Functions

```typescript
// @mcv/kernel/config/secrets.ts

/**
 * Encrypt a value using AES-256-GCM
 * @param plaintext - Value to encrypt
 * @param key - 32-byte encryption key
 * @returns Encrypted string (iv:authTag:ciphertext)
 */
export function encrypt(plaintext: string, key: Buffer): string;

/**
 * Decrypt a value using AES-256-GCM
 * @param ciphertext - Encrypted string
 * @param key - 32-byte encryption key
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string, key: Buffer): string;

/**
 * Generate a random encryption key
 * @returns 32-byte key as hex string
 */
export function generateKey(): string;

/**
 * Hash a value using SHA-256
 * @param value - Value to hash
 * @returns Hex-encoded hash
 */
export function hash(value: string): string;
```

---

## Logger

### Logger Instance

```typescript
// @mcv/kernel/logger/index.ts

import { Logger } from 'pino';

/**
 * Root logger instance
 */
export const logger: Logger;

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>): Logger;

/**
 * Create a request-scoped logger
 */
export function createRequestLogger(
  requestId: string,
  ventureId?: string,
  userId?: string
): Logger;
```

### Logger Methods

```typescript
interface Logger {
  // Log levels
  trace(msg: string): void;
  trace(obj: object, msg?: string): void;
  
  debug(msg: string): void;
  debug(obj: object, msg?: string): void;
  
  info(msg: string): void;
  info(obj: object, msg?: string): void;
  
  warn(msg: string): void;
  warn(obj: object, msg?: string): void;
  
  error(msg: string): void;
  error(obj: object, msg?: string): void;
  
  fatal(msg: string): void;
  fatal(obj: object, msg?: string): void;
  
  // Create child logger
  child(bindings: Record<string, unknown>): Logger;
  
  // Check if level is enabled
  isLevelEnabled(level: string): boolean;
}
```

### Usage Examples

```typescript
import { logger, createLogger } from '@mcv/kernel';

// Basic logging
logger.info('Server started');

// With context object
logger.info({ userId: 'usr_123', action: 'login' }, 'User logged in');

// With error
logger.error({ err: error, requestId }, 'Failed to process request');

// Child logger for a module
const moduleLogger = createLogger({ module: 'payments' });
moduleLogger.info('Processing payment');

// Request-scoped logger
const reqLogger = createRequestLogger('req_abc', 'ven_xyz', 'usr_123');
reqLogger.info('Handling request');
```

---

## Errors

### Error Classes

```typescript
// @mcv/kernel/errors/base.ts

/**
 * Error codes by category
 */
export enum ErrorCode {
  // 1xxx - Authentication/Authorization
  UNAUTHENTICATED = 1001,
  UNAUTHORIZED = 1002,
  TOKEN_EXPIRED = 1003,
  INVALID_CREDENTIALS = 1004,
  SESSION_EXPIRED = 1005,
  MFA_REQUIRED = 1006,
  
  // 2xxx - Validation
  VALIDATION_ERROR = 2001,
  INVALID_INPUT = 2002,
  MISSING_REQUIRED_FIELD = 2003,
  INVALID_FORMAT = 2004,
  
  // 3xxx - Resource
  NOT_FOUND = 3001,
  ALREADY_EXISTS = 3002,
  CONFLICT = 3003,
  GONE = 3004,
  
  // 4xxx - Business Logic
  BUSINESS_RULE_VIOLATION = 4001,
  INSUFFICIENT_FUNDS = 4002,
  LIMIT_EXCEEDED = 4003,
  OPERATION_NOT_ALLOWED = 4004,
  QUOTA_EXCEEDED = 4005,
  
  // 5xxx - External Services
  EXTERNAL_SERVICE_ERROR = 5001,
  TIMEOUT = 5002,
  RATE_LIMITED = 5003,
  SERVICE_UNAVAILABLE = 5004,
  
  // 6xxx - System
  INTERNAL_ERROR = 6001,
  DATABASE_ERROR = 6002,
  CONFIGURATION_ERROR = 6003,
  NOT_IMPLEMENTED = 6004,
}

/**
 * Base error class for all MCV errors
 */
export class MCVError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: Error;
  public readonly isOperational: boolean;
  
  constructor(
    message: string,
    code: ErrorCode,
    options?: {
      statusCode?: number;
      details?: Record<string, unknown>;
      cause?: Error;
      isOperational?: boolean;
    }
  );
  
  toJSON(): {
    name: string;
    message: string;
    code: ErrorCode;
    statusCode: number;
    details?: Record<string, unknown>;
  };
}
```

### Specialized Error Classes

```typescript
// @mcv/kernel/errors/specialized.ts

/**
 * Resource not found error
 */
export class NotFoundError extends MCVError {
  constructor(resource: string, id?: string);
}

/**
 * Validation error with field details
 */
export class ValidationError extends MCVError {
  constructor(message: string, fields?: Record<string, string[]>);
}

/**
 * Authorization error
 */
export class UnauthorizedError extends MCVError {
  constructor(message?: string);
}

/**
 * Authentication error
 */
export class UnauthenticatedError extends MCVError {
  constructor(message?: string);
}

/**
 * Conflict error (duplicate, etc.)
 */
export class ConflictError extends MCVError {
  constructor(message: string, conflictingField?: string);
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends MCVError {
  constructor(retryAfter?: number);
}

/**
 * External service error
 */
export class ExternalServiceError extends MCVError {
  constructor(service: string, message: string, cause?: Error);
}
```

### Error Handler

```typescript
// @mcv/kernel/errors/handler.ts

/**
 * Handle an error and return HTTP response structure
 */
export function handleError(error: unknown): {
  statusCode: number;
  body: {
    error: string;
    code: number;
    details?: unknown;
  };
};

/**
 * Check if error is operational (expected) vs programming error
 */
export function isOperationalError(error: unknown): boolean;

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<T>;
```

---

## Utilities (utils)

### Date Utilities

```typescript
// @mcv/kernel/utils/date.ts

/**
 * Format a date to string
 */
export function formatDate(date: Date, format?: string): string;

/**
 * Format a date with time
 */
export function formatDateTime(date: Date, timezone?: string): string;

/**
 * Parse an ISO date string
 */
export function parseDate(dateString: string): Date;

/**
 * Get days between two dates
 */
export function daysBetween(start: Date, end: Date): number;

/**
 * Get start and end of a day
 */
export function getDateRange(date: Date): { start: Date; end: Date };

/**
 * Add days to a date
 */
export function addDaysToDate(date: Date, days: number): Date;

/**
 * Check if date is in the past
 */
export function isPast(date: Date): boolean;

/**
 * Check if date is in the future
 */
export function isFuture(date: Date): boolean;

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date): string;
```

### Currency Utilities

```typescript
// @mcv/kernel/utils/currency.ts

export type Currency = 'USD' | 'CAD' | 'EUR' | 'GBP' | 'EDGE';

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number | string,
  currency?: Currency
): string;

/**
 * Parse a currency string to number
 */
export function parseCurrency(value: string): number;

/**
 * Add two currency amounts (precise)
 */
export function addCurrency(a: number | string, b: number | string): string;

/**
 * Subtract currency amounts (precise)
 */
export function subtractCurrency(a: number | string, b: number | string): string;

/**
 * Multiply currency amount (precise)
 */
export function multiplyCurrency(amount: number | string, multiplier: number): string;

/**
 * Compare currency amounts
 */
export function compareCurrency(a: number | string, b: number | string): -1 | 0 | 1;

/**
 * Check if amount is positive
 */
export function isPositive(amount: number | string): boolean;
```

### String Utilities

```typescript
// @mcv/kernel/utils/string.ts

/**
 * Convert string to URL-safe slug
 */
export function slugify(text: string): string;

/**
 * Generate a random ID with optional prefix
 */
export function generateId(prefix?: string): string;

/**
 * Truncate string with suffix
 */
export function truncate(str: string, length: number, suffix?: string): string;

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string;

/**
 * Convert to title case
 */
export function titleCase(str: string): string;

/**
 * Mask an email address
 */
export function maskEmail(email: string): string;

/**
 * Mask a phone number
 */
export function maskPhone(phone: string): string;

/**
 * Generate a random string
 */
export function randomString(length: number): string;

/**
 * Check if string is empty or whitespace
 */
export function isBlank(str: string | null | undefined): boolean;
```

### Validation Utilities

```typescript
// @mcv/kernel/utils/validation.ts

import { z } from 'zod';

// Common Zod schemas
export const emailSchema: z.ZodString;
export const phoneSchema: z.ZodString;
export const uuidSchema: z.ZodString;
export const slugSchema: z.ZodString;
export const urlSchema: z.ZodString;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean;

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean;

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean;

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean;

/**
 * Sanitize HTML (remove tags)
 */
export function sanitizeHtml(html: string): string;

/**
 * Normalize whitespace
 */
export function normalizeWhitespace(str: string): string;
```

---

## Types

### Core Types

```typescript
// @mcv/kernel/types/core.ts

// Branded types for compile-time safety
export type UUID = string & { readonly __brand: 'UUID' };
export type VentureID = UUID & { readonly __brand: 'VentureID' };
export type UserID = UUID & { readonly __brand: 'UserID' };
export type OrganizationID = UUID & { readonly __brand: 'OrganizationID' };

// Timestamp types
export type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' };
export type UnixTimestamp = number & { readonly __brand: 'UnixTimestamp' };

// JSON types
export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];

// Nullability
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Make properties nullable
export type DeepNullable<T> = {
  [K in keyof T]: T[K] extends object ? DeepNullable<T[K]> | null : T[K] | null;
};
```

### Pagination Types

```typescript
// @mcv/kernel/types/pagination.ts

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

### API Types

```typescript
// @mcv/kernel/types/api.ts

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

### Entity Types

```typescript
// @mcv/kernel/types/entities.ts

export interface BaseEntity {
  id: UUID;
  ventureId: VentureID;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  createdBy: UserID | null;
  updatedBy: UserID | null;
  deletedAt: ISOTimestamp | null;
}

export type CreateEntity<T extends BaseEntity> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deletedAt'
>;

export type UpdateEntity<T extends BaseEntity> = Partial<
  Omit<T, 'id' | 'ventureId' | 'createdAt' | 'createdBy'>
>;

export type EntityWithoutBase<T extends BaseEntity> = Omit<T, keyof BaseEntity>;
```

---

## Context

### Context Types

```typescript
// @mcv/kernel/context/types.ts

export interface MCVUser {
  id: UserID;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, unknown>;
}

export interface MCVVenture {
  id: VentureID;
  slug: string;
  name: string;
  domain: string;
  settings: Record<string, unknown>;
  features: string[];
}

export interface MCVOrganization {
  id: OrganizationID;
  name: string;
  ventureId: VentureID;
}

export interface MCVContext {
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

### Context Functions

```typescript
// @mcv/kernel/context/index.ts

/**
 * Create a new context object
 */
export function createContext(params: {
  user?: MCVUser | null;
  venture: MCVVenture;
  organization?: MCVOrganization | null;
  requestId?: string;
}): MCVContext;

/**
 * Run a function with context available
 */
export function withContext<T>(context: MCVContext, fn: () => T): T;

/**
 * Get the current context (throws if not available)
 */
export function getContext(): MCVContext;

/**
 * Try to get the current context (returns null if not available)
 */
export function tryGetContext(): MCVContext | null;

/**
 * Get the current user (throws if not authenticated)
 */
export function getCurrentUser(): MCVUser;

/**
 * Get the current venture
 */
export function getCurrentVenture(): MCVVenture;
```

---

## Package Exports

```typescript
// @mcv/kernel/index.ts

// Database
export { db, withTransaction } from './db/client';
export { runMigrations, generateMigration, getMigrationStatus } from './db/migrate';
export { baseColumns, createTable } from './db/base';
export { notDeleted, forVenture, activeInVenture, softDelete } from './db/helpers';
export * as schema from './db/schema';

// Configuration
export { config, getConfig, loadConfig, isProduction, isDevelopment } from './config';
export { configSchema, type Config } from './config/schema';
export { encrypt, decrypt, generateKey, hash } from './config/secrets';

// Logging
export { logger, createLogger, createRequestLogger } from './logger';

// Errors
export { MCVError, ErrorCode } from './errors/base';
export {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  UnauthenticatedError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
} from './errors/specialized';
export { handleError, isOperationalError, withErrorHandling } from './errors/handler';

// Utilities
export * from './utils/date';
export * from './utils/currency';
export * from './utils/string';
export * from './utils/validation';

// Types
export * from './types/core';
export * from './types/pagination';
export * from './types/api';
export * from './types/entities';

// Context
export {
  createContext,
  withContext,
  getContext,
  tryGetContext,
  getCurrentUser,
  getCurrentVenture,
} from './context';
export type { MCVContext, MCVUser, MCVVenture, MCVOrganization } from './context/types';
```

---

*@mcv/kernel — API Reference v1.0*
