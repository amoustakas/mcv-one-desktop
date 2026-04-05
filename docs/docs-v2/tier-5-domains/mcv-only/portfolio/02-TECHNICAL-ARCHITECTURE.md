# @mcv/portfolio — Technical Architecture

> **Package:** `@mcv/portfolio`
> **Classification:** MCV-ONLY
> **Tier:** 5 — Domain Layer
> **Version:** 1.0.0
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Architecture Diagram](#system-architecture-diagram)
3. [Module Architecture](#module-architecture)
   - [Ventures Module](#ventures-module-architecture)
   - [Entities Module](#entities-module-architecture)
   - [Grants Module](#grants-module-architecture)
   - [Strategy Module](#strategy-module-architecture)
   - [Aggregation Layer](#aggregation-layer-architecture)
4. [Data Models & Database Schema](#data-models--database-schema)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance Architecture](#performance-architecture)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security Architecture](#security-architecture)

---

## Architecture Overview

The `@mcv/portfolio` package implements a **modular domain service architecture** composed of four independent submodules (ventures, entities, grants, strategy) and one cross-cutting aggregation layer. Each submodule encapsulates its own database schema, service class, validation layer, and domain logic while sharing a common infrastructure foundation through `@mcv/kernel`.

### Architectural Principles

1. **Service-Per-Subdomain** — Each submodule (ventures, entities, grants, strategy) exposes an independent service class with no direct dependencies between submodules. Cross-module coordination happens through the aggregation layer or via event-driven integration through `@mcv/fabric`.

2. **State Machine Enforcement** — Lifecycle-driven entities (ventures, grants, objectives) use explicit state machines with validated transitions. The state machine is defined as a typed constant and enforced at the service layer before any database operation.

3. **Event-Driven Side Effects** — State changes emit domain events to `@mcv/fabric`'s event bus (Redpanda/Kafka). Side effects (tenant creation, notification dispatch, audit logging) are triggered by event consumers, not inline in the service methods.

4. **Schema-First Design** — All database tables are defined using Drizzle ORM TypeScript schemas. These schemas are the single source of truth for table structure, types, and relationships.

5. **Validation-First API** — Every public service method validates its input against a Zod schema before touching the database. Invalid inputs are rejected immediately with descriptive error codes.

6. **Cache-Aside Pattern** — Redis caching follows the cache-aside pattern: check cache first, fetch from DB on miss, populate cache on fetch. Cache invalidation is explicit on writes.

7. **RLS-Enforced Tenancy** — PostgreSQL Row-Level Security policies enforce tenant isolation at the database layer, providing defense-in-depth beyond application-level checks.

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 20+ / Next.js 15 | Server-side execution |
| **Language** | TypeScript 5.x (strict mode) | Type safety |
| **Framework** | Turborepo monorepo | Package management |
| **ORM** | Drizzle ORM 0.38.x | Database schema & queries |
| **Validation** | Zod 3.x | Runtime input validation |
| **Database** | PostgreSQL 15+ (Supabase) | Primary data store |
| **Row Security** | Supabase RLS | Tenant isolation |
| **Cache** | Redis 7+ | Query caching, rate limiting |
| **Event Bus** | Redpanda (Kafka-compatible) | Domain event streaming |
| **AI** | OpenRouter (Claude, GPT-4o) | AI-powered analysis |
| **Storage** | Supabase Storage | Document storage |
| **Dates** | date-fns 3.x | Date manipulation |

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     @mcv/portfolio — SYSTEM ARCHITECTURE                         │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                           ENTRY POINTS                                    │   │
│  │                                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │  API Routes   │  │  Cron Jobs   │  │  Webhooks    │  │ NAOS Agents │  │   │
│  │  │ /api/portfolio│  │ Health pings │  │ Grant feeds  │  │ Strategist  │  │   │
│  │  │ /api/ventures │  │ KPI refresh  │  │ Entity APIs  │  │ Portfolio   │  │   │
│  │  │ /api/grants   │  │ Deadlines    │  │ Compliance   │  │ Analyst     │  │   │
│  │  │ /api/strategy │  │ Cache refresh│  │              │  │             │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │   │
│  │         │                 │                  │                  │         │   │
│  │         └─────────────────┴──────────────────┴──────────────────┘         │   │
│  │                                    │                                      │   │
│  └────────────────────────────────────┼──────────────────────────────────────┘   │
│                                       │                                          │
│  ┌────────────────────────────────────┼──────────────────────────────────────┐   │
│  │                          VALIDATION LAYER (Zod)                           │   │
│  │                                    │                                      │   │
│  │  ┌─────────────────┐ ┌───────────────────┐ ┌──────────────────────────┐  │   │
│  │  │ Input Schemas    │ │ Business Rules    │ │ State Machine Guards     │  │   │
│  │  │ (Zod validators) │ │ (Amount ranges,   │ │ (Transition validation,  │  │   │
│  │  │                  │ │  allocation caps,  │ │  precondition checks)    │  │   │
│  │  │                  │ │  weight sums)      │ │                          │  │   │
│  │  └─────────────────┘ └───────────────────┘ └──────────────────────────┘  │   │
│  └────────────────────────────────────┼──────────────────────────────────────┘   │
│                                       │                                          │
│  ┌────────────────────────────────────┼──────────────────────────────────────┐   │
│  │                          SERVICE LAYER                                    │   │
│  │                                    │                                      │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                      │   │
│  │  │    VENTURE SERVICE   │  │    ENTITY SERVICE     │                      │   │
│  │  │                      │  │                       │                      │   │
│  │  │  • Venture CRUD      │  │  • Entity CRUD        │                      │   │
│  │  │  • Lifecycle mgmt    │  │  • Hierarchy mgmt     │                      │   │
│  │  │  • Health monitoring │  │  • Ownership tracking  │                      │   │
│  │  │  • KPI tracking      │  │  • Compliance checks  │                      │   │
│  │  │  • Team assignments  │  │  • Document vault     │                      │   │
│  │  │  • Tech stack reg.   │  │  • Officer mgmt       │                      │   │
│  │  │  • Deployment config │  │  • Jurisdiction mgmt  │                      │   │
│  │  │  • Milestone tracking│  │  • Registered agents  │                      │   │
│  │  └──────────┬───────────┘  └───────────┬───────────┘                      │   │
│  │             │                           │                                  │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                      │   │
│  │  │    GRANT SERVICE     │  │   STRATEGY SERVICE    │                      │   │
│  │  │                      │  │                       │                      │   │
│  │  │  • Grant discovery   │  │  • OKR management     │                      │   │
│  │  │  • Application mgmt  │  │  • Competitive intel  │                      │   │
│  │  │  • Milestone tracking│  │  • Market sizing      │                      │   │
│  │  │  • Disbursement mgmt │  │  • Venture scoring    │                      │   │
│  │  │  • Compliance reports│  │  • Investment theses   │                      │   │
│  │  │  • Budget tracking   │  │  • Pivot decisions    │                      │   │
│  │  │  • Deadline alerts   │  │  • Dashboards         │                      │   │
│  │  │  • Document mgmt     │  │  • Initiatives        │                      │   │
│  │  └──────────┬───────────┘  └───────────┬───────────┘                      │   │
│  │             │                           │                                  │   │
│  │  ┌──────────┴───────────────────────────┴───────────────────────────────┐ │   │
│  │  │              CROSS-VENTURE AGGREGATION ENGINE                         │ │   │
│  │  │                                                                      │ │   │
│  │  │  • Portfolio summary (all 9 ventures)                                │ │   │
│  │  │  • Venture comparison matrices                                       │ │   │
│  │  │  • Health heatmaps                                                   │ │   │
│  │  │  • Consolidated KPI metrics                                          │ │   │
│  │  │  • Grant funding pipeline                                            │ │   │
│  │  │  • Resource allocation analysis                                      │ │   │
│  │  │  • Trend detection & forecasting                                     │ │   │
│  │  └──────────────────────────────┬───────────────────────────────────────┘ │   │
│  └─────────────────────────────────┼────────────────────────────────────────┘    │
│                                    │                                             │
│  ┌─────────────────────────────────┼────────────────────────────────────────┐    │
│  │                    INFRASTRUCTURE LAYER                                   │    │
│  │                                 │                                         │    │
│  │  ┌───────────┐  ┌──────────┐  ┌┴──────────┐  ┌───────────┐             │    │
│  │  │ PostgreSQL │  │  Redis   │  │ Redpanda  │  │ Supabase  │             │    │
│  │  │ (Supabase) │  │ Cache    │  │ Event Bus │  │ Storage   │             │    │
│  │  │            │  │          │  │           │  │           │             │    │
│  │  │ 39 tables  │  │ Cache-   │  │ portfolio │  │ Documents │             │    │
│  │  │ + RLS      │  │ aside    │  │ .events   │  │ bucket    │             │    │
│  │  │ + indexes  │  │ pattern  │  │ topic     │  │           │             │    │
│  │  │ + mat.views│  │          │  │           │  │           │             │    │
│  │  └───────────┘  └──────────┘  └───────────┘  └───────────┘             │    │
│  │                                                                          │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │                    EXTERNAL INTEGRATIONS                                  │    │
│  │                                                                           │    │
│  │  @mcv/identity      @mcv/fabric         @mcv/finance      @mcv/treasury  │    │
│  │  (Tenants, RBAC)    (Audit, Events)     (P&L, Budgets)    (Funding)      │    │
│  │                                                                           │    │
│  │  @mcv/documents     @mcv/notifications  OpenRouter AI     @mcv/agentic-os│    │
│  │  (PDF, Storage)     (Alerts, Emails)    (Analysis)        (AI Agents)     │    │
│  │                                                                           │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Architecture

### Ventures Module Architecture

The ventures module follows a **service-repository-schema** pattern with an integrated state machine for lifecycle management.

```
┌────────────────────────────────────────────────────────┐
│                  VENTURES MODULE                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              VentureService                      │   │
│  │                                                  │   │
│  │  ┌──────────────────┐  ┌──────────────────────┐ │   │
│  │  │  CRUD Operations │  │  Lifecycle Engine     │ │   │
│  │  │                  │  │                       │ │   │
│  │  │  createVenture() │  │  approveVenture()     │ │   │
│  │  │  updateVenture() │  │  launchVenture()      │ │   │
│  │  │  getVenture()    │  │  scaleVenture()       │ │   │
│  │  │  listVentures()  │  │  hibernateVenture()   │ │   │
│  │  │  deleteVenture() │  │  reactivateVenture()  │ │   │
│  │  │                  │  │  sunsetVenture()       │ │   │
│  │  │                  │  │  archiveVenture()      │ │   │
│  │  └────────┬─────────┘  └──────────┬────────────┘ │   │
│  │           │                       │              │   │
│  │  ┌────────┴───────────────────────┴────────────┐ │   │
│  │  │           State Machine Guard                │ │   │
│  │  │                                              │ │   │
│  │  │  VALID_TRANSITIONS = {                       │ │   │
│  │  │    concept:     ['setup'],                   │ │   │
│  │  │    setup:       ['active', 'sunset'],        │ │   │
│  │  │    active:      ['scaling', 'hibernating',   │ │   │
│  │  │                  'sunset'],                   │ │   │
│  │  │    scaling:     ['active', 'hibernating',    │ │   │
│  │  │                  'sunset'],                   │ │   │
│  │  │    hibernating: ['active', 'sunset'],        │ │   │
│  │  │    sunset:      ['archived'],                │ │   │
│  │  │    archived:    [],                          │ │   │
│  │  │  }                                           │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │ Config Mgmt  │  │ Health Mgmt  │             │   │
│  │  │              │  │              │             │   │
│  │  │ getConfig()  │  │ recordSnap() │             │   │
│  │  │ updateConf() │  │ getLatest()  │             │   │
│  │  │ toggleFeat() │  │ getHistory() │             │   │
│  │  │ maintMode()  │  │ getHeatmap() │             │   │
│  │  └──────────────┘  └──────────────┘             │   │
│  │                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │  KPI Mgmt    │  │  Team Mgmt   │             │   │
│  │  │              │  │              │             │   │
│  │  │ createKpi()  │  │ assignMember │             │   │
│  │  │ recordKpi()  │  │ removeMember │             │   │
│  │  │ getDashboard │  │ updateAlloc. │             │   │
│  │  │ getTrends()  │  │ getTeamRstr. │             │   │
│  │  └──────────────┘  └──────────────┘             │   │
│  │                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │  Tech Stack  │  │ Deployments  │             │   │
│  │  │              │  │              │             │   │
│  │  │ registerTech │  │ registerDep. │             │   │
│  │  │ deprecate()  │  │ updateStatus │             │   │
│  │  │ getStack()   │  │ healthCheck  │             │   │
│  │  │ getMatrix()  │  │ getMatrix()  │             │   │
│  │  └──────────────┘  └──────────────┘             │   │
│  │                                                  │   │
│  │  ┌──────────────┐                               │   │
│  │  │  Milestones  │                               │   │
│  │  │              │                               │   │
│  │  │ create()     │                               │   │
│  │  │ progress()   │                               │   │
│  │  │ complete()   │                               │   │
│  │  │ timeline()   │                               │   │
│  │  └──────────────┘                               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │             Drizzle Schema (9 tables)            │   │
│  │                                                  │   │
│  │  ventures · ventureConfigs · healthSnapshots     │   │
│  │  ventureKpis · ventureKpiRecords                 │   │
│  │  teamAssignments · techStacks · deployments      │   │
│  │  ventureMilestones                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Validators (Zod schemas)               │   │
│  │                                                  │   │
│  │  createVentureSchema · updateVentureSchema       │   │
│  │  healthSnapshotSchema · kpiDefinitionSchema      │   │
│  │  teamAssignmentSchema · deploymentConfigSchema   │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

**Lifecycle Engine Implementation:**

```typescript
// ventures/lifecycle.ts
import { VentureStatus } from '../types';

export const VENTURE_TRANSITIONS: Record<VentureStatus, VentureStatus[]> = {
  concept:     ['setup'],
  setup:       ['active', 'sunset'],
  active:      ['scaling', 'hibernating', 'sunset'],
  scaling:     ['active', 'hibernating', 'sunset'],
  hibernating: ['active', 'sunset'],
  sunset:      ['archived'],
  archived:    [],
};

export function validateTransition(
  from: VentureStatus,
  to: VentureStatus,
): void {
  const allowed = VENTURE_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new PortfolioError('PORTFOLIO_INVALID_TRANSITION', {
      from,
      to,
      allowed,
    });
  }
}

// Side effects triggered after transition
export const TRANSITION_SIDE_EFFECTS: Record<string, string[]> = {
  'concept→setup':        ['create_tenant', 'emit_approved_event'],
  'setup→active':         ['emit_launched_event', 'create_default_kpis', 'schedule_health_checks'],
  'active→scaling':       ['emit_scaling_event', 'review_resource_allocation'],
  'active→hibernating':   ['emit_hibernated_event', 'pause_health_checks', 'notify_team'],
  'hibernating→active':   ['emit_reactivated_event', 'resume_health_checks'],
  'any→sunset':           ['emit_sunset_event', 'notify_all_stakeholders', 'freeze_new_grants'],
  'sunset→archived':      ['deactivate_team', 'archive_deployments', 'freeze_kpis', 'emit_archived_event'],
};
```

**Health Score Calculation:**

```typescript
// ventures/service.ts — Health score calculation
private calculateHealthScore(
  dimensions: VentureHealthSnapshot['dimensions'],
  weights?: HealthWeights,
): number {
  const w = weights ?? {
    financial: 0.30,
    product: 0.25,
    team: 0.20,
    market: 0.15,
    compliance: 0.10,
  };

  const score =
    dimensions.financial.score * w.financial +
    dimensions.product.score * w.product +
    dimensions.team.score * w.team +
    dimensions.market.score * w.market +
    dimensions.compliance.score * w.compliance;

  return Math.round(score * 100) / 100;
}

private determineOverallHealth(score: number): VentureHealthStatus {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'warning';
  if (score > 0) return 'critical';
  return 'unknown';
}
```

**Allocation Validation:**

```typescript
// ventures/service.ts — Team allocation validation
private async validateAllocation(
  userId: string,
  newAllocation: number,
  excludeAssignmentId?: string,
): Promise<void> {
  const existingAllocations = await db
    .select({ allocation: ventureTeamAssignments.allocation })
    .from(ventureTeamAssignments)
    .where(
      and(
        eq(ventureTeamAssignments.userId, userId),
        eq(ventureTeamAssignments.isActive, true),
        excludeAssignmentId
          ? ne(ventureTeamAssignments.id, excludeAssignmentId)
          : undefined,
      ),
    );

  const totalExisting = existingAllocations.reduce(
    (sum, a) => sum + (a.allocation ?? 0), 0,
  );

  if (totalExisting + newAllocation > 100) {
    throw new PortfolioError('PORTFOLIO_ALLOCATION_EXCEEDED', {
      userId,
      currentAllocation: totalExisting,
      requestedAllocation: newAllocation,
      total: totalExisting + newAllocation,
      maximum: 100,
    });
  }
}
```

---

### Entities Module Architecture

The entities module implements a **hierarchical data model** with tree operations for the corporate structure, using recursive CTEs for hierarchy traversal.

```
┌────────────────────────────────────────────────────────┐
│                   ENTITIES MODULE                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              EntityService                       │   │
│  │                                                  │   │
│  │  ┌──────────────┐  ┌──────────────────────────┐ │   │
│  │  │ Entity CRUD  │  │ Hierarchy Engine          │ │   │
│  │  │              │  │                           │ │   │
│  │  │ create()     │  │ addChildEntity()          │ │   │
│  │  │ update()     │  │ removeChildEntity()       │ │   │
│  │  │ get()        │  │ getEntityTree()           │ │   │
│  │  │ list()       │  │ getFullHierarchy()        │ │   │
│  │  │ dissolve()   │  │ validateNoCircular()      │ │   │
│  │  └──────────────┘  └──────────────────────────┘ │   │
│  │                                                  │   │
│  │  ┌──────────────┐  ┌──────────────────────────┐ │   │
│  │  │ Ownership    │  │ Officers & Directors      │ │   │
│  │  │              │  │                           │ │   │
│  │  │ record()     │  │ appointOfficer()          │ │   │
│  │  │ update()     │  │ removeOfficer()           │ │   │
│  │  │ getTable()   │  │ getOfficers()             │ │   │
│  │  │ getCapTable()│  │ getSignatories()          │ │   │
│  │  └──────────────┘  └──────────────────────────┘ │   │
│  │                                                  │   │
│  │  ┌──────────────┐  ┌──────────────────────────┐ │   │
│  │  │ Documents    │  │ Compliance Engine         │ │   │
│  │  │              │  │                           │ │   │
│  │  │ upload()     │  │ recordCheck()             │ │   │
│  │  │ getDocuments │  │ getStatus()               │ │   │
│  │  │ getVersions  │  │ getComplianceMatrix()     │ │   │
│  │  │              │  │ getUpcomingDeadlines()     │ │   │
│  │  └──────────────┘  └──────────────────────────┘ │   │
│  │                                                  │   │
│  │  ┌──────────────┐  ┌──────────────────────────┐ │   │
│  │  │ Reg. Agents  │  │ Jurisdictions             │ │   │
│  │  │              │  │                           │ │   │
│  │  │ register()   │  │ registerIn()              │ │   │
│  │  │ update()     │  │ withdrawFrom()            │ │   │
│  │  │ getAgents()  │  │ getJurisdictions()        │ │   │
│  │  └──────────────┘  └──────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │        Hierarchy Tree Engine (CTE-based)         │   │
│  │                                                  │   │
│  │  Uses recursive PostgreSQL CTEs to traverse      │   │
│  │  parent-child relationships without N+1 queries  │   │
│  │                                                  │   │
│  │  Circular detection: DFS with visited set        │   │
│  │  before any INSERT into entity_hierarchies       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │             Drizzle Schema (8 tables)            │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

**Hierarchy Traversal (Recursive CTE):**

```typescript
// entities/hierarchy.ts
import { sql } from 'drizzle-orm';

export async function getEntityTreeCTE(
  db: DrizzleDB,
  rootEntityId?: string,
): Promise<EntityTreeNode> {
  const result = await db.execute(sql`
    WITH RECURSIVE entity_tree AS (
      -- Base case: root entity (or all roots if no rootEntityId)
      SELECT
        e.id,
        e.name,
        e.legal_name,
        e.entity_type,
        e.status,
        e.venture_id,
        NULL::uuid AS parent_entity_id,
        NULL::numeric AS ownership_percent,
        NULL::boolean AS is_controlling,
        0 AS depth,
        ARRAY[e.id] AS path
      FROM portfolio_legal_entities e
      WHERE ${rootEntityId
        ? sql`e.id = ${rootEntityId}`
        : sql`e.is_holding_company = true AND NOT EXISTS (
            SELECT 1 FROM portfolio_entity_hierarchies h
            WHERE h.child_entity_id = e.id
              AND h.termination_date IS NULL
          )`
      }

      UNION ALL

      -- Recursive case: children
      SELECT
        child.id,
        child.name,
        child.legal_name,
        child.entity_type,
        child.status,
        child.venture_id,
        h.parent_entity_id,
        h.ownership_percent,
        h.is_controlling,
        et.depth + 1,
        et.path || child.id
      FROM portfolio_legal_entities child
      INNER JOIN portfolio_entity_hierarchies h
        ON h.child_entity_id = child.id
        AND h.termination_date IS NULL
      INNER JOIN entity_tree et
        ON et.id = h.parent_entity_id
      WHERE NOT (child.id = ANY(et.path)) -- Prevent infinite loops
    )
    SELECT * FROM entity_tree ORDER BY depth, name
  `);

  return buildTreeFromFlatRows(result.rows);
}
```

**Circular Reference Detection:**

```typescript
// entities/hierarchy.ts
export async function detectCircularReference(
  db: DrizzleDB,
  parentId: string,
  childId: string,
): Promise<boolean> {
  // Check if parentId is a descendant of childId
  // (which would create a cycle if we add parent→child)
  const result = await db.execute(sql`
    WITH RECURSIVE ancestors AS (
      SELECT parent_entity_id AS id
      FROM portfolio_entity_hierarchies
      WHERE child_entity_id = ${parentId}
        AND termination_date IS NULL

      UNION ALL

      SELECT h.parent_entity_id AS id
      FROM portfolio_entity_hierarchies h
      INNER JOIN ancestors a ON a.id = h.child_entity_id
      WHERE h.termination_date IS NULL
    )
    SELECT EXISTS (
      SELECT 1 FROM ancestors WHERE id = ${childId}
    ) AS is_circular
  `);

  return result.rows[0]?.is_circular ?? false;
}
```

**EIN Encryption/Decryption:**

```typescript
// entities/service.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.PORTFOLIO_ENCRYPTION_KEY!, 'base64');

function encryptEIN(ein: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(ein, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptEIN(encrypted: string): string {
  const [ivHex, authTagHex, data] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

### Grants Module Architecture

The grants module implements a **pipeline pattern** with a multi-stage lifecycle, milestone-linked disbursements, and comprehensive compliance tracking.

```
┌────────────────────────────────────────────────────────┐
│                    GRANTS MODULE                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              GrantService                        │   │
│  │                                                  │   │
│  │  ┌───────────────────┐  ┌──────────────────────┐│   │
│  │  │  Grant CRUD &     │  │  Application Manager ││   │
│  │  │  Pipeline Manager │  │                      ││   │
│  │  │                   │  │  createApplication()  ││   │
│  │  │  createGrant()    │  │  submitApplication()  ││   │
│  │  │  qualifyGrant()   │  │  reviseApplication()  ││   │
│  │  │  applyForGrant()  │  │  getApplication()     ││   │
│  │  │  recordAward()    │  │                      ││   │
│  │  │  activateGrant()  │  │  Manages narratives,  ││   │
│  │  │  completeGrant()  │  │  budgets, key         ││   │
│  │  │  closeGrant()     │  │  personnel, versions  ││   │
│  │  └───────────┬───────┘  └───────────┬──────────┘│   │
│  │              │                       │           │   │
│  │  ┌───────────┴───────────────────────┴─────────┐│   │
│  │  │         Grant Lifecycle State Machine        ││   │
│  │  │                                              ││   │
│  │  │  VALID_TRANSITIONS = {                       ││   │
│  │  │    discovered:  ['qualified'],                ││   │
│  │  │    qualified:   ['discovered', 'applied'],    ││   │
│  │  │    applied:     ['awarded', 'declined',       ││   │
│  │  │                  'withdrawn'],                ││   │
│  │  │    awarded:     ['active'],                   ││   │
│  │  │    active:      ['completed', 'on_hold',      ││   │
│  │  │                  'terminated'],               ││   │
│  │  │    on_hold:     ['active', 'terminated'],     ││   │
│  │  │    completed:   ['closed'],                   ││   │
│  │  │    declined:    [],                           ││   │
│  │  │    withdrawn:   [],                           ││   │
│  │  │    terminated:  [],                           ││   │
│  │  │    closed:      [],                           ││   │
│  │  │  }                                           ││   │
│  │  └──────────────────────────────────────────────┘│   │
│  │                                                  │   │
│  │  ┌──────────────────┐  ┌──────────────────────┐ │   │
│  │  │ Milestone Engine │  │ Disbursement Manager │ │   │
│  │  │                  │  │                      │ │   │
│  │  │ createMilestone  │  │ requestDisbursement  │ │   │
│  │  │ updateStatus     │  │ approveDisbursement  │ │   │
│  │  │ verifyMilestone  │◄─┤ recordReceipt        │ │   │
│  │  │ getMilestones    │  │ getDisbursements     │ │   │
│  │  │                  │──►  Auto-trigger on     │ │   │
│  │  │ fundingTrigger   │  │  milestone verify    │ │   │
│  │  └──────────────────┘  └──────────────────────┘ │   │
│  │                                                  │   │
│  │  ┌──────────────────┐  ┌──────────────────────┐ │   │
│  │  │ Compliance Mgr   │  │ Budget Engine        │ │   │
│  │  │                  │  │                      │ │   │
│  │  │ createReport     │  │ createBudget         │ │   │
│  │  │ submitReport     │  │ recordExpenditure    │ │   │
│  │  │ getReports       │  │ getBudgetVsActual    │ │   │
│  │  │ getOverdue       │  │ getBurnRate          │ │   │
│  │  └──────────────────┘  └──────────────────────┘ │   │
│  │                                                  │   │
│  │  ┌──────────────────┐  ┌──────────────────────┐ │   │
│  │  │ Deadline Engine  │  │ Analytics            │ │   │
│  │  │                  │  │                      │ │   │
│  │  │ createDeadline   │  │ getGrantPipeline     │ │   │
│  │  │ completeDeadline │  │ getFundingForecast   │ │   │
│  │  │ getUpcoming      │  │ getGrantsByVenture   │ │   │
│  │  │ getOverdue       │  │                      │ │   │
│  │  │                  │  │                      │ │   │
│  │  │ Daily cron scans │  │                      │ │   │
│  │  │ reminderDays[]   │  │                      │ │   │
│  │  └──────────────────┘  └──────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │             Drizzle Schema (10 tables)           │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

**Milestone-Triggered Disbursement:**

```typescript
// grants/service.ts
async verifyMilestone(
  milestoneId: string,
  verifiedBy: string,
): Promise<GrantMilestone> {
  const milestone = await this.getMilestone(milestoneId);
  if (!milestone) throw new PortfolioError('PORTFOLIO_MILESTONE_NOT_FOUND');

  // Update milestone status
  const [updated] = await db
    .update(grantMilestones)
    .set({
      status: 'completed',
      verifiedBy,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(grantMilestones.id, milestoneId))
    .returning();

  // Auto-create disbursement if funding trigger
  if (milestone.fundingTrigger && milestone.triggerAmount) {
    const grant = await this.getGrant(milestone.grantId);
    const disbursementNumber = await this.generateDisbursementNumber(grant!.id);

    await db.insert(grantDisbursements).values({
      grantId: milestone.grantId,
      milestoneId,
      disbursementNumber,
      amount: milestone.triggerAmount,
      status: 'pending',
      requestedDate: new Date(),
    });

    // Emit event for treasury integration
    await fabricService.emitEvent({
      type: 'portfolio.grants.disbursement_requested',
      payload: {
        grantId: milestone.grantId,
        milestoneId,
        amount: milestone.triggerAmount,
        disbursementNumber,
      },
    });
  }

  return updated;
}
```

**Budget Expenditure Tracking:**

```typescript
// grants/service.ts
async recordExpenditure(
  budgetLineId: string,
  amount: string,
  description: string,
): Promise<GrantBudgetLine> {
  const line = await db.query.grantBudgetLines.findFirst({
    where: eq(grantBudgetLines.id, budgetLineId),
  });

  if (!line) throw new PortfolioError('PORTFOLIO_MILESTONE_NOT_FOUND');

  const newExpended = (parseFloat(line.expendedAmount ?? '0') + parseFloat(amount)).toFixed(4);
  const remaining = (parseFloat(line.budgetedAmount) - parseFloat(newExpended)).toFixed(4);

  // Check over-budget
  if (parseFloat(remaining) < 0) {
    // Emit warning but don't block — some grants allow reallocation
    await fabricService.emitEvent({
      type: 'portfolio.grants.budget_over_limit',
      payload: {
        budgetLineId,
        budgetedAmount: line.budgetedAmount,
        expendedAmount: newExpended,
        overageAmount: Math.abs(parseFloat(remaining)).toFixed(4),
        category: line.category,
      },
    });
  }

  const [updated] = await db
    .update(grantBudgetLines)
    .set({
      expendedAmount: newExpended,
      remainingAmount: remaining,
      updatedAt: new Date(),
    })
    .where(eq(grantBudgetLines.id, budgetLineId))
    .returning();

  // Update grant-level remaining amount
  await this.syncGrantRemainingAmount(line.budgetId);

  return updated;
}
```

**Deadline Reminder Cron:**

```typescript
// grants/cron/deadline-reminders.ts
import { and, lte, gte, eq, isNull } from 'drizzle-orm';
import { addDays, differenceInDays, startOfDay } from 'date-fns';

export async function checkGrantDeadlines(): Promise<void> {
  const today = startOfDay(new Date());
  const upcoming = await db.query.grantDeadlines.findMany({
    where: and(
      eq(grantDeadlines.status, 'upcoming'),
      isNull(grantDeadlines.completedAt),
      lte(grantDeadlines.dueDate, addDays(today, 30)),
    ),
    with: {
      grant: true,
    },
  });

  for (const deadline of upcoming) {
    const daysUntilDue = differenceInDays(deadline.dueDate, today);
    const reminderDays = deadline.reminderDays ?? [30, 14, 7, 3, 1];

    if (reminderDays.includes(daysUntilDue)) {
      // Check if we already sent a reminder today
      if (deadline.lastReminderSent &&
          differenceInDays(today, deadline.lastReminderSent) < 1) {
        continue;
      }

      // Send notification via @mcv/notifications
      await notificationService.send({
        type: 'grant_deadline_approaching',
        recipientId: deadline.assigneeId ?? deadline.grant?.createdBy,
        data: {
          grantTitle: deadline.grant?.title,
          deadlineTitle: deadline.title,
          dueDate: deadline.dueDate,
          daysRemaining: daysUntilDue,
          deadlineType: deadline.deadlineType,
        },
        channels: ['email', 'push'],
        priority: daysUntilDue <= 3 ? 'high' : 'normal',
      });

      // Update last reminder sent
      await db
        .update(grantDeadlines)
        .set({
          lastReminderSent: new Date(),
          status: daysUntilDue === 0 ? 'due_today' : 'approaching',
        })
        .where(eq(grantDeadlines.id, deadline.id));
    }

    // Mark overdue
    if (daysUntilDue < 0) {
      await db
        .update(grantDeadlines)
        .set({ status: 'overdue', updatedAt: new Date() })
        .where(eq(grantDeadlines.id, deadline.id));
    }
  }
}
```

---

### Strategy Module Architecture

The strategy module implements a **multi-concern service** handling OKRs, competitive intelligence, market sizing, venture scoring, investment theses, and configurable dashboards.

```
┌─────────────────────────────────────────────────────────────┐
│                    STRATEGY MODULE                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 StrategyService                       │   │
│  │                                                      │   │
│  │  ┌────────────────────────┐  ┌─────────────────────┐│   │
│  │  │   OKR Engine           │  │ Competitive Intel   ││   │
│  │  │                        │  │                     ││   │
│  │  │  createObjective()     │  │ createAnalysis()    ││   │
│  │  │  createKeyResult()     │  │ addCompetitor()     ││   │
│  │  │  checkinKeyResult()    │  │ getCompetitorMatrix ││   │
│  │  │  getOkrTree()          │  │ getLatestAnalysis() ││   │
│  │  │                        │  │                     ││   │
│  │  │  Auto-progress calc:   │  │ SWOT analysis       ││   │
│  │  │  objective.progress =  │  │ Threat assessment   ││   │
│  │  │  Σ(kr.progress * kr.w) │  │ Moat evaluation     ││   │
│  │  │                        │  │ 90-day freshness    ││   │
│  │  └────────────────────────┘  └─────────────────────┘│   │
│  │                                                      │   │
│  │  ┌────────────────────────┐  ┌─────────────────────┐│   │
│  │  │   Market Sizing        │  │ Venture Scorecards  ││   │
│  │  │                        │  │                     ││   │
│  │  │  createMarketSizing()  │  │ scoreVenture()      ││   │
│  │  │  getLatest()           │  │ getVentureRankings()││   │
│  │  │  compare()             │  │ getScorecardTrends()││   │
│  │  │                        │  │                     ││   │
│  │  │  TAM / SAM / SOM      │  │ 5 dimensions:       ││   │
│  │  │  Top-down, bottom-up,  │  │ financial, market,  ││   │
│  │  │  value-theory methods  │  │ product, team,      ││   │
│  │  │                        │  │ strategic           ││   │
│  │  │                        │  │                     ││   │
│  │  │                        │  │ Auto-ranking:       ││   │
│  │  │                        │  │ A: 80-100           ││   │
│  │  │                        │  │ B: 60-79            ││   │
│  │  │                        │  │ C: 40-59            ││   │
│  │  │                        │  │ D: 0-39             ││   │
│  │  └────────────────────────┘  └─────────────────────┘│   │
│  │                                                      │   │
│  │  ┌────────────────────────┐  ┌─────────────────────┐│   │
│  │  │   Investment Theses    │  │ Pivot Decisions     ││   │
│  │  │                        │  │                     ││   │
│  │  │  createThesis()        │  │ recordPivot()       ││   │
│  │  │  validateThesis()      │  │ updateOutcome()     ││   │
│  │  │  invalidateThesis()    │  │ getPivotHistory()   ││   │
│  │  │  getActiveTheses()     │  │ getPivotAnalysis()  ││   │
│  │  │                        │  │                     ││   │
│  │  │  Lifecycle:            │  │ Captures before/    ││   │
│  │  │  active → validated    │  │ after metrics       ││   │
│  │  │  active → invalidated  │  │ Success rate calcs  ││   │
│  │  │  active → revised      │  │                     ││   │
│  │  └────────────────────────┘  └─────────────────────┘│   │
│  │                                                      │   │
│  │  ┌────────────────────────┐  ┌─────────────────────┐│   │
│  │  │  Strategic Initiatives │  │ Dashboard Engine    ││   │
│  │  │                        │  │                     ││   │
│  │  │  createInitiative()    │  │ createDashboard()   ││   │
│  │  │  updateProgress()      │  │ addWidget()         ││   │
│  │  │  getInitiatives()      │  │ updateWidget()      ││   │
│  │  │                        │  │ refreshWidgetData() ││   │
│  │  │  Budget tracking       │  │ getDefaultDash()    ││   │
│  │  │  Milestone tracking    │  │                     ││   │
│  │  │  Risk management       │  │ Widget caching      ││   │
│  │  │                        │  │ Auto-refresh        ││   │
│  │  └────────────────────────┘  └─────────────────────┘│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Drizzle Schema (12+ tables)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**OKR Auto-Progress Calculation:**

```typescript
// strategy/service.ts
async checkinKeyResult(
  keyResultId: string,
  input: KeyResultCheckinInput,
): Promise<KeyResultCheckin> {
  const kr = await db.query.keyResults.findFirst({
    where: eq(keyResults.id, keyResultId),
  });
  if (!kr) throw new PortfolioError('PORTFOLIO_OBJECTIVE_NOT_FOUND');

  // Calculate KR progress based on scoring method
  const progress = this.calculateKRProgress(
    kr.scoringMethod ?? 'linear',
    parseFloat(kr.startValue ?? '0'),
    parseFloat(input.newValue),
    parseFloat(kr.targetValue),
  );

  // Create check-in record
  const [checkin] = await db.insert(keyResultCheckins).values({
    keyResultId,
    checkinDate: new Date(),
    previousValue: kr.currentValue,
    newValue: input.newValue,
    confidence: input.confidence,
    status: input.status,
    notes: input.notes,
    blockers: input.blockers ?? [],
    checkedInBy: input.checkedInBy,
  }).returning();

  // Update KR current value and progress
  await db.update(keyResults).set({
    currentValue: input.newValue,
    progress: progress.toFixed(2),
    status: input.status,
    updatedAt: new Date(),
  }).where(eq(keyResults.id, keyResultId));

  // Recalculate parent objective progress
  await this.recalculateObjectiveProgress(kr.objectiveId);

  return checkin;
}

private calculateKRProgress(
  method: string,
  start: number,
  current: number,
  target: number,
): number {
  switch (method) {
    case 'linear': {
      const range = target - start;
      if (range === 0) return current >= target ? 100 : 0;
      const progress = ((current - start) / range) * 100;
      return Math.max(0, Math.min(100, progress));
    }
    case 'binary':
      return current >= target ? 100 : 0;
    case 'threshold':
      // Threshold: any progress counts as partial
      if (current >= target) return 100;
      if (current <= start) return 0;
      return Math.round(((current - start) / (target - start)) * 100);
    default:
      return 0;
  }
}

private async recalculateObjectiveProgress(objectiveId: string): Promise<void> {
  const krs = await db.query.keyResults.findMany({
    where: eq(keyResults.objectiveId, objectiveId),
  });

  if (krs.length === 0) return;

  const totalWeight = krs.reduce((sum, kr) => sum + parseFloat(kr.weight ?? '1'), 0);
  const weightedProgress = krs.reduce((sum, kr) => {
    const weight = parseFloat(kr.weight ?? '1') / totalWeight;
    const progress = parseFloat(kr.progress ?? '0');
    return sum + (progress * weight);
  }, 0);

  await db.update(strategicObjectives).set({
    progress: weightedProgress.toFixed(2),
    updatedAt: new Date(),
  }).where(eq(strategicObjectives.id, objectiveId));

  // If this objective has a parent, recurse upward
  const objective = await db.query.strategicObjectives.findFirst({
    where: eq(strategicObjectives.id, objectiveId),
  });

  if (objective?.parentObjectiveId) {
    // Recalculate parent's confidence based on child objectives
    await this.recalculateParentConfidence(objective.parentObjectiveId);
  }
}
```

**Scorecard Auto-Ranking:**

```typescript
// strategy/scoring.ts
async scoreVenture(
  ventureId: string,
  input: VentureScorecardInput,
): Promise<VentureScorecard> {
  // Calculate weighted overall score
  const overallScore = Object.values(input.scores).reduce(
    (sum, dim) => sum + (dim.score * dim.weight), 0,
  );

  // Validate weights sum to 1.0
  const totalWeight = Object.values(input.scores).reduce(
    (sum, dim) => sum + dim.weight, 0,
  );
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    throw new PortfolioError('PORTFOLIO_SCORECARD_WEIGHTS_INVALID', {
      totalWeight,
      expected: 1.0,
    });
  }

  // Get previous score for trend
  const previousScorecard = await db.query.ventureScorecards.findFirst({
    where: and(
      eq(ventureScorecards.ventureId, ventureId),
    ),
    orderBy: desc(ventureScorecards.scoredAt),
  });

  const previousScore = previousScorecard
    ? parseFloat(previousScorecard.overallScore)
    : null;

  // Determine tier
  const tier = this.determineTier(overallScore);

  // Insert scorecard
  const [scorecard] = await db.insert(ventureScorecards).values({
    ventureId,
    period: input.period,
    overallScore: overallScore.toFixed(2),
    tier,
    scores: input.scores,
    previousScore: previousScore?.toFixed(2),
    scoreChange: previousScore
      ? (overallScore - previousScore).toFixed(2)
      : null,
    notes: input.notes,
    scoredAt: new Date(),
  }).returning();

  // Re-rank all ventures for this period
  await this.reRankVentures(input.period);

  return scorecard;
}

private determineTier(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

private async reRankVentures(period: string): Promise<void> {
  // Get all scorecards for this period, ordered by score
  const scorecards = await db.query.ventureScorecards.findMany({
    where: eq(ventureScorecards.period, period),
    orderBy: desc(ventureScorecards.overallScore),
  });

  // Update ranks
  for (let i = 0; i < scorecards.length; i++) {
    await db.update(ventureScorecards)
      .set({ rank: i + 1 })
      .where(eq(ventureScorecards.id, scorecards[i].id));
  }
}
```

**Dashboard Widget Caching:**

```typescript
// strategy/service.ts — Dashboard widget cache management
async refreshWidgetData(widgetId: string): Promise<DashboardWidget> {
  const widget = await db.query.dashboardWidgets.findFirst({
    where: eq(dashboardWidgets.id, widgetId),
  });
  if (!widget) throw new Error('Widget not found');

  // Fetch fresh data based on data source
  const data = await this.fetchWidgetData(widget.dataSource, widget.config);

  // Update cached data
  const [updated] = await db.update(dashboardWidgets).set({
    cachedData: data,
    cachedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(dashboardWidgets.id, widgetId)).returning();

  // Also update Redis cache
  await redis.set(
    `portfolio:widget:${widgetId}`,
    JSON.stringify(data),
    'EX',
    widget.refreshInterval ?? 300,
  );

  return updated;
}

private async fetchWidgetData(
  dataSource: string,
  config: Record<string, unknown>,
): Promise<unknown> {
  const [domain, metric] = dataSource.split('.');

  switch (domain) {
    case 'ventures':
      if (metric === 'health') return ventureService.getHealthHeatmap();
      if (metric === 'list') return ventureService.listVentures(config as any);
      break;
    case 'grants':
      if (metric === 'pipeline') return grantService.getGrantPipeline();
      if (metric === 'forecast') return grantService.getFundingForecast(config.months as number);
      break;
    case 'strategy':
      if (metric === 'okrs') return this.getOkrTree(config as any);
      if (metric === 'rankings') return this.getVentureRankings(config.period as string);
      break;
    case 'kpis':
      return ventureService.getKpiDashboard(
        config.ventureId as string,
        config.period as string,
      );
    case 'aggregation':
      return portfolioAggregationService.getPortfolioSummary();
    default:
      throw new Error(`Unknown data source: ${dataSource}`);
  }
}
```

---

### Aggregation Layer Architecture

The aggregation layer composes data from all four submodules to produce cross-venture analytics, portfolio summaries, and consolidated reporting.

```
┌─────────────────────────────────────────────────────────────┐
│                    AGGREGATION LAYER                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          PortfolioAggregationService                  │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  getPortfolioSummary()                        │   │   │
│  │  │                                               │   │   │
│  │  │  Aggregates: venture count by status,         │   │   │
│  │  │  total revenue, burn rate, health distribution│   │   │
│  │  │  active grants, total grant funding,          │   │   │
│  │  │  consortium OKR progress                      │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  compareVentures(ventureIds, metrics)         │   │   │
│  │  │                                               │   │   │
│  │  │  Side-by-side comparison across ventures      │   │   │
│  │  │  for selected metrics (revenue, users,        │   │   │
│  │  │  health score, team size, etc.)               │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  getPortfolioHealthReport()                   │   │   │
│  │  │                                               │   │   │
│  │  │  Health heatmap across all ventures,          │   │   │
│  │  │  dimension breakdowns, trend analysis,        │   │   │
│  │  │  alerts and escalations                       │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  getAllocationAnalysis()                       │   │   │
│  │  │                                               │   │   │
│  │  │  Team allocation across ventures,             │   │   │
│  │  │  budget allocation, infrastructure costs,     │   │   │
│  │  │  over/under-allocated resources               │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  getConsolidatedMetrics(period)               │   │   │
│  │  │                                               │   │   │
│  │  │  Unified KPI view: revenue, users, growth,    │   │   │
│  │  │  burn, runway per venture and consolidated    │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        DATA SOURCES (read-only cross-module)          │   │
│  │                                                      │   │
│  │  VentureService ─── health, KPIs, team, deployments  │   │
│  │  EntityService  ─── compliance matrix, hierarchy      │   │
│  │  GrantService   ─── pipeline, funding, deadlines      │   │
│  │  StrategyService ── OKRs, scorecards, rankings        │   │
│  │  @mcv/finance   ─── revenue, P&L, budgets (external)  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        MATERIALIZED VIEWS (PostgreSQL)                │   │
│  │                                                      │   │
│  │  mv_portfolio_summary ── Refreshed every 5 minutes    │   │
│  │  mv_venture_health_latest ── Latest health per venture│   │
│  │  mv_grant_pipeline_summary ── Grant counts by status  │   │
│  │  mv_consolidated_kpis ── Cross-venture KPI rollup     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Portfolio Summary Implementation:**

```typescript
// aggregation/service.ts
export class PortfolioAggregationService {
  async getPortfolioSummary(): Promise<PortfolioSummary> {
    // Check Redis cache first
    const cached = await redis.get('portfolio:aggregation:summary');
    if (cached) return JSON.parse(cached);

    // Query materialized view or compute
    const [ventureStats] = await db.execute(sql`
      SELECT
        COUNT(*) AS total_ventures,
        COUNT(*) FILTER (WHERE status = 'active' OR status = 'scaling') AS active_ventures,
        COUNT(*) FILTER (WHERE status = 'concept') AS concept_ventures,
        COUNT(*) FILTER (WHERE status = 'hibernating') AS hibernating_ventures,
        COUNT(*) FILTER (WHERE status = 'sunset') AS sunset_ventures
      FROM portfolio_ventures
      WHERE status != 'archived'
    `);

    const [healthStats] = await db.execute(sql`
      SELECT
        overall_health,
        COUNT(*) AS count
      FROM (
        SELECT DISTINCT ON (venture_id)
          venture_id, overall_health
        FROM portfolio_venture_health_snapshots
        ORDER BY venture_id, snapshot_date DESC
      ) latest_health
      GROUP BY overall_health
    `);

    const [grantStats] = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') AS active_grants,
        COALESCE(SUM(awarded_amount) FILTER (WHERE status IN ('active', 'completed')), 0) AS total_funding,
        COUNT(*) FILTER (WHERE status IN ('discovered', 'qualified', 'applied')) AS pipeline_count
      FROM portfolio_grants
    `);

    const [okrStats] = await db.execute(sql`
      SELECT
        AVG(progress::numeric) AS avg_progress
      FROM portfolio_strategic_objectives
      WHERE level = 'consortium'
        AND status = 'active'
    `);

    // Get top ventures by scorecard
    const topVentures = await db.query.ventureScorecards.findMany({
      orderBy: desc(ventureScorecards.overallScore),
      limit: 5,
      with: { venture: true },
    });

    const summary: PortfolioSummary = {
      totalVentures: Number(ventureStats.total_ventures),
      activeVentures: Number(ventureStats.active_ventures),
      totalRevenue: await this.getConsolidatedRevenue(),
      totalBurn: await this.getConsolidatedBurn(),
      healthDistribution: this.buildHealthDistribution(healthStats),
      topVenturesByScore: topVentures.map(s => ({
        venture: s.venture.name,
        score: parseFloat(s.overallScore),
        rank: s.rank!,
        tier: s.tier!,
      })),
      activeGrants: Number(grantStats.active_grants),
      totalGrantFunding: grantStats.total_funding,
      okrProgress: parseFloat(okrStats.avg_progress ?? '0'),
      lastUpdated: new Date(),
    };

    // Cache for 5 minutes
    await redis.set(
      'portfolio:aggregation:summary',
      JSON.stringify(summary),
      'EX',
      300,
    );

    return summary;
  }

  private async getConsolidatedRevenue(): Promise<string> {
    // Pull from @mcv/finance
    const financeData = await financeService.getConsolidatedRevenue({
      period: 'current_month',
      ventureIds: 'all',
    });
    return financeData.totalRevenue;
  }
}
```

---

## Data Models & Database Schema

### Complete Schema Overview

The `@mcv/portfolio` package manages **39 database tables** organized across 4 submodules plus the dashboard system:

```
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE SCHEMA MAP                         │
│                                                              │
│  VENTURES (9 tables)                                         │
│  ├── portfolio_ventures                    (master)          │
│  ├── portfolio_venture_configs             (1:1 with venture)│
│  ├── portfolio_venture_health_snapshots    (time series)     │
│  ├── portfolio_venture_kpis                (KPI definitions) │
│  ├── portfolio_venture_kpi_records         (measurements)    │
│  ├── portfolio_venture_team_assignments    (team members)    │
│  ├── portfolio_venture_tech_stacks         (tech registry)   │
│  ├── portfolio_venture_deployments         (environments)    │
│  └── portfolio_venture_milestones          (milestones)      │
│                                                              │
│  ENTITIES (8 tables)                                         │
│  ├── portfolio_legal_entities              (master)          │
│  ├── portfolio_entity_hierarchies          (parent-child)    │
│  ├── portfolio_ownership_structures        (ownership %)     │
│  ├── portfolio_registered_agents           (agents)          │
│  ├── portfolio_corporate_documents         (doc vault)       │
│  ├── portfolio_entity_compliance_records   (compliance)      │
│  ├── portfolio_entity_officers             (officers)        │
│  └── portfolio_entity_jurisdictions        (jurisdictions)   │
│                                                              │
│  GRANTS (10 tables)                                          │
│  ├── portfolio_grants                      (master)          │
│  ├── portfolio_grant_applications          (applications)    │
│  ├── portfolio_grant_milestones            (milestones)      │
│  ├── portfolio_grant_disbursements         (disbursements)   │
│  ├── portfolio_grant_compliance_reports    (reports)         │
│  ├── portfolio_grant_budgets               (budgets)         │
│  ├── portfolio_grant_budget_lines          (line items)      │
│  ├── portfolio_grant_deadlines             (deadlines)       │
│  ├── portfolio_grant_documents             (documents)       │
│  └── portfolio_grant_contacts              (contacts)        │
│                                                              │
│  STRATEGY (12 tables)                                        │
│  ├── portfolio_strategic_objectives        (OKR objectives)  │
│  ├── portfolio_key_results                 (key results)     │
│  ├── portfolio_key_result_checkins         (check-ins)       │
│  ├── portfolio_competitive_analyses        (analyses)        │
│  ├── portfolio_competitor_profiles         (competitors)     │
│  ├── portfolio_market_sizings              (TAM/SAM/SOM)     │
│  ├── portfolio_venture_scorecards          (scoring)         │
│  ├── portfolio_scorecard_criteria          (criteria defs)   │
│  ├── portfolio_investment_theses           (theses)          │
│  ├── portfolio_pivot_decisions             (pivots)          │
│  ├── portfolio_strategic_initiatives       (initiatives)     │
│  └── portfolio_dashboards                  (dashboards)      │
│                                                              │
│  DASHBOARD WIDGETS (1 table)                                 │
│  └── portfolio_dashboard_widgets           (widgets)         │
│                                                              │
│  MATERIALIZED VIEWS (4 views)                                │
│  ├── mv_portfolio_summary                                    │
│  ├── mv_venture_health_latest                                │
│  ├── mv_grant_pipeline_summary                               │
│  └── mv_consolidated_kpis                                    │
└─────────────────────────────────────────────────────────────┘
```

### Key Schema Relationships

```
portfolio_ventures (1)──────────(N) portfolio_venture_configs
       │
       ├──(N) portfolio_venture_health_snapshots
       ├──(N) portfolio_venture_kpis ──(N) portfolio_venture_kpi_records
       ├──(N) portfolio_venture_team_assignments
       ├──(N) portfolio_venture_tech_stacks
       ├──(N) portfolio_venture_deployments
       ├──(N) portfolio_venture_milestones
       │
       ├──(N) portfolio_legal_entities
       │         ├──(N) portfolio_entity_hierarchies (self-referencing)
       │         ├──(N) portfolio_ownership_structures
       │         ├──(N) portfolio_registered_agents
       │         ├──(N) portfolio_corporate_documents
       │         ├──(N) portfolio_entity_compliance_records
       │         ├──(N) portfolio_entity_officers
       │         └──(N) portfolio_entity_jurisdictions
       │
       ├──(N) portfolio_grants
       │         ├──(N) portfolio_grant_applications
       │         ├──(N) portfolio_grant_milestones ──(?) portfolio_grant_disbursements
       │         ├──(N) portfolio_grant_disbursements
       │         ├──(N) portfolio_grant_compliance_reports
       │         ├──(N) portfolio_grant_budgets ──(N) portfolio_grant_budget_lines
       │         ├──(N) portfolio_grant_deadlines
       │         ├──(N) portfolio_grant_documents
       │         └──(N) portfolio_grant_contacts
       │
       ├──(N) portfolio_strategic_objectives (self-referencing via parentObjectiveId)
       │         └──(N) portfolio_key_results
       │                   └──(N) portfolio_key_result_checkins
       │
       ├──(N) portfolio_competitive_analyses
       │         └──(N) portfolio_competitor_profiles
       │
       ├──(N) portfolio_market_sizings
       ├──(N) portfolio_venture_scorecards
       ├──(N) portfolio_investment_theses
       ├──(N) portfolio_pivot_decisions
       └──(N) portfolio_strategic_initiatives

portfolio_scorecard_criteria (standalone — defines scoring framework)

portfolio_dashboards ──(N) portfolio_dashboard_widgets
```

### Database Index Strategy

```sql
-- ═══════════════════════════════════════════════════════════════
-- VENTURE INDEXES
-- ═══════════════════════════════════════════════════════════════

-- Venture lookups by slug (unique), status, stage
CREATE UNIQUE INDEX idx_ventures_slug ON portfolio_ventures(slug);
CREATE INDEX idx_ventures_status ON portfolio_ventures(status);
CREATE INDEX idx_ventures_status_stage ON portfolio_ventures(status, stage);
CREATE INDEX idx_ventures_priority ON portfolio_ventures(priority);
CREATE INDEX idx_ventures_tenant ON portfolio_ventures(tenant_id);

-- Health snapshots: latest per venture
CREATE INDEX idx_health_venture_date ON portfolio_venture_health_snapshots(venture_id, snapshot_date DESC);

-- KPI records: venture + period for dashboards
CREATE INDEX idx_kpi_records_venture_period ON portfolio_venture_kpi_records(venture_id, period);
CREATE INDEX idx_kpi_records_kpi_period ON portfolio_venture_kpi_records(kpi_id, period);

-- Team assignments: active members per venture
CREATE INDEX idx_team_venture_active ON portfolio_venture_team_assignments(venture_id, is_active);
CREATE INDEX idx_team_user_active ON portfolio_venture_team_assignments(user_id, is_active);

-- ═══════════════════════════════════════════════════════════════
-- ENTITY INDEXES
-- ═══════════════════════════════════════════════════════════════

-- Entity lookups
CREATE INDEX idx_entities_venture ON portfolio_legal_entities(venture_id);
CREATE INDEX idx_entities_type_status ON portfolio_legal_entities(entity_type, status);
CREATE INDEX idx_entities_holding ON portfolio_legal_entities(is_holding_company) WHERE is_holding_company = true;

-- Hierarchy traversal
CREATE INDEX idx_hierarchy_parent ON portfolio_entity_hierarchies(parent_entity_id);
CREATE INDEX idx_hierarchy_child ON portfolio_entity_hierarchies(child_entity_id);
CREATE INDEX idx_hierarchy_active ON portfolio_entity_hierarchies(parent_entity_id, child_entity_id) WHERE termination_date IS NULL;

-- Compliance deadlines
CREATE INDEX idx_compliance_entity_status ON portfolio_entity_compliance_records(entity_id, status);
CREATE INDEX idx_compliance_due_date ON portfolio_entity_compliance_records(due_date) WHERE status IN ('pending', 'overdue');

-- ═══════════════════════════════════════════════════════════════
-- GRANT INDEXES
-- ═══════════════════════════════════════════════════════════════

-- Grant lookups
CREATE INDEX idx_grants_venture_status ON portfolio_grants(venture_id, status);
CREATE INDEX idx_grants_status ON portfolio_grants(status);
CREATE INDEX idx_grants_category ON portfolio_grants(category);
CREATE INDEX idx_grants_deadline ON portfolio_grants(application_deadline);

-- Milestone lookups
CREATE INDEX idx_grant_milestones_grant ON portfolio_grant_milestones(grant_id, milestone_number);
CREATE INDEX idx_grant_milestones_status ON portfolio_grant_milestones(status);

-- Disbursement lookups
CREATE INDEX idx_disbursements_grant ON portfolio_grant_disbursements(grant_id);
CREATE INDEX idx_disbursements_status ON portfolio_grant_disbursements(status);

-- Deadline lookups (critical for cron)
CREATE INDEX idx_grant_deadlines_due ON portfolio_grant_deadlines(due_date, status);
CREATE INDEX idx_grant_deadlines_grant ON portfolio_grant_deadlines(grant_id, status);

-- ═══════════════════════════════════════════════════════════════
-- STRATEGY INDEXES
-- ═══════════════════════════════════════════════════════════════

-- OKR lookups
CREATE INDEX idx_objectives_venture_status ON portfolio_strategic_objectives(venture_id, status);
CREATE INDEX idx_objectives_level_timeframe ON portfolio_strategic_objectives(level, timeframe);
CREATE INDEX idx_objectives_parent ON portfolio_strategic_objectives(parent_objective_id);
CREATE INDEX idx_key_results_objective ON portfolio_key_results(objective_id);

-- Scorecard lookups
CREATE INDEX idx_scorecards_venture_period ON portfolio_venture_scorecards(venture_id, period);
CREATE INDEX idx_scorecards_period_score ON portfolio_venture_scorecards(period, overall_score DESC);

-- Investment theses
CREATE INDEX idx_theses_venture_status ON portfolio_investment_theses(venture_id, status);

-- Dashboard widgets
CREATE INDEX idx_widgets_dashboard ON portfolio_dashboard_widgets(dashboard_id, sort_order);
CREATE INDEX idx_widgets_cache ON portfolio_dashboard_widgets(cached_at) WHERE is_visible = true;
```

### Materialized Views

```sql
-- Portfolio summary: refreshed every 5 minutes
CREATE MATERIALIZED VIEW mv_portfolio_summary AS
SELECT
  (SELECT COUNT(*) FROM portfolio_ventures WHERE status != 'archived') AS total_ventures,
  (SELECT COUNT(*) FROM portfolio_ventures WHERE status IN ('active', 'scaling')) AS active_ventures,
  (SELECT COUNT(*) FROM portfolio_grants WHERE status = 'active') AS active_grants,
  (SELECT COALESCE(SUM(awarded_amount::numeric), 0) FROM portfolio_grants WHERE status IN ('active', 'completed')) AS total_grant_funding,
  (SELECT AVG(progress::numeric) FROM portfolio_strategic_objectives WHERE level = 'consortium' AND status = 'active') AS consortium_okr_progress,
  NOW() AS refreshed_at;

-- Latest health per venture
CREATE MATERIALIZED VIEW mv_venture_health_latest AS
SELECT DISTINCT ON (venture_id)
  venture_id,
  overall_health,
  health_score,
  dimensions,
  alerts,
  snapshot_date,
  created_at
FROM portfolio_venture_health_snapshots
ORDER BY venture_id, snapshot_date DESC;

CREATE UNIQUE INDEX ON mv_venture_health_latest(venture_id);

-- Grant pipeline summary
CREATE MATERIALIZED VIEW mv_grant_pipeline_summary AS
SELECT
  status,
  COUNT(*) AS grant_count,
  COALESCE(SUM(requested_amount::numeric), 0) AS total_requested,
  COALESCE(SUM(awarded_amount::numeric), 0) AS total_awarded,
  COALESCE(SUM(disbursed_amount::numeric), 0) AS total_disbursed
FROM portfolio_grants
GROUP BY status;

-- Consolidated KPIs
CREATE MATERIALIZED VIEW mv_consolidated_kpis AS
SELECT
  v.id AS venture_id,
  v.slug AS venture_slug,
  v.name AS venture_name,
  k.slug AS kpi_slug,
  k.name AS kpi_name,
  k.category,
  kr.period,
  kr.value,
  kr.target_value,
  kr.target_attainment,
  kr.status,
  kr.recorded_at
FROM portfolio_venture_kpi_records kr
JOIN portfolio_venture_kpis k ON k.id = kr.kpi_id
JOIN portfolio_ventures v ON v.id = kr.venture_id
WHERE kr.recorded_at = (
  SELECT MAX(recorded_at)
  FROM portfolio_venture_kpi_records sub
  WHERE sub.kpi_id = kr.kpi_id AND sub.venture_id = kr.venture_id
);

-- Refresh all materialized views (called by cron)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_portfolio_summary;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_venture_health_latest;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_grant_pipeline_summary;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_consolidated_kpis;
```

---

## Data Flow & Events

### Event Architecture (Redpanda/Kafka)

All state-changing operations in `@mcv/portfolio` emit domain events to the `portfolio.events` topic on the Redpanda (Kafka-compatible) event bus via `@mcv/fabric`.

```
┌──────────────────┐
│  @mcv/portfolio   │
│  Service Layer    │
│                   │
│  state change ──► emit event
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  @mcv/fabric      │
│  Event Bus        │
│                   │
│  portfolio.events │ ◄── Redpanda topic
│  topic            │
└────────┬─────────┘
         │
    ┌────┴────────────────────┬──────────────────────┐
    │                         │                       │
    ▼                         ▼                       ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Audit Logger  │  │ @mcv/notifications│  │ @mcv/agentic-os  │
│               │  │                   │  │                   │
│ Records all   │  │ Sends alerts for  │  │ AI agents consume │
│ state changes │  │ health warnings,  │  │ portfolio events  │
│ to audit log  │  │ deadline alerts,  │  │ for automated     │
│               │  │ compliance due    │  │ analysis          │
└──────────────┘  └──────────────────┘  └──────────────────┘
```

### Event Types

```typescript
// Event type definitions
type PortfolioEventType =
  // Venture events
  | 'portfolio.ventures.created'
  | 'portfolio.ventures.updated'
  | 'portfolio.ventures.approved'          // concept → setup
  | 'portfolio.ventures.launched'          // setup → active
  | 'portfolio.ventures.scaled'            // active → scaling
  | 'portfolio.ventures.hibernated'        // → hibernating
  | 'portfolio.ventures.reactivated'       // hibernating → active
  | 'portfolio.ventures.sunset'            // → sunset
  | 'portfolio.ventures.archived'          // sunset → archived
  | 'portfolio.ventures.config_changed'
  | 'portfolio.ventures.health_recorded'
  | 'portfolio.ventures.health_alert'
  | 'portfolio.ventures.kpi_recorded'
  | 'portfolio.ventures.team_assigned'
  | 'portfolio.ventures.team_removed'
  | 'portfolio.ventures.milestone_completed'

  // Entity events
  | 'portfolio.entities.created'
  | 'portfolio.entities.updated'
  | 'portfolio.entities.dissolved'
  | 'portfolio.entities.hierarchy_changed'
  | 'portfolio.entities.ownership_changed'
  | 'portfolio.entities.officer_appointed'
  | 'portfolio.entities.officer_removed'
  | 'portfolio.entities.compliance_filed'
  | 'portfolio.entities.compliance_overdue'
  | 'portfolio.entities.document_uploaded'

  // Grant events
  | 'portfolio.grants.created'
  | 'portfolio.grants.qualified'
  | 'portfolio.grants.applied'
  | 'portfolio.grants.awarded'
  | 'portfolio.grants.declined'
  | 'portfolio.grants.activated'
  | 'portfolio.grants.completed'
  | 'portfolio.grants.closed'
  | 'portfolio.grants.terminated'
  | 'portfolio.grants.milestone_completed'
  | 'portfolio.grants.milestone_verified'
  | 'portfolio.grants.disbursement_requested'
  | 'portfolio.grants.disbursement_received'
  | 'portfolio.grants.budget_over_limit'
  | 'portfolio.grants.deadline_approaching'
  | 'portfolio.grants.deadline_overdue'
  | 'portfolio.grants.compliance_submitted'

  // Strategy events
  | 'portfolio.strategy.objective_created'
  | 'portfolio.strategy.objective_completed'
  | 'portfolio.strategy.kr_checked_in'
  | 'portfolio.strategy.scorecard_submitted'
  | 'portfolio.strategy.rankings_updated'
  | 'portfolio.strategy.thesis_validated'
  | 'portfolio.strategy.thesis_invalidated'
  | 'portfolio.strategy.pivot_recorded'
  | 'portfolio.strategy.pivot_outcome_updated'
  | 'portfolio.strategy.analysis_stale';

// Event payload structure
interface PortfolioEvent {
  id: string;                           // UUID
  type: PortfolioEventType;
  timestamp: Date;
  source: '@mcv/portfolio';
  version: '1.0';
  payload: {
    resourceType: string;              // 'venture' | 'entity' | 'grant' | 'objective' | etc.
    resourceId: string;                // UUID of affected resource
    ventureId?: string;                // Venture context (if applicable)
    actorId: string;                   // User who triggered the change
    actorRole: string;
    action: string;                    // 'create' | 'update' | 'transition' | etc.
    before?: Record<string, unknown>;  // Previous state
    after?: Record<string, unknown>;   // New state
    metadata?: Record<string, unknown>;
  };
}
```

### Data Flow: New Venture Creation

```
User: Create Venture "BetEdge"
         │
         ▼
┌──────────────────┐
│ VentureService    │
│ createVenture()   │
│                   │
│ 1. Validate input │
│ 2. Insert DB      │
│ 3. Emit event     │
└────────┬─────────┘
         │
         ▼
portfolio.ventures.created ──► @mcv/fabric ──► Audit Log
         │
User: Approve Venture
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ VentureService    │────►│ @mcv/identity     │
│ approveVenture()  │     │ createTenant()    │
│                   │     │                   │
│ 1. Validate state │     │ Returns tenantId  │
│ 2. Create tenant  │     └──────────────────┘
│ 3. Update venture │
│ 4. Emit event     │
└────────┬─────────┘
         │
         ▼
portfolio.ventures.approved ──► @mcv/fabric
         │                          │
         │                    ┌─────┴──────────────┐
         │                    │                     │
         ▼                    ▼                     ▼
┌──────────────────┐  ┌───────────────┐  ┌──────────────────┐
│ @mcv/finance      │  │ Audit Logger   │  │ @mcv/notifications│
│                   │  │               │  │                   │
│ Initialize chart  │  │ Record        │  │ Notify team of    │
│ of accounts for   │  │ approval      │  │ new venture       │
│ venture           │  │ event         │  │ creation          │
└──────────────────┘  └───────────────┘  └──────────────────┘
```

### Data Flow: Quarterly Portfolio Review

```
Cron: portfolio.quarterly_review
         │
    ┌────┴───────────────────────────┐
    │                                │
    ▼                                ▼
┌──────────────────┐    ┌──────────────────┐
│ VentureService    │    │ @mcv/finance      │
│                   │    │                   │
│ For each active   │    │ Pull P&L per      │
│ venture:          │    │ venture, budget    │
│ - Health snapshot │    │ vs actual data     │
│ - KPI refresh     │    │                   │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
    ┌────┴───────────────────────┤
    │                            │
    ▼                            ▼
┌──────────────────┐    ┌──────────────────┐
│ GrantService      │    │ StrategyService   │
│                   │    │                   │
│ Pull grant status │    │ - Score ventures  │
│ and pipeline data │    │ - Re-rank         │
│                   │    │ - OKR progress    │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │ AggregationService    │
         │                       │
         │ Build consolidated    │
         │ portfolio report      │
         │                       │
         │ - Revenue by venture  │
         │ - Health heatmap      │
         │ - Grant pipeline      │
         │ - OKR progress        │
         │ - Venture rankings    │
         └──────────┬───────────┘
                    │
          ┌─────────┴────────────┐
          │                      │
          ▼                      ▼
  ┌───────────────┐    ┌──────────────────┐
  │ Super Admin    │    │ @mcv/fabric       │
  │ Dashboard      │    │                   │
  │ (cached widget │    │ Emit event:       │
  │  data updated) │    │ quarterly_review  │
  └───────────────┘    │ _completed        │
                       └──────────────────┘
```

---

## Integration Points

### @mcv/identity Integration

**Purpose:** Tenant creation, user references, RBAC enforcement

```typescript
// Tenant creation on venture approval
interface IdentityIntegration {
  // Called when venture transitions concept → setup
  createTenant(input: {
    slug: string;
    name: string;
    type: 'venture';
    sourcePackage: '@mcv/portfolio';
    sourceId: string; // venture UUID
  }): Promise<{ id: string; slug: string }>;

  // Called for user lookups in team assignments
  getUser(userId: string): Promise<{ id: string; email: string; name: string }>;

  // Called for RBAC checks
  getUserRole(userId: string, tenantId: string): Promise<string>;
}
```

### @mcv/fabric Integration

**Purpose:** Audit logging, event emission, notification dispatch

```typescript
// Event emission for all state changes
interface FabricIntegration {
  emitEvent(event: PortfolioEvent): Promise<void>;

  // Batch event emission for quarterly reviews
  emitEvents(events: PortfolioEvent[]): Promise<void>;

  // Audit log query (for compliance reports)
  queryAuditLog(filter: {
    resourceType?: string;
    resourceId?: string;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditEntry[]>;
}
```

### @mcv/finance Integration

**Purpose:** Revenue data, P&L, budgets for health snapshots and KPI auto-refresh

```typescript
// Finance data for health scoring and aggregation
interface FinanceIntegration {
  // Called by health snapshot cron
  getVentureFinancials(ventureId: string): Promise<{
    revenue: number;
    expenses: number;
    burnRate: number;
    runway: number; // months
    margin: number;
  }>;

  // Called by aggregation service
  getConsolidatedRevenue(options: {
    period: string;
    ventureIds: string[] | 'all';
  }): Promise<{ totalRevenue: string; byVenture: Record<string, string> }>;

  // Called by KPI refresh cron
  getKpiData(ventureId: string, kpiSlug: string): Promise<{
    value: string;
    period: string;
    source: 'finance';
  }>;
}
```

### @mcv/treasury Integration

**Purpose:** Grant disbursement routing, funding flow management

```typescript
// Treasury reads portfolio data for funding flows
interface TreasuryIntegration {
  // Treasury calls this to get grant disbursement details
  getGrantDisbursement(disbursementId: string): Promise<GrantDisbursement>;

  // Treasury notifies portfolio when disbursement is deposited
  recordDisbursementDeposit(disbursementId: string, details: {
    depositedDate: Date;
    referenceNumber: string;
    bankAccount: string; // last 4
  }): Promise<void>;
}
```

### @mcv/notifications Integration

**Purpose:** Alert delivery for deadlines, compliance, health warnings

```typescript
// Notification dispatch for various alert types
interface NotificationIntegration {
  send(notification: {
    type: string;
    recipientId: string;
    data: Record<string, unknown>;
    channels: ('email' | 'push' | 'sms')[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<void>;
}

// Notification types emitted by portfolio:
// - grant_deadline_approaching
// - grant_deadline_overdue
// - compliance_deadline_approaching
// - compliance_overdue
// - venture_health_critical
// - venture_health_warning
// - okr_checkin_reminder
// - competitive_analysis_stale
// - disbursement_received
// - venture_status_changed
```

### OpenRouter AI Integration

**Purpose:** AI-powered portfolio analysis, grant matching, competitive intelligence

```typescript
// AI integration for intelligent features
interface AIIntegration {
  // AI-powered grant matching
  suggestGrants(ventureId: string): Promise<{
    suggestions: {
      grantTitle: string;
      source: string;
      matchScore: number;
      rationale: string;
    }[];
  }>;

  // AI competitive analysis assistance
  generateCompetitiveInsights(ventureId: string): Promise<{
    insights: string[];
    threats: string[];
    opportunities: string[];
  }>;

  // AI portfolio optimization suggestions
  getPortfolioOptimizations(): Promise<{
    recommendations: {
      type: 'resource_reallocation' | 'venture_priority' | 'grant_opportunity';
      description: string;
      impact: 'high' | 'medium' | 'low';
      ventureId?: string;
    }[];
  }>;
}
```

---

## Performance Architecture

### Caching Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CACHING LAYERS                         │
│                                                          │
│  Layer 1: Application Cache (in-memory, per-request)     │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Request-scoped cache for deduplication             │  │
│  │  Example: Multiple widgets querying same venture    │  │
│  │  TTL: Request lifetime                              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Layer 2: Redis Cache (distributed)                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  portfolio:ventures:list          TTL: 5 min        │  │
│  │  portfolio:ventures:{id}          TTL: 5 min        │  │
│  │  portfolio:health:heatmap         TTL: 10 min       │  │
│  │  portfolio:health:{ventureId}     TTL: 10 min       │  │
│  │  portfolio:compliance:matrix      TTL: 1 hour       │  │
│  │  portfolio:grants:pipeline        TTL: 5 min        │  │
│  │  portfolio:aggregation:summary    TTL: 5 min        │  │
│  │  portfolio:widget:{id}            TTL: per config    │  │
│  │  portfolio:entities:hierarchy     TTL: 30 min       │  │
│  │  portfolio:rankings:{period}      TTL: 1 hour       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Layer 3: Database Cache (materialized views)            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  mv_portfolio_summary            Refresh: 5 min     │  │
│  │  mv_venture_health_latest        Refresh: 5 min     │  │
│  │  mv_grant_pipeline_summary       Refresh: 5 min     │  │
│  │  mv_consolidated_kpis            Refresh: 5 min     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Layer 4: Widget Cache (database column)                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │  portfolio_dashboard_widgets.cachedData             │  │
│  │  portfolio_dashboard_widgets.cachedAt               │  │
│  │  Refresh: per widget refreshInterval config         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Cache Invalidation Strategy

```typescript
// Cache invalidation on writes
class CacheInvalidator {
  async onVentureChange(ventureId: string): Promise<void> {
    await Promise.all([
      redis.del('portfolio:ventures:list'),
      redis.del(`portfolio:ventures:${ventureId}`),
      redis.del('portfolio:health:heatmap'),
      redis.del('portfolio:aggregation:summary'),
    ]);
  }

  async onHealthSnapshotChange(ventureId: string): Promise<void> {
    await Promise.all([
      redis.del(`portfolio:health:${ventureId}`),
      redis.del('portfolio:health:heatmap'),
      redis.del('portfolio:aggregation:summary'),
    ]);
  }

  async onGrantChange(grantId: string): Promise<void> {
    await Promise.all([
      redis.del('portfolio:grants:pipeline'),
      redis.del('portfolio:aggregation:summary'),
    ]);
  }

  async onScorecardChange(period: string): Promise<void> {
    await redis.del(`portfolio:rankings:${period}`);
  }

  async onEntityChange(): Promise<void> {
    await Promise.all([
      redis.del('portfolio:entities:hierarchy'),
      redis.del('portfolio:compliance:matrix'),
    ]);
  }
}
```

### Query Optimization Patterns

```typescript
// Pattern 1: Selective loading with include options
async listVentures(options?: {
  status?: VentureStatus[];
  include?: {
    config?: boolean;
    latestHealth?: boolean;
    teamCount?: boolean;
  };
}): Promise<Venture[]> {
  const query = db.select().from(ventures);

  if (options?.status) {
    query.where(inArray(ventures.status, options.status));
  }

  // Only join what's requested
  if (options?.include?.latestHealth) {
    // Use materialized view for latest health
    query.leftJoin(
      sql`mv_venture_health_latest h ON h.venture_id = ${ventures.id}`,
    );
  }

  return query;
}

// Pattern 2: Cursor-based pagination
async listGrantsPaginated(options: {
  cursor?: string;
  limit?: number;
  status?: GrantStatus[];
}): Promise<{ items: Grant[]; nextCursor: string | null }> {
  const limit = Math.min(options.limit ?? 50, 200);

  const query = db.select().from(grants);

  if (options.cursor) {
    query.where(gt(grants.id, options.cursor));
  }
  if (options.status) {
    query.where(inArray(grants.status, options.status));
  }

  query.orderBy(asc(grants.id)).limit(limit + 1);

  const results = await query;
  const hasNext = results.length > limit;
  const items = hasNext ? results.slice(0, limit) : results;
  const nextCursor = hasNext ? items[items.length - 1].id : null;

  return { items, nextCursor };
}

// Pattern 3: Batch loading for aggregation
async getHealthHeatmap(): Promise<HealthHeatmapData> {
  // Single query using materialized view instead of N queries
  const results = await db.execute(sql`
    SELECT
      v.slug,
      v.name,
      v.status,
      h.overall_health,
      h.health_score,
      h.dimensions,
      h.snapshot_date
    FROM portfolio_ventures v
    LEFT JOIN mv_venture_health_latest h ON h.venture_id = v.id
    WHERE v.status IN ('active', 'scaling')
    ORDER BY h.health_score DESC NULLS LAST
  `);

  return {
    ventures: results.rows.map(row => ({
      slug: row.slug,
      name: row.name,
      health: row.overall_health ?? 'unknown',
      score: row.health_score ?? 0,
      dimensions: row.dimensions,
      lastUpdated: row.snapshot_date,
    })),
    generatedAt: new Date(),
  };
}
```

---

## Scalability

### Horizontal Scaling Considerations

With 9 active ventures and ~39 tables, the current portfolio dataset is relatively small. However, the architecture is designed to scale:

1. **Time-Series Data Growth** — Health snapshots, KPI records, and key result check-ins grow continuously. Partitioning by date is recommended when tables exceed 10M rows:

```sql
-- Partition health snapshots by quarter
CREATE TABLE portfolio_venture_health_snapshots (
  -- ... columns
) PARTITION BY RANGE (snapshot_date);

CREATE TABLE portfolio_health_2026_q1 PARTITION OF portfolio_venture_health_snapshots
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
```

2. **Read Replicas** — Aggregation queries and dashboard data can be directed to read replicas to reduce load on the primary database.

3. **Event Consumer Scaling** — Redpanda consumers can scale independently. Each consumer group handles specific event types (audit, notifications, AI).

4. **Cache Scaling** — Redis clustering supports horizontal scaling of the cache layer as dashboard usage grows.

### Data Volume Estimates (Year 1)

| Table | Estimated Rows/Year | Growth Rate |
|-------|---------------------|-------------|
| `ventures` | ~15 | Low (new ventures are rare) |
| `health_snapshots` | ~13,000 | 4/day × 9 ventures × 365 |
| `kpi_records` | ~1,300 | ~12 KPIs × 9 ventures × 12 months |
| `team_assignments` | ~100 | Low churn |
| `legal_entities` | ~15 | Low (matches ventures) |
| `grants` | ~50 | ~5 grants per venture |
| `grant_milestones` | ~250 | ~5 milestones per grant |
| `strategic_objectives` | ~100 | ~10 per quarter |
| `key_results` | ~400 | ~4 per objective |
| `key_result_checkins` | ~5,000 | Weekly check-ins per KR |
| `scorecards` | ~36 | 9 ventures × 4 quarters |
| `dashboard_widgets` | ~50 | Low growth |

**Total estimated storage after 1 year:** ~50MB of structured data (excluding documents in Supabase Storage).

---

## Error Handling

### Error Class

```typescript
// errors.ts
export class PortfolioError extends Error {
  code: string;
  httpStatus: number;
  details: Record<string, unknown>;

  constructor(
    code: string,
    details?: Record<string, unknown>,
  ) {
    const errorDef = ERROR_DEFINITIONS[code];
    super(errorDef?.userMessage ?? 'An unexpected error occurred');
    this.code = code;
    this.httpStatus = errorDef?.httpStatus ?? 500;
    this.details = details ?? {};
    this.name = 'PortfolioError';
  }
}

const ERROR_DEFINITIONS: Record<string, { httpStatus: number; userMessage: string }> = {
  PORTFOLIO_VENTURE_NOT_FOUND:         { httpStatus: 404, userMessage: 'Venture not found' },
  PORTFOLIO_VENTURE_SLUG_TAKEN:        { httpStatus: 409, userMessage: 'This venture identifier is already taken' },
  PORTFOLIO_INVALID_TRANSITION:        { httpStatus: 422, userMessage: 'Cannot transition from {from} to {to}' },
  PORTFOLIO_VENTURE_NOT_DELETABLE:     { httpStatus: 422, userMessage: 'Only ventures in "concept" status can be deleted' },
  PORTFOLIO_ALLOCATION_EXCEEDED:       { httpStatus: 422, userMessage: 'Team member is over-allocated across ventures' },
  PORTFOLIO_ENTITY_NOT_FOUND:          { httpStatus: 404, userMessage: 'Legal entity not found' },
  PORTFOLIO_CIRCULAR_HIERARCHY:        { httpStatus: 422, userMessage: 'This would create a circular ownership structure' },
  PORTFOLIO_OWNERSHIP_EXCEEDED:        { httpStatus: 422, userMessage: 'Total ownership cannot exceed 100%' },
  PORTFOLIO_GRANT_NOT_FOUND:           { httpStatus: 404, userMessage: 'Grant not found' },
  PORTFOLIO_INVALID_GRANT_TRANSITION:  { httpStatus: 422, userMessage: 'Cannot transition grant from {from} to {to}' },
  PORTFOLIO_GRANT_OVER_BUDGET:         { httpStatus: 422, userMessage: 'Expenditure would exceed the budget line amount' },
  PORTFOLIO_MILESTONE_NOT_FOUND:       { httpStatus: 404, userMessage: 'Milestone not found' },
  PORTFOLIO_DISBURSEMENT_EXCEEDS_AWARD:{ httpStatus: 422, userMessage: 'Disbursement would exceed the total award amount' },
  PORTFOLIO_OBJECTIVE_NOT_FOUND:       { httpStatus: 404, userMessage: 'Strategic objective not found' },
  PORTFOLIO_OBJECTIVE_NOT_DELETABLE:   { httpStatus: 422, userMessage: 'Only objectives in "draft" status can be deleted' },
  PORTFOLIO_KR_PROGRESS_INVALID:       { httpStatus: 422, userMessage: 'Key result value must be between start and target values' },
  PORTFOLIO_SCORECARD_WEIGHTS_INVALID: { httpStatus: 422, userMessage: 'Scoring criteria weights must sum to 1.0' },
  PORTFOLIO_THESIS_ALREADY_RESOLVED:   { httpStatus: 422, userMessage: 'This thesis has already been resolved' },
  PORTFOLIO_DASHBOARD_LIMIT:           { httpStatus: 422, userMessage: 'Maximum number of dashboards reached' },
  PORTFOLIO_UNAUTHORIZED:              { httpStatus: 403, userMessage: 'You do not have access to this resource' },
};
```

### Error Handling Patterns

```typescript
// Pattern 1: Service-level validation with descriptive errors
async approveVenture(ventureId: string, approvedBy: string): Promise<Venture> {
  const venture = await this.getVenture(ventureId);
  if (!venture) {
    throw new PortfolioError('PORTFOLIO_VENTURE_NOT_FOUND', { ventureId });
  }

  validateTransition(venture.status, 'setup'); // throws PORTFOLIO_INVALID_TRANSITION

  // ... proceed with approval
}

// Pattern 2: Transaction rollback on failure
async createVentureWithEntity(
  ventureInput: CreateVentureInput,
  entityInput: CreateEntityInput,
): Promise<{ venture: Venture; entity: LegalEntity }> {
  return db.transaction(async (tx) => {
    const venture = await tx.insert(ventures).values(ventureInput).returning();
    const entity = await tx.insert(legalEntities).values({
      ...entityInput,
      ventureId: venture[0].id,
    }).returning();
    return { venture: venture[0], entity: entity[0] };
  });
}

// Pattern 3: Graceful degradation in aggregation
async getPortfolioSummary(): Promise<PortfolioSummary> {
  try {
    // Try finance integration for revenue data
    const revenue = await financeService.getConsolidatedRevenue({ period: 'current_month', ventureIds: 'all' });
    return { ...baseData, totalRevenue: revenue.totalRevenue };
  } catch (error) {
    // Finance service unavailable — return summary without revenue
    console.warn('Finance service unavailable for portfolio summary', error);
    return { ...baseData, totalRevenue: 'unavailable' };
  }
}
```

---

## Observability

### Logging Strategy

```typescript
// Structured logging with context
import { logger } from '@mcv/kernel';

const log = logger.child({ package: '@mcv/portfolio' });

// Service method logging
async createVenture(input: CreateVentureInput): Promise<Venture> {
  log.info({ slug: input.slug, industry: input.industry }, 'Creating venture');

  try {
    const venture = await db.insert(ventures).values(input).returning();
    log.info({ ventureId: venture[0].id, slug: input.slug }, 'Venture created');
    return venture[0];
  } catch (error) {
    log.error({ error, slug: input.slug }, 'Failed to create venture');
    throw error;
  }
}

// Cron job logging
async function runHealthSnapshotCron(): Promise<void> {
  const startTime = Date.now();
  log.info('Starting health snapshot cron');

  const activeVentures = await ventureService.listVentures({ status: ['active', 'scaling'] });
  let successCount = 0;
  let failCount = 0;

  for (const venture of activeVentures) {
    try {
      await ventureService.recordHealthSnapshot(venture.id, await collectHealth(venture));
      successCount++;
    } catch (error) {
      failCount++;
      log.error({ error, ventureId: venture.id }, 'Health snapshot failed');
    }
  }

  const duration = Date.now() - startTime;
  log.info({ successCount, failCount, duration, totalVentures: activeVentures.length }, 'Health snapshot cron completed');
}
```

### Metrics Export

```typescript
// metrics.ts — Prometheus-compatible metrics
import { Counter, Gauge, Histogram } from 'prom-client';

export const metrics = {
  // Venture metrics
  ventureTotal: new Gauge({
    name: 'portfolio_ventures_total',
    help: 'Total ventures by status',
    labelNames: ['status'],
  }),

  ventureHealthScore: new Gauge({
    name: 'portfolio_venture_health_score',
    help: 'Per-venture health score (0-100)',
    labelNames: ['venture_slug'],
  }),

  // Entity metrics
  complianceOverdue: new Gauge({
    name: 'portfolio_entities_compliance_overdue',
    help: 'Count of overdue compliance records',
  }),

  // Grant metrics
  grantPipelineValue: new Gauge({
    name: 'portfolio_grants_pipeline_value',
    help: 'Total value in grant pipeline by status',
    labelNames: ['status'],
  }),

  grantDeadlinesApproaching: new Gauge({
    name: 'portfolio_grants_deadlines_approaching',
    help: 'Number of grant deadlines due within 7 days',
  }),

  // Strategy metrics
  okrProgress: new Gauge({
    name: 'portfolio_strategy_okr_progress',
    help: 'Consortium-level OKR progress (0-100)',
  }),

  // API metrics
  apiLatency: new Histogram({
    name: 'portfolio_api_latency_ms',
    help: 'API endpoint latency in milliseconds',
    labelNames: ['method', 'endpoint', 'status_code'],
    buckets: [10, 25, 50, 100, 250, 500, 1000, 2500],
  }),

  apiErrors: new Counter({
    name: 'portfolio_api_errors_total',
    help: 'Total API errors by error code',
    labelNames: ['error_code'],
  }),

  // Cache metrics
  cacheHits: new Counter({
    name: 'portfolio_cache_hits_total',
    help: 'Redis cache hits',
    labelNames: ['cache_key'],
  }),

  cacheMisses: new Counter({
    name: 'portfolio_cache_misses_total',
    help: 'Redis cache misses',
    labelNames: ['cache_key'],
  }),

  // Event metrics
  eventsEmitted: new Counter({
    name: 'portfolio_events_emitted_total',
    help: 'Events emitted to fabric',
    labelNames: ['event_type'],
  }),
};
```

### Health Check Endpoint

```typescript
// api/portfolio/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkEventBus(),
  ]);

  const dbStatus = checks[0].status === 'fulfilled' ? 'connected' : 'disconnected';
  const redisStatus = checks[1].status === 'fulfilled' ? 'connected' : 'disconnected';
  const eventBusStatus = checks[2].status === 'fulfilled' ? 'connected' : 'disconnected';

  const isHealthy = checks.every(c => c.status === 'fulfilled');

  const [lastSnapshot] = await db
    .select({ snapshotDate: ventureHealthSnapshots.snapshotDate })
    .from(ventureHealthSnapshots)
    .orderBy(desc(ventureHealthSnapshots.snapshotDate))
    .limit(1);

  const [ventureCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(ventures)
    .where(inArray(ventures.status, ['active', 'scaling']));

  const [deadlineCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(grantDeadlines)
    .where(
      and(
        eq(grantDeadlines.status, 'approaching'),
        lte(grantDeadlines.dueDate, addDays(new Date(), 7)),
      ),
    );

  const [overdueCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(entityComplianceRecords)
    .where(eq(entityComplianceRecords.status, 'overdue'));

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    version: '1.0.0',
    database: dbStatus,
    redis: redisStatus,
    eventBus: eventBusStatus,
    lastHealthSnapshot: lastSnapshot?.snapshotDate ?? null,
    activeVentures: ventureCount?.count ?? 0,
    pendingDeadlines: deadlineCount?.count ?? 0,
    overdueCompliance: overdueCount?.count ?? 0,
    timestamp: new Date().toISOString(),
  }, {
    status: isHealthy ? 200 : 503,
  });
}
```

---

## Security Architecture

### Defense-in-Depth Model

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Transport Security                             │
│  TLS 1.3 for all API calls                              │
│  Encrypted Supabase connections                         │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Authentication                                 │
│  Supabase Auth (JWT tokens)                             │
│  API route middleware validates JWT                      │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Authorization (Application)                    │
│  Service-level role checks                              │
│  Venture-scoped access control                          │
│  Resource ownership validation                          │
├─────────────────────────────────────────────────────────┤
│  Layer 4: Authorization (Database)                       │
│  PostgreSQL Row-Level Security (RLS)                    │
│  Policies per table per operation                       │
│  Defense against application-layer bypass               │
├─────────────────────────────────────────────────────────┤
│  Layer 5: Data Encryption                                │
│  AES-256-GCM for EIN, compensation data                 │
│  Field-level encryption for sensitive columns           │
├─────────────────────────────────────────────────────────┤
│  Layer 6: Input Validation                               │
│  Zod schemas on every service method                    │
│  SQL injection prevention via Drizzle parameterization  │
│  Amount/percentage range validation                     │
├─────────────────────────────────────────────────────────┤
│  Layer 7: Audit Trail                                    │
│  Every state change logged to @mcv/fabric               │
│  Before/after snapshots for forensic analysis           │
│  Immutable audit log                                    │
└─────────────────────────────────────────────────────────┘
```

### RLS Policy Architecture

```sql
-- ═══════════════════════════════════════════════════════════════
-- BASE POLICIES: Applied to all portfolio tables
-- ═══════════════════════════════════════════════════════════════

-- Helper function: Check if user has portfolio access
CREATE OR REPLACE FUNCTION portfolio_has_access(
  p_user_id UUID,
  p_venture_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Super admins and portfolio admins always have access
  IF auth.role() IN ('super_admin', 'portfolio_admin') THEN
    RETURN TRUE;
  END IF;

  -- If no venture_id specified, deny (must be scoped)
  IF p_venture_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check venture team membership
  RETURN EXISTS (
    SELECT 1 FROM portfolio_venture_team_assignments
    WHERE user_id = p_user_id
      AND venture_id = p_venture_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════
-- WRITE POLICIES: Restricted to admins and venture leads
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "portfolio_grants_insert" ON portfolio_grants
  FOR INSERT WITH CHECK (
    auth.role() IN ('super_admin', 'portfolio_admin')
    OR (
      auth.role() = 'venture_admin'
      AND venture_id IN (
        SELECT venture_id FROM portfolio_venture_team_assignments
        WHERE user_id = auth.uid()
          AND role IN ('lead', 'admin')
          AND is_active = true
      )
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- SENSITIVE DATA POLICIES: Extra restrictions for encrypted fields
-- ═══════════════════════════════════════════════════════════════

-- EIN field: Only super_admin and entity_admin can read
CREATE POLICY "portfolio_entities_ein_select" ON portfolio_legal_entities
  FOR SELECT USING (
    CASE
      WHEN auth.role() IN ('super_admin', 'entity_admin') THEN true
      ELSE ein IS NULL -- Non-privileged users see NULL for encrypted fields
    END
  );

-- Officer compensation: Only super_admin
CREATE POLICY "portfolio_officers_compensation" ON portfolio_entity_officers
  FOR SELECT USING (
    CASE
      WHEN auth.role() = 'super_admin' THEN true
      ELSE compensation_details IS NULL
    END
  );
```

### Sensitive Data Handling

```typescript
// Sensitive field masking in API responses
function maskSensitiveFields(entity: LegalEntity, userRole: string): LegalEntity {
  const masked = { ...entity };

  // EIN: Only super_admin and entity_admin see the real value
  if (!['super_admin', 'entity_admin'].includes(userRole)) {
    masked.ein = masked.ein ? `***-**-${masked.ein.slice(-4)}` : null;
  }

  return masked;
}

function maskOfficerFields(officer: EntityOfficer, userRole: string): EntityOfficer {
  const masked = { ...officer };

  // Compensation: Only super_admin sees details
  if (userRole !== 'super_admin') {
    masked.compensationDetails = null;
  }

  return masked;
}
```

### API Route Security Middleware

```typescript
// middleware/portfolio-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function withPortfolioAuth(
  request: NextRequest,
  handler: (ctx: AuthContext) => Promise<NextResponse>,
  options?: {
    requiredRoles?: string[];
    ventureScoped?: boolean;
  },
): Promise<NextResponse> {
  const supabase = createRouteHandlerClient({ cookies: () => request.cookies });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'PORTFOLIO_UNAUTHORIZED', message: 'Authentication required' },
      { status: 401 },
    );
  }

  // Get user role
  const role = await identityService.getUserRole(user.id);

  // Check required roles
  if (options?.requiredRoles && !options.requiredRoles.includes(role)) {
    return NextResponse.json(
      { error: 'PORTFOLIO_UNAUTHORIZED', message: 'Insufficient permissions' },
      { status: 403 },
    );
  }

  // Venture-scoped access check
  if (options?.ventureScoped) {
    const ventureId = request.nextUrl.searchParams.get('ventureId')
      ?? (await request.json()).ventureId;

    if (ventureId && !['super_admin', 'portfolio_admin'].includes(role)) {
      const hasAccess = await checkVentureAccess(user.id, ventureId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'PORTFOLIO_UNAUTHORIZED', message: 'No access to this venture' },
          { status: 403 },
        );
      }
    }
  }

  return handler({ user, role, supabase });
}
```

### Security Audit Checklist

| Control | Implementation | Status |
|---------|---------------|--------|
| Transport encryption | TLS 1.3 via Supabase/Vercel | ✅ |
| Authentication | Supabase Auth JWT | ✅ |
| Application-level RBAC | Service method role checks | ✅ |
| Database-level RBAC | PostgreSQL RLS policies | ✅ |
| EIN encryption at rest | AES-256-GCM | ✅ |
| Compensation encryption | AES-256-GCM | ✅ |
| Document access control | Per-document accessLevel | ✅ |
| Input validation | Zod schemas on all methods | ✅ |
| SQL injection prevention | Drizzle ORM parameterization | ✅ |
| Audit trail | All state changes → @mcv/fabric | ✅ |
| Rate limiting | Redis-based per-user limits | ✅ |
| CORS policy | Restricted origins | ✅ |
| Secret management | Environment variables, never in code | ✅ |

---

*@mcv/portfolio — Portfolio Management Domain*