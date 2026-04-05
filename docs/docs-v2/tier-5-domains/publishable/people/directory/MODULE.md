# @mcv/people/directory

> **People Directory** — Employee and member directory with rich profiles, org structure visualization, skills matrix, and people search for the MCV.ONE platform.

```
Module:       @mcv/people/directory
Domain:       people
Tier:         5 (Domain Module)
Runtime:      Node.js (ES2022+)
Database:     Supabase PostgreSQL + Drizzle ORM
API:          tRPC v11
Status:       Stable
Since:        0.12.0
```

---

## Table of Contents

1. [Purpose](#purpose)
2. [Exports](#exports)
3. [Architecture](#architecture)
4. [Core Interfaces](#core-interfaces)
5. [Database Schemas](#database-schemas)
6. [Code Examples](#code-examples)
7. [Error Codes](#error-codes)
8. [Security](#security)
9. [Environment Variables](#environment-variables)
10. [Dependencies](#dependencies)
11. [Testing](#testing)

---

## Purpose

`@mcv/people/directory` is the central people directory for MCV.ONE tenants. It provides a unified system for managing employee/member profiles, visualizing organizational structure, searching across the workforce, tracking skills and expertise, and supporting team-based collaboration views.

### What This Module Does

- **Manages employee profiles** with rich metadata: name, title, department, location, manager, contact information, skills, biography, pronouns, timezone, and custom fields
- **Provides full-text directory search** with faceted filtering by department, location, skills, title, and arbitrary custom fields using PostgreSQL `pg_trgm` trigram indexing
- **Renders interactive org charts** showing reporting chains, span of control, and supporting drag-and-drop reorganization with audit trails
- **Supports team pages** including rosters, team leads, team goals, and cross-functional team membership
- **Tracks skills and expertise** through a skills matrix with proficiency levels, gap analysis, and expertise finder
- **Generates contact cards** with quick-view overlays, click-to-call/email/chat actions, and real-time availability status
- **Enables admin-defined custom fields** with visibility rules, required/optional enforcement, and type validation
- **Handles offboarding workflows** including profile deactivation, access revocation triggers, alumni directory, and configurable data retention
- **Integrates with external systems** — HRIS sync, SSO profile enrichment, calendar availability, and Slack/Teams presence status
- **Provides directory analytics** — headcount by department/location, growth trends, tenure distribution, and skills coverage reporting

### What This Module Does NOT Do

- **Does not handle authentication** — relies on `@mcv/auth` for identity and session management
- **Does not manage payroll or compensation** — that belongs to `@mcv/people/payroll`
- **Does not handle recruitment** — applicant tracking lives in `@mcv/people/recruiting`
- **Does not manage time-off or attendance** — see `@mcv/people/time-tracking`
- **Does not store documents** — document attachment uses `@mcv/storage` as a dependency
- **Does not send notifications directly** — emits events consumed by `@mcv/notifications`

---

## Exports

### Services

| Export | Type | Description |
|--------|------|-------------|
| `DirectoryService` | Class | Primary service — CRUD for employees, search, org operations |
| `OrgChartService` | Class | Org chart tree building, traversal, reorg operations |
| `SkillMatrixService` | Class | Skills management, proficiency tracking, gap analysis |
| `TeamService` | Class | Team CRUD, membership management, cross-functional teams |
| `ContactCardService` | Class | Contact card generation, availability aggregation |
| `CustomFieldService` | Class | Custom field definition, validation, and value management |
| `OffboardingService` | Class | Profile deactivation, alumni management, data retention |
| `DirectorySearchService` | Class | Full-text search engine, faceted filtering, ranking |
| `DirectorySyncService` | Class | HRIS sync, SSO enrichment, external system integration |
| `DirectoryAnalyticsService` | Class | Headcount, growth, tenure, skills coverage reporting |

### Router

| Export | Type | Description |
|--------|------|-------------|
| `directoryRouter` | tRPC Router | Complete tRPC router for all directory operations |
| `directoryPublicRouter` | tRPC Router | Public-facing directory router (limited fields) |

### Schemas

| Export | Type | Description |
|--------|------|-------------|
| `employees` | Drizzle Table | Employee/member profiles |
| `employeeSkills` | Drizzle Table | Skill assignments with proficiency |
| `teams` | Drizzle Table | Team definitions |
| `teamMembers` | Drizzle Table | Team membership join table |
| `orgNodes` | Drizzle Table | Org chart node hierarchy |
| `customFields` | Drizzle Table | Custom field definitions |
| `customFieldValues` | Drizzle Table | Custom field instance values |
| `employeeContacts` | Drizzle Table | Contact methods per employee |
| `directoryActivities` | Drizzle Table | Audit log of directory changes |

### Types

| Export | Type | Description |
|--------|------|-------------|
| `Employee` | Interface | Full employee profile type |
| `EmployeeCreateInput` | Zod Schema | Validated input for creating employees |
| `EmployeeUpdateInput` | Zod Schema | Validated input for updating employees |
| `Team` | Interface | Team definition type |
| `OrgNode` | Interface | Org chart node with hierarchy info |
| `SkillEntry` | Interface | Skill assignment with proficiency |
| `SkillMatrix` | Interface | Complete skills matrix for analysis |
| `ContactCard` | Interface | Rendered contact card data |
| `CustomField` | Interface | Custom field definition |
| `CustomFieldValue` | Interface | Custom field instance value |
| `DirectorySearchQuery` | Zod Schema | Search query parameters |
| `DirectorySearchResult` | Interface | Search result with ranking |
| `OrgChart` | Interface | Complete org chart tree |
| `DirectoryAnalytics` | Interface | Analytics snapshot data |
| `OffboardingRequest` | Interface | Offboarding workflow input |
| `HRISSyncConfig` | Interface | HRIS integration configuration |
| `DirectoryEvent` | Union Type | All directory domain events |

### Hooks (React)

| Export | Type | Description |
|--------|------|-------------|
| `useEmployee` | Hook | Fetch and cache single employee profile |
| `useEmployeeList` | Hook | Paginated employee listing |
| `useDirectorySearch` | Hook | Debounced directory search with facets |
| `useOrgChart` | Hook | Org chart tree data with expand/collapse |
| `useTeam` | Hook | Team details with roster |
| `useSkillMatrix` | Hook | Skills matrix data for a scope |
| `useContactCard` | Hook | Contact card with availability |
| `useCustomFields` | Hook | Custom field definitions for a tenant |

### Utilities

| Export | Type | Description |
|--------|------|-------------|
| `buildOrgTree` | Function | Convert flat org nodes to tree structure |
| `flattenOrgTree` | Function | Flatten tree back to array |
| `calculateSpanOfControl` | Function | Compute span metrics for a manager |
| `formatEmployeeName` | Function | Name formatting with cultural options |
| `generateVCard` | Function | Create vCard from employee profile |
| `parseHRISPayload` | Function | Normalize incoming HRIS data |
| `computeSkillGaps` | Function | Analyze skill gaps against requirements |
| `buildSearchIndex` | Function | Generate trigram search tokens |

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────┐ ┌───────────┐  │
│  │  Directory   │ │  Org Chart   │ │  Search   │ │   Team    │  │
│  │    Page      │ │  Visualizer  │ │    Bar    │ │   Pages   │  │
│  └──────┬──────┘ └──────┬───────┘ └─────┬─────┘ └─────┬─────┘  │
│         │               │               │             │         │
│  ┌──────┴───────────────┴───────────────┴─────────────┴──────┐  │
│  │                    React Hooks Layer                       │  │
│  │  useEmployee, useOrgChart, useDirectorySearch, useTeam     │  │
│  └──────────────────────┬────────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────────┘
                          │ tRPC
┌─────────────────────────┼───────────────────────────────────────┐
│                   API / Service Layer                            │
│  ┌──────────────────────┴────────────────────────────────────┐  │
│  │                   directoryRouter (tRPC)                   │  │
│  └──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬───────┘  │
│     │      │      │      │      │      │      │      │          │
│  ┌──┴──┐┌──┴──┐┌──┴──┐┌──┴──┐┌──┴──┐┌──┴──┐┌──┴──┐┌──┴──────┐ │
│  │Dir. ││Org  ││Skill││Team ││Cont.││Cust.││Offb.││Analytics│ │
│  │Svc  ││Chart││Matrx││Svc  ││Card ││Field││Svc  ││Service  │ │
│  └──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──────┘ │
│     │      │      │      │      │      │      │      │          │
│  ┌──┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴───────┐  │
│  │              DirectorySearchService (pg_trgm)              │  │
│  └──────────────────────┬────────────────────────────────────┘  │
│  ┌──────────────────────┴────────────────────────────────────┐  │
│  │              DirectorySyncService (HRIS/SSO)               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Drizzle ORM
┌─────────────────────────┼───────────────────────────────────────┐
│                    Data Layer (Supabase)                         │
│  ┌──────────┐ ┌────────────────┐ ┌─────────┐ ┌──────────────┐  │
│  │employees │ │employee_skills │ │  teams   │ │team_members  │  │
│  └──────────┘ └────────────────┘ └─────────┘ └──────────────┘  │
│  ┌──────────┐ ┌────────────────┐ ┌─────────────────────────┐   │
│  │org_nodes │ │custom_fields   │ │custom_field_values      │   │
│  └──────────┘ └────────────────┘ └─────────────────────────┘   │
│  ┌────────────────────┐ ┌──────────────────────────────────┐   │
│  │employee_contacts   │ │directory_activities              │   │
│  └────────────────────┘ └──────────────────────────────────┘   │
│                                                                 │
│  RLS: tenant_id isolation on all tables                         │
│  Extensions: pg_trgm, btree_gin                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Client** calls a React hook (e.g., `useDirectorySearch`)
2. **Hook** invokes the tRPC procedure via the generated client
3. **tRPC middleware** validates the session, extracts `tenant_id`, enforces RBAC
4. **Router procedure** delegates to the appropriate service
5. **Service** executes business logic, calls Drizzle queries
6. **Drizzle** generates SQL; Supabase executes with RLS enforcing tenant isolation
7. **Results** flow back through the service, router, and hook to the UI

### Multi-Tenant Isolation

Every table includes a `tenant_id` column. Row-Level Security (RLS) policies on Supabase ensure that:

- Queries only return rows matching the authenticated user's tenant
- Inserts automatically set `tenant_id` from the JWT claim
- Updates and deletes are scoped to the tenant
- Cross-tenant access is impossible at the database level

```sql
-- Example RLS policy on employees table
CREATE POLICY "tenant_isolation" ON employees
  USING (tenant_id = auth.jwt() ->> 'tenant_id')
  WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');
```

### Event Architecture

Directory operations emit domain events consumed by other modules:

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `employee.created` | New employee added | notifications, audit, integrations |
| `employee.updated` | Profile fields changed | search-index, audit, sync |
| `employee.deactivated` | Employee offboarded | auth, access, notifications |
| `employee.reactivated` | Alumni re-hired | auth, notifications |
| `org.restructured` | Org chart changed | notifications, analytics |
| `team.created` | New team formed | notifications, analytics |
| `team.member.added` | Member joined team | notifications |
| `team.member.removed` | Member left team | notifications |
| `skill.added` | Skill assigned | search-index, analytics |
| `skill.removed` | Skill removed | search-index, analytics |
| `directory.synced` | HRIS sync completed | audit, analytics |
| `custom_field.created` | New custom field defined | search-index |

---

## Core Interfaces

### Employee

The central data type representing a person in the directory.

```typescript
/**
 * Full employee/member profile in the directory.
 *
 * This is the read-model returned by queries. For write operations,
 * use EmployeeCreateInput or EmployeeUpdateInput (Zod-validated).
 */
interface Employee {
  /** Unique identifier (UUIDv7) */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** Link to auth user (nullable for pre-provisioned profiles) */
  userId: string | null;

  // ── Identity ──────────────────────────────────────────────

  /** Legal first name */
  firstName: string;

  /** Legal last name */
  lastName: string;

  /** Preferred display name (e.g., "Mike" instead of "Michael") */
  preferredName: string | null;

  /** Preferred pronouns (e.g., "they/them", "she/her") */
  pronouns: string | null;

  /** Profile photo URL (from storage or external) */
  avatarUrl: string | null;

  /** Short biography / about-me text (max 2000 chars) */
  bio: string | null;

  // ── Role ──────────────────────────────────────────────────

  /** Job title */
  title: string;

  /** Department identifier */
  departmentId: string | null;

  /** Department name (denormalized for search) */
  departmentName: string | null;

  /** Division or business unit */
  division: string | null;

  /** Employee number / badge ID */
  employeeNumber: string | null;

  /** Employment type: full_time, part_time, contractor, intern */
  employmentType: EmploymentType;

  /** Employment status: active, inactive, on_leave, offboarded */
  status: EmployeeStatus;

  // ── Location ──────────────────────────────────────────────

  /** Primary work location name */
  location: string | null;

  /** Office or building identifier */
  officeId: string | null;

  /** Remote, hybrid, or on-site */
  workMode: WorkMode;

  /** IANA timezone (e.g., "America/Toronto") */
  timezone: string | null;

  /** ISO 3166-1 country code */
  country: string | null;

  // ── Hierarchy ─────────────────────────────────────────────

  /** Direct manager employee ID */
  managerId: string | null;

  /** Manager profile (populated on demand) */
  manager?: EmployeeSummary | null;

  /** Direct reports (populated on demand) */
  directReports?: EmployeeSummary[];

  // ── Contact ───────────────────────────────────────────────

  /** Primary work email */
  email: string;

  /** Work phone number (E.164 format) */
  phone: string | null;

  /** Contact methods (populated on demand) */
  contacts?: EmployeeContact[];

  // ── Skills ────────────────────────────────────────────────

  /** Skill entries (populated on demand) */
  skills?: SkillEntry[];

  // ── Custom Fields ─────────────────────────────────────────

  /** Custom field values (populated on demand) */
  customFields?: Record<string, CustomFieldValue>;

  // ── Dates ─────────────────────────────────────────────────

  /** Date of hire */
  startDate: string;

  /** Date of departure (null if active) */
  endDate: string | null;

  /** Record creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;

  /** Soft-delete timestamp */
  deletedAt: string | null;
}

/** Compact employee reference used in lists and relationships */
interface EmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  title: string;
  departmentName: string | null;
  avatarUrl: string | null;
  email: string;
  status: EmployeeStatus;
}

type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'intern';
type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'offboarded';
type WorkMode = 'remote' | 'hybrid' | 'on_site';
```

### EmployeeCreateInput / EmployeeUpdateInput

```typescript
import { z } from 'zod';

const EmployeeCreateInput = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  preferredName: z.string().max(100).nullish(),
  pronouns: z.string().max(50).nullish(),
  avatarUrl: z.string().url().nullish(),
  bio: z.string().max(2000).nullish(),
  title: z.string().min(1).max(200),
  departmentId: z.string().uuid().nullish(),
  division: z.string().max(200).nullish(),
  employeeNumber: z.string().max(50).nullish(),
  employmentType: z.enum(['full_time', 'part_time', 'contractor', 'intern']),
  email: z.string().email(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/).nullish(),
  location: z.string().max(200).nullish(),
  officeId: z.string().uuid().nullish(),
  workMode: z.enum(['remote', 'hybrid', 'on_site']).default('on_site'),
  timezone: z.string().max(50).nullish(),
  country: z.string().length(2).nullish(),
  managerId: z.string().uuid().nullish(),
  startDate: z.string().date(),
  userId: z.string().uuid().nullish(),
  skills: z.array(z.object({
    skillName: z.string().min(1).max(100),
    proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
  })).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

const EmployeeUpdateInput = EmployeeCreateInput.partial().extend({
  id: z.string().uuid(),
});
```

### Team

```typescript
/**
 * A team within the organization.
 *
 * Teams can be permanent (engineering squads) or cross-functional
 * (project teams, tiger teams) and may span departments.
 */
interface Team {
  /** Unique identifier (UUIDv7) */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** Team name */
  name: string;

  /** URL-safe slug */
  slug: string;

  /** Team description */
  description: string | null;

  /** Team type: permanent, cross_functional, project, virtual */
  type: TeamType;

  /** Team status: active, archived, forming */
  status: TeamStatus;

  /** Parent team ID for nested team structures */
  parentTeamId: string | null;

  /** Department this team belongs to (nullable for cross-functional) */
  departmentId: string | null;

  /** Team lead employee ID */
  leadId: string | null;

  /** Team lead profile (populated on demand) */
  lead?: EmployeeSummary | null;

  /** Team goals / charter (Markdown) */
  goals: string | null;

  /** Team avatar/icon URL */
  avatarUrl: string | null;

  /** Team members (populated on demand) */
  members?: TeamMember[];

  /** Member count (always available) */
  memberCount: number;

  /** Created timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

interface TeamMember {
  /** Employee ID */
  employeeId: string;

  /** Employee summary (populated on demand) */
  employee?: EmployeeSummary;

  /** Role within the team: lead, member, advisor */
  role: TeamMemberRole;

  /** Date member joined the team */
  joinedAt: string;

  /** Date member left (null if current) */
  leftAt: string | null;
}

type TeamType = 'permanent' | 'cross_functional' | 'project' | 'virtual';
type TeamStatus = 'active' | 'archived' | 'forming';
type TeamMemberRole = 'lead' | 'member' | 'advisor';
```

### OrgNode

```typescript
/**
 * A node in the organizational chart.
 *
 * OrgNodes form a tree structure representing the reporting hierarchy.
 * Each node links to an employee and tracks its position in the tree.
 */
interface OrgNode {
  /** Unique identifier (UUIDv7) */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** Linked employee ID */
  employeeId: string;

  /** Employee summary (populated on demand) */
  employee?: EmployeeSummary;

  /** Parent org node ID (null for root/CEO) */
  parentId: string | null;

  /** Materialized path for efficient tree queries (e.g., "/root/vp-eng/dir-eng/") */
  path: string;

  /** Depth in the tree (0 = root) */
  depth: number;

  /** Sort order among siblings */
  sortOrder: number;

  /** Number of direct reports */
  directReportCount: number;

  /** Total number of reports (recursive) */
  totalReportCount: number;

  /** Children nodes (populated on demand) */
  children?: OrgNode[];

  /** Created timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Complete org chart tree, rooted at one or more top-level nodes.
 */
interface OrgChart {
  /** Tenant ID */
  tenantId: string;

  /** Root nodes (typically one CEO, but supports multiple roots) */
  roots: OrgNode[];

  /** Total node count in the tree */
  totalNodes: number;

  /** Maximum depth */
  maxDepth: number;

  /** Average span of control */
  avgSpanOfControl: number;

  /** Generated at timestamp */
  generatedAt: string;
}

/**
 * Span of control metrics for a single manager.
 */
interface SpanOfControl {
  /** Manager employee ID */
  managerId: string;

  /** Direct report count */
  directReports: number;

  /** Total transitive report count */
  totalReports: number;

  /** Depth levels below this manager */
  levels: number;

  /** Recommendation: 'optimal' | 'too_narrow' | 'too_wide' */
  assessment: 'optimal' | 'too_narrow' | 'too_wide';
}
```

### SkillMatrix

```typescript
/**
 * A single skill assignment linking an employee to a skill with proficiency.
 */
interface SkillEntry {
  /** Unique identifier */
  id: string;

  /** Employee ID */
  employeeId: string;

  /** Normalized skill name (lowercase, trimmed) */
  skillName: string;

  /** Display name (preserves original casing) */
  skillDisplayName: string;

  /** Skill category (e.g., "Programming Languages", "Soft Skills") */
  category: string | null;

  /** Proficiency level */
  proficiency: SkillProficiency;

  /** Years of experience with this skill */
  yearsOfExperience: number | null;

  /** Whether this is a primary/featured skill */
  isPrimary: boolean;

  /** Verified by manager or peer */
  verified: boolean;

  /** When the skill was added */
  createdAt: string;

  /** Last proficiency update */
  updatedAt: string;
}

type SkillProficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Skills matrix aggregation for analysis.
 */
interface SkillMatrix {
  /** Scope: tenant, department, or team */
  scope: {
    type: 'tenant' | 'department' | 'team';
    id: string;
    name: string;
  };

  /** All unique skills in scope */
  skills: SkillSummary[];

  /** Skill distribution by category */
  categories: {
    category: string;
    skillCount: number;
    employeeCount: number;
  }[];

  /** Top skills by employee count */
  topSkills: {
    skillName: string;
    employeeCount: number;
    avgProficiency: number;
  }[];

  /** Skill gaps (required skills with low coverage) */
  gaps: SkillGap[];

  /** Generated at timestamp */
  generatedAt: string;
}

interface SkillSummary {
  skillName: string;
  category: string | null;
  employeeCount: number;
  proficiencyDistribution: Record<SkillProficiency, number>;
}

interface SkillGap {
  skillName: string;
  required: number;
  available: number;
  deficit: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

### ContactCard

```typescript
/**
 * Rendered contact card for quick-view overlays.
 */
interface ContactCard {
  /** Employee ID */
  employeeId: string;

  /** Display name (preferred or first+last) */
  displayName: string;

  /** Job title */
  title: string;

  /** Department name */
  department: string | null;

  /** Location name */
  location: string | null;

  /** Avatar URL */
  avatarUrl: string | null;

  /** Pronouns */
  pronouns: string | null;

  /** Timezone (IANA) */
  timezone: string | null;

  /** Current local time for the employee */
  localTime: string | null;

  /** Contact methods with action URLs */
  actions: ContactAction[];

  /** Availability status from integrated systems */
  availability: AvailabilityStatus;

  /** Manager summary */
  manager: EmployeeSummary | null;

  /** Quick stats */
  stats: {
    tenure: string;
    teamCount: number;
    skillCount: number;
  };
}

interface ContactAction {
  /** Action type */
  type: 'email' | 'phone' | 'slack' | 'teams' | 'chat' | 'video' | 'calendar';

  /** Display label */
  label: string;

  /** Action URI (mailto:, tel:, slack://, etc.) */
  uri: string;

  /** Whether this action is the primary for its type */
  isPrimary: boolean;
}

interface AvailabilityStatus {
  /** Overall status */
  status: 'available' | 'busy' | 'away' | 'dnd' | 'offline' | 'unknown';

  /** Status message (e.g., "In a meeting until 3pm") */
  statusMessage: string | null;

  /** Source of the status */
  source: 'calendar' | 'slack' | 'teams' | 'manual' | 'none';

  /** When the status was last updated */
  updatedAt: string;

  /** Estimated time when available again */
  availableAt: string | null;
}
```

### CustomField

```typescript
/**
 * Admin-defined custom profile field.
 *
 * Custom fields extend the employee profile with tenant-specific data
 * without requiring schema changes.
 */
interface CustomField {
  /** Unique identifier (UUIDv7) */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** Machine-readable field key (unique per tenant, snake_case) */
  key: string;

  /** Human-readable label */
  label: string;

  /** Field description / help text */
  description: string | null;

  /** Data type */
  type: CustomFieldType;

  /** Whether this field is required on profiles */
  required: boolean;

  /** Visibility: who can see this field */
  visibility: FieldVisibility;

  /** Allowed values for 'select' and 'multi_select' types */
  options: string[] | null;

  /** Default value (JSON-encoded) */
  defaultValue: string | null;

  /** Validation regex pattern (for 'text' type) */
  validationPattern: string | null;

  /** Validation error message */
  validationMessage: string | null;

  /** Display order in the profile form */
  sortOrder: number;

  /** Whether to include this field in search index */
  searchable: boolean;

  /** Whether this field is active */
  active: boolean;

  /** Created timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multi_select'
  | 'url'
  | 'email'
  | 'phone';

type FieldVisibility =
  | 'public'        // Visible to everyone in the tenant
  | 'authenticated' // Visible to logged-in users only
  | 'managers'      // Visible to the employee's manager chain
  | 'hr'            // Visible to HR admins only
  | 'self';         // Visible only to the employee themselves

/**
 * Instance of a custom field value for a specific employee.
 */
interface CustomFieldValue {
  /** Custom field definition ID */
  fieldId: string;

  /** Custom field key (denormalized) */
  fieldKey: string;

  /** Custom field label (denormalized) */
  fieldLabel: string;

  /** The value (stored as JSONB, typed by the field definition) */
  value: unknown;

  /** Last update timestamp */
  updatedAt: string;
}
```

### DirectorySearch

```typescript
/**
 * Search query parameters for the directory.
 */
interface DirectorySearchQuery {
  /** Free-text search query */
  query: string;

  /** Filters to narrow results */
  filters?: {
    departmentIds?: string[];
    locations?: string[];
    skills?: string[];
    titles?: string[];
    employmentTypes?: EmploymentType[];
    workModes?: WorkMode[];
    statuses?: EmployeeStatus[];
    managerId?: string;
    teamId?: string;
    country?: string;
    hasSkill?: string;
    customFields?: Record<string, unknown>;
  };

  /** Sort field and direction */
  sort?: {
    field: 'relevance' | 'name' | 'title' | 'department' | 'startDate' | 'location';
    direction: 'asc' | 'desc';
  };

  /** Pagination */
  pagination?: {
    page: number;
    pageSize: number;
  };

  /** Which related data to include */
  include?: {
    skills?: boolean;
    contacts?: boolean;
    manager?: boolean;
    teams?: boolean;
    customFields?: boolean;
  };
}

/**
 * Search results with facets and pagination metadata.
 */
interface DirectorySearchResult {
  /** Matching employees */
  items: (Employee & {
    /** Search relevance score (0-1) */
    relevanceScore: number;

    /** Highlighted matched fields */
    highlights: {
      field: string;
      snippet: string;
    }[];
  })[];

  /** Total matching count (before pagination) */
  totalCount: number;

  /** Pagination metadata */
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  /** Faceted counts for refinement */
  facets: {
    departments: { id: string; name: string; count: number }[];
    locations: { name: string; count: number }[];
    skills: { name: string; count: number }[];
    employmentTypes: { type: EmploymentType; count: number }[];
    workModes: { mode: WorkMode; count: number }[];
    countries: { code: string; name: string; count: number }[];
  };

  /** Query execution time in milliseconds */
  queryTimeMs: number;
}
```

### DirectoryService

```typescript
/**
 * Primary service for employee directory operations.
 */
interface DirectoryService {
  // ── Employee CRUD ─────────────────────────────────────────

  /**
   * Create a new employee profile.
   * Emits: employee.created
   */
  createEmployee(input: EmployeeCreateInput): Promise<Employee>;

  /**
   * Get an employee by ID with optional relations.
   * Respects field visibility rules for the requesting user.
   */
  getEmployee(
    id: string,
    include?: DirectorySearchQuery['include']
  ): Promise<Employee | null>;

  /**
   * Get an employee by email address.
   */
  getEmployeeByEmail(email: string): Promise<Employee | null>;

  /**
   * Get an employee by user ID (auth system link).
   */
  getEmployeeByUserId(userId: string): Promise<Employee | null>;

  /**
   * Update an employee profile.
   * Emits: employee.updated
   */
  updateEmployee(input: EmployeeUpdateInput): Promise<Employee>;

  /**
   * List employees with filtering and pagination.
   */
  listEmployees(query: DirectorySearchQuery): Promise<DirectorySearchResult>;

  // ── Manager / Reports ─────────────────────────────────────

  /**
   * Get direct reports for a manager.
   */
  getDirectReports(managerId: string): Promise<EmployeeSummary[]>;

  /**
   * Get the full reporting chain (upward) for an employee.
   */
  getReportingChain(employeeId: string): Promise<EmployeeSummary[]>;

  /**
   * Set or change an employee's manager.
   * Emits: org.restructured
   */
  setManager(employeeId: string, managerId: string | null): Promise<void>;

  // ── Bulk Operations ───────────────────────────────────────

  /**
   * Bulk import employees from structured data.
   * Returns import results with per-row status.
   */
  bulkImport(
    employees: EmployeeCreateInput[],
    options?: { dryRun?: boolean; upsert?: boolean }
  ): Promise<BulkImportResult>;

  /**
   * Export directory data to CSV or JSON.
   */
  exportDirectory(
    format: 'csv' | 'json',
    filters?: DirectorySearchQuery['filters']
  ): Promise<{ url: string; expiresAt: string }>;
}

interface BulkImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: {
    row: number;
    field: string;
    message: string;
  }[];
}
```

### OffboardingRequest

```typescript
/**
 * Offboarding workflow configuration.
 */
interface OffboardingRequest {
  /** Employee to offboard */
  employeeId: string;

  /** Last working day */
  endDate: string;

  /** Reason for departure */
  reason: OffboardingReason;

  /** Optional notes */
  notes: string | null;

  /** Whether to move to alumni directory */
  moveToAlumni: boolean;

  /** Data retention policy override */
  dataRetention?: {
    /** How long to retain the profile (ISO 8601 duration, e.g., "P2Y") */
    retainFor: string;

    /** Fields to redact immediately */
    redactFields: string[];
  };

  /** Access revocation triggers */
  revokeAccess: {
    /** Deactivate auth account */
    deactivateAuth: boolean;

    /** Remove from all teams */
    removeFromTeams: boolean;

    /** Reassign direct reports to this manager */
    reassignReportsTo: string | null;

    /** Notify IT for equipment return */
    notifyIT: boolean;
  };
}

type OffboardingReason =
  | 'resignation'
  | 'termination'
  | 'layoff'
  | 'retirement'
  | 'contract_end'
  | 'mutual_agreement'
  | 'other';

/**
 * Offboarding execution result.
 */
interface OffboardingResult {
  /** Employee ID */
  employeeId: string;

  /** New status after offboarding */
  status: EmployeeStatus;

  /** Steps executed */
  steps: {
    step: string;
    status: 'completed' | 'failed' | 'skipped';
    message: string;
  }[];

  /** Whether the profile was moved to alumni */
  movedToAlumni: boolean;

  /** Access revocation status */
  accessRevoked: boolean;

  /** Data retention scheduled deletion date */
  scheduledDeletionAt: string | null;
}
```

### HRISSyncConfig

```typescript
/**
 * Configuration for syncing directory data from an external HRIS.
 */
interface HRISSyncConfig {
  /** Unique identifier */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** HRIS provider type */
  provider: HRISProvider;

  /** Connection configuration (encrypted) */
  connection: {
    /** API base URL */
    baseUrl: string;

    /** Authentication type */
    authType: 'oauth2' | 'api_key' | 'basic';

    /** OAuth2 credentials (encrypted at rest) */
    oauth2?: {
      clientId: string;
      clientSecret: string;
      tokenUrl: string;
      scopes: string[];
    };

    /** API key (encrypted at rest) */
    apiKey?: string;
  };

  /** Field mapping from HRIS fields to directory fields */
  fieldMapping: Record<string, string>;

  /** Sync schedule (cron expression) */
  schedule: string;

  /** Sync direction */
  direction: 'pull' | 'push' | 'bidirectional';

  /** Conflict resolution strategy */
  conflictResolution: 'hris_wins' | 'directory_wins' | 'newest_wins' | 'manual';

  /** Whether sync is active */
  active: boolean;

  /** Last sync info */
  lastSync: {
    startedAt: string;
    completedAt: string | null;
    status: 'success' | 'partial' | 'failed';
    recordsProcessed: number;
    recordsCreated: number;
    recordsUpdated: number;
    errors: number;
  } | null;
}

type HRISProvider =
  | 'workday'
  | 'bamboohr'
  | 'adp'
  | 'rippling'
  | 'gusto'
  | 'namely'
  | 'personio'
  | 'hibob'
  | 'custom_api';
```

### DirectoryAnalytics

```typescript
/**
 * Directory analytics snapshot.
 */
interface DirectoryAnalytics {
  /** Tenant ID */
  tenantId: string;

  /** Snapshot timestamp */
  generatedAt: string;

  /** Period for trend data */
  period: {
    start: string;
    end: string;
  };

  /** Headcount metrics */
  headcount: {
    total: number;
    active: number;
    onLeave: number;
    offboarded: number;
    byDepartment: { department: string; count: number }[];
    byLocation: { location: string; count: number }[];
    byEmploymentType: { type: EmploymentType; count: number }[];
    byWorkMode: { mode: WorkMode; count: number }[];
    byCountry: { country: string; count: number }[];
  };

  /** Growth trends */
  growth: {
    netGrowth: number;
    hires: number;
    departures: number;
    growthRate: number;
    monthlyTrend: {
      month: string;
      hires: number;
      departures: number;
      net: number;
      total: number;
    }[];
  };

  /** Tenure distribution */
  tenure: {
    averageMonths: number;
    medianMonths: number;
    distribution: {
      range: string;
      count: number;
      percentage: number;
    }[];
  };

  /** Skills coverage */
  skills: {
    totalUniqueSkills: number;
    avgSkillsPerEmployee: number;
    topSkills: { skill: string; count: number }[];
    skillGaps: SkillGap[];
  };

  /** Org structure metrics */
  orgStructure: {
    avgSpanOfControl: number;
    maxDepth: number;
    managersCount: number;
    individualContributorsCount: number;
  };
}
```

### DirectoryEvent

```typescript
/**
 * Domain events emitted by the directory module.
 */
type DirectoryEvent =
  | {
      type: 'employee.created';
      payload: {
        employeeId: string;
        tenantId: string;
        email: string;
        name: string;
      };
    }
  | {
      type: 'employee.updated';
      payload: {
        employeeId: string;
        tenantId: string;
        changedFields: string[];
        previousValues: Record<string, unknown>;
      };
    }
  | {
      type: 'employee.deactivated';
      payload: {
        employeeId: string;
        tenantId: string;
        reason: OffboardingReason;
        endDate: string;
      };
    }
  | {
      type: 'employee.reactivated';
      payload: {
        employeeId: string;
        tenantId: string;
        newStartDate: string;
      };
    }
  | {
      type: 'org.restructured';
      payload: {
        tenantId: string;
        changes: {
          employeeId: string;
          previousManagerId: string | null;
          newManagerId: string | null;
        }[];
      };
    }
  | {
      type: 'team.created';
      payload: {
        teamId: string;
        tenantId: string;
        name: string;
        leadId: string | null;
      };
    }
  | {
      type: 'team.member.added';
      payload: {
        teamId: string;
        employeeId: string;
        tenantId: string;
        role: TeamMemberRole;
      };
    }
  | {
      type: 'team.member.removed';
      payload: {
        teamId: string;
        employeeId: string;
        tenantId: string;
      };
    }
  | {
      type: 'skill.added';
      payload: {
        employeeId: string;
        tenantId: string;
        skillName: string;
        proficiency: SkillProficiency;
      };
    }
  | {
      type: 'skill.removed';
      payload: {
        employeeId: string;
        tenantId: string;
        skillName: string;
      };
    }
  | {
      type: 'directory.synced';
      payload: {
        tenantId: string;
        provider: HRISProvider;
        recordsProcessed: number;
        recordsCreated: number;
        recordsUpdated: number;
        errors: number;
      };
    }
  | {
      type: 'custom_field.created';
      payload: {
        fieldId: string;
        tenantId: string;
        key: string;
        type: CustomFieldType;
      };
    };
```

---

## Database Schemas

### employees

The primary table storing employee/member profiles.

```typescript
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  date,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    userId: uuid('user_id').references(() => users.id),

    // Identity
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    preferredName: varchar('preferred_name', { length: 100 }),
    pronouns: varchar('pronouns', { length: 50 }),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),

    // Role
    title: varchar('title', { length: 200 }).notNull(),
    departmentId: uuid('department_id').references(() => departments.id),
    departmentName: varchar('department_name', { length: 200 }),
    division: varchar('division', { length: 200 }),
    employeeNumber: varchar('employee_number', { length: 50 }),
    employmentType: varchar('employment_type', { length: 20 })
      .notNull()
      .default('full_time'),
    status: varchar('status', { length: 20 }).notNull().default('active'),

    // Location
    location: varchar('location', { length: 200 }),
    officeId: uuid('office_id'),
    workMode: varchar('work_mode', { length: 20 }).notNull().default('on_site'),
    timezone: varchar('timezone', { length: 50 }),
    country: varchar('country', { length: 2 }),

    // Hierarchy
    managerId: uuid('manager_id').references((): AnyPgColumn => employees.id),

    // Contact
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),

    // Dates
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),

    // Metadata
    searchVector: text('search_vector'), // tsvector stored as text, managed via trigger
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('employees_tenant_idx').on(table.tenantId),
    tenantEmailIdx: uniqueIndex('employees_tenant_email_idx').on(
      table.tenantId,
      table.email
    ),
    tenantStatusIdx: index('employees_tenant_status_idx').on(
      table.tenantId,
      table.status
    ),
    tenantDeptIdx: index('employees_tenant_dept_idx').on(
      table.tenantId,
      table.departmentId
    ),
    tenantManagerIdx: index('employees_tenant_manager_idx').on(
      table.tenantId,
      table.managerId
    ),
    tenantLocationIdx: index('employees_tenant_location_idx').on(
      table.tenantId,
      table.location
    ),
    nameTrigramIdx: index('employees_name_trgm_idx')
      .on(table.firstName, table.lastName)
      .using('gin'),
    tenantNumberIdx: uniqueIndex('employees_tenant_number_idx').on(
      table.tenantId,
      table.employeeNumber
    ),
  })
);
```

### employee_skills

```typescript
export const employeeSkills = pgTable(
  'employee_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    skillName: varchar('skill_name', { length: 100 }).notNull(),
    skillDisplayName: varchar('skill_display_name', { length: 100 }).notNull(),
    category: varchar('category', { length: 100 }),
    proficiency: varchar('proficiency', { length: 20 })
      .notNull()
      .default('intermediate'),
    yearsOfExperience: real('years_of_experience'),
    isPrimary: boolean('is_primary').notNull().default(false),
    verified: boolean('verified').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('employee_skills_tenant_idx').on(table.tenantId),
    employeeIdx: index('employee_skills_employee_idx').on(table.employeeId),
    skillNameIdx: index('employee_skills_name_idx').on(
      table.tenantId,
      table.skillName
    ),
    uniqueSkill: uniqueIndex('employee_skills_unique_idx').on(
      table.employeeId,
      table.skillName
    ),
    skillTrigramIdx: index('employee_skills_trgm_idx')
      .on(table.skillDisplayName)
      .using('gin'),
  })
);
```

### teams

```typescript
export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 200 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 30 }).notNull().default('permanent'),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    parentTeamId: uuid('parent_team_id').references((): AnyPgColumn => teams.id),
    departmentId: uuid('department_id').references(() => departments.id),
    leadId: uuid('lead_id').references(() => employees.id),
    goals: text('goals'),
    avatarUrl: text('avatar_url'),
    memberCount: integer('member_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('teams_tenant_idx').on(table.tenantId),
    tenantSlugIdx: uniqueIndex('teams_tenant_slug_idx').on(
      table.tenantId,
      table.slug
    ),
    tenantStatusIdx: index('teams_tenant_status_idx').on(
      table.tenantId,
      table.status
    ),
    tenantDeptIdx: index('teams_tenant_dept_idx').on(
      table.tenantId,
      table.departmentId
    ),
  })
);
```

### team_members

```typescript
export const teamMembers = pgTable(
  'team_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull().default('member'),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
    leftAt: timestamp('left_at'),
  },
  (table) => ({
    tenantIdx: index('team_members_tenant_idx').on(table.tenantId),
    teamIdx: index('team_members_team_idx').on(table.teamId),
    employeeIdx: index('team_members_employee_idx').on(table.employeeId),
    uniqueMember: uniqueIndex('team_members_unique_idx').on(
      table.teamId,
      table.employeeId
    ),
  })
);
```

### org_nodes

```typescript
export const orgNodes = pgTable(
  'org_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => orgNodes.id),
    path: text('path').notNull(), // Materialized path: "/root-id/parent-id/self-id/"
    depth: integer('depth').notNull().default(0),
    sortOrder: integer('sort_order').notNull().default(0),
    directReportCount: integer('direct_report_count').notNull().default(0),
    totalReportCount: integer('total_report_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('org_nodes_tenant_idx').on(table.tenantId),
    employeeIdx: uniqueIndex('org_nodes_employee_idx').on(
      table.tenantId,
      table.employeeId
    ),
    parentIdx: index('org_nodes_parent_idx').on(table.parentId),
    pathIdx: index('org_nodes_path_idx').on(table.path),
    depthIdx: index('org_nodes_depth_idx').on(table.tenantId, table.depth),
  })
);
```

### custom_fields

```typescript
export const customFields = pgTable(
  'custom_fields',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    key: varchar('key', { length: 100 }).notNull(),
    label: varchar('label', { length: 200 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 30 }).notNull(),
    required: boolean('required').notNull().default(false),
    visibility: varchar('visibility', { length: 20 })
      .notNull()
      .default('public'),
    options: jsonb('options'), // For select/multi_select types
    defaultValue: jsonb('default_value'),
    validationPattern: text('validation_pattern'),
    validationMessage: text('validation_message'),
    sortOrder: integer('sort_order').notNull().default(0),
    searchable: boolean('searchable').notNull().default(false),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('custom_fields_tenant_idx').on(table.tenantId),
    tenantKeyIdx: uniqueIndex('custom_fields_tenant_key_idx').on(
      table.tenantId,
      table.key
    ),
    tenantActiveIdx: index('custom_fields_tenant_active_idx').on(
      table.tenantId,
      table.active
    ),
  })
);
```

### custom_field_values

```typescript
export const customFieldValues = pgTable(
  'custom_field_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    fieldId: uuid('field_id')
      .notNull()
      .references(() => customFields.id, { onDelete: 'cascade' }),
    value: jsonb('value'), // Stores any type, validated against field definition
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('custom_field_values_tenant_idx').on(table.tenantId),
    employeeIdx: index('custom_field_values_employee_idx').on(table.employeeId),
    fieldIdx: index('custom_field_values_field_idx').on(table.fieldId),
    uniqueValue: uniqueIndex('custom_field_values_unique_idx').on(
      table.employeeId,
      table.fieldId
    ),
  })
);
```

### employee_contacts

```typescript
export const employeeContacts = pgTable(
  'employee_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 30 }).notNull(), // email, phone, slack, teams, etc.
    label: varchar('label', { length: 100 }).notNull(), // "Work Email", "Personal Phone"
    value: varchar('value', { length: 500 }).notNull(), // The actual address/number/handle
    uri: text('uri'), // Action URI (mailto:, tel:, slack://)
    isPrimary: boolean('is_primary').notNull().default(false),
    visibility: varchar('visibility', { length: 20 })
      .notNull()
      .default('public'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('employee_contacts_tenant_idx').on(table.tenantId),
    employeeIdx: index('employee_contacts_employee_idx').on(table.employeeId),
    typeIdx: index('employee_contacts_type_idx').on(
      table.tenantId,
      table.type
    ),
  })
);
```

### directory_activities

```typescript
export const directoryActivities = pgTable(
  'directory_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    actorId: uuid('actor_id').references(() => employees.id),
    targetId: uuid('target_id').references(() => employees.id),
    action: varchar('action', { length: 50 }).notNull(),
    entityType: varchar('entity_type', { length: 30 }).notNull(), // employee, team, org_node, skill, custom_field
    entityId: uuid('entity_id').notNull(),
    changes: jsonb('changes'), // { field: { old: value, new: value } }
    metadata: jsonb('metadata'), // Additional context
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('directory_activities_tenant_idx').on(table.tenantId),
    actorIdx: index('directory_activities_actor_idx').on(table.actorId),
    targetIdx: index('directory_activities_target_idx').on(table.targetId),
    entityIdx: index('directory_activities_entity_idx').on(
      table.entityType,
      table.entityId
    ),
    createdAtIdx: index('directory_activities_created_idx').on(
      table.tenantId,
      table.createdAt
    ),
  })
);
```

### Database Migrations

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Trigram index for fuzzy name search
CREATE INDEX employees_name_trgm_gin_idx
  ON employees
  USING gin (
    (first_name || ' ' || last_name) gin_trgm_ops
  );

-- Full-text search vector (auto-maintained by trigger)
ALTER TABLE employees ADD COLUMN search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(first_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(last_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(preferred_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(title, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(department_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'D')
  ) STORED;

CREATE INDEX employees_search_tsv_idx ON employees USING gin (search_tsv);

-- RLS policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_activities ENABLE ROW LEVEL SECURITY;

-- Standard tenant isolation policy (applied to all tables)
CREATE POLICY "tenant_isolation" ON employees
  USING (tenant_id = (current_setting('app.tenant_id'))::uuid)
  WITH CHECK (tenant_id = (current_setting('app.tenant_id'))::uuid);

-- Soft-delete filter
CREATE POLICY "soft_delete_filter" ON employees
  FOR SELECT USING (deleted_at IS NULL);

-- Trigger to update member_count on team_members changes
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE teams SET member_count = (
      SELECT COUNT(*) FROM team_members
      WHERE team_id = NEW.team_id AND left_at IS NULL
    ) WHERE id = NEW.team_id;
  END IF;
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE teams SET member_count = (
      SELECT COUNT(*) FROM team_members
      WHERE team_id = OLD.team_id AND left_at IS NULL
    ) WHERE id = OLD.team_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_member_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_team_member_count();

-- Trigger to update org_node report counts
CREATE OR REPLACE FUNCTION update_org_report_counts()
RETURNS TRIGGER AS $$
DECLARE
  current_id uuid;
BEGIN
  -- Update direct count for parent
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE org_nodes SET direct_report_count = (
      SELECT COUNT(*) FROM org_nodes WHERE parent_id = NEW.parent_id
    ) WHERE id = NEW.parent_id;
  END IF;

  -- Walk up the tree to update total counts
  current_id := NEW.parent_id;
  WHILE current_id IS NOT NULL LOOP
    UPDATE org_nodes SET total_report_count = (
      SELECT COUNT(*) FROM org_nodes
      WHERE path LIKE (SELECT path FROM org_nodes WHERE id = current_id) || '%'
        AND id != current_id
    ) WHERE id = current_id;

    SELECT parent_id INTO current_id FROM org_nodes WHERE id = current_id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER org_report_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON org_nodes
  FOR EACH ROW EXECUTE FUNCTION update_org_report_counts();

-- Updated_at auto-update trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER employee_skills_updated_at BEFORE UPDATE ON employee_skills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER org_nodes_updated_at BEFORE UPDATE ON org_nodes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER custom_fields_updated_at BEFORE UPDATE ON custom_fields
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER custom_field_values_updated_at BEFORE UPDATE ON custom_field_values
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER employee_contacts_updated_at BEFORE UPDATE ON employee_contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## Code Examples

### Example 1: Creating an Employee Profile

```typescript
import { DirectoryService } from '@mcv/people/directory';

