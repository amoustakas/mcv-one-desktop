# @mcv/web3-core — Web3 Core Domain Module

**Parent Package:** @mcv/web3-core  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** MCV-ONLY (Internal Blockchain Infrastructure)  
**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Purpose

The `web3-core` module provides the complete blockchain infrastructure layer for the MCV Global Consortium. It implements multi-chain wallet management with HD derivation and KMS-backed key custody, SPL token operations including the EDGE ecosystem token, Solana program (smart contract) deployment and lifecycle management, staking pools with yield calculation and liquid staking derivatives, on-chain governance with token-weighted voting and timelock execution, DeFi protocol integrations (Raydium, Orca, Jupiter), cross-chain bridge operations via Wormhole and LayerZero, and multi-sig treasury management with on-chain accounting.

**This is the single source of truth for all blockchain operations, token economics, and on-chain treasury management across every MCV venture.**

Every token that flows through the MCV ecosystem — whether from staking rewards, governance participation, DeFi yield, cross-chain bridging, or treasury disbursement — is orchestrated through this module. Wallet creation, transaction signing, program deployment, and on-chain state management all converge here as the cryptographic backbone of the platform.

The module serves 9 ventures across the MCV consortium: BetEdge (sports betting AI), SerpSpace (SEO tools), Full Gain (grants management), MCV Studios (gaming), Futurestate (real estate tokenization), and 4 additional ventures — each with their own wallet infrastructure, token allocations, and treasury operations, all unified under the EDGE token economy.

**Security is paramount.** This module handles private keys, signs transactions involving real monetary value, and manages multi-million dollar treasury positions. Every operation is audited, every key is KMS-protected, and every high-value transaction requires multi-signature approval with human-in-the-loop verification.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// WALLETS
// ═══════════════════════════════════════════════════════════════════════════════

// Core services
export {
  walletService,                    // Multi-chain wallet management
} from './wallets/service';

export type {
  CreateWalletInput,                // Create a new managed wallet
  DeriveWalletInput,                // Derive HD child wallet
  SignTransactionInput,             // Sign a transaction with KMS
  LinkWalletInput,                  // Link external wallet to user
  VerifyWalletInput,                // Verify wallet ownership via signature
} from './wallets/service';

// Schema exports
export {
  wallets,                          // Managed wallets table
  walletKeys,                       // Encrypted key material table
  walletDerivations,                // HD derivation paths table
  walletLinks,                      // User-to-wallet links table
  walletTransactions,               // Transaction history table
  walletProviders,                  // External wallet providers table
  chainEnum,                        // Blockchain network enum
  walletTypeEnum,                   // custodial | non_custodial | multisig
  walletStatusEnum,                 // active | frozen | archived
} from './wallets/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  tokenService,                     // SPL token operations & EDGE management
} from './tokens/service';

export type {
  MintTokenInput,                   // Mint new tokens
  BurnTokenInput,                   // Burn tokens from supply
  TransferTokenInput,               // Transfer tokens between wallets
  CreateVestingInput,               // Create vesting schedule
  CreateAirdropInput,               // Create airdrop distribution
} from './tokens/service';

export {
  tokenMints,                       // Token mint definitions table
  tokenAccounts,                    // Associated token accounts table
  tokenTransfers,                   // Transfer history table
  vestingSchedules,                 // Vesting schedule definitions
  vestingClaims,                    // Individual vesting claims
  airdropCampaigns,                 // Airdrop campaign definitions
  airdropClaims,                    // Individual airdrop claims
  tokenAllocations,                 // Token allocation buckets
  tokenBurns,                       // Burn event log
  tokenSupplySnapshots,             // Circulating supply snapshots
} from './tokens/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  contractService,                  // Solana program deployment & management
} from './contracts/service';

export type {
  DeployProgramInput,               // Deploy a new Solana program
  UpgradeProgramInput,              // Upgrade an existing program
  InvokeProgramInput,               // Cross-program invocation
} from './contracts/service';

export {
  deployedPrograms,                 // Deployed program registry
  programVersions,                  // Program version history
  programIdls,                      // IDL storage for Anchor programs
  programAuthorities,               // Program upgrade authorities
  programInvocations,               // CPI invocation log
  programDeployments,               // Deployment execution log
  programStatusEnum,                // active | paused | deprecated
} from './contracts/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// STAKING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  stakingService,                   // Staking pool management & rewards
} from './staking/service';

export type {
  CreateStakeInput,                 // Stake tokens in a pool
  UnstakeInput,                     // Initiate unstaking with cooldown
  ClaimRewardsInput,                // Claim accumulated rewards
  CreatePoolInput,                  // Create a new staking pool
  DelegateStakeInput,               // Delegate to validator
} from './staking/service';

export {
  stakingPools,                     // Staking pool definitions
  stakes,                           // Active stake positions
  stakingRewards,                   // Reward distribution records
  unstakingRequests,                // Cooldown/unstaking queue
  validatorDelegations,             // Validator delegation tracking
  liquidStakingTokens,              // Liquid staking derivative tokens
  stakingEpochs,                    // Epoch-level staking snapshots
  rewardDistributions,              // Batch reward distributions
  stakingPoolStatusEnum,            // active | paused | closed
} from './staking/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// GOVERNANCE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  governanceService,                // On-chain governance & voting
} from './governance/service';

export type {
  CreateProposalInput,              // Create a governance proposal
  CastVoteInput,                    // Cast a vote on a proposal
  DelegateVotingInput,              // Delegate voting power
  ExecuteProposalInput,             // Execute an approved proposal
} from './governance/service';

export {
  governanceConfigs,                // Governance configuration per economy
  proposals,                        // Governance proposals
  votes,                            // Individual votes
  votingDelegations,                // Voting power delegations
  timelockQueues,                   // Timelock execution queue
  governanceSnapshots,              // Token balance snapshots for voting
  proposalStatusEnum,               // draft | active | passed | rejected | executed | expired
  voteTypeEnum,                     // for | against | abstain
} from './governance/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFI
// ═══════════════════════════════════════════════════════════════════════════════

export {
  defiService,                      // DeFi protocol integrations
} from './defi/service';

export type {
  AddLiquidityInput,                // Add liquidity to a pool
  RemoveLiquidityInput,             // Remove liquidity from a pool
  SwapTokenInput,                   // Execute token swap
  CreateFarmPositionInput,          // Enter yield farming position
} from './defi/service';

export {
  liquidityPositions,               // Active LP positions
  liquidityPools,                   // Tracked liquidity pools
  swapTransactions,                 // Swap execution history
  yieldFarmPositions,               // Yield farming positions
  yieldStrategies,                  // Configured yield strategies
  impermanentLossTracking,          // IL tracking records
  protocolIntegrations,             // External protocol connections
  defiSnapshots,                    // Position value snapshots
  dexEnum,                          // raydium | orca | jupiter | meteora
} from './defi/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// BRIDGE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  bridgeService,                    // Cross-chain bridge operations
} from './bridge/service';

export type {
  InitiateBridgeInput,              // Start a cross-chain transfer
  ClaimBridgedInput,                // Claim bridged assets on destination
  MonitorBridgeInput,               // Monitor bridge transaction status
} from './bridge/service';

export {
  bridgeTransactions,               // Bridge transfer records
  bridgedAssets,                    // Bridged asset tracking
  bridgeConfigurations,             // Bridge protocol configurations
  bridgeRelayers,                   // Relayer node registry
  bridgeProtocolEnum,               // wormhole | layerzero | debridge
  bridgeStatusEnum,                 // pending | in_transit | completed | failed | refunded
} from './bridge/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// TREASURY
// ═══════════════════════════════════════════════════════════════════════════════

export {
  treasuryService,                  // On-chain treasury management
} from './treasury/service';

export type {
  CreateSpendingProposalInput,      // Propose treasury spend
  ApproveSpendingInput,             // Approve a spending proposal
  ExecuteSpendingInput,             // Execute approved spend
  DiversifyInput,                   // Treasury diversification operation
} from './treasury/service';

export {
  treasuryVaults,                   // Multi-sig treasury vaults
  treasurySigners,                  // Vault signer registry
  spendingProposals,                // Treasury spending proposals
  spendingApprovals,                // Individual signer approvals
  treasuryPositions,                // Current asset positions
  treasuryTransactions,             // All treasury transactions
  treasurySnapshots,                // Periodic NAV snapshots
  treasuryPolicies,                 // Spending limits & rules
  treasuryReconciliations,          // Fiat-crypto reconciliation
  treasuryVaultStatusEnum,          // active | frozen | deprecated
} from './treasury/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useWallet } from './client/hooks/use-wallet';
export { useWalletBalance } from './client/hooks/use-wallet-balance';
export { useTokenOperations } from './client/hooks/use-token-operations';
export { useVestingSchedule } from './client/hooks/use-vesting-schedule';
export { useStaking } from './client/hooks/use-staking';
export { useStakingRewards } from './client/hooks/use-staking-rewards';
export { useGovernance } from './client/hooks/use-governance';
export { useProposalVoting } from './client/hooks/use-proposal-voting';
export { useDefiPositions } from './client/hooks/use-defi-positions';
export { useBridgeStatus } from './client/hooks/use-bridge-status';
export { useTreasuryOverview } from './client/hooks/use-treasury-overview';
export { useTransactionHistory } from './client/hooks/use-transaction-history';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { WalletConnectButton } from './client/components/wallet-connect-button';
export { WalletBalanceCard } from './client/components/wallet-balance-card';
export { TokenTransferForm } from './client/components/token-transfer-form';
export { VestingTimeline } from './client/components/vesting-timeline';
export { StakingDashboard } from './client/components/staking-dashboard';
export { StakePositionCard } from './client/components/stake-position-card';
export { GovernanceProposalList } from './client/components/governance-proposal-list';
export { VotingPanel } from './client/components/voting-panel';
export { DefiPortfolioView } from './client/components/defi-portfolio-view';
export { LiquidityPoolCard } from './client/components/liquidity-pool-card';
export { BridgeTransferForm } from './client/components/bridge-transfer-form';
export { BridgeStatusTracker } from './client/components/bridge-status-tracker';
export { TreasuryDashboard } from './client/components/treasury-dashboard';
export { SpendingProposalForm } from './client/components/spending-proposal-form';
export { TransactionExplorer } from './client/components/transaction-explorer';
export { ACSHealthDashboard } from './client/components/acs-health-dashboard';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SUPPORTED_CHAINS,
  CHAIN_CONFIGS,
  EDGE_TOKEN_MINT,
  EDGE_TOKEN_DECIMALS,
  EDGE_TOTAL_SUPPLY,
  TOKEN_ALLOCATION_BUCKETS,
  STAKING_POOL_DEFAULTS,
  GOVERNANCE_DEFAULTS,
  BRIDGE_PROTOCOLS,
  TREASURY_MULTISIG_THRESHOLD,
  ACS_REGIME_THRESHOLDS,
  ACS_CONTROLLER_PRESETS,
  MAX_TRANSACTION_BATCH_SIZE,
  RPC_PROVIDERS,
  CONFIRMATION_LEVELS,
  COOLDOWN_PERIODS,
  VESTING_CLIFF_DEFAULTS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Chain types
  SupportedChain,
  ChainConfig,
  NetworkEnvironment,
  ConfirmationLevel,

  // Wallet types
  WalletType,
  WalletStatus,
  KeyMaterial,
  DerivationPath,
  SignatureResult,
  WalletProvider,

  // Token types
  TokenMintConfig,
  TokenAllocation,
  VestingConfig,
  VestingCliff,
  AirdropMerkleTree,
  TokenDistribution,
  BurnEvent,

  // Contract types
  ProgramDeployment,
  ProgramIdl,
  ProgramAuthority,
  CrossProgramInvocation,
  UpgradeAuthority,

  // Staking types
  StakingPool,
  StakePosition,
  StakingReward,
  UnstakingRequest,
  ValidatorDelegation,
  LiquidStakingDerivative,
  EpochSnapshot,
  YieldCalculation,

  // Governance types
  GovernanceConfig,
  Proposal,
  ProposalStatus,
  Vote,
  VoteType,
  VotingDelegation,
  TimelockEntry,
  GovernanceSnapshot,

  // DeFi types
  LiquidityPosition,
  LiquidityPool,
  SwapRoute,
  SwapExecution,
  YieldFarmPosition,
  YieldStrategy,
  ImpermanentLossData,
  DexProtocol,

  // Bridge types
  BridgeTransaction,
  BridgeProtocol,
  BridgeStatus,
  BridgedAsset,
  BridgeRelayer,
  CrossChainMessage,

  // Treasury types
  TreasuryVault,
  TreasurySigner,
  SpendingProposal,
  SpendingApproval,
  TreasuryPosition,
  TreasurySnapshot,
  TreasuryPolicy,
  DiversificationStrategy,

  // ACS types
  MarketCapRegime,
  ACSController,
  ACSAdjustment,
  ACSEvaluation,
  RegimePreset,
  EconomicHealthMetrics,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            @mcv/web3-core — WEB3 CORE DOMAIN ARCHITECTURE                          │
