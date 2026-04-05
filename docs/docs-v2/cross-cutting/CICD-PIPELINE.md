# MCV.ONE CI/CD Pipeline Specification
## Continuous Integration & Deployment for Turborepo Monorepo

**Version:** 1.0
**Last Updated:** March 10, 2026
**Reference:** ADR-009, DEPLOYMENT-ARCHITECTURE.md
**Status:** APPROVED
**Classification:** INTERNAL

---

## Executive Summary

This document defines the CI/CD pipeline architecture for the MCV.ONE Turborepo monorepo. The pipeline uses **GitHub Actions** as the orchestration layer, **Turborepo Remote Caching** for build acceleration, and **Vercel** as the primary deployment target (with Kubernetes deployment paths for M3+ workloads). The design prioritizes developer velocity through intelligent change detection, parallel execution, and progressive deployment gates.

---

## 1. Pipeline Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE ARCHITECTURE                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRIGGER ──► DETECT CHANGES ──► PARALLEL JOBS ──► DEPLOY ──► VERIFY         │
│                                                                              │
│  ┌─────────┐   ┌──────────┐   ┌────────────────┐   ┌──────┐   ┌─────────┐ │
│  │ Push    │   │ Affected │   │ Lint           │   │Vercel│   │ Health  │ │
│  │ PR      │──►│ Packages │──►│ Typecheck      │──►│  or  │──►│ E2E     │ │
│  │ Manual  │   │ Apps     │   │ Unit Test      │   │ K8s  │   │ Smoke   │ │
│  │ Schedule│   │ Schemas  │   │ Build          │   │      │   │ Notify  │ │
│  └─────────┘   └──────────┘   │ Migration Check│   └──────┘   └─────────┘ │
│                                └────────────────┘                            │
│                                                                              │
│  TURBOREPO REMOTE CACHE ────────────────────────────────────────────────── │
│  ├── Vercel Remote Cache (shared across CI + local dev)                     │
│  ├── Task hashing: source files + dependencies + env vars                    │
│  └── Cache hit → skip build (avg 60-80% hit rate on PRs)                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Workflow Definitions

### 2.1 CI Pipeline (`ci.yml`) — Runs on Every PR and Push

```yaml
name: CI Pipeline
on:
  push:
    branches: [develop, staging, main]
  pull_request:
    branches: [develop, staging, main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true  # Cancel stale CI runs

env:
  NODE_VERSION: "20"
  PNPM_VERSION: "9"
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

jobs:
  # ─── Step 1: Detect what changed ───
  changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.filter.outputs.packages }}
      apps: ${{ steps.filter.outputs.apps }}
      db: ${{ steps.filter.outputs.db }}
      ci: ${{ steps.filter.outputs.ci }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            packages:
              - 'packages/**'
            apps:
              - 'apps/**'
            db:
              - 'packages/db/**'
            ci:
              - '.github/**'
              - 'turbo.json'
              - 'pnpm-lock.yaml'

  # ─── Step 2: Lint + Typecheck (parallel) ───
  quality:
    needs: changes
    if: needs.changes.outputs.packages == 'true' ||
        needs.changes.outputs.apps == 'true' ||
        needs.changes.outputs.ci == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint
      - run: pnpm turbo typecheck

  # ─── Step 3: Unit Tests ───
  test:
    needs: changes
    if: needs.changes.outputs.packages == 'true' ||
        needs.changes.outputs.apps == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-reports
          path: "**/coverage/"

  # ─── Step 4: Build Verification ───
  build:
    needs: [quality, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build

  # ─── Step 5: Database Migration Check ───
  migration-check:
    needs: changes
    if: needs.changes.outputs.db == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:generate
      - name: Check for uncommitted migration changes
        run: |
          if [[ -n $(git status --porcelain packages/db/src/migrations/) ]]; then
            echo "::error::Uncommitted migration files detected. Run 'pnpm db:generate' and commit."
            exit 1
          fi
```

### 2.2 CD Development (`cd-dev.yml`)

```yaml
name: Deploy Development
on:
  push:
    branches: [develop]

concurrency:
  group: dev-deploy
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: development
      url: https://dev.mcv.one
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel (Development)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          alias-domains: dev.mcv.one
```

### 2.3 CD Staging (`cd-staging.yml`)

