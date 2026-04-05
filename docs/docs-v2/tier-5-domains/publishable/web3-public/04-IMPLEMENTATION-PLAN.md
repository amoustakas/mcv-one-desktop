# @mcv/web3-public — Implementation Plan

**Domain:** Web3 Public  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Submodules:** wallet-sdk · nfts · oracles · attestation  
**Last Updated:** February 9, 2026

---

## Overview & Goals

`@mcv/web3-public` is the **consumer-facing Web3 layer** for the MCV ecosystem — the front door to blockchain capabilities that end users, wallets, and third-party dApps interact with directly. Unlike `@mcv/web3-core` (internal infrastructure), this package is designed for **public consumption** with polished APIs, comprehensive documentation, and production-grade UX.

### Primary Goals

1. **Wallet SDK** — Universal, provider-agnostic wallet connection supporting self-custodial (Phantom, Solflare, MetaMask), protocol (WalletConnect v2), embedded (Privy), and custodial (KMS) wallets across Solana and EVM chains
2. **NFT Operations** — Full-lifecycle NFT management: collections, minting (standard + compressed), marketplace listing/buying, gating, memberships, and rarity computation via Metaplex standards
3. **Oracle Price Feeds** — Real-time, multi-source price aggregation from Pyth and Switchboard with staleness detection, VRF randomness, and sports data feeds for BetEdge
4. **Attestation & Identity** — On-chain attestation services for KYC verification, verifiable credentials (W3C), reputation scoring, and selective disclosure via EAS integration
5. **Publishable Quality** — As a PUBLISHABLE module, every API surface, error message, React hook, and UI component must meet open-source quality standards

### Design Principles

- **Provider-agnostic** — Wallet Adapter pattern abstracts all wallet providers behind a unified interface
- **Solana-first, chain-aware** — Primary on Solana with cross-chain architecture for EVM compatibility
- **Offline-first resilience** — Off-chain indexing mirrors on-chain state for fast reads; blockchain is source of truth
- **Progressive disclosure** — Simple `useWallet()` hook for basic usage; full adapter registry for power users
- **Security-by-default** — Nonce-based signature verification, session TTL, RLS on all tables, no private key exposure

---

## Prerequisites

### Infrastructure

| Dependency | Purpose | Version |
|---|---|---|
| Solana Devnet/Testnet | Development & testing environment | Latest |
| Solana Mainnet-Beta | Production deployment | Latest |
| Helius / Triton / QuickNode | RPC provider (rate-limited, reliable) | — |
| PostgreSQL (Supabase) | Off-chain data store with RLS | 15+ |
| Redis | Price feed cache, session cache, rate limiting | 7+ |
| Arweave / Shadow Drive | NFT metadata + media permanent storage | — |

### MCV Dependencies

| Package | Required For | Status |
|---|---|---|
| `@mcv/web3-core` | Internal wallet/token infra, SPL token operations, Solana program utilities | Must exist |
| `@mcv/identity` | Wallet-to-user linking, auth context, user resolution | Must exist |
| `@mcv/fabric` | Event bus (price.updated, nft.minted, attestation.issued), media storage | Must exist |
| `@mcv/ui` | WalletConnectButton, NFTCard, PriceTicker base components, theming | Must exist |
| `@mcv/db` | Drizzle ORM, migration runner, connection pooling | Must exist |

### External SDKs

| Package | Version | Purpose |
|---|---|---|
| `@solana/web3.js` | ^2.x | RPC interactions, transaction building, keypair management |
| `@coral-xyz/anchor` | ^0.30+ | Program-derived accounts, IDL parsing, instruction building |
| `@metaplex-foundation/js` | ^0.20+ | NFT standards, metadata, Merkle tree (cNFTs), candy machine |
| `@pythnetwork/pyth-solana-receiver` | Latest | Pyth price feed consumption |
| `@switchboard-xyz/solana.js` | Latest | Switchboard feeds, VRF randomness |
| `@ethereum-attestation-service/eas-sdk` | Latest | EAS schema registration, attestation, verification |
| `@solana/wallet-adapter-*` | Latest | Reference adapters for Phantom, Solflare, etc. |
| `@privy-io/react-auth` | Latest | Embedded wallet via email/social login |

### Environment & Tooling

- **Solana CLI** (`solana-keygen`, `solana-test-validator`) for local development
- **Anchor CLI** for program builds and testing
- **Metaplex Sugar CLI** for collection deployment tooling
- **Node.js** 20+ with ESM support
- **Zod** for runtime validation of all inputs/outputs
- **Vitest** for unit testing; Bankrun for Solana program simulation

---

## Phase 1 — Foundation (Weeks 1–4)

> **Goal:** Wallet SDK operational on Solana devnet. Basic NFT minting works end-to-end. Database schema deployed.

