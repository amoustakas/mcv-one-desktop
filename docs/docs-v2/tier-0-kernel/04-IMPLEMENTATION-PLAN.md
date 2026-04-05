# @mcv/kernel — Implementation Plan
## Epics, Phases & Task Breakdown

**Package:** `@mcv/kernel`  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026  
**Estimated Effort:** 3-4 weeks

---

## Executive Summary

The `@mcv/kernel` package is the foundation of the entire MCV.ONE SDK. Implementation must be completed first as all other packages depend on it. This plan outlines a phased approach with clear epics, milestones, and task breakdowns.

---

## Implementation Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          IMPLEMENTATION TIMELINE                             │
│                                                                              │
│  Phase 1          Phase 2          Phase 3          Phase 4                 │
│  Foundation       Core Modules     Integration      Production              │
│  (Week 1)         (Week 2)         (Week 3)         (Week 4)                │
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Project  │───▶│   db     │───▶│ context  │───▶│ Testing  │              │
│  │ Setup    │    │ config   │    │ errors   │    │ Docs     │              │
│  │          │    │ logger   │    │ utils    │    │ Release  │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                                              │
│  Milestone 1      Milestone 2      Milestone 3      Milestone 4             │
│  Scaffold         Core Ready       Feature          Production              │
│  Complete         for Testing      Complete         Ready                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Week 1)

### Epic 1.1: Project Setup

**Goal:** Initialize package structure, dependencies, and build configuration.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.1.1 | Create package directory structure | 2h | P0 |
| 1.1.2 | Initialize package.json with dependencies | 1h | P0 |
| 1.1.3 | Configure TypeScript (tsconfig.json) | 2h | P0 |
| 1.1.4 | Set up build tooling (tsup/unbuild) | 2h | P0 |
| 1.1.5 | Configure ESLint and Prettier | 1h | P1 |
| 1.1.6 | Set up Vitest for testing | 2h | P0 |
| 1.1.7 | Create initial exports (index.ts) | 1h | P0 |
| 1.1.8 | Add to monorepo workspace | 1h | P0 |

**Acceptance Criteria:**
- [ ] Package builds without errors
- [ ] TypeScript compiles with strict mode
- [ ] Tests run successfully (empty test suite)
- [ ] Package can be imported by other workspace packages

---

### Epic 1.2: Types Module

**Goal:** Define core TypeScript types and branded types.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.2.1 | Define branded type utilities | 2h | P0 |
| 1.2.2 | Create UUID, VentureID, UserID types | 1h | P0 |
| 1.2.3 | Define timestamp types | 1h | P0 |
| 1.2.4 | Create JSON types | 1h | P0 |
| 1.2.5 | Define nullability helpers | 1h | P1 |
| 1.2.6 | Create pagination types | 2h | P0 |
| 1.2.7 | Define API response types | 2h | P0 |
| 1.2.8 | Create entity base types | 2h | P0 |
| 1.2.9 | Write type tests | 2h | P1 |

**Acceptance Criteria:**
- [ ] All core types exported
- [ ] Types are properly branded (compile-time safety)
- [ ] Documentation comments on all exports

---

## Phase 2: Core Modules (Week 2)

### Epic 2.1: Database Module (db)

**Goal:** Implement database connectivity with Drizzle ORM.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.1.1 | Install Drizzle and postgres.js | 1h | P0 |
| 2.1.2 | Create connection client with pooling | 3h | P0 |
| 2.1.3 | Define baseColumns schema helper | 2h | P0 |
| 2.1.4 | Create createTable factory function | 2h | P0 |
| 2.1.5 | Implement transaction helper | 2h | P0 |
| 2.1.6 | Create query helper functions | 2h | P1 |
| 2.1.7 | Set up migration tooling | 3h | P0 |
| 2.1.8 | Create initial schema file | 2h | P0 |
| 2.1.9 | Write RLS policy templates | 2h | P1 |
| 2.1.10 | Add connection health check | 1h | P1 |
| 2.1.11 | Write integration tests | 4h | P0 |

**Acceptance Criteria:**
- [ ] Database connection established successfully
- [ ] Connection pooling working (max 20)
- [ ] Transactions commit and rollback correctly
- [ ] Migrations run successfully
- [ ] Tests pass with test database

---

### Epic 2.2: Configuration Module (config)

