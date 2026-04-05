# @mcv/web3-public/attestation

> **Tier 5 Domain Module — Publishable**
> On-chain verification, verifiable credentials, and reputation scoring on Solana.

---

## Purpose

The attestation module provides a comprehensive on-chain verification and credential system built on Solana. It enables issuers — whether organizations, DAOs, educational institutions, or automated systems — to create tamper-proof, cryptographically signed claims about subjects (individuals, wallets, entities). These attestations form the backbone of decentralized identity and reputation, allowing anyone to prove credentials, achievements, skills, employment history, and identity attributes without relying on a centralized authority. The system implements the W3C Verifiable Credentials standard adapted for Solana's account model, ensuring interoperability with the broader decentralized identity ecosystem while leveraging Solana's speed and low transaction costs.

Attestations are not merely static records. They carry lifecycle semantics: they can be issued, verified, revoked, expired, renewed, and selectively disclosed. The module manages the full lifecycle from schema definition (what can be attested) through issuance (creating the credential), on-chain anchoring (immutable proof of existence), verification (checking validity, issuer authority, expiry, and revocation status), and revocation (invalidating credentials that are no longer accurate). A built-in reputation scoring engine aggregates attestations into composite scores, enabling platforms to assess trust and competence at a glance. Cross-platform attestation portability ensures that credentials earned in one venture or platform can be recognized and verified across the entire MCV ecosystem and beyond.

Privacy is treated as a first-class concern. The module supports selective disclosure — proving you hold a credential without revealing its full contents — and zero-knowledge proofs for privacy-preserving verification. A user can prove they are over 18 without revealing their birthdate, or prove they hold a specific certification without revealing their identity. This approach aligns with self-sovereign identity principles: the subject controls what is shared, with whom, and under what conditions, while verifiers can still trust the cryptographic guarantees of the underlying attestations.

---

## Exports

```typescript
// === Primary Service ===
export { AttestationService } from './services/attestation.service';
export { VerificationService } from './services/verification.service';
export { ReputationService } from './services/reputation.service';
export { IssuerService } from './services/issuer.service';
export { RevocationService } from './services/revocation.service';
export { SchemaService } from './services/schema.service';
export { DisclosureService } from './services/disclosure.service';
export { CrossPlatformService } from './services/cross-platform.service';

// === Core Types ===
export type {
  Attestation,
  AttestationInput,
  AttestationMetadata,
  AttestationStatus,
  AttestationProof,
  OnChainAttestation,
} from './types/attestation.types';

export type {
  AttestationSchema,
  SchemaField,
  SchemaFieldType,
  SchemaConstraint,
  SchemaVersion,
} from './types/schema.types';

export type {
  Issuer,
  IssuerProfile,
  IssuerAuthority,
  IssuerDelegation,
  IssuerReputation,
  TrustedIssuerEntry,
} from './types/issuer.types';

export type {
  ReputationScore,
  ReputationDimension,
  ReputationWeight,
  ReputationHistory,
  ReputationConfig,
} from './types/reputation.types';

export type {
  VerificationResult,
  VerificationStep,
  VerificationPolicy,
  VerificationContext,
  VerificationReport,
} from './types/verification.types';

export type {
  RevocationEntry,
  RevocationRegistry,
  RevocationReason,
  RevocationProof,
} from './types/revocation.types';

export type {
  SelectiveDisclosure,
  DisclosureRequest,
  DisclosureProof,
  ZKProof,
  ZKCircuit,
  PrivacyPolicy,
} from './types/privacy.types';

export type {
  CrossPlatformAttestation,
  AttestationBridge,
  PlatformMapping,
  PortabilityConfig,
} from './types/cross-platform.types';

export type {
  VerifiableCredential,
  VerifiablePresentation,
  CredentialSubject,
  CredentialProof,
  CredentialStatus,
} from './types/w3c.types';

// === Constants ===
export {
  ATTESTATION_PROGRAM_ID,
  SCHEMA_REGISTRY_SEED,
  ISSUER_REGISTRY_SEED,
  REVOCATION_REGISTRY_SEED,
  MAX_ATTESTATION_SIZE,
  DEFAULT_EXPIRY_DAYS,
  REPUTATION_DECAY_RATE,
} from './constants';

// === Errors ===
export {
  AttestationError,
  AttestationErrorCode,
} from './errors';

// === Utilities ===
export {
  encodeAttestation,
  decodeAttestation,
  hashAttestationData,
  verifyAttestationSignature,
  deriveAttestationPDA,
  deriveSchemaRegistryPDA,
  deriveIssuerPDA,
  deriveRevocationPDA,
  buildMerkleTree,
  generateSelectiveDisclosureProof,
  computeReputationScore,
} from './utils';

// === Drizzle Schemas ===
export {
  attestations,
  attestationSchemas,
  issuers,
  reputationScores,
  revocations,
  verificationLogs,
  issuerDelegations,
  attestationTags,
  schemaVersions,
} from './db/schema';

// === Solana Program Interaction ===
export {
  createAttestationInstruction,
  createRevokeInstruction,
  createSchemaInstruction,
  createIssuerRegistrationInstruction,
  createDelegationInstruction,
  parseAttestationAccount,
  parseSchemaAccount,
  parseIssuerAccount,
  parseRevocationAccount,
} from './program';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          ATTESTATION MODULE ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Issuers     │    │   Subjects   │    │  Verifiers   │    │  Platforms   │      │
│  │ (orgs, DAOs,  │    │ (wallets,    │    │ (dApps,      │    │ (ventures,   │      │
│  │  institutions)│    │  users)      │    │  services)   │    │  bridges)    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │                   │               │
│         ▼                   ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                          API / SERVICE LAYER                                │    │
│  │                                                                             │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐     │    │
│  │  │ AttestationSvc   │  │ VerificationSvc │  │   CrossPlatformSvc     │     │    │
│  │  │ ─ issue()        │  │ ─ verify()      │  │   ─ port()             │     │    │
│  │  │ ─ revoke()       │  │ ─ batchVerify() │  │   ─ bridge()           │     │    │
│  │  │ ─ renew()        │  │ ─ buildReport() │  │   ─ resolve()          │     │    │
│  │  └────────┬─────────┘  └────────┬────────┘  └───────────┬───────────┘     │    │
│  │           │                     │                        │                 │    │
│  │  ┌────────┴─────────┐  ┌───────┴─────────┐  ┌──────────┴────────────┐     │    │
│  │  │ IssuerSvc        │  │ ReputationSvc   │  │   DisclosureSvc       │     │    │
│  │  │ ─ register()     │  │ ─ compute()     │  │   ─ selectiveProof()  │     │    │
│  │  │ ─ delegate()     │  │ ─ aggregate()   │  │   ─ zkProof()         │     │    │
│  │  │ ─ verify()       │  │ ─ decay()       │  │   ─ verifyProof()     │     │    │
│  │  └────────┬─────────┘  └───────┬─────────┘  └──────────┬────────────┘     │    │
│  │           │                     │                        │                 │    │
│  │  ┌────────┴─────────┐  ┌───────┴─────────┐  ┌──────────┴────────────┐     │    │
│  │  │ SchemaSvc        │  │ RevocationSvc   │  │   W3C Adapter         │     │    │
│  │  │ ─ create()       │  │ ─ revoke()      │  │   ─ toVC()            │     │    │
│  │  │ ─ validate()     │  │ ─ check()       │  │   ─ fromVC()          │     │    │
│  │  │ ─ version()      │  │ ─ registry()    │  │   ─ toVP()            │     │    │
│  │  └──────────────────┘  └─────────────────┘  └───────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                        │                                            │
│                                        ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                          DATA / PERSISTENCE LAYER                           │    │
│  │                                                                             │    │
│  │  ┌────────────────────────┐        ┌────────────────────────────────┐       │    │
│  │  │   PostgreSQL (Drizzle) │        │   Solana On-Chain Program      │       │    │
│  │  │                        │        │                                │       │    │
│  │  │  attestations          │◄──────►│  Attestation PDAs             │       │    │
│  │  │  attestation_schemas   │        │  Schema Registry PDA          │       │    │
│  │  │  issuers               │        │  Issuer Registry PDA          │       │    │
│  │  │  reputation_scores     │        │  Revocation Registry PDA      │       │    │
│  │  │  revocations           │        │  Delegation PDAs              │       │    │
│  │  │  verification_logs     │        │                                │       │    │
│  │  │  issuer_delegations    │        │  ┌──────────────────────────┐ │       │    │
│  │  │  attestation_tags      │        │  │ Program Instructions:    │ │       │    │
│  │  │  schema_versions       │        │  │ ─ create_attestation     │ │       │    │
│  │  └────────────────────────┘        │  │ ─ revoke_attestation     │ │       │    │
│  │                                    │  │ ─ register_schema        │ │       │    │
│  │                                    │  │ ─ register_issuer        │ │       │    │
│  │                                    │  │ ─ delegate_authority     │ │       │    │
│  │                                    │  │ ─ update_revocation_reg  │ │       │    │
│  │                                    │  └──────────────────────────┘ │       │    │
│  │                                    └────────────────────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

                        ATTESTATION ISSUANCE FLOW
                        ═════════════════════════

  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  Issuer   │     │  Schema  │     │  Attest  │     │  On-Chain │     │  Subject │
  │  Registry │     │  Valid.  │     │  Service │     │  Program  │     │  Wallet  │
  └─────┬────┘     └─────┬────┘     └─────┬────┘     └─────┬────┘     └─────┬────┘
        │                │                │                │                │
        │  1. Verify     │                │                │                │
        │  Issuer Auth   │                │                │                │
        ├───────────────►│                │                │                │
        │                │  2. Validate   │                │                │
        │                │  Against Schema│                │                │
        │                ├───────────────►│                │                │
        │                │                │  3. Create     │                │
        │                │                │  Attestation   │                │
        │                │                │  + Sign        │                │
        │                │                ├───────────────►│                │
        │                │                │                │  4. Anchor     │
        │                │                │                │  On-Chain      │
        │                │                │                │  (PDA)         │
        │                │                │                ├───────────────►│
        │                │                │                │  5. Notify     │
        │                │                │                │  Subject       │
        │                │                │  6. Return     │                │
        │                │                │◄───────────────┤                │
        │                │  7. Store      │                │                │
        │                │  Off-Chain     │                │                │
        │                │◄───────────────┤                │                │
        │                │                │                │                │
        ▼                ▼                ▼                ▼                ▼


                        VERIFICATION FLOW
                        ═════════════════

  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ Verifier  │────►│ Verify   │────►│ On-Chain │────►│ Result   │
  │ (dApp)    │     │ Service  │     │ Lookup   │     │ Report   │
  └───────────┘     └────┬─────┘     └──────────┘     └──────────┘
                         │
                    ┌────┴────┐
                    │ Checks: │
                    │ 1. Sig  │
                    │ 2. Exp  │
                    │ 3. Rev  │
                    │ 4. Iss  │
                    │ 5. Schema│
                    └─────────┘
```

---

## Core Interfaces

### AttestationService

