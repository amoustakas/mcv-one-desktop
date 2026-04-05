# @mcv/web3-public — Web3 Public Domain Module

**Parent Package:** @mcv/web3-public  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Purpose

The `web3-public` module provides the **consumer-facing Web3 infrastructure** for all ventures operating within the MCV ecosystem. It implements multi-wallet connection and management through a universal Wallet SDK, full-lifecycle NFT operations (minting, collections, marketplace, compressed NFTs), real-time oracle price feeds and data verification via Pyth and Switchboard, and on-chain attestation services for identity verification, credentials, and reputation.

**This is the public interface to Web3 — the layer that end-users, wallets, and third-party dApps interact with directly.**

Every Web3 interaction a user has with an MCV venture — whether connecting a Phantom wallet on BetEdge to place a bet, minting an NFT collection through MCV Studios, checking a SOL/USD price feed for Futurestate real estate tokenization, or verifying KYC attestation for Full Gain grant eligibility — flows through this package. As a PUBLISHABLE module, the API surface, developer experience, and UX polish are paramount. This is the front door to MCV's blockchain capabilities.

The module is blockchain-primary on **Solana** with cross-chain considerations for EVM compatibility (Ethereum, Base, Polygon, Arbitrum). It leverages `@solana/web3.js` for RPC interactions, `@coral-xyz/anchor` for program-derived accounts, `@metaplex-foundation/js` for NFT standards, and the Ethereum Attestation Service (EAS) SDK for cross-chain attestation patterns.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// WALLET-SDK
// ═══════════════════════════════════════════════════════════════════════════════

// Core services
export {
  walletService,                     // Wallet connection, linking, session management
} from './wallet-sdk/service';

export type {
  ConnectWalletInput,                // Initiate wallet connection
  LinkWalletInput,                   // Link additional wallet to existing account
  VerifyWalletInput,                 // Verify wallet ownership via signature
  SendTransactionInput,              // Submit a transaction for signing
} from './wallet-sdk/service';

// Schema exports
export {
  userWallets,                       // Connected wallets table
  walletSessions,                    // Active wallet sessions table
  walletTransactions,                // Transaction index table (off-chain mirror)
  walletNonces,                      // Signature verification nonces
  chainEnum,                         // Supported chains enum
  walletProviderEnum,                // Wallet provider enum
} from './wallet-sdk/schema';

// Adapters
export {
  PhantomAdapter,                    // Phantom wallet adapter (Solana)
  SolflareAdapter,                   // Solflare wallet adapter (Solana)
  BackpackAdapter,                   // Backpack wallet adapter (Solana + xNFT)
  MetaMaskAdapter,                   // MetaMask adapter (EVM)
  CoinbaseWalletAdapter,             // Coinbase Wallet adapter (EVM)
  WalletConnectAdapter,              // WalletConnect v2 adapter (multi-chain)
  PrivyAdapter,                      // Privy embedded wallet adapter
  KMSWalletAdapter,                  // MCV custodial KMS wallet adapter
} from './wallet-sdk/adapters';

export {
  createWalletAdapterRegistry,       // Factory for multi-adapter management
  getAvailableAdapters,              // Detect installed wallet extensions
  getRecommendedAdapter,             // Get best adapter for chain/context
} from './wallet-sdk/adapter-registry';

// ═══════════════════════════════════════════════════════════════════════════════
// NFTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  nftService,                        // NFT lifecycle management
  collectionService,                 // Collection CRUD and deployment
  mintingService,                    // Minting operations and lazy mint
  marketplaceService,                // Listing, buying, marketplace ops
  rarityCalculator,                  // Rarity score computation
} from './nfts/service';

export type {
  CreateCollectionInput,             // Create an NFT collection
  MintNFTInput,                      // Mint an NFT
  ListNFTInput,                      // List an NFT for sale
  TransferNFTInput,                  // Transfer an NFT
  CompressedMintInput,               // Mint a compressed NFT (cNFT)
} from './nfts/service';

export {
  nftCollections,                    // NFT collections table
  nfts,                              // Individual NFTs table
  nftTransfers,                      // Transfer/sale history table
  mintRequests,                      // Lazy mint request queue
  nftGates,                          // NFT gating rules table
  nftMemberships,                    // NFT-based membership records
  nftStandardEnum,                   // NFT standard enum (metaplex, erc721, etc.)
  collectionStatusEnum,              // Collection lifecycle status enum
} from './nfts/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// ORACLES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  oracleService,                     // Oracle feed management
  priceAggregator,                   // Multi-source price aggregation
  stalenessDetector,                 // Feed staleness monitoring
  randomnessService,                 // Verifiable randomness (VRF)
  sportsOracleService,               // Sports data feeds (BetEdge)
} from './oracles/service';

export type {
  CreateOracleFeedInput,             // Create a new oracle feed
  OracleSourceConfig,                // Configure an oracle data source
  PriceQuery,                        // Query price feeds
  RandomnessRequest,                 // Request verifiable randomness
} from './oracles/service';

export {
  oracleFeeds,                       // Oracle feed definitions table
  oracleUpdates,                     // Oracle value history table
  randomnessRequests,                // VRF request queue table
  sportsEvents,                      // Sports event data table
  oracleTypeEnum,                    // Oracle type enum
  feedStatusEnum,                    // Feed status enum
} from './oracles/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// ATTESTATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  attestationService,                // Attestation lifecycle management
  verificationService,               // KYC/identity verification flows
  credentialService,                 // Verifiable credential issuance
  reputationService,                 // On-chain reputation scoring
  easService,                        // Ethereum Attestation Service integration
} from './attestation/service';

export type {
  CreateAttestationInput,            // Issue an attestation
  StartVerificationInput,            // Begin KYC/verification flow
  IssueCredentialInput,              // Issue a verifiable credential
  CheckAttestationInput,             // Verify attestation status
  ReputationScoreInput,              // Calculate reputation score
} from './attestation/service';

export {
  attestationSchemas,                // Attestation schema definitions table
  attestations,                      // Attestation records table
  verificationRequests,              // KYC verification request queue
  attestationChecks,                 // Verification check log table
  reputationScores,                  // Computed reputation scores table
  verifiableCredentials,             // W3C Verifiable Credentials store
  attestationTypeEnum,               // Attestation type enum
  attestationStatusEnum,             // Attestation status enum
} from './attestation/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

// Wallet hooks
export { useWallet } from './client/hooks/use-wallet';
export { useWalletBalances } from './client/hooks/use-wallet-balances';
export { useWalletTransactions } from './client/hooks/use-wallet-transactions';
export { useWalletConnection } from './client/hooks/use-wallet-connection';
export { useMultiWallet } from './client/hooks/use-multi-wallet';
export { useSolanaBalance } from './client/hooks/use-solana-balance';
export { useTokenBalance } from './client/hooks/use-token-balance';

// NFT hooks
export { useNFTCollection } from './client/hooks/use-nft-collection';
export { useNFTMint } from './client/hooks/use-nft-mint';
export { useNFTGallery } from './client/hooks/use-nft-gallery';
export { useNFTGate } from './client/hooks/use-nft-gate';
export { useNFTMarketplace } from './client/hooks/use-nft-marketplace';
export { useOwnedNFTs } from './client/hooks/use-owned-nfts';

// Oracle hooks
export { usePriceFeed } from './client/hooks/use-price-feed';
export { usePriceHistory } from './client/hooks/use-price-history';
export { useSportsEvents } from './client/hooks/use-sports-events';
export { useLiveSportsEvent } from './client/hooks/use-live-sports-event';
export { useOracleHealth } from './client/hooks/use-oracle-health';

// Attestation hooks
export { useAttestation } from './client/hooks/use-attestation';
export { useVerification } from './client/hooks/use-verification';
export { useAttestationGate } from './client/hooks/use-attestation-gate';
export { useReputation } from './client/hooks/use-reputation';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

// Wallet components
export { WalletConnectButton } from './client/components/wallet-connect-button';
export { WalletMultiButton } from './client/components/wallet-multi-button';
export { WalletModal } from './client/components/wallet-modal';
export { WalletProvider } from './client/components/wallet-provider';
export { WalletBalanceDisplay } from './client/components/wallet-balance-display';
export { TransactionHistory } from './client/components/transaction-history';
export { TransactionConfirmDialog } from './client/components/transaction-confirm-dialog';
export { WalletAvatar } from './client/components/wallet-avatar';
export { AddressDisplay } from './client/components/address-display';
export { NetworkSelector } from './client/components/network-selector';

// NFT components
export { NFTCard } from './client/components/nft-card';
export { NFTGallery } from './client/components/nft-gallery';
export { NFTMintButton } from './client/components/nft-mint-button';
export { CollectionBanner } from './client/components/collection-banner';
export { NFTAttributeGrid } from './client/components/nft-attribute-grid';
export { NFTTransferDialog } from './client/components/nft-transfer-dialog';
export { MintProgress } from './client/components/mint-progress';

// Oracle components
export { PriceTicker } from './client/components/price-ticker';
export { PriceChart } from './client/components/price-chart';
export { OracleStatusBadge } from './client/components/oracle-status-badge';

// Attestation components
export { VerificationWidget } from './client/components/verification-widget';
export { AttestationBadge } from './client/components/attestation-badge';
export { KYCFlow } from './client/components/kyc-flow';
export { ReputationScore } from './client/components/reputation-score';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SUPPORTED_CHAINS,
  SUPPORTED_WALLETS,
  SOLANA_NETWORKS,
  NFT_STANDARDS,
  ORACLE_PROVIDERS,
  ATTESTATION_TYPES,
  VERIFICATION_PROVIDERS,
  DEFAULT_ROYALTY_BPS,
  MAX_COMPRESSED_MINT_BATCH,
  PRICE_FEED_STALENESS_THRESHOLD,
  WALLET_SESSION_TTL,
  NONCE_TTL,
  TRANSACTION_CONFIRMATION_COMMITMENT,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Chain types
  Chain,
  SolanaNetwork,
  ChainConfig,

  // Wallet types
  WalletAdapter,
  WalletConnection,
  WalletSession,
  WalletProvider,
  TokenBalance,
  NFTBalance,
  TransactionRequest,
  TransactionResult,
  TransactionStatus,
  WalletCapabilities,

  // NFT types
  NFTStandard,
  CollectionStatus,
  CollectionStats,
  NFTMetadata,
  NFTAttribute,
  NFTRarity,
  TraitRarity,
  MintPhase,
  MintConfig,
  CompressedNFTProof,
  RoyaltyConfig,
  GateRule,
  MembershipTier,

  // Oracle types
  OracleType,
  FeedStatus,
  OracleSource,
  PriceFeed,
  PriceCandle,
  AggregationMethod,
  RandomnessResult,
  SportsResult,
  SportsEventStatus,
  StalenessReport,

  // Attestation types
  AttestationType,
  AttestationStatus,
  VerificationProvider,
  VerificationResult,
  VerificationStatus,
  AttestationProof,
  VerifiableCredential,
  CredentialSubject,
  ReputationScore,
  ReputationFactor,
  SelectiveDisclosure,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/web3-public — WEB3 PUBLIC DOMAIN ARCHITECTURE                      │
