# @mcv/compliance/jurisdictions

> **Tier 5 Domain Module — MCV-Only**
> Multi-jurisdiction regulatory framework for venture compliance across global operating regions.
> Part of the `@mcv/compliance` domain.

---

## Purpose

The jurisdictions module is the regulatory backbone of the MCV platform, providing a comprehensive framework for managing the complex web of laws, licenses, permits, and restrictions that govern each venture's operations across multiple countries, states, provinces, and territories. With nine ventures spanning industries from online gambling (BetEdge) to cryptocurrency (HodlWave) to e-commerce (Vyntra), the platform must simultaneously comply with hundreds of overlapping regulatory regimes — each with its own age requirements, data residency rules, content restrictions, tax obligations, and licensing conditions. This module centralizes that complexity into a single, queryable, enforceable system.

At its core, jurisdictions maintains a living registry of every operating region, the specific regulations that apply within it, and the compliance status of each venture relative to those regulations. When a user from Ontario attempts to place a bet on BetEdge, this module determines whether BetEdge holds a valid AGCO license for that province, whether the user meets Ontario's age requirement of 19+, whether the user's IP geolocation confirms they are physically present within the province (as required by iGaming regulations), and whether any content restrictions apply to the promotional materials being shown. All of this happens in milliseconds, transparently, on every request.

Beyond real-time enforcement, the module manages the operational lifecycle of regulatory compliance: tracking license renewal dates, generating compliance calendars with filing deadlines, managing permit applications and conditions, determining tax nexus across jurisdictions, enforcing data residency requirements under GDPR and similar laws, and mapping the ever-changing regulatory landscape to the specific ventures it affects. It is the single source of truth for the question: "Can this venture do this thing, for this user, in this place, right now?"

---

## Exports

```typescript
// @mcv/compliance/jurisdictions — public API

// ─── Core Service ────────────────────────────────────────────────
export { JurisdictionService }            from './services/jurisdiction.service';
export { JurisdictionRouter }             from './routers/jurisdiction.router';

// ─── Sub-Services ────────────────────────────────────────────────
export { LicenseService }                 from './services/license.service';
export { GeoBlockingService }             from './services/geo-blocking.service';
export { AgeVerificationService }         from './services/age-verification.service';
export { OperatingPermitService }         from './services/operating-permit.service';
export { ComplianceCalendarService }      from './services/compliance-calendar.service';
export { RegulatoryMappingService }       from './services/regulatory-mapping.service';
export { TaxJurisdictionService }         from './services/tax-jurisdiction.service';
export { DataResidencyService }           from './services/data-residency.service';
export { ContentRestrictionService }      from './services/content-restriction.service';

// ─── Types & Interfaces ─────────────────────────────────────────
export type { Jurisdiction }              from './types/jurisdiction';
export type { JurisdictionTier }          from './types/jurisdiction';
export type { JurisdictionStatus }        from './types/jurisdiction';
export type { License }                   from './types/license';
export type { LicenseStatus }             from './types/license';
export type { LicenseType }              from './types/license';
export type { GeoFence }                  from './types/geo-fence';
export type { GeoFenceRule }              from './types/geo-fence';
export type { GeoBlockResult }            from './types/geo-fence';
export type { AgeRequirement }            from './types/age-requirement';
export type { AgeVerificationMethod }     from './types/age-requirement';
export type { AgeVerificationResult }     from './types/age-requirement';
export type { OperatingPermit }           from './types/operating-permit';
export type { PermitCondition }           from './types/operating-permit';
export type { PermitStatus }              from './types/operating-permit';
export type { ComplianceCalendar }        from './types/compliance-calendar';
export type { ComplianceDeadline }        from './types/compliance-calendar';
export type { DeadlineType }              from './types/compliance-calendar';
export type { RegulatoryRequirement }     from './types/regulatory-requirement';
export type { RegulationType }            from './types/regulatory-requirement';
export type { TaxNexus }                  from './types/tax-jurisdiction';
export type { WithholdingRule }           from './types/tax-jurisdiction';
export type { DataResidencyRule }         from './types/data-residency';
export type { DataClassification }        from './types/data-residency';
export type { ContentRestriction }        from './types/content-restriction';
export type { ContentCategory }           from './types/content-restriction';

// ─── Schemas (Drizzle ORM) ──────────────────────────────────────
export { jurisdictions }                  from './schemas/jurisdictions';
export { licenses }                       from './schemas/licenses';
export { geoRules }                       from './schemas/geo-rules';
export { ageRequirements }                from './schemas/age-requirements';
export { complianceDeadlines }            from './schemas/compliance-deadlines';
export { operatingPermits }               from './schemas/operating-permits';
export { dataResidencyRules }             from './schemas/data-residency-rules';
export { contentRestrictions }            from './schemas/content-restrictions';
export { taxNexusRules }                  from './schemas/tax-nexus-rules';
export { regulatoryMappings }             from './schemas/regulatory-mappings';
export { permitConditions }               from './schemas/permit-conditions';
export { jurisdictionVentureLicenses }    from './schemas/junction-tables';

// ─── Utilities ───────────────────────────────────────────────────
export { resolveJurisdiction }            from './utils/resolve-jurisdiction';
export { isOperatingLegal }               from './utils/legality-check';
export { getEffectiveRegulations }        from './utils/regulation-resolver';
export { calculateTaxNexus }              from './utils/tax-nexus';
export { checkDataResidency }             from './utils/data-residency-check';
export { buildGeoFence }                  from './utils/geo-fence-builder';
export { jurisdictionMiddleware }         from './middleware/jurisdiction.middleware';

// ─── Constants ───────────────────────────────────────────────────
export { JURISDICTION_CODES }             from './constants/jurisdiction-codes';
export { REGULATION_TYPES }               from './constants/regulation-types';
export { LICENSE_TYPES }                  from './constants/license-types';
export { AGE_VERIFICATION_METHODS }       from './constants/age-verification';
export { GEO_BLOCK_STRATEGIES }           from './constants/geo-blocking';
export { DATA_CLASSIFICATIONS }           from './constants/data-classifications';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        @mcv/compliance/jurisdictions                        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       JurisdictionService                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │ │
│  │  │  resolve()    │  │  checkAccess()│  │  getVentureCompliance()     │ │ │
│  │  │  register()   │  │  enforce()    │  │  getRegulationsForRegion()  │ │ │
│  │  │  update()     │  │  audit()      │  │  validateOperation()        │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         │                          │                          │            │
│         ▼                          ▼                          ▼            │
│  ┌─────────────┐  ┌──────────────────────┐  ┌──────────────────────────┐  │
│  │  Licensing   │  │    Geo-Blocking       │  │   Age Verification      │  │
│  │  Service     │  │    Service            │  │   Service               │  │
│  │             │  │                      │  │                          │  │
│  │ • track     │  │ • checkIP()          │  │ • getRequirement()       │  │
│  │ • renew     │  │ • checkGPS()         │  │ • verifyAge()            │  │
│  │ • validate  │  │ • buildFence()       │  │ • getMethod()            │  │
│  │ • expire    │  │ • enforce()          │  │ • validateDocument()     │  │
│  └──────┬──────┘  └──────────┬───────────┘  └────────────┬─────────────┘  │
│         │                    │                            │                │
│         ▼                    ▼                            ▼                │
│  ┌─────────────┐  ┌──────────────────────┐  ┌──────────────────────────┐  │
│  │  Operating   │  │  Compliance          │  │   Regulatory Mapping     │  │
│  │  Permits     │  │  Calendar            │  │   Service                │  │
│  │             │  │                      │  │                          │  │
│  │ • apply     │  │ • getDeadlines()     │  │ • mapRegulations()       │  │
│  │ • approve   │  │ • getFilings()       │  │ • getApplicable()        │  │
│  │ • condition │  │ • scheduleAudit()    │  │ • trackChanges()         │  │
│  │ • restrict  │  │ • remind()           │  │ • assessImpact()         │  │
│  └──────┬──────┘  └──────────┬───────────┘  └────────────┬─────────────┘  │
│         │                    │                            │                │
│         ▼                    ▼                            ▼                │
│  ┌─────────────┐  ┌──────────────────────┐  ┌──────────────────────────┐  │
│  │  Tax         │  │  Data Residency      │  │   Content Restrictions   │  │
│  │  Jurisdiction│  │  Service             │  │   Service                │  │
│  │             │  │                      │  │                          │  │
│  │ • nexus     │  │ • checkStorage()     │  │ • getRestrictions()      │  │
│  │ • withhold  │  │ • routeData()        │  │ • filterContent()        │  │
│  │ • report    │  │ • enforceGDPR()      │  │ • validateAd()           │  │
│  │ • calculate │  │ • auditResidency()   │  │ • blockPromotion()       │  │
│  └─────────────┘  └──────────────────────┘  └──────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          Data Layer (Drizzle ORM)                      │ │
│  │                                                                        │ │
│  │  jurisdictions │ licenses │ geo_rules │ age_requirements │ deadlines   │ │
│  │  operating_permits │ data_residency_rules │ content_restrictions       │ │
│  │  tax_nexus_rules │ regulatory_mappings │ permit_conditions            │ │
│  │  jurisdiction_venture_licenses (junction)                              │ │
│  │                                                                        │ │
│  │  All tables: tenant-scoped via org_id, RLS-enforced                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       Integration Points                               │ │
│  │                                                                        │ │
│  │  @mcv/identity ──────── User location, IP resolution, KYC data        │ │
│  │  @mcv/compliance/kyc ── Age verification docs, identity proofs        │ │
│  │  @mcv/compliance/aml ── Sanctions screening, PEP checks               │ │
│  │  @mcv/platform/ventures  Venture registry, operating regions          │ │
│  │  @mcv/observability ──── Audit trail, compliance event logging         │ │
│  │  MaxMind GeoIP2 ──────── IP-to-location resolution                    │ │
│  │  External APIs ────────── License authority APIs, tax services         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

Request Flow — Jurisdiction Enforcement Middleware:

  User Request
       │
       ▼
  ┌──────────────────┐
  │ Extract Location  │ ◄── IP (req headers) + GPS (client payload)
  │ (IP + GPS)        │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐     ┌──────────────────┐
  │ Resolve           │────►│ Jurisdiction      │
  │ Jurisdiction      │     │ Registry (DB)     │
  └────────┬─────────┘     └──────────────────┘
           │
           ▼
  ┌──────────────────┐
  │ Check Geo-Fence   │ ─── Is user in allowed region?
  └────────┬─────────┘
           │ PASS
           ▼
  ┌──────────────────┐
  │ Check License     │ ─── Does venture hold valid license here?
  └────────┬─────────┘
           │ PASS
           ▼
  ┌──────────────────┐
  │ Check Age         │ ─── Does user meet age requirement?
  └────────┬─────────┘
           │ PASS
           ▼
  ┌──────────────────┐
  │ Check Permits     │ ─── Any active restrictions or conditions?
  └────────┬─────────┘
           │ PASS
           ▼
  ┌──────────────────┐
  │ Check Content     │ ─── Apply content restrictions for region
  └────────┬─────────┘
           │ PASS
           ▼
  ┌──────────────────┐
  │ Apply Data        │ ─── Route data to compliant storage region
  │ Residency Rules   │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Request Proceeds  │ ─── With jurisdiction context attached
  │ (ctx.jurisdiction)│
  └──────────────────┘
```

---

## Core Interfaces

### JurisdictionService

The primary orchestrator that coordinates all jurisdiction-related operations. Provides the unified API consumed by venture applications and the enforcement middleware.

```typescript
import type { TRPCContext } from '@mcv/platform/trpc';
import type {
  Jurisdiction,
  JurisdictionStatus,
  License,
  GeoFence,
  GeoBlockResult,
  AgeRequirement,
  AgeVerificationResult,
  OperatingPermit,
  ComplianceDeadline,
  RegulatoryRequirement,
  TaxNexus,
  DataResidencyRule,
  ContentRestriction,
} from './types';

interface JurisdictionAccessCheck {
  allowed: boolean;
  jurisdictionCode: string;
  ventureId: string;
  reasons: JurisdictionDenialReason[];
  restrictions: ActiveRestriction[];
  dataResidencyRegion: string;
  contentRestrictions: ContentRestriction[];
  resolvedAt: Date;
  cacheTTL: number;
}

interface JurisdictionDenialReason {
  code: string;
  category: 'geo_block' | 'license' | 'age' | 'permit' | 'sanctions' | 'content';
  message: string;
  regulationRef?: string;
}

interface ActiveRestriction {
  type: string;
  description: string;
  source: string;        // Which regulation/permit imposed it
  expiresAt?: Date;
}

interface VentureComplianceStatus {
  ventureId: string;
  ventureName: string;
  jurisdictions: JurisdictionComplianceEntry[];
  overallStatus: 'compliant' | 'at_risk' | 'non_compliant';
  upcomingDeadlines: ComplianceDeadline[];
  expiringLicenses: License[];
  pendingPermits: OperatingPermit[];
}

interface JurisdictionComplianceEntry {
  jurisdictionCode: string;
  jurisdictionName: string;
  status: 'compliant' | 'conditional' | 'suspended' | 'expired' | 'not_licensed';
  licenses: License[];
  permits: OperatingPermit[];
  nextDeadline?: ComplianceDeadline;
  issues: ComplianceIssue[];
}

interface ComplianceIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  deadline?: Date;
  recommendation: string;
}

export class JurisdictionService {
  constructor(
    private readonly db: DrizzleClient,
    private readonly licenseService: LicenseService,
    private readonly geoBlockingService: GeoBlockingService,
    private readonly ageVerificationService: AgeVerificationService,
    private readonly permitService: OperatingPermitService,
    private readonly calendarService: ComplianceCalendarService,
    private readonly regulatoryService: RegulatoryMappingService,
    private readonly taxService: TaxJurisdictionService,
    private readonly dataResidencyService: DataResidencyService,
    private readonly contentService: ContentRestrictionService,
    private readonly identityService: IdentityService,     // @mcv/identity
    private readonly cache: CacheService,
    private readonly audit: AuditService,                  // @mcv/observability
  ) {}

  // ─── Jurisdiction Registry ──────────────────────────────────────

  /** Resolve jurisdiction from IP address and/or GPS coordinates */
  async resolveJurisdiction(
    ctx: TRPCContext,
    params: {
      ipAddress?: string;
      latitude?: number;
      longitude?: number;
      fallbackCode?: string;
    },
  ): Promise<Jurisdiction>;

  /** Get jurisdiction by ISO code (country, country-subdivision) */
  async getJurisdiction(
    ctx: TRPCContext,
    code: string,
  ): Promise<Jurisdiction | null>;

  /** List all jurisdictions, optionally filtered */
  async listJurisdictions(
    ctx: TRPCContext,
    filters?: {
      status?: JurisdictionStatus[];
      region?: string;
      ventureId?: string;
      hasActiveLicense?: boolean;
    },
  ): Promise<Jurisdiction[]>;

  /** Register a new jurisdiction in the system */
  async registerJurisdiction(
    ctx: TRPCContext,
    jurisdiction: CreateJurisdictionInput,
  ): Promise<Jurisdiction>;

  /** Update jurisdiction details or status */
  async updateJurisdiction(
    ctx: TRPCContext,
    code: string,
    updates: UpdateJurisdictionInput,
  ): Promise<Jurisdiction>;

  // ─── Access Control (Primary API) ──────────────────────────────

  /** Full jurisdiction access check — the main enforcement entry point */
  async checkAccess(
    ctx: TRPCContext,
    params: {
      ventureId: string;
      userId: string;
      ipAddress: string;
      gpsCoordinates?: { latitude: number; longitude: number };
      operationType: string;
      contentCategories?: string[];
    },
  ): Promise<JurisdictionAccessCheck>;

  /** Validate whether a specific operation is legal in a jurisdiction */
  async validateOperation(
    ctx: TRPCContext,
    params: {
      ventureId: string;
      jurisdictionCode: string;
      operationType: string;
    },
  ): Promise<{ valid: boolean; reasons: string[] }>;

  // ─── Venture Compliance Dashboard ──────────────────────────────

  /** Get full compliance status for a venture across all jurisdictions */
  async getVentureCompliance(
    ctx: TRPCContext,
    ventureId: string,
  ): Promise<VentureComplianceStatus>;

  /** Get all regulations applicable to a venture in a jurisdiction */
  async getApplicableRegulations(
    ctx: TRPCContext,
    ventureId: string,
    jurisdictionCode: string,
  ): Promise<RegulatoryRequirement[]>;

  /** Get upcoming compliance deadlines across all ventures */
  async getUpcomingDeadlines(
    ctx: TRPCContext,
    params?: {
      ventureId?: string;
      jurisdictionCode?: string;
      withinDays?: number;
    },
  ): Promise<ComplianceDeadline[]>;
}
```

