# @mcv/kernel — Kernel Module

> **Tier:** 0 — Absolute Foundation  
> **Classification:** KERNEL / INTERNAL  
> **Package:** `@mcv/kernel`  
> **Version:** 1.0.0  
> **Status:** Production  
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Position](#architecture-position)
3. [Installation & Setup](#installation--setup)
4. [Package Exports](#package-exports)
5. [Submodule: config](#submodule-config)
6. [Submodule: context](#submodule-context)
7. [Submodule: db](#submodule-db)
8. [Submodule: errors](#submodule-errors)
9. [Submodule: logger](#submodule-logger)
10. [Submodule: types](#submodule-types)
11. [Submodule: utils](#submodule-utils)
12. [Cross-Module Integration](#cross-module-integration)
13. [Key Interfaces & Types](#key-interfaces--types)
14. [Database Schema](#database-schema)
15. [Configuration Reference](#configuration-reference)
16. [Testing Patterns](#testing-patterns)
17. [Migration Guide](#migration-guide)
18. [Dependencies](#dependencies)
19. [Related Documentation](#related-documentation)

---

## Overview

`@mcv/kernel` is the **absolute foundation** of the MCV.ONE Agentic OS platform. It provides the primitive infrastructure that every other package in the monorepo depends on:

- **Database connectivity** — Supabase/PostgreSQL via Drizzle ORM with connection pooling, migrations, and Row-Level Security
- **Configuration management** — 4-layer hierarchical config with Zod validation, secrets handling, and dynamic runtime overrides
- **Structured logging** — Pino-based structured logs with request correlation, venture-scoped output, and configurable shipping
- **Error handling** — Typed error hierarchy with numeric error codes, HTTP status mapping, and serialization
- **Execution context** — AsyncLocalStorage-based context propagation for tenant, user, and request data
- **Type definitions** — Branded types, utility types, Zod schema primitives, and shared interfaces
- **Utilities** — Date/time, string manipulation, currency math, crypto helpers, retry logic, and pagination

**No package in the MCV.ONE SDK may have zero internal dependencies — every package depends on `@mcv/kernel`.**

The kernel serves nine ventures in the MCV.ONE consortium: **BetEdge**, **SerpSpace**, **Full Gain**, **MCV Studios**, **Futurestate**, and others. All multi-tenant isolation, shared configuration, and cross-venture type safety originates here.

### Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Zero external assumptions** | Kernel never imports from other `@mcv/*` packages |
| **Multi-tenant by default** | Every table has `venture_id`, every context carries tenant info |
| **Type safety at the boundary** | Branded types prevent accidental ID mixing; Zod validates all external input |
| **Fail fast, fail loud** | Invalid config throws at startup; missing context throws immediately |
| **Structured everything** | Logs are JSON, errors are serializable, config is schema-validated |
| **Soft deletes everywhere** | `deleted_at` timestamp instead of hard deletes; data is recoverable |

---

## Architecture Position

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Tier 4 — Applications                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ BetEdge  │ │SerpSpace │ │Full Gain │ │MCV Studio│ │Futurestate│   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────────────────────────────────┤
│  Tier 3 — Vertical Packages                                            │
│  @mcv/commerce  @mcv/intelligence  @mcv/betting  @mcv/social           │
├─────────────────────────────────────────────────────────────────────────┤
│  Tier 2 — Platform Services                                            │
│  @mcv/nexus  @mcv/auth  @mcv/api  @mcv/realtime  @mcv/storage         │
├─────────────────────────────────────────────────────────────────────────┤
│  Tier 1 — UI & Shared Libraries                                        │
│  @mcv/ui  @mcv/hooks  @mcv/forms  @mcv/i18n                           │
├═════════════════════════════════════════════════════════════════════════┤
│  Tier 0 — KERNEL (this package)                          ★ YOU ARE HERE │
│                                                                         │
│  ┌────────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │ config │ │ context │ │   db   │ │ errors │ │ logger │ │ types  │ │
│  └────────┘ └─────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │
│                          ┌────────┐                                    │
│                          │ utils  │                                    │
│                          └────────┘                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  External Dependencies                                                  │
│  drizzle-orm │ postgres │ zod │ pino │ date-fns │ nanoid │ decimal.js │
└─────────────────────────────────────────────────────────────────────────┘
```

**Dependency rule:** Arrows point downward only. Kernel imports nothing from the monorepo. Everything above imports from kernel.

### Internal Submodule Dependency Graph

```
  config ─────────────────────────────────┐
    │                                      │
    ▼                                      │
  logger ◄── context ──► db               │
    │           │         │                │
    ▼           ▼         ▼                │
  errors ◄─────┴─────────┘                │
    │                                      │
    ▼                                      ▼
  types ◄──────────────────────────────── utils
```

- **types** and **utils** are leaf modules — they depend on nothing inside kernel
- **config** depends on **types** and **utils** (for Zod schemas, type definitions)
- **logger** depends on **config** (for log level/format settings)
- **errors** depends on **logger** (for error logging) and **types** (for branded codes)
- **db** depends on **config** (for connection string), **logger** (for query logging), and **types** (for entity types)
- **context** depends on **types** (for `MCVUser`, `MCVVenture`), **logger** (for request-scoped loggers), and **db** (for RLS session variables)

---

## Installation & Setup

### Internal Monorepo Usage

```jsonc
// package.json (in any @mcv/* package)
{
  "dependencies": {
    "@mcv/kernel": "workspace:*"
  }
}
```

```typescript
// Import what you need
import { db, config, logger, MCVError, getContext } from '@mcv/kernel';

// Or import specific submodules for tree-shaking
import { db, withTransaction } from '@mcv/kernel/db';
import { config, getConfig } from '@mcv/kernel/config';
import { logger, createLogger } from '@mcv/kernel/logger';
import { MCVError, NotFoundError } from '@mcv/kernel/errors';
import { getContext, withContext } from '@mcv/kernel/context';
import type { VentureID, UserID, PaginatedResult } from '@mcv/kernel/types';
import { slugify, formatCurrency, retry } from '@mcv/kernel/utils';
```

### Minimum Environment Variables

Before kernel can initialize, the following environment variables must be set:

```bash
# Required — kernel will throw at startup if missing
DATABASE_URL=postgresql://user:pass@host:5432/mcv_db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=<min-32-characters>
ENCRYPTION_KEY=<64-hex-characters>

# Optional — sensible defaults applied
NODE_ENV=development          # development | staging | production
LOG_LEVEL=info                # trace | debug | info | warn | error | fatal
LOG_FORMAT=json               # json | pretty
DATABASE_POOL_SIZE=20         # 1-100
```

---

## Package Exports

The root barrel file re-exports every submodule's public API:

```typescript
// @mcv/kernel/index.ts

// ── Database ────────────────────────────────────────
export { db, withTransaction } from './db/client';
export { runMigrations } from './db/migrate';
export { baseColumns, createTable } from './db/base';
export * as schema from './db/schema';

// ── Configuration ───────────────────────────────────
export { config, getConfig, loadConfig } from './config';
export { configSchema, type Config } from './config/schema';
export { encrypt, decrypt } from './config/secrets';

// ── Logging ─────────────────────────────────────────
export { logger, createLogger, createRequestLogger } from './logger';

// ── Errors ──────────────────────────────────────────
export { MCVError, ErrorCode } from './errors/base';
export {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ConflictError,
} from './errors/specialized';
export { handleError } from './errors/handler';

// ── Utilities ───────────────────────────────────────
export * from './utils/date';
export * from './utils/currency';
export * from './utils/string';
export * from './utils/validation';
export * from './utils/retry';
export * from './utils/pagination';
export * from './utils/crypto';

// ── Types ───────────────────────────────────────────
export * from './types/core';
export * from './types/entities';

// ── Context ─────────────────────────────────────────
export { createContext, withContext, getContext, tryGetContext } from './context';
export type {
  MCVContext,
  MCVUser,
  MCVVenture,
  MCVOrganization,
} from './context/types';
```

---

## Submodule: config

### Purpose

Centralized, validated, multi-layered configuration management. Every environment variable, feature flag, and secret flows through this submodule before reaching application code.

### 4-Layer Configuration Hierarchy

Configuration is resolved by merging four layers, where later layers override earlier ones:

```
┌─────────────────────────────────────────────┐
│  Layer 4: Runtime Overrides                  │  ← Highest priority
│  Programmatic overrides via API              │
├─────────────────────────────────────────────┤
│  Layer 3: Venture-Specific Config            │
│  Per-venture overrides from DB / config map  │
├─────────────────────────────────────────────┤
│  Layer 2: Environment Variables              │
│  .env files + process.env                    │
├─────────────────────────────────────────────┤
│  Layer 1: Base Defaults                      │  ← Lowest priority
│  Hardcoded defaults in Zod schemas           │
└─────────────────────────────────────────────┘
```

**Resolution order:** Base Defaults → Environment Variables → Venture Config → Runtime Overrides

### Configuration Schema

All configuration is validated at startup using Zod. If any required variable is missing or invalid, the process throws immediately with a detailed error message — no silent failures.

```typescript
// @mcv/kernel/config/schema.ts
import { z } from 'zod';

export const configSchema = z.object({
  // ── Environment ───────────────────────────────────
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // ── Database ──────────────────────────────────────
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().min(1).max(100).default(20),
  DATABASE_IDLE_TIMEOUT: z.coerce.number().min(0).default(20),
  DATABASE_CONNECT_TIMEOUT: z.coerce.number().min(1).default(10),

  // ── Supabase ──────────────────────────────────────
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),

  // ── Redis (optional) ─────────────────────────────
  REDIS_URL: z.string().url().optional(),
  REDIS_POOL_SIZE: z.coerce.number().min(1).max(50).default(10),

  // ── Logging ───────────────────────────────────────
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  LOG_REDACT_PATHS: z.string().default('password,token,secret,authorization,cookie'),

  // ── Security ──────────────────────────────────────
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64),  // 32 bytes, hex-encoded

  // ── Feature Flags ─────────────────────────────────
  ENABLE_DEBUG_MODE: z.coerce.boolean().default(false),
  ENABLE_TELEMETRY: z.coerce.boolean().default(true),
  ENABLE_QUERY_LOGGING: z.coerce.boolean().default(false),

  // ── Venture Defaults ──────────────────────────────
  DEFAULT_VENTURE_SLUG: z.string().default('mcv'),
  DEFAULT_TIMEZONE: z.string().default('UTC'),
  DEFAULT_LOCALE: z.string().default('en-US'),
  DEFAULT_CURRENCY: z.enum(['USD', 'CAD', 'EUR', 'GBP']).default('USD'),
});

export type Config = z.infer<typeof configSchema>;
```

### Configuration Loader

```typescript
// @mcv/kernel/config/loader.ts
import { configSchema, type Config } from './schema';

let cachedConfig: Config | null = null;

/**
 * Load and validate configuration from process.env.
 * Throws immediately if validation fails — prevents startup with bad config.
 * Result is cached after first successful load.
 */
export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig;

  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  • ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(
      `\n╔══════════════════════════════════════════╗\n` +
      `║  CONFIGURATION VALIDATION FAILED         ║\n` +
      `╚══════════════════════════════════════════╝\n\n` +
      `${errors}\n\n` +
      `Fix the above errors in your .env file or environment variables.\n`
    );
  }

  cachedConfig = result.data;
  return cachedConfig;
}

/** Eagerly-loaded config singleton. Import this for direct access. */
export const config = loadConfig();

/**
 * Type-safe config accessor. Use when you need a single value
 * and want autocomplete on the key name.
 */
export function getConfig<K extends keyof Config>(key: K): Config[K] {
  return config[key];
}
```

### Dynamic Configuration (Venture-Specific Overrides)

Beyond static environment variables, ventures can store per-tenant configuration in the database. This powers the Venture and Runtime layers of the hierarchy.

```typescript
// @mcv/kernel/config/dynamic.ts
import { db } from '../db/client';
import { config } from './loader';
import { logger } from '../logger';
import { z } from 'zod';

/**
 * Venture-specific configuration stored in `venture_config` table.
 * Values here override environment defaults for a specific venture.
 */
export interface VentureConfig {
  ventureId: string;
  key: string;
  value: unknown;
  schema?: z.ZodSchema;  // Optional runtime validation
}

// In-memory cache with TTL
const ventureConfigCache = new Map<string, { data: Map<string, unknown>; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Get a venture-specific config value with fallback to global config.
 */
export async function getVentureConfig<T>(
  ventureId: string,
  key: string,
  fallback: T
): Promise<T> {
  const cached = ventureConfigCache.get(ventureId);
  if (cached && cached.expiresAt > Date.now()) {
    return (cached.data.get(key) as T) ?? fallback;
  }

  try {
    const rows = await db.query.ventureConfig.findMany({
      where: (vc, { eq }) => eq(vc.ventureId, ventureId),
    });

    const data = new Map(rows.map((r) => [r.key, r.value]));
    ventureConfigCache.set(ventureId, { data, expiresAt: Date.now() + CACHE_TTL_MS });

    return (data.get(key) as T) ?? fallback;
  } catch (err) {
    logger.warn({ err, ventureId, key }, 'Failed to load venture config, using fallback');
    return fallback;
  }
}

/**
 * Runtime override — set a config value programmatically.
 * This is the highest priority layer and takes effect immediately.
 */
const runtimeOverrides = new Map<string, unknown>();

export function setRuntimeConfig(key: string, value: unknown): void {
  runtimeOverrides.set(key, value);
  logger.info({ key }, 'Runtime config override applied');
}

export function getRuntimeConfig<T>(key: string): T | undefined {
  return runtimeOverrides.get(key) as T | undefined;
}

export function clearRuntimeConfig(key?: string): void {
  if (key) {
    runtimeOverrides.delete(key);
  } else {
    runtimeOverrides.clear();
  }
}
```

### Secrets Management

Sensitive values (API keys, tokens, encryption keys) are encrypted at rest and decrypted on access.

```typescript
// @mcv/kernel/config/secrets.ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt a plaintext value using AES-256-GCM.
 * Returns a colon-delimited string: `iv:authTag:ciphertext` (all hex).
 */
export function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a value encrypted by `encrypt()`.
 * Expects the colon-delimited format: `iv:authTag:ciphertext`.
 */
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

/**
 * Derive an encryption key from a passphrase using scrypt.
 * Use this when you need a key from a human-readable secret.
 */
export function deriveKey(passphrase: string, salt: string): Buffer {
  return scryptSync(passphrase, salt, 32);
}

/**
 * Generate a random encryption key (32 bytes = 256 bits).
 * Returns hex-encoded string suitable for ENCRYPTION_KEY env var.
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}
```

### Config Usage Examples

```typescript
import { config, getConfig, getVentureConfig } from '@mcv/kernel';

// ── Direct access ──
const dbUrl = config.DATABASE_URL;
const isProd = config.NODE_ENV === 'production';

// ── Type-safe accessor ──
const logLevel = getConfig('LOG_LEVEL');  // TypeScript knows this is LogLevel

// ── Venture-specific override ──
const maxUploadSize = await getVentureConfig(
  venture.id,
  'MAX_UPLOAD_SIZE_MB',
  100  // fallback: 100 MB
);

// ── Conditional feature flags ──
if (getConfig('ENABLE_DEBUG_MODE')) {
  logger.debug({ config: config }, 'Full config dump (debug mode)');
}
```

---

## Submodule: context

### Purpose

Provides **execution context** — the thread of tenant, user, and request information that flows through every operation in the system. Built on Node.js `AsyncLocalStorage` so context is automatically propagated through async call chains without manual parameter passing.

### Why Context Matters

In a multi-tenant system serving 9 ventures, every database query needs to know *which venture*, every log line needs a *request ID*, and every authorization check needs to know *who the user is*. Context makes this implicit rather than requiring every function signature to carry tenant/user parameters.

```
HTTP Request arrives
    │
    ▼
┌─────────────────────────────────────────┐
│  Middleware creates MCVContext           │
│  • Resolves venture from hostname       │
│  • Extracts user from JWT               │
│  • Generates requestId                  │
│  • Wraps handler in withContext()        │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Application code calls getContext()    │
│  • db: Sets RLS session variables       │
│  • logger: Adds ventureId, requestId    │
│  • errors: Attaches context to errors   │
│  • auth: Checks user permissions        │
└─────────────────────────────────────────┘
```

### Context Type Definitions

```typescript
// @mcv/kernel/context/types.ts
import type { VentureID, UserID, OrganizationID, UUID } from '../types';

/** Authenticated user within the current request. */
export interface MCVUser {
  id: UserID;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, unknown>;
}

/** The venture (tenant) this request belongs to. */
export interface MCVVenture {
  id: VentureID;
  slug: string;
  name: string;
  domain: string;
  settings: Record<string, unknown>;
}

/** Organization within a venture (optional sub-tenant). */
export interface MCVOrganization {
  id: OrganizationID;
  name: string;
  ventureId: VentureID;
}

/**
 * The core execution context — available everywhere via getContext().
 * Created once per request/job/event and propagated automatically.
 */
export interface MCVContext {
  // ── Request Metadata ──────────────────────────────
  requestId: UUID;
  timestamp: Date;
  source: 'http' | 'trpc' | 'websocket' | 'cron' | 'queue' | 'internal';

  // ── Authentication ────────────────────────────────
  user: MCVUser | null;
  isAuthenticated: boolean;

  // ── Multi-Tenancy ─────────────────────────────────
  venture: MCVVenture;
  organization: MCVOrganization | null;

  // ── Authorization Helpers ─────────────────────────
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;

  // ── Context Propagation ───────────────────────────
  child: (overrides: Partial<MCVContext>) => MCVContext;

  // ── Logger ────────────────────────────────────────
  log: import('pino').Logger;
}
```

### Context Implementation

```typescript
// @mcv/kernel/context/context.ts
import { AsyncLocalStorage } from 'async_hooks';
import type { MCVContext, MCVUser, MCVVenture, MCVOrganization } from './types';
import { generateId } from '../utils/string';
import { createRequestLogger } from '../logger';

/**
 * AsyncLocalStorage instance — the backbone of context propagation.
 * Each async execution chain gets its own isolated context.
 */
const contextStorage = new AsyncLocalStorage<MCVContext>();

/**
 * Create a new execution context. Typically called once per request
 * in middleware, then wrapped with withContext().
 */
export function createContext(params: {
  user?: MCVUser | null;
  venture: MCVVenture;
  organization?: MCVOrganization | null;
  requestId?: string;
  source?: MCVContext['source'];
}): MCVContext {
  const requestId = params.requestId ?? generateId('req');

  const context: MCVContext = {
    requestId: requestId as any,
    timestamp: new Date(),
    source: params.source ?? 'internal',
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
      return roles.some((role) => this.hasRole(role));
    },

    hasAllRoles(roles: string[]): boolean {
      return roles.every((role) => this.hasRole(role));
    },

    child(overrides: Partial<MCVContext>): MCVContext {
      return { ...this, ...overrides };
    },

    log: createRequestLogger(requestId, params.venture.id, params.user?.id),
  };

  return context;
}

/**
 * Run a function within a context. All async operations inside `fn`
 * will have access to this context via getContext().
 *
 * @example
 * const ctx = createContext({ venture, user });
 * const result = await withContext(ctx, async () => {
 *   const ctx = getContext(); // same ctx
 *   return await doWork();
 * });
 */
export function withContext<T>(context: MCVContext, fn: () => T): T {
  return contextStorage.run(context, fn);
}

/**
 * Get the current execution context. Throws if called outside
 * a withContext() scope — this is intentional to catch bugs early.
 */
export function getContext(): MCVContext {
  const context = contextStorage.getStore();
  if (!context) {
    throw new Error(
      'No execution context available. ' +
      'Ensure this code is running inside withContext(). ' +
      'If this is a background job, create a context with createContext() first.'
    );
  }
  return context;
}

/**
 * Try to get the current context, returning null if unavailable.
 * Use this in code paths that may run both inside and outside a context
 * (e.g., utility functions, startup code).
 */
export function tryGetContext(): MCVContext | null {
  return contextStorage.getStore() ?? null;
}

/**
 * Assert that the current context has an authenticated user.
 * Throws UnauthorizedError if not.
 */
export function requireAuth(): MCVContext & { user: MCVUser; isAuthenticated: true } {
  const ctx = getContext();
  if (!ctx.isAuthenticated || !ctx.user) {
    throw new (require('../errors/specialized').UnauthorizedError)(
      'Authentication required'
    );
  }
  return ctx as MCVContext & { user: MCVUser; isAuthenticated: true };
}

/**
 * Assert that the current user has a specific permission.
 * Throws UnauthorizedError if not.
 */
export function requirePermission(permission: string): MCVContext {
  const ctx = requireAuth();
  if (!ctx.hasPermission(permission)) {
    throw new (require('../errors/specialized').UnauthorizedError)(
      `Missing required permission: ${permission}`
    );
  }
  return ctx;
}
```

### Context Middleware (Express / tRPC)

```typescript
// @mcv/kernel/context/middleware.ts
import { createContext, withContext } from './context';
import type { MCVVenture } from './types';

/**
 * Express middleware — wraps every request in an MCVContext.
 */
export function contextMiddleware() {
  return async (req: any, res: any, next: any) => {
    const venture = await resolveVenture(req);
    const user = req.user ?? null; // set by auth middleware upstream

    const ctx = createContext({
      user,
      venture,
      requestId: req.headers['x-request-id'] as string,
      source: 'http',
    });

    // Attach to request for backward compatibility
    req.mcv = ctx;

    // Run the rest of the middleware chain inside the context
    withContext(ctx, () => next());
  };
}

/**
 * tRPC middleware — injects MCVContext into the tRPC context.
 */
export function createTRPCContextMiddleware() {
  return async ({ ctx, next }: { ctx: any; next: any }) => {
    const venture = await resolveVenture(ctx.req);
    const user = ctx.session?.user ?? null;

    const mcvContext = createContext({
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles ?? [],
            permissions: user.permissions ?? [],
          }
        : null,
      venture,
      requestId: ctx.req.headers['x-request-id'] as string,
      source: 'trpc',
    });

    return withContext(mcvContext, () =>
      next({ ctx: { ...ctx, mcv: mcvContext } })
    );
  };
}

/**
 * Resolve which venture a request belongs to.
 * Strategy: subdomain → x-venture-id header → default.
 */
async function resolveVenture(req: any): Promise<MCVVenture> {
  const host = req.headers?.host ?? req.headers?.get?.('host') ?? '';
  const ventureSlug = host.split('.')[0];

  // Look up venture from database or cache
  // (implementation depends on your venture registry)
  const venture = await lookupVenture(ventureSlug);

  if (!venture) {
    throw new Error(`Unknown venture: ${ventureSlug}`);
  }

  return venture;
}
```

### Context Usage Examples

```typescript
import { getContext, withContext, createContext, requireAuth } from '@mcv/kernel';

// ── Inside a request handler ──
async function handleCreatePost(input: CreatePostInput) {
  const ctx = requireAuth(); // throws if not logged in

  ctx.log.info({ input }, 'Creating post');

  const post = await db.insert(posts).values({
    ...input,
    ventureId: ctx.venture.id,    // Multi-tenant isolation
    createdBy: ctx.user.id,       // Audit trail
  });

  return post;
}

// ── Background job with synthetic context ──
async function runDailyReport(ventureId: string) {
  const venture = await lookupVenture(ventureId);

  const ctx = createContext({
    venture,
    source: 'cron',
    // No user — system-level operation
  });

  await withContext(ctx, async () => {
    const ctx = getContext();
    ctx.log.info('Starting daily report generation');
    // ... all db queries, logs, etc. have the context
  });
}
```

---

## Submodule: db

### Purpose

Database connectivity layer using **Drizzle ORM** with **Supabase PostgreSQL**. Provides connection management, base schema patterns, migration utilities, transaction helpers, and Row-Level Security (RLS) integration for multi-tenant isolation.

### Connection Management

```typescript
// @mcv/kernel/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from '../config';
import { logger } from '../logger';

const connectionString = config.DATABASE_URL;

/**
 * PostgreSQL connection pool.
 * Uses the `postgres` driver (porsager/postgres) for best Supabase compatibility.
 */
const client = postgres(connectionString, {
  max: config.DATABASE_POOL_SIZE,            // Maximum pool size (default: 20)
  idle_timeout: config.DATABASE_IDLE_TIMEOUT, // Close idle connections (default: 20s)
  connect_timeout: config.DATABASE_CONNECT_TIMEOUT, // Connection timeout (default: 10s)
  prepare: false,                             // Disable prepared statements (Supabase requirement)
  onnotice: (notice) => {
    logger.debug({ notice }, 'PostgreSQL notice');
  },
  debug: config.ENABLE_QUERY_LOGGING
    ? (connection, query, params) => {
        logger.trace({ query, params }, 'SQL query');
      }
    : undefined,
});

/** The Drizzle ORM instance — use this for all database operations. */
export const db = drizzle(client, { schema });

/**
 * Execute a function inside a database transaction.
 * Automatically rolls back on error.
 *
 * @example
 * const result = await withTransaction(async (tx) => {
 *   await tx.insert(orders).values(order);
 *   await tx.insert(orderItems).values(items);
 *   return order.id;
 * });
 */
export async function withTransaction<T>(
  fn: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(fn);
}

/**
 * Execute raw SQL. Use sparingly — prefer Drizzle's query builder.
 * Useful for complex queries, DDL, or Supabase-specific operations.
 */
export async function rawQuery<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  return client.unsafe(sql, params as any[]) as unknown as T[];
}

/**
 * Health check — verify the database connection is alive.
 * Returns latency in milliseconds.
 */
export async function healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    await client`SELECT 1`;
    return { ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    logger.error({ err }, 'Database health check failed');
    return { ok: false, latencyMs: Math.round(performance.now() - start) };
  }
}

/**
 * Graceful shutdown — close all pool connections.
 * Call this in your process shutdown handler.
 */
export async function disconnect(): Promise<void> {
  logger.info('Closing database connections...');
  await client.end();
  logger.info('Database connections closed');
}
```

### Base Schema Pattern

Every table in MCV.ONE follows a consistent pattern with multi-tenant isolation, audit fields, and soft deletes:

```typescript
// @mcv/kernel/db/base.ts
import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Standard columns included on every table.
 * Use `createTable()` to automatically include these.
 */
export const baseColumns = {
  /** UUID v4 primary key, auto-generated. */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Venture (tenant) this row belongs to. Required for RLS. */
  ventureId: uuid('venture_id').notNull(),

  /** When this row was created (auto-set, never updated). */
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  /** When this row was last updated (auto-updated by trigger). */
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

  /** User who created this row (nullable for system operations). */
  createdBy: uuid('created_by'),

  /** User who last updated this row. */
  updatedBy: uuid('updated_by'),

  /** Soft delete timestamp. Non-null = deleted. */
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

/**
 * Create a table with standard base columns.
 * Use this instead of raw pgTable() to ensure consistency.
 *
 * @example
 * export const posts = createTable('posts', {
 *   title: text('title').notNull(),
 *   content: text('content'),
 *   status: text('status').notNull().default('draft'),
 * });
 */
export function createTable<T extends Record<string, any>>(
  name: string,
  columns: T
) {
  return pgTable(name, { ...baseColumns, ...columns });
}

/**
 * SQL fragment for the auto-update trigger on updated_at.
 * Apply this via migration to every table.
 */
export const updatedAtTriggerSQL = (tableName: string) => sql`
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER update_${sql.raw(tableName)}_updated_at
    BEFORE UPDATE ON ${sql.raw(tableName)}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;
```

### Migration System

```typescript
// @mcv/kernel/db/migrate.ts
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './client';
import { logger } from '../logger';

/**
 * Run all pending Drizzle migrations.
 * Call this during application startup or in a dedicated migration script.
 */
export async function runMigrations(migrationsFolder = './drizzle'): Promise<void> {
  const start = performance.now();
  logger.info({ migrationsFolder }, 'Running database migrations...');

  try {
    await migrate(db, { migrationsFolder });
    const duration = Math.round(performance.now() - start);
    logger.info({ durationMs: duration }, 'Migrations completed successfully');
  } catch (err) {
    logger.fatal({ err }, 'Migration failed');
    throw err;
  }
}

/**
 * Check if there are pending migrations without running them.
 */
export async function checkMigrationStatus(): Promise<{
  pending: number;
  applied: number;
}> {
  // Implementation depends on Drizzle's migration journal
  const result = await db.execute(
    sql`SELECT COUNT(*) as count FROM drizzle.__drizzle_migrations`
  );
  return {
    applied: Number(result[0]?.count ?? 0),
    pending: 0, // Drizzle doesn't expose pending count natively
  };
}
```

### Row-Level Security (RLS) Patterns

Every table uses PostgreSQL RLS to enforce multi-tenant isolation at the database level:

```sql
-- ═══════════════════════════════════════════════════
-- Row-Level Security Template (apply to every table)
-- ═══════════════════════════════════════════════════

-- 1. Enable RLS
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- 2. Venture isolation — only see rows for the current venture
CREATE POLICY "venture_isolation" ON {table_name}
  FOR ALL
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- 3. Soft delete filter — hide deleted rows by default
CREATE POLICY "exclude_deleted" ON {table_name}
  FOR SELECT
  USING (deleted_at IS NULL);

-- 4. Service role bypass — service key can see everything
CREATE POLICY "service_role_bypass" ON {table_name}
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

```typescript
// @mcv/kernel/db/rls.ts
import { db, rawQuery } from './client';
import { getContext, tryGetContext } from '../context';

/**
 * Set the RLS session variables for the current venture.
 * Call this at the start of every request to enable row-level security.
 *
 * @example
 * // In middleware, after context is established:
 * await setRLSContext();
 * // All subsequent queries are automatically filtered by venture
 */
export async function setRLSContext(): Promise<void> {
  const ctx = getContext();

  await rawQuery(`SELECT set_config('app.current_venture_id', $1, true)`, [
    ctx.venture.id,
  ]);

  if (ctx.user) {
    await rawQuery(`SELECT set_config('app.current_user_id', $1, true)`, [
      ctx.user.id,
    ]);
  }
}

/**
 * Execute a function with RLS context pre-set.
 * Combines context propagation with RLS session variable setup.
 */
export async function withRLS<T>(fn: () => Promise<T>): Promise<T> {
  await setRLSContext();
  return fn();
}

/**
 * Query helper that includes soft-delete filtering.
 * Adds `WHERE deleted_at IS NULL` to queries by default.
 */
export function excludeDeleted<T extends { deletedAt: any }>(
  query: any
): any {
  return query.where(sql`deleted_at IS NULL`);
}
```

### DB Usage Examples

```typescript
import { db, withTransaction, healthCheck } from '@mcv/kernel';
import { eq, and, isNull } from 'drizzle-orm';
import { posts } from './schema';

// ── Simple query ──
const allPosts = await db.query.posts.findMany({
  where: (p, { eq, isNull }) =>
    and(eq(p.ventureId, ventureId), isNull(p.deletedAt)),
  orderBy: (p, { desc }) => desc(p.createdAt),
  limit: 20,
});

// ── Insert ──
const [newPost] = await db
  .insert(posts)
  .values({
    title: 'Hello World',
    ventureId: ctx.venture.id,
    createdBy: ctx.user.id,
  })
  .returning();

// ── Transaction ──
const result = await withTransaction(async (tx) => {
  const [order] = await tx.insert(orders).values(orderData).returning();
  await tx.insert(orderItems).values(
    items.map((item) => ({ ...item, orderId: order.id }))
  );
  return order;
});

// ── Health check ──
const { ok, latencyMs } = await healthCheck();
console.log(`DB: ${ok ? 'healthy' : 'down'} (${latencyMs}ms)`);
```

---

## Submodule: errors

### Purpose

Standardized, structured error handling across the entire platform. Every error has a numeric code, an HTTP status mapping, serializable details, and an operational/programmer classification. Errors are designed to be caught, logged, serialized to API responses, and displayed to users — all without losing context.

### Error Code Registry

Error codes are organized by domain into numeric ranges:

| Range | Domain | HTTP Status |
|-------|--------|-------------|
| `1000–1999` | Authentication / Authorization | 401, 403 |
| `2000–2999` | Validation / Input | 400 |
| `3000–3999` | Resource / Not Found | 404, 409 |
| `4000–4999` | Business Logic | 422 |
| `5000–5999` | External Services | 502, 504 |
| `6000–6999` | System / Internal | 500 |

```typescript
// @mcv/kernel/errors/codes.ts
export enum ErrorCode {
  // ── 1xxx: Authentication / Authorization ──────────
  UNAUTHENTICATED       = 1001,
  UNAUTHORIZED          = 1002,
  TOKEN_EXPIRED         = 1003,
  INVALID_CREDENTIALS   = 1004,
  SESSION_EXPIRED       = 1005,
  MFA_REQUIRED          = 1006,
  ACCOUNT_LOCKED        = 1007,
  ACCOUNT_DISABLED      = 1008,

  // ── 2xxx: Validation ─────────────────────────────
  VALIDATION_ERROR      = 2001,
  INVALID_INPUT         = 2002,
  MISSING_REQUIRED_FIELD = 2003,
  INVALID_FORMAT        = 2004,
  VALUE_OUT_OF_RANGE    = 2005,
  PAYLOAD_TOO_LARGE     = 2006,

  // ── 3xxx: Resource ───────────────────────────────
  NOT_FOUND             = 3001,
  ALREADY_EXISTS        = 3002,
  CONFLICT              = 3003,
  GONE                  = 3004,
  VERSION_CONFLICT      = 3005,

  // ── 4xxx: Business Logic ─────────────────────────
  BUSINESS_RULE_VIOLATION = 4001,
  INSUFFICIENT_FUNDS    = 4002,
  LIMIT_EXCEEDED        = 4003,
  OPERATION_NOT_ALLOWED = 4004,
  FEATURE_DISABLED      = 4005,
  QUOTA_EXCEEDED        = 4006,
  VENTURE_SUSPENDED     = 4007,

  // ── 5xxx: External Services ──────────────────────
  EXTERNAL_SERVICE_ERROR = 5001,
  TIMEOUT               = 5002,
  RATE_LIMITED          = 5003,
  UPSTREAM_ERROR        = 5004,
  SERVICE_UNAVAILABLE   = 5005,

  // ── 6xxx: System ─────────────────────────────────
  INTERNAL_ERROR        = 6001,
  DATABASE_ERROR        = 6002,
  CONFIGURATION_ERROR   = 6003,
  MIGRATION_ERROR       = 6004,
  INITIALIZATION_ERROR  = 6005,
}
```

### Base Error Class

```typescript
// @mcv/kernel/errors/base.ts
import { ErrorCode } from './codes';

/**
 * Base error class for all MCV.ONE errors.
 *
 * Features:
 * - Numeric error code for programmatic handling
 * - HTTP status code for API responses
 * - Structured details for debugging
 * - Operational flag to distinguish expected vs. programmer errors
 * - Full JSON serialization
 * - Cause chaining (Error.cause)
 */
export class MCVError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: Error;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

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
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Map error code ranges to default HTTP status codes.
   */
  private getDefaultStatusCode(code: ErrorCode): number {
    if (code >= 1000 && code < 1002) return 401; // Unauthenticated
    if (code >= 1002 && code < 2000) return 403; // Unauthorized
    if (code >= 2000 && code < 3000) return 400; // Validation
    if (code === 3001)               return 404; // Not Found
    if (code >= 3002 && code < 4000) return 409; // Conflict
    if (code >= 4000 && code < 5000) return 422; // Business Logic
    if (code === 5002)               return 504; // Timeout
    if (code >= 5000 && code < 6000) return 502; // External Service
    return 500; // System
  }

  /**
   * Serialize to a plain object suitable for API responses.
   * Never includes stack traces in serialized output.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  /**
   * Create a human-readable string representation.
   */
  toString(): string {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
}
```

### Specialized Error Classes

```typescript
// @mcv/kernel/errors/specialized.ts
import { MCVError } from './base';
import { ErrorCode } from './codes';

/** Resource not found. */
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

/** Input validation failed. Includes per-field error details. */
export class ValidationError extends MCVError {
  constructor(message: string, fields?: Record<string, string[]>) {
    super(message, ErrorCode.VALIDATION_ERROR, {
      details: { fields },
      statusCode: 400,
    });
    this.name = 'ValidationError';
  }

  /** Create from a Zod error for seamless integration. */
  static fromZodError(error: import('zod').ZodError): ValidationError {
    const fields: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    }
    return new ValidationError('Validation failed', fields);
  }
}

/** User is not authorized to perform this action. */
export class UnauthorizedError extends MCVError {
  constructor(message = 'Unauthorized') {
    super(message, ErrorCode.UNAUTHORIZED, { statusCode: 403 });
    this.name = 'UnauthorizedError';
  }
}

/** User is not authenticated (no valid session/token). */
export class UnauthenticatedError extends MCVError {
  constructor(message = 'Authentication required') {
    super(message, ErrorCode.UNAUTHENTICATED, { statusCode: 401 });
    this.name = 'UnauthenticatedError';
  }
}

/** Resource already exists (duplicate key, unique constraint). */
export class ConflictError extends MCVError {
  constructor(message: string, conflictingField?: string) {
    super(message, ErrorCode.CONFLICT, {
      details: { conflictingField },
      statusCode: 409,
    });
    this.name = 'ConflictError';
  }
}

/** Business rule violation (insufficient funds, limit exceeded, etc.). */
export class BusinessRuleError extends MCVError {
  constructor(message: string, rule?: string) {
    super(message, ErrorCode.BUSINESS_RULE_VIOLATION, {
      details: { rule },
      statusCode: 422,
    });
    this.name = 'BusinessRuleError';
  }
}

/** External service error (API call failed, timeout, etc.). */
export class ExternalServiceError extends MCVError {
  constructor(service: string, message: string, cause?: Error) {
    super(`${service}: ${message}`, ErrorCode.EXTERNAL_SERVICE_ERROR, {
      details: { service },
      cause,
      statusCode: 502,
    });
    this.name = 'ExternalServiceError';
  }
}

/** Database error (query failed, connection lost, etc.). */
export class DatabaseError extends MCVError {
  constructor(message: string, cause?: Error) {
    super(message, ErrorCode.DATABASE_ERROR, {
      cause,
      isOperational: false,  // DB errors are usually programmer errors
    });
    this.name = 'DatabaseError';
  }
}
```

### Error Handler

```typescript
// @mcv/kernel/errors/handler.ts
import { MCVError, ErrorCode } from './base';
import { logger } from '../logger';
import { tryGetContext } from '../context';

/**
 * Central error handler. Converts any error to a structured API response.
 * Use this in your global error middleware.
 */
export function handleError(error: unknown): {
  statusCode: number;
  body: {
    success: false;
    error: {
      message: string;
      code: number;
      details?: unknown;
      requestId?: string;
    };
  };
} {
  const ctx = tryGetContext();
  const requestId = ctx?.requestId;

  // ── Known MCVError ──
  if (error instanceof MCVError) {
    if (!error.isOperational) {
      logger.fatal({ err: error, requestId }, 'Non-operational error (programmer bug)');
    } else {
      logger.error({ err: error, requestId }, error.message);
    }

    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          requestId,
        },
      },
    };
  }

  // ── Zod validation error ──
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as import('zod').ZodError;
    logger.warn({ err: zodError, requestId }, 'Zod validation error');

    return {
      statusCode: 400,
      body: {
        success: false,
        error: {
          message: 'Validation failed',
          code: ErrorCode.VALIDATION_ERROR,
          details: { issues: zodError.issues },
          requestId,
        },
      },
    };
  }

  // ── Unknown error — treat as internal ──
  logger.fatal({ err: error, requestId }, 'Unexpected error');

  return {
    statusCode: 500,
    body: {
      success: false,
      error: {
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error instanceof Error
              ? error.message
              : 'Unknown error',
        code: ErrorCode.INTERNAL_ERROR,
        requestId,
      },
    },
  };
}

/**
 * Express error middleware.
 */
export function errorMiddleware() {
  return (err: unknown, req: any, res: any, _next: any) => {
    const { statusCode, body } = handleError(err);
    res.status(statusCode).json(body);
  };
}

/**
 * Wrap an async handler to catch errors automatically.
 */
export function catchAsync(fn: (...args: any[]) => Promise<any>) {
  return (...args: any[]) => {
    const next = args[args.length - 1];
    return Promise.resolve(fn(...args)).catch(next);
  };
}
```

### Error Usage Examples

```typescript
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  BusinessRuleError,
  ExternalServiceError,
  handleError,
} from '@mcv/kernel';

// ── Throw specific errors ──
throw new NotFoundError('Post', postId);
// → NotFoundError [3001]: Post with id 'abc123' not found (404)

throw new ValidationError('Invalid input', {
  email: ['Invalid email format'],
  age: ['Must be at least 18'],
});
// → ValidationError [2001]: Invalid input (400)

// ── From Zod validation ──
const result = schema.safeParse(input);
if (!result.success) {
  throw ValidationError.fromZodError(result.error);
}

// ── Business rule ──
if (account.balance < amount) {
  throw new BusinessRuleError(
    'Insufficient funds for this transaction',
    'MINIMUM_BALANCE'
  );
}

// ── External service wrapper ──
try {
  const response = await fetch(stripeUrl);
  if (!response.ok) {
    throw new ExternalServiceError('Stripe', `HTTP ${response.status}`);
  }
} catch (err) {
  throw new ExternalServiceError('Stripe', 'Connection failed', err as Error);
}

// ── Catch-all in middleware ──
app.use((err, req, res, next) => {
  const { statusCode, body } = handleError(err);
  res.status(statusCode).json(body);
});
```

---

## Submodule: logger

### Purpose

Structured, high-performance logging built on **Pino**. Every log line is JSON in production and pretty-printed in development. Logs are enriched with context (request ID, venture ID, user ID) automatically when an execution context is available.

### Logger Configuration

```typescript
// @mcv/kernel/logger/index.ts
import pino, { Logger, LoggerOptions } from 'pino';
import { config } from '../config';

/**
 * Paths to automatically redact from log output.
 * Prevents accidental logging of sensitive data.
 */
const REDACT_PATHS = config.LOG_REDACT_PATHS.split(',').map((p) => p.trim());

const baseOptions: LoggerOptions = {
  level: config.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
      service: 'mcv-one',
    }),
  },
  redact: {
    paths: [
      ...REDACT_PATHS,
      '*.password',
      '*.token',
      '*.secret',
      '*.authorization',
      '*.cookie',
      '*.creditCard',
      '*.ssn',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
};

const devTransport: LoggerOptions = {
  ...baseOptions,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  },
};

/**
 * Root logger instance.
 * In production: JSON output to stdout (for log shipping).
 * In development: Pretty-printed, colorized output.
 */
export const logger: Logger = pino(
  config.LOG_FORMAT === 'pretty' ? devTransport : baseOptions
);

/**
 * Create a child logger with additional context fields.
 * Fields are included in every log line from the child.
 *
 * @example
 * const log = createLogger({ module: 'payments', ventureId });
 * log.info('Payment processed'); // includes module + ventureId
 */
export function createLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}

/**
 * Create a request-scoped logger with correlation fields.
 * Automatically called by context creation — you rarely need this directly.
 */
export function createRequestLogger(
  requestId: string,
  ventureId?: string,
  userId?: string
): Logger {
  return logger.child({
    requestId,
    ...(ventureId && { ventureId }),
    ...(userId && { userId }),
  });
}
```

### Log Levels

| Level | Value | When to Use | Example |
|-------|-------|-------------|---------|
| `trace` | 10 | Extremely detailed debugging | Method entry/exit, loop iterations |
| `debug` | 20 | Development debugging | SQL queries, HTTP requests, cache hits |
| `info` | 30 | Normal operations | Request handled, job completed, user action |
| `warn` | 40 | Potential issues, degradation | Deprecated API usage, retry attempts, slow queries |
| `error` | 50 | Failures that need attention | Failed operations, unhandled rejections |
| `fatal` | 60 | System failures, startup crashes | DB connection lost, missing config, OOM |

### Venture-Scoped Logging

```typescript
// @mcv/kernel/logger/venture.ts
import { createLogger } from './index';
import type { Logger } from 'pino';

/**
 * Map of venture-specific loggers. Each venture gets its own
 * child logger with the venture slug baked in.
 */
const ventureLoggers = new Map<string, Logger>();

/**
 * Get or create a logger for a specific venture.
 * Useful for background jobs and system processes
 * that operate on behalf of a venture.
 */
export function getVentureLogger(ventureId: string, ventureSlug: string): Logger {
  if (!ventureLoggers.has(ventureId)) {
    ventureLoggers.set(
      ventureId,
      createLogger({ venture: ventureSlug, ventureId })
    );
  }
  return ventureLoggers.get(ventureId)!;
}
```

### Log Shipping Configuration

In production, logs are shipped to external services for aggregation and alerting:

```typescript
// @mcv/kernel/logger/transport.ts
import { config } from '../config';

/**
 * Production log transport configuration.
 * Pino transports run in a worker thread for zero-impact on the main event loop.
 *
 * Configure via environment variables:
 * - LOG_TRANSPORT=loki|datadog|cloudwatch|stdout
 * - LOG_TRANSPORT_URL=https://loki.example.com/loki/api/v1/push
 * - LOG_TRANSPORT_AUTH=<token>
 */
export function getTransportConfig(): import('pino').TransportMultiOptions | undefined {
  if (config.NODE_ENV !== 'production') return undefined;

  return {
    targets: [
      // Always write to stdout (container log collection)
      { target: 'pino/file', options: { destination: 1 }, level: 'info' },

      // Optional: Ship to Grafana Loki
      ...(process.env.LOG_TRANSPORT === 'loki'
        ? [
            {
              target: 'pino-loki',
              options: {
                host: process.env.LOG_TRANSPORT_URL,
                batching: true,
                interval: 5,
                labels: { app: 'mcv-one', env: config.NODE_ENV },
              },
              level: 'info' as const,
            },
          ]
        : []),
    ],
  };
}
```

### Logger Usage Examples

```typescript
import { logger, createLogger } from '@mcv/kernel';

// ── Basic logging ──
logger.info('Server started on port 3000');
logger.info({ port: 3000, env: 'production' }, 'Server started');

// ── Structured data ──
logger.info({ userId, action: 'login', ip: req.ip }, 'User logged in');
logger.warn({ attemptCount: 3, endpoint: '/api/auth' }, 'Rate limit approaching');

// ── Error logging (always pass err as object field) ──
logger.error({ err, requestId, userId }, 'Failed to process payment');
logger.fatal({ err }, 'Database connection lost — shutting down');

// ── Module-scoped logger ──
const log = createLogger({ module: 'billing' });
log.info({ invoiceId }, 'Invoice generated');   // includes module: 'billing'
log.error({ err, invoiceId }, 'Invoice generation failed');

// ── Context-aware logging (inside withContext) ──
const ctx = getContext();
ctx.log.info({ postId }, 'Post created');
// Output: { level: "info", requestId: "req_abc123", ventureId: "...", userId: "...", postId: "..." }

// ── Timing ──
const start = performance.now();
await heavyOperation();
logger.info({ durationMs: Math.round(performance.now() - start) }, 'Heavy operation completed');
```

---

## Submodule: types

### Purpose

Shared TypeScript type definitions used across every package in the monorepo. Provides **branded types** for type-safe ID handling, **utility types** for common patterns, **Zod schema primitives** for validation, and **entity interfaces** that mirror the database schema.

### Branded Types

Branded types prevent accidental mixing of different ID types. A `VentureID` cannot be passed where a `UserID` is expected, even though both are strings at runtime:

```typescript
// @mcv/kernel/types/core.ts

/**
 * Brand utility — creates a nominal type from a structural type.
 * The brand exists only at compile time; zero runtime overhead.
 */
declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

// ── ID Types ────────────────────────────────────────
export type UUID = Brand<string, 'UUID'>;
export type VentureID = Brand<UUID, 'VentureID'>;
export type UserID = Brand<UUID, 'UserID'>;
export type OrganizationID = Brand<UUID, 'OrganizationID'>;
export type SessionID = Brand<UUID, 'SessionID'>;
export type RequestID = Brand<string, 'RequestID'>;

// ── Timestamp Types ─────────────────────────────────
export type ISOTimestamp = Brand<string, 'ISOTimestamp'>;
export type UnixTimestamp = Brand<number, 'UnixTimestamp'>;

// ── String Types ────────────────────────────────────
export type Email = Brand<string, 'Email'>;
export type Slug = Brand<string, 'Slug'>;
export type URL = Brand<string, 'URL'>;

/**
 * Type guard / cast functions.
 * Use these to convert raw strings into branded types after validation.
 */
export function asUUID(value: string): UUID {
  return value as UUID;
}

export function asVentureID(value: string): VentureID {
  return value as unknown as VentureID;
}

export function asUserID(value: string): UserID {
  return value as unknown as UserID;
}

export function asISOTimestamp(value: string): ISOTimestamp {
  return value as ISOTimestamp;
}
```

### JSON Types

```typescript
// @mcv/kernel/types/json.ts

/** JSON-compatible primitive values. */
export type JSONPrimitive = string | number | boolean | null;

/** Any valid JSON value. */
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

/** A JSON object (string-keyed). */
export type JSONObject = { [key: string]: JSONValue };

/** A JSON array. */
export type JSONArray = JSONValue[];

/**
 * Deep-readonly version of a JSON value.
 * Prevents accidental mutation of parsed JSON.
 */
export type ReadonlyJSONValue =
  | JSONPrimitive
  | ReadonlyJSONObject
  | ReadonlyJSONArray;
export type ReadonlyJSONObject = { readonly [key: string]: ReadonlyJSONValue };
export type ReadonlyJSONArray = readonly ReadonlyJSONValue[];
```

### Utility Types

```typescript
// @mcv/kernel/types/utility.ts

/** T or null. */
export type Nullable<T> = T | null;

/** T or undefined. */
export type Optional<T> = T | undefined;

/** T, null, or undefined. */
export type Maybe<T> = T | null | undefined;

/** Make specific keys required. */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Make specific keys optional. */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make all properties deeply partial. */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Make all properties deeply required. */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/** Make all properties deeply readonly. */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** Extract the resolved type of a Promise. */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/** A function that returns a value or a Promise of that value. */
export type MaybeAsync<T> = T | Promise<T>;

/** Dictionary type — Record with string keys. */
export type Dict<T = unknown> = Record<string, T>;
```

### Pagination Types

```typescript
// @mcv/kernel/types/pagination.ts

/** Pagination input parameters. */
export interface PaginationParams {
  /** Page number (1-indexed). */
  page: number;
  /** Items per page. */
  limit: number;
  /** Cursor for cursor-based pagination (alternative to page). */
  cursor?: string;
  /** Sort field. */
  sortBy?: string;
  /** Sort direction. */
  sortOrder?: 'asc' | 'desc';
}

/** Paginated result wrapper. */
export interface PaginatedResult<T> {
  /** The page of data. */
  data: T[];
  /** Pagination metadata. */
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

/** Default pagination values. */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
```

### API Response Types

```typescript
// @mcv/kernel/types/api.ts
import type { RequestID, ISOTimestamp } from './core';

/** Standard API success response. */
export interface APIResponse<T> {
  success: true;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    durationMs: number;
  };
}

/** Standard API error response. */
export interface APIErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/** Union of success and error responses. */
export type APIResult<T> = APIResponse<T> | APIErrorResponse;
```

### Entity Types

```typescript
// @mcv/kernel/types/entities.ts
import type { UUID, VentureID, UserID, ISOTimestamp } from './core';

/**
 * Base entity interface — mirrors the `baseColumns` in db/base.ts.
 * Every domain entity extends this.
 */
export interface BaseEntity {
  id: UUID;
  ventureId: VentureID;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  createdBy: UserID | null;
  updatedBy: UserID | null;
  deletedAt: ISOTimestamp | null;
}

/** Audit trail fields. */
export interface AuditFields {
  createdAt: ISOTimestamp;
  createdBy: UserID | null;
  updatedAt: ISOTimestamp;
  updatedBy: UserID | null;
}

/** Soft-delete support. */
export interface SoftDeletable {
  deletedAt: ISOTimestamp | null;
}

/**
 * Input type for creating an entity.
 * Omits auto-generated fields (id, timestamps, audit).
 */
export type CreateEntity<T extends BaseEntity> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deletedAt'
>;

/**
 * Input type for updating an entity.
 * Partial, and omits immutable fields (id, ventureId, createdAt).
 */
export type UpdateEntity<T extends BaseEntity> = Partial<
  Omit<T, 'id' | 'ventureId' | 'createdAt' | 'createdBy'>
>;

/**
 * Type for a "listed" entity — typically fewer fields than the full entity.
 * Define per-entity as needed.
 */
export type ListEntity<T extends BaseEntity, K extends keyof T> = Pick<T, K | 'id' | 'ventureId' | 'createdAt'>;
```

### Zod Schema Primitives

```typescript
// @mcv/kernel/types/schemas.ts
import { z } from 'zod';

/** Reusable Zod schemas for common field types. */
export const zodSchemas = {
  uuid: z.string().uuid(),
  email: z.string().email().toLowerCase().trim(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  url: z.string().url(),
  isoTimestamp: z.string().datetime(),
  positiveInt: z.number().int().positive(),
  nonNegativeInt: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
  currency: z.enum(['USD', 'CAD', 'EUR', 'GBP', 'EDGE']),
  locale: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),

  /** Pagination input schema. */
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    cursor: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
} as const;
```

---

## Submodule: utils

### Purpose

Common utility functions used across all packages. Organized by domain: date/time, string manipulation, currency math, crypto helpers, retry logic, and pagination.

### Date & Time Utilities

```typescript
// @mcv/kernel/utils/date.ts
import {
  formatISO,
  parseISO,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  addHours,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
  isEqual,
} from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/** Format a date in a specific timezone. */
export function formatDate(date: Date, format = 'yyyy-MM-dd', timezone = 'UTC'): string {
  return formatInTimeZone(date, timezone, format);
}

/** Format a full datetime with timezone. */
export function formatDateTime(date: Date, timezone = 'UTC'): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/** Parse an ISO date string to a Date object. */
export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}

/** Get the number of days between two dates. */
export function daysBetween(start: Date, end: Date): number {
  return differenceInDays(end, start);
}

/** Get start and end of a day (useful for date-range queries). */
export function getDateRange(date: Date): { start: Date; end: Date } {
  return { start: startOfDay(date), end: endOfDay(date) };
}

/** Get start and end of a month. */
export function getMonthRange(date: Date): { start: Date; end: Date } {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

/** Add days to a date. */
export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

/** Add hours to a date. */
export function addHoursToDate(date: Date, hours: number): Date {
  return addHours(date, hours);
}

/** Get a human-readable relative time string. */
export function timeAgo(date: Date): string {
  const now = new Date();
  const minutes = differenceInMinutes(now, date);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours}h ago`;

  const days = differenceInDays(now, date);
  if (days < 30) return `${days}d ago`;

  return formatDate(date);
}

/** Check if a date is in the past. */
export function isPast(date: Date): boolean {
  return isBefore(date, new Date());
}

/** Check if a date is in the future. */
export function isFuture(date: Date): boolean {
  return isAfter(date, new Date());
}

/** Get the current ISO timestamp string. */
export function now(): string {
  return new Date().toISOString();
}
```

### String Utilities

```typescript
// @mcv/kernel/utils/string.ts
import slugifyLib from 'slugify';
import { customAlphabet } from 'nanoid';

// ── Slug Generation ─────────────────────────────────

/** Convert a string to a URL-safe slug. */
export function slugify(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

// ── ID Generation ───────────────────────────────────

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);
const shortId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

/**
 * Generate a unique ID with optional prefix.
 * @example generateId('req')  → 'req_a1b2c3d4e5f6'
 * @example generateId()       → 'a1b2c3d4e5f6'
 */
export function generateId(prefix?: string): string {
  const id = nanoid();
  return prefix ? `${prefix}_${id}` : id;
}

/** Generate a short human-readable code (8 chars, alphanumeric). */
export function generateShortCode(): string {
  return shortId();
}

// ── String Manipulation ─────────────────────────────

/** Truncate a string with an ellipsis suffix. */
export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/** Capitalize the first letter. */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Convert to Title Case. */
export function titleCase(str: string): string {
  return str.split(' ').map(capitalize).join(' ');
}

/** Convert camelCase to kebab-case. */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** Convert kebab-case to camelCase. */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// ── Masking (PII Protection) ────────────────────────

/** Mask an email address for display. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal = local.slice(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
}

/** Mask a phone number for display. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `***-***-${digits.slice(-4)}`;
}

/** Mask a credit card number. */
export function maskCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  return `****-****-****-${digits.slice(-4)}`;
}

// ── Comparison ──────────────────────────────────────

/** Case-insensitive string equality. */
export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** Check if a string is empty or only whitespace. */
export function isBlank(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}
```

### Currency Utilities

```typescript
// @mcv/kernel/utils/currency.ts
import Decimal from 'decimal.js';

export type Currency = 'USD' | 'CAD' | 'EUR' | 'GBP' | 'EDGE';

const currencyConfig: Record<Currency, { decimals: number; symbol: string; name: string }> = {
  USD:  { decimals: 2, symbol: '$',    name: 'US Dollar' },
  CAD:  { decimals: 2, symbol: 'C$',   name: 'Canadian Dollar' },
  EUR:  { decimals: 2, symbol: '€',    name: 'Euro' },
  GBP:  { decimals: 2, symbol: '£',    name: 'British Pound' },
  EDGE: { decimals: 9, symbol: 'EDGE', name: 'Edge Token' },
};

/** Format a numeric amount as a currency string. */
export function formatCurrency(amount: number | string, currency: Currency = 'USD'): string {
  const cfg = currencyConfig[currency];
  const formatted = new Decimal(amount).toFixed(cfg.decimals);

  if (currency === 'EDGE') {
    return `${formatted} ${cfg.symbol}`;
  }

  return `${cfg.symbol}${formatted}`;
}

/** Parse a currency string back to a number. */
export function parseCurrency(value: string): number {
  return new Decimal(value.replace(/[^0-9.-]/g, '')).toNumber();
}

/** Add two currency amounts with Decimal precision. */
export function addCurrency(a: number | string, b: number | string): string {
  return new Decimal(a).plus(new Decimal(b)).toString();
}

/** Subtract two currency amounts. */
export function subtractCurrency(a: number | string, b: number | string): string {
  return new Decimal(a).minus(new Decimal(b)).toString();
}

/** Multiply an amount by a factor. */
export function multiplyCurrency(amount: number | string, multiplier: number): string {
  return new Decimal(amount).times(multiplier).toString();
}

/** Compare two amounts. Returns -1, 0, or 1. */
export function compareCurrency(a: number | string, b: number | string): -1 | 0 | 1 {
  return new Decimal(a).comparedTo(new Decimal(b)) as -1 | 0 | 1;
}

/** Check if an amount is zero. */
export function isZero(amount: number | string): boolean {
  return new Decimal(amount).isZero();
}

/** Check if an amount is positive. */
export function isPositive(amount: number | string): boolean {
  return new Decimal(amount).isPositive() && !new Decimal(amount).isZero();
}
```

### Crypto Utilities

```typescript
// @mcv/kernel/utils/crypto.ts
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/** Generate a cryptographically secure random hex string. */
export function randomHex(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/** Generate a random base64url string (URL-safe). */
export function randomBase64Url(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** SHA-256 hash of a string. */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** SHA-512 hash of a string. */
export function sha512(input: string): string {
  return createHash('sha512').update(input).digest('hex');
}

/**
 * Timing-safe string comparison.
 * Prevents timing attacks when comparing secrets/tokens.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Generate a random token suitable for API keys, reset tokens, etc. */
export function generateToken(prefix?: string): string {
  const token = randomBase64Url(32);
  return prefix ? `${prefix}_${token}` : token;
}
```

### Retry Logic

```typescript
// @mcv/kernel/utils/retry.ts
import { logger } from '../logger';

export interface RetryOptions {
  /** Maximum number of attempts (default: 3). */
  maxAttempts?: number;
  /** Base delay in milliseconds (default: 1000). */
  baseDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000). */
  maxDelayMs?: number;
  /** Exponential backoff factor (default: 2). */
  backoffFactor?: number;
  /** Add random jitter to prevent thundering herd (default: true). */
  jitter?: boolean;
  /** Optional predicate — only retry if this returns true. */
  retryIf?: (error: unknown) => boolean;
  /** Called before each retry attempt. */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

/**
 * Retry an async function with exponential backoff.
 *
 * @example
 * const result = await retry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxAttempts: 5, baseDelayMs: 500 }
 * );
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30_000,
    backoffFactor = 2,
    jitter = true,
    retryIf,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (retryIf && !retryIf(error)) {
        throw error;
      }

      // Last attempt — don't delay, just throw
      if (attempt === maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(
        baseDelayMs * Math.pow(backoffFactor, attempt - 1),
        maxDelayMs
      );

      // Add jitter (±25%)
      if (jitter) {
        const jitterRange = delay * 0.25;
        delay += Math.random() * jitterRange * 2 - jitterRange;
      }

      delay = Math.round(delay);

      // Notify
      if (onRetry) {
        onRetry(error, attempt, delay);
      } else {
        logger.warn(
          { err: error, attempt, maxAttempts, delayMs: delay },
          `Retry attempt ${attempt}/${maxAttempts}`
        );
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/** Sleep for a specified number of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### Pagination Helpers

```typescript
// @mcv/kernel/utils/pagination.ts
import type { PaginationParams, PaginatedResult } from '../types/pagination';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '../types/pagination';

/**
 * Normalize pagination params with safe defaults and limits.
 */
export function normalizePagination(params?: Partial<PaginationParams>): PaginationParams {
  return {
    page: Math.max(params?.page ?? DEFAULT_PAGE, 1),
    limit: Math.min(Math.max(params?.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT),
    cursor: params?.cursor,
    sortBy: params?.sortBy,
    sortOrder: params?.sortOrder ?? 'desc',
  };
}

/**
 * Calculate SQL offset from page and limit.
 */
export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Build a PaginatedResult from query results and total count.
 */
export function paginate<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * Build a cursor-based PaginatedResult.
 */
export function paginateCursor<T extends { id: string }>(
  data: T[],
  limit: number,
  hasMore: boolean
): PaginatedResult<T> {
  return {
    data,
    pagination: {
      page: 0,  // Not applicable for cursor pagination
      limit,
      total: -1, // Unknown in cursor pagination
      totalPages: -1,
      hasNext: hasMore,
      hasPrev: false,
      nextCursor: hasMore && data.length > 0 ? data[data.length - 1].id : undefined,
    },
  };
}
```

### Validation Utilities

```typescript
// @mcv/kernel/utils/validation.ts
import { z } from 'zod';

// ── Common Zod Schemas ──────────────────────────────
export const emailSchema = z.string().email();
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
export const uuidSchema = z.string().uuid();
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

// ── Validation Helpers ──────────────────────────────
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function isValidUUID(uuid: string): boolean {
  return uuidSchema.safeParse(uuid).success;
}

export function isValidSlug(slug: string): boolean {
  return slugSchema.safeParse(slug).success;
}

export function isValidPhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

// ── Sanitization ────────────────────────────────────

/** Strip HTML tags from a string. */
export function sanitizeHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/** Normalize whitespace (collapse multiple spaces, trim). */
export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

/** Remove non-printable characters. */
export function sanitizeString(str: string): string {
  return str.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim();
}
```

---

## Cross-Module Integration

The true power of kernel is how its submodules compose together. Here's how a typical request flows through the system:

### Request Lifecycle

```
  1. HTTP Request Arrives
         │
         ▼
  ┌─────────────────────────────────────────────────────────┐
  │  2. CONTEXT MIDDLEWARE                                    │
  │  • Resolves venture from hostname  ─── config (defaults) │
  │  • Extracts user from JWT          ─── types (UserID)    │
  │  • Creates MCVContext               ─── context           │
  │  • Creates request logger           ─── logger            │
  │  • Wraps handler in withContext()                          │
  └─────────────────────────────────────────────────────────┘
         │
         ▼
  ┌─────────────────────────────────────────────────────────┐
  │  3. RLS MIDDLEWARE                                        │
  │  • Sets PostgreSQL session vars    ─── db (RLS helpers)   │
  │  • venture_id from context          ─── context           │
  └─────────────────────────────────────────────────────────┘
         │
         ▼
  ┌─────────────────────────────────────────────────────────┐
  │  4. APPLICATION HANDLER                                   │
  │  • Validates input                 ─── types (Zod schemas)│
  │  • Queries database                ─── db (Drizzle)       │
  │  • Logs actions                    ─── logger (ctx.log)   │
  │  • Checks permissions              ─── context (hasRole)  │
  │  • Throws typed errors             ─── errors             │
  │  • Uses utilities                  ─── utils              │
  └─────────────────────────────────────────────────────────┘
         │
         ▼
  ┌─────────────────────────────────────────────────────────┐
  │  5. ERROR HANDLER (on failure)                            │
  │  • Catches MCVError                ─── errors             │
  │  • Logs with context               ─── logger + context   │
  │  • Serializes to API response      ─── types (APIResponse)│
  └─────────────────────────────────────────────────────────┘
         │
         ▼
  ┌─────────────────────────────────────────────────────────┐
  │  6. RESPONSE                                              │
  │  • Structured JSON response        ─── types              │
  │  • Includes requestId              ─── context            │
  │  • Correct HTTP status             ─── errors             │
  └─────────────────────────────────────────────────────────┘
```

### Integration Example: Creating an Entity

This example shows all 7 submodules working together in a single operation:

```typescript
import {
  // context
  getContext, requireAuth, requirePermission,
  // db
  db, withTransaction,
  // errors
  NotFoundError, ValidationError, ConflictError,
  // logger (via context)
  // types
  type CreateEntity, type PaginatedResult,
  // utils
  slugify, generateId, now,
  // config (via getVentureConfig)
} from '@mcv/kernel';
import { getVentureConfig } from '@mcv/kernel/config/dynamic';
import { z } from 'zod';

// ── Input validation (types + utils) ──
const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  budget: z.number().positive().optional(),
});

type CreateProjectInput = z.infer<typeof createProjectSchema>;

export async function createProject(rawInput: unknown) {
  // 1. AUTH: Check context & permissions
  const ctx = requirePermission('projects.create');

  // 2. VALIDATE: Parse input with Zod
  const result = createProjectSchema.safeParse(rawInput);
  if (!result.success) {
    throw ValidationError.fromZodError(result.error);
  }
  const input = result.data;

  // 3. CONFIG: Check venture-specific limits
  const maxProjects = await getVentureConfig(
    ctx.venture.id,
    'MAX_PROJECTS',
    100
  );

  const currentCount = await db.query.projects.findMany({
    where: (p, { eq }) => eq(p.ventureId, ctx.venture.id),
  });

  if (currentCount.length >= maxProjects) {
    throw new ConflictError(`Project limit (${maxProjects}) reached for this venture`);
  }

  // 4. UTILS: Generate slug
  const slug = slugify(input.name);

  // 5. DB: Insert in a transaction
  const project = await withTransaction(async (tx) => {
    // Check slug uniqueness
    const existing = await tx.query.projects.findFirst({
      where: (p, { eq, and }) =>
        and(eq(p.ventureId, ctx.venture.id), eq(p.slug, slug)),
    });

    if (existing) {
      throw new ConflictError(`Project with slug '${slug}' already exists`, 'slug');
    }

    const [created] = await tx
      .insert(projects)
      .values({
        name: input.name,
        slug,
        description: input.description ?? null,
        budget: input.budget ?? null,
        ventureId: ctx.venture.id,
        createdBy: ctx.user.id,
        updatedBy: ctx.user.id,
      })
      .returning();

    return created;
  });

  // 6. LOGGER: Log success with context
  ctx.log.info(
    { projectId: project.id, slug, ventureId: ctx.venture.id },
    'Project created'
  );

  return project;
}
```

### How Submodules Reference Each Other

| From → To | What Flows | Example |
|-----------|-----------|---------|
| **context → db** | `venture.id` sets RLS session variable | `setRLSContext()` reads `getContext().venture.id` |
| **context → logger** | `requestId`, `ventureId`, `userId` | `ctx.log` is a child logger with correlation IDs |
| **context → errors** | Permission checks throw `UnauthorizedError` | `requirePermission()` uses errors submodule |
| **config → db** | `DATABASE_URL`, pool size | `db/client.ts` reads `config.DATABASE_URL` |
| **config → logger** | `LOG_LEVEL`, `LOG_FORMAT` | Logger configures based on config values |
| **errors → logger** | Errors are logged when handled | `handleError()` calls `logger.error()` |
| **types → everywhere** | Branded IDs, entity types, API types | Every submodule imports from `types/` |
| **utils → everywhere** | `generateId`, `slugify`, `retry` | Used in context, db, and application code |

---

## Key Interfaces & Types

Complete reference of the primary TypeScript interfaces exported by kernel:

```typescript
// ═══════════════════════════════════════════════════════
// BRANDED TYPES
// ═══════════════════════════════════════════════════════

type UUID          = Brand<string, 'UUID'>;
type VentureID     = Brand<UUID, 'VentureID'>;
type UserID        = Brand<UUID, 'UserID'>;
type OrganizationID = Brand<UUID, 'OrganizationID'>;
type SessionID     = Brand<UUID, 'SessionID'>;
type RequestID     = Brand<string, 'RequestID'>;
type ISOTimestamp  = Brand<string, 'ISOTimestamp'>;
type UnixTimestamp = Brand<number, 'UnixTimestamp'>;
type Email         = Brand<string, 'Email'>;
type Slug          = Brand<string, 'Slug'>;

// ═══════════════════════════════════════════════════════
// CONTEXT INTERFACES
// ═══════════════════════════════════════════════════════

interface MCVContext {
  requestId: UUID;
  timestamp: Date;
  source: 'http' | 'trpc' | 'websocket' | 'cron' | 'queue' | 'internal';
  user: MCVUser | null;
  isAuthenticated: boolean;
  venture: MCVVenture;
  organization: MCVOrganization | null;
  hasPermission(permission: string): boolean;
  hasRole(role: string): boolean;
  hasAnyRole(roles: string[]): boolean;
  hasAllRoles(roles: string[]): boolean;
  child(overrides: Partial<MCVContext>): MCVContext;
  log: import('pino').Logger;
}

interface MCVUser {
  id: UserID;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, unknown>;
}

interface MCVVenture {
  id: VentureID;
  slug: string;
  name: string;
  domain: string;
  settings: Record<string, unknown>;
}

interface MCVOrganization {
  id: OrganizationID;
  name: string;
  ventureId: VentureID;
}

// ═══════════════════════════════════════════════════════
// ENTITY INTERFACES
// ═══════════════════════════════════════════════════════

interface BaseEntity {
  id: UUID;
  ventureId: VentureID;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  createdBy: UserID | null;
  updatedBy: UserID | null;
  deletedAt: ISOTimestamp | null;
}

type CreateEntity<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deletedAt'>;
type UpdateEntity<T extends BaseEntity> = Partial<Omit<T, 'id' | 'ventureId' | 'createdAt' | 'createdBy'>>;

// ═══════════════════════════════════════════════════════
// API RESPONSE INTERFACES
// ═══════════════════════════════════════════════════════

interface APIResponse<T> {
  success: true;
  data: T;
  meta?: { requestId: string; timestamp: string; durationMs: number };
}

interface APIErrorResponse {
  success: false;
  error: { code: number; message: string; details?: unknown; requestId?: string };
}

// ═══════════════════════════════════════════════════════
// PAGINATION INTERFACES
// ═══════════════════════════════════════════════════════

interface PaginationParams {
  page: number;
  limit: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
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

// ═══════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════

class MCVError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, unknown>;
  cause?: Error;
  isOperational: boolean;
  timestamp: string;
  toJSON(): Record<string, unknown>;
}

// Specialized errors:
class NotFoundError extends MCVError { }
class ValidationError extends MCVError {
  static fromZodError(error: ZodError): ValidationError;
}
class UnauthorizedError extends MCVError { }
class UnauthenticatedError extends MCVError { }
class ConflictError extends MCVError { }
class BusinessRuleError extends MCVError { }
class ExternalServiceError extends MCVError { }
class DatabaseError extends MCVError { }

// ═══════════════════════════════════════════════════════
// CONFIG TYPE
// ═══════════════════════════════════════════════════════

interface Config {
  NODE_ENV: 'development' | 'staging' | 'production';
  DATABASE_URL: string;
  DATABASE_POOL_SIZE: number;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  REDIS_URL?: string;
  LOG_LEVEL: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  LOG_FORMAT: 'json' | 'pretty';
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  ENABLE_DEBUG_MODE: boolean;
  ENABLE_TELEMETRY: boolean;
  // ... (see full schema in config submodule)
}
```

---

## Database Schema

Kernel manages the foundational tables that other packages reference. These are the **core system tables**:

### ventures

The root tenant table. Every row in every other table references a venture.

```sql
CREATE TABLE ventures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  domain        TEXT NOT NULL UNIQUE,
  settings      JSONB NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'suspended', 'archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_ventures_slug ON ventures(slug);
CREATE INDEX idx_ventures_domain ON ventures(domain);
```

### venture_config

Per-venture configuration overrides (Layer 3 of the config hierarchy).

```sql
CREATE TABLE venture_config (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id    UUID NOT NULL REFERENCES ventures(id),
  key           TEXT NOT NULL,
  value         JSONB NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(venture_id, key)
);

CREATE INDEX idx_venture_config_venture ON venture_config(venture_id);
```

### system_migrations

Tracks applied migrations (managed by Drizzle).

```sql
-- Managed automatically by drizzle-orm
CREATE TABLE drizzle.__drizzle_migrations (
  id            SERIAL PRIMARY KEY,
  hash          TEXT NOT NULL,
  created_at    BIGINT
);
```

### Drizzle Schema Definitions

```typescript
// @mcv/kernel/db/schema/ventures.ts
import { pgTable, uuid, text, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const ventures = pgTable('ventures', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  domain: text('domain').notNull().unique(),
  settings: jsonb('settings').notNull().default({}),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  slugIdx: uniqueIndex('idx_ventures_slug').on(table.slug),
  domainIdx: uniqueIndex('idx_ventures_domain').on(table.domain),
}));

export const ventureConfig = pgTable('venture_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  key: text('key').notNull(),
  value: jsonb('value').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureKeyIdx: uniqueIndex('idx_venture_config_unique').on(table.ventureId, table.key),
  ventureIdx: index('idx_venture_config_venture').on(table.ventureId),
}));
```

---

## Configuration Reference

### Required Environment Variables

| Variable | Type | Description |
|----------|------|-------------|
| `DATABASE_URL` | `string (URL)` | PostgreSQL connection string |
| `SUPABASE_URL` | `string (URL)` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `string` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_KEY` | `string` | Supabase service role key (server-side only) |
| `JWT_SECRET` | `string (≥32 chars)` | Secret for JWT signing/verification |
| `ENCRYPTION_KEY` | `string (64 hex chars)` | AES-256 encryption key (32 bytes hex-encoded) |

