# @mcv/web3-core/contracts

> **Tier 5 — MCV-Only Domain Module**
> Solana smart contract (program) deployment, upgrade, and lifecycle management.

---

## Purpose

The **contracts** module is the backbone of MCV's on-chain presence. It manages the complete lifecycle of Solana programs — from initial deployment of compiled BPF bytecode through versioned upgrades, authority governance, and eventual immutability freezes. Every smart contract that MCV deploys to devnet, testnet, or mainnet flows through this module's deployment pipeline, ensuring consistent versioning, audit trails, and multi-signature upgrade authority enforcement.

Beyond deployment, the contracts module maintains a comprehensive off-chain registry that catalogs every deployed program across all environments. This registry links program addresses to their IDL (Interface Definition Language) definitions, deployment metadata, upgrade history, and authority configurations. When a program is upgraded, the module orchestrates the full workflow: proposing the upgrade through multi-sig governance (via Squads Protocol), executing the BPF loader upgrade instruction, verifying on-chain bytecode matches the expected build artifact, updating the IDL registry, and regenerating TypeScript client bindings. This closed-loop approach eliminates the class of bugs where client code drifts from on-chain program interfaces.

The module also provides the foundational primitives that other MCV modules depend on for interacting with Solana programs: type-safe instruction builders generated from IDL definitions, PDA (Program Derived Address) derivation utilities, cross-program invocation (CPI) configuration, account schema management with rent calculations, and on-chain event parsing. These primitives abstract away the raw complexity of `@solana/web3.js` and `@coral-xyz/anchor`, providing a unified, type-safe surface for all of MCV's blockchain interactions.

---

## Exports

```typescript
// @mcv/web3-core/contracts — Public API

// ── Core Service ──────────────────────────────────────────────
export { ContractService }              from './service';
export { createContractService }        from './service';
export type { ContractServiceConfig }   from './service';

// ── Deployment ────────────────────────────────────────────────
export { ProgramDeployer }              from './deployment/deployer';
export { DeploymentPipeline }           from './deployment/pipeline';
export { BuildVerifier }                from './deployment/verifier';
export type { ProgramDeployment }       from './deployment/types';
export type { DeploymentConfig }        from './deployment/types';
export type { DeploymentResult }        from './deployment/types';
export type { DeploymentEnvironment }   from './deployment/types';
export type { BuildArtifact }           from './deployment/types';

// ── Upgrades ──────────────────────────────────────────────────
export { ProgramUpgrader }              from './upgrades/upgrader';
export { UpgradeProposal }             from './upgrades/proposal';
export { TimelockController }           from './upgrades/timelock';
export { RollbackManager }             from './upgrades/rollback';
export type { ProgramUpgrade }          from './upgrades/types';
export type { UpgradeProposalConfig }   from './upgrades/types';
export type { TimelockConfig }          from './upgrades/types';
export type { RollbackSnapshot }        from './upgrades/types';

// ── IDL Management ────────────────────────────────────────────
export { IDLRegistry }                  from './idl/registry';
export { IDLParser }                    from './idl/parser';
export { IDLDiffEngine }               from './idl/diff';
export { ClientGenerator }             from './idl/codegen';
export type { IDLDefinition }           from './idl/types';
export type { IDLVersion }              from './idl/types';
export type { IDLDiff }                 from './idl/types';
export type { GeneratedClient }         from './idl/types';

// ── Cross-Program Invocation ──────────────────────────────────
export { CPIManager }                   from './cpi/manager';
export { CPIBuilder }                   from './cpi/builder';
export type { CPIConfig }               from './cpi/types';
export type { CPICall }                 from './cpi/types';
export type { CPIResult }               from './cpi/types';

// ── Program Authority ─────────────────────────────────────────
export { AuthorityManager }             from './authority/manager';
export { MultiSigAdapter }             from './authority/multisig';
export { SquadsAdapter }               from './authority/squads';
export type { ProgramAuthority }        from './authority/types';
export type { AuthorityTransfer }       from './authority/types';
export type { MultiSigConfig }          from './authority/types';

// ── Program Registry ──────────────────────────────────────────
export { ProgramRegistry }              from './registry/registry';
export { RegistrySync }                from './registry/sync';
export type { ProgramRecord }           from './registry/types';
export type { ProgramStatus }           from './registry/types';
export type { RegistryQuery }           from './registry/types';

// ── Account Management ────────────────────────────────────────
export { AccountManager }               from './accounts/manager';
export { PDADeriver }                   from './accounts/pda';
export { RentCalculator }              from './accounts/rent';
export { AccountSizer }                from './accounts/sizer';
export type { AccountSchema }           from './accounts/types';
export type { PDAConfig }               from './accounts/types';
export type { AccountLayout }           from './accounts/types';

// ── Instruction Builders ──────────────────────────────────────
export { InstructionBuilder }           from './instructions/builder';
export { TransactionComposer }          from './instructions/composer';
export { InstructionSerializer }        from './instructions/serializer';
export type { TypedInstruction }        from './instructions/types';
export type { InstructionMeta }         from './instructions/types';
export type { ComposedTransaction }     from './instructions/types';

// ── Event Parsing ─────────────────────────────────────────────
export { EventParser }                  from './events/parser';
export { EventSubscriber }             from './events/subscriber';
export { LogDecoder }                  from './events/decoder';
export type { ProgramEvent }            from './events/types';
export type { EventFilter }             from './events/types';
export type { ParsedLog }              from './events/types';

// ── Testing ───────────────────────────────────────────────────
export { LocalValidator }               from './testing/validator';
export { ProgramTestHarness }           from './testing/harness';
export { AccountFixtureLoader }         from './testing/fixtures';
export type { TestValidatorConfig }     from './testing/types';
export type { ProgramTestContext }      from './testing/types';

// ── Error Codes ───────────────────────────────────────────────
export { ContractErrorCode }            from './errors';
export { ContractError }                from './errors';

// ── DB Schemas ────────────────────────────────────────────────
export {
  deployedPrograms,
  programVersions,
  idlRegistry,
  programAuthorities,
  deploymentLogs,
} from './db/schema';

// ── tRPC Router ───────────────────────────────────────────────
export { contractsRouter }              from './router';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTRACT LIFECYCLE PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌───────────────┐    ┌──────────────────┐ │
│  │  Anchor   │    │   IDL    │    │   Client      │    │  Instruction     │ │
│  │  Build    │───▶│  Parser  │───▶│   Generator   │───▶│  Builders        │ │
│  │  (Rust)   │    │          │    │   (codegen)   │    │  (TypeScript)    │ │
│  └──────────┘    └──────────┘    └───────────────┘    └────────┬─────────┘ │
│       │               │                                         │           │
│       ▼               ▼                                         ▼           │
│  ┌──────────┐    ┌──────────┐                          ┌──────────────────┐ │
│  │   BPF    │    │   IDL    │                          │  Transaction     │ │
│  │ Bytecode │    │ Registry │                          │  Composer        │ │
│  │ (.so)    │    │  (DB)    │                          │                  │ │
│  └────┬─────┘    └──────────┘                          └────────┬─────────┘ │
│       │                                                         │           │
│       ▼                                                         ▼           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      DEPLOYMENT PIPELINE                            │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐ │   │
│  │  │  Build     │  │  Authority  │  │  Deploy /  │  │  Verify &    │ │   │
│  │  │  Verify    │──│  Check     │──│  Upgrade   │──│  Register    │ │   │
│  │  │            │  │  (multisig)│  │  (BPF)     │  │              │ │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SOLANA RPC                                   │   │
│  │  ┌─────────┐  ┌───────────────┐  ┌──────────┐  ┌───────────────┐  │   │
│  │  │ Devnet  │  │   Testnet     │  │ Mainnet  │  │ Local         │  │   │
│  │  │         │  │               │  │  -beta   │  │ Validator     │  │   │
│  │  └─────────┘  └───────────────┘  └──────────┘  └───────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                         OFF-CHAIN REGISTRY                                  │
│                                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐   │
│  │ deployed_      │  │ program_       │  │ idl_registry               │   │
│  │ programs       │  │ versions       │  │                            │   │
│  │ (Supabase)     │  │ (Supabase)     │  │ (Supabase)                │   │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘   │
│                                                                             │
│  ┌────────────────┐  ┌────────────────┐                                    │
│  │ program_       │  │ deployment_    │                                    │
│  │ authorities    │  │ logs           │                                    │
│  │ (Supabase)     │  │ (Supabase)     │                                    │
│  └────────────────┘  └────────────────┘                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                        CPI & ACCOUNT LAYER                                  │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐ │
│  │ CPI Manager  │    │ PDA Deriver  │    │ Account Manager              │ │
│  │              │    │              │    │                              │ │
│  │ • call graph │    │ • seed mgmt  │    │ • schema validation          │ │
│  │ • depth chk  │    │ • bump cache │    │ • rent calculation           │ │
│  │ • signer     │    │ • derivation │    │ • size estimation            │ │
│  │   propagation│    │   paths      │    │ • migration                  │ │
│  └──────────────┘    └──────────────┘    └──────────────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                        EVENT & MONITORING LAYER                             │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │  Event Parser     │  │  Log Decoder     │  │  Event Subscriber     │  │
│  │                   │  │                   │  │                       │  │
│  │  • Anchor events  │  │  • Raw log parse  │  │  • WebSocket feed    │  │
│  │  • Custom events  │  │  • Base64 decode  │  │  • Polling fallback  │  │
│  │  • Discriminator  │  │  • Program filter │  │  • Replay from slot  │  │
│  └──────────────────┘  └──────────────────┘  └────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Deploy → Use → Upgrade

```
                    DEPLOY FLOW
                    ═══════════
  anchor build ──▶ .so artifact ──▶ BuildVerifier
                                         │
                     ┌───────────────────┘
                     ▼
              DeploymentPipeline
                     │
         ┌───────────┼───────────────┐
         ▼           ▼               ▼
   Check Auth    Upload BPF    Register IDL
   (multisig)    (BPFLoader)   (off-chain DB)
         │           │               │
         └───────────┼───────────────┘
                     ▼
              ProgramRegistry.register()
                     │
                     ▼
              ClientGenerator.generate()
                     │
                     ▼
              TypeScript client ready


                    USAGE FLOW
                    ══════════
  IDLRegistry.get() ──▶ InstructionBuilder.build()
                              │
                              ▼
                     TransactionComposer.compose()
                              │
                     ┌────────┼────────┐
                     ▼        ▼        ▼
                   Sign    Simulate   Send
                   (wallet) (preflight) (RPC)
                     │        │        │
                     └────────┼────────┘
                              ▼
                     EventParser.parse(txLogs)


                   UPGRADE FLOW
                   ════════════
  anchor build ──▶ new .so ──▶ BuildVerifier
                                    │
                     ┌──────────────┘
                     ▼
           UpgradeProposal.create()
                     │
                     ▼
           TimelockController.schedule()
                     │
                     ▼  (after timelock delay)
           MultiSigAdapter.approve()
                     │
                     ▼
           ProgramUpgrader.execute()
                     │
           ┌─────────┼──────────┐
           ▼         ▼          ▼
     Snapshot    BPFLoader    Update
     (rollback)  .upgrade()   Registry
           │         │          │
           └─────────┼──────────┘
                     ▼
           IDLDiffEngine.diff()
                     │
                     ▼
           ClientGenerator.regenerate()
```

---

## Core Interfaces

### ContractService

The top-level orchestrator that composes all sub-services and provides the unified API surface.

```typescript
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

/**
 * Deployment environment identifier.
 * 'local' uses solana-test-validator; 'devnet'/'testnet'/'mainnet-beta' use remote RPC.
 */
export type DeploymentEnvironment = 'local' | 'devnet' | 'testnet' | 'mainnet-beta';

/**
 * High-level status of a deployed program.
 */
export type ProgramStatus =
  | 'deploying'      // BPF upload in progress
  | 'active'         // Deployed and operational
  | 'upgrading'      // Upgrade in progress
  | 'frozen'         // Upgrade authority revoked — immutable
  | 'deprecated'     // Marked for sunset, still functional
  | 'decommissioned' // No longer in use
  | 'failed';        // Deployment or upgrade failed

/**
 * Configuration for the ContractService.
 */
export interface ContractServiceConfig {
  /** Solana RPC connection */
  connection: Connection;

  /** Anchor provider for signing */
  provider: AnchorProvider;

  /** Active environment */
  environment: DeploymentEnvironment;

  /** Supabase database URL for off-chain registry */
  databaseUrl: string;

  /** Squads multi-sig vault address (for mainnet upgrades) */
  multisigVault?: PublicKey;

  /** Default timelock delay in seconds for upgrades (0 = no timelock) */
  defaultTimelockDelay?: number;

  /** Path to the local Anchor workspace (for build/verify) */
  anchorWorkspacePath?: string;

  /** Enable automatic IDL sync after deployments */
  autoSyncIdl?: boolean;

  /** Enable automatic client regeneration after IDL changes */
  autoRegenClients?: boolean;

  /** Maximum allowed CPI depth */
  maxCpiDepth?: number;

