# Agent Prompts for Documentation Sprint

Use these prompts in terminal Claude Code or Gemini CLI sessions.

---

## Master Prompt (Copy this to start any session)

```
You are an enterprise documentation engineer working on the MCV.ONE SDK.

## YOUR TASK
Write comprehensive MODULE.md documentation for a specific module.

## QUALITY STANDARD
Your output MUST match the quality of this reference file:
C:\Users\moust\mcv\docs-v2\tier-1-identity\auth\MODULE.md

That file is 700+ lines with:
- Complete database schemas (every column, type, index, constraint)
- Full TypeScript interfaces (every field documented)
- Production-ready code examples (copy-paste ready)
- Configuration tables with dev/prod values
- Error codes with HTTP statuses
- Security considerations
- Audit events table
- Dependencies with versions

## CRITICAL RULES
1. MINIMUM 500 lines - shallow docs are useless
2. Read the actual source code before writing
3. Use PowerShell commands only (Windows machine)
4. Every interface needs every field
5. Every table needs every column with types
6. Code examples must be complete and runnable

## SOURCE LOCATIONS
- Packages: C:\Users\moust\Documents\GitHub\mcv-one-admin-prototype\packages\
- V1 Docs: C:\Users\moust\mcv\docs\
- V2 Docs: C:\Users\moust\mcv\docs-v2\

## OUTPUT LOCATION
C:\Users\moust\mcv\docs-v2\{tier}\{module}\MODULE.md
```

---

## Tier-Specific Prompts

### TIER 1: IDENTITY (permissions, tenants, users, sso)

```
MODULE: @mcv/identity/permissions
SOURCE: C:\Users\moust\Documents\GitHub\mcv-one-admin-prototype\packages\permissions\src\
OUTPUT: C:\Users\moust\mcv\docs-v2\tier-1-identity\permissions\MODULE.md

Document the authorization system:
- RBAC role hierarchy (super_admin → venture_owner → venture_admin → venture_manager → venture_member)
- Permission format (action:resource:field)
- CASL ability definitions
- Permission checking middleware
- Role assignment and inheritance
- Resource-level permissions (object ACLs)
- Permission caching strategy
- Full database schema for roles, user_roles, permissions, resource_permissions tables
```

```
MODULE: @mcv/identity/tenants
SOURCE: C:\Users\moust\Documents\GitHub\mcv-one-admin-prototype\packages\tenants\src\
OUTPUT: C:\Users\moust\mcv\docs-v2\tier-1-identity\tenants\MODULE.md

Document multi-tenancy:
- Venture CRUD operations
- Workspace hierarchy (venture → workspace → project)
- Venture context middleware (how every query gets scoped)
- Row-Level Security implementation
- Subscription tiers and feature gating
- Custom domain management
- Cross-venture operations for super admins
- Full database schema for ventures, workspaces, venture_domains, venture_subscriptions tables
```

```
MODULE: @mcv/identity/users
SOURCE: C:\Users\moust\Documents\GitHub\mcv-one-admin-prototype\packages\users\src\
OUTPUT: C:\Users\moust\mcv\docs-v2\tier-1-identity\users\MODULE.md

Document user management:
- User CRUD with profile layers (global + per-venture)
- User search and discovery
- Invitation system (create, accept, revoke)
- Impersonation (admin switching with audit trail)
- Account lifecycle (pending → active → suspended → deleted)
- User preferences storage
- Full database schema for users, user_venture_profiles, user_preferences, invitations tables
```

```
MODULE: @mcv/identity/sso
SOURCE: C:\Users\moust\Documents\GitHub\mcv-one-admin-prototype\packages\auth\src\ (SSO portions)
OUTPUT: C:\Users\moust\mcv\docs-v2\tier-1-identity\sso\MODULE.md

Document single sign-on:
- Cross-venture SSO flow (how login in one venture works in others)
- SAML 2.0 integration for enterprise IdPs
- OIDC provider mode (MCV as IdP)
- Identity resolution and account linking
- Session synchronization across ventures
- JIT provisioning configuration
- Full database schema for sso_configs, linked_identities, oidc_clients tables
```

