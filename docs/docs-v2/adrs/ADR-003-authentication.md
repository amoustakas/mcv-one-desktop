# ADR-003: Authentication Strategy (Better Auth)

**Status:** ACCEPTED
**Date:** February 9, 2026
**Context:** Moving from legacy NextAuth to Better Auth for multi-tenancy.

---

## 1. Context

The MCV.ONE ecosystem requires a unified identity layer that supports:
1.  **Multi-Tenancy**: Users belong to multiple Ventures (Tenants).
2.  **Modern Auth**: Passkeys, WebAuthn, Magic Links.
3.  **Enterprise Features**: SAML, OIDC, SCIM.
4.  **Performance**: Lightweight, edge-compatible sessions.

Our legacy prototype used `NextAuth.js` (v4/v5). While robust, it struggled with:
-   Complex multi-tenant schemas (custom database adapters required).
-   Passkey support (verbose configuration).
-   Edge compatibility (cold starts).

## 2. Decision

We will adopt **Better Auth** (v1.x) as the standard authentication library for the `@mcv/identity` package.

### Key Components:
*   **Database**: Direct integration with Drizzle ORM (Postgres).
*   **Session**: Bearer Tokens (PASETO/JWT) for stateless/edge verification.
*   **MFA**: Built-in support for TOTP and WebAuthn.
*   **RBAC**: Plugin system for Roles and Permissions.

## 3. Architecture

### Schema Integration
Better Auth will own the following tables in the `@mcv/db` schema:
-   `users`
-   `sessions`
-   `accounts` (OAuth links)
-   `verifications` (Email/Phone)
-   `passkeys`

### Tenant Isolation
We will implement a **Custom Plugin** for Better Auth to enforce `venture_id` scoping on all session creations and validations.

```typescript
// @mcv/identity/plugins/venture-scope.ts
export const ventureScope = {
    id: "venture-scope",
    hooks: {
        beforeSessionCreate: (ctx) => {
            // Ensure venture_id is present
        }
    }
}
```

## 4. Consequences

### Positive
*   **Velocity**: 50% less boilerplate code than NextAuth.
*   **Security**: Native support for modern standards (FIDO2).
*   **Type Safety**: Full inference with TypeScript.

### Negative
*   **Migration**: Existing NextAuth users (if any) will need a session migration or re-login.
*   **Maturity**: Library is newer than NextAuth; requires careful version pinning.

## 5. Implementation Plan

1.  Install `better-auth` in `@mcv/identity`.
2.  Define Drizzle schema in `@mcv/kernel`.
3.  Create the `auth` client in `@mcv/identity/client`.
4.  Deprecate `tier-1-identity/legacy-nextauth` references.