│                                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              ENTRY POINTS                                                     │   │
│  │                                                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │  API Routes  │  │  Cron Jobs   │  │  Webhooks    │  │ NAOS Agents  │  │  Client SDK  │   │   │
│  │  │ /api/web3    │  │  Rewards     │  │  Solana      │  │  Treasury    │  │  Phantom     │   │   │
│  │  │ /api/tokens  │  │  Vesting     │  │  Wormhole    │  │  DeFi Agent  │  │  WalletAdapt │   │   │
│  │  │ /api/stake   │  │  Staking     │  │  Jupiter     │  │  ACS Engine  │  │              │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │   │
│  │         │                 │                  │                 │                  │            │   │
│  │         └─────────────────┴──────────────────┴─────────────────┴──────────────────┘            │   │
│  │                                         │                                                      │   │
│  └─────────────────────────────────────────┼──────────────────────────────────────────────────────┘   │
│                                            │                                                          │
│  ┌─────────────────────────────────────────▼──────────────────────────────────────────────────────┐   │
│  │                              SERVICE LAYER                                                      │   │
│  │                                                                                                 │   │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │   │
│  │  │     WALLETS        │  │      TOKENS         │  │    CONTRACTS       │  │    STAKING       │  │   │
│  │  │                    │  │                     │  │                    │  │                  │  │   │
│  │  │ • HD derivation    │  │ • EDGE mint/burn   │  │ • Program deploy   │  │ • Pool mgmt     │  │   │
│  │  │ • KMS key mgmt     │  │ • SPL operations   │  │ • IDL management   │  │ • Yield calc    │  │   │
│  │  │ • Tx signing       │  │ • Vesting engine   │  │ • Upgrades         │  │ • Delegations   │  │   │
│  │  │ • Wallet-as-a-Svc  │  │ • Airdrop engine   │  │ • CPI invocations  │  │ • Liquid stake  │  │   │
│  │  │ • Link/verify      │  │ • Distribution     │  │ • Authority mgmt   │  │ • Cooldowns     │  │   │
│  │  └────────┬───────────┘  └────────┬───────────┘  └────────┬───────────┘  └────────┬─────────┘  │   │
│  │           │                       │                       │                       │             │   │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │   │
│  │  │    GOVERNANCE      │  │       DEFI          │  │      BRIDGE        │  │    TREASURY      │  │   │
│  │  │                    │  │                     │  │                    │  │                  │  │   │
│  │  │ • Proposals        │  │ • DEX integration   │  │ • Wormhole ops    │  │ • Multi-sig      │  │   │
│  │  │ • Token voting     │  │ • Liquidity pools   │  │ • LayerZero ops   │  │ • Spending props │  │   │
│  │  │ • Delegation       │  │ • Yield farming     │  │ • Asset tracking   │  │ • Diversify      │  │   │
│  │  │ • Timelock exec    │  │ • IL tracking       │  │ • Tx monitoring    │  │ • Reconciliation │  │   │
│  │  │ • Snapshots        │  │ • Jupiter/Orca/Ray  │  │ • Relayer mgmt    │  │ • On-chain acctg │  │   │
│  │  └────────┬───────────┘  └────────┬───────────┘  └────────┬───────────┘  └────────┬─────────┘  │   │
│  │           │                       │                       │                       │             │   │
│  └───────────┴───────────────────────┴───────────────────────┴───────────────────────┴─────────────┘   │
│                                            │                                                          │
│  ┌─────────────────────────────────────────▼──────────────────────────────────────────────────────┐   │
│  │                    BLOCKCHAIN ABSTRACTION LAYER (BAL)                                           │   │
│  │                                                                                                 │   │
│  │  The BAL ensures all services interact with blockchains through a unified adapter interface.    │   │
│  │  Venture apps never touch raw RPC calls — the BAL handles connection pooling, retries,          │   │
│  │  confirmation tracking, fee estimation, and transaction batching.                               │   │
│  │                                                                                                 │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │   │
│  │  │ SolanaAdapter  │  │ EVMAdapter     │  │ RPCLoadBalancer│  │ TxBatchEngine  │               │   │
│  │  │ (Primary)      │  │ (Planned)      │  │ (Helius/QN/   │  │ (10-15 ixs per │               │   │
│  │  │ @solana/web3.js│  │ ethers/viem    │  │  Triton)       │  │  transaction)  │               │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘               │   │
│  │                                                                                                 │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                                    │   │
│  │  │ KMS Signer     │  │ Confirmation   │  │ Fee Estimator  │                                    │   │
│  │  │ (AWS KMS /     │  │ Tracker        │  │ (Priority fee  │                                    │   │
│  │  │  HashiCorp)    │  │ (32+ confirms) │  │  calculation)  │                                    │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                                    │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                            │                                                          │
│  ┌─────────────────────────────────────────▼──────────────────────────────────────────────────────┐   │
│  │                              ACS v2.0 (Algorithmic Control System)                               │   │
│  │                                                                                                  │   │
│  │  ┌────────────┐  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐                   │   │
│  │  │  Regime    │  │ PID Controller │  │  16 Economic   │  │  HITL Gate      │                   │   │
│  │  │  Detector  │  │ (Feedback Loop)│  │  Controllers   │  │  (>5% changes   │                   │   │
│  │  │  (5 tiers) │  │                │  │  across 4 cats │  │   require human) │                   │   │
│  │  └────────────┘  └────────────────┘  └────────────────┘  └─────────────────┘                   │   │
│  │                                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                            │                                                          │
│  ┌─────────────────────────────────────────▼──────────────────────────────────────────────────────┐   │
│  │                              DATABASE LAYER (PostgreSQL via Drizzle ORM)                         │   │
│  │                                                                                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Wallets  │ │ Tokens   │ │Contracts │ │ Staking  │ │Governance│ │  DeFi    │ │Bridge    │  │   │
│  │  │ 6 tables │ │10 tables │ │ 6 tables │ │ 9 tables │ │ 6 tables │ │ 8 tables │ │ 4 tables │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  │                                                                                                  │   │
│  │  ┌──────────┐ ┌──────────────────────────────────────────────────────────────────────────────┐  │   │
│  │  │Treasury  │ │  web3_audit_trail  |  web3_compliance_checks  |  web3_rpc_metrics           │  │   │
│  │  │ 9 tables │ │                                                                              │  │   │
│  │  └──────────┘ └──────────────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              EXTERNAL DEPENDENCIES                                                │ │
│  │                                                                                                   │ │
│  │  @mcv/identity          @mcv/fabric            @mcv/treasury           @mcv/kernel               │ │
│  │  (Wallet-to-user        (Event bus, audit       (Fiat-crypto            (DB, context,             │ │
│  │   linking, KYC)          trail, logging)         reconciliation)         errors, auth)            │ │
│  │                                                                                                   │ │
│  │  @solana/web3.js        @coral-xyz/anchor       @solana/spl-token      tweetnacl                 │ │
│  │  (Solana RPC,           (Anchor framework,      (SPL token ops,        (Ed25519 signing,         │ │
│  │   transactions)          IDL, programs)          ATA creation)          verification)             │ │
│  │                                                                                                   │ │
│  │  Helius API             Jupiter API             Wormhole SDK           AWS KMS                    │ │
│  │  (Enhanced RPC,         (DEX aggregator,        (Cross-chain           (Key management,           │ │
│  │   webhooks, DAS)         routing, swaps)         bridging)              signing)                  │ │
│  │                                                                                                   │ │
│  │  Squads Protocol        Raydium SDK             Orca SDK               LayerZero                  │ │
│  │  (Multi-sig,            (AMM, CLMM pools,      (Whirlpools,           (Cross-chain               │ │
│  │   treasury vaults)       farms)                  concentrated LP)       messaging)                │ │
│  │                                                                                                   │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: User Stakes EDGE Tokens

```
User Initiates Stake via UI
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ wallets       │────▶│ tokens        │────▶│ staking       │
│               │     │               │     │               │
│ Verify wallet │     │ Check EDGE    │     │ Create stake  │
│ ownership &   │     │ balance ≥     │     │ position in   │
│ sign tx       │     │ stake amount  │     │ pool          │
└───────┬───────┘     └───────────────┘     └───────┬───────┘
        │                                           │
        ▼                                           ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ BAL (Solana)  │────▶│ On-chain      │────▶│ treasury      │
│               │     │               │     │               │
│ Build & send  │     │ Transfer EDGE │     │ Update vault  │
│ staking tx    │     │ to staking    │     │ position &    │
│ via KMS signer│     │ vault PDA     │     │ NAV snapshot  │
└───────────────┘     └───────────────┘     └───────────────┘
        │
        ▼
┌───────────────┐
│ @mcv/fabric   │
│               │
│ Emit event:   │
│ web3.staking  │
│ .stake_created│
│ + audit trail │
└───────────────┘
```

### Data Flow: Treasury Spending Proposal → Execution

