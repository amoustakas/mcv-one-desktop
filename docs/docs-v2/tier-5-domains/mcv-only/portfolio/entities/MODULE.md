# @mcv/portfolio/entities

> **Tier 5 — MCV-Only Domain Module**
> Legal entity management for the MCV Global Consortium

**Package:** `@mcv/portfolio/entities`
**Tier:** 5 (Domain — MCV-Only)
**Access:** MCV internal only — not shared with ventures or external consumers
**Owner:** Portfolio Management Division
**Since:** 0.1.0

---

## Purpose

The `@mcv/portfolio/entities` module is the authoritative system of record for every legal entity within the MCV Global Consortium's corporate structure. MCV operates nine distinct ventures spanning technology, media, real estate, healthcare, and financial services — each venture potentially comprising dozens of legal entities across multiple jurisdictions. This module provides the foundational registry, hierarchy mapping, and lifecycle management that underpins corporate governance, regulatory compliance, tax planning, and financial consolidation across the entire consortium.

At its core, the module maintains a comprehensive registry of legal entities — corporations (C-corps, S-corps), limited liability companies (single-member and multi-member), general and limited partnerships, sole proprietorships, statutory and common-law trusts, and special-purpose vehicles. Each entity record captures its formation jurisdiction, entity type, tax classification, registered agent assignments, EIN/tax identifiers (encrypted at rest), and current compliance standing. The hierarchical relationship engine models the full parent-child ownership graph from MCV Global Holdings at the apex down through intermediate holding companies, operating subsidiaries, and special-purpose entities, enabling consolidation analysis, transfer pricing validation, and beneficial ownership reporting.

Beyond static record-keeping, the module manages the complete entity lifecycle — from initial formation and state registration through amendments, conversions between entity types, mergers and acquisitions, and eventual dissolution or wind-down. It integrates tightly with `@mcv/compliance` for regulatory filing orchestration, `@mcv/treasury` for entity-level financial tracking and inter-company transaction management, and the broader portfolio management suite for venture-level reporting and strategic analysis. All operations are governed by multi-tenant row-level security policies ensuring that venture-specific entity data remains isolated while consortium-wide views are available to authorized portfolio administrators.

---

## Exports

```typescript
// @mcv/portfolio/entities — Public API

// ─── Core Services ───────────────────────────────────────────────
export { EntityService }              from './services/entity.service';
export { HierarchyService }           from './services/hierarchy.service';
export { OwnershipService }           from './services/ownership.service';
export { RegisteredAgentService }     from './services/registered-agent.service';
export { CorporateDocumentService }   from './services/corporate-document.service';
export { OfficerDirectorService }     from './services/officer-director.service';
export { ComplianceStatusService }    from './services/compliance-status.service';
export { TaxIdService }              from './services/tax-id.service';
export { EntityLifecycleService }    from './services/entity-lifecycle.service';
export { InterEntityService }        from './services/inter-entity.service';

// ─── tRPC Router ─────────────────────────────────────────────────
export { entitiesRouter }            from './router';
export type { EntitiesRouter }       from './router';

// ─── Core Types ──────────────────────────────────────────────────
export type { LegalEntity }          from './types/legal-entity';
export type { EntityHierarchy }      from './types/entity-hierarchy';
export type { HierarchyNode }        from './types/entity-hierarchy';
export type { HierarchyTree }        from './types/entity-hierarchy';
export type { OwnershipRecord }      from './types/ownership-record';
export type { BeneficialOwner }      from './types/ownership-record';
export type { VotingRights }         from './types/ownership-record';
export type { RegisteredAgent }      from './types/registered-agent';
export type { CorporateDocument }    from './types/corporate-document';
export type { DocumentVersion }      from './types/corporate-document';
export type { Officer }              from './types/officer';
export type { Director }             from './types/officer';
export type { BoardMember }          from './types/officer';
export type { ComplianceStatus }     from './types/compliance-status';
export type { ComplianceFiling }     from './types/compliance-status';
export type { TaxIdentifier }        from './types/tax-identifier';
export type { EncryptedTaxId }       from './types/tax-identifier';

// ─── Enums ───────────────────────────────────────────────────────
export { EntityType }                from './types/enums';
export { EntityStatus }              from './types/enums';
export { JurisdictionType }          from './types/enums';
export { TaxClassification }         from './types/enums';
export { OfficerRole }               from './types/enums';
export { DocumentCategory }          from './types/enums';
export { ComplianceState }           from './types/enums';
export { LifecycleEvent }            from './types/enums';
export { TransactionType }           from './types/enums';
export { OwnershipType }             from './types/enums';

// ─── Lifecycle Types ─────────────────────────────────────────────
export type { FormationRequest }     from './types/lifecycle';
export type { AmendmentRequest }     from './types/lifecycle';
export type { ConversionRequest }    from './types/lifecycle';
export type { DissolutionRequest }   from './types/lifecycle';
export type { MergerRequest }        from './types/lifecycle';

// ─── Inter-Entity Types ──────────────────────────────────────────
export type { InterEntityTransaction }  from './types/inter-entity';
export type { TransferPricingRecord }   from './types/inter-entity';
export type { InterCompanyLoan }        from './types/inter-entity';
export type { EquityTransfer }          from './types/inter-entity';

// ─── Validation Schemas ──────────────────────────────────────────
export { createEntitySchema }        from './schemas/entity.schema';
export { updateEntitySchema }        from './schemas/entity.schema';
export { ownershipRecordSchema }     from './schemas/ownership.schema';
export { hierarchyNodeSchema }       from './schemas/hierarchy.schema';
export { officerSchema }             from './schemas/officer.schema';
export { complianceFilingSchema }    from './schemas/compliance.schema';
export { interEntityTxSchema }       from './schemas/inter-entity.schema';

// ─── DB Schema ───────────────────────────────────────────────────
export { legalEntities }             from './db/schema';
export { entityHierarchy }           from './db/schema';
export { ownershipRecords }          from './db/schema';
export { registeredAgents }          from './db/schema';
export { corporateDocuments }        from './db/schema';
export { entityOfficers }            from './db/schema';
export { complianceFilings }         from './db/schema';
export { taxIdentifiers }            from './db/schema';
export { interEntityTransactions }   from './db/schema';

// ─── Utilities ───────────────────────────────────────────────────
export { buildHierarchyTree }        from './utils/hierarchy';
export { calculateOwnershipChain }   from './utils/ownership';
export { encryptTaxId, decryptTaxId } from './utils/crypto';
export { validateEIN }               from './utils/validators';
export { resolveJurisdiction }       from './utils/jurisdiction';
export { generateOrgChart }          from './utils/org-chart';

// ─── Error Classes ───────────────────────────────────────────────
export { EntityError }               from './errors';
export { EntityNotFoundError }       from './errors';
export { DuplicateEntityError }      from './errors';
export { HierarchyCycleError }       from './errors';
export { OwnershipExceedsError }     from './errors';
export { InvalidTaxIdError }         from './errors';
export { ComplianceLapsedError }     from './errors';
export { UnauthorizedEntityAccess }  from './errors';
export { DocumentNotFoundError }     from './errors';
export { LifecycleTransitionError }  from './errors';
export { InterEntityValidationError } from './errors';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/portfolio/entities                                 │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                           tRPC Router Layer                              │   │
│  │                                                                          │   │
│  │   entities.create    entities.hierarchy.build    entities.ownership.set   │   │
│  │   entities.get       entities.hierarchy.tree     entities.ownership.get   │   │
│  │   entities.update    entities.hierarchy.move     entities.ownership.chain │   │
│  │   entities.list      entities.hierarchy.flatten  entities.agents.assign   │   │
│  │   entities.delete    entities.officers.appoint   entities.agents.renew    │   │
│  │   entities.search    entities.officers.remove    entities.agents.list     │   │
│  │   entities.lifecycle.form      entities.compliance.status                │   │
│  │   entities.lifecycle.amend     entities.compliance.file                  │   │
│  │   entities.lifecycle.convert   entities.compliance.history               │   │
│  │   entities.lifecycle.dissolve  entities.documents.upload                 │   │
│  │   entities.lifecycle.merge     entities.documents.download               │   │
│  │   entities.taxId.set           entities.interEntity.transfer             │   │
│  │   entities.taxId.get           entities.interEntity.loan                 │   │
│  └──────────────────────────┬───────────────────────────────────────────────┘   │
│                             │                                                    │
│  ┌──────────────────────────▼───────────────────────────────────────────────┐   │
│  │                          Service Layer                                    │   │
│  │                                                                          │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │   │
│  │  │  EntityService   │  │ HierarchyService │  │   OwnershipService     │  │   │
│  │  │                  │  │                  │  │                        │  │   │
│  │  │ • CRUD entities  │  │ • Parent-child   │  │ • Ownership %          │  │   │
│  │  │ • Type mgmt      │  │ • Tree building  │  │ • Beneficial owners    │  │   │
│  │  │ • Status tracking│  │ • Cycle detect   │  │ • Voting rights        │  │   │
│  │  │ • Search/filter  │  │ • Flatten/walk   │  │ • Chain calculation    │  │   │
│  │  └─────────────────┘  └──────────────────┘  └────────────────────────┘  │   │
│  │                                                                          │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │   │
│  │  │ RegisteredAgent  │  │ CorporateDoc     │  │  OfficerDirector       │  │   │
│  │  │    Service       │  │    Service        │  │     Service            │  │   │
│  │  │                  │  │                  │  │                        │  │   │
│  │  │ • Agent assign   │  │ • Doc vault      │  │ • Board members        │  │   │
│  │  │ • Renewal track  │  │ • Versioning     │  │ • Officer appointments │  │   │
│  │  │ • Jurisdiction   │  │ • Access control │  │ • Term management      │  │   │
│  │  └─────────────────┘  └──────────────────┘  └────────────────────────┘  │   │
│  │                                                                          │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │   │
│  │  │ ComplianceStatus │  │  TaxIdService    │  │  EntityLifecycle       │  │   │
│  │  │    Service       │  │                  │  │     Service            │  │   │
│  │  │                  │  │ • EIN encrypt    │  │                        │  │   │
│  │  │ • Good standing  │  │ • State tax IDs  │  │ • Formation            │  │   │
│  │  │ • Filing status  │  │ • Secure access  │  │ • Amendment            │  │   │
│  │  │ • Deadline track │  │ • Audit trail    │  │ • Conversion           │  │   │
│  │  └─────────────────┘  └──────────────────┘  │ • Dissolution          │  │   │
│  │                                              │ • Merger               │  │   │
│  │  ┌─────────────────────────────────────┐    └────────────────────────┘  │   │
│  │  │       InterEntityService            │                                 │   │
│  │  │                                     │                                 │   │
│  │  │ • Transfer pricing                  │                                 │   │
│  │  │ • Inter-company loans               │                                 │   │
│  │  │ • Equity transfers                  │                                 │   │
│  │  │ • Arm's-length validation           │                                 │   │
│  │  └─────────────────────────────────────┘                                 │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                             │                                                    │
│  ┌──────────────────────────▼───────────────────────────────────────────────┐   │
│  │                        Data Access Layer                                  │   │
│  │                                                                          │   │
│  │   Drizzle ORM  ──▶  Supabase PostgreSQL  ──▶  Row-Level Security        │   │
│  │                                                                          │   │
│  │   Tables:                                                                │   │
│  │   ├── legal_entities            (core entity records)                    │   │
│  │   ├── entity_hierarchy          (parent-child relationships)             │   │
│  │   ├── ownership_records         (ownership percentages & voting)         │   │
│  │   ├── registered_agents         (agent assignments per jurisdiction)     │   │
│  │   ├── corporate_documents       (document vault with versions)           │   │
│  │   ├── entity_officers           (officers, directors, board members)     │   │
│  │   ├── compliance_filings        (filing status per jurisdiction)         │   │
│  │   ├── tax_identifiers           (encrypted EIN/state IDs)               │   │
│  │   └── inter_entity_transactions (transfer pricing, loans, equity)       │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                             │                                                    │
│  ┌──────────────────────────▼───────────────────────────────────────────────┐   │
│  │                      Integration Layer                                    │   │
│  │                                                                          │   │
│  │   @mcv/compliance          @mcv/treasury          @mcv/portfolio/core    │   │
│  │   ├── Filing orchestration  ├── Entity financials  ├── Venture mapping   │   │
│  │   ├── Regulatory calendar   ├── Inter-co accounting├── KPI aggregation   │   │
│  │   └── Audit preparation     └── Consolidation      └── Portfolio views   │   │
│  │                                                                          │   │
│  │   @mcv/auth                 @mcv/storage            @mcv/audit           │   │
│  │   ├── RLS context           ├── Document storage    ├── Change tracking  │   │
│  │   └── Permission checks     └── Encrypted blobs     └── Access logs      │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

Entity Hierarchy Example (MCV Consortium):

    MCV Global Holdings, Inc.  (C-Corp, Delaware)
    ├── MCV Capital Partners LLC  (LLC, Delaware)
    │   ├── MCV Fund I LP  (LP, Delaware)
    │   └── MCV Fund II LP  (LP, Delaware)
    ├── MCV Technology Holdings LLC  (LLC, Delaware)
    │   ├── Venture Alpha Inc.  (C-Corp, Delaware)
    │   │   ├── Alpha Operations LLC  (LLC, California)
    │   │   └── Alpha IP Holdings Ltd.  (Ltd, Ireland)
    │   └── Venture Beta Inc.  (C-Corp, Delaware)
    │       └── Beta Labs LLC  (LLC, New York)
    ├── MCV Media Group Inc.  (C-Corp, New York)
    │   ├── Media Streaming LLC  (LLC, California)
    │   └── Content Licensing LP  (LP, New York)
    ├── MCV Real Estate Holdings LLC  (LLC, Delaware)
    │   ├── RE Property Trust I  (Trust, Delaware)
    │   └── RE Property Trust II  (Trust, Delaware)
    └── MCV Healthcare Ventures LLC  (LLC, Delaware)
        ├── HealthTech Solutions Inc.  (C-Corp, Delaware)
        └── Clinical Research Partners LP  (LP, Massachusetts)
```

