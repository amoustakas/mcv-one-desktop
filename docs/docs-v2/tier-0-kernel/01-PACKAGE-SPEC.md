# @mcv/kernel — Package Specification
## Tier 0: Absolute Primitives

**Package:** `@mcv/kernel`  
**Classification:** INTERNAL  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/kernel` is the foundational package of the MCV.ONE SDK. It provides the absolute primitives that every other package depends on: database connectivity, configuration management, structured logging, error handling, utility functions, type definitions, and request context management.

**No package in the SDK may have zero dependencies — every package depends on `@mcv/kernel`.**

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ALL MCV PACKAGES                                   │
│                                                                              │
│  @mcv/ui  @mcv/api  @mcv/nexus  @mcv/commerce  @mcv/intelligence  ...      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ depends on
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/kernel                                     │
│                                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │   db    │ │ config  │ │ logger  │ │ errors  │ │  utils  │ │  types  │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                              │
│                              ┌─────────┐                                     │
│                              │ context │                                     │
│                              └─────────┘                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ depends on
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL DEPENDENCIES                               │
│                                                                              │
│  drizzle-orm  |  zod  |  pino  |  dotenv  |  @supabase/supabase-js         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **db** | Database connectivity, schema definitions, migrations | `db`, `schema`, `migrate` |
| **config** | Environment configuration, validation, secrets | `config`, `env`, `secrets` |
| **logger** | Structured logging with context propagation | `logger`, `createLogger` |
| **errors** | Error types, handling, serialization | `MCVError`, `ErrorCodes` |
| **utils** | Common utilities (date, currency, slug, validation) | `formatDate`, `slugify`, etc. |
| **types** | Shared TypeScript type definitions | `ID`, `Timestamp`, `JSONValue` |
| **context** | Request context (user, venture, permissions) | `MCVContext`, `withContext` |

---

## Module: db

### Purpose

Provides database connectivity using Drizzle ORM with Supabase PostgreSQL. Defines base schema patterns, connection pooling, and migration utilities.

### Schema Design Principles

1. **Every table has a `venture_id`** — Multi-tenant isolation at the data layer
2. **Soft deletes by default** — `deleted_at` timestamp instead of hard delete
3. **Audit fields on all tables** — `created_at`, `updated_at`, `created_by`, `updated_by`
4. **UUIDs for primary keys** — No sequential IDs exposed
5. **Type-safe enums** — PostgreSQL enums with TypeScript mapping

### Base Table Schema

```typescript
// @mcv/kernel/db/base.ts
import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core';

export const baseColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

export const createTable = <T extends Record<string, any>>(
  name: string,
  columns: T
) => pgTable(name, { ...baseColumns, ...columns });
```

### Connection Management

```typescript
// @mcv/kernel/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Connection pool configuration
const client = postgres(connectionString, {
  max: 20,                    // Maximum connections
  idle_timeout: 20,           // Close idle connections after 20s
  connect_timeout: 10,        // Connection timeout 10s
  prepare: false,             // Disable prepared statements for Supabase
});

export const db = drizzle(client, { schema });

// Transaction helper
export async function withTransaction<T>(
  fn: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(fn);
}
```

### Migrations

```typescript
// @mcv/kernel/db/migrate.ts
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './client';

export async function runMigrations() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete');
}
```

### Row-Level Security (RLS) Patterns

```sql
-- All tables follow this RLS pattern
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- Venture isolation policy
CREATE POLICY "venture_isolation" ON {table_name}
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- Soft delete filter
CREATE POLICY "exclude_deleted" ON {table_name}
  USING (deleted_at IS NULL);
```

---

## Module: config

### Purpose

Centralized configuration management with environment validation, type safety, and secrets handling.

### Configuration Schema

```typescript
// @mcv/kernel/config/schema.ts
import { z } from 'zod';

export const configSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().min(1).max(100).default(20),
  
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  
  // Feature Flags
  ENABLE_DEBUG_MODE: z.coerce.boolean().default(false),
  ENABLE_TELEMETRY: z.coerce.boolean().default(true),
  
  // Secrets (loaded from vault in production)
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64), // 32 bytes hex encoded
});

