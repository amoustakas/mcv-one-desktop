# @mcv/identity/tenants — Multi-Tenancy Module

**Parent Package:** @mcv/identity  
**Tier:** 1 (Security Boundary)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `tenants` module provides multi-tenancy infrastructure for the MCV.ONE ecosystem. In MCV, **ventures ARE tenants** — each of the 9 portfolio ventures (BetEdge, NexusHub, SerpSpace, etc.) operates as an isolated tenant with its own users, data, branding, API keys, and configuration. Every database query, every API call, and every UI render is scoped to a venture context.

This module manages the complete venture lifecycle: creation, configuration, membership, API key provisioning, hierarchical sub-ventures, and data isolation via Row-Level Security (RLS). It is the foundational boundary that makes MCV.ONE a true multi-tenant platform.

**No data crosses venture boundaries without explicit super-admin authorization.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// VENTURE CRUD
// ═══════════════════════════════════════════════════════════════════════════════

export { createVenture, updateVenture, archiveVenture, getVenture } from './ventures';
export { listVentures, searchVentures, getVentureBySlug } from './ventures';
export { getVentureHierarchy, getChildVentures } from './ventures';

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBERSHIP MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export { addMember, removeMember, updateMemberRole } from './memberships';
export { getVentureMembers, getUserVentures } from './memberships';
export { inviteMember, acceptInvite, revokeInvite } from './memberships';

// ═══════════════════════════════════════════════════════════════════════════════
// VENTURE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

export { getVentureSettings, updateVentureSettings } from './settings';
export { updateBranding, updateFeatures, updateLimits } from './settings';
export { configureWebhook, testWebhook } from './settings';

// ═══════════════════════════════════════════════════════════════════════════════
// API KEY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export { createApiKey, revokeApiKey, listApiKeys } from './api-keys';
export { validateApiKey, rotateApiKey } from './api-keys';

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIZATIONS (WITHIN VENTURES)
// ═══════════════════════════════════════════════════════════════════════════════

export { createOrganization, updateOrganization, deleteOrganization } from './organizations';
export { listOrganizations, getOrganization } from './organizations';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT & SCOPING
// ═══════════════════════════════════════════════════════════════════════════════

export { withVentureContext, getVentureContext, requireVenture } from './context';
export { setVentureScope, clearVentureScope } from './context';
export { resolveVentureFromRequest } from './context';

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION & FEATURE GATING
// ═══════════════════════════════════════════════════════════════════════════════

export { checkFeatureAccess, getVentureTier, checkLimit } from './subscription';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Venture, NewVenture,
  VentureMembership, NewVentureMembership,
  VentureSettingsRecord, NewVentureSettingsRecord,
  VentureApiKey, NewVentureApiKey,
  Organization, NewOrganization,
  VentureSettings, BrandColors,
  VentureSettingsBranding, VentureSettingsFeatures, VentureSettingsLimits,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           MCV.ONE MULTI-TENANCY ARCHITECTURE                      │
│                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                              REQUEST LAYER                                    │  │
│  │                                                                               │  │
│  │   Subdomain          Header              API Key          Session             │  │
│  │   betedge.mcv.one    X-Venture-ID        mcv_sk_xxx...    activeVentureId     │  │
│  │         │                  │                  │                │               │  │
│  │         └──────────────────┴──────────────────┴────────────────┘               │  │
│  │                                    │                                           │  │
│  │                          ┌─────────▼──────────┐                                │  │
│  │                          │  Venture Resolver   │                                │  │
│  │                          │  resolveFromRequest │                                │  │
│  │                          └─────────┬──────────┘                                │  │
│  │                                    │                                           │  │
│  └────────────────────────────────────┼───────────────────────────────────────────┘  │
│                                       │                                              │
│  ┌────────────────────────────────────┼───────────────────────────────────────────┐  │
│  │                          VENTURE CONTEXT LAYER                                  │  │
│  │                                    │                                            │  │
│  │                     ┌──────────────▼──────────────┐                             │  │
│  │                     │   PostgreSQL SET config     │                             │  │
│  │                     │   app.current_venture_id    │                             │  │
│  │                     └──────────────┬──────────────┘                             │  │
│  │                                    │                                            │  │
│  │    ┌───────────────┬───────────────┼───────────────┬───────────────┐            │  │
│  │    │               │               │               │               │            │  │
│  │    ▼               ▼               ▼               ▼               ▼            │  │
│  │ ┌──────┐     ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │  │
│  │ │Venture│    │Membership│   │ Settings │   │ API Keys │   │  Orgs    │        │  │
│  │ │ CRUD  │    │  Mgmt    │   │ & Brand  │   │ & Scopes │   │ (B2B)   │        │  │
│  │ └──────┘     └──────────┘   └──────────┘   └──────────┘   └──────────┘        │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              STORAGE LAYER                                       │  │
│  │                                                                                  │  │
│  │   ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐                   │  │
│  │   │  ventures   │  │ venture_members  │  │ venture_settings │                   │  │
│  │   │             │  │                  │  │                  │                   │  │
│  │   │ id          │◄─│ venture_id       │  │ venture_id (1:1) │                   │  │
│  │   │ slug        │  │ user_id          │  │ branding (JSONB) │                   │  │
│  │   │ name        │  │ role (enum)      │  │ features (JSONB) │                   │  │
│  │   │ status      │  │ organization_id  │  │ limits (JSONB)   │                   │  │
│  │   │ tier        │  └──────────────────┘  │ webhook config   │                   │  │
│  │   │ parent_id   │                        └──────────────────┘                   │  │
│  │   │ settings    │  ┌──────────────────┐  ┌──────────────────┐                   │  │
│  │   │ brand_colors│  │venture_api_keys  │  │  organizations   │                   │  │
│  │   │ features    │  │                  │  │                  │                   │  │
│  │   │ domain      │  │ venture_id       │  │ venture_id (RLS) │                   │  │
│  │   └─────────────┘  │ key_hash         │  │ name, domain     │                   │  │
│  │         ▲          │ scopes           │  │ industry         │                   │  │
│  │         │          │ allowed_ips      │  │ address (JSONB)  │                   │  │
│  │    parent_id       │ usage tracking   │  └──────────────────┘                   │  │
│  │   (self-ref)       └──────────────────┘                                         │  │
│  │                                                                                  │  │
│  │   ALL tables enforce RLS: WHERE venture_id = current_setting('app.venture_id')   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schemas

### `ventures` Table

The core tenant table. Every venture is an isolated tenant boundary.

