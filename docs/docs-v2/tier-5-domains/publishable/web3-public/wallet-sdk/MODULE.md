# @mcv/web3-public/wallet-sdk — Wallet SDK Module

**Parent Package:** @mcv/web3-public  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Purpose

The Wallet SDK module provides a **unified, provider-agnostic interface** for connecting to Web3 wallets across multiple blockchains and wallet providers. It is the foundational Web3 layer that every other blockchain operation in the MCV ecosystem depends on — you cannot mint an NFT, check a price feed with wallet context, or create an attestation without first establishing a wallet connection through this module.

**This is the front door to Web3 for every MCV venture.** Every user interaction with blockchain features begins here.

The SDK implements the **Wallet Adapter pattern** (inspired by `@solana/wallet-adapter`) with a universal registry that auto-detects installed browser wallet extensions, handles the complete connection/disconnection lifecycle, manages sessions with configurable TTL, verifies wallet ownership via cryptographic signatures, and provides consistent signing interfaces regardless of the underlying wallet provider.

### Supported Wallet Providers

| Provider | Type | Chain(s) | Connection Method |
|----------|------|----------|-------------------|
| **Phantom** | Self-custodial | Solana | Browser extension, mobile deep link |
| **Solflare** | Self-custodial | Solana | Browser extension, mobile deep link |
| **Backpack** | Self-custodial | Solana + xNFT | Browser extension |
| **MetaMask** | Self-custodial | EVM (ETH, Base, Polygon, Arbitrum) | Browser extension, mobile deep link |
| **Coinbase Wallet** | Self-custodial | EVM (ETH, Base) | Browser extension, WalletLink |
| **WalletConnect** | Protocol bridge | Multi-chain | QR code, deep link |
| **Privy** | Embedded | Multi-chain | Email/social login → wallet |
| **MCV KMS** | Custodial | Solana, EVM | Server-side (AWS KMS / Vault) |

### Venture Usage

- **BetEdge**: Wallet connect for placing bets, receiving winnings in SOL/USDC
- **MCV Studios**: Artist wallet linking, royalty recipient management, game asset wallets
- **SerpSpace**: Wallet-gated premium features, token staking wallet
- **Full Gain**: Grant recipient wallets, donor wallets, milestone payment addresses
- **Futurestate**: Real estate token holder wallets, investment wallets

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CORE SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  walletService,                     // Main wallet service (connection, verification, management)
} from './service';

export type {
  ConnectWalletInput,                // Initiate wallet connection
  LinkWalletInput,                   // Link additional wallet to existing account
  VerifyWalletInput,                 // Verify wallet ownership via signature
  SendTransactionInput,              // Submit a transaction for signing
  TransactionQueryOptions,           // Query options for transaction history
  WalletFilters,                     // Wallet list filtering
} from './service';

// ═══════════════════════════════════════════════════════════════════════════════
// WALLET ADAPTERS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  PhantomAdapter,                    // Phantom wallet adapter (Solana)
  SolflareAdapter,                   // Solflare wallet adapter (Solana)
  BackpackAdapter,                   // Backpack wallet adapter (Solana + xNFT)
  MetaMaskAdapter,                   // MetaMask adapter (EVM chains)
  CoinbaseWalletAdapter,             // Coinbase Wallet adapter (EVM)
  WalletConnectAdapter,              // WalletConnect v2 adapter (multi-chain)
  PrivyAdapter,                      // Privy embedded wallet adapter
  KMSWalletAdapter,                  // MCV custodial KMS wallet adapter
} from './adapters';

// ═══════════════════════════════════════════════════════════════════════════════
// ADAPTER REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createWalletAdapterRegistry,       // Factory for multi-adapter management
  getAvailableAdapters,              // Detect installed wallet extensions
  getRecommendedAdapter,             // Get best adapter for chain/context
  WalletAdapterRegistry,             // Registry class
} from './adapter-registry';

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export {
  userWallets,                       // Connected wallets table
  walletSessions,                    // Active wallet sessions table
  walletTransactions,                // Transaction index table (off-chain mirror)
  walletNonces,                      // Signature verification nonces
  chainEnum,                         // Supported blockchain enum
  walletProviderEnum,                // Wallet provider enum
} from './schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useWallet } from './hooks/use-wallet';
export { useWalletBalances } from './hooks/use-wallet-balances';
export { useWalletTransactions } from './hooks/use-wallet-transactions';
export { useWalletConnection } from './hooks/use-wallet-connection';
export { useMultiWallet } from './hooks/use-multi-wallet';
export { useSolanaBalance } from './hooks/use-solana-balance';
export { useTokenBalance } from './hooks/use-token-balance';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { WalletConnectButton } from './components/wallet-connect-button';
export { WalletMultiButton } from './components/wallet-multi-button';
export { WalletModal } from './components/wallet-modal';
export { WalletProvider } from './components/wallet-provider';
export { WalletBalanceDisplay } from './components/wallet-balance-display';
export { TransactionHistory } from './components/transaction-history';
export { TransactionConfirmDialog } from './components/transaction-confirm-dialog';
export { WalletAvatar } from './components/wallet-avatar';
export { AddressDisplay } from './components/address-display';
export { NetworkSelector } from './components/network-selector';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Chain,
  SolanaNetwork,
  ChainConfig,
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
  ConnectOptions,
  SendOptions,
  ChainPortfolio,
  PaginatedResult,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SUPPORTED_CHAINS,
  SUPPORTED_WALLETS,
  SOLANA_NETWORKS,
  WALLET_SESSION_TTL,
  NONCE_TTL,
  TRANSACTION_CONFIRMATION_COMMITMENT,
  BALANCE_CACHE_TTL,
} from './constants';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        WALLET-SDK MODULE ARCHITECTURE                             │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                          CLIENT LAYER (React)                               │   │
│  │                                                                             │   │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │   │
│  │  │  WalletProvider    │  │  WalletMultiButton │  │  WalletModal       │    │   │
│  │  │  (React Context)   │  │  (Connect Button)  │  │  (Wallet Picker)   │    │   │
│  │  └─────────┬──────────┘  └─────────┬──────────┘  └─────────┬──────────┘    │   │
│  │            │                       │                       │               │   │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │   │
│  │  │ useWallet()        │  │ useWalletBalances() │  │ useWalletTxns()   │    │   │
│  │  │ useMultiWallet()   │  │ useSolanaBalance()  │  │ useWalletConn()   │    │   │
│  │  │ useTokenBalance()  │  │                     │  │                    │    │   │
│  │  └─────────┬──────────┘  └─────────┬──────────┘  └─────────┬──────────┘    │   │
│  │            │                       │                       │               │   │
│  └────────────┴───────────────────────┴───────────────────────┴───────────────┘   │
│                                       │                                           │
│  ┌────────────────────────────────────┼───────────────────────────────────────┐   │
│  │                      ADAPTER REGISTRY LAYER                                │   │
│  │                                    │                                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │   │
│  │  │ Phantom  │ │ Solflare │ │ Backpack │ │ MetaMask │ │ Coinbase │        │   │
│  │  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │        │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘        │   │
│  │       │            │            │            │            │               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                                  │   │
│  │  │WalletCon │ │  Privy   │ │  KMS     │ ← Server-side only               │   │
│  │  │  nect v2 │ │ Embedded │ │ Custodial│                                  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘                                  │   │
│  │       │            │            │                                         │   │
│  │       └────────────┴────────────┘                                         │   │
│  │                    │                                                       │   │
│  │         ┌──────────▼──────────┐                                           │   │
│  │         │  WalletAdapter      │  ← Universal interface all adapters       │   │
│  │         │  Interface          │    implement                              │   │
│  │         └──────────┬──────────┘                                           │   │
│  │                    │                                                       │   │
│  └────────────────────┼──────────────────────────────────────────────────────┘   │
│                       │                                                          │
│  ┌────────────────────▼──────────────────────────────────────────────────────┐   │
│  │                       WALLET SERVICE LAYER                                 │   │
│  │                                                                            │   │
│  │  ┌──────────────────────────────┐  ┌──────────────────────────────┐       │   │
│  │  │    Connection & Verification │  │     Session Management       │       │   │
│  │  │                              │  │                              │       │   │
│  │  │  • generateNonce()           │  │  • getActiveSession()        │       │   │
│  │  │  • verifyAndLink()           │  │  • refreshSession()          │       │   │
│  │  │  • disconnect()              │  │  • revokeAllSessions()       │       │   │
│  │  │  • linkAdditionalWallet()    │  │  • cleanExpiredSessions()    │       │   │
│  │  │  • unlinkWallet()            │  │  • validateSessionToken()    │       │   │
│  │  └──────────────────────────────┘  └──────────────────────────────┘       │   │
│  │                                                                            │   │
│  │  ┌──────────────────────────────┐  ┌──────────────────────────────┐       │   │
│  │  │    Balance Queries           │  │     Transaction Management   │       │   │
│  │  │                              │  │                              │       │   │
│  │  │  • getSolanaBalance()        │  │  • getTransactionHistory()   │       │   │
│  │  │  • getTokenBalances()        │  │  • indexTransaction()        │       │   │
│  │  │  • getNFTBalances()          │  │  • getTransactionStatus()    │       │   │
│  │  │  • getPortfolioValue()       │  │  • waitForConfirmation()     │       │   │
│  │  └──────────────────────────────┘  └──────────────────────────────┘       │   │
│  │                                                                            │   │
│  │  ┌──────────────────────────────┐  ┌──────────────────────────────┐       │   │
│  │  │    Custodial Operations      │  │     Name Resolution          │       │   │
│  │  │                              │  │                              │       │   │
│  │  │  • createCustodialWallet()   │  │  • resolveAddress()          │       │   │
│  │  │  • signWithCustodial()       │  │  • reverseLookup()           │       │   │
│  │  │  • sendFromCustodial()       │  │  • SNS (.sol) domains        │       │   │
│  │  │  • rotateCustodialKey()      │  │  • ENS (.eth) domains        │       │   │
│  │  └──────────────────────────────┘  └──────────────────────────────┘       │   │
│  │                                                                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│  ┌────────────────────────────────────▼──────────────────────────────────────┐   │
│  │                        BLOCKCHAIN LAYER                                    │   │
│  │                                                                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │  @solana/     │  │  viem        │  │  tweetnacl   │  │  AWS KMS /   │  │   │
│  │  │  web3.js      │  │  (EVM)       │  │  (Ed25519    │  │  Vault       │  │   │
│  │  │              │  │              │  │   verify)    │  │  (Custodial) │  │   │
│  │  │  RPC calls   │  │  EVM RPC     │  │  Signature   │  │  Key mgmt   │  │   │
│  │  │  Transactions│  │  EIP-191     │  │  verify      │  │  HSM signing │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│  ┌────────────────────────────────────▼──────────────────────────────────────┐   │
│  │                        DATABASE LAYER                                      │   │
│  │                                                                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ user_wallet  │  │wallet_session│  │  wallet_     │  │ wallet_nonce │  │   │
│  │  │              │  │              │  │  transaction │  │              │  │   │
│  │  │ Chain+addr   │  │ Session tok  │  │  Tx index    │  │ Verify sig   │  │   │
│  │  │ Provider     │  │ TTL tracking │  │  Status      │  │ 5-min TTL    │  │   │
│  │  │ Verification │  │ Activity     │  │  Fee data    │  │ Single-use   │  │   │
│  │  │ Labels       │  │ Device info  │  │  Logs        │  │              │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                                            │   │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │   │
│  │  │                          REDIS CACHE                                  │  │   │
│  │  │  wallet:balance:<addr>     TTL: 30s    (SOL + token balances)        │  │   │
│  │  │  wallet:session:<token>    TTL: 24h    (session validation cache)    │  │   │
│  │  │  wallet:nft:<addr>         TTL: 60s    (NFT balance cache)           │  │   │
│  │  │  wallet:portfolio:<userId> TTL: 5min   (portfolio aggregation)       │  │   │
│  │  └──────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

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
│  │  2. Generate deep link: phantom://v1/connect?...         │        │
│  │     Parameters: dapp_encryption_public_key, cluster,     │        │
│  │     app_url, redirect_link                               │        │
│  │  3. User redirected to Phantom app                       │        │
│  │  4. User approves, redirected back via callback URL     │        │
│  │  5. Callback URL includes encrypted payload             │        │
│  │  6. Decrypt → extract publicKey → continue step 3+      │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  WalletConnect Flow                                      │        │
│  │                                                          │        │
│  │  1. Generate WC session with supported chains            │        │
│  │  2. Display QR code (or deep link on mobile)            │        │
│  │  3. User scans with any WalletConnect-compatible app    │        │
│  │  4. Session established via relay server                │        │
│  │  5. Sign requests proxied through WC session            │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Types & Interfaces