### Jurisdiction

```typescript
/** Represents a regulatory jurisdiction (country, state, province, territory) */
interface Jurisdiction {
  /** ISO 3166-1 alpha-2 (country) or ISO 3166-2 (subdivision) code */
  code: string;

  /** Human-readable name */
  name: string;

  /** Parent jurisdiction code (e.g., "US" for "US-NJ") */
  parentCode: string | null;

  /** Jurisdiction level */
  level: 'country' | 'state' | 'province' | 'territory' | 'municipality' | 'special_zone';

  /** ISO 3166-1 alpha-2 country code (always present, even for subdivisions) */
  countryCode: string;

  /** Geographic region for grouping */
  region: 'north_america' | 'europe' | 'asia_pacific' | 'latin_america' | 'africa' | 'middle_east';

  /** Current status in MCV system */
  status: JurisdictionStatus;

  /** Timezone(s) within this jurisdiction */
  timezones: string[];

  /** Default currency code (ISO 4217) */
  defaultCurrency: string;

  /** Official language(s) (ISO 639-1) */
  languages: string[];

  /** Default minimum age for regulated activities */
  defaultMinAge: number;

  /** Whether this jurisdiction has data localization requirements */
  hasDataLocalization: boolean;

  /** Data residency region (e.g., "eu", "us-east", "ca-central") */
  dataResidencyRegion: string | null;

  /** GDPR or equivalent data protection framework */
  dataProtectionFramework: string | null;

  /** Tax treaty status with MCV's home jurisdiction */
  taxTreatyStatus: 'active' | 'none' | 'pending';

  /** Notes for compliance team */
  internalNotes: string | null;

  /** When this jurisdiction was added to the system */
  createdAt: Date;
  updatedAt: Date;
}

type JurisdictionStatus =
  | 'active'           // Ventures may operate here
  | 'restricted'       // Operations allowed with conditions
  | 'suspended'        // Temporarily not operating (regulatory issue)
  | 'prohibited'       // Cannot operate (sanctions, blanket ban)
  | 'pending_review'   // Under evaluation for entry
  | 'exiting';         // Winding down operations

type JurisdictionTier =
  | 'tier_1'   // Full operations, all ventures eligible
  | 'tier_2'   // Most ventures, some restrictions
  | 'tier_3'   // Limited ventures, significant restrictions
  | 'tier_4';  // Single venture or pilot only
```

### License

```typescript
/** A regulatory license held by a venture in a jurisdiction */
interface License {
  id: string;

  /** The venture holding this license */
  ventureId: string;

  /** Jurisdiction that issued the license */
  jurisdictionCode: string;

  /** License type (varies by jurisdiction and industry) */
  type: LicenseType;

  /** License number as issued by the authority */
  licenseNumber: string;

  /** Issuing regulatory authority */
  issuingAuthority: string;

  /** Current status */
  status: LicenseStatus;

  /** Date the license was granted */
  issuedAt: Date;

  /** Date the license expires (null if perpetual) */
  expiresAt: Date | null;

  /** Date by which renewal must be filed */
  renewalDeadline: Date | null;

  /** Whether auto-renewal is configured */
  autoRenewal: boolean;

  /** Conditions attached to this license */
  conditions: LicenseCondition[];

  /** Maximum number of users allowed (null if unlimited) */
  userCap: number | null;

  /** Geographic sub-restrictions within the jurisdiction */
  subRegionRestrictions: string[];

  /** Activities permitted under this license */
  permittedActivities: string[];

  /** Activities explicitly excluded */
  prohibitedActivities: string[];

  /** Annual license fee in jurisdiction's currency */
  annualFee: number | null;
  feeCurrency: string | null;

  /** Last compliance audit date */
  lastAuditAt: Date | null;

  /** Next required audit date */
  nextAuditAt: Date | null;

  /** Document references (stored in @mcv/documents) */
  documentIds: string[];

  createdAt: Date;
  updatedAt: Date;
}

type LicenseStatus =
  | 'active'
  | 'pending_approval'
  | 'pending_renewal'
  | 'suspended'
  | 'revoked'
  | 'expired'
  | 'surrendered';

type LicenseType =
  | 'gambling_online'
  | 'gambling_sports_betting'
  | 'gambling_casino'
  | 'gambling_poker'
  | 'gambling_lottery'
  | 'money_transmission'
  | 'crypto_exchange'
  | 'crypto_custody'
  | 'payment_services'
  | 'e_commerce'
  | 'data_processing'
  | 'financial_services'
  | 'content_distribution'
  | 'general_business';

interface LicenseCondition {
  id: string;
  description: string;
  type: 'reporting' | 'operational' | 'financial' | 'technical' | 'staffing';
  frequency?: string;      // e.g., "monthly", "quarterly", "annually"
  deadline?: Date;
  status: 'met' | 'at_risk' | 'violated';
}
```

### GeoFence

```typescript
/** Defines a geographic boundary for access control */
interface GeoFence {
  id: string;

  /** Jurisdiction this fence applies to */
  jurisdictionCode: string;

  /** Venture this rule applies to (null = all ventures) */
  ventureId: string | null;

  /** Rule type */
  ruleType: 'allow' | 'block' | 'restrict';

  /** The area definition */
  area: GeoArea;

  /** Priority (higher = evaluated first) */
  priority: number;

  /** Whether this rule is currently active */
  active: boolean;

  /** Reason for this rule */
  reason: string;

  /** Regulatory reference */
  regulationRef: string | null;

  /** Enforcement method */
  enforcement: GeoEnforcementMethod;

  /** Bypass rules (e.g., for compliance officers) */
  bypassRoles: string[];

  effectiveFrom: Date;
  effectiveUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type GeoArea =
  | { type: 'jurisdiction'; code: string }
  | { type: 'polygon'; coordinates: [number, number][] }
  | { type: 'circle'; center: { lat: number; lng: number }; radiusKm: number }
  | { type: 'ip_range'; cidrs: string[] };

type GeoEnforcementMethod =
  | 'ip_only'              // Check IP geolocation only
  | 'gps_only'             // Require GPS coordinates
  | 'ip_and_gps'           // Both must agree
  | 'ip_or_gps'            // Either can confirm
  | 'ip_with_gps_fallback' // Use IP, require GPS if inconclusive
  | 'strict';              // IP + GPS + additional verification

interface GeoBlockResult {
  allowed: boolean;
  jurisdictionCode: string;
  matchedRule: string | null;
  enforcement: GeoEnforcementMethod;
  confidence: number;          // 0.0 - 1.0
  ipLocation: GeoPoint | null;
  gpsLocation: GeoPoint | null;
  vpnDetected: boolean;
  proxyDetected: boolean;
  locationMismatch: boolean;   // IP and GPS disagree significantly
  checkedAt: Date;
}

interface GeoPoint {
  latitude: number;
  longitude: number;
  accuracy: 'high' | 'medium' | 'low';
  source: 'ip' | 'gps' | 'wifi' | 'cell_tower';
  provider: string;
}

interface GeoFenceRule {
  id: string;
  jurisdictionCode: string;
  ventureId: string | null;
  action: 'allow' | 'block' | 'restrict';
  ipRanges: string[];
  polygonCoordinates: [number, number][] | null;
  radiusCenter: { lat: number; lng: number } | null;
  radiusKm: number | null;
  enforcement: GeoEnforcementMethod;
  reason: string;
  active: boolean;
  priority: number;
}
```

### ComplianceCalendar

```typescript
/** A compliance calendar entry — filing deadline, audit, or reporting period */
interface ComplianceCalendar {
  id: string;

  /** Venture this deadline applies to */
  ventureId: string;

  /** Jurisdiction for this deadline */
  jurisdictionCode: string;

  /** License this relates to (if applicable) */
  licenseId: string | null;

  /** Type of deadline */
  type: DeadlineType;

  /** Human-readable title */
  title: string;

  /** Detailed description of what's required */
  description: string;

  /** The deadline date/time */
  deadline: Date;

  /** How often this recurs */
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

  /** Regulatory authority requiring this */
  authority: string;

  /** Regulation reference (e.g., "AGCO Reg. 4.2.1") */
  regulationRef: string | null;

  /** Current status */
  status: 'upcoming' | 'in_progress' | 'submitted' | 'completed' | 'overdue' | 'waived';

  /** Days before deadline to send first reminder */
  reminderDays: number[];

  /** Who is responsible */
  assignedTeam: string;
  assignedUserId: string | null;

  /** Penalty for missing this deadline */
  penaltyDescription: string | null;
  penaltyAmount: number | null;
  penaltyCurrency: string | null;

  /** Filing reference/confirmation number */
  filingReference: string | null;

  /** Document IDs for submitted materials */
  submissionDocumentIds: string[];

  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type DeadlineType =
  | 'license_renewal'
  | 'regulatory_filing'
  | 'financial_report'
  | 'audit_scheduled'
  | 'audit_response'
  | 'tax_filing'
  | 'data_protection_report'
  | 'incident_report'
  | 'player_protection_report'
  | 'aml_report'
  | 'responsible_gambling_report'
  | 'technical_compliance_test'
  | 'permit_renewal'
  | 'self_exclusion_report'
  | 'advertising_report'
  | 'custom';

interface ComplianceDeadline {
  id: string;
  ventureId: string;
  ventureName: string;
  jurisdictionCode: string;
  jurisdictionName: string;
  type: DeadlineType;
  title: string;
  deadline: Date;
  daysUntil: number;
  status: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  assignedTeam: string;
}
```

### RegulatoryRequirement

```typescript
/** A specific regulatory requirement that applies to ventures in a jurisdiction */
interface RegulatoryRequirement {
  id: string;

  /** The jurisdiction imposing this requirement */
  jurisdictionCode: string;

  /** Regulation type category */
  type: RegulationType;

  /** Short code for this regulation */
  regulationCode: string;

  /** Full name of the regulation/law */
  regulationName: string;

  /** Section/article reference */
  sectionRef: string;

  /** Plain-language summary */
  summary: string;

  /** Detailed requirements text */
  fullText: string;

  /** Which venture types this applies to */
  applicableVentureTypes: string[];

  /** Specific ventures this is mapped to (empty = all matching type) */
  mappedVentureIds: string[];

  /** Compliance requirements (what must be done) */
  requirements: ComplianceRequirementItem[];

  /** Effective date of this regulation */
  effectiveDate: Date;

  /** Sunset/expiry date if applicable */
  sunsetDate: Date | null;

  /** Penalties for non-compliance */
  penalties: RegulatoryPenalty[];

  /** How often compliance must be demonstrated */
  complianceFrequency: string;

  /** Current compliance status across mapped ventures */
  complianceRate: number;   // 0.0 - 1.0

  /** External URL to regulation text */
  sourceUrl: string | null;

  /** Last time this regulation was reviewed for accuracy */
  lastReviewedAt: Date;

  /** Who reviewed it */
  reviewedBy: string;

  createdAt: Date;
  updatedAt: Date;
}

type RegulationType =
  | 'gambling'
  | 'financial_services'
  | 'data_protection'
  | 'consumer_protection'
  | 'anti_money_laundering'
  | 'tax'
  | 'advertising'
  | 'age_restriction'
  | 'responsible_gambling'
  | 'crypto_regulation'
  | 'e_commerce'
  | 'content_moderation'
  | 'employment'
  | 'accessibility'
  | 'sanctions';

interface ComplianceRequirementItem {
  id: string;
  description: string;
  mandatory: boolean;
  verificationMethod: string;
  evidenceType: string;
}

interface RegulatoryPenalty {
  type: 'fine' | 'license_suspension' | 'license_revocation' | 'criminal' | 'operational_ban';
  description: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
}
```

---

## Database Schemas

