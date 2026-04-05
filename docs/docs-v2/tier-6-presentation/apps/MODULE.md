# @mcv/apps — Applications Module

**Parent Package:** @mcv/presentation  
**Tier:** 6 (Presentation Layer)  
**Classification:** PRIVATE  
**Version:** 0.1.0  
**Last Updated:** February 8, 2026

---

## Purpose

The `apps` module is the **crown jewel of the MCV.ONE platform** — the Tier 6 Presentation layer that puts every other tier's capabilities into the hands of human operators. It houses the Next.js 15 applications that serve as the primary user interfaces for the entire MCV Global Consortium: the **Super-Admin Command Center** (169 pages, 75 API routes), the planned **Venture Admin** portal, the public **Marketing Website**, and the **Documentation Site**.

**This is the single entry point through which every executive, operator, venture admin, and AI supervisor interacts with the MCV ecosystem.**

Every venture in the consortium — BetEdge AI, EdgeIQ Markets, MCV Gaming, MCV Agency, MCV Sentinel — is managed, monitored, configured, and controlled from this application. Every AI agent swarm is observed here. Every treasury operation, CRM pipeline, invoice, document, feature flag, and user permission flows through these interfaces. The Super-Admin app is not just an admin panel; it is a **Portfolio Command & Control Center** — a Tier 0 Executive Interface designed for the operators who run a multi-venture technology consortium.

The presentation layer sits at the apex of the dependency tree, consuming services from every tier below:

```
Tier 6 — APPS (You Are Here)
  ├── Tier 5 — Domain modules (finance, CRM, catalog, etc.)
  ├── Tier 4 — Features (auth, flags, notifications, permissions, AI)
  ├── Tier 3 — API Layer (tRPC routers, gateway)
  ├── Tier 2 — Infrastructure (db, storage, realtime, config)
  ├── Tier 1 — Foundation (shared types, utilities)
  └── Tier 0 — Core (runtime, logging)
```

---

## Applications Overview

| App | Package | Purpose | Port | Status |
|-----|---------|---------|------|--------|
| **Super-Admin** | `@mcv/admin` | MCV Consortium Command Center — Tier 0 Executive Interface | 3000 | Active Development |
| **Venture Admin** | `@mcv/venture-admin` | Individual venture administration portal (tenant-scoped) | 3001 | Planned |
| **Web** | `@mcv/web` | Public marketing site, portfolio showcase, investor materials | 3002 | Planned |
| **Docs** | `@mcv/docs` | Developer documentation, API reference, changelog | 3003 | Planned |

---

## Technology Stack

### Core Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 15.0.7 | App Router, React Server Components, API Routes, Middleware |
| **React** | 18.3.1 | Component rendering (React 19 compatible via Next 15) |
| **TypeScript** | 5.6.3 | End-to-end type safety |
| **Tailwind CSS** | 4.1.18 | Utility-first CSS framework (v4 with PostCSS) |
| **pnpm** | 9.15.0 | Package manager (workspace protocol for monorepo) |

### UI Component Libraries

| Library | Purpose |
|---------|---------|
| **HeroUI** (v2.8.7) | Primary component library — accordion, avatar, badge, breadcrumbs, button, card, checkbox, chip, divider, dropdown, image, input, kbd, link, listbox, modal, navbar, number-input, popover, progress, scroll-shadow, select, skeleton, snippet, spacer, spinner, switch, table, tabs, tooltip, user |
| **Radix UI** | Headless primitives — accordion, alert-dialog, collapsible, context-menu, dialog, dropdown-menu, hover-card, popover, select, slot, tabs, toast, tooltip |
| **Lucide React** (0.563.0) | Icon library — 1000+ icons used throughout navigation and UI |
| **Iconify React** (5.0.2) | Extended icon sets for specialized module iconography |
| **Framer Motion** (11.11.17) | Animations, page transitions, micro-interactions |

### Data & State Management

| Library | Purpose |
|---------|---------|
| **tRPC** (v11 RC) | End-to-end typesafe API client (`@trpc/client`, `@trpc/react-query`, `@trpc/server`) |
| **TanStack React Query** (5.90.19) | Server state management, caching, background refetching |
| **TanStack React Table** (8.21.3) | Headless table primitives for data grids across all modules |
| **Zustand** (5.0.1) | Client-side state management (navigation, auth UI, CRM, AI command, etc.) |
| **nuqs** (2.8.6) | Type-safe URL query state management |
| **SuperJSON** (2.2.6) | Serialization for tRPC (dates, Maps, Sets, BigInts) |

### Authentication & Security

| Library | Purpose |
|---------|---------|
| **Better Auth** (via `@mcv/auth`) | Session management, OAuth, MFA, magic links |
| **@simplewebauthn/browser** (v11) | WebAuthn/Passkey support for passwordless login |
| **@upstash/ratelimit** (2.0.8) | Distributed rate limiting (Redis-backed) |
| **@upstash/redis** (1.36.1) | Redis client for rate limiting and caching |
| **@t3-oss/env-nextjs** (0.13.10) | Runtime environment variable validation |
| **Zod** (4.3.6) | Schema validation for forms, API inputs, env vars |

### Rich Content & Editors

| Library | Purpose |
|---------|---------|
| **TipTap** (2.4.0) | Rich text editor — Document Studio with image, link, placeholder, text-align, underline, markdown extensions |
| **Shiki** (1.22.2) | Syntax highlighting for code blocks |
| **React Markdown** (9.0.1) | Markdown rendering with GFM support |
| **react-dropzone** (14.0.0) | File upload with drag-and-drop |

### Data Visualization & Interaction

| Library | Purpose |
|---------|---------|
| **Recharts** (2.13.3) | Charts and graphs for analytics, dashboards, financial reports |
| **@xyflow/react** (12.3.5) | Flow diagrams for workflow builder, AI swarm visualization |
| **@vis.gl/react-google-maps** (1.7.1) | Map visualizations for geospatial data |
| **@dnd-kit** (core, sortable, modifiers, utilities) | Drag-and-drop for kanban boards, sortable lists, reordering |
| **canvas-confetti** (1.9.4) | Celebration animations for milestone achievements |

### Forms

| Library | Purpose |
|---------|---------|
| **React Hook Form** (7.71.1) | Performant form management with minimal re-renders |
| **@hookform/resolvers** (5.2.2) | Zod schema integration for form validation |
| **cmdk** (1.1.1) | Command palette / command menu (⌘K) |

### Utilities

| Library | Purpose |
|---------|---------|
| **date-fns** (4.1.0) | Date manipulation and formatting |
| **clsx** (2.1.1) | Conditional className construction |
| **tailwind-merge** (2.5.4) | Intelligent Tailwind class merging |
| **class-variance-authority** (0.7.1) | Component variant management |
| **Sonner** (2.0.7) | Toast notifications |
| **next-themes** (0.4.3) | Theme management (dark mode default) |

### Development & Testing

| Tool | Purpose |
|------|---------|
| **Storybook** (8.6.14) | Component development, visual testing, design system documentation |
| **Playwright** | End-to-end testing |
| **ESLint** (9.14.0) | Linting with Next.js config |
| **Prettier** | Code formatting |
| **Turbo** (2.3.0) | Monorepo build orchestration |
| **Vite** (6.4.1) | Storybook bundler |

---

## Workspace Dependencies

The Super-Admin app consumes the following internal MCV packages via pnpm workspace protocol:

```
workspace:* dependencies
├── @mcv/activity          — Activity feed, engagement tracking
├── @mcv/ai                — AI/LLM integrations, agent framework
├── @mcv/api               — tRPC router definitions, API layer
├── @mcv/audit             — Audit logging, compliance trail
├── @mcv/auth              — Authentication (Better Auth), session management
├── @mcv/config            — Shared configuration, environment schemas
├── @mcv/db                — Database client (Drizzle ORM), schema definitions
├── @mcv/flags             — Feature flag evaluation, targeting rules
├── @mcv/gateway           — AI Gateway, model routing, rate limiting
├── @mcv/notifications     — Push notifications, email, in-app alerts
├── @mcv/permissions       — RBAC, permission gates, role guards
├── @mcv/rag               — Retrieval-Augmented Generation, knowledge base
├── @mcv/realtime          — WebSocket/SSE, live updates, presence
├── @mcv/storage           — File storage (S3/Supabase), upload management
├── @mcv/tenants           — Multi-tenancy, venture context, theme injection
├── @mcv/ui                — Shared UI components (MCVShell, design system)
├── @mcv/users             — User management, profiles, invitations
```

---

## Source Structure

