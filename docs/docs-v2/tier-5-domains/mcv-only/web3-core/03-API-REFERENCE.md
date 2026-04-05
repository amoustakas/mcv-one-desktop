# @mcv/web3-core — API Reference

**Module:** @mcv/web3-core  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** MCV-ONLY (Internal Blockchain Infrastructure)  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Wallets Service](#wallets-service)
3. [Tokens Service](#tokens-service)
4. [Staking Service](#staking-service)
5. [Governance Service](#governance-service)
6. [Bridge Service](#bridge-service)
7. [Contracts Service](#contracts-service)
8. [DeFi Service](#defi-service)
9. [Treasury Service](#treasury-service)
10. [Shared Types](#shared-types)
11. [Schemas & Enums](#schemas--enums)
12. [Events](#events)
13. [Error Codes](#error-codes)
14. [Configuration](#configuration)
15. [Client Hooks & Components](#client-hooks--components)

---

## API Overview

All `@mcv/web3-core` functionality is exposed through **8 service singletons** — one per submodule. Services are imported directly from the package:

```typescript
import {
  walletService,
  tokenService,
  stakingService,
  governanceService,
  bridgeService,
  contractService,
  defiService,
  treasuryService,
} from '@mcv/web3-core';
```

### Conventions

- **All amounts** are in base units (lamports for SOL, smallest divisible unit for tokens). For EDGE with 9 decimals: `1 EDGE = 1_000_000_000` base units.
- **All addresses** are base58-encoded strings for Solana, hex-encoded for EVM chains.
- **All timestamps** are ISO 8601 strings with timezone (`2026-02-09T12:00:00.000Z`).
- **All service methods** return Promises. Errors throw typed `Web3Error` instances with a `code` property matching the error code table.
- **All write operations** go through the BAL (Blockchain Abstraction Layer) and wait for `finalized` commitment by default.
- **Paginated results** use the `PaginatedResult<T>` wrapper with `items`, `total`, `offset`, `limit`.

```typescript
interface PaginatedResult<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}
```

---

## Wallets Service

The `walletService` is the **foundation** of `@mcv/web3-core`. All other submodules depend on it for wallet lookups, transaction signing, and balance queries.

### createManagedWallet

Creates a new KMS-backed managed wallet for a venture.

```typescript
walletService.createManagedWallet(input: CreateWalletInput): Promise<Wallet>
```

**Input:**

```typescript
interface CreateWalletInput {
  ventureId: string;              // UUID of the owning venture
  label: string;                  // Human-readable label (e.g., "BetEdge Treasury")
  description?: string;           // Optional description
  chain: SupportedChain;          // 'solana' | 'ethereum' | 'base' | 'polygon'
  walletType: WalletType;         // 'custodial' | 'multisig'
  purpose: WalletPurpose;         // 'treasury' | 'rewards' | 'operations' | 'staking' | 'user'
  multisigConfig?: {              // Required when walletType = 'multisig'
    threshold: number;
    signers: string[];
    protocol: 'squads' | 'gnosis';
  };
  metadata?: Record<string, unknown>;
}
```

**Returns:** `Wallet` — The created wallet record including `id`, `address`, and `kmsKeyId`.

**Errors:**
- `W3_WALLET_NOT_FOUND` — Invalid venture ID
- `W3_RPC_TIMEOUT` — Failed to derive address on-chain

**Example:**

```typescript
const wallet = await walletService.createManagedWallet({
  ventureId: 'uuid-betedge',
  label: 'BetEdge Rewards Hot Wallet',
  chain: 'solana',
  walletType: 'custodial',
  purpose: 'rewards',
});
// wallet.address → '7xKXt...' (Solana base58)
// wallet.kmsKeyId → 'arn:aws:kms:...'
```

---

### deriveChildWallet

Derives an HD child wallet from a master wallet using the next sequential index.

```typescript
walletService.deriveChildWallet(input: DeriveWalletInput): Promise<{
  wallet: Wallet;
  derivation: WalletDerivation;
}>
```

**Input:**

```typescript
interface DeriveWalletInput {
  masterWalletId: string;         // UUID of the master wallet
  purpose: string;                // Purpose label for the child
  label: string;                  // Human-readable label
  isHardened?: boolean;           // Default: true (recommended)
}
```

**Returns:** Object containing the new child `Wallet` and its `WalletDerivation` record (including `derivationPath` and `childIndex`).

**Behavior:**
- Automatically increments `childIndex` for the master wallet.
- Uses hardened derivation by default for security (`m/44'/501'/0'/N'`).
- The child wallet inherits the master's `ventureId` and `chain`.

---

### createMultisigWallet

Creates a multi-sig wallet using Squads Protocol (Solana) or Gnosis Safe (EVM).

```typescript
walletService.createMultisigWallet(input: CreateMultisigInput): Promise<Wallet>
```

**Input:**

```typescript
interface CreateMultisigInput {
  ventureId: string;
  label: string;
  chain: SupportedChain;
  threshold: number;              // Required signatures (e.g., 3)
  signers: string[];              // Signer addresses (e.g., 5 addresses)
  purpose: WalletPurpose;
}
```

**Behavior:**
- On Solana, creates a Squads v4 multi-sig PDA.
- Validates `threshold <= signers.length`.
- All signers must be valid addresses for the target chain.

---

### initiateWalletLink

Starts the wallet linking flow by generating a challenge nonce for signature verification.

```typescript
walletService.initiateWalletLink(input: LinkWalletInput): Promise<{
  nonce: string;
  message: string;
  expiresAt: Date;
}>
```

**Input:**

```typescript
interface LinkWalletInput {
  userId: string;                 // MCV user ID (from @mcv/identity)
  chain: SupportedChain;
  address: string;                // The external wallet address to link
  provider?: string;              // 'phantom' | 'metamask' | 'solflare' | 'ledger'
}
```

**Returns:**
- `nonce` — Random challenge string
- `message` — Human-readable message for the user to sign: `"MCV Wallet Verification: <nonce>"`
- `expiresAt` — Nonce expiration timestamp (5 minutes from now)

---

### verifyWalletLink

Completes wallet linking by verifying the user's signature against the challenge nonce.

```typescript
walletService.verifyWalletLink(input: VerifyWalletInput): Promise<WalletLink>
```

**Input:**

```typescript
interface VerifyWalletInput {
  userId: string;
  address: string;
  signature: string;              // Base58-encoded Ed25519 signature
  nonce: string;                  // The nonce from initiateWalletLink
}
```

**Behavior:**
1. Validates the nonce hasn't expired (5-minute window).
2. Verifies the Ed25519 signature against the address's public key.
3. Runs compliance check (OFAC, mixer detection) on the address.
4. If cleared, creates the `WalletLink` with `isVerified = true`.

**Errors:**
- `W3_NONCE_EXPIRED` — Nonce has expired, re-initiate
- `W3_INVALID_SIGNATURE` — Signature verification failed
- `W3_COMPLIANCE_BLOCKED` — Address flagged by compliance

---

### unlinkWallet

Removes a wallet link for a user.

```typescript
walletService.unlinkWallet(linkId: string): Promise<void>
```

---

### signTransaction

Signs a pre-built transaction using KMS.

```typescript
walletService.signTransaction(input: SignTransactionInput): Promise<SignatureResult>
```

**Input:**

```typescript
interface SignTransactionInput {
  walletId: string;               // UUID of the managed wallet
  transaction: Buffer;            // Serialized unsigned transaction
  commitment?: ConfirmationLevel; // Default: 'finalized'
}
```

**Returns:**

```typescript
interface SignatureResult {
  signature: string;              // Base58-encoded signature
  signedTransaction: Buffer;      // Serialized signed transaction
}
```

---

### signAndSendTransaction

Signs and immediately sends a transaction, tracking confirmation.

```typescript
walletService.signAndSendTransaction(input: SignTransactionInput): Promise<{
  signature: string;
  status: 'confirmed' | 'finalized';
}>
```

**Behavior:**
1. Simulates the transaction on-chain.
2. If simulation passes, signs via KMS.
3. Sends the signed transaction.
4. Waits for the requested commitment level.
5. Records the transaction in `web3_wallet_transactions`.

**Errors:**
- `W3_TX_SIMULATION_FAILED` — Simulation failed (insufficient balance, bad accounts, etc.)
- `W3_RPC_TIMEOUT` — Transaction not confirmed within timeout (60s)
- `W3_WALLET_FROZEN` — Wallet is frozen

---

### batchSignAndSend

Signs and sends multiple transactions in parallel, grouping instructions for fee efficiency.

```typescript
walletService.batchSignAndSend(inputs: SignTransactionInput[]): Promise<BatchSignResult>
```

**Returns:**

```typescript
interface BatchSignResult {
  results: Array<{
    index: number;
    signature?: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
  successCount: number;
  failureCount: number;
}
```

---

### getBalance

Gets the balance of a specific token (or native SOL) for a wallet.

```typescript
walletService.getBalance(walletId: string, tokenMint?: string): Promise<TokenBalance>
```

**Returns:**

```typescript
interface TokenBalance {
  walletId: string;
  tokenMint: string | null;       // null for native SOL
  symbol: string;
  balance: string;                // Base unit amount as string
  decimals: number;
  uiAmount: string;               // Human-readable amount (e.g., "1234.56")
  valueUsd?: string;
  lastUpdated: Date;
}
```

**Behavior:** Reads from Redis cache (10s TTL) by default. Cache miss triggers an RPC fetch.

---

### getAllBalances

Gets all token balances for a wallet.

```typescript
walletService.getAllBalances(walletId: string): Promise<TokenBalance[]>
```

---

### getTransactionHistory

Gets paginated transaction history for a wallet.

```typescript
walletService.getTransactionHistory(
  walletId: string,
  options?: TxHistoryOptions
): Promise<PaginatedResult<WalletTransaction>>
```

**Options:**

```typescript
interface TxHistoryOptions {
  txType?: string;                // Filter: 'transfer' | 'stake' | 'swap' | etc.
  direction?: 'inbound' | 'outbound' | 'internal';
  status?: string;
  tokenMint?: string;
  startDate?: Date;
  endDate?: Date;
  offset?: number;                // Default: 0
  limit?: number;                 // Default: 50, max: 200
}
```

---

### refreshBalanceCache

Forces an immediate RPC fetch and cache update for a wallet's balances.

```typescript
walletService.refreshBalanceCache(walletId: string): Promise<void>
```

---

### runComplianceCheck

Runs an OFAC/sanctions/mixer compliance check on an address.

```typescript
walletService.runComplianceCheck(address: string): Promise<ComplianceResult>
```

**Returns:**

```typescript
interface ComplianceResult {
  address: string;
  status: 'cleared' | 'flagged' | 'blocked';
  riskScore: number;              // 0-100
  flags: string[];                // e.g., ['ofac_match', 'mixer_interaction']
  checkedAt: Date;
}
```

---

### getWalletsByUser

Gets all linked wallets for a user.

```typescript
walletService.getWalletsByUser(userId: string): Promise<WalletLink[]>
```

---

### rotateKey

Rotates the encryption key for a managed wallet.

```typescript
walletService.rotateKey(walletId: string): Promise<WalletKey>
```

**Behavior:**
1. Generates a new Ed25519 keypair.
2. Encrypts new private key with KMS.
3. Transfers all assets from old address to new address.
4. Updates wallet record with new address.
5. Archives old key version.

---

### getKeyStatus

Gets the key health status for a managed wallet.

```typescript
walletService.getKeyStatus(walletId: string): Promise<KeyStatusReport>
```

**Returns:**

```typescript
interface KeyStatusReport {
  walletId: string;
  keyVersion: number;
  isActive: boolean;
  createdAt: Date;
  ageInDays: number;
  rotationDue: boolean;           // true if age > 90 days
  kmsKeyArn: string;
  lastUsedAt?: Date;
}
```

---

## Tokens Service

### mintTokens

Mints new tokens using the designated mint authority.

```typescript
tokenService.mintTokens(input: MintTokenInput): Promise<{
  txSignature: string;
  newSupply: string;
}>
```

**Input:**

```typescript
interface MintTokenInput {
  mintAddress: string;            // Token mint address
  destinationAddress: string;     // Recipient wallet address
  amount: string;                 // Amount in base units
  signerWalletId: string;        // UUID of the mint authority wallet
  memo?: string;                  // Optional SPL Memo
}
```

**Behavior:**
- Validates the signer wallet is the designated `mintAuthority` for the token.
- Creates the destination's ATA if it doesn't exist.
- Updates `circulatingSupply` on the `tokenMints` record.
- Emits `web3.tokens.minted` event.

**Errors:**
- `W3_MINT_UNAUTHORIZED` — Signer is not the mint authority
- `W3_WALLET_FROZEN` — Signer wallet is frozen

---

### burnTokens

Burns tokens from a wallet, reducing total supply.

```typescript
tokenService.burnTokens(input: BurnTokenInput): Promise<{
  txSignature: string;
  burnEvent: TokenBurn;
}>
```

**Input:**

```typescript
interface BurnTokenInput {
  mintAddress: string;
  sourceAddress: string;          // Wallet to burn from
  amount: string;
  burnType: 'manual' | 'fee_burn' | 'buyback_burn' | 'scheduled';
  signerWalletId: string;
  reason?: string;
}
```

**Returns:** Includes a `TokenBurn` record with `preBurnSupply` and `postBurnSupply` for audit.

---

### transfer

Transfers tokens between wallets.

```typescript
tokenService.transfer(input: TransferTokenInput): Promise<{
  txSignature: string;
  transfer: TokenTransfer;
}>
```

**Input:**

```typescript
interface TransferTokenInput {
  mintAddress: string;
  fromWalletId: string;           // UUID of the sending wallet
  toAddress: string;              // Destination address (any)
  amount: string;
  transferType: 'reward' | 'vesting' | 'airdrop' | 'manual' | 'staking' | 'governance';
  memo?: string;
  sourceModule?: string;          // Originating submodule
  sourceId?: string;              // Originating record UUID
}
```

**Behavior:**
- Runs compliance check on the destination address.
- Creates destination ATA if it doesn't exist (funded by sender).
- Records transfer in `web3_token_transfers`.
- Emits `web3.tokens.transferred` event.

---

### batchTransfer

Transfers tokens to multiple recipients in a single optimized transaction batch.

```typescript
tokenService.batchTransfer(inputs: TransferTokenInput[]): Promise<BatchTransferResult>
```

**Returns:**

```typescript
interface BatchTransferResult {
  successful: number;
  failed: number;
  results: Array<{
    index: number;
    txSignature?: string;
    error?: string;
  }>;
}
```

**Behavior:** Groups transfers into Solana transactions (12-15 per tx), signs and sends in parallel.

---

### createAssociatedTokenAccount

Creates an Associated Token Account for a wallet if it doesn't exist.

```typescript
tokenService.createAssociatedTokenAccount(
  ownerAddress: string,
  mintAddress: string
): Promise<string>  // Returns the ATA address
```

---

### createVestingSchedule

Creates a new token vesting schedule.

```typescript
tokenService.createVestingSchedule(input: CreateVestingInput): Promise<VestingSchedule>
```

**Input:**

```typescript
interface CreateVestingInput {
  ventureId: string;
  tokenMintId: string;
  name: string;                   // "Team Vesting - Year 1"
  description?: string;
  beneficiaryAddress: string;
  beneficiaryUserId?: string;
  totalAmount: string;
  vestingType: 'linear' | 'cliff_linear' | 'milestone' | 'custom';
  startDate: Date;
  endDate: Date;
  cliffDate?: Date;               // Required for cliff_linear
  cliffAmount?: string;           // Tokens released at cliff
  vestingIntervalDays?: number;   // Default: 30
  milestones?: Array<{
    date: string;
    amount: string;
    description: string;
  }>;
}
```

---

### getClaimableAmount

Gets the currently claimable amount for a vesting schedule.

```typescript
tokenService.getClaimableAmount(scheduleId: string): Promise<{
  amount: string;
  nextClaimDate: Date;
}>
```

**Behavior:**
- Returns `'0'` if before cliff date (for cliff-based vesting).
- Calculates proportional amount based on elapsed time for linear vesting.
- Checks milestone dates for milestone vesting.

---

### claimVestedTokens

Claims available vested tokens.

```typescript
tokenService.claimVestedTokens(scheduleId: string): Promise<{
  txSignature: string;
  claim: VestingClaim;
}>
```

**Errors:**
- `W3_VESTING_NOT_CLAIMABLE` — No tokens are claimable yet
- `W3_VESTING_CANCELLED` — Schedule was cancelled

---

### cancelVesting

Cancels a vesting schedule (admin only). Unclaimed tokens return to the venture treasury.

```typescript
tokenService.cancelVesting(scheduleId: string, reason: string): Promise<VestingSchedule>
```

---

### createAirdropCampaign

Creates a new airdrop campaign with Merkle tree verification.

```typescript
tokenService.createAirdropCampaign(input: CreateAirdropInput): Promise<AirdropCampaign>
```

**Input:**

```typescript
interface CreateAirdropInput {
  ventureId: string;
  tokenMintId: string;
  name: string;                   // "EDGE Genesis Airdrop"
  description?: string;
  totalAmount: string;
  startDate?: Date;
  endDate?: Date;
  claimDeadline?: Date;
  requiresKyc?: boolean;
}
```

---

### generateMerkleTree

Generates a Merkle tree from the recipient list and stores the root on-chain.

```typescript
tokenService.generateMerkleTree(
  campaignId: string,
  recipients: AirdropRecipient[]
): Promise<{ root: string; treeUrl: string }>
```

**Input:**

```typescript
interface AirdropRecipient {
  address: string;
  amount: string;
}
```

**Returns:**
- `root` — The Merkle root (hex string)
- `treeUrl` — S3 URL where the full Merkle tree data is stored

---

### claimAirdrop

Claims an airdrop using a Merkle proof.

```typescript
tokenService.claimAirdrop(
  campaignId: string,
  claimantAddress: string,
  proof: string[]
): Promise<{ txSignature: string }>
```

**Errors:**
- `W3_AIRDROP_ALREADY_CLAIMED` — Address has already claimed
- `W3_AIRDROP_EXPIRED` — Claim deadline has passed
- `W3_INVALID_MERKLE_PROOF` — Proof verification failed

---

### getAirdropStatus

Gets the current status of an airdrop campaign.

```typescript
tokenService.getAirdropStatus(campaignId: string): Promise<AirdropStatus>
```

**Returns:**

```typescript
interface AirdropStatus {
  campaignId: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired';
  totalAmount: string;
  claimedAmount: string;
  recipientCount: number;
  claimedCount: number;
  claimPercentage: number;
  startDate?: Date;
  endDate?: Date;
  claimDeadline?: Date;
}
```

---

### getCirculatingSupply

Gets the current supply breakdown for a token.

```typescript
tokenService.getCirculatingSupply(mintAddress: string): Promise<SupplyBreakdown>
```

**Returns:**

```typescript
interface SupplyBreakdown {
  totalSupply: string;
  circulatingSupply: string;
  stakedSupply: string;
  lockedSupply: string;           // Vesting + locked allocations
  burnedSupply: string;
  treasuryHeld: string;
  priceUsd?: string;
  marketCapUsd?: string;
}
```

---

### snapshotSupply

Takes an immediate supply snapshot (normally runs via cron every 6 hours).

```typescript
tokenService.snapshotSupply(mintAddress: string): Promise<TokenSupplySnapshot>
```

---

### getAllocations

Gets all allocation buckets for a token.

```typescript
tokenService.getAllocations(mintId: string): Promise<TokenAllocation[]>
```

---

## Staking Service

### createPool

Creates a new staking pool.

```typescript
stakingService.createPool(input: CreatePoolInput): Promise<StakingPool>
```

**Input:**

```typescript
interface CreatePoolInput {
  ventureId?: string;
  tokenMintId: string;            // Token to stake (EDGE)
  rewardMintId?: string;          // Reward token (default: same as stake token)
  name: string;
  description?: string;
  currentApy: string;             // e.g., "25.0000" = 25%
  minStakeAmount?: string;        // Default: 1 EDGE (1_000_000_000)
  maxStakeAmount?: string;
  maxCapacity?: string;
  cooldownPeriodDays?: number;    // Default: 7
  lockupPeriodDays?: number;      // Default: 0
  compoundingEnabled?: boolean;   // Default: true
  compoundingFrequency?: 'daily' | 'weekly' | 'epoch';
  liquidStakingEnabled?: boolean; // Default: false
}
```

---

### updatePoolApy

Updates the APY for a staking pool (typically called by the ACS).

```typescript
stakingService.updatePoolApy(
  poolId: string,
  newApy: string,
  reason: string
): Promise<StakingPool>
```

**Behavior:**
- Updates the pool's `currentApy`.
- Emits `web3.staking.apy_adjusted` event with old/new APY and reason.
- ACS-driven changes include the current regime in the reason.

---

### pausePool / resumePool

```typescript
stakingService.pausePool(poolId: string, reason: string): Promise<StakingPool>
stakingService.resumePool(poolId: string): Promise<StakingPool>
```

---

### stake

Stakes tokens into a pool.

```typescript
stakingService.stake(input: CreateStakeInput): Promise<{
  stake: Stake;
  txSignature: string;
  liquidTokens?: string;
}>
```

**Input:**

```typescript
interface CreateStakeInput {
  poolId: string;
  stakerWalletId: string;         // UUID of the staking wallet
  amount: string;                 // Amount in base units
}
```

**Behavior:**
1. Validates pool is `active` and not at capacity.
2. Validates amount ≥ `minStakeAmount` and ≤ `maxStakeAmount`.
3. Transfers EDGE from staker wallet to pool vault PDA.
4. Creates `Stake` record.
5. If `liquidStakingEnabled`, mints stEDGE tokens at current exchange rate.
6. Updates pool `totalStaked`.
7. Emits `web3.staking.stake_created` event.

**Errors:**
- `W3_STAKING_POOL_PAUSED` — Pool is paused
- `W3_STAKING_POOL_FULL` — Pool at max capacity
- `W3_INSUFFICIENT_BALANCE` — Not enough EDGE

---

### unstake

Initiates unstaking with cooldown.

```typescript
stakingService.unstake(input: UnstakeInput): Promise<{
  request: UnstakingRequest;
  cooldownEndsAt: Date;
}>
```

**Input:**

```typescript
interface UnstakeInput {
  stakeId: string;
  amount: string;                 // Partial unstake supported
}
```

**Behavior:**
- Validates lockup period has expired (if applicable).
- Creates `UnstakingRequest` with `cooldownEndsAt`.
- Updates stake `status` to `'unstaking'` (if full unstake).
- If liquid staking, burns the proportional stEDGE tokens.
- Tokens earn no rewards during cooldown.

**Errors:**
- `W3_STAKING_LOCKUP_ACTIVE` — Lockup period hasn't expired
- `W3_COOLDOWN_ACTIVE` — Already has an active unstaking request

---

### completeUnstake

Completes an unstaking request after cooldown expires.

```typescript
stakingService.completeUnstake(requestId: string): Promise<{
  txSignature: string;
  amount: string;
}>
```

**Errors:**
- `W3_COOLDOWN_ACTIVE` — Cooldown hasn't ended yet

---

### cancelUnstake

Cancels an active unstaking request, resuming staking.

```typescript
stakingService.cancelUnstake(requestId: string): Promise<Stake>
```

---

### calculatePendingRewards

Calculates pending rewards for a stake position.

```typescript
stakingService.calculatePendingRewards(stakeId: string): Promise<{
  amount: string;
  nextDistribution: Date;
}>
```

---

### claimRewards

Claims accumulated staking rewards.

```typescript
stakingService.claimRewards(input: ClaimRewardsInput): Promise<{
  txSignature: string;
  claimed: string;
}>
```

**Input:**

```typescript
interface ClaimRewardsInput {
  stakeId: string;
  claimAll?: boolean;             // Default: true
  amount?: string;                // Partial claim (if claimAll = false)
}
```

---

### compoundRewards

Compounds pending rewards back into the stake.

```typescript
stakingService.compoundRewards(stakeId: string): Promise<{
  newStakeAmount: string;
  compoundedReward: string;
}>
```

---

### distributeEpochRewards

Processes batch reward distribution for all stakers in a pool for a given epoch.

```typescript
stakingService.distributeEpochRewards(
  poolId: string,
  epochNumber: number
): Promise<RewardDistribution>
```

**Behavior:**
- Calculates rewards for each active stake based on APY and duration.
- Creates individual `StakingReward` records.
- Batches token transfers (8-10 per transaction).
- Updates `totalRewardsDistributed` on the pool.

---

### delegateToValidator

Delegates SOL to a Solana validator.

```typescript
stakingService.delegateToValidator(input: DelegateStakeInput): Promise<ValidatorDelegation>
```

**Input:**

```typescript
interface DelegateStakeInput {
  poolId?: string;
  validatorAddress: string;
  amount: string;
  walletId: string;
}
```

---

### mintLiquidStakingTokens

Mints stEDGE tokens for an existing stake position.

```typescript
stakingService.mintLiquidStakingTokens(stakeId: string): Promise<{
  lstAmount: string;
  exchangeRate: string;
}>
```

**Behavior:**
- Mints stEDGE at the current exchange rate (e.g., if rate is 1.05, 1000 EDGE → 952.38 stEDGE).
- stEDGE can be used in DeFi while the underlying EDGE continues earning.

---

### redeemLiquidStakingTokens

Redeems stEDGE back to EDGE (initiates unstaking cooldown).

```typescript
stakingService.redeemLiquidStakingTokens(amount: string): Promise<UnstakingRequest>
```

---

### getExchangeRate

Gets the current stEDGE/EDGE exchange rate.

```typescript
stakingService.getExchangeRate(poolId: string): Promise<{
  rate: string;
  updatedAt: Date;
}>
```

---

### getPoolStats

Gets comprehensive statistics for a staking pool.

```typescript
stakingService.getPoolStats(poolId: string): Promise<PoolStats>
```

**Returns:**

```typescript
interface PoolStats {
  poolId: string;
  name: string;
  status: string;
  currentApy: string;
  totalStaked: string;
  totalRewardsDistributed: string;
  stakerCount: number;
  utilizationPercent: number;     // (totalStaked / maxCapacity) * 100
  avgStakeAmount: string;
  lastRewardDistribution: Date;
  exchangeRate?: string;          // stEDGE/EDGE rate (if liquid staking)
}
```

---

### getStakingHistory

Gets full staking history for an address.

```typescript
stakingService.getStakingHistory(stakerAddress: string): Promise<StakingHistory>
```

---

### getEpochSummary

Gets epoch-level summary for a pool.

```typescript
stakingService.getEpochSummary(
  poolId: string,
  epochNumber: number
): Promise<StakingEpoch>
```

---

## Governance Service

### createProposal

Creates a new governance proposal.

```typescript
governanceService.createProposal(input: CreateProposalInput): Promise<Proposal>
```

**Input:**

```typescript
interface CreateProposalInput {
  governanceConfigId: string;
  title: string;
  description: string;            // Markdown supported
  proposerAddress: string;
  proposerUserId?: string;
  category: 'treasury' | 'parameter' | 'upgrade' | 'grant' | 'other';
  executionPayload?: {
    type: 'treasury_transfer' | 'parameter_change' | 'program_upgrade' | 'grant';
    params: Record<string, unknown>;
  };
  discussionUrl?: string;
}
```

**Behavior:**
1. Validates proposer holds ≥ `proposalThreshold` tokens.
2. Takes a governance snapshot at the current slot.
3. Creates the proposal in `draft` status.
4. Stores proposal content on IPFS and records the hash.

**Errors:**
- `W3_PROPOSAL_THRESHOLD` — Insufficient tokens to create a proposal

---

### activateProposal

Activates a draft proposal, starting the voting period.

```typescript
governanceService.activateProposal(proposalId: string): Promise<Proposal>
```

**Behavior:**
- Sets `status = 'active'`.
- Sets `votingStartsAt` to now.
- Sets `votingEndsAt` to now + `votingPeriodHours`.
- Sets `snapshotSlot` to the current finalized slot.

---

### cancelProposal

Cancels a proposal (proposer or admin only).

```typescript
governanceService.cancelProposal(proposalId: string, reason: string): Promise<Proposal>
```

---

### castVote

Casts a vote on an active proposal.

```typescript
governanceService.castVote(input: CastVoteInput): Promise<Vote>
```

**Input:**

```typescript
interface CastVoteInput {
  proposalId: string;
  voterAddress: string;
  voterUserId?: string;
  voteType: 'for' | 'against' | 'abstain';
  reason?: string;                // Optional vote rationale
}
```

**Behavior:**
1. Validates voting period is active.
2. Looks up voting power at the proposal's `snapshotSlot`.
3. Includes any delegated voting power.
4. Records vote and updates proposal tallies atomically.
5. Emits `web3.governance.vote_cast` event.

**Errors:**
- `W3_VOTING_ENDED` — Voting period has ended
- `W3_INSUFFICIENT_BALANCE` — No voting power at snapshot slot

---

### getVotingPower

Gets voting power for an address at a specific snapshot slot.

```typescript
governanceService.getVotingPower(
  address: string,
  snapshotSlot: number
): Promise<{
  power: string;
  delegatedPower: string;
}>
```

---

### getProposalResults

Gets detailed voting results for a proposal.

```typescript
governanceService.getProposalResults(proposalId: string): Promise<ProposalResults>
```

**Returns:**

```typescript
interface ProposalResults {
  proposalId: string;
  status: ProposalStatus;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  totalVoters: number;
  quorumRequired: string;
  quorumReached: boolean;
  passThreshold: number;          // e.g., 50 = simple majority
  isPassing: boolean;
  votingEndsAt: Date;
  executionEta?: Date;
}
```

---

### delegateVotingPower

Delegates voting power to another address.

```typescript
governanceService.delegateVotingPower(input: DelegateVotingInput): Promise<VotingDelegation>
```

**Input:**

```typescript
interface DelegateVotingInput {
  governanceConfigId: string;
  delegatorAddress: string;
  delegateAddress: string;
}
```

**Behavior:**
- Single-level only — the delegate cannot re-delegate received power.
- Revokes any existing delegation from the delegator.
- Takes effect on the next proposal's snapshot.

---

### revokeDelegation

Revokes an active voting delegation.

```typescript
governanceService.revokeDelegation(delegationId: string): Promise<VotingDelegation>
```

---

### getDelegations

Gets delegation info for an address (both delegated-to and received-from).

```typescript
governanceService.getDelegations(address: string): Promise<{
  delegatedTo: VotingDelegation[];
  receivedFrom: VotingDelegation[];
}>
```

---

### queueForExecution

Queues a passed proposal for timelock execution.

```typescript
governanceService.queueForExecution(proposalId: string): Promise<TimelockEntry>
```

**Behavior:**
- Validates proposal status is `passed`.
- Sets `eta` to now + `timelockDelayHours`.
- Sets `expiresAt` to `eta` + `executionWindowHours`.

---

### executeProposal

Executes a proposal after the timelock delay.

```typescript
governanceService.executeProposal(input: ExecuteProposalInput): Promise<{
  txSignature: string;
  result: any;
}>
```

**Input:**

```typescript
interface ExecuteProposalInput {
  proposalId: string;
  executorAddress: string;        // Anyone can execute once timelock expires
}
```

**Behavior:**
1. Validates timelock has expired but execution window hasn't.
2. Executes the proposal's `executionPayload`:
   - `treasury_transfer` → Calls `treasuryService.executeSpending`
   - `parameter_change` → Updates ACS controller parameter
   - `program_upgrade` → Calls `contractService.upgradeProgram`
   - `grant` → Creates a token transfer
3. Updates proposal status to `executed`.
4. Emits `web3.governance.proposal_executed` event.

**Errors:**
- `W3_TIMELOCK_NOT_READY` — Timelock period hasn't elapsed
- `W3_VOTING_ENDED` — Execution window expired

---

### vetoProposal

Vetoes a proposal (veto authority only).

```typescript
governanceService.vetoProposal(proposalId: string, reason: string): Promise<Proposal>
```

---

### takeSnapshot

Takes a governance snapshot of token balances at the current slot.

```typescript
governanceService.takeSnapshot(governanceConfigId: string): Promise<GovernanceSnapshot>
```

---

### updateGovernanceConfig

Updates governance configuration parameters.

```typescript
governanceService.updateGovernanceConfig(
  configId: string,
  updates: Partial<GovernanceConfig>
): Promise<GovernanceConfig>
```

---

## Bridge Service

### initiateBridge

Starts a cross-chain token transfer.

```typescript
bridgeService.initiateBridge(input: InitiateBridgeInput): Promise<{
  transaction: BridgeTransaction;
  sourceTxSignature: string;
}>
```

**Input:**

```typescript
interface InitiateBridgeInput {
  ventureId?: string;
  protocol?: BridgeProtocol;      // Auto-selected if omitted
  sourceChain: SupportedChain;
  destinationChain: SupportedChain;
  senderWalletId: string;
  recipientAddress: string;
  tokenMint: string;
  amount: string;
}
```

**Behavior:**
1. Validates the route is supported.
2. Runs compliance check on recipient address.
3. Selects optimal protocol (if not specified).
4. Estimates bridge fee and confirms.
5. Locks tokens on source chain.
6. Creates `BridgeTransaction` in `pending` status.
7. Starts monitoring for attestation.

**Errors:**
- `W3_BRIDGE_UNSUPPORTED_ROUTE` — No bridge route for chain pair
- `W3_COMPLIANCE_BLOCKED` — Recipient address flagged
- `W3_INSUFFICIENT_BALANCE` — Not enough tokens + fee

---

### claimBridged

Claims bridged assets on the destination chain.

```typescript
bridgeService.claimBridged(input: ClaimBridgedInput): Promise<{
  destinationTxSignature: string;
}>
```

**Input:**

```typescript
interface ClaimBridgedInput {
  transactionId: string;
  claimerAddress: string;
}
```

---

### cancelBridge

Cancels a pending bridge (if attestation hasn't been produced yet).

```typescript
bridgeService.cancelBridge(transactionId: string): Promise<BridgeTransaction>
```

---

### getBridgeStatus

Gets the current status of a bridge transaction.

```typescript
bridgeService.getBridgeStatus(transactionId: string): Promise<BridgeTransaction>
```

---

### monitorPendingBridges

Gets all bridges currently in `pending` or `in_transit` status.

```typescript
bridgeService.monitorPendingBridges(): Promise<BridgeTransaction[]>
```

---

### retryFailedBridge

Retries a failed bridge transaction.

```typescript
bridgeService.retryFailedBridge(transactionId: string): Promise<BridgeTransaction>
```

---

### getBridgedAssets

Gets the wrapped asset registry for a chain.

```typescript
bridgeService.getBridgedAssets(chain: SupportedChain): Promise<BridgedAsset[]>
```

---

### getWrappedEquivalent

Finds the wrapped equivalent of a token on another chain.

```typescript
bridgeService.getWrappedEquivalent(
  originalMint: string,
  targetChain: SupportedChain
): Promise<BridgedAsset | null>
```

---

### getAvailableRoutes

Gets available bridge routes between two chains.

```typescript
bridgeService.getAvailableRoutes(
  sourceChain: SupportedChain,
  destinationChain: SupportedChain
): Promise<BridgeConfiguration[]>
```

---

### estimateBridgeFee

Estimates the fee for a bridge transfer.

```typescript
bridgeService.estimateBridgeFee(input: InitiateBridgeInput): Promise<{
  fee: string;
  estimatedTime: number;          // Minutes
}>
```

---

## Contracts Service

### deployProgram

Deploys a new Solana program.

```typescript
contractService.deployProgram(input: DeployProgramInput): Promise<{
  deployment: ProgramDeployment;
  program: DeployedProgram;
}>
```

**Input:**

```typescript
interface DeployProgramInput {
  ventureId?: string;
  name: string;
  description?: string;
  framework: 'anchor' | 'native' | 'seahorse';
  cluster: 'mainnet-beta' | 'devnet' | 'testnet';
  binaryPath: string;             // S3 path to compiled program binary
  binaryHash: string;             // SHA-256 hash of the binary
  upgradeAuthorityWalletId: string;
  isMultisigUpgrade?: boolean;    // Default: true for mainnet
  idlJson?: object;               // Anchor IDL (optional)
  initiatedBy: string;            // User UUID
}
```

**Behavior:**
1. For mainnet: Requires multi-sig approval before deployment.
2. Uploads binary to buffer account.
3. Deploys program from buffer.
4. Runs binary verification (hash comparison).
5. Records in program registry.

---

### upgradeProgram

Upgrades an existing program to a new version.

```typescript
contractService.upgradeProgram(input: UpgradeProgramInput): Promise<{
  deployment: ProgramDeployment;
  version: ProgramVersion;
}>
```

**Input:**

```typescript
interface UpgradeProgramInput {
  programId: string;              // UUID from registry
  newBinaryPath: string;
  newBinaryHash: string;
  newVersion: string;             // Semver string (e.g., "1.2.0")
  changelog?: string;
  idlJson?: object;
  initiatedBy: string;
}
```

---

### rollbackProgram

Rolls back a program to a previous version.

```typescript
contractService.rollbackProgram(
  programId: string,
  targetVersion: string
): Promise<ProgramDeployment>
```

**Behavior:**
- Fetches the binary for the target version from S3.
- Deploys it through the same pipeline (with verification).
- Keeps the last 5 versions for rollback capability.

---

### uploadIdl

Uploads an Anchor IDL for a program version.

```typescript
contractService.uploadIdl(programId: string, idlJson: object): Promise<ProgramIdl>
```

---

### getActiveIdl

Gets the active IDL for a program.

```typescript
contractService.getActiveIdl(programId: string): Promise<ProgramIdl>
```

---

### fetchIdlFromChain

Fetches an IDL stored on-chain by an Anchor program.

```typescript
contractService.fetchIdlFromChain(programAddress: string): Promise<object>
```

---

### transferUpgradeAuthority

Transfers the upgrade authority for a program.

```typescript
contractService.transferUpgradeAuthority(
  programId: string,
  newAuthority: string
): Promise<ProgramAuthority>
```

---

### setMultisigAuthority

Sets a multi-sig upgrade authority for a program.

```typescript
contractService.setMultisigAuthority(
  programId: string,
  signers: string[],
  threshold: number
): Promise<ProgramAuthority>
```

---

### revokeAuthority

Revokes an authority from a program (makes it immutable if upgrade authority).

```typescript
contractService.revokeAuthority(
  programId: string,
  authorityType: 'upgrade' | 'freeze' | 'close'
): Promise<void>
```

---

### invokeProgram

Executes a cross-program invocation.

```typescript
contractService.invokeProgram(input: InvokeProgramInput): Promise<{
  txSignature: string;
  result: any;
}>
```

**Input:**

```typescript
interface InvokeProgramInput {
  programAddress: string;
  instruction: string;            // Instruction name (from IDL)
  accounts: Record<string, string>; // Account name → address mapping
  args: any[];                    // Instruction arguments
  signerWalletId: string;
}
```

---

### listPrograms

Lists all deployed programs with optional filters.

```typescript
contractService.listPrograms(options?: ListProgramsOptions): Promise<DeployedProgram[]>
```

---

### getProgram

Gets a program with its versions and authorities.

```typescript
contractService.getProgram(programId: string): Promise<
  DeployedProgram & {
    versions: ProgramVersion[];
    authorities: ProgramAuthority[];
  }
>
```

---

### verifyDeployment

Verifies a deployed program's binary matches the expected hash.

```typescript
contractService.verifyDeployment(programId: string): Promise<VerificationResult>
```

**Returns:**

```typescript
interface VerificationResult {
  programId: string;
  expectedHash: string;
  onChainHash: string;
  verified: boolean;
  verifiedAt: Date;
}
```

---

## DeFi Service

### addLiquidity

Adds liquidity to a DEX pool.

```typescript
defiService.addLiquidity(input: AddLiquidityInput): Promise<{
  position: LiquidityPosition;
  txSignature: string;
}>
```

**Input:**

```typescript
interface AddLiquidityInput {
  ventureId?: string;
  poolAddress: string;
  walletId: string;
  tokenAAmount: string;
  tokenBAmount: string;
  lowerTick?: number;             // For concentrated liquidity (CLMM)
  upperTick?: number;             // For concentrated liquidity (CLMM)
  slippageBps?: number;           // Default: 50 (0.5%)
}
```

---

### removeLiquidity

Removes liquidity from a position.

```typescript
defiService.removeLiquidity(input: RemoveLiquidityInput): Promise<{
  tokenAReceived: string;
  tokenBReceived: string;
  txSignature: string;
}>
```

**Input:**

```typescript
interface RemoveLiquidityInput {
  positionId: string;
  percentage: number;             // 1-100 (100 = full withdrawal)
  slippageBps?: number;
}
```

---

### adjustRange

Adjusts the tick range of a concentrated liquidity position.

```typescript
defiService.adjustRange(
  positionId: string,
  newLower: number,
  newUpper: number
): Promise<LiquidityPosition>
```

---

### collectFees

Collects accumulated trading fees from an LP position.

```typescript
defiService.collectFees(positionId: string): Promise<{
  feesA: string;
  feesB: string;
  txSignature: string;
}>
```

---

### getSwapQuote

Gets a swap quote from Jupiter.

```typescript
defiService.getSwapQuote(input: SwapQuoteInput): Promise<SwapQuote>
```

**Input:**

```typescript
interface SwapQuoteInput {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;           // Default: 50
}
```

**Returns:**

```typescript
interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  outputAmount: string;
  priceImpact: string;
  route: SwapRoute;
  fee: string;
  slippageBps: number;
  expiresAt: Date;                // Quote valid for ~30 seconds
}
```

---

### executeSwap

Executes a token swap via Jupiter.

```typescript
defiService.executeSwap(input: SwapTokenInput): Promise<{
  swap: SwapTransaction;
  txSignature: string;
}>
```

**Input:**

```typescript
interface SwapTokenInput {
  walletId: string;
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  minOutputAmount?: string;       // Calculated from slippage if not provided
  slippageBps?: number;
}
```

---

### getBestRoute

Gets the best swap route from Jupiter.

```typescript
defiService.getBestRoute(
  inputMint: string,
  outputMint: string,
  amount: string
): Promise<SwapRoute>
```

**Returns:**

```typescript
interface SwapRoute {
  hops: Array<{
    dex: string;
    inputMint: string;
    outputMint: string;
    pool: string;
    amountIn: string;
    amountOut: string;
  }>;
  totalPriceImpact: string;
  totalFee: string;
}
```

---

### enterFarm

Enters a yield farming position.

```typescript
defiService.enterFarm(input: CreateFarmPositionInput): Promise<YieldFarmPosition>
```

**Input:**

```typescript
interface CreateFarmPositionInput {
  ventureId?: string;
  strategyId?: string;
  poolAddress: string;
  farmAddress: string;
  walletId: string;
  lpTokenAmount: string;
}
```

---

### exitFarm

Exits a yield farming position, harvesting final rewards.

```typescript
defiService.exitFarm(positionId: string): Promise<{
  rewards: Record<string, string>;
  txSignature: string;
}>
```

---

### harvestRewards

Harvests pending farm rewards without exiting the position.

```typescript
defiService.harvestRewards(positionId: string): Promise<{
  rewards: Record<string, string>;
  txSignature: string;
}>
```

---

### compoundFarmRewards

Harvests rewards and reinvests them into the farm.

```typescript
defiService.compoundFarmRewards(positionId: string): Promise<YieldFarmPosition>
```

---

### createStrategy

Creates an automated yield strategy.

```typescript
defiService.createStrategy(input: CreateStrategyInput): Promise<YieldStrategy>
```

**Input:**

```typescript
interface CreateStrategyInput {
  ventureId?: string;
  name: string;
  description?: string;
  dex: DexProtocol;
  poolAddress: string;
  farmAddress?: string;
  strategyType: 'lp_farm' | 'single_stake' | 'leveraged' | 'auto_compound';
  riskLevel: 'low' | 'medium' | 'high';
  targetApr?: string;
  maxAllocationUsd?: string;
  autoCompound?: boolean;
  autoCompoundFrequency?: 'hourly' | 'daily' | 'weekly';
  rebalanceThreshold?: string;
}
```

---

### getImpermanentLossData

Gets impermanent loss history for a position.

```typescript
defiService.getImpermanentLossData(positionId: string): Promise<ImpermanentLossData[]>
```

---

### getPortfolioSummary

Gets a venture's full DeFi portfolio summary.

```typescript
defiService.getPortfolioSummary(ventureId: string): Promise<DeFiPortfolioSummary>
```

**Returns:**

```typescript
interface DeFiPortfolioSummary {
  ventureId: string;
  totalLpValueUsd: string;
  totalFarmValueUsd: string;
  totalPendingRewardsUsd: string;
  totalImpermanentLossUsd: string;
  netPnlUsd: string;
  positions: LiquidityPosition[];
  farms: YieldFarmPosition[];
  strategies: YieldStrategy[];
}
```

---

### getPoolMetrics

Gets metrics for a specific liquidity pool.

```typescript
defiService.getPoolMetrics(poolAddress: string): Promise<PoolMetrics>
```

**Returns:**

```typescript
interface PoolMetrics {
  poolAddress: string;
  dex: string;
  tokenASymbol: string;
  tokenBSymbol: string;
  tvlUsd: string;
  volume24hUsd: string;
  apr: string;
  feeTier: string;
  priceRatio: string;
}
```

---

### snapshotPositions

Takes a snapshot of all DeFi positions for a venture.

```typescript
defiService.snapshotPositions(ventureId: string): Promise<DefiSnapshot>
```

---

## Treasury Service

### createVault

Creates a new multi-sig treasury vault.

```typescript
treasuryService.createVault(input: CreateVaultInput): Promise<TreasuryVault>
```

**Input:**

```typescript
interface CreateVaultInput {
  ventureId: string;
  name: string;
  chain: SupportedChain;
  protocol: 'squads' | 'gnosis';
  threshold: number;
  signers: Array<{
    address: string;
    label: string;
    userId?: string;
  }>;
  spendingLimitDaily?: string;    // USD
  spendingLimitMonthly?: string;  // USD
  hitlThreshold?: string;         // USD, default: '10000'
}
```

---

### addSigner / removeSigner

```typescript
treasuryService.addSigner(vaultId: string, signer: AddSignerInput): Promise<TreasurySigner>
treasuryService.removeSigner(vaultId: string, signerId: string): Promise<void>
```

---

### updateThreshold

Updates the multi-sig threshold for a vault.

```typescript
treasuryService.updateThreshold(vaultId: string, newThreshold: number): Promise<TreasuryVault>
```

---

### createSpendingProposal

Creates a treasury spending proposal.

```typescript
treasuryService.createSpendingProposal(
  input: CreateSpendingProposalInput
): Promise<SpendingProposal>
```

**Input:**

```typescript
interface CreateSpendingProposalInput {
  vaultId: string;
  title: string;
  description: string;
  proposerUserId: string;
  recipientAddress: string;
  tokenMint: string;
  amount: string;
  category: 'operations' | 'grants' | 'payroll' | 'marketing' | 'development';
}
```

**Behavior:**
1. Validates spending against vault policies (daily/monthly limits).
2. Calculates USD equivalent.
3. Sets `hitlRequired = true` if amount > vault's `hitlThreshold`.
4. Sets `approvalsRequired` based on vault `threshold`.
5. Emits `web3.treasury.proposal_created` event.

---

### approveSpending

Approves a spending proposal (multi-sig signer).

```typescript
treasuryService.approveSpending(input: ApproveSpendingInput): Promise<SpendingApproval>
```

**Input:**

```typescript
interface ApproveSpendingInput {
  proposalId: string;
  signerId: string;               // UUID of the treasury signer
  approved: boolean;              // true = approve, false = reject
  reason?: string;
}
```

**Behavior:**
- Records the approval/rejection.
- Increments `approvalsReceived` if approved.
- If threshold met and no HITL required: proposal status → `approved`.
- If threshold met and HITL required: emits `web3.treasury.hitl_required` event.

---

### rejectSpending

Rejects a spending proposal.

```typescript
treasuryService.rejectSpending(proposalId: string, reason: string): Promise<SpendingProposal>
```

---

### executeSpending

Executes an approved spending proposal.

```typescript
treasuryService.executeSpending(input: ExecuteSpendingInput): Promise<{
  txSignature: string;
  transaction: TreasuryTransaction;
}>
```

**Input:**

```typescript
interface ExecuteSpendingInput {
  proposalId: string;
  executorUserId: string;
}
```

**Behavior:**
1. Validates proposal is `approved` and not expired.
2. If HITL required, validates HITL approval exists.
3. Executes the multi-sig transaction via Squads.
4. Records `TreasuryTransaction`.
5. Updates vault positions.
6. Creates reconciliation entry.
7. Emits `web3.treasury.spending_executed` event.

**Errors:**
- `W3_TREASURY_HITL_REQUIRED` — HITL approval not yet received
- `W3_TREASURY_PROPOSAL_EXPIRED` — Proposal expired (>7 days)
- `W3_TREASURY_LIMIT_EXCEEDED` — Would exceed spending policy limits

---

### getPositions

Gets all current asset positions for a vault.

```typescript
treasuryService.getPositions(vaultId: string): Promise<TreasuryPosition[]>
```

---

### syncPositions

Syncs on-chain balances with the database.

```typescript
treasuryService.syncPositions(vaultId: string): Promise<TreasuryPosition[]>
```

---

### diversify

Executes a treasury diversification operation (swaps between assets).

```typescript
treasuryService.diversify(input: DiversifyInput): Promise<TreasuryTransaction[]>
```

**Input:**

```typescript
interface DiversifyInput {
  vaultId: string;
  operations: Array<{
    fromTokenMint: string;
    toTokenMint: string;
    amount: string;
    maxSlippageBps?: number;
  }>;
  executorUserId: string;
}
```

---

### snapshotNAV

Takes an NAV (Net Asset Value) snapshot.

```typescript
treasuryService.snapshotNAV(vaultId: string): Promise<TreasurySnapshot>
```

---

### getHistoricalNAV

Gets historical NAV snapshots for a vault.

```typescript
treasuryService.getHistoricalNAV(
  vaultId: string,
  startDate: Date,
  endDate: Date
): Promise<TreasurySnapshot[]>
```

---

### reconcile

Compares on-chain and off-chain balances for a vault.

```typescript
treasuryService.reconcile(vaultId: string): Promise<TreasuryReconciliation>
```

**Returns:**

```typescript
interface TreasuryReconciliation {
  vaultId: string;
  reconciliationDate: Date;
  onChainValueUsd: string;
  offChainValueUsd: string;
  discrepancyUsd: string;
  discrepancyPercentage: string;
  status: 'matched' | 'discrepancy' | 'resolved';
}
```

**Behavior:** Discrepancies > 0.1% trigger `web3.treasury.reconciliation_discrepancy` alert.

---

### createPolicy

Creates a treasury spending policy.

```typescript
treasuryService.createPolicy(input: CreatePolicyInput): Promise<TreasuryPolicy>
```

**Input:**

```typescript
interface CreatePolicyInput {
  vaultId: string;
  name: string;
  policyType: 'spending_limit' | 'whitelist' | 'blacklist' | 'diversification';
  rules: Record<string, unknown>;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
}
```

**Example rules:**

```typescript
// Spending limit policy
{
  dailyLimit: 50000,
  monthlyLimit: 200000,
  requiresHitl: true,
  hitlThreshold: 10000,
  exemptCategories: ['payroll']
}

// Whitelist policy
{
  allowedRecipients: ['addr1', 'addr2', 'addr3'],
  allowedTokens: ['EDGE', 'USDC', 'SOL']
}
```

---

### validateSpending

Validates a spending proposal against all active policies.

```typescript
treasuryService.validateSpending(proposalId: string): Promise<{
  valid: boolean;
  violations: string[];
}>
```

---

## Shared Types

### Chain & Network Types

```typescript
type SupportedChain = 'solana' | 'ethereum' | 'base' | 'polygon' | 'arbitrum';

interface ChainConfig {
  chain: SupportedChain;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { symbol: string; decimals: number };
  isTestnet: boolean;
}

type NetworkEnvironment = 'mainnet' | 'devnet' | 'testnet';
type ConfirmationLevel = 'processed' | 'confirmed' | 'finalized';
```

### Wallet Types

```typescript
type WalletType = 'custodial' | 'non_custodial' | 'multisig';
type WalletStatus = 'active' | 'frozen' | 'archived';
type WalletPurpose = 'treasury' | 'rewards' | 'operations' | 'staking' | 'user';

interface KeyMaterial {
  encryptedPrivateKey: string;    // KMS ciphertext (NEVER plaintext)
  kmsKeyArn: string;
  publicKey: string;
  keyVersion: number;
}

interface DerivationPath {
  masterWalletId: string;
  childWalletId: string;
  path: string;                   // e.g., "m/44'/501'/0'/0'"
  childIndex: number;
  isHardened: boolean;
}
```

### Token Types

```typescript
interface TokenMintConfig {
  symbol: string;
  name: string;
  mintAddress: string;
  decimals: number;
  totalSupply: string;
  mintAuthority?: string;
  freezeAuthority?: string;
}

interface VestingConfig {
  type: 'linear' | 'cliff_linear' | 'milestone' | 'custom';
  startDate: Date;
  endDate: Date;
  cliffDate?: Date;
  cliffAmount?: string;
  intervalDays: number;
  milestones?: Array<{ date: string; amount: string; description: string }>;
}
```

### Staking Types

```typescript
interface StakePosition {
  id: string;
  poolId: string;
  stakerAddress: string;
  amount: string;
  stakedAt: Date;
  lockExpiresAt?: Date;
  accumulatedRewards: string;
  claimedRewards: string;
  pendingRewards: string;
  status: 'active' | 'unstaking' | 'unstaked' | 'slashed';
}

interface YieldCalculation {
  principal: string;
  apy: number;
  durationSeconds: number;
  compounding: 'none' | 'daily' | 'weekly';
  reward: string;
  effectiveApy: number;
}
```

### Governance Types

```typescript
type ProposalStatus = 'draft' | 'active' | 'passed' | 'rejected' | 'executed' | 'expired' | 'vetoed';
type VoteType = 'for' | 'against' | 'abstain';

interface GovernanceConfig {
  proposalThreshold: string;
  quorumPercentage: string;
  votingPeriodHours: number;
  timelockDelayHours: number;
  executionWindowHours: number;
  allowDelegation: boolean;
}
```

### DeFi Types

```typescript
type DexProtocol = 'raydium' | 'orca' | 'jupiter' | 'meteora';

interface ImpermanentLossData {
  snapshotDate: Date;
  hodlValueUsd: string;
  lpValueUsd: string;
  ilPercentage: string;
  feesEarnedUsd: string;
  netPnlUsd: string;
}
```

### Bridge Types

```typescript
type BridgeProtocol = 'wormhole' | 'layerzero' | 'debridge';
type BridgeStatus = 'pending' | 'in_transit' | 'completed' | 'failed' | 'refunded';

interface CrossChainMessage {
  protocol: BridgeProtocol;
  sourceChain: SupportedChain;
  destinationChain: SupportedChain;
  attestationId?: string;
  sourceSignature: string;
  destinationSignature?: string;
}
```

### Treasury Types

```typescript
interface TreasuryVault {
  id: string;
  name: string;
  vaultAddress: string;
  threshold: number;
  signerCount: number;
  totalValueUsd: string;
  spendingLimitDaily?: string;
  hitlThreshold: string;
}

interface DiversificationStrategy {
  targetAllocations: Record<string, number>;  // { SOL: 30, USDC: 50, EDGE: 20 }
  rebalanceThreshold: number;                  // % drift before rebalance
  maxSlippageBps: number;
}
```

### ACS Types

```typescript
type MarketCapRegime = 'pre_launch' | 'launch' | 'growth' | 'mature' | 'scale';

interface ACSEvaluation {
  regime: MarketCapRegime;
  marketCap: string;
  stakingApy: number;
  governanceQuorum: number;
  burnRate: number;
  adjustments: ACSAdjustment[];
}

interface ACSAdjustment {
  controller: string;
  parameter: string;
  oldValue: number;
  newValue: number;
  reason: string;
  requiresHitl: boolean;
}
```

---

## Schemas & Enums

### Database Enums

| Enum | Values | Used By |
|------|--------|---------|
| `web3_chain` | `solana`, `ethereum`, `base`, `polygon`, `arbitrum` | All submodules |
| `web3_wallet_type` | `custodial`, `non_custodial`, `multisig` | wallets |
| `web3_wallet_status` | `active`, `frozen`, `archived` | wallets |
| `web3_program_status` | `active`, `paused`, `deprecated` | contracts |
| `web3_staking_pool_status` | `active`, `paused`, `closed` | staking |
| `web3_proposal_status` | `draft`, `active`, `passed`, `rejected`, `executed`, `expired`, `vetoed` | governance |
| `web3_vote_type` | `for`, `against`, `abstain` | governance |
| `web3_dex` | `raydium`, `orca`, `jupiter`, `meteora` | defi |
| `web3_bridge_protocol` | `wormhole`, `layerzero`, `debridge` | bridge |
| `web3_bridge_status` | `pending`, `in_transit`, `completed`, `failed`, `refunded` | bridge |
| `web3_treasury_vault_status` | `active`, `frozen`, `deprecated` | treasury |

### Schema Exports

All Drizzle table schemas are exported from their respective submodules:

```typescript
// Wallets
import { wallets, walletKeys, walletDerivations, walletLinks, walletTransactions, walletProviders } from '@mcv/web3-core';

// Tokens
import { tokenMints, tokenAccounts, tokenTransfers, vestingSchedules, vestingClaims, airdropCampaigns, airdropClaims, tokenAllocations, tokenBurns, tokenSupplySnapshots } from '@mcv/web3-core';

// Contracts
import { deployedPrograms, programVersions, programIdls, programAuthorities, programInvocations, programDeployments } from '@mcv/web3-core';

// Staking
import { stakingPools, stakes, stakingRewards, unstakingRequests, validatorDelegations, liquidStakingTokens, stakingEpochs, rewardDistributions } from '@mcv/web3-core';

// Governance
import { governanceConfigs, proposals, votes, votingDelegations, timelockQueues, governanceSnapshots } from '@mcv/web3-core';

// DeFi
import { liquidityPositions, liquidityPools, swapTransactions, yieldFarmPositions, yieldStrategies, impermanentLossTracking, protocolIntegrations, defiSnapshots } from '@mcv/web3-core';

// Bridge
import { bridgeTransactions, bridgedAssets, bridgeConfigurations, bridgeRelayers } from '@mcv/web3-core';

// Treasury
import { treasuryVaults, treasurySigners, spendingProposals, spendingApprovals, treasuryPositions, treasuryTransactions, treasurySnapshots, treasuryPolicies, treasuryReconciliations } from '@mcv/web3-core';
```

---

## Events

All events are emitted through `@mcv/fabric` event bus. Subscribe using the standard fabric event subscription pattern.

### Event List

| Event Name | Payload | Emitted By |
|-----------|---------|------------|
| `web3.wallets.created` | `{ walletId, chain, type, purpose, ventureId }` | `walletService.createManagedWallet` |
| `web3.wallets.linked` | `{ userId, walletId, address, provider, chain }` | `walletService.verifyWalletLink` |
| `web3.wallets.frozen` | `{ walletId, reason, frozenBy }` | Admin action |
| `web3.wallets.key_rotated` | `{ walletId, newKeyVersion, oldAddress, newAddress }` | `walletService.rotateKey` |
| `web3.tokens.minted` | `{ mintAddress, amount, authority, newSupply }` | `tokenService.mintTokens` |
| `web3.tokens.burned` | `{ mintAddress, amount, burnType, newSupply }` | `tokenService.burnTokens` |
| `web3.tokens.transferred` | `{ from, to, amount, tokenMint, type, txSignature }` | `tokenService.transfer` |
| `web3.tokens.vesting_created` | `{ scheduleId, beneficiary, totalAmount, type }` | `tokenService.createVestingSchedule` |
| `web3.tokens.vesting_claimed` | `{ scheduleId, amount, claimNumber, remaining }` | `tokenService.claimVestedTokens` |
| `web3.tokens.vesting_cancelled` | `{ scheduleId, reason, remainingAmount }` | `tokenService.cancelVesting` |
| `web3.tokens.airdrop_created` | `{ campaignId, name, totalAmount, recipientCount }` | `tokenService.createAirdropCampaign` |
| `web3.tokens.airdrop_claimed` | `{ campaignId, claimant, amount }` | `tokenService.claimAirdrop` |
| `web3.tokens.supply_snapshot` | `{ mintAddress, total, circulating, staked, burned }` | `tokenService.snapshotSupply` |
| `web3.contracts.deployed` | `{ programId, name, version, cluster }` | `contractService.deployProgram` |
| `web3.contracts.upgraded` | `{ programId, fromVersion, toVersion }` | `contractService.upgradeProgram` |
| `web3.contracts.rolled_back` | `{ programId, toVersion }` | `contractService.rollbackProgram` |
| `web3.staking.pool_created` | `{ poolId, name, apy, tokenMint }` | `stakingService.createPool` |
| `web3.staking.stake_created` | `{ poolId, staker, amount, txSignature }` | `stakingService.stake` |
| `web3.staking.unstake_initiated` | `{ stakeId, amount, cooldownEnds }` | `stakingService.unstake` |
| `web3.staking.unstake_completed` | `{ stakeId, amount, txSignature }` | `stakingService.completeUnstake` |
| `web3.staking.rewards_claimed` | `{ stakeId, amount, epoch }` | `stakingService.claimRewards` |
| `web3.staking.rewards_compounded` | `{ stakeId, compoundedAmount, newTotal }` | `stakingService.compoundRewards` |
| `web3.staking.apy_adjusted` | `{ poolId, oldApy, newApy, regime, reason }` | `stakingService.updatePoolApy` |
| `web3.governance.proposal_created` | `{ proposalId, title, category, proposer }` | `governanceService.createProposal` |
| `web3.governance.proposal_activated` | `{ proposalId, votingEndsAt, snapshotSlot }` | `governanceService.activateProposal` |
| `web3.governance.vote_cast` | `{ proposalId, voter, voteType, power }` | `governanceService.castVote` |
| `web3.governance.proposal_passed` | `{ proposalId, forVotes, againstVotes }` | Voting period end (auto) |
| `web3.governance.proposal_rejected` | `{ proposalId, forVotes, againstVotes }` | Voting period end (auto) |
| `web3.governance.proposal_executed` | `{ proposalId, txSignature, result }` | `governanceService.executeProposal` |
| `web3.governance.proposal_vetoed` | `{ proposalId, vetoedBy, reason }` | `governanceService.vetoProposal` |
| `web3.defi.liquidity_added` | `{ pool, dex, tokenA, tokenB, amounts }` | `defiService.addLiquidity` |
| `web3.defi.liquidity_removed` | `{ positionId, tokenAReceived, tokenBReceived }` | `defiService.removeLiquidity` |
| `web3.defi.swap_executed` | `{ dex, inputMint, outputMint, amounts, route }` | `defiService.executeSwap` |
| `web3.defi.farm_entered` | `{ farmAddress, lpAmount }` | `defiService.enterFarm` |
| `web3.defi.farm_harvested` | `{ positionId, rewards }` | `defiService.harvestRewards` |
| `web3.defi.position_out_of_range` | `{ positionId, currentPrice, range }` | IL tracking cron |
| `web3.bridge.initiated` | `{ transactionId, protocol, source, dest, amount }` | `bridgeService.initiateBridge` |
| `web3.bridge.in_transit` | `{ transactionId, attestationId }` | Status monitor |
| `web3.bridge.completed` | `{ transactionId, destTxSignature }` | `bridgeService.claimBridged` |
| `web3.bridge.failed` | `{ transactionId, error, retryCount }` | Status monitor |
| `web3.treasury.proposal_created` | `{ proposalId, vaultId, amount, category }` | `treasuryService.createSpendingProposal` |
| `web3.treasury.proposal_approved` | `{ proposalId, approver, approvalsReceived }` | `treasuryService.approveSpending` |
| `web3.treasury.spending_executed` | `{ proposalId, vaultId, amount, txSignature }` | `treasuryService.executeSpending` |
| `web3.treasury.hitl_required` | `{ proposalId, amount, threshold }` | Auto when threshold met + HITL needed |
| `web3.treasury.nav_snapshot` | `{ vaultId, totalValueUsd }` | `treasuryService.snapshotNAV` |
| `web3.treasury.reconciliation_discrepancy` | `{ vaultId, discrepancyUsd, percentage }` | `treasuryService.reconcile` |

---

## Error Codes

### Complete Error Reference

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| **Wallets** | | | |
| `W3_WALLET_NOT_FOUND` | 404 | Wallet ID does not exist | Verify wallet UUID |
| `W3_WALLET_FROZEN` | 403 | Wallet is frozen by admin | Contact admin to unfreeze |
| `W3_WALLET_UNVERIFIED` | 401 | Wallet link not verified | Complete verification flow |
| `W3_INSUFFICIENT_BALANCE` | 400 | Not enough tokens for operation | Check balance before transacting |
| `W3_INVALID_SIGNATURE` | 401 | Ed25519 signature verification failed | Re-sign with correct key |
| `W3_NONCE_EXPIRED` | 400 | Verification nonce has expired (>5 min) | Request a new nonce via `initiateWalletLink` |
| `W3_COMPLIANCE_BLOCKED` | 403 | Address flagged by compliance check | Address is sanctioned or flagged |
| **Tokens** | | | |
| `W3_MINT_UNAUTHORIZED` | 403 | Signer is not the mint authority | Use the mint authority wallet |
| `W3_VESTING_NOT_CLAIMABLE` | 400 | No tokens are claimable yet | Wait for cliff or next vesting period |
| `W3_VESTING_CANCELLED` | 400 | Vesting schedule was cancelled | Contact venture admin |
| `W3_AIRDROP_ALREADY_CLAIMED` | 400 | Address already claimed this airdrop | Each address can claim once |
| `W3_AIRDROP_EXPIRED` | 400 | Airdrop claim deadline has passed | Campaign has ended |
| `W3_INVALID_MERKLE_PROOF` | 400 | Merkle proof verification failed | Address is not in the airdrop list |
| **Contracts** | | | |
| `W3_PROGRAM_NOT_FOUND` | 404 | Program not in registry | Register the program first |
| `W3_UPGRADE_UNAUTHORIZED` | 403 | Not authorized to upgrade | Must be upgrade authority signer |
| `W3_DEPLOYMENT_IN_PROGRESS` | 409 | Program is currently being deployed | Wait for current deployment |
| **Staking** | | | |
| `W3_STAKING_LOCKUP_ACTIVE` | 400 | Lockup period has not expired | Wait for lockup end date |
| `W3_STAKING_POOL_FULL` | 400 | Pool at max capacity | Try a different pool |
| `W3_STAKING_POOL_PAUSED` | 400 | Staking pool is paused | Pool temporarily unavailable |
| `W3_COOLDOWN_ACTIVE` | 400 | Unstaking cooldown in progress | Wait for cooldown to complete |
| **Governance** | | | |
| `W3_PROPOSAL_THRESHOLD` | 400 | Insufficient tokens to create proposal | Need ≥ threshold EDGE tokens |
| `W3_QUORUM_NOT_MET` | 400 | Quorum not reached for proposal | More votes needed |
| `W3_VOTING_ENDED` | 400 | Voting period has ended | Cannot vote after deadline |
| `W3_TIMELOCK_NOT_READY` | 400 | Timelock period not yet elapsed | Wait for timelock delay |
| **Bridge** | | | |
| `W3_BRIDGE_FAILED` | 500 | Bridge transfer failed | Auto-retry in progress (up to 3x) |
| `W3_BRIDGE_UNSUPPORTED_ROUTE` | 400 | No bridge route for chain pair | Check supported routes |
| **Treasury** | | | |
| `W3_TREASURY_LIMIT_EXCEEDED` | 403 | Spending exceeds policy limits | Reduce amount or request limit increase |
| `W3_TREASURY_HITL_REQUIRED` | 403 | Requires human-in-the-loop approval | Await HITL review via agentic-os |
| `W3_TREASURY_PROPOSAL_EXPIRED` | 400 | Spending proposal expired (>7 days) | Create a new proposal |
| **Infrastructure** | | | |
| `W3_RPC_TIMEOUT` | 504 | Blockchain RPC timed out | Retry with exponential backoff |
| `W3_RPC_RATE_LIMITED` | 429 | RPC provider rate limited | Retry after cooldown period |
| `W3_TX_SIMULATION_FAILED` | 400 | Transaction simulation failed | Check accounts, balances, instruction data |

### Error Class

```typescript
class Web3Error extends Error {
  code: string;                   // e.g., 'W3_INSUFFICIENT_BALANCE'
  httpStatus: number;
  details?: Record<string, unknown>;
  
  constructor(code: string, message: string, httpStatus: number, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}
```

---

## Configuration

### Environment Variables

```bash
# ── Solana RPC ──────────────────────────────────────────────────────
SOLANA_RPC_URL=                    # Primary RPC endpoint (Helius recommended)
SOLANA_RPC_FALLBACK_1=             # Fallback RPC (Triton)
SOLANA_RPC_FALLBACK_2=             # Fallback RPC (QuickNode)
SOLANA_CLUSTER=mainnet-beta        # mainnet-beta | devnet | testnet
SOLANA_COMMITMENT=finalized        # Default commitment level for reads

# ── Key Management ──────────────────────────────────────────────────
AWS_KMS_KEY_ARN=                   # KMS key ARN for wallet encryption
AWS_KMS_REGION=us-east-1           # KMS region
VAULT_ADDR=                        # HashiCorp Vault address (optional)
VAULT_TOKEN=                       # HashiCorp Vault token (optional)

# ── EDGE Token ──────────────────────────────────────────────────────
EDGE_TOKEN_MINT=                   # EDGE token mint address
EDGE_DECIMALS=9                    # Token decimals

# ── DeFi Integrations ──────────────────────────────────────────────
JUPITER_API_URL=https://quote-api.jup.ag/v6
HELIUS_API_KEY=                    # Helius enhanced RPC + webhooks
HELIUS_WEBHOOK_SECRET=             # Webhook signature verification

# ── Bridge Protocols ───────────────────────────────────────────────
WORMHOLE_RPC_HOST=                 # Wormhole guardian RPC
LAYERZERO_ENDPOINT=                # LayerZero endpoint address

# ── Compliance ─────────────────────────────────────────────────────
CHAINALYSIS_API_KEY=               # Chainalysis compliance API
OFAC_LIST_URL=                     # OFAC sanctions list URL

# ── Redis ──────────────────────────────────────────────────────────
REDIS_URL=                         # Redis connection string
REDIS_CACHE_TTL=10                 # Balance cache TTL in seconds
```

### Constants

```typescript
import {
  SUPPORTED_CHAINS,               // ['solana', 'ethereum', 'base', 'polygon', 'arbitrum']
  CHAIN_CONFIGS,                   // ChainConfig per supported chain
  EDGE_TOKEN_MINT,                 // EDGE mint address
  EDGE_TOKEN_DECIMALS,             // 9
  EDGE_TOTAL_SUPPLY,               // Total EDGE supply
  TOKEN_ALLOCATION_BUCKETS,        // Allocation categories + percentages
  STAKING_POOL_DEFAULTS,           // Default pool configuration
  GOVERNANCE_DEFAULTS,             // Default governance parameters
  BRIDGE_PROTOCOLS,                // Supported bridge protocols
  TREASURY_MULTISIG_THRESHOLD,     // Default multi-sig threshold
  ACS_REGIME_THRESHOLDS,           // Market cap thresholds per regime
  ACS_CONTROLLER_PRESETS,          // Default ACS controller values
  MAX_TRANSACTION_BATCH_SIZE,      // 15 instructions per tx
  RPC_PROVIDERS,                   // RPC provider configurations
  CONFIRMATION_LEVELS,             // Commitment level constants
  COOLDOWN_PERIODS,                // Default cooldown durations
  VESTING_CLIFF_DEFAULTS,          // Default cliff configurations
} from '@mcv/web3-core';
```

---

## Client Hooks & Components

### React Hooks

All hooks use React Query for caching, automatic refetching, and optimistic updates.

| Hook | Purpose | Returns |
|------|---------|---------|
| `useWallet(walletId)` | Wallet data + status | `{ wallet, isLoading, error }` |
| `useWalletBalance(walletId, tokenMint?)` | Real-time balance | `{ balance, isLoading, refetch }` |
| `useTokenOperations()` | Token transfer/mint/burn methods | `{ transfer, mint, burn, isLoading }` |
| `useVestingSchedule(scheduleId)` | Vesting status + claimable | `{ schedule, claimable, claim }` |
| `useStaking(poolId)` | Staking pool data + user position | `{ pool, myStake, stake, unstake }` |
| `useStakingRewards(stakeId)` | Pending rewards | `{ pending, claim, compound }` |
| `useGovernance(configId)` | Active proposals + voting | `{ proposals, myVotingPower }` |
| `useProposalVoting(proposalId)` | Proposal details + vote | `{ proposal, results, castVote }` |
| `useDefiPositions(ventureId)` | DeFi portfolio summary | `{ positions, totalValue }` |
| `useBridgeStatus(transactionId)` | Bridge transfer status | `{ status, estimatedArrival }` |
| `useTreasuryOverview(vaultId)` | Treasury dashboard data | `{ positions, nav, proposals }` |
| `useTransactionHistory(walletId)` | Paginated tx history | `{ transactions, loadMore }` |

### React Components

| Component | Purpose |
|-----------|---------|
| `<WalletConnectButton />` | Phantom/MetaMask connect + link |
| `<WalletBalanceCard />` | Balance display with auto-refresh |
| `<TokenTransferForm />` | Send tokens form with validation |
| `<VestingTimeline />` | Visual vesting schedule timeline |
| `<StakingDashboard />` | Pool list + staking positions |
| `<StakePositionCard />` | Individual stake position details |
| `<GovernanceProposalList />` | Active proposals with vote counts |
| `<VotingPanel />` | Cast vote interface |
| `<DefiPortfolioView />` | LP + farm position overview |
| `<LiquidityPoolCard />` | Individual LP position card |
| `<BridgeTransferForm />` | Cross-chain bridge interface |
| `<BridgeStatusTracker />` | Bridge progress tracker |
| `<TreasuryDashboard />` | Treasury NAV + positions |
| `<SpendingProposalForm />` | Create spending proposal |
| `<TransactionExplorer />` | Transaction history browser |
| `<ACSHealthDashboard />` | ACS regime + controller status |

---

*@mcv/web3-core — Web3 Core Infrastructure*