All schemas use Drizzle ORM targeting Supabase PostgreSQL. Every table is tenant-scoped via `org_id` and enforced through Row-Level Security (RLS) policies. Jurisdiction data is inherently shared across the organization but scoped to the ventures within that organization.

### jurisdictions

```typescript
import { pgTable, text, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const jurisdictionStatusEnum = pgEnum('jurisdiction_status', [
  'active',
  'restricted',
  'suspended',
  'prohibited',
  'pending_review',
  'exiting',
]);

export const jurisdictionLevelEnum = pgEnum('jurisdiction_level', [
  'country',
  'state',
  'province',
  'territory',
  'municipality',
  'special_zone',
]);

export const regionEnum = pgEnum('jurisdiction_region', [
  'north_america',
  'europe',
  'asia_pacific',
  'latin_america',
  'africa',
  'middle_east',
]);

export const jurisdictions = pgTable('jurisdictions', {
  // ISO 3166-1 alpha-2 or ISO 3166-2 code (e.g., "US", "US-NJ", "GB", "MT")
  code: text('code').primaryKey(),

  // Organization scope
  orgId: text('org_id').notNull().references(() => organizations.id),

  // Hierarchy
  name: text('name').notNull(),
  parentCode: text('parent_code').references(() => jurisdictions.code),
  level: jurisdictionLevelEnum('level').notNull(),
  countryCode: text('country_code').notNull(),   // always ISO alpha-2 country
  region: regionEnum('region').notNull(),

  // Status
  status: jurisdictionStatusEnum('status').notNull().default('pending_review'),

  // Locale
  timezones: jsonb('timezones').$type<string[]>().notNull().default([]),
  defaultCurrency: text('default_currency').notNull().default('USD'),
  languages: jsonb('languages').$type<string[]>().notNull().default([]),

  // Age
  defaultMinAge: integer('default_min_age').notNull().default(18),

  // Data
  hasDataLocalization: boolean('has_data_localization').notNull().default(false),
  dataResidencyRegion: text('data_residency_region'),
  dataProtectionFramework: text('data_protection_framework'),

  // Tax
  taxTreatyStatus: text('tax_treaty_status').notNull().default('none'),

  // Meta
  internalNotes: text('internal_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_jurisdictions_org ON jurisdictions(org_id);
// CREATE INDEX idx_jurisdictions_country ON jurisdictions(country_code);
// CREATE INDEX idx_jurisdictions_region ON jurisdictions(region);
// CREATE INDEX idx_jurisdictions_status ON jurisdictions(status);
// CREATE INDEX idx_jurisdictions_parent ON jurisdictions(parent_code);
```

### licenses

```typescript
import { pgTable, text, timestamp, boolean, integer, numeric, jsonb, uuid } from 'drizzle-orm/pg-core';

export const licenseStatusEnum = pgEnum('license_status', [
  'active',
  'pending_approval',
  'pending_renewal',
  'suspended',
  'revoked',
  'expired',
  'surrendered',
]);

export const licenseTypeEnum = pgEnum('license_type', [
  'gambling_online',
  'gambling_sports_betting',
  'gambling_casino',
  'gambling_poker',
  'gambling_lottery',
  'money_transmission',
  'crypto_exchange',
  'crypto_custody',
  'payment_services',
  'e_commerce',
  'data_processing',
  'financial_services',
  'content_distribution',
  'general_business',
]);

export const licenses = pgTable('licenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  jurisdictionCode: text('jurisdiction_code').notNull().references(() => jurisdictions.code),

  // License details
  type: licenseTypeEnum('type').notNull(),
  licenseNumber: text('license_number').notNull(),
  issuingAuthority: text('issuing_authority').notNull(),
  status: licenseStatusEnum('status').notNull().default('pending_approval'),

  // Dates
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  renewalDeadline: timestamp('renewal_deadline', { withTimezone: true }),
  autoRenewal: boolean('auto_renewal').notNull().default(false),

  // Scope
  userCap: integer('user_cap'),
  subRegionRestrictions: jsonb('sub_region_restrictions').$type<string[]>().default([]),
  permittedActivities: jsonb('permitted_activities').$type<string[]>().notNull().default([]),
  prohibitedActivities: jsonb('prohibited_activities').$type<string[]>().default([]),

  // Financial
  annualFee: numeric('annual_fee', { precision: 12, scale: 2 }),
  feeCurrency: text('fee_currency'),

  // Compliance
  conditions: jsonb('conditions').$type<LicenseCondition[]>().default([]),
  lastAuditAt: timestamp('last_audit_at', { withTimezone: true }),
  nextAuditAt: timestamp('next_audit_at', { withTimezone: true }),

  // Documents
  documentIds: jsonb('document_ids').$type<string[]>().default([]),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE UNIQUE INDEX idx_licenses_number ON licenses(jurisdiction_code, license_number);
// CREATE INDEX idx_licenses_venture ON licenses(venture_id);
// CREATE INDEX idx_licenses_jurisdiction ON licenses(jurisdiction_code);
// CREATE INDEX idx_licenses_status ON licenses(status);
// CREATE INDEX idx_licenses_expires ON licenses(expires_at) WHERE expires_at IS NOT NULL;
// CREATE INDEX idx_licenses_renewal ON licenses(renewal_deadline) WHERE renewal_deadline IS NOT NULL;
```

### geo_rules

```typescript
import { pgTable, text, timestamp, boolean, integer, numeric, jsonb, uuid } from 'drizzle-orm/pg-core';

export const geoRuleActionEnum = pgEnum('geo_rule_action', ['allow', 'block', 'restrict']);

export const geoEnforcementEnum = pgEnum('geo_enforcement', [
  'ip_only',
  'gps_only',
  'ip_and_gps',
  'ip_or_gps',
  'ip_with_gps_fallback',
  'strict',
]);

export const geoRules = pgTable('geo_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  jurisdictionCode: text('jurisdiction_code').notNull().references(() => jurisdictions.code),
  ventureId: text('venture_id').references(() => ventures.id),   // null = all ventures

  // Rule definition
  action: geoRuleActionEnum('action').notNull(),
  priority: integer('priority').notNull().default(0),
  active: boolean('active').notNull().default(true),

  // Area (one of these will be populated)
  areaType: text('area_type').notNull(),  // 'jurisdiction' | 'polygon' | 'circle' | 'ip_range'
  areaJurisdictionCode: text('area_jurisdiction_code'),
  areaPolygon: jsonb('area_polygon').$type<[number, number][]>(),
  areaCircleCenter: jsonb('area_circle_center').$type<{ lat: number; lng: number }>(),
  areaCircleRadiusKm: numeric('area_circle_radius_km', { precision: 10, scale: 2 }),
  areaCidrs: jsonb('area_cidrs').$type<string[]>(),

  // Enforcement
  enforcement: geoEnforcementEnum('enforcement').notNull().default('ip_only'),
  bypassRoles: jsonb('bypass_roles').$type<string[]>().default([]),

  // Metadata
  reason: text('reason').notNull(),
  regulationRef: text('regulation_ref'),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_geo_rules_jurisdiction ON geo_rules(jurisdiction_code);
// CREATE INDEX idx_geo_rules_venture ON geo_rules(venture_id);
// CREATE INDEX idx_geo_rules_active ON geo_rules(active) WHERE active = true;
// CREATE INDEX idx_geo_rules_priority ON geo_rules(priority DESC);
```

### age_requirements

```typescript
import { pgTable, text, timestamp, integer, jsonb, uuid } from 'drizzle-orm/pg-core';

export const ageVerificationMethodEnum = pgEnum('age_verification_method', [
  'self_declaration',
  'date_of_birth',
  'government_id',
  'credit_card',
  'third_party_service',
  'biometric',
  'knowledge_based',
  'social_insurance',
]);

export const ageRequirements = pgTable('age_requirements', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  jurisdictionCode: text('jurisdiction_code').notNull().references(() => jurisdictions.code),
  ventureId: text('venture_id').references(() => ventures.id),   // null = all ventures

  // Age requirement
  activityType: text('activity_type').notNull(),   // 'gambling', 'alcohol', 'cannabis', 'general', etc.
  minimumAge: integer('minimum_age').notNull(),

  // Verification
  requiredMethod: ageVerificationMethodEnum('required_method').notNull(),
  acceptedMethods: jsonb('accepted_methods').$type<string[]>().notNull(),
  reverificationDays: integer('reverification_days'),   // How often to re-verify (null = once)

  // Regulation
  regulationRef: text('regulation_ref'),
  penaltyForViolation: text('penalty_for_violation'),

  // Validity
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE UNIQUE INDEX idx_age_req_unique ON age_requirements(jurisdiction_code, venture_id, activity_type)
//   WHERE effective_until IS NULL;
// CREATE INDEX idx_age_req_jurisdiction ON age_requirements(jurisdiction_code);
// CREATE INDEX idx_age_req_venture ON age_requirements(venture_id);
```

### compliance_deadlines

```typescript
import { pgTable, text, timestamp, integer, numeric, jsonb, uuid } from 'drizzle-orm/pg-core';

export const deadlineTypeEnum = pgEnum('deadline_type', [
  'license_renewal',
  'regulatory_filing',
  'financial_report',
  'audit_scheduled',
  'audit_response',
  'tax_filing',
  'data_protection_report',
  'incident_report',
  'player_protection_report',
  'aml_report',
  'responsible_gambling_report',
  'technical_compliance_test',
  'permit_renewal',
  'self_exclusion_report',
  'advertising_report',
  'custom',
]);

export const deadlineStatusEnum = pgEnum('deadline_status', [
  'upcoming',
  'in_progress',
  'submitted',
  'completed',
  'overdue',
  'waived',
]);

export const recurrenceEnum = pgEnum('deadline_recurrence', [
  'once',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
]);

export const complianceDeadlines = pgTable('compliance_deadlines', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  jurisdictionCode: text('jurisdiction_code').notNull().references(() => jurisdictions.code),
  licenseId: uuid('license_id').references(() => licenses.id),

  // Deadline details
  type: deadlineTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  deadline: timestamp('deadline', { withTimezone: true }).notNull(),
  recurrence: recurrenceEnum('recurrence').notNull().default('once'),

  // Authority
  authority: text('authority').notNull(),
  regulationRef: text('regulation_ref'),

  // Status
  status: deadlineStatusEnum('status').notNull().default('upcoming'),

  // Reminders
  reminderDays: jsonb('reminder_days').$type<number[]>().notNull().default([30, 14, 7, 3, 1]),

  // Assignment
  assignedTeam: text('assigned_team').notNull(),
  assignedUserId: text('assigned_user_id'),

  // Penalties
  penaltyDescription: text('penalty_description'),
  penaltyAmount: numeric('penalty_amount', { precision: 12, scale: 2 }),
  penaltyCurrency: text('penalty_currency'),

  // Completion
  filingReference: text('filing_reference'),
  submissionDocumentIds: jsonb('submission_document_ids').$type<string[]>().default([]),
  completedAt: timestamp('completed_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_deadlines_venture ON compliance_deadlines(venture_id);
// CREATE INDEX idx_deadlines_jurisdiction ON compliance_deadlines(jurisdiction_code);
// CREATE INDEX idx_deadlines_deadline ON compliance_deadlines(deadline);
// CREATE INDEX idx_deadlines_status ON compliance_deadlines(status);
// CREATE INDEX idx_deadlines_upcoming ON compliance_deadlines(deadline, status)
//   WHERE status IN ('upcoming', 'in_progress');
```

### operating_permits

```typescript
import { pgTable, text, timestamp, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';

export const permitStatusEnum = pgEnum('permit_status', [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'conditional',
  'denied',
  'suspended',
  'revoked',
  'expired',
  'withdrawn',
]);

export const operatingPermits = pgTable('operating_permits', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  jurisdictionCode: text('jurisdiction_code').notNull().references(() => jurisdictions.code),

  // Permit details
  permitType: text('permit_type').notNull(),
  permitNumber: text('permit_number'),
  issuingAuthority: text('issuing_authority').notNull(),
  status: permitStatusEnum('status').notNull().default('draft'),

  // Application
  applicationDate: timestamp('application_date', { withTimezone: true }),
  applicationRef: text('application_ref'),

  // Approval
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: text('approved_by'),
  denialReason: text('denial_reason'),

  // Validity
  effectiveFrom: timestamp('effective_from', { withTimezone: true }),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),
  renewalDeadline: timestamp('renewal_deadline', { withTimezone: true }),

  // Scope
  permittedOperations: jsonb('permitted_operations').$type<string[]>().notNull().default([]),
  restrictions: jsonb('restrictions').$type<string[]>().default([]),
  maxTransactionVolume: text('max_transaction_volume'),
  operatingHours: jsonb('operating_hours').$type<Record<string, string>>(),

  // Documents
  documentIds: jsonb('document_ids').$type<string[]>().default([]),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_permits_venture ON operating_permits(venture_id);
// CREATE INDEX idx_permits_jurisdiction ON operating_permits(jurisdiction_code);
// CREATE INDEX idx_permits_status ON operating_permits(status);
// CREATE INDEX idx_permits_expiry ON operating_permits(effective_until) WHERE effective_until IS NOT NULL;
```

### data_residency_rules

```typescript
import { pgTable, text, timestamp, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';

export const dataClassificationEnum = pgEnum('data_classification', [
  'public',
  'internal',
  'confidential',
  'sensitive',
  'pii',
  'financial',
  'health',
  'biometric',
  'children',
  'gambling_activity',
]);

export const dataResidencyRules = pgTable('data_residency_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  jurisdictionCode: text('jurisdiction_code').notNull().references(() => jurisdictions.code),

  // What data
  dataClassification: dataClassificationEnum('data_classification').notNull(),
  dataCategories: jsonb('data_categories').$type<string[]>().notNull(),

  // Where it can live
  allowedRegions: jsonb('allowed_regions').$type<string[]>().notNull(),
  prohibitedRegions: jsonb('prohibited_regions').$type<string[]>().default([]),
  preferredRegion: text('preferred_region').notNull(),

  // Transfer rules
  crossBorderTransferAllowed: boolean('cross_border_transfer_allowed').notNull().default(false),
  transferMechanisms: jsonb('transfer_mechanisms').$type<string[]>().default([]),
  // e.g., ['standard_contractual_clauses', 'binding_corporate_rules', 'adequacy_decision']

  // Encryption
  encryptionRequired: boolean('encryption_required').notNull().default(true),
  encryptionStandard: text('encryption_standard'),   // e.g., 'AES-256'

  // Retention
  retentionPeriodDays: integer('retention_period_days'),
  deletionRequired: boolean('deletion_required').notNull().default(false),

  // Legal basis
  legalFramework: text('legal_framework').notNull(),   // e.g., 'GDPR', 'PIPEDA', 'CCPA'
  regulationRef: text('regulation_ref'),

  // Audit
  lastAuditAt: timestamp('last_audit_at', { withTimezone: true }),
  auditFrequencyDays: integer('audit_frequency_days'),

  active: boolean('active').notNull().default(true),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_residency_jurisdiction ON data_residency_rules(jurisdiction_code);
// CREATE INDEX idx_residency_classification ON data_residency_rules(data_classification);
// CREATE INDEX idx_residency_active ON data_residency_rules(active) WHERE active = true;
```

