# @mcv/identity — API Reference
## Tier 1: Security Boundary

**Package:** `@mcv/identity`  
**Classification:** INTERNAL  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Database Schemas (Drizzle ORM)

### Core Tables

#### users

```typescript
// @mcv/identity/db/schema/users.ts
import { pgTable, uuid, text, timestamp, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Email (globally unique)
  email: text('email').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  
  // Phone (optional)
  phone: text('phone'),
  phoneVerified: boolean('phone_verified').notNull().default(false),
  phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
  
  // Authentication
  passwordHash: text('password_hash'),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  mfaSecret: text('mfa_secret'),                    // Encrypted TOTP secret
  backupCodes: jsonb('backup_codes').$type<string[]>(),  // Encrypted backup codes
  
  // Profile
  profile: jsonb('profile').$type<UserProfile>().notNull().default({}),
  
  // Status
  status: text('status').$type<UserStatus>().notNull().default('pending_verification'),
  statusReason: text('status_reason'),
  
  // Activity tracking
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  lastLoginIp: text('last_login_ip'),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  emailUniqueIdx: uniqueIndex('users_email_unique_idx').on(table.email),
  phoneIdx: index('users_phone_idx').on(table.phone),
  statusIdx: index('users_status_idx').on(table.status),
  lastActivityIdx: index('users_last_activity_idx').on(table.lastActivityAt),
}));

// TypeScript types
export interface UserProfile {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  locale?: string;
}

export type UserStatus = 
  | 'active'
  | 'inactive' 
  | 'suspended'
  | 'pending_verification'
  | 'pending_invitation';

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  memberships: many(ventureMemberships),
  authFactors: many(authFactors),
  passkeys: many(passkeyCredentials),
  linkedAccounts: many(linkedAccounts),
}));
```

#### ventures

```typescript
// @mcv/identity/db/schema/ventures.ts
import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const ventures = pgTable('ventures', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Identification
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  domain: text('domain'),
  
  // Status
  status: text('status').$type<VentureStatus>().notNull().default('pending'),
  plan: text('plan').$type<VenturePlan>().notNull().default('free'),
  
  // Branding
  branding: jsonb('branding').$type<VentureBranding>().notNull().default({}),
  
  // Settings
  settings: jsonb('settings').$type<VentureSettings>().notNull().default({}),
  
  // Limits
  limits: jsonb('limits').$type<VentureLimits>().notNull().default({
    maxUsers: 10,
    maxWorkspaces: 3,
    maxStorageBytes: 1073741824,  // 1GB
    maxApiCallsPerMonth: 10000,
  }),
  
  // Ownership
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  
  // Trial
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  slugUniqueIdx: uniqueIndex('ventures_slug_unique_idx').on(table.slug),
  domainUniqueIdx: uniqueIndex('ventures_domain_unique_idx').on(table.domain),
  ownerIdx: index('ventures_owner_idx').on(table.ownerId),
  statusIdx: index('ventures_status_idx').on(table.status),
}));

export type VentureStatus = 'active' | 'suspended' | 'trial' | 'pending';
export type VenturePlan = 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';

export interface VentureBranding {
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;
}

export interface VentureSettings {
  authMethods?: AuthMethod[];
  mfaRequired?: boolean;
  sessionTimeout?: number;
  passwordPolicy?: PasswordPolicy;
  allowedDomains?: string[];
  ssoEnabled?: boolean;
  customDomain?: string;
}

export interface VentureLimits {
  maxUsers: number;
  maxWorkspaces: number;
  maxStorageBytes: number;
  maxApiCallsPerMonth: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number;              // Days before password expires
  preventReuse: number;        // Number of previous passwords to check
}
```

#### workspaces

```typescript
// @mcv/identity/db/schema/workspaces.ts
import { pgTable, uuid, text, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Identification
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  
  // Hierarchy
  parentId: uuid('parent_id').references(() => workspaces.id),
  path: text('path').notNull(),                    // Materialized path: /parent/child/grandchild
  depth: integer('depth').notNull().default(0),
  
  // Settings
  settings: jsonb('settings').$type<WorkspaceSettings>().notNull().default({}),
  visibility: text('visibility').$type<WorkspaceVisibility>().notNull().default('private'),
  
  // Metadata
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  ventureSlugUniqueIdx: uniqueIndex('workspaces_venture_slug_unique_idx').on(table.ventureId, table.slug),
  pathIdx: index('workspaces_path_idx').on(table.path),
  parentIdx: index('workspaces_parent_idx').on(table.parentId),
}));

export type WorkspaceVisibility = 'public' | 'private' | 'restricted';

export interface WorkspaceSettings {
  defaultRole?: string;
  allowMemberInvites?: boolean;
  inheritPermissions?: boolean;
}
```

#### venture_memberships

```typescript
// @mcv/identity/db/schema/venture-memberships.ts
import { pgTable, uuid, text, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const ventureMemberships = pgTable('venture_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Roles and permissions
  roles: text('roles').array().notNull().default([]),
  customPermissions: text('custom_permissions').array().notNull().default([]),
  
  // Profile overrides (venture-specific)
  profileOverrides: jsonb('profile_overrides').$type<Partial<UserProfile>>(),
  
  // Invitation tracking
  invitedBy: uuid('invited_by').references(() => users.id),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  
  // Status
  status: text('status').$type<MembershipStatus>().notNull().default('pending'),
  statusReason: text('status_reason'),
  
  // Activity
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userVentureUniqueIdx: uniqueIndex('memberships_user_venture_unique_idx').on(table.userId, table.ventureId),
  ventureIdx: index('memberships_venture_idx').on(table.ventureId),
  userIdx: index('memberships_user_idx').on(table.userId),
  statusIdx: index('memberships_status_idx').on(table.status),
}));

export type MembershipStatus = 'active' | 'pending' | 'suspended' | 'expired';
```

#### user_sessions