---

## Core Interfaces

### LegalEntity

```typescript
/**
 * Represents a legal entity registered in one or more jurisdictions.
 * Core record in the entity registry — all other data references this.
 */
interface LegalEntity {
  /** UUID primary key */
  id: string;

  /** MCV-internal entity code (e.g., "MCV-TECH-ALPHA-001") */
  entityCode: string;

  /** Legal name as registered with the state/jurisdiction */
  legalName: string;

  /** DBA / trade name, if different from legal name */
  tradeName: string | null;

  /** Type of legal entity */
  entityType: EntityType;

  /** IRS tax classification (C-Corp, S-Corp, Partnership, Disregarded, etc.) */
  taxClassification: TaxClassification;

  /** Two-letter state code or ISO country code of formation */
  formationJurisdiction: string;

  /** Date the entity was legally formed */
  formationDate: Date;

  /** Date of dissolution, if applicable */
  dissolutionDate: Date | null;

  /** Current operational status */
  status: EntityStatus;

  /** Fiscal year end (MM-DD format, e.g., "12-31") */
  fiscalYearEnd: string;

  /** MCV venture this entity belongs to */
  ventureId: string;

  /** Purpose / business activity description */
  purpose: string | null;

  /** Principal office address (structured) */
  principalAddress: Address;

  /** Mailing address, if different */
  mailingAddress: Address | null;

  /** Primary contact email */
  contactEmail: string | null;

  /** Primary contact phone */
  contactPhone: string | null;

  /** Internal notes (not for external reporting) */
  notes: string | null;

  /** Tenant ID for RLS isolation */
  tenantId: string;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

enum EntityType {
  C_CORP = 'c_corp',
  S_CORP = 's_corp',
  LLC_SINGLE = 'llc_single_member',
  LLC_MULTI = 'llc_multi_member',
  LP = 'limited_partnership',
  GP = 'general_partnership',
  LLP = 'limited_liability_partnership',
  SOLE_PROP = 'sole_proprietorship',
  TRUST_STATUTORY = 'statutory_trust',
  TRUST_COMMON_LAW = 'common_law_trust',
  SPV = 'special_purpose_vehicle',
  NONPROFIT = 'nonprofit_corporation',
  SERIES_LLC = 'series_llc',
  PROFESSIONAL_CORP = 'professional_corporation',
}

enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DISSOLVED = 'dissolved',
  MERGED = 'merged',
  CONVERTED = 'converted',
  PENDING_FORMATION = 'pending_formation',
  PENDING_DISSOLUTION = 'pending_dissolution',
  ADMINISTRATIVE_HOLD = 'administrative_hold',
  REVOKED = 'revoked',
}

enum TaxClassification {
  C_CORPORATION = 'c_corporation',
  S_CORPORATION = 's_corporation',
  PARTNERSHIP = 'partnership',
  DISREGARDED_ENTITY = 'disregarded_entity',
  TRUST = 'trust',
  TAX_EXEMPT = 'tax_exempt',
  REIT = 'reit',
  RIC = 'regulated_investment_company',
}

interface Address {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

### EntityHierarchy

```typescript
/**
 * Defines parent-child relationships between legal entities.
 * Enables tree traversal, consolidation grouping, and org chart generation.
 */
interface EntityHierarchy {
  /** UUID primary key */
  id: string;

  /** Parent entity ID (null = root / top-level entity) */
  parentEntityId: string;

  /** Child entity ID */
  childEntityId: string;

  /** Type of hierarchical relationship */
  relationshipType: HierarchyRelationType;

  /** Ownership percentage the parent holds in the child (0-100) */
  ownershipPercentage: number;

  /** Whether this relationship is the primary/controlling one */
  isPrimary: boolean;

  /** Effective date of the relationship */
  effectiveDate: Date;

  /** End date, if the relationship has been severed */
  endDate: Date | null;

  /** Notes about the relationship */
  notes: string | null;

  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

enum HierarchyRelationType {
  SUBSIDIARY = 'subsidiary',
  AFFILIATE = 'affiliate',
  JOINT_VENTURE = 'joint_venture',
  BRANCH = 'branch',
  DIVISION = 'division',
  SERIES = 'series',            // Series LLC member
  FUND = 'fund',                // Fund under GP
}

/**
 * A node in the entity hierarchy tree.
 * Built by the tree construction algorithm for visualization and traversal.
 */
interface HierarchyNode {
  entity: LegalEntity;
  relationship: EntityHierarchy | null;  // null for root
  children: HierarchyNode[];
  depth: number;
  totalOwnershipFromRoot: number;  // Computed cascading ownership
}

/**
 * Full hierarchy tree with metadata.
 */
interface HierarchyTree {
  root: HierarchyNode;
  totalEntities: number;
  maxDepth: number;
  generatedAt: Date;
}
```

### OwnershipRecord

```typescript
/**
 * Tracks ownership stakes in an entity — both entity-to-entity and
 * individual beneficial ownership.
 */
interface OwnershipRecord {
  id: string;

  /** The entity being owned */
  entityId: string;

  /** Type of owner */
  ownerType: OwnershipType;

  /** If owned by another entity, its ID */
  ownerEntityId: string | null;

  /** If owned by an individual, their profile ID */
  ownerIndividualId: string | null;

  /** Owner display name (denormalized for reporting) */
  ownerName: string;

  /** Ownership class (e.g., "Class A Common", "Preferred Series B") */
  ownershipClass: string;

  /** Percentage ownership (0.0000 - 100.0000, 4 decimal precision) */
  percentageOwned: number;

  /** Number of units/shares held */
  unitsHeld: number | null;

  /** Total units/shares outstanding for this class */
  totalUnitsOutstanding: number | null;

  /** Capital contribution amount (in cents) */
  capitalContribution: number | null;

  /** Voting rights associated with this ownership stake */
  votingRights: VotingRights;

  /** Whether this is a beneficial ownership record (for FinCEN BOI) */
  isBeneficialOwner: boolean;

  /** Date ownership was acquired */
  acquisitionDate: Date;

  /** Date ownership was disposed, if applicable */
  dispositionDate: Date | null;

  /** Method of acquisition */
  acquisitionMethod: AcquisitionMethod;

  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

enum OwnershipType {
  ENTITY = 'entity',
  INDIVIDUAL = 'individual',
  TRUST = 'trust',
  ESTATE = 'estate',
  FOREIGN_ENTITY = 'foreign_entity',
}

enum AcquisitionMethod {
  FORMATION = 'formation',
  PURCHASE = 'purchase',
  TRANSFER = 'transfer',
  GIFT = 'gift',
  INHERITANCE = 'inheritance',
  CONVERSION = 'conversion',
  STOCK_SPLIT = 'stock_split',
  MERGER = 'merger',
}

interface VotingRights {
  /** Votes per unit/share */
  votesPerUnit: number;

  /** Whether this class has voting rights at all */
  hasVotingRights: boolean;

  /** Special voting provisions (e.g., "super-majority required for dissolution") */
  specialProvisions: string[];

  /** Board seat election rights */
  boardElectionRights: boolean;

  /** Veto rights on specific matters */
  vetoRights: string[];
}

/**
 * Beneficial owner record for FinCEN BOI (Beneficial Ownership Information) reporting.
 */
interface BeneficialOwner {
  id: string;
  entityId: string;
  individualId: string;

  /** Full legal name */
  fullName: string;

  /** Date of birth (encrypted at rest) */
  dateOfBirth: string;  // Encrypted

  /** Residential address */
  residentialAddress: Address;

  /** Identification document type */
  idDocumentType: 'passport' | 'drivers_license' | 'state_id' | 'foreign_passport';

  /** Document number (encrypted at rest) */
  idDocumentNumber: string;  // Encrypted

  /** Issuing jurisdiction */
  idIssuingJurisdiction: string;

  /** Document image reference in secure storage */
  idDocumentImageRef: string | null;

  /** Nature of beneficial ownership */
  ownershipNature: ('substantial_control' | 'equity_ownership_25_plus')[];

  /** Exemption status */
  isExempt: boolean;
  exemptionReason: string | null;

  /** FinCEN filing reference */
  fincenFilingId: string | null;
  fincenFilingDate: Date | null;

  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### RegisteredAgent

```typescript
/**
 * Registered agent assignments per entity per jurisdiction.
 * Tracks renewal dates, costs, and agent contact information.
 */
interface RegisteredAgent {
  id: string;

  /** Entity this agent serves */
  entityId: string;

  /** Jurisdiction where the agent is registered (state code or country) */
  jurisdiction: string;

  /** Agent company name (e.g., "CT Corporation", "Registered Agents Inc.") */
  agentName: string;

  /** Agent type */
  agentType: 'commercial' | 'individual' | 'self';

  /** Agent physical address (must be in-jurisdiction) */
  agentAddress: Address;

  /** Agent contact email */
  agentEmail: string | null;

  /** Agent contact phone */
  agentPhone: string | null;

  /** Account number with the agent service */
  accountNumber: string | null;

  /** Annual fee in cents */
  annualFeeCents: number | null;

  /** Current assignment start date */
  effectiveDate: Date;

  /** When the current term expires / next renewal */
  renewalDate: Date;

  /** Whether auto-renewal is enabled */
  autoRenew: boolean;

  /** Current status */
  status: 'active' | 'pending_renewal' | 'expired' | 'terminated';

  /** Notes about service quality, issues, etc. */
  notes: string | null;

  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### CorporateDocument

```typescript
/**
 * Corporate document vault — stores references to formation documents,
 * operating agreements, bylaws, resolutions, and other legal instruments.
 * Actual file content is stored in @mcv/storage; this tracks metadata and versions.
 */
interface CorporateDocument {
  id: string;

  /** Entity this document belongs to */
  entityId: string;

  /** Document category */
  category: DocumentCategory;

  /** Human-readable document title */
  title: string;

  /** Detailed description */
  description: string | null;

  /** Reference to the file in secure storage */
  storageRef: string;

  /** MIME type of the stored file */
  mimeType: string;

  /** File size in bytes */
  fileSizeBytes: number;

  /** Current version number */
  currentVersion: number;

  /** Whether this is the current/active version of its category for the entity */
  isCurrent: boolean;

  /** Document effective date (e.g., date of adoption/execution) */
  effectiveDate: Date | null;

  /** Expiration date, if applicable (e.g., for certificates) */
  expirationDate: Date | null;

  /** Who executed/signed the document */
  executedBy: string | null;

  /** Notarization status */
  isNotarized: boolean;

  /** State filing reference number */
  filingReference: string | null;

  /** Access control — who can view this document */
  accessLevel: DocumentAccessLevel;

  /** Tags for search and filtering */
  tags: string[];