### Optional Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | `enum` | `development` | `development` / `staging` / `production` |
| `DATABASE_POOL_SIZE` | `number` | `20` | Max PostgreSQL connections (1–100) |
| `DATABASE_IDLE_TIMEOUT` | `number` | `20` | Close idle connections after N seconds |
| `DATABASE_CONNECT_TIMEOUT` | `number` | `10` | Connection timeout in seconds |
| `REDIS_URL` | `string (URL)` | — | Redis connection string (optional) |
| `REDIS_POOL_SIZE` | `number` | `10` | Max Redis connections (1–50) |
| `LOG_LEVEL` | `enum` | `info` | `trace` / `debug` / `info` / `warn` / `error` / `fatal` |
| `LOG_FORMAT` | `enum` | `json` | `json` (production) / `pretty` (development) |
| `LOG_REDACT_PATHS` | `string` | `password,token,...` | Comma-separated paths to redact from logs |
| `ENABLE_DEBUG_MODE` | `boolean` | `false` | Enable debug endpoints and verbose output |
| `ENABLE_TELEMETRY` | `boolean` | `true` | Enable OpenTelemetry instrumentation |
| `ENABLE_QUERY_LOGGING` | `boolean` | `false` | Log all SQL queries at trace level |
| `DEFAULT_VENTURE_SLUG` | `string` | `mcv` | Fallback venture when none resolved |
| `DEFAULT_TIMEZONE` | `string` | `UTC` | Default timezone for date operations |
| `DEFAULT_LOCALE` | `string` | `en-US` | Default locale for formatting |
| `DEFAULT_CURRENCY` | `enum` | `USD` | Default currency (`USD`/`CAD`/`EUR`/`GBP`) |

