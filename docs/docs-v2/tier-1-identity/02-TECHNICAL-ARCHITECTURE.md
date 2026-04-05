# @mcv/identity — Technical Architecture
## Tier 1: Security Boundary

**Package:** `@mcv/identity`  
**Classification:** INTERNAL  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## System Overview

The `@mcv/identity` package provides a comprehensive identity and access management (IAM) system designed for multi-tenant, cross-venture authentication and authorization at billion-user scale.

### Architecture Principles

1. **Zero Trust** — Verify every request, assume breach
2. **Defense in Depth** — Multiple security layers
3. **Least Privilege** — Minimal permissions by default
4. **Fail Secure** — Deny access on error
5. **Audit Everything** — Complete traceability
6. **Horizontal Scale** — Stateless services, distributed state

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT LAYER                                          │
│                                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  Web Client  │  │ Mobile Apps  │  │   Server     │  │  Third-Party │               │
│  │  (Browser)   │  │ (iOS/Android)│  │   (B2B API)  │  │    Apps      │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                 │                 │                        │
│         └─────────────────┴─────────────────┴─────────────────┘                        │
│                                     │                                                   │
│                                     ▼                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS/WSS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   EDGE LAYER                                             │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          Cloudflare Edge                                          │  │
│  │  • DDoS Protection  • WAF  • Rate Limiting  • Bot Detection  • Geo-routing       │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                                   │
└──────────────────────────────────────┼───────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               API GATEWAY LAYER                                          │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                            @mcv/api (tRPC)                                        │  │
│  │                                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │  │
│  │  │   Request   │  │   Context   │  │    Auth     │  │   Routing   │            │  │
│  │  │  Validation │  │  Resolution │  │ Middleware  │  │   & Load    │            │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                                   │
└──────────────────────────────────────┼───────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                             @mcv/identity SERVICE LAYER                                  │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                  │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │   auth   │  │ permissions  │  │ tenants  │  │  users   │  │   sso    │     │   │
│  │  │          │  │              │  │          │  │          │  │          │     │   │
│  │  │ Sessions │  │    RBAC      │  │ Ventures │  │ Profiles │  │ Cross-   │     │   │
│  │  │ MFA      │  │    ABAC      │  │ Workspace│  │ Prefs    │  │ Venture  │     │   │
│  │  │ OAuth    │  │    Policies  │  │ Context  │  │ Invites  │  │ Federation│    │   │
│  │  │ WebAuthn │  │    Gates     │  │ Hierarchy│  │ Lifecycle│  │ Linking  │     │   │
│  │  │ Passkeys │  │    Scopes    │  │          │  │          │  │          │     │   │
│  │  └──────────┘  └──────────────┘  └──────────┘  └──────────┘  └──────────┘     │   │
│  │                                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                                   │
└──────────────────────────────────────┼───────────────────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│    DATA LAYER       │  │    CACHE LAYER      │  │   EVENT LAYER       │
│                     │  │                     │  │                     │
│  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │
│  │   PostgreSQL  │  │  │  │    Redis      │  │  │  │   Redpanda    │  │
│  │   (Supabase)  │  │  │  │    Cluster    │  │  │  │   (Events)    │  │
│  │               │  │  │  │               │  │  │  │               │  │
│  │  • Users      │  │  │  │  • Sessions   │  │  │  │  • Auth       │  │
│  │  • Ventures   │  │  │  │  • Tokens     │  │  │  │    Events     │  │
│  │  • Permissions│  │  │  │  • Rate Limits│  │  │  │  • User       │  │
│  │  • Audit Logs │  │  │  │  • Permission │  │  │  │    Events     │  │
│  │               │  │  │  │    Cache      │  │  │  │  • Tenant     │  │
│  └───────────────┘  │  │  └───────────────┘  │  │  │    Events     │  │
│                     │  │                     │  │  └───────────────┘  │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

---

