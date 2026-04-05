# @mcv/identity/sso — Single Sign-On Module

**Parent Package:** @mcv/identity  
**Tier:** 1 (Security Boundary)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `sso` module provides cross-venture single sign-on, enterprise federation (SAML 2.0 / OIDC), identity resolution, and account linking for the MCV ecosystem. It enables a single user identity to seamlessly traverse multiple ventures (BetEdge, NexusHub, SerpSpace, etc.) while supporting enterprise customers who bring their own identity providers (Okta, Azure AD, Google Workspace, PingFederate).

**Every cross-venture navigation and enterprise login flows through this module. Identity integrity is non-negotiable.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-VENTURE SSO
// ═══════════════════════════════════════════════════════════════════════════════

// SSO initiation and completion
export { initiateSso, completeSso, getSsoSession } from './cross-venture';
export { getAuthorizedVentures, switchVenture } from './cross-venture';
export { validateSsoToken, revokeSsoToken } from './cross-venture/tokens';

// ═══════════════════════════════════════════════════════════════════════════════
// SAML 2.0 FEDERATION
// ═══════════════════════════════════════════════════════════════════════════════

// SAML Service Provider operations
export { configureSaml, updateSamlConfig, deleteSamlConfig } from './saml/config';
export { initiateSamlLogin, handleSamlResponse, handleSamlLogout } from './saml/flow';
export { getSamlMetadata, parseSamlMetadata } from './saml/metadata';
export { validateSamlAssertion, decryptSamlAssertion } from './saml/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// OIDC PROVIDER (MCV as IdP)
// ═══════════════════════════════════════════════════════════════════════════════

export { authorizeOidc, tokenOidc, userinfoOidc } from './oidc-provider';
export { registerOidcClient, updateOidcClient, revokeOidcClient } from './oidc-provider/clients';
export { introspectToken, revokeToken } from './oidc-provider/tokens';
export { getOidcDiscovery, getJwks } from './oidc-provider/discovery';

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY RESOLUTION & ACCOUNT LINKING
// ═══════════════════════════════════════════════════════════════════════════════

export { linkIdentity, unlinkIdentity, getLinkedIdentities } from './identity';
export { resolveIdentity, mergeAccounts, splitAccount } from './identity';
export { detectDuplicateIdentity, suggestAccountLink } from './identity/detection';

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION SYNCHRONIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export { syncSessions, propagateLogout, propagateSessionUpdate } from './session-sync';
export { getGlobalSessionState, getVentureSessionMap } from './session-sync';

// ═══════════════════════════════════════════════════════════════════════════════
// JIT PROVISIONING
// ═══════════════════════════════════════════════════════════════════════════════

export { provisionJitUser, configureJitProvisioning } from './provisioning/jit';
export { mapIdpAttributes, configureAttributeMapping } from './provisioning/attributes';
export { mapIdpGroups, configureGroupMapping } from './provisioning/groups';

// ═══════════════════════════════════════════════════════════════════════════════
// SCIM PROVISIONING
// ═══════════════════════════════════════════════════════════════════════════════

export { handleScimRequest, configureScim } from './provisioning/scim';
export { scimUsersEndpoint, scimGroupsEndpoint } from './provisioning/scim/endpoints';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  SsoConfig,
  SsoToken,
  SsoSession,
  SamlConfig,
  SamlAssertion,
  SamlAttributeMap,
  OidcConfig,
  OidcClient,
  OidcTokenSet,
  LinkedIdentity,
  IdentityResolution,
  JitProvisioningConfig,
  ScimConfig,
  VentureSession,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            SSO MODULE ARCHITECTURE                                   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                         FEDERATION LAYER                                         │ │
│  │                                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │  Cross-      │  │   SAML 2.0   │  │  OIDC        │  │    SCIM      │         │ │
│  │  │  Venture SSO │  │   SP + IdP   │  │  Provider    │  │  Provisioner │         │ │
│  │  │              │  │              │  │              │  │              │         │ │
│  │  │ • Initiate   │  │ • SP Config  │  │ • Authorize  │  │ • Users      │         │ │
│  │  │ • Complete   │  │ • Assertion  │  │ • Token      │  │ • Groups     │         │ │
│  │  │ • Switch     │  │ • SLO        │  │ • UserInfo   │  │ • Sync       │         │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │ │
│  │         │                 │                 │                 │                  │ │
│  │         └─────────────────┴─────────────────┴─────────────────┘                  │ │
│  │                                    │                                              │ │
│  └────────────────────────────────────┼──────────────────────────────────────────────┘ │
│                                       │                                                │
│  ┌────────────────────────────────────┼──────────────────────────────────────────────┐ │
│  │                         IDENTITY LAYER                                             │ │
│  │                                    │                                               │ │
│  │         ┌──────────────────────────┼──────────────────────────┐                    │ │
│  │         │                          │                          │                    │ │
│  │  ┌──────▼───────┐  ┌──────────────▼──────────┐  ┌───────────▼────────┐            │ │
│  │  │  Identity    │  │    JIT Provisioning     │  │  Session Sync     │            │ │
│  │  │  Resolution  │  │                         │  │                   │            │ │
│  │  │              │  │  • Auto-create user     │  │  • Cross-venture  │            │ │
│  │  │  • Link      │  │  • Map attributes       │  │  • Propagate      │            │ │
│  │  │  • Merge     │  │  • Map groups → roles   │  │    logout         │            │ │
│  │  │  • Detect    │  │  • Welcome email        │  │  • Sync state     │            │ │
│  │  └──────────────┘  └─────────────────────────┘  └───────────────────┘            │ │
│  │                                                                                    │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                                │
│  ┌────────────────────────────────────┼──────────────────────────────────────────────┐ │
│  │                         STORAGE LAYER                                              │ │
│  │                                    │                                               │ │
│  │    ┌─────────────┐  ┌─────────────▼─────────────┐  ┌─────────────────┐            │ │
│  │    │   Redis     │  │       PostgreSQL           │  │    Secrets      │            │ │
│  │    │   Cache     │  │                            │  │    Vault        │            │ │
│  │    │             │  │  • sessions                │  │                 │            │ │
│  │    │ • SSO       │  │  • accounts                │  │ • SAML certs    │            │ │
│  │    │   tokens    │  │  • oauth_states            │  │ • OIDC secrets  │            │ │
│  │    │ • Session   │  │  • venture_memberships     │  │ • Signing keys  │            │ │
│  │    │   state     │  │  • users                   │  │                 │            │ │
│  │    │             │  │  • jwks                    │  │                 │            │ │
│  │    └─────────────┘  └───────────────────────────┘  └─────────────────┘            │ │
│  │                                                                                    │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Cross-Venture SSO

### Concept

MCV operates multiple ventures (BetEdge, NexusHub, SerpSpace, etc.) under a single identity platform. A user authenticated on one venture can seamlessly navigate to another without re-authenticating. The `session.activeVentureId` field tracks which venture the user is currently operating within.

### SSO Flow

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                         CROSS-VENTURE SSO FLOW                                    │
│                                                                                   │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐       │
│  │  User    │   │  Source  │   │ SSO API  │   │ Identity │   │  Target  │       │
│  │  Browser │   │  Venture │   │ Service  │   │ Resolver │   │  Venture │       │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘       │
│       │              │              │              │              │               │
│       │──Navigate──▶│              │              │              │               │
│       │              │──initiateSso─▶              │              │               │
│       │              │              │              │              │               │
│       │              │◀─ssoToken────│              │              │               │
│       │              │              │              │              │               │
│       │◀─Redirect───│              │              │              │               │
│       │  /sso?token=xyz            │              │              │               │
│       │              │              │              │              │               │
│       │──────────────────────────▶│              │              │               │
│       │              │              │──resolve──▶│              │               │
│       │              │              │              │              │               │
│       │              │              │◀─identity──│              │               │
│       │              │              │              │              │               │
│       │              │              │──checkMembership──────────▶│               │
│       │              │              │              │              │               │
│       │              │              │◀─session─────────────────│               │
│       │              │              │              │              │               │
│       │◀────────────────────────────────────────session─────────│               │
│       │              │              │              │              │               │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### SSO Token Structure

```typescript
interface SsoToken {
  id: string;                         // UUID, primary key
  token: string;                      // Cryptographically random (32 bytes, base64url)
  userId: string;                     // FK → users.id
  sourceVentureId: string;            // Venture user is coming from
  targetVentureId: string;            // Venture user is going to
  sessionId: string;                  // Source session ID for validation
  
  // Security constraints
  ipAddress: string;                  // Must match on redemption
  userAgent: string;                  // Must match on redemption
  
  // Lifecycle
  expiresAt: Date;                    // Short-lived: 5 minutes max
  redeemedAt: Date | null;            // Set on first use (one-time)
  
  createdAt: Date;
}
```

### Initiate SSO