```typescript
/**
 * Primary service for creating, managing, and querying attestations.
 * Orchestrates the full lifecycle from issuance through on-chain anchoring.
 */
interface AttestationService {
  /**
   * Issue a new attestation from an authorized issuer to a subject.
   * Validates schema, verifies issuer authority, signs, and anchors on-chain.
   *
   * @param input - Attestation details including schema, subject, claims
   * @param issuerKeypair - The issuer's signing keypair
   * @param options - Optional: skipOnChain, expiresAt, tags, metadata
   * @returns The created attestation with on-chain transaction signature
   */
  issue(
    input: AttestationInput,
    issuerKeypair: Keypair,
    options?: AttestationOptions,
  ): Promise<Attestation>;

  /**
   * Issue multiple attestations in a single batched transaction.
   * More gas-efficient for bulk credential issuance (e.g., graduating class).
   *
   * @param inputs - Array of attestation inputs
   * @param issuerKeypair - The issuer's signing keypair
   * @param options - Batch options: maxPerTx, continueOnError
   * @returns Array of results, each success or failure
   */
  batchIssue(
    inputs: AttestationInput[],
    issuerKeypair: Keypair,
    options?: BatchAttestationOptions,
  ): Promise<BatchResult<Attestation>[]>;

  /**
   * Retrieve an attestation by its unique ID.
   * Checks both off-chain database and on-chain state.
   *
   * @param attestationId - Unique attestation identifier (UUID)
   * @param options - Optional: includeProof, includeOnChainData
   * @returns The attestation or null if not found
   */
  get(
    attestationId: string,
    options?: GetAttestationOptions,
  ): Promise<Attestation | null>;

  /**
   * Find attestations matching query criteria.
   * Supports filtering by subject, issuer, schema, status, date range, tags.
   *
   * @param query - Search criteria
   * @param pagination - Offset, limit, sort
   * @returns Paginated list of matching attestations
   */
  find(
    query: AttestationQuery,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Attestation>>;

  /**
   * Get all attestations held by a specific subject (wallet).
   *
   * @param subjectWallet - The subject's Solana wallet address
   * @param options - Filter by schema, status, issuer
   * @returns Array of attestations for this subject
   */
  getBySubject(
    subjectWallet: PublicKey,
    options?: SubjectQueryOptions,
  ): Promise<Attestation[]>;

  /**
   * Get all attestations issued by a specific issuer.
   *
   * @param issuerWallet - The issuer's Solana wallet address
   * @param options - Filter by schema, status, date range
   * @returns Array of attestations from this issuer
   */
  getByIssuer(
    issuerWallet: PublicKey,
    options?: IssuerQueryOptions,
  ): Promise<Attestation[]>;

  /**
   * Renew an attestation that is expiring or expired.
   * Only the original issuer (or delegate) can renew.
   *
   * @param attestationId - The attestation to renew
   * @param issuerKeypair - Issuer's signing keypair
   * @param newExpiry - New expiration date
   * @returns Updated attestation
   */
  renew(
    attestationId: string,
    issuerKeypair: Keypair,
    newExpiry: Date,
  ): Promise<Attestation>;

  /**
   * Convert an attestation to W3C Verifiable Credential format.
   *
   * @param attestationId - The attestation to convert
   * @returns W3C-compliant Verifiable Credential JSON-LD
   */
  toVerifiableCredential(attestationId: string): Promise<VerifiableCredential>;

  /**
   * Import a W3C Verifiable Credential as a local attestation.
   *
   * @param vc - The Verifiable Credential to import
   * @param options - Mapping options, trust policy
   * @returns The created attestation
   */
  fromVerifiableCredential(
    vc: VerifiableCredential,
    options?: ImportOptions,
  ): Promise<Attestation>;

  /**
   * Subscribe to attestation events (issued, revoked, expired).
   *
   * @param filter - Event filter criteria
   * @param callback - Handler for matching events
   * @returns Unsubscribe function
   */
  subscribe(
    filter: AttestationEventFilter,
    callback: (event: AttestationEvent) => void,
  ): () => void;
}
```

### Attestation

```typescript
/**
 * Represents a single attestation — a verifiable claim made by an issuer
 * about a subject. Contains both the claim data and cryptographic proof.
 */
interface Attestation {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Schema this attestation conforms to */
  schemaId: string;

  /** Schema version used at time of issuance */
  schemaVersion: number;

  /** The issuer's wallet address (Solana PublicKey as string) */
  issuerWallet: string;

  /** The subject's wallet address (who the attestation is about) */
  subjectWallet: string;

  /** The actual claim data, conforming to the schema definition */
  claims: Record<string, AttestationClaimValue>;

  /** Current status of the attestation */
  status: AttestationStatus;

  /** When the attestation was issued */
  issuedAt: Date;

  /** When the attestation expires (null = never) */
  expiresAt: Date | null;

  /** When the attestation was revoked (null = not revoked) */
  revokedAt: Date | null;

  /** Reason for revocation, if applicable */
  revocationReason: RevocationReason | null;

  /** Cryptographic signature from the issuer */
  signature: string;

  /** Hash of the attestation data (for on-chain anchoring) */
  dataHash: string;

  /** On-chain transaction signature (null if off-chain only) */
  onChainTxSignature: string | null;

  /** On-chain PDA address (null if off-chain only) */
  onChainAddress: string | null;

  /** Merkle root for selective disclosure */
  merkleRoot: string;

  /** Additional metadata */
  metadata: AttestationMetadata;

  /** Tags for categorization and search */
  tags: string[];

  /** Venture ID that issued this attestation */
  ventureId: string;

  /** Platform ID for cross-platform tracking */
  platformId: string;

  /** Creation timestamp in database */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

type AttestationStatus =
  | 'active'
  | 'expired'
  | 'revoked'
  | 'suspended'
  | 'pending';

type AttestationClaimValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | Record<string, unknown>;

interface AttestationMetadata {
  /** Human-readable name/title for this attestation */
  name?: string;

  /** Description of what this attestation represents */
  description?: string;

  /** URI to an image/badge representing this attestation */
  imageUri?: string;

  /** URI to external resource with more details */
  externalUri?: string;

  /** Evidence supporting the attestation (URIs, hashes) */
  evidence?: AttestationEvidence[];

  /** Terms of use for this attestation */
  termsOfUse?: string;

  /** Refresh service endpoint for credential status */
  refreshService?: string;

  /** Custom key-value pairs */
  custom?: Record<string, unknown>;
}

interface AttestationEvidence {
  /** Type of evidence */
  type: 'document' | 'assessment' | 'verification' | 'observation' | 'other';

  /** URI pointing to the evidence */
  uri: string;

  /** Hash of the evidence content */
  hash: string;

  /** Human-readable description */
  description?: string;
}

interface AttestationInput {
  /** Schema ID to attest against */
  schemaId: string;

  /** Subject's wallet address */
  subjectWallet: PublicKey;

  /** Claim data matching the schema */
  claims: Record<string, AttestationClaimValue>;

  /** Optional expiration date */
  expiresAt?: Date;

  /** Optional metadata */
  metadata?: Partial<AttestationMetadata>;

  /** Optional tags */
  tags?: string[];

  /** If issuing as a delegate, the delegation ID */
  delegationId?: string;
}

interface AttestationOptions {
  /** Skip on-chain anchoring (off-chain only attestation) */
  skipOnChain?: boolean;

  /** Priority fee for Solana transaction (in lamports) */
  priorityFee?: number;

  /** Commitment level for on-chain confirmation */
  commitment?: 'processed' | 'confirmed' | 'finalized';

  /** Whether to notify the subject */
  notifySubject?: boolean;

  /** Custom memo to include in the transaction */
  memo?: string;
}
```

### AttestationSchema

```typescript
/**
 * Defines the structure and validation rules for attestations.
 * Schemas are registered on-chain and versioned for backwards compatibility.
 */
interface AttestationSchema {
  /** Unique schema identifier (UUID v4) */
  id: string;

  /** Human-readable schema name (e.g., "skill-certification") */
  name: string;

  /** Detailed description of what this schema attests */
  description: string;

  /** Current version number */
  version: number;

  /** The fields that make up this schema */
  fields: SchemaField[];

  /** Category for organization */
  category: SchemaCategory;

  /** Who created this schema */
  creatorWallet: string;

  /** Whether this schema is publicly available */
  isPublic: boolean;

  /** On-chain registry address */
  onChainAddress: string | null;

  /** Schema status */
  status: 'active' | 'deprecated' | 'draft';

  /** Schemas this one extends (inheritance) */
  extendsSchemas: string[];

  /** Required issuer authority level to use this schema */
  requiredAuthorityLevel: IssuerAuthorityLevel;

  /** Venture that owns this schema */
  ventureId: string;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface SchemaField {
  /** Field name (camelCase) */
  name: string;

  /** Human-readable label */
  label: string;

  /** Field data type */
  type: SchemaFieldType;

  /** Whether this field is required */
  required: boolean;

  /** Whether this field can be selectively disclosed */
  disclosable: boolean;

  /** Description of what this field represents */
  description?: string;

  /** Validation constraints */
  constraints?: SchemaConstraint[];

  /** Default value if not provided */
  defaultValue?: AttestationClaimValue;

  /** For enum types, the allowed values */
  enumValues?: string[];

  /** Nested fields (for object type) */
  nestedFields?: SchemaField[];
}

type SchemaFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'enum'
  | 'uri'
  | 'wallet_address'
  | 'hash'
  | 'object'
  | 'array'
  | 'integer'
  | 'float';

interface SchemaConstraint {
  type: 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value: string | number;
  message?: string;
}

type SchemaCategory =
  | 'identity'
  | 'education'
  | 'employment'
  | 'skill'
  | 'achievement'
  | 'certification'
  | 'membership'
  | 'kyc'
  | 'reputation'
  | 'custom';
```

### Issuer

```typescript
/**
 * Represents a trusted entity authorized to issue attestations.
 * Issuers must register and may be granted different authority levels.
 */
interface Issuer {
  /** Unique issuer identifier (UUID v4) */
  id: string;

  /** Issuer's Solana wallet address */
  wallet: string;

  /** Human-readable issuer name */
  name: string;

  /** Description of the issuer and their authority */
  description: string;

  /** Issuer's authority level */
  authorityLevel: IssuerAuthorityLevel;

  /** Schemas this issuer is authorized to use */
  authorizedSchemas: string[];

  /** Whether the issuer can authorize for all schemas */
  universalAuthority: boolean;

  /** Issuer's reputation score */
  reputation: IssuerReputation;

  /** On-chain registry entry address */
  onChainAddress: string | null;

  /** Whether the issuer is currently active */
  isActive: boolean;

  /** When the issuer was registered */
  registeredAt: Date;

  /** When issuer authority expires (null = permanent) */
  expiresAt: Date | null;

  /** Delegations this issuer has granted */
  delegations: IssuerDelegation[];

  /** Venture this issuer belongs to */
  ventureId: string;

  /** Contact/verification URI */
  verificationUri?: string;

  /** Logo or avatar URI */
  logoUri?: string;

  /** Metadata */
  metadata: Record<string, unknown>;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type IssuerAuthorityLevel =
  | 'basic'       // Can issue basic attestations
  | 'standard'    // Can issue standard attestations + some schemas
  | 'trusted'     // Trusted issuer, expanded schema access
  | 'authority'   // Full authority, can create schemas + delegate
  | 'root';       // Root authority, manages issuer registry

interface IssuerDelegation {
  /** Unique delegation ID */
  id: string;

  /** The issuer granting authority */
  delegatorWallet: string;

  /** The wallet receiving delegated authority */
  delegateWallet: string;

  /** Schemas the delegate can issue for */
  allowedSchemas: string[];

  /** Maximum number of attestations the delegate can issue */
  maxIssuances: number | null;

  /** Current count of attestations issued under this delegation */
  currentIssuances: number;

  /** When the delegation expires */
  expiresAt: Date;

  /** Whether the delegate can further sub-delegate */
  canSubDelegate: boolean;

  /** Delegation status */
  status: 'active' | 'revoked' | 'expired';

  /** On-chain delegation PDA */
  onChainAddress: string | null;

  /** Timestamps */
  createdAt: Date;
  revokedAt: Date | null;
}

interface IssuerReputation {
  /** Overall reputation score (0-1000) */
  overallScore: number;

  /** Total attestations issued */
  totalIssued: number;

  /** Total attestations revoked by issuer */
  totalRevoked: number;

  /** Revocation rate (lower is better) */
  revocationRate: number;

  /** Average time to revocation (indicates thoroughness) */
  avgRevocationTimeMs: number | null;

  /** Number of unique subjects attested */
  uniqueSubjects: number;

  /** Number of schemas used */
  schemasUsed: number;

  /** How long issuer has been active (days) */
  activeDays: number;

  /** Number of disputes/challenges against this issuer */
  disputes: number;

  /** Last computed at */
  computedAt: Date;
}
```