export type Config = z.infer<typeof configSchema>;
```

### Configuration Loading

```typescript
// @mcv/kernel/config/loader.ts
import { configSchema, type Config } from './schema';

let cachedConfig: Config | null = null;

export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig;
  
  const result = configSchema.safeParse(process.env);
  
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  cachedConfig = result.data;
  return cachedConfig;
}

export const config = loadConfig();

// Type-safe config access
export function getConfig<K extends keyof Config>(key: K): Config[K] {
  return config[key];
}
```

### Secrets Management

```typescript
// @mcv/kernel/config/secrets.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string, key: Buffer): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

## Module: logger

### Purpose

Structured logging with Pino, supporting context propagation, log levels, and multiple output formats.

### Logger Configuration

```typescript
// @mcv/kernel/logger/index.ts
import pino, { Logger, LoggerOptions } from 'pino';
import { config } from '../config';

const baseOptions: LoggerOptions = {
  level: config.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
    }),
  },
  redact: {
    paths: ['password', 'token', 'secret', 'authorization', 'cookie'],
    censor: '[REDACTED]',
  },
};

const devOptions: LoggerOptions = {
  ...baseOptions,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
};

export const logger = pino(
  config.LOG_FORMAT === 'pretty' ? devOptions : baseOptions
);

// Child logger factory with context
export function createLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}

// Request-scoped logger
export function createRequestLogger(
  requestId: string,
  ventureId?: string,
  userId?: string
): Logger {
  return logger.child({
    requestId,
    ventureId,
    userId,
    timestamp: new Date().toISOString(),
  });
}
```

### Log Levels and Usage

| Level | When to Use | Example |
|-------|-------------|---------|
| `trace` | Detailed debugging | Method entry/exit, variable values |
| `debug` | Development debugging | SQL queries, API calls |
| `info` | Normal operations | Request handled, job completed |
| `warn` | Potential issues | Deprecated usage, retry attempts |
| `error` | Errors that need attention | Failed operations, exceptions |
| `fatal` | System failures | Startup failures, critical errors |

```typescript
// Usage examples
logger.info({ userId, action: 'login' }, 'User logged in');
logger.warn({ attemptCount: 3 }, 'Rate limit approaching');
logger.error({ err, requestId }, 'Failed to process payment');
```

---

## Module: errors

### Purpose

Standardized error types, error codes, and error handling utilities.

### Error Class Hierarchy

```typescript
// @mcv/kernel/errors/base.ts
export enum ErrorCode {
  // 1xxx - Authentication/Authorization
  UNAUTHENTICATED = 1001,
  UNAUTHORIZED = 1002,
  TOKEN_EXPIRED = 1003,
  INVALID_CREDENTIALS = 1004,
  
  // 2xxx - Validation
  VALIDATION_ERROR = 2001,
  INVALID_INPUT = 2002,
  MISSING_REQUIRED_FIELD = 2003,
  
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
  
  // 5xxx - External Services
  EXTERNAL_SERVICE_ERROR = 5001,
  TIMEOUT = 5002,
  RATE_LIMITED = 5003,
  
  // 6xxx - System
  INTERNAL_ERROR = 6001,
  DATABASE_ERROR = 6002,
  CONFIGURATION_ERROR = 6003,
}

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
  ) {
    super(message);
    this.name = 'MCVError';
    this.code = code;
    this.statusCode = options?.statusCode ?? this.getDefaultStatusCode(code);
    this.details = options?.details;
    this.cause = options?.cause;
    this.isOperational = options?.isOperational ?? true;
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  private getDefaultStatusCode(code: ErrorCode): number {
    if (code >= 1000 && code < 2000) return 401; // Auth errors
    if (code >= 2000 && code < 3000) return 400; // Validation errors
    if (code >= 3000 && code < 4000) return 404; // Resource errors
    if (code >= 4000 && code < 5000) return 422; // Business logic errors
    if (code >= 5000 && code < 6000) return 502; // External service errors
    return 500; // System errors
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}
```

### Specialized Error Classes