### 1.1 Database Schema & Migration (Week 1)

- [ ] Define all 20 tables across 4 submodules using Drizzle ORM schema definitions
  - wallet-sdk: `user_wallet`, `wallet_session`, `wallet_transaction`, `wallet_nonce` (4 tables)
  - nfts: `nft_collection`, `nft`, `nft_transfer`, `mint_request`, `nft_gate`, `nft_membership` (6 tables)
  - oracles: `oracle_feed`, `oracle_update`, `randomness_request`, `sports_event` (4 tables)
  - attestation: `attestation_schema`, `attestation`, `verification_request`, `attestation_check`, `reputation_score`, `verifiable_credential` (6 tables)
- [ ] Define enums: `chainEnum`, `walletProviderEnum`, `nftStandardEnum`, `collectionStatusEnum`, `oracleTypeEnum`, `feedStatusEnum`, `attestationTypeEnum`, `attestationStatusEnum`
- [ ] Configure all indexes, unique constraints, and foreign key relationships
- [ ] Set up Supabase RLS policies for multi-tenant isolation (`venture_id` scoping)
- [ ] Generate and test migrations; verify rollback capability
- [ ] Seed devnet reference data (supported chains, default oracle feeds)

### 1.2 Wallet SDK — Core Connection (Weeks 1–2)

- [ ] Implement `WalletAdapter` interface — the universal contract all adapters conform to
- [ ] Build `PhantomAdapter` — browser extension detection, connect/disconnect, signMessage, signTransaction
- [ ] Build `SolflareAdapter` — same interface, Solflare-specific detection and connection logic
- [ ] Implement `createWalletAdapterRegistry()` factory — auto-detect installed extensions, manage adapter lifecycle
- [ ] Implement `getAvailableAdapters()` — scan `window.solana`, `window.phantom`, `window.solflare` for installed wallets
- [ ] Build nonce generation and verification flow:
  - `generateNonce()` — create cryptographic nonce, store in `wallet_nonce` with 5-minute TTL
  - `verifyAndLink()` — verify `nacl.sign.detached.verify()` for Solana signatures, link wallet to user via `@mcv/identity`
- [ ] Implement session management: create sessions on verify, enforce TTL (default 24h), refresh on activity
- [ ] Wire `walletService` as the primary service class — connect, verify, list, link, unlink, setPrimary

### 1.3 Wallet SDK — React Integration (Weeks 2–3)

- [ ] Build `WalletProvider` context — wraps app with adapter registry, connection state, active session
- [ ] Implement `useWallet()` hook — `{ connected, publicKey, connect, disconnect, signMessage, signTransaction }`
- [ ] Implement `useWalletConnection()` hook — connection status, provider detection, error handling
- [ ] Build `WalletConnectButton` component — single-wallet quick connect with auto-detection
- [ ] Build `WalletMultiButton` component — dropdown showing all detected wallets with install links
- [ ] Build `WalletModal` component — full modal with wallet selection, connection progress, error states
- [ ] Build `AddressDisplay` component — truncated address with copy, ENS/SNS resolution, Jazzicon avatar
- [ ] Build `WalletAvatar` component — generative avatar from public key
- [ ] Implement `useWalletBalances()` hook — SOL balance + SPL token balances via RPC
- [ ] Implement `useSolanaBalance()` and `useTokenBalance()` hooks — targeted single-asset balance queries

### 1.4 Basic NFT Minting (Weeks 3–4)

- [ ] Implement `nftService` core — CRUD operations for NFT records in the off-chain database
- [ ] Implement `collectionService` — create collection metadata, deploy on-chain collection NFT via Metaplex
- [ ] Implement `mintingService.mintStandard()` — mint a single Metaplex standard NFT:
  - Upload metadata JSON to Arweave/Shadow Drive
  - Build Metaplex `createNft()` transaction
  - Sign via wallet adapter, submit, confirm, index in DB
- [ ] Build `NFTMintButton` component — one-click mint with progress states (preparing → signing → confirming → done)
- [ ] Build `MintProgress` component — visual transaction lifecycle indicator
- [ ] Build `NFTCard` component — display NFT image, name, collection, attributes
- [ ] Implement `useNFTMint()` hook — mint state machine, error handling, retry logic
- [ ] Implement `useOwnedNFTs()` hook — fetch NFTs owned by connected wallet via Metaplex SDK
- [ ] Write Solana program integration tests using Bankrun (local validator simulation)

### Phase 1 Deliverables

- ✅ All 20 database tables created with RLS policies
- ✅ Phantom + Solflare wallet connection working on Solana devnet
- ✅ Nonce-based signature verification and session management
- ✅ React hooks and components for wallet connection
- ✅ Single NFT minting via Metaplex on devnet
- ✅ NFTCard and MintProgress UI components
- ✅ Unit tests for wallet service, adapter registry, NFT service