```
apps/admin/
├── next.config.ts                    # Next.js configuration (transpilePackages, webpack aliases)
├── package.json                      # Dependencies and scripts
├── postcss.config.mjs                # PostCSS with Tailwind CSS v4
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.ts                # Tailwind theme customization
├── .env.example                      # Environment variable template
│
└── src/
    ├── middleware.ts                  # Edge middleware (auth, rate limiting, security headers)
    │
    ├── app/                          # Next.js App Router — all routes
    │   ├── layout.tsx                # Root layout (fonts, metadata, Providers wrapper)
    │   ├── (auth)/                   # Auth route group (no shell)
    │   ├── (dashboard)/              # Dashboard route group (MCVShell with sidebar/header)
    │   │   ├── layout.tsx            # Dashboard layout (sidebar, header, breadcrumbs, command menu)
    │   │   ├── (global)/             # Tier 0 Super Admin routes
    │   │   │   ├── layout.tsx        # Global context provider
    │   │   │   ├── admin/            # Administration module
    │   │   │   ├── ai-command/       # AI Command Center
    │   │   │   ├── analytics/        # Analytics dashboard
    │   │   │   ├── approvals/        # Approval workflows
    │   │   │   ├── catalog/          # Product catalog management
    │   │   │   ├── contact-center/   # Contact center (inbox, dialer)
    │   │   │   ├── crm/              # Customer Relationship Management
    │   │   │   ├── documents/        # Document Studio
    │   │   │   ├── engineering/      # Engineering Workbench
    │   │   │   ├── grants/           # Grant Concierge
    │   │   │   ├── integrations/     # Third-party integrations
    │   │   │   ├── intelligence/     # Intelligence Hub
    │   │   │   ├── invoicing/        # Advanced invoicing system
    │   │   │   ├── knowledge/        # Knowledge base & docs
    │   │   │   ├── onboarding/       # User/venture onboarding
    │   │   │   ├── ops/              # Operations Center
    │   │   │   ├── platform/         # Platform management (Forge, assets)
    │   │   │   ├── portfolio/        # Venture portfolio management
    │   │   │   ├── portfolio-health/ # Portfolio health dashboard
    │   │   │   ├── settings/         # Global settings
    │   │   │   ├── signals/          # Live signal feed
    │   │   │   ├── strategy/         # Strategy & vision
    │   │   │   ├── swarm/            # AI swarm management
    │   │   │   ├── tasks/            # Task management
    │   │   │   ├── token-economy/    # EDGE token ecosystem
    │   │   │   ├── treasury/         # Treasury & financial ops
    │   │   │   └── workflows/        # Workflow builder
    │   │   ├── cms/                  # Content Management System
    │   │   ├── media/                # Media library
    │   │   └── v/[ventureSlug]/      # Venture-scoped routes (Tier 1)
    │   ├── (public)/                 # Public routes (no auth required)
    │   │   └── portfolio/            # Public portfolio view
    │   ├── api/                      # API route handlers (75 routes)
    │   ├── forbidden/                # 403 Forbidden page
    │   └── maintenance/              # Maintenance mode page
    │
    ├── components/                   # Shared components
    │   ├── layout/                   # Shell components
    │   │   ├── app-shell.tsx         # Main application shell
    │   │   ├── app-sidebar.tsx       # Application sidebar
    │   │   ├── header.tsx            # Top header bar
    │   │   ├── sidebar.tsx           # Sidebar primitives
    │   │   └── primitives.ts         # Layout primitive utilities
    │   ├── providers.tsx             # Root provider composition
    │   └── command-menu/             # Global command palette (⌘K)
    │
    ├── entities/                     # Domain entity definitions
    │   ├── navigation/               # Navigation entity types
    │   ├── user/                      # User entity types
    │   └── venture/                   # Venture entity types
    │
    ├── features/                     # Feature modules (FSD pattern)
    │   ├── ai-command/               # AI agent management
    │   ├── auth/                     # Authentication flows
    │   ├── calendar/                 # Calendar views
    │   ├── catalog/                  # Product catalog
    │   ├── cms/                      # Content management
    │   ├── contact-center/           # Contact center
    │   ├── context-switcher/         # Global ↔ Venture context switching
    │   ├── crm/                      # CRM pipeline & contacts
    │   ├── dashboard/                # Dashboard widgets
    │   ├── document-editor/          # TipTap-based document editor
    │   ├── email/                    # Email template management
    │   ├── engineering/              # Engineering workbench
    │   ├── forms/                    # Dynamic form builder
    │   ├── gateway/                  # AI Gateway management
    │   ├── grant-concierge/          # Grant tracking & applications
    │   ├── integrations/             # Third-party integrations
    │   ├── intelligence/             # Intelligence & analytics
    │   ├── invoicing/                # Invoice management
    │   ├── knowledge/                # Knowledge base
    │   ├── marketing/                # Marketing campaigns & studio
    │   ├── naos/                     # NAOS (header ticker, AI registry)
    │   ├── notifications/            # In-app notification system
    │   ├── payments/                 # Payment processing
    │   ├── platform/                 # Platform management
    │   ├── portfolio/                # Venture portfolio
    │   ├── rag/                      # RAG / knowledge retrieval
    │   ├── reputation/               # Reputation system
    │   ├── strategy/                 # Strategy & roadmap
    │   ├── tasks/                    # Task & project management
    │   ├── token-economy/            # Token economy dashboards
    │   ├── treasury/                 # Treasury operations
    │   ├── ventures/                 # Venture management
    │   ├── workbench/                # Engineering workbench tools
    │   └── workflows/                # Workflow builder
    │
    ├── hooks/                        # Custom React hooks
    │   ├── use-controllable-state.ts # Controlled/uncontrolled component state
    │   ├── use-live-query.ts         # Live/streaming query support
    │   ├── use-presence.ts           # User presence tracking
    │   ├── use-query.ts              # Enhanced query hook
    │   ├── use-realtime.ts           # WebSocket/SSE subscriptions
    │   └── use-url-state.ts          # URL-synced state management
    │
    ├── lib/                          # Library utilities
    │   ├── auth.ts                   # Auth helper functions
    │   ├── date.ts                   # Date formatting utilities
    │   ├── format.ts                 # Number/currency formatting
    │   ├── mock-db.ts                # Development mock data
    │   ├── utils.ts                  # General utilities (cn, etc.)
    │   └── trpc/                     # tRPC client configuration
    │
    ├── providers/                    # React Context Providers
    │   ├── auth-context.tsx          # Authentication state & methods
    │   ├── global-context-provider.tsx # Global navigation context
    │   ├── query-provider.tsx        # React Query configuration
    │   ├── realtime-provider.tsx     # Realtime WebSocket provider
    │   ├── trpc-provider.tsx         # tRPC + React Query setup
    │   ├── venture-context.tsx       # Venture theme & context ("Chameleon Engine")
    │   └── venture-provider.tsx      # Venture data provider
    │
    ├── shared/                       # Shared configuration & types
    │   ├── config/
    │   │   └── navigation/           # Navigation configuration
    │   │       ├── global-nav.ts     # Layer 0 — Super Admin global nav
    │   │       ├── venture-nav.ts    # Layer 1 — Venture-scoped nav
    │   │       ├── module-nav.ts     # Layer 2 — Module deep-dive nav
    │   │       ├── ventures.ts       # Venture registry & branding
    │   │       ├── helpers.ts        # Navigation utility functions
    │   │       └── types.ts          # Navigation type definitions
    │   ├── dnd/                      # Drag-and-drop utilities
    │   ├── lib/                      # Shared library code
    │   └── types/                    # Shared TypeScript types
    │
    ├── stores/                       # Zustand state stores
    │   ├── auth-store.ts             # Auth UI state (modals, preferences, trusted devices)
    │   ├── navigation-store.ts       # Navigation state (layers, breadcrumbs, sidebar, venture context)
    │   ├── ai-command-store.ts       # AI Command Center state
    │   ├── campaign-wizard-store.ts  # Marketing campaign wizard state
    │   ├── cart-store.ts             # E-commerce cart state
    │   ├── content-pipeline-store.ts # Content publishing pipeline state
    │   ├── crm-store.ts             # CRM pipeline & deal state
    │   ├── intelligence-store.ts     # Intelligence module state
    │   ├── portfolio-store.ts        # Portfolio view state
    │   └── wishlist-store.ts         # Product wishlist state
    │
    ├── styles/                       # Global styles
    │   └── globals.css               # Tailwind directives, CSS variables, custom styles
    │
    ├── utils/                        # Utility functions
    │   └── navigation-helpers.ts     # Navigation path resolution
    │
    └── widgets/                      # Composite widget components
        ├── command-center/           # Command center widget
        ├── sidebar/                  # Sidebar widget
        └── venture-card/             # Venture card widget
```

---

## Architecture

### Next.js App Router Architecture

The Super-Admin app uses the **Next.js 15 App Router** with route groups, nested layouts, and parallel routes to create a multi-context application within a single deployment.

#### Route Group Strategy

```
app/
├── (auth)/              # Route Group: Authentication
│                        #   → No shell (minimal layout)
│                        #   → Public access (no session required)
│
├── (dashboard)/         # Route Group: Dashboard
│   ├── (global)/        # Nested Group: Super Admin (Tier 0)
│   │                    #   → GlobalContextProvider wraps all children
│   │                    #   → Full MCVShell with sidebar + header
│   │
│   ├── cms/             # Content Management (shares dashboard layout)
│   ├── media/           # Media Library (shares dashboard layout)
│   │
│   └── v/[ventureSlug]/ # Dynamic: Venture Context (Tier 1)
│                        #   → VentureContextProvider wraps children
│                        #   → Sidebar/theme adapt to venture branding
│
├── (public)/            # Route Group: Public Pages
│                        #   → No auth required
│                        #   → Minimal or marketing layout
│
├── api/                 # API Routes
│                        #   → tRPC handler, REST endpoints, webhooks
│
├── forbidden/           # Static: 403 Forbidden
└── maintenance/         # Static: Maintenance Mode
```

#### Layout Nesting Hierarchy

The application employs a **five-level layout nesting** strategy:

```
RootLayout (layout.tsx)
│  ├── Fonts: Inter (body), JetBrains Mono (code)
│  ├── Metadata: "MCV.ONE Super Admin"
│  ├── Theme: Dark mode (default, forced via className)
│  └── Providers: TRPCProvider → HeroUIProvider → NextThemesProvider
│                 → AuthProvider → VentureProvider → NotificationProvider
│
├── AuthLayout — (auth)/layout.tsx
│  └── Minimal centered layout, no sidebar/header
│
├── DashboardLayout — (dashboard)/layout.tsx
│  ├── VentureContextProvider
│  ├── PermissionsProvider (RBAC context)
│  ├── MCVShell (sidebar + header + breadcrumbs)
│  ├── CommandMenu (⌘K global search)
│  ├── HeaderTicker (NAOS live signal feed)
│  │
│  ├── GlobalLayout — (global)/layout.tsx
│  │  └── GlobalContextProvider (layer="global")
│  │
│  │  ├── AdminLayout — admin/layout.tsx
│  │  ├── CRMLayout — crm/layout.tsx
│  │  ├── CatalogLayout — catalog/layout.tsx
│  │  ├── SettingsLayout — settings/layout.tsx
│  │  ├── StrategyLayout — strategy/layout.tsx
│  │  ├── AICommandLayout — ai-command/layout.tsx
│  │  ├── WorkflowsLayout — workflows/layout.tsx
│  │  ├── PortfolioLayout — portfolio/layout.tsx
│  │  ├── KnowledgeLayout — knowledge/layout.tsx
│  │  ├── PlatformLayout — platform/layout.tsx
│  │  ├── TreasuryLayout — treasury/layout.tsx
│  │  ├── TokenEconomyLayout — token-economy/layout.tsx
│  │  ├── EngineeringLayout — engineering/workbench/layout.tsx
│  │  ├── GrantsLayout — grants/layout.tsx
│  │  ├── IntelligenceLayout — intelligence/layout.tsx
│  │  └── MarketingLayout — admin/marketing/layout.tsx
│  │
│  └── VentureLayout — v/[ventureSlug]/layout.tsx
│     └── Venture-scoped context with dynamic theming
│
└── PublicLayout — (public)/layout.tsx
   └── Portfolio public view
```