```typescript
// @mcv/kernel/errors/specialized.ts
import { MCVError, ErrorCode } from './base';

export class NotFoundError extends MCVError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      ErrorCode.NOT_FOUND,
      { details: { resource, id } }
    );
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends MCVError {
  constructor(message: string, fields?: Record<string, string[]>) {
    super(message, ErrorCode.VALIDATION_ERROR, {
      details: { fields },
      statusCode: 400,
    });
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends MCVError {
  constructor(message = 'Unauthorized') {
    super(message, ErrorCode.UNAUTHORIZED, { statusCode: 403 });
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends MCVError {
  constructor(message: string, conflictingField?: string) {
    super(message, ErrorCode.CONFLICT, {
      details: { conflictingField },
      statusCode: 409,
    });
    this.name = 'ConflictError';
  }
}
```

### Error Handler Middleware

```typescript
// @mcv/kernel/errors/handler.ts
import { MCVError, ErrorCode } from './base';
import { logger } from '../logger';

export function handleError(error: unknown): {
  statusCode: number;
  body: { error: string; code: number; details?: unknown };
} {
  if (error instanceof MCVError) {
    if (!error.isOperational) {
      logger.fatal({ err: error }, 'Non-operational error');
    } else {
      logger.error({ err: error }, error.message);
    }
    
    return {
      statusCode: error.statusCode,
      body: {
        error: error.message,
        code: error.code,
        details: error.details,
      },
    };
  }
  
  // Unknown error - treat as internal
  logger.fatal({ err: error }, 'Unexpected error');
  
  return {
    statusCode: 500,
    body: {
      error: 'Internal server error',
      code: ErrorCode.INTERNAL_ERROR,
    },
  };
}
```

---

## Module: utils

### Purpose

Common utility functions used across all packages.

### Date Utilities

```typescript
// @mcv/kernel/utils/date.ts
import { formatISO, parseISO, differenceInDays, addDays, startOfDay, endOfDay } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export function formatDate(date: Date, format = 'yyyy-MM-dd'): string {
  return formatInTimeZone(date, 'UTC', format);
}

export function formatDateTime(date: Date, timezone = 'UTC'): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}

export function daysBetween(start: Date, end: Date): number {
  return differenceInDays(end, start);
}

export function getDateRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}
```

### Currency Utilities

```typescript
// @mcv/kernel/utils/currency.ts
import Decimal from 'decimal.js';

export type Currency = 'USD' | 'CAD' | 'EUR' | 'GBP' | 'EDGE';

const currencyConfig: Record<Currency, { decimals: number; symbol: string }> = {
  USD: { decimals: 2, symbol: '$' },
  CAD: { decimals: 2, symbol: 'C$' },
  EUR: { decimals: 2, symbol: '€' },
  GBP: { decimals: 2, symbol: '£' },
  EDGE: { decimals: 9, symbol: 'EDGE' },
};

export function formatCurrency(
  amount: number | string,
  currency: Currency = 'USD'
): string {
  const config = currencyConfig[currency];
  const decimal = new Decimal(amount);
  const formatted = decimal.toFixed(config.decimals);
  
  if (currency === 'EDGE') {
    return `${formatted} ${config.symbol}`;
  }
  
  return `${config.symbol}${formatted}`;
}

export function parseCurrency(value: string): number {
  return new Decimal(value.replace(/[^0-9.-]/g, '')).toNumber();
}

export function addCurrency(a: number | string, b: number | string): string {
  return new Decimal(a).plus(new Decimal(b)).toString();
}

export function subtractCurrency(a: number | string, b: number | string): string {
  return new Decimal(a).minus(new Decimal(b)).toString();
}

export function multiplyCurrency(amount: number | string, multiplier: number): string {
  return new Decimal(amount).times(multiplier).toString();
}
```

### String Utilities

```typescript
// @mcv/kernel/utils/string.ts
import slugifyLib from 'slugify';
import { customAlphabet } from 'nanoid';

// Slug generation
export function slugify(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

// ID generation
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);
export function generateId(prefix?: string): string {
  const id = nanoid();
  return prefix ? `${prefix}_${id}` : id;
}

// String manipulation
export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str.split(' ').map(capitalize).join(' ');
}

// Masking
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal = local.slice(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `***-***-${digits.slice(-4)}`;
}
```

