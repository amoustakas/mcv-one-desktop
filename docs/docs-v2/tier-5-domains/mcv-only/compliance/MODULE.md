# @mcv/compliance — Compliance Domain Module

**Parent Package:** @mcv/compliance  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** MCV-ONLY  
**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Purpose

The `compliance` module provides a comprehensive regulatory compliance framework for all ventures operating within the MCV ecosystem. It implements Know Your Customer (KYC) identity verification with tiered levels, Anti-Money Laundering (AML) transaction monitoring with suspicious activity detection, multi-jurisdiction regulatory management with geo-blocking and licensing, and responsible gaming controls with self-exclusion, limits, and behavioral risk detection.

**This is the single source of truth for all compliance operations, regulatory obligations, and risk assessments across every venture.**

Every user who registers, every transaction that flows through the system, every jurisdiction where a venture operates, and every gaming session a player initiates — all pass through the compliance layer. KYC verifies identities before access is granted. AML monitors every financial movement for suspicious patterns. Jurisdictions enforces the patchwork of regional regulations. Responsible Gaming protects vulnerable users from harm.

The module is classified as **MCV-ONLY** because it contains proprietary compliance logic, regulatory interpretations, and risk models specific to the MCV venture portfolio. It is **mission-critical** for:

- **BetEdge** — Sports betting AI platform requiring gambling compliance across 30+ jurisdictions, responsible gaming enforcement, and AML monitoring of wagering activity
- **Commerce ventures** (SerpSpace, Full Gain, MCV Studios, Futurestate) — Payment compliance (PCI-DSS), sanctions screening, and data privacy (GDPR/CCPA)
- **All ventures** — Identity verification, age verification, data protection, and regulatory reporting
- **EDGE Token / Solana integration** — MiCA (Markets in Crypto-Assets) compliance for crypto operations

### Regulatory Frameworks Covered

| Framework | Scope | Ventures Affected |
|-----------|-------|-------------------|
| **GDPR** | EU data protection, right to erasure, consent management | All ventures with EU users |
| **CCPA/CPRA** | California consumer privacy, data sale opt-out | All ventures with CA users |
| **MiCA** | EU crypto-asset regulation, stablecoin rules | EDGE token operations |
| **PCI-DSS** | Payment card data security | All ventures processing payments |
| **SOC 2** | Security, availability, processing integrity, confidentiality, privacy | Platform-wide |
| **UKGC** | UK Gambling Commission requirements | BetEdge (UK market) |
| **MGA** | Malta Gaming Authority licensing | BetEdge (EU market) |
| **State Gaming** | US state-by-state gambling regulations | BetEdge (US markets) |
| **FINTRAC** | Canadian financial transaction reporting | All ventures (Canada) |
| **FinCEN** | US financial crimes enforcement | All ventures (US) |
| **5AMLD/6AMLD** | EU Anti-Money Laundering Directives | All ventures (EU) |
| **FATF** | Financial Action Task Force recommendations | Global operations |

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// KYC — Know Your Customer
// ═══════════════════════════════════════════════════════════════════════════════

// Core services
export {
  kycService,                          // KYC verification orchestration
} from './kyc/service';

export type {
  InitiateKycInput,                    // Start a KYC verification flow
  DocumentVerificationInput,           // Submit identity document
  LivenessCheckInput,                  // Initiate liveness/selfie check
  ManualReviewInput,                   // Submit manual review decision
  KycSearchFilters,                    // Search/filter KYC records
} from './kyc/service';

// Schema exports
export {
  kycProfiles,                         // User KYC profiles table
  kycDocuments,                        // Uploaded identity documents
  kycVerifications,                    // Verification attempt records
  kycLivenessChecks,                   // Liveness/biometric checks
  kycRiskAssessments,                  // Risk scoring results
  kycPepScreenings,                    // PEP/sanctions screening results
  kycWatchlistHits,                    // Watchlist match records
  kycAuditLog,                         // KYC-specific audit trail
  kycVerificationLevelEnum,            // none | basic | standard | enhanced | premium
  kycStatusEnum,                       // pending | in_review | approved | rejected | expired | suspended
  kycDocumentTypeEnum,                 // passport | drivers_license | national_id | utility_bill | ...
  kycDocumentStatusEnum,               // uploaded | processing | verified | rejected | expired
} from './kyc/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// AML — Anti-Money Laundering
// ═══════════════════════════════════════════════════════════════════════════════

export {
  amlService,                          // AML monitoring & reporting
} from './aml/service';

export type {
  TransactionScreeningInput,           // Screen a single transaction
  BulkScreeningInput,                  // Batch transaction screening
  SarFilingInput,                      // Suspicious Activity Report filing
  CtrFilingInput,                      // Currency Transaction Report filing
  AlertReviewInput,                    // Review an AML alert
  RuleConfigInput,                     // Configure detection rules
} from './aml/service';

export {
  amlTransactionRecords,              // Monitored transaction records
  amlAlerts,                           // Generated AML alerts
  amlCases,                            // Investigation cases
  amlSarFilings,                       // Suspicious Activity Reports
  amlCtrFilings,                       // Currency Transaction Reports
  amlRules,                            // Detection rule configurations
  amlRiskScores,                       // Entity risk scores
  amlPatterns,                         // Detected behavioral patterns
  amlWatchlists,                       // External watchlist imports
  amlSanctionsScreenings,             // Sanctions screening results
  amlThresholdConfigs,                 // Reporting threshold configurations
  amlAuditLog,                         // AML-specific audit trail
  amlAlertStatusEnum,                  // new | investigating | escalated | filed | dismissed | false_positive
  amlCasePriorityEnum,                // low | medium | high | critical
  amlRuleTypeEnum,                     // threshold | velocity | pattern | network | geographic | behavioral
  amlFilingStatusEnum,                 // draft | pending_review | submitted | acknowledged | rejected
} from './aml/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// JURISDICTIONS — Multi-Jurisdiction Regulatory Framework
// ═══════════════════════════════════════════════════════════════════════════════

export {
  jurisdictionService,                 // Jurisdiction management & enforcement
} from './jurisdictions/service';

export type {
  JurisdictionCheckInput,             // Check user/venture jurisdiction compliance
  GeoBlockInput,                       // Configure geo-blocking rules
  LicenseApplicationInput,            // Submit license application
  AgeVerificationInput,               // Verify user age for jurisdiction
  ComplianceCalendarInput,            // Add compliance calendar event
} from './jurisdictions/service';

export {
  jurisdictions,                       // Jurisdiction definitions
  jurisdictionRequirements,           // Per-jurisdiction regulatory requirements
  jurisdictionLicenses,               // Operating licenses/permits
  jurisdictionGeoRules,               // Geo-blocking/geo-fencing rules
  jurisdictionAgeRules,               // Age verification requirements
  jurisdictionTaxRules,               // Tax withholding/reporting rules
  jurisdictionDataRules,              // Data residency/privacy rules
  jurisdictionVentureStatus,          // Per-venture jurisdiction status
  complianceCalendar,                  // Regulatory deadlines & renewals
  complianceFilings,                   // Regulatory filing records
  jurisdictionStatusEnum,             // active | pending | suspended | prohibited | under_review
  licenseStatusEnum,                   // applied | pending | granted | renewed | suspended | revoked | expired
  geoActionEnum,                       // allow | block | restrict | age_gate | vpn_block
} from './jurisdictions/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSIBLE GAMING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  responsibleGamingService,            // Responsible gaming controls
} from './responsible-gaming/service';

export type {
  SetLimitInput,                       // Set deposit/loss/time/wager limit
  SelfExclusionInput,                  // Initiate self-exclusion
  RealityCheckInput,                   // Configure reality check settings
  CoolingOffInput,                     // Initiate cooling-off period
  BehavioralAssessmentInput,          // Run behavioral risk assessment
  InterventionInput,                   // Trigger manual intervention
} from './responsible-gaming/service';

export {
  playerProtectionProfiles,            // Player protection profile
  depositLimits,                       // Deposit limit configurations
  lossLimits,                          // Loss limit configurations
  wagerLimits,                         // Wager limit configurations
  timeLimits,                          // Session time limits
  selfExclusions,                      // Self-exclusion records
  coolingOffPeriods,                   // Cooling-off periods
  realityChecks,                       // Reality check configurations
  realityCheckLogs,                    // Reality check interaction logs
  behavioralRiskScores,               // Player behavioral risk scores
  behavioralIndicators,               // Detected risk indicators
  interventions,                       // System/manual interventions
  interventionActions,                 // Intervention action log
  playerActivitySummaries,            // Aggregated player activity
  responsibleGamingAuditLog,          // RG-specific audit trail
  limitTypeEnum,                       // deposit | loss | wager | time | session
  limitPeriodEnum,                     // daily | weekly | monthly | yearly
  selfExclusionTypeEnum,              // temporary | permanent | gamstop | national_register
  interventionTypeEnum,               // automated | manual | regulatory | system
  riskLevelEnum,                       // low | moderate | elevated | high | critical
} from './responsible-gaming/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

// KYC hooks
export { useKycProfile } from './client/hooks/use-kyc-profile';
export { useKycVerification } from './client/hooks/use-kyc-verification';
export { useKycDocumentUpload } from './client/hooks/use-kyc-document-upload';
export { useKycLivenessCheck } from './client/hooks/use-kyc-liveness-check';

// AML hooks
export { useAmlAlerts } from './client/hooks/use-aml-alerts';
export { useAmlCases } from './client/hooks/use-aml-cases';
export { useAmlDashboard } from './client/hooks/use-aml-dashboard';
export { useAmlTransactionScreen } from './client/hooks/use-aml-transaction-screen';

// Jurisdiction hooks
export { useJurisdictionCheck } from './client/hooks/use-jurisdiction-check';
export { useJurisdictionLicenses } from './client/hooks/use-jurisdiction-licenses';
export { useComplianceCalendar } from './client/hooks/use-compliance-calendar';
export { useGeoBlock } from './client/hooks/use-geo-block';

// Responsible Gaming hooks
export { usePlayerLimits } from './client/hooks/use-player-limits';
export { useSelfExclusion } from './client/hooks/use-self-exclusion';
export { useRealityCheck } from './client/hooks/use-reality-check';
export { useResponsibleGamingDashboard } from './client/hooks/use-responsible-gaming-dashboard';
export { useBehavioralRisk } from './client/hooks/use-behavioral-risk';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

// KYC components
export { KycVerificationFlow } from './client/components/kyc-verification-flow';
export { KycDocumentUploader } from './client/components/kyc-document-uploader';
export { KycLivenessCapture } from './client/components/kyc-liveness-capture';
export { KycStatusBadge } from './client/components/kyc-status-badge';
export { KycAdminReviewPanel } from './client/components/kyc-admin-review-panel';

// AML components
export { AmlAlertDashboard } from './client/components/aml-alert-dashboard';
export { AmlCaseManager } from './client/components/aml-case-manager';
export { AmlTransactionTimeline } from './client/components/aml-transaction-timeline';
export { AmlSarForm } from './client/components/aml-sar-form';
export { AmlRuleEditor } from './client/components/aml-rule-editor';

// Jurisdiction components
export { JurisdictionMap } from './client/components/jurisdiction-map';
export { LicenseTracker } from './client/components/license-tracker';
export { GeoBlockConfigPanel } from './client/components/geo-block-config-panel';
export { ComplianceCalendarView } from './client/components/compliance-calendar-view';
export { AgeGateModal } from './client/components/age-gate-modal';