### Example `.env` File

```bash
# ── Environment ──────────────────────────────────────
NODE_ENV=development

# ── Database ─────────────────────────────────────────
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/mcv_dev
DATABASE_POOL_SIZE=10

# ── Supabase ─────────────────────────────────────────
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Security ─────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# ── Logging ──────────────────────────────────────────
LOG_LEVEL=debug
LOG_FORMAT=pretty

# ── Feature Flags ────────────────────────────────────
ENABLE_DEBUG_MODE=true
ENABLE_QUERY_LOGGING=true
```

---

## Testing Patterns

### Test Utilities

Kernel provides helpers that make testing straightforward:

```typescript
// @mcv/kernel/testing/index.ts (exported for test files)
import { createContext, withContext } from '../context';
import type { MCVUser, MCVVenture } from '../context/types';

/**
 * Create a test venture for use in test suites.
 */
export function createTestVenture(overrides?: Partial<MCVVenture>): MCVVenture {
  return {
    id: 'test-venture-id' as any,
    slug: 'test-venture',
    name: 'Test Venture',
    domain: 'test.mcv.local',
    settings: {},
    ...overrides,
  };
}

/**
 * Create a test user for use in test suites.
 */
export function createTestUser(overrides?: Partial<MCVUser>): MCVUser {
  return {
    id: 'test-user-id' as any,
    email: 'test@example.com',
    name: 'Test User',
    roles: ['user'],
    permissions: [],
    ...overrides,
  };
}

/**
 * Run a function inside a test context.
 * Shorthand for creating context + wrapping in withContext.
 *
 * @example
 * await withTestContext(async () => {
 *   const ctx = getContext();
 *   expect(ctx.venture.slug).toBe('test-venture');
 * });
 */
export async function withTestContext<T>(
  fn: () => T | Promise<T>,
  options?: {
    user?: MCVUser | null;
    venture?: MCVVenture;
    permissions?: string[];
    roles?: string[];
  }
): Promise<T> {
  const user = options?.user !== undefined
    ? options.user
    : createTestUser({
        permissions: options?.permissions,
        roles: options?.roles,
      });

  const venture = options?.venture ?? createTestVenture();

  const ctx = createContext({ user, venture, source: 'internal' });
  return withContext(ctx, () => fn());
}
```

