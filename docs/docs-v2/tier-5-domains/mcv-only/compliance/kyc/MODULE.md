# @mcv/compliance/kyc — Know Your Customer Module

**Parent Package:** @mcv/compliance  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** MCV-ONLY  
**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Purpose

The `kyc` submodule implements a comprehensive Know Your Customer (KYC) identity verification system with tiered verification levels, automated document verification via OCR and NFC, biometric liveness detection, PEP (Politically Exposed Persons) and sanctions screening, composite risk scoring, and ongoing monitoring with document expiry tracking.

**KYC verification is the first gate in the compliance pipeline.** No user can access regulated features — deposits, withdrawals, wagering, trading, or crypto operations — without completing the appropriate KYC level for their jurisdiction and intended activity. The module orchestrates the full identity verification lifecycle from initial data collection through document verification, biometric checks, sanctions screening, risk assessment, and ongoing periodic re-verification.

### Why KYC Matters

| Concern | KYC Solution |
|---------|-------------|
| **Identity fraud** | Document OCR, NFC chip reading, biometric liveness detection |
| **Underage access** | Date of birth verification, cross-referencing government databases |
| **Sanctions evasion** | PEP/sanctions screening against OFAC, EU, UN, and other watchlists |
| **Regulatory compliance** | Tiered verification aligned to UKGC, MGA, FinCEN, FINTRAC requirements |
| **Money laundering** | Source of funds/wealth documentation for high-volume users |
| **Account takeover** | Biometric re-verification for sensitive operations |

### Venture Impact

- **BetEdge** — All players must complete KYC before placing wagers; level requirements vary by jurisdiction (Level 2 minimum for UK/UKGC, Level 3 for MGA)
- **SerpSpace / Full Gain** — Level 1 KYC for payment processing above $500/day
- **MCV Studios** — Level 1 KYC for creator payouts
- **Futurestate** — Level 2 KYC for crypto-related features (MiCA compliance)
- **EDGE Token** — Level 3 KYC for token purchases exceeding €1,000 (MiCA thresholds)

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CORE SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  kycService,                          // KYC verification orchestration
} from './service';