```typescript
export const ventures = pgTable('ventures', {
  // ─── Primary Key ──────────────────────────────────────────────────────────
  id: uuid('id').primaryKey().defaultRandom(),
  //   UUID v4, auto-generated. Referenced by every other table as venture_id.

  // ─── Identity ─────────────────────────────────────────────────────────────
  slug: text('slug').unique().notNull(),
  //   URL-safe identifier (e.g., 'betedge', 'nexushub'). Used in subdomains,
  //   API paths, and venture resolution. Immutable after creation.
  //   Constraint: lowercase, alphanumeric + hyphens, 3-63 chars.

  name: text('name').notNull(),
  //   Human-readable display name (e.g., 'BetEdge', 'NexusHub').

  description: text('description'),
  //   Optional description for admin dashboards and venture directories.

  // ─── Branding ─────────────────────────────────────────────────────────────
  logoUrl: text('logo_url'),
  //   Primary logo URL for the venture. Served via CDN.

  brandColors: jsonb('brand_colors').$type<BrandColors>(),
  //   Theme colors for white-labeling. See BrandColors interface below.

  // ─── Configuration (JSONB) ────────────────────────────────────────────────
  settings: jsonb('settings').$type<VentureSettings>(),
  //   Inline venture-level settings (auth requirements, session config).
  //   Note: Extended settings are in the venture_settings table.

  features: jsonb('features').$type<Record<string, boolean>>(),
  //   Feature flag overrides. Merged with tier defaults at runtime.
  //   Example: { "gamification": true, "web3": false }

  metadata: jsonb('metadata'),
  //   Arbitrary key-value metadata. Used for integration-specific data,
  //   billing references, or deployment tags.

  // ─── Status ───────────────────────────────────────────────────────────────
  status: text('status', {
    enum: ['active', 'suspended', 'archived', 'pending']
  }).default('active'),
  //   active    → Normal operation
  //   pending   → Created but awaiting configuration/approval
  //   suspended → Temporarily disabled (billing, policy violation)
  //   archived  → Soft-deleted, data retained per retention policy

  // ─── Subscription Tier ────────────────────────────────────────────────────
  tier: text('tier', {
    enum: ['free', 'starter', 'professional', 'enterprise']
  }).default('free'),
  //   Determines feature access, limits, and SLA. See Subscription Tiers.

  // ─── Custom Domain ────────────────────────────────────────────────────────
  domain: text('domain'),
  //   Optional custom domain (e.g., 'app.betedge.com'). Requires DNS
  //   verification before activation. Null = uses {slug}.mcv.one.

  // ─── Hierarchy ────────────────────────────────────────────────────────────
  parentId: uuid('parent_id'),
  //   Self-referencing FK for sub-ventures. Top-level ventures have null.
  //   Enables: MCV Consortium → Venture → Sub-venture hierarchy.

  // ─── Timestamps ───────────────────────────────────────────────────────────
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('ventures_slug_idx').on(table.slug),           // Venture resolution by slug
  index('ventures_status_idx').on(table.status),       // Filter active/suspended
  index('ventures_parent_id_idx').on(table.parentId),  // Hierarchy traversal
]);
```

#### TypeScript Interfaces (Venture JSONB fields)

```typescript
// Inline settings stored on ventures.settings
interface VentureSettings {
  allowPublicRegistration?: boolean;   // Allow self-signup (default: false)
  requireEmailVerification?: boolean;  // Require email verify before access
  requireMfa?: boolean;                // Force MFA for all users
  sessionDurationHours?: number;       // Override default session TTL
  maxSessionsPerUser?: number;         // Concurrent session limit
}

// Brand color palette for white-labeling
interface BrandColors {
  primary: string;      // Main brand color (hex, e.g., '#3B82F6')
  accent?: string;      // Secondary/accent color
  background?: string;  // App background
  foreground?: string;  // Text/foreground color
}
```

#### Drizzle Relations

```typescript
export const venturesRelations = relations(ventures, ({ one, many }) => ({
  // Self-referencing hierarchy
  parent: one(ventures, {
    fields: [ventures.parentId],
    references: [ventures.id],
    relationName: 'ventureHierarchy',
  }),
  children: many(ventures, {
    relationName: 'ventureHierarchy',
  }),
}));

export type Venture = typeof ventures.$inferSelect;
export type NewVenture = typeof ventures.$inferInsert;
```

---

### `venture_memberships` Table

Links users to ventures with role-based access. A user can belong to multiple ventures.

```typescript
export const ventureMemberRoleEnum = pgEnum('venture_member_role', [
  'admin',    // Full venture management (settings, members, billing)
  'member',   // Standard access (use features, view data)
  'billing',  // Billing and subscription management only
]);

export const ventureMemberships = pgTable('venture_memberships', {
  // ─── Primary Key ──────────────────────────────────────────────────────────
  id: uuid('id').primaryKey().defaultRandom(),

  // ─── Foreign Keys ─────────────────────────────────────────────────────────
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  //   The user being granted membership.

  ventureId: uuid('venture_id')
    .references(() => ventures.id, { onDelete: 'cascade' })
    .notNull(),
  //   The venture the user belongs to.

  organizationId: uuid('organization_id')
    .references(() => ventures.id, { onDelete: 'cascade' }),
  //   Optional organization within the venture (for B2B scenarios).
  //   Note: references ventures.id, not organizations.id — design choice
  //   for flexibility (organizations can themselves be venture-scoped).

  // ─── Role ─────────────────────────────────────────────────────────────────
  role: ventureMemberRoleEnum('role').default('member').notNull(),
  //   admin   → Full management access
  //   member  → Standard user access
  //   billing → Financial operations only

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  //   When the user formally joined (accepted invite). Legacy field.

  leftAt: timestamp('left_at', { withTimezone: true }),
  //   When the user left or was removed. Null = active member.
  //   Soft-delete: row retained for audit trail.

  // ─── Timestamps ───────────────────────────────────────────────────────────
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  // One membership per user per venture
  uniqueIndex('venture_membership_idx').on(table.userId, table.ventureId),
  // One membership per user per organization
  uniqueIndex('venture_membership_org_idx').on(table.userId, table.organizationId),
  // Fast lookup: "which ventures does this user belong to?"
  index('venture_memberships_user_id_idx').on(table.userId),
]);
```

#### Drizzle Relations

```typescript
export const ventureMembershipsRelations = relations(ventureMemberships, ({ one }) => ({
  user: one(users, {
    fields: [ventureMemberships.userId],
    references: [users.id],
  }),
  venture: one(ventures, {
    fields: [ventureMemberships.ventureId],
    references: [ventures.id],
  }),
  organization: one(ventures, {
    fields: [ventureMemberships.organizationId],
    references: [ventures.id],
  }),
}));

export type VentureMembership = typeof ventureMemberships.$inferSelect;
export type NewVentureMembership = typeof ventureMemberships.$inferInsert;
```

---

### `venture_settings` Table

Extended configuration per venture. 1:1 relationship with ventures. Separates frequently-updated settings from the core venture record.

```typescript
export const ventureSettings = pgTable('venture_settings', {
  // ─── Primary Key ──────────────────────────────────────────────────────────
  id: uuid('id').defaultRandom().primaryKey(),

  // ─── Foreign Key ──────────────────────────────────────────────────────────
  ventureId: uuid('venture_id')
    .references(() => ventures.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  //   1:1 with ventures. Cascade delete when venture is removed.

  // ─── Branding (JSONB) ────────────────────────────────────────────────────
  branding: jsonb('branding').$type<VentureSettingsBranding>().default({}),
  //   Extended branding beyond ventures.brandColors. Includes logos for
  //   light/dark mode, favicon, fonts, and custom CSS injection.

  // ─── Features (JSONB) ────────────────────────────────────────────────────
  features: jsonb('features').$type<VentureSettingsFeatures>().default({}),
  //   Feature toggles controlling what capabilities are available.
  //   Merged with tier defaults — venture toggles override tier defaults.

  // ─── Limits (JSONB) ──────────────────────────────────────────────────────
  limits: jsonb('limits').$type<VentureSettingsLimits>().default({}),
  //   Resource limits per venture. Enforced at application layer.
  //   Null/missing values inherit from tier defaults.

  // ─── Contact ──────────────────────────────────────────────────────────────
  supportEmail: text('support_email'),
  //   Customer-facing support email for this venture.

  billingEmail: text('billing_email'),
  //   Billing contact email (invoices, payment issues).

  // ─── Webhooks ─────────────────────────────────────────────────────────────
  webhookUrl: text('webhook_url'),
  //   Endpoint URL for webhook delivery. Must be HTTPS in production.

  webhookSecret: text('webhook_secret'),
  //   HMAC-SHA256 signing secret for webhook payload verification.
  //   Generated server-side, never exposed in API responses.

  webhookEvents: jsonb('webhook_events').$type<string[]>().default([]),
  //   Array of event types to deliver. Example:
  //   ['user.created', 'user.deleted', 'membership.changed']

  // ─── Timestamps ───────────────────────────────────────────────────────────
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### Settings JSONB Interfaces

```typescript
interface VentureSettingsBranding {
  logoUrl?: string;         // Primary logo
  logoLightUrl?: string;    // Logo for light backgrounds
  logoDarkUrl?: string;     // Logo for dark backgrounds
  faviconUrl?: string;      // Browser favicon (ICO/PNG)
  primaryColor?: string;    // Primary brand color
  secondaryColor?: string;  // Secondary color
  accentColor?: string;     // Accent/highlight color
  fontFamily?: string;      // Custom font family (Google Fonts name)
  customCss?: string;       // Raw CSS injection for deep customization
}

