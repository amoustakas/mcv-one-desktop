# MCV.ONE Security Architecture
## Unified Security Model for Multi-Tenant Agentic OS

**Version:** 1.0
**Last Updated:** March 10, 2026
**Reference:** ADR-001, ADR-003 (Better Auth), T1-Identity MODULE.md files
**Status:** APPROVED
**Classification:** INTERNAL — SENSITIVE

---

## Executive Summary

This document defines the unified security architecture for MCV.ONE — covering authentication, authorization, data isolation, encryption, secrets management, threat modeling, and compliance. As a multi-tenant platform serving 9+ ventures across regulated industries (gambling, finance, healthcare), security is not a feature — it is a foundational constraint that shapes every architectural decision.

---

## 1. Security Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      MCV.ONE SECURITY ARCHITECTURE                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PERIMETER                                                                   │
│  ├── Cloudflare WAF (OWASP, rate limiting, bot detection, DDoS)             │
│  ├── Vercel Edge Middleware (auth token validation, geo-routing)              │
│  └── API Rate Limiting (per-user, per-venture, per-endpoint)                 │
│                                                                              │
│  IDENTITY                                                                    │
│  ├── Better Auth (session management, OAuth, MFA, passkeys)                  │
│  ├── RBAC + ABAC hybrid (role-based + attribute-based access)                │
│  └── Venture isolation (tenant context propagation)                          │
│                                                                              │
│  DATA                                                                        │
│  ├── PostgreSQL RLS (Row-Level Security per venture_id)                      │
│  ├── Column-level encryption (PII fields)                                    │
│  ├── TLS 1.3 in transit (Cloudflare Full Strict)                            │
│  └── AES-256 at rest (Supabase managed + S3 SSE)                            │
│                                                                              │
│  APPLICATION                                                                 │
│  ├── Input validation (Zod schemas on every boundary)                        │
│  ├── Output encoding (React auto-escaping + CSP headers)                     │
│  ├── CSRF protection (SameSite cookies + double-submit)                      │
│  └── Dependency scanning (pnpm audit + GitHub Dependabot)                    │
│                                                                              │
│  MONITORING                                                                  │
│  ├── Audit logging (@mcv/audit — every state-changing operation)             │
│  ├── Anomaly detection (Scout agents — M3+)                                  │
│  ├── Sentry (error + performance monitoring)                                 │
│  └── Incident response runbook                                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication

### 2.1 Better Auth Configuration (ADR-003)

**Decision:** Better Auth was chosen over Auth0/Clerk/Supabase Auth for self-hosted control, multi-tenancy support, and cost efficiency at scale.

```typescript
// packages/auth/src/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,    // Refresh daily
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },

  socialProviders: {
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
  },

  advanced: {
    rateLimit: {
      window: 60,       // 60 seconds
      max: 10,          // 10 attempts per window
      storage: 'redis',
    },
  },
});
```

### 2.2 Authentication Flows

| Flow | Method | MFA Required | Notes |
|------|--------|-------------|-------|
| Email + Password | Better Auth | Configurable per venture | Default for all ventures |
| Google OAuth | OIDC | Optional | Enterprise SSO |
| GitHub OAuth | OAuth 2.0 | Optional | Developer accounts |
| Magic Link | Email token | No | Passwordless option |
| Passkey / WebAuthn | FIDO2 | N/A (inherently MFA) | Strongest authentication |
| API Key | Bearer token | N/A | Service-to-service + external API |

### 2.3 Session Security

| Property | Value | Rationale |
|----------|-------|-----------|
| Token type | JWT (signed) | Stateless verification at edge |
| Signing algorithm | RS256 | Asymmetric; public key can verify without secret |
| Token lifetime | 15 minutes (access) | Short-lived to limit exposure |
| Refresh token | 30 days (httpOnly cookie) | Long-lived, stored server-side |
| Cookie attributes | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` | XSS/CSRF protection |
| Session storage | PostgreSQL (Better Auth sessions table) | Server-side revocation |

### 2.4 Multi-Factor Authentication

```
Supported Methods:
├── TOTP (Time-Based One-Time Password) — Google Authenticator, Authy
├── WebAuthn / Passkeys — Hardware keys, biometric
├── SMS OTP (Twilio) — Backup method only
└── Recovery Codes — 10 single-use codes on MFA setup