```yaml
name: Deploy Staging
on:
  push:
    branches: [staging]

concurrency:
  group: staging-deploy
  cancel-in-progress: false  # Wait for completion

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.mcv.one
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel (Production Build, Staging Target)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
          alias-domains: staging.mcv.one

  e2e:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Run Playwright E2E Tests
        run: pnpm exec playwright test
        env:
          BASE_URL: https://staging.mcv.one

  notify:
    needs: [deploy, e2e]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Slack Notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 2.4 CD Production (`cd-production.yml`)

```yaml
name: Deploy Production
on:
  workflow_dispatch:
    inputs:
      version:
        description: "Tag or commit SHA to deploy"
        required: true
      confirmation:
        description: 'Type "DEPLOY" to confirm'
        required: true

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Validate confirmation
        if: github.event.inputs.confirmation != 'DEPLOY'
        run: |
          echo "::error::Deployment not confirmed. Type DEPLOY to proceed."
          exit 1

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://admin.mcv.one
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
          alias-domains: admin.mcv.one

  health-check:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Health Check (5 retries)
        run: |
          for i in {1..5}; do
            if curl -sf https://admin.mcv.one/api/health; then
              echo "Health check passed"
              exit 0
            fi
            echo "Attempt $i failed, retrying in 10s..."
            sleep 10
          done
          echo "::error::Health check failed after 5 attempts"
          exit 1

  release:
    needs: health-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}
      - name: Create GitHub Release
        if: startsWith(github.event.inputs.version, 'v')
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.event.inputs.version }}
          generate_release_notes: true
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: "Production deployed: ${{ github.event.inputs.version }}"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 3. Turborepo Caching Strategy

### 3.1 Task Configuration

```json
// turbo.json
{
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "env": ["DATABASE_URL", "NEXT_PUBLIC_*"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck", "^build"]
    },
    "test": {
      "outputs": ["coverage/**"],
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:generate": { "cache": false },
    "db:push": { "cache": false },
    "db:seed": { "cache": false }
  }
}
```

### 3.2 Cache Performance Targets

| Scenario | Expected Hit Rate | Time Savings |
|----------|------------------|-------------|
| PR (no package changes) | 90%+ | 3-5 min saved |
| PR (single package change) | 70-80% | 2-3 min saved |
| Develop merge (multiple packages) | 50-60% | 1-2 min saved |
| Full rebuild (lock file change) | 0% | No savings |

---

## 4. Database Migration Pipeline

### 4.1 Migration Workflow

```
Developer: pnpm db:generate (creates migration SQL)
    │
    ▼
PR Review: Migration SQL reviewed by 2 engineers
    │
    ▼
CI: migration-check job validates no uncommitted changes
    │
    ▼
Staging: pnpm db:migrate:prod (against staging Supabase)
    │
    ▼
QA: Verify schema changes work correctly
    │
    ▼
Production: pnpm db:migrate:prod (against prod Supabase)
    │
    ▼
Post-Deploy: Verify via /api/health/deep
```

### 4.2 Migration Safety Rules

1. **No destructive migrations in production** — use additive-only migrations (add columns, tables). Drop operations require a separate deprecation PR.
2. **All migrations are reversible** — every migration must have a corresponding rollback.
3. **Zero-downtime migrations** — new columns must be nullable or have defaults. Schema changes must be backward-compatible with the previous app version.
4. **Migration review checklist** — required labels: `migration-reviewed`, `schema-change`.

---

## 5. Quality Gates

### 5.1 PR Merge Requirements

| Gate | Required | Enforced By |
|------|----------|-------------|
| CI passes (lint + typecheck + test + build) | Yes | GitHub branch protection |
| At least 1 approval | Yes | GitHub branch protection |
| No merge conflicts | Yes | GitHub |
| Migration review (if DB changes) | Yes | CODEOWNERS + label |
| Preview deployment works | Recommended | Vercel preview |

### 5.2 Release Gates

| Gate | Development | Staging | Production |
|------|-------------|---------|------------|
| CI passes | Auto | Auto | Required |
| E2E tests | Skip | Required | Required |
| Manual QA | Skip | Recommended | Required |
| Health check | Skip | Auto | Required (5 retries) |
| Two approvals | No | No | Yes |
| Confirmation input | No | No | "DEPLOY" required |

---

## 6. Scheduled Workflows

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `dependency-audit.yml` | Weekly (Monday 9 AM) | `pnpm audit` + Dependabot alerts |
| `stale-branches.yml` | Weekly (Friday 5 PM) | Clean up merged/stale branches |
| `db-backup-verify.yml` | Daily (4 AM UTC) | Verify backup integrity |
| `lighthouse-audit.yml` | Weekly (Wednesday) | Performance regression check |

---

## Document Control

| Field | Value |
|-------|-------|
| **Author** | MCV Engineering |
| **Created** | March 10, 2026 |
| **Version** | 1.0 |
| **Dependencies** | DEPLOYMENT-ARCHITECTURE.md, ADR-009 |