## Data Flow Diagrams

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              AUTHENTICATION FLOW                                         │
│                                                                                          │
│  ┌──────┐                                                                    ┌──────┐  │
│  │Client│                                                                    │Server│  │
│  └──┬───┘                                                                    └──┬───┘  │
│     │                                                                            │      │
│     │  1. POST /auth/login { email, password/passkey/magic-link }               │      │
│     │────────────────────────────────────────────────────────────────────────────▶      │
│     │                                                                            │      │
│     │                    ┌─────────────────────────────────┐                    │      │
│     │                    │  2. Validate Credentials        │                    │      │
│     │                    │     • Verify password/passkey   │                    │      │
│     │                    │     • Check user status         │                    │      │
│     │                    │     • Assess risk score         │                    │      │
│     │                    └─────────────────────────────────┘                    │      │
│     │                                                                            │      │
│     │  3. Risk assessment: CHALLENGE (new device detected)                      │      │
│     │◀────────────────────────────────────────────────────────────────────────────      │
│     │                                                                            │      │
│     │  4. POST /auth/mfa/verify { code, method: 'totp' }                        │      │
│     │────────────────────────────────────────────────────────────────────────────▶      │
│     │                                                                            │      │
│     │                    ┌─────────────────────────────────┐                    │      │
│     │                    │  5. Verify MFA                  │                    │      │
│     │                    │     • Validate TOTP code        │                    │      │
│     │                    │     • Create session            │                    │      │
│     │                    │     • Generate tokens           │                    │      │
│     │                    │     • Log auth event            │                    │      │
│     │                    └─────────────────────────────────┘                    │      │
│     │                                                                            │      │
│     │  6. { accessToken, refreshToken, user, session }                          │      │
│     │◀────────────────────────────────────────────────────────────────────────────      │
│     │                                                                            │      │
│     │  7. Subsequent requests with Authorization: Bearer {accessToken}          │      │
│     │────────────────────────────────────────────────────────────────────────────▶      │
│     │                                                                            │      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Authorization Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              AUTHORIZATION FLOW                                          │
│                                                                                          │
│  ┌───────────────┐                                                                      │
│  │ Incoming      │                                                                      │
│  │ Request       │                                                                      │
│  └───────┬───────┘                                                                      │
│          │                                                                              │
│          ▼                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────┐     │
│  │ 1. TOKEN VALIDATION                                                           │     │
│  │    • Verify JWT signature (Ed25519)                                           │     │
│  │    • Check token expiration                                                   │     │
│  │    • Validate token type (access vs refresh)                                  │     │
│  │    • Verify issuer and audience                                               │     │
│  └───────────────────────────────────────────────────────────────────────────────┘     │
│          │                                                                              │
│          ▼                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────┐     │
│  │ 2. CONTEXT RESOLUTION                                                         │     │
│  │    • Extract user ID from token                                               │     │
│  │    • Resolve venture from subdomain/header/token                              │     │
│  │    • Resolve workspace if applicable                                          │     │
│  │    • Build MCVContext                                                         │     │
│  └───────────────────────────────────────────────────────────────────────────────┘     │
│          │                                                                              │
│          ▼                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────┐     │
│  │ 3. PERMISSION CHECK (Cached)                                                  │     │
│  │    ┌─────────────────────┐    ┌─────────────────────┐                        │     │
│  │    │  Check Cache        │───▶│  Cache Hit?         │                        │     │
│  │    │  (Redis)            │    │  Return cached      │                        │     │
│  │    └─────────────────────┘    │  permissions        │                        │     │
│  │             │                  └─────────────────────┘                        │     │
│  │             │ Cache Miss                                                      │     │
│  │             ▼                                                                 │     │
│  │    ┌─────────────────────┐                                                    │     │
│  │    │  Load User Roles    │                                                    │     │
│  │    │  (PostgreSQL)       │                                                    │     │
│  │    └─────────────────────┘                                                    │     │
│  │             │                                                                 │     │
│  │             ▼                                                                 │     │
│  │    ┌─────────────────────┐                                                    │     │
│  │    │  Expand Role        │                                                    │     │
│  │    │  Permissions        │                                                    │     │
│  │    └─────────────────────┘                                                    │     │
│  │             │                                                                 │     │
│  │             ▼                                                                 │     │
│  │    ┌─────────────────────┐                                                    │     │
│  │    │  Evaluate ABAC      │                                                    │     │
│  │    │  Policies           │                                                    │     │
│  │    └─────────────────────┘                                                    │     │
│  │             │                                                                 │     │
│  │             ▼                                                                 │     │
│  │    ┌─────────────────────┐                                                    │     │
│  │    │  Cache Result       │                                                    │     │
│  │    │  (TTL: 5 min)       │                                                    │     │
│  │    └─────────────────────┘                                                    │     │
│  └───────────────────────────────────────────────────────────────────────────────┘     │
│          │                                                                              │
│          ▼                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────┐     │
│  │ 4. RESOURCE-LEVEL CHECK                                                       │     │
│  │    • Apply scope restrictions (own/team/workspace/venture)                    │     │
│  │    • Execute custom gates                                                     │     │
│  │    • Check feature flags                                                      │     │
│  └───────────────────────────────────────────────────────────────────────────────┘     │
│          │                                                                              │
│          ▼                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────┐     │
│  │ 5. DECISION                                                                   │     │
│  │    • ALLOW: Proceed with request                                              │     │
│  │    • DENY: Return 403 Forbidden                                               │     │
│  │    • Log decision to audit trail                                              │     │
│  └───────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### WebAuthn/Passkey Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           WEBAUTHN REGISTRATION FLOW                                     │
│                                                                                          │
│  ┌──────────┐                ┌──────────┐                ┌──────────┐                   │
│  │  Client  │                │  Server  │                │Authenticator│                │
│  │ (Browser)│                │  (API)   │                │(Touch ID/Key)│               │
│  └────┬─────┘                └────┬─────┘                └─────┬────────┘               │
│       │                           │                            │                        │
│       │  1. Start Registration    │                            │                        │
│       │──────────────────────────▶│                            │                        │
│       │                           │                            │                        │
│       │  2. Challenge + Options   │                            │                        │
│       │◀──────────────────────────│                            │                        │
│       │                           │                            │                        │
│       │  3. navigator.credentials.create()                     │                        │
│       │────────────────────────────────────────────────────────▶                        │
│       │                           │                            │                        │
│       │                           │      4. User Verification  │                        │
│       │                           │      (biometric/PIN)       │                        │
│       │                           │◀───────────────────────────│                        │
│       │                           │                            │                        │
│       │  5. Public Key Credential │                            │                        │
│       │◀────────────────────────────────────────────────────────                        │
│       │                           │                            │                        │
│       │  6. Submit Credential     │                            │                        │
│       │──────────────────────────▶│                            │                        │
│       │                           │                            │                        │
│       │                    ┌──────┴──────┐                     │                        │
│       │                    │ 7. Validate │                     │                        │
│       │                    │ • Challenge │                     │                        │
│       │                    │ • Origin    │                     │                        │
│       │                    │ • RP ID     │                     │                        │
│       │                    │ 8. Store    │                     │                        │
│       │                    │ Public Key  │                     │                        │
│       │                    └──────┬──────┘                     │                        │
│       │                           │                            │                        │
│       │  9. Registration Success  │                            │                        │
│       │◀──────────────────────────│                            │                        │
│       │                           │                            │                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Architecture

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  DATABASE SCHEMA                                         │
│                                                                                          │
│  ┌───────────────────┐          ┌───────────────────┐          ┌───────────────────┐   │
│  │      users        │          │     ventures      │          │    workspaces     │   │
│  ├───────────────────┤          ├───────────────────┤          ├───────────────────┤   │
│  │ id (PK)           │          │ id (PK)           │          │ id (PK)           │   │
│  │ email (UNIQUE)    │          │ slug (UNIQUE)     │          │ venture_id (FK)   │───┤
│  │ email_verified    │          │ name              │          │ slug              │   │
│  │ phone             │          │ domain            │          │ name              │   │
│  │ phone_verified    │          │ status            │          │ parent_id (FK)    │───┼──┐
│  │ password_hash     │          │ plan              │          │ path              │   │  │
│  │ mfa_enabled       │          │ branding (JSONB)  │          │ settings (JSONB)  │   │  │
│  │ status            │          │ settings (JSONB)  │          │ visibility        │   │  │
│  │ profile (JSONB)   │          │ limits (JSONB)    │          │ created_at        │   │  │
│  │ created_at        │          │ owner_id (FK)     │───┐      │ updated_at        │   │  │
│  │ updated_at        │          │ created_at        │   │      └───────────────────┘   │  │
│  │ deleted_at        │          │ updated_at        │   │                  ▲           │  │
│  └─────────┬─────────┘          └───────────────────┘   │                  │           │  │
│            │                             ▲              │                  │           │  │
│            │                             │              │                  └───────────┼──┘
│            │                             │              │                              │
│            │                             │              └──────────────────────────────┘
│            │                             │
│            │    ┌───────────────────────────────────────────────────────────────┐
│            │    │                                                               │
│            ▼    ▼                                                               │
│  ┌───────────────────┐          ┌───────────────────┐          ┌───────────────────┐   │
│  │venture_memberships│          │   user_sessions   │          │   auth_factors    │   │
│  ├───────────────────┤          ├───────────────────┤          ├───────────────────┤   │
│  │ id (PK)           │          │ id (PK)           │          │ id (PK)           │   │
│  │ user_id (FK)      │──────────│ user_id (FK)      │──────────│ user_id (FK)      │   │
│  │ venture_id (FK)   │          │ venture_id (FK)   │          │ type              │   │
│  │ roles (ARRAY)     │          │ device_id         │          │ secret_enc        │   │
│  │ permissions (ARR) │          │ access_token_hash │          │ verified          │   │
│  │ profile_overrides │          │ refresh_token_hash│          │ last_used_at      │   │
│  │ status            │          │ ip_address        │          │ created_at        │   │
│  │ invited_by (FK)   │          │ user_agent        │          └───────────────────┘   │
│  │ invited_at        │          │ risk_score        │                                   │
│  │ accepted_at       │          │ mfa_verified      │                                   │
│  │ created_at        │          │ expires_at        │          ┌───────────────────┐   │
│  │ updated_at        │          │ last_activity_at  │          │  passkey_creds    │   │
│  └───────────────────┘          │ created_at        │          ├───────────────────┤   │
│                                  └───────────────────┘          │ id (PK)           │   │
│                                                                 │ user_id (FK)      │   │
│  ┌───────────────────┐          ┌───────────────────┐          │ credential_id     │   │
│  │      roles        │          │  role_permissions │          │ public_key        │   │
│  ├───────────────────┤          ├───────────────────┤          │ counter           │   │
│  │ id (PK)           │◀─────────│ role_id (FK)      │          │ device_type       │   │
│  │ venture_id (FK)   │          │ permission_id(FK) │──────────│ transports (ARR)  │   │
│  │ name              │          │ created_at        │          │ created_at        │   │
│  │ description       │          └───────────────────┘          │ last_used_at      │   │
│  │ is_system         │                                         └───────────────────┘   │
│  │ parent_role_id    │          ┌───────────────────┐                                   │
│  │ created_at        │          │   permissions     │          ┌───────────────────┐   │
│  │ updated_at        │          ├───────────────────┤          │  linked_accounts  │   │
│  └───────────────────┘          │ id (PK)           │          ├───────────────────┤   │
│                                  │ resource          │          │ id (PK)           │   │
│                                  │ action            │          │ user_id (FK)      │   │
│  ┌───────────────────┐          │ scope             │          │ provider          │   │
│  │     policies      │          │ description       │          │ provider_id       │   │
│  ├───────────────────┤          │ created_at        │          │ profile (JSONB)   │   │
│  │ id (PK)           │          └───────────────────┘          │ tokens_enc        │   │
│  │ venture_id (FK)   │                                         │ status            │   │
│  │ name              │                                         │ linked_at         │   │
│  │ description       │          ┌───────────────────┐          │ last_used_at      │   │
│  │ conditions (JSONB)│          │    invitations    │          └───────────────────┘   │
│  │ effect            │          ├───────────────────┤                                   │
│  │ permissions (ARR) │          │ id (PK)           │          ┌───────────────────┐   │
│  │ priority          │          │ venture_id (FK)   │          │ sso_configurations│   │
│  │ enabled           │          │ workspace_id (FK) │          ├───────────────────┤   │
│  │ created_at        │          │ email             │          │ id (PK)           │   │
│  │ updated_at        │          │ roles (ARRAY)     │          │ venture_id (FK)   │   │
│  └───────────────────┘          │ token_hash        │          │ type (saml/oidc)  │   │
│                                  │ expires_at        │          │ config (JSONB)    │   │
│                                  │ invited_by (FK)   │          │ attribute_mapping │   │
│                                  │ status            │          │ domains (ARRAY)   │   │
│                                  │ created_at        │          │ enabled           │   │
│                                  └───────────────────┘          │ verified_at       │   │
│                                                                 │ created_at        │   │
│                                                                 └───────────────────┘   │
│                                                                                          │
│  ┌───────────────────┐          ┌───────────────────┐                                   │
│  │   auth_audit_log  │          │ impersonation_log │                                   │
│  ├───────────────────┤          ├───────────────────┤                                   │
│  │ id (PK)           │          │ id (PK)           │                                   │
│  │ user_id (FK)      │          │ impersonator_id   │                                   │
│  │ venture_id (FK)   │          │ impersonated_id   │                                   │
│  │ event_type        │          │ venture_id (FK)   │                                   │
│  │ ip_address        │          │ reason            │                                   │
│  │ user_agent        │          │ permissions       │                                   │
│  │ success           │          │ started_at        │                                   │
│  │ failure_reason    │          │ ended_at          │                                   │
│  │ metadata (JSONB)  │          │ actions (JSONB)   │                                   │
│  │ created_at        │          └───────────────────┘                                   │
│  └───────────────────┘                                                                   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Table Partitioning Strategy