### regulatory_mappings

```typescript
import { pgTable, text, timestamp, boolean, numeric, jsonb, uuid } from 'drizzle-orm/pg-core';

export const regulationTypeEnum = pgEnum('regulation_type', [
  'gambling',
  'financial_services',
  'data_protection',
  'consumer_protection',
  'anti_money_laundering',
  'tax',
  'advertising',
  'age_restriction',
  'responsible_gambling',
  'crypto_regulation',
  'e_commerce',
  'content_moderation',
  'employment',
  'accessibility',
  'sanctions',
]);

export const regulatoryMappings = pgTable('regulatory_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  jurisdictionCode: text('jurisdiction_code').notNull().references(() => jurisdictions.code),

  // Regulation identity
  type: regulationTypeEnum('type').notNull(),
  regulationCode: text('regulation_code').notNull(),
  regulationName: text('regulation_name').notNull(),
  sectionRef: text('section_ref').notNull(),

  // Content
  summary: text('summary').notNull(),
  fullText: text('full_text').notNull(),

  // Applicability
  applicableVentureTypes: jsonb('applicable_venture_types').$type<string[]>().notNull(),
  mappedVentureIds: jsonb('mapped_venture_ids').$type<string[]>().default([]),

  // Requirements
  requirements: jsonb('requirements').$type<ComplianceRequirementItem[]>().notNull().default([]),

  // Dates
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
  sunsetDate: timestamp('sunset_date', { withTimezone: true }),

  // Penalties
  penalties: jsonb('penalties').$type<RegulatoryPenalty[]>().default([]),

  // Compliance
  complianceFrequency: text('compliance_frequency').notNull().default('ongoing'),
  complianceRate: numeric('compliance_rate', { precision: 5, scale: 4 }).default('0'),

  // Source
  sourceUrl: text('source_url'),

  // Review
  lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedBy: text('reviewed_by').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE UNIQUE INDEX idx_reg_mapping_unique ON regulatory_mappings(jurisdiction_code, regulation_code, section_ref);
// CREATE INDEX idx_reg_mapping_type ON regulatory_mappings(type);
// CREATE INDEX idx_reg_mapping_jurisdiction ON regulatory_mappings(jurisdiction_code);
// CREATE INDEX idx_reg_mapping_effective ON regulatory_mappings(effective_date);
```

### content_restrictions

```typescript
import { pgTable, text, timestamp, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';

export const contentCategoryEnum = pgEnum('content_category', [
  'gambling_advertising',
  'crypto_marketing',
  'alcohol_promotion',
  'tobacco_promotion',
  'cannabis_promotion',
  'adult_content',
  'political_advertising',
  'financial_promotion',
  'health_claims',
  'testimonials',
  'bonus_offers',
  'odds_display',
  'risk_warnings',
  'social_media',
]);

export const contentRestrictions = pgTable('content_restrictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  jurisdictionCode: text('jurisdiction_code').notNull().references(() => jurisdictions.code),
  ventureId: text('venture_id').references(() => ventures.id),   // null = all ventures

  // What content
  category: contentCategoryEnum('category').notNull(),

  // Rule
  action: text('action').notNull(),   // 'block', 'modify', 'disclaimer', 'time_restrict', 'age_gate'
  description: text('description').notNull(),
  requiredDisclaimer: text('required_disclaimer'),
  maxFrequency: text('max_frequency'),              // e.g., "3 per hour"
  timeRestrictions: jsonb('time_restrictions').$type<TimeRestriction[]>(),
  // e.g., no gambling ads between 6am-9pm in Italy

  // Targeting
  audienceRestrictions: jsonb('audience_restrictions').$type<string[]>(),
  // e.g., ["no_minors", "no_self_excluded", "no_vulnerable"]

  // Regulation
  regulationRef: text('regulation_ref'),
  penaltyDescription: text('penalty_description'),

  active: boolean('active').notNull().default(true),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

interface TimeRestriction {
  dayOfWeek?: number[];   // 0-6, Sunday = 0
  startHour: number;       // 0-23
  endHour: number;         // 0-23
  timezone: string;
  action: 'block' | 'restrict';
}

// Indexes
// CREATE INDEX idx_content_jurisdiction ON content_restrictions(jurisdiction_code);
// CREATE INDEX idx_content_category ON content_restrictions(category);
// CREATE INDEX idx_content_venture ON content_restrictions(venture_id);
// CREATE INDEX idx_content_active ON content_restrictions(active) WHERE active = true;
```

### tax_nexus_rules

```typescript
import { pgTable, text, timestamp, boolean, numeric, jsonb, uuid } from 'drizzle-orm/pg-core';

export const taxNexusRules = pgTable('tax_nexus_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  jurisdictionCode: text('jurisdiction_code').notNull().references(() => jurisdictions.code),
  ventureId: text('venture_id').references(() => ventures.id),

  // Nexus determination
  nexusType: text('nexus_type').notNull(),
  // e.g., 'physical_presence', 'economic_nexus', 'registration', 'marketplace_facilitator'
  nexusEstablished: boolean('nexus_established').notNull().default(false),
  nexusEstablishedDate: timestamp('nexus_established_date', { withTimezone: true }),

  // Thresholds
  revenueThreshold: numeric('revenue_threshold', { precision: 14, scale: 2 }),
  transactionThreshold: integer('transaction_threshold'),
  thresholdCurrency: text('threshold_currency'),
  thresholdPeriod: text('threshold_period'),   // 'calendar_year', 'rolling_12_months'

  // Withholding
  withholdingRequired: boolean('withholding_required').notNull().default(false),
  withholdingRate: numeric('withholding_rate', { precision: 6, scale: 4 }),
  withholdingType: text('withholding_type'),   // 'gross', 'net', 'tiered'
  withholdingCategories: jsonb('withholding_categories').$type<WithholdingCategory[]>().default([]),

  // Filing
  filingRequired: boolean('filing_required').notNull().default(false),
  filingFrequency: text('filing_frequency'),   // 'monthly', 'quarterly', 'annual'
  filingAuthority: text('filing_authority'),

  // Rates
  corporateTaxRate: numeric('corporate_tax_rate', { precision: 6, scale: 4 }),
  gamblingTaxRate: numeric('gambling_tax_rate', { precision: 6, scale: 4 }),
  vatRate: numeric('vat_rate', { precision: 6, scale: 4 }),
  gstRate: numeric('gst_rate', { precision: 6, scale: 4 }),

  // Treaty
  treatyBenefitsApplicable: boolean('treaty_benefits_applicable').notNull().default(false),
  reducedRate: numeric('reduced_rate', { precision: 6, scale: 4 }),

  // Meta
  regulationRef: text('regulation_ref'),
  notes: text('notes'),
  active: boolean('active').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

interface WithholdingCategory {
  category: string;        // e.g., 'gambling_winnings', 'payment_processing'
  rate: number;
  threshold: number | null;
  reportingRequired: boolean;
}

// Indexes
// CREATE INDEX idx_tax_nexus_jurisdiction ON tax_nexus_rules(jurisdiction_code);
// CREATE INDEX idx_tax_nexus_venture ON tax_nexus_rules(venture_id);
// CREATE INDEX idx_tax_nexus_established ON tax_nexus_rules(nexus_established) WHERE nexus_established = true;
```

### permit_conditions

```typescript
import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';

export const conditionStatusEnum = pgEnum('condition_status', [
  'met',
  'at_risk',
  'violated',
  'not_applicable',
  'pending_review',
]);

export const permitConditions = pgTable('permit_conditions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  permitId: uuid('permit_id').notNull().references(() => operatingPermits.id),

  // Condition
  conditionType: text('condition_type').notNull(),
  // e.g., 'reporting', 'operational', 'financial', 'technical', 'staffing'
  description: text('description').notNull(),
  frequency: text('frequency'),             // e.g., 'monthly', 'quarterly'
  nextDeadline: timestamp('next_deadline', { withTimezone: true }),

  // Status
  status: conditionStatusEnum('status').notNull().default('pending_review'),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  lastEvidenceIds: jsonb('last_evidence_ids').$type<string[]>().default([]),
  violationHistory: jsonb('violation_history').$type<ConditionViolation[]>().default([]),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

interface ConditionViolation {
  date: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  resolution: string;
  resolvedAt: string | null;
}

// Indexes
// CREATE INDEX idx_conditions_permit ON permit_conditions(permit_id);
// CREATE INDEX idx_conditions_status ON permit_conditions(status);
// CREATE INDEX idx_conditions_deadline ON permit_conditions(next_deadline) WHERE next_deadline IS NOT NULL;
```

---

## Code Examples

### 1. Check Jurisdiction Access (Full Pipeline)

The primary use case — determining whether a user can access a venture's services from their current location. This runs on every authenticated request via the jurisdiction middleware.

```typescript
import { JurisdictionService } from '@mcv/compliance/jurisdictions';
import { createTRPCContext } from '@mcv/platform/trpc';

// In a tRPC middleware or API route handler
async function handleRequest(req: Request) {
  const ctx = await createTRPCContext({ req });
  const jurisdictionService = ctx.services.jurisdiction;

  // Extract location signals from the request
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('cf-connecting-ip')
    ?? '0.0.0.0';

  const gpsCoordinates = req.headers.get('x-client-gps')
    ? JSON.parse(req.headers.get('x-client-gps')!)
    : undefined;

  // Perform the full jurisdiction access check
  const accessCheck = await jurisdictionService.checkAccess(ctx, {
    ventureId: ctx.venture.id,
    userId: ctx.user.id,
    ipAddress,
    gpsCoordinates,
    operationType: 'sports_betting',
    contentCategories: ['odds_display', 'bonus_offers'],
  });

  if (!accessCheck.allowed) {
    // Log the denial for compliance records
    await ctx.services.audit.log({
      event: 'jurisdiction.access_denied',
      userId: ctx.user.id,
      ventureId: ctx.venture.id,
      jurisdictionCode: accessCheck.jurisdictionCode,
      reasons: accessCheck.reasons,
      ipAddress,
      gpsCoordinates,
    });

    // Return appropriate error based on denial reason
    const primaryReason = accessCheck.reasons[0];
    switch (primaryReason.category) {
      case 'geo_block':
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This service is not available in your region.',
          cause: { code: 'JURISDICTION_GEO_BLOCKED' },
        });
      case 'license':
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This service is not currently licensed in your jurisdiction.',
          cause: { code: 'JURISDICTION_NO_LICENSE' },
        });
      case 'age':
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Age verification is required to access this service.',
          cause: { code: 'JURISDICTION_AGE_REQUIRED' },
        });
      default:
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access is not permitted in your jurisdiction.',
          cause: { code: 'JURISDICTION_DENIED' },
        });
    }
  }

  // Attach jurisdiction context to the request for downstream use
  ctx.jurisdiction = {
    code: accessCheck.jurisdictionCode,
    restrictions: accessCheck.restrictions,
    dataResidencyRegion: accessCheck.dataResidencyRegion,
    contentRestrictions: accessCheck.contentRestrictions,
  };

  // Continue processing the request
  return next(ctx);
}
```

### 2. Verify Age for a Jurisdiction

Different jurisdictions have different age requirements. Ontario requires 19+ for gambling, most US states require 21+, the UK requires 18+.

```typescript
import { AgeVerificationService } from '@mcv/compliance/jurisdictions';
import type { AgeVerificationResult } from '@mcv/compliance/jurisdictions';

class BetEdgeRegistrationHandler {
  constructor(
    private readonly ageService: AgeVerificationService,
    private readonly kycService: KYCService,  // from @mcv/compliance/kyc
  ) {}

  async verifyUserAge(
    ctx: TRPCContext,
    params: {
      userId: string;
      jurisdictionCode: string;
      dateOfBirth: Date;
      governmentIdDocumentId?: string;
    },
  ): Promise<AgeVerificationResult> {
    // 1. Get the age requirement for this jurisdiction + activity
    const requirement = await this.ageService.getRequirement(ctx, {
      jurisdictionCode: params.jurisdictionCode,
      ventureId: ctx.venture.id,
      activityType: 'gambling',
    });

    if (!requirement) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `No age requirement configured for gambling in ${params.jurisdictionCode}`,
      });
    }

    console.log(
      `Jurisdiction ${params.jurisdictionCode} requires minimum age ${requirement.minimumAge} ` +
      `with verification method: ${requirement.requiredMethod}`
    );
    // e.g., "Jurisdiction US-NJ requires minimum age 21 with verification method: government_id"
    // e.g., "Jurisdiction CA-ON requires minimum age 19 with verification method: third_party_service"
    // e.g., "Jurisdiction GB requires minimum age 18 with verification method: government_id"

    // 2. Calculate age from date of birth
    const age = this.calculateAge(params.dateOfBirth);

    if (age < requirement.minimumAge) {
      await ctx.services.audit.log({
        event: 'jurisdiction.age_verification_failed',
        userId: params.userId,
        jurisdictionCode: params.jurisdictionCode,
        minimumAge: requirement.minimumAge,
        userAge: age,
        reason: 'underage',
      });

      return {
        verified: false,
        minimumAge: requirement.minimumAge,
        userAge: age,
        method: 'date_of_birth',
        reason: `User does not meet minimum age requirement of ${requirement.minimumAge}`,
        jurisdictionCode: params.jurisdictionCode,
      };
    }

    // 3. If government ID verification is required, delegate to KYC
    if (
      requirement.requiredMethod === 'government_id' ||
      requirement.requiredMethod === 'third_party_service'
    ) {
      if (!params.governmentIdDocumentId) {
        return {
          verified: false,
          minimumAge: requirement.minimumAge,
          userAge: age,
          method: requirement.requiredMethod,
          reason: 'Government-issued ID verification required',
          jurisdictionCode: params.jurisdictionCode,
          additionalVerificationRequired: true,
          acceptedMethods: requirement.acceptedMethods,
        };
      }

      // Verify via KYC service
      const kycResult = await this.kycService.verifyAge({
        userId: params.userId,
        documentId: params.governmentIdDocumentId,
        expectedMinAge: requirement.minimumAge,
        method: requirement.requiredMethod,
      });

      if (!kycResult.verified) {
        return {
          verified: false,
          minimumAge: requirement.minimumAge,
          userAge: age,
          method: requirement.requiredMethod,
          reason: kycResult.reason ?? 'ID verification failed',
          jurisdictionCode: params.jurisdictionCode,
        };
      }
    }

    // 4. Age verified successfully
    await ctx.services.audit.log({
      event: 'jurisdiction.age_verification_passed',
      userId: params.userId,
      jurisdictionCode: params.jurisdictionCode,
      minimumAge: requirement.minimumAge,
      method: requirement.requiredMethod,
    });

    return {
      verified: true,
      minimumAge: requirement.minimumAge,
      userAge: age,
      method: requirement.requiredMethod,
      jurisdictionCode: params.jurisdictionCode,
      verifiedAt: new Date(),
      reverificationAt: requirement.reverificationDays
        ? new Date(Date.now() + requirement.reverificationDays * 86400000)
        : undefined,
    };
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age;
  }
}
```

