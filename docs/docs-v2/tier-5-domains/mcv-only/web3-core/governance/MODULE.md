# @mcv/web3-core/governance

> **Tier 5 — MCV-Only Domain Module**
> On-chain governance system for the MCV ecosystem powered by EDGE token holders.

| Field | Value |
|---|---|
| **Package** | `@mcv/web3-core/governance` |
| **Tier** | 5 — Domain (MCV-Only) |
| **Runtime** | Server (Node.js + Solana) |
| **Since** | 0.1.0 |
| **Status** | Active Development |
| **Owner** | MCV Protocol Team |
| **Depends on** | `@mcv/web3-core/staking`, `@mcv/web3-core/token`, `@mcv/web3-core/treasury`, `@mcv/shared/db`, `@mcv/shared/errors`, `@mcv/shared/events` |

---

## Purpose

The governance module is the democratic backbone of the MCV ecosystem. It provides a comprehensive on-chain governance system that enables EDGE token holders to propose, debate, vote on, and execute changes to the protocol — from parameter tweaks and treasury allocations to full program upgrades. Every significant decision in MCV flows through this module, ensuring that no single entity controls the protocol's evolution. The system is designed to be resistant to governance attacks while remaining accessible to genuine participants.

Governance in MCV operates as a hybrid on-chain/off-chain system. Proposals and their metadata are stored off-chain in Supabase PostgreSQL for rich queryability and fast access, while the actual voting power snapshots, vote tallies, and execution logic live on the Solana blockchain via Anchor programs. This architecture gives us the best of both worlds: the rich UX of off-chain systems (markdown proposals, threaded discussions, analytics dashboards) with the trustless finality of on-chain execution. When a proposal passes quorum and the timelock expires, execution happens automatically on-chain — no human intervention required.

The module supports multiple governance primitives: token-weighted voting (where 1 staked EDGE = 1 vote), quadratic voting for fairer representation on select proposal types, vote escrow (veEDGE) for time-locked commitment bonuses, delegation to trusted representatives, and multi-signature treasury governance via Squads Protocol. Together, these mechanisms create a governance system that balances efficiency with decentralization, speed with security, and simplicity with expressiveness.

---

## Exports

```typescript
// === Primary Service ===
export { GovernanceService }              from './services/governance.service';
export { GovernanceRouter }               from './router';

// === Proposal Management ===
export { ProposalService }                from './services/proposal.service';
export { ProposalBuilder }                from './builders/proposal.builder';
export { ProposalValidator }              from './validators/proposal.validator';
export { ProposalExecutor }               from './executors/proposal.executor';

// === Voting ===
export { VotingService }                  from './services/voting.service';
export { VotingPowerCalculator }          from './calculators/voting-power.calculator';
export { QuadraticVotingStrategy }        from './strategies/quadratic-voting.strategy';
export { TokenWeightedVotingStrategy }    from './strategies/token-weighted-voting.strategy';
export { VoteEscrowService }              from './services/vote-escrow.service';

// === Delegation ===
export { DelegationService }              from './services/delegation.service';
export { DelegationGraph }                from './graph/delegation.graph';
export { DelegationTracker }              from './trackers/delegation.tracker';

// === Timelock & Execution ===
export { TimelockService }                from './services/timelock.service';
export { TimelockQueue }                  from './queues/timelock.queue';
export { ExecutionEngine }                from './engine/execution.engine';
export { MultiStepExecutor }              from './executors/multi-step.executor';

// === Multi-sig ===
export { MultisigService }                from './services/multisig.service';
export { SquadsAdapter }                  from './adapters/squads.adapter';
export { MultisigProposalBuilder }        from './builders/multisig-proposal.builder';

// === Analytics ===
export { GovernanceAnalytics }            from './analytics/governance.analytics';
export { ParticipationTracker }           from './analytics/participation.tracker';
export { ProposalMetrics }                from './analytics/proposal.metrics';
export { DelegationAnalytics }            from './analytics/delegation.analytics';

// === On-chain Programs ===
export { GovernanceProgram }              from './programs/governance.program';
export { GovernanceInstructions }         from './programs/governance.instructions';
export { GovernancePDAs }                 from './programs/governance.pdas';

// === Configuration ===
export { GovernanceConfig }               from './config/governance.config';
export { QuorumConfig }                   from './config/quorum.config';
export { TimelockConfig }                 from './config/timelock.config';
export { VotingConfig }                   from './config/voting.config';

// === Types ===
export type {
  Proposal,
  ProposalInput,
  ProposalStatus,
  ProposalType,
  ProposalAction,
  ProposalMetadata,
  Vote,
  VoteChoice,
  VoteReceipt,
  VotingPower,
  VotingPowerSnapshot,
  VotingStrategy,
  Delegation,
  DelegationInput,
  DelegationChain,
  DelegationNode,
  Timelock,
  TimelockEntry,
  TimelockStatus,
  ExecutionResult,
  ExecutionStep,
  MultisigConfig,
  MultisigTransaction,
  MultisigApproval,
  GovernanceStats,
  ParticipationRate,
  ProposalOutcome,
  GovernanceEvent,
  GovernanceError,
}                                         from './types';

// === DB Schema ===
export {
  proposals,
  votes,
  delegations,
  timelocks,
  governanceConfigs,
  executionLogs,
  votingPowerSnapshots,
  delegationHistory,
}                                         from './schema';

// === Error Codes ===
export { GovernanceErrorCode }            from './errors';

// === Events ===
export {
  PROPOSAL_CREATED,
  PROPOSAL_CANCELLED,
  PROPOSAL_EXECUTED,
  VOTE_CAST,
  VOTE_CHANGED,
  DELEGATION_CREATED,
  DELEGATION_REVOKED,
  TIMELOCK_STARTED,
  TIMELOCK_EXECUTED,
  QUORUM_REACHED,
  MULTISIG_APPROVED,
  MULTISIG_EXECUTED,
}                                         from './events';
```

---

## Architecture

### Governance Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         GOVERNANCE LIFECYCLE                                     │
│                                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  DRAFT   │───▶│  ACTIVE  │───▶│  PASSED  │───▶│ TIMELOCKED│───▶│ EXECUTED │  │
│  │          │    │ (Voting) │    │          │    │          │    │          │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │              │                                │         │
│       │               ▼              │                                │         │
│       │          ┌──────────┐        │                                │         │
│       │          │ DEFEATED │        │                                │         │
│       │          └──────────┘        │                                │         │
│       ▼                              ▼                                ▼         │
│  ┌──────────┐                  ┌──────────┐                    ┌──────────┐    │
│  │CANCELLED │                  │  VETOED   │                    │  FAILED  │    │
│  └──────────┘                  └──────────┘                    └──────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                        │
│                                                                                  │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│   │  Dashboard   │   │  Proposal   │   │   Voting    │   │  Analytics  │       │
│   │     UI       │   │   Editor    │   │   Widget    │   │   Charts    │       │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │
│          │                  │                  │                  │              │
└──────────┼──────────────────┼──────────────────┼──────────────────┼──────────────┘
           │                  │                  │                  │
           ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             tRPC API LAYER                                       │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐       │
│   │                      GovernanceRouter                                │       │
│   │                                                                      │       │
│   │  proposal.create  │  proposal.list  │  proposal.get  │  vote.cast   │       │
│   │  vote.delegate    │  vote.undelegate│  timelock.queue │  exec.run   │       │
│   │  analytics.stats  │  multisig.approve│ config.update  │  ...        │       │
│   └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                  │
└───────────────────────────────┬──────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                          │
│                                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│   │  Governance   │  │   Voting     │  │  Delegation  │  │   Timelock   │       │
│   │   Service     │  │   Service    │  │   Service    │  │   Service    │       │
│   └───────┬──────┘  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘       │
│           │                 │                  │                  │              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│   │  Proposal    │  │  VotePower   │  │  Delegation  │  │  Execution   │       │
│   │  Executor    │  │  Calculator  │  │    Graph     │  │   Engine     │       │
│   └───────┬──────┘  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘       │
│           │                 │                  │                  │              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                         │
│   │   Multisig   │  │  Vote Escrow │  │  Analytics   │                         │
│   │   Service    │  │   Service    │  │   Engine     │                         │
│   └───────┬──────┘  └───────┬──────┘  └───────┬──────┘                         │
│           │                 │                  │                                 │
└───────────┼─────────────────┼──────────────────┼────────────────────────────────┘
            │                 │                  │
            ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                             │
│                                                                                  │
│   ┌─────────────────────────────┐   ┌─────────────────────────────────┐         │
│   │     Supabase PostgreSQL     │   │        Solana Blockchain        │         │
│   │                             │   │                                  │         │
│   │  • proposals                │   │  • Governance Program (Anchor)  │         │
│   │  • votes                    │   │  • Voting Power Snapshots       │         │
│   │  • delegations              │   │  • Vote Records (on-chain)      │         │
│   │  • timelocks                │   │  • Timelock Accounts            │         │
│   │  • governance_configs       │   │  • Execution Receipts           │         │
│   │  • execution_logs           │   │  │                              │         │
│   │  • voting_power_snapshots   │   │  ┌─────────────────────────┐   │         │
│   │  • delegation_history       │   │  │   Squads Protocol       │   │         │
│   │                             │   │  │   (Multi-sig Vault)     │   │         │
│   └─────────────────────────────┘   │  └─────────────────────────┘   │         │
│                                      │                                │         │
│                                      └────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Voting Power Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                     VOTING POWER CALCULATION                          │
│                                                                       │
│   ┌─────────────┐                                                    │
│   │  EDGE Token  │                                                   │
│   │   Balance    │                                                   │
│   └──────┬──────┘                                                    │
│          │                                                            │
│          ▼                                                            │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐          │
│   │   Staking   │────▶│  Base Vote  │────▶│  veEDGE     │          │
│   │   Module    │     │   Weight    │     │  Multiplier  │          │
│   │  (@mcv/     │     │             │     │  (1x - 4x)   │          │
│   │  staking)   │     │  1 staked   │     │              │          │
│   └─────────────┘     │  EDGE = 1   │     │  Lock 1wk:   │          │
│                        │  base vote  │     │    1.0x      │          │
│                        └──────┬──────┘     │  Lock 1mo:   │          │
│                               │            │    1.5x      │          │
│                               │            │  Lock 6mo:   │          │
│                               │            │    2.5x      │          │
│                               │            │  Lock 1yr:   │          │
│                               │            │    4.0x      │          │
│                               │            └──────┬──────┘          │
│                               │                   │                  │
│                               ▼                   ▼                  │
│                        ┌─────────────────────────────┐              │
│                        │    Effective Voting Power     │              │
│                        │                               │              │
│                        │  = baseWeight × veMultiplier  │              │
│                        │                               │              │
│                        │  Example:                     │              │
│                        │  10,000 EDGE staked           │              │
│                        │  × 2.5 (6mo lock)            │              │
│                        │  = 25,000 voting power        │              │
│                        └──────────────┬───────────────┘              │
│                                       │                              │
│                          ┌────────────┴────────────┐                │
│                          ▼                         ▼                │
│                   ┌─────────────┐          ┌─────────────┐          │
│                   │  Direct     │          │  Delegated   │          │
│                   │  Voting     │          │  to Rep      │          │
│                   └─────────────┘          └─────────────┘          │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Proposal Type Decision Tree

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PROPOSAL TYPE ROUTING                              │
│                                                                       │
│                    ┌───────────────┐                                  │
│                    │  New Proposal  │                                 │
│                    └───────┬───────┘                                  │
│                            │                                          │
│               ┌────────────┼────────────┐                            │
│               ▼            ▼            ▼                            │
│      ┌─────────────┐ ┌─────────┐ ┌──────────┐                      │
│      │  Standard   │ │ Treasury│ │ Emergency│                       │
│      │  Proposal   │ │ Spend   │ │  Action  │                       │
│      └──────┬──────┘ └────┬────┘ └─────┬────┘                      │
│             │              │            │                             │
│        ┌────┼────┐         │       Requires:                        │
│        ▼    ▼    ▼         │       • Guardian multisig               │
│    Param  Text  Program    │       • 2/3 supermajority               │
│    Change  Only  Upgrade   │       • 1-hour timelock                 │
│        │    │    │         │       • Auto-expire 24h                 │
│        │    │    │         ▼                                         │
│        │    │    │    ┌─────────┐                                    │
│        │    │    │    │ Squads  │                                    │
│        ▼    ▼    ▼    │Multisig │                                    │
│    ┌─────────────┐    └────┬────┘                                    │
│    │  Standard   │         │                                         │
│    │  Quorum +   │         ▼                                         │
│    │  Timelock   │    ┌─────────┐                                    │
│    │             │    │  Fast   │                                    │
│    │  Quorum:    │    │Timelock │                                    │
│    │   10-30%    │    │  (1h)   │                                    │
│    │  Timelock:  │    └─────────┘                                    │
│    │   24h-72h   │                                                   │
│    └─────────────┘                                                   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### GovernanceService