```typescript
import { initiateSso, completeSso } from '@mcv/identity';
import { db, schema } from '@mcv/kernel';

// ═══════════════════════════════════════════════════════════════════════════════
// INITIATE CROSS-VENTURE SSO (source venture)
// ═══════════════════════════════════════════════════════════════════════════════

export async function initiateSso(options: {
  userId: string;
  sourceVentureId: string;
  targetVentureId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}): Promise<{ token: string; redirectUrl: string }> {
  const { userId, sourceVentureId, targetVentureId, sessionId, ipAddress, userAgent } = options;

  // 1. Validate source session is active
  const session = await db.query.sessions.findFirst({
    where: and(
      eq(schema.sessions.id, sessionId),
      eq(schema.sessions.userId, userId),
      gt(schema.sessions.expiresAt, new Date()),
    ),
  });

  if (!session) {
    throw new SsoError('SOURCE_SESSION_INVALID', 'Source session is not valid');
  }

  // 2. Verify user has membership in target venture
  const membership = await db.query.ventureMemberships.findFirst({
    where: and(
      eq(schema.ventureMemberships.userId, userId),
      eq(schema.ventureMemberships.ventureId, targetVentureId),
    ),
  });

  if (!membership) {
    throw new SsoError('NO_VENTURE_ACCESS', 'User does not have access to target venture');
  }

  // 3. Generate SSO token (short-lived, one-time use)
  const ssoToken = generateSecureToken(32);
  const tokenHash = await hashToken(ssoToken);

  await db.insert(schema.ssoTokens).values({
    id: crypto.randomUUID(),
    token: tokenHash,
    userId,
    sourceVentureId,
    targetVentureId,
    sessionId,
    ipAddress: maskIpAddress(ipAddress),
    userAgent,
    expiresAt: new Date(Date.now() + SSO_TOKEN_TTL), // 5 minutes
    createdAt: new Date(),
  });

  // 4. Audit log
  await auditLog({
    action: 'sso.cross_venture.initiated',
    actorId: userId,
    resourceType: 'SsoToken',
    metadata: {
      sourceVentureId,
      targetVentureId,
      ipAddress: maskIpAddress(ipAddress),
    },
  });

  // 5. Build redirect URL
  const targetVenture = await db.query.ventures.findFirst({
    where: eq(schema.ventures.id, targetVentureId),
  });

  const redirectUrl = `${targetVenture.domain}/auth/sso?token=${ssoToken}`;

  return { token: ssoToken, redirectUrl };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE CROSS-VENTURE SSO (target venture)
// ═══════════════════════════════════════════════════════════════════════════════

export async function completeSso(options: {
  token: string;
  ipAddress: string;
  userAgent: string;
}): Promise<{ session: Session; user: User; venture: Venture }> {
  const { token, ipAddress, userAgent } = options;

  const tokenHash = await hashToken(token);

  // 1. Find and validate SSO token
  const ssoToken = await db.query.ssoTokens.findFirst({
    where: and(
      eq(schema.ssoTokens.token, tokenHash),
      isNull(schema.ssoTokens.redeemedAt),
      gt(schema.ssoTokens.expiresAt, new Date()),
    ),
  });

  if (!ssoToken) {
    throw new SsoError('INVALID_SSO_TOKEN', 'SSO token is invalid or expired');
  }

  // 2. IP/UA binding check (configurable strictness)
  if (ssoConfig.validateIpBinding) {
    const maskedIp = maskIpAddress(ipAddress);
    if (maskedIp !== ssoToken.ipAddress) {
      await auditLog({
        action: 'sso.cross_venture.ip_mismatch',
        actorId: ssoToken.userId,
        severity: 'warning',
        metadata: { expected: ssoToken.ipAddress, actual: maskedIp },
      });
      throw new SsoError('IP_MISMATCH', 'IP address does not match original request');
    }
  }

  // 3. Mark token as redeemed (one-time use)
  await db
    .update(schema.ssoTokens)
    .set({ redeemedAt: new Date() })
    .where(eq(schema.ssoTokens.id, ssoToken.id));

  // 4. Create session on target venture
  const session = await createSession({
    userId: ssoToken.userId,
    ipAddress,
    userAgent,
    ventureId: ssoToken.targetVentureId,
    mfaVerified: true, // Inherited from source session
  });

  // 5. Load user and venture
  const [user, venture] = await Promise.all([
    db.query.users.findFirst({ where: eq(schema.users.id, ssoToken.userId) }),
    db.query.ventures.findFirst({ where: eq(schema.ventures.id, ssoToken.targetVentureId) }),
  ]);

  // 6. Audit log
  await auditLog({
    action: 'sso.cross_venture.completed',
    actorId: ssoToken.userId,
    resourceType: 'Session',
    resourceId: session.id,
    metadata: {
      sourceVentureId: ssoToken.sourceVentureId,
      targetVentureId: ssoToken.targetVentureId,
    },
  });

  return { session: session.session, user, venture };
}
```

### Venture Switching (In-Session)

```typescript
import { getAuthorizedVentures, switchVenture } from '@mcv/identity';

// ═══════════════════════════════════════════════════════════════════════════════
// GET AUTHORIZED VENTURES (ventures user can access)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAuthorizedVentures(userId: string): Promise<AuthorizedVenture[]> {
  const memberships = await db
    .select({
      ventureId: schema.ventureMemberships.ventureId,
      role: schema.ventureMemberships.role,
      joinedAt: schema.ventureMemberships.joinedAt,
      ventureName: schema.ventures.name,
      ventureDomain: schema.ventures.domain,
      ventureLogo: schema.ventures.logo,
    })
    .from(schema.ventureMemberships)
    .innerJoin(schema.ventures, eq(schema.ventureMemberships.ventureId, schema.ventures.id))
    .where(
      and(
        eq(schema.ventureMemberships.userId, userId),
        isNull(schema.ventureMemberships.leftAt), // Active memberships only
      ),
    );

  return memberships.map((m) => ({
    id: m.ventureId,
    name: m.ventureName,
    domain: m.ventureDomain,
    logo: m.ventureLogo,
    role: m.role,          // 'admin' | 'member' | 'billing'
    joinedAt: m.joinedAt,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SWITCH VENTURE (update active venture in current session)
// ═══════════════════════════════════════════════════════════════════════════════

export async function switchVenture(
  sessionId: string,
  targetVentureId: string,
): Promise<{ session: Session; membership: VentureMembership }> {
  // 1. Load current session
  const session = await db.query.sessions.findFirst({
    where: eq(schema.sessions.id, sessionId),
  });

  if (!session || session.expiresAt < new Date()) {
    throw new SsoError('SESSION_INVALID', 'Session is not valid');
  }

  // 2. Verify membership in target venture
  const membership = await db.query.ventureMemberships.findFirst({
    where: and(
      eq(schema.ventureMemberships.userId, session.userId),
      eq(schema.ventureMemberships.ventureId, targetVentureId),
      isNull(schema.ventureMemberships.leftAt),
    ),
  });

  if (!membership) {
    throw new SsoError('NO_VENTURE_ACCESS', 'User does not have access to this venture');
  }

  // 3. Update session's activeVentureId
  const [updated] = await db
    .update(schema.sessions)
    .set({
      activeVentureId: targetVentureId,
      updatedAt: new Date(),
    })
    .where(eq(schema.sessions.id, sessionId))
    .returning();

  // 4. Audit log
  await auditLog({
    action: 'sso.venture.switched',
    actorId: session.userId,
    resourceType: 'Session',
    resourceId: sessionId,
    metadata: {
      previousVentureId: session.activeVentureId,
      newVentureId: targetVentureId,
      role: membership.role,
    },
  });

  return { session: updated, membership };
}
```

---

## OAuth State Management

The `oauth_states` table tracks in-flight OAuth flows with PKCE support and venture-scoped state tokens.

### OAuth State Schema (from source)

```typescript
// Source: packages/db/src/schema/oauth-states.ts

export const oauthStates = pgTable('oauth_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  state: text('state').unique().notNull(),          // CSRF state token
  ventureId: uuid('venture_id').notNull()            // Which venture initiated the flow
    .references(() => ventures.id),
  provider: text('provider').notNull(),              // 'google', 'github', 'azure-ad', etc.
  redirectUri: text('redirect_uri').notNull(),       // Where to redirect after OAuth
  codeVerifier: text('code_verifier'),               // PKCE code verifier (S256)
  metadata: jsonb('metadata')                        // Arbitrary flow metadata
    .$type<Record<string, unknown>>()
    .default({}),
  expiresAt: timestamp('expires_at',                 // State tokens expire (10 min)
    { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at',
    { withTimezone: true }).defaultNow().notNull(),
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, auto-generated | Unique identifier |
| `state` | `text` | UNIQUE, NOT NULL | CSRF state parameter for OAuth flow |
| `venture_id` | `uuid` | FK → ventures.id, NOT NULL | Venture that initiated the OAuth flow |
| `provider` | `text` | NOT NULL | OAuth provider identifier |
| `redirect_uri` | `text` | NOT NULL | Post-auth redirect destination |
| `code_verifier` | `text` | nullable | PKCE code verifier for S256 challenge |
| `metadata` | `jsonb` | default `{}` | Additional flow context (login_hint, prompt, etc.) |
| `expires_at` | `timestamptz` | NOT NULL | Expiration (typically 10 minutes) |
| `created_at` | `timestamptz` | NOT NULL, default now | Creation timestamp |

### OAuth Flow with PKCE

```typescript
import { db, schema } from '@mcv/kernel';
import { generateCodeVerifier, generateCodeChallenge } from './utils/pkce';

// ═══════════════════════════════════════════════════════════════════════════════
// INITIATE OAUTH FLOW (with PKCE and venture scoping)
// ═══════════════════════════════════════════════════════════════════════════════