```typescript
// @mcv/identity/db/schema/user-sessions.ts
import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  
  // Device identification
  deviceId: text('device_id').notNull(),
  deviceFingerprint: text('device_fingerprint'),
  
  // Tokens (hashed, not stored in plain text)
  accessTokenHash: text('access_token_hash').notNull(),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  tokenGeneration: integer('token_generation').notNull().default(1),
  
  // Client info
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  geoLocation: jsonb('geo_location').$type<GeoLocation>(),
  
  // Security
  riskScore: integer('risk_score').notNull().default(0),
  mfaVerified: boolean('mfa_verified').notNull().default(false),
  authFactors: text('auth_factors').array().notNull().default([]),
  
  // Lifecycle
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokedReason: text('revoked_reason'),
}, (table) => ({
  userIdx: index('sessions_user_idx').on(table.userId),
  ventureIdx: index('sessions_venture_idx').on(table.ventureId),
  expiresIdx: index('sessions_expires_idx').on(table.expiresAt),
  deviceIdx: index('sessions_device_idx').on(table.deviceId),
}));

export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}
```

### Authentication Tables

#### auth_factors

```typescript
// @mcv/identity/db/schema/auth-factors.ts
import { pgTable, uuid, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';

export const authFactors = pgTable('auth_factors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Factor type
  type: text('type').$type<AuthFactorType>().notNull(),
  
  // Factor-specific data (encrypted)
  secretEncrypted: text('secret_encrypted'),
  metadata: jsonb('metadata').$type<AuthFactorMetadata>(),
  
  // Status
  verified: boolean('verified').notNull().default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  
  // Usage tracking
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  useCount: integer('use_count').notNull().default(0),
  
  // Metadata
  nickname: text('nickname'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('auth_factors_user_idx').on(table.userId),
  typeIdx: index('auth_factors_type_idx').on(table.type),
}));

export type AuthFactorType = 
  | 'totp'
  | 'sms'
  | 'email'
  | 'webauthn'
  | 'push';

export interface AuthFactorMetadata {
  phone?: string;              // For SMS
  email?: string;              // For email OTP
  credentialId?: string;       // For WebAuthn
  deviceInfo?: string;         // For push
}
```

#### passkey_credentials

```typescript
// @mcv/identity/db/schema/passkey-credentials.ts
import { pgTable, uuid, text, timestamp, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const passkeyCredentials = pgTable('passkey_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Credential identifiers
  credentialId: text('credential_id').notNull(),     // Base64URL encoded
  publicKey: text('public_key').notNull(),           // COSE key, base64 encoded
  
  // Counter for replay attack prevention
  counter: integer('counter').notNull().default(0),
  
  // Credential details
  deviceType: text('device_type').$type<PasskeyDeviceType>().notNull(),
  transports: text('transports').array(),            // ['usb', 'nfc', 'ble', 'internal']
  
  // Backup state
  backedUp: boolean('backed_up').notNull().default(false),
  
  // User-friendly metadata
  nickname: text('nickname'),
  
  // Usage
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  useCount: integer('use_count').notNull().default(0),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  credentialIdUniqueIdx: uniqueIndex('passkeys_credential_id_unique_idx').on(table.credentialId),
  userIdx: index('passkeys_user_idx').on(table.userId),
}));

export type PasskeyDeviceType = 
  | 'platform'          // Built into device (Touch ID, Face ID, Windows Hello)
  | 'cross-platform';   // External security key
```

#### linked_accounts

```typescript
// @mcv/identity/db/schema/linked-accounts.ts
import { pgTable, uuid, text, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const linkedAccounts = pgTable('linked_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Provider info
  provider: text('provider').$type<IdentityProvider>().notNull(),
  providerId: text('provider_id').notNull(),
  
  // Provider profile (synced on each login)
  providerProfile: jsonb('provider_profile').$type<ProviderProfile>(),
  
  // Tokens (encrypted)
  accessTokenEncrypted: text('access_token_encrypted'),
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  
  // Scopes granted
  scopes: text('scopes').array().notNull().default([]),
  
  // Status
  status: text('status').$type<LinkStatus>().notNull().default('active'),
  
  // Usage
  linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  providerIdUniqueIdx: uniqueIndex('linked_accounts_provider_id_unique_idx').on(table.provider, table.providerId),
  userIdx: index('linked_accounts_user_idx').on(table.userId),
}));

export type IdentityProvider = 
  | 'google'
  | 'github'
  | 'discord'
  | 'apple'
  | 'twitter'
  | 'linkedin'
  | 'microsoft';

export type LinkStatus = 'active' | 'revoked' | 'expired';

export interface ProviderProfile {
  email?: string;
  name?: string;
  avatarUrl?: string;
  raw: Record<string, unknown>;
}
```

### Permissions Tables

#### roles

```typescript
// @mcv/identity/db/schema/roles.ts
import { pgTable, uuid, text, timestamp, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Role info
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  
  // Type
  isSystem: boolean('is_system').notNull().default(false),
  isDefault: boolean('is_default').notNull().default(false),
  
  // Hierarchy
  parentRoleId: uuid('parent_role_id').references(() => roles.id),
  
  // Permissions directly assigned to this role
  permissions: text('permissions').array().notNull().default([]),
  
  // Metadata
  metadata: jsonb('metadata').$type<RoleMetadata>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureNameUniqueIdx: uniqueIndex('roles_venture_name_unique_idx').on(table.ventureId, table.name),
  parentIdx: index('roles_parent_idx').on(table.parentRoleId),
}));

export interface RoleMetadata {
  color?: string;
  icon?: string;
  order?: number;
}
```

#### permissions

```typescript
// @mcv/identity/db/schema/permissions.ts
import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Permission identifier
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  scope: text('scope').$type<PermissionScope>(),
  
  // Description
  displayName: text('display_name').notNull(),
  description: text('description'),
  
  // Grouping
  category: text('category').notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  resourceActionScopeUniqueIdx: uniqueIndex('permissions_unique_idx').on(
    table.resource, 
    table.action, 
    table.scope
  ),
}));

export type PermissionScope = 'own' | 'team' | 'workspace' | 'venture' | 'global';
```

#### policies

