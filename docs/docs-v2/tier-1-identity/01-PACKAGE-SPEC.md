# @mcv/identity — Package Specification
## Tier 1: Security Boundary

**Package:** `@mcv/identity`  
**Classification:** INTERNAL  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/identity` is the security boundary package of the MCV.ONE SDK. It provides comprehensive identity and access management (IAM) for the entire ecosystem: authentication, authorization, multi-tenancy, user management, and cross-venture single sign-on. Every protected resource in the MCV ecosystem flows through this package.

**Security is not a feature — it's the foundation. @mcv/identity is that foundation.**

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ALL PROTECTED RESOURCES                               │
│                                                                              │
│  @mcv/nexus  @mcv/commerce  @mcv/engagement  @mcv/analytics  @mcv/api  ...  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ authenticates & authorizes via
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/identity                                   │
│                                                                              │
│  ┌─────────┐ ┌─────────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  auth   │ │ permissions │ │ tenants │ │  users  │ │   sso   │           │
│  └─────────┘ └─────────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                                              │
│  Sessions • MFA • OAuth • WebAuthn • Passkeys • Magic Links                 │
│  RBAC • ABAC • Policies • Gates • Scopes • Resources                        │
│  Ventures • Workspaces • Context Scoping • Hierarchy                        │
│  Profiles • Preferences • Invitations • Impersonation                       │
│  Cross-Venture SSO • Identity Resolution • Account Linking                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ depends on
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/kernel                                     │
│                                                                              │
│  db • config • logger • errors • utils • types • context                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Business Context

### Why @mcv/identity Exists

The MCV ecosystem operates across multiple ventures (BetEdge, NexusHub, SerpSpace, etc.), each with their own users, permissions, and security requirements. Yet users expect:

1. **Single Identity** — One account works across all MCV ventures
2. **Contextual Access** — Permissions are scoped to specific ventures/workspaces
3. **Modern Authentication** — Passkeys, biometrics, not just passwords
4. **Enterprise Features** — SAML/OIDC SSO, audit logs, compliance

### Core Problems Solved

| Problem | Solution |
|---------|----------|
| Users need accounts per venture | Unified identity with venture-specific profiles |
| Passwords are insecure | Passkeys, WebAuthn, Magic Links as primary |
| Permission sprawl | Hierarchical RBAC + contextual ABAC |
| Multi-tenant data isolation | Venture-scoped contexts with RLS enforcement |
| Enterprise SSO requirements | SAML 2.0 / OIDC federation |
| Compliance requirements | Full audit trail, 7-year retention |

### Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Auth latency (P99) | < 50ms | User experience |
| Passkey adoption | > 40% of users | Security improvement |
| MFA enrollment | > 80% of users | Compliance |
| Session hijacking | 0 incidents | Security |
| Permission check latency | < 5ms | Performance |
| SSO login success rate | > 99.5% | Reliability |

---

## Sub-Modules Overview

| Module | Purpose | Key Capabilities |
|--------|---------|------------------|
| **auth** | Authentication mechanisms | Sessions, MFA, OAuth, WebAuthn, Passkeys, Magic Links, Password |
| **permissions** | Authorization system | RBAC, ABAC, Policies, Gates, Scopes, Resource permissions |
| **tenants** | Multi-tenancy | Ventures, Workspaces, Context scoping, Hierarchy |
| **users** | User management | Profiles, Preferences, Invitations, Impersonation, Account lifecycle |
| **sso** | Single Sign-On | Cross-venture SSO, Identity resolution, Account linking, Federation |

---

## Module: auth

### Purpose

Provides all authentication mechanisms for the MCV ecosystem. Supports modern passwordless authentication (Passkeys, WebAuthn, Magic Links) alongside traditional methods (Password, OAuth, MFA).

### Key Concepts

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  Client  │───▶│  Auth    │───▶│ Identity │───▶│ Session  │ │
│  │  (User)  │    │  Factor  │    │ Verified │    │ Created  │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│                       │                                        │
│         ┌─────────────┼─────────────┐                         │
│         ▼             ▼             ▼                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│   │ Primary  │  │   MFA    │  │  Risk    │                   │
│   │ Factors  │  │ Factors  │  │ Signals  │                   │
│   └──────────┘  └──────────┘  └──────────┘                   │
│                                                                │
│   • Passkey     • TOTP         • Device fingerprint           │
│   • Password    • SMS          • IP reputation                │
│   • Magic Link  • Email        • Behavioral analysis          │
│   • OAuth       • WebAuthn     • Geo-velocity                 │
│   • SSO/SAML    • Push         • Session history              │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Methods

| Method | Security Level | UX Friction | Use Case |
|--------|---------------|-------------|----------|
| **Passkey** | ★★★★★ | ★☆☆☆☆ | Primary for modern browsers/devices |
| **WebAuthn** | ★★★★★ | ★★☆☆☆ | Hardware security keys |
| **Magic Link** | ★★★★☆ | ★★☆☆☆ | Email-based passwordless |
| **OAuth** | ★★★★☆ | ★★☆☆☆ | Social login, enterprise IdP |
| **Password + MFA** | ★★★☆☆ | ★★★★☆ | Legacy/fallback |
| **SSO (SAML/OIDC)** | ★★★★★ | ★☆☆☆☆ | Enterprise customers |

### Session Management

```typescript
interface Session {
  id: string;                    // Unique session identifier
  userId: string;                // Owner of the session
  ventureId: string;             // Venture context
  deviceId: string;              // Device fingerprint
  