#### Module Layout Pattern

Each major module within `(global)/` follows a consistent layout pattern:

```typescript
// Example: (global)/crm/layout.tsx
export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleContextProvider module="crm">
      <ModuleNavigation tabs={crmTabs} />
      {children}
    </ModuleContextProvider>
  );
}
```

Module layouts provide:
- **Tab navigation** within the module (contacts, deals, organizations, etc.)
- **Module-specific context** (active filters, view preferences)
- **Breadcrumb integration** with the global navigation system
- **Permission gating** at the module level

---

### Provider Architecture

The application uses a carefully ordered **provider composition** pattern in `components/providers.tsx`:

```typescript
<TRPCProvider>                    // 1. API client (outermost — everything needs data)
  <HeroUIProvider>                // 2. UI component library (routing integration)
    <NextThemesProvider>          // 3. Theme management (dark mode)
      <AuthProvider>              // 4. Authentication state (session, user)
        <VentureProvider>         // 5. Multi-tenancy context ("Chameleon Engine")
          <NotificationProvider>  // 6. In-app notifications
            <NotificationManager /> // Notification toast renderer
            {children}
          </NotificationProvider>
        </VentureProvider>
      </AuthProvider>
    </NextThemesProvider>
  </HeroUIProvider>
</TRPCProvider>
```

