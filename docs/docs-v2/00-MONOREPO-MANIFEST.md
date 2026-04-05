# MCV.ONE Monorepo Manifest

> **Status**: APPROVED BLUEPRINT (Ready for Reification)
> **Target Directory**: `C:\Users\moust\mcv\mcv-one`
> **Purpose**: This document serves as the absolute source of truth for the directory structure, package naming, and dependency graph of the new monorepo.

---

## 1. Technology Stack (The Invariants)

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Monorepo Manager** | Turborepo | v2.x | Orchestration, caching, remote execution. |
| **Package Manager** | pnpm | v9.x | Workspaces, strict dependency hoisting. |
| **Framework** | Next.js | v15 (App Router) | React Server Components, Server Actions. |
| **Language** | TypeScript | v5.x | Strict mode by default. |
| **Database** | Supabase | Postgres 15+ | Transaction pooler, RLS, Realtime. |
| **ORM** | Drizzle | v0.30+ | Type-safe SQL schema and migrations. |
| **Validation** | Zod | v3.x | Runtime schema validation. |
| **Styling** | Tailwind CSS | v4.x | Utility-first CSS. |
| **Components** | Radix UI / HeroUI | Latest | Accessible primitives. |
| **Testing** | Vitest | Latest | Unit and integration testing. |

---

## 2. Directory Structure

The monorepo follows a strict **"Apps consume Packages"** hierarchy.

```text
mcv-one/
├── .github/                   # CI/CD workflows (Actions)
├── .vscode/                   # Shared editor settings
├── apps/
│   ├── web/                   # Main Admin & App Portal (Next.js 15)
│   ├── docs/                  # Documentation Site (Nextra/Starlight)
│   └── storybook/             # UI Component Library (Storybook 8)
├── packages/
│   ├── kernel/                # Tier 0: @mcv/kernel (Config, Logger, Types)
│   ├── identity/              # Tier 1: @mcv/identity (Auth, Perms, Tenants)
│   ├── fabric/                # Tier 2: @mcv/fabric (Events, Queue, Storage)
│   ├── shared/                # Tier 2.5: @mcv/shared (Utils, Validation)
│   ├── connectors/            # Tier 3: @mcv/connectors (Stripe, SendGrid)
│   ├── intelligence/          # Tier 4: @mcv/intelligence (AI Gateway, RAG)
│   └── domains/               # Tier 5: @mcv/nexus, @mcv/commerce, etc.
├── tooling/
│   ├── eslint-config/         # Shared ESLint configurations
│   ├── tailwind-config/       # Shared Tailwind theme/presets
│   ├── tsconfig/              # Shared TypeScript bases
│   └── ui/                    # Tier 6: @mcv/ui (Design System)
├── .npmrc                     # Strict hoisting config
├── package.json               # Root scripts
├── pnpm-workspace.yaml        # Workspace definitions
└── turbo.json                 # Pipeline definitions
```

---

## 3. Package Registry & Scoping

All internal packages use the `@mcv/*` scope.

| Tier | Package Name | Location | Dependencies Allowed |
|------|--------------|----------|----------------------|
| **T0** | `@mcv/kernel` | `packages/kernel` | *None (Node stdlib only)* |
| **T1** | `@mcv/identity` | `packages/identity` | `@mcv/kernel`, `@mcv/db` |
| **T2** | `@mcv/fabric` | `packages/fabric` | `@mcv/identity` |
| **T2.5**| `@mcv/shared` | `packages/shared` | `@mcv/fabric` |
| **T3** | `@mcv/connectors`| `packages/connectors` | `@mcv/shared` |
| **T4** | `@mcv/intelligence`| `packages/intelligence`| `@mcv/connectors` |
| **T5** | `@mcv/nexus` | `packages/domains/nexus` | `@mcv/intelligence` |
| **T5** | `@mcv/growth` | `packages/domains/growth`| `@mcv/intelligence` |
| **T5** | `@mcv/commerce` | `packages/domains/commerce`| `@mcv/intelligence` |
| **T6** | `@mcv/ui` | `tooling/ui` | *Peer Deps only* |
| **App**| `web` | `apps/web` | *All Packages* |

> **Note**: Tier 5 domains (Nexus, Growth, Commerce) are **siblings** and should generally not import each other directly to prevent circular dependencies. If they need to communicate, they must use the **Event Bus** (`@mcv/fabric/events`).

---

## 4. Configuration Templates

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "packages/domains/*"
  - "tooling/*"
```

### `turbo.json` (Draft)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    }
  }
}
```

---

## 5. Architectural Invariants

1.  **Strict Boundaries**: Lower tiers **NEVER** import from higher tiers.
    *   ❌ `@mcv/kernel` importing `@mcv/identity`
    *   ✅ `@mcv/identity` importing `@mcv/kernel`
2.  **Database Access**: Only `@mcv/db` (part of Kernel) and Tier 1 (Identity) should touch the database directly via Drizzle. All other tiers should use the **Service Layer** pattern exposed by lower tiers.
3.  **Client/Server Split**: Code intended for the browser (Tier 6, React hooks) must be strictly separated from Node.js-only code (Tier 0-5) using `server-only` and `client-only` package guards.
4.  **Event-Driven**: Cross-domain communication (e.g., Commerce telling Nexus a deal closed) **MUST** happen via the Event Bus, not direct service calls.