const directoryService = new DirectoryService({ db, tenantId, eventBus });

// Create a new employee
const employee = await directoryService.createEmployee({
  firstName: 'Sarah',
  lastName: 'Chen',
  preferredName: 'Sarah',
  pronouns: 'she/her',
  title: 'Senior Software Engineer',
  departmentId: 'dept-engineering-uuid',
  employmentType: 'full_time',
  email: 'sarah.chen@acme.com',
  phone: '+14155551234',
  location: 'San Francisco',
  workMode: 'hybrid',
  timezone: 'America/Los_Angeles',
  country: 'US',
  managerId: 'manager-uuid',
  startDate: '2024-03-15',
  skills: [
    { skillName: 'TypeScript', proficiency: 'expert' },
    { skillName: 'React', proficiency: 'advanced' },
    { skillName: 'PostgreSQL', proficiency: 'advanced' },
    { skillName: 'System Design', proficiency: 'intermediate' },
  ],
  customFields: {
    github_username: 'sarahchen',
    tshirt_size: 'M',
    dietary_restrictions: 'vegetarian',
  },
});

console.log(employee.id); // "01910f...UUIDv7"
// Event emitted: { type: 'employee.created', payload: { ... } }
```

### Example 2: Searching the Directory

```typescript
import { DirectorySearchService } from '@mcv/people/directory';