**Why this order matters:**
1. **TRPCProvider** must be outermost because AuthProvider uses `trpc.auth.me.useQuery()` to fetch RBAC data
2. **HeroUIProvider** receives `router.push` for client-side navigation
3. **NextThemesProvider** forces dark mode (`defaultTheme="dark"`, `enableSystem={false}`)
4. **AuthProvider** depends on tRPC for session enrichment and provides user context downstream
5. **VentureProvider** (from `@mcv/tenants/client`) reads auth context to determine venture access and injects venture theming
6. **NotificationProvider** needs both auth (who to notify) and venture context (which venture's notifications)

#### Auth Provider Deep Dive

The `AuthProvider` implements a multi-stage authentication flow:

```
┌──────────────────────────────────────────────────────────────────┐
│                        AuthProvider                              │
│                                                                  │
│  1. Better Auth Session Hook (authClient.useSession())           │
│     └── Returns: session token, basic user info                  │
│                                                                  │
│  2. tRPC RBAC Query (trpc.auth.me.useQuery())                   │
│     └── Returns: tier, ventureAccess[], permissions[]            │
│     └── Enabled only when session exists                         │
│     └── 5-minute stale time for performance                      │
│                                                                  │
│  3. State Machine:                                               │
│     Loading → Authenticated (with full RBAC)                     │
│            → MFA Pending (redirect to /mfa/verify)               │
│            → Unauthenticated (redirect to /login)                │
│                                                                  │
│  4. Exposed Methods:                                             │
│     login(credentials) → signIn.email + redirect                 │
│     logout() → signOut + redirect to /login                      │
│     verifyMFA(code, trustDevice) → twoFactor.verify              │
│     refreshSession() → no-op (Better Auth handles)               │
│                                                                  │
│  5. Exported Hooks:                                              │
│     useAuth() → full context (state + methods)                   │
│     useIsAuthenticated() → boolean                               │
│     useCurrentUser() → User | null                               │
│     useAuthLoading() → boolean                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Venture Context — The "Chameleon Engine"

The Venture Context Provider (nicknamed the **Chameleon Engine**) handles the dual-context nature of the app. The Super-Admin operates in two modes:

- **Global Mode (Tier 0):** Portfolio-wide view across all ventures. Sidebar shows the full global navigation. Accent color is emerald green.
- **Venture Mode (Tier 1):** Scoped to a single venture. Sidebar adapts to show venture-specific navigation. The entire UI rebrands to the venture's color palette.

```typescript
// Venture Context exports
useVenture()           // Active venture or null
useVentureColor()      // Current venture's accent color
useContextMode()       // 'global' | 'venture'
useIsVenture()         // Boolean shorthand

// Context switching is handled by the navigation store
switchToGlobal()       // Reset to Tier 0
switchToVenture(slug)  // Enter Tier 1 for specific venture
```

The Chameleon Engine dynamically applies venture branding:

```typescript
// From shared/config/navigation/ventures.ts
ventures: {
  betedge: {
    slug: 'betedge',
    name: 'BetEdge AI',
    color: '#F59E0B',        // Amber — applied to sidebar accents, charts, badges
    accentColor: '#FBBF24',
    icon: 'TrendingUp',
    domain: 'betedge.app',
    adminDomain: 'betedge.mcv.one',
    category: 'consumer',
    hasEdgeToken: true,
    productSuite: { ... },   // Venture-specific navigation items
  },
  edgeiq: { color: '#8B5CF6', ... },  // Purple
  mcvgg:  { color: '#EF4444', ... },  // Red
  // ... additional ventures
}
```

---

### Navigation System

The navigation system is a **three-layer architecture** designed for the hierarchical nature of a multi-venture consortium:

#### Layer 0 — Global Navigation (Super Admin)

Available when no venture is selected. Provides portfolio-wide access to all modules:

| Section | Items | Description |
|---------|-------|-------------|
| **COMMAND CENTER** | Mission Control, Portfolio Health, Live Signals, Pending Approvals | Executive dashboard and real-time monitoring |
| **PORTFOLIO** | Venture Registry, Entity Management, Domain Portfolio, Capital Stack | Venture and corporate entity management |
| **STRATEGY** | Vision Board, Master Roadmap, M&A Pipeline, Investor Relations | Strategic planning and investor management |
| **TREASURY** | P&L Overview, Cash Operations, Tax & Compliance, Funding Rounds | Financial operations and treasury management |
| **TOKEN ECONOMY** | EDGE Dashboard, ACS Controllers, Staking Pools, Governance, Launchpad | Crypto token ecosystem management |
| **INTELLIGENCE** | Intelligence Hub, Entity Explorer, Knowledge Hub, Venture Profiles | AI-powered intelligence and analytics |
| **AI COMMAND** | Swarm Overview, Active Swarm, Queen Orchestrator, NAOS Registry, Agent Configs, Prompt Library, HITL Center | AI agent management and orchestration |
| **CRM** | Dashboard, Contacts, Organizations, Deals, Forecast, Data Quality | Customer relationship management |
| **ENGINEERING SUITE** | Ops Center, Workbench, The Forge, Docs & Releases | Development tools and infrastructure |
| **GRANT CONCIERGE** | Pipeline Tracker, Opportunity Scout, Deadline Calendar, Document Vault | Grant application management |
| **INVOICING** | Overview, Invoices, Proposals, Recurring, Estimates, Credit Notes, Approvals, Platform Fees | Financial document management |
| **PRODUCT CATALOG** | Overview, Products, Categories, Inventory, Discounts, Collections | E-commerce product management |
| **DOCUMENT STUDIO** | Template Gallery, Editor, Content Library, AI Content Assistant | Rich document creation |
| **CONTENT STUDIO** | Posts, Categories, Media Library | CMS for marketing content |
| **PLATFORM** | Module Marketplace, Asset Library, The Forge, Prompt Library, Integration Hub | Platform-level configuration |
| **KNOWLEDGE** | Documentation Hub, API Reference, Training Center, Changelog | Knowledge base and documentation |
| **ADMINISTRATION** | Venture Management, User Management, Roles & Permissions, Feature Flags, Invitations | System administration |
| **SETTINGS** | Workspace Settings, API Keys, Audit Log, Billing | User and workspace configuration |

#### Layer 1 — Venture Navigation

Available when a specific venture is selected (e.g., `/v/betedge`). Navigation adapts to show:
- Venture-specific product suite
- Venture operations (engineering, growth, tasks)
- Venture settings and configuration
- Venture-scoped versions of global modules

#### Layer 2 — Module Deep-Dive

Activated when entering a specific module. Provides sub-navigation within the module (e.g., CRM → Contacts, Deals, Pipeline, Forecast).

#### Navigation Store (Zustand)

The `useNavigationStore` is the central state manager for the entire navigation system:

```typescript
interface NavigationState {
  layer: 'global' | 'venture' | 'module';  // Current navigation layer
  currentVenture: VentureSlug | null;        // Active venture (null = global)
  globalSection: string;                      // Active section in global nav
  ventureSection: string;                     // Active section in venture nav
  activeModule: string | null;                // Deep-dive module
  moduleSubSection: string | null;            // Sub-section within module
  sidebarCollapsed: boolean;                  // Sidebar toggle state
  sidebarTransitioning: boolean;              // Animation state
  breadcrumbs: Breadcrumb[];                  // Dynamic breadcrumb trail
  recentVentures: VentureSlug[];              // Quick-switch history (max 5)
  workbenchActive: boolean;                   // Engineering workbench mode
  workbenchStage: 'genesis' | 'architecture' | 'planning' | 'execution' | null;
}
```

**Persistence:** The store uses Zustand's `persist` middleware with `localStorage`, selectively persisting only `sidebarCollapsed` and `recentVentures` to avoid stale navigation state on page reload.

---

## Route Catalog

### Authentication Routes — `(auth)/`

All auth routes render in a minimal centered layout without the dashboard shell.

| Route | Path | Description |
|-------|------|-------------|
| **Login** | `/login` | Email/password login with remember-me, social OAuth buttons |
| **Register** | `/register` | New account registration with email verification |
| **Forgot Password** | `/forgot-password` | Password reset request via email |
| **Reset Password** | `/reset-password` | Password reset form (from email link) |
| **Magic Link** | `/magic-link` | Passwordless login via email link |
| **MFA Setup** | `/mfa/setup` | Configure TOTP authenticator or WebAuthn/Passkey |
| **MFA Verify** | `/mfa/verify` | Enter MFA code during login |
| **OAuth Callback** | `/oauth/callback` | OAuth2 redirect handler (Google, GitHub, etc.) |
| **Verify Email** | `/verify-email` | Email verification confirmation page |

### Dashboard — Global Routes — `(dashboard)/(global)/`

#### Administration — `admin/`

| Route | Path | Description |
|-------|------|-------------|
| **User Management** | `/admin/users` | List, search, filter all platform users |
| **User Detail** | `/admin/users/[id]` | Individual user profile, roles, activity, sessions |
| **User Invitations** | `/admin/users/invitations` | Pending invitations, resend, revoke |
| **Role Management** | `/admin/roles` | Define roles, assign permissions, view role membership |
| **Permission Matrix** | `/admin/permissions` | Fine-grained permission management |
| **Venture Management** | `/admin/ventures` | All ventures list with status, health, key metrics |
| **Venture Detail** | `/admin/ventures/[id]` | Individual venture configuration and settings |
| **Create Venture** | `/admin/ventures/new` | New venture creation wizard |
| **Catalog Admin** | `/admin/catalog` | Product catalog administration |
| **Catalog Detail** | `/admin/catalog/[id]` | Individual product administration |
| **Catalog Categories** | `/admin/catalog/categories` | Category hierarchy management |
| **Customer Management** | `/admin/customers` | Customer list with filters |
| **Customer Detail** | `/admin/customers/[id]` | Individual customer profile and order history |
| **Order Management** | `/admin/orders` | Order list, status tracking, fulfillment |
| **Order Detail** | `/admin/orders/[id]` | Individual order details, timeline, actions |
| **Payment Management** | `/admin/payments` | Payment transactions, refunds, disputes |
| **Feature Flags** | `/admin/flags` | Feature flag management and targeting rules |
| **Flag Detail** | `/admin/flags/[id]` | Individual flag configuration, overrides, rollout |
| **Storage Management** | `/admin/storage` | File storage overview, quota management |
| **Notification Admin** | `/admin/notifications` | Notification templates and delivery configuration |
| **Email Management** | `/admin/email` | Email service configuration |
| **Email Templates** | `/admin/email/templates` | Email template editor and management |
| **Email Logs** | `/admin/email/logs` | Email delivery log and status tracking |
| **Gateway Admin** | `/admin/gateway` | AI Gateway configuration, model routing, budgets |
| **Activity Feed** | `/admin/activity` | Platform-wide activity stream |
| **Audit Log** | `/admin/audit` | Security audit trail with filters |
| **Audit Detail** | `/admin/audit/[id]` | Individual audit event details |

#### Administration — AI Command — `admin/command/`

| Route | Path | Description |
|-------|------|-------------|
| **Agent Configs** | `/admin/command/agents` | AI agent configuration management |
| **Approval Queue** | `/admin/command/approvals` | AI action approval workflows |
| **Automations** | `/admin/command/automations` | Automation rule management |
| **Knowledge Base** | `/admin/command/knowledge` | AI knowledge base management |
| **Prompt Library** | `/admin/command/prompts` | Prompt template management |
| **Agent Skills** | `/admin/command/skills` | AI agent skill definitions |

#### Administration — Marketing — `admin/marketing/`

| Route | Path | Description |
|-------|------|-------------|
| **Campaigns** | `/admin/marketing/campaigns` | Marketing campaign management |
| **Content Studio** | `/admin/marketing/studio` | Content creation and management |
| **Brand Assets** | `/admin/marketing/brand` | Brand guidelines and asset library |
| **Marketing Intelligence** | `/admin/marketing/intelligence` | Marketing analytics and insights |
| **Marketing Assets** | `/admin/marketing/assets` | Digital asset management |
| **Automation** | `/admin/marketing/automation` | Marketing automation workflows |
| **Docs** | `/admin/marketing/docs` | Marketing documentation |
| **Integrations** | `/admin/marketing/integrations` | Marketing tool integrations |
| **Prompts** | `/admin/marketing/prompts` | Marketing AI prompt templates |
| **Publisher** | `/admin/marketing/publisher` | Content publishing pipeline |

#### AI Command Center — `ai-command/`

| Route | Path | Description |
|-------|------|-------------|
| **Swarm Overview** | `/ai-command` | AI swarm dashboard — agent status, task queue, performance |
| **Agent Management** | `/ai-command/agents` | Configure AI agents, capabilities, models |
| **AI Gateway** | `/ai-command/gateway` | Model routing, rate limiting, budget tracking |
| **HITL Center** | `/ai-command/hitl` | Human-in-the-Loop approval and review queue |
| **NAOS Registry** | `/ai-command/naos` | Named Agent Ontology System — agent identity registry |
| **Queen Orchestrator** | `/ai-command/queen` | Master orchestrator for multi-agent coordination |
| **Reasoning Engine** | `/ai-command/reasoning` | AI reasoning chain viewer and debugger |
| **Active Swarm** | `/ai-command/swarm` | Real-time swarm visualization and control |

#### Analytics — `analytics/`

| Route | Path | Description |
|-------|------|-------------|
| **Analytics Dashboard** | `/analytics` | Portfolio-wide analytics with KPIs, trends, comparisons |

#### Approvals — `approvals/`

| Route | Path | Description |
|-------|------|-------------|
| **Approval Queue** | `/approvals` | Cross-module approval workflow (invoices, expenses, AI actions, access requests) |

#### Product Catalog — `catalog/`

| Route | Path | Description |
|-------|------|-------------|
| **Catalog Overview** | `/catalog` | Product catalog dashboard with key metrics |
| **Products** | `/catalog/products` | Product list with search, filters, bulk actions |
| **Categories** | `/catalog/categories` | Category tree management, hierarchy editor |
| **Inventory** | `/catalog/inventory` | Stock levels, low-stock alerts, warehouse management |
| **Discounts** | `/catalog/discounts` | Discount codes, promotional rules, coupon management |

#### Contact Center — `contact-center/`

| Route | Path | Description |
|-------|------|-------------|
| **Inbox** | `/contact-center/inbox` | Unified inbox for customer communications |
| **Dialer** | `/contact-center/dialer` | Outbound calling interface with call scripts |

#### CRM — `crm/`

| Route | Path | Description |
|-------|------|-------------|
| **CRM Dashboard** | `/crm` | Pipeline overview, deal metrics, activity summary |
| **Contacts** | `/crm/contacts` | Contact directory with search, tags, segments |
| **Organizations** | `/crm/organizations` | Company/organization profiles and relationships |
| **Deals** | `/crm/deals` | Deal pipeline with kanban and list views |
| **Deal Detail** | `/crm/deals/[id]` | Individual deal view — timeline, notes, tasks, documents |
| **Activities** | `/crm/activities` | Activity log across all CRM entities |
| **Analytics** | `/crm/analytics` | CRM-specific analytics and win/loss analysis |
| **Forecast** | `/crm/forecast` | Revenue forecasting with confidence levels |
| **Data Quality** | `/crm/duplicates` | Duplicate detection and merge workflows |

#### Document Studio — `documents/`

| Route | Path | Description |
|-------|------|-------------|
| **Document Editor** | `/documents/editor` | TipTap-based rich text editor with collaboration |
| **Templates** | `/documents/templates` | Document template gallery and management |
| **Content Assets** | `/documents/assets` | Content library for reusable blocks and media |
| **AI Assistant** | `/documents/ai` | AI-powered content generation and editing |

#### Engineering — `engineering/`

| Route | Path | Description |
|-------|------|-------------|
| **Workbench** | `/engineering/workbench` | Engineering workbench — venture genesis, architecture, planning, execution |

#### Grants — `grants/`

| Route | Path | Description |
|-------|------|-------------|
| **Grant Pipeline** | `/grants` | Grant application tracker with kanban pipeline |

#### Integrations — `integrations/`

| Route | Path | Description |
|-------|------|-------------|
| **Integration Hub** | `/integrations` | Third-party service connections and configuration |

#### Intelligence — `intelligence/`

| Route | Path | Description |
|-------|------|-------------|
| **Intelligence Hub** | `/intelligence` | AI-powered intelligence dashboard with entity explorer, knowledge hub, venture profiles |

#### Invoicing — `invoicing/`

| Route | Path | Description |
|-------|------|-------------|
| **Invoicing Overview** | `/invoicing` | Invoice dashboard — outstanding, overdue, paid, revenue metrics |
| **Invoices** | `/invoicing/invoices` | Invoice list with status filters, bulk actions |
| **Proposals** | `/invoicing/proposals` | Sales proposals with e-signature tracking |
| **Estimates** | `/invoicing/estimates` | Estimates and quotes with versioning |
| **Credit Notes** | `/invoicing/credit-notes` | Credit notes and payment records |
| **Recurring** | `/invoicing/recurring` | Recurring invoice schedules and templates |
| **Approvals** | `/invoicing/approvals` | Multi-step invoice approval workflows |
| **Platform Fees** | `/invoicing/platform-fees` | Stripe Connect platform fee configuration (Super Admin only) |

#### Knowledge — `knowledge/`

| Route | Path | Description |
|-------|------|-------------|
| **Documentation** | `/knowledge/docs` | Documentation hub and article management |
| **API Reference** | `/knowledge/api` | API documentation and interactive explorer |
| **Training** | `/knowledge/training` | Training materials and onboarding content |
| **Changelog** | `/knowledge/changelog` | Product changelog and release notes |

#### Onboarding — `onboarding/`

| Route | Path | Description |
|-------|------|-------------|
| **Onboarding** | `/onboarding` | User and venture onboarding wizard |

#### Operations — `ops/`

| Route | Path | Description |
|-------|------|-------------|
| **Ops Center** | `/ops` | Infrastructure monitoring, deployment status, health checks |

#### Platform — `platform/`

| Route | Path | Description |
|-------|------|-------------|
| **The Forge** | `/platform/forge` | Module creation and configuration tool |
| **Asset Library** | `/platform/assets` | Global asset management and CDN |
| **Integrations** | `/platform/integrations` | Platform-level integration management |
| **Prompt Library** | `/platform/prompts` | AI prompt template management |

#### Portfolio — `portfolio/`

| Route | Path | Description |
|-------|------|-------------|
| **Portfolio Overview** | `/portfolio` | Venture portfolio dashboard |
| **Venture Detail** | `/portfolio/[ventureSlug]` | Individual venture intelligence profile |
| **Capital Stack** | `/portfolio/capital` | Investment tracking and cap table |
| **Domains** | `/portfolio/domains` | Domain portfolio management |
| **Entities** | `/portfolio/entities` | Corporate entity registry |
| **Health** | `/portfolio/health` | Venture health scoring and monitoring |

#### Portfolio Health — `portfolio-health/`

| Route | Path | Description |
|-------|------|-------------|
| **Portfolio Health** | `/portfolio-health` | Aggregate portfolio health dashboard |

#### Settings — `settings/`

| Route | Path | Description |
|-------|------|-------------|
| **Profile** | `/settings/profile` | User profile management |
| **Account** | `/settings/account` | Account settings and preferences |
| **Security** | `/settings/security` | Password, MFA, WebAuthn/Passkey management |
| **Sessions** | `/settings/sessions` | Active session management, device list |
| **API Keys** | `/settings/api-keys` | Personal and service API key management |
| **Appearance** | `/settings/appearance` | Theme, density, layout preferences |
| **Notifications** | `/settings/notifications` | Notification preferences and channels |
| **Roles** | `/settings/roles` | Role browser (admin-managed roles) |
| **Users** | `/settings/users` | User directory (admin view) |

#### Signals — `signals/`

| Route | Path | Description |
|-------|------|-------------|
| **Signal Feed** | `/signals` | Real-time signal feed from across the portfolio |

#### Strategy — `strategy/`

| Route | Path | Description |
|-------|------|-------------|
| **Vision Board** | `/strategy/vision` | CEO vision board, strategic goals, OKRs |
| **Roadmap** | `/strategy/roadmap` | Master product roadmap across ventures |
| **Investor Relations** | `/strategy/investors` | Investor management and reporting |
| **M&A Pipeline** | `/strategy/ma` | Mergers & acquisitions pipeline tracker |

#### Swarm — `swarm/`

| Route | Path | Description |
|-------|------|-------------|
| **Swarm Dashboard** | `/swarm` | Global AI agent swarm status and control |

#### Tasks — `tasks/`

| Route | Path | Description |
|-------|------|-------------|
| **Projects** | `/tasks/projects` | Project management with boards and timelines |
| **Project Detail** | `/tasks/projects/[id]` | Individual project view with task management |
| **HITL Tasks** | `/tasks/hitl` | Human-in-the-Loop task queue |

#### Token Economy — `token-economy/`

| Route | Path | Description |
|-------|------|-------------|
| **EDGE Dashboard** | `/token-economy` | Token economy overview — supply, circulation, staking |

#### Treasury — `treasury/`

| Route | Path | Description |
|-------|------|-------------|
| **Treasury Dashboard** | `/treasury` | P&L overview, cash position, financial health |

#### Workflows — `workflows/`

| Route | Path | Description |
|-------|------|-------------|
| **Workflow Builder** | `/workflows/builder` | Visual workflow editor (React Flow based) |
| **Workflow Runs** | `/workflows/runs` | Workflow execution history and monitoring |

### Dashboard — CMS Routes — `(dashboard)/cms/`

| Route | Path | Description |
|-------|------|-------------|
| **Posts** | `/cms/posts` | Blog/content post management |
| **Post Editor** | `/cms/posts/[id]` | Individual post editor with preview |
| **Categories** | `/cms/categories` | Content category management |
| **Tags** | `/cms/tags` | Content tag management |
| **Comments** | `/cms/comments` | Comment moderation queue |

### Dashboard — Media — `(dashboard)/media/`

| Route | Path | Description |
|-------|------|-------------|
| **Media Library** | `/media` | File browser, image gallery, upload management |

### Dashboard — Venture Routes — `(dashboard)/v/[ventureSlug]/`

| Route | Path | Description |
|-------|------|-------------|
| **Venture Dashboard** | `/v/[ventureSlug]` | Venture-specific mission control |
| **Engineering** | `/v/[ventureSlug]/engineering` | Venture engineering overview |
| **Engineering Ops** | `/v/[ventureSlug]/engineering/ops` | Venture DevOps and infrastructure |
| **Growth** | `/v/[ventureSlug]/growth` | Venture growth metrics |
| **Growth Analytics** | `/v/[ventureSlug]/growth/analytics` | Venture-specific analytics |
| **Operations** | `/v/[ventureSlug]/operations` | Venture operational dashboard |
| **Settings** | `/v/[ventureSlug]/settings` | Venture-specific settings |
| **Tasks** | `/v/[ventureSlug]/tasks` | Venture task management |
| **Sprints** | `/v/[ventureSlug]/tasks/sprints` | Sprint planning and tracking |

### Public Routes — `(public)/`

| Route | Path | Description |
|-------|------|-------------|
| **Portfolio** | `/portfolio` (public) | Public portfolio showcase |
| **Venture Page** | `/portfolio/[ventureSlug]` (public) | Public venture profile |

### Error/Status Pages

| Route | Path | Description |
|-------|------|-------------|
| **Forbidden** | `/forbidden` | 403 — Insufficient permissions |
| **Maintenance** | `/maintenance` | Maintenance mode page |

---

## API Routes

The Super-Admin app exposes **75 API route handlers** organized by domain:

### tRPC Handler

```
api/trpc/[trpc]/route.ts
```

The catch-all tRPC handler processes all type-safe RPC calls from the client. It connects to the unified `@mcv/api` router which aggregates all domain routers.

### Authentication API — `api/auth/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/auth/[...all]` | ALL | Better Auth catch-all handler — login, register, session, OAuth, MFA, passkey, email verification |

### User Management API — `api/users/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/users/[id]` | GET/PATCH/DELETE | User CRUD operations |
| `api/users/[id]/ban` | POST | Ban/unban user |
| `api/users/[id]/suspend` | POST | Suspend/unsuspend user |
| `api/users/[id]/roles` | GET/PUT | Manage user roles |
| `api/users/invitations` | GET/POST | List/create invitations |
| `api/users/invitations/[id]` | GET/DELETE | Invitation details/revoke |
| `api/users/invitations/[id]/resend` | POST | Resend invitation email |
| `api/users/invitations/accept` | POST | Accept invitation |
| `api/users/impersonation/[id]` | POST | Start/stop user impersonation |

### Venture Management API — `api/ventures/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/ventures` | GET/POST | List/create ventures |
| `api/ventures/[id]` | GET/PATCH/DELETE | Venture CRUD |
| `api/ventures/[id]/activate` | POST | Activate venture |
| `api/ventures/[id]/archive` | POST | Archive venture |
| `api/ventures/[id]/suspend` | POST | Suspend venture |
| `api/ventures/[id]/settings` | GET/PATCH | Venture settings |
| `api/ventures/by-slug/[slug]` | GET | Lookup venture by slug |
| `api/ventures/mine` | GET | Current user's ventures |
| `api/ventures/api-keys` | GET/POST | Venture API key management |
| `api/ventures/api-keys/[id]` | GET/DELETE | API key CRUD |
| `api/ventures/api-keys/[id]/revoke` | POST | Revoke API key |
| `api/ventures/api-keys/validate` | POST | Validate API key |

### Feature Flags API — `api/flags/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/flags` | GET/POST | List/create feature flags |
| `api/flags/evaluate` | POST | Evaluate flags for context |
| `api/flags/[id]` | GET/PATCH/DELETE | Flag CRUD |
| `api/flags/[id]/overrides` | GET/POST | Flag override management |
| `api/flags/[id]/overrides/[overrideId]` | DELETE | Remove override |

### Audit API — `api/audit/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/audit/logs` | GET | Query audit logs |
| `api/audit/logs/[id]` | GET | Audit entry details |
| `api/audit/stats` | GET | Audit statistics |
| `api/audit/exports` | POST | Export audit data |
| `api/audit/exports/[id]` | GET | Export status/download |
| `api/audit/timeline` | GET | Audit timeline view |
| `api/audit/timeline/user` | GET | User-specific timeline |
| `api/audit/timeline/resource` | GET | Resource-specific timeline |

### Activity API — `api/activities/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/activities/feed` | GET | Activity feed |
| `api/activities/resource` | GET | Resource-specific activities |
| `api/activities/engagement` | GET/POST | Engagement metrics |
| `api/activities/trends` | GET | Activity trends |
| `api/activities/read` | POST | Mark activities as read |
| `api/activities/subscriptions` | GET/POST | Activity subscriptions |

### Storage API — `api/storage/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/storage/upload` | POST | File upload handler |
| `api/storage/files` | GET | List files |
| `api/storage/files/[id]` | GET/DELETE | File details/delete |
| `api/storage/files/[id]/signed-url` | GET | Generate signed URL |
| `api/storage/folders` | GET/POST | Folder management |
| `api/storage/folders/[id]` | GET/PATCH/DELETE | Folder CRUD |
| `api/storage/quota` | GET | Storage quota status |

### Notification API — `api/notifications/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/notifications` | GET | List notifications |
| `api/notifications/unread-count` | GET | Unread count |
| `api/notifications/mark-read` | POST | Mark as read |
| `api/notifications/mark-all-read` | POST | Mark all read |
| `api/notifications/preferences` | GET/PATCH | Notification preferences |
| `api/notifications/devices` | GET/POST | Push notification devices |
| `api/notifications/unsubscribe` | POST | Unsubscribe from channel |

### AI Gateway API — `api/gateway/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/gateway/chat` | POST | Chat completion endpoint |
| `api/gateway/completion` | POST | Text completion endpoint |
| `api/gateway/stream` | POST | Streaming completion |
| `api/gateway/models` | GET | Available models |
| `api/gateway/budget` | GET | Usage budget status |

### Permission API — `api/permissions/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/permissions` | GET | List permissions for current user |

### Role API — `api/roles/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/roles` | GET/POST | List/create roles |

### Public API — `api/public/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/public/booking` | POST | Public booking endpoint |
| `api/public/cart` | GET/POST | Shopping cart |
| `api/public/checkout` | POST | Checkout processing |
| `api/public/contact` | POST | Contact form submission |
| `api/public/forms` | GET | List public forms |
| `api/public/forms/[id]` | GET/POST | Form details/submission |
| `api/public/newsletter` | POST | Newsletter signup |
| `api/public/reviews` | GET/POST | Product reviews |

### Webhook API — `api/webhooks/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/webhooks/stripe` | POST | Stripe webhook handler |
| `api/webhooks/storage` | POST | Storage event webhook |
| `api/webhooks/storage/optimize` | POST | Image optimization webhook |

### Health API — `api/health/`

| Route | Method | Description |
|-------|--------|-------------|
| `api/health` | GET | Application health check |

---

## State Management

### Zustand Stores

The application uses **10 Zustand stores** for client-side state management, each dedicated to a specific domain:

#### `navigation-store.ts` — Navigation State

The most critical store, managing the three-layer navigation system:

```typescript
// Key state
layer: 'global' | 'venture' | 'module'
currentVenture: VentureSlug | null
sidebarCollapsed: boolean
breadcrumbs: Breadcrumb[]
recentVentures: VentureSlug[]   // Max 5, persisted to localStorage
workbenchActive: boolean
workbenchStage: 'genesis' | 'architecture' | 'planning' | 'execution' | null

// Key actions
switchToGlobal()                // Reset to Layer 0
switchToVenture(slug)           // Enter Layer 1 (updates recentVentures)
enterModule(slug, subSection?)  // Enter Layer 2
exitModule()                    // Return to parent layer
toggleSidebar()                 // Collapse/expand sidebar

// Persistence: sidebarCollapsed, recentVentures only
```

#### `auth-store.ts` — Authentication UI State

Manages auth-related UI state (not the session itself — that's in AuthProvider):

```typescript
// Key state
showLoginModal: boolean
showSessionExpiredModal: boolean
showMfaSetupModal: boolean
rememberEmail: string | null
preferredAuthMethod: 'password' | 'magic-link' | 'passkey'
trustedDevices: string[]
lastActivity: number | null
sessionWarningShown: boolean

// Persistence: rememberEmail, preferredAuthMethod, trustedDevices
```

#### `ai-command-store.ts` — AI Command Center

State for AI agent management, swarm visualization, and HITL workflows.

#### `campaign-wizard-store.ts` — Marketing Campaign Wizard

Multi-step campaign creation state (audience, content, schedule, budget, launch).

#### `cart-store.ts` — Shopping Cart

E-commerce cart state for catalog product management.

#### `content-pipeline-store.ts` — Content Publishing Pipeline

Content lifecycle state: draft → review → approved → published.

#### `crm-store.ts` — CRM Pipeline

Deal pipeline view state, active filters, kanban column configuration.

#### `intelligence-store.ts` — Intelligence Module

Intelligence dashboard state, entity explorer filters, knowledge graph state.

#### `portfolio-store.ts` — Portfolio View

Portfolio dashboard view preferences, venture comparison state.

#### `wishlist-store.ts` — Product Wishlist

Saved product wishlist state for catalog browsing.

### Server State (React Query via tRPC)

All server-state is managed through tRPC + TanStack React Query:

```typescript
// Default QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      staleTime: 60 * 1000,    // 1 minute
      retry: 1,                 // Retry once on failure
    },
    mutations: {
      retry: 1,                 // Retry mutations once on network error
    },
  },
});
```

**Security:** Authentication tokens are stored in **HttpOnly cookies** and sent automatically with each request. No tokens are stored in localStorage or accessible to JavaScript, preventing XSS token theft.

### URL State (nuqs)

The `nuqs` library is used for type-safe URL query state management, keeping filter states, pagination, and search queries in the URL for shareability:

```typescript
// Example: CRM contacts page
const [search, setSearch] = useQueryState('q');
const [status, setStatus] = useQueryState('status');
const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
```

---

## Data Fetching Patterns

### tRPC Client Configuration

The tRPC client is configured in `lib/trpc/client.ts` with SuperJSON serialization:

```typescript
// Client-side tRPC setup
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@mcv/api';