### Validation Utilities

```typescript
// @mcv/kernel/utils/validation.ts
import { z } from 'zod';

// Common Zod schemas
export const emailSchema = z.string().email();
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
export const uuidSchema = z.string().uuid();
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

// Validation helpers
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function isValidUUID(uuid: string): boolean {
  return uuidSchema.safeParse(uuid).success;
}

export function isValidSlug(slug: string): boolean {
  return slugSchema.safeParse(slug).success;
}

// Sanitization
export function sanitizeHtml(html: string): string {
  // Basic HTML tag removal - use DOMPurify in production
  return html.replace(/<[^>]*>/g, '');
}

export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}
```

---

## Module: types

### Purpose

Shared TypeScript type definitions and branded types used across all packages.

### Core Types

```typescript
// @mcv/kernel/types/core.ts

// Branded types for type safety
declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

export type UUID = Brand<string, 'UUID'>;
export type VentureID = Brand<UUID, 'VentureID'>;
export type UserID = Brand<UUID, 'UserID'>;
export type OrganizationID = Brand<UUID, 'OrganizationID'>;

// Timestamp types
export type ISOTimestamp = Brand<string, 'ISOTimestamp'>;
export type UnixTimestamp = Brand<number, 'UnixTimestamp'>;

// JSON types
export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  cursor?: string;
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
  };
}

// API Response
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
```

### Entity Types

```typescript
// @mcv/kernel/types/entities.ts
import { UUID, VentureID, UserID, ISOTimestamp } from './core';

// Base entity interface (matches baseColumns in db)
export interface BaseEntity {
  id: UUID;
  ventureId: VentureID;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  createdBy: UserID | null;
  updatedBy: UserID | null;
  deletedAt: ISOTimestamp | null;
}

// Audit fields for tracking changes
export interface AuditFields {
  createdAt: ISOTimestamp;
  createdBy: UserID | null;
  updatedAt: ISOTimestamp;
  updatedBy: UserID | null;
}

// Soft delete support
export interface SoftDeletable {
  deletedAt: ISOTimestamp | null;
}

// Type for creating entities (omit auto-generated fields)
export type CreateEntity<T extends BaseEntity> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deletedAt'
>;

// Type for updating entities (partial, omit immutable fields)
export type UpdateEntity<T extends BaseEntity> = Partial<
  Omit<T, 'id' | 'ventureId' | 'createdAt' | 'createdBy'>
>;
```

---

## Module: context

### Purpose

Request-scoped context management for user, venture, and permissions.

### Context Definition

```typescript
// @mcv/kernel/context/types.ts
import { VentureID, UserID, OrganizationID, UUID } from '../types';

export interface MCVUser {
  id: UserID;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
}

export interface MCVVenture {
  id: VentureID;
  slug: string;
  name: string;
  domain: string;
  settings: Record<string, unknown>;
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
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  
  // Context propagation
  child: (overrides: Partial<MCVContext>) => MCVContext;
}
```

### Context Implementation

```typescript
// @mcv/kernel/context/context.ts
import { AsyncLocalStorage } from 'async_hooks';
import { MCVContext, MCVUser, MCVVenture, MCVOrganization } from './types';
import { generateId } from '../utils/string';

const contextStorage = new AsyncLocalStorage<MCVContext>();

export function createContext(params: {
  user?: MCVUser | null;
  venture: MCVVenture;
  organization?: MCVOrganization | null;
  requestId?: string;
}): MCVContext {
  const context: MCVContext = {
    requestId: params.requestId ?? generateId('req'),
    timestamp: new Date(),
    user: params.user ?? null,
    isAuthenticated: params.user !== null,
    venture: params.venture,
    organization: params.organization ?? null,
    
    hasPermission(permission: string): boolean {
      return this.user?.permissions.includes(permission) ?? false;
    },
    
    hasRole(role: string): boolean {
      return this.user?.roles.includes(role) ?? false;
    },
    
    hasAnyRole(roles: string[]): boolean {
      return roles.some(role => this.hasRole(role));
    },
    
    hasAllRoles(roles: string[]): boolean {
      return roles.every(role => this.hasRole(role));
    },
    
    child(overrides: Partial<MCVContext>): MCVContext {
      return { ...this, ...overrides };
    },
  };
  
  return context;
}

export function withContext<T>(context: MCVContext, fn: () => T): T {
  return contextStorage.run(context, fn);
}

export function getContext(): MCVContext {
  const context = contextStorage.getStore();
  if (!context) {
    throw new Error('No context available. Ensure withContext() is used.');
  }
  return context;
}

export function tryGetContext(): MCVContext | null {
  return contextStorage.getStore() ?? null;
}
```