### 3. Geo-Blocking Enforcement

Real-time geographic restriction enforcement using IP geolocation and GPS verification. Critical for BetEdge where users must be physically present in a licensed jurisdiction.

```typescript
import { GeoBlockingService } from '@mcv/compliance/jurisdictions';
import type { GeoBlockResult } from '@mcv/compliance/jurisdictions';

class GeoBlockingMiddleware {
  constructor(
    private readonly geoService: GeoBlockingService,
    private readonly maxMind: MaxMindClient,   // GeoIP2 provider
    private readonly cache: CacheService,
  ) {}

  async enforceGeoBlock(
    ctx: TRPCContext,
    params: {
      ventureId: string;
      ipAddress: string;
      gpsCoordinates?: { latitude: number; longitude: number };
    },
  ): Promise<GeoBlockResult> {
    // 1. Resolve IP to location
    const ipLocation = await this.resolveIPLocation(params.ipAddress);

    // 2. Check for VPN/proxy (critical for gambling compliance)
    const vpnCheck = await this.maxMind.checkAnonymizer(params.ipAddress);
    const vpnDetected = vpnCheck.isAnonymousVpn || vpnCheck.isPublicProxy;
    const proxyDetected = vpnCheck.isResidentialProxy || vpnCheck.isTorExitNode;

    // 3. If VPN detected and venture requires strict geo-fencing, deny immediately
    if ((vpnDetected || proxyDetected) && ctx.venture.requireStrictGeo) {
      await ctx.services.audit.log({
        event: 'jurisdiction.vpn_blocked',
        userId: ctx.user?.id,
        ventureId: params.ventureId,
        ipAddress: params.ipAddress,
        vpnDetected,
        proxyDetected,
        anonymizerDetails: vpnCheck,
      });

      return {
        allowed: false,
        jurisdictionCode: ipLocation?.jurisdictionCode ?? 'UNKNOWN',
        matchedRule: 'vpn_proxy_block',
        enforcement: 'strict',
        confidence: 0,
        ipLocation: ipLocation ? {
          latitude: ipLocation.latitude,
          longitude: ipLocation.longitude,
          accuracy: ipLocation.accuracy,
          source: 'ip',
          provider: 'maxmind',
        } : null,
        gpsLocation: null,
        vpnDetected,
        proxyDetected,
        locationMismatch: false,
        checkedAt: new Date(),
      };
    }

    // 4. Get applicable geo rules for this venture
    const rules = await this.geoService.getActiveRules(ctx, {
      ventureId: params.ventureId,
      jurisdictionCode: ipLocation?.jurisdictionCode,
    });

    // Sort by priority (highest first)
    rules.sort((a, b) => b.priority - a.priority);

    // 5. Evaluate rules against user's location
    for (const rule of rules) {
      const match = await this.evaluateRule(rule, {
        ipLocation,
        gpsCoordinates: params.gpsCoordinates,
      });

      if (match.matched) {
        // 6. Check if GPS verification is required
        if (
          (rule.enforcement === 'ip_and_gps' || rule.enforcement === 'strict') &&
          !params.gpsCoordinates
        ) {
          return {
            allowed: false,
            jurisdictionCode: ipLocation?.jurisdictionCode ?? 'UNKNOWN',
            matchedRule: rule.id,
            enforcement: rule.enforcement,
            confidence: match.confidence * 0.5,  // Halved without GPS
            ipLocation: ipLocation ? {
              latitude: ipLocation.latitude,
              longitude: ipLocation.longitude,
              accuracy: ipLocation.accuracy,
              source: 'ip',
              provider: 'maxmind',
            } : null,
            gpsLocation: null,
            vpnDetected,
            proxyDetected,
            locationMismatch: false,
            checkedAt: new Date(),
          };
        }

        // 7. If both IP and GPS are present, check for mismatch
        let locationMismatch = false;
        if (ipLocation && params.gpsCoordinates) {
          const distanceKm = this.haversineDistance(
            ipLocation.latitude,
            ipLocation.longitude,
            params.gpsCoordinates.latitude,
            params.gpsCoordinates.longitude,
          );

          // Flag if IP and GPS are more than 100km apart
          locationMismatch = distanceKm > 100;

          if (locationMismatch && rule.enforcement === 'strict') {
            await ctx.services.audit.log({
              event: 'jurisdiction.location_mismatch',
              userId: ctx.user?.id,
              ventureId: params.ventureId,
              distanceKm,
              ipLocation,
              gpsLocation: params.gpsCoordinates,
            });

            return {
              allowed: false,
              jurisdictionCode: ipLocation.jurisdictionCode,
              matchedRule: rule.id,
              enforcement: rule.enforcement,
              confidence: 0,
              ipLocation: {
                latitude: ipLocation.latitude,
                longitude: ipLocation.longitude,
                accuracy: ipLocation.accuracy,
                source: 'ip',
                provider: 'maxmind',
              },
              gpsLocation: {
                latitude: params.gpsCoordinates.latitude,
                longitude: params.gpsCoordinates.longitude,
                accuracy: 'high',
                source: 'gps',
                provider: 'client',
              },
              vpnDetected,
              proxyDetected,
              locationMismatch: true,
              checkedAt: new Date(),
            };
          }
        }

        // Return the rule result
        return {
          allowed: rule.action === 'allow',
          jurisdictionCode: ipLocation?.jurisdictionCode ?? 'UNKNOWN',
          matchedRule: rule.id,
          enforcement: rule.enforcement,
          confidence: match.confidence,
          ipLocation: ipLocation ? {
            latitude: ipLocation.latitude,
            longitude: ipLocation.longitude,
            accuracy: ipLocation.accuracy,
            source: 'ip',
            provider: 'maxmind',
          } : null,
          gpsLocation: params.gpsCoordinates ? {
            latitude: params.gpsCoordinates.latitude,
            longitude: params.gpsCoordinates.longitude,
            accuracy: 'high',
            source: 'gps',
            provider: 'client',
          } : null,
          vpnDetected,
          proxyDetected,
          locationMismatch,
          checkedAt: new Date(),
        };
      }
    }

    // 8. No matching rule — default deny (fail-safe)
    return {
      allowed: false,
      jurisdictionCode: ipLocation?.jurisdictionCode ?? 'UNKNOWN',
      matchedRule: null,
      enforcement: 'ip_only',
      confidence: 0,
      ipLocation: null,
      gpsLocation: null,
      vpnDetected,
      proxyDetected,
      locationMismatch: false,
      checkedAt: new Date(),
    };
  }

  private haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
```

### 4. License Renewal Workflow

Automated license renewal tracking with escalation. Monitors approaching expiry dates and triggers renewal workflows.

```typescript
import { LicenseService, ComplianceCalendarService } from '@mcv/compliance/jurisdictions';
import type { License, ComplianceDeadline } from '@mcv/compliance/jurisdictions';

class LicenseRenewalWorkflow {
  constructor(
    private readonly licenseService: LicenseService,
    private readonly calendarService: ComplianceCalendarService,
    private readonly notificationService: NotificationService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Scheduled job — runs daily to check for licenses approaching expiry.
   * Creates renewal deadlines, sends notifications, and escalates overdue items.
   */
  async processLicenseRenewals(ctx: TRPCContext): Promise<void> {
    // 1. Get all active licenses expiring within 180 days
    const expiringLicenses = await this.licenseService.getExpiring(ctx, {
      withinDays: 180,
      statuses: ['active', 'pending_renewal'],
    });

    for (const license of expiringLicenses) {
      const daysUntilExpiry = Math.ceil(
        (license.expiresAt!.getTime() - Date.now()) / 86400000
      );

      // 2. Determine urgency and action
      if (daysUntilExpiry <= 0) {
        // EXPIRED — critical action required
        await this.handleExpiredLicense(ctx, license);
      } else if (daysUntilExpiry <= 30) {
        // CRITICAL — renewal must be filed immediately
        await this.escalateRenewal(ctx, license, 'critical', daysUntilExpiry);
      } else if (daysUntilExpiry <= 90) {
        // HIGH — renewal should be in progress
        await this.escalateRenewal(ctx, license, 'high', daysUntilExpiry);
      } else if (daysUntilExpiry <= 180) {
        // MEDIUM — begin renewal planning
        await this.initiateRenewal(ctx, license, daysUntilExpiry);
      }
    }

    // 3. Check for auto-renewal licenses
    const autoRenewals = expiringLicenses.filter(l => l.autoRenewal && !l.renewalDeadline);
    for (const license of autoRenewals) {
      await this.processAutoRenewal(ctx, license);
    }
  }

  private async handleExpiredLicense(ctx: TRPCContext, license: License): Promise<void> {
    // Update license status
    await this.licenseService.updateStatus(ctx, license.id, 'expired');

    // CRITICAL: Disable operations in this jurisdiction for this venture
    await ctx.services.jurisdiction.suspendVentureInJurisdiction(ctx, {
      ventureId: license.ventureId,
      jurisdictionCode: license.jurisdictionCode,
      reason: `License ${license.licenseNumber} expired on ${license.expiresAt!.toISOString()}`,
      autoResumeOnRenewal: true,
    });

    // Notify executive team
    await this.notificationService.send({
      channel: 'compliance_critical',
      priority: 'urgent',
      title: `🚨 License Expired: ${license.licenseNumber}`,
      body: `License for venture ${license.ventureId} in ${license.jurisdictionCode} has expired. ` +
            `Operations have been automatically suspended. Immediate action required.`,
      recipients: ['compliance_team', 'executive_team'],
      tags: ['license', 'expired', 'critical'],
    });

    await this.audit.log({
      event: 'license.expired',
      licenseId: license.id,
      ventureId: license.ventureId,
      jurisdictionCode: license.jurisdictionCode,
      licenseNumber: license.licenseNumber,
      severity: 'critical',
    });
  }

  private async initiateRenewal(
    ctx: TRPCContext,
    license: License,
    daysUntilExpiry: number,
  ): Promise<void> {
    // Check if a renewal deadline already exists
    const existingDeadline = await this.calendarService.findDeadline(ctx, {
      licenseId: license.id,
      type: 'license_renewal',
      status: ['upcoming', 'in_progress'],
    });

    if (existingDeadline) return; // Already tracked

    // Create a compliance calendar entry for the renewal
    const renewalDeadline = license.renewalDeadline ?? license.expiresAt!;

    await this.calendarService.createDeadline(ctx, {
      ventureId: license.ventureId,
      jurisdictionCode: license.jurisdictionCode,
      licenseId: license.id,
      type: 'license_renewal',
      title: `Renew ${license.type} license #${license.licenseNumber}`,
      description:
        `License ${license.licenseNumber} (${license.type}) issued by ${license.issuingAuthority} ` +
        `for jurisdiction ${license.jurisdictionCode} expires on ${license.expiresAt!.toISOString()}. ` +
        `Renewal application must be filed by ${renewalDeadline.toISOString()}.`,
      deadline: renewalDeadline,
      authority: license.issuingAuthority,
      assignedTeam: 'compliance',
      reminderDays: [90, 60, 30, 14, 7, 3, 1],
      penaltyDescription: 'Operations must cease if license expires without renewal.',
    });

    // Update license status
    await this.licenseService.updateStatus(ctx, license.id, 'pending_renewal');

    await this.notificationService.send({
      channel: 'compliance_ops',
      priority: 'normal',
      title: `License Renewal Initiated: ${license.licenseNumber}`,
      body: `License expires in ${daysUntilExpiry} days. Renewal deadline created.`,
      recipients: ['compliance_team'],
    });
  }

  private async escalateRenewal(
    ctx: TRPCContext,
    license: License,
    severity: 'critical' | 'high',
    daysUntilExpiry: number,
  ): Promise<void> {
    const recipients = severity === 'critical'
      ? ['compliance_team', 'legal_team', 'executive_team']
      : ['compliance_team', 'legal_team'];

    await this.notificationService.send({
      channel: severity === 'critical' ? 'compliance_critical' : 'compliance_ops',
      priority: severity === 'critical' ? 'urgent' : 'high',
      title: `⚠️ License Renewal ${severity.toUpperCase()}: ${license.licenseNumber}`,
      body:
        `License for ${license.ventureId} in ${license.jurisdictionCode} expires in ` +
        `${daysUntilExpiry} days (${license.expiresAt!.toLocaleDateString()}). ` +
        `Authority: ${license.issuingAuthority}. Status: ${license.status}.`,
      recipients,
      tags: ['license', 'renewal', severity],
    });
  }

  private async processAutoRenewal(ctx: TRPCContext, license: License): Promise<void> {
    // Queue auto-renewal API call to licensing authority (if supported)
    await this.audit.log({
      event: 'license.auto_renewal_queued',
      licenseId: license.id,
      ventureId: license.ventureId,
      jurisdictionCode: license.jurisdictionCode,
    });
  }
}
```

### 5. Compliance Calendar Management

Querying, creating, and managing compliance deadlines across all ventures and jurisdictions.

```typescript
import { ComplianceCalendarService } from '@mcv/compliance/jurisdictions';
import type { ComplianceDeadline } from '@mcv/compliance/jurisdictions';