export const trpc = createTRPCReact<AppRouter>();

// Links configuration (httpBatchLink with SuperJSON transformer)
export function createTRPCLinks() {
  return [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      // Auth handled via HttpOnly cookies — no manual token injection
    }),
  ];
}
```

### Query Patterns

```typescript
// 1. Simple query
const { data: users } = trpc.users.list.useQuery({ page: 1, limit: 20 });

// 2. Query with dependent data
const { data: details } = trpc.auth.me.useQuery(undefined, {
  enabled: !!sessionData?.user,
  staleTime: 5 * 60 * 1000,  // 5-minute stale time for RBAC data
});

// 3. Mutation with optimistic update
const updateUser = trpc.users.update.useMutation({
  onSuccess: () => {
    utils.users.list.invalidate();
    toast.success('User updated');
  },
});

// 4. Infinite query for paginated lists
const { data, fetchNextPage } = trpc.activities.feed.useInfiniteQuery(
  { limit: 20 },
  { getNextPageParam: (lastPage) => lastPage.nextCursor },
);
```

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `use-query.ts` | Enhanced query hook with loading states and error handling |
| `use-live-query.ts` | Query with live/streaming updates (polling or WebSocket fallback) |
| `use-realtime.ts` | WebSocket/SSE subscription for real-time data |
| `use-presence.ts` | User presence tracking (online/offline/idle) |
| `use-url-state.ts` | URL-synced state management (wraps nuqs) |
| `use-controllable-state.ts` | Controlled/uncontrolled component state pattern |

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Login Page     │────▸│  Better Auth     │────▸│  Session Cookie │
│   /login         │     │  signIn.email()  │     │  (HttpOnly)     │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                         │
         │  MFA Required?        │                         │
         │◂──────────────────────┘                         │
         │                                                 │
         ▾                                                 ▾
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  MFA Verify      │────▸│  twoFactor       │────▸│  AuthProvider   │
│  /mfa/verify     │     │  .verify()       │     │  transforms     │
└─────────────────┘     └──────────────────┘     │  user + RBAC    │
                                                  └────────┬────────┘
                                                           │
                                                           ▾
                                                  ┌─────────────────┐
                                                  │  Dashboard /    │
                                                  │  Mission Control│
                                                  └─────────────────┘
```