```typescript
// @mcv/identity/db/schema/policies.ts
import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';

export const policies = pgTable('policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Policy info
  name: text('name').notNull(),
  description: text('description'),
  
  // Conditions (ABAC)
  conditions: jsonb('conditions').$type<PolicyCondition[]>().notNull().default([]),
  
  // Effect
  effect: text('effect').$type<'allow' | 'deny'>().notNull(),
  
  // Permissions this policy affects
  permissions: text('permissions').array().notNull(),
  
  // Priority (higher = evaluated first, deny takes precedence)
  priority: integer('priority').notNull().default(100),
  
  // Status
  enabled: boolean('enabled').notNull().default(true),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('policies_venture_idx').on(table.ventureId),
  enabledIdx: index('policies_enabled_idx').on(table.enabled),
}));

export interface PolicyCondition {
  attribute: string;
  operator: PolicyOperator;
  value: unknown;
}

export type PolicyOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'starts_with'
  | 'ends_with'
  | 'matches_regex';
```

### Audit Tables

#### auth_audit_log

```typescript
// @mcv/identity/db/schema/auth-audit-log.ts
import { pgTable, uuid, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';

export const authAuditLog = pgTable('auth_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Context
  userId: uuid('user_id').references(() => users.id),
  ventureId: uuid('venture_id').references(() => ventures.id),
  sessionId: uuid('session_id'),
  
  // Event
  eventType: text('event_type').$type<AuthEventType>().notNull(),
  
  // Request info
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  
  // Result
  success: boolean('success').notNull(),
  failureReason: text('failure_reason'),
  
  // Additional data
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Timestamp (used for partitioning)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('audit_user_idx').on(table.userId),
  ventureIdx: index('audit_venture_idx').on(table.ventureId),
  eventTypeIdx: index('audit_event_type_idx').on(table.eventType),
  createdAtIdx: index('audit_created_at_idx').on(table.createdAt),
}));

export type AuthEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'token_refresh'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'mfa_enroll'
  | 'mfa_unenroll'
  | 'mfa_verify'
  | 'mfa_verify_failure'
  | 'passkey_register'
  | 'passkey_authenticate'
  | 'account_link'
  | 'account_unlink'
  | 'session_revoke'
  | 'session_revoke_all'
  | 'permission_check'
  | 'permission_denied'
  | 'role_assigned'
  | 'role_removed'
  | 'impersonation_start'
  | 'impersonation_end';
```

### SSO Tables

#### sso_configurations

```typescript
// @mcv/identity/db/schema/sso-configurations.ts
import { pgTable, uuid, text, timestamp, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const ssoConfigurations = pgTable('sso_configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Type
  type: text('type').$type<'saml' | 'oidc'>().notNull(),
  
  // SAML configuration (if type = 'saml')
  samlConfig: jsonb('saml_config').$type<SAMLConfig>(),
  
  // OIDC configuration (if type = 'oidc')
  oidcConfig: jsonb('oidc_config').$type<OIDCConfig>(),
  
  // Attribute mapping
  attributeMapping: jsonb('attribute_mapping').$type<AttributeMapping>().notNull(),
  
  // Provisioning
  autoProvision: boolean('auto_provision').notNull().default(true),
  defaultRoles: text('default_roles').array().notNull().default([]),
  
  // Domains
  domains: text('domains').array().notNull().default([]),
  
  // Status
  enabled: boolean('enabled').notNull().default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('sso_venture_idx').on(table.ventureId),
  domainsIdx: index('sso_domains_idx').on(table.domains),
}));

export interface SAMLConfig {
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
  signatureAlgorithm: string;
  nameIdFormat: string;
  wantAssertionsSigned: boolean;
}

export interface OIDCConfig {
  issuer: string;
  clientId: string;
  clientSecretEncrypted: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  jwksUrl?: string;
  scopes: string[];
}

export interface AttributeMapping {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string;
  department?: string;
  custom?: Record<string, string>;
}
```

---

## tRPC Router Definitions

### Auth Router