### Chain Types

```typescript
/**
 * Supported blockchain networks.
 * Solana is the primary chain; EVM chains are secondary targets.
 */
export type Chain = 'solana' | 'ethereum' | 'base' | 'polygon' | 'arbitrum' | 'optimism' | 'avalanche' | 'bsc';

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';

export interface ChainConfig {
  /** Chain identifier */
  chain: Chain;
  /** Human-readable chain name */
  name: string;
  /** Chain ID (EVM) or cluster name (Solana) */
  chainId: number | string;
  /** RPC endpoint URL */
  rpcUrl: string;
  /** WebSocket RPC URL for subscriptions */
  wsUrl?: string;
  /** Block explorer URL */
  explorerUrl: string;
  /** Native token symbol (SOL, ETH, MATIC) */
  nativeToken: string;
  /** Native token decimals */
  nativeDecimals: number;
  /** Whether this chain is currently enabled */
  enabled: boolean;
  /** Address format regex for validation */
  addressPattern: RegExp;
}

/**
 * Default chain configurations for MCV.
 */
export const CHAIN_CONFIGS: Record<Chain, ChainConfig> = {
  solana: {
    chain: 'solana',
    name: 'Solana',
    chainId: 'mainnet-beta',
    rpcUrl: process.env.SOLANA_RPC_URL!,
    wsUrl: process.env.SOLANA_RPC_WS_URL,
    explorerUrl: 'https://solscan.io',
    nativeToken: 'SOL',
    nativeDecimals: 9,
    enabled: true,
    addressPattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  },
  ethereum: {
    chain: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: process.env.ETH_RPC_URL!,
    explorerUrl: 'https://etherscan.io',
    nativeToken: 'ETH',
    nativeDecimals: 18,
    enabled: true,
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
  },
  base: {
    chain: 'base',
    name: 'Base',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL!,
    explorerUrl: 'https://basescan.org',
    nativeToken: 'ETH',
    nativeDecimals: 18,
    enabled: true,
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
  },
  // ... polygon, arbitrum, optimism, avalanche, bsc
};
```

### Wallet Adapter Interface

```typescript
/**
 * Universal wallet adapter interface.
 * All wallet implementations (Phantom, Solflare, MetaMask, etc.)
 * conform to this interface, allowing the SDK to treat all wallets uniformly.
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
  /** Sign multiple transactions atomically. Not all wallets support this. */
  signAllTransactions?<T>(transactions: T[]): Promise<T[]>;
  /** Sign and submit a transaction. Returns transaction hash. */
  sendTransaction(transaction: unknown, options?: SendOptions): Promise<string>;

  /** Event listeners for wallet state changes */
  on(event: 'connect', handler: (publicKey: string) => void): void;
  on(event: 'disconnect', handler: () => void): void;
  on(event: 'accountChanged', handler: (publicKey: string | null) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
}

export interface WalletCapabilities {
  /** Can sign arbitrary messages (SIWS / EIP-191) */
  signMessage: boolean;
  /** Can sign transactions without sending */
  signTransaction: boolean;
  /** Can sign multiple transactions in one prompt */
  signAllTransactions: boolean;
  /** Can sign and send transactions */
  sendTransaction: boolean;
  /** Supports Solana Mobile Wallet Adapter protocol */
  mobileWalletAdapter: boolean;
  /** Supports WalletConnect v2 */
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
  /** Skip preflight transaction simulation */
  skipPreflight?: boolean;
  /** Commitment level for confirmation waiting */
  commitment?: 'processed' | 'confirmed' | 'finalized';
  /** Priority fee in microlamports (Solana) or gwei (EVM) */
  priorityFee?: number;
  /** Max compute units (Solana) or gas limit (EVM) */
  maxComputeUnits?: number;
  /** Maximum total fee the user is willing to pay */
  maxFee?: number;
}
```

### Wallet Connection & Session Types

```typescript
export interface WalletConnection {
  /** Wallet address (base58 for Solana, 0x-prefixed for EVM) */
  address: string;
  /** Public key (same as address for Solana, derived for EVM) */
  publicKey: string;
  /** Blockchain this wallet is on */
  chain: Chain;
  /** Wallet provider name */
  provider: string;
}

export interface WalletSession {
  id: string;
  walletId: string;
  userId: string;
  sessionToken: string;
  provider: string;
  isActive: boolean;
  connectedAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  connectionMethod: 'extension' | 'deeplink' | 'walletconnect' | 'embedded';
  metadata?: Record<string, unknown>;
}

export type WalletProviderName =
  | 'phantom'
  | 'solflare'
  | 'backpack'
  | 'metamask'
  | 'coinbase'
  | 'walletconnect'
  | 'privy'
  | 'magic'
  | 'kms';
```

### Balance & Transaction Types