### Supported Authentication Methods

| Method | Implementation | Notes |
|--------|---------------|-------|
| **Email/Password** | `authClient.signIn.email()` | Primary method, with remember-me option |
| **Magic Link** | `/magic-link` route | Passwordless email login |
| **OAuth 2.0** | `/oauth/callback` handler | Google, GitHub, and configurable providers |
| **WebAuthn/Passkey** | `@simplewebauthn/browser` | Hardware key and biometric authentication |
| **TOTP MFA** | `/mfa/setup` + `/mfa/verify` | Time-based one-time password (Google Authenticator, Authy) |

### Authorization — RBAC System

The application uses the `@mcv/permissions` package for Role-Based Access Control:

```typescript
// Provider (in dashboard layout)
<PermissionsProvider
  user={permissionsUser}
  organizationId={activeVenture?.slug ?? null}
/>

// Permission-gated UI
<PermissionGate permission="users.manage">
  <UserManagementPanel />
</PermissionGate>

// Role-based guards
<SuperAdminOnly>
  <PlatformFeeConfiguration />
</SuperAdminOnly>

// Programmatic checks
const canManageUsers = useCan('users.manage');
const isAdmin = useHasRole('admin');
const isTier0 = useMinTier(0);
```

**Available Guard Components:**

| Component | Description |
|-----------|-------------|
| `PermissionGate` | Renders children if user has specific permission |
| `PermissionStringGate` | String-based permission check |
| `MultiPermissionGate` | Multiple permissions (AND/OR logic) |
| `RoleGuard` | Role-based rendering |
| `SuperAdminOnly` | Tier 0 only |
| `AdminOnly` | Admin role only |
| `VentureAdminOnly` | Venture admin role only |
| `ManagerOnly` | Manager+ role |
| `OperatorOnly` | Operator+ role |

**User Tiers:**

| Tier | Role | Access Level |
|------|------|-------------|
| 0 | Super Admin | Full platform access, all ventures |
| 1 | Venture Admin | Full access within assigned ventures |
| 2 | Manager | Module-level management within ventures |
| 3 | Operator | Operational access within assigned modules |

---

## Middleware — Edge Security Layer

The `src/middleware.ts` runs at the **Edge** (before any page or API route) and handles three critical functions:

### 1. Authentication Check

```typescript
// Public paths that skip authentication
const PUBLIC_PATHS = [
  '/login', '/register', '/forgot-password', '/reset-password',
  '/verify-email', '/magic-link', '/oauth', '/mfa',
  '/api/auth', '/api/trpc/auth.', '/api/trpc/passkey.',
  '/api/trpc/mfa.', '/api/health',
  '/_next', '/favicon.ico', '/robots.txt', '/sitemap.xml',
];

// Session token check
const token = request.cookies.get('better-auth.session_token')?.value;
if (!token) {
  // Pages → redirect to /login?callbackUrl=...
  // API routes → return 401 JSON response
}
```

### 2. Rate Limiting

Uses **Upstash Redis** for distributed rate limiting in production, with an in-memory fallback for development:

| Route Category | Limit | Window |
|---------------|-------|--------|
| Login | 5 requests | 1 minute |
| Registration | 3 requests | 1 minute |
| Forgot Password | 3 requests | 5 minutes |
| MFA Verify | 5 requests | 5 minutes |
| Magic Link | 3 requests | 5 minutes |
| Passkey | 10 requests | 1 minute |

Rate-limited responses return HTTP `429` with `Retry-After` and `X-RateLimit-*` headers.

### 3. Security Headers

Every response includes security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:;
  font-src 'self'; connect-src 'self' https://api.*.mcv.one wss://*.pusher.com;
  frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```

### Middleware Matcher

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
```

---

## Feature Modules (FSD Architecture)

The `features/` directory follows a **Feature-Sliced Design** (FSD) pattern where each feature module is self-contained with its own components, hooks, types, and utilities:

```
features/
├── {feature-name}/
│   ├── components/       # Feature-specific React components
│   ├── hooks/            # Feature-specific hooks
│   ├── model/            # Types, schemas, constants
│   ├── api/              # Feature-specific API calls
│   └── index.ts          # Public API (barrel export)
```

### Feature Module Catalog

