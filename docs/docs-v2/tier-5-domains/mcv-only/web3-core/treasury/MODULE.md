# @mcv/web3-core/treasury

> **Tier 5 · MCV-Only · On-Chain Treasury Management**

| Field | Value |
|---|---|
| **Package** | `@mcv/web3-core/treasury` |
| **Tier** | 5 — Domain (MCV-Only) |
| **Parent** | `@mcv/web3-core` |
| **Complementary** | `@mcv/treasury` (fiat-side) |
| **Runtime** | Server-side (Node 20+) |
| **Chain** | Solana (mainnet-beta / devnet) |
| **Multi-sig** | Squads Protocol v4 |
| **Database** | Supabase PostgreSQL via Drizzle ORM |
| **API Layer** | tRPC v11 |
| **Status** | Active Development |

---

## Purpose

`@mcv/web3-core/treasury` is the **on-chain treasury management** submodule responsible for the secure custody, allocation, and disbursement of MCV's digital assets on the Solana blockchain. It manages multi-signature wallets via Squads Protocol, enforces spending governance through on-chain proposal workflows, and maintains a complete on-chain accounting ledger for every token movement in and out of treasury-controlled accounts. This module is the cryptographic backbone of MCV's financial operations — the last line of defense between organizational funds and unauthorized access.

This submodule is explicitly **distinct from the parent `@mcv/treasury` package**, which handles fiat-side treasury operations: bank account management, fiat runway calculations, invoice payments, payroll disbursements, and traditional accounting. While `@mcv/treasury` thinks in dollars, bank wires, and QuickBooks categories, `@mcv/web3-core/treasury` thinks in lamports, Squads vault transactions, and on-chain program-derived addresses. The two systems reconcile through a dedicated fiat-reconciliation pipeline that maps on-chain token movements to their fiat equivalents, ensuring a unified view of MCV's total treasury position across both worlds.

The on-chain treasury enforces a strict governance model: no funds leave treasury wallets without a formally submitted spending proposal that meets the configured multi-sig threshold. Budget enforcement happens at the category level — operations, development, marketing, grants — with automatic rejection of proposals that would exceed allocated budgets. Vesting schedules for team members, advisors, and partners execute directly from treasury vaults, with cliff and linear unlock mechanics enforced by on-chain state. Emergency procedures provide break-glass recovery paths that still require elevated multi-sig thresholds, ensuring that even crisis scenarios maintain the principle of distributed trust.

---

## Exports

```typescript
// @mcv/web3-core/treasury — Public API

// ── Core Service ──────────────────────────────────────────────────
export { OnChainTreasuryService } from './services/on-chain-treasury.service';
export { TreasuryServiceConfig } from './services/treasury-config';
export { createTreasuryService } from './services/factory';

// ── Multi-sig Wallet Management ───────────────────────────────────
export { TreasuryWalletManager } from './wallets/wallet-manager';
export { SquadsMultisigAdapter } from './wallets/squads-adapter';
export { WalletHealthMonitor } from './wallets/health-monitor';

// ── Spending Proposals ────────────────────────────────────────────
export { SpendingProposalService } from './proposals/spending-proposal.service';
export { ProposalWorkflowEngine } from './proposals/workflow-engine';
export { ApprovalCollector } from './proposals/approval-collector';

// ── Treasury Allocation & Diversification ─────────────────────────
export { TreasuryAllocator } from './allocation/treasury-allocator';
export { DiversificationEngine } from './allocation/diversification-engine';
export { RebalanceScheduler } from './allocation/rebalance-scheduler';
export { YieldPositionManager } from './allocation/yield-positions';

// ── Budget Enforcement ────────────────────────────────────────────
export { BudgetEnforcementService } from './budget/budget-enforcement.service';
export { CategoryBudgetManager } from './budget/category-manager';
export { BudgetAlertSystem } from './budget/alert-system';

// ── Vesting ───────────────────────────────────────────────────────
export { VestingScheduleService } from './vesting/vesting-schedule.service';
export { VestingExecutor } from './vesting/vesting-executor';
export { CliffCalculator } from './vesting/cliff-calculator';

// ── Grants ────────────────────────────────────────────────────────
export { GrantDisbursementService } from './grants/grant-disbursement.service';
export { MilestoneTracker } from './grants/milestone-tracker';
export { GrantProposalFactory } from './grants/proposal-factory';

// ── On-chain Accounting ───────────────────────────────────────────
export { OnChainAccountingService } from './accounting/on-chain-accounting.service';
export { TransactionCategorizer } from './accounting/transaction-categorizer';
export { AccountingLedger } from './accounting/ledger';

// ── Fiat Reconciliation ──────────────────────────────────────────
export { FiatReconciliationService } from './reconciliation/fiat-reconciliation.service';
export { ReconciliationEngine } from './reconciliation/reconciliation-engine';
export { DiscrepancyResolver } from './reconciliation/discrepancy-resolver';

// ── Treasury Dashboard ────────────────────────────────────────────
export { TreasuryDashboardService } from './dashboard/treasury-dashboard.service';
export { BalanceAggregator } from './dashboard/balance-aggregator';
export { AllocationBreakdown } from './dashboard/allocation-breakdown';
export { TransactionHistoryProvider } from './dashboard/transaction-history';

// ── Emergency Procedures ──────────────────────────────────────────
export { EmergencyProcedureService } from './emergency/emergency-procedure.service';
export { EmergencyWithdrawal } from './emergency/emergency-withdrawal';
export { RecoveryMechanism } from './emergency/recovery-mechanism';

// ── Types ─────────────────────────────────────────────────────────
export type {
  // Wallet types
  TreasuryWallet,
  WalletConfig,
  MultisigThreshold,
  WalletMember,
  WalletHealth,
  WalletType,

  // Proposal types
  SpendingProposal,
  ProposalStatus,
  ProposalVote,
  ProposalExecution,
  ProposalCategory,

  // Allocation types
  TreasuryAllocation,
  AllocationTarget,
  AssetClass,
  RebalanceAction,
  YieldPosition,
  DiversificationStrategy,

  // Budget types
  BudgetEnforcement,
  BudgetCategory,
  BudgetPeriod,
  BudgetAlert,
  BudgetUtilization,

  // Vesting types
  VestingSchedule,
  VestingRecipient,
  VestingMilestone,
  VestingCliff,
  UnlockEvent,

  // Grant types
  GrantDisbursement,
  GrantMilestone,
  GrantRecipient,
  GrantStatus,

  // Accounting types
  TreasuryTransaction,
  TransactionCategory,
  AccountingEntry,
  LedgerSummary,

  // Reconciliation types
  ReconciliationRecord,
  ReconciliationStatus,
  FiatMapping,
  Discrepancy,

  // Dashboard types
  TreasurySnapshot,
  AllocationBreakdownData,
  TransactionHistoryEntry,
  DashboardMetrics,

  // Emergency types
  EmergencyProcedure,
  EmergencyType,
  RecoveryPlan,
} from './types';

// ── tRPC Router ───────────────────────────────────────────────────
export { treasuryRouter } from './router';
export type { TreasuryRouter } from './router';

// ── Drizzle Schemas ───────────────────────────────────────────────
export {
  treasuryWallets,
  spendingProposals,
  proposalVotes,
  treasuryAllocations,
  vestingSchedules,
  vestingEvents,
  grantDisbursements,
  grantMilestones,
  treasuryTransactions,
  budgetCategories,
  budgetPeriods,
  reconciliationRecords,
} from './db/schema';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ON-CHAIN TREASURY ARCHITECTURE                       │
│                         @mcv/web3-core/treasury                             │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │  Team Member  │   │   Advisor    │   │  DAO/Council  │   │  Grant App   │
  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
         │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                          tRPC API Layer                                 │
  │  treasuryRouter: proposals | wallets | allocations | vesting | grants  │
  └───────────────────────────────┬─────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
         ┌──────────────┐ ┌────────────┐ ┌────────────────┐
         │   Spending   │ │  Vesting   │ │     Grant      │
         │  Proposal    │ │  Schedule  │ │  Disbursement  │
         │  Service     │ │  Service   │ │    Service     │
         └──────┬───────┘ └─────┬──────┘ └───────┬────────┘
                │               │                 │
                ▼               ▼                 ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     Budget Enforcement Layer                            │
  │                                                                         │
  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  │
  │  │  Category    │  │   Period     │  │  Threshold   │  │   Alert     │  │
  │  │  Budgets     │  │   Tracking   │  │  Validation  │  │   System    │  │
  │  └─────────────┘  └──────────────┘  └─────────────┘  └─────────────┘  │
  └───────────────────────────────┬─────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     Proposal Workflow Engine                             │
  │                                                                         │
  │   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────────┐   │
  │   │  Draft    │──▶│  Active  │──▶│ Approved │──▶│    Executing     │   │
  │   │          │   │ (Voting) │   │          │   │  (On-Chain Tx)   │   │
  │   └──────────┘   └────┬─────┘   └──────────┘   └────────┬─────────┘   │
  │                        │                                  │             │
  │                   ┌────▼─────┐                   ┌───────▼──────────┐  │
  │                   │ Rejected │                   │    Executed      │  │
  │                   │          │                   │  (Confirmed)     │  │
  │                   └──────────┘                   └──────────────────┘  │
  └───────────────────────────────┬─────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                   Squads Protocol Adapter Layer                         │
  │                                                                         │
  │   ┌────────────────┐   ┌──────────────────┐   ┌─────────────────┐     │
  │   │  Vault Tx      │   │  Member Mgmt     │   │  Threshold      │     │
  │   │  Builder       │   │  (add/remove)    │   │  Configuration  │     │
  │   └────────┬───────┘   └──────────────────┘   └─────────────────┘     │
  │            │                                                            │
  │   ┌────────▼───────┐   ┌──────────────────┐   ┌─────────────────┐     │
  │   │  Transaction   │   │  Proposal        │   │  Execution      │     │
  │   │  Signing       │   │  Sync            │   │  Confirmation   │     │
  │   └────────────────┘   └──────────────────┘   └─────────────────┘     │
  └───────────────────────────────┬─────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                       Solana Blockchain                                 │
  │                                                                         │
  │   ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐      │
  │   │  Main Vault  │   │  Ops Vault   │   │  Grants Vault        │      │
  │   │  (3-of-5)    │   │  (2-of-3)    │   │  (2-of-3)            │      │
  │   │              │   │              │   │                      │      │
  │   │  SOL / EDGE  │   │  SOL / USDC  │   │  USDC / EDGE         │      │
  │   │  / USDC      │   │              │   │                      │      │
  │   └──────────────┘   └──────────────┘   └──────────────────────┘      │
  └─────────────────────────────────────────────────────────────────────────┘

                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
  ┌──────────────────┐ ┌────────────────┐ ┌────────────────────────────────┐
  │  On-Chain        │ │  Treasury      │ │  Fiat Reconciliation           │
  │  Accounting      │ │  Dashboard     │ │  (@mcv/treasury bridge)        │
  │                  │ │                │ │                                │
  │  • Categorize    │ │  • Balances    │ │  • Price feeds                 │
  │  • Ledger        │ │  • Allocations │ │  • Token → USD mapping         │
  │  • Audit trail   │ │  • History     │ │  • Discrepancy detection       │
  └──────────────────┘ └────────────────┘ └────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                    Emergency Procedures Layer                           │
  │                                                                         │
  │   ┌────────────────────┐   ┌──────────────┐   ┌──────────────────┐    │
  │   │  Emergency         │   │  Recovery     │   │  Freeze/Pause    │    │
  │   │  Withdrawal        │   │  Mechanism    │   │  Protocol        │    │
  │   │  (4-of-5 required) │   │  (key rotate) │   │  (halt spending) │    │
  │   └────────────────────┘   └──────────────┘   └──────────────────┘    │
  └─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Spending Proposal Lifecycle

```
  Proposer                    Signers                   Blockchain
     │                          │                          │
     │  1. Submit proposal      │                          │
     │──────────────────────────┼─────────────────────────▶│
     │                          │   2. Budget check        │
     │                          │◀─────────────────────────│
     │                          │                          │
     │  3. Notify signers       │                          │
     │─────────────────────────▶│                          │
     │                          │                          │
     │                          │  4. Vote (approve/reject)│
     │                          │─────────────────────────▶│
     │                          │                          │
     │                          │  5. Threshold met?       │
     │                          │◀─────────────────────────│
     │                          │                          │
     │  6. Execute transfer     │                          │
     │──────────────────────────┼─────────────────────────▶│
     │                          │                          │
     │  7. Confirm & record     │                          │
     │◀─────────────────────────┼──────────────────────────│
     │                          │                          │
     │  8. Update accounting    │                          │
     │──────────────────────────┼─────────────────────────▶│
     │                          │                          │