interface VentureSettingsFeatures {
  gamification?: boolean;   // Points, badges, leaderboards
  web3?: boolean;           // Blockchain/wallet integration
  analytics?: boolean;      // Analytics dashboard
  aiAssistant?: boolean;    // AI-powered features
  sso?: boolean;            // SAML/OIDC SSO
  mfaRequired?: boolean;    // Force MFA for all venture users
  apiAccess?: boolean;      // Enable API key generation
  webhooks?: boolean;       // Enable webhook configuration
  customDomain?: boolean;   // Allow custom domain mapping
}

interface VentureSettingsLimits {
  maxUsers?: number;              // Maximum users in venture
  maxApiCallsPerMonth?: number;   // API rate limit (monthly)
  maxStorageGb?: number;          // Storage quota
  maxFileSizeMb?: number;         // Single file upload limit
  maxWebhooks?: number;           // Webhook endpoint limit
  maxApiKeys?: number;            // API key limit
}
```

---

### `venture_api_keys` Table

Scoped API keys for programmatic access to venture resources.

```typescript
export const ventureApiKeys = pgTable('venture_api_keys', {
  // ─── Primary Key ──────────────────────────────────────────────────────────
  id: uuid('id').defaultRandom().primaryKey(),

  // ─── Foreign Key ──────────────────────────────────────────────────────────
  ventureId: uuid('venture_id')
    .references(() => ventures.id, { onDelete: 'cascade' })
    .notNull(),
  //   API key is scoped to this venture. Cascade on venture deletion.

  // ─── Key Identity ─────────────────────────────────────────────────────────
  name: text('name').notNull(),
  //   Human-readable label (e.g., 'Production Backend', 'CI/CD Pipeline').

  keyPrefix: text('key_prefix').notNull(),
  //   First 8-15 characters of the key for display in UI.
  //   Format: 'mcv_sk_xxxx' — allows identification without exposing full key.

  keyHash: text('key_hash').notNull(),
  //   SHA-256 hash of the full API key. Used for validation.
  //   Full key is NEVER stored — only returned once at creation time.

  // ─── Scopes ───────────────────────────────────────────────────────────────
  scopes: jsonb('scopes').$type<string[]>().default([]),
  //   Permission scopes granted to this key. Examples:
  //   ['read:users', 'write:users', 'read:analytics', 'admin:*']
  //   Empty array = no access. Must be explicitly granted.

  // ─── Restrictions ─────────────────────────────────────────────────────────
  allowedIps: jsonb('allowed_ips').$type<string[]>(),
  //   IP whitelist (CIDR notation supported). Null = no restriction.
  //   Example: ['10.0.0.0/8', '203.0.113.50']

  allowedDomains: jsonb('allowed_domains').$type<string[]>(),
  //   Domain whitelist for browser-based API usage (CORS origin check).
  //   Example: ['app.betedge.com', '*.mcv.one']

  // ─── Expiry ───────────────────────────────────────────────────────────────
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  //   Optional expiration. Null = no expiry (not recommended for production).

  // ─── Status ───────────────────────────────────────────────────────────────
  isActive: boolean('is_active').default(true).notNull(),
  //   Soft toggle. False = key rejected immediately on validation.

  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  //   When the key was revoked. Set alongside isActive = false.

  revokedBy: uuid('revoked_by').references(() => users.id),
  //   Who revoked the key (audit trail).

  // ─── Usage Tracking ───────────────────────────────────────────────────────
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  //   Last successful API call with this key.

  lastUsedIp: text('last_used_ip'),
  //   IP address of last use (for anomaly detection).

  usageCount: integer('usage_count').default(0).notNull(),
  //   Total successful API calls made with this key.

  // ─── Audit ────────────────────────────────────────────────────────────────
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  //   Who created the key. Required for audit compliance.

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_venture_api_keys_venture').on(table.ventureId),   // List keys by venture
  index('idx_venture_api_keys_prefix').on(table.keyPrefix),    // Display lookup
  index('idx_venture_api_keys_hash').on(table.keyHash),        // Validation lookup (hot path)
]);
```

---

### `organizations` Table

B2B customer organizations within a venture. Scoped by `venture_id` for RLS.

```typescript
export interface OrganizationAddress {
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;         // ISO 3166-1 alpha-2
  latitude?: number;
  longitude?: number;
}

export const organizations = pgTable('organizations', {
  // ─── Primary Key ──────────────────────────────────────────────────────────
  id: uuid('id').primaryKey().defaultRandom(),

  // ─── Venture Scope (RLS) ──────────────────────────────────────────────────
  ventureId: uuid('venture_id')
    .notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  //   Every organization belongs to exactly one venture.
  //   RLS policy: WHERE venture_id = current_setting('app.current_venture_id')

  // ─── Identity ─────────────────────────────────────────────────────────────
  name: text('name').notNull(),
  //   Organization name (e.g., 'Acme Corp').

  domain: text('domain'),
  //   Primary email domain (e.g., 'acme.com'). Used for auto-join policies.

  website: text('website'),
  //   Organization website URL.

  // ─── Business Details ─────────────────────────────────────────────────────
  industry: text('industry'),
  //   Industry classification (free-text or controlled vocabulary).

  employeeCount: integer('employee_count'),
  //   Approximate employee count (for segmentation/billing).

  annualRevenue: decimal('annual_revenue', { precision: 15, scale: 2 }),
  //   Revenue in USD (for enterprise tier qualification).

  // ─── Location ─────────────────────────────────────────────────────────────
  address: jsonb('address').$type<OrganizationAddress>(),
  //   Structured address with optional geocoordinates.

  // ─── Timestamps ───────────────────────────────────────────────────────────
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('organizations_venture_idx').on(table.ventureId),
  index('organizations_name_idx').on(table.name),
  index('organizations_domain_idx').on(table.domain),
  index('organizations_industry_idx').on(table.industry),
  index('organizations_venture_name_idx').on(table.ventureId, table.name),
  index('organizations_venture_created_idx').on(table.ventureId, table.createdAt),
]);
```

---

## Venture Lifecycle

```
  ┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌───────────┐
  │  CREATE   │────▶│  CONFIGURE   │────▶│  OPERATE  │────▶│  ARCHIVE  │
  │ (pending) │     │  (pending→   │     │  (active) │     │ (archived)│
  │           │     │    active)   │     │           │     │           │
  └──────────┘     └──────────────┘     └─────┬─────┘     └───────────┘
                                              │
                                        ┌─────▼─────┐
                                        │  SUSPEND   │
                                        │(suspended) │
                                        └───────────┘
```

### 1. Create Venture

```typescript
import { db, schema } from '@mcv/kernel';
import { ventures, ventureSettings } from '@mcv/identity';