// Responsible Gaming components
export { LimitSettingsPanel } from './client/components/limit-settings-panel';
export { SelfExclusionFlow } from './client/components/self-exclusion-flow';
export { RealityCheckPopup } from './client/components/reality-check-popup';
export { CoolingOffNotice } from './client/components/cooling-off-notice';
export { ResponsibleGamingDashboard } from './client/components/responsible-gaming-dashboard';
export { BehavioralRiskIndicator } from './client/components/behavioral-risk-indicator';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  KYC_VERIFICATION_LEVELS,
  KYC_DOCUMENT_TYPES,
  KYC_EXPIRY_THRESHOLDS,
  AML_REPORTING_THRESHOLDS,
  AML_RULE_TEMPLATES,
  AML_RISK_FACTORS,
  JURISDICTION_REGISTRY,
  JURISDICTION_AGE_REQUIREMENTS,
  JURISDICTION_GAMBLING_REGULATORS,
  RESPONSIBLE_GAMING_DEFAULT_LIMITS,
  RESPONSIBLE_GAMING_RISK_THRESHOLDS,
  SELF_EXCLUSION_MINIMUM_PERIODS,
  REALITY_CHECK_INTERVALS,
  COMPLIANCE_ERROR_CODES,
  PEP_DATABASE_PROVIDERS,
  SANCTIONS_LIST_PROVIDERS,
  SUPPORTED_ID_COUNTRIES,
  DATA_RETENTION_PERIODS,
  REGULATORY_FILING_DEADLINES,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // KYC types
  KycVerificationLevel,
  KycStatus,
  KycDocumentType,
  KycDocumentStatus,
  KycRiskScore,
  PepScreeningResult,
  SanctionsHit,
  LivenessResult,
  VerificationResult,
  KycDecision,

  // AML types
  AmlAlertStatus,
  AmlCasePriority,
  AmlRuleType,
  AmlFilingStatus,
  TransactionRiskScore,
  SarReport,
  CtrReport,
  AmlPattern,
  DetectionRule,
  AlertDisposition,

  // Jurisdiction types
  JurisdictionStatus,
  LicenseStatus,
  GeoAction,
  JurisdictionRequirement,
  AgeVerificationMethod,
  TaxWithholdingConfig,
  DataResidencyRule,
  RegulatoryFiling,
  ComplianceDeadline,

  // Responsible Gaming types
  LimitType,
  LimitPeriod,
  SelfExclusionType,
  InterventionType,
  RiskLevel,
  BehavioralIndicator,
  PlayerRiskProfile,
  InterventionTrigger,
  SessionSummary,
  RealityCheckConfig,
  CoolingOffConfig,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/compliance — COMPLIANCE DOMAIN ARCHITECTURE                        │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                               ENTRY POINTS                                                 │  │
│  │                                                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │  API Routes  │  │  Cron Jobs   │  │  Webhooks    │  │ NAOS Agents  │  │  Middleware │  │  │
│  │  │ /api/comply  │  │  Monitoring  │  │ ID Providers │  │ Risk Analyst │  │  Auth Gate  │  │  │
│  │  │ /api/kyc     │  │  Screening   │  │ Watchlists   │  │ AML Officer  │  │  Geo Guard  │  │  │
│  │  │ /api/aml     │  │  Reporting   │  │ Regulators   │  │ Compliance   │  │  Age Gate   │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │  │
│  │         │                 │                  │                 │                 │          │  │
│  │         └─────────────────┴──────────────────┴─────────────────┴─────────────────┘          │  │
│  │                                      │                                                      │  │
│  └──────────────────────────────────────┼──────────────────────────────────────────────────────┘  │
│                                         │                                                        │
│  ┌──────────────────────────────────────▼──────────────────────────────────────────────────────┐  │
│  │                               SERVICE LAYER                                                 │  │
│  │                                                                                              │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                                          │  │
│  │  │         KYC          │  │         AML          │                                          │  │
│  │  │                      │  │                      │                                          │  │
│  │  │ • Identity verify    │  │ • Txn monitoring     │                                          │  │
│  │  │ • Document verify    │  │ • Threshold detect   │                                          │  │
│  │  │ • Liveness check     │  │ • Pattern analysis   │                                          │  │
│  │  │ • PEP screening      │  │ • SAR filing         │                                          │  │
│  │  │ • Sanctions screen   │  │ • CTR filing         │                                          │  │
│  │  │ • Risk scoring       │  │ • Alert management   │                                          │  │
│  │  │ • Tiered levels      │  │ • Case management    │                                          │  │
│  │  │ • Doc expiry track   │  │ • Sanctions screen   │                                          │  │
│  │  │ • Ongoing monitoring │  │ • Network analysis   │                                          │  │
│  │  └──────────┬───────────┘  └──────────┬───────────┘                                          │  │
│  │             │                          │                                                      │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                                          │  │
│  │  │   JURISDICTIONS     │  │ RESPONSIBLE GAMING   │                                          │  │
│  │  │                      │  │                      │                                          │  │
│  │  │ • Jurisdiction mgmt  │  │ • Self-exclusion     │                                          │  │
│  │  │ • License tracking   │  │ • Deposit limits     │                                          │  │
│  │  │ • Geo-blocking       │  │ • Loss limits        │                                          │  │
│  │  │ • Age verification   │  │ • Time limits        │                                          │  │
│  │  │ • Tax rules          │  │ • Reality checks     │                                          │  │
│  │  │ • Data residency     │  │ • Cooling-off        │                                          │  │
│  │  │ • Compliance cal.    │  │ • Behavioral risk    │                                          │  │
│  │  │ • Regulatory filing  │  │ • Interventions      │                                          │  │
│  │  │ • Permit management  │  │ • Activity summaries │                                          │  │
│  │  └──────────┬───────────┘  └──────────┬───────────┘                                          │  │
│  │             │                          │                                                      │  │
│  └─────────────┴──────────────────────────┴──────────────────────────────────────────────────────┘  │
│                                         │                                                          │
│  ┌──────────────────────────────────────▼──────────────────────────────────────────────────────┐  │
│  │                          COMPLIANCE ENGINE (Core)                                            │  │
│  │                                                                                              │  │
│  │  Every user action, financial transaction, and venture operation passes through the          │  │
│  │  compliance engine. KYC gates user access. AML monitors money flows. Jurisdictions           │  │
│  │  enforce regional rules. Responsible Gaming protects players.                                │  │
│  │                                                                                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │  │
│  │  │   Risk       │  │   Rules      │  │   Screening  │  │   Reporting  │                   │  │
│  │  │   Engine     │  │   Engine     │  │   Engine     │  │   Engine     │                   │  │
│  │  │  (scoring)   │  │  (detection) │  │  (lists)     │  │  (filings)   │                   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘                   │  │
│  │                                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                                          │
│  ┌──────────────────────────────────────▼──────────────────────────────────────────────────────┐  │
│  │                          DATABASE LAYER (PostgreSQL + RLS)                                    │  │
│  │                                                                                              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                                   │  │
│  │  │   KYC    │  │   AML    │  │ Jurisd.  │  │ Resp.    │                                   │  │
│  │  │ 8 tables │  │12 tables │  │10 tables │  │15 tables │                                   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘                                   │  │
│  │                                                                                              │  │
│  │  All tables implement RLS policies scoped to venture_id.                                    │  │
│  │  Compliance data has enhanced encryption-at-rest for PII fields.                            │  │
│  │  Audit logs are append-only with immutable retention policies.                              │  │
│  │                                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          EXTERNAL DEPENDENCIES                                                │  │
│  │                                                                                               │  │
│  │  @mcv/identity          @mcv/fabric             @mcv/connectors         External APIs         │  │
│  │  (Auth, users,          (Audit events,          (Payment gateway,       (Onfido, Jumio,       │  │
│  │   profiles, sessions)    notifications,          Stripe, Solana)         ComplyAdvantage,     │  │
│  │                          event bus)                                      Dow Jones, OFAC,     │  │
│  │                                                                          MaxMind GeoIP,       │  │
│  │                                                                          GamStop, IDIN)       │  │
│  │                                                                                               │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: User Registration → Full Compliance Check

```
New User Registration
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ jurisdictions │────▶│ kyc           │────▶│ aml           │
│               │     │               │     │               │
│ Check user IP │     │ Determine     │     │ Screen against│
│ Geo-blocking  │     │ required KYC  │     │ sanctions &   │
│ Age verify    │     │ level based   │     │ PEP lists     │
│ required?     │     │ on jurisdiction│    │               │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │ allowed              │ verified             │ cleared
        ▼                      ▼                      ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ jurisdictions │     │ kyc           │     │ aml           │
│               │     │               │     │               │
│ Grant venture │     │ Set profile   │     │ Assign initial│
│ access based  │     │ to approved   │     │ risk score    │
│ on KYC level  │     │ Update level  │     │ Begin ongoing │
│               │     │               │     │ monitoring    │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Data Flow: Transaction → AML Monitoring

```
Financial Transaction (deposit, withdrawal, wager, transfer)
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ aml           │────▶│ aml           │────▶│ aml           │
│               │     │               │     │               │
│ Record txn    │     │ Run rules:    │     │ Pattern       │
│ Enrich with   │     │ • Threshold   │     │ analysis:     │
│ user context  │     │ • Velocity    │     │ • Structuring │
│               │     │ • Geographic  │     │ • Layering    │
│               │     │ • Behavioral  │     │ • Smurfing    │
└───────────────┘     └───────┬───────┘     └───────┬───────┘
                              │                      │
                   ┌──────────┴──────────┐          │
                   │ alert triggered?     │          │
                   │                      │          │
                   │ YES         NO       │          │
                   └──┬──────────┬───────┘          │
                      ▼          ▼                   ▼
            ┌──────────────┐  ┌──────────┐  ┌───────────────┐
            │ Create AML   │  │ Continue │  │ Update entity │
            │ alert → case │  │ monitor  │  │ risk score    │
            │ → SAR/CTR?   │  │          │  │               │
            └──────────────┘  └──────────┘  └───────────────┘
```

### Data Flow: BetEdge Player Session → Responsible Gaming

```
Player Starts Gaming Session
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ resp-gaming   │────▶│ resp-gaming   │────▶│ resp-gaming   │
│               │     │               │     │               │
│ Check self-   │     │ Check limits: │     │ Start session │
│ exclusion     │     │ • Deposit     │     │ timer for     │
│ active?       │     │ • Loss        │     │ reality check │
│               │     │ • Wager       │     │               │
│ Check cooling │     │ • Time        │     │               │
│ off active?   │     │               │     │               │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                      │                      │
        ▼ (during session)     ▼ (limit reached)      ▼ (interval hit)
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ resp-gaming   │     │ resp-gaming   │     │ resp-gaming   │
│               │     │               │     │               │
│ Behavioral    │     │ Enforce limit:│     │ Show reality  │
│ risk scoring: │     │ Block deposit │     │ check popup   │
│ • Chase loss  │     │ End session   │     │ Log response  │
│ • Erratic bet │     │ Notify user   │     │               │
│ • Time creep  │     │               │     │               │
└───────┬───────┘     └───────────────┘     └───────────────┘
        │ risk elevated
        ▼