### Unit Test Examples

```typescript
// @mcv/kernel/__tests__/utils/string.test.ts
import { describe, it, expect } from 'vitest';
import { slugify, generateId, truncate, maskEmail, isBlank } from '../../utils/string';

describe('slugify', () => {
  it('converts text to URL-safe slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Test 123!')).toBe('test-123');
    expect(slugify('  Spaces  Everywhere  ')).toBe('spaces-everywhere');
    expect(slugify('CamelCase')).toBe('camelcase');
  });

  it('handles unicode characters', () => {
    expect(slugify('café résumé')).toBe('cafe-resume');
  });
});

describe('generateId', () => {
  it('generates a 12-character ID', () => {
    const id = generateId();
    expect(id).toHaveLength(12);
    expect(id).toMatch(/^[0-9a-z]+$/);
  });

  it('supports prefix', () => {
    const id = generateId('req');
    expect(id).toMatch(/^req_[0-9a-z]{12}$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()));
    expect(ids.size).toBe(1000);
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
  });

  it('leaves short strings unchanged', () => {
    expect(truncate('Hi', 10)).toBe('Hi');
  });
});

describe('maskEmail', () => {
  it('masks the local part of an email', () => {
    expect(maskEmail('john.doe@example.com')).toBe('jo***@example.com');
  });
});
```

