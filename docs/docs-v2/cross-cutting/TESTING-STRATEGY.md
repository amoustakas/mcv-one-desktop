# MCV.ONE Testing Strategy
## Comprehensive Quality Assurance Framework

**Version:** 1.0
**Last Updated:** March 10, 2026
**Reference:** CICD-PIPELINE.md
**Status:** APPROVED
**Classification:** INTERNAL

---

## Executive Summary

This document defines the testing strategy for the MCV.ONE platform — covering unit tests, integration tests, end-to-end tests, performance tests, and security tests. The strategy is designed for a Turborepo monorepo with 31+ packages and 3 applications, emphasizing test isolation, multi-tenant validation, and developer velocity through intelligent test selection.

---

## 1. Testing Pyramid

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MCV.ONE TESTING PYRAMID                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                          ┌──────────┐                                        │
│                          │  Manual  │  Exploratory, UX, accessibility        │
│                          │   QA     │  ~5% of effort                         │
│                         ┌┴──────────┴┐                                       │
│                         │    E2E     │  Playwright: critical user flows      │
│                         │   Tests    │  ~10% of effort                       │
│                        ┌┴────────────┴┐                                      │
│                        │ Integration  │  tRPC routers + DB: real Supabase    │
│                        │    Tests     │  ~25% of effort                      │
│                       ┌┴──────────────┴┐                                     │
│                       │   Unit Tests   │  Vitest: pure functions, hooks,     │
│                       │                │  components, services               │
│                       │                │  ~60% of effort                     │
│                       └────────────────┘                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Unit Testing

### 2.1 Framework & Configuration

**Runner:** Vitest 2.x (native ESM, TypeScript, monorepo-aware)

```typescript
// vitest.config.ts (shared root)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Default; overridden per package
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        branches: 70,
        functions: 75,
        lines: 80,
        statements: 80,
      },
      exclude: [
        'node_modules/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/migrations/**',
        '**/test/**',
      ],
    },
    setupFiles: ['./test/setup.ts'],
  },
});
```

### 2.2 Per-Package Test Environments

| Package Category | Environment | Mocking Strategy |
|------------------|-------------|------------------|
| `@mcv/kernel` (db, config, utils) | `node` | No mocks needed (pure logic) |
| `@mcv/identity` (auth, permissions) | `node` | Mock Supabase client, mock crypto |
| `@mcv/fabric` (notifications, events) | `node` | Mock external services (Redis, Redpanda) |
| `@mcv/connectors` (email, payments) | `node` | Mock SDKs (Stripe, SendGrid, Twilio) |
| `@mcv/intelligence` (AI, RAG) | `node` | Mock OpenRouter, mock embeddings |
| `@mcv/ui` (components) | `happy-dom` | Component testing with Testing Library |
| `@mcv/api` (tRPC routers) | `node` | Mock DB context, mock auth |
| `apps/admin` (pages, features) | `happy-dom` | Mock tRPC client, mock auth |

### 2.3 Component Testing (@mcv/ui)

```typescript
// Example: Button component test
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick handler', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('respects disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 2.4 Storybook Visual Testing

**Purpose:** Component visual regression + interactive documentation

```
# Run Storybook (local)
pnpm storybook

# Run visual regression (CI)
pnpm storybook:test -- --ci
```

**Coverage Target:** All `@mcv/ui` components (492+) should have stories.

### 2.5 Coverage Targets by Package Tier

| Tier | Packages | Line Coverage Target | Rationale |
|------|----------|---------------------|-----------|
| T0: Kernel | db, config, utils, types | 90%+ | Foundation; must be bulletproof |
| T1: Identity | auth, permissions, tenants | 85%+ | Security-critical |
| T2: Fabric | audit, storage, notifications | 80%+ | Infrastructure reliability |
| T3: Connectors | email, payments, twilio | 75%+ | External API boundaries |
| T4: Intelligence | gateway, rag, knowledge | 70%+ | AI components (harder to test deterministically) |
| T5: Domain Modules | nexus, commerce, growth, etc. | 75%+ | Business logic |
| T6: UI | components | 70%+ | Component coverage via Storybook + Testing Library |
| T6: API | tRPC routers | 80%+ | API contract testing |

---

## 3. Integration Testing

### 3.1 tRPC Router Integration Tests

**Strategy:** Test tRPC routers against a real (local or test) PostgreSQL database with Drizzle ORM — no mocking the database layer.

```typescript
// test/integration/setup.ts
import { createTestContext } from '@mcv/api/test-utils';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await createTestContext({
    database: 'test', // Uses test Supabase project or Docker PG
    seed: true,       // Run seeders
  });
});