```

---

## Core Interfaces

### OnChainTreasuryService

The root service that orchestrates all on-chain treasury operations:

```typescript
import { PublicKey, Connection, TransactionSignature } from '@solana/web3.js';

/**
 * Central on-chain treasury service. Coordinates wallet management,
 * proposal workflows, budget enforcement, and accounting.
 */
interface OnChainTreasuryService {
  // ── Wallet Management ─────────────────────────────────────────
  /** Create a new Squads multi-sig treasury wallet */
  createWallet(config: CreateWalletConfig): Promise<TreasuryWallet>;

  /** Retrieve wallet by ID or public key */
  getWallet(walletId: string): Promise<TreasuryWallet | null>;

  /** List all treasury-managed wallets */
  listWallets(filter?: WalletFilter): Promise<TreasuryWallet[]>;

  /** Update wallet configuration (add/remove members, change threshold) */
  updateWalletConfig(walletId: string, update: WalletConfigUpdate): Promise<TreasuryWallet>;

  /** Get real-time balance for a treasury wallet across all token accounts */
  getWalletBalance(walletId: string): Promise<WalletBalance>;

  /** Run health check on a wallet (balance, member status, pending txs) */
  checkWalletHealth(walletId: string): Promise<WalletHealth>;

  // ── Spending Proposals ────────────────────────────────────────
  /** Create a new spending proposal */
  createProposal(params: CreateProposalParams): Promise<SpendingProposal>;

  /** Get proposal by ID */
  getProposal(proposalId: string): Promise<SpendingProposal | null>;

  /** List proposals with filtering */
  listProposals(filter?: ProposalFilter): Promise<PaginatedResult<SpendingProposal>>;

  /** Cast a vote on an active proposal */
  vote(proposalId: string, vote: ProposalVote): Promise<SpendingProposal>;

  /** Execute an approved proposal (sends the on-chain transaction) */
  executeProposal(proposalId: string, executor: PublicKey): Promise<ProposalExecution>;

  /** Cancel a draft or active proposal */
  cancelProposal(proposalId: string, reason: string): Promise<SpendingProposal>;

  // ── Treasury Allocation ───────────────────────────────────────
  /** Get current treasury allocation breakdown */
  getAllocation(): Promise<TreasuryAllocation>;

  /** Set target allocation percentages */
  setAllocationTargets(targets: AllocationTarget[]): Promise<TreasuryAllocation>;

  /** Execute rebalance to match target allocation */
  rebalance(params: RebalanceParams): Promise<RebalanceResult>;

  /** Open or manage a yield-bearing position */
  manageYieldPosition(action: YieldAction): Promise<YieldPosition>;

  // ── Budget Enforcement ────────────────────────────────────────
  /** Create or update a budget category */
  setBudget(params: SetBudgetParams): Promise<BudgetCategory>;

  /** Check if a proposed spend is within budget */
  checkBudget(category: string, amount: TokenAmount): Promise<BudgetCheckResult>;

  /** Get budget utilization for a period */
  getBudgetUtilization(period?: BudgetPeriod): Promise<BudgetUtilization[]>;

  // ── Vesting ───────────────────────────────────────────────────
  /** Create a new vesting schedule */
  createVestingSchedule(params: CreateVestingParams): Promise<VestingSchedule>;

  /** Get vesting schedule details */
  getVestingSchedule(scheduleId: string): Promise<VestingSchedule | null>;

  /** List all vesting schedules */
  listVestingSchedules(filter?: VestingFilter): Promise<VestingSchedule[]>;

  /** Process pending vesting unlocks */
  processVestingUnlocks(): Promise<UnlockEvent[]>;

  /** Revoke a vesting schedule (claws back unvested tokens) */
  revokeVesting(scheduleId: string, reason: string): Promise<VestingSchedule>;

  // ── Grant Disbursements ───────────────────────────────────────
  /** Create a grant disbursement plan */
  createGrant(params: CreateGrantParams): Promise<GrantDisbursement>;

  /** Approve a grant milestone and release funds */
  approveMilestone(grantId: string, milestoneId: string): Promise<GrantMilestone>;

  /** Get grant status and disbursement history */
  getGrant(grantId: string): Promise<GrantDisbursement | null>;

  // ── Accounting ────────────────────────────────────────────────
  /** Record a treasury transaction with categorization */
  recordTransaction(tx: RecordTransactionParams): Promise<TreasuryTransaction>;

  /** Get transaction history with filtering */
  getTransactionHistory(filter?: TransactionFilter): Promise<PaginatedResult<TreasuryTransaction>>;

  /** Get accounting summary for a period */
  getAccountingSummary(period: AccountingPeriod): Promise<LedgerSummary>;

  // ── Reconciliation ────────────────────────────────────────────
  /** Reconcile on-chain state with fiat treasury */
  reconcile(params: ReconcileParams): Promise<ReconciliationRecord>;

  /** Get reconciliation status */
  getReconciliationStatus(): Promise<ReconciliationStatus>;

  /** Resolve a discrepancy between on-chain and fiat records */
  resolveDiscrepancy(discrepancyId: string, resolution: DiscrepancyResolution): Promise<void>;

  // ── Dashboard ─────────────────────────────────────────────────
  /** Get real-time treasury snapshot for dashboard rendering */
  getSnapshot(): Promise<TreasurySnapshot>;

  /** Get dashboard metrics (totals, trends, alerts) */
  getDashboardMetrics(timeframe?: Timeframe): Promise<DashboardMetrics>;

  // ── Emergency ─────────────────────────────────────────────────
  /** Initiate emergency withdrawal procedure */
  initiateEmergencyWithdrawal(params: EmergencyWithdrawalParams): Promise<EmergencyProcedure>;

  /** Freeze all treasury spending */
  freezeTreasury(reason: string, initiator: PublicKey): Promise<void>;

  /** Unfreeze treasury (requires elevated threshold) */
  unfreezeTreasury(initiator: PublicKey): Promise<void>;

  /** Rotate compromised keys */
  initiateKeyRotation(params: KeyRotationParams): Promise<RecoveryPlan>;
}
```

### TreasuryWallet

```typescript
/**
 * Represents a Squads Protocol multi-sig wallet managed by the treasury.
 */
interface TreasuryWallet {
  /** Internal UUID */
  id: string;

  /** Human-readable wallet name */
  name: string;

  /** Wallet purpose/category */
  type: WalletType;

  /** Squads multisig account public key */
  multisigAddress: PublicKey;

  /** Squads vault PDA */
  vaultAddress: PublicKey;

  /** Vault index within the Squads multisig */
  vaultIndex: number;

  /** Current threshold for transaction approval */
  threshold: number;

  /** Wallet members (signers) */
  members: WalletMember[];

  /** Token accounts held by this vault */
  tokenAccounts: TokenAccountInfo[];

  /** Current total balance in USD equivalent */
  totalBalanceUsd: number;

  /** Whether spending is currently frozen */
  isFrozen: boolean;

  /** Creation timestamp */
  createdAt: Date;

  /** Last activity timestamp */
  lastActivityAt: Date;

  /** Health status */
  health: WalletHealth;
}

type WalletType =
  | 'main'           // Primary treasury vault (highest threshold)
  | 'operations'     // Day-to-day operational spending
  | 'grants'         // Grant disbursement pool
  | 'vesting'        // Token vesting reserves
  | 'emergency'      // Emergency reserve fund
  | 'yield';         // Yield-bearing position management

interface WalletMember {
  /** Member's public key */
  publicKey: PublicKey;

  /** Internal user ID (if linked to MCV account) */
  userId?: string;

  /** Display name */
  name: string;

  /** Role within this wallet */
  role: 'admin' | 'signer' | 'proposer' | 'viewer';

  /** Member permissions */
  permissions: MemberPermissions;

  /** When member was added */
  addedAt: Date;
}

interface MemberPermissions {
  canPropose: boolean;
  canVote: boolean;
  canExecute: boolean;
  canAddMembers: boolean;
  canChangeThreshold: boolean;
  canFreeze: boolean;
}

interface MultisigThreshold {
  /** Number of required approvals */
  required: number;

  /** Total number of signers */
  total: number;

  /** E.g., "2-of-3" or "3-of-5" */
  display: string;
}

interface WalletHealth {
  status: 'healthy' | 'warning' | 'critical';
  checks: HealthCheck[];
  lastCheckedAt: Date;
}

interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: Record<string, unknown>;
}

interface TokenAccountInfo {
  /** Token mint address */
  mint: PublicKey;

  /** Token symbol (SOL, EDGE, USDC) */
  symbol: string;

  /** Associated token account address */
  address: PublicKey;

  /** Raw balance in smallest denomination */
  rawBalance: bigint;

  /** Human-readable balance */
  balance: number;

  /** Decimals for this token */
  decimals: number;

  /** USD equivalent */
  usdValue: number;
}
```

### SpendingProposal

```typescript
/**
 * A formal proposal to spend funds from a treasury wallet.
 * Must be approved by the configured threshold of signers.
 */
interface SpendingProposal {
  /** Internal UUID */
  id: string;

  /** On-chain proposal index (Squads transaction index) */
  onChainIndex?: number;

  /** Source treasury wallet */
  walletId: string;

  /** Proposal title */
  title: string;

  /** Detailed description/justification */
  description: string;

  /** Budget category this spend falls under */
  category: ProposalCategory;

  /** Current proposal status */
  status: ProposalStatus;

  /** Recipient address */
  recipient: PublicKey;

  /** Token to send */
  tokenMint: PublicKey;

  /** Token symbol */
  tokenSymbol: string;

  /** Amount to send (human-readable) */
  amount: number;

  /** Amount in raw token units */
  rawAmount: bigint;

  /** USD equivalent at proposal creation time */
  usdValueAtCreation: number;

  /** Who created the proposal */
  proposer: PublicKey;

  /** Proposer's internal user ID */
  proposerUserId: string;

  /** Votes cast so far */
  votes: ProposalVoteRecord[];

  /** Number of approvals received */
  approvalCount: number;

  /** Number of rejections received */
  rejectionCount: number;

  /** Required threshold for approval */
  threshold: number;

  /** On-chain transaction signature (once executed) */
  executionSignature?: TransactionSignature;

  /** Execution timestamp */
  executedAt?: Date;

  /** Proposal creation timestamp */
  createdAt: Date;

  /** Expiration timestamp (proposals auto-expire) */
  expiresAt: Date;

  /** Optional memo/reference for accounting */
  memo?: string;

  /** Tags for categorization */
  tags: string[];

  /** Linked grant ID (if this is a grant disbursement) */
  grantId?: string;

  /** Linked vesting schedule ID */
  vestingScheduleId?: string;
}

type ProposalStatus =
  | 'draft'       // Created but not yet submitted on-chain
  | 'active'      // Submitted, awaiting votes
  | 'approved'    // Threshold met, ready for execution
  | 'rejected'    // Rejection threshold met or expired
  | 'executing'   // On-chain transaction submitted
  | 'executed'    // Transaction confirmed
  | 'failed'      // Transaction failed
  | 'cancelled'   // Cancelled by proposer
  | 'expired';    // Voting period elapsed

type ProposalCategory =
  | 'operations'        // General operational expenses
  | 'development'       // Engineering/dev costs
  | 'marketing'         // Marketing and growth
  | 'grants'            // Community/ecosystem grants
  | 'vesting'           // Team/advisor vesting releases
  | 'infrastructure'    // Server, hosting, tooling
  | 'legal'             // Legal and compliance
  | 'partnerships'      // Partner payments
  | 'emergency'         // Emergency spending
  | 'rebalance'         // Treasury rebalancing operations
  | 'yield'             // Yield position management
  | 'other';            // Uncategorized

interface ProposalVote {
  /** Voter's public key */
  voter: PublicKey;

  /** Vote decision */
  decision: 'approve' | 'reject';