### Context Middleware

```typescript
// @mcv/kernel/context/middleware.ts
import { createContext, withContext } from './context';
import { MCVVenture } from './types';

// For tRPC middleware
export function createContextMiddleware() {
  return async ({ ctx, next }) => {
    const venture = await resolveVenture(ctx.req);
    const user = ctx.session?.user ?? null;
    
    const mcvContext = createContext({
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        permissions: user.permissions,
      } : null,
      venture,
      requestId: ctx.req.headers['x-request-id'],
    });
    
    return withContext(mcvContext, () => next({ ctx: { ...ctx, mcv: mcvContext } }));
  };
}

async function resolveVenture(req: Request): Promise<MCVVenture> {
  // Resolution logic: subdomain, header, or default
  const host = req.headers.get('host') ?? '';
  const ventureSlug = host.split('.')[0];
  
  // Look up venture from database or cache
  // ...
  
  return venture;
}
```

---

## Dependencies

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | ^0.29.x | Type-safe ORM |
| `postgres` | ^3.4.x | PostgreSQL client |
| `zod` | ^3.22.x | Schema validation |
| `pino` | ^8.x | Structured logging |
| `pino-pretty` | ^10.x | Dev log formatting |
| `date-fns` | ^3.x | Date utilities |
| `date-fns-tz` | ^2.x | Timezone support |
| `decimal.js` | ^10.x | Precise decimals |
| `nanoid` | ^5.x | ID generation |
| `slugify` | ^1.6.x | Slug generation |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.3.x | TypeScript |

---

## Package Exports

```typescript
// @mcv/kernel/index.ts

// Database
export { db, withTransaction } from './db/client';
export { runMigrations } from './db/migrate';
export { baseColumns, createTable } from './db/base';
export * as schema from './db/schema';

// Configuration
export { config, getConfig, loadConfig } from './config';
export { configSchema, type Config } from './config/schema';
export { encrypt, decrypt } from './config/secrets';

// Logging
export { logger, createLogger, createRequestLogger } from './logger';

// Errors
export { MCVError, ErrorCode } from './errors/base';
export { NotFoundError, ValidationError, UnauthorizedError, ConflictError } from './errors/specialized';
export { handleError } from './errors/handler';

// Utilities
export * from './utils/date';
export * from './utils/currency';
export * from './utils/string';
export * from './utils/validation';

// Types
export * from './types/core';
export * from './types/entities';

// Context
export { createContext, withContext, getContext, tryGetContext } from './context';
export type { MCVContext, MCVUser, MCVVenture, MCVOrganization } from './context/types';
```

---

## Testing

### Unit Test Examples

```typescript
// @mcv/kernel/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { slugify, formatCurrency, formatDate, isValidEmail } from '../utils';

describe('slugify', () => {
  it('converts string to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Test 123!')).toBe('test-123');
  });
});

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1234.56');
    expect(formatCurrency(0.1, 'USD')).toBe('$0.10');
  });
  
  it('formats EDGE with 9 decimals', () => {
    expect(formatCurrency(1.123456789, 'EDGE')).toBe('1.123456789 EDGE');
  });
});

describe('isValidEmail', () => {
  it('validates email format', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
  });
});
```

---

## Related Documentation

- [db Module Details](./db/MODULE.md)
- [config Module Details](./config/MODULE.md)
- [logger Module Details](./logger/MODULE.md)
- [errors Module Details](./errors/MODULE.md)
- [utils Module Details](./utils/MODULE.md)
- [types Module Details](./types/MODULE.md)
- [context Module Details](./context/MODULE.md)

---

*@mcv/kernel — The Foundation of MCV.ONE*