```sql
-- auth_audit_log: Partition by month for efficient retention management
CREATE TABLE auth_audit_log (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    venture_id UUID REFERENCES ventures(id),
    event_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions for rolling 7-year retention
CREATE TABLE auth_audit_log_y2026_m01 PARTITION OF auth_audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Auto-create future partitions via pg_partman or cron job
```

### Row-Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE venture_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data or data from ventures they belong to
CREATE POLICY "users_self_or_venture_members" ON users
    FOR SELECT
    USING (
        id = current_setting('app.current_user_id')::uuid
        OR id IN (
            SELECT user_id FROM venture_memberships
            WHERE venture_id = current_setting('app.current_venture_id')::uuid
        )
    );

-- Venture data isolation
CREATE POLICY "venture_isolation" ON venture_memberships
    FOR ALL
    USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- Sessions: Users can only see their own sessions
CREATE POLICY "sessions_self_only" ON user_sessions
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::uuid);
```

---

## Caching Strategy

### Cache Layers

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               CACHING ARCHITECTURE                                       │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ L1: In-Memory Cache (per-process)                                                 │  │
│  │     • Session context (current request)                                           │  │
│  │     • Permission decisions (LRU, 1000 entries)                                    │  │
│  │     • TTL: Request duration or 30 seconds                                         │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                                   │
│                                      │ Cache Miss                                        │
│                                      ▼                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ L2: Redis Cluster (distributed)                                                   │  │
│  │     • Session data (TTL: session lifetime)                                        │  │
│  │     • User permissions (TTL: 5 minutes)                                           │  │
│  │     • Rate limit counters (TTL: window size)                                      │  │
│  │     • Token blacklist (TTL: token lifetime)                                       │  │
│  │     • Role-permission mappings (TTL: 1 hour)                                      │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                                   │
│                                      │ Cache Miss                                        │
│                                      ▼                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ L3: PostgreSQL (source of truth)                                                  │  │
│  │     • All persistent data                                                         │  │
│  │     • Read replicas for read-heavy operations                                     │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Cache Key Patterns

```typescript
// Session cache
const sessionKey = `session:${sessionId}`;              // TTL: session lifetime
const userSessionsKey = `user:${userId}:sessions`;       // TTL: 1 hour

