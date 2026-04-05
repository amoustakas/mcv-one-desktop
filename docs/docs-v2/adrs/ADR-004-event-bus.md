# ADR-004: Event Bus Design (Redpanda)

**Status:** APPROVED
**Date:** March 10, 2026
**Deciders:** Architecture Team
**Context:**
MCV.ONE requires an event-driven architecture for real-time data flow between modules, ventures, and the Agent Layer. Events power: audit trails, analytics (CDP), notifications, cross-module orchestration, and the Queen/Ralph agent pipeline.

**Problem:**
1. **Scale:** 9+ ventures generating events simultaneously — need horizontal scalability.
2. **Latency:** Agent coordination requires sub-100ms event delivery.
3. **Durability:** Compliance events must be persisted (7+ years for gaming).
4. **Cost:** Confluent Cloud is expensive at scale ($0.60/GB ingress).
5. **Compatibility:** BetEdge prototype uses Apache Kafka — migration path needed.

**Decision:**
We adopt **Redpanda** as the event streaming platform, deployed as a 3-node cluster in Kubernetes (M3+). For M0-M2, we use **Upstash Kafka** (managed, Kafka-compatible) for cost efficiency.

**Rationale:**
- **Kafka API compatible** — zero code changes from BetEdge's Kafka producers/consumers
- **No JVM/ZooKeeper** — single binary, 10x lower resource usage than Kafka
- **Sub-10ms p99 latency** — critical for agent orchestration
- **Open source** (BSL) — aligns with MCV's open-source-first principle
- **Built-in Schema Registry** — Avro/Protobuf schema evolution

**Event Schema Standard:**
```typescript
interface MCVEvent<T = unknown> {
  id: string;           // UUIDv7
  type: string;         // "{domain}.{entity}.{action}" e.g., "crm.contact.created"
  ventureId: string;    // Tenant isolation
  userId: string;       // Actor
  timestamp: string;    // ISO 8601
  version: string;      // Schema version "1.0"
  data: T;              // Event payload
  metadata: {
    correlationId: string;
    source: string;      // Module that emitted
    environment: string; // dev/staging/prod
  };
}
```

**Topic Naming Convention:** `mcv.{venture}.{domain}.{entity}.{action}`
Example: `mcv.betedge.crm.contact.created`

**Consequences:**
- Positive: Kafka ecosystem compatibility, lower ops cost, faster latency
- Negative: Smaller community than Kafka, enterprise support costs
- Migration: BetEdge Kafka code works with zero changes via Kafka API
