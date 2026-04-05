# 01 — Package Specification: @mcv/compliance

| Field              | Value                                          |
|--------------------|------------------------------------------------|
| **Package**        | `@mcv/compliance`                              |
| **Classification** | MCV-ONLY                                       |
| **Tier**           | 5 — Domain Layer                               |
| **Version**        | 1.0.0                                          |
| **Status**         | Active Development                             |
| **Owner**          | MCV Platform Engineering                       |
| **Last Updated**   | February 9, 2026                               |

---

## Table of Contents

1. [Overview](#overview)
2. [Purpose & Scope](#purpose--scope)
3. [Module Summary](#module-summary)
   - [AML (Anti-Money Laundering)](#aml-anti-money-laundering)
   - [Jurisdictions](#jurisdictions)
   - [KYC (Know Your Customer)](#kyc-know-your-customer)
   - [Responsible Gaming](#responsible-gaming)
4. [Architecture Position](#architecture-position)
5. [Key Interfaces & Types](#key-interfaces--types)
6. [Configuration](#configuration)
7. [Dependencies](#dependencies)
8. [Multi-Tenant Design](#multi-tenant-design)
9. [Security Considerations](#security-considerations)
10. [Performance Requirements](#performance-requirements)
11. [Deployment & Operations](#deployment--operations)

---

## Overview

`@mcv/compliance` is the **mission-critical regulatory compliance domain** for the MCV.ONE Agentic OS platform. It provides a unified compliance framework that spans all nine ventures in the MCV consortium, handling everything from identity verification and anti-money laundering monitoring to multi-jurisdiction regulatory management and responsible gaming protections.

Every user registration, every financial transaction, every gaming session, and every venture's operational boundary passes through this package. It is the gatekeeper that ensures the MCV ecosystem operates within the bounds of the law across 30+ jurisdictions worldwide.

The package is classified as **MCV-ONLY** because it contains proprietary compliance logic, regulatory interpretations, risk models, and enforcement strategies specific to the MCV venture portfolio. It is never published to public registries and is accessible only within the MCV monorepo.

### Key Characteristics

- **45 database tables** across 4 submodules (8 KYC + 12 AML + 10 Jurisdictions + 15 Responsible Gaming)
- **4 core service classes** providing ~100 service methods
- **Real-time transaction screening** with sub-100ms latency targets
- **12+ regulatory frameworks** covered (GDPR, CCPA, MiCA, PCI-DSS, UKGC, MGA, FINTRAC, FinCEN, 5AMLD/6AMLD, FATF, SOC 2, state gaming)
- **Multi-venture, multi-jurisdiction** architecture with complete tenant isolation
- **AI-powered risk scoring** via OpenRouter for behavioral analysis and pattern detection
- **Immutable audit trails** for every compliance action, decision, and state change

---

## Purpose & Scope

### Purpose

`@mcv/compliance` exists to:

1. **Protect the business** — Ensure every MCV venture operates within applicable regulatory frameworks, avoiding fines, license revocations, and criminal liability.
2. **Protect users** — Implement robust identity verification, responsible gaming controls, and data protection measures that safeguard user welfare and privacy.
3. **Enable expansion** — Provide a flexible jurisdictional framework that allows ventures to enter new markets by simply configuring regulatory requirements rather than building custom compliance logic.
4. **Automate compliance operations** — Reduce the manual burden on compliance officers through automated screening, alert triage, pattern detection, and regulatory filing.
5. **Provide auditability** — Maintain comprehensive, immutable audit trails that satisfy regulatory inspectors and demonstrate due diligence.

### Scope

#### In Scope

| Area | Description |
|------|-------------|
| **KYC Identity Verification** | Tiered verification (5 levels), document OCR/NFC, biometric liveness, PEP/sanctions screening, risk scoring |
| **AML Transaction Monitoring** | Real-time screening, rule engine (6 rule types), pattern detection, alert/case management, SAR/CTR filing |
| **Jurisdiction Management** | Jurisdiction registry, licensing, geo-blocking, age verification, tax rules, data residency, compliance calendar |
| **Responsible Gaming** | Self-exclusion, deposit/loss/wager/time limits, reality checks, cooling-off, behavioral risk AI, interventions |
| **Cross-Venture Compliance** | Unified compliance posture across BetEdge, SerpSpace, Full Gain, MCV Studios, Futurestate, and all other ventures |
| **Regulatory Reporting** | Automated SAR/CTR generation, filing management, deadline tracking, regulatory filing records |
| **React Client SDK** | Hooks and components for KYC flows, AML dashboards, jurisdiction maps, responsible gaming panels |

#### Out of Scope

| Area | Handled By |
|------|------------|
| User authentication & sessions | `@mcv/identity` |
| Payment processing | `@mcv/connectors` |
| Blockchain/token operations | `@mcv/connectors` (Solana adapter) |
| Audit event bus infrastructure | `@mcv/fabric` |
| Notification delivery | `@mcv/fabric` (notifications module) |
| AI model inference | `@mcv/agentic-os` (via OpenRouter) |

---

## Module Summary

### AML (Anti-Money Laundering)

**Path:** `packages/compliance/src/aml/`

The AML module implements a comprehensive anti-money laundering framework with real-time transaction monitoring, multi-pattern detection, and regulatory filing capabilities. It is the financial watchdog of the MCV ecosystem.

#### Capabilities

| Capability | Description |
|-----------|-------------|
| **Transaction Screening** | Every financial transaction (deposit, withdrawal, wager, payout, transfer, crypto) is screened in real time against active detection rules before completion |
| **Rule Engine** | Six rule types — threshold, velocity, pattern, geographic, behavioral, network — each configurable per venture and jurisdiction |
| **Pattern Detection** | Automated detection of structuring, layering, smurfing, round-tripping, chip dumping, rapid movement, dormant reactivation, and volume spikes |
| **Alert Management** | Full lifecycle alert management: creation → assignment → investigation → escalation → disposition (filed/dismissed) |
| **Case Management** | Investigation case files linking alerts, transactions, evidence, notes, and timelines for compliance officer review |
| **SAR/CTR Filing** | Draft, review, and submit Suspicious Activity Reports and Currency Transaction Reports to FinCEN, FINTRAC, NCA, and other regulatory bodies |
| **Entity Risk Scoring** | Composite risk scores (0–1000) with time decay, calculated from transaction, geographic, behavioral, network, and alert history factors |
| **Sanctions Screening** | Real-time screening against OFAC SDN, EU Sanctions, UN Consolidated, and other watchlists with daily automated imports |
| **Network Analysis** | Detect connected accounts via shared IPs, payment methods, and device fingerprints; identify ring transactions and shell accounts |

#### Database Tables (12)

| Table | Purpose |
|-------|---------|
| `compliance_aml_transaction_records` | Every monitored transaction with screening results |
| `compliance_aml_alerts` | Generated AML alerts with priority, status, disposition |
| `compliance_aml_cases` | Investigation cases linking alerts and evidence |
| `compliance_aml_sar_filings` | Suspicious Activity Report records |
| `compliance_aml_ctr_filings` | Currency Transaction Report records |
| `compliance_aml_rules` | Configurable detection rule definitions |
| `compliance_aml_risk_scores` | Entity-level composite risk scores |
| `compliance_aml_patterns` | Detected behavioral patterns |
| `compliance_aml_watchlists` | External watchlist imports (OFAC, EU, UN) |
| `compliance_aml_sanctions_screenings` | Per-transaction sanctions check results |
| `compliance_aml_threshold_configs` | Per-jurisdiction reporting thresholds |
| `compliance_aml_audit_log` | Immutable AML audit trail |

#### Detection Rule Types

```
THRESHOLD   →  Single or aggregate transaction amounts exceeding limits
VELOCITY    →  Transaction frequency exceeding normal patterns
PATTERN     →  Structuring, layering, smurfing, round-tripping
GEOGRAPHIC  →  Transactions from FATF high-risk or sanctioned countries
BEHAVIORAL  →  Sudden volume changes, dormant account reactivation
NETWORK     →  Connected accounts, shared identifiers, ring transactions
```

#### Key Regulatory Thresholds

| Threshold | Amount | Regulator | Action |
|-----------|--------|-----------|--------|
| CTR Filing | ≥ $10,000 USD | FinCEN | Auto-generate CTR draft |
| Enhanced Monitoring | ≥ $3,000 USD | Internal | Flag for enhanced review |
| SAR Filing Deadline | — | FinCEN | 30 calendar days from detection |
| CTR Filing Deadline | — | FinCEN | 15 business days |
| Aggregate Daily | ≥ $10,000 in 24h | FinCEN | Structuring detection trigger |

---

### Jurisdictions

**Path:** `packages/compliance/src/jurisdictions/`

The Jurisdictions module manages the complex multi-jurisdiction regulatory landscape across all MCV ventures. It is the regulatory map that determines what each venture can and cannot do in each territory.

#### Capabilities

| Capability | Description |
|-----------|-------------|
| **Jurisdiction Registry** | Hierarchical registry of countries, states, provinces, territories with regulatory status per activity type (gambling, commerce, crypto) |
| **License Management** | Track operating licenses per venture per jurisdiction with application, renewal, expiry, suspension, and revocation lifecycle |
| **Geo-Blocking** | Multi-layer geographic access control using IP geolocation (MaxMind), VPN/proxy detection, GPS cross-validation, and address verification |
| **Age Verification** | Per-jurisdiction age requirements with configurable verification methods (self-declaration, ID document, credit bureau, voter roll, iDIN) |
| **Tax Rules** | Tax withholding and reporting configuration per jurisdiction (federal, state, gaming tax, VAT/GST, crypto capital gains) |
| **Data Residency** | Data storage and transfer rules per jurisdiction aligned with GDPR, CCPA, PIPEDA, and other privacy frameworks |
| **Compliance Calendar** | Regulatory deadline tracking with escalating reminders (90/60/30/14/7/1 days) and recurring event generation |
| **Filing Management** | Track regulatory filings (tax returns, activity reports, financial statements, audit responses) with status and deadlines |
| **Venture Status** | Per-venture operational status in each jurisdiction (active, pending, suspended, prohibited, under review) |

#### Database Tables (10)

| Table | Purpose |
|-------|---------|
| `compliance_jurisdictions` | Jurisdiction definitions with regulatory status |
| `compliance_jurisdiction_requirements` | Per-jurisdiction regulatory requirements |
| `compliance_jurisdiction_licenses` | Operating licenses and permits |
| `compliance_jurisdiction_geo_rules` | Geo-blocking and geo-fencing rules |
| `compliance_jurisdiction_age_rules` | Age verification requirements |
| `compliance_jurisdiction_tax_rules` | Tax withholding and reporting rules |
| `compliance_jurisdiction_data_rules` | Data residency and privacy rules |
| `compliance_jurisdiction_venture_status` | Per-venture jurisdiction status |
| `compliance_calendar` | Regulatory deadlines and renewals |
| `compliance_filings` | Regulatory filing records |

#### Jurisdiction Hierarchy

```
COUNTRY (e.g., "US")
  └── STATE/PROVINCE (e.g., "US-NJ")
        └── Inherits country rules
        └── Can override with more restrictive rules
        └── Cannot override with less restrictive rules
```

#### Key Regulatory Frameworks

| Region | Key Frameworks | Primary Ventures |
|--------|---------------|-----------------|
| **US (Federal)** | FinCEN, OFAC, Wire Act | All |
| **US (State)** | DGE (NJ), PGCB (PA), MGCB (MI) | BetEdge |
| **UK** | UKGC, FCA, UK GDPR | BetEdge, SerpSpace |
| **EU** | GDPR, MiCA, 6AMLD, PSD2 | All with EU users |
| **Malta** | MGA, MFSA | BetEdge (EU hub) |
| **Canada** | FINTRAC, AGCO (ON), PIPEDA | All with CA users |

---

### KYC (Know Your Customer)

**Path:** `packages/compliance/src/kyc/`

The KYC module implements a comprehensive identity verification system with tiered levels, automated document verification, biometric liveness detection, and ongoing monitoring. It is the first gate in the compliance pipeline.

#### Capabilities

| Capability | Description |
|-----------|-------------|
| **Tiered Verification** | 5 levels (None → Basic → Standard → Enhanced → Premium) with progressively stricter requirements and higher transaction limits |
| **Document Verification** | OCR extraction from passports, driver's licenses, national IDs, utility bills, bank statements with cross-referencing |
| **NFC Verification** | Passport chip reading for cryptographic verification of identity data |
| **Biometric Liveness** | 3D depth analysis and challenge-response video to detect spoofing (photos, masks, deepfakes) |
| **PEP/Sanctions Screening** | Fuzzy name matching against Politically Exposed Persons lists and international sanctions databases |
| **Risk Scoring** | Composite risk score (0–1000) from 7 weighted factors: country risk, PEP status, adverse media, transaction volume, document quality, velocity, age bracket |
| **Ongoing Monitoring** | Document expiry tracking (30/14/7 day notifications), periodic PEP rescreening (30–90 day cadence), risk reassessment |
| **Manual Review Queue** | Review interface for compliance officers to approve, reject, or escalate verification attempts |

#### Database Tables (8)

| Table | Purpose |
|-------|---------|
| `compliance_kyc_profiles` | One-per-user KYC profiles with verification level and risk data |
| `compliance_kyc_documents` | Uploaded identity documents with OCR/NFC data |
| `compliance_kyc_verifications` | Verification attempt records with full lifecycle |
| `compliance_kyc_liveness_checks` | Biometric liveness check results |
| `compliance_kyc_risk_assessments` | Risk scoring results with factor breakdown |
| `compliance_kyc_pep_screenings` | PEP/sanctions screening results |
| `compliance_kyc_watchlist_hits` | Individual watchlist match records |
| `compliance_kyc_audit_log` | Immutable KYC audit trail |

#### Verification Levels

| Level | Name | Max Deposit | Requirements | Use Cases |
|-------|------|------------|--------------|-----------|
| 0 | None | $0 | Email + phone (via @mcv/identity) | Browse only |
| 1 | Basic | $500/day, $2K/mo | Full name, DOB, address + database cross-ref | Low-risk US/CA activities |
| 2 | Standard | $5K/day, $20K/mo | Government photo ID + address proof | Default for BetEdge |
| 3 | Enhanced | $50K/day | Level 2 + liveness + source of funds + PEP screen | UK (UKGC), Malta (MGA) |
| 4 | Premium | Unlimited | Level 3 + source of wealth + manual review | >$100K annual volume |

#### Verification Flow

```
NONE → INITIATED → DOCUMENTS_SUBMITTED → [LIVENESS_PENDING] →
SCREENING_PENDING → IN_REVIEW → APPROVED / REJECTED / EXPIRED
                                    ↓ (doc expires)
                                 SUSPENDED → re-verify → APPROVED
```

---

### Responsible Gaming

**Path:** `packages/compliance/src/responsible-gaming/`

The Responsible Gaming module implements player protection controls mandated by gambling regulators worldwide. While primarily serving BetEdge, its spending limits and behavioral monitoring capabilities extend to all ventures with transactional activity.

#### Capabilities

| Capability | Description |
|-----------|-------------|
| **Deposit Limits** | Daily, weekly, monthly caps on deposit amounts with immediate enforcement and cooling-off periods for increases |
| **Loss Limits** | Maximum net loss over periods (daily/weekly/monthly/yearly), blocking wagers when limits would be exceeded |
| **Wager Limits** | Per-bet maximums and aggregate wager caps with real-time enforcement |
| **Time Limits** | Session duration and daily playtime caps with forced session termination |
| **Self-Exclusion** | Temporary (1 month – 5 years) and permanent self-exclusion with GamStop/national register integration |
| **Cooling-Off Periods** | Mandatory waiting periods before limit increases (24–72h) or removals (7 days) take effect |
| **Reality Checks** | Configurable session pop-ups showing elapsed time, net position, and responsible gaming resources |
| **Behavioral Risk AI** | OpenRouter-powered analysis of player behavior: loss chasing, erratic betting, time creep, escalating deposits |
| **Interventions** | Automated and manual intervention triggers: pop-up warnings, forced breaks, contact outreach, help referrals |
| **Player Activity Summaries** | Aggregated activity data for regulatory reporting and player self-awareness |

#### Database Tables (15)

| Table | Purpose |
|-------|---------|
| `compliance_player_protection_profiles` | Per-user/per-venture protection profile |
| `compliance_deposit_limits` | Deposit limit configurations and usage |
| `compliance_loss_limits` | Loss limit configurations and tracking |
| `compliance_wager_limits` | Wager limit configurations |
| `compliance_time_limits` | Session/daily time limits |
| `compliance_self_exclusions` | Self-exclusion records |
| `compliance_cooling_off_periods` | Cooling-off period tracking |
| `compliance_reality_checks` | Reality check configurations |
| `compliance_reality_check_logs` | Reality check interaction logs |
| `compliance_behavioral_risk_scores` | AI-generated behavioral risk scores |
| `compliance_behavioral_indicators` | Detected risk indicators |
| `compliance_interventions` | System/manual intervention records |
| `compliance_intervention_actions` | Intervention action log |
| `compliance_player_activity_summaries` | Aggregated player activity data |
| `compliance_responsible_gaming_audit_log` | Immutable RG audit trail |

#### Limit Change Rules (Player Protection)

```
Decrease a limit   → Effective IMMEDIATELY
Increase a limit   → Effective after COOLING-OFF (24h–72h)
Remove a limit     → Effective after COOLING-OFF (7 days)
Set self-exclusion → Effective IMMEDIATELY, irrevocable (permanent)
```

#### Behavioral Risk Indicators

| Indicator | Description | Risk Weight |
|-----------|-------------|-------------|
| Loss chasing | Increasing bet sizes after consecutive losses | High |
| Erratic betting | Sudden changes in bet patterns (amount, frequency, sport) | Medium |
| Time creep | Progressively longer sessions over time | Medium |
| Escalating deposits | Increasing deposit frequency or amounts | High |
| Late-night activity | Concentrated gambling during 1:00 AM – 5:00 AM | Low |
| Limit-boundary testing | Repeatedly hitting deposit or loss limits | High |
| Rapid session restart | Ending and immediately restarting sessions | Medium |

---

## Architecture Position

`@mcv/compliance` sits at **Tier 5 (Domain Layer)** in the MCV architecture, consuming infrastructure services from Tiers 1–4 and providing compliance capabilities to venture applications.

```
┌─────────────────────────────────────────────────────────────────┐
│                    VENTURE APPLICATIONS                         │
│  BetEdge │ SerpSpace │ Full Gain │ MCV Studios │ Futurestate   │
│  ────────┼───────────┼──────────┼─────────────┼─────────────── │
│  Sports  │ SEO       │ Grant    │ Gaming      │ Real Estate   │
│  Betting │ Platform  │ Platform │ Studio      │ Platform      │
└────────────────────────────┬────────────────────────────────────┘
                             │ consume
┌────────────────────────────┴────────────────────────────────────┐
│                    TIER 6 — AGENTIC OS                          │
│           @mcv/agentic-os  │  NAOS Agent Framework              │
│           AI Orchestration │  Compliance Agents                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ orchestrates
┌────────────────────────────┴────────────────────────────────────┐
│ ╔══════════════════════════════════════════════════════════════╗ │
│ ║              TIER 5 — DOMAIN LAYER (MCV-ONLY)               ║ │
│ ║                                                              ║ │
│ ║  ┌──────────────────────────────────────────────────────┐    ║ │
│ ║  │              @mcv/compliance                         │    ║ │
│ ║  │                                                      │    ║ │
│ ║  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │    ║ │
│ ║  │  │   KYC    │ │   AML    │ │  Jurisd. │ │ Resp.  │ │    ║ │
│ ║  │  │          │ │          │ │          │ │ Gaming │ │    ║ │
│ ║  │  │ 8 tables │ │12 tables │ │10 tables │ │15 tbl  │ │    ║ │
│ ║  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │    ║ │
│ ║  └──────────────────────────────────────────────────────┘    ║ │
│ ║                                                              ║ │
│ ║  ┌───────────────────┐  ┌───────────────────┐               ║ │
│ ║  │ @mcv/engagement   │  │ @mcv/analytics     │  ...         ║ │
│ ║  └───────────────────┘  └───────────────────┘               ║ │
│ ╚══════════════════════════════════════════════════════════════╝ │
└────────────────────────────┬────────────────────────────────────┘
                             │ depends on
┌────────────────────────────┴────────────────────────────────────┐
│                    TIER 4 — SHARED DOMAINS                      │
│  @mcv/identity  │  @mcv/payments  │  @mcv/content               │
│  Auth, users,   │  Transactions,  │  CMS, media,                │
│  profiles       │  billing        │  assets                     │
└────────────────────────────┬────────────────────────────────────┘
                             │ depends on
┌────────────────────────────┴────────────────────────────────────┐
│                    TIER 3 — PLATFORM SERVICES                   │
│  @mcv/fabric    │  @mcv/connectors  │  @mcv/intelligence        │
│  Events, audit, │  External APIs,   │  AI inference,             │
│  notifications  │  payment gateways │  embeddings                │
└────────────────────────────┬────────────────────────────────────┘
                             │ depends on
┌────────────────────────────┴────────────────────────────────────┐
│                    TIER 2 — CORE INFRASTRUCTURE                 │
│  @mcv/kernel    │  @mcv/database    │  @mcv/auth                 │
│  Config, DI,    │  Drizzle, pools,  │  Supabase Auth,            │
│  errors, utils  │  migrations       │  JWT, sessions             │
└────────────────────────────┬────────────────────────────────────┘
                             │ depends on
┌────────────────────────────┴────────────────────────────────────┐
│                    TIER 1 — FOUNDATION                          │
│  @mcv/types  │  @mcv/config  │  @mcv/errors  │  @mcv/utils     │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Interaction Rules

1. `@mcv/compliance` **MAY** import from Tier 1–4 packages
2. `@mcv/compliance` **MAY NOT** import from other Tier 5 packages directly (use events)
3. Venture applications **MAY** import `@mcv/compliance` exports
4. `@mcv/agentic-os` **MAY** orchestrate compliance services via NAOS agents
5. Cross-domain communication uses Redpanda/Kafka events via `@mcv/fabric`

---

## Key Interfaces & Types

### Core Service Interfaces

```typescript
// ─── KYC Service ─────────────────────────────────────────────────

export interface IKycService {
  // Verification Flow
  initiateVerification(input: InitiateKycInput): Promise<KycVerification>;
  getRequiredLevel(userId: string, ventureId: string, jurisdiction: string): Promise<KycVerificationLevel>;
  getCurrentLevel(userId: string, ventureId: string): Promise<KycVerificationLevel>;

  // Document Verification
  uploadDocument(input: DocumentVerificationInput): Promise<KycDocument>;
  verifyDocument(documentId: string): Promise<DocumentVerificationResult>;
  rejectDocument(documentId: string, reason: string, reviewedBy: string): Promise<KycDocument>;

  // Liveness Check
  initiateLivenessCheck(input: LivenessCheckInput): Promise<KycLivenessCheck>;
  processLivenessResult(checkId: string, result: ProviderLivenessResult): Promise<KycLivenessCheck>;

  // PEP/Sanctions Screening
  screenPepSanctions(kycProfileId: string, options?: ScreeningOptions): Promise<KycPepScreening>;
  reviewWatchlistHit(hitId: string, disposition: WatchlistDisposition, notes: string, reviewedBy: string): Promise<KycWatchlistHit>;

  // Risk Assessment
  assessRisk(kycProfileId: string): Promise<KycRiskAssessment>;
  getProfile(userId: string, ventureId: string): Promise<KycProfile | null>;

  // Ongoing Monitoring
  checkDocumentExpiry(ventureId: string): Promise<ExpiryCheckResult[]>;
  triggerPeriodicRescreen(ventureId: string): Promise<RescreenResult>;
}

// ─── AML Service ─────────────────────────────────────────────────

export interface IAmlService {
  // Transaction Screening
  screenTransaction(input: TransactionScreeningInput): Promise<TransactionScreeningResult>;
  screenBatch(input: BulkScreeningInput): Promise<BulkScreeningResult>;

  // Alert Management
  getAlerts(ventureId: string, filters?: AlertFilters): Promise<PaginatedResult<AmlAlert>>;
  assignAlert(alertId: string, assigneeId: string): Promise<AmlAlert>;
  escalateAlert(alertId: string, escalateTo: string, reason: string): Promise<AmlAlert>;
  disposeAlert(alertId: string, input: AlertReviewInput): Promise<AmlAlert>;

  // Case Management
  openCase(alertIds: string[], title: string, description?: string): Promise<AmlCase>;
  resolveCase(caseId: string, resolution: string, resolvedBy: string): Promise<AmlCase>;

  // Regulatory Filing
  draftSar(input: SarFilingInput): Promise<AmlSarFiling>;
  submitSar(sarId: string, filedBy: string): Promise<AmlSarFiling>;
  draftCtr(input: CtrFilingInput): Promise<AmlCtrFiling>;
  submitCtr(ctrId: string, filedBy: string): Promise<AmlCtrFiling>;

  // Rule Management
  createRule(input: RuleConfigInput): Promise<AmlRule>;
  updateRule(ruleId: string, input: Partial<RuleConfigInput>): Promise<AmlRule>;
  toggleRule(ruleId: string, isActive: boolean): Promise<AmlRule>;

  // Risk Scoring
  calculateRiskScore(userId: string, ventureId: string): Promise<AmlRiskScore>;
  getRiskScore(userId: string, ventureId: string): Promise<AmlRiskScore | null>;

  // Pattern Detection
  runPatternAnalysis(userId: string, ventureId: string, lookback?: string): Promise<AmlPattern[]>;

  // Sanctions
  screenSanctions(userId: string, transactionRecordId?: string): Promise<AmlSanctionsScreening>;
  updateWatchlists(): Promise<WatchlistUpdateResult>;
}

// ─── Jurisdiction Service ────────────────────────────────────────

export interface IJurisdictionService {
  // Jurisdiction Checks
  checkJurisdiction(input: JurisdictionCheckInput): Promise<JurisdictionCheckResult>;
  getVentureJurisdictions(ventureId: string): Promise<JurisdictionVentureStatus[]>;
  getJurisdictionRequirements(code: string, ventureType?: string): Promise<JurisdictionRequirement[]>;
  isOperational(ventureId: string, jurisdictionCode: string): Promise<boolean>;

  // Geo-Blocking
  evaluateGeoAccess(ventureId: string, ipAddress: string, gpsCoords?: GpsCoordinates): Promise<GeoAccessResult>;
  configureGeoRule(input: GeoBlockInput): Promise<JurisdictionGeoRule>;
  detectVpn(ipAddress: string): Promise<VpnDetectionResult>;

  // Licensing
  applyForLicense(input: LicenseApplicationInput): Promise<JurisdictionLicense>;
  renewLicense(licenseId: string): Promise<JurisdictionLicense>;
  getExpiringLicenses(daysAhead: number): Promise<JurisdictionLicense[]>;

  // Age Verification
  verifyAge(input: AgeVerificationInput): Promise<AgeVerificationResult>;
  getAgeRequirement(jurisdictionCode: string, ventureType: string): Promise<AgeRequirement>;

  // Tax Rules
  getTaxRules(jurisdictionCode: string, ventureType?: string): Promise<JurisdictionTaxRule[]>;
  calculateWithholding(amount: number, jurisdictionCode: string, taxType: string): Promise<WithholdingResult>;

  // Data Privacy
  getDataRules(jurisdictionCode: string): Promise<JurisdictionDataRule[]>;
  checkDataResidency(dataCategory: string, storageRegion: string, jurisdictionCode: string): Promise<DataResidencyResult>;

  // Compliance Calendar
  getCalendar(ventureId: string, dateRange: DateRange): Promise<ComplianceCalendarEvent[]>;
  getUpcomingDeadlines(ventureId: string, daysAhead: number): Promise<ComplianceCalendarEvent[]>;
}

// ─── Responsible Gaming Service ──────────────────────────────────

export interface IResponsibleGamingService {
  // Limits
  setLimit(input: SetLimitInput): Promise<PlayerLimit>;
  checkLimits(userId: string, ventureId: string, action: LimitCheckAction): Promise<LimitCheckResult>;
  getPlayerLimits(userId: string, ventureId: string): Promise<PlayerLimits>;

  // Self-Exclusion
  initiateSelfExclusion(input: SelfExclusionInput): Promise<SelfExclusion>;
  getSelfExclusionStatus(userId: string, ventureId: string): Promise<SelfExclusionStatus>;

  // Reality Checks
  configureRealityCheck(input: RealityCheckInput): Promise<RealityCheckConfig>;
  logRealityCheckResponse(checkId: string, response: RealityCheckResponse): Promise<void>;

  // Cooling Off
  initiateCoolingOff(input: CoolingOffInput): Promise<CoolingOffPeriod>;
  getCoolingOffStatus(userId: string, ventureId: string): Promise<CoolingOffStatus>;

  // Behavioral Risk
  assessBehavioralRisk(input: BehavioralAssessmentInput): Promise<BehavioralRiskScore>;
  getBehavioralIndicators(userId: string, ventureId: string): Promise<BehavioralIndicator[]>;

  // Interventions
  triggerIntervention(input: InterventionInput): Promise<Intervention>;
  getInterventionHistory(userId: string, ventureId: string): Promise<Intervention[]>;

  // Player Protection Profile
  getProtectionProfile(userId: string, ventureId: string): Promise<PlayerProtectionProfile>;
  getPlayerActivitySummary(userId: string, ventureId: string, period: string): Promise<PlayerActivitySummary>;
}
```

### Core Type Definitions

```typescript
// ─── KYC Types ───────────────────────────────────────────────────

export type KycVerificationLevel = 'none' | 'basic' | 'standard' | 'enhanced' | 'premium';
export type KycStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired' | 'suspended';
export type KycDocumentType = 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' |
  'bank_statement' | 'tax_return' | 'proof_of_address' | 'selfie' | 'source_of_funds_doc';
export type KycDocumentStatus = 'uploaded' | 'processing' | 'verified' | 'rejected' | 'expired';

export interface KycAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2
}

export interface RiskFactor {
  factor: string;
  score: number;
  weight: number;
  details: string;
}

// ─── AML Types ───────────────────────────────────────────────────

export type AmlAlertStatus = 'new' | 'investigating' | 'escalated' | 'filed' | 'dismissed' | 'false_positive';
export type AmlCasePriority = 'low' | 'medium' | 'high' | 'critical';
export type AmlRuleType = 'threshold' | 'velocity' | 'pattern' | 'network' | 'geographic' | 'behavioral';
export type AmlFilingStatus = 'draft' | 'pending_review' | 'submitted' | 'acknowledged' | 'rejected';

export interface TransactionScreeningResult {
  transactionRecordId: string;
  screeningResult: 'cleared' | 'flagged' | 'blocked';
  riskScore: number;
  rulesTriggered: string[];
  alertIds: string[];
  sanctionsResult: 'clear' | 'potential_match' | 'confirmed_match';
  processingTimeMs: number;
}

// ─── Jurisdiction Types ──────────────────────────────────────────

export type JurisdictionStatus = 'active' | 'pending' | 'suspended' | 'prohibited' | 'under_review';
export type LicenseStatus = 'applied' | 'pending' | 'granted' | 'renewed' | 'suspended' | 'revoked' | 'expired';
export type GeoAction = 'allow' | 'block' | 'restrict' | 'age_gate' | 'vpn_block';

export interface GeoAccessResult {
  allowed: boolean;
  action: GeoAction;
  jurisdiction: string;
  vpnDetected: boolean;
  restrictions?: string[];
  blockMessage?: string;
  requiresAgeVerification: boolean;
}

// ─── Responsible Gaming Types ────────────────────────────────────

export type LimitType = 'deposit' | 'loss' | 'wager' | 'time' | 'session';
export type LimitPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type SelfExclusionType = 'temporary' | 'permanent' | 'gamstop' | 'national_register';
export type InterventionType = 'automated' | 'manual' | 'regulatory' | 'system';
export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';

export interface LimitCheckResult {
  allowed: boolean;
  limitType: LimitType;
  period: LimitPeriod;
  limitAmount: number;
  currentUsage: number;
  remainingAmount: number;
  currency: string;
  resetsAt: Date;
}
```

---

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `COMPLIANCE_DATABASE_URL` | PostgreSQL connection string for compliance schema | — | Yes |
| `COMPLIANCE_REDIS_URL` | Redis connection for rule caching and rate limiting | — | Yes |
| `COMPLIANCE_ENCRYPTION_KEY` | AES-256 key for PII field encryption | — | Yes |
| `KYC_PROVIDER` | Identity verification provider | `onfido` | No |
| `KYC_PROVIDER_API_KEY` | API key for KYC provider (Onfido/Jumio/Veriff) | — | Yes |
| `KYC_LIVENESS_PROVIDER` | Liveness check provider | `onfido` | No |
| `KYC_LIVENESS_THRESHOLD` | Minimum liveness score (0.0–1.0) | `0.80` | No |
| `KYC_FACE_MATCH_THRESHOLD` | Minimum face match score (0.0–1.0) | `0.85` | No |
| `KYC_PEP_PROVIDER` | PEP/sanctions screening provider | `comply_advantage` | No |
| `KYC_PEP_API_KEY` | API key for PEP provider | — | Yes |
| `KYC_RISK_HIGH_THRESHOLD` | Risk score threshold for "high" category | `600` | No |
| `KYC_RESCREEN_INTERVAL_DAYS` | Days between PEP rescreening (standard) | `90` | No |
| `KYC_RESCREEN_HIGH_RISK_DAYS` | Days between PEP rescreening (high-risk) | `30` | No |
| `AML_CTR_THRESHOLD_USD` | CTR reporting threshold in USD | `10000` | No |
| `AML_ENHANCED_MONITORING_USD` | Enhanced monitoring threshold in USD | `3000` | No |
| `AML_SAR_DEADLINE_DAYS` | SAR filing deadline (calendar days) | `30` | No |
| `AML_CTR_DEADLINE_DAYS` | CTR filing deadline (business days) | `15` | No |
| `AML_WATCHLIST_UPDATE_CRON` | Cron schedule for watchlist updates | `0 2 * * *` | No |
| `AML_RISK_RECALC_CRON` | Cron schedule for daily risk recalculation | `0 4 * * *` | No |
| `GEOIP_PROVIDER` | GeoIP provider | `maxmind` | No |
| `GEOIP_LICENSE_KEY` | MaxMind GeoIP license key | — | Yes |
| `GEOIP_DATABASE_PATH` | Path to local GeoIP database file | — | No |
| `VPN_DETECTION_ENABLED` | Enable VPN/proxy detection | `true` | No |
| `RESPONSIBLE_GAMING_AI_MODEL` | OpenRouter model for behavioral analysis | `anthropic/claude-3.5-sonnet` | No |
| `GAMSTOP_API_URL` | GamStop self-exclusion register API URL | — | No |
| `GAMSTOP_API_KEY` | GamStop API key | — | No |
| `COMPLIANCE_LOG_LEVEL` | Logging level for compliance operations | `info` | No |
| `COMPLIANCE_AUDIT_RETENTION_YEARS` | Years to retain audit log data | `7` | No |

### Configuration Schema (Zod)

```typescript
import { z } from 'zod';

export const complianceConfigSchema = z.object({
  database: z.object({
    url: z.string().url(),
    poolMin: z.number().min(1).default(5),
    poolMax: z.number().min(5).default(20),
    statementTimeout: z.number().default(30000),
  }),

  redis: z.object({
    url: z.string().url(),
    keyPrefix: z.string().default('compliance:'),
    cacheTtl: z.number().default(300), // seconds
  }),

  encryption: z.object({
    key: z.string().min(32),
    algorithm: z.enum(['aes-256-gcm', 'aes-256-cbc']).default('aes-256-gcm'),
  }),

  kyc: z.object({
    provider: z.enum(['onfido', 'jumio', 'veriff', 'manual']).default('onfido'),
    providerApiKey: z.string(),
    livenessProvider: z.enum(['onfido', 'jumio', 'facetec']).default('onfido'),
    livenessThreshold: z.number().min(0).max(1).default(0.80),
    faceMatchThreshold: z.number().min(0).max(1).default(0.85),
    pepProvider: z.enum(['comply_advantage', 'dow_jones', 'refinitiv']).default('comply_advantage'),
    pepApiKey: z.string(),
    riskHighThreshold: z.number().min(0).max(1000).default(600),
    rescreenIntervalDays: z.number().min(1).default(90),
    rescreenHighRiskDays: z.number().min(1).default(30),
    documentExpiryWarningDays: z.array(z.number()).default([30, 14, 7]),
    verificationAttemptTtlHours: z.number().default(24),
  }),

  aml: z.object({
    ctrThresholdUsd: z.number().default(10000),
    enhancedMonitoringUsd: z.number().default(3000),
    sarDeadlineDays: z.number().default(30),
    ctrDeadlineDays: z.number().default(15),
    watchlistUpdateCron: z.string().default('0 2 * * *'),
    riskRecalcCron: z.string().default('0 4 * * *'),
    riskScoreDecayDays: z.number().default(180),
    maxAlertAgeDays: z.number().default(90),
    batchScreeningSize: z.number().default(1000),
  }),

  jurisdictions: z.object({
    geoipProvider: z.enum(['maxmind', 'ip2location']).default('maxmind'),
    geoipLicenseKey: z.string(),
    geoipDatabasePath: z.string().optional(),
    vpnDetectionEnabled: z.boolean().default(true),
    torDetectionEnabled: z.boolean().default(true),
    proxyDetectionEnabled: z.boolean().default(true),
    gpsIpMaxDistanceKm: z.number().default(50),
    licenseExpiryWarningDays: z.array(z.number()).default([90, 60, 30, 14, 7, 1]),
  }),

  responsibleGaming: z.object({
    aiModel: z.string().default('anthropic/claude-3.5-sonnet'),
    defaultRealityCheckMinutes: z.number().default(60),
    limitIncreaseCoolingOffHours: z.number().default(24),
    limitRemovalCoolingOffDays: z.number().default(7),
    gamstopApiUrl: z.string().url().optional(),
    gamstopApiKey: z.string().optional(),
    behavioralAnalysisIntervalHours: z.number().default(24),
    riskScoreThresholds: z.object({
      moderate: z.number().default(200),
      elevated: z.number().default(400),
      high: z.number().default(600),
      critical: z.number().default(800),
    }),
  }),

  audit: z.object({
    retentionYears: z.number().default(7),
    immutableTables: z.array(z.string()).default([
      'compliance_kyc_audit_log',
      'compliance_aml_audit_log',
      'compliance_responsible_gaming_audit_log',
    ]),
  }),
});

export type ComplianceConfig = z.infer<typeof complianceConfigSchema>;
```

---

## Dependencies

### Upstream Dependencies (consumed by @mcv/compliance)

| Package | Tier | Relationship | What Is Consumed |
|---------|------|-------------|-----------------|
| **@mcv/kernel** | 2 | Core infrastructure | Configuration management, dependency injection container, error base classes, logging, utility functions |
| **@mcv/identity** | 4 | User data source | User profiles, authentication state, session data, email/phone verification status; compliance reads user data to create KYC profiles |
| **@mcv/fabric** | 3 | Event & notification bus | Publishes compliance events to Redpanda/Kafka topics; consumes transaction events from payment and engagement domains; sends compliance notifications |
| **@mcv/database** | 2 | Database access | Drizzle ORM instance, connection pool, migration utilities; all 45 compliance tables are defined via Drizzle schemas |
| **@mcv/auth** | 2 | Authentication | JWT validation, session tokens, role-based access control for compliance admin endpoints |
| **@mcv/connectors** | 3 | External APIs | Payment gateway data for AML monitoring, Solana/EDGE token transaction data, external verification provider adapters |
| **@mcv/types** | 1 | Shared types | Base types, common interfaces, error codes used across the platform |
| **@mcv/config** | 1 | Configuration | Environment variable loading, config validation |
| **@mcv/errors** | 1 | Error handling | Standardized error classes and error codes |

### Downstream Dependencies (consume @mcv/compliance)

| Package / App | Tier | Relationship | What Is Consumed |
|--------------|------|-------------|-----------------|
| **@mcv/agentic-os** | 6 | AI orchestration | NAOS agents invoke compliance services for automated risk analysis, alert triage, and regulatory report generation |
| **BetEdge** | App | Sports betting | Full compliance stack: KYC verification flows, AML transaction monitoring, jurisdiction enforcement, responsible gaming controls |
| **SerpSpace** | App | SEO platform | KYC (Level 1), AML (payment monitoring), jurisdiction (data residency, GDPR) |
| **Full Gain** | App | Grants platform | KYC (Level 1–2), AML (grant disbursement monitoring), jurisdiction (financial regulations) |
| **MCV Studios** | App | Gaming studio | KYC, AML, jurisdiction, and partial responsible gaming (in-game purchase limits) |
| **Futurestate** | App | Real estate | KYC (Level 2–3), AML (real estate transaction monitoring), jurisdiction (property regulations) |
| **All Ventures** | App | Common | Age verification middleware, geo-blocking middleware, data residency checks |

### External Service Dependencies

| Service | Purpose | Module |
|---------|---------|--------|
| **Onfido** | Document verification, liveness checks | KYC |
| **Jumio** | Document verification (fallback) | KYC |
| **ComplyAdvantage** | PEP/sanctions screening, adverse media | KYC, AML |
| **Dow Jones Risk & Compliance** | Watchlist data, risk intelligence | KYC, AML |
| **MaxMind GeoIP** | IP geolocation database | Jurisdictions |
| **GamStop** | UK self-exclusion register | Responsible Gaming |
| **OFAC SDN** | US sanctions list | AML |
| **EU Sanctions List** | European sanctions list | AML |
| **UN Consolidated List** | International sanctions list | AML |
| **OpenRouter** | AI inference for behavioral risk analysis | Responsible Gaming |

---

## Multi-Tenant Design

### Supabase Row-Level Security (RLS)

All 45 compliance tables implement **strict venture-level isolation** via Supabase RLS policies. Every table that contains venture-specific data includes a `venture_id` column and corresponding RLS policy.

#### RLS Policy Pattern

```sql
-- Example: KYC Profiles RLS Policy
ALTER TABLE compliance_kyc_profiles ENABLE ROW LEVEL SECURITY;

-- Venture isolation: users can only see/modify data from their own venture
CREATE POLICY "venture_isolation" ON compliance_kyc_profiles
  USING (venture_id = current_setting('app.current_venture_id')::uuid)
  WITH CHECK (venture_id = current_setting('app.current_venture_id')::uuid);

-- Compliance admin: can access all ventures (for cross-venture compliance)
CREATE POLICY "compliance_admin_access" ON compliance_kyc_profiles
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('compliance_admin', 'platform_admin')
    )
  );

-- Service role: bypass RLS for server-side operations
CREATE POLICY "service_role_bypass" ON compliance_kyc_profiles
  USING (auth.role() = 'service_role');
```

#### Venture Isolation Rules

| Rule | Description |
|------|-------------|
| **Data Partitioning** | Every query is automatically scoped to the requesting venture's data |
| **Cross-Venture Queries** | Only `compliance_admin` and `platform_admin` roles can access data across ventures |
| **Global Rules** | AML rules and jurisdiction definitions with `venture_id = NULL` apply to all ventures |
| **Audit Trail Isolation** | Audit logs are venture-scoped but accessible to compliance admins for cross-venture investigation |
| **Service Role** | Server-side operations (cron jobs, event handlers) use the Supabase service role to bypass RLS |

#### Multi-Tenant Data Flow

```
Venture Request (BetEdge)
        │
        ▼
┌─────────────────────┐
│  Auth Middleware     │
│  Set venture_id in  │
│  PostgreSQL session │
│  app.current_venture│
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  @mcv/compliance    │
│  Service methods    │
│  (no venture_id     │
│   filtering needed  │
│   — RLS handles it) │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  PostgreSQL + RLS   │
│  Automatically      │
│  filters to         │
│  BetEdge data only  │
└─────────────────────┘
```

---

## Security Considerations

### Data Protection

| Measure | Description |
|---------|-------------|
| **PII Encryption** | All personally identifiable information (names, DOB, document numbers, SSN, phone numbers) is encrypted at the application layer using AES-256-GCM before database storage |
| **Document Storage** | Uploaded identity documents are stored in encrypted Supabase Storage buckets with signed URL access (15-minute expiry) |
| **Audit Immutability** | Audit log tables (`compliance_*_audit_log`) have no UPDATE or DELETE policies — records are append-only and retained for 7+ years |
| **Data Masking** | API responses mask sensitive fields (e.g., document numbers show only last 4 digits, `****1234`) |
| **Key Rotation** | Encryption keys support rotation with re-encryption migration for existing data |

### Access Control

| Role | Permissions |
|------|------------|
| `platform_admin` | Full access to all compliance data across all ventures |
| `compliance_admin` | Full access to compliance data; can review KYC, manage AML cases, configure rules |
| `compliance_officer` | Can review KYC verifications, manage AML alerts/cases, file SARs/CTRs |
| `compliance_analyst` | Read-only access to compliance dashboards, alerts, and reports |
| `venture_admin` | Access to own venture's compliance data only |
| `user` | Access to own KYC profile, limits, self-exclusion status only |

### Regulatory Compliance

| Framework | Implementation |
|-----------|---------------|
| **GDPR** | Right to erasure (anonymization — audit logs retained), data portability, consent management, 72-hour breach notification |
| **CCPA** | Data sale opt-out, consumer data access requests, deletion requests (anonymization) |
| **PCI-DSS** | Payment card data never stored in compliance tables — references only |
| **SOC 2** | Comprehensive audit logging, access controls, encryption, monitoring |

---

## Performance Requirements

### Latency Targets

| Operation | Target | P99 Target | Notes |
|-----------|--------|------------|-------|
| Transaction screening (AML) | < 50ms | < 100ms | Synchronous — blocks transaction |
| KYC profile lookup | < 20ms | < 50ms | Cached in Redis |
| Geo-access evaluation | < 30ms | < 75ms | GeoIP database is local |
| Limit check (responsible gaming) | < 15ms | < 40ms | Redis-cached limits |
| Risk score calculation | < 200ms | < 500ms | Complex aggregation |
| PEP/sanctions screening | < 2s | < 5s | External API call |
| Document verification | < 30s | < 60s | External API + OCR |
| Behavioral risk assessment | < 5s | < 10s | AI inference via OpenRouter |

### Throughput Targets

| Metric | Target |
|--------|--------|
| Transactions screened per second | 1,000 |
| Concurrent KYC verifications | 100 |
| AML alerts processed per hour | 10,000 |
| Geo-access evaluations per second | 5,000 |
| Limit checks per second | 10,000 |

### Caching Strategy

| Data | Cache | TTL | Invalidation |
|------|-------|-----|-------------|
| Jurisdiction rules | Redis | 5 min | On rule update event |
| Geo-blocking rules | Redis | 5 min | On rule update event |
| AML detection rules | Redis | 5 min | On rule update event |
| KYC profiles (level/status) | Redis | 1 min | On verification completion |
| Player limits | Redis | 30 sec | On limit change/usage update |
| GeoIP database | Local file | 24h | Weekly MaxMind update |
| Tax rules | Redis | 1 hour | On rule update event |
| Risk scores | Redis | 5 min | On recalculation |

---

## Deployment & Operations

### Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Vercel Edge Network                      │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ Geo-Blocking      │  │ Age Gate         │              │
│  │ Middleware         │  │ Middleware       │              │
│  │ (Edge Function)   │  │ (Edge Function)  │              │
│  └──────────┬───────┘  └──────────┬───────┘              │
└─────────────┼──────────────────────┼─────────────────────┘
              │                      │
              ▼                      ▼
┌──────────────────────────────────────────────────────────┐
│                  Next.js 15 Server                        │
│  ┌──────────────────────────────────────────────────┐    │
│  │  @mcv/compliance API Routes                       │    │
│  │  /api/compliance/kyc/*                            │    │
│  │  /api/compliance/aml/*                            │    │
│  │  /api/compliance/jurisdictions/*                   │    │
│  │  /api/compliance/responsible-gaming/*              │    │
│  └──────────────────────┬───────────────────────────┘    │
└─────────────────────────┼────────────────────────────────┘
                          │
          ┌───────────────┼───────────────────┐
          ▼               ▼                   ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│  Supabase    │ │  Redis       │ │  Redpanda/Kafka      │
│  PostgreSQL  │ │  (Upstash)   │ │  Event Streams       │
│  + RLS       │ │  Cache +     │ │  compliance.*        │
│  45 tables   │ │  Rate Limit  │ │  topics              │
└──────────────┘ └──────────────┘ └──────────────────────┘
```

### Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Watchlist Import | `0 2 * * *` | Import updated OFAC, EU, UN sanctions lists |
| Risk Recalculation | `0 4 * * *` | Recalculate AML risk scores for all active users |
| PEP Rescreening | `0 6 * * *` | Rescreen high-risk profiles (30-day cadence) |
| Document Expiry Check | `0 8 * * *` | Check for expiring documents and send notifications |
| License Expiry Check | `0 9 * * *` | Check for expiring licenses and send notifications |
| Compliance Calendar | `0 7 * * *` | Generate reminders for upcoming regulatory deadlines |
| Behavioral Analysis | `0 */4 * * *` | Run AI behavioral risk analysis on active players |
| Limit Period Reset | `0 0 * * *` | Reset daily limit usage counters |
| Reality Check Audit | `0 12 * * MON` | Weekly audit of reality check engagement rates |
| Overdue SAR Check | `0 10 * * *` | Escalate overdue SAR filings |

### Monitoring & Alerting

| Metric | Alert Threshold | Severity |
|--------|----------------|----------|
| Transaction screening latency P99 | > 100ms | Warning |
| Transaction screening latency P99 | > 500ms | Critical |
| Transaction screening error rate | > 0.1% | Critical |
| AML alert backlog (unassigned > 24h) | > 50 | Warning |
| AML alert backlog (unassigned > 48h) | > 10 | Critical |
| SAR filing approaching deadline | < 7 days | Warning |
| SAR filing overdue | Past due | Critical |
| License expiring | < 30 days | Warning |
| License expired | Past due | Critical |
| KYC verification failure rate | > 30% | Warning |
| PEP screening provider downtime | > 5 min | Critical |
| GeoIP database staleness | > 48h | Warning |
| Behavioral risk score > critical | Any user | Warning |
| Self-exclusion attempted bypass | Any | Critical |

### Database Maintenance

| Task | Frequency | Description |
|------|-----------|-------------|
| Index analysis | Weekly | Review and optimize query performance indexes |
| Vacuum/analyze | Daily | PostgreSQL maintenance for compliance tables |
| Partition rotation | Monthly | Archive old transaction records and audit logs |
| Backup verification | Daily | Verify compliance data backups are intact and restorable |
| Encryption key audit | Quarterly | Audit encryption key usage and rotation schedule |
| Data retention review | Annually | Review and enforce data retention policies per jurisdiction |

### Incident Response

| Scenario | Response |
|----------|----------|
| **Sanctions match detected** | Immediately block transaction, create priority-critical alert, notify compliance officer via SMS/call |
| **Data breach suspected** | Initiate 72-hour GDPR notification countdown, lock affected accounts, engage incident response team |
| **Regulatory audit** | Generate compliance report package (audit logs, filings, verification records) for requested period |
| **License suspension** | Immediately suspend venture operations in affected jurisdiction, notify users, redirect traffic |
| **Self-exclusion bypass attempt** | Block access, log attempt, notify responsible gaming team, file regulatory report if required |

---

*@mcv/compliance — Regulatory Compliance Domain*
