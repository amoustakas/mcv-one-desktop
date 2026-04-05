# 04 — Implementation Plan: @mcv/compliance

| Field              | Value                                          |
|--------------------|------------------------------------------------|
| **Package**        | `@mcv/compliance`                              |
| **Classification** | MCV-ONLY                                       |
| **Tier**           | 5 — Domain Layer                               |
| **Version**        | 1.0.0                                          |
| **Last Updated**   | February 9, 2026                               |

---

## Table of Contents

1. [Overview & Goals](#overview--goals)
2. [Prerequisites](#prerequisites)
3. [Phase 1 — Foundation](#phase-1--foundation)
4. [Phase 2 — Core Implementation](#phase-2--core-implementation)
5. [Phase 3 — Advanced Features](#phase-3--advanced-features)
6. [Phase 4 — Polish & Hardening](#phase-4--polish--hardening)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risks & Mitigations](#risks--mitigations)
10. [Timeline](#timeline)

---

## Overview & Goals

### Purpose

This implementation plan outlines the phased development of `@mcv/compliance`, the mission-critical regulatory compliance domain for the MCV.ONE Agentic OS platform. The package must handle KYC identity verification, AML transaction monitoring, multi-jurisdiction regulatory management, and responsible gaming controls across all nine ventures — with BetEdge (sports betting) requiring the most comprehensive coverage.

### Strategic Goals

| Goal | Description | Measure of Success |
|------|-------------|-------------------|
| **Regulatory Readiness** | Enable BetEdge to launch in its first jurisdiction (New Jersey) with full regulatory compliance | Pass NJDGE compliance audit checklist |
| **Multi-Venture Coverage** | Provide a unified compliance framework usable across all 9 ventures | All ventures using `@mcv/compliance` for at least KYC and jurisdiction checks |
| **Automation** | Reduce manual compliance workload through automated screening, alerting, and filing | <30% of AML alerts require manual review; SAR/CTR drafts auto-generated |
| **Scalability** | Support growth from 10K to 1M+ users without architecture changes | Transaction screening <100ms P99 at 1,000 TPS |
| **Auditability** | Provide immutable, complete audit trails satisfying SOC 2 and regulatory inspectors | 100% of compliance actions logged with actor, timestamp, and state change |
| **Player Protection** | Implement responsible gaming controls that meet or exceed UKGC, MGA, and US state requirements | Zero regulatory findings related to player protection |

### Non-Goals (This Phase)

- Full PCI-DSS Level 1 certification (handled by payment processor / `@mcv/connectors`)
- Direct integration with every global regulator (start with US, UK, EU/Malta, Canada)
- Custom mobile SDKs for KYC document capture (use provider-hosted flows initially)
- Real-time blockchain analytics for EDGE token (deferred to later phase)

---

## Prerequisites

### Infrastructure Requirements

| Prerequisite | Status | Owner | Notes |
|-------------|--------|-------|-------|
| **Supabase PostgreSQL** | ✅ Available | Platform Team | Production instance with RLS enabled |
| **Drizzle ORM** | ✅ Available | Platform Team | Configured in `@mcv/database` |
| **Redis (Upstash)** | ✅ Available | Platform Team | Used for caching across platform |
| **Redpanda/Kafka** | ✅ Available | Platform Team | Event bus via `@mcv/fabric` |
| **@mcv/kernel** | ✅ Available | Platform Team | Config, DI, logging, errors |
| **@mcv/identity** | ✅ Available | Identity Team | User profiles, auth, sessions |
| **@mcv/fabric** | ✅ Available | Platform Team | Events, notifications, audit |
| **@mcv/database** | ✅ Available | Platform Team | Drizzle instance, migrations |
| **@mcv/auth** | ✅ Available | Identity Team | JWT, RBAC, session management |

### External Service Accounts

| Service | Purpose | Phase Required | Status |
|---------|---------|---------------|--------|
| **Onfido** | KYC document verification, liveness | Phase 2 | 🔲 API keys needed |
| **ComplyAdvantage** | PEP/sanctions screening | Phase 2 | 🔲 API keys needed |
| **MaxMind GeoIP** | IP geolocation database | Phase 2 | 🔲 License key needed |
| **OpenRouter** | AI behavioral analysis | Phase 3 | ✅ Available (platform-wide) |
| **GamStop** | UK self-exclusion register | Phase 3 | 🔲 API access needed |
| **OFAC SDN List** | US sanctions data | Phase 2 | ✅ Public download |
| **EU Sanctions List** | EU sanctions data | Phase 2 | ✅ Public download |

### Team & Expertise

| Role | Count | Responsibilities |
|------|-------|-----------------|
| **Backend Engineer** | 2 | Service implementation, schema design, API routes |
| **Frontend Engineer** | 1 | React components, hooks, KYC flows, dashboards |
| **Compliance SME** | 1 (part-time) | Regulatory requirements, rule configuration, testing validation |
| **DevOps/SRE** | 1 (part-time) | Infrastructure, monitoring, alerting, cron jobs |
| **QA Engineer** | 1 | Test strategy, integration testing, compliance scenario validation |

---

## Phase 1 — Foundation

**Duration:** 3 weeks  
**Goal:** Establish the package structure, database schemas, base types, configuration, and core infrastructure.

### 1.1 Package Scaffolding (Week 1)

**Tasks:**

- [ ] Create `packages/compliance/` directory structure in Turborepo monorepo
- [ ] Configure `package.json` with `@mcv/compliance` naming and peer dependencies
- [ ] Set up TypeScript configuration extending monorepo base
- [ ] Configure Vitest for unit and integration testing
- [ ] Create barrel exports (`index.ts`) with organized module structure
- [ ] Add to Turborepo pipeline (`turbo.json`) with dependency graph

**Directory Structure:**

```
packages/compliance/
├── src/
│   ├── index.ts                    # Barrel exports
│   ├── config.ts                   # Zod config schema
│   ├── constants.ts                # All compliance constants
│   ├── types.ts                    # Shared type definitions
│   ├── errors.ts                   # ComplianceError hierarchy
│   │
│   ├── kyc/
│   │   ├── index.ts                # KYC barrel
│   │   ├── schema.ts               # Drizzle schema (8 tables)
│   │   ├── service.ts              # KycService class
│   │   ├── types.ts                # KYC-specific types
│   │   └── utils.ts                # KYC helpers
│   │
│   ├── aml/
│   │   ├── index.ts                # AML barrel
│   │   ├── schema.ts               # Drizzle schema (12 tables)
│   │   ├── service.ts              # AmlService class
│   │   ├── rules-engine.ts         # Rule evaluation engine
│   │   ├── patterns.ts             # Pattern detection algorithms
│   │   ├── types.ts                # AML-specific types
│   │   └── utils.ts                # AML helpers
│   │
│   ├── jurisdictions/
│   │   ├── index.ts                # Jurisdictions barrel
│   │   ├── schema.ts               # Drizzle schema (10 tables)
│   │   ├── service.ts              # JurisdictionService class
│   │   ├── geo.ts                  # GeoIP + VPN detection
│   │   ├── types.ts                # Jurisdiction-specific types
│   │   └── registry.ts             # Jurisdiction seed data
│   │
│   ├── responsible-gaming/
│   │   ├── index.ts                # RG barrel
│   │   ├── schema.ts               # Drizzle schema (15 tables)
│   │   ├── service.ts              # ResponsibleGamingService class
│   │   ├── limits-engine.ts        # Limit enforcement engine
│   │   ├── behavioral.ts           # AI behavioral analysis
│   │   ├── types.ts                # RG-specific types
│   │   └── utils.ts                # RG helpers
│   │
│   ├── infra/
│   │   ├── encryption.ts           # AES-256-GCM PII encryption
│   │   ├── cache.ts                # Redis caching layer
│   │   ├── circuit-breaker.ts      # External provider resilience
│   │   ├── audit.ts                # Audit log writer
│   │   └── providers/
│   │       ├── onfido.ts           # Onfido adapter
│   │       ├── comply-advantage.ts # ComplyAdvantage adapter
│   │       ├── maxmind.ts          # MaxMind GeoIP adapter
│   │       └── gamstop.ts          # GamStop adapter
│   │
│   └── client/
│       ├── hooks/                  # React hooks (16 hooks)
│       └── components/             # React components (21 components)
│
├── tests/
│   ├── unit/
│   │   ├── kyc/
│   │   ├── aml/
│   │   ├── jurisdictions/
│   │   └── responsible-gaming/
│   ├── integration/
│   │   ├── kyc-flow.test.ts
│   │   ├── aml-screening.test.ts
│   │   ├── jurisdiction-check.test.ts
│   │   └── rg-limits.test.ts
│   └── fixtures/
│       ├── users.ts
│       ├── transactions.ts
│       ├── jurisdictions.ts
│       └── rules.ts
│
├── drizzle/
│   └── migrations/                 # Generated Drizzle migrations
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### 1.2 Database Schema & Migrations (Week 1–2)

**Tasks:**

- [ ] Define all 45 Drizzle ORM table schemas across 4 submodules
- [ ] Define all enum types (`kycVerificationLevelEnum`, `amlAlertStatusEnum`, etc.)
- [ ] Create database indexes for common query patterns
- [ ] Generate Drizzle migrations
- [ ] Write RLS policies for all tables (venture isolation)
- [ ] Create immutability policies for audit log tables (INSERT only)
- [ ] Test migration up/down cycle on fresh database
- [ ] Seed jurisdiction registry with initial data (50 US states, 10 Canadian provinces, 30+ countries)

**Key Schema Deliverables:**

| Module | Tables | Priority Schemas |
|--------|--------|-----------------|
| KYC | 8 | `kycProfiles`, `kycDocuments`, `kycVerifications`, `kycAuditLog` |
| AML | 12 | `amlTransactionRecords`, `amlAlerts`, `amlCases`, `amlRules`, `amlAuditLog` |
| Jurisdictions | 10 | `jurisdictions`, `jurisdictionRequirements`, `jurisdictionGeoRules`, `jurisdictionLicenses` |
| Responsible Gaming | 15 | `playerProtectionProfiles`, `depositLimits`, `selfExclusions`, `behavioralRiskScores` |

**Validation Criteria:**

```bash
# All migrations run successfully
pnpm drizzle-kit generate
pnpm drizzle-kit push

# RLS policies enforced
# Test: Query as venture_a should not return venture_b data
# Test: Audit logs reject UPDATE and DELETE operations
```

### 1.3 Core Types & Configuration (Week 2)

**Tasks:**

- [ ] Define all TypeScript types and interfaces in `types.ts`
- [ ] Create Zod validation schemas for all service inputs
- [ ] Build `complianceConfigSchema` with environment variable mapping
- [ ] Implement `ComplianceError` hierarchy with error codes
- [ ] Define all constants (`KYC_VERIFICATION_LEVELS`, `AML_REPORTING_THRESHOLDS`, etc.)
- [ ] Write comprehensive JSDoc documentation for all exported types

### 1.4 Infrastructure Layer (Week 2–3)

**Tasks:**

- [ ] Implement AES-256-GCM encryption module for PII fields
- [ ] Build Redis caching layer with namespace prefixing and TTL management
- [ ] Implement circuit breaker pattern for external provider calls
- [ ] Create audit log writer with guaranteed append-only semantics
- [ ] Build provider adapter interfaces (`IVerificationProvider`, `IScreeningProvider`, `IGeoProvider`)
- [ ] Implement health check endpoint for external dependencies

**Encryption Module:**

```typescript
// packages/compliance/src/infra/encryption.ts
export interface EncryptionService {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
  encryptFields<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): T;
  decryptFields<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): T;
}
```

**Phase 1 Exit Criteria:**

- [ ] Package builds and lints without errors
- [ ] All 45 tables created with RLS policies
- [ ] Migrations run cleanly on fresh Supabase instance
- [ ] Config loads from environment with Zod validation
- [ ] Encryption module passes unit tests (encrypt/decrypt roundtrip)
- [ ] Redis caching layer operational with key prefixing
- [ ] Jurisdiction registry seeded with 100+ jurisdiction records

---

## Phase 2 — Core Implementation

**Duration:** 6 weeks  
**Goal:** Implement the four core services: KYC verification, AML screening, jurisdiction management, and responsible gaming.

### 2.1 KYC Verification Flow (Week 4–5)

**Tasks:**

- [ ] Implement `KycService` with full verification lifecycle
- [ ] Build tiered verification level determination logic
- [ ] Integrate Onfido provider adapter for document verification
- [ ] Implement document OCR extraction and cross-referencing
- [ ] Build liveness check flow with spoof detection
- [ ] Implement PEP/sanctions screening via ComplyAdvantage
- [ ] Build composite risk scoring engine (7 weighted factors)
- [ ] Create manual review queue and admin review flow
- [ ] Implement document expiry tracking and notification triggers
- [ ] Write KYC audit log entries for all state transitions

**Key Implementation Details:**

```typescript
// packages/compliance/src/kyc/service.ts

export class KycService {
  constructor(
    private db: DrizzleClient,
    private redis: RedisClient,
    private verificationProvider: IVerificationProvider,
    private screeningProvider: IScreeningProvider,
    private encryptionService: EncryptionService,
    private auditLogger: AuditLogger,
    private eventBus: EventBus,
  ) {}

  async initiateVerification(input: InitiateKycInput): Promise<KycVerification> {
    // 1. Validate input against Zod schema
    const validated = initiateKycInputSchema.parse(input);

    // 2. Get or create KYC profile
    let profile = await this.getProfile(validated.userId, validated.ventureId);
    if (!profile) {
      profile = await this.createProfile(validated.userId, validated.ventureId);
    }

    // 3. Check for existing active verification
    const existing = await this.getActiveVerification(profile.id);
    if (existing) {
      throw new KycVerificationError('A verification is already in progress', {
        verificationId: existing.id,
        status: existing.status,
      });
    }

    // 4. Determine required level (jurisdiction + venture)
    const requiredLevel = validated.targetLevel
      ?? await this.getRequiredLevel(validated.userId, validated.ventureId, validated.jurisdiction);

    // 5. Create verification record
    const verification = await this.db.insert(kycVerifications).values({
      ventureId: validated.ventureId,
      kycProfileId: profile.id,
      targetLevel: requiredLevel,
      status: 'initiated',
      expiresAt: addHours(new Date(), 24), // 24h TTL
      ipAddress: validated.ipAddress,
      userAgent: validated.userAgent,
      provider: this.config.kyc.provider,
    }).returning();

    // 6. Audit log
    await this.auditLogger.log({
      table: 'compliance_kyc_audit_log',
      ventureId: validated.ventureId,
      kycProfileId: profile.id,
      action: 'verification_initiated',
      performedBy: validated.userId,
      newValue: { targetLevel: requiredLevel, verificationId: verification[0].id },
      ipAddress: validated.ipAddress,
    });

    // 7. Emit event
    await this.eventBus.emit('compliance.kyc.verification.initiated', {
      userId: validated.userId,
      ventureId: validated.ventureId,
      targetLevel: requiredLevel,
      verificationId: verification[0].id,
    });

    return verification[0];
  }
}
```

**Verification State Machine Tests:**

```typescript
// tests/unit/kyc/verification-flow.test.ts

describe('KYC Verification Flow', () => {
  it('should progress: NONE → INITIATED → DOCUMENTS_SUBMITTED → IN_REVIEW → APPROVED', async () => {
    // ...
  });

  it('should require liveness for enhanced level', async () => {
    // ...
  });

  it('should expire after 24 hours', async () => {
    // ...
  });

  it('should reject if PEP match confirmed', async () => {
    // ...
  });

  it('should suspend profile when document expires', async () => {
    // ...
  });
});
```

### 2.2 AML Transaction Screening (Week 5–7)

**Tasks:**

- [ ] Implement `AmlService` with real-time transaction screening
- [ ] Build configurable rule engine supporting 6 rule types
- [ ] Implement threshold detection with per-jurisdiction configuration
- [ ] Build velocity detection with sliding time windows
- [ ] Implement geographic rule evaluation (FATF/OFAC)
- [ ] Build alert creation and lifecycle management
- [ ] Implement case management with investigation workflow
- [ ] Build SAR/CTR draft generation with deadline tracking
- [ ] Implement entity risk scoring with time decay
- [ ] Import OFAC SDN and EU sanctions lists
- [ ] Create sanctions screening against imported lists
- [ ] Write event handlers for inbound transaction events

**Rule Engine Architecture:**

```typescript
// packages/compliance/src/aml/rules-engine.ts

export class RulesEngine {
  async evaluateRule(rule: AmlRule, transaction: EnrichedTransaction): Promise<RuleResult> {
    switch (rule.ruleType) {
      case 'threshold':
        return this.evaluateThreshold(rule.configuration, transaction);
      case 'velocity':
        return this.evaluateVelocity(rule.configuration, transaction);
      case 'pattern':
        return this.evaluatePattern(rule.configuration, transaction);
      case 'geographic':
        return this.evaluateGeographic(rule.configuration, transaction);
      case 'behavioral':
        return this.evaluateBehavioral(rule.configuration, transaction);
      case 'network':
        return this.evaluateNetwork(rule.configuration, transaction);
      default:
        throw new AmlRuleError(rule.id, `Unknown rule type: ${rule.ruleType}`);
    }
  }

  private async evaluateThreshold(
    config: ThresholdConfig,
    txn: EnrichedTransaction
  ): Promise<RuleResult> {
    const amount = config.period
      ? await this.getAggregateAmount(txn.userId, txn.ventureId, config.period)
      : parseFloat(txn.amountUsd);

    const triggered = this.compareValue(amount, config.operator, config.value);

    return {
      triggered,
      confidence: triggered ? 1.0 : 0.0,
      details: triggered
        ? `Amount ${amount} ${config.operator} threshold ${config.value} ${config.currency}`
        : `Amount ${amount} within threshold`,
    };
  }
}
```

### 2.3 Jurisdiction Management (Week 6–7)

**Tasks:**

- [ ] Implement `JurisdictionService` with hierarchical rule resolution
- [ ] Integrate MaxMind GeoIP for IP-to-jurisdiction resolution
- [ ] Build VPN/proxy/Tor detection pipeline
- [ ] Implement GPS cross-validation for mobile clients
- [ ] Build license management lifecycle (apply → grant → renew → expire)
- [ ] Implement age verification flow with configurable methods per jurisdiction
- [ ] Build tax withholding calculation engine
- [ ] Implement data residency validation checks
- [ ] Create compliance calendar with recurring event generation
- [ ] Build geo-blocking middleware for Next.js Edge Runtime
- [ ] Seed jurisdiction requirements for initial markets (US-NJ, GB, MT, CA-ON)

### 2.4 Responsible Gaming (Week 7–9)

**Tasks:**

- [ ] Implement `ResponsibleGamingService` with limit enforcement
- [ ] Build Redis-backed limit counter system with atomic operations
- [ ] Implement asymmetric cooling-off logic (decrease immediate, increase delayed)
- [ ] Build self-exclusion flow with immediate enforcement
- [ ] Implement reality check timer system with session tracking
- [ ] Build intervention trigger framework (automated + manual)
- [ ] Implement player activity summary aggregation
- [ ] Create event handlers for session and wager events from `@mcv/engagement`
- [ ] Build daily limit reset cron job
- [ ] Write responsible gaming audit log entries

**Limit Enforcement Implementation:**

```typescript
// packages/compliance/src/responsible-gaming/limits-engine.ts

export class LimitsEngine {
  constructor(private redis: RedisClient, private db: DrizzleClient) {}

  /**
   * Check if a player action is within their limits.
   * Uses Redis for performance — all limit counters are cached.
   */
  async checkLimit(
    userId: string,
    ventureId: string,
    limitType: LimitType,
    amount: number,
    currency: string
  ): Promise<LimitCheckResult> {
    // Check all periods for this limit type
    const periods: LimitPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];
    const checks: LimitPeriodCheck[] = [];

    for (const period of periods) {
      const cacheKey = `compliance:rg:limit:${limitType}:${period}:${userId}:${ventureId}`;
      const cached = await this.redis.get(cacheKey);

      if (!cached) {
        // No limit set for this period — skip
        continue;
      }

      const limit = JSON.parse(cached) as CachedLimit;
      const wouldExceed = (limit.currentUsage + amount) > limit.limitAmount;

      checks.push({
        limitType,
        period,
        limitAmount: limit.limitAmount,
        currentUsage: limit.currentUsage,
        requestedAmount: amount,
        remainingAfter: Math.max(0, limit.limitAmount - limit.currentUsage - amount),
        currency,
        resetsAt: limit.resetsAt,
        wouldExceed,
      });
    }

    // Most restrictive limit wins
    const blocked = checks.some(c => c.wouldExceed);

    return {
      allowed: !blocked,
      checks,
      selfExcluded: false, // Checked separately
      coolingOff: false,   // Checked separately
    };
  }

  /**
   * Update limit usage after a successful action.
   * Uses Redis INCRBYFLOAT for atomic updates.
   */
  async recordUsage(
    userId: string,
    ventureId: string,
    limitType: LimitType,
    amount: number
  ): Promise<void> {
    const periods: LimitPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];

    for (const period of periods) {
      const cacheKey = `compliance:rg:limit:${limitType}:${period}:${userId}:${ventureId}`;
      const exists = await this.redis.exists(cacheKey);

      if (exists) {
        // Atomic increment
        const cached = JSON.parse(await this.redis.get(cacheKey)!) as CachedLimit;
        cached.currentUsage += amount;
        await this.redis.set(cacheKey, JSON.stringify(cached));

        // Also update database (async, non-blocking)
        this.updateDbUsage(userId, ventureId, limitType, period, amount).catch(
          err => logger.error({ err }, 'Failed to sync limit usage to database')
        );
      }
    }
  }
}
```

**Phase 2 Exit Criteria:**

- [ ] All 4 services implemented with core methods
- [ ] KYC verification flow works end-to-end (initiate → document → verify → approve)
- [ ] AML screening processes test transactions with rule triggering
- [ ] Jurisdiction geo-blocking correctly blocks/allows test IPs
- [ ] Responsible gaming limits enforce deposit/wager/time caps
- [ ] Self-exclusion immediately blocks all gaming activity
- [ ] Events published to Redpanda for all compliance actions
- [ ] Audit logs written for all state transitions
- [ ] Unit tests passing at >80% coverage for services

---

## Phase 3 — Advanced Features

**Duration:** 4 weeks  
**Goal:** Add AI-powered risk analysis, cross-venture compliance dashboard, automated reporting, and full React client SDK.

### 3.1 AI-Powered Risk Scoring (Week 10–11)

**Tasks:**

- [ ] Implement AI behavioral risk assessment using OpenRouter (Claude 3.5 Sonnet)
- [ ] Build prompt engineering for player behavior analysis
- [ ] Create behavioral indicator extraction pipeline
- [ ] Implement risk score trending and change detection
- [ ] Build automated intervention triggers based on risk levels
- [ ] Create risk escalation workflows (moderate → high → critical)
- [ ] Implement AI-enhanced AML pattern detection for complex structuring
- [ ] Build AI-assisted SAR narrative generation for compliance officers

**AI Behavioral Analysis:**

```typescript
// packages/compliance/src/responsible-gaming/behavioral.ts

export class BehavioralAnalyzer {
  constructor(
    private openRouter: OpenRouterClient,
    private db: DrizzleClient,
  ) {}

  async analyzePlayer(
    userId: string,
    ventureId: string,
    lookbackDays: number = 30
  ): Promise<BehavioralRiskScore> {
    // 1. Gather player data
    const activityData = await this.gatherActivityData(userId, ventureId, lookbackDays);

    // 2. Build analysis prompt
    const prompt = this.buildAnalysisPrompt(activityData);

    // 3. Run AI analysis
    const response = await this.openRouter.chat({
      model: this.config.responsibleGaming.aiModel,
      messages: [
        {
          role: 'system',
          content: `You are a responsible gaming behavioral analyst. Analyze the player's 
          activity data and identify risk indicators. Return a JSON response with:
          - riskScore (0-1000)
          - riskLevel (low|moderate|elevated|high|critical)
          - indicators (array of detected risk indicators)
          - recommendedAction (string)
          
          Risk indicators to evaluate:
          - loss_chasing: Increasing bet sizes after losses
          - erratic_betting: Sudden pattern changes
          - time_creep: Progressively longer sessions
          - escalating_deposits: Increasing deposit frequency/amount
          - late_night_activity: 1AM-5AM concentration
          - limit_boundary_testing: Repeatedly hitting limits
          - rapid_session_restart: Quick session turnover`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temperature for consistent analysis
    });

    // 4. Parse and validate AI response
    const analysis = behavioralAnalysisResponseSchema.parse(
      JSON.parse(response.choices[0].message.content)
    );

    // 5. Store results
    const riskScore = await this.db.insert(behavioralRiskScores).values({
      ventureId,
      userId,
      overallScore: analysis.riskScore,
      riskLevel: analysis.riskLevel,
      // ... store full analysis
    }).returning();

    // 6. Trigger interventions if needed
    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      await this.triggerIntervention(userId, ventureId, analysis);
    }

    return riskScore[0];
  }
}
```

### 3.2 Cross-Venture Compliance Dashboard (Week 11–12)

**Tasks:**

- [ ] Build compliance admin dashboard (React components)
- [ ] Create KYC verification review panel (`KycAdminReviewPanel`)
- [ ] Build AML alert dashboard with queue management (`AmlAlertDashboard`)
- [ ] Create AML case manager with evidence tracking (`AmlCaseManager`)
- [ ] Build jurisdiction map visualization (`JurisdictionMap`)
- [ ] Create license tracker with expiry monitoring (`LicenseTracker`)
- [ ] Build responsible gaming dashboard with risk distribution (`ResponsibleGamingDashboard`)
- [ ] Create compliance calendar view (`ComplianceCalendarView`)
- [ ] Build cross-venture compliance metrics aggregation
- [ ] Implement dashboard data hooks (16 React hooks)

**React Hooks:**

```typescript
// packages/compliance/src/client/hooks/use-aml-dashboard.ts

export function useAmlDashboard(ventureId: string) {
  return useQuery({
    queryKey: ['compliance', 'aml', 'dashboard', ventureId],
    queryFn: async () => {
      const response = await fetch(`/api/compliance/aml/dashboard?ventureId=${ventureId}`);
      return response.json() as Promise<AmlDashboard>;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Usage in component:
// const { data: dashboard, isLoading } = useAmlDashboard('vent_betedge');
```

### 3.3 Automated Reporting (Week 12–13)

**Tasks:**

- [ ] Build automated CTR generation for transactions exceeding thresholds
- [ ] Implement SAR deadline tracking with escalating notifications
- [ ] Create regulatory filing workflow (draft → review → submit → acknowledge)
- [ ] Build compliance report generation (monthly activity reports, quarterly AML summaries)
- [ ] Implement batch PEP/sanctions rescreening (30-day and 90-day cadences)
- [ ] Build watchlist auto-import from OFAC, EU, UN sources
- [ ] Create document expiry notification pipeline
- [ ] Implement license renewal reminder system
- [ ] Build compliance calendar auto-generation for recurring events

### 3.4 Client Components (Week 12–13)

**Tasks:**

- [ ] Build `KycVerificationFlow` — multi-step verification wizard
- [ ] Build `KycDocumentUploader` — document upload with preview
- [ ] Build `KycLivenessCapture` — biometric selfie/video capture
- [ ] Build `KycStatusBadge` — verification level indicator
- [ ] Build `AmlSarForm` — SAR drafting form for compliance officers
- [ ] Build `AmlRuleEditor` — configurable rule builder UI
- [ ] Build `AmlTransactionTimeline` — transaction history visualization
- [ ] Build `GeoBlockConfigPanel` — geo-blocking rule configuration
- [ ] Build `AgeGateModal` — age verification popup
- [ ] Build `LimitSettingsPanel` — player limit configuration
- [ ] Build `SelfExclusionFlow` — self-exclusion wizard with confirmations
- [ ] Build `RealityCheckPopup` — in-session reality check interruption
- [ ] Build `CoolingOffNotice` — cooling-off period notification
- [ ] Build `BehavioralRiskIndicator` — risk visualization widget

**Phase 3 Exit Criteria:**

- [ ] AI behavioral analysis runs on test player data and produces valid risk scores
- [ ] Compliance dashboard displays real-time data across all 4 modules
- [ ] Automated CTR drafts generated for qualifying transactions
- [ ] SAR deadline tracking sends alerts at configured intervals
- [ ] Watchlist imports run successfully from OFAC and EU sources
- [ ] All 21 React components render correctly with test data
- [ ] All 16 React hooks function with mock API endpoints

---

## Phase 4 — Polish & Hardening

**Duration:** 3 weeks  
**Goal:** Optimize performance, harden security, validate against regulatory requirements, and prepare for production.

### 4.1 Performance Optimization (Week 14)

**Tasks:**

- [ ] Profile and optimize AML transaction screening path (<50ms P50, <100ms P99)
- [ ] Optimize Redis caching strategy (measure hit ratios, adjust TTLs)
- [ ] Implement database query optimization (EXPLAIN ANALYZE on critical paths)
- [ ] Add database connection pooling tuning (Supabase connection limits)
- [ ] Build database partitioning for transaction records (monthly partitions)
- [ ] Optimize PEP screening batching (reduce external API calls)
- [ ] Implement response caching for jurisdiction rules and requirements
- [ ] Load test AML screening at 1,000 TPS target
- [ ] Load test limit checks at 10,000 TPS target

### 4.2 Regulatory Validation (Week 14–15)

**Tasks:**

- [ ] Map all NJDGE requirements to implemented features (compliance matrix)
- [ ] Validate UKGC responsible gaming requirements (self-exclusion, reality checks, limits)
- [ ] Validate MGA KYC requirements (enhanced due diligence at €2,000)
- [ ] Verify FinCEN CTR thresholds and SAR timelines
- [ ] Test GDPR right-to-erasure implementation (anonymization, not deletion)
- [ ] Validate audit trail completeness (every action logged with required fields)
- [ ] Review data retention policies against regulatory requirements
- [ ] Document regulatory compliance mapping for each jurisdiction
- [ ] Prepare compliance audit package (sample reports, audit trail exports)

### 4.3 Security Hardening (Week 15)

**Tasks:**

- [ ] Penetration testing on compliance API endpoints
- [ ] Validate RLS policies prevent cross-venture data access (exhaustive testing)
- [ ] Audit PII encryption implementation (key rotation, at-rest, in-transit)
- [ ] Review and harden API authentication/authorization for all routes
- [ ] Implement rate limiting on compliance API endpoints
- [ ] Validate audit log immutability (attempt UPDATE/DELETE — must fail)
- [ ] Review and lock down service role usage
- [ ] Implement data masking in all API responses (document numbers, SSN, etc.)
- [ ] Security review of external provider integrations (API key storage, data transmission)

### 4.4 Production Readiness (Week 16)

**Tasks:**

- [ ] Configure production monitoring dashboards (Grafana/Datadog)
- [ ] Set up alerting rules for all critical compliance metrics
- [ ] Configure production cron jobs (watchlist import, risk recalc, expiry checks)
- [ ] Write runbooks for common compliance incidents
- [ ] Create on-call documentation for compliance service failures
- [ ] Set up database backup verification for compliance data
- [ ] Configure log retention and archival policies
- [ ] Production smoke testing across all 4 modules
- [ ] Final load testing at production traffic estimates
- [ ] Document rollback procedures for each deployment artifact

**Phase 4 Exit Criteria:**

- [ ] AML screening latency meets targets under load (P99 < 100ms at 1,000 TPS)
- [ ] All regulatory requirements mapped and validated for initial jurisdictions
- [ ] Security audit passes with no critical or high findings
- [ ] Production monitoring and alerting operational
- [ ] Incident runbooks documented and reviewed
- [ ] Load testing confirms scalability to launch targets

---

## Testing Strategy

### Test Pyramid

```
                    ┌──────────────┐
                    │   E2E Tests  │  10 scenarios
                    │  (Playwright) │  Full user flows
                    └──────┬───────┘
                           │
                   ┌───────┴────────┐
                   │ Integration    │  50+ tests
                   │ Tests          │  Service + DB + Redis
                   │ (Vitest)       │  Multi-module flows
                   └───────┬────────┘
                           │
            ┌──────────────┴──────────────┐
            │      Unit Tests             │  200+ tests
            │      (Vitest)               │  Services, utils,
            │                             │  rules engine,
            │                             │  encryption, etc.
            └─────────────────────────────┘
```

### Unit Tests (Vitest)

```typescript
// tests/unit/aml/rules-engine.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { RulesEngine } from '../../../src/aml/rules-engine';

describe('AML Rules Engine', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine(mockRedis, mockDb);
  });

  describe('Threshold Rules', () => {
    it('should trigger when single transaction exceeds CTR threshold ($10,000)', async () => {
      const rule = createThresholdRule({ value: 10000, operator: 'gte', currency: 'USD' });
      const txn = createTestTransaction({ amountUsd: '15000.00' });

      const result = await engine.evaluateRule(rule, txn);

      expect(result.triggered).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it('should not trigger below threshold', async () => {
      const rule = createThresholdRule({ value: 10000, operator: 'gte', currency: 'USD' });
      const txn = createTestTransaction({ amountUsd: '5000.00' });

      const result = await engine.evaluateRule(rule, txn);

      expect(result.triggered).toBe(false);
    });

    it('should detect aggregate threshold over 24h period', async () => {
      // ... mock Redis aggregate data
    });
  });

  describe('Pattern Detection', () => {
    it('should detect structuring: multiple transactions just below $10,000', async () => {
      const rule = createPatternRule({ pattern: 'structuring', threshold: 10000, tolerance: 0.15 });
      const txns = [
        createTestTransaction({ amountUsd: '9500.00' }),
        createTestTransaction({ amountUsd: '9200.00' }),
        createTestTransaction({ amountUsd: '9800.00' }),
      ];
      // ... mock historical transactions
    });

    it('should not flag legitimate transactions with varying amounts', async () => {
      // ...
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/kyc-flow.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, seedTestData, cleanupTestDatabase } from '../fixtures';

describe('KYC Verification Flow (Integration)', () => {
  let kycService: KycService;
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    await seedTestData(testDb);
    kycService = new KycService(/* inject test deps */);
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
  });

  it('should complete full verification flow: initiate → upload → verify → approve', async () => {
    // 1. Initiate
    const verification = await kycService.initiateVerification({
      userId: testUsers.alice.id,
      ventureId: testVentures.betedge.id,
      targetLevel: 'standard',
    });
    expect(verification.status).toBe('initiated');

    // 2. Upload document
    const doc = await kycService.uploadDocument({
      kycProfileId: verification.kycProfileId,
      verificationId: verification.id,
      documentType: 'passport',
      frontImage: testFixtures.passportImage,
      issuingCountry: 'US',
    });
    expect(doc.status).toBe('processing');

    // 3. Simulate provider verification callback
    await kycService.processProviderCallback(doc.id, {
      result: 'clear',
      ocrData: testFixtures.ocrResult,
    });

    // 4. Check status
    const status = await kycService.getVerificationStatus(
      testUsers.alice.id,
      testVentures.betedge.id
    );
    expect(status.currentLevel).toBe('standard');
    expect(status.status).toBe('approved');

    // 5. Verify audit log
    const auditLogs = await testDb.query.kycAuditLog.findMany({
      where: eq(kycAuditLog.kycProfileId, verification.kycProfileId),
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(3);
    expect(auditLogs.map(l => l.action)).toContain('verification_initiated');
    expect(auditLogs.map(l => l.action)).toContain('document_verified');
    expect(auditLogs.map(l => l.action)).toContain('level_changed');
  });

  it('should enforce venture isolation via RLS', async () => {
    // Create KYC for BetEdge user
    const betEdgeProfile = await kycService.getProfile(
      testUsers.alice.id,
      testVentures.betedge.id
    );

    // Querying as SerpSpace venture should not return BetEdge data
    const serpSpaceProfile = await kycService.getProfile(
      testUsers.alice.id,
      testVentures.serpspace.id
    );

    expect(betEdgeProfile).not.toBeNull();
    expect(serpSpaceProfile).toBeNull(); // Different venture context
  });
});
```

### Compliance Scenario Tests

```typescript
// tests/integration/compliance-scenarios.test.ts

describe('Regulatory Compliance Scenarios', () => {
  it('SCENARIO: US user deposits $12,000 → CTR auto-generated', async () => {
    const screening = await amlService.screenTransaction({
      userId: testUsers.alice.id,
      ventureId: testVentures.betedge.id,
      amount: '12000.00',
      currency: 'USD',
      transactionType: 'deposit',
    });

    expect(screening.screeningResult).toBe('flagged');
    expect(screening.rulesTriggered).toContain('CTR_THRESHOLD');

    // Verify CTR draft was auto-created
    const ctrFilings = await amlService.getFilings(testVentures.betedge.id, {
      filingType: 'ctr',
      status: 'draft',
    });
    expect(ctrFilings.items.length).toBeGreaterThan(0);
  });

  it('SCENARIO: Self-excluded player attempts deposit → blocked immediately', async () => {
    // Set self-exclusion
    await responsibleGamingService.initiateSelfExclusion({
      userId: testUsers.bob.id,
      ventureId: testVentures.betedge.id,
      type: 'temporary',
      duration: '6_months',
      acknowledgedIrrevocable: true,
    });

    // Attempt deposit check
    const result = await responsibleGamingService.checkLimits(
      testUsers.bob.id,
      testVentures.betedge.id,
      { type: 'deposit', amount: '100.00', currency: 'USD' }
    );

    expect(result.allowed).toBe(false);
    expect(result.selfExcluded).toBe(true);
  });

  it('SCENARIO: Player from sanctioned country → geo-blocked', async () => {
    const access = await jurisdictionService.evaluateGeoAccess(
      testVentures.betedge.id,
      '5.62.60.1', // Iranian IP range
    );

    expect(access.allowed).toBe(false);
    expect(access.action).toBe('block');
  });

  it('SCENARIO: Limit decrease → immediate, limit increase → 24h cooling-off', async () => {
    // Set initial limit
    await responsibleGamingService.setLimits({
      userId: testUsers.alice.id,
      ventureId: testVentures.betedge.id,
      limitType: 'deposit',
      period: 'daily',
      amount: '1000.00',
    });

    // Decrease → immediate
    const decreased = await responsibleGamingService.setLimits({
      userId: testUsers.alice.id,
      ventureId: testVentures.betedge.id,
      limitType: 'deposit',
      period: 'daily',
      amount: '500.00',
    });
    expect(decreased.status).toBe('active');
    expect(decreased.amount).toBe('500.00');

    // Increase → cooling-off
    const increased = await responsibleGamingService.setLimits({
      userId: testUsers.alice.id,
      ventureId: testVentures.betedge.id,
      limitType: 'deposit',
      period: 'daily',
      amount: '2000.00',
    });
    expect(increased.status).toBe('pending_increase');
    expect(increased.coolingOffUntil).toBeDefined();
  });
});
```

### Test Coverage Targets

| Module | Unit | Integration | Target Coverage |
|--------|------|-------------|----------------|
| KYC | 50+ | 10 | >85% |
| AML | 60+ | 15 | >85% |
| Jurisdictions | 40+ | 10 | >80% |
| Responsible Gaming | 50+ | 15 | >85% |
| Infrastructure | 30+ | 5 | >90% |
| **Total** | **230+** | **55** | **>85%** |

---

## Acceptance Criteria

### Functional Acceptance

| # | Criterion | Verification |
|---|-----------|-------------|
| F1 | KYC verification flow completes for all 5 levels | Integration test passes |
| F2 | AML screening processes transactions in <100ms P99 | Load test result |
| F3 | 6 AML rule types evaluate correctly against test data | Unit tests pass |
| F4 | CTR auto-generated for transactions ≥ $10,000 | Scenario test passes |
| F5 | SAR deadline tracking alerts at 7/3/1 days remaining | Integration test passes |
| F6 | Geo-blocking correctly blocks/allows by jurisdiction | Unit + integration tests |
| F7 | VPN detection blocks users with proxy/VPN on gambling routes | Integration test passes |
| F8 | Age verification enforces per-jurisdiction minimums | Unit tests pass |
| F9 | Deposit/loss/wager/time limits enforce correctly | Integration tests pass |
| F10 | Self-exclusion immediately blocks all gaming activity | Scenario test passes |
| F11 | Limit decreases take effect immediately | Integration test passes |
| F12 | Limit increases require cooling-off period | Integration test passes |
| F13 | Reality checks display at configured intervals | Component test passes |
| F14 | Behavioral risk analysis produces valid risk scores | Integration test passes |
| F15 | All compliance actions logged to immutable audit tables | Database query verification |

### Non-Functional Acceptance

| # | Criterion | Target | Verification |
|---|-----------|--------|-------------|
| NF1 | AML screening latency | P50 < 50ms, P99 < 100ms | Load test |
| NF2 | Limit check latency | P50 < 15ms, P99 < 40ms | Load test |
| NF3 | Geo-access evaluation latency | P50 < 30ms, P99 < 75ms | Load test |
| NF4 | Transaction screening throughput | ≥ 1,000 TPS | Load test |
| NF5 | PII encryption covers all sensitive fields | Security audit |
| NF6 | RLS prevents cross-venture data access | Security test |
| NF7 | Audit logs are immutable (no UPDATE/DELETE) | Database test |
| NF8 | Test coverage | > 85% | Coverage report |
| NF9 | Zero critical security findings | Penetration test |
| NF10 | Data retention enforced per regulatory requirements | Policy review |

---

## Risks & Mitigations

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| R1 | **External provider delays** — Onfido/ComplyAdvantage API keys or sandbox access delayed | Medium | High | Begin with mock providers; design provider abstraction layer so real providers can be swapped in without service changes |
| R2 | **Regulatory interpretation errors** — Misunderstanding of specific jurisdiction requirements | Medium | Critical | Engage compliance SME for requirement validation; map every feature to specific regulatory text; plan for iterative regulatory updates |
| R3 | **Performance bottleneck in AML screening** — Real-time screening path too slow under load | Low | High | Redis-first architecture for rule lookups; pre-computed aggregates for sliding windows; circuit breaker for external calls; load test early (Phase 2) |
| R4 | **Schema complexity** — 45 tables may cause migration/maintenance challenges | Medium | Medium | Organize into clear submodule schemas; comprehensive index strategy; automated migration testing in CI; partition large tables by date |
| R5 | **GamStop integration delay** — UK self-exclusion register access requires lengthy approval | High | Medium | Implement GamStop adapter interface; mock initially; launch UK market only after integration is live |
| R6 | **AI behavioral analysis accuracy** — False positives triggering unnecessary interventions | Medium | Medium | Conservative thresholds initially; human-in-the-loop for high-risk decisions; continuous tuning based on compliance officer feedback; manual override capability |
| R7 | **Data residency compliance** — Ensuring EU user data stays in EU regions | Low | Critical | Supabase regional deployments; data residency validation in write paths; GDPR-compliant transfer mechanisms for cross-border processing |
| R8 | **Encryption key management** — Key rotation complexity, potential data loss | Low | Critical | Use managed key service; implement key versioning; test key rotation procedure on staging before production; automated re-encryption migration |
| R9 | **Multi-venture coordination** — Different ventures have different compliance needs | Medium | Medium | Configurable per-venture rules (via `ventureId` scoping); venture-specific jurisdiction mappings; flexible rule engine that doesn't require code changes |
| R10 | **Audit log storage growth** — Immutable, high-volume audit data growing unbounded | Medium | Low | Monthly partitioning; cold storage archival after 2 years; retention policies enforced automatically; compression for archived partitions |

---

## Timeline

### Gantt Overview

```
Week  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16
      ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
      │         │                    │              │
      │ PHASE 1 │      PHASE 2       │   PHASE 3    │ P4
      │Foundation│ Core Implementation│   Advanced   │Polish
      │         │                    │              │
      ├─────────┤                    │              │
      │ Schema  │                    │              │
      │ Types   │                    │              │
      │ Config  │                    │              │
      │ Infra   │                    │              │
      ├─────────┼──────┤             │              │
      │         │ KYC  │             │              │
      │         │ Flow │             │              │
      │         ├──────┼─────┤       │              │
      │         │      │ AML │       │              │
      │         │      │Screen│      │              │
      │         │      ├─────┼───┤   │              │
      │         │      │Juris│   │   │              │
      │         │      │dict.│   │   │              │
      │         │      │     ├───┼───┤              │
      │         │      │     │Resp│  │              │
      │         │      │     │Game│  │              │
      │         │      │     │   ├───┼──────┤       │
      │         │      │     │   │AI │Dash  │       │
      │         │      │     │   │Risk│board │       │
      │         │      │     │   │   ├──────┼───┤   │
      │         │      │     │   │   │Report│Comp│   │
      │         │      │     │   │   │ing   │nent│   │
      │         │      │     │   │   │      │s   │   │
      │         │      │     │   │   │      ├───┼───┤
      │         │      │     │   │   │      │Perf│Sec│
      │         │      │     │   │   │      │Reg │Prod│
      └─────────┴──────┴─────┴───┴───┴──────┴───┴───┘
```

### Milestone Summary

| Milestone | Target Date | Deliverables |
|-----------|------------|-------------|
| **M1: Foundation Complete** | End of Week 3 | Package structure, 45 tables, RLS, types, config, encryption, caching |
| **M2: KYC Live** | End of Week 5 | KYC verification flow operational with Onfido integration |
| **M3: AML Live** | End of Week 7 | AML screening with rule engine, alerts, and sanctions checking |
| **M4: Full Core** | End of Week 9 | All 4 modules operational (KYC + AML + Jurisdictions + RG) |
| **M5: Advanced Features** | End of Week 13 | AI risk scoring, dashboard, automated reporting, React SDK |
| **M6: Production Ready** | End of Week 16 | Performance validated, security hardened, regulatory compliance confirmed |

### Sprint Allocation

| Sprint | Weeks | Focus | Key Deliverables |
|--------|-------|-------|-----------------|
| Sprint 1 | 1–2 | Foundation | Schema, types, config, encryption |
| Sprint 2 | 3–4 | Foundation + KYC | Infrastructure, KYC service start |
| Sprint 3 | 5–6 | KYC + AML | KYC complete, AML screening begins |
| Sprint 4 | 7–8 | AML + Jurisdictions | AML complete, jurisdictions start |
| Sprint 5 | 9–10 | RG + AI Risk | Responsible gaming, AI behavioral analysis |
| Sprint 6 | 11–12 | Dashboard + Reporting | Compliance dashboard, automated reporting |
| Sprint 7 | 13–14 | Components + Performance | React SDK, performance optimization |
| Sprint 8 | 15–16 | Security + Production | Security hardening, production readiness |

### Dependencies & Critical Path

```
Schema Design ─────────────────────────┐
                                       │
Types & Config ────────────────────────┤
                                       │
Encryption Module ─────────────────────┤
                                       ▼
                              KYC Service ────────────┐
                                       │              │
                              AML Service ────────────┤
                                       │              │
                              Jurisdiction Service ───┤
                                       │              │
                              RG Service ─────────────┤
                                       │              ▼
                                       │    AI Risk Scoring
                                       │              │
                                       │    Dashboard & Components
                                       │              │
                                       │    Automated Reporting
                                       │              │
                                       └──────────────┤
                                                      ▼
                                           Performance & Security
                                                      │
                                                      ▼
                                             Production Launch
```

**Critical Path:** Schema → Types → Encryption → KYC Service → AML Service → Performance Testing → Production

The critical path runs through the KYC and AML services, as they have the most complex business logic and external integrations. Jurisdictions and Responsible Gaming can be developed in parallel once the foundation is complete.

---

*@mcv/compliance — Regulatory Compliance Domain*