```typescript
export interface TokenBalance {
  /** SPL token mint address (Solana) or ERC-20 contract address (EVM) */
  mint: string;
  /** Token ticker symbol */
  symbol: string;
  /** Token display name */
  name: string;
  /** Token decimal places */
  decimals: number;
  /** Raw balance (smallest unit, as string to preserve precision) */
  balance: string;
  /** Human-readable formatted balance */
  balanceFormatted: string;
  /** USD equivalent value (from oracle) */
  usdValue?: number;
  /** Token logo URI */
  logoUri?: string;
  /** Whether this is the chain's native token */
  isNative?: boolean;
}

export interface NFTBalance {
  /** NFT mint address */
  mint: string;
  /** NFT name */
  name: string;
  /** Collection symbol */
  symbol: string;
  /** Image URI */
  image: string;
  /** Collection name */
  collection?: string;
  /** NFT attributes */
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export interface ChainPortfolio {
  /** Chain identifier */
  chain: Chain;
  /** Total USD value on this chain */
  totalUsd: number;
  /** Native token balance */
  nativeBalance: TokenBalance;
  /** SPL/ERC-20 token balances */
  tokens: TokenBalance[];
  /** NFT count */
  nftCount: number;
}

export interface TransactionRequest {
  /** Target blockchain */
  chain: Chain;
  /** Recipient address */
  to: string;
  /** Native token amount (in human-readable format, e.g., "1.5") */
  value?: string;
  /** Transaction data (for contract calls) */
  data?: string;
  /** SPL/ERC-20 token mint address (for token transfers) */
  tokenMint?: string;
  /** Token amount (human-readable) */
  tokenAmount?: string;
  /** Optional memo/note (Solana memo program) */
  memo?: string;
}

export interface TransactionResult {
  /** Transaction hash/signature */
  hash: string;
  /** Blockchain */
  chain: Chain;
  /** Current confirmation status */
  status: TransactionStatus;
  /** Block number (EVM) */
  blockNumber?: number;
  /** Slot number (Solana) */
  slot?: number;
  /** Transaction fee paid */
  fee?: string;
  /** Fee token symbol */
  feeToken?: string;
}

export type TransactionStatus = 'pending' | 'processed' | 'confirmed' | 'finalized' | 'failed';
```

---

## Database Schema

### Enums

```typescript
import { pgEnum } from 'drizzle-orm/pg-core';

export const chainEnum = pgEnum('wallet_chain', [
  'solana',
  'ethereum',
  'base',
  'polygon',
  'arbitrum',
  'optimism',
  'avalanche',
  'bsc',
]);

export const walletProviderEnum = pgEnum('wallet_provider', [
  'phantom',
  'solflare',
  'backpack',
  'metamask',
  'coinbase',
  'walletconnect',
  'privy',
  'magic',
  'kms',        // MCV custodial (AWS KMS / Vault)
]);
```

### user_wallet — Connected Wallets

```typescript
/**
 * Stores all wallet addresses linked to user accounts.
 * Each user can have multiple wallets across multiple chains.
 * The primary wallet per chain is the default for transactions and identity.
 */
export const userWallets = pgTable('user_wallet', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),

  // Wallet identity
  chain: chainEnum('chain').notNull(),                          // solana | ethereum | base | polygon | ...
  address: text('address').notNull(),                           // Public key (Solana) or 0x address (EVM)

  // Connection details
  provider: walletProviderEnum('provider'),                     // phantom | solflare | metamask | ...
  isCustodial: boolean('is_custodial').default(false),          // true for KMS-managed wallets
  isPrimary: boolean('is_primary').default(false),              // Primary wallet for this chain

  // Verification
  verifiedAt: timestamp('verified_at'),                         // When ownership was verified via signature
  verificationSignature: text('verification_signature'),        // The stored signature proof

  // Name resolution
  resolvedName: text('resolved_name'),                          // SNS (.sol) or ENS (.eth) domain name

  // User metadata
  label: text('label'),                                         // User-provided label: "My Gaming Wallet", "Hardware"
  metadata: jsonb('metadata').$type<{
    publicKey?: string;                                          // Full public key bytes (hex)
    derivationPath?: string;                                     // HD wallet derivation path
    custodialWalletId?: string;                                  // KMS wallet reference ID
    capabilities?: string[];                                     // ['signMessage', 'signTransaction', 'signAllTransactions']
    lastKnownBalance?: string;                                   // Cached SOL/ETH balance
    avatarUrl?: string;                                          // Wallet avatar (Bonfida, ENS avatar)
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  /** Ensure no duplicate wallet registrations on the same chain */
  chainAddressUnq: uniqueIndex('wallet_chain_address_unq').on(t.chain, t.address),
  /** One primary wallet per user per chain */
  userChainIdx: uniqueIndex('wallet_user_chain_idx').on(t.userId, t.chain),
  /** Fast lookup: all wallets for a venture's user */
  ventureUserIdx: index('wallet_venture_user_idx').on(t.ventureId, t.userId),
}));
```

### wallet_session — Active Wallet Sessions

```typescript
/**
 * Tracks active wallet connection sessions.
 * Sessions are created after signature verification and expire after configurable TTL.
 * Multiple sessions per wallet are allowed (desktop + mobile).
 */
export const walletSessions = pgTable('wallet_session', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  walletId: text('wallet_id').notNull().references(() => userWallets.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),

  // Session identity
  sessionToken: text('session_token').notNull().unique(),       // Cryptographically random 32-byte token (base64url)
  provider: walletProviderEnum('provider'),

  // State
  isActive: boolean('is_active').default(true),
  connectedAt: timestamp('connected_at').defaultNow(),
  lastActivity: timestamp('last_activity').defaultNow(),
  expiresAt: timestamp('expires_at'),                           // Session TTL (default 24 hours)

  // Client fingerprint (for security audit trail)
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceId: text('device_id'),                                  // For mobile session binding

  metadata: jsonb('metadata').$type<{
    connectionMethod?: 'extension' | 'deeplink' | 'walletconnect' | 'embedded';
    walletVersion?: string;
    chainId?: number;
  }>(),
});
```

### wallet_transaction — Off-Chain Transaction Index

```typescript
/**
 * Off-chain mirror of wallet transactions for fast querying.
 * Instead of hitting the RPC for every transaction history request,
 * we index confirmed transactions here and serve from PostgreSQL.
 */
export const walletTransactions = pgTable('wallet_transaction', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  walletId: text('wallet_id').references(() => userWallets.id),

  // Chain reference
  chain: chainEnum('chain').notNull(),
  txHash: text('tx_hash').notNull(),                            // Transaction signature (Solana) or hash (EVM)
  blockNumber: numeric('block_number'),                         // EVM block number
  slot: numeric('slot'),                                        // Solana slot number

  // Transaction details
  type: text('type').notNull(),                                 // transfer | swap | stake | nft_mint | nft_transfer | contract_call | token_create
  status: text('status').notNull().default('pending'),          // pending | confirmed | failed | finalized

  // Addresses
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address'),
  programId: text('program_id'),                                // Solana program ID involved

  // Value
  amount: numeric('amount', { precision: 24, scale: 8 }),       // Amount in human-readable format
  tokenSymbol: text('token_symbol'),                            // SOL, USDC, etc.
  tokenMint: text('token_mint'),                                // SPL token mint address
  tokenDecimals: integer('token_decimals'),

  // Fee
  fee: numeric('fee', { precision: 18, scale: 8 }),             // Transaction fee
  feeToken: text('fee_token').default('SOL'),
  priorityFee: numeric('priority_fee', { precision: 18, scale: 8 }),

  // Instruction data (Solana-specific)
  instructions: jsonb('instructions').$type<Array<{
    programId: string;
    data: string;
    keys: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>;
  }>>(),
  logs: jsonb('logs').$type<string[]>(),                        // Transaction logs

  // Human-readable
  description: text('description'),                             // "Sent 1.5 SOL to GKv4..."

  confirmedAt: timestamp('confirmed_at'),
  finalizedAt: timestamp('finalized_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  /** Unique transaction per chain */
  txHashUnq: uniqueIndex('tx_hash_chain_unq').on(t.chain, t.txHash),
  /** Lookup transactions by wallet */
  walletIdx: index('tx_wallet_idx').on(t.walletId),
  /** Lookup transactions by venture */
  ventureIdx: index('tx_venture_idx').on(t.ventureId),
  /** Filter by confirmation status */
  statusIdx: index('tx_status_idx').on(t.status),
  /** Filter by transaction type */
  typeIdx: index('tx_type_idx').on(t.type),
}));
```

### wallet_nonce — Signature Verification Nonces

```typescript
/**
 * Single-use nonces for wallet ownership verification.
 * A fresh nonce is generated for every signature verification attempt.
 * Nonces expire after 5 minutes and cannot be reused.
 */
export const walletNonces = pgTable('wallet_nonce', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  address: text('address').notNull(),
  chain: chainEnum('chain').notNull(),

  nonce: text('nonce').notNull(),                               // Cryptographically random nonce (32 bytes, hex)
  message: text('message').notNull(),                           // Full message that was signed (includes nonce)
  expiresAt: timestamp('expires_at').notNull(),                 // 5-minute TTL
  usedAt: timestamp('used_at'),                                 // Set when nonce is consumed (prevents replay)

  ipAddress: text('ip_address'),                                // Request origin IP
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  /** Lookup nonces by address for verification */
  addressChainIdx: index('nonce_address_chain_idx').on(t.address, t.chain),
  /** Cleanup expired nonces efficiently */
  expiresIdx: index('nonce_expires_idx').on(t.expiresAt),
}));
```

---

## Core Service Interface

