# @mcv/web3-core/tokens — EDGE Token & SPL Token Operations

**Parent Package:** @mcv/web3-core  
**Sub-Module:** tokens  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** MCV-ONLY (Token Economy Infrastructure)  
**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Purpose

The `tokens` sub-module manages all SPL token operations within the MCV ecosystem, centered on the **EDGE token** — the ecosystem-wide utility and governance token powering all 9 MCV ventures. It provides comprehensive token lifecycle management: minting (controlled by program authority), burning (deflationary mechanics with full audit trail), transfers with automatic ATA creation and fee estimation, vesting schedule management with cliff/linear/milestone configurations, airdrop campaigns with Merkle tree verification for gas-efficient distribution, token allocation tracking across venture-specific buckets, and circulating supply snapshots for ACS regime detection.

**EDGE is the lifeblood of the MCV ecosystem.** Every reward distributed, every stake earned, every governance vote cast, and every treasury disbursement flows through the token infrastructure managed by this module. The token's supply dynamics — minting, burning, vesting unlocks, and circulating supply — directly feed the Algorithmic Control System (ACS v2.0), which uses these metrics to determine the current market cap regime and adjust 16 economic controllers accordingly.

The module supports the complete EDGE token economy:

1. **Token Minting**: Only the designated mint authority can mint new tokens. Minting events are strictly controlled and audit-logged, typically used for reward pool refills, vesting schedule fulfillment, and staking reward generation.

2. **Token Burning**: Deflationary burns reduce total supply. Burns can be manual (governance-approved), fee-based (percentage of transaction fees burned), buyback-based (tokens purchased from market and burned), or scheduled (automated burns per ACS schedule).

3. **Vesting Schedules**: Team, investor, and advisor token allocations vest over configurable timelines. Supports linear, cliff+linear, and milestone-based vesting with on-chain escrow via Program Derived Addresses (PDAs).

4. **Airdrop Distribution**: Gas-efficient token distribution to thousands of addresses using Merkle tree proofs. Each recipient's allocation and proof are verified on-chain to prevent double-claims.

5. **Supply Tracking**: Periodic snapshots of total supply, circulating supply, staked supply, locked supply (vesting), burned supply, and treasury-held supply. These metrics feed directly into the ACS regime detector.