| Feature | Description | Key Components |
|---------|-------------|----------------|
| **ai-command** | AI agent management, swarm control, HITL workflows | SwarmVisualization, AgentConfig, HITLQueue |
| **auth** | Authentication forms, MFA setup, session management | LoginForm, RegisterForm, MFASetup, OAuthButtons |
| **calendar** | Calendar views, event management | CalendarGrid, EventModal, DatePicker |
| **catalog** | Product management, category trees, inventory | ProductEditor, CategoryTree, InventoryTracker |
| **cms** | Content management, post editor, media library | PostEditor, MediaGallery, CategoryManager |
| **contact-center** | Unified inbox, dialer, call scripts | InboxView, Dialer, CallScript |
| **context-switcher** | Global ↔ Venture context switching | ContextSwitcher, VentureSelector |
| **crm** | Contact management, deal pipeline, forecast | ContactCard, DealKanban, ForecastChart |
| **dashboard** | Dashboard widgets, KPI cards, charts | KPICard, TrendChart, QuickActions |
| **document-editor** | TipTap rich text editor, templates | DocumentEditor, TemplateGallery, AssetPicker |
| **email** | Email template management, delivery tracking | TemplateEditor, DeliveryLog |
| **engineering** | Engineering workbench, venture genesis | WorkbenchShell, GenesisWizard, ArchitectureView |
| **forms** | Dynamic form builder, form renderer | FormBuilder, FormRenderer, FieldConfig |
| **gateway** | AI Gateway management, model routing | ModelSelector, UsageDashboard, BudgetTracker |
| **grant-concierge** | Grant pipeline, application tracking | GrantPipeline, OpportunityScout, DeadlineCalendar |
| **integrations** | Third-party service connections | IntegrationCard, ConnectionWizard, SyncStatus |
| **intelligence** | AI intelligence, entity explorer | EntityGraph, KnowledgeHub, IntelligenceDashboard |
| **invoicing** | Invoice management, proposals, estimates | InvoiceEditor, ProposalBuilder, EstimateForm |
| **knowledge** | Knowledge base, API docs, training | DocViewer, APIExplorer, TrainingModule |
| **marketing** | Campaign management, content studio, brand | CampaignWizard, ContentStudio, BrandManager |
| **naos** | NAOS agent registry, header ticker | HeaderTicker, AgentRegistry, NAOSDashboard |
| **notifications** | In-app notification system | NotificationManager, NotificationList, PreferencesForm |
| **payments** | Payment processing, transaction log | PaymentForm, TransactionLog, RefundManager |
| **platform** | Platform management, Forge, assets | ForgeBuilder, AssetLibrary, PromptEditor |
| **portfolio** | Venture portfolio, health scoring | VentureCard, HealthScore, CapitalStack |
| **rag** | RAG knowledge retrieval | KnowledgeSearch, DocumentIndexer, ChunkViewer |
| **reputation** | Reputation scoring system | ReputationScore, BadgeDisplay, HistoryChart |
| **strategy** | Vision board, roadmap, M&A | VisionBoard, RoadmapTimeline, MAPipeline |
| **tasks** | Task management, projects, HITL | TaskBoard, ProjectTimeline, HITLReview |
| **token-economy** | Token dashboards, staking, governance | TokenDashboard, StakingPool, GovernanceVote |
| **treasury** | Treasury operations, P&L, cash | PLStatement, CashFlowChart, FundingTracker |
| **ventures** | Venture CRUD, configuration | VentureForm, VentureSettings, StatusManager |
| **workbench** | Engineering workbench tools | TerminalEmulator, CodeEditor, DeploymentPanel |
| **workflows** | Visual workflow builder | FlowEditor (React Flow), RunHistory, StepConfig |

---

## Component Organization

### Layout Components — `components/layout/`

| Component | File | Description |
|-----------|------|-------------|
| **AppShell** | `app-shell.tsx` | Top-level application shell that orchestrates sidebar, header, and content area |
| **AppSidebar** | `app-sidebar.tsx` | Application-level sidebar wrapper |
| **Header** | `header.tsx` | Top header bar with venture switcher, command palette trigger, user menu |
| **Sidebar** | `sidebar.tsx` | Sidebar navigation primitives |
| **Primitives** | `primitives.ts` | Shared layout utility functions |

The actual shell rendering is delegated to `@mcv/ui`'s `MCVShell` component, which the dashboard layout configures with:

```typescript
<MCVShell
  sidebarCollapsed={sidebarCollapsed}
  headerProps={{
    navigationState,      // Current layer, breadcrumbs
    activeVenture,        // Venture context for branding
    ventures,             // All ventures for switcher
    recentVentures,       // Quick-switch history
    user,                 // Current user info
    onHomeClick,          // Return to Mission Control
    onSwitchContext,      // Context switching handler
    onLogout,             // Logout handler
  }}
  sidebarProps={{
    navigation,           // Current navigation config (global/venture)
    navigationState,      // Layer, active items
    activeVenture,        // Venture branding
    ventures,             // All ventures
    isCollapsed,          // Collapsed state
    currentPath,          // Active route for highlighting
  }}
>
  {children}
</MCVShell>
```

### Command Menu — `components/command-menu/`

A global command palette (triggered by `⌘K` / `Ctrl+K`) powered by `cmdk`:

- **Search** across all ventures, pages, users, and actions
- **Quick navigation** to any module or page
- **Actions** like creating ventures, inviting users, toggling features
- **Context-aware** — shows different commands based on current venture/module

### Widget Components — `widgets/`

| Widget | Description |
|--------|-------------|
| **Command Center** | Dashboard widget showing key metrics, recent activity, pending approvals |
| **Sidebar** | Enhanced sidebar widget with venture branding and context switching |
| **Venture Card** | Card component for venture display with health indicators |

### Entity Components — `entities/`

Entity-level type definitions and shared components:

| Entity | Contents |
|--------|----------|
| **Navigation** | Navigation types, route definitions, breadcrumb interfaces |
| **User** | User type definition with tier, permissions, venture access |
| **Venture** | Venture type definition with branding, status, product suite |

---

## Venture Registry

The application manages multiple ventures, each with distinct branding, domains, and product suites:

| Venture | Slug | Color | Domain | Category | Description |
|---------|------|-------|--------|----------|-------------|
| **BetEdge AI** | `betedge` | `#F59E0B` (Amber) | `betedge.app` | Consumer | AI-powered sports betting analytics and picks marketplace |
| **EdgeIQ Markets** | `edgeiq` | `#8B5CF6` (Purple) | `edgeiq.app` | Consumer | Decentralized prediction markets (shares EDGE token) |
| **MCV Gaming** | `mcvgg` | `#EF4444` (Red) | `mcv.gg` | Consumer | Gaming and esports platform |
| **MCV Studio** | `studio` | `#06B6D4` (Cyan) | `mcv.digital` | Platform | Digital agency and creative services |
| **MCV Agency** | `agency` | `#EC4899` (Pink) | `mcv.cx` | Service | Full-service digital agency |
| **MCV Sentinel** | `sentinel` | `#10B981` (Emerald) | `mcv.tech` | Platform | Security and monitoring infrastructure |

Each venture includes:
- **Branding** — Primary and accent colors applied via the Chameleon Engine
- **Product Suite** — Custom navigation items for the venture's specific products
- **Admin Domain** — Dedicated subdomain (`{slug}.mcv.one`) for venture admin
- **Status** — `development`, `active`, `maintenance`, `archived`
- **EDGE Token** — Whether the venture participates in the token economy

---

## Environment Variables

The application uses `@t3-oss/env-nextjs` for runtime environment variable validation:

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `BETTER_AUTH_SECRET` | Better Auth session signing secret |
| `BETTER_AUTH_URL` | Better Auth callback URL |
| `NEXT_PUBLIC_APP_URL` | Public application URL |

### Authentication Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `RESEND_API_KEY` | Resend email service API key (for magic links, verification) |

### Infrastructure Variables

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (rate limiting, caching) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

### AI Gateway Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for AI gateway |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude models |
| `AI_GATEWAY_BUDGET_LIMIT` | Monthly AI spend limit |

### Storage Variables

| Variable | Description |
|----------|-------------|
| `S3_BUCKET` | S3 bucket name for file storage |
| `S3_REGION` | S3 bucket region |
| `S3_ACCESS_KEY_ID` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | S3 secret key |

### Payment Variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_CONNECT_CLIENT_ID` | Stripe Connect platform client ID |

### Realtime Variables

| Variable | Description |
|----------|-------------|
| `PUSHER_APP_ID` | Pusher app ID |
| `PUSHER_KEY` | Pusher key |
| `PUSHER_SECRET` | Pusher secret |
| `PUSHER_CLUSTER` | Pusher cluster |
| `NEXT_PUBLIC_PUSHER_KEY` | Public Pusher key (client-side) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Public Pusher cluster |

---

## Next.js Configuration

### `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,  // ESLint runs separately in CI
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      handlebars: 'handlebars/dist/handlebars.js',  // Email template engine
    };
    return config;
  },

  transpilePackages: [
    // All @heroui/* components (33 packages)
    // All @mcv/* workspace packages (16 packages)
    // All @trpc/* packages (3 packages)
  ],

  serverExternalPackages: ['handlebars'],  // Keep Handlebars server-side only
};
```

**Key Configuration Decisions:**
- **`transpilePackages`** — Lists all 52 packages that need transpilation because they ship ESM or use workspace-linked TypeScript sources
- **`serverExternalPackages`** — Handlebars is excluded from the client bundle since it's used only for server-side email template rendering
- **Webpack alias** — Resolves Handlebars to the pre-compiled distribution build to avoid CommonJS/ESM interop issues
- **`reactStrictMode: true`** — Enabled for development double-rendering to catch side effects

---

## Scripts & Development

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **dev** | `next dev` | Start development server on port 3000 |
| **build** | `next build` | Production build with static optimization |
| **start** | `next start` | Start production server |
| **lint** | `next lint` | Run ESLint checks |
| **lint:fix** | `next lint --fix` | Auto-fix linting issues |
| **typecheck** | `tsc --noEmit` | TypeScript type checking |
| **format** | `prettier --write .` | Format all files |
| **format:check** | `prettier --check .` | Check formatting |
| **storybook** | `storybook dev -p 6006` | Start Storybook on port 6006 |
| **build-storybook** | `storybook build` | Build static Storybook |
| **test:e2e** | `playwright test` | Run end-to-end tests |
| **test:e2e:ui** | `playwright test --ui` | Run E2E tests with visual UI |

### Development Workflow

```bash
# Start the dev server
pnpm dev

# In a separate terminal — run Storybook for component development
pnpm storybook

# Type checking (watch mode)
pnpm typecheck --watch

# Run E2E tests with visual debugger
pnpm test:e2e:ui
```

---

## Theming & Design System

### Dark Mode First

The application defaults to **dark mode** with a zinc-950 base:

```typescript
// Root layout
<html className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
  <body className="font-sans antialiased bg-zinc-950">