  // Tokens
  accessToken: string;           // Short-lived (15 min)
  refreshToken: string;          // Long-lived (30 days)
  
  // Security metadata
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  ipAddress: string;
  userAgent: string;
  
  // Risk assessment
  riskScore: number;             // 0-100
  mfaVerified: boolean;
  authFactors: AuthFactor[];     // Which factors were used
}
```

### MFA Configuration

| Factor Type | Implementation | Recovery |
|-------------|----------------|----------|
| TOTP | RFC 6238 (30s window, SHA-256) | Backup codes |
| SMS | Twilio Verify | Alternative phone |
| Email | Magic code (6 digits, 10 min) | N/A (email is recovery) |
| WebAuthn | FIDO2 security key | Multiple keys |
| Push | Mobile app notification | Backup codes |

### Risk-Based Authentication

```typescript
interface RiskAssessment {
  score: number;                 // 0 (safe) to 100 (high risk)
  factors: RiskFactor[];         // Contributing factors
  action: 'allow' | 'challenge' | 'block';
  challengeType?: 'mfa' | 'captcha' | 'verification';
}

enum RiskFactor {
  NEW_DEVICE = 'new_device',
  NEW_LOCATION = 'new_location',
  IMPOSSIBLE_TRAVEL = 'impossible_travel',
  TOR_EXIT_NODE = 'tor_exit_node',
  KNOWN_BAD_IP = 'known_bad_ip',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  CREDENTIAL_STUFFING = 'credential_stuffing',
  BOT_BEHAVIOR = 'bot_behavior',
}
```

---

## Module: permissions

### Purpose

Provides a hybrid RBAC/ABAC authorization system. Roles provide baseline permissions, while policies enable fine-grained contextual access control.

### Authorization Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHORIZATION MODEL                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          USER                                        │   │
│  │                           │                                          │   │
│  │         ┌─────────────────┼─────────────────┐                       │   │
│  │         ▼                 ▼                 ▼                       │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │   │
│  │  │   ROLES     │   │   GROUPS    │   │  POLICIES   │               │   │
│  │  │  (RBAC)     │   │ (Membership)│   │   (ABAC)    │               │   │
│  │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘               │   │
│  │         │                 │                 │                       │   │
│  │         └────────────┬────┴─────────────────┘                       │   │
│  │                      ▼                                              │   │
│  │              ┌─────────────┐                                        │   │
│  │              │ PERMISSIONS │                                        │   │
│  │              │   (Scopes)  │                                        │   │
│  │              └──────┬──────┘                                        │   │
│  │                     │                                               │   │
│  │                     ▼                                               │   │
│  │              ┌─────────────┐                                        │   │
│  │              │  RESOURCES  │                                        │   │
│  │              │  (Actions)  │                                        │   │
│  │              └─────────────┘                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Role Hierarchy

```typescript
// Global roles (apply across ventures)
enum GlobalRole {
  SUPER_ADMIN = 'super_admin',     // MCV staff only
  VENTURE_OWNER = 'venture_owner', // Owns a venture
  SUPPORT_AGENT = 'support_agent', // MCV support staff
}