```typescript
// @mcv/identity/trpc/routers/auth.ts
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const authRouter = router({
  // ============================================
  // LOGIN METHODS
  // ============================================
  
  /**
   * Login with email and password
   */
  loginWithPassword: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      deviceId: z.string().optional(),
      remember: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      // Returns session or MFA challenge
      return authService.loginWithPassword(input, ctx);
    }),

  /**
   * Start passwordless login with magic link
   */
  startMagicLinkLogin: publicProcedure
    .input(z.object({
      email: z.string().email(),
      ventureId: z.string().uuid().optional(),
      redirectUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input }) => {
      return authService.sendMagicLink(input);
    }),

  /**
   * Complete magic link login
   */
  completeMagicLinkLogin: publicProcedure
    .input(z.object({
      token: z.string(),
      deviceId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return authService.verifyMagicLink(input, ctx);
    }),

  /**
   * Start OAuth flow
   */
  startOAuthLogin: publicProcedure
    .input(z.object({
      provider: z.enum(['google', 'github', 'discord', 'apple', 'twitter', 'linkedin', 'microsoft']),
      ventureId: z.string().uuid().optional(),
      redirectUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input }) => {
      return authService.initiateOAuth(input);
    }),

  /**
   * Complete OAuth flow
   */
  completeOAuthLogin: publicProcedure
    .input(z.object({
      provider: z.enum(['google', 'github', 'discord', 'apple', 'twitter', 'linkedin', 'microsoft']),
      code: z.string(),
      state: z.string(),
      deviceId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return authService.completeOAuth(input, ctx);
    }),

  // ============================================
  // PASSKEY / WEBAUTHN
  // ============================================

  /**
   * Start passkey registration
   */
  startPasskeyRegistration: protectedProcedure
    .mutation(async ({ ctx }) => {
      return passkeyService.generateRegistrationOptions(ctx.user);
    }),

  /**
   * Complete passkey registration
   */
  completePasskeyRegistration: protectedProcedure
    .input(z.object({
      credential: z.any(), // PublicKeyCredential
      nickname: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return passkeyService.verifyRegistration(ctx.user, input);
    }),

  /**
   * Start passkey authentication
   */
  startPasskeyAuthentication: publicProcedure
    .input(z.object({
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      return passkeyService.generateAuthenticationOptions(input.email);
    }),

  /**
   * Complete passkey authentication
   */
  completePasskeyAuthentication: publicProcedure
    .input(z.object({
      credential: z.any(), // PublicKeyCredential
      deviceId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return passkeyService.verifyAuthentication(input, ctx);
    }),

  /**
   * Delete a passkey
   */
  deletePasskey: protectedProcedure
    .input(z.object({
      passkeyId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      return passkeyService.deletePasskey(ctx.user.id, input.passkeyId);
    }),

  /**
   * List user's passkeys
   */
  listPasskeys: protectedProcedure
    .query(async ({ ctx }) => {
      return passkeyService.listUserPasskeys(ctx.user.id);
    }),

  // ============================================
  // MFA
  // ============================================

  /**
   * Start TOTP enrollment
   */
  startTotpEnrollment: protectedProcedure
    .mutation(async ({ ctx }) => {
      return mfaService.startTotpEnrollment(ctx.user);
    }),

  /**
   * Complete TOTP enrollment
   */
  completeTotpEnrollment: protectedProcedure
    .input(z.object({
      code: z.string().length(6),
    }))
    .mutation(async ({ input, ctx }) => {
      return mfaService.completeTotpEnrollment(ctx.user, input.code);
    }),

  /**
   * Verify MFA code (during login)
   */
  verifyMfa: publicProcedure
    .input(z.object({
      challengeId: z.string().uuid(),
      method: z.enum(['totp', 'sms', 'email', 'backup_code']),
      code: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return mfaService.verifyChallenge(input, ctx);
    }),

  /**
   * Request SMS or email MFA code
   */
  requestMfaCode: publicProcedure
    .input(z.object({
      challengeId: z.string().uuid(),
      method: z.enum(['sms', 'email']),
    }))
    .mutation(async ({ input }) => {
      return mfaService.sendCode(input);
    }),

  /**
   * Disable MFA
   */
  disableMfa: protectedProcedure
    .input(z.object({
      method: z.enum(['totp', 'sms', 'email']),
      verificationCode: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return mfaService.disableFactor(ctx.user, input);
    }),

  /**
   * Generate new backup codes
   */
  regenerateBackupCodes: protectedProcedure
    .input(z.object({
      verificationCode: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return mfaService.regenerateBackupCodes(ctx.user, input.verificationCode);
    }),

  // ============================================
  // SESSIONS
  // ============================================

  /**
   * Get current session
   */
  getCurrentSession: protectedProcedure
    .query(async ({ ctx }) => {
      return sessionService.getCurrentSession(ctx);
    }),

  /**
   * List all user sessions
   */
  listSessions: protectedProcedure
    .query(async ({ ctx }) => {
      return sessionService.listUserSessions(ctx.user.id);
    }),

  /**
   * Revoke a session
   */
  revokeSession: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      return sessionService.revokeSession(ctx.user.id, input.sessionId);
    }),

  /**
   * Revoke all sessions except current
   */
  revokeAllOtherSessions: protectedProcedure
    .mutation(async ({ ctx }) => {
      return sessionService.revokeAllOtherSessions(ctx.user.id, ctx.session.id);
    }),

  /**
   * Refresh access token
   */
  refreshToken: publicProcedure
    .input(z.object({
      refreshToken: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return tokenService.refreshAccessToken(input.refreshToken, ctx);
    }),

  /**
   * Logout (revoke current session)
   */
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      return sessionService.logout(ctx.session.id);
    }),

  // ============================================
  // PASSWORD
  // ============================================

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email(),
      ventureId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input }) => {
      return passwordService.requestReset(input);
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      return passwordService.resetWithToken(input);
    }),

  /**
   * Change password (authenticated)
   */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input, ctx }) => {
      return passwordService.change(ctx.user, input);
    }),

  // ============================================
  // EMAIL VERIFICATION
  // ============================================

  /**
   * Send email verification
   */
  sendEmailVerification: protectedProcedure
    .mutation(async ({ ctx }) => {
      return emailService.sendVerification(ctx.user);
    }),

  /**
   * Verify email with token
   */
  verifyEmail: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      return emailService.verify(input.token);
    }),
});

// Types
export type AuthRouter = typeof authRouter;
```

### Users Router