The primary orchestrator for all governance operations.

```typescript
import { PublicKey, Transaction } from '@solana/web3.js';

/**
 * GovernanceService — top-level orchestrator for the governance system.
 * Coordinates between ProposalService, VotingService, DelegationService,
 * TimelockService, and MultisigService.
 */
interface GovernanceService {
  // === Proposal Lifecycle ===
  
  /**
   * Create a new governance proposal.
   * Validates the proposer's voting power meets the proposal threshold,
   * stores metadata off-chain, and creates the on-chain proposal account.
   */
  createProposal(input: ProposalInput, proposer: PublicKey): Promise<Proposal>;
  
  /**
   * Cancel a proposal. Only the original proposer or guardians can cancel.
   * Proposal must be in DRAFT or ACTIVE status.
   */
  cancelProposal(proposalId: string, canceller: PublicKey): Promise<void>;
  
  /**
   * Get a proposal by ID with full metadata, vote tallies, and status.
   */
  getProposal(proposalId: string): Promise<Proposal | null>;
  
  /**
   * List proposals with filtering, pagination, and sorting.
   */
  listProposals(params: ProposalListParams): Promise<PaginatedResult<Proposal>>;
  
  /**
   * Activate a draft proposal, starting the voting period.
   * Snapshots voting power at the current block.
   */
  activateProposal(proposalId: string, proposer: PublicKey): Promise<Proposal>;
  
  // === Voting ===
  
  /**
   * Cast a vote on an active proposal.
   * Validates voting power, checks for delegation, records on-chain.
   */
  castVote(proposalId: string, voter: PublicKey, choice: VoteChoice, memo?: string): Promise<VoteReceipt>;
  
  /**
   * Change a previously cast vote (if allowed by governance config).
   */
  changeVote(proposalId: string, voter: PublicKey, newChoice: VoteChoice): Promise<VoteReceipt>;
  
  /**
   * Get the voting power of an address at a specific snapshot.
   */
  getVotingPower(address: PublicKey, snapshotSlot?: number): Promise<VotingPower>;
  
  /**
   * Get all votes for a proposal with optional pagination.
   */
  getVotes(proposalId: string, params?: PaginationParams): Promise<PaginatedResult<Vote>>;
  
  // === Delegation ===
  
  /**
   * Delegate voting power to another address.
   */
  delegate(delegator: PublicKey, delegatee: PublicKey, amount?: bigint): Promise<Delegation>;
  
  /**
   * Revoke a delegation, returning voting power to the original holder.
   */
  undelegate(delegator: PublicKey, delegatee: PublicKey): Promise<void>;
  
  /**
   * Get all delegations for an address (both delegated and received).
   */
  getDelegations(address: PublicKey): Promise<DelegationInfo>;
  
  // === Execution ===
  
  /**
   * Queue a passed proposal for execution after timelock.
   */
  queueForExecution(proposalId: string): Promise<TimelockEntry>;
  
  /**
   * Execute a proposal that has passed the timelock period.
   */
  executeProposal(proposalId: string, executor: PublicKey): Promise<ExecutionResult>;
  
  /**
   * Get the timelock status for a queued proposal.
   */
  getTimelockStatus(proposalId: string): Promise<TimelockStatus>;
  
  // === Multi-sig ===
  
  /**
   * Submit a multi-sig governance action via Squads Protocol.
   */
  submitMultisigAction(action: MultisigAction, submitter: PublicKey): Promise<MultisigTransaction>;
  
  /**
   * Approve a pending multi-sig transaction.
   */
  approveMultisig(txId: string, approver: PublicKey): Promise<MultisigApproval>;
  
  // === Analytics ===
  
  /**
   * Get comprehensive governance statistics.
   */
  getStats(): Promise<GovernanceStats>;
  
  /**
   * Get voter participation rates over time.
   */
  getParticipationRates(period: TimePeriod): Promise<ParticipationRate[]>;
  
  // === Configuration ===
  
  /**
   * Get the current governance configuration.
   */
  getConfig(): Promise<GovernanceConfig>;
  
  /**
   * Update governance configuration (requires governance proposal).
   */
  updateConfig(config: Partial<GovernanceConfig>, authority: PublicKey): Promise<void>;
}
```

### Proposal

```typescript
/**
 * Represents a governance proposal in the MCV ecosystem.
 */
interface Proposal {
  /** Unique proposal identifier (UUID) */
  id: string;
  
  /** Sequential on-chain proposal number */
  proposalNumber: number;
  
  /** On-chain proposal account address */
  onChainAddress: PublicKey;
  
  /** Wallet address of the proposal creator */
  proposer: PublicKey;
  
  /** Human-readable title (max 256 chars) */
  title: string;
  
  /** Full proposal description in markdown */
  description: string;
  
  /** TL;DR summary (max 500 chars) */
  summary: string;
  
  /** Type of proposal determining quorum and timelock rules */
  type: ProposalType;
  
  /** Current lifecycle status */
  status: ProposalStatus;
  
  /** Actions to execute if the proposal passes */
  actions: ProposalAction[];
  
  /** Voting power snapshot slot (Solana slot number) */
  snapshotSlot: number;
  
  /** Voting period start timestamp */
  votingStartsAt: Date;
  
  /** Voting period end timestamp */
  votingEndsAt: Date;
  
  /** Current vote tallies */
  voteTally: VoteTally;
  
  /** Required quorum for this proposal type */
  quorumRequired: bigint;
  
  /** Whether quorum has been reached */
  quorumReached: boolean;
  
  /** Timelock entry if proposal has passed */
  timelock: TimelockEntry | null;
  
  /** Execution result if proposal has been executed */
  executionResult: ExecutionResult | null;
  
  /** Discussion forum URL */
  discussionUrl: string | null;
  
  /** IPFS hash for immutable proposal content */
  ipfsHash: string | null;
  
  /** Metadata tags for categorization */
  tags: string[];
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Last updated timestamp */
  updatedAt: Date;
}

type ProposalStatus =
  | 'draft'
  | 'active'
  | 'passed'
  | 'defeated'
  | 'timelocked'
  | 'executed'
  | 'failed'
  | 'cancelled'
  | 'vetoed'
  | 'expired';

type ProposalType =
  | 'parameter_change'
  | 'treasury_allocation'
  | 'program_upgrade'
  | 'emergency_action'
  | 'text_proposal'
  | 'guardian_election'
  | 'config_update';

interface ProposalAction {
  /** Action type identifier */
  type: 'instruction' | 'transfer' | 'upgrade' | 'config_change';
  
  /** Target program or account */
  target: PublicKey;
  
  /** Serialized instruction data */
  data: Buffer;
  
  /** Human-readable description of what this action does */
  description: string;
  
  /** Execution order (for multi-step proposals) */
  order: number;
  
  /** Whether this step is optional (execution continues if it fails) */
  optional: boolean;
}

interface ProposalInput {
  title: string;
  description: string;
  summary: string;
  type: ProposalType;
  actions: ProposalActionInput[];
  votingDurationHours?: number;
  discussionUrl?: string;
  tags?: string[];
}

interface ProposalActionInput {
  type: ProposalAction['type'];
  target: string; // Public key as string
  data: string;   // Base64-encoded instruction data
  description: string;
  order?: number;
  optional?: boolean;
}

interface ProposalListParams {
  status?: ProposalStatus | ProposalStatus[];
  type?: ProposalType | ProposalType[];
  proposer?: string;
  search?: string;
  tags?: string[];
  sortBy?: 'created' | 'voting_end' | 'votes' | 'proposal_number';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface VoteTally {
  /** Total votes in favor */
  forVotes: bigint;
  
  /** Total votes against */
  againstVotes: bigint;
  
  /** Total abstain votes */
  abstainVotes: bigint;
  
  /** Total unique voters */
  totalVoters: number;
  
  /** Total voting power that participated */
  totalVotingPower: bigint;
  
  /** Percentage of eligible supply that voted */
  participationRate: number;
}
```

### Vote

```typescript
/**
 * Represents a single vote cast on a proposal.
 */
interface Vote {
  /** Unique vote identifier */
  id: string;
  
  /** Proposal this vote is for */
  proposalId: string;
  
  /** Voter's wallet address */
  voter: PublicKey;
  
  /** Vote choice */
  choice: VoteChoice;
  
  /** Voting power applied to this vote */
  votingPower: bigint;
  
  /** Optional memo explaining the vote rationale */
  memo: string | null;
  
  /** Whether this vote was cast via delegation */
  isDelegated: boolean;
  
  /** Original delegator if vote was delegated */
  delegator: PublicKey | null;
  
  /** On-chain vote record address */
  onChainRecord: PublicKey;
  
  /** On-chain transaction signature */
  txSignature: string;
  
  /** Timestamp of vote */
  castAt: Date;
  
  /** If vote was changed, previous choice */
  previousChoice: VoteChoice | null;
  
  /** Number of times this vote has been changed */
  changeCount: number;
}

type VoteChoice = 'for' | 'against' | 'abstain';

interface VoteReceipt {
  /** The recorded vote */
  vote: Vote;
  
  /** Transaction signature */
  txSignature: string;
  
  /** Voting power applied */
  votingPowerApplied: bigint;
  
  /** Updated proposal tally after this vote */
  updatedTally: VoteTally;
  
  /** Whether this vote caused quorum to be reached */
  quorumReachedWithVote: boolean;
}
```

### VotingPower

```typescript
/**
 * Represents the voting power of an address.
 */
interface VotingPower {
  /** Address this voting power belongs to */
  address: PublicKey;
  
  /** Base voting power from staked EDGE */
  baseVotingPower: bigint;
  
  /** Staked EDGE amount */
  stakedAmount: bigint;
  
  /** veEDGE multiplier (1.0 - 4.0) */
  veMultiplier: number;
  
  /** Lock duration remaining in seconds */
  lockDurationRemaining: number;
  
  /** Effective voting power (base × multiplier) */
  effectiveVotingPower: bigint;
  
  /** Voting power delegated to others */
  delegatedOut: bigint;
  
  /** Voting power received from delegators */
  delegatedIn: bigint;
  
  /** Final usable voting power */
  usableVotingPower: bigint;
  
  /** Snapshot slot this was calculated at */
  snapshotSlot: number;
  
  /** Breakdown of delegations received */
  delegationBreakdown: DelegationEntry[];
}

interface VotingPowerSnapshot {
  /** Snapshot identifier */
  id: string;
  
  /** Solana slot number at snapshot */
  slot: number;
  
  /** Block hash at snapshot */
  blockHash: string;
  
  /** Total circulating voting power */
  totalVotingPower: bigint;
  
  /** Total number of addresses with voting power */
  totalVoters: number;
  
  /** Top 100 voting power holders (for quorum calculation) */
  topHolders: VotingPowerEntry[];
  
  /** Timestamp of snapshot */
  createdAt: Date;
}

interface VotingPowerEntry {
  address: PublicKey;
  votingPower: bigint;
  percentage: number;
}

interface DelegationEntry {
  delegator: PublicKey;
  amount: bigint;
  delegatedAt: Date;
}
```

### Delegation