---

## Phase 2 — Core Features (Weeks 5–10)

> **Goal:** NFT marketplace operational. Attestation framework issuing KYC attestations. Oracle price feeds live. Collection management complete.

### 2.1 NFT Marketplace (Weeks 5–6)

- [ ] Implement `marketplaceService.listForSale()` — create listing with price, royalty enforcement, expiration
- [ ] Implement `marketplaceService.buyNFT()` — execute purchase: transfer SOL → transfer NFT → record sale → emit event
- [ ] Implement `marketplaceService.cancelListing()` — delist NFT, return to owner
- [ ] Implement `marketplaceService.makeOffer()` — bid on unlisted NFTs with escrow
- [ ] Build royalty enforcement layer — verify creator royalties on every sale (Metaplex royalty standard)
- [ ] Implement `NFTTransferDialog` component — transfer NFT to another address with confirmation
- [ ] Build `useNFTMarketplace()` hook — listing state, purchase flow, offer management
- [ ] Index all marketplace transactions in `nft_transfer` table with type (sale, transfer, burn)
- [ ] Emit `@mcv/fabric` events: `nft.listed`, `nft.sold`, `nft.transferred`, `nft.offer.created`

### 2.2 Collection Management (Weeks 6–7)

- [ ] Implement full collection lifecycle: `draft → deploying → active → paused → completed`
- [ ] Build mint phase management — allowlist, public mint, with configurable start/end times and prices
- [ ] Implement supply tracking — max supply, minted count, remaining, per-wallet limits
- [ ] Implement `rarityCalculator` — trait frequency analysis, rarity score computation across collection
- [ ] Build `CollectionBanner` component — collection header with image, stats, mint button
- [ ] Build `NFTGallery` component — paginated grid of collection NFTs with filtering and sorting
- [ ] Build `NFTAttributeGrid` component — display NFT traits with rarity percentages
- [ ] Implement `useNFTCollection()` hook — collection data, stats, mint phase info
- [ ] Implement `useNFTGallery()` hook — paginated NFT browsing with cursor-based pagination

### 2.3 Attestation Framework (Weeks 7–8)

- [ ] Implement `attestationService` core — CRUD for attestation schemas and attestation records
- [ ] Implement `verificationService` — integrate with KYC providers (SumSub, Veriff):
  - `startVerification()` — initiate KYC flow, create `verification_request` record
  - Webhook handler for provider callbacks (approved/rejected/needs-review)
  - `getVerificationStatus()` — check current verification state
- [ ] Implement `attestationService.issueAttestation()` — create on-chain attestation record:
  - Build EAS attestation transaction
  - Store attestation hash and reference in `attestations` table
  - Support attestation types: `kyc`, `age`, `jurisdiction`, `accreditation`, `membership`
- [ ] Implement `attestationService.revokeAttestation()` — revoke on-chain attestation with reason
- [ ] Implement `attestationService.verifyAttestation()` — check attestation validity (not revoked, not expired)
- [ ] Build `KYCFlow` component — multi-step KYC widget (document upload → selfie → processing → result)
- [ ] Build `VerificationWidget` component — embeddable verification status with retry
- [ ] Build `AttestationBadge` component — visual indicator of attestation status (verified/pending/expired)
- [ ] Implement `useAttestation()` hook — attestation status for current user
- [ ] Implement `useVerification()` hook — KYC flow state machine
- [ ] Implement `useAttestationGate()` hook — gate content/features behind attestation requirements

### 2.4 Oracle Price Feeds (Weeks 8–10)

- [ ] Implement `oracleService` core — CRUD for oracle feed definitions
- [ ] Integrate Pyth SDK — subscribe to Pyth price feeds on Solana:
  - Parse Pyth price accounts for price, confidence interval, exponent
  - Map Pyth feed IDs to human-readable pairs (SOL/USD, BTC/USD, ETH/USD)
- [ ] Integrate Switchboard SDK — consume Switchboard aggregator feeds:
  - Parse aggregator accounts for latest result, min/max, standard deviation
  - Support custom Switchboard feeds for MCV-specific data
- [ ] Implement `priceAggregator` — multi-source aggregation:
  - Fetch from Pyth + Switchboard simultaneously
  - Aggregation methods: median, mean, weighted (by confidence)
  - Outlier detection and rejection
- [ ] Implement `stalenessDetector` — monitor feed freshness:
  - Compare last update timestamp against threshold (configurable per feed, default 60s)
  - Emit warnings on stale feeds, halt on critically stale
  - `StalenessReport` with per-feed health status
