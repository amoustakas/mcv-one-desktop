# Integration Patterns Guide

**Version**: 1.0 | **Date**: January 26, 2026

---

## Overview

This guide documents the standard integration patterns used in the MCV.ONE Super Admin platform. Follow these patterns when integrating internal packages, external services, or building new features.

---

## Table of Contents

1. [Package Integration](#package-integration)
2. [API Integration (tRPC)](#api-integration-trpc)
3. [Database Access Patterns](#database-access-patterns)
4. [External Service Integration](#external-service-integration)
5. [Event-Driven Patterns](#event-driven-patterns)
6. [Error Handling Patterns](#error-handling-patterns)

---

## Package Integration

### Internal Package Structure

The monorepo uses workspace packages for shared functionality:

```
packages/
├── @mcv/api          # tRPC routers and services
├── @mcv/db           # Database schema and client
├── @mcv/permissions  # MUMS permission system
├── @mcv/notifications# Notification delivery
├── @mcv/audit        # Audit logging
├── @mcv/tenants      # Multi-tenant support
├── @mcv/users        # User management
├── @mcv/storage      # File storage
├── @mcv/flags        # Feature flags
├── @mcv/activity     # Activity tracking
└── @mcv/tsconfig     # Shared TypeScript config
```

### Importing Packages

```typescript
// Always use the package name, not relative paths
import { db, schema } from '@mcv/db';
import { checkPermission } from '@mcv/permissions';
import { createAuditLog } from '@mcv/audit';

// Import specific exports for tree-shaking
import { userRouter } from '@mcv/api/routers';
import { createTRPCContext } from '@mcv/api/trpc';
```

### Package Export Patterns

Each package uses explicit exports in `package.json`:

```json
{
  "name": "@mcv/permissions",
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client/index.ts",
    "./server": "./src/server/index.ts",
    "./types": "./src/types/index.ts"
  }
}
```

---

## API Integration (tRPC)

### Router Structure

```typescript
// packages/api/src/routers/users.router.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc';
import { userService } from '../services/user.service';

export const usersRouter = createTRPCRouter({
  // List users (requires authentication)
  list: protectedProcedure
    .input(z.object({
      ventureSlug: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return userService.list({
        ventureSlug: input.ventureSlug ?? ctx.user.ventureSlug,
        page: input.page,
        limit: input.limit,
        requesterId: ctx.user.id,
      });
    }),

  // Create user (requires admin)
  create: adminProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(2),
      tier: z.number().min(1).max(3),
    }))
    .mutation(async ({ ctx, input }) => {
      return userService.create({
        ...input,
        createdBy: ctx.user.id,
      });
    }),
});
```

### Client-Side Usage

```typescript
// In React components
'use client';

import { api } from '@/lib/trpc/client';

export function UserList() {
  const { data, isLoading, error } = api.users.list.useQuery({
    page: 1,
    limit: 20,
  });

  const createUser = api.users.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      api.useUtils().users.list.invalidate();
    },
  });

  // ...
}
```

### Server-Side Usage

```typescript
// In Server Components or API routes
import { createCaller } from '@mcv/api';
import { createTRPCContext } from '@mcv/api/trpc';

export async function getUsers() {
  const ctx = await createTRPCContext({ headers: headers() });
  const caller = createCaller(ctx);

  return caller.users.list({ page: 1, limit: 20 });
}
```

---

## Database Access Patterns

### Direct Database Access

For server-side operations that don't go through tRPC:

```typescript
import { db } from '@mcv/db';
import { users, ventures } from '@mcv/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Simple query
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});

// Query with relations
const userWithVentures = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    ventureAccess: {
      with: {
        venture: true,
      },
    },
  },
});

// Insert with returning
const [newUser] = await db
  .insert(users)
  .values({
    email: 'user@example.com',
    name: 'New User',
  })
  .returning();

// Update
await db
  .update(users)
  .set({ name: 'Updated Name' })
  .where(eq(users.id, userId));

// Delete
await db
  .delete(users)
  .where(eq(users.id, userId));
```

### Transaction Pattern

```typescript
import { db } from '@mcv/db';

async function transferCredits(fromUserId: string, toUserId: string, amount: number) {
  await db.transaction(async (tx) => {
    // Deduct from sender
    await tx
      .update(wallets)
      .set({
        balance: sql`balance - ${amount}`,
      })
      .where(and(
        eq(wallets.userId, fromUserId),
        sql`balance >= ${amount}`
      ));

    // Add to recipient
    await tx
      .update(wallets)
      .set({
        balance: sql`balance + ${amount}`,
      })
      .where(eq(wallets.userId, toUserId));

    // Create audit log
    await tx.insert(auditLogs).values({
      action: 'credit_transfer',
      actorId: fromUserId,
      targetId: toUserId,
      metadata: { amount },
    });
  });
}
```

### Query Optimization

```typescript
// Use select() for specific columns
const emails = await db
  .select({ email: users.email })
  .from(users)
  .where(eq(users.ventureSlug, 'betedge'));

// Use limit and offset for pagination
const pageSize = 20;
const page = 1;

const paginatedUsers = await db
  .select()
  .from(users)
  .limit(pageSize)
  .offset((page - 1) * pageSize)
  .orderBy(desc(users.createdAt));

// Count for pagination
const [{ count }] = await db
  .select({ count: sql<number>`count(*)` })
  .from(users)
  .where(eq(users.ventureSlug, 'betedge'));
```

---

## External Service Integration

### OpenRouter (LLM Gateway)

```typescript
// src/lib/openrouter.ts
import { env } from '@/lib/env';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function createChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.NEXT_PUBLIC_APP_URL,
      'X-Title': 'MCV.ONE Super Admin',
    },
    body: JSON.stringify({
      model: options.model ?? env.OPENROUTER_DEFAULT_MODEL ?? 'anthropic/claude-3.5-sonnet',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter error: ${error.message}`);
  }

  return response.json();
}
```

### Supabase Storage

```typescript
// src/lib/storage.ts
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Buffer,
  options?: { contentType?: string; upsert?: boolean }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType,
      upsert: options?.upsert ?? false,
    });

  if (error) throw error;
  return data;
}