### ReputationScore

```typescript
/**
 * Aggregated reputation score for a subject, computed from their attestations.
 * Multi-dimensional scoring with configurable weights and decay.
 */
interface ReputationScore {
  /** Unique reputation record ID */
  id: string;

  /** Subject wallet this reputation is for */
  subjectWallet: string;

  /** Overall composite score (0-1000) */
  overallScore: number;

  /** Confidence level in the score (0-1) based on attestation volume */
  confidence: number;

  /** Individual dimension scores */
  dimensions: ReputationDimension[];

  /** Number of active attestations contributing to this score */
  attestationCount: number;

  /** Number of unique issuers contributing attestations */
  issuerCount: number;

  /** Score percentile relative to all subjects (0-100) */
  percentile: number;

  /** Score trend (rising, stable, falling) */
  trend: 'rising' | 'stable' | 'falling';

  /** Score change over last 30 days */
  thirtyDayChange: number;

  /** Venture context for this reputation */
  ventureId: string;

  /** When this score was last computed */
  computedAt: Date;

  /** Score history snapshots */
  history: ReputationHistory[];
}

interface ReputationDimension {
  /** Dimension name (e.g., "technical_skill", "reliability", "education") */
  name: string;

  /** Dimension label for display */
  label: string;

  /** Score for this dimension (0-1000) */
  score: number;

  /** Weight of this dimension in overall score (0-1) */
  weight: number;

  /** Number of attestations contributing to this dimension */
  attestationCount: number;

  /** Weighted contribution to overall score */
  contribution: number;
}

interface ReputationWeight {
  /** Schema ID or category */
  schemaIdOrCategory: string;

  /** Dimension this maps to */
  dimension: string;

  /** Base weight (0-1) */
  weight: number;

  /** Multiplier based on issuer authority level */
  issuerAuthorityMultiplier: Record<IssuerAuthorityLevel, number>;

  /** Decay rate per day (score diminishes over time) */
  decayRatePerDay: number;

  /** Minimum age (days) before attestation contributes */
  minAgeDays: number;

  /** Maximum age (days) after which attestation stops contributing */
  maxAgeDays: number | null;
}

interface ReputationHistory {
  /** Snapshot date */
  date: Date;

  /** Overall score at this point */
  overallScore: number;

  /** Dimension scores at this point */
  dimensionScores: Record<string, number>;

  /** What triggered the recomputation */
  trigger: 'attestation_issued' | 'attestation_revoked' | 'scheduled' | 'manual';
}

interface ReputationConfig {
  /** Scoring dimensions and their weights */
  dimensions: ReputationWeight[];

  /** Global decay rate multiplier */
  globalDecayMultiplier: number;

  /** Minimum attestations required for a valid score */
  minAttestations: number;

  /** Minimum unique issuers required for a valid score */
  minIssuers: number;

  /** How often to recompute scores (ms) */
  recomputeIntervalMs: number;

  /** Whether to factor in issuer reputation */
  weightByIssuerReputation: boolean;

  /** Maximum score boost from a single attestation */
  maxSingleAttestationBoost: number;

  /** Score normalization method */
  normalization: 'linear' | 'logarithmic' | 'sigmoid';
}
```

### VerificationResult

```typescript
/**
 * Result of verifying an attestation, including each step of the verification
 * pipeline and the overall verdict.
 */
interface VerificationResult {
  /** Whether the attestation is valid */
  isValid: boolean;

  /** Overall verification status */
  status: 'valid' | 'invalid' | 'expired' | 'revoked' | 'suspended' | 'unknown';

  /** The attestation that was verified */
  attestationId: string;

  /** Individual verification steps and their results */
  steps: VerificationStep[];

  /** Warnings (non-fatal issues) */
  warnings: VerificationWarning[];

  /** Timestamp of verification */
  verifiedAt: Date;

  /** How long verification took (ms) */
  durationMs: number;

  /** Verifier identity (if known) */
  verifierWallet?: string;

  /** Chain of trust from attestation to root issuer */
  trustChain: TrustChainLink[];
}

interface VerificationStep {
  /** Step name */
  name: VerificationStepName;

  /** Whether this step passed */
  passed: boolean;

  /** Human-readable description of what was checked */
  description: string;

  /** Details of the check result */
  details?: Record<string, unknown>;

  /** Error message if step failed */
  error?: string;

  /** Duration of this step (ms) */
  durationMs: number;
}

type VerificationStepName =
  | 'signature_check'       // Verify issuer's cryptographic signature
  | 'expiry_check'          // Check if attestation has expired
  | 'revocation_check'      // Check revocation registry
  | 'issuer_authority'      // Verify issuer is authorized for this schema
  | 'issuer_active'         // Verify issuer account is still active
  | 'schema_conformance'    // Verify claims match schema definition
  | 'on_chain_anchor'       // Verify on-chain data matches off-chain
  | 'data_integrity'        // Verify data hash matches content
  | 'delegation_check'      // If delegated, verify delegation chain
  | 'trust_policy'          // Verify against verifier's trust policy
  | 'temporal_validity';    // Verify issuance date is reasonable

interface VerificationWarning {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

interface TrustChainLink {
  /** Wallet address at this level */
  wallet: string;

  /** Role at this level */
  role: 'issuer' | 'delegate' | 'root';

  /** Authority level */
  authorityLevel: IssuerAuthorityLevel;

  /** Whether this entity is currently trusted */
  isTrusted: boolean;
}

interface VerificationPolicy {
  /** Minimum issuer authority level required */
  minIssuerAuthority: IssuerAuthorityLevel;

  /** Trusted issuer whitelist (empty = trust all registered) */
  trustedIssuers: string[];

  /** Blocked issuers */
  blockedIssuers: string[];

  /** Whether to require on-chain anchoring */
  requireOnChain: boolean;

  /** Maximum acceptable attestation age (ms) */
  maxAge?: number;

  /** Whether to accept delegated attestations */
  acceptDelegated: boolean;

  /** Maximum delegation depth */
  maxDelegationDepth: number;

  /** Required schemas */
  requiredSchemas?: string[];

  /** Custom verification hooks */
  hooks?: VerificationHook[];
}

interface VerificationHook {
  /** When to run this hook */
  stage: 'before' | 'after' | 'on_failure';

  /** Hook function */
  handler: (context: VerificationContext) => Promise<VerificationHookResult>;
}
```

### RevocationRegistry

```typescript
/**
 * Manages the revocation state of attestations. Uses an on-chain bitmap
 * for efficient batch revocation checks.
 */
interface RevocationRegistry {
  /** Registry identifier */
  id: string;

  /** On-chain account address of the registry */
  onChainAddress: string;

  /** Issuer who owns this registry */
  issuerWallet: string;

  /** Capacity (max number of attestations tracked) */
  capacity: number;

  /** Current count of revoked attestations */
  revokedCount: number;

  /** Registry version */
  version: number;

  /** When the registry was created */
  createdAt: Date;

  /** Last revocation timestamp */
  lastRevokedAt: Date | null;
}

interface RevocationEntry {
  /** Attestation ID that was revoked */
  attestationId: string;

  /** Index in the revocation bitmap */
  registryIndex: number;

  /** Registry this entry belongs to */
  registryId: string;

  /** Who performed the revocation */
  revokerWallet: string;

  /** Reason for revocation */
  reason: RevocationReason;

  /** Additional context for the revocation */
  reasonDetail?: string;

  /** On-chain transaction signature of the revocation */
  txSignature: string;

  /** When the revocation occurred */
  revokedAt: Date;
}

type RevocationReason =
  | 'credential_expired'       // Underlying credential no longer valid
  | 'information_changed'      // Attested information is no longer accurate
  | 'issuer_compromised'       // Issuer's key was compromised
  | 'subject_request'          // Subject requested revocation
  | 'fraud_detected'           // Fraudulent attestation detected
  | 'policy_violation'         // Violates issuer or platform policy
  | 'superseded'               // Replaced by a newer attestation
  | 'issuer_deauthorized'      // Issuer lost their authority
  | 'legal_requirement'        // Required by legal/regulatory action
  | 'other';                   // Other reason (detail required)
```

### SelectiveDisclosure & Privacy

```typescript
/**
 * Selective disclosure allows subjects to prove specific claims from an
 * attestation without revealing the entire attestation content.
 */
interface SelectiveDisclosure {
  /** The attestation being partially disclosed */
  attestationId: string;

  /** Fields being disclosed */
  disclosedFields: string[];

  /** Merkle proof for the disclosed fields */
  merkleProofs: MerkleProof[];

  /** The disclosed claim values */
  disclosedClaims: Record<string, AttestationClaimValue>;

  /** Attestation metadata (always disclosed) */
  metadata: {
    schemaId: string;
    issuerWallet: string;
    issuedAt: Date;
    expiresAt: Date | null;
    status: AttestationStatus;
  };

  /** Proof generation timestamp */
  generatedAt: Date;

  /** Proof expiry (to prevent replay) */
  proofExpiresAt: Date;

  /** Nonce for replay protection */
  nonce: string;
}

interface MerkleProof {
  /** Field name this proof is for */
  fieldName: string;

  /** Leaf hash */
  leaf: string;

  /** Proof path (sibling hashes) */
  proof: string[];

  /** Proof index */
  index: number;
}

interface DisclosureRequest {
  /** Which attestation to disclose from */
  attestationId: string;

  /** Which fields the verifier wants to see */
  requestedFields: string[];

  /** Verifier's wallet (for binding the proof) */
  verifierWallet: string;

  /** Purpose of the disclosure (displayed to subject) */
  purpose: string;

  /** How long the proof should be valid */
  proofValidityMs: number;

  /** Whether ZK proof is requested instead of selective disclosure */
  useZKProof?: boolean;

  /** For ZK: conditions to prove without revealing values */
  zkConditions?: ZKCondition[];
}

interface ZKCondition {
  /** Field to prove a condition about */
  field: string;

  /** Condition operator */
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'in' | 'range';

  /** Value to compare against */
  value: AttestationClaimValue;

  /** For range: upper bound */
  upperBound?: AttestationClaimValue;
}

interface ZKProof {
  /** The proof bytes */
  proof: Uint8Array;

  /** Public inputs to the circuit */
  publicInputs: string[];

  /** Circuit identifier */
  circuitId: string;

  /** Verification key hash */
  verificationKeyHash: string;

  /** Conditions that were proven */
  provenConditions: ZKCondition[];

  /** Attestation metadata (public) */
  attestationMetadata: {
    schemaId: string;
    issuerWallet: string;
    issuedAt: Date;
  };

  /** Proof generation timestamp */
  generatedAt: Date;

  /** Nonce */
  nonce: string;
}
```