export async function initiateOAuthFlow(options: {
  ventureId: string;
  provider: string;
  redirectUri: string;
  scopes: string[];
  loginHint?: string;
}): Promise<{ authorizationUrl: string }> {
  const { ventureId, provider, redirectUri, scopes, loginHint } = options;

  // 1. Validate redirect URI against allowlist
  await validateRedirectUri(ventureId, provider, redirectUri);

  // 2. Generate PKCE pair
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // 3. Generate state token
  const state = generateSecureToken(32);

  // 4. Store state in database
  await db.insert(schema.oauthStates).values({
    state,
    ventureId,
    provider,
    redirectUri,
    codeVerifier,
    metadata: { scopes, loginHint },
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  // 5. Build authorization URL
  const providerConfig = await getProviderConfig(ventureId, provider);
  const params = new URLSearchParams({
    client_id: providerConfig.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    ...(loginHint && { login_hint: loginHint }),
  });

  return {
    authorizationUrl: `${providerConfig.authorizationEndpoint}?${params}`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLE OAUTH CALLBACK
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleOAuthCallback(options: {
  code: string;
  state: string;
}): Promise<{ user: User; session: Session; isNewUser: boolean }> {
  const { code, state } = options;

  // 1. Look up and validate state
  const oauthState = await db.query.oauthStates.findFirst({
    where: and(
      eq(schema.oauthStates.state, state),
      gt(schema.oauthStates.expiresAt, new Date()),
    ),
  });

  if (!oauthState) {
    throw new SsoError('INVALID_OAUTH_STATE', 'OAuth state is invalid or expired');
  }

  // 2. Exchange code for tokens (with PKCE verifier)
  const providerConfig = await getProviderConfig(oauthState.ventureId, oauthState.provider);
  const tokenResponse = await exchangeCodeForTokens({
    code,
    redirectUri: oauthState.redirectUri,
    codeVerifier: oauthState.codeVerifier,
    provider: providerConfig,
  });

  // 3. Get user info from provider
  const providerProfile = await getProviderUserInfo(oauthState.provider, tokenResponse.accessToken);

  // 4. Resolve or create user (identity resolution)
  const { user, isNewUser } = await resolveOAuthIdentity({
    ventureId: oauthState.ventureId,
    provider: oauthState.provider,
    providerAccountId: providerProfile.id,
    email: providerProfile.email,
    profile: providerProfile,
    tokens: tokenResponse,
  });

  // 5. Clean up state
  await db.delete(schema.oauthStates).where(eq(schema.oauthStates.id, oauthState.id));

  // 6. Create session
  const session = await createSession({
    userId: user.id,
    ventureId: oauthState.ventureId,
    ipAddress: '', // Extracted from request context
    userAgent: '',
  });

  return { user, session: session.session, isNewUser };
}
```

---

## SAML 2.0 Enterprise Federation

### SAML SP-Initiated Flow

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                          SAML SP-INITIATED SSO FLOW                               │
│                                                                                   │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────┐   ┌──────────┐   │
│  │  User    │   │ MCV SP   │   │  Enterprise  │   │ MCV ACS  │   │  Session │   │
│  │  Browser │   │ (Venture)│   │  IdP (Okta)  │   │ Endpoint │   │  Created │   │
│  └────┬─────┘   └────┬─────┘   └──────┬───────┘   └────┬─────┘   └────┬─────┘   │
│       │              │               │               │              │            │
│       │──Login───▶  │               │               │              │            │
│       │              │──AuthnReq──▶ │               │              │            │
│       │◀─Redirect──│               │               │              │            │
│       │              │               │               │              │            │
│       │──────────────────────────▶  │               │              │            │
│       │              │               │──Authenticate─│              │            │
│       │              │               │  (Okta UI)   │              │            │
│       │◀──────────────────────────  │               │              │            │
│       │              │               │               │              │            │
│       │──SAMLResponse (POST)─────────────────────▶  │              │            │
│       │              │               │               │──Validate──▶│            │
│       │              │               │               │  Assertion  │            │
│       │              │               │               │              │──Create──▶ │
│       │              │               │               │              │  Session   │
│       │◀──────────────────────────────────────────session──────────│            │
│       │              │               │               │              │            │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### SAML Configuration

```typescript
interface SamlConfig {
  // Identity Provider settings
  entryPoint: string;                 // IdP SSO URL
  issuer: string;                     // IdP entity ID
  cert: string;                       // IdP signing certificate (PEM)
  
  // Service Provider settings (auto-generated)
  spEntityId: string;                 // MCV entity ID (e.g., https://betedge.mcv.one/saml/metadata)
  assertionConsumerServiceUrl: string;// ACS URL (e.g., https://betedge.mcv.one/saml/acs)
  singleLogoutServiceUrl?: string;    // SLO URL
  
  // Signing & encryption
  signAuthnRequests: boolean;         // Sign AuthnRequests (recommended)
  wantAssertionsSigned: boolean;      // Require signed assertions (required)
  wantAssertionsEncrypted: boolean;   // Require encrypted assertions
  signatureAlgorithm: 'sha256' | 'sha512';
  
  // Attribute mapping
  attributes: SamlAttributeMap;
  
  // JIT provisioning
  jitProvisioning: boolean;
  jitOptions?: JitProvisioningConfig;
  
  // Restrictions
  allowedDomains?: string[];          // Only allow emails from these domains
  forceAuthn?: boolean;               // Force re-authentication at IdP
  
  // Metadata
  metadataUrl?: string;               // IdP metadata URL (for auto-config)
}

interface SamlAttributeMap {
  email: string;                      // Required: maps to user email
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string;                    // IdP group memberships
  department?: string;
  phone?: string;
  
  // Custom attribute mappings
  custom?: Record<string, string>;    // MCV field → SAML attribute URI
}
```

### Configure SAML for a Venture

```typescript
import { configureSaml, getSamlMetadata } from '@mcv/identity';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURE SAML IdP FOR ENTERPRISE VENTURE
// ═══════════════════════════════════════════════════════════════════════════════

export async function configureSaml(
  ventureId: string,
  config: SamlConfig,
): Promise<{ spMetadata: string; entityId: string }> {
  // 1. Validate certificate
  const certInfo = parseCertificate(config.cert);
  if (certInfo.expiresAt < new Date()) {
    throw new SsoError('SAML_CERT_EXPIRED', 'IdP certificate has expired');
  }

  // 2. If metadata URL provided, auto-populate config
  if (config.metadataUrl) {
    const idpMetadata = await parseSamlMetadata(config.metadataUrl);
    config = { ...config, ...idpMetadata };
  }

  // 3. Generate SP signing keypair (if not exists)
  const spKeyPair = await getOrCreateSpKeyPair(ventureId);

  // 4. Store SAML config
  await db.insert(schema.ssoConfigs).values({
    ventureId,
    type: 'saml',
    config: {
      ...config,
      spPrivateKey: await encryptSecret(spKeyPair.privateKey),
      spCertificate: spKeyPair.certificate,
    },
    enabled: true,
  });

  // 5. Generate SP metadata XML
  const spMetadata = generateSpMetadata({
    entityId: `https://${await getVentureDomain(ventureId)}/saml/metadata`,
    acsUrl: `https://${await getVentureDomain(ventureId)}/saml/acs`,
    sloUrl: `https://${await getVentureDomain(ventureId)}/saml/slo`,
    certificate: spKeyPair.certificate,
    nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  });

  // 6. Audit log
  await auditLog({
    action: 'sso.saml.configured',
    actorId: 'system',
    resourceType: 'Venture',
    resourceId: ventureId,
    metadata: { issuer: config.issuer, jitEnabled: config.jitProvisioning },
  });

  return { spMetadata, entityId: `https://${await getVentureDomain(ventureId)}/saml/metadata` };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLE SAML RESPONSE (ACS Endpoint)
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleSamlResponse(options: {
  ventureId: string;
  samlResponse: string;   // Base64-encoded SAML Response
  relayState?: string;
  ipAddress: string;
  userAgent: string;
}): Promise<{ user: User; session: Session; isNewUser: boolean }> {
  const { ventureId, samlResponse, relayState, ipAddress, userAgent } = options;

  // 1. Load SAML config for venture
  const samlConfig = await getSamlConfigForVenture(ventureId);
  if (!samlConfig) {
    throw new SsoError('SAML_NOT_CONFIGURED', 'SAML is not configured for this venture');
  }

  // 2. Validate and parse SAML assertion
  const assertion = await validateSamlAssertion({
    samlResponse,
    idpCert: samlConfig.cert,
    spEntityId: samlConfig.spEntityId,
    acsUrl: samlConfig.assertionConsumerServiceUrl,
    allowedClockSkew: 300, // 5 minutes tolerance
  });

  // 3. Check OneTimeUse condition (replay prevention)
  const assertionId = assertion.id;
  const isDuplicate = await checkAssertionReplay(assertionId);
  if (isDuplicate) {
    throw new SsoError('SAML_REPLAY_DETECTED', 'SAML assertion has already been used');
  }
  await recordAssertionId(assertionId, assertion.notOnOrAfter);

  // 4. Extract attributes
  const attributes = mapSamlAttributes(assertion.attributes, samlConfig.attributes);

  // 5. Domain restriction check
  if (samlConfig.allowedDomains?.length) {
    const emailDomain = attributes.email.split('@')[1];
    if (!samlConfig.allowedDomains.includes(emailDomain)) {
      throw new SsoError('DOMAIN_NOT_ALLOWED', `Email domain ${emailDomain} is not authorized`);
    }
  }

  // 6. Resolve or provision user
  let user: User;
  let isNewUser = false;

  // Try to find existing account link
  const existingAccount = await db.query.accounts.findFirst({
    where: and(
      eq(schema.accounts.providerId, `saml:${samlConfig.issuer}`),
      eq(schema.accounts.accountId, assertion.nameId),
    ),
  });

  if (existingAccount) {
    // Existing user — update profile from IdP
    user = await db.query.users.findFirst({
      where: eq(schema.users.id, existingAccount.userId),
    });
    await updateUserFromSaml(user.id, attributes);
  } else if (samlConfig.jitProvisioning) {
    // JIT provision new user
    const result = await provisionJitUser({
      ventureId,
      email: attributes.email,
      firstName: attributes.firstName,
      lastName: attributes.lastName,
      displayName: attributes.displayName,
      provider: `saml:${samlConfig.issuer}`,
      providerAccountId: assertion.nameId,
      groups: attributes.groups,
      jitOptions: samlConfig.jitOptions,
    });
    user = result.user;
    isNewUser = true;
  } else {
    throw new SsoError('USER_NOT_FOUND', 'No matching user and JIT provisioning is disabled');
  }

  // 7. Create session
  const session = await createSession({
    userId: user.id,
    ventureId,
    ipAddress,
    userAgent,
    mfaVerified: true, // IdP handled authentication
  });

  // 8. Audit log
  await auditLog({
    action: 'sso.saml.login',
    actorId: user.id,
    resourceType: 'Session',
    resourceId: session.session.id,
    metadata: {
      ventureId,
      issuer: samlConfig.issuer,
      nameId: assertion.nameId,
      isNewUser,
    },
  });

  return { user, session: session.session, isNewUser };
}
```

---

## OIDC Provider (MCV as Identity Provider)

MCV can act as an OpenID Connect identity provider for third-party applications and partner integrations.

### OIDC Discovery

```
GET /.well-known/openid-configuration

{
  "issuer": "https://auth.mcv.one",
  "authorization_endpoint": "https://auth.mcv.one/oauth/authorize",
  "token_endpoint": "https://auth.mcv.one/oauth/token",
  "userinfo_endpoint": "https://auth.mcv.one/oauth/userinfo",
  "jwks_uri": "https://auth.mcv.one/.well-known/jwks.json",
  "introspection_endpoint": "https://auth.mcv.one/oauth/introspect",
  "revocation_endpoint": "https://auth.mcv.one/oauth/revoke",
  "response_types_supported": ["code", "id_token", "code id_token"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email", "phone", "ventures"],
  "code_challenge_methods_supported": ["S256"]
}
```

### JWKS (JSON Web Key Set)

```typescript
// Source: packages/db/src/schema/auth.ts

export const jwks = pgTable('jwks', {
  id: text('id').primaryKey(),
  publicKey: text('public_key').notNull(),     // PEM-encoded RSA public key
  privateKey: text('private_key').notNull(),   // PEM-encoded RSA private key (encrypted)
  createdAt: timestamp('created_at',
    { withTimezone: true }).notNull().defaultNow(),
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PK | Key identifier (kid) |
| `public_key` | `text` | NOT NULL | PEM-encoded RSA public key |
| `private_key` | `text` | NOT NULL | PEM-encoded RSA private key (encrypted at rest) |
| `created_at` | `timestamptz` | NOT NULL, default now | Key creation time |

### Register OIDC Client

```typescript
import { registerOidcClient } from '@mcv/identity';

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTER OIDC CLIENT (third-party application)
// ═══════════════════════════════════════════════════════════════════════════════

export async function registerOidcClient(options: {
  ventureId: string;
  name: string;
  redirectUris: string[];
  grantTypes: ('authorization_code' | 'refresh_token')[];
  scopes: string[];
  logoUrl?: string;
  tosUrl?: string;
  policyUrl?: string;
}): Promise<{ clientId: string; clientSecret: string }> {
  const { ventureId, name, redirectUris, grantTypes, scopes } = options;

  // 1. Validate redirect URIs
  for (const uri of redirectUris) {
    if (!isValidRedirectUri(uri)) {
      throw new SsoError('INVALID_REDIRECT_URI', `Invalid redirect URI: ${uri}`);
    }
  }

  // 2. Generate credentials
  const clientId = generateClientId();           // 32-char alphanumeric
  const clientSecret = generateSecureToken(48);  // 48-byte random
  const clientSecretHash = await hashSecret(clientSecret);

  // 3. Store client
  await db.insert(schema.oidcClients).values({
    ventureId,
    clientId,
    clientSecretHash,
    name,
    redirectUris,
    grantTypes,
    scopes,
    logoUrl: options.logoUrl,
    tosUrl: options.tosUrl,
    policyUrl: options.policyUrl,
    createdAt: new Date(),
  });

  // 4. Audit log
  await auditLog({
    action: 'sso.oidc.client_registered',
    resourceType: 'OidcClient',
    metadata: { ventureId, clientId, name, scopes },
  });

  return { clientId, clientSecret }; // Secret only returned once
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHORIZATION ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════════

export async function authorizeOidc(options: {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  nonce?: string;
  userId: string;   // From authenticated session
}): Promise<{ redirectUrl: string }> {
  const { clientId, redirectUri, scope, state, codeChallenge, nonce, userId } = options;

  // 1. Validate client
  const client = await db.query.oidcClients.findFirst({
    where: eq(schema.oidcClients.clientId, clientId),
  });
  if (!client) throw new SsoError('INVALID_CLIENT', 'Unknown client_id');

  // 2. Validate redirect_uri
  if (!client.redirectUris.includes(redirectUri)) {
    throw new SsoError('INVALID_REDIRECT_URI', 'redirect_uri not registered');
  }

  // 3. Validate scopes
  const requestedScopes = scope.split(' ');
  const invalidScopes = requestedScopes.filter((s) => !client.scopes.includes(s));
  if (invalidScopes.length > 0) {
    throw new SsoError('INVALID_SCOPE', `Unauthorized scopes: ${invalidScopes.join(', ')}`);
  }

  // 4. Generate authorization code
  const authCode = generateSecureToken(32);
  await storeAuthorizationCode({
    code: authCode,
    clientId,
    userId,
    redirectUri,
    scopes: requestedScopes,
    codeChallenge,
    codeChallengeMethod: options.codeChallengeMethod,
    nonce,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  // 5. Build redirect
  const params = new URLSearchParams({ code: authCode, state });
  return { redirectUrl: `${redirectUri}?${params}` };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════════

export async function tokenOidc(options: {
  grantType: string;
  code?: string;
  redirectUri?: string;
  clientId: string;
  clientSecret: string;
  codeVerifier?: string;
  refreshToken?: string;
}): Promise<OidcTokenSet> {
  const { grantType, clientId, clientSecret } = options;

  // 1. Authenticate client
  const client = await authenticateClient(clientId, clientSecret);

  if (grantType === 'authorization_code') {
    // 2a. Validate authorization code
    const authCode = await validateAuthorizationCode(options.code, clientId, options.redirectUri);

    // 3a. Validate PKCE
    if (authCode.codeChallenge) {
      await validatePkce(options.codeVerifier, authCode.codeChallenge, authCode.codeChallengeMethod);
    }

    // 4a. Generate tokens
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, authCode.userId) });
    const jwk = await getActiveSigningKey();

    const idToken = await signJwt(jwk.privateKey, {
      iss: 'https://auth.mcv.one',
      sub: user.id,
      aud: clientId,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      nonce: authCode.nonce,
      email: user.email,
      email_verified: user.emailVerified,
      name: user.displayName || `${user.firstName} ${user.lastName}`,
    });

    const accessToken = await signJwt(jwk.privateKey, {
      iss: 'https://auth.mcv.one',
      sub: user.id,
      aud: clientId,
      scope: authCode.scopes.join(' '),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    // 5a. Consume authorization code (one-time use)
    await consumeAuthorizationCode(authCode.code);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      id_token: idToken,
      scope: authCode.scopes.join(' '),
    };
  }

  if (grantType === 'refresh_token') {
    // Handle refresh token grant
    return refreshOidcTokens(options.refreshToken, client);
  }

  throw new SsoError('UNSUPPORTED_GRANT_TYPE', `Grant type ${grantType} is not supported`);
}
```

---

## Identity Resolution & Account Linking

### Account Link Structure

The `accounts` table (from `auth.ts`) stores linked provider identities:

```typescript
// Source: packages/db/src/schema/auth.ts

export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),         // Provider-specific user ID
  providerId: text('provider_id').notNull(),        // 'google', 'github', 'saml:okta', 'credential'
  accessToken: text('access_token'),                // OAuth access token (encrypted)
  refreshToken: text('refresh_token'),              // OAuth refresh token (encrypted)
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),                             // Granted OAuth scopes
  idToken: text('id_token'),                        // OIDC ID token
  password: text('password'),                       // Hashed password (for 'credential' provider)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PK | Unique account link identifier |
| `user_id` | `uuid` | FK → users.id, CASCADE | The MCV user this identity belongs to |
| `account_id` | `text` | NOT NULL | Provider-specific user identifier |
| `provider_id` | `text` | NOT NULL | Provider name (`google`, `github`, `saml:<issuer>`, `credential`) |
| `access_token` | `text` | nullable | Provider OAuth access token (encrypted at rest) |
| `refresh_token` | `text` | nullable | Provider OAuth refresh token (encrypted at rest) |
| `access_token_expires_at` | `timestamptz` | nullable | When the access token expires |
| `refresh_token_expires_at` | `timestamptz` | nullable | When the refresh token expires |
| `scope` | `text` | nullable | OAuth scopes granted by provider |
| `id_token` | `text` | nullable | OIDC ID token from provider |
| `password` | `text` | nullable | Argon2id hash (only for `credential` provider) |
| `created_at` | `timestamptz` | NOT NULL, default now | When the link was created |
| `updated_at` | `timestamptz` | NOT NULL, default now | Last update timestamp |

### Identity Resolution

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                        IDENTITY RESOLUTION FLOW                               │
│                                                                               │
│  External Identity           Resolution Engine            MCV User            │
│  ─────────────────          ─────────────────          ──────────             │
│                                                                               │
│  Google: user@gmail.com ──▶ 1. Match by provider+id ──▶ Found? ──▶ Return    │
│                              2. Match by email ────────▶ Found? ──▶ Link+Ret  │
│                              3. JIT Provision? ────────▶ Create ──▶ Return    │
│                              4. Reject ────────────────▶ Error                │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                     LINKED IDENTITIES EXAMPLE                            │ │
│  │                                                                          │ │
│  │   MCV User: alice (alice@company.com)                                    │ │
│  │   ├── credential: alice@company.com (password)                           │ │
│  │   ├── google: 118234567890 (alice@gmail.com)                             │ │
│  │   ├── github: 12345 (@alice)                                             │ │
│  │   ├── saml:okta: alice@company.com (Enterprise SSO)                      │ │
│  │   └── webauthn: <credential-id> (iPhone passkey)                         │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

```typescript
import { resolveIdentity, linkIdentity, mergeAccounts } from '@mcv/identity';

// ═══════════════════════════════════════════════════════════════════════════════
// RESOLVE IDENTITY (find MCV user from external identity)
// ═══════════════════════════════════════════════════════════════════════════════

export async function resolveIdentity(options: {
  provider: string;
  providerAccountId: string;
  email?: string;
  allowAutoLink?: boolean;
}): Promise<{ user: User; resolution: 'exact' | 'email_linked' | 'provisioned' } | null> {
  const { provider, providerAccountId, email, allowAutoLink = true } = options;

  // Strategy 1: Exact match on provider + account ID
  const exactMatch = await db.query.accounts.findFirst({
    where: and(
      eq(schema.accounts.providerId, provider),
      eq(schema.accounts.accountId, providerAccountId),
    ),
  });

  if (exactMatch) {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, exactMatch.userId),
    });
    return { user, resolution: 'exact' };
  }

  // Strategy 2: Match by verified email (auto-link)
  if (email && allowAutoLink) {
    const emailUser = await db.query.users.findFirst({
      where: and(
        eq(schema.users.email, email.toLowerCase()),
        eq(schema.users.emailVerified, true),
      ),
    });

    if (emailUser) {
      // Auto-link this provider to existing user
      await linkIdentity(emailUser.id, {
        provider,
        providerAccountId,
        email,
      });

      await auditLog({
        action: 'sso.identity.auto_linked',
        actorId: emailUser.id,
        metadata: { provider, email },
      });

      return { user: emailUser, resolution: 'email_linked' };
    }
  }

  return null; // No resolution — caller decides to JIT provision or reject
}

// ═══════════════════════════════════════════════════════════════════════════════
// LINK IDENTITY (add provider to existing user)
// ═══════════════════════════════════════════════════════════════════════════════

export async function linkIdentity(
  userId: string,
  options: {
    provider: string;
    providerAccountId: string;
    email?: string;
    accessToken?: string;
    refreshToken?: string;
    scope?: string;
  },
): Promise<void> {
  const { provider, providerAccountId } = options;

  // Check for conflicts (another user linked to this provider account)
  const existing = await db.query.accounts.findFirst({
    where: and(
      eq(schema.accounts.providerId, provider),
      eq(schema.accounts.accountId, providerAccountId),
    ),
  });

  if (existing && existing.userId !== userId) {
    throw new SsoError(
      'IDENTITY_CONFLICT',
      'This provider account is already linked to another user',
    );
  }

  if (existing && existing.userId === userId) {
    return; // Already linked — idempotent
  }

  await db.insert(schema.accounts).values({
    id: crypto.randomUUID(),
    userId,
    providerId: provider,
    accountId: providerAccountId,
    accessToken: options.accessToken ? await encryptToken(options.accessToken) : null,
    refreshToken: options.refreshToken ? await encryptToken(options.refreshToken) : null,
    scope: options.scope,
  });

  await auditLog({
    action: 'sso.identity.linked',
    actorId: userId,
    metadata: { provider, providerAccountId },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MERGE ACCOUNTS (admin action: combine two users into one)
// ═══════════════════════════════════════════════════════════════════════════════

export async function mergeAccounts(options: {
  primaryUserId: string;
  secondaryUserId: string;
  mergeStrategy: 'prefer_primary' | 'prefer_secondary' | 'prefer_newest';
  performedBy: string;  // Admin user ID
}): Promise<{ mergedUser: User; migratedRecords: Record<string, number> }> {
  const { primaryUserId, secondaryUserId, mergeStrategy, performedBy } = options;

  return await db.transaction(async (tx) => {
    // 1. Move all accounts from secondary → primary
    const movedAccounts = await tx
      .update(schema.accounts)
      .set({ userId: primaryUserId, updatedAt: new Date() })
      .where(eq(schema.accounts.userId, secondaryUserId))
      .returning();

    // 2. Move venture memberships (skip duplicates)
    const existingMemberships = await tx.query.ventureMemberships.findMany({
      where: eq(schema.ventureMemberships.userId, primaryUserId),
    });
    const existingVentureIds = new Set(existingMemberships.map((m) => m.ventureId));

    const movedMemberships = await tx
      .update(schema.ventureMemberships)
      .set({ userId: primaryUserId, updatedAt: new Date() })
      .where(
        and(
          eq(schema.ventureMemberships.userId, secondaryUserId),
          notInArray(schema.ventureMemberships.ventureId, [...existingVentureIds]),
        ),
      )
      .returning();

    // 3. Move sessions
    await tx
      .update(schema.sessions)
      .set({ userId: primaryUserId, updatedAt: new Date() })
      .where(eq(schema.sessions.userId, secondaryUserId));

    // 4. Merge user profile based on strategy
    const [primary, secondary] = await Promise.all([
      tx.query.users.findFirst({ where: eq(schema.users.id, primaryUserId) }),
      tx.query.users.findFirst({ where: eq(schema.users.id, secondaryUserId) }),
    ]);

    const mergedProfile = mergeProfiles(primary, secondary, mergeStrategy);
    await tx.update(schema.users).set(mergedProfile).where(eq(schema.users.id, primaryUserId));

    // 5. Soft-delete secondary user
    await tx
      .update(schema.users)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(schema.users.id, secondaryUserId));

    // 6. Audit log
    await auditLog({
      action: 'sso.accounts.merged',
      actorId: performedBy,
      resourceType: 'User',
      resourceId: primaryUserId,
      metadata: {
        secondaryUserId,
        mergeStrategy,
        migratedAccounts: movedAccounts.length,
        migratedMemberships: movedMemberships.length,
      },
    });

    const mergedUser = await tx.query.users.findFirst({
      where: eq(schema.users.id, primaryUserId),
    });

    return {
      mergedUser,
      migratedRecords: {
        accounts: movedAccounts.length,
        memberships: movedMemberships.length,
      },
    };
  });
}
```

---

## JIT (Just-In-Time) Provisioning

Automatically creates MCV users when they first authenticate via an enterprise IdP.

```typescript
interface JitProvisioningConfig {
  enabled: boolean;
  defaultRole: 'admin' | 'member' | 'billing';   // Role in venture
  autoAssignVentures: string[];                    // Auto-add to these ventures
  sendWelcomeEmail: boolean;
  
  // Group-to-role mapping (IdP groups → MCV roles)
  roleMapping: Record<string, 'admin' | 'member' | 'billing'>;
  
  // Attribute defaults (when IdP doesn't provide)
  defaults: {
    timezone?: string;
    locale?: string;
    metadata?: Record<string, unknown>;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// JIT USER PROVISIONING
// ═══════════════════════════════════════════════════════════════════════════════

export async function provisionJitUser(options: {
  ventureId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  provider: string;
  providerAccountId: string;
  groups?: string[];
  jitOptions?: JitProvisioningConfig;
}): Promise<{ user: User; membership: VentureMembership }> {
  const { ventureId, email, provider, providerAccountId, groups = [], jitOptions } = options;
  const config = jitOptions || DEFAULT_JIT_CONFIG;

  return await db.transaction(async (tx) => {
    // 1. Create user
    const [user] = await tx
      .insert(schema.users)
      .values({
        email: email.toLowerCase(),
        emailVerified: true, // Verified by IdP
        firstName: options.firstName,
        lastName: options.lastName,
        displayName: options.displayName || `${options.firstName || ''} ${options.lastName || ''}`.trim(),
        status: 'active',
        timezone: config.defaults?.timezone || 'UTC',
        locale: config.defaults?.locale || 'en',
        metadata: config.defaults?.metadata,
      })
      .returning();

    // 2. Link provider account
    await tx.insert(schema.accounts).values({
      id: crypto.randomUUID(),
      userId: user.id,
      providerId: provider,
      accountId: providerAccountId,
    });

    // 3. Determine role from group mapping
    let role = config.defaultRole;
    for (const group of groups) {
      if (config.roleMapping[group]) {
        role = config.roleMapping[group];
        break; // First match wins (ordered by priority)
      }
    }

    // 4. Create venture membership
    const [membership] = await tx
      .insert(schema.ventureMemberships)
      .values({
        userId: user.id,
        ventureId,
        organizationId: ventureId,
        role,
        joinedAt: new Date(),
      })
      .returning();

    // 5. Auto-assign additional ventures
    for (const additionalVentureId of config.autoAssignVentures) {
      if (additionalVentureId !== ventureId) {
        await tx.insert(schema.ventureMemberships).values({
          userId: user.id,
          ventureId: additionalVentureId,
          organizationId: additionalVentureId,
          role: 'member',
          joinedAt: new Date(),
        }).onConflictDoNothing();
      }
    }

    // 6. Send welcome email
    if (config.sendWelcomeEmail) {
      await queueEmail({
        to: user.email,
        template: 'welcome-sso',
        data: {
          name: user.displayName,
          venture: await getVentureName(ventureId),
          provider: provider.replace('saml:', ''),
        },
      });
    }

    // 7. Audit log
    await auditLog({
      action: 'sso.user.jit_provisioned',
      actorId: user.id,
      resourceType: 'User',
      resourceId: user.id,
      metadata: {
        ventureId,
        provider,
        role,
        groups,
        email: user.email,
      },
    });

    return { user, membership };
  });
}
```

---

## Session Synchronization

### Session Schema (from source)

```typescript
// Source: packages/db/src/schema/auth.ts

export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  activeVentureId: text('active_venture_id'),    // Currently active venture context
  impersonatedBy: text('impersonated_by'),       // Admin impersonation (admin plugin)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PK | Session identifier |
| `user_id` | `uuid` | FK → users.id, CASCADE, NOT NULL | Owner of this session |
| `token` | `text` | UNIQUE, NOT NULL | Session token (hashed) |
| `expires_at` | `timestamptz` | NOT NULL | Absolute session expiration |
| `ip_address` | `text` | nullable | Client IP (masked for privacy) |
| `user_agent` | `text` | nullable | Browser/client identifier |
| `active_venture_id` | `text` | nullable | Currently active venture (maps to Better Auth `activeOrganizationId`) |
| `impersonated_by` | `text` | nullable | Admin user ID if impersonating |
| `created_at` | `timestamptz` | NOT NULL, default now | Session creation time |
| `updated_at` | `timestamptz` | NOT NULL, default now | Last session update |

### Cross-Venture Session Propagation

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// PROPAGATE LOGOUT ACROSS ALL VENTURES
// ═══════════════════════════════════════════════════════════════════════════════

export async function propagateLogout(
  userId: string,
  options: { reason?: string; excludeSessionId?: string } = {},
): Promise<{ revokedCount: number; ventures: string[] }> {
  const { reason = 'user_logout', excludeSessionId } = options;

  // 1. Find all active sessions for user
  const query = db
    .select({
      id: schema.sessions.id,
      activeVentureId: schema.sessions.activeVentureId,
    })
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.userId, userId),
        gt(schema.sessions.expiresAt, new Date()),
        excludeSessionId ? ne(schema.sessions.id, excludeSessionId) : undefined,
      ),
    );

  const activeSessions = await query;

  // 2. Revoke all sessions
  const result = await db
    .update(schema.sessions)
    .set({
      expiresAt: new Date(), // Immediate expiry
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.sessions.userId, userId),
        gt(schema.sessions.expiresAt, new Date()),
        excludeSessionId ? ne(schema.sessions.id, excludeSessionId) : undefined,
      ),
    );

  // 3. Collect affected ventures
  const ventures = [...new Set(activeSessions
    .map((s) => s.activeVentureId)
    .filter(Boolean))];

  // 4. Publish logout event (for real-time session invalidation)
  await publishEvent('sso.session.global_logout', {
    userId,
    sessionIds: activeSessions.map((s) => s.id),
    ventures,
    reason,
  });

  // 5. Audit log
  await auditLog({
    action: 'sso.session.propagated_logout',
    actorId: userId,
    metadata: {
      revokedSessions: activeSessions.length,
      ventures,
      reason,
    },
  });

  return { revokedCount: activeSessions.length, ventures };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET GLOBAL SESSION STATE (all ventures)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getGlobalSessionState(userId: string): Promise<{
  activeSessions: VentureSession[];
  totalCount: number;
}> {
  const sessions = await db
    .select({
      sessionId: schema.sessions.id,
      ventureId: schema.sessions.activeVentureId,
      ipAddress: schema.sessions.ipAddress,
      userAgent: schema.sessions.userAgent,
      createdAt: schema.sessions.createdAt,
      expiresAt: schema.sessions.expiresAt,
      impersonatedBy: schema.sessions.impersonatedBy,
    })
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.userId, userId),
        gt(schema.sessions.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(schema.sessions.createdAt));

  return {
    activeSessions: sessions.map((s) => ({
      sessionId: s.sessionId,
      ventureId: s.ventureId,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isImpersonated: !!s.impersonatedBy,
    })),
    totalCount: sessions.length,
  };
}
```

---

## Venture Memberships Schema

```typescript
// Source: packages/db/src/schema/venture-memberships.ts

export const ventureMemberRoleEnum = pgEnum('venture_member_role', [
  'admin',
  'member',
  'billing',
]);

export const ventureMemberships = pgTable('venture_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .references(() => ventures.id, { onDelete: 'cascade' }),
  role: ventureMemberRoleEnum('role').default('member').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  leftAt: timestamp('left_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('venture_membership_idx').on(table.userId, table.ventureId),
  uniqueIndex('venture_membership_org_idx').on(table.userId, table.organizationId),
  index('venture_memberships_user_id_idx').on(table.userId),
]);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, auto-generated | Unique membership identifier |
| `user_id` | `uuid` | FK → users.id, CASCADE, NOT NULL | The user |
| `venture_id` | `uuid` | FK → ventures.id, CASCADE, NOT NULL | The venture |
| `organization_id` | `uuid` | FK → ventures.id, CASCADE, nullable | Better Auth organization mapping (mirrors venture_id) |
| `role` | `venture_member_role` | NOT NULL, default 'member' | `admin`, `member`, or `billing` |
| `joined_at` | `timestamptz` | nullable | When user joined the venture |
| `left_at` | `timestamptz` | nullable | When user left (soft removal) |
| `created_at` | `timestamptz` | default now | Record creation |
| `updated_at` | `timestamptz` | nullable | Last update |

**Indexes:**
- `venture_membership_idx` — UNIQUE on (`user_id`, `venture_id`) — one membership per user per venture
- `venture_membership_org_idx` — UNIQUE on (`user_id`, `organization_id`) — Better Auth compatibility
- `venture_memberships_user_id_idx` — INDEX on `user_id` — fast lookup of user's ventures

---

## Users Schema (SSO-Relevant Fields)

```typescript
// Source: packages/db/src/schema/users.ts

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Identity (critical for SSO resolution)
  email: text('email').unique().notNull(),
  username: text('username').unique(),
  emailVerified: boolean('email_verified').default(false),
  phone: text('phone'),
  phoneVerified: boolean('phone_verified').default(false),

  // Profile (populated by JIT provisioning)
  displayName: text('display_name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatarUrl: text('avatar_url'),

  // Admin
  role: text('role').default('user'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { withTimezone: true }),

  // Settings
  timezone: text('timezone').default('UTC'),
  locale: text('locale').default('en'),

  // Status
  status: text('status', {
    enum: ['active', 'suspended', 'banned', 'deleted'],
  }).default('active'),

  // MFA
  mfaEnabled: boolean('mfa_enabled').default(false),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),

  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
}, (table) => [
  index('users_email_idx').on(table.email),
]);
```

| Column | Type | SSO Relevance |
|--------|------|---------------|
| `email` | `text` | Primary identity resolution key |
| `email_verified` | `boolean` | Must be `true` for auto-linking |
| `status` | `enum` | Must be `active` for SSO login |
| `banned` | `boolean` | Blocks SSO if `true` |
| `last_login_at` | `timestamptz` | Updated on each SSO login |
| `metadata` | `jsonb` | Stores IdP-specific attributes |

---

## WebAuthn / Passkeys Schema

```typescript
// Source: packages/db/src/schema/webauthn-credentials.ts

export const webauthnCredentials = pgTable('webauthn_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id').notNull().unique(),
  publicKey: text('public_key').notNull(),
  counter: bigint('counter', { mode: 'number' }).notNull().default(0),
  deviceType: text('device_type'),                // 'singleDevice' | 'multiDevice'
  backedUp: boolean('backed_up').default(false),
  aaguid: text('aaguid'),                         // Authenticator model identifier
  transports: text('transports'),                  // JSON: ['usb','nfc','ble','internal','hybrid']
  name: text('name'),                              // User-friendly name
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('webauthn_credentials_user_id_idx').on(table.userId),
  index('webauthn_credentials_credential_id_idx').on(table.credentialId),
]);

export const webauthnChallenges = pgTable('webauthn_challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  challenge: text('challenge').notNull().unique(),
  type: text('type').notNull().$type<'registration' | 'authentication'>(),
  sessionId: text('session_id'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('webauthn_challenges_user_id_idx').on(table.userId),
  index('webauthn_challenges_challenge_idx').on(table.challenge),
  index('webauthn_challenges_expires_at_idx').on(table.expiresAt),
]);
```

---

## Verification Tokens Schema

```typescript
// Source: packages/db/src/schema/auth.ts

export const verifications = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),    // Email, phone, or other identifier
  value: text('value').notNull(),              // Verification token/code
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

Used for: email verification, magic links, password reset tokens, and SAML relay state storage.

---

## Two-Factor Authentication Schema

```typescript
// Source: packages/db/src/schema/auth.ts

export const twoFactors = pgTable('two_factor', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  secret: text('secret').notNull(),            // TOTP secret (encrypted)
  backupCodes: text('backup_codes').notNull(), // JSON array of hashed backup codes
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## SCIM Provisioning

For enterprise customers who need automated user lifecycle management from their IdP:

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SCIM 2.0 ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /scim/v2/Users
export async function scimListUsers(ventureId: string, params: ScimListParams): Promise<ScimListResponse> {
  const { startIndex = 1, count = 100, filter } = params;

  let query = db
    .select()
    .from(schema.users)
    .innerJoin(schema.ventureMemberships, eq(schema.users.id, schema.ventureMemberships.userId))
    .where(eq(schema.ventureMemberships.ventureId, ventureId));

  // Apply SCIM filter (e.g., userName eq "alice@company.com")
  if (filter) {
    query = applyScimFilter(query, filter);
  }

  const users = await query.offset(startIndex - 1).limit(count);

  return {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults: users.length,
    startIndex,
    itemsPerPage: count,
    Resources: users.map(toScimUser),
  };
}

// POST /scim/v2/Users (Create)
export async function scimCreateUser(ventureId: string, scimUser: ScimUser): Promise<ScimUser> {
  const { user, membership } = await provisionJitUser({
    ventureId,
    email: scimUser.userName,
    firstName: scimUser.name?.givenName,
    lastName: scimUser.name?.familyName,
    displayName: scimUser.displayName,
    provider: 'scim',
    providerAccountId: scimUser.externalId || scimUser.userName,
  });

  return toScimUser({ user, membership });
}

// PATCH /scim/v2/Users/:id (Update)
export async function scimPatchUser(
  ventureId: string, userId: string, operations: ScimPatchOp[],
): Promise<ScimUser> {
  for (const op of operations) {
    switch (op.op) {
      case 'replace':
        await applyScimReplace(userId, op.path, op.value);
        break;
      case 'add':
        await applyScimAdd(userId, op.path, op.value);
        break;
      case 'remove':
        await applyScimRemove(userId, op.path);
        break;
    }
  }

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  return toScimUser({ user });
}

// DELETE /scim/v2/Users/:id (Deactivate)
export async function scimDeleteUser(ventureId: string, userId: string): Promise<void> {
  // Soft-delete: mark membership as left and deactivate
  await db
    .update(schema.ventureMemberships)
    .set({ leftAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(schema.ventureMemberships.userId, userId),
        eq(schema.ventureMemberships.ventureId, ventureId),
      ),
    );

  // Propagate logout from this venture
  await propagateLogout(userId, { reason: 'scim_deprovisioned' });

  await auditLog({
    action: 'sso.scim.user_deprovisioned',
    actorId: 'scim',
    resourceType: 'User',
    resourceId: userId,
    metadata: { ventureId },
  });
}
```

---

## Security Considerations

| Concern | Mitigation | Implementation |
|---------|------------|----------------|
| **SSO token theft** | Short-lived tokens (5 min), one-time use | `expiresAt` + `redeemedAt` check |
| **SSO token replay** | Token invalidated on first use | `redeemedAt IS NULL` check |
| **SAML replay attack** | OneTimeUse assertion enforcement | `checkAssertionReplay()` with Redis dedup |
| **SAML assertion tampering** | XML signature verification | Validate with IdP certificate |
| **SAML clock skew** | 5-minute tolerance window | `allowedClockSkew: 300` |
| **OAuth CSRF** | State parameter with HMAC validation | `oauth_states` table with expiry |
| **OAuth PKCE bypass** | Require S256 code challenge | `code_verifier` stored and verified |
| **Redirect URI manipulation** | Strict allowlist validation | Per-client `redirectUris` array |
| **Account takeover via linking** | Email must be verified before auto-link | `emailVerified: true` check |
| **Session hijacking** | IP/UA binding (configurable) | `validateIpBinding` flag |
| **Credential stuffing** | Rate limiting on all auth endpoints | Sliding window rate limiter |
| **Privilege escalation** | Membership verified on venture switch | `ventureMemberships` check |
| **Token leakage** | Tokens encrypted at rest, never logged | `encryptToken()`, masked in audit |
| **JWKS key compromise** | Key rotation support | Multiple keys in `jwks` table |

### Redirect URI Validation Rules

```typescript
function isValidRedirectUri(uri: string): boolean {
  const parsed = new URL(uri);

  // Must be HTTPS (except localhost in dev)
  if (parsed.protocol !== 'https:') {
    if (process.env.NODE_ENV === 'production') return false;
    if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') return false;
  }

  // No fragments
  if (parsed.hash) return false;

  // No open redirects (path must not contain //)
  if (parsed.pathname.includes('//')) return false;

  // No wildcards in registered URIs
  if (uri.includes('*')) return false;

  return true;
}
```

---

## Performance Considerations

| Operation | Target Latency | Strategy |
|-----------|---------------|----------|
| Cross-venture SSO initiate | < 50ms | Token generation is fast; membership check is indexed |
| Cross-venture SSO complete | < 100ms | Single token lookup + session creation |
| Venture switch | < 30ms | Single UPDATE with indexed lookup |
| OAuth state lookup | < 10ms | Unique index on `state` column |
| SAML assertion validation | < 200ms | XML parsing + signature verification |
| Identity resolution | < 50ms | Indexed lookups on `provider_id` + `account_id` |
| Session propagation (logout) | < 100ms | Bulk UPDATE + async event publish |
| SCIM list users | < 500ms | Paginated with indexed venture filter |

### Caching Strategy

```typescript
const SSO_CACHE = {
  // Venture membership cache (invalidated on membership change)
  ventureMemberships: {
    key: (userId: string) => `sso:memberships:${userId}`,
    ttl: 300,       // 5 minutes
  },

  // SAML config cache (invalidated on config update)
  samlConfig: {
    key: (ventureId: string) => `sso:saml:${ventureId}`,
    ttl: 3600,      // 1 hour
  },

  // OIDC client cache
  oidcClient: {
    key: (clientId: string) => `sso:oidc:client:${clientId}`,
    ttl: 600,       // 10 minutes
  },

  // JWKS cache
  jwks: {
    key: () => 'sso:jwks',
    ttl: 86400,     // 24 hours (keys rotate infrequently)
  },
};
```

### Expired State Cleanup

```typescript
// Cron job: Clean up expired OAuth states and SSO tokens
export async function cleanupExpiredSsoState(): Promise<{ deleted: number }> {
  const result = await db
    .delete(schema.oauthStates)
    .where(lt(schema.oauthStates.expiresAt, new Date()));

  // Also clean expired SSO tokens, SAML assertion IDs, etc.
  await cleanupExpiredSsoTokens();
  await cleanupExpiredAssertionIds();

  return { deleted: result.rowCount };
}
```

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# CROSS-VENTURE SSO
# ═══════════════════════════════════════════════════════════════════════════════
SSO_TOKEN_TTL=300                       # SSO token lifetime in seconds (default: 5 min)
SSO_VALIDATE_IP_BINDING=true            # Enforce IP match on SSO token redemption
COOKIE_DOMAIN=.mcv.one                  # Cross-subdomain cookie domain

# ═══════════════════════════════════════════════════════════════════════════════
# SAML 2.0
# ═══════════════════════════════════════════════════════════════════════════════
SAML_SP_ENTITY_ID=https://auth.mcv.one  # Service Provider entity ID
SAML_CLOCK_SKEW=300                     # Allowed clock skew in seconds
SAML_WANT_ASSERTIONS_SIGNED=true        # Require signed assertions
SAML_WANT_ASSERTIONS_ENCRYPTED=false    # Require encrypted assertions

# ═══════════════════════════════════════════════════════════════════════════════
# OIDC PROVIDER
# ═══════════════════════════════════════════════════════════════════════════════
OIDC_ISSUER=https://auth.mcv.one        # OIDC issuer URL
OIDC_ACCESS_TOKEN_TTL=3600              # Access token lifetime (1 hour)
OIDC_ID_TOKEN_TTL=3600                  # ID token lifetime (1 hour)
OIDC_AUTH_CODE_TTL=600                  # Authorization code lifetime (10 min)

# ═══════════════════════════════════════════════════════════════════════════════
# SCIM
# ═══════════════════════════════════════════════════════════════════════════════
SCIM_BEARER_TOKEN=                      # Static bearer token for SCIM endpoint auth
SCIM_MAX_RESULTS=200                    # Max results per SCIM list request

# ═══════════════════════════════════════════════════════════════════════════════
# SIGNING KEYS
# ═══════════════════════════════════════════════════════════════════════════════
AUTH_SECRET=                            # 32+ byte secret for JWT signing
JWKS_ROTATION_DAYS=90                   # Rotate JWKS every N days
```

---

## Audit Events

| Event | Severity | Data Captured |
|-------|----------|---------------|
| `sso.cross_venture.initiated` | info | userId, sourceVentureId, targetVentureId, ipAddress |
| `sso.cross_venture.completed` | info | userId, sourceVentureId, targetVentureId, sessionId |
| `sso.cross_venture.ip_mismatch` | warning | userId, expectedIp, actualIp |
| `sso.cross_venture.token_expired` | warning | userId, tokenId |
| `sso.cross_venture.token_replay` | critical | userId, tokenId, redeemedAt |
| `sso.venture.switched` | info | userId, previousVentureId, newVentureId, role |
| `sso.saml.configured` | info | ventureId, issuer, jitEnabled |
| `sso.saml.config_updated` | info | ventureId, changes |
| `sso.saml.login` | info | userId, ventureId, issuer, nameId, isNewUser |
| `sso.saml.login_failed` | warning | ventureId, issuer, reason, nameId |
| `sso.saml.replay_detected` | critical | ventureId, assertionId |
| `sso.saml.cert_expiring` | warning | ventureId, issuer, expiresAt |
| `sso.oidc.client_registered` | info | ventureId, clientId, name, scopes |
| `sso.oidc.client_revoked` | info | ventureId, clientId, revokedBy |
| `sso.oidc.authorized` | info | userId, clientId, scopes, redirectUri |
| `sso.oidc.token_issued` | info | clientId, grantType, scopes |
| `sso.identity.linked` | info | userId, provider, providerAccountId |
| `sso.identity.unlinked` | info | userId, provider |
| `sso.identity.auto_linked` | info | userId, provider, email |
| `sso.identity.conflict` | warning | userId, provider, conflictingUserId |
| `sso.accounts.merged` | critical | primaryUserId, secondaryUserId, performedBy, mergeStrategy |
| `sso.user.jit_provisioned` | info | userId, ventureId, provider, role, email |
| `sso.session.propagated_logout` | info | userId, revokedSessions, ventures, reason |
| `sso.scim.user_created` | info | ventureId, userId, email |
| `sso.scim.user_updated` | info | ventureId, userId, changes |
| `sso.scim.user_deprovisioned` | warning | ventureId, userId |

---

## Error Codes

| Code | HTTP Status | Description | User Message |
|------|-------------|-------------|--------------|
| `SSO_TOKEN_INVALID` | 401 | SSO token not found or expired | Authentication failed. Please try again. |
| `SSO_TOKEN_REDEEMED` | 401 | SSO token already used | This link has already been used. |
| `SSO_IP_MISMATCH` | 403 | IP changed between initiate and complete | Security validation failed. |
| `SSO_NO_VENTURE_ACCESS` | 403 | User not a member of target venture | You don't have access to this application. |
| `SSO_SESSION_INVALID` | 401 | Source session expired or revoked | Please sign in again. |
| `SAML_NOT_CONFIGURED` | 404 | No SAML config for venture | SSO is not configured for this application. |
| `SAML_ASSERTION_INVALID` | 401 | Signature verification failed | Authentication failed. Contact your IT admin. |
| `SAML_REPLAY_DETECTED` | 401 | Assertion ID already used | Authentication failed. Please try again. |
| `SAML_CERT_EXPIRED` | 400 | IdP certificate has expired | IdP certificate needs renewal. |
| `SAML_DOMAIN_NOT_ALLOWED` | 403 | Email domain not in allowlist | Your email domain is not authorized. |
| `OIDC_INVALID_CLIENT` | 401 | Unknown client_id | Invalid application credentials. |
| `OIDC_INVALID_REDIRECT` | 400 | Redirect URI not registered | Invalid redirect configuration. |
| `OIDC_INVALID_SCOPE` | 400 | Requested unauthorized scopes | Invalid permission request. |
| `OIDC_INVALID_GRANT` | 400 | Authorization code invalid/expired | Please restart the authorization flow. |
| `IDENTITY_CONFLICT` | 409 | Provider account linked to another user | This account is already linked to another user. |
| `OAUTH_STATE_INVALID` | 401 | OAuth state expired or missing | Authentication timed out. Please try again. |
| `SCIM_AUTH_FAILED` | 401 | Invalid SCIM bearer token | Unauthorized. |
| `SCIM_USER_NOT_FOUND` | 404 | User not in this venture | User not found. |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| better-auth | ^1.x | Authentication framework (sessions, accounts) |
| @node-saml/node-saml | ^5.x | SAML 2.0 assertion parsing and validation |
| jose | ^5.x | JWT/JWS/JWE creation, verification, JWKS |
| @simplewebauthn/server | ^10.x | WebAuthn/FIDO2 credential management |
| @upstash/ratelimit | ^1.x | Rate limiting for auth endpoints |
| xml-crypto | ^4.x | XML signature verification for SAML |
| xml2js | ^0.6.x | XML parsing for SAML metadata |
| drizzle-orm | ^0.34.x | Database ORM (PostgreSQL) |

---

## TypeScript Interfaces (Complete)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SSO CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

interface SsoConfig {
  crossVenture: {
    tokenTtl: number;                  // SSO token lifetime in seconds
    validateIpBinding: boolean;        // Enforce IP match on redemption
    validateUserAgent: boolean;        // Enforce UA match on redemption
    cookieDomain: string;              // Cross-subdomain cookie domain
  };
  saml: SamlConfig;
  oidc: OidcProviderConfig;
  jit: JitProvisioningConfig;
  scim: ScimConfig;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OIDC TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface OidcClient {
  id: string;
  ventureId: string;
  clientId: string;
  clientSecretHash: string;
  name: string;
  redirectUris: string[];
  grantTypes: ('authorization_code' | 'refresh_token')[];
  scopes: string[];
  logoUrl?: string;
  tosUrl?: string;
  policyUrl?: string;
  createdAt: Date;
}

interface OidcTokenSet {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope: string;
}

interface OidcProviderConfig {
  issuer: string;
  accessTokenTtl: number;
  idTokenTtl: number;
  authCodeTtl: number;
  supportedScopes: string[];
  supportedGrantTypes: string[];
  requirePkce: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════════

interface LinkedIdentity {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  email?: string;
  profile?: Record<string, unknown>;
  linkedAt: Date;
}

interface IdentityResolution {
  user: User;
  resolution: 'exact' | 'email_linked' | 'provisioned';
  provider: string;
  isNewUser: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VENTURE SESSION
// ═══════════════════════════════════════════════════════════════════════════════

interface VentureSession {
  sessionId: string;
  ventureId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  isImpersonated: boolean;
}

interface AuthorizedVenture {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  role: 'admin' | 'member' | 'billing';
  joinedAt: Date | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCIM TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ScimConfig {
  enabled: boolean;
  bearerToken: string;
  maxResults: number;
  supportedResources: ('Users' | 'Groups')[];
}

interface ScimUser {
  schemas: string[];
  id?: string;
  externalId?: string;
  userName: string;
  name?: { givenName?: string; familyName?: string };
  displayName?: string;
  emails?: { value: string; type: string; primary: boolean }[];
  active?: boolean;
  groups?: { value: string; display: string }[];
  meta?: { resourceType: string; created: string; lastModified: string };
}

interface ScimPatchOp {
  op: 'add' | 'replace' | 'remove';
  path?: string;
  value?: unknown;
}
```

---

## Testing Notes

```powershell
# Run SSO module tests
pnpm test --filter=@mcv/identity -- --grep "sso"

# Test SAML assertion validation
pnpm test --filter=@mcv/identity -- --grep "saml"

# Test cross-venture SSO flow (integration)
pnpm test:integration --filter=@mcv/identity -- --grep "cross-venture"

# Test SCIM endpoints
pnpm test --filter=@mcv/identity -- --grep "scim"
```

### Test Fixtures

```typescript
// test/fixtures/saml-response.ts
export const MOCK_SAML_RESPONSE = Buffer.from(`
  <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    ID="_abc123" InResponseTo="_req456" IssueInstant="2026-02-08T14:00:00Z">
    <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
      <saml:Subject>
        <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">
          alice@enterprise.com
        </saml:NameID>
      </saml:Subject>
      <saml:AttributeStatement>
        <saml:Attribute Name="firstName"><saml:AttributeValue>Alice</saml:AttributeValue></saml:Attribute>
        <saml:Attribute Name="lastName"><saml:AttributeValue>Smith</saml:AttributeValue></saml:Attribute>
      </saml:AttributeStatement>
    </saml:Assertion>
  </samlp:Response>
`).toString('base64');
```

---

*@mcv/identity/sso — Single Sign-On Module*