```typescript
export class WalletService {
  constructor(
    private db: Database,
    private cache: RedisClient,
    private solanaConnection: Connection,
    private eventBus: EventBus,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════
  // CONNECTION & VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate a cryptographic nonce for wallet ownership verification.
   * The nonce is embedded in a human-readable message that the user signs.
   * Nonces expire after 5 minutes and are single-use.
   */
  generateNonce(
    address: string,
    chain: Chain,
    ip?: string,
  ): Promise<{ nonce: string; message: string }>;

  /**
   * Verify a wallet signature against a previously generated nonce.
   * If verification succeeds, links the wallet to the user (or creates a new user).
   * Returns the wallet record, a new session, and whether a new user was created.
   */
  verifyAndLink(input: VerifyWalletInput): Promise<{
    wallet: UserWallet;
    session: WalletSession;
    isNewUser: boolean;
  }>;

  /**
   * Disconnect a wallet session (not the wallet itself — just the session).
   * The wallet remains linked to the user account.
   */
  disconnect(sessionId: string): Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════
  // WALLET MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * List all wallets linked to a user within a venture context.
   */
  listWallets(userId: string, ventureId: string): Promise<UserWallet[]>;

  /**
   * Link an additional wallet to an existing user account.
   * Requires signature verification. A user can have multiple wallets
   * across multiple chains.
   */
  linkAdditionalWallet(userId: string, input: LinkWalletInput): Promise<UserWallet>;

  /**
   * Unlink a wallet from a user account.
   * Cannot unlink the last remaining wallet (user must have at least one).
   * All sessions for this wallet are automatically revoked.
   */
  unlinkWallet(userId: string, walletId: string): Promise<void>;

  /**
   * Set a wallet as the primary wallet for its chain.
   * The primary wallet is used as the default for transactions
   * and identity resolution on that chain.
   */
  setPrimaryWallet(userId: string, walletId: string): Promise<UserWallet>;

  /**
   * Update the user-provided label for a wallet.
   */
  updateWalletLabel(walletId: string, label: string): Promise<UserWallet>;

  // ═══════════════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get the active session for a session token.
   * Returns null if the session doesn't exist, has expired, or was revoked.
   * Checks Redis cache first, falls back to DB.
   */
  getActiveSession(sessionToken: string): Promise<WalletSession | null>;

  /**
   * Refresh a session's lastActivity timestamp and extend expiry.
   * Called on every authenticated request to keep the session alive.
   */
  refreshSession(sessionId: string): Promise<WalletSession>;

  /**
   * Revoke all active sessions for a user.
   * Used for security events (compromised wallet, account lockout).
   * Returns the number of revoked sessions.
   */
  revokeAllSessions(userId: string): Promise<number>;

  /**
   * Clean up expired sessions. Called by cron job.
   */
  cleanExpiredSessions(): Promise<number>;

  // ═══════════════════════════════════════════════════════════════════════
  // BALANCES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get SOL balance for a Solana address.
   * Direct RPC call (fast, ~100ms). Not cached.
   */
  getSolanaBalance(address: string): Promise<{ lamports: bigint; sol: string }>;

  /**
   * Get all SPL/ERC-20 token balances for an address.
   * Cached in Redis with 30-second TTL.
   * Includes token metadata (name, symbol, logo, USD value).
   */
  getTokenBalances(address: string, chain: Chain): Promise<TokenBalance[]>;

  /**
   * Get all NFTs owned by an address.
   * Cached in Redis with 60-second TTL.
   * Returns basic NFT info (not full metadata).
   */
  getNFTBalances(address: string, chain: Chain): Promise<NFTBalance[]>;

  /**
   * Aggregate portfolio value across all linked wallets for a user.
   * Sums native token + SPL token + NFT floor values across all chains.
   * Cached with 5-minute TTL.
   */
  getPortfolioValue(userId: string): Promise<{
    totalUsd: number;
    chains: ChainPortfolio[];
  }>;

  // ═══════════════════════════════════════════════════════════════════════
  // TRANSACTIONS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get transaction history for a wallet.
   * Queries the off-chain transaction index (not the RPC).
   * Supports pagination, filtering by type and status.
   */
  getTransactionHistory(
    walletId: string,
    options?: TransactionQueryOptions,
  ): Promise<PaginatedResult<WalletTransaction>>;

  /**
   * Index a transaction from the blockchain into our off-chain store.
   * Fetches transaction details from RPC, parses instructions,
   * and stores in the wallet_transaction table.
   */
  indexTransaction(txHash: string, chain: Chain): Promise<WalletTransaction>;

  /**
   * Check the confirmation status of a transaction.
   * Uses RPC to get real-time status.
   */
  getTransactionStatus(txHash: string, chain: Chain): Promise<TransactionStatus>;

  /**
   * Wait for a transaction to reach a specific confirmation level.
   * Returns when confirmed or throws on timeout.
   */
  waitForConfirmation(
    txHash: string,
    chain: Chain,
    commitment?: 'confirmed' | 'finalized',
    timeoutMs?: number,
  ): Promise<TransactionResult>;

  // ═══════════════════════════════════════════════════════════════════════
  // CUSTODIAL WALLET OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Create a new KMS-managed custodial wallet for a user.
   * The private key is generated and stored in AWS KMS or HashiCorp Vault.
   * The key never leaves the HSM boundary.
   */
  createCustodialWallet(userId: string, chain: Chain, label?: string): Promise<UserWallet>;

  /**
   * Sign a transaction using a custodial wallet's KMS key.
   * The transaction is sent to KMS for signing — the private key
   * never leaves the HSM.
   */
  signWithCustodial(walletId: string, transaction: SolanaTransaction): Promise<SolanaTransaction>;

  /**
   * Build, sign, and send a transaction from a custodial wallet.
   * Handles: build tx → KMS sign → submit → confirm → index.
   */
  sendFromCustodial(walletId: string, input: SendTransactionInput): Promise<TransactionResult>;

  // ═══════════════════════════════════════════════════════════════════════
  // NAME RESOLUTION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Resolve a domain name (.sol or .eth) to a wallet address.
   * Uses Bonfida SNS for .sol, ENS for .eth.
   * Cached with 1-hour TTL.
   */
  resolveAddress(name: string): Promise<{ address: string; chain: Chain } | null>;

  /**
   * Reverse lookup: find the domain name for a wallet address.
   * Returns the primary SNS or ENS name, if one exists.
   */
  reverseLookup(address: string, chain: Chain): Promise<string | null>;
}
```

### Service Input Types

```typescript
export interface ConnectWalletInput {
  address: string;
  chain: Chain;
  provider: WalletProviderName;
  ventureId: string;
}

export interface VerifyWalletInput {
  /** Wallet address to verify */
  address: string;
  /** Chain the wallet is on */
  chain: Chain;
  /** Signature over the nonce message */
  signature: string;
  /** The nonce that was signed */
  nonce: string;
  /** Wallet provider used */
  provider: WalletProviderName;
  /** Existing user ID (undefined for new wallet-first auth) */
  userId?: string;
  /** Venture context */
  ventureId: string;
  /** Request IP for security */
  ip?: string;
  /** Request user agent for session tracking */
  userAgent?: string;
}

export interface LinkWalletInput {
  address: string;
  chain: Chain;
  signature: string;
  nonce: string;
  provider: WalletProviderName;
  ventureId: string;
  label?: string;
}

export interface SendTransactionInput {
  /** Recipient address */
  to: string;
  /** Native token amount (human-readable, e.g., "1.5") */
  amount?: string;
  /** SPL/ERC-20 token mint (for token transfers) */
  tokenMint?: string;
  /** Token amount (human-readable) */
  tokenAmount?: string;
  /** Optional memo */
  memo?: string;
  /** Priority fee tier */
  priorityFee?: 'low' | 'medium' | 'high' | number;
  /** Commitment level for confirmation */
  commitment?: 'confirmed' | 'finalized';
}

export interface TransactionQueryOptions {
  /** Filter by transaction type */
  type?: string;
  /** Filter by status */
  status?: TransactionStatus;
  /** Pagination cursor */
  cursor?: string;
  /** Results per page */
  limit?: number;
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Date range filter */
  startDate?: Date;
  endDate?: Date;
}
```

---

## Adapter Registry