```typescript
// @mcv/identity/trpc/routers/users.ts
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';

export const usersRouter = router({
  // ============================================
  // PROFILE MANAGEMENT
  // ============================================

  /**
   * Get current user
   */
  me: protectedProcedure
    .query(async ({ ctx }) => {
      return userService.getUser(ctx.user.id);
    }),

  /**
   * Update profile
   */
  updateProfile: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1).max(100).optional(),
      lastName: z.string().min(1).max(100).optional(),
      displayName: z.string().min(1).max(100).optional(),
      avatarUrl: z.string().url().optional().nullable(),
      bio: z.string().max(500).optional(),
      timezone: z.string().optional(),
      locale: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return userService.updateProfile(ctx.user.id, input);
    }),

  /**
   * Upload avatar
   */
  uploadAvatar: protectedProcedure
    .input(z.object({
      file: z.object({
        data: z.string(),  // Base64 encoded
        mimeType: z.string(),
        filename: z.string(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      return userService.uploadAvatar(ctx.user.id, input.file);
    }),

  /**
   * Delete avatar
   */
  deleteAvatar: protectedProcedure
    .mutation(async ({ ctx }) => {
      return userService.deleteAvatar(ctx.user.id);
    }),

  // ============================================
  // PREFERENCES
  // ============================================

  /**
   * Get user preferences
   */
  getPreferences: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      return userService.getPreferences(ctx.user.id, input?.ventureId);
    }),

  /**
   * Update preferences
   */
  updatePreferences: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid().optional(),
      notifications: z.object({
        email: z.object({
          enabled: z.boolean(),
          categories: z.record(z.boolean()).optional(),
        }).optional(),
        sms: z.object({
          enabled: z.boolean(),
          categories: z.record(z.boolean()).optional(),
        }).optional(),
        push: z.object({
          enabled: z.boolean(),
          categories: z.record(z.boolean()).optional(),
        }).optional(),
        inApp: z.object({
          enabled: z.boolean(),
          categories: z.record(z.boolean()).optional(),
        }).optional(),
      }).optional(),
      ui: z.object({
        theme: z.enum(['light', 'dark', 'system']).optional(),
        density: z.enum(['comfortable', 'compact']).optional(),
        sidebarCollapsed: z.boolean().optional(),
      }).optional(),
      privacy: z.object({
        profileVisibility: z.enum(['public', 'contacts', 'private']).optional(),
        searchable: z.boolean().optional(),
      }).optional(),
      communication: z.object({
        marketingEmails: z.boolean().optional(),
        productUpdates: z.boolean().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return userService.updatePreferences(ctx.user.id, input);
    }),

  // ============================================
  // LINKED ACCOUNTS
  // ============================================

  /**
   * List linked accounts
   */
  listLinkedAccounts: protectedProcedure
    .query(async ({ ctx }) => {
      return userService.listLinkedAccounts(ctx.user.id);
    }),

  /**
   * Unlink an account
   */
  unlinkAccount: protectedProcedure
    .input(z.object({
      linkedAccountId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      return userService.unlinkAccount(ctx.user.id, input.linkedAccountId);
    }),

  // ============================================
  // ACCOUNT MANAGEMENT
  // ============================================

  /**
   * Request account deletion
   */
  requestAccountDeletion: protectedProcedure
    .input(z.object({
      reason: z.string().optional(),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return userService.requestDeletion(ctx.user.id, input);
    }),

  /**
   * Cancel account deletion request
   */
  cancelAccountDeletion: protectedProcedure
    .mutation(async ({ ctx }) => {
      return userService.cancelDeletion(ctx.user.id);
    }),

  /**
   * Export user data (GDPR)
   */
  exportData: protectedProcedure
    .mutation(async ({ ctx }) => {
      return userService.exportData(ctx.user.id);
    }),

  // ============================================
  // ADMIN OPERATIONS
  // ============================================

  /**
   * List users (admin)
   */
  list: adminProcedure
    .input(z.object({
      ventureId: z.string().uuid().optional(),
      status: z.enum(['active', 'inactive', 'suspended', 'pending_verification']).optional(),
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      sortBy: z.enum(['createdAt', 'lastLoginAt', 'email', 'name']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }))
    .query(async ({ input, ctx }) => {
      return userService.listUsers(input, ctx);
    }),

  /**
   * Get user by ID (admin)
   */
  getById: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      return userService.getUser(input.userId);
    }),

  /**
   * Update user status (admin)
   */
  updateStatus: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      status: z.enum(['active', 'inactive', 'suspended']),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return userService.updateStatus(input.userId, input.status, input.reason, ctx);
    }),

  /**
   * Start impersonation (admin)
   */
  startImpersonation: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      reason: z.string().min(10),
    }))
    .mutation(async ({ input, ctx }) => {
      return impersonationService.start(ctx.user, input.userId, input.reason);
    }),

  /**
   * End impersonation
   */
  endImpersonation: protectedProcedure
    .mutation(async ({ ctx }) => {
      return impersonationService.end(ctx);
    }),
});

export type UsersRouter = typeof usersRouter;
```

### Permissions Router

```typescript
// @mcv/identity/trpc/routers/permissions.ts
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';

export const permissionsRouter = router({
  // ============================================
  // PERMISSION CHECKS
  // ============================================

  /**
   * Check if current user has permission
   */
  check: protectedProcedure
    .input(z.object({
      permission: z.string(),
      resourceId: z.string().optional(),
      resourceType: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      return permissionService.checkPermission(ctx.user, input);
    }),

  /**
   * Check multiple permissions
   */
  checkMany: protectedProcedure
    .input(z.object({
      permissions: z.array(z.string()),
      mode: z.enum(['all', 'any']).default('all'),
    }))
    .query(async ({ input, ctx }) => {
      return permissionService.checkManyPermissions(ctx.user, input);
    }),

  /**
   * Get current user's effective permissions
   */
  myPermissions: protectedProcedure
    .query(async ({ ctx }) => {
      return permissionService.getEffectivePermissions(ctx.user, ctx.venture.id);
    }),

  // ============================================
  // ROLES
  // ============================================

  /**
   * List roles
   */
  listRoles: adminProcedure
    .input(z.object({
      includeSystem: z.boolean().default(false),
    }).optional())
    .query(async ({ input, ctx }) => {
      return roleService.listRoles(ctx.venture.id, input?.includeSystem);
    }),

  /**
   * Get role by ID
   */
  getRole: adminProcedure
    .input(z.object({
      roleId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      return roleService.getRole(input.roleId);
    }),

  /**
   * Create role
   */
  createRole: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(50),
      displayName: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      permissions: z.array(z.string()),
      parentRoleId: z.string().uuid().optional(),
      metadata: z.object({
        color: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return roleService.createRole(ctx.venture.id, input);
    }),

  /**
   * Update role
   */
  updateRole: adminProcedure
    .input(z.object({
      roleId: z.string().uuid(),
      displayName: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      permissions: z.array(z.string()).optional(),
      metadata: z.object({
        color: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return roleService.updateRole(input.roleId, input);
    }),

  /**
   * Delete role
   */
  deleteRole: adminProcedure
    .input(z.object({
      roleId: z.string().uuid(),
      reassignTo: z.string().uuid().optional(), // Reassign users to this role
    }))
    .mutation(async ({ input, ctx }) => {
      return roleService.deleteRole(input.roleId, input.reassignTo);
    }),

  // ============================================
  // USER ROLE ASSIGNMENT
  // ============================================

  /**
   * Assign roles to user
   */
  assignRoles: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      roles: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      return roleService.assignRoles(input.userId, ctx.venture.id, input.roles);
    }),

  /**
   * Remove roles from user
   */
  removeRoles: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      roles: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      return roleService.removeRoles(input.userId, ctx.venture.id, input.roles);
    }),

  /**
   * Get user's roles
   */
  getUserRoles: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      return roleService.getUserRoles(input.userId, ctx.venture.id);
    }),

  // ============================================
  // POLICIES (ABAC)
  // ============================================

  /**
   * List policies
   */
  listPolicies: adminProcedure
    .query(async ({ ctx }) => {
      return policyService.listPolicies(ctx.venture.id);
    }),

  /**
   * Get policy by ID
   */
  getPolicy: adminProcedure
    .input(z.object({
      policyId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      return policyService.getPolicy(input.policyId);
    }),

  /**
   * Create policy
   */
  createPolicy: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      conditions: z.array(z.object({
        attribute: z.string(),
        operator: z.enum([
          'equals', 'not_equals', 'contains', 'not_contains',
          'in', 'not_in', 'greater_than', 'greater_than_or_equal',
          'less_than', 'less_than_or_equal', 'starts_with', 'ends_with',
          'matches_regex'
        ]),
        value: z.unknown(),
      })),
      effect: z.enum(['allow', 'deny']),
      permissions: z.array(z.string()),
      priority: z.number().min(1).max(1000).default(100),
      enabled: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      return policyService.createPolicy(ctx.venture.id, input);
    }),

  /**
   * Update policy
   */
  updatePolicy: adminProcedure
    .input(z.object({
      policyId: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      conditions: z.array(z.object({
        attribute: z.string(),
        operator: z.string(),
        value: z.unknown(),
      })).optional(),
      permissions: z.array(z.string()).optional(),
      priority: z.number().min(1).max(1000).optional(),
      enabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      return policyService.updatePolicy(input.policyId, input);
    }),

  /**
   * Delete policy
   */
  deletePolicy: adminProcedure
    .input(z.object({
      policyId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      return policyService.deletePolicy(input.policyId);
    }),

  // ============================================
  // PERMISSION DEFINITIONS
  // ============================================

  /**
   * List all available permissions
   */
  listPermissionDefinitions: adminProcedure
    .query(async () => {
      return permissionService.listAllPermissions();
    }),
});

export type PermissionsRouter = typeof permissionsRouter;
```

