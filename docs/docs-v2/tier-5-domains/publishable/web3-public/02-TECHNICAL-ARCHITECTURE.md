# @mcv/web3-public — Technical Architecture
## Tier 5: Domain Layer (PUBLISHABLE)

**Package:** `@mcv/web3-public`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
   - [wallet-sdk](#module-wallet-sdk)
   - [nfts](#module-nfts)
   - [oracles](#module-oracles)
   - [attestation](#module-attestation)
4. [Data Models](#data-models)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance](#performance)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security](#security)

---

## Architecture Overview

`@mcv/web3-public` is the **consumer-facing Web3 layer** for the MCV ecosystem. Every blockchain interaction an end-user performs — connecting a wallet, minting an NFT, checking a price feed, or verifying identity — flows through this package. As a **PUBLISHABLE** module, it is designed for external developers and end users with enterprise-grade reliability, security, and developer experience.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Provider-agnostic** | Unified adapter pattern abstracts wallet providers (Phantom, MetaMask, etc.) behind a common interface. Swap providers without changing application code. |
| **Chain-primary on Solana** | Solana is the primary blockchain. EVM chains (Ethereum, Base, Polygon, Arbitrum) are supported for cross-chain attestations and NFT bridging. |
| **Off-chain first, on-chain when needed** | Off-chain PostgreSQL storage provides fast reads. On-chain operations are used for minting, attestation publication, and trustless verification. |
| **Multi-source resilience** | Oracle feeds aggregate from multiple sources (Pyth, Switchboard, custom APIs) with outlier rejection and staleness detection. |
| **Privacy by design** | Attestation private data (SSN, DOB) is encrypted at rest and never exposed in public APIs. Selective disclosure allows sharing only necessary fields. |
| **Publish-grade DX** | React hooks, pre-built UI components, Zod-validated inputs, comprehensive TypeScript types. Designed so ventures can integrate Web3 features in hours, not weeks. |

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Next.js 15 + Node.js | Server-side rendering, API routes |
| **Monorepo** | Turborepo | Build orchestration, task caching |
| **Database** | Supabase/PostgreSQL + RLS | Persistent storage, row-level security |
| **ORM** | Drizzle ORM | Type-safe schema, migrations, queries |
| **Validation** | Zod | Runtime input/output validation |
| **Cache** | Redis | Price feed caching, session tokens, rate limiting |
| **Events** | Redpanda/Kafka | Async event streaming (mints, price updates, attestations) |
| **Blockchain** | Solana (@solana/web3.js, Anchor, Metaplex) | RPC, program interaction, NFT ops |
| **Oracles** | Pyth Network, Switchboard V2 | Price feeds, VRF randomness |
| **Attestation** | EAS SDK (adapted) | On-chain attestation schemas, verification |
| **AI** | OpenRouter | AI-generated NFT art, metadata generation |
| **KYC** | SumSub, Veriff | Identity verification, document checks |

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        @mcv/web3-public — SYSTEM ARCHITECTURE                   │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                            ENTRY POINTS                                   │  │
│  │                                                                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ React Client │  │  API Routes  │  │   Webhooks   │  │ NAOS Agents  │  │  │
│  │  │              │  │              │  │              │  │              │  │  │
│  │  │ WalletConnect│  │ /api/wallet  │  │ Metaplex     │  │ NFT Manager  │  │  │
│  │  │ NFT Gallery  │  │ /api/nft     │  │ KYC Provider │  │ Oracle Mon.  │  │  │
│  │  │ Price Ticker │  │ /api/oracle  │  │ Switchboard  │  │ Attest. Bot  │  │  │
│  │  │ KYC Widget   │  │ /api/attest. │  │ Sports Feeds │  │ Wallet Index │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │  │
│  │         │                 │                  │                 │          │  │
│  │         └─────────────────┴──────────────────┴─────────────────┘          │  │
│  │                                     │                                     │  │
│  └─────────────────────────────────────┼─────────────────────────────────────┘  │
│                                        │                                        │
│  ┌─────────────────────────────────────┼─────────────────────────────────────┐  │
│  │                            SERVICE LAYER                                  │  │
│  │                                     │                                     │  │
│  │  ┌──────────────────────────────┐  │  ┌──────────────────────────────┐   │  │
│  │  │         WALLET-SDK           │  │  │            NFTS              │   │  │
│  │  │                              │  │  │                              │   │  │
│  │  │  • Multi-wallet connect      │  │  │  • Collection CRUD           │   │  │
│  │  │  • Signature verification    │  │  │  • Metaplex standard mint    │   │  │
│  │  │  • Session management        │  │  │  • Compressed NFTs (cNFTs)   │   │  │
│  │  │  • Balance aggregation       │  │  │  • Royalty enforcement        │   │  │
│  │  │  • Transaction signing       │  │  │  • Marketplace listing        │   │  │
│  │  │  • Mobile deep links         │  │  │  • NFT gating / memberships  │   │  │
│  │  │  • WalletConnect v2          │  │  │  • Rarity calculation         │   │  │
│  │  │  • Custodial KMS wallets     │  │  │  • Transfer / burn            │   │  │
│  │  └──────────────────────────────┘  │  └──────────────────────────────┘   │  │
│  │                                     │                                     │  │
│  │  ┌──────────────────────────────┐  │  ┌──────────────────────────────┐   │  │
│  │  │          ORACLES             │  │  │        ATTESTATION           │   │  │
│  │  │                              │  │  │                              │   │  │
│  │  │  • Pyth price feeds          │  │  │  • KYC attestation           │   │  │
│  │  │  • Switchboard feeds         │  │  │  • Age verification          │   │  │
│  │  │  • Custom oracle creation    │  │  │  • Jurisdiction check        │   │  │
│  │  │  • Multi-source aggregation  │  │  │  • Verifiable credentials    │   │  │
│  │  │  • Staleness detection       │  │  │  • EAS on-chain publish      │   │  │
│  │  │  • VRF randomness            │  │  │  • Reputation scoring        │   │  │
│  │  │  • Sports data (BetEdge)     │  │  │  • Selective disclosure      │   │  │
│  │  │  • WebSocket streaming       │  │  │  • Cross-chain attestation   │   │  │
│  │  └──────────────────────────────┘  │  └──────────────────────────────┘   │  │
│  │                                     │                                     │  │
│  └─────────────────────────────────────┼─────────────────────────────────────┘  │
│                                        │                                        │
│  ┌─────────────────────────────────────┼─────────────────────────────────────┐  │
│  │                  BLOCKCHAIN INTERACTION LAYER                              │  │
│  │                                                                           │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐ │  │
│  │  │ @solana/   │ │ @coral-xyz/│ │ @metaplex- │ │ Pyth SDK / │ │EAS SDK │ │  │
│  │  │ web3.js    │ │ anchor     │ │ foundation │ │Switchboard │ │(attest)│ │  │
│  │  │            │ │            │ │ /js        │ │ SDK        │ │        │ │  │
│  │  │ RPC calls  │ │ Program    │ │ NFT ops    │ │ Price feeds│ │ Schema │ │  │
│  │  │ Keypairs   │ │ PDAs       │ │ Metadata   │ │ VRF       │ │ reg    │ │  │
│  │  │ Txn sign   │ │ IDL parse  │ │ Merkle tree│ │ Randomness│ │ Verify │ │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────┘ │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                        │
│  ┌─────────────────────────────────────┼─────────────────────────────────────┐  │
│  │                  DATABASE LAYER (PostgreSQL + Redis)                       │  │
│  │                                                                           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │  │
│  │  │ Wallets  │ │ Sessions │ │   NFTs   │ │ Oracles  │ │ Attesta- │       │  │
│  │  │ 4 tables │ │ + Nonces │ │ 6 tables │ │ 4 tables │ │  tions   │       │  │
│  │  │          │ │          │ │          │ │          │ │ 6 tables │       │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │  │
│  │                                                                           │  │
│  │  ┌───────────────────────┐  ┌──────────────────────┐                     │  │
│  │  │ Redis Cache           │  │ Redpanda / Kafka      │                     │  │
│  │  │ • Price feed TTL: 30s │  │ • Event streaming     │                     │  │
│  │  │ • Session tokens      │  │ • Mint notifications   │                     │  │
│  │  │ • Rate limiting       │  │ • Price updates        │                     │  │
│  │  │ • Nonce storage       │  │ • Attestation events   │                     │  │
│  │  └───────────────────────┘  └──────────────────────┘                     │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                        EXTERNAL DEPENDENCIES                              │  │
│  │                                                                           │  │
│  │  @mcv/web3-core         @mcv/identity          @mcv/ui                   │  │
│  │  (Internal wallet /     (Wallet-to-user         (Wallet connect           │  │
│  │   token infra, SPL       linking, auth)          UI components)           │  │
│  │   token ops)                                                              │  │
│  │                                                                           │  │
│  │  @mcv/fabric            @mcv/commerce           @mcv/engagement           │  │
│  │  (Event bus, media      (NFT marketplace         (NFT achievements,       │  │
│  │   storage)               payments)                loyalty)                │  │
│  │                                                                           │  │
│  │  Solana RPC             Pyth Network            Switchboard               │  │
│  │  (Helius, Triton,       (Price feeds,           (Custom feeds,            │  │
│  │   QuickNode)             confidence)             VRF)                     │  │
│  │                                                                           │  │
│  │  SumSub / Veriff        Arweave / IPFS          Metaplex                 │  │
│  │  (KYC verification)     (NFT metadata           (NFT standard,           │  │
│  │                          storage)                Bubblegum)               │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility | Key Technologies |
|-------|---------------|-----------------|
| **Entry Points** | Accept user interactions from React UI, API routes, external webhooks, NAOS automation agents | Next.js 15, React 19, tRPC |
| **Service Layer** | Domain business logic across the four submodules | TypeScript services, Zod validation |
| **Blockchain Interaction** | Low-level chain operations — RPC calls, program invocation, transaction building | @solana/web3.js, Anchor, Metaplex, Pyth, EAS |
| **Database Layer** | Persistent state, caching, event streaming | PostgreSQL + RLS, Redis, Redpanda/Kafka |
| **External Dependencies** | MCV-internal packages and third-party services | @mcv/web3-core, @mcv/identity, SumSub, Arweave |

---

## Module Architecture

### Module: wallet-sdk

The Wallet SDK provides a **unified, provider-agnostic interface** for connecting to Web3 wallets across multiple chains and wallet providers. It is the foundational layer upon which every other Web3 operation depends — you cannot mint an NFT, query a price feed with wallet context, or create an attestation without first establishing a wallet connection.

#### Internal Structure

```
wallet-sdk/
├── service.ts                  # WalletService — core business logic
├── schema.ts                   # Drizzle ORM tables (4 tables)
├── types.ts                    # TypeScript types & Zod schemas
├── constants.ts                # Chain configs, TTLs, RPC URLs
├── adapters/
│   ├── index.ts                # Re-exports all adapters
│   ├── phantom.adapter.ts      # Phantom wallet (Solana)
│   ├── solflare.adapter.ts     # Solflare wallet (Solana)
│   ├── backpack.adapter.ts     # Backpack wallet (Solana + xNFT)
│   ├── metamask.adapter.ts     # MetaMask (EVM)
│   ├── coinbase.adapter.ts     # Coinbase Wallet (EVM)
│   ├── walletconnect.adapter.ts # WalletConnect v2 (multi-chain)
│   ├── privy.adapter.ts        # Privy embedded wallets
│   └── kms.adapter.ts          # MCV custodial KMS wallets
├── adapter-registry.ts         # WalletAdapterRegistry — auto-detection & selection
├── nonce-manager.ts            # Nonce generation & verification (5-min TTL)
├── session-manager.ts          # Session lifecycle, refresh, revocation
├── balance-resolver.ts         # Balance aggregation across chains
├── transaction-indexer.ts      # Off-chain transaction index (mirrors on-chain)
├── name-resolver.ts            # SNS (.sol) / ENS (.eth) resolution
└── deep-link.ts                # Mobile deep-link generation (Phantom, Solflare)
```

#### Adapter Pattern

All wallet implementations conform to the `WalletAdapter` interface, enabling the SDK to treat every wallet uniformly regardless of the underlying provider:

```typescript
interface WalletAdapter {
  readonly name: string;                    // "Phantom"
  readonly icon: string;                    // Icon URL
  readonly chain: Chain;                    // solana | ethereum | base | ...
  readonly isAvailable: boolean;            // Detected in browser
  readonly isConnected: boolean;            // Currently connected
  readonly publicKey: string | null;        // Connected address
  readonly capabilities: WalletCapabilities;

  connect(options?: ConnectOptions): Promise<WalletConnection>;
  disconnect(): Promise<void>;
  signMessage(message: string | Uint8Array): Promise<string>;
  signTransaction<T>(transaction: T): Promise<T>;
  signAllTransactions?<T>(transactions: T[]): Promise<T[]>;
  sendTransaction(transaction: unknown, options?: SendOptions): Promise<string>;

  on(event: 'connect' | 'disconnect' | 'accountChanged', handler: Function): void;
  off(event: string, handler: Function): void;
}
```

The `WalletAdapterRegistry` manages adapter lifecycle:

1. **Registration** — Built-in adapters (Phantom, Solflare, MetaMask, etc.) are registered at construction. Custom adapters can be added via `register()`.
2. **Auto-detection** — On initialization, the registry waits ~100ms for wallet extensions to inject into `window`, then checks each adapter's `isAvailable` property.
3. **Recommendation** — `getRecommended(chain)` returns the best available adapter based on a priority list (Phantom > Solflare > Backpack for Solana; MetaMask > Coinbase for EVM).

#### Connection Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. User clicks  │     │  2. Adapter      │     │  3. Server       │
│  "Connect Wallet"│────▶│  connect()       │────▶│  generateNonce() │
│                  │     │                  │     │                  │
│  WalletModal     │     │  Phantom popup   │     │  Store nonce     │
│  shows detected  │     │  opens, user     │     │  with 5-min TTL  │
│  wallets         │     │  approves        │     │  in DB           │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
┌─────────────────┐     ┌─────────────────┐     ┌────────▼────────┐
│  6. UI updates   │     │  5. Server       │     │  4. User signs   │
│                  │◀────│  verifyAndLink() │◀────│  nonce message   │
│  Balance shown   │     │                  │     │                  │
│  Features unlock │     │  nacl.verify()   │     │  signMessage()   │
│  useWallet()     │     │  Link wallet     │     │  on adapter      │
│  active          │     │  Create session  │     │                  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Key design decisions:**

- **Nonce-based verification**: Every wallet link requires a fresh cryptographic nonce signed by the wallet's private key. Nonces are single-use with a 5-minute TTL, preventing replay attacks while proving wallet ownership.
- **Session TTL**: Default 24-hour session expiry with `lastActivity` extension on each interaction. Configurable per venture.
- **Multi-wallet**: Users can link multiple wallets across chains. One wallet is designated "primary" per chain for default transaction signing.
- **Custodial KMS**: For ventures requiring server-side signing (e.g., automated treasury operations), the KMS adapter wraps AWS KMS or HashiCorp Vault for key management.

#### Database Tables (4)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_wallet` | Connected wallets per user | `chain`, `address`, `provider`, `is_primary`, `verified_at` |
| `wallet_session` | Active connection sessions | `session_token`, `is_active`, `expires_at`, `device_id` |
| `wallet_transaction` | Off-chain transaction index | `tx_hash`, `chain`, `type`, `status`, `amount`, `token_mint` |
| `wallet_nonce` | Signature verification nonces | `nonce`, `message`, `expires_at`, `used_at` |

---

### Module: nfts

The NFTs module provides **complete NFT lifecycle management** — from collection creation through minting, marketplace listing, transfers, and metadata management. It implements the Metaplex standard for Solana NFTs, supports compressed NFTs (cNFTs) via Bubblegum for cost-efficient mass minting, and includes NFT gating for feature access control.

#### Internal Structure

```
nfts/
├── service.ts                  # NFTService, CollectionService, MintingService, MarketplaceService
├── schema.ts                   # Drizzle ORM tables (6 tables)
├── types.ts                    # TypeScript types & Zod schemas
├── constants.ts                # Royalty defaults, batch limits, standards
├── collection/
│   ├── collection-manager.ts   # Collection CRUD, deployment, reveal
│   ├── candy-machine.ts        # Candy Machine v3 integration
│   ├── merkle-tree.ts          # Bubblegum concurrent merkle tree setup
│   └── collection-stats.ts     # Floor price, volume, holder aggregation
├── minting/
│   ├── mint-engine.ts          # Core minting logic (standard + compressed)
│   ├── mint-queue.ts           # Async mint request queue (Redpanda)
│   ├── whitelist.ts            # Merkle proof verification for WL phases
│   ├── lazy-mint.ts            # Pay-first, mint-later pattern
│   └── compressed-mint.ts      # cNFT batch minting via Bubblegum
├── marketplace/
│   ├── listing-manager.ts      # List/unlist/buy operations
│   ├── escrow.ts               # Escrow for marketplace transactions
│   ├── royalty-enforcer.ts     # pNFT royalty enforcement
│   └── price-discovery.ts     # Floor price, trending, analytics
├── gating/
│   ├── gate-checker.ts         # NFT gate condition evaluation
│   ├── membership-manager.ts   # NFT-based membership tiers
│   └── ownership-verifier.ts   # On-chain ownership verification fallback
├── metadata/
│   ├── metadata-builder.ts     # Metaplex JSON metadata construction
│   ├── arweave-uploader.ts     # Permanent metadata storage
│   ├── ipfs-uploader.ts        # IPFS metadata storage (alternative)
│   └── metadata-refresher.ts   # Sync on-chain metadata changes
└── rarity/
    ├── rarity-calculator.ts    # Trait rarity scoring algorithm
    └── rarity-ranker.ts        # Rank assignment within collection
```

#### NFT Lifecycle State Machine

```
┌──────────┐   deploy    ┌──────────┐   start mint  ┌──────────┐
│          │────────────▶│          │──────────────▶│          │
│  DRAFT   │             │  MINTED  │               │ MINTING  │
│          │             │ (on-chain│               │          │
│ metadata │             │  contract│               │ Users    │
│ + art    │             │  deployed│               │ can mint │
│ uploaded │             │  )       │               │          │
└──────────┘             └──────────┘               └────┬─────┘
                                                         │
                                          ┌──────────────┤ mint complete
                                          │              │ or sold out
                                          ▼              ▼
                              ┌──────────────┐    ┌──────────┐
                              │              │    │          │
                              │  REVEALED    │    │  FROZEN  │
                              │              │◀───│          │
                              │ placeholder  │    │ metadata │
                              │ → real art   │    │ locked   │
                              └──────────────┘    └──────────┘
```

**Status transitions:**
- **DRAFT → MINTED**: Collection metadata uploaded to Arweave, Candy Machine deployed on-chain, collection NFT minted.
- **MINTED → MINTING**: First mint phase activated. Users can start minting.
- **MINTING → FROZEN**: Supply exhausted or mint manually closed. No further mints allowed.
- **FROZEN → REVEALED**: For delayed-reveal collections, placeholder art is swapped with real art.

#### Compressed NFT Architecture

Compressed NFTs (cNFTs) use Metaplex's Bubblegum program to store NFT data in a concurrent merkle tree, reducing per-NFT cost by **99.6%**:

| Metric | Traditional NFT | Compressed NFT |
|--------|----------------|----------------|
| Cost per NFT | ~0.012 SOL ($1.70) | ~0.000005 SOL ($0.0007) |
| 10,000 NFTs total | ~120 SOL ($17,000) | ~0.5 SOL ($71) |
| Storage | 1 account per NFT | 1 merkle tree for all |
| Transfer | Direct token transfer | Requires merkle proof |
| Marketplace | All marketplaces | MagicEden, Tensor (growing) |

**Best for:** Loyalty NFTs, achievement badges, membership cards, POAPs, large airdrops, game items.

**Architecture:**

```
┌──────────────────────────────────────────┐
│          Merkle Tree Account             │
│         (on-chain, ~5.5 SOL)             │
│                                          │
│               Root Hash                  │
│              ╱         ╲                 │
│          H(AB)         H(CD)             │
│         ╱    ╲        ╱    ╲             │
│       H(A)  H(B)   H(C)  H(D)           │
│        │     │       │     │             │
│      NFT₁  NFT₂   NFT₃  NFT₄  ...      │
│                                          │
└──────────────────────────────────────────┘

Verification: hash(NFT data) + proof = root hash → NFT is valid
```

**Trade-offs:**
- ✅ 99%+ cost reduction
- ✅ Same Metaplex metadata standard
- ⚠️ Transfer requires off-chain merkle proof (stored in `proof` JSONB column)
- ⚠️ Concurrent merkle tree has write throughput limitations (mitigated by canopy depth)

#### NFT Gating System

NFT gates allow ventures to restrict access to features, content, or membership tiers based on NFT ownership:

```typescript
// Gate condition evaluation
interface GateCondition {
  type: 'collection' | 'specific_nft' | 'attribute' | 'minimum_count';
  collectionId?: string;          // Hold any NFT from this collection
  mintAddress?: string;           // Hold this specific NFT
  attributeFilter?: {             // Hold NFT with specific trait
    trait_type: string;
    value: string | string[];
  };
  minimumCount?: number;          // Hold at least N NFTs
  chain?: Chain;
}
```

Gate checks follow a **fast path → fallback** pattern:
1. **Fast path**: Check off-chain DB ownership records (< 5ms)
2. **Fallback**: Verify on-chain ownership via RPC if DB is stale (< 200ms)
3. **Periodic sync**: Background job re-verifies ownership every 6 hours

Gates support **AND/OR** logic for complex conditions (e.g., "Must hold a Founders Pass AND have a Gold-tier attribute").

#### Database Tables (6)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `nft_collection` | Collection definitions & config | `name`, `chain`, `standard`, `max_supply`, `mint_phases`, `royalty_basis_points` |
| `nft` | Individual NFT records | `mint_address`, `owner_address`, `attributes`, `rarity_score`, `is_listed` |
| `nft_transfer` | Transfer/sale history | `tx_hash`, `type`, `from_address`, `to_address`, `price` |
| `nft_mint_request` | Lazy mint queue | `wallet_address`, `quantity`, `status`, `payment_tx_hash` |
| `nft_gate` | Gating rules per resource | `resource_type`, `resource_id`, `conditions`, `operator` |
| `nft_membership` | NFT-based membership records | `nft_id`, `tier`, `is_active`, `last_verified_at` |

---

### Module: oracles

The Oracles module provides **real-time off-chain data feeds** for both on-chain and off-chain business logic. It integrates with Pyth Network and Switchboard for price feeds, provides verifiable randomness (VRF) for fair gaming, delivers sports event data for BetEdge, and supports custom oracle creation with multi-source aggregation and staleness detection.

#### Internal Structure

```
oracles/
├── service.ts                  # OracleService — price, VRF, sports
├── schema.ts                   # Drizzle ORM tables (4 tables)
├── types.ts                    # TypeScript types & Zod schemas
├── constants.ts                # Feed IDs, staleness thresholds, intervals
├── price/
│   ├── price-aggregator.ts     # Multi-source price aggregation engine
│   ├── pyth-fetcher.ts         # Pyth Network price feed integration
│   ├── switchboard-fetcher.ts  # Switchboard V2 feed integration
│   ├── api-fetcher.ts          # Custom REST API price fetcher
│   ├── chainlink-fetcher.ts    # Chainlink (EVM) price fetcher
│   └── price-cache.ts          # Redis price cache (TTL: 30s)
├── staleness/
│   ├── staleness-detector.ts   # Feed staleness monitoring (30s cron)
│   └── alert-emitter.ts        # Stale feed alert generation
├── randomness/
│   ├── vrf-service.ts          # On-chain VRF via Switchboard
│   ├── commit-reveal.ts        # Off-chain commit-reveal randomness
│   └── randomness-verifier.ts  # Proof verification for VRF results
├── sports/
│   ├── sports-oracle.ts        # Sports event lifecycle management
│   ├── odds-provider.ts        # Odds data integration
│   ├── result-certifier.ts     # Multi-source result certification
│   └── live-feed.ts            # WebSocket live score streaming
└── streaming/
    ├── ws-manager.ts           # WebSocket subscription management
    └── event-publisher.ts      # Redpanda event publishing for updates
```

#### Oracle Data Pipeline

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   Pyth   │  │Switchboard│  │  Custom  │  │  Sports  │
│  Network │  │  V2      │  │   APIs   │  │   APIs   │
│          │  │          │  │          │  │          │
│ SOL/USD  │  │ SOL/USD  │  │ CoinGecko│  │ SportsDB │
│ BTC/USD  │  │ BTC/USD  │  │ DeFiLlama│  │ ESPN API │
│ 200+ prs │  │ Custom   │  │ CMC      │  │ Odds API │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │              │              │
     └─────────────┴──────────────┴──────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                  AGGREGATION LAYER                        │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Median    │  │  Weighted   │  │   Staleness     │  │
│  │  Aggregator │  │    Mean     │  │   Detector      │  │
│  │             │  │             │  │                 │  │
│  │ Pick middle │  │ Weight by   │  │ Flag feeds that │  │
│  │ value from  │  │ source      │  │ haven't updated │  │
│  │ N sources   │  │ reliability │  │ within heartbeat│  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐                       │
│  │  Deviation  │  │  Outlier    │                       │
│  │  Threshold  │  │  Rejection  │                       │
│  │             │  │             │                       │
│  │ Only update │  │ Discard     │                       │
│  │ if changed  │  │ values >3σ  │                       │
│  │ >X%         │  │ from mean   │                       │
│  └─────────────┘  └─────────────┘                       │
│                                                          │
└──────────────────────────┬───────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
    │  PostgreSQL  │ │  Redis   │ │ Redpanda /   │
    │              │ │  Cache   │ │ WebSocket    │
    │ oracle_update│ │ TTL: 30s │ │              │
    │ history row  │ │ price:X  │ │ price.updated│
    └──────────────┘ └──────────┘ └──────────────┘
```

#### Aggregation Methods

| Method | Algorithm | Use Case |
|--------|-----------|----------|
| **Median** (default) | Sort values, pick middle | Most robust against outliers |
| **Mean** | Arithmetic average | Simple average across sources |
| **Weighted Mean** | Weight by source reliability | When some sources are more trustworthy |
| **First Valid** | Use first source that responds | For low-latency requirements |

#### Staleness Detection

A cron job checks all active feeds every 30 seconds:

```
Feed heartbeat: 60 seconds (configurable per feed)

Timeline:
  t=0s   ───── Price update received ─────── ✅ Healthy
  t=30s  ───── Staleness check ────────────── ✅ Healthy (30s < 60s heartbeat)
  t=60s  ───── Staleness check ────────────── ⚠️ Stale! (60s = heartbeat)
                                               │
                                               ├── DB status → 'stale'
                                               ├── Event: oracle.feed.stale
                                               └── Alert: warning severity
  t=90s  ───── Price update received ─────── ✅ Recovered → status 'active'
```

When a feed goes stale:
1. Database status updated to `stale` with `stale_since` timestamp
2. Event emitted via Redpanda: `oracle.feed.stale`
3. Alert created with `warning` severity
4. Consuming services receive staleness metadata alongside the cached price

#### VRF Randomness

Two randomness modes are supported:

**On-chain VRF (Switchboard):**
```
1. Client requests randomness → request_tx on Solana
2. Switchboard oracle fulfills with VRF proof → fulfillment_tx
3. Proof is cryptographically verifiable on-chain
4. Result: uint256 random word(s) + proof
```

**Off-chain Commit-Reveal (BetEdge):**
```
1. Server commits hash(secret) before bets close
2. Users place bets (cannot influence outcome)
3. After betting closes, server reveals secret
4. Outcome = hash(secret + blockhash) — verifiable by anyone
```

#### Sports Oracle Pipeline

```
Scheduled → Pregame → Live → Halftime → Live → Finished → Certified
                                                              │
                                                  Multi-source confirmation
                                                  before bet settlement
```

Sports events pass through status states. **Results are only `certified` after:**
1. Multiple independent data sources confirm the same outcome
2. Minimum confirmation delay (prevents premature settlement)
3. Optional manual review for high-stakes events

Only certified results trigger downstream bet settlement in BetEdge.

#### Database Tables (4)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `oracle_feed` | Feed definitions & config | `slug`, `pair`, `type`, `sources`, `aggregation_method`, `current_value` |
| `oracle_update` | Price update history | `feed_id`, `value`, `confidence`, `source_values`, `trigger_reason` |
| `oracle_randomness` | VRF request queue | `requester_address`, `random_words`, `proof`, `status` |
| `oracle_sports_event` | Sports event data | `sport`, `league`, `home_team`, `away_team`, `status`, `odds` |

---

### Module: attestation

The Attestation module provides **on-chain identity verification and credentialing** for the MCV ecosystem. It enables ventures to issue, manage, and verify attestations — cryptographic statements about a user (KYC status, age, jurisdiction, accredited investor status) — that can be checked off-chain (fast DB lookup) and on-chain (trustless verification via EAS patterns adapted for Solana).

#### Internal Structure

```
attestation/
├── service.ts                  # AttestationService, VerificationService, CredentialService
├── schema.ts                   # Drizzle ORM tables (6 tables)
├── types.ts                    # TypeScript types & Zod schemas
├── constants.ts                # Schema IDs, provider configs, validity defaults
├── verification/
│   ├── verification-engine.ts  # Orchestrates KYC verification flows
│   ├── sumsub-provider.ts      # SumSub SDK integration
│   ├── veriff-provider.ts      # Veriff SDK integration
│   ├── manual-provider.ts      # Manual admin verification
│   └── webhook-handler.ts      # KYC provider webhook processing
├── attestation/
│   ├── attestation-manager.ts  # Create, revoke, renew attestations
│   ├── attestation-checker.ts  # Fast off-chain attestation checks
│   ├── schema-registry.ts      # Attestation schema management
│   └── expiry-monitor.ts       # Track and alert on expiring attestations
├── onchain/
│   ├── eas-publisher.ts        # Publish attestations to EAS (Ethereum)
│   ├── solana-publisher.ts     # Publish attestations to Solana programs
│   └── proof-generator.ts      # Generate verification proofs
├── credentials/
│   ├── credential-issuer.ts    # W3C Verifiable Credential issuance
│   ├── credential-verifier.ts  # VC verification and validation
│   ├── selective-disclosure.ts # Share only required fields
│   └── did-resolver.ts         # DID resolution (did:sol:, did:ethr:)
└── reputation/
    ├── reputation-engine.ts    # Multi-factor reputation scoring
    ├── factor-calculators.ts   # Individual factor score computation
    └── tier-resolver.ts        # Map score to tier (newcomer → diamond)
```

#### Attestation Schema System

Attestation schemas define the structure and validation rules for each type of attestation:

```typescript
interface AttestationSchema {
  slug: string;                    // "age-verification"
  type: AttestationType;           // kyc | aml | age | accredited | jurisdiction | ...
  schema: {
    fields: Array<{
      name: string;                // "age"
      type: 'string' | 'number' | 'boolean' | 'date' | 'address';
      required: boolean;
      private?: boolean;           // Encrypted, never in public API
      validation?: {
        min?: number;              // min age: 21
        max?: number;
        pattern?: string;
        enum?: string[];
      };
    }>;
  };
  verificationRequirements: {
    providers?: string[];          // ["sumsub", "veriff"]
    minAge?: number;               // 21 for BetEdge
    allowedJurisdictions?: string[];
    blockedJurisdictions?: string[];
    livenessCheck?: boolean;
    accreditedInvestorMinIncome?: number;
  };
  defaultValidityDays: number;     // 365
  isRevocable: boolean;            // true
}
```

**Pre-built schemas per venture:**

| Schema | Venture | Fields | Validity |
|--------|---------|--------|----------|
| `age-verification` | BetEdge | age, country, state, verified | 365 days |
| `jurisdiction-check` | BetEdge | country, state, legal_status | 30 days |
| `accredited-investor` | Futurestate, Full Gain | income, net_worth, accreditation_type | 365 days |
| `kyc-basic` | All ventures | first_name, country, document_type | 365 days |
| `kyc-enhanced` | Full Gain | first_name, last_name, dob, ssn(private), address | 365 days |

#### Verification Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. Start     │     │ 2. Provider  │     │ 3. User      │
│    Verify    │────▶│    Widget    │────▶│    Completes  │
│              │     │              │     │    KYC        │
│ POST /verify │     │ SumSub SDK   │     │ Photo ID +   │
│ {schema, w}  │     │ embedded in  │     │ Liveness     │
│              │     │ venture app  │     │ check        │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │ Webhook
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 6. Feature   │     │ 5. On-chain  │     │ 4. Process   │
│    Access    │◀────│    Publish   │◀────│    Result    │
│              │     │    (opt.)    │     │              │
│ checkAttest  │     │ EAS or       │     │ Verify sig   │
│ (wallet,type)│     │ Solana txn   │     │ Extract data │
│ → PASS ✓    │     │ attestation  │     │ Create attest│
└──────────────┘     └──────────────┘     └──────────────┘
```

#### Reputation Scoring

The reputation engine computes a 0–1000 score from multiple weighted factors:

| Factor | Weight | Source | Description |
|--------|--------|--------|-------------|
| `wallet_age` | 15% | On-chain | Time since first transaction |
| `transaction_count` | 15% | Transaction index | Total transactions signed |
| `nft_holdings` | 10% | NFT module | Number and rarity of held NFTs |
| `attestation_count` | 20% | Attestation records | Verified KYC, age, jurisdiction attestations |
| `defi_activity` | 10% | On-chain | DeFi protocol interactions |
| `community_participation` | 10% | Engagement module | Governance votes, forum activity |
| `account_completeness` | 10% | Identity module | Profile completion, linked accounts |
| `negative_flags` | 10% | Moderation | Deductions for disputes, chargebacks |

**Tier mapping:**

| Score Range | Tier | Perks |
|-------------|------|-------|
| 0–99 | Newcomer | Basic access |
| 100–249 | Bronze | Standard features |
| 250–499 | Silver | Priority support |
| 500–749 | Gold | Fee discounts, early access |
| 750–899 | Platinum | VIP features, higher limits |
| 900–1000 | Diamond | Full access, custom perks |

#### Verifiable Credentials (W3C VC)

The module implements W3C Verifiable Credentials Data Model 2.0 for interoperable, standards-compliant identity claims:

```typescript
interface VerifiableCredential {
  '@context': ['https://www.w3.org/2018/credentials/v1'];
  type: ['VerifiableCredential', 'KYCCredential'];
  credentialSubject: {
    id: 'did:sol:GKv4...';          // Subject DID
    age: 25;
    country: 'US';
    verificationLevel: 'enhanced';
  };
  issuer: 'did:sol:MCV...';         // MCV issuer DID
  issuanceDate: '2026-02-09T...';
  expirationDate: '2027-02-09T...';
  proof: {
    type: 'Ed25519Signature2020';
    verificationMethod: 'did:sol:MCV...#key-1';
    proofPurpose: 'assertionMethod';
    proofValue: '...base64...';
  };
}
```

**Selective disclosure** allows sharing only necessary fields. For example, a gambling site can verify `age >= 21` without learning the user's exact DOB or name.

#### Database Tables (6)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `attestation_schema` | Schema definitions | `slug`, `type`, `schema`, `verification_requirements` |
| `attestation` | Attestation records | `subject_address`, `schema_id`, `status`, `data`, `private_data`, `expires_at` |
| `attestation_verification_request` | KYC request queue | `provider`, `external_id`, `status`, `result` |
| `attestation_check` | Verification check log | `check_type`, `subject_address`, `passed`, `context` |
| `reputation_score` | Computed reputation | `wallet_address`, `score`, `tier`, `factors` |
| `verifiable_credential` | W3C VCs | `subject_did`, `credential_type`, `credential`, `is_valid` |

---

## Data Models

### Complete Schema Summary

The `@mcv/web3-public` package manages **20 database tables** across its 4 submodules, all defined with Drizzle ORM and protected by Supabase Row-Level Security.

#### Wallet-SDK Tables (4)

```typescript
// user_wallet — Connected wallets per user
export const userWallets = pgTable('user_wallet', {
  id: text('id').primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),
  chain: chainEnum('chain').notNull(),                     // solana | ethereum | base | polygon | arbitrum
  address: text('address').notNull(),                      // Public key or 0x address
  provider: walletProviderEnum('provider'),                // phantom | solflare | metamask | ...
  isCustodial: boolean('is_custodial').default(false),
  isPrimary: boolean('is_primary').default(false),
  verifiedAt: timestamp('verified_at'),
  verificationSignature: text('verification_signature'),
  resolvedName: text('resolved_name'),                     // SNS (.sol) or ENS (.eth)
  label: text('label'),                                    // User-assigned label
  metadata: jsonb('metadata'),                             // Capabilities, last balance, avatar
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});
// Indexes: chainAddressUnq, userChainIdx, ventureUserIdx

// wallet_session — Active wallet sessions
export const walletSessions = pgTable('wallet_session', {
  id: text('id').primaryKey(),
  walletId: text('wallet_id').references(() => userWallets.id),
  userId: text('user_id').notNull(),
  sessionToken: text('session_token').notNull().unique(),
  provider: walletProviderEnum('provider'),
  isActive: boolean('is_active').default(true),
  connectedAt: timestamp('connected_at'),
  lastActivity: timestamp('last_activity'),
  expiresAt: timestamp('expires_at'),                      // Default 24h TTL
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceId: text('device_id'),
  metadata: jsonb('metadata'),                             // connection method, version, chain
});

// wallet_transaction — Off-chain transaction index
export const walletTransactions = pgTable('wallet_transaction', {
  id: text('id').primaryKey(),
  ventureId: text('venture_id').notNull(),
  walletId: text('wallet_id').references(() => userWallets.id),
  chain: chainEnum('chain').notNull(),
  txHash: text('tx_hash').notNull(),
  slot: numeric('slot'),                                   // Solana slot
  type: text('type').notNull(),                            // transfer | swap | nft_mint | ...
  status: text('status').default('pending'),               // pending | confirmed | finalized
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address'),
  programId: text('program_id'),                           // Solana program
  amount: numeric('amount', { precision: 24, scale: 8 }),
  tokenMint: text('token_mint'),                           // SPL token mint
  fee: numeric('fee', { precision: 18, scale: 8 }),
  priorityFee: numeric('priority_fee'),
  instructions: jsonb('instructions'),
  logs: jsonb('logs'),
  description: text('description'),                        // Human-readable
  confirmedAt: timestamp('confirmed_at'),
  finalizedAt: timestamp('finalized_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
// Indexes: txHashUnq (chain+hash), walletIdx, ventureIdx, statusIdx, typeIdx

// wallet_nonce — Signature verification nonces
export const walletNonces = pgTable('wallet_nonce', {
  id: text('id').primaryKey(),
  address: text('address').notNull(),
  chain: chainEnum('chain').notNull(),
  nonce: text('nonce').notNull(),                          // Random nonce string
  message: text('message').notNull(),                      // Full signed message
  expiresAt: timestamp('expires_at').notNull(),            // 5-minute TTL
  usedAt: timestamp('used_at'),                            // Set when consumed
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### NFT Tables (6)

```typescript
// nft_collection — NFT collections
export const nftCollections = pgTable('nft_collection', {
  id: text('id').primaryKey(),
  ventureId: text('venture_id').notNull(),
  name: text('name').notNull(),                            // "BetEdge Founders Pass"
  symbol: text('symbol').notNull(),                        // "BEPASS"
  slug: text('slug').notNull(),
  description: text('description'),
  chain: chainEnum('chain').notNull(),
  standard: nftStandardEnum('standard').notNull(),         // metaplex | compressed | erc721 | erc1155
  contractAddress: text('contract_address'),               // Candy Machine address
  collectionMint: text('collection_mint'),
  merkleTree: text('merkle_tree'),                         // Bubblegum tree (cNFTs)
  image: text('image'),
  banner: text('banner'),
  maxSupply: integer('max_supply'),                        // null = unlimited
  currentSupply: integer('current_supply').default(0),
  royaltyBasisPoints: integer('royalty_basis_points').default(500),  // 5% = 500 bps
  royaltyRecipient: text('royalty_recipient'),
  royaltySplit: jsonb('royalty_split'),                     // [{address, share}]
  mintPhases: jsonb('mint_phases'),                        // Whitelist → Public with prices & limits
  mintPrice: numeric('mint_price'),
  maxPerWallet: integer('max_per_wallet'),
  isRevealed: boolean('is_revealed').default(true),
  traitTypes: jsonb('trait_types'),                        // For rarity calculation
  status: collectionStatusEnum('status').default('draft'), // draft | minting | minted | revealed | frozen
  floorPrice: numeric('floor_price'),
  totalVolume: numeric('total_volume'),
  uniqueHolders: integer('unique_holders').default(0),
  metadata: jsonb('metadata'),                             // socials, tags, category
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

// nft — Individual NFTs
export const nfts = pgTable('nft', {
  id: text('id').primaryKey(),
  ventureId: text('venture_id').notNull(),
  collectionId: text('collection_id').references(() => nftCollections.id),
  chain: chainEnum('chain').notNull(),
  mintAddress: text('mint_address').notNull(),              // SPL mint address
  tokenId: text('token_id'),                               // ERC-721/1155 ID
  assetId: text('asset_id'),                               // cNFT asset ID
  name: text('name').notNull(),
  description: text('description'),
  image: text('image'),                                    // Arweave/IPFS URI
  animationUrl: text('animation_url'),
  attributes: jsonb('attributes'),                         // [{trait_type, value, display_type}]
  properties: jsonb('properties'),                         // Metaplex properties
  ownerAddress: text('owner_address'),
  delegateAddress: text('delegate_address'),
  isCompressed: boolean('is_compressed').default(false),
  isListed: boolean('is_listed').default(false),
  listPrice: numeric('list_price'),
  rarityScore: numeric('rarity_score'),
  rarityRank: integer('rarity_rank'),
  metadataUri: text('metadata_uri'),                       // Arweave JSON URI
  proof: jsonb('proof'),                                   // cNFT merkle proof
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

// nft_transfer — Transfer/sale history
// nft_mint_request — Lazy mint queue
// nft_gate — Gating rules
// nft_membership — NFT-based memberships
// (See Module Architecture > nfts for full definitions)
```

#### Oracle Tables (4)

```typescript
// oracle_feed — Feed definitions and current values
export const oracleFeeds = pgTable('oracle_feed', {
  id: text('id').primaryKey(),
  ventureId: text('venture_id'),                           // null = global
  name: text('name').notNull(),
  slug: text('slug').notNull(),                            // "sol-usd"
  pair: text('pair'),                                      // "SOL/USD"
  type: oracleTypeEnum('type').notNull(),                  // price | randomness | sports | custom
  sources: jsonb('sources').notNull(),                     // [{type, name, config}]
  aggregationMethod: text('aggregation_method').default('median'),
  outlierRejection: boolean('outlier_rejection').default(true),
  updateFrequencySeconds: integer('update_frequency_seconds').default(10),
  deviationThresholdPercent: numeric('deviation_threshold_percent').default('0.50'),
  heartbeatSeconds: integer('heartbeat_seconds').default(60),
  currentValue: numeric('current_value'),
  change24h: numeric('change_24h'),
  confidence: numeric('confidence'),
  status: feedStatusEnum('status').default('active'),      // active | stale | inactive
  staleSince: timestamp('stale_since'),
  decimals: integer('decimals').default(8),
  unit: text('unit'),                                      // "USD", "ETH"
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

// oracle_update — Price history
export const oracleUpdates = pgTable('oracle_update', {
  id: text('id').primaryKey(),
  feedId: text('feed_id').references(() => oracleFeeds.id),
  value: numeric('value').notNull(),
  confidence: numeric('confidence'),
  sourceValues: jsonb('source_values'),                    // Per-source breakdown
  numSources: integer('num_sources'),
  spread: numeric('spread'),                               // Max - min
  triggerReason: text('trigger_reason'),                   // scheduled | deviation | heartbeat
  timestamp: timestamp('timestamp').defaultNow(),
});

// oracle_randomness — VRF request queue
// oracle_sports_event — Sports event data
// (See Module Architecture > oracles for full definitions)
```

#### Attestation Tables (6)

```typescript
// attestation_schema — Schema definitions
export const attestationSchemas = pgTable('attestation_schema', {
  id: text('id').primaryKey(),
  ventureId: text('venture_id'),                           // null = global
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  type: attestationTypeEnum('type').notNull(),             // kyc | aml | age | accredited | jurisdiction
  schema: jsonb('schema').notNull(),                       // Field definitions with validation
  verificationRequirements: jsonb('verification_requirements'),
  defaultValidityDays: integer('default_validity_days').default(365),
  isRevocable: boolean('is_revocable').default(true),
  chain: chainEnum('chain'),
  onChainSchemaId: text('on_chain_schema_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// attestation — Attestation records
export const attestations = pgTable('attestation', {
  id: text('id').primaryKey(),
  ventureId: text('venture_id'),
  schemaId: text('schema_id').references(() => attestationSchemas.id),
  subjectAddress: text('subject_address').notNull(),
  attesterId: text('attester_id'),
  attesterName: text('attester_name'),
  status: attestationStatusEnum('status').default('pending'),  // pending | verified | rejected | expired | revoked
  data: jsonb('data').notNull(),                           // Public attestation data
  privateData: jsonb('private_data'),                      // Encrypted private fields
  dataHash: text('data_hash'),                             // SHA-256 for on-chain verification
  chain: chainEnum('chain'),
  attestationUid: text('attestation_uid'),                 // EAS UID
  txHash: text('tx_hash'),
  issuedAt: timestamp('issued_at'),
  expiresAt: timestamp('expires_at'),
  revokedAt: timestamp('revoked_at'),
  verificationProvider: text('verification_provider'),     // sumsub | veriff | manual
  createdAt: timestamp('created_at').defaultNow(),
});

// attestation_verification_request — KYC queue
// attestation_check — Check audit log
// reputation_score — Computed reputation
// verifiable_credential — W3C VCs
// (See Module Architecture > attestation for full definitions)
```

### Enum Definitions

```typescript
export const chainEnum = pgEnum('chain', [
  'solana', 'ethereum', 'base', 'polygon', 'arbitrum'
]);

export const walletProviderEnum = pgEnum('wallet_provider', [
  'phantom', 'solflare', 'backpack', 'metamask',
  'coinbase_wallet', 'walletconnect', 'privy', 'kms'
]);

export const nftStandardEnum = pgEnum('nft_standard', [
  'metaplex', 'compressed', 'erc721', 'erc1155'
]);

export const collectionStatusEnum = pgEnum('collection_status', [
  'draft', 'minted', 'minting', 'revealed', 'frozen'
]);

export const oracleTypeEnum = pgEnum('oracle_type', [
  'price', 'randomness', 'sports', 'weather', 'custom'
]);

export const feedStatusEnum = pgEnum('feed_status', [
  'active', 'stale', 'inactive', 'deprecated'
]);

export const attestationTypeEnum = pgEnum('attestation_type', [
  'kyc', 'aml', 'age', 'accredited', 'jurisdiction',
  'identity', 'credential', 'custom'
]);

export const attestationStatusEnum = pgEnum('attestation_status', [
  'pending', 'verified', 'rejected', 'expired', 'revoked'
]);
```

### Row-Level Security (RLS)

All tables enforce Supabase RLS policies:

| Policy | Description |
|--------|-------------|
| **Venture isolation** | Users can only access data belonging to their venture (`venture_id` filter) |
| **Wallet ownership** | Wallet operations require matching `user_id` from JWT |
| **Attestation privacy** | `private_data` column is never returned in standard queries; requires elevated role |
| **Admin override** | Service-role JWT bypasses RLS for background jobs (minting, staleness checks) |

---

## Data Flow & Events

### Event Catalog

All events are published to Redpanda/Kafka topics and consumed by downstream services:

#### Wallet Events

| Event | Topic | Trigger | Payload |
|-------|-------|---------|---------|
| `wallet.connected` | `web3-public.wallet` | User connects wallet | `{walletId, userId, chain, address, provider}` |
| `wallet.disconnected` | `web3-public.wallet` | User disconnects | `{walletId, userId, sessionId}` |
| `wallet.linked` | `web3-public.wallet` | Additional wallet linked | `{walletId, userId, chain, address}` |
| `wallet.transaction.confirmed` | `web3-public.wallet` | Transaction confirmed on-chain | `{txHash, chain, type, amount, status}` |
| `wallet.transaction.finalized` | `web3-public.wallet` | Transaction finalized | `{txHash, chain, slot}` |
| `wallet.session.expired` | `web3-public.wallet` | Session TTL exceeded | `{sessionId, walletId, userId}` |

#### NFT Events

| Event | Topic | Trigger | Payload |
|-------|-------|---------|---------|
| `nft.collection.created` | `web3-public.nft` | Collection created | `{collectionId, ventureId, name, chain}` |
| `nft.collection.deployed` | `web3-public.nft` | Collection deployed on-chain | `{collectionId, contractAddress, txHash}` |
| `nft.minted` | `web3-public.nft` | NFT minted | `{nftId, collectionId, mintAddress, ownerAddress}` |
| `nft.transferred` | `web3-public.nft` | NFT transferred | `{nftId, from, to, txHash}` |
| `nft.listed` | `web3-public.nft` | NFT listed for sale | `{nftId, price, marketplace}` |
| `nft.sold` | `web3-public.nft` | NFT sold | `{nftId, from, to, price, royaltyPaid}` |
| `nft.burned` | `web3-public.nft` | NFT burned | `{nftId, ownerAddress, txHash}` |
| `nft.gate.checked` | `web3-public.nft` | Gate check performed | `{gateId, walletAddress, allowed, reason}` |
| `nft.membership.activated` | `web3-public.nft` | Membership activated | `{membershipId, userId, tier}` |
| `nft.membership.deactivated` | `web3-public.nft` | NFT no longer held | `{membershipId, userId, reason}` |

#### Oracle Events

| Event | Topic | Trigger | Payload |
|-------|-------|---------|---------|
| `oracle.price.updated` | `web3-public.oracle` | Price feed updated | `{feedId, pair, value, confidence, sources}` |
| `oracle.feed.stale` | `web3-public.oracle` | Feed exceeded heartbeat | `{feedId, slug, secondsSinceUpdate}` |
| `oracle.feed.recovered` | `web3-public.oracle` | Stale feed recovered | `{feedId, slug, downtimeSeconds}` |
| `oracle.randomness.fulfilled` | `web3-public.oracle` | VRF request fulfilled | `{requestId, randomWords, proof}` |
| `oracle.sports.status_changed` | `web3-public.oracle` | Sports event status change | `{eventId, sport, oldStatus, newStatus}` |
| `oracle.sports.result_certified` | `web3-public.oracle` | Sports result certified | `{eventId, winner, homeScore, awayScore}` |

#### Attestation Events

| Event | Topic | Trigger | Payload |
|-------|-------|---------|---------|
| `attestation.verification.started` | `web3-public.attestation` | KYC flow started | `{requestId, userId, provider, schema}` |
| `attestation.verification.completed` | `web3-public.attestation` | KYC completed | `{requestId, passed, attestationId}` |
| `attestation.created` | `web3-public.attestation` | Attestation issued | `{attestationId, subjectAddress, type, status}` |
| `attestation.revoked` | `web3-public.attestation` | Attestation revoked | `{attestationId, revokedBy, reason}` |
| `attestation.expired` | `web3-public.attestation` | Attestation expired | `{attestationId, subjectAddress, type}` |
| `attestation.published_onchain` | `web3-public.attestation` | Published to blockchain | `{attestationId, chain, txHash}` |
| `reputation.score.updated` | `web3-public.attestation` | Reputation recalculated | `{walletAddress, score, tier, change}` |
| `credential.issued` | `web3-public.attestation` | VC issued | `{credentialId, subjectDid, type}` |

### Core Data Flows

#### Flow 1: Wallet Connect → NFT Mint → Attestation Gate

```
User clicks "Connect Wallet"
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ wallet-sdk      │────▶│ wallet-sdk      │────▶│ attestation     │
│                 │     │                 │     │                 │
│ Detect Phantom  │     │ Sign nonce msg  │     │ Check KYC       │
│ adapter.connect │     │ Verify sig      │     │ status for mint │
│ Get publicKey   │     │ Link to user    │     │ PASS → proceed  │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ nfts            │────▶│ nfts            │────▶│ wallet-sdk      │
│                 │     │                 │     │                 │
│ Create mint     │     │ Build Metaplex  │     │ Sign transaction│
│ request         │     │ transaction     │     │ Submit to Solana│
│ Validate supply │     │ Upload metadata │     │ Confirm on-chain│
│ Check whitelist │     │ to Arweave      │     │ Index in DB     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Events emitted:** `wallet.connected` → `attestation.check` → `nft.minted` → `wallet.transaction.confirmed`

#### Flow 2: Oracle Price Update → Business Logic

```
Cron Job: Update Price Feeds (every 10s)
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Fetch Pyth      │────▶│ Fetch           │────▶│ Aggregate       │
│ SOL/USD         │     │ Switchboard     │     │ Method: median  │
│ $142.53         │     │ SOL/USD         │     │ Result: $142.50 │
│ confidence: hi  │     │ $142.48         │     │ confidence: 0.97│
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                    ┌─────────────────────┼──────────────────────┐
                                    ▼                     ▼                      ▼
                          ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                          │ PostgreSQL   │     │ Redis cache  │     │ Redpanda     │
                          │              │     │              │     │              │
                          │ oracle_update│     │ TTL: 30s     │     │ Event:       │
                          │ history row  │     │ price:sol/usd│     │ price.updated│
                          └──────────────┘     └──────────────┘     └──────────────┘
```

**Events emitted:** `oracle.price.updated` (consumed by BetEdge odds engine, Futurestate pricing, portfolio displays)

#### Flow 3: Attestation → Verifiable Credential → Selective Disclosure

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ User completes  │────▶│ Server processes │────▶│ Issue W3C       │
│ KYC via SumSub  │     │ webhook         │     │ Verifiable      │
│                 │     │                 │     │ Credential      │
│ Photo ID +      │     │ Create attest   │     │                 │
│ Liveness check  │     │ status: verified│     │ Sign with       │
│                 │     │ data: {age: 25} │     │ Ed25519         │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Third party     │◀────│ Selective       │◀────│ User presents   │
│ verifies        │     │ disclosure      │     │ VC to verifier  │
│                 │     │                 │     │                 │
│ Verify proof    │     │ Share only:     │     │ e.g., BetEdge   │
│ Check expiry    │     │ age >= 21: true │     │ needs age check │
│ Trust issuer    │     │ (hide DOB, name)│     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Events emitted:** `attestation.verification.completed` → `attestation.created` → `credential.issued`

---

## Integration Points

### Internal MCV Package Dependencies

| Package | Integration | Direction | Purpose |
|---------|------------|-----------|---------|
| **@mcv/web3-core** | Blockchain infrastructure | `web3-public → web3-core` | SPL token operations, program deployment, RPC connection pooling, keypair management |
| **@mcv/identity** | User identity | `web3-public ↔ identity` | Wallet-to-user linking, auth token exchange, profile enrichment with wallet data |
| **@mcv/commerce** | Payment & marketplace | `web3-public → commerce` | NFT marketplace payment processing, royalty distribution, fiat on-ramp for minting |
| **@mcv/engagement** | Gamification | `web3-public → engagement` | NFT achievement unlocks, loyalty point NFTs, reputation-based badges |
| **@mcv/ui** | UI components | `web3-public → ui` | Wallet connect button theming, NFT card design system, price ticker styling |
| **@mcv/fabric** | Event bus & storage | `web3-public → fabric` | Event publishing (Redpanda), NFT media storage (Arweave/IPFS), file uploads |
| **@mcv/db** | Database | `web3-public → db` | Drizzle ORM shared config, migration runner, connection pooling |
| **@mcv/cache** | Caching | `web3-public → cache` | Redis client for price feeds, sessions, rate limiting |
| **@mcv/auth** | Authentication | `web3-public → auth` | JWT validation for API routes, service-role tokens for background jobs |

### External Service Integrations

| Service | Module | Protocol | Purpose |
|---------|--------|----------|---------|
| **Solana RPC** (Helius, Triton, QuickNode) | All | JSON-RPC, WebSocket | Transaction submission, account queries, slot subscriptions |
| **Pyth Network** | oracles | On-chain program | Price feeds with confidence intervals (200+ pairs) |
| **Switchboard V2** | oracles | On-chain program | Custom feeds, VRF randomness |
| **Metaplex** | nfts | On-chain programs | NFT standard, Candy Machine, Bubblegum (cNFTs), Token Metadata |
| **Arweave** | nfts | HTTP (Bundlr) | Permanent NFT metadata and media storage |
| **IPFS** | nfts | HTTP (Pinata) | Alternative decentralized metadata storage |
| **SumSub** | attestation | REST API, WebSocket, SDK | KYC identity verification, document checks, liveness |
| **Veriff** | attestation | REST API, SDK | Alternative KYC provider |
| **EAS** (Ethereum Attestation Service) | attestation | On-chain (Ethereum) | Cross-chain attestation schema registry and verification |
| **CoinGecko / DeFiLlama** | oracles | REST API | Supplementary price data for aggregation |
| **Sports data APIs** | oracles | REST API, WebSocket | Live sports scores, odds, results for BetEdge |

### Venture-Specific Integration Patterns

| Venture | Primary Modules | Key Flows |
|---------|----------------|-----------|
| **BetEdge** | wallet-sdk, oracles, attestation | Wallet connect → age verify → VRF for provably fair → sports odds |
| **MCV Studios** | wallet-sdk, nfts | Wallet connect → collection create → mint → marketplace |
| **SerpSpace** | wallet-sdk, nfts | Wallet connect → NFT gating for premium features |
| **Full Gain** | wallet-sdk, attestation | Wallet connect → KYC → accredited investor → grant eligibility |
| **Futurestate** | wallet-sdk, nfts, oracles, attestation | Wallet connect → accredited verify → property token pricing → NFT purchase |

---

## Performance

### Latency Targets

| Operation | Target | Strategy |
|-----------|--------|----------|
| Wallet connection | < 500ms | Direct browser extension call |
| Nonce generation | < 50ms | Random generation + DB insert |
| Signature verification | < 20ms | `nacl.sign.detached.verify` (CPU) |
| Balance query (cached) | < 10ms | Redis cache hit |
| Balance query (RPC) | < 200ms | Direct Solana RPC call |
| Price feed read | < 5ms | Redis cache hit (30s TTL) |
| Price feed update | < 500ms | Multi-source aggregate |
| NFT mint transaction | < 2s | Transaction build + sign + submit |
| Attestation check | < 10ms | DB index lookup |
| Gate check | < 15ms | Off-chain DB check |
| Gate check (on-chain fallback) | < 300ms | RPC ownership verification |
| Rarity calculation (10k collection) | < 5s | Batch computation |

### Caching Strategy

| Data | Cache Layer | TTL | Invalidation |
|------|------------|-----|--------------|
| Price feeds | Redis | 30 seconds | On new aggregation |
| Wallet sessions | Redis | 24 hours | On disconnect/expiry |
| Token balances | Redis | 30 seconds | On transaction confirmation |
| NFT ownership | PostgreSQL + Redis | 6 hours | On transfer event |
| Attestation status | PostgreSQL | Until expiry | On revocation |
| Collection stats | Redis | 5 minutes | On mint/sale event |
| Rarity scores | PostgreSQL | Permanent | On recalculation |
| Nonces | PostgreSQL | 5 minutes | On use or expiry |

### Database Query Optimization

All hot-path queries leverage strategic indexes:

```sql
-- Fast wallet lookup by chain + address
CREATE UNIQUE INDEX wallet_chain_address_unq ON user_wallet (chain, address);

-- Fast transaction lookup by hash
CREATE UNIQUE INDEX tx_hash_chain_unq ON wallet_transaction (chain, tx_hash);

-- Fast attestation check by subject + schema
CREATE INDEX attestation_schema_status_idx ON attestation (schema_id, status);

-- Fast price lookup by feed slug
CREATE UNIQUE INDEX feed_slug_unq ON oracle_feed (slug);

-- Fast NFT gate check by venture + resource
CREATE INDEX gate_venture_resource_idx ON nft_gate (venture_id, resource_type, resource_id);

-- Fast NFT listing browse
CREATE INDEX nft_listed_idx ON nft (is_listed, collection_id);
```

---

## Scalability

### Horizontal Scaling

| Component | Scaling Strategy | Max Throughput |
|-----------|-----------------|----------------|
| **API Routes** | Stateless Next.js instances behind load balancer | 10,000 req/s per instance |
| **Wallet Sessions** | Redis cluster with session pinning | 100,000 concurrent sessions |
| **Price Updates** | Redpanda partitioned by feed ID | 50,000 updates/s |
| **Mint Queue** | Redpanda consumer groups | 1,000 mints/s per consumer |
| **Attestation Checks** | Read replicas for check queries | 50,000 checks/s |
| **WebSocket Streams** | Fan-out via Redis PubSub | 100,000 concurrent subscribers |

### Solana-Specific Scaling

| Concern | Strategy |
|---------|----------|
| **RPC rate limits** | Multi-provider rotation (Helius primary, Triton failover, QuickNode backup) |
| **Transaction throughput** | Priority fees for time-sensitive operations (mints, bets) |
| **Compressed NFT trees** | Multiple concurrent merkle trees per collection (configurable canopy depth) |
| **Account data size** | Off-chain DB mirrors minimize on-chain storage |
| **WebSocket subscriptions** | Shared RPC subscription with fan-out to application consumers |

### Batch Operations

| Operation | Batch Size | Strategy |
|-----------|-----------|----------|
| Compressed NFT minting | 100 per transaction | Bubblegum batch instruction |
| Metadata upload | 50 concurrent | Bundlr/Arweave parallel uploads |
| Price aggregation | All sources in parallel | `Promise.allSettled` with timeout |
| Membership verification | 500 per batch | Background job every 6 hours |
| Rarity recalculation | Full collection | Single compute pass, bulk DB update |

---

## Error Handling

### Error Classification

All errors follow a structured classification system for consistent handling across the package:

```typescript
enum Web3PublicErrorCode {
  // Wallet errors (W1xx)
  WALLET_NOT_FOUND          = 'W100',
  WALLET_NOT_CONNECTED      = 'W101',
  WALLET_REJECTED           = 'W102',   // User rejected connection/signature
  WALLET_ADAPTER_ERROR      = 'W103',
  NONCE_EXPIRED             = 'W104',
  NONCE_ALREADY_USED        = 'W105',
  SIGNATURE_INVALID         = 'W106',
  SESSION_EXPIRED           = 'W107',
  INSUFFICIENT_BALANCE      = 'W108',
  UNSUPPORTED_CHAIN         = 'W109',

  // NFT errors (N2xx)
  COLLECTION_NOT_FOUND      = 'N200',
  COLLECTION_SOLD_OUT       = 'N201',
  MINT_PHASE_INACTIVE       = 'N202',
  NOT_WHITELISTED           = 'N203',
  MAX_PER_WALLET_EXCEEDED   = 'N204',
  MINT_PAYMENT_FAILED       = 'N205',
  METADATA_UPLOAD_FAILED    = 'N206',
  NFT_NOT_OWNED             = 'N207',
  NFT_ALREADY_LISTED        = 'N208',
  GATE_CHECK_FAILED         = 'N209',
  ROYALTY_ENFORCEMENT_ERROR = 'N210',

  // Oracle errors (O3xx)
  FEED_NOT_FOUND            = 'O300',
  NO_VALID_SOURCES          = 'O301',   // All sources failed
  FEED_STALE                = 'O302',
  VRF_REQUEST_FAILED        = 'O303',
  SPORTS_EVENT_NOT_FOUND    = 'O304',
  RESULT_NOT_CERTIFIED      = 'O305',

  // Attestation errors (A4xx)
  SCHEMA_NOT_FOUND          = 'A400',
  ATTESTATION_NOT_FOUND     = 'A401',
  ATTESTATION_EXPIRED       = 'A402',
  ATTESTATION_REVOKED       = 'A403',
  VERIFICATION_FAILED       = 'A404',
  PROVIDER_ERROR            = 'A405',   // KYC provider failure
  JURISDICTION_BLOCKED      = 'A406',
  AGE_REQUIREMENT_NOT_MET   = 'A407',
  CREDENTIAL_INVALID        = 'A408',

  // General errors (G5xx)
  RATE_LIMITED              = 'G500',
  RPC_ERROR                 = 'G501',
  TRANSACTION_FAILED        = 'G502',
  TIMEOUT                   = 'G503',
  INTERNAL_ERROR            = 'G504',
}
```

### Error Response Format

```typescript
interface Web3PublicError {
  code: Web3PublicErrorCode;
  message: string;                // Human-readable message
  details?: Record<string, unknown>;  // Additional context
  retryable: boolean;            // Whether the operation can be retried
  retryAfterMs?: number;         // Suggested retry delay
  chain?: Chain;                 // Chain where error occurred
  txHash?: string;               // Transaction hash if relevant
}
```

### Retry Strategy

| Error Category | Retry | Strategy |
|---------------|-------|----------|
| RPC errors (G501) | Yes | Exponential backoff (100ms → 200ms → 400ms), failover to backup RPC |
| Transaction failures (G502) | Conditional | Retry with higher priority fee if error is `BlockhashNotFound` |
| Rate limits (G500) | Yes | Respect `Retry-After` header, backpressure via Redpanda |
| User rejections (W102) | No | Return to UI, user must retry manually |
| Source failures (O301) | Yes | Aggregate from remaining sources; retry failed source next cycle |
| Provider errors (A405) | Yes | Queue for retry; alert if persistent |
| Stale feeds (O302) | N/A | Return cached value with staleness warning |

### Circuit Breaker Pattern

External service integrations use circuit breakers:

```
CLOSED (normal) → OPEN (after 5 failures in 60s) → HALF-OPEN (after 30s cooldown)
                                                          │
                                                    Single test request
                                                          │
                                              ┌───────────┴───────────┐
                                              ▼                       ▼
                                           SUCCESS                  FAILURE
                                              │                       │
                                         → CLOSED               → OPEN (reset timer)
```

**Circuit breakers configured for:**
- Solana RPC providers (auto-failover to next provider)
- Pyth/Switchboard fetchers
- KYC provider APIs (SumSub, Veriff)
- Sports data APIs
- Arweave upload endpoints

---

## Observability

### Structured Logging

All services emit structured JSON logs via the MCV logging framework:

```typescript
// Example log entries
logger.info('wallet.connected', {
  userId: 'usr_abc123',
  walletId: 'wal_xyz789',
  chain: 'solana',
  address: 'GKv4...',
  provider: 'phantom',
  latencyMs: 342,
});

logger.warn('oracle.feed.stale', {
  feedId: 'feed_sol_usd',
  slug: 'sol-usd',
  secondsSinceUpdate: 65,
  heartbeatSeconds: 60,
});

logger.error('nft.mint.failed', {
  requestId: 'mint_abc',
  collectionId: 'col_xyz',
  errorCode: 'N205',
  errorMessage: 'Transaction simulation failed: insufficient funds',
  walletAddress: 'GKv4...',
  chain: 'solana',
});
```

### Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `web3_wallet_connections_total` | Counter | `chain`, `provider`, `venture` | Total wallet connections |
| `web3_wallet_active_sessions` | Gauge | `chain`, `venture` | Current active sessions |
| `web3_nft_mints_total` | Counter | `collection`, `standard`, `venture` | Total NFTs minted |
| `web3_nft_mint_duration_ms` | Histogram | `standard`, `chain` | Mint operation duration |
| `web3_oracle_update_latency_ms` | Histogram | `feed`, `source` | Price update latency |
| `web3_oracle_feeds_stale` | Gauge | | Number of stale feeds |
| `web3_oracle_source_errors_total` | Counter | `source`, `error_type` | Oracle source failures |
| `web3_attestation_checks_total` | Counter | `type`, `result`, `venture` | Attestation check count |
| `web3_attestation_check_latency_ms` | Histogram | `type` | Check latency |
| `web3_rpc_requests_total` | Counter | `provider`, `method` | RPC calls by provider |
| `web3_rpc_latency_ms` | Histogram | `provider`, `method` | RPC call latency |
| `web3_transaction_confirmations_total` | Counter | `chain`, `status` | Transaction outcomes |

### Health Checks

```typescript
// /api/health/web3-public
{
  status: 'healthy',
  modules: {
    'wallet-sdk': {
      status: 'healthy',
      activeSessions: 1247,
      rpcLatencyMs: 45,
    },
    'nfts': {
      status: 'healthy',
      pendingMints: 3,
      collectionsActive: 42,
    },
    'oracles': {
      status: 'degraded',
      activeFeeds: 28,
      staleFeeds: 2,
      staleFeedSlugs: ['custom-feed-a', 'custom-feed-b'],
    },
    'attestation': {
      status: 'healthy',
      pendingVerifications: 7,
      activeAttestations: 5830,
    },
  },
  dependencies: {
    solanaRpc: { status: 'healthy', latencyMs: 42, provider: 'helius' },
    pyth: { status: 'healthy', lastUpdate: '2026-02-09T09:44:00Z' },
    switchboard: { status: 'healthy', lastUpdate: '2026-02-09T09:44:05Z' },
    sumsub: { status: 'healthy', responseTimeMs: 120 },
    redis: { status: 'healthy', connectedClients: 24 },
    redpanda: { status: 'healthy', lag: 0 },
  },
  timestamp: '2026-02-09T09:44:12Z',
}
```

### Distributed Tracing

All operations carry trace context (`traceId`, `spanId`) through the full request lifecycle:

```
[Trace: abc-123]
  ├── [Span: API /api/nft/mint]               42ms
  │   ├── [Span: AttestationCheck]             8ms
  │   │   └── [Span: DB Query]                 3ms
  │   ├── [Span: MintEngine.execute]           2100ms
  │   │   ├── [Span: MetadataUpload]           450ms
  │   │   │   └── [Span: Arweave.upload]       420ms
  │   │   ├── [Span: BuildTransaction]         80ms
  │   │   │   └── [Span: Metaplex.mint]        60ms
  │   │   ├── [Span: WalletSign]               1200ms  ← user interaction
  │   │   └── [Span: SubmitTransaction]        370ms
  │   │       └── [Span: SolanaRPC.send]       350ms
  │   └── [Span: IndexTransaction]             20ms
  │       └── [Span: DB Insert]                12ms
  └── [Span: EmitEvent nft.minted]             5ms
```

### Alerting Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Oracle feed stale | Feed exceeds 2× heartbeat | Warning | Page on-call, switch to backup source |
| All oracle sources failed | 0 valid sources for a feed | Critical | Page immediately, serve last cached value |
| Mint failure rate > 5% | Rolling 5-min window | Warning | Investigate RPC health, check Solana congestion |
| RPC provider down | Circuit breaker open | Warning | Auto-failover to next provider |
| KYC provider down | Circuit breaker open | Warning | Queue verifications, notify users of delay |
| Attestation expiry surge | > 100 expirations in 1 hour | Info | Send renewal reminders |
| Wallet session anomaly | Same wallet, > 10 sessions from different IPs | Warning | Flag for review, potential attack |

---

## Security

### Wallet Security

| Threat | Mitigation |
|--------|------------|
| **Replay attacks** | Single-use nonces with 5-minute TTL. Each nonce can only be consumed once (`used_at` check). |
| **Impersonation** | Cryptographic signature verification (`nacl.sign.detached.verify` for Solana, `ecrecover` for EVM). |
| **Session hijacking** | Cryptographically random session tokens (256-bit), IP binding optional, device fingerprinting. |
| **Cross-site wallet draining** | Transaction confirmation dialogs show full details. No auto-signing. Users must approve every transaction in their wallet. |
| **Key exposure (custodial)** | KMS wallets use AWS KMS or HashiCorp Vault. Private keys never exist in application memory. |
| **Phishing** | WalletConnect v2 session proposals show verified app metadata. Domain verification for dApp connections. |

### Smart Contract Verification

| Check | Description |
|-------|-------------|
| **Program ID verification** | All Solana program interactions verify the target program ID against a known allowlist. No arbitrary program calls. |
| **Transaction simulation** | Every transaction is simulated via `simulateTransaction` before sending. Failures are caught before spending gas. |
| **Instruction inspection** | For custodial wallets, all transaction instructions are decoded and validated against allowed operations. |
| **Candy Machine validation** | Before minting, the Candy Machine account is verified on-chain: collection address, authority, supply. |
| **Royalty enforcement** | NFT transfers use Metaplex Programmable NFTs (pNFTs) which enforce royalties at the protocol level. |

### Data Security

| Data Type | Protection |
|-----------|------------|
| **Private attestation data** (SSN, DOB) | AES-256-GCM encryption at rest. Separate encryption key per venture. Never returned in standard API responses. |
| **Wallet private keys** | Never stored. Self-custodial wallets sign in-browser. Custodial wallets use KMS — keys never leave the HSM. |
| **Session tokens** | SHA-256 hashed before storage. Compared via timing-safe equality. |
| **Nonce messages** | Include domain, timestamp, and purpose to prevent cross-site reuse. |
| **Verification documents** | Processed by KYC provider (SumSub/Veriff) — MCV never stores raw ID documents. Only verification results. |

### RLS (Row-Level Security) Policies

```sql
-- Wallet: Users can only read their own wallets
CREATE POLICY wallet_user_read ON user_wallet
  FOR SELECT USING (user_id = auth.uid());

-- Attestation: Private data only accessible with service role
CREATE POLICY attestation_private_read ON attestation
  FOR SELECT USING (
    CASE
      WHEN current_setting('role') = 'service_role' THEN true
      ELSE private_data IS NULL
    END
  );

-- NFT Gate: Venture-scoped read
CREATE POLICY gate_venture_read ON nft_gate
  FOR SELECT USING (venture_id = auth.jwt() ->> 'venture_id');

-- Oracle: Global feeds readable by all, venture feeds scoped
CREATE POLICY feed_read ON oracle_feed
  FOR SELECT USING (
    venture_id IS NULL
    OR venture_id = auth.jwt() ->> 'venture_id'
  );
```

### Rate Limiting

| Endpoint | Limit | Window | Strategy |
|----------|-------|--------|----------|
| `POST /api/wallet/nonce` | 10 | 1 minute | Per IP address |
| `POST /api/wallet/verify` | 5 | 1 minute | Per wallet address |
| `POST /api/nft/mint` | 20 | 1 minute | Per wallet address |
| `GET /api/oracle/price` | 100 | 1 minute | Per API key |
| `POST /api/attestation/verify` | 3 | 1 minute | Per user |
| WebSocket connections | 5 | Concurrent | Per IP address |

### Audit Trail

All security-sensitive operations are logged to an immutable audit trail:

```typescript
interface AuditEntry {
  action: string;            // 'wallet.verify', 'attestation.revoke', 'nft.transfer'
  actorId: string;           // User or service performing the action
  subjectId: string;         // Entity being acted upon
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
  details: Record<string, unknown>;
  timestamp: Date;
}
```

Audit entries are written to a separate, append-only table with no UPDATE or DELETE permissions granted to any application role.

---

*@mcv/web3-public — Web3 Public Domain*