Enforcement Policy:
├── Super Admin: MFA REQUIRED (TOTP or WebAuthn)
├── Venture Admin: MFA REQUIRED
├── Standard User: MFA RECOMMENDED (venture-configurable)
└── API Keys: N/A (keys are pre-authenticated)
```

---

## 3. Authorization

### 3.1 RBAC + ABAC Hybrid Model

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AUTHORIZATION MODEL                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  REQUEST ──► Venture Context ──► Role Check ──► Attribute Check ──► ALLOW   │
│                                                                              │
│  Layer 1: VENTURE ISOLATION (mandatory)                                      │
│  └── User must be a member of the target venture                             │
│                                                                              │
│  Layer 2: RBAC (role-based)                                                  │
│  ├── super_admin: Full platform access                                       │
│  ├── venture_admin: Full venture access                                      │
│  ├── manager: Department-level access                                        │
│  ├── member: Standard operations                                             │
│  ├── viewer: Read-only access                                                │
│  └── custom roles: Venture-defined                                           │
│                                                                              │
│  Layer 3: ABAC (attribute-based, optional)                                   │
│  ├── Department membership                                                   │
│  ├── Team assignment                                                         │
│  ├── Resource ownership (created_by)                                         │
│  ├── Time-based access (business hours only)                                 │
│  └── Jurisdiction-based (geo-restricted features)                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Permission Resolution

```typescript
// packages/permissions/src/check.ts
export async function checkPermission(ctx: {
  userId: string;
  ventureId: string;
  resource: string;    // e.g., "crm.contacts"
  action: string;      // e.g., "create", "read", "update", "delete"
  attributes?: Record<string, unknown>;
}): Promise<boolean> {
  // 1. Venture membership check (always first)
  const membership = await getMembership(ctx.userId, ctx.ventureId);
  if (!membership) return false;

  // 2. Super admin bypass
  if (membership.role === 'super_admin') return true;

  // 3. RBAC: Check role permissions
  const rolePermissions = await getRolePermissions(membership.roleId);
  const hasRolePermission = rolePermissions.some(
    p => p.resource === ctx.resource && p.actions.includes(ctx.action)
  );
  if (!hasRolePermission) return false;

  // 4. ABAC: Check attribute conditions (if any)
  if (ctx.attributes) {
    return evaluateAttributePolicy(membership, ctx.attributes);
  }

  return true;
}
```

### 3.3 API Route Protection

```typescript
// Every tRPC route is protected by default
const protectedProcedure = t.procedure
  .use(authMiddleware)      // Verify session
  .use(ventureMiddleware)   // Set venture context
  .use(permissionMiddleware) // Check permissions
  .use(auditMiddleware);    // Log operation
```

---

## 4. Multi-Tenant Data Isolation

### 4.1 Row-Level Security (RLS)

```sql
-- Applied to EVERY table with venture_id
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY venture_isolation ON contacts
  FOR ALL
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- Super admin bypass policy
CREATE POLICY admin_access ON contacts
  FOR ALL
  USING (
    current_setting('app.current_role') = 'super_admin'
  );
```

### 4.2 Venture Context Propagation

```typescript
// Middleware sets PostgreSQL session variables before every query
async function setVentureContext(db: Database, ventureId: string, role: string) {
  await db.execute(sql`
    SET LOCAL app.current_venture_id = ${ventureId};
    SET LOCAL app.current_role = ${role};
  `);
}
```

### 4.3 Isolation Guarantees

| Level | Mechanism | Verification |
|-------|-----------|-------------|
| Database rows | RLS policies + venture_id | Integration tests |
| API responses | tRPC middleware filters | E2E tests |
| UI data | React Query keyed by venture | Manual QA |
| File storage | venture_id prefix in S3 paths | Integration tests |
| Cache keys | `{ventureId}:{key}` namespace | Unit tests |
| Event streams | venture_id in event envelope | Integration tests |
| Audit logs | venture_id in every log entry | Compliance audit |

---

## 5. Encryption

### 5.1 Data in Transit

| Connection | Protocol | Minimum Version |
|-----------|----------|-----------------|
| Client → Cloudflare | TLS 1.3 | TLS 1.2 fallback |
| Cloudflare → Vercel | TLS 1.3 (Full Strict) | TLS 1.2 |
| App → Supabase | TLS 1.3 (sslmode=require) | TLS 1.2 |
| App → Upstash Redis | TLS 1.3 (REST API) | TLS 1.2 |
| K8s Pod → Pod | mTLS (Istio service mesh, M3+) | TLS 1.2 |

### 5.2 Data at Rest

| Storage | Encryption | Key Management |
|---------|-----------|----------------|
| Supabase PostgreSQL | AES-256 (managed) | Supabase managed keys |
| S3 Backups | SSE-S3 (AES-256) | AWS managed keys |
| Upstash Redis | AES-256 (managed) | Upstash managed keys |
| PII Fields | Column-level (pgcrypto) | Application-managed keys in Secrets Manager |

### 5.3 PII Encryption (Column-Level)

```sql
-- Sensitive fields encrypted with pgcrypto
-- SSN, passport numbers, banking details
INSERT INTO user_kyc (user_id, ssn_encrypted)
VALUES (
  $1,
  pgp_sym_encrypt($2, current_setting('app.encryption_key'))
);
```

---

## 6. Input Validation & Output Encoding

### 6.1 Zod Schema Validation

```typescript
// EVERY tRPC input is validated with Zod
export const createContactInput = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  // No raw SQL injection possible — Drizzle parameterizes all queries
});
```

### 6.2 Security Headers

```typescript
// next.config.ts security headers
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://*.upstash.io wss:",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(self)',
  },
];
```

---

## 7. API Security

### 7.1 Rate Limiting Strategy

| Endpoint Category | Limit | Window | Scope |
|-------------------|-------|--------|-------|
| Auth (login, register) | 10 req | 60s | Per IP |
| Auth (password reset) | 3 req | 300s | Per email |
| API (standard) | 100 req | 60s | Per user |
| API (write operations) | 30 req | 60s | Per user |
| API (admin operations) | 200 req | 60s | Per user |
| Webhooks (inbound) | 1000 req | 60s | Per venture |
| Public API (external) | 60 req | 60s | Per API key |

### 7.2 API Key Security

```
API Key Format: mcv_{venture_short}_{random_32_chars}
Example:       mcv_betedge_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