class ComplianceDashboard {
  constructor(
    private readonly calendarService: ComplianceCalendarService,
  ) {}

  /**
   * Get a unified view of all upcoming deadlines for the compliance team.
   * Groups by severity and provides actionable summaries.
   */
  async getDashboardData(
    ctx: TRPCContext,
    params?: {
      ventureId?: string;
      jurisdictionCode?: string;
      withinDays?: number;
    },
  ): Promise<ComplianceDashboardData> {
    const withinDays = params?.withinDays ?? 90;

    // 1. Get all upcoming deadlines
    const deadlines = await this.calendarService.getUpcoming(ctx, {
      ventureId: params?.ventureId,
      jurisdictionCode: params?.jurisdictionCode,
      withinDays,
      includeOverdue: true,
    });

    // 2. Get overdue items (critical attention)
    const overdue = deadlines.filter(d => d.status === 'overdue');
    const dueThisWeek = deadlines.filter(d =>
      d.status !== 'overdue' && d.daysUntil <= 7
    );
    const dueThisMonth = deadlines.filter(d =>
      d.status !== 'overdue' && d.daysUntil > 7 && d.daysUntil <= 30
    );
    const upcoming = deadlines.filter(d =>
      d.status !== 'overdue' && d.daysUntil > 30
    );

    // 3. Group by venture for per-venture views
    const byVenture = this.groupByVenture(deadlines);

    // 4. Group by jurisdiction for regulatory views
    const byJurisdiction = this.groupByJurisdiction(deadlines);

    // 5. Generate summary statistics
    const stats = {
      totalDeadlines: deadlines.length,
      overdueCount: overdue.length,
      criticalCount: deadlines.filter(d => d.severity === 'critical').length,
      highCount: deadlines.filter(d => d.severity === 'high').length,
      completedThisMonth: await this.calendarService.countCompleted(ctx, {
        withinDays: 30,
      }),
      complianceScore: this.calculateComplianceScore(deadlines),
    };

    return {
      stats,
      overdue,
      dueThisWeek,
      dueThisMonth,
      upcoming,
      byVenture,
      byJurisdiction,
    };
  }

  /**
   * Create a recurring compliance deadline for a specific regulation.
   */
  async createRecurringDeadline(
    ctx: TRPCContext,
    params: {
      ventureId: string;
      jurisdictionCode: string;
      type: DeadlineType;
      title: string;
      description: string;
      firstDeadline: Date;
      recurrence: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
      authority: string;
      regulationRef?: string;
      assignedTeam: string;
      reminderDays?: number[];
      penaltyDescription?: string;
      penaltyAmount?: number;
      penaltyCurrency?: string;
    },
  ): Promise<ComplianceDeadline> {
    // Create the initial deadline
    const deadline = await this.calendarService.createDeadline(ctx, {
      ventureId: params.ventureId,
      jurisdictionCode: params.jurisdictionCode,
      type: params.type,
      title: params.title,
      description: params.description,
      deadline: params.firstDeadline,
      recurrence: params.recurrence,
      authority: params.authority,
      regulationRef: params.regulationRef,
      assignedTeam: params.assignedTeam,
      reminderDays: params.reminderDays ?? [30, 14, 7, 3, 1],
      penaltyDescription: params.penaltyDescription,
      penaltyAmount: params.penaltyAmount,
      penaltyCurrency: params.penaltyCurrency,
    });

    // Pre-generate the next occurrence for visibility
    if (params.recurrence !== 'once') {
      const nextDate = this.calculateNextOccurrence(
        params.firstDeadline,
        params.recurrence,
      );

      await this.calendarService.createDeadline(ctx, {
        ...params,
        deadline: nextDate,
        title: `${params.title} (next occurrence)`,
      });
    }

    return deadline;
  }

  /**
   * Mark a deadline as completed with filing reference.
   */
  async completeDeadline(
    ctx: TRPCContext,
    params: {
      deadlineId: string;
      filingReference: string;
      documentIds: string[];
      notes?: string;
    },
  ): Promise<void> {
    await this.calendarService.complete(ctx, {
      id: params.deadlineId,
      filingReference: params.filingReference,
      submissionDocumentIds: params.documentIds,
      completedAt: new Date(),
    });

    // If recurring, ensure the next occurrence exists
    const deadline = await this.calendarService.getById(ctx, params.deadlineId);
    if (deadline && deadline.recurrence !== 'once') {
      const nextDate = this.calculateNextOccurrence(
        deadline.deadline,
        deadline.recurrence,
      );

      const existingNext = await this.calendarService.findDeadline(ctx, {
        ventureId: deadline.ventureId,
        jurisdictionCode: deadline.jurisdictionCode,
        type: deadline.type,
        deadlineAfter: deadline.deadline,
      });

      if (!existingNext) {
        await this.calendarService.createDeadline(ctx, {
          ventureId: deadline.ventureId,
          jurisdictionCode: deadline.jurisdictionCode,
          licenseId: deadline.licenseId,
          type: deadline.type,
          title: deadline.title,
          description: deadline.description,
          deadline: nextDate,
          recurrence: deadline.recurrence,
          authority: deadline.authority,
          regulationRef: deadline.regulationRef,
          assignedTeam: deadline.assignedTeam,
          reminderDays: deadline.reminderDays,
          penaltyDescription: deadline.penaltyDescription,
          penaltyAmount: deadline.penaltyAmount,
          penaltyCurrency: deadline.penaltyCurrency,
        });
      }
    }

    await ctx.services.audit.log({
      event: 'compliance.deadline_completed',
      deadlineId: params.deadlineId,
      filingReference: params.filingReference,
      documentCount: params.documentIds.length,
    });
  }

  private calculateNextOccurrence(current: Date, recurrence: string): Date {
    const next = new Date(current);
    switch (recurrence) {
      case 'monthly':     next.setMonth(next.getMonth() + 1); break;
      case 'quarterly':   next.setMonth(next.getMonth() + 3); break;
      case 'semi_annual': next.setMonth(next.getMonth() + 6); break;
      case 'annual':      next.setFullYear(next.getFullYear() + 1); break;
    }
    return next;
  }

  private calculateComplianceScore(deadlines: ComplianceDeadline[]): number {
    if (deadlines.length === 0) return 1.0;
    const overdue = deadlines.filter(d => d.status === 'overdue').length;
    return Math.max(0, 1 - (overdue / deadlines.length));
  }

  private groupByVenture(
    deadlines: ComplianceDeadline[],
  ): Record<string, ComplianceDeadline[]> {
    return deadlines.reduce((acc, d) => {
      (acc[d.ventureId] ??= []).push(d);
      return acc;
    }, {} as Record<string, ComplianceDeadline[]>);
  }

  private groupByJurisdiction(
    deadlines: ComplianceDeadline[],
  ): Record<string, ComplianceDeadline[]> {
    return deadlines.reduce((acc, d) => {
      (acc[d.jurisdictionCode] ??= []).push(d);
      return acc;
    }, {} as Record<string, ComplianceDeadline[]>);
  }
}

interface ComplianceDashboardData {
  stats: {
    totalDeadlines: number;
    overdueCount: number;
    criticalCount: number;
    highCount: number;
    completedThisMonth: number;
    complianceScore: number;
  };
  overdue: ComplianceDeadline[];
  dueThisWeek: ComplianceDeadline[];
  dueThisMonth: ComplianceDeadline[];
  upcoming: ComplianceDeadline[];
  byVenture: Record<string, ComplianceDeadline[]>;
  byJurisdiction: Record<string, ComplianceDeadline[]>;
}
```

### 6. Data Residency Enforcement

Ensuring user data is stored and processed in compliant regions based on jurisdiction requirements.

```typescript
import { DataResidencyService } from '@mcv/compliance/jurisdictions';
import type { DataResidencyRule, DataClassification } from '@mcv/compliance/jurisdictions';

class DataRoutingMiddleware {
  constructor(
    private readonly residencyService: DataResidencyService,
  ) {}

  /**
   * Determine the correct storage region for data based on the user's jurisdiction
   * and the data classification. Called before any data write operation.
   */
  async resolveStorageRegion(
    ctx: TRPCContext,
    params: {
      jurisdictionCode: string;
      dataClassification: DataClassification;
      dataCategories: string[];
    },
  ): Promise<DataStorageDecision> {
    // 1. Get applicable residency rules
    const rules = await this.residencyService.getRules(ctx, {
      jurisdictionCode: params.jurisdictionCode,
      dataClassification: params.dataClassification,
    });

    if (rules.length === 0) {
      // No specific rules — use organization default
      return {
        region: ctx.org.defaultDataRegion,
        encryptionRequired: true,
        encryptionStandard: 'AES-256',
        crossBorderAllowed: true,
        legalBasis: 'legitimate_interest',
        retentionDays: null,
        rules: [],
      };
    }

    // 2. Find the most restrictive applicable rule
    const mostRestrictive = this.findMostRestrictive(rules);

    // 3. Validate that our preferred region is allowed
    const preferredRegion = mostRestrictive.preferredRegion;
    const isAllowed = mostRestrictive.allowedRegions.includes(preferredRegion);

    if (!isAllowed) {
      // Fallback to first allowed region
      const fallbackRegion = mostRestrictive.allowedRegions[0];
      if (!fallbackRegion) {
        throw new JurisdictionError(
          'JURISDICTION_NO_COMPLIANT_REGION',
          `No compliant storage region available for ${params.dataClassification} data ` +
          `in jurisdiction ${params.jurisdictionCode}`,
        );
      }

      return {
        region: fallbackRegion,
        encryptionRequired: mostRestrictive.encryptionRequired,
        encryptionStandard: mostRestrictive.encryptionStandard ?? 'AES-256',
        crossBorderAllowed: mostRestrictive.crossBorderTransferAllowed,
        transferMechanisms: mostRestrictive.transferMechanisms,
        legalBasis: mostRestrictive.legalFramework,
        retentionDays: mostRestrictive.retentionPeriodDays,
        rules: rules.map(r => r.id),
      };
    }

    return {
      region: preferredRegion,
      encryptionRequired: mostRestrictive.encryptionRequired,
      encryptionStandard: mostRestrictive.encryptionStandard ?? 'AES-256',
      crossBorderAllowed: mostRestrictive.crossBorderTransferAllowed,
      transferMechanisms: mostRestrictive.transferMechanisms,
      legalBasis: mostRestrictive.legalFramework,
      retentionDays: mostRestrictive.retentionPeriodDays,
      rules: rules.map(r => r.id),
    };
  }

  /**
   * Validate that a cross-border data transfer is permitted.
   * Required before replicating data between regions.
   */
  async validateTransfer(
    ctx: TRPCContext,
    params: {
      fromRegion: string;
      toRegion: string;
      jurisdictionCode: string;
      dataClassification: DataClassification;
    },
  ): Promise<{ allowed: boolean; mechanism?: string; reason?: string }> {
    const rules = await this.residencyService.getRules(ctx, {
      jurisdictionCode: params.jurisdictionCode,
      dataClassification: params.dataClassification,
    });

    for (const rule of rules) {
      // Check if target region is prohibited
      if (rule.prohibitedRegions.includes(params.toRegion)) {
        return {
          allowed: false,
          reason: `Transfer to ${params.toRegion} is prohibited under ${rule.legalFramework}`,
        };
      }

      // Check if cross-border transfer is allowed at all
      if (!rule.crossBorderTransferAllowed && params.fromRegion !== params.toRegion) {
        return {
          allowed: false,
          reason: `Cross-border transfer not permitted under ${rule.legalFramework}`,
        };
      }

      // Check if transfer mechanism is available
      if (rule.transferMechanisms.length > 0) {
        return {
          allowed: true,
          mechanism: rule.transferMechanisms[0],
        };
      }
    }

    return { allowed: true };
  }

  private findMostRestrictive(rules: DataResidencyRule[]): DataResidencyRule {
    // Sort: most restrictive first (fewest allowed regions, no cross-border, shortest retention)
    return rules.sort((a, b) => {
      // Prefer rules that don't allow cross-border
      if (a.crossBorderTransferAllowed !== b.crossBorderTransferAllowed) {
        return a.crossBorderTransferAllowed ? 1 : -1;
      }
      // Prefer fewer allowed regions (more restrictive)
      if (a.allowedRegions.length !== b.allowedRegions.length) {
        return a.allowedRegions.length - b.allowedRegions.length;
      }
      // Prefer shorter retention (more restrictive)
      const aRet = a.retentionPeriodDays ?? Infinity;
      const bRet = b.retentionPeriodDays ?? Infinity;
      return aRet - bRet;
    })[0];
  }
}

interface DataStorageDecision {
  region: string;
  encryptionRequired: boolean;
  encryptionStandard: string;
  crossBorderAllowed: boolean;
  transferMechanisms?: string[];
  legalBasis: string;
  retentionDays: number | null;
  rules: string[];
}
```

### 7. Content Restriction Enforcement

Filtering and modifying content based on jurisdiction-specific advertising and content rules.

```typescript
import { ContentRestrictionService } from '@mcv/compliance/jurisdictions';
import type { ContentRestriction } from '@mcv/compliance/jurisdictions';

class ContentComplianceFilter {
  constructor(
    private readonly contentService: ContentRestrictionService,
  ) {}