export async function createVenture(input: {
  name: string;
  slug: string;
  description?: string;
  tier?: 'free' | 'starter' | 'professional' | 'enterprise';
  parentId?: string;
  createdBy: string;
}): Promise<Venture> {
  const { name, slug, tier = 'free', createdBy, ...rest } = input;

  // Validate slug format
  if (!/^[a-z][a-z0-9-]{1,61}[a-z0-9]$/.test(slug)) {
    throw new ValidationError('INVALID_SLUG', 'Slug must be 3-63 lowercase alphanumeric + hyphens');
  }

  // Check slug uniqueness
  const existing = await db.query.ventures.findFirst({
    where: eq(schema.ventures.slug, slug),
  });
  if (existing) {
    throw new ConflictError('SLUG_TAKEN', `Slug "${slug}" is already in use`);
  }

  return await db.transaction(async (tx) => {
    // Create the venture
    const [venture] = await tx.insert(schema.ventures).values({
      name,
      slug,
      tier,
      status: 'pending',
      settings: {
        allowPublicRegistration: false,
        requireEmailVerification: true,
        requireMfa: false,
        sessionDurationHours: 24,
        maxSessionsPerUser: 10,
      },
      ...rest,
    }).returning();

    // Create default settings record
    await tx.insert(schema.ventureSettings).values({
      ventureId: venture.id,
      features: getDefaultFeatures(tier),
      limits: getDefaultLimits(tier),
    });

    // Add creator as admin member
    await tx.insert(schema.ventureMemberships).values({
      userId: createdBy,
      ventureId: venture.id,
      role: 'admin',
      joinedAt: new Date(),
    });

    // Audit
    await auditLog({
      action: 'tenant.venture.created',
      actorId: createdBy,
      resourceType: 'Venture',
      resourceId: venture.id,
      metadata: { name, slug, tier },
    });

    return venture;
  });
}
```

### 2. Configure Venture

```typescript
export async function configureVenture(
  ventureId: string,
  config: {
    branding?: VentureSettingsBranding;
    features?: Partial<VentureSettingsFeatures>;
    limits?: Partial<VentureSettingsLimits>;
    supportEmail?: string;
    billingEmail?: string;
    domain?: string;
  },
  actorId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    // Update branding/settings on venture_settings
    if (config.branding || config.features || config.limits ||
        config.supportEmail || config.billingEmail) {
      const current = await tx.query.ventureSettings.findFirst({
        where: eq(schema.ventureSettings.ventureId, ventureId),
      });

      await tx.update(schema.ventureSettings)
        .set({
          branding: config.branding
            ? { ...current?.branding, ...config.branding }
            : undefined,
          features: config.features
            ? { ...current?.features, ...config.features }
            : undefined,
          limits: config.limits
            ? { ...current?.limits, ...config.limits }
            : undefined,
          supportEmail: config.supportEmail ?? undefined,
          billingEmail: config.billingEmail ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(schema.ventureSettings.ventureId, ventureId));
    }

    // Update custom domain on venture record
    if (config.domain !== undefined) {
      await tx.update(schema.ventures)
        .set({ domain: config.domain, updatedAt: new Date() })
        .where(eq(schema.ventures.id, ventureId));
    }

    // Activate if still pending
    await tx.update(schema.ventures)
      .set({ status: 'active', updatedAt: new Date() })
      .where(
        and(
          eq(schema.ventures.id, ventureId),
          eq(schema.ventures.status, 'pending'),
        )
      );
  });

  await auditLog({
    action: 'tenant.venture.configured',
    actorId,
    resourceType: 'Venture',
    resourceId: ventureId,
    metadata: { changes: Object.keys(config) },
  });
}
```

### 3. Suspend Venture

```typescript
export async function suspendVenture(
  ventureId: string,
  reason: string,
  suspendedBy: string,
): Promise<void> {
  await db.update(schema.ventures)
    .set({
      status: 'suspended',
      metadata: { suspendedReason: reason, suspendedAt: new Date().toISOString() },
      updatedAt: new Date(),
    })
    .where(eq(schema.ventures.id, ventureId));

  await auditLog({
    action: 'tenant.venture.suspended',
    actorId: suspendedBy,
    resourceType: 'Venture',
    resourceId: ventureId,
    severity: 'warning',
    metadata: { reason },
  });
}
```

### 4. Archive Venture

```typescript
export async function archiveVenture(
  ventureId: string,
  archivedBy: string,
): Promise<void> {
  // Validate: no active sub-ventures
  const children = await db.query.ventures.findMany({
    where: and(
      eq(schema.ventures.parentId, ventureId),
      ne(schema.ventures.status, 'archived'),
    ),
  });

  if (children.length > 0) {
    throw new ConflictError(
      'ACTIVE_CHILDREN',
      'Cannot archive venture with active sub-ventures',
    );
  }

  await db.transaction(async (tx) => {
    // Revoke all API keys
    await tx.update(schema.ventureApiKeys)
      .set({ isActive: false, revokedAt: new Date(), revokedBy: archivedBy })
      .where(
        and(
          eq(schema.ventureApiKeys.ventureId, ventureId),
          eq(schema.ventureApiKeys.isActive, true),
        )
      );

    // Archive the venture
    await tx.update(schema.ventures)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(schema.ventures.id, ventureId));
  });

  await auditLog({
    action: 'tenant.venture.archived',
    actorId: archivedBy,
    resourceType: 'Venture',
    resourceId: ventureId,
    severity: 'warning',
  });
}
```

---

## Venture Context Management

Every request must be scoped to a venture. The context propagation chain:

### Resolution Priority

```typescript
export async function resolveVentureFromRequest(req: Request): Promise<string | null> {
  // 1. API Key header (highest priority — explicit machine context)
  const apiKey = req.headers.get('X-API-Key') || req.headers.get('Authorization')?.replace('Bearer mcv_sk_', 'mcv_sk_');
  if (apiKey?.startsWith('mcv_sk_')) {
    const validated = await validateApiKey(apiKey);
    if (validated) return validated.ventureId;
  }

  // 2. Explicit header
  const headerVenture = req.headers.get('X-Venture-ID');
  if (headerVenture) return headerVenture;

  // 3. Subdomain extraction
  const host = req.headers.get('host') || '';
  const match = host.match(/^([a-z0-9-]+)\.mcv\.one$/);
  if (match && match[1] !== 'api' && match[1] !== 'auth') {
    const venture = await db.query.ventures.findFirst({
      where: eq(schema.ventures.slug, match[1]),
    });
    if (venture) return venture.id;
  }

  // 4. Custom domain lookup
  if (host && !host.endsWith('.mcv.one')) {
    const venture = await db.query.ventures.findFirst({
      where: eq(schema.ventures.domain, host),
    });
    if (venture) return venture.id;
  }

  // 5. Session's active venture
  const session = await getSession(req);
  if (session?.activeVentureId) return session.activeVentureId;

  return null;
}
```

### Setting PostgreSQL Context for RLS

```typescript
import { sql } from 'drizzle-orm';

export async function setVentureScope(
  tx: PgTransaction | PgDatabase,
  ventureId: string,
): Promise<void> {
  // Set PostgreSQL session variable for RLS policies
  await tx.execute(
    sql`SELECT set_config('app.current_venture_id', ${ventureId}, true)`
  );
}

export async function withVentureContext<T>(
  ventureId: string,
  fn: () => Promise<T>,
): Promise<T> {
  return await db.transaction(async (tx) => {
    await setVentureScope(tx, ventureId);
    return await fn();
  });
}
```

### RLS Policy (SQL)

```sql
-- Enable RLS on all venture-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Isolation policy: users can only see rows matching current venture
CREATE POLICY "organizations_venture_isolation" ON organizations
  FOR ALL
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- Service role bypass (for migrations, admin operations)
CREATE POLICY "organizations_service_bypass" ON organizations
  FOR ALL
  TO service_role
  USING (true);