---

## Database Schemas

### attestations

```typescript
import { pgTable, uuid, varchar, text, jsonb, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';

export const attestations = pgTable('attestations', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Schema reference
  schemaId: uuid('schema_id').notNull().references(() => attestationSchemas.id),
  schemaVersion: integer('schema_version').notNull(),

  // Parties
  issuerWallet: varchar('issuer_wallet', { length: 64 }).notNull(),
  subjectWallet: varchar('subject_wallet', { length: 64 }).notNull(),

  // Claims data
  claims: jsonb('claims').notNull().$type<Record<string, AttestationClaimValue>>(),
  dataHash: varchar('data_hash', { length: 128 }).notNull(),
  merkleRoot: varchar('merkle_root', { length: 128 }).notNull(),

  // Status and lifecycle
  status: varchar('status', { length: 20 }).notNull().default('active'),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revocationReason: varchar('revocation_reason', { length: 50 }),
  revocationDetail: text('revocation_detail'),

  // Cryptographic proof
  signature: text('signature').notNull(),

  // On-chain data
  onChainTxSignature: varchar('on_chain_tx_signature', { length: 128 }),
  onChainAddress: varchar('on_chain_address', { length: 64 }),

  // Metadata
  metadata: jsonb('metadata').$type<AttestationMetadata>(),
  name: varchar('name', { length: 256 }),
  description: text('description'),
  imageUri: text('image_uri'),

  // Delegation
  delegationId: uuid('delegation_id').references(() => issuerDelegations.id),

  // Context
  ventureId: uuid('venture_id').notNull(),
  platformId: varchar('platform_id', { length: 64 }).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes
  subjectIdx: index('att_subject_idx').on(table.subjectWallet),
  issuerIdx: index('att_issuer_idx').on(table.issuerWallet),
  schemaIdx: index('att_schema_idx').on(table.schemaId),
  statusIdx: index('att_status_idx').on(table.status),
  ventureIdx: index('att_venture_idx').on(table.ventureId),
  issuedAtIdx: index('att_issued_at_idx').on(table.issuedAt),
  expiresAtIdx: index('att_expires_at_idx').on(table.expiresAt),
  dataHashIdx: index('att_data_hash_idx').on(table.dataHash),
  onChainAddressIdx: index('att_on_chain_address_idx').on(table.onChainAddress),
  subjectSchemaIdx: index('att_subject_schema_idx').on(table.subjectWallet, table.schemaId),
  issuerStatusIdx: index('att_issuer_status_idx').on(table.issuerWallet, table.status),
}));
```

### attestation_schemas

```typescript
export const attestationSchemas = pgTable('attestation_schemas', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Identity
  name: varchar('name', { length: 128 }).notNull(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  description: text('description').notNull(),
  version: integer('version').notNull().default(1),

  // Schema definition
  fields: jsonb('fields').notNull().$type<SchemaField[]>(),
  category: varchar('category', { length: 50 }).notNull(),

  // Ownership
  creatorWallet: varchar('creator_wallet', { length: 64 }).notNull(),
  ventureId: uuid('venture_id').notNull(),

  // Access control
  isPublic: boolean('is_public').notNull().default(true),
  requiredAuthorityLevel: varchar('required_authority_level', { length: 20 })
    .notNull()
    .default('standard'),

  // Inheritance
  extendsSchemas: jsonb('extends_schemas').$type<string[]>().default([]),

  // On-chain
  onChainAddress: varchar('on_chain_address', { length: 64 }),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('active'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('schema_name_idx').on(table.name),
  categoryIdx: index('schema_category_idx').on(table.category),
  creatorIdx: index('schema_creator_idx').on(table.creatorWallet),
  ventureIdx: index('schema_venture_idx').on(table.ventureId),
  statusIdx: index('schema_status_idx').on(table.status),
  slugIdx: index('schema_slug_idx').on(table.slug),
}));
```

### issuers

```typescript
export const issuers = pgTable('issuers', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Identity
  wallet: varchar('wallet', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description'),

  // Authority
  authorityLevel: varchar('authority_level', { length: 20 }).notNull().default('basic'),
  authorizedSchemas: jsonb('authorized_schemas').$type<string[]>().default([]),
  universalAuthority: boolean('universal_authority').notNull().default(false),

  // Status
  isActive: boolean('is_active').notNull().default(true),
  registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
  deactivationReason: text('deactivation_reason'),

  // Reputation (denormalized for performance)
  reputationScore: integer('reputation_score').notNull().default(500),
  totalIssued: integer('total_issued').notNull().default(0),
  totalRevoked: integer('total_revoked').notNull().default(0),

  // On-chain
  onChainAddress: varchar('on_chain_address', { length: 64 }),

  // Context
  ventureId: uuid('venture_id').notNull(),
  verificationUri: text('verification_uri'),
  logoUri: text('logo_uri'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  walletIdx: index('issuer_wallet_idx').on(table.wallet),
  authorityIdx: index('issuer_authority_idx').on(table.authorityLevel),
  ventureIdx: index('issuer_venture_idx').on(table.ventureId),
  activeIdx: index('issuer_active_idx').on(table.isActive),
  reputationIdx: index('issuer_reputation_idx').on(table.reputationScore),
}));
```

### reputation_scores

```typescript
export const reputationScores = pgTable('reputation_scores', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Subject
  subjectWallet: varchar('subject_wallet', { length: 64 }).notNull(),

  // Scores
  overallScore: integer('overall_score').notNull().default(0),
  confidence: integer('confidence').notNull().default(0), // 0-100 (stored as int, /100 for float)
  percentile: integer('percentile').notNull().default(0),

  // Dimensions (JSONB for flexibility)
  dimensions: jsonb('dimensions').notNull().$type<ReputationDimension[]>().default([]),

  // Stats
  attestationCount: integer('attestation_count').notNull().default(0),
  issuerCount: integer('issuer_count').notNull().default(0),
  trend: varchar('trend', { length: 20 }).notNull().default('stable'),
  thirtyDayChange: integer('thirty_day_change').notNull().default(0),

  // History (recent snapshots, older ones archived)
  history: jsonb('history').$type<ReputationHistory[]>().default([]),

  // Context
  ventureId: uuid('venture_id').notNull(),

  // Computation tracking
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
  nextComputeAt: timestamp('next_compute_at', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  subjectIdx: index('rep_subject_idx').on(table.subjectWallet),
  overallScoreIdx: index('rep_overall_score_idx').on(table.overallScore),
  ventureIdx: index('rep_venture_idx').on(table.ventureId),
  percentileIdx: index('rep_percentile_idx').on(table.percentile),
  computedAtIdx: index('rep_computed_at_idx').on(table.computedAt),
  subjectVentureIdx: index('rep_subject_venture_idx').on(table.subjectWallet, table.ventureId),
}));
```

### revocations

```typescript
export const revocations = pgTable('revocations', {
  id: uuid('id').defaultRandom().primaryKey(),

  // What was revoked
  attestationId: uuid('attestation_id').notNull().references(() => attestations.id),

  // Registry tracking
  registryId: varchar('registry_id', { length: 64 }).notNull(),
  registryIndex: integer('registry_index').notNull(),

  // Who revoked and why
  revokerWallet: varchar('revoker_wallet', { length: 64 }).notNull(),
  reason: varchar('reason', { length: 50 }).notNull(),
  reasonDetail: text('reason_detail'),

  // On-chain proof
  txSignature: varchar('tx_signature', { length: 128 }).notNull(),

  // Timestamps
  revokedAt: timestamp('revoked_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  attestationIdx: index('rev_attestation_idx').on(table.attestationId),
  revokerIdx: index('rev_revoker_idx').on(table.revokerWallet),
  registryIdx: index('rev_registry_idx').on(table.registryId),
  reasonIdx: index('rev_reason_idx').on(table.reason),
  revokedAtIdx: index('rev_revoked_at_idx').on(table.revokedAt),
}));
```

### verification_logs

```typescript
export const verificationLogs = pgTable('verification_logs', {
  id: uuid('id').defaultRandom().primaryKey(),

  // What was verified
  attestationId: uuid('attestation_id').notNull().references(() => attestations.id),

  // Who verified
  verifierWallet: varchar('verifier_wallet', { length: 64 }),
  verifierIp: varchar('verifier_ip', { length: 45 }), // IPv6 max length

  // Result
  isValid: boolean('is_valid').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  steps: jsonb('steps').notNull().$type<VerificationStep[]>(),
  warnings: jsonb('warnings').$type<VerificationWarning[]>().default([]),

  // Trust chain
  trustChain: jsonb('trust_chain').$type<TrustChainLink[]>().default([]),

  // Performance
  durationMs: integer('duration_ms').notNull(),

  // Policy used
  policyId: varchar('policy_id', { length: 64 }),

  // Context
  ventureId: uuid('venture_id').notNull(),
  purpose: varchar('purpose', { length: 256 }),

  // Timestamps
  verifiedAt: timestamp('verified_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  attestationIdx: index('vlog_attestation_idx').on(table.attestationId),
  verifierIdx: index('vlog_verifier_idx').on(table.verifierWallet),
  isValidIdx: index('vlog_is_valid_idx').on(table.isValid),
  ventureIdx: index('vlog_venture_idx').on(table.ventureId),
  verifiedAtIdx: index('vlog_verified_at_idx').on(table.verifiedAt),
}));
```

### issuer_delegations

```typescript
export const issuerDelegations = pgTable('issuer_delegations', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Parties
  delegatorWallet: varchar('delegator_wallet', { length: 64 }).notNull(),
  delegateWallet: varchar('delegate_wallet', { length: 64 }).notNull(),

  // Scope
  allowedSchemas: jsonb('allowed_schemas').$type<string[]>().notNull().default([]),
  maxIssuances: integer('max_issuances'),
  currentIssuances: integer('current_issuances').notNull().default(0),

  // Permissions
  canSubDelegate: boolean('can_sub_delegate').notNull().default(false),

  // Lifecycle
  status: varchar('status', { length: 20 }).notNull().default('active'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),

  // On-chain
  onChainAddress: varchar('on_chain_address', { length: 64 }),
  txSignature: varchar('tx_signature', { length: 128 }),

  // Context
  ventureId: uuid('venture_id').notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  delegatorIdx: index('deleg_delegator_idx').on(table.delegatorWallet),
  delegateIdx: index('deleg_delegate_idx').on(table.delegateWallet),
  statusIdx: index('deleg_status_idx').on(table.status),
  expiresIdx: index('deleg_expires_idx').on(table.expiresAt),
  ventureIdx: index('deleg_venture_idx').on(table.ventureId),
}));
```

### attestation_tags

```typescript
export const attestationTags = pgTable('attestation_tags', {
  id: uuid('id').defaultRandom().primaryKey(),

  attestationId: uuid('attestation_id').notNull().references(() => attestations.id, {
    onDelete: 'cascade',
  }),
  tag: varchar('tag', { length: 100 }).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  attestationIdx: index('tag_attestation_idx').on(table.attestationId),
  tagIdx: index('tag_tag_idx').on(table.tag),
  compositeIdx: index('tag_composite_idx').on(table.attestationId, table.tag),
}));
```

### schema_versions

