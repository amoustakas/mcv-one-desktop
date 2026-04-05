# @mcv/github — GitHub Connector Module Specification

**Package:** `@mcv/github`
**Tier:** 3 — External Service Connector
**Classification:** PUBLISHABLE
**Version:** 1.0.0
**Last Updated:** February 8, 2026

---

## Table of Contents

1. [Purpose & Overview](#1-purpose--overview)
2. [Architecture](#2-architecture)
3. [Exports](#3-exports)
4. [Package Structure](#4-package-structure)
5. [TypeScript Interfaces — Complete Reference](#5-typescript-interfaces--complete-reference)
6. [Database Schema](#6-database-schema)
7. [Server Services — Detailed API](#7-server-services--detailed-api)
8. [Client Hooks — Detailed API](#8-client-hooks--detailed-api)
9. [Webhook Integration](#9-webhook-integration)
10. [Branch Protection Presets](#10-branch-protection-presets)
11. [Constants & Configuration](#11-constants--configuration)
12. [Code Examples](#12-code-examples)
13. [Data Sync Lifecycle](#13-data-sync-lifecycle)
14. [Environment Variables](#14-environment-variables)
15. [Error Codes & Error Handling](#15-error-codes--error-handling)
16. [Audit Events](#16-audit-events)
17. [Performance Considerations](#17-performance-considerations)
18. [Security Considerations](#18-security-considerations)
19. [Testing Patterns](#19-testing-patterns)
20. [Dependencies](#20-dependencies)
21. [Related Modules](#21-related-modules)
22. [Migration & Setup](#22-migration--setup)
23. [Troubleshooting](#23-troubleshooting)

---

## 1. Purpose & Overview

The `@mcv/github` package provides full GitHub integration for the MCV.ONE ecosystem. It enables ventures to manage GitHub organizations, repositories, teams, workflows (CI/CD), pull requests, secrets, code reviews, and deployments through a unified service layer. The package syncs data bidirectionally between GitHub's API and the MCV PostgreSQL database, supports MUMS permission group synchronization for team membership, and includes webhook middleware for real-time event processing.

**This is the single integration point for all GitHub operations across the MCV ecosystem.**

### Key Capabilities

| Capability | Description | Service |
|---|---|---|
| **Organization Management** | Register, sync, and manage GitHub organizations per venture | `OrganizationService` |
| **Repository CRUD** | Create repos, update settings, archive, sync from GitHub API | `RepositoryService` |
| **Branch Protection** | Apply strict/standard/relaxed protection presets or custom rules | `RepositoryService` |
| **Team Management** | Create teams, manage members, sync from MUMS permission groups | `TeamService` |
| **Member Management** | Add/remove org members, sync team membership, MUMS user linking | `MemberService` |
| **Workflow Management** | List, trigger, cancel, and re-run GitHub Actions workflows | `WorkflowService` |
| **Pull Request Management** | Create, merge, close PRs with full metadata tracking | `PullRequestService` |
| **Code Review** | Request reviews, submit reviews, add inline comments | `CodeReviewService` |
| **Secrets Management** | Set org/repo-level Actions secrets with libsodium encryption | `SecretsService` |
| **Deployment Tracking** | Track deployment states and environments per repository | Client hooks |
| **Webhook Processing** | HMAC-SHA256 signature verification for GitHub webhooks | Middleware |
| **Client Hooks** | React hooks for repos, PRs, issues, workflows, deployments | Client layer |

### Design Philosophy

1. **Two-Way Sync:** Every entity (repos, teams, PRs, workflows) can be created through MCV or synced from GitHub. The database is the source of truth for the admin panel; GitHub is the source of truth for actual state.
2. **Octokit Per-Org:** Each organization gets its own authenticated Octokit instance, ensuring proper credential isolation between ventures.
3. **Injection Pattern:** All server services accept a `PostgresJsDatabase` instance via constructor injection, enabling clean testing and multi-tenant database routing.
4. **Hook Abstraction:** Client hooks accept function references (`listFn`, `createFn`, `mergeFn`) rather than direct API calls, allowing the consuming app to wire up tRPC, REST, or any transport layer.

---

## 2. Architecture

### System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/github ARCHITECTURE                                 │
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                            CLIENT LAYER (React)                                  │ │
│  │                                                                                  │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │ │
│  │  │  useRepos   │ │   usePRs    │ │ useIssues   │ │ useWorkflows│ │ useDeploy│ │ │
│  │  │             │ │             │ │             │ │             │ │ ments    │ │ │
│  │  │ • loadRepos │ │ • loadPRs   │ │ • loadIssue│ │ • loadWF    │ │ • load   │ │ │
│  │  │ • createRepo│ │ • mergePR   │ │ • createIss│ │ • loadRuns  │ │ • create │ │ │
│  │  │ • isLoading │ │ • isMerging │ │ • isCreating│ │ • trigger   │ │ • isLoad │ │ │
│  │  │ • error     │ │ • error     │ │ • error     │ │ • error     │ │ • error  │ │ │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └────┬─────┘ │ │
│  │         │               │               │               │              │        │ │
│  │         └───────────────┴───────────────┴───────────────┴──────────────┘        │ │
│  │                                         │                                        │ │
│  │                              listFn / createFn / mergeFn                         │ │
│  │                           (injected via tRPC or REST)                             │ │
│  └─────────────────────────────────────────┼────────────────────────────────────────┘ │
│                                            │                                          │
│  ┌─────────────────────────────────────────▼────────────────────────────────────────┐ │
│  │                          SERVER LAYER (Services)                                  │ │
│  │                                                                                   │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐               │ │
│  │  │  Organization    │  │  Repository      │  │  Team            │               │ │
│  │  │  Service         │  │  Service         │  │  Service         │               │ │
│  │  │                  │  │                  │  │                  │               │ │
│  │  │ • list           │  │ • list (filtered)│  │ • list           │               │ │
│  │  │ • get            │  │ • get            │  │ • create         │               │ │
│  │  │ • register       │  │ • create         │  │ • update         │               │ │
│  │  │ • sync           │  │ • update         │  │ • delete         │               │ │
│  │  │ • updateSettings │  │ • archive        │  │ • syncFromMums   │               │ │
│  │  │                  │  │ • delete          │  │                  │               │ │
│  │  │                  │  │ • syncAll         │  │                  │               │ │
│  │  │                  │  │ • setBranchProt.  │  │                  │               │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘               │ │
│  │                                                                                   │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐               │ │
│  │  │  Workflow        │  │  PullRequest     │  │  Secrets         │               │ │
│  │  │  Service         │  │  Service         │  │  Service         │               │ │
│  │  │                  │  │                  │  │                  │               │ │
│  │  │ • listWorkflows  │  │ • listPRs        │  │ • list           │               │ │
│  │  │ • getWorkflow    │  │ • getPR          │  │ • set (encrypt)  │               │ │
│  │  │ • trigger        │  │ • createPR       │  │ • delete         │               │ │
│  │  │ • listRuns       │  │ • updatePR       │  │ • rotate         │               │ │
│  │  │ • cancelRun      │  │ • mergePR        │  │ • syncFromVault  │               │ │
│  │  │ • rerunWorkflow  │  │ • closePR        │  │                  │               │ │
│  │  │ • syncWorkflows  │  │ • syncPRs        │  │                  │               │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘               │ │
│  │                                                                                   │ │
│  │  ┌──────────────────┐  ┌──────────────────┐                                     │ │
│  │  │  Member          │  │  CodeReview      │                                     │ │
│  │  │  Service         │  │  Service         │                                     │ │
│  │  │                  │  │                  │                                     │ │
│  │  │ • listMembers    │  │ • requestReview  │                                     │ │
│  │  │ • addMember      │  │ • submitReview   │                                     │ │
│  │  │ • removeMember   │  │ • listReviews    │                                     │ │
│  │  │ • syncMembers    │  │ • addComment     │                                     │ │
│  │  └──────────────────┘  └──────────────────┘                                     │ │
│  │                                                                                   │ │
│  │  All services: constructor(db: PostgresJsDatabase)                                │ │
│  │  All services: getOctokitForOrg(orgId) → Octokit (from encrypted credential)     │ │
│  └───────────────────────────────────┬───────────────────────────────────────────────┘ │
│                                      │                                                 │
│  ┌───────────────────────────────────▼───────────────────────────────────────────────┐ │
│  │                          EXTERNAL INTEGRATIONS                                     │ │
│  │                                                                                    │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                │ │
│  │  │  GitHub REST API │  │  MUMS Auth       │  │  Webhook Events  │                │ │
│  │  │  (via Octokit)   │  │  (Permission     │  │  (from GitHub)   │                │ │
│  │  │                  │  │   Groups)        │  │                  │                │ │
│  │  │ • repos.*        │  │                  │  │ • HMAC-SHA256    │                │ │
│  │  │ • orgs.*         │  │ • Group members  │  │   verification   │                │ │
│  │  │ • teams.*        │  │ • Role slugs     │  │ • Constant-time  │                │ │
│  │  │ • actions.*      │  │ • User mappings  │  │   comparison     │                │ │
│  │  │ • pulls.*        │  │                  │  │                  │                │ │
│  │  │ • users.*        │  │                  │  │ Events:          │                │ │
│  │  │                  │  │                  │  │ • push           │                │ │
│  │  │ Paginated via    │  │                  │  │ • pull_request   │                │ │
│  │  │ octokit.paginate │  │                  │  │ • workflow_run   │                │ │
│  │  └──────────────────┘  └──────────────────┘  │ • deployment     │                │ │
│  │                                               │ • issues         │                │ │
│  │                                               │ • check_run      │                │ │
│  │                                               │ • release        │                │ │
│  │                                               └──────────────────┘                │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          DATABASE LAYER (PostgreSQL via @mcv/db)                   │  │
│  │                                                                                    │  │
│  │  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐               │  │
│  │  │ github_           │ │ github_teams      │ │ github_team_      │               │  │
│  │  │ organizations     │ │                   │ │ members           │               │  │
│  │  │                   │ │ • slug            │ │                   │               │  │
│  │  │ • venture link    │ │ • privacy         │ │ • username        │               │  │
│  │  │ • credential ref  │ │ • mums_role_slug  │ │ • role            │               │  │
│  │  │ • sync timestamp  │ │ • auto_sync flag  │ │ • mums_user_id    │               │  │
│  │  │ • org_type        │ │ • parent_team_id  │ │ • source          │               │  │
│  │  └───────────────────┘ └───────────────────┘ └───────────────────┘               │  │
│  │                                                                                    │  │
│  │  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐               │  │
│  │  │ github_           │ │ github_repo_      │ │ github_           │               │  │
│  │  │ repositories      │ │ team_access       │ │ workflows         │               │  │
│  │  │                   │ │                   │ │                   │               │  │
│  │  │ • 8+ indexes      │ │ • permission      │ │ • path            │               │  │
│  │  │ • JSONB settings  │ │ • unique(repo,tm) │ │ • state           │               │  │
│  │  │ • category        │ │                   │ │ • is_reusable     │               │  │
│  │  │ • environments    │ │                   │ │ • badge_url       │               │  │
│  │  └───────────────────┘ └───────────────────┘ └───────────────────┘               │  │
│  │                                                                                    │  │
│  │  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐               │  │
│  │  │ github_           │ │ github_           │ │ github_           │               │  │
│  │  │ workflow_runs     │ │ pull_requests     │ │ secrets           │               │  │
│  │  │                   │ │                   │ │                   │               │  │
│  │  │ • status          │ │ • state/merged    │ │ • org or repo     │               │  │
│  │  │ • conclusion      │ │ • head/base refs  │ │ • vault_path      │               │  │
│  │  │ • event trigger   │ │ • additions/del.  │ │ • visibility      │               │  │
│  │  │ • actor           │ │ • task_id link    │ │ • selected repos  │               │  │
│  │  └───────────────────┘ └───────────────────┘ └───────────────────┘               │  │
│  │                                                                                    │  │
│  │  ┌───────────────────┐ ┌───────────────────┐                                     │  │
│  │  │ github_           │ │ github_review_    │                                     │  │
│  │  │ deployments       │ │ comments          │                                     │  │
│  │  │                   │ │                   │                                     │  │
│  │  │ • environment     │ │ • path / line     │                                     │  │
│  │  │ • state           │ │ • author          │                                     │  │
│  │  │ • sha / ref       │ │ • pr_id link      │                                     │  │
│  │  │ • creator         │ │                   │                                     │  │
│  │  └───────────────────┘ └───────────────────┘                                     │  │
│  │                                                                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          CONSTANTS LAYER                                          │   │
│  │                                                                                   │   │
│  │  defaults.ts                          branch-protection.ts                        │   │
│  │  ├─ DEFAULT_PAGE_SIZE (30)            ├─ STRICT_BRANCH_PROTECTION                │   │
│  │  ├─ MAX_PAGE_SIZE (100)               │  (2 reviews, CODEOWNERS, status checks)  │   │
│  │  ├─ DEFAULT_BRANCH ('main')           ├─ STANDARD_BRANCH_PROTECTION              │   │
│  │  ├─ DEFAULT_REPO_VISIBILITY           │  (1 review, status checks, flexible)     │   │
│  │  ├─ DEFAULT_TEAM_PRIVACY ('closed')   └─ RELAXED_BRANCH_PROTECTION               │   │
│  │  ├─ DEFAULT_TEAM_PERMISSION ('push')     (1 review, force push OK)               │   │
│  │  ├─ DEFAULT_MERGE_METHOD ('squash')                                               │   │
│  │  ├─ MERGE_METHODS ['merge','squash','rebase']                                     │   │
│  │  ├─ GITHUB_API_BASE_URL                                                           │   │
│  │  ├─ SUPPORTED_WEBHOOK_EVENTS (10 events)                                          │   │
│  │  ├─ DEFAULT_REPO_SETTINGS                                                         │   │
│  │  └─ SECRET_VISIBILITY_OPTIONS                                                     │   │
│  │                                                                                   │   │
│  └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Webhook Processing Pipeline

```
  GitHub Cloud                MCV Server                    PostgreSQL
  ──────────                  ──────────                    ──────────

  Event occurs         POST /api/webhooks/github
  (push, PR, etc.)     │
        │              ▼
        │         ┌────────────────────────┐
        ├────────▶│ Raw body captured      │
        │         │ (for HMAC validation)  │
        │         └───────────┬────────────┘
        │                     │
        │              ┌──────▼──────────────┐
        │              │ validateGitHub       │
        │              │ Signature()          │
        │              │                      │
        │              │ HMAC-SHA256 with     │──── FAIL ──▶ 403 Forbidden
        │              │ constant-time compare│
        │              └──────┬───────────────┘
        │                     │ PASS
        │              ┌──────▼──────────────┐
        │              │ Parse event type     │
        │              │ x-github-event      │
        │              │ x-github-delivery   │
        │              └──────┬───────────────┘
        │                     │
        │              ┌──────▼──────────────┐
        │              │ Route to handler     │
        │              │ switch(event) {      │
        │              │   'push' → ...       │
        │              │   'pull_request' →.. │
        │              │   'workflow_run' →.. │        ┌──────────────────┐
        │              │   'deployment' → ... │───────▶│ Upsert records   │
        │              │ }                    │        │ in relevant      │
        │              └──────────────────────┘        │ github_* tables  │
        │                                              └──────────────────┘
        │
        │              200 OK ◀────────────────
```

### Entity Relationship Diagram

```
ventures ──< github_organizations ──┬──< github_teams ──┬──< github_team_members
                                     │                    └──< github_repo_team_access ──┐
                                     │                                                    │
                                     ├──< github_repositories ──┬──< github_workflows    │
                                     │                          │      └──< github_workflow_runs
                                     │                          ├──< github_pull_requests
                                     │                          │      └──< github_review_comments
                                     │                          ├──< github_secrets (repo-level)
                                     │                          ├──< github_deployments
                                     │                          └──< github_repo_team_access ◄┘
                                     │
                                     ├──< github_secrets (org-level)
                                     └──< github_members
```

---

## 3. Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// ROOT EXPORTS (index.ts)
// ═══════════════════════════════════════════════════════════════════════════════

// Re-exports all types from ./types.ts
export * from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER EXPORTS (server/index.ts)
// ═══════════════════════════════════════════════════════════════════════════════

// Services
export { OrganizationService } from './services/organization.service';
export { RepositoryService }   from './services/repository.service';
export { TeamService }         from './services/team.service';
export { MemberService }       from './services/member.service';
export { WorkflowService }     from './services/workflow.service';
export { SecretsService }      from './services/secrets.service';
export { PullRequestService }  from './services/pr.service';
export { CodeReviewService }   from './services/code-review.service';

// Middleware
export {
  validateGitHubSignature,       // Direct signature validation function
  createGitHubWebhookValidator,  // Factory for webhook validation middleware
  type GitHubWebhookOptions,     // Options type for validator factory
} from './middleware/github-webhook';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT EXPORTS (client/index.ts)
// ═══════════════════════════════════════════════════════════════════════════════

export { useRepos,         type UseReposOptions,         type UseReposReturn }         from './hooks/use-repos';
export { usePullRequests,  type UsePullRequestsOptions,  type UsePullRequestsReturn }  from './hooks/use-pull-requests';
export { useIssues,        type UseIssuesOptions,        type UseIssuesReturn,
         type IssueInfo,   type IssueListFilters }                                     from './hooks/use-issues';
export { useWorkflows,     type UseWorkflowsOptions,     type UseWorkflowsReturn }     from './hooks/use-workflows';
export { useDeployments,   type UseDeploymentsOptions,   type UseDeploymentsReturn }   from './hooks/use-deployments';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  DEFAULT_BRANCH,
  DEFAULT_REPO_VISIBILITY,
  DEFAULT_TEAM_PRIVACY,
  DEFAULT_TEAM_PERMISSION,
  DEFAULT_MERGE_METHOD,
  MERGE_METHODS,
  type MergeMethod,
  GITHUB_API_BASE_URL,
  SUPPORTED_WEBHOOK_EVENTS,
  DEFAULT_REPO_SETTINGS,
  SECRET_VISIBILITY_OPTIONS,
} from './constants/defaults';

export {
  STRICT_BRANCH_PROTECTION,
  STANDARD_BRANCH_PROTECTION,
  RELAXED_BRANCH_PROTECTION,
} from './constants/branch-protection';
```

---

## 4. Package Structure

```
packages/github/
├── src/
│   ├── index.ts                              # Root re-exports (types only)
│   ├── types.ts                              # All TypeScript interfaces (≈350 lines)
│   │
│   ├── client/
│   │   ├── index.ts                          # Client barrel exports
│   │   └── hooks/
│   │       ├── use-repos.ts                  # Repository listing & creation
│   │       ├── use-pull-requests.ts          # PR listing & merge operations
│   │       ├── use-issues.ts                 # Issue tracking (includes IssueInfo type)
│   │       ├── use-workflows.ts              # CI/CD workflow monitoring & triggering
│   │       └── use-deployments.ts            # Deployment tracking & creation
│   │
│   ├── constants/
│   │   ├── defaults.ts                       # Default config values, merge methods, events
│   │   └── branch-protection.ts              # 3 protection rule presets
│   │
│   └── server/
│       ├── index.ts                          # Server barrel exports (services + middleware)
│       ├── middleware/
│       │   └── github-webhook.ts             # HMAC-SHA256 webhook signature validation
│       └── services/
│           ├── organization.service.ts       # Org registration, sync, settings
│           ├── repository.service.ts         # Repo CRUD, branch protection, sync
│           ├── team.service.ts               # Team CRUD, MUMS permission sync
│           ├── member.service.ts             # Org member management, team membership
│           ├── workflow.service.ts           # Actions workflows, runs, trigger/cancel
│           ├── pr.service.ts                 # Pull request lifecycle management
│           ├── secrets.service.ts            # Actions secrets (libsodium encryption)
│           └── code-review.service.ts        # Reviews, comments, review requests
│
└── package.json
```

---

## 5. TypeScript Interfaces — Complete Reference

### Organization Types

```typescript
/**
 * Represents a GitHub organization registered in MCV.
 * Each org belongs to a venture and holds encrypted credentials.
 */
interface OrgInfo {
  id: string;                        // Internal UUID
  ventureId: string;                 // FK → ventures table
  githubOrgId: number;               // GitHub's numeric org ID
  login: string;                     // GitHub org login (URL-safe)
  name: string | null;               // Display name
  description: string | null;        // Org description
  avatarUrl: string;                 // Avatar URL from GitHub
  htmlUrl: string;                   // GitHub profile URL
  publicRepos: number;               // Count of public repos
  totalPrivateRepos: number;         // Count of private repos
  plan: string | null;               // GitHub plan name (free/team/enterprise)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for registering a new GitHub organization with MCV.
 * Requires a valid access token from the GitHub App installation.
 */
interface CreateOrgInput {
  ventureId: string;                 // Venture to associate with
  login: string;                     // GitHub org login name
  installationId: number;            // GitHub App installation ID
  accessToken: string;               // Installation access token
}
```

### Repository Types

```typescript
/**
 * Full repository metadata as tracked by MCV.
 * Mirrors key GitHub repository fields with additional MCV categorization.
 */
interface RepoInfo {
  id: string;                        // Internal UUID
  orgId: string;                     // FK → github_organizations
  githubRepoId: number;              // GitHub's numeric repo ID
  name: string;                      // Repository name
  fullName: string;                  // 'org/repo' format
  description: string | null;
  htmlUrl: string;                   // GitHub web URL
  cloneUrl: string;                  // HTTPS clone URL
  sshUrl: string;                    // SSH clone URL
  defaultBranch: string;             // Usually 'main'
  language: string | null;           // Primary language (auto-detected)
  visibility: 'public' | 'private' | 'internal';
  isArchived: boolean;
  isFork: boolean;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  topics: string[];                  // GitHub topic tags
  createdAt: Date;
  updatedAt: Date;
  pushedAt: Date | null;             // Last push timestamp
}

/**
 * Input for creating a new repository in a GitHub organization.
 */
interface CreateRepoInput {
  name: string;                      // Repo name (alphanumeric + hyphens)
  description?: string;
  visibility?: 'public' | 'private' | 'internal';  // Default: 'private'
  autoInit?: boolean;                // Create initial commit (default: true)
  gitignoreTemplate?: string;        // e.g., 'Node', 'Python'
  licenseTemplate?: string;          // e.g., 'mit', 'apache-2.0'
  teamId?: number;                   // Grant immediate team access
  hasIssues?: boolean;               // Default: true
  hasProjects?: boolean;             // Default: true
  hasWiki?: boolean;                 // Default: false
}

/**
 * Repository settings that can be updated after creation.
 */
interface RepoSettings {
  hasIssues?: boolean;
  hasProjects?: boolean;
  hasWiki?: boolean;
  allowSquashMerge?: boolean;        // Default: true
  allowMergeCommit?: boolean;        // Default: true
  allowRebaseMerge?: boolean;        // Default: true
  allowAutoMerge?: boolean;          // Default: false
  deleteBranchOnMerge?: boolean;     // Default: true
  defaultBranch?: string;
}

/**
 * Branch protection rule configuration.
 * Used with RepositoryService.setBranchProtection() and protection presets.
 */
interface BranchProtectionConfig {
  requiredReviews?: {
    requiredApprovingReviewCount: number;   // 1-6
    dismissStaleReviews: boolean;            // Dismiss on new commits
    requireCodeOwnerReviews: boolean;        // CODEOWNERS must approve
  };
  requiredStatusChecks?: {
    strict: boolean;                         // Require branch to be up-to-date
    contexts: string[];                      // CI check names (e.g., 'ci/build')
  };
  enforceAdmins: boolean;                    // Apply rules to admins too
  requiredLinearHistory?: boolean;            // No merge commits
  allowForcePushes?: boolean;                // Default: false
  allowDeletions?: boolean;                  // Default: false
}
```

### Team Types

```typescript
/**
 * GitHub team as tracked by MCV.
 * Teams can auto-sync membership from MUMS permission groups.
 */
interface TeamInfo {
  id: string;                        // Internal UUID
  orgId: string;                     // FK → github_organizations
  githubTeamId: number;              // GitHub's numeric team ID
  name: string;                      // Display name
  slug: string;                      // URL-safe name
  description: string | null;
  privacy: 'secret' | 'closed';     // Team visibility
  permission: 'pull' | 'push' | 'admin' | 'maintain' | 'triage';
  membersCount: number;
  reposCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new team in a GitHub organization.
 */
interface CreateTeamInput {
  name: string;
  description?: string;
  privacy?: 'secret' | 'closed';    // Default: 'closed'
  permission?: 'pull' | 'push' | 'admin' | 'maintain' | 'triage';  // Default: 'push'
  repoNames?: string[];             // Repositories to grant access to
  maintainers?: string[];           // GitHub usernames for maintainer role
}

/**
 * Input for adding a member to a team.
 */
interface AddTeamMemberInput {
  username: string;                  // GitHub login
  role?: 'member' | 'maintainer';   // Default: 'member'
}
```

### Member Types

```typescript
/**
 * GitHub organization member with optional MUMS user link.
 */
interface MemberInfo {
  id: string;                        // Internal UUID
  orgId: string;                     // FK → github_organizations
  githubUserId: number;              // GitHub's numeric user ID
  login: string;                     // GitHub login
  avatarUrl: string;                 // Profile avatar
  role: 'admin' | 'member';         // Org-level role
  mumsUserId: string | null;        // FK → users (MUMS identity link)
  createdAt: Date;
  updatedAt: Date;
}
```

### Workflow Types

```typescript
/**
 * A GitHub Actions workflow definition.
 */
interface WorkflowInfo {
  id: string;                        // Internal UUID
  repoId: string;                   // FK → github_repositories
  githubWorkflowId: number;         // GitHub's numeric workflow ID
  name: string;                      // Workflow display name
  path: string;                      // '.github/workflows/ci.yml'
  state: 'active' | 'disabled_fork' | 'disabled_inactivity' | 'disabled_manually' | 'unknown';
  htmlUrl: string;                   // GitHub web URL
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A single execution of a GitHub Actions workflow.
 */
interface WorkflowRunInfo {
  id: string;                        // Internal UUID
  workflowId: string;               // FK → github_workflows
  githubRunId: number;               // GitHub's numeric run ID
  name: string;                      // Run name
  headBranch: string;                // Branch that triggered the run
  headSha: string;                   // Commit SHA
  status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'requested' | 'pending';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' |
              'action_required' | 'neutral' | 'stale' | null;
  htmlUrl: string;
  event: string;                     // Trigger event ('push', 'pull_request', etc.)
  runNumber: number;                 // Sequential run number
  runAttempt: number;                // Retry attempt number
  actor: string;                     // GitHub login of who triggered it
  createdAt: Date;
  updatedAt: Date;
  runStartedAt: Date | null;         // Actual execution start time
}

/**
 * Input for triggering a workflow dispatch.
 */
interface TriggerWorkflowInput {
  ref: string;                       // Branch or tag to run on
  inputs?: Record<string, string>;   // Workflow input parameters
}
```

### Pull Request Types

```typescript
/**
 * Full pull request metadata as tracked by MCV.
 */
interface PullRequestInfo {
  id: string;                        // Internal UUID
  repoId: string;                   // FK → github_repositories
  githubPrId: number;               // GitHub's numeric PR ID
  number: number;                    // PR number (#123)
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  merged: boolean;
  draft: boolean;
  htmlUrl: string;
  headRef: string;                   // Source branch
  baseRef: string;                   // Target branch
  headSha: string;                   // Latest commit on head
  author: string;                    // GitHub login
  assignees: string[];               // Assigned reviewers/developers
  labels: string[];                  // Applied labels
  reviewers: string[];               // Requested reviewers
  additions: number;                 // Lines added
  deletions: number;                 // Lines removed
  changedFiles: number;              // Files changed
  mergeable: boolean | null;         // Merge conflict status
  mergeableState: string | null;     // 'clean', 'dirty', 'blocked', etc.
  createdAt: Date;
  updatedAt: Date;
  mergedAt: Date | null;
  closedAt: Date | null;
}

/**
 * Input for creating a new pull request.
 */
interface CreatePRInput {
  title: string;
  body?: string;                     // Markdown body
  head: string;                      // Source branch name
  base: string;                      // Target branch name
  draft?: boolean;                   // Create as draft PR
  maintainerCanModify?: boolean;     // Allow maintainer to push to head
}

/**
 * Input for submitting a pull request review.
 */
interface PRReviewInput {
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  body?: string;                     // Review summary
  comments?: Array<{
    path: string;                    // File path
    position?: number;               // Diff position (deprecated)
    line?: number;                   // Line number
    body: string;                    // Comment text
  }>;
}
```

### Code Review Types

```typescript
/**
 * A review comment on a specific line of a pull request.
 */
interface CodeReviewComment {
  id: string;                        // Internal UUID
  prId: string;                      // FK → github_pull_requests
  githubCommentId: number;           // GitHub's numeric comment ID
  body: string;                      // Comment text
  path: string;                      // File path
  line: number | null;               // Line number (null for file-level)
  author: string;                    // GitHub login
  createdAt: Date;
  updatedAt: Date;
}
```

### Secrets Types

```typescript
/**
 * GitHub Actions secret metadata (value is never stored locally).
 */
interface SecretInfo {
  id: string;                        // Internal UUID
  orgId: string | null;              // FK → github_organizations (null for repo-level)
  repoId: string | null;             // FK → github_repositories (null for org-level)
  name: string;                      // Secret name (UPPER_SNAKE_CASE convention)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating or updating a secret.
 * Value is encrypted with libsodium sealed box before sending to GitHub.
 */
interface SetSecretInput {
  name: string;                      // Secret name
  value: string;                     // Plaintext value (encrypted before API call)
  orgId?: string;                    // Org-level secret
  repoId?: string;                   // Repo-level secret
  visibility?: 'all' | 'private' | 'selected';   // Org secret visibility
  selectedRepositoryIds?: number[];  // For 'selected' visibility
}
```

### Deployment Types

```typescript
/**
 * GitHub deployment as tracked by MCV.
 */
interface DeploymentInfo {
  id: string;                        // Internal UUID
  repoId: string;                   // FK → github_repositories
  githubDeploymentId: number;        // GitHub's numeric deployment ID
  environment: string;               // 'production', 'staging', etc.
  description: string | null;
  ref: string;                       // Branch or tag
  sha: string;                       // Commit SHA
  task: string;                      // Default: 'deploy'
  state: 'pending' | 'success' | 'error' | 'failure' | 'inactive' | 'in_progress' | 'queued';
  creator: string;                   // GitHub login
  htmlUrl: string | null;            // Deployment status page
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new deployment.
 */
interface CreateDeploymentInput {
  ref: string;                       // Branch, tag, or SHA
  environment: string;               // Target environment name
  description?: string;
  task?: string;                     // Default: 'deploy'
  autoMerge?: boolean;               // Auto-merge default branch before deploy
  requiredContexts?: string[];       // Status checks that must pass
  payload?: Record<string, unknown>; // Custom payload data
  transientEnvironment?: boolean;    // Auto-inactive when superseded
  productionEnvironment?: boolean;   // Mark as production
}
```

### Webhook Event Types

```typescript
/**
 * Normalized webhook event as processed by MCV middleware.
 */
interface GitHubWebhookEvent {
  type: 'push' | 'pull_request' | 'workflow_run' | 'issues' | 'deployment' | 'check_run';
  payload: Record<string, unknown>;
  deliveryId: string;                // x-github-delivery header
  timestamp: Date;
}

/**
 * Push event payload (commits pushed to a branch).
 */
interface PushEvent {
  ref: string;                       // 'refs/heads/main'
  before: string;                    // Previous HEAD SHA
  after: string;                     // New HEAD SHA
  repository: {
    id: number;
    fullName: string;                // 'org/repo'
  };
  pusher: {
    name: string;
    email: string;
  };
  commits: Array<{
    id: string;                      // Commit SHA
    message: string;
    author: {
      name: string;
      email: string;
      username: string;              // GitHub login
    };
    timestamp: string;               // ISO 8601
    added: string[];                 // New files
    removed: string[];               // Deleted files
    modified: string[];              // Changed files
  }>;
  headCommit: {
    id: string;
    message: string;
    author: { name: string; email: string; username: string };
    timestamp: string;
  } | null;
}

/**
 * Pull request event payload.
 */
interface PREvent {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize' | 'edited' |
          'review_requested' | 'labeled' | 'unlabeled' | 'assigned' | 'unassigned';
  number: number;
  pullRequest: {
    id: number;
    number: number;
    title: string;
    state: string;
    merged: boolean;
    htmlUrl: string;
    user: { login: string; avatarUrl: string };
    headRef: string;
    baseRef: string;
    headSha: string;
    additions: number;
    deletions: number;
    changedFiles: number;
    createdAt: string;
    updatedAt: string;
    mergedAt: string | null;
  };
  repository: { id: number; fullName: string };
}

/**
 * Workflow run event payload.
 */
interface WorkflowEvent {
  action: 'requested' | 'completed' | 'in_progress';
  workflowRun: {
    id: number;
    name: string;
    headBranch: string;
    headSha: string;
    status: string;
    conclusion: string | null;
    htmlUrl: string;
    event: string;
    runNumber: number;
    actor: { login: string; avatarUrl: string };
    createdAt: string;
    updatedAt: string;
  };
  repository: { id: number; fullName: string };
}
```

### Filter Types

```typescript
/**
 * Filters for repository list operations.
 */
interface RepoListFilters {
  visibility?: 'public' | 'private' | 'internal';
  language?: string;                 // Filter by primary language
  archived?: boolean;                // Include/exclude archived
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  direction?: 'asc' | 'desc';
  search?: string;                   // ILIKE search on name + description
  page?: number;                     // 1-indexed page number
  pageSize?: number;                 // Default: 30, max: 100
}

/**
 * Filters for pull request list operations.
 */
interface PRListFilters {
  state?: 'open' | 'closed' | 'all';
  author?: string;                   // Filter by author login
  base?: string;                     // Filter by base branch
  head?: string;                     // Filter by head branch
  sort?: 'created' | 'updated' | 'popularity' | 'long-running';
  direction?: 'asc' | 'desc';
  label?: string;                    // Filter by label (ANY match)
  page?: number;
  pageSize?: number;
}

/**
 * Filters for workflow run list operations.
 */
interface WorkflowRunFilters {
  branch?: string;                   // Filter by head branch
  event?: string;                    // Filter by trigger event
  status?: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'requested' | 'pending';
  actor?: string;                    // Filter by actor login
  page?: number;
  pageSize?: number;
}

/**
 * Filters for issue list operations (defined in client hook).
 */
interface IssueListFilters {
  state?: 'open' | 'closed' | 'all';
  assignee?: string;
  label?: string;
  milestone?: string;
  sort?: 'created' | 'updated' | 'comments';
  direction?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
```

### Issue Types (Client-Only)

```typescript
/**
 * Issue info as defined in the useIssues hook.
 * Note: Issues don't have a dedicated server service — they're managed
 * through hooks that call tRPC/REST endpoints directly.
 */
interface IssueInfo {
  id: string;
  repoId: string;
  githubIssueId: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  htmlUrl: string;
  author: string;
  assignees: string[];
  labels: string[];
  milestone: string | null;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}
```

---

## 6. Database Schema

### Table: `github_organizations`

```sql
CREATE TABLE github_organizations (
  id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id                     UUID NOT NULL REFERENCES ventures(id),
  github_id                      INTEGER UNIQUE,
  login                          TEXT UNIQUE NOT NULL,
  name                           TEXT,
  description                    TEXT,
  avatar_url                     TEXT,
  html_url                       TEXT,
  plan                           TEXT,
  default_repository_permission  TEXT,
  members_can_create_repos       BOOLEAN DEFAULT true,
  two_factor_requirement_enabled BOOLEAN DEFAULT false,
  public_repos                   INTEGER DEFAULT 0,
  total_private_repos            INTEGER DEFAULT 0,
  owned_private_repos            INTEGER DEFAULT 0,
  collaborators                  INTEGER DEFAULT 0,
  access_token_encrypted         TEXT,               -- Encrypted credential
  credential_ref                 TEXT,               -- External vault reference
  org_type                       TEXT NOT NULL DEFAULT 'venture',
  is_ecosystem_org               BOOLEAN NOT NULL DEFAULT false,
  status                         TEXT NOT NULL DEFAULT 'active',
  synced_at                      TIMESTAMPTZ,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_github_orgs_venture_id ON github_organizations(venture_id);
CREATE UNIQUE INDEX idx_github_orgs_github_id ON github_organizations(github_id);
CREATE UNIQUE INDEX idx_github_orgs_login ON github_organizations(login);
CREATE INDEX idx_github_orgs_status ON github_organizations(status);
```

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | PK | Internal ID |
| `venture_id` | `UUID` | FK → ventures, NOT NULL | Owning venture |
| `github_id` | `INTEGER` | UNIQUE | GitHub org numeric ID |
| `login` | `TEXT` | UNIQUE, NOT NULL | GitHub org login |
| `name` | `TEXT` | | Display name |
| `description` | `TEXT` | | Org description |
| `avatar_url` | `TEXT` | | Avatar URL |
| `html_url` | `TEXT` | | GitHub profile URL |
| `plan` | `TEXT` | | GitHub plan name |
| `default_repository_permission` | `TEXT` | | Default repo access level |
| `members_can_create_repos` | `BOOLEAN` | DEFAULT true | |
| `two_factor_requirement_enabled` | `BOOLEAN` | DEFAULT false | 2FA enforcement |
| `public_repos` / `total_private_repos` | `INTEGER` | | Repo counts |
| `owned_private_repos` / `collaborators` | `INTEGER` | | Additional counts |
| `access_token_encrypted` | `TEXT` | | Encrypted GitHub access token |
| `credential_ref` | `TEXT` | | External vault reference |
| `org_type` | `TEXT` | NOT NULL, DEFAULT 'venture' | `venture` / `shared` / `personal` |
| `is_ecosystem_org` | `BOOLEAN` | NOT NULL, DEFAULT false | Part of MCV ecosystem |
| `status` | `TEXT` | NOT NULL, DEFAULT 'active' | `active` / `suspended` / `archived` |
| `synced_at` | `TIMESTAMPTZ` | | Last GitHub API sync |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | NOT NULL | Timestamps |

### Table: `github_teams`

```sql
CREATE TABLE github_teams (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES github_organizations(id) ON DELETE CASCADE,
  github_id        INTEGER,
  slug             TEXT,
  name             TEXT NOT NULL,
  description      TEXT,
  privacy          TEXT NOT NULL DEFAULT 'closed',
  permission       TEXT NOT NULL DEFAULT 'push',
  parent_team_id   UUID REFERENCES github_teams(id),
  mums_role_slug   TEXT,
  auto_sync        BOOLEAN NOT NULL DEFAULT false,
  members_count    INTEGER DEFAULT 0,
  repos_count      INTEGER DEFAULT 0,
  synced_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_github_teams_org_id ON github_teams(organization_id);
CREATE INDEX idx_github_teams_slug ON github_teams(slug);
```

### Table: `github_team_members`

```sql
CREATE TABLE github_team_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES github_teams(id) ON DELETE CASCADE,
  github_user_id  INTEGER,
  username        TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'member',  -- 'member' | 'maintainer'
  mums_user_id    UUID,                            -- FK → users (MUMS link)
  source          TEXT NOT NULL DEFAULT 'manual',  -- 'manual' | 'mums_sync' | 'github_sync'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, username)
);
```

### Table: `github_repositories`

```sql
CREATE TABLE github_repositories (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    UUID NOT NULL REFERENCES github_organizations(id) ON DELETE CASCADE,
  venture_id         UUID REFERENCES ventures(id),
  application_id     UUID,
  github_id          INTEGER,
  name               TEXT NOT NULL,
  full_name          TEXT,
  description        TEXT,
  homepage           TEXT,
  html_url           TEXT,
  clone_url          TEXT,
  ssh_url            TEXT,
  default_branch     TEXT NOT NULL DEFAULT 'main',
  language           TEXT,
  topics             JSONB DEFAULT '[]',
  category           TEXT NOT NULL DEFAULT 'application',
  template_source    TEXT,
  visibility         TEXT NOT NULL DEFAULT 'private',
  is_template        BOOLEAN NOT NULL DEFAULT false,
  is_archived        BOOLEAN NOT NULL DEFAULT false,
  is_fork            BOOLEAN NOT NULL DEFAULT false,
  settings           JSONB,                          -- GithubRepoSettings
  branch_protection  JSONB,                          -- GithubBranchProtection[]
  has_issues         BOOLEAN DEFAULT true,
  has_projects       BOOLEAN DEFAULT true,
  has_wiki           BOOLEAN DEFAULT false,
  has_pages          BOOLEAN DEFAULT false,
  size_kb            INTEGER,
  stargazers_count   INTEGER DEFAULT 0,
  forks_count        INTEGER DEFAULT 0,
  open_issues_count  INTEGER DEFAULT 0,
  deploy_target      TEXT,
  environments       JSONB,                          -- GithubEnvironment[]
  task_project_id    UUID,
  status             TEXT NOT NULL DEFAULT 'active',
  pushed_at          TIMESTAMPTZ,
  synced_at          TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Heavy indexing for admin panel filtering
CREATE INDEX idx_github_repos_org_id ON github_repositories(organization_id);
CREATE INDEX idx_github_repos_venture_id ON github_repositories(venture_id);
CREATE INDEX idx_github_repos_github_id ON github_repositories(github_id);
CREATE INDEX idx_github_repos_name ON github_repositories(name);
CREATE INDEX idx_github_repos_full_name ON github_repositories(full_name);
CREATE INDEX idx_github_repos_language ON github_repositories(language);
CREATE INDEX idx_github_repos_category ON github_repositories(category);
CREATE INDEX idx_github_repos_status ON github_repositories(status);
CREATE INDEX idx_github_repos_visibility ON github_repositories(visibility);
```

| Column | Type | Notes |
|---|---|---|
| `category` | `TEXT` | `application` / `library` / `infrastructure` / `documentation` / `template` / `fork` |
| `settings` | `JSONB` | Mirrors `RepoSettings` interface |
| `branch_protection` | `JSONB` | Array of `BranchProtectionConfig` per branch |
| `environments` | `JSONB` | Deployment environment configurations |
| `task_project_id` | `UUID` | Link to `@mcv/projects` task board |

### Table: `github_repo_team_access`

```sql
CREATE TABLE github_repo_team_access (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id  UUID NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
  team_id        UUID NOT NULL REFERENCES github_teams(id) ON DELETE CASCADE,
  permission     TEXT NOT NULL DEFAULT 'push',  -- 'pull' | 'triage' | 'push' | 'maintain' | 'admin'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(repository_id, team_id)
);
```

### Table: `github_members`

```sql
CREATE TABLE github_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES github_organizations(id) ON DELETE CASCADE,
  github_user_id  INTEGER NOT NULL,
  login           TEXT NOT NULL,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'member',  -- 'admin' | 'member'
  mums_user_id    UUID,                            -- FK → users
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, github_user_id)
);

CREATE INDEX idx_github_members_org_id ON github_members(org_id);
CREATE INDEX idx_github_members_login ON github_members(login);
```

### Table: `github_workflows`

```sql
CREATE TABLE github_workflows (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id       UUID NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
  github_id           INTEGER,
  name                TEXT NOT NULL,
  path                TEXT NOT NULL,               -- '.github/workflows/...'
  state               TEXT NOT NULL DEFAULT 'active',
  is_reusable         BOOLEAN DEFAULT false,
  html_url            TEXT,
  badge_url           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_github_workflows_repo_id ON github_workflows(repository_id);
```

### Table: `github_workflow_runs`

```sql
CREATE TABLE github_workflow_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id       UUID NOT NULL REFERENCES github_workflows(id) ON DELETE CASCADE,
  repository_id     UUID NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
  github_id         INTEGER,
  run_number        INTEGER,
  name              TEXT,
  event             TEXT,                          -- Trigger event name
  status            TEXT NOT NULL DEFAULT 'queued',
  conclusion        TEXT,                          -- NULL until completed
  head_branch       TEXT,
  head_sha          TEXT,
  actor_id          INTEGER,
  actor_login       TEXT,
  html_url          TEXT,
  logs_url          TEXT,
  run_started_at    TIMESTAMPTZ,
  run_completed_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_github_wf_runs_workflow_id ON github_workflow_runs(workflow_id);
CREATE INDEX idx_github_wf_runs_repo_id ON github_workflow_runs(repository_id);
CREATE INDEX idx_github_wf_runs_github_id ON github_workflow_runs(github_id);
CREATE INDEX idx_github_wf_runs_status ON github_workflow_runs(status);
CREATE INDEX idx_github_wf_runs_conclusion ON github_workflow_runs(conclusion);
CREATE INDEX idx_github_wf_runs_head_branch ON github_workflow_runs(head_branch);
CREATE INDEX idx_github_wf_runs_event ON github_workflow_runs(event);
CREATE INDEX idx_github_wf_runs_created_at ON github_workflow_runs(created_at);
```

### Table: `github_pull_requests`

```sql
CREATE TABLE github_pull_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id     UUID NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
  github_id         INTEGER,
  number            INTEGER NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT,
  state             TEXT NOT NULL DEFAULT 'open',  -- 'open' | 'closed' | 'merged'
  head_ref          TEXT,
  head_sha          TEXT,
  base_ref          TEXT,
  author_id         INTEGER,
  author_login      TEXT,
  draft             BOOLEAN DEFAULT false,
  merged            BOOLEAN DEFAULT false,
  mergeable         BOOLEAN,
  additions         INTEGER DEFAULT 0,
  deletions         INTEGER DEFAULT 0,
  changed_files     INTEGER DEFAULT 0,
  commits           INTEGER DEFAULT 0,
  comments          INTEGER DEFAULT 0,
  review_comments   INTEGER DEFAULT 0,
  assignees         JSONB DEFAULT '[]',
  labels            JSONB DEFAULT '[]',
  reviewers         JSONB DEFAULT '[]',
  html_url          TEXT,
  task_id           UUID,                          -- Link to project task
  merged_at         TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_github_prs_repo_id ON github_pull_requests(repository_id);
CREATE INDEX idx_github_prs_github_id ON github_pull_requests(github_id);
CREATE INDEX idx_github_prs_number ON github_pull_requests(number);
CREATE INDEX idx_github_prs_state ON github_pull_requests(state);
CREATE INDEX idx_github_prs_author ON github_pull_requests(author_login);
CREATE INDEX idx_github_prs_head_ref ON github_pull_requests(head_ref);
CREATE INDEX idx_github_prs_base_ref ON github_pull_requests(base_ref);
CREATE INDEX idx_github_prs_created_at ON github_pull_requests(created_at);
```

### Table: `github_review_comments`

```sql
CREATE TABLE github_review_comments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id              UUID NOT NULL REFERENCES github_pull_requests(id) ON DELETE CASCADE,
  github_comment_id  INTEGER,
  body               TEXT NOT NULL,
  path               TEXT NOT NULL,
  line               INTEGER,
  author             TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_github_review_comments_pr_id ON github_review_comments(pr_id);
```

### Table: `github_secrets`

```sql
CREATE TABLE github_secrets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID REFERENCES github_organizations(id) ON DELETE CASCADE,
  repository_id       UUID REFERENCES github_repositories(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  secret_type         TEXT NOT NULL DEFAULT 'actions',  -- 'actions' | 'codespaces' | 'dependabot'
  vault_path          TEXT,                             -- External vault reference
  visibility          TEXT DEFAULT 'private',           -- 'all' | 'private' | 'selected'
  selected_repo_ids   JSONB,                            -- For 'selected' visibility
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (organization_id IS NOT NULL OR repository_id IS NOT NULL)
);

CREATE INDEX idx_github_secrets_org_id ON github_secrets(organization_id);
CREATE INDEX idx_github_secrets_repo_id ON github_secrets(repository_id);
```

### Table: `github_deployments`

```sql
CREATE TABLE github_deployments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id     UUID NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
  github_id         INTEGER,
  environment       TEXT NOT NULL,
  description       TEXT,
  sha               TEXT,
  ref               TEXT,
  task              TEXT DEFAULT 'deploy',
  state             TEXT NOT NULL DEFAULT 'pending',
  creator_id        INTEGER,
  creator_login     TEXT,
  environment_url   TEXT,
  log_url           TEXT,
  html_url          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_github_deployments_repo_id ON github_deployments(repository_id);
CREATE INDEX idx_github_deployments_environment ON github_deployments(environment);
CREATE INDEX idx_github_deployments_state ON github_deployments(state);
```

---

## 7. Server Services — Detailed API

All services follow a **constructor injection pattern**: `new Service(db: PostgresJsDatabase)`. Each service that interacts with GitHub creates per-organization Octokit instances via `getOctokitForOrg(orgId)`, which reads the encrypted access token from the database.

### OrganizationService

```typescript
class OrganizationService {
  constructor(private readonly db: PostgresJsDatabase) {}

  /** List all registered GitHub organizations, optionally filtered by venture. */
  async listOrganizations(ventureId?: string): Promise<OrgInfo[]>;

  /** Get a single organization by internal UUID. */
  async getOrganization(id: string): Promise<OrgInfo | null>;

  /**
   * Register a new GitHub organization for a venture.
   * Fetches org details from GitHub API using the provided access token,
   * then persists to the database.
   */
  async registerOrganization(input: CreateOrgInput): Promise<OrgInfo>;

  /**
   * Sync organization data from GitHub API.
   * Updates name, description, avatar, repo counts, plan info.
   */
  async syncOrganization(id: string): Promise<OrgInfo>;

  /**
   * Update organization settings via GitHub API.
   * Supports: name, description, defaultRepositoryPermission.
   * Automatically re-syncs from GitHub after update.
   */
  async updateSettings(id: string, settings: {
    name?: string;
    description?: string;
    defaultRepositoryPermission?: string;
  }): Promise<OrgInfo>;

  // Private
  private async getOctokitForOrg(orgId: string): Promise<Octokit>;
}
```

### RepositoryService

```typescript
class RepositoryService {
  constructor(private readonly db: PostgresJsDatabase) {}

  /**
   * List repositories for an organization with optional filters.
   * Supports: visibility, language, archived, search (ILIKE on name + description),
   * sort (created/updated/pushed/full_name), direction, pagination.
   */
  async listRepositories(orgId: string, filters?: RepoListFilters):
    Promise<{ items: RepoInfo[]; total: number }>;

  /** Get a single repository by internal UUID. */
  async getRepository(id: string): Promise<RepoInfo | null>;

  /**
   * Create a new repository in a GitHub organization.
   * Calls octokit.repos.createInOrg(), then persists to DB.
   */
  async createRepository(orgId: string, input: CreateRepoInput): Promise<RepoInfo>;

  /**
   * Update repository settings via GitHub API.
   * Calls octokit.repos.update() and updates local timestamp.
   */
  async updateRepository(id: string, input: Partial<RepoSettings>): Promise<RepoInfo>;

  /**
   * Archive a repository (sets archived=true in GitHub and DB).
   * This is a soft-delete — the repo is preserved but read-only.
   */
  async archiveRepository(id: string): Promise<void>;

  /**
   * Permanently delete a repository from GitHub and the database.
   * ⚠️ DESTRUCTIVE — cannot be undone.
   */
  async deleteRepository(id: string): Promise<void>;

  /**
   * Sync all repositories from a GitHub organization.
   * Uses octokit.paginate() for full pagination (100 per page).
   * Performs upsert: existing repos updated, new repos inserted.
   * Returns count of synced repositories.
   */
  async syncRepositories(orgId: string): Promise<number>;

  /**
   * Apply branch protection rules to a specific branch.
   * Calls octokit.repos.updateBranchProtection() with the full config.
   * Compatible with STRICT/STANDARD/RELAXED presets or custom configs.
   */
  async setBranchProtection(repoId: string, branch: string,
    config: BranchProtectionConfig): Promise<void>;

  // Private
  private async getOctokitForOrg(orgId: string): Promise<Octokit>;
  private async getOrgLogin(orgId: string): Promise<string>;
}
```

### TeamService

```typescript
class TeamService {
  constructor(private readonly db: PostgresJsDatabase) {}

  /** List all teams for an organization, sorted by name. */
  async listTeams(orgId: string): Promise<TeamInfo[]>;

  /**
   * Create a new team in the GitHub organization.
   * Calls octokit.teams.create() with privacy, permission, repos, maintainers.
   */
  async createTeam(orgId: string, input: CreateTeamInput): Promise<TeamInfo>;

  /**
   * Update an existing team's name, description, privacy, or permission.
   * Calls octokit.teams.updateInOrg().
   */
  async updateTeam(teamId: string, input: Partial<CreateTeamInput>): Promise<TeamInfo>;

  /**
   * Delete a team from GitHub and the database.
   * Calls octokit.teams.deleteInOrg().
   */
  async deleteTeam(teamId: string): Promise<void>;

  /**
   * Sync team membership from MUMS permission groups.
   * 1. Queries github_team_mums_mappings for the team's MUMS group
   * 2. Fetches current GitHub team members via octokit.paginate()
   * 3. Adds members in MUMS but not on GitHub
   * 4. Removes members on GitHub but not in MUMS
   * Returns { added, removed } counts.
   */
  async syncFromMums(teamId: string): Promise<{ added: number; removed: number }>;

  // Private
  private async getTeam(teamId: string): Promise<TeamInfo | null>;
  private async getOctokitForOrg(orgId: string): Promise<Octokit>;
  private async getOrgLogin(orgId: string): Promise<string>;
}
```

### MemberService

```typescript
class MemberService {
  constructor(private readonly db: PostgresJsDatabase) {}

  /** List all members of a GitHub organization, sorted by login. */
  async listMembers(orgId: string): Promise<MemberInfo[]>;

  /**
   * Add a member to a team.
   * Calls octokit.teams.addOrUpdateMembershipForUserInOrg().
   * Fetches user details via octokit.users.getByUsername().
   * Upserts member record in github_members table.
   */
  async addMember(teamId: string, input: AddTeamMemberInput): Promise<MemberInfo>;

  /**
   * Remove a member from a team.
   * Calls octokit.teams.removeMembershipForUserInOrg().
   */
  async removeMember(teamId: string, username: string): Promise<void>;

  /**
   * Sync all members from a GitHub team.
   * Uses octokit.paginate() for full member list.
   * Performs upsert: existing members updated, new members inserted.
   * Returns count of synced members.
   */
  async syncMembers(teamId: string): Promise<number>;

  // Private
  private async getTeamInfo(teamId: string): Promise<{ orgId: string; slug: string }>;
  private async getOctokitForOrg(orgId: string): Promise<Octokit>;
  private async getOrgLogin(orgId: string): Promise<string>;
}
```

### WorkflowService

```typescript
class WorkflowService {
  constructor(private readonly db: PostgresJsDatabase) {}

  /** List all workflows for a repository, sorted by name. */
  async listWorkflows(repoId: string): Promise<WorkflowInfo[]>;

  /** Get a single workflow by internal UUID. */
  async getWorkflow(workflowId: string): Promise<WorkflowInfo | null>;

  /**
   * Trigger a workflow dispatch event.
   * Calls octokit.actions.createWorkflowDispatch().
   * Requires: ref (branch/tag) and optional inputs.
   */
  async triggerWorkflow(workflowId: string, input: TriggerWorkflowInput): Promise<void>;

  /**
   * List runs for a workflow with optional filters.
   * Supports: branch, event, status, actor, pagination.
   * Sorted by created_at DESC.
   */
  async listRuns(workflowId: string, filters?: WorkflowRunFilters):
    Promise<{ items: WorkflowRunInfo[]; total: number }>;

  /** Get a single workflow run by internal UUID. */
  async getRun(runId: string): Promise<WorkflowRunInfo | null>;

  /**
   * Cancel a running workflow run.
   * Calls octokit.actions.cancelWorkflowRun().
   * Updates local DB status to 'completed' with conclusion 'cancelled'.
   */
  async cancelRun(runId: string): Promise<void>;

  /**
   * Re-run a failed workflow run.
   * Calls octokit.actions.reRunWorkflow().
   * Note: Does NOT update local DB — new run appears via sync or webhook.
   */
  async rerunWorkflow(runId: string): Promise<void>;

  /**
   * Sync workflows from a GitHub repository.
   * Calls octokit.actions.listRepoWorkflows() (up to 100).
   * Performs upsert on github_workflows table.
   * Returns count of synced workflows.
   */
  async syncWorkflows(repoId: string): Promise<number>;

  // Private
  private async getRepoInfo(repoId: string): Promise<{ orgId: string; fullName: string }>;
  private async getOctokitForOrg(orgId: string): Promise<Octokit>;
}
```

### PullRequestService

```typescript
class PullRequestService {
  constructor(private readonly db: PostgresJsDatabase) {}

  /**
   * List pull requests for a repository with optional filters.
   * Supports: state, author, base branch, label (ANY match), sort, pagination.
   */
  async listPRs(repoId: string, filters?: PRListFilters):
    Promise<{ items: PullRequestInfo[]; total: number }>;

  /** Get a single pull request by internal UUID. */
  async getPR(prId: string): Promise<PullRequestInfo | null>;

  /**
   * Create a new pull request.
   * Calls octokit.pulls.create() and persists full metadata to DB.
   * Handles SQL escaping for title and body (single-quote doubling).
   */
  async createPR(repoId: string, input: CreatePRInput): Promise<PullRequestInfo>;

  /**
   * Update a pull request's title, body, or base branch.
   * Calls octokit.pulls.update().
   */
  async updatePR(prId: string, input: Partial<CreatePRInput>): Promise<PullRequestInfo>;

  /**
   * Merge a pull request.
   * Supports merge methods: 'merge', 'squash' (default), 'rebase'.
   * Updates DB: state='closed', merged=true, merged_at=NOW(), closed_at=NOW().
   */
  async mergePR(prId: string, method?: MergeMethod): Promise<PullRequestInfo>;

  /**
   * Close a pull request without merging.
   * Calls octokit.pulls.update({ state: 'closed' }).
   * Updates DB: state='closed', closed_at=NOW().
   */
  async closePR(prId: string): Promise<PullRequestInfo>;

  /**
   * Sync pull requests from GitHub for a repository.
   * Uses octokit.paginate() with state='all'.
   * Performs upsert on github_pull_requests table.
   * Returns count of synced PRs.
   */
  async syncPRs(repoId: string): Promise<number>;

  // Private
  private async getRepoInfo(repoId: string): Promise<{ orgId: string; fullName: string }>;
  private async getOctokitForOrg(orgId: string): Promise<Octokit>;
}
```

### SecretsService

```typescript
class SecretsService {
  constructor(private readonly db: PostgresJsDatabase) {}

  /**
   * List secrets for an organization or repository.
   * Requires either orgId or repoId — throws if neither provided.
   * Org-level query: org_id=X AND repo_id IS NULL.
   */
  async listSecrets(orgId?: string, repoId?: string): Promise<SecretInfo[]>;

  /**
   * Set (create or update) a secret.
   * Flow:
   *   1. Fetch the repo/org public key from GitHub
   *   2. Encrypt the value using libsodium sealed box
   *   3. Call octokit.actions.createOrUpdate[Repo|Org]Secret()
   *   4. Upsert metadata record in github_secrets table
   *
   * Note: The plaintext value is NEVER stored in the database.
   */
  async setSecret(input: SetSecretInput): Promise<SecretInfo>;

  /**
   * Delete a secret from GitHub and the database.
   * Determines scope (org vs repo) from the local record.
   */
  async deleteSecret(id: string): Promise<void>;

  /**
   * Rotate a secret by generating/fetching a new value.
   * In production: fetch new value from external vault, then call setSecret.
   * Updates the updated_at timestamp to track rotation.
   */
  async rotateSecret(id: string): Promise<SecretInfo>;

  /**
   * Sync secrets from an external vault (e.g., HashiCorp Vault) to GitHub.
   * Reads mappings from github_vault_secret_mappings table.
   * For each mapping: fetch vault value → encrypt → push to GitHub.
   * Returns count of synced secrets.
   */
  async syncFromVault(orgId: string): Promise<number>;

  // Private
  private async setRepoSecret(input: SetSecretInput): Promise<void>;
  private async setOrgSecret(input: SetSecretInput): Promise<void>;
  private async encryptSecretValue(value: string, publicKey: string): Promise<string>;
  private async getRepoInfo(repoId: string): Promise<{ orgId: string; fullName: string }>;
  private async getOctokitForOrg(orgId: string): Promise<Octokit>;
  private async getOrgLogin(orgId: string): Promise<string>;
}
```

### CodeReviewService

```typescript
class CodeReviewService {
  constructor(private readonly db: PostgresJsDatabase) {}

  /**
   * Request reviews from specific GitHub users on a pull request.
   * Calls octokit.pulls.requestReviewers().
   * Updates reviewers array in github_pull_requests table.
   */
  async requestReview(prId: string, reviewers: string[]): Promise<void>;

  /**
   * Submit a review on a pull request.
   * Supports events: 'APPROVE', 'REQUEST_CHANGES', 'COMMENT'.
   * Optionally includes inline file comments with path/line/body.
   */
  async submitReview(prId: string, input: PRReviewInput): Promise<void>;

  /**
   * List all reviews on a pull request (fetched live from GitHub).
   * Returns: id, user, state, body, submittedAt, htmlUrl.
   */
  async listReviews(prId: string): Promise<Array<{
    id: number;
    user: string;
    state: string;
    body: string;
    submittedAt: string;
    htmlUrl: string;
  }>>;

  /**
   * Add a single review comment on a specific file/line.
   * Calls octokit.pulls.createReviewComment().
   * Persists to github_review_comments table.
   */
  async addComment(prId: string, input: {
    body: string;
    path: string;
    line?: number;
    commitId: string;
  }): Promise<CodeReviewComment>;

  // Private
  private async getPRInfo(prId: string): Promise<{ repoId: string; number: number }>;
  private async getRepoInfo(repoId: string): Promise<{ orgId: string; fullName: string }>;
  private async getOctokitForOrg(orgId: string): Promise<Octokit>;
}
```

---

## 8. Client Hooks — Detailed API

All hooks follow the **injection pattern**: they accept function references for data operations rather than coupling directly to a transport layer. This allows the consuming application to wire up tRPC, REST, GraphQL, or any other transport.

All hooks are React client components (`'use client'`) using `useState` and `useCallback`.

### useRepos

```typescript
interface UseReposOptions {
  listFn: (input: { orgId: string; filters?: RepoListFilters }) =>
    Promise<{ items: RepoInfo[]; total: number }>;
  createFn?: (input: { orgId: string; name: string; description?: string; visibility?: string }) =>
    Promise<RepoInfo>;
}

interface UseReposReturn {
  repos: RepoInfo[];              // Current loaded repositories
  total: number;                  // Total count (for pagination)
  isLoading: boolean;             // List operation in progress
  error: string | null;           // Last error message
  loadRepos: (orgId: string, filters?: RepoListFilters) => Promise<void>;
  createRepo: (orgId: string, name: string, description?: string, visibility?: string) =>
    Promise<RepoInfo>;
  isCreating: boolean;            // Create operation in progress
}

function useRepos(options: UseReposOptions): UseReposReturn;
```

### usePullRequests

```typescript
interface UsePullRequestsOptions {
  listFn: (input: { repoId: string; filters?: PRListFilters }) =>
    Promise<{ items: PullRequestInfo[]; total: number }>;
  mergeFn?: (input: { prId: string; method?: string }) => Promise<PullRequestInfo>;
}

interface UsePullRequestsReturn {
  pullRequests: PullRequestInfo[];
  total: number;
  isLoading: boolean;
  error: string | null;
  loadPRs: (repoId: string, filters?: PRListFilters) => Promise<void>;
  mergePR: (prId: string, method?: string) => Promise<PullRequestInfo>;
  isMerging: boolean;
}

function usePullRequests(options: UsePullRequestsOptions): UsePullRequestsReturn;
```

### useIssues

```typescript
interface UseIssuesOptions {
  listFn: (input: { repoId: string; filters?: IssueListFilters }) =>
    Promise<{ items: IssueInfo[]; total: number }>;
  createFn?: (input: {
    repoId: string; title: string; body?: string;
    labels?: string[]; assignees?: string[];
  }) => Promise<IssueInfo>;
}

interface UseIssuesReturn {
  issues: IssueInfo[];
  total: number;
  isLoading: boolean;
  error: string | null;
  loadIssues: (repoId: string, filters?: IssueListFilters) => Promise<void>;
  createIssue: (repoId: string, title: string, body?: string,
    labels?: string[], assignees?: string[]) => Promise<IssueInfo>;
  isCreating: boolean;
}

function useIssues(options: UseIssuesOptions): UseIssuesReturn;
```

### useWorkflows

```typescript
interface UseWorkflowsOptions {
  listFn: (input: { repoId: string }) => Promise<WorkflowInfo[]>;
  listRunsFn?: (input: { workflowId: string; filters?: WorkflowRunFilters }) =>
    Promise<{ items: WorkflowRunInfo[]; total: number }>;
  triggerFn?: (input: { workflowId: string; ref: string;
    inputs?: Record<string, string> }) => Promise<void>;
}

interface UseWorkflowsReturn {
  workflows: WorkflowInfo[];
  runs: WorkflowRunInfo[];
  totalRuns: number;
  isLoading: boolean;
  isLoadingRuns: boolean;
  error: string | null;
  loadWorkflows: (repoId: string) => Promise<void>;
  loadRuns: (workflowId: string, filters?: WorkflowRunFilters) => Promise<void>;
  triggerWorkflow: (workflowId: string, ref: string,
    inputs?: Record<string, string>) => Promise<void>;
  isTriggering: boolean;
}

function useWorkflows(options: UseWorkflowsOptions): UseWorkflowsReturn;
```

### useDeployments

```typescript
interface UseDeploymentsOptions {
  listFn: (input: { repoId: string; environment?: string }) => Promise<DeploymentInfo[]>;
  createFn?: (input: { repoId: string } & CreateDeploymentInput) => Promise<DeploymentInfo>;
}

interface UseDeploymentsReturn {
  deployments: DeploymentInfo[];
  isLoading: boolean;
  error: string | null;
  loadDeployments: (repoId: string, environment?: string) => Promise<void>;
  createDeployment: (repoId: string, input: CreateDeploymentInput) => Promise<DeploymentInfo>;
  isCreating: boolean;
}

function useDeployments(options: UseDeploymentsOptions): UseDeploymentsReturn;
```

---

## 9. Webhook Integration

### Signature Verification

The webhook middleware provides HMAC-SHA256 signature validation with constant-time comparison to prevent timing attacks.

```typescript
import { createHmac } from 'node:crypto';

// ── Direct validation function ──────────────────────────────────────
function validateGitHubSignature(
  secret: string,
  signature: string,    // x-hub-signature-256 header value
  payload: string       // Raw request body
): boolean;

// ── Middleware factory ──────────────────────────────────────────────
interface GitHubWebhookOptions {
  /** The webhook secret (or an async function returning it) */
  secret: string | (() => string | Promise<string>);
  /** Allow unsigned requests in development (NODE_ENV=development) */
  allowUnsignedInDev?: boolean;
}

function createGitHubWebhookValidator(options: GitHubWebhookOptions):
  (req: { headers: Record<string, string | string[] | undefined>;
           body?: string | Record<string, unknown> }) => Promise<boolean>;
```

### Signature Algorithm

1. GitHub sends the `X-Hub-Signature-256` header as `sha256=<hex_digest>`
2. The middleware computes `HMAC-SHA256(secret, raw_body)` and produces a hex digest
3. Comparison uses a custom constant-time `timingSafeEqual()` function:
   - If lengths differ: XOR the length values and iterate with modular indexing
   - If lengths match: XOR every character code pair and accumulate
   - Result is `0` only if all bytes match

### Supported Webhook Event Types

| Event | Actions | MCV Behavior |
|---|---|---|
| `push` | Commits pushed to any branch | Update repo `pushed_at`, sync commit metadata |
| `pull_request` | opened, closed, reopened, synchronize, edited, review_requested, labeled, unlabeled, assigned, unassigned | Upsert `github_pull_requests` record |
| `workflow_run` | requested, completed, in_progress | Upsert `github_workflow_runs` record |
| `issues` | opened, closed, etc. | Forward to issue tracking |
| `deployment` | created, status updated | Upsert `github_deployments` record |
| `check_run` | created, completed | Update CI status on PR |
| `pull_request_review` | submitted, edited, dismissed | Update review tracking |
| `create` / `delete` | Branch/tag lifecycle events | Track branch creation/deletion |
| `release` | published, edited | Track release metadata |

---

## 10. Branch Protection Presets

Three pre-built `BranchProtectionConfig` objects for common workflows:

### STRICT_BRANCH_PROTECTION (Production/Main)

```typescript
const STRICT_BRANCH_PROTECTION: BranchProtectionConfig = {
  requiredReviews: {
    requiredApprovingReviewCount: 2,        // Two approvals minimum
    dismissStaleReviews: true,               // New push = stale reviews dismissed
    requireCodeOwnerReviews: true,           // CODEOWNERS file enforced
  },
  requiredStatusChecks: {
    strict: true,                            // Branch must be up-to-date with base
    contexts: ['ci/build', 'ci/test', 'ci/lint'],
  },
  enforceAdmins: true,                       // Admins follow the same rules
  requiredLinearHistory: true,               // No merge commits (squash/rebase only)
  allowForcePushes: false,                   // Never allow force push
  allowDeletions: false,                     // Cannot delete the branch
};
```

**Use for:** `main`, `master`, `release/*` branches.

### STANDARD_BRANCH_PROTECTION (Develop/Staging)

```typescript
const STANDARD_BRANCH_PROTECTION: BranchProtectionConfig = {
  requiredReviews: {
    requiredApprovingReviewCount: 1,        // One approval sufficient
    dismissStaleReviews: true,
    requireCodeOwnerReviews: false,          // CODEOWNERS not enforced
  },
  requiredStatusChecks: {
    strict: false,                           // Branch doesn't need to be up-to-date
    contexts: ['ci/build', 'ci/test'],
  },
  enforceAdmins: false,                     // Admins can bypass
  requiredLinearHistory: false,              // Merge commits allowed
  allowForcePushes: false,
  allowDeletions: false,
};
```

**Use for:** `develop`, `staging`, `next` branches.

### RELAXED_BRANCH_PROTECTION (Feature Branches)

```typescript
const RELAXED_BRANCH_PROTECTION: BranchProtectionConfig = {
  requiredReviews: {
    requiredApprovingReviewCount: 1,        // One approval
    dismissStaleReviews: false,              // Stale reviews kept
    requireCodeOwnerReviews: false,
  },
  enforceAdmins: false,
  requiredLinearHistory: false,
  allowForcePushes: true,                   // Rebase/amend allowed
  allowDeletions: true,                     // Branch can be deleted
};
```

**Use for:** `feature/*`, `bugfix/*`, `hotfix/*` branches.

### Comparison Matrix

| Setting | Strict | Standard | Relaxed |
|---|:---:|:---:|:---:|
| Required reviews | 2 | 1 | 1 |
| Dismiss stale reviews | ✅ | ✅ | ❌ |
| CODEOWNERS required | ✅ | ❌ | ❌ |
| Status checks | 3 (strict) | 2 (non-strict) | none |
| Enforce on admins | ✅ | ❌ | ❌ |
| Linear history | ✅ | ❌ | ❌ |
| Force pushes | ❌ | ❌ | ✅ |
| Branch deletions | ❌ | ❌ | ✅ |

---

## 11. Constants & Configuration

```typescript
// ── Pagination ────────────────────────────────────────────────────────
const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

// ── Repository Defaults ──────────────────────────────────────────────
const DEFAULT_BRANCH = 'main';
const DEFAULT_REPO_VISIBILITY = 'private' as const;

// ── Team Defaults ────────────────────────────────────────────────────
const DEFAULT_TEAM_PRIVACY = 'closed' as const;
const DEFAULT_TEAM_PERMISSION = 'push' as const;

// ── Merge ────────────────────────────────────────────────────────────
const DEFAULT_MERGE_METHOD = 'squash' as const;
const MERGE_METHODS = ['merge', 'squash', 'rebase'] as const;
type MergeMethod = (typeof MERGE_METHODS)[number];

// ── API ──────────────────────────────────────────────────────────────
const GITHUB_API_BASE_URL = 'https://api.github.com';

// ── Webhook Events ───────────────────────────────────────────────────
const SUPPORTED_WEBHOOK_EVENTS = [
  'push',                   // Commits pushed to branch
  'pull_request',           // PR opened/closed/synced/edited
  'workflow_run',           // Actions workflow started/completed
  'issues',                 // Issue opened/closed
  'deployment',             // Deployment created/updated
  'check_run',              // CI check started/completed
  'pull_request_review',    // Review submitted/dismissed
  'create',                 // Branch/tag created
  'delete',                 // Branch/tag deleted
  'release',                // Release published/edited
] as const;

// ── Default Repository Settings ──────────────────────────────────────
const DEFAULT_REPO_SETTINGS = {
  hasIssues: true,
  hasProjects: true,
  hasWiki: false,                    // Disabled by default (use MCV docs)
  allowSquashMerge: true,
  allowMergeCommit: true,
  allowRebaseMerge: true,
  allowAutoMerge: false,             // Disabled by default for safety
  deleteBranchOnMerge: true,         // Clean up merged branches
};

// ── Secret Visibility ────────────────────────────────────────────────
const SECRET_VISIBILITY_OPTIONS = ['all', 'private', 'selected'] as const;
```

---

## 12. Code Examples

### Example 1: Register a GitHub Organization

```typescript
import { OrganizationService } from '@mcv/github/server';

const orgService = new OrganizationService(db);

// Register org after GitHub App installation
const org = await orgService.registerOrganization({
  ventureId: 'venture-uuid-123',
  login: 'mcv-ventures',
  installationId: 12345,
  accessToken: 'ghs_xxxxxxxxxxxxxxxxxxxx',
});

console.log(`Registered: ${org.login}`);
console.log(`Public repos: ${org.publicRepos}`);
console.log(`Private repos: ${org.totalPrivateRepos}`);
console.log(`Plan: ${org.plan}`);
// Registered: mcv-ventures
// Public repos: 12
// Private repos: 45
// Plan: team
```

### Example 2: Create a Repository with Branch Protection

```typescript
import { RepositoryService } from '@mcv/github/server';
import { STRICT_BRANCH_PROTECTION } from '@mcv/github';

const repoService = new RepositoryService(db);

// Create the repository
const repo = await repoService.createRepository(orgId, {
  name: 'order-service',
  description: 'Microservice for order processing and fulfillment',
  visibility: 'private',
  autoInit: true,
  gitignoreTemplate: 'Node',
  licenseTemplate: 'mit',
  hasIssues: true,
  hasWiki: false,
});

console.log(`Created: ${repo.fullName} (${repo.visibility})`);
// Created: mcv-ventures/order-service (private)

// Apply strict branch protection to main
await repoService.setBranchProtection(repo.id, 'main', STRICT_BRANCH_PROTECTION);
console.log('Branch protection applied: 2 reviews, CODEOWNERS, CI checks');
```

### Example 3: Sync Repositories and Filter Results

```typescript
import { RepositoryService } from '@mcv/github/server';

const repoService = new RepositoryService(db);

// Full sync from GitHub (paginated, upsert)
const synced = await repoService.syncRepositories(orgId);
console.log(`Synced ${synced} repositories from GitHub`);

// Query with filters
const { items: tsRepos, total } = await repoService.listRepositories(orgId, {
  language: 'TypeScript',
  visibility: 'private',
  archived: false,
  sort: 'pushed',
  direction: 'desc',
  page: 1,
  pageSize: 10,
});

console.log(`${total} TypeScript private repos, showing first ${tsRepos.length}`);
for (const repo of tsRepos) {
  console.log(`  ${repo.name} — ${repo.stargazersCount}★ — pushed ${repo.pushedAt}`);
}
```

### Example 4: Create a Team and Sync from MUMS

```typescript
import { TeamService } from '@mcv/github/server';

const teamService = new TeamService(db);

// Create the team in GitHub
const team = await teamService.createTeam(orgId, {
  name: 'backend-engineers',
  description: 'Backend engineering team',
  privacy: 'closed',
  permission: 'push',
  repoNames: ['order-service', 'payment-service'],
  maintainers: ['lead-dev-username'],
});

console.log(`Created team: ${team.name} (${team.slug})`);
console.log(`Members: ${team.membersCount}, Repos: ${team.reposCount}`);

// Sync membership from MUMS permission groups
const result = await teamService.syncFromMums(team.id);
console.log(`MUMS sync: +${result.added} added, -${result.removed} removed`);
```

### Example 5: Manage Organization Members

```typescript
import { MemberService } from '@mcv/github/server';

const memberService = new MemberService(db);

// List all org members
const members = await memberService.listMembers(orgId);
console.log(`${members.length} members in org`);

// Add a developer to a team
const newMember = await memberService.addMember(teamId, {
  username: 'new-developer',
  role: 'member',
});
console.log(`Added: ${newMember.login} (GitHub ID: ${newMember.githubUserId})`);

// Sync team members from GitHub
const synced = await memberService.syncMembers(teamId);
console.log(`Synced ${synced} members from GitHub`);
```

### Example 6: Create and Merge a Pull Request

```typescript
import { PullRequestService } from '@mcv/github/server';

const prService = new PullRequestService(db);

// Create PR
const pr = await prService.createPR(repoId, {
  title: 'feat: add order validation logic',
  body: `## Summary\nImplements comprehensive order validation.\n\nCloses #42`,
  head: 'feature/order-validation',
  base: 'main',
  draft: false,
  maintainerCanModify: true,
});

console.log(`PR #${pr.number}: ${pr.title}`);
console.log(`${pr.additions}+ / ${pr.deletions}- across ${pr.changedFiles} files`);

// After review approval, merge with squash
const merged = await prService.mergePR(pr.id, 'squash');
console.log(`Merged at ${merged.mergedAt}`);
```

### Example 7: Submit a Code Review

```typescript
import { CodeReviewService } from '@mcv/github/server';

const reviewService = new CodeReviewService(db);

// Request reviews
await reviewService.requestReview(prId, ['reviewer-1', 'reviewer-2']);

// Submit review with inline comments
await reviewService.submitReview(prId, {
  event: 'REQUEST_CHANGES',
  body: 'Needs a few changes before merge.',
  comments: [
    {
      path: 'src/validators/order.ts',
      line: 42,
      body: 'This validation should also check for negative quantities.',
    },
    {
      path: 'src/validators/order.ts',
      line: 78,
      body: 'Consider extracting this into a separate helper function.',
    },
  ],
});

// List all reviews
const reviews = await reviewService.listReviews(prId);
for (const review of reviews) {
  console.log(`${review.user}: ${review.state} — ${review.body}`);
}
```

### Example 8: Trigger and Monitor a Workflow

```typescript
import { WorkflowService } from '@mcv/github/server';

const workflowService = new WorkflowService(db);

// Sync workflows from GitHub
const synced = await workflowService.syncWorkflows(repoId);
console.log(`Found ${synced} workflows`);

// Get all workflows
const workflows = await workflowService.listWorkflows(repoId);
const ciWorkflow = workflows.find(w => w.name === 'CI Pipeline');

// Trigger workflow with custom inputs
await workflowService.triggerWorkflow(ciWorkflow!.id, {
  ref: 'main',
  inputs: {
    environment: 'staging',
    version: '1.2.3',
    run_e2e: 'true',
  },
});

// Monitor recent runs
const { items: runs } = await workflowService.listRuns(ciWorkflow!.id, {
  status: 'completed',
  branch: 'main',
  pageSize: 5,
});

for (const run of runs) {
  const emoji = run.conclusion === 'success' ? '✅' : '❌';
  console.log(`${emoji} Run #${run.runNumber}: ${run.conclusion} (${run.headBranch})`);
}

// Cancel a stuck run
const stuckRuns = await workflowService.listRuns(ciWorkflow!.id, {
  status: 'in_progress',
});
if (stuckRuns.items.length > 0) {
  await workflowService.cancelRun(stuckRuns.items[0]!.id);
  console.log('Cancelled stuck run');
}
```

### Example 9: Manage Actions Secrets

```typescript
import { SecretsService } from '@mcv/github/server';

const secretsService = new SecretsService(db);

// Set org-level secret (visible to private repos)
await secretsService.setSecret({
  name: 'DEPLOY_TOKEN',
  value: 'ghp_xxxxxxxxxxxxxxxxxxxx',
  orgId: orgId,
  visibility: 'private',
});

// Set repo-level secret
await secretsService.setSecret({
  name: 'DATABASE_URL',
  value: 'postgresql://user:pass@host:5432/db',
  repoId: repoId,
});

// List secrets (metadata only — values never returned)
const orgSecrets = await secretsService.listSecrets(orgId);
const repoSecrets = await secretsService.listSecrets(undefined, repoId);
console.log(`Org secrets: ${orgSecrets.map(s => s.name).join(', ')}`);
console.log(`Repo secrets: ${repoSecrets.map(s => s.name).join(', ')}`);

// Rotate a secret
await secretsService.rotateSecret(orgSecrets[0]!.id);

// Sync from external vault
const vaultSynced = await secretsService.syncFromVault(orgId);
console.log(`Synced ${vaultSynced} secrets from vault`);
```

### Example 10: Webhook Middleware Setup

```typescript
import { createGitHubWebhookValidator } from '@mcv/github/server';

const validate = createGitHubWebhookValidator({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
  allowUnsignedInDev: true,  // Skip validation in development
});

app.post('/api/webhooks/github', async (req, res) => {
  // Step 1: Validate signature
  const isValid = await validate(req);
  if (!isValid) {
    console.error('Invalid webhook signature');
    return res.status(403).send('Invalid signature');
  }

  // Step 2: Parse event
  const event = req.headers['x-github-event'] as string;
  const deliveryId = req.headers['x-github-delivery'] as string;
  const payload = req.body;

  console.log(`Webhook: ${event} (delivery: ${deliveryId})`);

  // Step 3: Route to handler
  switch (event) {
    case 'push':
      await handlePushEvent(payload);
      break;
    case 'pull_request':
      await handlePREvent(payload);
      break;
    case 'workflow_run':
      await handleWorkflowEvent(payload);
      break;
    case 'deployment':
      await handleDeploymentEvent(payload);
      break;
    default:
      console.log(`Unhandled event: ${event}`);
  }

  res.status(200).send('OK');
});
```

### Example 11: Direct Signature Validation

```typescript
import { validateGitHubSignature } from '@mcv/github/server';

// Use when you need fine-grained control over validation
function validateRequest(req: Request): boolean {
  const signature = req.headers.get('x-hub-signature-256');
  if (!signature) return false;

  const rawBody = req.text();  // Must be the raw body string

  return validateGitHubSignature(
    process.env.GITHUB_WEBHOOK_SECRET!,
    signature,
    rawBody,
  );
}
```

### Example 12: Repository Settings Update

```typescript
import { RepositoryService } from '@mcv/github/server';

const repoService = new RepositoryService(db);

// Configure merge strategies and cleanup behavior
await repoService.updateRepository(repoId, {
  allowSquashMerge: true,         // Primary merge strategy
  allowMergeCommit: false,        // Disable merge commits
  allowRebaseMerge: true,         // Allow rebase for linear history
  allowAutoMerge: true,           // Enable auto-merge when checks pass
  deleteBranchOnMerge: true,      // Auto-cleanup merged branches
  hasWiki: false,                 // Use MCV docs instead
  defaultBranch: 'main',
});

console.log('Repository settings updated');
```

### Example 13: React Hook Usage — Repository Browser

```tsx
import { useRepos } from '@mcv/github/client';
import { trpc } from '~/utils/trpc';

function RepoBrowser({ orgId }: { orgId: string }) {
  const { repos, total, isLoading, error, loadRepos, createRepo, isCreating } = useRepos({
    listFn: (input) => trpc.github.repos.list.query(input),
    createFn: (input) => trpc.github.repos.create.mutate(input),
  });

  useEffect(() => {
    loadRepos(orgId, { visibility: 'private', sort: 'pushed', direction: 'desc' });
  }, [orgId]);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div>
      <h2>{total} Repositories</h2>
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
      <CreateRepoButton
        orgId={orgId}
        onSubmit={createRepo}
        isCreating={isCreating}
      />
    </div>
  );
}
```

### Example 14: React Hook Usage — CI/CD Monitor

```tsx
import { useWorkflows } from '@mcv/github/client';
import { trpc } from '~/utils/trpc';

function CIPipeline({ repoId }: { repoId: string }) {
  const {
    workflows, runs, totalRuns, isLoading, isLoadingRuns, error,
    loadWorkflows, loadRuns, triggerWorkflow, isTriggering,
  } = useWorkflows({
    listFn: (input) => trpc.github.workflows.list.query(input),
    listRunsFn: (input) => trpc.github.workflows.listRuns.query(input),
    triggerFn: (input) => trpc.github.workflows.trigger.mutate(input),
  });

  useEffect(() => { loadWorkflows(repoId); }, [repoId]);

  const [selectedWf, setSelectedWf] = useState<string | null>(null);

  useEffect(() => {
    if (selectedWf) loadRuns(selectedWf, { pageSize: 10 });
  }, [selectedWf]);

  return (
    <div>
      <WorkflowList workflows={workflows} onSelect={setSelectedWf} />
      {selectedWf && (
        <>
          <RunHistory runs={runs} total={totalRuns} isLoading={isLoadingRuns} />
          <TriggerButton
            onTrigger={() => triggerWorkflow(selectedWf, 'main')}
            isTriggering={isTriggering}
          />
        </>
      )}
    </div>
  );
}
```

### Example 15: React Hook Usage — Deployment Dashboard

```tsx
import { useDeployments } from '@mcv/github/client';
import { trpc } from '~/utils/trpc';

function DeploymentDashboard({ repoId }: { repoId: string }) {
  const { deployments, isLoading, error, loadDeployments, createDeployment, isCreating } =
    useDeployments({
      listFn: (input) => trpc.github.deployments.list.query(input),
      createFn: (input) => trpc.github.deployments.create.mutate(input),
    });

  useEffect(() => { loadDeployments(repoId); }, [repoId]);

  const handleDeploy = async () => {
    await createDeployment(repoId, {
      ref: 'main',
      environment: 'production',
      description: 'Production release v1.2.3',
      productionEnvironment: true,
      requiredContexts: ['ci/build', 'ci/test'],
    });
  };

  return (
    <div>
      <DeployButton onClick={handleDeploy} isCreating={isCreating} />
      <DeploymentList deployments={deployments} isLoading={isLoading} />
    </div>
  );
}
```

---

## 13. Data Sync Lifecycle

All sync operations follow the same **paginate-then-upsert** pattern:

```
┌─────────────────────────┐
│  1. Get Octokit instance│
│     for the org         │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│  2. Paginate through    │
│     GitHub REST API     │
│     (100 per page)      │
│                         │
│     octokit.paginate()  │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│  3. For each record:    │
│                         │
│     SELECT id           │
│     FROM github_*       │
│     WHERE github_id = X │
│     LIMIT 1             │
│                         │
│     ┌─── EXISTS? ───┐   │
│     │               │   │
│   ┌─▼──┐        ┌──▼─┐ │
│   │ UP │        │ IN │ │
│   │DATE│        │SERT│ │
│   └─┬──┘        └──┬─┘ │
│     │               │   │
│     └───────┬───────┘   │
│             │           │
│     synced++            │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│  4. Return synced count │
└─────────────────────────┘
```

### Sync Methods Reference

| Service | Method | Paginated? | Per-Page | Entity |
|---|---|---|---|---|
| `RepositoryService` | `syncRepositories(orgId)` | ✅ `octokit.paginate` | 100 | Repositories |
| `WorkflowService` | `syncWorkflows(repoId)` | ❌ Single call | 100 | Workflows |
| `PullRequestService` | `syncPRs(repoId)` | ✅ `octokit.paginate` | 100 | Pull requests |
| `MemberService` | `syncMembers(teamId)` | ✅ `octokit.paginate` | 100 | Team members |
| `OrganizationService` | `syncOrganization(id)` | ❌ Single call | N/A | Organization details |
| `TeamService` | `syncFromMums(teamId)` | ✅ GitHub + MUMS | 100 | Team membership |
| `SecretsService` | `syncFromVault(orgId)` | ❌ Vault mappings | N/A | Secret values |

---

## 14. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GITHUB_APP_ID` | Yes | — | GitHub App ID for authentication |
| `GITHUB_APP_PRIVATE_KEY` | Yes | — | GitHub App private key (PEM format, multiline) |
| `GITHUB_WEBHOOK_SECRET` | Yes | — | Webhook HMAC secret (should be ≥32 random chars) |
| `GITHUB_CLIENT_ID` | For OAuth | — | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | For OAuth | — | GitHub OAuth App client secret |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `NODE_ENV` | No | `production` | Set to `development` for `allowUnsignedInDev` |

### Secret Rotation

- `GITHUB_APP_PRIVATE_KEY`: Rotate via GitHub App settings → Generate a new private key → Update env var → Delete old key
- `GITHUB_WEBHOOK_SECRET`: Update in both GitHub webhook settings and the env var simultaneously to avoid signature validation failures
- `GITHUB_CLIENT_SECRET`: Rotate via GitHub OAuth App settings → Generate new secret → Update env var

---

## 15. Error Codes & Error Handling

### Application Error Codes

| Code | HTTP Status | Description | Recovery |
|---|---|---|---|
| `ORG_NOT_FOUND` | 404 | GitHub organization not found in DB | Verify org ID, check registration |
| `REPO_NOT_FOUND` | 404 | Repository not found in DB | Verify repo ID, run sync |
| `TEAM_NOT_FOUND` | 404 | Team not found in DB | Verify team ID, run sync |
| `PR_NOT_FOUND` | 404 | Pull request not found in DB | Verify PR ID, run sync |
| `WORKFLOW_NOT_FOUND` | 404 | Workflow not found in DB | Verify workflow ID, run sync |
| `RUN_NOT_FOUND` | 404 | Workflow run not found in DB | Verify run ID |
| `SECRET_NOT_FOUND` | 404 | Secret not found in DB | Verify secret ID |
| `NO_CREDENTIALS` | 401 | No access token for organization | Re-install GitHub App |
| `INVALID_SIGNATURE` | 403 | Webhook HMAC validation failed | Check webhook secret config |
| `GITHUB_API_ERROR` | 502 | Upstream GitHub API error | Check GitHub status, retry |
| `RATE_LIMITED` | 429 | GitHub API rate limit exceeded | Wait for rate limit reset |
| `INVALID_INPUT` | 400 | Missing orgId or repoId for secrets | Provide required parameters |

### GitHub API Error Mapping

| GitHub HTTP Status | Meaning | MCV Handling |
|---|---|---|
| 401 | Bad credentials | Throw `NO_CREDENTIALS`, suggest re-auth |
| 403 | Forbidden / rate limited | Check `X-RateLimit-Remaining`, throw `RATE_LIMITED` if 0 |
| 404 | Resource not found | Throw entity-specific `*_NOT_FOUND` |
| 409 | Merge conflict | Return `mergeable: false` on PR |
| 422 | Validation failed | Pass through GitHub's error message |
| 502/503 | GitHub infrastructure | Retry with exponential backoff |

### Error Patterns in Services

All services throw standard `Error` instances with descriptive messages:

```typescript
// Entity not found
throw new Error(`Organization ${id} not found`);
throw new Error(`Repository ${id} not found`);
throw new Error(`Team ${teamId} not found`);
throw new Error(`Pull request ${prId} not found`);
throw new Error(`Workflow ${workflowId} not found`);
throw new Error(`Workflow run ${runId} not found`);
throw new Error(`Secret ${id} not found`);

// Credential errors
throw new Error(`No credentials found for organization ${orgId}`);

// Input validation
throw new Error('Either orgId or repoId must be provided');
throw new Error('createFn not provided');     // Client hooks
throw new Error('mergeFn not provided');      // Client hooks
throw new Error('triggerFn not provided');    // Client hooks
```

---

## 16. Audit Events

| Event | Trigger | Payload Data |
|---|---|---|
| `github.org.registered` | Org registered via `registerOrganization()` | `{ ventureId, login, githubOrgId }` |
| `github.org.synced` | Org data synced via `syncOrganization()` | `{ orgId, login }` |
| `github.org.settings_updated` | Settings changed via `updateSettings()` | `{ orgId, login, changes }` |
| `github.repo.created` | Repo created via `createRepository()` | `{ orgId, name, visibility, fullName }` |
| `github.repo.updated` | Settings changed via `updateRepository()` | `{ repoId, name, changes }` |
| `github.repo.archived` | Repo archived via `archiveRepository()` | `{ repoId, name }` |
| `github.repo.deleted` | Repo deleted via `deleteRepository()` | `{ repoId, name, fullName }` |
| `github.repo.synced` | Repos synced via `syncRepositories()` | `{ orgId, count }` |
| `github.branch.protected` | Protection applied via `setBranchProtection()` | `{ repoId, branch, config }` |
| `github.team.created` | Team created via `createTeam()` | `{ orgId, name, slug, privacy }` |
| `github.team.updated` | Team updated via `updateTeam()` | `{ teamId, name, changes }` |
| `github.team.deleted` | Team deleted via `deleteTeam()` | `{ teamId, name }` |
| `github.team.mums_synced` | MUMS sync via `syncFromMums()` | `{ teamId, added, removed }` |
| `github.member.added` | Member added via `addMember()` | `{ teamId, username, role }` |
| `github.member.removed` | Member removed via `removeMember()` | `{ teamId, username }` |
| `github.member.synced` | Members synced via `syncMembers()` | `{ teamId, count }` |
| `github.pr.created` | PR created via `createPR()` | `{ repoId, number, title, head, base }` |
| `github.pr.updated` | PR updated via `updatePR()` | `{ prId, number, changes }` |
| `github.pr.merged` | PR merged via `mergePR()` | `{ repoId, number, method, mergedAt }` |
| `github.pr.closed` | PR closed via `closePR()` | `{ repoId, number }` |
| `github.pr.synced` | PRs synced via `syncPRs()` | `{ repoId, count }` |
| `github.review.requested` | Review requested via `requestReview()` | `{ prId, reviewers }` |
| `github.review.submitted` | Review submitted via `submitReview()` | `{ prId, event, hasComments }` |
| `github.review.commented` | Comment added via `addComment()` | `{ prId, path, line }` |
| `github.workflow.triggered` | Workflow dispatched via `triggerWorkflow()` | `{ workflowId, ref, inputs }` |
| `github.workflow.cancelled` | Run cancelled via `cancelRun()` | `{ runId, githubRunId }` |
| `github.workflow.rerun` | Run re-triggered via `rerunWorkflow()` | `{ runId, githubRunId }` |
| `github.workflow.synced` | Workflows synced via `syncWorkflows()` | `{ repoId, count }` |
| `github.secret.set` | Secret created/updated via `setSecret()` | `{ name, level: 'org'\|'repo', visibility }` |
| `github.secret.deleted` | Secret deleted via `deleteSecret()` | `{ name, level }` |
| `github.secret.rotated` | Secret rotated via `rotateSecret()` | `{ name, level }` |
| `github.secret.vault_synced` | Vault sync via `syncFromVault()` | `{ orgId, count }` |
| `github.webhook.received` | Valid webhook received | `{ event, deliveryId, repo }` |
| `github.webhook.rejected` | Invalid webhook signature | `{ event, deliveryId, remoteIp }` |

---

## 17. Performance Considerations

| Area | Implementation | Details |
|---|---|---|
| **Pagination** | Default 30, max 100 per page | Consistent across all list operations; prevents unbounded queries |
| **Sync Pagination** | `octokit.paginate()` | Automatic GitHub API pagination for full syncs; fetches all pages sequentially |
| **Upsert Pattern** | SELECT existing → INSERT or UPDATE | Prevents duplicates during sync; one round-trip per entity |
| **Merge Method Default** | `squash` | Cleaner git history; configurable per-merge |
| **Rate Limiting** | GitHub API: 5,000 req/hr (authenticated) | Consider batching sync operations; monitor `X-RateLimit-Remaining` header |
| **Concurrent Sync** | Sequential per entity | Prevents race conditions during upsert; trade-off is slower syncs for large orgs |
| **Index Coverage** | 9+ indexes on `github_repositories` | Optimized for admin panel filtering by org, visibility, language, status, category, name |
| **Workflow Runs** | 8 indexes on `github_workflow_runs` | Covers all filter dimensions: status, conclusion, branch, event, created_at |
| **JSONB Fields** | `topics`, `settings`, `environments`, `labels`, `assignees` | Flexible schema; consider GIN indexes if querying JSONB frequently |
| **Secret Encryption** | libsodium sealed box per-call | Public key fetched from GitHub each time; consider caching the key briefly |

### Optimization Recommendations

1. **Batch Sync:** Run `syncRepositories()` during off-peak hours for large orgs (100+ repos).
2. **Webhook-Driven Updates:** Prefer webhook events over polling/syncing for real-time state changes.
3. **Connection Pooling:** The `PostgresJsDatabase` instance should use connection pooling (built into postgres.js).
4. **Rate Limit Awareness:** For orgs with many repos, a full sync can consume 1-2 API calls per repo. Monitor rate limits.
5. **Selective Sync:** Consider adding `since` parameter to sync only recently updated repos.

---

## 18. Security Considerations

| Concern | Mitigation | Status |
|---|---|---|
| **Credential Storage** | `access_token_encrypted` column — encrypted at rest with application-level encryption | ✅ Implemented |
| **Webhook Verification** | HMAC-SHA256 with custom constant-time comparison (timing attack resistant) | ✅ Implemented |
| **Secret Encryption** | Secrets encrypted with NaCl sealed box (libsodium) before sending to GitHub API | ⚠️ Placeholder (base64 in dev) |
| **Dev Mode Bypass** | `allowUnsignedInDev` option for webhook validation; only active when `NODE_ENV=development` | ✅ Gated by env |
| **SQL Injection** | ⚠️ **CRITICAL:** Current services use string interpolation for SQL queries | 🔴 Migrate to parameterized queries |
| **Token Scope** | Octokit instances scoped to individual orgs via per-org tokens | ✅ Implemented |
| **Org Isolation** | Each org gets its own Octokit instance; no shared token pool | ✅ Implemented |
| **Secret Values** | Plaintext secret values are NEVER stored in the MCV database | ✅ By design |
| **Input Validation** | Single-quote escaping for SQL strings (`'` → `''`) | ⚠️ Minimal; needs parameterization |
| **CORS** | Webhook endpoint should reject non-POST requests | ⏳ Framework-level |
| **Idempotency** | Webhook `x-github-delivery` ID can be used for deduplication | ⏳ Not yet implemented |

### ⚠️ SQL Injection Risk (Critical)

The current service implementations construct SQL queries via string interpolation:

```typescript
// CURRENT (VULNERABLE):
`SELECT * FROM github_organizations WHERE id = '${id}' LIMIT 1`
`AND (name ILIKE '%${filters.search}%' OR description ILIKE '%${filters.search}%')`

// RECOMMENDED (PARAMETERIZED):
db.execute(sql`SELECT * FROM github_organizations WHERE id = ${id} LIMIT 1`)
db.execute(sql`AND (name ILIKE ${'%' + filters.search + '%'})`)
```

**Priority:** This must be addressed before production deployment. All services should migrate to Drizzle ORM's query builder or `sql` tagged template literals for automatic parameterization.

### Constant-Time Comparison Implementation

The webhook middleware implements its own `timingSafeEqual()` function rather than using Node.js's `crypto.timingSafeEqual()`. While functional, consider migrating to the Node.js built-in for more robustness:

```typescript
// Current: Custom implementation
function timingSafeEqual(a: string, b: string): boolean { /* ... */ }

// Recommended: Use Node.js built-in
import { timingSafeEqual } from 'node:crypto';
timingSafeEqual(Buffer.from(a), Buffer.from(b));
```

---

## 19. Testing Patterns

### Service Unit Tests

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RepositoryService } from '@mcv/github/server';

describe('RepositoryService', () => {
  let service: RepositoryService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execute: vi.fn(),
    };
    service = new RepositoryService(mockDb);
  });

  it('should list repositories with filters', async () => {
    mockDb.execute
      .mockResolvedValueOnce([{ id: '1', name: 'repo-1' }])  // Data query
      .mockResolvedValueOnce([{ total: 1 }]);                   // Count query

    const result = await service.listRepositories('org-id', {
      visibility: 'private',
      language: 'TypeScript',
    });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(mockDb.execute).toHaveBeenCalledTimes(2);
  });

  it('should throw on missing repository', async () => {
    mockDb.execute.mockResolvedValue([]);

    await expect(service.getRepository('nonexistent'))
      .resolves.toBeNull();
  });
});
```

### Webhook Validation Tests

```typescript
import { describe, it, expect } from 'vitest';
import { validateGitHubSignature, createGitHubWebhookValidator } from '@mcv/github/server';

describe('validateGitHubSignature', () => {
  const secret = 'test-secret';
  const payload = '{"action":"opened"}';

  it('should validate correct signature', () => {
    const { createHmac } = require('node:crypto');
    const expectedSig = createHmac('sha256', secret)
      .update(payload, 'utf-8')
      .digest('hex');

    expect(validateGitHubSignature(
      secret,
      `sha256=${expectedSig}`,
      payload,
    )).toBe(true);
  });

  it('should reject incorrect signature', () => {
    expect(validateGitHubSignature(
      secret,
      'sha256=deadbeef',
      payload,
    )).toBe(false);
  });

  it('should reject missing parameters', () => {
    expect(validateGitHubSignature('', 'sha256=abc', payload)).toBe(false);
    expect(validateGitHubSignature(secret, '', payload)).toBe(false);
    expect(validateGitHubSignature(secret, 'sha256=abc', '')).toBe(false);
  });

  it('should reject non-sha256 algorithm', () => {
    expect(validateGitHubSignature(secret, 'sha1=abc', payload)).toBe(false);
  });
});

describe('createGitHubWebhookValidator', () => {
  it('should skip validation in development when allowUnsignedInDev=true', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const validate = createGitHubWebhookValidator({
      secret: 'secret',
      allowUnsignedInDev: true,
    });

    const result = await validate({ headers: {}, body: '{}' });
    expect(result).toBe(true);

    process.env.NODE_ENV = originalEnv;
  });
});
```

### Hook Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRepos } from '@mcv/github/client';

describe('useRepos', () => {
  it('should load repositories', async () => {
    const mockListFn = vi.fn().mockResolvedValue({
      items: [{ id: '1', name: 'test-repo' }],
      total: 1,
    });

    const { result } = renderHook(() => useRepos({ listFn: mockListFn }));

    await act(async () => {
      await result.current.loadRepos('org-id');
    });

    expect(result.current.repos).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const mockListFn = vi.fn().mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useRepos({ listFn: mockListFn }));

    await act(async () => {
      await result.current.loadRepos('org-id');
    });

    expect(result.current.repos).toHaveLength(0);
    expect(result.current.error).toBe('API Error');
  });
});
```

---

## 20. Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@octokit/rest` | ^20.x | GitHub REST API client (typed, paginated) |
| `@mcv/db` | workspace | Database access (Drizzle ORM + PostgreSQL via postgres.js) |

### Internal Dependencies

| Package | Purpose |
|---|---|
| `@mcv/db/schema` | GitHub table definitions (Drizzle schema) |

### Peer Dependencies (Recommended)

| Package | Purpose |
|---|---|
| `tweetsodium` / `libsodium-wrappers` | NaCl sealed box encryption for GitHub Actions secrets |
| `react` ≥18 | Required for client hooks |

### Dev Dependencies

| Package | Purpose |
|---|---|
| `vitest` | Testing framework |
| `@testing-library/react` | Hook testing utilities |
| `typescript` ≥5.x | Type checking |

---

## 21. Related Modules

| Module | Relationship | Integration Point |
|---|---|---|
| `@mcv/db` | Database layer | All GitHub tables defined in `schema/github.ts`; all services inject `PostgresJsDatabase` |
| `@mcv/auth` (MUMS) | Identity & permissions | `syncFromMums()` reads MUMS permission groups; `mums_user_id` links GitHub users to MUMS identities |
| `@mcv/projects` | Project management | `task_id` on PRs links to project tasks; `task_project_id` on repos links to project boards |
| `@mcv/audit` | Audit trail | All service operations emit audit events (see §16) |
| `@mcv/integrations` | Integration registry | GitHub App installation status tracked in integration registry |
| `@mcv/secrets` | External vault | `syncFromVault()` reads vault mappings; `vault_path` on secrets references external vault entries |

---

## 22. Migration & Setup

### 1. Install the GitHub App

1. Create a GitHub App at `https://github.com/settings/apps`
2. Set permissions: Repositories (read/write), Organization (read/write), Pull Requests (read/write), Actions (read/write), Secrets (read/write), Webhooks (read)
3. Set webhook URL to `https://your-domain.com/api/webhooks/github`
4. Generate and download the private key
5. Note the App ID and webhook secret

### 2. Configure Environment Variables

```bash
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your-randomly-generated-32-char-secret
DATABASE_URL=postgresql://user:pass@localhost:5432/mcv
```

### 3. Run Database Migrations

```sql
-- Apply all github_* table migrations (see §6 for full DDL)
-- Tables are created via @mcv/db migration system
```

### 4. Register an Organization

```typescript
const orgService = new OrganizationService(db);
await orgService.registerOrganization({
  ventureId: 'your-venture-id',
  login: 'your-github-org',
  installationId: 12345,           // From GitHub App installation
  accessToken: 'ghs_xxxxx',        // From installation token endpoint
});
```

### 5. Initial Sync

```typescript
// Sync repos
const repoService = new RepositoryService(db);
await repoService.syncRepositories(orgId);

// Sync workflows for each repo
const workflowService = new WorkflowService(db);
for (const repo of repos) {
  await workflowService.syncWorkflows(repo.id);
}

// Sync PRs for each repo
const prService = new PullRequestService(db);
for (const repo of repos) {
  await prService.syncPRs(repo.id);
}
```

---

## 23. Troubleshooting

### Common Issues

| Issue | Symptom | Solution |
|---|---|---|
| Webhook 403 | "Invalid signature" errors | Verify `GITHUB_WEBHOOK_SECRET` matches GitHub App webhook settings |
| Sync returns 0 | No repos/workflows found | Check that the org's access token is valid and not expired |
| Rate limited | 429 errors from GitHub | Wait for `X-RateLimit-Reset` timestamp; batch operations during off-peak |
| Missing repos | Sync doesn't find new repos | GitHub App installation may need updated permissions; check org settings |
| Merge fails | 409 Conflict | PR has merge conflicts; rebase head branch against base |
| Team sync drift | MUMS and GitHub out of sync | Run `syncFromMums()` to reconcile; check `github_team_mums_mappings` table |
| Stale workflow data | Runs show old status | Run `syncWorkflows()` for the repo; or rely on webhooks for real-time updates |
| Secret encryption fails | libsodium not available | Install `tweetsodium` or `libsodium-wrappers` package |

### Debugging Webhooks

```typescript
// Enable verbose logging for webhook debugging
app.post('/api/webhooks/github', async (req, res) => {
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Event:', req.headers['x-github-event']);
  console.log('Delivery:', req.headers['x-github-delivery']);
  console.log('Signature present:', !!req.headers['x-hub-signature-256']);

  // Validate
  const isValid = await validate(req);
  console.log('Signature valid:', isValid);

  // ...
});
```

### GitHub API Rate Limit Monitoring

```typescript
// After any Octokit call, check rate limit headers
const octokit = new Octokit({ auth: token });
const { data, headers } = await octokit.repos.listForOrg({ org: 'my-org' });

console.log('Rate limit remaining:', headers['x-ratelimit-remaining']);
console.log('Rate limit reset:', new Date(Number(headers['x-ratelimit-reset']) * 1000));
```

---

*This document was generated from source code analysis of `packages/github/src/` (20 TypeScript files) in the MCV.ONE monorepo. All interfaces, service methods, hook signatures, and database schemas are derived directly from the source implementation.*