```

### Middleware

```typescript
import { requireVenture } from '@mcv/identity';

// Apply to all routes that need venture context
export const ventureRouter = router()
  .use(requireVenture())  // 403 if no venture resolved
  .get('/products', async (ctx) => {
    // ctx.venture is guaranteed to exist
    const products = await db.query.products.findMany({
      where: eq(schema.products.ventureId, ctx.venture.id),
    });
    return products;
  });
```

---

## Membership Management

### Add Member

```typescript
export async function addMember(
  ventureId: string,
  userId: string,
  role: 'admin' | 'member' | 'billing' = 'member',
  actorId: string,
): Promise<VentureMembership> {
  // Check venture exists and is active
  const venture = await db.query.ventures.findFirst({
    where: eq(schema.ventures.id, ventureId),
  });
  if (!venture || venture.status !== 'active') {
    throw new NotFoundError('VENTURE_NOT_FOUND');
  }

  // Check limits
  const settings = await db.query.ventureSettings.findFirst({
    where: eq(schema.ventureSettings.ventureId, ventureId),
  });
  const currentCount = await db
    .select({ count: count() })
    .from(schema.ventureMemberships)
    .where(
      and(
        eq(schema.ventureMemberships.ventureId, ventureId),
        isNull(schema.ventureMemberships.leftAt),
      )
    );

  if (settings?.limits?.maxUsers && currentCount[0].count >= settings.limits.maxUsers) {
    throw new LimitError('MAX_USERS_REACHED', `Venture limit: ${settings.limits.maxUsers} users`);
  }

  const [membership] = await db.insert(schema.ventureMemberships).values({
    userId,
    ventureId,
    role,
    joinedAt: new Date(),
  }).returning();

  await auditLog({
    action: 'tenant.member.added',
    actorId,
    resourceType: 'VentureMembership',
    resourceId: membership.id,
    metadata: { ventureId, userId, role },
  });

  return membership;
}
```

### Update Member Role

```typescript
export async function updateMemberRole(
  ventureId: string,
  userId: string,
  newRole: 'admin' | 'member' | 'billing',
  actorId: string,
): Promise<void> {
  // Prevent removing the last admin
  if (newRole !== 'admin') {
    const adminCount = await db
      .select({ count: count() })
      .from(schema.ventureMemberships)
      .where(
        and(
          eq(schema.ventureMemberships.ventureId, ventureId),
          eq(schema.ventureMemberships.role, 'admin'),
          isNull(schema.ventureMemberships.leftAt),
        )
      );

    const isTargetAdmin = await db.query.ventureMemberships.findFirst({
      where: and(
        eq(schema.ventureMemberships.ventureId, ventureId),
        eq(schema.ventureMemberships.userId, userId),
        eq(schema.ventureMemberships.role, 'admin'),
      ),
    });

    if (adminCount[0].count <= 1 && isTargetAdmin) {
      throw new ConflictError('LAST_ADMIN', 'Cannot remove the last admin from a venture');
    }
  }

  await db.update(schema.ventureMemberships)
    .set({ role: newRole, updatedAt: new Date() })
    .where(
      and(
        eq(schema.ventureMemberships.ventureId, ventureId),
        eq(schema.ventureMemberships.userId, userId),
      )
    );

  await auditLog({
    action: 'tenant.member.role_changed',
    actorId,
    resourceType: 'VentureMembership',
    metadata: { ventureId, userId, newRole },
  });
}
```

### Remove Member (Soft Delete)

```typescript
export async function removeMember(
  ventureId: string,
  userId: string,
  actorId: string,
): Promise<void> {
  // Prevent removing the last admin
  const membership = await db.query.ventureMemberships.findFirst({
    where: and(
      eq(schema.ventureMemberships.ventureId, ventureId),
      eq(schema.ventureMemberships.userId, userId),
      isNull(schema.ventureMemberships.leftAt),
    ),
  });

  if (!membership) {
    throw new NotFoundError('MEMBERSHIP_NOT_FOUND');
  }

  if (membership.role === 'admin') {
    const adminCount = await db
      .select({ count: count() })
      .from(schema.ventureMemberships)
      .where(
        and(
          eq(schema.ventureMemberships.ventureId, ventureId),
          eq(schema.ventureMemberships.role, 'admin'),
          isNull(schema.ventureMemberships.leftAt),
        )
      );

    if (adminCount[0].count <= 1) {
      throw new ConflictError('LAST_ADMIN', 'Cannot remove the last admin');
    }
  }

  // Soft delete: set leftAt
  await db.update(schema.ventureMemberships)
    .set({ leftAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.ventureMemberships.id, membership.id));

  await auditLog({
    action: 'tenant.member.removed',
    actorId,
    resourceType: 'VentureMembership',
    resourceId: membership.id,
    metadata: { ventureId, userId, role: membership.role },
  });
}
```

### Get User's Ventures

```typescript
export async function getUserVentures(userId: string): Promise<Array<{
  venture: Venture;
  role: string;
  joinedAt: Date | null;
}>> {
  const memberships = await db.query.ventureMemberships.findMany({
    where: and(
      eq(schema.ventureMemberships.userId, userId),
      isNull(schema.ventureMemberships.leftAt),
    ),
    with: { venture: true },
  });

  return memberships
    .filter((m) => m.venture.status === 'active')
    .map((m) => ({
      venture: m.venture,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
}
```

---

## API Key Management

### Create API Key

```typescript
import { createHash, randomBytes } from 'crypto';

export async function createApiKey(input: {
  ventureId: string;
  name: string;
  scopes: string[];
  allowedIps?: string[];
  allowedDomains?: string[];
  expiresAt?: Date;
  createdBy: string;
}): Promise<{ apiKey: VentureApiKey; rawKey: string }> {
  const { ventureId, name, scopes, createdBy, ...rest } = input;

  // Check API key limit
  const settings = await db.query.ventureSettings.findFirst({
    where: eq(schema.ventureSettings.ventureId, ventureId),
  });
  const keyCount = await db
    .select({ count: count() })
    .from(schema.ventureApiKeys)
    .where(
      and(
        eq(schema.ventureApiKeys.ventureId, ventureId),
        eq(schema.ventureApiKeys.isActive, true),
      )
    );

  const maxKeys = settings?.limits?.maxApiKeys ?? 10;
  if (keyCount[0].count >= maxKeys) {
    throw new LimitError('MAX_API_KEYS', `Maximum ${maxKeys} active API keys per venture`);
  }

  // Generate the key: mcv_sk_{32 random bytes in hex}
  const rawSecret = randomBytes(32).toString('hex');
  const rawKey = `mcv_sk_${rawSecret}`;
  const keyPrefix = rawKey.slice(0, 15);  // 'mcv_sk_xxxxxxxx'
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const [apiKey] = await db.insert(schema.ventureApiKeys).values({
    ventureId,
    name,
    keyPrefix,
    keyHash,
    scopes,
    createdBy,
    ...rest,
  }).returning();

  await auditLog({
    action: 'tenant.api_key.created',
    actorId: createdBy,
    resourceType: 'VentureApiKey',
    resourceId: apiKey.id,
    metadata: { ventureId, name, scopes, keyPrefix },
  });

  // rawKey is returned ONCE and never stored
  return { apiKey, rawKey };
}
```

### Validate API Key (Hot Path)

```typescript
export async function validateApiKey(rawKey: string): Promise<{
  ventureId: string;
  scopes: string[];
  keyId: string;
} | null> {
  if (!rawKey.startsWith('mcv_sk_')) return null;

  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const key = await db.query.ventureApiKeys.findFirst({
    where: and(
      eq(schema.ventureApiKeys.keyHash, keyHash),
      eq(schema.ventureApiKeys.isActive, true),
    ),
  });

  if (!key) return null;

  // Check expiration
  if (key.expiresAt && key.expiresAt < new Date()) {
    return null;
  }

  // Check IP restriction (caller must pass IP separately)
  // Handled at middleware layer

  // Update usage stats (fire-and-forget, don't block validation)
  db.update(schema.ventureApiKeys)
    .set({
      lastUsedAt: new Date(),
      usageCount: sql`${schema.ventureApiKeys.usageCount} + 1`,
    })
    .where(eq(schema.ventureApiKeys.id, key.id))
    .execute()
    .catch(() => {}); // Non-blocking

  return {
    ventureId: key.ventureId,
    scopes: key.scopes ?? [],
    keyId: key.id,
  };
}
```

### Revoke API Key

```typescript
export async function revokeApiKey(
  keyId: string,
  revokedBy: string,
): Promise<void> {
  await db.update(schema.ventureApiKeys)
    .set({
      isActive: false,
      revokedAt: new Date(),
      revokedBy,
      updatedAt: new Date(),
    })
    .where(eq(schema.ventureApiKeys.id, keyId));

  const key = await db.query.ventureApiKeys.findFirst({
    where: eq(schema.ventureApiKeys.id, keyId),
  });

  await auditLog({
    action: 'tenant.api_key.revoked',
    actorId: revokedBy,
    resourceType: 'VentureApiKey',
    resourceId: keyId,
    metadata: { ventureId: key?.ventureId, keyPrefix: key?.keyPrefix },
  });
}
```

---

## Subscription Tiers

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Max Users** | 5 | 25 | 100 | Unlimited |
| **Max API Keys** | 2 | 5 | 20 | Unlimited |
| **API Calls/Month** | 1,000 | 50,000 | 500,000 | Unlimited |
| **Storage** | 1 GB | 10 GB | 100 GB | Custom |
| **Max File Size** | 10 MB | 50 MB | 200 MB | 1 GB |
| **Webhooks** | ❌ | 3 | 10 | Unlimited |
| **Analytics** | ❌ | Basic | Advanced | Custom |
| **SSO (SAML/OIDC)** | ❌ | ❌ | ✅ | ✅ |
| **MFA Enforcement** | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ✅ | ✅ | ✅ |
| **Custom Domain** | ❌ | ❌ | ✅ | ✅ |
| **AI Assistant** | ❌ | ❌ | ✅ | ✅ |
| **Web3 Integration** | ❌ | ❌ | ❌ | ✅ |
| **Gamification** | ❌ | ❌ | ✅ | ✅ |
| **Custom CSS** | ❌ | ❌ | ❌ | ✅ |
| **SLA** | None | 99.5% | 99.9% | 99.99% |
| **Support** | Community | Email | Priority | Dedicated |

### Tier Defaults

```typescript
export function getDefaultFeatures(tier: string): VentureSettingsFeatures {
  const tiers: Record<string, VentureSettingsFeatures> = {
    free: {
      gamification: false, web3: false, analytics: false,
      aiAssistant: false, sso: false, mfaRequired: false,
      apiAccess: false, webhooks: false, customDomain: false,
    },
    starter: {
      gamification: false, web3: false, analytics: true,
      aiAssistant: false, sso: false, mfaRequired: false,
      apiAccess: true, webhooks: true, customDomain: false,
    },
    professional: {
      gamification: true, web3: false, analytics: true,
      aiAssistant: true, sso: true, mfaRequired: true,
      apiAccess: true, webhooks: true, customDomain: true,
    },
    enterprise: {
      gamification: true, web3: true, analytics: true,
      aiAssistant: true, sso: true, mfaRequired: true,
      apiAccess: true, webhooks: true, customDomain: true,
    },
  };
  return tiers[tier] ?? tiers.free;
}

export function getDefaultLimits(tier: string): VentureSettingsLimits {
  const tiers: Record<string, VentureSettingsLimits> = {
    free:         { maxUsers: 5,   maxApiKeys: 2,  maxApiCallsPerMonth: 1000,   maxStorageGb: 1,   maxFileSizeMb: 10,  maxWebhooks: 0  },
    starter:      { maxUsers: 25,  maxApiKeys: 5,  maxApiCallsPerMonth: 50000,  maxStorageGb: 10,  maxFileSizeMb: 50,  maxWebhooks: 3  },
    professional: { maxUsers: 100, maxApiKeys: 20, maxApiCallsPerMonth: 500000, maxStorageGb: 100, maxFileSizeMb: 200, maxWebhooks: 10 },
    enterprise:   { }, // No limits — all null/undefined = unlimited
  };
  return tiers[tier] ?? tiers.free;
}
```

### Feature Access Check

```typescript
export async function checkFeatureAccess(
  ventureId: string,
  feature: keyof VentureSettingsFeatures,
): Promise<boolean> {
  const venture = await db.query.ventures.findFirst({
    where: eq(schema.ventures.id, ventureId),
  });
  if (!venture || venture.status !== 'active') return false;

  // Check venture-level feature override first
  if (venture.features && feature in venture.features) {
    return venture.features[feature] === true;
  }

  // Fall back to settings table
  const settings = await db.query.ventureSettings.findFirst({
    where: eq(schema.ventureSettings.ventureId, ventureId),
  });
  if (settings?.features && feature in settings.features) {
    return settings.features[feature] === true;
  }

  // Fall back to tier defaults
  const defaults = getDefaultFeatures(venture.tier ?? 'free');
  return defaults[feature] === true;
}

export async function checkLimit(
  ventureId: string,
  limit: keyof VentureSettingsLimits,
  currentUsage: number,
): Promise<{ allowed: boolean; limit: number | null; usage: number }> {
  const settings = await db.query.ventureSettings.findFirst({
    where: eq(schema.ventureSettings.ventureId, ventureId),
  });

  const venture = await db.query.ventures.findFirst({
    where: eq(schema.ventures.id, ventureId),
  });

  const defaults = getDefaultLimits(venture?.tier ?? 'free');
  const effectiveLimit = settings?.limits?.[limit] ?? defaults[limit] ?? null;

  return {
    allowed: effectiveLimit === null || currentUsage < effectiveLimit,
    limit: effectiveLimit,
    usage: currentUsage,
  };
}
```

---

## Venture Hierarchy (Sub-Ventures)

The `parentId` field on ventures enables a tree structure:

```
MCV Consortium (root)
├── BetEdge
│   ├── BetEdge US
│   └── BetEdge EU
├── NexusHub
│   ├── NexusHub Enterprise
│   └── NexusHub Starter
├── SerpSpace
└── ... (6 more portfolio ventures)
```

```typescript
export async function getVentureHierarchy(
  ventureId: string,
): Promise<Venture & { children: Venture[] }> {
  const venture = await db.query.ventures.findFirst({
    where: eq(schema.ventures.id, ventureId),
    with: {
      children: {
        where: ne(schema.ventures.status, 'archived'),
        orderBy: asc(schema.ventures.name),
      },
    },
  });

  if (!venture) throw new NotFoundError('VENTURE_NOT_FOUND');
  return venture;
}

export async function getChildVentures(parentId: string): Promise<Venture[]> {
  return await db.query.ventures.findMany({
    where: and(
      eq(schema.ventures.parentId, parentId),
      ne(schema.ventures.status, 'archived'),
    ),
    orderBy: asc(schema.ventures.name),
  });
}
```

---

## Organization Management

Organizations are B2B customer entities within a venture (e.g., "Acme Corp is a client of BetEdge").

```typescript
export async function createOrganization(input: {
  ventureId: string;
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  annualRevenue?: number;
  address?: OrganizationAddress;
}): Promise<Organization> {
  const [org] = await db.insert(schema.organizations)
    .values(input)
    .returning();

  await auditLog({
    action: 'tenant.organization.created',
    resourceType: 'Organization',
    resourceId: org.id,
    metadata: { ventureId: input.ventureId, name: input.name },
  });

  return org;
}

export async function listOrganizations(
  ventureId: string,
  options?: { industry?: string; limit?: number; offset?: number },
): Promise<{ data: Organization[]; total: number }> {
  const conditions = [eq(schema.organizations.ventureId, ventureId)];
  if (options?.industry) {
    conditions.push(eq(schema.organizations.industry, options.industry));
  }

  const [data, [{ total }]] = await Promise.all([
    db.query.organizations.findMany({
      where: and(...conditions),
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
      orderBy: asc(schema.organizations.name),
    }),
    db.select({ total: count() })
      .from(schema.organizations)
      .where(and(...conditions)),
  ]);

  return { data, total };
}
```

---

## Cross-Venture Operations (Super Admin)

Super admins can operate across venture boundaries:

```typescript
export async function listAllVentures(options?: {
  status?: string;
  tier?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: Venture[]; total: number }> {
  const conditions = [];
  if (options?.status) conditions.push(eq(schema.ventures.status, options.status));
  if (options?.tier) conditions.push(eq(schema.ventures.tier, options.tier));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db.query.ventures.findMany({
      where,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
      orderBy: desc(schema.ventures.createdAt),
    }),
    db.select({ total: count() }).from(schema.ventures).where(where),
  ]);

  return { data, total };
}

// Switch venture context (for admin panels)
export async function switchVenture(
  sessionId: string,
  ventureId: string,
  userId: string,
): Promise<void> {
  // Verify user has membership in target venture (or is super admin)
  const membership = await db.query.ventureMemberships.findFirst({
    where: and(
      eq(schema.ventureMemberships.userId, userId),
      eq(schema.ventureMemberships.ventureId, ventureId),
      isNull(schema.ventureMemberships.leftAt),
    ),
  });

  if (!membership) {
    throw new ForbiddenError('NOT_A_MEMBER', 'You are not a member of this venture');
  }

  // Update session's active venture
  await db.update(schema.sessions)
    .set({ activeVentureId: ventureId })
    .where(eq(schema.sessions.id, sessionId));

  await auditLog({
    action: 'tenant.venture.switched',
    actorId: userId,
    metadata: { ventureId, sessionId },
  });
}
```

---

## Webhook Configuration

```typescript
export async function configureWebhook(
  ventureId: string,
  config: {
    url: string;
    events: string[];
  },
  actorId: string,
): Promise<{ webhookSecret: string }> {
  // Validate URL (must be HTTPS in production)
  if (process.env.NODE_ENV === 'production' && !config.url.startsWith('https://')) {
    throw new ValidationError('HTTPS_REQUIRED', 'Webhook URL must use HTTPS');
  }

  // Generate signing secret
  const webhookSecret = `whsec_${randomBytes(32).toString('hex')}`;

  await db.update(schema.ventureSettings)
    .set({
      webhookUrl: config.url,
      webhookSecret,
      webhookEvents: config.events,
      updatedAt: new Date(),
    })
    .where(eq(schema.ventureSettings.ventureId, ventureId));

  await auditLog({
    action: 'tenant.webhook.configured',
    actorId,
    resourceType: 'VentureSettings',
    metadata: { ventureId, url: config.url, events: config.events },
  });

  return { webhookSecret }; // Returned once, like API keys
}

export async function deliverWebhook(
  ventureId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const settings = await db.query.ventureSettings.findFirst({
    where: eq(schema.ventureSettings.ventureId, ventureId),
  });

  if (!settings?.webhookUrl || !settings.webhookEvents?.includes(event)) {
    return; // No webhook configured for this event
  }

  const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
  const signature = createHmac('sha256', settings.webhookSecret!)
    .update(body)
    .digest('hex');

  await fetch(settings.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MCV-Signature': `sha256=${signature}`,
      'X-MCV-Event': event,
    },
    body,
    signal: AbortSignal.timeout(10000), // 10s timeout
  });
}
```

---

## Performance Considerations

### Index Strategy

| Query Pattern | Index | Notes |
|---------------|-------|-------|
| Venture by slug | `ventures_slug_idx` | Hot path — every request resolution |
| Venture by status | `ventures_status_idx` | Admin filtering |
| Sub-ventures | `ventures_parent_id_idx` | Hierarchy traversal |
| User's ventures | `venture_memberships_user_id_idx` | Venture switcher UI |
| Unique membership | `venture_membership_idx` | Prevents duplicate memberships |
| API key validation | `idx_venture_api_keys_hash` | **Critical hot path** — every API request |
| Orgs by venture | `organizations_venture_idx` | RLS-scoped queries |
| Orgs by domain | `organizations_domain_idx` | Auto-join by email domain |

### Caching Recommendations

```typescript
// Venture resolution (slug → id) — cache aggressively
// TTL: 5 minutes. Invalidate on venture update.
const ventureCache = new Map<string, { id: string; expiresAt: number }>();