```typescript
export const schemaVersions = pgTable('schema_versions', {
  id: uuid('id').defaultRandom().primaryKey(),

  schemaId: uuid('schema_id').notNull().references(() => attestationSchemas.id),
  version: integer('version').notNull(),

  // Schema definition at this version
  fields: jsonb('fields').notNull().$type<SchemaField[]>(),

  // Migration info
  migrationNotes: text('migration_notes'),
  breakingChange: boolean('breaking_change').notNull().default(false),

  // Who published this version
  publishedBy: varchar('published_by', { length: 64 }).notNull(),

  // Timestamps
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  schemaIdx: index('sv_schema_idx').on(table.schemaId),
  versionIdx: index('sv_version_idx').on(table.schemaId, table.version),
}));
```

---

## Code Examples

### 1. Issue an Attestation (Skill Certification)

```typescript
import { AttestationService, SchemaService, IssuerService } from '@mcv/web3-public/attestation';
import { Keypair, PublicKey } from '@solana/web3.js';

async function issueSkillCertification() {
  const attestationService = new AttestationService({
    connection,
    programId: ATTESTATION_PROGRAM_ID,
    db,
  });

  const schemaService = new SchemaService({ db });
  const issuerService = new IssuerService({ db });

  // Step 1: Ensure issuer is registered
  const issuerKeypair = Keypair.fromSecretKey(/* ... */);
  const issuer = await issuerService.getByWallet(issuerKeypair.publicKey);

  if (!issuer) {
    throw new AttestationError(
      AttestationErrorCode.ISSUER_NOT_REGISTERED,
      'Issuer must be registered before issuing attestations',
    );
  }

  // Step 2: Get or create the schema
  let schema = await schemaService.getBySlug('solana-developer-certification');

  if (!schema) {
    schema = await schemaService.create({
      name: 'Solana Developer Certification',
      slug: 'solana-developer-certification',
      description: 'Certifies competency in Solana development',
      category: 'certification',
      fields: [
        {
          name: 'skillName',
          label: 'Skill Name',
          type: 'string',
          required: true,
          disclosable: true,
          constraints: [{ type: 'maxLength', value: 128 }],
        },
        {
          name: 'proficiencyLevel',
          label: 'Proficiency Level',
          type: 'enum',
          required: true,
          disclosable: true,
          enumValues: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
        {
          name: 'assessmentScore',
          label: 'Assessment Score',
          type: 'integer',
          required: true,
          disclosable: true,
          constraints: [
            { type: 'min', value: 0 },
            { type: 'max', value: 100 },
          ],
        },
        {
          name: 'assessmentDate',
          label: 'Assessment Date',
          type: 'date',
          required: true,
          disclosable: true,
        },
        {
          name: 'certificationId',
          label: 'Certification ID',
          type: 'string',
          required: true,
          disclosable: false, // Internal tracking, not disclosable
        },
        {
          name: 'specializations',
          label: 'Specializations',
          type: 'array',
          required: false,
          disclosable: true,
        },
      ],
      requiredAuthorityLevel: 'trusted',
      ventureId: 'venture-uuid',
    }, issuerKeypair.publicKey.toBase58());
  }

  // Step 3: Issue the attestation
  const subjectWallet = new PublicKey('SubjectWa11etAddress...');

  const attestation = await attestationService.issue(
    {
      schemaId: schema.id,
      subjectWallet,
      claims: {
        skillName: 'Solana Program Development',
        proficiencyLevel: 'advanced',
        assessmentScore: 92,
        assessmentDate: new Date('2025-11-15'),
        certificationId: 'CERT-SOL-2025-00847',
        specializations: ['Anchor Framework', 'Token Extensions', 'cNFTs'],
      },
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      metadata: {
        name: 'Solana Developer Certification — Advanced',
        description: 'Certifies advanced proficiency in Solana program development',
        imageUri: 'https://certs.example.com/badges/solana-dev-advanced.png',
        evidence: [
          {
            type: 'assessment',
            uri: 'https://certs.example.com/assessments/SOL-2025-00847',
            hash: 'sha256:abc123...',
            description: 'Online proctored assessment results',
          },
        ],
      },
      tags: ['solana', 'development', 'certification', 'advanced'],
    },
    issuerKeypair,
    {
      commitment: 'confirmed',
      notifySubject: true,
      memo: 'Solana Developer Certification — Advanced Level',
    },
  );

  console.log('Attestation issued:', {
    id: attestation.id,
    status: attestation.status,
    onChainTx: attestation.onChainTxSignature,
    onChainAddress: attestation.onChainAddress,
    merkleRoot: attestation.merkleRoot,
  });

  return attestation;
}
```

### 2. Verify an Attestation

```typescript
import { VerificationService } from '@mcv/web3-public/attestation';

async function verifyAttestation(attestationId: string) {
  const verificationService = new VerificationService({
    connection,
    programId: ATTESTATION_PROGRAM_ID,
    db,
  });

  // Define the verification policy for this verifier
  const policy: VerificationPolicy = {
    minIssuerAuthority: 'trusted',
    trustedIssuers: [], // Empty = trust all registered issuers
    blockedIssuers: ['BlockedIssuerWa11et...'],
    requireOnChain: true,
    maxAge: 365 * 24 * 60 * 60 * 1000, // Max 1 year old
    acceptDelegated: true,
    maxDelegationDepth: 2,
  };

  // Perform verification
  const result = await verificationService.verify(attestationId, {
    policy,
    verifierWallet: 'VerifierWa11etAddress...',
    includeOnChainCheck: true,
  });

  console.log('Verification result:', {
    isValid: result.isValid,
    status: result.status,
    durationMs: result.durationMs,
  });

  // Inspect individual steps
  for (const step of result.steps) {
    console.log(`  ${step.passed ? '✅' : '❌'} ${step.name}: ${step.description}`);
    if (!step.passed && step.error) {
      console.log(`     Error: ${step.error}`);
    }
  }

  // Check warnings
  if (result.warnings.length > 0) {
    console.log('Warnings:');
    for (const warning of result.warnings) {
      console.log(`  ⚠️ [${warning.severity}] ${warning.message}`);
    }
  }

  // Inspect trust chain
  console.log('Trust chain:');
  for (const link of result.trustChain) {
    console.log(`  ${link.role} (${link.authorityLevel}): ${link.wallet} — trusted: ${link.isTrusted}`);
  }

  return result;
}

// === Batch Verification ===

async function batchVerify(attestationIds: string[]) {
  const verificationService = new VerificationService({
    connection,
    programId: ATTESTATION_PROGRAM_ID,
    db,
  });

  const results = await verificationService.batchVerify(attestationIds, {
    policy: {
      minIssuerAuthority: 'standard',
      trustedIssuers: [],
      blockedIssuers: [],
      requireOnChain: false, // Allow off-chain for speed
      acceptDelegated: true,
      maxDelegationDepth: 3,
    },
    concurrency: 10,
    continueOnError: true,
  });

  const valid = results.filter(r => r.isValid).length;
  const invalid = results.filter(r => !r.isValid).length;

  console.log(`Batch verification: ${valid} valid, ${invalid} invalid out of ${results.length}`);

  return results;
}
```

### 3. Build and Query Reputation Scores

```typescript
import { ReputationService, AttestationService } from '@mcv/web3-public/attestation';

async function setupReputationSystem() {
  const reputationService = new ReputationService({ db });

  // Configure reputation dimensions and weights
  const config: ReputationConfig = {
    dimensions: [
      {
        schemaIdOrCategory: 'certification',
        dimension: 'technical_skill',
        weight: 0.3,
        issuerAuthorityMultiplier: {
          basic: 0.5,
          standard: 0.8,
          trusted: 1.0,
          authority: 1.2,
          root: 1.5,
        },
        decayRatePerDay: 0.001, // Skills decay slowly
        minAgeDays: 0,
        maxAgeDays: 730, // 2 years max relevance
      },
      {
        schemaIdOrCategory: 'education',
        dimension: 'education',
        weight: 0.2,
        issuerAuthorityMultiplier: {
          basic: 0.3,
          standard: 0.6,
          trusted: 1.0,
          authority: 1.2,
          root: 1.5,
        },
        decayRatePerDay: 0.0002, // Education decays very slowly
        minAgeDays: 0,
        maxAgeDays: null, // Never expires
      },
      {
        schemaIdOrCategory: 'achievement',
        dimension: 'accomplishments',
        weight: 0.15,
        issuerAuthorityMultiplier: {
          basic: 0.7,
          standard: 0.9,
          trusted: 1.0,
          authority: 1.1,
          root: 1.3,
        },
        decayRatePerDay: 0.0005,
        minAgeDays: 0,
        maxAgeDays: 1095, // 3 years
      },
      {
        schemaIdOrCategory: 'employment',
        dimension: 'experience',
        weight: 0.25,
        issuerAuthorityMultiplier: {
          basic: 0.4,
          standard: 0.7,
          trusted: 1.0,
          authority: 1.2,
          root: 1.4,
        },
        decayRatePerDay: 0.0003,
        minAgeDays: 30, // Must be employed 30+ days
        maxAgeDays: 1825, // 5 years
      },
      {
        schemaIdOrCategory: 'kyc',
        dimension: 'identity_verification',
        weight: 0.1,
        issuerAuthorityMultiplier: {
          basic: 0.0, // KYC only from trusted+ issuers
          standard: 0.5,
          trusted: 1.0,
          authority: 1.0,
          root: 1.0,
        },
        decayRatePerDay: 0.0,
        minAgeDays: 0,
        maxAgeDays: 365, // Re-verify annually
      },
    ],
    globalDecayMultiplier: 1.0,
    minAttestations: 3,
    minIssuers: 2,
    recomputeIntervalMs: 6 * 60 * 60 * 1000, // Every 6 hours
    weightByIssuerReputation: true,
    maxSingleAttestationBoost: 150,
    normalization: 'sigmoid',
  };

  await reputationService.configure(config, 'venture-uuid');

  // Compute reputation for a subject
  const subjectWallet = 'SubjectWa11etAddress...';

  const score = await reputationService.compute(subjectWallet, {
    ventureId: 'venture-uuid',
    forceRecompute: true,
  });

  console.log('Reputation score:', {
    overall: score.overallScore,
    confidence: score.confidence,
    percentile: score.percentile,
    trend: score.trend,
    attestations: score.attestationCount,
    issuers: score.issuerCount,
  });

  for (const dim of score.dimensions) {
    console.log(`  ${dim.label}: ${dim.score}/1000 (weight: ${dim.weight}, contribution: ${dim.contribution})`);
  }

  return score;
}

// Query reputation leaderboard
async function getReputationLeaderboard(ventureId: string) {
  const reputationService = new ReputationService({ db });

  const leaderboard = await reputationService.getLeaderboard({
    ventureId,
    dimension: 'technical_skill', // Optional: filter by dimension
    limit: 50,
    minConfidence: 0.5,
  });

  for (const entry of leaderboard) {
    console.log(`#${entry.rank} ${entry.subjectWallet}: ${entry.overallScore} (${entry.trend})`);
  }

  return leaderboard;
}
```

### 4. Selective Disclosure and Zero-Knowledge Proofs

```typescript
import { DisclosureService, VerificationService } from '@mcv/web3-public/attestation';

// === Subject: Generate Selective Disclosure Proof ===