│                                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                             ENTRY POINTS                                                    │   │
│  │                                                                                             │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │  React Client    │  │  API Routes      │  │  Webhooks        │  │  NAOS Agents     │   │   │
│  │  │  WalletConnect   │  │  /api/wallet     │  │  Metaplex        │  │  NFT Manager     │   │   │
│  │  │  NFT Gallery     │  │  /api/nft        │  │  KYC Provider    │  │  Oracle Monitor  │   │   │
│  │  │  Price Ticker    │  │  /api/oracle     │  │  Switchboard     │  │  Attestation Bot │   │   │
│  │  │  KYC Widget      │  │  /api/attestation│  │  Sports Feeds    │  │  Wallet Indexer  │   │   │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │   │
│  │           │                     │                      │                     │              │   │
│  │           └─────────────────────┴──────────────────────┴─────────────────────┘              │   │
│  │                                         │                                                   │   │
│  └─────────────────────────────────────────┼───────────────────────────────────────────────────┘   │
│                                            │                                                       │
│  ┌─────────────────────────────────────────▼───────────────────────────────────────────────────┐   │
│  │                             SERVICE LAYER                                                    │   │
│  │                                                                                              │   │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐                                 │   │
│  │  │      WALLET-SDK          │  │         NFTS              │                                 │   │
│  │  │                          │  │                           │                                 │   │
│  │  │ • Multi-wallet connect   │  │ • Collection CRUD         │                                 │   │
│  │  │ • Signature verification │  │ • Metaplex standard mint  │                                 │   │
│  │  │ • Session management     │  │ • Compressed NFTs (cNFTs) │                                 │   │
│  │  │ • Balance aggregation    │  │ • Royalty enforcement      │                                 │   │
│  │  │ • Transaction signing    │  │ • Marketplace listing      │                                 │   │
│  │  │ • Mobile deep links      │  │ • NFT gating/memberships  │                                 │   │
│  │  │ • WalletConnect v2       │  │ • Rarity calculation       │                                 │   │
│  │  │ • Custodial KMS wallets  │  │ • Transfer/burn            │                                 │   │
│  │  └────────────┬─────────────┘  └────────────┬──────────────┘                                 │   │
│  │               │                              │                                               │   │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐                                 │   │
│  │  │       ORACLES            │  │      ATTESTATION          │                                 │   │
│  │  │                          │  │                           │                                 │   │
│  │  │ • Pyth price feeds       │  │ • KYC attestation         │                                 │   │
│  │  │ • Switchboard feeds      │  │ • Age verification        │                                 │   │
│  │  │ • Custom oracle creation │  │ • Jurisdiction check      │                                 │   │
│  │  │ • Multi-source aggregate │  │ • Verifiable credentials  │                                 │   │
│  │  │ • Staleness detection    │  │ • EAS on-chain publish    │                                 │   │
│  │  │ • VRF randomness         │  │ • Reputation scoring      │                                 │   │
│  │  │ • Sports data (BetEdge)  │  │ • Selective disclosure    │                                 │   │
│  │  │ • WebSocket streaming    │  │ • Cross-chain attestation │                                 │   │
│  │  └────────────┬─────────────┘  └────────────┬──────────────┘                                 │   │
│  │               │                              │                                               │   │
│  └───────────────┴──────────────────────────────┴───────────────────────────────────────────────┘   │
│                                            │                                                       │
│  ┌─────────────────────────────────────────▼───────────────────────────────────────────────────┐   │
│  │                         BLOCKCHAIN INTERACTION LAYER                                          │   │
│  │                                                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │  @solana/     │  │  @coral-xyz/ │  │  @metaplex-  │  │  Pyth SDK    │  │  EAS SDK     │  │   │
│  │  │  web3.js      │  │  anchor      │  │  foundation  │  │  Switchboard │  │  (Attestation)│  │   │
│  │  │              │  │              │  │  /js          │  │  SDK         │  │              │  │   │
│  │  │  RPC calls   │  │  Program     │  │  NFT ops     │  │  Price feeds │  │  Schema reg  │  │   │
│  │  │  Keypairs    │  │  PDAs        │  │  Metadata    │  │  VRF         │  │  Attest/rev  │  │   │
│  │  │  Txn signing │  │  IDL parsing │  │  Merkle tree │  │  Randomness  │  │  Verify      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                                                              │   │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                            │                                                       │
│  ┌─────────────────────────────────────────▼───────────────────────────────────────────────────┐   │
│  │                            DATABASE LAYER (PostgreSQL + Redis)                                │   │
│  │                                                                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │ Wallets  │ │ Sessions │ │   NFTs   │ │ Oracles  │ │ Attesta- │ │  Redis   │            │   │
│  │  │ 4 tables │ │ + Nonces │ │ 6 tables │ │ 4 tables │ │  tions   │ │  Cache   │            │   │
│  │  │          │ │          │ │          │ │          │ │ 6 tables │ │          │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │   │
│  │                                                                                              │   │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            EXTERNAL DEPENDENCIES                                              │   │
│  │                                                                                               │   │
│  │  @mcv/web3-core        @mcv/identity          @mcv/ui              @mcv/fabric               │   │
│  │  (Internal wallet/     (Wallet-to-user        (Wallet connect      (Event bus,               │   │
│  │   token infra, SPL      linking, auth)         UI components,       NFT media                │   │
│  │   token ops)                                   theming)             storage)                  │   │
│  │                                                                                               │   │
│  │  Solana RPC            Pyth Network           Switchboard          SumSub/Veriff             │   │
│  │  (Helius, Triton,      (Price feeds,          (Custom feeds,       (KYC verification,        │   │
│  │   QuickNode)            confidence)            VRF)                 ID checks)               │   │
│  │                                                                                               │   │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Wallet Connect → NFT Mint → Attestation Gate

```
User clicks "Connect Wallet"
        │
        ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│ wallet-sdk        │────▶│ wallet-sdk        │────▶│ attestation       │
│                   │     │                   │     │                   │
│ Detect Phantom    │     │ Sign nonce msg    │     │ Check KYC status  │
│ Open connect      │     │ Verify signature  │     │ for mint access   │
│ Get publicKey     │     │ Link wallet to    │     │                   │
│                   │     │ user account      │     │ PASS → proceed    │
└───────────────────┘     └───────────────────┘     └─────────┬─────────┘
                                                              │
                                                              ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│ nfts              │────▶│ nfts              │────▶│ wallet-sdk        │
│                   │     │                   │     │                   │
│ Create mint       │     │ Build Metaplex    │     │ Sign transaction  │
│ request           │     │ transaction       │     │ Submit to Solana  │
│ Validate supply   │     │ Upload metadata   │     │ Confirm on-chain  │
│ Check eligibility │     │ to Arweave        │     │ Index in DB       │
└───────────────────┘     └───────────────────┘     └───────────────────┘
```

### Data Flow: Oracle Price Feed → Business Logic

```
Cron Job: Update Price Feeds (every 10s)
        │
        ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│ oracles           │────▶│ oracles           │────▶│ oracles           │
│                   │     │                   │     │                   │
│ Fetch from Pyth   │     │ Fetch from        │     │ Aggregate values  │
│ SOL/USD: $142.53  │     │ Switchboard       │     │ Method: median    │
│ confidence: high  │     │ SOL/USD: $142.48  │     │ Result: $142.505  │
└───────────────────┘     └───────────────────┘     └─────────┬─────────┘
                                                              │
                                              ┌───────────────┼───────────────┐
                                              │ store         │ emit          │
                                              ▼               ▼               ▼
                                    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                                    │ PostgreSQL   │ │ Redis cache  │ │ @mcv/fabric  │
                                    │              │ │              │ │              │
                                    │ oracle_update│ │ TTL: 30s     │ │ Event:       │
                                    │ history row  │ │ price:sol/usd│ │ price.updated│
                                    └──────────────┘ └──────────────┘ └──────────────┘
```

---

## Sub-Module Overview

| Module | Purpose | Tables | Key Operations |
|--------|---------|--------|----------------|
| **wallet-sdk** | Wallet connections, signing, balances, tx history | 4 | connect, verify, sign, send, balance, history |
| **nfts** | NFT collections, minting, marketplace, gating | 6 | create collection, mint, list, buy, transfer, gate |
| **oracles** | Price feeds, randomness, sports data, custom oracles | 4 | fetch price, aggregate, request VRF, publish result |
| **attestation** | Identity verification, credentials, reputation | 6 | start KYC, issue attestation, verify, revoke, score |

---

## Module: wallet-sdk

### Purpose

The Wallet SDK provides a **unified, provider-agnostic interface** for connecting to Web3 wallets across multiple chains and providers. It is the foundational layer that every other Web3 operation depends on — you cannot mint an NFT, check a price feed with wallet context, or create an attestation without first establishing a wallet connection.

The SDK supports:
- **Self-custodial wallets**: Phantom, Solflare, Backpack (Solana); MetaMask, Coinbase Wallet (EVM)
- **Protocol wallets**: WalletConnect v2 (multi-chain bridge)
- **Embedded wallets**: Privy, Magic (email/social login → wallet)
- **Custodial wallets**: MCV-managed KMS wallets for ventures requiring server-side signing

The design follows the **Wallet Adapter pattern** (inspired by `@solana/wallet-adapter`) with a registry that auto-detects installed browser extensions, handles connection/disconnection lifecycle, manages sessions with TTL, and provides consistent signing interfaces regardless of the underlying provider.

### Wallet Connection UX Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WALLET CONNECTION UX FLOW                         │
│                                                                      │
│  1. User clicks "Connect Wallet" button                             │
│     └─▶ WalletModal opens, showing detected wallets                 │
│                                                                      │
│  2. User selects wallet (e.g., Phantom)                             │
│     └─▶ PhantomAdapter.connect() called                             │
│     └─▶ Phantom extension popup opens                               │
│     └─▶ User approves connection                                    │
│     └─▶ PublicKey returned                                          │
│                                                                      │
│  3. Server generates nonce for signature verification               │
│     └─▶ POST /api/wallet/nonce { address, chain }                  │
│     └─▶ Nonce stored in DB with 5-minute TTL                       │
│                                                                      │
│  4. User signs nonce message                                        │
│     └─▶ adapter.signMessage("Sign to verify...\nNonce: abc123")    │
│     └─▶ Phantom popup: "Sign Message?"                             │
│     └─▶ User confirms                                              │
│                                                                      │
│  5. Server verifies signature and links wallet                      │
│     └─▶ POST /api/wallet/verify { address, chain, signature, nonce}│
│     └─▶ nacl.sign.detached.verify() for Solana                     │
│     └─▶ ecrecover() for EVM                                        │
│     └─▶ Wallet linked to user → session created                    │
│                                                                      │
│  6. UI updates: balance displayed, features unlocked                │
│     └─▶ useWalletBalances() fetches SOL + token balances            │
│     └─▶ useNFTGate() checks NFT-gated content access               │
│     └─▶ useAttestation() checks KYC status                         │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  Mobile Flow (Phantom Mobile / Deep Links)               │        │
│  │                                                          │        │
│  │  1. Detect mobile browser (no extension)                 │        │
│  │  2. Generate deep link: phantom://connect?...            │        │
│  │  3. User redirected to Phantom app                       │        │
│  │  4. User approves, redirected back via callback URL     │        │
│  │  5. Callback URL includes encrypted payload             │        │
│  │  6. Decrypt → extract publicKey → continue step 3+      │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```typescript
// ── user_wallet — Connected Wallets ────────────────────────────────────
export const userWallets = pgTable('user_wallet', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),

  // Wallet identity
  chain: chainEnum('chain').notNull(),                          // solana | ethereum | base | polygon | ...
  address: text('address').notNull(),                           // Public key or 0x address

  // Connection details
  provider: walletProviderEnum('provider'),                     // phantom | solflare | metamask | ...
  isCustodial: boolean('is_custodial').default(false),          // true for KMS-managed wallets
  isPrimary: boolean('is_primary').default(false),              // Primary wallet for this chain

  // Verification
  verifiedAt: timestamp('verified_at'),                         // When ownership was verified via sig
  verificationSignature: text('verification_signature'),        // The stored signature proof

  // Name resolution
  resolvedName: text('resolved_name'),                          // SNS (.sol) or ENS (.eth) name

  // User metadata
  label: text('label'),                                         // "My Gaming Wallet", "Hardware"
  metadata: jsonb('metadata').$type<{
    publicKey?: string;
    derivationPath?: string;
    custodialWalletId?: string;
    capabilities?: string[];                                     // ['signMessage', 'signTransaction', 'signAllTransactions']
    lastKnownBalance?: string;
    avatarUrl?: string;
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  chainAddressUnq: uniqueIndex('wallet_chain_address_unq').on(t.chain, t.address),
  userChainIdx: uniqueIndex('wallet_user_chain_idx').on(t.userId, t.chain),
  ventureUserIdx: index('wallet_venture_user_idx').on(t.ventureId, t.userId),
}));

// ── wallet_session — Active Wallet Sessions ────────────────────────────
export const walletSessions = pgTable('wallet_session', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  walletId: text('wallet_id').notNull().references(() => userWallets.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),

  // Session identity
  sessionToken: text('session_token').notNull().unique(),       // Cryptographically random token
  provider: walletProviderEnum('provider'),

  // State
  isActive: boolean('is_active').default(true),
  connectedAt: timestamp('connected_at').defaultNow(),
  lastActivity: timestamp('last_activity').defaultNow(),
  expiresAt: timestamp('expires_at'),                           // Session TTL (default 24h)

  // Client fingerprint
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceId: text('device_id'),                                  // For mobile session binding

  metadata: jsonb('metadata').$type<{
    connectionMethod?: 'extension' | 'deeplink' | 'walletconnect' | 'embedded';
    walletVersion?: string;
    chainId?: number;
  }>(),
});

// ── wallet_transaction — Off-Chain Transaction Index ───────────────────
export const walletTransactions = pgTable('wallet_transaction', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  walletId: text('wallet_id').references(() => userWallets.id),

  // Chain reference
  chain: chainEnum('chain').notNull(),
  txHash: text('tx_hash').notNull(),
  blockNumber: numeric('block_number'),
  slot: numeric('slot'),                                        // Solana slot number

  // Transaction details
  type: text('type').notNull(),                                 // transfer | swap | stake | nft_mint | nft_transfer | contract_call | token_create
  status: text('status').notNull().default('pending'),          // pending | confirmed | failed | finalized

  // Addresses
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address'),
  programId: text('program_id'),                                // Solana program ID involved

  // Value
  amount: numeric('amount', { precision: 24, scale: 8 }),
  tokenSymbol: text('token_symbol'),
  tokenMint: text('token_mint'),                                // SPL token mint address
  tokenDecimals: integer('token_decimals'),

  // Fee
  fee: numeric('fee', { precision: 18, scale: 8 }),
  feeToken: text('fee_token').default('SOL'),
  priorityFee: numeric('priority_fee', { precision: 18, scale: 8 }),

  // Instruction data
  instructions: jsonb('instructions').$type<Array<{
    programId: string;
    data: string;
    keys: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>;
  }>>(),
  logs: jsonb('logs').$type<string[]>(),

  // Human-readable
  description: text('description'),                             // "Sent 1.5 SOL to GKv4..."

  confirmedAt: timestamp('confirmed_at'),
  finalizedAt: timestamp('finalized_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  txHashUnq: uniqueIndex('tx_hash_chain_unq').on(t.chain, t.txHash),
  walletIdx: index('tx_wallet_idx').on(t.walletId),
  ventureIdx: index('tx_venture_idx').on(t.ventureId),
  statusIdx: index('tx_status_idx').on(t.status),
  typeIdx: index('tx_type_idx').on(t.type),
}));

// ── wallet_nonce — Signature Verification Nonces ───────────────────────
export const walletNonces = pgTable('wallet_nonce', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  address: text('address').notNull(),
  chain: chainEnum('chain').notNull(),

  nonce: text('nonce').notNull(),                               // Cryptographically random nonce string
  message: text('message').notNull(),                           // Full message that was signed
  expiresAt: timestamp('expires_at').notNull(),                 // 5-minute TTL
  usedAt: timestamp('used_at'),                                 // Set when nonce is consumed

  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  addressChainIdx: index('nonce_address_chain_idx').on(t.address, t.chain),
  expiresIdx: index('nonce_expires_idx').on(t.expiresAt),
}));
```