┌───────────────┐
│ resp-gaming   │
│               │
│ Trigger       │
│ intervention: │
│ • Pop-up warn │
│ • Force break │
│ • Contact user│
│ • Refer help  │
└───────────────┘
```

---

## Sub-Module Overview

| Module | Purpose | Tables | Key Operations |
|--------|---------|--------|----------------|
| **kyc** | Identity verification, document checks, liveness, PEP/sanctions screening | 8 | initiate verification, upload document, liveness check, risk assess, PEP screen |
| **aml** | Transaction monitoring, suspicious activity detection, regulatory reporting | 12 | screen transaction, create alert, open case, file SAR/CTR, manage rules |
| **jurisdictions** | Multi-jurisdiction regulatory framework, licensing, geo-blocking | 10 | check jurisdiction, manage licenses, configure geo-rules, age verify, filing |
| **responsible-gaming** | Self-exclusion, limits, reality checks, behavioral risk, interventions | 15 | set limits, self-exclude, reality check, cool-off, assess behavior, intervene |

---

## Module: kyc

### Purpose

Implements a comprehensive Know Your Customer (KYC) identity verification system with tiered verification levels, automated document verification via OCR and NFC, biometric liveness detection, PEP (Politically Exposed Persons) and sanctions screening, risk scoring, and ongoing monitoring with document expiry tracking.

KYC verification is the first gate in the compliance pipeline. No user can access regulated features (deposits, withdrawals, wagering, trading) without completing the appropriate KYC level for their jurisdiction and intended activity.

### Verification Levels

```
Level 0 — NONE (Unverified)
  ├── Can browse public content
  ├── Cannot transact
  └── Required: email + phone verification (from @mcv/identity)

Level 1 — BASIC
  ├── Can make small deposits (≤$500/day, ≤$2,000/month)
  ├── Required: Full name, date of birth, address
  ├── Verification: Database cross-reference (credit bureau, voter rolls)
  └── Jurisdictions: Most US states, Canada (low-risk activities)

Level 2 — STANDARD
  ├── Can make medium deposits (≤$5,000/day, ≤$20,000/month)
  ├── Required: Government-issued photo ID (passport, DL, national ID)
  ├── Verification: Document OCR + database cross-check
  ├── Additional: Address proof (utility bill, bank statement ≤3 months)
  └── Jurisdictions: All regulated markets (default for BetEdge)

Level 3 — ENHANCED (Enhanced Due Diligence — EDD)
  ├── Can make large deposits (≤$50,000/day)
  ├── Required: Level 2 + liveness check (biometric selfie)
  ├── Verification: Document + liveness + source of funds declaration
  ├── Additional: PEP/sanctions screening, adverse media check
  └── Jurisdictions: UK (UKGC), Malta (MGA), high-risk profiles

Level 4 — PREMIUM (Institutional / VIP)
  ├── Unlimited transaction volume
  ├── Required: Level 3 + source of wealth documentation
  ├── Verification: Manual review by compliance officer
  ├── Additional: Ongoing enhanced monitoring, periodic re-verification
  └── Jurisdictions: All jurisdictions, required for >$100K annual volume
```

### Database Schema

```typescript
// compliance_kyc_profiles — User KYC Profile (one per user)
export const kycProfiles = pgTable('compliance_kyc_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  verificationLevel: kycVerificationLevelEnum('verification_level').default('none'),
  // none | basic | standard | enhanced | premium
  status: kycStatusEnum('status').default('pending'),
  // pending | in_review | approved | rejected | expired | suspended
  firstName: text('first_name'),
  lastName: text('last_name'),
  dateOfBirth: date('date_of_birth'),
  nationality: text('nationality'),                      // ISO 3166-1 alpha-2
  countryOfResidence: text('country_of_residence'),      // ISO 3166-1 alpha-2
  address: jsonb('address').$type<KycAddress>(),
  // { line1, line2?, city, state?, postalCode, country }
  taxIdentificationNumber: text('tax_identification_number'),  // Encrypted
  phoneNumber: text('phone_number'),                     // Encrypted
  emailVerified: boolean('email_verified').default(false),
  phoneVerified: boolean('phone_verified').default(false),
  riskScore: integer('risk_score'),                      // 0-1000 (higher = riskier)
  riskCategory: text('risk_category'),                   // low | medium | high | critical
  pepStatus: boolean('pep_status').default(false),
  sanctionsStatus: boolean('sanctions_status').default(false),
  adverseMediaFlag: boolean('adverse_media_flag').default(false),
  sourceOfFunds: text('source_of_funds'),
  sourceOfWealth: text('source_of_wealth'),
  occupation: text('occupation'),
  employerName: text('employer_name'),
  annualIncome: text('annual_income'),                   // Range bracket
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
  nextReviewDate: timestamp('next_review_date', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  suspensionReason: text('suspension_reason'),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  reviewedBy: uuid('reviewed_by'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userVentureIdx: uniqueIndex('kyc_profiles_user_venture_idx').on(table.userId, table.ventureId),
  statusIdx: index('kyc_profiles_status_idx').on(table.status),
  riskCategoryIdx: index('kyc_profiles_risk_category_idx').on(table.riskCategory),
  nextReviewIdx: index('kyc_profiles_next_review_idx').on(table.nextReviewDate),
}));

// compliance_kyc_documents — Uploaded Identity Documents
export const kycDocuments = pgTable('compliance_kyc_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  kycProfileId: uuid('kyc_profile_id').notNull().references(() => kycProfiles.id, { onDelete: 'cascade' }),
  documentType: kycDocumentTypeEnum('document_type').notNull(),
  // passport | drivers_license | national_id | utility_bill | bank_statement |
  // tax_return | proof_of_address | selfie | source_of_funds_doc
  status: kycDocumentStatusEnum('status').default('uploaded'),
  // uploaded | processing | verified | rejected | expired
  documentNumber: text('document_number'),               // Encrypted — passport/DL number
  issuingCountry: text('issuing_country'),               // ISO 3166-1 alpha-2
  issuingAuthority: text('issuing_authority'),
  issueDate: date('issue_date'),
  expiryDate: date('expiry_date'),
  frontImageUrl: text('front_image_url').notNull(),      // Encrypted storage URL
  backImageUrl: text('back_image_url'),                  // Encrypted storage URL (if applicable)
  ocrData: jsonb('ocr_data').$type<DocumentOcrResult>(),
  // { extractedName, extractedDob, extractedDocNumber, extractedExpiry, extractedAddress, confidence }
  nfcData: jsonb('nfc_data').$type<DocumentNfcResult>(), // NFC chip read data (passports)
  verificationResult: jsonb('verification_result').$type<DocumentVerificationResult>(),
  // { provider: 'onfido', checkId: '...', result: 'clear', breakdown: {...} }
  verificationProvider: text('verification_provider'),   // onfido | jumio | veriff | manual
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  reviewedBy: uuid('reviewed_by'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  profileIdx: index('kyc_documents_profile_idx').on(table.kycProfileId),
  statusIdx: index('kyc_documents_status_idx').on(table.status),
  expiryIdx: index('kyc_documents_expiry_idx').on(table.expiryDate),
}));

// compliance_kyc_verifications — Verification Attempt Records
export const kycVerifications = pgTable('compliance_kyc_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  kycProfileId: uuid('kyc_profile_id').notNull().references(() => kycProfiles.id, { onDelete: 'cascade' }),
  targetLevel: kycVerificationLevelEnum('target_level').notNull(),
  status: text('status').default('initiated'),
  // initiated | documents_submitted | liveness_pending | screening_pending |
  // in_review | approved | rejected | expired | cancelled
  initiatedAt: timestamp('initiated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),  // Verification attempt TTL (24h)
  documentIds: uuid('document_ids').array(),
  livenessCheckId: uuid('liveness_check_id'),
  pepScreeningId: uuid('pep_screening_id'),
  riskAssessmentId: uuid('risk_assessment_id'),
  overallResult: text('overall_result'),                 // pass | fail | refer
  failureReasons: jsonb('failure_reasons'),              // Array of specific failure reasons
  reviewedBy: uuid('reviewed_by'),
  reviewNotes: text('review_notes'),
  externalCheckId: text('external_check_id'),            // Provider-side check ID
  provider: text('provider'),                            // onfido | jumio | veriff | manual
  providerResponse: jsonb('provider_response'),          // Raw provider response (encrypted)
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  profileIdx: index('kyc_verifications_profile_idx').on(table.kycProfileId),
  statusIdx: index('kyc_verifications_status_idx').on(table.status),
}));