```typescript
/**
 * Represents a voting power delegation from one address to another.
 */
interface Delegation {
  /** Unique delegation identifier */
  id: string;
  
  /** Address delegating their voting power */
  delegator: PublicKey;
  
  /** Address receiving the delegated voting power */
  delegatee: PublicKey;
  
  /** Amount of voting power delegated (null = full delegation) */
  amount: bigint | null;
  
  /** Effective delegated amount at current snapshot */
  effectiveAmount: bigint;
  
  /** On-chain delegation record */
  onChainRecord: PublicKey;
  
  /** Whether this delegation is currently active */
  isActive: boolean;
  
  /** When the delegation was created */
  createdAt: Date;
  
  /** When the delegation was last updated */
  updatedAt: Date;
  
  /** When the delegation was revoked (null if active) */
  revokedAt: Date | null;
}

interface DelegationInput {
  /** Address to delegate to */
  delegatee: string; // PublicKey as string
  
  /** Amount to delegate (omit for full delegation) */
  amount?: string; // bigint as string
}

interface DelegationInfo {
  /** Address this info is for */
  address: PublicKey;
  
  /** Delegations this address has made to others */
  outgoing: Delegation[];
  
  /** Delegations this address has received */
  incoming: Delegation[];
  
  /** Total voting power delegated out */
  totalDelegatedOut: bigint;
  
  /** Total voting power received via delegation */
  totalDelegatedIn: bigint;
  
  /** Net voting power after delegations */
  netVotingPower: bigint;
}

interface DelegationChain {
  /** Root delegator address */
  root: PublicKey;
  
  /** Chain of delegations (for detecting circular delegations) */
  chain: DelegationNode[];
  
  /** Total depth of the chain */
  depth: number;
  
  /** Whether a circular delegation was detected */
  isCircular: boolean;
}

interface DelegationNode {
  address: PublicKey;
  delegatedTo: PublicKey | null;
  votingPower: bigint;
  depth: number;
}
```

### Timelock

```typescript
/**
 * Represents a timelock entry for a passed proposal awaiting execution.
 */
interface TimelockEntry {
  /** Unique timelock identifier */
  id: string;
  
  /** Associated proposal ID */
  proposalId: string;
  
  /** On-chain timelock account */
  onChainAccount: PublicKey;
  
  /** When the timelock period started */
  queuedAt: Date;
  
  /** When the proposal becomes executable */
  executableAt: Date;
  
  /** When the execution window expires (proposal can no longer be executed) */
  expiresAt: Date;
  
  /** Current timelock status */
  status: TimelockStatus;
  
  /** Timelock duration in seconds */
  delaySeconds: number;
  
  /** Execution window duration in seconds */
  gracePeriodSeconds: number;
  
  /** Who queued this timelock entry */
  queuedBy: PublicKey;
  
  /** Who executed (if executed) */
  executedBy: PublicKey | null;
  
  /** Execution timestamp */
  executedAt: Date | null;
  
  /** Whether this was cancelled during timelock */
  cancelledAt: Date | null;
  
  /** Cancellation reason */
  cancellationReason: string | null;
}

type TimelockStatus =
  | 'pending'    // Waiting for timelock to expire
  | 'ready'      // Timelock expired, ready for execution
  | 'executed'   // Successfully executed
  | 'expired'    // Grace period passed without execution
  | 'cancelled'; // Cancelled during timelock by guardians

interface Timelock {
  /** Default timelock delay in seconds */
  defaultDelay: number;
  
  /** Per-proposal-type timelock overrides */
  typeDelays: Record<ProposalType, number>;
  
  /** Grace period after timelock expires */
  gracePeriod: number;
  
  /** Minimum timelock delay (cannot be set lower) */
  minimumDelay: number;
  
  /** Maximum timelock delay */
  maximumDelay: number;
  
  /** Guardian addresses that can cancel during timelock */
  guardians: PublicKey[];
}
```

### GovernanceConfig

```typescript
/**
 * Full governance configuration — governs how proposals, voting, and execution work.
 * This configuration itself can only be changed via a governance proposal.
 */
interface GovernanceConfig {
  /** Unique config version identifier */
  version: number;
  
  // === Proposal Settings ===
  
  /** Minimum voting power required to create a proposal */
  proposalThreshold: bigint;
  
  /** Maximum number of active proposals per proposer */
  maxActiveProposalsPerProposer: number;
  
  /** Maximum number of actions in a single proposal */
  maxActionsPerProposal: number;
  
  /** Default voting period duration in hours */
  defaultVotingPeriodHours: number;
  
  /** Minimum voting period in hours */
  minVotingPeriodHours: number;
  
  /** Maximum voting period in hours */
  maxVotingPeriodHours: number;
  
  /** Proposal cooldown period after defeat (hours) */
  defeatCooldownHours: number;
  
  // === Quorum Settings ===
  
  /** Default quorum as a percentage of total voting power (e.g., 10 = 10%) */
  defaultQuorumPercent: number;
  
  /** Per-proposal-type quorum overrides */
  quorumOverrides: Partial<Record<ProposalType, number>>;
  
  /** Whether dynamic quorum is enabled */
  dynamicQuorumEnabled: boolean;
  
  /** Dynamic quorum parameters */
  dynamicQuorum: DynamicQuorumConfig;
  
  // === Voting Settings ===
  
  /** Whether vote changes are allowed during voting period */
  allowVoteChanges: boolean;
  
  /** Maximum number of vote changes per voter per proposal */
  maxVoteChanges: number;
  
  /** Whether quadratic voting is enabled for applicable proposal types */
  quadraticVotingEnabled: boolean;
  
  /** Proposal types that use quadratic voting */
  quadraticVotingTypes: ProposalType[];
  
  /** Whether veEDGE multiplier applies */
  veEdgeEnabled: boolean;
  
  // === Delegation Settings ===
  
  /** Maximum delegation chain depth */
  maxDelegationDepth: number;
  
  /** Whether partial delegation is allowed */
  partialDelegationEnabled: boolean;
  
  /** Minimum delegation amount (if partial delegation enabled) */
  minDelegationAmount: bigint;
  
  // === Timelock Settings ===
  
  /** Default timelock delay in seconds */
  timelockDelay: number;
  
  /** Per-proposal-type timelock overrides */
  timelockOverrides: Partial<Record<ProposalType, number>>;
  
  /** Timelock grace period in seconds */
  timelockGracePeriod: number;
  
  // === Guardian Settings ===
  
  /** Guardian multi-sig address (can veto/cancel proposals) */
  guardianMultisig: PublicKey;
  
  /** Required guardian approvals for veto */
  guardianVetoThreshold: number;
  
  // === Emergency Settings ===
  
  /** Supermajority threshold for emergency actions (e.g., 67 = 67%) */
  emergencySupermajorityPercent: number;
  
  /** Emergency proposal timelock (shorter than normal) */
  emergencyTimelockSeconds: number;
  
  /** Emergency proposal max duration in hours */
  emergencyMaxDurationHours: number;
  
  /** Last updated timestamp */
  updatedAt: Date;
  
  /** Transaction that last updated this config */
  lastUpdateTx: string;
}

interface DynamicQuorumConfig {
  /** Base quorum percentage */
  baseQuorumPercent: number;
  
  /** Maximum quorum percentage (ceiling) */
  maxQuorumPercent: number;
  
  /** Quorum increase coefficient per against vote */
  quorumCoefficient: number;
  
  /** Smoothing factor for quorum adjustments */
  smoothingFactor: number;
}
```

### MultisigConfig

```typescript
/**
 * Multi-signature treasury governance via Squads Protocol.
 */
interface MultisigConfig {
  /** Squads multisig account address */
  multisigAddress: PublicKey;
  
  /** Squads vault address */
  vaultAddress: PublicKey;
  
  /** Member public keys */
  members: MultisigMember[];
  
  /** Required approvals for execution */
  threshold: number;
  
  /** Time limit for transaction approval (hours) */
  approvalTimeoutHours: number;
  
  /** Whether this multisig has guardian powers */
  isGuardian: boolean;
}

interface MultisigMember {
  /** Member wallet address */
  address: PublicKey;
  
  /** Display name */
  name: string;
  
  /** Member permissions */
  permissions: MultisigPermission[];
}

type MultisigPermission = 'propose' | 'approve' | 'execute' | 'cancel';

interface MultisigTransaction {
  /** Squads transaction index */
  index: number;
  
  /** Associated governance proposal (if any) */
  proposalId: string | null;
  
  /** Transaction status */
  status: 'active' | 'executed' | 'cancelled' | 'expired';
  
  /** Current approval count */
  approvalCount: number;
  
  /** Required approval count */
  threshold: number;
  
  /** Individual approvals */
  approvals: MultisigApproval[];
  
  /** Transaction creator */
  creator: PublicKey;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Executed timestamp */
  executedAt: Date | null;
}

interface MultisigApproval {
  /** Approver address */
  member: PublicKey;
  
  /** Approval timestamp */
  approvedAt: Date;
  
  /** On-chain signature */
  txSignature: string;
}

interface MultisigAction {
  /** Description of the action */
  description: string;
  
  /** Instructions to execute */
  instructions: TransactionInstruction[];
  
  /** Associated proposal ID (if governance-initiated) */
  proposalId?: string;
}
```

### GovernanceAnalytics Types

```typescript
interface GovernanceStats {
  /** Total proposals ever created */
  totalProposals: number;
  
  /** Currently active proposals */
  activeProposals: number;
  
  /** Total proposals that passed */
  passedProposals: number;
  
  /** Total proposals defeated */
  defeatedProposals: number;
  
  /** Total proposals executed */
  executedProposals: number;
  
  /** Average voter participation rate (%) */
  avgParticipationRate: number;
  
  /** Total unique voters ever */
  totalUniqueVoters: number;
  
  /** Total voting power in the system */
  totalVotingPower: bigint;
  
  /** Total active delegations */
  activeDelegations: number;
  
  /** Total delegated voting power */
  totalDelegatedPower: bigint;
  
  /** Proposal pass rate (%) */
  proposalPassRate: number;
  
  /** Average time from proposal to execution (hours) */
  avgTimeToExecution: number;
  
  /** Top delegates by received voting power */
  topDelegates: DelegateInfo[];
  
  /** Recent governance activity feed */
  recentActivity: GovernanceEvent[];
}

interface ParticipationRate {
  /** Time period */
  period: string;
  
  /** Percentage of eligible voters who voted */
  rate: number;
  
  /** Total eligible voters */
  eligibleVoters: number;
  
  /** Actual voters */
  actualVoters: number;
  
  /** Total proposals in this period */
  proposalCount: number;
}

interface DelegateInfo {
  /** Delegate address */
  address: PublicKey;
  
  /** Display name (if registered) */
  name: string | null;
  
  /** Total received voting power */
  receivedPower: bigint;
  
  /** Number of delegators */
  delegatorCount: number;
  
  /** Vote participation rate */
  voteParticipation: number;
  
  /** Delegate statement/platform */
  statement: string | null;
}

interface GovernanceEvent {
  /** Event type */
  type: 'proposal_created' | 'vote_cast' | 'proposal_passed' | 'proposal_defeated'
    | 'proposal_executed' | 'delegation_created' | 'delegation_revoked'
    | 'timelock_started' | 'config_updated' | 'multisig_executed';
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Actor address */
  actor: PublicKey;
  
  /** Event data */
  data: Record<string, unknown>;
  
  /** On-chain transaction */
  txSignature: string | null;
}
```

---

## Database Schemas

### proposals

```typescript
import { pgTable, text, timestamp, bigint, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const proposalStatusEnum = pgEnum('proposal_status', [
  'draft',
  'active',
  'passed',
  'defeated',
  'timelocked',
  'executed',
  'failed',
  'cancelled',
  'vetoed',
  'expired',
]);

export const proposalTypeEnum = pgEnum('proposal_type', [
  'parameter_change',
  'treasury_allocation',
  'program_upgrade',
  'emergency_action',
  'text_proposal',
  'guardian_election',
  'config_update',
]);

export const proposals = pgTable('governance_proposals', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  /** Sequential proposal number (auto-incremented) */
  proposalNumber: integer('proposal_number').notNull().unique(),
  
  /** On-chain proposal account address */
  onChainAddress: text('on_chain_address').notNull().unique(),
  
  /** Proposer's wallet address */
  proposer: text('proposer').notNull(),
  
  /** Proposal title (max 256 chars) */
  title: text('title').notNull(),
  
  /** Full description in markdown */
  description: text('description').notNull(),
  
  /** Short summary (max 500 chars) */
  summary: text('summary').notNull(),
  
  /** Proposal type */
  type: proposalTypeEnum('type').notNull(),
  
  /** Current status */
  status: proposalStatusEnum('status').notNull().default('draft'),
  
  /** Actions to execute (serialized) */
  actions: jsonb('actions').notNull().$type<ProposalAction[]>(),
  
  /** Solana slot at which voting power was snapshotted */
  snapshotSlot: bigint('snapshot_slot', { mode: 'number' }),
  
  /** Voting period start */
  votingStartsAt: timestamp('voting_starts_at', { withTimezone: true }),
  
  /** Voting period end */
  votingEndsAt: timestamp('voting_ends_at', { withTimezone: true }),
  
  /** Total FOR votes */
  forVotes: bigint('for_votes', { mode: 'bigint' }).notNull().default(0n),
  
  /** Total AGAINST votes */
  againstVotes: bigint('against_votes', { mode: 'bigint' }).notNull().default(0n),
  
  /** Total ABSTAIN votes */
  abstainVotes: bigint('abstain_votes', { mode: 'bigint' }).notNull().default(0n),
  
  /** Total unique voter count */
  totalVoters: integer('total_voters').notNull().default(0),
  
  /** Required quorum amount */
  quorumRequired: bigint('quorum_required', { mode: 'bigint' }).notNull(),
  
  /** Whether quorum was reached */
  quorumReached: boolean('quorum_reached').notNull().default(false),
  
  /** Discussion forum URL */
  discussionUrl: text('discussion_url'),
  
  /** IPFS hash for immutable content */
  ipfsHash: text('ipfs_hash'),
  
  /** Tags for categorization */
  tags: jsonb('tags').$type<string[]>().default([]),
  
  /** Cancellation reason (if cancelled/vetoed) */
  cancellationReason: text('cancellation_reason'),
  
  /** Address that cancelled (if applicable) */
  cancelledBy: text('cancelled_by'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Indexes defined separately via createIndex
}));
```