// API key validation — cache hash → result
// TTL: 60 seconds. Invalidate on revocation.
// Use Redis for distributed caching across instances.

// Feature flags — cache per venture
// TTL: 30 seconds. Invalidate on settings change.

// Membership checks — cache per user+venture
// TTL: 60 seconds. Invalidate on membership change.
```

### Query Optimization

- **Venture resolution** runs on EVERY request. Keep `ventures_slug_idx` warm. Consider materialized view for slug+id+status.
- **API key validation** is the second-hottest path. Index on `key_hash` is critical. Never do sequential scan.
- **Usage count updates** are fire-and-forget (`UPDATE ... SET usage_count = usage_count + 1`). Don't block the validation response.
- **Membership queries** with `leftAt IS NULL` filter benefit from partial index: `CREATE INDEX idx_active_memberships ON venture_memberships(user_id, venture_id) WHERE left_at IS NULL;`

---

## Environment Variables

```bash
# ─── Venture Configuration ───────────────────────────────────────────────────
MCV_DEFAULT_TIER=free                          # Default tier for new ventures
MCV_MAX_VENTURES_PER_USER=10                   # Max ventures a user can create
MCV_VENTURE_SLUG_RESERVED=api,auth,admin,www   # Reserved slugs (comma-separated)

# ─── Custom Domains ─────────────────────────────────────────────────────────
MCV_DOMAIN_SUFFIX=.mcv.one                     # Default domain suffix
MCV_DOMAIN_VERIFICATION_TTL=72h                # Time to complete DNS verification

