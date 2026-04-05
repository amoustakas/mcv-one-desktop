# @mcv/apps-venture-admin — Venture Admin Dashboard
## Tier 6: Presentation | Classification: PUBLISHABLE

**Version:** 1.0
**Last Updated:** March 10, 2026
**Reference:** 00-ARCHITECTURE.md (Tier 6)
**Status:** SPECIFICATION (no prototype yet — derived from super-admin feature set)

---

## 1. Executive Summary

The Venture Admin Dashboard is the **per-venture operational interface** for venture administrators, managers, and team members. Unlike the Super Admin (which spans all ventures), this app is **scoped to a single venture** and provides the day-to-day business tools: CRM, invoicing, tasks, marketing, analytics, and venture-specific modules.

Each venture deployment is **white-labeled** — the UI adapts to the venture's branding (colors, logo, domain) while sharing the same codebase. This is the app that BetEdge admins, Full Gain team members, and future venture operators will use.

**Access:** Venture members (admin, manager, member, viewer roles)
**URL Pattern:** app.mcv.one (context-switched) or {venture}.mcv.one (subdomain)
**Framework:** Next.js 15 (App Router) + tRPC + @mcv/ui

---

## 2. Architecture

### 2.1 Differentiation from Super Admin

| Aspect | Super Admin | Venture Admin |
|--------|-------------|---------------|
| **Scope** | All ventures | Single venture |
| **Users** | Platform operators | Venture teams |
| **Features** | Portfolio, Treasury, Agent Layer | Business ops (CRM, Commerce, Growth) |
| **Branding** | MCV.ONE brand | Venture brand (white-label) |
| **Deployment** | admin.mcv.one | app.mcv.one or {venture}.mcv.one |
| **Access** | super_admin, platform_ops | venture_admin, manager, member, viewer |

### 2.2 Route Structure

```
(auth)          — Login, register, MFA (venture-branded)
(dashboard)     — Venture-scoped shell
├── /           — Venture dashboard (KPIs, activity, quick actions)
├── /crm/*      — CRM (contacts, organizations, deals, pipeline)
├── /inbox/*    — Unified inbox (email, chat, calls)
├── /tasks/*    — Task management, projects, sprints
├── /invoicing/* — Invoicing, proposals, billing
├── /catalog/*  — Products/services catalog
├── /marketing/* — Campaigns, email, social, content
├── /analytics/* — Venture-specific dashboards
├── /documents/* — Document editor, templates
├── /calendar   — Team calendar, scheduling
├── /knowledge/* — Help center, docs, training
├── /workflows/* — Automation workflows
├── /settings/* — Venture settings, team, integrations, billing
└── /ai/*       — AI assistant, chat, suggestions (scoped)
```

---

## 3. Feature Modules (Venture-Scoped Subset)

### Included (Venture Operations)
- CRM (contacts, deals, pipeline) — from @mcv/nexus
- Contact Center (calls, inbox) — from @mcv/nexus
- Calendar & Scheduling — from @mcv/nexus
- Forms & Surveys — from @mcv/nexus
- Document Editor — from @mcv/nexus
- Invoicing & Billing — from @mcv/commerce
- Catalog & Products — from @mcv/commerce
- Marketing & Email — from @mcv/growth
- Content Management — from @mcv/growth
- Analytics & Reports — from @mcv/analytics
- Tasks & Projects — from @mcv/operations
- Workflows & Automations — from @mcv/operations
- Knowledge Base — from @mcv/growth/education
- AI Assistant — from @mcv/intelligence (scoped to venture)
- Settings & Team Management — from @mcv/identity

### Excluded (Platform-Only)
- Portfolio management (multi-venture view)
- Treasury & capital allocation
- Agent Layer control (Queen, NAOS, Swarm)
- Feature flags administration
- User impersonation
- Platform-wide audit logs
- Token economy administration
- Strategy & M&A

---

## 4. White-Label System

### 4.1 Venture Branding Configuration

```typescript
// Stored in venture_settings table, loaded at app init
interface VentureBrand {
  name: string;               // "BetEdge AI"
  logo: string;               // URL to logo asset
  favicon: string;            // URL to favicon
  colors: {
    primary: string;          // "#6366F1" (Indigo)
    secondary: string;        // "#EC4899" (Pink)
    accent: string;           // "#F59E0B" (Amber)
  };
  domain: string;             // "betedge.app"
  supportEmail: string;       // "support@betedge.app"
}
```

### 4.2 Module Enablement

Each venture enables/disables modules via `venture_settings.enabled_modules`:
```typescript
// BetEdge might enable:
["crm", "analytics", "marketing", "knowledge", "tasks", "ai"]

// Full Gain (agency) might enable:
["crm", "invoicing", "catalog", "documents", "tasks", "calendar", "marketing"]
```

Disabled modules are hidden from navigation and route-guarded.

---

## 5. Venture-Specific Extensions

### 5.1 Extension Points

Ventures can extend the base app with custom:
- **Dashboard widgets** — venture-specific KPIs (e.g., BetEdge: win rate, ROI)
- **Custom views** — domain-specific data views (e.g., BetEdge: odds comparison)
- **Navigation items** — venture-specific menu entries
- **Settings panels** — venture-specific configuration
- **AI system prompts** — venture-tuned AI behavior

### 5.2 Extension Loading

```typescript
// Dynamic module loading based on venture config
const ventureExtensions = await loadVentureExtensions(ventureId);
// Returns React components, routes, and nav items
// Registered via plugin system at runtime
```

---

## 6. Responsive Design Requirements

| Breakpoint | Layout | Target Device |
|-----------|--------|--------------|
| < 640px | Mobile (bottom nav, stacked) | Phone |
| 640-1024px | Tablet (collapsible sidebar) | iPad |
| 1024-1440px | Desktop (fixed sidebar) | Laptop |
| > 1440px | Wide (sidebar + detail panel) | Monitor |

---

## 7. Implementation Plan

### Phase 1 (M1-M2): Extract from Super Admin
- Fork route structure from apps/admin
- Remove platform-only features
- Add venture context scoping
- Implement white-label theming

### Phase 2 (M3): Venture Extensions
- Build plugin system for venture-specific modules
- Implement BetEdge extensions (first venture)
- Deploy to app.mcv.one

### Phase 3 (M4+): Full White-Label
- Custom domain support ({venture}.mcv.one)
- Venture-specific onboarding flows
- Self-service venture setup wizard

---

## Document Control

| Field | Value |
|-------|-------|
| Author | MCV Engineering |
| Created | March 10, 2026 |
| Version | 1.0 |