const searchService = new DirectorySearchService({ db, tenantId });

// Full-text search with filters and facets
const results = await searchService.search({
  query: 'react engineer',
  filters: {
    statuses: ['active'],
    workModes: ['remote', 'hybrid'],
    locations: ['San Francisco', 'New York'],
  },
  sort: {
    field: 'relevance',
    direction: 'desc',
  },
  pagination: {
    page: 1,
    pageSize: 20,
  },
  include: {
    skills: true,
    manager: true,
  },
});

console.log(`Found ${results.totalCount} employees in ${results.queryTimeMs}ms`);

// Process results
for (const item of results.items) {
  console.log(`${item.firstName} ${item.lastName} — ${item.title}`);
  console.log(`  Relevance: ${(item.relevanceScore * 100).toFixed(1)}%`);
  for (const highlight of item.highlights) {
    console.log(`  Match in ${highlight.field}: ${highlight.snippet}`);
  }
}

// Use facets for filter refinement UI
console.log('Departments:', results.facets.departments);
// [{ id: "...", name: "Engineering", count: 42 }, ...]
console.log('Skills:', results.facets.skills);
// [{ name: "React", count: 35 }, { name: "TypeScript", count: 28 }, ...]
```

### Example 3: Building and Rendering an Org Chart

```typescript
import { OrgChartService, buildOrgTree } from '@mcv/people/directory';