// Permission cache
const permissionKey = `perm:${userId}:${ventureId}`;     // TTL: 5 min
const rolePermissionsKey = `role:${roleId}:perms`;       // TTL: 1 hour

// Rate limiting
const rateLimitKey = `ratelimit:${identifier}:${window}`;// TTL: window size

// Token blacklist (for revoked tokens)
const tokenBlacklistKey = `blacklist:${tokenId}`;        // TTL: token expiry

// Venture/tenant cache
const ventureKey = `venture:${ventureId}`;               // TTL: 15 min
const ventureBySlugKey = `venture:slug:${slug}`;         // TTL: 15 min
```

### Cache Invalidation

```typescript
// Event-driven invalidation via Redpanda
const invalidationEvents = {
  'user.permissions.changed': async (event) => {
    await redis.del(`perm:${event.userId}:*`);
  },
  
  'role.updated': async (event) => {
    await redis.del(`role:${event.roleId}:perms`);
    // Invalidate all users with this role
    const users = await getUsersWithRole(event.roleId);
    await Promise.all(users.map(u => redis.del(`perm:${u.id}:*`)));
  },
  
  'session.revoked': async (event) => {
    await redis.del(`session:${event.sessionId}`);
    await redis.sadd(`blacklist:${event.tokenId}`, 'revoked');
  },
  
  'venture.updated': async (event) => {
    await redis.del(`venture:${event.ventureId}`);
    await redis.del(`venture:slug:${event.slug}`);
  },
};
```

---

## Token Architecture

### JWT Structure

```typescript
// Access Token (short-lived: 15 minutes)
interface AccessToken {
  // Standard claims
  iss: 'https://auth.nexushub.io';
  sub: string;                    // User ID
  aud: string[];                  // Allowed services
  exp: number;                    // Expiration timestamp
  iat: number;                    // Issued at timestamp
  jti: string;                    // Unique token ID
  
