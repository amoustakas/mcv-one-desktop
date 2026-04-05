# Security Hardening Guide

**Version**: 1.0 | **Date**: January 26, 2026

---

## Overview

This guide provides security hardening procedures for the MCV.ONE Super Admin platform. It covers authentication, authorization, data protection, and operational security practices.

---

## Table of Contents

1. [Authentication Security](#authentication-security)
2. [Authorization & Access Control](#authorization--access-control)
3. [Data Protection](#data-protection)
4. [API Security](#api-security)
5. [Infrastructure Security](#infrastructure-security)
6. [Security Headers](#security-headers)
7. [Secrets Management](#secrets-management)
8. [Security Monitoring](#security-monitoring)

---

## Authentication Security

### Session Management

```typescript
// src/lib/auth/session.ts
import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours

interface SessionPayload {
  userId: string;
  tier: number;
  ventureSlug?: string;
  sessionId: string;
}

export async function createSession(payload: Omit<SessionPayload, 'sessionId'>) {
  const sessionId = nanoid(32);

  const token = await new SignJWT({ ...payload, sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .setJti(sessionId)
    .sign(JWT_SECRET);

  return { token, sessionId };
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
```

### Password Security

```typescript
// src/lib/auth/password.ts
import { hash, verify } from '@node-rs/argon2';

const HASH_OPTIONS = {
  memoryCost: 65536,    // 64 MB
  timeCost: 3,          // 3 iterations
  parallelism: 4,       // 4 threads
  outputLen: 32,        // 32 bytes output
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_OPTIONS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return verify(hash, password, HASH_OPTIONS);
}
```

### Password Requirements

```typescript
// src/lib/auth/validation.ts
import { z } from 'zod';

export const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Check against common passwords
const COMMON_PASSWORDS = new Set([
  'password123!',
  'admin123456!',
  // ... load from file
]);

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}
```

### Multi-Factor Authentication

```typescript
// src/lib/auth/mfa.ts
import * as OTPAuth from 'otpauth';

export function generateTOTPSecret(email: string) {
  const totp = new OTPAuth.TOTP({
    issuer: 'MCV.ONE',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

export function verifyTOTP(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });

  // Allow 1 period window for clock drift
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
```

### Brute Force Protection

```typescript
// src/lib/auth/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

// Login attempt limiter
export const loginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  prefix: 'ratelimit:login',
  analytics: true,
});

// IP-based limiter
export const ipRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 per hour
  prefix: 'ratelimit:ip',
});

export async function checkLoginAttempt(identifier: string, ip: string) {
  const [userLimit, ipLimit] = await Promise.all([
    loginRatelimit.limit(identifier),
    ipRatelimit.limit(ip),
  ]);

  if (!userLimit.success || !ipLimit.success) {
    const resetIn = Math.max(userLimit.reset, ipLimit.reset) - Date.now();
    throw new Error(`Too many login attempts. Try again in ${Math.ceil(resetIn / 60000)} minutes.`);
  }
}
```

---

## Authorization & Access Control

### Permission Checking

```typescript
// packages/permissions/src/server/check.ts
import { db } from '@mcv/db';
import { permissions, users } from '@mcv/db/schema';
import { eq, and, or, like } from 'drizzle-orm';

interface PermissionContext {
  userId: string;
  ventureSlug?: string;
}

export async function checkPermission(
  ctx: PermissionContext,
  requiredPermission: string
): Promise<boolean> {
  // Super admins (tier 0) have all permissions
  const user = await db.query.users.findFirst({
    where: eq(users.id, ctx.userId),
    columns: { tier: true },
  });

  if (user?.tier === 0) return true;

  // Check specific permission or wildcard
  const parts = requiredPermission.split('.');
  const wildcardPatterns = parts.map((_, i) =>
    [...parts.slice(0, i), '*'].join('.')
  );

  const userPermissions = await db.query.permissions.findMany({
    where: and(
      eq(permissions.userId, ctx.userId),
      ctx.ventureSlug
        ? or(
            eq(permissions.ventureSlug, ctx.ventureSlug),
            eq(permissions.ventureSlug, '*')
          )
        : undefined,
      or(
        eq(permissions.permission, requiredPermission),
        ...wildcardPatterns.map(p => like(permissions.permission, p))
      )
    ),
  });

  return userPermissions.length > 0;
}
```

### Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see themselves (unless super admin)
CREATE POLICY "Users view own profile" 
  ON users FOR SELECT 
  USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.tier = 0
    )
  );

-- Venture scoping
CREATE POLICY "Users view assigned ventures" 
  ON ventures FOR SELECT 
  USING (
    EXISTS ( 
      SELECT 1 FROM venture_users vu 
      WHERE vu.venture_slug = ventures.slug 
      AND vu.user_id = auth.uid()
    )
    OR EXISTS ( 
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.tier = 0 
    )
  );

-- Audit logs: write-only for users, read for admins
CREATE POLICY "Users can create audit logs" 
  ON audit_logs FOR INSERT 
  WITH CHECK (actor_id = auth.uid());

CREATE POLICY "Admins can read audit logs" 
  ON audit_logs FOR SELECT 
  USING (
    EXISTS ( 
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.tier <= 1 
    )
  );
```

### API Route Protection

```typescript
// packages/api/src/trpc/procedures.ts
import { TRPCError } from '@trpc/server';
import { checkPermission } from '@mcv/permissions/server';

export const protectedProcedure = t.procedure
  .use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
      ctx: { user: ctx.session.user },
    });
  });

export const adminProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    if (ctx.user.tier > 1) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next();
  });