  /**
   * Apply jurisdiction-specific content restrictions to promotional content
   * before serving it to the user.
   */
  async filterContent(
    ctx: TRPCContext,
    params: {
      jurisdictionCode: string;
      ventureId: string;
      content: ContentPayload;
    },
  ): Promise<FilteredContentResult> {
    // 1. Get all active restrictions for this jurisdiction + venture
    const restrictions = await this.contentService.getRestrictions(ctx, {
      jurisdictionCode: params.jurisdictionCode,
      ventureId: params.ventureId,
      categories: params.content.categories,
    });

    if (restrictions.length === 0) {
      return {
        content: params.content,
        modified: false,
        restrictionsApplied: [],
      };
    }

    let modifiedContent = { ...params.content };
    const appliedRestrictions: AppliedRestriction[] = [];

    for (const restriction of restrictions) {
      // 2. Check time-based restrictions
      if (restriction.timeRestrictions?.length) {
        const now = new Date();
        const isRestricted = this.isTimeRestricted(now, restriction.timeRestrictions);

        if (isRestricted && restriction.action === 'block') {
          return {
            content: null,
            modified: true,
            blocked: true,
            restrictionsApplied: [{
              restrictionId: restriction.id,
              category: restriction.category,
              action: 'blocked',
              reason: `Content blocked during restricted hours in ${params.jurisdictionCode}`,
            }],
          };
        }
      }

      // 3. Apply the restriction action
      switch (restriction.action) {
        case 'block':
          return {
            content: null,
            modified: true,
            blocked: true,
            restrictionsApplied: [{
              restrictionId: restriction.id,
              category: restriction.category,
              action: 'blocked',
              reason: restriction.description,
            }],
          };

        case 'disclaimer':
          // Add required disclaimer to content
          if (restriction.requiredDisclaimer) {
            modifiedContent.disclaimers = [
              ...(modifiedContent.disclaimers ?? []),
              {
                text: restriction.requiredDisclaimer,
                source: restriction.regulationRef ?? restriction.id,
                mandatory: true,
              },
            ];
            appliedRestrictions.push({
              restrictionId: restriction.id,
              category: restriction.category,
              action: 'disclaimer_added',
              reason: restriction.description,
            });
          }
          break;

        case 'modify':
          // Remove restricted elements from content
          modifiedContent = this.removeRestrictedElements(
            modifiedContent,
            restriction,
          );
          appliedRestrictions.push({
            restrictionId: restriction.id,
            category: restriction.category,
            action: 'content_modified',
            reason: restriction.description,
          });
          break;

        case 'age_gate':
          // Flag content as requiring age verification before display
          modifiedContent.requiresAgeGate = true;
          modifiedContent.ageGateMinAge = restriction.minimumAge ?? 18;
          appliedRestrictions.push({
            restrictionId: restriction.id,
            category: restriction.category,
            action: 'age_gate_required',
            reason: restriction.description,
          });
          break;
      }
    }

    return {
      content: modifiedContent,
      modified: appliedRestrictions.length > 0,
      restrictionsApplied: appliedRestrictions,
    };
  }

  private isTimeRestricted(now: Date, timeRestrictions: TimeRestriction[]): boolean {
    for (const tr of timeRestrictions) {
      // Convert to the restriction's timezone
      const localHour = parseInt(
        now.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: tr.timezone })
      );
      const localDay = parseInt(
        now.toLocaleString('en-US', { weekday: 'narrow', timeZone: tr.timezone })
      );

      // Check day of week (if specified)
      if (tr.dayOfWeek && !tr.dayOfWeek.includes(localDay)) continue;

      // Check hour range
      if (tr.startHour <= tr.endHour) {
        // Same-day range (e.g., 6-21)
        if (localHour >= tr.startHour && localHour < tr.endHour) return true;
      } else {
        // Overnight range (e.g., 21-6)
        if (localHour >= tr.startHour || localHour < tr.endHour) return true;
      }
    }
    return false;
  }

  private removeRestrictedElements(
    content: ContentPayload,
    restriction: ContentRestriction,
  ): ContentPayload {
    const modified = { ...content };

    // Remove bonus offer displays if restricted
    if (restriction.category === 'bonus_offers') {
      delete modified.bonusOffers;
      delete modified.promotionalBanners;
    }

    // Remove odds displays if restricted
    if (restriction.category === 'odds_display') {
      delete modified.liveOdds;
      delete modified.oddsComparison;
    }

    // Remove testimonials if restricted
    if (restriction.category === 'testimonials') {
      delete modified.userTestimonials;
      delete modified.winnerStories;
    }

    return modified;
  }
}

interface ContentPayload {
  categories: string[];
  body: string;
  disclaimers?: { text: string; source: string; mandatory: boolean }[];
  bonusOffers?: any[];
  promotionalBanners?: any[];
  liveOdds?: any;
  oddsComparison?: any;
  userTestimonials?: any[];
  winnerStories?: any[];
  requiresAgeGate?: boolean;
  ageGateMinAge?: number;
}

interface FilteredContentResult {
  content: ContentPayload | null;
  modified: boolean;
  blocked?: boolean;
  restrictionsApplied: AppliedRestriction[];
}

interface AppliedRestriction {
  restrictionId: string;
  category: string;
  action: string;
  reason: string;
}
```

### 8. Tax Jurisdiction Resolution

Determining tax nexus and withholding requirements for transactions in specific jurisdictions.

```typescript
import { TaxJurisdictionService } from '@mcv/compliance/jurisdictions';

class TaxWithholdingResolver {
  constructor(
    private readonly taxService: TaxJurisdictionService,
  ) {}

  /**
   * Determine tax obligations for a transaction in a given jurisdiction.
   * Used by payment processing to calculate withholding amounts.
   */
  async resolveWithholding(
    ctx: TRPCContext,
    params: {
      ventureId: string;
      jurisdictionCode: string;
      transactionType: string;  // 'gambling_winnings', 'payment', 'subscription'
      amount: number;
      currency: string;
    },
  ): Promise<WithholdingDecision> {
    // 1. Check if nexus is established
    const nexus = await this.taxService.checkNexus(ctx, {
      ventureId: params.ventureId,
      jurisdictionCode: params.jurisdictionCode,
    });

    if (!nexus || !nexus.nexusEstablished) {
      return {
        withholdingRequired: false,
        amount: params.amount,
        withholdingAmount: 0,
        netAmount: params.amount,
        taxRate: 0,
        nexusEstablished: false,
        jurisdictionCode: params.jurisdictionCode,
      };
    }

    // 2. Get withholding rules for this transaction type
    const rules = await this.taxService.getWithholdingRules(ctx, {
      jurisdictionCode: params.jurisdictionCode,
      ventureId: params.ventureId,
      category: params.transactionType,
    });

    if (!rules || !rules.withholdingRequired) {
      return {
        withholdingRequired: false,
        amount: params.amount,
        withholdingAmount: 0,
        netAmount: params.amount,
        taxRate: 0,
        nexusEstablished: true,
        jurisdictionCode: params.jurisdictionCode,
      };
    }

    // 3. Calculate withholding amount
    let withholdingRate = Number(rules.withholdingRate);

    // Check for treaty benefits
    if (rules.treatyBenefitsApplicable && rules.reducedRate) {
      withholdingRate = Number(rules.reducedRate);
    }

    // Apply category-specific rates if defined
    const categoryRule = rules.withholdingCategories?.find(
      wc => wc.category === params.transactionType,
    );
    if (categoryRule) {
      withholdingRate = categoryRule.rate;

      // Check threshold (some jurisdictions only withhold above a certain amount)
      if (categoryRule.threshold && params.amount < categoryRule.threshold) {
        return {
          withholdingRequired: false,
          amount: params.amount,
          withholdingAmount: 0,
          netAmount: params.amount,
          taxRate: withholdingRate,
          belowThreshold: true,
          threshold: categoryRule.threshold,
          nexusEstablished: true,
          jurisdictionCode: params.jurisdictionCode,
        };
      }
    }

    const withholdingAmount = Math.round(params.amount * withholdingRate * 100) / 100;
    const netAmount = params.amount - withholdingAmount;

    return {
      withholdingRequired: true,
      amount: params.amount,
      withholdingAmount,
      netAmount,
      taxRate: withholdingRate,
      nexusEstablished: true,
      jurisdictionCode: params.jurisdictionCode,
      reportingRequired: categoryRule?.reportingRequired ?? rules.filingRequired,
      filingFrequency: rules.filingFrequency,
      filingAuthority: rules.filingAuthority,
    };
  }
}

interface WithholdingDecision {
  withholdingRequired: boolean;
  amount: number;
  withholdingAmount: number;
  netAmount: number;
  taxRate: number;
  nexusEstablished: boolean;
  jurisdictionCode: string;
  belowThreshold?: boolean;
  threshold?: number;
  reportingRequired?: boolean;
  filingFrequency?: string;
  filingAuthority?: string;
}
```

---

## Error Codes

All errors thrown by the jurisdictions module extend `JurisdictionError` and include a machine-readable code, human-readable message, and optional metadata.

```typescript
class JurisdictionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'JurisdictionError';
  }
}
```

| Code | HTTP | Description |
|------|------|-------------|
| `JURISDICTION_NOT_FOUND` | 404 | The requested jurisdiction code does not exist in the registry. Verify the ISO 3166-1/2 code is correct and registered. |
| `JURISDICTION_GEO_BLOCKED` | 403 | User's location is within a geo-blocked region for the requested venture. The user cannot access services from this location. |
| `JURISDICTION_NO_LICENSE` | 403 | The venture does not hold a valid, active license in the resolved jurisdiction. Operations are prohibited. |
| `JURISDICTION_LICENSE_EXPIRED` | 403 | The venture's license in this jurisdiction has expired. Operations are suspended until renewal is completed. |
| `JURISDICTION_LICENSE_SUSPENDED` | 403 | The venture's license has been suspended by the regulatory authority. Contact compliance team. |
| `JURISDICTION_AGE_REQUIRED` | 403 | The user has not met the jurisdiction's age verification requirement. Additional verification is needed. |
| `JURISDICTION_AGE_UNDERAGE` | 403 | The user is below the minimum age requirement for this jurisdiction and activity type. Access is permanently denied for this activity until eligible. |
| `JURISDICTION_PERMIT_DENIED` | 403 | The venture does not have the required operating permit, or the permit has conditions that prevent this operation. |
| `JURISDICTION_VPN_DETECTED` | 403 | A VPN, proxy, or anonymizer was detected and the venture requires strict geolocation verification. |
| `JURISDICTION_LOCATION_MISMATCH` | 403 | IP geolocation and GPS coordinates disagree beyond acceptable threshold. May indicate location spoofing. |
| `JURISDICTION_SANCTIONS_BLOCKED` | 403 | The resolved jurisdiction is under sanctions restrictions. All operations are prohibited. |
| `JURISDICTION_NO_COMPLIANT_REGION` | 500 | No compliant data storage region is available for the data classification in this jurisdiction. Configuration error. |
| `JURISDICTION_DATA_TRANSFER_DENIED` | 403 | Cross-border data transfer to the requested region is not permitted under the jurisdiction's data protection laws. |
| `JURISDICTION_CONTENT_BLOCKED` | 403 | Content is blocked in this jurisdiction due to advertising or content restrictions. |
| `JURISDICTION_CONTENT_TIME_RESTRICTED` | 403 | Content is restricted during the current time period in this jurisdiction (e.g., gambling ads during daytime). |
| `JURISDICTION_TAX_NEXUS_ERROR` | 500 | Error determining tax nexus or calculating withholding for this jurisdiction. |
| `JURISDICTION_RESOLUTION_FAILED` | 500 | Unable to resolve the user's jurisdiction from available location signals (IP, GPS). |
| `JURISDICTION_CONFIG_INVALID` | 500 | Jurisdiction configuration is invalid or incomplete. Check database entries. |
| `JURISDICTION_RATE_LIMITED` | 429 | Too many jurisdiction check requests. Implement client-side caching of jurisdiction results. |

---

## Security

### Access Control

- **RLS Enforcement**: All jurisdiction tables are scoped by `org_id` with Supabase Row-Level Security. Organizations can only see and manage jurisdictions, licenses, and rules within their own tenant.
- **Role-Based Access**: Jurisdiction registry modifications require `compliance_admin` or `org_admin` roles. Read access is available to all authenticated users within the organization.
- **License Management**: Creating, updating, or deleting licenses requires `compliance_admin` role with multi-factor authentication confirmed.
- **Geo-Rule Management**: Modifying geo-blocking rules requires `compliance_admin` role. Changes trigger an immediate audit log entry and notification to the compliance channel.

### Data Protection

- **PII Minimization**: Jurisdiction checks use IP addresses and GPS coordinates but do not store these permanently. Only the resolved jurisdiction code is persisted on session/transaction records.
- **Audit Trail**: Every jurisdiction access check, denial, and override is logged to the compliance audit trail via `@mcv/observability`. Logs include the jurisdiction code, user ID, venture ID, check result, and all denial reasons.
- **Encryption at Rest**: All jurisdiction configuration data is encrypted at rest in Supabase. License documents are stored via `@mcv/documents` with AES-256 encryption.
- **GPS Data**: Client-provided GPS coordinates are used only for real-time verification and are not stored beyond the audit log entry. GPS data is transmitted over TLS and processed in-memory.

### Geo-Blocking Security

- **VPN/Proxy Detection**: All geo-blocked ventures integrate MaxMind's Anonymous IP database to detect VPNs, public proxies, Tor exit nodes, and residential proxies. Detection triggers immediate denial and audit logging.
- **GPS Spoofing Mitigation**: For ventures requiring GPS verification (e.g., BetEdge), the client SDK includes device integrity checks. GPS coordinates are validated against IP geolocation for consistency — mismatches exceeding 100km are flagged and denied under strict enforcement mode.
- **IP-GPS Correlation**: When both signals are available, the system cross-references them. Significant disagreements trigger enhanced verification or denial, depending on the enforcement level configured for the geo-rule.
- **Fail-Safe Default**: If no geo-rule matches a request, access is denied by default. This prevents accidental exposure in unconfigured jurisdictions.
- **Cache Isolation**: Geo-blocking results are cached per-user-per-venture with short TTLs (5 minutes). Cache keys include the IP address to prevent stale results when users change networks.

### Compliance Data Integrity

- **Immutable Audit Logs**: Jurisdiction check results, license changes, permit modifications, and deadline completions produce immutable audit entries. These cannot be modified or deleted, even by administrators.
- **Change Tracking**: All jurisdiction registry modifications are tracked with full before/after snapshots, the modifying user, timestamp, and reason for change.
- **License Document Chain**: License and permit documents maintain a cryptographic hash chain to ensure document integrity and prevent tampering.
- **Regulatory Evidence**: Compliance deadline completions require document uploads and filing references, creating an evidence trail for regulatory audits.

### Rate Limiting

- **Jurisdiction Checks**: Cached aggressively (5-minute TTL per user + venture + IP). Raw database queries are rate-limited to 100/minute per organization.
- **License Queries**: Read operations are cached with 15-minute TTL. Write operations are limited to 10/minute per user.
- **Geo-Rule Evaluation**: Rules are cached in-memory with 60-second refresh intervals. MaxMind API calls are cached per-IP with 1-hour TTL.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JURISDICTION_MAXMIND_LICENSE_KEY` | Yes | — | MaxMind GeoIP2 license key for IP geolocation and anonymous IP detection. |
| `JURISDICTION_MAXMIND_ACCOUNT_ID` | Yes | — | MaxMind account ID for API access. |
| `JURISDICTION_GEO_DB_PATH` | No | `/data/geoip/` | Path to locally cached MaxMind GeoIP2 databases (City, Anonymous IP). |
| `JURISDICTION_GEO_DB_REFRESH_HOURS` | No | `24` | How often to refresh the local GeoIP2 database copy. |
| `JURISDICTION_CACHE_TTL_SECONDS` | No | `300` | Default TTL for jurisdiction check result caches (5 minutes). |
| `JURISDICTION_LICENSE_CACHE_TTL_SECONDS` | No | `900` | TTL for license data caches (15 minutes). |
| `JURISDICTION_GEO_RULE_REFRESH_SECONDS` | No | `60` | How often to refresh in-memory geo-rule cache. |
| `JURISDICTION_DEFAULT_ENFORCEMENT` | No | `ip_only` | Default geo-enforcement method when not specified per rule. |
| `JURISDICTION_MISMATCH_THRESHOLD_KM` | No | `100` | Maximum acceptable distance (km) between IP and GPS locations before flagging a mismatch. |
| `JURISDICTION_VPN_BLOCK_ENABLED` | No | `true` | Whether to block VPN/proxy connections globally. Per-venture overrides take precedence. |
| `JURISDICTION_FAIL_OPEN` | No | `false` | If `true`, allow access when jurisdiction cannot be resolved. **DANGEROUS** — should only be `true` in development. |
| `JURISDICTION_AUDIT_LEVEL` | No | `all` | Audit logging level: `all` (every check), `denials_only`, `changes_only`. |
| `JURISDICTION_RENEWAL_CHECK_CRON` | No | `0 6 * * *` | Cron schedule for the daily license renewal check job. |
| `JURISDICTION_DEADLINE_REMINDER_CRON` | No | `0 8 * * *` | Cron schedule for sending compliance deadline reminders. |
| `JURISDICTION_DATA_RESIDENCY_DEFAULT_REGION` | No | `us-east-1` | Default data storage region when no jurisdiction-specific rule applies. |
| `JURISDICTION_CONTENT_FILTER_ENABLED` | No | `true` | Whether to apply content restrictions globally. |