```typescript
// @mcv/kernel/__tests__/utils/currency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, addCurrency, compareCurrency } from '../../utils/currency';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1234.56');
    expect(formatCurrency(0.1, 'USD')).toBe('$0.10');
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('formats EDGE with 9 decimals', () => {
    expect(formatCurrency(1.123456789, 'EDGE')).toBe('1.123456789 EDGE');
  });
});

describe('addCurrency', () => {
  it('adds without floating point errors', () => {
    expect(addCurrency(0.1, 0.2)).toBe('0.3');
    expect(addCurrency('100.50', '200.75')).toBe('301.25');
  });
});

describe('compareCurrency', () => {
  it('compares amounts correctly', () => {
    expect(compareCurrency(100, 200)).toBe(-1);
    expect(compareCurrency(200, 200)).toBe(0);
    expect(compareCurrency(300, 200)).toBe(1);
  });
});
```

```typescript
// @mcv/kernel/__tests__/context.test.ts
import { describe, it, expect } from 'vitest';
import { withTestContext, createTestUser, createTestVenture } from '../testing';
import { getContext, tryGetContext, requireAuth, requirePermission } from '../context';
import { UnauthorizedError } from '../errors';

describe('context', () => {
  it('provides context inside withContext', async () => {
    await withTestContext(() => {
      const ctx = getContext();
      expect(ctx.venture.slug).toBe('test-venture');
      expect(ctx.isAuthenticated).toBe(true);
      expect(ctx.user?.email).toBe('test@example.com');
    });
  });

  it('throws when accessed outside context', () => {
    expect(() => getContext()).toThrow('No execution context available');
  });

  it('returns null for tryGetContext outside context', () => {
    expect(tryGetContext()).toBeNull();
  });

  it('requireAuth throws for unauthenticated context', async () => {
    await withTestContext(
      () => {
        expect(() => requireAuth()).toThrow(UnauthorizedError);
      },
      { user: null }
    );
  });

  it('requirePermission checks permissions', async () => {
    await withTestContext(
      () => {
        expect(() => requirePermission('posts.create')).not.toThrow();
        expect(() => requirePermission('admin.delete')).toThrow(UnauthorizedError);
      },
      { permissions: ['posts.create', 'posts.read'] }
    );
  });

  it('hasRole checks user roles', async () => {
    await withTestContext(
      () => {
        const ctx = getContext();
        expect(ctx.hasRole('admin')).toBe(true);
        expect(ctx.hasRole('superadmin')).toBe(false);
        expect(ctx.hasAnyRole(['admin', 'superadmin'])).toBe(true);
        expect(ctx.hasAllRoles(['admin', 'user'])).toBe(true);
      },
      { roles: ['admin', 'user'] }
    );
  });
});
```