- [ ] Implement Redis caching layer — cache latest prices with TTL (30s default), serve from cache for hot reads
- [ ] Implement WebSocket streaming — real-time price updates pushed to subscribed clients
- [ ] Build `PriceTicker` component — live-updating price display with trend arrow and sparkline
- [ ] Build `PriceChart` component — historical price chart (1H/4H/1D/1W/1M) using candle data
- [ ] Build `OracleStatusBadge` component — feed health indicator (live/delayed/stale/offline)
- [ ] Implement `usePriceFeed()` hook — subscribe to a price feed with auto-refresh
- [ ] Implement `usePriceHistory()` hook — fetch historical candle data for charting
- [ ] Implement `useOracleHealth()` hook — monitor all feed statuses
- [ ] Emit `@mcv/fabric` events: `price.updated`, `oracle.stale`, `oracle.recovered`

### 2.5 Sports Oracle Integration (Week 10)

- [ ] Implement `sportsOracleService` — sports data feeds for BetEdge:
  - Fetch game schedules, live scores, final results from sports data providers
  - Store in `sports_event` table with status lifecycle (scheduled → live → final → settled)
  - Support major leagues: NFL, NBA, MLB, NHL, MLS, Premier League, UFC
- [ ] Build `useSportsEvents()` hook — upcoming and live events for a sport/league
- [ ] Build `useLiveSportsEvent()` hook — real-time score updates for a single event
- [ ] Implement result verification — multi-source consensus for final results before settlement

### Phase 2 Deliverables

- ✅ NFT marketplace: list, buy, transfer, royalties enforced
- ✅ Collection management with mint phases and rarity calculation
- ✅ KYC attestation flow end-to-end (provider → on-chain attestation)
- ✅ Attestation gating for features/content
- ✅ Pyth + Switchboard price feeds with aggregation and staleness detection
- ✅ Sports oracle feeds for BetEdge
- ✅ All React hooks and UI components for Phase 2 features
- ✅ Redis caching for price feeds
- ✅ Integration tests for marketplace, attestation, oracle flows

---

## Phase 3 — Advanced Features (Weeks 11–16)

> **Goal:** Cross-chain support, compressed NFTs, verifiable credentials, AI-generated NFTs, VRF randomness, DeFi consumer features, NFT staking.

### 3.1 Cross-Chain Wallet Support (Weeks 11–12)

- [ ] Build `MetaMaskAdapter` — EVM wallet connection via `window.ethereum`
- [ ] Build `CoinbaseWalletAdapter` — Coinbase Wallet SDK integration
- [ ] Build `WalletConnectAdapter` — WalletConnect v2 protocol for multi-chain bridging
- [ ] Build `PrivyAdapter` — embedded wallet creation via email/social login (no extension needed)
- [ ] Build `KMSWalletAdapter` — server-side custodial wallet via AWS KMS / GCP Cloud HSM
- [ ] Implement `getRecommendedAdapter()` — context-aware adapter selection (mobile → deep link, desktop → extension)
- [ ] Build `NetworkSelector` component — chain switching UI for multi-chain users
- [ ] Implement `useMultiWallet()` hook — manage wallets across multiple chains simultaneously
- [ ] EVM signature verification — `ecrecover` for Ethereum-style message signing
- [ ] Cross-chain portfolio aggregation — unified balance view across Solana + EVM chains

### 3.2 Compressed NFTs (Weeks 12–13)

- [ ] Implement `mintingService.mintCompressed()` — compressed NFT (cNFT) minting via Metaplex Bubblegum:
  - Create/reuse Merkle tree accounts
  - Batch mint up to `MAX_COMPRESSED_MINT_BATCH` (1000) cNFTs per transaction
  - ~100x cost reduction vs standard NFTs
- [ ] Implement Merkle proof retrieval — fetch proofs from Helius DAS API for cNFT transfers
- [ ] Implement cNFT transfer — transfer compressed NFTs using Merkle proofs
- [ ] Build batch minting UI — progress bar for large collection mints (10k+ items)
- [ ] Index compressed NFTs in off-chain DB with proof references

### 3.3 Verifiable Credentials (Weeks 13–14)

- [ ] Implement `credentialService` — W3C Verifiable Credentials issuance:
  - `issueCredential()` — create VC with JSON-LD context, proof, and subject claims
  - `verifyCredential()` — validate VC signature, check revocation status, verify issuer
  - `revokeCredential()` — add to on-chain revocation registry
- [ ] Implement `SelectiveDisclosure` — allow holders to reveal only specific claims:
  - Zero-knowledge proof generation for age > 18 without revealing birthday
  - Selective attribute disclosure for KYC (country without address)
- [ ] Implement `easService` — direct EAS (Ethereum Attestation Service) integration:
  - Schema registration on EAS
  - Cross-chain attestation publishing (Solana attestation → EAS mirror on Base/Ethereum)
  - On-chain attestation verification