export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFile(bucket: string, paths: string[]) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths);

  if (error) throw error;
}
```

### Upstash Redis

```typescript
// src/lib/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache pattern
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 3600
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch and cache
  const data = await fetcher();
  await redis.set(key, data, { ex: ttlSeconds });
  return data;
}

// Cache invalidation pattern
export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

---

## Event-Driven Patterns

### Publishing Events

```typescript
// src/lib/events.ts
import { qstash } from '@/lib/qstash';

export type EventType =
  | 'user.created'
  | 'user.updated'
  | 'venture.created'
  | 'task.completed';

interface Event<T = unknown> {
  type: EventType;
  payload: T;
  timestamp: string;
  correlationId?: string;
}

export async function publishEvent<T>(type: EventType, payload: T, correlationId?: string) {
  const event: Event<T> = {
    type,
    payload,
    timestamp: new Date().toISOString(),
    correlationId,
  };

  // Publish to QStash for async processing
  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/events/handler`,
    body: event,
    retries: 3,
  });

  return event;
}
```

### Handling Events

```typescript
// src/app/api/events/handler/route.ts
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { handleUserCreated } from '@/lib/handlers/user';
import { handleTaskCompleted } from '@/lib/handlers/task';

async function handler(req: Request) {
  const event = await req.json();

  switch (event.type) {
    case 'user.created':
      await handleUserCreated(event.payload);
      break;
    case 'task.completed':
      await handleTaskCompleted(event.payload);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response('OK', { status: 200 });
}

export const POST = verifySignatureAppRouter(handler);
```

### Webhook Pattern

```typescript
// src/app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { env } from '@/lib/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed');
    return new Response('Invalid signature', { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
  }

  return new Response('OK', { status: 200 });
}
```

---

## Error Handling Patterns

### Service Layer Errors

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}
```

### tRPC Error Handling

```typescript
// In tRPC routers
import { TRPCError } from '@trpc/server';

export const usersRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const user = await userService.findById(input.id);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),
});
```

### Global Error Handler

```typescript
// src/app/api/[...trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@mcv/api';
import * as Sentry from '@sentry/nextjs';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError: ({ error, path }) => {
      console.error(`tRPC error on ${path}:`, error);

      if (error.code === 'INTERNAL_SERVER_ERROR') {
        Sentry.captureException(error);
      }
    },
  });

export { handler as GET, handler as POST };
```

---

## Best Practices

### DO

- Use TypeScript strict mode everywhere
- Validate all inputs with Zod schemas
- Use transactions for multi-step operations
- Log errors with context for debugging
- Use feature flags for gradual rollouts

### DON'T

- Access database directly from components
- Store secrets in code or git
- Ignore error handling in async operations
- Make blocking calls in server components
- Expose internal error details to clients

---

*MCV Global Consortium - Integration Patterns Guide*