  /** RPC endpoint URLs by environment */
  rpcEndpoints?: Partial<Record<DeploymentEnvironment, string>>;
}

/**
 * ContractService — Top-level orchestrator for all contract operations.
 *
 * Composes ProgramDeployer, ProgramUpgrader, IDLRegistry, ProgramRegistry,
 * AuthorityManager, AccountManager, CPIManager, InstructionBuilder,
 * EventParser, and testing utilities into a single coherent service.
 */
export interface ContractService {
  // ── Deployment ──
  deploy(config: DeploymentConfig): Promise<DeploymentResult>;
  verifyBuild(artifact: BuildArtifact): Promise<BuildVerification>;
  getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus>;

  // ── Upgrades ──
  proposeUpgrade(config: UpgradeProposalConfig): Promise<UpgradeProposal>;
  executeUpgrade(proposalId: string): Promise<UpgradeResult>;
  rollback(programId: PublicKey, toVersion: number): Promise<RollbackResult>;
  freezeProgram(programId: PublicKey): Promise<FreezeResult>;

  // ── IDL ──
  registerIdl(programId: PublicKey, idl: IDLDefinition): Promise<void>;
  getIdl(programId: PublicKey, version?: number): Promise<IDLDefinition>;
  diffIdl(programId: PublicKey, fromVersion: number, toVersion: number): Promise<IDLDiff>;
  generateClient(programId: PublicKey): Promise<GeneratedClient>;

  // ── Registry ──
  listPrograms(query?: RegistryQuery): Promise<ProgramRecord[]>;
  getProgram(programId: PublicKey): Promise<ProgramRecord>;
  updateProgramStatus(programId: PublicKey, status: ProgramStatus): Promise<void>;
  syncRegistry(): Promise<SyncResult>;

  // ── Authority ──
  getAuthority(programId: PublicKey): Promise<ProgramAuthority>;
  transferAuthority(transfer: AuthorityTransfer): Promise<TransferResult>;
  configureMultiSig(programId: PublicKey, config: MultiSigConfig): Promise<void>;

  // ── Accounts ──
  derivePda(config: PDAConfig): Promise<PDAResult>;
  calculateRent(schema: AccountSchema): Promise<RentEstimate>;
  getAccountSchema(programId: PublicKey, accountName: string): Promise<AccountSchema>;

  // ── CPI ──
  configureCpi(config: CPIConfig): Promise<void>;
  getCpiGraph(programId: PublicKey): Promise<CPIGraph>;
  validateCpiChain(calls: CPICall[]): Promise<CPIValidation>;

  // ── Instructions ──
  buildInstruction(programId: PublicKey, ixName: string, args: unknown[], accounts: AccountMeta[]): Promise<TypedInstruction>;
  composeTransaction(instructions: TypedInstruction[]): Promise<ComposedTransaction>;

  // ── Events ──
  parseEvents(programId: PublicKey, txSignature: string): Promise<ProgramEvent[]>;
  subscribeEvents(programId: PublicKey, filter?: EventFilter): EventSubscription;

  // ── Testing ──
  startLocalValidator(config?: TestValidatorConfig): Promise<LocalValidatorHandle>;
  createTestContext(programId: PublicKey): Promise<ProgramTestContext>;
}
```

### ProgramDeployment

```typescript
/**
 * Build artifact from `anchor build`.
 */
export interface BuildArtifact {
  /** Path to the compiled .so file */
  soPath: string;

  /** SHA-256 hash of the .so file for verification */
  sha256: string;

  /** Anchor IDL JSON (parsed from target/idl/) */
  idl: IDLDefinition;

  /** Program name from Anchor.toml */
  programName: string;

  /** Anchor framework version used for build */
  anchorVersion: string;

  /** Solana CLI version used for build */
  solanaVersion: string;

  /** Rust toolchain version */
  rustVersion: string;

  /** Git commit hash at build time */
  gitCommit?: string;

  /** Build timestamp (ISO 8601) */
  builtAt: string;
}

/**
 * Build verification result.
 */
export interface BuildVerification {
  /** Whether the build artifact is valid */
  valid: boolean;

  /** SHA-256 matches expected hash */
  hashMatch: boolean;

  /** IDL is well-formed and parseable */
  idlValid: boolean;

  /** On-chain bytecode matches artifact (post-deploy only) */
  onChainMatch?: boolean;

  /** Verification errors, if any */
  errors: string[];

  /** Verification warnings */
  warnings: string[];
}

/**
 * Configuration for a program deployment.
 */
export interface DeploymentConfig {
  /** Build artifact to deploy */
  artifact: BuildArtifact;

  /** Target environment */
  environment: DeploymentEnvironment;

  /** Program keypair (if deploying to a specific address) */
  programKeypair?: Keypair;

  /** Initial upgrade authority */
  upgradeAuthority: PublicKey;

  /** Whether to make the program immediately immutable (no upgrades) */
  immutable?: boolean;

  /** Maximum rent in SOL to pay for deployment (safety check) */
  maxRentSol?: number;

  /** Priority fee in micro-lamports per compute unit */
  priorityFee?: number;

  /** Whether to register IDL on-chain (via Anchor) */
  registerIdlOnChain?: boolean;

  /** Custom deployment label for the registry */
  label?: string;

  /** Deployment notes / changelog */
  notes?: string;

  /** Pre-deployment hook: called before sending transactions */
  preDeployHook?: (config: DeploymentConfig) => Promise<void>;

  /** Post-deployment hook: called after successful deployment */
  postDeployHook?: (result: DeploymentResult) => Promise<void>;
}

/**
 * Result of a successful deployment.
 */
export interface DeploymentResult {
  /** Unique deployment ID (UUID) */
  deploymentId: string;

  /** On-chain program address */
  programId: PublicKey;

  /** Environment deployed to */
  environment: DeploymentEnvironment;

  /** Version number assigned */
  version: number;

  /** Deployment transaction signature */
  txSignature: string;

  /** Slot at which deployment was confirmed */
  slot: number;

  /** Timestamp of deployment confirmation */
  deployedAt: string;

  /** Total SOL spent on deployment (rent + fees) */
  costSol: number;

  /** Build artifact hash for traceability */
  artifactHash: string;

  /** Upgrade authority set on the program */
  upgradeAuthority: PublicKey;
}

/**
 * Deployment status (for tracking in-progress deployments).
 */
export interface DeploymentStatus {
  deploymentId: string;
  phase: 'preparing' | 'uploading' | 'finalizing' | 'verifying' | 'complete' | 'failed';
  progress: number; // 0-100
  bytesUploaded?: number;
  totalBytes?: number;
  error?: string;
  startedAt: string;
  updatedAt: string;
}
```

### ProgramUpgrade

```typescript
/**
 * Configuration for proposing a program upgrade.
 */
export interface UpgradeProposalConfig {
  /** Program to upgrade */
  programId: PublicKey;

  /** New build artifact */
  artifact: BuildArtifact;

  /** Target environment */
  environment: DeploymentEnvironment;

  /** Timelock delay in seconds (overrides service default) */
  timelockDelay?: number;

  /** Upgrade description / changelog */
  description: string;

  /** Whether to require all multi-sig signers before execution */
  requireAllSigners?: boolean;

  /** IDL diff summary (auto-generated if not provided) */
  idlDiffSummary?: string;

  /** Addresses of accounts that must be migrated */
  accountMigrations?: AccountMigration[];

  /** Priority: normal upgrades wait for timelock; emergency skips */
  priority?: 'normal' | 'emergency';
}

/**
 * Upgrade proposal (pending multi-sig approval and timelock).
 */
export interface UpgradeProposal {
  /** Unique proposal ID */
  proposalId: string;

  /** On-chain multi-sig transaction address (Squads) */
  multisigTxAddress?: PublicKey;

  /** Program being upgraded */
  programId: PublicKey;

  /** Current version */
  fromVersion: number;

  /** Target version */
  toVersion: number;

  /** Current approval count */
  approvalsReceived: number;

  /** Required approval count */
  approvalsRequired: number;

  /** Timelock: earliest execution time (ISO 8601) */
  executableAfter: string;

  /** Proposal status */
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'expired' | 'cancelled';

  /** Who created the proposal */
  proposedBy: PublicKey;

  /** When the proposal was created */
  proposedAt: string;

  /** IDL diff between versions */
  idlDiff: IDLDiff;

  /** Description / changelog */
  description: string;
}

/**
 * Timelock configuration for upgrades.
 */
export interface TimelockConfig {
  /** Minimum delay in seconds before upgrade can execute */
  minDelay: number;

  /** Maximum delay in seconds (proposal expires after this) */
  maxDelay: number;

  /** Grace period after timelock expires (seconds) */
  gracePeriod: number;

  /** Addresses that can cancel a pending upgrade */
  cancellers: PublicKey[];

  /** Whether emergency upgrades bypass the timelock */
  allowEmergencyBypass: boolean;

  /** Required signers for emergency bypass */
  emergencySigners?: PublicKey[];

  /** Minimum emergency signers required */
  emergencyThreshold?: number;
}

/**
 * Result of executing an upgrade.
 */
export interface UpgradeResult {
  /** Proposal that was executed */
  proposalId: string;

  /** Upgrade transaction signature */
  txSignature: string;

  /** New version number */
  newVersion: number;

  /** Slot at which upgrade was confirmed */
  slot: number;

  /** Whether on-chain bytecode matches the expected artifact */
  verified: boolean;

  /** Rollback snapshot (for reverting if issues found) */
  rollbackSnapshot: RollbackSnapshot;

  /** Timestamp */
  upgradedAt: string;
}

/**
 * Rollback snapshot — preserved state for reverting an upgrade.
 */
export interface RollbackSnapshot {
  /** Snapshot ID */
  snapshotId: string;

  /** Program address */
  programId: PublicKey;

  /** Version this snapshot represents */
  version: number;

  /** SHA-256 of the previous .so bytecode */
  previousArtifactHash: string;

  /** Path to cached previous .so file (local storage) */
  previousArtifactPath: string;

  /** Previous IDL definition */
  previousIdl: IDLDefinition;

  /** Slot at which snapshot was taken */
  snapshotSlot: number;

  /** Expiry: rollback snapshots are kept for this long */
  expiresAt: string;
}

/**
 * Result of a rollback operation.
 */
export interface RollbackResult {
  /** Whether rollback succeeded */
  success: boolean;

  /** Rollback transaction signature */
  txSignature: string;

  /** Version rolled back to */
  restoredVersion: number;

  /** Any warnings (e.g., account schema incompatibility) */
  warnings: string[];
}

/**
 * Account migration definition for upgrades that change account layouts.
 */
export interface AccountMigration {
  /** Account type name (e.g., 'UserProfile') */
  accountType: string;

  /** Previous size in bytes */
  previousSize: number;

  /** New size in bytes */
  newSize: number;

  /** Migration instruction name in the program */
  migrationInstruction: string;

  /** Estimated number of accounts to migrate */
  estimatedAccountCount: number;

  /** Whether migration is backwards-compatible */
  backwardsCompatible: boolean;
}
```

### IDLRegistry

```typescript
/**
 * Anchor IDL definition (simplified — full type mirrors @coral-xyz/anchor IDL spec).
 */
export interface IDLDefinition {
  /** IDL version (e.g., "0.1.0") */
  version: string;

  /** Program name */
  name: string;

  /** Program instructions */
  instructions: IDLInstruction[];

  /** Program accounts */
  accounts: IDLAccount[];

  /** Custom types */
  types: IDLType[];

  /** Events emitted by the program */
  events?: IDLEvent[];

  /** Error definitions */
  errors?: IDLError[];

  /** Program constants */
  constants?: IDLConstant[];

  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface IDLInstruction {
  name: string;
  discriminator: number[];
  accounts: IDLAccountItem[];
  args: IDLField[];
  returns?: IDLFieldType;
}

export interface IDLAccount {
  name: string;
  discriminator: number[];
}

export interface IDLType {
  name: string;
  type: IDLTypeDef;
}

export interface IDLEvent {
  name: string;
  discriminator: number[];
}

export interface IDLError {
  code: number;
  name: string;
  msg: string;
}

export interface IDLConstant {
  name: string;
  type: IDLFieldType;
  value: string;
}

export interface IDLAccountItem {
  name: string;
  writable?: boolean;
  signer?: boolean;
  optional?: boolean;
  address?: string;
  pda?: IDLPda;
}

export interface IDLField {
  name: string;
  type: IDLFieldType;
}

export type IDLFieldType =
  | 'bool'
  | 'u8' | 'u16' | 'u32' | 'u64' | 'u128'
  | 'i8' | 'i16' | 'i32' | 'i64' | 'i128'
  | 'f32' | 'f64'
  | 'string'
  | 'publicKey'
  | 'bytes'
  | { vec: IDLFieldType }
  | { option: IDLFieldType }
  | { array: [IDLFieldType, number] }
  | { defined: string };

export interface IDLPda {
  seeds: IDLSeed[];
}

export interface IDLSeed {
  kind: 'const' | 'arg' | 'account';
  value?: number[];
  path?: string;
  type?: IDLFieldType;
}

export type IDLTypeDef =
  | { kind: 'struct'; fields: IDLField[] }
  | { kind: 'enum'; variants: IDLEnumVariant[] };

export interface IDLEnumVariant {
  name: string;
  fields?: IDLField[];
}

/**
 * IDL version record in the registry.
 */
export interface IDLVersion {
  /** Program address */
  programId: PublicKey;