- [ ] Implement `reputationService` — compute on-chain reputation scores:
  - Weighted factors: attestation count, credential age, transaction history, community activity
  - `calculateScore()` — deterministic score computation
  - `getReputationFactors()` — breakdown of score components
- [ ] Build `ReputationScore` component — visual reputation display with factor breakdown
- [ ] Implement `useReputation()` hook — fetch and subscribe to reputation score updates

### 3.4 AI-Generated NFTs (Week 14)

- [ ] Integrate with `@mcv/ai` for AI image generation pipeline:
  - User provides text prompt → AI generates image → preview → mint as NFT
  - Style transfer: apply artistic styles to user-uploaded images
- [ ] Build AI mint flow — prompt input → generation → preview → metadata creation → on-chain mint
- [ ] Implement generation history — track AI prompts and outputs for provenance
- [ ] Store AI provenance metadata in NFT attributes (model, prompt hash, generation params)

### 3.5 VRF Randomness (Week 15)

- [ ] Implement `randomnessService` — verifiable random function via Switchboard VRF:
  - `requestRandomness()` — submit VRF request on-chain, track in `randomness_request` table
  - `awaitResult()` — poll/subscribe for VRF callback with result
  - `verifyRandomness()` — verify VRF proof on-chain
- [ ] Use cases: fair NFT trait assignment, raffle winners, random rewards
- [ ] Implement callback handling — process VRF results and emit events

### 3.6 DeFi Consumer Features (Week 15)

- [ ] Implement `TransactionConfirmDialog` component — detailed transaction preview:
  - Show estimated gas/priority fee
  - Display token approvals and amount changes
  - Simulation result (success/failure) before signing
- [ ] Implement `TransactionHistory` component — full transaction history with filtering:
  - Filter by type (transfer, swap, mint, stake)
  - Show status (pending → confirmed → finalized)
  - Link to Solana Explorer / Etherscan
- [ ] Implement `useWalletTransactions()` hook — paginated transaction history
- [ ] Build token swap integration — route through Jupiter (Solana) for in-app token swaps

### 3.7 NFT Staking & Memberships (Week 16)

- [ ] Implement NFT staking logic — lock NFTs for rewards:
  - Stake an NFT → record in `nft_membership` table
  - Calculate time-weighted rewards
  - Unstake with cooldown period
- [ ] Implement `useNFTGate()` hook — gate content/features behind NFT ownership:
  - Check if connected wallet holds required NFT(s)
  - Support collection-level and attribute-level gating
  - Support staked NFT gating (must be staked, not just owned)
- [ ] Implement membership tiers — NFT-based membership levels:
  - Bronze / Silver / Gold / Platinum based on collection or staking duration
  - Tier-specific benefits and access control
- [ ] Build membership dashboard components

### Phase 3 Deliverables

- ✅ EVM wallet support (MetaMask, Coinbase, WalletConnect)
- ✅ Embedded wallets via Privy (email/social login)
- ✅ Custodial KMS wallets for server-side signing
- ✅ Compressed NFT minting (100x cost reduction)
- ✅ W3C Verifiable Credentials with selective disclosure
- ✅ EAS integration for cross-chain attestations
- ✅ On-chain reputation scoring
- ✅ AI-generated NFT pipeline
- ✅ VRF randomness via Switchboard
- ✅ Transaction confirmation dialog with simulation
- ✅ NFT staking and membership tiers
- ✅ Cross-chain portfolio view

---

## Phase 4 — Polish & Production Readiness (Weeks 17–20)

> **Goal:** Gas optimization, UX polish, security audit, documentation, and production deployment.

### 4.1 Gas & Performance Optimization (Weeks 17–18)

- [ ] Implement priority fee estimation — dynamic compute unit pricing based on network congestion
- [ ] Implement transaction batching — combine multiple instructions into single transactions where possible
- [ ] Optimize RPC usage — minimize RPC calls via account caching and subscription-based updates
- [ ] Implement preflight simulation — simulate all transactions before signing to catch errors early
- [ ] Add Jito bundle support — MEV-protected transaction submission for sensitive operations
- [ ] Redis cache tuning — optimize TTLs for price feeds (30s), balances (10s), NFT metadata (5m)
- [ ] Implement connection pooling for RPC — rotate across multiple RPC providers for reliability
- [ ] Database query optimization — analyze slow queries, add missing indexes, optimize join patterns
- [ ] Compress WebSocket payloads — minimize bandwidth for real-time price streaming

### 4.2 UX Polish (Weeks 18–19)

- [ ] Implement comprehensive error handling with user-friendly messages:
  - "Insufficient SOL for transaction" (not "Error: 0x1")
  - "Wallet disconnected — please reconnect" (not "TypeError: null")
  - "Transaction failed — network congested, retry in 30s" (not "TransactionExpiredBlockheightExceededError")