### Tenants Router

```typescript
// @mcv/identity/trpc/routers/tenants.ts
import { router, protectedProcedure, adminProcedure, superAdminProcedure } from '../trpc';
import { z } from 'zod';

export const tenantsRouter = router({
  // ============================================
  // VENTURES
  // ============================================

  /**
   * Get current venture
   */
  currentVenture: protectedProcedure
    .query(async ({ ctx }) => {
      return ventureService.getVenture(ctx.venture.id);
    }),

  /**
   * List user's ventures
   */
  myVentures: protectedProcedure
    .query(async ({ ctx }) => {
      return ventureService.getUserVentures(ctx.user.id);
    }),

  /**
   * Create venture
   */
  createVenture: protectedProcedure
    .input(z.object({
      slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
      name: z.string().min(1).max(100),
      domain: z.string().optional(),
      plan: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
    }))
    .mutation(async ({ input, ctx }) => {
      return ventureService.createVenture(ctx.user.id, input);
    }),

  /**
   * Update venture
   */
  updateVenture: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(100).optional(),
      domain: z.string().optional(),
      branding: z.object({
        logo: z.string().url().optional(),
        favicon: z.string().url().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
      }).optional(),
      settings: z.object({
        authMethods: z.array(z.string()).optional(),
        mfaRequired: z.boolean().optional(),
        sessionTimeout: z.number().optional(),
        allowedDomains: z.array(z.string()).optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ventureService.updateVenture(ctx.venture.id, input);
    }),

  /**
   * Delete venture (owner only)
   */
  deleteVenture: adminProcedure
    .input(z.object({
      confirmation: z.string(), // Must match venture slug
    }))
    .mutation(async ({ input, ctx }) => {
      return ventureService.deleteVenture(ctx.venture.id, input.confirmation, ctx);
    }),

  /**
   * Transfer ownership
   */
  transferOwnership: adminProcedure
    .input(z.object({
      newOwnerId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ventureService.transferOwnership(ctx.venture.id, input.newOwnerId, ctx);
    }),

  // ============================================
  // WORKSPACES
  // ============================================

  /**
   * List workspaces
   */
  listWorkspaces: protectedProcedure
    .input(z.object({
      parentId: z.string().uuid().optional(),
      includeNested: z.boolean().default(false),
    }).optional())
    .query(async ({ input, ctx }) => {
      return workspaceService.listWorkspaces(ctx.venture.id, input);
    }),

  /**
   * Get workspace by ID
   */
  getWorkspace: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      return workspaceService.getWorkspace(input.workspaceId);
    }),

  /**
   * Create workspace
   */
  createWorkspace: adminProcedure
    .input(z.object({
      slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      parentId: z.string().uuid().optional(),
      visibility: z.enum(['public', 'private', 'restricted']).default('private'),
      settings: z.object({
        defaultRole: z.string().optional(),
        allowMemberInvites: z.boolean().optional(),
        inheritPermissions: z.boolean().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return workspaceService.createWorkspace(ctx.venture.id, ctx.user.id, input);
    }),

  /**
   * Update workspace
   */
  updateWorkspace: adminProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      visibility: z.enum(['public', 'private', 'restricted']).optional(),
      settings: z.object({
        defaultRole: z.string().optional(),
        allowMemberInvites: z.boolean().optional(),
        inheritPermissions: z.boolean().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      return workspaceService.updateWorkspace(input.workspaceId, input);
    }),

  /**
   * Delete workspace
   */
  deleteWorkspace: adminProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      moveChildrenTo: z.string().uuid().optional(),
    }))
    .mutation(async ({ input }) => {
      return workspaceService.deleteWorkspace(input.workspaceId, input.moveChildrenTo);
    }),

  /**
   * Move workspace
   */
  moveWorkspace: adminProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      newParentId: z.string().uuid().nullable(),
    }))
    .mutation(async ({ input }) => {
      return workspaceService.moveWorkspace(input.workspaceId, input.newParentId);
    }),

  // ============================================
  // MEMBERSHIPS
  // ============================================

  /**
   * List venture members
   */
  listMembers: protectedProcedure
    .input(z.object({
      status: z.enum(['active', 'pending', 'suspended']).optional(),
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      return membershipService.listMembers(ctx.venture.id, input);
    }),

  /**
   * Get membership
   */
  getMembership: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      return membershipService.getMembership(input.userId, ctx.venture.id);
    }),

  /**
   * Update membership
   */
  updateMembership: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      roles: z.array(z.string()).optional(),
      status: z.enum(['active', 'suspended']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return membershipService.updateMembership(input.userId, ctx.venture.id, input);
    }),

  /**
   * Remove member
   */
  removeMember: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      return membershipService.removeMember(input.userId, ctx.venture.id);
    }),

  // ============================================
  // INVITATIONS
  // ============================================

  /**
   * List pending invitations
   */
  listInvitations: adminProcedure
    .input(z.object({
      status: z.enum(['pending', 'expired']).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      return invitationService.listInvitations(ctx.venture.id, input);
    }),

  /**
   * Create invitation
   */
  createInvitation: adminProcedure
    .input(z.object({
      email: z.string().email(),
      roles: z.array(z.string()),
      workspaceIds: z.array(z.string().uuid()).optional(),
      message: z.string().max(500).optional(),
      expiresInDays: z.number().min(1).max(30).default(7),
    }))
    .mutation(async ({ input, ctx }) => {
      return invitationService.createInvitation(ctx.venture.id, ctx.user.id, input);
    }),

  /**
   * Resend invitation
   */
  resendInvitation: adminProcedure
    .input(z.object({
      invitationId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      return invitationService.resendInvitation(input.invitationId);
    }),

  /**
   * Revoke invitation
   */
  revokeInvitation: adminProcedure
    .input(z.object({
      invitationId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      return invitationService.revokeInvitation(input.invitationId);
    }),

  /**
   * Accept invitation (public, token-based)
   */
  acceptInvitation: publicProcedure
    .input(z.object({
      token: z.string(),
      password: z.string().min(8).optional(), // Required if new user
      profile: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return invitationService.acceptInvitation(input, ctx);
    }),

  /**
   * Decline invitation (public, token-based)
   */
  declineInvitation: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      return invitationService.declineInvitation(input.token);
    }),
});

export type TenantsRouter = typeof tenantsRouter;
```