### Core Interface

```typescript
export class WalletService {
  // ── Connection & Verification ────────────────────────────────────────
  generateNonce(address: string, chain: Chain, ip?: string): Promise<{ nonce: string; message: string }>;
  verifyAndLink(input: VerifyWalletInput): Promise<{ wallet: UserWallet; session: WalletSession; isNewUser: boolean }>;
  disconnect(sessionId: string): Promise<void>;

  // ── Wallet Management ────────────────────────────────────────────────
  listWallets(userId: string, ventureId: string): Promise<UserWallet[]>;
  linkAdditionalWallet(userId: string, input: LinkWalletInput): Promise<UserWallet>;
  unlinkWallet(userId: string, walletId: string): Promise<void>;
  setPrimaryWallet(userId: string, walletId: string): Promise<UserWallet>;
  updateWalletLabel(walletId: string, label: string): Promise<UserWallet>;

  // ── Session Management ───────────────────────────────────────────────
  getActiveSession(sessionToken: string): Promise<WalletSession | null>;
  refreshSession(sessionId: string): Promise<WalletSession>;
  revokeAllSessions(userId: string): Promise<number>;

  // ── Balances ─────────────────────────────────────────────────────────
  getSolanaBalance(address: string): Promise<{ lamports: bigint; sol: string }>;
  getTokenBalances(address: string, chain: Chain): Promise<TokenBalance[]>;
  getNFTBalances(address: string, chain: Chain): Promise<NFTBalance[]>;
  getPortfolioValue(userId: string): Promise<{ totalUsd: number; chains: ChainPortfolio[] }>;

  // ── Transactions ─────────────────────────────────────────────────────
  getTransactionHistory(walletId: string, options?: TransactionQueryOptions): Promise<PaginatedResult<WalletTransaction>>;
  indexTransaction(txHash: string, chain: Chain): Promise<WalletTransaction>;
  getTransactionStatus(txHash: string, chain: Chain): Promise<TransactionStatus>;

  // ── Custodial Wallet Operations ──────────────────────────────────────
  createCustodialWallet(userId: string, chain: Chain, label?: string): Promise<UserWallet>;
  signWithCustodial(walletId: string, transaction: SolanaTransaction): Promise<SolanaTransaction>;
  sendFromCustodial(walletId: string, input: SendTransactionInput): Promise<TransactionResult>;

  // ── Name Resolution ──────────────────────────────────────────────────
  resolveAddress(name: string): Promise<{ address: string; chain: Chain } | null>;
  reverseLookup(address: string, chain: Chain): Promise<string | null>;
}
```

### Wallet Adapter Interface

```typescript
/**
 * Universal wallet adapter interface.
 * All wallet implementations (Phantom, Solflare, etc.) conform to this interface.
 * This allows the SDK to treat all wallets uniformly.
 */
export interface WalletAdapter {
  /** Display name (e.g., "Phantom") */
  readonly name: string;
  /** Icon URL for wallet logo */
  readonly icon: string;
  /** Primary chain this adapter supports */
  readonly chain: Chain;
  /** URL to download/install the wallet */
  readonly downloadUrl: string;
  /** Whether this wallet is installed/available in the current environment */
  readonly isAvailable: boolean;
  /** Whether the wallet supports mobile deep links */
  readonly supportsMobile: boolean;
  /** Current connection state */
  readonly isConnected: boolean;
  /** Connected public key (null if not connected) */
  readonly publicKey: string | null;

  /** Capabilities this adapter supports */
  readonly capabilities: WalletCapabilities;

  /** Connect to the wallet. Returns connection details. */
  connect(options?: ConnectOptions): Promise<WalletConnection>;
  /** Disconnect from the wallet. */
  disconnect(): Promise<void>;
  /** Sign an arbitrary message. Returns base64 signature. */
  signMessage(message: string | Uint8Array): Promise<string>;
  /** Sign a transaction without submitting. Returns signed transaction. */
  signTransaction<T>(transaction: T): Promise<T>;
  /** Sign multiple transactions atomically. */
  signAllTransactions?<T>(transactions: T[]): Promise<T[]>;
  /** Sign and submit a transaction. Returns transaction hash. */
  sendTransaction(transaction: unknown, options?: SendOptions): Promise<string>;

  /** Event listeners */
  on(event: 'connect', handler: (publicKey: string) => void): void;
  on(event: 'disconnect', handler: () => void): void;
  on(event: 'accountChanged', handler: (publicKey: string | null) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
}

export interface WalletCapabilities {
  signMessage: boolean;
  signTransaction: boolean;
  signAllTransactions: boolean;
  sendTransaction: boolean;
  /** Whether the wallet supports the Solana Mobile Wallet Adapter protocol */
  mobileWalletAdapter: boolean;
  /** Whether the wallet supports WalletConnect v2 */
  walletConnect: boolean;
}

export interface ConnectOptions {
  /** Only connect if already authorized (no popup) */
  onlyIfTrusted?: boolean;
  /** For mobile: redirect URL after connection */
  redirectUrl?: string;
  /** For WalletConnect: target chain ID */
  chainId?: number;
}

export interface SendOptions {
  /** Skip preflight simulation */
  skipPreflight?: boolean;
  /** Commitment level for confirmation */
  commitment?: 'processed' | 'confirmed' | 'finalized';
  /** Priority fee in microlamports */
  priorityFee?: number;
  /** Max compute units */
  maxComputeUnits?: number;
}
```

### Adapter Registry

```typescript
/**
 * WalletAdapterRegistry manages all available wallet adapters,
 * auto-detects installed wallets, and provides the selection UI data.
 */
export class WalletAdapterRegistry {
  private adapters: Map<string, WalletAdapter> = new Map();
  private detectionPromise: Promise<void> | null = null;

  constructor(config?: {
    /** Chains to support */
    chains?: Chain[];
    /** Auto-detect installed wallets on creation */
    autoDetect?: boolean;
    /** Additional custom adapters */
    customAdapters?: WalletAdapter[];
  }) {
    // Register built-in adapters
    this.register(new PhantomAdapter());
    this.register(new SolflareAdapter());
    this.register(new BackpackAdapter());
    this.register(new MetaMaskAdapter());
    this.register(new CoinbaseWalletAdapter());
    this.register(new WalletConnectAdapter());
    this.register(new PrivyAdapter());

    config?.customAdapters?.forEach(a => this.register(a));

    if (config?.autoDetect !== false) {
      this.detectionPromise = this.detectInstalled();
    }
  }

  /** Register a wallet adapter */
  register(adapter: WalletAdapter): void {
    this.adapters.set(adapter.name.toLowerCase(), adapter);
  }

  /** Get all registered adapters */
  getAll(): WalletAdapter[] {
    return Array.from(this.adapters.values());
  }

  /** Get adapters available in the current environment (installed/detected) */
  async getAvailable(chain?: Chain): Promise<WalletAdapter[]> {
    await this.detectionPromise;
    let adapters = this.getAll().filter(a => a.isAvailable);
    if (chain) {
      adapters = adapters.filter(a => a.chain === chain);
    }
    return adapters;
  }

  /** Get the recommended adapter for the current context */
  async getRecommended(chain: Chain): Promise<WalletAdapter | null> {
    const available = await this.getAvailable(chain);
    if (available.length === 0) return null;

    // Priority: Phantom > Solflare > Backpack for Solana
    //           MetaMask > Coinbase for EVM
    const priority: Record<string, string[]> = {
      solana: ['phantom', 'solflare', 'backpack'],
      ethereum: ['metamask', 'coinbase wallet'],
      base: ['coinbase wallet', 'metamask'],
    };

    const chainPriority = priority[chain] ?? [];
    for (const name of chainPriority) {
      const adapter = available.find(a => a.name.toLowerCase() === name);
      if (adapter) return adapter;
    }

    return available[0];
  }

  /** Detect which wallet extensions are installed */
  private async detectInstalled(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Wait for wallet injection (some wallets inject async)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Solana wallets register on window.solana or window.phantom
    // EVM wallets register on window.ethereum
    // Each adapter's isAvailable getter handles its own detection
  }
}
```

### Key Behaviors

1. **Nonce-based verification**: Every wallet link requires a fresh nonce signed by the wallet's private key. Nonces are single-use and expire in 5 minutes. This prevents replay attacks and proves wallet ownership.
2. **Session management**: Wallet sessions have a configurable TTL (default 24 hours). Each interaction updates `lastActivity`. Expired sessions are cleaned by a cron job. Multiple sessions per wallet are allowed (desktop + mobile).
3. **Auto-detection**: The adapter registry auto-detects installed browser wallet extensions within 100ms of initialization. The `WalletModal` component shows detected wallets first, then "Install" links for undetected ones.
4. **Mobile deep links**: On mobile browsers where extensions aren't available, the SDK generates deep links (e.g., `phantom://v1/connect?...`) to open the native wallet app. Return data comes via URL callback with encrypted payload.
5. **Primary wallet**: Each user has one primary wallet per chain. The primary wallet is used as the default for transactions and identity resolution. Changing primary updates all dependent references.
6. **Balance caching**: Token balances are cached in Redis with a 30-second TTL. SOL balance is fetched directly via RPC on each request (cheap call). Portfolio aggregation runs through all linked wallets.
7. **Transaction indexing**: After a transaction is signed and submitted, the SDK monitors its confirmation status (processed → confirmed → finalized) and stores the result in the transaction index for fast querying without hitting the RPC.

---

## Module: nfts

### Purpose

The NFTs module provides **complete NFT lifecycle management** from collection creation and deployment through minting, transfers, marketplace listing, and metadata management. It implements the **Metaplex standard** for Solana NFTs, supports **compressed NFTs (cNFTs)** for cost-efficient large-scale minting via Bubblegum, and includes **NFT gating** capabilities that allow ventures to gate features, content, or membership tiers behind NFT ownership.

This module powers:
- **MCV Studios**: Game asset NFTs, in-game item marketplace, player achievement NFTs
- **BetEdge**: Loyalty NFTs, VIP tier NFTs, collectible bet slips
- **SerpSpace**: Premium feature access via NFT membership
- **Full Gain**: Grant milestone achievement NFTs, donor recognition NFTs
- **Futurestate**: Tokenized real estate fractions as NFTs

### NFT Lifecycle State Machine

```
┌──────────┐   deploy    ┌──────────┐   start mint  ┌──────────┐
│          │────────────▶│          │──────────────▶│          │
│  DRAFT   │             │  MINTED  │               │ MINTING  │
│          │             │ (on-chain│               │          │
│ metadata │             │  contract│               │ Users can│
│ + art    │             │  deployed│               │ mint     │
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

### Database Schema

```typescript
// ── nft_collection — NFT Collections ───────────────────────────────────
export const nftCollections = pgTable('nft_collection', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),

  // Identity
  name: text('name').notNull(),                                 // "BetEdge Founders Pass"
  symbol: text('symbol').notNull(),                             // "BEPASS"
  slug: text('slug').notNull(),                                 // "betedge-founders-pass"
  description: text('description'),

  // Chain details
  chain: chainEnum('chain').notNull(),                          // solana (primary)
  standard: nftStandardEnum('standard').notNull(),              // metaplex | compressed | erc721 | erc1155
  contractAddress: text('contract_address'),                    // Candy Machine address (Solana)
  collectionMint: text('collection_mint'),                      // Collection NFT mint address
  merkleTree: text('merkle_tree'),                              // Bubblegum merkle tree (for cNFTs)

  // Collection art
  image: text('image'),                                         // Collection thumbnail
  banner: text('banner'),                                       // Collection banner image
  externalUrl: text('external_url'),                            // Website URL

  // Supply configuration
  maxSupply: integer('max_supply'),                             // null = unlimited
  currentSupply: integer('current_supply').default(0),
  reservedSupply: integer('reserved_supply').default(0),        // Team/treasury reserve

  // Royalty configuration
  royaltyBasisPoints: integer('royalty_basis_points').default(500),  // 5% = 500 bps
  royaltyRecipient: text('royalty_recipient'),                  // Wallet receiving royalties
  royaltySplit: jsonb('royalty_split').$type<Array<{
    address: string;
    share: number;                                              // Percentage (sums to 100)
  }>>(),

  // Mint phases configuration
  mintPhases: jsonb('mint_phases').$type<MintPhase[]>(),
  // [{ name: 'Whitelist', startTime: ..., endTime: ..., price: 0.5, maxPerWallet: 2, merkleRoot: '...' },
  //  { name: 'Public', startTime: ..., endTime: ..., price: 1.0, maxPerWallet: 5, merkleRoot: null }]
  currentPhase: text('current_phase'),
  mintPrice: numeric('mint_price', { precision: 18, scale: 8 }),
  mintToken: text('mint_token').default('SOL'),                 // SOL or SPL token mint
  maxPerWallet: integer('max_per_wallet'),

  // Reveal configuration (for delayed reveal)
  isRevealed: boolean('is_revealed').default(true),
  revealDate: timestamp('reveal_date'),
  placeholderImage: text('placeholder_image'),
  placeholderMetadataUri: text('placeholder_metadata_uri'),

  // Collection-level attributes (for rarity)
  traitTypes: jsonb('trait_types').$type<Array<{
    name: string;
    values: string[];
    weights?: number[];                                         // For weighted random generation
  }>>(),

  // Status
  status: collectionStatusEnum('status').default('draft'),      // draft | minting | minted | revealed | frozen

  // Creator verification
  creatorAddress: text('creator_address'),
  creatorVerified: boolean('creator_verified').default(false),

  // Analytics cache
  floorPrice: numeric('floor_price', { precision: 18, scale: 8 }),
  totalVolume: numeric('total_volume', { precision: 24, scale: 8 }),
  uniqueHolders: integer('unique_holders').default(0),
  listedCount: integer('listed_count').default(0),

  metadata: jsonb('metadata').$type<{
    socials?: { twitter?: string; discord?: string; website?: string };
    tags?: string[];
    category?: 'art' | 'gaming' | 'membership' | 'collectible' | 'utility' | 'real_estate';
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  ventureIdx: index('collection_venture_idx').on(t.ventureId),
  slugUnq: uniqueIndex('collection_slug_unq').on(t.ventureId, t.slug),
  contractIdx: index('collection_contract_idx').on(t.chain, t.contractAddress),
  statusIdx: index('collection_status_idx').on(t.status),
}));