// Venture-scoped roles
enum VentureRole {
  ADMIN = 'admin',                 // Full venture access
  MANAGER = 'manager',             // Manage team, limited settings
  MEMBER = 'member',               // Standard access
  VIEWER = 'viewer',               // Read-only access
  GUEST = 'guest',                 // Limited public access
}

// Workspace-scoped roles
enum WorkspaceRole {
  WORKSPACE_ADMIN = 'workspace_admin',
  WORKSPACE_MEMBER = 'workspace_member',
  WORKSPACE_VIEWER = 'workspace_viewer',
}
```

### Permission Scopes

```typescript
// Permission format: resource:action or resource:action:scope
type Permission = string;

// Examples:
// 'users:read'           - Read any user in context
// 'users:write:own'      - Write only own user
// 'orders:delete:team'   - Delete orders in own team
// 'settings:*'           - All settings actions
// '*:read'               - Read anything

interface PermissionScope {
  resource: string;       // e.g., 'users', 'orders', 'settings'
  action: Action;         // 'create' | 'read' | 'update' | 'delete' | '*'
  scope?: ScopeLevel;     // 'own' | 'team' | 'workspace' | 'venture' | 'global'
}

enum ScopeLevel {
  OWN = 'own',            // Only own resources
  TEAM = 'team',          // Team resources
  WORKSPACE = 'workspace', // Workspace resources
  VENTURE = 'venture',    // All venture resources
  GLOBAL = 'global',      // Cross-venture (admin only)
}
```

### Policy-Based Access Control (ABAC)

```typescript
interface Policy {
  id: string;
  name: string;
  description: string;
  
  // When does this policy apply?
  conditions: PolicyCondition[];
  
  // What does it grant/deny?
  effect: 'allow' | 'deny';
  permissions: Permission[];
  
  // Priority for conflict resolution
  priority: number;
}

interface PolicyCondition {
  attribute: string;       // e.g., 'user.department', 'resource.owner', 'context.time'
  operator: Operator;      // 'equals', 'contains', 'greaterThan', 'in', etc.
  value: unknown;          // The value to compare against
}

// Example: Department managers can approve expenses up to $10,000
const expenseApprovalPolicy: Policy = {
  id: 'expense-approval-manager',
  name: 'Manager Expense Approval',
  description: 'Managers can approve expenses up to $10,000',
  conditions: [
    { attribute: 'user.role', operator: 'equals', value: 'manager' },
    { attribute: 'resource.type', operator: 'equals', value: 'expense' },
    { attribute: 'resource.amount', operator: 'lessThanOrEqual', value: 10000 },
  ],
  effect: 'allow',
  permissions: ['expenses:approve'],
  priority: 100,
};
```

### Gates (Runtime Checks)

```typescript
// Gates are named authorization checks evaluated at runtime
interface Gate {
  name: string;
  description: string;
  check: (user: User, resource?: unknown, context?: unknown) => boolean | Promise<boolean>;
}

// Example gates
const gates = {
  'can-impersonate': (user, targetUser) => 
    user.hasPermission('users:impersonate') && 
    !targetUser.hasRole('super_admin'),
    
  'can-access-beta': (user) =>
    user.hasFlag('beta_tester') || user.hasRole('admin'),
    
  'can-export-data': (user, resource) =>
    user.hasPermission('data:export') &&
    resource.ventureId === user.currentVentureId,
};
```

---

## Module: tenants

### Purpose

Manages multi-tenancy for the MCV ecosystem. Ventures are top-level tenants, with workspaces providing sub-division within ventures.

### Tenant Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MCV ECOSYSTEM                                      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         VENTURES                                     │   │
│  │  (Top-level tenants — BetEdge, NexusHub, SerpSpace, etc.)           │   │
│  │                                                                      │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │                      WORKSPACES                                │  │   │
│  │  │  (Sub-tenants within a venture — teams, projects, clients)    │  │   │
│  │  │                                                                │  │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐  │  │   │
│  │  │  │                    RESOURCES                             │  │  │   │
│  │  │  │  (Data owned by workspace — contacts, orders, etc.)     │  │  │   │
│  │  │  └─────────────────────────────────────────────────────────┘  │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Venture Model

```typescript
interface Venture {
  id: VentureID;
  slug: string;               // URL-safe identifier (e.g., 'betedge')
  name: string;               // Display name
  domain: string;             // Primary domain (e.g., 'betedge.io')
  