// compliance_kyc_liveness_checks — Biometric Liveness Checks
export const kycLivenessChecks = pgTable('compliance_kyc_liveness_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  kycProfileId: uuid('kyc_profile_id').notNull().references(() => kycProfiles.id, { onDelete: 'cascade' }),
  verificationId: uuid('verification_id').references(() => kycVerifications.id),
  status: text('status').default('pending'),
  // pending | processing | passed | failed | expired
  checkType: text('check_type').notNull(),               // selfie_match | video_liveness | 3d_liveness
  selfieImageUrl: text('selfie_image_url'),              // Encrypted
  videoUrl: text('video_url'),                           // Encrypted (if video liveness)
  referenceDocumentId: uuid('reference_document_id'),    // Document to compare against
  livenessScore: numeric('liveness_score', { precision: 5, scale: 4 }),  // 0.0000 - 1.0000
  faceMatchScore: numeric('face_match_score', { precision: 5, scale: 4 }),
  livenessThreshold: numeric('liveness_threshold', { precision: 5, scale: 4 }).default('0.8000'),
  faceMatchThreshold: numeric('face_match_threshold', { precision: 5, scale: 4 }).default('0.8500'),
  spoofDetection: jsonb('spoof_detection'),              // { isSpoof: false, confidence: 0.99, method: '3d_depth' }
  provider: text('provider'),                            // onfido | jumio | facetec
  providerCheckId: text('provider_check_id'),
  providerResponse: jsonb('provider_response'),          // Encrypted raw response
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ipAddress: text('ip_address'),
  deviceInfo: jsonb('device_info'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_kyc_risk_assessments — Risk Scoring Results
export const kycRiskAssessments = pgTable('compliance_kyc_risk_assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  kycProfileId: uuid('kyc_profile_id').notNull().references(() => kycProfiles.id, { onDelete: 'cascade' }),
  verificationId: uuid('verification_id').references(() => kycVerifications.id),
  overallScore: integer('overall_score').notNull(),      // 0-1000
  riskCategory: text('risk_category').notNull(),         // low | medium | high | critical
  factors: jsonb('factors').$type<RiskFactor[]>().notNull(),
  // [
  //   { factor: 'country_risk', score: 200, weight: 0.25, details: 'High-risk jurisdiction: Iran' },
  //   { factor: 'pep_status', score: 400, weight: 0.20, details: 'PEP match: Minister of Finance' },
  //   { factor: 'transaction_volume', score: 100, weight: 0.15, details: 'Within normal range' },
  //   { factor: 'document_quality', score: 50, weight: 0.10, details: 'Clear, high-resolution scan' },
  //   { factor: 'age_risk', score: 0, weight: 0.05, details: 'Age 35 — low risk bracket' },
  //   { factor: 'velocity', score: 150, weight: 0.10, details: 'Multiple accounts in 30 days' },
  //   { factor: 'adverse_media', score: 0, weight: 0.15, details: 'No adverse media found' },
  // ]
  countryRiskScore: integer('country_risk_score'),
  activityRiskScore: integer('activity_risk_score'),
  profileRiskScore: integer('profile_risk_score'),
  recommendedLevel: kycVerificationLevelEnum('recommended_level'),
  recommendedAction: text('recommended_action'),
  // approve | reject | escalate | enhanced_monitoring | restrict
  assessedAt: timestamp('assessed_at', { withTimezone: true }).defaultNow().notNull(),
  assessedBy: text('assessed_by'),                       // 'system' | user_id
  validUntil: timestamp('valid_until', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_kyc_pep_screenings — PEP/Sanctions Screening Results
export const kycPepScreenings = pgTable('compliance_kyc_pep_screenings', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  kycProfileId: uuid('kyc_profile_id').notNull().references(() => kycProfiles.id, { onDelete: 'cascade' }),
  screeningType: text('screening_type').notNull(),       // pep | sanctions | adverse_media | combined
  provider: text('provider').notNull(),                  // comply_advantage | dow_jones | refinitiv | manual
  providerReferenceId: text('provider_reference_id'),
  searchParameters: jsonb('search_parameters'),          // Name, DOB, nationality, aliases
  totalHits: integer('total_hits').default(0),
  confirmedHits: integer('confirmed_hits').default(0),
  falsePositives: integer('false_positives').default(0),
  pendingReview: integer('pending_review').default(0),
  overallResult: text('overall_result'),                 // clear | potential_match | confirmed_match
  hits: jsonb('hits').$type<PepScreeningHit[]>(),
  // [
  //   { id: 'hit-1', name: 'John Smith', matchScore: 0.92, listType: 'pep',
  //     list: 'World-Check', details: 'Former Minister of Trade, Country X',
  //     status: 'pending_review', reviewedBy: null },
  // ]
  screenedAt: timestamp('screened_at', { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: uuid('reviewed_by'),
  reviewNotes: text('review_notes'),
  nextScreeningDate: timestamp('next_screening_date', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_kyc_watchlist_hits — Individual Watchlist Match Records
export const kycWatchlistHits = pgTable('compliance_kyc_watchlist_hits', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  screeningId: uuid('screening_id').notNull().references(() => kycPepScreenings.id, { onDelete: 'cascade' }),
  kycProfileId: uuid('kyc_profile_id').notNull(),
  listName: text('list_name').notNull(),                 // OFAC SDN | EU Sanctions | UN Consolidated | PEP List
  listCategory: text('list_category').notNull(),         // sanctions | pep | law_enforcement | adverse_media
  matchedName: text('matched_name').notNull(),
  matchScore: numeric('match_score', { precision: 5, scale: 4 }).notNull(),  // 0.0000 - 1.0000
  matchType: text('match_type'),                         // exact | fuzzy | alias | partial
  entityType: text('entity_type'),                       // individual | organization | vessel | aircraft
  details: jsonb('details'),                             // Full entity details from list
  status: text('status').default('pending_review'),
  // pending_review | confirmed_match | false_positive | escalated
  disposition: text('disposition'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_kyc_audit_log — KYC-Specific Audit Trail (Immutable)
export const kycAuditLog = pgTable('compliance_kyc_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  kycProfileId: uuid('kyc_profile_id').notNull(),
  action: text('action').notNull(),
  // profile_created | level_changed | document_uploaded | document_verified |
  // document_rejected | liveness_passed | liveness_failed | pep_screened |
  // risk_assessed | status_changed | manually_reviewed | suspended | reactivated
  performedBy: text('performed_by').notNull(),           // 'system' | user_id
  previousValue: jsonb('previous_value'),
  newValue: jsonb('new_value'),
  reason: text('reason'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  // NOTE: No updatedAt — audit logs are immutable
});
```

### Core Interface

```typescript
export class KycService {
  // ── Verification Flow ────────────────────────────────────────────────
  initiateVerification(input: InitiateKycInput): Promise<KycVerification>;
  getRequiredLevel(userId: string, ventureId: string, jurisdiction: string): Promise<KycVerificationLevel>;
  getCurrentLevel(userId: string, ventureId: string): Promise<KycVerificationLevel>;

  // ── Document Verification ────────────────────────────────────────────
  uploadDocument(input: DocumentVerificationInput): Promise<KycDocument>;
  verifyDocument(documentId: string): Promise<DocumentVerificationResult>;
  rejectDocument(documentId: string, reason: string, reviewedBy: string): Promise<KycDocument>;

  // ── Liveness Check ───────────────────────────────────────────────────
  initiateLivenessCheck(input: LivenessCheckInput): Promise<KycLivenessCheck>;
  processLivenessResult(checkId: string, providerResult: ProviderLivenessResult): Promise<KycLivenessCheck>;

  // ── PEP/Sanctions Screening ──────────────────────────────────────────
  screenPepSanctions(kycProfileId: string, options?: ScreeningOptions): Promise<KycPepScreening>;
  reviewWatchlistHit(hitId: string, disposition: 'confirmed_match' | 'false_positive', notes: string, reviewedBy: string): Promise<KycWatchlistHit>;
  runBatchScreening(ventureId: string): Promise<BatchScreeningResult>;

  // ── Risk Assessment ──────────────────────────────────────────────────
  assessRisk(kycProfileId: string): Promise<KycRiskAssessment>;
  getProfile(userId: string, ventureId: string): Promise<KycProfile | null>;

  // ── Manual Review ────────────────────────────────────────────────────
  submitManualReview(input: ManualReviewInput): Promise<KycVerification>;
  getReviewQueue(ventureId: string, filters?: KycSearchFilters): Promise<PaginatedResult<KycVerification>>;

  // ── Ongoing Monitoring ───────────────────────────────────────────────
  checkDocumentExpiry(ventureId: string): Promise<ExpiryCheckResult[]>;
  triggerPeriodicRescreen(ventureId: string): Promise<RescreenResult>;
  getExpiringProfiles(ventureId: string, daysAhead: number): Promise<KycProfile[]>;
}
```

### Verification Flow State Machine

```
┌──────────┐  initiate  ┌─────────────┐  docs uploaded  ┌────────────────────┐
│          │───────────▶│             │────────────────▶│                    │
│  NONE    │            │  INITIATED  │                 │ DOCUMENTS_SUBMITTED│
│          │            │             │                 │                    │
└──────────┘            └─────────────┘                 └─────────┬──────────┘
                                                                   │
                                                   ┌───────────────┤
                                                   │ liveness      │ (if enhanced/premium)
                                                   │ required?     │
                                                   ▼               ▼
                                        ┌──────────────────┐ ┌──────────────────┐
                                        │ LIVENESS_PENDING │ │ SCREENING_PENDING│
                                        └────────┬─────────┘ └────────┬─────────┘
                                                 │ passed              │ cleared
                                                 ▼                     ▼
                                        ┌──────────────────────────────────────┐
                                        │            IN_REVIEW                  │
                                        │  (risk assessment + auto/manual)      │
                                        └──────────────────┬───────────────────┘
                                                           │
                                          ┌────────────────┼────────────────┐
                                          ▼                ▼                ▼
                                ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                                │   APPROVED   │ │   REJECTED   │ │   EXPIRED    │
                                │              │ │              │ │  (TTL/docs)  │
                                └──────┬───────┘ └──────────────┘ └──────────────┘
                                       │
                                       │ doc expires / periodic review
                                       ▼
                                ┌──────────────┐
                                │  SUSPENDED   │
                                │ (re-verify)  │
                                └──────────────┘
```

### Key Behaviors

1. **Tiered verification**: The required KYC level is determined by the intersection of jurisdiction requirements and intended activity (e.g., BetEdge UK requires Level 3, SerpSpace US requires Level 1).
2. **Document OCR**: All uploaded documents are processed through OCR to extract name, DOB, document number, and expiry date. Extracted data is cross-referenced against the user's profile for consistency.
3. **Liveness anti-spoofing**: Liveness checks use 3D depth analysis (where supported) or challenge-response video to detect photo/video attacks, masks, and deepfakes. A minimum liveness score of 0.80 and face match score of 0.85 are required.
4. **PEP screening cadence**: Initial screening on verification, then rescreening every 90 days for standard profiles and every 30 days for high-risk profiles. Screening uses fuzzy name matching with configurable thresholds.
5. **Risk scoring model**: Composite score (0–1000) calculated from weighted factors: country risk (25%), PEP status (20%), adverse media (15%), transaction volume (15%), document quality (10%), velocity (10%), age bracket (5%). Scores above 600 trigger enhanced monitoring.
6. **Document expiry tracking**: Documents approaching expiry (30/14/7 days) trigger automated notifications. Expired documents suspend the profile until re-verified.
7. **Immutable audit**: Every KYC action (verification initiated, document reviewed, level changed, status updated) is logged to the immutable audit log with the actor, timestamp, IP, and previous/new values.

---

## Module: aml

### Purpose

Implements a comprehensive Anti-Money Laundering (AML) framework with real-time transaction monitoring against configurable rule sets, multi-pattern detection for structuring/layering/smurfing, automated alert generation and escalation, case management for investigations, Suspicious Activity Report (SAR) and Currency Transaction Report (CTR) filing, sanctions screening, and entity risk scoring with network analysis.

AML monitoring is continuous and automatic. Every financial transaction across every venture — deposits, withdrawals, wagers, payouts, transfers, crypto operations — is screened in real time against active rules. Alerts are generated when thresholds are breached or suspicious patterns are detected.

### Detection Rule Types

```
THRESHOLD RULES
  ├── Single transaction ≥ $10,000 USD (CTR trigger — FinCEN)
  ├── Single transaction ≥ $3,000 USD (enhanced monitoring)
  ├── Aggregate transactions ≥ $10,000 in 24 hours (structuring detection)
  └── Aggregate transactions ≥ $25,000 in 30 days (activity monitoring)

VELOCITY RULES
  ├── >5 transactions in 1 hour (rapid-fire detection)
  ├── >20 transactions in 24 hours (volume anomaly)
  ├── >3 deposits followed by immediate withdrawal (pass-through)
  └── Account-to-account transfer velocity exceeds baseline

PATTERN RULES
  ├── Structuring: Multiple transactions just below $10,000
  ├── Layering: Funds move through 3+ accounts rapidly
  ├── Smurfing: Multiple small deposits from different sources
  ├── Round-tripping: Funds return to origin after multiple hops
  └── Chip dumping: Deliberate losses to specific player (BetEdge)

GEOGRAPHIC RULES
  ├── Transaction from FATF high-risk jurisdiction
  ├── Transaction from sanctioned country (OFAC, EU, UN)
  ├── IP location mismatch with registered address
  └── Cross-border pattern: Multiple jurisdictions in 24 hours

BEHAVIORAL RULES
  ├── Sudden increase in transaction volume (>300% of baseline)
  ├── Change in transaction pattern (time-of-day, frequency, amount)
  ├── Dormant account reactivation with large transaction
  └── Multiple failed verification attempts before large withdrawal

NETWORK RULES
  ├── Connected accounts sharing payment methods
  ├── Accounts sharing IP addresses or device fingerprints
  ├── Ring transactions between connected entities
  └── Shell account detection via pattern matching
```

### Database Schema

```typescript
// compliance_aml_transaction_records — Monitored Transaction Records
export const amlTransactionRecords = pgTable('compliance_aml_transaction_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  transactionId: text('transaction_id').notNull(),       // External transaction reference
  transactionType: text('transaction_type').notNull(),
  // deposit | withdrawal | wager | payout | transfer | crypto_buy | crypto_sell | refund
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').notNull(),
  amountUsd: numeric('amount_usd', { precision: 19, scale: 4 }),  // Normalized to USD
  sourceType: text('source_type'),                       // bank | card | crypto | wallet | e_wallet
  sourceIdentifier: text('source_identifier'),           // Masked — last 4 digits, wallet prefix
  destinationType: text('destination_type'),
  destinationIdentifier: text('destination_identifier'),
  counterpartyId: uuid('counterparty_id'),               // Other party in transaction
  counterpartyName: text('counterparty_name'),
  ipAddress: text('ip_address'),
  geoLocation: jsonb('geo_location'),                    // { country, region, city, lat, lon }
  deviceFingerprint: text('device_fingerprint'),
  riskScore: integer('risk_score'),                      // 0-1000
  screeningResult: text('screening_result'),             // cleared | flagged | blocked
  rulesTriggered: text('rules_triggered').array(),       // Array of rule IDs that fired
  alertIds: uuid('alert_ids').array(),                   // Generated alert IDs
  metadata: jsonb('metadata'),
  transactionTimestamp: timestamp('transaction_timestamp', { withTimezone: true }).notNull(),
  screenedAt: timestamp('screened_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('aml_txn_user_idx').on(table.userId),
  ventureIdx: index('aml_txn_venture_idx').on(table.ventureId),
  typeIdx: index('aml_txn_type_idx').on(table.transactionType),
  timestampIdx: index('aml_txn_timestamp_idx').on(table.transactionTimestamp),
  riskIdx: index('aml_txn_risk_idx').on(table.riskScore),
  screeningIdx: index('aml_txn_screening_idx').on(table.screeningResult),
}));

// compliance_aml_alerts — Generated AML Alerts
export const amlAlerts = pgTable('compliance_aml_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  alertNumber: text('alert_number').notNull(),           // "AML-ALT-2026-000001"
  userId: uuid('user_id').notNull(),
  caseId: uuid('case_id').references(() => amlCases.id),
  status: amlAlertStatusEnum('status').default('new'),
  // new | investigating | escalated | filed | dismissed | false_positive
  priority: amlCasePriorityEnum('priority').default('medium'),
  // low | medium | high | critical
  ruleId: uuid('rule_id').references(() => amlRules.id),
  ruleType: amlRuleTypeEnum('rule_type').notNull(),
  // threshold | velocity | pattern | network | geographic | behavioral
  ruleName: text('rule_name').notNull(),
  description: text('description').notNull(),
  triggerDetails: jsonb('trigger_details').notNull(),
  // { transactionIds: [...], totalAmount: '15000', period: '24h',
  //   pattern: 'structuring', confidence: 0.87 }
  relatedTransactionIds: uuid('related_transaction_ids').array(),
  relatedAlertIds: uuid('related_alert_ids').array(),
  riskScore: integer('risk_score'),
  assignedTo: uuid('assigned_to'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  escalatedTo: uuid('escalated_to'),
  escalatedAt: timestamp('escalated_at', { withTimezone: true }),
  escalationReason: text('escalation_reason'),
  disposition: text('disposition'),
  // filed_sar | filed_ctr | dismissed_false_positive | dismissed_insufficient_evidence |
  // account_restricted | account_closed | referred_law_enforcement
  dispositionNotes: text('disposition_notes'),
  dispositionBy: uuid('disposition_by'),
  dispositionAt: timestamp('disposition_at', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('aml_alerts_status_idx').on(table.status),
  priorityIdx: index('aml_alerts_priority_idx').on(table.priority),
  userIdx: index('aml_alerts_user_idx').on(table.userId),
  dueDateIdx: index('aml_alerts_due_date_idx').on(table.dueDate),
}));

// compliance_aml_cases — Investigation Cases
export const amlCases = pgTable('compliance_aml_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  caseNumber: text('case_number').notNull(),             // "AML-CASE-2026-000001"
  userId: uuid('user_id').notNull(),
  status: text('status').default('open'),
  // open | investigating | pending_filing | filed | closed | referred
  priority: amlCasePriorityEnum('priority').default('medium'),
  title: text('title').notNull(),
  description: text('description'),
  alertIds: uuid('alert_ids').array(),                   // Associated alert IDs
  sarFilingId: uuid('sar_filing_id'),
  ctrFilingId: uuid('ctr_filing_id'),
  assignedTo: uuid('assigned_to'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  supervisor: uuid('supervisor'),
  totalSuspiciousAmount: numeric('total_suspicious_amount', { precision: 19, scale: 4 }),
  currency: text('currency').default('USD'),
  investigationNotes: jsonb('investigation_notes').$type<CaseNote[]>(),
  // [{ id, author, content, timestamp, attachments: [] }]
  evidence: jsonb('evidence').$type<CaseEvidence[]>(),
  // [{ id, type: 'transaction_log' | 'screenshot' | 'document', url, description }]
  timeline: jsonb('timeline').$type<CaseTimelineEvent[]>(),
  // [{ timestamp, event, actor, details }]
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('aml_cases_status_idx').on(table.status),
  assignedIdx: index('aml_cases_assigned_idx').on(table.assignedTo),
  dueDateIdx: index('aml_cases_due_date_idx').on(table.dueDate),
}));

// compliance_aml_sar_filings — Suspicious Activity Reports
export const amlSarFilings = pgTable('compliance_aml_sar_filings', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  caseId: uuid('case_id').references(() => amlCases.id),
  filingNumber: text('filing_number').notNull(),         // "SAR-2026-000001"
  status: amlFilingStatusEnum('status').default('draft'),
  // draft | pending_review | submitted | acknowledged | rejected
  filingType: text('filing_type').notNull(),             // initial | continuing | joint
  regulatoryBody: text('regulatory_body').notNull(),     // fincen | fintrac | nca | fiu
  subjectUserId: uuid('subject_user_id').notNull(),
  subjectName: text('subject_name').notNull(),
  subjectDob: date('subject_dob'),
  subjectAddress: jsonb('subject_address'),
  subjectIdentifiers: jsonb('subject_identifiers'),      // SSN, passport, DL (encrypted)
  suspiciousActivity: jsonb('suspicious_activity').notNull(),
  // { description, activityDates: { start, end }, totalAmount, transactionCount,
  //   activityType: 'structuring' | 'layering' | ... }
  narrativeText: text('narrative_text').notNull(),       // Free-form narrative (regulatory requirement)
  supportingDocuments: jsonb('supporting_documents'),
  relatedTransactionIds: uuid('related_transaction_ids').array(),
  filedAt: timestamp('filed_at', { withTimezone: true }),
  filedBy: uuid('filed_by'),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  acknowledgementReference: text('acknowledgement_reference'),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_aml_ctr_filings — Currency Transaction Reports
export const amlCtrFilings = pgTable('compliance_aml_ctr_filings', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  filingNumber: text('filing_number').notNull(),         // "CTR-2026-000001"
  status: amlFilingStatusEnum('status').default('draft'),
  regulatoryBody: text('regulatory_body').notNull(),     // fincen | fintrac
  subjectUserId: uuid('subject_user_id').notNull(),
  subjectName: text('subject_name').notNull(),
  transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
  totalAmount: numeric('total_amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').notNull(),
  transactionType: text('transaction_type').notNull(),
  relatedTransactionIds: uuid('related_transaction_ids').array(),
  conductedBy: jsonb('conducted_by'),                    // Person conducting (if different from subject)
  filedAt: timestamp('filed_at', { withTimezone: true }),
  filedBy: uuid('filed_by'),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  acknowledgementReference: text('acknowledgement_reference'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_aml_rules — Detection Rule Configurations
export const amlRules = pgTable('compliance_aml_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id'),                         // null = global rule (all ventures)
  name: text('name').notNull(),
  description: text('description'),
  ruleType: amlRuleTypeEnum('rule_type').notNull(),
  // threshold | velocity | pattern | network | geographic | behavioral
  isActive: boolean('is_active').default(true),
  priority: amlCasePriorityEnum('priority').default('medium'),
  configuration: jsonb('configuration').notNull(),
  // Threshold: { field: 'amount', operator: 'gte', value: 10000, currency: 'USD', period: null }
  // Velocity:  { field: 'count', operator: 'gte', value: 5, period: '1h', groupBy: 'user_id' }
  // Pattern:   { pattern: 'structuring', threshold: 10000, tolerance: 0.15, lookback: '24h' }
  // Geographic: { countries: ['IR', 'KP', 'SY'], action: 'block' }
  // Behavioral: { metric: 'volume_change', threshold: 3.0, baseline: '90d', period: '7d' }
  // Network:   { maxConnections: 3, connectionTypes: ['ip', 'payment_method'], period: '30d' }
  applicableTransactionTypes: text('applicable_transaction_types').array(),
  applicableJurisdictions: text('applicable_jurisdictions').array(),
  alertTemplate: jsonb('alert_template'),
  // { titleTemplate: 'Threshold exceeded: {{amount}} {{currency}}',
  //   descriptionTemplate: 'User {{userId}} ...' }
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  triggerCount: integer('trigger_count').default(0),
  falsePositiveRate: numeric('false_positive_rate', { precision: 5, scale: 4 }),
  version: integer('version').default(1),
  createdBy: uuid('created_by'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_aml_risk_scores — Entity Risk Scores
export const amlRiskScores = pgTable('compliance_aml_risk_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull(),
  overallScore: integer('overall_score').notNull(),      // 0-1000
  riskCategory: text('risk_category').notNull(),         // low | medium | high | critical
  transactionRiskScore: integer('transaction_risk_score'),
  geographicRiskScore: integer('geographic_risk_score'),
  behavioralRiskScore: integer('behavioral_risk_score'),
  networkRiskScore: integer('network_risk_score'),
  alertHistoryScore: integer('alert_history_score'),
  factors: jsonb('factors').$type<AmlRiskFactor[]>(),
  previousScore: integer('previous_score'),
  scoreChange: integer('score_change'),
  monitoringLevel: text('monitoring_level'),             // standard | enhanced | intensive
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: uniqueIndex('aml_risk_scores_user_idx').on(table.userId, table.ventureId),
  riskCategoryIdx: index('aml_risk_scores_category_idx').on(table.riskCategory),
}));

// compliance_aml_patterns — Detected Behavioral Patterns
export const amlPatterns = pgTable('compliance_aml_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull(),
  patternType: text('pattern_type').notNull(),
  // structuring | layering | smurfing | round_tripping | chip_dumping |
  // rapid_movement | dormant_reactivation | volume_spike
  confidence: numeric('confidence', { precision: 5, scale: 4 }).notNull(),
  detectedAt: timestamp('detected_at', { withTimezone: true }).notNull(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  transactionCount: integer('transaction_count').notNull(),
  totalAmount: numeric('total_amount', { precision: 19, scale: 4 }),
  relatedTransactionIds: uuid('related_transaction_ids').array(),
  description: text('description'),
  alertId: uuid('alert_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_aml_watchlists — External Watchlist Imports
export const amlWatchlists = pgTable('compliance_aml_watchlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  listName: text('list_name').notNull(),                 // OFAC SDN | EU Sanctions | UN Consolidated
  listSource: text('list_source').notNull(),             // URL or provider
  listVersion: text('list_version'),
  totalEntries: integer('total_entries'),
  lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }),
  lastImportedAt: timestamp('last_imported_at', { withTimezone: true }),
  importStatus: text('import_status'),                   // pending | importing | completed | failed
  importError: text('import_error'),
  nextUpdateAt: timestamp('next_update_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_aml_sanctions_screenings — Per-Transaction Sanctions Checks
export const amlSanctionsScreenings = pgTable('compliance_aml_sanctions_screenings', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  transactionRecordId: uuid('transaction_record_id').references(() => amlTransactionRecords.id),
  userId: uuid('user_id').notNull(),
  screenedName: text('screened_name').notNull(),
  screenedCountry: text('screened_country'),
  listsChecked: text('lists_checked').array(),
  result: text('result').notNull(),                      // clear | potential_match | confirmed_match
  matchCount: integer('match_count').default(0),
  matches: jsonb('matches'),
  provider: text('provider'),
  screenedAt: timestamp('screened_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_aml_threshold_configs — Per-Jurisdiction Reporting Thresholds
export const amlThresholdConfigs = pgTable('compliance_aml_threshold_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id'),                         // null = global
  jurisdiction: text('jurisdiction').notNull(),           // ISO country code
  regulatoryBody: text('regulatory_body').notNull(),
  thresholdType: text('threshold_type').notNull(),       // ctr | sar_review | enhanced_monitoring
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').notNull(),
  period: text('period'),                                // null (per-transaction) | '24h' | '30d'
  isActive: boolean('is_active').default(true),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_aml_audit_log — AML-Specific Audit Trail (Immutable)
export const amlAuditLog = pgTable('compliance_aml_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  entityType: text('entity_type').notNull(),             // alert | case | sar | ctr | rule | risk_score
  entityId: uuid('entity_id').notNull(),
  action: text('action').notNull(),
  // alert_created | alert_assigned | alert_escalated | alert_disposed |
  // case_opened | case_assigned | case_filed | case_closed |
  // sar_drafted | sar_submitted | sar_acknowledged |
  // ctr_filed | rule_created | rule_modified | risk_score_changed
  performedBy: text('performed_by').notNull(),
  previousValue: jsonb('previous_value'),
  newValue: jsonb('new_value'),
  reason: text('reason'),
  ipAddress: text('ip_address'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class AmlService {
  // ── Transaction Screening ────────────────────────────────────────────
  screenTransaction(input: TransactionScreeningInput): Promise<TransactionScreeningResult>;
  screenBatch(input: BulkScreeningInput): Promise<BulkScreeningResult>;
  getTransactionHistory(userId: string, ventureId: string, filters?: TransactionFilters): Promise<PaginatedResult<AmlTransactionRecord>>;

  // ── Alert Management ─────────────────────────────────────────────────
  getAlerts(ventureId: string, filters?: AlertFilters): Promise<PaginatedResult<AmlAlert>>;
  assignAlert(alertId: string, assigneeId: string): Promise<AmlAlert>;
  escalateAlert(alertId: string, escalateTo: string, reason: string): Promise<AmlAlert>;
  disposeAlert(alertId: string, input: AlertReviewInput): Promise<AmlAlert>;

  // ── Case Management ──────────────────────────────────────────────────
  openCase(alertIds: string[], title: string, description?: string): Promise<AmlCase>;
  assignCase(caseId: string, assigneeId: string): Promise<AmlCase>;
  addCaseNote(caseId: string, note: string, author: string): Promise<AmlCase>;
  addCaseEvidence(caseId: string, evidence: CaseEvidence): Promise<AmlCase>;
  resolveCase(caseId: string, resolution: string, resolvedBy: string): Promise<AmlCase>;

  // ── Regulatory Filing ────────────────────────────────────────────────
  draftSar(input: SarFilingInput): Promise<AmlSarFiling>;
  submitSar(sarId: string, filedBy: string): Promise<AmlSarFiling>;
  draftCtr(input: CtrFilingInput): Promise<AmlCtrFiling>;
  submitCtr(ctrId: string, filedBy: string): Promise<AmlCtrFiling>;
  getFilings(ventureId: string, filters?: FilingFilters): Promise<PaginatedResult<AmlSarFiling | AmlCtrFiling>>;

  // ── Rule Management ──────────────────────────────────────────────────
  createRule(input: RuleConfigInput): Promise<AmlRule>;
  updateRule(ruleId: string, input: Partial<RuleConfigInput>): Promise<AmlRule>;
  toggleRule(ruleId: string, isActive: boolean): Promise<AmlRule>;
  testRule(ruleId: string, testData: TestTransactionData[]): Promise<RuleTestResult>;
  getRulePerformance(ruleId: string): Promise<RulePerformanceMetrics>;

  // ── Risk Scoring ─────────────────────────────────────────────────────
  calculateRiskScore(userId: string, ventureId: string): Promise<AmlRiskScore>;
  getRiskScore(userId: string, ventureId: string): Promise<AmlRiskScore | null>;
  getBulkRiskScores(ventureId: string, filters?: RiskFilters): Promise<PaginatedResult<AmlRiskScore>>;

  // ── Pattern Detection ────────────────────────────────────────────────
  runPatternAnalysis(userId: string, ventureId: string, lookback?: string): Promise<AmlPattern[]>;
  getDetectedPatterns(ventureId: string, filters?: PatternFilters): Promise<PaginatedResult<AmlPattern>>;

  // ── Sanctions Screening ──────────────────────────────────────────────
  screenSanctions(userId: string, transactionRecordId?: string): Promise<AmlSanctionsScreening>;
  updateWatchlists(): Promise<WatchlistUpdateResult>;

  // ── Dashboard & Analytics ────────────────────────────────────────────
  getDashboard(ventureId: string): Promise<AmlDashboard>;
  getAlertStatistics(ventureId: string, period: string): Promise<AmlAlertStats>;
}
```

### Alert Lifecycle State Machine

```
Transaction Screened
        │
        ▼ (rule triggered)
┌──────────┐  assign    ┌───────────────┐  investigate  ┌────────────────┐
│          │───────────▶│               │─────────────▶│                │
│   NEW    │            │ INVESTIGATING │              │   ESCALATED    │
│          │◀───────────│               │◀─────────────│   (supervisor) │
└──────┬───┘  reassign  └───────┬───────┘  de-escalate └────────┬───────┘
       │                        │                                │
       │    ┌───────────────────┼────────────────────────────────┘
       │    │                   │
       │    ▼                   ▼
       │  ┌──────────────┐   ┌──────────────┐
       │  │  DISMISSED   │   │    FILED     │
       │  │              │   │   (SAR/CTR)  │
       │  │ • false_pos  │   │              │
       │  │ • insuff_ev  │   │              │
       │  └──────────────┘   └──────────────┘
       │
       ▼ (auto-dismiss)
┌──────────────┐
│ FALSE_POS    │
│ (auto-rule)  │
└──────────────┘
```

### Key Behaviors

1. **Real-time screening**: Every transaction is screened synchronously before completion. If a blocking rule fires (sanctions match, OFAC hit), the transaction is halted. Non-blocking alerts are generated asynchronously.
2. **Rule engine**: Rules are evaluated in priority order. Multiple rules can fire on the same transaction. The highest-priority alert determines the overall screening result.
3. **Structuring detection**: The pattern engine aggregates transactions by user over sliding windows (24h, 7d, 30d) and detects amounts clustered just below reporting thresholds (e.g., multiple $9,500 deposits when the CTR threshold is $10,000).
4. **CTR auto-generation**: Transactions exceeding the CTR threshold ($10,000 USD for FinCEN) automatically generate a CTR filing draft. Compliance officers review and submit within 15 business days.
5. **SAR timeline**: SAR filings must be submitted within 30 calendar days of initial detection (FinCEN). The system tracks due dates and escalates overdue filings.
6. **Risk score decay**: Entity risk scores incorporate time decay — older alerts and patterns have diminishing impact on the current score. Scores are recalculated daily for active users and on-demand for transactions.
7. **Network analysis**: Connected accounts (shared IP, shared payment method, shared device fingerprint) are analyzed as a network. Suspicious patterns across the network (e.g., ring transactions) generate network-type alerts.
8. **Watchlist updates**: Sanctions and PEP watchlists are updated daily via automated import. All active users are rescreened against updated lists within 24 hours of import.

---

## Module: jurisdictions

### Purpose

Manages the complex multi-jurisdiction regulatory landscape across all MCV ventures. Tracks licensing requirements per region, enforces geo-blocking and geo-fencing rules, manages age verification requirements, maintains compliance calendars with regulatory deadlines, handles tax withholding configurations, and ensures data residency compliance.

This module is the regulatory map that determines what each venture can do in each jurisdiction. It answers questions like: "Can BetEdge accept a user from Ontario, Canada?" or "Does Futurestate need a specific license to operate in Germany?" or "What age verification is required for SerpSpace in Japan?"

### Jurisdiction Registry Structure

```
NORTH AMERICA
├── United States (federal)
│   ├── New Jersey — Gambling: Licensed (DGE) | Age: 21+ | Tax: State withholding
│   ├── Pennsylvania — Gambling: Licensed (PGCB) | Age: 21+ | Tax: State withholding
│   ├── Michigan — Gambling: Licensed (MGCB) | Age: 21+ | Tax: State withholding
│   ├── Colorado — Gambling: Licensed (CDoR) | Age: 21+ | Geo-fence required
│   ├── California — Gambling: Prohibited | CCPA: Full compliance required
│   ├── New York — Gambling: Pending | Commerce: Full access
│   └── ... (50 states + DC + territories)
├── Canada (federal: FINTRAC)
│   ├── Ontario — Gambling: Licensed (AGCO/iGO) | Age: 19+ | Data: Canada-resident
│   ├── British Columbia — Gambling: BCLC only | Commerce: Full access
│   ├── Quebec — Gambling: Loto-Québec only | Language: French required
│   └── ...
└── Mexico — Gambling: Restricted | Commerce: Limited

EUROPE
├── United Kingdom — Gambling: Licensed (UKGC) | Age: 18+ | Data: UK GDPR
├── Malta — Gambling: Licensed (MGA) | Age: 18+ | Hub: EU operations
├── Gibraltar — Gambling: Licensed (GRA) | Tax: Favorable
├── Isle of Man — Gambling: Licensed (GSC) | Age: 18+
├── Germany — Gambling: Licensed (GGL) | Age: 18+ | €1,000/mo deposit limit
├── France — Gambling: ANJ Licensed | Age: 18+ | Restricted markets
├── Sweden — Gambling: Licensed (SGA) | Age: 18+ | Strict RG requirements
├── Netherlands — Gambling: Licensed (KSA) | Age: 18+ | Strict AML
├── Ireland — Gambling: Pending regulation | Commerce: Full access
├── EU (general) — Data: GDPR | Crypto: MiCA | Commerce: DSA/DMA
└── ...

ASIA-PACIFIC
├── Australia — Gambling: Prohibited (online) | Commerce: Full access
├── Japan — Gambling: Prohibited (betting) | Commerce: Full access | Age: 18+
├── Philippines — Gambling: PAGCOR zone only | Commerce: Limited
├── India — Gambling: State-by-state | Commerce: Full access
└── ...

RESTRICTED / PROHIBITED
├── United States — OFAC sanctioned countries (Cuba, Iran, North Korea, Syria, etc.)
├── China — Online gambling: Prohibited | Commerce: Heavy restrictions
├── Russia — Gambling: Domestic only | Sanctions: Partial
└── Turkey — Gambling: Prohibited | Commerce: Limited
```

### Database Schema

```typescript
// compliance_jurisdictions — Jurisdiction Definitions
export const jurisdictions = pgTable('compliance_jurisdictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),                 // "US-NJ", "GB", "MT", "CA-ON"
  name: text('name').notNull(),                          // "New Jersey, United States"
  parentCode: text('parent_code'),                       // "US" for "US-NJ"
  type: text('type').notNull(),                          // country | state | province | territory | special_zone
  isoAlpha2: text('iso_alpha2'),                         // ISO 3166-1 alpha-2 (countries)
  isoAlpha3: text('iso_alpha3'),                         // ISO 3166-1 alpha-3 (countries)
  region: text('region'),                                // north_america | europe | asia_pacific | ...
  subRegion: text('sub_region'),
  currency: text('currency'),                            // Default currency code
  primaryLanguage: text('primary_language'),
  timezone: text('timezone'),
  regulatoryBody: text('regulatory_body'),               // Primary regulatory authority
  regulatoryWebsite: text('regulatory_website'),
  gamblingStatus: text('gambling_status'),
  // allowed | restricted | prohibited | pending | not_applicable
  commerceStatus: text('commerce_status'),
  // allowed | restricted | prohibited | pending
  cryptoStatus: text('crypto_status'),
  // allowed | restricted | prohibited | pending | not_applicable
  dataProtectionFramework: text('data_protection_framework'), // gdpr | ccpa | pipeda | lgpd | pdpa | none
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_jurisdiction_requirements — Per-Jurisdiction Regulatory Requirements
export const jurisdictionRequirements = pgTable('compliance_jurisdiction_requirements', {
  id: uuid('id').primaryKey().defaultRandom(),
  jurisdictionId: uuid('jurisdiction_id').notNull().references(() => jurisdictions.id),
  ventureType: text('venture_type'),                     // gambling | commerce | crypto | all
  category: text('category').notNull(),
  // kyc_level | age_minimum | deposit_limit | licensing | data_residency |
  // tax_reporting | language | responsible_gaming | aml_reporting
  requirementKey: text('requirement_key').notNull(),
  requirementValue: jsonb('requirement_value').notNull(),
  // Examples:
  // kyc_level: { minimumLevel: 'standard', enhancedTrigger: 5000 }
  // age_minimum: { age: 21, verificationMethods: ['id_check', 'database'] }
  // deposit_limit: { daily: 1000, monthly: null, currency: 'EUR' }
  // data_residency: { required: true, allowedRegions: ['EU', 'EEA'] }
  description: text('description'),
  legalReference: text('legal_reference'),               // Citation to actual regulation
  effectiveFrom: timestamp('effective_from', { withTimezone: true }),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_jurisdiction_licenses — Operating Licenses/Permits
export const jurisdictionLicenses = pgTable('compliance_jurisdiction_licenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  jurisdictionId: uuid('jurisdiction_id').notNull().references(() => jurisdictions.id),
  licenseType: text('license_type').notNull(),
  // gambling_operator | payment_processor | data_processor | crypto_exchange |
  // money_transmitter | e_commerce
  licenseNumber: text('license_number'),
  licenseName: text('license_name').notNull(),
  issuingAuthority: text('issuing_authority').notNull(),
  status: licenseStatusEnum('status').default('applied'),
  // applied | pending | granted | renewed | suspended | revoked | expired
  applicationDate: timestamp('application_date', { withTimezone: true }),
  grantedDate: timestamp('granted_date', { withTimezone: true }),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  renewalDate: timestamp('renewal_date', { withTimezone: true }),
  renewalLeadDays: integer('renewal_lead_days').default(90),
  suspendedDate: timestamp('suspended_date', { withTimezone: true }),
  suspensionReason: text('suspension_reason'),
  revokedDate: timestamp('revoked_date', { withTimezone: true }),
  revocationReason: text('revocation_reason'),
  conditions: jsonb('conditions'),                       // License-specific conditions/restrictions
  annualFee: numeric('annual_fee', { precision: 19, scale: 4 }),
  annualFeeCurrency: text('annual_fee_currency'),
  documents: jsonb('documents'),                         // Supporting documents
  contacts: jsonb('contacts'),                           // Regulatory contacts
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureJurisdictionIdx: index('licenses_venture_jurisdiction_idx').on(table.ventureId, table.jurisdictionId),
  statusIdx: index('licenses_status_idx').on(table.status),
  expiryIdx: index('licenses_expiry_idx').on(table.expiryDate),
}));

// compliance_jurisdiction_geo_rules — Geo-Blocking/Geo-Fencing Rules
export const jurisdictionGeoRules = pgTable('compliance_jurisdiction_geo_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id'),                         // null = all ventures
  jurisdictionId: uuid('jurisdiction_id').notNull().references(() => jurisdictions.id),
  action: geoActionEnum('action').notNull(),
  // allow | block | restrict | age_gate | vpn_block
  ruleType: text('rule_type').notNull(),
  // ip_based | gps_based | combined | address_based
  ipRanges: jsonb('ip_ranges'),                          // Specific IP ranges (override)
  gpsCoordinates: jsonb('gps_coordinates'),              // Geo-fence polygon
  vpnDetection: boolean('vpn_detection').default(true),
  torDetection: boolean('tor_detection').default(true),
  proxyDetection: boolean('proxy_detection').default(true),
  restrictions: jsonb('restrictions'),
  // { allowedFeatures: ['browse', 'account'], blockedFeatures: ['deposit', 'wager'] }
  blockMessage: text('block_message'),
  redirectUrl: text('redirect_url'),
  isActive: boolean('is_active').default(true),
  priority: integer('priority').default(0),              // Higher priority rules evaluated first
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_jurisdiction_age_rules — Age Verification Requirements
export const jurisdictionAgeRules = pgTable('compliance_jurisdiction_age_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  jurisdictionId: uuid('jurisdiction_id').notNull().references(() => jurisdictions.id),
  ventureType: text('venture_type').notNull(),           // gambling | commerce | crypto | alcohol | tobacco
  minimumAge: integer('minimum_age').notNull(),
  verificationMethods: jsonb('verification_methods').$type<AgeVerificationMethod[]>(),
  // [
  //   { method: 'self_declaration', acceptedAlone: false },
  //   { method: 'id_document', acceptedAlone: true },
  //   { method: 'credit_bureau', acceptedAlone: true },
  //   { method: 'voter_roll', acceptedAlone: true },
  //   { method: 'idin', acceptedAlone: true, regions: ['NL'] },
  // ]
  strictMode: boolean('strict_mode').default(false),     // Require re-verification periodically
  gracePeriod: integer('grace_period'),                  // Hours before full age gate activates
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_jurisdiction_tax_rules — Tax Withholding/Reporting Rules
export const jurisdictionTaxRules = pgTable('compliance_jurisdiction_tax_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  jurisdictionId: uuid('jurisdiction_id').notNull().references(() => jurisdictions.id),
  ventureType: text('venture_type'),
  taxType: text('tax_type').notNull(),
  // withholding | reporting | vat | gst | gaming_tax | crypto_capital_gains
  rate: numeric('rate', { precision: 8, scale: 4 }),     // Tax rate (e.g., 0.24 for 24%)
  thresholdAmount: numeric('threshold_amount', { precision: 19, scale: 4 }),
  thresholdCurrency: text('threshold_currency'),
  reportingFrequency: text('reporting_frequency'),       // monthly | quarterly | annually
  reportingDeadline: text('reporting_deadline'),         // "15th of following month" or specific date
  filingForm: text('filing_form'),                       // W-2G, 1099-MISC, VAT return, etc.
  description: text('description'),
  legalReference: text('legal_reference'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_jurisdiction_data_rules — Data Residency/Privacy Rules
export const jurisdictionDataRules = pgTable('compliance_jurisdiction_data_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  jurisdictionId: uuid('jurisdiction_id').notNull().references(() => jurisdictions.id),
  dataCategory: text('data_category').notNull(),
  // personal_data | financial_data | health_data | gaming_data | biometric_data
  residencyRequired: boolean('residency_required').default(false),
  allowedRegions: text('allowed_regions').array(),       // ISO codes where data can be stored
  transferMechanism: text('transfer_mechanism'),
  // adequacy_decision | scc | bcr | consent | none_required
  retentionPeriod: text('retention_period'),             // "7 years" | "5 years" | "2 years after account closure"
  deletionRequired: boolean('deletion_required').default(false),  // Right to erasure
  encryptionRequired: boolean('encryption_required').default(true),
  consentRequired: boolean('consent_required').default(true),
  dpiRequired: boolean('dpi_required').default(false),   // Data Protection Impact Assessment
  dpoRequired: boolean('dpo_required').default(false),   // Data Protection Officer required
  breachNotificationHours: integer('breach_notification_hours'),  // 72 for GDPR
  description: text('description'),
  legalReference: text('legal_reference'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// compliance_jurisdiction_venture_status — Per-Venture Jurisdiction Status
export const jurisdictionVentureStatus = pgTable('compliance_jurisdiction_venture_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  jurisdictionId: uuid('jurisdiction_id').notNull().references(() => jurisdictions.id),
  status: jurisdictionStatusEnum('status').default('under_review'),
  // active | pending | suspended | prohibited | under_review
  operationalSince: timestamp('operational_since', { withTimezone: true }),
  licenseIds: uuid('license_ids').array(),
  restrictions: jsonb('restrictions'),
  notes: text('notes'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  nextReviewDate: timestamp('next_review_date', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureJurisdictionIdx: uniqueIndex('venture_jurisdiction_status_idx').on(table.ventureId, table.jurisdictionId),
}));

// compliance_calendar — Regulatory Deadlines & Renewals
export const complianceCalendar = pgTable('compliance_calendar', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id'),                         // null = platform-wide
  jurisdictionId: uuid('jurisdiction_id').references(() => jurisdictions.id),
  title: text('title').notNull(),
  description: text('description'),
  eventType: text('event_type').notNull(),
  // license_renewal | filing_deadline | audit_date | regulatory_change |
  // report_due | fee_payment | inspection | training_deadline
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  reminderDays: integer('reminder_days').array(),        // [90, 60, 30, 14, 7, 1]
  status: text('status').default('upcoming'),
  // upcoming | reminder_sent | in_progress | completed | overdue | cancelled
  assignedTo: uuid('assigned_to'),
  priority: text('priority').default('medium'),          // low | medium | high | critical
  recurring: boolean('recurring').default(false),
  recurrenceRule: text('recurrence_rule'),               // "FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=31"
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: uuid('completed_by'),
  attachments: jsonb('attachments'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dueDateIdx: index('compliance_calendar_due_date_idx').on(table.dueDate),
  statusIdx: index('compliance_calendar_status_idx').on(table.status),
}));

// compliance_filings — Regulatory Filing Records
export const complianceFilings = pgTable('compliance_filings', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  jurisdictionId: uuid('jurisdiction_id').references(() => jurisdictions.id),
  calendarEventId: uuid('calendar_event_id').references(() => complianceCalendar.id),
  filingType: text('filing_type').notNull(),
  // tax_return | activity_report | financial_statement | player_report |
  // suspicious_activity | license_renewal | audit_response | data_breach
  regulatoryBody: text('regulatory_body').notNull(),
  filingReference: text('filing_reference'),
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  status: text('status').default('pending'),
  // pending | preparing | review | submitted | acknowledged | rejected | overdue
  filedAt: timestamp('filed_at', { withTimezone: true }),
  filedBy: uuid('filed_by'),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  documents: jsonb('documents'),
  filingData: jsonb('filing_data'),                      // Structured filing data
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class JurisdictionService {
  // ── Jurisdiction Checks ──────────────────────────────────────────────
  checkJurisdiction(input: JurisdictionCheckInput): Promise<JurisdictionCheckResult>;
  getVentureJurisdictions(ventureId: string): Promise<JurisdictionVentureStatus[]>;
  getJurisdictionRequirements(jurisdictionCode: string, ventureType?: string): Promise<JurisdictionRequirement[]>;
  isOperational(ventureId: string, jurisdictionCode: string): Promise<boolean>;

  // ── Geo-Blocking ─────────────────────────────────────────────────────
  evaluateGeoAccess(ventureId: string, ipAddress: string, gpsCoords?: GpsCoordinates): Promise<GeoAccessResult>;
  configureGeoRule(input: GeoBlockInput): Promise<JurisdictionGeoRule>;
  detectVpn(ipAddress: string): Promise<VpnDetectionResult>;

  // ── Licensing ────────────────────────────────────────────────────────
  applyForLicense(input: LicenseApplicationInput): Promise<JurisdictionLicense>;
  renewLicense(licenseId: string): Promise<JurisdictionLicense>;
  getLicenses(ventureId: string, filters?: LicenseFilters): Promise<PaginatedResult<JurisdictionLicense>>;
  getExpiringLicenses(daysAhead: number): Promise<JurisdictionLicense[]>;

  // ── Age Verification ─────────────────────────────────────────────────
  verifyAge(input: AgeVerificationInput): Promise<AgeVerificationResult>;
  getAgeRequirement(jurisdictionCode: string, ventureType: string): Promise<AgeRequirement>;

  // ── Tax Rules ────────────────────────────────────────────────────────
  getTaxRules(jurisdictionCode: string, ventureType?: string): Promise<JurisdictionTaxRule[]>;
  calculateWithholding(amount: number, jurisdictionCode: string, taxType: string): Promise<WithholdingResult>;

  // ── Data Privacy ─────────────────────────────────────────────────────
  getDataRules(jurisdictionCode: string): Promise<JurisdictionDataRule[]>;
  checkDataResidency(dataCategory: string, storageRegion: string, jurisdictionCode: string): Promise<DataResidencyResult>;

  // ── Compliance Calendar ──────────────────────────────────────────────
  getCalendar(ventureId: string, dateRange: DateRange): Promise<ComplianceCalendarEvent[]>;
  addCalendarEvent(input: ComplianceCalendarInput): Promise<ComplianceCalendarEvent>;
  getUpcomingDeadlines(ventureId: string, daysAhead: number): Promise<ComplianceCalendarEvent[]>;
  recordFiling(input: ComplianceFilingInput): Promise<ComplianceFiling>;

  // ── Venture Status Management ────────────────────────────────────────
  activateVenture(ventureId: string, jurisdictionCode: string): Promise<JurisdictionVentureStatus>;
  suspendVenture(ventureId: string, jurisdictionCode: string, reason: string): Promise<JurisdictionVentureStatus>;
  reviewVentureStatus(ventureId: string, jurisdictionCode: string): Promise<JurisdictionVentureStatus>;
}
```

### Geo-Access Evaluation Flow

```
User Request (IP: 203.0.113.42, GPS: optional)
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ MaxMind GeoIP │────▶│ VPN/Proxy     │────▶│ Jurisdiction  │
│               │     │ Detection     │     │ Lookup        │
│ Resolve IP to │     │               │     │               │
│ country/state │     │ Check against │     │ Find matching │
│               │     │ known VPN/TOR │     │ geo rules     │
│ Result: US-NJ │     │ databases     │     │ (priority     │
│               │     │               │     │  ordered)     │
└───────────────┘     └───────┬───────┘     └───────┬───────┘
                              │                      │
                    ┌─────────┴─────────┐   ┌───────┴────────┐
                    │ VPN detected?     │   │ Rule action?   │
                    │                   │   │                │
                    │ YES → block/warn  │   │ allow → pass   │
                    │ NO  → continue    │   │ block → deny   │
                    └───────────────────┘   │ restrict → ᐩ  │
                                            │ age_gate → ᐩ  │
                                            └────────────────┘
                                                     │
                                            ┌────────▼────────┐
                                            │ If GPS provided,│
                                            │ cross-validate  │
                                            │ with IP location│
                                            │ (>50km = flag)  │
                                            └─────────────────┘
```

### Key Behaviors

1. **Hierarchical jurisdiction**: Rules cascade from country to state/province. State rules override country rules when more restrictive. For example, US federal allows online gambling, but California prohibits it.
2. **Multi-layer geo-blocking**: IP geolocation (MaxMind), VPN/proxy detection, GPS cross-validation (mobile), and address-based verification (KYC) are combined for accurate jurisdiction determination.
3. **License expiry tracking**: Licenses approaching expiry trigger escalating notifications at 90/60/30/14/7/1 days before expiry. Expired licenses automatically suspend venture operation in that jurisdiction.
4. **Age verification methods**: Each jurisdiction specifies acceptable age verification methods. Some accept self-declaration for initial access (with subsequent verification required), while others require immediate document-based proof.
5. **Data residency enforcement**: Before storing user data, the system checks whether the storage region is permitted for the user's jurisdiction. GDPR users' data must reside in EU/EEA regions or be covered by approved transfer mechanisms.
6. **Tax withholding**: For gambling winnings, the system automatically calculates and withholds applicable taxes (e.g., 24% federal + state tax for US winnings above $600).
7. **Compliance calendar automation**: Recurring regulatory deadlines (annual license renewals, quarterly filings, monthly reports) are auto-generated with configurable reminder schedules.

---

## Module: responsible-gaming

### Purpose

Implements comprehensive responsible gaming controls mandated by gambling regulators worldwide. Provides self-exclusion mechanisms, configurable deposit/loss/wager/time limits, reality check interventions, cooling-off periods, behavioral risk detection using AI-driven analysis, and manual/automated intervention triggers. This module is primarily used by **BetEdge** but certain components (spending limits, behavioral monitoring) apply to other ventures with transactional activity.

Responsible gaming is not just a regulatory requirement — it is a core ethical obligation. The system is designed to be **player-protective by default**: limits are easy to set and hard to remove, self-exclusion is immediate and irreversible (for permanent exclusions), and behavioral risk detection runs continuously in the background.

### Limit Enforcement Hierarchy

```
DEPOSIT LIMITS — Maximum amount a player can deposit
  ├── Daily limit   (resets at 00:00 player's timezone)
  ├── Weekly limit  (resets Monday 00:00)
  ├── Monthly limit (resets 1st of month 00:00)
  └── Enforcement: Most restrictive limit wins
       e.g., Daily: $100, Weekly: $500, Monthly: $1,000
       After depositing $100 today, daily limit blocks further deposits
       even though weekly ($400 remaining) and monthly ($900 remaining) allow it

LOSS LIMITS — Maximum net losses over a period
  ├── Daily / Weekly / Monthly / Yearly
  ├── Calculated as: deposits - withdrawals - current_balance_change
  └── Enforcement: Block wagers when loss limit would be exceeded

WAGER LIMITS — Maximum total wager amount
  ├── Per-bet maximum (single wager cap)
  ├── Daily / Weekly / Monthly aggregate
  └── Enforcement: Reject individual wagers or block new wagers

TIME LIMITS — Maximum session/daily gaming duration
  ├── Session limit (continuous play duration)
  ├── Daily limit (total minutes across all sessions)
  └── Enforcement: Force session end, show reality check, block new sessions

LIMIT CHANGE RULES (Player Protection)
  ├── Decreasing a limit → Effective IMMEDIATELY
  ├── Increasing a limit → Effective after COOLING-OFF PERIOD (24h–72h)
  ├── Removing a limit   → Effective after COOLING-OFF PERIOD (7 days)
  └── Rationale: Prevents impulsive decisions to chase losses
```

### Database Schema

```typescript
// compliance_player_protection_profiles — Player Protection Profile (one per user per venture)
export const playerProtectionProfiles = pgTable('compliance_player_protection_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  riskLevel: riskLevelEnum('risk_level').default('low'),
  // low | moderate | elevated | high | critical
  overallRiskScore: integer('overall_risk_score').default(0),  // 0-1000
  hasActiveLimits: boolean('has_active_limits').default(false),
  hasSelfExclusion: boolean('has_self_exclusion').default(false),
  hasCoolingOff: boolean('has_cooling_off').default(false),
  realityCheckEnabled: boolean('reality_check_enabled').default(true),
  realityCheckInterval: integer('reality_check_interval').default(60),  // Minutes
  totalDeposited: numeric('total_deposited', { precision: 19, scale: 4 }).default('0'),
  totalWithdrawn: numeric('total_withdrawn', { precision: 19, scale: 4 }).default('0'),
  totalWagered: numeric('total_wagered', { precision: 19, scale: 4 }).default('0'),
  totalWon: numeric('total_won', { precision: 19, scale: 4 }).default('0'),
  netPosition: numeric('net_position', { precision: 19, scale: 4 }).default('0'),
  totalSessionMinutes: integer('total_session_minutes').default(0),
  lastSessionAt: timestamp('last_session_at', { withTimezone: true }),
  lastDepositAt: timestamp('last_deposit_at', { withTimezone: true }),
  lastWithdrawalAt: timestamp('last_withdrawal_at', { withTimezone: true }),
  accountCreatedAt: timestamp('account_created_at', { withTimezone: true }),
  firstDepositAt: timestamp('first_deposit_at', { withTimezone: true }),
  lastRiskAssessmentAt: timestamp('last_risk_assessment_at', { withTimezone: true }),
  interventionCount: integer('intervention_count').default(0),
  acknowledgedResponsibleGaming: boolean('acknowledged_responsible_gaming').default(false),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userVentureIdx: uniqueIndex('player_protection_user_venture_idx').on(table.userId, table.ventureId),
  riskLevelIdx: index('player_protection_risk_level_idx').on(table.riskLevel),
}));

// compliance_deposit_limits — Deposit Limit Configurations
export const depositLimits = pgTable('compliance_deposit_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull(),
  profileId: uuid('profile_id').notNull().references(() => playerProtectionProfiles.id),
  period: limitPeriodEnum('period').notNull(),           // daily | weekly | monthly | yearly
  limitAmount: numeric('limit_amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  currentUsage: numeric('current_usage', { precision: 19, scale: 4 }).default('0'),
  remainingAmount: numeric('remaining_amount', { precision: 19, scale: 4 }).default('0'),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).defaultNow().notNull(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),
  previousLimit: numeric('previous_limit', { precision: 19, scale: 4 }),
  cooldownEndsAt: timestamp('cooldown_ends_at', { withTimezone: true }),  // Cooling period before limit decrease takes effect
  source: text('source').default('user'),  // user | operator | regulator | system
  status: text('status').default('active'),  // active | pending_decrease | suspended | expired
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userVentureIdx: index('deposit_limits_user_venture_idx').on(table.userId, table.ventureId),
  profileIdx: index('deposit_limits_profile_idx').on(table.profileId),
  periodIdx: index('deposit_limits_period_idx').on(table.period),
  statusIdx: index('deposit_limits_status_idx').on(table.status),
}));
```

---

*@mcv/compliance — Regulatory Compliance Domain Module*