```typescript
/**
 * WalletAdapterRegistry manages all available wallet adapters,
 * auto-detects installed wallets, and provides the selection UI data.
 *
 * Usage:
 *   const registry = createWalletAdapterRegistry({ autoDetect: true });
 *   const available = await registry.getAvailable('solana');
 *   const recommended = await registry.getRecommended('solana');
 */
export class WalletAdapterRegistry {
  private adapters: Map<string, WalletAdapter> = new Map();
  private detectionPromise: Promise<void> | null = null;

  constructor(config?: {
    /** Chains to support (filters adapters) */
    chains?: Chain[];
    /** Auto-detect installed wallets on creation (default: true) */
    autoDetect?: boolean;
    /** Additional custom adapters to register */
    customAdapters?: WalletAdapter[];
  }) {
    // Register all built-in adapters
    this.register(new PhantomAdapter());
    this.register(new SolflareAdapter());
    this.register(new BackpackAdapter());
    this.register(new MetaMaskAdapter());
    this.register(new CoinbaseWalletAdapter());
    this.register(new WalletConnectAdapter());
    this.register(new PrivyAdapter());

    // Register custom adapters
    config?.customAdapters?.forEach(a => this.register(a));

    // Start wallet extension detection
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

  /**
   * Get adapters available in the current environment (installed/detected).
   * Optionally filter by chain.
   */
  async getAvailable(chain?: Chain): Promise<WalletAdapter[]> {
    await this.detectionPromise;
    let adapters = this.getAll().filter(a => a.isAvailable);
    if (chain) {
      adapters = adapters.filter(a => a.chain === chain);
    }
    return adapters;
  }

  /**
   * Get the recommended adapter for the current chain/context.
   * Uses priority ordering:
   *   Solana: Phantom > Solflare > Backpack
   *   EVM:    MetaMask > Coinbase > WalletConnect
   *   Base:   Coinbase > MetaMask
   */
  async getRecommended(chain: Chain): Promise<WalletAdapter | null> {
    const available = await this.getAvailable(chain);
    if (available.length === 0) return null;

    const priority: Record<string, string[]> = {
      solana: ['phantom', 'solflare', 'backpack'],
      ethereum: ['metamask', 'coinbase wallet'],
      base: ['coinbase wallet', 'metamask'],
      polygon: ['metamask', 'coinbase wallet'],
      arbitrum: ['metamask', 'coinbase wallet'],
    };

    const chainPriority = priority[chain] ?? [];
    for (const name of chainPriority) {
      const adapter = available.find(a => a.name.toLowerCase() === name);
      if (adapter) return adapter;
    }

    return available[0]; // Fallback to first available
  }

  /**
   * Get adapters not yet installed (for "Install Wallet" suggestions).
   */
  async getNotInstalled(chain?: Chain): Promise<WalletAdapter[]> {
    await this.detectionPromise;
    let adapters = this.getAll().filter(a => !a.isAvailable);
    if (chain) {
      adapters = adapters.filter(a => a.chain === chain);
    }
    return adapters;
  }

  /** Detect which wallet extensions are installed in the browser */
  private async detectInstalled(): Promise<void> {
    if (typeof window === 'undefined') return; // SSR safety

    // Wait for wallet injection (some wallets inject asynchronously)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Each adapter's isAvailable getter handles its own detection:
    // - Phantom: checks window.phantom?.solana?.isPhantom
    // - Solflare: checks window.solflare?.isSolflare
    // - MetaMask: checks window.ethereum?.isMetaMask
    // - Coinbase: checks window.coinbaseWalletExtension
    // - Backpack: checks window.backpack?.isBackpack
  }
}

/**
 * Factory function for creating a registry with default configuration.
 */
export function createWalletAdapterRegistry(
  config?: ConstructorParameters<typeof WalletAdapterRegistry>[0],
): WalletAdapterRegistry {
  return new WalletAdapterRegistry(config);
}
```

---

## Adapter Implementations

### PhantomAdapter (Solana)

```typescript
/**
 * Phantom wallet adapter for Solana.
 * Handles both browser extension and mobile deep link connections.
 */
export class PhantomAdapter implements WalletAdapter {
  readonly name = 'Phantom';
  readonly icon = '/wallets/phantom.svg';
  readonly chain: Chain = 'solana';
  readonly downloadUrl = 'https://phantom.app/download';
  readonly supportsMobile = true;

  private provider: PhantomProvider | null = null;

  get isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window as any).phantom?.solana?.isPhantom;
  }

  get isConnected(): boolean {
    return this.provider?.isConnected ?? false;
  }

  get publicKey(): string | null {
    return this.provider?.publicKey?.toString() ?? null;
  }

  get capabilities(): WalletCapabilities {
    return {
      signMessage: true,
      signTransaction: true,
      signAllTransactions: true,
      sendTransaction: true,
      mobileWalletAdapter: true,
      walletConnect: false,
    };
  }

  async connect(options?: ConnectOptions): Promise<WalletConnection> {
    if (typeof window === 'undefined') {
      throw new WalletError('WALLET_PROVIDER_UNAVAILABLE', 'Phantom is only available in browser');
    }

    // Check for mobile — use deep link flow
    if (this.isMobile() && !this.isAvailable) {
      return this.connectViaMobile(options);
    }

    const provider = (window as any).phantom?.solana;
    if (!provider?.isPhantom) {
      throw new WalletError('WALLET_PROVIDER_UNAVAILABLE', 'Phantom wallet not installed');
    }

    const response = await provider.connect({
      onlyIfTrusted: options?.onlyIfTrusted ?? false,
    });

    this.provider = provider;

    // Listen for account changes
    provider.on('accountChanged', (publicKey: PublicKey | null) => {
      if (publicKey) {
        this.emit('accountChanged', publicKey.toString());
      } else {
        this.emit('disconnect');
      }
    });

    return {
      address: response.publicKey.toString(),
      publicKey: response.publicKey.toString(),
      chain: 'solana',
      provider: 'phantom',
    };
  }

  async disconnect(): Promise<void> {
    await this.provider?.disconnect();
    this.provider = null;
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    if (!this.provider) throw new WalletError('WALLET_NOT_CONNECTED', 'Not connected');

    const encodedMessage = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message;

    const { signature } = await this.provider.signMessage(encodedMessage, 'utf8');
    return Buffer.from(signature).toString('base64');
  }

  async signTransaction<T>(transaction: T): Promise<T> {
    if (!this.provider) throw new WalletError('WALLET_NOT_CONNECTED', 'Not connected');
    return this.provider.signTransaction(transaction);
  }

  async signAllTransactions<T>(transactions: T[]): Promise<T[]> {
    if (!this.provider) throw new WalletError('WALLET_NOT_CONNECTED', 'Not connected');
    return this.provider.signAllTransactions(transactions);
  }

  async sendTransaction(transaction: unknown, options?: SendOptions): Promise<string> {
    if (!this.provider) throw new WalletError('WALLET_NOT_CONNECTED', 'Not connected');

    const { signature } = await this.provider.signAndSendTransaction(transaction, {
      skipPreflight: options?.skipPreflight ?? false,
      preflightCommitment: options?.commitment ?? 'confirmed',
    });

    return signature;
  }

  /**
   * Connect via Phantom mobile deep link.
   * Generates a deep link URL and redirects the user to the Phantom app.
   */
  private async connectViaMobile(options?: ConnectOptions): Promise<WalletConnection> {
    const dappEncryptionKey = nacl.box.keyPair();
    const params = new URLSearchParams({
      dapp_encryption_public_key: bs58.encode(dappEncryptionKey.publicKey),
      cluster: 'mainnet-beta',
      app_url: window.location.origin,
      redirect_link: `${window.location.origin}/api/wallet/phantom-callback`,
    });

    const deepLink = `https://phantom.app/ul/v1/connect?${params.toString()}`;
    window.location.href = deepLink;

    // The actual connection completes in the callback handler
    // This promise will never resolve in the current page load
    return new Promise(() => {});
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Event emitter implementation
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach(handler => handler(...args));
  }
}
```

### MetaMaskAdapter (EVM)

```typescript
/**
 * MetaMask wallet adapter for EVM chains (Ethereum, Base, Polygon, Arbitrum).
 */
export class MetaMaskAdapter implements WalletAdapter {
  readonly name = 'MetaMask';
  readonly icon = '/wallets/metamask.svg';
  readonly chain: Chain = 'ethereum';
  readonly downloadUrl = 'https://metamask.io/download/';
  readonly supportsMobile = true;

  private provider: EthereumProvider | null = null;
  private connectedAddress: string | null = null;

  get isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window as any).ethereum?.isMetaMask;
  }

  get isConnected(): boolean {
    return !!this.connectedAddress;
  }

  get publicKey(): string | null {
    return this.connectedAddress;
  }

  get capabilities(): WalletCapabilities {
    return {
      signMessage: true,
      signTransaction: true,
      signAllTransactions: false, // EVM doesn't batch-sign
      sendTransaction: true,
      mobileWalletAdapter: false,
      walletConnect: false,
    };
  }

  async connect(options?: ConnectOptions): Promise<WalletConnection> {
    const provider = (window as any).ethereum;
    if (!provider?.isMetaMask) {
      throw new WalletError('WALLET_PROVIDER_UNAVAILABLE', 'MetaMask not installed');
    }

    // Switch to target chain if specified
    if (options?.chainId) {
      await this.switchChain(provider, options.chainId);
    }

    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const address = accounts[0];

    this.provider = provider;
    this.connectedAddress = address;

    // Listen for account/chain changes
    provider.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length > 0) {
        this.connectedAddress = accounts[0];
        this.emit('accountChanged', accounts[0]);
      } else {
        this.connectedAddress = null;
        this.emit('disconnect');
      }
    });

    return {
      address,
      publicKey: address,
      chain: this.chainFromId(await this.getChainId(provider)),
      provider: 'metamask',
    };
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    if (!this.provider || !this.connectedAddress) {
      throw new WalletError('WALLET_NOT_CONNECTED', 'Not connected');
    }

    const msgHex = typeof message === 'string'
      ? `0x${Buffer.from(message).toString('hex')}`
      : `0x${Buffer.from(message).toString('hex')}`;

    // EIP-191 personal_sign
    return this.provider.request({
      method: 'personal_sign',
      params: [msgHex, this.connectedAddress],
    });
  }

  async sendTransaction(transaction: unknown, options?: SendOptions): Promise<string> {
    if (!this.provider) throw new WalletError('WALLET_NOT_CONNECTED', 'Not connected');

    return this.provider.request({
      method: 'eth_sendTransaction',
      params: [transaction],
    });
  }

  private async switchChain(provider: EthereumProvider, chainId: number): Promise<void> {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // Chain not added — request to add it
      if (error.code === 4902) {
        const config = Object.values(CHAIN_CONFIGS).find(c => c.chainId === chainId);
        if (config) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: config.name,
              rpcUrls: [config.rpcUrl],
              blockExplorerUrls: [config.explorerUrl],
              nativeCurrency: {
                name: config.nativeToken,
                symbol: config.nativeToken,
                decimals: config.nativeDecimals,
              },
            }],
          });
        }
      }
    }
  }

  // ... disconnect, signTransaction, event emitter similar to PhantomAdapter
}
```

### KMSWalletAdapter (Server-Side Custodial)

```typescript
/**
 * KMS Wallet Adapter for server-side custodial wallets.
 * Private keys are stored in AWS KMS or HashiCorp Vault.
 * This adapter is server-only — it does NOT run in the browser.
 *
 * Used by ventures that need server-side signing (e.g., automated payouts,
 * programmatic minting, treasury management).
 */