---

### TIER 2: FABRIC (9 modules)

```
MODULE: @mcv/fabric/audit
SOURCE: C:\Users\moust\Documents\GitHub\mcv-one-admin-prototype\packages\audit\src\
OUTPUT: C:\Users\moust\mcv\docs-v2\tier-2-fabric\audit\MODULE.md

Document audit logging:
- Audit entry structure (full interface)
- Automatic CRUD logging middleware
- Immutable log storage with checksums
- Query API for searching logs
- Retention policies (7-year compliance)
- Change tracking (before/after diffs)
- Export for compliance reports
- Full database schema for audit_logs table (partitioned)
```

```
MODULE: @mcv/fabric/notifications
SOURCE: C:\Users\moust\Documents\GitHub\mcv-one-admin-prototype\packages\notifications\src\
OUTPUT: C:\Users\moust\mcv\docs-v2\tier-2-fabric\notifications\MODULE.md

Document notification system:
- Multi-channel delivery (in-app, email, push, SMS, Slack)
- Template system with variables
- User preference management
- Batching and digest configuration
- Delivery tracking and retry
- Scheduling (send later)
- Full database schema for notifications, notification_deliveries, notification_templates, notification_preferences tables
```

```
MODULE: @mcv/fabric/realtime
SOURCE: C:\Users\moust\Documents\GitHub\mcv-one-admin-prototype\packages\realtime\src\
OUTPUT: C:\Users\moust\mcv\docs-v2\tier-2-fabric\realtime\MODULE.md

Document real-time system:
- WebSocket connection management
- Channel pub/sub patterns
- Presence tracking (who's online)
- Database change subscriptions (Postgres → clients)
- Rate limiting per connection
- Reconnection handling
- Full channel type definitions and usage patterns
```

---

### TIER 4: INTELLIGENCE (AI modules)

```
MODULE: @mcv/intelligence/gateway
SOURCE: C:\Users\moust\Documents\GitHub\mcv-one-admin-prototype\packages\gateway\src\
OUTPUT: C:\Users\moust\mcv\docs-v2\tier-4-intelligence\gateway\MODULE.md

Document AI gateway:
- Multi-provider routing (OpenAI, Anthropic, OpenRouter)
- Model configuration and fallbacks
- Request/response normalization
- Streaming support
- Token counting and cost tracking
- Rate limiting per venture
- Caching for identical requests
- Full database schema for ai_requests, ai_usage tables
```

```
MODULE: @mcv/intelligence/rag
SOURCE: C:\Users\moust\Documents\GitHub\mcv-one-admin-prototype\packages\rag\src\
OUTPUT: C:\Users\moust\mcv\docs-v2\tier-4-intelligence\rag\MODULE.md

Document RAG system:
- Document ingestion pipeline (PDF, web, text)
- Chunking strategies (semantic, fixed, recursive)
- Embedding generation and storage
- Vector search with pgvector
- Hybrid search (vector + keyword)
- Context assembly for LLM
- Source attribution
- Full database schema for documents, chunks, embeddings tables
```

---

## Package → Module Mapping

| Package Dir | Tier | Module Path |
|-------------|------|-------------|
| auth | 1-identity | auth/ |
| permissions | 1-identity | permissions/ |
| tenants | 1-identity | tenants/ |
| users | 1-identity | users/ |
| audit | 2-fabric | audit/ |
| realtime | 2-fabric | realtime/ |
| notifications | 2-fabric | notifications/ |
| flags | 2-fabric | flags/ |
| storage | 2-fabric | storage/ |
| gateway | 4-intelligence | gateway/ |
| rag | 4-intelligence | rag/ |
| embed | 4-intelligence | embed/ |
| google | 3-connectors | google/ |
| github | 3-connectors | github/ |
| payments | 3-connectors | payments/ |
| twilio | 3-connectors | voice/ |
| email | 3-connectors | email/ |

---

## After Completing Each Module

1. Verify line count: `(Get-Content path\MODULE.md).Count`
2. Should be 500+ lines
3. Update DOCUMENTATION-SPRINT.md progress table

---