### votes

```typescript
export const voteChoiceEnum = pgEnum('vote_choice', ['for', 'against', 'abstain']);

export const votes = pgTable('governance_votes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  /** Associated proposal */
  proposalId: text('proposal_id')
    .notNull()
    .references(() => proposals.id, { onDelete: 'cascade' }),
  
  /** Voter wallet address */
  voter: text('voter').notNull(),
  
  /** Vote choice */
  choice: voteChoiceEnum('choice').notNull(),
  
  /** Voting power applied */
  votingPower: bigint('voting_power', { mode: 'bigint' }).notNull(),
  
  /** Optional rationale memo */
  memo: text('memo'),
  
  /** Whether this was a delegated vote */
  isDelegated: boolean('is_delegated').notNull().default(false),
  
  /** Original delegator address (if delegated) */
  delegator: text('delegator'),
  
  /** On-chain vote record address */
  onChainRecord: text('on_chain_record').notNull(),
  
  /** Transaction signature */
  txSignature: text('tx_signature').notNull(),
  
  /** Previous choice (if vote was changed) */
  previousChoice: voteChoiceEnum('previous_choice'),
  
  /** Number of times this vote was changed */
  changeCount: integer('change_count').notNull().default(0),
  
  /** When the vote was cast */
  castAt: timestamp('cast_at', { withTimezone: true }).notNull().defaultNow(),
  
  /** When the vote was last updated */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one vote per voter per proposal
  // Index on proposal_id, voter for fast lookups
}));
```

### delegations

```typescript
export const delegations = pgTable('governance_delegations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  /** Address delegating voting power */
  delegator: text('delegator').notNull(),
  
  /** Address receiving delegated voting power */
  delegatee: text('delegatee').notNull(),
  
  /** Amount delegated (null = full delegation) */
  amount: bigint('amount', { mode: 'bigint' }),
  
  /** Effective amount at last snapshot */
  effectiveAmount: bigint('effective_amount', { mode: 'bigint' }).notNull().default(0n),
  
  /** On-chain delegation record address */
  onChainRecord: text('on_chain_record').notNull(),
  
  /** Whether delegation is active */
  isActive: boolean('is_active').notNull().default(true),
  
  /** Transaction signature of creation */
  createTxSignature: text('create_tx_signature').notNull(),
  
  /** Transaction signature of revocation */
  revokeTxSignature: text('revoke_tx_signature'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => ({
  // Unique constraint: one active delegation per delegator-delegatee pair
}));
```

### timelocks

```typescript
export const timelockStatusEnum = pgEnum('timelock_status', [
  'pending',
  'ready',
  'executed',
  'expired',
  'cancelled',
]);

export const timelocks = pgTable('governance_timelocks', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  /** Associated proposal */
  proposalId: text('proposal_id')
    .notNull()
    .references(() => proposals.id, { onDelete: 'cascade' })
    .unique(),
  
  /** On-chain timelock account */
  onChainAccount: text('on_chain_account').notNull().unique(),
  
  /** When the timelock was queued */
  queuedAt: timestamp('queued_at', { withTimezone: true }).notNull().defaultNow(),
  
  /** When the proposal becomes executable */
  executableAt: timestamp('executable_at', { withTimezone: true }).notNull(),
  
  /** When the execution window closes */
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  
  /** Current status */
  status: timelockStatusEnum('status').notNull().default('pending'),
  
  /** Delay duration in seconds */
  delaySeconds: integer('delay_seconds').notNull(),
  
  /** Grace period in seconds */
  gracePeriodSeconds: integer('grace_period_seconds').notNull(),
  
  /** Who queued this */
  queuedBy: text('queued_by').notNull(),
  
  /** Who executed (if executed) */
  executedBy: text('executed_by'),
  
  /** Execution timestamp */
  executedAt: timestamp('executed_at', { withTimezone: true }),
  
  /** Execution transaction signature */
  executionTxSignature: text('execution_tx_signature'),
  
  /** Cancellation timestamp */
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  
  /** Cancellation reason */
  cancellationReason: text('cancellation_reason'),
  
  /** Who cancelled */
  cancelledBy: text('cancelled_by'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### governance_configs

```typescript
export const governanceConfigs = pgTable('governance_configs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  /** Config version (auto-incremented) */
  version: integer('version').notNull().unique(),
  
  /** Whether this is the currently active config */
  isActive: boolean('is_active').notNull().default(false),
  
  /** Full configuration JSON */
  config: jsonb('config').notNull().$type<GovernanceConfig>(),
  
  /** Proposal that created this config (null for genesis) */
  proposalId: text('proposal_id').references(() => proposals.id),
  
  /** On-chain config account */
  onChainAccount: text('on_chain_account').notNull(),
  
  /** Transaction that applied this config */
  txSignature: text('tx_signature'),
  
  /** Who applied this config */
  appliedBy: text('applied_by'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
});
```

### execution_logs

```typescript
export const executionStatusEnum = pgEnum('execution_status', [
  'pending',
  'in_progress',
  'success',
  'partial_success',
  'failed',
  'reverted',
]);

export const executionLogs = pgTable('governance_execution_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  /** Associated proposal */
  proposalId: text('proposal_id')
    .notNull()
    .references(() => proposals.id, { onDelete: 'cascade' }),
  
  /** Associated timelock entry */
  timelockId: text('timelock_id')
    .references(() => timelocks.id),
  
  /** Overall execution status */
  status: executionStatusEnum('status').notNull().default('pending'),
  
  /** Who triggered execution */
  executor: text('executor').notNull(),
  
  /** Individual step results */
  steps: jsonb('steps').notNull().$type<ExecutionStepLog[]>(),
  
  /** Total steps in the proposal */
  totalSteps: integer('total_steps').notNull(),
  
  /** Steps completed successfully */
  completedSteps: integer('completed_steps').notNull().default(0),
  
  /** Steps that failed */
  failedSteps: integer('failed_steps').notNull().default(0),
  
  /** Gas/compute units used */
  computeUnitsUsed: integer('compute_units_used'),
  
  /** Transaction signatures for all steps */
  txSignatures: jsonb('tx_signatures').$type<string[]>().default([]),
  
  /** Error message if failed */
  errorMessage: text('error_message'),
  
  /** Error code if failed */
  errorCode: text('error_code'),
  
  /** Execution start time */
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  
  /** Execution completion time */
  completedAt: timestamp('completed_at', { withTimezone: true }),
  
  /** Total execution duration in ms */
  durationMs: integer('duration_ms'),
});

interface ExecutionStepLog {
  order: number;
  description: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  txSignature: string | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  computeUnits: number | null;
}
```

### voting_power_snapshots

```typescript
export const votingPowerSnapshots = pgTable('governance_voting_power_snapshots', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  /** Solana slot number */
  slot: bigint('slot', { mode: 'number' }).notNull(),
  
  /** Block hash at snapshot */
  blockHash: text('block_hash').notNull(),
  
  /** Associated proposal (if snapshot was taken for a specific proposal) */
  proposalId: text('proposal_id').references(() => proposals.id),
  
  /** Total voting power at snapshot */
  totalVotingPower: bigint('total_voting_power', { mode: 'bigint' }).notNull(),
  
  /** Total addresses with voting power */
  totalVoters: integer('total_voters').notNull(),
  
  /** Snapshot data (top holders, distribution) */
  snapshotData: jsonb('snapshot_data').notNull().$type<VotingPowerSnapshotData>(),
  
  /** Merkle root of the full snapshot for on-chain verification */
  merkleRoot: text('merkle_root').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

interface VotingPowerSnapshotData {
  topHolders: Array<{ address: string; power: string; percentage: number }>;
  distribution: {
    whales: number;     // > 1% of total
    large: number;      // 0.1% - 1%
    medium: number;     // 0.01% - 0.1%
    small: number;      // < 0.01%
  };
  giniCoefficient: number;
}
```

### delegation_history

```typescript
export const delegationEventEnum = pgEnum('delegation_event', [
  'created',
  'updated',
  'revoked',
  'amount_changed',
  'snapshot_recalc',
]);

export const delegationHistory = pgTable('governance_delegation_history', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  /** Associated delegation */
  delegationId: text('delegation_id')
    .notNull()
    .references(() => delegations.id, { onDelete: 'cascade' }),
  
  /** Event type */
  event: delegationEventEnum('event').notNull(),
  
  /** Delegator address */
  delegator: text('delegator').notNull(),
  
  /** Delegatee address */
  delegatee: text('delegatee').notNull(),
  
  /** Previous amount (if changed) */
  previousAmount: bigint('previous_amount', { mode: 'bigint' }),
  
  /** New amount */
  newAmount: bigint('new_amount', { mode: 'bigint' }),
  
  /** Transaction signature */
  txSignature: text('tx_signature'),
  
  /** Additional metadata */
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## Code Examples

### 1. Create a Governance Proposal

```typescript
import { GovernanceService } from '@mcv/web3-core/governance';
import { PublicKey } from '@solana/web3.js';

const governance = new GovernanceService(deps);

// Create a parameter change proposal
const proposal = await governance.createProposal(
  {
    title: 'Increase Staking Rewards by 15%',
    description: `
## Summary
This proposal increases the base staking reward rate from 8% APY to 9.2% APY,
a 15% increase. This adjustment is needed to remain competitive with other 
DeFi protocols and to incentivize long-term EDGE holders.

## Motivation
Current staking participation has dropped from 45% to 38% over the past quarter.
Competitor protocols offer 10-12% APY. A modest increase will help retain stakers
while keeping inflation sustainable.

## Technical Details
- Modifies \`staking_reward_rate\` parameter from \`800\` to \`920\` (basis points)
- Takes effect immediately upon execution
- No changes to staking contract logic

## Risk Assessment
- Marginal increase in EDGE inflation (~0.2% annually)
- Expected to increase staking participation by 5-8%
    `.trim(),
    summary: 'Increase staking reward rate from 8% to 9.2% APY to improve staking participation.',
    type: 'parameter_change',
    actions: [
      {
        type: 'config_change',
        target: 'StakingProgramAddress111111111111111111',
        data: Buffer.from(
          JSON.stringify({ staking_reward_rate: 920 })
        ).toString('base64'),
        description: 'Update staking_reward_rate from 800 to 920 basis points',
        order: 1,
        optional: false,
      },
    ],
    votingDurationHours: 120, // 5 days
    discussionUrl: 'https://forum.mcv.xyz/t/increase-staking-rewards/142',
    tags: ['staking', 'rewards', 'parameter-change'],
  },
  new PublicKey('ProposerWalletAddress111111111111111111')
);

console.log(`Proposal #${proposal.proposalNumber} created: ${proposal.id}`);
console.log(`Status: ${proposal.status}`); // 'draft'
console.log(`On-chain: ${proposal.onChainAddress.toBase58()}`);

// Activate the proposal (starts voting period)
const activeProposal = await governance.activateProposal(
  proposal.id,
  new PublicKey('ProposerWalletAddress111111111111111111')
);