export class KMSWalletAdapter implements WalletAdapter {
  readonly name = 'MCV Custodial';
  readonly icon = '/wallets/mcv-custodial.svg';
  readonly chain: Chain;
  readonly downloadUrl = '';
  readonly supportsMobile = false;
  readonly isAvailable = true; // Always available server-side

  private kmsClient: KMSClient;
  private keyId: string;
  private _publicKey: string | null = null;

  constructor(chain: Chain, kmsKeyId: string) {
    this.chain = chain;
    this.keyId = kmsKeyId;
    this.kmsClient = new KMSClient({ region: process.env.AWS_KMS_REGION });
  }

  get isConnected(): boolean {
    return !!this._publicKey;
  }

  get publicKey(): string | null {
    return this._publicKey;
  }

  get capabilities(): WalletCapabilities {
    return {
      signMessage: true,
      signTransaction: true,
      signAllTransactions: true,
      sendTransaction: true,
      mobileWalletAdapter: false,
      walletConnect: false,
    };
  }

  async connect(): Promise<WalletConnection> {
    // Get public key from KMS
    const getPublicKeyCommand = new GetPublicKeyCommand({ KeyId: this.keyId });
    const response = await this.kmsClient.send(getPublicKeyCommand);
    const publicKeyBytes = new Uint8Array(response.PublicKey!);

    this._publicKey = new PublicKey(publicKeyBytes).toString();

    return {
      address: this._publicKey,
      publicKey: this._publicKey,
      chain: this.chain,
      provider: 'kms',
    };
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    const data = typeof message === 'string' ? new TextEncoder().encode(message) : message;

    const signCommand = new SignCommand({
      KeyId: this.keyId,
      Message: data,
      MessageType: 'RAW',
      SigningAlgorithm: 'ECDSA_SHA_256',
    });

    const response = await this.kmsClient.send(signCommand);
    return Buffer.from(response.Signature!).toString('base64');
  }

  async signTransaction<T>(transaction: T): Promise<T> {
    // Serialize transaction → sign with KMS → attach signature
    const serialized = (transaction as any).serializeMessage();
    const signCommand = new SignCommand({
      KeyId: this.keyId,
      Message: serialized,
      MessageType: 'RAW',
      SigningAlgorithm: 'ECDSA_SHA_256',
    });

    const response = await this.kmsClient.send(signCommand);
    const signature = new Uint8Array(response.Signature!);

    (transaction as any).addSignature(
      new PublicKey(this._publicKey!),
      Buffer.from(signature),
    );

    return transaction;
  }

  async disconnect(): Promise<void> {
    this._publicKey = null;
  }

  // KMS adapter is server-only — no event listeners needed
  on(): void {}
  off(): void {}
}
```

---

## React Hooks

### useWallet

```typescript
/**
 * Primary hook for wallet connection state management.
 *
 * Provides the current wallet connection, balances, and methods
 * to connect/disconnect wallets.
 *
 * @example
 * ```tsx
 * function WalletButton() {
 *   const { wallet, wallets, connecting, connect, disconnect, isConnected } = useWallet();
 *
 *   if (isConnected) {
 *     return <button onClick={disconnect}>{wallet.address.slice(0,6)}...</button>;
 *   }
 *
 *   return <button onClick={() => connect('phantom')} disabled={connecting}>
 *     {connecting ? 'Connecting...' : 'Connect Wallet'}
 *   </button>;
 * }
 * ```
 */
export function useWallet() {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [connecting, setConnecting] = useState(false);
  const registry = useContext(WalletRegistryContext);

  const { data: wallets, refetch } = trpc.wallet.list.useQuery();
  const nonceMutation = trpc.wallet.getNonce.useMutation();
  const verifyMutation = trpc.wallet.verify.useMutation();
  const disconnectMutation = trpc.wallet.disconnect.useMutation();

  const connect = useCallback(async (providerName: string) => {
    setConnecting(true);
    try {
      const adapter = registry.getAll().find(
        a => a.name.toLowerCase() === providerName.toLowerCase()
      );
      if (!adapter) throw new Error(`Unknown wallet: ${providerName}`);

      // Step 1: Connect to wallet
      const connection = await adapter.connect();

      // Step 2: Get nonce
      const { nonce, message } = await nonceMutation.mutateAsync({
        address: connection.address,
        chain: connection.chain,
      });

      // Step 3: Sign nonce
      const signature = await adapter.signMessage(message);

      // Step 4: Verify and link
      await verifyMutation.mutateAsync({
        address: connection.address,
        chain: connection.chain,
        signature,
        nonce,
      });

      setWallet(connection);
      await refetch();
    } finally {
      setConnecting(false);
    }
  }, [registry]);

  const disconnect = useCallback(async () => {
    if (wallet) {
      await disconnectMutation.mutateAsync();
      setWallet(null);
      await refetch();
    }
  }, [wallet]);

  return {
    wallet,
    wallets: wallets ?? [],
    connecting,
    connect,
    disconnect,
    isConnected: !!wallet,
  };
}
```

### useWalletBalances

```typescript
/**
 * Hook for fetching wallet token balances.
 * Automatically refetches every 30 seconds.
 */
export function useWalletBalances(walletId?: string) {
  return trpc.wallet.getBalances.useQuery(
    { walletId: walletId! },
    {
      enabled: !!walletId,
      refetchInterval: 30_000,   // Refetch every 30s
      staleTime: 15_000,         // Consider stale after 15s
    },
  );
}
```

### useMultiWallet

```typescript
/**
 * Hook for managing multiple wallets across chains.
 * Provides methods to link/unlink additional wallets and
 * switch between them.
 *
 * @example
 * ```tsx
 * function MultiWalletManager() {
 *   const { wallets, primaryWallets, linkWallet, unlinkWallet, setPrimary } = useMultiWallet();
 *
 *   return (
 *     <div>
 *       {wallets.map(w => (
 *         <div key={w.id}>
 *           <span>{w.chain}: {w.address.slice(0,8)}...</span>
 *           {w.isPrimary && <Badge>Primary</Badge>}
 *           {!w.isPrimary && <button onClick={() => setPrimary(w.id)}>Set Primary</button>}
 *           <button onClick={() => unlinkWallet(w.id)}>Unlink</button>
 *         </div>
 *       ))}
 *       <button onClick={() => linkWallet('solana')}>Link Solana Wallet</button>
 *       <button onClick={() => linkWallet('ethereum')}>Link EVM Wallet</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMultiWallet() {
  const { data: wallets, refetch } = trpc.wallet.list.useQuery();
  const linkMutation = trpc.wallet.link.useMutation();
  const unlinkMutation = trpc.wallet.unlink.useMutation();
  const setPrimaryMutation = trpc.wallet.setPrimary.useMutation();
  const registry = useContext(WalletRegistryContext);

  const primaryWallets = useMemo(
    () => (wallets ?? []).filter(w => w.isPrimary),
    [wallets],
  );

  const linkWallet = useCallback(async (chain: Chain) => {
    const adapter = await registry.getRecommended(chain);
    if (!adapter) throw new Error(`No wallet available for ${chain}`);

    const connection = await adapter.connect();
    // ... nonce + verify flow similar to useWallet.connect
    await refetch();
  }, [registry]);

  const unlinkWallet = useCallback(async (walletId: string) => {
    await unlinkMutation.mutateAsync({ walletId });
    await refetch();
  }, []);

  const setPrimary = useCallback(async (walletId: string) => {
    await setPrimaryMutation.mutateAsync({ walletId });
    await refetch();
  }, []);

  return {
    wallets: wallets ?? [],
    primaryWallets,
    linkWallet,
    unlinkWallet,
    setPrimary,
  };
}
```

---

## React Components

### WalletProvider

```tsx
/**
 * Context provider that initializes the wallet adapter registry
 * and provides it to all child components.
 * Must wrap any component using wallet hooks.
 *
 * @example
 * ```tsx
 * // In your app layout
 * export default function RootLayout({ children }) {
 *   return (
 *     <WalletProvider chains={['solana', 'ethereum']} autoConnect>
 *       {children}
 *     </WalletProvider>
 *   );
 * }
 * ```
 */