- [ ] Add loading skeletons for all components (wallet balance, NFT gallery, price ticker)
- [ ] Implement optimistic UI updates — show pending state immediately, reconcile on confirmation
- [ ] Add haptic feedback patterns for mobile wallet interactions
- [ ] Implement retry logic with exponential backoff for all blockchain operations
- [ ] Add transaction toast notifications — persistent toasts tracking tx lifecycle
- [ ] Mobile-responsive wallet modal — bottom sheet on mobile, modal on desktop
- [ ] Accessibility audit — ARIA labels, keyboard navigation, screen reader support for all components
- [ ] Dark/light theme support across all components via `@mcv/ui` theming

### 4.3 Security Audit (Weeks 19–20)

- [ ] **Signature verification hardening:**
  - Prevent replay attacks — enforce nonce single-use and expiration
  - Validate message format — ensure signed message contains expected nonce structure
  - Rate-limit nonce generation per IP and address
- [ ] **Session security:**
  - Bind sessions to device fingerprint
  - Implement session invalidation on wallet account change
  - Enforce maximum concurrent sessions per user
- [ ] **Transaction security:**
  - Validate all transaction parameters server-side before signing
  - Prevent transaction modification after user preview (TOCTOU protection)
  - Implement spending limits for custodial wallets
- [ ] **Smart contract review:**
  - Audit all Solana program interactions for PDA seed collisions
  - Verify program ownership checks on all instructions
  - Test for rent exemption edge cases
- [ ] **RLS policy audit:**
  - Verify all tables enforce `venture_id` scoping
  - Test cross-tenant data isolation
  - Audit admin bypass paths
- [ ] **Dependency audit:**
  - Scan all npm dependencies for known vulnerabilities
  - Verify wallet adapter packages are from official sources
  - Pin critical dependency versions
- [ ] **Oracle security:**
  - Validate price feed staleness before any business logic consumption
  - Implement circuit breakers for extreme price movements (>20% in 1 minute)
  - Multi-source consensus requirement for settlement-critical prices

### 4.4 Documentation & Publishing (Week 20)

- [ ] Write comprehensive API reference for all exported services, hooks, and components
- [ ] Create getting-started guide with Solana devnet wallet setup
- [ ] Write integration guides per venture:
  - BetEdge: wallet → attestation → oracle → betting flow
  - MCV Studios: wallet → collection → mint → marketplace flow
  - Futurestate: wallet → oracle → tokenization flow
  - Full Gain: wallet → attestation → grants flow
- [ ] Document all React hooks with usage examples and TypeScript signatures
- [ ] Create Storybook stories for all UI components
- [ ] Write migration guide for ventures upgrading from direct Solana SDK usage
- [ ] Publish package to npm with proper `exports` field, tree-shaking support, and type declarations

### Phase 4 Deliverables

- ✅ Priority fee estimation and transaction optimization
- ✅ Comprehensive error handling with human-readable messages
- ✅ Loading states, skeletons, and optimistic updates
- ✅ Security audit completed with all findings remediated
- ✅ RLS policies verified for multi-tenant isolation
- ✅ Full API documentation and integration guides
- ✅ Storybook component library
- ✅ Published to npm as `@mcv/web3-public`

---

## Testing Strategy

### Unit Tests (Vitest)

| Area | Coverage Target | Key Tests |
|---|---|---|
| Wallet Adapter Registry | 95% | Adapter detection, registration, priority sorting |
| Nonce Generation/Verification | 100% | Nonce creation, expiration, single-use enforcement, signature verify |
| NFT Service | 90% | Collection CRUD, metadata validation, supply tracking |
| Marketplace Service | 90% | Listing, buying, royalty calculation, escrow logic |
| Price Aggregator | 95% | Median/mean/weighted aggregation, outlier rejection |
| Staleness Detector | 95% | Threshold detection, feed health classification |
| Attestation Service | 90% | Schema creation, attestation lifecycle, revocation |
| Reputation Calculator | 95% | Score computation, factor weighting, determinism |
| Credential Service | 90% | VC issuance, verification, selective disclosure |
| Zod Validators | 100% | All input schemas, edge cases, error messages |

### Integration Tests

| Flow | Description |
|---|---|
| Wallet Connect → Verify → Session | Full wallet connection lifecycle on devnet |
| Wallet → Mint NFT → Verify Ownership | Mint standard NFT and confirm on-chain ownership |
| Wallet → Compressed Mint → Transfer | Mint cNFT, retrieve proof, transfer to another wallet |
| Collection Deploy → Mint Phase → Public Mint | Full collection lifecycle with phase transitions |
| NFT List → Buy → Royalty Split | Marketplace sale with royalty enforcement verification |
| KYC Start → Provider Callback → Attestation Issue | Full KYC attestation flow with mocked provider |
| Attestation Gate → Access Check | Gate a feature behind attestation, verify access control |
| Pyth Feed → Aggregate → Cache → Query | Price feed pipeline from source to cached response |
| VRF Request → Callback → Result | Verifiable randomness request and result verification |