  /** Optional comment */
  comment?: string;
}

interface ProposalVoteRecord extends ProposalVote {
  /** When the vote was cast */
  votedAt: Date;

  /** On-chain signature of the vote transaction */
  signature: TransactionSignature;
}

interface ProposalExecution {
  /** Proposal ID */
  proposalId: string;

  /** On-chain transaction signature */
  signature: TransactionSignature;

  /** Block slot of confirmation */
  slot: number;

  /** Confirmation timestamp */
  confirmedAt: Date;

  /** Actual amount transferred */
  transferredAmount: number;

  /** Fee paid */
  fee: number;
}
```

### TreasuryAllocation

```typescript
/**
 * Current and target allocation of treasury assets across
 * different asset classes and positions.
 */
interface TreasuryAllocation {
  /** Snapshot timestamp */
  snapshotAt: Date;

  /** Total treasury value in USD */
  totalValueUsd: number;

  /** Breakdown by asset */
  assets: AssetAllocation[];

  /** Target allocation percentages */
  targets: AllocationTarget[];

  /** Deviation from targets */
  deviations: AllocationDeviation[];

  /** Whether rebalance is recommended */
  rebalanceRecommended: boolean;

  /** Active yield positions */
  yieldPositions: YieldPosition[];
}

interface AssetAllocation {
  /** Asset symbol */
  symbol: string;

  /** Token mint */
  mint: PublicKey;

  /** Current balance */
  balance: number;

  /** USD value */
  usdValue: number;

  /** Percentage of total treasury */
  percentage: number;

  /** Which wallets hold this asset */
  walletBreakdown: { walletId: string; balance: number; usdValue: number }[];
}

interface AllocationTarget {
  /** Asset class identifier */
  assetClass: AssetClass;

  /** Target percentage (0-100) */
  targetPercentage: number;

  /** Minimum allowed percentage */
  minPercentage: number;

  /** Maximum allowed percentage */
  maxPercentage: number;

  /** Priority for rebalancing */
  priority: number;
}

type AssetClass =
  | 'sol'           // Native SOL
  | 'edge'          // EDGE governance token
  | 'usdc'          // USDC stablecoin
  | 'yield_usdc'    // USDC in yield positions
  | 'yield_sol'     // SOL in yield/staking positions
  | 'other';        // Other tokens

interface AllocationDeviation {
  assetClass: AssetClass;
  currentPercentage: number;
  targetPercentage: number;
  deviationPercentage: number;
  action: 'buy' | 'sell' | 'none';
  suggestedAmount: number;
}

interface YieldPosition {
  /** Position ID */
  id: string;

  /** Protocol name (e.g., "Marinade", "Jito", "Kamino") */
  protocol: string;

  /** Position type */
  type: 'staking' | 'lending' | 'lp' | 'vault';

  /** Deposited asset */
  asset: string;

  /** Deposited amount */
  depositedAmount: number;

  /** Current value */
  currentValue: number;

  /** Accumulated yield */
  yieldEarned: number;

  /** Current APY */
  apy: number;

  /** Position opened at */
  openedAt: Date;

  /** Auto-compound enabled */
  autoCompound: boolean;
}
```

### VestingSchedule

```typescript
/**
 * Token vesting schedule for team members, advisors, and partners.
 * Tokens are released from treasury according to cliff + linear unlock.
 */
interface VestingSchedule {
  /** Internal UUID */
  id: string;

  /** Source treasury wallet */
  walletId: string;

  /** Recipient details */
  recipient: VestingRecipient;

  /** Token to vest */
  tokenMint: PublicKey;

  /** Token symbol */
  tokenSymbol: string;

  /** Total tokens to vest */
  totalAmount: number;

  /** Tokens released so far */
  releasedAmount: number;

  /** Tokens remaining */
  remainingAmount: number;

  /** Vesting start date */
  startDate: Date;

  /** Cliff configuration */
  cliff: VestingCliff;

  /** Total vesting duration in months */
  durationMonths: number;

  /** End date of vesting */
  endDate: Date;

  /** Unlock frequency after cliff */
  unlockFrequency: 'monthly' | 'quarterly' | 'daily';

  /** Current vesting status */
  status: 'pending' | 'active' | 'completed' | 'revoked' | 'paused';

  /** Whether this schedule is revocable */
  revocable: boolean;

  /** Unlock events (past and future) */
  unlockEvents: UnlockEvent[];

  /** Related spending proposal IDs */
  proposalIds: string[];

  /** Created timestamp */
  createdAt: Date;

  /** Notes */
  notes?: string;
}

interface VestingRecipient {
  /** Recipient's Solana wallet */
  walletAddress: PublicKey;

  /** Internal user ID (if applicable) */
  userId?: string;

  /** Display name */
  name: string;

  /** Role/relationship */
  role: 'founder' | 'team' | 'advisor' | 'partner' | 'contributor';

  /** Email for notifications */
  email?: string;
}

interface VestingCliff {
  /** Cliff duration in months */
  durationMonths: number;

  /** Percentage released at cliff */
  percentage: number;

  /** Cliff date */
  cliffDate: Date;

  /** Whether cliff has passed */
  passed: boolean;
}

interface UnlockEvent {
  /** Event ID */
  id: string;

  /** Scheduled unlock date */
  date: Date;

  /** Amount to unlock */
  amount: number;

  /** Whether this unlock has been processed */
  processed: boolean;

  /** Processing details */
  execution?: {
    signature: TransactionSignature;
    proposalId: string;
    processedAt: Date;
  };
}
```

### BudgetEnforcement

```typescript
/**
 * Budget enforcement configuration and tracking per category.
 */
interface BudgetEnforcement {
  /** Budget period */
  period: BudgetPeriod;

  /** Categories with budgets */
  categories: BudgetCategory[];

  /** Total budget for this period */
  totalBudgetUsd: number;

  /** Total spent so far */
  totalSpentUsd: number;

  /** Total remaining */
  totalRemainingUsd: number;

  /** Overall utilization percentage */
  utilizationPercentage: number;

  /** Active alerts */
  alerts: BudgetAlert[];
}

interface BudgetCategory {
  /** Category identifier (matches ProposalCategory) */
  category: ProposalCategory;

  /** Display name */
  displayName: string;

  /** Budget limit for this period in USD */
  limitUsd: number;

  /** Amount spent so far */
  spentUsd: number;

  /** Amount remaining */
  remainingUsd: number;

  /** Utilization percentage */
  utilizationPercentage: number;

  /** Pending proposals against this budget */
  pendingUsd: number;

  /** Alert threshold percentage (e.g., 80 means alert at 80% utilized) */
  alertThreshold: number;

  /** Whether this category is currently over budget */
  overBudget: boolean;

  /** Whether new proposals are auto-rejected for this category */
  autoReject: boolean;

  /** Rollover unused budget to next period */
  rollover: boolean;
}

interface BudgetPeriod {
  /** Period type */
  type: 'monthly' | 'quarterly' | 'annual';

  /** Period start date */
  startDate: Date;

  /** Period end date */
  endDate: Date;

  /** Period label (e.g., "2026-Q1") */
  label: string;
}

interface BudgetAlert {
  /** Alert ID */
  id: string;

  /** Alert severity */
  severity: 'info' | 'warning' | 'critical';

  /** Category that triggered the alert */
  category: ProposalCategory;

  /** Alert message */
  message: string;

  /** Current utilization when triggered */
  utilization: number;

  /** When the alert was triggered */
  triggeredAt: Date;

  /** Whether the alert has been acknowledged */
  acknowledged: boolean;
}

interface BudgetCheckResult {
  /** Whether the spend is within budget */
  allowed: boolean;

  /** Remaining budget after this spend (negative if over) */
  remainingAfterUsd: number;

  /** Current utilization before this spend */
  currentUtilization: number;

  /** Utilization after this spend */
  projectedUtilization: number;

  /** Reason if not allowed */
  reason?: string;

  /** Warnings even if allowed */
  warnings: string[];
}
```

---

## Database Schemas

All treasury off-chain metadata is stored in Supabase PostgreSQL using Drizzle ORM. On-chain state is the source of truth for balances and transaction finality; these schemas store enriched metadata, categorization, and cross-references.

### treasury_wallets

```typescript
import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const walletTypeEnum = pgEnum('wallet_type', [
  'main',
  'operations',
  'grants',
  'vesting',
  'emergency',
  'yield',
]);

export const treasuryWallets = pgTable('treasury_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Human-readable name */
  name: text('name').notNull(),

  /** Wallet purpose */
  type: walletTypeEnum('type').notNull(),

  /** Squads multisig account address (base58) */
  multisigAddress: text('multisig_address').notNull().unique(),

  /** Vault PDA address (base58) */
  vaultAddress: text('vault_address').notNull().unique(),

  /** Vault index within the Squads multisig */
  vaultIndex: integer('vault_index').notNull().default(0),

  /** Current approval threshold */
  threshold: integer('threshold').notNull(),

  /** Total number of members */
  memberCount: integer('member_count').notNull(),

  /** Member details as JSON array */
  members: jsonb('members').$type<WalletMemberRecord[]>().notNull(),

  /** Whether spending is frozen */
  isFrozen: boolean('is_frozen').notNull().default(false),

  /** Freeze reason if applicable */
  freezeReason: text('freeze_reason'),

  /** Frozen by (public key) */
  frozenBy: text('frozen_by'),

  /** Frozen at timestamp */
  frozenAt: timestamp('frozen_at', { withTimezone: true }),

  /** Description/notes */
  description: text('description'),

  /** Creation timestamp */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Last updated */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

  /** Last on-chain activity */
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),

  /** Soft delete */
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

interface WalletMemberRecord {
  publicKey: string;
  userId?: string;
  name: string;
  role: 'admin' | 'signer' | 'proposer' | 'viewer';
  permissions: MemberPermissions;
  addedAt: string;
}
```

### spending_proposals

```typescript
export const proposalStatusEnum = pgEnum('proposal_status', [
  'draft',
  'active',
  'approved',
  'rejected',
  'executing',
  'executed',
  'failed',
  'cancelled',
  'expired',
]);

export const proposalCategoryEnum = pgEnum('proposal_category', [
  'operations',
  'development',
  'marketing',
  'grants',
  'vesting',
  'infrastructure',
  'legal',
  'partnerships',
  'emergency',
  'rebalance',
  'yield',
  'other',
]);

