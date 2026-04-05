# @mcv/identity — Implementation Plan
## Epics, Phases & Task Breakdown

**Package:** `@mcv/identity`  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026  
**Estimated Effort:** 4-5 weeks

---

## Executive Summary

The `@mcv/identity` package provides the security boundary for MCV.ONE, handling authentication, authorization, multi-tenancy, and user management. This is a critical package that must be rock-solid before other packages can be built.

---

## Implementation Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          IMPLEMENTATION TIMELINE                             │
│                                                                              │
│  Phase 1          Phase 2          Phase 3          Phase 4          Phase 5│
│  Auth Core        Permissions      Tenants          Users            SSO    │
│  (Week 1-2)       (Week 2-3)       (Week 3)         (Week 4)         (Week 5)│
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐│
│  │ Sessions │───▶│   RBAC   │───▶│ Ventures │───▶│ Profiles │───▶│  SSO   ││
│  │   MFA    │    │   ABAC   │    │Workspaces│    │  Invite  │    │ Linking││
│  │  OAuth   │    │  Gates   │    │ Scoping  │    │ Imperson.│    │        ││
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Authentication Core (Weeks 1-2)

### Epic 1.1: Session Management

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.1.1 | Install and configure Better Auth | 4h | P0 |
| 1.1.2 | Create sessions table schema | 2h | P0 |
| 1.1.3 | Implement session creation/validation | 4h | P0 |
| 1.1.4 | Add session refresh logic | 3h | P0 |
| 1.1.5 | Implement session revocation | 2h | P0 |
| 1.1.6 | Add device tracking | 3h | P1 |
| 1.1.7 | Create session middleware for tRPC | 3h | P0 |
| 1.1.8 | Write integration tests | 4h | P0 |

### Epic 1.2: Multi-Factor Authentication

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.2.1 | TOTP setup flow (Google Auth, Authy) | 4h | P0 |
| 1.2.2 | SMS verification via Twilio | 3h | P1 |
| 1.2.3 | Email verification codes | 2h | P1 |
| 1.2.4 | Recovery codes generation/storage | 3h | P0 |
| 1.2.5 | MFA enforcement policies | 2h | P1 |
| 1.2.6 | Remember device functionality | 3h | P2 |

### Epic 1.3: OAuth & Social Login

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.3.1 | Google OAuth integration | 3h | P0 |
| 1.3.2 | GitHub OAuth integration | 2h | P1 |
| 1.3.3 | Discord OAuth integration | 2h | P1 |
| 1.3.4 | Apple Sign-In | 3h | P1 |
| 1.3.5 | Account linking flow | 4h | P0 |
| 1.3.6 | OAuth token refresh | 3h | P0 |

### Epic 1.4: WebAuthn & Passkeys

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.4.1 | WebAuthn registration flow | 4h | P1 |
| 1.4.2 | WebAuthn authentication flow | 4h | P1 |
| 1.4.3 | Passkey management UI endpoints | 3h | P1 |
| 1.4.4 | Cross-device passkey support | 4h | P2 |

### Epic 1.5: Magic Links

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.5.1 | Magic link generation | 2h | P1 |
| 1.5.2 | Email template integration | 2h | P1 |
| 1.5.3 | Link verification and session creation | 2h | P1 |
| 1.5.4 | Rate limiting for magic links | 2h | P1 |

---

## Phase 2: Authorization (Weeks 2-3)

### Epic 2.1: Role-Based Access Control (RBAC)

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.1.1 | Define core role schema | 2h | P0 |
| 2.1.2 | Create roles table and migrations | 2h | P0 |
| 2.1.3 | User-role assignment logic | 3h | P0 |
| 2.1.4 | Role hierarchy support | 3h | P1 |
| 2.1.5 | Built-in roles (admin, member, viewer) | 2h | P0 |
| 2.1.6 | Custom role creation API | 3h | P1 |

### Epic 2.2: Attribute-Based Access Control (ABAC)

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.2.1 | Policy definition schema | 4h | P1 |
| 2.2.2 | Policy evaluation engine | 6h | P1 |
| 2.2.3 | Context-aware policy evaluation | 4h | P1 |
| 2.2.4 | Policy caching | 2h | P1 |
| 2.2.5 | Policy testing utilities | 3h | P2 |

### Epic 2.3: Permission Gates

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.3.1 | Define permission constants | 2h | P0 |
| 2.3.2 | Permission check middleware | 3h | P0 |
| 2.3.3 | Resource-level permissions | 4h | P0 |
| 2.3.4 | Permission inheritance | 3h | P1 |
| 2.3.5 | UI permission hooks | 3h | P0 |

