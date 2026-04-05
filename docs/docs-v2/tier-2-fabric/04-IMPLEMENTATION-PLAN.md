# @mcv/fabric — Implementation Plan
## Epics, Phases & Task Breakdown

**Package:** `@mcv/fabric`  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026  
**Estimated Effort:** 6-8 weeks

---

## Executive Summary

`@mcv/fabric` is a large package with 9 sub-modules providing critical infrastructure services. Implementation is phased to deliver highest-value modules first while maintaining integration points.

---

## Implementation Priority

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRIORITY ORDER                                      │
│                                                                              │
│  P0 (Critical)     P1 (High)         P2 (Medium)      P3 (Nice-to-have)    │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    cache    │  │   events    │  │    flags    │  │  Advanced   │        │
│  │    queue    │  │   search    │  │   storage   │  │  Features   │        │
│  │    audit    │  │  realtime   │  │             │  │             │        │
│  │notifications│  │             │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│  Week 1-2          Week 3-4          Week 5-6          Week 7-8             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Core Infrastructure (Weeks 1-2)

### Epic 1.1: Cache Module

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.1.1 | Set up Upstash Redis connection | 2h | P0 |
| 1.1.2 | Implement get/set/delete operations | 2h | P0 |
| 1.1.3 | Add TTL and expiry support | 2h | P0 |
| 1.1.4 | Implement getOrSet pattern | 2h | P0 |
| 1.1.5 | Add pattern-based deletion | 2h | P0 |
| 1.1.6 | Implement rate limiting | 3h | P0 |
| 1.1.7 | Create memoize helper | 2h | P1 |
| 1.1.8 | Add L1 in-memory cache layer | 3h | P1 |
| 1.1.9 | Write unit and integration tests | 4h | P0 |

**Acceptance Criteria:**
- [ ] Redis connection established
- [ ] All CRUD operations working
- [ ] Rate limiting functional
- [ ] Tests passing

---

### Epic 1.2: Queue Module

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.2.1 | Set up BullMQ with Redis | 3h | P0 |
| 1.2.2 | Implement job processing | 4h | P0 |
| 1.2.3 | Add job scheduling (delay) | 2h | P0 |
| 1.2.4 | Implement cron jobs | 3h | P0 |
| 1.2.5 | Add retry with backoff | 2h | P0 |
| 1.2.6 | Implement dead letter queue | 3h | P0 |
| 1.2.7 | Add job progress tracking | 2h | P1 |
| 1.2.8 | Create queue stats endpoint | 2h | P1 |
| 1.2.9 | Implement rate limiting per queue | 2h | P1 |
| 1.2.10 | Write tests | 4h | P0 |

**Acceptance Criteria:**
- [ ] Jobs process successfully
- [ ] Failed jobs retry correctly
- [ ] Cron jobs execute on schedule
- [ ] Dead letter queue captures failures

---

### Epic 1.3: Audit Module

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.3.1 | Create audit_logs table with partitioning | 4h | P0 |
| 1.3.2 | Implement async logging via queue | 3h | P0 |
| 1.3.3 | Add context enrichment (user, IP) | 2h | P0 |
| 1.3.4 | Create query API | 3h | P0 |
| 1.3.5 | Implement data change tracking | 4h | P0 |
| 1.3.6 | Add compliance export (CSV/JSON) | 4h | P1 |
| 1.3.7 | Create partition management job | 3h | P1 |
| 1.3.8 | Implement retention policies | 3h | P1 |
| 1.3.9 | Add indexes for performance | 2h | P0 |
| 1.3.10 | Write tests | 4h | P0 |

**Acceptance Criteria:**
- [ ] Audit logs written asynchronously
- [ ] Partitioning working correctly
- [ ] Query performance acceptable
- [ ] Export functionality working

---