```
Treasury Manager Creates Spending Proposal
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ treasury      │────▶│ governance    │────▶│ treasury      │
│               │     │               │     │               │
│ Create spend  │     │ Multi-sig     │     │ Collect N-of-M│
│ proposal with │     │ signers       │     │ approvals     │
│ amount, dest  │     │ notified      │     │               │
└───────┬───────┘     └───────────────┘     └───────┬───────┘
        │                                           │ threshold met
        │                                           ▼
        │                                   ┌───────────────┐
        │                                   │ HITL Gate     │
        │                                   │               │
        │                                   │ Human-in-loop │
        │                                   │ final approval│
        │                                   │ (>$10K)       │
        │                                   └───────┬───────┘
        │                                           │ approved
        ▼                                           ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ BAL (Solana)  │────▶│ On-chain      │────▶│ @mcv/treasury │
│               │     │               │     │               │
│ Execute multi │     │ Transfer from │     │ Fiat-crypto   │
│ -sig tx via   │     │ treasury PDA  │     │ reconciliation│
│ Squads        │     │ to recipient  │     │ entry created │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## Sub-Module Overview

| Module | Purpose | Tables | Key Operations |
|--------|---------|--------|----------------|
| **wallets** | Multi-chain wallet management, HD derivation, KMS signing | 6 | create wallet, derive child, sign tx, link external, verify ownership |
| **tokens** | EDGE token operations, SPL management, vesting, airdrops | 10 | mint, burn, transfer, create vesting, run airdrop, track supply |
| **contracts** | Solana program deployment, upgrades, IDL management | 6 | deploy program, upgrade, register IDL, invoke CPI, manage authority |
| **staking** | Staking pools, validator delegation, rewards, liquid staking | 9 | create pool, stake, unstake, claim rewards, delegate, mint LST |
| **governance** | On-chain governance, proposals, voting, timelock | 6 | create proposal, cast vote, delegate, execute, snapshot balances |
| **defi** | DEX integration, LP management, yield farming, IL tracking | 8 | add/remove liquidity, swap, farm, track IL, manage strategies |
| **bridge** | Cross-chain transfers, Wormhole/LayerZero, asset tracking | 4 | initiate bridge, claim destination, monitor status, track assets |
| **treasury** | Multi-sig vaults, spending proposals, diversification, accounting | 9 | create vault, propose spend, approve, execute, reconcile, snapshot |

---

## Module: wallets

### Purpose

Manages the complete wallet lifecycle across the MCV ecosystem. Provides HD wallet derivation (BIP-44 for EVM, Solana derivation paths), KMS-backed key management for custodial/platform wallets, non-custodial wallet linking with cryptographic verification, transaction signing, and wallet-as-a-service capabilities for all 9 ventures.

Every venture in the MCV consortium has its own set of managed wallets (treasury, rewards, operations) plus the ability for end-users to link their external wallets (Phantom, MetaMask). The platform **never** stores end-user private keys — only platform-managed wallets use KMS-backed key material.

### Database Schema

```typescript
// web3_wallets — Managed Wallet Registry
export const wallets = pgTable('web3_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),                         // "BetEdge Treasury", "Rewards Hot Wallet"
  description: text('description'),
  chain: chainEnum('chain').notNull(),                    // solana | ethereum | base | polygon
  address: text('address').notNull().unique(),            // Public address (base58 for Solana, hex for EVM)
  walletType: walletTypeEnum('wallet_type').notNull(),    // custodial | non_custodial | multisig
  status: walletStatusEnum('status').default('active'),   // active | frozen | archived
  purpose: text('purpose').notNull(),                     // treasury | rewards | operations | staking | user
  derivationPath: text('derivation_path'),                // "m/44'/501'/0'/0'" for Solana HD
  parentWalletId: uuid('parent_wallet_id').references(() => wallets.id),
  kmsKeyId: text('kms_key_id'),                           // AWS KMS key ARN (custodial only)
  multisigConfig: jsonb('multisig_config'),
  // { threshold: 3, signers: ['addr1', 'addr2', 'addr3', 'addr4', 'addr5'], protocol: 'squads' }
  balanceCache: jsonb('balance_cache'),
  // { SOL: '15.234', EDGE: '1000000', USDC: '50000', lastUpdated: '2026-02-08T...' }
  metadata: jsonb('metadata'),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_wallet_keys — Encrypted Key Material (KMS-wrapped)
export const walletKeys = pgTable('web3_wallet_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
  keyType: text('key_type').notNull(),                    // ed25519 | secp256k1
  encryptedPrivateKey: text('encrypted_private_key'),     // KMS-encrypted ciphertext (NEVER plaintext)
  kmsKeyArn: text('kms_key_arn').notNull(),               // ARN of the KMS key used for encryption
  publicKey: text('public_key').notNull(),                // Public key (safe to store in plaintext)
  keyVersion: integer('key_version').default(1),
  isActive: boolean('is_active').default(true),
  rotatedAt: timestamp('rotated_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_wallet_derivations — HD Wallet Derivation Tree
export const walletDerivations = pgTable('web3_wallet_derivations', {
  id: uuid('id').primaryKey().defaultRandom(),
  masterWalletId: uuid('master_wallet_id').notNull().references(() => wallets.id),
  childWalletId: uuid('child_wallet_id').notNull().references(() => wallets.id),
  derivationPath: text('derivation_path').notNull(),      // "m/44'/501'/0'/0'"
  childIndex: integer('child_index').notNull(),           // 0, 1, 2, ...
  isHardened: boolean('is_hardened').default(true),
  purpose: text('purpose').notNull(),                     // What this child wallet is for
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_wallet_links — User-to-Wallet Association
export const walletLinks = pgTable('web3_wallet_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),                      // MCV user ID (from @mcv/identity)
  walletId: uuid('wallet_id').references(() => wallets.id),
  chain: chainEnum('chain').notNull(),
  address: text('address').notNull(),
  provider: text('provider'),                             // phantom | metamask | solflare | ledger
  isPrimary: boolean('is_primary').default(false),
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verificationNonce: text('verification_nonce'),          // Challenge nonce for signature verification
  nonceExpiresAt: timestamp('nonce_expires_at', { withTimezone: true }),
  complianceStatus: text('compliance_status').default('pending'), // pending | cleared | flagged | blocked
  complianceCheckedAt: timestamp('compliance_checked_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_wallet_transactions — Transaction History
export const walletTransactions = pgTable('web3_wallet_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id),
  chain: chainEnum('chain').notNull(),
  txSignature: text('tx_signature').notNull().unique(),   // Transaction signature/hash
  txType: text('tx_type').notNull(),                      // transfer | stake | swap | bridge | governance | deploy
  direction: text('direction').notNull(),                 // inbound | outbound | internal
  status: text('status').default('pending'),              // pending | confirmed | finalized | failed | dropped
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  amount: numeric('amount', { precision: 30, scale: 9 }),
  tokenMint: text('token_mint'),                          // SPL token mint address (null for native SOL)
  fee: numeric('fee', { precision: 20, scale: 9 }),       // Transaction fee in native token
  priorityFee: numeric('priority_fee', { precision: 20, scale: 9 }),
  slot: bigint('slot', { mode: 'number' }),               // Solana slot number
  blockTime: timestamp('block_time', { withTimezone: true }),
  confirmations: integer('confirmations').default(0),
  errorMessage: text('error_message'),
  rawTransaction: jsonb('raw_transaction'),               // Full serialized transaction for audit
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_wallet_providers — Supported External Wallet Providers
export const walletProviders = pgTable('web3_wallet_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),                  // phantom | metamask | solflare
  displayName: text('display_name').notNull(),            // "Phantom Wallet"
  chains: text('chains').array().notNull(),               // ['solana'] or ['ethereum', 'polygon']
  iconUrl: text('icon_url'),
  deepLinkTemplate: text('deep_link_template'),           // Mobile deep link
  isActive: boolean('is_active').default(true),
  priority: integer('priority').default(0),               // Display order
  metadata: jsonb('metadata'),
});
```

### Core Interface

```typescript
export class WalletService {
  // ── Wallet Creation ──────────────────────────────────────────────────
  createManagedWallet(input: CreateWalletInput): Promise<Wallet>;
  deriveChildWallet(input: DeriveWalletInput): Promise<{ wallet: Wallet; derivation: WalletDerivation }>;
  createMultisigWallet(input: CreateMultisigInput): Promise<Wallet>;

  // ── Wallet Linking (Non-Custodial) ──────────────────────────────────
  initiateWalletLink(input: LinkWalletInput): Promise<{ nonce: string; message: string; expiresAt: Date }>;
  verifyWalletLink(input: VerifyWalletInput): Promise<WalletLink>;
  unlinkWallet(linkId: string): Promise<void>;

  // ── Transaction Signing ──────────────────────────────────────────────
  signTransaction(input: SignTransactionInput): Promise<SignatureResult>;
  signAndSendTransaction(input: SignTransactionInput): Promise<{ signature: string; status: string }>;
  batchSignAndSend(inputs: SignTransactionInput[]): Promise<BatchSignResult>;

  // ── Balance & History ────────────────────────────────────────────────
  getBalance(walletId: string, tokenMint?: string): Promise<TokenBalance>;
  getAllBalances(walletId: string): Promise<TokenBalance[]>;
  getTransactionHistory(walletId: string, options?: TxHistoryOptions): Promise<PaginatedResult<WalletTransaction>>;
  refreshBalanceCache(walletId: string): Promise<void>;

  // ── Compliance ───────────────────────────────────────────────────────
  runComplianceCheck(address: string): Promise<ComplianceResult>;
  getWalletsByUser(userId: string): Promise<WalletLink[]>;

  // ── Key Management ───────────────────────────────────────────────────
  rotateKey(walletId: string): Promise<WalletKey>;
  getKeyStatus(walletId: string): Promise<KeyStatusReport>;
}
```

### Wallet Link Verification Flow

```
┌──────────────────┐    initiate     ┌───────────────────┐    sign nonce     ┌──────────────────┐
│                  │────────────────▶│                   │──────────────────▶│                  │
│  User clicks     │                 │  Server generates │                   │  User signs in   │
│  "Connect Wallet"│                 │  nonce + message  │                   │  Phantom/MM      │
│                  │                 │  (expires 5 min)  │                   │                  │
└──────────────────┘                 └───────────────────┘                   └────────┬─────────┘
                                                                                      │
                                                                    ┌─────────────────┼─────────┐
                                                                    │ verify           │ timeout  │
                                                                    ▼                  │         ▼
                                                          ┌──────────────────┐         │  ┌───────────┐
                                                          │ Ed25519 verify   │         │  │ EXPIRED   │
                                                          │ signature against│         │  │ Re-initiate│
                                                          │ public key       │         │  └───────────┘
                                                          └────────┬─────────┘         │
                                                                   │ valid             │
                                                                   ▼                   │
                                                          ┌──────────────────┐         │
                                                          │ Compliance check │         │
                                                          │ (OFAC, mixers,   │         │
                                                          │  exploit addrs)  │         │
                                                          └────────┬─────────┘         │
                                                                   │ cleared           │
                                                                   ▼                   │
                                                          ┌──────────────────┐         │
                                                          │ WALLET LINKED    │         │
                                                          │ isVerified=true  │         │
                                                          │ complianceStatus │         │
                                                          │ = 'cleared'      │         │
                                                          └──────────────────┘         │
```

### Key Behaviors

1. **KMS-only key storage**: Private keys for managed wallets are **never** stored in plaintext. All key material is encrypted using AWS KMS envelope encryption. The `encryptedPrivateKey` field contains KMS ciphertext that can only be decrypted by the designated KMS key.
2. **Nonce expiration**: Wallet verification nonces expire after 5 minutes. Expired nonces cannot be used for verification — a new `initiateWalletLink` call is required.
3. **Compliance pre-screening**: Every wallet address is checked against OFAC sanctions lists, known mixer addresses (Tornado Cash), and exploit-associated addresses before linking. Flagged addresses are blocked from receiving tokens.
4. **Balance caching**: Wallet balances are cached in Redis for 10 seconds to reduce RPC overhead. The `refreshBalanceCache` method forces an immediate RPC fetch.
5. **HD derivation**: Venture wallets use HD derivation from a master seed stored in KMS. Child wallets for different purposes (treasury, rewards, staking) are derived at sequential indices under hardened paths.
6. **Transaction batching**: The `batchSignAndSend` method groups up to 15 instructions per Solana transaction for fee efficiency. Larger batches are split into multiple transactions.

---

## Module: tokens

### Purpose

Manages all SPL token operations within the MCV ecosystem, centered on the EDGE token — the ecosystem-wide utility and governance token. Handles token minting (controlled by program authority), burning (deflationary mechanics), transfers with fee estimation, vesting schedule management with cliff/linear/milestone configurations, airdrop campaigns with Merkle tree verification, and token supply tracking with periodic snapshots.

### Database Schema

```typescript
// web3_token_mints — Token Mint Registry
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
  isNative: boolean('is_native').default(false),          // Is this the ecosystem's own token?
  logoUrl: text('logo_url'),
  coingeckoId: text('coingecko_id'),                      // For price feed
  jupiterVerified: boolean('jupiter_verified').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_token_accounts — Associated Token Accounts
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
});

// web3_token_transfers — Transfer History
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
});

// web3_vesting_schedules — Vesting Schedule Definitions
export const vestingSchedules = pgTable('web3_vesting_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  name: text('name').notNull(),                           // "Team Vesting - Year 1"
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
  vestingIntervalDays: integer('vesting_interval_days').default(30), // Release frequency
  milestones: jsonb('milestones'),
  // [{ date: '2026-06-01', amount: '100000', description: 'Q2 milestone' }, ...]
  status: text('status').default('pending'),              // pending | active | completed | cancelled | paused
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelledBy: uuid('cancelled_by'),
  escrowAddress: text('escrow_address'),                  // PDA holding vested tokens
  onChainAccount: text('on_chain_account'),               // Solana account for on-chain vesting
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_vesting_claims — Individual Vesting Claims
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
});

// web3_airdrop_campaigns — Airdrop Distribution Campaigns
export const airdropCampaigns = pgTable('web3_airdrop_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  name: text('name').notNull(),                           // "EDGE Genesis Airdrop"
  description: text('description'),
  totalAmount: numeric('total_amount', { precision: 30, scale: 0 }).notNull(),
  claimedAmount: numeric('claimed_amount', { precision: 30, scale: 0 }).default('0'),
  recipientCount: integer('recipient_count').notNull(),
  merkleRoot: text('merkle_root').notNull(),              // Root of the Merkle tree
  merkleTreeUrl: text('merkle_tree_url'),                 // S3 URL for full Merkle tree data
  status: text('status').default('draft'),                // draft | active | paused | completed | expired
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  claimDeadline: timestamp('claim_deadline', { withTimezone: true }),
  requiresKyc: boolean('requires_kyc').default(false),
  onChainProgramId: text('on_chain_program_id'),          // Airdrop distributor program
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_airdrop_claims — Individual Airdrop Claims
export const airdropClaims = pgTable('web3_airdrop_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => airdropCampaigns.id),
  claimantAddress: text('claimant_address').notNull(),
  claimantUserId: uuid('claimant_user_id'),
  amount: numeric('amount', { precision: 30, scale: 0 }).notNull(),
  merkleProof: jsonb('merkle_proof').notNull(),           // Array of proof hashes
  merkleIndex: integer('merkle_index').notNull(),         // Leaf index in tree
  status: text('status').default('unclaimed'),            // unclaimed | claimed | expired | ineligible
  txSignature: text('tx_signature'),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_token_allocations — Token Allocation Buckets
export const tokenAllocations = pgTable('web3_token_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  name: text('name').notNull(),                           // "Community Rewards", "Team", "Treasury"
  percentage: numeric('percentage', { precision: 5, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 30, scale: 0 }).notNull(),
  distributedAmount: numeric('distributed_amount', { precision: 30, scale: 0 }).default('0'),
  remainingAmount: numeric('remaining_amount', { precision: 30, scale: 0 }),
  vestingScheduleId: uuid('vesting_schedule_id').references(() => vestingSchedules.id),
  walletAddress: text('wallet_address'),                  // Holding wallet for this allocation
  isLocked: boolean('is_locked').default(true),
  unlockDate: timestamp('unlock_date', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_token_burns — Token Burn Event Log
export const tokenBurns = pgTable('web3_token_burns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  amount: numeric('amount', { precision: 30, scale: 0 }).notNull(),
  burnType: text('burn_type').notNull(),                  // manual | fee_burn | buyback_burn | scheduled
  txSignature: text('tx_signature').notNull(),
  burnedBy: uuid('burned_by'),
  reason: text('reason'),
  preBurnSupply: numeric('pre_burn_supply', { precision: 30, scale: 0 }),
  postBurnSupply: numeric('post_burn_supply', { precision: 30, scale: 0 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_token_supply_snapshots — Circulating Supply History
export const tokenSupplySnapshots = pgTable('web3_token_supply_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  totalSupply: numeric('total_supply', { precision: 30, scale: 0 }).notNull(),
  circulatingSupply: numeric('circulating_supply', { precision: 30, scale: 0 }).notNull(),
  stakedSupply: numeric('staked_supply', { precision: 30, scale: 0 }).default('0'),
  lockedSupply: numeric('locked_supply', { precision: 30, scale: 0 }).default('0'),  // Vesting + locked
  burnedSupply: numeric('burned_supply', { precision: 30, scale: 0 }).default('0'),
  treasuryHeld: numeric('treasury_held', { precision: 30, scale: 0 }).default('0'),
  priceUsd: numeric('price_usd', { precision: 20, scale: 10 }),
  marketCapUsd: numeric('market_cap_usd', { precision: 20, scale: 2 }),
  volume24hUsd: numeric('volume_24h_usd', { precision: 20, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class TokenService {
  // ── Mint Operations ──────────────────────────────────────────────────
  mintTokens(input: MintTokenInput): Promise<{ txSignature: string; newSupply: string }>;
  burnTokens(input: BurnTokenInput): Promise<{ txSignature: string; burnEvent: TokenBurn }>;

  // ── Transfer Operations ──────────────────────────────────────────────
  transfer(input: TransferTokenInput): Promise<{ txSignature: string; transfer: TokenTransfer }>;
  batchTransfer(inputs: TransferTokenInput[]): Promise<BatchTransferResult>;
  createAssociatedTokenAccount(ownerAddress: string, mintAddress: string): Promise<string>;

  // ── Vesting ──────────────────────────────────────────────────────────
  createVestingSchedule(input: CreateVestingInput): Promise<VestingSchedule>;
  getClaimableAmount(scheduleId: string): Promise<{ amount: string; nextClaimDate: Date }>;
  claimVestedTokens(scheduleId: string): Promise<{ txSignature: string; claim: VestingClaim }>;
  cancelVesting(scheduleId: string, reason: string): Promise<VestingSchedule>;

  // ── Airdrops ─────────────────────────────────────────────────────────
  createAirdropCampaign(input: CreateAirdropInput): Promise<AirdropCampaign>;
  generateMerkleTree(campaignId: string, recipients: AirdropRecipient[]): Promise<{ root: string; treeUrl: string }>;
  claimAirdrop(campaignId: string, claimantAddress: string, proof: string[]): Promise<{ txSignature: string }>;
  getAirdropStatus(campaignId: string): Promise<AirdropStatus>;

  // ── Supply Tracking ──────────────────────────────────────────────────
  getCirculatingSupply(mintAddress: string): Promise<SupplyBreakdown>;
  snapshotSupply(mintAddress: string): Promise<TokenSupplySnapshot>;
  getAllocations(mintId: string): Promise<TokenAllocation[]>;
}
```

### Vesting Schedule Types

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
  0% ┤────╱──────────────────      0% ┤────┘──────────────────
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

### Key Behaviors

1. **Mint authority validation**: Only the designated mint authority address can mint new tokens. The service verifies the signing wallet matches the `mintAuthority` on the token mint before executing.
2. **Burn accounting**: Every burn event records pre- and post-burn supply for audit. The `circulatingSupply` on `tokenMints` is atomically decremented in the same database transaction.
3. **Merkle tree verification**: Airdrop claims are verified using a Merkle proof against the stored root. The on-chain distributor program performs the same verification, preventing double-claims.
4. **ATA auto-creation**: When transferring tokens to a wallet that doesn't have an Associated Token Account for the token, the service automatically creates the ATA (funded by the sender).
5. **Supply snapshots**: The cron job `tokenSupplySnapshot` runs every 6 hours, recording total supply, circulating supply, staked, locked, and burned amounts for historical tracking and ACS regime detection.
6. **Vesting cliff**: For cliff-based vesting, zero tokens are claimable before the cliff date. On the cliff date, the cliff amount becomes immediately claimable, and the remaining amount vests linearly thereafter.

---

## Module: contracts

### Purpose

Manages the lifecycle of Solana programs (smart contracts) deployed by the MCV ecosystem. Handles Anchor-based program deployment, versioned upgrades with rollback capability, IDL (Interface Definition Language) management for client-side type safety, cross-program invocation (CPI) tracking, and upgrade authority management with multi-sig requirements for production programs.

### Database Schema

```typescript
// web3_deployed_programs — Program Registry
export const deployedPrograms = pgTable('web3_deployed_programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  programId: text('program_id').notNull().unique(),       // Solana program address
  name: text('name').notNull(),                           // "edge-staking-vault", "airdrop-distributor"
  description: text('description'),
  framework: text('framework').notNull(),                 // anchor | native | seahorse
  cluster: text('cluster').notNull(),                     // mainnet-beta | devnet | testnet
  currentVersion: text('current_version').notNull(),      // "1.2.0"
  status: programStatusEnum('status').default('active'),  // active | paused | deprecated
  upgradeAuthorityAddress: text('upgrade_authority_address').notNull(),
  isMultisigUpgrade: boolean('is_multisig_upgrade').default(true),
  bufferAddress: text('buffer_address'),                  // Active upgrade buffer (if upgrading)
  deployedAt: timestamp('deployed_at', { withTimezone: true }),
  lastUpgradedAt: timestamp('last_upgraded_at', { withTimezone: true }),
  auditStatus: text('audit_status').default('unaudited'), // unaudited | in_review | audited
  auditReportUrl: text('audit_report_url'),
  sourceCodeUrl: text('source_code_url'),                 // GitHub repo link
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_program_versions — Version History
export const programVersions = pgTable('web3_program_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id').notNull().references(() => deployedPrograms.id),
  version: text('version').notNull(),                     // "1.2.0"
  changelog: text('changelog'),
  binaryHash: text('binary_hash').notNull(),              // SHA-256 of deployed binary
  binaryUrl: text('binary_url'),                          // S3 URL for verified binary
  deployTxSignature: text('deploy_tx_signature'),
  deployedBy: uuid('deployed_by'),
  deployedAt: timestamp('deployed_at', { withTimezone: true }),
  previousVersion: text('previous_version'),
  isActive: boolean('is_active').default(false),          // Only one active version
  rollbackAvailable: boolean('rollback_available').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_program_idls — Interface Definition Language Storage
export const programIdls = pgTable('web3_program_idls', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id').notNull().references(() => deployedPrograms.id),
  version: text('version').notNull(),
  idlJson: jsonb('idl_json').notNull(),                   // Full Anchor IDL
  idlHash: text('idl_hash').notNull(),                    // SHA-256 of IDL JSON
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  isActive: boolean('is_active').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_program_authorities — Upgrade Authority Registry
export const programAuthorities = pgTable('web3_program_authorities', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id').notNull().references(() => deployedPrograms.id),
  authorityAddress: text('authority_address').notNull(),
  authorityType: text('authority_type').notNull(),        // upgrade | freeze | close
  isMultisig: boolean('is_multisig').default(false),
  multisigThreshold: integer('multisig_threshold'),
  multisigSigners: jsonb('multisig_signers'),             // Array of signer addresses
  isActive: boolean('is_active').default(true),
  grantedAt: timestamp('granted_at', { withTimezone: true }),
  grantedBy: uuid('granted_by'),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_program_invocations — CPI Invocation Log
export const programInvocations = pgTable('web3_program_invocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  callerProgramId: uuid('caller_program_id').references(() => deployedPrograms.id),
  calleeProgramId: uuid('callee_program_id').references(() => deployedPrograms.id),
  txSignature: text('tx_signature').notNull(),
  instruction: text('instruction').notNull(),             // "stake", "transfer", "vote"
  accounts: jsonb('accounts'),                            // Accounts involved in the CPI
  data: jsonb('data'),                                    // Instruction data
  success: boolean('success').default(true),
  errorCode: text('error_code'),
  computeUnits: integer('compute_units'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_program_deployments — Deployment Execution Log
export const programDeployments = pgTable('web3_program_deployments', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id').references(() => deployedPrograms.id),
  deploymentType: text('deployment_type').notNull(),      // initial | upgrade | rollback
  status: text('status').default('pending'),              // pending | deploying | verifying | completed | failed
  binaryHash: text('binary_hash').notNull(),
  bufferAddress: text('buffer_address'),
  txSignatures: jsonb('tx_signatures'),                   // Array of signatures (deploy can be multi-tx)
  initiatedBy: uuid('initiated_by').notNull(),
  approvedBy: jsonb('approved_by'),                       // Array of approver user IDs
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  verificationResult: jsonb('verification_result'),       // Post-deploy verification
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class ContractService {
  // ── Program Deployment ───────────────────────────────────────────────
  deployProgram(input: DeployProgramInput): Promise<{ deployment: ProgramDeployment; program: DeployedProgram }>;
  upgradeProgram(input: UpgradeProgramInput): Promise<{ deployment: ProgramDeployment; version: ProgramVersion }>;
  rollbackProgram(programId: string, targetVersion: string): Promise<ProgramDeployment>;

  // ── IDL Management ───────────────────────────────────────────────────
  uploadIdl(programId: string, idlJson: object): Promise<ProgramIdl>;
  getActiveIdl(programId: string): Promise<ProgramIdl>;
  fetchIdlFromChain(programAddress: string): Promise<object>;

  // ── Authority Management ─────────────────────────────────────────────
  transferUpgradeAuthority(programId: string, newAuthority: string): Promise<ProgramAuthority>;
  setMultisigAuthority(programId: string, signers: string[], threshold: number): Promise<ProgramAuthority>;
  revokeAuthority(programId: string, authorityType: string): Promise<void>;

  // ── Cross-Program Invocation ─────────────────────────────────────────
  invokeProgram(input: InvokeProgramInput): Promise<{ txSignature: string; result: any }>;
  getInvocationHistory(programId: string, options?: PaginationOptions): Promise<PaginatedResult<ProgramInvocation>>;

  // ── Registry ─────────────────────────────────────────────────────────
  listPrograms(options?: ListProgramsOptions): Promise<DeployedProgram[]>;
  getProgram(programId: string): Promise<DeployedProgram & { versions: ProgramVersion[]; authorities: ProgramAuthority[] }>;
  verifyDeployment(programId: string): Promise<VerificationResult>;
}
```

### Key Behaviors

1. **Multi-sig upgrade requirement**: All production (mainnet-beta) programs require multi-sig approval for upgrades. The deployment pipeline collects signatures from the required threshold of signers before executing.
2. **Binary verification**: After every deployment, the service fetches the on-chain program binary and compares its SHA-256 hash against the expected hash to verify the correct code was deployed.
3. **IDL auto-fetch**: When an Anchor program's IDL is stored on-chain (via `anchor idl init`), the service can fetch it directly and cache it locally for type-safe client generation.
4. **Rollback safety**: Rollbacks re-deploy a previous verified binary. The system keeps the last 5 version binaries in S3 for rollback capability.
5. **CPI logging**: Cross-program invocations are logged with full account and data information for debugging and audit purposes. Compute unit usage is tracked for optimization.
6. **Deployment pipeline**: `pending → deploying → verifying → completed`. The verifying step runs an on-chain check to confirm the deployed code matches the intended binary.

---

## Module: staking

### Purpose

Implements the EDGE token staking infrastructure including managed staking pools, validator delegation, yield calculation with compounding, cooldown periods for unstaking, reward distribution via the Algorithmic Control System (ACS), and liquid staking derivatives (stEDGE) for DeFi composability.

Staking is a core economic mechanic: it locks EDGE tokens to secure the ecosystem, reduce circulating supply, and reward long-term participants. The ACS dynamically adjusts staking APY based on the market cap regime — higher APY during launch/growth phases, lower during maturity.

### Database Schema

```typescript
// web3_staking_pools — Staking Pool Definitions
export const stakingPools = pgTable('web3_staking_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  name: text('name').notNull(),                           // "EDGE Main Staking Pool"
  description: text('description'),
  poolAddress: text('pool_address').notNull().unique(),   // On-chain staking vault PDA
  rewardMintId: uuid('reward_mint_id').references(() => tokenMints.id), // Can be same or different token
  status: stakingPoolStatusEnum('status').default('active'),
  currentApy: numeric('current_apy', { precision: 8, scale: 4 }).notNull(), // e.g., "25.0000" = 25%
  minStakeAmount: numeric('min_stake_amount', { precision: 30, scale: 0 }).default('1000000000'), // 1 EDGE (9 decimals)
  maxStakeAmount: numeric('max_stake_amount', { precision: 30, scale: 0 }),
  totalStaked: numeric('total_staked', { precision: 30, scale: 0 }).default('0'),
  totalRewardsDistributed: numeric('total_rewards_distributed', { precision: 30, scale: 0 }).default('0'),
  rewardRate: numeric('reward_rate', { precision: 20, scale: 10 }),  // Tokens per second
  cooldownPeriodDays: integer('cooldown_period_days').default(7),
  lockupPeriodDays: integer('lockup_period_days').default(0),        // Minimum lock before unstake
  compoundingEnabled: boolean('compounding_enabled').default(true),
  compoundingFrequency: text('compounding_frequency').default('daily'), // daily | weekly | epoch
  liquidStakingEnabled: boolean('liquid_staking_enabled').default(false),
  liquidStakingMintId: uuid('liquid_staking_mint_id').references(() => tokenMints.id),
  maxCapacity: numeric('max_capacity', { precision: 30, scale: 0 }),
  programId: text('program_id'),                          // On-chain staking program address
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_stakes — Active Stake Positions
export const stakes = pgTable('web3_stakes', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => stakingPools.id),
  stakerAddress: text('staker_address').notNull(),
  stakerUserId: uuid('staker_user_id'),
  amount: numeric('amount', { precision: 30, scale: 0 }).notNull(),
  stakedAt: timestamp('staked_at', { withTimezone: true }).notNull(),
  lockExpiresAt: timestamp('lock_expires_at', { withTimezone: true }),
  lastRewardAt: timestamp('last_reward_at', { withTimezone: true }),
  accumulatedRewards: numeric('accumulated_rewards', { precision: 30, scale: 0 }).default('0'),
  claimedRewards: numeric('claimed_rewards', { precision: 30, scale: 0 }).default('0'),
  pendingRewards: numeric('pending_rewards', { precision: 30, scale: 0 }).default('0'),
  liquidTokensMinted: numeric('liquid_tokens_minted', { precision: 30, scale: 0 }).default('0'),
  stakeTxSignature: text('stake_tx_signature').notNull(),
  status: text('status').default('active'),               // active | unstaking | unstaked | slashed
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_staking_rewards — Reward Distribution Records
export const stakingRewards = pgTable('web3_staking_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => stakingPools.id),
  stakeId: uuid('stake_id').notNull().references(() => stakes.id),
  epochNumber: integer('epoch_number'),
  rewardAmount: numeric('reward_amount', { precision: 30, scale: 0 }).notNull(),
  rewardType: text('reward_type').notNull(),              // base_yield | bonus | compounding | delegation
  txSignature: text('tx_signature'),
  distributedAt: timestamp('distributed_at', { withTimezone: true }),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  status: text('status').default('pending'),              // pending | distributed | claimed | forfeited
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_unstaking_requests — Cooldown Queue
export const unstakingRequests = pgTable('web3_unstaking_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  stakeId: uuid('stake_id').notNull().references(() => stakes.id),
  poolId: uuid('pool_id').notNull().references(() => stakingPools.id),
  amount: numeric('amount', { precision: 30, scale: 0 }).notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull(),
  cooldownEndsAt: timestamp('cooldown_ends_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  withdrawTxSignature: text('withdraw_tx_signature'),
  status: text('status').default('cooling_down'),         // cooling_down | ready | completed | cancelled
  liquidTokensBurned: numeric('liquid_tokens_burned', { precision: 30, scale: 0 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_validator_delegations — Validator Delegation Tracking
export const validatorDelegations = pgTable('web3_validator_delegations', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').references(() => stakingPools.id),
  validatorAddress: text('validator_address').notNull(),
  validatorName: text('validator_name'),
  delegatedAmount: numeric('delegated_amount', { precision: 30, scale: 0 }).notNull(),
  activationEpoch: integer('activation_epoch'),
  deactivationEpoch: integer('deactivation_epoch'),
  estimatedApy: numeric('estimated_apy', { precision: 8, scale: 4 }),
  commission: numeric('commission', { precision: 5, scale: 2 }),      // Validator commission %
  status: text('status').default('active'),               // activating | active | deactivating | deactivated
  txSignature: text('tx_signature'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_liquid_staking_tokens — Liquid Staking Derivatives
export const liquidStakingTokens = pgTable('web3_liquid_staking_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => stakingPools.id),
  mintAddress: text('mint_address').notNull().unique(),   // stEDGE mint
  symbol: text('symbol').notNull(),                       // "stEDGE"
  decimals: integer('decimals').default(9),
  totalMinted: numeric('total_minted', { precision: 30, scale: 0 }).default('0'),
  exchangeRate: numeric('exchange_rate', { precision: 20, scale: 10 }).default('1.0000000000'),
  lastExchangeRateUpdate: timestamp('last_exchange_rate_update', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_staking_epochs — Epoch-Level Staking Snapshots
export const stakingEpochs = pgTable('web3_staking_epochs', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => stakingPools.id),
  epochNumber: integer('epoch_number').notNull(),
  totalStaked: numeric('total_staked', { precision: 30, scale: 0 }).notNull(),
  totalRewards: numeric('total_rewards', { precision: 30, scale: 0 }).notNull(),
  stakerCount: integer('staker_count').notNull(),
  apy: numeric('apy', { precision: 8, scale: 4 }),
  startSlot: bigint('start_slot', { mode: 'number' }),
  endSlot: bigint('end_slot', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_reward_distributions — Batch Reward Distributions
export const rewardDistributions = pgTable('web3_reward_distributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => stakingPools.id),
  epochNumber: integer('epoch_number'),
  totalAmount: numeric('total_amount', { precision: 30, scale: 0 }).notNull(),
  recipientCount: integer('recipient_count').notNull(),
  txSignatures: jsonb('tx_signatures'),                   // Array of batch tx signatures
  status: text('status').default('pending'),              // pending | processing | completed | failed
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class StakingService {
  // ── Pool Management ──────────────────────────────────────────────────
  createPool(input: CreatePoolInput): Promise<StakingPool>;
  updatePoolApy(poolId: string, newApy: string, reason: string): Promise<StakingPool>;
  pausePool(poolId: string, reason: string): Promise<StakingPool>;
  resumePool(poolId: string): Promise<StakingPool>;

  // ── Staking Operations ───────────────────────────────────────────────
  stake(input: CreateStakeInput): Promise<{ stake: Stake; txSignature: string; liquidTokens?: string }>;
  unstake(input: UnstakeInput): Promise<{ request: UnstakingRequest; cooldownEndsAt: Date }>;
  completeUnstake(requestId: string): Promise<{ txSignature: string; amount: string }>;
  cancelUnstake(requestId: string): Promise<Stake>;

  // ── Rewards ──────────────────────────────────────────────────────────
  calculatePendingRewards(stakeId: string): Promise<{ amount: string; nextDistribution: Date }>;
  claimRewards(input: ClaimRewardsInput): Promise<{ txSignature: string; claimed: string }>;
  distributeEpochRewards(poolId: string, epochNumber: number): Promise<RewardDistribution>;
  compoundRewards(stakeId: string): Promise<{ newStakeAmount: string; compoundedReward: string }>;

  // ── Validator Delegation ─────────────────────────────────────────────
  delegateToValidator(input: DelegateStakeInput): Promise<ValidatorDelegation>;
  undelegateFromValidator(delegationId: string): Promise<ValidatorDelegation>;
  getValidatorPerformance(validatorAddress: string): Promise<ValidatorPerformance>;

  // ── Liquid Staking ───────────────────────────────────────────────────
  mintLiquidStakingTokens(stakeId: string): Promise<{ lstAmount: string; exchangeRate: string }>;
  redeemLiquidStakingTokens(amount: string): Promise<UnstakingRequest>;
  getExchangeRate(poolId: string): Promise<{ rate: string; updatedAt: Date }>;

  // ── Analytics ────────────────────────────────────────────────────────
  getPoolStats(poolId: string): Promise<PoolStats>;
  getStakingHistory(stakerAddress: string): Promise<StakingHistory>;
  getEpochSummary(poolId: string, epochNumber: number): Promise<StakingEpoch>;
}
```

### Yield Calculation

```typescript
// Yield calculation logic
function calculateReward(
  stakedAmount: bigint,
  apy: number,
  durationSeconds: number,
  compounding: 'none' | 'daily' | 'weekly'
): bigint {
  if (compounding === 'none') {
    // Simple interest: reward = principal × rate × time
    const annualReward = (stakedAmount * BigInt(Math.floor(apy * 10000))) / 10000n;
    return (annualReward * BigInt(durationSeconds)) / BigInt(365 * 24 * 3600);
  }
  
  // Compound interest: A = P(1 + r/n)^(nt)
  const periodsPerYear = compounding === 'daily' ? 365 : 52;
  const ratePerPeriod = apy / periodsPerYear;
  const totalPeriods = (durationSeconds / (365 * 24 * 3600)) * periodsPerYear;
  
  const compoundFactor = Math.pow(1 + ratePerPeriod, totalPeriods);
  const finalAmount = Number(stakedAmount) * compoundFactor;
  
  return BigInt(Math.floor(finalAmount)) - stakedAmount;
}
```

### Key Behaviors

1. **ACS-driven APY**: Staking APY is dynamically adjusted by the Algorithmic Control System based on the current market cap regime. Launch phase targets 25% APY; mature phase targets 5-8%.
2. **Cooldown enforcement**: Unstaking requires a cooldown period (default 7 days). During cooldown, tokens remain locked and earn no rewards. Users can cancel unstaking to resume earning.
3. **Liquid staking**: When liquid staking is enabled, stakers receive stEDGE tokens at the current exchange rate. stEDGE can be used in DeFi (LPs, lending) while the underlying EDGE continues earning staking rewards.
4. **Exchange rate growth**: The stEDGE/EDGE exchange rate increases over time as rewards accumulate. 1 stEDGE always represents more than 1 EDGE after staking rewards compound.
5. **Epoch-based distribution**: Rewards are calculated per epoch (aligned with Solana epochs ~2 days). Batch distribution processes all active stakes in a pool efficiently.
6. **Lockup periods**: Pools can enforce minimum lockup periods. Attempting to unstake before the lockup expires returns `STAKING_LOCKUP_ACTIVE` error.

---

## Module: governance

### Purpose

Implements on-chain governance for the EDGE token ecosystem. Supports proposal creation with rich metadata, token-weighted voting with delegation, timelock execution for approved proposals, snapshot-based voting power to prevent flash-loan attacks, and multi-sig treasury governance for high-value decisions.

### Database Schema

```typescript
// web3_governance_configs — Governance Configuration per Economy
export const governanceConfigs = pgTable('web3_governance_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id).unique(),
  tokenMintId: uuid('token_mint_id').notNull().references(() => tokenMints.id),
  governanceType: text('governance_type').notNull(),       // centralized | dao | hybrid
  proposalThreshold: numeric('proposal_threshold', { precision: 30, scale: 0 }).notNull(),
  // Minimum tokens to create a proposal (e.g., 10,000 EDGE)
  quorumPercentage: numeric('quorum_percentage', { precision: 5, scale: 2 }).notNull(),
  // Minimum participation for validity (e.g., "5.00" = 5%)
  votingPeriodHours: integer('voting_period_hours').default(72),
  timelockDelayHours: integer('timelock_delay_hours').default(24),
  executionWindowHours: integer('execution_window_hours').default(72),
  vetoAuthority: text('veto_authority'),                   // Address that can veto proposals
  guardianAddress: text('guardian_address'),                // Emergency pause authority
  snapshotBlockRequired: boolean('snapshot_block_required').default(true),
  allowDelegation: boolean('allow_delegation').default(true),
  maxActiveProposals: integer('max_active_proposals').default(10),
  programId: text('program_id'),                           // On-chain governance program
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_proposals — Governance Proposals
export const proposals = pgTable('web3_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  governanceConfigId: uuid('governance_config_id').notNull().references(() => governanceConfigs.id),
  proposalNumber: integer('proposal_number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),              // Full markdown description
  proposerAddress: text('proposer_address').notNull(),
  proposerUserId: uuid('proposer_user_id'),
  category: text('category').notNull(),                    // treasury | parameter | upgrade | grant | other
  status: proposalStatusEnum('status').default('draft'),   // draft | active | passed | rejected | executed | expired | vetoed
  executionPayload: jsonb('execution_payload'),
  // { type: 'treasury_transfer', params: { to: 'addr', amount: '1000000', token: 'EDGE' } }
  // { type: 'parameter_change', params: { controller: 'staking_apy', newValue: 15.0 } }
  snapshotSlot: bigint('snapshot_slot', { mode: 'number' }),
  votingStartsAt: timestamp('voting_starts_at', { withTimezone: true }),
  votingEndsAt: timestamp('voting_ends_at', { withTimezone: true }),
  executionEta: timestamp('execution_eta', { withTimezone: true }),  // After timelock
  executedAt: timestamp('executed_at', { withTimezone: true }),
  executionTxSignature: text('execution_tx_signature'),
  forVotes: numeric('for_votes', { precision: 30, scale: 0 }).default('0'),
  againstVotes: numeric('against_votes', { precision: 30, scale: 0 }).default('0'),
  abstainVotes: numeric('abstain_votes', { precision: 30, scale: 0 }).default('0'),
  totalVoters: integer('total_voters').default(0),
  quorumReached: boolean('quorum_reached').default(false),
  vetoedAt: timestamp('vetoed_at', { withTimezone: true }),
  vetoedBy: text('vetoed_by'),
  vetoReason: text('veto_reason'),
  discussionUrl: text('discussion_url'),                   // Link to forum/Discord discussion
  ipfsHash: text('ipfs_hash'),                             // IPFS hash of full proposal content
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_votes — Individual Votes
export const votes = pgTable('web3_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').notNull().references(() => proposals.id),
  voterAddress: text('voter_address').notNull(),
  voterUserId: uuid('voter_user_id'),
  voteType: voteTypeEnum('vote_type').notNull(),           // for | against | abstain
  votingPower: numeric('voting_power', { precision: 30, scale: 0 }).notNull(),
  isDelegated: boolean('is_delegated').default(false),
  delegatedFrom: text('delegated_from'),                   // Original token holder address
  reason: text('reason'),                                  // Optional vote rationale
  txSignature: text('tx_signature'),
  votedAt: timestamp('voted_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_voting_delegations — Voting Power Delegation
export const votingDelegations = pgTable('web3_voting_delegations', {
  id: uuid('id').primaryKey().defaultRandom(),
  governanceConfigId: uuid('governance_config_id').notNull().references(() => governanceConfigs.id),
  delegatorAddress: text('delegator_address').notNull(),
  delegateAddress: text('delegate_address').notNull(),
  delegatedPower: numeric('delegated_power', { precision: 30, scale: 0 }),
  isActive: boolean('is_active').default(true),
  delegatedAt: timestamp('delegated_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  txSignature: text('tx_signature'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_timelock_queues — Timelock Execution Queue
export const timelockQueues = pgTable('web3_timelock_queues', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').notNull().references(() => proposals.id),
  executionPayload: jsonb('execution_payload').notNull(),
  eta: timestamp('eta', { withTimezone: true }).notNull(),  // Earliest execution time
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  executionTxSignature: text('execution_tx_signature'),
  status: text('status').default('queued'),                // queued | ready | executed | expired | cancelled
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_governance_snapshots — Token Balance Snapshots for Voting
export const governanceSnapshots = pgTable('web3_governance_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  governanceConfigId: uuid('governance_config_id').notNull().references(() => governanceConfigs.id),
  snapshotSlot: bigint('snapshot_slot', { mode: 'number' }).notNull(),
  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  totalEligibleSupply: numeric('total_eligible_supply', { precision: 30, scale: 0 }).notNull(),
  holderCount: integer('holder_count').notNull(),
  balances: jsonb('balances'),                             // { address: balance } map (stored in S3 for large sets)
  balancesUrl: text('balances_url'),                       // S3 URL for large balance snapshots
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class GovernanceService {
  // ── Proposal Management ──────────────────────────────────────────────
  createProposal(input: CreateProposalInput): Promise<Proposal>;
  activateProposal(proposalId: string): Promise<Proposal>;
  cancelProposal(proposalId: string, reason: string): Promise<Proposal>;

  // ── Voting ───────────────────────────────────────────────────────────
  castVote(input: CastVoteInput): Promise<Vote>;
  getVotingPower(address: string, snapshotSlot: number): Promise<{ power: string; delegatedPower: string }>;
  getProposalResults(proposalId: string): Promise<ProposalResults>;

  // ── Delegation ───────────────────────────────────────────────────────
  delegateVotingPower(input: DelegateVotingInput): Promise<VotingDelegation>;
  revokeDelegation(delegationId: string): Promise<VotingDelegation>;
  getDelegations(address: string): Promise<{ delegatedTo: VotingDelegation[]; receivedFrom: VotingDelegation[] }>;

  // ── Execution ────────────────────────────────────────────────────────
  queueForExecution(proposalId: string): Promise<TimelockEntry>;
  executeProposal(input: ExecuteProposalInput): Promise<{ txSignature: string; result: any }>;
  vetoProposal(proposalId: string, reason: string): Promise<Proposal>;

  // ── Snapshots ────────────────────────────────────────────────────────
  takeSnapshot(governanceConfigId: string): Promise<GovernanceSnapshot>;
  getSnapshot(snapshotSlot: number): Promise<GovernanceSnapshot>;

  // ── Configuration ────────────────────────────────────────────────────
  updateGovernanceConfig(configId: string, updates: Partial<GovernanceConfig>): Promise<GovernanceConfig>;
  getGovernanceConfig(ventureId: string): Promise<GovernanceConfig>;
}
```

### Proposal Lifecycle State Machine

```
┌──────────┐    activate    ┌──────────┐    voting ends    ┌───────────────┐
│          │───────────────▶│          │──────────────────▶│ Tally Votes   │
│  DRAFT   │                │  ACTIVE  │                   │               │
│          │                │ (voting) │                   │ quorum met?   │
└──────────┘                └──────────┘                   │ majority for? │
                                 │                         └───────┬───────┘
                                 │ veto                            │
                                 ▼                    ┌────────────┼────────────┐
                          ┌──────────┐                │ YES                     │ NO
                          │  VETOED  │                ▼                         ▼
                          └──────────┘         ┌──────────┐             ┌──────────┐
                                               │  PASSED  │             │ REJECTED │
                                               └────┬─────┘             └──────────┘
                                                    │ queue
                                                    ▼
                                               ┌──────────┐    timelock    ┌──────────┐
                                               │ TIMELOCK │──────────────▶│  READY   │
                                               │ (24h+)   │               │          │
                                               └──────────┘               └────┬─────┘
                                                                               │ execute
                                                                               ▼
                                                                          ┌──────────┐
                                                                          │ EXECUTED │
                                                                          └──────────┘
                                                                               │ window expires
                                                                               ▼
                                                                          ┌──────────┐
                                                                          │ EXPIRED  │
                                                                          └──────────┘
```

### Key Behaviors

1. **Snapshot-based voting**: Voting power is determined by token balance at the proposal's snapshot slot, not the current balance. This prevents flash-loan attacks where an attacker borrows tokens to vote.
2. **Quorum validation**: A proposal only passes if the total votes cast (for + against + abstain) meet the quorum threshold (% of eligible supply). The quorum percentage is ACS-controlled and varies by market cap regime.
3. **Timelock enforcement**: Passed proposals enter a timelock queue with a minimum delay (default 24 hours) before execution. This gives the community time to react and allows the veto authority to cancel malicious proposals.
4. **Delegation chains**: Delegation is single-level — you can delegate your voting power to another address, but that address cannot re-delegate your power further.
5. **Veto authority**: The guardian/veto authority (initially the MCV core team) can veto any proposal during the voting period or timelock. This is a safety mechanism that is progressively decentralized.
6. **Proposal categories**: Treasury, parameter change, program upgrade, and grant proposals each have different execution paths. Treasury proposals execute fund transfers; parameter proposals update ACS controllers.

---

## Module: defi

### Purpose

Integrates with Solana DeFi protocols to manage the ecosystem's liquidity positions, execute token swaps, run yield farming strategies, and track impermanent loss. Supports Raydium (AMM and CLMM pools), Orca (Whirlpools for concentrated liquidity), Jupiter (DEX aggregator for best-route swaps), and Meteora (dynamic pools).

### Database Schema

```typescript
// web3_liquidity_positions — Active LP Positions
export const liquidityPositions = pgTable('web3_liquidity_positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  poolId: uuid('pool_id').notNull().references(() => liquidityPools.id),
  walletAddress: text('wallet_address').notNull(),
  positionAddress: text('position_address'),               // On-chain position account (for concentrated LP)
  tokenADeposited: numeric('token_a_deposited', { precision: 30, scale: 0 }).notNull(),
  tokenBDeposited: numeric('token_b_deposited', { precision: 30, scale: 0 }).notNull(),
  lpTokensMinted: numeric('lp_tokens_minted', { precision: 30, scale: 0 }),
  currentValueUsd: numeric('current_value_usd', { precision: 20, scale: 2 }),
  entryPriceRatio: numeric('entry_price_ratio', { precision: 20, scale: 10 }),
  lowerTick: integer('lower_tick'),                        // For concentrated liquidity
  upperTick: integer('upper_tick'),                        // For concentrated liquidity
  inRange: boolean('in_range').default(true),
  feesEarnedA: numeric('fees_earned_a', { precision: 30, scale: 0 }).default('0'),
  feesEarnedB: numeric('fees_earned_b', { precision: 30, scale: 0 }).default('0'),
  impermanentLossUsd: numeric('impermanent_loss_usd', { precision: 20, scale: 2 }).default('0'),
  status: text('status').default('active'),                // active | closed | migrated
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  openTxSignature: text('open_tx_signature'),
  closeTxSignature: text('close_tx_signature'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_liquidity_pools — Tracked Liquidity Pools
export const liquidityPools = pgTable('web3_liquidity_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  dex: dexEnum('dex').notNull(),                           // raydium | orca | jupiter | meteora
  poolAddress: text('pool_address').notNull().unique(),
  tokenAMint: text('token_a_mint').notNull(),
  tokenBMint: text('token_b_mint').notNull(),
  tokenASymbol: text('token_a_symbol').notNull(),
  tokenBSymbol: text('token_b_symbol').notNull(),
  poolType: text('pool_type').notNull(),                   // amm | clmm | concentrated | stable
  feeTier: numeric('fee_tier', { precision: 8, scale: 6 }), // 0.003000 = 0.3%
  tvlUsd: numeric('tvl_usd', { precision: 20, scale: 2 }),
  volume24hUsd: numeric('volume_24h_usd', { precision: 20, scale: 2 }),
  apr: numeric('apr', { precision: 10, scale: 4 }),
  isOfficial: boolean('is_official').default(false),       // Is this an MCV-managed pool?
  isActive: boolean('is_active').default(true),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_swap_transactions — Swap Execution History
export const swapTransactions = pgTable('web3_swap_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: text('wallet_address').notNull(),
  dex: dexEnum('dex').notNull(),
  inputMint: text('input_mint').notNull(),
  outputMint: text('output_mint').notNull(),
  inputAmount: numeric('input_amount', { precision: 30, scale: 0 }).notNull(),
  outputAmount: numeric('output_amount', { precision: 30, scale: 0 }).notNull(),
  expectedOutputAmount: numeric('expected_output_amount', { precision: 30, scale: 0 }),
  slippageBps: integer('slippage_bps'),                    // Basis points (50 = 0.5%)
  priceImpact: numeric('price_impact', { precision: 10, scale: 6 }),
  route: jsonb('route'),                                   // Jupiter route info (hops)
  txSignature: text('tx_signature').notNull(),
  fee: numeric('fee', { precision: 20, scale: 9 }),
  status: text('status').default('pending'),               // pending | confirmed | failed
  executedAt: timestamp('executed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_yield_farm_positions — Yield Farming Positions
export const yieldFarmPositions = pgTable('web3_yield_farm_positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  strategyId: uuid('strategy_id').references(() => yieldStrategies.id),
  poolAddress: text('pool_address').notNull(),
  farmAddress: text('farm_address').notNull(),
  walletAddress: text('wallet_address').notNull(),
  stakedLpTokens: numeric('staked_lp_tokens', { precision: 30, scale: 0 }).notNull(),
  pendingRewards: jsonb('pending_rewards'),                // { token: amount } map
  harvestedRewards: jsonb('harvested_rewards'),
  currentValueUsd: numeric('current_value_usd', { precision: 20, scale: 2 }),
  realizedPnl: numeric('realized_pnl', { precision: 20, scale: 2 }).default('0'),
  status: text('status').default('active'),                // active | harvested | exited
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_yield_strategies — Configured Yield Strategies
export const yieldStrategies = pgTable('web3_yield_strategies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  name: text('name').notNull(),                            // "EDGE-USDC LP Farm"
  description: text('description'),
  dex: dexEnum('dex').notNull(),
  poolAddress: text('pool_address').notNull(),
  farmAddress: text('farm_address'),
  strategyType: text('strategy_type').notNull(),           // lp_farm | single_stake | leveraged | auto_compound
  riskLevel: text('risk_level').notNull(),                 // low | medium | high
  targetApr: numeric('target_apr', { precision: 10, scale: 4 }),
  maxAllocationUsd: numeric('max_allocation_usd', { precision: 20, scale: 2 }),
  currentAllocationUsd: numeric('current_allocation_usd', { precision: 20, scale: 2 }).default('0'),
  autoCompound: boolean('auto_compound').default(false),
  autoCompoundFrequency: text('auto_compound_frequency'),  // hourly | daily | weekly
  rebalanceThreshold: numeric('rebalance_threshold', { precision: 5, scale: 2 }), // % drift before rebalance
  isActive: boolean('is_active').default(true),
  approvedBy: uuid('approved_by'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_impermanent_loss_tracking — IL Monitoring
export const impermanentLossTracking = pgTable('web3_impermanent_loss_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  positionId: uuid('position_id').notNull().references(() => liquidityPositions.id),
  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  tokenAPriceUsd: numeric('token_a_price_usd', { precision: 20, scale: 10 }),
  tokenBPriceUsd: numeric('token_b_price_usd', { precision: 20, scale: 10 }),
  priceRatio: numeric('price_ratio', { precision: 20, scale: 10 }),
  hodlValueUsd: numeric('hodl_value_usd', { precision: 20, scale: 2 }),
  lpValueUsd: numeric('lp_value_usd', { precision: 20, scale: 2 }),
  ilPercentage: numeric('il_percentage', { precision: 10, scale: 6 }),
  ilAmountUsd: numeric('il_amount_usd', { precision: 20, scale: 2 }),
  feesEarnedUsd: numeric('fees_earned_usd', { precision: 20, scale: 2 }),
  netPnlUsd: numeric('net_pnl_usd', { precision: 20, scale: 2 }),  // LP value + fees - hodl value
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_protocol_integrations — External Protocol Connections
export const protocolIntegrations = pgTable('web3_protocol_integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  protocolName: text('protocol_name').notNull(),           // "Raydium", "Orca", "Jupiter"
  protocolVersion: text('protocol_version'),
  programId: text('program_id').notNull(),                 // On-chain program address
  apiBaseUrl: text('api_base_url'),
  status: text('status').default('active'),
  lastHealthCheck: timestamp('last_health_check', { withTimezone: true }),
  config: jsonb('config'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_defi_snapshots — Position Value Snapshots
export const defiSnapshots = pgTable('web3_defi_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  totalLpValueUsd: numeric('total_lp_value_usd', { precision: 20, scale: 2 }),
  totalFarmValueUsd: numeric('total_farm_value_usd', { precision: 20, scale: 2 }),
  totalPendingRewardsUsd: numeric('total_pending_rewards_usd', { precision: 20, scale: 2 }),
  totalIlUsd: numeric('total_il_usd', { precision: 20, scale: 2 }),
  positions: jsonb('positions'),                           // Snapshot of all position values
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class DefiService {
  // ── Liquidity Management ─────────────────────────────────────────────
  addLiquidity(input: AddLiquidityInput): Promise<{ position: LiquidityPosition; txSignature: string }>;
  removeLiquidity(input: RemoveLiquidityInput): Promise<{ tokenAReceived: string; tokenBReceived: string; txSignature: string }>;
  adjustRange(positionId: string, newLower: number, newUpper: number): Promise<LiquidityPosition>;
  collectFees(positionId: string): Promise<{ feesA: string; feesB: string; txSignature: string }>;

  // ── Swaps ────────────────────────────────────────────────────────────
  getSwapQuote(input: SwapQuoteInput): Promise<SwapQuote>;
  executeSwap(input: SwapTokenInput): Promise<{ swap: SwapTransaction; txSignature: string }>;
  getBestRoute(inputMint: string, outputMint: string, amount: string): Promise<SwapRoute>;

  // ── Yield Farming ────────────────────────────────────────────────────
  enterFarm(input: CreateFarmPositionInput): Promise<YieldFarmPosition>;
  exitFarm(positionId: string): Promise<{ rewards: Record<string, string>; txSignature: string }>;
  harvestRewards(positionId: string): Promise<{ rewards: Record<string, string>; txSignature: string }>;
  compoundFarmRewards(positionId: string): Promise<YieldFarmPosition>;

  // ── Strategy Management ──────────────────────────────────────────────
  createStrategy(input: CreateStrategyInput): Promise<YieldStrategy>;
  executeStrategy(strategyId: string): Promise<StrategyExecutionResult>;
  rebalanceStrategy(strategyId: string): Promise<RebalanceResult>;

  // ── Analytics ────────────────────────────────────────────────────────
  getImpermanent
LossData(positionId: string): Promise<ImpermanentLossData[]>;
  getPortfolioSummary(ventureId: string): Promise<DeFiPortfolioSummary>;
  getPoolMetrics(poolAddress: string): Promise<PoolMetrics>;
  snapshotPositions(ventureId: string): Promise<DefiSnapshot>;
}
```

### Key Behaviors

1. **Jupiter routing**: All swaps go through the Jupiter DEX aggregator to find the best route across multiple DEXs. The `getBestRoute` method returns the optimal path, including multi-hop routes (e.g., EDGE → USDC → SOL).
2. **Slippage protection**: Every swap includes a configurable slippage tolerance (default 50 bps / 0.5%). If the actual output deviates beyond the tolerance, the transaction reverts on-chain.
3. **Concentrated liquidity management**: For Orca Whirlpool and Raydium CLMM positions, the service tracks tick ranges and `inRange` status. Positions that go out of range trigger a notification for rebalancing.
4. **Impermanent loss tracking**: IL is calculated every 6 hours by comparing the current LP value against a HODL-equivalent portfolio. The `netPnlUsd` metric factors in earned fees to determine if the position is net-positive.
5. **Strategy approval**: Yield strategies with `high` risk level or allocations exceeding $50K require explicit approval from a treasury manager before execution.
6. **Auto-compounding**: When enabled, the cron job `defiAutoCompound` harvests farm rewards and re-stakes them at the configured frequency (hourly, daily, or weekly).

---

## Module: bridge

### Purpose

Manages cross-chain asset transfers between Solana and EVM chains (Ethereum, Base, Polygon) using Wormhole and LayerZero bridge protocols. Handles bridge initiation, destination-chain claim monitoring, relayer management, and comprehensive transaction tracking with automatic retry for failed attestations.

### Database Schema

```typescript
// web3_bridge_transactions — Bridge Transfer Records
export const bridgeTransactions = pgTable('web3_bridge_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  protocol: bridgeProtocolEnum('protocol').notNull(),       // wormhole | layerzero | debridge
  sourceChain: chainEnum('source_chain').notNull(),
  destinationChain: chainEnum('destination_chain').notNull(),
  senderAddress: text('sender_address').notNull(),
  recipientAddress: text('recipient_address').notNull(),
  tokenMint: text('token_mint').notNull(),
  tokenSymbol: text('token_symbol').notNull(),
  amount: numeric('amount', { precision: 30, scale: 0 }).notNull(),
  fee: numeric('fee', { precision: 20, scale: 9 }),
  status: bridgeStatusEnum('status').default('pending'),    // pending | in_transit | completed | failed | refunded
  sourceTxSignature: text('source_tx_signature'),
  destinationTxSignature: text('destination_tx_signature'),
  attestationId: text('attestation_id'),                    // Wormhole VAA or LayerZero message ID
  estimatedArrival: timestamp('estimated_arrival', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  retryCount: integer('retry_count').default(0),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_bridged_assets — Bridged Asset Tracking
export const bridgedAssets = pgTable('web3_bridged_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalChain: chainEnum('original_chain').notNull(),
  originalMint: text('original_mint').notNull(),
  wrappedChain: chainEnum('wrapped_chain').notNull(),
  wrappedMint: text('wrapped_mint').notNull(),
  symbol: text('symbol').notNull(),
  decimals: integer('decimals').notNull(),
  totalBridged: numeric('total_bridged', { precision: 30, scale: 0 }).default('0'),
  protocol: bridgeProtocolEnum('protocol').notNull(),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_bridge_configurations — Bridge Protocol Configurations
export const bridgeConfigurations = pgTable('web3_bridge_configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  protocol: bridgeProtocolEnum('protocol').notNull(),
  sourceChain: chainEnum('source_chain').notNull(),
  destinationChain: chainEnum('destination_chain').notNull(),
  contractAddress: text('contract_address').notNull(),
  relayerAddress: text('relayer_address'),
  feeTokenMint: text('fee_token_mint'),
  estimatedTimeMinutes: integer('estimated_time_minutes').default(15),
  maxTransferAmount: numeric('max_transfer_amount', { precision: 30, scale: 0 }),
  minTransferAmount: numeric('min_transfer_amount', { precision: 30, scale: 0 }),
  isActive: boolean('is_active').default(true),
  config: jsonb('config'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_bridge_relayers — Relayer Node Registry
export const bridgeRelayers = pgTable('web3_bridge_relayers', {
  id: uuid('id').primaryKey().defaultRandom(),
  protocol: bridgeProtocolEnum('protocol').notNull(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  chains: text('chains').array().notNull(),
  status: text('status').default('active'),                // active | degraded | offline
  successRate: numeric('success_rate', { precision: 5, scale: 2 }),
  avgDeliveryTimeSeconds: integer('avg_delivery_time_seconds'),
  lastHealthCheck: timestamp('last_health_check', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class BridgeService {
  // ── Bridge Operations ────────────────────────────────────────────────
  initiateBridge(input: InitiateBridgeInput): Promise<{ transaction: BridgeTransaction; sourceTxSignature: string }>;
  claimBridged(input: ClaimBridgedInput): Promise<{ destinationTxSignature: string }>;
  cancelBridge(transactionId: string): Promise<BridgeTransaction>;

  // ── Monitoring ───────────────────────────────────────────────────────
  getBridgeStatus(transactionId: string): Promise<BridgeTransaction>;
  monitorPendingBridges(): Promise<BridgeTransaction[]>;
  retryFailedBridge(transactionId: string): Promise<BridgeTransaction>;

  // ── Asset Registry ───────────────────────────────────────────────────
  getBridgedAssets(chain: SupportedChain): Promise<BridgedAsset[]>;
  getWrappedEquivalent(originalMint: string, targetChain: SupportedChain): Promise<BridgedAsset | null>;

  // ── Configuration ────────────────────────────────────────────────────
  getAvailableRoutes(sourceChain: SupportedChain, destinationChain: SupportedChain): Promise<BridgeConfiguration[]>;
  estimateBridgeFee(input: InitiateBridgeInput): Promise<{ fee: string; estimatedTime: number }>;
}
```

### Key Behaviors

1. **Multi-protocol routing**: The service selects the optimal bridge protocol based on the token, chains, and transfer amount. Wormhole is preferred for large transfers; LayerZero for speed.
2. **Attestation monitoring**: After initiating a bridge, the service polls the bridge protocol for attestation/VAA completion. Status transitions: `pending → in_transit → completed`.
3. **Auto-retry**: Failed bridge transactions are automatically retried up to 3 times with exponential backoff. After 3 failures, the transaction is marked as `failed` and an alert is triggered.
4. **Fee estimation**: Bridge fees are estimated before execution, including gas on the destination chain. The user must confirm the fee before the bridge transaction is submitted.
5. **Wrapped asset tracking**: The system maintains a registry of wrapped assets (e.g., wormhole-wrapped EDGE on Ethereum) and their 1:1 mapping to the original Solana SPL token.

---

## Module: treasury

### Purpose

Manages the on-chain treasury infrastructure for all MCV ventures. Implements multi-sig vaults (via Squads Protocol), spending proposals with tiered approval workflows, asset diversification strategies, periodic NAV (Net Asset Value) snapshots, and fiat-crypto reconciliation with the `@mcv/treasury` shared module.

### Database Schema

```typescript
// web3_treasury_vaults — Multi-Sig Treasury Vaults
export const treasuryVaults = pgTable('web3_treasury_vaults', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  name: text('name').notNull(),                            // "BetEdge Main Treasury"
  vaultAddress: text('vault_address').notNull().unique(),  // Squads multi-sig PDA
  chain: chainEnum('chain').notNull(),
  protocol: text('protocol').notNull(),                    // squads | gnosis
  threshold: integer('threshold').notNull(),               // Signatures required (e.g., 3)
  signerCount: integer('signer_count').notNull(),          // Total signers (e.g., 5)
  status: treasuryVaultStatusEnum('status').default('active'),
  totalValueUsd: numeric('total_value_usd', { precision: 20, scale: 2 }).default('0'),
  spendingLimitDaily: numeric('spending_limit_daily', { precision: 20, scale: 2 }),
  spendingLimitMonthly: numeric('spending_limit_monthly', { precision: 20, scale: 2 }),
  hitlThreshold: numeric('hitl_threshold', { precision: 20, scale: 2 }).default('10000'), // USD threshold for HITL
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_treasury_signers — Vault Signer Registry
export const treasurySigners = pgTable('web3_treasury_signers', {
  id: uuid('id').primaryKey().defaultRandom(),
  vaultId: uuid('vault_id').notNull().references(() => treasuryVaults.id),
  userId: uuid('user_id'),
  signerAddress: text('signer_address').notNull(),
  label: text('label').notNull(),                          // "CTO", "CFO", "Treasury Manager"
  isActive: boolean('is_active').default(true),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),
  removedAt: timestamp('removed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_spending_proposals — Treasury Spending Proposals
export const spendingProposals = pgTable('web3_spending_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  vaultId: uuid('vault_id').notNull().references(() => treasuryVaults.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  proposerUserId: uuid('proposer_user_id').notNull(),
  recipientAddress: text('recipient_address').notNull(),
  tokenMint: text('token_mint').notNull(),
  amount: numeric('amount', { precision: 30, scale: 0 }).notNull(),
  amountUsd: numeric('amount_usd', { precision: 20, scale: 2 }),
  category: text('category').notNull(),                    // operations | grants | payroll | marketing | development
  status: text('status').default('pending'),               // pending | approved | rejected | executed | cancelled
  approvalsReceived: integer('approvals_received').default(0),
  approvalsRequired: integer('approvals_required').notNull(),
  hitlRequired: boolean('hitl_required').default(false),
  hitlApprovedBy: uuid('hitl_approved_by'),
  hitlApprovedAt: timestamp('hitl_approved_at', { withTimezone: true }),
  executionTxSignature: text('execution_tx_signature'),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_spending_approvals — Individual Signer Approvals
export const spendingApprovals = pgTable('web3_spending_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').notNull().references(() => spendingProposals.id),
  signerId: uuid('signer_id').notNull().references(() => treasurySigners.id),
  approved: boolean('approved').notNull(),
  reason: text('reason'),
  txSignature: text('tx_signature'),
  approvedAt: timestamp('approved_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_treasury_positions — Current Asset Positions
export const treasuryPositions = pgTable('web3_treasury_positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  vaultId: uuid('vault_id').notNull().references(() => treasuryVaults.id),
  tokenMint: text('token_mint').notNull(),
  tokenSymbol: text('token_symbol').notNull(),
  balance: numeric('balance', { precision: 30, scale: 0 }).notNull(),
  valueUsd: numeric('value_usd', { precision: 20, scale: 2 }),
  allocationPercentage: numeric('allocation_percentage', { precision: 5, scale: 2 }),
  targetPercentage: numeric('target_percentage', { precision: 5, scale: 2 }),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_treasury_transactions — All Treasury Transactions
export const treasuryTransactions = pgTable('web3_treasury_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  vaultId: uuid('vault_id').notNull().references(() => treasuryVaults.id),
  proposalId: uuid('proposal_id').references(() => spendingProposals.id),
  txType: text('tx_type').notNull(),                       // spend | receive | diversify | rebalance | yield
  tokenMint: text('token_mint').notNull(),
  amount: numeric('amount', { precision: 30, scale: 0 }).notNull(),
  direction: text('direction').notNull(),                  // inbound | outbound
  counterpartyAddress: text('counterparty_address'),
  txSignature: text('tx_signature'),
  status: text('status').default('pending'),               // pending | confirmed | failed
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_treasury_snapshots — Periodic NAV Snapshots
export const treasurySnapshots = pgTable('web3_treasury_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  vaultId: uuid('vault_id').notNull().references(() => treasuryVaults.id),
  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  totalValueUsd: numeric('total_value_usd', { precision: 20, scale: 2 }).notNull(),
  positions: jsonb('positions'),                           // { token: { balance, valueUsd } }
  defiPositions: jsonb('defi_positions'),                  // LP and farm positions
  pendingProposalsCount: integer('pending_proposals_count').default(0),
  pendingProposalsValueUsd: numeric('pending_proposals_value_usd', { precision: 20, scale: 2 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_treasury_policies — Spending Limits & Rules
export const treasuryPolicies = pgTable('web3_treasury_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  vaultId: uuid('vault_id').notNull().references(() => treasuryVaults.id),
  name: text('name').notNull(),
  policyType: text('policy_type').notNull(),               // spending_limit | whitelist | blacklist | diversification
  rules: jsonb('rules').notNull(),
  // { dailyLimit: 50000, monthlyLimit: 200000, requiresHitl: true, hitlThreshold: 10000 }
  isActive: boolean('is_active').default(true),
  approvedBy: uuid('approved_by'),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// web3_treasury_reconciliations — Fiat-Crypto Reconciliation
export const treasuryReconciliations = pgTable('web3_treasury_reconciliations', {
  id: uuid('id').primaryKey().defaultRandom(),
  vaultId: uuid('vault_id').notNull().references(() => treasuryVaults.id),
  reconciliationDate: timestamp('reconciliation_date', { withTimezone: true }).notNull(),
  onChainValueUsd: numeric('on_chain_value_usd', { precision: 20, scale: 2 }).notNull(),
  offChainValueUsd: numeric('off_chain_value_usd', { precision: 20, scale: 2 }).notNull(),
  discrepancyUsd: numeric('discrepancy_usd', { precision: 20, scale: 2 }),
  discrepancyPercentage: numeric('discrepancy_percentage', { precision: 8, scale: 4 }),
  status: text('status').default('pending'),               // pending | matched | discrepancy | resolved
  notes: text('notes'),
  resolvedBy: uuid('resolved_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class TreasuryService {
  // ── Vault Management ─────────────────────────────────────────────────
  createVault(input: CreateVaultInput): Promise<TreasuryVault>;
  addSigner(vaultId: string, signer: AddSignerInput): Promise<TreasurySigner>;
  removeSigner(vaultId: string, signerId: string): Promise<void>;
  updateThreshold(vaultId: string, newThreshold: number): Promise<TreasuryVault>;

  // ── Spending Proposals ───────────────────────────────────────────────
  createSpendingProposal(input: CreateSpendingProposalInput): Promise<SpendingProposal>;
  approveSpending(input: ApproveSpendingInput): Promise<SpendingApproval>;
  rejectSpending(proposalId: string, reason: string): Promise<SpendingProposal>;
  executeSpending(input: ExecuteSpendingInput): Promise<{ txSignature: string; transaction: TreasuryTransaction }>;

  // ── Asset Management ─────────────────────────────────────────────────
  getPositions(vaultId: string): Promise<TreasuryPosition[]>;
  syncPositions(vaultId: string): Promise<TreasuryPosition[]>;
  diversify(input: DiversifyInput): Promise<TreasuryTransaction[]>;

  // ── Analytics & Reporting ────────────────────────────────────────────
  snapshotNAV(vaultId: string): Promise<TreasurySnapshot>;
  getHistoricalNAV(vaultId: string, startDate: Date, endDate: Date): Promise<TreasurySnapshot[]>;
  reconcile(vaultId: string): Promise<TreasuryReconciliation>;

  // ── Policy Management ────────────────────────────────────────────────
  createPolicy(input: CreatePolicyInput): Promise<TreasuryPolicy>;
  validateSpending(proposalId: string): Promise<{ valid: boolean; violations: string[] }>;
}
```

### Key Behaviors

1. **HITL enforcement**: Any spending proposal exceeding the vault's `hitlThreshold` (default $10,000 USD) requires Human-in-the-Loop approval via the `@mcv/agentic-os/hitl` module before execution, even if multi-sig threshold is met.
2. **Multi-sig on-chain**: Treasury vaults use Squads Protocol on Solana for on-chain multi-sig. The `threshold` defines how many of `signerCount` addresses must sign a transaction.
3. **Spending policies**: Policies enforce daily and monthly spending limits, whitelisted recipient addresses, and category-based restrictions. Proposals violating policies are automatically flagged.
4. **NAV tracking**: The cron job `treasuryNAVSnapshot` runs every 6 hours, recording the total USD value of all vault positions including DeFi positions (LPs, farms).
5. **Reconciliation**: The `reconcile` method compares on-chain vault balances with the off-chain database records. Discrepancies beyond 0.1% trigger alerts and require manual resolution.
6. **Proposal expiration**: Spending proposals expire after 7 days if the approval threshold is not met. Expired proposals must be re-created.

---

## Error Codes

| Code | Description | HTTP Status | Resolution |
|------|-------------|-------------|------------|
| `W3_WALLET_NOT_FOUND` | Wallet ID does not exist | 404 | Verify wallet ID |
| `W3_WALLET_FROZEN` | Wallet is frozen by admin | 403 | Contact admin to unfreeze |
| `W3_WALLET_UNVERIFIED` | Wallet link not verified | 401 | Complete wallet verification flow |
| `W3_INSUFFICIENT_BALANCE` | Not enough tokens for operation | 400 | Check balance before transacting |
| `W3_INVALID_SIGNATURE` | Signature verification failed | 401 | Re-sign with correct private key |
| `W3_NONCE_EXPIRED` | Verification nonce has expired | 400 | Request a new nonce |
| `W3_COMPLIANCE_BLOCKED` | Address flagged by compliance | 403 | Address is sanctioned or flagged |
| `W3_MINT_UNAUTHORIZED` | Signer is not the mint authority | 403 | Use the mint authority wallet |
| `W3_VESTING_NOT_CLAIMABLE` | No tokens are claimable yet | 400 | Wait for cliff or next vest period |
| `W3_VESTING_CANCELLED` | Vesting schedule was cancelled | 400 | Contact venture admin |
| `W3_AIRDROP_ALREADY_CLAIMED` | Airdrop already claimed | 400 | Each address can claim once |
| `W3_AIRDROP_EXPIRED` | Airdrop claim deadline passed | 400 | Campaign has ended |
| `W3_INVALID_MERKLE_PROOF` | Merkle proof verification failed | 400 | Address not in airdrop list |
| `W3_PROGRAM_NOT_FOUND` | Deployed program not in registry | 404 | Register the program first |
| `W3_UPGRADE_UNAUTHORIZED` | Not authorized to upgrade program | 403 | Must be upgrade authority signer |
| `W3_DEPLOYMENT_IN_PROGRESS` | Program is currently being deployed | 409 | Wait for current deployment |
| `W3_STAKING_LOCKUP_ACTIVE` | Lockup period has not expired | 400 | Wait for lockup to end |
| `W3_STAKING_POOL_FULL` | Pool has reached max capacity | 400 | Try a different pool |
| `W3_STAKING_POOL_PAUSED` | Staking pool is paused | 400 | Pool is temporarily unavailable |
| `W3_COOLDOWN_ACTIVE` | Unstaking cooldown in progress | 400 | Wait for cooldown to complete |
| `W3_PROPOSAL_THRESHOLD` | Insufficient tokens to create proposal | 400 | Need more EDGE to propose |
| `W3_QUORUM_NOT_MET` | Quorum not reached for proposal | 400 | More votes needed |
| `W3_VOTING_ENDED` | Voting period has ended | 400 | Cannot vote after deadline |
| `W3_TIMELOCK_NOT_READY` | Timelock period not yet elapsed | 400 | Wait for timelock delay |
| `W3_BRIDGE_FAILED` | Bridge transfer failed | 500 | Automatic retry in progress |
| `W3_BRIDGE_UNSUPPORTED_ROUTE` | No bridge route for chain pair | 400 | Check supported chains |
| `W3_TREASURY_LIMIT_EXCEEDED` | Spending exceeds policy limits | 403 | Reduce amount or request limit increase |
| `W3_TREASURY_HITL_REQUIRED` | Requires human-in-the-loop approval | 403 | Await HITL review |
| `W3_TREASURY_PROPOSAL_EXPIRED` | Spending proposal has expired | 400 | Create a new proposal |
| `W3_RPC_TIMEOUT` | Blockchain RPC timed out | 504 | Retry with backoff |
| `W3_RPC_RATE_LIMITED` | RPC provider rate limited | 429 | Retry after cooldown |
| `W3_TX_SIMULATION_FAILED` | Transaction simulation failed | 400 | Check accounts and instruction data |

---

## Security

### Critical Security Measures

This module handles private keys, signs transactions involving real monetary value, and manages multi-million dollar treasury positions. Security is the highest priority.

#### Key Management
- **KMS-only storage**: All managed wallet private keys are encrypted with AWS KMS using envelope encryption. The `encryptedPrivateKey` column contains KMS ciphertext — **never** plaintext. Decryption requires an authenticated AWS SDK call to the specific KMS key ARN.
- **Key rotation**: Platform wallet keys should be rotated every 90 days. The `rotateKey` method generates a new keypair, re-encrypts with KMS, transfers assets, and archives the old key.
- **Zero plaintext in memory**: Private keys are decrypted only in memory for the duration of signing, then immediately zeroed. The signing process runs in an isolated context with no logging of key material.

#### Transaction Security
- **Multi-sig for high-value**: All treasury transactions exceeding $10,000 require multi-sig approval. All production program upgrades require multi-sig.
- **HITL gating**: Operations exceeding configurable thresholds trigger Human-in-the-Loop review via `@mcv/agentic-os/hitl`. The transaction cannot execute until a human approves.
- **Simulation before send**: Every transaction is simulated on-chain before signing and sending. If simulation fails, the transaction is rejected with the `W3_TX_SIMULATION_FAILED` error.
- **Confirmation tracking**: Transactions are not considered final until they reach 32 confirmations on Solana (finalized commitment level). The confirmation tracker monitors this asynchronously.

#### Compliance
- **OFAC screening**: Every wallet address is screened against OFAC sanctions lists before linking or receiving tokens. The compliance service uses the Chainalysis API.
- **Mixer detection**: Addresses associated with known mixers (Tornado Cash, etc.) are automatically blocked.
- **Pre-transfer checks**: Every outbound transfer runs a compliance check on the destination address before signing.
- **Audit trail**: Every blockchain operation is logged to the `@mcv/fabric` audit trail with actor, action, resource, and full metadata.

#### Infrastructure
- **RPC load balancing**: Multiple RPC providers (Helius, Triton, QuickNode) with automatic failover ensure high availability.
- **Rate limiting**: All blockchain operations are rate-limited to prevent abuse and RPC exhaustion.
- **Redis caching**: Balance queries are cached (10-second TTL) to reduce RPC load while maintaining near-real-time accuracy.

### Security Checklist

- [ ] All private keys stored as KMS-encrypted ciphertext only
- [ ] Key rotation policy enforced (90-day maximum)
- [ ] Multi-sig required for all production treasury operations
- [ ] HITL gating enabled for operations exceeding $10K
- [ ] OFAC/sanctions screening on all wallet links
- [ ] Mixer address detection and blocking active
- [ ] Transaction simulation before every send
- [ ] 32-confirmation finality tracking for all transactions
- [ ] Audit trail logging for every blockchain operation
- [ ] RPC provider failover configured and tested
- [ ] Rate limiting on all endpoints
- [ ] Redis cache TTLs configured (10s for balances)
- [ ] Nonce expiration enforced (5-minute maximum)
- [ ] Binary verification for all program deployments
- [ ] Spending policy enforcement on treasury proposals

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @solana/web3.js | ^1.95.x | Solana RPC client, transactions, accounts |
| @coral-xyz/anchor | ^0.30.x | Anchor framework, IDL, program interaction |
| @solana/spl-token | ^0.4.x | SPL token operations, ATA creation |
| tweetnacl | ^1.0.x | Ed25519 signing and verification |
| @aws-sdk/client-kms | ^3.x | AWS KMS for key encryption/decryption |
| @hashicorp/vault-client | ^0.x | HashiCorp Vault alternative key storage |
| bs58 | ^6.x | Base58 encoding for Solana addresses |
| @metaplex-foundation/js | ^0.20.x | Metaplex metadata (token logos, etc.) |
| @jup-ag/api | ^6.x | Jupiter DEX aggregator API |
| @orca-so/whirlpools-sdk | ^0.13.x | Orca Whirlpool concentrated liquidity |
| @raydium-io/raydium-sdk-v2 | ^0.x | Raydium AMM and CLMM pools |
| @wormhole-foundation/sdk | ^0.x | Wormhole cross-chain bridge |
| @layerzerolabs/sdk | ^2.x | LayerZero cross-chain messaging |
| @sqds/multisig | ^2.x | Squads Protocol multi-sig vaults |
| merkletreejs | ^0.4.x | Merkle tree generation for airdrops |
| keccak256 | ^1.x | Hashing for Merkle leaves |
| drizzle-orm | ^0.36.x | Database ORM for schema and queries |
| ioredis | ^5.x | Redis client for caching |

---

## Environment Variables

```bash
# ── Solana RPC ──────────────────────────────────────────────────────────
SOLANA_RPC_URL=                    # Primary RPC endpoint (Helius recommended)
SOLANA_RPC_FALLBACK_1=             # Fallback RPC (Triton)
SOLANA_RPC_FALLBACK_2=             # Fallback RPC (QuickNode)
SOLANA_CLUSTER=mainnet-beta        # mainnet-beta | devnet | testnet
SOLANA_COMMITMENT=finalized        # Commitment level for reads

# ── Key Management ──────────────────────────────────────────────────────
AWS_KMS_KEY_ARN=                   # KMS key for wallet encryption
AWS_KMS_REGION=us-east-1           # KMS region
VAULT_ADDR=                        # HashiCorp Vault address (optional)
VAULT_TOKEN=                       # HashiCorp Vault token (optional)

# ── EDGE Token ──────────────────────────────────────────────────────────
EDGE_TOKEN_MINT=                   # EDGE token mint address
EDGE_DECIMALS=9                    # Token decimals

# ── DeFi Integrations ──────────────────────────────────────────────────
JUPITER_API_URL=https://quote-api.jup.ag/v6
HELIUS_API_KEY=                    # Helius enhanced RPC + webhooks
HELIUS_WEBHOOK_SECRET=             # Webhook signature verification

# ── Bridge Protocols ───────────────────────────────────────────────────
WORMHOLE_RPC_HOST=                 # Wormhole guardian RPC
LAYERZERO_ENDPOINT=                # LayerZero endpoint address

# ── Compliance ──────────────────────────────────────────────────────────
CHAINALYSIS_API_KEY=               # Chainalysis compliance API
OFAC_LIST_URL=                     # OFAC sanctions list URL

# ── Redis ───────────────────────────────────────────────────────────────
REDIS_URL=                         # Redis for balance caching
REDIS_CACHE_TTL=10                 # Cache TTL in seconds
```

---

*@mcv/web3-core — Web3 Core Domain Module*