**This module is the single source of truth for every EDGE token that exists, has been burned, is locked in vesting, or is claimable via airdrop.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  tokenService,                     // SPL token operations singleton
  TokenService,                     // Class (for testing / DI)
} from './service';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE INPUT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  MintTokenInput,                   // Mint new tokens (authority required)
  BurnTokenInput,                   // Burn tokens from supply
  TransferTokenInput,               // Transfer tokens between wallets
  BatchTransferInput,               // Batch transfer for reward distributions
  CreateVestingInput,               // Create a vesting schedule
  CancelVestingInput,               // Cancel an active vesting schedule
  CreateAirdropInput,               // Create an airdrop campaign
  AirdropRecipient,                 // Individual airdrop recipient entry
  SupplySnapshotOptions,            // Options for supply snapshot queries
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// RESULT / OUTPUT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  TokenMint,                        // Token mint definition record
  TokenAccount,                     // Associated token account record
  TokenTransfer,                    // Transfer history entry
  VestingSchedule,                  // Vesting schedule record
  VestingClaim,                     // Individual vesting claim entry
  AirdropCampaign,                  // Airdrop campaign record
  AirdropClaim,                     // Individual airdrop claim entry
  TokenAllocation,                  // Token allocation bucket record
  TokenBurn,                        // Burn event record
  TokenSupplySnapshot,              // Supply snapshot record
  SupplyBreakdown,                  // Current supply breakdown
  AirdropStatus,                    // Campaign status summary
  BatchTransferResult,              // Batch transfer results
  ClaimableAmount,                  // Vesting claimable amount
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export {
  tokenMints,                       // web3_token_mints — Token mint registry
  tokenAccounts,                    // web3_token_accounts — Associated token accounts
  tokenTransfers,                   // web3_token_transfers — Transfer history
  vestingSchedules,                 // web3_vesting_schedules — Vesting definitions
  vestingClaims,                    // web3_vesting_claims — Individual claims
  airdropCampaigns,                 // web3_airdrop_campaigns — Campaign definitions
  airdropClaims,                    // web3_airdrop_claims — Individual claims
  tokenAllocations,                 // web3_token_allocations — Allocation buckets
  tokenBurns,                       // web3_token_burns — Burn event log
  tokenSupplySnapshots,             // web3_token_supply_snapshots — Supply history
} from './schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  EDGE_TOKEN_MINT,                  // EDGE token mint address on Solana
  EDGE_TOKEN_DECIMALS,              // 9 decimals for EDGE
  EDGE_TOTAL_SUPPLY,                // Total supply cap
  TOKEN_ALLOCATION_BUCKETS,         // Default allocation bucket definitions
  VESTING_TYPES,                    // Supported vesting types
  BURN_TYPES,                       // Supported burn event types
  TRANSFER_TYPES,                   // Transfer categorization types
  SUPPLY_SNAPSHOT_INTERVAL_MS,      // 6-hour snapshot interval
  MAX_AIRDROP_RECIPIENTS,           // Maximum recipients per campaign (50,000)
  MERKLE_TREE_DEPTH,                // Default Merkle tree depth (20)
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useTokenOperations } from '../client/hooks/use-token-operations';
export { useVestingSchedule } from '../client/hooks/use-vesting-schedule';
```

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                       TOKENS SUB-MODULE ARCHITECTURE                              │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                          ENTRY POINTS                                      │   │
│  │                                                                            │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │   │
│  │  │  tRPC Router  │  │  Cron Jobs    │  │ Other Sub-    │  │ ACS Engine  │  │   │
│  │  │  /api/web3/   │  │  Supply       │  │ modules       │  │ Regime      │  │   │
│  │  │  tokens/*     │  │  Snapshot     │  │  (staking,    │  │ Detection   │  │   │
│  │  │              │  │  Vesting Exec │  │   treasury)   │  │             │  │   │
│  │  └──────┬────────┘  └──────┬────────┘  └──────┬────────┘  └──────┬──────┘  │   │
│  │         └─────────────────┬┘───────────────────┤                  │         │   │
│  └───────────────────────────┼────────────────────┼──────────────────┼─────────┘   │
│                              │                    │                  │             │
│  ┌───────────────────────────▼────────────────────▼──────────────────▼─────────┐   │
│  │                         TOKEN SERVICE                                      │   │
│  │                                                                            │   │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │   │
│  │  │  Mint & Burn       │  │  Transfers         │  │  Supply Tracking   │    │   │
│  │  │                    │  │                    │  │                    │    │   │
│  │  │ • mintTokens       │  │ • transfer         │  │ • getCirculating   │    │   │
│  │  │ • burnTokens       │  │ • batchTransfer    │  │ • snapshotSupply   │    │   │
│  │  │ • validateAuthority│  │ • createATA        │  │ • getAllocations   │    │   │
│  │  └────────┬───────────┘  └────────┬───────────┘  └────────┬───────────┘    │   │
│  │           │                       │                       │                │   │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │   │
│  │  │  Vesting Engine    │  │  Airdrop Engine    │  │  Allocation Mgmt  │    │   │
│  │  │                    │  │                    │  │                    │    │   │
│  │  │ • createSchedule   │  │ • createCampaign   │  │ • trackBuckets    │    │   │
│  │  │ • claimVested      │  │ • generateMerkle   │  │ • updateDistrib   │    │   │
│  │  │ • cancelVesting    │  │ • claimAirdrop     │  │ • lockUnlock      │    │   │
│  │  │ • getClaimable     │  │ • verifyProof      │  │                    │    │   │
│  │  └────────┬───────────┘  └────────┬───────────┘  └────────┬───────────┘    │   │
│  └───────────┼───────────────────────┼───────────────────────┼────────────────┘   │
│              │                       │                       │                    │
│  ┌───────────▼───────────────────────▼───────────────────────▼────────────────┐   │
│  │                    INFRASTRUCTURE LAYER                                     │   │
│  │                                                                            │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │   │
│  │  │ Solana RPC       │  │ @solana/spl-    │  │ merkletreejs    │            │   │
│  │  │                  │  │ token           │  │                  │            │   │
│  │  │ • getTokenSupply │  │ • createMint    │  │ • generateTree   │            │   │
│  │  │ • getTokenAccts  │  │ • mintTo        │  │ • getProof       │            │   │
│  │  │ • confirmTx      │  │ • burn          │  │ • verifyProof    │            │   │
│  │  │                  │  │ • transfer      │  │                  │            │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │   │
│  │                                                                            │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │   │
│  │  │ wallets (sibling)│  │ @mcv/fabric     │  │ Redis Cache     │            │   │
│  │  │                  │  │                  │  │                  │            │   │
│  │  │ • signAndSend    │  │ • audit trail   │  │ • supply cache   │            │   │
│  │  │ • getBalance     │  │ • event bus     │  │ • price cache    │            │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │   │
│  │                                                                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                    DATABASE (PostgreSQL via Drizzle ORM) — 10 tables        │   │
│  │                                                                            │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │   │
│  │  │ web3_token_  │ │ web3_token_  │ │ web3_token_  │ │web3_vesting_ │      │   │
│  │  │ mints        │ │ accounts     │ │ transfers    │ │schedules     │      │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │   │
│  │  │web3_vesting_ │ │web3_airdrop_ │ │web3_airdrop_ │ │ web3_token_  │      │   │
│  │  │claims        │ │campaigns     │ │claims        │ │allocations   │      │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │   │
│  │  ┌──────────────┐ ┌──────────────────────────────────────────┐            │   │
│  │  │ web3_token_  │ │ web3_token_supply_snapshots              │            │   │
│  │  │ burns        │ │                                          │            │   │
│  │  └──────────────┘ └──────────────────────────────────────────┘            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## Interfaces & Types

### Core Input Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// MINT & BURN
// ═══════════════════════════════════════════════════════════════════════════════

/** Mint new tokens — requires mint authority wallet */
export interface MintTokenInput {
  /** Token mint address to mint from */
  tokenMintId: string;

  /** Wallet ID with mint authority (must match on-chain mintAuthority) */
  authorityWalletId: string;

  /** Destination wallet address to receive minted tokens */
  destinationAddress: string;

  /** Amount to mint in raw units (with decimals, e.g., "1000000000" = 1 EDGE) */
  amount: string;

  /** Reason for minting (audit trail) */
  reason: string;

  /** Source module triggering the mint (e.g., 'staking', 'treasury') */
  sourceModule?: string;

  /** Source record ID for cross-reference */
  sourceId?: string;
}

/** Burn tokens — reduces total supply permanently */
export interface BurnTokenInput {
  /** Token mint address */
  tokenMintId: string;

  /** Wallet ID holding the tokens to burn */
  walletId: string;

  /** Amount to burn in raw units */
  amount: string;

  /** Type of burn event */
  burnType: 'manual' | 'fee_burn' | 'buyback_burn' | 'scheduled';

  /** Reason for burning (audit trail) */
  reason: string;

  /** User/agent that initiated the burn */
  burnedBy?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Transfer tokens between wallets */
export interface TransferTokenInput {
  /** Token mint address */
  tokenMintId: string;

  /** Source wallet ID (must be managed/custodial) */
  fromWalletId: string;

  /** Destination wallet address (any valid address) */
  toAddress: string;

  /** Amount to transfer in raw units */
  amount: string;

  /** Transfer categorization for tracking */
  transferType: 'reward' | 'vesting' | 'airdrop' | 'manual' | 'staking' | 'governance' | 'treasury';

  /** Optional SPL memo (stored on-chain) */
  memo?: string;

  /** Source module triggering the transfer */
  sourceModule?: string;

  /** Source record ID for cross-reference */
  sourceId?: string;

  /** Priority fee in microlamports */
  priorityFee?: number;
}

/** Batch transfer for reward distributions */
export interface BatchTransferInput {
  /** Token mint address */
  tokenMintId: string;

  /** Source wallet ID */
  fromWalletId: string;

  /** Individual transfer entries */
  transfers: Array<{
    toAddress: string;
    amount: string;
    memo?: string;
  }>;

  /** Transfer type for all entries */
  transferType: 'reward' | 'airdrop' | 'vesting';

  /** Source module */
  sourceModule?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VESTING
// ═══════════════════════════════════════════════════════════════════════════════

/** Create a vesting schedule for token allocation */
export interface CreateVestingInput {
  /** Venture that owns this vesting schedule */
  ventureId: string;

  /** Token mint address */
  tokenMintId: string;

  /** Human-readable name (e.g., "Team Vesting — Year 1") */
  name: string;

  /** Optional description */
  description?: string;

  /** Beneficiary wallet address */
  beneficiaryAddress: string;

  /** Beneficiary user ID (if MCV user) */
  beneficiaryUserId?: string;

  /** Total amount to vest in raw units */
  totalAmount: string;

  /** Vesting type determines the release curve */
  vestingType: 'linear' | 'cliff_linear' | 'milestone' | 'custom';

  /** Vesting start date */
  startDate: Date;

  /** Vesting end date */
  endDate: Date;

  /** Cliff date — no tokens released before this (cliff_linear type) */
  cliffDate?: Date;

  /** Amount released at cliff (cliff_linear type) */
  cliffAmount?: string;

  /** Release frequency in days (default 30) */
  vestingIntervalDays?: number;

  /** Milestone definitions (milestone type) */
  milestones?: Array<{
    date: string;
    amount: string;
    description: string;
  }>;
}

/** Cancel an active vesting schedule */
export interface CancelVestingInput {
  /** Vesting schedule ID to cancel */
  scheduleId: string;

  /** Reason for cancellation (audit trail) */
  reason: string;

  /** User/agent initiating cancellation */
  cancelledBy: string;

  /** Return unvested tokens to this address (defaults to treasury) */
  returnAddress?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AIRDROPS
// ═══════════════════════════════════════════════════════════════════════════════

/** Create an airdrop distribution campaign */
export interface CreateAirdropInput {
  /** Venture running the airdrop */
  ventureId: string;

  /** Token mint address */
  tokenMintId: string;

  /** Campaign name (e.g., "EDGE Genesis Airdrop") */
  name: string;

  /** Optional description */
  description?: string;

  /** Total amount to distribute in raw units */
  totalAmount: string;

  /** Airdrop recipients with amounts */
  recipients: AirdropRecipient[];

  /** Campaign start date */
  startDate?: Date;

  /** Campaign end date */
  endDate?: Date;

  /** Claim deadline after which unclaimed tokens return to treasury */
  claimDeadline?: Date;

  /** Require KYC verification before claiming */
  requiresKyc?: boolean;
}

/** Individual airdrop recipient entry */
export interface AirdropRecipient {
  /** Recipient wallet address */
  address: string;

  /** Amount allocated to this recipient in raw units */
  amount: string;

  /** Optional user ID for tracking */
  userId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Options for supply snapshot queries */
export interface SupplySnapshotOptions {
  /** Token mint ID */
  tokenMintId: string;

  /** Date range start */
  fromDate?: Date;

  /** Date range end */
  toDate?: Date;

  /** Maximum number of snapshots to return */
  limit?: number;
}
```