```typescript
// @mcv/kernel/__tests__/errors.test.ts
import { describe, it, expect } from 'vitest';
import {
  MCVError,
  ErrorCode,
  NotFoundError,
  ValidationError,
  handleError,
} from '../errors';

describe('MCVError', () => {
  it('creates error with correct properties', () => {
    const error = new MCVError('Something went wrong', ErrorCode.INTERNAL_ERROR);
    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBe(6001);
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it('serializes to JSON without stack trace', () => {
    const error = new MCVError('Test', ErrorCode.NOT_FOUND);
    const json = error.toJSON();
    expect(json).toHaveProperty('code', 3001);
    expect(json).toHaveProperty('message', 'Test');
    expect(json).not.toHaveProperty('stack');
  });
});

describe('NotFoundError', () => {
  it('formats message with resource and id', () => {
    const error = new NotFoundError('Post', 'abc-123');
    expect(error.message).toBe("Post with id 'abc-123' not found");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
  });
});

describe('ValidationError', () => {
  it('includes field-level errors', () => {
    const error = new ValidationError('Invalid input', {
      email: ['Invalid email format'],
      name: ['Required'],
    });
    expect(error.statusCode).toBe(400);
    expect(error.details?.fields).toHaveProperty('email');
  });
});

describe('handleError', () => {
  it('handles MCVError correctly', () => {
    const error = new NotFoundError('User', '123');
    const result = handleError(error);
    expect(result.statusCode).toBe(404);
    expect(result.body.success).toBe(false);
    expect(result.body.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('handles unknown errors as 500', () => {
    const result = handleError(new Error('oops'));
    expect(result.statusCode).toBe(500);
    expect(result.body.error.code).toBe(ErrorCode.INTERNAL_ERROR);
  });
});
```

