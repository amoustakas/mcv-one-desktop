# @mcv/portfolio — API Reference

> **Package:** `@mcv/portfolio`
> **Classification:** MCV-ONLY
> **Tier:** 5 — Domain Layer
> **Version:** 1.0.0
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Venture Service Methods](#venture-service-methods)
3. [Entity Service Methods](#entity-service-methods)
4. [Grant Service Methods](#grant-service-methods)
5. [Strategy Service Methods](#strategy-service-methods)
6. [Aggregation Service Methods](#aggregation-service-methods)
7. [Type Definitions](#type-definitions)
8. [Zod Schemas](#zod-schemas)
9. [Event Types](#event-types)
10. [Error Codes](#error-codes)
11. [Configuration Reference](#configuration-reference)

---

## API Overview

The `@mcv/portfolio` package exposes five service classes, each responsible for a distinct subdomain of portfolio management. All services follow consistent patterns:

- **Validation-first:** Every method validates input with Zod before database access.
- **Event-driven:** State-changing methods emit domain events to `@mcv/fabric`.
- **Cache-aware:** Read methods check Redis cache first; writes invalidate relevant keys.
- **RLS-enforced:** All database queries run through Supabase RLS policies.

### Import Pattern

```typescript
import {
  ventureService,
  entityService,
  grantService,
  strategyService,
  portfolioAggregationService,
} from '@mcv/portfolio';
```

### Authentication Context

All service methods execute within a Supabase auth context. The calling user's JWT token determines which rows are visible via RLS. Super admins and portfolio admins see all records; venture-scoped users see only their assigned ventures.

### Return Conventions

- Single-record methods return `Promise<T>` or `Promise<T | null>` (for lookups).
- List methods return `Promise<T[]>` with optional cursor-based pagination.
- Mutation methods return the updated record: `Promise<T>`.
- Void methods return `Promise<void>` (deletes, removes).

---

## Venture Service Methods

### `createVenture`

Creates a new venture in `concept` status.

```typescript
ventureService.createVenture(input: CreateVentureInput): Promise<Venture>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `input.slug` | `string` | ✅ | URL-safe identifier (`^[a-z0-9-]+$`, 2-50 chars) |
| `input.name` | `string` | ✅ | Display name (1-200 chars) |
| `input.industry` | `string` | ✅ | Industry vertical (1-100 chars) |
| `input.legalName` | `string` | — | Full legal name |
| `input.description` | `string` | — | Venture description (max 5000 chars) |
| `input.mission` | `string` | — | Mission statement |
| `input.tagline` | `string` | — | Short tagline for cards |
| `input.domain` | `string` | — | Primary domain (e.g. `betedge.com`) |
| `input.logoUrl` | `string` | — | Logo URL |
| `input.brandColors` | `{ primary: string; secondary: string }` | — | Brand color hex codes |
| `input.vertical` | `string` | — | Technology vertical (`AI/ML`, `SaaS`, etc.) |
| `input.priority` | `VenturePriority` | — | Default: `medium` |
| `input.timezone` | `string` | — | Default: `America/Toronto` |
| `input.currency` | `string` | — | Default: `USD` |
| `input.metadata` | `Record<string, unknown>` | — | Arbitrary metadata |

**Returns:** `Promise<Venture>` — The created venture with `status: 'concept'`.

**Events:** `portfolio.ventures.created`

**Errors:**
- `PORTFOLIO_VENTURE_SLUG_TAKEN` (409) — Slug already exists.

**Example:**

```typescript
const venture = await ventureService.createVenture({
  slug: 'betedge',
  name: 'BetEdge',
  legalName: 'BetEdge Technologies LLC',
  description: 'AI-powered sports analytics and predictive betting platform',
  mission: 'Democratize sports betting through AI-driven analytics',
  industry: 'Sports Betting',
  vertical: 'AI/ML',
  priority: 'high',
});

// venture.id = 'a1b2c3d4-...'
// venture.status = 'concept'
// venture.stage = 'ideation'
```

---

### `updateVenture`

Updates venture fields. Cannot change `status` directly (use lifecycle methods).

```typescript
ventureService.updateVenture(ventureId: string, input: UpdateVentureInput): Promise<Venture>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture UUID |
| `input` | `Partial<CreateVentureInput>` | ✅ | Fields to update (slug immutable after launch) |

**Returns:** `Promise<Venture>` — Updated venture record.

**Events:** `portfolio.ventures.updated`

**Errors:**
- `PORTFOLIO_VENTURE_NOT_FOUND` (404)

**Example:**

```typescript
const updated = await ventureService.updateVenture(venture.id, {
  description: 'Updated description with new positioning',
  priority: 'critical',
  tagline: 'AI-first sports analytics',
});
```

---

### `getVenture`

Retrieves a single venture by UUID.

```typescript
ventureService.getVenture(ventureId: string): Promise<Venture | null>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture UUID |

**Returns:** `Promise<Venture | null>` — Venture or `null` if not found / not accessible via RLS.

**Example:**

```typescript
const venture = await ventureService.getVenture('a1b2c3d4-...');
if (!venture) {
  console.log('Not found or no access');
}
```

---

### `getVentureBySlug`

Retrieves a single venture by slug identifier.

```typescript
ventureService.getVentureBySlug(slug: string): Promise<Venture | null>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | `string` | ✅ | Venture slug (e.g. `betedge`) |

**Returns:** `Promise<Venture | null>`

**Example:**

```typescript
const venture = await ventureService.getVentureBySlug('betedge');
```

---

### `listVentures`

Lists ventures with optional filtering.

```typescript
ventureService.listVentures(options?: VentureListOptions): Promise<Venture[]>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `options.status` | `VentureStatus[]` | — | Filter by status(es) |
| `options.stage` | `VentureStage[]` | — | Filter by stage(s) |
| `options.priority` | `VenturePriority[]` | — | Filter by priority(ies) |
| `options.cursor` | `string` | — | Pagination cursor (venture UUID) |
| `options.limit` | `number` | — | Page size (default: 50, max: 200) |

**Returns:** `Promise<Venture[]>` — RLS-filtered list of ventures.

**Example:**

```typescript
// All active and scaling ventures
const activeVentures = await ventureService.listVentures({
  status: ['active', 'scaling'],
});

// High-priority ventures only
const highPriority = await ventureService.listVentures({
  priority: ['critical', 'high'],
});
```

---

### `deleteVenture`

Deletes a venture. **Only permitted for ventures in `concept` status.**

```typescript
ventureService.deleteVenture(ventureId: string): Promise<void>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture UUID |

**Errors:**
- `PORTFOLIO_VENTURE_NOT_FOUND` (404)
- `PORTFOLIO_VENTURE_NOT_DELETABLE` (422) — Venture is not in `concept` status.

---

### `approveVenture`

Transitions venture from `concept` → `setup`. **Creates a tenant in `@mcv/identity`.**

```typescript
ventureService.approveVenture(ventureId: string, approvedBy: string): Promise<Venture>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture UUID |
| `approvedBy` | `string` | ✅ | User UUID of approver |

**Returns:** `Promise<Venture>` — Updated venture with `status: 'setup'` and `tenantId` set.

**Side Effects:**
1. Creates tenant in `@mcv/identity` with venture slug
2. Links `tenantId` to the venture record
3. Emits `portfolio.ventures.approved` event

**Errors:**
- `PORTFOLIO_VENTURE_NOT_FOUND` (404)
- `PORTFOLIO_INVALID_TRANSITION` (422) — Venture is not in `concept` status.

**Example:**

```typescript
const approved = await ventureService.approveVenture(venture.id, 'ceo-user-uuid');
console.log(approved.status);   // 'setup'
console.log(approved.tenantId); // 'tenant-uuid-...'
```

---

### `launchVenture`

Transitions venture from `setup` → `active`.

```typescript
ventureService.launchVenture(ventureId: string): Promise<Venture>
```

**Side Effects:**
1. Sets `launchedAt` timestamp
2. Creates default KPI definitions
3. Schedules recurring health checks
4. Emits `portfolio.ventures.launched` event

**Errors:**
- `PORTFOLIO_INVALID_TRANSITION` (422) — Not in `setup` status.

---

### `scaleVenture`

Transitions venture from `active` → `scaling`.

```typescript
ventureService.scaleVenture(ventureId: string): Promise<Venture>
```

---

### `hibernateVenture`

Transitions venture from `active` or `scaling` → `hibernating`.

```typescript
ventureService.hibernateVenture(ventureId: string, reason: string): Promise<Venture>
```

**Side Effects:** Pauses health check scheduling, notifies team.

---

### `reactivateVenture`

Transitions venture from `hibernating` → `active`.

```typescript
ventureService.reactivateVenture(ventureId: string): Promise<Venture>
```

---

### `sunsetVenture`

Transitions any non-archived venture → `sunset`.

```typescript
ventureService.sunsetVenture(ventureId: string, reason: string, sunsetDate: Date): Promise<Venture>
```

---

### `archiveVenture`

Transitions venture from `sunset` → `archived`. **Cascade deactivation.**

```typescript
ventureService.archiveVenture(ventureId: string): Promise<Venture>
```

**Side Effects:**
1. Sets all team assignments to `isActive: false`
2. Marks all deployments as `archived`
3. Freezes all KPI tracking
4. Sets `archivedAt` timestamp
5. Emits `portfolio.ventures.archived` event

---

### `recordHealthSnapshot`

Records a point-in-time health snapshot for a venture.

```typescript
ventureService.recordHealthSnapshot(
  ventureId: string,
  snapshot: VentureHealthSnapshot,
): Promise<HealthSnapshot>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture UUID |
| `snapshot.overallHealth` | `VentureHealthStatus` | ✅ | `healthy` / `warning` / `critical` / `unknown` |
| `snapshot.healthScore` | `number` | ✅ | 0-100 composite score |
| `snapshot.dimensions` | `HealthDimensions` | ✅ | 5-dimension breakdown (financial, product, team, market, compliance) |
| `snapshot.alerts` | `HealthAlert[]` | — | Active alerts |
| `snapshot.generatedBy` | `string` | — | `system` / `manual` / `agent` |
| `snapshot.notes` | `string` | — | Notes |

**Events:** `portfolio.ventures.health_recorded`, optionally `portfolio.ventures.health_alert` for critical alerts.

**Example:**

```typescript
const snapshot = await ventureService.recordHealthSnapshot('betedge-id', {
  overallHealth: 'healthy',
  healthScore: 82,
  dimensions: {
    financial: { score: 85, revenue: 150000, burn: 45000, runway: 18, trend: 'up' },
    product:   { score: 72, uptime: 99.9, bugCount: 12, featureVelocity: 8, trend: 'stable' },
    team:      { score: 90, headcount: 12, satisfaction: 4.2, turnover: 0.08, trend: 'up' },
    market:    { score: 65, userGrowth: 0.15, churnRate: 0.03, nps: 42, trend: 'down' },
    compliance:{ score: 95, openIssues: 1, lastAudit: '2026-01-15', trend: 'stable' },
  },
  alerts: [
    { type: 'market_growth_slowing', severity: 'warning', message: 'User growth -5% MoM' },
  ],
  generatedBy: 'system',
});
```

---

### `getLatestHealth`

Returns the most recent health snapshot for a venture.

```typescript
ventureService.getLatestHealth(ventureId: string): Promise<HealthSnapshot | null>
```

---

### `getHealthHistory`

Returns historical health snapshots with optional date filtering.

```typescript
ventureService.getHealthHistory(ventureId: string, options?: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<HealthSnapshot[]>
```

---

### `getHealthHeatmap`

Returns the latest health snapshot for every active venture — the consortium health heatmap.

```typescript
ventureService.getHealthHeatmap(): Promise<HealthHeatmapData>
```

**Returns:**

```typescript
interface HealthHeatmapData {
  ventures: {
    slug: string;
    name: string;
    health: VentureHealthStatus;
    score: number;
    dimensions: HealthDimensions;
    lastUpdated: Date;
  }[];
  generatedAt: Date;
}
```

---

### `createKpi`

Creates a KPI definition for a venture.

```typescript
ventureService.createKpi(ventureId: string, input: KpiDefinition): Promise<VentureKpi>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture UUID |
| `input.name` | `string` | ✅ | KPI display name |
| `input.slug` | `string` | ✅ | URL-safe identifier |
| `input.category` | `string` | ✅ | `financial` / `product` / `growth` / `team` |
| `input.unit` | `string` | ✅ | `USD` / `percent` / `count` / `days` |
| `input.format` | `string` | — | `number` / `currency` / `percentage` / `duration` |
| `input.targetValue` | `string` | — | Numeric target (as string for precision) |
| `input.warningThreshold` | `string` | — | Warning level |
| `input.criticalThreshold` | `string` | — | Critical level |
| `input.direction` | `string` | — | `higher_is_better` / `lower_is_better` |
| `input.frequency` | `string` | — | `daily` / `weekly` / `monthly` / `quarterly` |
| `input.isGlobal` | `boolean` | — | If `true`, applies to all ventures |

**Example:**

```typescript
const kpi = await ventureService.createKpi(venture.id, {
  name: 'Monthly Recurring Revenue',
  slug: 'mrr',
  category: 'financial',
  unit: 'USD',
  format: 'currency',
  targetValue: '100000',
  warningThreshold: '60000',
  criticalThreshold: '30000',
  frequency: 'monthly',
  direction: 'higher_is_better',
});
```

---

### `recordKpi`

Records a KPI measurement. **Auto-calculates status** from thresholds.

```typescript
ventureService.recordKpi(kpiId: string, record: VentureKpiRecord): Promise<KpiRecord>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `kpiId` | `string` | ✅ | KPI definition UUID |
| `record.period` | `string` | ✅ | Period identifier (`2026-01`, `2026-Q1`, `2026-W05`) |
| `record.value` | `string` | ✅ | Measured value (string for numeric precision) |
| `record.previousValue` | `string` | — | Previous period value |
| `record.source` | `string` | — | `manual` / `api` / `calculated` / `imported` |
| `record.notes` | `string` | — | Notes |

**Auto-Calculated Fields:**
- `changePercent` — Percentage change from `previousValue`
- `targetAttainment` — Percentage of target achieved
- `status` — `exceeded` / `on_track` / `at_risk` / `off_track` (based on thresholds)

**Events:** `portfolio.ventures.kpi_recorded`

**Example:**

```typescript
const record = await ventureService.recordKpi('mrr-kpi-id', {
  period: '2026-01',
  value: '125000',
  previousValue: '110000',
  source: 'api',
  notes: 'Strong month driven by enterprise onboarding',
});
// record.status = 'exceeded' (125000 > target 100000)
// record.targetAttainment = '125.00'
// record.changePercent = '13.64'
```

---

### `getKpiDashboard`

Returns all KPIs and their latest records for a venture, optionally filtered by period.

```typescript
ventureService.getKpiDashboard(ventureId: string, period?: string): Promise<KpiDashboard>
```

---

### `getKpiTrends`

Returns historical values for a specific KPI over N periods.

```typescript
ventureService.getKpiTrends(ventureId: string, kpiSlug: string, periods?: number): Promise<KpiTrend>
```

---

### `assignTeamMember`

Assigns a user to a venture team. **Validates total allocation ≤ 100% across all ventures.**

```typescript
ventureService.assignTeamMember(input: TeamAssignmentInput): Promise<TeamAssignment>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `input.ventureId` | `string` | ✅ | Venture UUID |
| `input.userId` | `string` | ✅ | User UUID (from `@mcv/identity`) |
| `input.role` | `string` | ✅ | `lead` / `developer` / `designer` / `marketer` / `advisor` |
| `input.title` | `string` | — | Title (e.g. `CTO`) |
| `input.allocation` | `number` | — | Percentage of time 0-100 (default: 100) |
| `input.startDate` | `Date` | ✅ | Start date |
| `input.endDate` | `Date` | — | End date (null for ongoing) |
| `input.responsibilities` | `string[]` | — | List of responsibilities |
| `input.compensationType` | `string` | — | `salary` / `equity` / `contract` / `volunteer` |

**Events:** `portfolio.ventures.team_assigned`

**Errors:**
- `PORTFOLIO_ALLOCATION_EXCEEDED` (422) — Total allocation across ventures would exceed 100%.

**Example:**

```typescript
const assignment = await ventureService.assignTeamMember({
  ventureId: venture.id,
  userId: 'developer-user-id',
  role: 'developer',
  title: 'Senior Full-Stack Developer',
  allocation: 80,
  startDate: new Date('2026-02-01'),
  responsibilities: ['Backend architecture', 'API development'],
  compensationType: 'salary',
});
```

---

### `removeTeamMember`

Removes a user from a venture team (sets `isActive: false`).

```typescript
ventureService.removeTeamMember(ventureId: string, userId: string): Promise<void>
```

---

### `getTeamRoster`

Returns all active team members for a venture.

```typescript
ventureService.getTeamRoster(ventureId: string): Promise<TeamAssignment[]>
```

---

### `getPersonAllocations`

Returns all venture allocations for a specific user.

```typescript
ventureService.getPersonAllocations(userId: string): Promise<{
  venture: Venture;
  allocation: number;
  role: string;
}[]>
```

---

### `registerTechnology`

Adds a technology to a venture's tech stack registry.

```typescript
ventureService.registerTechnology(ventureId: string, entry: TechStackEntry): Promise<TechStack>
```

---

### `getTechStackMatrix`

Returns the full technology matrix across all ventures — what each venture uses.

```typescript
ventureService.getTechStackMatrix(): Promise<TechStackMatrix>
```

---

### `registerDeployment`

Registers a deployment environment for a venture.

```typescript
ventureService.registerDeployment(input: DeploymentConfigInput): Promise<Deployment>
```

---

### `runHealthCheck`

Executes a health check against a deployment's `healthCheckUrl`.

```typescript
ventureService.runHealthCheck(deploymentId: string): Promise<HealthCheckResult>
```

---

### `getDeploymentMatrix`

Returns the full deployment matrix across all ventures and environments.

```typescript
ventureService.getDeploymentMatrix(): Promise<DeploymentMatrix>
```

---

### `createMilestone`

Creates a venture-level milestone.

```typescript
ventureService.createMilestone(ventureId: string, input: MilestoneInput): Promise<Milestone>
```

---

### `updateMilestoneProgress`

Updates milestone completion percentage.

```typescript
ventureService.updateMilestoneProgress(
  milestoneId: string,
  percent: number,
  notes?: string,
): Promise<Milestone>
```

---

### `completeMilestone`

Marks a milestone as completed with evidence.

```typescript
ventureService.completeMilestone(
  milestoneId: string,
  evidence?: { type: string; value: string }[],
): Promise<Milestone>
```

---

### `getConfig` / `updateConfig` / `toggleFeature` / `setMaintenanceMode`

Manage per-venture configuration, feature flags, and maintenance mode.

```typescript
ventureService.getConfig(ventureId: string): Promise<VentureConfig>
ventureService.updateConfig(ventureId: string, config: Partial<VentureConfig>): Promise<VentureConfig>
ventureService.toggleFeature(ventureId: string, feature: string, enabled: boolean): Promise<VentureConfig>
ventureService.setMaintenanceMode(ventureId: string, enabled: boolean, message?: string): Promise<VentureConfig>
```

**Example:**

```typescript
await ventureService.toggleFeature(venture.id, 'crm', true);
await ventureService.setMaintenanceMode(venture.id, true, 'Scheduled maintenance 2-4 AM');
```

---

## Entity Service Methods

### `createEntity`

Creates a new legal entity.

```typescript
entityService.createEntity(input: CreateEntityInput): Promise<LegalEntity>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `input.name` | `string` | ✅ | Entity name |
| `input.legalName` | `string` | ✅ | Full legal name as registered |
| `input.entityType` | `EntityType` | ✅ | `c_corp` / `s_corp` / `llc` / `lp` / `llp` / `sole_prop` / `trust` / `holding` |
| `input.ventureId` | `string` | — | Associated venture UUID |
| `input.dbaNames` | `string[]` | — | DBA names |
| `input.ein` | `string` | — | Federal EIN (encrypted at rest) |
| `input.formationDate` | `Date` | — | Formation date |
| `input.formationState` | `string` | — | State of formation |
| `input.formationCountry` | `string` | — | Country (default: `US`) |
| `input.fiscalYearEnd` | `string` | — | MM-DD (default: `12-31`) |
| `input.taxClassification` | `string` | — | `C-Corp` / `S-Corp` / `Partnership` / `Disregarded` |
| `input.registeredAddress` | `Address` | — | Registered address object |
| `input.isHoldingCompany` | `boolean` | — | Is this a holding company? |
| `input.isOperating` | `boolean` | — | Is this an operating entity? |

**Events:** `portfolio.entities.created`

**Example:**

```typescript
const entity = await entityService.createEntity({
  ventureId: 'betedge-venture-id',
  name: 'BetEdge Technologies LLC',
  legalName: 'BetEdge Technologies LLC',
  entityType: 'llc',
  formationState: 'Nevada',
  formationCountry: 'US',
  fiscalYearEnd: '12-31',
  taxClassification: 'Partnership',
  registeredAddress: {
    street: '100 N. Carson St',
    city: 'Carson City',
    state: 'NV',
    zip: '89701',
    country: 'US',
  },
});
```

---

### `getEntity`

Retrieves a single legal entity by UUID.

```typescript
entityService.getEntity(entityId: string): Promise<LegalEntity | null>
```

---

### `listEntities`

Lists legal entities with optional filtering.

```typescript
entityService.listEntities(options?: {
  type?: EntityType[];
  status?: EntityStatus[];
  ventureId?: string;
}): Promise<LegalEntity[]>
```

**Example:**

```typescript
// All active LLCs
const llcs = await entityService.listEntities({
  type: ['llc'],
  status: ['active'],
});

// Entities for a specific venture
const ventureEntities = await entityService.listEntities({
  ventureId: 'betedge-venture-id',
});
```

---

### `updateEntity`

Updates entity fields.

```typescript
entityService.updateEntity(entityId: string, input: UpdateEntityInput): Promise<LegalEntity>
```

---

### `dissolveEntity`

Marks an entity as dissolved.

```typescript
entityService.dissolveEntity(entityId: string, reason: string, effectiveDate: Date): Promise<LegalEntity>
```

---

### `addChildEntity`

Creates a parent-child relationship between entities. **Validates no circular references.**

```typescript
entityService.addChildEntity(
  parentId: string,
  childId: string,
  input: HierarchyInput,
): Promise<EntityHierarchy>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `parentId` | `string` | ✅ | Parent entity UUID |
| `childId` | `string` | ✅ | Child entity UUID |
| `input.relationshipType` | `string` | ✅ | `subsidiary` / `affiliate` / `division` / `joint_venture` |
| `input.ownershipPercent` | `string` | — | Ownership percentage (0-100) |
| `input.effectiveDate` | `Date` | ✅ | Effective date |
| `input.isControlling` | `boolean` | — | Is this a controlling interest (>50%)? |

**Errors:**
- `PORTFOLIO_CIRCULAR_HIERARCHY` (422) — Would create circular reference.

**Example:**

```typescript
await entityService.addChildEntity(holdingCompanyId, betedgeLlcId, {
  relationshipType: 'subsidiary',
  ownershipPercent: '100.00',
  effectiveDate: new Date('2025-01-01'),
  isControlling: true,
});
```

---

### `getFullHierarchy`

Returns the complete consortium entity hierarchy as a tree structure.

```typescript
entityService.getFullHierarchy(): Promise<EntityTreeNode>
```

**Returns:**

```typescript
interface EntityTreeNode {
  entity: LegalEntity;
  ownershipPercent?: number;
  isControlling?: boolean;
  children: EntityTreeNode[];
}
```

---

### `recordOwnership` / `getCapTable`

Record ownership structures and generate cap tables.

```typescript
entityService.recordOwnership(entityId: string, input: OwnershipStructureInput): Promise<OwnershipStructure>
entityService.getCapTable(entityId: string): Promise<CapTable>
```

**Errors:**
- `PORTFOLIO_OWNERSHIP_EXCEEDED` (422) — Total ownership would exceed 100%.

---

### `appointOfficer` / `getSignatories`

Manage officers and directors for legal entities.

```typescript
entityService.appointOfficer(entityId: string, input: OfficerInput): Promise<EntityOfficer>
entityService.getSignatories(entityId: string): Promise<EntityOfficer[]>
```

---

### `uploadDocument`

Uploads a corporate document to the secure vault.

```typescript
entityService.uploadDocument(entityId: string, input: CorporateDocumentInput): Promise<CorporateDocument>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `entityId` | `string` | ✅ | Entity UUID |
| `input.documentType` | `DocumentType` | ✅ | `articles_of_incorporation`, `operating_agreement`, `bylaws`, `tax_return`, etc. |
| `input.title` | `string` | ✅ | Document title |
| `input.fileUrl` | `string` | ✅ | Supabase Storage URL |
| `input.isConfidential` | `boolean` | — | Flag as confidential |
| `input.accessLevel` | `string` | — | `super_admin` / `admin` / `manager` / `all` |

---

### `recordComplianceCheck`

Records a compliance filing or check.

```typescript
entityService.recordComplianceCheck(entityId: string, input: ComplianceCheckInput): Promise<ComplianceRecord>
```

**Example:**

```typescript
await entityService.recordComplianceCheck('betedge-entity-id', {
  jurisdiction: 'Nevada',
  requirementType: 'annual_report',
  requirementName: 'Nevada Annual Report',
  status: 'compliant',
  completedDate: new Date(),
  confirmationNumber: 'NV-2026-123456',
  cost: '150.00',
  nextDueDate: new Date('2027-01-31'),
});
```

---

### `getComplianceMatrix`

Returns compliance status across all entities and jurisdictions.

```typescript
entityService.getComplianceMatrix(): Promise<ComplianceMatrix>
```

---

### `getUpcomingDeadlines`

Returns compliance deadlines due within N days.

```typescript
entityService.getUpcomingDeadlines(daysAhead?: number): Promise<ComplianceRecord[]>
```

---

## Grant Service Methods

### `createGrant`

Creates a new grant opportunity in `discovered` status.

```typescript
grantService.createGrant(input: CreateGrantInput): Promise<Grant>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `input.title` | `string` | ✅ | Grant title |
| `input.fundingSource` | `string` | ✅ | Source name (`NSF`, `DOE`, etc.) |
| `input.category` | `string` | ✅ | `federal` / `state` / `private` / `foundation` / `corporate` |
| `input.ventureId` | `string` | — | Associated venture |
| `input.entityId` | `string` | — | Applying entity |
| `input.fundingAgency` | `string` | — | Full agency name |
| `input.program` | `string` | — | Program name (e.g. `SBIR Phase I`) |
| `input.description` | `string` | — | Description |
| `input.purpose` | `string` | — | How funds will be used |
| `input.requestedAmount` | `string` | — | Requested amount |
| `input.applicationDeadline` | `Date` | — | Application deadline |
| `input.cfda` | `string` | — | CFDA number (federal grants) |
| `input.grantUrl` | `string` | — | URL to opportunity listing |
| `input.tags` | `string[]` | — | Tags |

**Events:** `portfolio.grants.created`

**Example:**

```typescript
const grant = await grantService.createGrant({
  ventureId: 'betedge-venture-id',
  title: 'NSF SBIR Phase I - AI Sports Analytics Engine',
  fundingSource: 'NSF',
  fundingAgency: 'National Science Foundation',
  program: 'SBIR Phase I',
  category: 'federal',
  requestedAmount: '275000',
  applicationDeadline: new Date('2026-06-15'),
  cfda: '47.084',
});
// grant.status = 'discovered'
```

---

### `qualifyGrant`

Marks a grant as qualified for application (discovered → qualified).

```typescript
grantService.qualifyGrant(grantId: string, notes?: string): Promise<Grant>
```

---

### `applyForGrant`

Marks a grant as applied (qualified → applied).

```typescript
grantService.applyForGrant(grantId: string): Promise<Grant>
```

**Errors:**
- `PORTFOLIO_INVALID_GRANT_TRANSITION` (422) — Grant must be `qualified` first.

---

### `recordAward`

Records a grant award (applied → awarded).

```typescript
grantService.recordAward(grantId: string, awardedAmount: string, awardDate: Date): Promise<Grant>
```

**Example:**

```typescript
const awarded = await grantService.recordAward(grant.id, '256000', new Date('2026-09-01'));
// awarded.status = 'awarded'
// awarded.awardedAmount = '256000'
// awarded.remainingAmount = '256000'
```

---

### `activateGrant`

Activates an awarded grant (awarded → active). **Auto-creates recurring deadlines.**

```typescript
grantService.activateGrant(grantId: string, startDate: Date, endDate: Date): Promise<Grant>
```

---

### `completeGrant` / `closeGrant` / `terminateGrant`

Terminal lifecycle transitions for grants.

```typescript
grantService.completeGrant(grantId: string): Promise<Grant>           // active → completed
grantService.closeGrant(grantId: string): Promise<Grant>              // completed → closed
grantService.terminateGrant(grantId: string, reason: string): Promise<Grant> // active → terminated
```

---

### `createMilestone`

Creates a grant milestone with optional funding trigger.

```typescript
grantService.createMilestone(grantId: string, input: GrantMilestoneInput): Promise<GrantMilestone>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `grantId` | `string` | ✅ | Grant UUID |
| `input.title` | `string` | ✅ | Milestone title |
| `input.milestoneNumber` | `number` | ✅ | Sequential number |
| `input.targetDate` | `Date` | ✅ | Target completion date |
| `input.fundingTrigger` | `boolean` | — | Is this a funding-trigger milestone? |
| `input.triggerAmount` | `string` | — | Amount disbursed on verification |
| `input.deliverables` | `Deliverable[]` | — | Required deliverables |

---

### `verifyMilestone`

Verifies a completed grant milestone. **Auto-creates disbursement if `fundingTrigger: true`.**

```typescript
grantService.verifyMilestone(milestoneId: string, verifiedBy: string): Promise<GrantMilestone>
```

**Side Effects:**
1. Sets milestone `status: 'completed'`, `verifiedBy`, `verifiedAt`
2. If `fundingTrigger: true` → auto-creates `GrantDisbursement` with `status: 'pending'`
3. Emits `portfolio.grants.milestone_verified` and optionally `portfolio.grants.disbursement_requested`

---

### `requestDisbursement`

Requests a funding disbursement for a grant.

```typescript
grantService.requestDisbursement(grantId: string, input: DisbursementInput): Promise<GrantDisbursement>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `grantId` | `string` | ✅ | Grant UUID |
| `input.amount` | `string` | ✅ | Disbursement amount |
| `input.disbursementNumber` | `string` | ✅ | Unique ID (e.g. `DISB-2026-001`) |
| `input.milestoneId` | `string` | — | Associated milestone |
| `input.paymentMethod` | `string` | — | `wire` / `ach` / `check` |

**Errors:**
- `PORTFOLIO_DISBURSEMENT_EXCEEDS_AWARD` (422) — Total disbursements would exceed awarded amount.

---

### `recordReceipt`

Records that a disbursement was received.

```typescript
grantService.recordReceipt(
  disbursementId: string,
  receivedDate: Date,
  referenceNumber: string,
): Promise<GrantDisbursement>
```

---

### `getDisbursementSummary`

Returns disbursement summary for a grant (total awarded, disbursed, remaining).

```typescript
grantService.getDisbursementSummary(grantId: string): Promise<DisbursementSummary>
```

---

### `createGrantBudget`

Creates a grant-specific budget with line items.

```typescript
grantService.createGrantBudget(
  grantId: string,
  input: GrantBudgetInput,
): Promise<{ budget: GrantBudget; lines: GrantBudgetLine[] }>
```

**Example:**

```typescript
const { budget, lines } = await grantService.createGrantBudget(grant.id, {
  totalBudget: '275000',
  indirectCostRate: '52.5',
  indirectCostBase: 'MTDC',
  lines: [
    { category: 'personnel', description: 'PI Salary (50% effort)', budgetedAmount: '60000', justification: 'PI leadership' },
    { category: 'personnel', description: 'Postdoc (100% effort)', budgetedAmount: '55000', justification: 'Research execution' },
    { category: 'fringe', description: 'Benefits (30%)', budgetedAmount: '34500' },
    { category: 'equipment', description: 'GPU Server', budgetedAmount: '25000', justification: 'ML training' },
    { category: 'travel', description: 'Conference Travel', budgetedAmount: '5000' },
    { category: 'other', description: 'Cloud Computing', budgetedAmount: '15000' },
    { category: 'indirect', description: 'F&A (52.5% MTDC)', budgetedAmount: '80500' },
  ],
});
```

---

### `recordExpenditure`

Records an expenditure against a grant budget line. **Auto-recalculates remaining amounts.**

```typescript
grantService.recordExpenditure(
  budgetLineId: string,
  amount: string,
  description: string,
): Promise<GrantBudgetLine>
```

**Side Effects:**
- Updates `expendedAmount` and `remainingAmount` on the budget line
- Emits `portfolio.grants.budget_over_limit` warning if over budget

**Errors:**
- `PORTFOLIO_GRANT_OVER_BUDGET` (422) — Only if strict mode is enabled.

---

### `getBudgetVsActual`

Returns budget vs actual comparison for a grant.

```typescript
grantService.getBudgetVsActual(grantId: string): Promise<GrantBudgetComparison>
```

---

### `getGrantPipeline`

Returns all grants grouped by status — the grant pipeline view.

```typescript
grantService.getGrantPipeline(): Promise<GrantPipelineData>
```

---

### `getFundingForecast`

Projects future grant funding based on pipeline and expected award dates.

```typescript
grantService.getFundingForecast(months?: number): Promise<FundingForecast>
```

---

### `getUpcomingDeadlines` / `getOverdueDeadlines`

Returns approaching and overdue grant deadlines.

```typescript
grantService.getUpcomingDeadlines(daysAhead?: number): Promise<GrantDeadline[]>
grantService.getOverdueDeadlines(): Promise<GrantDeadline[]>
```

---

## Strategy Service Methods

### `createObjective`

Creates a strategic objective (OKR).

```typescript
strategyService.createObjective(input: CreateObjectiveInput): Promise<StrategicObjective>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `input.title` | `string` | ✅ | Objective title |
| `input.level` | `string` | ✅ | `consortium` / `venture` / `team` |
| `input.timeframe` | `string` | ✅ | Time period (`2026-Q1`, `2026-H1`, `2026`) |
| `input.ventureId` | `string` | — | Venture UUID (null = consortium-level) |
| `input.parentObjectiveId` | `string` | — | Parent objective for cascading OKRs |
| `input.description` | `string` | — | Description |
| `input.startDate` | `Date` | — | Start date |
| `input.endDate` | `Date` | — | End date |
| `input.ownerId` | `string` | — | Objective owner (user UUID) |
| `input.priority` | `string` | — | `critical` / `high` / `medium` / `low` |

**Events:** `portfolio.strategy.objective_created`

**Example:**

```typescript
// Consortium-level objective
const objective = await strategyService.createObjective({
  title: 'Reach $10M ARR across all ventures by Q4 2026',
  level: 'consortium',
  timeframe: '2026',
  priority: 'critical',
  ownerId: 'ceo-user-id',
});

// Venture-level child objective
const childObj = await strategyService.createObjective({
  title: 'BetEdge reaches $3M ARR',
  level: 'venture',
  ventureId: 'betedge-id',
  parentObjectiveId: objective.id,
  timeframe: '2026',
  priority: 'high',
});
```

---

### `createKeyResult`

Creates a key result for an objective.

```typescript
strategyService.createKeyResult(
  objectiveId: string,
  input: CreateKeyResultInput,
): Promise<KeyResult>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `objectiveId` | `string` | ✅ | Parent objective UUID |
| `input.title` | `string` | ✅ | Key result title |
| `input.type` | `KeyResultType` | ✅ | `numeric` / `percentage` / `currency` / `boolean` / `milestone` |
| `input.targetValue` | `string` | ✅ | Target value |
| `input.startValue` | `string` | — | Starting value (default: `0`) |
| `input.unit` | `string` | — | Unit (`users`, `%`, `USD`) |
| `input.weight` | `string` | — | Weighting within objective (default: `1.0`) |
| `input.scoringMethod` | `string` | — | `linear` / `binary` / `threshold` |
| `input.ownerId` | `string` | — | Key result owner |
| `input.dueDate` | `Date` | — | Due date |

**Example:**

```typescript
await strategyService.createKeyResult(objective.id, {
  title: 'Reach 50,000 active users',
  type: 'numeric',
  unit: 'users',
  startValue: '10000',
  targetValue: '50000',
  weight: '0.30',
  scoringMethod: 'linear',
  dueDate: new Date('2026-12-31'),
});
```

---

### `checkinKeyResult`

Records a check-in for a key result. **Auto-recalculates parent objective progress.**

```typescript
strategyService.checkinKeyResult(
  keyResultId: string,
  input: KeyResultCheckinInput,
): Promise<KeyResultCheckin>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `keyResultId` | `string` | ✅ | Key result UUID |
| `input.newValue` | `string` | ✅ | New measured value |
| `input.status` | `string` | ✅ | `on_track` / `at_risk` / `off_track` |
| `input.confidence` | `string` | — | Confidence of completion (0-100) |
| `input.notes` | `string` | — | Check-in notes |
| `input.blockers` | `Blocker[]` | — | Active blockers |

**Side Effects:**
1. Updates key result `currentValue` and `progress`
2. Recalculates parent objective `progress` (weighted average of all KRs)
3. If objective has `parentObjectiveId`, recurse upward to recalculate confidence
4. Emits `portfolio.strategy.kr_checked_in`

**Example:**

```typescript
await strategyService.checkinKeyResult(keyResultId, {
  newValue: '32000',
  status: 'on_track',
  confidence: '75',
  notes: 'Good progress. New marketing campaign driving signups.',
});
// Parent objective progress auto-recalculated:
// If KR weight=0.30 and KR progress=55% → contributes 16.5% to objective
```

---

### `getOkrTree`

Returns the full OKR tree with objectives, key results, and progress.

```typescript
strategyService.getOkrTree(options?: {
  ventureId?: string;
  timeframe?: string;
}): Promise<OkrTreeNode[]>
```

---

### `getOkrProgress`

Returns detailed progress report for a specific objective.

```typescript
strategyService.getOkrProgress(objectiveId: string): Promise<OkrProgressReport>
```

---

### `scoreVenture`

Submits a scorecard for a venture. **Auto-ranks all ventures for the period.**

```typescript
strategyService.scoreVenture(
  ventureId: string,
  input: VentureScorecardInput,
): Promise<VentureScorecard>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture UUID |
| `input.period` | `string` | ✅ | Scoring period (`2026-Q1`) |
| `input.scores` | `ScorecardScores` | ✅ | 5-dimension scores (financial, market, product, team, strategic) |
| `input.notes` | `string` | — | Scoring notes |

Each dimension requires `score` (0-100), `weight` (0.00-1.00, must sum to 1.0), and `details` (dimension-specific metrics).

**Errors:**
- `PORTFOLIO_SCORECARD_WEIGHTS_INVALID` (422) — Weights don't sum to 1.0.

**Events:** `portfolio.strategy.scorecard_submitted`, `portfolio.strategy.rankings_updated`

**Example:**

```typescript
const scorecard = await strategyService.scoreVenture('betedge-id', {
  period: '2026-Q1',
  scores: {
    financial: { score: 85, weight: 0.25, details: { revenue: 150000, growth: 0.15 } },
    market:    { score: 72, weight: 0.20, details: { tam: 5000000000, nps: 42 } },
    product:   { score: 80, weight: 0.20, details: { uptime: 99.9, velocity: 8 } },
    team:      { score: 90, weight: 0.15, details: { headcount: 12, retention: 0.92 } },
    strategic: { score: 78, weight: 0.20, details: { okrProgress: 0.68 } },
  },
});
// scorecard.overallScore = 81.10
// scorecard.tier = 'A'
// scorecard.rank = 1 (auto-calculated)
```

---

### `getVentureRankings`

Returns venture rankings for a specific period.

```typescript
strategyService.getVentureRankings(period: string): Promise<VentureRanking[]>
```

**Returns:**

```typescript
interface VentureRanking {
  ventureId: string;
  ventureName: string;
  slug: string;
  score: number;
  rank: number;
  tier: 'A' | 'B' | 'C' | 'D';
  previousScore: number | null;
  scoreChange: number | null;
}
```

---

### `createThesis` / `validateThesis` / `invalidateThesis`

Manage investment theses for ventures.

```typescript
strategyService.createThesis(ventureId: string, input: InvestmentThesisInput): Promise<InvestmentThesis>
strategyService.validateThesis(thesisId: string, evidence: string): Promise<InvestmentThesis>
strategyService.invalidateThesis(thesisId: string, reason: string): Promise<InvestmentThesis>
```

**Errors:**
- `PORTFOLIO_THESIS_ALREADY_RESOLVED` (422) — Thesis already validated or invalidated.

---

### `recordPivot`

Records a venture pivot decision.

```typescript
strategyService.recordPivot(ventureId: string, input: PivotDecisionInput): Promise<PivotDecision>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture UUID |
| `input.title` | `string` | ✅ | Pivot title |
| `input.pivotType` | `PivotType` | ✅ | `customer_segment` / `value_proposition` / `revenue_model` / `channel` / `technology` / `product` / `market` / `platform` |
| `input.description` | `string` | ✅ | Pivot description |
| `input.rationale` | `string` | ✅ | Why we're pivoting |
| `input.fromState` | `string` | ✅ | Current state being changed |
| `input.toState` | `string` | ✅ | New state |
| `input.metricsBeforePivot` | `object` | — | Metrics snapshot before pivot |

---

### `getPivotAnalysis`

Returns portfolio-level pivot analysis — success/failure rates, common patterns.

```typescript
strategyService.getPivotAnalysis(): Promise<PivotAnalysisReport>
```

---

### `createAnalysis` / `addCompetitor`

Manage competitive analyses and competitor profiles.

```typescript
strategyService.createAnalysis(ventureId: string, input: CompetitiveAnalysisInput): Promise<CompetitiveAnalysis>
strategyService.addCompetitor(analysisId: string, input: CompetitorProfileInput): Promise<CompetitorProfile>
```

---

### `createMarketSizing`

Creates a TAM/SAM/SOM market sizing estimate.

```typescript
strategyService.createMarketSizing(ventureId: string, input: MarketSizingInput): Promise<MarketSizing>
```

---

### `createDashboard` / `addWidget` / `getDefaultDashboard`

Manage portfolio dashboards and widgets.

```typescript
strategyService.createDashboard(input: DashboardInput): Promise<PortfolioDashboard>
strategyService.addWidget(dashboardId: string, input: WidgetInput): Promise<DashboardWidget>
strategyService.getDefaultDashboard(): Promise<PortfolioDashboard & { widgets: DashboardWidget[] }>
```

**Errors:**
- `PORTFOLIO_DASHBOARD_LIMIT` (422) — Maximum dashboards per user exceeded.

---

## Aggregation Service Methods

### `getPortfolioSummary`

Returns the consolidated portfolio summary across all ventures.

```typescript
portfolioAggregationService.getPortfolioSummary(): Promise<PortfolioSummary>
```

**Returns:**

```typescript
interface PortfolioSummary {
  totalVentures: number;
  activeVentures: number;
  totalRevenue: string;
  totalBurn: string;
  healthDistribution: Record<VentureHealthStatus, number>;
  topVenturesByScore: VentureRanking[];
  activeGrants: number;
  totalGrantFunding: string;
  okrProgress: number;
  lastUpdated: Date;
}
```

**Example:**

```typescript
const summary = await portfolioAggregationService.getPortfolioSummary();
// {
//   totalVentures: 9,
//   activeVentures: 7,
//   totalRevenue: '1250000',
//   totalBurn: '450000',
//   healthDistribution: { healthy: 5, warning: 1, critical: 1, unknown: 0 },
//   topVenturesByScore: [{ venture: 'BetEdge', score: 81.1, rank: 1, tier: 'A' }, ...],
//   activeGrants: 4,
//   totalGrantFunding: '756000',
//   okrProgress: 62,
//   lastUpdated: '2026-02-09T...'
// }
```

---

### `compareVentures`

Side-by-side comparison of selected ventures across specified metrics.

```typescript
portfolioAggregationService.compareVentures(
  ventureIds: string[],
  metrics: string[],
): Promise<VentureComparison>
```

---

### `getPortfolioHealthReport`

Returns comprehensive health report across all ventures.

```typescript
portfolioAggregationService.getPortfolioHealthReport(): Promise<PortfolioHealthReport>
```

---

### `getAllocationAnalysis`

Returns resource allocation analysis — team, budget, and infrastructure allocation across ventures.

```typescript
portfolioAggregationService.getAllocationAnalysis(): Promise<AllocationAnalysis>
```

---

### `getConsolidatedMetrics`

Returns unified KPI view for a period across all ventures.

```typescript
portfolioAggregationService.getConsolidatedMetrics(period: string): Promise<ConsolidatedMetrics>
```

---

## Type Definitions

### Venture Types

```typescript
export type VentureStatus = 'concept' | 'setup' | 'active' | 'scaling' | 'hibernating' | 'sunset' | 'archived';
export type VentureStage = 'ideation' | 'mvp' | 'growth' | 'maturity' | 'decline';
export type VenturePriority = 'critical' | 'high' | 'medium' | 'low' | 'experimental';
export type VentureHealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface Venture {
  id: string;
  slug: string;
  name: string;
  legalName: string | null;
  description: string | null;
  mission: string | null;
  tagline: string | null;
  domain: string | null;
  logoUrl: string | null;
  brandColors: { primary: string; secondary: string } | null;
  status: VentureStatus;
  stage: VentureStage;
  priority: VenturePriority;
  tenantId: string | null;
  primaryEntityId: string | null;
  industry: string;
  vertical: string | null;
  foundedAt: Date | null;
  launchedAt: Date | null;
  sunsetAt: Date | null;
  archivedAt: Date | null;
  leadId: string | null;
  timezone: string;
  currency: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Entity Types

```typescript
export type EntityType = 'c_corp' | 's_corp' | 'llc' | 'lp' | 'llp' | 'sole_prop' | 'trust' | 'holding';
export type EntityStatus = 'active' | 'inactive' | 'dissolved' | 'suspended' | 'pending_formation';
export type ComplianceStatus = 'compliant' | 'pending' | 'overdue' | 'waived' | 'not_applicable';
export type DocumentType =
  | 'articles_of_incorporation' | 'operating_agreement' | 'bylaws'
  | 'annual_report' | 'tax_return' | 'board_resolution'
  | 'meeting_minutes' | 'stock_certificate' | 'amendment'
  | 'certificate_of_good_standing' | 'foreign_qualification'
  | 'ein_letter' | 'bank_resolution' | 'nda' | 'ip_assignment';

export interface LegalEntity {
  id: string;
  ventureId: string | null;
  name: string;
  legalName: string;
  dbaNames: string[] | null;
  entityType: EntityType;
  status: EntityStatus;
  ein: string | null; // encrypted
  formationDate: Date | null;
  formationState: string | null;
  formationCountry: string;
  fiscalYearEnd: string;
  taxClassification: string | null;
  registeredAddress: Address | null;
  isHoldingCompany: boolean;
  isOperating: boolean;
  goodStanding: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  suite?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
```

### Grant Types

```typescript
export type GrantStatus =
  | 'discovered' | 'qualified' | 'applied' | 'awarded' | 'declined'
  | 'withdrawn' | 'active' | 'on_hold' | 'completed' | 'terminated' | 'closed';

export type ApplicationStatus =
  | 'drafting' | 'internal_review' | 'submitted' | 'under_review'
  | 'revision_requested' | 'awarded' | 'declined';

export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'waived';
export type DisbursementStatus = 'pending' | 'approved' | 'received' | 'deposited' | 'returned';

export interface Grant {
  id: string;
  ventureId: string | null;
  entityId: string | null;
  title: string;
  grantNumber: string | null;
  fundingSource: string;
  fundingAgency: string | null;
  program: string | null;
  category: string;
  status: GrantStatus;
  requestedAmount: string | null;
  awardedAmount: string | null;
  disbursedAmount: string;
  remainingAmount: string | null;
  applicationDeadline: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  cfda: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Strategy Types

```typescript
export type ObjectiveStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'deferred';
export type KeyResultType = 'numeric' | 'percentage' | 'currency' | 'boolean' | 'milestone';
export type PivotType =
  | 'customer_segment' | 'value_proposition' | 'revenue_model'
  | 'channel' | 'technology' | 'product' | 'market' | 'platform';
export type InitiativeStatus =
  | 'proposed' | 'approved' | 'planning' | 'in_progress'
  | 'completed' | 'cancelled' | 'on_hold';

export interface StrategicObjective {
  id: string;
  ventureId: string | null;
  parentObjectiveId: string | null;
  title: string;
  description: string | null;
  status: ObjectiveStatus;
  level: 'consortium' | 'venture' | 'team';
  timeframe: string;
  progress: string; // 0-100
  confidence: string | null;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VentureScorecard {
  id: string;
  ventureId: string;
  period: string;
  overallScore: string;
  rank: number | null;
  tier: string | null;
  scores: Record<string, ScorecardDimension>;
  previousScore: string | null;
  scoreChange: string | null;
  createdAt: Date;
}
```

### Aggregation Types

```typescript
export type PortfolioHealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type TrendDirection = 'up' | 'stable' | 'down';

export interface PortfolioSummary {
  totalVentures: number;
  activeVentures: number;
  totalRevenue: string;
  totalBurn: string;
  healthDistribution: Record<VentureHealthStatus, number>;
  topVenturesByScore: VentureRanking[];
  activeGrants: number;
  totalGrantFunding: string;
  okrProgress: number;
  lastUpdated: Date;
}

export interface VentureComparison {
  ventures: string[];
  metrics: {
    name: string;
    values: Record<string, unknown>;
  }[];
  period: string;
  generatedAt: Date;
}
```

---

## Zod Schemas

### Venture Schemas

```typescript
import { z } from 'zod';

export const createVentureSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1).max(200),
  legalName: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  mission: z.string().max(2000).optional(),
  tagline: z.string().max(200).optional(),
  domain: z.string().max(253).optional(),
  logoUrl: z.string().url().optional(),
  brandColors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
  industry: z.string().min(1).max(100),
  vertical: z.string().max(100).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'experimental']).default('medium'),
  timezone: z.string().default('America/Toronto'),
  currency: z.string().length(3).default('USD'),
  metadata: z.record(z.unknown()).optional(),
});

export const updateVentureSchema = createVentureSchema.partial().omit({ slug: true });

export const healthSnapshotSchema = z.object({
  overallHealth: z.enum(['healthy', 'warning', 'critical', 'unknown']),
  healthScore: z.number().min(0).max(100),
  dimensions: z.object({
    financial: z.object({ score: z.number().min(0).max(100), trend: z.enum(['up', 'stable', 'down']) }).passthrough(),
    product: z.object({ score: z.number().min(0).max(100), trend: z.enum(['up', 'stable', 'down']) }).passthrough(),
    team: z.object({ score: z.number().min(0).max(100), trend: z.enum(['up', 'stable', 'down']) }).passthrough(),
    market: z.object({ score: z.number().min(0).max(100), trend: z.enum(['up', 'stable', 'down']) }).passthrough(),
    compliance: z.object({ score: z.number().min(0).max(100), trend: z.enum(['up', 'stable', 'down']) }).passthrough(),
  }),
  alerts: z.array(z.object({
    type: z.string(),
    severity: z.enum(['info', 'warning', 'critical']),
    message: z.string(),
  })).optional(),
  generatedBy: z.enum(['system', 'manual', 'agent']).default('manual'),
  notes: z.string().max(5000).optional(),
});

export const teamAssignmentSchema = z.object({
  ventureId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['lead', 'developer', 'designer', 'marketer', 'advisor']),
  title: z.string().max(200).optional(),
  allocation: z.number().min(0).max(100).default(100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  responsibilities: z.array(z.string()).optional(),
  compensationType: z.enum(['salary', 'equity', 'contract', 'volunteer']).optional(),
});
```

### Entity Schemas

```typescript
export const createEntitySchema = z.object({
  ventureId: z.string().uuid().optional(),
  name: z.string().min(1).max(500),
  legalName: z.string().min(1).max(500),
  dbaNames: z.array(z.string()).optional(),
  entityType: z.enum(['c_corp', 's_corp', 'llc', 'lp', 'llp', 'sole_prop', 'trust', 'holding']),
  ein: z.string().regex(/^\d{2}-\d{7}$/, 'EIN must be in XX-XXXXXXX format').optional(),
  formationDate: z.coerce.date().optional(),
  formationState: z.string().max(100).optional(),
  formationCountry: z.string().length(2).default('US'),
  fiscalYearEnd: z.string().regex(/^\d{2}-\d{2}$/).default('12-31'),
  taxClassification: z.enum(['C-Corp', 'S-Corp', 'Partnership', 'Disregarded']).optional(),
  registeredAddress: z.object({
    street: z.string(),
    suite: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().length(2).default('US'),
  }).optional(),
  isHoldingCompany: z.boolean().default(false),
  isOperating: z.boolean().default(true),
});

export const hierarchyInputSchema = z.object({
  relationshipType: z.enum(['subsidiary', 'affiliate', 'division', 'joint_venture']),
  ownershipPercent: z.string().regex(/^\d{1,3}(\.\d{1,2})?$/).refine(
    v => parseFloat(v) >= 0 && parseFloat(v) <= 100,
    'Ownership must be 0-100',
  ).optional(),
  effectiveDate: z.coerce.date(),
  terminationDate: z.coerce.date().optional(),
  isControlling: z.boolean().optional(),
});
```

### Grant Schemas

```typescript
export const createGrantSchema = z.object({
  ventureId: z.string().uuid().optional(),
  entityId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  fundingSource: z.string().min(1).max(200),
  fundingAgency: z.string().max(500).optional(),
  program: z.string().max(200).optional(),
  category: z.enum(['federal', 'state', 'private', 'foundation', 'corporate']),
  description: z.string().max(5000).optional(),
  purpose: z.string().max(5000).optional(),
  requestedAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  applicationDeadline: z.coerce.date().optional(),
  cfda: z.string().max(20).optional(),
  grantUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

export const grantMilestoneSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  milestoneNumber: z.number().int().positive(),
  targetDate: z.coerce.date(),
  fundingTrigger: z.boolean().default(false),
  triggerAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  deliverables: z.array(z.object({
    title: z.string(),
    type: z.string(),
    required: z.boolean().default(true),
  })).optional(),
});

export const disbursementInputSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/),
  disbursementNumber: z.string().min(1),
  milestoneId: z.string().uuid().optional(),
  paymentMethod: z.enum(['wire', 'ach', 'check']).optional(),
});
```

### Strategy Schemas

```typescript
export const createObjectiveSchema = z.object({
  ventureId: z.string().uuid().nullable().optional(),
  parentObjectiveId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  level: z.enum(['consortium', 'venture', 'team']),
  timeframe: z.string().min(4).max(20),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  ownerId: z.string().uuid().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
});

export const createKeyResultSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  type: z.enum(['numeric', 'percentage', 'currency', 'boolean', 'milestone']),
  unit: z.string().max(50).optional(),
  startValue: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  targetValue: z.string().regex(/^\d+(\.\d{1,4})?$/),
  weight: z.string().regex(/^\d+(\.\d{1,2})?$/).default('1.0'),
  scoringMethod: z.enum(['linear', 'binary', 'threshold']).default('linear'),
  ownerId: z.string().uuid().optional(),
  dueDate: z.coerce.date().optional(),
});

export const scorecardInputSchema = z.object({
  period: z.string().min(4).max(20),
  scores: z.object({
    financial: z.object({ score: z.number().min(0).max(100), weight: z.number().min(0).max(1), details: z.record(z.unknown()) }),
    market: z.object({ score: z.number().min(0).max(100), weight: z.number().min(0).max(1), details: z.record(z.unknown()) }),
    product: z.object({ score: z.number().min(0).max(100), weight: z.number().min(0).max(1), details: z.record(z.unknown()) }),
    team: z.object({ score: z.number().min(0).max(100), weight: z.number().min(0).max(1), details: z.record(z.unknown()) }),
    strategic: z.object({ score: z.number().min(0).max(100), weight: z.number().min(0).max(1), details: z.record(z.unknown()) }),
  }).refine(scores => {
    const total = Object.values(scores).reduce((sum, d) => sum + d.weight, 0);
    return Math.abs(total - 1.0) < 0.001;
  }, { message: 'Dimension weights must sum to 1.0' }),
  notes: z.string().max(5000).optional(),
});
```

---

## Event Types

All events emitted to `@mcv/fabric` via Redpanda topic `portfolio.events`:

### Venture Events

| Event Type | Trigger | Key Payload Fields |
|------------|---------|-------------------|
| `portfolio.ventures.created` | `createVenture()` | `ventureId`, `slug`, `industry` |
| `portfolio.ventures.updated` | `updateVenture()` | `ventureId`, `changedFields` |
| `portfolio.ventures.approved` | `approveVenture()` | `ventureId`, `tenantId`, `approvedBy` |
| `portfolio.ventures.launched` | `launchVenture()` | `ventureId`, `launchedAt` |
| `portfolio.ventures.scaled` | `scaleVenture()` | `ventureId` |
| `portfolio.ventures.hibernated` | `hibernateVenture()` | `ventureId`, `reason` |
| `portfolio.ventures.reactivated` | `reactivateVenture()` | `ventureId` |
| `portfolio.ventures.sunset` | `sunsetVenture()` | `ventureId`, `reason`, `sunsetDate` |
| `portfolio.ventures.archived` | `archiveVenture()` | `ventureId`, `archivedAt` |
| `portfolio.ventures.health_recorded` | `recordHealthSnapshot()` | `ventureId`, `healthScore`, `overallHealth` |
| `portfolio.ventures.health_alert` | Health snapshot with critical alerts | `ventureId`, `alerts` |
| `portfolio.ventures.kpi_recorded` | `recordKpi()` | `ventureId`, `kpiSlug`, `value`, `status` |
| `portfolio.ventures.team_assigned` | `assignTeamMember()` | `ventureId`, `userId`, `role`, `allocation` |
| `portfolio.ventures.team_removed` | `removeTeamMember()` | `ventureId`, `userId` |
| `portfolio.ventures.config_changed` | `updateConfig()` / `toggleFeature()` | `ventureId`, `changedKeys` |
| `portfolio.ventures.milestone_completed` | `completeMilestone()` | `ventureId`, `milestoneId`, `title` |

### Entity Events

| Event Type | Trigger | Key Payload Fields |
|------------|---------|-------------------|
| `portfolio.entities.created` | `createEntity()` | `entityId`, `entityType`, `name` |
| `portfolio.entities.updated` | `updateEntity()` | `entityId`, `changedFields` |
| `portfolio.entities.dissolved` | `dissolveEntity()` | `entityId`, `reason` |
| `portfolio.entities.hierarchy_changed` | `addChildEntity()` / `removeChildEntity()` | `parentId`, `childId`, `action` |
| `portfolio.entities.ownership_changed` | `recordOwnership()` | `entityId`, `ownershipPercent` |
| `portfolio.entities.officer_appointed` | `appointOfficer()` | `entityId`, `officerName`, `role` |
| `portfolio.entities.compliance_filed` | `recordComplianceCheck()` (status=compliant) | `entityId`, `jurisdiction`, `requirement` |
| `portfolio.entities.compliance_overdue` | Cron detects overdue compliance | `entityId`, `jurisdiction`, `dueDate` |
| `portfolio.entities.document_uploaded` | `uploadDocument()` | `entityId`, `documentType`, `title` |

### Grant Events

| Event Type | Trigger | Key Payload Fields |
|------------|---------|-------------------|
| `portfolio.grants.created` | `createGrant()` | `grantId`, `title`, `fundingSource` |
| `portfolio.grants.qualified` | `qualifyGrant()` | `grantId` |
| `portfolio.grants.applied` | `applyForGrant()` | `grantId` |
| `portfolio.grants.awarded` | `recordAward()` | `grantId`, `awardedAmount` |
| `portfolio.grants.declined` | `recordDecline()` | `grantId`, `feedback` |
| `portfolio.grants.activated` | `activateGrant()` | `grantId`, `startDate`, `endDate` |
| `portfolio.grants.completed` | `completeGrant()` | `grantId` |
| `portfolio.grants.closed` | `closeGrant()` | `grantId` |
| `portfolio.grants.terminated` | `terminateGrant()` | `grantId`, `reason` |
| `portfolio.grants.milestone_verified` | `verifyMilestone()` | `grantId`, `milestoneId` |
| `portfolio.grants.disbursement_requested` | Auto on milestone verify | `grantId`, `amount`, `disbursementNumber` |
| `portfolio.grants.disbursement_received` | `recordReceipt()` | `grantId`, `amount`, `referenceNumber` |
| `portfolio.grants.budget_over_limit` | `recordExpenditure()` over budget | `grantId`, `budgetLineId`, `overage` |
| `portfolio.grants.deadline_approaching` | Daily cron | `grantId`, `deadlineTitle`, `daysRemaining` |
| `portfolio.grants.deadline_overdue` | Daily cron | `grantId`, `deadlineTitle` |

### Strategy Events

| Event Type | Trigger | Key Payload Fields |
|------------|---------|-------------------|
| `portfolio.strategy.objective_created` | `createObjective()` | `objectiveId`, `level`, `timeframe` |
| `portfolio.strategy.objective_completed` | Objective progress reaches 100% | `objectiveId`, `title` |
| `portfolio.strategy.kr_checked_in` | `checkinKeyResult()` | `keyResultId`, `newValue`, `progress` |
| `portfolio.strategy.scorecard_submitted` | `scoreVenture()` | `ventureId`, `period`, `overallScore`, `tier` |
| `portfolio.strategy.rankings_updated` | After scorecard auto-ranking | `period`, `rankings` |
| `portfolio.strategy.thesis_validated` | `validateThesis()` | `thesisId`, `ventureId`, `evidence` |
| `portfolio.strategy.thesis_invalidated` | `invalidateThesis()` | `thesisId`, `ventureId`, `reason` |
| `portfolio.strategy.pivot_recorded` | `recordPivot()` | `ventureId`, `pivotType`, `fromState`, `toState` |
| `portfolio.strategy.analysis_stale` | Weekly cron (>90 days old) | `analysisId`, `ventureId`, `daysSinceUpdate` |

---

## Error Codes

| Code | HTTP | Description | User Message |
|------|------|-------------|--------------|
| `PORTFOLIO_VENTURE_NOT_FOUND` | 404 | Venture UUID does not exist | Venture not found |
| `PORTFOLIO_VENTURE_SLUG_TAKEN` | 409 | Slug already in use by another venture | This venture identifier is already taken |
| `PORTFOLIO_INVALID_TRANSITION` | 422 | Invalid lifecycle status transition | Cannot transition from {from} to {to} |
| `PORTFOLIO_VENTURE_NOT_DELETABLE` | 422 | Venture status is not `concept` | Only ventures in 'concept' status can be deleted |
| `PORTFOLIO_ALLOCATION_EXCEEDED` | 422 | User's total allocation would exceed 100% | Team member is over-allocated across ventures |
| `PORTFOLIO_ENTITY_NOT_FOUND` | 404 | Entity UUID does not exist | Legal entity not found |
| `PORTFOLIO_CIRCULAR_HIERARCHY` | 422 | Adding child would create circular reference | This would create a circular ownership structure |
| `PORTFOLIO_OWNERSHIP_EXCEEDED` | 422 | Total ownership percentages exceed 100% | Total ownership cannot exceed 100% |
| `PORTFOLIO_GRANT_NOT_FOUND` | 404 | Grant UUID does not exist | Grant not found |
| `PORTFOLIO_INVALID_GRANT_TRANSITION` | 422 | Invalid grant status transition | Cannot transition grant from {from} to {to} |
| `PORTFOLIO_GRANT_OVER_BUDGET` | 422 | Expenditure exceeds budget line amount | Expenditure would exceed the budget line amount |
| `PORTFOLIO_MILESTONE_NOT_FOUND` | 404 | Milestone UUID does not exist | Milestone not found |
| `PORTFOLIO_DISBURSEMENT_EXCEEDS_AWARD` | 422 | Total disbursements exceed awarded amount | Disbursement would exceed the total award amount |
| `PORTFOLIO_OBJECTIVE_NOT_FOUND` | 404 | Objective UUID does not exist | Strategic objective not found |
| `PORTFOLIO_OBJECTIVE_NOT_DELETABLE` | 422 | Objective status is not `draft` | Only objectives in 'draft' status can be deleted |
| `PORTFOLIO_KR_PROGRESS_INVALID` | 422 | Value outside valid range for scoring method | Key result value must be between start and target values |
| `PORTFOLIO_SCORECARD_WEIGHTS_INVALID` | 422 | Dimension weights don't sum to 1.0 | Scoring criteria weights must sum to 1.0 |
| `PORTFOLIO_THESIS_ALREADY_RESOLVED` | 422 | Thesis already validated or invalidated | This thesis has already been resolved |
| `PORTFOLIO_DASHBOARD_LIMIT` | 422 | Maximum dashboards per user reached | Maximum number of dashboards reached |
| `PORTFOLIO_UNAUTHORIZED` | 403 | User lacks required role/access | You do not have access to this resource |

---

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `SUPABASE_URL` | ✅ | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Supabase service role key |
| `PORTFOLIO_ENCRYPTION_KEY` | ✅ | — | Base64-encoded AES-256 key for EIN/compensation encryption |
| `PORTFOLIO_ENCRYPTION_ALGORITHM` | — | `aes-256-gcm` | Encryption algorithm |
| `REDPANDA_BROKERS` | ✅ | — | Redpanda broker addresses |
| `PORTFOLIO_EVENTS_TOPIC` | — | `portfolio.events` | Event topic name |
| `PORTFOLIO_CONSUMER_GROUP` | — | `portfolio-service` | Consumer group ID |
| `REDIS_URL` | ✅ | — | Redis connection string |
| `PORTFOLIO_CACHE_TTL` | — | `300` | Default cache TTL in seconds |
| `OPENROUTER_API_KEY` | — | — | OpenRouter API key (for AI features) |
| `PORTFOLIO_AI_MODEL` | — | `anthropic/claude-sonnet-4-20250514` | AI model for analysis |
| `SUPABASE_STORAGE_BUCKET` | — | `portfolio-documents` | Storage bucket for documents |

### Runtime Configuration

```typescript
import { portfolioConfigSchema } from '@mcv/portfolio';

const config = portfolioConfigSchema.parse({
  healthWeights: {
    financial: 0.30,
    product: 0.25,
    team: 0.20,
    market: 0.15,
    compliance: 0.10,
  },
  scorecardTiers: {
    A: { min: 80, max: 100 },
    B: { min: 60, max: 79 },
    C: { min: 40, max: 59 },
    D: { min: 0, max: 39 },
  },
  complianceAlertDays: 30,
  competitiveAnalysisFreshnessDays: 90,
  grantDefaultReminderDays: [30, 14, 7, 3, 1],
  maxDashboardsPerUser: 10,
  maxWidgetsPerDashboard: 20,
  defaultDashboardRefreshSeconds: 300,
  cacheTtlSeconds: 300,
  healthSnapshotCacheTtl: 600,
  aiEnabled: true,
  aiModel: 'anthropic/claude-sonnet-4-20250514',
});
```

---

*@mcv/portfolio — Portfolio Management Domain*