  // Custom claims
  venture_id: string;
  workspace_id?: string;
  session_id: string;
  
  // Minimal permissions (cached lookup for full permissions)
  roles: string[];
  
  // Security
  device_id: string;
  mfa_verified: boolean;
}

// Refresh Token (long-lived: 30 days)
interface RefreshToken {
  iss: 'https://auth.nexushub.io';
  sub: string;
  exp: number;
  iat: number;
  jti: string;
  
  session_id: string;
  device_id: string;
  
  // Rotation tracking
  generation: number;             // Incremented on each rotation
}
```

### Token Signing

```typescript
// Key rotation setup
const keyConfig = {
  algorithm: 'EdDSA',
  keyType: 'OKP',
  curve: 'Ed25519',
  rotationPeriodDays: 90,
  overlapPeriodDays: 7,          // Both keys valid during rotation
};

// Sign token
async function signToken(payload: TokenPayload): Promise<string> {
  const privateKey = await getCurrentPrivateKey();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'EdDSA', kid: privateKey.kid })
    .setIssuedAt()
    .setExpirationTime(payload.exp)
    .sign(privateKey);
}

// Verify token (accepts current and previous key)
async function verifyToken(token: string): Promise<TokenPayload> {
  const keys = await getValidPublicKeys();
  
  for (const key of keys) {
    try {
      const { payload } = await jwtVerify(token, key);
      return payload as TokenPayload;
    } catch {
      continue;
    }
  }
  
  throw new InvalidTokenError('Token signature invalid');
}
```

---

## Security Architecture

### Defense Layers

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY LAYERS                                             │
│                                                                                          │
│  Layer 1: Edge Protection (Cloudflare)                                                  │
│  ├── DDoS mitigation (L3/L4/L7)                                                        │
│  ├── Web Application Firewall (WAF)                                                     │
│  ├── Bot detection and challenge                                                        │
│  ├── Geo-blocking for restricted regions                                                │
│  └── Rate limiting (coarse-grained)                                                     │
│                                                                                          │
│  Layer 2: Application Rate Limiting                                                     │
│  ├── Per-IP rate limits                                                                 │
│  ├── Per-user rate limits                                                               │
│  ├── Per-endpoint rate limits                                                           │
│  ├── Sliding window counters                                                            │
│  └── Adaptive throttling based on load                                                  │
│                                                                                          │
│  Layer 3: Authentication                                                                │
│  ├── Multi-factor authentication                                                        │
│  ├── Risk-based authentication                                                          │
│  ├── Device fingerprinting                                                              │
│  ├── Session binding                                                                    │
│  └── Credential stuffing detection                                                      │
│                                                                                          │
│  Layer 4: Authorization                                                                 │
│  ├── Token validation                                                                   │
│  ├── Permission checks                                                                  │
│  ├── Resource-level access control                                                      │
│  ├── Scope enforcement                                                                  │
│  └── Policy evaluation                                                                  │
│                                                                                          │
│  Layer 5: Data Protection                                                               │
│  ├── Row-level security (RLS)                                                           │
│  ├── Column-level encryption                                                            │
│  ├── Data masking                                                                       │
│  ├── Audit logging                                                                      │
│  └── Secure backup/restore                                                              │
│                                                                                          │
│  Layer 6: Monitoring & Response                                                         │
│  ├── Real-time anomaly detection                                                        │
│  ├── Security event correlation                                                         │
│  ├── Automated threat response                                                          │
│  ├── Incident alerting                                                                  │
│  └── Forensic logging                                                                   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Risk-Based Authentication Engine

```typescript
interface RiskEngine {
  // Input signals
  signals: {
    device: DeviceSignal;
    network: NetworkSignal;
    behavior: BehaviorSignal;
    context: ContextSignal;
  };
  