  /** Checksum for integrity verification */
  sha256Hash: string;

  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  uploadedBy: string;
}

enum DocumentCategory {
  ARTICLES_OF_INCORPORATION = 'articles_of_incorporation',
  CERTIFICATE_OF_FORMATION = 'certificate_of_formation',
  ARTICLES_OF_ORGANIZATION = 'articles_of_organization',
  BYLAWS = 'bylaws',
  OPERATING_AGREEMENT = 'operating_agreement',
  PARTNERSHIP_AGREEMENT = 'partnership_agreement',
  TRUST_AGREEMENT = 'trust_agreement',
  AMENDMENT = 'amendment',
  CERTIFICATE_OF_GOOD_STANDING = 'certificate_of_good_standing',
  CERTIFICATE_OF_AUTHORITY = 'certificate_of_authority',
  ANNUAL_REPORT = 'annual_report',
  BOARD_RESOLUTION = 'board_resolution',
  MEMBER_RESOLUTION = 'member_resolution',
  SHAREHOLDER_RESOLUTION = 'shareholder_resolution',
  STOCK_CERTIFICATE = 'stock_certificate',
  MEMBERSHIP_CERTIFICATE = 'membership_certificate',
  MERGER_AGREEMENT = 'merger_agreement',
  DISSOLUTION_CERTIFICATE = 'dissolution_certificate',
  TAX_ELECTION = 'tax_election',
  EIN_CONFIRMATION = 'ein_confirmation',
  FOREIGN_QUALIFICATION = 'foreign_qualification',
  REGISTERED_AGENT_APPOINTMENT = 'registered_agent_appointment',
  CONSENT_IN_LIEU = 'consent_in_lieu',
  WRITTEN_CONSENT = 'written_consent',
  MEETING_MINUTES = 'meeting_minutes',
  OTHER = 'other',
}

enum DocumentAccessLevel {
  /** Visible to all consortium admins */
  CONSORTIUM = 'consortium',
  /** Visible only to the venture's team */
  VENTURE = 'venture',
  /** Visible only to entity-level admins */
  ENTITY = 'entity',
  /** Restricted — requires explicit grant */
  RESTRICTED = 'restricted',
  /** Legal-privileged — only legal team */
  PRIVILEGED = 'privileged',
}

interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  storageRef: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  changeDescription: string | null;
  uploadedBy: string;
  uploadedAt: Date;
}
```

### Officer & Director

```typescript
/**
 * Officers, directors, and board members of a legal entity.
 * Tracks appointments, terms, compensation, and responsibilities.
 */
interface Officer {
  id: string;

  /** Entity this officer serves */
  entityId: string;

  /** Individual profile ID */
  individualId: string;

  /** Officer's full legal name */
  fullName: string;

  /** Role/title */
  role: OfficerRole;

  /** Custom title if role is OTHER */
  customTitle: string | null;

  /** Whether this person is also a board/managing member */
  isBoardMember: boolean;

  /** Date appointed to this role */
  appointmentDate: Date;

  /** Date term ends (null = indefinite/at-will) */
  termEndDate: Date | null;

  /** Date of resignation/removal, if applicable */
  separationDate: Date | null;

  /** How the officer was separated */
  separationReason: 'resigned' | 'removed' | 'term_expired' | 'deceased' | null;

  /** Annual compensation in cents (base salary or director fees) */
  annualCompensationCents: number | null;

  /** Equity compensation (stock options, membership units, etc.) */
  equityCompensation: EquityCompensation | null;

  /** Whether this officer is an authorized signatory for the entity */
  isAuthorizedSignatory: boolean;

  /** Signing authority limits (in cents) — null means unlimited */
  signingAuthorityLimitCents: number | null;

  /** Specific responsibilities / committee assignments */
  responsibilities: string[];

  /** Contact email for this role */
  contactEmail: string | null;

  /** Status */
  status: 'active' | 'inactive' | 'pending';

  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

enum OfficerRole {
  CEO = 'ceo',
  CFO = 'cfo',
  COO = 'coo',
  CTO = 'cto',
  CLO = 'clo',
  PRESIDENT = 'president',
  VICE_PRESIDENT = 'vice_president',
  SECRETARY = 'secretary',
  TREASURER = 'treasurer',
  ASSISTANT_SECRETARY = 'assistant_secretary',
  ASSISTANT_TREASURER = 'assistant_treasurer',
  DIRECTOR = 'director',
  MANAGING_MEMBER = 'managing_member',
  GENERAL_PARTNER = 'general_partner',
  LIMITED_PARTNER = 'limited_partner',
  TRUSTEE = 'trustee',
  REGISTERED_AGENT_CONTACT = 'registered_agent_contact',
  OTHER = 'other',
}

interface EquityCompensation {
  type: 'stock_options' | 'restricted_stock' | 'membership_units' | 'partnership_interest' | 'phantom_equity';
  units: number;
  vestingSchedule: string | null;
  grantDate: Date;
  expirationDate: Date | null;
  strikePrice: number | null;
}

/**
 * Board member is a specialized officer view — includes committee assignments.
 */
interface BoardMember extends Officer {
  /** Board committees this member sits on */
  committees: BoardCommittee[];

  /** Whether this is an independent director */
  isIndependent: boolean;

  /** Director classification */
  directorClass: 'A' | 'B' | 'C' | null;
}

interface BoardCommittee {
  name: string;
  role: 'chair' | 'member';
  appointedDate: Date;
}

/** Alias for backward compatibility */
type Director = BoardMember;
```

### ComplianceStatus

```typescript
/**
 * Tracks compliance and good-standing status for each entity across
 * all jurisdictions where it is registered or qualified to do business.
 */
interface ComplianceStatus {
  id: string;

  /** Entity being tracked */
  entityId: string;

  /** Jurisdiction (state code or country) */
  jurisdiction: string;

  /** Whether this is the formation jurisdiction or a foreign qualification */
  jurisdictionType: 'formation' | 'foreign_qualification';

  /** Current good standing status */
  goodStanding: ComplianceState;

  /** Last date good standing was confirmed */
  lastConfirmedDate: Date | null;

  /** State-issued good standing certificate reference */
  goodStandingCertRef: string | null;

  /** Next annual report / filing due date */
  nextFilingDueDate: Date | null;

  /** Filing type (annual report, franchise tax, etc.) */
  nextFilingType: string | null;

  /** Estimated filing fee in cents */
  estimatedFeeCents: number | null;

  /** Whether auto-filing is enabled */
  autoFileEnabled: boolean;

  /** Last filing date */
  lastFiledDate: Date | null;

  /** Last filing confirmation number */
  lastFilingConfirmation: string | null;

  /** Any penalties or late fees outstanding (in cents) */
  outstandingPenaltiesCents: number;

  /** Notes about compliance issues */
  notes: string | null;

  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

enum ComplianceState {
  GOOD_STANDING = 'good_standing',
  DELINQUENT = 'delinquent',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
  PENDING_REVIEW = 'pending_review',
  NOT_YET_FILED = 'not_yet_filed',
  EXEMPT = 'exempt',
  ADMINISTRATIVELY_DISSOLVED = 'administratively_dissolved',
}

/**
 * Individual compliance filing record — one per filing event.
 */
interface ComplianceFiling {
  id: string;
  entityId: string;
  jurisdiction: string;

  /** Type of filing */
  filingType: FilingType;

  /** Filing period (e.g., "2025", "2025-Q1") */
  filingPeriod: string;

  /** Date the filing was submitted */
  filedDate: Date | null;

  /** Confirmation number from the jurisdiction */
  confirmationNumber: string | null;

  /** Filing fee paid in cents */
  feePaidCents: number | null;

  /** Filing method */
  filingMethod: 'online' | 'mail' | 'agent_service' | 'in_person';

  /** Status of this specific filing */
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'overdue';

  /** Rejection reason, if applicable */
  rejectionReason: string | null;

  /** Reference to uploaded filing document */
  documentRef: string | null;

  /** Due date for this filing */
  dueDate: Date;

  /** Who prepared the filing */
  preparedBy: string | null;

  /** Who approved the filing */
  approvedBy: string | null;

  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

enum FilingType {
  ANNUAL_REPORT = 'annual_report',
  BIENNIAL_REPORT = 'biennial_report',
  FRANCHISE_TAX = 'franchise_tax',
  STATEMENT_OF_INFORMATION = 'statement_of_information',
  BENEFICIAL_OWNERSHIP = 'beneficial_ownership',
  FOREIGN_QUALIFICATION = 'foreign_qualification',
  AMENDMENT = 'amendment',
  NAME_RESERVATION = 'name_reservation',
  REINSTATEMENT = 'reinstatement',
  WITHDRAWAL = 'withdrawal',
}
```

### EntityService

```typescript
/**
 * Primary service for legal entity CRUD operations.
 * All methods enforce RLS via the tenant context and validate
 * permissions before mutating state.
 */
interface EntityService {
  // ─── CRUD ────────────────────────────────────────────────────

  /**
   * Create a new legal entity in the registry.
   * Validates entity code uniqueness, jurisdiction requirements,
   * and triggers formation lifecycle event.
   */
  create(input: CreateEntityInput): Promise<LegalEntity>;

  /**
   * Retrieve a single entity by ID.
   * Returns null if not found or not accessible by current tenant.
   */
  getById(id: string): Promise<LegalEntity | null>;

  /**
   * Retrieve a single entity by its MCV entity code.
   */
  getByCode(entityCode: string): Promise<LegalEntity | null>;

  /**
   * Update an existing entity's mutable fields.
   * Immutable fields (formationJurisdiction, formationDate, entityCode)
   * can only be changed through lifecycle amendment events.
   */
  update(id: string, input: UpdateEntityInput): Promise<LegalEntity>;

  /**
   * Soft-delete an entity (sets status to 'dissolved').
   * Requires all child entities to be dissolved first.
   * Actual deletion is handled by lifecycle dissolution process.
   */
  delete(id: string): Promise<void>;

  // ─── Query ───────────────────────────────────────────────────

  /**
   * List entities with filtering, sorting, and pagination.
   */
  list(filters: EntityFilters): Promise<PaginatedResult<LegalEntity>>;

  /**
   * Full-text search across entity names, codes, and descriptions.
   */
  search(query: string, options?: SearchOptions): Promise<LegalEntity[]>;

  /**
   * Get all entities belonging to a specific venture.
   */
  listByVenture(ventureId: string): Promise<LegalEntity[]>;

  /**
   * Get all entities in a specific jurisdiction.
   */
  listByJurisdiction(jurisdiction: string): Promise<LegalEntity[]>;

  /**
   * Get entity count grouped by type, status, or jurisdiction.
   */
  getStatistics(groupBy: 'type' | 'status' | 'jurisdiction' | 'venture'): Promise<EntityStatistic[]>;

  // ─── Validation ──────────────────────────────────────────────

  /**
   * Check if an entity code is available.
   */
  isCodeAvailable(entityCode: string): Promise<boolean>;