### Core Output Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN RECORDS
// ═══════════════════════════════════════════════════════════════════════════════

/** Token mint definition record */
export interface TokenMint {
  id: string;
  ventureId: string | null;
  symbol: string;
  name: string;
  mintAddress: string;
  chain: SupportedChain;
  decimals: number;
  totalSupply: string;
  circulatingSupply: string;
  maxSupply: string | null;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  isNative: boolean;
  logoUrl: string | null;
  coingeckoId: string | null;
  jupiterVerified: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Associated Token Account record */
export interface TokenAccount {
  id: string;
  walletId: string;
  tokenMintId: string;
  ataAddress: string;
  balance: string;
  isActive: boolean;
  isFrozen: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
}

/** Transfer history entry */
export interface TokenTransfer {
  id: string;
  tokenMintId: string;
  txSignature: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  transferType: string;
  status: 'pending' | 'confirmed' | 'finalized' | 'failed';
  fee: string | null;
  memo: string | null;
  sourceModule: string | null;
  sourceId: string | null;
  createdAt: Date;
}

/** Vesting schedule record */
export interface VestingSchedule {
  id: string;
  ventureId: string;
  tokenMintId: string;
  name: string;
  description: string | null;
  beneficiaryAddress: string;
  beneficiaryUserId: string | null;
  totalAmount: string;
  claimedAmount: string;
  vestingType: 'linear' | 'cliff_linear' | 'milestone' | 'custom';
  startDate: Date;
  endDate: Date;
  cliffDate: Date | null;
  cliffAmount: string | null;
  vestingIntervalDays: number;
  milestones: Array<{ date: string; amount: string; description: string }> | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'paused';
  cancelledAt: Date | null;
  cancelledBy: string | null;
  escrowAddress: string | null;
  onChainAccount: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Supply breakdown (current state) */
export interface SupplyBreakdown {
  tokenMintId: string;
  symbol: string;
  totalSupply: string;
  circulatingSupply: string;
  stakedSupply: string;
  lockedSupply: string;
  burnedSupply: string;
  treasuryHeld: string;
  vestingLocked: string;
  airdropUnclaimed: string;
  priceUsd: number | null;
  marketCapUsd: number | null;
  lastUpdatedAt: Date;
}

/** Batch transfer results */
export interface BatchTransferResult {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    index: number;
    toAddress: string;
    amount: string;
    txSignature: string | null;
    error: string | null;
    status: 'success' | 'failed';
  }>;
  totalTransferred: string;
}

/** Claimable vesting amount */
export interface ClaimableAmount {
  scheduleId: string;
  totalVested: string;
  totalClaimed: string;
  currentlyClaimable: string;
  nextClaimDate: Date | null;
  nextClaimAmount: string | null;
  percentComplete: number;
}

/** Airdrop campaign status summary */
export interface AirdropStatus {
  campaignId: string;
  name: string;
  status: string;
  totalAmount: string;
  claimedAmount: string;
  unclaimedAmount: string;
  recipientCount: number;
  claimedCount: number;
  claimPercentage: number;
  expiresAt: Date | null;
  isExpired: boolean;
}
```

---

## Database Schema

```typescript
import { pgTable, uuid, text, timestamp, integer, numeric, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { ventures } from '../../core/schema';
import { wallets, chainEnum } from '../wallets/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// web3_token_mints — Token Mint Registry
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Central registry of all token mints tracked by the MCV ecosystem. Includes
 * the native EDGE token, liquid staking derivatives (stEDGE), and external
 * tokens the platform interacts with (USDC, SOL, etc.).
 *
 * The `isNative` flag marks tokens created and managed by MCV (EDGE, stEDGE).
 * External tokens (USDC, SOL) are tracked for balance/portfolio reporting.
 */
export const tokenMints = pgTable('web3_token_mints', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  symbol: text('symbol').notNull(),                       // "EDGE", "stEDGE", "USDC"
  name: text('name').notNull(),                           // "EDGE Token"
  mintAddress: text('mint_address').notNull().unique(),   // Solana mint address
  chain: chainEnum('chain').notNull(),
  decimals: integer('decimals').notNull().default(9),     // 9 for Solana SPL tokens
  totalSupply: numeric('total_supply', { precision: 30, scale: 0 }).notNull(),
  circulatingSupply: numeric('circulating_supply', { precision: 30, scale: 0 }).default('0'),
  maxSupply: numeric('max_supply', { precision: 30, scale: 0 }),
  mintAuthority: text('mint_authority'),                  // Address with mint permission
  freezeAuthority: text('freeze_authority'),              // Address with freeze permission
  isNative: boolean('is_native').default(false),          // Is this MCV's own token?
  logoUrl: text('logo_url'),
  coingeckoId: text('coingecko_id'),                      // For price feed
  jupiterVerified: boolean('jupiter_verified').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  symbolIdx: index('web3_token_mints_symbol_idx').on(table.symbol),
  ventureIdx: index('web3_token_mints_venture_idx').on(table.ventureId),
  nativeIdx: index('web3_token_mints_native_idx').on(table.isNative),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_token_accounts — Associated Token Accounts
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tracks Solana Associated Token Accounts (ATAs) for managed wallets.
 * Each wallet+mint pair has exactly one ATA. The ATA address is deterministic
 * (derived from the owner and mint addresses).
 */
export const tokenAccounts = pgTable('web3_token_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  ataAddress: text('ata_address').notNull().unique(),     // Associated Token Account address
  balance: numeric('balance', { precision: 30, scale: 0 }).default('0'),
  isActive: boolean('is_active').default(true),
  isFrozen: boolean('is_frozen').default(false),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  walletMintIdx: uniqueIndex('web3_token_accts_wallet_mint_idx').on(table.walletId, table.tokenMintId),
  walletIdx: index('web3_token_accts_wallet_idx').on(table.walletId),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_token_transfers — Transfer History
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Complete history of all token transfers within the MCV ecosystem. Every
 * mint, burn, reward distribution, vesting claim, and airdrop claim generates
 * a transfer record. The sourceModule/sourceId fields cross-reference the
 * originating subsystem for full traceability.
 */
export const tokenTransfers = pgTable('web3_token_transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  txSignature: text('tx_signature').notNull(),
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  amount: numeric('amount', { precision: 30, scale: 0 }).notNull(),
  transferType: text('transfer_type').notNull(),          // reward | vesting | airdrop | manual | staking | governance
  status: text('status').default('pending'),              // pending | confirmed | finalized | failed
  fee: numeric('fee', { precision: 20, scale: 9 }),
  memo: text('memo'),                                     // SPL Memo program data
  sourceModule: text('source_module'),                    // 'staking', 'governance', 'treasury', etc.
  sourceId: uuid('source_id'),                            // Links to originating record
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  txSigIdx: index('web3_token_transfers_tx_sig_idx').on(table.txSignature),
  mintIdx: index('web3_token_transfers_mint_idx').on(table.tokenMintId),
  typeIdx: index('web3_token_transfers_type_idx').on(table.transferType),
  fromIdx: index('web3_token_transfers_from_idx').on(table.fromAddress),
  toIdx: index('web3_token_transfers_to_idx').on(table.toAddress),
  sourceIdx: index('web3_token_transfers_source_idx').on(table.sourceModule, table.sourceId),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_vesting_schedules — Vesting Schedule Definitions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Defines token vesting schedules for team, investor, advisor, and community
 * allocations. Each schedule specifies a release curve (linear, cliff+linear,
 * or milestone-based) and tracks cumulative claims.
 *
 * On-chain: Vested tokens are held in an escrow PDA until claimed.
 * Off-chain: The vesting engine calculates claimable amounts based on
 * elapsed time and the configured release curve.
 */
export const vestingSchedules = pgTable('web3_vesting_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  name: text('name').notNull(),
  description: text('description'),
  beneficiaryAddress: text('beneficiary_address').notNull(),
  beneficiaryUserId: uuid('beneficiary_user_id'),
  totalAmount: numeric('total_amount', { precision: 30, scale: 0 }).notNull(),
  claimedAmount: numeric('claimed_amount', { precision: 30, scale: 0 }).default('0'),
  vestingType: text('vesting_type').notNull(),            // linear | cliff_linear | milestone | custom
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  cliffDate: timestamp('cliff_date', { withTimezone: true }),
  cliffAmount: numeric('cliff_amount', { precision: 30, scale: 0 }),
  vestingIntervalDays: integer('vesting_interval_days').default(30),
  milestones: jsonb('milestones'),
  status: text('status').default('pending'),              // pending | active | completed | cancelled | paused
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelledBy: uuid('cancelled_by'),
  escrowAddress: text('escrow_address'),                  // PDA holding vested tokens
  onChainAccount: text('on_chain_account'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('web3_vesting_venture_idx').on(table.ventureId),
  beneficiaryIdx: index('web3_vesting_beneficiary_idx').on(table.beneficiaryAddress),
  statusIdx: index('web3_vesting_status_idx').on(table.status),
  userIdx: index('web3_vesting_user_idx').on(table.beneficiaryUserId),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_vesting_claims — Individual Vesting Claims
// ═══════════════════════════════════════════════════════════════════════════════

export const vestingClaims = pgTable('web3_vesting_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  vestingScheduleId: uuid('vesting_schedule_id').notNull().references(() => vestingSchedules.id),
  claimDate: timestamp('claim_date', { withTimezone: true }).notNull(),
  amount: numeric('amount', { precision: 30, scale: 0 }).notNull(),
  txSignature: text('tx_signature'),
  status: text('status').default('pending'),              // pending | claimed | failed
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  scheduleIdx: index('web3_vesting_claims_schedule_idx').on(table.vestingScheduleId),
  statusIdx: index('web3_vesting_claims_status_idx').on(table.status),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_airdrop_campaigns — Airdrop Distribution Campaigns
// ═══════════════════════════════════════════════════════════════════════════════

export const airdropCampaigns = pgTable('web3_airdrop_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  name: text('name').notNull(),
  description: text('description'),
  totalAmount: numeric('total_amount', { precision: 30, scale: 0 }).notNull(),
  claimedAmount: numeric('claimed_amount', { precision: 30, scale: 0 }).default('0'),
  recipientCount: integer('recipient_count').notNull(),
  merkleRoot: text('merkle_root').notNull(),
  merkleTreeUrl: text('merkle_tree_url'),
  status: text('status').default('draft'),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  claimDeadline: timestamp('claim_deadline', { withTimezone: true }),
  requiresKyc: boolean('requires_kyc').default(false),
  onChainProgramId: text('on_chain_program_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('web3_airdrop_campaigns_venture_idx').on(table.ventureId),
  statusIdx: index('web3_airdrop_campaigns_status_idx').on(table.status),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_airdrop_claims — Individual Airdrop Claims
// ═══════════════════════════════════════════════════════════════════════════════

export const airdropClaims = pgTable('web3_airdrop_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => airdropCampaigns.id),
  claimantAddress: text('claimant_address').notNull(),
  claimantUserId: uuid('claimant_user_id'),
  amount: numeric('amount', { precision: 30, scale: 0 }).notNull(),
  merkleProof: jsonb('merkle_proof').notNull(),
  merkleIndex: integer('merkle_index').notNull(),
  status: text('status').default('unclaimed'),            // unclaimed | claimed | expired | ineligible
  txSignature: text('tx_signature'),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  campaignIdx: index('web3_airdrop_claims_campaign_idx').on(table.campaignId),
  addressIdx: index('web3_airdrop_claims_address_idx').on(table.claimantAddress),
  campaignAddressIdx: uniqueIndex('web3_airdrop_claims_unique_idx').on(table.campaignId, table.claimantAddress),
  statusIdx: index('web3_airdrop_claims_status_idx').on(table.status),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_token_allocations — Token Allocation Buckets
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Example EDGE allocation:
 *   Community Rewards: 40%  |  Treasury: 20%  |  Team: 15% (4yr vest, 1yr cliff)
 *   Investors: 10% (2yr vest, 6mo cliff)  |  Ecosystem: 10%  |  Advisors: 5%
 */
export const tokenAllocations = pgTable('web3_token_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  name: text('name').notNull(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 30, scale: 0 }).notNull(),
  distributedAmount: numeric('distributed_amount', { precision: 30, scale: 0 }).default('0'),
  remainingAmount: numeric('remaining_amount', { precision: 30, scale: 0 }),
  vestingScheduleId: uuid('vesting_schedule_id').references(() => vestingSchedules.id),
  walletAddress: text('wallet_address'),
  isLocked: boolean('is_locked').default(true),
  unlockDate: timestamp('unlock_date', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  mintIdx: index('web3_allocations_mint_idx').on(table.tokenMintId),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_token_burns — Token Burn Event Log
// ═══════════════════════════════════════════════════════════════════════════════

export const tokenBurns = pgTable('web3_token_burns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  amount: numeric('amount', { precision: 30, scale: 0 }).notNull(),
  burnType: text('burn_type').notNull(),
  txSignature: text('tx_signature').notNull(),
  burnedBy: uuid('burned_by'),
  reason: text('reason'),
  preBurnSupply: numeric('pre_burn_supply', { precision: 30, scale: 0 }),
  postBurnSupply: numeric('post_burn_supply', { precision: 30, scale: 0 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  mintIdx: index('web3_token_burns_mint_idx').on(table.tokenMintId),
  burnTypeIdx: index('web3_token_burns_type_idx').on(table.burnType),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_token_supply_snapshots — Circulating Supply History
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Periodic snapshots taken every 6 hours. Feeds ACS v2.0 regime detector.
 */
export const tokenSupplySnapshots = pgTable('web3_token_supply_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  totalSupply: numeric('total_supply', { precision: 30, scale: 0 }).notNull(),
  circulatingSupply: numeric('circulating_supply', { precision: 30, scale: 0 }).notNull(),
  stakedSupply: numeric('staked_supply', { precision: 30, scale: 0 }).default('0'),
  lockedSupply: numeric('locked_supply', { precision: 30, scale: 0 }).default('0'),
  burnedSupply: numeric('burned_supply', { precision: 30, scale: 0 }).default('0'),
  treasuryHeld: numeric('treasury_held', { precision: 30, scale: 0 }).default('0'),
  priceUsd: numeric('price_usd', { precision: 20, scale: 10 }),
  marketCapUsd: numeric('market_cap_usd', { precision: 20, scale: 2 }),
  volume24hUsd: numeric('volume_24h_usd', { precision: 20, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  mintDateIdx: index('web3_supply_snapshots_mint_date_idx').on(table.tokenMintId, table.snapshotDate),
}));
```

---

## Core Service Interface

```typescript
export class TokenService {
  constructor(
    private readonly db: DrizzleDB,
    private readonly walletService: WalletService,
    private readonly rpc: SolanaRpcClient,
    private readonly cache: RedisClient,
    private readonly audit: AuditService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // MINT OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Mint new tokens to a destination address.
   *
   * 1. Validates the authority wallet matches the on-chain mintAuthority
   * 2. Builds the SPL mintTo instruction
   * 3. Signs and sends via walletService.signAndSendTransaction
   * 4. Updates circulatingSupply on the tokenMints record
   * 5. Logs audit event
   *
   * @throws W3_MINT_UNAUTHORIZED — signer is not the mint authority
   * @throws W3_INSUFFICIENT_BALANCE — not enough SOL for fees
   */
  async mintTokens(input: MintTokenInput): Promise<{
    txSignature: string;
    newSupply: string;
  }>;

  /**
   * Burn tokens permanently from the supply.
   *
   * 1. Validates the wallet holds sufficient tokens
   * 2. Records pre-burn supply snapshot
   * 3. Executes SPL burn instruction
   * 4. Records post-burn supply and creates TokenBurn record
   * 5. Atomically decrements circulatingSupply in same DB transaction
   *
   * @throws W3_INSUFFICIENT_BALANCE — wallet doesn't hold enough tokens
   */
  async burnTokens(input: BurnTokenInput): Promise<{
    txSignature: string;
    burnEvent: TokenBurn;
  }>;

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSFER OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Transfer tokens from a managed wallet to any address.
   *
   * Automatically creates the destination ATA if it doesn't exist.
   * The ATA creation fee is paid by the sender.
   */
  async transfer(input: TransferTokenInput): Promise<{
    txSignature: string;
    transfer: TokenTransfer;
  }>;

  /**
   * Batch transfer tokens to multiple addresses.
   *
   * Groups up to 10 transfers per Solana transaction (fewer than wallet
   * batch due to ATA creation overhead). Returns partial results.
   */
  async batchTransfer(input: BatchTransferInput): Promise<BatchTransferResult>;

  /**
   * Create an Associated Token Account for a wallet+mint pair.
   *
   * Idempotent — if the ATA already exists, returns the existing address.
   */
  async createAssociatedTokenAccount(
    ownerAddress: string,
    mintAddress: string,
  ): Promise<string>;

  // ═══════════════════════════════════════════════════════════════════════════
  // VESTING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new vesting schedule.
   *
   * Transfers the total vesting amount to an escrow PDA. The escrow
   * holds the tokens until the beneficiary claims them.
   */
  async createVestingSchedule(input: CreateVestingInput): Promise<VestingSchedule>;

  /**
   * Calculate the currently claimable amount for a vesting schedule.
   *
   * Uses the vesting type to determine the release curve:
   * - linear: proportional to elapsed time
   * - cliff_linear: zero before cliff, then proportional
   * - milestone: based on milestone dates
   */
  async getClaimableAmount(scheduleId: string): Promise<ClaimableAmount>;

  /**
   * Claim vested tokens for a schedule.
   *
   * Transfers the claimable amount from escrow PDA to the beneficiary.
   * Updates claimedAmount on the schedule record.
   *
   * @throws W3_VESTING_NOT_CLAIMABLE — no tokens available to claim
   * @throws W3_VESTING_CANCELLED — schedule was cancelled
   */
  async claimVestedTokens(scheduleId: string): Promise<{
    txSignature: string;
    claim: VestingClaim;
  }>;

  /**
   * Cancel an active vesting schedule.
   *
   * Returns unvested tokens to the specified return address (or treasury).
   * Already-claimed tokens are not affected.
   */
  async cancelVesting(input: CancelVestingInput): Promise<VestingSchedule>;

  // ═══════════════════════════════════════════════════════════════════════════
  // AIRDROPS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create an airdrop campaign with Merkle tree distribution.
   *
   * 1. Generates Merkle tree from recipient list
   * 2. Stores tree data in S3
   * 3. Deploys/initializes the on-chain distributor program
   * 4. Creates campaign and individual claim records
   */
  async createAirdropCampaign(input: CreateAirdropInput): Promise<AirdropCampaign>;

  /**
   * Generate (or regenerate) the Merkle tree for a campaign.
   */
  async generateMerkleTree(
    campaignId: string,
    recipients: AirdropRecipient[],
  ): Promise<{ root: string; treeUrl: string }>;

  /**
   * Claim an airdrop allocation.
   *
   * Verifies the Merkle proof against the stored root. The on-chain
   * program performs the same verification, preventing double-claims.
   *
   * @throws W3_AIRDROP_ALREADY_CLAIMED — already claimed
   * @throws W3_AIRDROP_EXPIRED — past claim deadline
   * @throws W3_INVALID_MERKLE_PROOF — proof verification failed
   */
  async claimAirdrop(
    campaignId: string,
    claimantAddress: string,
    proof: string[],
  ): Promise<{ txSignature: string }>;

  /**
   * Get the current status of an airdrop campaign.
   */
  async getAirdropStatus(campaignId: string): Promise<AirdropStatus>;

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPLY TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get the current circulating supply breakdown.
   *
   * Calculates: total - staked - locked(vesting) - burned - treasury = circulating
   */
  async getCirculatingSupply(mintAddress: string): Promise<SupplyBreakdown>;

  /**
   * Take a supply snapshot (called by cron every 6 hours).
   */
  async snapshotSupply(mintAddress: string): Promise<TokenSupplySnapshot>;

  /**
   * Get all token allocation buckets for a mint.
   */
  async getAllocations(mintId: string): Promise<TokenAllocation[]>;
}
```

---

## Vesting Schedule Calculation

```typescript
/**
 * Core vesting calculation logic. Determines how many tokens are vested
 * at any given point in time based on the schedule configuration.
 */
function calculateVestedAmount(schedule: VestingSchedule, asOfDate: Date): bigint {
  const now = asOfDate.getTime();
  const start = schedule.startDate.getTime();
  const end = schedule.endDate.getTime();
  const total = BigInt(schedule.totalAmount);

  // Before start — nothing vested
  if (now < start) return 0n;

  // After end — everything vested
  if (now >= end) return total;

  // Cliff+Linear: zero before cliff, cliff amount at cliff, then linear
  if (schedule.vestingType === 'cliff_linear' && schedule.cliffDate) {
    const cliff = schedule.cliffDate.getTime();
    if (now < cliff) return 0n;

    const cliffAmount = BigInt(schedule.cliffAmount || '0');
    const remainingAfterCliff = total - cliffAmount;
    const elapsedAfterCliff = BigInt(now - cliff);
    const totalAfterCliff = BigInt(end - cliff);

    const linearVested = (remainingAfterCliff * elapsedAfterCliff) / totalAfterCliff;
    return cliffAmount + linearVested;
  }

  // Linear: proportional to elapsed time
  if (schedule.vestingType === 'linear') {
    const elapsed = BigInt(now - start);
    const duration = BigInt(end - start);
    return (total * elapsed) / duration;
  }

  // Milestone: sum of milestones whose dates have passed
  if (schedule.vestingType === 'milestone' && schedule.milestones) {
    let vested = 0n;
    for (const milestone of schedule.milestones) {
      if (new Date(milestone.date).getTime() <= now) {
        vested += BigInt(milestone.amount);
      }
    }
    return vested > total ? total : vested;
  }

  return 0n;
}

/**
 * Calculate the currently claimable amount (vested minus already claimed).
 */
function calculateClaimable(schedule: VestingSchedule, asOfDate: Date): bigint {
  const vested = calculateVestedAmount(schedule, asOfDate);
  const claimed = BigInt(schedule.claimedAmount);
  const claimable = vested - claimed;
  return claimable > 0n ? claimable : 0n;
}
```

### Vesting Schedule Visualization

```
LINEAR VESTING                    CLIFF + LINEAR
─────────────────                 ─────────────────
100% ┤                    ╱       100% ┤                    ╱
     │                  ╱              │                  ╱
 75% ┤                ╱            75% ┤                ╱
     │              ╱                  │              ╱
 50% ┤            ╱                50% ┤            ╱
     │          ╱                      │          ╱
 25% ┤        ╱                    25% ┤    ┌───╱
     │      ╱                          │    │ cliff
  0% ┤─────╱                       0% ┤────┘
     └──────────────────────           └──────────────────────
      Start              End            Start  Cliff       End

MILESTONE VESTING
─────────────────
100% ┤                         ┌──
     │                         │
 75% ┤                   ┌─────┘
     │                   │
 50% ┤            ┌──────┘
     │            │
 25% ┤     ┌──────┘
     │     │
  0% ┤─────┘
     └──────────────────────────
      M1    M2     M3    M4
```

---

## Code Examples

### Example 1: Mint EDGE Tokens for Reward Pool

```typescript
import { tokenService } from '@mcv/web3-core';

// Mint 100,000 EDGE to the rewards wallet (requires mint authority)
const result = await tokenService.mintTokens({
  tokenMintId: 'edge_token_mint_uuid',
  authorityWalletId: 'mint_authority_wallet_uuid',
  destinationAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  amount: '100000000000000',     // 100,000 EDGE (9 decimals)
  reason: 'Q1 2026 staking reward pool refill',
  sourceModule: 'staking',
});

console.log(result);
// {
//   txSignature: '4xYt8KmW3...',
//   newSupply: '1000100000000000000',  // Updated total supply
// }
```

### Example 2: Burn Tokens (Buyback & Burn)

```typescript
import { tokenService } from '@mcv/web3-core';

// Burn tokens from a buyback wallet
const burn = await tokenService.burnTokens({
  tokenMintId: 'edge_token_mint_uuid',
  walletId: 'buyback_wallet_uuid',
  amount: '5000000000000',       // 5,000 EDGE
  burnType: 'buyback_burn',
  reason: 'Monthly buyback and burn — February 2026',
  burnedBy: 'treasury_manager_user_uuid',
});

console.log(burn);
// {
//   txSignature: '3mNp9Qwe...',
//   burnEvent: {
//     id: '...',
//     amount: '5000000000000',
//     burnType: 'buyback_burn',
//     preBurnSupply: '1000100000000000000',
//     postBurnSupply: '1000095000000000000',
//     ...
//   }
// }
```

### Example 3: Batch Transfer Rewards

```typescript
import { tokenService } from '@mcv/web3-core';

// Distribute staking rewards to multiple addresses
const batchResult = await tokenService.batchTransfer({
  tokenMintId: 'edge_token_mint_uuid',
  fromWalletId: 'rewards_wallet_uuid',
  transfers: [
    { toAddress: 'addr1...', amount: '1500000000', memo: 'Staking reward epoch 42' },
    { toAddress: 'addr2...', amount: '2300000000', memo: 'Staking reward epoch 42' },
    { toAddress: 'addr3...', amount: '800000000', memo: 'Staking reward epoch 42' },
    // ... up to hundreds of recipients (batched into 10 per tx)
  ],
  transferType: 'reward',
  sourceModule: 'staking',
});

console.log(batchResult);
// {
//   total: 3,
//   succeeded: 3,
//   failed: 0,
//   results: [...],
//   totalTransferred: '4600000000',
// }
```

### Example 4: Create a Cliff+Linear Vesting Schedule

```typescript
import { tokenService } from '@mcv/web3-core';

// Create team vesting: 1M EDGE, 1-year cliff, 4-year total
const vesting = await tokenService.createVestingSchedule({
  ventureId: 'venture_betedge_uuid',
  tokenMintId: 'edge_token_mint_uuid',
  name: 'CTO Vesting — 4 Year',
  description: 'Core team allocation with 1-year cliff',
  beneficiaryAddress: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
  beneficiaryUserId: 'cto_user_uuid',
  totalAmount: '1000000000000000',    // 1,000,000 EDGE
  vestingType: 'cliff_linear',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2030-01-01'),
  cliffDate: new Date('2027-01-01'),  // 1-year cliff
  cliffAmount: '250000000000000',     // 25% at cliff
  vestingIntervalDays: 30,            // Monthly releases after cliff
});

console.log(vesting.status);     // 'active'
console.log(vesting.escrowAddress); // PDA holding the tokens
```

### Example 5: Claim Vested Tokens

```typescript
import { tokenService } from '@mcv/web3-core';

// Check claimable amount first
const claimable = await tokenService.getClaimableAmount('vesting_schedule_uuid');

console.log(claimable);
// {
//   scheduleId: 'vesting_schedule_uuid',
//   totalVested: '375000000000000',     // 375K EDGE vested so far
//   totalClaimed: '250000000000000',    // 250K already claimed (cliff)
//   currentlyClaimable: '125000000000000', // 125K ready to claim
//   nextClaimDate: '2027-03-01T00:00:00Z',
//   nextClaimAmount: '20833333333333',
//   percentComplete: 37.5,
// }

// Claim the available tokens
if (BigInt(claimable.currentlyClaimable) > 0n) {
  const claim = await tokenService.claimVestedTokens('vesting_schedule_uuid');
  console.log(claim.txSignature); // '5xYk...'
  console.log(claim.claim.amount); // '125000000000000'
}
```

### Example 6: Create an Airdrop Campaign

```typescript
import { tokenService } from '@mcv/web3-core';

// Create a genesis airdrop for 10,000 recipients
const campaign = await tokenService.createAirdropCampaign({
  ventureId: 'venture_betedge_uuid',
  tokenMintId: 'edge_token_mint_uuid',
  name: 'EDGE Genesis Airdrop',
  description: 'Rewarding early community members',
  totalAmount: '50000000000000000',   // 50,000,000 EDGE
  recipients: [
    { address: 'addr1...', amount: '5000000000000', userId: 'user1' },
    { address: 'addr2...', amount: '3000000000000', userId: 'user2' },
    // ... up to 50,000 recipients
  ],
  startDate: new Date('2026-03-01'),
  claimDeadline: new Date('2026-06-01'),
  requiresKyc: false,
});

console.log(campaign.merkleRoot);    // '0xabc123...'
console.log(campaign.recipientCount); // 10000
console.log(campaign.status);         // 'active'
```

### Example 7: Claim Airdrop with Merkle Proof

```typescript
import { tokenService } from '@mcv/web3-core';

// Recipient claims their airdrop allocation
const claim = await tokenService.claimAirdrop(
  'campaign_uuid',
  'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
  [
    '0xabc...', // Merkle proof hash 1
    '0xdef...', // Merkle proof hash 2
    '0x123...', // Merkle proof hash 3
  ]
);

console.log(claim.txSignature); // '9qWr...'

// Check campaign status after claims
const status = await tokenService.getAirdropStatus('campaign_uuid');
console.log(status);
// {
//   claimedCount: 4521,
//   recipientCount: 10000,
//   claimPercentage: 45.21,
//   claimedAmount: '22500000000000000',
//   unclaimedAmount: '27500000000000000',
// }
```

### Example 8: Get Supply Breakdown for ACS

```typescript
import { tokenService } from '@mcv/web3-core';

const supply = await tokenService.getCirculatingSupply('EDGExxxxxxxxxxxxx...');

console.log(supply);
// {
//   symbol: 'EDGE',
//   totalSupply:       '1000000000000000000',   // 1B EDGE
//   circulatingSupply: '350000000000000000',     // 350M circulating
//   stakedSupply:      '200000000000000000',     // 200M staked
//   lockedSupply:      '300000000000000000',     // 300M in vesting
//   burnedSupply:      '5000000000000000',       // 5M burned
//   treasuryHeld:      '145000000000000000',     // 145M in treasury
//   vestingLocked:     '250000000000000000',     // 250M unvested
//   airdropUnclaimed:  '27500000000000000',      // 27.5M unclaimed airdrops
//   priceUsd: 0.15,
//   marketCapUsd: 52500000,                       // $52.5M → "Launch" regime
// }
```

---

## Audit Events

| Event | Severity | Data Captured |
|-------|----------|---------------|
| `web3.token.minted` | warning | tokenMintId, amount, destination, reason, authorityWallet |
| `web3.token.burned` | warning | tokenMintId, amount, burnType, reason, preBurn, postBurn |
| `web3.token.transferred` | info | tokenMintId, from, to, amount, transferType, memo |
| `web3.token.batch_transferred` | info | tokenMintId, total, succeeded, failed, totalAmount |
| `web3.token.ata_created` | info | ownerAddress, mintAddress, ataAddress |
| `web3.vesting.created` | info | scheduleId, beneficiary, totalAmount, vestingType, cliff |
| `web3.vesting.claimed` | info | scheduleId, claimAmount, txSignature, remainingAmount |
| `web3.vesting.cancelled` | warning | scheduleId, reason, cancelledBy, returnedAmount |
| `web3.airdrop.campaign_created` | info | campaignId, name, totalAmount, recipientCount, merkleRoot |
| `web3.airdrop.claimed` | info | campaignId, claimantAddress, amount, txSignature |
| `web3.airdrop.expired` | info | campaignId, unclaimedAmount, unclaimedCount |
| `web3.supply.snapshot` | info | tokenMintId, total, circulating, staked, locked, burned |
| `web3.allocation.updated` | info | allocationId, distributedAmount, remainingAmount |

---

## Error Codes

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `W3_MINT_UNAUTHORIZED` | 403 | Signer wallet is not the mint authority | Use the correct authority wallet |
| `W3_INSUFFICIENT_BALANCE` | 400 | Wallet doesn't hold enough tokens | Check balance before operating |
| `W3_INVALID_MINT` | 404 | Token mint not found in registry | Register the mint first |
| `W3_VESTING_NOT_CLAIMABLE` | 400 | No tokens are currently claimable | Wait for cliff or next vest period |
| `W3_VESTING_CANCELLED` | 400 | Vesting schedule was cancelled | Contact venture admin |
| `W3_VESTING_COMPLETED` | 400 | All tokens already claimed | Schedule is fully vested |
| `W3_VESTING_NOT_STARTED` | 400 | Vesting has not started yet | Wait for start date |
| `W3_AIRDROP_ALREADY_CLAIMED` | 400 | Address already claimed this airdrop | Each address can claim once |
| `W3_AIRDROP_EXPIRED` | 400 | Airdrop claim deadline has passed | Campaign has ended |
| `W3_AIRDROP_NOT_ACTIVE` | 400 | Campaign is not in active status | Campaign may be paused or draft |
| `W3_INVALID_MERKLE_PROOF` | 400 | Merkle proof verification failed | Address not in airdrop list |
| `W3_AIRDROP_KYC_REQUIRED` | 403 | KYC verification required before claim | Complete KYC first |
| `W3_MAX_RECIPIENTS_EXCEEDED` | 400 | Too many airdrop recipients (>50,000) | Split into multiple campaigns |
| `W3_BURN_UNAUTHORIZED` | 403 | Not authorized to burn tokens | Need token owner or authority |
| `W3_TRANSFER_FAILED` | 500 | On-chain transfer failed | Check RPC and accounts |
| `W3_ATA_CREATION_FAILED` | 500 | Failed to create Associated Token Account | Check RPC availability |
| `W3_SUPPLY_SNAPSHOT_FAILED` | 500 | Supply snapshot calculation failed | Check RPC and token accounts |

---

## Security

### Token Operations Security

1. **Mint Authority Validation**: Before every mint operation, the service verifies that the signing wallet's public key matches the `mintAuthority` stored on-chain for the token mint. This is checked both off-chain (database) and on-chain (the SPL token program enforces it). If the authority wallet has been rotated, the database record must be updated first.

2. **Burn Accounting Integrity**: Every burn event records pre-burn and post-burn total supply in the same database transaction that updates the `circulatingSupply` on `tokenMints`. This prevents any inconsistency between the burn log and the supply counter. The on-chain supply is the ultimate source of truth, verified by the periodic snapshot cron.

3. **Vesting Escrow PDAs**: Vested tokens are locked in Program Derived Addresses (PDAs) controlled by the vesting program — not in regular wallet accounts. This means:
   - Tokens cannot be moved without the vesting program's approval
   - The beneficiary can only claim what the program calculates as vested
   - Cancellation returns tokens to a specified address (not arbitrary withdrawal)

4. **Merkle Tree Security**: Airdrop Merkle trees are generated with `keccak256` hashing. The root is stored on-chain in the distributor program. Each claim requires a valid proof that is verified both:
   - Off-chain (in the service, before transaction building)
   - On-chain (in the Solana program, before token transfer)
   Double-claims are prevented by an on-chain bitmap that marks claimed leaf indices.

5. **Transfer Compliance**: All outbound transfers from managed wallets run a compliance check on the destination address via the wallets sub-module's `runComplianceCheck`. Transfers to sanctioned or flagged addresses are rejected with `W3_COMPLIANCE_BLOCKED`.

6. **Supply Manipulation Prevention**: The `mintTokens` function enforces that minting cannot exceed the `maxSupply` if defined. The total supply is cross-verified against the on-chain `getSupply` RPC call during each snapshot.

### Security Checklist

- [ ] Mint authority validated on every mint operation (off-chain + on-chain)
- [ ] Burn accounting atomically updates supply counters
- [ ] Vesting tokens held in program-controlled escrow PDAs
- [ ] Merkle proofs verified both off-chain and on-chain
- [ ] On-chain bitmap prevents airdrop double-claims
- [ ] Compliance checks on all transfer destinations
- [ ] Max supply enforcement on minting operations
- [ ] Supply snapshots cross-verified against on-chain state
- [ ] All mint/burn events audit-logged with full context
- [ ] Batch transfers handle partial failures gracefully
- [ ] Vesting cancellation returns tokens to authorized address only

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @solana/web3.js | ^1.95.x | Solana RPC, transactions, account queries |
| @solana/spl-token | ^0.4.x | SPL token mint, burn, transfer, ATA creation |
| merkletreejs | ^0.4.x | Merkle tree generation for airdrops |
| keccak256 | ^1.x | Hashing for Merkle leaves |
| drizzle-orm | ^0.36.x | Database ORM for schema and queries |
| ioredis | ^5.x | Redis for supply/price caching |

---

## Environment Variables

```bash
# ── EDGE Token ────────────────────────────────────────────────────────────────
EDGE_TOKEN_MINT=                   # EDGE token mint address
EDGE_DECIMALS=9                    # Token decimals (always 9 for Solana SPL)

# ── Supply Tracking ───────────────────────────────────────────────────────────
SUPPLY_SNAPSHOT_INTERVAL_MS=21600000  # 6 hours in milliseconds
COINGECKO_API_KEY=                 # For price feeds
PRICE_CACHE_TTL=60                 # Price cache TTL in seconds

# ── Airdrop ───────────────────────────────────────────────────────────────────
MAX_AIRDROP_RECIPIENTS=50000       # Maximum recipients per campaign
MERKLE_TREE_S3_BUCKET=             # S3 bucket for Merkle tree storage
AIRDROP_PROGRAM_ID=                # On-chain distributor program address

# ── Vesting ───────────────────────────────────────────────────────────────────
VESTING_PROGRAM_ID=                # On-chain vesting program address
DEFAULT_VESTING_INTERVAL_DAYS=30   # Default release frequency
```

---

*@mcv/web3-core/tokens — EDGE Token & SPL Token Operations*