---

## Dependencies

### Internal Modules

| Module | Relationship | Purpose |
|--------|-------------|---------|
| `@mcv/identity` | Required | User location data (IP resolution, profile country), session context, authentication state. |
| `@mcv/compliance/kyc` | Required | Age verification document processing, identity proof validation. Jurisdictions delegates age document checks to KYC. |
| `@mcv/compliance/aml` | Recommended | Sanctions screening integration. Jurisdictions checks `prohibited` status; AML provides granular sanctions data. |
| `@mcv/platform/ventures` | Required | Venture registry — which ventures exist, their types, operating regions. Jurisdictions maps regulations to ventures. |
| `@mcv/platform/tenancy` | Required | Organization and tenant context. All jurisdiction data is org-scoped. |
| `@mcv/observability` | Required | Audit trail logging, compliance event recording, metric emissions for jurisdiction check latency and denial rates. |
| `@mcv/documents` | Recommended | License document storage, permit application files, compliance submission evidence. |
| `@mcv/notifications` | Recommended | Compliance deadline reminders, license expiry alerts, escalation notifications. |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@maxmind/geoip2-node` | `^5.0.0` | MaxMind GeoIP2 client for IP-to-location resolution and anonymous IP detection (VPN/proxy). |
| `drizzle-orm` | `^0.36.0` | Database ORM for all jurisdiction schemas. Type-safe queries with Supabase PostgreSQL. |
| `@supabase/supabase-js` | `^2.45.0` | Supabase client for RLS-enforced database access. |
| `zod` | `^3.23.0` | Runtime validation for jurisdiction codes, geo-coordinates, license data, and API inputs. |
| `date-fns` | `^4.1.0` | Date manipulation for compliance deadline calculations, recurrence scheduling, timezone conversions. |
| `@turf/turf` | `^7.0.0` | Geospatial calculations — point-in-polygon checks for geo-fence evaluation, distance calculations. |
| `node-cron` | `^3.0.0` | Scheduling for license renewal checks and compliance deadline reminder jobs. |
| `ioredis` | `^5.4.0` | Redis client for caching jurisdiction check results, geo-rules, and license data. |

### Peer Dependencies

| Package | Version | Notes |
|---------|---------|-------|
| `typescript` | `^5.5.0` | Required for type inference across jurisdiction interfaces. |
| `@trpc/server` | `^11.0.0` | tRPC server for jurisdiction router and middleware integration. |

---

## Testing

### Unit Tests

```typescript
// __tests__/jurisdiction.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JurisdictionService } from '../services/jurisdiction.service';
import { createTestContext } from '@mcv/testing';

describe('JurisdictionService', () => {
  let service: JurisdictionService;
  let ctx: TestTRPCContext;

  beforeEach(async () => {
    ctx = await createTestContext({ orgId: 'test-org' });
    service = ctx.services.jurisdiction;

    // Seed test jurisdictions
    await ctx.db.insert(jurisdictions).values([
      { code: 'US', name: 'United States', level: 'country', countryCode: 'US', region: 'north_america', status: 'active', orgId: 'test-org', defaultMinAge: 18 },
      { code: 'US-NJ', name: 'New Jersey', level: 'state', parentCode: 'US', countryCode: 'US', region: 'north_america', status: 'active', orgId: 'test-org', defaultMinAge: 21 },
      { code: 'GB', name: 'United Kingdom', level: 'country', countryCode: 'GB', region: 'europe', status: 'active', orgId: 'test-org', defaultMinAge: 18 },
      { code: 'CA-ON', name: 'Ontario', level: 'province', parentCode: 'CA', countryCode: 'CA', region: 'north_america', status: 'active', orgId: 'test-org', defaultMinAge: 19 },
      { code: 'KP', name: 'North Korea', level: 'country', countryCode: 'KP', region: 'asia_pacific', status: 'prohibited', orgId: 'test-org', defaultMinAge: 18 },
    ]);
  });

  describe('resolveJurisdiction', () => {
    it('should resolve jurisdiction from IP address', async () => {
      // Mock MaxMind to return NJ
      vi.spyOn(service['maxMind'], 'city').mockResolvedValue({
        country: { isoCode: 'US' },
        subdivisions: [{ isoCode: 'NJ' }],
      });

      const result = await service.resolveJurisdiction(ctx, {
        ipAddress: '72.229.28.185',
      });

      expect(result.code).toBe('US-NJ');
      expect(result.level).toBe('state');
      expect(result.parentCode).toBe('US');
    });

    it('should prefer GPS over IP when both available', async () => {
      vi.spyOn(service['maxMind'], 'city').mockResolvedValue({
        country: { isoCode: 'US' },
        subdivisions: [{ isoCode: 'NY' }],
      });

      const result = await service.resolveJurisdiction(ctx, {
        ipAddress: '72.229.28.185',
        latitude: 40.0583,
        longitude: -74.4057,  // NJ coordinates
      });

      expect(result.code).toBe('US-NJ');
    });

    it('should return prohibited status for sanctioned jurisdictions', async () => {
      vi.spyOn(service['maxMind'], 'city').mockResolvedValue({
        country: { isoCode: 'KP' },
      });

      const result = await service.resolveJurisdiction(ctx, {
        ipAddress: '175.45.176.1',
      });

      expect(result.code).toBe('KP');
      expect(result.status).toBe('prohibited');
    });
  });

  describe('checkAccess', () => {
    it('should deny access in prohibited jurisdictions', async () => {
      const result = await service.checkAccess(ctx, {
        ventureId: 'betedge',
        userId: 'user-1',
        ipAddress: '175.45.176.1',  // Mocked to KP
        operationType: 'sports_betting',
      });

      expect(result.allowed).toBe(false);
      expect(result.reasons).toContainEqual(
        expect.objectContaining({ category: 'sanctions' })
      );
    });

    it('should deny access without valid license', async () => {
      // No license seeded for US-NJ + betedge
      const result = await service.checkAccess(ctx, {
        ventureId: 'betedge',
        userId: 'user-1',
        ipAddress: '72.229.28.185',  // Mocked to US-NJ
        operationType: 'sports_betting',
      });

      expect(result.allowed).toBe(false);
      expect(result.reasons).toContainEqual(
        expect.objectContaining({ category: 'license' })
      );
    });

    it('should allow access with valid license and met requirements', async () => {
      // Seed license and age verification
      await seedActiveLicense(ctx, 'betedge', 'US-NJ');
      await seedAgeVerification(ctx, 'user-1', 'US-NJ', 25);

      const result = await service.checkAccess(ctx, {
        ventureId: 'betedge',
        userId: 'user-1',
        ipAddress: '72.229.28.185',
        operationType: 'sports_betting',
      });

      expect(result.allowed).toBe(true);
      expect(result.jurisdictionCode).toBe('US-NJ');
    });
  });
});
```

### Integration Tests

```typescript
// __tests__/geo-blocking.integration.test.ts
import { describe, it, expect } from 'vitest';
import { GeoBlockingService } from '../services/geo-blocking.service';
import { createIntegrationContext } from '@mcv/testing';

describe('GeoBlockingService Integration', () => {
  it('should block VPN connections for gambling ventures', async () => {
    const ctx = await createIntegrationContext();

    const result = await ctx.services.geoBlocking.enforceGeoBlock(ctx, {
      ventureId: 'betedge',
      ipAddress: '104.238.140.1',  // Known VPN IP
    });

    expect(result.allowed).toBe(false);
    expect(result.vpnDetected).toBe(true);
  });

  it('should flag IP-GPS mismatch under strict enforcement', async () => {
    const ctx = await createIntegrationContext();

    // IP resolves to New York, GPS says California
    const result = await ctx.services.geoBlocking.enforceGeoBlock(ctx, {
      ventureId: 'betedge',
      ipAddress: '72.229.28.185',  // NYC
      gpsCoordinates: { latitude: 34.0522, longitude: -118.2437 },  // LA
    });

    expect(result.locationMismatch).toBe(true);
    // Under strict enforcement, this should be denied
  });

  it('should allow access from licensed jurisdiction with matching IP and GPS', async () => {
    const ctx = await createIntegrationContext();

    const result = await ctx.services.geoBlocking.enforceGeoBlock(ctx, {
      ventureId: 'betedge',
      ipAddress: '72.229.28.185',  // NJ area
      gpsCoordinates: { latitude: 40.0583, longitude: -74.4057 },  // NJ
    });

    expect(result.allowed).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.locationMismatch).toBe(false);
  });
});
```

### Testing Notes

- **Geo-Location Mocking**: All tests must mock MaxMind responses. Never make real GeoIP2 API calls in tests. Use the `@mcv/testing` fixture system to seed consistent IP-to-location mappings.
- **Timezone Sensitivity**: Compliance deadline tests must pin the system clock (use `vi.useFakeTimers()`) to avoid flaky tests caused by timezone differences between CI and local environments.
- **License Expiry Tests**: Test the boundary conditions — licenses expiring today, yesterday, in exactly 30/90/180 days. Ensure the renewal workflow triggers at correct thresholds.
- **RLS Isolation**: Integration tests must verify that jurisdiction data from one organization is invisible to another. Create test scenarios with two orgs and assert cross-org queries return empty.
- **VPN Detection**: Maintain a test fixture of known VPN/proxy IPs for consistent anonymous IP detection testing. Update quarterly to match MaxMind's database updates.
- **Content Time Restrictions**: Test with multiple timezones — a restriction that blocks gambling ads 6am-9pm in Rome should not affect a user in Tokyo at the same UTC time.
- **Compliance Calendar Recurrence**: Verify that completing a quarterly deadline correctly generates the next occurrence 3 months later, accounting for month-length variations (Jan 31 → Apr 30).
- **Fail-Safe Behavior**: Always test the default-deny case — when no geo-rule matches, when jurisdiction resolution fails, when the MaxMind database is unavailable. The system must deny access rather than fail open.
- **Performance**: Jurisdiction checks run on every request for geo-restricted ventures. Benchmark the full `checkAccess` pipeline to ensure it completes within 50ms (cached) / 200ms (uncached). Include this in CI performance regression tests.
- **Seed Data**: Maintain a comprehensive seed script covering at least 20 jurisdictions across all 6 regions, with varying statuses, age requirements, data residency rules, and content restrictions. This seed is shared across all compliance module test suites.

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/compliance/kyc` | Delegates age verification document checks; receives jurisdiction-specific verification method requirements. |
| `@mcv/compliance/aml` | Provides sanctions data for prohibited jurisdictions; consumes jurisdiction resolution for PEP screening context. |
| `@mcv/compliance/responsible-gambling` | Consumes jurisdiction data to apply region-specific responsible gambling rules (self-exclusion periods, deposit limits). |
| `@mcv/identity` | Provides user location, IP address, and profile country. Jurisdictions resolves these into regulatory jurisdiction codes. |
| `@mcv/platform/ventures` | Source of truth for venture types and operating regions. Jurisdictions maps regulatory requirements to ventures based on type. |
| `@mcv/payments` | Consumes tax nexus and withholding data for transaction processing. Jurisdictions provides the tax rate and reporting requirements. |
| `@mcv/observability` | Receives all compliance audit events. Provides dashboards for jurisdiction check latency, denial rates, and compliance scores. |