async function generateSelectiveDisclosure(
  attestationId: string,
  subjectKeypair: Keypair,
) {
  const disclosureService = new DisclosureService({ db });

  // A verifier requests specific fields
  const request: DisclosureRequest = {
    attestationId,
    requestedFields: ['skillName', 'proficiencyLevel'], // Only these fields
    verifierWallet: 'VerifierWa11et...',
    purpose: 'Job application — verify Solana development skill level',
    proofValidityMs: 60 * 60 * 1000, // 1 hour validity
  };

  // Subject generates the proof (only they can, as they hold the attestation)
  const disclosure = await disclosureService.generateSelectiveProof(
    request,
    subjectKeypair,
  );

  console.log('Selective disclosure generated:', {
    attestationId: disclosure.attestationId,
    disclosedFields: disclosure.disclosedFields,
    disclosedClaims: disclosure.disclosedClaims,
    // Note: only requested fields are visible
    // assessmentScore, certificationId, etc. are NOT included
    proofExpiresAt: disclosure.proofExpiresAt,
  });

  // The subject sends this disclosure to the verifier
  return disclosure;
}

// === Verifier: Verify Selective Disclosure ===

async function verifySelectiveDisclosure(disclosure: SelectiveDisclosure) {
  const disclosureService = new DisclosureService({ db });
  const verificationService = new VerificationService({
    connection,
    programId: ATTESTATION_PROGRAM_ID,
    db,
  });

  // Step 1: Verify the Merkle proofs (disclosed fields match the attestation)
  const proofValid = await disclosureService.verifySelectiveProof(disclosure);

  if (!proofValid) {
    console.error('Selective disclosure proof is invalid!');
    return false;
  }

  // Step 2: Verify the underlying attestation is still valid
  const attestationResult = await verificationService.verify(
    disclosure.attestationId,
    {
      policy: {
        minIssuerAuthority: 'trusted',
        trustedIssuers: [],
        blockedIssuers: [],
        requireOnChain: true,
        acceptDelegated: true,
        maxDelegationDepth: 2,
      },
    },
  );

  if (!attestationResult.isValid) {
    console.error('Underlying attestation is not valid:', attestationResult.status);
    return false;
  }

  // Step 3: Check proof hasn't expired
  if (new Date() > disclosure.proofExpiresAt) {
    console.error('Disclosure proof has expired');
    return false;
  }

  console.log('Selective disclosure verified!');
  console.log('Disclosed claims:', disclosure.disclosedClaims);
  // Output: { skillName: 'Solana Program Development', proficiencyLevel: 'advanced' }
  // The verifier sees ONLY these fields. Nothing else.

  return true;
}

// === Zero-Knowledge Proof: Prove conditions without revealing values ===

async function generateZKProof(
  attestationId: string,
  subjectKeypair: Keypair,
) {
  const disclosureService = new DisclosureService({ db });

  // Prove you scored above 80 without revealing the exact score
  // Prove you have "advanced" or "expert" proficiency without revealing which
  const request: DisclosureRequest = {
    attestationId,
    requestedFields: [], // No fields disclosed directly
    verifierWallet: 'VerifierWa11et...',
    purpose: 'Verify minimum qualification threshold',
    proofValidityMs: 30 * 60 * 1000, // 30 minutes
    useZKProof: true,
    zkConditions: [
      {
        field: 'assessmentScore',
        operator: 'gte',
        value: 80,
      },
      {
        field: 'proficiencyLevel',
        operator: 'in',
        value: ['advanced', 'expert'],
      },
      {
        field: 'assessmentDate',
        operator: 'gte',
        value: new Date('2024-01-01'), // Assessed after Jan 2024
      },
    ],
  };

  const zkProof = await disclosureService.generateZKProof(
    request,
    subjectKeypair,
  );

  console.log('ZK Proof generated:', {
    circuitId: zkProof.circuitId,
    provenConditions: zkProof.provenConditions.length,
    // The verifier can confirm: score >= 80, level in [advanced, expert], date >= 2024
    // But they NEVER learn the actual values
  });

  return zkProof;
}

// === Verifier: Verify ZK Proof ===

async function verifyZKProof(proof: ZKProof) {
  const disclosureService = new DisclosureService({ db });

  const isValid = await disclosureService.verifyZKProof(proof);

  console.log('ZK Proof valid:', isValid);
  console.log('Proven conditions:');
  for (const condition of proof.provenConditions) {
    console.log(`  ${condition.field} ${condition.operator} ${condition.value}: ✅`);
  }
  // Output:
  //   assessmentScore gte 80: ✅
  //   proficiencyLevel in [advanced, expert]: ✅
  //   assessmentDate gte 2024-01-01: ✅
  // No actual values are known to the verifier!

  return isValid;
}
```

### 5. Cross-Platform Attestation Portability

```typescript
import { CrossPlatformService, AttestationService } from '@mcv/web3-public/attestation';

async function portAttestationBetweenPlatforms() {
  const crossPlatformService = new CrossPlatformService({
    connection,
    programId: ATTESTATION_PROGRAM_ID,
    db,
  });

  // === Export from source platform/venture ===

  const sourceAttestationId = 'source-attestation-uuid';
  const subjectKeypair = Keypair.fromSecretKey(/* ... */);

  // Create a portable attestation bundle
  const bundle = await crossPlatformService.exportAttestation(
    sourceAttestationId,
    subjectKeypair, // Subject must authorize the export
    {
      targetPlatformId: 'target-venture-platform-id',
      includeEvidence: true,
      includeIssuerChain: true,
      format: 'mcv-portable', // or 'w3c-vc' for external interop
    },
  );

  console.log('Attestation exported:', {
    sourceId: bundle.sourceAttestationId,
    sourcePlatform: bundle.sourcePlatformId,
    targetPlatform: bundle.targetPlatformId,
    format: bundle.format,
    // The bundle includes:
    // - The attestation data
    // - On-chain proof references
    // - Issuer chain of trust
    // - Schema mapping hints
    // - Subject's authorization signature
  });

  // === Import into target platform/venture ===

  const imported = await crossPlatformService.importAttestation(
    bundle,
    {
      ventureId: 'target-venture-uuid',
      // Schema mapping: map source schema fields to target schema
      schemaMapping: {
        sourceSchemaId: 'source-schema-uuid',
        targetSchemaId: 'target-schema-uuid',
        fieldMapping: {
          'skillName': 'skill_title',         // Rename field
          'proficiencyLevel': 'level',        // Rename field
          'assessmentScore': 'score',         // Rename field
          'assessmentDate': 'assessed_at',    // Rename field
          // Fields not mapped are preserved in metadata
        },
      },
      // Trust policy for cross-platform imports
      trustPolicy: {
        requireOnChainVerification: true,
        minimumIssuerAuthority: 'trusted',
        acceptFromPlatforms: ['source-platform-id'],
        maxAge: 180 * 24 * 60 * 60 * 1000, // 180 days
      },
      // How to handle the imported attestation
      importBehavior: {
        status: 'active',  // or 'pending' for manual review
        preserveOriginalIssuer: true,
        addCrossPlatformTag: true,
        linkToSource: true,
      },
    },
  );

  console.log('Attestation imported:', {
    newId: imported.id,
    sourceId: imported.metadata?.custom?.sourceAttestationId,
    status: imported.status,
    crossPlatform: true,
  });

  return imported;
}

// === Resolve attestations across platforms ===

async function resolveAttestationsAcrossPlatforms(subjectWallet: string) {
  const crossPlatformService = new CrossPlatformService({
    connection,
    programId: ATTESTATION_PROGRAM_ID,
    db,
  });

  // Find all attestations for this subject across all ventures
  const allAttestations = await crossPlatformService.resolveAll(
    subjectWallet,
    {
      ventures: ['venture-a-uuid', 'venture-b-uuid', 'venture-c-uuid'],
      includeExpired: false,
      includeRevoked: false,
      deduplication: 'prefer-newest', // or 'prefer-highest-authority'
    },
  );

  console.log(`Found ${allAttestations.length} attestations across platforms:`);

  for (const att of allAttestations) {
    console.log(`  [${att.platformId}] ${att.name || att.schemaId}: ${att.status}`);
  }

  // Merge into unified reputation view
  const unifiedReputation = await crossPlatformService.computeUnifiedReputation(
    subjectWallet,
    {
      ventures: ['venture-a-uuid', 'venture-b-uuid', 'venture-c-uuid'],
      deduplication: 'prefer-highest-authority',
      weightByPlatformTrust: true,
    },
  );

  console.log('Unified cross-platform reputation:', {
    overall: unifiedReputation.overallScore,
    platforms: unifiedReputation.platformBreakdown,
  });

  return { allAttestations, unifiedReputation };
}
```

### 6. Issuer Registration and Delegation

```typescript
import { IssuerService, SchemaService } from '@mcv/web3-public/attestation';

async function registerIssuerAndDelegate() {
  const issuerService = new IssuerService({
    connection,
    programId: ATTESTATION_PROGRAM_ID,
    db,
  });

  // === Register a new issuer ===

  const rootKeypair = Keypair.fromSecretKey(/* root authority keypair */);
  const newIssuerKeypair = Keypair.fromSecretKey(/* new issuer keypair */);

  const issuer = await issuerService.register({
    wallet: newIssuerKeypair.publicKey,
    name: 'Solana Bootcamp Academy',
    description: 'Accredited educational institution for Solana development training',
    authorityLevel: 'trusted',
    authorizedSchemas: [
      'solana-developer-certification-schema-uuid',
      'course-completion-schema-uuid',
      'hackathon-achievement-schema-uuid',
    ],
    universalAuthority: false,
    verificationUri: 'https://academy.example.com/.well-known/issuer-verification',
    logoUri: 'https://academy.example.com/logo.png',
    metadata: {
      website: 'https://academy.example.com',
      accreditation: 'Solana Foundation Accredited Partner',
      foundedYear: 2023,
    },
    ventureId: 'venture-uuid',
  }, rootKeypair);

  console.log('Issuer registered:', {
    id: issuer.id,
    wallet: issuer.wallet,
    authorityLevel: issuer.authorityLevel,
    onChainAddress: issuer.onChainAddress,
  });

  // === Delegate authority to a teaching assistant ===

  const taWallet = new PublicKey('TAWa11etAddress...');

  const delegation = await issuerService.delegate({
    delegateWallet: taWallet,
    allowedSchemas: ['course-completion-schema-uuid'], // TA can only issue course completions
    maxIssuances: 500, // Max 500 attestations under this delegation
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
    canSubDelegate: false, // TA cannot further delegate
  }, newIssuerKeypair);

  console.log('Authority delegated:', {
    id: delegation.id,
    delegate: delegation.delegateWallet,
    allowedSchemas: delegation.allowedSchemas,
    maxIssuances: delegation.maxIssuances,
    expiresAt: delegation.expiresAt,
  });

  // === Revoke delegation ===

  await issuerService.revokeDelegation(
    delegation.id,
    newIssuerKeypair,
    'End of semester — TA contract expired',
  );

  console.log('Delegation revoked');
}
```

### 7. KYC Attestation (Verify Once, Use Everywhere)

```typescript
import { AttestationService, VerificationService, DisclosureService } from '@mcv/web3-public/attestation';

// === KYC Provider: Issue KYC attestation after identity verification ===