// ── nft — Individual NFTs ──────────────────────────────────────────────
export const nfts = pgTable('nft', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  collectionId: text('collection_id').references(() => nftCollections.id),

  // On-chain identity
  chain: chainEnum('chain').notNull(),
  mintAddress: text('mint_address').notNull(),                  // SPL token mint address (Solana)
  tokenId: text('token_id'),                                    // ERC-721/1155 token ID (EVM)
  assetId: text('asset_id'),                                    // Compressed NFT asset ID (Bubblegum)

  // Metadata (Metaplex JSON standard)
  name: text('name').notNull(),                                 // "BetEdge Founders Pass #42"
  description: text('description'),
  image: text('image'),                                         // Arweave/IPFS URI
  animationUrl: text('animation_url'),                          // Video/3D model URI
  externalUrl: text('external_url'),

  // Attributes (Metaplex standard)
  attributes: jsonb('attributes').$type<Array<{
    trait_type: string;
    value: string | number;
    display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date';
  }>>(),

  // Properties (Metaplex standard)
  properties: jsonb('properties').$type<{
    files?: Array<{ uri: string; type: string; cdn?: boolean }>;
    category?: 'image' | 'video' | 'audio' | 'vr' | 'html';
    creators?: Array<{ address: string; share: number; verified?: boolean }>;
  }>(),

  // Ownership
  ownerAddress: text('owner_address'),
  delegateAddress: text('delegate_address'),                    // If delegated to another address

  // Edition info
  editionNumber: integer('edition_number'),                     // For print editions
  maxEdition: integer('max_edition'),
  masterEdition: text('master_edition'),                        // Master edition address

  // Supply (ERC-1155 only)
  supply: integer('supply').default(1),

  // State
  isBurned: boolean('is_burned').default(false),
  isFrozen: boolean('is_frozen').default(false),
  isCompressed: boolean('is_compressed').default(false),        // cNFT flag
  isListed: boolean('is_listed').default(false),

  // Marketplace listing
  listPrice: numeric('list_price', { precision: 18, scale: 8 }),
  listToken: text('list_token'),
  listedAt: timestamp('listed_at'),
  listedOnMarketplace: text('listed_on_marketplace'),           // 'mcv' | 'magic_eden' | 'tensor'

  // Rarity (pre-computed by rarityCalculator)
  rarityScore: numeric('rarity_score', { precision: 10, scale: 6 }),
  rarityRank: integer('rarity_rank'),

  // Metadata URI
  metadataUri: text('metadata_uri'),                            // Arweave/IPFS JSON metadata URI
  metadataHash: text('metadata_hash'),                          // SHA-256 of metadata JSON

  // Compressed NFT proof
  proof: jsonb('proof').$type<CompressedNFTProof>(),            // Merkle proof for cNFTs

  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  mintAddressUnq: uniqueIndex('nft_mint_unq').on(t.chain, t.mintAddress),
  collectionIdx: index('nft_collection_idx').on(t.collectionId),
  ownerIdx: index('nft_owner_idx').on(t.ownerAddress),
  rarityIdx: index('nft_rarity_idx').on(t.collectionId, t.rarityRank),
  listedIdx: index('nft_listed_idx').on(t.isListed, t.collectionId),
}));

// ── nft_transfer — Transfer/Sale History ───────────────────────────────
export const nftTransfers = pgTable('nft_transfer', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  nftId: text('nft_id').notNull().references(() => nfts.id),
  ventureId: text('venture_id'),

  chain: chainEnum('chain').notNull(),
  txHash: text('tx_hash').notNull(),
  blockNumber: numeric('block_number'),
  slot: numeric('slot'),

  type: text('type').notNull(),                                 // mint | transfer | sale | burn | list | delist
  fromAddress: text('from_address'),
  toAddress: text('to_address'),

  // Sale info (only for type='sale')
  price: numeric('price', { precision: 18, scale: 8 }),
  priceToken: text('price_token'),
  priceUsd: numeric('price_usd', { precision: 18, scale: 2 }),
  marketplace: text('marketplace'),                             // mcv | magic_eden | tensor | opensea
  royaltyPaid: numeric('royalty_paid', { precision: 18, scale: 8 }),

  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  nftIdx: index('transfer_nft_idx').on(t.nftId),
  txHashIdx: index('transfer_tx_hash_idx').on(t.txHash),
  typeIdx: index('transfer_type_idx').on(t.type),
  timestampIdx: index('transfer_timestamp_idx').on(t.timestamp),
}));

// ── nft_mint_request — Lazy Mint Queue ─────────────────────────────────
export const mintRequests = pgTable('nft_mint_request', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  collectionId: text('collection_id').notNull().references(() => nftCollections.id),

  // Requester
  userId: text('user_id'),
  walletAddress: text('wallet_address').notNull(),

  // Mint details
  quantity: integer('quantity').notNull().default(1),
  mintPhase: text('mint_phase'),                                // Which phase they're minting in

  // Payment
  totalPrice: numeric('total_price', { precision: 18, scale: 8 }),
  paymentToken: text('payment_token'),
  paymentTxHash: text('payment_tx_hash'),

  // Whitelist proof (if applicable)
  merkleProof: jsonb('merkle_proof').$type<string[]>(),

  // Status
  status: text('status').default('pending'),                    // pending | paid | minting | completed | failed | refunded
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),

  // Result
  mintedNftIds: jsonb('minted_nft_ids').$type<string[]>(),
  mintTxHashes: jsonb('mint_tx_hashes').$type<string[]>(),
  errorMessage: text('error_message'),
  errorCode: text('error_code'),

  // Timing
  paidAt: timestamp('paid_at'),
  mintStartedAt: timestamp('mint_started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  collectionIdx: index('mint_req_collection_idx').on(t.collectionId),
  walletIdx: index('mint_req_wallet_idx').on(t.walletAddress),
  statusIdx: index('mint_req_status_idx').on(t.status),
}));

// ── nft_gate — NFT Gating Rules ────────────────────────────────────────
export const nftGates = pgTable('nft_gate', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),

  // What is gated
  resourceType: text('resource_type').notNull(),                // feature | content | page | api | event | membership
  resourceId: text('resource_id').notNull(),                    // ID of the gated resource
  resourceName: text('resource_name'),                          // Human-readable name

  // Gate conditions (ANY of these must be met)
  conditions: jsonb('conditions').$type<Array<{
    type: 'collection' | 'specific_nft' | 'attribute' | 'minimum_count';
    collectionId?: string;
    mintAddress?: string;
    attributeFilter?: { trait_type: string; value: string | string[] };
    minimumCount?: number;
    chain?: Chain;
  }>>().notNull(),

  // Gate behavior
  operator: text('operator').default('OR'),                     // OR = any condition, AND = all conditions
  fallbackAction: text('fallback_action').default('block'),     // block | redirect | show_upgrade
  fallbackUrl: text('fallback_url'),                            // Redirect URL for non-holders
  fallbackMessage: text('fallback_message'),                    // Message shown to non-holders

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  ventureResourceIdx: index('gate_venture_resource_idx').on(t.ventureId, t.resourceType, t.resourceId),
}));

// ── nft_membership — NFT-Based Membership Records ─────────────────────
export const nftMemberships = pgTable('nft_membership', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),

  // NFT that grants membership
  nftId: text('nft_id').references(() => nfts.id),
  collectionId: text('collection_id').references(() => nftCollections.id),
  walletAddress: text('wallet_address').notNull(),

  // Membership details
  tier: text('tier').notNull(),                                 // bronze | silver | gold | platinum | diamond
  tierConfig: jsonb('tier_config').$type<{
    name: string;
    features: string[];
    discountPercent?: number;
    prioritySupport?: boolean;
    customBadge?: string;
  }>(),

  // State
  isActive: boolean('is_active').default(true),
  activatedAt: timestamp('activated_at').defaultNow(),
  expiresAt: timestamp('expires_at'),                           // null = never expires (as long as NFT held)
  lastVerifiedAt: timestamp('last_verified_at'),                // Last time we verified NFT ownership

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  userVentureIdx: index('membership_user_venture_idx').on(t.userId, t.ventureId),
  tierIdx: index('membership_tier_idx').on(t.tier),
  nftIdx: index('membership_nft_idx').on(t.nftId),
}));
```

### Core Interface

```typescript
export class NFTService {
  // ── Collections ──────────────────────────────────────────────────────
  createCollection(input: CreateCollectionInput): Promise<NFTCollection>;
  updateCollection(collectionId: string, input: UpdateCollectionInput): Promise<NFTCollection>;
  deployCollection(collectionId: string): Promise<{ collection: NFTCollection; txHash: string }>;
  revealCollection(collectionId: string): Promise<NFTCollection>;
  freezeCollection(collectionId: string): Promise<NFTCollection>;
  getCollectionStats(collectionId: string): Promise<CollectionStats>;

  // ── Minting ──────────────────────────────────────────────────────────
  requestMint(input: MintNFTInput): Promise<MintRequest>;
  confirmMintPayment(requestId: string, txHash: string): Promise<MintRequest>;
  executeMint(requestId: string): Promise<{ nfts: NFT[]; txHashes: string[] }>;
  getMintStatus(requestId: string): Promise<MintRequest>;
  mintCompressed(input: CompressedMintInput): Promise<{ nft: NFT; proof: CompressedNFTProof }>;

  // ── NFT Operations ───────────────────────────────────────────────────
  getNFT(nftId: string): Promise<NFTWithHistory>;
  getNFTsByWallet(walletAddress: string, options?: NFTQueryOptions): Promise<PaginatedResult<NFT>>;
  getNFTsByCollection(collectionId: string, options?: NFTQueryOptions): Promise<PaginatedResult<NFT>>;
  refreshMetadata(nftId: string): Promise<NFT>;
  transferNFT(nftId: string, toAddress: string): Promise<{ txHash: string }>;
  burnNFT(nftId: string): Promise<{ txHash: string }>;

  // ── Marketplace ──────────────────────────────────────────────────────
  listForSale(input: ListNFTInput): Promise<NFT>;
  unlist(nftId: string): Promise<NFT>;
  buyNFT(nftId: string, buyerAddress: string): Promise<{ nft: NFT; txHash: string }>;
  getListings(options?: ListingQueryOptions): Promise<PaginatedResult<NFT>>;

  // ── Gating ───────────────────────────────────────────────────────────
  createGate(input: CreateGateInput): Promise<NFTGate>;
  checkGate(gateId: string, walletAddress: string): Promise<{ allowed: boolean; reason?: string }>;
  checkGateByResource(ventureId: string, resourceType: string, resourceId: string, walletAddress: string): Promise<{ allowed: boolean; reason?: string }>;

  // ── Memberships ──────────────────────────────────────────────────────
  activateMembership(userId: string, nftId: string): Promise<NFTMembership>;
  verifyMembership(userId: string, ventureId: string): Promise<NFTMembership | null>;
  refreshMemberships(): Promise<{ verified: number; deactivated: number }>;