const orgChartService = new OrgChartService({ db, tenantId });

// Get the full org chart
const orgChart = await orgChartService.getFullChart();

console.log(`Org depth: ${orgChart.maxDepth}`);
console.log(`Total nodes: ${orgChart.totalNodes}`);
console.log(`Avg span of control: ${orgChart.avgSpanOfControl.toFixed(1)}`);

// Get subtree rooted at a specific manager
const subtree = await orgChartService.getSubtree('manager-uuid', {
  maxDepth: 3,
  includeEmployee: true,
});

// Navigate the tree
function printTree(node: OrgNode, indent = 0) {
  const prefix = '  '.repeat(indent);
  const emp = node.employee!;
  console.log(`${prefix}${emp.firstName} ${emp.lastName} — ${emp.title}`);
  console.log(`${prefix}  Direct: ${node.directReportCount}, Total: ${node.totalReportCount}`);
  for (const child of node.children ?? []) {
    printTree(child, indent + 1);
  }
}

for (const root of orgChart.roots) {
  printTree(root);
}

// Drag-and-drop reorg: move employee to a new manager
await orgChartService.moveNode('employee-uuid', {
  newParentId: 'new-manager-uuid',
  reason: 'Team restructuring Q2 2025',
});
// Event emitted: { type: 'org.restructured', payload: { ... } }