  // Status
  status: VentureStatus;
  plan: VenturePlan;
  
  // Branding
  branding: {
    logo: string;
    favicon: string;
    primaryColor: string;
    secondaryColor: string;
  };
  
  // Settings
  settings: VentureSettings;
  
  // Limits
  limits: {
    maxUsers: number;
    maxWorkspaces: number;
    maxStorage: number;        // bytes
    maxApiCalls: number;       // per month
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  ownerId: UserID;
}

enum VentureStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  PENDING = 'pending',
}

enum VenturePlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}
```

### Workspace Model

```typescript
interface Workspace {
  id: WorkspaceID;
  ventureId: VentureID;
  slug: string;
  name: string;
  description?: string;
  
  // Hierarchy
  parentId?: WorkspaceID;      // For nested workspaces
  path: string;                // Materialized path (e.g., '/sales/enterprise')
  
  // Settings
  settings: WorkspaceSettings;
  visibility: 'public' | 'private' | 'restricted';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserID;
}
```

### Context Resolution

```typescript
// Context is resolved from request and propagated through the system
interface TenantContext {
  venture: Venture;
  workspace?: Workspace;
  
  // Resolution metadata
  resolvedFrom: 'subdomain' | 'header' | 'path' | 'token' | 'default';
  resolvedAt: Date;
}

// Resolution priority:
// 1. Explicit header (X-Venture-ID, X-Workspace-ID)
// 2. Subdomain (betedge.app.nexushub.io)
// 3. Path prefix (/v/betedge/...)
// 4. JWT claims (venture_id, workspace_id)
// 5. User's default venture/workspace
```

---

## Module: users

### Purpose

Manages user profiles, preferences, invitations, and account lifecycle. Users are global entities with venture-specific memberships and profiles.

### User Model

```typescript
interface User {
  // Core identity (global)
  id: UserID;
  email: string;                // Primary email, globally unique
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  
  // Profile (global defaults, can be overridden per-venture)
  profile: {
    firstName: string;
    lastName: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    timezone: string;
    locale: string;
  };
  
  // Security
  passwordHash?: string;        // Optional if using passwordless
  mfaEnabled: boolean;
  mfaMethods: MFAMethod[];
  
  // Status
  status: UserStatus;
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;             // Soft delete
}

enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  PENDING_INVITATION = 'pending_invitation',
}
```

### Venture Membership

```typescript
interface VentureMembership {
  id: string;
  userId: UserID;
  ventureId: VentureID;
  
  // Roles and permissions in this venture
  roles: VentureRole[];
  customPermissions: Permission[];
  
  // Venture-specific profile overrides
  profileOverrides?: Partial<UserProfile>;
  
  // Invitation tracking
  invitedBy?: UserID;
  invitedAt?: Date;
  acceptedAt?: Date;
  
  // Status
  status: MembershipStatus;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

enum MembershipStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
}
```

### Invitation System

```typescript
interface Invitation {
  id: string;
  ventureId: VentureID;
  workspaceId?: WorkspaceID;
  
  // Recipient
  email: string;
  existingUserId?: UserID;      // If inviting existing user
  
  // Invitation details
  roles: Role[];
  message?: string;
  
  // Security
  token: string;                // Secure random token
  expiresAt: Date;
  
  // Tracking
  invitedBy: UserID;
  status: InvitationStatus;
  sentAt: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  
  // Rate limiting
  resendCount: number;
  lastResentAt?: Date;
}

enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}
```

### Impersonation

```typescript
interface ImpersonationSession {
  id: string;
  
  // Who is impersonating whom
  impersonatorId: UserID;
  impersonatedId: UserID;
  
  // Context
  ventureId: VentureID;
  
  // Restrictions
  permissions: Permission[];     // Limited permissions during impersonation
  restrictedActions: string[];   // Actions that cannot be performed
  
  // Session
  startedAt: Date;
  expiresAt: Date;
  endedAt?: Date;
  
  // Audit
  reason: string;                // Required reason for impersonation
  approvedBy?: UserID;           // If approval required
}

