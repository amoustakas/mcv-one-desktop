# @mcv/web3-core — Technical Architecture

**Module:** @mcv/web3-core  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** MCV-ONLY (Internal Blockchain Infrastructure)  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
   - [bridge — Cross-Chain Bridge Operations](#bridge--cross-chain-bridge-operations)
   - [contracts — Smart Contract Deployment & Interaction](#contracts--smart-contract-deployment--interaction)
   - [defi — DeFi Protocol Integrations](#defi--defi-protocol-integrations)
   - [governance — On-Chain Governance & Voting](#governance--on-chain-governance--voting)
   - [staking — Token Staking & Rewards](#staking--token-staking--rewards)
   - [tokens — Token Management & EDGE Token](#tokens--token-management--edge-token)
   - [treasury — On-Chain Treasury Management](#treasury--on-chain-treasury-management)
   - [wallets — Wallet Management & Key Custody](#wallets--wallet-management--key-custody)
4. [Data Models](#data-models)
5. [Blockchain Integration](#blockchain-integration)
6. [Data Flow & Events](#data-flow--events)
7. [Integration Points](#integration-points)
8. [Performance](#performance)
9. [Scalability](#scalability)
10. [Error Handling](#error-handling)
11. [Observability](#observability)
12. [Security](#security)

---

## Architecture Overview

`@mcv/web3-core` is the **single, authoritative blockchain infrastructure layer** for the MCV Global Consortium. Every on-chain operation — wallet creation, token transfer, staking, governance voting, DeFi yield farming, cross-chain bridging, and treasury management — flows through this module. It is the cryptographic backbone that powers the EDGE token economy across 9 MCV ventures.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Security-First** | Private keys never exist in plaintext. All signing goes through KMS. Multi-sig and HITL gates protect high-value operations. |
| **Blockchain Abstraction** | Services never touch raw RPC calls directly. The Blockchain Abstraction Layer (BAL) handles connection pooling, retries, confirmation tracking, and fee estimation. |
| **Audit Everything** | Every blockchain operation is logged to the `@mcv/fabric` audit trail with actor, action, resource, and full metadata. No silent mutations. |
| **Composability** | Each submodule is self-contained with its own schema, service, and types, but they compose through well-defined interfaces. Staking calls wallets for signing, governance calls tokens for snapshots. |
| **Progressive Decentralization** | The architecture supports a migration path from centralized (team-controlled) to hybrid (multi-sig + governance) to fully decentralized (DAO). The veto authority, guardian address, and HITL gates are designed to be progressively removed. |
| **ACS Integration** | The Algorithmic Control System (ACS v2.0) dynamically adjusts economic parameters — staking APY, governance quorum, fee burns — based on the current market cap regime. All tunable parameters are ACS-controllable. |

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Blockchain** | Solana (mainnet-beta / devnet) | Primary L1 for EDGE token and all on-chain operations |
| **Smart Contracts** | Anchor Framework (@coral-xyz/anchor) | Solana program development, IDL generation, type-safe CPI |
| **Token Standard** | SPL Token (@solana/spl-token) | EDGE token, stEDGE (liquid staking), wrapped assets, ATAs |
| **RPC Client** | @solana/web3.js | Solana RPC communication, transaction building, account deserialization |
| **Key Management** | AWS KMS + HashiCorp Vault | Envelope encryption for private keys, signing delegation |
| **Multi-Sig** | Squads Protocol (@sqds/multisig) | On-chain multi-sig vaults for treasury and program upgrades |
| **DEX Aggregation** | Jupiter (@jup-ag/api) | Best-route swaps across all Solana DEXs |
| **AMM/LP** | Raydium SDK, Orca Whirlpools SDK | AMM/CLMM liquidity provision, yield farming |
| **Bridges** | Wormhole SDK, LayerZero SDK | Cross-chain token transfers (Solana ↔ EVM chains) |
| **Database** | PostgreSQL via Supabase | Persistent storage with Row Level Security |
| **ORM** | Drizzle ORM | Type-safe schema definition, migrations, queries |
| **Cache** | Redis (ioredis) | Balance caching, RPC response caching, rate limiting |
| **Compliance** | Chainalysis API | OFAC screening, mixer detection, address risk scoring |
| **Signing** | tweetnacl | Ed25519 signature generation and verification |
| **Merkle Trees** | merkletreejs + keccak256 | Airdrop claim verification, governance snapshots |
| **Metadata** | Metaplex (@metaplex-foundation/js) | Token metadata, logos, and on-chain attributes |

### Architectural Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MCV Application Layer                                │
│  (BetEdge, SerpSpace, Full Gain, MCV Studios, Futurestate, +4 ventures)    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ @mcv/web3-   │  │ @mcv/token-  │  │ @mcv/        │  │ @mcv/        │   │
│  │ public       │  │ economy      │  │ treasury     │  │ agentic-os   │   │
│  │ (consumer    │  │ (EDGE token  │  │ (fiat-crypto │  │ (NAOS agents │   │
│  │  features)   │  │  economics)  │  │  unified)    │  │  + HITL)     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                  │                  │           │
│  ┌──────┴─────────────────┴──────────────────┴──────────────────┴───────┐  │
│  │                                                                      │  │
│  │                     @mcv/web3-core (THIS MODULE)                     │  │
│  │                                                                      │  │
│  │  The SINGLE SOURCE OF TRUTH for all blockchain operations            │  │
│  │                                                                      │  │
│  └──────────────────────────────┬───────────────────────────────────────┘  │
│                                 │                                          │
│  ┌──────────────────────────────┴───────────────────────────────────────┐  │
│  │                 Blockchain Abstraction Layer (BAL)                    │  │
│  │  SolanaAdapter · EVMAdapter (planned) · RPCLoadBalancer · KMSSigner  │  │
│  └──────────────────────────────┬───────────────────────────────────────┘  │
│                                 │                                          │
├─────────────────────────────────┼──────────────────────────────────────────┤
│                                 ▼                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Solana       │  │ Jupiter API  │  │ Wormhole     │  │ Squads       │   │
│  │ Validators   │  │ (DEX)        │  │ Guardians    │  │ Protocol     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                     EXTERNAL BLOCKCHAIN INFRASTRUCTURE                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## System Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            @mcv/web3-core — FULL SYSTEM ARCHITECTURE                             │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              ENTRY POINTS                                                  │  │
│  │                                                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │  API Routes   │  │  Cron Jobs   │  │  Webhooks    │  │ NAOS Agents  │  │ Client SDK │  │  │
│  │  │ /api/web3/*   │  │  Rewards     │  │  Solana      │  │  Treasury    │  │  Phantom   │  │  │
│  │  │ /api/tokens/* │  │  Vesting     │  │  Wormhole    │  │  DeFi Agent  │  │  WalletAdp │  │  │
│  │  │ /api/stake/*  │  │  Staking     │  │  Jupiter     │  │  ACS Engine  │  │            │  │  │
│  │  │ /api/gov/*    │  │  Snapshots   │  │  Helius      │  │  Bridge Mon  │  │            │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘  │  │
│  │         │                 │                  │                  │                  │        │  │
│  │         └─────────────────┴──────────────────┴──────────────────┴──────────────────┘        │  │
│  │                                         │                                                  │  │
│  └─────────────────────────────────────────┼──────────────────────────────────────────────────┘  │
│                                            ▼                                                     │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              SERVICE LAYER (8 Submodules)                                  │  │
│  │                                                                                            │  │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────┐ │  │
│  │  │     WALLETS        │  │      TOKENS         │  │    CONTRACTS       │  │   STAKING    │ │  │
│  │  │                    │  │                     │  │                    │  │              │ │  │
│  │  │  HD derivation     │  │  EDGE mint/burn     │  │  Program deploy    │  │  Pool mgmt   │ │  │
│  │  │  KMS key mgmt      │  │  SPL operations     │  │  IDL management    │  │  Yield calc  │ │  │
│  │  │  Tx signing        │  │  Vesting engine     │  │  Upgrades          │  │  Delegations │ │  │
│  │  │  Wallet-as-a-Svc   │  │  Airdrop engine     │  │  CPI invocations   │  │  Liquid LST  │ │  │
│  │  │  Link/verify       │  │  Supply tracking    │  │  Authority mgmt    │  │  Cooldowns   │ │  │
│  │  │  Compliance check  │  │  Distribution       │  │  Binary verify     │  │  Epochs      │ │  │
│  │  │                    │  │                     │  │                    │  │              │ │  │
│  │  │  6 tables          │  │  10 tables          │  │  6 tables          │  │  9 tables    │ │  │
│  │  └─────────┬──────────┘  └─────────┬───────────┘  └─────────┬──────────┘  └──────┬───────┘ │  │
│  │            │                       │                        │                     │         │  │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────┐ │  │
│  │  │    GOVERNANCE      │  │       DEFI          │  │      BRIDGE        │  │   TREASURY   │ │  │
│  │  │                    │  │                     │  │                    │  │              │ │  │
│  │  │  Proposals         │  │  DEX integration    │  │  Wormhole ops      │  │  Multi-sig   │ │  │
│  │  │  Token voting      │  │  Liquidity pools    │  │  LayerZero ops     │  │  Spending    │ │  │
│  │  │  Delegation        │  │  Yield farming      │  │  Asset tracking    │  │  Diversify   │ │  │
│  │  │  Timelock exec     │  │  IL tracking        │  │  Tx monitoring     │  │  Reconcile   │ │  │
│  │  │  Snapshots         │  │  Jupiter/Orca/Ray   │  │  Relayer mgmt      │  │  NAV track   │ │  │
│  │  │  Veto authority    │  │  Auto-compound      │  │  Auto-retry        │  │  HITL gates  │ │  │
│  │  │                    │  │                     │  │                    │  │              │ │  │
│  │  │  6 tables          │  │  8 tables           │  │  4 tables          │  │  9 tables    │ │  │
│  │  └─────────┬──────────┘  └─────────┬───────────┘  └─────────┬──────────┘  └──────┬───────┘ │  │
│  │            │                       │                        │                     │         │  │
│  │            └───────────────────────┴────────────────────────┴─────────────────────┘         │  │
│  │                                         │                                                  │  │
│  └─────────────────────────────────────────┼──────────────────────────────────────────────────┘  │
│                                            ▼                                                     │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                    BLOCKCHAIN ABSTRACTION LAYER (BAL)                                      │  │
│  │                                                                                            │  │
│  │  All services interact with blockchains through the BAL. Venture apps never touch raw      │  │
│  │  RPC calls. The BAL handles connection pooling, retries, confirmation tracking, fee        │  │
│  │  estimation, transaction batching, and KMS-delegated signing.                              │  │
│  │                                                                                            │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │  │
│  │  │ SolanaAdapter  │  │ EVMAdapter     │  │ RPCLoadBalancer│  │ TxBatchEngine  │           │  │
│  │  │ (Primary)      │  │ (Planned)      │  │ (Helius/QN/   │  │ (10-15 ixs per │           │  │
│  │  │ @solana/web3.js│  │ ethers/viem    │  │  Triton)       │  │  transaction)  │           │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘           │  │
│  │                                                                                            │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │  │
│  │  │ KMS Signer     │  │ Confirmation   │  │ Fee Estimator  │  │ Simulation     │           │  │
│  │  │ (AWS KMS /     │  │ Tracker        │  │ (Priority fee  │  │ Engine         │           │  │
│  │  │  HashiCorp)    │  │ (32+ confirms) │  │  calculation)  │  │ (pre-send)     │           │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘           │  │
│  │                                                                                            │  │
│  └────────────────────────────────────────┬───────────────────────────────────────────────────┘  │
│                                           ▼                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              ACS v2.0 (Algorithmic Control System)                         │  │
│  │                                                                                            │  │
│  │  ┌────────────┐  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐              │  │
│  │  │  Regime    │  │ PID Controller │  │  16 Economic   │  │  HITL Gate      │              │  │
│  │  │  Detector  │  │ (Feedback Loop)│  │  Controllers   │  │  (>5% changes   │              │  │
│  │  │  (5 tiers) │  │                │  │  across 4 cats │  │   require human) │              │  │
│  │  └────────────┘  └────────────────┘  └────────────────┘  └─────────────────┘              │  │
│  │                                                                                            │  │
│  │  Regime Tiers:                                                                             │  │
│  │    1. Pre-Launch (< $1M)  →  Max incentives, 30% staking APY, low governance thresholds   │  │
│  │    2. Launch ($1M-$10M)   →  High incentives, 25% APY, community bootstrapping            │  │
│  │    3. Growth ($10M-$100M) →  Moderate incentives, 15% APY, active governance              │  │
│  │    4. Mature ($100M-$1B)  →  Sustainable rates, 8% APY, full decentralization             │  │
│  │    5. Scale ($1B+)        →  Minimal inflation, 5% APY, protocol-level governance         │  │
│  │                                                                                            │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                            │                                                     │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                      DATABASE LAYER (PostgreSQL via Supabase + Drizzle ORM)                │  │
│  │                                                                                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │  │
│  │  │ Wallets  │ │ Tokens   │ │Contracts │ │ Staking  │ │Governance│ │  DeFi    │           │  │
│  │  │ 6 tables │ │10 tables │ │ 6 tables │ │ 9 tables │ │ 6 tables │ │ 8 tables │           │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │  │
│  │                                                                                            │  │
│  │  ┌──────────┐ ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │Treasury  │ │  web3_audit_trail  |  web3_compliance_checks  |  web3_rpc_metrics        │ │  │
│  │  │ 9 tables │ │  (cross-cutting infrastructure tables)                                   │ │  │
│  │  └──────────┘ └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                            │  │
│  │  Total: 58 tables + 3 cross-cutting tables = 61 tables                                    │  │
│  │  All tables use UUID primary keys, timestamp tracking, and RLS policies via Supabase.      │  │
│  │                                                                                            │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              EXTERNAL DEPENDENCIES                                         │  │
│  │                                                                                            │  │
│  │  Internal MCV Packages:                                                                    │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │  │
│  │  │ @mcv/identity    │  │ @mcv/fabric      │  │ @mcv/treasury    │  │ @mcv/kernel      │   │  │
│  │  │ (Wallet-to-user  │  │ (Event bus,      │  │ (Fiat-crypto     │  │ (DB, context,    │   │  │
│  │  │  linking, KYC)   │  │  audit trail)    │  │  reconciliation) │  │  errors, auth)   │   │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘   │  │
│  │                                                                                            │  │
│  │  External Services:                                                                        │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │  │
│  │  │ Helius API       │  │ Jupiter API      │  │ Wormhole SDK     │  │ AWS KMS          │   │  │
│  │  │ (Enhanced RPC,   │  │ (DEX aggregator, │  │ (Cross-chain     │  │ (Key management, │   │  │
│  │  │  webhooks, DAS)  │  │  routing, swaps) │  │  bridging)       │  │  signing)        │   │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘   │  │
│  │                                                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │  │
│  │  │ Squads Protocol  │  │ Raydium SDK      │  │ Orca SDK         │  │ LayerZero        │   │  │
│  │  │ (Multi-sig,      │  │ (AMM, CLMM,     │  │ (Whirlpools,     │  │ (Cross-chain     │   │  │
│  │  │  treasury vaults)│  │  farms)          │  │  concentrated LP)│  │  messaging)      │   │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘   │  │
│  │                                                                                            │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Architecture

The `@mcv/web3-core` module is organized into **8 self-contained submodules**, each responsible for a specific domain of blockchain operations. Every submodule follows the same internal structure:

```
submodule/
├── schema.ts          # Drizzle ORM table definitions and enums
├── service.ts         # Business logic and blockchain interaction
├── types.ts           # TypeScript type definitions
├── constants.ts       # Submodule-specific constants
├── errors.ts          # Error codes and error classes
├── events.ts          # Event definitions for @mcv/fabric
└── __tests__/         # Unit and integration tests
    ├── service.test.ts
    └── schema.test.ts
```

### Submodule Dependency Graph

```
                    ┌──────────────┐
                    │   wallets    │  ◄── Foundation: All submodules depend on wallets
                    │  (signing,   │      for transaction signing and wallet lookups
                    │   KMS, HD)   │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼──────┐  ┌─────▼──────┐  ┌──────▼─────┐
    │   tokens   │  │ contracts  │  │  treasury  │
    │ (EDGE, SPL │  │ (programs, │  │ (vaults,   │
    │  vesting)  │  │  IDL, CPI) │  │  multi-sig)│
    └─────┬──────┘  └─────┬──────┘  └──────┬─────┘
          │               │                │
    ┌─────▼──────┐  ┌─────▼──────┐  ┌──────▼─────┐
    │  staking   │  │   defi     │  │ governance │
    │ (pools,    │  │ (LP, swap, │  │ (proposals,│
    │  rewards)  │  │  farming)  │  │  voting)   │
    └─────┬──────┘  └────────────┘  └──────┬─────┘
          │                                │
          └────────────────┬───────────────┘
                           │
                    ┌──────▼───────┐
                    │    bridge    │
                    │ (cross-chain │
                    │  transfers)  │
                    └──────────────┘
```

---

### bridge — Cross-Chain Bridge Operations

**Purpose:** Manages cross-chain asset transfers between Solana and EVM chains (Ethereum, Base, Polygon) using Wormhole and LayerZero bridge protocols.

**Tables (4):**

| Table | Records | Description |
|-------|---------|-------------|
| `web3_bridge_transactions` | Every bridge transfer | Source/dest chains, amounts, attestation tracking, status lifecycle |
| `web3_bridged_assets` | Wrapped asset registry | Maps original tokens to their wrapped equivalents on other chains |
| `web3_bridge_configurations` | Protocol configs | Per-route configurations including fees, limits, and estimated times |
| `web3_bridge_relayers` | Relayer nodes | Health tracking for bridge relayer infrastructure |

**Architecture:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         BRIDGE SUBMODULE                                 │
│                                                                          │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │ BridgeService   │────▶│ ProtocolRouter  │────▶│ WormholeAdapter │   │
│  │                 │     │                 │     │ (VAA handling)  │   │
│  │ initiateBridge  │     │ selectBest      │     └─────────────────┘   │
│  │ claimBridged    │     │ Protocol()      │                           │
│  │ monitorPending  │     │                 │     ┌─────────────────┐   │
│  │ retryFailed     │     │ estimateFee()   │────▶│ LayerZeroAdaptr │   │
│  │ cancelBridge    │     │                 │     │ (OFT transfers) │   │
│  └────────┬────────┘     └─────────────────┘     └─────────────────┘   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐                           │
│  │ StatusMonitor   │────▶│ RetryEngine     │                           │
│  │ (polls for      │     │ (exponential    │                           │
│  │  attestation)   │     │  backoff, 3x)   │                           │
│  └─────────────────┘     └─────────────────┘                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **Multi-protocol routing:** The `ProtocolRouter` selects the optimal bridge protocol based on token type, chain pair, transfer amount, and current relayer health. Wormhole is preferred for large transfers (>$10K) due to guardian security; LayerZero for speed (<5 min).
- **Attestation monitoring:** A background poller checks Wormhole guardian attestations (VAAs) and LayerZero message delivery every 30 seconds. Status transitions: `pending → in_transit → completed`.
- **Auto-retry with circuit breaker:** Failed bridges retry up to 3 times with exponential backoff (30s, 120s, 480s). After 3 failures, the circuit breaker opens and the transaction enters `failed` status, triggering an alert to the operations team.
- **Wrapped asset registry:** The `bridgedAssets` table maintains a canonical 1:1 mapping between original Solana SPL tokens and their wrapped equivalents on destination chains. This prevents double-wrapping and ensures clean accounting.

**Bridge Transfer Flow:**

```
User Initiates Bridge
        │
        ▼
┌─────────────────┐
│ Validate inputs  │ ← Check supported route, min/max amounts, balance
│ & compliance     │ ← OFAC check on destination address
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Select protocol  │ ← Wormhole for large, LayerZero for fast
│ & estimate fee   │ ← Include destination gas costs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Lock tokens on   │ ← Transfer to bridge program PDA on Solana
│ source chain     │ ← Record sourceTxSignature
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Wait for         │ ← Poll guardian/relayer for confirmation
│ attestation      │ ← Status: pending → in_transit
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Claim on         │ ← Submit VAA/proof on destination chain
│ destination      │ ← Record destinationTxSignature
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Status:          │ ← Update bridgedAssets totals
│ completed        │ ← Emit web3.bridge.completed event
└─────────────────┘
```

---

### contracts — Smart Contract Deployment & Interaction

**Purpose:** Manages the full lifecycle of Solana programs — from initial deployment through versioned upgrades, IDL management, cross-program invocation tracking, and upgrade authority governance.

**Tables (6):**

| Table | Records | Description |
|-------|---------|-------------|
| `web3_deployed_programs` | Program registry | All deployed programs with status, version, audit info |
| `web3_program_versions` | Version history | Every program version with binary hash, changelog, rollback availability |
| `web3_program_idls` | IDL storage | Anchor IDLs per version for type-safe client generation |
| `web3_program_authorities` | Authority registry | Upgrade, freeze, and close authorities (incl. multi-sig configs) |
| `web3_program_invocations` | CPI log | Cross-program invocation records with compute unit tracking |
| `web3_program_deployments` | Deployment log | Full deployment execution history with multi-step status tracking |

**Architecture:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       CONTRACTS SUBMODULE                                │
│                                                                          │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │ ContractService │────▶│ DeployPipeline  │────▶│ BinaryVerifier  │   │
│  │                 │     │                 │     │                 │   │
│  │ deployProgram   │     │ pending →       │     │ SHA-256 on-     │   │
│  │ upgradeProgram  │     │ deploying →     │     │ chain vs.       │   │
│  │ rollbackProgram │     │ verifying →     │     │ expected hash   │   │
│  │ uploadIdl       │     │ completed       │     │                 │   │
│  └────────┬────────┘     └─────────────────┘     └─────────────────┘   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐                           │
│  │ AuthorityManager│────▶│ MultiSigGate   │                           │
│  │ (upgrade auth,  │     │ (collect N-of-M │                           │
│  │  freeze, close) │     │  signatures)    │                           │
│  └─────────────────┘     └─────────────────┘                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **Multi-sig upgrade requirement:** All production (mainnet-beta) program upgrades require multi-sig approval. The `DeployPipeline` collects signatures from the required threshold of signers before executing the upgrade instruction.
- **Binary verification:** After every deployment, the `BinaryVerifier` fetches the on-chain program binary and compares its SHA-256 hash against the expected hash. This catches supply-chain attacks where a malicious binary could be substituted during deployment.
- **Rollback safety:** The system maintains the last 5 version binaries in S3. Rollbacks re-deploy a previous verified binary through the same pipeline (pending → deploying → verifying → completed).
- **IDL auto-fetch:** When an Anchor program stores its IDL on-chain (via `anchor idl init`), the service can fetch and cache it locally for type-safe client generation. IDLs are versioned alongside program versions.
- **CPI audit trail:** Every cross-program invocation is logged with full account lists, instruction data, compute unit consumption, and success/failure status. This is essential for debugging complex multi-program transactions and for security audits.

**Deployment Pipeline State Machine:**

```
┌─────────┐    start    ┌───────────┐   binary ready   ┌────────────┐
│ PENDING │───────────▶│ DEPLOYING │────────────────▶│ VERIFYING  │
│         │            │ (building, │                 │ (on-chain  │
│         │            │  uploading)│                 │  hash check)│
└─────────┘            └───────────┘                 └──────┬─────┘
                                                            │
                                              ┌─────────────┤
                                              │ match        │ mismatch
                                              ▼             ▼
                                        ┌───────────┐ ┌──────────┐
                                        │ COMPLETED │ │  FAILED  │
                                        │           │ │ (alert!) │
                                        └───────────┘ └──────────┘
```

---

### defi — DeFi Protocol Integrations

**Purpose:** Integrates with Solana DeFi protocols to manage liquidity positions, execute token swaps, run yield farming strategies, and track impermanent loss across Raydium, Orca, Jupiter, and Meteora.

**Tables (8):**

| Table | Records | Description |
|-------|---------|-------------|
| `web3_liquidity_positions` | Active LP positions | Token amounts, tick ranges (CLMM), fees earned, IL tracking |
| `web3_liquidity_pools` | Tracked pools | Pool metadata, TVL, volume, APR per DEX |
| `web3_swap_transactions` | Swap history | Every swap with route info, slippage, price impact |
| `web3_yield_farm_positions` | Farm positions | Staked LP tokens, pending/harvested rewards |
| `web3_yield_strategies` | Strategy configs | Automated yield strategies with risk levels, auto-compound settings |
| `web3_impermanent_loss_tracking` | IL snapshots | Periodic IL calculations with HODL comparison |
| `web3_protocol_integrations` | Protocol registry | External protocol connections and health status |
| `web3_defi_snapshots` | Portfolio snapshots | Periodic total portfolio value snapshots |

**Architecture:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         DEFI SUBMODULE                                   │
│                                                                          │
│  ┌─────────────────┐                                                    │
│  │   DefiService   │                                                    │
│  │                 │                                                    │
│  │ addLiquidity    │     ┌─────────────────┐                            │
│  │ removeLiquidity │────▶│ DEX Adapters    │                            │
│  │ executeSwap     │     │                 │                            │
│  │ enterFarm       │     │ ┌─────────────┐ │     ┌─────────────────┐   │
│  │ harvestRewards  │     │ │ Raydium     │ │────▶│ AMM + CLMM      │   │
│  │ compoundFarm    │     │ │ Adapter     │ │     │ pools, farms     │   │
│  └────────┬────────┘     │ └─────────────┘ │     └─────────────────┘   │
│           │              │ ┌─────────────┐ │     ┌─────────────────┐   │
│           │              │ │ Orca        │ │────▶│ Whirlpools      │   │
│           │              │ │ Adapter     │ │     │ concentrated LP  │   │
│           │              │ └─────────────┘ │     └─────────────────┘   │
│           │              │ ┌─────────────┐ │     ┌─────────────────┐   │
│           │              │ │ Jupiter     │ │────▶│ DEX aggregator   │   │
│           │              │ │ Adapter     │ │     │ multi-hop routing│   │
│           │              │ └─────────────┘ │     └─────────────────┘   │
│           │              │ ┌─────────────┐ │     ┌─────────────────┐   │
│           │              │ │ Meteora     │ │────▶│ Dynamic pools    │   │
│           │              │ │ Adapter     │ │     │                  │   │
│           │              │ └─────────────┘ │     └─────────────────┘   │
│           │              └─────────────────┘                            │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│  │ StrategyEngine  │────▶│ ILTracker       │────▶│ AutoCompounder  │  │
│  │ (risk-rated     │     │ (6-hour cycle,  │     │ (hourly/daily/  │  │
│  │  yield strats)  │     │  HODL compare)  │     │  weekly harvest) │  │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **Jupiter-first routing:** All swaps route through Jupiter's DEX aggregator for best execution. Jupiter automatically finds optimal paths across Raydium, Orca, Meteora, and other DEXs, including multi-hop routes (e.g., EDGE → USDC → SOL).
- **Slippage protection:** Every swap enforces a configurable slippage tolerance (default 50 bps / 0.5%). Transactions revert on-chain if actual output deviates beyond tolerance.
- **Concentrated liquidity management:** For CLMM positions (Orca Whirlpools, Raydium CLMM), the service tracks tick ranges and `inRange` status. Out-of-range positions trigger notifications for rebalancing.
- **IL tracking:** Impermanent loss is calculated every 6 hours by comparing current LP value against a HODL-equivalent portfolio. The `netPnlUsd` metric accounts for earned fees to determine net profitability.
- **Strategy approval gates:** Yield strategies rated `high` risk or with allocations exceeding $50K require explicit treasury manager approval before execution.
- **Auto-compounding:** A cron job harvests farm rewards and re-stakes at the configured frequency (hourly, daily, or weekly), maximizing compound returns.

---

### governance — On-Chain Governance & Voting

**Purpose:** Implements on-chain governance for the EDGE token ecosystem with proposal creation, token-weighted voting, delegation, timelock execution, and snapshot-based voting power.

**Tables (6):**

| Table | Records | Description |
|-------|---------|-------------|
| `web3_governance_configs` | Config per venture | Quorum %, voting period, timelock delay, veto authority |
| `web3_proposals` | Governance proposals | Title, description, votes, status, execution payload |
| `web3_votes` | Individual votes | Voter address, vote type, voting power, delegation info |
| `web3_voting_delegations` | Power delegations | Delegator → delegate mappings with active/revoked status |
| `web3_timelock_queues` | Execution queue | Passed proposals awaiting timelock expiration |
| `web3_governance_snapshots` | Balance snapshots | Token balances at snapshot slot for anti-flash-loan voting |

**Proposal Lifecycle:**

```
┌──────────┐    activate    ┌──────────┐    voting ends    ┌───────────────┐
│          │───────────────▶│          │──────────────────▶│ Tally Votes   │
│  DRAFT   │                │  ACTIVE  │                   │               │
│          │                │ (voting) │                   │ quorum met?   │
└──────────┘                └──────────┘                   │ majority for? │
                                 │                         └───────┬───────┘
                                 │ veto                            │
                                 ▼                   ┌─────────────┴─────────────┐
                          ┌──────────┐               │ YES                       │ NO
                          │  VETOED  │               ▼                           ▼
                          └──────────┘         ┌──────────┐             ┌──────────┐
                                               │  PASSED  │             │ REJECTED │
                                               └────┬─────┘             └──────────┘
                                                    │ queue
                                                    ▼
                                               ┌──────────┐    delay    ┌──────────┐
                                               │ TIMELOCK │────────────▶│  READY   │
                                               │ (24h+)   │             │          │
                                               └──────────┘             └────┬─────┘
                                                                              │ execute
                                                                              ▼
                                                                         ┌──────────┐
                                                                         │ EXECUTED │
                                                                         └──────────┘
```

**Key Design Decisions:**
- **Snapshot-based voting:** Voting power is determined by token balance at the proposal's snapshot slot — not the current balance. This prevents flash-loan attacks where an attacker borrows tokens to vote, then returns them.
- **Single-level delegation:** Delegation is non-transitive: A delegates to B, but B cannot re-delegate A's power to C. This simplifies voting power calculations and prevents circular delegation.
- **Timelock enforcement:** Passed proposals enter a mandatory timelock (default 24 hours) before execution. This provides a safety window for the community and veto authority to react to potentially harmful proposals.
- **Veto authority (progressive decentralization):** The veto authority (initially MCV core team) can cancel any proposal during voting or timelock. This is a safety mechanism designed to be progressively removed as the ecosystem matures.
- **Execution payload types:** Proposals carry typed execution payloads: `treasury_transfer`, `parameter_change`, `program_upgrade`, `grant`. Each type has a specialized executor that validates and executes the payload.

---

### staking — Token Staking & Rewards

**Purpose:** Implements EDGE token staking infrastructure with managed pools, validator delegation, yield calculation with compounding, cooldown periods, ACS-driven APY adjustments, and liquid staking derivatives (stEDGE).

**Tables (9):**

| Table | Records | Description |
|-------|---------|-------------|
| `web3_staking_pools` | Pool definitions | APY, capacity, cooldown period, liquid staking config |
| `web3_stakes` | Active positions | Staked amounts, accumulated rewards, lock expiry |
| `web3_staking_rewards` | Reward records | Per-epoch reward distributions per stake |
| `web3_unstaking_requests` | Cooldown queue | Unstaking requests with cooldown timers |
| `web3_validator_delegations` | Validator tracking | SOL delegation to validators with commission tracking |
| `web3_liquid_staking_tokens` | LST definitions | stEDGE mint, exchange rate, total minted |
| `web3_staking_epochs` | Epoch snapshots | Per-epoch aggregates (total staked, rewards, staker count) |
| `web3_reward_distributions` | Batch distributions | Batch reward processing records |
| (uses `web3_token_mints`) | Reference | Pool stake/reward token definitions |

**Staking Architecture:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        STAKING SUBMODULE                                 │
│                                                                          │
│  ┌─────────────────┐                                                    │
│  │ StakingService  │                                                    │
│  │                 │                                                    │
│  │ createPool      │     ┌─────────────────┐     ┌─────────────────┐   │
│  │ stake / unstake │────▶│ YieldCalculator │────▶│ ACS Interface   │   │
│  │ claimRewards    │     │                 │     │                 │   │
│  │ compoundRewards │     │ Simple interest │     │ getRegimeAPY()  │   │
│  │ delegateToValid │     │ Compound daily  │     │ adjustStaking() │   │
│  └────────┬────────┘     │ Compound weekly │     └─────────────────┘   │
│           │              └─────────────────┘                            │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│  │ CooldownManager │────▶│ EpochProcessor  │────▶│ LiquidStaking   │  │
│  │ (7-day default, │     │ (batch reward   │     │ (stEDGE mint/   │  │
│  │  cancel option) │     │  distribution)  │     │  redeem/rate)   │  │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Yield Calculation Model:**

```
Simple Interest:     reward = principal × APY × (seconds / seconds_per_year)
                     
Daily Compounding:   A = P × (1 + APY/365)^(365 × t)
                     reward = A - P
                     
Weekly Compounding:  A = P × (1 + APY/52)^(52 × t)
                     reward = A - P

Where:
  P = staked amount (in base units, 9 decimals)
  APY = annual percentage yield (ACS-controlled, e.g. 0.25 = 25%)
  t = duration in years (seconds / 31_536_000)
```

**ACS Regime → Staking APY Mapping:**

| Regime | Market Cap | Target APY | Cooldown | Min Stake |
|--------|-----------|------------|----------|-----------|
| Pre-Launch | < $1M | 30% | 3 days | 100 EDGE |
| Launch | $1M–$10M | 25% | 5 days | 500 EDGE |
| Growth | $10M–$100M | 15% | 7 days | 1,000 EDGE |
| Mature | $100M–$1B | 8% | 14 days | 5,000 EDGE |
| Scale | $1B+ | 5% | 21 days | 10,000 EDGE |

**Key Design Decisions:**
- **ACS-driven APY:** Staking APY is dynamically adjusted by the Algorithmic Control System based on the market cap regime. Higher APY during launch incentivizes early staking; lower APY during maturity ensures sustainability.
- **Cooldown enforcement:** Unstaking requires a cooldown period. During cooldown, tokens are locked and earn no rewards. Users can cancel unstaking to resume earning.
- **Liquid staking derivatives:** stEDGE tokens represent staked EDGE and can be used in DeFi (LP, lending) while underlying EDGE continues earning. The exchange rate grows over time as rewards compound.
- **Epoch-aligned distribution:** Rewards are calculated per Solana epoch (~2 days). Batch processing handles all active stakes in a pool efficiently using a single reward distribution transaction.
- **Lockup enforcement:** Pools can require minimum lockup periods. Attempting to unstake before lockup expiry returns `W3_STAKING_LOCKUP_ACTIVE`.

---

### tokens — Token Management & EDGE Token

**Purpose:** Manages all SPL token operations centered on EDGE — the ecosystem-wide utility and governance token. Handles minting (controlled authority), burning (deflationary mechanics), transfers, vesting schedules, airdrop campaigns with Merkle tree verification, and supply tracking.

**Tables (10):**

| Table | Records | Description |
|-------|---------|-------------|
| `web3_token_mints` | Token registry | EDGE, stEDGE, USDC — mint addresses, supply, authorities |
| `web3_token_accounts` | ATAs | Associated Token Accounts per wallet per token |
| `web3_token_transfers` | Transfer history | Every token transfer with type classification |
| `web3_vesting_schedules` | Vesting defs | Linear, cliff, milestone vesting configurations |
| `web3_vesting_claims` | Individual claims | Per-period vesting claim records |
| `web3_airdrop_campaigns` | Campaign defs | Merkle root, recipient count, claim deadline |
| `web3_airdrop_claims` | Individual claims | Per-address claim records with Merkle proofs |
| `web3_token_allocations` | Allocation buckets | Community, team, treasury, ecosystem allocations |
| `web3_token_burns` | Burn log | Every burn event with pre/post supply audit |
| `web3_token_supply_snapshots` | Supply history | 6-hourly snapshots of all supply metrics |

**Vesting Schedule Types:**

```
LINEAR VESTING                    CLIFF + LINEAR
100% ─                    ╱       100% ─                    ╱
     │                  ╱              │                  ╱
 75% ─                ╱            75% ─                ╱
     │              ╱                  │              ╱
 50% ─            ╱                50% ─            ╱
     │          ╱                      │          ╱
 25% ─        ╱                    25% ─    ┌───╱
     │      ╱                          │    │ cliff
  0% ─────╱────────────────        0% ─────┴──────────────
     └─────────────────────            └─────────────────────
      Start              End            Start  Cliff       End

MILESTONE VESTING                 CUSTOM (configurable)
100% ─                         ┌──  100% ─
     │                         │         │        ╱──────
 75% ─                   ┌─────┘     75% ─      ╱
     │                   │               │    ╱
 50% ─            ┌──────┘           50% ───╱
     │            │                      │ ╱
 25% ─     ┌──────┘                  25% ╱
     │     │                            ╱│
  0% ──────┘                         0%──┘
     └───────────────────────            └─────────────────────
      M1    M2     M3    M4              Per custom config JSON
```

**Key Design Decisions:**
- **Mint authority validation:** Only the designated mint authority address can mint new EDGE tokens. The service verifies the signing wallet matches the `mintAuthority` on the token mint before executing.
- **Atomic burn accounting:** Every burn event atomically records pre-burn and post-burn supply in the same database transaction. The `circulatingSupply` on `tokenMints` is decremented together with the `tokenBurns` insert.
- **Merkle-based airdrops:** Airdrop eligibility is verified using Merkle proofs against a stored root. The on-chain distributor program performs identical verification, preventing double-claims.
- **ATA auto-creation:** When transferring tokens to a wallet that doesn't have an Associated Token Account, the service automatically creates the ATA (funded by the sender).
- **Supply snapshots:** A cron job runs every 6 hours, recording total supply, circulating supply, staked, locked, and burned amounts for historical tracking and ACS regime detection.

---

### treasury — On-Chain Treasury Management

**Purpose:** Manages on-chain treasury infrastructure for all MCV ventures with multi-sig vaults (Squads Protocol), tiered spending approvals, asset diversification, periodic NAV snapshots, and fiat-crypto reconciliation.

**Tables (9):**

| Table | Records | Description |
|-------|---------|-------------|
| `web3_treasury_vaults` | Multi-sig vaults | Vault addresses, thresholds, spending limits |
| `web3_treasury_signers` | Signer registry | Per-vault signer addresses with labels |
| `web3_spending_proposals` | Spending proposals | Amount, recipient, category, approval tracking |
| `web3_spending_approvals` | Individual approvals | Per-signer approval/rejection records |
| `web3_treasury_positions` | Asset positions | Current token balances per vault with USD values |
| `web3_treasury_transactions` | Transaction history | All vault transactions (spend, receive, diversify) |
| `web3_treasury_snapshots` | NAV snapshots | 6-hourly total value snapshots |
| `web3_treasury_policies` | Spending policies | Daily/monthly limits, whitelists, HITL thresholds |
| `web3_treasury_reconciliations` | Reconciliation records | On-chain vs off-chain balance comparison |

**Treasury Spending Flow:**

```
Treasury Manager Creates Spending Proposal
        │
        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ treasury        │────▶│ Policy Engine   │────▶│ Multi-sig       │
│                 │     │                 │     │ Collection      │
│ Create proposal │     │ Check daily/    │     │ Collect N-of-M  │
│ with amount,    │     │ monthly limits  │     │ signer          │
│ recipient, cat  │     │ Check whitelist │     │ approvals       │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │ threshold met
                                                          ▼
                              ┌─────────────────┐   ┌─────────────────┐
                              │ HITL Gate       │◄──│ Amount > $10K?  │
                              │                 │   │                 │
                              │ Human-in-loop   │   │ YES → require   │
                              │ final approval  │   │ HITL approval   │
                              │ via agentic-os  │   │ NO → skip       │
                              └────────┬────────┘   └─────────────────┘
                                       │ approved
                                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ BAL (Solana)    │────▶│ On-chain        │────▶│ @mcv/treasury   │
│                 │     │                 │     │                 │
│ Execute multi-  │     │ Transfer from   │     │ Fiat-crypto     │
│ sig tx via      │     │ treasury PDA    │     │ reconciliation  │
│ Squads          │     │ to recipient    │     │ entry created   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Key Design Decisions:**
- **HITL enforcement:** Any spending exceeding the vault's `hitlThreshold` (default $10K) requires Human-in-the-Loop approval via `@mcv/agentic-os/hitl` before execution — even after multi-sig threshold is met. This ensures a human reviews large transactions.
- **On-chain multi-sig via Squads:** Treasury vaults use Squads Protocol for native Solana multi-sig. The `threshold` defines required signatures out of `signerCount` total signers.
- **Policy engine:** Spending policies enforce daily/monthly limits, whitelisted recipients, and category restrictions. Proposals violating policies are automatically flagged and cannot proceed.
- **NAV tracking:** A cron job snapshots total vault value every 6 hours, including DeFi positions. This creates an auditable history of treasury growth/decline.
- **Reconciliation:** The `reconcile` method compares on-chain balances with database records. Discrepancies >0.1% trigger alerts requiring manual resolution.
- **Proposal expiration:** Spending proposals expire after 7 days if approval threshold is not met. Expired proposals must be re-created.

---

### wallets — Wallet Management & Key Custody

**Purpose:** The foundational submodule that all others depend on. Manages wallet lifecycle, HD derivation (BIP-44/Solana paths), KMS-backed key custody, transaction signing, external wallet linking with cryptographic verification, and compliance screening.

**Tables (6):**

| Table | Records | Description |
|-------|---------|-------------|
| `web3_wallets` | Managed wallets | Address, chain, type, purpose, KMS key ID, balance cache |
| `web3_wallet_keys` | Key material | KMS-encrypted private keys — NEVER plaintext |
| `web3_wallet_derivations` | HD tree | Master/child wallet relationships with derivation paths |
| `web3_wallet_links` | User links | External wallet ↔ user associations with verification status |
| `web3_wallet_transactions` | Tx history | Every transaction with confirmation tracking |
| `web3_wallet_providers` | Provider registry | Supported external wallets (Phantom, MetaMask, etc.) |

**Wallet Architecture:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        WALLETS SUBMODULE                                 │
│                                                                          │
│  ┌─────────────────┐                                                    │
│  │  WalletService  │                                                    │
│  │                 │                                                    │
│  │ createManaged   │     ┌─────────────────┐     ┌─────────────────┐   │
│  │ deriveChild     │────▶│  KMS Manager    │────▶│ AWS KMS         │   │
│  │ createMultisig  │     │                 │     │                 │   │
│  │ signTransaction │     │ Encrypt keys    │     │ Envelope        │   │
│  │ signAndSend     │     │ Decrypt for     │     │ encryption      │   │
│  │ batchSignSend   │     │  signing only   │     │ Ed25519 keys    │   │
│  └────────┬────────┘     │ Rotate keys     │     └─────────────────┘   │
│           │              │ Zero memory     │                            │
│           │              └─────────────────┘                            │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│  │ LinkVerifier    │────▶│ ComplianceGate  │────▶│ Chainalysis API │  │
│  │ (Ed25519 nonce  │     │ (OFAC screening,│     │ (sanctions,     │  │
│  │  verification,  │     │  mixer detect,  │     │  mixer detect,  │  │
│  │  5-min expiry)  │     │  risk scoring)  │     │  risk scoring)  │  │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘  │
│                                                                          │
│  ┌─────────────────┐     ┌─────────────────┐                           │
│  │ HD Derivation   │────▶│ Balance Cache   │                           │
│  │ (BIP-44, Solana │     │ (Redis, 10s TTL │                           │
│  │  paths, hardened│     │  per wallet)    │                           │
│  │  child wallets) │     └─────────────────┘                           │
│  └─────────────────┘                                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Wallet Link Verification Flow:**

```
┌──────────────────┐    initiate     ┌───────────────────┐    sign nonce     ┌──────────────────┐
│                  │────────────────▶│                   │──────────────────▶│                  │
│  User clicks     │                 │  Server generates │                   │  User signs in   │
│  "Connect Wallet"│                 │  nonce + message  │                   │  Phantom/MM      │
│                  │                 │  (expires 5 min)  │                   │                  │
└──────────────────┘                 └───────────────────┘                   └────────┬─────────┘
                                                                                      │
                                                                                      ▼
                                                                          ┌────────────────────┐
                                                                          │ Ed25519 verify     │
                                                                          │ signature against   │
                                                                          │ public key          │
                                                                          └────────┬───────────┘
                                                                                   │ valid
                                                                                   ▼
                                                                          ┌────────────────────┐
                                                                          │ Compliance check   │
                                                                          │ (OFAC, mixers,     │
                                                                          │  exploit addresses)│
                                                                          └────────┬───────────┘
                                                                                   │ cleared
                                                                                   ▼
                                                                          ┌────────────────────┐
                                                                          │ WALLET LINKED      │
                                                                          │ isVerified = true   │
                                                                          │ complianceStatus    │
                                                                          │ = 'cleared'         │
                                                                          └────────────────────┘
```

**Key Design Decisions:**
- **KMS-only key storage:** Private keys for managed wallets are **never** stored in plaintext. All key material uses AWS KMS envelope encryption. The `encryptedPrivateKey` column contains KMS ciphertext.
- **Zero plaintext in memory:** Private keys are decrypted only for signing duration, then immediately zeroed. No logging of key material.
- **HD derivation:** Venture wallets use HD derivation from a master seed in KMS. Child wallets for treasury, rewards, and staking are derived at sequential indices under hardened paths.
- **Transaction batching:** `batchSignAndSend` groups up to 15 instructions per Solana transaction for fee efficiency. Larger batches split into multiple transactions.
- **Balance caching:** Wallet balances cache in Redis with 10-second TTL to reduce RPC overhead while maintaining near-real-time accuracy.
- **Compliance pre-screening:** Every wallet address is checked against OFAC sanctions, known mixers, and exploit-associated addresses before linking.

---

## Data Models

### Overview

The `@mcv/web3-core` module defines **58 primary tables** across 8 submodules, plus **3 cross-cutting infrastructure tables**. All tables use Drizzle ORM for type-safe schema definitions and are deployed to PostgreSQL via Supabase with Row Level Security (RLS).

### Table Inventory

| Submodule | Tables | Total Columns | Key Relationships |
|-----------|--------|---------------|-------------------|
| **wallets** | 6 | ~65 | → ventures, → identity (userId) |
| **tokens** | 10 | ~95 | → wallets, → ventures |
| **contracts** | 6 | ~70 | → ventures |
| **staking** | 9 | ~90 | → wallets, → tokens (tokenMints) |
| **governance** | 6 | ~65 | → ventures, → tokens (tokenMints) |
| **defi** | 8 | ~85 | → ventures, → wallets |
| **bridge** | 4 | ~45 | → ventures |
| **treasury** | 9 | ~90 | → ventures, → wallets |
| **cross-cutting** | 3 | ~25 | → all submodules |
| **Total** | **61** | **~630** | |

### Shared Enums

```typescript
// Used across multiple submodules
export const chainEnum = pgEnum('web3_chain', [
  'solana', 'ethereum', 'base', 'polygon', 'arbitrum'
]);

export const walletTypeEnum = pgEnum('web3_wallet_type', [
  'custodial', 'non_custodial', 'multisig'
]);

export const walletStatusEnum = pgEnum('web3_wallet_status', [
  'active', 'frozen', 'archived'
]);

export const programStatusEnum = pgEnum('web3_program_status', [
  'active', 'paused', 'deprecated'
]);

export const stakingPoolStatusEnum = pgEnum('web3_staking_pool_status', [
  'active', 'paused', 'closed'
]);

export const proposalStatusEnum = pgEnum('web3_proposal_status', [
  'draft', 'active', 'passed', 'rejected', 'executed', 'expired', 'vetoed'
]);

export const voteTypeEnum = pgEnum('web3_vote_type', [
  'for', 'against', 'abstain'
]);

export const dexEnum = pgEnum('web3_dex', [
  'raydium', 'orca', 'jupiter', 'meteora'
]);

export const bridgeProtocolEnum = pgEnum('web3_bridge_protocol', [
  'wormhole', 'layerzero', 'debridge'
]);

export const bridgeStatusEnum = pgEnum('web3_bridge_status', [
  'pending', 'in_transit', 'completed', 'failed', 'refunded'
]);

export const treasuryVaultStatusEnum = pgEnum('web3_treasury_vault_status', [
  'active', 'frozen', 'deprecated'
]);
```

### Entity Relationship Summary

```
ventures (from @mcv/kernel)
    │
    ├── 1:N → wallets ─── 1:N → wallet_keys
    │                  ─── 1:N → wallet_derivations
    │                  ─── 1:N → wallet_links ←── users (from @mcv/identity)
    │                  ─── 1:N → wallet_transactions
    │
    ├── 1:N → token_mints ─── 1:N → token_accounts ←── wallets
    │                      ─── 1:N → token_transfers
    │                      ─── 1:N → vesting_schedules ─── 1:N → vesting_claims
    │                      ─── 1:N → airdrop_campaigns ─── 1:N → airdrop_claims
    │                      ─── 1:N → token_allocations
    │                      ─── 1:N → token_burns
    │                      ─── 1:N → token_supply_snapshots
    │
    ├── 1:N → deployed_programs ─── 1:N → program_versions
    │                            ─── 1:N → program_idls
    │                            ─── 1:N → program_authorities
    │                            ─── 1:N → program_invocations
    │                            ─── 1:N → program_deployments
    │
    ├── 1:N → staking_pools ─── 1:N → stakes ─── 1:N → staking_rewards
    │                        ─── 1:N → unstaking_requests
    │                        ─── 1:N → validator_delegations
    │                        ─── 1:1 → liquid_staking_tokens
    │                        ─── 1:N → staking_epochs
    │                        ─── 1:N → reward_distributions
    │
    ├── 1:1 → governance_configs ─── 1:N → proposals ─── 1:N → votes
    │                             ─── 1:N → voting_delegations
    │                             ─── 1:N → timelock_queues
    │                             ─── 1:N → governance_snapshots
    │
    ├── 1:N → liquidity_pools ─── 1:N → liquidity_positions
    │                          ─── 1:N → impermanent_loss_tracking
    │     yield_strategies ─── 1:N → yield_farm_positions
    │     swap_transactions, protocol_integrations, defi_snapshots
    │
    ├── 1:N → bridge_transactions
    │     bridged_assets, bridge_configurations, bridge_relayers
    │
    └── 1:N → treasury_vaults ─── 1:N → treasury_signers
                                ─── 1:N → spending_proposals ─── 1:N → spending_approvals
                                ─── 1:N → treasury_positions
                                ─── 1:N → treasury_transactions
                                ─── 1:N → treasury_snapshots
                                ─── 1:N → treasury_policies
                                ─── 1:N → treasury_reconciliations
```

### RLS Policies

All tables are governed by Supabase Row Level Security. Key policies:

| Policy | Tables | Rule |
|--------|--------|------|
| **Venture isolation** | All tables with `venture_id` | Users can only access rows belonging to their venture |
| **Owner access** | `wallet_links`, `stakes`, `votes` | Users can only access their own positions/votes |
| **Admin operations** | `treasury_vaults`, `deployed_programs` | Only venture admins can create/modify |
| **Read-only public** | `token_mints`, `staking_pools`, `proposals` | Public read access for transparency |
| **Service-only** | `wallet_keys`, `wallet_derivations` | Only the service role can access key material |

---

## Blockchain Integration

### Blockchain Abstraction Layer (BAL)

The BAL is the gateway through which **all** blockchain interactions flow. No service or venture application directly makes RPC calls. The BAL provides:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN ABSTRACTION LAYER (BAL)                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      RPCLoadBalancer                                │   │
│  │                                                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                         │   │
│  │  │ Helius   │  │ Triton   │  │ QuickNode│  ← Primary + 2 fallbacks│   │
│  │  │ (primary)│  │ (fb #1)  │  │ (fb #2)  │                         │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘                         │   │
│  │       │             │             │                                │   │
│  │       └─────────────┴─────────────┘                                │   │
│  │                     │                                               │   │
│  │         ┌───────────▼───────────┐                                  │   │
│  │         │ Health Monitor        │  ← Checks every 10s             │   │
│  │         │ - Latency tracking    │  ← Routes to fastest healthy    │   │
│  │         │ - Error rate          │  ← Auto-failover on errors      │   │
│  │         │ - Rate limit status   │  ← Respects 429 backoff         │   │
│  │         └───────────────────────┘                                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │        SolanaAdapter            │  │        KMS Signer              │ │
│  │                                  │  │                                │ │
│  │  Connection management           │  │  AWS KMS decrypt → sign →     │ │
│  │  Transaction building            │  │  zero memory                  │ │
│  │  Account deserialization         │  │                                │ │
│  │  Commitment level handling       │  │  Supports Ed25519 (Solana)    │ │
│  │  (processed/confirmed/finalized) │  │  and secp256k1 (EVM planned)  │ │
│  │                                  │  │                                │ │
│  └──────────────────────────────────┘  └────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │      TxBatchEngine              │  │     SimulationEngine           │ │
│  │                                  │  │                                │ │
│  │  Groups up to 15 instructions    │  │  Every tx simulated before     │ │
│  │  per Solana transaction          │  │  signing and sending           │ │
│  │  Splits larger batches           │  │                                │ │
│  │  Fee-efficient bundling          │  │  Catches account errors,       │ │
│  │                                  │  │  insufficient funds, etc.      │ │
│  └──────────────────────────────────┘  └────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │      ConfirmationTracker        │  │     FeeEstimator               │ │
│  │                                  │  │                                │ │
│  │  Polls until 32+ confirmations   │  │  Calculates priority fees      │ │
│  │  (finalized commitment)          │  │  based on recent blocks        │ │
│  │  Async status updates            │  │                                │ │
│  │  Timeout after 60 seconds        │  │  Adjusts for network           │ │
│  │  Retry with fresh blockhash      │  │  congestion dynamically        │ │
│  │                                  │  │                                │ │
│  └──────────────────────────────────┘  └────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Solana RPC Interaction

**Connection Configuration:**

```typescript
// RPCLoadBalancer configuration
const rpcConfig = {
  primary: {
    url: process.env.SOLANA_RPC_URL,       // Helius
    weight: 3,                              // 3x routing preference
    maxConcurrent: 100,
    rateLimit: { requests: 100, perMs: 1000 }
  },
  fallbacks: [
    {
      url: process.env.SOLANA_RPC_FALLBACK_1, // Triton
      weight: 2,
      maxConcurrent: 50,
      rateLimit: { requests: 50, perMs: 1000 }
    },
    {
      url: process.env.SOLANA_RPC_FALLBACK_2, // QuickNode
      weight: 1,
      maxConcurrent: 50,
      rateLimit: { requests: 40, perMs: 1000 }
    }
  ],
  healthCheck: {
    intervalMs: 10_000,
    timeoutMs: 5_000,
    unhealthyThreshold: 3,  // 3 consecutive failures → unhealthy
    healthyThreshold: 2     // 2 consecutive successes → healthy
  },
  defaultCommitment: 'finalized',
  confirmationTarget: 32
};
```

**Commitment Levels Used:**

| Commitment | Use Case | Latency |
|-----------|----------|---------|
| `processed` | Balance queries (cached) | ~400ms |
| `confirmed` | Transaction status checks | ~1s |
| `finalized` | Transaction finality (default for writes) | ~6s |

### Solana Program Interaction

The module interacts with several on-chain programs:

| Program | Framework | Purpose |
|---------|-----------|---------|
| EDGE Staking Vault | Anchor | Staking pool management, reward distribution |
| Airdrop Distributor | Anchor | Merkle-verified token distribution |
| Governance Program | Anchor | Proposal management, voting, timelock |
| Token Vesting | Anchor | On-chain vesting schedule enforcement |
| Squads v4 | Native | Multi-sig treasury vaults |
| SPL Token Program | Native | Token transfers, minting, burning |
| Associated Token Program | Native | ATA creation and management |

---

## Data Flow & Events

### Event Taxonomy

All events flow through `@mcv/fabric` event bus. Event naming convention: `web3.{submodule}.{action}`.

| Event | Payload | Triggers |
|-------|---------|----------|
| `web3.wallets.created` | `{ walletId, chain, type, purpose }` | Wallet creation |
| `web3.wallets.linked` | `{ userId, walletId, address, provider }` | External wallet linked |
| `web3.wallets.frozen` | `{ walletId, reason, frozenBy }` | Admin freeze |
| `web3.tokens.minted` | `{ mintAddress, amount, authority }` | Token mint |
| `web3.tokens.burned` | `{ mintAddress, amount, burnType, newSupply }` | Token burn |
| `web3.tokens.transferred` | `{ from, to, amount, tokenMint, type }` | Token transfer |
| `web3.tokens.vesting_claimed` | `{ scheduleId, amount, claimNumber }` | Vesting claim |
| `web3.tokens.airdrop_claimed` | `{ campaignId, claimant, amount }` | Airdrop claim |
| `web3.contracts.deployed` | `{ programId, version, cluster }` | Program deployment |
| `web3.contracts.upgraded` | `{ programId, fromVersion, toVersion }` | Program upgrade |
| `web3.staking.stake_created` | `{ poolId, staker, amount }` | New stake |
| `web3.staking.unstake_initiated` | `{ stakeId, amount, cooldownEnds }` | Unstaking started |
| `web3.staking.rewards_claimed` | `{ stakeId, amount, epoch }` | Rewards claimed |
| `web3.staking.apy_adjusted` | `{ poolId, oldApy, newApy, regime }` | ACS APY change |
| `web3.governance.proposal_created` | `{ proposalId, title, category }` | New proposal |
| `web3.governance.vote_cast` | `{ proposalId, voter, voteType, power }` | Vote cast |
| `web3.governance.proposal_executed` | `{ proposalId, txSignature }` | Proposal executed |
| `web3.governance.proposal_vetoed` | `{ proposalId, vetoedBy, reason }` | Proposal vetoed |
| `web3.defi.liquidity_added` | `{ pool, tokenA, tokenB, amounts }` | LP position opened |
| `web3.defi.swap_executed` | `{ dex, input, output, route }` | Swap completed |
| `web3.defi.farm_harvested` | `{ farmAddress, rewards }` | Farm rewards harvested |
| `web3.bridge.initiated` | `{ protocol, source, dest, amount }` | Bridge started |
| `web3.bridge.completed` | `{ transactionId, destTx }` | Bridge completed |
| `web3.bridge.failed` | `{ transactionId, error, retryCount }` | Bridge failed |
| `web3.treasury.proposal_created` | `{ vaultId, amount, category }` | Spending proposed |
| `web3.treasury.spending_executed` | `{ vaultId, amount, recipient, tx }` | Spending executed |
| `web3.treasury.hitl_required` | `{ proposalId, amount, threshold }` | HITL gate triggered |
| `web3.treasury.reconciliation_discrepancy` | `{ vaultId, diff }` | Balance mismatch |

### Data Flow: User Stakes EDGE Tokens

```
User Initiates Stake via UI
        │
        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ wallets         │────▶│ tokens          │────▶│ staking         │
│                 │     │                 │     │                 │
│ Verify wallet   │     │ Check EDGE      │     │ Create stake    │
│ ownership &     │     │ balance ≥       │     │ position in     │
│ sign tx         │     │ stake amount    │     │ pool            │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        ▼                                               ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ BAL (Solana)    │────▶│ On-chain        │────▶│ treasury        │
│                 │     │                 │     │                 │
│ Build & send    │     │ Transfer EDGE   │     │ Update vault    │
│ staking tx      │     │ to staking      │     │ position &      │
│ via KMS signer  │     │ vault PDA       │     │ NAV snapshot    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│ @mcv/fabric     │
│                 │
│ Emit event:     │
│ web3.staking    │
│ .stake_created  │
│ + audit trail   │
└─────────────────┘
```

---

## Integration Points

### Internal MCV Package Integrations

| Package | Integration | Direction | Data Exchanged |
|---------|-------------|-----------|----------------|
| **@mcv/token-economy** | EDGE token parameters | ← Reads | Token supply targets, allocation schedules, ACS regime data |
| **@mcv/token-economy** | Token metrics reporting | → Writes | Circulating supply, staked amount, burned amount, market cap |
| **@mcv/web3-public** | Consumer-facing features | ← Reads | Wallet balances, staking positions, governance proposals |
| **@mcv/web3-public** | Transaction execution | → Delegates | Staking, voting, and bridging actions from consumer UI |
| **@mcv/treasury** | Fiat-crypto reconciliation | ↔ Bidirectional | On-chain balances ↔ off-chain accounting records |
| **@mcv/treasury** | Asset valuation | → Writes | Real-time USD values of on-chain positions |
| **@mcv/identity** | Wallet-to-user linking | ← Reads | User IDs for wallet association, KYC status |
| **@mcv/fabric** | Event bus + audit trail | → Writes | All blockchain events, compliance checks, transaction logs |
| **@mcv/kernel** | Database, context, auth | ← Reads | DB connections, request context, error classes, auth tokens |
| **@mcv/agentic-os** | HITL gating | → Writes | HITL approval requests for high-value operations |
| **@mcv/agentic-os** | NAOS agent actions | ← Reads | Treasury agent, DeFi agent, ACS engine commands |

### External Service Integrations

| Service | Protocol | Purpose | Rate Limits |
|---------|----------|---------|-------------|
| Helius API | HTTPS + WebSocket | Enhanced RPC, DAS, webhooks | 100 req/s |
| Jupiter API | HTTPS | DEX aggregation, swap routing | 60 req/min |
| Wormhole Guardians | HTTPS | VAA retrieval, attestation | 30 req/s |
| LayerZero Endpoint | On-chain | Cross-chain messaging | Per-tx |
| Squads Protocol | On-chain | Multi-sig vault operations | Per-tx |
| AWS KMS | HTTPS | Key encrypt/decrypt/sign | 10,000 req/s |
| Chainalysis | HTTPS | Compliance screening | 100 req/min |
| Raydium SDK | HTTPS + On-chain | AMM/CLMM pool operations | 30 req/s |
| Orca SDK | HTTPS + On-chain | Whirlpool LP management | 30 req/s |

---

## Performance

### RPC Node Management

The `RPCLoadBalancer` manages multiple RPC providers with weighted routing, health monitoring, and automatic failover:

- **Primary (Helius):** Enhanced RPC with DAS (Digital Asset Standard) support, webhooks for real-time notifications, 100 req/s rate limit. Weight: 3 (receives ~50% of traffic).
- **Fallback #1 (Triton):** Dedicated Solana RPC, 50 req/s. Weight: 2 (receives ~33% of traffic).
- **Fallback #2 (QuickNode):** Multi-chain RPC, 40 req/s. Weight: 1 (receives ~17% of traffic).

**Failover behavior:**
1. Health checks run every 10 seconds (simple `getSlot()` call).
2. After 3 consecutive failures, a provider is marked `unhealthy` and receives zero traffic.
3. After 2 consecutive successes, it's marked `healthy` and re-enters the rotation.
4. If all providers are unhealthy, the system falls back to the primary regardless and enters `degraded` mode.

### Transaction Confirmation

| Stage | Commitment | Latency | Use Case |
|-------|-----------|---------|----------|
| Submitted | N/A | ~200ms | Tx sent to RPC |
| Processed | `processed` | ~400ms | Tx included in a block (may roll back) |
| Confirmed | `confirmed` | ~1s | Tx confirmed by supermajority of validators |
| Finalized | `finalized` | ~6s | Tx finalized, cannot roll back (32+ confirmations) |

**Default behavior:** All write operations wait for `finalized` commitment. Balance reads use `processed` commitment (cached).

### Caching Strategy

| Data | Cache Layer | TTL | Invalidation |
|------|------------|-----|-------------|
| Wallet balances | Redis | 10 seconds | `refreshBalanceCache()` call |
| Token supply | Redis | 60 seconds | Supply snapshot cron |
| Swap routes | Redis | 30 seconds | Time-based expiry |
| Pool TVL/APR | Redis | 5 minutes | DeFi snapshot cron |
| Bridge status | Redis | 15 seconds | Status monitor polling |
| RPC health | In-memory | 10 seconds | Health check cycle |

### Transaction Batching

Solana transactions support up to ~1232 bytes, accommodating 10-15 typical instructions. The `TxBatchEngine`:

1. Groups compatible instructions (same signers, no conflicting accounts).
2. Estimates serialized size for each group.
3. Splits into multiple transactions if size exceeds limit.
4. Signs and sends all transactions, tracking each independently.
5. Returns aggregate results with per-transaction status.

**Typical batch sizes:**
- Token transfers: 12-15 per transaction
- Staking reward distributions: 8-10 per transaction
- Airdrop claims: 10-12 per transaction

---

## Scalability

### Horizontal Scaling

| Component | Scaling Strategy | Limits |
|-----------|-----------------|--------|
| **API Routes** | Horizontal pod scaling (Kubernetes) | Limited by RPC rate limits |
| **Cron Jobs** | Single-leader with distributed lock (Redis) | One job per cluster |
| **Event Processing** | Fan-out via @mcv/fabric event bus | Async, non-blocking |
| **Database** | Supabase managed scaling + read replicas | 100K+ concurrent connections |
| **Redis Cache** | Redis Cluster for hot data | Sub-ms latency |
| **RPC Connections** | Load-balanced across 3+ providers | 190 req/s aggregate |

### Data Growth Projections

| Table Category | Rows/Month (Est.) | Storage/Month | Retention |
|---------------|-------------------|---------------|-----------|
| Wallet transactions | 500K–2M | 500MB–2GB | Indefinite |
| Token transfers | 200K–1M | 200MB–1GB | Indefinite |
| Swap transactions | 100K–500K | 100MB–500MB | Indefinite |
| Staking rewards | 50K–200K | 50MB–200MB | Indefinite |
| Bridge transactions | 5K–20K | 5MB–20MB | Indefinite |
| Supply snapshots | 120 (4/day) | <1MB | Indefinite |
| DeFi snapshots | 120 (4/day) | <5MB | 2 years rolling |
| IL tracking | 10K–50K | 10MB–50MB | 2 years rolling |

### Partitioning Strategy

For high-volume tables (`wallet_transactions`, `token_transfers`, `swap_transactions`):
- **Time-based partitioning:** Monthly partitions on `created_at`
- **Index strategy:** Composite indexes on `(wallet_id, created_at)` and `(token_mint, created_at)`
- **Archive policy:** Partitions older than 2 years moved to cold storage (S3 export)

---

## Error Handling

### Error Categories

| Category | Error Codes | Retry Strategy | Alert Level |
|----------|------------|----------------|-------------|
| **Blockchain (transient)** | `W3_RPC_TIMEOUT`, `W3_RPC_RATE_LIMITED` | Exponential backoff, 3 retries | WARN |
| **Blockchain (permanent)** | `W3_TX_SIMULATION_FAILED`, `W3_INSUFFICIENT_BALANCE` | No retry, return to caller | INFO |
| **Authorization** | `W3_WALLET_FROZEN`, `W3_MINT_UNAUTHORIZED`, `W3_UPGRADE_UNAUTHORIZED` | No retry, return to caller | WARN |
| **Compliance** | `W3_COMPLIANCE_BLOCKED` | No retry, block operation | CRITICAL |
| **Bridge failures** | `W3_BRIDGE_FAILED` | Auto-retry 3x, then manual | ERROR |
| **Treasury** | `W3_TREASURY_HITL_REQUIRED`, `W3_TREASURY_LIMIT_EXCEEDED` | Await human, no auto-retry | INFO |
| **Governance** | `W3_QUORUM_NOT_MET`, `W3_VOTING_ENDED`, `W3_TIMELOCK_NOT_READY` | No retry, state-dependent | INFO |
| **Staking** | `W3_STAKING_LOCKUP_ACTIVE`, `W3_COOLDOWN_ACTIVE` | No retry, time-dependent | INFO |

### Transaction Failure Recovery

```
Transaction Submitted
        │
        ▼
┌─────────────────┐
│ Simulate on-    │ ── FAIL ──▶ Return W3_TX_SIMULATION_FAILED
│ chain first     │            (no funds spent)
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│ Sign & send     │ ── TIMEOUT ──▶ Check tx status by signature
│ via BAL         │                 │
└────────┬────────┘                 ├── Found: wait for confirmation
         │ SENT                     ├── Not found: retry with new blockhash
         ▼                          └── 3 retries exhausted: FAIL
┌─────────────────┐
│ Track confirm-  │ ── DROPPED ──▶ Retry with fresh blockhash (up to 3x)
│ ation (32+)     │
└────────┬────────┘
         │ FINALIZED
         ▼
┌─────────────────┐
│ Update DB       │ ── DB ERROR ──▶ Retry DB write (idempotent by txSignature)
│ status          │
└────────┬────────┘
         │ SUCCESS
         ▼
   Return result
```

### Error Code Reference

The module defines 30+ error codes organized by submodule. Full reference in [03-API-REFERENCE.md](./03-API-REFERENCE.md#error-codes).

---

## Observability

### Logging

All services log structured JSON to `@mcv/fabric` with the following fields:

```typescript
{
  timestamp: '2026-02-09T12:00:00.000Z',
  level: 'info' | 'warn' | 'error',
  service: 'web3-core',
  submodule: 'staking' | 'wallets' | 'tokens' | ...,
  action: 'stake' | 'transfer' | 'deploy' | ...,
  walletId: 'uuid',
  ventureId: 'uuid',
  txSignature: 'base58-string',
  chain: 'solana',
  duration_ms: 1234,
  error_code: 'W3_...',
  metadata: { ... }
}
```

**Log levels:**
- **DEBUG:** RPC call details, cache hits/misses, balance lookups
- **INFO:** Successful operations, state transitions, confirmations
- **WARN:** Retries, rate limits, degraded state, authorization failures
- **ERROR:** Operation failures, bridge failures, unhandled exceptions
- **CRITICAL:** Compliance blocks, key material errors, reconciliation discrepancies

### Metrics

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `web3_rpc_requests_total` | Counter | `provider`, `method`, `status` | RPC call volume and errors |
| `web3_rpc_latency_seconds` | Histogram | `provider`, `method` | RPC latency distribution |
| `web3_tx_confirmation_seconds` | Histogram | `commitment` | Time to confirmation |
| `web3_tx_submitted_total` | Counter | `submodule`, `type`, `status` | Transaction outcomes |
| `web3_wallet_balance_cache_hits` | Counter | - | Cache effectiveness |
| `web3_staking_total_staked` | Gauge | `pool_id` | Current staked amount |
| `web3_treasury_nav_usd` | Gauge | `vault_id` | Treasury value |
| `web3_bridge_inflight_count` | Gauge | `protocol` | Active bridges |
| `web3_bridge_completion_seconds` | Histogram | `protocol`, `route` | Bridge delivery time |
| `web3_defi_position_value_usd` | Gauge | `dex`, `pool` | DeFi portfolio value |
| `web3_governance_active_proposals` | Gauge | `venture_id` | Active proposal count |
| `web3_compliance_blocks_total` | Counter | `reason` | Blocked addresses |

### Alerting Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| RPC All Unhealthy | All 3 providers fail health check | **P1 Critical** | Page on-call, check Solana network |
| Transaction Drop Rate | >5% transactions dropped in 5 min | **P2 High** | Check RPC health, increase priority fees |
| Bridge Stuck | Bridge in `in_transit` >2 hours | **P2 High** | Investigate attestation, manual intervention |
| Treasury Discrepancy | Reconciliation diff >0.1% | **P2 High** | Investigate, possible exploit |
| Key Rotation Overdue | Key age >90 days | **P3 Medium** | Schedule key rotation |
| Compliance Block | Any address blocked | **P3 Medium** | Review in compliance dashboard |
| Staking Pool Near Capacity | Pool >90% of max capacity | **P4 Low** | Consider increasing capacity or new pool |
| High Slippage Swap | Swap slippage >2% | **P4 Low** | Review swap size and liquidity |

### Audit Trail

Every blockchain operation writes to the `@mcv/fabric` audit trail:

```typescript
{
  actor: { type: 'user' | 'service' | 'cron' | 'agent', id: string },
  action: 'web3.staking.stake',
  resource: { type: 'stake', id: 'uuid' },
  context: { ventureId, walletId, chain: 'solana' },
  details: {
    poolId: 'uuid',
    amount: '1000000000000',  // 1000 EDGE
    txSignature: 'base58...',
    slot: 290_000_000
  },
  timestamp: '2026-02-09T12:00:00.000Z',
  ip: '10.0.0.1',
  userAgent: 'MCV-Web/1.0'
}
```

---

## Security

### Threat Model

| Threat | Mitigation | Priority |
|--------|-----------|----------|
| **Private key theft** | KMS-only storage, zero plaintext in memory, key rotation every 90 days | **Critical** |
| **Unauthorized transactions** | Multi-sig for high-value ops, HITL gating, simulation before send | **Critical** |
| **Flash-loan governance attack** | Snapshot-based voting power (balance at proposal creation slot) | **Critical** |
| **Sanctioned address interaction** | OFAC + Chainalysis screening on every wallet link and outbound transfer | **Critical** |
| **Supply-chain attack (programs)** | Binary verification (SHA-256 hash comparison post-deploy) | **High** |
| **RPC manipulation** | Multiple independent providers, cross-provider verification for critical reads | **High** |
| **Replay attacks** | Nonce expiration (5-min), recent blockhash requirement for transactions | **High** |
| **Database injection** | Drizzle ORM parameterized queries, Supabase RLS isolation | **Medium** |
| **Rate-limiting bypass** | Per-wallet rate limits, per-IP rate limits, RPC-level limits | **Medium** |
| **Bridge fund lock** | Auto-retry with exponential backoff, manual override, timeout alerts | **Medium** |

### Key Management Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KEY MANAGEMENT FLOW                               │
│                                                                     │
│  ┌───────────────┐                                                  │
│  │ Key Generation │  (one-time, during wallet creation)             │
│  │               │                                                  │
│  │  1. Generate Ed25519 keypair in memory                          │
│  │  2. Extract public key → store in web3_wallets.address          │
│  │  3. Encrypt private key with KMS → store ciphertext             │
│  │  4. Zero private key from memory immediately                    │
│  │                                                                  │
│  └───────────────┘                                                  │
│                                                                     │
│  ┌───────────────┐                                                  │
│  │ Signing Flow  │  (per-transaction, as needed)                   │
│  │               │                                                  │
│  │  1. Build transaction with accounts + instructions              │
│  │  2. Simulate transaction → abort if fails                      │
│  │  3. Call KMS Decrypt(encryptedPrivateKey)                       │
│  │  4. Sign transaction bytes with decrypted key                   │
│  │  5. Zero key from memory immediately                            │
│  │  6. Send signed transaction to Solana RPC                      │
│  │  7. Track confirmation asynchronously                           │
│  │                                                                  │
│  └───────────────┘                                                  │
│                                                                     │
│  ┌───────────────┐                                                  │
│  │ Key Rotation  │  (every 90 days)                                │
│  │               │                                                  │
│  │  1. Generate new Ed25519 keypair                                │
│  │  2. Encrypt new private key with KMS                            │
│  │  3. Transfer all assets from old → new address                  │
│  │  4. Update wallet record with new address                       │
│  │  5. Archive old key version (retain for audit)                  │
│  │  6. Zero old key from memory                                    │
│  │                                                                  │
│  └───────────────┘                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Multi-Sig Requirements

| Operation | Threshold | Total Signers | HITL Required |
|-----------|-----------|---------------|---------------|
| Treasury spend < $10K | 2-of-5 | 5 | No |
| Treasury spend $10K–$100K | 3-of-5 | 5 | Yes (HITL) |
| Treasury spend > $100K | 4-of-5 | 5 | Yes (HITL + Board) |
| Program upgrade (devnet) | 1-of-3 | 3 | No |
| Program upgrade (mainnet) | 3-of-5 | 5 | Yes (HITL) |
| Mint authority action | 3-of-5 | 5 | Yes (HITL) |
| Governance veto | 1-of-1 | 1 (guardian) | No |
| Emergency freeze | 1-of-1 | 1 (guardian) | No |

### Compliance Pipeline

```
Every wallet address passes through:

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ OFAC Check   │────▶│ Mixer Check  │────▶│ Risk Score   │
│              │     │              │     │              │
│ Chainalysis  │     │ Tornado Cash │     │ 0-100 scale  │
│ sanctions    │     │ known addrs  │     │ >70 = flag   │
│ list match   │     │ heuristic    │     │ >90 = block  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       ▼                    ▼                     ▼
  MATCH → BLOCK        MATCH → BLOCK         HIGH → FLAG
  NO MATCH → PASS      NO MATCH → PASS       LOW → PASS
```

### Security Checklist

- [ ] All private keys stored as KMS-encrypted ciphertext only
- [ ] Key rotation policy enforced (90-day maximum)
- [ ] Multi-sig required for all production treasury operations
- [ ] HITL gating enabled for operations exceeding $10K USD
- [ ] OFAC/sanctions screening on all wallet links and outbound transfers
- [ ] Mixer address detection and blocking active
- [ ] Transaction simulation before every send
- [ ] 32-confirmation finality tracking for all transactions
- [ ] Audit trail logging for every blockchain operation via @mcv/fabric
- [ ] RPC provider failover configured and tested (3 providers)
- [ ] Rate limiting on all endpoints (per-wallet and per-IP)
- [ ] Redis cache TTLs configured (10s for balances, 60s for supply)
- [ ] Nonce expiration enforced (5-minute maximum for wallet linking)
- [ ] Binary verification for all program deployments (SHA-256)
- [ ] Spending policy enforcement on all treasury proposals
- [ ] Snapshot-based voting to prevent flash-loan governance attacks
- [ ] Single-level delegation only (no transitive delegation)
- [ ] Slippage protection on all DEX swaps (default 50 bps)
- [ ] Bridge auto-retry with circuit breaker (3 attempts max)
- [ ] Zero plaintext key material in logs, memory dumps, or error messages

---

*@mcv/web3-core — Web3 Core Infrastructure*