### Solana Program Tests (Bankrun)

| Test Suite | Description |
|---|---|
| NFT Minting Programs | Metaplex instruction building, PDA derivation, metadata creation |
| Compressed NFT Trees | Merkle tree creation, leaf append, proof verification |
| Token Operations | SPL token transfers, associated token accounts, approval/revocation |
| Transaction Simulation | Preflight checks, compute unit estimation, error decoding |
| Multi-Instruction Transactions | Batch operations, atomic execution, partial failure handling |

### E2E Tests (Playwright)

| Scenario | Description |
|---|---|
| Wallet Modal Flow | Open modal → select wallet → mock connect → verify UI state |
| NFT Gallery Browse | Load collection → paginate → filter by trait → sort by rarity |
| Mint Flow | Connect wallet → select NFT → click mint → confirm → success state |
| Price Ticker | Load feed → verify live updates → check staleness indicator |
| KYC Widget | Start verification → upload docs → mock callback → badge update |

### Test Infrastructure

- **Solana Local Validator** — `solana-test-validator` for integration tests requiring on-chain state
- **Bankrun** — lightweight Solana program simulation for fast unit-like program tests
- **Mock Wallet Adapter** — test adapter implementing `WalletAdapter` interface with deterministic behavior
- **Helius DAS Mock** — mock Digital Asset Standard API responses for cNFT proof testing
- **Provider Webhook Simulator** — mock SumSub/Veriff webhook callbacks for attestation testing

---

## Acceptance Criteria

### Wallet SDK

- [ ] Users can connect Phantom and Solflare wallets on Solana devnet and mainnet
- [ ] Nonce-based signature verification completes in < 2 seconds
- [ ] Sessions persist across page refreshes with automatic reconnection
- [ ] Multi-wallet support: user can link wallets from multiple chains
- [ ] Custodial wallet creation and transaction signing works via KMS
- [ ] All wallet adapters implement the full `WalletAdapter` interface
- [ ] Mobile deep link flow works for Phantom Mobile
- [ ] `useWallet()` hook provides reactive connection state

### NFTs

- [ ] Standard NFT minting succeeds on Solana devnet with metadata uploaded to Arweave
- [ ] Compressed NFT batch minting supports 1000+ items per batch
- [ ] Collection deployment with configurable mint phases (allowlist + public)
- [ ] Marketplace listing, buying, and delisting works with royalty enforcement
- [ ] Rarity scores calculated accurately across collection traits
- [ ] NFT gating correctly restricts access based on ownership
- [ ] NFT transfer and burn operations complete successfully

### Oracles

- [ ] Pyth price feeds return accurate SOL/USD prices within 1 second of on-chain update
- [ ] Switchboard feeds consumed and aggregated with Pyth data
- [ ] Staleness detection triggers alerts when feeds exceed threshold
- [ ] Redis cache serves price data with < 10ms latency for cached hits
- [ ] WebSocket streaming delivers price updates to subscribed clients in real-time
- [ ] VRF randomness requests complete with verifiable proof
- [ ] Sports oracle feeds deliver accurate game data for BetEdge

### Attestation

- [ ] KYC verification flow integrates with SumSub/Veriff end-to-end
- [ ] On-chain attestation issued within 30 seconds of provider approval
- [ ] Attestation revocation takes effect immediately
- [ ] Attestation gating correctly blocks unverified users
- [ ] Verifiable Credentials conform to W3C VC Data Model
- [ ] Reputation scores are deterministic and reproducible
- [ ] Selective disclosure reveals only requested claims

### Cross-Cutting

- [ ] All API inputs validated with Zod schemas; invalid inputs return structured errors
- [ ] All database tables enforce RLS with `venture_id` scoping
- [ ] Zero private keys stored in database or logs
- [ ] All React components support dark/light themes
- [ ] All components accessible via keyboard and screen reader
- [ ] Package exports tree-shakeable with proper `exports` map
- [ ] TypeScript types exported for all public APIs

---

## Risk Assessment

### Blockchain Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Solana network congestion / downtime | High | Medium | Multi-RPC failover (Helius → Triton → QuickNode), retry with backoff, queue transactions during outages |
| RPC provider rate limiting | Medium | High | Connection pooling, request batching, Redis caching, multiple provider rotation |
| Transaction confirmation delays | Medium | Medium | Configurable commitment levels (processed → confirmed → finalized), optimistic UI updates |
| Program upgrade breaking changes | High | Low | Pin Metaplex/Anchor versions, integration test suite catches regressions, canary deployment |
| Rent exemption changes | Low | Low | Pre-calculate rent, maintain lamport buffer, alert on low balances |