### SSO Router

```typescript
// @mcv/identity/trpc/routers/sso.ts
import { router, publicProcedure, adminProcedure, superAdminProcedure } from '../trpc';
import { z } from 'zod';

export const ssoRouter = router({
  // ============================================
  // SSO CONFIGURATION (Admin)
  // ============================================

  /**
   * Get SSO configuration
   */
  getConfiguration: adminProcedure
    .query(async ({ ctx }) => {
      return ssoService.getConfiguration(ctx.venture.id);
    }),

  /**
   * Configure SAML SSO
   */
  configureSaml: adminProcedure
    .input(z.object({
      entityId: z.string(),
      ssoUrl: z.string().url(),
      sloUrl: z.string().url().optional(),
      certificate: z.string(),
      signatureAlgorithm: z.enum(['RSA-SHA256', 'RSA-SHA384', 'RSA-SHA512']).default('RSA-SHA256'),
      nameIdFormat: z.string().default('urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'),
      wantAssertionsSigned: z.boolean().default(true),
      attributeMapping: z.object({
        email: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        displayName: z.string().optional(),
        groups: z.string().optional(),
        department: z.string().optional(),
      }),
      domains: z.array(z.string()),
      autoProvision: z.boolean().default(true),
      defaultRoles: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      return ssoService.configureSaml(ctx.venture.id, input);
    }),

  /**
   * Configure OIDC SSO
   */
  configureOidc: adminProcedure
    .input(z.object({
      issuer: z.string().url(),
      clientId: z.string(),
      clientSecret: z.string(),
      authorizationUrl: z.string().url().optional(),
      tokenUrl: z.string().url().optional(),
      userInfoUrl: z.string().url().optional(),
      jwksUrl: z.string().url().optional(),
      scopes: z.array(z.string()).default(['openid', 'profile', 'email']),
      attributeMapping: z.object({
        email: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        displayName: z.string().optional(),
        groups: z.string().optional(),
      }),
      domains: z.array(z.string()),
      autoProvision: z.boolean().default(true),
      defaultRoles: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      return ssoService.configureOidc(ctx.venture.id, input);
    }),

  /**
   * Test SSO configuration
   */
  testConfiguration: adminProcedure
    .mutation(async ({ ctx }) => {
      return ssoService.testConfiguration(ctx.venture.id);
    }),

  /**
   * Enable/disable SSO
   */
  setEnabled: adminProcedure
    .input(z.object({
      enabled: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ssoService.setEnabled(ctx.venture.id, input.enabled);
    }),

  /**
   * Delete SSO configuration
   */
  deleteConfiguration: adminProcedure
    .mutation(async ({ ctx }) => {
      return ssoService.deleteConfiguration(ctx.venture.id);
    }),

  /**
   * Get SP metadata (for SAML)
   */
  getSpMetadata: adminProcedure
    .query(async ({ ctx }) => {
      return ssoService.getSpMetadata(ctx.venture.id);
    }),

  // ============================================
  // SSO LOGIN FLOWS
  // ============================================

  /**
   * Initiate SSO login
   */
  initiateLogin: publicProcedure
    .input(z.object({
      email: z.string().email().optional(),
      domain: z.string().optional(),
      ventureSlug: z.string().optional(),
      redirectUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input }) => {
      return ssoService.initiateLogin(input);
    }),

  /**
   * Complete SAML assertion
   */
  completeSamlAssertion: publicProcedure
    .input(z.object({
      SAMLResponse: z.string(),
      RelayState: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ssoService.completeSamlAssertion(input, ctx);
    }),

  /**
   * Complete OIDC callback
   */
  completeOidcCallback: publicProcedure
    .input(z.object({
      code: z.string(),
      state: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ssoService.completeOidcCallback(input, ctx);
    }),

  // ============================================
  // CROSS-VENTURE SSO
  // ============================================

  /**
   * Get SSO session status for cross-venture
   */
  getSessionStatus: protectedProcedure
    .query(async ({ ctx }) => {
      return ssoService.getSessionStatus(ctx.user.id);
    }),

  /**
   * Switch venture (within SSO session)
   */
  switchVenture: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ssoService.switchVenture(ctx.user.id, input.ventureId, ctx);
    }),
});

export type SsoRouter = typeof ssoRouter;
```

---

## TypeScript Interfaces

### Core Types