// Impersonation restrictions:
// - Cannot change password or security settings
// - Cannot delete account
// - Cannot modify impersonation settings
// - All actions logged with impersonation context
```

### User Preferences

```typescript
interface UserPreferences {
  userId: UserID;
  ventureId?: VentureID;        // Venture-specific or global
  
  // Notification preferences
  notifications: {
    email: NotificationPreference;
    sms: NotificationPreference;
    push: NotificationPreference;
    inApp: NotificationPreference;
  };
  
  // UI preferences
  ui: {
    theme: 'light' | 'dark' | 'system';
    density: 'comfortable' | 'compact';
    sidebarCollapsed: boolean;
    defaultView: string;
  };
  
  // Privacy preferences
  privacy: {
    profileVisibility: 'public' | 'contacts' | 'private';
    activityVisibility: 'public' | 'contacts' | 'private';
    searchable: boolean;
  };
  
  // Communication preferences
  communication: {
    marketingEmails: boolean;
    productUpdates: boolean;
    securityAlerts: boolean;     // Cannot be disabled
  };
}

interface NotificationPreference {
  enabled: boolean;
  categories: Record<string, boolean>;
  quietHours?: {
    enabled: boolean;
    start: string;              // HH:mm
    end: string;
    timezone: string;
  };
}
```

---

## Module: sso

### Purpose

Provides cross-venture single sign-on, identity resolution, and account linking. Enables seamless authentication across the MCV ecosystem and integration with external identity providers.

### SSO Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SSO ARCHITECTURE                                    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     EXTERNAL IDENTITY PROVIDERS                       │  │
│  │                                                                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │  │
│  │  │ Google  │  │ GitHub  │  │ Discord │  │ Okta    │  │ Azure   │   │  │
│  │  │ (OIDC)  │  │ (OAuth) │  │ (OAuth) │  │ (SAML)  │  │ AD(SAML)│   │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │  │
│  │       │            │            │            │            │         │  │
│  │       └────────────┴────────────┴────────────┴────────────┘         │  │
│  │                               │                                      │  │
│  └───────────────────────────────┼──────────────────────────────────────┘  │
│                                  ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     MCV IDENTITY PROVIDER                             │  │
│  │                                                                       │  │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │  │
│  │  │  Identity   │───▶│   Account   │───▶│  Session    │              │  │
│  │  │  Resolution │    │   Linking   │    │  Creation   │              │  │
│  │  └─────────────┘    └─────────────┘    └─────────────┘              │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                  │                                          │
│                                  ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        MCV VENTURES                                   │  │
│  │                                                                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │  │
│  │  │ BetEdge │  │ NexusHub│  │SerpSpace│  │  MCV    │  │  Other  │   │  │
│  │  │         │  │         │  │         │  │ Studios │  │ Ventures│   │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cross-Venture SSO Flow

```typescript
// When user logs into VentureA, they're already logged into VentureB
interface SSOSession {
  id: string;
  userId: UserID;
  
  // Master session
  globalSessionId: string;
  
  // Venture-specific sessions
  ventureSessions: Map<VentureID, VentureSession>;
  
  // Security
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  
  // Device binding
  deviceId: string;
  deviceFingerprint: string;
}

interface VentureSession {
  ventureId: VentureID;
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
  expiresAt: Date;
}
```

### Identity Resolution

```typescript
// When a user authenticates via external provider, resolve to MCV identity
interface IdentityResolution {
  // External identity
  provider: string;           // 'google', 'github', 'okta', etc.
  externalId: string;         // Provider's user ID
  email: string;
  
  // Resolution result
  resolvedUserId?: UserID;    // Existing MCV user
  confidence: number;         // 0-100
  matchedOn: IdentityMatch[];
}

enum IdentityMatch {
  EXACT_EMAIL = 'exact_email',
  VERIFIED_EMAIL = 'verified_email',
  LINKED_ACCOUNT = 'linked_account',
  DOMAIN_MATCH = 'domain_match',
  PHONE_MATCH = 'phone_match',
}
```

### Account Linking

```typescript
interface LinkedAccount {
  id: string;
  userId: UserID;
  
  // Provider details
  provider: IdentityProvider;
  providerId: string;
  
  // Profile from provider
  providerProfile: {
    email?: string;
    name?: string;
    avatarUrl?: string;
    raw: Record<string, unknown>;
  };
  