export type {
  InitiateKycInput,                    // Start a KYC verification flow
  DocumentVerificationInput,           // Submit identity document for verification
  LivenessCheckInput,                  // Initiate liveness/selfie check
  ManualReviewInput,                   // Submit manual review decision
  KycSearchFilters,                    // Search/filter KYC records
  ScreeningOptions,                    // PEP/sanctions screening options
  BatchScreeningResult,                // Batch screening result
  ExpiryCheckResult,                   // Document expiry check result
  RescreenResult,                      // Periodic rescreen result
} from './service';

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export {
  kycProfiles,                         // User KYC profiles table
  kycDocuments,                        // Uploaded identity documents
  kycVerifications,                    // Verification attempt records
  kycLivenessChecks,                   // Liveness/biometric checks
  kycRiskAssessments,                  // Risk scoring results
  kycPepScreenings,                    // PEP/sanctions screening results
  kycWatchlistHits,                    // Watchlist match records
  kycAuditLog,                         // KYC-specific audit trail (immutable)
} from './schema';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  kycVerificationLevelEnum,            // none | basic | standard | enhanced | premium
  kycStatusEnum,                       // pending | in_review | approved | rejected | expired | suspended
  kycDocumentTypeEnum,                 // passport | drivers_license | national_id | utility_bill | ...
  kycDocumentStatusEnum,               // uploaded | processing | verified | rejected | expired
} from './schema';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  KycVerificationLevel,               // 'none' | 'basic' | 'standard' | 'enhanced' | 'premium'
  KycStatus,                           // 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired' | 'suspended'
  KycDocumentType,                     // 'passport' | 'drivers_license' | 'national_id' | ...
  KycDocumentStatus,                   // 'uploaded' | 'processing' | 'verified' | 'rejected' | 'expired'
  KycRiskScore,                        // Composite risk score object
  PepScreeningResult,                  // PEP screening result with hits
  SanctionsHit,                        // Individual sanctions match
  LivenessResult,                      // Liveness check result
  VerificationResult,                  // Overall verification result
  KycDecision,                         // Final KYC decision (approve/reject/escalate)
  KycAddress,                          // Address structure
  DocumentOcrResult,                   // OCR extraction result
  DocumentNfcResult,                   // NFC chip read result
  DocumentVerificationResult,          // Provider verification result
  RiskFactor,                          // Individual risk factor
  PepScreeningHit,                     // PEP screening hit detail
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useKycProfile } from '../client/hooks/use-kyc-profile';
export { useKycVerification } from '../client/hooks/use-kyc-verification';
export { useKycDocumentUpload } from '../client/hooks/use-kyc-document-upload';
export { useKycLivenessCheck } from '../client/hooks/use-kyc-liveness-check';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { KycVerificationFlow } from '../client/components/kyc-verification-flow';
export { KycDocumentUploader } from '../client/components/kyc-document-uploader';
export { KycLivenessCapture } from '../client/components/kyc-liveness-capture';
export { KycStatusBadge } from '../client/components/kyc-status-badge';
export { KycAdminReviewPanel } from '../client/components/kyc-admin-review-panel';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  KYC_VERIFICATION_LEVELS,             // Level definitions with requirements
  KYC_DOCUMENT_TYPES,                  // Accepted document types per level
  KYC_EXPIRY_THRESHOLDS,              // Document expiry warning thresholds
  PEP_DATABASE_PROVIDERS,             // PEP screening provider list
  SANCTIONS_LIST_PROVIDERS,           // Sanctions list provider list
  SUPPORTED_ID_COUNTRIES,             // Countries with supported ID verification
} from '../constants';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              KYC SUBMODULE ARCHITECTURE                               │
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              ENTRY POINTS                                        │  │
│  │                                                                                  │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │  │
│  │  │ API Routes    │  │ Cron Jobs     │  │ Webhooks      │  │ NAOS Agents   │    │  │
│  │  │ /api/kyc/*    │  │ Expiry check  │  │ Onfido CB     │  │ Risk Analyst  │    │  │
│  │  │               │  │ Re-screening  │  │ Jumio CB      │  │ KYC Officer   │    │  │
│  │  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘    │  │
│  │          └──────────────────┴──────────────────┴───────────────────┘             │  │
│  └──────────────────────────────────────┬──────────────────────────────────────────┘  │
│                                         │                                             │
│  ┌──────────────────────────────────────▼──────────────────────────────────────────┐  │
│  │                              KYC SERVICE                                         │  │
│  │                                                                                  │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                     │  │
│  │  │ Verification   │  │ Document       │  │ Liveness       │                     │  │
│  │  │ Orchestrator   │  │ Processor      │  │ Checker        │                     │  │
│  │  │                │  │                │  │                │                     │  │
│  │  │ • Initiate     │  │ • OCR extract  │  │ • Selfie match │                     │  │
│  │  │ • Level calc   │  │ • NFC read     │  │ • Video live   │                     │  │
│  │  │ • State mgmt   │  │ • Cross-check  │  │ • 3D depth     │                     │  │
│  │  │ • Auto-decide  │  │ • Expiry track │  │ • Anti-spoof   │                     │  │
│  │  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘                     │  │
│  │           │                   │                    │                              │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                     │  │
│  │  │ PEP/Sanctions  │  │ Risk           │  │ Manual Review  │                     │  │
│  │  │ Screener       │  │ Scorer         │  │ Queue          │                     │  │
│  │  │                │  │                │  │                │                     │  │
│  │  │ • Fuzzy match  │  │ • Composite    │  │ • Admin UI     │                     │  │
│  │  │ • Multi-list   │  │ • Weighted     │  │ • Approve/Rej  │                     │  │
│  │  │ • Batch screen │  │ • Categories   │  │ • Escalation   │                     │  │
│  │  │ • Ongoing mon. │  │ • Thresholds   │  │ • Notes/Audit  │                     │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                     │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                             │
│  ┌──────────────────────────────────────▼──────────────────────────────────────────┐  │
│  │                          DATABASE (8 tables)                                      │  │
│  │                                                                                   │  │
│  │  kycProfiles │ kycDocuments │ kycVerifications │ kycLivenessChecks                │  │
│  │  kycRiskAssessments │ kycPepScreenings │ kycWatchlistHits │ kycAuditLog           │  │
│  │                                                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          EXTERNAL PROVIDERS                                       │  │
│  │                                                                                   │  │
│  │  Onfido          Jumio           Veriff          ComplyAdvantage    Dow Jones     │  │
│  │  (Doc verify,    (Doc verify,    (Doc verify,    (PEP/sanctions     (Watchlist    │  │
│  │   liveness)       liveness)       liveness)       screening)         data)        │  │
│  │                                                                                   │  │
│  │  Refinitiv       OFAC SDN        EU Sanctions    UN Consolidated   MaxMind       │  │
│  │  (World-Check)   (US list)       (EU list)       (UN list)         (GeoIP)       │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Verification Levels

The KYC system implements a tiered verification model. The required level is determined by the intersection of **jurisdiction requirements** and **intended activity**. Higher levels unlock greater transaction limits and access to more regulated features.

### Level Definitions

```
Level 0 — NONE (Unverified)
  ├── Can browse public content
  ├── Cannot transact (no deposits, withdrawals, wagers)
  ├── Required: email + phone verification (from @mcv/identity)
  └── Transaction limits: $0

Level 1 — BASIC
  ├── Can make small deposits (≤$500/day, ≤$2,000/month)
  ├── Required: Full name, date of birth, residential address
  ├── Verification: Database cross-reference (credit bureau, voter rolls)
  ├── Jurisdictions: Most US states, Canada (low-risk activities)
  ├── Turnaround: Instant (automated database check)
  └── Re-verification: Every 24 months

Level 2 — STANDARD
  ├── Can make medium deposits (≤$5,000/day, ≤$20,000/month)
  ├── Required: Government-issued photo ID (passport, DL, national ID)
  ├── Verification: Document OCR + database cross-check
  ├── Additional: Address proof (utility bill, bank statement ≤3 months old)
  ├── Jurisdictions: All regulated markets (default for BetEdge)
  ├── Turnaround: 5-30 minutes (automated) or 24-48h (manual review)
  └── Re-verification: Every 12 months or on document expiry

Level 3 — ENHANCED (Enhanced Due Diligence — EDD)
  ├── Can make large deposits (≤$50,000/day)
  ├── Required: Level 2 + biometric liveness check (selfie/video)
  ├── Verification: Document + liveness + source of funds declaration
  ├── Additional: PEP/sanctions screening, adverse media check
  ├── Jurisdictions: UK (UKGC), Malta (MGA), high-risk profiles
  ├── Turnaround: 30 minutes - 24 hours
  └── Re-verification: Every 6 months + continuous monitoring

Level 4 — PREMIUM (Institutional / VIP)
  ├── Unlimited transaction volume
  ├── Required: Level 3 + source of wealth documentation
  ├── Verification: Manual review by compliance officer
  ├── Additional: Ongoing enhanced monitoring, periodic re-verification
  ├── Jurisdictions: All jurisdictions, required for >$100K annual volume
  ├── Turnaround: 2-5 business days (manual review)
  └── Re-verification: Every 3 months + continuous monitoring
```

### Level Requirements Matrix

| Requirement | Level 0 | Level 1 | Level 2 | Level 3 | Level 4 |
|-------------|---------|---------|---------|---------|---------|
| Email verified | ✅ | ✅ | ✅ | ✅ | ✅ |
| Phone verified | ✅ | ✅ | ✅ | ✅ | ✅ |
| Full name | — | ✅ | ✅ | ✅ | ✅ |
| Date of birth | — | ✅ | ✅ | ✅ | ✅ |
| Residential address | — | ✅ | ✅ | ✅ | ✅ |
| Database check | — | ✅ | ✅ | ✅ | ✅ |
| Photo ID document | — | — | ✅ | ✅ | ✅ |
| Address proof document | — | — | ✅ | ✅ | ✅ |
| Liveness check | — | — | — | ✅ | ✅ |
| PEP/sanctions screening | — | — | — | ✅ | ✅ |
| Source of funds | — | — | — | ✅ | ✅ |
| Source of wealth | — | — | — | — | ✅ |
| Manual compliance review | — | — | — | — | ✅ |
| Continuous monitoring | — | — | — | ✅ | ✅ |

### Jurisdiction → Level Mapping

| Jurisdiction | BetEdge | SerpSpace | Futurestate | EDGE Token |
|--------------|---------|-----------|-------------|------------|
| US (most states) | Level 2 | Level 1 | Level 1 | Level 3 |
| UK (UKGC) | Level 3 | Level 1 | Level 2 | Level 3 |
| Malta (MGA) | Level 3 | Level 1 | Level 2 | Level 3 |
| Germany (GGL) | Level 2 | Level 1 | Level 2 | Level 3 |
| Ontario (AGCO) | Level 2 | Level 1 | Level 1 | Level 3 |
| Sweden (SGA) | Level 3 | Level 1 | Level 2 | Level 3 |
| Netherlands (KSA) | Level 3 | Level 1 | Level 2 | Level 3 |

---

## Interfaces & Types

### Core Types

```typescript
/** Address structure for KYC profiles */
interface KycAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2
}

/** OCR extraction result from document scanning */
interface DocumentOcrResult {
  extractedName: string;
  extractedDob: string;
  extractedDocNumber: string;
  extractedExpiry: string;
  extractedAddress?: KycAddress;
  confidence: number; // 0.0 - 1.0
  rawText?: string;
  processingTimeMs: number;
}

/** NFC chip read result (e-passports) */
interface DocumentNfcResult {
  chipAuthenticated: boolean;
  activeAuthentication: boolean;
  dataGroupsRead: string[]; // DG1, DG2, DG7, etc.
  mrzData: {
    documentType: string;
    issuingCountry: string;
    surname: string;
    givenNames: string;
    documentNumber: string;
    nationality: string;
    dateOfBirth: string;
    sex: string;
    expiryDate: string;
  };
  facialImage?: string; // Base64 encoded from DG2
  signatureImage?: string; // Base64 encoded from DG7
  certificateChain: string[];
}