**Goal:** Implement environment configuration with validation.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.2.1 | Install Zod | 0.5h | P0 |
| 2.2.2 | Define config schema with all env vars | 3h | P0 |
| 2.2.3 | Implement loadConfig function | 2h | P0 |
| 2.2.4 | Add config caching (singleton) | 1h | P0 |
| 2.2.5 | Create getConfig type-safe accessor | 1h | P0 |
| 2.2.6 | Add environment helpers (isProd, isDev) | 1h | P1 |
| 2.2.7 | Implement secrets encryption | 3h | P1 |
| 2.2.8 | Create .env.example template | 1h | P1 |
| 2.2.9 | Write unit tests | 2h | P0 |

**Acceptance Criteria:**
- [ ] Config validates on startup
- [ ] Missing required vars throw clear errors
- [ ] Type-safe access to all config values
- [ ] Secrets can be encrypted/decrypted

---

### Epic 2.3: Logger Module (logger)

**Goal:** Implement structured logging with Pino.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.3.1 | Install Pino and pino-pretty | 0.5h | P0 |
| 2.3.2 | Create base logger configuration | 2h | P0 |
| 2.3.3 | Configure log formatting (JSON/pretty) | 2h | P0 |
| 2.3.4 | Implement redaction rules | 2h | P0 |
| 2.3.5 | Create child logger factory | 1h | P0 |
| 2.3.6 | Create request logger factory | 2h | P0 |
| 2.3.7 | Add custom serializers | 2h | P1 |
| 2.3.8 | Configure log rotation (if file output) | 2h | P2 |
| 2.3.9 | Write unit tests | 2h | P0 |

**Acceptance Criteria:**
- [ ] Logs output in correct format per environment
- [ ] Sensitive data is redacted
- [ ] Child loggers inherit context
- [ ] Log levels work correctly

---

## Phase 3: Integration Modules (Week 3)

### Epic 3.1: Errors Module (errors)

**Goal:** Implement standardized error handling.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.1.1 | Define ErrorCode enum | 2h | P0 |
| 3.1.2 | Implement MCVError base class | 3h | P0 |
| 3.1.3 | Create specialized error classes | 3h | P0 |
| 3.1.4 | Implement error handler function | 2h | P0 |
| 3.1.5 | Add error serialization (toJSON) | 1h | P0 |
| 3.1.6 | Create error type guards | 1h | P1 |
| 3.1.7 | Add async error wrapper | 2h | P1 |
| 3.1.8 | Write unit tests | 2h | P0 |

**Acceptance Criteria:**
- [ ] All error codes defined
- [ ] Errors map to correct HTTP status codes
- [ ] Errors serialize correctly for API responses
- [ ] Stack traces captured appropriately

---

### Epic 3.2: Utilities Module (utils)

**Goal:** Implement common utility functions.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.2.1 | Install date-fns, decimal.js, nanoid, slugify | 1h | P0 |
| 3.2.2 | Implement date utilities | 3h | P0 |
| 3.2.3 | Implement currency utilities | 3h | P0 |
| 3.2.4 | Implement string utilities | 2h | P0 |
| 3.2.5 | Implement validation utilities | 2h | P0 |
| 3.2.6 | Create Zod schema helpers | 2h | P1 |
| 3.2.7 | Add async utilities (retry, debounce) | 2h | P2 |
| 3.2.8 | Write unit tests (comprehensive) | 4h | P0 |

**Acceptance Criteria:**
- [ ] All utility functions exported
- [ ] Currency math is precise (no floating point errors)
- [ ] Validation returns consistent results
- [ ] 90%+ test coverage

---

### Epic 3.3: Context Module (context)

**Goal:** Implement request context management.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.3.1 | Define context types (MCVContext, MCVUser, etc.) | 2h | P0 |
| 3.3.2 | Implement AsyncLocalStorage wrapper | 3h | P0 |
| 3.3.3 | Create context factory function | 2h | P0 |
| 3.3.4 | Implement withContext wrapper | 2h | P0 |
| 3.3.5 | Create getContext accessor | 1h | P0 |
| 3.3.6 | Add permission check helpers | 2h | P0 |
| 3.3.7 | Create tRPC middleware adapter | 3h | P0 |
| 3.3.8 | Write integration tests | 3h | P0 |

**Acceptance Criteria:**
- [ ] Context available throughout request lifecycle
- [ ] Permission checks work correctly
- [ ] Context properly isolated between requests
- [ ] Works with async/await