export const spendingProposals = pgTable('spending_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Source wallet */
  walletId: uuid('wallet_id').notNull().references(() => treasuryWallets.id),

  /** On-chain Squads transaction index */
  onChainIndex: integer('on_chain_index'),

  /** Proposal title */
  title: text('title').notNull(),

  /** Detailed description */
  description: text('description').notNull(),

  /** Spending category */
  category: proposalCategoryEnum('category').notNull(),

  /** Current status */
  status: proposalStatusEnum('status').notNull().default('draft'),

  /** Recipient address (base58) */
  recipient: text('recipient').notNull(),

  /** Token mint address (base58) */
  tokenMint: text('token_mint').notNull(),

  /** Token symbol */
  tokenSymbol: text('token_symbol').notNull(),

  /** Amount (human-readable) */
  amount: text('amount').notNull(), // stored as string for precision

  /** Raw amount in smallest denomination */
  rawAmount: text('raw_amount').notNull(), // bigint as string

  /** USD value at creation */
  usdValueAtCreation: text('usd_value_at_creation').notNull(),

  /** Proposer public key (base58) */
  proposer: text('proposer').notNull(),

  /** Proposer's MCV user ID */
  proposerUserId: uuid('proposer_user_id').notNull(),

  /** Required approval threshold */
  threshold: integer('threshold').notNull(),

  /** Current approval count */
  approvalCount: integer('approval_count').notNull().default(0),

  /** Current rejection count */
  rejectionCount: integer('rejection_count').notNull().default(0),

  /** Execution transaction signature */
  executionSignature: text('execution_signature'),

  /** Execution block slot */
  executionSlot: integer('execution_slot'),

  /** When the proposal was executed */
  executedAt: timestamp('executed_at', { withTimezone: true }),

  /** Optional memo */
  memo: text('memo'),

  /** Tags (JSON string array) */
  tags: jsonb('tags').$type<string[]>().default([]),

  /** Linked grant ID */
  grantId: uuid('grant_id'),

  /** Linked vesting schedule ID */
  vestingScheduleId: uuid('vesting_schedule_id'),

  /** Proposal expiration */
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

  /** Created */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Last updated */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const proposalVotes = pgTable('proposal_votes', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Proposal being voted on */
  proposalId: uuid('proposal_id').notNull().references(() => spendingProposals.id),

  /** Voter public key */
  voter: text('voter').notNull(),

  /** Voter's MCV user ID (if linked) */
  voterUserId: uuid('voter_user_id'),

  /** Vote decision */
  decision: text('decision', { enum: ['approve', 'reject'] }).notNull(),

  /** Optional comment */
  comment: text('comment'),

  /** On-chain vote signature */
  signature: text('signature').notNull(),

  /** Vote timestamp */
  votedAt: timestamp('voted_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### treasury_allocations

```typescript
export const treasuryAllocations = pgTable('treasury_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Asset class */
  assetClass: text('asset_class').notNull(),

  /** Target percentage (0-10000 for 0.00%-100.00%) */
  targetBasisPoints: integer('target_basis_points').notNull(),

  /** Minimum percentage */
  minBasisPoints: integer('min_basis_points').notNull(),

  /** Maximum percentage */
  maxBasisPoints: integer('max_basis_points').notNull(),

  /** Priority for rebalancing (lower = higher priority) */
  priority: integer('priority').notNull().default(0),

  /** Last snapshot values */
  lastSnapshotBalance: text('last_snapshot_balance'),
  lastSnapshotUsdValue: text('last_snapshot_usd_value'),
  lastSnapshotPercentage: integer('last_snapshot_percentage'),
  lastSnapshotAt: timestamp('last_snapshot_at', { withTimezone: true }),

  /** Configuration metadata */
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  /** Whether this allocation target is active */
  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### vesting_schedules

```typescript
export const vestingStatusEnum = pgEnum('vesting_status', [
  'pending',
  'active',
  'completed',
  'revoked',
  'paused',
]);

export const vestingRoleEnum = pgEnum('vesting_role', [
  'founder',
  'team',
  'advisor',
  'partner',
  'contributor',
]);

export const vestingSchedules = pgTable('vesting_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Source treasury wallet */
  walletId: uuid('wallet_id').notNull().references(() => treasuryWallets.id),

  /** Recipient wallet address (base58) */
  recipientAddress: text('recipient_address').notNull(),

  /** Recipient MCV user ID (if applicable) */
  recipientUserId: uuid('recipient_user_id'),

  /** Recipient display name */
  recipientName: text('recipient_name').notNull(),

  /** Recipient role */
  recipientRole: vestingRoleEnum('recipient_role').notNull(),

  /** Recipient email for notifications */
  recipientEmail: text('recipient_email'),

  /** Token mint (base58) */
  tokenMint: text('token_mint').notNull(),

  /** Token symbol */
  tokenSymbol: text('token_symbol').notNull(),

  /** Total tokens to vest */
  totalAmount: text('total_amount').notNull(),

  /** Tokens released so far */
  releasedAmount: text('released_amount').notNull().default('0'),

  /** Vesting start date */
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),

  /** Cliff duration in months */
  cliffMonths: integer('cliff_months').notNull().default(0),

  /** Percentage released at cliff (basis points) */
  cliffPercentageBps: integer('cliff_percentage_bps').notNull().default(0),

  /** Total vesting duration in months */
  durationMonths: integer('duration_months').notNull(),

  /** Unlock frequency */
  unlockFrequency: text('unlock_frequency', {
    enum: ['daily', 'monthly', 'quarterly'],
  }).notNull().default('monthly'),

  /** Current status */
  status: vestingStatusEnum('status').notNull().default('pending'),

  /** Whether this schedule is revocable by treasury */
  revocable: boolean('revocable').notNull().default(true),

  /** Revocation details (if revoked) */
  revocationReason: text('revocation_reason'),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokedBy: text('revoked_by'),

  /** Notes */
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const vestingEvents = pgTable('vesting_events', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Parent vesting schedule */
  scheduleId: uuid('schedule_id').notNull().references(() => vestingSchedules.id),

  /** Scheduled unlock date */
  unlockDate: timestamp('unlock_date', { withTimezone: true }).notNull(),

  /** Amount to unlock */
  amount: text('amount').notNull(),

  /** Whether this event has been processed */
  processed: boolean('processed').notNull().default(false),

  /** Execution details */
  proposalId: uuid('proposal_id'),
  signature: text('signature'),
  processedAt: timestamp('processed_at', { withTimezone: true }),

  /** Processing error if failed */
  error: text('error'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### treasury_transactions

```typescript
export const transactionDirectionEnum = pgEnum('transaction_direction', [
  'inflow',
  'outflow',
  'internal',
]);

export const treasuryTransactions = pgTable('treasury_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Treasury wallet involved */
  walletId: uuid('wallet_id').notNull().references(() => treasuryWallets.id),

  /** On-chain transaction signature */
  signature: text('signature').notNull().unique(),

  /** Block slot */
  slot: integer('slot').notNull(),

  /** Block time */
  blockTime: timestamp('block_time', { withTimezone: true }).notNull(),

  /** Transaction direction */
  direction: transactionDirectionEnum('direction').notNull(),

  /** Spending category */
  category: proposalCategoryEnum('category'),

  /** Token mint (base58) */
  tokenMint: text('token_mint').notNull(),

  /** Token symbol */
  tokenSymbol: text('token_symbol').notNull(),

  /** Amount (human-readable) */
  amount: text('amount').notNull(),

  /** Raw amount */
  rawAmount: text('raw_amount').notNull(),

  /** USD value at transaction time */
  usdValueAtTime: text('usd_value_at_time'),

  /** Counterparty address */
  counterparty: text('counterparty'),

  /** Counterparty label (if known) */
  counterpartyLabel: text('counterparty_label'),

  /** Related spending proposal */
  proposalId: uuid('proposal_id'),

  /** Related grant */
  grantId: uuid('grant_id'),

  /** Related vesting schedule */
  vestingScheduleId: uuid('vesting_schedule_id'),

  /** Memo/reference */
  memo: text('memo'),

  /** Transaction fee in SOL */
  fee: text('fee'),

  /** Whether this transaction has been reconciled with fiat records */
  reconciled: boolean('reconciled').notNull().default(false),

  /** Reconciliation record ID */
  reconciliationId: uuid('reconciliation_id'),

  /** Auto-categorized or manually categorized */
  categorizationMethod: text('categorization_method', {
    enum: ['auto', 'manual', 'proposal'],
  }).default('auto'),

  /** Additional metadata */
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### budget_categories & budget_periods

```typescript
export const budgetCategories = pgTable('budget_categories', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Budget period this belongs to */
  periodId: uuid('period_id').notNull().references(() => budgetPeriods.id),

  /** Category (matches ProposalCategory) */
  category: proposalCategoryEnum('category').notNull(),

  /** Display name override */
  displayName: text('display_name').notNull(),

  /** Budget limit in USD (stored as cents) */
  limitCents: integer('limit_cents').notNull(),

  /** Amount spent in USD (stored as cents) */
  spentCents: integer('spent_cents').notNull().default(0),

  /** Amount pending in proposals (cents) */
  pendingCents: integer('pending_cents').notNull().default(0),

  /** Alert threshold percentage (0-100) */
  alertThreshold: integer('alert_threshold').notNull().default(80),

  /** Auto-reject proposals when over budget */
  autoReject: boolean('auto_reject').notNull().default(true),

  /** Roll over unused budget to next period */
  rollover: boolean('rollover').notNull().default(false),

  /** Rolled over amount from previous period (cents) */
  rolloverCents: integer('rollover_cents').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const budgetPeriods = pgTable('budget_periods', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Period type */
  type: text('type', { enum: ['monthly', 'quarterly', 'annual'] }).notNull(),

  /** Period label (e.g., "2026-Q1", "2026-02") */
  label: text('label').notNull().unique(),

  /** Period start */
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),

  /** Period end */
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),

  /** Total budget for this period in USD cents */
  totalLimitCents: integer('total_limit_cents').notNull(),

  /** Whether this period is currently active */
  isActive: boolean('is_active').notNull().default(false),

  /** Whether this period has been finalized/closed */
  finalized: boolean('finalized').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### reconciliation_records

```typescript
export const reconciliationStatusEnum = pgEnum('reconciliation_status', [
  'pending',
  'matched',
  'discrepancy',
  'resolved',
  'ignored',
]);

export const reconciliationRecords = pgTable('reconciliation_records', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** On-chain transaction ID */
  transactionId: uuid('transaction_id').references(() => treasuryTransactions.id),

  /** Fiat-side treasury record ID (@mcv/treasury) */
  fiatRecordId: text('fiat_record_id'),

  /** Reconciliation status */
  status: reconciliationStatusEnum('status').notNull().default('pending'),

  /** On-chain amount (USD equivalent) */
  onChainUsdValue: text('on_chain_usd_value'),

  /** Fiat-side recorded amount (USD) */
  fiatUsdValue: text('fiat_usd_value'),

  /** Discrepancy amount (if any) */
  discrepancyUsd: text('discrepancy_usd'),

  /** Discrepancy reason */
  discrepancyReason: text('discrepancy_reason'),

  /** Resolution notes */
  resolutionNotes: text('resolution_notes'),

  /** Resolved by user ID */
  resolvedBy: uuid('resolved_by'),

  /** Resolved at timestamp */
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),

  /** Price feed used for USD conversion */
  priceFeed: text('price_feed'),

  /** Token price at reconciliation time */
  tokenPrice: text('token_price'),

  /** Reconciliation run identifier */
  runId: text('run_id'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### grant_disbursements & grant_milestones

```typescript
export const grantStatusEnum = pgEnum('grant_status', [
  'proposed',
  'approved',
  'active',
  'completed',
  'cancelled',
  'paused',
]);

export const milestoneStatusEnum = pgEnum('milestone_status', [
  'pending',
  'in_progress',
  'submitted',
  'approved',
  'rejected',
  'disbursed',
]);

export const grantDisbursements = pgTable('grant_disbursements', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Source treasury wallet */
  walletId: uuid('wallet_id').notNull().references(() => treasuryWallets.id),

  /** Grant title */
  title: text('title').notNull(),

  /** Grant description */
  description: text('description').notNull(),

  /** Recipient organization/individual */
  recipientName: text('recipient_name').notNull(),

  /** Recipient wallet address */
  recipientAddress: text('recipient_address').notNull(),

  /** Recipient contact email */
  recipientEmail: text('recipient_email'),

  /** Token mint for disbursement */
  tokenMint: text('token_mint').notNull(),

  /** Token symbol */
  tokenSymbol: text('token_symbol').notNull(),

  /** Total grant amount */
  totalAmount: text('total_amount').notNull(),

  /** Amount disbursed so far */
  disbursedAmount: text('disbursed_amount').notNull().default('0'),

  /** Number of milestones */
  milestoneCount: integer('milestone_count').notNull(),

  /** Milestones completed */
  milestonesCompleted: integer('milestones_completed').notNull().default(0),

  /** Grant status */
  status: grantStatusEnum('status').notNull().default('proposed'),

  /** Grant proposal document URL */
  proposalUrl: text('proposal_url'),

  /** Tags */
  tags: jsonb('tags').$type<string[]>().default([]),

  /** Additional metadata */
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const grantMilestones = pgTable('grant_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Parent grant */
  grantId: uuid('grant_id').notNull().references(() => grantDisbursements.id),

  /** Milestone sequence number */
  sequenceNumber: integer('sequence_number').notNull(),

  /** Milestone title */
  title: text('title').notNull(),

  /** Milestone description / acceptance criteria */
  description: text('description').notNull(),

  /** Amount to disburse on completion */
  amount: text('amount').notNull(),

  /** Due date */
  dueDate: timestamp('due_date', { withTimezone: true }),

  /** Current status */
  status: milestoneStatusEnum('status').notNull().default('pending'),

  /** Submission / proof of completion */
  submissionUrl: text('submission_url'),
  submissionNotes: text('submission_notes'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),

  /** Approval details */
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),

  /** Disbursement details */
  proposalId: uuid('proposal_id'),
  signature: text('signature'),
  disbursedAt: timestamp('disbursed_at', { withTimezone: true }),

  /** Rejection details */
  rejectionReason: text('rejection_reason'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## Code Examples

### 1. Create a Multi-sig Treasury Wallet

```typescript
import { createTreasuryService } from '@mcv/web3-core/treasury';
import { Keypair, PublicKey } from '@solana/web3.js';

const treasury = createTreasuryService({
  connection: solanaConnection,
  supabase: supabaseClient,
  squadsProgram: squadsProgramId,
});

// Create a 3-of-5 main treasury vault
const mainVault = await treasury.createWallet({
  name: 'MCV Main Treasury',
  type: 'main',
  threshold: 3,
  members: [
    {
      publicKey: new PublicKey('Ceo1...xxxx'),
      name: 'Alice (CEO)',
      role: 'admin',
      permissions: {
        canPropose: true,
        canVote: true,
        canExecute: true,
        canAddMembers: true,
        canChangeThreshold: true,
        canFreeze: true,
      },
    },
    {
      publicKey: new PublicKey('Cto2...xxxx'),
      name: 'Bob (CTO)',
      role: 'admin',
      permissions: {
        canPropose: true,
        canVote: true,
        canExecute: true,
        canAddMembers: true,
        canChangeThreshold: false,
        canFreeze: true,
      },
    },
    {
      publicKey: new PublicKey('Cfo3...xxxx'),
      name: 'Carol (CFO)',
      role: 'admin',
      permissions: {
        canPropose: true,
        canVote: true,
        canExecute: true,
        canAddMembers: true,
        canChangeThreshold: true,
        canFreeze: true,
      },
    },
    {
      publicKey: new PublicKey('Dev4...xxxx'),
      name: 'Dave (Lead Dev)',
      role: 'signer',
      permissions: {
        canPropose: true,
        canVote: true,
        canExecute: false,
        canAddMembers: false,
        canChangeThreshold: false,
        canFreeze: false,
      },
    },
    {
      publicKey: new PublicKey('Ops5...xxxx'),
      name: 'Eve (Ops Lead)',
      role: 'signer',
      permissions: {
        canPropose: true,
        canVote: true,
        canExecute: false,
        canAddMembers: false,
        canChangeThreshold: false,
        canFreeze: false,
      },
    },
  ],
  description: 'Primary treasury vault holding majority of MCV funds. Highest security threshold.',
});

console.log(`Created vault: ${mainVault.name}`);
console.log(`Multisig: ${mainVault.multisigAddress.toBase58()}`);
console.log(`Vault PDA: ${mainVault.vaultAddress.toBase58()}`);
console.log(`Threshold: ${mainVault.threshold}/${mainVault.members.length}`);

// Create a 2-of-3 operations wallet for day-to-day spending
const opsVault = await treasury.createWallet({
  name: 'MCV Operations',
  type: 'operations',
  threshold: 2,
  members: [
    {
      publicKey: new PublicKey('Ceo1...xxxx'),
      name: 'Alice (CEO)',
      role: 'admin',
      permissions: { canPropose: true, canVote: true, canExecute: true, canAddMembers: true, canChangeThreshold: true, canFreeze: true },
    },
    {
      publicKey: new PublicKey('Cfo3...xxxx'),
      name: 'Carol (CFO)',
      role: 'signer',
      permissions: { canPropose: true, canVote: true, canExecute: true, canAddMembers: false, canChangeThreshold: false, canFreeze: false },
    },
    {
      publicKey: new PublicKey('Ops5...xxxx'),
      name: 'Eve (Ops Lead)',
      role: 'signer',
      permissions: { canPropose: true, canVote: true, canExecute: true, canAddMembers: false, canChangeThreshold: false, canFreeze: false },
    },
  ],
  description: 'Operational spending wallet. Lower threshold for day-to-day expenses.',
});

// Check health of all wallets
const wallets = await treasury.listWallets();
for (const wallet of wallets) {
  const health = await treasury.checkWalletHealth(wallet.id);
  console.log(`${wallet.name}: ${health.status}`);
  for (const check of health.checks) {
    console.log(`  ${check.name}: ${check.status} — ${check.message}`);
  }
}
```

### 2. Submit and Vote on a Spending Proposal

```typescript
import { createTreasuryService } from '@mcv/web3-core/treasury';
import { PublicKey } from '@solana/web3.js';

const treasury = createTreasuryService(config);

// ── Step 1: Submit a proposal ───────────────────────────────────
const proposal = await treasury.createProposal({
  walletId: opsVault.id,
  title: 'Q1 Marketing Campaign — Influencer Partnerships',
  description: `
    Requesting 15,000 USDC for Q1 2026 influencer marketing campaign.
    
    Breakdown:
    - 5 micro-influencers at 1,500 USDC each = 7,500 USDC
    - 2 mid-tier influencers at 2,500 USDC each = 5,000 USDC
    - Content creation budget = 2,500 USDC
    
    Expected ROI: 3-5x based on previous campaign performance.
    Campaign timeline: Feb 15 - Mar 31, 2026.
  `,
  category: 'marketing',
  recipient: new PublicKey('Mktg...agency...address'),
  tokenMint: USDC_MINT,
  amount: 15000, // 15,000 USDC
  memo: 'Q1-2026-MKTG-001',
  tags: ['marketing', 'influencer', 'q1-2026'],
  expiresInDays: 7, // Voting open for 7 days
});

console.log(`Proposal created: ${proposal.id}`);
console.log(`Status: ${proposal.status}`); // 'active'
console.log(`Requires ${proposal.threshold} approvals`);

// ── Step 2: Budget enforcement automatically checks ─────────────
// The createProposal call internally runs:
//   const budgetCheck = await this.budgetEnforcement.checkBudget('marketing', { amount: 15000, token: 'USDC' });
//   if (!budgetCheck.allowed) throw new TreasuryError('BUDGET_EXCEEDED', budgetCheck.reason);
// If the marketing budget for Q1 doesn't have 15k remaining, the proposal is auto-rejected.

// ── Step 3: Signers vote ────────────────────────────────────────
// Alice (CEO) approves
const vote1 = await treasury.vote(proposal.id, {
  voter: new PublicKey('Ceo1...xxxx'),
  decision: 'approve',
  comment: 'Good ROI projection. Approved.',
});
console.log(`Approvals: ${vote1.approvalCount}/${vote1.threshold}`); // 1/2

// Carol (CFO) approves
const vote2 = await treasury.vote(proposal.id, {
  voter: new PublicKey('Cfo3...xxxx'),
  decision: 'approve',
  comment: 'Within budget. Proceed.',
});
console.log(`Approvals: ${vote2.approvalCount}/${vote2.threshold}`); // 2/2
console.log(`Status: ${vote2.status}`); // 'approved'

// ── Step 4: Execute the approved proposal ───────────────────────
const execution = await treasury.executeProposal(
  proposal.id,
  new PublicKey('Ceo1...xxxx'), // executor
);

console.log(`Executed! Signature: ${execution.signature}`);
console.log(`Block slot: ${execution.slot}`);
console.log(`Transferred: ${execution.transferredAmount} USDC`);

// ── Step 5: Verify the transaction was recorded ─────────────────
const updatedProposal = await treasury.getProposal(proposal.id);
console.log(`Final status: ${updatedProposal!.status}`); // 'executed'
console.log(`Execution sig: ${updatedProposal!.executionSignature}`);

// The accounting ledger is automatically updated with this transaction
const recentTxs = await treasury.getTransactionHistory({
  walletId: opsVault.id,
  category: 'marketing',
  limit: 5,
});
console.log(`Recent marketing transactions: ${recentTxs.items.length}`);
```

### 3. Treasury Diversification and Rebalancing

```typescript
import { createTreasuryService } from '@mcv/web3-core/treasury';

const treasury = createTreasuryService(config);

// ── Set target allocation ───────────────────────────────────────
await treasury.setAllocationTargets([
  {
    assetClass: 'usdc',
    targetPercentage: 40,   // 40% in USDC (stability)
    minPercentage: 30,
    maxPercentage: 50,
    priority: 1,
  },
  {
    assetClass: 'sol',
    targetPercentage: 25,   // 25% in SOL (operational needs)
    minPercentage: 15,
    maxPercentage: 35,
    priority: 2,
  },
  {
    assetClass: 'edge',
    targetPercentage: 20,   // 20% in EDGE (governance alignment)
    minPercentage: 10,
    maxPercentage: 30,
    priority: 3,
  },
  {
    assetClass: 'yield_usdc',
    targetPercentage: 10,   // 10% in yield-bearing USDC
    minPercentage: 0,
    maxPercentage: 20,
    priority: 4,
  },
  {
    assetClass: 'yield_sol',
    targetPercentage: 5,    // 5% in staked SOL
    minPercentage: 0,
    maxPercentage: 15,
    priority: 5,
  },
]);

// ── Check current allocation ────────────────────────────────────
const allocation = await treasury.getAllocation();

console.log(`Total Treasury Value: $${allocation.totalValueUsd.toLocaleString()}`);
console.log('\nCurrent Allocation:');
for (const asset of allocation.assets) {
  console.log(`  ${asset.symbol}: ${asset.balance.toLocaleString()} ($${asset.usdValue.toLocaleString()}) — ${asset.percentage.toFixed(1)}%`);
}

console.log('\nDeviations from Target:');
for (const dev of allocation.deviations) {
  if (Math.abs(dev.deviationPercentage) > 2) {
    console.log(`  ${dev.assetClass}: ${dev.currentPercentage.toFixed(1)}% vs ${dev.targetPercentage}% target (${dev.action} $${dev.suggestedAmount.toLocaleString()})`);
  }
}

if (allocation.rebalanceRecommended) {
  console.log('\n⚠️ Rebalance recommended!');

  // Execute rebalance (this creates spending proposals for each trade)
  const result = await treasury.rebalance({
    maxSlippage: 0.5,           // 0.5% max slippage
    dryRun: false,              // Set to true to preview without executing
    excludeAssets: [],          // Don't exclude any assets
    minTradeUsd: 100,           // Don't bother with trades under $100
  });

  console.log(`Rebalance proposals created: ${result.proposalsCreated}`);
  for (const action of result.actions) {
    console.log(`  ${action.type}: ${action.fromAsset} → ${action.toAsset}, $${action.usdValue.toLocaleString()}`);
    console.log(`    Proposal: ${action.proposalId}`);
  }
}

// ── Manage yield positions ──────────────────────────────────────
// Deposit USDC into a Kamino vault for yield
const yieldPosition = await treasury.manageYieldPosition({
  type: 'open',
  protocol: 'kamino',
  positionType: 'vault',
  asset: 'USDC',
  amount: 50000,  // 50k USDC
  autoCompound: true,
  walletId: mainVault.id,
});

console.log(`\nYield Position Opened:`);
console.log(`  Protocol: ${yieldPosition.protocol}`);
console.log(`  Deposited: ${yieldPosition.depositedAmount.toLocaleString()} USDC`);
console.log(`  APY: ${yieldPosition.apy.toFixed(2)}%`);

// Check all yield positions
const allPositions = allocation.yieldPositions;
let totalYield = 0;
for (const pos of allPositions) {
  totalYield += pos.yieldEarned;
  console.log(`  ${pos.protocol} (${pos.type}): ${pos.asset} — $${pos.currentValue.toLocaleString()} @ ${pos.apy.toFixed(2)}% APY — Earned: $${pos.yieldEarned.toLocaleString()}`);
}
console.log(`Total yield earned: $${totalYield.toLocaleString()}`);
```

### 4. Set Up Token Vesting Schedule

```typescript
import { createTreasuryService } from '@mcv/web3-core/treasury';
import { PublicKey } from '@solana/web3.js';

const treasury = createTreasuryService(config);

// ── Create vesting schedule for a new team member ───────────────
const vestingSchedule = await treasury.createVestingSchedule({
  walletId: vestingVault.id,
  recipient: {
    walletAddress: new PublicKey('Team...member...wallet'),
    userId: 'user_abc123',
    name: 'Frank (Senior Engineer)',
    role: 'team',
    email: 'frank@mcv.dev',
  },
  tokenMint: EDGE_MINT,
  tokenSymbol: 'EDGE',
  totalAmount: 100_000,           // 100,000 EDGE tokens
  startDate: new Date('2026-03-01'),
  cliff: {
    durationMonths: 12,           // 12-month cliff
    percentage: 25,               // 25% released at cliff
  },
  durationMonths: 48,            // 4-year total vesting
  unlockFrequency: 'monthly',   // Monthly unlocks after cliff
  revocable: true,               // Can be revoked if they leave
  notes: 'Senior engineer hire, standard 4-year vesting with 1-year cliff.',
});

console.log(`Vesting schedule created: ${vestingSchedule.id}`);
console.log(`Recipient: ${vestingSchedule.recipient.name}`);
console.log(`Total: ${vestingSchedule.totalAmount.toLocaleString()} EDGE`);
console.log(`Cliff: ${vestingSchedule.cliff.durationMonths} months (${vestingSchedule.cliff.percentage}%)`);
console.log(`Duration: ${vestingSchedule.durationMonths} months`);
console.log(`Cliff date: ${vestingSchedule.cliff.cliffDate.toISOString()}`);
console.log(`End date: ${vestingSchedule.endDate.toISOString()}`);

// Preview unlock schedule
console.log('\nUnlock Schedule:');
for (const event of vestingSchedule.unlockEvents.slice(0, 10)) {
  console.log(`  ${event.date.toISOString().slice(0, 10)}: ${event.amount.toLocaleString()} EDGE ${event.processed ? '✅' : '⏳'}`);
}
console.log(`  ... (${vestingSchedule.unlockEvents.length} total events)`);

// ── Create vesting for an advisor (different terms) ─────────────
const advisorVesting = await treasury.createVestingSchedule({
  walletId: vestingVault.id,
  recipient: {
    walletAddress: new PublicKey('Advi...sor...wallet'),
    name: 'Grace (Strategic Advisor)',
    role: 'advisor',
    email: 'grace@advisor.com',
  },
  tokenMint: EDGE_MINT,
  tokenSymbol: 'EDGE',
  totalAmount: 50_000,            // 50,000 EDGE
  startDate: new Date('2026-02-01'),
  cliff: {
    durationMonths: 6,            // 6-month cliff
    percentage: 10,               // 10% at cliff
  },
  durationMonths: 24,            // 2-year vesting
  unlockFrequency: 'quarterly',  // Quarterly unlocks
  revocable: true,
  notes: 'Strategic advisor. 2-year term with quarterly unlock.',
});

// ── Process pending vesting unlocks (run via cron) ──────────────
const unlockEvents = await treasury.processVestingUnlocks();

console.log(`\nProcessed ${unlockEvents.length} vesting unlocks:`);
for (const event of unlockEvents) {
  console.log(`  Schedule ${event.id}: ${event.amount.toLocaleString()} tokens`);
  if (event.execution) {
    console.log(`    Proposal: ${event.execution.proposalId}`);
    console.log(`    Signature: ${event.execution.signature}`);
  }
}

// ── Revoke vesting (employee departure) ─────────────────────────
const revokedSchedule = await treasury.revokeVesting(
  vestingSchedule.id,
  'Employee voluntary departure. Unvested tokens returned to treasury.',
);

console.log(`\nVesting revoked for: ${revokedSchedule.recipient.name}`);
console.log(`Released before revocation: ${revokedSchedule.releasedAmount.toLocaleString()} EDGE`);
console.log(`Returned to treasury: ${revokedSchedule.remainingAmount.toLocaleString()} EDGE`);
```

### 5. Reconcile On-Chain Treasury with Fiat Records

```typescript
import { createTreasuryService } from '@mcv/web3-core/treasury';
import { createFiatTreasuryClient } from '@mcv/treasury'; // The fiat-side package

const onChainTreasury = createTreasuryService(config);
const fiatTreasury = createFiatTreasuryClient(fiatConfig);

// ── Run reconciliation ──────────────────────────────────────────
const reconciliation = await onChainTreasury.reconcile({
  // Time period to reconcile
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),

  // Fiat treasury client for cross-referencing
  fiatClient: fiatTreasury,

  // Price feed for USD conversion
  priceFeed: 'coingecko', // or 'pyth', 'switchboard'

  // Tolerance for discrepancies (in USD)
  toleranceUsd: 10,

  // Include yield earnings in reconciliation
  includeYield: true,
});

console.log('Reconciliation Report');
console.log('=====================');
console.log(`Period: ${reconciliation.period.startDate.toISOString().slice(0, 10)} to ${reconciliation.period.endDate.toISOString().slice(0, 10)}`);
console.log(`Run ID: ${reconciliation.runId}`);
console.log();

// Summary
console.log('On-Chain Summary:');
console.log(`  Total inflows:  $${reconciliation.onChain.totalInflowsUsd.toLocaleString()}`);
console.log(`  Total outflows: $${reconciliation.onChain.totalOutflowsUsd.toLocaleString()}`);
console.log(`  Net change:     $${reconciliation.onChain.netChangeUsd.toLocaleString()}`);
console.log(`  End balance:    $${reconciliation.onChain.endBalanceUsd.toLocaleString()}`);
console.log();

console.log('Fiat-Side Summary:');
console.log(`  Total inflows:  $${reconciliation.fiat.totalInflowsUsd.toLocaleString()}`);
console.log(`  Total outflows: $${reconciliation.fiat.totalOutflowsUsd.toLocaleString()}`);
console.log(`  Net change:     $${reconciliation.fiat.netChangeUsd.toLocaleString()}`);
console.log(`  Recorded balance: $${reconciliation.fiat.recordedBalanceUsd.toLocaleString()}`);
console.log();

// Matched transactions
console.log(`Matched transactions: ${reconciliation.matched.length}`);
console.log(`Unmatched on-chain:   ${reconciliation.unmatchedOnChain.length}`);
console.log(`Unmatched fiat:       ${reconciliation.unmatchedFiat.length}`);
console.log(`Discrepancies:        ${reconciliation.discrepancies.length}`);

// Handle discrepancies
if (reconciliation.discrepancies.length > 0) {
  console.log('\n⚠️ Discrepancies Found:');
  for (const disc of reconciliation.discrepancies) {
    console.log(`  ${disc.id}: ${disc.reason}`);
    console.log(`    On-chain: $${disc.onChainUsd} | Fiat: $${disc.fiatUsd} | Diff: $${disc.differenceUsd}`);
    console.log(`    Transaction: ${disc.transactionSignature}`);
  }

  // Auto-resolve small discrepancies due to price fluctuation
  for (const disc of reconciliation.discrepancies) {
    if (Math.abs(parseFloat(disc.differenceUsd)) < 50) {
      await onChainTreasury.resolveDiscrepancy(disc.id, {
        resolution: 'price_fluctuation',
        notes: `Small discrepancy ($${disc.differenceUsd}) due to token price movement between transaction time and fiat recording time.`,
      });
      console.log(`  Auto-resolved: ${disc.id} (price fluctuation)`);
    }
  }
}

// ── Check overall reconciliation status ─────────────────────────
const status = await onChainTreasury.getReconciliationStatus();
console.log(`\nOverall Reconciliation Status: ${status.status}`);
console.log(`Last run: ${status.lastRunAt?.toISOString() ?? 'never'}`);
console.log(`Pending discrepancies: ${status.pendingDiscrepancies}`);
console.log(`Total unreconciled transactions: ${status.unreconciledCount}`);
```

### 6. Grant Disbursement with Milestone-Based Release

```typescript
import { createTreasuryService } from '@mcv/web3-core/treasury';
import { PublicKey } from '@solana/web3.js';

const treasury = createTreasuryService(config);

// ── Create a grant with milestones ──────────────────────────────
const grant = await treasury.createGrant({
  walletId: grantsVault.id,
  title: 'Community SDK — TypeScript Client Library',
  description: `
    Funding the development of an open-source TypeScript SDK for interacting
    with MCV's on-chain programs. The SDK will cover token operations, governance
    participation, and treasury queries with full type safety.
  `,
  recipient: {
    name: 'OpenMCV Contributors',
    walletAddress: new PublicKey('Grnt...recipient...addr'),
    email: 'grants@openmcv.dev',
  },
  tokenMint: USDC_MINT,
  tokenSymbol: 'USDC',
  totalAmount: 25000, // 25,000 USDC total
  milestones: [
    {
      title: 'Project Setup & Core Architecture',
      description: 'Repository setup, CI/CD, core type definitions, connection management. Deliverable: Published npm package with basic connection and type exports.',
      amount: 5000,
      dueDate: new Date('2026-03-15'),
    },
    {
      title: 'Token Operations Module',
      description: 'Full token transfer, balance query, and token account management. Deliverable: Working token module with 90%+ test coverage.',
      amount: 7500,
      dueDate: new Date('2026-04-15'),
    },
    {
      title: 'Governance & Treasury Queries',
      description: 'Governance proposal viewing/voting, treasury balance queries, transaction history. Deliverable: Governance and treasury modules with documentation.',
      amount: 7500,
      dueDate: new Date('2026-05-15'),
    },
    {
      title: 'Documentation, Examples & Launch',
      description: 'Full API documentation, example applications, npm publish with stable v1.0. Deliverable: Published v1.0.0 with docs site.',
      amount: 5000,
      dueDate: new Date('2026-06-15'),
    },
  ],
  proposalUrl: 'https://forum.mcv.dev/proposals/sdk-grant-2026',
  tags: ['sdk', 'typescript', 'open-source', 'developer-tools'],
});

console.log(`Grant created: ${grant.id}`);
console.log(`Title: ${grant.title}`);
console.log(`Total: ${grant.totalAmount} USDC`);
console.log(`Milestones: ${grant.milestoneCount}`);

// ── Approve a completed milestone ───────────────────────────────
// (After the grantee submits proof of milestone 1 completion)
const milestone = await treasury.approveMilestone(
  grant.id,
  grant.milestones[0].id, // Milestone 1
);

console.log(`\nMilestone approved: ${milestone.title}`);
console.log(`Status: ${milestone.status}`); // 'disbursed'
console.log(`Amount released: ${milestone.amount} USDC`);
console.log(`Transaction: ${milestone.signature}`);

// ── Check grant progress ────────────────────────────────────────
const grantStatus = await treasury.getGrant(grant.id);
console.log(`\nGrant Progress:`);
console.log(`  Status: ${grantStatus!.status}`);
console.log(`  Disbursed: ${grantStatus!.disbursedAmount} / ${grantStatus!.totalAmount} USDC`);
console.log(`  Milestones: ${grantStatus!.milestonesCompleted} / ${grantStatus!.milestoneCount}`);
```

### 7. Emergency Treasury Freeze and Recovery

```typescript
import { createTreasuryService } from '@mcv/web3-core/treasury';
import { PublicKey } from '@solana/web3.js';

const treasury = createTreasuryService(config);

// ── EMERGENCY: Freeze all treasury spending ─────────────────────
// Scenario: Suspected compromised signer key

await treasury.freezeTreasury(
  'Suspected compromise of signer key Dev4...xxxx. Freezing all spending pending investigation.',
  new PublicKey('Ceo1...xxxx'), // Must be an admin with canFreeze permission
);

console.log('🚨 TREASURY FROZEN');
console.log('All pending proposals are suspended.');
console.log('No new proposals can be created.');
console.log('Existing approved proposals cannot be executed.');

// ── Initiate key rotation ───────────────────────────────────────
const recovery = await treasury.initiateKeyRotation({
  compromisedKey: new PublicKey('Dev4...xxxx'),
  replacementKey: new PublicKey('NewDev4...xxxx'),
  reason: 'Private key potentially exposed. Rotating to new keypair.',
  initiator: new PublicKey('Ceo1...xxxx'),
  // Key rotation requires elevated threshold (all admins)
  elevatedThreshold: true,
});

console.log(`\nRecovery plan initiated: ${recovery.id}`);
console.log(`Steps:`);
for (const step of recovery.steps) {
  console.log(`  ${step.order}. ${step.description} — ${step.status}`);
}

// ── Emergency withdrawal (if needed) ────────────────────────────
// Requires 4-of-5 signatures (elevated from normal 3-of-5)
const emergencyWithdrawal = await treasury.initiateEmergencyWithdrawal({
  walletId: mainVault.id,
  destination: new PublicKey('Cold...storage...address'),
  assets: ['all'], // Move everything
  reason: 'Moving funds to cold storage during security incident.',
  initiator: new PublicKey('Ceo1...xxxx'),
  requiredThreshold: 4, // Elevated: 4-of-5
});

console.log(`\nEmergency withdrawal initiated: ${emergencyWithdrawal.id}`);
console.log(`Type: ${emergencyWithdrawal.type}`);
console.log(`Status: ${emergencyWithdrawal.status}`);
console.log(`Requires ${emergencyWithdrawal.requiredApprovals} approvals`);

// ── Unfreeze after resolution ───────────────────────────────────
// After investigation confirms the key was rotated and threat mitigated
await treasury.unfreezeTreasury(
  new PublicKey('Ceo1...xxxx'), // Requires admin
);

console.log('\n✅ Treasury unfrozen. Normal operations resumed.');
```

### 8. Budget Setup and Enforcement

```typescript
import { createTreasuryService } from '@mcv/web3-core/treasury';

const treasury = createTreasuryService(config);

// ── Set up quarterly budgets ────────────────────────────────────
const budgets = [
  { category: 'operations',     displayName: 'Operations',     limitUsd: 50000,  alertThreshold: 80 },
  { category: 'development',    displayName: 'Development',    limitUsd: 120000, alertThreshold: 75 },
  { category: 'marketing',      displayName: 'Marketing',      limitUsd: 30000,  alertThreshold: 80 },
  { category: 'grants',         displayName: 'Grants',         limitUsd: 75000,  alertThreshold: 70, rollover: true },
  { category: 'infrastructure', displayName: 'Infrastructure', limitUsd: 20000,  alertThreshold: 85 },
  { category: 'legal',          displayName: 'Legal',          limitUsd: 15000,  alertThreshold: 90 },
  { category: 'partnerships',   displayName: 'Partnerships',   limitUsd: 40000,  alertThreshold: 80 },
] as const;

for (const budget of budgets) {
  await treasury.setBudget({
    period: { type: 'quarterly', label: '2026-Q1' },
    category: budget.category,
    displayName: budget.displayName,
    limitUsd: budget.limitUsd,
    alertThreshold: budget.alertThreshold,
    autoReject: true,
    rollover: budget.rollover ?? false,
  });
}

console.log('Q1 2026 budgets configured.');

// ── Check budget utilization ────────────────────────────────────
const utilization = await treasury.getBudgetUtilization({
  type: 'quarterly',
  label: '2026-Q1',
});

console.log('\nQ1 2026 Budget Utilization:');
console.log('─'.repeat(70));
for (const cat of utilization) {
  const bar = '█'.repeat(Math.floor(cat.utilizationPercentage / 5)) + '░'.repeat(20 - Math.floor(cat.utilizationPercentage / 5));
  const status = cat.overBudget ? '🔴 OVER' : cat.utilizationPercentage > cat.alertThreshold ? '🟡 WARN' : '🟢 OK';
  console.log(`  ${cat.displayName.padEnd(16)} ${bar} ${cat.utilizationPercentage.toFixed(0).padStart(3)}% ($${cat.spentUsd.toLocaleString().padStart(9)} / $${cat.limitUsd.toLocaleString()}) ${status}`);
}

// ── Pre-check a potential spend ─────────────────────────────────
const check = await treasury.checkBudget('marketing', { amount: 20000, token: 'USDC' });

if (!check.allowed) {
  console.log(`\n❌ Spend rejected: ${check.reason}`);
  console.log(`Current utilization: ${check.currentUtilization.toFixed(0)}%`);
  console.log(`Would be: ${check.projectedUtilization.toFixed(0)}%`);
} else {
  console.log(`\n✅ Spend allowed`);
  console.log(`Remaining after: $${check.remainingAfterUsd.toLocaleString()}`);
  if (check.warnings.length > 0) {
    for (const warning of check.warnings) {
      console.log(`  ⚠️ ${warning}`);
    }
  }
}
```

---

## Error Codes

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| `TREASURY_001` | `WALLET_NOT_FOUND` | 404 | Treasury wallet not found by ID or address |
| `TREASURY_002` | `WALLET_FROZEN` | 403 | Operation rejected — treasury wallet is frozen |
| `TREASURY_003` | `INSUFFICIENT_BALANCE` | 400 | Wallet does not have sufficient balance for the requested transfer |
| `TREASURY_004` | `THRESHOLD_NOT_MET` | 400 | Approval threshold not met for proposal execution |
| `TREASURY_005` | `BUDGET_EXCEEDED` | 400 | Spending proposal exceeds the allocated budget for its category |
| `TREASURY_006` | `PROPOSAL_EXPIRED` | 410 | Spending proposal has expired (voting period elapsed) |
| `TREASURY_007` | `PROPOSAL_NOT_ACTIVE` | 409 | Cannot vote/execute — proposal is not in active/approved state |
| `TREASURY_008` | `DUPLICATE_VOTE` | 409 | Signer has already voted on this proposal |
| `TREASURY_009` | `UNAUTHORIZED_SIGNER` | 403 | Public key is not an authorized signer for this wallet |
| `TREASURY_010` | `PERMISSION_DENIED` | 403 | Member does not have the required permission for this action |
| `TREASURY_011` | `VESTING_CLIFF_NOT_REACHED` | 400 | Cannot process vesting unlock — cliff period has not elapsed |
| `TREASURY_012` | `VESTING_ALREADY_REVOKED` | 409 | Vesting schedule has already been revoked |
| `TREASURY_013` | `VESTING_NOT_REVOCABLE` | 403 | This vesting schedule was created as non-revocable |
| `TREASURY_014` | `GRANT_MILESTONE_NOT_READY` | 400 | Grant milestone is not in a submittable/approvable state |
| `TREASURY_015` | `RECONCILIATION_CONFLICT` | 409 | Transaction already reconciled or in conflicting reconciliation state |
| `TREASURY_016` | `SQUADS_TX_FAILED` | 502 | Squads Protocol transaction failed on-chain |
| `TREASURY_017` | `SQUADS_CONNECTION_ERROR` | 503 | Unable to communicate with Squads Protocol program |
| `TREASURY_018` | `PRICE_FEED_UNAVAILABLE` | 503 | Token price feed is unavailable for USD conversion |
| `TREASURY_019` | `EMERGENCY_THRESHOLD_REQUIRED` | 403 | Emergency operations require elevated multi-sig threshold |
| `TREASURY_020` | `ALLOCATION_INVALID` | 400 | Allocation targets do not sum to 100% or contain invalid ranges |
| `TREASURY_021` | `REBALANCE_SLIPPAGE_EXCEEDED` | 400 | Rebalance trade would exceed maximum allowed slippage |
| `TREASURY_022` | `YIELD_POSITION_ERROR` | 502 | Error interacting with yield protocol (deposit/withdraw/compound) |
| `TREASURY_023` | `BUDGET_PERIOD_FINALIZED` | 409 | Cannot modify budget for a finalized period |
| `TREASURY_024` | `WALLET_MEMBER_LIMIT` | 400 | Maximum number of wallet members reached |

### Error Class

```typescript
import { TRPCError } from '@trpc/server';

export class TreasuryError extends TRPCError {
  public readonly treasuryCode: string;
  public readonly details: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    details: Record<string, unknown> = {},
    httpCode: TRPCError['code'] = 'BAD_REQUEST',
  ) {
    super({
      code: httpCode,
      message: `[${code}] ${message}`,
    });
    this.treasuryCode = code;
    this.details = details;
  }
}

// Usage
throw new TreasuryError(
  'TREASURY_005',
  'Marketing budget exceeded. $30,000 limit, $28,500 spent, $5,000 requested.',
  {
    category: 'marketing',
    limitUsd: 30000,
    spentUsd: 28500,
    requestedUsd: 5000,
    remainingUsd: 1500,
  },
  'BAD_REQUEST',
);
```

---

## Security Considerations

The on-chain treasury is the **last line of defense** for MCV's digital assets. Security is not a feature — it is the foundational requirement.

### Multi-sig is Non-Negotiable

Every token movement from treasury wallets **must** pass through the Squads multi-sig approval workflow. There are zero exceptions and zero bypass paths. The system is designed so that:

- **No single person** can move funds, regardless of their role or permissions
- **Main vault** uses 3-of-5 threshold minimum — compromise of 2 keys cannot drain funds
- **Emergency operations** escalate to 4-of-5, ensuring even emergency paths require supermajority
- **Threshold changes** require existing threshold + 1 (changing 3-of-5 to 2-of-5 requires 4-of-5 approval)

### Key Management

```
┌─────────────────────────────────────────────────────────┐
│                    Key Security Model                    │
├──────────────┬──────────────────────────────────────────┤
│ Key Storage  │ Hardware wallets (Ledger) for all signers │
│ Distribution │ Geographic distribution of signers        │
│ Rotation     │ Quarterly key rotation schedule           │
│ Recovery     │ Shamir's Secret Sharing for cold backup   │
│ Compromise   │ Immediate freeze + rotate procedure       │
│ Audit        │ Monthly signing activity audit            │
└──────────────┴──────────────────────────────────────────┘
```

### Defense in Depth

1. **Application Layer** — Role-based permissions, budget enforcement, proposal expiration
2. **Protocol Layer** — Squads multi-sig threshold enforcement on-chain
3. **Network Layer** — Solana validator consensus for transaction finality
4. **Monitoring Layer** — Real-time alerting on unusual treasury activity
5. **Recovery Layer** — Emergency freeze, key rotation, cold storage evacuation

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Single key compromise | Multi-sig threshold (3-of-5 min) |
| Multiple key compromise (2) | Still below threshold; freeze + rotate |
| Insider threat (rogue signer) | Threshold prevents unilateral action; audit trail |
| Smart contract vulnerability | Squads Protocol is audited; monitor for upgrades |
| Price manipulation (rebalance) | Max slippage limits; oracle price feeds |
| Budget circumvention | On-chain budget checks before proposal creation |
| Social engineering | Proposal descriptions require justification; cooling period |
| Network congestion | Retry logic; priority fees for emergency transactions |

### Audit Trail

Every treasury action is recorded in three places:
1. **On-chain** — Immutable Solana transaction log
2. **Database** — Enriched metadata in `treasury_transactions` with categorization
3. **Application logs** — Structured logging with correlation IDs

No treasury action can occur without producing all three records.

### Rate Limiting & Cooling Periods

- **Proposal creation**: Maximum 10 proposals per wallet per day
- **Execution**: 5-minute cooling period after approval threshold is met before execution is allowed
- **Emergency freeze**: Immediate (no cooling period)
- **Unfreeze**: 24-hour cooling period after all admin approvals
- **Threshold changes**: 48-hour cooling period after approval

---

## Environment Variables

```bash
# ── Solana Connection ────────────────────────────────────────────
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_RPC_URL_DEVNET=https://api.devnet.solana.com
SOLANA_COMMITMENT=confirmed
SOLANA_NETWORK=mainnet-beta  # mainnet-beta | devnet | localnet

# ── Squads Protocol ─────────────────────────────────────────────
SQUADS_PROGRAM_ID=SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu  # Squads v4 mainnet
SQUADS_PROGRAM_ID_DEVNET=SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu

# ── Token Mints ──────────────────────────────────────────────────
EDGE_TOKEN_MINT=EDGE...mint...address
USDC_TOKEN_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
WSOL_TOKEN_MINT=So11111111111111111111111111111111111111112

# ── Price Feeds ──────────────────────────────────────────────────
PRICE_FEED_PROVIDER=coingecko  # coingecko | pyth | switchboard
COINGECKO_API_KEY=cg-xxxxxxxxxxxxx
PYTH_PRICE_FEED_SOL=H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG
PYTH_PRICE_FEED_USDC=Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD

# ── Database (Supabase) ─────────────────────────────────────────
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:xxx@db.xxxxx.supabase.co:5432/postgres

# ── Treasury Configuration ───────────────────────────────────────
TREASURY_MAIN_WALLET_ID=uuid-of-main-wallet
TREASURY_OPS_WALLET_ID=uuid-of-ops-wallet
TREASURY_GRANTS_WALLET_ID=uuid-of-grants-wallet
TREASURY_VESTING_WALLET_ID=uuid-of-vesting-wallet

# ── Proposal Defaults ───────────────────────────────────────────
PROPOSAL_DEFAULT_EXPIRY_DAYS=7
PROPOSAL_EXECUTION_COOLING_PERIOD_MS=300000  # 5 minutes
PROPOSAL_MAX_PER_WALLET_PER_DAY=10

# ── Emergency ────────────────────────────────────────────────────
EMERGENCY_ELEVATED_THRESHOLD=4  # out of 5 for main vault
EMERGENCY_UNFREEZE_COOLING_PERIOD_MS=86400000  # 24 hours
EMERGENCY_COLD_STORAGE_ADDRESS=Cold...storage...pubkey

# ── Yield Protocols ──────────────────────────────────────────────
KAMINO_VAULT_ADDRESS=Kam...vault...address
MARINADE_STAKE_POOL=Mari...pool...address
JITO_STAKE_POOL=Jito...pool...address

# ── Reconciliation ───────────────────────────────────────────────
RECONCILIATION_TOLERANCE_USD=10
RECONCILIATION_AUTO_RESOLVE_THRESHOLD_USD=50
RECONCILIATION_SCHEDULE_CRON=0 6 * * *  # Daily at 6 AM UTC

# ── Alerting ─────────────────────────────────────────────────────
TREASURY_ALERT_WEBHOOK_URL=https://example.com/webhook/slack-placeholder
TREASURY_ALERT_EMAIL=treasury-alerts@mcv.dev
BUDGET_ALERT_ENABLED=true

# ── Monitoring ───────────────────────────────────────────────────
TREASURY_HEALTH_CHECK_INTERVAL_MS=300000  # 5 minutes
TREASURY_BALANCE_SNAPSHOT_INTERVAL_MS=3600000  # 1 hour
```

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/web3-core` | Parent module — Solana connection, shared web3 utilities |
| `@mcv/web3-core/token` | Token operations (transfers, balance queries, mint info) |
| `@mcv/treasury` | Fiat-side treasury for reconciliation bridge |
| `@mcv/db` | Drizzle ORM setup, database client, migration utilities |
| `@mcv/auth` | Authentication context for tRPC procedures |
| `@mcv/observability` | Structured logging, metrics, tracing |
| `@mcv/config` | Environment variable management and validation |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@solana/web3.js` | `^2.x` | Solana RPC client, transaction building |
| `@sqds/multisig` | `^4.x` | Squads Protocol SDK for multi-sig operations |
| `@coral-xyz/anchor` | `^0.30` | Anchor framework for program interaction |
| `drizzle-orm` | `^0.35` | Type-safe ORM for PostgreSQL |
| `@trpc/server` | `^11` | tRPC router and procedure definitions |
| `zod` | `^3.23` | Schema validation for inputs and configuration |
| `decimal.js` | `^10` | Precise decimal arithmetic for token amounts |
| `bs58` | `^6` | Base58 encoding/decoding for Solana addresses |
| `dayjs` | `^1.11` | Date manipulation for vesting/budget calculations |

---

## Testing

### Testing Strategy

Treasury code demands the highest test coverage in the entire MCV codebase. Funds are at stake.

```
┌─────────────────────────────────────────────────────────┐
│                Testing Pyramid                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    ┌───────────┐                        │
│                    │   E2E     │  ← Devnet integration  │
│                    │  Tests    │    (real Squads txns)   │
│                   ┌┴───────────┴┐                       │
│                   │ Integration  │  ← Local validator    │
│                   │   Tests     │    + Supabase          │
│                  ┌┴─────────────┴┐                      │
│                  │   Unit Tests   │  ← Mocked deps      │
│                  │               │    100% logic          │
│                  └───────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetEnforcementService } from '../budget/budget-enforcement.service';
import { SpendingProposalService } from '../proposals/spending-proposal.service';

describe('BudgetEnforcementService', () => {
  let service: BudgetEnforcementService;
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = createMockDatabase();
    service = new BudgetEnforcementService(mockDb);
  });

  it('should allow spend within budget', async () => {
    mockDb.budgetCategories.findFirst.mockResolvedValue({
      category: 'marketing',
      limitCents: 3000000,   // $30,000
      spentCents: 1500000,   // $15,000
      pendingCents: 0,
      autoReject: true,
    });

    const result = await service.checkBudget('marketing', {
      amount: 10000,
      token: 'USDC',
    });

    expect(result.allowed).toBe(true);
    expect(result.remainingAfterUsd).toBe(5000);
    expect(result.projectedUtilization).toBeCloseTo(83.3, 1);
  });

  it('should reject spend exceeding budget', async () => {
    mockDb.budgetCategories.findFirst.mockResolvedValue({
      category: 'marketing',
      limitCents: 3000000,
      spentCents: 2800000,
      pendingCents: 0,
      autoReject: true,
    });

    const result = await service.checkBudget('marketing', {
      amount: 5000,
      token: 'USDC',
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('exceeds budget');
    expect(result.remainingAfterUsd).toBe(-3000);
  });

  it('should include pending proposals in budget calculation', async () => {
    mockDb.budgetCategories.findFirst.mockResolvedValue({
      category: 'development',
      limitCents: 12000000,    // $120,000
      spentCents: 8000000,     // $80,000
      pendingCents: 3500000,   // $35,000 pending
      autoReject: true,
    });

    const result = await service.checkBudget('development', {
      amount: 10000,
      token: 'USDC',
    });

    // $80k spent + $35k pending + $10k requested = $125k > $120k limit
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('including pending proposals');
  });

  it('should emit warning when approaching threshold', async () => {
    mockDb.budgetCategories.findFirst.mockResolvedValue({
      category: 'operations',
      limitCents: 5000000,
      spentCents: 3500000,
      pendingCents: 0,
      alertThreshold: 80,
      autoReject: true,
    });

    const result = await service.checkBudget('operations', {
      amount: 5000,
      token: 'USDC',
    });

    expect(result.allowed).toBe(true);
    expect(result.warnings).toContain(
      expect.stringContaining('80% threshold'),
    );
  });
});

describe('SpendingProposalService', () => {
  let service: SpendingProposalService;
  let mockBudget: MockBudgetService;
  let mockSquads: MockSquadsAdapter;

  beforeEach(() => {
    mockBudget = createMockBudgetService();
    mockSquads = createMockSquadsAdapter();
    service = new SpendingProposalService(mockDb, mockBudget, mockSquads);
  });

  it('should create proposal when budget allows', async () => {
    mockBudget.checkBudget.mockResolvedValue({ allowed: true, warnings: [] });
    mockSquads.createVaultTransaction.mockResolvedValue({ index: 42 });

    const proposal = await service.create({
      walletId: 'wallet-uuid',
      title: 'Test Proposal',
      description: 'Test',
      category: 'operations',
      recipient: mockPublicKey,
      tokenMint: USDC_MINT,
      amount: 1000,
    });

    expect(proposal.status).toBe('active');
    expect(proposal.onChainIndex).toBe(42);
    expect(mockBudget.checkBudget).toHaveBeenCalledWith('operations', expect.any(Object));
  });

  it('should reject proposal when budget exceeded', async () => {
    mockBudget.checkBudget.mockResolvedValue({
      allowed: false,
      reason: 'Operations budget exceeded',
    });

    await expect(
      service.create({
        walletId: 'wallet-uuid',
        title: 'Over Budget',
        description: 'This should fail',
        category: 'operations',
        recipient: mockPublicKey,
        tokenMint: USDC_MINT,
        amount: 999999,
      }),
    ).rejects.toThrow('TREASURY_005');
  });

  it('should transition to approved when threshold met', async () => {
    const proposal = createMockProposal({ threshold: 2, approvalCount: 1 });
    mockDb.spendingProposals.findFirst.mockResolvedValue(proposal);
    mockSquads.approveTransaction.mockResolvedValue({ signature: 'sig123' });

    const result = await service.vote(proposal.id, {
      voter: mockPublicKey,
      decision: 'approve',
    });

    expect(result.approvalCount).toBe(2);
    expect(result.status).toBe('approved');
  });

  it('should prevent duplicate votes', async () => {
    const proposal = createMockProposal({
      votes: [{ voter: mockPublicKey.toBase58(), decision: 'approve' }],
    });
    mockDb.spendingProposals.findFirst.mockResolvedValue(proposal);

    await expect(
      service.vote(proposal.id, {
        voter: mockPublicKey,
        decision: 'approve',
      }),
    ).rejects.toThrow('TREASURY_008');
  });

  it('should enforce execution cooling period', async () => {
    const proposal = createMockProposal({
      status: 'approved',
      // Approved 2 minutes ago (within 5-min cooling)
      updatedAt: new Date(Date.now() - 2 * 60 * 1000),
    });
    mockDb.spendingProposals.findFirst.mockResolvedValue(proposal);

    await expect(
      service.execute(proposal.id, mockPublicKey),
    ).rejects.toThrow('Cooling period');
  });
});
```

### Integration Tests (Local Validator)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestValidator } from '@mcv/web3-core/testing';
import { createTreasuryService } from '@mcv/web3-core/treasury';

describe('Treasury Integration (Local Validator)', () => {
  let validator: LocalValidator;
  let treasury: OnChainTreasuryService;

  beforeAll(async () => {
    validator = await createTestValidator({
      programs: ['squads_multisig_program'],
      accounts: ['funded_test_accounts'],
    });

    treasury = createTreasuryService({
      connection: validator.connection,
      supabase: testSupabaseClient,
      squadsProgram: validator.programIds.squads,
    });
  });

  afterAll(async () => {
    await validator.stop();
  });

  it('should create multi-sig and execute spending proposal end-to-end', async () => {
    // Create wallet
    const wallet = await treasury.createWallet({
      name: 'Test Vault',
      type: 'operations',
      threshold: 2,
      members: testMembers.slice(0, 3),
    });

    // Fund the vault
    await validator.airdrop(wallet.vaultAddress, 10_000_000_000); // 10 SOL

    // Create proposal
    const proposal = await treasury.createProposal({
      walletId: wallet.id,
      title: 'Test Transfer',
      description: 'Integration test transfer',
      category: 'operations',
      recipient: testRecipient,
      tokenMint: NATIVE_SOL_MINT,
      amount: 1, // 1 SOL
    });

    // Vote with both signers
    await treasury.vote(proposal.id, {
      voter: testMembers[0].publicKey,
      decision: 'approve',
    });
    await treasury.vote(proposal.id, {
      voter: testMembers[1].publicKey,
      decision: 'approve',
    });

    // Wait for cooling period in tests (reduced to 1s)
    await sleep(1100);

    // Execute
    const execution = await treasury.executeProposal(
      proposal.id,
      testMembers[0].publicKey,
    );

    expect(execution.signature).toBeTruthy();
    expect(execution.transferredAmount).toBe(1);

    // Verify on-chain
    const recipientBalance = await validator.connection.getBalance(testRecipient);
    expect(recipientBalance).toBeGreaterThanOrEqual(1_000_000_000);

    // Verify accounting record
    const txHistory = await treasury.getTransactionHistory({
      walletId: wallet.id,
      limit: 1,
    });
    expect(txHistory.items[0].signature).toBe(execution.signature);
    expect(txHistory.items[0].category).toBe('operations');
  }, 30000);

  it('should enforce budget limits on-chain', async () => {
    // Set a tight budget
    await treasury.setBudget({
      period: { type: 'monthly', label: 'test-month' },
      category: 'marketing',
      displayName: 'Marketing',
      limitUsd: 100,
      autoReject: true,
    });

    // Try to create a proposal over budget
    await expect(
      treasury.createProposal({
        walletId: wallet.id,
        title: 'Over Budget',
        description: 'Should fail',
        category: 'marketing',
        recipient: testRecipient,
        tokenMint: USDC_MINT,
        amount: 200,
      }),
    ).rejects.toThrow('BUDGET_EXCEEDED');
  });
});
```

### Running Tests

```bash
# Unit tests
pnpm test:unit --filter=@mcv/web3-core

# Integration tests (requires local Solana validator)
pnpm test:integration --filter=@mcv/web3-core

# E2E tests (requires devnet connection)
SOLANA_NETWORK=devnet pnpm test:e2e --filter=@mcv/web3-core

# Coverage report
pnpm test:coverage --filter=@mcv/web3-core

# Watch mode during development
pnpm test:watch --filter=@mcv/web3-core -- treasury
```

### Coverage Targets

| Layer | Target | Rationale |
|-------|--------|-----------|
| Budget enforcement | 100% | Prevents unauthorized spending