### Regulatory Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| KYC/AML compliance requirements vary by jurisdiction | High | High | Pluggable verification providers, jurisdiction-specific attestation schemas, legal review per venture |
| NFT classification as securities | High | Medium | Avoid utility/revenue promises in metadata, legal review of collection mechanics, comply with Howey test |
| Data privacy (GDPR/CCPA) for wallet-linked PII | High | Medium | Selective disclosure in credentials, minimal PII storage, right-to-erasure support in attestation system |
| Cryptocurrency transmission regulations | Medium | Medium | Clarify MCV's role as technology provider vs money transmitter, legal opinion per jurisdiction |

### Smart Contract Security

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Wallet signature replay attacks | Critical | Low | Single-use nonces with TTL, message format validation, nonce database tracking |
| PDA seed collision | High | Low | Unique seed derivation per venture/user, comprehensive seed space analysis |
| Front-running on NFT marketplace | Medium | Medium | Jito bundles for MEV protection, private transaction submission, commit-reveal schemes |
| Oracle price manipulation | Critical | Low | Multi-source aggregation, outlier rejection, circuit breakers on extreme movements, minimum source requirements |
| Custodial wallet key compromise | Critical | Very Low | AWS KMS / Cloud HSM (keys never leave hardware), IAM access controls, key rotation policy, audit logging |

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Metaplex SDK breaking changes | Medium | Medium | Pin version, wrap SDK calls behind internal abstraction layer, integration tests |
| Wallet adapter ecosystem fragmentation | Medium | Medium | Universal adapter interface abstracts providers, new adapters added without core changes |
| Compressed NFT proof size growth | Low | Medium | Use Helius DAS API for proof retrieval (offloads computation), implement proof caching |
| Real-time price feed WebSocket scalability | Medium | Medium | Redis pub/sub fan-out, horizontal scaling, connection limits per client |

---

## Estimated Timeline

| Phase | Duration | Milestone | Key Outcomes |
|---|---|---|---|
| **Phase 1 — Foundation** | Weeks 1–4 | M1: Wallet + Mint | Database deployed, wallet SDK on devnet, basic NFT minting |
| **Phase 2 — Core** | Weeks 5–10 | M2: Marketplace + Oracles | NFT marketplace, attestation framework, oracle price feeds |
| **Phase 3 — Advanced** | Weeks 11–16 | M3: Cross-Chain + Credentials | EVM wallets, cNFTs, verifiable credentials, VRF, staking |
| **Phase 4 — Polish** | Weeks 17–20 | M4: Production Ready | Security audit, gas optimization, UX polish, documentation |

### Milestone Checkpoints

**M1 (Week 4):** Demo wallet connection → NFT mint on Solana devnet. All database tables deployed. Phantom + Solflare adapters working. React hooks and wallet UI components functional.

**M2 (Week 10):** Demo full user journey: connect wallet → complete KYC → receive attestation → mint NFT from gated collection → list on marketplace → view SOL price feed. All four submodules operational on devnet.

**M3 (Week 16):** Demo cross-chain: connect MetaMask + Phantom → view unified portfolio → mint compressed NFT collection (1000 items) → issue verifiable credential → request VRF randomness. AI-generated NFT flow working.

**M4 (Week 20):** Security audit complete, all findings remediated. Performance benchmarks met (< 2s wallet connect, < 10ms cached price query, < 30s attestation issuance). Package published to npm. Documentation complete. Production deployment on Solana mainnet-beta.

### Dependencies & Critical Path

```
Week 1-2: Schema + Wallet SDK ──────────────────────────────────────────────────┐
Week 2-4: NFT Minting (depends on wallet) ──────────────────────────────────────┤
Week 5-7: Marketplace + Collections (depends on NFT minting) ──────────────────┤
Week 7-8: Attestation Framework (depends on wallet, independent of NFTs) ──────┤
Week 8-10: Oracle Feeds (independent, parallel with attestation) ──────────────┤
Week 11-12: Cross-Chain Wallets (depends on wallet SDK foundation) ────────────┤
Week 12-13: Compressed NFTs (depends on NFT service, parallel with wallets) ──┤
Week 13-16: VCs, VRF, Staking (depends on attestation + oracle) ──────────────┤
Week 17-20: Polish + Security (depends on all features complete) ──────────────┘
```

**Critical path:** Schema → Wallet SDK → NFT Minting → Marketplace → Polish

**Parallelizable:** Oracles (independent after schema), Attestation (independent after wallet SDK), Cross-chain wallets (independent after wallet SDK foundation)

---

*@mcv/web3-public — Web3 Public Domain*