// Get span of control analysis
const span = await orgChartService.getSpanOfControl('manager-uuid');
console.log(`Assessment: ${span.assessment}`);
// "too_wide" if directReports > 10, "too_narrow" if < 3
```

### Example 4: Managing Teams

```typescript
import { TeamService } from '@mcv/people/directory';

const teamService = new TeamService({ db, tenantId, eventBus });

// Create a cross-functional team
const team = await teamService.createTeam({
  name: 'Project Phoenix',
  slug: 'project-phoenix',
  description: 'Cross-functional team for the Phoenix initiative',
  type: 'cross_functional',
  leadId: 'sarah-uuid',
  goals: `## Goals\n- Launch MVP by Q3\n- Achieve 95% test coverage\n- Zero P1 bugs`,
});

// Add members
await teamService.addMember(team.id, 'alice-uuid', 'member');
await teamService.addMember(team.id, 'bob-uuid', 'member');
await teamService.addMember(team.id, 'carol-uuid', 'advisor');

// Get team with full roster
const fullTeam = await teamService.getTeam(team.id, {
  includeMembers: true,
  includeLeadProfile: true,
});

console.log(`Team: ${fullTeam.name} (${fullTeam.memberCount} members)`);
for (const member of fullTeam.members!) {
  console.log(`  ${member.employee!.firstName} — ${member.role}`);
}

// List all teams for a department
const deptTeams = await teamService.listTeams({
  departmentId: 'dept-engineering-uuid',
  status: 'active',
  includeMembers: true,
});

// Get all teams an employee belongs to
const employeeTeams = await teamService.getEmployeeTeams('sarah-uuid');
console.log(`Sarah is in ${employeeTeams.length} teams`);

// Remove a member (sets leftAt, doesn't hard delete)
await teamService.removeMember(team.id, 'bob-uuid');

// Archive a completed project team
await teamService.updateTeam(team.id, { status: 'archived' });
```

### Example 5: Skills Matrix and Gap Analysis

```typescript
import { SkillMatrixService } from '@mcv/people/directory';

const skillService = new SkillMatrixService({ db, tenantId });

// Add skills to an employee
await skillService.addSkill('sarah-uuid', {
  skillName: 'Kubernetes',
  proficiency: 'intermediate',
  category: 'Infrastructure',
  yearsOfExperience: 2,
});

// Update proficiency
await skillService.updateProficiency('sarah-uuid', 'TypeScript', 'expert');

// Verify a skill (manager action)
await skillService.verifySkill('sarah-uuid', 'TypeScript', {
  verifiedBy: 'manager-uuid',
});

// Find experts in a skill
const experts = await skillService.findExperts('TypeScript', {
  minProficiency: 'advanced',
  limit: 10,
});
console.log(`Found ${experts.length} TypeScript experts`);

// Get skills matrix for the engineering department
const matrix = await skillService.getMatrix({
  type: 'department',
  id: 'dept-engineering-uuid',
});

console.log(`Unique skills: ${matrix.skills.length}`);
console.log('Top skills:');
for (const skill of matrix.topSkills.slice(0, 5)) {
  console.log(`  ${skill.skillName}: ${skill.employeeCount} people, avg ${skill.avgProficiency.toFixed(1)}`);
}

// Define required skills and analyze gaps
const gaps = await skillService.analyzeGaps({
  scope: { type: 'department', id: 'dept-engineering-uuid' },
  requirements: [
    { skillName: 'TypeScript', required: 20 },
    { skillName: 'Kubernetes', required: 10 },
    { skillName: 'Rust', required: 5 },
    { skillName: 'Machine Learning', required: 8 },
  ],
});

for (const gap of gaps) {
  if (gap.deficit > 0) {
    console.log(`⚠️  ${gap.skillName}: need ${gap.required}, have ${gap.available} (${gap.severity})`);
  } else {
    console.log(`✅  ${gap.skillName}: covered (${gap.available}/${gap.required})`);
  }
}
```

### Example 6: Custom Fields

```typescript
import { CustomFieldService } from '@mcv/people/directory';

const customFieldService = new CustomFieldService({ db, tenantId });

// Define custom fields (admin action)
const githubField = await customFieldService.createField({
  key: 'github_username',
  label: 'GitHub Username',
  description: 'Employee GitHub handle for code contributions',
  type: 'text',
  required: false,
  visibility: 'public',
  validationPattern: '^[a-zA-Z0-9-]+$',
  validationMessage: 'GitHub username can only contain letters, numbers, and hyphens',
  searchable: true,
  sortOrder: 10,
});

const tshirtField = await customFieldService.createField({
  key: 'tshirt_size',
  label: 'T-Shirt Size',
  type: 'select',
  options: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  required: false,
  visibility: 'hr',
  sortOrder: 20,
});

const emergencyContact = await customFieldService.createField({
  key: 'emergency_contact',
  label: 'Emergency Contact',
  type: 'textarea',
  required: true,
  visibility: 'self', // Only visible to the employee
  sortOrder: 30,
});

// Set custom field values for an employee
await customFieldService.setValue('sarah-uuid', 'github_username', 'sarahchen');
await customFieldService.setValue('sarah-uuid', 'tshirt_size', 'M');
await customFieldService.setValue('sarah-uuid', 'emergency_contact', 'Jane Chen, +14155559876');

// Get all custom fields for a tenant
const fields = await customFieldService.listFields({ active: true });
console.log(`${fields.length} custom fields defined`);

// Get custom field values for an employee (respects visibility)
const values = await customFieldService.getValues('sarah-uuid', {
  viewerRole: 'manager', // Only shows fields visible to managers
});
console.log(values.github_username); // "sarahchen"
console.log(values.tshirt_size); // undefined (HR-only visibility)

// Validate a value against field definition
const validation = await customFieldService.validateValue(
  'github_username',
  'invalid username!'
);
console.log(validation.valid); // false
console.log(validation.error); // "GitHub username can only contain letters, numbers, and hyphens"
```

### Example 7: Offboarding an Employee

```typescript
import { OffboardingService } from '@mcv/people/directory';

const offboardingService = new OffboardingService({
  db,
  tenantId,
  eventBus,
  authService,
  teamService,
  orgChartService,
});

// Execute offboarding
const result = await offboardingService.offboard({
  employeeId: 'departing-employee-uuid',
  endDate: '2025-04-30',
  reason: 'resignation',
  notes: 'Moving to another company. Great contributor — keep in alumni network.',
  moveToAlumni: true,
  dataRetention: {
    retainFor: 'P2Y', // Retain profile for 2 years
    redactFields: ['phone', 'emergency_contact'], // Redact immediately
  },
  revokeAccess: {
    deactivateAuth: true,
    removeFromTeams: true,
    reassignReportsTo: 'new-manager-uuid',
    notifyIT: true,
  },
});

// Check result
console.log(`Offboarding status: ${result.status}`);
for (const step of result.steps) {
  const icon = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⏭️';
  console.log(`${icon} ${step.step}: ${step.message}`);
}
// ✅ profile_deactivated: Employee status set to 'offboarded'
// ✅ auth_deactivated: Auth account disabled
// ✅ teams_removed: Removed from 3 teams
// ✅ reports_reassigned: 5 direct reports reassigned to Jane Smith
// ✅ it_notified: IT team notified for equipment return
// ✅ alumni_created: Moved to alumni directory
// ✅ fields_redacted: Redacted 2 sensitive fields
// ✅ retention_scheduled: Scheduled deletion for 2027-04-30