  // ── Rarity ───────────────────────────────────────────────────────────
  calculateRarity(collectionId: string): Promise<void>;
  getRarity(nftId: string): Promise<NFTRarity>;
}
```

### Compressed NFT (cNFT) Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPRESSED NFTs (Bubblegum)                       │
│                                                                      │
│  Traditional NFTs: 1 NFT = 1 on-chain account (~0.012 SOL rent)    │
│  Compressed NFTs:  1,000,000 NFTs = 1 merkle tree (~5.5 SOL total) │
│                                                                      │
│  Cost comparison for 10,000 NFTs:                                    │
│  • Traditional: ~120 SOL (~$17,000)                                 │
│  • Compressed:  ~0.5 SOL (~$71)                                     │
│  • Savings:     99.6%                                                │
│                                                                      │
│  Architecture:                                                       │
│                                                                      │
│  ┌──────────────────────────────────────┐                           │
│  │          Merkle Tree Account          │                           │
│  │         (on-chain, ~5.5 SOL)          │                           │
│  │                                       │                           │
│  │            Root Hash                  │                           │
│  │           ╱         ╲                 │                           │
│  │        H(AB)       H(CD)             │                           │
│  │       ╱    ╲      ╱    ╲             │                           │
│  │     H(A)  H(B)  H(C)  H(D)          │                           │
│  │      │     │      │     │            │                           │
│  │   NFT_1 NFT_2  NFT_3  NFT_4  ...    │                           │
│  │                                       │                           │
│  └──────────────────────────────────────┘                           │
│                                                                      │
│  Verification Flow:                                                  │
│  1. Client provides NFT data + merkle proof                         │
│  2. Verify: hash(NFT data) + proof = root hash                     │
│  3. Root hash matches on-chain tree → NFT is valid                  │
│                                                                      │
│  Trade-offs:                                                         │
│  ✓ 99%+ cost reduction                                              │
│  ✓ Same metadata standard (Metaplex)                                │
│  ✗ Transfer requires merkle proof (stored off-chain)                │
│  ✗ Cannot be listed on all marketplaces (yet)                       │
│  ✗ Concurrent merkle tree has write limitations                     │
│                                                                      │
│  Best for: Loyalty NFTs, achievement badges, membership cards,      │
│            POAPs, large airdrops, game items                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Behaviors

1. **Metaplex standard compliance**: All Solana NFTs follow the Metaplex metadata standard with `name`, `symbol`, `description`, `image`, `attributes`, and `properties`. Metadata JSON is uploaded to Arweave for permanent storage.
2. **Mint phases**: Collections support multiple mint phases (whitelist, public) with different prices, per-wallet limits, and timing. Whitelist phases use merkle proofs for eligibility verification.
3. **Royalty enforcement**: Royalties are enforced via the Metaplex Programmable NFT standard (pNFT). The `royaltyBasisPoints` field defines the percentage (500 = 5%), and `royaltySplit` defines how royalties are split among creators.
4. **Rarity calculation**: After a collection is fully minted, the `rarityCalculator` computes trait rarity scores (1 / percentage of trait occurrence) and assigns ranks. Rarity data is cached on each NFT record.
5. **NFT gating**: Gates check whether a wallet holds any NFT from a collection (or specific attributes). Checks are performed against the off-chain DB first (fast), with on-chain verification as fallback. Gates support AND/OR logic for complex conditions.
6. **Membership verification**: NFT memberships are periodically verified by checking on-chain ownership. If the NFT has been transferred, the membership is deactivated. Verification runs every 6 hours.
7. **Compressed mint batching**: cNFT mints are batched in groups of up to 100 per transaction (Bubblegum limit). Merkle proofs are stored in the `proof` JSONB column for each cNFT.

---

## Module: oracles

### Purpose

The Oracles module provides **real-time off-chain data feeds** for on-chain and off-chain business logic. It integrates with **Pyth Network** and **Switchboard** for price feeds, provides **verifiable randomness (VRF)** for fair gaming and lotteries, delivers **sports event data** for BetEdge's sports betting platform, and supports **custom oracle creation** with multi-source aggregation and staleness detection.

This module is critical for:
- **BetEdge**: Sports event results, live scores, odds data, VRF for provably fair outcomes
- **Futurestate**: Real estate token pricing based on property appraisals and market data
- **All ventures**: SOL/USD price feeds for displaying fiat-equivalent values

### Oracle Data Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ORACLE DATA PIPELINE                             │
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │   Pyth   │  │Switchboard│  │  Custom  │  │  Sports  │               │
│  │  Network │  │  V2      │  │   APIs   │  │   APIs   │               │
│  │          │  │          │  │          │  │          │               │
│  │ SOL/USD  │  │ SOL/USD  │  │ CoinGecko│  │ SportsDB │               │
│  │ BTC/USD  │  │ BTC/USD  │  │ DeFi     │  │ ESPN     │               │
│  │ ETH/USD  │  │ Custom   │  │ Llama    │  │ Odds API │               │
│  │ 200+ prs │  │ feeds    │  │          │  │          │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │              │              │              │                     │
│       └──────────────┴──────────────┴──────────────┘                     │
│                              │                                           │
│                              ▼                                           │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │                   AGGREGATION LAYER                           │       │
│  │                                                               │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐     │       │
│  │  │   Median    │  │  Weighted   │  │   Staleness      │     │       │
│  │  │  Aggregator │  │    Mean     │  │   Detector       │     │       │
│  │  │             │  │             │  │                   │     │       │
│  │  │ Pick middle │  │ Weight by   │  │ Flag feeds that   │     │       │
│  │  │ value from  │  │ source      │  │ haven't updated   │     │       │
│  │  │ N sources   │  │ reliability │  │ within heartbeat  │     │       │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘     │       │
│  │                                                               │       │
│  │  ┌─────────────┐  ┌─────────────┐                           │       │
│  │  │  Deviation  │  │  Outlier    │                           │       │
│  │  │  Threshold  │  │  Rejection  │                           │       │
│  │  │             │  │             │                           │       │
│  │  │ Only update │  │ Discard     │                           │       │
│  │  │ if price    │  │ values >3σ  │                           │       │
│  │  │ changed >X% │  │ from mean   │                           │       │
│  │  └─────────────┘  └─────────────┘                           │       │
│  │                                                               │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                              │                                           │
│                  ┌───────────┼───────────┐                              │
│                  │           │           │                              │
│                  ▼           ▼           ▼                              │
│         ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│         │PostgreSQL│  │  Redis   │  │ WebSocket│                      │
│         │          │  │  Cache   │  │ Broadcast│                      │
│         │ history  │  │  latest  │  │ to subs  │                      │
│         │ + stats  │  │ TTL: 30s │  │          │                      │
│         └──────────┘  └──────────┘  └──────────┘                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```typescript
// ── oracle_feed — Oracle Feed Definitions ──────────────────────────────
export const oracleFeeds = pgTable('oracle_feed', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id'),                                // null = global feed

  // Identity
  name: text('name').notNull(),                                 // "SOL/USD Price Feed"
  slug: text('slug').notNull(),                                 // "sol-usd"
  description: text('description'),
  pair: text('pair'),                                           // "SOL/USD" for price feeds

  // Type
  type: oracleTypeEnum('type').notNull(),                       // price | randomness | sports | weather | custom

  // Source configuration
  sources: jsonb('sources').$type<OracleSource[]>().notNull(),
  aggregationMethod: text('aggregation_method').default('median'),  // median | mean | weighted | first_valid
  outlierRejection: boolean('outlier_rejection').default(true),
  outlierSigma: numeric('outlier_sigma', { precision: 4, scale: 2 }).default('3.00'),

  // Chain publication (if published on-chain)
  chain: chainEnum('chain'),
  feedAddress: text('feed_address'),                            // On-chain feed account address
  programId: text('program_id'),                                // Oracle program ID

  // Update configuration
  updateFrequencySeconds: integer('update_frequency_seconds').default(10),
  deviationThresholdPercent: numeric('deviation_threshold_percent', { precision: 6, scale: 4 }).default('0.50'),
  heartbeatSeconds: integer('heartbeat_seconds').default(60),   // Max seconds between updates

  // Current value (cache)
  currentValue: numeric('current_value', { precision: 24, scale: 8 }),
  previousValue: numeric('previous_value', { precision: 24, scale: 8 }),
  change24h: numeric('change_24h', { precision: 10, scale: 4 }),
  high24h: numeric('high_24h', { precision: 24, scale: 8 }),
  low24h: numeric('low_24h', { precision: 24, scale: 8 }),
  volume24h: numeric('volume_24h', { precision: 24, scale: 8 }),
  lastUpdated: timestamp('last_updated'),

  // Confidence
  confidence: numeric('confidence', { precision: 5, scale: 4 }),  // 0-1 confidence score
  numActiveSources: integer('num_active_sources').default(0),

  // Status
  status: feedStatusEnum('status').default('active'),           // active | stale | inactive | deprecated
  staleSince: timestamp('stale_since'),                         // When the feed became stale

  // Display
  decimals: integer('decimals').default(8),
  unit: text('unit'),                                           // "USD", "ETH", "points"
  displayPrecision: integer('display_precision').default(2),    // Decimal places for display

  metadata: jsonb('metadata').$type<{
    category?: 'crypto' | 'forex' | 'commodity' | 'sports' | 'custom';
    baseCurrency?: string;
    quoteCurrency?: string;
    exchange?: string;
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  slugUnq: uniqueIndex('feed_slug_unq').on(t.slug),
  typeIdx: index('feed_type_idx').on(t.type),
  statusIdx: index('feed_status_idx').on(t.status),
  pairIdx: index('feed_pair_idx').on(t.pair),
}));

// ── oracle_update — Price Update History ───────────────────────────────
export const oracleUpdates = pgTable('oracle_update', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  feedId: text('feed_id').notNull().references(() => oracleFeeds.id, { onDelete: 'cascade' }),

  value: numeric('value', { precision: 24, scale: 8 }).notNull(),
  confidence: numeric('confidence', { precision: 5, scale: 4 }),

  // Source breakdown
  sourceValues: jsonb('source_values').$type<Array<{
    source: string;
    value: number;
    timestamp: string;
    latencyMs: number;
    isOutlier?: boolean;
  }>>(),

  // Aggregate info
  numSources: integer('num_sources'),
  spread: numeric('spread', { precision: 10, scale: 6 }),       // Max - min source value

  // On-chain reference
  txHash: text('tx_hash'),
  blockNumber: numeric('block_number'),
  slot: numeric('slot'),

  // Trigger
  triggerReason: text('trigger_reason'),                        // scheduled | deviation | heartbeat | manual
  deviationFromPrevious: numeric('deviation_from_previous', { precision: 10, scale: 6 }),

  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (t) => ({
  feedTimestampIdx: index('update_feed_ts_idx').on(t.feedId, t.timestamp),
  timestampIdx: index('update_ts_idx').on(t.timestamp),
}));

// ── oracle_randomness — VRF Randomness Requests ───────────────────────
export const randomnessRequests = pgTable('oracle_randomness', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),

  // Request details
  requesterAddress: text('requester_address').notNull(),
  requestTxHash: text('request_tx_hash'),
  callbackProgramId: text('callback_program_id'),               // Program to call with result

  // Parameters
  seed: text('seed'),                                           // User-provided seed for determinism
  numWords: integer('num_words').default(1),                    // Number of random values
  minBlockDelay: integer('min_block_delay').default(1),         // Min blocks before fulfillment

  // Result
  randomWords: jsonb('random_words').$type<string[]>(),         // Array of random uint256 values
  proof: text('proof'),                                         // VRF proof for verification
  fulfillmentTxHash: text('fulfillment_tx_hash'),

  // Commit-reveal (for off-chain randomness)
  commitment: text('commitment'),                               // Hash of secret
  secret: text('secret'),                                       // Revealed secret
  revealedAt: timestamp('revealed_at'),

  // Status
  status: text('status').default('pending'),                    // pending | committed | fulfilled | failed | expired
  errorMessage: text('error_message'),

  // Timing
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  fulfilledAt: timestamp('fulfilled_at'),
  expiresAt: timestamp('expires_at'),                           // Request expires after this time
}, (t) => ({
  ventureIdx: index('randomness_venture_idx').on(t.ventureId),
  statusIdx: index('randomness_status_idx').on(t.status),
}));

// ── oracle_sports_event — Sports Event Data ────────────────────────────
export const sportsEvents = pgTable('oracle_sports_event', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),

  // Event identity
  externalId: text('external_id').notNull(),                    // From sports data provider
  sport: text('sport').notNull(),                               // football | basketball | baseball | soccer | hockey | mma | tennis
  league: text('league').notNull(),                             // NFL | NBA | MLB | EPL | UFC | ...
  season: text('season'),                                       // "2025-2026"
  week: integer('week'),                                        // Week number (for NFL etc.)

  // Teams / Participants
  homeTeam: text('home_team').notNull(),
  homeTeamId: text('home_team_id'),
  homeTeamLogo: text('home_team_logo'),
  awayTeam: text('away_team').notNull(),
  awayTeamId: text('away_team_id'),
  awayTeamLogo: text('away_team_logo'),

  // Timing
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  currentPeriod: text('current_period'),                        // "Q2", "Half", "3rd Set", etc.
  periodTime: text('period_time'),                              // "4:32" remaining in period

  // Status
  status: text('status').default('scheduled'),                  // scheduled | pregame | live | halftime | finished | cancelled | postponed

  // Scores
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  periodScores: jsonb('period_scores').$type<Array<{
    period: string;
    homeScore: number;
    awayScore: number;
  }>>(),

  // Result
  winner: text('winner'),                                       // home | away | draw
  resultCertified: boolean('result_certified').default(false),
  certifiedAt: timestamp('certified_at'),

  // Odds (from odds providers)
  odds: jsonb('odds').$type<{
    moneyline?: { home: number; away: number; draw?: number };
    spread?: { home: number; homeOdds: number; away: number; awayOdds: number };
    total?: { over: number; overOdds: number; under: number; underOdds: number };
    provider?: string;
    updatedAt?: string;
  }>(),

  // Additional stats
  stats: jsonb('stats').$type<Record<string, unknown>>(),       // Sport-specific stats

  // Oracle publication
  publishedAt: timestamp('published_at'),
  publishTxHash: text('publish_tx_hash'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  externalUnq: uniqueIndex('sports_external_unq').on(t.externalId),
  sportLeagueIdx: index('sports_sport_league_idx').on(t.sport, t.league),
  startTimeIdx: index('sports_start_time_idx').on(t.startTime),
  statusIdx: index('sports_status_idx').on(t.status),
}));
```

### Core Interface

```typescript
export class OracleService {
  // ── Price Feeds ──────────────────────────────────────────────────────
  getPrice(pair: string): Promise<PriceFeed>;
  getPrices(pairs: string[]): Promise<PriceFeed[]>;
  getPriceHistory(pair: string, interval: CandleInterval, limit?: number): Promise<PriceCandle[]>;
  subscribePrices(pairs: string[], callback: (update: PriceFeed) => void): Unsubscribe;

  // ── Feed Management ──────────────────────────────────────────────────
  createFeed(input: CreateOracleFeedInput): Promise<OracleFeed>;
  updateFeed(feedId: string, input: UpdateFeedInput): Promise<OracleFeed>;
  triggerUpdate(feedId: string): Promise<OracleUpdate>;
  getFeedHealth(): Promise<FeedHealthReport>;

  // ── Staleness Detection ──────────────────────────────────────────────
  checkStaleness(): Promise<StalenessReport>;
  getStaleFeedAlerts(): Promise<StaleFeedAlert[]>;

  // ── Randomness (VRF) ────────────────────────────────────────────────
  requestRandomness(input: RandomnessRequest): Promise<{ requestId: string }>;
  getRandomnessResult(requestId: string): Promise<RandomnessResult | null>;
  commitRandomness(commitment: string): Promise<{ requestId: string }>;
  revealRandomness(requestId: string, secret: string): Promise<RandomnessResult>;

