# 03 — API Reference: @mcv/compliance

| Field              | Value                                          |
|--------------------|------------------------------------------------|
| **Package**        | `@mcv/compliance`                              |
| **Classification** | MCV-ONLY                                       |
| **Tier**           | 5 — Domain Layer                               |
| **Version**        | 1.0.0                                          |
| **Last Updated**   | February 9, 2026                               |

---

## Table of Contents

1. [API Overview](#api-overview)
2. [KYC Service Methods](#kyc-service-methods)
3. [AML Service Methods](#aml-service-methods)
4. [Jurisdictions Service Methods](#jurisdictions-service-methods)
5. [Responsible Gaming Service Methods](#responsible-gaming-service-methods)
6. [Type Definitions](#type-definitions)
7. [Zod Schemas](#zod-schemas)
8. [Event Types](#event-types)
9. [Error Codes](#error-codes)
10. [Config Reference](#config-reference)

---

## API Overview

`@mcv/compliance` exposes four primary service classes, each handling a distinct regulatory subdomain. All services are accessed via direct import from the package and are designed for server-side usage within the Next.js 15 application layer.

### Import Pattern

```typescript
import {
  kycService,
  amlService,
  jurisdictionService,
  responsibleGamingService,
} from '@mcv/compliance';
```

### Common Patterns

All service methods follow these conventions:

- **Venture Context**: All operations require a `ventureId` which is typically resolved from the authenticated session. RLS policies enforce venture isolation at the database level.
- **Pagination**: List methods return `PaginatedResult<T>` with `{ items: T[], total: number, page: number, pageSize: number, hasMore: boolean }`.
- **Error Handling**: Methods throw typed `ComplianceError` subclasses. Callers should use try/catch with error code checking.
- **Audit Logging**: All state-changing operations automatically log to the appropriate audit table.
- **Input Validation**: All inputs are validated against Zod schemas before processing.

### Authentication & Authorization

All API routes require authentication via `@mcv/auth`. Role-based access control is enforced per endpoint:

| Role | KYC | AML | Jurisdictions | Resp. Gaming |
|------|-----|-----|---------------|-------------|
| `user` | Own profile only | — | Read own jurisdiction | Own limits only |
| `venture_admin` | Own venture | Own venture | Own venture | Own venture |
| `compliance_analyst` | Read all | Read all | Read all | Read all |
| `compliance_officer` | Read/write | Read/write | Read | Read/write |
| `compliance_admin` | Full access | Full access | Full access | Full access |
| `platform_admin` | Full access | Full access | Full access | Full access |
| `service_role` | Internal | Internal | Internal | Internal |

---

## KYC Service Methods

### `kycService.initiateVerification`

Starts a new KYC verification flow for a user, determining the required level based on the user's jurisdiction and the venture's requirements.

**Signature:**

```typescript
initiateVerification(input: InitiateKycInput): Promise<KycVerification>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | UUID of the user to verify |
| `ventureId` | `string` | Yes | UUID of the venture context |
| `targetLevel` | `KycVerificationLevel` | No | Desired verification level (auto-determined if omitted) |
| `jurisdiction` | `string` | No | Jurisdiction code to check requirements (resolved from IP if omitted) |
| `ipAddress` | `string` | No | User's IP address for audit trail |
| `userAgent` | `string` | No | User's browser user-agent |

**Returns:** `KycVerification` — The created verification record with status `initiated`.

**Example:**

```typescript
const verification = await kycService.initiateVerification({
  userId: 'usr_abc123',
  ventureId: 'vent_betedge',
  targetLevel: 'standard',
  jurisdiction: 'US-NJ',
  ipAddress: '203.0.113.42',
});

console.log(verification);
// {
//   id: 'ver_xyz789',
//   kycProfileId: 'kyc_def456',
//   targetLevel: 'standard',
//   status: 'initiated',
//   initiatedAt: '2026-02-09T09:18:00Z',
//   expiresAt: '2026-02-10T09:18:00Z',  // 24h TTL
// }
```

**Errors:**

| Code | Condition |
|------|-----------|
| `COMPLIANCE_KYC_ALREADY_VERIFIED` | User already has the requested level or higher |
| `COMPLIANCE_KYC_VERIFICATION_IN_PROGRESS` | A pending verification already exists |
| `COMPLIANCE_KYC_SUSPENDED` | User's KYC profile is suspended |
| `COMPLIANCE_JURISDICTION_BLOCKED` | User's jurisdiction does not allow this venture |

---

### `kycService.getVerificationStatus`

Retrieves the current verification status and level for a user.

**Signature:**

```typescript
getVerificationStatus(userId: string, ventureId: string): Promise<KycVerificationStatus>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | UUID of the user |
| `ventureId` | `string` | Yes | UUID of the venture |

**Returns:** `KycVerificationStatus`

**Example:**

```typescript
const status = await kycService.getVerificationStatus('usr_abc123', 'vent_betedge');

console.log(status);
// {
//   userId: 'usr_abc123',
//   ventureId: 'vent_betedge',
//   currentLevel: 'standard',
//   status: 'approved',
//   riskScore: 185,
//   riskCategory: 'low',
//   pepStatus: false,
//   sanctionsStatus: false,
//   lastVerifiedAt: '2026-01-15T14:30:00Z',
//   nextReviewDate: '2026-04-15T14:30:00Z',
//   activeVerification: null,
//   documentsOnFile: 2,
//   expiringDocuments: 0,
// }
```

**Errors:**

| Code | Condition |
|------|-----------|
| `COMPLIANCE_KYC_PROFILE_NOT_FOUND` | No KYC profile exists for this user/venture |

---

### `kycService.getComplianceScore`

Calculates a comprehensive compliance score combining KYC verification status, risk assessment, and regulatory standing.

**Signature:**

```typescript
getComplianceScore(userId: string, ventureId: string): Promise<ComplianceScore>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | UUID of the user |
| `ventureId` | `string` | Yes | UUID of the venture |

**Returns:** `ComplianceScore`

**Example:**

```typescript
const score = await kycService.getComplianceScore('usr_abc123', 'vent_betedge');

console.log(score);
// {
//   overallScore: 85,          // 0-100 (higher = more compliant)
//   kycLevel: 'standard',
//   kycStatus: 'approved',
//   riskScore: 185,             // 0-1000 (lower = less risky)
//   riskCategory: 'low',
//   amlStatus: 'clear',
//   jurisdictionCompliant: true,
//   responsibleGamingCompliant: true,
//   factors: [
//     { factor: 'kyc_verified', impact: +20, detail: 'Standard KYC verified' },
//     { factor: 'low_risk', impact: +15, detail: 'Risk score 185 (low)' },
//     { factor: 'no_pep', impact: +10, detail: 'No PEP/sanctions matches' },
//     { factor: 'jurisdiction_ok', impact: +20, detail: 'US-NJ compliant' },
//     { factor: 'no_aml_alerts', impact: +20, detail: 'No active AML alerts' },
//   ],
// }
```

**Errors:**

| Code | Condition |
|------|-----------|
| `COMPLIANCE_KYC_PROFILE_NOT_FOUND` | No KYC profile exists |

---

### `kycService.uploadDocument`

Uploads an identity document for verification. Triggers OCR extraction and provider-side verification.

**Signature:**

```typescript
uploadDocument(input: DocumentVerificationInput): Promise<KycDocument>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `kycProfileId` | `string` | Yes | UUID of the KYC profile |
| `verificationId` | `string` | Yes | UUID of the active verification attempt |
| `documentType` | `KycDocumentType` | Yes | Type of document being uploaded |
| `frontImage` | `Buffer` | Yes | Front image of the document |
| `backImage` | `Buffer` | No | Back image (required for driver's licenses, national IDs) |
| `issuingCountry` | `string` | Yes | ISO 3166-1 alpha-2 country code |

**Returns:** `KycDocument` — The created document record with status `uploaded` → `processing`.

**Example:**

```typescript
const document = await kycService.uploadDocument({
  kycProfileId: 'kyc_def456',
  verificationId: 'ver_xyz789',
  documentType: 'passport',
  frontImage: passportImageBuffer,
  issuingCountry: 'US',
});

console.log(document);
// {
//   id: 'doc_ghi012',
//   documentType: 'passport',
//   status: 'processing',
//   issuingCountry: 'US',
//   verificationProvider: 'onfido',
//   createdAt: '2026-02-09T09:20:00Z',
// }
```

**Errors:**

| Code | Condition |
|------|-----------|
| `COMPLIANCE_KYC_DOCUMENT_INVALID_TYPE` | Document type not accepted for this verification level |
| `COMPLIANCE_KYC_DOCUMENT_UPLOAD_FAILED` | Storage upload failed |
| `COMPLIANCE_KYC_VERIFICATION_EXPIRED` | Verification attempt has expired (24h TTL) |
| `COMPLIANCE_KYC_DOCUMENT_LIMIT` | Maximum documents already uploaded for this verification |

---

### `kycService.assessRisk`

Runs a comprehensive risk assessment on a KYC profile, producing a composite risk score from weighted factors.

**Signature:**

```typescript
assessRisk(kycProfileId: string): Promise<KycRiskAssessment>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `kycProfileId` | `string` | Yes | UUID of the KYC profile to assess |

**Returns:** `KycRiskAssessment`

**Example:**

```typescript
const assessment = await kycService.assessRisk('kyc_def456');

console.log(assessment);
// {
//   id: 'risk_jkl345',
//   kycProfileId: 'kyc_def456',
//   overallScore: 185,
//   riskCategory: 'low',
//   factors: [
//     { factor: 'country_risk', score: 50, weight: 0.25, details: 'US - Low risk' },
//     { factor: 'pep_status', score: 0, weight: 0.20, details: 'No PEP match' },
//     { factor: 'adverse_media', score: 0, weight: 0.15, details: 'No adverse media' },
//     { factor: 'transaction_volume', score: 80, weight: 0.15, details: 'Moderate activity' },
//     { factor: 'document_quality', score: 20, weight: 0.10, details: 'High-res scan' },
//     { factor: 'velocity', score: 25, weight: 0.10, details: 'Normal account age' },
//     { factor: 'age_risk', score: 10, weight: 0.05, details: 'Age 32 - low risk' },
//   ],
//   recommendedAction: 'approve',
//   assessedAt: '2026-02-09T09:25:00Z',
//   validUntil: '2026-05-09T09:25:00Z',
// }
```

---

## AML Service Methods

### `amlService.screenTransaction`

Screens a financial transaction against all active AML detection rules. This is the **critical path** — it executes synchronously before the transaction is committed.

**Signature:**

```typescript
screenTransaction(input: TransactionScreeningInput): Promise<TransactionScreeningResult>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `transactionId` | `string` | Yes | External transaction reference ID |
| `userId` | `string` | Yes | UUID of the user initiating the transaction |
| `ventureId` | `string` | Yes | UUID of the venture |
| `amount` | `string` | Yes | Transaction amount (decimal string) |
| `currency` | `string` | Yes | ISO 4217 currency code |
| `transactionType` | `string` | Yes | `deposit` \| `withdrawal` \| `wager` \| `payout` \| `transfer` \| `crypto_buy` \| `crypto_sell` |
| `sourceType` | `string` | No | `bank` \| `card` \| `crypto` \| `wallet` \| `e_wallet` |
| `sourceIdentifier` | `string` | No | Masked source identifier (last 4 digits) |
| `destinationType` | `string` | No | Destination type |
| `destinationIdentifier` | `string` | No | Masked destination identifier |
| `ipAddress` | `string` | No | User's IP address |
| `deviceFingerprint` | `string` | No | Device fingerprint hash |

**Returns:** `TransactionScreeningResult`

**Example:**

```typescript
const result = await amlService.screenTransaction({
  transactionId: 'txn_stripe_pi_abc123',
  userId: 'usr_abc123',
  ventureId: 'vent_betedge',
  amount: '5000.00',
  currency: 'USD',
  transactionType: 'deposit',
  sourceType: 'card',
  sourceIdentifier: '****4242',
  ipAddress: '203.0.113.42',
  deviceFingerprint: 'fp_xyz789',
});

console.log(result);
// {
//   transactionRecordId: 'aml_txn_mno678',
//   screeningResult: 'cleared',
//   riskScore: 120,
//   rulesTriggered: [],
//   alertIds: [],
//   sanctionsResult: 'clear',
//   processingTimeMs: 42,
// }
```

**Errors:**

| Code | Condition |
|------|-----------|
| `COMPLIANCE_AML_SCREENING_FAILED` | Internal screening error (transaction should be blocked) |
| `COMPLIANCE_AML_SANCTIONS_MATCH` | Sanctions list match detected (transaction blocked) |
| `COMPLIANCE_AML_PROVIDER_ERROR` | External sanctions provider unavailable |

---

### `amlService.getScreeningResult`

Retrieves the screening result for a specific transaction.

**Signature:**

```typescript
getScreeningResult(transactionRecordId: string): Promise<AmlTransactionRecord>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `transactionRecordId` | `string` | Yes | UUID of the AML transaction record |

**Returns:** `AmlTransactionRecord` — Full transaction record with screening details.

**Example:**

```typescript
const record = await amlService.getScreeningResult('aml_txn_mno678');

console.log(record);
// {
//   id: 'aml_txn_mno678',
//   transactionId: 'txn_stripe_pi_abc123',
//   userId: 'usr_abc123',
//   transactionType: 'deposit',
//   amount: '5000.00',
//   currency: 'USD',
//   amountUsd: '5000.00',
//   riskScore: 120,
//   screeningResult: 'cleared',
//   rulesTriggered: [],
//   geoLocation: { country: 'US', region: 'NJ', city: 'Newark' },
//   screenedAt: '2026-02-09T09:30:00Z',
// }
```

---

### `amlService.flagSuspicious`

Manually flags a transaction or user as suspicious, creating an AML alert for investigation.

**Signature:**

```typescript
flagSuspicious(input: FlagSuspiciousInput): Promise<AmlAlert>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | UUID of the suspicious user |
| `ventureId` | `string` | Yes | UUID of the venture |
| `reason` | `string` | Yes | Description of suspicious activity |
| `transactionIds` | `string[]` | No | Related transaction IDs |
| `priority` | `AmlCasePriority` | No | Alert priority (default: `medium`) |
| `flaggedBy` | `string` | Yes | UUID of the compliance officer flagging |

**Returns:** `AmlAlert` — The created alert.

**Example:**

```typescript
const alert = await amlService.flagSuspicious({
  userId: 'usr_abc123',
  ventureId: 'vent_betedge',
  reason: 'Multiple deposits just below $10,000 threshold over past 48 hours',
  transactionIds: ['aml_txn_001', 'aml_txn_002', 'aml_txn_003'],
  priority: 'high',
  flaggedBy: 'officer_smith',
});

console.log(alert);
// {
//   id: 'alt_pqr901',
//   alertNumber: 'AML-ALT-2026-000042',
//   status: 'new',
//   priority: 'high',
//   ruleType: 'behavioral',
//   ruleName: 'Manual Flag',
//   description: 'Multiple deposits just below $10,000 threshold...',
//   createdAt: '2026-02-09T09:35:00Z',
// }
```

**Errors:**

| Code | Condition |
|------|-----------|
| `COMPLIANCE_AML_USER_NOT_FOUND` | User does not exist in venture |
| `COMPLIANCE_AML_DUPLICATE_FLAG` | An active alert already exists for this user with the same transactions |

---

### `amlService.getAlerts`

Retrieves AML alerts with filtering and pagination.

**Signature:**

```typescript
getAlerts(ventureId: string, filters?: AlertFilters): Promise<PaginatedResult<AmlAlert>>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | Yes | UUID of the venture |
| `filters.status` | `AmlAlertStatus[]` | No | Filter by alert status |
| `filters.priority` | `AmlCasePriority[]` | No | Filter by priority |
| `filters.ruleType` | `AmlRuleType[]` | No | Filter by rule type |
| `filters.assignedTo` | `string` | No | Filter by assigned officer |
| `filters.userId` | `string` | No | Filter by subject user |
| `filters.dateFrom` | `string` | No | Alerts created after this date |
| `filters.dateTo` | `string` | No | Alerts created before this date |
| `filters.page` | `number` | No | Page number (default: 1) |
| `filters.pageSize` | `number` | No | Page size (default: 25, max: 100) |

**Returns:** `PaginatedResult<AmlAlert>`

**Example:**

```typescript
const alerts = await amlService.getAlerts('vent_betedge', {
  status: ['new', 'investigating'],
  priority: ['high', 'critical'],
  page: 1,
  pageSize: 10,
});

console.log(alerts);
// {
//   items: [ { id: 'alt_pqr901', alertNumber: 'AML-ALT-2026-000042', ... }, ... ],
//   total: 23,
//   page: 1,
//   pageSize: 10,
//   hasMore: true,
// }
```

---

### `amlService.draftSar`

Creates a draft Suspicious Activity Report linked to an investigation case.

**Signature:**

```typescript
draftSar(input: SarFilingInput): Promise<AmlSarFiling>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `caseId` | `string` | Yes | UUID of the linked AML case |
| `ventureId` | `string` | Yes | UUID of the venture |
| `filingType` | `string` | Yes | `initial` \| `continuing` \| `joint` |
| `regulatoryBody` | `string` | Yes | `fincen` \| `fintrac` \| `nca` \| `fiu` |
| `subjectUserId` | `string` | Yes | UUID of the subject |
| `suspiciousActivity` | `SuspiciousActivityDetails` | Yes | Activity description and details |
| `narrativeText` | `string` | Yes | Free-form SAR narrative (regulatory requirement) |
| `relatedTransactionIds` | `string[]` | No | Related transaction record IDs |

**Returns:** `AmlSarFiling` — The created SAR draft with status `draft`.

**Example:**

```typescript
const sar = await amlService.draftSar({
  caseId: 'case_stu234',
  ventureId: 'vent_betedge',
  filingType: 'initial',
  regulatoryBody: 'fincen',
  subjectUserId: 'usr_abc123',
  suspiciousActivity: {
    description: 'Subject conducted 8 deposits between $9,200-$9,800 over 3 days',
    activityDates: { start: '2026-02-05', end: '2026-02-08' },
    totalAmount: '76500.00',
    transactionCount: 8,
    activityType: 'structuring',
  },
  narrativeText: 'On February 5-8, 2026, the subject conducted eight cash deposits...',
  relatedTransactionIds: ['aml_txn_001', 'aml_txn_002', /* ... */],
});

console.log(sar);
// {
//   id: 'sar_uvw567',
//   filingNumber: 'SAR-2026-000015',
//   status: 'draft',
//   regulatoryBody: 'fincen',
//   dueDate: '2026-03-08T00:00:00Z',  // 30 days from detection
// }
```

---

## Jurisdictions Service Methods

### `jurisdictionService.getRules`

Retrieves all regulatory requirements for a given jurisdiction, optionally filtered by venture type.

**Signature:**

```typescript
getRules(jurisdictionCode: string, ventureType?: string): Promise<JurisdictionRequirement[]>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `jurisdictionCode` | `string` | Yes | Jurisdiction code (e.g., `US-NJ`, `GB`, `MT`) |
| `ventureType` | `string` | No | Filter by venture type: `gambling` \| `commerce` \| `crypto` \| `all` |

**Returns:** `JurisdictionRequirement[]`

**Example:**

```typescript
const rules = await jurisdictionService.getRules('US-NJ', 'gambling');

console.log(rules);
// [
//   {
//     id: 'req_aaa',
//     category: 'kyc_level',
//     requirementKey: 'minimum_kyc',
//     requirementValue: { minimumLevel: 'standard', enhancedTrigger: 5000 },
//     legalReference: 'NJAC 13:69O-1.1',
//   },
//   {
//     id: 'req_bbb',
//     category: 'age_minimum',
//     requirementKey: 'gambling_age',
//     requirementValue: { age: 21, verificationMethods: ['id_check', 'database'] },
//     legalReference: 'NJ Rev Stat § 5:12-119',
//   },
//   {
//     id: 'req_ccc',
//     category: 'responsible_gaming',
//     requirementKey: 'self_exclusion',
//     requirementValue: { required: true, minimumPeriod: '1 year', nationalRegister: false },
//     legalReference: 'NJAC 13:69O-1.4',
//   },
// ]
```

---

### `jurisdictionService.checkCompliance`

Checks whether a user/venture combination is compliant for a specific jurisdiction, evaluating all applicable requirements.

**Signature:**

```typescript
checkCompliance(input: JurisdictionCheckInput): Promise<JurisdictionCheckResult>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | UUID of the user |
| `ventureId` | `string` | Yes | UUID of the venture |
| `jurisdictionCode` | `string` | Yes | Jurisdiction to check |
| `activityType` | `string` | No | Specific activity to check (e.g., `deposit`, `wager`) |
| `ipAddress` | `string` | No | User's current IP address |
| `gpsCoords` | `GpsCoordinates` | No | User's GPS coordinates |

**Returns:** `JurisdictionCheckResult`

**Example:**

```typescript
const result = await jurisdictionService.checkCompliance({
  userId: 'usr_abc123',
  ventureId: 'vent_betedge',
  jurisdictionCode: 'US-NJ',
  activityType: 'wager',
  ipAddress: '203.0.113.42',
});

console.log(result);
// {
//   compliant: true,
//   jurisdiction: 'US-NJ',
//   ventureStatus: 'active',
//   checks: [
//     { requirement: 'kyc_level', met: true, detail: 'User has standard KYC (required: standard)' },
//     { requirement: 'age_minimum', met: true, detail: 'User age 32 (required: 21+)' },
//     { requirement: 'geo_access', met: true, detail: 'IP geolocated to NJ, no VPN detected' },
//     { requirement: 'licensing', met: true, detail: 'BetEdge licensed in NJ (DGE)' },
//     { requirement: 'self_exclusion', met: true, detail: 'Not on self-exclusion list' },
//   ],
//   missingRequirements: [],
// }
```

**Errors:**

| Code | Condition |
|------|-----------|
| `COMPLIANCE_JURISDICTION_UNKNOWN` | Jurisdiction code not found in registry |
| `COMPLIANCE_JURISDICTION_BLOCKED` | Jurisdiction prohibits this activity |

---

### `jurisdictionService.getRequirements`

Returns the full set of regulatory requirements for a jurisdiction with legal references.

**Signature:**

```typescript
getRequirements(jurisdictionCode: string, ventureType?: string): Promise<JurisdictionRequirementSet>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `jurisdictionCode` | `string` | Yes | Jurisdiction code |
| `ventureType` | `string` | No | Filter by venture type |

**Returns:** `JurisdictionRequirementSet`

**Example:**

```typescript
const requirements = await jurisdictionService.getRequirements('GB');

console.log(requirements);
// {
//   jurisdiction: { code: 'GB', name: 'United Kingdom', regulatoryBody: 'UKGC' },
//   kycRequirements: {
//     minimumLevel: 'enhanced',
//     enhancedTrigger: 2000,
//     documentsRequired: ['passport', 'utility_bill'],
//   },
//   ageRequirements: { minimumAge: 18, methods: ['id_document', 'credit_bureau'] },
//   responsibleGaming: {
//     selfExclusionRequired: true,
//     gamstopIntegration: true,
//     realityChecksRequired: true,
//     realityCheckMaxInterval: 60,
//   },
//   amlRequirements: {
//     reportingBody: 'nca',
//     ctrThreshold: null, // No CTR equivalent in UK
//     sarRequired: true,
//   },
//   dataProtection: {
//     framework: 'uk_gdpr',
//     residencyRequired: false,
//     breachNotificationHours: 72,
//   },
//   taxRules: {
//     gamblingTax: { rate: 0, description: 'No tax on gambling winnings for players' },
//     operatorTax: { rate: 0.21, description: '21% Remote Gaming Duty' },
//   },
// }
```

---

### `jurisdictionService.evaluateGeoAccess`

Evaluates geographic access for a user request using multi-layer validation.

**Signature:**

```typescript
evaluateGeoAccess(
  ventureId: string,
  ipAddress: string,
  gpsCoords?: GpsCoordinates
): Promise<GeoAccessResult>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | Yes | UUID of the venture |
| `ipAddress` | `string` | Yes | User's IP address |
| `gpsCoords` | `GpsCoordinates` | No | GPS coordinates for cross-validation |

**Returns:** `GeoAccessResult`

**Example:**

```typescript
const access = await jurisdictionService.evaluateGeoAccess(
  'vent_betedge',
  '203.0.113.42',
  { latitude: 40.7128, longitude: -74.0060 }
);

console.log(access);
// {
//   allowed: true,
//   action: 'allow',
//   jurisdiction: 'US-NJ',
//   vpnDetected: false,
//   restrictions: null,
//   blockMessage: null,
//   requiresAgeVerification: false,
// }
```

---

## Responsible Gaming Service Methods

### `responsibleGamingService.setLimits`

Sets or updates a deposit, loss, wager, or time limit for a player. Decreases take effect immediately; increases are subject to a cooling-off period.

**Signature:**

```typescript
setLimits(input: SetLimitInput): Promise<PlayerLimit>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | UUID of the player |
| `ventureId` | `string` | Yes | UUID of the venture |
| `limitType` | `LimitType` | Yes | `deposit` \| `loss` \| `wager` \| `time` |
| `period` | `LimitPeriod` | Yes | `daily` \| `weekly` \| `monthly` \| `yearly` |
| `amount` | `string` | Yes | Limit amount (or minutes for time limits) |
| `currency` | `string` | No | Currency code (default: `USD`) |

**Returns:** `PlayerLimit`

**Example:**

```typescript
// Set a daily deposit limit of $500
const limit = await responsibleGamingService.setLimits({
  userId: 'usr_abc123',
  ventureId: 'vent_betedge',
  limitType: 'deposit',
  period: 'daily',
  amount: '500.00',
  currency: 'USD',
});

console.log(limit);
// {
//   id: 'lim_abc789',
//   userId: 'usr_abc123',
//   limitType: 'deposit',
//   period: 'daily',
//   amount: '500.00',
//   currency: 'USD',
//   status: 'active',
//   effectiveAt: '2026-02-09T09:18:00Z',  // Immediate (new limit or decrease)
//   previousAmount: null,
//   coolingOffUntil: null,
// }

// Increase the limit — triggers cooling-off
const increased = await responsibleGamingService.setLimits({
  userId: 'usr_abc123',
  ventureId: 'vent_betedge',
  limitType: 'deposit',
  period: 'daily',
  amount: '1000.00',
  currency: 'USD',
});

console.log(increased);
// {
//   id: 'lim_abc789',
//   status: 'pending_increase',
//   amount: '500.00',              // Current amount still active
//   pendingAmount: '1000.00',      // New amount pending
//   coolingOffUntil: '2026-02-10T09:18:00Z',  // 24h cooling-off
// }
```

**Errors:**

| Code | Condition |
|------|-----------|
| `COMPLIANCE_RG_SELF_EXCLUDED` | User is self-excluded and cannot modify limits |
| `COMPLIANCE_RG_LIMIT_BELOW_JURISDICTION_MAX` | Limit exceeds jurisdiction-mandated maximum |
| `COMPLIANCE_RG_COOLING_OFF_ACTIVE` | A pending limit change is already in cooling-off |

---

### `responsibleGamingService.checkLimits`

Checks whether a player action (deposit, wager, session start) is within their active limits.

**Signature:**

```typescript
checkLimits(userId: string, ventureId: string, action: LimitCheckAction): Promise<LimitCheckResult>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | UUID of the player |
| `ventureId` | `string` | Yes | UUID of the venture |
| `action.type` | `string` | Yes | `deposit` \| `wager` \| `session_start` |
| `action.amount` | `string` | Cond. | Amount for deposit/wager checks |
| `action.currency` | `string` | Cond. | Currency for deposit/wager checks |

**Returns:** `LimitCheckResult`

**Example:**

```typescript
const result = await responsibleGamingService.checkLimits(
  'usr_abc123',
  'vent_betedge',
  { type: 'deposit', amount: '200.00', currency: 'USD' }
);

console.log(result);
// {
//   allowed: true,
//   checks: [
//     {
//       limitType: 'deposit',
//       period: 'daily',
//       limitAmount: 500,
//       currentUsage: 250,
//       requestedAmount: 200,
//       remainingAfter: 50,
//       currency: 'USD',
//       resetsAt: '2026-02-10T05:00:00Z',
//       wouldExceed: false,
//     },
//     {
//       limitType: 'deposit',
//       period: 'weekly',
//       limitAmount: 2000,
//       currentUsage: 750,
//       requestedAmount: 200,
//       remainingAfter: 1050,
//       currency: 'USD',
//       resetsAt: '2026-02-17T05:00:00Z',
//       wouldExceed: false,
//     },
//   ],
//   selfExcluded: false,
//   coolingOff: false,
// }
```

**Errors:**

| Code | Condition |
|------|-----------|
| `COMPLIANCE_RG_LIMIT_EXCEEDED` | Requested action would exceed a limit |
| `COMPLIANCE_RG_SELF_EXCLUSION_ACTIVE` | User is self-excluded |
| `COMPLIANCE_RG_COOLING_OFF_ACTIVE` | User is in cooling-off period |

---

### `responsibleGamingService.getSelfExclusionStatus`

Retrieves the current self-exclusion status for a player.

**Signature:**

```typescript
getSelfExclusionStatus(userId: string, ventureId: string): Promise<SelfExclusionStatus>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | UUID of the player |
| `ventureId` | `string` | Yes | UUID of the venture |

**Returns:** `SelfExclusionStatus`

**Example:**

```typescript
const status = await responsibleGamingService.getSelfExclusionStatus(
  'usr_abc123', 'vent_betedge'
);

console.log(status);
// {
//   isExcluded: false,
//   activeExclusions: [],
//   pastExclusions: [
//     {
//       type: 'temporary',
//       startedAt: '2025-06-01T00:00:00Z',
//       endedAt: '2025-12-01T00:00:00Z',
//       duration: '6 months',
//     },
//   ],
//   gamstopStatus: null,  // null if not UK user
// }
```

---

### `responsibleGamingService.initiateSelfExclusion`

Initiates a self-exclusion for a player. Takes effect **immediately** and cannot be reversed for temporary exclusions or ever for permanent exclusions.

**Signature:**

```typescript
initiateSelfExclusion(input: SelfExclusionInput): Promise<SelfExclusion>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | UUID of the player |
| `ventureId` | `string` | Yes | UUID of the venture |
| `type` | `SelfExclusionType` | Yes | `temporary` \| `permanent` \| `gamstop` \| `national_register` |
| `duration` | `string` | Cond. | Duration for temporary exclusions (e.g., `6_months`, `1_year`, `5_years`) |
| `reason` | `string` | No | Player's stated reason |
| `acknowledgedIrrevocable` | `boolean` | Yes | Confirmation that exclusion cannot be reversed |

**Returns:** `SelfExclusion`

**Example:**

```typescript
const exclusion = await responsibleGamingService.initiateSelfExclusion({
  userId: 'usr_abc123',
  ventureId: 'vent_betedge',
  type: 'temporary',
  duration: '6_months',
  reason: 'Need a break',
  acknowledgedIrrevocable: true,
});

console.log(exclusion);
// {
//   id: 'excl_xyz789',
//   type: 'temporary',
//   status: 'active',
//   startedAt: '2026-02-09T09:18:00Z',
//   expiresAt: '2026-08-09T09:18:00Z',
//   acknowledgedAt: '2026-02-09T09:18:00Z',
// }
```

**Errors:**

| Code | Condition |
|------|-----------|
| `COMPLIANCE_RG_ALREADY_EXCLUDED` | User already has an active self-exclusion |
| `COMPLIANCE_RG_ACKNOWLEDGEMENT_REQUIRED` | `acknowledgedIrrevocable` must be `true` |
| `COMPLIANCE_RG_INVALID_DURATION` | Duration is below the minimum for the jurisdiction |

---

### `responsibleGamingService.assessBehavioralRisk`

Runs an AI-powered behavioral risk assessment on a player's activity patterns using OpenRouter.

**Signature:**

```typescript
assessBehavioralRisk(input: BehavioralAssessmentInput): Promise<BehavioralRiskScore>
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | UUID of the player |
| `ventureId` | `string` | Yes | UUID of the venture |
| `lookbackDays` | `number` | No | Days of history to analyze (default: 30) |
| `includeSessionData` | `boolean` | No | Include detailed session data (default: true) |

**Returns:** `BehavioralRiskScore`

**Example:**

```typescript
const risk = await responsibleGamingService.assessBehavioralRisk({
  userId: 'usr_abc123',
  ventureId: 'vent_betedge',
  lookbackDays: 30,
});

console.log(risk);
// {
//   id: 'brisk_abc123',
//   userId: 'usr_abc123',
//   overallScore: 380,
//   riskLevel: 'moderate',
//   previousScore: 220,
//   scoreChange: +160,
//   indicators: [
//     {
//       type: 'escalating_deposits',
//       severity: 'medium',
//       confidence: 0.78,
//       description: 'Deposit frequency increased 150% in past 7 days',
//       dataPoints: { avgDepositsPerWeek: 2, recentWeekDeposits: 5 },
//     },
//     {
//       type: 'loss_chasing',
//       severity: 'medium',
//       confidence: 0.65,
//       description: 'Bet sizes increased 80% following 3 consecutive losses',
//       dataPoints: { preLossBetAvg: '25.00', postLossBetAvg: '45.00' },
//     },
//   ],
//   recommendedAction: 'increase_reality_check_frequency',
//   assessedAt: '2026-02-09T09:40:00Z',
//   model: 'anthropic/claude-3.5-sonnet',
// }
```

---

## Type Definitions

### Core Types

```typescript
// ─── Common ──────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number; // meters
}

// ─── KYC Types ───────────────────────────────────────────────────

export type KycVerificationLevel = 'none' | 'basic' | 'standard' | 'enhanced' | 'premium';
export type KycStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired' | 'suspended';
export type KycDocumentType =
  | 'passport' | 'drivers_license' | 'national_id'
  | 'utility_bill' | 'bank_statement' | 'tax_return'
  | 'proof_of_address' | 'selfie' | 'source_of_funds_doc';
export type KycDocumentStatus = 'uploaded' | 'processing' | 'verified' | 'rejected' | 'expired';

export interface KycAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface KycVerificationStatus {
  userId: string;
  ventureId: string;
  currentLevel: KycVerificationLevel;
  status: KycStatus;
  riskScore: number;
  riskCategory: string;
  pepStatus: boolean;
  sanctionsStatus: boolean;
  lastVerifiedAt: string | null;
  nextReviewDate: string | null;
  activeVerification: KycVerification | null;
  documentsOnFile: number;
  expiringDocuments: number;
}

export interface ComplianceScore {
  overallScore: number; // 0-100
  kycLevel: KycVerificationLevel;
  kycStatus: KycStatus;
  riskScore: number;    // 0-1000
  riskCategory: string;
  amlStatus: string;
  jurisdictionCompliant: boolean;
  responsibleGamingCompliant: boolean;
  factors: Array<{ factor: string; impact: number; detail: string }>;
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

export interface SuspiciousActivityDetails {
  description: string;
  activityDates: { start: string; end: string };
  totalAmount: string;
  transactionCount: number;
  activityType: string;
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

export interface JurisdictionCheckResult {
  compliant: boolean;
  jurisdiction: string;
  ventureStatus: JurisdictionStatus;
  checks: Array<{
    requirement: string;
    met: boolean;
    detail: string;
  }>;
  missingRequirements: string[];
}

// ─── Responsible Gaming Types ────────────────────────────────────

export type LimitType = 'deposit' | 'loss' | 'wager' | 'time' | 'session';
export type LimitPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type SelfExclusionType = 'temporary' | 'permanent' | 'gamstop' | 'national_register';
export type InterventionType = 'automated' | 'manual' | 'regulatory' | 'system';
export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';

export interface LimitCheckAction {
  type: 'deposit' | 'wager' | 'session_start';
  amount?: string;
  currency?: string;
}

export interface LimitCheckResult {
  allowed: boolean;
  checks: Array<{
    limitType: LimitType;
    period: LimitPeriod;
    limitAmount: number;
    currentUsage: number;
    requestedAmount: number;
    remainingAfter: number;
    currency: string;
    resetsAt: string;
    wouldExceed: boolean;
  }>;
  selfExcluded: boolean;
  coolingOff: boolean;
}

export interface SelfExclusionStatus {
  isExcluded: boolean;
  activeExclusions: Array<{
    type: SelfExclusionType;
    startedAt: string;
    expiresAt: string | null;
  }>;
  pastExclusions: Array<{
    type: SelfExclusionType;
    startedAt: string;
    endedAt: string;
    duration: string;
  }>;
  gamstopStatus: 'registered' | 'not_registered' | null;
}

export interface BehavioralRiskScore {
  id: string;
  userId: string;
  overallScore: number;
  riskLevel: RiskLevel;
  previousScore: number;
  scoreChange: number;
  indicators: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    confidence: number;
    description: string;
    dataPoints: Record<string, unknown>;
  }>;
  recommendedAction: string;
  assessedAt: string;
  model: string;
}
```

---

## Zod Schemas

### Input Validation Schemas

```typescript
import { z } from 'zod';

// ─── KYC Schemas ─────────────────────────────────────────────────

export const initiateKycInputSchema = z.object({
  userId: z.string().uuid(),
  ventureId: z.string().uuid(),
  targetLevel: z.enum(['basic', 'standard', 'enhanced', 'premium']).optional(),
  jurisdiction: z.string().min(2).max(10).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
});

export const documentVerificationInputSchema = z.object({
  kycProfileId: z.string().uuid(),
  verificationId: z.string().uuid(),
  documentType: z.enum([
    'passport', 'drivers_license', 'national_id',
    'utility_bill', 'bank_statement', 'tax_return',
    'proof_of_address', 'selfie', 'source_of_funds_doc',
  ]),
  frontImage: z.instanceof(Buffer),
  backImage: z.instanceof(Buffer).optional(),
  issuingCountry: z.string().length(2),
});

export const manualReviewInputSchema = z.object({
  verificationId: z.string().uuid(),
  decision: z.enum(['approve', 'reject', 'escalate']),
  reason: z.string().min(10).max(2000),
  reviewedBy: z.string().uuid(),
  newLevel: z.enum(['none', 'basic', 'standard', 'enhanced', 'premium']).optional(),
});

// ─── AML Schemas ─────────────────────────────────────────────────

export const transactionScreeningInputSchema = z.object({
  transactionId: z.string().min(1),
  userId: z.string().uuid(),
  ventureId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/),
  currency: z.string().length(3),
  transactionType: z.enum([
    'deposit', 'withdrawal', 'wager', 'payout',
    'transfer', 'crypto_buy', 'crypto_sell', 'refund',
  ]),
  sourceType: z.enum(['bank', 'card', 'crypto', 'wallet', 'e_wallet']).optional(),
  sourceIdentifier: z.string().max(50).optional(),
  destinationType: z.string().optional(),
  destinationIdentifier: z.string().max(50).optional(),
  ipAddress: z.string().ip().optional(),
  deviceFingerprint: z.string().max(256).optional(),
});

export const sarFilingInputSchema = z.object({
  caseId: z.string().uuid(),
  ventureId: z.string().uuid(),
  filingType: z.enum(['initial', 'continuing', 'joint']),
  regulatoryBody: z.enum(['fincen', 'fintrac', 'nca', 'fiu']),
  subjectUserId: z.string().uuid(),
  suspiciousActivity: z.object({
    description: z.string().min(50).max(10000),
    activityDates: z.object({
      start: z.string().date(),
      end: z.string().date(),
    }),
    totalAmount: z.string().regex(/^\d+(\.\d{1,4})?$/),
    transactionCount: z.number().int().positive(),
    activityType: z.string(),
  }),
  narrativeText: z.string().min(100).max(50000),
  relatedTransactionIds: z.array(z.string().uuid()).optional(),
});

export const ruleConfigInputSchema = z.object({
  ventureId: z.string().uuid().nullable(),
  name: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  ruleType: z.enum(['threshold', 'velocity', 'pattern', 'network', 'geographic', 'behavioral']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  configuration: z.record(z.unknown()),
  applicableTransactionTypes: z.array(z.string()).optional(),
  applicableJurisdictions: z.array(z.string()).optional(),
});

// ─── Jurisdiction Schemas ────────────────────────────────────────

export const jurisdictionCheckInputSchema = z.object({
  userId: z.string().uuid(),
  ventureId: z.string().uuid(),
  jurisdictionCode: z.string().min(2).max(10),
  activityType: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  gpsCoords: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().positive().optional(),
  }).optional(),
});

export const geoBlockInputSchema = z.object({
  ventureId: z.string().uuid().nullable(),
  jurisdictionId: z.string().uuid(),
  action: z.enum(['allow', 'block', 'restrict', 'age_gate', 'vpn_block']),
  ruleType: z.enum(['ip_based', 'gps_based', 'combined', 'address_based']),
  vpnDetection: z.boolean().default(true),
  torDetection: z.boolean().default(true),
  proxyDetection: z.boolean().default(true),
  restrictions: z.object({
    allowedFeatures: z.array(z.string()).optional(),
    blockedFeatures: z.array(z.string()).optional(),
  }).optional(),
  blockMessage: z.string().max(500).optional(),
  priority: z.number().int().default(0),
});

// ─── Responsible Gaming Schemas ──────────────────────────────────

export const setLimitInputSchema = z.object({
  userId: z.string().uuid(),
  ventureId: z.string().uuid(),
  limitType: z.enum(['deposit', 'loss', 'wager', 'time']),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/),
  currency: z.string().length(3).default('USD'),
});

export const selfExclusionInputSchema = z.object({
  userId: z.string().uuid(),
  ventureId: z.string().uuid(),
  type: z.enum(['temporary', 'permanent', 'gamstop', 'national_register']),
  duration: z.enum([
    '1_month', '3_months', '6_months',
    '1_year', '2_years', '5_years',
  ]).optional(),
  reason: z.string().max(1000).optional(),
  acknowledgedIrrevocable: z.literal(true),
});

export const behavioralAssessmentInputSchema = z.object({
  userId: z.string().uuid(),
  ventureId: z.string().uuid(),
  lookbackDays: z.number().int().min(7).max(365).default(30),
  includeSessionData: z.boolean().default(true),
});
```

---

## Event Types

### Outbound Events (emitted by @mcv/compliance)

| Topic | Event | Payload |
|-------|-------|---------|
| `compliance.kyc.verification` | `initiated` | `{ userId, ventureId, targetLevel, verificationId }` |
| `compliance.kyc.verification` | `approved` | `{ userId, ventureId, level, riskScore, verificationId }` |
| `compliance.kyc.verification` | `rejected` | `{ userId, ventureId, reason, verificationId }` |
| `compliance.kyc.verification` | `level.changed` | `{ userId, ventureId, oldLevel, newLevel }` |
| `compliance.kyc.verification` | `suspended` | `{ userId, ventureId, reason }` |
| `compliance.aml.transaction` | `screened` | `{ txnId, userId, result, riskScore, rulesTriggered }` |
| `compliance.aml.transaction` | `blocked` | `{ txnId, userId, reason, sanctionsMatch }` |
| `compliance.aml.alert` | `created` | `{ alertId, userId, ruleType, priority }` |
| `compliance.aml.alert` | `escalated` | `{ alertId, escalatedTo, reason }` |
| `compliance.aml.filing` | `sar.submitted` | `{ sarId, regulatoryBody, subjectUserId }` |
| `compliance.aml.filing` | `ctr.submitted` | `{ ctrId, regulatoryBody, amount }` |
| `compliance.jurisdiction` | `geo.blocked` | `{ userId, ventureId, jurisdiction, action }` |
| `compliance.jurisdiction` | `license.expiring` | `{ licenseId, ventureId, daysRemaining }` |
| `compliance.jurisdiction` | `venture.suspended` | `{ ventureId, jurisdiction, reason }` |
| `compliance.responsible_gaming` | `limit.set` | `{ userId, ventureId, type, period, amount }` |
| `compliance.responsible_gaming` | `limit.reached` | `{ userId, ventureId, type, period }` |
| `compliance.responsible_gaming` | `self_exclusion.initiated` | `{ userId, ventureId, type, until }` |
| `compliance.responsible_gaming` | `risk.elevated` | `{ userId, ventureId, score, indicators }` |
| `compliance.responsible_gaming` | `intervention.triggered` | `{ userId, ventureId, type, reason }` |

### Inbound Events (consumed by @mcv/compliance)

| Source | Topic | Handler |
|--------|-------|---------|
| `@mcv/payments` | `payment.transaction.completed` | AML: `screenTransaction()` |
| `@mcv/payments` | `payment.deposit.completed` | RG: Update deposit limit usage |
| `@mcv/identity` | `identity.user.registered` | KYC: Create profile, check jurisdiction |
| `@mcv/engagement` | `engagement.session.started` | RG: Check exclusion/limits, start monitoring |
| `@mcv/engagement` | `engagement.session.ended` | RG: Record session, update summaries |
| `@mcv/engagement` | `engagement.wager.placed` | RG: Check wager/loss limits |

---

## Error Codes

### Complete Error Code Reference

| Code | HTTP | Description |
|------|------|-------------|
| `COMPLIANCE_KYC_PROFILE_NOT_FOUND` | 404 | KYC profile does not exist for this user/venture |
| `COMPLIANCE_KYC_ALREADY_VERIFIED` | 409 | User already has the requested verification level |
| `COMPLIANCE_KYC_VERIFICATION_IN_PROGRESS` | 409 | A pending verification attempt already exists |
| `COMPLIANCE_KYC_VERIFICATION_EXPIRED` | 410 | Verification attempt has expired (24h TTL) |
| `COMPLIANCE_KYC_SUSPENDED` | 403 | User's KYC profile is suspended |
| `COMPLIANCE_KYC_DOCUMENT_INVALID_TYPE` | 400 | Document type not accepted for this level |
| `COMPLIANCE_KYC_DOCUMENT_UPLOAD_FAILED` | 500 | Failed to upload document to storage |
| `COMPLIANCE_KYC_DOCUMENT_LIMIT` | 400 | Maximum documents uploaded for this verification |
| `COMPLIANCE_KYC_PROVIDER_ERROR` | 502 | External KYC provider returned an error |
| `COMPLIANCE_KYC_LIVENESS_FAILED` | 400 | Liveness check failed (spoofing detected) |
| `COMPLIANCE_AML_SCREENING_FAILED` | 500 | Internal screening engine error |
| `COMPLIANCE_AML_SANCTIONS_MATCH` | 403 | Transaction blocked due to sanctions match |
| `COMPLIANCE_AML_PROVIDER_ERROR` | 502 | External AML provider error |
| `COMPLIANCE_AML_USER_NOT_FOUND` | 404 | User not found in venture |
| `COMPLIANCE_AML_DUPLICATE_FLAG` | 409 | Active alert already exists for same transactions |
| `COMPLIANCE_AML_ALERT_NOT_FOUND` | 404 | Alert ID not found |
| `COMPLIANCE_AML_CASE_NOT_FOUND` | 404 | Case ID not found |
| `COMPLIANCE_AML_RULE_INVALID` | 400 | Rule configuration is invalid |
| `COMPLIANCE_AML_SAR_DEADLINE_EXCEEDED` | 400 | SAR filing is past the regulatory deadline |
| `COMPLIANCE_JURISDICTION_UNKNOWN` | 404 | Jurisdiction code not found in registry |
| `COMPLIANCE_JURISDICTION_BLOCKED` | 403 | Jurisdiction prohibits this activity |
| `COMPLIANCE_JURISDICTION_VPN_DETECTED` | 403 | VPN/proxy usage detected and blocked |
| `COMPLIANCE_JURISDICTION_LICENSE_EXPIRED` | 403 | Operating license has expired |
| `COMPLIANCE_JURISDICTION_AGE_FAILED` | 403 | Age verification failed or not met |
| `COMPLIANCE_JURISDICTION_DATA_RESIDENCY` | 400 | Data storage violates residency requirements |
| `COMPLIANCE_RG_SELF_EXCLUSION_ACTIVE` | 403 | User is self-excluded |
| `COMPLIANCE_RG_ALREADY_EXCLUDED` | 409 | User already has an active self-exclusion |
| `COMPLIANCE_RG_ACKNOWLEDGEMENT_REQUIRED` | 400 | Self-exclusion acknowledgement not provided |
| `COMPLIANCE_RG_INVALID_DURATION` | 400 | Duration below jurisdiction minimum |
| `COMPLIANCE_RG_LIMIT_EXCEEDED` | 403 | Action would exceed player's limit |
| `COMPLIANCE_RG_LIMIT_BELOW_JURISDICTION_MAX` | 400 | Limit exceeds jurisdiction maximum |
| `COMPLIANCE_RG_COOLING_OFF_ACTIVE` | 409 | Pending limit change in cooling-off period |
| `COMPLIANCE_CONFIG_INVALID` | 500 | Configuration validation failed |
| `COMPLIANCE_ENCRYPTION_ERROR` | 500 | PII encryption/decryption failed |
| `COMPLIANCE_AUDIT_WRITE_FAILED` | 500 | Failed to write audit log entry |

---

## Config Reference

### Configuration Object

```typescript
import { complianceConfigSchema } from '@mcv/compliance';

const config = complianceConfigSchema.parse({
  database: {
    url: process.env.COMPLIANCE_DATABASE_URL,
    poolMin: 5,
    poolMax: 20,
    statementTimeout: 30000,
  },
  redis: {
    url: process.env.COMPLIANCE_REDIS_URL,
    keyPrefix: 'compliance:',
    cacheTtl: 300,
  },
  encryption: {
    key: process.env.COMPLIANCE_ENCRYPTION_KEY,
    algorithm: 'aes-256-gcm',
  },
  kyc: {
    provider: 'onfido',
    providerApiKey: process.env.KYC_PROVIDER_API_KEY,
    livenessProvider: 'onfido',
    livenessThreshold: 0.80,
    faceMatchThreshold: 0.85,
    pepProvider: 'comply_advantage',
    pepApiKey: process.env.KYC_PEP_API_KEY,
    riskHighThreshold: 600,
    rescreenIntervalDays: 90,
    rescreenHighRiskDays: 30,
    documentExpiryWarningDays: [30, 14, 7],
    verificationAttemptTtlHours: 24,
  },
  aml: {
    ctrThresholdUsd: 10000,
    enhancedMonitoringUsd: 3000,
    sarDeadlineDays: 30,
    ctrDeadlineDays: 15,
    watchlistUpdateCron: '0 2 * * *',
    riskRecalcCron: '0 4 * * *',
    riskScoreDecayDays: 180,
    maxAlertAgeDays: 90,
    batchScreeningSize: 1000,
  },
  jurisdictions: {
    geoipProvider: 'maxmind',
    geoipLicenseKey: process.env.GEOIP_LICENSE_KEY,
    geoipDatabasePath: '/data/GeoLite2-City.mmdb',
    vpnDetectionEnabled: true,
    torDetectionEnabled: true,
    proxyDetectionEnabled: true,
    gpsIpMaxDistanceKm: 50,
    licenseExpiryWarningDays: [90, 60, 30, 14, 7, 1],
  },
  responsibleGaming: {
    aiModel: 'anthropic/claude-3.5-sonnet',
    defaultRealityCheckMinutes: 60,
    limitIncreaseCoolingOffHours: 24,
    limitRemovalCoolingOffDays: 7,
    gamstopApiUrl: process.env.GAMSTOP_API_URL,
    gamstopApiKey: process.env.GAMSTOP_API_KEY,
    behavioralAnalysisIntervalHours: 24,
    riskScoreThresholds: {
      moderate: 200,
      elevated: 400,
      high: 600,
      critical: 800,
    },
  },
  audit: {
    retentionYears: 7,
    immutableTables: [
      'compliance_kyc_audit_log',
      'compliance_aml_audit_log',
      'compliance_responsible_gaming_audit_log',
    ],
  },
});
```

### Constants

```typescript
export const KYC_VERIFICATION_LEVELS = {
  none: { maxDailyDeposit: 0, maxMonthlyDeposit: 0 },
  basic: { maxDailyDeposit: 500, maxMonthlyDeposit: 2000 },
  standard: { maxDailyDeposit: 5000, maxMonthlyDeposit: 20000 },
  enhanced: { maxDailyDeposit: 50000, maxMonthlyDeposit: null },
  premium: { maxDailyDeposit: null, maxMonthlyDeposit: null },
} as const;

export const AML_REPORTING_THRESHOLDS = {
  US: { ctr: 10000, sarReview: 3000, currency: 'USD', body: 'fincen' },
  CA: { ctr: 10000, sarReview: 3000, currency: 'CAD', body: 'fintrac' },
  GB: { ctr: null, sarReview: null, currency: 'GBP', body: 'nca' },
  EU: { ctr: 15000, sarReview: null, currency: 'EUR', body: 'fiu' },
} as const;

export const SELF_EXCLUSION_MINIMUM_PERIODS = {
  'US-NJ': '1_year',
  'GB': '6_months',
  'MT': '6_months',
  'SE': '1_year',
  'DE': '3_months',
} as const;

export const REALITY_CHECK_INTERVALS = {
  default: 60,    // minutes
  'GB': 60,       // UKGC requirement
  'MT': 60,       // MGA requirement
  'SE': 60,       // SGA requirement
  'DE': 60,       // GGL requirement
} as const;
```

---

*@mcv/compliance — Regulatory Compliance Domain*