# ─── API Keys ───────────────────────────────────────────────────────────────
MCV_API_KEY_PREFIX=mcv_sk_                     # API key prefix
MCV_API_KEY_MAX_PER_VENTURE=20                 # Default max API keys (overridable)

# ─── Webhooks ───────────────────────────────────────────────────────────────
MCV_WEBHOOK_TIMEOUT_MS=10000                   # Webhook delivery timeout
MCV_WEBHOOK_RETRY_COUNT=3                      # Retry failed deliveries
MCV_WEBHOOK_RETRY_DELAY_MS=5000                # Delay between retries

# ─── Database ───────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://...                  # Primary database connection
REDIS_URL=redis://...                          # Cache (venture resolution, API keys)
```

---

## Audit Events

| Event | Severity | Data Captured |
|-------|----------|---------------|
| `tenant.venture.created` | info | ventureId, name, slug, tier, createdBy |
| `tenant.venture.updated` | info | ventureId, changes[], updatedBy |
| `tenant.venture.configured` | info | ventureId, changedFields[] |
| `tenant.venture.suspended` | warning | ventureId, reason, suspendedBy |
| `tenant.venture.reactivated` | info | ventureId, reactivatedBy |
| `tenant.venture.archived` | warning | ventureId, archivedBy |
| `tenant.venture.switched` | info | ventureId, userId, sessionId |
| `tenant.member.added` | info | ventureId, userId, role |
| `tenant.member.removed` | info | ventureId, userId, role, removedBy |
| `tenant.member.role_changed` | info | ventureId, userId, oldRole, newRole |
| `tenant.member.invited` | info | ventureId, email, role, invitedBy |
| `tenant.member.invite_accepted` | info | ventureId, userId |
| `tenant.api_key.created` | info | ventureId, keyPrefix, scopes, createdBy |
| `tenant.api_key.revoked` | warning | ventureId, keyPrefix, revokedBy |
| `tenant.api_key.expired` | info | ventureId, keyPrefix |
| `tenant.webhook.configured` | info | ventureId, url, events |
| `tenant.webhook.delivery_failed` | warning | ventureId, url, event, statusCode |
| `tenant.organization.created` | info | ventureId, orgId, name |
| `tenant.organization.updated` | info | ventureId, orgId, changes[] |
| `tenant.organization.deleted` | warning | ventureId, orgId |
| `tenant.limit.approached` | warning | ventureId, limitType, usage, limit (at 80%) |
| `tenant.limit.exceeded` | error | ventureId, limitType, usage, limit |

---

## Error Codes

| Code | HTTP Status | Description | User Message |
|------|-------------|-------------|--------------|
| `TENANT_NOT_FOUND` | 404 | Venture does not exist | Venture not found |
| `TENANT_SUSPENDED` | 403 | Venture is suspended | This venture is currently suspended |
| `TENANT_ARCHIVED` | 410 | Venture is archived | This venture has been archived |
| `SLUG_TAKEN` | 409 | Slug already in use | This identifier is already taken |
| `INVALID_SLUG` | 400 | Invalid slug format | Must be 3-63 chars, lowercase alphanumeric |
| `NOT_A_MEMBER` | 403 | User not in venture | You don't have access to this venture |
| `LAST_ADMIN` | 409 | Can't remove last admin | Venture must have at least one admin |
| `MAX_USERS_REACHED` | 402 | User limit exceeded | Upgrade to add more users |
| `MAX_API_KEYS` | 402 | API key limit exceeded | Upgrade to create more API keys |
| `ACTIVE_CHILDREN` | 409 | Has active sub-ventures | Archive sub-ventures first |
| `VENTURE_REQUIRED` | 403 | No venture context | Please select a venture |
| `INVALID_API_KEY` | 401 | API key invalid/revoked | Invalid API key |
| `API_KEY_EXPIRED` | 401 | API key past expiration | API key has expired |
| `HTTPS_REQUIRED` | 400 | Webhook must use HTTPS | Webhook URL must use HTTPS |
| `FEATURE_NOT_AVAILABLE` | 402 | Feature not in tier | Upgrade to access this feature |

---

## Security Considerations

### Data Isolation

1. **Row-Level Security (RLS)**: All venture-scoped tables enforce `WHERE venture_id = current_setting('app.current_venture_id')`. No application code can bypass this at the database level.
2. **API Key Scoping**: API keys are bound to a single venture. Cross-venture key usage is impossible.
3. **Membership Enforcement**: Every venture operation checks membership before proceeding.
4. **Session Binding**: Sessions carry `activeVentureId`; switching requires membership verification.

### API Key Security

1. **Hash-Only Storage**: Full API keys are NEVER stored. Only SHA-256 hash + display prefix retained.
2. **One-Time Display**: Raw key returned only at creation. Cannot be recovered — must create a new one.
3. **IP Whitelisting**: Production keys should use `allowedIps` to restrict to known infrastructure IPs.
4. **Scope Minimization**: Keys should use the narrowest scopes possible (`read:users` not `admin:*`).
5. **Expiration**: All production keys should set `expiresAt`. Rotate keys on a regular schedule.

### Webhook Security

1. **HMAC Verification**: All webhook payloads are signed with `X-MCV-Signature` using HMAC-SHA256.
2. **HTTPS Only**: Production webhooks require HTTPS endpoints.
3. **Secret Rotation**: Webhook secrets can be regenerated via `configureWebhook`.
4. **Timeout Protection**: 10-second timeout prevents slow-loris attacks on delivery.

### Slug Security

1. **Reserved Slugs**: `api`, `auth`, `admin`, `www`, `static`, `cdn` are reserved to prevent subdomain confusion.
2. **Immutability**: Slugs cannot be changed after creation (prevents URL hijacking).
3. **Format Validation**: Strict regex prevents XSS via subdomain injection.

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @mcv/kernel | workspace | Core database, utilities, config |
| drizzle-orm | ^0.35.x | ORM for PostgreSQL |
| drizzle-orm/pg-core | ^0.35.x | PostgreSQL column types and table builder |
| crypto (Node.js built-in) | — | API key hashing (SHA-256), webhook signing (HMAC) |

---

## Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createVenture, addMember, createApiKey, validateApiKey } from '@mcv/identity/tenants';

describe('Venture Lifecycle', () => {
  it('creates a venture with default settings', async () => {
    const venture = await createVenture({
      name: 'Test Venture',
      slug: 'test-venture',
      tier: 'starter',
      createdBy: testUserId,
    });

    expect(venture.status).toBe('pending');
    expect(venture.tier).toBe('starter');
    expect(venture.slug).toBe('test-venture');
  });

  it('rejects duplicate slugs', async () => {
    await createVenture({ name: 'V1', slug: 'taken', createdBy: testUserId });
    await expect(
      createVenture({ name: 'V2', slug: 'taken', createdBy: testUserId })
    ).rejects.toThrow('SLUG_TAKEN');
  });

  it('enforces user limits per tier', async () => {
    const venture = await createVenture({
      name: 'Free Venture', slug: 'free-v', tier: 'free', createdBy: testUserId,
    });

    // Free tier = 5 users. Creator is #1, add 4 more.
    for (let i = 0; i < 4; i++) {
      await addMember(venture.id, testUserIds[i], 'member', testUserId);
    }

    // 6th user should fail
    await expect(
      addMember(venture.id, testUserIds[5], 'member', testUserId)
    ).rejects.toThrow('MAX_USERS_REACHED');
  });
});

describe('API Key Validation', () => {
  it('validates a valid key and returns venture context', async () => {
    const { rawKey } = await createApiKey({
      ventureId: testVentureId,
      name: 'Test Key',
      scopes: ['read:users'],
      createdBy: testUserId,
    });

    const result = await validateApiKey(rawKey);
    expect(result).not.toBeNull();
    expect(result!.ventureId).toBe(testVentureId);
    expect(result!.scopes).toContain('read:users');
  });

  it('rejects revoked keys', async () => {
    const { apiKey, rawKey } = await createApiKey({
      ventureId: testVentureId,
      name: 'Revokable',
      scopes: ['read:users'],
      createdBy: testUserId,
    });

    await revokeApiKey(apiKey.id, testUserId);

    const result = await validateApiKey(rawKey);
    expect(result).toBeNull();
  });
});
```

---

*@mcv/identity/tenants — Multi-Tenancy Module*