async function issueKYCAttestation(
  subjectWallet: PublicKey,
  kycData: {
    fullName: string;
    dateOfBirth: Date;
    nationality: string;
    documentType: string;
    documentNumber: string;
    verificationMethod: string;
    riskScore: number;
  },
  kycProviderKeypair: Keypair,
) {
  const attestationService = new AttestationService({
    connection,
    programId: ATTESTATION_PROGRAM_ID,
    db,
  });

  // Issue the KYC attestation
  const kyc = await attestationService.issue(
    {
      schemaId: 'kyc-verification-schema-uuid',
      subjectWallet,
      claims: {
        fullName: kycData.fullName,
        dateOfBirth: kycData.dateOfBirth,
        nationality: kycData.nationality,
        documentType: kycData.documentType,
        documentNumber: kycData.documentNumber,
        verificationMethod: kycData.verificationMethod,
        riskScore: kycData.riskScore,
        verifiedAt: new Date(),
        amlScreeningPassed: true,
        sanctionsScreeningPassed: true,
      },
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Valid 1 year
      metadata: {
        name: 'KYC Verification',
        description: 'Identity verification completed by licensed KYC provider',
        evidence: [
          {
            type: 'verification',
            uri: 'https://kyc.example.com/verifications/VRF-2025-00123',
            hash: 'sha256:kyc-evidence-hash...',
            description: 'Automated + manual identity verification',
          },
        ],
      },
      tags: ['kyc', 'identity', 'aml'],
    },
    kycProviderKeypair,
    {
      commitment: 'finalized', // KYC needs highest confirmation
      notifySubject: true,
    },
  );

  return kyc;
}

// === DeFi Platform: Verify user's KYC without seeing their personal data ===

async function verifyKYCForDefi(
  subjectWallet: string,
  kycAttestationId: string,
) {
  const disclosureService = new DisclosureService({ db });
  const verificationService = new VerificationService({
    connection,
    programId: ATTESTATION_PROGRAM_ID,
    db,
  });

  // The DeFi platform only needs to know:
  // 1. KYC was completed
  // 2. Subject is NOT on sanctions list
  // 3. Subject is 18+
  // They do NOT need to see name, document number, nationality, etc.

  // Request ZK proof from the subject
  const request: DisclosureRequest = {
    attestationId: kycAttestationId,
    requestedFields: [], // We don't want to see ANY PII
    verifierWallet: 'DeFiPlatformWa11et...',
    purpose: 'DeFi protocol access — KYC compliance check',
    proofValidityMs: 15 * 60 * 1000, // 15 minutes
    useZKProof: true,
    zkConditions: [
      {
        field: 'dateOfBirth',
        operator: 'lt',
        value: new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000), // 18+ years ago
      },
      {
        field: 'sanctionsScreeningPassed',
        operator: 'eq',
        value: true,
      },
      {
        field: 'amlScreeningPassed',
        operator: 'eq',
        value: true,
      },
      {
        field: 'riskScore',
        operator: 'lte',
        value: 50, // Low-medium risk only
      },
    ],
  };

  // In practice, the subject generates this proof client-side
  // and submits it to the DeFi platform
  console.log('KYC verification request created');
  console.log('The DeFi platform learns NOTHING about the user except:');
  console.log('  - They are 18+');
  console.log('  - They passed sanctions screening');
  console.log('  - They passed AML screening');
  console.log('  - Their risk score is ≤ 50');
  console.log('Zero personal data is exposed.');

  return request;
}
```

### 8. Revocation Management

```typescript
import { RevocationService, AttestationService } from '@mcv/web3-public/attestation';