// Theme provider
<NextThemesProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem={false}         // Explicitly disabled
  disableTransitionOnChange    // No flash on theme switch
/>
```

### Typography

| Use | Font | Variable |
|-----|------|----------|
| **Body text** | Inter | `--font-inter` |
| **Code/mono** | JetBrains Mono | `--font-mono` |

### Venture Color System

Each venture's color is applied dynamically through CSS variables and Tailwind classes:

```
Global Mode:   Emerald accents (#10B981)
BetEdge:       Amber accents (#F59E0B)
EdgeIQ:        Purple accents (#8B5CF6)
MCV Gaming:    Red accents (#EF4444)
MCV Studio:    Cyan accents (#06B6D4)
MCV Agency:    Pink accents (#EC4899)
MCV Sentinel:  Emerald accents (#10B981)
```

---

## Security Architecture

### Defense in Depth

The application implements security at multiple layers:

| Layer | Mechanism | Description |
|-------|-----------|-------------|
| **Edge** | Middleware | Auth check, rate limiting, security headers, CSP |
| **Transport** | HttpOnly Cookies | Session tokens never exposed to JavaScript |
| **Application** | AuthProvider | Session enrichment with RBAC data via tRPC |
| **Component** | PermissionGate | UI elements hidden based on permissions |
| **API** | tRPC Context | Server-side session verification and authorization |
| **Database** | Row-Level Security | Supabase RLS policies per venture/user |

### Content Security Policy

```
default-src 'self'
script-src 'self' 'unsafe-eval' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
img-src 'self' blob: data: https:
font-src 'self'
connect-src 'self' https://api.*.mcv.one wss://*.pusher.com
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

### Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Content-Security-Policy` | (see above) | Prevent XSS, injection |

### Session Security

- **HttpOnly cookies** — Session tokens are never accessible to client-side JavaScript
- **Secure flag** — Cookies sent only over HTTPS in production
- **SameSite** — Strict or Lax to prevent CSRF
- **Session expiry** — Configurable via Better Auth
- **Trusted devices** — Users can mark devices as trusted to skip MFA
- **Session management** — Users can view and revoke active sessions in `/settings/sessions`

---

## Testing Strategy

### End-to-End Testing (Playwright)

The primary testing strategy uses Playwright for end-to-end testing:

```typescript
// Example E2E test
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'admin@mcv.one');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/');
  await expect(page.locator('text=Mission Control')).toBeVisible();
});
```

### Component Testing (Storybook)

Each feature module exports Storybook stories for visual testing and documentation:

```typescript
// Example story
import type { Meta, StoryObj } from '@storybook/react';
import { VentureCard } from './venture-card';

const meta: Meta<typeof VentureCard> = {
  title: 'Widgets/VentureCard',
  component: VentureCard,
  decorators: [withProviders],
};

export const BetEdge: StoryObj = {
  args: {
    venture: ventures.betedge,
    health: 92,
    revenue: '$45,200',
  },
};
```

### Type Checking

TypeScript strict mode with `tsc --noEmit` catches type errors at build time. The monorepo workspace protocol ensures type consistency across all `@mcv/*` packages.

---

## Deployment

### Build Process

```bash
# Full build (via Turbo for monorepo orchestration)
turbo build --filter=@mcv/admin

# Build order (Turbo handles dependency graph):
# 1. @mcv/config, @mcv/db (Tier 2)
# 2. @mcv/auth, @mcv/permissions, @mcv/flags (Tier 4)
# 3. @mcv/api (Tier 3)
# 4. @mcv/ui (Tier 5)
# 5. @mcv/admin (Tier 6) — this app
```

### Deployment Targets

| Platform | Use Case | Notes |
|----------|----------|-------|
| **Vercel** | Primary deployment | Zero-config Next.js deployment, Edge Functions for middleware |
| **Docker** | Self-hosted / staging | Multi-stage Dockerfile with standalone output |
| **Fly.io** | Regional deployment | For latency-sensitive venture deployments |

### Build Optimization

- **App Router** static pages are pre-rendered at build time
- **Dynamic routes** (`[id]`, `[ventureSlug]`) use on-demand ISR
- **API routes** run as serverless functions
- **Middleware** runs at the Edge (Vercel Edge Functions or Cloudflare Workers)
- **Package bundling** via `transpilePackages` ensures tree-shaking of workspace dependencies

---

## Planned Applications

### Venture Admin (`@mcv/venture-admin`)

**Status:** Planned  
**Port:** 3001

The Venture Admin is a **tenant-scoped** version of the Super-Admin, designed for venture operators who manage a single venture rather than the entire consortium:

| Aspect | Super-Admin | Venture Admin |
|--------|-------------|---------------|
| **Scope** | All ventures (Tier 0) | Single venture (Tier 1) |
| **Context** | Global + Venture switching | Fixed venture context |
| **Navigation** | Full global + venture nav | Venture nav only |
| **Domain** | `admin.mcv.one` | `{venture}.mcv.one` |
| **Permissions** | Full RBAC (Tier 0-3) | Venture RBAC (Tier 1-3) |
| **Features** | Portfolio, Treasury, Token Economy, Strategy | Operations, Growth, Engineering, Settings |

The Venture Admin will share most feature modules with the Super-Admin via the monorepo architecture, but will have:
- A different root layout optimized for single-venture context
- Venture-branded login page
- Reduced navigation (no portfolio-wide modules)
- Venture-specific onboarding flow
- Custom domain support (`{venture}.mcv.one`)

### Marketing Website (`@mcv/web`)

**Status:** Planned  
**Port:** 3002

Public-facing marketing site for the MCV.ONE platform:
- Portfolio showcase with venture profiles
- Investor relations and pitch materials
- Platform features and pricing
- Blog/content marketing (powered by CMS module)
- Contact forms and newsletter signup

### Documentation Site (`@mcv/docs`)

**Status:** Planned  
**Port:** 3003

Developer documentation portal:
- API reference (auto-generated from tRPC routers)
- SDK documentation
- Integration guides
- Architecture documentation
- Changelog and release notes
- Training materials and tutorials

---

## Appendix A — Page Count Summary

| Section | Pages | Routes |
|---------|-------|--------|
| Auth | 9 | 9 page components |
| Admin (core) | 24 | Users, roles, ventures, flags, storage, email, etc. |
| Admin (command) | 6 | AI agents, approvals, automations, knowledge, prompts, skills |
| Admin (marketing) | 10 | Campaigns, studio, brand, intelligence, assets, automation, etc. |
| AI Command | 8 | Swarm, agents, gateway, HITL, NAOS, queen, reasoning, swarm |
| CRM | 9 | Dashboard, contacts, orgs, deals, activities, analytics, forecast, duplicates |
| Catalog | 5 | Overview, products, categories, inventory, discounts |
| Contact Center | 2 | Inbox, dialer |
| Documents | 4 | Editor, templates, assets, AI |
| Engineering | 1 | Workbench |
| Grants | 1 | Pipeline |
| Integrations | 1 | Hub |
| Intelligence | 1 | Dashboard |
| Invoicing | 7 | Overview, invoices, proposals, estimates, credit-notes, recurring, approvals, fees |
| Knowledge | 4 | Docs, API, training, changelog |
| Onboarding | 1 | Wizard |
| Ops | 1 | Center |
| Platform | 4 | Forge, assets, integrations, prompts |
| Portfolio | 6 | Overview, venture detail, capital, domains, entities, health |
| Portfolio Health | 1 | Dashboard |
| Settings | 9 | Profile, account, security, sessions, API keys, appearance, notifications, roles, users |
| Signals | 1 | Feed |
| Strategy | 4 | Vision, roadmap, investors, M&A |
| Swarm | 1 | Dashboard |
| Tasks | 3 | Projects, project detail, HITL |
| Token Economy | 1 | Dashboard |
| Treasury | 1 | Dashboard |
| Workflows | 2 | Builder, runs |
| CMS | 5 | Posts, post editor, categories, tags, comments |
| Media | 1 | Library |
| Venture Context | 7 | Dashboard, engineering, eng ops, growth, analytics, operations, settings, tasks, sprints |
| Public | 2 | Portfolio, venture profile |
| Error Pages | 2 | Forbidden, maintenance |
| **Total** | **169** | **169 page.tsx files** |

## Appendix B — API Route Count Summary

| Domain | Routes | Description |
|--------|--------|-------------|
| tRPC | 1 | Catch-all handler for all tRPC procedures |
| Auth | 1 | Better Auth catch-all |
| Users | 10 | CRUD, ban, suspend, roles, invitations, impersonation |
| Ventures | 13 | CRUD, lifecycle, settings, API keys |
| Flags | 5 | CRUD, evaluation, overrides |
| Audit | 7 | Logs, stats, exports, timeline |
| Activities | 6 | Feed, resource, engagement, trends, subscriptions |
| Storage | 7 | Upload, files, folders, quota, signed URLs |
| Notifications | 7 | List, unread, mark-read, preferences, devices |
| Gateway | 5 | Chat, completion, stream, models, budget |
| Permissions | 1 | List |
| Roles | 1 | List/create |
| Public | 8 | Booking, cart, checkout, contact, forms, newsletter, reviews |
| Webhooks | 3 | Stripe, storage, optimization |
| Health | 1 | Health check |
| **Total** | **75** | **75 route.ts files** |

## Appendix C — Dependency Graph

```
@mcv/admin (this app)
│
├── @mcv/ui            → Shared design system, MCVShell, components
├── @mcv/api           → tRPC routers, API layer
├── @mcv/auth          → Better Auth, session management
├── @mcv/permissions   → RBAC, permission gates, role guards
├── @mcv/tenants       → Multi-tenancy, venture context
├── @mcv/flags         → Feature flag evaluation
├── @mcv/notifications → Push, email, in-app notifications
├── @mcv/activity      → Activity feed, engagement
├── @mcv/audit         → Audit logging
├── @mcv/storage       → File storage, upload
├── @mcv/gateway       → AI Gateway, model routing
├── @mcv/ai            → AI/LLM framework
├── @mcv/rag           → RAG, knowledge retrieval
├── @mcv/realtime      → WebSocket, SSE, presence
├── @mcv/db            → Database client, schemas
├── @mcv/config        → Configuration, env validation
└── @mcv/users         → User management
```

---

*@mcv/apps — Tier 6 Presentation Layer — The Portfolio Command & Control Center*