export const withPermission = (permission: string) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const hasPermission = await checkPermission(
      { userId: ctx.user.id, ventureSlug: ctx.user.ventureSlug },
      permission
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing permission: ${permission}`,
      });
    }

    return next();
  });
```

---

## Data Protection

### Data Encryption at Rest

```typescript
// src/lib/crypto/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### PII Handling

```typescript
// src/lib/pii/masking.ts
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '***' + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function maskCreditCard(number: string): string {
  return '**** **** **** ' + number.slice(-4);
}

// Use in API responses
export function sanitizeUserForResponse(user: User) {
  return {
    ...user,
    email: maskEmail(user.email),
    phone: user.phone ? maskPhone(user.phone) : null,
    // Never return password hash
    passwordHash: undefined,
  };
}
```

### Secure Logging

```typescript
// src/lib/logger/sanitize.ts
const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'token',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'creditCard',
  'ssn',
];

export function sanitizeForLogging(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLogging);
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
```

---

## API Security

### Input Validation

```typescript
// All inputs must be validated with Zod
import { z } from 'zod';

// Strict string validation
const usernameSchema = z.string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid characters');

// URL validation
const urlSchema = z.string().url().refine(
  (url) => url.startsWith('https://'),
  'Must use HTTPS'
);

// File upload validation
const fileUploadSchema = z.object({
  name: z.string().max(255),
  type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
});
```

### CSRF Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip for GET/HEAD/OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return NextResponse.next();
  }

  // Verify origin for mutations
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (origin) {
    const originUrl = new URL(origin);
    if (originUrl.host !== host) {
      return new NextResponse('CSRF validation failed', { status: 403 });
    }
  }

  return NextResponse.next();
}
```

### Rate Limiting

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';

// Different limits for different endpoints
export const rateLimits = {
  // General API: 100 req/min
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'rl:api',
  }),

  // Auth endpoints: 10 req/min
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'rl:auth',
  }),

  // AI endpoints: 20 req/min
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: 'rl:ai',
  }),

  // Webhooks: 1000 req/min
  webhook: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'),
    prefix: 'rl:webhook',
  }),
};
```

---

## Infrastructure Security

### Environment Security

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  // ... other vars
});

// Validate on startup
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment variables:');
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;
```

### Database Connection Security

```typescript
// packages/db/src/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

// Enforce SSL in production
const sql = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql);
```

---

## Security Headers

### Next.js Configuration

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:"
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://openrouter.ai wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Secrets Management

### Secret Rotation Checklist

| Secret | Frequency | Impact | Procedure |
|--------|-----------|--------|-----------|
| `NEXTAUTH_SECRET` | On compromise only | Invalidates all sessions | Generate new, deploy, users re-login |
| `DATABASE_URL` | Quarterly | Brief downtime | Create new password, update env, deploy |
| `OPENROUTER_API_KEY` | Quarterly | None | Create new key, update, delete old |
| `STRIPE_SECRET_KEY` | Annually | None | Follow Stripe rotation |

### Accessing Secrets

```bash
# Never echo secrets
# Bad: echo $DATABASE_URL
# Good: Use Vercel CLI

# List all secrets
vercel env ls

# Add new secret
vercel env add SECRET_NAME production

# Pull to local (creates .env.local)
vercel env pull

# Remove secret
vercel env rm SECRET_NAME production
```

---

## Security Monitoring

### Audit Logging

```typescript
// packages/audit/src/log.ts
import { db } from '@mcv/db';
import { auditLogs } from '@mcv/db/schema';

interface AuditEntry {
  action: string;
  actorId: string;
  targetType?: string;
  targetId?: string;
  ventureSlug?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditEntry) {
  await db.insert(auditLogs).values({
    ...entry,
    timestamp: new Date(),
  });
}

// Usage
await createAuditLog({
  action: 'user.login',
  actorId: user.id,
  ip: request.ip,
  userAgent: request.headers.get('user-agent'),
});
```

### Security Alerts

```typescript
// src/lib/security/alerts.ts
import * as Sentry from '@sentry/nextjs';

export async function alertSecurityEvent(event: {
  type: 'brute_force' | 'privilege_escalation' | 'suspicious_activity';
  userId?: string;
  ip?: string;
  details: string;
}) {
  // Log to Sentry with security tag
  Sentry.captureMessage(`Security Alert: ${event.type}`, {
    level: 'warning',
    tags: { security: true },
    extra: event,
  });

  // Send to Slack
  await fetch(process.env.SLACK_SECURITY_WEBHOOK!, {
    method: 'POST',
    body: JSON.stringify({
      text: `:warning: Security Alert: ${event.type}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Type:* ${event.type}\n*Details:* ${event.details}\n*User:* ${event.userId ?? 'N/A'}\n*IP:* ${event.ip ?? 'N/A'}`,
          },
        },
      ],
    }),
  });
}
```

---

## Security Checklist

### Pre-Deployment

- [ ] All inputs validated with Zod
- [ ] No secrets in code or logs
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] HTTPS enforced
- [ ] RLS policies reviewed

### Regular Audits

- [ ] Dependency vulnerability scan (weekly)
- [ ] Access log review (weekly)
- [ ] Secret rotation (quarterly)
- [ ] Penetration testing (annually)

---

*MCV Global Consortium - Security Hardening Guide*