  // ── Sports ───────────────────────────────────────────────────────────
  getSportsEvents(filters: SportsEventFilters): Promise<PaginatedResult<SportsEvent>>;
  getSportsEvent(eventId: string): Promise<SportsEvent>;
  getLiveEvents(sport?: string): Promise<SportsEvent[]>;
  getLeagues(sport?: string): Promise<League[]>;
  subscribeSportsEvent(eventId: string, callback: (update: SportsEvent) => void): Unsubscribe;
  certifyResult(eventId: string): Promise<SportsEvent>;
}
```

### Price Aggregator

```typescript
/**
 * PriceAggregator fetches from multiple oracle sources (Pyth, Switchboard, APIs)
 * and produces a single aggregated price using configurable aggregation methods.
 */
export class PriceAggregator {
  constructor(
    private cache: RedisClient,
    private config: AggregatorConfig,
  ) {}

  /**
   * Aggregate price from all configured sources.
   * Handles source failures gracefully — as long as 1+ source responds, we return a result.
   */
  async aggregate(
    feed: OracleFeed,
  ): Promise<AggregatedPrice> {
    // 1. Fetch from all sources in parallel with timeout
    const results = await Promise.allSettled(
      feed.sources.map(source =>
        this.fetchWithTimeout(source, this.config.sourceTimeoutMs)
      )
    );

    // 2. Extract valid results
    const validResults = results
      .filter((r): r is PromiseFulfilledResult<SourceResult> =>
        r.status === 'fulfilled' && r.value.value !== null
      )
      .map(r => r.value);

    if (validResults.length === 0) {
      throw new OracleError('NO_VALID_SOURCES', `All ${feed.sources.length} sources failed for feed ${feed.slug}`);
    }

    // 3. Outlier rejection (if enabled)
    let filteredResults = validResults;
    if (feed.outlierRejection && validResults.length >= 3) {
      filteredResults = this.rejectOutliers(validResults, Number(feed.outlierSigma));
    }

    // 4. Aggregate based on method
    const values = filteredResults.map(r => r.value);
    const weights = filteredResults.map(r => {
      const source = feed.sources.find(s => s.name === r.source);
      return source?.weight ?? 1;
    });

    let aggregatedValue: number;
    switch (feed.aggregationMethod) {
      case 'median':
        aggregatedValue = this.median(values);
        break;
      case 'mean':
        aggregatedValue = this.mean(values);
        break;
      case 'weighted':
        aggregatedValue = this.weightedMean(values, weights);
        break;
      case 'first_valid':
        aggregatedValue = values[0];
        break;
      default:
        aggregatedValue = this.median(values);
    }

    // 5. Calculate confidence
    const spread = Math.max(...values) - Math.min(...values);
    const spreadPercent = spread / aggregatedValue;
    const confidence = Math.max(0, 1 - spreadPercent * 10); // Drops as spread increases

    return {
      value: aggregatedValue,
      confidence,
      sources: filteredResults,
      spread,
      numSources: filteredResults.length,
      outlierCount: validResults.length - filteredResults.length,
      aggregationMethod: feed.aggregationMethod ?? 'median',
      timestamp: new Date(),
    };
  }