  // Risk calculation
  calculateRisk(): RiskAssessment;
}

interface DeviceSignal {
  deviceId: string;
  isKnown: boolean;
  lastSeen?: Date;
  fingerprint: string;
  os: string;
  browser: string;
}

interface NetworkSignal {
  ip: string;
  isVPN: boolean;
  isTor: boolean;
  isProxy: boolean;
  isDatacenter: boolean;
  country: string;
  asn: string;
  reputation: number;           // 0-100
}

interface BehaviorSignal {
  typingSpeed: number;
  mouseMovement: boolean;
  timeOnPage: number;
  failedAttempts: number;
  lastLoginTime?: Date;
  lastLoginLocation?: string;
}

interface ContextSignal {
  timeOfDay: number;
  dayOfWeek: number;
  isBusinessHours: boolean;
  requestedScopes: string[];
  sensitiveOperation: boolean;
}

// Risk score calculation
function calculateRiskScore(signals: RiskSignals): number {
  let score = 0;
  
  // Device risk (0-25)
  if (!signals.device.isKnown) score += 15;
  if (signals.device.lastSeen && daysSince(signals.device.lastSeen) > 30) score += 10;
  
  // Network risk (0-30)
  if (signals.network.isTor) score += 25;
  if (signals.network.isVPN) score += 10;
  if (signals.network.isDatacenter) score += 15;
  if (signals.network.reputation < 50) score += 20;
  
  // Behavior risk (0-25)
  if (signals.behavior.failedAttempts > 2) score += 15;
  if (impossibleTravel(signals)) score += 25;
  
  // Context risk (0-20)
  if (!signals.context.isBusinessHours) score += 5;
  if (signals.context.sensitiveOperation) score += 10;
  
  return Math.min(100, score);
}
```

---

## Event Architecture

### Identity Domain Events

```typescript
// Event schema
interface DomainEvent {
  id: string;                    // Unique event ID
  type: string;                  // Event type
  version: number;               // Schema version
  timestamp: Date;
  source: string;                // Origin service
  
