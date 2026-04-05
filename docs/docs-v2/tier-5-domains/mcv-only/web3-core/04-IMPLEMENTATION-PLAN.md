# @mcv/web3-core — Implementation Plan

**Module:** @mcv/web3-core  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** MCV-ONLY (Internal Blockchain Infrastructure)  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1 — Foundation](#phase-1--foundation)
4. [Phase 2 — Core](#phase-2--core)
5. [Phase 3 — Advanced](#phase-3--advanced)
6. [Phase 4 — Polish & Hardening](#phase-4--polish--hardening)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risks & Mitigations](#risks--mitigations)
10. [Timeline](#timeline)

---

## Overview

### Purpose

This implementation plan outlines the phased delivery of `@mcv/web3-core` — the complete blockchain infrastructure layer for the MCV Global Consortium. The module provides wallet management, EDGE token operations, staking, governance, DeFi integrations, cross-chain bridging, smart contract lifecycle management, and on-chain treasury operations for 9 MCV ventures.

### Scope

| In Scope | Out of Scope |
|----------|-------------|
| 8 submodules (wallets, tokens, contracts, staking, governance, defi, bridge, treasury) | Consumer-facing UI (handled by @mcv/web3-public) |
| 61 database tables (Drizzle ORM schemas) | Fiat payment processing (handled by @mcv/treasury) |
| Blockchain Abstraction Layer (BAL) | Token economics modeling (handled by @mcv/token-economy) |
| ACS v2.0 integration points | User authentication (handled by @mcv/identity) |
| React client hooks and components | External DEX/protocol development |
| Solana program (smart contract) development | EVM smart contract development (Phase 3+) |
| Cross-chain bridge integrations | Running bridge relayer infrastructure |
| KMS-backed key management | AWS KMS infrastructure provisioning |

### Delivery Strategy

The module is delivered in **4 phases** over approximately **16 weeks**, with each phase building on the previous:

```
Phase 1: Foundation (Weeks 1-4)
├── Wallet management + KMS integration
├── Basic SPL token operations
├── Solana RPC abstraction layer
└── Database schemas + Supabase RLS

Phase 2: Core (Weeks 5-9)
├── Staking pools + reward distribution
├── Governance proposals + voting
├── Smart contract deployment pipeline
└── Bridge framework + Wormhole integration

Phase 3: Advanced (Weeks 10-13)
├── DeFi integrations (Jupiter, Raydium, Orca)
├── Multi-chain support preparation
├── Advanced treasury operations
└── HSM key management + key rotation

Phase 4: Polish & Hardening (Weeks 14-16)
├── Performance optimization
├── Security audit preparation
├── Documentation + client components
└── Integration testing + load testing
```

---

## Prerequisites

### Infrastructure Requirements

Before development begins, the following infrastructure must be provisioned and accessible:

| Requirement | Details | Owner | Status |
|------------|---------|-------|--------|
| **Solana Devnet Access** | Devnet RPC endpoint for development and testing | DevOps | Required before Phase 1 |
| **Helius API Key** | Enhanced RPC + DAS + webhooks (devnet + mainnet) | DevOps | Required before Phase 1 |
| **AWS KMS Key** | Dedicated KMS key for wallet encryption (us-east-1) | DevOps/Security | Required before Phase 1 |
| **Supabase Project** | PostgreSQL database with RLS enabled | DevOps | Required before Phase 1 |
| **Redis Instance** | For balance caching and rate limiting | DevOps | Required before Phase 1 |
| **S3 Bucket** | For program binaries, Merkle trees, and IDL storage | DevOps | Required before Phase 2 |
| **Triton RPC** | Fallback RPC provider | DevOps | Required before Phase 2 |
| **QuickNode RPC** | Second fallback RPC provider | DevOps | Required before Phase 3 |
| **Chainalysis API Key** | Compliance screening (OFAC, mixer detection) | Compliance | Required before Phase 2 |
| **Wormhole Testnet Access** | Bridge protocol testing | DevOps | Required before Phase 2 |
| **Jupiter API Access** | DEX aggregator (no key required, rate-limited) | — | Available now |
| **Squads Protocol Devnet** | Multi-sig vault testing | — | Available now |

### Development Environment Setup

```bash
# 1. Clone the monorepo
git clone https://github.com/mcv-global/mcv-monorepo.git
cd mcv-monorepo

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp packages/web3-core/.env.example packages/web3-core/.env
# Fill in: SOLANA_RPC_URL, AWS_KMS_KEY_ARN, SUPABASE_URL, REDIS_URL

# 4. Generate Solana devnet wallet for testing
solana-keygen new --outfile ~/.config/solana/devnet-test.json
solana config set --url devnet
solana airdrop 5  # Get devnet SOL

# 5. Run database migrations
pnpm --filter @mcv/web3-core db:migrate

# 6. Verify setup
pnpm --filter @mcv/web3-core test:setup
```

### Solana Devnet Wallet Setup

Each developer needs a devnet wallet with SOL for testing:

```bash
# Create devnet keypair
solana-keygen new --outfile ~/.config/solana/mcv-dev.json --no-bip39-passphrase

# Set to devnet
solana config set --url https://api.devnet.solana.com

# Airdrop SOL (devnet only, 2 SOL per request)
solana airdrop 2
solana airdrop 2
solana airdrop 2
# Total: 6 SOL devnet — sufficient for testing

# Create test SPL token (simulates EDGE on devnet)
spl-token create-token --decimals 9
# → Token mint address: <DEVNET_EDGE_MINT>

spl-token create-account <DEVNET_EDGE_MINT>
spl-token mint <DEVNET_EDGE_MINT> 1000000000000000  # 1M EDGE (with 9 decimals)
```

### Anchor Development Setup

For smart contract development (Phase 2+):

```bash
# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor anchor-cli

# Verify installation
anchor --version  # Should be 0.30.x+

# Initialize test validator (local development)
solana-test-validator --reset

# Build programs
cd programs/edge-staking-vault
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Team Prerequisites

| Role | Skills Required | Phase |
|------|----------------|-------|
| **Backend Engineer (2)** | TypeScript, Solana/web3.js, PostgreSQL, Redis | All phases |
| **Blockchain Engineer (1)** | Rust, Anchor framework, Solana programs | Phase 2+ |
| **Security Engineer (1)** | KMS, HSM, multi-sig, audit preparation | Phase 1, 3, 4 |
| **Frontend Engineer (1)** | React, React Query, Solana wallet adapter | Phase 3, 4 |
| **DevOps (0.5)** | AWS, Supabase, Redis, RPC node management | Phase 1 (setup), Phase 4 |

---

## Phase 1 — Foundation

**Duration:** Weeks 1–4  
**Goal:** Establish the core infrastructure — wallet management, basic token operations, and the Blockchain Abstraction Layer.

### Week 1: Project Scaffolding & Database Layer

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 1.1 | Initialize `@mcv/web3-core` package in monorepo with standard MCV structure | 0.5d | Backend |
| 1.2 | Define all Drizzle ORM schemas for the **wallets** submodule (6 tables) | 1d | Backend |
| 1.3 | Define all Drizzle ORM schemas for the **tokens** submodule (10 tables) | 1.5d | Backend |
| 1.4 | Define shared enums (`chainEnum`, `walletTypeEnum`, `walletStatusEnum`, etc.) | 0.5d | Backend |
| 1.5 | Create Supabase migration scripts for all Phase 1 tables | 1d | Backend |
| 1.6 | Implement RLS policies for wallet isolation (venture-scoped) and service-role access for key material | 1d | Backend + Security |
| 1.7 | Set up Redis client with connection pooling and TTL configuration | 0.5d | Backend |
| 1.8 | Create shared error classes (`Web3Error`) and the error code registry | 0.5d | Backend |
| 1.9 | Set up `@mcv/fabric` event emitter integration for the module | 0.5d | Backend |

**Deliverables:**
- [ ] Package scaffold with standard directory structure
- [ ] 16 database tables migrated (wallets + tokens)
- [ ] RLS policies for venture isolation
- [ ] Redis client configured
- [ ] Error framework + event emitter skeleton

---

### Week 2: Blockchain Abstraction Layer (BAL) & Wallet Core

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 2.1 | Implement `SolanaAdapter` — connection management, transaction building, account deserialization | 2d | Backend |
| 2.2 | Implement `RPCLoadBalancer` — weighted routing, health checks (10s interval), auto-failover | 1.5d | Backend |
| 2.3 | Implement `KMSSigner` — AWS KMS decrypt → sign → zero memory pattern | 1d | Backend + Security |
| 2.4 | Implement `FeeEstimator` — priority fee calculation from recent blocks | 0.5d | Backend |
| 2.5 | Implement `ConfirmationTracker` — poll until finalized (32+ confirmations), timeout at 60s | 1d | Backend |
| 2.6 | Implement `SimulationEngine` — pre-send transaction simulation | 0.5d | Backend |
| 2.7 | Implement `TxBatchEngine` — group up to 15 instructions per transaction, split larger batches | 1d | Backend |
| 2.8 | Unit tests for all BAL components | 1.5d | Backend |

**Deliverables:**
- [ ] Fully functional BAL with Solana adapter
- [ ] KMS-backed signing working (encrypt/decrypt/sign/zero)
- [ ] RPC load balancer with health monitoring
- [ ] Transaction simulation before send
- [ ] Confirmation tracking to finalized commitment
- [ ] 80%+ test coverage for BAL

---

### Week 3: Wallet Service & Token Service (Core)

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 3.1 | Implement `WalletService.createManagedWallet` — keypair generation, KMS encryption, DB record | 1d | Backend |
| 3.2 | Implement `WalletService.deriveChildWallet` — HD derivation with hardened paths | 1d | Backend |
| 3.3 | Implement `WalletService.signTransaction` and `signAndSendTransaction` | 1d | Backend |
| 3.4 | Implement `WalletService.batchSignAndSend` | 0.5d | Backend |
| 3.5 | Implement `WalletService.getBalance` and `getAllBalances` with Redis caching (10s TTL) | 1d | Backend |
| 3.6 | Implement `WalletService.getTransactionHistory` with pagination and filtering | 0.5d | Backend |
| 3.7 | Implement `WalletService.refreshBalanceCache` | 0.25d | Backend |
| 3.8 | Implement `TokenService.transfer` — SPL transfer with ATA auto-creation | 1d | Backend |
| 3.9 | Implement `TokenService.batchTransfer` — optimized multi-recipient transfers | 0.5d | Backend |
| 3.10 | Implement `TokenService.createAssociatedTokenAccount` | 0.25d | Backend |
| 3.11 | Integration tests: wallet creation → token transfer → balance query | 1d | Backend |

**Deliverables:**
- [ ] Wallet creation with KMS key storage
- [ ] HD wallet derivation
- [ ] Transaction signing via KMS
- [ ] Batch transaction signing
- [ ] Balance queries with Redis cache
- [ ] SPL token transfers with ATA auto-creation
- [ ] Integration tests passing on devnet

---

### Week 4: Wallet Linking, Compliance & Token Operations

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 4.1 | Implement `WalletService.initiateWalletLink` — nonce generation with 5-minute expiry | 0.5d | Backend |
| 4.2 | Implement `WalletService.verifyWalletLink` — Ed25519 signature verification via tweetnacl | 1d | Backend |
| 4.3 | Implement `WalletService.runComplianceCheck` — Chainalysis integration for OFAC/mixer screening | 1d | Backend + Security |
| 4.4 | Implement compliance pre-check on all outbound transfers | 0.5d | Backend |
| 4.5 | Implement `TokenService.mintTokens` — authority validation, supply tracking | 1d | Backend |
| 4.6 | Implement `TokenService.burnTokens` — atomic pre/post supply recording | 0.5d | Backend |
| 4.7 | Implement `TokenService.getCirculatingSupply` and `snapshotSupply` | 0.5d | Backend |
| 4.8 | Implement supply snapshot cron job (6-hour interval) | 0.5d | Backend |
| 4.9 | Export all Phase 1 schemas, services, types, and constants from package index | 0.5d | Backend |
| 4.10 | End-to-end tests: wallet link flow, compliance check, mint/burn cycle | 1.5d | Backend |
| 4.11 | Phase 1 code review + documentation | 1d | All |

**Deliverables:**
- [ ] External wallet linking with Ed25519 verification
- [ ] OFAC/mixer compliance screening
- [ ] Token minting with authority validation
- [ ] Token burning with supply audit trail
- [ ] Supply snapshot cron job
- [ ] Phase 1 complete — all wallet and token fundamentals working

### Phase 1 Milestone Checklist

- [ ] Create managed wallet with KMS-encrypted keys
- [ ] Derive HD child wallets
- [ ] Sign and send transactions via KMS
- [ ] Batch sign and send (up to 15 ixs per tx)
- [ ] Query wallet balances (cached, 10s TTL)
- [ ] Transfer SPL tokens with ATA auto-creation
- [ ] Link external wallets via Ed25519 signature verification
- [ ] Run compliance checks (OFAC, mixer detection)
- [ ] Mint tokens (authority-validated)
- [ ] Burn tokens (with pre/post supply audit)
- [ ] Supply snapshots every 6 hours
- [ ] RPC load balancing with health checks and failover
- [ ] Transaction simulation before every send
- [ ] Confirmation tracking to finalized (32+ confirms)
- [ ] All events emitting to @mcv/fabric audit trail
- [ ] 80%+ test coverage for Phase 1 code

---

## Phase 2 — Core

**Duration:** Weeks 5–9  
**Goal:** Implement staking, governance, smart contract management, and bridge framework.

### Week 5: Staking — Schema & Pool Management

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 5.1 | Define Drizzle schemas for staking submodule (9 tables) | 1.5d | Backend |
| 5.2 | Create Supabase migrations + RLS policies for staking tables | 1d | Backend |
| 5.3 | Implement `StakingService.createPool` — pool creation with on-chain vault PDA | 1d | Backend |
| 5.4 | Implement `StakingService.updatePoolApy` — ACS integration point | 0.5d | Backend |
| 5.5 | Implement `StakingService.pausePool` / `resumePool` | 0.25d | Backend |
| 5.6 | Implement `StakingService.stake` — transfer to vault PDA, create stake record | 1.5d | Backend |
| 5.7 | Implement `StakingService.unstake` — cooldown request creation, lock validation | 1d | Backend |
| 5.8 | Implement `StakingService.completeUnstake` — cooldown verification, fund release | 0.5d | Backend |
| 5.9 | Implement `StakingService.cancelUnstake` | 0.25d | Backend |
| 5.10 | Begin Anchor staking vault program development | 2d | Blockchain |

**Deliverables:**
- [ ] 9 staking tables migrated with RLS
- [ ] Pool creation and management
- [ ] Stake/unstake flow with cooldown
- [ ] Staking vault program (initial Anchor skeleton)

---

### Week 6: Staking — Rewards & Liquid Staking

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 6.1 | Implement yield calculation engine (simple + compound interest) | 1d | Backend |
| 6.2 | Implement `StakingService.calculatePendingRewards` | 0.5d | Backend |
| 6.3 | Implement `StakingService.claimRewards` | 0.5d | Backend |
| 6.4 | Implement `StakingService.compoundRewards` | 0.5d | Backend |
| 6.5 | Implement `StakingService.distributeEpochRewards` — batch distribution (8-10 per tx) | 1.5d | Backend |
| 6.6 | Implement reward distribution cron job (per Solana epoch, ~2 days) | 0.5d | Backend |
| 6.7 | Implement `StakingService.mintLiquidStakingTokens` — stEDGE minting | 1d | Backend |
| 6.8 | Implement `StakingService.redeemLiquidStakingTokens` | 0.5d | Backend |
| 6.9 | Implement `StakingService.getExchangeRate` — stEDGE/EDGE rate calculation | 0.5d | Backend |
| 6.10 | Implement validator delegation methods | 1d | Backend |
| 6.11 | Continue Anchor staking vault program (deposit/withdraw/claim instructions) | 2d | Blockchain |
| 6.12 | Integration tests: full stake → reward → claim → unstake cycle | 1d | Backend |

**Deliverables:**
- [ ] Yield calculation (simple + compound)
- [ ] Epoch-based reward distribution
- [ ] Liquid staking (stEDGE mint/redeem/exchange rate)
- [ ] Validator delegation
- [ ] Staking integration tests

---

### Week 7: Governance

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 7.1 | Define Drizzle schemas for governance submodule (6 tables) | 1d | Backend |
| 7.2 | Create Supabase migrations + RLS policies | 0.5d | Backend |
| 7.3 | Implement `GovernanceService.createProposal` — threshold validation, snapshot taking | 1d | Backend |
| 7.4 | Implement `GovernanceService.activateProposal` — start voting, set snapshot slot | 0.5d | Backend |
| 7.5 | Implement `GovernanceService.castVote` — snapshot-based voting power lookup, delegation | 1.5d | Backend |
| 7.6 | Implement `GovernanceService.getVotingPower` — balance at snapshot slot + delegated power | 1d | Backend |
| 7.7 | Implement `GovernanceService.delegateVotingPower` / `revokeDelegation` | 0.5d | Backend |
| 7.8 | Implement `GovernanceService.queueForExecution` — timelock queue management | 0.5d | Backend |
| 7.9 | Implement `GovernanceService.executeProposal` — typed payload execution | 1.5d | Backend |
| 7.10 | Implement `GovernanceService.vetoProposal` | 0.25d | Backend |
| 7.11 | Implement `GovernanceService.takeSnapshot` — balance snapshots for voting | 0.5d | Backend |
| 7.12 | Implement proposal lifecycle state machine (draft → active → passed/rejected → timelock → executed) | 0.5d | Backend |
| 7.13 | Implement voting period end cron (check active proposals, tally votes, update status) | 0.5d | Backend |
| 7.14 | Integration tests: full proposal lifecycle including delegation and timelock | 1.5d | Backend |

**Deliverables:**
- [ ] 6 governance tables migrated
- [ ] Proposal creation with threshold validation
- [ ] Snapshot-based token-weighted voting
- [ ] Voting delegation (single-level)
- [ ] Timelock queue and execution
- [ ] Veto authority
- [ ] Full lifecycle integration tests

---

### Week 8: Smart Contracts & Bridge Framework

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 8.1 | Define Drizzle schemas for contracts submodule (6 tables) | 1d | Backend |
| 8.2 | Define Drizzle schemas for bridge submodule (4 tables) | 0.5d | Backend |
| 8.3 | Create Supabase migrations + RLS for contracts + bridge | 0.5d | Backend |
| 8.4 | Implement `ContractService.deployProgram` — deployment pipeline with binary verification | 2d | Backend + Blockchain |
| 8.5 | Implement `ContractService.upgradeProgram` — versioned upgrades with multi-sig gate | 1d | Backend |
| 8.6 | Implement `ContractService.rollbackProgram` — previous version re-deployment | 0.5d | Backend |
| 8.7 | Implement IDL management (`uploadIdl`, `getActiveIdl`, `fetchIdlFromChain`) | 0.5d | Backend |
| 8.8 | Implement authority management (`transferUpgradeAuthority`, `setMultisigAuthority`, `revokeAuthority`) | 1d | Backend |
| 8.9 | Implement `ContractService.invokeProgram` — CPI with logging | 0.5d | Backend |
| 8.10 | Implement `BridgeService.initiateBridge` — Wormhole integration for Solana → EVM | 2d | Backend |
| 8.11 | Implement `BridgeService.getBridgeStatus` and status monitoring poller | 1d | Backend |
| 8.12 | Implement `BridgeService.retryFailedBridge` — exponential backoff (3 attempts) | 0.5d | Backend |

**Deliverables:**
- [ ] 10 tables migrated (contracts + bridge)
- [ ] Program deployment pipeline with verification
- [ ] Program upgrades with multi-sig
- [ ] Rollback capability (last 5 versions)
- [ ] IDL management
- [ ] Wormhole bridge initiation
- [ ] Bridge status monitoring

---

### Week 9: Bridge Completion & Phase 2 Integration

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 9.1 | Implement `BridgeService.claimBridged` — destination chain claim | 1d | Backend |
| 9.2 | Implement `BridgeService.cancelBridge` | 0.5d | Backend |
| 9.3 | Implement bridge asset registry (`getBridgedAssets`, `getWrappedEquivalent`) | 0.5d | Backend |
| 9.4 | Implement `BridgeService.estimateBridgeFee` and `getAvailableRoutes` | 0.5d | Backend |
| 9.5 | Implement protocol routing logic (Wormhole for large, LayerZero for fast) | 1d | Backend |
| 9.6 | Deploy Anchor staking vault program to devnet | 1d | Blockchain |
| 9.7 | Integration tests: contract deploy → upgrade → rollback cycle | 1d | Backend |
| 9.8 | Integration tests: bridge initiate → monitor → claim flow (Wormhole testnet) | 1.5d | Backend |
| 9.9 | Cross-submodule integration: staking ↔ tokens ↔ wallets end-to-end | 1d | Backend |
| 9.10 | Phase 2 code review + documentation | 1d | All |

**Deliverables:**
- [ ] Complete bridge service (initiate, monitor, claim, retry)
- [ ] Protocol routing (Wormhole + LayerZero framework)
- [ ] Staking vault program on devnet
- [ ] Cross-submodule integration validated

### Phase 2 Milestone Checklist

- [ ] Staking pools: create, stake, unstake, cooldown, claim rewards, compound
- [ ] Epoch-based reward distribution (batch processing)
- [ ] Liquid staking: stEDGE mint/redeem, exchange rate tracking
- [ ] Validator delegation
- [ ] Governance: proposals, snapshot-based voting, delegation, timelock, execution, veto
- [ ] Smart contracts: deploy, upgrade, rollback, IDL management, authority management
- [ ] Bridge: Wormhole initiation, status monitoring, retry, asset registry
- [ ] ACS integration points for staking APY and governance quorum
- [ ] Anchor staking vault program deployed to devnet

---

## Phase 3 — Advanced

**Duration:** Weeks 10–13  
**Goal:** DeFi integrations, advanced treasury operations, HSM key management, and multi-chain preparation.

### Week 10: DeFi — Jupiter Swaps & Liquidity Management

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 10.1 | Define Drizzle schemas for defi submodule (8 tables) | 1.5d | Backend |
| 10.2 | Create Supabase migrations + RLS policies | 0.5d | Backend |
| 10.3 | Implement Jupiter integration — `getSwapQuote`, `executeSwap`, `getBestRoute` | 2d | Backend |
| 10.4 | Implement slippage protection (default 50 bps, configurable) | 0.5d | Backend |
| 10.5 | Implement `DefiService.addLiquidity` — Raydium AMM adapter | 1.5d | Backend |
| 10.6 | Implement `DefiService.addLiquidity` — Orca Whirlpool adapter (concentrated LP) | 1.5d | Backend |
| 10.7 | Implement `DefiService.removeLiquidity` with percentage-based withdrawal | 1d | Backend |
| 10.8 | Implement `DefiService.adjustRange` for CLMM positions | 0.5d | Backend |
| 10.9 | Implement `DefiService.collectFees` | 0.5d | Backend |

**Deliverables:**
- [ ] 8 DeFi tables migrated
- [ ] Jupiter swap integration with multi-hop routing
- [ ] Raydium AMM liquidity management
- [ ] Orca Whirlpool concentrated liquidity management
- [ ] Slippage protection on all swaps

---

### Week 11: DeFi — Farming, Strategies & IL Tracking

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 11.1 | Implement `DefiService.enterFarm` / `exitFarm` / `harvestRewards` | 1.5d | Backend |
| 11.2 | Implement `DefiService.compoundFarmRewards` — harvest + reinvest | 0.5d | Backend |
| 11.3 | Implement auto-compound cron job (configurable: hourly/daily/weekly) | 0.5d | Backend |
| 11.4 | Implement `DefiService.createStrategy` / `executeStrategy` / `rebalanceStrategy` | 1.5d | Backend |
| 11.5 | Implement strategy approval gate (high risk or >$50K requires treasury manager approval) | 0.5d | Backend |
| 11.6 | Implement impermanent loss tracking engine (6-hour snapshot cycle) | 1.5d | Backend |
| 11.7 | Implement `DefiService.getImpermanentLossData` | 0.5d | Backend |
| 11.8 | Implement `DefiService.getPortfolioSummary` — aggregate DeFi positions | 0.5d | Backend |
| 11.9 | Implement `DefiService.getPoolMetrics` and `snapshotPositions` | 0.5d | Backend |
| 11.10 | Implement protocol integration health monitoring | 0.5d | Backend |
| 11.11 | Integration tests: swap → LP → farm → harvest → compound cycle | 1.5d | Backend |

**Deliverables:**
- [ ] Yield farming (enter, exit, harvest, compound)
- [ ] Auto-compound cron
- [ ] Yield strategies with risk-based approval
- [ ] Impermanent loss tracking
- [ ] Portfolio summary aggregation

---

### Week 12: Treasury & Multi-Chain Preparation

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 12.1 | Define Drizzle schemas for treasury submodule (9 tables) | 1.5d | Backend |
| 12.2 | Create Supabase migrations + RLS policies | 0.5d | Backend |
| 12.3 | Implement `TreasuryService.createVault` — Squads multi-sig PDA creation | 1.5d | Backend |
| 12.4 | Implement `TreasuryService.addSigner` / `removeSigner` / `updateThreshold` | 0.5d | Backend |
| 12.5 | Implement `TreasuryService.createSpendingProposal` — policy validation, HITL detection | 1d | Backend |
| 12.6 | Implement `TreasuryService.approveSpending` — multi-sig approval collection | 1d | Backend |
| 12.7 | Implement `TreasuryService.executeSpending` — Squads multi-sig execution | 1.5d | Backend |
| 12.8 | Implement HITL integration with `@mcv/agentic-os/hitl` for high-value transactions | 1d | Backend |
| 12.9 | Implement `TreasuryService.createPolicy` / `validateSpending` — spending policy engine | 1d | Backend |
| 12.10 | Design EVM adapter interface for future multi-chain support | 0.5d | Backend |

**Deliverables:**
- [ ] 9 treasury tables migrated
- [ ] Multi-sig vault creation (Squads Protocol)
- [ ] Spending proposal → approval → execution flow
- [ ] HITL integration for high-value operations
- [ ] Spending policy engine
- [ ] EVM adapter interface design

---

### Week 13: Treasury Advanced, HSM & Vesting/Airdrops

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 13.1 | Implement `TreasuryService.diversify` — multi-asset rebalancing via Jupiter swaps | 1d | Backend |
| 13.2 | Implement `TreasuryService.snapshotNAV` / `getHistoricalNAV` | 0.5d | Backend |
| 13.3 | Implement NAV snapshot cron job (6-hour interval) | 0.25d | Backend |
| 13.4 | Implement `TreasuryService.reconcile` — on-chain vs off-chain balance comparison | 1d | Backend |
| 13.5 | Implement `TreasuryService.syncPositions` — on-chain balance refresh | 0.5d | Backend |
| 13.6 | Implement `TokenService.createVestingSchedule` — all 4 types (linear, cliff, milestone, custom) | 1.5d | Backend |
| 13.7 | Implement `TokenService.getClaimableAmount` / `claimVestedTokens` / `cancelVesting` | 1d | Backend |
| 13.8 | Implement `TokenService.createAirdropCampaign` / `generateMerkleTree` / `claimAirdrop` | 1.5d | Backend |
| 13.9 | Implement HSM key management — key rotation with asset transfer | 1d | Security |
| 13.10 | Implement `WalletService.rotateKey` / `getKeyStatus` | 0.5d | Backend + Security |
| 13.11 | Integration tests: full treasury flow (vault → proposal → approve → HITL → execute) | 1d | Backend |
| 13.12 | Phase 3 code review | 0.5d | All |

**Deliverables:**
- [ ] Treasury diversification (multi-asset rebalancing)
- [ ] NAV tracking and historical snapshots
- [ ] On-chain vs off-chain reconciliation
- [ ] All vesting schedule types (linear, cliff, milestone, custom)
- [ ] Merkle tree airdrop campaigns
- [ ] HSM key rotation with asset transfer
- [ ] Full treasury integration tests

### Phase 3 Milestone Checklist

- [ ] Jupiter swap integration with multi-hop routing
- [ ] Raydium AMM and Orca Whirlpool LP management
- [ ] Yield farming with auto-compound
- [ ] Impermanent loss tracking (6-hour cycle)
- [ ] Yield strategies with risk-based approval gates
- [ ] Multi-sig treasury vaults (Squads Protocol)
- [ ] Treasury spending proposals with policy enforcement
- [ ] HITL integration for >$10K transactions
- [ ] Treasury diversification and NAV tracking
- [ ] On-chain/off-chain reconciliation
- [ ] Vesting schedules (all 4 types)
- [ ] Merkle tree airdrop campaigns
- [ ] Key rotation with asset migration
- [ ] EVM adapter interface designed

---

## Phase 4 — Polish & Hardening

**Duration:** Weeks 14–16  
**Goal:** Performance optimization, security hardening, client components, and integration testing.

### Week 14: Performance Optimization & Client Components

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 14.1 | Optimize RPC call patterns — batch where possible, reduce redundant calls | 1d | Backend |
| 14.2 | Implement connection pooling optimization for high-throughput scenarios | 0.5d | Backend |
| 14.3 | Database query optimization — add composite indexes, analyze slow queries | 1d | Backend |
| 14.4 | Implement time-based table partitioning for high-volume tables (`wallet_transactions`, `token_transfers`, `swap_transactions`) | 1d | Backend |
| 14.5 | Implement all 12 React client hooks (`useWallet`, `useStaking`, `useGovernance`, etc.) | 2d | Frontend |
| 14.6 | Implement all 16 React client components (`WalletConnectButton`, `StakingDashboard`, `TreasuryDashboard`, etc.) | 3d | Frontend |
| 14.7 | Set up React Query caching configuration for all hooks | 0.5d | Frontend |
| 14.8 | Implement Solana wallet adapter integration (`WalletConnectButton`) | 0.5d | Frontend |

**Deliverables:**
- [ ] RPC call optimization
- [ ] Database query optimization with partitioning
- [ ] All 12 client hooks
- [ ] All 16 client components
- [ ] Wallet adapter integration

---

### Week 15: Security Hardening & Audit Preparation

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 15.1 | Security audit of KMS integration — verify zero-plaintext-in-memory pattern | 1d | Security |
| 15.2 | Verify all private key operations zero memory after use | 0.5d | Security |
| 15.3 | Audit all RLS policies — verify venture isolation, service-role restrictions | 1d | Security |
| 15.4 | Implement rate limiting on all service methods (per-wallet, per-IP) | 1d | Backend |
| 15.5 | Verify multi-sig enforcement on all high-value operations | 0.5d | Security |
| 15.6 | Verify HITL gating triggers correctly for >$10K transactions | 0.5d | Security |
| 15.7 | Verify compliance checks run on all outbound transfers and wallet links | 0.5d | Security |
| 15.8 | Verify transaction simulation runs before every send | 0.5d | Backend |
| 15.9 | Verify nonce expiration (5 minutes) on wallet linking | 0.25d | Security |
| 15.10 | Verify binary verification on all program deployments | 0.25d | Security |
| 15.11 | Prepare security audit documentation (threat model, key management procedures, compliance flow) | 1d | Security |
| 15.12 | Run static analysis and dependency vulnerability scan | 0.5d | Security |
| 15.13 | Verify all error messages don't leak sensitive information (key material, internal addresses) | 0.5d | Security |
| 15.14 | Complete security checklist from 02-TECHNICAL-ARCHITECTURE.md (20 items) | 1d | Security + Backend |

**Deliverables:**
- [ ] KMS integration audit passed
- [ ] RLS policy audit passed
- [ ] Rate limiting implemented
- [ ] All security checklist items verified
- [ ] Audit documentation prepared

---

### Week 16: Integration Testing, Documentation & Launch Preparation

**Tasks:**

| # | Task | Estimate | Assignee |
|---|------|----------|----------|
| 16.1 | End-to-end integration tests: wallet → stake → earn → claim → unstake → withdraw | 1d | Backend |
| 16.2 | End-to-end integration tests: proposal → vote → timelock → execute treasury transfer | 1d | Backend |
| 16.3 | End-to-end integration tests: deploy program → upgrade → rollback | 0.5d | Backend |
| 16.4 | End-to-end integration tests: bridge initiate → monitor → claim (Wormhole testnet) | 1d | Backend |
| 16.5 | End-to-end integration tests: LP → farm → harvest → compound → withdraw | 1d | Backend |
| 16.6 | Load testing: simulate 100 concurrent stakers, 50 concurrent swaps | 1d | Backend + DevOps |
| 16.7 | Load testing: RPC failover under heavy load | 0.5d | Backend + DevOps |
| 16.8 | Finalize observability: structured logging, metrics dashboards, alert rules | 1d | Backend + DevOps |
| 16.9 | Complete package exports — verify all schemas, services, types, hooks, components exported | 0.5d | Backend |
| 16.10 | Final documentation review and update | 0.5d | All |
| 16.11 | Devnet deployment verification — all services operational | 0.5d | All |
| 16.12 | Mainnet deployment runbook preparation | 0.5d | DevOps + Backend |

**Deliverables:**
- [ ] All end-to-end integration tests passing
- [ ] Load tests passing (100 concurrent stakers, 50 swaps)
- [ ] Observability dashboards configured
- [ ] All exports verified
- [ ] Documentation complete
- [ ] Devnet operational
- [ ] Mainnet runbook prepared

### Phase 4 Milestone Checklist

- [ ] RPC and database performance optimized
- [ ] Table partitioning for high-volume tables
- [ ] All 12 React hooks implemented
- [ ] All 16 React components implemented
- [ ] KMS security audit passed
- [ ] RLS policy audit passed
- [ ] Rate limiting on all methods
- [ ] Full security checklist verified (20 items)
- [ ] End-to-end integration tests for all 8 submodules
- [ ] Load tests passing
- [ ] Observability complete (logging, metrics, alerts)
- [ ] Documentation finalized
- [ ] Devnet fully operational
- [ ] Mainnet deployment runbook ready

---

## Testing Strategy

### Test Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TEST PYRAMID                                  │
│                                                                     │
│                         ╱╲                                          │
│                        ╱  ╲        E2E Tests (5%)                   │
│                       ╱    ╲       Full lifecycle flows on devnet    │
│                      ╱──────╲                                       │
│                     ╱        ╲     Integration Tests (25%)          │
│                    ╱          ╲    Cross-service, database, RPC     │
│                   ╱────────────╲                                    │
│                  ╱              ╲   Unit Tests (70%)                │
│                 ╱                ╲  Service logic, BAL, utilities   │
│                ╱──────────────────╲                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Unit Tests (70% of test suite)

**Coverage target:** 80%+ for all service files.

| Area | What's Tested | Mock Strategy |
|------|--------------|---------------|
| Yield calculation | Simple/compound interest math | Pure functions, no mocks |
| Balance caching | Redis get/set/TTL behavior | Mock Redis client |
| Transaction batching | Instruction grouping, size limits | Mock Solana connection |
| Fee estimation | Priority fee calculation | Mock recent blockhash |
| Compliance | OFAC/mixer check logic | Mock Chainalysis API |
| Vesting | Claimable amount math for all 4 types | Pure functions, no mocks |
| Merkle tree | Generation and proof verification | Pure functions, no mocks |
| Policy engine | Spending limit validation | Mock database |
| State machines | Proposal lifecycle, bridge status | Pure functions, no mocks |

### Integration Tests (25% of test suite)

**Environment:** Solana devnet (or local test validator for CI).

| Flow | Services Involved | Assertions |
|------|-------------------|------------|
| Wallet creation → balance query | wallets, BAL | Wallet exists on-chain, balance returns 0 |
| Token mint → transfer → balance | tokens, wallets, BAL | Supply increased, balances updated |
| Wallet link → verify → compliance | wallets, compliance | Link verified, compliance status set |
| Stake → earn → claim → unstake | staking, tokens, wallets, BAL | Rewards calculated, cooldown enforced |
| Proposal → vote → execute | governance, tokens, treasury | Snapshot accurate, timelock enforced |
| Deploy → upgrade → rollback | contracts, BAL | Binary verified, version tracked |
| Bridge initiate → monitor | bridge, wallets, BAL | Status transitions correct |
| Treasury proposal → HITL → execute | treasury, wallets, agentic-os | Multi-sig collected, HITL enforced |

### End-to-End Tests (5% of test suite)

**Environment:** Solana devnet with real RPC calls.

| Scenario | Duration | Frequency |
|----------|----------|-----------|
| Full staking lifecycle (stake → epochs → claim → unstake → withdraw) | ~5 min | Per release |
| Full governance lifecycle (propose → vote → timelock → execute) | ~10 min | Per release |
| Bridge round-trip (Solana → Wormhole testnet → claim) | ~15 min | Weekly |
| Treasury spending with HITL approval | ~5 min | Per release |
| DeFi cycle (swap → LP → farm → harvest → compound) | ~5 min | Per release |

### Test Configuration

```typescript
// vitest.config.ts for @mcv/web3-core
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      exclude: [
        '**/__tests__/**',
        '**/client/**',        // Client components tested separately
        '**/types.ts',
        '**/constants.ts',
      ],
    },
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30_000,         // 30s for integration tests
  },
});
```

---

## Acceptance Criteria

### Functional Acceptance

| # | Criterion | Validation Method |
|---|-----------|-------------------|
| AC-1 | Create a managed wallet with KMS-encrypted keys, derive child wallets, and sign transactions | Integration test on devnet |
| AC-2 | Link an external wallet via Ed25519 signature verification with 5-minute nonce expiry | Integration test |
| AC-3 | Run OFAC/mixer compliance check on any wallet address before linking or transferring | Integration test with Chainalysis |
| AC-4 | Mint, burn, and transfer SPL tokens with authority validation and supply tracking | Integration test on devnet |
| AC-5 | Create a vesting schedule (all 4 types) and claim tokens according to the schedule | Unit + integration test |
| AC-6 | Generate Merkle tree for airdrop and verify claims with proofs | Unit test + devnet integration |
| AC-7 | Create staking pool, stake EDGE, earn rewards for 2+ epochs, claim or compound rewards | Integration test (~5 min) |
| AC-8 | Unstake with cooldown enforcement — cannot withdraw until cooldown expires | Integration test |
| AC-9 | Mint stEDGE tokens proportional to stake, verify exchange rate increases over time | Integration test |
| AC-10 | Create governance proposal (requires threshold tokens), activate voting, cast votes | Integration test |
| AC-11 | Voting power matches snapshot slot balance (not current balance) | Unit test |
| AC-12 | Passed proposal enters timelock, cannot execute before delay, executes after delay | Integration test |
| AC-13 | Deploy Anchor program, verify binary hash, upgrade with multi-sig approval | Devnet integration test |
| AC-14 | Rollback program to previous version using stored S3 binary | Devnet integration test |
| AC-15 | Initiate Wormhole bridge transfer, monitor attestation, claim on destination | Testnet integration test |
| AC-16 | Failed bridge auto-retries 3 times with exponential backoff | Integration test with mock failure |
| AC-17 | Execute Jupiter swap with slippage protection (revert if > tolerance) | Devnet integration test |
| AC-18 | Add liquidity to Raydium/Orca pool, track fees, calculate IL | Devnet integration test |
| AC-19 | Create Squads multi-sig vault, propose spending, collect N-of-M approvals, execute | Devnet integration test |
| AC-20 | Treasury spend >$10K triggers HITL, blocks execution until human approves | Integration test |
| AC-21 | NAV snapshot captures all vault positions including DeFi, runs every 6 hours | Cron + integration test |
| AC-22 | Reconciliation detects >0.1% discrepancy between on-chain and off-chain balances | Integration test |

### Non-Functional Acceptance

| # | Criterion | Target | Validation |
|---|-----------|--------|------------|
| NF-1 | Balance query latency (cached) | < 50ms | Load test |
| NF-2 | Balance query latency (cache miss, RPC) | < 500ms | Load test |
| NF-3 | Transaction submission to confirmation | < 10s (finalized) | Load test |
| NF-4 | Batch transfer (10 recipients) | < 15s (finalized) | Load test |
| NF-5 | RPC failover time | < 15s (3 health check failures) | Chaos test |
| NF-6 | Concurrent staking operations | 100 simultaneous stakes | Load test |
| NF-7 | Concurrent swap operations | 50 simultaneous swaps | Load test |
| NF-8 | Unit test coverage | ≥ 80% lines | CI pipeline |
| NF-9 | Zero plaintext keys in logs or error messages | 100% verified | Security audit |
| NF-10 | All blockchain operations logged to audit trail | 100% coverage | Code review |

---

## Risks & Mitigations

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Solana RPC instability** | Transaction failures, balance stale | Medium | Triple-provider load balancing, 10s health checks, aggressive caching |
| **KMS latency spikes** | Slow transaction signing | Low | KMS call caching for repeated operations, retry with backoff |
| **Anchor framework breaking changes** | Program deployment failures | Low | Pin Anchor version, test upgrades in isolated environment |
| **Wormhole guardian downtime** | Bridge attestations delayed | Medium | Multi-protocol routing (fallback to LayerZero), retry with backoff |
| **Jupiter API rate limiting** | Swap quote failures | Medium | Client-side rate limiting, quote caching (30s TTL), fallback to direct Raydium/Orca |
| **Squads Protocol bugs** | Treasury operations blocked | Low | Test extensively on devnet, maintain manual override capability |
| **Database migration failures** | Schema inconsistency | Low | Drizzle migration testing in staging, rollback scripts for every migration |
| **Redis cache corruption** | Stale balance data | Low | Short TTL (10s), force-refresh capability, graceful degradation to RPC |

### Security Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **KMS key compromise** | All managed wallet funds at risk | Very Low | AWS KMS key policies, IAM restrictions, key rotation every 90 days |
| **Transaction replay** | Duplicate operations | Low | Recent blockhash requirement, idempotency by txSignature |
| **Flash-loan governance attack** | Malicious proposal passed | Medium | Snapshot-based voting, timelock delay, veto authority |
| **Compliance evasion** | Sanctioned entity interaction | Low | Pre-transfer screening, periodic re-screening, Chainalysis alerts |
| **Multi-sig collusion** | Unauthorized treasury spend | Very Low | HITL gate for high-value operations, transparent on-chain audit |
| **Supply-chain attack on programs** | Malicious code deployed | Low | Binary verification (SHA-256), multi-sig upgrade requirement |

### Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Blockchain engineer availability** | Phase 2 Anchor work delayed | Medium | Backend engineers can handle non-program tasks, contract templates available |
| **Devnet SOL faucet unreliable** | Testing blocked | Medium | Local test validator as fallback, stockpile devnet SOL |
| **Third-party API changes** | Integration breakage | Low | Version-pinned SDKs, adapter pattern for all external services |
| **Regulatory changes** | Compliance requirements shift | Low | Modular compliance engine, Chainalysis handles list updates |
| **Scope creep** | Timeline extension | Medium | Strict phase gates, feature freeze before Phase 4 |

---

## Timeline

### Gantt Summary

```
Week   1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16
      ┌────────────────────┐
P1    │  FOUNDATION        │
      │ Wallets + Tokens   │
      │ BAL + KMS          │
      └────────────────────┘
                            ┌──────────────────────────┐
P2                          │  CORE                     │
                            │ Staking + Governance      │
                            │ Contracts + Bridge        │
                            └──────────────────────────┘
                                                         ┌────────────────────┐
P3                                                       │  ADVANCED           │
                                                         │ DeFi + Treasury     │
                                                         │ HSM + Vesting       │
                                                         └────────────────────┘
                                                                               ┌──────────────┐
P4                                                                             │  POLISH       │
                                                                               │ Security      │
                                                                               │ Testing       │
                                                                               └──────────────┘
```

### Phase Summary

| Phase | Duration | Focus | Key Deliverables |
|-------|----------|-------|------------------|
| **Phase 1** | Weeks 1–4 | Foundation | BAL, wallets (6 tables), tokens (10 tables), KMS signing, compliance |
| **Phase 2** | Weeks 5–9 | Core | Staking (9 tables), governance (6 tables), contracts (6 tables), bridge (4 tables), Anchor programs |
| **Phase 3** | Weeks 10–13 | Advanced | DeFi (8 tables), treasury (9 tables), vesting, airdrops, HSM, multi-chain prep |
| **Phase 4** | Weeks 14–16 | Polish | Client hooks (12), components (16), security audit, load tests, documentation |
| **Total** | **16 weeks** | | **61 tables, 8 services, 12 hooks, 16 components** |

### Milestones

| Milestone | Target Date | Gate Criteria |
|-----------|------------|---------------|
| **M1: Foundation Complete** | End of Week 4 | Wallet creation, token transfers, KMS signing, compliance checks — all passing on devnet |
| **M2: Core Complete** | End of Week 9 | Staking, governance, contracts, bridge — all integration tests passing on devnet |
| **M3: Advanced Complete** | End of Week 13 | DeFi, treasury, vesting, airdrops — full feature set operational on devnet |
| **M4: Launch Ready** | End of Week 16 | Security audit passed, load tests passing, documentation complete, mainnet runbook ready |

### Dependencies Between Phases

```
Phase 1 (Foundation)          Phase 2 (Core)                Phase 3 (Advanced)
┌──────────────────┐         ┌──────────────────┐          ┌──────────────────┐
│ wallets          │────────▶│ staking          │─────────▶│ defi             │
│ tokens           │────────▶│ governance       │          │ (uses wallets,   │
│ BAL              │────────▶│ contracts        │          │  tokens, staking)│
│                  │────────▶│ bridge           │          │                  │
│                  │         │                  │          │ treasury         │
│                  │         │ (all use wallets │          │ (uses wallets,   │
│                  │         │  and BAL from P1)│          │  governance,     │
│                  │         │                  │          │  defi)           │
└──────────────────┘         └──────────────────┘          └──────────────────┘
         │                                                          │
         │                   Phase 4 (Polish)                       │
         │                   ┌──────────────────┐                   │
         └──────────────────▶│ client hooks     │◀──────────────────┘
                             │ client components│
                             │ security audit   │
                             │ load testing     │
                             │ documentation    │
                             └──────────────────┘
```

### Resource Allocation by Phase

| Role | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|------|---------|---------|---------|---------|
| Backend Engineer #1 | 100% | 100% | 100% | 80% |
| Backend Engineer #2 | 100% | 100% | 100% | 80% |
| Blockchain Engineer | 0% | 100% | 20% | 10% |
| Security Engineer | 30% | 10% | 30% | 100% |
| Frontend Engineer | 0% | 0% | 20% | 100% |
| DevOps | 40% (setup) | 10% | 10% | 30% |

---

*@mcv/web3-core — Web3 Core Infrastructure*