  /** Fetch from a single source with timeout */
  private async fetchWithTimeout(source: OracleSource, timeoutMs: number): Promise<SourceResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      switch (source.type) {
        case 'pyth':
          return await this.fetchFromPyth(source);
        case 'switchboard':
          return await this.fetchFromSwitchboard(source);
        case 'api':
          return await this.fetchFromAPI(source, controller.signal);
        case 'chainlink':
          return await this.fetchFromChainlink(source);
        default:
          throw new Error(`Unknown source type: ${source.type}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Fetch price from Pyth Network */
  private async fetchFromPyth(source: OracleSource): Promise<SourceResult> {
    const connection = new Connection(this.config.solanaRpcUrl);
    const pythClient = new PythHttpClient(connection, getPythProgramKeyForCluster('mainnet-beta'));
    const data = await pythClient.getData();

    const product = data.products.find(p => p.symbol === source.pythSymbol);
    if (!product) throw new Error(`Pyth product not found: ${source.pythSymbol}`);

    const priceData = data.productPrice.get(product.symbol);
    if (!priceData || !priceData.price) throw new Error('No price data available');

    return {
      source: source.name,
      value: priceData.price,
      confidence: priceData.confidence ? 1 - (priceData.confidence / priceData.price) : 0.5,
      timestamp: new Date(),
      latencyMs: 0, // Measured by caller
    };
  }

  /** Fetch price from Switchboard V2 */
  private async fetchFromSwitchboard(source: OracleSource): Promise<SourceResult> {
    const connection = new Connection(this.config.solanaRpcUrl);
    const aggregatorPubkey = new PublicKey(source.feedAddress!);
    const aggregatorAccount = new AggregatorAccount({
      program: await loadSwitchboardProgram('mainnet-beta', connection),
      publicKey: aggregatorPubkey,
    });

    const result = await aggregatorAccount.getLatestValue();

    return {
      source: source.name,
      value: result?.toNumber() ?? 0,
      confidence: 0.9, // Switchboard doesn't provide confidence directly
      timestamp: new Date(),
      latencyMs: 0,
    };
  }

  /** Reject outlier values using z-score method */
  private rejectOutliers(results: SourceResult[], sigma: number): SourceResult[] {
    const values = results.map(r => r.value);
    const mean = this.mean(values);
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );

    if (stdDev === 0) return results; // All values identical

    return results.filter(r => {
      const zScore = Math.abs((r.value - mean) / stdDev);
      const isOutlier = zScore > sigma;
      if (isOutlier) r.isOutlier = true;
      return !isOutlier;
    });
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private weightedMean(values: number[], weights: number[]): number {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    return values.reduce((sum, val, i) => sum + val * weights[i], 0) / totalWeight;
  }
}
```

### Staleness Detection

```typescript
/**
 * StalenessDetector monitors all oracle feeds and flags those that haven't
 * updated within their configured heartbeat interval.
 */
export class StalenessDetector {
  constructor(
    private db: Database,
    private eventBus: EventBus,
    private alertService: AlertService,
  ) {}

  /**
   * Check all active feeds for staleness.
   * Called by cron every 30 seconds.
   */
  async checkAll(): Promise<StalenessReport> {
    const feeds = await this.db.query.oracleFeeds.findMany({
      where: eq(oracleFeeds.status, 'active'),
    });

    const results: FeedStalenessResult[] = [];
    const now = new Date();

    for (const feed of feeds) {
      const heartbeat = feed.heartbeatSeconds ?? 60;
      const lastUpdate = feed.lastUpdated;

      if (!lastUpdate) {
        results.push({
          feedId: feed.id,
          slug: feed.slug,
          status: 'stale',
          reason: 'never_updated',
          secondsSinceUpdate: null,
          heartbeatSeconds: heartbeat,
        });
        continue;
      }

      const secondsSinceUpdate = (now.getTime() - lastUpdate.getTime()) / 1000;
      const isStale = secondsSinceUpdate > heartbeat;

      if (isStale && feed.status !== 'stale') {
        // Feed just became stale — update status and emit alert
        await this.db.update(oracleFeeds)
          .set({ status: 'stale', staleSince: now })
          .where(eq(oracleFeeds.id, feed.id));

        await this.eventBus.emit('oracle.feed.stale', {
          feedId: feed.id,
          slug: feed.slug,
          secondsSinceUpdate,
          heartbeatSeconds: heartbeat,
        });

        await this.alertService.create({
          type: 'oracle_stale',
          severity: 'warning',
          message: `Oracle feed "${feed.slug}" is stale (${Math.round(secondsSinceUpdate)}s since last update, heartbeat: ${heartbeat}s)`,
          metadata: { feedId: feed.id, slug: feed.slug },
        });
      }

      results.push({
        feedId: feed.id,
        slug: feed.slug,
        status: isStale ? 'stale' : 'healthy',
        reason: isStale ? 'heartbeat_exceeded' : null,
        secondsSinceUpdate: Math.round(secondsSinceUpdate),
        heartbeatSeconds: heartbeat,
      });
    }

    return {
      checkedAt: now,
      totalFeeds: feeds.length,
      healthyFeeds: results.filter(r => r.status === 'healthy').length,
      staleFeeds: results.filter(r => r.status === 'stale').length,
      feeds: results,
    };
  }
}
```

### Key Behaviors

1. **Multi-source aggregation**: Every price feed can be configured with multiple sources (Pyth, Switchboard, custom APIs). The aggregator fetches all in parallel and combines them. Even if some sources fail, the feed continues as long as at least one responds.
2. **Outlier rejection**: When 3+ sources are available, the aggregator uses z-score outlier rejection (default σ=3) to discard anomalous values from a single source that may be stale, manipulated, or erroneously reported.
3. **Staleness detection**: A cron job checks all feeds every 30 seconds. If a feed hasn't updated within its `heartbeatSeconds` window, it's marked as `stale` and an alert is emitted. Business logic consuming stale feeds receives a warning.
4. **Deviation-based updates**: Feeds only publish new values when the price changes by more than the `deviationThresholdPercent` (default 0.5%). This reduces unnecessary writes and on-chain transactions.
5. **Commit-reveal randomness**: For off-chain randomness (e.g., BetEdge lottery draws), the module implements a commit-reveal scheme: the server commits a hash of a secret, then reveals the secret after bets are locked. The random outcome = hash(secret + user seed).
6. **Sports result certification**: Sports events go through `scheduled → live → finished` states. Results are only marked as `certified` after manual review or multiple source confirmation. Only certified results trigger bet settlement.
7. **WebSocket streaming**: Price feeds and sports events support real-time WebSocket subscriptions. Clients subscribe to specific pairs or events and receive push updates.

---

## Module: attestation

### Purpose

The Attestation module provides **on-chain identity verification and credentialing** for the MCV ecosystem. It enables ventures to issue, manage, and verify attestations — cryptographic statements about a user (KYC status, age verification, jurisdiction, accredited investor status) — that can be checked both off-chain (fast DB lookup) and on-chain (trustless verification via EAS patterns adapted for Solana).

This module powers:
- **BetEdge**: Age verification (21+), jurisdiction checks (legal gambling states), responsible gambling attestations
- **Full Gain**: KYC for grant disbursement, accredited investor verification for equity grants
- **Futurestate**: Accredited investor attestation for real estate token sales
- **All ventures**: Identity verification, reputation scoring, verifiable credentials

### Attestation Verification Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ATTESTATION VERIFICATION FLOW                         │
│                                                                          │
│  User wants to access age-gated feature on BetEdge                      │
│                                                                          │
│  ┌──────────────┐                                                       │
│  │ 1. Start     │  attestation.verification.start({                     │
│  │    KYC Flow  │    schemaId: 'age-verification',                      │
│  │              │    walletAddress: 'GKv4...',                           │
│  │              │    provider: 'sumsub'                                  │
│  │              │  })                                                    │
│  └──────┬───────┘                                                       │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────┐  ┌──────────────┐                                    │
│  │ 2. Provider  │  │ SumSub SDK   │  User completes ID verification     │
│  │    Widget    │─▶│ (embedded)   │  • Upload photo ID                  │
│  │              │  │              │  • Selfie liveness check             │
│  │              │  │              │  • Document verification             │
│  └──────────────┘  └──────┬───────┘                                    │
│                           │ Webhook                                     │
│                           ▼                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ 3. Process   │  │ 4. Create    │  │ 5. Publish   │                 │
│  │    Webhook   │─▶│    Attesta-  │─▶│    On-Chain   │                 │
│  │              │  │    tion      │  │    (optional) │                 │
│  │  Verify sig  │  │              │  │              │                 │
│  │  Extract data│  │  status: ✓   │  │  EAS attest  │                 │
│  │  Check rules │  │  data: {     │  │  Solana txn  │                 │
│  │              │  │   age: 25,   │  │              │                 │
│  │              │  │   country:US │  │              │                 │
│  │              │  │  }           │  │              │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│                                                                          │
│  Later: Feature access check                                            │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ 6. Check     │  │ 7. DB lookup │  │ 8. Grant     │                 │
│  │    Gate      │─▶│    (fast)    │─▶│    Access     │                 │
│  │              │  │              │  │              │                 │
│  │  checkAttest │  │  Has valid   │  │  User can    │                 │
│  │  (wallet,    │  │  age ≥ 21    │  │  place bets  │                 │
│  │   type:age)  │  │  attestation │  │              │                 │
│  │              │  │  → YES ✓     │  │              │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```typescript
// ── attestation_schema — Attestation Schema Definitions ────────────────
export const attestationSchemas = pgTable('attestation_schema', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id'),                                // null = global schema

  // Identity
  name: text('name').notNull(),                                 // "Age Verification"
  slug: text('slug').notNull(),                                 // "age-verification"
  description: text('description'),
  version: integer('version').default(1),                       // Schema version

  // Type
  type: attestationTypeEnum('type').notNull(),                  // kyc | aml | age | accredited | jurisdiction | identity | credential | custom

  // Schema definition (fields the attestation contains)
  schema: jsonb('schema').$type<{
    fields: Array<{
      name: string;                                             // Field name
      type: 'string' | 'number' | 'boolean' | 'date' | 'address';
      required: boolean;
      private?: boolean;                                        // Encrypted, not in public attestation
      description?: string;
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        enum?: string[];
      };
    }>;
  }>().notNull(),

  // Verification requirements
  verificationRequirements: jsonb('verification_requirements').$type<{
    providers?: string[];                                       // Accepted KYC providers
    minAge?: number;                                            // Minimum age requirement
    allowedJurisdictions?: string[];                             // ISO country codes
    blockedJurisdictions?: string[];                             // Blocked countries
    requiredDocuments?: string[];                                // passport | drivers_license | id_card
    livenessCheck?: boolean;                                    // Require selfie liveness
    pofRequired?: boolean;                                      // Proof of funds
    accreditedInvestorMinIncome?: number;                        // Min income for accredited status
    accreditedInvestorMinNetWorth?: number;                      // Min net worth
  }>(),

  // On-chain schema (if published)
  chain: chainEnum('chain'),
  onChainSchemaId: text('on_chain_schema_id'),                  // EAS schema ID
  resolverAddress: text('resolver_address'),                    // On-chain resolver contract
  resolverProgramId: text('resolver_program_id'),               // Solana resolver program

  // Validity
  defaultValidityDays: integer('default_validity_days').default(365),
  isRevocable: boolean('is_revocable').default(true),
  requiresRenewal: boolean('requires_renewal').default(false),  // Must re-verify before expiry

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  slugUnq: uniqueIndex('schema_slug_unq').on(t.slug),
  typeIdx: index('schema_type_idx').on(t.type),
}));

// ── attestation — Attestation Records ──────────────────────────────────
export const attestations = pgTable('attestation', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id'),
  schemaId: text('schema_id').notNull().references(() => attestationSchemas.id),

  // Subject (who the attestation is about)
  subjectType: text('subject_type').default('wallet'),          // wallet | user | organization
  subjectId: text('subject_id'),                                // userId or orgId
  subjectAddress: text('subject_address').notNull(),            // Wallet address

  // Attester (who issued the attestation)
  attesterId: text('attester_id'),                              // userId of attester
  attesterAddress: text('attester_address'),                    // Attester wallet address
  attesterName: text('attester_name'),                          // "SumSub", "MCV Identity Service"

  // Status
  status: attestationStatusEnum('status').default('pending'),   // pending | verified | rejected | expired | revoked

  // Data (the actual attestation content)
  data: jsonb('data').$type<Record<string, unknown>>().notNull(),
  // e.g., { age: 25, country: "US", state: "NY", verified: true }
  privateData: jsonb('private_data').$type<Record<string, unknown>>(),
  // Encrypted data (SSN, full DOB, etc.) — never exposed in public APIs
  dataHash: text('data_hash'),                                  // SHA-256 hash of data JSON (for on-chain verification)

  // On-chain reference
  chain: chainEnum('chain'),
  attestationUid: text('attestation_uid'),                      // EAS attestation UID
  txHash: text('tx_hash'),
  onChainData: jsonb('on_chain_data').$type<{
    schemaId: string;
    encodedData: string;
    refUID?: string;                                            // Reference to another attestation
  }>(),

  // Validity
  issuedAt: timestamp('issued_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  revokedAt: timestamp('revoked_at'),
  revokeReason: text('revoke_reason'),
  revokedBy: text('revoked_by'),

  // Renewal
  renewedFromId: text('renewed_from_id'),                       // Previous attestation this renews
  renewalReminder: timestamp('renewal_reminder'),               // When to send renewal reminder

  // Verification source
  verificationProvider: text('verification_provider'),          // sumsub | jumio | veriff | manual
  verificationId: text('verification_id'),                      // Provider's reference ID
  verificationScore: numeric('verification_score', { precision: 5, scale: 2 }),  // Provider confidence score

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  subjectAddressIdx: index('attestation_subject_idx').on(t.subjectAddress),
  schemaStatusIdx: index('attestation_schema_status_idx').on(t.schemaId, t.status),
  expiresIdx: index('attestation_expires_idx').on(t.expiresAt),
  ventureIdx: index('attestation_venture_idx').on(t.ventureId),
}));

// ── attestation_verification_request — KYC Request Queue ───────────────
export const verificationRequests = pgTable('attestation_verification_request', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  schemaId: text('schema_id').notNull().references(() => attestationSchemas.id),

  // Subject
  userId: text('user_id').notNull(),
  walletAddress: text('wallet_address').notNull(),

  // Provider
  provider: text('provider').notNull(),                         // sumsub | jumio | veriff | manual
  externalId: text('external_id'),                              // Provider's applicant/session ID
  sdkToken: text('sdk_token'),                                  // Token for embedding provider SDK

  // Status
  status: text('status').default('pending'),                    // pending | processing | completed | failed | expired
  errorMessage: text('error_message'),

  // Result
  result: jsonb('result').$type<{
    passed: boolean;
    reasons?: string[];
    data?: Record<string, unknown>;
    score?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    documentType?: string;
    documentCountry?: string;
  }>(),

  // Created attestation (if passed)
  attestationId: text('attestation_id').references(() => attestations.id),

  // Webhook
  webhookReceived: boolean('webhook_received').default(false),
  webhookReceivedAt: timestamp('webhook_received_at'),
  webhookData: jsonb('webhook_data'),

  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),                           // Request expires after 24h
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  userVentureIdx: index('verify_req_user_venture_idx').on(t.userId, t.ventureId),
  statusIdx: index('verify_req_status_idx').on(t.status),
  externalIdx: index('verify_req_external_idx').on(t.provider, t.externalId),
}));

// ── attestation_check — Verification Check Log ────────────────────────
export const attestationChecks = pgTable('attestation_check', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),

  // What was checked
  checkType: attestationTypeEnum('check_type').notNull(),
  subjectAddress: text('subject_address').notNull(),

  // Requirements
  requirements: jsonb('requirements').$type<Record<string, unknown>>(),

  // Result
  passed: boolean('passed').notNull(),
  attestationId: text('attestation_id').references(() => attestations.id),
  failureReason: text('failure_reason'),

  // Context
  requesterId: text('requester_id'),
  requesterAddress: text('requester_address'),
  context: text('context'),                                     // token_sale | airdrop | bet_placement | grant_application
  ventureId: text('venture_id'),

  // Timing
  latencyMs: integer('latency_ms'),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
}, (t) => ({
  subjectIdx: index('check_subject_idx').on(t.subjectAddress),
  checkTypeIdx: index('check_type_idx').on(t.checkType),
  contextIdx: index('check_context_idx').on(t.context),
}));

// ── reputation_score — Computed Reputation Scores ──────────────────────
export const reputationScores = pgTable('reputation_score', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id'),
  userId: text('user_id'),
  walletAddress: text('wallet_address').notNull(),

  // Overall score
  score: numeric('score', { precision: 6, scale: 2 }).notNull(),  // 0-1000
  tier: text('tier').notNull(),                                    // newcomer | bronze | silver | gold | platinum | diamond
  percentile: numeric('percentile', { precision: 5, scale: 2 }),   // 0-100

  // Factor breakdown
  factors: jsonb('factors').$type<Array<{
    name: string;                                                  // wallet_age | transaction_count | nft_holdings | attestation_count | ...
    value: number;
    weight: number;
    score: number;                                                 // Weighted contribution to total
    description: string;
  }>>().notNull(),

  // History
  previousScore: numeric('previous_score', { precision: 6, scale: 2 }),
  scoreChange: numeric('score_change', { precision: 6, scale: 2 }),
  lastCalculated: timestamp('last_calculated').defaultNow(),

  // On-chain (if published)
  chain: chainEnum('chain'),
  attestationId: text('attestation_id').references(() => attestations.id),
  txHash: text('tx_hash'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  walletUnq: uniqueIndex('reputation_wallet_unq').on(t.walletAddress),
  userVentureIdx: index('reputation_user_venture_idx').on(t.userId, t.ventureId),
  tierIdx: index('reputation_tier_idx').on(t.tier),
  scoreIdx: index('reputation_score_idx').on(t.score),
}));

// ── verifiable_credential — W3C Verifiable Credentials Store ───────────
export const verifiableCredentials = pgTable('verifiable_credential', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id'),
  attestationId: text('attestation_id').references(() => attestations.id),

  // Subject
  subjectDid: text('subject_did').notNull(),                    // did:sol:<address> or did:ethr:<address>
  subjectAddress: text('subject_address').notNull(),

  // Credential identity
  credentialType: text('credential_type').notNull(),            // VerifiableCredential, KYCCredential, AgeCredential, etc.
  issuer: text('issuer').notNull(),                             // DID of issuer
  issuerName: text('issuer_name'),                              // Human-readable issuer name

  // Credential data (W3C VC Data Model 2.0)
  credential: jsonb('credential').$type<{
    '@context': string[];
    type: string[];
    credentialSubject: Record<string, unknown>;
    issuer: string | { id: string; name?: string };
    issuanceDate: string;
    expirationDate?: string;
    credentialStatus?: {
      id: string;
      type: string;
      statusPurpose: string;
      statusListIndex: number;
      statusListCredential: string;
    };
    proof?: {
      type: string;
      created: string;
      verificationMethod: string;
      proofPurpose: string;
      proofValue: string;
    };
  }>().notNull(),

  // Selective disclosure
  disclosableFields: jsonb('disclosable_fields').$type<string[]>(),

  // Status
  isValid: boolean('is_valid').default(true),
  revokedAt: timestamp('revoked_at'),

  // Validity
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  subjectIdx: index('vc_subject_idx').on(t.subjectAddress),
  attestationIdx: index('vc_attestation_idx').on(t.attestationId),
  typeIdx: index('vc_type_idx').on(t.credentialType),
}));
```

### Core Interface

```typescript
export class AttestationService {
  // ── Schema Management ────────────────────────────────────────────────
  createSchema(input: CreateSchemaInput): Promise<AttestationSchema>;
  updateSchema(schemaId: string, input: UpdateSchemaInput): Promise<AttestationSchema>;
  deploySchemaOnChain(schemaId: string, chain: Chain): Promise<{ schema: AttestationSchema; txHash: string }>;
  getSchema(schemaId: string): Promise<AttestationSchema>;
  listSchemas(filters?: SchemaFilters): Promise<AttestationSchema[]>;

  // ── Attestation Lifecycle ────────────────────────────────────────────
  createAttestation(input: CreateAttestationInput): Promise<Attestation>;
  getAttestation(attestationId: string): Promise<Attestation>;
  revokeAttestation(attestationId: string, reason: string, revokedBy: string): Promise<Attestation>;
  renewAttestation(attestationId: string): Promise<Attestation>;
  publishOnChain(attestationId: string, chain: Chain): Promise<{ attestation: Attestation; txHash: string }>;

  // ── Verification ─────────────────────────────────────────────────────
  checkAttestation(address: string, type: AttestationType, requirements?: Record<string, unknown>): Promise<AttestationCheckResult>;
  checkMultiple(address: string, checks: AttestationCheck[]): Promise<AttestationCheckResult[]>;
  getAttestationsForAddress(address: string, filters?: AttestationFilters): Promise<Attestation[]>;

  // ── KYC Verification Flows ───────────────────────────────────────────
  startVerification(input: StartVerificationInput): Promise<VerificationRequest>;
  getVerificationStatus(requestId: string): Promise<VerificationRequest>;
  processWebhook(provider: string, payload: unknown, signature: string): Promise<void>;

  // ── Verifiable Credentials ───────────────────────────────────────────
  issueCredential(input: IssueCredentialInput): Promise<VerifiableCredential>;
  verifyCredential(credential: unknown): Promise<{ valid: boolean; errors?: string[] }>;
  revokeCredential(credentialId: string): Promise<void>;
  generateSelectiveDisclosure(credentialId: string, fields: string[]): Promise<SelectiveDisclosure>;

  // ── Reputation ───────────────────────────────────────────────────────
  calculateReputation(input: ReputationScoreInput): Promise<ReputationScore>;
  getReputation(address: string, ventureId?: string): Promise<ReputationScore | null>;
  publishReputationOnChain(scoreId: string, chain: Chain): Promise<{ txHash: string }>;
}
```

### Key Behaviors

1. **Privacy-first design**: Private attestation data (SSN, full DOB, government ID numbers) is encrypted at rest and never exposed through public APIs. Only the `data` field (non-sensitive assertions like "age ≥ 21") is accessible. Selective disclosure allows users to prove specific claims without revealing the full attestation.
2. **KYC provider integration**: The module integrates with SumSub, Jumio, and Veriff for identity verification. Provider SDKs are embedded in the client via `KYCFlow` component. Webhook callbacks update verification status asynchronously.
3. **On-chain publication**: Attestations can optionally be published on-chain using an EAS-inspired pattern adapted for Solana. The on-chain attestation contains only the `dataHash` (SHA-256 of the data JSON), preserving privacy while enabling trustless verification.
4. **Attestation expiry and renewal**: Attestations have configurable validity periods (default 365 days). The system sends renewal reminders before expiry. Expired attestations fail verification checks.
5. **Reputation scoring**: The reputation engine analyzes wallet age, transaction count, NFT holdings, attestation count, DeFi activity, and other factors to compute a 0-1000 score with tier classification (newcomer → diamond). Scores are recalculated daily.
6. **W3C Verifiable Credentials**: The module supports issuing W3C VC Data Model 2.0 credentials, enabling interoperability with external verifiers and wallets that support the VC standard.
7. **Cross-venture attestation**: An attestation issued for one venture (e.g., KYC for BetEdge) can be reused across other MCV ventures if the schema type matches, avoiding duplicate verification.

---

## Code Examples

### Example 1: Connect Wallet and Verify Ownership

```typescript
import { walletService, PhantomAdapter, createWalletAdapterRegistry } from '@mcv/web3-public';

// Create adapter registry and detect installed wallets
const registry = createWalletAdapterRegistry({ autoDetect: true });

// Get recommended adapter for Solana
const adapter = await registry.getRecommended('solana');

if (!adapter) {
  throw new Error('No Solana wallet detected. Please install Phantom or Solflare.');
}

// Connect to wallet
const connection = await adapter.connect();
console.log('Connected:', connection.address);

// Generate nonce for verification
const { nonce, message } = await walletService.generateNonce(
  connection.address,
  'solana',
  ctx.ip
);

// Sign the nonce message with the wallet
const signature = await adapter.signMessage(message);

// Verify signature and link wallet to user
const result = await walletService.verifyAndLink({
  address: connection.address,
  chain: 'solana',
  signature,
  nonce,
  provider: adapter.name.toLowerCase(),
  userId: ctx.user?.id,    // undefined for new users
  ventureId: ctx.ventureId,
});

console.log('Wallet linked:', result.wallet.id);
console.log('Session token:', result.session.sessionToken);
console.log('New user?', result.isNewUser);
```

### Example 2: Mint an NFT from a Collection

```typescript
import { nftService, mintingService, collectionService } from '@mcv/web3-public';

// Get collection info
const collection = await collectionService.getCollectionStats('betedge-founders-pass');
console.log(`Supply: ${collection.currentSupply}/${collection.maxSupply}`);
console.log(`Floor price: ${collection.floorPrice} SOL`);

// Create a mint request
const mintRequest = await mintingService.requestMint({
  collectionId: collection.id,
  walletAddress: 'GKv4wD7GhZfSMP4JAATVeAMJRg4vTS4jSs1KLMTbCRCf',
  quantity: 1,
  mintPhase: 'public',
});

console.log('Mint request created:', mintRequest.id);
console.log('Price:', mintRequest.totalPrice, 'SOL');

// After user pays, confirm payment
await mintingService.confirmMintPayment(mintRequest.id, paymentTxHash);

// Execute the mint (builds Metaplex transaction, signs, submits)
const { nfts, txHashes } = await mintingService.executeMint(mintRequest.id);

for (const nft of nfts) {
  console.log(`Minted: ${nft.name} (${nft.mintAddress})`);
}
```

### Example 3: Query Oracle Price Feed

```typescript
import { oracleService, priceAggregator } from '@mcv/web3-public';

// Get current SOL/USD price
const solPrice = await oracleService.getPrice('SOL/USD');
console.log(`SOL/USD: $${solPrice.value} (confidence: ${solPrice.confidence})`);
console.log(`24h change: ${solPrice.change24h}%`);
console.log(`Sources: ${solPrice.numActiveSources}`);

// Subscribe to real-time price updates
const unsubscribe = oracleService.subscribePrices(
  ['SOL/USD', 'BTC/USD', 'ETH/USD'],
  (update) => {
    console.log(`${update.pair}: $${update.value} (${update.change24h > 0 ? '+' : ''}${update.change24h}%)`);
  }
);

// Get candle data for charting
const candles = await oracleService.getPriceHistory('SOL/USD', '1h', 24);
for (const candle of candles) {
  console.log(`${candle.timestamp}: O=${candle.open} H=${candle.high} L=${candle.low} C=${candle.close}`);
}
```

### Example 4: Check KYC Attestation for Feature Access

```typescript
import { attestationService, verificationService } from '@mcv/web3-public';

// Check if user has age verification attestation
const ageCheck = await attestationService.checkAttestation(
  'GKv4wD7GhZfSMP4JAATVeAMJRg4vTS4jSs1KLMTbCRCf',
  'age',
  { minAge: 21 }
);

if (ageCheck.passed) {
  console.log('User is verified 21+. Granting access.');
} else {
  console.log('User needs age verification:', ageCheck.failureReason);

  // Start KYC verification flow
  const verification = await verificationService.startVerification({
    schemaId: 'age-verification',
    walletAddress: 'GKv4wD7GhZfSMP4JAATVeAMJRg4vTS4jSs1KLMTbCRCf',
    userId: ctx.user.id,
    ventureId: 'betedge',
    provider: 'sumsub',
  });

  console.log('Verification started. SDK token:', verification.sdkToken);
  // Embed SumSub SDK with this token for the user to complete verification
}
```

### Example 5: NFT-Gated Content with React Hooks

```tsx
import { useNFTGate, useWallet, useAttestation } from '@mcv/web3-public';

function PremiumContent() {
  const { wallet } = useWallet();

  const { allowed, loading: gateLoading } = useNFTGate({
    resourceType: 'content',
    resourceId: 'premium-dashboard',
    walletAddress: wallet?.address,
  });

  const { attestation, loading: attestLoading } = useAttestation({
    type: 'kyc',
    walletAddress: wallet?.address,
  });

  if (gateLoading || attestLoading) return <Spinner />;

  if (!allowed) {
    return (
      <div>
        <h2>NFT Required</h2>
        <p>You need a BetEdge Founders Pass to access this content.</p>
        <NFTMintButton collectionSlug="betedge-founders-pass" />
      </div>
    );
  }

  if (!attestation || attestation.status !== 'verified') {
    return <KYCFlow schemaId="age-verification" />;
  }

  return <PremiumDashboard />;
}
```

### Example 6: Request Verifiable Randomness (BetEdge)

```typescript
import { oracleService } from '@mcv/web3-public';

// Request VRF for a provably fair lottery draw
const { requestId } = await oracleService.requestRandomness({
  ventureId: 'betedge',
  requesterAddress: 'BetEdgeProgramAddress...',
  numWords: 5,        // 5 random numbers for lottery
  seed: 'draw-2026-02-08',
});

// Poll for result (or use webhook)
let result = null;
while (!result) {
  result = await oracleService.getRandomnessResult(requestId);
  if (!result) await sleep(2000);
}

console.log('Random words:', result.randomWords);
console.log('Proof:', result.proof);
// Proof can be verified on-chain for provable fairness
```

### Example 7: Compressed NFT Minting (Bulk Loyalty NFTs)

```typescript
import { mintingService } from '@mcv/web3-public';

// Mint 10,000 loyalty NFTs using compressed NFTs (cNFTs)
// Cost: ~0.5 SOL instead of ~120 SOL for traditional NFTs
const { nft, proof } = await mintingService.mintCompressed({
  collectionId: 'betedge-loyalty',
  walletAddress: recipientWallet,
  metadata: {
    name: `BetEdge Loyalty Badge #${badgeNumber}`,
    description: 'Awarded for 100 bets placed on BetEdge',
    image: 'https://arweave.net/loyalty-badge.png',
    attributes: [
      { trait_type: 'Achievement', value: '100 Bets' },
      { trait_type: 'Tier', value: 'Silver' },
      { trait_type: 'Season', value: '2026 Q1' },
    ],
  },
});

