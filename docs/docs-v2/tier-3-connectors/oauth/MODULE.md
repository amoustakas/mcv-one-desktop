# @mcv/connectors/oauth — Module Specification

**Module:** `@mcv/connectors/oauth`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Tier:** 3 — Connector  
**Last Updated:** February 8, 2026

---

## Table of Contents

1. [Purpose](#purpose)
2. [Exports](#exports)
3. [Architecture](#architecture)
4. [Token Lifecycle State Machine](#token-lifecycle-state-machine)
5. [Providers Supported](#providers-supported)
6. [Provider-Specific Configuration Guides](#provider-specific-configuration-guides)
7. [Dependencies](#dependencies)
8. [Constants](#constants)
9. [Environment Variables](#environment-variables)
10. [Database Schema](#database-schema)
11. [TypeScript Interfaces](#typescript-interfaces)
12. [Service Implementation](#service-implementation)
13. [Callback Handler](#callback-handler)
14. [Middleware — Token Injection](#middleware--token-injection)
15. [API (tRPC Router)](#api-trpc-router)
16. [Client Hooks (React)](#client-hooks-react)
17. [Client Components (React)](#client-components-react)
18. [OpenID Connect (OIDC) Layer](#openid-connect-oidc-layer)
19. [Code Examples](#code-examples)
20. [Security Considerations](#security-considerations)
21. [Rate Limiting](#rate-limiting)
22. [Performance Considerations](#performance-considerations)
23. [Scheduled Tasks](#scheduled-tasks)
24. [Audit Events](#audit-events)
25. [Error Codes](#error-codes)
26. [Monitoring & Observability](#monitoring--observability)
27. [Testing Strategy](#testing-strategy)
28. [Troubleshooting](#troubleshooting)
29. [Migration Guide](#migration-guide)
30. [Related Modules](#related-modules)
31. [Changelog](#changelog)

---

## Purpose

Provider-agnostic OAuth 2.0 implementation with PKCE support. This module abstracts the full OAuth lifecycle for all third-party integrations in the MCV.ONE ecosystem:

- **Authorization URL generation** with CSRF protection (state tokens) and PKCE challenge
- **Token exchange** — code-for-tokens flow with provider-specific normalization
- **Automatic token refresh** — transparent refresh with 5-minute buffer before expiry
- **Secure token storage** — all secrets stored via `@mcv/secrets` vault integration (Google Secret Manager)
- **Scope management** — per-venture, per-provider configurable scopes
- **Provider user info normalization** — unified `UserInfo` across Google, GitHub, Microsoft, etc.
- **Token revocation** — local + remote revocation with audit trail
- **OpenID Connect** — ID token validation and claims extraction for OIDC-compliant providers
- **Multi-tenancy** — complete venture isolation for configurations, tokens, and state

This module is the **foundation layer** for all third-party OAuth integrations. Modules like `@mcv/connectors/social`, `@mcv/connectors/google`, and `@mcv/connectors/github` delegate OAuth flows to this module.

**This is the single entry point for all OAuth operations across the MCV.ONE platform.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CORE SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

// Primary OAuth service
export {
  oauthService,                // Singleton service instance
  OAuthService,                // Service class (for DI/testing)
} from './server/services/oauth.service';

// Authorization flow
export {
  getAuthorizationUrl,         // Generate provider authorization URL
  exchangeCodeForTokens,       // Exchange auth code for tokens
  handleOAuthCallback,         // Process OAuth callback (state + code)
} from './server/services/authorization.service';

// Token management
export {
  getAccessToken,              // Get valid token (auto-refreshes)
  refreshAccessToken,          // Force token refresh
  revokeToken,                 // Revoke token (local + remote)
  getTokenStatus,              // Check token status without fetching
  getTokensByProvider,         // List tokens for a provider
  getTokensByUser,             // List tokens for a user
} from './server/services/token.service';

// Provider configuration
export {
  configureProvider,           // Set up OAuth provider for venture
  getProviderConfig,           // Get provider configuration
  removeProvider,              // Remove provider (revokes all tokens)
  listProviders,               // List configured providers for venture
  testProviderConfig,          // Validate provider configuration
} from './server/services/provider-config.service';

// ═══════════════════════════════════════════════════════════════════════════════
// OIDC (OpenID Connect)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  validateIdToken,             // Validate and decode JWT ID token
  getOidcDiscovery,            // Fetch .well-known/openid-configuration
  extractClaims,               // Extract standard OIDC claims
  getJwks,                     // Fetch provider JWKS for verification
} from './server/services/oidc.service';

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  withOAuthToken,              // Middleware: inject valid access token into context
  requireOAuthToken,           // Middleware: require valid token or 401
  oauthRateLimiter,            // Middleware: rate limit OAuth operations
} from './server/middleware';

// ═══════════════════════════════════════════════════════════════════════════════
// CALLBACK HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export {
  oauthCallbackHandler,        // Universal callback route handler
  createCallbackRouter,        // Create Express/Next.js callback router
} from './server/handlers/callback.handler';

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULED TASKS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  cleanupExpiredStates,        // Remove expired state tokens
  refreshExpiringTokens,       // Proactively refresh tokens near expiry
  pruneRevokedTokens,          // Remove old revoked token records
  syncProviderHealth,          // Check provider endpoint availability
} from './server/tasks';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useOAuthConnect } from './client/hooks/use-oauth-connect';
export { useOAuthCallback } from './client/hooks/use-oauth-callback';
export { useOAuthTokens } from './client/hooks/use-oauth-tokens';
export { useOAuthProviders } from './client/hooks/use-oauth-providers';
export { useOAuthStatus } from './client/hooks/use-oauth-status';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { OAuthConnectButton } from './client/components/oauth-connect-button';
export { OAuthProviderGrid } from './client/components/oauth-provider-grid';
export { OAuthTokenManager } from './client/components/oauth-token-manager';
export { OAuthCallbackPage } from './client/components/oauth-callback-page';
export { OAuthConfigPanel } from './client/components/oauth-config-panel';
export { ProviderStatusBadge } from './client/components/provider-status-badge';

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export {
  oauthStates,                 // State table schema
  oauthConfigurations,         // Provider config table schema
  oauthTokens,                 // Token storage table schema
  oauthTokenUsage,             // Usage audit table schema
  oauthStatesRelations,        // State table relations
  oauthConfigurationsRelations,// Config table relations
  oauthTokensRelations,        // Token table relations
} from './schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  PROVIDER_DEFAULTS,           // Default endpoints per provider
  OAUTH_PROVIDERS,             // Supported provider list
  STATE_TTL_SECONDS,           // State token lifetime (600s)
  TOKEN_REFRESH_BUFFER_MS,     // Pre-expiry refresh window (300000ms)
  MAX_REFRESH_ATTEMPTS,        // Max consecutive refresh retries
  PKCE_VERIFIER_LENGTH,        // Code verifier byte length (32)
  RATE_LIMIT_DEFAULTS,         // Default rate limits per operation
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Core types
  OAuthProvider,
  OAuthConfig,
  OAuthTokenRecord,
  OAuthStateRecord,

  // Flow types
  AuthorizationUrlOptions,
  AuthorizationUrlResult,
  TokenExchangeResult,
  TokenRefreshResult,
  CallbackParams,

  // User info
  UserInfo,
  NormalizedUserInfo,

  // OIDC types
  OidcDiscovery,
  OidcClaims,
  IdTokenPayload,
  JwksResponse,

  // Provider config
  ProviderDefaults,
  ProviderEndpoints,
  ProviderCapabilities,

  // Error types
  OAuthError,
  OAuthErrorCode,

  // Event types
  OAuthTokenEvent,
  OAuthAuditEvent,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/connectors/oauth                                   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │                         OAuthService                                     │     │
│  │                                                                          │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │     │
│  │  │ Authorization│  │   Token      │  │   Token      │  │  Token     │  │     │
│  │  │ URL Builder  │  │   Exchange   │  │   Refresh    │  │  Revoke    │  │     │
│  │  │              │  │              │  │              │  │            │  │     │
│  │  │ • PKCE gen   │  │ • Code→Token │  │ • Auto check │  │ • Remote   │  │     │
│  │  │ • State gen  │  │ • State val  │  │ • Rotate     │  │ • Local    │  │     │
│  │  │ • Scope mgmt │  │ • User info  │  │ • Fallback   │  │ • Vault    │  │     │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │     │
│  │         │                 │                  │                │         │     │
│  │  ┌──────┴─────────────────┴──────────────────┴────────────────┴──────┐  │     │
│  │  │                    Provider Config Layer                           │  │     │
│  │  │                                                                    │  │     │
│  │  │  google │ github │ microsoft │ slack │ twitter │ linkedin │ meta  │  │     │
│  │  │  stripe │ salesforce │ hubspot │ quickbooks │ xero │ custom       │  │     │
│  │  └────────────────────────────────────────────────────────────────────┘  │     │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
│  ┌─────────────────────┐  ┌──────────────────────┐  ┌───────────────────────┐   │
│  │  @mcv/secrets        │  │  @mcv/db (Drizzle)   │  │  @mcv/audit           │   │
│  │  (Secret Manager)    │  │  (PostgreSQL)         │  │  (Event Logging)      │   │
│  │                      │  │                       │  │                        │   │
│  │  • Store tokens      │  │  • oauth_configs      │  │  • token_exchanged    │   │
│  │  • Retrieve tokens   │  │  • oauth_states       │  │  • token_refreshed    │   │
│  │  • Delete tokens     │  │  • oauth_tokens       │  │  • token_revoked      │   │
│  │  • Rotate secrets    │  │  • oauth_token_usage  │  │  • provider_configured│   │
│  └─────────────────────┘  └──────────────────────┘  └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            │                           │                           │
   ┌────────┴────────┐      ┌──────────┴──────────┐     ┌─────────┴─────────┐
   │  OAuth Provider  │      │  OAuth Provider      │     │  OAuth Provider   │
   │  (Google, GitHub)│      │  (Twitter, LinkedIn)  │     │  (Custom OIDC)    │
   │                  │      │                       │     │                   │
   │  /authorize      │      │  /authorize           │     │  /authorize       │
   │  /token          │      │  /token               │     │  /token           │
   │  /userinfo       │      │  /userinfo            │     │  /userinfo        │
   │  /revoke         │      │  /revoke              │     │  /revoke          │
   └──────────────────┘      └───────────────────────┘     └───────────────────┘
```

### Request Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                          FULL OAUTH AUTHORIZATION CODE FLOW                           │
│                                                                                       │
│  ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌────────────┐ │
│  │  Client  │     │  MCV.ONE │     │  Vault   │     │ Provider │     │  Database  │ │
│  │  (React) │     │  Server  │     │ (Secrets)│     │ (Google) │     │ (Postgres) │ │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └─────┬──────┘ │
│       │                │                │                │                  │         │
│       │  1. Connect    │                │                │                  │         │
│       │────────────────▶                │                │                  │         │
│       │                │                │                │                  │         │
│       │                │  2. Generate state + PKCE       │                  │         │
│       │                │─────────────────────────────────────────────────────▶        │
│       │                │                │                │   3. Store state │         │
│       │                │                │                │                  │         │
│       │  4. Auth URL   │                │                │                  │         │
│       │◀────────────────                │                │                  │         │
│       │                │                │                │                  │         │
│       │  5. Redirect to provider        │                │                  │         │
│       │─────────────────────────────────────────────────▶│                  │         │
│       │                │                │                │                  │         │
│       │  6. User logs in & consents     │                │                  │         │
│       │◀─────────────────────────────────────────────────│                  │         │
│       │                │                │                │                  │         │
│       │  7. Callback with code + state  │                │                  │         │
│       │────────────────▶                │                │                  │         │
│       │                │                │                │                  │         │
│       │                │  8. Validate state              │                  │         │
│       │                │─────────────────────────────────────────────────────▶        │
│       │                │                │                │  9. Fetch + del  │         │
│       │                │◀────────────────────────────────────────────────────         │
│       │                │                │                │                  │         │
│       │                │  10. Get client secret          │                  │         │
│       │                │────────────────▶                │                  │         │
│       │                │◀────────────────                │                  │         │
│       │                │                │                │                  │         │
│       │                │  11. Exchange code + PKCE verifier                 │         │
│       │                │─────────────────────────────────▶                  │         │
│       │                │◀─────────────────────────────────                  │         │
│       │                │  12. access_token + refresh_token                  │         │
│       │                │                │                │                  │         │
│       │                │  13. Store tokens in vault      │                  │         │
│       │                │────────────────▶                │                  │         │
│       │                │◀────────────────                │                  │         │
│       │                │                │                │                  │         │
│       │                │  14. Fetch user info            │                  │         │
│       │                │─────────────────────────────────▶                  │         │
│       │                │◀─────────────────────────────────                  │         │
│       │                │                │                │                  │         │
│       │                │  15. Store token record + audit │                  │         │
│       │                │─────────────────────────────────────────────────────▶        │
│       │                │                │                │                  │         │
│       │  16. TokenExchangeResult        │                │                  │         │
│       │◀────────────────                │                │                  │         │
│       │                │                │                │                  │         │
│  └────┴─────┘     └────┴─────┘     └────┴─────┘     └────┴─────┘     └─────┴──────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Token Refresh Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       AUTOMATIC TOKEN REFRESH FLOW                            │
│                                                                               │
│  ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐             │
│  │  Caller  │     │  OAuth   │     │  Vault   │     │ Provider │             │
│  │ (module) │     │  Service │     │ (Secrets)│     │          │             │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘             │
│       │                │                │                │                    │
│       │  getAccessToken│                │                │                    │
│       │────────────────▶                │                │                    │
│       │                │                │                │                    │
│       │                │  Check expiry  │                │                    │
│       │                │  (< 5min left?)│                │                    │
│       │                │                │                │                    │
│       │           ┌────┴────┐           │                │                    │
│       │           │ Expired │           │                │                    │
│       │           │ or near │           │                │                    │
│       │           │ expiry? │           │                │                    │
│       │           └────┬────┘           │                │                    │
│       │                │                │                │                    │
│       │         ┌──────┴──────┐         │                │                    │
│       │         │             │         │                │                    │
│       │        YES           NO         │                │                    │
│       │         │             │         │                │                    │
│       │         │  Get refresh│         │                │                    │
│       │         │  token      │         │                │                    │
│       │         │─────────────▶         │                │                    │
│       │         │◀─────────────         │                │                    │
│       │         │             │         │                │                    │
│       │         │  Refresh    │         │                │                    │
│       │         │─────────────────────────────────────────▶                   │
│       │         │◀─────────────────────────────────────────                   │
│       │         │             │         │                │                    │
│       │         │  Rotate vault secrets │                │                    │
│       │         │─────────────▶         │                │                    │
│       │         │  (store new, delete old)               │                    │
│       │         │◀─────────────         │                │                    │
│       │         │             │         │                │                    │
│       │         │  Update DB  │  Get access token        │                    │
│       │         │             │─────────▶                │                    │
│       │         │             │◀─────────                │                    │
│       │         │             │         │                │                    │
│       │  access_token        │         │                │                    │
│       │◀────────────────────────────────                 │                    │
│       │                │                │                │                    │
│  └────┴─────┘     └────┴─────┘     └────┴─────┘     └────┴─────┘             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Token Lifecycle State Machine

```
                    ┌──────────────────────────────────────────────────────┐
                    │              TOKEN STATE MACHINE                      │
                    │                                                       │
                    │         ┌───────────────┐                            │
                    │         │   (created)    │                            │
                    │         └───────┬────────┘                            │
                    │                 │                                     │
                    │                 │ exchangeCodeForTokens()             │
                    │                 ▼                                     │
                    │         ┌───────────────┐                            │
                    │    ┌────│    ACTIVE      │◀───────────────┐          │
                    │    │    │               │                 │          │
                    │    │    │ • Valid access │                 │          │
                    │    │    │ • Auto-refresh │                 │          │
                    │    │    └───┬───────┬───┘                 │          │
                    │    │        │       │                     │          │
                    │    │  expires│      │ refreshAccessToken()│          │
                    │    │  naturally     │                     │          │
                    │    │        │       ▼                     │          │
                    │    │        │ ┌───────────────┐           │          │
                    │    │        │ │  REFRESHING   │───────────┘          │
                    │    │        │ │               │  (success)           │
                    │    │        │ │ • Temp status │                      │
                    │    │        │ │ • Lock held   │───────┐              │
                    │    │        │ └───────────────┘       │              │
                    │    │        │                   (failure)             │
                    │    │        ▼                         │              │
                    │    │  ┌───────────────┐               │              │
                    │    │  │   EXPIRED     │◀──────────────┘              │
                    │    │  │               │                              │
                    │    │  │ • No refresh  │                              │
                    │    │  │ • Re-auth req │                              │
                    │    │  └───────────────┘                              │
                    │    │                                                  │
                    │    │ revokeToken()                                    │
                    │    ▼                                                  │
                    │  ┌───────────────┐                                   │
                    │  │   REVOKED     │                                   │
                    │  │               │                                   │
                    │  │ • Remote call │                                   │
                    │  │ • Vault purge │                                   │
                    │  │ • Audit logged│                                   │
                    │  │ • Terminal    │                                   │
                    │  └───────────────┘                                   │
                    │                                                       │
                    └──────────────────────────────────────────────────────┘

    Transitions:
    ─────────────────────────────────────────────────────────────────
    From          To           Trigger                   Side Effects
    ─────────────────────────────────────────────────────────────────
    (new)         ACTIVE       exchangeCodeForTokens     Vault store, audit log
    ACTIVE        REFRESHING   refreshAccessToken        DB status update
    REFRESHING    ACTIVE       Refresh success           Vault rotate, DB update
    REFRESHING    EXPIRED      Refresh failure           DB status update
    ACTIVE        EXPIRED      Token expires naturally   No refresh token available
    ACTIVE        REVOKED      revokeToken               Remote revoke, vault purge
    EXPIRED       REVOKED      revokeToken               Vault purge (cleanup)
    ─────────────────────────────────────────────────────────────────
```

---

## Providers Supported

| Provider | OAuth Version | PKCE | Refresh | User Info | Revoke | OIDC | Features |
|----------|---------------|------|---------|-----------|--------|------|----------|
| **Google** | OAuth 2.0 | ✅ | ✅ | ✅ | ✅ | ✅ | Workspace, Drive, Calendar, Gmail |
| **GitHub** | OAuth 2.0 | ❌ | ❌ | ✅ | ❌ | ❌ | Repos, Organizations, Actions |
| **Microsoft** | OAuth 2.0 | ✅ | ✅ | ✅ | ❌ | ✅ | Entra ID, O365, Teams |
| **Slack** | OAuth 2.0 | ❌ | ❌ | ✅ | ✅ | ❌ | Workspace, Messaging |
| **Twitter/X** | OAuth 2.0 | ✅ | ✅ | ✅ | ✅ | ❌ | User context, Tweets, DMs |
| **LinkedIn** | OAuth 2.0 | ❌ | ✅ | ✅ | ❌ | ✅ | Profile, Connections, Posts |
| **Meta** | OAuth 2.0 | ❌ | ✅ | ✅ | ❌ | ❌ | Facebook, Instagram |
| **Stripe** | OAuth 2.0 | ❌ | ❌ | ❌ | ✅ | ❌ | Connect accounts |
| **Salesforce** | OAuth 2.0 | ✅ | ✅ | ✅ | ✅ | ✅ | CRM, Platform APIs |
| **HubSpot** | OAuth 2.0 | ❌ | ✅ | ✅ | ❌ | ❌ | CRM, Marketing, Sales |
| **QuickBooks** | OAuth 2.0 | ❌ | ✅ | ✅ | ✅ | ✅ | Accounting, Invoicing |
| **Xero** | OAuth 2.0 | ✅ | ✅ | ✅ | ❌ | ✅ | Accounting, Payroll |
| **Custom** | OAuth 2.0 | Config | Config | Config | Config | Config | Enterprise OIDC/SAML bridge |

### Provider Capability Matrix — Detailed

```
Provider        Auth Endpoint                                     Token Endpoint
──────────────  ───────────────────────────────────────────────── ──────────────────────────────────────────
Google          accounts.google.com/o/oauth2/v2/auth              oauth2.googleapis.com/token
GitHub          github.com/login/oauth/authorize                  github.com/login/oauth/access_token
Microsoft       login.microsoftonline.com/common/oauth2/v2.0/…   login.microsoftonline.com/common/oauth2/…
Slack           slack.com/oauth/v2/authorize                      slack.com/api/oauth.v2.access
Twitter/X       twitter.com/i/oauth2/authorize                    api.twitter.com/2/oauth2/token
LinkedIn        www.linkedin.com/oauth/v2/authorization           www.linkedin.com/oauth/v2/accessToken
Meta            www.facebook.com/v18.0/dialog/oauth               graph.facebook.com/v18.0/oauth/access_token
Stripe          connect.stripe.com/oauth/authorize                connect.stripe.com/oauth/token
Salesforce      login.salesforce.com/services/oauth2/authorize    login.salesforce.com/services/oauth2/token
HubSpot         app.hubspot.com/oauth/authorize                   api.hubapi.com/oauth/v1/token
QuickBooks      appcenter.intuit.com/connect/oauth2               oauth.platform.intuit.com/oauth2/v1/…
Xero            login.xero.com/identity/connect/authorize         identity.xero.com/connect/token
```

---

## Provider-Specific Configuration Guides

### Google

Google OAuth supports the broadest scope range in MCV.ONE. Key considerations:

- **PKCE**: Required. Google enforces S256 challenge method.
- **Refresh tokens**: Set `access_type=offline` and `prompt=consent` to receive a refresh token. Google only issues a refresh token on the **first** authorization or when `prompt=consent` is explicitly set.
- **Incremental authorization**: Google supports requesting additional scopes without revoking existing tokens. Pass `include_granted_scopes=true` for incremental consent.
- **Workspace domains**: For Google Workspace customers, restrict to domain with `hd=example.com` parameter.
- **Service accounts**: For server-to-server flows (no user), use `client_credentials` grant with a service account JSON key. This bypasses the OAuth module and goes through `@mcv/connectors/google` directly.

```typescript
// Google-specific configuration
await trpc.oauth.configureProvider.mutate({
  provider: 'google',
  clientId: 'xxx.apps.googleusercontent.com',
  clientSecret: 'GOCSPX-...',
  redirectUri: 'https://app.mcv.one/oauth/callback/google',
  defaultScopes: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive.file',
  ],
});
```

### GitHub

GitHub has notable differences from standard OAuth 2.0:

- **PKCE**: Not supported. GitHub does not implement PKCE.
- **Refresh tokens**: Not available. Access tokens do not expire unless explicitly revoked or the app authorization is revoked by the user. For GitHub Apps (not OAuth Apps), refresh tokens are available.
- **Token format**: GitHub returns `access_token` as a form-encoded body (not JSON) unless `Accept: application/json` header is set. The module handles this automatically.
- **Scopes**: GitHub uses its own scope format (`repo`, `read:user`, `admin:org`). Scopes are space-separated in the URL but comma-separated in the token response.
- **Organization access**: Users may need to explicitly grant access per organization via GitHub's interface.

```typescript
// GitHub-specific configuration
await trpc.oauth.configureProvider.mutate({
  provider: 'github',
  clientId: 'Iv1.abcdef123456',
  clientSecret: 'ghp_...',
  redirectUri: 'https://app.mcv.one/oauth/callback/github',
  defaultScopes: ['read:user', 'user:email', 'repo'],
});
```

### Microsoft (Entra ID)

Microsoft uses Azure AD (now Entra ID) for OAuth:

- **PKCE**: Supported and recommended.
- **Tenant selection**: The `common` endpoint allows any Microsoft account. For single-tenant apps, replace `common` with your tenant ID.
- **v2.0 endpoint**: Always use the v2.0 endpoint for OAuth 2.0 + OIDC.
- **offline_access**: Must explicitly request the `offline_access` scope to receive refresh tokens.
- **Admin consent**: Some scopes (e.g., `Directory.Read.All`) require admin consent for the entire tenant. Configure via Azure portal.

```typescript
// Microsoft-specific configuration (multi-tenant)
await trpc.oauth.configureProvider.mutate({
  provider: 'microsoft',
  clientId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  clientSecret: '~secret...',
  redirectUri: 'https://app.mcv.one/oauth/callback/microsoft',
  defaultScopes: ['openid', 'email', 'profile', 'offline_access', 'User.Read'],
  // Override for single-tenant:
  // authorizationUrl: 'https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize',
  // tokenUrl: 'https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token',
});
```

### Twitter/X

Twitter's OAuth 2.0 (with PKCE) is separate from OAuth 1.0a:

- **PKCE**: Required. Twitter enforces PKCE for all OAuth 2.0 flows.
- **Confidential vs Public**: MCV.ONE uses confidential client type (server-side). Public clients use different endpoints.
- **Scopes**: Twitter uses dot-notation (`tweet.read`, `tweet.write`, `users.read`, `offline.access`).
- **offline.access**: Required for refresh tokens. Without it, tokens expire in 2 hours.
- **Rate limits**: Twitter has aggressive rate limits. The module tracks usage to avoid hitting them.

```typescript
// Twitter/X configuration
await trpc.oauth.configureProvider.mutate({
  provider: 'twitter',
  clientId: 'xxxxxxxxxxxxx',
  clientSecret: 'yyy...',
  redirectUri: 'https://app.mcv.one/oauth/callback/twitter',
  defaultScopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
});
```

### Custom / Enterprise OIDC

For enterprise SSO or custom OAuth providers:

```typescript
await trpc.oauth.configureProvider.mutate({
  provider: 'custom',
  clientId: 'enterprise-app-id',
  clientSecret: 'enterprise-secret',
  redirectUri: 'https://app.mcv.one/oauth/callback/custom',
  authorizationUrl: 'https://sso.enterprise.com/oauth2/authorize',
  tokenUrl: 'https://sso.enterprise.com/oauth2/token',
  defaultScopes: ['openid', 'profile', 'email'],
  // Custom settings for provider quirks:
  // customSettings: { userInfoUrl: 'https://sso.enterprise.com/oauth2/userinfo' },
});
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.x` | Database ORM |
| `@mcv/db` | `workspace:*` | Database connection & query builder |
| `@mcv/secrets` | `workspace:*` | Google Secret Manager vault for token storage |
| `@mcv/audit` | `workspace:*` | Audit trail logging |
| `@mcv/events` | `workspace:*` | Domain event publishing |
| `@mcv/rate-limit` | `workspace:*` | Token bucket rate limiter |
| `zod` | `^3.22.x` | Input validation |
| `jose` | `^5.x` | JWT/JWS/JWKS for OIDC ID token verification |
| `crypto` | `node:crypto` | PKCE code verifier/challenge generation |

---

## Constants

```typescript
// @mcv/connectors/oauth/constants.ts

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER LIST
// ═══════════════════════════════════════════════════════════════════════════════

export const OAUTH_PROVIDERS = [
  'google', 'github', 'microsoft', 'slack',
  'twitter', 'linkedin', 'meta', 'stripe',
  'salesforce', 'hubspot', 'quickbooks', 'xero', 'custom',
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TIMING DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════════

/** State token lifetime: 10 minutes */
export const STATE_TTL_SECONDS = 600;

/** Pre-expiry refresh window: 5 minutes */
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/** Max consecutive refresh retries before marking expired */
export const MAX_REFRESH_ATTEMPTS = 3;

/** Expired state cleanup interval: 1 hour */
export const STATE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/** Proactive token refresh check interval: 15 minutes */
export const TOKEN_REFRESH_CHECK_INTERVAL_MS = 15 * 60 * 1000;

/** Revoked token pruning age: 90 days */
export const REVOKED_TOKEN_PRUNE_AGE_DAYS = 90;

// ═══════════════════════════════════════════════════════════════════════════════
// PKCE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Code verifier byte length (generates 43-char base64url string) */
export const PKCE_VERIFIER_LENGTH = 32;

/** Code challenge method (always S256) */
export const PKCE_CHALLENGE_METHOD = 'S256';

/** State token byte length */
export const STATE_TOKEN_LENGTH = 32;

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMIT DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════════

export const RATE_LIMIT_DEFAULTS = {
  /** Max authorization URL generations per minute per venture */
  authorizationUrlPerMinute: 30,

  /** Max token exchanges per minute per venture */
  tokenExchangePerMinute: 10,

  /** Max token refreshes per hour per provider per venture */
  tokenRefreshPerHour: 60,

  /** Max token revocations per minute per venture */
  tokenRevokePerMinute: 20,

  /** Max configuration changes per hour per venture */
  configChangePerHour: 10,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════════

export const PROVIDER_DEFAULTS: Record<string, ProviderDefaults> = {
  google: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    oidcDiscoveryUrl: 'https://accounts.google.com/.well-known/openid-configuration',
    defaultScopes: ['openid', 'email', 'profile'],
    pkceRequired: true,
    supportsRefresh: true,
    supportsRevoke: true,
    supportsOidc: true,
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
  },
  github: {
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    defaultScopes: ['read:user', 'user:email'],
    pkceRequired: false,
    supportsRefresh: false,
    supportsRevoke: false,
    supportsOidc: false,
    tokenResponseFormat: 'form',  // GitHub returns form-encoded by default
  },
  microsoft: {
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    oidcDiscoveryUrl: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
    defaultScopes: ['openid', 'email', 'profile', 'offline_access'],
    pkceRequired: true,
    supportsRefresh: true,
    supportsRevoke: false,
    supportsOidc: true,
  },
  slack: {
    authorizationUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    userInfoUrl: 'https://slack.com/api/users.identity',
    revokeUrl: 'https://slack.com/api/auth.revoke',
    defaultScopes: ['identity.basic', 'identity.email'],
    pkceRequired: false,
    supportsRefresh: false,
    supportsRevoke: true,
    supportsOidc: false,
  },
  twitter: {
    authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userInfoUrl: 'https://api.twitter.com/2/users/me',
    revokeUrl: 'https://api.twitter.com/2/oauth2/revoke',
    defaultScopes: ['tweet.read', 'users.read', 'offline.access'],
    pkceRequired: true,
    supportsRefresh: true,
    supportsRevoke: true,
    supportsOidc: false,
    extraAuthParams: {},
  },
  linkedin: {
    authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    oidcDiscoveryUrl: 'https://www.linkedin.com/oauth/.well-known/openid-configuration',
    defaultScopes: ['openid', 'profile', 'email'],
    pkceRequired: false,
    supportsRefresh: true,
    supportsRevoke: false,
    supportsOidc: true,
  },
  meta: {
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/v18.0/me',
    defaultScopes: ['public_profile', 'email'],
    pkceRequired: false,
    supportsRefresh: true,
    supportsRevoke: false,
    supportsOidc: false,
    extraAuthParams: { fields: 'id,name,email,picture' },
  },
  stripe: {
    authorizationUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    revokeUrl: 'https://connect.stripe.com/oauth/deauthorize',
    defaultScopes: ['read_write'],
    pkceRequired: false,
    supportsRefresh: false,
    supportsRevoke: true,
    supportsOidc: false,
  },
  salesforce: {
    authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    userInfoUrl: 'https://login.salesforce.com/services/oauth2/userinfo',
    revokeUrl: 'https://login.salesforce.com/services/oauth2/revoke',
    oidcDiscoveryUrl: 'https://login.salesforce.com/.well-known/openid-configuration',
    defaultScopes: ['openid', 'api', 'refresh_token'],
    pkceRequired: true,
    supportsRefresh: true,
    supportsRevoke: true,
    supportsOidc: true,
  },
  hubspot: {
    authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    userInfoUrl: 'https://api.hubapi.com/oauth/v1/access-tokens',
    defaultScopes: ['crm.objects.contacts.read'],
    pkceRequired: false,
    supportsRefresh: true,
    supportsRevoke: false,
    supportsOidc: false,
  },
  quickbooks: {
    authorizationUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    userInfoUrl: 'https://accounts.platform.intuit.com/v1/openid_connect/userinfo',
    revokeUrl: 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke',
    oidcDiscoveryUrl: 'https://developer.api.intuit.com/.well-known/openid_configuration',
    defaultScopes: ['com.intuit.quickbooks.accounting', 'openid', 'profile', 'email'],
    pkceRequired: false,
    supportsRefresh: true,
    supportsRevoke: true,
    supportsOidc: true,
  },
  xero: {
    authorizationUrl: 'https://login.xero.com/identity/connect/authorize',
    tokenUrl: 'https://identity.xero.com/connect/token',
    userInfoUrl: 'https://api.xero.com/connections',
    revokeUrl: 'https://identity.xero.com/connect/revocation',
    oidcDiscoveryUrl: 'https://identity.xero.com/.well-known/openid-configuration',
    defaultScopes: ['openid', 'profile', 'email', 'accounting.transactions'],
    pkceRequired: true,
    supportsRefresh: true,
    supportsRevoke: false,
    supportsOidc: true,
  },
};
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OAUTH_STATE_TTL_SECONDS` | No | `600` | State token expiration (10 min) |
| `OAUTH_TOKEN_REFRESH_BUFFER_MS` | No | `300000` | Pre-expiry refresh buffer (5 min) |
| `OAUTH_MAX_REFRESH_ATTEMPTS` | No | `3` | Max consecutive refresh attempts |
| `OAUTH_STATE_CLEANUP_INTERVAL_MS` | No | `3600000` | Expired state cleanup interval |
| `OAUTH_CALLBACK_BASE_URL` | Yes | — | Base URL for OAuth callbacks (e.g., `https://api.mcv.one`) |
| `OAUTH_ENCRYPTION_KEY` | Yes | — | AES-256 key for token encryption at rest |
| `GCP_SECRET_MANAGER_PROJECT` | Yes | — | GCP project for Secret Manager vault |
| `OAUTH_OIDC_CLOCK_TOLERANCE_SECONDS` | No | `30` | Clock skew tolerance for OIDC token validation |
| `OAUTH_PROACTIVE_REFRESH_ENABLED` | No | `true` | Enable proactive token refresh scheduled task |
| `OAUTH_MAX_TOKENS_PER_USER_PER_PROVIDER` | No | `5` | Maximum active tokens per user per provider |

---

## Database Schema

### Actual Schema (from `packages/db/src/schema/oauth-states.ts`)

The core `oauth_states` table tracks in-flight authorization flows:

```typescript
// packages/db/src/schema/oauth-states.ts (ACTUAL)
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ventures } from './ventures';

export const oauthStates = pgTable('oauth_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  state: text('state').unique().notNull(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  provider: text('provider').notNull(),
  redirectUri: text('redirect_uri').notNull(),
  codeVerifier: text('code_verifier'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const oauthStatesRelations = relations(oauthStates, ({ one }) => ({
  venture: one(ventures, {
    fields: [oauthStates.ventureId],
    references: [ventures.id],
  }),
}));
```

### Extended Schema (Design)

The full OAuth module requires additional tables for configuration, tokens, and usage tracking:

```typescript
// @mcv/connectors/oauth/schema.ts (DESIGN — extends actual schema)

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export const oauthProviderEnum = pgEnum('oauth_provider', [
  'google', 'github', 'microsoft', 'slack', 'twitter', 'linkedin',
  'meta', 'stripe', 'salesforce', 'hubspot', 'quickbooks', 'xero', 'custom'
]);

export const oauthGrantTypeEnum = pgEnum('oauth_grant_type', [
  'authorization_code', 'client_credentials', 'refresh_token', 'device_code'
]);

export const oauthTokenStatusEnum = pgEnum('oauth_token_status', [
  'active', 'expired', 'revoked', 'refreshing'
]);

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH CONFIGURATIONS (per venture per provider)
// ═══════════════════════════════════════════════════════════════════════════════

export const oauthConfigurations = pgTable('oauth_configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  provider: oauthProviderEnum('provider').notNull(),

  // OAuth endpoints (overridable for custom providers)
  authorizationUrl: text('authorization_url'),
  tokenUrl: text('token_url'),
  userInfoUrl: text('user_info_url'),
  revokeUrl: text('revoke_url'),

  // OIDC endpoints (auto-discovered for standard providers)
  oidcDiscoveryUrl: text('oidc_discovery_url'),
  jwksUri: text('jwks_uri'),

  // Client credentials (secret stored in vault, referenced here)
  clientId: text('client_id'),
  secretResourceName: text('secret_resource_name'),

  // Default scopes
  defaultScopes: jsonb('default_scopes').$type<string[]>().default([]),

  // Redirect URIs
  redirectUri: text('redirect_uri'),
  allowedRedirectUris: jsonb('allowed_redirect_uris').$type<string[]>().default([]),

  // PKCE
  pkceRequired: boolean('pkce_required').default(true),

  // Token TTLs
  accessTokenTtl: integer('access_token_ttl'),
  refreshTokenTtl: integer('refresh_token_ttl'),

  // Custom provider settings
  customSettings: jsonb('custom_settings').$type<Record<string, unknown>>(),

  isEnabled: boolean('is_enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureProviderUnique: uniqueIndex('oauth_config_venture_provider_idx')
    .on(table.ventureId, table.provider),
}));

export const oauthConfigurationsRelations = relations(oauthConfigurations, ({ one }) => ({
  venture: one(ventures, {
    fields: [oauthConfigurations.ventureId],
    references: [ventures.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH TOKENS (access + refresh tokens per user per provider)
// ═══════════════════════════════════════════════════════════════════════════════

export const oauthTokens = pgTable('oauth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  provider: oauthProviderEnum('provider').notNull(),

  // Ownership
  userId: uuid('user_id').references(() => users.id),
  integrationId: uuid('integration_id'),

  // Token values (encrypted in vault, referenced here)
  accessTokenResourceName: text('access_token_resource_name').notNull(),
  refreshTokenResourceName: text('refresh_token_resource_name'),
  idTokenResourceName: text('id_token_resource_name'),

  // Metadata
  tokenType: text('token_type').default('Bearer'),
  status: oauthTokenStatusEnum('status').notNull().default('active'),
  scopes: jsonb('scopes').$type<string[]>().notNull(),

  // Provider account info
  providerAccountId: text('provider_account_id'),
  providerEmail: text('provider_email'),
  providerDisplayName: text('provider_display_name'),
  providerAvatarUrl: text('provider_avatar_url'),

  // Expiration
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),

  // Refresh tracking
  lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
  refreshCount: integer('refresh_count').default(0),
  consecutiveRefreshFailures: integer('consecutive_refresh_failures').default(0),

  // Revocation
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokedBy: uuid('revoked_by'),
  revokeReason: text('revoke_reason'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureProviderIdx: index('oauth_tokens_venture_provider_idx')
    .on(table.ventureId, table.provider),
  userProviderIdx: index('oauth_tokens_user_provider_idx')
    .on(table.userId, table.provider),
  statusIdx: index('oauth_tokens_status_idx')
    .on(table.status),
  expiresAtIdx: index('oauth_tokens_expires_at_idx')
    .on(table.accessTokenExpiresAt),
}));

export const oauthTokensRelations = relations(oauthTokens, ({ one, many }) => ({
  venture: one(ventures, {
    fields: [oauthTokens.ventureId],
    references: [ventures.id],
  }),
  user: one(users, {
    fields: [oauthTokens.userId],
    references: [users.id],
  }),
  usageLogs: many(oauthTokenUsage),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH TOKEN USAGE (audit trail for token operations)
// ═══════════════════════════════════════════════════════════════════════════════

export const oauthTokenUsage = pgTable('oauth_token_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenId: uuid('token_id').notNull().references(() => oauthTokens.id, { onDelete: 'cascade' }),
  operation: text('operation').notNull(),  // 'api_call', 'refresh', 'revoke', 'fetch'
  endpoint: text('endpoint'),
  statusCode: integer('status_code'),
  success: boolean('success').notNull(),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  latencyMs: integer('latency_ms'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tokenIdIdx: index('oauth_token_usage_token_id_idx').on(table.tokenId),
  createdAtIdx: index('oauth_token_usage_created_at_idx').on(table.createdAt),
  operationIdx: index('oauth_token_usage_operation_idx').on(table.operation),
}));

export const oauthTokenUsageRelations = relations(oauthTokenUsage, ({ one }) => ({
  token: one(oauthTokens, {
    fields: [oauthTokenUsage.tokenId],
    references: [oauthTokens.id],
  }),
}));
```

### Entity Relationship Diagram

```
┌──────────────────────┐       ┌──────────────────────┐
│   ventures           │       │   users              │
│   ──────────         │       │   ─────              │
│   id (PK)            │       │   id (PK)            │
└──────────┬───────────┘       └──────────┬───────────┘
           │                              │
    ┌──────┼───────┐               ┌──────┘
    │      │       │               │
    ▼      ▼       ▼               ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ oauth_   │  │ oauth_   │  │ oauth_   │
│ configs  │  │ states   │  │ tokens   │
│          │  │          │  │          │
│ PK: id   │  │ PK: id   │  │ PK: id   │
│ FK: vent │  │ FK: vent │  │ FK: vent │
│ UK: vent │  │ UK: state│  │ FK: user │
│   +prov  │  │          │  │ IX: vent │
│          │  │          │  │   +prov  │
│          │  │          │  │ IX: user │
│          │  │          │  │   +prov  │
│          │  │          │  │ IX: stat │
│          │  │          │  │ IX: exp  │
└──────────┘  └──────────┘  └────┬─────┘
                                 │
                                 │ 1:N
                                 ▼
                            ┌──────────┐
                            │ oauth_   │
                            │ token_   │
                            │ usage    │
                            │          │
                            │ FK: token│
                            │ IX: token│
                            │ IX: date │
                            │ IX: op   │
                            └──────────┘
```

---

## TypeScript Interfaces

```typescript
// @mcv/connectors/oauth/types.ts

// ═══════════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type OAuthProvider =
  | 'google' | 'github' | 'microsoft' | 'slack'
  | 'twitter' | 'linkedin' | 'meta' | 'stripe'
  | 'salesforce' | 'hubspot' | 'quickbooks' | 'xero' | 'custom';

export type OAuthTokenStatus = 'active' | 'expired' | 'revoked' | 'refreshing';

export type OAuthGrantType = 'authorization_code' | 'client_credentials' | 'refresh_token' | 'device_code';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface OAuthConfig {
  clientId: string;
  secretResourceName: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl?: string | null;
  revokeUrl?: string | null;
  oidcDiscoveryUrl?: string | null;
  jwksUri?: string | null;
  redirectUri: string;
  defaultScopes: string[];
  pkceRequired: boolean;
  accessTokenTtl?: number;
  refreshTokenTtl?: number;
  customSettings?: Record<string, unknown>;
}

export interface ProviderDefaults {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
  revokeUrl?: string;
  oidcDiscoveryUrl?: string;
  defaultScopes: string[];
  pkceRequired: boolean;
  supportsRefresh: boolean;
  supportsRevoke: boolean;
  supportsOidc: boolean;
  tokenResponseFormat?: 'json' | 'form';
  extraAuthParams?: Record<string, string>;
}

export interface ProviderEndpoints {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
  revokeUrl?: string;
  jwksUri?: string;
}

export interface ProviderCapabilities {
  pkce: boolean;
  refresh: boolean;
  revoke: boolean;
  oidc: boolean;
  incrementalScopes: boolean;
  deviceCode: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHORIZATION FLOW TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AuthorizationUrlOptions {
  scopes?: string[];
  redirectUri?: string;
  userId?: string;
  state?: string;
  metadata?: Record<string, unknown>;
  /** Extra query parameters for the authorization URL */
  extraParams?: Record<string, string>;
  /** Force re-consent even if previously authorized */
  forceConsent?: boolean;
  /** Login hint (email) to pre-fill the provider login form */
  loginHint?: string;
}

export interface AuthorizationUrlResult {
  url: string;
  state: string;
  expiresAt: Date;
}

export interface CallbackParams {
  code: string;
  state: string;
  error?: string;
  errorDescription?: string;
}

export interface TokenExchangeResult {
  tokenId: string;
  accessTokenExpiresAt?: Date;
  scopes: string[];
  userInfo: UserInfo | null;
  idTokenClaims?: OidcClaims | null;
  metadata?: Record<string, unknown>;
}

export interface TokenRefreshResult {
  tokenId: string;
  accessTokenExpiresAt?: Date;
  refreshed: boolean;
  newScopesGranted?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER INFO TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserInfo {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
}

export interface NormalizedUserInfo extends UserInfo {
  provider: OAuthProvider;
  rawData: Record<string, unknown>;
  emailVerified?: boolean;
  locale?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OIDC TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface OidcDiscovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri: string;
  scopes_supported?: string[];
  response_types_supported: string[];
  id_token_signing_alg_values_supported?: string[];
  claims_supported?: string[];
  revocation_endpoint?: string;
}

export interface OidcClaims {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  nonce?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  locale?: string;
  [key: string]: unknown;
}

export interface IdTokenPayload {
  header: { alg: string; kid?: string; typ?: string };
  payload: OidcClaims;
  signature: string;
}

export interface JwksResponse {
  keys: JsonWebKey[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN RECORD TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface OAuthTokenRecord {
  id: string;
  provider: OAuthProvider;
  status: OAuthTokenStatus;
  scopes: string[];
  providerAccountId?: string;
  providerEmail?: string;
  providerDisplayName?: string;
  providerAvatarUrl?: string;
  accessTokenExpiresAt?: Date;
  lastRefreshedAt?: Date;
  refreshCount: number;
  consecutiveRefreshFailures: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthStateRecord {
  id: string;
  state: string;
  ventureId: string;
  provider: string;
  redirectUri: string;
  codeVerifier?: string;
  metadata: Record<string, unknown>;
  expiresAt: Date;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type OAuthErrorCode =
  | 'INVALID_STATE'
  | 'STATE_EXPIRED'
  | 'STATE_REUSED'
  | 'TOKEN_EXCHANGE_FAILED'
  | 'REFRESH_FAILED'
  | 'TOKEN_NOT_FOUND'
  | 'TOKEN_REVOKED'
  | 'TOKEN_EXPIRED'
  | 'NO_REFRESH_TOKEN'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_DISABLED'
  | 'VAULT_ERROR'
  | 'OIDC_VALIDATION_FAILED'
  | 'OIDC_DISCOVERY_FAILED'
  | 'RATE_LIMITED'
  | 'MAX_TOKENS_EXCEEDED'
  | 'CALLBACK_ERROR';

export class OAuthError extends Error {
  constructor(
    public code: OAuthErrorCode,
    message: string,
    public details?: Record<string, unknown>,
    public httpStatus?: number
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface OAuthTokenEvent {
  type: 'oauth.token_exchanged' | 'oauth.token_refreshed' | 'oauth.token_revoked'
      | 'oauth.token_expired' | 'oauth.refresh_failed';
  ventureId: string;
  tokenId: string;
  provider: OAuthProvider;
  userId?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface OAuthAuditEvent {
  ventureId: string;
  action: string;
  resourceType: 'oauth_token' | 'oauth_config' | 'oauth_state';
  resourceId: string;
  userId?: string;
  details: Record<string, unknown>;
}
```

---

## Service Implementation

```typescript
// @mcv/connectors/oauth/services/oauth.service.ts
import { randomBytes, createHash } from 'crypto';
import { db, eq, and, lt, sql, desc } from '@mcv/db';
import { oauthConfigurations, oauthStates, oauthTokens, oauthTokenUsage } from '../schema';
import { SecretManagerService } from '@mcv/secrets';
import { auditLog } from '@mcv/audit';
import { eventBus } from '@mcv/events';
import {
  PROVIDER_DEFAULTS, STATE_TTL_SECONDS, TOKEN_REFRESH_BUFFER_MS,
  MAX_REFRESH_ATTEMPTS, PKCE_VERIFIER_LENGTH, STATE_TOKEN_LENGTH,
} from '../constants';
import type {
  OAuthProvider, OAuthConfig, AuthorizationUrlOptions, AuthorizationUrlResult,
  TokenExchangeResult, TokenRefreshResult, UserInfo, NormalizedUserInfo,
  OAuthError as OAuthErrorType,
} from '../types';
import { OAuthError } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class OAuthService {
  private secretManager: SecretManagerService;

  constructor(secretManager?: SecretManagerService) {
    this.secretManager = secretManager ?? new SecretManagerService();
  }

  // ─── AUTHORIZATION ──────────────────────────────────────────────────────────

  /**
   * Generate an authorization URL for the given provider.
   * Creates a state token with PKCE challenge and stores it for validation.
   *
   * @param ventureId - The venture requesting authorization
   * @param provider - OAuth provider identifier
   * @param options - Scopes, redirect URI, user ID, metadata
   * @returns Authorization URL, state token, and expiration
   *
   * @throws {OAuthError} PROVIDER_NOT_CONFIGURED — provider not set up for venture
   * @throws {OAuthError} PROVIDER_DISABLED — provider configured but disabled
   * @throws {OAuthError} RATE_LIMITED — too many authorization requests
   */
  async getAuthorizationUrl(
    ventureId: string,
    provider: OAuthProvider,
    options: AuthorizationUrlOptions = {}
  ): Promise<AuthorizationUrlResult> {
    const config = await this.getProviderConfig(ventureId, provider);
    const defaults = PROVIDER_DEFAULTS[provider];

    // Generate state token for CSRF protection
    const stateToken = options.state ?? this.generateStateToken();

    // Generate PKCE if required
    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;

    if (config.pkceRequired) {
      codeVerifier = this.generateCodeVerifier();
      codeChallenge = this.generateCodeChallenge(codeVerifier);
    }

    const scopes = options.scopes ?? config.defaultScopes;
    const redirectUri = options.redirectUri ?? config.redirectUri;
    const ttl = parseInt(process.env.OAUTH_STATE_TTL_SECONDS ?? String(STATE_TTL_SECONDS), 10);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    // Persist state for callback validation
    await db.insert(oauthStates).values({
      ventureId,
      state: stateToken,
      codeVerifier,
      provider,
      redirectUri,
      metadata: {
        scopes,
        userId: options.userId,
        loginHint: options.loginHint,
        ...options.metadata,
      },
      expiresAt,
    });

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state: stateToken,
    });

    if (config.pkceRequired && codeChallenge) {
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', 'S256');
    }

    // Login hint
    if (options.loginHint) {
      params.set('login_hint', options.loginHint);
    }

    // Provider-specific params from defaults
    if (defaults?.extraAuthParams) {
      for (const [key, value] of Object.entries(defaults.extraAuthParams)) {
        params.set(key, value);
      }
    }

    // Force consent
    if (options.forceConsent) {
      params.set('prompt', 'consent');
    }

    // Extra custom params
    if (options.extraParams) {
      for (const [key, value] of Object.entries(options.extraParams)) {
        params.set(key, value);
      }
    }

    return {
      url: `${config.authorizationUrl}?${params.toString()}`,
      state: stateToken,
      expiresAt,
    };
  }

  // ─── TOKEN EXCHANGE ─────────────────────────────────────────────────────────

  /**
   * Exchange an authorization code for access/refresh tokens.
   * Validates state token, exchanges code, fetches user info, stores tokens in vault.
   *
   * @param ventureId - The venture completing the exchange
   * @param provider - OAuth provider identifier
   * @param code - Authorization code from provider callback
   * @param state - State token for CSRF validation
   * @returns Token ID, expiration, scopes, and user info
   *
   * @throws {OAuthError} INVALID_STATE — state token not found
   * @throws {OAuthError} STATE_EXPIRED — state token past TTL
   * @throws {OAuthError} TOKEN_EXCHANGE_FAILED — provider rejected the exchange
   * @throws {OAuthError} VAULT_ERROR — failed to store tokens in vault
   */
  async exchangeCodeForTokens(
    ventureId: string,
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<TokenExchangeResult> {
    const startTime = Date.now();

    // Validate state
    const storedState = await db.query.oauthStates.findFirst({
      where: and(
        eq(oauthStates.state, state),
        eq(oauthStates.ventureId, ventureId),
      ),
    });

    if (!storedState) {
      throw new OAuthError('INVALID_STATE', 'Invalid or expired state token', undefined, 400);
    }
    if (storedState.expiresAt < new Date()) {
      // Delete expired state
      await db.delete(oauthStates).where(eq(oauthStates.id, storedState.id));
      throw new OAuthError('STATE_EXPIRED', 'State token expired', undefined, 400);
    }

    // Delete used state (one-time use — prevents replay)
    const deleteResult = await db.delete(oauthStates)
      .where(eq(oauthStates.id, storedState.id))
      .returning({ id: oauthStates.id });

    // Race condition: if another request already consumed this state
    if (deleteResult.length === 0) {
      throw new OAuthError('STATE_REUSED', 'State token already consumed', undefined, 400);
    }

    const config = await this.getProviderConfig(ventureId, provider);
    const clientSecret = await this.secretManager.getSecret(config.secretResourceName);

    // Exchange code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: storedState.redirectUri,
      client_id: config.clientId,
      client_secret: clientSecret,
    });

    if (storedState.codeVerifier) {
      tokenParams.set('code_verifier', storedState.codeVerifier);
    }

    const defaults = PROVIDER_DEFAULTS[provider];
    const acceptHeader = defaults?.tokenResponseFormat === 'form'
      ? 'application/json'  // Override: we always want JSON
      : 'application/json';

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': acceptHeader,
      },
      body: tokenParams.toString(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown', error_description: response.statusText }));
      await this.logTokenUsage(null, 'exchange', config.tokenUrl, false, response.status, error.error);
      throw new OAuthError(
        'TOKEN_EXCHANGE_FAILED',
        error.error_description ?? 'Failed to exchange code',
        { providerError: error, statusCode: response.status },
        502
      );
    }

    const tokens = await this.parseTokenResponse(response, provider);

    // Fetch user info
    let userInfo: UserInfo | null = null;
    if (config.userInfoUrl && tokens.access_token) {
      userInfo = await this.fetchUserInfo(config.userInfoUrl, tokens.access_token, provider);
    }

    // Validate OIDC ID token if present
    let idTokenClaims = null;
    if (tokens.id_token && config.oidcDiscoveryUrl) {
      try {
        idTokenClaims = await this.validateIdToken(tokens.id_token, config);
      } catch (e) {
        // Log but don't fail — ID token validation is best-effort
        console.warn(`OIDC ID token validation failed for ${provider}:`, e);
      }
    }

    // Store tokens in vault
    const accessTokenResource = await this.secretManager.storeSecret(
      `oauth/${ventureId}/${provider}/access_token_${Date.now()}`,
      tokens.access_token
    );

    let refreshTokenResource: string | undefined;
    if (tokens.refresh_token) {
      refreshTokenResource = await this.secretManager.storeSecret(
        `oauth/${ventureId}/${provider}/refresh_token_${Date.now()}`,
        tokens.refresh_token
      );
    }

    let idTokenResource: string | undefined;
    if (tokens.id_token) {
      idTokenResource = await this.secretManager.storeSecret(
        `oauth/${ventureId}/${provider}/id_token_${Date.now()}`,
        tokens.id_token
      );
    }

    const accessTokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000) : undefined;

    const metadata = storedState.metadata as Record<string, unknown>;
    const scopes = (metadata?.scopes as string[]) ?? [];
    const userId = metadata?.userId as string | undefined;

    // Store token record
    const [tokenRecord] = await db.insert(oauthTokens).values({
      ventureId, provider, userId,
      accessTokenResourceName: accessTokenResource,
      refreshTokenResourceName: refreshTokenResource,
      idTokenResourceName: idTokenResource,
      tokenType: tokens.token_type ?? 'Bearer',
      status: 'active',
      scopes,
      providerAccountId: userInfo?.id,
      providerEmail: userInfo?.email,
      providerDisplayName: userInfo?.name,
      providerAvatarUrl: userInfo?.picture,
      accessTokenExpiresAt,
    }).returning();

    // Log usage
    await this.logTokenUsage(tokenRecord.id, 'exchange', config.tokenUrl, true, 200, undefined, Date.now() - startTime);

    // Audit
    await auditLog({
      ventureId,
      action: 'oauth.token_exchanged',
      resourceType: 'oauth_token',
      resourceId: tokenRecord.id,
      userId,
      details: { provider, scopes, providerEmail: userInfo?.email },
    });

    // Emit event
    eventBus.emit('oauth.token_exchanged', {
      type: 'oauth.token_exchanged',
      ventureId, tokenId: tokenRecord.id, provider, userId, timestamp: new Date(),
      details: { scopes, providerEmail: userInfo?.email },
    });

    return {
      tokenId: tokenRecord.id,
      accessTokenExpiresAt,
      scopes,
      userInfo,
      idTokenClaims,
      metadata,
    };
  }

  // ─── TOKEN REFRESH ──────────────────────────────────────────────────────────

  /**
   * Refresh an access token using the stored refresh token.
   * Rotates vault secrets: stores new tokens and deletes old ones.
   *
   * @param ventureId - The venture owning the token
   * @param tokenId - UUID of the token record to refresh
   * @returns Updated token metadata
   *
   * @throws {OAuthError} TOKEN_NOT_FOUND — token record doesn't exist
   * @throws {OAuthError} TOKEN_REVOKED — token has been revoked
   * @throws {OAuthError} NO_REFRESH_TOKEN — no refresh token available
   * @throws {OAuthError} REFRESH_FAILED — provider rejected the refresh
   */
  async refreshAccessToken(ventureId: string, tokenId: string): Promise<TokenRefreshResult> {
    const startTime = Date.now();

    const tokenRecord = await db.query.oauthTokens.findFirst({
      where: and(eq(oauthTokens.id, tokenId), eq(oauthTokens.ventureId, ventureId)),
    });

    if (!tokenRecord) throw new OAuthError('TOKEN_NOT_FOUND', 'Token not found', undefined, 404);
    if (tokenRecord.status === 'revoked') throw new OAuthError('TOKEN_REVOKED', 'Token has been revoked', undefined, 403);
    if (!tokenRecord.refreshTokenResourceName) throw new OAuthError('NO_REFRESH_TOKEN', 'No refresh token available', undefined, 400);

    // Check consecutive failures
    if (tokenRecord.consecutiveRefreshFailures >= MAX_REFRESH_ATTEMPTS) {
      await db.update(oauthTokens).set({ status: 'expired', updatedAt: new Date() })
        .where(eq(oauthTokens.id, tokenId));
      throw new OAuthError('REFRESH_FAILED', `Max refresh attempts (${MAX_REFRESH_ATTEMPTS}) exceeded`, undefined, 502);
    }

    // Set status to refreshing (optimistic lock)
    await db.update(oauthTokens).set({ status: 'refreshing', updatedAt: new Date() })
      .where(eq(oauthTokens.id, tokenId));

    try {
      const config = await this.getProviderConfig(ventureId, tokenRecord.provider);
      const clientSecret = await this.secretManager.getSecret(config.secretResourceName);
      const refreshToken = await this.secretManager.getSecret(tokenRecord.refreshTokenResourceName);

      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: config.clientId,
          client_secret: clientSecret,
        }).toString(),
      });

      if (!response.ok) {
        // Increment failure counter
        await db.update(oauthTokens).set({
          status: 'active', // Revert to active (token may still work)
          consecutiveRefreshFailures: sql`${oauthTokens.consecutiveRefreshFailures} + 1`,
          updatedAt: new Date(),
        }).where(eq(oauthTokens.id, tokenId));

        const error = await response.json().catch(() => ({ error: 'unknown' }));
        await this.logTokenUsage(tokenId, 'refresh', config.tokenUrl, false, response.status, error.error, Date.now() - startTime);

        eventBus.emit('oauth.refresh_failed', {
          type: 'oauth.refresh_failed',
          ventureId, tokenId, provider: tokenRecord.provider, timestamp: new Date(),
          details: { error: error.error, statusCode: response.status },
        });

        throw new OAuthError('REFRESH_FAILED', error.error_description ?? 'Failed to refresh token', { providerError: error }, 502);
      }

      const tokens = await this.parseTokenResponse(response, tokenRecord.provider);

      // Rotate vault secrets (store new, then delete old)
      const newAccessResource = await this.secretManager.storeSecret(
        `oauth/${ventureId}/${tokenRecord.provider}/access_token_${Date.now()}`,
        tokens.access_token
      );

      // Delete old access token from vault
      await this.secretManager.deleteSecret(tokenRecord.accessTokenResourceName).catch(() => {});

      let newRefreshResource = tokenRecord.refreshTokenResourceName;
      if (tokens.refresh_token) {
        // Provider issued a new refresh token — rotate it
        newRefreshResource = await this.secretManager.storeSecret(
          `oauth/${ventureId}/${tokenRecord.provider}/refresh_token_${Date.now()}`,
          tokens.refresh_token
        );
        await this.secretManager.deleteSecret(tokenRecord.refreshTokenResourceName).catch(() => {});
      }

      const accessTokenExpiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000) : undefined;

      await db.update(oauthTokens).set({
        accessTokenResourceName: newAccessResource,
        refreshTokenResourceName: newRefreshResource,
        status: 'active',
        accessTokenExpiresAt,
        lastRefreshedAt: new Date(),
        refreshCount: sql`${oauthTokens.refreshCount} + 1`,
        consecutiveRefreshFailures: 0, // Reset on success
        updatedAt: new Date(),
      }).where(eq(oauthTokens.id, tokenId));

      await this.logTokenUsage(tokenId, 'refresh', config.tokenUrl, true, 200, undefined, Date.now() - startTime);

      await auditLog({
        ventureId, action: 'oauth.token_refreshed',
        resourceType: 'oauth_token', resourceId: tokenId,
        details: { provider: tokenRecord.provider },
      });

      eventBus.emit('oauth.token_refreshed', {
        type: 'oauth.token_refreshed',
        ventureId, tokenId, provider: tokenRecord.provider, timestamp: new Date(),
      });

      return { tokenId, accessTokenExpiresAt, refreshed: true };
    } catch (error) {
      if (error instanceof OAuthError) throw error;
      // Unexpected error — revert status
      await db.update(oauthTokens).set({ status: 'active', updatedAt: new Date() })
        .where(eq(oauthTokens.id, tokenId));
      throw error;
    }
  }

  // ─── TOKEN ACCESS ───────────────────────────────────────────────────────────

  /**
   * Get a valid access token, auto-refreshing if near expiry.
   * This is the primary method other modules call to get a usable token.
   *
   * @param ventureId - The venture owning the token
   * @param tokenId - UUID of the token record
   * @returns Decrypted access token string
   *
   * @throws {OAuthError} TOKEN_NOT_FOUND — token record doesn't exist
   * @throws {OAuthError} TOKEN_REVOKED — token has been revoked
   * @throws {OAuthError} TOKEN_EXPIRED — expired and no refresh token available
   */
  async getAccessToken(ventureId: string, tokenId: string): Promise<string> {
    const tokenRecord = await db.query.oauthTokens.findFirst({
      where: and(eq(oauthTokens.id, tokenId), eq(oauthTokens.ventureId, ventureId)),
    });

    if (!tokenRecord) throw new OAuthError('TOKEN_NOT_FOUND', 'Token not found', undefined, 404);
    if (tokenRecord.status === 'revoked') throw new OAuthError('TOKEN_REVOKED', 'Token has been revoked', undefined, 403);

    // Auto-refresh if within buffer window
    const bufferMs = parseInt(
      process.env.OAUTH_TOKEN_REFRESH_BUFFER_MS ?? String(TOKEN_REFRESH_BUFFER_MS), 10
    );

    if (tokenRecord.accessTokenExpiresAt) {
      const timeUntilExpiry = tokenRecord.accessTokenExpiresAt.getTime() - Date.now();

      if (timeUntilExpiry <= 0) {
        // Already expired
        if (tokenRecord.refreshTokenResourceName) {
          const result = await this.refreshAccessToken(ventureId, tokenId);
          if (result.refreshed) {
            const refreshed = await db.query.oauthTokens.findFirst({ where: eq(oauthTokens.id, tokenId) });
            if (refreshed) return this.secretManager.getSecret(refreshed.accessTokenResourceName);
          }
        }
        throw new OAuthError('TOKEN_EXPIRED', 'Token expired and cannot be refreshed', undefined, 401);
      }

      if (timeUntilExpiry < bufferMs && tokenRecord.refreshTokenResourceName) {
        // Within buffer — proactively refresh (fire and forget for non-blocking)
        try {
          await this.refreshAccessToken(ventureId, tokenId);
          const refreshed = await db.query.oauthTokens.findFirst({ where: eq(oauthTokens.id, tokenId) });
          if (refreshed) return this.secretManager.getSecret(refreshed.accessTokenResourceName);
        } catch {
          // Refresh failed but token still valid — return current token
        }
      }
    }

    // Log usage
    await this.logTokenUsage(tokenId, 'fetch', undefined, true).catch(() => {});

    return this.secretManager.getSecret(tokenRecord.accessTokenResourceName);
  }

  // ─── TOKEN REVOCATION ───────────────────────────────────────────────────────

  /**
   * Revoke a token locally and at the provider.
   * Deletes tokens from vault, marks record as revoked, emits audit event.
   *
   * @param ventureId - The venture owning the token
   * @param tokenId - UUID of the token record
   * @param revokedBy - User ID who initiated the revocation
   * @param reason - Human-readable revocation reason
   */
  async revokeToken(
    ventureId: string,
    tokenId: string,
    revokedBy?: string,
    reason?: string
  ): Promise<void> {
    const tokenRecord = await db.query.oauthTokens.findFirst({
      where: and(eq(oauthTokens.id, tokenId), eq(oauthTokens.ventureId, ventureId)),
    });
    if (!tokenRecord || tokenRecord.status === 'revoked') return;

    const config = await this.getProviderConfig(ventureId, tokenRecord.provider);
    const defaults = PROVIDER_DEFAULTS[tokenRecord.provider];

    // Remote revocation (best-effort)
    if (config.revokeUrl && defaults?.supportsRevoke) {
      try {
        const accessToken = await this.secretManager.getSecret(tokenRecord.accessTokenResourceName);
        await fetch(config.revokeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: accessToken }).toString(),
        });
      } catch (err) {
        console.warn(`Remote revocation failed for ${tokenRecord.provider}:`, err);
      }
    }

    // Delete from vault (parallel operations)
    await Promise.allSettled([
      this.secretManager.deleteSecret(tokenRecord.accessTokenResourceName),
      tokenRecord.refreshTokenResourceName
        ? this.secretManager.deleteSecret(tokenRecord.refreshTokenResourceName) : Promise.resolve(),
      tokenRecord.idTokenResourceName
        ? this.secretManager.deleteSecret(tokenRecord.idTokenResourceName) : Promise.resolve(),
    ]);

    // Mark as revoked in DB
    await db.update(oauthTokens).set({
      status: 'revoked',
      revokedAt: new Date(),
      revokedBy,
      revokeReason: reason,
      updatedAt: new Date(),
    }).where(eq(oauthTokens.id, tokenId));

    await this.logTokenUsage(tokenId, 'revoke', config.revokeUrl ?? undefined, true);

    await auditLog({
      ventureId, action: 'oauth.token_revoked',
      resourceType: 'oauth_token', resourceId: tokenId,
      userId: revokedBy,
      details: { provider: tokenRecord.provider, reason },
    });

    eventBus.emit('oauth.token_revoked', {
      type: 'oauth.token_revoked',
      ventureId, tokenId, provider: tokenRecord.provider,
      userId: revokedBy, timestamp: new Date(),
      details: { reason },
    });
  }

  // ─── TOKEN STATUS ───────────────────────────────────────────────────────────

  /**
   * Check token status without fetching the actual access token.
   * Useful for UI indicators and health checks.
   */
  async getTokenStatus(ventureId: string, tokenId: string): Promise<{
    status: string;
    expiresIn?: number;
    refreshAvailable: boolean;
    refreshCount: number;
    lastRefreshedAt?: Date;
  }> {
    const tokenRecord = await db.query.oauthTokens.findFirst({
      where: and(eq(oauthTokens.id, tokenId), eq(oauthTokens.ventureId, ventureId)),
    });

    if (!tokenRecord) throw new OAuthError('TOKEN_NOT_FOUND', 'Token not found', undefined, 404);

    const expiresIn = tokenRecord.accessTokenExpiresAt
      ? Math.max(0, Math.floor((tokenRecord.accessTokenExpiresAt.getTime() - Date.now()) / 1000))
      : undefined;

    return {
      status: tokenRecord.status,
      expiresIn,
      refreshAvailable: !!tokenRecord.refreshTokenResourceName,
      refreshCount: tokenRecord.refreshCount,
      lastRefreshedAt: tokenRecord.lastRefreshedAt ?? undefined,
    };
  }

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  async getProviderConfig(ventureId: string, provider: OAuthProvider): Promise<OAuthConfig> {
    const config = await db.query.oauthConfigurations.findFirst({
      where: and(
        eq(oauthConfigurations.ventureId, ventureId),
        eq(oauthConfigurations.provider, provider),
      ),
    });

    if (!config) {
      throw new OAuthError('PROVIDER_NOT_CONFIGURED', `OAuth provider ${provider} not configured for this venture`, undefined, 404);
    }
    if (!config.isEnabled) {
      throw new OAuthError('PROVIDER_DISABLED', `OAuth provider ${provider} is disabled`, undefined, 403);
    }

    const defaults = PROVIDER_DEFAULTS[provider] ?? {};

    return {
      clientId: config.clientId!,
      secretResourceName: config.secretResourceName!,
      authorizationUrl: config.authorizationUrl ?? defaults.authorizationUrl!,
      tokenUrl: config.tokenUrl ?? defaults.tokenUrl!,
      userInfoUrl: config.userInfoUrl ?? defaults.userInfoUrl,
      revokeUrl: config.revokeUrl ?? defaults.revokeUrl,
      oidcDiscoveryUrl: config.oidcDiscoveryUrl ?? defaults.oidcDiscoveryUrl,
      jwksUri: config.jwksUri,
      redirectUri: config.redirectUri!,
      defaultScopes: (config.defaultScopes as string[]) ?? defaults.defaultScopes ?? [],
      pkceRequired: config.pkceRequired ?? defaults.pkceRequired ?? true,
      accessTokenTtl: config.accessTokenTtl ?? undefined,
      refreshTokenTtl: config.refreshTokenTtl ?? undefined,
      customSettings: config.customSettings as Record<string, unknown> | undefined,
    };
  }

  async fetchUserInfo(url: string, accessToken: string, provider: OAuthProvider): Promise<UserInfo | null> {
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      if (!response.ok) return null;
      const data = await response.json();

      return this.normalizeUserInfo(data, provider);
    } catch {
      return null;
    }
  }

  private normalizeUserInfo(data: Record<string, unknown>, provider: OAuthProvider): UserInfo {
    switch (provider) {
      case 'google':
        return { id: data.id as string, email: data.email as string, name: data.name as string, picture: data.picture as string };
      case 'github':
        return { id: String(data.id), email: data.email as string, name: (data.name ?? data.login) as string, picture: data.avatar_url as string };
      case 'microsoft':
        return { id: data.id as string, email: (data.mail ?? data.userPrincipalName) as string, name: data.displayName as string };
      case 'twitter':
        return { id: (data as any).data?.id, name: (data as any).data?.name, picture: (data as any).data?.profile_image_url };
      case 'linkedin':
        return { id: data.sub as string, email: data.email as string, name: data.name as string, picture: data.picture as string };
      case 'meta':
        return { id: data.id as string, email: data.email as string, name: data.name as string };
      case 'slack':
        return { id: (data as any).user?.id, email: (data as any).user?.email, name: (data as any).user?.name, picture: (data as any).user?.image_72 };
      case 'salesforce':
        return { id: data.user_id as string, email: data.email as string, name: data.name as string, picture: data.picture as string };
      case 'hubspot':
        return { id: data.user as string, email: data.user as string, name: data.hub_domain as string };
      default:
        return { id: data.id as string ?? data.sub as string, email: data.email as string, name: data.name as string };
    }
  }

  private async parseTokenResponse(response: Response, provider: OAuthProvider): Promise<{
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  }> {
    const contentType = response.headers.get('content-type') ?? '';

    // GitHub may return form-encoded even with Accept: application/json
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await response.text();
      const params = new URLSearchParams(text);
      return {
        access_token: params.get('access_token')!,
        refresh_token: params.get('refresh_token') ?? undefined,
        token_type: params.get('token_type') ?? undefined,
        scope: params.get('scope') ?? undefined,
      };
    }

    return response.json();
  }

  private async validateIdToken(idToken: string, config: OAuthConfig): Promise<Record<string, unknown> | null> {
    // Delegate to OIDC service for full validation
    // This is a simplified inline version
    try {
      const parts = idToken.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      // Basic claim validation
      if (payload.exp && payload.exp < Date.now() / 1000) return null;
      if (payload.aud && payload.aud !== config.clientId) return null;
      return payload;
    } catch {
      return null;
    }
  }

  private async logTokenUsage(
    tokenId: string | null,
    operation: string,
    endpoint?: string,
    success?: boolean,
    statusCode?: number,
    errorCode?: string,
    latencyMs?: number,
  ): Promise<void> {
    if (!tokenId) return;
    try {
      await db.insert(oauthTokenUsage).values({
        tokenId,
        operation,
        endpoint,
        success: success ?? true,
        statusCode,
        errorCode,
        latencyMs,
      });
    } catch {
      // Don't fail the main operation if usage logging fails
    }
  }

  private generateStateToken(): string {
    return randomBytes(STATE_TOKEN_LENGTH).toString('base64url');
  }

  private generateCodeVerifier(): string {
    return randomBytes(PKCE_VERIFIER_LENGTH).toString('base64url');
  }

  private generateCodeChallenge(verifier: string): string {
    return createHash('sha256').update(verifier).digest('base64url');
  }
}

export const oauthService = new OAuthService();
```

---

## Callback Handler

The callback handler processes the redirect from the OAuth provider. It validates the state, exchanges the code, and redirects the user back to the app.

```typescript
// @mcv/connectors/oauth/server/handlers/callback.handler.ts
import { oauthService } from '../services/oauth.service';
import type { CallbackParams, OAuthProvider } from '../../types';
import { OAuthError } from '../../types';

/**
 * Universal OAuth callback handler.
 * Designed to work with any HTTP framework (Express, Next.js, Hono, etc.)
 */
export async function oauthCallbackHandler(params: {
  ventureId: string;
  provider: OAuthProvider;
  query: Record<string, string>;
  successRedirect: string;
  errorRedirect: string;
}): Promise<{ redirect: string; tokenId?: string; error?: string }> {
  const { ventureId, provider, query, successRedirect, errorRedirect } = params;

  // Check for provider-side errors
  if (query.error) {
    const errorMsg = query.error_description ?? query.error;
    const errorUrl = new URL(errorRedirect);
    errorUrl.searchParams.set('error', query.error);
    errorUrl.searchParams.set('error_description', errorMsg);
    errorUrl.searchParams.set('provider', provider);
    return { redirect: errorUrl.toString(), error: errorMsg };
  }

  // Validate required params
  if (!query.code || !query.state) {
    const errorUrl = new URL(errorRedirect);
    errorUrl.searchParams.set('error', 'missing_params');
    errorUrl.searchParams.set('error_description', 'Missing code or state parameter');
    return { redirect: errorUrl.toString(), error: 'Missing code or state' };
  }

  try {
    const result = await oauthService.exchangeCodeForTokens(
      ventureId, provider, query.code, query.state
    );

    const successUrl = new URL(successRedirect);
    successUrl.searchParams.set('provider', provider);
    successUrl.searchParams.set('connected', 'true');
    // Don't expose tokenId in URL — pass via session or secure cookie
    return { redirect: successUrl.toString(), tokenId: result.tokenId };
  } catch (err) {
    const errorUrl = new URL(errorRedirect);
    if (err instanceof OAuthError) {
      errorUrl.searchParams.set('error', err.code);
      errorUrl.searchParams.set('error_description', err.message);
    } else {
      errorUrl.searchParams.set('error', 'unknown');
      errorUrl.searchParams.set('error_description', 'An unexpected error occurred');
    }
    errorUrl.searchParams.set('provider', provider);
    return { redirect: errorUrl.toString(), error: (err as Error).message };
  }
}

/**
 * Create an Express-compatible callback router for all providers.
 * Mounts at: /oauth/callback/:provider
 */
export function createCallbackRouter(options: {
  getVentureId: (req: any) => string;
  successRedirect: string;
  errorRedirect: string;
}) {
  return async (req: any, res: any) => {
    const provider = req.params.provider as OAuthProvider;
    const ventureId = options.getVentureId(req);

    const result = await oauthCallbackHandler({
      ventureId,
      provider,
      query: req.query,
      successRedirect: options.successRedirect,
      errorRedirect: options.errorRedirect,
    });

    // Store tokenId in session if available
    if (result.tokenId && req.session) {
      req.session.oauthTokenId = result.tokenId;
    }

    res.redirect(result.redirect);
  };
}
```

---

## Middleware — Token Injection

```typescript
// @mcv/connectors/oauth/server/middleware.ts
import { oauthService } from './services/oauth.service';
import type { OAuthProvider } from '../types';
import { OAuthError } from '../types';

/**
 * Middleware that injects a valid OAuth access token into the request context.
 * Auto-refreshes if the token is near expiry.
 *
 * Usage:
 *   const token = await withOAuthToken(ventureId, tokenId);
 *   // token is a valid access token string
 */
export async function withOAuthToken(
  ventureId: string,
  tokenId: string
): Promise<string> {
  return oauthService.getAccessToken(ventureId, tokenId);
}

/**
 * Middleware that requires a valid OAuth token or throws 401.
 * Used in tRPC procedures and API routes that need provider access.
 */
export function requireOAuthToken(provider: OAuthProvider) {
  return async (opts: { ctx: { venture: { id: string }; oauthTokenId?: string }; next: Function }) => {
    const { ctx, next } = opts;
    const tokenId = ctx.oauthTokenId;

    if (!tokenId) {
      throw new OAuthError('TOKEN_NOT_FOUND', `No ${provider} token in session. Please connect your account.`, undefined, 401);
    }

    try {
      const accessToken = await oauthService.getAccessToken(ctx.venture.id, tokenId);
      return next({ ctx: { ...ctx, oauthAccessToken: accessToken } });
    } catch (err) {
      if (err instanceof OAuthError && (err.code === 'TOKEN_EXPIRED' || err.code === 'TOKEN_REVOKED')) {
        throw new OAuthError(err.code, `Your ${provider} connection has expired. Please reconnect.`, undefined, 401);
      }
      throw err;
    }
  };
}

/**
 * Rate limiter middleware for OAuth operations.
 * Prevents abuse of authorization URL generation and token exchange endpoints.
 */
export function oauthRateLimiter(options: {
  operation: 'authorization' | 'exchange' | 'refresh' | 'revoke';
  ventureId: string;
}): { allowed: boolean; retryAfterMs?: number } {
  // Integrates with @mcv/rate-limit
  // Implementation delegates to the rate-limit module's token bucket
  // This is a type-safe wrapper with OAuth-specific defaults
  return { allowed: true }; // Simplified — actual implementation uses rate-limit service
}
```

---

## API (tRPC Router)

```typescript
// @mcv/connectors/oauth/router.ts
import { router, protectedProcedure, ventureAdminProcedure } from '@mcv/api';
import { z } from 'zod';
import { oauthService } from './services/oauth.service';
import { db, eq, and, desc } from '@mcv/db';
import { oauthConfigurations, oauthTokens, oauthTokenUsage } from './schema';
import { SecretManagerService } from '@mcv/secrets';

const secretManager = new SecretManagerService();

const oauthProviderSchema = z.enum([
  'google', 'github', 'microsoft', 'slack',
  'twitter', 'linkedin', 'meta', 'stripe',
  'salesforce', 'hubspot', 'quickbooks', 'xero', 'custom'
]);

export const oauthRouter = router({

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHORIZATION FLOW
  // ═══════════════════════════════════════════════════════════════════════════

  getAuthorizationUrl: protectedProcedure
    .input(z.object({
      provider: oauthProviderSchema,
      scopes: z.array(z.string()).optional(),
      redirectUri: z.string().url().optional(),
      metadata: z.record(z.unknown()).optional(),
      loginHint: z.string().email().optional(),
      forceConsent: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return oauthService.getAuthorizationUrl(ctx.venture.id, input.provider, {
        scopes: input.scopes,
        redirectUri: input.redirectUri,
        userId: ctx.user.id,
        metadata: input.metadata,
        loginHint: input.loginHint,
        forceConsent: input.forceConsent,
      });
    }),

  exchangeCode: protectedProcedure
    .input(z.object({
      provider: oauthProviderSchema,
      code: z.string().min(1),
      state: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return oauthService.exchangeCodeForTokens(
        ctx.venture.id, input.provider, input.code, input.state
      );
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TOKEN MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  listTokens: protectedProcedure
    .input(z.object({
      provider: oauthProviderSchema.optional(),
      status: z.enum(['active', 'expired', 'revoked']).optional(),
      userId: z.string().uuid().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return db.query.oauthTokens.findMany({
        where: and(
          eq(oauthTokens.ventureId, ctx.venture.id),
          input?.provider ? eq(oauthTokens.provider, input.provider) : undefined,
          input?.status ? eq(oauthTokens.status, input.status) : undefined,
          input?.userId ? eq(oauthTokens.userId, input.userId) : undefined,
        ),
        columns: {
          // Never expose vault resource names to clients
          accessTokenResourceName: false,
          refreshTokenResourceName: false,
          idTokenResourceName: false,
        },
        orderBy: desc(oauthTokens.createdAt),
      });
    }),

  getTokenStatus: protectedProcedure
    .input(z.object({ tokenId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return oauthService.getTokenStatus(ctx.venture.id, input.tokenId);
    }),

  refreshToken: protectedProcedure
    .input(z.object({ tokenId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return oauthService.refreshAccessToken(ctx.venture.id, input.tokenId);
    }),

  revokeToken: protectedProcedure
    .input(z.object({
      tokenId: z.string().uuid(),
      reason: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await oauthService.revokeToken(ctx.venture.id, input.tokenId, ctx.user.id, input.reason);
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TOKEN USAGE AUDIT
  // ═══════════════════════════════════════════════════════════════════════════

  getTokenUsage: protectedProcedure
    .input(z.object({
      tokenId: z.string().uuid(),
      limit: z.number().int().min(1).max(500).default(100),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Verify token belongs to venture
      const token = await db.query.oauthTokens.findFirst({
        where: and(eq(oauthTokens.id, input.tokenId), eq(oauthTokens.ventureId, ctx.venture.id)),
        columns: { id: true },
      });
      if (!token) throw new OAuthError('TOKEN_NOT_FOUND', 'Token not found', undefined, 404);

      return db.query.oauthTokenUsage.findMany({
        where: eq(oauthTokenUsage.tokenId, input.tokenId),
        orderBy: desc(oauthTokenUsage.createdAt),
        limit: input.limit,
        offset: input.offset,
      });
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION (Admin only)
  // ═══════════════════════════════════════════════════════════════════════════

  listConfigurations: ventureAdminProcedure
    .query(async ({ ctx }) => {
      return db.query.oauthConfigurations.findMany({
        where: eq(oauthConfigurations.ventureId, ctx.venture.id),
        columns: { secretResourceName: false },  // Never expose vault reference
      });
    }),

  getConfiguration: ventureAdminProcedure
    .input(z.object({ provider: oauthProviderSchema }))
    .query(async ({ ctx, input }) => {
      return db.query.oauthConfigurations.findFirst({
        where: and(
          eq(oauthConfigurations.ventureId, ctx.venture.id),
          eq(oauthConfigurations.provider, input.provider),
        ),
        columns: { secretResourceName: false },
      });
    }),

  configureProvider: ventureAdminProcedure
    .input(z.object({
      provider: oauthProviderSchema,
      clientId: z.string().min(1),
      clientSecret: z.string().min(1),
      redirectUri: z.string().url(),
      defaultScopes: z.array(z.string()).optional(),
      authorizationUrl: z.string().url().optional(),
      tokenUrl: z.string().url().optional(),
      userInfoUrl: z.string().url().optional(),
      revokeUrl: z.string().url().optional(),
      pkceRequired: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Store client secret in vault
      const secretResourceName = await secretManager.storeSecret(
        `oauth/${ctx.venture.id}/${input.provider}/client_secret`,
        input.clientSecret
      );

      await db.insert(oauthConfigurations).values({
        ventureId: ctx.venture.id,
        provider: input.provider,
        clientId: input.clientId,
        secretResourceName,
        redirectUri: input.redirectUri,
        defaultScopes: input.defaultScopes,
        authorizationUrl: input.authorizationUrl,
        tokenUrl: input.tokenUrl,
        userInfoUrl: input.userInfoUrl,
        revokeUrl: input.revokeUrl,
        pkceRequired: input.pkceRequired,
      }).onConflictDoUpdate({
        target: [oauthConfigurations.ventureId, oauthConfigurations.provider],
        set: {
          clientId: input.clientId,
          secretResourceName,
          redirectUri: input.redirectUri,
          defaultScopes: input.defaultScopes,
          authorizationUrl: input.authorizationUrl,
          tokenUrl: input.tokenUrl,
          userInfoUrl: input.userInfoUrl,
          revokeUrl: input.revokeUrl,
          pkceRequired: input.pkceRequired,
          updatedAt: new Date(),
        },
      });

      await auditLog({
        ventureId: ctx.venture.id,
        action: 'oauth.provider_configured',
        resourceType: 'oauth_config',
        resourceId: input.provider,
        userId: ctx.user.id,
        details: { provider: input.provider, clientId: `${input.clientId.slice(0