  // Correlation
  correlationId: string;         // Request correlation
  causationId?: string;          // Parent event ID
  
  // Tenant context
  ventureId: string;
  userId?: string;
  
  // Event data
  data: Record<string, unknown>;
  
  // Metadata
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  };
}

// Identity events
namespace IdentityEvents {
  // Authentication
  interface UserLoggedIn extends DomainEvent {
    type: 'identity.user.logged_in';
    data: {
      userId: string;
      method: 'password' | 'passkey' | 'oauth' | 'magic_link' | 'sso';
      sessionId: string;
      deviceId: string;
      mfaUsed: boolean;
      riskScore: number;
    };
  }
  
  interface UserLoggedOut extends DomainEvent {
    type: 'identity.user.logged_out';
    data: {
      userId: string;
      sessionId: string;
      reason: 'user_initiated' | 'session_expired' | 'forced_logout' | 'security';
    };
  }
  
  interface LoginFailed extends DomainEvent {
    type: 'identity.login.failed';
    data: {
      email: string;
      reason: string;
      attemptCount: number;
      blocked: boolean;
    };
  }
  
  // User lifecycle
  interface UserCreated extends DomainEvent {
    type: 'identity.user.created';
    data: {
      userId: string;
      email: string;
      source: 'signup' | 'invitation' | 'sso_provision' | 'admin';
      ventureId?: string;
    };
  }
  
  interface UserUpdated extends DomainEvent {
    type: 'identity.user.updated';
    data: {
      userId: string;
      changes: Record<string, { old: unknown; new: unknown }>;
    };
  }
  
  // Permissions
  interface PermissionsChanged extends DomainEvent {
    type: 'identity.permissions.changed';
    data: {
      userId: string;
      ventureId: string;
      rolesAdded: string[];
      rolesRemoved: string[];
      permissionsAdded: string[];
      permissionsRemoved: string[];
    };
  }
  
  // Tenancy
  interface VentureCreated extends DomainEvent {
    type: 'identity.venture.created';
    data: {
      ventureId: string;
      slug: string;
      ownerId: string;
      plan: string;
    };
  }
  
  interface MembershipCreated extends DomainEvent {
    type: 'identity.membership.created';
    data: {
      userId: string;
      ventureId: string;
      roles: string[];
      invitedBy?: string;
    };
  }
}
```

### Event Publishing

```typescript
// Publish events to Redpanda
const eventPublisher = {
  async publish(event: DomainEvent): Promise<void> {
    const topic = `identity.${event.type.split('.')[1]}`;
    
    await producer.send({
      topic,
      messages: [{
        key: event.ventureId,
        value: JSON.stringify(event),
        headers: {
          'event-type': event.type,
          'event-version': String(event.version),
          'correlation-id': event.correlationId,
        },
      }],
    });
  },
};

// Event topics
const topics = [
  'identity.auth',               // Authentication events
  'identity.users',              // User lifecycle events
  'identity.permissions',        // Permission change events
  'identity.tenants',            // Venture/workspace events
  'identity.sso',                // SSO events
  'identity.audit',              // Audit events (high volume)
];
```

---

## Scalability Design

### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                             SCALABILITY ARCHITECTURE                                     │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              LOAD BALANCER                                        │  │
│  │                         (Cloudflare / AWS ALB)                                    │  │
│  │                                                                                   │  │
│  │  • Health checks                                                                  │  │
│  │  • Session affinity (sticky sessions disabled - stateless)                        │  │
│  │  • Geographic routing                                                             │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                                   │
│                                      ▼                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          IDENTITY SERVICE CLUSTER                                 │  │
│  │                                                                                   │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │  │
│  │  │ Pod 1   │  │ Pod 2   │  │ Pod 3   │  │ Pod 4   │  │ Pod N   │              │  │
│  │  │ 2 CPU   │  │ 2 CPU   │  │ 2 CPU   │  │ 2 CPU   │  │ 2 CPU   │              │  │
│  │  │ 4 GB    │  │ 4 GB    │  │ 4 GB    │  │ 4 GB    │  │ 4 GB    │              │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘              │  │
│  │                                                                                   │  │
│  │  Auto-scaling: min=3, max=50, target CPU=70%                                     │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                                   │
│          ┌───────────────────────────┼───────────────────────────┐                     │
│          ▼                           ▼                           ▼                     │
│  ┌─────────────────┐  ┌─────────────────────────────┐  ┌─────────────────┐           │
│  │ Redis Cluster   │  │     PostgreSQL Cluster      │  │ Redpanda Cluster│           │
│  │                 │  │                             │  │                 │           │
│  │ Primary         │  │  Primary (Write)            │  │ Broker 1        │           │
│  │ ├── Replica 1   │  │  ├── Read Replica 1         │  │ Broker 2        │           │
│  │ ├── Replica 2   │  │  ├── Read Replica 2         │  │ Broker 3        │           │
│  │ └── Replica 3   │  │  └── Read Replica 3         │  │                 │           │
│  │                 │  │                             │  │                 │           │
│  │ 6 shards        │  │  Connection pooling: 1000   │  │ 6 partitions    │           │
│  │ 100GB total     │  │  Max connections: 5000      │  │ per topic       │           │
│  └─────────────────┘  └─────────────────────────────┘  └─────────────────┘           │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Performance Targets

| Operation | Target Latency (P99) | Throughput |
|-----------|----------------------|------------|
| Token validation | < 5ms | 100K/sec |
| Permission check (cached) | < 2ms | 200K/sec |
| Permission check (uncached) | < 20ms | 20K/sec |
| Login (password) | < 200ms | 5K/sec |
| Login (passkey) | < 100ms | 10K/sec |
| Session creation | < 50ms | 20K/sec |
| User lookup | < 10ms | 50K/sec |

---

## Monitoring & Observability

### Key Metrics

```typescript
// Authentication metrics
const authMetrics = {
  // Counters
  'auth.login.total': Counter,
  'auth.login.success': Counter,
  'auth.login.failure': Counter,
  'auth.login.mfa_required': Counter,
  'auth.logout.total': Counter,
  
  // Histograms
  'auth.login.duration': Histogram,
  'auth.token.validation.duration': Histogram,
  
  // Gauges
  'auth.sessions.active': Gauge,
  'auth.users.online': Gauge,
};