async function manageRevocations() {
  const revocationService = new RevocationService({
    connection,
    programId: ATTESTATION_PROGRAM_ID,
    db,
  });

  const attestationService = new AttestationService({
    connection,
    programId: ATTESTATION_PROGRAM_ID,
    db,
  });

  const issuerKeypair = Keypair.fromSecretKey(/* ... */);

  // === Revoke a single attestation ===

  const revocation = await revocationService.revoke(
    'attestation-to-revoke-uuid',
    issuerKeypair,
    {
      reason: 'information_changed',
      reasonDetail: 'Employee left the organization as of 2025-12-01',
    },
  );

  console.log('Attestation revoked:', {
    attestationId: revocation.attestationId,
    reason: revocation.reason,
    txSignature: revocation.txSignature,
    revokedAt: revocation.revokedAt,
  });

  // === Batch revocation (e.g., issuer key compromised) ===

  const compromisedAttestations = await attestationService.getByIssuer(
    issuerKeypair.publicKey,
    { status: 'active' },
  );

  const batchResult = await revocationService.batchRevoke(
    compromisedAttestations.map(a => a.id),
    issuerKeypair,
    {
      reason: 'issuer_compromised',
      reasonDetail: 'Issuer signing key was potentially compromised. All attestations revoked as a precaution.',
    },
  );

  console.log(`Batch revocation: ${batchResult.succeeded} revoked, ${batchResult.failed} failed`);

  // === Check revocation status ===

  const isRevoked = await revocationService.isRevoked('some-attestation-uuid');
  console.log('Is revoked:', isRevoked);

  // === Get revocation history for an attestation ===

  const history = await revocationService.getRevocationHistory('some-attestation-uuid');
  for (const entry of history) {
    console.log(`  Revoked at ${entry.revokedAt} by ${entry.revokerWallet}: ${entry.reason}`);
  }

  // === Create a new revocation registry (for high-volume issuers) ===

  const registry = await revocationService.createRegistry(
    issuerKeypair,
    {
      capacity: 10000, // Can track 10,000 attestations
      ventureId: 'venture-uuid',
    },
  );

  console.log('Revocation registry created:', {
    id: registry.id,
    onChainAddress: registry.onChainAddress,
    capacity: registry.capacity,
  });
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| `ATT_001` | `ISSUER_NOT_REGISTERED` | The signing wallet is not a registered issuer. Register via `IssuerService.register()` before issuing attestations. |
| `ATT_002` | `ISSUER_NOT_AUTHORIZED` | The issuer does not have authority to issue attestations for this schema. Check `authorizedSchemas` or request `universalAuthority`. |
| `ATT_003` | `ISSUER_DEACTIVATED` | The issuer account has been deactivated. Contact the registry administrator. |
| `ATT_004` | `SCHEMA_NOT_FOUND` | The specified schema ID does not exist. Verify the schema UUID or create a new schema via `SchemaService.create()`. |
| `ATT_005` | `SCHEMA_VALIDATION_FAILED` | The provided claims do not conform to the schema definition. Check field types, required fields, and constraints. |
| `ATT_006` | `ATTESTATION_NOT_FOUND` | No attestation exists with the given ID. Verify the UUID and ensure the attestation hasn't been deleted. |
| `ATT_007` | `ATTESTATION_EXPIRED` | The attestation has passed its `expiresAt` date. Request renewal from the issuer via `AttestationService.renew()`. |
| `ATT_008` | `ATTESTATION_REVOKED` | The attestation has been revoked by the issuer. Check `revocationReason` for details. |
| `ATT_009` | `SIGNATURE_INVALID` | The cryptographic signature on the attestation does not match the issuer's public key. The attestation may have been tampered with. |
| `ATT_010` | `ON_CHAIN_MISMATCH` | The on-chain data does not match the off-chain attestation data. Possible data corruption or tampering. |
| `ATT_011` | `DELEGATION_INVALID` | The delegation used to issue this attestation is invalid, expired, or revoked. Verify delegation status. |
| `ATT_012` | `DELEGATION_LIMIT_EXCEEDED` | The delegate has reached the maximum number of attestations allowed under this delegation. |
| `ATT_013` | `DELEGATION_SCHEMA_NOT_ALLOWED` | The delegate is not authorized to issue attestations for this schema under the current delegation. |
| `ATT_014` | `REVOCATION_UNAUTHORIZED` | Only the original issuer (or delegate with revocation rights) can revoke this attestation. |
| `ATT_015` | `ALREADY_REVOKED` | The attestation has already been revoked. No further revocation is needed. |
| `ATT_016` | `DISCLOSURE_FIELD_NOT_DISCLOSABLE` | One or more requested fields are marked as non-disclosable in the schema. Remove them from the disclosure request. |
| `ATT_017` | `DISCLOSURE_PROOF_EXPIRED` | The selective disclosure or ZK proof has expired. Request a new proof from the subject. |
| `ATT_018` | `DISCLOSURE_PROOF_INVALID` | The Merkle proof or ZK proof could not be verified. The proof may have been tampered with. |
| `ATT_019` | `ZK_CIRCUIT_NOT_FOUND` | The ZK circuit required for the requested proof conditions is not available. Ensure the circuit has been compiled and deployed. |
| `ATT_020` | `CROSS_PLATFORM_IMPORT_REJECTED` | The cross-platform attestation import was rejected by the trust policy. Check issuer authority, platform trust, and attestation age. |
| `ATT_021` | `REPUTATION_INSUFFICIENT_DATA` | Not enough attestations or issuers to compute a meaningful reputation score. Minimum thresholds not met. |
| `ATT_022` | `SCHEMA_VERSION_MISMATCH` | The attestation was issued against a different schema version than expected. Check version compatibility. |
| `ATT_023` | `ON_CHAIN_TX_FAILED` | The Solana transaction to anchor the attestation on-chain failed. Check balance, network status, and retry. |
| `ATT_024` | `BATCH_PARTIAL_FAILURE` | Some items in the batch operation succeeded while others failed. Check individual results for details. |
| `ATT_025` | `REGISTRY_CAPACITY_EXCEEDED` | The revocation registry has reached its maximum capacity. Create a new registry. |

---

## Security Considerations

### Attestation Integrity Is Everything

The value of this entire system rests on the integrity and trustworthiness of attestations. A compromised or fraudulent attestation undermines not just the individual credential but the entire trust network. Every design decision in this module prioritizes integrity.

### Cryptographic Guarantees

- **Issuer signatures**: Every attestation is signed with the issuer's Ed25519 private key (Solana keypair). The signature covers the full claims data, schema reference, subject, and timestamps. Any modification invalidates the signature.
- **On-chain anchoring**: Attestation data hashes are anchored on Solana as PDAs (Program Derived Addresses). This provides an immutable, timestamped record that cannot be forged or backdated. Even if the off-chain database is compromised, the on-chain anchor serves as ground truth.
- **Merkle trees**: Each attestation's claims are organized into a Merkle tree. The Merkle root is stored on-chain, enabling efficient selective disclosure proofs without revealing the full claim set.
- **Data hash verification**: A SHA-256 hash of the canonical attestation data is computed at issuance and stored both on-chain and off-chain. Any discrepancy between the two indicates tampering.

### Issuer Trust Model

- **Registry-based trust**: Only registered issuers can create valid attestations. The issuer registry is on-chain and managed by root authorities.
- **Authority levels**: Tiered authority system prevents low-trust issuers from issuing high-value attestations (e.g., KYC can only come from `trusted` or higher authority issuers).
- **Delegation chains**: Delegated authority has explicit scope limits (schemas, max issuances, time bounds) and cannot exceed the delegator's own authority level.
- **Issuer reputation**: Issuers who frequently revoke their own attestations or receive disputes have their reputation score reduced, which in turn reduces the weight of their attestations in reputation calculations.

### Revocation Security

- **Immediate effect**: Revocations take effect immediately. On-chain revocation registries use bitmaps for O(1) lookup.
- **Revocation reason tracking**: Every revocation requires a reason code. `issuer_compromised` triggers a cascade that revokes ALL attestations from that issuer.
- **Revocation proof**: Revocations are recorded on-chain with transaction signatures, creating an immutable audit trail.

### Privacy Protection

- **Selective disclosure**: Subjects control exactly which fields are revealed to verifiers. The Merkle proof mechanism ensures verifiers cannot infer undisclosed fields.
- **Zero-knowledge proofs**: For maximum privacy, ZK proofs allow proving conditions (e.g., "age ≥ 18") without revealing underlying values. The ZK circuit design prevents information leakage.
- **Proof binding**: Disclosure proofs are bound to a specific verifier wallet and have short expiry times, preventing replay attacks and proof reuse.
- **No subject tracking**: The verification service does not require subjects to be online or aware when their attestations are verified (though disclosure proofs require subject participation).

### Operational Security

- **Key management**: Issuer private keys should be stored in HSMs or secure key management systems. Never store issuer keys in application code or environment variables directly.
- **Rate limiting**: Issue and verification endpoints should be rate-limited to prevent abuse and denial-of-service.
- **Audit logging**: All verifications are logged (with verifier identity when available) for audit purposes. Logs should be immutable and retained according to compliance requirements.
- **Schema immutability**: Once a schema version is published on-chain, it cannot be modified. New versions can be created, but existing attestations always reference their original schema version.

---

## Environment Variables

```bash
# === Solana Configuration ===
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
SOLANA_COMMITMENT=confirmed

# === Program IDs ===
ATTESTATION_PROGRAM_ID=AttestProgramPub1icKeyBase58...
SCHEMA_REGISTRY_PROGRAM_ID=SchemaRegProgramPub1icKey...

# === Database ===
ATTESTATION_DATABASE_URL=postgresql://user:pass@host:5432/attestation_db

# === Issuer Configuration ===
# WARNING: In production, use a secure key management system (HSM/KMS)
# These environment variables are for development/testing ONLY
ISSUER_KEYPAIR_PATH=/secure/path/to/issuer-keypair.json
ROOT_AUTHORITY_WALLET=RootAuthorityWa11etPub1icKey...

# === Privacy / ZK Configuration ===
ZK_CIRCUIT_DIR=/path/to/compiled/circuits
ZK_PROVING_KEY_DIR=/path/to/proving/keys
ZK_VERIFICATION_KEY_DIR=/path/to/verification/keys

# === Reputation Configuration ===
REPUTATION_RECOMPUTE_INTERVAL_MS=21600000
REPUTATION_DECAY_ENABLED=true
REPUTATION_MIN_ATTESTATIONS=3
REPUTATION_MIN_ISSUERS=2

# === Cross-Platform ===
CROSS_PLATFORM_ENABLED=true
TRUSTED_PLATFORMS=platform-a-id,platform-b-id,platform-c-id

# === Rate Limiting ===
ATTESTATION_ISSUE_RATE_LIMIT=100/hour
ATTESTATION_VERIFY_RATE_LIMIT=1000/hour
DISCLOSURE_GENERATE_RATE_LIMIT=200/hour

# === Monitoring ===
ATTESTATION_METRICS_ENABLED=true
ATTESTATION_METRICS_PORT=9090
```

---

## Dependencies

### Internal Dependencies

| Module | Purpose |
|--------|---------|
| `@mcv/web3-public/solana` | Solana connection management, transaction building, PDA derivation |
| `@mcv/web3-public/wallet` | Wallet integration, keypair management, signing operations |
| `@mcv/web3-public/identity` | DID resolution, identity linkage for attestation subjects |
| `@mcv/shared/database` | Drizzle ORM setup, connection pooling, migration utilities |
| `@mcv/shared/crypto` | Cryptographic primitives, hashing, signature verification |
| `@mcv/shared/events` | Event bus for attestation lifecycle events |
| `@mcv/shared/logging` | Structured logging for audit trails |
| `@mcv/shared/validation` | Schema validation utilities, input sanitization |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@solana/web3.js` | `^2.x` | Solana blockchain interaction |
| `@coral-xyz/anchor` | `^0.30.x` | Anchor framework for program interaction |
| `drizzle-orm` | `^0.30.x` | Database ORM |
| `drizzle-kit` | `^0.30.x` | Database migrations |
| `@noble/hashes` | `^1.x` | SHA-256, Merkle tree hashing |
| `@noble/ed25519` | `^2.x` | Ed25519 signature verification |
| `snarkjs` | `^0.7.x` | ZK-SNARK proof generation and verification |
| `circomlib` | `^2.x` | ZK circuit libraries |
| `uuid` | `^9.x` | UUID generation |
| `zod` | `^3.x` | Runtime schema validation |
| `bs58` | `^5.x` | Base58 encoding for Solana addresses |

---

## Testing Notes

### Unit Tests

```bash
# Run all attestation module tests
pnpm test --filter @mcv/web3-public/attestation

# Run specific test suites
pnpm test -- --grep "AttestationService"
pnpm test -- --grep "VerificationService"
pnpm test -- --grep "ReputationService"
pnpm test -- --grep "DisclosureService"
pnpm test -- --grep "RevocationService"
pnpm test -- --grep "CrossPlatformService"
```

### Test Categories

| Category | Description | Count (Target) |
|----------|-------------|----------------|
| **Issuance** | Schema creation, validation, attestation issuance, batch ops | 40+ |
| **Verification** | All verification steps, policies, trust chains, batch verify | 35+ |
| **Revocation** | Single/batch revocation, registry management, cascade | 25+ |
| **Reputation** | Score computation, decay, dimensions, leaderboards | 30+ |
| **Privacy** | Selective disclosure, Merkle proofs, ZK proof gen/verify | 25+ |
| **Cross-Platform** | Export, import, resolve, unified reputation | 20+ |
| **Issuer** | Registration, delegation, authority, reputation | 25+ |
| **Integration** | End-to-end flows across services | 15+ |

### Test Fixtures

```typescript
// Common test fixtures for attestation module testing

export const TEST_SCHEMAS = {
  skillCertification: {
    name: 'Test Skill Certification',
    slug: 'test-skill-certification',
    category: 'certification' as const,
    fields: [
      { name: 'skillName', type: 'string' as const, required: true, disclosable: true, label: 'Skill' },
      { name: 'level', type: 'enum' as const, required: true, disclosable: true, label: 'Level', enumValues: ['beginner', 'advanced'] },
      { name: 'score', type: 'integer' as const, required: true, disclosable: true, label: 'Score' },
    ],
  },
  kycVerification: {
    name: 'Test KYC Verification',
    slug: 'test-kyc-verification',
    category: 'kyc' as const,
    fields: [
      { name: 'fullName', type: 'string' as const, required: true, disclosable: false, label: 'Full Name' },
      { name: 'dateOfBirth', type: 'date' as const, required: true, disclosable: false, label: 'DOB' },
      { name: 'verified', type: 'boolean' as const, required: true, disclosable: true, label: 'Verified' },
    ],
  },
};

export const TEST_ISSUERS = {
  trustedIssuer: {
    name: 'Test Trusted Issuer',
    authorityLevel: 'trusted' as const,
    universalAuthority: false,
  },
  rootAuthority: {
    name: 'Test Root Authority',
    authorityLevel: 'root' as const,
    universalAuthority: true,
  },
};
```

### Key Test Scenarios

1. **Happy path issuance and verification**: Issue attestation → verify → confirm all steps pass
2. **Expired attestation rejection**: Issue with short expiry → wait → verify → confirm expiry check fails
3. **Revocation cascade**: Issue multiple attestations → revoke issuer → verify all are invalid
4. **Delegation scope enforcement**: Delegate with limited schemas → attempt to issue for unauthorized schema → confirm rejection
5. **Selective disclosure integrity**: Issue → generate disclosure for subset → verify only disclosed fields visible
6. **ZK proof soundness**: Issue with known values → generate ZK proof for conditions → verify proof → confirm no value leakage
7. **Cross-platform round-trip**: Issue on platform A → export → import on platform B → verify on platform B
8. **Reputation decay**: Issue attestations at various dates → compute reputation → verify older attestations contribute less
9. **Schema version compatibility**: Issue on v1 → upgrade schema to v2 → verify v1 attestation still validates against v1 schema
10. **Batch operations under load**: Issue 1000 attestations in batch → verify batch → confirm performance within bounds

### Localnet Testing

For on-chain integration tests, use a local Solana validator:

```bash
# Start local validator with the attestation program deployed
solana-test-validator \
  --bpf-program AttestProgramPub1icKeyBase58... /path/to/attestation_program.so \
  --reset

# Run integration tests against localnet
SOLANA_RPC_URL=http://localhost:8899 pnpm test:integration
```

### Performance Benchmarks

| Operation | Target Latency | Notes |
|-----------|---------------|-------|
| Issue attestation (with on-chain) | < 2s | Includes Solana tx confirmation at `confirmed` |
| Issue attestation (off-chain only) | < 100ms | DB write + signature |
| Verify attestation (full pipeline) | < 500ms | All steps including on-chain lookup |
| Verify attestation (off-chain only) | < 50ms | Signature + DB checks |
| Selective disclosure proof generation | < 200ms | Merkle proof computation |
| ZK proof generation | < 5s | Depends on circuit complexity |
| ZK proof verification | < 100ms | Verification is fast |
| Reputation score computation | < 1s | For typical attestation counts (< 100) |
| Batch issue (100 attestations) | < 10s | Batched Solana transactions |
| Cross-platform export | < 300ms | Bundle creation |
| Cross-platform import | < 2s | Includes verification of source |

---

## Usage Patterns

### Pattern: KYC Once, Use Everywhere

The most powerful use case for attestations is reducing redundant verification. A user completes KYC with one trusted provider, receives an on-chain attestation, and then uses ZK proofs derived from that attestation to satisfy compliance requirements across multiple platforms — without repeating the KYC process or sharing personal data again.

```
User → KYC Provider → Attestation (on-chain) → ZK Proof → DeFi Platform A
                                                         → DEX Platform B
                                                         → Lending Platform C
```

### Pattern: Progressive Reputation Building

Users accumulate attestations over time from various issuers, building a multi-dimensional reputation. New platforms can immediately assess a user's trustworthiness based on their portable reputation, eliminating cold-start problems.

```
Day 1:   KYC Attestation (identity dimension)
Day 30:  Course Completion (education dimension)
Day 90:  Hackathon Win (achievement dimension)
Day 180: Employment Verification (experience dimension)
Day 365: Advanced Certification (technical_skill dimension)

Result:  Rich, multi-dimensional reputation score
```

### Pattern: Organizational Credential Issuance

Organizations register as issuers, define schemas for their credential types, delegate issuance authority to specific roles (HR, professors, managers), and manage the full lifecycle of credentials they issue.

```
Organization (root issuer)
  ├── HR Department (delegate: employment schemas)
  │     ├── Employment Verification Attestations
  │     └── Role Change Attestations
  ├── Training Department (delegate: certification schemas)
  │     ├── Course Completion Attestations
  │     └── Skill Certification Attestations
  └── Management (delegate: achievement schemas)
        └── Performance Achievement Attestations
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2025-01 | Initial module structure, core attestation issuance and verification |
| 0.2.0 | 2025-03 | Added schema registry, issuer management, delegation system |
| 0.3.0 | 2025-05 | Selective disclosure via Merkle proofs |
| 0.4.0 | 2025-07 | ZK proof integration for privacy-preserving verification |
| 0.5.0 | 2025-09 | Reputation scoring engine with decay and multi-dimensional support |
| 0.6.0 | 2025-11 | Cross-platform attestation portability |
| 0.7.0 | 2026-01 | Batch operations, performance optimizations, W3C VC interop |
| 1.0.0 | 2026-03 | Production release (planned) |