console.log('cNFT minted:', nft.assetId);
console.log('Merkle proof stored for transfers');
```

---

## Error Codes

| Code | HTTP Status | Description | User Message |
|------|-------------|-------------|--------------|
| `WALLET_NOT_FOUND` | 404 | Wallet not found in DB | Wallet not found |
| `WALLET_ALREADY_LINKED` | 409 | Wallet already linked to another user | This wallet is already connected to another account |
| `WALLET_SIGNATURE_INVALID` | 401 | Signature verification failed | Signature verification failed. Please try again |
| `WALLET_NONCE_EXPIRED` | 401 | Nonce has expired (>5 min) | Verification expired. Please try again |
| `WALLET_NONCE_USED` | 401 | Nonce already consumed | This verification has already been used |
| `WALLET_SESSION_EXPIRED` | 401 | Wallet session has expired | Wallet session expired. Please reconnect |
| `WALLET_PROVIDER_UNAVAILABLE` | 503 | Wallet extension not detected | Wallet not detected. Please install or enable it |
| `NFT_COLLECTION_NOT_FOUND` | 404 | Collection doesn't exist | Collection not found |
| `NFT_COLLECTION_SOLD_OUT` | 409 | Collection max supply reached | This collection is sold out |
| `NFT_MINT_LIMIT_EXCEEDED` | 429 | Per-wallet mint limit reached | You've reached the maximum mint limit |
| `NFT_MINT_PHASE_INACTIVE` | 403 | Current mint phase not active | Minting is not currently available |
| `NFT_NOT_OWNER` | 403 | User doesn't own the NFT | You don't own this NFT |
| `NFT_ALREADY_LISTED` | 409 | NFT already listed for sale | This NFT is already listed |
| `NFT_GATE_DENIED` | 403 | NFT gate check failed | You need the required NFT to access this |
| `ORACLE_FEED_NOT_FOUND` | 404 | Oracle feed doesn't exist | Price feed not available |
| `ORACLE_FEED_STALE` | 503 | Feed hasn't updated within heartbeat | Price data is temporarily unavailable |
| `ORACLE_NO_VALID_SOURCES` | 503 | All oracle sources failed | Unable to fetch price data |
| `ORACLE_VRF_TIMEOUT` | 504 | VRF request not fulfilled in time | Randomness request timed out |
| `ATTESTATION_NOT_FOUND` | 404 | Attestation doesn't exist | Verification not found |
| `ATTESTATION_EXPIRED` | 403 | Attestation has expired | Your verification has expired. Please re-verify |
| `ATTESTATION_REVOKED` | 403 | Attestation was revoked | Your verification has been revoked |
| `ATTESTATION_REQUIRED` | 403 | Required attestation missing | Verification required to access this feature |
| `VERIFICATION_FAILED` | 400 | KYC verification rejected | Verification was not successful |
| `VERIFICATION_PROVIDER_ERROR` | 502 | KYC provider returned error | Verification service temporarily unavailable |
| `REPUTATION_INSUFFICIENT` | 403 | Reputation score too low | Your reputation score is below the minimum requirement |

---

## Security Considerations

### Wallet Security
- **Signature verification**: Every wallet link requires a cryptographic signature over a server-generated nonce. Solana uses `nacl.sign.detached.verify()`, EVM uses `ecrecover()`.
- **Nonce anti-replay**: Nonces are single-use, expire in 5 minutes, and are bound to the requesting IP address.
- **Session isolation**: Wallet sessions are separate from auth sessions. Revoking one doesn't affect the other.
- **Custodial key management**: KMS wallets use AWS KMS or HashiCorp Vault. Private keys never leave the HSM.

### NFT Security
- **Royalty enforcement**: Programmable NFTs (pNFTs) enforce royalties at the protocol level. Non-pNFT royalties are enforced by marketplace cooperation.
- **Metadata immutability**: After collection freeze, metadata URIs are locked on-chain. Off-chain metadata on Arweave is inherently immutable.
- **Mint payment verification**: Payments are verified on-chain before minting. The mint queue processes only confirmed transactions.

### Oracle Security
- **Multi-source validation**: Prices are never taken from a single source. Outlier rejection prevents manipulation of one source from affecting the aggregate.
- **Staleness alerts**: Stale feeds trigger alerts and are flagged in API responses. Business logic should check staleness before using oracle data.
- **VRF provability**: On-chain VRF proofs can be verified by anyone, ensuring fairness for gaming and lottery operations.

### Attestation Security
- **Data encryption**: Private attestation data is encrypted with AES-256-GCM. Decryption keys are managed via the secrets vault.
- **Webhook verification**: All KYC provider webhooks are verified using HMAC signatures before processing.
- **Selective disclosure**: Users can prove specific claims (e.g., "age ≥ 21") without revealing the underlying data (full DOB).
- **On-chain privacy**: Only data hashes are published on-chain. The actual attestation data remains off-chain in the encrypted database.

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/web3-core` | * | Internal blockchain infrastructure, SPL token operations |
| `@mcv/identity` | * | User-to-wallet linking, auth session integration |
| `@mcv/ui` | * | Wallet connect UI components, theming |
| `@mcv/fabric` | * | Event bus, NFT media storage |
| `@mcv/db` | * | PostgreSQL database access (Drizzle ORM) |
| `@mcv/cache` | * | Redis caching for balances, prices |
| `@mcv/secrets` | * | API key and KMS key management |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@solana/web3.js` | ^1.95 | Solana RPC interactions, keypairs, transactions |
| `@coral-xyz/anchor` | ^0.30 | Program-derived accounts, IDL parsing |
| `@metaplex-foundation/js` | ^0.20 | NFT minting, metadata, Candy Machine |
| `@metaplex-foundation/bubblegum` | ^4.2 | Compressed NFTs (cNFTs) |
| `@pythnetwork/client` | ^2.22 | Pyth price feeds |
| `@switchboard-xyz/solana.js` | ^3.0 | Switchboard oracle feeds, VRF |
| `@ethereum-attestation-service/eas-sdk` | ^2.0 | EAS attestations (cross-chain) |
| `tweetnacl` | ^1.0 | Ed25519 signature verification |
| `merkletreejs` | ^0.4 | Merkle tree for whitelist proofs, cNFTs |
| `viem` | ^2.21 | EVM chain interactions |

---

## Environment Variables

```bash
# Solana RPC
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...
SOLANA_RPC_WS_URL=wss://mainnet.helius-rpc.com/?api-key=...

# Metaplex / NFT Storage
ARWEAVE_GATEWAY=https://arweave.net
BUNDLR_NODE=https://node1.bundlr.network
NFT_STORAGE_API_KEY=

# Oracle Providers
PYTH_PROGRAM_ID=FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH
SWITCHBOARD_PROGRAM_ID=SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f

# KYC Providers
SUMSUB_APP_TOKEN=
SUMSUB_SECRET_KEY=
SUMSUB_WEBHOOK_SECRET=
VERIFF_API_KEY=
VERIFF_WEBHOOK_SECRET=

# EAS (Cross-chain attestation)
EAS_CONTRACT_ADDRESS=0xA1207F3BBa224E2c9c3c6D5aF63D816e64D54321
EAS_SCHEMA_REGISTRY=0xA7b39296258348C78294F95B872b282326A97BDF

# KMS (Custodial wallets)
AWS_KMS_KEY_ID=
AWS_KMS_REGION=us-east-1
```

---

*@mcv/web3-public — Web3 Public Domain Module — The Consumer-Facing Web3 Layer*