// Events emitted:
// - employee.deactivated
// - org.restructured (for report reassignment)
// - team.member.removed (×3)

// Access alumni directory
const alumni = await offboardingService.listAlumni({
  pagination: { page: 1, pageSize: 20 },
});
console.log(`${alumni.totalCount} alumni in directory`);

// Rehire an alumnus
await offboardingService.reactivate('departing-employee-uuid', {
  newStartDate: '2026-01-15',
  newTitle: 'Staff Engineer',
  newManagerId: 'manager-uuid',
});
// Event emitted: employee.reactivated
```

### Example 8: HRIS Sync and Analytics

```typescript
import { DirectorySyncService, DirectoryAnalyticsService } from '@mcv/people/directory';

// ── HRIS Sync ──────────────────────────────────────────────────

const syncService = new DirectorySyncService({ db, tenantId, eventBus });

// Configure BambooHR integration
const syncConfig = await syncService.configureSyncSource({
  provider: 'bamboohr',
  connection: {
    baseUrl: 'https://api.bamboohr.com/api/gateway.php/acme',
    authType: 'api_key',
    apiKey: process.env.BAMBOOHR_API_KEY!,
  },
  fieldMapping: {
    'firstName': 'first_name',
    'lastName': 'last_name',
    'jobTitle': 'title',
    'department': 'department_name',
    'location': 'location',
    'workEmail': 'email',
    'workPhone': 'phone',
    'hireDate': 'start_date',
    'terminationDate': 'end_date',
    'supervisorEId': 'manager_employee_number',
  },
  schedule: '0 2 * * *', // Daily at 2 AM
  direction: 'pull',
  conflictResolution: 'hris_wins',
  active: true,
});

// Run manual sync
const syncResult = await syncService.runSync(syncConfig.id);
console.log(`Sync completed: ${syncResult.recordsProcessed} processed`);
console.log(`  Created: ${syncResult.recordsCreated}`);
console.log(`  Updated: ${syncResult.recordsUpdated}`);
console.log(`  Errors: ${syncResult.errors}`);

// ── Analytics ──────────────────────────────────────────────────

const analyticsService = new DirectoryAnalyticsService({ db, tenantId });

// Generate directory analytics
const analytics = await analyticsService.generate({
  period: {
    start: '2024-01-01',
    end: '2024-12-31',
  },
});

console.log(`Total headcount: ${analytics.headcount.total}`);
console.log(`Active: ${analytics.headcount.active}`);
console.log(`Growth rate: ${(analytics.growth.growthRate * 100).toFixed(1)}%`);

// Headcount by department
for (const dept of analytics.headcount.byDepartment) {
  console.log(`  ${dept.department}: ${dept.count}`);
}

// Tenure distribution
console.log(`Average tenure: ${(analytics.tenure.averageMonths / 12).toFixed(1)} years`);
for (const bucket of analytics.tenure.distribution) {
  const bar = '█'.repeat(Math.round(bucket.percentage / 2));
  console.log(`  ${bucket.range}: ${bar} ${bucket.percentage.toFixed(1)}%`);
}

// Skills coverage
console.log(`Unique skills: ${analytics.skills.totalUniqueSkills}`);
console.log(`Avg skills/employee: ${analytics.skills.avgSkillsPerEmployee.toFixed(1)}`);
if (analytics.skills.skillGaps.length > 0) {
  console.log('Critical skill gaps:');
  for (const gap of analytics.skills.skillGaps.filter(g => g.severity === 'critical')) {
    console.log(`  ⚠️ ${gap.skillName}: need ${gap.required}, have ${gap.available}`);
  }
}

// Org structure
console.log(`Avg span of control: ${analytics.orgStructure.avgSpanOfControl.toFixed(1)}`);
console.log(`Max org depth: ${analytics.orgStructure.maxDepth}`);
console.log(
  `Managers: ${analytics.orgStructure.managersCount}, ` +
  `ICs: ${analytics.orgStructure.individualContributorsCount}`
);

// Monthly growth trend
for (const month of analytics.growth.monthlyTrend) {
  console.log(
    `  ${month.month}: +${month.hires} -${month.departures} = ${month.net > 0 ? '+' : ''}${month.net} (total: ${month.total})`
  );
}
```

---

## Error Codes

All errors follow the MCV.ONE error format with the `DIRECTORY_` prefix.

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `DIRECTORY_EMPLOYEE_NOT_FOUND` | 404 | Employee ID does not exist or is not accessible | Verify the employee ID and tenant context |
| `DIRECTORY_EMPLOYEE_DUPLICATE_EMAIL` | 409 | Email address already exists for another employee in this tenant | Use a unique email or update the existing profile |
| `DIRECTORY_EMPLOYEE_DUPLICATE_NUMBER` | 409 | Employee number already exists for this tenant | Assign a unique employee number |
| `DIRECTORY_EMPLOYEE_SELF_MANAGER` | 400 | Cannot set an employee as their own manager | Provide a different manager ID |
| `DIRECTORY_EMPLOYEE_CIRCULAR_REPORTING` | 400 | Setting this manager would create a circular reporting chain | Choose a manager outside the employee's subtree |
| `DIRECTORY_EMPLOYEE_INACTIVE` | 403 | Cannot perform this operation on an inactive/offboarded employee | Reactivate the employee first or operate on an active employee |
| `DIRECTORY_TEAM_NOT_FOUND` | 404 | Team ID does not exist | Verify the team ID |
| `DIRECTORY_TEAM_DUPLICATE_SLUG` | 409 | Team slug already exists in this tenant | Choose a unique slug |
| `DIRECTORY_TEAM_MEMBER_EXISTS` | 409 | Employee is already a member of this team | Remove existing membership first or skip |
| `DIRECTORY_TEAM_MEMBER_NOT_FOUND` | 404 | Employee is not a member of this team | Verify employee and team IDs |
| `DIRECTORY_ORG_NODE_NOT_FOUND` | 404 | Org node does not exist for this employee | Ensure the employee has an org chart entry |
| `DIRECTORY_ORG_MAX_DEPTH_EXCEEDED` | 400 | Moving this node would exceed the maximum allowed org depth | Reorganize to reduce nesting |
| `DIRECTORY_ORG_INVALID_MOVE` | 400 | Cannot move an org node to be its own descendant | Choose a target outside the node's subtree |
| `DIRECTORY_SKILL_DUPLICATE` | 409 | Employee already has this skill assigned | Update proficiency instead of adding |
| `DIRECTORY_SKILL_NOT_FOUND` | 404 | Skill assignment not found for this employee | Verify skill name and employee ID |
| `DIRECTORY_SKILL_INVALID_PROFICIENCY` | 400 | Invalid proficiency level provided | Use: beginner, intermediate, advanced, expert |
| `DIRECTORY_CUSTOM_FIELD_NOT_FOUND` | 404 | Custom field definition does not exist | Verify the field key or ID |
| `DIRECTORY_CUSTOM_FIELD_DUPLICATE_KEY` | 409 | Custom field key already exists for this tenant | Use a unique key |
| `DIRECTORY_CUSTOM_FIELD_VALIDATION` | 400 | Custom field value failed validation | Check value against field type and constraints |
| `DIRECTORY_CUSTOM_FIELD_REQUIRED` | 400 | A required custom field is missing a value | Provide a value for all required fields |
| `DIRECTORY_CUSTOM_FIELD_VISIBILITY` | 403 | Requesting user does not have permission to view this field | Ensure the viewer has sufficient role for the field's visibility level |
| `DIRECTORY_SEARCH_INVALID_QUERY` | 400 | Search query is malformed or exceeds limits | Simplify the query (max 500 chars, valid filter values) |
| `DIRECTORY_SEARCH_TIMEOUT` | 504 | Search query exceeded the time limit | Narrow filters or simplify the query |
| `DIRECTORY_SYNC_CONFIG_NOT_FOUND` | 404 | HRIS sync configuration does not exist | Create a sync configuration first |
| `DIRECTORY_SYNC_CONNECTION_FAILED` | 502 | Cannot connect to the external HRIS provider | Check connection settings and provider availability |
| `DIRECTORY_SYNC_AUTH_FAILED` | 401 | HRIS provider rejected authentication credentials | Update API key or OAuth credentials |
| `DIRECTORY_SYNC_IN_PROGRESS` | 409 | A sync operation is already running for this tenant | Wait for the current sync to complete |
| `DIRECTORY_SYNC_FIELD_MAPPING_INVALID` | 400 | Field mapping references unknown HRIS or directory fields | Review and correct the field mapping configuration |
| `DIRECTORY_OFFBOARDING_ALREADY_OFFBOARDED` | 409 | Employee is already offboarded | Use reactivate if re-hiring |
| `DIRECTORY_OFFBOARDING_REASSIGN_FAILED` | 500 | Failed to reassign direct reports during offboarding | Manually reassign reports and retry |
| `DIRECTORY_EXPORT_TOO_LARGE` | 413 | Export exceeds the maximum allowed row count | Apply filters to reduce the export size |
| `DIRECTORY_BULK_IMPORT_LIMIT_EXCEEDED` | 400 | Bulk import exceeds the maximum batch size (1000 rows) | Split into smaller batches |
| `DIRECTORY_BULK_IMPORT_INVALID_DATA` | 400 | One or more rows in the bulk import failed validation | Check the errors array in the response for per-row details |
| `DIRECTORY_CONTACT_DUPLICATE` | 409 | Duplicate contact entry for this type and value | Update the existing contact instead |
| `DIRECTORY_CONTACT_INVALID_URI` | 400 | Contact URI format is invalid for the specified type | Provide a valid URI (mailto:, tel:, slack://, etc.) |
| `DIRECTORY_RATE_LIMITED` | 429 | Too many directory API requests | Back off and retry with exponential delay |
| `DIRECTORY_TENANT_LIMIT_REACHED` | 403 | Tenant has reached its employee count limit | Upgrade the tenant plan or remove inactive profiles |
| `DIRECTORY_AVATAR_INVALID_FORMAT` | 400 | Avatar image format not supported | Use JPEG, PNG, or WebP (max 5MB) |
| `DIRECTORY_AVATAR_TOO_LARGE` | 413 | Avatar image exceeds size limit | Resize to under 5MB |

### Error Response Format

```typescript
interface DirectoryError {
  code: string;           // e.g., "DIRECTORY_EMPLOYEE_NOT_FOUND"
  message: string;        // Human-readable description
  details?: {
    field?: string;       // The field that caused the error
    value?: unknown;      // The invalid value
    constraint?: string;  // The constraint that was violated
  };
  requestId: string;      // Correlation ID for debugging
  timestamp: string;      // ISO 8601 timestamp
}