console.log(`Voting starts: ${activeProposal.votingStartsAt}`);
console.log(`Voting ends: ${activeProposal.votingEndsAt}`);
console.log(`Snapshot slot: ${activeProposal.snapshotSlot}`);
console.log(`Quorum required: ${activeProposal.quorumRequired}`);
```

### 2. Cast a Vote with Voting Power Calculation

```typescript
import { GovernanceService, VotingPowerCalculator } from '@mcv/web3-core/governance';
import { PublicKey } from '@solana/web3.js';

const governance = new GovernanceService(deps);
const votingPower = new VotingPowerCalculator(deps);

const voterAddress = new PublicKey('VoterWalletAddress11111111111111111111');
const proposalId = 'clxyz123abc';

// Check voting power before voting
const power = await governance.getVotingPower(voterAddress);

console.log(`Staked EDGE: ${power.stakedAmount}`);
console.log(`veEDGE multiplier: ${power.veMultiplier}x`);
console.log(`Base voting power: ${power.baseVotingPower}`);
console.log(`Effective voting power: ${power.effectiveVotingPower}`);
console.log(`Delegated out: ${power.delegatedOut}`);
console.log(`Delegated in: ${power.delegatedIn}`);
console.log(`Usable voting power: ${power.usableVotingPower}`);

// Cast a vote
const receipt = await governance.castVote(
  proposalId,
  voterAddress,
  'for',
  'Supporting this proposal because increased staking rewards will help ecosystem growth.'
);

console.log(`Vote recorded: ${receipt.vote.id}`);
console.log(`Voting power applied: ${receipt.votingPowerApplied}`);
console.log(`TX: ${receipt.txSignature}`);
console.log(`Quorum reached: ${receipt.quorumReachedWithVote}`);

// Get updated tally
console.log(`For: ${receipt.updatedTally.forVotes}`);
console.log(`Against: ${receipt.updatedTally.againstVotes}`);
console.log(`Abstain: ${receipt.updatedTally.abstainVotes}`);
console.log(`Participation: ${receipt.updatedTally.participationRate}%`);

// --- Quadratic Voting Example ---
// For proposal types with quadratic voting enabled, voting power is sqrt(tokens)

const quadraticPower = await votingPower.calculateQuadratic(voterAddress, snapshotSlot);

// If voter has 10,000 EDGE staked:
// Token-weighted: 10,000 votes
// Quadratic: sqrt(10,000) = 100 votes
// This gives smaller holders more relative influence

console.log(`Quadratic voting power: ${quadraticPower.effectiveVotingPower}`);
```

### 3. Delegate Voting Power

```typescript
import { GovernanceService, DelegationService } from '@mcv/web3-core/governance';
import { PublicKey } from '@solana/web3.js';

const governance = new GovernanceService(deps);
const delegationService = new DelegationService(deps);

const delegator = new PublicKey('DelegatorWallet111111111111111111111');
const delegatee = new PublicKey('TrustedRepWallet111111111111111111111');

// Full delegation — delegate all voting power
const delegation = await governance.delegate(delegator, delegatee);

console.log(`Delegation created: ${delegation.id}`);
console.log(`From: ${delegation.delegator.toBase58()}`);
console.log(`To: ${delegation.delegatee.toBase58()}`);
console.log(`Effective amount: ${delegation.effectiveAmount}`);

// Partial delegation — delegate specific amount
const partialDelegation = await governance.delegate(
  delegator,
  new PublicKey('AnotherRepWallet1111111111111111111111'),
  5000n * 10n ** 9n // 5,000 EDGE (in lamports)
);

console.log(`Partial delegation: ${partialDelegation.effectiveAmount}`);

// View delegation info
const delegationInfo = await governance.getDelegations(delegator);
console.log(`Outgoing delegations: ${delegationInfo.outgoing.length}`);
console.log(`Total delegated out: ${delegationInfo.totalDelegatedOut}`);
console.log(`Net voting power: ${delegationInfo.netVotingPower}`);

// View delegation graph (detect circular delegations)
const graph = await delegationService.getDelegationChain(delegatee);
console.log(`Chain depth: ${graph.depth}`);
console.log(`Circular: ${graph.isCircular}`);

for (const node of graph.chain) {
  console.log(`  ${node.address.toBase58()} → ${node.delegatedTo?.toBase58() ?? 'SELF'} (${node.votingPower})`);
}

// Revoke delegation
await governance.undelegate(delegator, delegatee);
console.log('Delegation revoked');

// View delegate leaderboard
const stats = await governance.getStats();
for (const delegate of stats.topDelegates) {
  console.log(
    `${delegate.name ?? delegate.address.toBase58()}: ` +
    `${delegate.receivedPower} power from ${delegate.delegatorCount} delegators ` +
    `(${delegate.voteParticipation}% participation)`
  );
}
```

### 4. Execute a Proposal After Timelock

```typescript
import { GovernanceService, TimelockService, ExecutionEngine } from '@mcv/web3-core/governance';
import { PublicKey } from '@solana/web3.js';

const governance = new GovernanceService(deps);
const timelockService = new TimelockService(deps);
const executionEngine = new ExecutionEngine(deps);

const proposalId = 'clxyz123abc';

// After a proposal passes, queue it for timelock
const timelockEntry = await governance.queueForExecution(proposalId);

console.log(`Queued at: ${timelockEntry.queuedAt}`);
console.log(`Executable at: ${timelockEntry.executableAt}`);
console.log(`Expires at: ${timelockEntry.expiresAt}`);
console.log(`Delay: ${timelockEntry.delaySeconds / 3600}h`);

// Check timelock status
const status = await governance.getTimelockStatus(proposalId);
console.log(`Status: ${status}`); // 'pending' | 'ready' | 'executed' | 'expired' | 'cancelled'

// Wait for timelock to expire, then execute
// (In production, this would be triggered by a cron job or keeper bot)

if (status === 'ready') {
  const executor = new PublicKey('ExecutorWallet1111111111111111111111');
  
  const result = await governance.executeProposal(proposalId, executor);
  
  console.log(`Execution status: ${result.status}`);
  console.log(`Steps completed: ${result.completedSteps}/${result.totalSteps}`);
  
  for (const step of result.steps) {
    console.log(
      `  Step ${step.order}: ${step.description} — ${step.status}` +
      (step.txSignature ? ` (tx: ${step.txSignature})` : '') +
      (step.errorMessage ? ` ERROR: ${step.errorMessage}` : '')
    );
  }
  
  if (result.status === 'success') {
    console.log('✅ Proposal executed successfully!');
    console.log(`Total compute units: ${result.computeUnitsUsed}`);
    console.log(`Duration: ${result.durationMs}ms`);
  } else if (result.status === 'partial_success') {
    console.log('⚠️ Proposal partially executed (some optional steps failed)');
  } else {
    console.log(`❌ Execution failed: ${result.errorMessage}`);
  }
}

// --- Multi-step execution example ---
// For proposals with multiple actions, execution happens sequentially

const multiStepProposal = await governance.createProposal({
  title: 'Treasury Diversification Plan',
  description: '...',
  summary: 'Diversify treasury across multiple yield sources',
  type: 'treasury_allocation',
  actions: [
    {
      type: 'transfer',
      target: 'TreasuryVault1111111111111111111111111',
      data: Buffer.from(JSON.stringify({
        recipient: 'LendingProtocol11111111111111111111',
        amount: '500000000000000', // 500K EDGE
      })).toString('base64'),
      description: 'Deposit 500K EDGE into lending protocol',
      order: 1,
      optional: false,
    },
    {
      type: 'transfer',
      target: 'TreasuryVault1111111111111111111111111',
      data: Buffer.from(JSON.stringify({
        recipient: 'LiquidityPool111111111111111111111',
        amount: '300000000000000', // 300K EDGE
      })).toString('base64'),
      description: 'Provide 300K EDGE to liquidity pool',
      order: 2,
      optional: false,
    },
    {
      type: 'instruction',
      target: 'AnalyticsProgram1111111111111111111111',
      data: Buffer.from(JSON.stringify({
        action: 'log_diversification',
      })).toString('base64'),
      description: 'Log diversification event (optional)',
      order: 3,
      optional: true, // Won't block execution if this fails
    },
  ],
}, proposerWallet);

// The ExecutionEngine processes steps in order, stopping on required step failure
```

### 5. Multi-sig Treasury Action via Squads Protocol

```typescript
import { MultisigService, SquadsAdapter } from '@mcv/web3-core/governance';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as squads from '@sqds/multisig';

const multisigService = new MultisigService(deps);
const squadsAdapter = new SquadsAdapter(deps);

// Get current multisig configuration
const config = await multisigService.getConfig();
console.log(`Multisig: ${config.multisigAddress.toBase58()}`);
console.log(`Vault: ${config.vaultAddress.toBase58()}`);
console.log(`Threshold: ${config.threshold}/${config.members.length}`);
console.log('Members:');
for (const member of config.members) {
  console.log(`  ${member.name}: ${member.address.toBase58()} [${member.permissions.join(', ')}]`);
}

// Submit a multi-sig action (e.g., emergency treasury transfer)
const multisigTx = await multisigService.submitAction(
  {
    description: 'Emergency grant: 10,000 EDGE to security auditor',
    instructions: [
      SystemProgram.transfer({
        fromPubkey: config.vaultAddress,
        toPubkey: new PublicKey('AuditorWallet111111111111111111111111'),
        lamports: 10_000 * LAMPORTS_PER_SOL,
      }),
    ],
    proposalId: 'clxyz789def', // Linked governance proposal
  },
  new PublicKey('MemberWallet1111111111111111111111111')
);

console.log(`Multisig TX #${multisigTx.index} created`);
console.log(`Status: ${multisigTx.status}`);
console.log(`Approvals: ${multisigTx.approvalCount}/${multisigTx.threshold}`);

// Other members approve
const approval = await multisigService.approve(
  multisigTx.index.toString(),
  new PublicKey('MemberWallet2222222222222222222222222')
);

console.log(`Approved by: ${approval.member.toBase58()}`);
console.log(`TX: ${approval.txSignature}`);

// Check if threshold is met and execute
const updatedTx = await multisigService.getTransaction(multisigTx.index);
if (updatedTx.approvalCount >= updatedTx.threshold) {
  const executionResult = await multisigService.execute(multisigTx.index);
  console.log(`✅ Multi-sig transaction executed: ${executionResult.txSignature}`);
}

// List pending multi-sig transactions
const pending = await multisigService.listPending();
for (const tx of pending) {
  console.log(
    `TX #${tx.index}: ${tx.approvalCount}/${tx.threshold} approvals — ` +
    `created ${tx.createdAt.toISOString()}`
  );
}
```

### 6. Vote Escrow (veEDGE) Lock for Boosted Voting Power

```typescript
import { VoteEscrowService, VotingPowerCalculator } from '@mcv/web3-core/governance';
import { PublicKey } from '@solana/web3.js';

const veService = new VoteEscrowService(deps);
const calculator = new VotingPowerCalculator(deps);

const user = new PublicKey('UserWallet11111111111111111111111111');

// Lock EDGE tokens for boosted voting power
const lock = await veService.createLock({
  owner: user,
  amount: 50_000n * 10n ** 9n, // 50,000 EDGE
  lockDuration: 180 * 24 * 60 * 60, // 6 months in seconds
});

console.log(`Lock created: ${lock.id}`);
console.log(`Amount locked: ${lock.amount}`);
console.log(`Lock until: ${lock.unlockDate}`);
console.log(`veEDGE balance: ${lock.veBalance}`);
console.log(`Multiplier: ${lock.multiplier}x`); // 2.5x for 6 months

// Calculate boosted voting power
const power = await calculator.calculate(user);
console.log(`Base (staked): ${power.baseVotingPower}`);        // 50,000
console.log(`veMultiplier: ${power.veMultiplier}`);             // 2.5
console.log(`Effective: ${power.effectiveVotingPower}`);        // 125,000

// Extend an existing lock
await veService.extendLock(lock.id, 365 * 24 * 60 * 60); // Extend to 1 year
const updatedLock = await veService.getLock(lock.id);
console.log(`New multiplier: ${updatedLock.multiplier}x`); // 4.0x for 1 year

// Increase locked amount
await veService.increaseLockAmount(lock.id, 25_000n * 10n ** 9n); // Add 25K EDGE
const finalLock = await veService.getLock(lock.id);
console.log(`Total locked: ${finalLock.amount}`); // 75,000 EDGE
console.log(`Effective power: ${finalLock.amount * BigInt(Math.floor(finalLock.multiplier * 100)) / 100n}`);