  /**
   * Validate entity data against jurisdiction-specific requirements.
   */
  validateForJurisdiction(
    input: CreateEntityInput,
    jurisdiction: string,
  ): Promise<ValidationResult>;
}

interface CreateEntityInput {
  entityCode: string;
  legalName: string;
  tradeName?: string;
  entityType: EntityType;
  taxClassification: TaxClassification;
  formationJurisdiction: string;
  formationDate: Date;
  fiscalYearEnd: string;
  ventureId: string;
  purpose?: string;
  principalAddress: Address;
  mailingAddress?: Address;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

interface UpdateEntityInput {
  legalName?: string;
  tradeName?: string | null;
  taxClassification?: TaxClassification;
  fiscalYearEnd?: string;
  status?: EntityStatus;
  purpose?: string | null;
  principalAddress?: Address;
  mailingAddress?: Address | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
}

interface EntityFilters {
  ventureId?: string;
  entityType?: EntityType | EntityType[];
  status?: EntityStatus | EntityStatus[];
  jurisdiction?: string | string[];
  taxClassification?: TaxClassification;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: 'legalName' | 'entityCode' | 'formationDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

---

## Database Schemas

All tables use Supabase PostgreSQL with Drizzle ORM. Row-level security policies enforce tenant isolation. Timestamps use `timestamptz`. All monetary values are stored in cents (integer) to avoid floating-point issues.

### legal_entities

```typescript
import { pgTable, uuid, varchar, text, timestamp, pgEnum, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const entityTypeEnum = pgEnum('entity_type', [
  'c_corp', 's_corp', 'llc_single_member', 'llc_multi_member',
  'limited_partnership', 'general_partnership', 'limited_liability_partnership',
  'sole_proprietorship', 'statutory_trust', 'common_law_trust',
  'special_purpose_vehicle', 'nonprofit_corporation', 'series_llc',
  'professional_corporation',
]);

export const entityStatusEnum = pgEnum('entity_status', [
  'active', 'inactive', 'suspended', 'dissolved', 'merged', 'converted',
  'pending_formation', 'pending_dissolution', 'administrative_hold', 'revoked',
]);

export const taxClassificationEnum = pgEnum('tax_classification', [
  'c_corporation', 's_corporation', 'partnership', 'disregarded_entity',
  'trust', 'tax_exempt', 'reit', 'regulated_investment_company',
]);

export const legalEntities = pgTable('legal_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityCode: varchar('entity_code', { length: 50 }).notNull(),
  legalName: varchar('legal_name', { length: 500 }).notNull(),
  tradeName: varchar('trade_name', { length: 500 }),
  entityType: entityTypeEnum('entity_type').notNull(),
  taxClassification: taxClassificationEnum('tax_classification').notNull(),
  formationJurisdiction: varchar('formation_jurisdiction', { length: 10 }).notNull(),
  formationDate: timestamp('formation_date', { mode: 'date' }).notNull(),
  dissolutionDate: timestamp('dissolution_date', { mode: 'date' }),
  status: entityStatusEnum('status').notNull().default('pending_formation'),
  fiscalYearEnd: varchar('fiscal_year_end', { length: 5 }).notNull().default('12-31'),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  purpose: text('purpose'),
  principalAddress: jsonb('principal_address').notNull().$type<Address>(),
  mailingAddress: jsonb('mailing_address').$type<Address>(),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  notes: text('notes'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
}, (table) => ({
  entityCodeIdx: uniqueIndex('legal_entities_entity_code_idx').on(table.entityCode),
  ventureIdx: index('legal_entities_venture_id_idx').on(table.ventureId),
  statusIdx: index('legal_entities_status_idx').on(table.status),
  jurisdictionIdx: index('legal_entities_jurisdiction_idx').on(table.formationJurisdiction),
  tenantIdx: index('legal_entities_tenant_id_idx').on(table.tenantId),
  typeStatusIdx: index('legal_entities_type_status_idx').on(table.entityType, table.status),
  legalNameSearchIdx: index('legal_entities_legal_name_search_idx')
    .using('gin', sql`to_tsvector('english', ${table.legalName})`),
}));
```

### entity_hierarchy

```typescript
export const hierarchyRelationEnum = pgEnum('hierarchy_relation_type', [
  'subsidiary', 'affiliate', 'joint_venture', 'branch', 'division', 'series', 'fund',
]);

export const entityHierarchy = pgTable('entity_hierarchy', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentEntityId: uuid('parent_entity_id').notNull().references(() => legalEntities.id),
  childEntityId: uuid('child_entity_id').notNull().references(() => legalEntities.id),
  relationshipType: hierarchyRelationEnum('relationship_type').notNull().default('subsidiary'),
  ownershipPercentage: numeric('ownership_percentage', { precision: 7, scale: 4 }).notNull(),
  isPrimary: boolean('is_primary').notNull().default(true),
  effectiveDate: timestamp('effective_date', { mode: 'date' }).notNull(),
  endDate: timestamp('end_date', { mode: 'date' }),
  notes: text('notes'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  parentIdx: index('entity_hierarchy_parent_idx').on(table.parentEntityId),
  childIdx: index('entity_hierarchy_child_idx').on(table.childEntityId),
  uniqueRelationship: uniqueIndex('entity_hierarchy_unique_rel_idx')
    .on(table.parentEntityId, table.childEntityId, table.effectiveDate),
  tenantIdx: index('entity_hierarchy_tenant_idx').on(table.tenantId),
}));
```

### ownership_records

```typescript
export const ownershipTypeEnum = pgEnum('ownership_type', [
  'entity', 'individual', 'trust', 'estate', 'foreign_entity',
]);

export const acquisitionMethodEnum = pgEnum('acquisition_method', [
  'formation', 'purchase', 'transfer', 'gift', 'inheritance',
  'conversion', 'stock_split', 'merger',
]);

export const ownershipRecords = pgTable('ownership_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull().references(() => legalEntities.id),
  ownerType: ownershipTypeEnum('owner_type').notNull(),
  ownerEntityId: uuid('owner_entity_id').references(() => legalEntities.id),
  ownerIndividualId: uuid('owner_individual_id'),
  ownerName: varchar('owner_name', { length: 500 }).notNull(),
  ownershipClass: varchar('ownership_class', { length: 100 }).notNull().default('Common'),
  percentageOwned: numeric('percentage_owned', { precision: 7, scale: 4 }).notNull(),
  unitsHeld: numeric('units_held', { precision: 18, scale: 4 }),
  totalUnitsOutstanding: numeric('total_units_outstanding', { precision: 18, scale: 4 }),
  capitalContribution: bigint('capital_contribution', { mode: 'number' }),
  votingRights: jsonb('voting_rights').notNull().$type<VotingRights>(),
  isBeneficialOwner: boolean('is_beneficial_owner').notNull().default(false),
  acquisitionDate: timestamp('acquisition_date', { mode: 'date' }).notNull(),
  dispositionDate: timestamp('disposition_date', { mode: 'date' }),
  acquisitionMethod: acquisitionMethodEnum('acquisition_method').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  entityIdx: index('ownership_records_entity_idx').on(table.entityId),
  ownerEntityIdx: index('ownership_records_owner_entity_idx').on(table.ownerEntityId),
  ownerIndividualIdx: index('ownership_records_owner_individual_idx').on(table.ownerIndividualId),
  tenantIdx: index('ownership_records_tenant_idx').on(table.tenantId),
  classIdx: index('ownership_records_class_idx').on(table.entityId, table.ownershipClass),
}));
```

### registered_agents

```typescript
export const registeredAgents = pgTable('registered_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull().references(() => legalEntities.id),
  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull(),
  agentName: varchar('agent_name', { length: 500 }).notNull(),
  agentType: varchar('agent_type', { length: 20 }).notNull().default('commercial'),
  agentAddress: jsonb('agent_address').notNull().$type<Address>(),
  agentEmail: varchar('agent_email', { length: 255 }),
  agentPhone: varchar('agent_phone', { length: 50 }),
  accountNumber: varchar('account_number', { length: 100 }),
  annualFeeCents: integer('annual_fee_cents'),
  effectiveDate: timestamp('effective_date', { mode: 'date' }).notNull(),
  renewalDate: timestamp('renewal_date', { mode: 'date' }).notNull(),
  autoRenew: boolean('auto_renew').notNull().default(true),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  notes: text('notes'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  entityIdx: index('registered_agents_entity_idx').on(table.entityId),
  jurisdictionIdx: index('registered_agents_jurisdiction_idx').on(table.jurisdiction),
  renewalIdx: index('registered_agents_renewal_idx').on(table.renewalDate),
  tenantIdx: index('registered_agents_tenant_idx').on(table.tenantId),
  entityJurisdictionIdx: uniqueIndex('registered_agents_entity_jurisdiction_idx')
    .on(table.entityId, table.jurisdiction)
    .where(sql`status = 'active'`),
}));
```

### corporate_documents

```typescript
export const documentCategoryEnum = pgEnum('document_category', [
  'articles_of_incorporation', 'certificate_of_formation', 'articles_of_organization',
  'bylaws', 'operating_agreement', 'partnership_agreement', 'trust_agreement',
  'amendment', 'certificate_of_good_standing', 'certificate_of_authority',
  'annual_report', 'board_resolution', 'member_resolution', 'shareholder_resolution',
  'stock_certificate', 'membership_certificate', 'merger_agreement',
  'dissolution_certificate', 'tax_election', 'ein_confirmation',
  'foreign_qualification', 'registered_agent_appointment',
  'consent_in_lieu', 'written_consent', 'meeting_minutes', 'other',
]);

export const documentAccessEnum = pgEnum('document_access_level', [
  'consortium', 'venture', 'entity', 'restricted', 'privileged',
]);

export const corporateDocuments = pgTable('corporate_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull().references(() => legalEntities.id),
  category: documentCategoryEnum('category').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  storageRef: varchar('storage_ref', { length: 1000 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  currentVersion: integer('current_version').notNull().default(1),
  isCurrent: boolean('is_current').notNull().default(true),
  effectiveDate: timestamp('effective_date', { mode: 'date' }),
  expirationDate: timestamp('expiration_date', { mode: 'date' }),
  executedBy: varchar('executed_by', { length: 500 }),
  isNotarized: boolean('is_notarized').notNull().default(false),
  filingReference: varchar('filing_reference', { length: 200 }),
  accessLevel: documentAccessEnum('access_level').notNull().default('venture'),
  tags: jsonb('tags').notNull().default([]).$type<string[]>(),
  sha256Hash: varchar('sha256_hash', { length: 64 }).notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  uploadedBy: uuid('uploaded_by').notNull(),
}, (table) => ({
  entityIdx: index('corporate_documents_entity_idx').on(table.entityId),
  categoryIdx: index('corporate_documents_category_idx').on(table.category),
  entityCategoryIdx: index('corporate_documents_entity_category_idx')
    .on(table.entityId, table.category),
  currentIdx: index('corporate_documents_current_idx')
    .on(table.entityId, table.category, table.isCurrent),
  accessIdx: index('corporate_documents_access_idx').on(table.accessLevel),
  tenantIdx: index('corporate_documents_tenant_idx').on(table.tenantId),
  tagsIdx: index('corporate_documents_tags_idx').using('gin', table.tags),
}));

export const documentVersions = pgTable('document_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => corporateDocuments.id),
  versionNumber: integer('version_number').notNull(),
  storageRef: varchar('storage_ref', { length: 1000 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  sha256Hash: varchar('sha256_hash', { length: 64 }).notNull(),
  changeDescription: text('change_description'),
  uploadedBy: uuid('uploaded_by').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  documentIdx: index('document_versions_document_idx').on(table.documentId),
  versionIdx: uniqueIndex('document_versions_version_idx')
    .on(table.documentId, table.versionNumber),
}));
```

### entity_officers

```typescript
export const officerRoleEnum = pgEnum('officer_role', [
  'ceo', 'cfo', 'coo', 'cto', 'clo', 'president', 'vice_president',
  'secretary', 'treasurer', 'assistant_secretary', 'assistant_treasurer',
  'director', 'managing_member', 'general_partner', 'limited_partner',
  'trustee', 'registered_agent_contact', 'other',
]);

export const entityOfficers = pgTable('entity_officers', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull().references(() => legalEntities.id),
  individualId: uuid('individual_id').notNull(),
  fullName: varchar('full_name', { length: 500 }).notNull(),
  role: officerRoleEnum('role').notNull(),
  customTitle: varchar('custom_title', { length: 200 }),
  isBoardMember: boolean('is_board_member').notNull().default(false),
  appointmentDate: timestamp('appointment_date', { mode: 'date' }).notNull(),
  termEndDate: timestamp('term_end_date', { mode: 'date' }),
  separationDate: timestamp('separation_date', { mode: 'date' }),
  separationReason: varchar('separation_reason', { length: 20 }),
  annualCompensationCents: bigint('annual_compensation_cents', { mode: 'number' }),
  equityCompensation: jsonb('equity_compensation').$type<EquityCompensation>(),
  isAuthorizedSignatory: boolean('is_authorized_signatory').notNull().default(false),
  signingAuthorityLimitCents: bigint('signing_authority_limit_cents', { mode: 'number' }),
  responsibilities: jsonb('responsibilities').notNull().default([]).$type<string[]>(),
  contactEmail: varchar('contact_email', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  entityIdx: index('entity_officers_entity_idx').on(table.entityId),
  individualIdx: index('entity_officers_individual_idx').on(table.individualId),
  roleIdx: index('entity_officers_role_idx').on(table.role),
  statusIdx: index('entity_officers_status_idx').on(table.status),
  entityRoleIdx: index('entity_officers_entity_role_idx').on(table.entityId, table.role),
  tenantIdx: index('entity_officers_tenant_idx').on(table.tenantId),
  boardIdx: index('entity_officers_board_idx')
    .on(table.entityId, table.isBoardMember)
    .where(sql`is_board_member = true AND status = 'active'`),
}));
```

### compliance_filings

```typescript
export const complianceStateEnum = pgEnum('compliance_state', [
  'good_standing', 'delinquent', 'suspended', 'revoked',
  'pending_review', 'not_yet_filed', 'exempt', 'administratively_dissolved',
]);

export const filingTypeEnum = pgEnum('filing_type', [
  'annual_report', 'biennial_report', 'franchise_tax', 'statement_of_information',
  'beneficial_ownership', 'foreign_qualification', 'amendment',
  'name_reservation', 'reinstatement', 'withdrawal',
]);

export const complianceStatus = pgTable('compliance_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull().references(() => legalEntities.id),
  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull(),
  jurisdictionType: varchar('jurisdiction_type', { length: 30 }).notNull(),
  goodStanding: complianceStateEnum('good_standing').notNull().default('not_yet_filed'),
  lastConfirmedDate: timestamp('last_confirmed_date', { mode: 'date' }),
  goodStandingCertRef: varchar('good_standing_cert_ref', { length: 500 }),
  nextFilingDueDate: timestamp('next_filing_due_date', { mode: 'date' }),
  nextFilingType: varchar('next_filing_type', { length: 50 }),
  estimatedFeeCents: integer('estimated_fee_cents'),
  autoFileEnabled: boolean('auto_file_enabled').notNull().default(false),
  lastFiledDate: timestamp('last_filed_date', { mode: 'date' }),
  lastFilingConfirmation: varchar('last_filing_confirmation', { length: 200 }),
  outstandingPenaltiesCents: integer('outstanding_penalties_cents').notNull().default(0),
  notes: text('notes'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  entityIdx: index('compliance_status_entity_idx').on(table.entityId),
  jurisdictionIdx: index('compliance_status_jurisdiction_idx').on(table.jurisdiction),
  standingIdx: index('compliance_status_standing_idx').on(table.goodStanding),
  dueDateIdx: index('compliance_status_due_date_idx').on(table.nextFilingDueDate),
  tenantIdx: index('compliance_status_tenant_idx').on(table.tenantId),
  entityJurisdictionIdx: uniqueIndex('compliance_status_entity_jurisdiction_idx')
    .on(table.entityId, table.jurisdiction),
}));

export const complianceFilings = pgTable('compliance_filings', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull().references(() => legalEntities.id),
  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull(),
  filingType: filingTypeEnum('filing_type').notNull(),
  filingPeriod: varchar('filing_period', { length: 20 }).notNull(),
  filedDate: timestamp('filed_date', { mode: 'date' }),
  confirmationNumber: varchar('confirmation_number', { length: 200 }),
  feePaidCents: integer('fee_paid_cents'),
  filingMethod: varchar('filing_method', { length: 20 }).notNull().default('agent_service'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  documentRef: varchar('document_ref', { length: 500 }),
  dueDate: timestamp('due_date', { mode: 'date' }).notNull(),
  preparedBy: uuid('prepared_by'),
  approvedBy: uuid('approved_by'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  entityIdx: index('compliance_filings_entity_idx').on(table.entityId),
  jurisdictionIdx: index('compliance_filings_jurisdiction_idx').on(table.jurisdiction),
  statusIdx: index('compliance_filings_status_idx').on(table.status),
  dueDateIdx: index('compliance_filings_due_date_idx').on(table.dueDate),
  periodIdx: index('compliance_filings_period_idx').on(table.entityId, table.filingPeriod),
  tenantIdx: index('compliance_filings_tenant_idx').on(table.tenantId),
}));
```

### tax_identifiers

```typescript
/**
 * Encrypted tax identifier storage.
 * EIN and state tax IDs are AES-256-GCM encrypted at the application layer
 * before being written to the database. The encryption key is derived from
 * a KMS-managed master key via HKDF.
 */
export const taxIdentifiers = pgTable('tax_identifiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull().references(() => legalEntities.id),
  identifierType: varchar('identifier_type', { length: 50 }).notNull(),  // 'ein', 'state_tax_id', 'itin', 'foreign_tin'
  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull(),       // 'US' for EIN, state code for state IDs
  encryptedValue: text('encrypted_value').notNull(),                     // AES-256-GCM ciphertext (base64)
  encryptionKeyId: varchar('encryption_key_id', { length: 100 }).notNull(), // KMS key version reference
  maskedValue: varchar('masked_value', { length: 20 }).notNull(),        // e.g., "XX-XXX4567"
  issuedDate: timestamp('issued_date', { mode: 'date' }),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, revoked, replaced
  notes: text('notes'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  lastAccessedBy: uuid('last_accessed_by'),
}, (table) => ({
  entityIdx: index('tax_identifiers_entity_idx').on(table.entityId),
  typeIdx: index('tax_identifiers_type_idx').on(table.identifierType),
  entityTypeIdx: uniqueIndex('tax_identifiers_entity_type_jurisdiction_idx')
    .on(table.entityId, table.identifierType, table.jurisdiction)
    .where(sql`status = 'active'`),
  tenantIdx: index('tax_identifiers_tenant_idx').on(table.tenantId),
}));
```

### inter_entity_transactions

```typescript
export const transactionTypeEnum = pgEnum('inter_entity_transaction_type', [
  'transfer_pricing', 'inter_company_loan', 'equity_transfer',
  'management_fee', 'royalty', 'dividend', 'capital_contribution',
  'cost_sharing', 'service_fee', 'rent',
]);

export const interEntityTransactions = pgTable('inter_entity_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Entity paying / transferring */
  fromEntityId: uuid('from_entity_id').notNull().references(() => legalEntities.id),

  /** Entity receiving */
  toEntityId: uuid('to_entity_id').notNull().references(() => legalEntities.id),

  transactionType: transactionTypeEnum('transaction_type').notNull(),

  /** Human-readable description */
  description: text('description').notNull(),

  /** Transaction amount in cents */
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),

  /** Currency code (ISO 4217) */
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),

  /** Transaction date */
  transactionDate: timestamp('transaction_date', { mode: 'date' }).notNull(),

  /** Recurring frequency, if applicable */
  frequency: varchar('frequency', { length: 20 }),  // 'monthly', 'quarterly', 'annual', 'one_time'

  /** For loans: interest rate (annual, basis points) */
  interestRateBps: integer('interest_rate_bps'),

  /** For loans: maturity date */
  maturityDate: timestamp('maturity_date', { mode: 'date' }),

  /** For loans: outstanding principal in cents */
  outstandingPrincipalCents: bigint('outstanding_principal_cents', { mode: 'number' }),

  /** For equity transfers: number of units transferred */
  unitsTransferred: numeric('units_transferred', { precision: 18, scale: 4 }),

  /** For equity transfers: ownership class */
  equityClass: varchar('equity_class', { length: 100 }),

  /** Arm's-length validation status */
  armsLengthValidated: boolean('arms_length_validated').notNull().default(false),

  /** Transfer pricing documentation reference */
  tpDocumentRef: varchar('tp_document_ref', { length: 500 }),

  /** Approval status */
  approvalStatus: varchar('approval_status', { length: 20 }).notNull().default('pending'),

  /** Who approved this transaction */
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),

  /** Reference to supporting document */
  supportingDocRef: varchar('supporting_doc_ref', { length: 500 }),

  /** External reference (invoice number, loan agreement number, etc.) */
  externalReference: varchar('external_reference', { length: 200 }),

  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  fromEntityIdx: index('inter_entity_tx_from_idx').on(table.fromEntityId),
  toEntityIdx: index('inter_entity_tx_to_idx').on(table.toEntityId),
  typeIdx: index('inter_entity_tx_type_idx').on(table.transactionType),
  dateIdx: index('inter_entity_tx_date_idx').on(table.transactionDate),
  approvalIdx: index('inter_entity_tx_approval_idx').on(table.approvalStatus),
  tenantIdx: index('inter_entity_tx_tenant_idx').on(table.tenantId),
  fromToIdx: index('inter_entity_tx_from_to_idx').on(table.fromEntityId, table.toEntityId),
}));
```

### Row-Level Security Policies

```sql
-- All tables follow the same RLS pattern for tenant isolation

-- Enable RLS on all entity tables
ALTER TABLE legal_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inter_entity_transactions ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy (example for legal_entities)
CREATE POLICY "tenant_isolation" ON legal_entities
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Venture-level access for entity-scoped users
CREATE POLICY "venture_access" ON legal_entities
  USING (
    venture_id IN (
      SELECT venture_id FROM user_venture_access
      WHERE user_id = current_setting('app.user_id')::uuid
    )
  );

-- Consortium admin has full read access across all tenants
CREATE POLICY "consortium_admin_read" ON legal_entities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = current_setting('app.user_id')::uuid
      AND role = 'consortium_admin'
    )
  );

-- Restricted access for tax_identifiers (additional security layer)
CREATE POLICY "tax_id_restricted" ON tax_identifiers
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = current_setting('app.user_id')::uuid
      AND permission = 'entity.tax_id.read'
    )
  );

-- Document access control (layered on top of RLS)
CREATE POLICY "document_access" ON corporate_documents
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND (
      -- Consortium-level docs visible to all consortium users
      (access_level = 'consortium')
      -- Venture-level docs visible to venture team
      OR (access_level = 'venture' AND entity_id IN (
        SELECT id FROM legal_entities WHERE venture_id IN (
          SELECT venture_id FROM user_venture_access
          WHERE user_id = current_setting('app.user_id')::uuid
        )
      ))
      -- Entity-level docs visible to entity admins
      OR (access_level = 'entity' AND EXISTS (
        SELECT 1 FROM entity_access
        WHERE entity_id = corporate_documents.entity_id
        AND user_id = current_setting('app.user_id')::uuid
      ))
      -- Restricted and privileged require explicit grants
      OR (access_level IN ('restricted', 'privileged') AND EXISTS (
        SELECT 1 FROM document_access_grants
        WHERE document_id = corporate_documents.id
        AND user_id = current_setting('app.user_id')::uuid
      ))
    )
  );
```

---

## Code Examples

### Example 1: Create a Legal Entity

```typescript
import { EntityService } from '@mcv/portfolio/entities';
import { EntityType, TaxClassification } from '@mcv/portfolio/entities';

const entityService = new EntityService(db, ctx);

// Create a new Delaware LLC for a technology venture
const newEntity = await entityService.create({
  entityCode: 'MCV-TECH-GAMMA-001',
  legalName: 'Gamma Technologies LLC',
  tradeName: 'GammaTech',
  entityType: EntityType.LLC_MULTI,
  taxClassification: TaxClassification.PARTNERSHIP,
  formationJurisdiction: 'DE',
  formationDate: new Date('2025-03-15'),
  fiscalYearEnd: '12-31',
  ventureId: 'venture-gamma-uuid',
  purpose: 'Development and licensing of enterprise software platforms',
  principalAddress: {
    line1: '1209 Orange Street',
    line2: 'Suite 300',
    city: 'Wilmington',
    state: 'DE',
    postalCode: '19801',
    country: 'US',
  },
  contactEmail: 'legal@gammatech.mcv.com',
  contactPhone: '+1-302-555-0100',
});

console.log(newEntity);
// {
//   id: 'a1b2c3d4-...',
//   entityCode: 'MCV-TECH-GAMMA-001',
//   legalName: 'Gamma Technologies LLC',
//   status: 'pending_formation',
//   formationJurisdiction: 'DE',
//   ...
// }

// After state filing is confirmed, update status
await entityService.update(newEntity.id, {
  status: EntityStatus.ACTIVE,
});
```

### Example 2: Build and Navigate Entity Hierarchy

```typescript
import { HierarchyService } from '@mcv/portfolio/entities';
import { buildHierarchyTree, generateOrgChart } from '@mcv/portfolio/entities';

const hierarchyService = new HierarchyService(db, ctx);

// Establish parent-child relationship: MCV Holdings → Tech Holdings → Gamma Tech
await hierarchyService.addChild({
  parentEntityId: 'mcv-holdings-uuid',
  childEntityId: 'tech-holdings-uuid',
  relationshipType: 'subsidiary',
  ownershipPercentage: 100.0,
  isPrimary: true,
  effectiveDate: new Date('2020-01-01'),
});

await hierarchyService.addChild({
  parentEntityId: 'tech-holdings-uuid',
  childEntityId: 'gamma-tech-uuid',
  relationshipType: 'subsidiary',
  ownershipPercentage: 85.0,
  isPrimary: true,
  effectiveDate: new Date('2025-03-15'),
});

// Build the full hierarchy tree from the root
const tree = await hierarchyService.buildTree('mcv-holdings-uuid');

console.log(`Total entities: ${tree.totalEntities}`);
console.log(`Max depth: ${tree.maxDepth}`);

// Traverse the tree
function walkTree(node: HierarchyNode, indent = 0) {
  const prefix = '  '.repeat(indent);
  const ownership = node.relationship
    ? ` (${node.relationship.ownershipPercentage}% owned, ${node.totalOwnershipFromRoot}% from root)`
    : ' (ROOT)';
  console.log(`${prefix}├── ${node.entity.legalName}${ownership}`);
  for (const child of node.children) {
    walkTree(child, indent + 1);
  }
}

walkTree(tree.root);
// ├── MCV Global Holdings, Inc. (ROOT)
//   ├── MCV Technology Holdings LLC (100.0000% owned, 100.0000% from root)
//     ├── Gamma Technologies LLC (85.0000% owned, 85.0000% from root)

// Flatten the tree for reporting
const flatList = await hierarchyService.flatten('mcv-holdings-uuid');
// Returns all entities in the tree as a flat array with depth info

// Find all ancestors of a given entity
const ancestors = await hierarchyService.getAncestors('gamma-tech-uuid');
// Returns: [Tech Holdings, MCV Holdings]

// Detect if adding a relationship would create a cycle
const wouldCycle = await hierarchyService.detectCycle(
  'gamma-tech-uuid',    // proposed parent
  'mcv-holdings-uuid',  // proposed child
);
// Returns: true (would create circular reference)

// Generate an ASCII org chart
const orgChart = generateOrgChart(tree);
console.log(orgChart);
```

### Example 3: Track Ownership and Beneficial Owners

```typescript
import { OwnershipService } from '@mcv/portfolio/entities';
import { calculateOwnershipChain } from '@mcv/portfolio/entities';

const ownershipService = new OwnershipService(db, ctx);

// Record entity-to-entity ownership
await ownershipService.recordOwnership({
  entityId: 'gamma-tech-uuid',
  ownerType: 'entity',
  ownerEntityId: 'tech-holdings-uuid',
  ownerName: 'MCV Technology Holdings LLC',
  ownershipClass: 'Class A Units',
  percentageOwned: 85.0,
  unitsHeld: 8500,
  totalUnitsOutstanding: 10000,
  capitalContribution: 850_000_00,  // $850,000.00 in cents
  votingRights: {
    votesPerUnit: 1,
    hasVotingRights: true,
    specialProvisions: ['Super-majority required for asset sales over $1M'],
    boardElectionRights: true,
    vetoRights: [],
  },
  isBeneficialOwner: false,
  acquisitionDate: new Date('2025-03-15'),
  acquisitionMethod: 'formation',
});

// Record individual minority owner
await ownershipService.recordOwnership({
  entityId: 'gamma-tech-uuid',
  ownerType: 'individual',
  ownerIndividualId: 'founder-john-uuid',
  ownerName: 'John Smith',
  ownershipClass: 'Class B Units',
  percentageOwned: 15.0,
  unitsHeld: 1500,
  totalUnitsOutstanding: 10000,
  capitalContribution: 150_000_00,  // $150,000.00 in cents
  votingRights: {
    votesPerUnit: 1,
    hasVotingRights: true,
    specialProvisions: [],
    boardElectionRights: false,
    vetoRights: [],
  },
  isBeneficialOwner: true,
  acquisitionDate: new Date('2025-03-15'),
  acquisitionMethod: 'formation',
});

// Calculate cascading ownership from MCV Holdings through to Gamma Tech
const ownershipChain = await calculateOwnershipChain(
  'mcv-holdings-uuid',
  'gamma-tech-uuid',
);
// Returns:
// {
//   effectiveOwnership: 85.0,  // 100% of Tech Holdings × 85% of Gamma
//   chain: [
//     { entity: 'MCV Holdings', to: 'Tech Holdings', percentage: 100 },
//     { entity: 'Tech Holdings', to: 'Gamma Tech', percentage: 85 },
//   ]
// }

// Get all owners of an entity (cap table view)
const capTable = await ownershipService.getCapTable('gamma-tech-uuid');
// Returns all ownership records grouped by class

// Validate that total ownership doesn't exceed 100%
const validation = await ownershipService.validateTotalOwnership('gamma-tech-uuid');
// { valid: true, totalByClass: { 'Class A Units': 85.0, 'Class B Units': 15.0 } }

// Register a beneficial owner for FinCEN BOI reporting
await ownershipService.registerBeneficialOwner({
  entityId: 'gamma-tech-uuid',
  individualId: 'founder-john-uuid',
  fullName: 'John Arthur Smith',
  dateOfBirth: '1985-06-15',  // Will be encrypted
  residentialAddress: {
    line1: '123 Main Street',
    line2: null,
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94102',
    country: 'US',
  },
  idDocumentType: 'drivers_license',
  idDocumentNumber: 'D1234567',  // Will be encrypted
  idIssuingJurisdiction: 'CA',
  ownershipNature: ['equity_ownership_25_plus'],
  isExempt: false,
});
```

### Example 4: Manage Compliance Filings

```typescript
import { ComplianceStatusService } from '@mcv/portfolio/entities';

const complianceService = new ComplianceStatusService(db, ctx);

// Initialize compliance tracking for a new entity
await complianceService.initializeForEntity('gamma-tech-uuid', {
  formationJurisdiction: {
    jurisdiction: 'DE',
    jurisdictionType: 'formation',
    nextFilingDueDate: new Date('2026-06-01'),  // Delaware annual report
    nextFilingType: 'annual_report',
    estimatedFeeCents: 300_00,  // $300 LLC annual tax
    autoFileEnabled: true,
  },
  foreignQualifications: [
    {
      jurisdiction: 'CA',
      jurisdictionType: 'foreign_qualification',
      nextFilingDueDate: new Date('2026-04-15'),
      nextFilingType: 'statement_of_information',
      estimatedFeeCents: 20_00,
      autoFileEnabled: true,
    },
  ],
});

// File an annual report
const filing = await complianceService.createFiling({
  entityId: 'gamma-tech-uuid',
  jurisdiction: 'DE',
  filingType: 'annual_report',
  filingPeriod: '2025',
  dueDate: new Date('2026-06-01'),
  filingMethod: 'agent_service',
  preparedBy: 'legal-team-member-uuid',
});

// Mark filing as submitted
await complianceService.updateFilingStatus(filing.id, {
  status: 'submitted',
  filedDate: new Date(),
  confirmationNumber: 'DE-AR-2025-123456',
  feePaidCents: 300_00,
});

// Mark filing as accepted and update good standing
await complianceService.updateFilingStatus(filing.id, {
  status: 'accepted',
});

await complianceService.updateStanding('gamma-tech-uuid', 'DE', {
  goodStanding: 'good_standing',
  lastConfirmedDate: new Date(),
  lastFiledDate: new Date(),
  lastFilingConfirmation: 'DE-AR-2025-123456',
  nextFilingDueDate: new Date('2027-06-01'),
});

// Get all entities with upcoming filings (next 60 days)
const upcoming = await complianceService.getUpcomingFilings({
  daysAhead: 60,
  ventureId: 'venture-gamma-uuid',
});

// upcoming returns:
// [
//   { entity: 'Gamma Technologies LLC', jurisdiction: 'CA',
//     filingType: 'statement_of_information', dueDate: '2026-04-15',
//     estimatedFee: '$20.00' },
//   ...
// ]

// Get consortium-wide compliance dashboard
const dashboard = await complianceService.getDashboard();
// {
//   totalEntities: 47,
//   goodStanding: 42,
//   delinquent: 3,
//   pendingReview: 2,
//   upcomingFilings30Days: 8,
//   upcomingFilings90Days: 15,
//   totalOutstandingPenalties: '$4,250.00',
// }

// Get overdue filings across the consortium
const overdue = await complianceService.getOverdueFilings();
// Returns entities with filings past their due date, sorted by urgency
```

### Example 5: Corporate Document Vault

```typescript
import { CorporateDocumentService } from '@mcv/portfolio/entities';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

const docService = new CorporateDocumentService(db, ctx, storageClient);

// Upload an operating agreement
const fileBuffer = await readFile('./docs/gamma-tech-operating-agreement-v1.pdf');
const sha256 = createHash('sha256').update(fileBuffer).digest('hex');

const document = await docService.upload({
  entityId: 'gamma-tech-uuid',
  category: 'operating_agreement',
  title: 'Gamma Technologies LLC — Amended & Restated Operating Agreement',
  description: 'Initial operating agreement executed at formation. Covers membership interests, management structure, distribution waterfall, and dissolution provisions.',
  file: fileBuffer,
  mimeType: 'application/pdf',
  effectiveDate: new Date('2025-03-15'),
  executedBy: 'All Members',
  isNotarized: false,
  accessLevel: 'venture',
  tags: ['operating-agreement', 'formation', 'governance'],
});

console.log(document);
// {
//   id: 'doc-uuid-...',
//   storageRef: 'entities/gamma-tech-uuid/operating_agreement/v1/...',
//   sha256Hash: 'a1b2c3...',
//   currentVersion: 1,
//   isCurrent: true,
// }

// Upload a new version of the operating agreement (amendment)
const amendedBuffer = await readFile('./docs/gamma-tech-oa-amendment-1.pdf');

const amendment = await docService.uploadNewVersion({
  documentId: document.id,
  file: amendedBuffer,
  mimeType: 'application/pdf',
  changeDescription: 'First Amendment — Added drag-along rights and revised distribution waterfall',
  effectiveDate: new Date('2025-09-01'),
});

// Previous version is automatically marked isCurrent = false

// List all documents for an entity
const docs = await docService.listByEntity('gamma-tech-uuid', {
  category: 'operating_agreement',
  currentOnly: true,
});

// Download a document
const { buffer, metadata } = await docService.download(document.id);

// Get version history
const versions = await docService.getVersionHistory(document.id);
// Returns all versions in order, with change descriptions

// Search documents across the venture
const searchResults = await docService.search({
  query: 'distribution waterfall',
  ventureId: 'venture-gamma-uuid',
  categories: ['operating_agreement', 'partnership_agreement'],
});

// Grant restricted access to a specific user
await docService.grantAccess({
  documentId: document.id,
  userId: 'external-counsel-uuid',
  accessType: 'read',
  expiresAt: new Date('2026-03-15'),
  grantedBy: 'legal-admin-uuid',
  reason: 'Due diligence review for Series B financing',
});
```

### Example 6: Entity Lifecycle Management

```typescript
import { EntityLifecycleService } from '@mcv/portfolio/entities';

const lifecycleService = new EntityLifecycleService(db, ctx);

// ─── Formation ─────────────────────────────────────────────────
const formation = await lifecycleService.initiateFormation({
  entity: {
    entityCode: 'MCV-HEALTH-DELTA-001',
    legalName: 'Delta Health Innovations Inc.',
    entityType: EntityType.C_CORP,
    taxClassification: TaxClassification.C_CORPORATION,
    formationJurisdiction: 'DE',
    ventureId: 'venture-health-uuid',
    principalAddress: { /* ... */ },
  },
  registeredAgent: {
    agentName: 'CT Corporation System',
    agentType: 'commercial',
    agentAddress: { /* Delaware address */ },
    accountNumber: 'CT-MCV-2025-001',
    annualFeeCents: 375_00,
  },
  initialOfficers: [
    {
      individualId: 'ceo-uuid',
      fullName: 'Jane Doe',
      role: OfficerRole.CEO,
      isBoardMember: true,
      appointmentDate: new Date('2025-06-01'),
      isAuthorizedSignatory: true,
    },
    {
      individualId: 'cfo-uuid',
      fullName: 'Robert Chen',
      role: OfficerRole.CFO,
      isBoardMember: false,
      appointmentDate: new Date('2025-06-01'),
      isAuthorizedSignatory: true,
      signingAuthorityLimitCents: 500_000_00,
    },
  ],
  initialOwnership: [
    {
      ownerType: 'entity',
      ownerEntityId: 'mcv-health-holdings-uuid',
      ownerName: 'MCV Healthcare Ventures LLC',
      ownershipClass: 'Common Stock',
      percentageOwned: 100.0,
      unitsHeld: 10_000_000,
      totalUnitsOutstanding: 10_000_000,
      acquisitionMethod: 'formation',
    },
  ],
});

// formation.status === 'pending_formation'
// formation.entity, formation.officers, formation.ownership all created

// Complete formation after state filing
await lifecycleService.completeFormation(formation.entity.id, {
  filingReference: 'DE-CORP-2025-7891234',
  filingDate: new Date('2025-06-03'),
  certificateDocumentRef: 'storage://certs/de-formation-delta.pdf',
});

// ─── Conversion (LLC → C-Corp) ────────────────────────────────
await lifecycleService.initiateConversion({
  entityId: 'some-llc-uuid',
  fromType: EntityType.LLC_MULTI,
  toType: EntityType.C_CORP,
  conversionDate: new Date('2025-09-01'),
  reason: 'Preparing for Series A — investors require C-Corp structure',
  newTaxClassification: TaxClassification.C_CORPORATION,
  filingJurisdictions: ['DE', 'CA'],
  approvedBy: 'board-resolution-uuid',
});

// ─── Merger ────────────────────────────────────────────────────
await lifecycleService.initiateMerger({
  survivingEntityId: 'alpha-corp-uuid',
  mergingEntityIds: ['beta-llc-uuid'],
  mergerDate: new Date('2026-01-01'),
  mergerAgreementRef: 'storage://agreements/alpha-beta-merger.pdf',
  boardApprovalRefs: ['resolution-alpha-uuid', 'resolution-beta-uuid'],
  reason: 'Consolidating operations for efficiency',
});

// ─── Dissolution ───────────────────────────────────────────────
await lifecycleService.initiateDissolution({
  entityId: 'dormant-spv-uuid',
  dissolutionDate: new Date('2026-03-01'),
  reason: 'SPV purpose fulfilled — real estate transaction closed',
  windDownPlan: {
    assetsDispositionComplete: true,
    liabilitiesSettled: true,
    taxReturnsFiledThrough: '2025',
    finalDistributionComplete: true,
  },
  filingJurisdictions: ['DE', 'NY'],
});
```

### Example 7: Inter-Entity Transactions

```typescript
import { InterEntityService } from '@mcv/portfolio/entities';

const interEntityService = new InterEntityService(db, ctx);

// Record a management fee between entities
const mgmtFee = await interEntityService.recordTransaction({
  fromEntityId: 'gamma-tech-uuid',           // Operating entity pays
  toEntityId: 'tech-holdings-uuid',           // Holding company receives
  transactionType: 'management_fee',
  description: 'Q1 2026 management services fee — strategic planning, HR, legal oversight',
  amountCents: 75_000_00,                     // $75,000
  currency: 'USD',
  transactionDate: new Date('2026-03-31'),
  frequency: 'quarterly',
  armsLengthValidated: true,
  tpDocumentRef: 'storage://tp-docs/mgmt-fee-study-2025.pdf',
  externalReference: 'INV-MCV-2026-Q1-001',
});

// Record an inter-company loan
const loan = await interEntityService.recordLoan({
  fromEntityId: 'mcv-holdings-uuid',          // Lender
  toEntityId: 'gamma-tech-uuid',              // Borrower
  description: 'Working capital facility — 3-year term, SOFR + 200bps',
  principalAmountCents: 2_000_000_00,         // $2,000,000
  currency: 'USD',
  interestRateBps: 735,                       // 7.35% (SOFR ~5.35% + 200bps)
  disbursementDate: new Date('2025-04-01'),
  maturityDate: new Date('2028-04-01'),
  frequency: 'monthly',                       // Interest payment frequency
  loanAgreementRef: 'storage://loans/gamma-wc-facility-2025.pdf',
  armsLengthValidated: true,
  tpDocumentRef: 'storage://tp-docs/loan-rate-benchmark-2025.pdf',
});

// Record a loan payment
await interEntityService.recordLoanPayment({
  loanTransactionId: loan.id,
  paymentDate: new Date('2026-04-01'),
  principalPaymentCents: 55_555_56,           // ~$55,555.56 (1/36th of principal)
  interestPaymentCents: 12_250_00,            // $12,250.00 (monthly interest)
});

// Record an equity transfer
await interEntityService.recordEquityTransfer({
  fromEntityId: 'tech-holdings-uuid',
  toEntityId: 'mcv-holdings-uuid',
  entityBeingTransferred: 'gamma-tech-uuid',
  equityClass: 'Class A Units',
  unitsTransferred: 1000,
  valuationCents: 500_000_00,                 // $500,000 for 1000 units
  transferDate: new Date('2026-06-15'),
  reason: 'Corporate restructuring — moving Gamma under direct Holdings ownership',
  armsLengthValidated: true,
});

// Get all transactions between two entities
const history = await interEntityService.getTransactionHistory({
  fromEntityId: 'gamma-tech-uuid',
  toEntityId: 'tech-holdings-uuid',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2026-12-31'),
});

// Get outstanding inter-company loan balances
const loanBalances = await interEntityService.getOutstandingLoans({
  ventureId: 'venture-gamma-uuid',
});
// Returns all active loans with current principal balance, accrued interest, etc.

// Validate arm's-length pricing for all transactions in a period
const tpValidation = await interEntityService.validateTransferPricing({
  period: '2025',
  ventureId: 'venture-gamma-uuid',
});
// Returns flagged transactions that may not meet arm's-length standards
```

---

## Error Codes

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `ENT_001` | `EntityNotFoundError` | 404 | Entity with the specified ID or code does not exist or is not accessible to the current tenant |
| `ENT_002` | `DuplicateEntityError` | 409 | An entity with the same entity code already exists in the registry |
| `ENT_003` | `HierarchyCycleError` | 422 | Adding this parent-child relationship would create a circular reference in the hierarchy tree |
| `ENT_004` | `OwnershipExceedsError` | 422 | Total ownership for the specified class would exceed 100% with this record |
| `ENT_005` | `InvalidTaxIdError` | 400 | The provided EIN or tax identifier does not pass format validation (e.g., not in XX-XXXXXXX format for EIN) |
| `ENT_006` | `ComplianceLapsedError` | 403 | Operation blocked because the entity's compliance status is delinquent, suspended, or revoked in the relevant jurisdiction |
| `ENT_007` | `UnauthorizedEntityAccess` | 403 | Current user does not have permission to access this entity or perform this operation; may indicate insufficient RLS context or missing permission grant |
| `ENT_008` | `DocumentNotFoundError` | 404 | The specified corporate document does not exist or is not accessible at the current user's access level |
| `ENT_009` | `LifecycleTransitionError` | 422 | The requested status transition is invalid for the entity's current state (e.g., cannot dissolve an entity that is already dissolved, or cannot convert without required approvals) |
| `ENT_010` | `InterEntityValidationError` | 422 | Inter-entity transaction failed validation — may indicate the from/to entities are the same, the amount is non-positive, or required arm's-length documentation is missing |
| `ENT_011` | `ActiveChildEntitiesError` | 422 | Cannot dissolve or delete this entity because it has active child entities in the hierarchy; all children must be dissolved first |
| `ENT_012` | `DuplicateOfficerRoleError` | 409 | An active officer with the same role already exists for this entity (for roles that must be unique, e.g., CEO, Secretary) |
| `ENT_013` | `RegisteredAgentConflictError` | 409 | An active registered agent already exists for this entity in the specified jurisdiction |
| `ENT_014` | `EncryptionKeyError` | 500 | Failed to encrypt or decrypt a tax identifier — the KMS key may be unavailable, rotated, or the ciphertext is corrupted |
| `ENT_015` | `DocumentIntegrityError` | 422 | The uploaded document's SHA-256 hash does not match the declared hash, indicating the file may have been corrupted or tampered with during upload |
| `ENT_016` | `VentureAccessDeniedError` | 403 | The current user does not have access to the venture that owns this entity |

### Error Usage Example

```typescript
import { EntityNotFoundError, OwnershipExceedsError } from '@mcv/portfolio/entities';

try {
  await ownershipService.recordOwnership({
    entityId: 'nonexistent-uuid',
    // ...
  });
} catch (error) {
  if (error instanceof EntityNotFoundError) {
    // ENT_001: Entity not found
    console.error(`Entity not found: ${error.entityId}`);
  } else if (error instanceof OwnershipExceedsError) {
    // ENT_004: Ownership would exceed 100%
    console.error(
      `Cannot add ${error.attemptedPercentage}% ownership — ` +
      `current total is ${error.currentTotal}% for class "${error.ownershipClass}"`
    );
  }
  throw error;
}
```

---

## Security

### EIN / Tax ID Encryption

All tax identifiers (EINs, state tax IDs, ITINs, foreign TINs) are encrypted at the application layer before being persisted to the database. This provides defense-in-depth beyond PostgreSQL's built-in encryption-at-rest.

```
┌──────────────────────────────────────────────────────────────┐
│                   Tax ID Encryption Flow                      │
│                                                              │
│   Plaintext EIN        Application Layer         Database     │
│   "12-3456789"  ──▶  AES-256-GCM encrypt  ──▶  Ciphertext   │
│                       │                                       │
│                       ├── Key: HKDF(KMS master key, salt)    │
│                       ├── IV: Random 12 bytes per encryption │
│                       └── AAD: entity_id + identifier_type   │
│                                                              │
│   Masked value "XX-XXX6789" stored separately for display    │
│   Full value ONLY accessible with explicit permission         │
└──────────────────────────────────────────────────────────────┘
```

**Encryption Details:**

| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM |
| Key derivation | HKDF-SHA256 from KMS master key |
| IV / Nonce | 12 random bytes, unique per encryption |
| AAD (Additional Authenticated Data) | `entityId:identifierType:jurisdiction` |
| Storage format | Base64 encoded: `iv:ciphertext:authTag` |
| Key rotation | Supported via `encryption_key_id` column — old ciphertexts remain readable with archived keys |
| Masked value | Last 4 digits visible (e.g., `XX-XXX6789`); stored separately for display without decryption |

```typescript
import { encryptTaxId, decryptTaxId } from '@mcv/portfolio/entities';

// Encryption (at write time)
const encrypted = await encryptTaxId({
  plaintext: '12-3456789',
  entityId: 'gamma-tech-uuid',
  identifierType: 'ein',
  jurisdiction: 'US',
});
// {
//   encryptedValue: 'base64...',
//   encryptionKeyId: 'kms-key-v3',
//   maskedValue: 'XX-XXX6789',
// }

// Decryption (requires 'entity.tax_id.read' permission)
const plaintext = await decryptTaxId({
  encryptedValue: encrypted.encryptedValue,
  encryptionKeyId: encrypted.encryptionKeyId,
  entityId: 'gamma-tech-uuid',
  identifierType: 'ein',
  jurisdiction: 'US',
});
// '12-3456789'
```

### Document Access Control

Corporate documents use a layered access control model that combines RLS tenant isolation with document-level access levels and explicit grants:

```
┌─────────────────────────────────────────────────────────────────┐
│                  Document Access Control Layers                   │
│                                                                  │
│  Layer 1: RLS Tenant Isolation                                   │
│  └── User can only see documents in their tenant                 │
│                                                                  │
│  Layer 2: Document Access Level                                  │
│  ├── CONSORTIUM  → All users in the MCV consortium               │
│  ├── VENTURE     → Users with access to the entity's venture     │
│  ├── ENTITY      → Users with explicit entity-level access       │
│  ├── RESTRICTED  → Users with explicit document grant only       │
│  └── PRIVILEGED  → Legal team members only (attorney-client)     │
│                                                                  │
│  Layer 3: Explicit Grants (for RESTRICTED and PRIVILEGED)        │
│  └── document_access_grants table with expiration dates          │
│                                                                  │
│  Layer 4: Audit Trail                                            │
│  └── Every access (view/download) logged in audit table          │
└─────────────────────────────────────────────────────────────────┘
```

**Access Control Rules:**

| Level | Who Can Access | Use Cases |
|-------|---------------|-----------|
| `consortium` | Any authenticated MCV user | Organizational charts, public filings |
| `venture` | Users assigned to the entity's venture | Operating agreements, bylaws, meeting minutes |
| `entity` | Users with entity-level admin role | Board resolutions, stock certificates |
| `restricted` | Explicitly granted users only | M&A documents, sensitive financials |
| `privileged` | Legal team members with privilege flag | Attorney-client communications, litigation hold docs |

### Beneficial Owner Data Protection

Beneficial ownership information (BOI) for FinCEN reporting is subject to enhanced protections:

- **Date of birth**: Encrypted at rest using the same AES-256-GCM scheme as tax IDs
- **ID document numbers**: Encrypted with separate key context
- **ID document images**: Stored in isolated, encrypted storage bucket with no public URL
- **Access logging**: Every access to BOI data generates an immutable audit log entry
- **Retention policy**: BOI data retained for the minimum legally required period (currently 2 years after entity dissolution)
- **Export restrictions**: BOI data cannot be included in bulk exports; must be accessed record-by-record with explicit permission

### Permission Matrix

| Operation | Required Permission | Additional Conditions |
|-----------|--------------------|-----------------------|
| View entity list | `entity.read` | RLS tenant filter applied |
| Create entity | `entity.create` | Must have venture access |
| Update entity | `entity.update` | Must have venture access + entity not dissolved |
| Delete entity | `entity.delete` | Must be entity admin + no active children |
| View hierarchy | `entity.hierarchy.read` | RLS tenant filter applied |
| Modify hierarchy | `entity.hierarchy.write` | Must be consortium admin |
| View ownership | `entity.ownership.read` | RLS tenant filter applied |
| Modify ownership | `entity.ownership.write` | Must have entity admin role |
| View tax IDs (masked) | `entity.read` | Returns masked values only |
| View tax IDs (full) | `entity.tax_id.read` | Explicit grant required; audit logged |
| Upload documents | `entity.documents.write` | Must have venture access |
| Download documents | `entity.documents.read` | Subject to document access level |
| Download privileged docs | `entity.documents.privileged` | Legal team only |
| Manage officers | `entity.officers.write` | Must have entity admin role |
| File compliance | `entity.compliance.write` | Must have compliance officer role |
| Record inter-entity tx | `entity.inter_entity.write` | Requires dual-entity access |
| Approve inter-entity tx | `entity.inter_entity.approve` | Must be CFO or Treasury role |
| Initiate lifecycle event | `entity.lifecycle.write` | Requires entity admin + board approval ref |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENTITIES_DB_URL` | Yes | — | Supabase PostgreSQL connection string for the entities schema |
| `ENTITIES_ENCRYPTION_KMS_KEY_ARN` | Yes | — | ARN/ID of the KMS master key used for tax ID encryption key derivation |
| `ENTITIES_ENCRYPTION_SALT` | Yes | — | HKDF salt for key derivation (hex-encoded, minimum 32 bytes) |
| `ENTITIES_STORAGE_BUCKET` | Yes | — | Supabase Storage bucket name for corporate documents |
| `ENTITIES_STORAGE_ENCRYPTED_BUCKET` | Yes | — | Isolated bucket for BOI document images (server-side encrypted) |
| `ENTITIES_MAX_DOCUMENT_SIZE_MB` | No | `50` | Maximum upload size for corporate documents in megabytes |
| `ENTITIES_HIERARCHY_MAX_DEPTH` | No | `10` | Maximum allowed depth for entity hierarchy trees (prevents runaway nesting) |
| `ENTITIES_OWNERSHIP_PRECISION` | No | `4` | Decimal precision for ownership percentages (digits after decimal) |
| `ENTITIES_COMPLIANCE_ALERT_DAYS` | No | `60` | Number of days before a filing due date to trigger compliance alerts |
| `ENTITIES_TAX_ID_ACCESS_LOG_RETENTION_DAYS` | No | `2555` | Retention period for tax ID access logs (~7 years for IRS compliance) |
| `ENTITIES_BOI_RETENTION_YEARS` | No | `2` | Years to retain BOI data after entity dissolution |
| `ENTITIES_INTER_ENTITY_APPROVAL_THRESHOLD_CENTS` | No | `100000` | Transaction amount above which dual-approval is required ($1,000 default) |
| `ENTITIES_CACHE_TTL_SECONDS` | No | `300` | TTL for entity data caches (hierarchy tree, compliance dashboard) |
| `ENTITIES_AUDIT_ENABLED` | No | `true` | Whether to write detailed audit log entries for all mutations |

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/auth` | `workspace:*` | Authentication context, RLS tenant injection, permission checking |
| `@mcv/db` | `workspace:*` | Shared Drizzle ORM configuration, connection pooling, migration utilities |
| `@mcv/storage` | `workspace:*` | Supabase Storage client for corporate document upload/download |
| `@mcv/audit` | `workspace:*` | Audit log writing for compliance-sensitive operations |
| `@mcv/crypto` | `workspace:*` | AES-256-GCM encryption, HKDF key derivation, KMS client |
| `@mcv/compliance` | `workspace:*` | Regulatory filing calendar, filing orchestration |
| `@mcv/treasury` | `workspace:*` | Entity-level financial tracking, inter-company accounting reconciliation |
| `@mcv/portfolio/core` | `workspace:*` | Venture definitions, portfolio-level constants |
| `@mcv/trpc` | `workspace:*` | Shared tRPC configuration, middleware, error formatting |
| `@mcv/validators` | `workspace:*` | Shared Zod schemas for common types (Address, UUID, etc.) |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.36.0` | PostgreSQL ORM for type-safe queries and schema management |
| `@trpc/server` | `^10.45.0` | tRPC router and procedure definitions |
| `zod` | `^3.23.0` | Runtime input validation for all API inputs |
| `date-fns` | `^3.6.0` | Date arithmetic for compliance deadlines, renewal calculations |
| `uuid` | `^10.0.0` | UUID generation for entity IDs |
| `lodash-es` | `^4.17.21` | Tree manipulation utilities (groupBy, keyBy, etc.) |

---

## Testing

### Test Strategy

The entities module uses a multi-layered testing approach given its role as a compliance-critical system:

```
┌────────────────────────────────────────────────┐
│              Test Pyramid                       │
│                                                │
│              ╱╲       E2E Tests                │
│             ╱  ╲      (10 tests)               │
│            ╱────╲     Full lifecycle flows      │
│           ╱      ╲                              │
│          ╱ Integr. ╲  Integration Tests         │
│         ╱   Tests   ╲ (45 tests)               │
│        ╱─────────────╲ DB + RLS + encryption   │
│       ╱               ╲                         │
│      ╱   Unit Tests    ╲ Unit Tests             │
│     ╱    (120+ tests)   ╲ Services, utils, etc. │
│    ╱─────────────────────╲                      │
└────────────────────────────────────────────────┘
```

### Running Tests

```bash
# All entity module tests
pnpm test --filter @mcv/portfolio/entities

# Unit tests only
pnpm test:unit --filter @mcv/portfolio/entities

# Integration tests (requires running Supabase)
pnpm test:integration --filter @mcv/portfolio/entities

# E2E lifecycle tests
pnpm test:e2e --filter @mcv/portfolio/entities

# Test with coverage
pnpm test:coverage --filter @mcv/portfolio/entities
```

### Unit Test Examples

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { buildHierarchyTree } from '../utils/hierarchy';
import { calculateOwnershipChain } from '../utils/ownership';
import { validateEIN } from '../utils/validators';
import { encryptTaxId, decryptTaxId } from '../utils/crypto';

describe('validateEIN', () => {
  it('should accept valid EIN format', () => {
    expect(validateEIN('12-3456789')).toBe(true);
    expect(validateEIN('00-1234567')).toBe(true);
  });

  it('should reject invalid EIN formats', () => {
    expect(validateEIN('123456789')).toBe(false);   // Missing hyphen
    expect(validateEIN('12-345678')).toBe(false);    // Too short
    expect(validateEIN('12-34567890')).toBe(false);  // Too long
    expect(validateEIN('AB-CDEFGHI')).toBe(false);   // Non-numeric
    expect(validateEIN('')).toBe(false);              // Empty
  });

  it('should reject known invalid EIN prefixes', () => {
    // IRS does not issue EINs starting with 07, 08, 09, etc.
    expect(validateEIN('07-1234567')).toBe(false);
    expect(validateEIN('08-1234567')).toBe(false);
    expect(validateEIN('09-1234567')).toBe(false);
  });
});

describe('buildHierarchyTree', () => {
  const mockEntities = [
    { id: 'root', legalName: 'Holdings' },
    { id: 'child1', legalName: 'Sub A' },
    { id: 'child2', legalName: 'Sub B' },
    { id: 'grandchild1', legalName: 'Sub A-1' },
  ];

  const mockRelationships = [
    { parentEntityId: 'root', childEntityId: 'child1', ownershipPercentage: 100 },
    { parentEntityId: 'root', childEntityId: 'child2', ownershipPercentage: 60 },
    { parentEntityId: 'child1', childEntityId: 'grandchild1', ownershipPercentage: 80 },
  ];

  it('should build correct tree structure', () => {
    const tree = buildHierarchyTree('root', mockEntities, mockRelationships);
    expect(tree.root.entity.id).toBe('root');
    expect(tree.root.children).toHaveLength(2);
    expect(tree.root.children[0].children).toHaveLength(1);
    expect(tree.totalEntities).toBe(4);
    expect(tree.maxDepth).toBe(2);
  });

  it('should calculate cascading ownership correctly', () => {
    const tree = buildHierarchyTree('root', mockEntities, mockRelationships);
    const grandchild = tree.root.children[0].children[0];
    // Root owns 100% of Child1, Child1 owns 80% of Grandchild1
    // Effective ownership from root = 100% × 80% = 80%
    expect(grandchild.totalOwnershipFromRoot).toBe(80);
  });
});

describe('calculateOwnershipChain', () => {
  it('should trace ownership through multiple levels', async () => {
    const chain = await calculateOwnershipChain('root-uuid', 'grandchild-uuid');
    expect(chain.effectiveOwnership).toBeCloseTo(80, 4);
    expect(chain.chain).toHaveLength(2);
  });

  it('should return 0 for unrelated entities', async () => {
    const chain = await calculateOwnershipChain('root-uuid', 'unrelated-uuid');
    expect(chain.effectiveOwnership).toBe(0);
    expect(chain.chain).toHaveLength(0);
  });
});

describe('Tax ID Encryption', () => {
  it('should round-trip encrypt and decrypt', async () => {
    const original = '12-3456789';
    const encrypted = await encryptTaxId({
      plaintext: original,
      entityId: 'test-entity',
      identifierType: 'ein',
      jurisdiction: 'US',
    });

    expect(encrypted.encryptedValue).not.toBe(original);
    expect(encrypted.maskedValue).toBe('XX-XXX6789');

    const decrypted = await decryptTaxId({
      encryptedValue: encrypted.encryptedValue,
      encryptionKeyId: encrypted.encryptionKeyId,
      entityId: 'test-entity',
      identifierType: 'ein',
      jurisdiction: 'US',
    });

    expect(decrypted).toBe(original);
  });

  it('should reject decryption with wrong AAD context', async () => {
    const encrypted = await encryptTaxId({
      plaintext: '12-3456789',
      entityId: 'entity-a',
      identifierType: 'ein',
      jurisdiction: 'US',
    });

    await expect(
      decryptTaxId({
        encryptedValue: encrypted.encryptedValue,
        encryptionKeyId: encrypted.encryptionKeyId,
        entityId: 'entity-b',  // Wrong entity — should fail AAD check
        identifierType: 'ein',
        jurisdiction: 'US',
      }),
    ).rejects.toThrow('Decryption failed');
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, seedTestTenant, cleanupTestDb } from '@mcv/test-utils';
import { EntityService } from '../services/entity.service';
import { HierarchyService } from '../services/hierarchy.service';
import { ComplianceStatusService } from '../services/compliance-status.service';

describe('Entity Lifecycle Integration', () => {
  let db: TestDb;
  let entityService: EntityService;
  let hierarchyService: HierarchyService;
  let complianceService: ComplianceStatusService;

  beforeAll(async () => {
    db = await createTestDb();
    const ctx = await seedTestTenant(db, {
      tenantId: 'test-tenant',
      userId: 'test-user',
      permissions: [
        'entity.create', 'entity.read', 'entity.update', 'entity.delete',
        'entity.hierarchy.read', 'entity.hierarchy.write',
        'entity.compliance.write',
      ],
    });
    entityService = new EntityService(db, ctx);
    hierarchyService = new HierarchyService(db, ctx);
    complianceService = new ComplianceStatusService(db, ctx);
  });

  afterAll(async () => {
    await cleanupTestDb(db);
  });

  it('should create entity, add to hierarchy, and track compliance', async () => {
    // 1. Create parent entity
    const parent = await entityService.create({
      entityCode: 'TEST-PARENT-001',
      legalName: 'Test Holdings LLC',
      entityType: EntityType.LLC_MULTI,
      taxClassification: TaxClassification.PARTNERSHIP,
      formationJurisdiction: 'DE',
      formationDate: new Date('2024-01-01'),
      fiscalYearEnd: '12-31',
      ventureId: testVentureId,
      principalAddress: testAddress,
    });
    expect(parent.status).toBe('pending_formation');

    // 2. Create child entity
    const child = await entityService.create({
      entityCode: 'TEST-CHILD-001',
      legalName: 'Test Operations Inc.',
      entityType: EntityType.C_CORP,
      taxClassification: TaxClassification.C_CORPORATION,
      formationJurisdiction: 'DE',
      formationDate: new Date('2024-06-01'),
      fiscalYearEnd: '12-31',
      ventureId: testVentureId,
      principalAddress: testAddress,
    });

    // 3. Establish hierarchy
    await hierarchyService.addChild({
      parentEntityId: parent.id,
      childEntityId: child.id,
      relationshipType: 'subsidiary',
      ownershipPercentage: 100,
      isPrimary: true,
      effectiveDate: new Date('2024-06-01'),
    });

    // 4. Verify tree structure
    const tree = await hierarchyService.buildTree(parent.id);
    expect(tree.totalEntities).toBe(2);
    expect(tree.root.children).toHaveLength(1);
    expect(tree.root.children[0].entity.id).toBe(child.id);

    // 5. Initialize compliance
    await complianceService.initializeForEntity(child.id, {
      formationJurisdiction: {
        jurisdiction: 'DE',
        jurisdictionType: 'formation',
        nextFilingDueDate: new Date('2025-03-01'),
        nextFilingType: 'annual_report',
        estimatedFeeCents: 225_00,
      },
    });

    // 6. Verify compliance status
    const status = await complianceService.getStatus(child.id, 'DE');
    expect(status.goodStanding).toBe('not_yet_filed');
    expect(status.nextFilingDueDate).toEqual(new Date('2025-03-01'));

    // 7. Cannot dissolve parent while child is active
    await expect(
      entityService.delete(parent.id),
    ).rejects.toThrow('ActiveChildEntitiesError');
  });

  it('should enforce RLS tenant isolation', async () => {
    const otherCtx = await seedTestTenant(db, {
      tenantId: 'other-tenant',
      userId: 'other-user',
      permissions: ['entity.read'],
    });
    const otherService = new EntityService(db, otherCtx);

    // Entity created by test-tenant should not be visible to other-tenant
    const results = await otherService.list({});
    expect(results.items).toHaveLength(0);
  });
});
```

### Key Test Coverage Areas

| Area | Tests | Coverage Target |
|------|-------|----------------|
| Entity CRUD | 25 | 95% |
| Hierarchy tree building | 20 | 100% |
| Cycle detection | 8 | 100% |
| Ownership calculation | 15 | 95% |
| Ownership chain resolution | 10 | 100% |
| EIN validation | 12 | 100% |
| Tax ID encryption/decryption | 10 | 100% |
| Compliance filing workflow | 15 | 90% |
| Document upload/versioning | 12 | 90% |
| Document access control | 10 | 95% |
| Officer appointment/removal | 8 | 90% |
| Lifecycle state transitions | 15 | 95% |
| Inter-entity transactions | 12 | 90% |
| RLS policy enforcement | 8 | 100% |
| Error handling | 16 | 95% |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2025-03-01 | Initial release — entity registry, hierarchy, basic CRUD |
| 0.2.0 | 2025-04-15 | Added ownership tracking, cap table views, beneficial owner support |
| 0.3.0 | 2025-06-01 | Added compliance filing management, good standing tracking |
| 0.4.0 | 2025-07-15 | Added corporate document vault with versioning and access control |
| 0.5.0 | 2025-09-01 | Added EIN/tax ID encryption, officer/director management |
| 0.6.0 | 2025-10-15 | Added entity lifecycle management (formation, conversion, merger, dissolution) |
| 0.7.0 | 2025-12-01 | Added inter-entity transaction tracking, transfer pricing validation |
| 0.8.0 | 2026-01-15 | Added FinCEN BOI reporting support, enhanced document access levels |
| 1.0.0 | 2026-03-01 | Stable release — full feature set, comprehensive test coverage |

---

*This module is classified as **MCV-Only** (Tier 5). It contains proprietary business logic specific to the MCV Global Consortium's corporate structure and is not designed for reuse outside the consortium's systems.*