Storage: bcrypt hash in database (original key shown once at creation)
Scopes: read, write, admin (configurable per key)
Rotation: 90-day recommended, forced after suspected compromise
Revocation: Immediate effect via Redis cache invalidation
```

---

## 8. Audit Logging

### 8.1 What Gets Logged

```typescript
// @mcv/audit captures:
interface AuditEvent {
  id: string;           // UUID
  timestamp: Date;
  ventureId: string;
  userId: string;
  action: string;       // "crm.contacts.create"
  resource: string;     // "contacts"
  resourceId: string;   // UUID of affected record
  changes: {            // Before/after for updates
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  metadata: {
    ip: string;
    userAgent: string;
    sessionId: string;
    requestId: string;
  };
}
```

### 8.2 Retention Policy

| Log Type | Retention | Storage |
|----------|----------|---------|
| Auth events (login, logout, MFA) | 2 years | PostgreSQL + S3 archive |
| Data mutations (CRUD) | 1 year | PostgreSQL + S3 archive |
| Admin operations | 5 years | PostgreSQL + S3 archive |
| Compliance events (KYC, AML) | 7 years | PostgreSQL + S3 archive (encrypted) |
| System events (health, errors) | 90 days | Loki / CloudWatch |

---

## 9. Threat Model (STRIDE)

| Threat | Category | Mitigation |
|--------|----------|------------|
| Session hijacking | Spoofing | HttpOnly cookies, short-lived JWTs, CSRF tokens |
| Cross-tenant data access | Tampering | RLS policies, venture context middleware, integration tests |
| Privilege escalation | Elevation | RBAC + ABAC, permission middleware on every route |
| PII data breach | Information Disclosure | Column encryption, TLS, audit logging, access controls |
| DDoS attack | Denial of Service | Cloudflare DDoS protection, rate limiting, WAF |
| Dependency vulnerability | Tampering | Automated `pnpm audit`, Dependabot, lockfile pinning |
| Prompt injection (AI) | Tampering | Input sanitization, output filtering, HITL for sensitive operations |
| API key leak | Information Disclosure | Secret scanning, bcrypt storage, rotation policy |
| SQL injection | Tampering | Drizzle ORM (parameterized), Zod validation, no raw SQL |
| XSS attacks | Tampering | React auto-escaping, CSP headers, DOMPurify for rich text |

---

## 10. Compliance Requirements

| Regulation | Applies To | Key Requirements |
|-----------|------------|------------------|
| **GDPR** | All ventures (EU users) | Consent management, right to erasure, DPA, data portability |
| **CCPA** | All ventures (CA users) | Right to know, right to delete, opt-out of sale |
| **PIPEDA** | Full Gain (Canadian) | Consent, purpose limitation, accuracy, safeguards |
| **Gaming regulations** | BetEdge AI | KYC, AML, responsible gambling, jurisdiction-specific |
| **SOC 2 Type II** | MCV One (target) | Security, availability, processing integrity |
| **PCI DSS** | Commerce module | Stripe handles PCI; platform handles access controls |

---

## 11. Incident Response

### 11.1 Severity Levels

| Level | Definition | Response Time | Escalation |
|-------|-----------|---------------|------------|
| **SEV-1** (Critical) | Data breach, auth bypass, full outage | 15 min | Immediate: CTO + Security Lead |
| **SEV-2** (High) | Partial outage, tenant isolation failure | 1 hour | On-call engineer + Lead |
| **SEV-3** (Medium) | Performance degradation, minor vulnerability | 4 hours | On-call engineer |
| **SEV-4** (Low) | Cosmetic issue, informational finding | 24 hours | Standard ticketing |

### 11.2 Response Procedure

```
1. DETECT: Automated alert (Sentry, Cloudflare, monitoring) or report
2. TRIAGE: Classify severity, assign incident commander
3. CONTAIN: Isolate affected system (disable feature flag, block IP, rotate key)
4. INVESTIGATE: Root cause analysis (logs, audit trail, timeline)
5. REMEDIATE: Fix root cause, deploy patch
6. RECOVER: Restore service, verify fix, monitor for recurrence
7. REVIEW: Post-incident review within 48 hours, update runbooks
```

---

## Document Control

| Field | Value |
|-------|-------|
| **Author** | MCV Engineering |
| **Classification** | INTERNAL — SENSITIVE |
| **Created** | March 10, 2026 |
| **Version** | 1.0 |
| **Dependencies** | ADR-003 (Auth), T1 Identity MODULE.md files |