afterAll(async () => {
  await ctx.cleanup(); // Truncate tables, close connections
});

// Example: CRM router integration test
describe('crm.contacts', () => {
  it('creates a contact with venture isolation', async () => {
    const caller = ctx.createCaller({
      userId: ctx.testUser.id,
      ventureId: ctx.testVenture.id,
    });

    const contact = await caller.crm.contacts.create({
      firstName: 'Test',
      lastName: 'Contact',
      email: 'test@example.com',
    });

    expect(contact.ventureId).toBe(ctx.testVenture.id);

    // Verify isolation: different venture cannot see this contact
    const otherCaller = ctx.createCaller({
      userId: ctx.testUser.id,
      ventureId: ctx.otherVenture.id,
    });

    const contacts = await otherCaller.crm.contacts.list({});
    expect(contacts.items).not.toContainEqual(
      expect.objectContaining({ id: contact.id })
    );
  });
});
```

### 3.2 Multi-Tenancy Isolation Tests

**Every integration test suite must include:**

1. **Venture Isolation** — data created in Venture A is invisible to Venture B
2. **User Role Enforcement** — operations respect RBAC/ABAC permissions
3. **Cross-Venture Admin Access** — super_admin can access all ventures
4. **Tenant Context Propagation** — venture_id flows through the entire call stack

### 3.3 Database Migration Testing

```bash
# Test migration up + down on a disposable database
pnpm db:test:migrate
# 1. Creates fresh PostgreSQL container
# 2. Runs all migrations UP
# 3. Runs all migrations DOWN
# 4. Runs all migrations UP again
# 5. Verifies schema matches drizzle-kit output
# 6. Destroys container
```

---

## 4. End-to-End Testing

### 4.1 Framework: Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
});
```

### 4.2 Critical User Flows (E2E Required)

| Flow | Priority | Test Count |
|------|----------|------------|
| **Auth:** Login → Dashboard → Logout | P0 | 5-8 tests |
| **Auth:** Register → Verify Email → First Login | P0 | 4-6 tests |
| **Auth:** MFA Setup → MFA Login | P0 | 3-5 tests |
| **Venture:** Switch venture → verify data isolation | P0 | 3-4 tests |
| **CRM:** Create Contact → Edit → Search → Delete | P1 | 6-8 tests |
| **Tasks:** Create → Assign → Complete → Archive | P1 | 5-7 tests |
| **Invoicing:** Create Invoice → Send → Mark Paid | P1 | 4-6 tests |
| **Settings:** Update profile → Change password | P1 | 3-4 tests |
| **AI:** Send prompt → Receive response → Rate | P2 | 3-4 tests |
| **Permissions:** Role assignment → Access verification | P0 | 5-7 tests |

### 4.3 E2E Test Data Strategy

```
Approach: Seeded test tenants with deterministic data

Test Venture A: "Acme Corp" (full data set)
  - 10 users (various roles)
  - 50 contacts, 10 organizations
  - 5 active deals in pipeline
  - 20 tasks across 3 projects

Test Venture B: "Beta Inc" (minimal data set)
  - 3 users
  - 5 contacts
  - Used for isolation verification

Test Venture C: "Empty Corp" (no data)
  - 1 admin user
  - Used for empty-state UI testing
```

---

## 5. Performance Testing

### 5.1 Lighthouse CI (Automated)

