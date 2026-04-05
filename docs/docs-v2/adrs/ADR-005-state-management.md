# ADR-005: Client-Side State Management

**Status:** APPROVED
**Date:** March 10, 2026
**Deciders:** Frontend Team
**Context:**
The MCV.ONE admin app has 35+ feature modules, each requiring local UI state, server state caching, and cross-feature shared state. The prototype currently uses TanStack Query + Zustand — this ADR formalizes the pattern.

**Problem:**
1. **Server state vs client state:** Most "state" is actually server data (contacts, tasks, etc.) — overfetching/underfetching without proper caching wastes bandwidth.
2. **Cross-feature state:** Venture context, auth session, and UI preferences must be accessible everywhere.
3. **URL state:** Filters, pagination, and search must survive page refreshes and be shareable via URL.
4. **Form state:** Complex multi-step forms (onboarding, invoice creation) need dedicated management.

**Decision:**
We adopt a **four-layer state model:**

| Layer | Tool | Scope | Examples |
|-------|------|-------|---------|
| **Server State** | TanStack Query v5 | Data fetched from tRPC | Contacts, tasks, deals, users |
| **Client State** | Zustand | Cross-feature UI state | Sidebar open, theme, active venture |
| **URL State** | nuqs (Next.js URL state) | Page-level filters/sort | `?status=active&sort=name` |
| **Form State** | React Hook Form + Zod | Per-form | Create contact, edit invoice |

**Key Rules:**
1. **Never duplicate server state in Zustand** — TanStack Query is the cache.
2. **Zustand stores are small and focused** — one store per concern (e.g., `useSidebarStore`, `useVentureStore`).
3. **All list filters go in URL state** — shareable, bookmarkable, survives refresh.
4. **tRPC + TanStack Query integration** — use `@trpc/react-query` for automatic type-safe caching.

**tRPC Cache Strategy:**
```typescript
// Stale time by data type
const CACHE_CONFIG = {
  user: { staleTime: 5 * 60 * 1000 },       // 5 min
  contacts: { staleTime: 30 * 1000 },        // 30 sec
  dashboard: { staleTime: 60 * 1000 },       // 1 min
  settings: { staleTime: 10 * 60 * 1000 },   // 10 min
  ventures: { staleTime: 30 * 60 * 1000 },   // 30 min (rarely changes)
};
```

**Consequences:**
- Positive: Clear separation of concerns, minimal re-renders, URL-driven navigation
- Negative: Four tools to learn (but each has a clear domain)
- Migration: Prototype already uses this pattern — formalize, don't rewrite