// Example error response
{
  "code": "DIRECTORY_EMPLOYEE_CIRCULAR_REPORTING",
  "message": "Setting employee 'abc-123' as manager of 'def-456' would create a circular reporting chain: def-456 → abc-123 → ... → def-456",
  "details": {
    "field": "managerId",
    "value": "abc-123",
    "constraint": "no_circular_reporting"
  },
  "requestId": "req_01910f...",
  "timestamp": "2025-03-15T14:30:00.000Z"
}
```

---

## Security

### Authentication & Authorization

All directory operations require a valid session from `@mcv/auth`. The directory module enforces a role-based access control (RBAC) model:

| Role | Capabilities |
|------|-------------|
| `directory:viewer` | Read employee profiles (public fields only), search the directory, view org chart, view team pages |
| `directory:self` | All viewer permissions + edit own profile fields, manage own skills, update own contact info |
| `directory:manager` | All self permissions + view manager-visibility fields of direct reports, verify skills for reports |
| `directory:hr` | All manager permissions + create/edit/deactivate any employee, manage custom fields, run offboarding, view HR-visibility fields, export data, configure HRIS sync |
| `directory:admin` | All HR permissions + manage directory configuration, bulk import, define custom fields, view analytics, manage integrations |

### Field-Level Visibility

Custom fields and certain built-in fields support visibility rules. The directory service checks the requesting user's relationship to the profile being viewed:

```typescript
// Visibility check pseudocode
function canViewField(
  viewer: { role: string; employeeId: string; managementChain: string[] },
  target: { employeeId: string },
  field: { visibility: FieldVisibility }
): boolean {
  switch (field.visibility) {
    case 'public':
      return true;
    case 'authenticated':
      return viewer.role !== 'anonymous';
    case 'managers':
      return (
        viewer.managementChain.includes(target.employeeId) ||
        viewer.role === 'directory:hr' ||
        viewer.role === 'directory:admin'
      );
    case 'hr':
      return viewer.role === 'directory:hr' || viewer.role === 'directory:admin';
    case 'self':
      return (
        viewer.employeeId === target.employeeId ||
        viewer.role === 'directory:admin'
      );
  }
}
```

### Data Protection

| Measure | Implementation |
|---------|---------------|
| **Tenant isolation** | PostgreSQL RLS policies on all tables; `tenant_id` set from JWT claims |
| **Soft deletes** | Employee profiles are soft-deleted (`deleted_at`); hard deletion only after retention period |
| **Encryption at rest** | Supabase-managed disk encryption; HRIS credentials encrypted with tenant-specific keys |
| **PII handling** | Personal fields (phone, bio, custom fields) support redaction during offboarding |
| **Audit logging** | All mutations recorded in `directory_activities` with actor, timestamp, IP, and change details |
| **Search privacy** | Search only indexes fields with `searchable: true`; visibility rules applied to results |
| **Rate limiting** | Per-tenant, per-user rate limits on search (100/min) and mutations (30/min) |
| **Input validation** | All inputs validated with Zod schemas before processing |
| **HRIS credentials** | Stored encrypted at rest; decrypted only in sync worker; never exposed via API |
| **Avatar uploads** | Scanned for malware; resized server-side; served from CDN with signed URLs |

### Multi-Tenant Isolation

```
┌───────────────────────────────────────────────────┐
│                   Request Flow                     │
│                                                    │
│  1. JWT → extract tenant_id                        │
│  2. SET app.tenant_id = 'uuid' (PostgreSQL var)    │
│  3. All queries filtered by RLS automatically      │
│  4. Response contains only tenant's data            │
│                                                    │
│  Cross-tenant access → 0 rows returned (not 403)   │
│  This prevents tenant enumeration attacks           │
└───────────────────────────────────────────────────┘
```

### Sensitive Operations Requiring Confirmation

The following operations require additional confirmation or elevated permissions:

- **Bulk import** — Requires `directory:admin`; large imports require confirmation step
- **Offboarding** — Requires `directory:hr`; irreversible steps require explicit acknowledgment
- **Org restructuring** — Requires `directory:hr`; changes affecting >10 employees require approval
- **Data export** — Requires `directory:hr`; exports logged and rate-limited
- **HRIS sync configuration** — Requires `directory:admin`; credential changes require re-authentication
- **Custom field deletion** — Requires `directory:admin`; warns about data loss

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string |
| `DIRECTORY_SEARCH_MIN_QUERY_LENGTH` | No | `2` | Minimum characters for search queries |
| `DIRECTORY_SEARCH_MAX_RESULTS` | No | `100` | Maximum results per search page |
| `DIRECTORY_SEARCH_TIMEOUT_MS` | No | `5000` | Search query timeout in milliseconds |
| `DIRECTORY_MAX_EMPLOYEES_PER_TENANT` | No | `50000` | Maximum employees per tenant (plan-dependent) |
| `DIRECTORY_MAX_SKILLS_PER_EMPLOYEE` | No | `50` | Maximum skill tags per employee |
| `DIRECTORY_MAX_CUSTOM_FIELDS` | No | `100` | Maximum custom field definitions per tenant |
| `DIRECTORY_MAX_TEAMS_PER_TENANT` | No | `500` | Maximum teams per tenant |
| `DIRECTORY_ORG_MAX_DEPTH` | No | `15` | Maximum allowed org chart depth |
| `DIRECTORY_BULK_IMPORT_MAX_ROWS` | No | `1000` | Maximum rows per bulk import batch |
| `DIRECTORY_AVATAR_MAX_SIZE_MB` | No | `5` | Maximum avatar upload size in megabytes |
| `DIRECTORY_AVATAR_RESIZE_PX` | No | `512` | Avatar resize target (square, pixels) |
| `DIRECTORY_DATA_RETENTION_DEFAULT` | No | `P2Y` | Default data retention period (ISO 8601 duration) |
| `DIRECTORY_RATE_LIMIT_SEARCH` | No | `100` | Search requests per minute per user |
| `DIRECTORY_RATE_LIMIT_MUTATION` | No | `30` | Mutation requests per minute per user |
| `DIRECTORY_HRIS_SYNC_TIMEOUT_MS` | No | `300000` | HRIS sync operation timeout (5 minutes) |
| `DIRECTORY_HRIS_SYNC_BATCH_SIZE` | No | `100` | Records per batch during HRIS sync |
| `DIRECTORY_CACHE_TTL_SECONDS` | No | `300` | Cache TTL for org chart and analytics |
| `DIRECTORY_EVENT_BUS_TOPIC` | No | `directory.events` | Event bus topic for directory domain events |
| `DIRECTORY_EXPORT_MAX_ROWS` | No | `10000` | Maximum rows per export |
| `DIRECTORY_EXPORT_SIGNED_URL_TTL` | No | `3600` | Export download URL expiration (seconds) |
| `SLACK_BOT_TOKEN` | No | — | Slack bot token for presence/status integration |
| `TEAMS_APP_ID` | No | — | Microsoft Teams app ID for presence integration |
| `TEAMS_APP_SECRET` | No | — | Microsoft Teams app secret |

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/core` | `workspace:*` | Base types, error handling, event bus, logging |
| `@mcv/auth` | `workspace:*` | Authentication, session validation, RBAC |
| `@mcv/db` | `workspace:*` | Drizzle ORM setup, connection pool, migration tools |
| `@mcv/storage` | `workspace:*` | Avatar upload and CDN-served image URLs |
| `@mcv/notifications` | `workspace:*` | Event-driven notification delivery |
| `@mcv/tenants` | `workspace:*` | Tenant configuration, plan limits |
| `@mcv/people/departments` | `workspace:*` | Department definitions (referenced by employees) |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.38.x` | Type-safe SQL query builder and ORM |
| `@trpc/server` | `^11.x` | End-to-end typesafe API layer |
| `zod` | `^3.23.x` | Runtime schema validation for inputs |
| `date-fns` | `^4.x` | Date manipulation and formatting |
| `slugify` | `^1.6.x` | URL-safe slug generation for teams |
| `sharp` | `^0.33.x` | Server-side image resizing for avatars |
| `papaparse` | `^5.4.x` | CSV parsing for bulk import/export |
| `ical-generator` | `^8.x` | Calendar availability parsing |
| `nanoid` | `^5.x` | Short ID generation for employee numbers |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | `^18.x \|\| ^19.x` | React hooks (client-side only) |
| `@tanstack/react-query` | `^5.x` | Data fetching and caching for hooks |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── directory-service.test.ts
│   │   ├── org-chart-service.test.ts
│   │   ├── skill-matrix-service.test.ts
│   │   ├── team-service.test.ts
│   │   ├── contact-card-service.test.ts
│   │   ├── custom-field-service.test.ts
│   │   ├── offboarding-service.test.ts
│   │   ├── directory-search-service.test.ts
│   │   ├── directory-sync-service.test.ts
│   │   ├── directory-analytics-service.test.ts
│   │   ├── build-org-tree.test.ts
│   │   ├── format-employee-name.test.ts
│   │   ├── generate-vcard.test.ts
│   │   └── compute-skill-gaps.test.ts
│   ├── integration/
│   │   ├── employee-crud.test.ts
│   │   ├── directory-search.test.ts
│   │   ├── org-chart-operations.test.ts
│   │   ├── team-management.test.ts
│   │   ├── skill-matrix.test.ts
│   │   ├── custom-fields.test.ts
│   │   ├── offboarding-workflow.test.ts
│   │   ├── hris-sync.test.ts
│   │   ├── bulk-import.test.ts
│   │   └── rls-isolation.test.ts
│   └── e2e/
│       ├── directory-flow.test.ts
│       ├── search-and-filter.test.ts
│       └── offboarding-flow.test.ts
```

### Running Tests

```bash
# All tests
pnpm test --filter=@mcv/people/directory

# Unit tests only
pnpm test --filter=@mcv/people/directory -- --testPathPattern=unit

# Integration tests (requires Supabase)
pnpm test --filter=@mcv/people/directory -- --testPathPattern=integration

# E2E tests
pnpm test --filter=@mcv/people/directory -- --testPathPattern=e2e

# Coverage
pnpm test --filter=@mcv/people/directory -- --coverage
```

### Key Test Scenarios

#### Employee CRUD

```typescript
describe('DirectoryService', () => {
  describe('createEmployee', () => {
    it('creates an employee with all required fields', async () => {
      const employee = await service.createEmployee({
        firstName: 'Test',
        lastName: 'User',
        title: 'Engineer',
        email: 'test@acme.com',
        employmentType: 'full_time',
        startDate: '2024-01-15',
      });

      expect(employee.id).toBeDefined();
      expect(employee.tenantId).toBe(testTenantId);
      expect(employee.status).toBe('active');
      expect(employee.createdAt).toBeDefined();
    });

    it('rejects duplicate email within tenant', async () => {
      await service.createEmployee({
        firstName: 'First',
        lastName: 'User',
        title: 'Engineer',
        email: 'duplicate@acme.com',
        employmentType: 'full_time',
        startDate: '2024-01-15',
      });

      await expect(
        service.createEmployee({
          firstName: 'Second',
          lastName: 'User',
          title: 'Designer',
          email: 'duplicate@acme.com',
          employmentType: 'full_time',
          startDate: '2024-02-01',
        })
      ).rejects.toThrow('DIRECTORY_EMPLOYEE_DUPLICATE_EMAIL');
    });

    it('allows same email across different tenants', async () => {
      const emp1 = await serviceForTenantA.createEmployee({
        firstName: 'Test',
        lastName: 'User',
        title: 'Engineer',
        email: 'shared@example.com',
        employmentType: 'full_time',
        startDate: '2024-01-15',
      });

      const emp2 = await serviceForTenantB.createEmployee({
        firstName: 'Test',
        lastName: 'User',
        title: 'Engineer',
        email: 'shared@example.com',
        employmentType: 'full_time',
        startDate: '2024-01-15',
      });

      expect(emp1.id).not.toBe(emp2.id);
      expect(emp1.tenantId).not.toBe(emp2.tenantId);
    });

    it('emits employee.created event', async () => {
      const events: DirectoryEvent[] = [];
      eventBus.on('employee.created', (e) => events.push(e));

      await service.createEmployee({
        firstName: 'Test',
        lastName: 'User',
        title: 'Engineer',
        email: 'test@acme.com',
        employmentType: 'full_time',
        startDate: '2024-01-15',
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('employee.created');
      expect(events[0].payload.email).toBe('test@acme.com');
    });
  });

  describe('updateEmployee', () => {
    it('updates specified fields and preserves others', async () => {
      const created = await service.createEmployee({
        firstName: 'Original',
        lastName: 'Name',
        title: 'Engineer',
        email: 'original@acme.com',
        employmentType: 'full_time',
        startDate: '2024-01-15',
      });

      const updated = await service.updateEmployee({
        id: created.id,
        title: 'Senior Engineer',
        location: 'Toronto',
      });

      expect(updated.title).toBe('Senior Engineer');
      expect(updated.location).toBe('Toronto');
      expect(updated.firstName).toBe('Original'); // Unchanged
      expect(updated.email).toBe('original@acme.com'); // Unchanged
    });

    it('records changes in activity log', async () => {
      const employee = await createTestEmployee();

      await service.updateEmployee({
        id: employee.id,
        title: 'Staff Engineer',
      });

      const activities = await getActivities(employee.id);
      expect(activities).toHaveLength(1);
      expect(activities[0].changes).toEqual({
        title: { old: 'Engineer', new: 'Staff Engineer' },
      });
    });
  });
});
```