// Authorization metrics
const authzMetrics = {
  'authz.permission_check.total': Counter,
  'authz.permission_check.allowed': Counter,
  'authz.permission_check.denied': Counter,
  'authz.permission_check.duration': Histogram,
  'authz.cache.hit_rate': Gauge,
};

// Security metrics
const securityMetrics = {
  'security.brute_force.detected': Counter,
  'security.credential_stuffing.detected': Counter,
  'security.suspicious_login.detected': Counter,
  'security.account_locked': Counter,
  'security.mfa.enrollment': Gauge,
};
```

### Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: identity-alerts
    rules:
      - alert: HighAuthFailureRate
        expr: rate(auth_login_failure_total[5m]) / rate(auth_login_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High authentication failure rate"
          
      - alert: BruteForceDetected
        expr: rate(security_brute_force_detected_total[5m]) > 10
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Brute force attack detected"
          
      - alert: PermissionCheckLatency
        expr: histogram_quantile(0.99, rate(authz_permission_check_duration_bucket[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Permission check latency exceeds 50ms"
          
      - alert: SessionCreationFailure
        expr: rate(auth_session_creation_failure_total[5m]) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Session creation failures detected"
```

---

## Disaster Recovery

### Recovery Point Objective (RPO): 1 minute
### Recovery Time Objective (RTO): 5 minutes

### Backup Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKUP ARCHITECTURE                                         │
│                                                                                          │
│  PostgreSQL                                                                              │
│  ├── Continuous WAL archiving (RPO: ~1 minute)                                          │
│  ├── Daily full backups (retained: 30 days)                                             │
│  ├── Point-in-time recovery capability                                                  │
│  └── Cross-region replication (async, lag < 1 min)                                      │
│                                                                                          │
│  Redis                                                                                   │
│  ├── RDB snapshots every 5 minutes                                                      │
│  ├── AOF persistence (fsync every second)                                               │
│  └── Cross-region replication                                                           │
│                                                                                          │
│  Secrets                                                                                 │
│  ├── HashiCorp Vault with auto-unseal                                                   │
│  ├── Cross-region replication                                                           │
│  └── Key versioning and rotation                                                        │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Failover Procedure

1. **Automatic failover** (< 30 seconds)
   - Health check failure triggers
   - DNS/load balancer routes to healthy region
   - Redis Sentinel promotes replica
   - PostgreSQL pg_failover promotes replica

2. **Manual failover** (< 5 minutes)
   - Operator initiates failover
   - Verify data consistency
   - Update DNS records
   - Verify service health
   - Notify stakeholders

---

## Related Documentation

- [Package Specification](./01-PACKAGE-SPEC.md)
- [API Reference](./03-API-REFERENCE.md)
- [Implementation Plan](./04-IMPLEMENTATION-PLAN.md)
- [auth Module](./auth/MODULE.md)
- [permissions Module](./permissions/MODULE.md)
- [tenants Module](./tenants/MODULE.md)
- [users Module](./users/MODULE.md)
- [sso Module](./sso/MODULE.md)

---

*@mcv/identity — Technical Architecture*