  /** Version number */
  version: number;

  /** Full IDL definition */
  idl: IDLDefinition;

  /** SHA-256 hash of the IDL JSON */
  idlHash: string;

  /** When this version was registered */
  registeredAt: string;

  /** Who registered it */
  registeredBy: PublicKey;

  /** Whether this is the currently active IDL */
  active: boolean;
}

/**
 * Diff between two IDL versions.
 */
export interface IDLDiff {
  /** Program address */
  programId: PublicKey;

  /** Source version */
  fromVersion: number;

  /** Target version */
  toVersion: number;

  /** Added instructions */
  addedInstructions: string[];

  /** Removed instructions */
  removedInstructions: string[];

  /** Modified instructions (signature changed) */
  modifiedInstructions: IDLInstructionDiff[];

  /** Added accounts */
  addedAccounts: string[];

  /** Removed accounts */
  removedAccounts: string[];

  /** Modified accounts (layout changed) */
  modifiedAccounts: IDLAccountDiff[];

  /** Added types */
  addedTypes: string[];

  /** Removed types */
  removedTypes: string[];

  /** Modified types */
  modifiedTypes: string[];

  /** Added events */
  addedEvents: string[];

  /** Removed events */
  removedEvents: string[];

  /** Whether the change is backwards-compatible */
  backwardsCompatible: boolean;

  /** Breaking changes summary (if any) */
  breakingChanges: string[];
}

export interface IDLInstructionDiff {
  name: string;
  addedArgs: string[];
  removedArgs: string[];
  addedAccounts: string[];
  removedAccounts: string[];
  modifiedAccounts: string[];
}

export interface IDLAccountDiff {
  name: string;
  previousSize: number;
  newSize: number;
  addedFields: string[];
  removedFields: string[];
}

/**
 * Generated TypeScript client from an IDL.
 */
export interface GeneratedClient {
  /** Program address */
  programId: PublicKey;

  /** IDL version used for generation */
  idlVersion: number;

  /** Generated TypeScript source code */
  sourceCode: string;

  /** Output file path */
  outputPath: string;

  /** Generated type names */
  exportedTypes: string[];

  /** Generated instruction method names */
  exportedMethods: string[];

  /** Generation timestamp */
  generatedAt: string;
}
```

### CPIConfig

```typescript
/**
 * Cross-Program Invocation configuration.
 */
export interface CPIConfig {
  /** Source program (caller) */
  callerProgramId: PublicKey;

  /** Target program (callee) */
  calleeProgramId: PublicKey;

  /** Instruction on the callee to invoke */
  instructionName: string;

  /** Whether the caller signs with a PDA (invoke_signed) */
  signWithPda: boolean;

  /** PDA seeds for invoke_signed */
  pdaSeeds?: Buffer[];

  /** Maximum CPI depth allowed */
  maxDepth?: number;

  /** Compute budget reserved for this CPI call */
  computeBudget?: number;
}

/**
 * CPI call descriptor.
 */
export interface CPICall {
  /** Unique call ID */
  callId: string;

  /** Caller program */
  caller: PublicKey;

  /** Callee program */
  callee: PublicKey;

  /** Instruction name on callee */
  instruction: string;

  /** Arguments passed */
  args: unknown[];

  /** Accounts passed to the CPI */
  accounts: AccountMeta[];

  /** Signer seeds (for invoke_signed) */
  signerSeeds?: Buffer[][];

  /** Nesting depth (0 = top-level, 1 = first CPI, etc.) */
  depth: number;
}

/**
 * CPI call result.
 */
export interface CPIResult {
  /** Whether the CPI succeeded */
  success: boolean;

  /** Return data from the CPI (if any) */
  returnData?: Buffer;

  /** Compute units consumed by the CPI */
  computeUnitsConsumed: number;

  /** Logs generated during the CPI */
  logs: string[];

  /** Error, if the CPI failed */
  error?: string;
}

/**
 * CPI call graph for a program.
 */
export interface CPIGraph {
  /** Root program */
  programId: PublicKey;

  /** All programs this program calls via CPI */
  callees: CPIEdge[];

  /** All programs that call this program via CPI */
  callers: CPIEdge[];

  /** Maximum depth in the call graph */
  maxDepth: number;

  /** Total unique programs in the graph */
  totalPrograms: number;
}

export interface CPIEdge {
  /** Source program */
  from: PublicKey;

  /** Target program */
  to: PublicKey;

  /** Instructions involved */
  instructions: string[];

  /** Whether this edge involves PDA signing */
  pdaSigned: boolean;
}

/**
 * CPI chain validation result.
 */
export interface CPIValidation {
  /** Whether the CPI chain is valid */
  valid: boolean;

  /** Maximum depth of the chain */
  depth: number;

  /** Whether depth exceeds Solana's limit (currently 4) */
  depthExceeded: boolean;

  /** Estimated total compute units */
  estimatedComputeUnits: number;

  /** Whether compute budget might be exceeded */
  computeBudgetWarning: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];
}

export interface AccountMeta {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
}
```

### ProgramAuthority

```typescript
/**
 * Program authority configuration.
 */
export interface ProgramAuthority {
  /** Program address */
  programId: PublicKey;

  /** Current upgrade authority (null if frozen/immutable) */
  upgradeAuthority: PublicKey | null;

  /** Whether the program is immutable (upgrade authority revoked) */
  immutable: boolean;

  /** Authority type */
  authorityType: 'single' | 'multisig' | 'timelock' | 'none';

  /** Multi-sig configuration (if applicable) */
  multisig?: MultiSigConfig;

  /** Timelock configuration (if applicable) */
  timelock?: TimelockConfig;

  /** Authority history (transfers, changes) */
  history: AuthorityEvent[];
}

/**
 * Multi-sig configuration for program upgrade authority.
 */
export interface MultiSigConfig {
  /** Squads multi-sig vault address */
  vaultAddress: PublicKey;

  /** Number of required signers (M of N) */
  threshold: number;

  /** Total number of signers */
  totalSigners: number;

  /** List of signer addresses */
  signers: PublicKey[];

  /** Squads multi-sig address */
  multisigAddress: PublicKey;

  /** Whether this multi-sig controls multiple programs */
  sharedMultisig: boolean;
}

/**
 * Authority transfer request.
 */
export interface AuthorityTransfer {
  /** Program to transfer authority for */
  programId: PublicKey;

  /** Current authority (must sign) */
  currentAuthority: PublicKey;

  /** New authority (or null to freeze) */
  newAuthority: PublicKey | null;

  /** Reason for transfer */
  reason: string;

  /** Whether this requires multi-sig approval */
  requiresMultisig: boolean;
}

/**
 * Authority transfer result.
 */
export interface TransferResult {
  success: boolean;
  txSignature: string;
  previousAuthority: PublicKey;
  newAuthority: PublicKey | null;
  frozen: boolean;
  transferredAt: string;
}

/**
 * Authority event (for audit trail).
 */
export interface AuthorityEvent {
  /** Event type */
  type: 'transfer' | 'multisig_configure' | 'timelock_configure' | 'freeze' | 'emergency_action';

  /** When the event occurred */
  timestamp: string;

  /** Who initiated the event */
  initiatedBy: PublicKey;

  /** Previous authority */
  previousAuthority?: PublicKey | null;

  /** New authority */
  newAuthority?: PublicKey | null;

  /** Transaction signature */
  txSignature: string;

  /** Description */
  description: string;
}

/**
 * Result of freezing a program (revoking upgrade authority).
 */
export interface FreezeResult {
  success: boolean;
  programId: PublicKey;
  txSignature: string;
  frozenAt: string;
  warning: string; // "This action is IRREVERSIBLE"
}
```

### AccountSchema

```typescript
/**
 * PDA derivation configuration.
 */
export interface PDAConfig {
  /** Program that owns the PDA */
  programId: PublicKey;

  /** Seeds for PDA derivation */
  seeds: PDASeeed[];

  /** Descriptive name for the PDA */
  name?: string;
}

export interface PDASeeed {
  /** Seed type */
  type: 'literal' | 'pubkey' | 'u8' | 'u16' | 'u32' | 'u64' | 'string' | 'bytes';

  /** Seed value */
  value: string | number | PublicKey | Buffer;

  /** Human-readable label */
  label?: string;
}

/**
 * PDA derivation result.
 */
export interface PDAResult {
  /** Derived PDA address */
  address: PublicKey;

  /** Bump seed used */
  bump: number;

  /** Seeds used for derivation */
  seeds: Buffer[];

  /** Program ID */
  programId: PublicKey;
}

/**
 * Account schema definition.
 */
export interface AccountSchema {
  /** Account type name */
  name: string;

  /** Program that owns this account type */
  programId: PublicKey;

  /** Account discriminator (first 8 bytes) */
  discriminator: number[];

  /** Fields in the account */
  fields: AccountField[];

  /** Total size in bytes (including discriminator) */
  size: number;

  /** Whether size is fixed or variable */
  fixedSize: boolean;

  /** Maximum size if variable */
  maxSize?: number;

  /** Space calculation formula (human-readable) */
  sizeFormula: string;
}

export interface AccountField {
  /** Field name */
  name: string;

  /** Solana/Borsh type */
  type: IDLFieldType;

  /** Offset in bytes from start of account data */
  offset: number;

  /** Size in bytes (for fixed-size fields) */
  size?: number;

  /** Whether this field is variable-length */
  variable: boolean;

  /** Human-readable description */
  description?: string;
}

/**
 * Account layout (flattened view for rendering/debugging).
 */
export interface AccountLayout {
  /** Account type name */
  name: string;

  /** Total size */
  totalSize: number;

  /** Layout segments */
  segments: LayoutSegment[];
}

export interface LayoutSegment {
  offset: number;
  size: number;
  fieldName: string;
  type: string;
  description?: string;
}

/**
 * Rent estimation result.
 */
export interface RentEstimate {
  /** Account size in bytes */
  sizeBytes: number;

  /** Rent-exempt minimum in lamports */
  rentLamports: number;

  /** Rent-exempt minimum in SOL */
  rentSol: number;

  /** Current rent rate per byte per epoch */
  ratePerBytePerEpoch: number;
}
```

---

## Database Schemas

### deployed_programs

The primary registry table tracking all deployed Solana programs.

```typescript
import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const programStatusEnum = pgEnum('program_status', [
  'deploying',
  'active',
  'upgrading',
  'frozen',
  'deprecated',
  'decommissioned',
  'failed',
]);

export const environmentEnum = pgEnum('deployment_environment', [
  'local',
  'devnet',
  'testnet',
  'mainnet-beta',
]);

/**
 * deployed_programs — Registry of all deployed Solana programs.
 *
 * One row per program per environment. The combination of
 * (program_address, environment) is unique.
 */