---

## Phase 3: Multi-Tenancy (Week 3)

### Epic 3.1: Venture Management

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.1.1 | Ventures table schema | 2h | P0 |
| 3.1.2 | Venture CRUD operations | 3h | P0 |
| 3.1.3 | Venture settings storage | 2h | P0 |
| 3.1.4 | Venture domain mapping | 3h | P0 |
| 3.1.5 | Venture feature flags | 3h | P1 |

### Epic 3.2: Organization/Workspace Support

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.2.1 | Organizations table schema | 2h | P0 |
| 3.2.2 | Organization membership | 3h | P0 |
| 3.2.3 | Organization roles | 3h | P0 |
| 3.2.4 | Workspace switching | 2h | P0 |

### Epic 3.3: Context Scoping

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.3.1 | Venture resolution from request | 3h | P0 |
| 3.3.2 | RLS policy setup | 4h | P0 |
| 3.3.3 | Cross-venture query prevention | 2h | P0 |
| 3.3.4 | Context injection in tRPC | 2h | P0 |

---

## Phase 4: User Management (Week 4)

### Epic 4.1: User Profiles

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.1.1 | User profile schema | 2h | P0 |
| 4.1.2 | Profile CRUD operations | 3h | P0 |
| 4.1.3 | Avatar upload/management | 3h | P1 |
| 4.1.4 | Profile preferences | 2h | P1 |
| 4.1.5 | User search/directory | 3h | P1 |

### Epic 4.2: User Invitations

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.2.1 | Invitation generation | 2h | P0 |
| 4.2.2 | Invitation email sending | 2h | P0 |
| 4.2.3 | Invitation acceptance flow | 3h | P0 |
| 4.2.4 | Bulk invitations | 2h | P2 |
| 4.2.5 | Invitation expiry/revocation | 2h | P1 |

### Epic 4.3: Impersonation

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.3.1 | Impersonation session creation | 3h | P1 |
| 4.3.2 | Impersonation audit logging | 2h | P0 |
| 4.3.3 | Impersonation exit flow | 2h | P1 |
| 4.3.4 | Permission restrictions during impersonation | 2h | P1 |

---

## Phase 5: Single Sign-On (Week 5)

### Epic 5.1: Cross-Venture SSO

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 5.1.1 | SSO session sharing mechanism | 4h | P1 |
| 5.1.2 | Cross-venture cookie handling | 3h | P1 |
| 5.1.3 | SSO redirect flows | 3h | P1 |
| 5.1.4 | Venture permission mapping | 3h | P1 |

### Epic 5.2: Identity Resolution

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 5.2.1 | Email-based identity matching | 2h | P1 |
| 5.2.2 | Phone-based identity matching | 2h | P2 |
| 5.2.3 | OAuth identity resolution | 3h | P1 |

### Epic 5.3: Account Linking

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 5.3.1 | Link OAuth accounts to user | 3h | P1 |
| 5.3.2 | Unlink accounts | 2h | P1 |
| 5.3.3 | Primary account designation | 2h | P2 |
| 5.3.4 | Conflict resolution | 3h | P1 |

---

## Milestone Summary

| Milestone | Target | Deliverables |
|-----------|--------|--------------|
| **M1: Auth Complete** | Week 2 | Sessions, MFA, OAuth, Passkeys |
| **M2: Permissions Complete** | Week 3 | RBAC, ABAC, Gates |
| **M3: Multi-Tenant Ready** | Week 3 | Ventures, Orgs, Scoping |
| **M4: User Management** | Week 4 | Profiles, Invites, Impersonation |
| **M5: SSO Ready** | Week 5 | Cross-venture SSO, Linking |

---

## Dependencies

### Upstream (Required)
- @mcv/kernel (db, config, logger, errors, context)

### Downstream (Depends on this)
- All Tier 2+ packages
- Every business domain package

### External
- Better Auth library
- Twilio (SMS MFA)
- OAuth provider apps configured

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Session hijacking | Secure cookies, CSRF tokens |
| Password storage | Argon2id hashing |
| Brute force | Rate limiting, account lockout |
| Token leakage | Short expiry, refresh rotation |
| Privilege escalation | Strict permission checks |

---

## Success Criteria

- [ ] All auth flows working end-to-end
- [ ] MFA enrollment and verification functional
- [ ] RBAC/ABAC policies enforced correctly
- [ ] Complete tenant isolation verified
- [ ] SSO between ventures working
- [ ] 90%+ test coverage on security-critical code

---

*@mcv/identity — Implementation Plan v1.0*