// veEDGE decays linearly as unlock date approaches
// At 1 year lock: 4.0x
// At 6 months remaining: 2.5x
// At 1 month remaining: ~1.1x
// At unlock: 1.0x (no boost)

const decay = await veService.getDecaySchedule(lock.id);
for (const point of decay) {
  console.log(`${point.date}: ${point.multiplier}x (${point.effectivePower} power)`);
}
```

### 7. Governance Analytics Dashboard

```typescript
import { GovernanceAnalytics, ParticipationTracker, DelegationAnalytics } from '@mcv/web3-core/governance';

const analytics = new GovernanceAnalytics(deps);
const participation = new ParticipationTracker(deps);
const delegationAnalytics = new DelegationAnalytics(deps);

// Overall governance statistics
const stats = await analytics.getStats();

console.log('=== MCV Governance Overview ===');
console.log(`Total proposals: ${stats.totalProposals}`);
console.log(`Active proposals: ${stats.activeProposals}`);
console.log(`Pass rate: ${stats.proposalPassRate}%`);
console.log(`Avg participation: ${stats.avgParticipationRate}%`);
console.log(`Unique voters: ${stats.totalUniqueVoters}`);
console.log(`Total voting power: ${stats.totalVotingPower}`);
console.log(`Active delegations: ${stats.activeDelegations}`);
console.log(`Delegated power: ${stats.totalDelegatedPower}`);
console.log(`Avg time to execution: ${stats.avgTimeToExecution}h`);

// Participation rates over time
const rates = await participation.getRates({ period: 'monthly', months: 12 });
for (const rate of rates) {
  console.log(
    `${rate.period}: ${rate.rate}% participation ` +
    `(${rate.actualVoters}/${rate.eligibleVoters} voters, ${rate.proposalCount} proposals)`
  );
}

// Delegation graph analysis
const delegationGraph = await delegationAnalytics.getGraph();
console.log(`\n=== Delegation Network ===`);
console.log(`Total delegators: ${delegationGraph.totalDelegators}`);
console.log(`Total delegates: ${delegationGraph.totalDelegates}`);
console.log(`Max chain depth: ${delegationGraph.maxChainDepth}`);
console.log(`Concentration (Gini): ${delegationGraph.giniCoefficient}`);
console.log(`Top 10 delegates control: ${delegationGraph.top10Concentration}% of delegated power`);

// Proposal outcome breakdown
const outcomes = await analytics.getOutcomeBreakdown({ months: 6 });
console.log('\n=== Proposal Outcomes (6 months) ===');
for (const [type, data] of Object.entries(outcomes)) {
  console.log(`${type}: ${data.total} proposals — ${data.passed} passed, ${data.defeated} defeated, ${data.expired} expired`);
}

// Voter behavior analysis
const voterProfile = await analytics.getVoterProfile(
  new PublicKey('VoterWallet111111111111111111111111111')
);
console.log('\n=== Voter Profile ===');
console.log(`Proposals voted on: ${voterProfile.totalVotes}`);
console.log(`Vote distribution: ${voterProfile.forPercent}% for, ${voterProfile.againstPercent}% against`);
console.log(`Participation rate: ${voterProfile.participationRate}%`);
console.log(`Avg voting power used: ${voterProfile.avgVotingPower}`);
console.log(`Delegators: ${voterProfile.delegatorCount}`);
```

---

## Error Codes

| Code | Constant | Description | HTTP |
|------|----------|-------------|------|
| `GOV_001` | `INSUFFICIENT_VOTING_POWER` | Proposer does not meet the minimum voting power threshold to create a proposal. | 403 |
| `GOV_002` | `PROPOSAL_NOT_FOUND` | The specified proposal ID does not exist. | 404 |
| `GOV_003` | `PROPOSAL_NOT_ACTIVE` | Cannot vote on a proposal that is not in 'active' status. | 400 |
| `GOV_004` | `VOTING_PERIOD_ENDED` | The voting period for this proposal has ended. Cannot cast or change votes. | 400 |
| `GOV_005` | `ALREADY_VOTED` | This address has already voted on the proposal and vote changes are disabled. | 409 |
| `GOV_006` | `VOTE_CHANGE_LIMIT_EXCEEDED` | Maximum number of vote changes has been reached for this voter on this proposal. | 429 |
| `GOV_007` | `INVALID_PROPOSAL_TYPE` | The specified proposal type is not recognized or not permitted. | 400 |
| `GOV_008` | `MAX_ACTIVE_PROPOSALS_EXCEEDED` | Proposer has reached the maximum number of active proposals. | 429 |
| `GOV_009` | `TIMELOCK_NOT_EXPIRED` | The timelock period has not yet expired. Proposal cannot be executed. | 400 |
| `GOV_010` | `TIMELOCK_GRACE_PERIOD_EXPIRED` | The execution grace period has expired. Proposal can no longer be executed. | 410 |
| `GOV_011` | `EXECUTION_FAILED` | One or more required execution steps failed. See execution logs for details. | 500 |
| `GOV_012` | `DELEGATION_CIRCULAR` | Delegation would create a circular delegation chain. | 400 |
| `GOV_013` | `DELEGATION_DEPTH_EXCEEDED` | Delegation chain would exceed the maximum allowed depth. | 400 |
| `GOV_014` | `DELEGATION_SELF` | Cannot delegate to yourself. | 400 |
| `GOV_015` | `DELEGATION_NOT_FOUND` | No active delegation exists between the specified addresses. | 404 |
| `GOV_016` | `DELEGATION_ALREADY_EXISTS` | An active delegation already exists between these addresses. | 409 |
| `GOV_017` | `INSUFFICIENT_DELEGATION_AMOUNT` | Delegation amount is below the minimum required amount. | 400 |
| `GOV_018` | `MULTISIG_THRESHOLD_NOT_MET` | Multi-sig transaction has not reached the required approval threshold. | 400 |
| `GOV_019` | `MULTISIG_ALREADY_APPROVED` | This member has already approved this multi-sig transaction. | 409 |
| `GOV_020` | `MULTISIG_NOT_MEMBER` | The signer is not a member of the multi-sig. | 403 |
| `GOV_021` | `MULTISIG_INSUFFICIENT_PERMISSIONS` | The member does not have the required permissions for this action. | 403 |
| `GOV_022` | `PROPOSAL_CANCELLED` | This proposal has been cancelled and cannot be interacted with. | 410 |
| `GOV_023` | `PROPOSAL_VETOED` | This proposal has been vetoed by guardians. | 410 |
| `GOV_024` | `QUORUM_NOT_REACHED` | Proposal did not reach the required quorum and cannot proceed to execution. | 400 |
| `GOV_025` | `SNAPSHOT_SLOT_INVALID` | The voting power snapshot slot is invalid or not available. | 500 |
| `GOV_026` | `EMERGENCY_SUPERMAJORITY_NOT_MET` | Emergency action did not reach the required supermajority threshold. | 400 |
| `GOV_027` | `CONFIG_UPDATE_UNAUTHORIZED` | Governance config can only be updated via an approved governance proposal. | 403 |
| `GOV_028` | `PROPOSAL_ACTIONS_INVALID` | One or more proposal actions failed validation (invalid target, malformed data). | 400 |
| `GOV_029` | `VE_LOCK_NOT_FOUND` | No vote escrow lock found for the specified address. | 404 |
| `GOV_030` | `VE_LOCK_CANNOT_REDUCE` | Cannot reduce lock duration or amount on an existing vote escrow. | 400 |
| `GOV_031` | `FLASH_LOAN_DETECTED` | Voting power appears to have been acquired via flash loan. Vote rejected. | 403 |
| `GOV_032` | `PROPOSAL_SPAM_DETECTED` | Proposal creation rate exceeds anti-spam limits. | 429 |

```typescript
// Error code enum
export enum GovernanceErrorCode {
  INSUFFICIENT_VOTING_POWER = 'GOV_001',
  PROPOSAL_NOT_FOUND = 'GOV_002',
  PROPOSAL_NOT_ACTIVE = 'GOV_003',
  VOTING_PERIOD_ENDED = 'GOV_004',
  ALREADY_VOTED = 'GOV_005',
  VOTE_CHANGE_LIMIT_EXCEEDED = 'GOV_006',
  INVALID_PROPOSAL_TYPE = 'GOV_007',
  MAX_ACTIVE_PROPOSALS_EXCEEDED = 'GOV_008',
  TIMELOCK_NOT_EXPIRED = 'GOV_009',
  TIMELOCK_GRACE_PERIOD_EXPIRED = 'GOV_010',
  EXECUTION_FAILED = 'GOV_011',
  DELEGATION_CIRCULAR = 'GOV_012',
  DELEGATION_DEPTH_EXCEEDED = 'GOV_013',
  DELEGATION_SELF = 'GOV_014',
  DELEGATION_NOT_FOUND = 'GOV_015',
  DELEGATION_ALREADY_EXISTS = 'GOV_016',
  INSUFFICIENT_DELEGATION_AMOUNT = 'GOV_017',
  MULTISIG_THRESHOLD_NOT_MET = 'GOV_018',
  MULTISIG_ALREADY_APPROVED = 'GOV_019',
  MULTISIG_NOT_MEMBER = 'GOV_020',
  MULTISIG_INSUFFICIENT_PERMISSIONS = 'GOV_021',
  PROPOSAL_CANCELLED = 'GOV_022',
  PROPOSAL_VETOED = 'GOV_023',
  QUORUM_NOT_REACHED = 'GOV_024',
  SNAPSHOT_SLOT_INVALID = 'GOV_025',
  EMERGENCY_SUPERMAJORITY_NOT_MET = 'GOV_026',
  CONFIG_UPDATE_UNAUTHORIZED = 'GOV_027',
  PROPOSAL_ACTIONS_INVALID = 'GOV_028',
  VE_LOCK_NOT_FOUND = 'GOV_029',
  VE_LOCK_CANNOT_REDUCE = 'GOV_030',
  FLASH_LOAN_DETECTED = 'GOV_031',
  PROPOSAL_SPAM_DETECTED = 'GOV_032',
}
```

---

## Security Considerations

### Governance Attack Vectors

The governance module is a high-value target because it controls the entire protocol. Below are the attack vectors we defend against and how.

#### 1. Flash Loan Voting Attack

**Threat:** An attacker borrows a massive amount of EDGE via flash loan, stakes it, votes on a proposal, and returns the tokens — all in a single transaction. They effectively vote with borrowed capital.

**Defenses:**
- **Snapshot-based voting power**: Voting power is snapshotted at the block when a proposal becomes active (before anyone knows the exact snapshot slot). Tokens acquired after the snapshot have zero voting power.
- **Staking lockup requirement**: Staking requires a minimum lockup period. Flash-loaned tokens cannot be staked and unstaked in the same transaction.
- **Flash loan detection**: The VotingPowerCalculator checks for suspicious voting power spikes within recent blocks. If a wallet's staked balance increased dramatically in the blocks leading up to the snapshot, a `FLASH_LOAN_DETECTED` error is raised.
- **veEDGE time-weighting**: Vote escrow multipliers reward long-term holders, diluting the impact of newly acquired tokens.

```typescript
// Flash loan detection in VotingPowerCalculator
async function validateVotingPower(address: PublicKey, snapshotSlot: number): Promise<void> {
  const currentBalance = await getStakedBalance(address, snapshotSlot);
  const priorBalance = await getStakedBalance(address, snapshotSlot - FLASH_LOAN_LOOKBACK_SLOTS);
  
  const changeRatio = Number(currentBalance) / Number(priorBalance || 1n);
  
  if (changeRatio > FLASH_LOAN_THRESHOLD) {
    throw new GovernanceError(
      GovernanceErrorCode.FLASH_LOAN_DETECTED,
      `Suspicious voting power increase: ${changeRatio}x in ${FLASH_LOAN_LOOKBACK_SLOTS} slots`
    );
  }
}
```

#### 2. Proposal Spam

**Threat:** An attacker creates a flood of frivolous proposals to overwhelm voters, distract from malicious proposals, or grief the system.

**Defenses:**
- **Proposal threshold**: Proposers must hold a minimum voting power (configurable, default: 1% of total staked EDGE).
- **Max active proposals per proposer**: Each proposer can only have a limited number of active proposals simultaneously.
- **Proposal deposit**: Proposers must lock a deposit that is returned only if the proposal reaches quorum (regardless of outcome). Spam proposals forfeit the deposit.
- **Rate limiting**: The `PROPOSAL_SPAM_DETECTED` error is raised if proposals are created too rapidly.

#### 3. Timelock Bypass

**Threat:** An attacker attempts to execute a proposal before the timelock expires, or manipulates the timelock to skip the delay.

**Defenses:**
- **On-chain enforcement**: The timelock is enforced by the Solana program. The `execute` instruction validates the current slot against the `executable_at` slot stored on-chain. This cannot be spoofed.
- **Minimum timelock floor**: Even governance proposals that modify timelock duration cannot set it below the hardcoded minimum (1 hour for emergency, 24 hours for standard).
- **Guardian veto**: During the timelock period, the guardian multi-sig can cancel malicious proposals.
- **Grace period**: Proposals that aren't executed within the grace period automatically expire, preventing indefinite hanging proposals.

#### 4. Governance Capture (51% Attack)

**Threat:** An entity acquires >50% of voting power and passes self-serving proposals.

**Defenses:**
- **Quadratic voting option**: For certain proposal types, quadratic voting limits whale influence.
- **Supermajority requirements**: Critical proposals (program upgrades, emergency actions) require a 2/3 supermajority, not simple majority.
- **Guardian safety net**: The guardian multi-sig can veto proposals during the timelock period as a last resort.
- **Dynamic quorum**: As against-votes increase, the quorum requirement automatically rises, making contentious proposals harder to pass.
- **Monitoring and alerts**: The GovernanceAnalytics module tracks concentration metrics and raises alerts when voting power becomes dangerously concentrated.

#### 5. Delegation Exploits

**Threat:** An attacker creates circular delegation chains, exploits re-delegation to double-count voting power, or manipulates delegation to front-run votes.

**Defenses:**
- **Circular delegation detection**: The DelegationGraph traverses delegation chains and rejects any delegation that would create a cycle (`DELEGATION_CIRCULAR`).
- **Maximum chain depth**: Delegation chains are limited to a configurable depth (default: 3) to prevent deep chains that are hard to audit.
- **Snapshot-based delegation**: Like voting power, delegation amounts are calculated at the snapshot slot. Re-delegation after the snapshot has no effect on the current proposal.
- **No re-delegation of delegated power**: Delegatees cannot further delegate power they received from delegators (only their own staked power).

#### 6. Vote Buying & Off-chain Collusion

**Threat:** Actors buy votes off-chain or coordinate to manipulate outcomes.

**Defenses:**
- **Vote privacy option**: Optional commit-reveal voting scheme for sensitive proposals. Votes are committed as hashes during the voting period, then revealed after the voting period ends. This prevents last-minute bandwagon effects and makes vote buying harder to verify.
- **Vote change allowance**: Voters can change their votes, reducing the reliability of bought votes.
- **Monitoring**: Analytics tracks unusual voting patterns (e.g., many wallets voting identically within seconds).

### Security Best Practices

```typescript
// Security configuration recommendations
const RECOMMENDED_CONFIG: Partial<GovernanceConfig> = {
  // Proposal thresholds prevent spam
  proposalThreshold: 100_000n * 10n ** 9n, // 100K EDGE minimum
  maxActiveProposalsPerProposer: 3,
  
  // Voting windows long enough for participation
  defaultVotingPeriodHours: 120, // 5 days
  minVotingPeriodHours: 48,      // 2 days minimum
  
  // Conservative quorum requirements
  defaultQuorumPercent: 15,
  dynamicQuorumEnabled: true,
  
  // Delegation safety
  maxDelegationDepth: 3,
  partialDelegationEnabled: true,
  
  // Timelock safety
  timelockDelay: 48 * 60 * 60, // 48 hours standard
  timelockGracePeriod: 7 * 24 * 60 * 60, // 7 days to execute
  
  // Emergency safety
  emergencySupermajorityPercent: 67,
  emergencyTimelockSeconds: 3600, // 1 hour
  emergencyMaxDurationHours: 24,
  
  // Vote integrity
  allowVoteChanges: true,
  maxVoteChanges: 3,
  veEdgeEnabled: true,
};
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOVERNANCE_PROGRAM_ID` | ✅ | — | Solana program ID for the governance Anchor program |
| `GOVERNANCE_CONFIG_ACCOUNT` | ✅ | — | On-chain governance config PDA address |
| `SQUADS_MULTISIG_ADDRESS` | ✅ | — | Squads Protocol multi-sig account address |
| `SQUADS_VAULT_ADDRESS` | ✅ | — | Squads vault (treasury) address |
| `GOVERNANCE_AUTHORITY_KEYPAIR` | ✅ | — | Path to governance authority keypair (for automated execution) |
| `EDGE_TOKEN_MINT` | ✅ | — | EDGE token mint address on Solana |
| `SOLANA_RPC_URL` | ✅ | — | Solana RPC endpoint URL |
| `SOLANA_WS_URL` | ❌ | Derived from RPC | Solana WebSocket endpoint for real-time updates |
| `DATABASE_URL` | ✅ | — | Supabase PostgreSQL connection string |
| `GOVERNANCE_PROPOSAL_THRESHOLD` | ❌ | `100000000000000` | Minimum voting power to create proposals (in lamports) |
| `GOVERNANCE_DEFAULT_VOTING_HOURS` | ❌ | `120` | Default voting period in hours |
| `GOVERNANCE_DEFAULT_TIMELOCK_SECONDS` | ❌ | `172800` | Default timelock delay (48h) |
| `GOVERNANCE_EMERGENCY_TIMELOCK_SECONDS` | ❌ | `3600` | Emergency timelock delay (1h) |
| `GOVERNANCE_QUORUM_PERCENT` | ❌ | `15` | Default quorum percentage |
| `GOVERNANCE_DYNAMIC_QUORUM_ENABLED` | ❌ | `true` | Enable dynamic quorum adjustment |
| `GOVERNANCE_VE_EDGE_ENABLED` | ❌ | `true` | Enable vote escrow multiplier |
| `GOVERNANCE_QUADRATIC_VOTING_ENABLED` | ❌ | `false` | Enable quadratic voting |
| `GOVERNANCE_MAX_DELEGATION_DEPTH` | ❌ | `3` | Maximum delegation chain depth |
| `GOVERNANCE_FLASH_LOAN_LOOKBACK_SLOTS` | ❌ | `150` | Slots to look back for flash loan detection |
| `GOVERNANCE_FLASH_LOAN_THRESHOLD` | ❌ | `10` | Max allowed voting power increase ratio |
| `GOVERNANCE_KEEPER_ENABLED` | ❌ | `true` | Enable automated timelock execution |
| `GOVERNANCE_KEEPER_INTERVAL_MS` | ❌ | `60000` | Keeper polling interval |
| `GOVERNANCE_IPFS_GATEWAY` | ❌ | `https://ipfs.io` | IPFS gateway for proposal content |
| `GOVERNANCE_IPFS_PIN_SERVICE` | ❌ | — | IPFS pinning service API URL |
| `GOVERNANCE_IPFS_PIN_KEY` | ❌ | — | IPFS pinning service API key |