#### Org Chart Operations

```typescript
describe('OrgChartService', () => {
  describe('moveNode', () => {
    it('prevents circular reporting chains', async () => {
      // A → B → C
      const [a, b, c] = await createChain(3);

      // Try to make C the manager of A (would create C → A → B → C)
      await expect(
        orgService.moveNode(a.id, { newParentId: c.id })
      ).rejects.toThrow('DIRECTORY_EMPLOYEE_CIRCULAR_REPORTING');
    });

    it('updates materialized paths for entire subtree', async () => {
      // Before: CEO → VP1 → Dir1 → Eng1
      //                VP2
      // After:  CEO → VP2 → Dir1 → Eng1
      //                VP1

      await orgService.moveNode(dir1.orgNodeId, {
        newParentId: vp2.orgNodeId,
      });

      const eng1Node = await orgService.getNode(eng1.orgNodeId);
      expect(eng1Node.path).toContain(vp2.orgNodeId);
      expect(eng1Node.path).not.toContain(vp1.orgNodeId);
    });

    it('emits org.restructured event with all affected employees', async () => {
      const events: DirectoryEvent[] = [];
      eventBus.on('org.restructured', (e) => events.push(e));

      await orgService.moveNode(dir1.orgNodeId, {
        newParentId: vp2.orgNodeId,
      });

      expect(events).toHaveLength(1);
      expect(events[0].payload.changes).toContainEqual({
        employeeId: dir1.employeeId,
        previousManagerId: vp1.employeeId,
        newManagerId: vp2.employeeId,
      });
    });
  });

  describe('getSpanOfControl', () => {
    it('returns correct metrics for a manager', async () => {
      // Manager with 7 direct reports, total subtree of 20
      const span = await orgService.getSpanOfControl(manager.orgNodeId);

      expect(span.directReports).toBe(7);
      expect(span.totalReports).toBe(20);
      expect(span.levels).toBe(3);
      expect(span.assessment).toBe('optimal'); // 3-10 is optimal
    });

    it('flags too-wide span of control', async () => {
      // Manager with 15 direct reports
      const span = await orgService.getSpanOfControl(wideManager.orgNodeId);
      expect(span.assessment).toBe('too_wide');
    });
  });
});
```

#### Search

```typescript
describe('DirectorySearchService', () => {
  describe('search', () => {
    it('returns results ranked by relevance', async () => {
      await createTestEmployee({ firstName: 'React', lastName: 'Expert', title: 'React Engineer' });
      await createTestEmployee({ firstName: 'John', lastName: 'Smith', title: 'Backend Engineer', bio: 'Some React experience' });
      await createTestEmployee({ firstName: 'Jane', lastName: 'Doe', title: 'Product Manager' });

      const results = await searchService.search({ query: 'react' });

      expect(results.items.length).toBeGreaterThanOrEqual(2);
      // Name/title matches should rank higher than bio mentions
      expect(results.items[0].relevanceScore).toBeGreaterThan(results.items[1].relevanceScore);
    });

    it('returns accurate facets', async () => {
      await createTestEmployees([
        { department: 'Engineering', location: 'SF' },
        { department: 'Engineering', location: 'NYC' },
        { department: 'Design', location: 'SF' },
      ]);

      const results = await searchService.search({
        query: '',
        filters: {},
      });

      const engFacet = results.facets.departments.find(d => d.name === 'Engineering');
      expect(engFacet?.count).toBe(2);

      const sfFacet = results.facets.locations.find(l => l.name === 'SF');
      expect(sfFacet?.count).toBe(2);
    });

    it('applies multiple filters with AND logic', async () => {
      const results = await searchService.search({
        query: 'engineer',
        filters: {
          locations: ['San Francisco'],
          workModes: ['remote'],
          skills: ['TypeScript'],
        },
      });

      for (const item of results.items) {
        expect(item.location).toBe('San Francisco');
        expect(item.workMode).toBe('remote');
        expect(item.skills?.some(s => s.skillName === 'typescript')).toBe(true);
      }
    });

    it('handles fuzzy matching via trigram similarity', async () => {
      await createTestEmployee({ firstName: 'Aleksandr', lastName: 'Petrov' });

      const results = await searchService.search({ query: 'aleksander' }); // Typo
      expect(results.items.length).toBe(1);
      expect(results.items[0].firstName).toBe('Aleksandr');
    });

    it('respects search timeout', async () => {
      // Configure a very short timeout
      const timeoutService = new DirectorySearchService({
        db,
        tenantId,
        timeoutMs: 1,
      });

      await expect(
        timeoutService.search({ query: 'test' })
      ).rejects.toThrow('DIRECTORY_SEARCH_TIMEOUT');
    });
  });
});
```

#### RLS Isolation

```typescript
describe('RLS Isolation', () => {
  it('prevents cross-tenant data access at the database level', async () => {
    // Create employee in tenant A
    const empA = await serviceForTenantA.createEmployee({
      firstName: 'Tenant',
      lastName: 'A',
      title: 'Engineer',
      email: 'a@tenant-a.com',
      employmentType: 'full_time',
      startDate: '2024-01-01',
    });

    // Attempt to read from tenant B context
    const result = await serviceForTenantB.getEmployee(empA.id);
    expect(result).toBeNull(); // RLS blocks access, returns null (not 403)

    // Attempt to list — should see 0 results
    const list = await serviceForTenantB.listEmployees({
      query: '',
      pagination: { page: 1, pageSize: 100 },
    });
    expect(list.items.find(e => e.id === empA.id)).toBeUndefined();
  });

  it('prevents cross-tenant updates', async () => {
    const empA = await serviceForTenantA.createEmployee({ /* ... */ });

    await expect(
      serviceForTenantB.updateEmployee({ id: empA.id, title: 'Hacked' })
    ).rejects.toThrow('DIRECTORY_EMPLOYEE_NOT_FOUND'); // RLS makes it invisible
  });
});
```

#### Offboarding Workflow

```typescript
describe('OffboardingService', () => {
  describe('offboard', () => {
    it('executes all offboarding steps in order', async () => {
      const employee = await createTestEmployeeWithReports(3);

      const result = await offboardingService.offboard({
        employeeId: employee.id,
        endDate: '2025-04-30',
        reason: 'resignation',
        notes: null,
        moveToAlumni: true,
        revokeAccess: {
          deactivateAuth: true,
          removeFromTeams: true,
          reassignReportsTo: otherManager.id,
          notifyIT: true,
        },
      });

      expect(result.status).toBe('offboarded');
      expect(result.movedToAlumni).toBe(true);
      expect(result.accessRevoked).toBe(true);
      expect(result.steps.every(s => s.status === 'completed')).toBe(true);

      // Verify employee status changed
      const updated = await service.getEmployee(employee.id);
      expect(updated?.status).toBe('offboarded');
      expect(updated?.endDate).toBe('2025-04-30');

      // Verify reports reassigned
      const reports = await service.getDirectReports(employee.id);
      expect(reports).toHaveLength(0);

      const newManagerReports = await service.getDirectReports(otherManager.id);
      expect(newManagerReports).toHaveLength(3);
    });

    it('rejects double offboarding', async () => {
      const employee = await createOffboardedEmployee();

      await expect(
        offboardingService.offboard({
          employeeId: employee.id,
          endDate: '2025-05-01',
          reason: 'termination',
          notes: null,
          moveToAlumni: false,
          revokeAccess: {
            deactivateAuth: false,
            removeFromTeams: false,
            reassignReportsTo: null,
            notifyIT: false,
          },
        })
      ).rejects.toThrow('DIRECTORY_OFFBOARDING_ALREADY_OFFBOARDED');
    });
  });

  describe('reactivate', () => {
    it('restores an alumni to active status', async () => {
      const alumni = await createOffboardedEmployee();

      await offboardingService.reactivate(alumni.id, {
        newStartDate: '2026-01-15',
        newTitle: 'Staff Engineer',
        newManagerId: manager.id,
      });

      const reactivated = await service.getEmployee(alumni.id);
      expect(reactivated?.status).toBe('active');
      expect(reactivated?.title).toBe('Staff Engineer');
      expect(reactivated?.managerId).toBe(manager.id);
      expect(reactivated?.startDate).toBe('2026-01-15');
      expect(reactivated?.endDate).toBeNull();
    });
  });
});
```

### Coverage Targets

| Category | Target | Notes |
|----------|--------|-------|
| Line coverage | ≥90% | All service methods and utility functions |
| Branch coverage | ≥85% | Error paths, edge cases, visibility rules |
| Function coverage | ≥95% | All exported functions |
| Integration tests | Required | CRUD, search, RLS isolation, org operations |
| E2E tests | Required | Full offboarding flow, search-and-filter, directory browse |

### Test Utilities

```typescript
// test/helpers/directory-factory.ts

/** Create a test employee with sensible defaults */
export async function createTestEmployee(
  overrides?: Partial<EmployeeCreateInput>
): Promise<Employee> {
  return service.createEmployee({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    title: faker.person.jobTitle(),
    email: faker.internet.email(),
    employmentType: 'full_time',
    startDate: '2024-01-15',
    ...overrides,
  });
}

/** Create N test employees in bulk */
export async function createTestEmployees(
  specs: Partial<EmployeeCreateInput>[],
): Promise<Employee[]> {
  return Promise.all(specs.map(s => createTestEmployee(s)));
}

/** Create a reporting chain of N levels */
export async function createChain(levels: number): Promise<Employee[]> {
  const employees: Employee[] = [];
  for (let i = 0; i < levels; i++) {
    employees.push(
      await createTestEmployee({
        managerId: i > 0 ? employees[i - 1].id : undefined,
        title: `Level ${i} Manager`,
      })
    );
  }
  return employees;
}

/** Create an employee with N direct reports */
export async function createTestEmployeeWithReports(
  reportCount: number,
): Promise<Employee> {
  const manager = await createTestEmployee({ title: 'Manager' });
  for (let i = 0; i < reportCount; i++) {
    await createTestEmployee({ managerId: manager.id });
  }
  return manager;
}

/** Create an offboarded employee */
export async function createOffboardedEmployee(): Promise<Employee> {
  const employee = await createTestEmployee();
  await offboardingService.offboard({
    employeeId: employee.id,
    endDate: '2024-12-31',
    reason: 'resignation',
    notes: null,
    moveToAlumni: true,
    revokeAccess: {
      deactivateAuth: false,
      removeFromTeams: true,
      reassignReportsTo: null,
      notifyIT: false,
    },
  });
  return service.getEmployee(employee.id) as Promise<Employee>;
}
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| `0.16.0` | 2025-02-01 | Added HRIS sync service with BambooHR and Workday connectors |
| `0.15.0` | 2025-01-15 | Skills matrix gap analysis and expertise finder |
| `0.14.0` | 2025-01-01 | Offboarding workflow with alumni directory and data retention |
| `0.13.0` | 2024-12-15 | Custom fields with visibility rules and validation |
| `0.12.0` | 2024-12-01 | Initial release — Employee profiles, org chart, search, teams |

---

*This module is part of the [MCV.ONE](https://mcv.one) platform. For questions, open an issue in the monorepo or contact the People domain team.*
