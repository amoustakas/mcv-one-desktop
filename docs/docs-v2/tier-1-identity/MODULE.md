# @mcv/identity — Identity Module

> **Tier:** 1 — Security Boundary
> **Classification:** INTERNAL
> **Package:** `@mcv/identity`
> **Version:** 1.0.0
> **Status:** Foundation
> **Owner:** MCV Platform Team
> **Depends On:** `@mcv/kernel` (Tier 0)
> **Depended On By:** Every protected resource in the MCV ecosystem
> **Last Updated:** 2026-02-09

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Position](#architecture-position)
3. [Core Design Principles](#core-design-principles)
4. [Submodule: auth](#submodule-auth)
5. [Submodule: permissions](#submodule-permissions)
6. [Submodule: sso](#submodule-sso)
7. [Submodule: tenants](#submodule-tenants)
8. [Submodule: users](#submodule-users)
9. [Cross-Module Integration](#cross-module-integration)
10. [Key Interfaces & Types](#key-interfaces--types)
11. [Database Schema](#database-schema)
12. [Event Types](#event-types)
13. [Configuration Reference](#configuration-reference)
14. [Security Model](#security-model)
15. [Error Taxonomy](#error-taxonomy)
16. [Testing Strategy](#testing-strategy)
17. [Performance Budgets](#performance-budgets)
18. [Migration & Versioning](#migration--versioning)
19. [Related Documentation](#related-documentation)

---

## Overview

`@mcv/identity` is the **security boundary** of the MCV.ONE platform. It provides comprehensive Identity and Access Management (IAM) for the entire nine-venture consortium: authentication, authorization, multi-tenancy, user management, and cross-venture single sign-on.

Every protected resource in the MCV ecosystem - from BetEdge sports wagering to NexusHub collaboration to SerpSpace SEO tooling - flows through this package before any access is granted.

**Security is not a feature. It is the foundation. `@mcv/identity` is that foundation.**

### What This Module Does

| Capability | Description |
|------------|-------------|
| **Authentication** | Verifies user identity via Passkeys, WebAuthn, Magic Links, OAuth, Password+MFA, and enterprise SSO |
| **Authorization** | Determines what an authenticated user can do via hybrid RBAC + ABAC, policy engine, gates, and scoped permissions |
| **Multi-Tenancy** | Isolates data and operations per venture and workspace; enforces tenant boundaries at the database level via RLS |
| **User Management** | Full lifecycle CRUD for user profiles, preferences, invitations, impersonation, avatar handling, and status transitions |
| **Single Sign-On** | Cross-venture SSO within the MCV ecosystem, enterprise SAML 2.0 / OIDC federation, identity resolution, and account linking |
| **Session Management** | Stateful sessions with short-lived access tokens, rotating refresh tokens, device binding, risk scoring, and instant revocation |
| **Audit Trail** | Every authentication and authorization event is immutably logged with full request context (7-year retention for compliance) |

### Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| **Auth Provider** | Supabase Auth | Email/password, OAuth, Magic Links, JWT issuance |
| **Database** | PostgreSQL 16+ | Users, sessions, roles, tenants, audit log - with Row-Level Security |
| **ORM** | Drizzle ORM | Type-safe schema definitions, migrations, query builder |
| **Validation** | Zod | Runtime schema validation at every API boundary |
| **Passwords** | Argon2id | Memory-hard hashing (m=65536, t=3, p=4) |
| **Tokens** | jose (Ed25519) | JWT signing and verification via EdDSA |
| **Passkeys** | @simplewebauthn/server | WebAuthn / FIDO2 credential management |
| **TOTP** | otplib | RFC 6238 time-based one-time passwords |
| **SAML** | saml2-js | SAML 2.0 Service Provider implementation |
| **OIDC** | openid-client | OpenID Connect Relying Party |
| **Context** | AsyncLocalStorage | Request-scoped identity propagation via @mcv/kernel |

### Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Auth latency (P99) | < 50 ms | JWT verification must not bottleneck requests |
| Permission check (P99) | < 5 ms | Authorization runs on every protected route |
| Passkey adoption | > 40% of users | Modern auth reduces phishing risk to near zero |
| MFA enrollment | > 80% of users | Compliance requirement across ventures |
| Session hijacking | 0 incidents | Non-negotiable security invariant |
| SSO login success rate | > 99.5% | Enterprise reliability SLA |
| Concurrent sessions | 1M+ | Distributed session store scales horizontally |

---

## Architecture Position

`@mcv/identity` sits at **Tier 1** - directly above the kernel, directly below everything else. It is the gate through which every protected operation must pass.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TIER 4+: VENTURE APPLICATIONS                       │
│                                                                             │
│   BetEdge    NexusHub    SerpSpace    FlowState    ClearLedger    ...      │
│   (Sports)   (Social)    (SEO)        (Productivity) (Finance)             │
├─────────────────────────────────────────────────────────────────────────────┤
│                         TIER 3: VERTICAL SERVICES                           │
│                                                                             │
│   @mcv/commerce    @mcv/engagement    @mcv/analytics    @mcv/api           │
│   (Payments)       (Notifications)    (Tracking)        (Gateway)          │
├─────────────────────────────────────────────────────────────────────────────┤
│                         TIER 2: SHARED PLATFORM                             │
│                                                                             │
│   @mcv/nexus       @mcv/media         @mcv/content      @mcv/search       │
│   (Real-time)      (Assets)           (CMS)             (Discovery)        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│          ╔═══════════════════════════════════════════════════╗              │
│          ║         TIER 1: @mcv/identity  ◄── YOU ARE HERE  ║              │
│          ║                                                   ║              │
│          ║   ┌──────┐ ┌────────────┐ ┌─────────┐           ║              │
│          ║   │ auth │ │permissions │ │ tenants │           ║              │
│          ║   └──────┘ └────────────┘ └─────────┘           ║              │
│          ║   ┌──────┐ ┌─────┐                               ║              │
│          ║   │users │ │ sso │                               ║              │
│          ║   └──────┘ └─────┘                               ║              │
│          ║                                                   ║              │
│          ║   Sessions · MFA · OAuth · WebAuthn · Passkeys   ║              │
│          ║   RBAC · ABAC · Policies · Gates · Scopes        ║              │
│          ║   Ventures · Workspaces · Context Isolation       ║              │
│          ║   Profiles · Invitations · Impersonation          ║              │
│          ║   Federation · SSO · Account Linking              ║              │
│          ╚═══════════════════════════════════════════════════╝              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                         TIER 0: @mcv/kernel                                 │
│                                                                             │
│   db    config    logger    errors    utils    types    context             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dependency Flow

```
@mcv/identity
    │
    ├── imports from @mcv/kernel
    │   ├── db          → Drizzle client, PostgreSQL connection pool
    │   ├── config      → Zod-validated, environment-aware configuration
    │   ├── logger      → Structured logging (pino)
    │   ├── errors      → Error hierarchy (AppError, NotFoundError, etc.)
    │   ├── utils       → Crypto helpers, date utilities, slug generation
    │   ├── types       → Branded types (UserID, VentureID, WorkspaceID)
    │   └── context     → AsyncLocalStorage-based request context
    │
    └── exports to ALL upper tiers
        ├── authenticateRequest()    → Middleware: verify JWT, populate context
        ├── requirePermission()      → Middleware: check RBAC/ABAC before handler
        ├── requireRole()            → Middleware: require specific role
        ├── getTenantContext()       → Current venture + workspace resolution
        ├── getCurrentUser()         → Authenticated user from context
        ├── checkPermission()        → Imperative permission check
        ├── createSession()          → Programmatic session creation
        ├── resolveIdentity()        → SSO identity resolution
        └── (full public API below)
```

### Request Lifecycle

Every inbound request to any MCV service passes through the identity pipeline:

```
  Client Request
       │
       ▼
  ┌─────────────┐
  │ Rate Limiter │ ← IP + token-based limits per endpoint
  └──────┬──────┘
         │
         ▼
  ┌──────────────┐
  │   Tenant     │ ← Resolve venture from subdomain / header / path / JWT
  │  Resolution  │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │    Auth      │ ← Verify JWT signature, check session validity, risk score
  │ Verification │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ Permission   │ ← Evaluate RBAC roles + ABAC policies + gates
  │   Check      │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   Context    │ ← Propagate {user, tenant, permissions} via AsyncLocalStorage
  │ Propagation  │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   Handler    │ ← Business logic in any tier, with full identity context
  │  (Any Tier)  │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  PostgreSQL  │ ← Row-Level Security enforces tenant isolation at DB level
  │     RLS      │
  └──────────────┘
```

---

## Core Design Principles

### 1. Passwordless-First

Passkeys and WebAuthn are the **primary** authentication mechanisms. Passwords exist as a legacy fallback. The system actively encourages migration toward passwordless methods through UX nudges, reduced friction, and security score incentives.

### 2. Zero Trust

Every request is authenticated and authorized. There are no implicit trust boundaries - not between services, not between ventures, not between internal components. Every hop carries verifiable identity context.

### 3. Context-Scoped Permissions

A user has **one global identity** but **per-venture roles and permissions**. Being an admin on BetEdge grants zero privileges on SerpSpace. Permissions are always evaluated within a tenant context (venture + optional workspace).

### 4. Defense in Depth

Seven layers of security protect every operation:

| Layer | Protection |
|-------|-----------|
| 1. Network | CDN/WAF - DDoS mitigation, IP reputation, geo-blocking |
| 2. Rate Limiting | Per-endpoint limits, progressive delays, CAPTCHA triggers |
| 3. Risk Assessment | Device fingerprint, geo-velocity, behavioral signals |
| 4. Authentication | JWT verification, session validation, MFA enforcement |
| 5. Authorization | RBAC + ABAC policy evaluation, gates |
| 6. Database RLS | PostgreSQL Row-Level Security enforces tenant isolation |
| 7. Audit Logging | Every action recorded with full context (7-year retention) |

### 5. Principle of Least Privilege

Users start with **zero permissions** and are granted access explicitly through role assignment and policy evaluation. The default answer is always "deny."

### 6. Supabase Auth as Foundation

Supabase Auth handles the heavy lifting of authentication primitives (email/password, OAuth, Magic Links, JWT issuance). We extend it with:
- WebAuthn / Passkey support via `@simplewebauthn/server`
- Risk-based authentication engine
- Cross-venture SSO session management
- Enterprise SAML/OIDC federation
- Custom JWT claims injection for MCV-specific context

### 7. PostgreSQL + RLS for Tenant Isolation

Every table with tenant-scoped data includes a `venture_id` column. PostgreSQL Row-Level Security policies ensure queries can only access data belonging to the current tenant context. This is enforced at the database level - application bugs cannot bypass it.



---

## Submodule: auth

### Purpose

The `auth` submodule provides all authentication mechanisms for the MCV ecosystem. It integrates with Supabase Auth as the underlying provider and extends it with modern passwordless authentication (Passkeys, WebAuthn), multi-factor authentication, risk-based adaptive challenges, and session lifecycle management.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION PIPELINE                       │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  Client   │───►│  Auth    │───►│ Identity │───►│ Session  │ │
│  │  Request  │    │  Factor  │    │ Verified │    │ Created  │ │
│  └──────────┘    └────┬─────┘    └──────────┘    └──────────┘ │
│                       │                                         │
│         ┌─────────────┼─────────────┐                          │
│         ▼             ▼             ▼                          │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│   │ Primary  │  │   MFA    │  │  Risk    │                   │
│   │ Factors  │  │ Factors  │  │ Signals  │                   │
│   └──────────┘  └──────────┘  └──────────┘                   │
│                                                                 │
│    · Passkey       · TOTP         · Device fingerprint         │
│    · Password      · SMS          · IP reputation              │
│    · Magic Link    · Email code   · Behavioral analysis        │
│    · OAuth         · WebAuthn     · Geo-velocity               │
│    · SSO/SAML      · Push         · Session history            │
└─────────────────────────────────────────────────────────────────┘
```

### Supabase Auth Integration

```typescript
// src/auth/supabase-client.ts

import { createClient } from '@supabase/supabase-js';
import { config } from '@mcv/kernel';

/**
 * Server-side Supabase client with service-role key.
 * Used for admin operations (user creation, forced password resets, etc.).
 * NEVER expose the service-role key to clients.
 */
export const supabaseAdmin = createClient(
  config.get('SUPABASE_URL'),
  config.get('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Create a user-scoped Supabase client that respects RLS.
 * Pass the user's access token so that Supabase applies
 * Row-Level Security policies to every query.
 */
export function createUserClient(accessToken: string) {
  return createClient(
    config.get('SUPABASE_URL'),
    config.get('SUPABASE_ANON_KEY'),
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );
}
```

### JWT Handling

Supabase issues JWTs. We inject MCV-specific custom claims via a Supabase Auth hook so that every token carries venture context, roles, and permissions.

```typescript
// src/auth/jwt.ts

import { jwtVerify, decodeJwt } from 'jose';
import { z } from 'zod';
import { config } from '@mcv/kernel';

/**
 * JWT claims schema - standard Supabase claims + MCV custom claims.
 */
export const JWTClaimsSchema = z.object({
  // Standard Supabase claims
  sub: z.string().uuid(),                        // User ID
  email: z.string().email(),
  aud: z.string(),                               // Audience
  iss: z.string().url(),                         // Issuer (Supabase URL)
  iat: z.number(),                               // Issued-at (epoch seconds)
  exp: z.number(),                               // Expires-at (epoch seconds)
  role: z.string(),                              // Supabase role

  // MCV custom claims (injected via Supabase Auth hook)
  mcv: z.object({
    venture_id: z.string().uuid().optional(),    // Active venture context
    workspace_id: z.string().uuid().optional(),  // Active workspace context
    roles: z.array(z.string()),                   // Roles in active venture
    permissions: z.array(z.string()),             // Computed permission strings
    global_role: z.string().optional(),           // Global role (super_admin, etc.)
    mfa_verified: z.boolean(),                    // Whether MFA was completed
    session_id: z.string().uuid(),                // Unique session ID
    impersonator_id: z.string().uuid().optional(),// Set if being impersonated
  }),
});

export type JWTClaims = z.infer<typeof JWTClaimsSchema>;

/**
 * Verify and decode a JWT.
 * Checks: signature (JWKS), expiration, issuer, audience.
 * Returns strongly-typed claims or throws AuthenticationError.
 */
export async function verifyAccessToken(token: string): Promise<JWTClaims> {
  const jwks = await fetchSupabaseJWKS();

  const { payload } = await jwtVerify(token, jwks, {
    issuer: config.get('SUPABASE_URL'),
    audience: 'authenticated',
    clockTolerance: 5, // seconds - allows minor clock drift
  });

  return JWTClaimsSchema.parse(payload);
}

/**
 * Decode a JWT without signature verification.
 * For inspection and logging ONLY - never for auth decisions.
 */
export function decodeTokenUnsafe(token: string): JWTClaims | null {
  try {
    return JWTClaimsSchema.parse(decodeJwt(token));
  } catch {
    return null;
  }
}
```

#### Token Lifecycle

```typescript
/**
 * Token pair issued after successful authentication.
 */
export interface TokenPair {
  accessToken: string;       // Short-lived: 15 minutes
  refreshToken: string;      // Long-lived: 30 days, rotated on every use
  expiresIn: number;         // Seconds until access token expires
  expiresAt: Date;           // Absolute expiry timestamp
  tokenType: 'Bearer';
}

/**
 * Access token configuration.
 */
export const ACCESS_TOKEN_CONFIG = {
  algorithm: 'EdDSA' as const,     // Ed25519 - fast, small, post-quantum-adjacent
  expiresIn: 15 * 60,              // 15 minutes
  issuer: 'mcv.one',
  audience: 'authenticated',
} as const;

/**
 * Refresh token configuration.
 */
export const REFRESH_TOKEN_CONFIG = {
  length: 64,                       // 64 random bytes
  expiresIn: 30 * 24 * 60 * 60,   // 30 days
  rotateOnUse: true,                // New refresh token issued on every use
  reuseWindow: 10,                  // 10-second grace for concurrent requests
  maxLifetime: 90 * 24 * 60 * 60, // 90-day absolute maximum
} as const;
```

### Session Management

```typescript
// src/auth/session.ts

/**
 * A session represents an authenticated user's connection.
 * Sessions are stored in PostgreSQL with Redis caching for hot lookups.
 */
export interface Session {
  /** UUIDv7 - time-sortable session identifier */
  id: string;

  /** The authenticated user */
  userId: UserID;

  /** Venture this session is scoped to */
  ventureId: VentureID;

  /** Device fingerprint (browser, OS, hardware hints) */
  deviceId: string;

  // ── Tokens ──────────────────────────────────────────────
  /** Short-lived JWT (15 min) */
  accessToken: string;

  /** Hashed refresh token (stored; raw token never persisted) */
  refreshTokenHash: string;

  /** Token family ID for rotation-reuse detection */
  tokenFamily: string;

  // ── Timestamps ──────────────────────────────────────────
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  lastRefreshedAt: Date;

  // ── Security Metadata ───────────────────────────────────
  ipAddress: string;
  userAgent: string;
  geoLocation?: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  };

  // ── Risk & Auth ─────────────────────────────────────────
  riskScore: number;          // 0 (safe) - 100 (high risk)
  mfaVerified: boolean;
  authFactors: AuthFactor[];  // Which factors were used

  // ── State ───────────────────────────────────────────────
  isActive: boolean;
  terminationReason?: SessionTerminationReason;
}
```

#### Auth Factor Types

```typescript
export type AuthFactor =
  | 'password'
  | 'passkey'
  | 'webauthn'
  | 'magic_link'
  | 'oauth_google'
  | 'oauth_github'
  | 'oauth_discord'
  | 'oauth_apple'
  | 'oauth_microsoft'
  | 'sso_saml'
  | 'sso_oidc'
  | 'totp'
  | 'sms'
  | 'email_code'
  | 'push'
  | 'recovery_code';
```

#### Session Termination Reasons

```typescript
export type SessionTerminationReason =
  | 'user_logout'
  | 'token_expired'
  | 'idle_timeout'
  | 'max_lifetime_reached'
  | 'password_changed'
  | 'mfa_reset'
  | 'admin_revoked'
  | 'suspicious_activity'
  | 'concurrent_session_limit'
  | 'account_suspended'
  | 'account_deleted';
```

#### Session Configuration

```typescript
export const SESSION_CONFIG = {
  /** Max active sessions per user per venture */
  maxConcurrentSessions: 10,
  /** Idle timeout - terminate session after inactivity */
  idleTimeoutMinutes: 60,
  /** Absolute max lifetime regardless of activity */
  maxLifetimeHours: 720,  // 30 days
  /** How often to update lastActivityAt (throttle) */
  activityUpdateIntervalSeconds: 60,
  /** Sliding window - extend on each activity */
  slidingWindow: true,
  /** Fresh auth required for sensitive operations */
  reAuthWindowMinutes: 15,
} as const;
```

### Session Service

```typescript
// src/auth/session-service.ts

export class SessionService {
  constructor(
    private readonly db: DrizzleClient,
    private readonly cache: CacheService,
    private readonly events: EventBus,
    private readonly logger: Logger,
  ) {}

  /**
   * Create a new session after successful authentication.
   */
  async createSession(params: CreateSessionParams): Promise<Session> {
    // 1. Enforce concurrent session limit
    const active = await this.getActiveSessions(params.userId, params.ventureId);
    if (active.length >= SESSION_CONFIG.maxConcurrentSessions) {
      const oldest = active[0];
      await this.terminateSession(oldest.id, 'concurrent_session_limit');
    }

    // 2. Generate token family + refresh token
    const tokenFamily = generateSecureId();
    const refreshToken = generateSecureToken(REFRESH_TOKEN_CONFIG.length);
    const refreshTokenHash = await hashToken(refreshToken);
    const accessToken = await this.issueAccessToken(params);

    // 3. Persist session
    const session = await this.db.insert(sessions).values({
      id: generateUUIDv7(),
      userId: params.userId,
      ventureId: params.ventureId,
      deviceId: params.deviceId,
      accessToken,
      refreshTokenHash,
      tokenFamily,
      createdAt: new Date(),
      expiresAt: addDays(new Date(), 30),
      lastActivityAt: new Date(),
      lastRefreshedAt: new Date(),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      geoLocation: params.geoLocation,
      riskScore: params.riskScore,
      mfaVerified: params.mfaVerified,
      authFactors: params.authFactors,
      isActive: true,
    }).returning();

    // 4. Cache for fast lookups (TTL = idle timeout)
    await this.cache.set(
      `session:${session.id}`,
      session,
      SESSION_CONFIG.idleTimeoutMinutes * 60,
    );

    // 5. Emit event
    await this.events.publish('auth.session.created', {
      sessionId: session.id,
      userId: params.userId,
      ventureId: params.ventureId,
      authFactors: params.authFactors,
      ipAddress: params.ipAddress,
    });

    return session;
  }

  /**
   * Refresh an access token.
   * Implements rotation with reuse detection (see Security Model).
   */
  async refreshSession(rawRefreshToken: string): Promise<TokenPair> {
    const hash = await hashToken(rawRefreshToken);

    // Find session by refresh token hash
    const session = await this.db.query.sessions.findFirst({
      where: eq(sessions.refreshTokenHash, hash),
    });

    if (!session) {
      // Check for reuse of a revoked token → token theft detected
      const revoked = await this.db.query.revokedTokens.findFirst({
        where: eq(revokedTokens.tokenHash, hash),
      });

      if (revoked) {
        this.logger.warn('Refresh token reuse detected - revoking family', {
          tokenFamily: revoked.tokenFamily,
          userId: revoked.userId,
        });
        await this.revokeTokenFamily(revoked.tokenFamily);
        await this.events.publish('auth.security.token_reuse', {
          userId: revoked.userId,
          tokenFamily: revoked.tokenFamily,
        });
        throw new AuthenticationError('Token reuse detected - sessions revoked');
      }

      throw new AuthenticationError('Invalid refresh token');
    }

    if (!session.isActive)
      throw new AuthenticationError('Session terminated');
    if (session.expiresAt < new Date())
      throw new AuthenticationError('Session expired');

    // Rotate: issue new refresh token, revoke old one
    const newRefreshToken = generateSecureToken(REFRESH_TOKEN_CONFIG.length);
    const newHash = await hashToken(newRefreshToken);

    await this.db.insert(revokedTokens).values({
      tokenHash: hash,
      tokenFamily: session.tokenFamily,
      userId: session.userId,
      revokedAt: new Date(),
    });

    const newAccessToken = await this.issueAccessToken({
      userId: session.userId,
      ventureId: session.ventureId,
      sessionId: session.id,
    });

    await this.db.update(sessions).set({
      refreshTokenHash: newHash,
      lastRefreshedAt: new Date(),
      lastActivityAt: new Date(),
    }).where(eq(sessions.id, session.id));

    await this.cache.del(`session:${session.id}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_CONFIG.expiresIn,
      expiresAt: addSeconds(new Date(), ACCESS_TOKEN_CONFIG.expiresIn),
      tokenType: 'Bearer',
    };
  }

  /**
   * Terminate a single session.
   */
  async terminateSession(
    sessionId: string,
    reason: SessionTerminationReason,
  ): Promise<void> {
    await this.db.update(sessions).set({
      isActive: false,
      terminationReason: reason,
    }).where(eq(sessions.id, sessionId));

    await this.cache.del(`session:${sessionId}`);
    await this.events.publish('auth.session.terminated', { sessionId, reason });
  }

  /**
   * Terminate all sessions for a user (password change, security reset).
   * Optionally keep the current session alive.
   */
  async terminateAllSessions(
    userId: UserID,
    reason: SessionTerminationReason,
    exceptSessionId?: string,
  ): Promise<number> {
    const conditions = [
      eq(sessions.userId, userId),
      eq(sessions.isActive, true),
    ];
    if (exceptSessionId) {
      conditions.push(ne(sessions.id, exceptSessionId));
    }

    const terminated = await this.db.update(sessions)
      .set({ isActive: false, terminationReason: reason })
      .where(and(...conditions))
      .returning({ id: sessions.id });

    for (const s of terminated) {
      await this.cache.del(`session:${s.id}`);
    }

    await this.events.publish('auth.session.all_terminated', {
      userId,
      reason,
      count: terminated.length,
    });

    return terminated.length;
  }
}
```

### Authentication Methods

| Method | Security | UX Friction | Implementation | Use Case |
|--------|:--------:|:-----------:|---------------|----------|
| **Passkey** | ★★★★★ | ★☆☆☆☆ | `@simplewebauthn/server` | Primary for modern devices |
| **WebAuthn** | ★★★★★ | ★★☆☆☆ | `@simplewebauthn/server` | Hardware security keys |
| **Magic Link** | ★★★★☆ | ★★☆☆☆ | Supabase Auth | Email-based passwordless |
| **OAuth** | ★★★★☆ | ★★☆☆☆ | Supabase Auth | Social / enterprise IdP |
| **Password + MFA** | ★★★☆☆ | ★★★★☆ | Argon2id + TOTP | Legacy fallback |
| **SSO (SAML/OIDC)** | ★★★★★ | ★☆☆☆☆ | saml2-js / openid-client | Enterprise customers |

### Passkey / WebAuthn Service

```typescript
// src/auth/passkey-service.ts

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

export class PasskeyService {
  private readonly rpName = 'MCV.ONE';
  private readonly rpID: string;   // e.g. 'mcv.one'
  private readonly origin: string; // e.g. 'https://mcv.one'

  constructor(
    private readonly db: DrizzleClient,
    private readonly config: IdentityConfig,
  ) {
    this.rpID = config.get('WEBAUTHN_RP_ID');
    this.origin = config.get('WEBAUTHN_ORIGIN');
  }

  /** Registration Step 1: generate challenge. */
  async beginRegistration(userId: UserID) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) throw new NotFoundError('User not found');

    const existing = await this.db.query.passkeys.findMany({
      where: eq(passkeys.userId, userId),
    });

    return generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: userId,
      userName: user.email,
      userDisplayName: user.profile.displayName,
      attestationType: 'none',
      excludeCredentials: existing.map(pk => ({
        id: pk.credentialId,
        type: 'public-key',
        transports: pk.transports,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });
  }

  /** Registration Step 2: verify credential. */
  async completeRegistration(userId: UserID, response: RegistrationResponseJSON) {
    const challenge = await this.consumeChallenge(userId, 'registration');

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new AuthenticationError('Passkey registration failed verification');
    }

    const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

    const passkey = await this.db.insert(passkeys).values({
      id: generateUUIDv7(),
      userId,
      credentialId: credentialID,
      publicKey: credentialPublicKey,
      counter,
      transports: response.response.transports ?? [],
      friendlyName: 'New Passkey',
      createdAt: new Date(),
      lastUsedAt: new Date(),
    }).returning();

    // Increment user's passkey count
    await this.db.update(users)
      .set({ passkeyCount: sql`passkey_count + 1` })
      .where(eq(users.id, userId));

    await this.events.publish('auth.passkey.registered', {
      userId,
      passkeyId: passkey.id,
    });

    return passkey;
  }

  /** Authentication Step 1: generate challenge. */
  async beginAuthentication(email?: string) {
    let allowCredentials: PublicKeyCredentialDescriptorJSON[] | undefined;

    if (email) {
      const user = await this.db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });
      if (user) {
        const pks = await this.db.query.passkeys.findMany({
          where: eq(passkeys.userId, user.id),
        });
        allowCredentials = pks.map(pk => ({
          id: pk.credentialId,
          type: 'public-key',
          transports: pk.transports,
        }));
      }
    }

    return generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials,
      userVerification: 'preferred',
    });
  }

  /** Authentication Step 2: verify assertion. */
  async completeAuthentication(response: AuthenticationResponseJSON) {
    const passkey = await this.db.query.passkeys.findFirst({
      where: eq(passkeys.credentialId, response.id),
    });
    if (!passkey) throw new AuthenticationError('Unknown passkey');

    const challenge = await this.consumeChallenge(passkey.userId, 'authentication');

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      authenticator: {
        credentialID: passkey.credentialId,
        credentialPublicKey: passkey.publicKey,
        counter: passkey.counter,
        transports: passkey.transports,
      },
    });

    if (!verification.verified) {
      throw new AuthenticationError('Passkey authentication failed');
    }

    // Update counter for replay protection
    await this.db.update(passkeys).set({
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    }).where(eq(passkeys.id, passkey.id));

    await this.events.publish('auth.passkey.used', {
      userId: passkey.userId,
      passkeyId: passkey.id,
    });

    return { userId: passkey.userId, passkeyId: passkey.id };
  }
}
```

### MFA Service

```typescript
// src/auth/mfa-service.ts

import { authenticator } from 'otplib';

export class MFAService {
  /** Enroll in TOTP-based MFA. Returns secret + QR URI + backup codes. */
  async enrollTOTP(userId: UserID): Promise<TOTPEnrollment> {
    const secret = authenticator.generateSecret(32);
    const user = await this.getUser(userId);

    const otpauthUrl = authenticator.keyuri(user.email, 'MCV.ONE', secret);

    // Store encrypted secret as pending enrollment
    await this.db.insert(mfaEnrollments).values({
      id: generateUUIDv7(),
      userId,
      type: 'totp',
      secret: await encrypt(secret),
      status: 'pending_verification',
      createdAt: new Date(),
    });

    // Generate 10 single-use backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      generateSecureToken(4).toString('hex'),
    );

    for (const code of backupCodes) {
      await this.db.insert(mfaBackupCodes).values({
        userId,
        codeHash: await hashToken(code),
        usedAt: null,
      });
    }

    return { secret, otpauthUrl, backupCodes };
  }

  /** Verify a TOTP code (enrollment confirmation or login). */
  async verifyTOTP(userId: UserID, code: string): Promise<boolean> {
    const enrollment = await this.getActiveEnrollment(userId, 'totp');
    if (!enrollment) throw new AuthenticationError('No TOTP enrollment found');

    const secret = await decrypt(enrollment.secret);
    const isValid = authenticator.verify({ token: code, secret });

    if (isValid && enrollment.status === 'pending_verification') {
      await this.db.update(mfaEnrollments)
        .set({ status: 'active' })
        .where(eq(mfaEnrollments.id, enrollment.id));
      await this.db.update(users)
        .set({ mfaEnabled: true })
        .where(eq(users.id, userId));
      await this.events.publish('auth.mfa.enrolled', { userId, method: 'totp' });
    }

    return isValid;
  }

  /** Verify a one-time backup code. */
  async verifyBackupCode(userId: UserID, code: string): Promise<boolean> {
    const hash = await hashToken(code);
    const backup = await this.db.query.mfaBackupCodes.findFirst({
      where: and(
        eq(mfaBackupCodes.userId, userId),
        eq(mfaBackupCodes.codeHash, hash),
        isNull(mfaBackupCodes.usedAt),
      ),
    });

    if (!backup) return false;

    await this.db.update(mfaBackupCodes)
      .set({ usedAt: new Date() })
      .where(eq(mfaBackupCodes.id, backup.id));

    const remaining = await this.countRemainingBackupCodes(userId);
    if (remaining <= 2) {
      await this.events.publish('auth.mfa.backup_codes_low', {
        userId,
        remaining,
      });
    }

    return true;
  }
}
```

#### MFA Factor Configuration

| Factor | Algorithm | Time Window | Recovery |
|--------|-----------|-------------|----------|
| **TOTP** | HMAC-SHA-256, 30 s step (RFC 6238) | ±1 step tolerance | 10 backup codes |
| **SMS** | Twilio Verify API | 10 minutes | Alternative phone number |
| **Email Code** | 6-digit CSPRNG code | 10 minutes | N/A (email *is* recovery) |
| **WebAuthn** | FIDO2 challenge-response | One-shot | Register multiple keys |
| **Push** | Mobile app approval | 60 seconds | Backup codes |

### Risk-Based Authentication

```typescript
// src/auth/risk-engine.ts

/**
 * Evaluates multiple signals to produce a risk score (0-100)
 * and a recommended action for the authentication attempt.
 */
export class RiskEngine {
  async assess(ctx: AuthContext): Promise<RiskAssessment> {
    const factors: RiskFactorResult[] = await Promise.all([
      this.checkDeviceReputation(ctx),
      this.checkIPReputation(ctx),
      this.checkGeoVelocity(ctx),
      this.checkBruteForce(ctx),
      this.checkCredentialStuffing(ctx),
      this.checkBotBehavior(ctx),
      this.checkTimeOfDay(ctx),
      this.checkSessionHistory(ctx),
    ]);

    const score = this.calculateCompositeScore(factors);

    const action: RiskAction =
      score < 20 ? 'allow' :
      score < 60 ? 'challenge' :
      'block';

    return {
      score,
      factors: factors.filter(f => f.contribution > 0),
      action,
      challengeType: action === 'challenge'
        ? this.selectChallenge(factors)
        : undefined,
    };
  }

  /** Impossible-travel detection. */
  private async checkGeoVelocity(ctx: AuthContext): Promise<RiskFactorResult> {
    const last = await this.getLastSession(ctx.userId);
    if (!last?.geoLocation || !ctx.geoLocation) {
      return { factor: 'geo_velocity', contribution: 0, detail: 'No geo data' };
    }

    const distanceKm = haversine(last.geoLocation, ctx.geoLocation);
    const hoursElapsed =
      (Date.now() - last.lastActivityAt.getTime()) / (1000 * 60 * 60);
    const speedKmH = distanceKm / Math.max(hoursElapsed, 0.01);

    if (speedKmH > 1000) {
      return {
        factor: 'impossible_travel',
        contribution: 80,
        detail: `${Math.round(distanceKm)} km in ${hoursElapsed.toFixed(1)} h`,
      };
    }
    return { factor: 'geo_velocity', contribution: 0, detail: 'Normal' };
  }
}

export interface RiskAssessment {
  score: number;                  // 0 (safe) - 100 (high risk)
  factors: RiskFactorResult[];
  action: RiskAction;
  challengeType?: ChallengeType;
}

export type RiskAction = 'allow' | 'challenge' | 'block';
export type ChallengeType = 'mfa' | 'captcha' | 'email_verification' | 'sms_verification';

export enum RiskFactor {
  NEW_DEVICE = 'new_device',
  NEW_LOCATION = 'new_location',
  IMPOSSIBLE_TRAVEL = 'impossible_travel',
  TOR_EXIT_NODE = 'tor_exit_node',
  KNOWN_BAD_IP = 'known_bad_ip',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  CREDENTIAL_STUFFING = 'credential_stuffing',
  BOT_BEHAVIOR = 'bot_behavior',
  UNUSUAL_TIME = 'unusual_time',
  LEAKED_CREDENTIALS = 'leaked_credentials',
}
```

### Password Policies

```typescript
// src/auth/password-policy.ts

export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,                   // Prevent hash-DoS
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: true,
  checkBreachedPasswords: true,     // HaveIBeenPwned k-anonymity API
  preventReuseCount: 12,           // Remember last 12 password hashes
  maxAgeDays: 0,                   // No forced rotation (NIST 800-63B)
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 30,
  progressiveDelayMs: [0, 1000, 2000, 5000, 10000],
} as const;

/**
 * Validate a candidate password against the full policy.
 */
export async function validatePassword(
  password: string,
  userId?: UserID,
): Promise<PasswordValidationResult> {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.minLength)
    errors.push(`Minimum ${PASSWORD_POLICY.minLength} characters`);
  if (password.length > PASSWORD_POLICY.maxLength)
    errors.push(`Maximum ${PASSWORD_POLICY.maxLength} characters`);
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password))
    errors.push('At least one uppercase letter required');
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password))
    errors.push('At least one lowercase letter required');
  if (PASSWORD_POLICY.requireDigit && !/\d/.test(password))
    errors.push('At least one digit required');
  if (PASSWORD_POLICY.requireSpecialChar && !/[^A-Za-z0-9]/.test(password))
    errors.push('At least one special character required');

  if (PASSWORD_POLICY.checkBreachedPasswords) {
    if (await isPasswordBreached(password)) {
      errors.push('This password has appeared in a data breach - choose another');
    }
  }

  if (userId && PASSWORD_POLICY.preventReuseCount > 0) {
    if (await isPasswordReused(userId, password)) {
      errors.push(`Cannot reuse last ${PASSWORD_POLICY.preventReuseCount} passwords`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    strength: calculateEntropy(password),
  };
}
```

### OAuth Provider Configuration

```typescript
// src/auth/oauth-providers.ts

export const OAUTH_PROVIDERS = {
  google: {
    name: 'Google',
    scopes: ['openid', 'email', 'profile'],
    mapping: { email: 'email', firstName: 'given_name', lastName: 'family_name', avatar: 'picture' },
  },
  github: {
    name: 'GitHub',
    scopes: ['user:email', 'read:user'],
    mapping: { email: 'email', displayName: 'name', avatar: 'avatar_url', username: 'login' },
  },
  discord: {
    name: 'Discord',
    scopes: ['identify', 'email'],
    mapping: { email: 'email', displayName: 'global_name', username: 'username' },
  },
  apple: {
    name: 'Apple',
    scopes: ['name', 'email'],
    mapping: { email: 'email', firstName: 'name.firstName', lastName: 'name.lastName' },
  },
  microsoft: {
    name: 'Microsoft',
    scopes: ['openid', 'email', 'profile', 'User.Read'],
    mapping: { email: 'mail', firstName: 'givenName', lastName: 'surname', displayName: 'displayName' },
  },
} as const;
```

### Auth Middleware

```typescript
// src/auth/middleware.ts

/**
 * Authentication middleware.
 * Verifies JWT, checks session validity, populates request context.
 *
 * @example
 *   app.use('/api/*', authenticateRequest());
 *   app.use('/api/admin/*', authenticateRequest({ requireMFA: true }));
 */
export function authenticateRequest(
  options: AuthMiddlewareOptions = {},
): MiddlewareHandler {
  return async (c, next) => {
    const header = c.req.header('Authorization');
    if (!header?.startsWith('Bearer ')) {
      if (options.optional) return next();
      throw new AuthenticationError('Missing authorization header');
    }

    const token = header.slice(7);

    // 1. Verify JWT
    const claims = await verifyAccessToken(token);

    // 2. MFA requirement
    if (options.requireMFA && !claims.mcv.mfa_verified) {
      throw new MFARequiredError(
        await getMFAMethods(claims.sub as UserID),
      );
    }

    // 3. Session still active?
    const session = await sessionService.getSession(claims.mcv.session_id);
    if (!session?.isActive) {
      throw new AuthenticationError('Session has been revoked');
    }

    // 4. Re-auth window for sensitive ops
    if (options.requireReAuth) {
      const age = Date.now() - session.lastRefreshedAt.getTime();
      if (age > SESSION_CONFIG.reAuthWindowMinutes * 60_000) {
        throw new ReAuthenticationRequiredError();
      }
    }

    // 5. Populate context
    c.set('user', {
      id: claims.sub as UserID,
      email: claims.email,
      roles: claims.mcv.roles,
      permissions: claims.mcv.permissions,
      globalRole: claims.mcv.global_role,
      mfaVerified: claims.mcv.mfa_verified,
      ventureId: claims.mcv.venture_id as VentureID,
      workspaceId: claims.mcv.workspace_id,
      sessionId: claims.mcv.session_id,
      impersonatorId: claims.mcv.impersonator_id,
    });

    // 6. Touch session (throttled)
    await sessionService.touchSession(session.id);

    await next();
  };
}

export interface AuthMiddlewareOptions {
  /** Allow unauthenticated requests (user may be undefined). */
  optional?: boolean;
  /** Require MFA to have been completed this session. */
  requireMFA?: boolean;
  /** Require fresh re-authentication (within reAuthWindow). */
  requireReAuth?: boolean;
}
```



---

## Submodule: permissions

### Purpose

The `permissions` submodule provides a hybrid **RBAC/ABAC** authorization system. Roles establish baseline access; policies enable fine-grained, context-aware access control. Every protected operation in the MCV ecosystem checks permissions through this submodule.

### Authorization Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHORIZATION MODEL                                  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          USER                                         │  │
│  │                           │                                           │  │
│  │         ┌─────────────────┼─────────────────┐                        │  │
│  │         ▼                 ▼                 ▼                        │  │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │  │
│  │  │   ROLES     │   │   GROUPS    │   │  POLICIES   │              │  │
│  │  │   (RBAC)    │   │ (Membership)│   │   (ABAC)    │              │  │
│  │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘              │  │
│  │         │                 │                 │                        │  │
│  │         └─────────────────┼─────────────────┘                        │  │
│  │                           ▼                                           │  │
│  │              ┌─────────────────┐                                      │  │
│  │              │   PERMISSIONS   │                                      │  │
│  │              │    (Scopes)     │                                      │  │
│  │              └────────┬────────┘                                      │  │
│  │                       ▼                                               │  │
│  │              ┌─────────────────┐                                      │  │
│  │              │   RESOURCES     │                                      │  │
│  │              │   (Actions)     │                                      │  │
│  │              └─────────────────┘                                      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Evaluation Order:                                                           │
│    1. Explicit DENY policies  (always win)                                   │
│    2. Explicit ALLOW policies                                                │
│    3. Role-based permissions                                                 │
│    4. Group-inherited permissions                                            │
│    5. Default: DENY                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Role Hierarchy

Three scopes of roles - **global**, **venture**, and **workspace** - with downward inheritance.

```
                    ┌───────────────┐
                    │  super_admin  │  ← MCV platform staff only
                    └───────┬───────┘
                            │
                    ┌───────┴────────┐
                    │ venture_owner  │  ← Owns one or more ventures
                    └───────┬────────┘
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
    ┌──────────┐   ┌───────────────┐   ┌────────────────┐
    │  admin   │   │ support_agent │   │ venture_admin  │
    └────┬─────┘   └───────────────┘   └───────┬────────┘
         │                                      │
   ┌─────┴──────┐                        ┌──────┴───────┐
   ▼            ▼                        ▼              ▼
┌─────────┐ ┌───────────┐         ┌───────────┐  ┌───────────┐
│ manager │ │ ws_admin   │         │ ws_member  │  │ ws_viewer │
└────┬────┘ └───────────┘         └───────────┘  └───────────┘
     │
┌────┴────┐
│ member  │
└────┬────┘
     │
┌────┴────┐
│ viewer  │
└────┬────┘
     │
┌────┴────┐
│  guest  │
└─────────┘
```

```typescript
// src/permissions/roles.ts

/** Global roles - apply across the entire MCV ecosystem. */
export enum GlobalRole {
  SUPER_ADMIN   = 'super_admin',    // MCV staff - full access to everything
  VENTURE_OWNER = 'venture_owner',  // Owns venture(s)
  SUPPORT_AGENT = 'support_agent',  // MCV support - read + limited write
}

/** Venture-scoped roles - apply within one venture. */
export enum VentureRole {
  ADMIN   = 'admin',     // Full venture administration
  MANAGER = 'manager',   // Manage team, moderate content, limited settings
  MEMBER  = 'member',    // Standard access - create & edit own content
  VIEWER  = 'viewer',    // Read-only
  GUEST   = 'guest',     // Limited: public resources only
}

/** Workspace-scoped roles - apply within one workspace. */
export enum WorkspaceRole {
  WORKSPACE_ADMIN  = 'workspace_admin',
  WORKSPACE_MEMBER = 'workspace_member',
  WORKSPACE_VIEWER = 'workspace_viewer',
}

/**
 * Hierarchy map: each role inherits all permissions of roles it maps to.
 */
export const ROLE_HIERARCHY: Record<string, string[]> = {
  super_admin:      ['venture_owner', 'support_agent'],
  venture_owner:    ['admin'],
  support_agent:    ['viewer'],
  admin:            ['manager', 'workspace_admin'],
  manager:          ['member'],
  member:           ['viewer'],
  viewer:           ['guest'],
  guest:            [],
  workspace_admin:  ['workspace_member'],
  workspace_member: ['workspace_viewer'],
  workspace_viewer: [],
};

/** Resolve full set of effective roles by walking the hierarchy. */
export function resolveRoleHierarchy(roles: string[]): Set<string> {
  const resolved = new Set<string>();
  function walk(role: string) {
    if (resolved.has(role)) return;
    resolved.add(role);
    for (const inherited of ROLE_HIERARCHY[role] ?? []) walk(inherited);
  }
  for (const r of roles) walk(r);
  return resolved;
}
```

### Permission String Format

```typescript
// src/permissions/scopes.ts

/**
 * Permission string format:  resource:action[:scope]
 *
 * Examples:
 *   'users:read'              - Read any user in current context
 *   'users:update:own'        - Update only own user record
 *   'orders:delete:team'      - Delete orders belonging to own team
 *   'settings:*'              - All actions on settings
 *   '*:read'                  - Read anything in current context
 */
export type Permission = `${string}:${string}` | `${string}:${string}:${string}`;

export type Action =
  | 'create' | 'read' | 'update' | 'delete'
  | 'list' | 'export' | 'import' | 'approve' | 'publish' | '*';

export enum ScopeLevel {
  OWN       = 'own',       // Only user's own resources
  TEAM      = 'team',      // Team's resources
  WORKSPACE = 'workspace', // Workspace resources
  VENTURE   = 'venture',   // All venture resources
  GLOBAL    = 'global',    // Cross-venture (super_admin)
}

export interface ParsedPermission {
  resource: string;
  action: Action;
  scope: ScopeLevel;
}

export function parsePermission(p: Permission): ParsedPermission {
  const parts = p.split(':');
  return {
    resource: parts[0],
    action: (parts[1] ?? '*') as Action,
    scope: (parts[2] as ScopeLevel) ?? ScopeLevel.VENTURE,
  };
}

/**
 * Does a granted permission satisfy a required one?
 * Handles wildcards and scope hierarchy (wider ⊇ narrower).
 */
export function permissionSatisfies(granted: Permission, required: Permission): boolean {
  const g = parsePermission(granted);
  const r = parsePermission(required);

  const resourceOk = g.resource === '*' || g.resource === r.resource;
  const actionOk   = g.action === '*'   || g.action === r.action;

  const scopeOrder = [ScopeLevel.OWN, ScopeLevel.TEAM, ScopeLevel.WORKSPACE, ScopeLevel.VENTURE, ScopeLevel.GLOBAL];
  const scopeOk = scopeOrder.indexOf(g.scope) >= scopeOrder.indexOf(r.scope);

  return resourceOk && actionOk && scopeOk;
}
```

### Default Role Permissions

```typescript
// src/permissions/role-permissions.ts

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // ── Global ────────────────────────────────────────────────
  super_admin:   ['*:*:global'],
  venture_owner: ['*:*:venture', 'ventures:update:own', 'ventures:delete:own', 'billing:*:venture'],
  support_agent: ['users:read:global', 'users:update:global', 'sessions:read:global', 'sessions:delete:global', 'audit:read:global'],

  // ── Venture ───────────────────────────────────────────────
  admin: [
    'users:*:venture', 'roles:*:venture', 'permissions:*:venture',
    'workspaces:*:venture', 'settings:*:venture', 'invitations:*:venture',
    'audit:read:venture', 'api_keys:*:venture', 'webhooks:*:venture',
    'integrations:*:venture',
  ],
  manager: [
    'users:read:venture', 'users:update:team', 'roles:read:venture',
    'roles:update:team', 'workspaces:read:venture', 'workspaces:create:venture',
    'workspaces:update:team', 'invitations:create:venture', 'invitations:read:venture',
    'content:*:team', 'reports:read:venture', 'reports:create:venture',
  ],
  member: [
    'users:read:venture', 'users:update:own', 'workspaces:read:venture',
    'content:create:venture', 'content:read:venture', 'content:update:own',
    'content:delete:own', 'comments:create:venture', 'comments:read:venture',
    'comments:update:own', 'comments:delete:own',
  ],
  viewer: [
    'users:read:venture', 'users:update:own',
    'content:read:venture', 'comments:read:venture',
  ],
  guest: [
    'users:read:own', 'users:update:own', 'content:read:venture',
  ],

  // ── Workspace ─────────────────────────────────────────────
  workspace_admin: [
    'workspace_members:*:workspace', 'workspace_settings:*:workspace',
    'workspace_content:*:workspace',
  ],
  workspace_member: [
    'workspace_members:read:workspace', 'workspace_content:create:workspace',
    'workspace_content:read:workspace', 'workspace_content:update:own',
    'workspace_content:delete:own',
  ],
  workspace_viewer: [
    'workspace_members:read:workspace', 'workspace_content:read:workspace',
  ],
};
```

### Policy Engine (ABAC)

```typescript
// src/permissions/policy-engine.ts

/**
 * Attribute-Based Access Control policy engine.
 * Evaluates user, resource, and context attributes against policy conditions.
 */
export class PolicyEngine {
  constructor(
    private readonly db: DrizzleClient,
    private readonly cache: CacheService,
    private readonly logger: Logger,
  ) {}

  /** Evaluate applicable policies; return ALLOW, DENY, or NOT_APPLICABLE. */
  async evaluate(request: PolicyRequest): Promise<PolicyDecision> {
    const policies = await this.getApplicablePolicies(request);
    const results: PolicyEvaluation[] = [];

    for (const policy of policies) {
      if (await this.conditionsMatch(policy, request)) {
        results.push({
          policyId: policy.id,
          policyName: policy.name,
          effect: policy.effect,
          priority: policy.priority,
        });
      }
    }

    return this.resolveConflicts(results);
  }

  /** All conditions within a policy are AND-ed. */
  private async conditionsMatch(policy: Policy, req: PolicyRequest): Promise<boolean> {
    for (const cond of policy.conditions) {
      const actual = this.resolveAttribute(cond.attribute, req);
      if (!this.evaluateOperator(actual, cond.operator, cond.value)) return false;
    }
    return true;
  }

  /** Navigate dotted attribute path: 'user.profile.department' */
  private resolveAttribute(path: string, req: PolicyRequest): unknown {
    const [root, ...rest] = path.split('.');
    let obj: unknown =
      root === 'user'     ? req.user :
      root === 'resource' ? req.resource :
      root === 'context'  ? req.context :
      root === 'env'      ? req.environment :
      undefined;

    for (const segment of rest) {
      if (obj == null) return undefined;
      obj = (obj as Record<string, unknown>)[segment];
    }
    return obj;
  }

  private evaluateOperator(actual: unknown, op: Operator, expected: unknown): boolean {
    switch (op) {
      case 'equals':                return actual === expected;
      case 'not_equals':            return actual !== expected;
      case 'contains':              return String(actual).includes(String(expected));
      case 'starts_with':           return String(actual).startsWith(String(expected));
      case 'ends_with':             return String(actual).endsWith(String(expected));
      case 'in':                    return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':                return Array.isArray(expected) && !expected.includes(actual);
      case 'greater_than':          return Number(actual) > Number(expected);
      case 'greater_than_or_equal': return Number(actual) >= Number(expected);
      case 'less_than':             return Number(actual) < Number(expected);
      case 'less_than_or_equal':    return Number(actual) <= Number(expected);
      case 'matches':               return new RegExp(String(expected)).test(String(actual));
      case 'exists':                return actual != null;
      case 'not_exists':            return actual == null;
      default: return false;
    }
  }

  /**
   * Conflict resolution:
   *   1. Any DENY → result is DENY (deny-overrides)
   *   2. Among ALLOWs → highest priority wins
   *   3. No matches → NOT_APPLICABLE
   */
  private resolveConflicts(evals: PolicyEvaluation[]): PolicyDecision {
    if (evals.length === 0) return { decision: 'not_applicable', evaluations: [] };

    const denies = evals.filter(e => e.effect === 'deny');
    if (denies.length > 0) {
      const top = denies.sort((a, b) => b.priority - a.priority)[0];
      return { decision: 'deny', reason: `Denied by policy: ${top.policyName}`, evaluations: evals };
    }

    const allows = evals.filter(e => e.effect === 'allow');
    if (allows.length > 0) {
      const top = allows.sort((a, b) => b.priority - a.priority)[0];
      return { decision: 'allow', reason: `Allowed by policy: ${top.policyName}`, evaluations: evals };
    }

    return { decision: 'not_applicable', evaluations: evals };
  }
}

/** Policy data model. */
export interface Policy {
  id: string;
  name: string;
  description: string;
  ventureId: VentureID | null; // null = global policy
  conditions: PolicyCondition[];
  effect: 'allow' | 'deny';
  permissions: Permission[];
  priority: number;            // Higher = stronger
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserID;
}

export interface PolicyCondition {
  attribute: string;   // e.g. 'user.department'
  operator: Operator;
  value: unknown;
}

export type Operator =
  | 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with'
  | 'in' | 'not_in'
  | 'greater_than' | 'greater_than_or_equal' | 'less_than' | 'less_than_or_equal'
  | 'matches' | 'exists' | 'not_exists';
```

### Permission Checker (Combined RBAC + ABAC)

```typescript
// src/permissions/checker.ts

export class PermissionChecker {
  constructor(
    private readonly roleResolver: RoleResolver,
    private readonly policyEngine: PolicyEngine,
    private readonly gateRegistry: GateRegistry,
    private readonly events: EventBus,
    private readonly logger: Logger,
  ) {}

  /**
   * Primary authorization API - used by all modules.
   *
   * @example
   * const canEdit = await permissions.check({
   *   user: currentUser,
   *   permission: 'content:update',
   *   resource: { id: contentId, ownerId: content.authorId },
   *   context: { ventureId, workspaceId },
   * });
   * if (!canEdit) throw new ForbiddenError('Cannot edit this content');
   */
  async check(req: PermissionCheckRequest): Promise<boolean> {
    const t0 = performance.now();

    try {
      // 1. Super-admin bypass
      if (req.user.globalRole === GlobalRole.SUPER_ADMIN) return true;

      // 2. Role-based check (RBAC)
      const rolePerms = await this.roleResolver.getEffectivePermissions(
        req.user.id, req.context.ventureId, req.context.workspaceId,
      );
      const hasRolePerm = rolePerms.some(rp => permissionSatisfies(rp, req.permission));

      // 3. Policy-based check (ABAC)
      const policyDecision = await this.policyEngine.evaluate({
        user: req.user,
        resource: req.resource,
        context: req.context,
        environment: { time: new Date(), ip: req.context.ipAddress },
      });

      // 4. Explicit deny always wins
      if (policyDecision.decision === 'deny') {
        await this.logDenied(req, 'policy_deny', policyDecision.reason);
        return false;
      }

      // 5. Allow if RBAC or ABAC grants
      const allowed = hasRolePerm || policyDecision.decision === 'allow';
      if (!allowed) await this.logDenied(req, 'no_grant');
      return allowed;

    } finally {
      const elapsed = performance.now() - t0;
      if (elapsed > 5) {
        this.logger.warn('Slow permission check', {
          permission: req.permission,
          userId: req.user.id,
          elapsed: `${elapsed.toFixed(2)}ms`,
        });
      }
    }
  }

  /**
   * Batch check - more efficient than N individual checks.
   */
  async checkMany(
    user: AuthenticatedUser,
    permissions: Permission[],
    context: PermissionContext,
  ): Promise<Map<Permission, boolean>> {
    const rolePerms = await this.roleResolver.getEffectivePermissions(
      user.id, context.ventureId, context.workspaceId,
    );

    const results = new Map<Permission, boolean>();
    for (const p of permissions) {
      results.set(p, rolePerms.some(rp => permissionSatisfies(rp, p)));
    }
    return results;
  }
}
```

### Authorization Middleware

```typescript
// src/permissions/middleware.ts

/**
 * Authorization middleware - checks permission before handler.
 *
 * @example
 *   app.get('/api/users',      requirePermission('users:read'),   listUsers);
 *   app.delete('/api/users/:id', requirePermission('users:delete'), deleteUser);
 */
export function requirePermission(
  permission: Permission,
  options: RequirePermissionOptions = {},
): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) throw new AuthenticationError('Not authenticated');

    const allowed = await permissionChecker.check({
      user,
      permission,
      resource: options.resource?.(c),
      context: {
        ventureId: user.ventureId,
        workspaceId: user.workspaceId,
        ipAddress: c.req.header('x-forwarded-for') ?? 'unknown',
      },
    });

    if (!allowed) {
      throw new ForbiddenError(options.message ?? `Missing permission: ${permission}`);
    }

    await next();
  };
}

/**
 * Require a specific role (simpler than permission check).
 */
export function requireRole(role: string): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) throw new AuthenticationError('Not authenticated');

    const effectiveRoles = resolveRoleHierarchy(user.roles);
    if (!effectiveRoles.has(role)) {
      throw new ForbiddenError(`Required role: ${role}`);
    }

    await next();
  };
}
```

### Gates (Named Runtime Checks)

```typescript
// src/permissions/gates.ts

export class GateRegistry {
  private gates = new Map<string, GateDefinition>();

  define(name: string, gate: GateDefinition): void { this.gates.set(name, gate); }

  async check(name: string, user: AuthenticatedUser, resource?: unknown, context?: unknown): Promise<boolean> {
    const gate = this.gates.get(name);
    if (!gate) throw new Error(`Gate '${name}' not defined`);
    return gate.check(user, resource, context);
  }
}

/** Built-in gates for the identity module. */
export function registerIdentityGates(registry: GateRegistry): void {
  registry.define('can-impersonate', {
    description: 'Can user impersonate another?',
    check: async (user, target: User) => {
      if (!['super_admin', 'support_agent'].includes(user.globalRole ?? '')) return false;
      if (target.globalRole === 'super_admin') return false;
      if (user.id === target.id) return false;
      return true;
    },
  });

  registry.define('can-access-beta', {
    description: 'Does user have beta access?',
    check: async (user) =>
      user.flags?.includes('beta_tester') || ['super_admin', 'admin'].includes(user.globalRole ?? ''),
  });

  registry.define('can-export-data', {
    description: 'Can user export venture data?',
    check: async (user, _res, ctx: { ventureId: VentureID }) =>
      user.ventureId === ctx.ventureId &&
      await permissionChecker.check({ user, permission: 'data:export', context: { ventureId: ctx.ventureId } }),
  });

  registry.define('can-delete-venture', {
    description: 'Can user delete a venture?',
    check: async (user, venture: Venture) =>
      user.globalRole === 'super_admin' || venture.ownerId === user.id,
  });

  registry.define('can-manage-billing', {
    description: 'Can user manage billing?',
    check: async (user, _res, ctx: { ventureId: VentureID }) =>
      user.globalRole === 'super_admin' ||
      (user.ventureId === ctx.ventureId && ['admin', 'venture_owner'].some(r => user.roles.includes(r))),
  });
}
```

### Resource-Level Permissions

```typescript
// src/permissions/resource-permissions.ts

export class ResourcePermissionChecker {
  /**
   * For scoped permissions like 'content:update:own', verify
   * that the scope actually matches the resource.
   */
  async checkResourceAccess(
    user: AuthenticatedUser,
    permission: Permission,
    resource: ResourceDescriptor,
  ): Promise<boolean> {
    const { scope } = parsePermission(permission);
    switch (scope) {
      case ScopeLevel.OWN:       return resource.ownerId === user.id;
      case ScopeLevel.TEAM:      return this.isSameTeam(user.id, resource.ownerId, user.ventureId);
      case ScopeLevel.WORKSPACE: return resource.workspaceId === user.workspaceId;
      case ScopeLevel.VENTURE:   return resource.ventureId === user.ventureId;
      case ScopeLevel.GLOBAL:    return user.globalRole === 'super_admin';
      default: return false;
    }
  }
}

export interface ResourceDescriptor {
  id: string;
  type: string;
  ownerId: UserID;
  ventureId: VentureID;
  workspaceId?: string;
  teamId?: string;
  metadata?: Record<string, unknown>;
}
```



---

## Submodule: sso

### Purpose

The `sso` submodule provides **cross-venture single sign-on**, **enterprise SAML 2.0 / OIDC federation**, **identity resolution**, **account linking**, and **Just-In-Time (JIT) provisioning**. It enables seamless authentication across the MCV ecosystem and integration with external identity providers.

### SSO Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SSO ARCHITECTURE                                    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                   EXTERNAL IDENTITY PROVIDERS                        │   │
│  │                                                                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│  │  │ Google  │ │ GitHub  │ │ Discord │ │  Okta   │ │ Azure AD│     │   │
│  │  │ (OIDC)  │ │ (OAuth) │ │ (OAuth) │ │ (SAML)  │ │ (SAML)  │     │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘     │   │
│  │       └────────────┴──────────┴────────────┴────────────┘           │   │
│  │                              │                                       │   │
│  └──────────────────────────────┼───────────────────────────────────────┘   │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                   MCV IDENTITY PROVIDER                              │   │
│  │                                                                      │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │   │
│  │  │  Identity   │──►│   Account   │──►│  Session    │               │   │
│  │  │  Resolution │   │   Linking   │   │  Creation   │               │   │
│  │  └─────────────┘   └─────────────┘   └─────────────┘               │   │
│  │         │                  │                  │                      │   │
│  │         ▼                  ▼                  ▼                      │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │   │
│  │  │  JIT User   │   │  Profile    │   │ Cross-      │               │   │
│  │  │  Provision  │   │  Sync       │   │ Venture SSO │               │   │
│  │  └─────────────┘   └─────────────┘   └─────────────┘               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                 │                                            │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                       MCV VENTURES                                   │   │
│  │                                                                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│  │  │ BetEdge │ │NexusHub │ │SerpSpace│ │  MCV    │ │  Other  │     │   │
│  │  │         │ │         │ │         │ │ Studios │ │ Ventures│     │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cross-Venture SSO

When a user authenticates on one MCV venture, they are automatically recognized across all ventures they belong to - no second login required.

```typescript
// src/sso/cross-venture-sso.ts

/** Global SSO session spans all ventures a user belongs to. */
export interface GlobalSSOSession {
  id: string;
  userId: UserID;
  ventureSessions: Map<VentureID, VentureSessionInfo>;
  deviceId: string;
  deviceFingerprint: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  authContext: {
    provider: string;
    mfaVerified: boolean;
    riskScore: number;
    ipAddress: string;
  };
}

export interface VentureSessionInfo {
  ventureId: VentureID;
  accessToken: string;
  refreshToken: string;
  roles: string[];
  createdAt: Date;
  expiresAt: Date;
}

export class CrossVentureSSOService {
  /**
   * After auth in one venture, create sessions for all the user's ventures.
   */
  async propagateSession(
    userId: UserID,
    originVentureId: VentureID,
    authCtx: AuthContext,
  ): Promise<GlobalSSOSession> {
    // 1. Get all active venture memberships
    const memberships = await this.db.query.ventureMemberships.findMany({
      where: and(
        eq(ventureMemberships.userId, userId),
        eq(ventureMemberships.status, 'active'),
      ),
    });

    // 2. Create global session
    const global: GlobalSSOSession = {
      id: generateUUIDv7(),
      userId,
      ventureSessions: new Map(),
      deviceId: authCtx.deviceId,
      deviceFingerprint: authCtx.deviceFingerprint,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: addDays(new Date(), 30),
      authContext: {
        provider: authCtx.provider,
        mfaVerified: authCtx.mfaVerified,
        riskScore: authCtx.riskScore,
        ipAddress: authCtx.ipAddress,
      },
    };

    // 3. Create per-venture sessions
    for (const m of memberships) {
      const vs = await this.createVentureSession(userId, m.ventureId, m.roles, global.id);
      global.ventureSessions.set(m.ventureId, vs);
    }

    await this.store(global);
    await this.events.publish('sso.session.created', {
      globalSessionId: global.id,
      userId,
      originVentureId,
      ventureCount: memberships.length,
    });

    return global;
  }

  /**
   * Resolve session when user navigates to another venture.
   * No re-auth required if global session is valid.
   */
  async resolveVentureSession(
    globalSessionId: string,
    targetVentureId: VentureID,
  ): Promise<VentureSessionInfo> {
    const global = await this.getGlobalSession(globalSessionId);
    if (!global) throw new AuthenticationError('SSO session not found');

    const existing = global.ventureSessions.get(targetVentureId);
    if (existing && existing.expiresAt > new Date()) return existing;

    const membership = await this.db.query.ventureMemberships.findFirst({
      where: and(
        eq(ventureMemberships.userId, global.userId),
        eq(ventureMemberships.ventureId, targetVentureId),
        eq(ventureMemberships.status, 'active'),
      ),
    });
    if (!membership) throw new ForbiddenError('Not a member of this venture');

    const vs = await this.createVentureSession(global.userId, targetVentureId, membership.roles, globalSessionId);
    global.ventureSessions.set(targetVentureId, vs);
    await this.store(global);
    return vs;
  }
}
```

### Enterprise SAML / OIDC Federation

```typescript
// src/sso/enterprise-federation.ts

export interface EnterpriseSSOConfig {
  id: string;
  ventureId: VentureID;
  name: string;          // e.g. "Acme Corp SSO"
  type: 'saml' | 'oidc';

  saml?: {
    entityId: string;
    ssoUrl: string;
    sloUrl?: string;
    certificate: string;
    signatureAlgorithm: 'sha256' | 'sha512';
    nameIdFormat: 'email' | 'persistent' | 'transient';
    signRequests: boolean;
    requireSignedAssertions: boolean;
    requireEncryptedAssertions: boolean;
  };

  oidc?: {
    issuer: string;
    clientId: string;
    clientSecret: string;   // AES-256-GCM encrypted at rest
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    scopes: string[];
    usePKCE: boolean;
  };

  attributeMapping: {
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    groups?: string;
    department?: string;
    title?: string;
    phone?: string;
    avatarUrl?: string;
    custom?: Record<string, string>;
  };

  provisioning: {
    autoProvision: boolean;
    defaultRoles: VentureRole[];
    defaultWorkspaceId?: string;
    groupRoleMapping?: Record<string, VentureRole[]>;
    autoDeprovision: boolean;
    syncProfileOnLogin: boolean;
  };

  domains: string[];       // e.g. ['acme.com', 'acme.io']
  enabled: boolean;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserID;
}
```

### Identity Resolution

```typescript
// src/sso/identity-resolution.ts

/**
 * Maps external identities to MCV users.
 * When a user authenticates via an external provider, determine
 * whether they already have an MCV account.
 */
export class IdentityResolutionService {
  async resolve(ext: ExternalIdentity): Promise<IdentityResolutionResult> {
    // 1. Linked account (exact match - highest confidence)
    const linked = await this.db.query.linkedAccounts.findFirst({
      where: and(
        eq(linkedAccounts.provider, ext.provider),
        eq(linkedAccounts.providerId, ext.externalId),
      ),
    });
    if (linked) {
      return { resolved: true, userId: linked.userId, confidence: 100, matchedOn: ['linked_account'], action: 'login' };
    }

    // 2. Email match
    if (ext.email) {
      const user = await this.db.query.users.findFirst({
        where: eq(users.email, ext.email.toLowerCase()),
      });
      if (user) {
        const confidence = ext.emailVerified ? 95 : 70;
        return {
          resolved: true,
          userId: user.id,
          confidence,
          matchedOn: [ext.emailVerified ? 'verified_email' : 'unverified_email'],
          action: 'link_and_login',
        };
      }
    }

    // 3. Domain match for enterprise SSO
    if (ext.email) {
      const domain = ext.email.split('@')[1];
      const ssoConfig = await this.db.query.enterpriseSSOConfigs.findFirst({
        where: and(
          sql`${domain} = ANY(${enterpriseSSOConfigs.domains})`,
          eq(enterpriseSSOConfigs.enabled, true),
        ),
      });
      if (ssoConfig) {
        return { resolved: false, confidence: 85, matchedOn: ['domain_match'], action: 'provision', ssoConfigId: ssoConfig.id };
      }
    }

    // 4. No match - new user
    return { resolved: false, confidence: 0, matchedOn: [], action: 'register' };
  }
}

export interface ExternalIdentity {
  provider: string;
  externalId: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  avatarUrl?: string;
  rawProfile: Record<string, unknown>;
}

export interface IdentityResolutionResult {
  resolved: boolean;
  userId?: UserID;
  confidence: number;
  matchedOn: IdentityMatchType[];
  action: 'login' | 'link_and_login' | 'provision' | 'register';
  ssoConfigId?: string;
}

export type IdentityMatchType =
  | 'linked_account' | 'verified_email' | 'unverified_email'
  | 'domain_match' | 'phone_match';
```

### JIT (Just-In-Time) Provisioning

```typescript
// src/sso/jit-provisioning.ts

export class JITProvisioningService {
  /**
   * Auto-create an MCV user from an enterprise SSO assertion.
   * Triggered on first login when autoProvision = true.
   */
  async provision(config: EnterpriseSSOConfig, assertion: SSOAssertion): Promise<User> {
    const profile = this.mapAttributes(config.attributeMapping, assertion.attributes);

    // 1. Create user
    const user = await this.userService.create({
      email: profile.email,
      emailVerified: true, // Trusted from enterprise IdP
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName ?? `${profile.firstName} ${profile.lastName}`,
        avatarUrl: profile.avatarUrl,
        timezone: 'UTC',
        locale: 'en',
      },
      status: 'active',
    });

    // 2. Link external account
    await this.accountLinkingService.link(user.id, {
      provider: config.type === 'saml' ? 'custom_saml' : 'custom_oidc',
      providerId: assertion.nameId,
      ssoConfigId: config.id,
    });

    // 3. Create venture membership with resolved roles
    const roles = this.resolveRoles(config, assertion);
    await this.membershipService.create({
      userId: user.id,
      ventureId: config.ventureId,
      roles,
      status: 'active',
    });

    // 4. Add to default workspace if configured
    if (config.provisioning.defaultWorkspaceId) {
      await this.workspaceService.addMember(
        config.provisioning.defaultWorkspaceId,
        user.id,
        WorkspaceRole.WORKSPACE_MEMBER,
      );
    }

    await this.events.publish('sso.user.provisioned', {
      userId: user.id,
      ventureId: config.ventureId,
      ssoConfigId: config.id,
      provider: config.type,
    });

    return user;
  }

  /** Map IdP groups → venture roles using config mapping. */
  private resolveRoles(config: EnterpriseSSOConfig, assertion: SSOAssertion): VentureRole[] {
    const roles = new Set(config.provisioning.defaultRoles);
    if (config.provisioning.groupRoleMapping && assertion.groups) {
      for (const group of assertion.groups) {
        const mapped = config.provisioning.groupRoleMapping[group];
        if (mapped) mapped.forEach(r => roles.add(r));
      }
    }
    return [...roles];
  }
}

export interface SSOAssertion {
  nameId: string;
  email: string;
  attributes: Record<string, string | string[]>;
  groups?: string[];
  sessionIndex?: string;
  issuer: string;
}
```

### Account Linking

```typescript
// src/sso/account-linking.ts

export interface LinkedAccount {
  id: string;
  userId: UserID;
  provider: IdentityProvider;
  providerId: string;
  ssoConfigId?: string;
  providerProfile: {
    email?: string;
    name?: string;
    avatarUrl?: string;
    raw: Record<string, unknown>;
  };
  accessToken?: string;    // AES-256-GCM encrypted at rest
  refreshToken?: string;   // AES-256-GCM encrypted at rest
  tokenExpiresAt?: Date;
  status: 'active' | 'revoked';
  linkedAt: Date;
  lastUsedAt: Date;
  revokedAt?: Date;
}

export enum IdentityProvider {
  GOOGLE      = 'google',
  GITHUB      = 'github',
  DISCORD     = 'discord',
  APPLE       = 'apple',
  TWITTER     = 'twitter',
  LINKEDIN    = 'linkedin',
  MICROSOFT   = 'microsoft',
  OKTA        = 'okta',
  CUSTOM_SAML = 'custom_saml',
  CUSTOM_OIDC = 'custom_oidc',
}
```



---

## Submodule: tenants

### Purpose

The `tenants` submodule manages **multi-tenancy** for the MCV ecosystem. Ventures are top-level tenants (BetEdge, NexusHub, SerpSpace, etc.); workspaces provide sub-division within ventures (teams, projects, clients). This submodule handles venture creation and configuration, tenant isolation via RLS, tenant switching, and tenant-scoped data access.

### Tenant Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MCV ECOSYSTEM                                      │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         VENTURES                                      │  │
│  │  (Top-level tenants - BetEdge, NexusHub, SerpSpace, etc.)            │  │
│  │                                                                       │  │
│  │  ┌───────────────────────────────────────────────────────────────┐   │  │
│  │  │                      WORKSPACES                                │   │  │
│  │  │  (Sub-tenants - teams, projects, clients, departments)        │   │  │
│  │  │                                                                │   │  │
│  │  │  ┌───────────────────────────────────────────────────────┐   │   │  │
│  │  │  │                    RESOURCES                           │   │   │  │
│  │  │  │  (Data owned by workspace - contacts, orders, etc.)   │   │   │  │
│  │  │  └───────────────────────────────────────────────────────┘   │   │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Venture Model

```typescript
// src/tenants/venture.ts

export interface Venture {
  id: VentureID;
  slug: string;                 // URL-safe (e.g. 'betedge')
  name: string;                 // Display name
  domain: string;               // Primary domain (e.g. 'betedge.io')
  additionalDomains: string[];  // Extra domains / subdomains
  description?: string;

  status: VentureStatus;
  plan: VenturePlan;

  branding: VentureBranding;
  settings: VentureSettings;
  limits: VentureLimits;

  createdAt: Date;
  updatedAt: Date;
  ownerId: UserID;
}

export enum VentureStatus {
  ACTIVE      = 'active',
  SUSPENDED   = 'suspended',
  TRIAL       = 'trial',
  PENDING     = 'pending',
  DEACTIVATED = 'deactivated',
}

export enum VenturePlan {
  FREE          = 'free',
  STARTER       = 'starter',
  PROFESSIONAL  = 'professional',
  ENTERPRISE    = 'enterprise',
  CUSTOM        = 'custom',
}

export interface VentureBranding {
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  darkMode?: { logo: string; primaryColor: string; secondaryColor: string };
}

export interface VentureLimits {
  maxUsers: number;
  maxWorkspaces: number;
  maxStorage: number;      // bytes
  maxApiCalls: number;     // per month
  maxTeamSize: number;
}

export interface VentureSettings {
  auth: {
    allowedMethods: AuthMethod[];
    requireMFA: boolean;
    sessionTimeoutMinutes: number;
    allowPublicRegistration: boolean;
    requireEmailVerification: boolean;
    allowedEmailDomains: string[];
    passwordPolicy?: Partial<typeof PASSWORD_POLICY>;
  };
  features: {
    workspaces: boolean;
    sso: boolean;
    api: boolean;
    webhooks: boolean;
    customDomain: boolean;
    whiteLabel: boolean;
    advancedPermissions: boolean;
    auditLog: boolean;
    dataExport: boolean;
  };
  notifications: {
    welcomeEmail: boolean;
    invitationEmail: boolean;
    securityAlerts: boolean;
    weeklyDigest: boolean;
  };
  locale: {
    defaultLanguage: string;
    defaultTimezone: string;
    supportedLanguages: string[];
    dateFormat: string;
  };
}

export type AuthMethod = 'passkey' | 'password' | 'magic_link' | 'oauth' | 'sso_saml' | 'sso_oidc';
```

### Venture Service

```typescript
// src/tenants/venture-service.ts

export class VentureService {
  /** Create a new venture. */
  async create(params: CreateVentureParams): Promise<Venture> {
    // Validate slug uniqueness
    const slugExists = await this.db.query.ventures.findFirst({
      where: eq(ventures.slug, params.slug),
    });
    if (slugExists) throw new ConflictError(`Slug '${params.slug}' is taken`);

    // Validate domain uniqueness
    if (params.domain) {
      const domainExists = await this.db.query.ventures.findFirst({
        where: eq(ventures.domain, params.domain),
      });
      if (domainExists) throw new ConflictError(`Domain '${params.domain}' is taken`);
    }

    // Insert venture
    const venture = await this.db.insert(ventures).values({
      id: generateUUIDv7() as VentureID,
      slug: params.slug,
      name: params.name,
      domain: params.domain ?? `${params.slug}.mcv.one`,
      description: params.description,
      status: VentureStatus.ACTIVE,
      plan: params.plan ?? VenturePlan.FREE,
      branding: params.branding ?? DEFAULT_BRANDING,
      settings: params.settings ?? DEFAULT_VENTURE_SETTINGS,
      limits: PLAN_LIMITS[params.plan ?? VenturePlan.FREE],
      ownerId: params.ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Owner becomes admin
    await this.membershipService.create({
      userId: params.ownerId,
      ventureId: venture.id,
      roles: [VentureRole.ADMIN],
      status: 'active',
    });

    // Default workspace
    await this.workspaceService.create({
      ventureId: venture.id,
      slug: 'general',
      name: 'General',
      visibility: 'public',
      createdBy: params.ownerId,
    });

    // Default role permissions
    await this.setupDefaultRoles(venture.id);

    await this.events.publish('tenant.venture.created', {
      ventureId: venture.id,
      slug: venture.slug,
      ownerId: params.ownerId,
      plan: venture.plan,
    });

    return venture;
  }

  /** Switch user's active venture context. */
  async switchVenture(userId: UserID, targetVentureId: VentureID): Promise<VentureContext> {
    const membership = await this.db.query.ventureMemberships.findFirst({
      where: and(
        eq(ventureMemberships.userId, userId),
        eq(ventureMemberships.ventureId, targetVentureId),
        eq(ventureMemberships.status, 'active'),
      ),
    });
    if (!membership) throw new ForbiddenError('Not a member of this venture');

    const venture = await this.getById(targetVentureId);
    if (venture.status !== VentureStatus.ACTIVE)
      throw new ForbiddenError(`Venture is ${venture.status}`);

    await this.db.update(userPreferences)
      .set({ defaultVentureId: targetVentureId })
      .where(eq(userPreferences.userId, userId));

    return {
      venture,
      membership,
      roles: membership.roles,
      permissions: await this.permissionService.getEffectivePermissions(userId, targetVentureId),
    };
  }
}
```

### Workspace Model

```typescript
// src/tenants/workspace.ts

export interface Workspace {
  id: string;
  ventureId: VentureID;
  slug: string;
  name: string;
  description?: string;
  parentId?: string;             // For nesting
  path: string;                  // Materialized path: '/sales/enterprise/west-coast'
  visibility: 'public' | 'private' | 'restricted';
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserID;
}

export interface WorkspaceSettings {
  defaultRole: WorkspaceRole;
  allowSelfJoin: boolean;
  maxMembers: number;
  icon?: string;
  color?: string;
}
```

### Tenant Context Resolution

```typescript
// src/tenants/context-resolution.ts

/**
 * Resolve the current tenant from the request.
 * Result propagated via AsyncLocalStorage for the entire request lifecycle.
 *
 * Resolution priority:
 *   1. Explicit header  (X-Venture-ID, X-Workspace-ID)
 *   2. Subdomain        (betedge.app.mcv.one → betedge)
 *   3. Path prefix      (/v/betedge/...)
 *   4. JWT claims       (mcv.venture_id)
 *   5. User default     (preferences.defaultVentureId)
 */
export class TenantContextResolver {
  async resolve(request: Request, user?: AuthenticatedUser): Promise<TenantContext> {
    let ventureId: VentureID | undefined;
    let workspaceId: string | undefined;
    let resolvedFrom: ResolvedFrom = 'default';

    // 1. Explicit headers
    const hVenture = request.headers.get('X-Venture-ID');
    const hWorkspace = request.headers.get('X-Workspace-ID');
    if (hVenture) {
      ventureId = hVenture as VentureID;
      workspaceId = hWorkspace ?? undefined;
      resolvedFrom = 'header';
    }

    // 2. Subdomain
    if (!ventureId) {
      const host = request.headers.get('host') ?? '';
      const subdomain = this.extractSubdomain(host);
      if (subdomain) {
        const v = await this.ventureService.getBySlug(subdomain);
        if (v) { ventureId = v.id; resolvedFrom = 'subdomain'; }
      }
    }

    // 3. Path prefix
    if (!ventureId) {
      const url = new URL(request.url);
      const match = url.pathname.match(/^\/v\/([^/]+)/);
      if (match) {
        const v = await this.ventureService.getBySlug(match[1]);
        if (v) { ventureId = v.id; resolvedFrom = 'path'; }
      }
    }

    // 4. JWT claims
    if (!ventureId && user) {
      ventureId = user.ventureId;
      workspaceId = workspaceId ?? user.workspaceId;
      resolvedFrom = 'token';
    }

    // 5. User default
    if (!ventureId && user) {
      const prefs = await this.userPreferencesService.get(user.id);
      ventureId = prefs?.defaultVentureId;
      resolvedFrom = 'default';
    }

    if (!ventureId) throw new TenantResolutionError('Unable to resolve tenant context');

    const venture = await this.ventureService.getById(ventureId);
    const workspace = workspaceId ? await this.workspaceService.getById(workspaceId) : undefined;

    return { venture, workspace, resolvedFrom, resolvedAt: new Date() };
  }

  private extractSubdomain(host: string): string | undefined {
    const parts = host.split('.');
    return parts.length >= 4 ? parts[0] : undefined;
  }
}

export interface TenantContext {
  venture: Venture;
  workspace?: Workspace;
  resolvedFrom: ResolvedFrom;
  resolvedAt: Date;
}

export type ResolvedFrom = 'header' | 'subdomain' | 'path' | 'token' | 'default';
```

### Tenant Isolation via RLS

```typescript
// src/tenants/rls.ts

/**
 * Set the current tenant context for PostgreSQL RLS.
 * MUST be called at the start of every request within a transaction.
 */
export async function setTenantContext(
  db: DrizzleClient,
  ventureId: VentureID,
  userId?: UserID,
): Promise<void> {
  await db.execute(sql`SET LOCAL app.current_venture_id = ${ventureId}`);
  if (userId) {
    await db.execute(sql`SET LOCAL app.current_user_id = ${userId}`);
  }
}
```

```sql
-- Example RLS policies applied via migration

ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content FORCE ROW LEVEL SECURITY;

-- Read: users see only their venture's data
CREATE POLICY content_venture_isolation ON content
  FOR SELECT
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- Write: owners or admins only
CREATE POLICY content_write ON content
  FOR ALL
  USING (
    venture_id = current_setting('app.current_venture_id')::uuid
    AND (
      created_by = current_setting('app.current_user_id')::uuid
      OR EXISTS (
        SELECT 1 FROM venture_memberships vm
        WHERE vm.user_id = current_setting('app.current_user_id')::uuid
          AND vm.venture_id = current_setting('app.current_venture_id')::uuid
          AND 'admin' = ANY(vm.roles)
      )
    )
  );

-- Service role bypasses all RLS
CREATE POLICY content_service_bypass ON content
  USING (current_setting('role') = 'service_role');
```



---

## Submodule: users

### Purpose

The `users` submodule manages **user profiles**, **preferences**, **invitations**, **impersonation**, **avatar handling**, and the complete **user status lifecycle**. Users are global entities with venture-specific memberships and profile overrides.

### User Model

```typescript
// src/users/user.ts

export interface User {
  // ── Core Identity (global) ──────────────────────────────
  id: UserID;
  email: string;              // Globally unique, lowercase
  emailVerified: boolean;
  phone?: string;             // E.164 format
  phoneVerified: boolean;
  username?: string;          // Globally unique, URL-safe

  // ── Profile (global defaults) ───────────────────────────
  profile: UserProfile;

  // ── Security ────────────────────────────────────────────
  passwordHash?: string;      // Argon2id; null if passwordless-only
  mfaEnabled: boolean;
  mfaMethods: MFAMethod[];
  passkeyCount: number;

  // ── Status ──────────────────────────────────────────────
  status: UserStatus;
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;

  // ── Metadata ────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;           // Soft delete timestamp
  supabaseId: string;         // FK to auth.users
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  timezone: string;
  locale: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  professional?: {
    company?: string;
    title?: string;
    department?: string;
  };
}

export enum UserStatus {
  ACTIVE               = 'active',
  INACTIVE             = 'inactive',
  SUSPENDED            = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  PENDING_INVITATION   = 'pending_invitation',
  PENDING_DELETION     = 'pending_deletion',
  DELETED              = 'deleted',
}

export type MFAMethod = 'totp' | 'sms' | 'email' | 'webauthn' | 'push';
```

### User Service (CRUD)

```typescript
// src/users/user-service.ts

export class UserService {
  /** Create a new user (registration or JIT provisioning). */
  async create(params: CreateUserParams): Promise<User> {
    // Email uniqueness
    const exists = await this.db.query.users.findFirst({
      where: eq(users.email, params.email.toLowerCase()),
    });
    if (exists) throw new ConflictError('Email already registered');

    // Username uniqueness
    if (params.username) {
      const taken = await this.db.query.users.findFirst({
        where: eq(users.username, params.username.toLowerCase()),
      });
      if (taken) throw new ConflictError('Username already taken');
    }

    // Hash password
    let passwordHash: string | undefined;
    if (params.password) {
      const validation = await validatePassword(params.password);
      if (!validation.valid)
        throw new ValidationError('Password policy violation', { errors: validation.errors });
      passwordHash = await hashPassword(params.password);
    }

    // Create in Supabase Auth
    const { data: sbUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: params.email.toLowerCase(),
      password: params.password,
      email_confirm: params.emailVerified ?? false,
      user_metadata: { first_name: params.profile.firstName, last_name: params.profile.lastName },
    });
    if (error) throw new InternalError('Supabase user creation failed', { cause: error });

    // Create in identity DB
    const user = await this.db.insert(users).values({
      id: generateUUIDv7() as UserID,
      supabaseId: sbUser.user.id,
      email: params.email.toLowerCase(),
      emailVerified: params.emailVerified ?? false,
      phone: params.phone,
      phoneVerified: false,
      username: params.username?.toLowerCase(),
      profile: {
        firstName: params.profile.firstName,
        lastName: params.profile.lastName,
        displayName: params.profile.displayName ?? `${params.profile.firstName} ${params.profile.lastName}`,
        avatarUrl: params.profile.avatarUrl,
        bio: params.profile.bio,
        timezone: params.profile.timezone ?? 'UTC',
        locale: params.profile.locale ?? 'en',
      },
      passwordHash,
      mfaEnabled: false,
      mfaMethods: [],
      passkeyCount: 0,
      status: params.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    await this.events.publish('user.created', { userId: user.id, email: user.email, status: user.status });
    return user;
  }

  /** Update profile fields. */
  async updateProfile(userId: UserID, updates: Partial<UserProfile>): Promise<User> {
    const user = await this.getById(userId);
    const updated = await this.db.update(users).set({
      profile: { ...user.profile, ...updates },
      updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning();

    await this.cache.del(`user:${userId}`);
    await this.events.publish('user.profile.updated', { userId, fields: Object.keys(updates) });
    return updated;
  }

  /** Search with filters, pagination, and sorting. */
  async search(params: UserSearchParams): Promise<PaginatedResult<User>> {
    const conds: SQL[] = [isNull(users.deletedAt)];

    if (params.query) {
      const term = `%${params.query.toLowerCase()}%`;
      conds.push(or(
        ilike(users.email, term),
        ilike(sql`${users.profile}->>'firstName'`, term),
        ilike(sql`${users.profile}->>'lastName'`, term),
        ilike(sql`${users.profile}->>'displayName'`, term),
        ilike(users.username, term),
      ));
    }
    if (params.status) conds.push(eq(users.status, params.status));
    if (params.ventureId) {
      conds.push(exists(
        this.db.select().from(ventureMemberships).where(and(
          eq(ventureMemberships.userId, users.id),
          eq(ventureMemberships.ventureId, params.ventureId),
          eq(ventureMemberships.status, 'active'),
        )),
      ));
    }
    if (params.role) {
      conds.push(exists(
        this.db.select().from(ventureMemberships).where(and(
          eq(ventureMemberships.userId, users.id),
          sql`${params.role} = ANY(${ventureMemberships.roles})`,
        )),
      ));
    }
    if (params.createdAfter) conds.push(gte(users.createdAt, params.createdAfter));
    if (params.createdBefore) conds.push(lte(users.createdAt, params.createdBefore));

    const where = and(...conds);
    const [items, [{ count: total }]] = await Promise.all([
      this.db.query.users.findMany({
        where,
        orderBy: params.sortBy === 'name'
          ? asc(sql`${users.profile}->>'displayName'`)
          : desc(users.createdAt),
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
      }),
      this.db.select({ count: count() }).from(users).where(where),
    ]);

    return {
      items,
      total,
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
      hasMore: (params.offset ?? 0) + items.length < total,
    };
  }

  /** Request soft-deletion with 30-day grace period. */
  async requestDeletion(userId: UserID): Promise<void> {
    const gracePeriodEnds = addDays(new Date(), 30);
    await this.db.update(users).set({
      status: UserStatus.PENDING_DELETION,
      deletedAt: gracePeriodEnds,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    await this.sessionService.terminateAllSessions(userId, 'account_deleted');
    await this.events.publish('user.deletion.requested', { userId, gracePeriodEnds });
  }

  /** Permanent deletion - anonymize data per GDPR. */
  async permanentlyDelete(userId: UserID): Promise<void> {
    const user = await this.getById(userId);

    // Delete from Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(user.supabaseId);

    // Anonymize profile
    await this.db.update(users).set({
      email: `deleted_${userId}@mcv.one`,
      phone: null,
      username: null,
      profile: {
        firstName: 'Deleted', lastName: 'User', displayName: 'Deleted User',
        avatarUrl: null, bio: null, timezone: 'UTC', locale: 'en',
      },
      passwordHash: null,
      status: UserStatus.DELETED,
      deletedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    // Cascade: memberships, linked accounts, passkeys, preferences
    await this.db.update(ventureMemberships).set({ status: 'expired' }).where(eq(ventureMemberships.userId, userId));
    await this.db.delete(linkedAccounts).where(eq(linkedAccounts.userId, userId));
    await this.db.delete(passkeys).where(eq(passkeys.userId, userId));
    await this.db.delete(userPreferences).where(eq(userPreferences.userId, userId));

    await this.events.publish('user.deleted', { userId });
  }
}
```

### Venture Membership

```typescript
export interface VentureMembership {
  id: string;
  userId: UserID;
  ventureId: VentureID;
  roles: VentureRole[];
  customPermissions: Permission[];
  profileOverrides?: Partial<UserProfile>;
  invitedBy?: UserID;
  invitedAt?: Date;
  acceptedAt?: Date;
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type MembershipStatus = 'active' | 'pending' | 'suspended' | 'expired';
```

### User Preferences

```typescript
// src/users/preferences.ts

export interface UserPreferences {
  userId: UserID;
  ventureId?: VentureID;  // null = global defaults

  notifications: {
    email: NotificationPreference;
    sms: NotificationPreference;
    push: NotificationPreference;
    inApp: NotificationPreference;
  };

  ui: {
    theme: 'light' | 'dark' | 'system';
    density: 'comfortable' | 'compact';
    sidebarCollapsed: boolean;
    defaultView: string;
    language: string;
    dateFormat: 'relative' | 'absolute' | 'iso';
    numberFormat: string;
  };

  privacy: {
    profileVisibility: 'public' | 'contacts' | 'private';
    activityVisibility: 'public' | 'contacts' | 'private';
    searchable: boolean;
    showOnlineStatus: boolean;
  };

  communication: {
    marketingEmails: boolean;
    productUpdates: boolean;
    securityAlerts: boolean;   // CANNOT be disabled
    weeklyDigest: boolean;
  };

  defaultVentureId?: VentureID;
  defaultWorkspaceId?: string;
}

export interface NotificationPreference {
  enabled: boolean;
  categories: Record<string, boolean>;
  quietHours?: {
    enabled: boolean;
    start: string;   // HH:mm
    end: string;
    timezone: string;
  };
}
```

### Avatar Handling

```typescript
// src/users/avatar-service.ts

export class AvatarService {
  private readonly MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly OUTPUT_SIZES = [32, 64, 128, 256, 512];

  /** Upload, process (resize, strip EXIF), and store avatar in Supabase Storage. */
  async upload(userId: UserID, file: File): Promise<string> {
    if (file.size > this.MAX_SIZE) throw new ValidationError(`Avatar must be < 5 MB`);
    if (!this.ALLOWED_TYPES.includes(file.type)) throw new ValidationError(`Unsupported format`);

    const processed = await this.processImage(file);
    const basePath = `avatars/${userId}`;

    for (const [size, buffer] of processed) {
      await supabaseAdmin.storage.from('avatars').upload(
        `${basePath}/${size}.webp`, buffer,
        { contentType: 'image/webp', upsert: true },
      );
    }

    const { data } = supabaseAdmin.storage.from('avatars').getPublicUrl(`${basePath}/256.webp`);
    await this.userService.updateProfile(userId, { avatarUrl: data.publicUrl });
    return data.publicUrl;
  }

  /** Delete all avatar sizes. */
  async delete(userId: UserID): Promise<void> {
    const paths = this.OUTPUT_SIZES.map(s => `avatars/${userId}/${s}.webp`);
    await supabaseAdmin.storage.from('avatars').remove(paths);
    await this.userService.updateProfile(userId, { avatarUrl: undefined });
  }

  /** Gravatar fallback URL. */
  getGravatarUrl(email: string, size = 256): string {
    const hash = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
  }
}
```

### Invitation System

```typescript
// src/users/invitation-service.ts

export interface Invitation {
  id: string;
  ventureId: VentureID;
  workspaceId?: string;
  email: string;
  existingUserId?: UserID;
  roles: VentureRole[];
  message?: string;
  token: string;              // Secure random, base64url
  expiresAt: Date;
  invitedBy: UserID;
  status: InvitationStatus;
  sentAt: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  resendCount: number;
  lastResentAt?: Date;
}

export enum InvitationStatus {
  PENDING  = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED  = 'expired',
  REVOKED  = 'revoked',
}

export class InvitationService {
  private readonly EXPIRY_DAYS = 7;
  private readonly MAX_RESENDS = 3;

  async invite(params: InviteParams): Promise<Invitation> {
    // Check not already a member
    const member = await this.checkExistingMembership(params.email, params.ventureId);
    if (member) throw new ConflictError('Already a member');

    // Check no pending invite
    const pending = await this.db.query.invitations.findFirst({
      where: and(
        eq(invitations.email, params.email.toLowerCase()),
        eq(invitations.ventureId, params.ventureId),
        eq(invitations.status, 'pending'),
        gt(invitations.expiresAt, new Date()),
      ),
    });
    if (pending) throw new ConflictError('Invitation already pending');

    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.email, params.email.toLowerCase()),
    });

    const token = generateSecureToken(32).toString('base64url');

    const invitation = await this.db.insert(invitations).values({
      id: generateUUIDv7(),
      ventureId: params.ventureId,
      workspaceId: params.workspaceId,
      email: params.email.toLowerCase(),
      existingUserId: existingUser?.id,
      roles: params.roles,
      message: params.message,
      token,
      expiresAt: addDays(new Date(), this.EXPIRY_DAYS),
      invitedBy: params.invitedBy,
      status: 'pending',
      sentAt: new Date(),
      resendCount: 0,
    }).returning();

    await this.emailService.sendInvitation({
      to: params.email,
      inviterName: params.inviterName,
      ventureName: params.ventureName,
      message: params.message,
      acceptUrl: `${config.get('APP_URL')}/invitations/accept?token=${token}`,
    });

    await this.events.publish('user.invitation.sent', {
      invitationId: invitation.id,
      ventureId: params.ventureId,
      email: params.email,
      invitedBy: params.invitedBy,
    });

    return invitation;
  }

  async accept(token: string, userId: UserID): Promise<VentureMembership> {
    const inv = await this.db.query.invitations.findFirst({
      where: and(eq(invitations.token, token), eq(invitations.status, 'pending')),
    });
    if (!inv) throw new NotFoundError('Invitation not found or already used');
    if (inv.expiresAt < new Date()) {
      await this.db.update(invitations).set({ status: 'expired' }).where(eq(invitations.id, inv.id));
      throw new InvitationExpiredError();
    }

    const user = await this.userService.getById(userId);
    if (user.email !== inv.email) throw new ForbiddenError('Email mismatch');

    const membership = await this.db.insert(ventureMemberships).values({
      id: generateUUIDv7(),
      userId,
      ventureId: inv.ventureId,
      roles: inv.roles,
      status: 'active',
      invitedBy: inv.invitedBy,
      invitedAt: inv.sentAt,
      acceptedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    if (inv.workspaceId) {
      await this.workspaceService.addMember(inv.workspaceId, userId, WorkspaceRole.WORKSPACE_MEMBER);
    }

    await this.db.update(invitations).set({ status: 'accepted', acceptedAt: new Date() }).where(eq(invitations.id, inv.id));
    await this.events.publish('user.invitation.accepted', { invitationId: inv.id, userId, ventureId: inv.ventureId });

    return membership;
  }
}
```

### Impersonation

```typescript
// src/users/impersonation-service.ts

export interface ImpersonationSession {
  id: string;
  impersonatorId: UserID;
  impersonatedId: UserID;
  ventureId: VentureID;
  permissions: Permission[];
  restrictedActions: string[];
  startedAt: Date;
  expiresAt: Date;      // Max 1 hour
  endedAt?: Date;
  reason: string;       // Required audit trail
  approvedBy?: UserID;
}

export const IMPERSONATION_RESTRICTED = [
  'password:change', 'mfa:modify', 'account:delete',
  'impersonation:start', 'security:settings',
  'billing:modify', 'api_keys:create', 'api_keys:delete',
] as const;

export class ImpersonationService {
  async start(params: {
    impersonatorId: UserID;
    impersonatedId: UserID;
    ventureId: VentureID;
    reason: string;
  }): Promise<ImpersonationSession> {
    const impersonator = await this.userService.getById(params.impersonatorId);
    const target = await this.userService.getById(params.impersonatedId);

    const allowed = await this.gateRegistry.check('can-impersonate', impersonator, target);
    if (!allowed) throw new ForbiddenError('Not authorized to impersonate');

    const existing = await this.getActive(params.impersonatorId);
    if (existing) throw new ConflictError('Already impersonating');

    const session = await this.db.insert(impersonationSessions).values({
      id: generateUUIDv7(),
      ...params,
      permissions: await this.getImpersonationPermissions(params.impersonatedId, params.ventureId),
      restrictedActions: [...IMPERSONATION_RESTRICTED],
      startedAt: new Date(),
      expiresAt: addHours(new Date(), 1),
    }).returning();

    await this.events.publish('auth.impersonation.started', {
      ...params,
      sessionId: session.id,
    });

    this.logger.warn('Impersonation started', params);
    return session;
  }

  async end(sessionId: string): Promise<void> {
    const session = await this.db.update(impersonationSessions)
      .set({ endedAt: new Date() })
      .where(eq(impersonationSessions.id, sessionId))
      .returning();

    await this.events.publish('auth.impersonation.ended', {
      impersonatorId: session.impersonatorId,
      impersonatedId: session.impersonatedId,
      sessionId,
    });
  }
}
```

### User Status Lifecycle

```
                ┌─────────────────────┐
                │ PENDING_INVITATION  │ ← Invited but hasn't signed up
                └──────────┬──────────┘
                           │ accepts / verifies email
                           ▼
┌────────────┐  ┌─────────────────────────┐
│  Created   │─►│  PENDING_VERIFICATION   │ ← Signed up, email not verified
└────────────┘  └───────────┬─────────────┘
                            │ verifies email
                            ▼
                 ┌──────────────────┐
       ┌────────│      ACTIVE      │◄──────────┐
       │        └─────┬────────────┘           │
       │              │                         │
       │ self-deactivate                        │ reactivate
       │              ▼                         │
       │    ┌──────────────────┐                │
       │    │    INACTIVE      │────────────────┘
       │    └──────────────────┘
       │
       │ admin action
       ▼
┌──────────────────┐        admin lifts
│    SUSPENDED     │ ─────────────────────────►  ACTIVE
└──────────────────┘
       │
       │ (or user requests deletion from any state)
       ▼
┌────────────────────┐
│  PENDING_DELETION  │ ← 30-day grace period
└──────────┬─────────┘
           │ grace period expires / admin force-delete
           ▼
┌──────────────────┐
│     DELETED      │ ← Data anonymized, account gone
└──────────────────┘
```



---

## Cross-Module Integration

### Integration Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      CROSS-MODULE INTEGRATION MAP                             │
│                                                                               │
│  ┌────────┐ authenticates ┌─────────────┐ scoped by ┌──────────┐           │
│  │  auth   │──────────────►│ permissions │◄──────────│ tenants  │           │
│  └───┬────┘               └──────┬──────┘            └─────┬────┘           │
│      │                           │                          │                │
│      │ session for               │ roles for                │ membership    │
│      ▼                           ▼                          ▼                │
│  ┌────────┐               ┌──────────────┐           ┌──────────┐           │
│  │ users  │◄──────────────│ permissions  │           │ tenants  │           │
│  └───┬────┘  user context └──────────────┘           └─────┬────┘           │
│      │                                                      │                │
│      │ identity for                        venture config   │                │
│      ▼                                                      ▼                │
│  ┌────────┐                                          ┌──────────┐           │
│  │  sso   │◄─────────────────────────────────────────│ tenants  │           │
│  └────────┘  enterprise SSO config per venture       └──────────┘           │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  CONTEXT PROPAGATION (via @mcv/kernel AsyncLocalStorage)               │  │
│  │                                                                        │  │
│  │  Request → Tenant Resolution → Auth Verification → Permission Load    │  │
│  │  → Context { user, venture, workspace, roles, permissions }           │  │
│  │  → Available to ALL downstream handlers and services                   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### auth ↔ permissions

When a user authenticates, the auth submodule:

1. Verifies identity (JWT, passkey, password, etc.)
2. Loads the user's roles for the current venture from `permissions`
3. Computes effective permissions (role-based + policy-based)
4. Embeds roles and permissions in the JWT custom claims
5. Populates the request context for downstream permission checks

```typescript
// auth calls permissions during token generation
const roles = await permissionService.getUserRoles(userId, ventureId);
const permissions = await permissionService.getEffectivePermissions(userId, ventureId);

const customClaims = {
  mcv: {
    venture_id: ventureId,
    roles: roles.map(r => r.name),
    permissions: permissions.map(p => p.toString()),
    mfa_verified: mfaVerified,
    session_id: sessionId,
  },
};
```

### tenants ↔ users

Users exist globally but participate in ventures through memberships:

```typescript
// Users scoped to a venture
const ventureUsers = await userService.search({ ventureId: currentVentureId, status: 'active' });

// All ventures a user belongs to
const userVentures = await tenantService.getUserVentures(userId);

// Venture-specific profile (global defaults merged with overrides)
const profile = await userService.getProfile(userId, ventureId);
```

### auth ↔ sso

Enterprise SSO flows through both modules:

```typescript
// SSO callback
const ssoResult = await ssoService.handleCallback(provider, callbackData);
const resolution = await identityResolver.resolve(ssoResult.externalIdentity);

if (resolution.action === 'provision') {
  const user = await jitProvisioner.provision(ssoConfig, ssoResult.assertion);
  return authService.createSession(user.id, ventureId);
}

if (resolution.action === 'login' || resolution.action === 'link_and_login') {
  return authService.createSession(resolution.userId!, ventureId);
}
```

### Context Propagation to Kernel

All identity context is propagated via `@mcv/kernel`'s `AsyncLocalStorage`:

```typescript
// src/context/identity-context.ts

export interface IdentityContext {
  user: AuthenticatedUser;
  tenant: TenantContext;
  session: { id: string; mfaVerified: boolean; impersonating: boolean };
  permissions: {
    roles: string[];
    permissions: string[];
    check: (p: Permission) => Promise<boolean>;
  };
}

/** Middleware: sets up full identity context for the request. */
export function identityContextMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user');
    const tenant = c.get('tenant');
    if (!user || !tenant) return next();

    const ctx: IdentityContext = {
      user,
      tenant,
      session: {
        id: user.sessionId,
        mfaVerified: user.mfaVerified,
        impersonating: !!user.impersonatorId,
      },
      permissions: {
        roles: user.roles,
        permissions: user.permissions,
        check: (p) => permissionChecker.check({ user, permission: p, context: { ventureId: tenant.venture.id } }),
      },
    };

    await runWithContext(ctx, next);
  };
}

/** Access the current identity from anywhere in the call stack. */
export function getCurrentIdentity(): IdentityContext {
  const ctx = getContext<IdentityContext>();
  if (!ctx) throw new AuthenticationError('No identity context');
  return ctx;
}

export function getCurrentUser(): AuthenticatedUser { return getCurrentIdentity().user; }
export function getCurrentVenture(): Venture { return getCurrentIdentity().tenant.venture; }
```

---

## Key Interfaces & Types

### Consolidated Type Definitions

```typescript
// src/types/index.ts

// ═══ Authentication ═══════════════════════════════════════════

export interface AuthenticatedUser {
  id: UserID;
  email: string;
  roles: string[];
  permissions: string[];
  globalRole?: string;
  mfaVerified: boolean;
  ventureId?: VentureID;
  workspaceId?: string;
  sessionId: string;
  impersonatorId?: string;
}

export interface LoginResult {
  user: User;
  session: Session;
  tokens: TokenPair;
  requiresMFA: boolean;
  mfaMethods?: MFAMethod[];
}

export interface RegistrationResult {
  user: User;
  session?: Session;
  tokens?: TokenPair;
  requiresVerification: boolean;
}

// ═══ Authorization ════════════════════════════════════════════

export interface PermissionCheckRequest {
  user: AuthenticatedUser;
  permission: Permission;
  resource?: ResourceDescriptor;
  context: PermissionContext;
}

export interface PermissionContext {
  ventureId?: VentureID;
  workspaceId?: string;
  ipAddress?: string;
}

export interface EffectivePermissions {
  roles: string[];
  permissions: string[];
  check: (p: Permission) => Promise<boolean>;
}

export interface PolicyRequest {
  user: Record<string, unknown>;
  resource?: Record<string, unknown>;
  context: Record<string, unknown>;
  environment: Record<string, unknown>;
}

export interface PolicyDecision {
  decision: 'allow' | 'deny' | 'not_applicable';
  reason?: string;
  evaluations: PolicyEvaluation[];
}

export interface PolicyEvaluation {
  policyId: string;
  policyName: string;
  effect: 'allow' | 'deny';
  priority: number;
}

// ═══ Tenants ══════════════════════════════════════════════════

export interface VentureContext {
  venture: Venture;
  membership: VentureMembership;
  roles: string[];
  permissions: Permission[];
}

// ═══ Users ════════════════════════════════════════════════════

export interface CreateUserParams {
  email: string;
  password?: string;
  username?: string;
  phone?: string;
  emailVerified?: boolean;
  profile: {
    firstName: string;
    lastName: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    timezone?: string;
    locale?: string;
  };
}

export interface UserSearchParams {
  query?: string;
  status?: UserStatus;
  ventureId?: VentureID;
  role?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  sortBy?: 'created' | 'name' | 'lastActive';
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ═══ SSO ══════════════════════════════════════════════════════

export interface SSOCallbackResult {
  externalIdentity: ExternalIdentity;
  assertion: SSOAssertion;
  ssoConfigId: string;
}
```

---

## Database Schema

All tables defined via **Drizzle ORM** with **Zod** validation schemas auto-generated. PostgreSQL 16+ with Row-Level Security.

### Entity-Relationship Diagram

```
┌──────────────┐       ┌────────────────────┐       ┌──────────────────┐
│    users     │       │venture_memberships │       │    ventures      │
├──────────────┤       ├────────────────────┤       ├──────────────────┤
│ id (PK)      │◄──────┤ user_id (FK)       │       │ id (PK)          │
│ supabase_id  │       │ venture_id (FK)    ├──────►│ slug (UQ)        │
│ email (UQ)   │       │ roles []           │       │ name             │
│ username (UQ)│       │ custom_permissions │       │ domain (UQ)      │
│ profile (J)  │       │ profile_overrides  │       │ status           │
│ status       │       │ status             │       │ plan             │
│ password_hash│       │ invited_by (FK)    │       │ branding (J)     │
│ mfa_enabled  │       └────────────────────┘       │ settings (J)     │
│ created_at   │                                     │ limits (J)       │
└──────┬───────┘       ┌────────────────────┐       │ owner_id (FK)    │
       │               │    workspaces      │       └──────────────────┘
       │               ├────────────────────┤
       │               │ id (PK)            │
       │               │ venture_id (FK)    ├──────►(ventures)
       │               │ slug               │
       │               │ name               │
       │               │ parent_id (FK)     ├──────►(self)
       │               │ path               │
       │               │ visibility         │
       │               │ created_by (FK)    ├──────►(users)
       │               └────────────────────┘
       │
       ├──► sessions
       │    ├── id, user_id, venture_id, device_id
       │    ├── refresh_token_hash, token_family
       │    ├── is_active, termination_reason
       │    ├── risk_score, mfa_verified, auth_factors []
       │    ├── ip_address, user_agent, geo_location (J)
       │    └── created_at, expires_at, last_activity_at
       │
       ├──► passkeys
       │    ├── id, user_id, credential_id (UQ)
       │    ├── public_key, counter, transports []
       │    └── friendly_name, created_at, last_used_at
       │
       ├──► linked_accounts
       │    ├── id, user_id, provider, provider_id
       │    ├── sso_config_id (FK), provider_profile (J)
       │    ├── access_token (enc), refresh_token (enc)
       │    └── status, linked_at, last_used_at
       │
       ├──► mfa_enrollments
       │    ├── id, user_id, type, secret (enc), status
       │    └── created_at
       │
       ├──► mfa_backup_codes
       │    ├── id, user_id, code_hash, used_at
       │    └── (one-time use)
       │
       ├──► user_preferences
       │    ├── user_id (PK), venture_id
       │    ├── notifications (J), ui (J), privacy (J)
       │    └── default_venture_id, default_workspace_id
       │
       └──► invitations
            ├── id, venture_id, workspace_id
            ├── email, existing_user_id, roles []
            ├── token (UQ), expires_at
            ├── invited_by, status
            └── sent_at, viewed_at, accepted_at

┌────────────────────┐   ┌────────────────────────┐
│     policies       │   │ enterprise_sso_configs  │
├────────────────────┤   ├────────────────────────┤
│ id (PK)            │   │ id (PK)                │
│ venture_id (FK)    │   │ venture_id (FK)        │
│ name, description  │   │ name, type (saml/oidc) │
│ conditions (J)     │   │ saml_config (J)        │
│ effect, permissions│   │ oidc_config (J)        │
│ priority, enabled  │   │ attribute_mapping (J)  │
│ created_by (FK)    │   │ provisioning (J)       │
└────────────────────┘   │ domains [], enabled    │
                         └────────────────────────┘

┌────────────────────┐   ┌────────────────────────┐
│  revoked_tokens    │   │ impersonation_sessions │
├────────────────────┤   ├────────────────────────┤
│ token_hash, family │   │ impersonator_id (FK)   │
│ user_id, revoked_at│   │ impersonated_id (FK)   │
└────────────────────┘   │ venture_id, reason     │
                         │ permissions [], started │
┌────────────────────┐   │ expires_at, ended_at   │
│  audit_events      │   └────────────────────────┘
├────────────────────┤
│ id, event_type     │   ┌────────────────────────┐
│ user_id, venture_id│   │  password_history      │
│ ip_address, success│   ├────────────────────────┤
│ failure_reason     │   │ user_id, password_hash  │
│ metadata (J)       │   │ created_at             │
│ created_at         │   └────────────────────────┘
└────────────────────┘
```

### Drizzle Schema Definitions

```typescript
// src/schema/users.ts
export const users = pgTable('users', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  supabaseId:         uuid('supabase_id').notNull().unique(),
  email:              varchar('email', { length: 255 }).notNull().unique(),
  emailVerified:      boolean('email_verified').notNull().default(false),
  phone:              varchar('phone', { length: 20 }),
  phoneVerified:      boolean('phone_verified').notNull().default(false),
  username:           varchar('username', { length: 50 }).unique(),
  profile:            jsonb('profile').notNull().$type<UserProfile>(),
  passwordHash:       text('password_hash'),
  mfaEnabled:         boolean('mfa_enabled').notNull().default(false),
  mfaMethods:         jsonb('mfa_methods').notNull().default([]).$type<MFAMethod[]>(),
  passkeyCount:       integer('passkey_count').notNull().default(0),
  status:             varchar('status', { length: 30 }).notNull().default('pending_verification'),
  failedLoginAttempts:integer('failed_login_attempts').notNull().default(0),
  lockedUntil:        timestamp('locked_until'),
  lastLoginAt:        timestamp('last_login_at'),
  lastActivityAt:     timestamp('last_activity_at'),
  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
  deletedAt:          timestamp('deleted_at'),
});

// src/schema/ventures.ts
export const ventures = pgTable('ventures', {
  id:                uuid('id').primaryKey().defaultRandom(),
  slug:              varchar('slug', { length: 100 }).notNull().unique(),
  name:              varchar('name', { length: 255 }).notNull(),
  domain:            varchar('domain', { length: 255 }).notNull().unique(),
  additionalDomains: jsonb('additional_domains').notNull().default([]).$type<string[]>(),
  description:       text('description'),
  status:            varchar('status', { length: 20 }).notNull().default('active'),
  plan:              varchar('plan', { length: 20 }).notNull().default('free'),
  branding:          jsonb('branding').notNull().$type<VentureBranding>(),
  settings:          jsonb('settings').notNull().$type<VentureSettings>(),
  limits:            jsonb('limits').notNull().$type<VentureLimits>(),
  ownerId:           uuid('owner_id').notNull().references(() => users.id),
  createdAt:         timestamp('created_at').notNull().defaultNow(),
  updatedAt:         timestamp('updated_at').notNull().defaultNow(),
});

// src/schema/venture-memberships.ts
export const ventureMemberships = pgTable('venture_memberships', {
  id:                uuid('id').primaryKey().defaultRandom(),
  userId:            uuid('user_id').notNull().references(() => users.id),
  ventureId:         uuid('venture_id').notNull().references(() => ventures.id),
  roles:             jsonb('roles').notNull().$type<string[]>(),
  customPermissions: jsonb('custom_permissions').notNull().default([]).$type<string[]>(),
  profileOverrides:  jsonb('profile_overrides').$type<Partial<UserProfile>>(),
  invitedBy:         uuid('invited_by').references(() => users.id),
  invitedAt:         timestamp('invited_at'),
  acceptedAt:        timestamp('accepted_at'),
  status:            varchar('status', { length: 20 }).notNull().default('active'),
  createdAt:         timestamp('created_at').notNull().defaultNow(),
  updatedAt:         timestamp('updated_at').notNull().defaultNow(),
});

// src/schema/sessions.ts
export const sessions = pgTable('sessions', {
  id:                uuid('id').primaryKey().defaultRandom(),
  userId:            uuid('user_id').notNull().references(() => users.id),
  ventureId:         uuid('venture_id').notNull().references(() => ventures.id),
  deviceId:          varchar('device_id', { length: 255 }).notNull(),
  refreshTokenHash:  varchar('refresh_token_hash', { length: 255 }).notNull(),
  tokenFamily:       varchar('token_family', { length: 255 }).notNull(),
  isActive:          boolean('is_active').notNull().default(true),
  terminationReason: varchar('termination_reason', { length: 50 }),
  riskScore:         integer('risk_score').notNull().default(0),
  mfaVerified:       boolean('mfa_verified').notNull().default(false),
  authFactors:       jsonb('auth_factors').notNull().default([]).$type<string[]>(),
  ipAddress:         varchar('ip_address', { length: 45 }).notNull(),
  userAgent:         text('user_agent').notNull(),
  geoLocation:       jsonb('geo_location').$type<GeoLocation>(),
  createdAt:         timestamp('created_at').notNull().defaultNow(),
  expiresAt:         timestamp('expires_at').notNull(),
  lastActivityAt:    timestamp('last_activity_at').notNull().defaultNow(),
  lastRefreshedAt:   timestamp('last_refreshed_at').notNull().defaultNow(),
});

// src/schema/passkeys.ts
export const passkeys = pgTable('passkeys', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').notNull().references(() => users.id),
  credentialId: text('credential_id').notNull().unique(),
  publicKey:    text('public_key').notNull(),
  counter:      integer('counter').notNull().default(0),
  transports:   jsonb('transports').notNull().default([]).$type<string[]>(),
  friendlyName: varchar('friendly_name', { length: 100 }).notNull(),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  lastUsedAt:   timestamp('last_used_at').notNull().defaultNow(),
});

// src/schema/workspaces.ts
export const workspaces = pgTable('workspaces', {
  id:          uuid('id').primaryKey().defaultRandom(),
  ventureId:   uuid('venture_id').notNull().references(() => ventures.id),
  slug:        varchar('slug', { length: 100 }).notNull(),
  name:        varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  parentId:    uuid('parent_id').references(() => workspaces.id),
  path:        varchar('path', { length: 500 }).notNull(),
  visibility:  varchar('visibility', { length: 20 }).notNull().default('public'),
  settings:    jsonb('settings').notNull().$type<WorkspaceSettings>(),
  createdBy:   uuid('created_by').notNull().references(() => users.id),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
});

// src/schema/policies.ts
export const policies = pgTable('policies', {
  id:          uuid('id').primaryKey().defaultRandom(),
  ventureId:   uuid('venture_id').references(() => ventures.id),
  name:        varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  conditions:  jsonb('conditions').notNull().$type<PolicyCondition[]>(),
  effect:      varchar('effect', { length: 10 }).notNull(),
  permissions: jsonb('permissions').notNull().$type<string[]>(),
  priority:    integer('priority').notNull().default(0),
  enabled:     boolean('enabled').notNull().default(true),
  createdBy:   uuid('created_by').notNull().references(() => users.id),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
});

// src/schema/enterprise-sso-configs.ts
export const enterpriseSSOConfigs = pgTable('enterprise_sso_configs', {
  id:               uuid('id').primaryKey().defaultRandom(),
  ventureId:        uuid('venture_id').notNull().references(() => ventures.id),
  name:             varchar('name', { length: 255 }).notNull(),
  type:             varchar('type', { length: 10 }).notNull(),
  samlConfig:       jsonb('saml_config').$type<EnterpriseSSOConfig['saml']>(),
  oidcConfig:       jsonb('oidc_config').$type<EnterpriseSSOConfig['oidc']>(),
  attributeMapping: jsonb('attribute_mapping').notNull(),
  provisioning:     jsonb('provisioning').notNull(),
  domains:          jsonb('domains').notNull().default([]).$type<string[]>(),
  enabled:          boolean('enabled').notNull().default(false),
  verifiedAt:       timestamp('verified_at'),
  createdBy:        uuid('created_by').notNull().references(() => users.id),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
});

// src/schema/linked-accounts.ts
export const linkedAccounts = pgTable('linked_accounts', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().references(() => users.id),
  provider:        varchar('provider', { length: 50 }).notNull(),
  providerId:      varchar('provider_id', { length: 255 }).notNull(),
  ssoConfigId:     uuid('sso_config_id').references(() => enterpriseSSOConfigs.id),
  providerProfile: jsonb('provider_profile').notNull(),
  accessToken:     text('access_token'),
  refreshToken:    text('refresh_token'),
  tokenExpiresAt:  timestamp('token_expires_at'),
  status:          varchar('status', { length: 20 }).notNull().default('active'),
  linkedAt:        timestamp('linked_at').notNull().defaultNow(),
  lastUsedAt:      timestamp('last_used_at').notNull().defaultNow(),
  revokedAt:       timestamp('revoked_at'),
});

// src/schema/invitations.ts
export const invitations = pgTable('invitations', {
  id:             uuid('id').primaryKey().defaultRandom(),
  ventureId:      uuid('venture_id').notNull().references(() => ventures.id),
  workspaceId:    uuid('workspace_id').references(() => workspaces.id),
  email:          varchar('email', { length: 255 }).notNull(),
  existingUserId: uuid('existing_user_id').references(() => users.id),
  roles:          jsonb('roles').notNull().$type<string[]>(),
  message:        text('message'),
  token:          varchar('token', { length: 255 }).notNull().unique(),
  expiresAt:      timestamp('expires_at').notNull(),
  invitedBy:      uuid('invited_by').notNull().references(() => users.id),
  status:         varchar('status', { length: 20 }).notNull().default('pending'),
  sentAt:         timestamp('sent_at').notNull().defaultNow(),
  viewedAt:       timestamp('viewed_at'),
  acceptedAt:     timestamp('accepted_at'),
  declinedAt:     timestamp('declined_at'),
  resendCount:    integer('resend_count').notNull().default(0),
  lastResentAt:   timestamp('last_resent_at'),
});

// src/schema/audit-events.ts
export const auditEvents = pgTable('audit_events', {
  id:            uuid('id').primaryKey().defaultRandom(),
  eventType:     varchar('event_type', { length: 100 }).notNull(),
  userId:        uuid('user_id'),
  ventureId:     uuid('venture_id'),
  ipAddress:     varchar('ip_address', { length: 45 }),
  userAgent:     text('user_agent'),
  success:       boolean('success').notNull(),
  failureReason: text('failure_reason'),
  metadata:      jsonb('metadata').notNull().default({}),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
});

// src/schema/impersonation-sessions.ts
export const impersonationSessions = pgTable('impersonation_sessions', {
  id:              uuid('id').primaryKey().defaultRandom(),
  impersonatorId:  uuid('impersonator_id').notNull().references(() => users.id),
  impersonatedId:  uuid('impersonated_id').notNull().references(() => users.id),
  ventureId:       uuid('venture_id').notNull().references(() => ventures.id),
  permissions:     jsonb('permissions').notNull().$type<string[]>(),
  restrictedActions:jsonb('restricted_actions').notNull().$type<string[]>(),
  reason:          text('reason').notNull(),
  approvedBy:      uuid('approved_by').references(() => users.id),
  startedAt:       timestamp('started_at').notNull().defaultNow(),
  expiresAt:       timestamp('expires_at').notNull(),
  endedAt:         timestamp('ended_at'),
});
```

### Key Indexes

```sql
-- Users
CREATE INDEX idx_users_email        ON users (email);
CREATE INDEX idx_users_supabase     ON users (supabase_id);
CREATE INDEX idx_users_status       ON users (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username     ON users (username) WHERE username IS NOT NULL;

-- Memberships
CREATE INDEX idx_memberships_user    ON venture_memberships (user_id, status);
CREATE INDEX idx_memberships_venture ON venture_memberships (venture_id, status);
CREATE UNIQUE INDEX idx_memberships_uq ON venture_memberships (user_id, venture_id);

-- Sessions
CREATE INDEX idx_sessions_user      ON sessions (user_id, is_active);
CREATE INDEX idx_sessions_venture   ON sessions (venture_id, is_active);
CREATE INDEX idx_sessions_expires   ON sessions (expires_at) WHERE is_active = true;
CREATE INDEX idx_sessions_family    ON sessions (token_family);

-- Passkeys
CREATE INDEX idx_passkeys_user      ON passkeys (user_id);

-- Linked accounts
CREATE INDEX idx_linked_user        ON linked_accounts (user_id, status);
CREATE UNIQUE INDEX idx_linked_prov ON linked_accounts (provider, provider_id);

-- Invitations
CREATE INDEX idx_inv_email          ON invitations (email, status);
CREATE INDEX idx_inv_venture        ON invitations (venture_id, status);

-- Audit
CREATE INDEX idx_audit_user         ON audit_events (user_id, created_at DESC);
CREATE INDEX idx_audit_venture      ON audit_events (venture_id, created_at DESC);
CREATE INDEX idx_audit_type         ON audit_events (event_type, created_at DESC);

-- Workspaces
CREATE INDEX idx_ws_venture         ON workspaces (venture_id);
CREATE INDEX idx_ws_path            ON workspaces USING gist (path gist_trgm_ops);

-- Policies
CREATE INDEX idx_policies_venture   ON policies (venture_id, enabled);

-- SSO configs
CREATE INDEX idx_sso_venture        ON enterprise_sso_configs (venture_id, enabled);
CREATE INDEX idx_sso_domains        ON enterprise_sso_configs USING gin (domains);
```



---

## Event Types

All identity events are published to the kernel event bus for consumption by audit logging, analytics, notifications, and other subscribers. Events are immutable - they can never be modified or deleted.

### Event Naming Convention

```
domain.entity.action

Examples:
  auth.session.created
  user.invitation.accepted
  tenant.venture.plan_changed
  sso.user.provisioned
  permission.role.assigned
```

### Event Catalog

```typescript
// src/events/identity-events.ts

export type IdentityEvent =
  // ── User Lifecycle ──────────────────────────────────────
  | { type: 'user.created';               payload: { userId: string; email: string; status: string } }
  | { type: 'user.profile.updated';       payload: { userId: string; fields: string[] } }
  | { type: 'user.status.changed';        payload: { userId: string; from: string; to: string; reason?: string } }
  | { type: 'user.email.changed';         payload: { userId: string; oldEmail: string; newEmail: string } }
  | { type: 'user.email.verified';        payload: { userId: string; email: string } }
  | { type: 'user.phone.verified';        payload: { userId: string; phone: string } }
  | { type: 'user.deletion.requested';    payload: { userId: string; gracePeriodEnds: Date } }
  | { type: 'user.deletion.cancelled';    payload: { userId: string } }
  | { type: 'user.deleted';               payload: { userId: string } }
  | { type: 'user.suspended';             payload: { userId: string; reason: string; suspendedBy: string } }
  | { type: 'user.unsuspended';           payload: { userId: string; unsuspendedBy: string } }

  // ── Invitations ─────────────────────────────────────────
  | { type: 'user.invitation.sent';       payload: { invitationId: string; ventureId: string; email: string; invitedBy: string } }
  | { type: 'user.invitation.accepted';   payload: { invitationId: string; userId: string; ventureId: string } }
  | { type: 'user.invitation.declined';   payload: { invitationId: string; email: string; ventureId: string } }
  | { type: 'user.invitation.expired';    payload: { invitationId: string; email: string } }
  | { type: 'user.invitation.revoked';    payload: { invitationId: string; revokedBy: string } }

  // ── Authentication ──────────────────────────────────────
  | { type: 'auth.login.success';         payload: { userId: string; method: string; ventureId: string; ip: string } }
  | { type: 'auth.login.failure';         payload: { email: string; reason: string; ip: string } }
  | { type: 'auth.logout';                payload: { userId: string; sessionId: string } }
  | { type: 'auth.password.changed';      payload: { userId: string } }
  | { type: 'auth.password.reset.requested'; payload: { userId: string; email: string } }
  | { type: 'auth.password.reset.completed'; payload: { userId: string } }

  // ── Sessions ────────────────────────────────────────────
  | { type: 'auth.session.created';       payload: { sessionId: string; userId: string; ventureId: string; authFactors: string[]; ipAddress: string } }
  | { type: 'auth.session.refreshed';     payload: { sessionId: string; userId: string } }
  | { type: 'auth.session.terminated';    payload: { sessionId: string; reason: string } }
  | { type: 'auth.session.all_terminated';payload: { userId: string; reason: string; count: number } }

  // ── MFA ─────────────────────────────────────────────────
  | { type: 'auth.mfa.enrolled';          payload: { userId: string; method: string } }
  | { type: 'auth.mfa.removed';           payload: { userId: string; method: string } }
  | { type: 'auth.mfa.verified';          payload: { userId: string; method: string } }
  | { type: 'auth.mfa.failed';            payload: { userId: string; method: string } }
  | { type: 'auth.mfa.backup_codes_low';  payload: { userId: string; remaining: number } }
  | { type: 'auth.mfa.backup_code_used';  payload: { userId: string; remaining: number } }

  // ── Passkeys ────────────────────────────────────────────
  | { type: 'auth.passkey.registered';    payload: { userId: string; passkeyId: string } }
  | { type: 'auth.passkey.removed';       payload: { userId: string; passkeyId: string } }
  | { type: 'auth.passkey.used';          payload: { userId: string; passkeyId: string } }

  // ── Security ────────────────────────────────────────────
  | { type: 'auth.security.token_reuse';  payload: { userId: string; tokenFamily: string; ipAddress: string } }
  | { type: 'auth.security.brute_force';  payload: { email: string; ip: string; attempts: number } }
  | { type: 'auth.security.account_locked'; payload: { userId: string; duration: number } }
  | { type: 'auth.security.impossible_travel'; payload: { userId: string; from: string; to: string; distanceKm: number } }
  | { type: 'auth.security.suspicious';   payload: { userId: string; details: string; riskScore: number } }

  // ── Impersonation ───────────────────────────────────────
  | { type: 'auth.impersonation.started'; payload: { impersonatorId: string; impersonatedId: string; ventureId: string; reason: string; sessionId: string } }
  | { type: 'auth.impersonation.ended';   payload: { impersonatorId: string; impersonatedId: string; sessionId: string } }

  // ── Tenants ─────────────────────────────────────────────
  | { type: 'tenant.venture.created';     payload: { ventureId: string; slug: string; ownerId: string; plan: string } }
  | { type: 'tenant.venture.updated';     payload: { ventureId: string; fields: string[] } }
  | { type: 'tenant.venture.suspended';   payload: { ventureId: string; reason: string } }
  | { type: 'tenant.venture.deleted';     payload: { ventureId: string; deletedBy: string } }
  | { type: 'tenant.venture.plan_changed';payload: { ventureId: string; from: string; to: string } }
  | { type: 'tenant.workspace.created';   payload: { workspaceId: string; ventureId: string; createdBy: string } }
  | { type: 'tenant.workspace.deleted';   payload: { workspaceId: string; ventureId: string; deletedBy: string } }
  | { type: 'tenant.membership.created';  payload: { userId: string; ventureId: string; roles: string[] } }
  | { type: 'tenant.membership.updated';  payload: { userId: string; ventureId: string; roles: string[] } }
  | { type: 'tenant.membership.removed';  payload: { userId: string; ventureId: string; reason: string } }

  // ── SSO ─────────────────────────────────────────────────
  | { type: 'sso.session.created';        payload: { globalSessionId: string; userId: string; originVentureId: string; ventureCount: number } }
  | { type: 'sso.session.terminated';     payload: { globalSessionId: string; reason: string } }
  | { type: 'sso.user.provisioned';       payload: { userId: string; ventureId: string; ssoConfigId: string; provider: string } }
  | { type: 'sso.user.deprovisioned';     payload: { userId: string; ventureId: string; ssoConfigId: string } }
  | { type: 'sso.config.created';         payload: { ssoConfigId: string; ventureId: string; type: string } }
  | { type: 'sso.config.updated';         payload: { ssoConfigId: string; ventureId: string } }
  | { type: 'sso.config.enabled';         payload: { ssoConfigId: string; ventureId: string } }
  | { type: 'sso.config.disabled';        payload: { ssoConfigId: string; ventureId: string } }
  | { type: 'sso.account.linked';         payload: { userId: string; provider: string; providerId: string } }
  | { type: 'sso.account.unlinked';       payload: { userId: string; provider: string } }

  // ── Permissions ─────────────────────────────────────────
  | { type: 'permission.check.denied';    payload: { userId: string; permission: string; ventureId: string; resource?: string } }
  | { type: 'permission.role.assigned';   payload: { userId: string; ventureId: string; role: string; assignedBy: string } }
  | { type: 'permission.role.removed';    payload: { userId: string; ventureId: string; role: string; removedBy: string } }
  | { type: 'permission.policy.created';  payload: { policyId: string; ventureId: string; name: string } }
  | { type: 'permission.policy.updated';  payload: { policyId: string; ventureId: string } }
  | { type: 'permission.policy.deleted';  payload: { policyId: string; ventureId: string } };
```

### Event Envelope

Every event is wrapped in a standard envelope:

```typescript
export interface EventEnvelope<T extends IdentityEvent> {
  id: string;               // UUIDv7 (time-sortable)
  type: T['type'];
  payload: T['payload'];
  source: '@mcv/identity';
  timestamp: Date;
  correlationId: string;    // Request trace ID
  causationId?: string;     // Event that caused this one
  version: 1;               // Schema version for evolution
}
```

---

## Configuration Reference

All configuration is loaded via `@mcv/kernel`'s config module and validated with **Zod** at startup. Missing or invalid values cause a hard crash - fail fast, fail loud.

```typescript
// src/config/identity-config.ts

import { z } from 'zod';

export const IdentityConfigSchema = z.object({
  // ── Supabase ────────────────────────────────────────────
  SUPABASE_URL:               z.string().url(),
  SUPABASE_ANON_KEY:          z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY:  z.string().min(1),
  SUPABASE_JWT_SECRET:        z.string().min(32),

  // ── WebAuthn / Passkeys ─────────────────────────────────
  WEBAUTHN_RP_ID:     z.string().default('mcv.one'),
  WEBAUTHN_ORIGIN:    z.string().url().default('https://mcv.one'),
  WEBAUTHN_RP_NAME:   z.string().default('MCV.ONE'),

  // ── Session ─────────────────────────────────────────────
  SESSION_MAX_CONCURRENT:           z.coerce.number().default(10),
  SESSION_IDLE_TIMEOUT_MINUTES:     z.coerce.number().default(60),
  SESSION_MAX_LIFETIME_HOURS:       z.coerce.number().default(720),
  SESSION_REAUTH_WINDOW_MINUTES:    z.coerce.number().default(15),

  // ── Tokens ──────────────────────────────────────────────
  ACCESS_TOKEN_EXPIRES_SECONDS:     z.coerce.number().default(900),
  REFRESH_TOKEN_EXPIRES_SECONDS:    z.coerce.number().default(2_592_000),
  REFRESH_TOKEN_REUSE_WINDOW_SEC:   z.coerce.number().default(10),

  // ── Password Policy ─────────────────────────────────────
  PASSWORD_MIN_LENGTH:              z.coerce.number().default(12),
  PASSWORD_MAX_LENGTH:              z.coerce.number().default(128),
  PASSWORD_REQUIRE_UPPERCASE:       z.coerce.boolean().default(true),
  PASSWORD_REQUIRE_LOWERCASE:       z.coerce.boolean().default(true),
  PASSWORD_REQUIRE_DIGIT:           z.coerce.boolean().default(true),
  PASSWORD_REQUIRE_SPECIAL:         z.coerce.boolean().default(true),
  PASSWORD_CHECK_BREACHED:          z.coerce.boolean().default(true),
  PASSWORD_PREVENT_REUSE_COUNT:     z.coerce.number().default(12),
  PASSWORD_MAX_FAILED_ATTEMPTS:     z.coerce.number().default(5),
  PASSWORD_LOCKOUT_MINUTES:         z.coerce.number().default(30),

  // ── MFA ─────────────────────────────────────────────────
  MFA_TOTP_ISSUER:         z.string().default('MCV.ONE'),
  MFA_TOTP_ALGORITHM:      z.enum(['sha1', 'sha256', 'sha512']).default('sha256'),
  MFA_TOTP_PERIOD:         z.coerce.number().default(30),
  MFA_TOTP_DIGITS:         z.coerce.number().default(6),
  MFA_BACKUP_CODE_COUNT:   z.coerce.number().default(10),

  // ── Rate Limiting ───────────────────────────────────────
  RATE_LIMIT_LOGIN_MAX:                z.coerce.number().default(5),
  RATE_LIMIT_LOGIN_WINDOW_MIN:        z.coerce.number().default(15),
  RATE_LIMIT_REGISTER_MAX:            z.coerce.number().default(3),
  RATE_LIMIT_REGISTER_WINDOW_MIN:     z.coerce.number().default(60),
  RATE_LIMIT_PW_RESET_MAX:            z.coerce.number().default(3),
  RATE_LIMIT_PW_RESET_WINDOW_MIN:     z.coerce.number().default(60),
  RATE_LIMIT_MFA_VERIFY_MAX:          z.coerce.number().default(5),
  RATE_LIMIT_MFA_VERIFY_WINDOW_MIN:   z.coerce.number().default(5),
  RATE_LIMIT_TOKEN_REFRESH_MAX:       z.coerce.number().default(60),
  RATE_LIMIT_TOKEN_REFRESH_WINDOW_MIN:z.coerce.number().default(1),

  // ── Encryption ──────────────────────────────────────────
  ENCRYPTION_KEY:              z.string().min(32),
  TOKEN_SIGNING_PRIVATE_KEY:   z.string(),
  TOKEN_SIGNING_PUBLIC_KEY:    z.string(),

  // ── SSO ─────────────────────────────────────────────────
  SSO_SESSION_MAX_LIFETIME_HOURS: z.coerce.number().default(720),
  SSO_AUTO_PROVISION_ENABLED:     z.coerce.boolean().default(true),
  SSO_JIT_PROVISIONING_ENABLED:   z.coerce.boolean().default(true),

  // ── Invitation ──────────────────────────────────────────
  INVITATION_EXPIRY_DAYS:   z.coerce.number().default(7),
  INVITATION_MAX_RESENDS:   z.coerce.number().default(3),

  // ── Impersonation ───────────────────────────────────────
  IMPERSONATION_MAX_DURATION_HOURS:  z.coerce.number().default(1),
  IMPERSONATION_REQUIRE_APPROVAL:    z.coerce.boolean().default(false),

  // ── Risk Engine ─────────────────────────────────────────
  RISK_ENGINE_ENABLED:        z.coerce.boolean().default(true),
  RISK_CHALLENGE_THRESHOLD:   z.coerce.number().default(20),
  RISK_BLOCK_THRESHOLD:       z.coerce.number().default(60),

  // ── Audit ───────────────────────────────────────────────
  AUDIT_LOG_ENABLED:         z.coerce.boolean().default(true),
  AUDIT_RETENTION_YEARS:     z.coerce.number().default(7),

  // ── Feature Flags ───────────────────────────────────────
  FEATURE_PASSKEYS_ENABLED:           z.coerce.boolean().default(true),
  FEATURE_WEBAUTHN_ENABLED:           z.coerce.boolean().default(true),
  FEATURE_MAGIC_LINK_ENABLED:         z.coerce.boolean().default(true),
  FEATURE_ENTERPRISE_SSO_ENABLED:     z.coerce.boolean().default(true),
  FEATURE_CROSS_VENTURE_SSO_ENABLED:  z.coerce.boolean().default(true),
  FEATURE_IMPERSONATION_ENABLED:      z.coerce.boolean().default(true),
  FEATURE_RISK_ENGINE_ENABLED:        z.coerce.boolean().default(true),
});

export type IdentityConfig = z.infer<typeof IdentityConfigSchema>;
```

---

## Security Model

### Defense in Depth (Seven Layers)

```
Layer 1: Network / WAF
    │  DDoS protection, IP reputation, geo-blocking
    ▼
Layer 2: Rate Limiting
    │  Per-endpoint limits, progressive delays, CAPTCHA
    ▼
Layer 3: Risk Assessment
    │  Device fingerprint, geo-velocity, behavioral signals
    ▼
Layer 4: Authentication
    │  JWT verification, session validation, MFA enforcement
    ▼
Layer 5: Authorization
    │  RBAC roles + ABAC policies + gates
    ▼
Layer 6: Row-Level Security
    │  PostgreSQL RLS enforces tenant isolation at DB level
    ▼
Layer 7: Audit Logging
       Every action recorded with full context (7-year retention)
```

### Cryptographic Standards

| Use Case | Algorithm | Parameters | Notes |
|----------|-----------|------------|-------|
| Password hashing | **Argon2id** | m=65536, t=3, p=4 | OWASP recommended; memory-hard |
| Token signing | **EdDSA (Ed25519)** | - | Faster than RSA, smaller keys |
| Session tokens | **CSPRNG** | 256 bits | `crypto.randomBytes(32)` |
| Refresh tokens | **CSPRNG** | 512 bits | Extra entropy for long-lived token |
| Encryption at rest | **AES-256-GCM** | Random IV per encryption | OAuth tokens, SSO secrets |
| Key derivation | **HKDF-SHA-256** | - | Sub-key derivation |
| Token hashing | **SHA-256** | - | Stored refresh token hashes |
| TOTP | **HMAC-SHA-256** | 30 s period, 6 digits | RFC 6238 |

### Password Hashing

```typescript
import argon2 from 'argon2';

const ARGON2_OPTS = {
  type: argon2.argon2id,
  memoryCost: 65536,     // 64 MB
  timeCost: 3,
  parallelism: 4,
  hashLength: 32,
};

export const hashPassword = (pw: string) => argon2.hash(pw, ARGON2_OPTS);
export const verifyPassword = (pw: string, hash: string) => argon2.verify(hash, pw, ARGON2_OPTS);
```

### Token Rotation with Reuse Detection

Refresh tokens implement **rotation with reuse detection**:

```
Normal Flow:
  RT-1 → (use) → RT-2 issued, RT-1 revoked
  RT-2 → (use) → RT-3 issued, RT-2 revoked

Attack Detected:
  RT-1 → (stolen by attacker)
  RT-1 → (attacker uses) → RT-2 issued to attacker, RT-1 revoked
  RT-1 → (user uses revoked RT-1) → ⚠️ REUSE DETECTED
         → Entire token family revoked
         → All sessions in family terminated
         → User must re-authenticate
         → Security alert event emitted
```

### Session Security

| Threat | Protection |
|--------|-----------|
| Token theft | Refresh token rotation + reuse detection |
| Session fixation | New session ID on every authentication |
| Session hijacking | Device binding, IP monitoring, UA check |
| Idle sessions | Configurable idle timeout (default 60 min) |
| Stale sessions | Absolute max lifetime (default 30 days) |
| Concurrent abuse | Max 10 sessions per user per venture |
| Revocation lag | Instant termination via DB + cache invalidation |
| Transport | HTTPS only, `Secure` cookie flag, `SameSite=Strict` |

### Rate Limiting

| Endpoint | Max | Window | On Exceed |
|----------|:---:|:------:|-----------|
| `POST /auth/login` | 5 | 15 min | Block + CAPTCHA |
| `POST /auth/register` | 3 | 1 hour | Block |
| `POST /auth/password-reset` | 3 | 1 hour | Block |
| `POST /auth/mfa/verify` | 5 | 5 min | Lockout 30 min |
| `POST /auth/token/refresh` | 60 | 1 min | Throttle |
| `POST /invitations` | 20 | 1 hour | Throttle |
| `GET /users/search` | 100 | 1 min | Throttle |

### RLS Enforcement

Every tenant-scoped table follows this pattern:

```sql
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {table} FORCE ROW LEVEL SECURITY;

CREATE POLICY {table}_tenant_read ON {table}
  FOR SELECT
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

CREATE POLICY {table}_tenant_write ON {table}
  FOR ALL
  USING (
    venture_id = current_setting('app.current_venture_id')::uuid
    AND (
      created_by = current_setting('app.current_user_id')::uuid
      OR EXISTS (
        SELECT 1 FROM venture_memberships vm
        WHERE vm.user_id = current_setting('app.current_user_id')::uuid
          AND vm.venture_id = current_setting('app.current_venture_id')::uuid
          AND 'admin' = ANY(vm.roles)
      )
    )
  );

CREATE POLICY {table}_service_bypass ON {table}
  USING (current_setting('role') = 'service_role');
```

### Security Headers

```typescript
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options':    'nosniff',
  'X-Frame-Options':           'DENY',
  'X-XSS-Protection':          '0',  // Disabled in favor of CSP
  'Content-Security-Policy':   "default-src 'self'; frame-ancestors 'none'",
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy':'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
} as const;
```

---

## Error Taxonomy

All errors extend `@mcv/kernel`'s `AppError` hierarchy with identity-specific codes:

| Error Class | HTTP Status | Code | Description |
|-------------|:-----------:|------|-------------|
| `AuthenticationError` | 401 | `AUTHENTICATION_ERROR` | Invalid credentials, expired token |
| `ForbiddenError` | 403 | `FORBIDDEN` | Insufficient permissions |
| `ReAuthenticationRequiredError` | 403 | `REAUTH_REQUIRED` | Sensitive op needs fresh auth |
| `MFARequiredError` | 403 | `MFA_REQUIRED` | MFA step not completed |
| `TenantResolutionError` | 400 | `TENANT_RESOLUTION_FAILED` | Cannot determine venture context |
| `AccountLockedError` | 423 | `ACCOUNT_LOCKED` | Too many failed attempts |
| `AccountSuspendedError` | 403 | `ACCOUNT_SUSPENDED` | Admin-imposed suspension |
| `InvitationExpiredError` | 410 | `INVITATION_EXPIRED` | Invitation past expiry |
| `SSOConfigurationError` | 502 | `SSO_CONFIGURATION_ERROR` | Misconfigured IdP |
| `RateLimitExceededError` | 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## Testing Strategy

### Unit Tests

| Area | Coverage Target | Key Scenarios |
|------|:--------------:|---------------|
| Permission resolution | 100% branch | Wildcard matching, scope hierarchy, role inheritance |
| Policy engine | 100% branch | All operators, conflict resolution, deny-overrides |
| Password validation | 100% branch | All rules, breach check, reuse detection |
| Risk engine | 90%+ | All factors, composite scoring, threshold actions |
| Token rotation | 100% | Normal rotation, reuse detection, family revocation |
| Role hierarchy | 100% | Deep inheritance, circular-reference safety |

### Integration Tests

| Flow | Scope |
|------|-------|
| Full auth flows | Each method: passkey, password, magic link, OAuth, SSO |
| Session lifecycle | Create → refresh → touch → terminate |
| Invitation flow | Send → accept → membership created |
| Venture lifecycle | Create → configure → add members → switch |
| RLS enforcement | Cross-tenant read/write attempts must fail |
| SSO flow | Mock IdP → SAML assertion → JIT provision → session |

### Security Tests

| Threat | Test |
|--------|------|
| SQL injection | Parameterized query audit on all search endpoints |
| JWT forgery | Tampered/expired/wrong-audience tokens rejected |
| Token reuse | Stolen refresh token triggers family revocation |
| Cross-tenant access | Venture A user cannot read Venture B data |
| Brute force | Account locked after configured threshold |
| Privilege escalation | Member cannot assign admin role to self |
| Session fixation | Session ID changes on authentication |

---

## Performance Budgets

| Operation | P50 | P99 | Budget |
|-----------|:---:|:---:|:------:|
| JWT verification | 1 ms | 5 ms | < 10 ms |
| Permission check (cached) | 0.5 ms | 2 ms | < 5 ms |
| Session lookup (cache hit) | 0.5 ms | 1 ms | < 2 ms |
| Session lookup (cache miss) | 3 ms | 10 ms | < 15 ms |
| Full auth flow (password) | 50 ms | 150 ms | < 200 ms |
| Full auth flow (passkey) | 20 ms | 80 ms | < 100 ms |
| Tenant context resolution | 1 ms | 5 ms | < 10 ms |
| User search (cached) | 5 ms | 20 ms | < 50 ms |
| Token refresh | 10 ms | 40 ms | < 50 ms |

---

## Migration & Versioning

### Database Migrations

All schema changes flow through Drizzle ORM migrations:

```bash
# Generate migration from schema diff
npx drizzle-kit generate:pg

# Apply pending migrations
npx drizzle-kit push:pg

# Check migration status
npx drizzle-kit check:pg
```

**Rules:**
- Every migration is forward-only (no rollback scripts for production).
- Breaking schema changes require a two-phase deploy (add column → backfill → enforce constraint → drop old).
- RLS policies are versioned alongside table migrations.

### API Versioning

Identity APIs are versioned via path prefix:
- `/api/v1/auth/*` - Current stable
- `/api/v2/auth/*` - Next major version (when breaking changes needed)

Breaking changes require a deprecation notice (30 days minimum) and a documented migration path.

### Event Schema Evolution

Events include a `version` field:
1. New fields → add to payload, bump version
2. Removed fields → deprecation period, then remove in next version
3. Structural changes → publish both old and new versions during transition

---

## Related Documentation

| Document | Path | Description |
|----------|------|-------------|
| Package Specification | `./01-PACKAGE-SPEC.md` | Original package specification |
| Technical Architecture | `./02-TECHNICAL-ARCHITECTURE.md` | System architecture details |
| API Reference | `./03-API-REFERENCE.md` | HTTP API documentation |
| Implementation Plan | `./04-IMPLEMENTATION-PLAN.md` | Sprint-by-sprint build plan |
| auth Submodule | `./auth/MODULE.md` | Deep dive: authentication |
| permissions Submodule | `./permissions/MODULE.md` | Deep dive: authorization |
| tenants Submodule | `./tenants/MODULE.md` | Deep dive: multi-tenancy |
| users Submodule | `./users/MODULE.md` | Deep dive: user management |
| sso Submodule | `./sso/MODULE.md` | Deep dive: single sign-on |

---

*@mcv/identity - Identity & Access Management Layer*