---

## Dependencies

### Internal

| Package | Purpose |
|---------|---------|
| `@mcv/web3-core/staking` | Reads staked EDGE balances for voting power calculation |
| `@mcv/web3-core/token` | EDGE token mint info, balance queries, transfer instructions |
| `@mcv/web3-core/treasury` | Treasury vault addresses, balance checks for treasury proposals |
| `@mcv/shared/db` | Drizzle ORM instance, database connection management |
| `@mcv/shared/errors` | Base error classes, error formatting |
| `@mcv/shared/events` | Event bus for governance events |
| `@mcv/shared/logging` | Structured logging |
| `@mcv/shared/validation` | Zod schemas, input validation helpers |

### External

| Package | Version | Purpose |
|---------|---------|---------|
| `@solana/web3.js` | `^1.95.0` | Solana blockchain interaction |
| `@coral-xyz/anchor` | `^0.30.0` | Anchor program client for governance program |
| `@sqds/multisig` | `^2.1.0` | Squads Protocol SDK for multi-sig operations |
| `drizzle-orm` | `^0.33.0` | Database ORM for off-chain storage |
| `@trpc/server` | `^10.45.0` | tRPC router for governance API |
| `zod` | `^3.23.0` | Runtime validation for inputs |
| `bn.js` | `^5.2.1` | BigNumber operations for Solana compatibility |
| `bs58` | `^5.0.0` | Base58 encoding for Solana addresses |
| `@paralleldrive/cuid2` | `^2.2.0` | Collision-resistant unique IDs |
| `dayjs` | `^1.11.0` | Date manipulation for timelock calculations |

---

## Testing

### Unit Tests

```bash
# Run governance unit tests
pnpm test --filter=@mcv/web3-core -- --testPathPattern=governance

# Run specific test suites
pnpm test --filter=@mcv/web3-core -- --testPathPattern=governance/voting
pnpm test --filter=@mcv/web3-core -- --testPathPattern=governance/delegation
pnpm test --filter=@mcv/web3-core -- --testPathPattern=governance/timelock
pnpm test --filter=@mcv/web3-core -- --testPathPattern=governance/multisig
```

### Key Test Scenarios

| Test Suite | Scenarios |
|------------|-----------|
| **Proposal Lifecycle** | Create draft → activate → vote → pass → timelock → execute; Create → cancel; Create → defeat; Create → expire; Create → veto |
| **Voting Power** | Staked balance calculation; veEDGE multiplier at various lock durations; Delegated power aggregation; Quadratic voting calculation; Snapshot accuracy |
| **Delegation** | Full delegation; Partial delegation; Undelegate; Circular detection; Depth limit; Re-delegation rejection; Delegation graph traversal |
| **Timelock** | Queue after pass; Execute after delay; Reject before delay; Expire after grace; Guardian cancel during timelock; Minimum delay enforcement |
| **Multi-sig** | Submit action; Approve; Threshold check; Execute at threshold; Reject insufficient permissions; Timeout expiry |
| **Flash Loan Detection** | Detect spike before snapshot; Allow gradual accumulation; Configurable threshold; Lookback window |
| **Quorum** | Static quorum check; Dynamic quorum increase with against-votes; Per-type quorum overrides; Emergency supermajority |
| **Error Handling** | All 32 error codes triggered correctly; Proper HTTP status codes; Informative error messages |

### Integration Tests

```typescript
// Integration test: Full proposal lifecycle
describe('Governance E2E', () => {
  it('should complete a full proposal lifecycle', async () => {
    // 1. Setup: stake tokens for voting power
    await stakingService.stake(proposer, 100_000n * 10n ** 9n);
    await stakingService.stake(voter1, 50_000n * 10n ** 9n);
    await stakingService.stake(voter2, 30_000n * 10n ** 9n);
    
    // 2. Create proposal
    const proposal = await governance.createProposal(proposalInput, proposer);
    expect(proposal.status).toBe('draft');
    
    // 3. Activate proposal
    const active = await governance.activateProposal(proposal.id, proposer);
    expect(active.status).toBe('active');
    expect(active.snapshotSlot).toBeGreaterThan(0);
    
    // 4. Cast votes
    const vote1 = await governance.castVote(proposal.id, voter1, 'for');
    const vote2 = await governance.castVote(proposal.id, voter2, 'for');
    
    // 5. Advance time past voting period
    await advanceTime(active.votingEndsAt);
    
    // 6. Finalize proposal
    const passed = await governance.finalizeProposal(proposal.id);
    expect(passed.status).toBe('passed');
    expect(passed.quorumReached).toBe(true);
    
    // 7. Queue for timelock
    const timelock = await governance.queueForExecution(proposal.id);
    expect(timelock.status).toBe('pending');
    
    // 8. Advance time past timelock
    await advanceTime(timelock.executableAt);
    
    // 9. Execute
    const result = await governance.executeProposal(proposal.id, executor);
    expect(result.status).toBe('success');
    expect(result.completedSteps).toBe(result.totalSteps);
  });
});
```

### Local Development

```bash
# Start local Solana validator with governance program deployed
solana-test-validator --bpf-program <GOVERNANCE_PROGRAM_ID> target/deploy/mcv_governance.so

# Seed governance config
pnpm run governance:seed --config=dev

# Run governance keeper (automated execution)
pnpm run governance:keeper --interval=5000

# Generate test proposals
pnpm run governance:generate-test-data --proposals=10 --voters=50
```

### Anchor Program Testing