---

## Phase 4: Production Readiness (Week 4)

### Epic 4.1: Testing & Quality

**Goal:** Comprehensive testing and quality assurance.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.1.1 | Write remaining unit tests | 8h | P0 |
| 4.1.2 | Write integration tests | 6h | P0 |
| 4.1.3 | Set up test database fixtures | 2h | P0 |
| 4.1.4 | Configure code coverage reporting | 1h | P1 |
| 4.1.5 | Run security audit (npm audit) | 1h | P0 |
| 4.1.6 | Performance benchmarking | 2h | P2 |
| 4.1.7 | Fix any discovered issues | 4h | P0 |

**Acceptance Criteria:**
- [ ] 80%+ code coverage
- [ ] All tests passing
- [ ] No security vulnerabilities (high/critical)
- [ ] Performance within acceptable limits

---

### Epic 4.2: Documentation & Release

**Goal:** Complete documentation and prepare for release.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.2.1 | Write JSDoc comments on all exports | 4h | P0 |
| 4.2.2 | Generate API documentation | 2h | P1 |
| 4.2.3 | Create README.md with usage examples | 2h | P0 |
| 4.2.4 | Write CHANGELOG.md | 1h | P0 |
| 4.2.5 | Update package.json version | 0.5h | P0 |
| 4.2.6 | Create npm publish workflow | 2h | P1 |
| 4.2.7 | Internal package release | 1h | P0 |
| 4.2.8 | Notify dependent packages | 0.5h | P0 |

**Acceptance Criteria:**
- [ ] All exports documented
- [ ] README has quick start guide
- [ ] Package published to internal registry
- [ ] Dependent packages can install and use

---

## Milestone Summary

| Milestone | Target Date | Key Deliverables |
|-----------|-------------|------------------|
| **M1: Scaffold Complete** | End of Week 1 | Package structure, types module |
| **M2: Core Ready** | End of Week 2 | db, config, logger working |
| **M3: Feature Complete** | End of Week 3 | All modules implemented |
| **M4: Production Ready** | End of Week 4 | Tests passing, docs complete, released |

---

## Dependencies & Blockers

### External Dependencies

| Dependency | Required For | Risk Level |
|------------|--------------|------------|
| Supabase project | Database testing | Low |
| npm registry access | Package publishing | Low |
| CI/CD pipeline | Automated testing | Medium |

### Internal Dependencies

| Dependency | Impact |
|------------|--------|
| None | @mcv/kernel is the base package |

### Potential Blockers

| Blocker | Mitigation |
|---------|------------|
| Database connection issues | Use local PostgreSQL for development |
| TypeScript strict mode issues | Allocate extra time for type fixes |
| Drizzle ORM learning curve | Reference official documentation |

---

## Resource Requirements

### Team

| Role | Allocation | Responsibilities |
|------|------------|------------------|
| Senior Backend Engineer | 100% | Core implementation |
| DevOps Engineer | 25% | CI/CD, database setup |
| Tech Lead | 10% | Architecture review |

### Infrastructure

| Resource | Purpose |
|----------|---------|
| Development PostgreSQL | Local testing |
| Staging Supabase project | Integration testing |
| npm private registry | Package publishing |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | Medium | High | Strict adherence to spec |
| Integration issues | Low | Medium | Early integration testing |
| Performance issues | Low | Medium | Benchmark critical paths |
| Type complexity | Medium | Low | Incremental type refinement |

---

## Success Criteria

### Functional

- [ ] All 7 sub-modules implemented
- [ ] All exports match API reference
- [ ] Context propagation working end-to-end
- [ ] Multi-tenant queries filtered correctly

### Non-Functional

- [ ] Startup time < 500ms
- [ ] Database query overhead < 5ms
- [ ] Memory footprint < 50MB base
- [ ] No memory leaks in long-running processes

### Quality

- [ ] 80%+ code coverage
- [ ] Zero high/critical vulnerabilities
- [ ] All TypeScript strict checks passing
- [ ] Documentation complete

---

## Post-Release

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Configure performance monitoring
- [ ] Create runbook for common issues

### Iteration

- [ ] Collect feedback from dependent packages
- [ ] Address any integration issues
- [ ] Plan v1.1 improvements

---

*@mcv/kernel — Implementation Plan v1.0*