```typescript
// @mcv/kernel/__tests__/utils/retry.test.ts
import { describe, it, expect, vi } from 'vitest';
import { retry, sleep } from '../../utils/retry';

describe('retry', () => {
  it('returns on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retry(fn, { maxAttempts: 3 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds eventually', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const result = await retry(fn, {
      maxAttempts: 3,
      baseDelayMs: 10,
      jitter: false,
    });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting all attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      retry(fn, { maxAttempts: 3, baseDelayMs: 10 })
    ).rejects.toThrow('always fails');

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('respects retryIf predicate', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fatal'));

    await expect(
      retry(fn, {
        maxAttempts: 5,
        baseDelayMs: 10,
        retryIf: () => false, // never retry
      })
    ).rejects.toThrow('fatal');

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

### Testing with Database

```typescript
// @mcv/kernel/__tests__/db.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, healthCheck, withTransaction, disconnect } from '../db';

describe('db', () => {
  afterAll(async () => {
    await disconnect();
  });

  it('passes health check', async () => {
    const result = await healthCheck();
    expect(result.ok).toBe(true);
    expect(result.latencyMs).toBeLessThan(1000);
  });

  it('supports transactions', async () => {
    const result = await withTransaction(async (tx) => {
      // Transaction will be automatically rolled back on error
      return 'transaction-result';
    });
    expect(result).toBe('transaction-result');
  });
});
```

### Vitest Configuration

```typescript
// vitest.config.ts (at @mcv/kernel root)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['**/!(*.test|*.spec).ts'],
      exclude: ['__tests__/**', 'node_modules/**', 'dist/**'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

```typescript
// vitest.setup.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
```

---

## Migration Guide

### From Version 0.x to 1.0

#### Breaking Changes

| Change | Migration |
|--------|-----------|
| `AppError` renamed to `MCVError` | Find/replace `AppError` → `MCVError` |
| `ErrorCodes` enum renamed to `ErrorCode` | Find/replace `ErrorCodes` → `ErrorCode` |
| Config loader now throws on invalid config | Ensure all required env vars are set before startup |
| `getContext()` throws instead of returning `undefined` | Use `tryGetContext()` where null is acceptable |
| `withContext` is now synchronous wrapper | Remove `await` from `withContext()` calls |
| Branded types added | Use `asVentureID()`, `asUserID()` cast functions for raw strings |

#### New Features in 1.0

- **4-layer config hierarchy** with venture-specific overrides
- **Runtime config overrides** via `setRuntimeConfig()`
- **`requireAuth()` and `requirePermission()`** context helpers
- **`retry()` utility** with exponential backoff
- **`ValidationError.fromZodError()`** for seamless Zod integration
- **Cursor-based pagination** alongside page-based
- **Crypto utilities** (SHA-256, timing-safe compare, token generation)
- **Context `source` field** for distinguishing HTTP vs cron vs queue
- **Request logger on context** (`ctx.log`)

#### Step-by-Step Migration

```bash
# 1. Update the dependency
pnpm update @mcv/kernel@^1.0.0

# 2. Run the codemod (if available)
npx @mcv/kernel-codemod@latest ./src

# 3. Fix remaining TypeScript errors
pnpm typecheck

# 4. Run tests
pnpm test
```

### Version Compatibility Matrix

| Kernel Version | Node.js | TypeScript | Drizzle ORM | Zod | Pino |
|---------------|---------|------------|-------------|-----|------|
| 1.0.x | ≥ 20.0 | ≥ 5.3 | 0.29.x | 3.22.x | 8.x |
| 0.9.x | ≥ 18.0 | ≥ 5.0 | 0.28.x | 3.21.x | 8.x |

---

## Dependencies

### External Dependencies

| Package | Version | Purpose | Size Impact |
|---------|---------|---------|-------------|
| `drizzle-orm` | ^0.29.x | Type-safe PostgreSQL ORM | ~150KB |
| `postgres` | ^3.4.x | PostgreSQL client (porsager/postgres) | ~80KB |
| `zod` | ^3.22.x | Schema validation and type inference | ~60KB |
| `pino` | ^8.x | High-performance structured logging | ~120KB |
| `pino-pretty` | ^10.x | Dev-only pretty log formatting | ~50KB (dev) |
| `date-fns` | ^3.x | Date manipulation utilities | ~30KB (tree-shaken) |
| `date-fns-tz` | ^2.x | Timezone-aware date operations | ~10KB |
| `decimal.js` | ^10.x | Arbitrary-precision decimal arithmetic | ~30KB |
| `nanoid` | ^5.x | Secure, URL-friendly unique ID generation | ~1KB |
| `slugify` | ^1.6.x | Unicode-safe slug generation | ~5KB |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.3.x | TypeScript compiler |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^1.x | Test runner |
| `@types/node` | ^20.x | Node.js type definitions |
| `tsup` | ^8.x | TypeScript bundler |

### Dependency Philosophy

- **Minimal footprint**: Every dependency is chosen for a reason. No "convenience" packages.
- **No duplicates**: If two packages solve the same problem, pick one. (e.g., `date-fns` only, not `dayjs` + `moment` + `date-fns`)
- **Tree-shakable**: All imports are specific, not wildcard. `import { format } from 'date-fns'` not `import * as dateFns`.
- **Security audits**: `pnpm audit` runs in CI. No known vulnerabilities allowed.

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [Package Specification](./01-PACKAGE-SPEC.md) | Original package specification |
| [db Module Details](./db/MODULE.md) | Deep dive into database submodule |
| [config Module Details](./config/MODULE.md) | Configuration management details |
| [logger Module Details](./logger/MODULE.md) | Logging submodule documentation |
| [errors Module Details](./errors/MODULE.md) | Error handling details |
| [utils Module Details](./utils/MODULE.md) | Utility functions documentation |
| [types Module Details](./types/MODULE.md) | Type definitions documentation |
| [context Module Details](./context/MODULE.md) | Execution context documentation |

---

<div align="center">

*@mcv/kernel — The Foundation Layer*

**Tier 0 · Every package depends on this · 7 submodules · Zero internal imports**

`config` · `context` · `db` · `errors` · `logger` · `types` · `utils`

</div>