```bash
# Build governance Anchor program
anchor build -p mcv_governance

# Run Anchor tests (Rust)
anchor test -p mcv_governance

# Deploy to devnet
anchor deploy -p mcv_governance --provider.cluster devnet
```

---

## tRPC Router Reference

```typescript
// GovernanceRouter — tRPC endpoints

const governanceRouter = router({
  // === Proposals ===
  proposal: router({
    create: protectedProcedure
      .input(proposalInputSchema)
      .mutation(({ input, ctx }) => governance.createProposal(input, ctx.wallet)),
    
    activate: protectedProcedure
      .input(z.object({ proposalId: z.string() }))
      .mutation(({ input, ctx }) => governance.activateProposal(input.proposalId, ctx.wallet)),
    
    cancel: protectedProcedure
      .input(z.object({ proposalId: z.string(), reason: z.string().optional() }))
      .mutation(({ input, ctx }) => governance.cancelProposal(input.proposalId, ctx.wallet)),
    
    get: publicProcedure
      .input(z.object({ proposalId: z.string() }))
      .query(({ input }) => governance.getProposal(input.proposalId)),
    
    list: publicProcedure
      .input(proposalListParamsSchema)
      .query(({ input }) => governance.listProposals(input)),
  }),
  
  // === Voting ===
  vote: router({
    cast: protectedProcedure
      .input(z.object({
        proposalId: z.string(),
        choice: z.enum(['for', 'against', 'abstain']),
        memo: z.string().max(500).optional(),
      }))
      .mutation(({ input, ctx }) => governance.castVote(
        input.proposalId, ctx.wallet, input.choice, input.memo
      )),
    
    change: protectedProcedure
      .input(z.object({
        proposalId: z.string(),
        newChoice: z.enum(['for', 'against', 'abstain']),
      }))
      .mutation(({ input, ctx }) => governance.changeVote(
        input.proposalId, ctx.wallet, input.newChoice
      )),
    
    power: publicProcedure
      .input(z.object({ address: z.string(), snapshotSlot: z.number().optional() }))
      .query(({ input }) => governance.getVotingPower(new PublicKey(input.address), input.snapshotSlot)),
    
    list: publicProcedure
      .input(z.object({
        proposalId: z.string(),
        page: z.number().default(1),
        limit: z.number().default(50),
      }))
      .query(({ input }) => governance.getVotes(input.proposalId, input)),
  }),
  
  // === Delegation ===
  delegation: router({
    delegate: protectedProcedure
      .input(delegationInputSchema)
      .mutation(({ input, ctx }) => governance.delegate(
        ctx.wallet, new PublicKey(input.delegatee), input.amount ? BigInt(input.amount) : undefined
      )),
    
    undelegate: protectedProcedure
      .input(z.object({ delegatee: z.string() }))
      .mutation(({ input, ctx }) => governance.undelegate(ctx.wallet, new PublicKey(input.delegatee))),
    
    info: publicProcedure
      .input(z.object({ address: z.string() }))
      .query(({ input }) => governance.getDelegations(new PublicKey(input.address))),
    
    graph: publicProcedure
      .input(z.object({ address: z.string() }))
      .query(({ input }) => delegationService.getDelegationChain(new PublicKey(input.address))),
  }),
  
  // === Timelock & Execution ===
  execution: router({
    queue: protectedProcedure
      .input(z.object({ proposalId: z.string() }))
      .mutation(({ input }) => governance.queueForExecution(input.proposalId)),
    
    execute: protectedProcedure
      .input(z.object({ proposalId: z.string() }))
      .mutation(({ input, ctx }) => governance.executeProposal(input.proposalId, ctx.wallet)),
    
    status: publicProcedure
      .input(z.object({ proposalId: z.string() }))
      .query(({ input }) => governance.getTimelockStatus(input.proposalId)),
    
    logs: publicProcedure
      .input(z.object({ proposalId: z.string() }))
      .query(({ input }) => executionEngine.getLogs(input.proposalId)),
  }),
  
  // === Multi-sig ===
  multisig: router({
    submit: protectedProcedure
      .input(multisigActionSchema)
      .mutation(({ input, ctx }) => multisigService.submitAction(input, ctx.wallet)),
    
    approve: protectedProcedure
      .input(z.object({ txIndex: z.string() }))
      .mutation(({ input, ctx }) => multisigService.approve(input.txIndex, ctx.wallet)),
    
    pending: publicProcedure
      .query(() => multisigService.listPending()),
    
    config: publicProcedure
      .query(() => multisigService.getConfig()),
  }),
  
  // === Analytics ===
  analytics: router({
    stats: publicProcedure
      .query(() => analytics.getStats()),
    
    participation: publicProcedure
      .input(z.object({ period: z.enum(['weekly', 'monthly', 'quarterly']), months: z.number().default(12) }))
      .query(({ input }) => participation.getRates(input)),
    
    delegationGraph: publicProcedure
      .query(() => delegationAnalytics.getGraph()),
    
    voterProfile: publicProcedure
      .input(z.object({ address: z.string() }))
      .query(({ input }) => analytics.getVoterProfile(new PublicKey(input.address))),
    
    outcomes: publicProcedure
      .input(z.object({ months: z.number().default(6) }))
      .query(({ input }) => analytics.getOutcomeBreakdown(input)),
  }),
  
  // === Configuration ===
  config: router({
    get: publicProcedure
      .query(() => governance.getConfig()),
    
    // Config updates must happen via governance proposals — no direct mutation
  }),
});
```

---

## On-chain Program (Anchor)

### Program Design Key (PDAs)

```typescript
/**
 * PDA seeds for the governance Anchor program.
 */
export const GovernancePDAs = {
  /** Global governance config account */
  config: (programId: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from('governance-config')],
      programId
    ),
  
  /** Per-proposal account */
  proposal: (programId: PublicKey, proposalNumber: number) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from('proposal'), Buffer.from(proposalNumber.toString())],
      programId
    ),
  
  /** Per-vote record (ensures one vote per voter per proposal) */
  voteRecord: (programId: PublicKey, proposal: PublicKey, voter: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from('vote'), proposal.toBuffer(), voter.toBuffer()],
      programId
    ),
  
  /** Voting power snapshot for a proposal */
  snapshot: (programId: PublicKey, proposal: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from('snapshot'), proposal.toBuffer()],
      programId
    ),
  
  /** Timelock account for a proposal */
  timelock: (programId: PublicKey, proposal: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from('timelock'), proposal.toBuffer()],
      programId
    ),
  
  /** Delegation record */
  delegation: (programId: PublicKey, delegator: PublicKey, delegatee: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from('delegation'), delegator.toBuffer(), delegatee.toBuffer()],
      programId
    ),
  
  /** Vote escrow (veEDGE) account */
  voteEscrow: (programId: PublicKey, owner: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from('ve-edge'), owner.toBuffer()],
      programId
    ),
};
```

### Anchor Instructions Summary

| Instruction | Description | Accounts | Signers |
|-------------|-------------|----------|---------|
| `initialize_config` | Set up initial governance configuration | config, authority, system_program | authority |
| `create_proposal` | Create a new on-chain proposal account | proposal, proposer, config, system_program | proposer |
| `activate_proposal` | Start voting period, take snapshot | proposal, snapshot, config | proposer |
| `cast_vote` | Record a vote on-chain | proposal, vote_record, voter, config | voter |
| `change_vote` | Update an existing vote | proposal, vote_record, voter, config | voter |
| `finalize_proposal` | Count votes, determine outcome | proposal, config | anyone (permissionless) |
| `queue_timelock` | Create timelock entry after passing | proposal, timelock, config | anyone |
| `execute_proposal` | Execute proposal actions after timelock | proposal, timelock, config, ...action_accounts | executor |
| `cancel_proposal` | Cancel a proposal | proposal, canceller, config | canceller (proposer or guardian) |
| `veto_proposal` | Guardian veto during timelock | proposal, timelock, guardian_multisig | guardian |
| `create_delegation` | Delegate voting power on-chain | delegation, delegator, delegatee | delegator |
| `revoke_delegation` | Remove delegation | delegation, delegator | delegator |
| `create_vote_escrow` | Lock EDGE for veEDGE | vote_escrow, owner, token_account | owner |
| `extend_vote_escrow` | Extend lock duration | vote_escrow, owner | owner |
| `increase_escrow_amount` | Add more EDGE to lock | vote_escrow, owner, token_account | owner |
| `withdraw_escrow` | Withdraw after lock expires | vote_escrow, owner, token_account | owner |
| `update_config` | Update governance config (via proposal execution) | config, proposal, timelock | proposal authority |

---

## Migration Notes

### Initial Schema Migration

```sql
-- 001_governance_initial.sql

CREATE TYPE proposal_status AS ENUM (
  'draft', 'active', 'passed', 'defeated', 'timelocked',
  'executed', 'failed', 'cancelled', 'vetoed', 'expired'
);

CREATE TYPE proposal_type AS ENUM (
  'parameter_change', 'treasury_allocation', 'program_upgrade',
  'emergency_action', 'text_proposal', 'guardian_election', 'config_update'
);

CREATE TYPE vote_choice AS ENUM ('for', 'against', 'abstain');
CREATE TYPE timelock_status AS ENUM ('pending', 'ready', 'executed', 'expired', 'cancelled');
CREATE TYPE execution_status AS ENUM ('pending', 'in_progress', 'success', 'partial_success', 'failed', 'reverted');
CREATE TYPE delegation_event AS ENUM ('created', 'updated', 'revoked', 'amount_changed', 'snapshot_recalc');

-- Indexes for common query patterns
CREATE INDEX idx_proposals_status ON governance_proposals(status);
CREATE INDEX idx_proposals_type ON governance_proposals(type);
CREATE INDEX idx_proposals_proposer ON governance_proposals(proposer);
CREATE INDEX idx_proposals_voting_ends ON governance_proposals(voting_ends_at);
CREATE INDEX idx_proposals_created ON governance_proposals(created_at DESC);

CREATE UNIQUE INDEX idx_votes_voter_proposal ON governance_votes(voter, proposal_id);
CREATE INDEX idx_votes_proposal ON governance_votes(proposal_id);
CREATE INDEX idx_votes_voter ON governance_votes(voter);

CREATE UNIQUE INDEX idx_delegations_active ON governance_delegations(delegator, delegatee) WHERE is_active = true;
CREATE INDEX idx_delegations_delegatee ON governance_delegations(delegatee) WHERE is_active = true;

CREATE INDEX idx_timelocks_status ON governance_timelocks(status);
CREATE INDEX idx_timelocks_executable ON governance_timelocks(executable_at) WHERE status = 'pending';

CREATE INDEX idx_execution_logs_proposal ON governance_execution_logs(proposal_id);
CREATE INDEX idx_snapshots_slot ON governance_voting_power_snapshots(slot);
CREATE INDEX idx_delegation_history_delegation ON governance_delegation_history(delegation_id);
```

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/web3-core/staking` | Provides staked EDGE balances used for voting power calculation |
| `@mcv/web3-core/token` | EDGE token operations, balance queries, transfer instructions |
| `@mcv/web3-core/treasury` | Treasury vault managed by governance proposals and multi-sig |
| `@mcv/shared/db` | Database connection and Drizzle ORM instance |
| `@mcv/shared/events` | Event bus for broadcasting governance events |
| `@mcv/shared/errors` | Base error classes extended by GovernanceError |

---

## Glossary

| Term | Definition |
|------|------------|
| **Proposal** | A formal governance request to make a change to the MCV protocol |
| **Quorum** | The minimum percentage of total voting power that must participate for a vote to be valid |
| **Timelock** | A mandatory delay between a proposal passing and being executed, allowing for review and potential veto |
| **veEDGE** | Vote-escrowed EDGE — tokens locked for a period to receive a voting power multiplier |
| **Delegation** | Assigning your voting power to another address to vote on your behalf |
| **Guardian** | A multi-sig entity with power to veto malicious proposals during the timelock period |
| **Dynamic Quorum** | A quorum mechanism that increases the quorum requirement as against-votes increase |
| **Quadratic Voting** | A voting mechanism where voting power is the square root of tokens, giving smaller holders more relative influence |
| **Snapshot** | A point-in-time capture of all voting power, taken when a proposal is activated |
| **Grace Period** | The window after a timelock expires during which the proposal can be executed before it expires |
| **Squads Protocol** | A Solana-native multi-sig protocol used for the MCV guardian and treasury multi-sig |
| **Keeper** | An automated bot that monitors the timelock queue and executes proposals when they become eligible |