export const deployedPrograms = pgTable('deployed_programs', {
  // ── Identity ──
  id:                text('id').primaryKey(),                           // UUID
  programAddress:    text('program_address').notNull(),                 // Base58 Solana address
  programName:       text('program_name').notNull(),                    // Human-readable name (e.g., "mcv_marketplace")
  environment:       environmentEnum('environment').notNull(),          // devnet | testnet | mainnet-beta | local

  // ── Version ──
  currentVersion:    integer('current_version').notNull().default(1),   // Latest deployed version
  currentIdlVersion: integer('current_idl_version'),                    // FK → idl_registry.version

  // ── Status ──
  status:            programStatusEnum('status').notNull().default('deploying'),
  immutable:         boolean('immutable').notNull().default(false),     // Upgrade authority revoked

  // ── Authority ──
  upgradeAuthority:  text('upgrade_authority'),                         // Base58 address (null if frozen)
  authorityType:     text('authority_type').notNull().default('single'), // single | multisig | timelock | none
  multisigVault:     text('multisig_vault'),                            // Squads vault address (if multisig)

  // ── Deployment Info ──
  deployedBy:        text('deployed_by').notNull(),                     // Base58 address of deployer
  deployTxSignature: text('deploy_tx_signature').notNull(),             // First deployment tx
  deploySlot:        integer('deploy_slot').notNull(),                  // Slot of first deployment
  artifactHash:      text('artifact_hash').notNull(),                   // SHA-256 of current .so

  // ── Metadata ──
  label:             text('label'),                                     // Custom label
  description:       text('description'),                               // Program description
  repositoryUrl:     text('repository_url'),                            // Git repo URL
  docsUrl:           text('docs_url'),                                  // Documentation URL
  tags:              jsonb('tags').$type<string[]>().default([]),        // Searchable tags

  // ── Costs ──
  totalDeploymentCostLamports: text('total_deployment_cost_lamports'),   // Total SOL spent (as string for precision)

  // ── Timestamps ──
  firstDeployedAt:   timestamp('first_deployed_at', { withTimezone: true }).notNull().defaultNow(),
  lastUpgradedAt:    timestamp('last_upgraded_at', { withTimezone: true }),
  deprecatedAt:      timestamp('deprecated_at', { withTimezone: true }),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Unique constraint
// CREATE UNIQUE INDEX idx_program_env ON deployed_programs(program_address, environment);

export const deployedProgramsRelations = relations(deployedPrograms, ({ many }) => ({
  versions:    many(programVersions),
  idlVersions: many(idlRegistry),
  authorities: many(programAuthorities),
  logs:        many(deploymentLogs),
}));
```

### program_versions

```typescript
/**
 * program_versions — Version history for each deployed program.
 *
 * Each deployment or upgrade creates a new version record.
 * This provides a complete audit trail of what was deployed when.
 */
export const programVersions = pgTable('program_versions', {
  // ── Identity ──
  id:              text('id').primaryKey(),                              // UUID
  programId:       text('program_id').notNull()                         // FK → deployed_programs.id
                     .references(() => deployedPrograms.id),
  version:         integer('version').notNull(),                        // Sequential version number

  // ── Artifact ──
  artifactHash:    text('artifact_hash').notNull(),                     // SHA-256 of the .so
  artifactPath:    text('artifact_path'),                               // Path to cached .so (for rollback)
  anchorVersion:   text('anchor_version').notNull(),                    // Anchor framework version
  solanaVersion:   text('solana_version').notNull(),                    // Solana CLI version
  rustVersion:     text('rust_version').notNull(),                      // Rust toolchain version
  gitCommit:       text('git_commit'),                                  // Git commit hash

  // ── IDL ──
  idlHash:         text('idl_hash').notNull(),                          // SHA-256 of IDL JSON
  idlVersionId:    text('idl_version_id'),                              // FK → idl_registry.id

  // ── Deployment ──
  txSignature:     text('tx_signature').notNull(),                      // Deployment/upgrade tx
  slot:            integer('slot').notNull(),                           // Confirmation slot
  deployedBy:      text('deployed_by').notNull(),                       // Deployer address
  costLamports:    text('cost_lamports'),                               // Cost of this deployment

  // ── Upgrade Info ──
  upgradeType:     text('upgrade_type').notNull().default('deploy'),    // deploy | upgrade | rollback
  proposalId:      text('proposal_id'),                                 // FK → upgrade proposals (if upgrade)
  previousVersion: integer('previous_version'),                         // Version before this one

  // ── Verification ──
  verified:        boolean('verified').notNull().default(false),        // On-chain verification passed
  verifiedAt:      timestamp('verified_at', { withTimezone: true }),
  verifiedBy:      text('verified_by'),

  // ── Metadata ──
  changelog:       text('changelog'),                                   // Release notes
  breakingChanges: boolean('breaking_changes').notNull().default(false),
  tags:            jsonb('tags').$type<string[]>().default([]),

  // ── Rollback ──
  rollbackAvailable: boolean('rollback_available').notNull().default(true),
  rollbackExpiresAt: timestamp('rollback_expires_at', { withTimezone: true }),

  // ── Timestamps ──
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Unique: one version number per program
// CREATE UNIQUE INDEX idx_program_version ON program_versions(program_id, version);

export const programVersionsRelations = relations(programVersions, ({ one }) => ({
  program: one(deployedPrograms, {
    fields: [programVersions.programId],
    references: [deployedPrograms.id],
  }),
  idlVersion: one(idlRegistry, {
    fields: [programVersions.idlVersionId],
    references: [idlRegistry.id],
  }),
}));
```

### idl_registry

```typescript
/**
 * idl_registry — Versioned IDL storage for all programs.
 *
 * Each IDL version is stored as a full JSON blob. Diffs between
 * versions are computed on-demand by the IDLDiffEngine.
 */
export const idlRegistry = pgTable('idl_registry', {
  // ── Identity ──
  id:             text('id').primaryKey(),                               // UUID
  programId:      text('program_id').notNull()                          // FK → deployed_programs.id
                    .references(() => deployedPrograms.id),
  version:        integer('version').notNull(),                         // Sequential IDL version

  // ── IDL Content ──
  idlJson:        jsonb('idl_json').$type<IDLDefinition>().notNull(),   // Full IDL definition
  idlHash:        text('idl_hash').notNull(),                           // SHA-256 of idlJson

  // ── Metadata ──
  programName:    text('program_name').notNull(),                       // From IDL name field
  programVersion: text('program_version').notNull(),                    // From IDL version field
  instructionCount: integer('instruction_count').notNull(),             // Number of instructions
  accountCount:   integer('account_count').notNull(),                   // Number of account types
  typeCount:      integer('type_count').notNull(),                      // Number of custom types
  eventCount:     integer('event_count').notNull().default(0),          // Number of events
  errorCount:     integer('error_count').notNull().default(0),          // Number of error codes

  // ── Compatibility ──
  backwardsCompatible: boolean('backwards_compatible'),                  // Relative to previous version
  breakingChanges:     jsonb('breaking_changes').$type<string[]>(),     // List of breaking change descriptions

  // ── Status ──
  active:         boolean('active').notNull().default(true),            // Currently active IDL
  onChain:        boolean('on_chain').notNull().default(false),         // Also registered on-chain

  // ── Registration ──
  registeredBy:   text('registered_by').notNull(),                      // Address that registered
  registeredAt:   timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),

  // ── Generated Client ──
  clientGenerated:   boolean('client_generated').notNull().default(false),
  clientGeneratedAt: timestamp('client_generated_at', { withTimezone: true }),
  clientOutputPath:  text('client_output_path'),

  // ── Timestamps ──
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Unique: one version number per program IDL
// CREATE UNIQUE INDEX idx_idl_program_version ON idl_registry(program_id, version);

export const idlRegistryRelations = relations(idlRegistry, ({ one }) => ({
  program: one(deployedPrograms, {
    fields: [idlRegistry.programId],
    references: [deployedPrograms.id],
  }),
}));
```

### program_authorities

```typescript
/**
 * program_authorities — Authority audit trail for programs.
 *
 * Tracks every authority change, multi-sig configuration, and
 * timelock setup. Critical for security auditing.
 */
export const programAuthorities = pgTable('program_authorities', {
  // ── Identity ──
  id:               text('id').primaryKey(),                            // UUID
  programId:        text('program_id').notNull()                        // FK → deployed_programs.id
                      .references(() => deployedPrograms.id),

  // ── Event ──
  eventType:        text('event_type').notNull(),                       // transfer | multisig_configure | timelock_configure | freeze | emergency_action
  txSignature:      text('tx_signature').notNull(),                     // On-chain transaction

  // ── Authority State ──
  previousAuthority: text('previous_authority'),                        // Base58 (null for initial)
  newAuthority:      text('new_authority'),                             // Base58 (null for freeze)
  authorityType:     text('authority_type').notNull(),                  // single | multisig | timelock | none

  // ── Multi-sig Details ──
  multisigVault:     text('multisig_vault'),                            // Squads vault (if applicable)
  multisigThreshold: integer('multisig_threshold'),                     // M of N threshold
  multisigSigners:   jsonb('multisig_signers').$type<string[]>(),       // Signer addresses

  // ── Timelock Details ──
  timelockDelay:     integer('timelock_delay'),                         // Delay in seconds
  timelockGrace:     integer('timelock_grace_period'),                  // Grace period in seconds

  // ── Metadata ──
  initiatedBy:       text('initiated_by').notNull(),                    // Who initiated the change
  reason:            text('reason'),                                     // Why the change was made
  description:       text('description'),                                // Additional context

  // ── Verification ──
  verified:          boolean('verified').notNull().default(false),       // Verified on-chain
  slot:              integer('slot'),                                    // Confirmation slot

  // ── Timestamps ──
  occurredAt:        timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const programAuthoritiesRelations = relations(programAuthorities, ({ one }) => ({
  program: one(deployedPrograms, {
    fields: [programAuthorities.programId],
    references: [deployedPrograms.id],
  }),
}));
```

### deployment_logs

```typescript
/**
 * deployment_logs — Detailed log of every deployment/upgrade operation.
 *
 * Captures the full lifecycle of each deployment: start, progress,
 * completion or failure. Used for debugging failed deployments and
 * operational monitoring.
 */
export const deploymentLogs = pgTable('deployment_logs', {
  // ── Identity ──
  id:              text('id').primaryKey(),                              // UUID
  programId:       text('program_id').notNull()                         // FK → deployed_programs.id
                     .references(() => deployedPrograms.id),
  versionId:       text('version_id'),                                  // FK → program_versions.id (if completed)

  // ── Operation ──
  operation:       text('operation').notNull(),                         // deploy | upgrade | rollback | freeze | authority_transfer
  environment:     environmentEnum('environment').notNull(),

  // ── Status ──
  status:          text('status').notNull(),                            // pending | in_progress | success | failed | cancelled
  phase:           text('phase'),                                       // preparing | uploading | finalizing | verifying
  progress:        integer('progress').default(0),                      // 0-100

  // ── Details ──
  artifactHash:    text('artifact_hash'),
  txSignature:     text('tx_signature'),                                // Final tx (if completed)
  slot:            integer('slot'),
  costLamports:    text('cost_lamports'),

  // ── Error Info ──
  errorCode:       text('error_code'),                                  // Contract error code
  errorMessage:    text('error_message'),
  errorStack:      text('error_stack'),                                 // Stack trace (for debugging)

  // ── Metadata ──
  initiatedBy:     text('initiated_by').notNull(),                      // Address that started the operation
  proposalId:      text('proposal_id'),                                 // Upgrade proposal (if applicable)
  notes:           text('notes'),
  metadata:        jsonb('metadata').$type<Record<string, unknown>>(),  // Freeform metadata

  // ── Timing ──
  startedAt:       timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt:     timestamp('completed_at', { withTimezone: true }),
  durationMs:      integer('duration_ms'),                              // Total duration

  // ── Timestamps ──
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const deploymentLogsRelations = relations(deploymentLogs, ({ one }) => ({
  program: one(deployedPrograms, {
    fields: [deploymentLogs.programId],
    references: [deployedPrograms.id],
  }),
  version: one(programVersions, {
    fields: [deploymentLogs.versionId],
    references: [programVersions.id],
  }),
}));
```

### Database Indexes

```sql
-- Performance indexes for the contracts registry

-- deployed_programs
CREATE UNIQUE INDEX idx_deployed_programs_addr_env
  ON deployed_programs(program_address, environment);
CREATE INDEX idx_deployed_programs_status
  ON deployed_programs(status);
CREATE INDEX idx_deployed_programs_name
  ON deployed_programs(program_name);
CREATE INDEX idx_deployed_programs_env
  ON deployed_programs(environment);

-- program_versions
CREATE UNIQUE INDEX idx_program_versions_prog_ver
  ON program_versions(program_id, version);
CREATE INDEX idx_program_versions_artifact
  ON program_versions(artifact_hash);
CREATE INDEX idx_program_versions_created
  ON program_versions(created_at DESC);

-- idl_registry
CREATE UNIQUE INDEX idx_idl_registry_prog_ver
  ON idl_registry(program_id, version);
CREATE INDEX idx_idl_registry_active
  ON idl_registry(program_id) WHERE active = true;
CREATE INDEX idx_idl_registry_hash
  ON idl_registry(idl_hash);

-- program_authorities
CREATE INDEX idx_program_authorities_prog
  ON program_authorities(program_id);
CREATE INDEX idx_program_authorities_event
  ON program_authorities(event_type);
CREATE INDEX idx_program_authorities_occurred
  ON program_authorities(occurred_at DESC);

-- deployment_logs
CREATE INDEX idx_deployment_logs_prog
  ON deployment_logs(program_id);
CREATE INDEX idx_deployment_logs_status
  ON deployment_logs(status);
CREATE INDEX idx_deployment_logs_operation
  ON deployment_logs(operation);
CREATE INDEX idx_deployment_logs_started
  ON deployment_logs(started_at DESC);
CREATE INDEX idx_deployment_logs_env
  ON deployment_logs(environment);
```

---

## Code Examples

### 1. Deploy a Program to Devnet

```typescript
import { createContractService } from '@mcv/web3-core/contracts';
import { Connection, Keypair } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

// ── Setup ──────────────────────────────────────────────────────
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const wallet = new Wallet(Keypair.fromSecretKey(/* deployer keypair */));
const provider = new AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
  preflightCommitment: 'confirmed',
});

const contractService = createContractService({
  connection,
  provider,
  environment: 'devnet',
  databaseUrl: process.env.SUPABASE_DATABASE_URL!,
  autoSyncIdl: true,
  autoRegenClients: true,
});

// ── Build Artifact ─────────────────────────────────────────────
const soBuffer = readFileSync('./target/deploy/mcv_marketplace.so');
const idlJson = JSON.parse(readFileSync('./target/idl/mcv_marketplace.json', 'utf-8'));

const artifact = {
  soPath: './target/deploy/mcv_marketplace.so',
  sha256: createHash('sha256').update(soBuffer).digest('hex'),
  idl: idlJson,
  programName: 'mcv_marketplace',
  anchorVersion: '0.30.1',
  solanaVersion: '1.18.17',
  rustVersion: '1.78.0',
  gitCommit: 'abc123def',
  builtAt: new Date().toISOString(),
};

// ── Verify Build ───────────────────────────────────────────────
const verification = await contractService.verifyBuild(artifact);
if (!verification.valid) {
  console.error('Build verification failed:', verification.errors);
  process.exit(1);
}
console.log('Build verified ✓');

// ── Deploy ─────────────────────────────────────────────────────
const programKeypair = Keypair.generate(); // Or use a deterministic keypair

const result = await contractService.deploy({
  artifact,
  environment: 'devnet',
  programKeypair,
  upgradeAuthority: wallet.publicKey,
  maxRentSol: 5.0, // Safety: don't spend more than 5 SOL on rent
  registerIdlOnChain: true,
  label: 'MCV Marketplace v1',
  notes: 'Initial deployment of the marketplace program',

  preDeployHook: async (config) => {
    console.log(`Deploying ${config.artifact.programName} to ${config.environment}...`);
  },

  postDeployHook: async (result) => {
    console.log(`Deployed to ${result.programId.toBase58()} (v${result.version})`);
    console.log(`Cost: ${result.costSol} SOL`);
    console.log(`Tx: ${result.txSignature}`);
  },
});

console.log('Deployment complete:', {
  deploymentId: result.deploymentId,
  programId: result.programId.toBase58(),
  version: result.version,
  environment: result.environment,
  costSol: result.costSol,
});

// ── Track Deployment Progress (for large programs) ─────────────
// For programs > 500KB, deployment uses multiple transactions.
// Use getDeploymentStatus() to track progress:

const statusInterval = setInterval(async () => {
  const status = await contractService.getDeploymentStatus(result.deploymentId);
  console.log(`Phase: ${status.phase}, Progress: ${status.progress}%`);
  if (status.phase === 'complete' || status.phase === 'failed') {
    clearInterval(statusInterval);
  }
}, 2000);
```

### 2. Upgrade a Program with Timelock & Multi-sig

```typescript
import { createContractService } from '@mcv/web3-core/contracts';
import { PublicKey } from '@solana/web3.js';

const contractService = createContractService({
  connection,
  provider,
  environment: 'mainnet-beta',
  databaseUrl: process.env.SUPABASE_DATABASE_URL!,
  multisigVault: new PublicKey('SQUADSvaultAddressHere11111111111111111111'),
  defaultTimelockDelay: 86400, // 24 hours
});

// ── Build & Verify New Artifact ────────────────────────────────
const newArtifact = {
  soPath: './target/deploy/mcv_marketplace.so',
  sha256: 'a1b2c3d4e5f6...', // SHA-256 of the new .so
  idl: newIdlJson,
  programName: 'mcv_marketplace',
  anchorVersion: '0.30.1',
  solanaVersion: '1.18.17',
  rustVersion: '1.78.0',
  gitCommit: 'def456ghi',
  builtAt: new Date().toISOString(),
};

const verification = await contractService.verifyBuild(newArtifact);
if (!verification.valid) {
  throw new Error(`Build verification failed: ${verification.errors.join(', ')}`);
}

// ── Propose Upgrade ────────────────────────────────────────────
const programId = new PublicKey('MarketP1aceProgram1111111111111111111111111');

const proposal = await contractService.proposeUpgrade({
  programId,
  artifact: newArtifact,
  environment: 'mainnet-beta',
  timelockDelay: 172800, // 48 hours for mainnet upgrades
  description: `
    ## Marketplace v2.3.0

    ### Changes
    - Added Dutch auction support
    - Fixed rounding error in fee calculation (#1234)
    - Added new event: AuctionCompleted

    ### Breaking Changes
    - ListingAccount size increased from 256 to 320 bytes
    - Removed deprecated 'create_listing_v1' instruction

    ### Account Migrations
    - ListingAccount: 256 → 320 bytes (migration instruction: migrate_listing_v2_3)
  `,
  accountMigrations: [
    {
      accountType: 'ListingAccount',
      previousSize: 256,
      newSize: 320,
      migrationInstruction: 'migrate_listing_v2_3',
      estimatedAccountCount: 15000,
      backwardsCompatible: false,
    },
  ],
});

console.log('Upgrade proposed:', {
  proposalId: proposal.proposalId,
  multisigTx: proposal.multisigTxAddress?.toBase58(),
  approvalsRequired: proposal.approvalsRequired,
  executableAfter: proposal.executableAfter,
  idlDiff: {
    addedInstructions: proposal.idlDiff.addedInstructions,
    removedInstructions: proposal.idlDiff.removedInstructions,
    breakingChanges: proposal.idlDiff.breakingChanges,
  },
});

// ── Multi-sig Signers Approve (each signer runs this) ─────────
// This is typically done via Squads UI or CLI by each signer:
//
// squads-cli approve-transaction \
//   --multisig SQUADSvaultAddressHere11111111111111111111 \
//   --transaction <proposal.multisigTxAddress>

// ── Execute After Timelock ─────────────────────────────────────
// Wait for timelock to expire (48 hours in this case)...
const now = new Date();
const executableAt = new Date(proposal.executableAfter);
if (now < executableAt) {
  const hoursRemaining = (executableAt.getTime() - now.getTime()) / 3600000;
  console.log(`Timelock active. Executable in ${hoursRemaining.toFixed(1)} hours.`);
  // In practice, a cron job or monitoring system triggers execution
}

// Once timelock expires and all signatures are collected:
const upgradeResult = await contractService.executeUpgrade(proposal.proposalId);

console.log('Upgrade executed:', {
  newVersion: upgradeResult.newVersion,
  txSignature: upgradeResult.txSignature,
  verified: upgradeResult.verified,
  rollbackSnapshotId: upgradeResult.rollbackSnapshot.snapshotId,
});

// ── Rollback (if issues discovered) ────────────────────────────
// If the new version has bugs, rollback to previous version:
const rollbackResult = await contractService.rollback(programId, upgradeResult.newVersion - 1);

if (rollbackResult.success) {
  console.log(`Rolled back to v${rollbackResult.restoredVersion}`);
  if (rollbackResult.warnings.length > 0) {
    console.warn('Rollback warnings:', rollbackResult.warnings);
  }
}
```

### 3. Cross-Program Invocation (CPI)

```typescript
import { CPIManager, CPIBuilder, PDADeriver } from '@mcv/web3-core/contracts';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';

// ── Configure CPI Between MCV Programs ─────────────────────────
const cpiManager = new CPIManager(contractService);

// Register CPI relationship: Marketplace → Treasury
await cpiManager.configureCpi({
  callerProgramId: new PublicKey('MarketP1aceProgram1111111111111111111111111'),
  calleeProgramId: new PublicKey('TreasuryProgram111111111111111111111111111'),
  instructionName: 'collect_fee',
  signWithPda: true,
  pdaSeeds: [Buffer.from('marketplace'), Buffer.from('fee_authority')],
  maxDepth: 2,
  computeBudget: 50000,
});

// Register CPI relationship: Marketplace → Token Program
await cpiManager.configureCpi({
  callerProgramId: new PublicKey('MarketP1aceProgram1111111111111111111111111'),
  calleeProgramId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  instructionName: 'transfer',
  signWithPda: true,
  pdaSeeds: [Buffer.from('marketplace'), Buffer.from('escrow')],
  maxDepth: 1,
  computeBudget: 20000,
});

// ── Validate CPI Chain ─────────────────────────────────────────
const validation = await cpiManager.validateCpiChain([
  {
    callId: 'step-1',
    caller: new PublicKey('MarketP1aceProgram1111111111111111111111111'),
    callee: new PublicKey('TreasuryProgram111111111111111111111111111'),
    instruction: 'collect_fee',
    args: [{ amount: 1000000 }], // 0.001 SOL fee
    accounts: [
      { pubkey: feeAuthority, isSigner: false, isWritable: false },
      { pubkey: treasuryVault, isSigner: false, isWritable: true },
    ],
    signerSeeds: [[Buffer.from('marketplace'), Buffer.from('fee_authority'), bumpBuffer]],
    depth: 1,
  },
  {
    callId: 'step-2',
    caller: new PublicKey('TreasuryProgram111111111111111111111111111'),
    callee: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    instruction: 'transfer',
    args: [{ amount: 1000000 }],
    accounts: [
      { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true },
      { pubkey: destinationAccount, isSigner: false, isWritable: true },
      { pubkey: treasuryAuthority, isSigner: false, isWritable: false },
    ],
    signerSeeds: [[Buffer.from('treasury'), Buffer.from('authority'), treasuryBumpBuffer]],
    depth: 2,
  },
]);

console.log('CPI chain validation:', {
  valid: validation.valid,
  depth: validation.depth,
  depthExceeded: validation.depthExceeded, // Solana limit is 4
  estimatedComputeUnits: validation.estimatedComputeUnits,
  computeBudgetWarning: validation.computeBudgetWarning,
});

if (!validation.valid) {
  console.error('CPI chain errors:', validation.errors);
}

// ── Build CPI Instruction ──────────────────────────────────────
const cpiBuilder = new CPIBuilder(contractService);

const cpiInstruction = await cpiBuilder
  .program(new PublicKey('TreasuryProgram111111111111111111111111111'))
  .instruction('collect_fee')
  .args({ amount: 1000000 })
  .accounts({
    feeAuthority,
    treasuryVault,
    systemProgram: SystemProgram.programId,
  })
  .signerSeeds([Buffer.from('marketplace'), Buffer.from('fee_authority'), bumpBuffer])
  .build();

console.log('CPI instruction built:', cpiInstruction);

// ── View CPI Graph ─────────────────────────────────────────────
const graph = await cpiManager.getCpiGraph(
  new PublicKey('MarketP1aceProgram1111111111111111111111111')
);

console.log('CPI Graph:', {
  program: graph.programId.toBase58(),
  callees: graph.callees.map(e => ({
    to: e.to.toBase58(),
    instructions: e.instructions,
    pdaSigned: e.pdaSigned,
  })),
  callers: graph.callers.map(e => ({
    from: e.from.toBase58(),
    instructions: e.instructions,
  })),
  maxDepth: graph.maxDepth,
  totalPrograms: graph.totalPrograms,
});
```

### 4. PDA Derivation & Account Management

```typescript
import { PDADeriver, AccountManager, RentCalculator } from '@mcv/web3-core/contracts';
import { PublicKey } from '@solana/web3.js';

const pdaDeriver = new PDADeriver();
const accountManager = new AccountManager(contractService);
const rentCalculator = new RentCalculator(connection);

// ── Derive a PDA ───────────────────────────────────────────────
const marketplaceProgramId = new PublicKey('MarketP1aceProgram1111111111111111111111111');
const sellerPubkey = new PublicKey('Se11erAddress1111111111111111111111111111111');
const listingId = 42;

// Derive listing PDA: seeds = ["listing", seller_pubkey, listing_id]
const listingPda = await pdaDeriver.derive({
  programId: marketplaceProgramId,
  seeds: [
    { type: 'literal', value: 'listing', label: 'prefix' },
    { type: 'pubkey', value: sellerPubkey, label: 'seller' },
    { type: 'u32', value: listingId, label: 'listing_id' },
  ],
  name: 'ListingAccount',
});

console.log('Listing PDA:', {
  address: listingPda.address.toBase58(),
  bump: listingPda.bump,
  seeds: listingPda.seeds.map(s => s.toString('hex')),
});

// ── Derive escrow PDA ──────────────────────────────────────────
const escrowPda = await pdaDeriver.derive({
  programId: marketplaceProgramId,
  seeds: [
    { type: 'literal', value: 'escrow', label: 'prefix' },
    { type: 'pubkey', value: listingPda.address, label: 'listing' },
  ],
  name: 'EscrowAccount',
});

console.log('Escrow PDA:', escrowPda.address.toBase58());

// ── Batch PDA Derivation ───────────────────────────────────────
// For bulk operations (e.g., derive PDAs for all listings)
const batchPdas = await Promise.all(
  Array.from({ length: 100 }, (_, i) =>
    pdaDeriver.derive({
      programId: marketplaceProgramId,
      seeds: [
        { type: 'literal', value: 'listing', label: 'prefix' },
        { type: 'pubkey', value: sellerPubkey, label: 'seller' },
        { type: 'u32', value: i, label: 'listing_id' },
      ],
    })
  )
);

console.log(`Derived ${batchPdas.length} PDAs`);

// ── Account Schema & Size Calculation ──────────────────────────
const listingSchema = await accountManager.getAccountSchema(
  marketplaceProgramId,
  'ListingAccount'
);

console.log('Listing account schema:', {
  name: listingSchema.name,
  discriminator: listingSchema.discriminator,
  size: listingSchema.size,
  fixedSize: listingSchema.fixedSize,
  sizeFormula: listingSchema.sizeFormula,
  fields: listingSchema.fields.map(f => ({
    name: f.name,
    type: f.type,
    offset: f.offset,
    size: f.size,
  })),
});

// ── Account Layout Visualization ───────────────────────────────
// Useful for debugging serialization issues
const layout = accountManager.getAccountLayout(listingSchema);

console.log('Account Layout:');
console.log('Offset  Size  Field');
console.log('──────  ────  ─────');
for (const segment of layout.segments) {
  console.log(
    `${String(segment.offset).padStart(6)}  ${String(segment.size).padStart(4)}  ${segment.fieldName} (${segment.type})`
  );
}

// ── Rent Calculation ───────────────────────────────────────────
const rentEstimate = await rentCalculator.calculate(listingSchema);

console.log('Rent for ListingAccount:', {
  sizeBytes: rentEstimate.sizeBytes,
  rentLamports: rentEstimate.rentLamports,
  rentSol: rentEstimate.rentSol,
});

// Calculate rent for a hypothetical account size
const customRent = await rentCalculator.calculateForSize(1024); // 1KB account
console.log(`Rent for 1KB account: ${customRent.rentSol} SOL`);

// ── Account Size Estimation (before deployment) ────────────────
// Estimate account sizes from IDL without deploying
const sizer = new AccountSizer();

const estimatedSize = sizer.estimateFromIdl(idlJson, 'ListingAccount', {
  // For variable-length fields, provide expected max lengths
  stringMaxLengths: { title: 64, description: 256 },
  vecMaxLengths: { tags: 10 },
});

console.log(`Estimated ListingAccount size: ${estimatedSize} bytes`);
```

### 5. IDL-Based Client Generation

```typescript
import { IDLRegistry, ClientGenerator, IDLDiffEngine } from '@mcv/web3-core/contracts';
import { PublicKey } from '@solana/web3.js';

const idlRegistry = new IDLRegistry(contractService);
const clientGenerator = new ClientGenerator();
const diffEngine = new IDLDiffEngine();

// ── Register IDL After Deployment ──────────────────────────────
const programId = new PublicKey('MarketP1aceProgram1111111111111111111111111');

await idlRegistry.register(programId, {
  version: '2.3.0',
  name: 'mcv_marketplace',
  instructions: [
    {
      name: 'createListing',
      discriminator: [0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0],
      accounts: [
        { name: 'seller', signer: true, writable: true },
        { name: 'listing', writable: true, pda: {
          seeds: [
            { kind: 'const', value: [0x6c, 0x69, 0x73, 0x74, 0x69, 0x6e, 0x67] }, // "listing"
            { kind: 'account', path: 'seller' },
          ],
        }},
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'price', type: 'u64' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
      ],
    },
    {
      name: 'purchaseListing',
      discriminator: [0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89],
      accounts: [
        { name: 'buyer', signer: true, writable: true },
        { name: 'seller', writable: true },
        { name: 'listing', writable: true },
        { name: 'escrow', writable: true },
        { name: 'tokenProgram', address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      ],
      args: [],
    },
    // ... more instructions
  ],
  accounts: [
    { name: 'ListingAccount', discriminator: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08] },
  ],
  types: [
    {
      name: 'ListingStatus',
      type: { kind: 'enum', variants: [
        { name: 'Active' },
        { name: 'Sold' },
        { name: 'Cancelled' },
      ]},
    },
  ],
  events: [
    { name: 'ListingCreated', discriminator: [0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80] },
    { name: 'ListingPurchased', discriminator: [0x11, 0x21, 0x31, 0x41, 0x51, 0x61, 0x71, 0x81] },
  ],
  errors: [
    { code: 6000, name: 'InsufficientFunds', msg: 'Buyer has insufficient funds' },
    { code: 6001, name: 'ListingNotActive', msg: 'Listing is not in active status' },
  ],
});

console.log('IDL registered for program', programId.toBase58());

// ── Diff Between IDL Versions ──────────────────────────────────
const diff = await idlRegistry.diff(programId, 1, 2);

console.log('IDL Diff v1 → v2:', {
  addedInstructions: diff.addedInstructions,       // ['createAuction', 'bidOnAuction']
  removedInstructions: diff.removedInstructions,     // ['create_listing_v1']
  modifiedInstructions: diff.modifiedInstructions,   // [{ name: 'createListing', ... }]
  backwardsCompatible: diff.backwardsCompatible,     // false
  breakingChanges: diff.breakingChanges,             // ['Removed instruction: create_listing_v1']
});

// ── Generate TypeScript Client ─────────────────────────────────
const generatedClient = await clientGenerator.generate(programId, {
  idl: await idlRegistry.getActive(programId),
  outputPath: './src/generated/marketplace-client.ts',
  includeTypes: true,
  includeInstructionBuilders: true,
  includeAccountDecoders: true,
  includeEventParsers: true,
});

console.log('Client generated:', {
  outputPath: generatedClient.outputPath,
  exportedTypes: generatedClient.exportedTypes,
  exportedMethods: generatedClient.exportedMethods,
  generatedAt: generatedClient.generatedAt,
});

// ── Use the Generated Client ───────────────────────────────────
// The generated client provides type-safe instruction builders:
//
// import { McvMarketplace } from './generated/marketplace-client';
//
// const marketplace = new McvMarketplace(provider, programId);
//
// // Type-safe instruction:
// const tx = await marketplace.createListing({
//   price: new BN(1_000_000_000), // 1 SOL
//   title: 'Rare NFT #1234',
//   description: 'A very rare NFT',
// }, {
//   seller: wallet.publicKey,
//   listing: listingPda.address,
//   systemProgram: SystemProgram.programId,
// });
//
// // Type-safe account fetch:
// const listing = await marketplace.account.listingAccount.fetch(listingPda.address);
// console.log(listing.price.toNumber()); // 1000000000
// console.log(listing.status);           // { active: {} }
```

### 6. Event Parsing & Subscription

```typescript
import { EventParser, EventSubscriber, LogDecoder } from '@mcv/web3-core/contracts';
import { PublicKey, Connection } from '@solana/web3.js';

const programId = new PublicKey('MarketP1aceProgram1111111111111111111111111');
const eventParser = new EventParser(contractService);
const logDecoder = new LogDecoder();

// ── Parse Events from a Transaction ────────────────────────────
const txSignature = '5KtP...abc123';
const events = await eventParser.parse(programId, txSignature);

for (const event of events) {
  console.log('Event:', {
    name: event.name,           // 'ListingCreated'
    data: event.data,           // { seller: PublicKey, price: BN, title: string }
    slot: event.slot,
    blockTime: event.blockTime,
    txSignature: event.txSignature,
    logIndex: event.logIndex,
  });
}

// ── Subscribe to Real-time Events ──────────────────────────────
const subscriber = new EventSubscriber(connection, contractService);

const subscription = subscriber.subscribe(programId, {
  eventNames: ['ListingCreated', 'ListingPurchased'],
  commitment: 'confirmed',
});

subscription.on('event', (event) => {
  switch (event.name) {
    case 'ListingCreated':
      console.log(`New listing: ${event.data.title} for ${event.data.price} lamports`);
      break;
    case 'ListingPurchased':
      console.log(`Listing purchased by ${event.data.buyer.toBase58()}`);
      break;
  }
});

subscription.on('error', (error) => {
  console.error('Event subscription error:', error);
});

// Clean up when done
// subscription.unsubscribe();

// ── Decode Raw Transaction Logs ────────────────────────────────
const txLogs = [
  'Program MarketP1aceProgram111111111111111111111111 invoke [1]',
  'Program log: Instruction: CreateListing',
  'Program data: ECA0VHBAAAAAgAAAAAAAAAAAAAAAAAAAAA...',
  'Program MarketP1aceProgram111111111111111111111111 consumed 25000 of 200000 compute units',
  'Program MarketP1aceProgram111111111111111111111111 success',
];

const decoded = logDecoder.decode(txLogs, programId);

for (const log of decoded) {
  console.log('Decoded log:', {
    type: log.type,          // 'invoke' | 'instruction' | 'event' | 'compute' | 'success' | 'error'
    message: log.message,
    data: log.data,
    programId: log.programId?.toBase58(),
  });
}

// ── Replay Events from a Specific Slot ─────────────────────────
// Useful for rebuilding off-chain state after downtime
const historicalEvents = await eventParser.replayFromSlot(programId, {
  fromSlot: 250_000_000,
  toSlot: 250_100_000,
  eventNames: ['ListingCreated', 'ListingPurchased', 'ListingCancelled'],
  batchSize: 100, // Process 100 transactions at a time
});

console.log(`Replayed ${historicalEvents.length} events from slots 250M-250.1M`);
```

### 7. Program Registry & Query

```typescript
import { ProgramRegistry } from '@mcv/web3-core/contracts';

const registry = new ProgramRegistry(contractService);

// ── List All Programs ──────────────────────────────────────────
const allPrograms = await registry.list({
  environment: 'mainnet-beta',
  status: 'active',
});

console.log(`${allPrograms.length} active programs on mainnet:`);
for (const program of allPrograms) {
  console.log(`  ${program.programName}: ${program.programAddress} (v${program.currentVersion})`);
}

// ── Query with Filters ─────────────────────────────────────────
const recentUpgrades = await registry.list({
  environment: 'mainnet-beta',
  upgradedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
  orderBy: 'lastUpgradedAt',
  orderDirection: 'desc',
  limit: 10,
});

// ── Get Specific Program Details ───────────────────────────────
const program = await registry.get(
  new PublicKey('MarketP1aceProgram1111111111111111111111111')
);

console.log('Program details:', {
  name: program.programName,
  address: program.programAddress,
  version: program.currentVersion,
  status: program.status,
  immutable: program.immutable,
  authority: program.upgradeAuthority,
  authorityType: program.authorityType,
  firstDeployed: program.firstDeployedAt,
  lastUpgraded: program.lastUpgradedAt,
});

// ── Sync Registry with On-chain State ──────────────────────────
// Ensures off-chain registry matches what's actually on-chain
const syncResult = await registry.sync();

console.log('Registry sync:', {
  programsChecked: syncResult.programsChecked,
  discrepancies: syncResult.discrepancies,
  updated: syncResult.updated,
  errors: syncResult.errors,
});
```

### 8. Transaction Composition with Instruction Builders

```typescript
import { InstructionBuilder, TransactionComposer } from '@mcv/web3-core/contracts';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

const ixBuilder = new InstructionBuilder(contractService);
const composer = new TransactionComposer(connection);

// ── Build Individual Instructions ──────────────────────────────
const createListingIx = await ixBuilder.build(
  new PublicKey('MarketP1aceProgram1111111111111111111111111'),
  'createListing',
  [
    new BN(2 * LAMPORTS_PER_SOL), // price: 2 SOL
    'Rare Digital Art #42',        // title
    'A unique piece of art',       // description
  ],
  [
    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
    { pubkey: listingPda.address, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ]
);

const setRoyaltyIx = await ixBuilder.build(
  new PublicKey('MarketP1aceProgram1111111111111111111111111'),
  'setRoyalty',
  [
    500, // 5% royalty (basis points)
  ],
  [
    { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
    { pubkey: listingPda.address, isSigner: false, isWritable: true },
  ]
);

// ── Compose Multi-instruction Transaction ──────────────────────
const composed = await composer.compose([createListingIx, setRoyaltyIx], {
  feePayer: wallet.publicKey,
  priorityFee: 10000, // 10000 micro-lamports per CU
  computeUnits: 200000,
  recentBlockhash: 'auto', // Fetches latest blockhash
});

console.log('Composed transaction:', {
  instructionCount: composed.instructions.length,
  estimatedSize: composed.estimatedSize,
  estimatedFee: composed.estimatedFee,
});

// Simulate before sending
const simulation = await composer.simulate(composed);
console.log('Simulation result:', {
  success: simulation.success,
  computeUnitsConsumed: simulation.computeUnitsConsumed,
  logs: simulation.logs,
  error: simulation.error,
});

if (simulation.success) {
  const txSignature = await composer.sendAndConfirm(composed, {
    commitment: 'confirmed',
    maxRetries: 3,
  });
  console.log('Transaction confirmed:', txSignature);
}
```

---

## Error Codes

| Code | Name | Description | Recovery |
|------|------|-------------|----------|
| `CONTRACT_DEPLOY_FAILED` | Deployment Failed | BPF loader rejected the program deployment. Check bytecode validity. | Verify build artifact, check account balance for rent, retry. |
| `CONTRACT_UPGRADE_UNAUTHORIZED` | Upgrade Unauthorized | Signer is not the program's upgrade authority. | Use the correct authority keypair or multi-sig approval. |
| `CONTRACT_UPGRADE_TIMELOCK` | Timelock Not Expired | Upgrade cannot execute before timelock delay has passed. | Wait for timelock period to expire, then retry. |
| `CONTRACT_UPGRADE_THRESHOLD` | Multi-sig Threshold Not Met | Insufficient multi-sig approvals for the upgrade. | Collect remaining signatures from multi-sig members. |
| `CONTRACT_IDL_MISMATCH` | IDL Mismatch | On-chain program does not match the registered IDL. | Re-register the correct IDL or verify the program bytecode. |
| `CONTRACT_IDL_BREAKING` | Breaking IDL Change | IDL change contains backwards-incompatible modifications. | Review breaking changes, plan account migration, update clients. |
| `CONTRACT_PDA_DERIVATION_FAILED` | PDA Derivation Failed | Could not derive a valid PDA from the given seeds. | Check seed values and types. Seeds must produce a valid off-curve point. |
| `CONTRACT_CPI_DEPTH_EXCEEDED` | CPI Depth Exceeded | Cross-program invocation chain exceeds Solana's max depth (4). | Restructure program interactions to reduce CPI nesting. |
| `CONTRACT_CPI_SIGNER_MISMATCH` | CPI Signer Mismatch | PDA signer seeds don't match the expected PDA address. | Verify PDA seeds and bump match the derived address. |
| `CONTRACT_ACCOUNT_SIZE_MISMATCH` | Account Size Mismatch | Account data doesn't match expected schema size. | Check account schema version, run migration if needed. |
| `CONTRACT_RENT_INSUFFICIENT` | Insufficient Rent | Account has insufficient lamports for rent exemption. | Fund the account with enough SOL for rent-exempt minimum. |
| `CONTRACT_BUILD_VERIFICATION_FAILED` | Build Verification Failed | Build artifact failed integrity or compatibility checks. | Rebuild with correct toolchain versions, verify checksums. |
| `CONTRACT_PROGRAM_FROZEN` | Program Frozen | Cannot upgrade an immutable (frozen) program. | This is intentional — the program cannot be changed. |
| `CONTRACT_ROLLBACK_EXPIRED` | Rollback Expired | Rollback snapshot has expired and is no longer available. | Deploy the previous version as a new upgrade instead. |
| `CONTRACT_ROLLBACK_INCOMPATIBLE` | Rollback Incompatible | Cannot rollback due to incompatible account schema changes. | Manual migration required — deploy a new version that handles both schemas. |
| `CONTRACT_REGISTRY_SYNC_FAILED` | Registry Sync Failed | Off-chain registry could not sync with on-chain state. | Check RPC connectivity, retry. May indicate unauthorized on-chain changes. |
| `CONTRACT_COMPUTE_BUDGET_EXCEEDED` | Compute Budget Exceeded | Transaction exceeded the allocated compute budget. | Increase compute unit limit or optimize program logic. |
| `CONTRACT_AUTHORITY_TRANSFER_FAILED` | Authority Transfer Failed | Failed to transfer program upgrade authority. | Verify current authority signer, check transaction validity. |

### Error Handling Pattern

```typescript
import { ContractError, ContractErrorCode } from '@mcv/web3-core/contracts';

try {
  await contractService.deploy(config);
} catch (error) {
  if (error instanceof ContractError) {
    switch (error.code) {
      case ContractErrorCode.DEPLOY_FAILED:
        console.error('Deployment failed:', error.message);
        console.error('Suggestions:', error.recovery);
        break;

      case ContractErrorCode.UPGRADE_UNAUTHORIZED:
        console.error('Not authorized. Current authority:', error.details?.currentAuthority);
        break;

      case ContractErrorCode.UPGRADE_TIMELOCK:
        console.error('Timelock active. Executable after:', error.details?.executableAfter);
        break;

      case ContractErrorCode.IDL_BREAKING:
        console.error('Breaking changes detected:');
        for (const change of error.details?.breakingChanges ?? []) {
          console.error(`  - ${change}`);
        }
        break;

      case ContractErrorCode.CPI_DEPTH_EXCEEDED:
        console.error(`CPI depth ${error.details?.depth} exceeds limit of ${error.details?.maxDepth}`);
        break;

      case ContractErrorCode.PROGRAM_FROZEN:
        console.error('Program is immutable. No further upgrades are possible.');
        break;

      default:
        console.error(`Contract error [${error.code}]:`, error.message);
    }
  } else {
    throw error; // Re-throw non-contract errors
  }
}
```

---

## Security Considerations

### ⚠️ CRITICAL: Upgrade Authority

The **upgrade authority** of a Solana program has **absolute control** over its behavior. Whoever holds the upgrade authority can replace the program's bytecode with anything — including code that drains all user funds. This makes upgrade authority management the single most important security concern in the contracts module.

#### Upgrade Authority Security Model

```
┌──────────────────────────────────────────────────────────────────┐
│                   AUTHORITY SECURITY LAYERS                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Layer 1: Multi-Sig (Squads Protocol)                            │
│  ├── M-of-N threshold signing                                    │
│  ├── No single point of compromise                               │
│  ├── Hardware wallet enforcement for signers                     │
│  └── Signer rotation without program redeploy                    │
│                                                                   │
│  Layer 2: Timelock                                                │
│  ├── Mandatory delay before upgrade execution                    │
│  ├── Community review period                                      │
│  ├── Cancellation window for detected issues                     │
│  └── Emergency bypass with higher threshold                      │
│                                                                   │
│  Layer 3: Build Verification                                      │
│  ├── SHA-256 artifact hash verification                          │
│  ├── On-chain bytecode comparison                                │
│  ├── Reproducible builds (deterministic compilation)             │
│  └── Git commit linkage for audit trail                          │
│                                                                   │
│  Layer 4: Registry Audit Trail                                    │
│  ├── Every authority change is logged                            │
│  ├── Off-chain + on-chain records                                │
│  ├── Immutable event history                                      │
│  └── Discrepancy detection via sync                              │
│                                                                   │
│  Layer 5: Immutability (Final)                                    │
│  ├── Revoke upgrade authority permanently                        │
│  ├── Program becomes mathematically unchangeable                 │
│  ├── Highest security guarantee                                   │
│  └── ⚠️ IRREVERSIBLE — cannot be undone                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Security Rules

1. **Never use a single-key upgrade authority on mainnet.** Always use multi-sig (Squads Protocol) with a minimum 2-of-3 threshold. Prefer 3-of-5 for critical programs.

2. **Always enable timelocks on mainnet.** Minimum 24 hours for routine upgrades, 48-72 hours for programs that custody user funds. This gives the community time to review and cancel malicious upgrades.

3. **Store multi-sig signer keys on hardware wallets.** Ledger or equivalent. Never store upgrade authority keys as plaintext on any server.

4. **Geographically distribute signers.** Multi-sig signers should be in different physical locations and jurisdictions to prevent coordinated compromise.

5. **Verify builds are reproducible.** Use `anchor verify` or equivalent to confirm that the deployed bytecode matches the source code at a specific git commit.

6. **Freeze programs when mature.** Once a program is stable and battle-tested, consider revoking the upgrade authority to make it permanently immutable. This is the ultimate security guarantee.

7. **Monitor for unauthorized authority changes.** The registry sync process checks on-chain authority against the off-chain record. Any discrepancy triggers an alert.

8. **Emergency procedures must be pre-defined.** If a critical vulnerability is found, the emergency upgrade path (higher multi-sig threshold, bypassed timelock) must be documented and tested before it's needed.

#### Authority for Different Environments

| Environment | Authority Type | Threshold | Timelock | Notes |
|-------------|---------------|-----------|----------|-------|
| `local` | Single key | N/A | None | Developer convenience |
| `devnet` | Single key | N/A | None | Testing environment |
| `testnet` | Multi-sig | 2-of-3 | 1 hour | Mirrors mainnet process |
| `mainnet-beta` | Multi-sig | 3-of-5 | 48 hours | Full security |
| `mainnet-beta` (critical) | Multi-sig | 4-of-7 | 72 hours | Custody programs |

### Additional Security Measures

#### PDA Security

PDAs (Program Derived Addresses) are the primary mechanism for program-controlled accounts on Solana. Security considerations:

- **Always validate PDA derivation on-chain.** Never trust a PDA address passed by a client without re-deriving it in the program.
- **Include the bump seed in account data.** Store the canonical bump to avoid re-derivation costs and prevent bump-seed canonicalization attacks.
- **Use unique seed prefixes.** Each PDA type should have a unique string prefix seed (e.g., `"listing"`, `"escrow"`) to prevent collisions.

#### CPI Security

- **Validate all accounts in CPI calls.** A malicious program could pass unexpected accounts. Always verify program IDs and account owners.
- **Be aware of CPI re-entrancy.** While Solana's runtime prevents some re-entrancy attacks, complex CPI chains can still have unexpected interactions.
- **Limit CPI depth.** The module enforces a configurable maximum CPI depth (default: 3, Solana max: 4).

#### Key Management

```typescript
// ❌ NEVER: Store keys in environment variables on mainnet
const authority = Keypair.fromSecretKey(Buffer.from(process.env.AUTHORITY_KEY!, 'base64'));

// ✅ ALWAYS: Use multi-sig for mainnet
const multisigVault = new PublicKey('SQUADSvaultAddressHere11111111111111111111');
await contractService.configureMultiSig(programId, {
  vaultAddress: multisigVault,
  threshold: 3,
  totalSigners: 5,
  signers: [signer1, signer2, signer3, signer4, signer5],
  multisigAddress: squadsMultisig,
  sharedMultisig: false,
});

// ✅ For devnet/testing only: single key is acceptable
if (environment === 'devnet') {
  const devKeypair = Keypair.fromSecretKey(/* local dev key */);
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SOLANA_RPC_URL` | Yes | — | Primary Solana RPC endpoint URL |
| `SOLANA_RPC_URL_DEVNET` | No | `https://api.devnet.solana.com` | Devnet RPC endpoint |
| `SOLANA_RPC_URL_TESTNET` | No | `https://api.testnet.solana.com` | Testnet RPC endpoint |
| `SOLANA_RPC_URL_MAINNET` | No | `https://api.mainnet-beta.solana.com` | Mainnet RPC endpoint |
| `SUPABASE_DATABASE_URL` | Yes | — | PostgreSQL connection string for the registry |
| `CONTRACTS_ENVIRONMENT` | No | `devnet` | Default deployment environment |
| `CONTRACTS_MULTISIG_VAULT` | No* | — | Squads multi-sig vault address (*Required for mainnet) |
| `CONTRACTS_TIMELOCK_DELAY` | No | `86400` | Default timelock delay in seconds (24h) |
| `CONTRACTS_ANCHOR_WORKSPACE` | No | `./` | Path to Anchor workspace root |
| `CONTRACTS_AUTO_SYNC_IDL` | No | `true` | Auto-sync IDL after deployments |
| `CONTRACTS_AUTO_REGEN_CLIENTS` | No | `true` | Auto-regenerate clients after IDL changes |
| `CONTRACTS_MAX_CPI_DEPTH` | No | `3` | Maximum allowed CPI depth |
| `CONTRACTS_BUILD_CACHE_DIR` | No | `./.build-cache` | Directory for caching build artifacts (for rollback) |
| `CONTRACTS_ROLLBACK_TTL_DAYS` | No | `30` | Days to keep rollback snapshots |
| `CONTRACTS_CLIENT_OUTPUT_DIR` | No | `./src/generated` | Output directory for generated TypeScript clients |
| `CONTRACTS_PRIORITY_FEE` | No | `0` | Default priority fee in micro-lamports per CU |
| `CONTRACTS_COMPUTE_UNITS` | No | `200000` | Default compute unit budget |
| `CONTRACTS_SIMULATION_ENABLED` | No | `true` | Simulate transactions before sending |

### Environment-Specific Configuration

```typescript
// config/contracts.ts
import { DeploymentEnvironment } from '@mcv/web3-core/contracts';

export const contractsConfig: Record<DeploymentEnvironment, Partial<ContractServiceConfig>> = {
  local: {
    rpcEndpoints: { local: 'http://localhost:8899' },
    defaultTimelockDelay: 0,
    maxCpiDepth: 4,
  },
  devnet: {
    rpcEndpoints: { devnet: process.env.SOLANA_RPC_URL_DEVNET },
    defaultTimelockDelay: 0,
    autoSyncIdl: true,
    autoRegenClients: true,
  },
  testnet: {
    rpcEndpoints: { testnet: process.env.SOLANA_RPC_URL_TESTNET },
    defaultTimelockDelay: 3600, // 1 hour
    multisigVault: new PublicKey(process.env.CONTRACTS_MULTISIG_VAULT_TESTNET!),
  },
  'mainnet-beta': {
    rpcEndpoints: { 'mainnet-beta': process.env.SOLANA_RPC_URL_MAINNET },
    defaultTimelockDelay: 172800, // 48 hours
    multisigVault: new PublicKey(process.env.CONTRACTS_MULTISIG_VAULT!),
    autoSyncIdl: true,
    autoRegenClients: true,
  },
};
```

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@solana/web3.js` | `^1.95.0` | Solana JSON-RPC client, transaction construction, keypair management |
| `@coral-xyz/anchor` | `^0.30.1` | Anchor framework: IDL parsing, program interaction, account deserialization |
| `@sqds/multisig` | `^2.1.0` | Squads Protocol SDK for multi-sig transaction management |
| `drizzle-orm` | `^0.33.0` | TypeScript ORM for Supabase PostgreSQL (registry schemas) |
| `@trpc/server` | `^10.45.0` | tRPC router for contracts API endpoints |
| `bs58` | `^6.0.0` | Base58 encoding/decoding for Solana addresses |
| `borsh` | `^2.0.0` | Binary serialization for Solana account data |
| `zod` | `^3.23.0` | Runtime validation for configurations and API inputs |
| `crypto` | (built-in) | SHA-256 hashing for build artifact verification |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `solana-bankrun` | `^0.4.0` | Fast local Solana validator for testing (BanksClient) |
| `@solana/spl-token` | `^0.4.0` | SPL Token program utilities for testing token interactions |
| `anchor-bankrun` | `^0.5.0` | Anchor integration with bankrun for fast tests |
| `typescript` | `^5.5.0` | TypeScript compiler |
| `vitest` | `^2.0.0` | Test runner |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/web3-core/wallet` | `*` | Wallet management for signing transactions |
| `@mcv/web3-core/rpc` | `*` | RPC connection pooling and rate limiting |
| `@mcv/shared/logger` | `*` | Structured logging |
| `@mcv/shared/config` | `*` | Environment configuration management |

---

## Testing

### Test Strategy

The contracts module requires a multi-layered testing approach due to its interaction with the Solana blockchain:

```
┌─────────────────────────────────────────────────────┐
│                   TEST PYRAMID                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│              ┌──────────────┐                        │
│              │   E2E Tests  │  ← Devnet integration  │
│              │   (slow)     │    Real RPC, real fees  │
│              └──────┬───────┘                        │
│                     │                                │
│           ┌─────────┴─────────┐                      │
│           │  Integration Tests │  ← Local validator   │
│           │  (medium)          │    bankrun / test-   │
│           │                    │    validator          │
│           └─────────┬──────────┘                     │
│                     │                                │
│        ┌────────────┴────────────┐                   │
│        │     Unit Tests          │  ← Mocked RPC     │
│        │     (fast)              │    Pure logic      │
│        │                         │    IDL parsing     │
│        └─────────────────────────┘                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { PDADeriver } from '@mcv/web3-core/contracts';
import { PublicKey } from '@solana/web3.js';

describe('PDADeriver', () => {
  const deriver = new PDADeriver();

  it('should derive a PDA with literal and pubkey seeds', async () => {
    const programId = new PublicKey('MarketP1aceProgram1111111111111111111111111');
    const seller = new PublicKey('Se11erAddress1111111111111111111111111111111');

    const result = await deriver.derive({
      programId,
      seeds: [
        { type: 'literal', value: 'listing' },
        { type: 'pubkey', value: seller },
      ],
    });

    expect(result.address).toBeInstanceOf(PublicKey);
    expect(result.bump).toBeGreaterThanOrEqual(0);
    expect(result.bump).toBeLessThanOrEqual(255);
    expect(result.seeds).toHaveLength(2);
  });

  it('should produce deterministic PDAs', async () => {
    const programId = new PublicKey('MarketP1aceProgram1111111111111111111111111');

    const result1 = await deriver.derive({
      programId,
      seeds: [{ type: 'literal', value: 'test' }],
    });

    const result2 = await deriver.derive({
      programId,
      seeds: [{ type: 'literal', value: 'test' }],
    });

    expect(result1.address.toBase58()).toBe(result2.address.toBase58());
    expect(result1.bump).toBe(result2.bump);
  });

  it('should use canonical (highest) bump', async () => {
    const programId = new PublicKey('MarketP1aceProgram1111111111111111111111111');

    const result = await deriver.derive({
      programId,
      seeds: [{ type: 'literal', value: 'canonical' }],
    });

    // The canonical bump is the first valid bump found (starting from 255)
    // Verify by re-deriving with the bump
    const [expectedAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('canonical')],
      programId
    );

    expect(result.address.toBase58()).toBe(expectedAddress.toBase58());
  });
});

describe('IDLDiffEngine', () => {
  it('should detect added instructions', () => {
    const oldIdl = { instructions: [{ name: 'foo' }] };
    const newIdl = { instructions: [{ name: 'foo' }, { name: 'bar' }] };

    const diff = diffEngine.compute(oldIdl, newIdl);

    expect(diff.addedInstructions).toContain('bar');
    expect(diff.removedInstructions).toHaveLength(0);
    expect(diff.backwardsCompatible).toBe(true);
  });

  it('should detect removed instructions as breaking', () => {
    const oldIdl = { instructions: [{ name: 'foo' }, { name: 'bar' }] };
    const newIdl = { instructions: [{ name: 'foo' }] };

    const diff = diffEngine.compute(oldIdl, newIdl);

    expect(diff.removedInstructions).toContain('bar');
    expect(diff.backwardsCompatible).toBe(false);
    expect(diff.breakingChanges).toContain('Removed instruction: bar');
  });
});

describe('RentCalculator', () => {
  it('should calculate rent-exempt minimum', async () => {
    const mockConnection = {
      getMinimumBalanceForRentExemption: vi.fn().mockResolvedValue(1_461_600),
    };

    const calculator = new RentCalculator(mockConnection as any);
    const result = await calculator.calculateForSize(165); // Token account size

    expect(result.sizeBytes).toBe(165);
    expect(result.rentLamports).toBe(1_461_600);
    expect(result.rentSol).toBeCloseTo(0.00146, 4);
  });
});
```

### Integration Tests (Local Validator)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { createContractService, LocalValidator } from '@mcv/web3-core/contracts';
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

describe('Contract Deployment (Integration)', () => {
  let context: any;
  let provider: BankrunProvider;
  let contractService: ContractService;
  let deployer: Keypair;

  beforeAll(async () => {
    deployer = Keypair.generate();

    // Start local validator with bankrun (much faster than solana-test-validator)
    context = await startAnchor(
      './', // Anchor workspace path
      [],   // Extra programs to load
      [
        {
          address: deployer.publicKey,
          info: {
            lamports: 100 * LAMPORTS_PER_SOL,
            data: Buffer.alloc(0),
            owner: new PublicKey('11111111111111111111111111111111'),
            executable: false,
          },
        },
      ]
    );

    provider = new BankrunProvider(context);

    contractService = createContractService({
      connection: provider.connection,
      provider,
      environment: 'local',
      databaseUrl: process.env.TEST_DATABASE_URL!,
    });
  });

  it('should deploy a program to local validator', async () => {
    const artifact = loadTestArtifact('mcv_marketplace');
    const programKeypair = Keypair.generate();

    const result = await contractService.deploy({
      artifact,
      environment: 'local',
      programKeypair,
      upgradeAuthority: deployer.publicKey,
    });

    expect(result.programId.toBase58()).toBe(programKeypair.publicKey.toBase58());
    expect(result.version).toBe(1);

    // Verify the program is actually deployed on-chain
    const accountInfo = await provider.connection.getAccountInfo(result.programId);
    expect(accountInfo).not.toBeNull();
    expect(accountInfo!.executable).toBe(true);
  });

  it('should upgrade a deployed program', async () => {
    const programId = /* previously deployed program */;
    const newArtifact = loadTestArtifact('mcv_marketplace_v2');

    const proposal = await contractService.proposeUpgrade({
      programId,
      artifact: newArtifact,
      environment: 'local',
      timelockDelay: 0, // No timelock for local testing
      description: 'Test upgrade',
    });

    const result = await contractService.executeUpgrade(proposal.proposalId);

    expect(result.newVersion).toBe(2);
    expect(result.verified).toBe(true);
  });

  it('should freeze a program (revoke upgrade authority)', async () => {
    const programId = /* deployed program */;

    const freezeResult = await contractService.freezeProgram(programId);

    expect(freezeResult.success).toBe(true);
    expect(freezeResult.warning).toContain('IRREVERSIBLE');

    // Verify on-chain: upgrade authority should be null
    const programInfo = await provider.connection.getAccountInfo(programId);
    // The program data account's upgrade authority field should be None
    const authority = await contractService.getAuthority(programId);
    expect(authority.immutable).toBe(true);
    expect(authority.upgradeAuthority).toBeNull();
  });

  it('should reject upgrades on frozen programs', async () => {
    const frozenProgramId = /* frozen program */;

    await expect(
      contractService.proposeUpgrade({
        programId: frozenProgramId,
        artifact: someArtifact,
        environment: 'local',
        description: 'Should fail',
      })
    ).rejects.toThrow(ContractError);
  });
});
```

### Test Utilities

```typescript
import { LocalValidator, ProgramTestHarness, AccountFixtureLoader } from '@mcv/web3-core/contracts';

// ── Start Local Validator with Programs ────────────────────────
const validator = await contractService.startLocalValidator({
  programs: [
    { name: 'mcv_marketplace', path: './target/deploy/mcv_marketplace.so' },
    { name: 'mcv_treasury', path: './target/deploy/mcv_treasury.so' },
  ],
  accounts: [
    // Preload accounts with specific state
    { address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', executable: true },
  ],
  resetOnStart: true,
  logLevel: 'warn',
});

// ── Create Test Harness ────────────────────────────────────────
const harness = await contractService.createTestContext(marketplaceProgramId);

// Harness provides:
// - Pre-funded test wallets
// - Helper methods for common operations
// - Automatic cleanup

const { wallet: testWallet, connection: testConnection } = harness;

// Fund a test account
await harness.airdrop(testWallet.publicKey, 10 * LAMPORTS_PER_SOL);

// Execute instruction and get parsed result
const result = await harness.executeInstruction('createListing', {
  args: { price: new BN(1_000_000_000), title: 'Test', description: 'Test listing' },
  accounts: { seller: testWallet.publicKey },
});

expect(result.success).toBe(true);
expect(result.events).toContainEqual(
  expect.objectContaining({ name: 'ListingCreated' })
);

// ── Load Account Fixtures ──────────────────────────────────────
const fixtures = new AccountFixtureLoader('./test/fixtures');

// Load pre-built account state from JSON fixtures
await fixtures.load(testConnection, [
  'listing-active.json',      // A listing in Active status
  'listing-sold.json',        // A listing in Sold status
  'seller-profile.json',      // A seller profile account
]);

// Cleanup
await validator.stop();
```

---

## tRPC Router

```typescript
import { router, protectedProcedure, publicProcedure } from '@mcv/shared/trpc';
import { z } from 'zod';

export const contractsRouter = router({
  // ── Registry Queries ──
  listPrograms: publicProcedure
    .input(z.object({
      environment: z.enum(['local', 'devnet', 'testnet', 'mainnet-beta']).optional(),
      status: z.enum(['deploying', 'active', 'upgrading', 'frozen', 'deprecated', 'decommissioned', 'failed']).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.contractService.listPrograms(input);
    }),

  getProgram: publicProcedure
    .input(z.object({ programAddress: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.contractService.getProgram(new PublicKey(input.programAddress));
    }),

  getProgramVersions: publicProcedure
    .input(z.object({
      programAddress: z.string(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.contractService.getVersionHistory(
        new PublicKey(input.programAddress),
        input.limit,
      );
    }),

  getIdl: publicProcedure
    .input(z.object({
      programAddress: z.string(),
      version: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.contractService.getIdl(
        new PublicKey(input.programAddress),
        input.version,
      );
    }),

  diffIdl: publicProcedure
    .input(z.object({
      programAddress: z.string(),
      fromVersion: z.number(),
      toVersion: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.contractService.diffIdl(
        new PublicKey(input.programAddress),
        input.fromVersion,
        input.toVersion,
      );
    }),

  // ── Protected Operations ──
  deploy: protectedProcedure
    .input(z.object({
      artifactPath: z.string(),
      environment: z.enum(['devnet', 'testnet', 'mainnet-beta']),
      label: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only authorized deployers can trigger deployments
      return ctx.contractService.deploy(input);
    }),

  proposeUpgrade: protectedProcedure
    .input(z.object({
      programAddress: z.string(),
      artifactPath: z.string(),
      description: z.string(),
      timelockDelay: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.contractService.proposeUpgrade(input);
    }),

  syncRegistry: protectedProcedure
    .mutation(async ({ ctx }) => {
      return ctx.contractService.syncRegistry();
    }),
});
```

---

## Related Modules

| Module | Relationship | Description |
|--------|-------------|-------------|
| `@mcv/web3-core/wallet` | **Dependency** | Provides keypairs and signing for deployment transactions |
| `@mcv/web3-core/rpc` | **Dependency** | RPC connection pooling, rate limiting, failover |
| `@mcv/web3-core/tokens` | **Peer** | Token program interactions, SPL token account management |
| `@mcv/web3-core/transactions` | **Peer** | Transaction building, priority fees, retry logic |
| `@mcv/shared/logger` | **Dependency** | Structured logging for deployment operations |
| `@mcv/shared/config` | **Dependency** | Environment variable management |
| `@mcv/shared/crypto` | **Dependency** | SHA-256 hashing for artifact verification |

---

*Last updated: 2025-02-08*
*Module version: 1.0.0*
*Maintainers: MCV Core Team*