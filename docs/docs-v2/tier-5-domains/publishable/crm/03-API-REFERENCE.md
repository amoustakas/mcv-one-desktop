# @mcv/crm — API Reference

| Field | Value |
|---|---|
| **Package** | `@mcv/crm` |
| **Classification** | PUBLISHABLE |
| **Tier** | 5 — Domain Modules |
| **Last Updated** | February 9, 2026 |

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Service Methods](#service-methods)
   - [Contact Service](#contact-service)
   - [Organization Service](#organization-service)
   - [Deal Service](#deal-service)
   - [Activity Service](#activity-service)
   - [Deal Scoring Service](#deal-scoring-service)
   - [Lead Scoring Service](#lead-scoring-service)
   - [Forecast Service](#forecast-service)
   - [Duplicate Detection Service](#duplicate-detection-service)
   - [Custom Object Service](#custom-object-service)
   - [Smart View Service](#smart-view-service)
3. [Type Definitions](#type-definitions)
4. [Zod Schemas](#zod-schemas)
5. [Events](#events)
6. [Error Codes](#error-codes)
7. [Configuration](#configuration)

---

## API Overview

`@mcv/crm` exposes its functionality through two primary surfaces:

### Server-Side Services

All CRM operations are exposed as typed service functions that can be imported directly:

```typescript
import {
  createContact,
  listContacts,
  searchContacts,
  createDeal,
  moveDealStage,
  scoreDeal,
  evaluateContact,
  logActivity,
} from '@mcv/crm';
```

### tRPC Routes

Server functions are wrapped in tRPC routes with authentication and authorization middleware:

```
/api/crm
├─ contacts.list          (query)
├─ contacts.get           (query)
├─ contacts.create        (mutation)
├─ contacts.update        (mutation)
├─ contacts.delete        (mutation)
├─ contacts.search        (query)
├─ contacts.bulkUpdate    (mutation)
├─ contacts.bulkDelete    (mutation)
├─ organizations.list     (query)
├─ organizations.get      (query)
├─ organizations.create   (mutation)
├─ organizations.update   (mutation)
├─ organizations.delete   (mutation)
├─ organizations.search   (query)
├─ organizations.bulkDelete (mutation)
├─ organizations.contacts (query)
├─ organizations.deals    (query)
├─ organizations.revenue  (query)
├─ organizations.industries (query)
├─ deals.list             (query)
├─ deals.get              (query)
├─ deals.create           (mutation)
├─ deals.update           (mutation)
├─ deals.delete           (mutation)
├─ deals.moveStage        (mutation)
├─ deals.close            (mutation)
├─ deals.search           (query)
├─ deals.byStage          (query)
├─ deals.pipelineSummary  (query)
├─ deals.closedSummary    (query)
├─ activities.log         (mutation)
├─ activities.list        (query)
├─ activities.timeline    (query)
└─ smartViews.*           (CRUD + apply)

/api/crm-v2
├─ deals.score            (mutation)
├─ deals.batchScore       (mutation)
├─ deals.scoreHistory     (query)
├─ deals.scoringFactors   (query)
├─ deals.atRisk           (query)
├─ deals.predictClose     (query)
├─ leads.evaluate         (mutation)
├─ leads.batchScore       (mutation)
├─ leads.breakdown        (query)
├─ leads.leaderboard      (query)
├─ leads.decay            (mutation)
├─ leads.distribution     (query)
├─ leads.rules.list       (query)
├─ leads.rules.create     (mutation)
├─ leads.rules.update     (mutation)
├─ leads.rules.delete     (mutation)
├─ forecast.create        (mutation)
├─ forecast.updateItem    (mutation)
├─ forecast.summary       (query)
├─ forecast.vsActual      (query)
├─ forecast.byOwner       (query)
├─ forecast.byPipeline    (query)
├─ forecast.quota         (query)
├─ forecast.trends        (query)
├─ duplicates.find        (query)
├─ duplicates.scan        (mutation)
├─ duplicates.groups      (query)
├─ duplicates.mergePreview (query)
├─ duplicates.merge       (mutation)
├─ duplicates.history     (query)
├─ customObjects.create   (mutation)
├─ customObjects.update   (mutation)
├─ customObjects.delete   (mutation)
├─ customObjects.get      (query)
├─ customObjects.list     (query)
├─ customObjects.records.create   (mutation)
├─ customObjects.records.update   (mutation)
├─ customObjects.records.delete   (mutation)
├─ customObjects.records.list     (query)
├─ customObjects.relationships.create (mutation)
├─ customObjects.relationships.delete (mutation)
└─ customObjects.relationships.related (query)
```

### Authentication & Authorization

All routes require authentication. Most require specific permissions:

```typescript
// Permission middleware pattern
permissionProcedure('contacts', 'read')   // requires contacts:read
permissionProcedure('contacts', 'create') // requires contacts:create
permissionProcedure('deals', 'update')    // requires deals:update
```

### Venture Context

Every operation is venture-scoped. The `ventureId` is extracted from the authenticated session context automatically in tRPC routes, or must be provided explicitly when calling service functions directly.

---

## Service Methods

### Contact Service

#### `listContacts`

List contacts with filters, pagination, and sorting.

```typescript
async function listContacts(input: ListContactsInput): Promise<ListContactsResult>
```

**Input:**

```typescript
interface ListContactsInput {
  ventureId: string;                    // Required: venture scope
  type?: 'person' | 'company';         // Filter by contact type
  lifecycleStage?: LifecycleStage;      // Filter by lifecycle stage
  ownerId?: string;                     // Filter by owner
  tags?: string[];                      // Filter by tags (contains any)
  page?: number;                        // Page number (default: 1)
  pageSize?: number;                    // Items per page (default: 25, max: 100)
  sortBy?: string;                      // Sort field (default: 'createdAt')
  sortOrder?: 'asc' | 'desc';          // Sort direction (default: 'desc')
}
```

**Output:**

```typescript
interface ListContactsResult {
  data: Contact[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

**Permission:** `contacts:read`

**Example:**

```typescript
const result = await listContacts({
  ventureId: ctx.ventureId,
  lifecycleStage: 'sales_qualified',
  ownerId: salesRep.id,
  page: 1,
  pageSize: 25,
  sortBy: 'leadScore',
  sortOrder: 'desc',
});
// result.data = Contact[], result.meta.total = 142
```

---

#### `getContact`

Get a single contact by ID.

```typescript
async function getContact(id: string, ventureId: string): Promise<Contact>
```

**Permission:** `contacts:read`

**Throws:** `CONTACT_NOT_FOUND` (404) if contact doesn't exist or isn't in venture.

---

#### `createContact`

Create a new contact.

```typescript
async function createContact(input: CreateContactInput): Promise<Contact>
```

**Input:**

```typescript
interface CreateContactInput {
  ventureId: string;
  type: 'person' | 'company';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  lifecycleStage?: LifecycleStage;      // Default: 'lead'
  ownerId?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}
```

**Permission:** `contacts:create`

**Events emitted:** `contacts.created`

**Example:**

```typescript
const contact = await createContact({
  ventureId: ctx.ventureId,
  type: 'person',
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'sarah@acmecorp.com',
  company: 'Acme Corp',
  jobTitle: 'VP Engineering',
  lifecycleStage: 'lead',
  tags: ['enterprise', 'inbound-demo'],
  customFields: { linkedin: 'https://linkedin.com/in/sarahchen' },
});
```

---

#### `updateContact`

Update contact fields (partial update).

```typescript
async function updateContact(
  id: string,
  data: UpdateContactInput,
  ventureId: string,
): Promise<Contact>
```

**Input:** Same fields as `CreateContactInput`, all optional. Custom fields are merged (not replaced).

**Permission:** `contacts:update`

**Events emitted:** `contacts.updated`

**Throws:** `CONTACT_NOT_FOUND` (404)

---

#### `deleteContact`

Delete a single contact.

```typescript
async function deleteContact(id: string, ventureId: string): Promise<void>
```

**Permission:** `contacts:delete`

**Events emitted:** `contacts.deleted`

**Throws:** `CONTACT_NOT_FOUND` (404)

---

#### `searchContacts`

Autocomplete search for contacts by name, email, or company.

```typescript
async function searchContacts(
  query: string,
  ventureId: string,
  limit?: number,
): Promise<Contact[]>
```

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `query` | string | — | Search term (prefix match on firstName, lastName, email, company) |
| `ventureId` | string | — | Venture scope |
| `limit` | number | 10 | Max results (1-50) |

**Permission:** `contacts:read`

**Performance:** Target < 30ms (P50), < 80ms (P99)

**Example:**

```typescript
const matches = await searchContacts('sarah', ctx.ventureId, 10);
// Returns contacts where firstName, lastName, email, or company starts with "sarah"
```

---

#### `bulkUpdateContacts`

Update multiple contacts with the same field values.

```typescript
async function bulkUpdateContacts(
  ids: string[],
  data: Partial<Contact>,
  ventureId: string,
): Promise<BulkResult>
```

**Output:**

```typescript
interface BulkResult {
  updated: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}
```

**Permission:** `contacts:update`

**Events emitted:** `contacts.bulk_updated`

---

#### `bulkDeleteContacts`

Delete multiple contacts.

```typescript
async function bulkDeleteContacts(
  ids: string[],
  ventureId: string,
): Promise<BulkResult>
```

**Permission:** `contacts:delete`

**Events emitted:** `contacts.bulk_deleted`

---

### Organization Service

#### `listOrganizations`

List organizations with filters and pagination.

```typescript
async function listOrganizations(input: ListOrganizationsInput): Promise<ListOrganizationsResult>
```

**Input:**

```typescript
interface ListOrganizationsInput {
  ventureId: string;
  industry?: string;
  ownerId?: string;
  page?: number;                        // Default: 1
  pageSize?: number;                    // Default: 25
  sortBy?: string;                      // Default: 'createdAt'
  sortOrder?: 'asc' | 'desc';          // Default: 'desc'
}
```

**Permission:** `organizations:read`

---

#### `getOrganization`

Get a single organization by ID.

```typescript
async function getOrganization(id: string, ventureId: string): Promise<Organization>
```

**Permission:** `organizations:read`

**Throws:** `ORGANIZATION_NOT_FOUND` (404)

---

#### `createOrganization`

Create a new organization.

```typescript
async function createOrganization(input: CreateOrganizationInput): Promise<Organization>
```

**Input:**

```typescript
interface CreateOrganizationInput {
  ventureId: string;
  name: string;
  domain?: string;                      // Unique per venture
  industry?: string;
  employeeCount?: number;
  annualRevenue?: string;               // Decimal as string
  address?: OrganizationAddress;
  phone?: string;
  website?: string;
  description?: string;
  ownerId?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}
```

**Permission:** `organizations:create`

**Events emitted:** `organizations.created`

**Throws:** `DUPLICATE_DOMAIN` (409) if domain already exists for venture.

---

#### `getOrganizationContacts`

Get contacts linked to an organization.

```typescript
async function getOrganizationContacts(
  organizationId: string,
  ventureId: string,
): Promise<Contact[]>
```

**Permission:** `organizations:read` + `contacts:read`

---

#### `getOrganizationDeals`

Get deals linked to an organization.

```typescript
async function getOrganizationDeals(
  organizationId: string,
  ventureId: string,
): Promise<Deal[]>
```

**Permission:** `organizations:read` + `deals:read`

---

#### `getOrganizationRevenue`

Get revenue statistics for an organization.

```typescript
async function getOrganizationRevenue(
  organizationId: string,
  ventureId: string,
): Promise<OrganizationRevenue>
```

**Output:**

```typescript
interface OrganizationRevenue {
  totalDealValue: number;               // Sum of all deal values
  wonRevenue: number;                   // Sum of closed-won deal values
  pipelineValue: number;                // Sum of open deal values
  dealCount: number;
  wonCount: number;
  lostCount: number;
  openCount: number;
}
```

---

#### `getIndustries`

Get distinct industries for filter dropdowns.

```typescript
async function getIndustries(ventureId: string): Promise<string[]>
```

**Permission:** `organizations:read`

**Caching:** Redis, TTL 1 hour

---

### Deal Service

#### `createDeal`

Create a new deal in a pipeline.

```typescript
async function createDeal(input: CreateDealInput): Promise<Deal>
```

**Input:**

```typescript
interface CreateDealInput {
  ventureId: string;
  pipelineId: string;
  stage: string;                        // Must be a valid stage in the pipeline
  name: string;
  contactId?: string;
  organizationId?: string;
  value?: string;                       // Decimal as string
  currency?: string;                    // Default: 'USD'
  probability?: number;                 // 0-100
  expectedCloseDate?: string;           // ISO date string
  ownerId?: string;
}
```

**Permission:** `deals:create`

**Events emitted:** `deals.created`

**Throws:** `PIPELINE_NOT_FOUND` (404), `INVALID_STAGE` (400)

**Example:**

```typescript
const deal = await createDeal({
  ventureId: ctx.ventureId,
  pipelineId: pipeline.id,
  stage: 'Discovery',
  name: 'Acme Corp Enterprise License',
  contactId: contact.id,
  organizationId: acmeCorp.id,
  value: '150000',
  currency: 'USD',
  probability: 20,
  expectedCloseDate: '2026-06-30',
  ownerId: salesRep.id,
});
```

---

#### `moveDealStage`

Move a deal to a different pipeline stage.

```typescript
async function moveDealStage(input: MoveDealStageInput): Promise<Deal>
```

**Input:**

```typescript
interface MoveDealStageInput {
  id: string;                           // Deal ID
  stage: string;                        // Target stage name
  ventureId: string;
}
```

**Permission:** `deals:update`

**Events emitted:** `deals.stage_changed`

**Throws:** `DEAL_NOT_FOUND` (404), `INVALID_STAGE` (400)

**Side effects:**
- Validates target stage exists in deal's pipeline
- Checks V2 stage required fields (if applicable)
- Executes stage automations (on_exit for old stage, on_enter for new stage)
- Updates deal's probability to stage's default probability

---

#### `closeDeal`

Close a deal as won or lost.

```typescript
async function closeDeal(input: CloseDealInput): Promise<Deal>
```

**Input:**

```typescript
interface CloseDealInput {
  id: string;
  status: 'won' | 'lost';
  lostReason?: string;                  // Required when status = 'lost'
  ventureId: string;
}
```

**Permission:** `deals:update`

**Events emitted:** `deals.closed_won` or `deals.closed_lost`

**Side effects:**
- Sets `actualCloseDate` to current date
- Sets `status` to won/lost
- Updates forecast items (if forecast exists for the period)

---

#### `getDealsByStage`

Get deals grouped by stage (Kanban board view).

```typescript
async function getDealsByStage(input: DealsByStageInput): Promise<DealsByStageResult>
```

**Input:**

```typescript
interface DealsByStageInput {
  pipelineId: string;
  ventureId: string;
  status?: DealStatus;                  // Default: 'open'
}
```

**Output:**

```typescript
interface DealsByStageResult {
  stages: Array<{
    name: string;
    order: number;
    deals: Deal[];
    totalValue: number;
    dealCount: number;
  }>;
}
```

**Permission:** `deals:read`

**Performance:** Target < 100ms (single query with GROUP BY)

---

#### `getPipelineSummary`

Get aggregate statistics for a pipeline.

```typescript
async function getPipelineSummary(
  pipelineId: string,
  ventureId: string,
): Promise<PipelineSummary>
```

**Output:**

```typescript
interface PipelineSummary {
  pipelineId: string;
  pipelineName: string;
  totalValue: number;
  weightedValue: number;
  dealCount: number;
  avgDealSize: number;
  stageBreakdown: Array<{
    stage: string;
    count: number;
    totalValue: number;
  }>;
}
```

---

#### `getClosedSummary`

Get won/lost summary for a date range.

```typescript
async function getClosedSummary(
  startDate: string,
  endDate: string,
  ventureId: string,
): Promise<ClosedSummary>
```

**Output:**

```typescript
interface ClosedSummary {
  wonCount: number;
  wonValue: number;
  lostCount: number;
  avgDealSize: number;
  avgCycleTimeDays: number;
  winRate: number;                      // Percentage
}
```

---

### Activity Service

#### `logActivity`

Log a CRM activity (note, email, call, meeting, or task).

```typescript
async function logActivity(input: LogActivityInput): Promise<CrmActivity>
```

**Input:**

```typescript
interface LogActivityInput {
  ventureId: string;
  subjectType: 'contact' | 'deal' | 'organization';
  subjectId: string;
  activityType: 'note' | 'email' | 'call' | 'meeting' | 'task';
  title?: string;
  description?: string;
  metadata?: CrmActivityMetadata;
  createdBy?: string;                   // Auto-populated from session if omitted
}
```

**Permission:** Based on subject type (contacts:create, deals:create, or organizations:create)

**Example:**

```typescript
await logActivity({
  ventureId: ctx.ventureId,
  subjectType: 'deal',
  subjectId: deal.id,
  activityType: 'call',
  title: 'Discovery call with VP Engineering',
  description: 'Discussed pain points and budget timeline.',
  metadata: {
    callDirection: 'outbound',
    callDuration: 1800,
    callOutcome: 'answered',
  },
});
```

---

#### `getActivities`

Get activity feed for a specific entity.

```typescript
async function getActivities(input: GetActivitiesInput): Promise<CrmActivity[]>
```

**Input:**

```typescript
interface GetActivitiesInput {
  ventureId: string;
  subjectType: 'contact' | 'deal' | 'organization';
  subjectId: string;
  activityType?: CrmActivityType;       // Filter by type
  limit?: number;                       // Default: 50
  offset?: number;                      // Default: 0
}
```

---

#### `getTimeline`

Get a chronological activity timeline (newest first).

```typescript
async function getTimeline(input: GetTimelineInput): Promise<TimelineResult>
```

**Input:**

```typescript
interface GetTimelineInput {
  ventureId: string;
  subjectType: 'contact' | 'deal' | 'organization';
  subjectId: string;
  limit?: number;                       // Default: 50
  cursor?: string;                      // Cursor-based pagination (createdAt ISO)
}
```

**Output:**

```typescript
interface TimelineResult {
  activities: CrmActivity[];
  nextCursor: string | null;            // Null when no more results
}
```

---

### Deal Scoring Service

#### `scoreDeal`

Score a single deal (0-100) using the 9-factor algorithm.

```typescript
async function scoreDeal(dealId: string, ventureId: string): Promise<ScoreResult>
```

**Output:** `ScoreResult` — See [Type Definitions](#type-definitions)

**Permission:** `deals:read` (for scoring) + `deals:create` (for storing result)

**Events emitted:** `deals.scored`

**Performance:** Target < 200ms (10 parallel data fetches + computation)

**Example:**

```typescript
const result = await scoreDeal(deal.id, ctx.ventureId);
console.log(`Score: ${result.score}/100 (${result.riskLevel} risk)`);
console.log(`Win probability: ${result.winProbability}%`);

for (const factor of result.factors) {
  console.log(`  ${factor.name}: ${factor.score}/${factor.weight} — ${factor.detail}`);
}
```

---

#### `batchScoreDeals`

Score all open deals for a venture.

```typescript
async function batchScoreDeals(ventureId: string): Promise<BatchScoreResult>
```

**Output:**

```typescript
interface BatchScoreResult {
  scored: number;                       // Deals successfully scored
  failed: number;                       // Deals that failed scoring
  duration: number;                     // Total time in milliseconds
  errors: Array<{ dealId: string; error: string }>;
}
```

**Permission:** `deals:update`

**Performance:** ~2-5s per 100 deals (background cron job)

---

#### `getScoreHistory`

Get historical score trend for a deal.

```typescript
async function getScoreHistory(
  dealId: string,
  ventureId: string,
  limit?: number,
): Promise<DealScore[]>
```

Returns most recent scores first. Each entry includes score, factors, signals, and timestamp.

---

#### `getScoringFactors`

Get detailed scoring breakdown for the most recent score.

```typescript
async function getScoringFactors(
  dealId: string,
  ventureId: string,
): Promise<ScoringFactor[]>
```

Returns 9 factors with name, score, weight, and detail explanation.

---

#### `getAtRiskDeals`

Get deals with low or declining scores.

```typescript
async function getAtRiskDeals(
  limit: number,
  ventureId: string,
): Promise<AtRiskDeal[]>
```

**Output:**

```typescript
interface AtRiskDeal {
  dealId: string;
  dealName: string;
  score: number;
  previousScore: number | null;
  scoreDelta: number | null;
  riskLevel: RiskLevel;
  topSignals: ScoringSignal[];
  ownerId: string | null;
  value: string | null;
  stage: string;
}
```

---

#### `predictCloseDate`

Predict close date based on historical deal data.

```typescript
async function predictCloseDate(
  dealId: string,
  ventureId: string,
): Promise<CloseDatePrediction | null>
```

**Output:**

```typescript
interface CloseDatePrediction {
  predictedDate: string;                // ISO date string
  confidence: number;                   // 0-1
  basedOnDeals: number;                 // Historical deals used
  avgCycleTimeDays: number;
}
```

Returns `null` if insufficient historical data for prediction.

---

### Lead Scoring Service

#### `createScoringRule`

Create a lead scoring rule.

```typescript
async function createScoringRule(input: CreateScoringRuleInput): Promise<LeadScoringRule>
```

**Input:**

```typescript
interface CreateScoringRuleInput {
  ventureId: string;
  name: string;
  category: 'behavioral' | 'demographic' | 'firmographic';
  rules: ScoringRuleCondition[];
  maxScore: number;
  decayEnabled?: boolean;               // Default: false
  decayDays?: number;                   // Days before decay starts
  decayPercent?: number;                // Percentage to decay per period
}
```

**Permission:** `contacts:create`

**Example:**

```typescript
await createScoringRule({
  ventureId: ctx.ventureId,
  name: 'Email Engagement',
  category: 'behavioral',
  rules: [
    { field: 'activity.emailCount', operator: 'gte', value: 5, points: 15 },
    { field: 'activity.meetingCount', operator: 'gte', value: 1, points: 20 },
  ],
  maxScore: 45,
  decayEnabled: true,
  decayDays: 30,
  decayPercent: 10,
});
```

---

#### `evaluateContact`

Score a single contact against all active rules.

```typescript
async function evaluateContact(
  contactId: string,
  ventureId: string,
): Promise<ContactScore>
```

**Output:** `ContactScore` with totalScore, behavioralScore, demographicScore, firmographicScore, and breakdown.

**Permission:** `contacts:update`

**Events emitted:** `contacts.scored`

**Side effects:** Updates `contact.leadScore` with the total score.

---

#### `batchScoreContacts`

Re-score all contacts in a venture.

```typescript
async function batchScoreContacts(ventureId: string): Promise<BatchScoreResult>
```

---

#### `getScoreBreakdown`

Get detailed score breakdown for a contact.

```typescript
async function getScoreBreakdown(
  contactId: string,
  ventureId: string,
): Promise<ScoreBreakdown>
```

**Output:**

```typescript
interface ScoreBreakdown {
  rules: Array<{
    ruleId: string;
    ruleName: string;
    category: ScoringCategory;
    matchedConditions: number;
    totalConditions: number;
    pointsEarned: number;
    maxPoints: number;
  }>;
}
```

---

#### `getLeaderboard`

Get top-scored contacts.

```typescript
async function getLeaderboard(
  limit: number,
  ventureId: string,
): Promise<LeaderboardEntry[]>
```

**Output:**

```typescript
interface LeaderboardEntry {
  contactId: string;
  contactName: string;
  company: string | null;
  totalScore: number;
  behavioralScore: number;
  demographicScore: number;
  firmographicScore: number;
  lifecycleStage: LifecycleStage;
}
```

---

#### `applyDecay`

Decay scores for inactive contacts.

```typescript
async function applyDecay(ventureId: string): Promise<DecayResult>
```

**Output:**

```typescript
interface DecayResult {
  contactsDecayed: number;
  avgDecayAmount: number;
}
```

---

#### `getScoreDistribution`

Get score distribution histogram.

```typescript
async function getScoreDistribution(
  ventureId: string,
): Promise<DistributionBucket[]>
```

**Output:**

```typescript
interface DistributionBucket {
  range: string;                        // e.g., '0-10', '11-20', ...
  count: number;
}
```

---

### Forecast Service

#### `createForecast`

Create a forecast period (auto-populates with matching deals).

```typescript
async function createForecast(input: CreateForecastInput): Promise<Forecast>
```

**Input:**

```typescript
interface CreateForecastInput {
  ventureId: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  periodStart: string;                  // YYYY-MM-DD
  periodEnd: string;                    // YYYY-MM-DD
  pipelineId?: string;                  // Optional pipeline filter
  ownerId?: string;                     // Optional owner filter
}
```

**Events emitted:** `forecast.created`

**Side effects:** Automatically creates forecast_items for matching open deals based on probability thresholds.

---

#### `updateForecastItem`

Update a forecast item's category or amount.

```typescript
async function updateForecastItem(
  itemId: string,
  data: { category?: ForecastCategory; amount?: string },
  ventureId: string,
): Promise<ForecastItem>
```

---

#### `getForecastSummary`

Get forecast summary with category breakdowns.

```typescript
async function getForecastSummary(
  period: ForecastPeriod,
  ventureId: string,
): Promise<ForecastSummary[]>
```

---

#### `getForecastVsActual`

Compare forecast to actual closed-won results.

```typescript
async function getForecastVsActual(
  startDate: string,
  endDate: string,
  ventureId: string,
): Promise<ForecastVsActual>
```

**Output:**

```typescript
interface ForecastVsActual {
  forecastAmount: number;
  closedWonAmount: number;
  accuracy: number;                     // Percentage
  dealsClosed: number;
  gap: number;                          // forecastAmount - closedWonAmount
}
```

---

#### `getForecastByOwner`

Get forecast breakdown by sales rep.

```typescript
async function getForecastByOwner(
  forecastId: string,
  ventureId: string,
): Promise<ForecastByOwner[]>
```

**Output:**

```typescript
interface ForecastByOwner {
  ownerId: string;
  ownerName: string;
  commit: number;
  bestCase: number;
  pipeline: number;
  closedWon: number;
  totalForecast: number;
}
```

---

#### `getQuotaAttainment`

Get quota attainment for a specific user.

```typescript
async function getQuotaAttainment(
  userId: string,
  startDate: string,
  endDate: string,
  quotaAmount: number,
  ventureId: string,
): Promise<QuotaAttainment>
```

**Output:**

```typescript
interface QuotaAttainment {
  userId: string;
  userName: string;
  quota: number;
  closedWon: number;
  attainmentPercent: number;
  gap: number;
  remainingDays: number;
}
```

---

#### `getTrendAnalysis`

Get multi-period forecast trend analysis.

```typescript
async function getTrendAnalysis(
  periods: Array<{ start: string; end: string }>,
  ventureId: string,
): Promise<TrendPeriod[]>
```

**Output:**

```typescript
interface TrendPeriod {
  periodStart: string;
  periodEnd: string;
  forecastAmount: number;
  closedWon: number;
  accuracy: number;
  dealsClosed: number;
  avgDealSize: number;
}
```

---

### Duplicate Detection Service

#### `findDuplicates`

Find duplicates for a single record (pre-creation check).

```typescript
async function findDuplicates(
  objectType: 'contact' | 'organization',
  data: Record<string, unknown>,
  ventureId: string,
): Promise<DuplicateMatch[]>
```

**Output:**

```typescript
interface DuplicateMatch {
  matchedRecordId: string;
  confidence: number;                   // 0-100
  matchReasons: string[];
}
```

**Example:**

```typescript
const duplicates = await findDuplicates('contact', {
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'sarah@acmecorp.com',
}, ctx.ventureId);

// [{ matchedRecordId: '...', confidence: 98, matchReasons: ['Exact email match'] }]
```

---

#### `scanForDuplicates`

Batch scan for all duplicate groups.

```typescript
async function scanForDuplicates(
  objectType: 'contact' | 'organization',
  ventureId: string,
): Promise<DuplicateGroup[]>
```

**Performance:** < 2s for 1000 records, < 5s for 2000 records

**Limit:** Scans up to `CRM_DUPLICATE_SCAN_LIMIT` (default: 2000) records.

---

#### `getMergePreview`

Preview merge result with conflict identification.

```typescript
async function getMergePreview(
  objectType: 'contact' | 'organization',
  survivorId: string,
  mergedId: string,
  ventureId: string,
): Promise<MergePreview>
```

---

#### `mergeRecords`

Execute merge with field-level resolution control.

```typescript
async function mergeRecords(
  objectType: 'contact' | 'organization',
  survivorId: string,
  mergedId: string,
  fieldResolutions: Record<string, 'survivor' | 'merged'>,
  userId: string,
  ventureId: string,
): Promise<void>
```

**Events emitted:** `contacts.merged` or `organizations.merged`

**Side effects:**
- Snapshots both records before merge
- Applies field resolutions
- Re-links related records (deals, activities) to survivor
- Deletes merged record
- Creates merge_history entry

---

#### `getMergeHistory`

Get audit trail of all merges.

```typescript
async function getMergeHistory(
  ventureId: string,
  limit?: number,
): Promise<MergeHistoryRecord[]>
```

---

### Custom Object Service

#### `createCustomObject`

Define a new custom CRM entity.

```typescript
async function createCustomObject(input: CreateCustomObjectInput): Promise<CustomObject>
```

**Input:**

```typescript
interface CreateCustomObjectInput {
  ventureId: string;
  name: string;
  pluralName: string;
  slug: string;                         // URL-safe, unique per venture
  icon?: string;
  color?: string;
  fields: CustomObjectFieldDef[];
}
```

**Events emitted:** `custom_object.created`

**Throws:** `CUSTOM_OBJECT_SLUG_EXISTS` (409)

---

#### `createCustomRecord`

Create a record in a custom object.

```typescript
async function createCustomRecord(
  objectId: string,
  data: Record<string, unknown>,
  ventureId: string,
): Promise<CustomObjectRecord>
```

**Validation:** Data is validated against the custom object's field schema (types, required fields, options, ranges).

---

#### `createRelationship`

Link two objects via a relationship.

```typescript
async function createRelationship(input: CreateRelationshipInput): Promise<ObjectRelationship>
```

**Input:**

```typescript
interface CreateRelationshipInput {
  ventureId: string;
  sourceObjectType: string;             // 'contact' | 'organization' | 'deal' | 'custom'
  sourceObjectId: string;
  targetObjectType: string;
  targetObjectId: string;
  relationshipType: 'has_many' | 'belongs_to' | 'many_to_many';
  label?: string;
}
```

---

#### `getRelatedRecords`

Get related records for a given object.

```typescript
async function getRelatedRecords(
  objectType: string,
  objectId: string,
  ventureId: string,
): Promise<RelatedRecord[]>
```

---

### Smart View Service

#### `createSmartView`

Create a saved view with filters, sort, and columns.

```typescript
async function createSmartView(input: CreateSmartViewInput): Promise<SmartView>
```

**Input:**

```typescript
interface CreateSmartViewInput {
  ventureId: string;
  name: string;
  objectType: 'contact' | 'organization' | 'deal' | 'custom';
  filters: SmartViewFilter[];
  sortBy?: SmartViewSort[];
  columns?: SmartViewColumn[];
  isDefault?: boolean;
  isShared?: boolean;
}
```

**Events emitted:** `smart_view.created`

---

#### `applySmartView`

Execute a smart view and return filtered results.

```typescript
async function applySmartView(
  viewId: string,
  ventureId: string,
  page?: number,
  pageSize?: number,
): Promise<SmartViewResult>
```

**Output:**

```typescript
interface SmartViewResult {
  data: Record<string, unknown>[];      // Filtered records
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  view: SmartView;                      // The applied view configuration
}
```

**Performance:** Target < 80ms (dynamic query building + execution)

---

#### `shareSmartView`

Toggle view sharing (personal ↔ team-wide).

```typescript
async function shareSmartView(
  viewId: string,
  isShared: boolean,
  ventureId: string,
): Promise<SmartView>
```

---

#### `duplicateSmartView`

Clone a view with a new name.

```typescript
async function duplicateSmartView(
  viewId: string,
  newName: string,
  ventureId: string,
): Promise<SmartView>
```

---

## Type Definitions

### Core Entity Types

```typescript
// Contact
interface Contact {
  id: string;
  ventureId: string;
  type: ContactType;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  leadScore: number;
  lifecycleStage: LifecycleStage;
  ownerId: string | null;
  customFields: ContactCustomFields;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

type ContactType = 'person' | 'company';
type LifecycleStage = 'lead' | 'marketing_qualified' | 'sales_qualified'
  | 'opportunity' | 'customer' | 'evangelist' | 'churned';

// Organization
interface Organization {
  id: string;
  ventureId: string;
  name: string;
  domain: string | null;
  industry: string | null;
  employeeCount: number | null;
  annualRevenue: string | null;
  address: OrganizationAddress | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  ownerId: string | null;
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Deal
interface Deal {
  id: string;
  ventureId: string;
  pipelineId: string;
  stage: string;
  contactId: string | null;
  organizationId: string | null;
  name: string;
  value: string | null;
  currency: string;
  probability: number | null;
  status: DealStatus;
  expectedCloseDate: string | null;
  actualCloseDate: string | null;
  lostReason: string | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type DealStatus = 'open' | 'won' | 'lost';

// Pipeline
interface Pipeline {
  id: string;
  ventureId: string;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Activity
interface CrmActivity {
  id: string;
  ventureId: string;
  subjectType: CrmActivitySubjectType;
  subjectId: string;
  activityType: CrmActivityType;
  title: string | null;
  description: string | null;
  metadata: CrmActivityMetadata;
  createdBy: string | null;
  createdAt: Date;
}

type CrmActivityType = 'note' | 'email' | 'call' | 'meeting' | 'task';
type CrmActivitySubjectType = 'contact' | 'deal' | 'organization';
```

### Scoring Types

```typescript
interface ScoreResult {
  score: number;
  confidence: number;
  factors: ScoringFactor[];
  signals: ScoringSignal[];
  predictedCloseDate: string | null;
  predictedAmount: string | null;
  winProbability: number;
  riskLevel: RiskLevel;
}

interface ScoringFactor {
  name: string;
  score: number;
  weight: number;
  detail: string;
}

interface ScoringSignal {
  type: 'positive' | 'negative';
  label: string;
  detail: string;
  impact: number;
}

type RiskLevel = 'low' | 'medium' | 'high';

interface ContactScore {
  id: string;
  contactId: string;
  ventureId: string;
  totalScore: number;
  behavioralScore: number;
  demographicScore: number;
  firmographicScore: number;
  breakdown: ScoreBreakdown;
  lastActivityAt: Date | null;
  scoredAt: Date;
}

interface LeadScoringRule {
  id: string;
  ventureId: string;
  name: string;
  category: ScoringCategory;
  rules: ScoringRuleCondition[];
  maxScore: number;
  decayEnabled: boolean;
  decayDays: number | null;
  decayPercent: number | null;
  isActive: boolean;
}

type ScoringCategory = 'behavioral' | 'demographic' | 'firmographic';

interface ScoringRuleCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: unknown;
  points: number;
}
```

### Forecast Types

```typescript
interface Forecast {
  id: string;
  ventureId: string;
  period: ForecastPeriod;
  periodStart: string;
  periodEnd: string;
  pipelineId: string | null;
  ownerId: string | null;
  forecastAmount: string;
  weightedAmount: string;
  bestCase: string;
  worstCase: string;
  closedWonAmount: string;
  status: 'open' | 'closed';
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ForecastPeriod = 'monthly' | 'quarterly' | 'yearly';
type ForecastCategory = 'commit' | 'best_case' | 'pipeline' | 'omitted';
```

### Duplicate & Merge Types

```typescript
interface DuplicateMatch {
  matchedRecordId: string;
  confidence: number;
  matchReasons: string[];
}

interface DuplicateGroup {
  records: Array<{
    id: string;
    data: Record<string, unknown>;
    confidence: number;
    matchReasons: string[];
  }>;
  bestMatch: number;
}

interface MergePreview {
  survivorId: string;
  mergedId: string;
  conflicts: Array<{
    field: string;
    survivorValue: unknown;
    mergedValue: unknown;
  }>;
  autoResolved: Record<string, unknown>;
}

interface MergeHistoryRecord {
  id: string;
  objectType: string;
  survivorId: string;
  mergedId: string;
  fieldResolutions: Record<string, 'survivor' | 'merged'>;
  survivorSnapshot: Record<string, unknown>;
  mergedSnapshot: Record<string, unknown>;
  mergedBy: string;
  mergedAt: Date;
}
```

### Custom Object & Smart View Types

```typescript
interface CustomObject {
  id: string;
  ventureId: string;
  name: string;
  pluralName: string;
  slug: string;
  icon: string | null;
  color: string | null;
  fields: CustomObjectFieldDef[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomObjectFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'url' | 'date' | 'datetime'
      | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'currency' | 'percent';
  required?: boolean;
  options?: string[];
  defaultValue?: unknown;
  placeholder?: string;
  validation?: { min?: number; max?: number; pattern?: string };
}

interface SmartView {
  id: string;
  ventureId: string;
  name: string;
  objectType: 'contact' | 'organization' | 'deal' | 'custom';
  filters: SmartViewFilter[];
  sortBy: SmartViewSort[];
  columns: SmartViewColumn[];
  isDefault: boolean;
  isShared: boolean;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SmartViewFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains'
          | 'in' | 'between' | 'is_null' | 'is_not_null';
  value: unknown;
}
```

---

## Zod Schemas

### Contact Schemas

```typescript
const createContactSchema = z.object({
  type: z.enum(['person', 'company']),
  firstName: z.string().max(255).trim().optional(),
  lastName: z.string().max(255).trim().optional(),
  email: z.string().email().toLowerCase().optional(),
  phone: z.string().max(50).trim().optional(),
  company: z.string().max(255).trim().optional(),
  jobTitle: z.string().max(255).trim().optional(),
  lifecycleStage: z.enum([
    'lead', 'marketing_qualified', 'sales_qualified',
    'opportunity', 'customer', 'evangelist', 'churned',
  ]).default('lead'),
  ownerId: z.string().uuid().optional(),
  customFields: z.record(z.unknown()).default({}),
  tags: z.array(z.string().max(100)).max(50).default([]),
});

const updateContactSchema = createContactSchema.partial();

const listContactsSchema = z.object({
  type: z.enum(['person', 'company']).optional(),
  lifecycleStage: z.enum(LIFECYCLE_STAGES).optional(),
  ownerId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const searchContactsSchema = z.object({
  query: z.string().min(1).max(255),
  limit: z.number().int().min(1).max(50).default(10),
});
```

### Deal Schemas

```typescript
const createDealSchema = z.object({
  pipelineId: z.string().uuid(),
  stage: z.string().min(1).max(255),
  name: z.string().min(1).max(500),
  contactId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  value: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  currency: z.string().length(3).default('USD'),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ownerId: z.string().uuid().optional(),
});

const moveDealStageSchema = z.object({
  id: z.string().uuid(),
  stage: z.string().min(1).max(255),
});

const closeDealSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['won', 'lost']),
  lostReason: z.string().max(1000).optional(),
});
```

### Activity Schemas

```typescript
const logActivitySchema = z.object({
  subjectType: z.enum(['contact', 'deal', 'organization']),
  subjectId: z.string().uuid(),
  activityType: z.enum(['note', 'email', 'call', 'meeting', 'task']),
  title: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  metadata: z.object({
    // Email
    emailFrom: z.string().email().optional(),
    emailTo: z.array(z.string().email()).optional(),
    emailSubject: z.string().max(500).optional(),
    emailDirection: z.enum(['inbound', 'outbound']).optional(),
    // Call
    callDirection: z.enum(['inbound', 'outbound']).optional(),
    callDuration: z.number().int().min(0).optional(),
    callOutcome: z.enum(['answered', 'no_answer', 'busy', 'voicemail', 'wrong_number']).optional(),
    callRecordingUrl: z.string().url().optional(),
    // Meeting
    meetingStart: z.string().datetime().optional(),
    meetingEnd: z.string().datetime().optional(),
    meetingLocation: z.string().max(500).optional(),
    meetingUrl: z.string().url().optional(),
    meetingAttendees: z.array(z.object({
      email: z.string().email(),
      name: z.string().optional(),
      status: z.enum(['pending', 'accepted', 'declined', 'tentative']).optional(),
    })).optional(),
    meetingOutcome: z.enum(['completed', 'no_show', 'rescheduled', 'cancelled']).optional(),
    // Task
    taskDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    taskPriority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    taskStatus: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
    taskAssignedTo: z.string().uuid().optional(),
    // Common
    tags: z.array(z.string()).optional(),
  }).passthrough().default({}),
});
```

### Scoring Schemas

```typescript
const createScoringRuleSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.enum(['behavioral', 'demographic', 'firmographic']),
  rules: z.array(z.object({
    field: z.string().min(1),
    operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'in']),
    value: z.unknown(),
    points: z.number().int().min(0).max(100),
  })).min(1),
  maxScore: z.number().int().min(1).max(1000),
  decayEnabled: z.boolean().default(false),
  decayDays: z.number().int().min(1).optional(),
  decayPercent: z.number().int().min(1).max(100).optional(),
});
```

### Smart View Schemas

```typescript
const createSmartViewSchema = z.object({
  name: z.string().min(1).max(255),
  objectType: z.enum(['contact', 'organization', 'deal', 'custom']),
  filters: z.array(z.object({
    field: z.string().min(1),
    operator: z.enum([
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
      'contains', 'in', 'between', 'is_null', 'is_not_null',
    ]),
    value: z.unknown(),
  })).default([]),
  sortBy: z.array(z.object({
    field: z.string().min(1),
    direction: z.enum(['asc', 'desc']),
  })).default([]),
  columns: z.array(z.object({
    field: z.string().min(1),
    label: z.string().min(1),
    visible: z.boolean().default(true),
    order: z.number().int().min(0),
  })).default([]),
  isDefault: z.boolean().default(false),
  isShared: z.boolean().default(false),
});
```

### Custom Object Schemas

```typescript
const createCustomObjectSchema = z.object({
  name: z.string().min(1).max(100),
  pluralName: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  fields: z.array(z.object({
    key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/),
    label: z.string().min(1).max(255),
    type: z.enum([
      'text', 'number', 'email', 'phone', 'url', 'date', 'datetime',
      'boolean', 'select', 'multiselect', 'textarea', 'currency', 'percent',
    ]),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
    defaultValue: z.unknown().optional(),
    placeholder: z.string().max(255).optional(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    }).optional(),
  })).min(1).max(100),
});
```

---

## Events

### Audit Event Catalog

All CRM mutations emit audit events via `@mcv/kernel`'s audit service. Events are published asynchronously to Redpanda/Kafka.

| Event | Category | Trigger | Payload |
|---|---|---|---|
| `contacts.created` | data | `createContact` | `{ contact: Contact }` |
| `contacts.updated` | data | `updateContact` | `{ contactId, changes: Partial<Contact> }` |
| `contacts.deleted` | data | `deleteContact` | `{ contactId }` |
| `contacts.bulk_updated` | data | `bulkUpdateContacts` | `{ count, changes }` |
| `contacts.bulk_deleted` | data | `bulkDeleteContacts` | `{ count, ids }` |
| `contacts.scored` | analytics | `evaluateContact` | `{ contactId, score: ContactScore }` |
| `contacts.merged` | data | `mergeRecords` | `{ survivorId, mergedId, resolutions }` |
| `organizations.created` | data | `createOrganization` | `{ organization: Organization }` |
| `organizations.updated` | data | `updateOrganization` | `{ orgId, changes }` |
| `organizations.deleted` | data | `deleteOrganization` | `{ orgId }` |
| `organizations.bulk_deleted` | data | `bulkDeleteOrganizations` | `{ count, ids }` |
| `organizations.merged` | data | `mergeRecords` | `{ survivorId, mergedId, resolutions }` |
| `deals.created` | data | `createDeal` | `{ deal: Deal }` |
| `deals.updated` | data | `updateDeal` | `{ dealId, changes }` |
| `deals.stage_changed` | workflow | `moveDealStage` | `{ dealId, oldStage, newStage }` |
| `deals.closed_won` | revenue | `closeDeal(won)` | `{ deal, value, closeDate }` |
| `deals.closed_lost` | revenue | `closeDeal(lost)` | `{ deal, reason }` |
| `deals.deleted` | data | `deleteDeal` | `{ dealId }` |
| `deals.scored` | analytics | `scoreDeal` | `{ dealId, score: ScoreResult }` |
| `forecast.created` | analytics | `createForecast` | `{ forecast: Forecast }` |
| `smart_view.created` | config | `createSmartView` | `{ view: SmartView }` |
| `custom_object.created` | config | `createCustomObject` | `{ object: CustomObject }` |

### Event Schema

```typescript
interface CrmAuditEvent {
  id: string;                           // Event UUID
  type: string;                         // e.g., 'contacts.created'
  category: 'data' | 'workflow' | 'revenue' | 'analytics' | 'config';
  ventureId: string;
  userId: string;                       // Actor who triggered the event
  payload: Record<string, unknown>;     // Event-specific data
  timestamp: string;                    // ISO 8601
}
```

### Subscribing to Events

```typescript
// Via Redpanda/Kafka consumer
import { createConsumer } from '@mcv/kernel/events';

const consumer = createConsumer('crm.events');

consumer.on('deals.closed_won', async (event) => {
  // Update analytics dashboard
  await refreshPipelineMetrics(event.ventureId);
});

consumer.on('contacts.scored', async (event) => {
  // Trigger growth campaign for high-scoring leads
  if (event.payload.score.totalScore > 80) {
    await triggerHighScoreWorkflow(event.payload.contactId);
  }
});
```

---

## Error Codes

| Code | HTTP Status | Description | Thrown By |
|---|---|---|---|
| `CONTACT_NOT_FOUND` | 404 | Contact does not exist or is not in the venture | getContact, updateContact, deleteContact |
| `ORGANIZATION_NOT_FOUND` | 404 | Organization does not exist | getOrganization, updateOrganization, deleteOrganization |
| `DEAL_NOT_FOUND` | 404 | Deal does not exist | getDeal, updateDeal, deleteDeal, moveDealStage, closeDeal |
| `PIPELINE_NOT_FOUND` | 404 | Pipeline does not exist | createDeal, getDealsByStage |
| `SCORING_RULE_NOT_FOUND` | 404 | Lead scoring rule does not exist | updateScoringRule, deleteScoringRule |
| `FORECAST_NOT_FOUND` | 404 | Forecast period does not exist | getForecastSummary, updateForecastItem |
| `FORECAST_ITEM_NOT_FOUND` | 404 | Forecast item does not exist | updateForecastItem |
| `MERGE_RECORD_NOT_FOUND` | 404 | One or both records not found for merge | mergeRecords, getMergePreview |
| `VIEW_NOT_FOUND` | 404 | Smart view does not exist | applySmartView, updateSmartView, deleteSmartView |
| `CUSTOM_OBJECT_NOT_FOUND` | 404 | Custom object definition does not exist | getCustomObject, createCustomRecord |
| `DUPLICATE_DOMAIN` | 409 | Organization with this domain already exists in venture | createOrganization |
| `CUSTOM_OBJECT_SLUG_EXISTS` | 409 | Custom object slug already in use for venture | createCustomObject |
| `INVALID_STAGE` | 400 | Stage does not exist in the pipeline | moveDealStage, createDeal |
| `VENTURE_REQUIRED` | 400 | Venture context is required but missing | All service methods |
| `DATABASE_UNAVAILABLE` | 500 | Database connection not available | All service methods |

### Error Response Format

```typescript
// tRPC error format
{
  "error": {
    "message": "Contact does not exist or not in venture",
    "code": "NOT_FOUND",
    "data": {
      "code": "CONTACT_NOT_FOUND",
      "httpStatus": 404,
      "path": "contacts.get"
    }
  }
}
```

---

## Configuration

### Environment Variables

```bash
# CRM Limits
CRM_DEFAULT_PIPELINE_STAGES=5
CRM_MAX_CONTACTS_PER_VENTURE=1000000
CRM_MAX_DEALS_PER_VENTURE=100000
CRM_MAX_CUSTOM_OBJECTS=50
CRM_MAX_CUSTOM_FIELDS=100

# Scoring
CRM_DEAL_SCORE_BATCH_SIZE=100
CRM_LEAD_SCORE_BATCH_SIZE=5000
CRM_LEAD_DECAY_INTERVAL_DAYS=30
CRM_LEAD_DECAY_PERCENT=10

# Duplicate Detection
CRM_DUPLICATE_SCAN_LIMIT=2000
CRM_DUPLICATE_CONFIDENCE_THRESHOLD=60
CRM_FUZZY_NAME_THRESHOLD=85

# Forecast
CRM_FORECAST_AUTO_POPULATE=true
CRM_FORECAST_COMMIT_THRESHOLD=90
CRM_FORECAST_BEST_CASE_THRESHOLD=70

# Cron Schedules
CRM_BATCH_SCORE_CRON="0 2 * * *"
CRM_LEAD_DECAY_CRON="0 3 * * 1"
CRM_DUPLICATE_SCAN_CRON="0 4 * * 0"
```

### Client React Hooks

```typescript
// Available hooks (all venture-scoped via session context)
import {
  useContacts,      // List/filter contacts with pagination
  useContact,       // Single contact by ID
  useDeals,         // List/filter deals with pagination
  useDealPipeline,  // Kanban view — deals by stage
  useDealScore,     // Deal score with factors and signals
  useLeadScoring,   // Lead scoring rules and evaluation
  useForecast,      // Forecast summary and trends
  useDuplicates,    // Duplicate detection results
  useSmartView,     // Smart view configuration and results
  useActivities,    // Activity timeline for an entity
} from '@mcv/crm';
```

### Client React Components

```typescript
import {
  ContactList,          // Paginated contact table with filters
  ContactDetail,        // Contact profile with linked entities
  DealKanban,           // Drag-and-drop Kanban board
  DealScoreCard,        // Deal health score visualization
  PipelineView,         // Pipeline overview with stage breakdown
  ForecastDashboard,    // Revenue forecast with charts
  LeadScoreWidget,      // Contact score breakdown widget
  DuplicateResolver,    // Side-by-side merge interface
  ActivityTimeline,     // Chronological activity feed
  SmartViewBuilder,     // Visual filter/sort/column builder
} from '@mcv/crm';
```

---

*@mcv/crm — Customer Relationship Management Domain*