```typescript
// @mcv/identity/types/index.ts

// Re-export from @mcv/kernel
export type { UUID, VentureID, UserID, ISOTimestamp } from '@mcv/kernel';

// User types
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  profile: UserProfile;
  status: UserStatus;
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  locale?: string;
}

export type UserStatus = 
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending_verification'
  | 'pending_invitation';

// Session types
export interface Session {
  id: string;
  userId: string;
  ventureId: string;
  deviceId: string;
  ipAddress: string;
  userAgent?: string;
  riskScore: number;
  mfaVerified: boolean;
  authFactors: string[];
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
}

export interface AuthResult {
  success: boolean;
  session?: Session;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  mfaRequired?: boolean;
  mfaChallenge?: MfaChallenge;
  error?: AuthError;
}

export interface MfaChallenge {
  challengeId: string;
  availableMethods: MfaMethod[];
  expiresAt: Date;
}

export type MfaMethod = 'totp' | 'sms' | 'email' | 'webauthn' | 'backup_code';

// Permission types
export interface Permission {
  resource: string;
  action: string;
  scope?: PermissionScope;
}

export type PermissionScope = 'own' | 'team' | 'workspace' | 'venture' | 'global';

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isDefault: boolean;
  parentRoleId?: string;
  metadata?: RoleMetadata;
}

export interface RoleMetadata {
  color?: string;
  icon?: string;
  order?: number;
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  conditions: PolicyCondition[];
  effect: 'allow' | 'deny';
  permissions: string[];
  priority: number;
  enabled: boolean;
}

export interface PolicyCondition {
  attribute: string;
  operator: PolicyOperator;
  value: unknown;
}

export type PolicyOperator = 
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'in' | 'not_in'
  | 'greater_than' | 'greater_than_or_equal'
  | 'less_than' | 'less_than_or_equal'
  | 'starts_with' | 'ends_with'
  | 'matches_regex';

// Tenant types
export interface Venture {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  status: VentureStatus;
  plan: VenturePlan;
  branding: VentureBranding;
  settings: VentureSettings;
  limits: VentureLimits;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type VentureStatus = 'active' | 'suspended' | 'trial' | 'pending';
export type VenturePlan = 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';

export interface VentureBranding {
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface VentureSettings {
  authMethods?: string[];
  mfaRequired?: boolean;
  sessionTimeout?: number;
  allowedDomains?: string[];
  ssoEnabled?: boolean;
}

export interface VentureLimits {
  maxUsers: number;
  maxWorkspaces: number;
  maxStorageBytes: number;
  maxApiCallsPerMonth: number;
}

export interface Workspace {
  id: string;
  ventureId: string;
  slug: string;
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  depth: number;
  visibility: WorkspaceVisibility;
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkspaceVisibility = 'public' | 'private' | 'restricted';

export interface WorkspaceSettings {
  defaultRole?: string;
  allowMemberInvites?: boolean;
  inheritPermissions?: boolean;
}

// Membership types
export interface VentureMembership {
  id: string;
  userId: string;
  ventureId: string;
  roles: string[];
  customPermissions: string[];
  profileOverrides?: Partial<UserProfile>;
  status: MembershipStatus;
  invitedBy?: string;
  invitedAt?: Date;
  acceptedAt?: Date;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type MembershipStatus = 'active' | 'pending' | 'suspended' | 'expired';

// Invitation types
export interface Invitation {
  id: string;
  ventureId: string;
  workspaceIds?: string[];
  email: string;
  roles: string[];
  message?: string;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: Date;
  sentAt: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';

// SSO types
export interface SsoConfiguration {
  id: string;
  ventureId: string;
  type: 'saml' | 'oidc';
  domains: string[];
  autoProvision: boolean;
  defaultRoles: string[];
  enabled: boolean;
  verifiedAt?: Date;
  samlConfig?: SamlConfig;
  oidcConfig?: OidcConfig;
  attributeMapping: AttributeMapping;
}

export interface SamlConfig {
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
  signatureAlgorithm: string;
  nameIdFormat: string;
  wantAssertionsSigned: boolean;
}

export interface OidcConfig {
  issuer: string;
  clientId: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  jwksUrl?: string;
  scopes: string[];
}

export interface AttributeMapping {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string;
  department?: string;
  custom?: Record<string, string>;
}

// Error types
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_SUSPENDED'
  | 'MFA_REQUIRED'
  | 'MFA_INVALID'
  | 'SESSION_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'EMAIL_NOT_VERIFIED'
  | 'INVITATION_INVALID'
  | 'INVITATION_EXPIRED'
  | 'SSO_ERROR'
  | 'PERMISSION_DENIED';
```

---

## Package Exports

```typescript
// @mcv/identity/index.ts

// Database schemas
export * from './db/schema';

// tRPC routers
export { authRouter } from './trpc/routers/auth';
export { usersRouter } from './trpc/routers/users';
export { permissionsRouter } from './trpc/routers/permissions';
export { tenantsRouter } from './trpc/routers/tenants';
export { ssoRouter } from './trpc/routers/sso';
export { identityRouter } from './trpc/router';

// Services
export { AuthService } from './services/auth';
export { UserService } from './services/users';
export { PermissionService } from './services/permissions';
export { RoleService } from './services/roles';
export { PolicyService } from './services/policies';
export { SessionService } from './services/sessions';
export { TokenService } from './services/tokens';
export { PasskeyService } from './services/passkeys';
export { MfaService } from './services/mfa';
export { VentureService } from './services/ventures';
export { WorkspaceService } from './services/workspaces';
export { MembershipService } from './services/memberships';
export { InvitationService } from './services/invitations';
export { SsoService } from './services/sso';
export { ImpersonationService } from './services/impersonation';

// Types
export * from './types';

// Middleware
export { authMiddleware } from './middleware/auth';
export { permissionMiddleware } from './middleware/permissions';
export { tenantMiddleware } from './middleware/tenant';

// Utilities
export { hashPassword, verifyPassword } from './utils/password';
export { generateToken, verifyToken } from './utils/tokens';
export { createPermissionChecker } from './utils/permissions';

// Guards (for use in applications)
export { requireAuth } from './guards/require-auth';
export { requirePermission } from './guards/require-permission';
export { requireRole } from './guards/require-role';
export { requireVenture } from './guards/require-venture';
```

---

## Related Documentation

- [Package Specification](./01-PACKAGE-SPEC.md)
- [Technical Architecture](./02-TECHNICAL-ARCHITECTURE.md)
- [Implementation Plan](./04-IMPLEMENTATION-PLAN.md)

---

*@mcv/identity — API Reference*