```yaml
# Run weekly + on staging deploys
metrics:
  performance: >= 85
  accessibility: >= 95
  best-practices: >= 90
  seo: >= 90

# Page-specific targets:
pages:
  /login: { performance: 95, lcp: 1.5s }
  /dashboard: { performance: 80, lcp: 2.5s }
  /crm/contacts: { performance: 75, lcp: 3.0s }
```

### 5.2 API Load Testing (Manual / Pre-Release)

**Tool:** k6 (already used in BetEdge prototype)

```javascript
// k6/scenarios/api-load.js
export const options = {
  scenarios: {
    steady: {
      executor: 'constant-arrival-rate',
      rate: 100,           // 100 req/s
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      stages: [
        { duration: '1m', target: 500 },  // Ramp to 500 req/s
        { duration: '2m', target: 500 },  // Hold
        { duration: '1m', target: 10 },   // Cool down
      ],
      preAllocatedVUs: 100,
      maxVUs: 500,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};
```

### 5.3 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **LCP** (Largest Contentful Paint) | <2.5s | Lighthouse CI |
| **FID** (First Input Delay) | <100ms | Lighthouse CI |
| **CLS** (Cumulative Layout Shift) | <0.1 | Lighthouse CI |
| **TTFB** (Time to First Byte) | <500ms | k6 |
| **API p95 latency** | <500ms | k6 |
| **API p99 latency** | <1000ms | k6 |
| **API error rate** | <1% | k6 |
| **Concurrent users** | 1000+ | k6 spike test |

---

## 6. Security Testing

### 6.1 Automated Security Checks (CI)

| Check | Tool | Frequency |
|-------|------|-----------|
| Dependency vulnerabilities | `pnpm audit` | Every PR + weekly |
| Secret scanning | GitHub Secret Scanning | Continuous |
| SAST (Static Analysis) | ESLint security plugins | Every PR |
| License compliance | `license-checker` | Weekly |
| Container scanning | Trivy (K8s images) | On image build |

### 6.2 Manual Security Testing (Pre-Release)

| Test Type | Scope | Frequency |
|-----------|-------|-----------|
| Penetration testing | Auth, API, multi-tenancy | Quarterly |
| OWASP Top 10 audit | Full application | Before each major release |
| Tenant isolation audit | Cross-venture data access | Monthly |
| Rate limiting verification | Auth + API endpoints | Before each release |
| CSRF/XSS verification | All form submissions | Before each release |

---

## 7. Test Execution Commands

```bash
# ─── Unit Tests ───
pnpm turbo test                    # All packages
pnpm turbo test --filter=@mcv/auth # Single package
pnpm turbo test -- --watch         # Watch mode

# ─── Coverage ───
pnpm turbo test:coverage           # Generate coverage reports

# ─── Integration Tests ───
pnpm test:integration              # Requires local DB running

# ─── E2E Tests ───
pnpm exec playwright test          # All browsers
pnpm exec playwright test --project=chromium  # Single browser
pnpm exec playwright test --ui     # Interactive UI mode

# ─── Performance ───
pnpm lighthouse                    # Lighthouse CI
k6 run k6/scenarios/api-load.js    # Load testing

# ─── Security ───
pnpm audit                         # Dependency audit
pnpm lint:security                 # SAST
```

---

## 8. Test Infrastructure

### 8.1 CI Test Environment

```yaml
# GitHub Actions test job services
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_DB: mcv_test
      POSTGRES_USER: mcv
      POSTGRES_PASSWORD: test
    ports: ['5432:5432']
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 10s
```

### 8.2 Test Data Management

**Principles:**
1. Tests create their own data (no shared mutable state)
2. Each test suite runs in a transaction that rolls back (unit/integration)
3. E2E tests use seeded data that resets between test runs
4. No test depends on execution order
5. Parallel test execution is the default

---

## Document Control

| Field | Value |
|-------|-------|
| **Author** | MCV Engineering |
| **Created** | March 10, 2026 |
| **Version** | 1.0 |
| **Dependencies** | CICD-PIPELINE.md |