/** Document verification result from external provider */
interface DocumentVerificationResult {
  provider: 'onfido' | 'jumio' | 'veriff' | 'manual';
  checkId: string;
  result: 'clear' | 'consider' | 'rejected';
  subResults: {
    documentAuthenticity: 'clear' | 'consider' | 'rejected';
    dataComparison: 'clear' | 'consider' | 'rejected';
    dataConsistency: 'clear' | 'consider' | 'rejected';
    visualAuthenticity: 'clear' | 'consider' | 'rejected';
    imageIntegrity: 'clear' | 'consider' | 'rejected';
    dataValidation: 'clear' | 'consider' | 'rejected';
  };
  breakdown: Record<string, unknown>;
  processingTimeMs: number;
}

/** Liveness check result */
interface LivenessResult {
  passed: boolean;
  livenessScore: number; // 0.0000 - 1.0000
  faceMatchScore: number; // 0.0000 - 1.0000
  spoofDetection: {
    isSpoof: boolean;
    confidence: number;
    method: '3d_depth' | 'challenge_response' | 'passive';
    detectedAttackTypes?: string[];
  };
  provider: 'onfido' | 'jumio' | 'facetec';
  checkId: string;
}

/** Individual risk factor in risk assessment */
interface RiskFactor {
  factor: string;
  score: number; // 0-1000
  weight: number; // 0.0 - 1.0
  details: string;
  category: 'country' | 'pep' | 'adverse_media' | 'transaction' | 'document' | 'velocity' | 'age';
}

/** PEP screening hit detail */
interface PepScreeningHit {
  id: string;
  name: string;
  matchScore: number; // 0.0000 - 1.0000
  listType: 'pep' | 'sanctions' | 'law_enforcement' | 'adverse_media';
  list: string; // 'OFAC SDN', 'EU Sanctions', 'World-Check', etc.
  details: string;
  entityType: 'individual' | 'organization' | 'vessel' | 'aircraft';
  aliases?: string[];
  dateOfBirth?: string;
  nationality?: string;
  position?: string;
  status: 'pending_review' | 'confirmed_match' | 'false_positive' | 'escalated';
  reviewedBy?: string;
  reviewedAt?: string;
}

/** Composite risk score */
interface KycRiskScore {
  overallScore: number; // 0-1000
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  countryRiskScore: number;
  activityRiskScore: number;
  profileRiskScore: number;
  recommendedLevel: KycVerificationLevel;
  recommendedAction: 'approve' | 'reject' | 'escalate' | 'enhanced_monitoring' | 'restrict';
  validUntil: Date;
}

/** KYC decision outcome */
interface KycDecision {
  decision: 'approve' | 'reject' | 'refer';
  level: KycVerificationLevel;
  reason: string;
  conditions?: string[];
  expiresAt: Date;
  reviewRequired: boolean;
}

/** Verification result (overall flow outcome) */
interface VerificationResult {
  verificationId: string;
  status: 'approved' | 'rejected' | 'in_review' | 'expired';
  level: KycVerificationLevel;
  decision: KycDecision;
  documentResults: DocumentVerificationResult[];
  livenessResult?: LivenessResult;
  screeningResult?: PepScreeningResult;
  riskScore: KycRiskScore;
  completedAt?: Date;
}

/** Sanctions screening result */
interface PepScreeningResult {
  screeningId: string;
  screeningType: 'pep' | 'sanctions' | 'adverse_media' | 'combined';
  provider: 'comply_advantage' | 'dow_jones' | 'refinitiv' | 'manual';
  totalHits: number;
  confirmedHits: number;
  falsePositives: number;
  pendingReview: number;
  overallResult: 'clear' | 'potential_match' | 'confirmed_match';
  hits: PepScreeningHit[];
  screenedAt: Date;
  nextScreeningDate: Date;
}
```

### Service Input Types

```typescript
/** Input for initiating KYC verification */
interface InitiateKycInput {
  userId: string;
  ventureId: string;
  targetLevel: KycVerificationLevel;
  jurisdiction: string; // ISO code
  personalInfo?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string; // YYYY-MM-DD
    nationality: string;
    address: KycAddress;
    phoneNumber?: string;
    taxIdentificationNumber?: string;
    occupation?: string;
    employerName?: string;
    annualIncome?: string;
  };
  sourceOfFunds?: string;
  sourceOfWealth?: string;
  metadata?: Record<string, unknown>;
}

/** Input for document verification */
interface DocumentVerificationInput {
  kycProfileId: string;
  verificationId: string;
  documentType: KycDocumentType;
  frontImage: File | Buffer;
  backImage?: File | Buffer;
  issuingCountry: string;
  metadata?: Record<string, unknown>;
}

/** Input for liveness check */
interface LivenessCheckInput {
  kycProfileId: string;
  verificationId: string;
  checkType: 'selfie_match' | 'video_liveness' | '3d_liveness';
  selfieImage?: File | Buffer;
  videoData?: File | Buffer;
  referenceDocumentId: string;
  deviceInfo?: {
    platform: string;
    osVersion: string;
    appVersion: string;
    cameraType: string;
  };
}

/** Input for manual review */
interface ManualReviewInput {
  verificationId: string;
  decision: 'approve' | 'reject' | 'escalate';
  reviewedBy: string;
  notes: string;
  conditions?: string[];
  overrideLevel?: KycVerificationLevel;
  rejectionReason?: string;
}