export function WalletProvider({
  children,
  chains = ['solana'],
  autoConnect = false,
  customAdapters,
}: {
  children: React.ReactNode;
  chains?: Chain[];
  autoConnect?: boolean;
  customAdapters?: WalletAdapter[];
}) {
  const registry = useMemo(
    () => createWalletAdapterRegistry({ chains, customAdapters }),
    [chains],
  );

  // Auto-connect on mount if previously connected
  useEffect(() => {
    if (autoConnect) {
      const lastProvider = localStorage.getItem('mcv_last_wallet_provider');
      if (lastProvider) {
        const adapter = registry.getAll().find(
          a => a.name.toLowerCase() === lastProvider && a.isAvailable,
        );
        adapter?.connect({ onlyIfTrusted: true }).catch(() => {});
      }
    }
  }, [autoConnect, registry]);

  return (
    <WalletRegistryContext.Provider value={registry}>
      {children}
    </WalletRegistryContext.Provider>
  );
}
```

### WalletModal

```tsx
/**
 * Modal that displays available wallet options for connection.
 * Shows detected wallets first, then "Install" links for others.
 * Handles the full connect → verify → link flow.
 */
export function WalletModal({
  isOpen,
  onClose,
  chain = 'solana',
}: {
  isOpen: boolean;
  onClose: () => void;
  chain?: Chain;
}) {
  const registry = useContext(WalletRegistryContext);
  const { connect, connecting } = useWallet();
  const [availableAdapters, setAvailable] = useState<WalletAdapter[]>([]);
  const [notInstalled, setNotInstalled] = useState<WalletAdapter[]>([]);

  useEffect(() => {
    if (isOpen) {
      registry.getAvailable(chain).then(setAvailable);
      registry.getNotInstalled(chain).then(setNotInstalled);
    }
  }, [isOpen, chain]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Connect Wallet</DialogTitle>

        {/* Detected wallets */}
        <div className="space-y-2">
          {availableAdapters.map(adapter => (
            <button
              key={adapter.name}
              onClick={() => { connect(adapter.name); onClose(); }}
              disabled={connecting}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted"
            >
              <img src={adapter.icon} alt={adapter.name} className="w-8 h-8" />
              <span className="font-medium">{adapter.name}</span>
              <Badge variant="outline" className="ml-auto">Detected</Badge>
            </button>
          ))}
        </div>

        {/* Not installed wallets */}
        {notInstalled.length > 0 && (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground">Install a wallet</p>
            {notInstalled.map(adapter => (
              <a
                key={adapter.name}
                href={adapter.downloadUrl}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted opacity-60"
              >
                <img src={adapter.icon} alt={adapter.name} className="w-8 h-8" />
                <span>{adapter.name}</span>
                <ExternalLinkIcon className="ml-auto w-4 h-4" />
              </a>
            ))}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## Code Examples

### Example 1: Full Wallet Connect + Verify + Balance Display

```typescript
import {
  walletService,
  createWalletAdapterRegistry,
} from '@mcv/web3-public/wallet-sdk';

// Server-side: complete wallet verification flow
async function handleWalletVerification(req: Request) {
  const { address, chain, signature, nonce, provider } = req.body;

  // Verify signature and link wallet to user account
  const result = await walletService.verifyAndLink({
    address,
    chain,
    signature,
    nonce,
    provider,
    userId: req.user?.id,       // undefined if new user
    ventureId: req.ventureId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  if (result.isNewUser) {
    // New user created via wallet — no email/password needed
    console.log('New user created:', result.wallet.userId);
  }

  // Fetch initial balances
  const balances = await walletService.getTokenBalances(address, chain);
  const solBalance = chain === 'solana'
    ? await walletService.getSolanaBalance(address)
    : null;

  return {
    wallet: result.wallet,
    session: result.session,
    balances: {
      native: solBalance ? `${solBalance.sol} SOL` : null,
      tokens: balances,
    },
  };
}
```

### Example 2: Send SOL with Priority Fee

```typescript
import { walletService } from '@mcv/web3-public/wallet-sdk';

// Send SOL from a custodial wallet with priority fee
async function sendPayout(userId: string, recipientAddress: string, amountSol: string) {
  // Find user's custodial wallet
  const wallets = await walletService.listWallets(userId, 'betedge');
  const custodialWallet = wallets.find(w => w.isCustodial && w.chain === 'solana');

  if (!custodialWallet) {
    throw new Error('No custodial wallet found');
  }

  // Send SOL with high priority fee for fast confirmation
  const result = await walletService.sendFromCustodial(custodialWallet.id, {
    to: recipientAddress,
    amount: amountSol,
    priorityFee: 'high',         // Uses dynamic priority fee estimation
    commitment: 'finalized',     // Wait for finalization
    memo: `BetEdge payout: ${amountSol} SOL`,
  });

  console.log('Payout sent:', result.hash);
  console.log('Status:', result.status);      // 'finalized'
  console.log('Fee:', result.fee, 'SOL');

  return result;
}
```

### Example 3: Multi-Chain Portfolio Aggregation

```typescript
import { walletService } from '@mcv/web3-public/wallet-sdk';

// Get total portfolio value across all chains
async function getPortfolio(userId: string) {
  const portfolio = await walletService.getPortfolioValue(userId);

  console.log(`Total portfolio: $${portfolio.totalUsd.toFixed(2)}`);

  for (const chain of portfolio.chains) {
    console.log(`\n${chain.chain.toUpperCase()}:`);
    console.log(`  Native: ${chain.nativeBalance.balanceFormatted} ${chain.nativeBalance.symbol}`);
    console.log(`  Value: $${chain.totalUsd.toFixed(2)}`);

    for (const token of chain.tokens) {
      if (token.usdValue && token.usdValue > 1) {
        console.log(`  ${token.symbol}: ${token.balanceFormatted} ($${token.usdValue.toFixed(2)})`);
      }
    }

    console.log(`  NFTs: ${chain.nftCount}`);
  }

  return portfolio;
}
```

### Example 4: Transaction History with Filtering

```typescript
import { walletService } from '@mcv/web3-public/wallet-sdk';

// Get filtered transaction history
async function getRecentTransfers(walletId: string) {
  const result = await walletService.getTransactionHistory(walletId, {
    type: 'transfer',
    status: 'finalized',
    limit: 20,
    sortOrder: 'desc',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
  });

  for (const tx of result.items) {
    console.log(`${tx.description}`);
    console.log(`  Hash: ${tx.txHash}`);
    console.log(`  Amount: ${tx.amount} ${tx.tokenSymbol}`);
    console.log(`  Fee: ${tx.fee} ${tx.feeToken}`);
    console.log(`  Status: ${tx.status}`);
    console.log(`  Time: ${tx.confirmedAt}`);
  }

  if (result.hasMore) {
    console.log(`\n... and ${result.total - result.items.length} more transactions`);
  }
}
```

### Example 5: Name Resolution (SNS / ENS)

```typescript
import { walletService } from '@mcv/web3-public/wallet-sdk';

// Resolve .sol domain to wallet address
const solResult = await walletService.resolveAddress('mcv.sol');
if (solResult) {
  console.log(`mcv.sol → ${solResult.address} (${solResult.chain})`);
  // mcv.sol → GKv4wD7GhZfSMP4JAATVeAMJRg4vTS4jSs1KLMTbCRCf (solana)
}

// Resolve .eth domain
const ethResult = await walletService.resolveAddress('vitalik.eth');
if (ethResult) {
  console.log(`vitalik.eth → ${ethResult.address} (${ethResult.chain})`);
}

// Reverse lookup: address → name
const name = await walletService.reverseLookup(
  'GKv4wD7GhZfSMP4JAATVeAMJRg4vTS4jSs1KLMTbCRCf',
  'solana'
);
console.log(`Reverse: ${name}`); // "mcv.sol" or null
```

### Example 6: WalletConnect QR Code Flow

```typescript
import { WalletConnectAdapter } from '@mcv/web3-public/wallet-sdk';

// WalletConnect session with QR code
const wcAdapter = new WalletConnectAdapter({
  projectId: process.env.WALLETCONNECT_PROJECT_ID!,
  chains: [1, 8453],  // Ethereum + Base
  metadata: {
    name: 'BetEdge',
    description: 'Decentralized Sports Betting',
    url: 'https://betedge.io',
    icons: ['https://betedge.io/icon.png'],
  },
});

// Generate session — this provides a QR code URI
const connection = await wcAdapter.connect();

// The adapter emits a 'display_uri' event with the QR data
wcAdapter.on('display_uri', (uri: string) => {
  // Render QR code in the modal
  renderQRCode(uri);
});

// Once user scans and approves:
console.log('Connected via WalletConnect:', connection.address);

// Sign message works the same as any other adapter
const signature = await wcAdapter.signMessage('Verify wallet ownership');
```

### Example 7: Session Management

```typescript
import { walletService } from '@mcv/web3-public/wallet-sdk';

// Validate a session token from an API request
async function validateWalletSession(req: Request) {
  const sessionToken = req.cookies['mcv_wallet_session'];
  if (!sessionToken) return null;

  const session = await walletService.getActiveSession(sessionToken);
  if (!session) return null;

  // Refresh session activity timestamp
  await walletService.refreshSession(session.id);

  return session;
}

// Revoke all sessions for security
async function emergencySessionRevoke(userId: string) {
  const count = await walletService.revokeAllSessions(userId);
  console.log(`Revoked ${count} wallet sessions for user ${userId}`);
}

// Clean up expired sessions (cron job, runs hourly)
async function cleanupSessions() {
  const cleaned = await walletService.cleanExpiredSessions();
  console.log(`Cleaned ${cleaned} expired wallet sessions`);
}
```

---

## Key Behaviors

1. **Nonce-based verification**: Every wallet link requires a fresh cryptographic nonce signed by the wallet's private key. Nonces are single-use, expire in 5 minutes, and are bound to the requesting IP address. This prevents replay attacks and proves wallet ownership without requiring the user to send a transaction.

2. **Session management**: Wallet sessions have a configurable TTL (default 24 hours). Each API interaction updates `lastActivity`, extending the effective session life. Expired sessions are cleaned by a cron job every hour. Multiple concurrent sessions per wallet are allowed (desktop + mobile).

3. **Auto-detection**: The adapter registry auto-detects installed browser wallet extensions within 100ms of initialization. The `WalletModal` component shows detected wallets first (with a "Detected" badge), then shows "Install" links with download URLs for undetected wallets.

4. **Mobile deep links**: On mobile browsers where extensions aren't available, the SDK generates deep links (e.g., `phantom://v1/connect?...`) to open the native wallet app. Return data comes via URL callback with an encrypted payload. The mobile flow is transparent to the calling code.

5. **Primary wallet**: Each user has one primary wallet per chain. The primary wallet is used as the default for transactions, identity resolution, and balance display. Changing the primary wallet updates all dependent references across the system.

6. **Balance caching**: Token balances are cached in Redis with a 30-second TTL. SOL balance is fetched directly via RPC on each request (cheap call, ~100ms). NFT balances are cached for 60 seconds. Portfolio aggregation is cached for 5 minutes.

7. **Transaction indexing**: After a transaction is signed and submitted, the SDK monitors its confirmation status progression (`pending → processed → confirmed → finalized`) and stores the result in the `wallet_transaction` table for fast querying without repeated RPC calls.

8. **Custodial wallet isolation**: KMS wallet private keys never leave the HSM boundary. All signing operations are performed within AWS KMS or HashiCorp Vault. The server only handles serialized transactions and signatures — never raw key material.

---

## Error Codes

| Code | HTTP Status | Description | User Message |
|------|-------------|-------------|--------------|
| `WALLET_NOT_FOUND` | 404 | Wallet not found in database | Wallet not found |
| `WALLET_ALREADY_LINKED` | 409 | Wallet already linked to a different user account | This wallet is already connected to another account |
| `WALLET_SIGNATURE_INVALID` | 401 | Cryptographic signature verification failed | Signature verification failed. Please try again |
| `WALLET_NONCE_EXPIRED` | 401 | Nonce has expired (>5 minutes old) | Verification expired. Please try again |
| `WALLET_NONCE_USED` | 401 | Nonce has already been consumed | This verification has already been used |
| `WALLET_NONCE_NOT_FOUND` | 404 | Nonce not found in database | Verification not found. Please start over |
| `WALLET_SESSION_EXPIRED` | 401 | Wallet session has expired (past TTL) | Wallet session expired. Please reconnect |
| `WALLET_SESSION_INVALID` | 401 | Session token not found or revoked | Please reconnect your wallet |
| `WALLET_PROVIDER_UNAVAILABLE` | 503 | Wallet extension not detected in browser | Wallet not detected. Please install or enable it |
| `WALLET_NOT_CONNECTED` | 400 | Attempted operation on disconnected wallet | Wallet is not connected |
| `WALLET_CHAIN_UNSUPPORTED` | 400 | Requested chain is not supported | This blockchain is not supported |
| `WALLET_ADDRESS_INVALID` | 400 | Address doesn't match chain format | Invalid wallet address format |
| `WALLET_UNLINK_LAST` | 400 | Cannot unlink the last remaining wallet | You must have at least one wallet connected |
| `WALLET_TX_FAILED` | 502 | Transaction failed on-chain | Transaction failed. Please try again |
| `WALLET_TX_TIMEOUT` | 504 | Transaction confirmation timed out | Transaction is taking longer than expected |
| `WALLET_INSUFFICIENT_BALANCE` | 400 | Not enough funds to complete transaction | Insufficient balance |
| `WALLET_KMS_SIGN_FAILED` | 500 | KMS signing operation failed | Internal signing error |
| `WALLET_RATE_LIMITED` | 429 | Too many nonce/verify requests | Too many attempts. Please wait |

---

## Security Considerations

### Signature Verification
- **Solana (Ed25519)**: Uses `tweetnacl.sign.detached.verify()` with the wallet's Ed25519 public key. The signed message includes a human-readable prefix, the wallet address, a timestamp, and the random nonce.
- **EVM (secp256k1)**: Uses `ecrecover` via `viem.verifyMessage()` for EIP-191 personal_sign messages. Recovers the signer address and compares to the claimed address.
- **Message format**: `"Sign this message to verify ownership of <ADDRESS>\nApp: <VENTURE_NAME>\nTimestamp: <ISO_TIMESTAMP>\nNonce: <NONCE>"`

### Session Security
- Session tokens are 32 cryptographically random bytes encoded as base64url
- Tokens are stored hashed (SHA-256) in the database — the raw token is only known to the client
- Session validation checks: token match, expiry, `isActive` flag
- IP address is logged but not validated (breaks mobile networks with rotating IPs)

### Custodial Wallet Security
- AWS KMS keys are configured with `KeyUsage: SIGN_VERIFY` — they cannot be exported
- HSM-backed keys (FIPS 140-2 Level 3) ensure private key material never exists in software
- All KMS signing operations are logged in CloudTrail for audit
- Key rotation is supported without changing the wallet address

### Rate Limiting
- Nonce generation: 10 requests per IP per minute
- Signature verification: 5 attempts per address per 5 minutes
- Balance queries: 60 requests per user per minute
- Transaction submission: 10 per wallet per minute

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/web3-core` | * | Solana connection management, SPL token utilities |
| `@mcv/identity` | * | User account creation, wallet-to-user linking |
| `@mcv/ui` | * | Wallet connect UI components (shadcn/ui based) |
| `@mcv/db` | * | PostgreSQL database access (Drizzle ORM) |
| `@mcv/cache` | * | Redis caching for balances, sessions |
| `@mcv/secrets` | * | KMS key references, API key management |
| `@mcv/fabric` | * | Event bus (wallet.connected, wallet.disconnected events) |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@solana/web3.js` | ^1.95 | Solana RPC, keypairs, transactions, balance queries |
| `tweetnacl` | ^1.0 | Ed25519 signature verification (Solana) |
| `viem` | ^2.21 | EVM chain interactions, EIP-191 verification |
| `@walletconnect/sign-client` | ^2.17 | WalletConnect v2 protocol client |
| `bs58` | ^6.0 | Base58 encoding/decoding (Solana addresses) |
| `@bonfida/spl-name-service` | ^3.0 | Solana Name Service (.sol) resolution |
| `@aws-sdk/client-kms` | ^3.x | AWS KMS for custodial wallet key management |

---

## Environment Variables

```bash
# Solana RPC
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...
SOLANA_RPC_WS_URL=wss://mainnet.helius-rpc.com/?api-key=...

# EVM RPCs
ETH_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/...
BASE_RPC_URL=https://mainnet.base.org

# WalletConnect
WALLETCONNECT_PROJECT_ID=...

# AWS KMS (Custodial Wallets)
AWS_KMS_KEY_ID=...
AWS_KMS_REGION=us-east-1

# Session Configuration
WALLET_SESSION_TTL_HOURS=24
NONCE_TTL_MINUTES=5

# Redis
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...
```

---

## Audit Events

| Event | Severity | Data Captured |
|-------|----------|---------------|
| `wallet.connected` | info | userId, address, chain, provider |
| `wallet.disconnected` | info | userId, address, sessionId |
| `wallet.linked` | info | userId, address, chain, isPrimary |
| `wallet.unlinked` | info | userId, address, chain |
| `wallet.primary_changed` | info | userId, oldWalletId, newWalletId |
| `wallet.verification.success` | info | address, chain, provider |
| `wallet.verification.failed` | warning | address, chain, reason |
| `wallet.nonce.generated` | info | address, chain, ip |
| `wallet.nonce.expired` | info | address, nonceId |
| `wallet.session.created` | info | userId, walletId, connectionMethod |
| `wallet.session.expired` | info | sessionId |
| `wallet.session.revoked` | info | sessionId, revokedBy |
| `wallet.tx.submitted` | info | walletId, txHash, type |
| `wallet.tx.confirmed` | info | walletId, txHash, fee |
| `wallet.tx.failed` | warning | walletId, txHash, error |
| `wallet.custodial.created` | info | userId, chain, kmsKeyId |
| `wallet.custodial.signed` | info | walletId, txHash |

---

*@mcv/web3-public/wallet-sdk — The Universal Web3 Wallet Connection Layer*