### Epic 1.4: Notifications Module

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.4.1 | Create notification tables | 2h | P0 |
| 1.4.2 | Set up SendGrid integration | 3h | P0 |
| 1.4.3 | Set up Twilio SMS integration | 3h | P1 |
| 1.4.4 | Set up OneSignal push integration | 4h | P1 |
| 1.4.5 | Implement in-app via WebSocket | 3h | P0 |
| 1.4.6 | Create template system | 4h | P0 |
| 1.4.7 | Implement user preferences | 3h | P0 |
| 1.4.8 | Add quiet hours support | 2h | P1 |
| 1.4.9 | Implement delivery tracking | 4h | P0 |
| 1.4.10 | Create notification inbox API | 3h | P1 |
| 1.4.11 | Add digest/batching | 4h | P2 |
| 1.4.12 | Write tests | 4h | P0 |

**Acceptance Criteria:**
- [ ] Email sending works
- [ ] Push notifications delivered
- [ ] User preferences respected
- [ ] Delivery status tracked

---

## Phase 2: Event & Search Infrastructure (Weeks 3-4)

### Epic 2.1: Events Module

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.1.1 | Set up Redpanda/Kafka connection | 4h | P0 |
| 2.1.2 | Implement event publishing | 3h | P0 |
| 2.1.3 | Create consumer subscription | 4h | P0 |
| 2.1.4 | Add consumer groups | 3h | P0 |
| 2.1.5 | Implement event schema registry | 4h | P1 |
| 2.1.6 | Add dead letter handling | 3h | P0 |
| 2.1.7 | Create event replay functionality | 4h | P2 |
| 2.1.8 | Add event correlation | 2h | P1 |
| 2.1.9 | Implement exactly-once semantics | 6h | P1 |
| 2.1.10 | Write tests | 4h | P0 |

**Acceptance Criteria:**
- [ ] Events publish successfully
- [ ] Consumers receive events
- [ ] Consumer groups work correctly
- [ ] Dead letters captured

---

### Epic 2.2: Search Module

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.2.1 | Set up Meilisearch | 3h | P0 |
| 2.2.2 | Implement document indexing | 3h | P0 |
| 2.2.3 | Create search query API | 4h | P0 |
| 2.2.4 | Add faceted search | 3h | P0 |
| 2.2.5 | Implement bulk indexing | 3h | P0 |
| 2.2.6 | Add index configuration | 2h | P0 |
| 2.2.7 | Create sync with database | 4h | P1 |
| 2.2.8 | Add tenant isolation | 2h | P0 |
| 2.2.9 | Implement synonyms | 2h | P2 |
| 2.2.10 | Write tests | 4h | P0 |

**Acceptance Criteria:**
- [ ] Indexing works correctly
- [ ] Search returns relevant results
- [ ] Facets calculated correctly
- [ ] Multi-tenant isolation enforced

---

### Epic 2.3: Realtime Module

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.3.1 | Set up Supabase Realtime | 3h | P0 |
| 2.3.2 | Implement channel subscription | 3h | P0 |
| 2.3.3 | Add presence tracking | 4h | P0 |
| 2.3.4 | Create broadcast functionality | 2h | P0 |
| 2.3.5 | Implement database subscriptions | 4h | P1 |
| 2.3.6 | Add auth token management | 3h | P0 |
| 2.3.7 | Create channel cleanup | 2h | P1 |
| 2.3.8 | Implement reconnection logic | 3h | P0 |
| 2.3.9 | Write tests | 4h | P0 |

**Acceptance Criteria:**
- [ ] WebSocket connections work
- [ ] Presence tracking accurate
- [ ] Messages delivered in real-time
- [ ] Reconnection handles gracefully

---

## Phase 3: Supporting Modules (Weeks 5-6)