/** Filters for searching KYC records */
interface KycSearchFilters {
  status?: KycStatus | KycStatus[];
  verificationLevel?: KycVerificationLevel | KycVerificationLevel[];
  riskCategory?: string | string[];
  pepStatus?: boolean;
  sanctionsStatus?: boolean;
  dateRange?: { start: Date; end: Date };
  expiringBefore?: Date;
  pendingReview?: boolean;
  searchTerm?: string; // Name, email, document number
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

---

## Database Schema

### compliance_kyc_profiles — User KYC Profile

One profile per user per venture. Contains personal information, verification status, risk scoring, and monitoring state.

```typescript
export const kycProfiles = pgTable('compliance_kyc_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Verification state
  verificationLevel: kycVerificationLevelEnum('verification_level').default('none'),
  status: kycStatusEnum('status').default('pending'),
  
  // Personal information (PII — encrypted at rest)
  firstName: text('first_name'),
  lastName: text('last_name'),
  dateOfBirth: date('date_of_birth'),
  nationality: text('nationality'),                      // ISO 3166-1 alpha-2
  countryOfResidence: text('country_of_residence'),      // ISO 3166-1 alpha-2
  address: jsonb('address').$type<KycAddress>(),
  taxIdentificationNumber: text('tax_identification_number'),  // Encrypted
  phoneNumber: text('phone_number'),                     // Encrypted
  emailVerified: boolean('email_verified').default(false),
  phoneVerified: boolean('phone_verified').default(false),
  
  // Risk assessment
  riskScore: integer('risk_score'),                      // 0-1000 (higher = riskier)
  riskCategory: text('risk_category'),                   // low | medium | high | critical
  pepStatus: boolean('pep_status').default(false),
  sanctionsStatus: boolean('sanctions_status').default(false),
  adverseMediaFlag: boolean('adverse_media_flag').default(false),
  
  // Enhanced due diligence fields
  sourceOfFunds: text('source_of_funds'),
  sourceOfWealth: text('source_of_wealth'),
  occupation: text('occupation'),
  employerName: text('employer_name'),
  annualIncome: text('annual_income'),                   // Range bracket
  
  // Lifecycle timestamps
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
```

### compliance_kyc_documents — Uploaded Identity Documents

```typescript
export const kycDocuments = pgTable('compliance_kyc_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  kycProfileId: uuid('kyc_profile_id').notNull().references(() => kycProfiles.id, { onDelete: 'cascade' }),
  
  // Document identification
  documentType: kycDocumentTypeEnum('document_type').notNull(),
  status: kycDocumentStatusEnum('status').default('uploaded'),
  documentNumber: text('document_number'),               // Encrypted — passport/DL number
  issuingCountry: text('issuing_country'),               // ISO 3166-1 alpha-2
  issuingAuthority: text('issuing_authority'),
  issueDate: date('issue_date'),
  expiryDate: date('expiry_date'),
  
  // Document images (encrypted storage URLs)
  frontImageUrl: text('front_image_url').notNull(),
  backImageUrl: text('back_image_url'),
  
  // Verification results
  ocrData: jsonb('ocr_data').$type<DocumentOcrResult>(),
  nfcData: jsonb('nfc_data').$type<DocumentNfcResult>(),
  verificationResult: jsonb('verification_result').$type<DocumentVerificationResult>(),
  verificationProvider: text('verification_provider'),   // onfido | jumio | veriff | manual
  
  // Review state
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
```

### compliance_kyc_verifications — Verification Attempt Records

```typescript
export const kycVerifications = pgTable('compliance_kyc_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  kycProfileId: uuid('kyc_profile_id').notNull().references(() => kycProfiles.id, { onDelete: 'cascade' }),
  
  // Verification target
  targetLevel: kycVerificationLevelEnum('target_level').notNull(),
  status: text('status').default('initiated'),
  // initiated | documents_submitted | liveness_pending | screening_pending |
  // in_review | approved | rejected | expired | cancelled
  
  // Timestamps
  initiatedAt: timestamp('initiated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),  // Verification attempt TTL (24h)
  
  // Linked records
  documentIds: uuid('document_ids').array(),
  livenessCheckId: uuid('liveness_check_id'),
  pepScreeningId: uuid('pep_screening_id'),
  riskAssessmentId: uuid('risk_assessment_id'),
  
  // Results
  overallResult: text('overall_result'),                 // pass | fail | refer
  failureReasons: jsonb('failure_reasons'),
  
  // Review
  reviewedBy: uuid('reviewed_by'),
  reviewNotes: text('review_notes'),
  externalCheckId: text('external_check_id'),
  provider: text('provider'),
  providerResponse: jsonb('provider_response'),          // Encrypted
  
  // Client info
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  profileIdx: index('kyc_verifications_profile_idx').on(table.kycProfileId),
  statusIdx: index('kyc_verifications_status_idx').on(table.status),
}));
```

### compliance_kyc_liveness_checks — Biometric Liveness Checks

```typescript
export const kycLivenessChecks = pgTable('compliance_kyc_liveness_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  kycProfileId: uuid('kyc_profile_id').notNull().references(() => kycProfiles.id, { onDelete: 'cascade' }),
  verificationId: uuid('verification_id').references(() => kycVerifications.id),
  
  // Check details
  status: text('status').default('pending'),
  // pending | processing | passed | failed | expired
  checkType: text('check_type').notNull(),               // selfie_match | video_liveness | 3d_liveness
  
  // Biometric data (encrypted)
  selfieImageUrl: text('selfie_image_url'),
  videoUrl: text('video_url'),
  referenceDocumentId: uuid('reference_document_id'),
  
  // Scoring
  livenessScore: numeric('liveness_score', { precision: 5, scale: 4 }),
  faceMatchScore: numeric('face_match_score', { precision: 5, scale: 4 }),
  livenessThreshold: numeric('liveness_threshold', { precision: 5, scale: 4 }).default('0.8000'),
  faceMatchThreshold: numeric('face_match_threshold', { precision: 5, scale: 4 }).default('0.8500'),
  
  // Anti-spoofing
  spoofDetection: jsonb('spoof_detection'),
  // { isSpoof: false, confidence: 0.99, method: '3d_depth' }
  
  // Provider details
  provider: text('provider'),                            // onfido | jumio | facetec
  providerCheckId: text('provider_check_id'),
  providerResponse: jsonb('provider_response'),          // Encrypted
  
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ipAddress: text('ip_address'),
  deviceInfo: jsonb('device_info'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### compliance_kyc_risk_assessments — Risk Scoring Results

```typescript
export const kycRiskAssessments = pgTable('compliance_kyc_risk_assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  kycProfileId: uuid('kyc_profile_id').notNull().references(() => kycProfiles.id, { onDelete: 'cascade' }),
  verificationId: uuid('verification_id').references(() => kycVerifications.id),
  
  // Scores
  overallScore: integer('overall_score').notNull(),      // 0-1000
  riskCategory: text('risk_category').notNull(),         // low | medium | high | critical
  factors: jsonb('factors').$type<RiskFactor[]>().notNull(),
  countryRiskScore: integer('country_risk_score'),
  activityRiskScore: integer('activity_risk_score'),
  profileRiskScore: integer('profile_risk_score'),
  
  // Recommendations
  recommendedLevel: kycVerificationLevelEnum('recommended_level'),
  recommendedAction: text('recommended_action'),
  // approve | reject | escalate | enhanced_monitoring | restrict
  
  assessedAt: timestamp('assessed_at', { withTimezone: true }).defaultNow().notNull(),
  assessedBy: text('assessed_by'),                       // 'system' | user_id
  validUntil: timestamp('valid_until', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### compliance_kyc_pep_screenings — PEP/Sanctions Screening

```typescript
export const kycPepScreenings = pgTable('compliance_kyc_pep_screenings', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  kycProfileId: uuid('kyc_profile_id').notNull().references(() => kycProfiles.id, { onDelete: 'cascade' }),
  
  // Screening configuration
  screeningType: text('screening_type').notNull(),       // pep | sanctions | adverse_media | combined
  provider: text('provider').notNull(),                  // comply_advantage | dow_jones | refinitiv | manual
  providerReferenceId: text('provider_reference_id'),
  searchParameters: jsonb('search_parameters'),
  
  // Results
  totalHits: integer('total_hits').default(0),
  confirmedHits: integer('confirmed_hits').default(0),
  falsePositives: integer('false_positives').default(0),
  pendingReview: integer('pending_review').default(0),
  overallResult: text('overall_result'),                 // clear | potential_match | confirmed_match
  hits: jsonb('hits').$type<PepScreeningHit[]>(),
  
  // Review lifecycle
  screenedAt: timestamp('screened_at', { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: uuid('reviewed_by'),
  reviewNotes: text('review_notes'),
  nextScreeningDate: timestamp('next_screening_date', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### compliance_kyc_watchlist_hits — Individual Watchlist Match Records

```typescript
export const kycWatchlistHits = pgTable('compliance_kyc_watchlist_hits', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  screeningId: uuid('screening_id').notNull().references(() => kycPepScreenings.id, { onDelete: 'cascade' }),
  kycProfileId: uuid('kyc_profile_id').notNull(),
  
  // Match details
  listName: text('list_name').notNull(),                 // OFAC SDN | EU Sanctions | UN Consolidated | PEP List
  listCategory: text('list_category').notNull(),         // sanctions | pep | law_enforcement | adverse_media
  matchedName: text('matched_name').notNull(),
  matchScore: numeric('match_score', { precision: 5, scale: 4 }).notNull(),
  matchType: text('match_type'),                         // exact | fuzzy | alias | partial
  entityType: text('entity_type'),                       // individual | organization | vessel | aircraft
  details: jsonb('details'),
  
  // Disposition
  status: text('status').default('pending_review'),
  // pending_review | confirmed_match | false_positive | escalated
  disposition: text('disposition'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### compliance_kyc_audit_log — Immutable Audit Trail

```typescript
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

---

## Core Service Interface

```typescript
export class KycService {
  // ── Verification Flow ────────────────────────────────────────────────
  
  /** Initiate a KYC verification flow for a user */
  initiateVerification(input: InitiateKycInput): Promise<KycVerification>;
  
  /** Determine the required KYC level based on jurisdiction and venture */
  getRequiredLevel(userId: string, ventureId: string, jurisdiction: string): Promise<KycVerificationLevel>;
  
  /** Get the user's current verified KYC level */
  getCurrentLevel(userId: string, ventureId: string): Promise<KycVerificationLevel>;

  // ── Document Verification ────────────────────────────────────────────
  
  /** Upload and process an identity document */
  uploadDocument(input: DocumentVerificationInput): Promise<KycDocument>;
  
  /** Verify an uploaded document via OCR + provider check */
  verifyDocument(documentId: string): Promise<DocumentVerificationResult>;
  
  /** Reject a document during manual review */
  rejectDocument(documentId: string, reason: string, reviewedBy: string): Promise<KycDocument>;

  // ── Liveness Check ───────────────────────────────────────────────────
  
  /** Initiate a biometric liveness check */
  initiateLivenessCheck(input: LivenessCheckInput): Promise<KycLivenessCheck>;
  
  /** Process liveness result from provider callback */
  processLivenessResult(checkId: string, providerResult: ProviderLivenessResult): Promise<KycLivenessCheck>;

  // ── PEP/Sanctions Screening ──────────────────────────────────────────
  
  /** Screen a user against PEP and sanctions databases */
  screenPepSanctions(kycProfileId: string, options?: ScreeningOptions): Promise<KycPepScreening>;
  
  /** Review and disposition a watchlist hit */
  reviewWatchlistHit(
    hitId: string,
    disposition: 'confirmed_match' | 'false_positive',
    notes: string,
    reviewedBy: string
  ): Promise<KycWatchlistHit>;
  
  /** Run batch screening for all profiles in a venture */
  runBatchScreening(ventureId: string): Promise<BatchScreeningResult>;

  // ── Risk Assessment ──────────────────────────────────────────────────
  
  /** Calculate composite risk score for a KYC profile */
  assessRisk(kycProfileId: string): Promise<KycRiskAssessment>;
  
  /** Get current KYC profile for a user */
  getProfile(userId: string, ventureId: string): Promise<KycProfile | null>;

  // ── Manual Review ────────────────────────────────────────────────────
  
  /** Submit a manual review decision */
  submitManualReview(input: ManualReviewInput): Promise<KycVerification>;
  
  /** Get the review queue with filters */
  getReviewQueue(ventureId: string, filters?: KycSearchFilters): Promise<PaginatedResult<KycVerification>>;

  // ── Ongoing Monitoring ───────────────────────────────────────────────
  
  /** Check for expiring documents across a venture */
  checkDocumentExpiry(ventureId: string): Promise<ExpiryCheckResult[]>;
  
  /** Trigger periodic PEP/sanctions rescreening */
  triggerPeriodicRescreen(ventureId: string): Promise<RescreenResult>;
  
  /** Get profiles with documents expiring within N days */
  getExpiringProfiles(ventureId: string, daysAhead: number): Promise<KycProfile[]>;
}
```

---

## Verification Flow State Machine

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

---

## Risk Scoring Model

The KYC risk scoring model produces a composite score from 0–1000 based on weighted factors. Scores drive automated decisions and monitoring intensity.

### Scoring Factors

| Factor | Weight | Score Range | Description |
|--------|--------|-------------|-------------|
| **Country Risk** | 25% | 0-1000 | Based on FATF/Transparency International ratings for user's country of residence and nationality |
| **PEP Status** | 20% | 0 or 400-800 | Politically Exposed Person match; score varies by position level and proximity |
| **Adverse Media** | 15% | 0-600 | Negative news coverage related to financial crime, fraud, or corruption |
| **Transaction Volume** | 15% | 0-500 | Deposit/withdrawal volumes relative to declared income and peer benchmarks |
| **Document Quality** | 10% | 0-300 | OCR confidence, document condition, consistency between documents |
| **Velocity** | 10% | 0-500 | Account creation patterns, multiple accounts, rapid activity changes |
| **Age Bracket** | 5% | 0-200 | Statistical risk by age group (18-21 and 65+ slightly elevated) |

### Risk Categories

| Score Range | Category | Action |
|-------------|----------|--------|
| 0–199 | **Low** | Auto-approve, standard monitoring |
| 200–399 | **Medium** | Auto-approve with enhanced monitoring, quarterly rescreen |
| 400–599 | **High** | Manual review required, monthly rescreen, transaction limits |
| 600–799 | **Critical** | Senior compliance review, restricted access, continuous monitoring |
| 800–1000 | **Blocked** | Account suspension pending investigation, regulatory notification |

### Risk Score Calculation Example

```typescript
// Risk assessment for a user from a high-risk jurisdiction with PEP match
const riskFactors: RiskFactor[] = [
  {
    factor: 'country_risk',
    score: 350,
    weight: 0.25,
    details: 'Country of residence: Nigeria (FATF Grey List)',
    category: 'country',
  },
  {
    factor: 'pep_status',
    score: 600,
    weight: 0.20,
    details: 'PEP match: State Governor, confirmed active position',
    category: 'pep',
  },
  {
    factor: 'adverse_media',
    score: 200,
    weight: 0.15,
    details: 'Two articles mentioning government contract disputes (2024)',
    category: 'adverse_media',
  },
  {
    factor: 'transaction_volume',
    score: 100,
    weight: 0.15,
    details: 'Declared income: $50K-100K, deposits consistent',
    category: 'transaction',
  },
  {
    factor: 'document_quality',
    score: 50,
    weight: 0.10,
    details: 'Passport: clear scan, OCR confidence 0.97',
    category: 'document',
  },
  {
    factor: 'velocity',
    score: 0,
    weight: 0.10,
    details: 'Single account, no unusual patterns',
    category: 'velocity',
  },
  {
    factor: 'age_bracket',
    score: 0,
    weight: 0.05,
    details: 'Age 45 — normal risk bracket',
    category: 'age',
  },
];

// Weighted calculation:
// (350 × 0.25) + (600 × 0.20) + (200 × 0.15) + (100 × 0.15) + (50 × 0.10) + (0 × 0.10) + (0 × 0.05)
// = 87.5 + 120 + 30 + 15 + 5 + 0 + 0 = 257.5 → rounded to 258
// Category: MEDIUM → enhanced monitoring, quarterly rescreen
```

---

## Code Examples

### Example 1: Initiate KYC Verification

```typescript
import { kycService } from '@mcv/compliance';

// Initiate Level 2 (Standard) verification for a BetEdge user
const verification = await kycService.initiateVerification({
  userId: 'usr_abc123',
  ventureId: 'ven_betedge',
  targetLevel: 'standard',
  jurisdiction: 'US-NJ',
  personalInfo: {
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1990-05-15',
    nationality: 'US',
    address: {
      line1: '123 Main Street',
      line2: 'Apt 4B',
      city: 'Newark',
      state: 'NJ',
      postalCode: '07102',
      country: 'US',
    },
    occupation: 'Software Engineer',
    annualIncome: '$75,000 - $100,000',
  },
});

console.log(verification);
// {
//   id: 'ver_xyz789',
//   kycProfileId: 'kyc_prof_456',
//   targetLevel: 'standard',
//   status: 'initiated',
//   expiresAt: '2026-02-09T15:00:00Z', // 24h TTL
//   requiredSteps: ['document_upload', 'address_proof'],
//   completedSteps: [],
// }
```

### Example 2: Upload and Verify Document

```typescript
import { kycService } from '@mcv/compliance';

// Upload a passport for verification
const document = await kycService.uploadDocument({
  kycProfileId: 'kyc_prof_456',
  verificationId: 'ver_xyz789',
  documentType: 'passport',
  frontImage: passportImageBuffer,
  issuingCountry: 'US',
});

console.log(document);
// {
//   id: 'doc_111',
//   documentType: 'passport',
//   status: 'processing',
//   ocrData: null,        // Processing async
//   verificationResult: null,
// }

// Provider callback triggers document verification
const result = await kycService.verifyDocument(document.id);

console.log(result);
// {
//   provider: 'onfido',
//   checkId: 'chk_onfido_abc',
//   result: 'clear',
//   subResults: {
//     documentAuthenticity: 'clear',
//     dataComparison: 'clear',
//     dataConsistency: 'clear',
//     visualAuthenticity: 'clear',
//     imageIntegrity: 'clear',
//     dataValidation: 'clear',
//   },
//   breakdown: { ... },
//   processingTimeMs: 12400,
// }
```

### Example 3: Liveness Check

```typescript
import { kycService } from '@mcv/compliance';

// Initiate liveness check for Enhanced (Level 3) verification
const livenessCheck = await kycService.initiateLivenessCheck({
  kycProfileId: 'kyc_prof_456',
  verificationId: 'ver_xyz789',
  checkType: '3d_liveness',
  selfieImage: selfieBuffer,
  referenceDocumentId: 'doc_111', // Passport to compare against
  deviceInfo: {
    platform: 'iOS',
    osVersion: '17.3',
    appVersion: '2.1.0',
    cameraType: 'TrueDepth',
  },
});

// After provider processes the check:
console.log(livenessCheck);
// {
//   id: 'lv_check_222',
//   status: 'passed',
//   livenessScore: 0.9700,
//   faceMatchScore: 0.9200,
//   spoofDetection: {
//     isSpoof: false,
//     confidence: 0.99,
//     method: '3d_depth',
//   },
//   provider: 'facetec',
// }
```

### Example 4: PEP/Sanctions Screening

```typescript
import { kycService } from '@mcv/compliance';

// Screen a user against PEP and sanctions databases
const screening = await kycService.screenPepSanctions('kyc_prof_456', {
  screeningType: 'combined',
  provider: 'comply_advantage',
  fuzziness: 0.85,
  includeAdverseMedia: true,
});

console.log(screening);
// {
//   screeningId: 'scr_333',
//   screeningType: 'combined',
//   provider: 'comply_advantage',
//   totalHits: 2,
//   confirmedHits: 0,
//   falsePositives: 0,
//   pendingReview: 2,
//   overallResult: 'potential_match',
//   hits: [
//     {
//       id: 'hit_1',
//       name: 'John S. Smith',
//       matchScore: 0.92,
//       listType: 'pep',
//       list: 'World-Check',
//       details: 'Former City Councilman, Newark NJ (2018-2022)',
//       entityType: 'individual',
//       status: 'pending_review',
//     },
//     {
//       id: 'hit_2',
//       name: 'John Smith',
//       matchScore: 0.78,
//       listType: 'adverse_media',
//       list: 'LexisNexis Media',
//       details: 'Mentioned in local news re: campaign finance inquiry',
//       entityType: 'individual',
//       status: 'pending_review',
//     },
//   ],
//   nextScreeningDate: '2026-05-08T00:00:00Z', // 90 days
// }

// Compliance officer reviews hit #1
await kycService.reviewWatchlistHit(
  'hit_1',
  'false_positive',
  'Different individual — our user is age 35, PEP match is age 62. Confirmed via DOB cross-reference.',
  'admin_compliance_officer_1'
);
```

### Example 5: Risk Assessment

```typescript
import { kycService } from '@mcv/compliance';

// Run risk assessment for a KYC profile
const riskAssessment = await kycService.assessRisk('kyc_prof_456');

console.log(riskAssessment);
// {
//   id: 'ra_444',
//   overallScore: 145,
//   riskCategory: 'low',
//   factors: [
//     { factor: 'country_risk', score: 50, weight: 0.25, details: 'US — low risk', category: 'country' },
//     { factor: 'pep_status', score: 0, weight: 0.20, details: 'No confirmed PEP match', category: 'pep' },
//     { factor: 'adverse_media', score: 0, weight: 0.15, details: 'No adverse media found', category: 'adverse_media' },
//     { factor: 'transaction_volume', score: 100, weight: 0.15, details: 'Within normal range', category: 'transaction' },
//     { factor: 'document_quality', score: 30, weight: 0.10, details: 'Clear passport scan, OCR confidence 0.97', category: 'document' },
//     { factor: 'velocity', score: 0, weight: 0.10, details: 'No anomalies detected', category: 'velocity' },
//     { factor: 'age_bracket', score: 0, weight: 0.05, details: 'Age 35 — low risk bracket', category: 'age' },
//   ],
//   recommendedLevel: 'standard',
//   recommendedAction: 'approve',
//   validUntil: '2026-05-08T00:00:00Z',
// }
```

### Example 6: Document Expiry Monitoring (Cron Job)

```typescript
import { kycService } from '@mcv/compliance';

// Run daily document expiry check
const expiryResults = await kycService.checkDocumentExpiry('ven_betedge');

console.log(expiryResults);
// [
//   {
//     profileId: 'kyc_prof_789',
//     userId: 'usr_def456',
//     documentId: 'doc_expired_1',
//     documentType: 'passport',
//     expiryDate: '2026-02-22',
//     daysUntilExpiry: 14,
//     action: 'notification_sent',  // 14-day warning
//     notificationType: 'email',
//   },
//   {
//     profileId: 'kyc_prof_012',
//     userId: 'usr_ghi789',
//     documentId: 'doc_expired_2',
//     documentType: 'drivers_license',
//     expiryDate: '2026-02-01',
//     daysUntilExpiry: -7,           // Already expired
//     action: 'profile_suspended',
//     suspensionReason: 'Document expired — re-verification required',
//   },
// ]
```

### Example 7: Admin Manual Review

```typescript
import { kycService } from '@mcv/compliance';

// Get the review queue
const queue = await kycService.getReviewQueue('ven_betedge', {
  status: ['in_review'],
  riskCategory: ['high', 'critical'],
  sortBy: 'createdAt',
  sortOrder: 'asc',
  limit: 20,
});

// Submit manual review decision
const reviewed = await kycService.submitManualReview({
  verificationId: queue.items[0].id,
  decision: 'approve',
  reviewedBy: 'admin_senior_compliance',
  notes: 'PEP hit confirmed as false positive (different individual). Source of funds declaration consistent with employment records. Approved for Level 3.',
  conditions: ['Enhanced monitoring — quarterly rescreen required'],
});

console.log(reviewed.status); // 'approved'
console.log(reviewed.overallResult); // 'pass'
```

### Example 8: React Component — KYC Verification Flow

```tsx
import {
  KycVerificationFlow,
  useKycProfile,
  useKycVerification,
  KycStatusBadge,
} from '@mcv/compliance';

function UserKycPage() {
  const { profile, isLoading } = useKycProfile();
  const { startVerification, verification } = useKycVerification();

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h2>Identity Verification</h2>
      <KycStatusBadge
        level={profile?.verificationLevel ?? 'none'}
        status={profile?.status ?? 'pending'}
      />

      {profile?.verificationLevel === 'none' && (
        <Button onClick={() => startVerification({ targetLevel: 'standard' })}>
          Start Verification
        </Button>
      )}

      {verification && (
        <KycVerificationFlow
          verificationId={verification.id}
          targetLevel={verification.targetLevel}
          onComplete={(result) => {
            if (result.status === 'approved') {
              toast.success('Verification complete!');
            }
          }}
          onError={(error) => toast.error(error.message)}
        />
      )}
    </div>
  );
}
```

---

## Key Behaviors

1. **Tiered verification**: The required KYC level is determined by the intersection of jurisdiction requirements and intended activity (e.g., BetEdge UK requires Level 3, SerpSpace US requires Level 1). The system automatically determines the minimum required level and guides users through the appropriate flow.

2. **Document OCR**: All uploaded documents are processed through OCR to extract name, DOB, document number, and expiry date. Extracted data is cross-referenced against the user's profile for consistency. NFC chip reading is supported for e-passports, providing cryptographically verified data.

3. **Liveness anti-spoofing**: Liveness checks use 3D depth analysis (where supported) or challenge-response video to detect photo/video attacks, masks, and deepfakes. Minimum thresholds: liveness score ≥ 0.80, face match score ≥ 0.85. Failed checks allow up to 3 retry attempts before requiring manual review.

4. **PEP screening cadence**: Initial screening on verification, then rescreening every 90 days for standard profiles and every 30 days for high-risk profiles. Screening uses fuzzy name matching with configurable thresholds (default: 0.85). Batch rescreening runs as a daily cron job.

5. **Risk scoring model**: Composite score (0–1000) calculated from 7 weighted factors. Scores above 400 trigger manual review. Scores above 600 trigger enhanced monitoring and restricted access. Risk scores are recalculated on every significant event (new transaction, screening result, document change).

6. **Document expiry tracking**: Documents approaching expiry trigger automated notifications at 30/14/7/1 day intervals. Expired documents automatically suspend the KYC profile, blocking regulated activities until re-verification is completed. Users receive email and in-app notifications.

7. **Immutable audit trail**: Every KYC action (verification initiated, document reviewed, level changed, status updated, screening result) is logged to the immutable audit log with the actor ID, timestamp, IP address, user agent, and before/after values. Audit logs cannot be updated or deleted.

8. **Data encryption**: All PII fields (name, DOB, address, document numbers, phone, TIN) are encrypted at rest using AES-256-GCM. Document images are stored in encrypted S3 buckets with server-side encryption. Access to decrypted data requires compliance officer permissions.

9. **Provider failover**: If the primary verification provider (e.g., Onfido) is unavailable, the system automatically fails over to the secondary provider (e.g., Jumio). Provider responses are normalized to a common format for consistent downstream processing.

10. **Verification attempt TTL**: Each verification attempt has a 24-hour time-to-live. If the user doesn't complete all required steps within 24 hours, the attempt expires and must be restarted. This prevents stale verification states.

---

## Audit Events

| Event | Severity | Data Captured |
|-------|----------|---------------|
| `kyc.profile.created` | info | userId, ventureId, initialLevel |
| `kyc.verification.initiated` | info | verificationId, targetLevel, jurisdiction |
| `kyc.verification.completed` | info | verificationId, result, level, duration |
| `kyc.verification.expired` | warning | verificationId, targetLevel, reason |
| `kyc.document.uploaded` | info | documentId, documentType, issuingCountry |
| `kyc.document.verified` | info | documentId, provider, result, confidence |
| `kyc.document.rejected` | warning | documentId, reason, reviewedBy |
| `kyc.document.expired` | warning | documentId, expiryDate, profileSuspended |
| `kyc.liveness.passed` | info | checkId, livenessScore, faceMatchScore |
| `kyc.liveness.failed` | warning | checkId, livenessScore, faceMatchScore, reason |
| `kyc.screening.completed` | info | screeningId, type, totalHits, result |
| `kyc.screening.match_found` | warning | screeningId, hitId, listName, matchScore |
| `kyc.watchlist_hit.reviewed` | info | hitId, disposition, reviewedBy |
| `kyc.risk.assessed` | info | assessmentId, overallScore, riskCategory |
| `kyc.risk.elevated` | warning | profileId, previousCategory, newCategory, score |
| `kyc.level.changed` | info | profileId, previousLevel, newLevel, reason |
| `kyc.status.changed` | info | profileId, previousStatus, newStatus |
| `kyc.profile.suspended` | warning | profileId, reason, suspendedBy |
| `kyc.profile.reactivated` | info | profileId, reactivatedBy |
| `kyc.manual_review.submitted` | info | verificationId, decision, reviewedBy |
| `kyc.batch_screening.completed` | info | ventureId, totalScreened, matchesFound |

---

## Error Codes

| Code | HTTP Status | Description | User Message |
|------|-------------|-------------|--------------|
| `KYC_PROFILE_NOT_FOUND` | 404 | KYC profile does not exist | Profile not found |
| `KYC_VERIFICATION_IN_PROGRESS` | 409 | An active verification already exists | Verification already in progress |
| `KYC_VERIFICATION_EXPIRED` | 410 | Verification attempt has expired (24h TTL) | Verification expired — please restart |
| `KYC_LEVEL_ALREADY_MET` | 409 | User already meets or exceeds the target level | You are already verified at this level |
| `KYC_DOCUMENT_INVALID` | 400 | Document could not be processed (corrupt, unreadable) | Please upload a clear photo of your document |
| `KYC_DOCUMENT_EXPIRED` | 400 | Submitted document has expired | This document has expired |
| `KYC_DOCUMENT_MISMATCH` | 400 | OCR data does not match profile information | Document details do not match your profile |
| `KYC_DOCUMENT_UNSUPPORTED` | 400 | Document type not accepted for this jurisdiction | This document type is not accepted |
| `KYC_LIVENESS_FAILED` | 400 | Liveness check did not pass minimum thresholds | Verification failed — please try again |
| `KYC_LIVENESS_SPOOF_DETECTED` | 400 | Spoofing attempt detected | Please use a live camera without obstructions |
| `KYC_LIVENESS_MAX_ATTEMPTS` | 429 | Maximum liveness check attempts exceeded | Too many attempts — please contact support |
| `KYC_SCREENING_MATCH` | 403 | Confirmed sanctions/PEP match blocking verification | Verification cannot be completed at this time |
| `KYC_RISK_TOO_HIGH` | 403 | Risk score exceeds maximum threshold | Additional review required |
| `KYC_JURISDICTION_UNSUPPORTED` | 400 | KYC verification not available for this jurisdiction | Verification not available in your region |
| `KYC_PROFILE_SUSPENDED` | 403 | KYC profile is suspended pending re-verification | Your verification has been suspended |
| `KYC_PROVIDER_UNAVAILABLE` | 503 | Verification provider is temporarily unavailable | Verification service temporarily unavailable |
| `KYC_RATE_LIMITED` | 429 | Too many verification attempts in a short period | Please wait before trying again |

---

## Security Considerations

- **PII Encryption**: All personally identifiable information is encrypted at rest using AES-256-GCM with unique per-field encryption keys managed through AWS KMS / HashiCorp Vault
- **Document Storage**: Identity documents are stored in isolated, encrypted S3 buckets with server-side encryption (SSE-KMS). Presigned URLs expire after 5 minutes. No public access.
- **Access Control**: Decrypted PII data is only accessible to users with `compliance:kyc:read_pii` permission. Document images require `compliance:kyc:view_documents`. All access is logged.
- **Data Minimization**: Only data necessary for verification is collected. Document images are retained for the regulatory minimum period (typically 5-7 years post-account closure) and then permanently deleted.
- **Right to Erasure**: GDPR Article 17 requests are supported, but regulatory retention requirements take precedence. After retention period expiry, data is cryptographically shredded.
- **Provider Security**: All external provider communications use mTLS. Provider API keys are stored in secrets vault, never in code or config files. Webhook signatures are validated before processing.
- **Rate Limiting**: Verification attempts are rate-limited per user (3 per 24h) and per IP (10 per hour) to prevent abuse and document harvesting.
- **Audit Immutability**: KYC audit logs are stored in append-only tables with database-level deletion protection. Audit data is replicated to a separate audit database for redundancy.

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @mcv/identity | internal | User profiles, authentication, session context |
| @mcv/fabric | internal | Audit events, notifications, event bus |
| @mcv/connectors | internal | Payment gateway integration for transaction context |
| onfido-node | ^6.x | Document verification, liveness checks (primary provider) |
| @jumio/sdk | ^4.x | Document verification, liveness checks (secondary provider) |
| complyadvantage-api | ^2.x | PEP/sanctions screening (primary provider) |
| maxmind-geoip | ^4.x | IP geolocation for jurisdiction determination |
| sharp | ^0.33.x | Image processing for document optimization |

---

## Environment Variables

```bash
# KYC Provider Configuration
KYC_PRIMARY_PROVIDER=onfido           # Primary verification provider
KYC_SECONDARY_PROVIDER=jumio          # Failover provider
ONFIDO_API_KEY=                        # Onfido API key
ONFIDO_WEBHOOK_SECRET=                 # Onfido webhook signature secret
JUMIO_API_KEY=                         # Jumio API key
JUMIO_API_SECRET=                      # Jumio API secret

# PEP/Sanctions Screening
COMPLY_ADVANTAGE_API_KEY=              # ComplyAdvantage API key
DOW_JONES_API_KEY=                     # Dow Jones Risk & Compliance API key
PEP_SCREENING_PROVIDER=comply_advantage

# Liveness Check
FACETEC_LICENSE_KEY=                   # FaceTec 3D liveness license
FACETEC_SERVER_KEY=                    # FaceTec server key

# Document Storage
KYC_DOCUMENT_BUCKET=mcv-kyc-documents  # Encrypted S3 bucket name
KYC_DOCUMENT_KMS_KEY=                  # KMS key ID for document encryption

# Risk Scoring
KYC_RISK_HIGH_THRESHOLD=400            # Score triggering manual review
KYC_RISK_CRITICAL_THRESHOLD=600        # Score triggering restricted access
KYC_RISK_BLOCK_THRESHOLD=800           # Score triggering account suspension

# Verification Settings
KYC_VERIFICATION_TTL=86400             # Verification attempt TTL in seconds (24h)
KYC_LIVENESS_MIN_SCORE=0.80           # Minimum liveness score
KYC_FACE_MATCH_MIN_SCORE=0.85         # Minimum face match score
KYC_MAX_LIVENESS_ATTEMPTS=3           # Max liveness retries per verification
KYC_PEP_RESCREEN_DAYS_STANDARD=90     # Rescreen interval for standard profiles
KYC_PEP_RESCREEN_DAYS_HIGH_RISK=30    # Rescreen interval for high-risk profiles
```

---

## Security Checklist

- [ ] All PII fields encrypted at rest with AES-256-GCM
- [ ] Document images stored in isolated encrypted S3 buckets
- [ ] Presigned URLs expire within 5 minutes
- [ ] Provider API keys stored in secrets vault
- [ ] mTLS for all provider communications
- [ ] Webhook signature validation for provider callbacks
- [ ] Rate limiting on verification endpoints (3/user/24h, 10/IP/hour)
- [ ] Audit logs immutable (append-only, deletion-protected)
- [ ] PII access requires `compliance:kyc:read_pii` permission
- [ ] Document access requires `compliance:kyc:view_documents` permission
- [ ] GDPR right to erasure supported with retention override
- [ ] Data minimization: only necessary fields collected
- [ ] Provider failover configured and tested
- [ ] Liveness anti-spoofing thresholds validated
- [ ] Document expiry monitoring cron job active
- [ ] PEP/sanctions batch rescreening cron job active

---

*@mcv/compliance/kyc — Know Your Customer Module*