  // Tokens (encrypted at rest)
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  
  // Status
  status: LinkStatus;
  linkedAt: Date;
  lastUsedAt: Date;
}

enum IdentityProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
  DISCORD = 'discord',
  APPLE = 'apple',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  MICROSOFT = 'microsoft',
  OKTA = 'okta',
  CUSTOM_SAML = 'custom_saml',
  CUSTOM_OIDC = 'custom_oidc',
}
```

### Enterprise Federation

```typescript
interface EnterpriseSSOConfig {
  id: string;
  ventureId: VentureID;
  
  // Provider type
  type: 'saml' | 'oidc';
  
  // SAML configuration
  saml?: {
    entityId: string;
    ssoUrl: string;
    sloUrl?: string;
    certificate: string;
    signatureAlgorithm: string;
    nameIdFormat: string;
  };
  
  // OIDC configuration
  oidc?: {
    issuer: string;
    clientId: string;
    clientSecret: string;     // Encrypted
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    scopes: string[];
  };
  
  // Attribute mapping
  attributeMapping: {
    email: string;
    firstName: string;
    lastName: string;
    groups?: string;
    department?: string;
    custom?: Record<string, string>;
  };
  
  // Provisioning
  autoProvision: boolean;
  defaultRoles: Role[];
  
  // Domains
  domains: string[];          // e.g., ['acme.com', 'acme.io']
  
  // Status
  enabled: boolean;
  verifiedAt?: Date;
}
```

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/kernel` | ^1.0.0 | Core primitives (db, config, logger, errors, types, context) |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@simplewebauthn/server` | ^9.x | WebAuthn/Passkey implementation |
| `@simplewebauthn/browser` | ^9.x | WebAuthn client-side |
| `otplib` | ^12.x | TOTP generation/verification |
| `bcrypt` | ^5.x | Password hashing |
| `jose` | ^5.x | JWT signing/verification |
| `saml2-js` | ^4.x | SAML 2.0 support |
| `openid-client` | ^5.x | OIDC client |
| `argon2` | ^0.31.x | Password hashing (preferred) |
| `speakeasy` | ^2.x | 2FA TOTP backup |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.3.x | TypeScript |

---

## Security Considerations

### Cryptographic Standards

| Use Case | Algorithm | Parameters |
|----------|-----------|------------|
| Password hashing | Argon2id | m=65536, t=3, p=4 |
| Token signing | EdDSA (Ed25519) | — |
| Session tokens | CSPRNG | 256 bits |
| Encryption at rest | AES-256-GCM | Random IV per encryption |
| Key derivation | HKDF-SHA256 | — |

### Security Headers

```typescript
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

### Rate Limiting

| Endpoint | Limit | Window | Action on exceed |
|----------|-------|--------|------------------|
| Login | 5 | 15 min | Block + CAPTCHA |
| Registration | 3 | 1 hour | Block |
| Password reset | 3 | 1 hour | Block |
| MFA verify | 5 | 5 min | Lockout 30 min |
| Token refresh | 60 | 1 min | Throttle |

### Audit Requirements

All authentication and authorization events MUST be logged:

```typescript
interface AuthAuditEvent {
  timestamp: Date;
  eventType: AuthEventType;
  userId?: UserID;
  ventureId?: VentureID;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  metadata: Record<string, unknown>;
}

enum AuthEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  TOKEN_REFRESH = 'token_refresh',
  PASSWORD_CHANGE = 'password_change',
  MFA_ENROLL = 'mfa_enroll',
  MFA_VERIFY = 'mfa_verify',
  PERMISSION_CHECK = 'permission_check',
  PERMISSION_DENIED = 'permission_denied',
  IMPERSONATION_START = 'impersonation_start',
  IMPERSONATION_END = 'impersonation_end',
}
```

---

## Related Documentation

- [auth Module Details](./auth/MODULE.md)
- [permissions Module Details](./permissions/MODULE.md)
- [tenants Module Details](./tenants/MODULE.md)
- [users Module Details](./users/MODULE.md)
- [sso Module Details](./sso/MODULE.md)
- [Technical Architecture](./02-TECHNICAL-ARCHITECTURE.md)
- [API Reference](./03-API-REFERENCE.md)
- [Implementation Plan](./04-IMPLEMENTATION-PLAN.md)

---

*@mcv/identity — The Security Boundary of MCV.ONE*