### Epic 3.1: Flags Module

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.1.1 | Create flags table | 2h | P0 |
| 3.1.2 | Implement isEnabled check | 2h | P0 |
| 3.1.3 | Add getValue for multivariate | 2h | P0 |
| 3.1.4 | Create targeting rules engine | 6h | P1 |
| 3.1.5 | Implement percentage rollouts | 3h | P1 |
| 3.1.6 | Add override functionality | 2h | P0 |
| 3.1.7 | Create experiments support | 4h | P2 |
| 3.1.8 | Implement flag caching | 2h | P0 |
| 3.1.9 | Create admin API | 3h | P1 |
| 3.1.10 | Write tests | 4h | P0 |

**Acceptance Criteria:**
- [ ] Flags evaluate correctly
- [ ] Targeting rules work
- [ ] Overrides apply correctly
- [ ] Caching reduces DB calls

---

### Epic 3.2: Storage Module

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.2.1 | Set up Supabase Storage | 2h | P0 |
| 3.2.2 | Implement upload (direct to S3) | 4h | P0 |
| 3.2.3 | Create signed URLs | 2h | P0 |
| 3.2.4 | Add delete functionality | 1h | P0 |
| 3.2.5 | Implement list files | 2h | P0 |
| 3.2.6 | Add image transformations | 4h | P1 |
| 3.2.7 | Create file metadata storage | 3h | P1 |
| 3.2.8 | Implement quota management | 3h | P2 |
| 3.2.9 | Add copy/move operations | 2h | P2 |
| 3.2.10 | Write tests | 4h | P0 |

**Acceptance Criteria:**
- [ ] Files upload successfully
- [ ] Signed URLs work
- [ ] Image transforms apply
- [ ] Tenant isolation enforced

---

## Phase 4: Polish & Integration (Weeks 7-8)

### Epic 4.1: Integration Testing

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.1.1 | Cross-module integration tests | 8h | P0 |
| 4.1.2 | Load testing | 4h | P1 |
| 4.1.3 | Error scenario testing | 4h | P0 |
| 4.1.4 | Multi-tenant isolation testing | 4h | P0 |

---

### Epic 4.2: Documentation & Examples

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.2.1 | Complete API documentation | 4h | P0 |
| 4.2.2 | Create usage examples | 4h | P1 |
| 4.2.3 | Write troubleshooting guide | 2h | P1 |
| 4.2.4 | Create architecture diagrams | 2h | P1 |

---

### Epic 4.3: Production Hardening

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.3.1 | Add metrics/observability | 4h | P1 |
| 4.3.2 | Implement circuit breakers | 4h | P1 |
| 4.3.3 | Add graceful degradation | 4h | P1 |
| 4.3.4 | Performance optimization | 6h | P1 |

---

## Milestone Summary

| Milestone | Target | Deliverables |
|-----------|--------|--------------|
| **M1: Core Ready** | Week 2 | cache, queue, audit, notifications |
| **M2: Event/Search Ready** | Week 4 | events, search, realtime |
| **M3: Full Feature** | Week 6 | flags, storage |
| **M4: Production Ready** | Week 8 | Testing, docs, hardening |

---

## Dependencies

### Upstream
- @mcv/kernel (complete)
- @mcv/identity (complete for context)

### External Services
| Service | Setup Required |
|---------|----------------|
| Upstash Redis | Account, connection URL |
| Supabase | Project with Realtime, Storage |
| SendGrid | API key, domain verification |
| Twilio | Account SID, Auth token |
| OneSignal | App ID, API key |
| Redpanda | Cluster or managed service |
| Meilisearch | Instance or Meilisearch Cloud |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| External service downtime | Medium | High | Circuit breakers, fallbacks |
| Event ordering issues | Medium | Medium | Partitioning by ventureId |
| Search index drift | Low | Medium | Periodic full reindex |
| Queue overflow | Low | High | Rate limiting, backpressure |

---

## Success Criteria

- [ ] All 9 modules implemented
- [ ] 80%+ test coverage
- [ ] P95 latency < 100ms for cache/flags
- [ ] Zero data loss in audit
- [ ] Notifications delivered within SLA
- [ ] Events processed exactly-once
- [ ] Search results < 200ms

---

*@mcv/fabric — Implementation Plan v1.0*
