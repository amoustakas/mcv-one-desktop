# 02 — Technical Architecture: @mcv/compliance

| Field              | Value                                          |
|--------------------|------------------------------------------------|
| **Package**        | `@mcv/compliance`                              |
| **Classification** | MCV-ONLY                                       |
| **Tier**           | 5 — Domain Layer                               |
| **Version**        | 1.0.0                                          |
| **Last Updated**   | February 9, 2026                               |

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Architecture Diagram](#system-architecture-diagram)
3. [Module Architecture](#module-architecture)
   - [AML Module Architecture](#aml-module-architecture)
   - [Jurisdictions Module Architecture](#jurisdictions-module-architecture)
   - [KYC Module Architecture](#kyc-module-architecture)
   - [Responsible Gaming Module Architecture](#responsible-gaming-module-architecture)
4. [Data Models & Database Schema](#data-models--database-schema)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance Architecture](#performance-architecture)
8. [Scalability](#scalability)
9. [Error Handling & Recovery](#error-handling--recovery)
10. [Observability](#observability)
11. [Security Architecture](#security-architecture)

---

## Architecture Overview

`@mcv/compliance` follows a **modular domain-driven architecture** where each compliance subdomain (KYC, AML, Jurisdictions, Responsible Gaming) is encapsulated as an independent module with its own service layer, database schema, and event contracts. The modules communicate through a shared compliance engine and Redpanda/Kafka event bus, enabling loose coupling while maintaining transactional consistency where required.

### Architecture Principles

| Principle | Implementation |
|-----------|---------------|
| **Defense in Depth** | Multiple compliance checks at every boundary (geo-blocking → age gate → KYC → AML → limits) |
| **Fail Closed** | If any compliance check fails or times out, the operation is blocked by default |
| **Immutable Audit** | Every state transition is recorded in append-only audit logs — no updates, no deletes |
| **Event-Driven** | Cross-module communication via Redpanda/Kafka events; no direct service-to-service calls between domains |
| **Cache-First** | Frequently accessed compliance rules and states are cached in Redis with short TTLs |
| **Encryption by Default** | All PII fields are encrypted at the application layer before database storage |
| **Multi-Tenant Isolation** | Supabase RLS policies enforce venture isolation at the database level |
| **Regulatory Separation** | Each jurisdiction's rules are independently configurable without code changes |

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Next.js 15 (App Router) | API routes, server actions, SSR |
| **Database** | Supabase PostgreSQL | Primary data store with RLS |
| **ORM** | Drizzle ORM | Type-safe schema definitions, queries, migrations |
| **Validation** | Zod | Runtime type validation for all inputs/outputs |
| **Cache** | Redis (Upstash) | Rule caching, rate limiting, session state |
| **Events** | Redpanda/Kafka | Async event streaming between domains |
| **AI** | OpenRouter (Claude 3.5 Sonnet) | Behavioral risk analysis, pattern recognition |
| **GeoIP** | MaxMind GeoLite2 | IP geolocation for jurisdiction determination |
| **Monorepo** | Turborepo | Build orchestration, dependency management |
| **Package Manager** | pnpm | Workspace management |

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL CLIENTS                                    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  BetEdge     │  │  SerpSpace   │  │  Full Gain   │  │  Futurestate │    │
│  │  (Web/Mobile)│  │  (Web)       │  │  (Web)       │  │  (Web)       │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼──────────────────┼──────────────────┼──────────────────┼───────────┘
          │                  │                  │                  │
          ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EDGE LAYER (Vercel Edge)                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Compliance Middleware Stack (executed in order)                     │    │
│  │                                                                     │    │
│  │  1. GeoIP Resolution (MaxMind local DB)                             │    │
│  │  2. VPN/Proxy Detection                                             │    │
│  │  3. Geo-Blocking Check (Redis-cached rules)                         │    │
│  │  4. Age Gate Check (jurisdiction rules)                             │    │
│  │  5. KYC Level Gate (route-level requirements)                       │    │
│  │  6. Self-Exclusion Check (for gaming routes)                        │    │
│  └─────────────────────────────────┬───────────────────────────────────┘    │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER (Next.js 15)                          │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐                         │
│  │  API Routes           │  │  Server Actions       │                         │
│  │  /api/compliance/*    │  │  (React Server       │                         │
│  │                       │  │   Components)        │                         │
│  └───────────┬───────────┘  └──────────┬───────────┘                         │
│              │                          │                                     │
│              ▼                          ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                    COMPLIANCE SERVICE LAYER                          │    │
│  │                                                                      │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │    │
│  │  │  KYC Service │ │  AML Service │ │  Jurisdiction│ │  Resp.     │ │    │
│  │  │              │ │              │ │  Service     │ │  Gaming    │ │    │
│  │  │  initiate()  │ │  screen()    │ │  check()     │ │  Service   │ │    │
│  │  │  verify()    │ │  alert()     │ │  geoAccess() │ │  limits()  │ │    │
│  │  │  assess()    │ │  case()      │ │  license()   │ │  exclude() │ │    │
│  │  │  screen()    │ │  file()      │ │  age()       │ │  assess()  │ │    │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └─────┬──────┘ │    │
│  │         │                │                │               │         │    │
│  │         ▼                ▼                ▼               ▼         │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                   COMPLIANCE ENGINE                          │   │    │
│  │  │                                                              │   │    │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │   │    │
│  │  │  │ Risk       │ │ Rules      │ │ Screening  │ │ Reporting│ │   │    │
│  │  │  │ Engine     │ │ Engine     │ │ Engine     │ │ Engine   │ │   │    │
│  │  │  │            │ │            │ │            │ │          │ │   │    │
│  │  │  │ Composite  │ │ Threshold  │ │ PEP lists  │ │ SAR gen  │ │   │    │
│  │  │  │ scoring    │ │ Velocity   │ │ Sanctions  │ │ CTR gen  │ │   │    │
│  │  │  │ AI-powered │ │ Pattern    │ │ Watchlists │ │ Filing   │ │   │    │
│  │  │  │ assessment │ │ Geographic │ │ Real-time  │ │ Tracking │ │   │    │
│  │  │  │            │ │ Behavioral │ │            │ │          │ │   │    │
│  │  │  │            │ │ Network    │ │            │ │          │ │   │    │
│  │  │  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬───────────────────────┬────────────────────────┘
                             │                       │
              ┌──────────────┤                       ├──────────────┐
              ▼              ▼                       ▼              ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐ ┌──────────────┐
│  Supabase        │ │  Redis       │ │  Redpanda/Kafka  │ │  External    │
│  PostgreSQL      │ │  (Upstash)   │ │                  │ │  APIs        │
│                  │ │              │ │  Topics:         │ │              │
│  45 tables       │ │  Rule cache  │ │  compliance.kyc  │ │  Onfido      │
│  RLS policies    │ │  State cache │ │  compliance.aml  │ │  MaxMind     │
│  PII encrypted   │ │  Rate limits │ │  compliance.juris│ │  ComplyAdv   │
│  Audit append    │ │  Session     │ │  compliance.rg   │ │  OFAC        │
│                  │ │              │ │  compliance.audit│ │  GamStop     │
└──────────────────┘ └──────────────┘ └──────────────────┘ └──────────────┘
```

---

## Module Architecture

### AML Module Architecture

The AML module implements a pipeline architecture where every financial transaction flows through a series of processing stages.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       AML MODULE ARCHITECTURE                        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    TRANSACTION INGESTION                    │     │
│  │                                                            │     │
│  │  Event: payment.transaction.completed                      │     │
│  │  Event: crypto.transaction.initiated                       │     │
│  │  API:   POST /api/compliance/aml/screen                    │     │
│  └────────────────────────┬───────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    ENRICHMENT STAGE                         │     │
│  │                                                            │     │
│  │  • Normalize amount to USD                                 │     │
│  │  • Resolve user profile & KYC data from @mcv/identity      │     │
│  │  • Attach geo-location from IP                             │     │
│  │  • Fetch historical transaction context (last 30 days)     │     │
│  │  • Calculate running aggregates (24h, 7d, 30d)             │     │
│  └────────────────────────┬───────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    RULE ENGINE                              │     │
│  │                                                            │     │
│  │  Rules loaded from Redis cache (5-min TTL)                 │     │
│  │  Evaluated in priority order:                              │     │
│  │                                                            │     │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐             │     │
│  │  │ SANCTIONS  │→│ THRESHOLD  │→│ VELOCITY   │             │     │
│  │  │ (blocking) │ │ (CTR/SAR)  │ │ (frequency)│             │     │
│  │  └────────────┘ └────────────┘ └────────────┘             │     │
│  │                                                            │     │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐             │     │
│  │  │ GEOGRAPHIC │→│ BEHAVIORAL │→│ NETWORK    │             │     │
│  │  │ (FATF/OFAC)│ │ (anomaly)  │ │ (links)    │             │     │
│  │  └────────────┘ └────────────┘ └────────────┘             │     │
│  └────────────────────────┬───────────────────────────────────┘     │
│                           │                                          │
│              ┌────────────┼────────────┐                             │
│              ▼            ▼            ▼                              │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────┐                    │
│  │   BLOCKED    │ │  FLAGGED │ │   CLEARED    │                    │
│  │              │ │          │ │              │                    │
│  │ Sanctions    │ │ Alert    │ │ Record txn   │                    │
│  │ match →      │ │ created  │ │ Update risk  │                    │
│  │ halt txn     │ │ Case may │ │ score        │                    │
│  │ Notify comp. │ │ be opened│ │              │                    │
│  │ officer      │ │          │ │              │                    │
│  └──────────────┘ └────┬─────┘ └──────────────┘                    │
│                         │                                            │
│                         ▼                                            │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    PATTERN ANALYSIS (Async)                 │     │
│  │                                                            │     │
│  │  Runs after screening, analyzes broader patterns:          │     │
│  │                                                            │     │
│  │  • Structuring: Amounts clustered below CTR threshold      │     │
│  │  • Layering: Rapid multi-hop fund movements                │     │
│  │  • Smurfing: Many small deposits from different sources    │     │
│  │  • Round-tripping: Funds return to origin                  │     │
│  │  • Chip dumping: Deliberate losses (BetEdge-specific)      │     │
│  │                                                            │     │
│  │  Uses sliding windows: 24h, 7d, 30d aggregations          │     │
│  └────────────────────────┬───────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    ALERT / CASE LIFECYCLE                   │     │
│  │                                                            │     │
│  │  NEW → INVESTIGATING → ESCALATED → FILED (SAR/CTR)         │     │
│  │    │                      │                                │     │
│  │    └→ DISMISSED           └→ DISMISSED                     │     │
│  │       (false_positive)       (insufficient_evidence)       │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    RISK SCORING                             │     │
│  │                                                            │     │
│  │  Composite score (0-1000) with time decay:                 │     │
│  │                                                            │     │
│  │  Score = Σ(factor_score × weight × decay_factor)           │     │
│  │                                                            │     │
│  │  Factors:                                                  │     │
│  │  • Transaction risk (30%) — volume, patterns, amounts      │     │
│  │  • Geographic risk (20%) — jurisdiction, FATF ratings      │     │
│  │  • Behavioral risk (20%) — anomalies, changes              │     │
│  │  • Network risk (15%) — connected accounts, shared IDs     │     │
│  │  • Alert history (15%) — past alerts, dispositions         │     │
│  │                                                            │     │
│  │  Decay: exp(-t/180) where t = days since event             │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

#### AML Service Internal Structure

```typescript
// packages/compliance/src/aml/service.ts

import { db } from '@mcv/database';
import { redis } from '@mcv/kernel';
import { eventBus } from '@mcv/fabric';
import { eq, and, gte, sql } from 'drizzle-orm';
import {
  amlTransactionRecords,
  amlAlerts,
  amlCases,
  amlRules,
  amlRiskScores,
  amlPatterns,
  amlSanctionsScreenings,
  amlAuditLog,
} from './schema';

export class AmlService {
  private ruleCache: Map<string, AmlRule[]> = new Map();
  private readonly CACHE_KEY = 'compliance:aml:rules';
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Screen a single transaction against all active AML rules.
   * This is the critical path — must complete in <100ms.
   */
  async screenTransaction(input: TransactionScreeningInput): Promise<TransactionScreeningResult> {
    const startTime = performance.now();

    // 1. Enrich transaction with context
    const enriched = await this.enrichTransaction(input);

    // 2. Run sanctions screening (blocking — halts transaction if match)
    const sanctionsResult = await this.screenSanctions(
      enriched.userId,
      enriched.transactionRecordId
    );

    if (sanctionsResult.result === 'confirmed_match') {
      return {
        transactionRecordId: enriched.transactionRecordId,
        screeningResult: 'blocked',
        riskScore: 1000,
        rulesTriggered: ['SANCTIONS_MATCH'],
        alertIds: [await this.createCriticalAlert(enriched, sanctionsResult)],
        sanctionsResult: 'confirmed_match',
        processingTimeMs: performance.now() - startTime,
      };
    }

    // 3. Load and evaluate rules from cache
    const rules = await this.getActiveRules(enriched.ventureId);
    const triggeredRules: TriggeredRule[] = [];

    for (const rule of rules) {
      const result = await this.evaluateRule(rule, enriched);
      if (result.triggered) {
        triggeredRules.push({ rule, result });
      }
    }

    // 4. Create alerts for triggered rules
    const alertIds: string[] = [];
    for (const { rule, result } of triggeredRules) {
      const alert = await this.createAlert(enriched, rule, result);
      alertIds.push(alert.id);
    }

    // 5. Calculate risk score
    const riskScore = await this.calculateTransactionRiskScore(enriched, triggeredRules);

    // 6. Record transaction
    await this.recordTransaction(enriched, {
      riskScore,
      screeningResult: triggeredRules.length > 0 ? 'flagged' : 'cleared',
      rulesTriggered: triggeredRules.map(t => t.rule.id),
      alertIds,
    });

    // 7. Emit event for async pattern analysis
    await eventBus.emit('compliance.aml.transaction.screened', {
      transactionRecordId: enriched.transactionRecordId,
      userId: enriched.userId,
      ventureId: enriched.ventureId,
      riskScore,
      rulesTriggered: triggeredRules.length,
    });

    return {
      transactionRecordId: enriched.transactionRecordId,
      screeningResult: triggeredRules.length > 0 ? 'flagged' : 'cleared',
      riskScore,
      rulesTriggered: triggeredRules.map(t => t.rule.id),
      alertIds,
      sanctionsResult: sanctionsResult.result,
      processingTimeMs: performance.now() - startTime,
    };
  }

  /**
   * Load active rules from Redis cache or database.
   */
  private async getActiveRules(ventureId: string): Promise<AmlRule[]> {
    const cacheKey = `${this.CACHE_KEY}:${ventureId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const rules = await db.query.amlRules.findMany({
      where: and(
        eq(amlRules.isActive, true),
        sql`(${amlRules.ventureId} = ${ventureId} OR ${amlRules.ventureId} IS NULL)`
      ),
      orderBy: [amlRules.priority],
    });

    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(rules));
    return rules;
  }
}
```

---

### Jurisdictions Module Architecture

The Jurisdictions module implements a hierarchical rule evaluation system with multi-layer geographic access control.

```
┌─────────────────────────────────────────────────────────────────────┐
│                   JURISDICTIONS MODULE ARCHITECTURE                   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    GEO-ACCESS PIPELINE                      │     │
│  │                                                            │     │
│  │  Request (IP + optional GPS + user profile)                │     │
│  │         │                                                  │     │
│  │         ▼                                                  │     │
│  │  ┌──────────────────┐                                      │     │
│  │  │ 1. IP Resolution │  MaxMind GeoLite2 (local DB)         │     │
│  │  │    → Country     │  Result: { country: 'US',            │     │
│  │  │    → State       │           state: 'NJ',               │     │
│  │  │    → City        │           city: 'Newark',            │     │
│  │  │    → Coords      │           lat: 40.73, lon: -74.17 }  │     │
│  │  └────────┬─────────┘                                      │     │
│  │           │                                                │     │
│  │           ▼                                                │     │
│  │  ┌──────────────────┐                                      │     │
│  │  │ 2. VPN/Proxy     │  Check against known VPN providers,  │     │
│  │  │    Detection     │  Tor exit nodes, datacenter IPs,     │     │
│  │  │                  │  residential proxy lists              │     │
│  │  │    vpnDetected:  │                                      │     │
│  │  │    true/false    │                                      │     │
│  │  └────────┬─────────┘                                      │     │
│  │           │                                                │     │
│  │           ▼                                                │     │
│  │  ┌──────────────────┐                                      │     │
│  │  │ 3. GPS Cross-    │  If GPS coordinates provided:        │     │
│  │  │    Validation    │  • Calculate distance to IP location  │     │
│  │  │                  │  • Flag if > 50km discrepancy         │     │
│  │  │                  │  • GPS overrides IP for state-level   │     │
│  │  └────────┬─────────┘                                      │     │
│  │           │                                                │     │
│  │           ▼                                                │     │
│  │  ┌──────────────────┐                                      │     │
│  │  │ 4. Jurisdiction  │  Hierarchical rule lookup:            │     │
│  │  │    Rule Lookup   │  1. State rules (US-NJ)              │     │
│  │  │                  │  2. Country rules (US)               │     │
│  │  │    Cached in     │  3. Region rules (north_america)     │     │
│  │  │    Redis (5min)  │  Most specific rule wins             │     │
│  │  └────────┬─────────┘                                      │     │
│  │           │                                                │     │
│  │           ▼                                                │     │
│  │  ┌──────────────────┐                                      │     │
│  │  │ 5. Geo Rule      │  Evaluate matching geo rules:        │     │
│  │  │    Evaluation    │  • allow → pass through              │     │
│  │  │                  │  • block → deny + message            │     │
│  │  │                  │  • restrict → partial access          │     │
│  │  │                  │  • age_gate → require verification    │     │
│  │  │                  │  • vpn_block → deny if VPN            │     │
│  │  └────────┬─────────┘                                      │     │
│  │           │                                                │     │
│  │           ▼                                                │     │
│  │  ┌──────────────────┐                                      │     │
│  │  │ 6. Venture Status│  Check venture operational status     │     │
│  │  │    Check         │  in resolved jurisdiction             │     │
│  │  │                  │  • active → proceed                  │     │
│  │  │                  │  • suspended → block                 │     │
│  │  │                  │  • prohibited → block                │     │
│  │  └────────┬─────────┘                                      │     │
│  │           │                                                │     │
│  │           ▼                                                │     │
│  │  GeoAccessResult { allowed, action, jurisdiction,          │     │
│  │                     vpnDetected, restrictions,             │     │
│  │                     requiresAgeVerification }              │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    LICENSE MANAGEMENT                       │     │
│  │                                                            │     │
│  │  License Lifecycle:                                        │     │
│  │                                                            │     │
│  │  APPLIED → PENDING → GRANTED → [RENEWED] → EXPIRED        │     │
│  │                         │                                  │     │
│  │                         ├→ SUSPENDED → GRANTED (reinstated)│     │
│  │                         └→ REVOKED (terminal)              │     │
│  │                                                            │     │
│  │  Monitoring:                                               │     │
│  │  • Expiry notifications at 90/60/30/14/7/1 days           │     │
│  │  • Auto-suspend venture if license expires                 │     │
│  │  • Renewal tracking with lead time configuration           │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    COMPLIANCE CALENDAR                      │     │
│  │                                                            │     │
│  │  Event Types:                                              │     │
│  │  • license_renewal      • filing_deadline                  │     │
│  │  • audit_date           • regulatory_change                │     │
│  │  • report_due           • fee_payment                      │     │
│  │  • inspection           • training_deadline                │     │
│  │                                                            │     │
│  │  Features:                                                 │     │
│  │  • Recurring events (iCal RRULE format)                    │     │
│  │  • Escalating reminders (configurable day intervals)       │     │
│  │  • Status tracking (upcoming → in_progress → completed)    │     │
│  │  • Assignment to specific compliance officers              │     │
│  │  • Overdue detection and escalation                        │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Jurisdiction Rule Resolution

```typescript
// packages/compliance/src/jurisdictions/service.ts

export class JurisdictionService {
  /**
   * Evaluate geographic access for a user request.
   * Multi-layer validation: IP → VPN → GPS → Rules → Venture Status
   */
  async evaluateGeoAccess(
    ventureId: string,
    ipAddress: string,
    gpsCoords?: GpsCoordinates
  ): Promise<GeoAccessResult> {
    // Step 1: Resolve IP to jurisdiction
    const geoResult = await this.geoipProvider.lookup(ipAddress);
    const jurisdictionCode = geoResult.stateCode
      ? `${geoResult.countryCode}-${geoResult.stateCode}`
      : geoResult.countryCode;

    // Step 2: VPN/Proxy detection
    const vpnResult = await this.detectVpn(ipAddress);

    // Step 3: GPS cross-validation (if provided)
    if (gpsCoords) {
      const distance = haversineDistance(
        { lat: geoResult.latitude, lon: geoResult.longitude },
        { lat: gpsCoords.latitude, lon: gpsCoords.longitude }
      );
      if (distance > this.config.gpsIpMaxDistanceKm) {
        // GPS and IP significantly diverge — flag for review
        await this.logGeoDiscrepancy(ventureId, ipAddress, gpsCoords, distance);
      }
    }

    // Step 4: Load and evaluate geo rules (hierarchical)
    const rules = await this.getGeoRules(ventureId, jurisdictionCode);
    const matchingRule = this.findHighestPriorityRule(rules);

    if (!matchingRule) {
      // No explicit rule — default allow for commerce, default block for gambling
      return this.getDefaultAccess(ventureId, jurisdictionCode);
    }

    // Step 5: Handle VPN detection
    if (vpnResult.isVpn && matchingRule.vpnDetection) {
      return {
        allowed: false,
        action: 'vpn_block',
        jurisdiction: jurisdictionCode,
        vpnDetected: true,
        blockMessage: 'VPN/proxy usage is not permitted for this service.',
      };
    }

    // Step 6: Check venture operational status
    const ventureStatus = await this.getVentureStatus(ventureId, jurisdictionCode);
    if (ventureStatus !== 'active') {
      return {
        allowed: false,
        action: 'block',
        jurisdiction: jurisdictionCode,
        vpnDetected: vpnResult.isVpn,
        blockMessage: `Service not available in ${geoResult.countryName}.`,
      };
    }

    return {
      allowed: matchingRule.action === 'allow',
      action: matchingRule.action,
      jurisdiction: jurisdictionCode,
      vpnDetected: vpnResult.isVpn,
      restrictions: matchingRule.restrictions?.blockedFeatures,
      blockMessage: matchingRule.blockMessage,
      requiresAgeVerification: matchingRule.action === 'age_gate',
    };
  }

  /**
   * Hierarchical rule lookup: state → country → region
   */
  private async getGeoRules(
    ventureId: string,
    jurisdictionCode: string
  ): Promise<JurisdictionGeoRule[]> {
    const cacheKey = `compliance:geo:rules:${ventureId}:${jurisdictionCode}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Build hierarchy: US-NJ → US → north_america
    const codes = this.buildJurisdictionHierarchy(jurisdictionCode);

    const rules = await db.query.jurisdictionGeoRules.findMany({
      where: and(
        sql`(${jurisdictionGeoRules.ventureId} = ${ventureId} OR ${jurisdictionGeoRules.ventureId} IS NULL)`,
        eq(jurisdictionGeoRules.isActive, true),
        sql`${jurisdictionGeoRules.jurisdictionId} IN (
          SELECT id FROM compliance_jurisdictions WHERE code = ANY(${codes})
        )`
      ),
      orderBy: [desc(jurisdictionGeoRules.priority)],
    });

    await redis.setex(cacheKey, 300, JSON.stringify(rules));
    return rules;
  }
}
```

---

### KYC Module Architecture

The KYC module implements a state machine-driven verification flow with pluggable verification providers.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       KYC MODULE ARCHITECTURE                        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    PROVIDER ABSTRACTION LAYER               │     │
│  │                                                            │     │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐           │     │
│  │  │  Onfido    │  │  Jumio     │  │  Veriff    │           │     │
│  │  │  Adapter   │  │  Adapter   │  │  Adapter   │           │     │
│  │  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘           │     │
│  │         └───────────────┼───────────────┘                  │     │
│  │                         │                                  │     │
│  │                         ▼                                  │     │
│  │  ┌──────────────────────────────────────────────┐          │     │
│  │  │        IVerificationProvider Interface       │          │     │
│  │  │                                              │          │     │
│  │  │  verifyDocument(doc): DocumentResult         │          │     │
│  │  │  checkLiveness(selfie): LivenessResult       │          │     │
│  │  │  extractOcr(image): OcrResult                │          │     │
│  │  │  readNfc(chipData): NfcResult                │          │     │
│  │  └──────────────────────────────────────────────┘          │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    VERIFICATION STATE MACHINE               │     │
│  │                                                            │     │
│  │                    ┌──────────┐                             │     │
│  │                    │   NONE   │                             │     │
│  │                    └────┬─────┘                             │     │
│  │                         │ initiate()                       │     │
│  │                         ▼                                  │     │
│  │                    ┌──────────┐                             │     │
│  │                    │INITIATED │                             │     │
│  │                    └────┬─────┘                             │     │
│  │                         │ uploadDocument()                 │     │
│  │                         ▼                                  │     │
│  │                    ┌───────────────────┐                    │     │
│  │                    │DOCUMENTS_SUBMITTED│                    │     │
│  │                    └────┬──────────────┘                    │     │
│  │                         │                                  │     │
│  │              ┌──────────┴──────────┐                       │     │
│  │              │                     │                       │     │
│  │              ▼ (enhanced+)         ▼ (basic/standard)     │     │
│  │   ┌──────────────────┐   ┌───────────────────┐            │     │
│  │   │LIVENESS_PENDING  │   │SCREENING_PENDING  │            │     │
│  │   └────────┬─────────┘   └───────┬───────────┘            │     │
│  │            │ checkLiveness()     │                         │     │
│  │            │                     │                         │     │
│  │            └──────────┬──────────┘                         │     │
│  │                       │ screenPepSanctions()              │     │
│  │                       ▼                                    │     │
│  │              ┌──────────────┐                              │     │
│  │              │  IN_REVIEW   │                              │     │
│  │              └──┬───┬───┬──┘                              │     │
│  │                 │   │   │                                  │     │
│  │    ┌────────────┘   │   └────────────┐                    │     │
│  │    ▼                ▼                ▼                     │     │
│  │ ┌────────┐   ┌──────────┐   ┌──────────┐                 │     │
│  │ │APPROVED│   │ REJECTED │   │ EXPIRED  │                 │     │
│  │ └───┬────┘   └──────────┘   └──────────┘                 │     │
│  │     │ (doc expires / periodic review)                     │     │
│  │     ▼                                                     │     │
│  │ ┌───────────┐                                             │     │
│  │ │ SUSPENDED │ → re-verify → APPROVED                      │     │
│  │ └───────────┘                                             │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    RISK SCORING MODEL                       │     │
│  │                                                            │     │
│  │  Score = Σ(factor_score × weight)  Range: 0-1000           │     │
│  │                                                            │     │
│  │  ┌──────────────────────┬────────┬──────────────────────┐  │     │
│  │  │ Factor               │ Weight │ Score Range           │  │     │
│  │  ├──────────────────────┼────────┼──────────────────────┤  │     │
│  │  │ Country risk         │  25%   │ 0-250 (FATF ratings)  │  │     │
│  │  │ PEP status           │  20%   │ 0/200 (binary+level) │  │     │
│  │  │ Adverse media        │  15%   │ 0-150 (count+severity)│  │     │
│  │  │ Transaction volume   │  15%   │ 0-150 (vs baseline)  │  │     │
│  │  │ Document quality     │  10%   │ 0-100 (OCR confidence)│  │     │
│  │  │ Velocity             │  10%   │ 0-100 (account age)  │  │     │
│  │  │ Age bracket          │   5%   │ 0-50 (risk by age)   │  │     │
│  │  └──────────────────────┴────────┴──────────────────────┘  │     │
│  │                                                            │     │
│  │  Risk Categories:                                          │     │
│  │  • 0-199:   Low       → Standard monitoring               │     │
│  │  • 200-399: Medium    → Standard monitoring                │     │
│  │  • 400-599: High      → Enhanced monitoring                │     │
│  │  • 600-799: Critical  → Enhanced monitoring + alert        │     │
│  │  • 800-1000: Extreme  → Manual review required             │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    PEP/SANCTIONS SCREENING                  │     │
│  │                                                            │     │
│  │  Provider: ComplyAdvantage / Dow Jones / Refinitiv          │     │
│  │                                                            │     │
│  │  Process:                                                  │     │
│  │  1. Submit search: name + DOB + nationality + aliases       │     │
│  │  2. Fuzzy matching (configurable threshold, default 0.85)   │     │
│  │  3. Receive hits with match scores and list details         │     │
│  │  4. Auto-dismiss hits below confidence threshold            │     │
│  │  5. Queue remaining for manual review                       │     │
│  │                                                            │     │
│  │  Cadence:                                                  │     │
│  │  • Initial: On verification (all levels)                    │     │
│  │  • Standard: Every 90 days                                  │     │
│  │  • High-risk: Every 30 days                                 │     │
│  │  • On watchlist update: Within 24 hours                     │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Responsible Gaming Module Architecture

The Responsible Gaming module implements a player protection system with real-time limit enforcement and AI-powered behavioral analysis.

```
┌─────────────────────────────────────────────────────────────────────┐
│                RESPONSIBLE GAMING MODULE ARCHITECTURE                 │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    LIMIT ENFORCEMENT ENGINE                 │     │
│  │                                                            │     │
│  │  Every player action is checked against active limits:     │     │
│  │                                                            │     │
│  │  Player Action (deposit / wager / session start)           │     │
│  │         │                                                  │     │
│  │         ▼                                                  │     │
│  │  ┌──────────────────┐                                      │     │
│  │  │ 1. Self-Exclusion│  Is user self-excluded?              │     │
│  │  │    Check         │  → Yes: BLOCK (immediate, no appeal) │     │
│  │  └────────┬─────────┘                                      │     │
│  │           │ No                                             │     │
│  │           ▼                                                │     │
│  │  ┌──────────────────┐                                      │     │
│  │  │ 2. Cooling-Off   │  Is user in cooling-off period?      │     │
│  │  │    Check         │  → Yes: BLOCK (temporary)            │     │
│  │  └────────┬─────────┘                                      │     │
│  │           │ No                                             │     │
│  │           ▼                                                │     │
│  │  ┌──────────────────┐                                      │     │
│  │  │ 3. Deposit Limit │  For deposit actions:                │     │
│  │  │    Check         │  Check daily, weekly, monthly limits  │     │
│  │  │                  │  Most restrictive limit wins          │     │
│  │  │    Redis-cached  │  → Exceeded: BLOCK deposit           │     │
│  │  └────────┬─────────┘                                      │     │
│  │           │ Within limits                                  │     │
│  │           ▼                                                │     │
│  │  ┌──────────────────┐                                      │     │
│  │  │ 4. Loss Limit    │  For wager actions:                  │     │
│  │  │    Check         │  Current losses + potential loss      │     │
│  │  │                  │  ≤ limit for period                   │     │
│  │  │    Redis-cached  │  → Would exceed: BLOCK wager         │     │
│  │  └────────┬─────────┘                                      │     │
│  │           │ Within limits                                  │     │
│  │           ▼                                                │     │
│  │  ┌──────────────────┐                                      │     │
│  │  │ 5. Wager Limit   │  Per-bet and aggregate check         │     │
│  │  │    Check         │  → Exceeded: BLOCK wager             │     │
│  │  └────────┬─────────┘                                      │     │
│  │           │ Within limits                                  │     │
│  │           ▼                                                │     │
│  │  ┌──────────────────┐                                      │     │
│  │  │ 6. Time Limit    │  Session duration / daily total      │     │
│  │  │    Check         │  → Exceeded: END SESSION             │     │
│  │  └────────┬─────────┘                                      │     │
│  │           │ Within limits                                  │     │
│  │           ▼                                                │     │
│  │  ACTION ALLOWED → Update usage counters in Redis           │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    LIMIT CHANGE PROTECTION                  │     │
│  │                                                            │     │
│  │  Asymmetric cooling-off periods prevent impulsive changes:  │     │
│  │                                                            │     │
│  │  ┌─────────────────┬──────────────────┬──────────────────┐ │     │
│  │  │ Change Type     │ Effective When    │ Rationale        │ │     │
│  │  ├─────────────────┼──────────────────┼──────────────────┤ │     │
│  │  │ Decrease limit  │ IMMEDIATELY       │ Always player-   │ │     │
│  │  │                 │                  │ protective       │ │     │
│  │  │ Increase limit  │ After 24-72h     │ Prevent impulsive│ │     │
│  │  │                 │ cooling-off      │ chase            │ │     │
│  │  │ Remove limit    │ After 7-day      │ Strongest        │ │     │
│  │  │                 │ cooling-off      │ protection       │ │     │
│  │  │ Self-exclude    │ IMMEDIATELY       │ Player requested │ │     │
│  │  │ (temporary)     │                  │ protection       │ │     │
│  │  │ Self-exclude    │ IMMEDIATELY       │ Irrevocable      │ │     │
│  │  │ (permanent)     │ NEVER expires    │                  │ │     │
│  │  └─────────────────┴──────────────────┴──────────────────┘ │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    BEHAVIORAL RISK AI ENGINE                │     │
│  │                                                            │     │
│  │  Runs periodically (every 4 hours for active players)      │     │
│  │                                                            │     │
│  │  Input Data:                                               │     │
│  │  • Transaction history (deposits, wagers, wins, losses)    │     │
│  │  • Session patterns (duration, frequency, time-of-day)     │     │
│  │  • Betting patterns (amounts, types, odds, markets)        │     │
│  │  • Limit interactions (changes, limit-boundary events)     │     │
│  │  • Historical risk scores and interventions                │     │
│  │                                                            │     │
│  │  AI Analysis (via OpenRouter):                             │     │
│  │  ┌──────────────────────────────────────────────────────┐  │     │
│  │  │  Model: claude-3.5-sonnet                            │  │     │
│  │  │                                                      │  │     │
│  │  │  Analyze player behavior for risk indicators:        │  │     │
│  │  │  • Loss chasing (increasing bets after losses)       │  │     │
│  │  │  • Erratic betting (pattern disruption)              │  │     │
│  │  │  • Time creep (lengthening sessions)                 │  │     │
│  │  │  • Escalating deposits (increasing frequency/amount) │  │     │
│  │  │  • Late-night activity concentration                 │  │     │
│  │  │  • Limit-boundary testing                            │  │     │
│  │  │  • Rapid session restarts                            │  │     │
│  │  │                                                      │  │     │
│  │  │  Output: risk_score (0-1000), indicators[], action   │  │     │
│  │  └──────────────────────────────────────────────────────┘  │     │
│  │                                                            │     │
│  │  Risk-Based Actions:                                       │     │
│  │  ┌──────────────┬──────────────────────────────────────┐  │     │
│  │  │ Risk Level   │ Automated Response                   │  │     │
│  │  ├──────────────┼──────────────────────────────────────┤  │     │
│  │  │ Low (0-199)  │ No action, continue monitoring       │  │     │
│  │  │ Moderate     │ Increase reality check frequency     │  │     │
│  │  │ (200-399)    │ Show responsible gaming resources     │  │     │
│  │  │ Elevated     │ Send gentle notification message     │  │     │
│  │  │ (400-599)    │ Suggest setting limits               │  │     │
│  │  │ High         │ Pop-up warning with mandatory pause  │  │     │
│  │  │ (600-799)    │ Force 15-minute break                │  │     │
│  │  │ Critical     │ Force session end, contact outreach  │  │     │
│  │  │ (800-1000)   │ Notify compliance officer            │  │     │
│  │  └──────────────┴──────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    REALITY CHECK SYSTEM                     │     │
│  │                                                            │     │
│  │  Timer-based interruptions during active gaming sessions:   │     │
│  │                                                            │     │
│  │  Session Start                                             │     │
│  │       │                                                    │     │
│  │       ├─ [interval] → Reality Check Popup                  │     │
│  │       │                │                                   │     │
│  │       │                ├─ Shows: elapsed time, net P&L,    │     │
│  │       │                │  total wagered, RG resources      │     │
│  │       │                │                                   │     │
│  │       │                ├─ Player choices:                  │     │
│  │       │                │  • "Continue" → resume, log       │     │
│  │       │                │  • "Take a break" → cooldown      │     │
│  │       │                │  • "Set a limit" → limit panel    │     │
│  │       │                │  • "End session" → logout         │     │
│  │       │                │                                   │     │
│  │       │                └─ Response logged for compliance   │     │
│  │       │                                                    │     │
│  │       ├─ [interval] → Reality Check Popup                  │     │
│  │       │                                                    │     │
│  │       └─ [time limit] → Forced Session End                 │     │
│  │                                                            │     │
│  │  Default interval: 60 minutes (configurable per player)    │     │
│  │  Regulatory requirements:                                  │     │
│  │  • UKGC: Mandatory, player can set interval                │     │
│  │  • MGA: Mandatory, minimum every 60 minutes                │     │
│  │  • Sweden (SGA): Mandatory, every 60 minutes               │     │
│  │  • Germany (GGL): Mandatory, every 60 minutes              │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    SELF-EXCLUSION INTEGRATION               │     │
│  │                                                            │     │
│  │  ┌──────────────┐                                          │     │
│  │  │  Temporary   │  Duration: 1 month – 5 years             │     │
│  │  │  Self-       │  • Block all gaming activity              │     │
│  │  │  Exclusion   │  • Block deposits                         │     │
│  │  │              │  • Allow withdrawal of balance            │     │
│  │  │              │  • Cannot be reversed during period        │     │
│  │  └──────────────┘                                          │     │
│  │                                                            │     │
│  │  ┌──────────────┐                                          │     │
│  │  │  Permanent   │  Duration: Forever                        │     │
│  │  │  Self-       │  • All blocks from temporary              │     │
│  │  │  Exclusion   │  • Account permanently restricted         │     │
│  │  │              │  • IRREVOCABLE — no appeal, no reversal   │     │
│  │  └──────────────┘                                          │     │
│  │                                                            │     │
│  │  ┌──────────────┐                                          │     │
│  │  │  GamStop     │  UK national self-exclusion register     │     │
│  │  │  Integration │  • API check on registration/login       │     │
│  │  │              │  • Automatic block if registered          │     │
│  │  │              │  • Periodic batch checks                  │     │
│  │  └──────────────┘                                          │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Models & Database Schema

### Schema Overview

The compliance package defines **45 database tables** organized across 4 submodules. All tables use Drizzle ORM for type-safe schema definitions and are stored in Supabase PostgreSQL with RLS policies.

#### Table Distribution

```
compliance_kyc_*                   (8 tables)
├── compliance_kyc_profiles
├── compliance_kyc_documents
├── compliance_kyc_verifications
├── compliance_kyc_liveness_checks
├── compliance_kyc_risk_assessments
├── compliance_kyc_pep_screenings
├── compliance_kyc_watchlist_hits
└── compliance_kyc_audit_log

compliance_aml_*                   (12 tables)
├── compliance_aml_transaction_records
├── compliance_aml_alerts
├── compliance_aml_cases
├── compliance_aml_sar_filings
├── compliance_aml_ctr_filings
├── compliance_aml_rules
├── compliance_aml_risk_scores
├── compliance_aml_patterns
├── compliance_aml_watchlists
├── compliance_aml_sanctions_screenings
├── compliance_aml_threshold_configs
└── compliance_aml_audit_log

compliance_jurisdiction_*          (10 tables)
├── compliance_jurisdictions
├── compliance_jurisdiction_requirements
├── compliance_jurisdiction_licenses
├── compliance_jurisdiction_geo_rules
├── compliance_jurisdiction_age_rules
├── compliance_jurisdiction_tax_rules
├── compliance_jurisdiction_data_rules
├── compliance_jurisdiction_venture_status
├── compliance_calendar
└── compliance_filings

compliance_*  (responsible gaming)  (15 tables)
├── compliance_player_protection_profiles
├── compliance_deposit_limits
├── compliance_loss_limits
├── compliance_wager_limits
├── compliance_time_limits
├── compliance_self_exclusions
├── compliance_cooling_off_periods
├── compliance_reality_checks
├── compliance_reality_check_logs
├── compliance_behavioral_risk_scores
├── compliance_behavioral_indicators
├── compliance_interventions
├── compliance_intervention_actions
├── compliance_player_activity_summaries
└── compliance_responsible_gaming_audit_log
```

### Key Schema Definitions (Drizzle ORM)

#### KYC Profiles

```typescript
import { pgTable, uuid, text, boolean, integer, timestamp, date,
         jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { kycVerificationLevelEnum, kycStatusEnum } from './enums';

export const kycProfiles = pgTable('compliance_kyc_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull(),
  verificationLevel: kycVerificationLevelEnum('verification_level').default('none'),
  status: kycStatusEnum('status').default('pending'),
  firstName: text('first_name'),                       // Encrypted
  lastName: text('last_name'),                         // Encrypted
  dateOfBirth: date('date_of_birth'),
  nationality: text('nationality'),                    // ISO 3166-1 alpha-2
  countryOfResidence: text('country_of_residence'),    // ISO 3166-1 alpha-2
  address: jsonb('address').$type<KycAddress>(),       // Encrypted JSON
  taxIdentificationNumber: text('tax_identification_number'), // Encrypted
  phoneNumber: text('phone_number'),                   // Encrypted
  riskScore: integer('risk_score'),                    // 0-1000
  riskCategory: text('risk_category'),                 // low | medium | high | critical
  pepStatus: boolean('pep_status').default(false),
  sanctionsStatus: boolean('sanctions_status').default(false),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
  nextReviewDate: timestamp('next_review_date', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userVentureIdx: uniqueIndex('kyc_profiles_user_venture_idx')
    .on(table.userId, table.ventureId),
  statusIdx: index('kyc_profiles_status_idx').on(table.status),
  riskCategoryIdx: index('kyc_profiles_risk_category_idx').on(table.riskCategory),
  nextReviewIdx: index('kyc_profiles_next_review_idx').on(table.nextReviewDate),
}));
```

#### AML Transaction Records

```typescript
export const amlTransactionRecords = pgTable('compliance_aml_transaction_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull(),
  transactionId: text('transaction_id').notNull(),
  transactionType: text('transaction_type').notNull(),
  // deposit | withdrawal | wager | payout | transfer | crypto_buy | crypto_sell
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').notNull(),
  amountUsd: numeric('amount_usd', { precision: 19, scale: 4 }),
  sourceType: text('source_type'),
  destinationType: text('destination_type'),
  ipAddress: text('ip_address'),
  geoLocation: jsonb('geo_location'),
  deviceFingerprint: text('device_fingerprint'),
  riskScore: integer('risk_score'),
  screeningResult: text('screening_result'),   // cleared | flagged | blocked
  rulesTriggered: text('rules_triggered').array(),
  alertIds: uuid('alert_ids').array(),
  transactionTimestamp: timestamp('transaction_timestamp', { withTimezone: true }).notNull(),
  screenedAt: timestamp('screened_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('aml_txn_user_idx').on(table.userId),
  ventureIdx: index('aml_txn_venture_idx').on(table.ventureId),
  timestampIdx: index('aml_txn_timestamp_idx').on(table.transactionTimestamp),
  riskIdx: index('aml_txn_risk_idx').on(table.riskScore),
  screeningIdx: index('aml_txn_screening_idx').on(table.screeningResult),
}));
```

#### Player Protection Profiles

```typescript
export const playerProtectionProfiles = pgTable('compliance_player_protection_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull(),
  riskLevel: riskLevelEnum('risk_level').default('low'),
  overallRiskScore: integer('overall_risk_score').default(0),
  hasActiveLimits: boolean('has_active_limits').default(false),
  hasSelfExclusion: boolean('has_self_exclusion').default(false),
  hasCoolingOff: boolean('has_cooling_off').default(false),
  realityCheckEnabled: boolean('reality_check_enabled').default(true),
  realityCheckInterval: integer('reality_check_interval').default(60),
  totalDeposited: numeric('total_deposited', { precision: 19, scale: 4 }).default('0'),
  totalWithdrawn: numeric('total_withdrawn', { precision: 19, scale: 4 }).default('0'),
  totalWagered: numeric('total_wagered', { precision: 19, scale: 4 }).default('0'),
  totalWon: numeric('total_won', { precision: 19, scale: 4 }).default('0'),
  netPosition: numeric('net_position', { precision: 19, scale: 4 }).default('0'),
  totalSessionMinutes: integer('total_session_minutes').default(0),
  lastSessionAt: timestamp('last_session_at', { withTimezone: true }),
  lastRiskAssessmentAt: timestamp('last_risk_assessment_at', { withTimezone: true }),
  interventionCount: integer('intervention_count').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userVentureIdx: uniqueIndex('player_protection_user_venture_idx')
    .on(table.userId, table.ventureId),
  riskLevelIdx: index('player_protection_risk_level_idx').on(table.riskLevel),
}));
```

#### Jurisdiction Definitions

```typescript
export const jurisdictions = pgTable('compliance_jurisdictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),           // "US-NJ", "GB", "MT"
  name: text('name').notNull(),
  parentCode: text('parent_code'),                 // "US" for "US-NJ"
  type: text('type').notNull(),                    // country | state | province
  isoAlpha2: text('iso_alpha2'),
  region: text('region'),
  regulatoryBody: text('regulatory_body'),
  gamblingStatus: text('gambling_status'),
  commerceStatus: text('commerce_status'),
  cryptoStatus: text('crypto_status'),
  dataProtectionFramework: text('data_protection_framework'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Entity Relationship Summary

```
                    ┌──────────────────┐
                    │ @mcv/identity    │
                    │ users table      │
                    └────────┬─────────┘
                             │ userId (FK)
            ┌────────────────┼─────────────────────┐
            │                │                     │
            ▼                ▼                     ▼
   ┌────────────────┐ ┌──────────────┐  ┌──────────────────────┐
   │ kyc_profiles   │ │ aml_risk_    │  │ player_protection_   │
   │                │ │ scores       │  │ profiles             │
   │ 1:1 per user/  │ │              │  │                      │
   │ venture        │ │ 1:1 per user/│  │ 1:1 per user/venture │
   └───┬────────────┘ │ venture      │  └───┬──────────────────┘
       │              └──────────────┘      │
       │                                    │
       ├→ kyc_documents (1:N)               ├→ deposit_limits (1:N per period)
       ├→ kyc_verifications (1:N)           ├→ loss_limits (1:N per period)
       ├→ kyc_liveness_checks (1:N)         ├→ wager_limits (1:N per period)
       ├→ kyc_risk_assessments (1:N)        ├→ time_limits (1:N per period)
       ├→ kyc_pep_screenings (1:N)          ├→ self_exclusions (1:N)
       │    └→ kyc_watchlist_hits (1:N)     ├→ cooling_off_periods (1:N)
       └→ kyc_audit_log (1:N, immutable)    ├→ reality_checks (1:1)
                                            ├→ behavioral_risk_scores (1:N)
                                            ├→ behavioral_indicators (1:N)
                                            ├→ interventions (1:N)
                                            │    └→ intervention_actions (1:N)
                                            ├→ player_activity_summaries (1:N)
                                            └→ rg_audit_log (1:N, immutable)
```

---

## Data Flow & Events

### Redpanda/Kafka Topic Architecture

All compliance events flow through Redpanda/Kafka, organized into domain-specific topics.

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE EVENT TOPICS                        │
│                                                                  │
│  compliance.kyc.verification                                     │
│  ├── initiated       { userId, ventureId, targetLevel }          │
│  ├── document.uploaded  { documentId, type, profileId }          │
│  ├── document.verified  { documentId, result }                   │
│  ├── liveness.completed { checkId, result, scores }              │
│  ├── screening.completed { screeningId, result, hits }           │
│  ├── approved         { userId, ventureId, level }               │
│  ├── rejected         { userId, ventureId, reason }              │
│  ├── suspended        { userId, ventureId, reason }              │
│  └── level.changed    { userId, ventureId, oldLevel, newLevel }  │
│                                                                  │
│  compliance.aml.transaction                                      │
│  ├── screened         { txnId, userId, result, riskScore }       │
│  ├── blocked          { txnId, userId, reason }                  │
│  └── flagged          { txnId, userId, alertIds }                │
│                                                                  │
│  compliance.aml.alert                                            │
│  ├── created          { alertId, userId, ruleType, priority }    │
│  ├── assigned         { alertId, assigneeId }                    │
│  ├── escalated        { alertId, escalatedTo, reason }           │
│  ├── disposed         { alertId, disposition }                   │
│  └── overdue          { alertId, dueDate }                       │
│                                                                  │
│  compliance.aml.case                                             │
│  ├── opened           { caseId, alertIds, title }                │
│  ├── filed            { caseId, filingType, filingId }           │
│  └── closed           { caseId, resolution }                     │
│                                                                  │
│  compliance.aml.filing                                           │
│  ├── sar.drafted      { sarId, caseId }                          │
│  ├── sar.submitted    { sarId, regulatoryBody }                  │
│  ├── sar.acknowledged { sarId, reference }                       │
│  ├── ctr.drafted      { ctrId, amount }                          │
│  └── ctr.submitted    { ctrId, regulatoryBody }                  │
│                                                                  │
│  compliance.jurisdiction                                         │
│  ├── geo.blocked      { userId, ventureId, jurisdiction }        │
│  ├── geo.vpn_detected { userId, ventureId, ipAddress }           │
│  ├── license.expiring { licenseId, ventureId, daysRemaining }    │
│  ├── license.expired  { licenseId, ventureId }                   │
│  ├── venture.suspended { ventureId, jurisdiction, reason }       │
│  └── deadline.approaching { calendarId, ventureId, dueDate }     │
│                                                                  │
│  compliance.responsible_gaming                                   │
│  ├── limit.set        { userId, ventureId, type, period, amount }│
│  ├── limit.reached    { userId, ventureId, type, period }        │
│  ├── limit.increase_requested { userId, limitId, newAmount }     │
│  ├── self_exclusion.initiated { userId, ventureId, type, until } │
│  ├── self_exclusion.attempted_bypass { userId, ventureId }       │
│  ├── reality_check.shown  { userId, ventureId, sessionMinutes }  │
│  ├── reality_check.response { userId, ventureId, choice }        │
│  ├── risk.elevated    { userId, ventureId, score, indicators }   │
│  ├── intervention.triggered { userId, ventureId, type, reason }  │
│  └── cooling_off.started { userId, ventureId, until }            │
│                                                                  │
│  compliance.audit (append-only, high-retention)                  │
│  ├── kyc.*            { all KYC audit events }                   │
│  ├── aml.*            { all AML audit events }                   │
│  ├── jurisdiction.*   { all jurisdiction audit events }          │
│  └── rg.*             { all responsible gaming audit events }    │
└─────────────────────────────────────────────────────────────────┘
```

### Event Payload Examples

```typescript
// compliance.aml.transaction.screened
interface AmlTransactionScreenedEvent {
  eventId: string;
  timestamp: string;
  ventureId: string;
  payload: {
    transactionRecordId: string;
    transactionId: string;
    userId: string;
    transactionType: 'deposit' | 'withdrawal' | 'wager' | 'payout' | 'transfer';
    amount: string;
    currency: string;
    amountUsd: string;
    screeningResult: 'cleared' | 'flagged' | 'blocked';
    riskScore: number;
    rulesTriggered: string[];
    alertIds: string[];
    sanctionsResult: 'clear' | 'potential_match' | 'confirmed_match';
    processingTimeMs: number;
    jurisdiction: string;
    ipAddress: string;
  };
}

// compliance.responsible_gaming.risk.elevated
interface RgRiskElevatedEvent {
  eventId: string;
  timestamp: string;
  ventureId: string;
  payload: {
    userId: string;
    previousRiskLevel: RiskLevel;
    newRiskLevel: RiskLevel;
    riskScore: number;
    indicators: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      confidence: number;
    }>;
    recommendedAction: string;
    sessionData: {
      currentSessionMinutes: number;
      totalDailyMinutes: number;
      netPosition: string;
    };
  };
}

// compliance.kyc.verification.approved
interface KycVerificationApprovedEvent {
  eventId: string;
  timestamp: string;
  ventureId: string;
  payload: {
    userId: string;
    verificationId: string;
    kycProfileId: string;
    previousLevel: KycVerificationLevel;
    newLevel: KycVerificationLevel;
    riskScore: number;
    riskCategory: string;
    pepStatus: boolean;
    sanctionsStatus: boolean;
    verificationProvider: string;
  };
}
```

### Inbound Events (consumed by @mcv/compliance)

| Source | Topic | Purpose |
|--------|-------|---------|
| `@mcv/payments` | `payment.transaction.completed` | Trigger AML screening for every payment transaction |
| `@mcv/payments` | `payment.deposit.completed` | Update deposit limit usage, trigger limit check |
| `@mcv/payments` | `payment.withdrawal.completed` | Update player activity summaries |
| `@mcv/connectors` | `crypto.transaction.initiated` | AML screening for EDGE token / Solana transactions |
| `@mcv/identity` | `identity.user.registered` | Create KYC profile, initiate jurisdiction check |
| `@mcv/identity` | `identity.user.email_verified` | Update KYC profile email verification status |
| `@mcv/engagement` | `engagement.session.started` | Start responsible gaming session timer |
| `@mcv/engagement` | `engagement.session.ended` | Record session duration, update activity summary |
| `@mcv/engagement` | `engagement.wager.placed` | Check wager/loss limits, update usage counters |

---

## Integration Points

### Identity Integration (@mcv/identity)

```typescript
// Compliance reads user data from identity for KYC profile creation
import { identityService } from '@mcv/identity';

async function createKycProfile(userId: string, ventureId: string): Promise<KycProfile> {
  // Fetch user base profile from identity
  const user = await identityService.getUser(userId);
  const profile = await identityService.getProfile(userId);

  // Create compliance KYC profile with identity data
  return db.insert(kycProfiles).values({
    ventureId,
    userId,
    firstName: encrypt(profile.firstName),
    lastName: encrypt(profile.lastName),
    dateOfBirth: profile.dateOfBirth,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    phoneNumber: encrypt(profile.phoneNumber),
    verificationLevel: 'none',
    status: 'pending',
  }).returning();
}
```

### Payments Integration (@mcv/payments via events)

```typescript
// AML module subscribes to payment events for transaction monitoring
eventBus.subscribe('payment.transaction.completed', async (event) => {
  const { transactionId, userId, ventureId, amount, currency, type } = event.payload;

  // Screen every transaction through AML rules
  const result = await amlService.screenTransaction({
    transactionId,
    userId,
    ventureId,
    amount,
    currency,
    transactionType: type,
    ipAddress: event.metadata.ipAddress,
    deviceFingerprint: event.metadata.deviceFingerprint,
  });

  // If flagged or blocked, emit compliance event
  if (result.screeningResult !== 'cleared') {
    await eventBus.emit(`compliance.aml.transaction.${result.screeningResult}`, {
      transactionId,
      userId,
      ventureId,
      result,
    });
  }
});
```

### Engagement Integration (@mcv/engagement via events)

```typescript
// Responsible gaming subscribes to engagement events for session monitoring
eventBus.subscribe('engagement.session.started', async (event) => {
  const { userId, ventureId, sessionId } = event.payload;

  // Check self-exclusion and cooling-off before allowing session
  const exclusionStatus = await responsibleGamingService.getSelfExclusionStatus(userId, ventureId);
  if (exclusionStatus.isExcluded) {
    // Emit block event — engagement module should terminate session
    await eventBus.emit('compliance.responsible_gaming.session.blocked', {
      userId, ventureId, sessionId, reason: 'self_exclusion',
    });
    return;
  }

  // Check time limits
  const timeLimitResult = await responsibleGamingService.checkLimits(userId, ventureId, {
    action: 'session_start',
  });

  if (!timeLimitResult.allowed) {
    await eventBus.emit('compliance.responsible_gaming.session.blocked', {
      userId, ventureId, sessionId, reason: 'time_limit_exceeded',
    });
    return;
  }

  // Start session monitoring (reality checks, time tracking)
  await responsibleGamingService.startSessionMonitoring(userId, ventureId, sessionId);
});
```

---

## Performance Architecture

### Redis Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    REDIS CACHE ARCHITECTURE                       │
│                                                                  │
│  Namespace: compliance:*                                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  RULE CACHE (5-minute TTL)                                │   │
│  │                                                           │   │
│  │  compliance:aml:rules:{ventureId}      → AmlRule[]        │   │
│  │  compliance:geo:rules:{ventureId}:{jx} → GeoRule[]        │   │
│  │  compliance:age:rules:{jurisdictionId} → AgeRule[]        │   │
│  │  compliance:tax:rules:{jurisdictionId} → TaxRule[]        │   │
│  │                                                           │   │
│  │  Invalidation: On rule update → delete cache key          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  STATE CACHE (30-second TTL)                              │   │
│  │                                                           │   │
│  │  compliance:kyc:level:{userId}:{ventureId}  → level       │   │
│  │  compliance:kyc:status:{userId}:{ventureId} → status      │   │
│  │  compliance:rg:exclusion:{userId}:{ventureId} → bool      │   │
│  │  compliance:rg:cooling:{userId}:{ventureId}   → bool      │   │
│  │                                                           │   │
│  │  Invalidation: On state change event                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  LIMIT COUNTERS (no TTL — reset by cron)                  │   │
│  │                                                           │   │
│  │  compliance:rg:limit:deposit:daily:{userId}:{ventureId}   │   │
│  │    → { usage: "2500.00", limit: "5000.00", currency: "USD",│  │
│  │         resetsAt: "2026-02-10T05:00:00Z" }                │   │
│  │                                                           │   │
│  │  compliance:rg:limit:deposit:weekly:{userId}:{ventureId}  │   │
│  │  compliance:rg:limit:loss:daily:{userId}:{ventureId}      │   │
│  │  compliance:rg:limit:wager:daily:{userId}:{ventureId}     │   │
│  │  compliance:rg:limit:time:daily:{userId}:{ventureId}      │   │
│  │                                                           │   │
│  │  Operations: INCRBY (atomic), GET, SET, DEL               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  RISK SCORES (5-minute TTL)                               │   │
│  │                                                           │   │
│  │  compliance:aml:risk:{userId}:{ventureId}   → RiskScore   │   │
│  │  compliance:kyc:risk:{kycProfileId}         → RiskScore   │   │
│  │  compliance:rg:risk:{userId}:{ventureId}    → RiskScore   │   │
│  │                                                           │   │
│  │  Invalidation: On recalculation                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SESSION TRACKING (Redis Sorted Sets)                     │   │
│  │                                                           │   │
│  │  compliance:rg:sessions:{ventureId}                       │   │
│  │    → Sorted set of active sessions by start time          │   │
│  │                                                           │   │
│  │  compliance:rg:session:{sessionId}                        │   │
│  │    → { userId, startedAt, lastActivityAt,                 │   │
│  │         realityCheckAt, totalMinutes }                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Query Optimization

```typescript
// Optimized AML transaction aggregation using materialized view
// packages/compliance/src/aml/queries.ts

/**
 * Get user transaction aggregates for pattern detection.
 * Uses a partial index on (user_id, transaction_timestamp)
 * and a covering index for common aggregate queries.
 */
export async function getUserTransactionAggregates(
  userId: string,
  ventureId: string,
  windows: ('24h' | '7d' | '30d')[]
): Promise<TransactionAggregates> {
  const now = new Date();

  const result = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE transaction_timestamp >= ${subHours(now, 24)}) AS count_24h,
      COUNT(*) FILTER (WHERE transaction_timestamp >= ${subDays(now, 7)}) AS count_7d,
      COUNT(*) FILTER (WHERE transaction_timestamp >= ${subDays(now, 30)}) AS count_30d,
      COALESCE(SUM(amount_usd) FILTER (WHERE transaction_timestamp >= ${subHours(now, 24)}), 0) AS total_24h,
      COALESCE(SUM(amount_usd) FILTER (WHERE transaction_timestamp >= ${subDays(now, 7)}), 0) AS total_7d,
      COALESCE(SUM(amount_usd) FILTER (WHERE transaction_timestamp >= ${subDays(now, 30)}), 0) AS total_30d,
      MAX(amount_usd) FILTER (WHERE transaction_timestamp >= ${subDays(now, 30)}) AS max_single_30d,
      STDDEV(amount_usd::float) FILTER (WHERE transaction_timestamp >= ${subDays(now, 30)}) AS stddev_30d
    FROM compliance_aml_transaction_records
    WHERE user_id = ${userId}
      AND venture_id = ${ventureId}
      AND transaction_timestamp >= ${subDays(now, 30)}
  `);

  return result.rows[0] as TransactionAggregates;
}
```

---

## Scalability

### Horizontal Scaling Strategy

| Component | Strategy | Details |
|-----------|----------|---------|
| **API Routes** | Vercel auto-scaling | Stateless handlers scale with request volume |
| **Transaction Screening** | Redis-cached rules + connection pooling | Rules loaded once per 5 min, DB connections pooled |
| **Pattern Analysis** | Async via Redpanda | Decoupled from screening path, processes in batches |
| **Risk Recalculation** | Cron-based batch | Daily recalculation with configurable batch size |
| **Watchlist Screening** | Batch + incremental | Full rescan on update, incremental for new users |
| **Reality Checks** | Redis session tracking | Sorted sets for efficient session lookups |

### Database Partitioning Strategy

```sql
-- Transaction records partitioned by month for efficient querying
-- and data retention management
CREATE TABLE compliance_aml_transaction_records (
  -- ... columns ...
) PARTITION BY RANGE (transaction_timestamp);

CREATE TABLE compliance_aml_transaction_records_2026_01
  PARTITION OF compliance_aml_transaction_records
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE compliance_aml_transaction_records_2026_02
  PARTITION OF compliance_aml_transaction_records
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Audit logs partitioned by year (7-year retention)
CREATE TABLE compliance_kyc_audit_log (
  -- ... columns ...
) PARTITION BY RANGE (created_at);
```

### Throughput Projections

| Phase | Users | Daily Transactions | AML Alerts/Day | KYC Verifications/Day |
|-------|-------|-------------------|----------------|----------------------|
| Launch | 10K | 50K | 50-100 | 200-500 |
| Growth | 100K | 500K | 500-1K | 2K-5K |
| Scale | 1M | 5M | 5K-10K | 20K-50K |
| Target | 10M | 50M | 50K-100K | 200K-500K |

---

## Error Handling & Recovery

### Error Hierarchy

```typescript
// packages/compliance/src/errors.ts

import { McvError } from '@mcv/errors';

export class ComplianceError extends McvError {
  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(`COMPLIANCE_${code}`, message, details);
  }
}

// KYC Errors
export class KycVerificationError extends ComplianceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('KYC_VERIFICATION', message, details);
  }
}

export class KycDocumentError extends ComplianceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('KYC_DOCUMENT', message, details);
  }
}

export class KycProviderError extends ComplianceError {
  constructor(provider: string, message: string, details?: Record<string, unknown>) {
    super('KYC_PROVIDER', `${provider}: ${message}`, details);
  }
}

// AML Errors
export class AmlScreeningError extends ComplianceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('AML_SCREENING', message, details);
  }
}

export class AmlRuleError extends ComplianceError {
  constructor(ruleId: string, message: string) {
    super('AML_RULE', message, { ruleId });
  }
}

// Jurisdiction Errors
export class JurisdictionBlockedError extends ComplianceError {
  constructor(jurisdiction: string, reason: string) {
    super('JURISDICTION_BLOCKED', `Access blocked in ${jurisdiction}: ${reason}`, { jurisdiction });
  }
}

// Responsible Gaming Errors
export class LimitExceededError extends ComplianceError {
  constructor(limitType: string, period: string, details: LimitCheckResult) {
    super('LIMIT_EXCEEDED', `${limitType} ${period} limit exceeded`, details);
  }
}

export class SelfExclusionActiveError extends ComplianceError {
  constructor(userId: string, until?: string) {
    super('SELF_EXCLUSION_ACTIVE', 'User is self-excluded', { userId, until });
  }
}
```

### Retry & Recovery Patterns

| Scenario | Strategy | Details |
|----------|----------|---------|
| **KYC provider timeout** | Retry with exponential backoff | 3 retries, 1s → 2s → 4s, then fail with provider error |
| **AML screening timeout** | Fail closed (block) | Transaction blocked, alert created, manual review required |
| **Sanctions list import failure** | Retry + alert | Retry every 30 min, alert compliance team after 3 failures |
| **PEP screening provider down** | Queue for retry | Queue screening request, process when provider recovers |
| **Redis cache failure** | Fall through to DB | Bypass cache, query database directly (higher latency) |
| **Event publish failure** | Dead letter queue | Failed events written to DLQ, retried by separate consumer |
| **Database connection failure** | Connection pool retry | Pool reconnection with circuit breaker (5 failures → open) |
| **GeoIP database corruption** | Fallback to API | Switch to MaxMind web API (higher latency, rate limited) |

### Circuit Breaker Configuration

```typescript
// packages/compliance/src/infra/circuit-breaker.ts

export const circuitBreakerConfig = {
  kycProvider: {
    threshold: 5,           // 5 failures to open
    resetTimeout: 30000,    // 30s before half-open
    monitorInterval: 10000, // 10s health check
    fallback: 'manual_queue', // Queue for manual review
  },
  amlScreening: {
    threshold: 3,
    resetTimeout: 15000,
    monitorInterval: 5000,
    fallback: 'block',     // Fail closed — block transaction
  },
  pepProvider: {
    threshold: 5,
    resetTimeout: 60000,
    monitorInterval: 15000,
    fallback: 'queue',     // Queue for retry
  },
  geoipProvider: {
    threshold: 10,
    resetTimeout: 120000,
    monitorInterval: 30000,
    fallback: 'api',       // MaxMind web API
  },
};
```

---

## Observability

### Structured Logging

```typescript
// packages/compliance/src/infra/logger.ts

import { logger } from '@mcv/kernel';

export const complianceLogger = logger.child({ domain: 'compliance' });

// Usage in AML screening
complianceLogger.info({
  module: 'aml',
  operation: 'screenTransaction',
  transactionId: input.transactionId,
  userId: input.userId,
  ventureId: input.ventureId,
  amount: input.amount,
  currency: input.currency,
  screeningResult: result.screeningResult,
  riskScore: result.riskScore,
  rulesTriggered: result.rulesTriggered.length,
  processingTimeMs: result.processingTimeMs,
}, 'AML transaction screening completed');

// Sensitive data is automatically redacted
complianceLogger.info({
  module: 'kyc',
  operation: 'uploadDocument',
  documentType: 'passport',
  userId: '[REDACTED]',     // PII is never logged in plain text
  documentNumber: '****5678',
}, 'KYC document uploaded');
```

### Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `compliance_aml_screening_duration_ms` | Histogram | venture, result | Transaction screening latency |
| `compliance_aml_screening_total` | Counter | venture, result | Total screenings by result |
| `compliance_aml_alerts_total` | Counter | venture, priority, rule_type | Total alerts generated |
| `compliance_aml_alerts_backlog` | Gauge | venture, status | Current alert backlog |
| `compliance_kyc_verifications_total` | Counter | venture, level, result | Verifications by outcome |
| `compliance_kyc_verification_duration_ms` | Histogram | venture, level | End-to-end verification time |
| `compliance_geo_evaluations_total` | Counter | venture, action, jurisdiction | Geo access evaluations |
| `compliance_geo_vpn_detections_total` | Counter | venture | VPN detection count |
| `compliance_rg_limit_checks_total` | Counter | venture, type, result | Limit check results |
| `compliance_rg_limit_breaches_total` | Counter | venture, type, period | Limit breaches |
| `compliance_rg_interventions_total` | Counter | venture, type | Interventions triggered |
| `compliance_rg_behavioral_risk_score` | Histogram | venture, level | Risk score distribution |
| `compliance_cache_hit_ratio` | Gauge | cache_type | Redis cache hit ratio |
| `compliance_provider_errors_total` | Counter | provider, operation | External provider errors |

### Dashboards

| Dashboard | Audience | Key Widgets |
|-----------|----------|-------------|
| **AML Operations** | Compliance Officers | Alert queue, case pipeline, SAR/CTR deadlines, transaction volume |
| **KYC Operations** | Compliance Officers | Verification queue, approval rates, provider health, document expiry |
| **Jurisdiction Health** | Compliance Admin | License status map, geo-blocking activity, upcoming deadlines |
| **Responsible Gaming** | Compliance Admin | Limit utilization, self-exclusion rates, risk distribution, interventions |
| **Platform Health** | Engineering | Screening latency, error rates, cache hit ratios, provider uptime |

---

## Security Architecture

### RLS Policies

All compliance tables implement Row-Level Security for multi-tenant isolation:

```sql
-- Pattern: Venture isolation (applied to all 45 tables)
CREATE POLICY "venture_isolation" ON compliance_kyc_profiles
  FOR ALL
  USING (venture_id = current_setting('app.current_venture_id')::uuid)
  WITH CHECK (venture_id = current_setting('app.current_venture_id')::uuid);

-- Pattern: Compliance admin cross-venture access
CREATE POLICY "compliance_admin_cross_venture" ON compliance_kyc_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('compliance_admin', 'platform_admin')
    )
  );

-- Pattern: User self-access (own data only)
CREATE POLICY "user_self_access" ON compliance_kyc_profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Pattern: Immutable audit logs (INSERT only, no UPDATE/DELETE)
CREATE POLICY "audit_insert_only" ON compliance_kyc_audit_log
  FOR INSERT
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies for regular users on audit logs
-- Only compliance_admin and service_role can read audit logs
CREATE POLICY "audit_admin_read" ON compliance_kyc_audit_log
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('compliance_admin', 'compliance_officer', 'platform_admin')
    )
  );
```

### PII Encryption Implementation

```typescript
// packages/compliance/src/infra/encryption.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(plaintext: string): string {
  const key = Buffer.from(process.env.COMPLIANCE_ENCRYPTION_KEY!, 'hex');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all hex-encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, ciphertext] = encryptedText.split(':');
  const key = Buffer.from(process.env.COMPLIANCE_ENCRYPTION_KEY!, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Fields requiring encryption in each table:
export const ENCRYPTED_FIELDS = {
  kycProfiles: ['firstName', 'lastName', 'taxIdentificationNumber', 'phoneNumber', 'address'],
  kycDocuments: ['documentNumber', 'frontImageUrl', 'backImageUrl'],
  kycLivenessChecks: ['selfieImageUrl', 'videoUrl'],
  kycPepScreenings: ['searchParameters'],
  amlSarFilings: ['subjectIdentifiers', 'subjectAddress'],
  amlTransactionRecords: ['sourceIdentifier', 'destinationIdentifier'],
};
```

### API Authentication & Authorization

```typescript
// packages/compliance/src/middleware/auth.ts

import { authMiddleware, requireRole } from '@mcv/auth';

// Route-level authorization
export const complianceApiRoutes = {
  // KYC — user can access own, compliance roles can access all
  'GET /api/compliance/kyc/profile': [authMiddleware, requireRole(['user', 'compliance_officer', 'compliance_admin'])],
  'POST /api/compliance/kyc/verify': [authMiddleware, requireRole(['user'])],
  'POST /api/compliance/kyc/review': [authMiddleware, requireRole(['compliance_officer', 'compliance_admin'])],

  // AML — compliance roles only
  'GET /api/compliance/aml/alerts': [authMiddleware, requireRole(['compliance_officer', 'compliance_admin'])],
  'POST /api/compliance/aml/screen': [authMiddleware, requireRole(['service_role'])], // Internal only
  'POST /api/compliance/aml/sar': [authMiddleware, requireRole(['compliance_officer', 'compliance_admin'])],
  'PUT /api/compliance/aml/rules': [authMiddleware, requireRole(['compliance_admin'])],

  // Jurisdictions — admin roles
  'GET /api/compliance/jurisdictions': [authMiddleware, requireRole(['user', 'venture_admin', 'compliance_admin'])],
  'PUT /api/compliance/jurisdictions/geo-rules': [authMiddleware, requireRole(['compliance_admin'])],
  'POST /api/compliance/jurisdictions/licenses': [authMiddleware, requireRole(['compliance_admin'])],

  // Responsible Gaming — user for own limits, compliance for admin
  'GET /api/compliance/rg/limits': [authMiddleware, requireRole(['user', 'compliance_officer'])],
  'POST /api/compliance/rg/limits': [authMiddleware, requireRole(['user'])],
  'POST /api/compliance/rg/self-exclude': [authMiddleware, requireRole(['user'])],
  'GET /api/compliance/rg/dashboard': [authMiddleware, requireRole(['compliance_officer', 'compliance_admin'])],
};
```

### Data Retention Policies

| Data Category | Retention Period | Regulatory Basis | Disposal Method |
|--------------|-----------------|------------------|-----------------|
| KYC profiles & documents | 5 years after account closure | GDPR Art. 17, 5AMLD Art. 40 | Anonymization (retain structure, remove PII) |
| AML transaction records | 5 years after transaction | FinCEN BSA, 5AMLD | Archive to cold storage, then purge |
| AML alerts & cases | 5 years after case closure | FinCEN BSA | Archive to cold storage |
| SAR/CTR filings | 5 years after filing | FinCEN BSA | Archive (regulatory requirement) |
| Audit logs (all) | 7 years | SOC 2, PCI-DSS | Archive to cold storage |
| Behavioral risk data | 3 years | UKGC LCCP | Anonymization |
| Session/activity data | 2 years | GDPR data minimization | Aggregation + purge |
| GeoIP access logs | 1 year | Internal policy | Purge |

---

*@mcv/compliance — Regulatory Compliance Domain*
