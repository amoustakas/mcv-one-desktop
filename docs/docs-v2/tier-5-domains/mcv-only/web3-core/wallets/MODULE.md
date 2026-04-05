# @mcv/web3-core/wallets — Multi-Chain Wallet Management

**Parent Package:** @mcv/web3-core  
**Sub-Module:** wallets  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** MCV-ONLY (Critical Security Infrastructure)  
**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Purpose

The `wallets` sub-module is the cryptographic foundation of the MCV blockchain infrastructure. It manages the complete wallet lifecycle across all 9 MCV ventures: HD wallet derivation (BIP-44 for EVM, Solana-native derivation paths), KMS-backed key management for custodial/platform wallets, non-custodial wallet linking with cryptographic signature verification, multi-sig wallet coordination via Squads Protocol, transaction signing with batch capabilities, and comprehensive transaction history tracking.

**Every blockchain operation in the MCV ecosystem — from staking rewards to treasury disbursements to DeFi positions — originates from a wallet managed by this module.**

The module serves two distinct wallet populations:

1. **Platform-Managed Wallets (Custodial)**: Treasury wallets, rewards hot wallets, staking vaults, and operations wallets. These are created via HD derivation from KMS-encrypted master seeds. Private keys never exist in plaintext outside of KMS.

2. **User-Linked Wallets (Non-Custodial)**: End-user wallets (Phantom, MetaMask, Solflare, Ledger) linked via cryptographic signature verification. The platform **never** stores user private keys — only the public address and verification status.

**Security is paramount.** This module handles the most sensitive cryptographic material in the entire MCV ecosystem. Every key operation is audited, every signing event is logged, and every wallet address is compliance-screened before activation.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// WALLET SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  walletService,                    // Multi-chain wallet management singleton
  WalletService,                    // Class (for testing / DI)
} from './service';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE INPUT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  CreateWalletInput,                // Create a new managed (custodial) wallet
  CreateMultisigInput,              // Create a multi-sig wallet (Squads)
  DeriveWalletInput,                // Derive HD child wallet from master
  SignTransactionInput,             // Sign a transaction with KMS key
  LinkWalletInput,                  // Initiate external wallet linking
  VerifyWalletInput,                // Verify wallet ownership via signature
  TxHistoryOptions,                 // Transaction history query options
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// RESULT / OUTPUT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Wallet,                           // Managed wallet record
  WalletKey,                        // Encrypted key material record
  WalletDerivation,                 // HD derivation tree node
  WalletLink,                       // User-to-wallet association
  WalletTransaction,                // Transaction history entry
  WalletProvider,                   // External wallet provider metadata
  SignatureResult,                  // Transaction signing result
  BatchSignResult,                  // Batch signing results
  TokenBalance,                     // Single token balance
  ComplianceResult,                 // OFAC / compliance check result
  KeyStatusReport,                  // Key health / rotation status
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export {
  wallets,                          // web3_wallets — Managed wallet registry
  walletKeys,                       // web3_wallet_keys — Encrypted key material (KMS-wrapped)
  walletDerivations,                // web3_wallet_derivations — HD derivation tree
  walletLinks,                      // web3_wallet_links — User-to-wallet association
  walletTransactions,               // web3_wallet_transactions — Transaction history
  walletProviders,                  // web3_wallet_providers — External provider registry
} from './schema';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  chainEnum,                        // solana | ethereum | base | polygon
  walletTypeEnum,                   // custodial | non_custodial | multisig
  walletStatusEnum,                 // active | frozen | archived
} from './schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SUPPORTED_CHAINS,                 // Array of supported blockchain networks
  CHAIN_CONFIGS,                    // Chain-specific configuration (RPC URLs, explorers)
  DERIVATION_PATHS,                 // Standard derivation paths per chain
  NONCE_EXPIRY_MS,                  // Wallet verification nonce TTL (5 minutes)
  BALANCE_CACHE_TTL,                // Redis cache TTL for balances (10 seconds)
  MAX_BATCH_SIZE,                   // Max instructions per batch transaction (15)
  KEY_ROTATION_DAYS,                // Key rotation policy (90 days)
  CONFIRMATION_LEVELS,              // Solana commitment levels
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useWallet } from '../client/hooks/use-wallet';
export { useWalletBalance } from '../client/hooks/use-wallet-balance';
export { useTransactionHistory } from '../client/hooks/use-transaction-history';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       WALLETS SUB-MODULE ARCHITECTURE                            │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                          ENTRY POINTS                                      │  │
│  │                                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  tRPC Router │  │  Cron Jobs   │  │ Other Sub-   │  │  Client SDK  │  │  │
│  │  │  /api/web3/  │  │  Balance     │  │ modules      │  │  Phantom     │  │  │
│  │  │  wallets/*   │  │  Refresh     │  │  (tokens,    │  │  WalletAdapt │  │  │
│  │  │              │  │  Key Rotate  │  │   staking)   │  │  Solflare    │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │  │
│  │         └─────────────────┴──────────────────┴─────────────────┘          │  │
│  └──────────────────────────────────┬─────────────────────────────────────────┘  │
│                                     │                                            │
│  ┌──────────────────────────────────▼─────────────────────────────────────────┐  │
│  │                         WALLET SERVICE                                     │  │
│  │                                                                            │  │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────┐  │  │
│  │  │  Wallet Creation  │  │  Wallet Linking    │  │  Transaction Signing  │  │  │
│  │  │                   │  │                    │  │                       │  │  │
│  │  │ • createManaged   │  │ • initiateLink     │  │ • signTransaction     │  │  │
│  │  │ • deriveChild     │  │ • verifyLink       │  │ • signAndSend         │  │  │
│  │  │ • createMultisig  │  │ • unlinkWallet     │  │ • batchSignAndSend    │  │  │
│  │  └────────┬──────────┘  └────────┬───────────┘  └────────┬──────────────┘  │  │
│  │           │                      │                       │                  │  │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────┐  │  │
│  │  │  Balance & History│  │  Compliance        │  │  Key Management       │  │  │
│  │  │                   │  │                    │  │                       │  │  │
│  │  │ • getBalance      │  │ • runCompliance    │  │ • rotateKey           │  │  │
│  │  │ • getAllBalances   │  │ • checkSanctions   │  │ • getKeyStatus        │  │  │
│  │  │ • getTxHistory    │  │ • checkMixers      │  │ • deriveFromMaster    │  │  │
│  │  │ • refreshCache    │  │                    │  │ • zeroKeyMaterial     │  │  │
│  │  └────────┬──────────┘  └────────┬───────────┘  └────────┬──────────────┘  │  │
│  │           │                      │                       │                  │  │
│  └───────────┴──────────────────────┴───────────────────────┴──────────────────┘  │
│                                     │                                            │
│  ┌──────────────────────────────────▼─────────────────────────────────────────┐  │
│  │                    INFRASTRUCTURE LAYER                                     │  │
│  │                                                                            │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │  │
│  │  │ AWS KMS        │  │ Solana RPC     │  │ Redis Cache    │               │  │
│  │  │                │  │                │  │                │               │  │
│  │  │ • encrypt()    │  │ • getBalance() │  │ • balance TTL  │               │  │
│  │  │ • decrypt()    │  │ • sendTx()     │  │   (10 seconds) │               │  │
│  │  │ • generateKey()│  │ • simulate()   │  │ • nonce store  │               │  │
│  │  │ • sign()       │  │ • confirm()    │  │                │               │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘               │  │
│  │                                                                            │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │  │
│  │  │ Chainalysis    │  │ Squads Proto   │  │ @mcv/fabric    │               │  │
│  │  │                │  │                │  │                │               │  │
│  │  │ • sanctions    │  │ • multi-sig    │  │ • audit trail  │               │  │
│  │  │ • mixer detect │  │ • vaults       │  │ • event bus    │               │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘               │  │
│  │                                                                            │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                    DATABASE (PostgreSQL via Drizzle ORM)                    │  │
│  │                                                                            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────────────┐ │  │
│  │  │ web3_wallets│ │web3_wallet_ │ │web3_wallet_  │ │web3_wallet_links  │ │  │
│  │  │             │ │keys         │ │derivations   │ │                    │ │  │
│  │  └─────────────┘ └─────────────┘ └──────────────┘ └────────────────────┘ │  │
│  │  ┌─────────────────────┐ ┌─────────────────────┐                         │  │
│  │  │web3_wallet_         │ │web3_wallet_         │                         │  │
│  │  │transactions         │ │providers            │                         │  │
│  │  └─────────────────────┘ └─────────────────────┘                         │  │
│  │                                                                            │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Interfaces & Types

### Core Input Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// WALLET CREATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Create a new managed (custodial) wallet with KMS-backed key storage */
export interface CreateWalletInput {
  /** Venture that owns this wallet */
  ventureId: string;

  /** Human-readable label (e.g., "BetEdge Treasury", "Rewards Hot Wallet") */
  label: string;

  /** Optional description */
  description?: string;

  /** Target blockchain network */
  chain: SupportedChain;

  /** Wallet type — custodial wallets have KMS-managed keys */
  walletType: 'custodial' | 'multisig';

  /** Wallet purpose determines operational constraints */
  purpose: 'treasury' | 'rewards' | 'operations' | 'staking' | 'escrow';

  /** KMS key ARN for key encryption (defaults to env AWS_KMS_KEY_ARN) */
  kmsKeyArn?: string;

  /** Multi-sig configuration (required if walletType is 'multisig') */
  multisigConfig?: {
    threshold: number;              // Signatures required
    signers: string[];              // Signer public addresses
    protocol: 'squads' | 'gnosis'; // Multi-sig protocol
  };

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/** Create a multi-sig wallet via Squads Protocol or Gnosis Safe */
export interface CreateMultisigInput {
  ventureId: string;
  label: string;
  chain: SupportedChain;
  threshold: number;
  signers: string[];
  protocol: 'squads' | 'gnosis';
  purpose: 'treasury' | 'operations';
}

/** Derive an HD child wallet from a master wallet */
export interface DeriveWalletInput {
  /** Master wallet ID to derive from */
  masterWalletId: string;

  /** Purpose of the child wallet */
  purpose: string;

  /** Optional specific child index (auto-increments if not provided) */
  childIndex?: number;

  /** Use hardened derivation (recommended for security) */
  hardened?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WALLET LINKING (NON-CUSTODIAL)
// ═══════════════════════════════════════════════════════════════════════════════

/** Initiate the linking of a user's external wallet */
export interface LinkWalletInput {
  /** MCV user ID (from @mcv/identity) */
  userId: string;

  /** Blockchain network */
  chain: SupportedChain;

  /** Public wallet address (base58 for Solana, hex for EVM) */
  address: string;

  /** Wallet provider (e.g., "phantom", "metamask", "solflare", "ledger") */
  provider?: string;

  /** Set as primary wallet for this chain */
  setPrimary?: boolean;
}

/** Verify wallet ownership via cryptographic signature */
export interface VerifyWalletInput {
  /** Public wallet address */
  address: string;

  /** Signature of the challenge nonce */
  signature: string;

  /** The original nonce that was signed */
  nonce: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION SIGNING
// ═══════════════════════════════════════════════════════════════════════════════

/** Sign a transaction using a managed wallet's KMS-backed key */
export interface SignTransactionInput {
  /** Managed wallet ID (must be custodial type with KMS key) */
  walletId: string;

  /** Serialized transaction bytes (base64 encoded) */
  transactionBase64: string;

  /** Transaction type for audit logging */
  txType: 'transfer' | 'stake' | 'swap' | 'bridge' | 'governance' | 'deploy' | 'other';

  /** Description for audit trail */
  description?: string;

  /** Priority fee in microlamports (Solana) */
  priorityFee?: number;

  /** Skip simulation check (dangerous — use only in emergency) */
  skipSimulation?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Options for querying transaction history */
export interface TxHistoryOptions {
  /** Filter by transaction type */
  txType?: string;

  /** Filter by status */
  status?: 'pending' | 'confirmed' | 'finalized' | 'failed' | 'dropped';

  /** Filter by direction */
  direction?: 'inbound' | 'outbound' | 'internal';

  /** Filter by token mint */
  tokenMint?: string;

  /** Date range start */
  fromDate?: Date;

  /** Date range end */
  toDate?: Date;

  /** Pagination cursor */
  cursor?: string;

  /** Page size (default 50, max 200) */
  limit?: number;
}
```

### Core Output Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// WALLET RECORDS
// ═══════════════════════════════════════════════════════════════════════════════

/** Managed wallet record (as stored in database) */
export interface Wallet {
  id: string;
  ventureId: string;
  label: string;
  description: string | null;
  chain: SupportedChain;
  address: string;
  walletType: 'custodial' | 'non_custodial' | 'multisig';
  status: 'active' | 'frozen' | 'archived';
  purpose: string;
  derivationPath: string | null;
  parentWalletId: string | null;
  kmsKeyId: string | null;
  multisigConfig: {
    threshold: number;
    signers: string[];
    protocol: string;
  } | null;
  balanceCache: Record<string, string> | null;
  metadata: Record<string, unknown> | null;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Encrypted key material (KMS-wrapped) — never contains plaintext keys */
export interface WalletKey {
  id: string;
  walletId: string;
  keyType: 'ed25519' | 'secp256k1';
  encryptedPrivateKey: string | null;    // KMS ciphertext — NEVER plaintext
  kmsKeyArn: string;
  publicKey: string;
  keyVersion: number;
  isActive: boolean;
  rotatedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

/** HD derivation tree node */
export interface WalletDerivation {
  id: string;
  masterWalletId: string;
  childWalletId: string;
  derivationPath: string;
  childIndex: number;
  isHardened: boolean;
  purpose: string;
  createdAt: Date;
}

/** User-to-wallet association */
export interface WalletLink {
  id: string;
  userId: string;
  walletId: string | null;
  chain: SupportedChain;
  address: string;
  provider: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt: Date | null;
  verificationNonce: string | null;
  nonceExpiresAt: Date | null;
  complianceStatus: 'pending' | 'cleared' | 'flagged' | 'blocked';
  complianceCheckedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Transaction history entry */
export interface WalletTransaction {
  id: string;
  walletId: string;
  chain: SupportedChain;
  txSignature: string;
  txType: string;
  direction: 'inbound' | 'outbound' | 'internal';
  status: 'pending' | 'confirmed' | 'finalized' | 'failed' | 'dropped';
  fromAddress: string;
  toAddress: string;
  amount: string | null;
  tokenMint: string | null;
  fee: string | null;
  priorityFee: string | null;
  slot: number | null;
  blockTime: Date | null;
  confirmations: number;
  errorMessage: string | null;
  rawTransaction: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPERATION RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Result of a single transaction signing operation */
export interface SignatureResult {
  signature: string;              // Base58 transaction signature
  walletId: string;
  publicKey: string;
  signedAt: Date;
}

/** Result of batch signing operation */
export interface BatchSignResult {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    index: number;
    signature: string | null;
    error: string | null;
    status: 'success' | 'failed';
  }>;
  txSignatures: string[];         // Only successful signatures
}

/** Token balance for a specific mint */
export interface TokenBalance {
  tokenMint: string;
  symbol: string;
  balance: string;                // Raw amount (with decimals)
  decimals: number;
  uiBalance: string;             // Human-readable (e.g., "1,000.50")
  valueUsd: number | null;       // USD value if price available
  lastSyncedAt: Date;
}

/** OFAC / compliance screening result */
export interface ComplianceResult {
  address: string;
  chain: SupportedChain;
  status: 'cleared' | 'flagged' | 'blocked';
  sanctioned: boolean;
  mixerAssociated: boolean;
  exploitAssociated: boolean;
  riskScore: number;              // 0-100, higher = riskier
  details: string | null;
  checkedAt: Date;
  provider: 'chainalysis' | 'internal';
}

/** Key health and rotation status */
export interface KeyStatusReport {
  walletId: string;
  keyVersion: number;
  keyType: 'ed25519' | 'secp256k1';
  isActive: boolean;
  createdAt: Date;
  rotatedAt: Date | null;
  daysSinceRotation: number;
  rotationRequired: boolean;      // true if > 90 days since last rotation
  kmsKeyArn: string;
  kmsKeyStatus: 'Enabled' | 'Disabled' | 'PendingDeletion';
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAIN & CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Supported blockchain networks */
export type SupportedChain = 'solana' | 'ethereum' | 'base' | 'polygon';

/** Chain-specific configuration */
export interface ChainConfig {
  name: string;
  chainId: number | null;         // Null for Solana (uses cluster names)
  cluster?: string;               // Solana: mainnet-beta | devnet | testnet
  rpcUrl: string;
  fallbackRpcUrls: string[];
  explorerUrl: string;
  nativeToken: string;
  nativeDecimals: number;
  confirmationBlocks: number;     // 32 for Solana (finalized)
  keyAlgorithm: 'ed25519' | 'secp256k1';
  addressFormat: 'base58' | 'hex';
  derivationPath: string;         // "m/44'/501'/0'/0'" for Solana
}

/** Paginated result wrapper */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  cursor: string | null;          // For next page
  hasMore: boolean;
}
```

---

## Database Schema

```typescript
import { pgTable, uuid, text, timestamp, integer, numeric, boolean, jsonb, bigint, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { ventures } from '../../core/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export const chainEnum = pgEnum('web3_chain', ['solana', 'ethereum', 'base', 'polygon']);
export const walletTypeEnum = pgEnum('web3_wallet_type', ['custodial', 'non_custodial', 'multisig']);
export const walletStatusEnum = pgEnum('web3_wallet_status', ['active', 'frozen', 'archived']);

// ═══════════════════════════════════════════════════════════════════════════════
// web3_wallets — Managed Wallet Registry
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Core wallet table. Every venture has multiple managed wallets for different
 * purposes (treasury, rewards, operations, staking). Platform wallets use
 * KMS-backed keys; user wallets are linked via the wallet_links table.
 *
 * Indexes: ventureId, chain, address (unique), status
 */
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
}, (table) => ({
  ventureIdIdx: index('web3_wallets_venture_id_idx').on(table.ventureId),
  chainIdx: index('web3_wallets_chain_idx').on(table.chain),
  statusIdx: index('web3_wallets_status_idx').on(table.status),
  purposeIdx: index('web3_wallets_purpose_idx').on(table.purpose),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_wallet_keys — Encrypted Key Material (KMS-wrapped)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Stores encrypted private key material for custodial wallets. The
 * encryptedPrivateKey field contains AWS KMS ciphertext — NEVER plaintext.
 * Only the designated KMS key ARN can decrypt this material.
 *
 * ⚠️  CRITICAL SECURITY: This table is the most sensitive in the entire
 * MCV database. Access must be restricted to the wallet service only.
 * Direct database queries to this table should be audit-logged.
 */
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
}, (table) => ({
  walletIdIdx: index('web3_wallet_keys_wallet_id_idx').on(table.walletId),
  activeIdx: index('web3_wallet_keys_active_idx').on(table.isActive),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_wallet_derivations — HD Wallet Derivation Tree
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tracks the HD derivation hierarchy. Each venture has a master wallet;
 * child wallets are derived at sequential indices for different purposes:
 *   Index 0: Treasury
 *   Index 1: Rewards
 *   Index 2: Operations
 *   Index 3: Staking
 *   Index 4+: Additional purpose-specific wallets
 *
 * Derivation path format (Solana): m/44'/501'/{ventureIndex}'/{childIndex}'
 */
export const walletDerivations = pgTable('web3_wallet_derivations', {
  id: uuid('id').primaryKey().defaultRandom(),
  masterWalletId: uuid('master_wallet_id').notNull().references(() => wallets.id),
  childWalletId: uuid('child_wallet_id').notNull().references(() => wallets.id),
  derivationPath: text('derivation_path').notNull(),      // "m/44'/501'/0'/0'"
  childIndex: integer('child_index').notNull(),           // 0, 1, 2, ...
  isHardened: boolean('is_hardened').default(true),
  purpose: text('purpose').notNull(),                     // What this child wallet is for
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  masterIdx: index('web3_derivations_master_idx').on(table.masterWalletId),
  childIdx: uniqueIndex('web3_derivations_child_idx').on(table.childWalletId),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_wallet_links — User-to-Wallet Association
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Links external (non-custodial) wallets to MCV users. Users connect their
 * Phantom/MetaMask/Solflare wallets by signing a challenge nonce. The platform
 * NEVER stores user private keys — only the public address and verification status.
 *
 * Flow: initiateLink → user signs nonce → verifyLink → compliance check → linked
 */
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
}, (table) => ({
  userIdIdx: index('web3_wallet_links_user_id_idx').on(table.userId),
  addressIdx: index('web3_wallet_links_address_idx').on(table.address),
  userChainIdx: index('web3_wallet_links_user_chain_idx').on(table.userId, table.chain),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_wallet_transactions — Transaction History
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Complete transaction history for all managed wallets. Indexed by signature
 * (unique) for deduplication. Status progression: pending → confirmed → finalized.
 * Failed transactions retain the errorMessage for debugging.
 */
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
}, (table) => ({
  walletIdIdx: index('web3_wallet_tx_wallet_id_idx').on(table.walletId),
  txTypeIdx: index('web3_wallet_tx_type_idx').on(table.txType),
  statusIdx: index('web3_wallet_tx_status_idx').on(table.status),
  blockTimeIdx: index('web3_wallet_tx_block_time_idx').on(table.blockTime),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// web3_wallet_providers — Supported External Wallet Providers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Registry of supported external wallet providers. Used by the client SDK
 * to display wallet connection options and deep links on mobile.
 */
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

---

## Core Service Interface

```typescript
export class WalletService {
  constructor(
    private readonly db: DrizzleDB,
    private readonly kms: KMSClient,
    private readonly rpc: SolanaRpcClient,
    private readonly cache: RedisClient,
    private readonly compliance: ComplianceService,
    private readonly audit: AuditService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // WALLET CREATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new managed (custodial) wallet with KMS-backed key storage.
   *
   * Generates a new keypair, encrypts the private key with KMS, stores the
   * ciphertext in the database, and returns the wallet record with public address.
   *
   * @throws W3_WALLET_CREATION_FAILED - if KMS encryption fails
   */
  async createManagedWallet(input: CreateWalletInput): Promise<Wallet>;

  /**
   * Derive an HD child wallet from a master wallet.
   *
   * Uses BIP-44 derivation paths for EVM chains and Solana-native paths for Solana.
   * The child's private key is independently encrypted with KMS.
   *
   * Solana path: m/44'/501'/{ventureIndex}'/{childIndex}'
   * EVM path:    m/44'/60'/0'/0/{childIndex}
   *
   * @throws W3_WALLET_NOT_FOUND - if master wallet doesn't exist
   * @throws W3_DERIVATION_FAILED - if key derivation fails
   */
  async deriveChildWallet(input: DeriveWalletInput): Promise<{
    wallet: Wallet;
    derivation: WalletDerivation;
  }>;

  /**
   * Create a multi-sig wallet via Squads Protocol (Solana) or Gnosis Safe (EVM).
   *
   * Deploys an on-chain multi-sig vault with the specified threshold and signers.
   * The vault address becomes the wallet's public address.
   *
   * @throws W3_MULTISIG_CREATION_FAILED - if on-chain deployment fails
   */
  async createMultisigWallet(input: CreateMultisigInput): Promise<Wallet>;

  // ═══════════════════════════════════════════════════════════════════════════
  // WALLET LINKING (NON-CUSTODIAL)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initiate wallet linking by generating a challenge nonce.
   *
   * Returns a nonce and human-readable message that the user must sign with
   * their wallet. The nonce expires after 5 minutes.
   *
   * @throws W3_COMPLIANCE_BLOCKED - if address is sanctioned
   */
  async initiateWalletLink(input: LinkWalletInput): Promise<{
    nonce: string;
    message: string;
    expiresAt: Date;
  }>;

  /**
   * Verify wallet ownership by validating the signed nonce.
   *
   * Uses Ed25519 verification for Solana (tweetnacl) and ECDSA for EVM (ethers).
   * After verification, runs a compliance check on the address.
   *
   * @throws W3_INVALID_SIGNATURE - if signature verification fails
   * @throws W3_NONCE_EXPIRED - if nonce has expired
   * @throws W3_COMPLIANCE_BLOCKED - if address is flagged
   */
  async verifyWalletLink(input: VerifyWalletInput): Promise<WalletLink>;

  /**
   * Unlink a wallet from a user.
   *
   * Removes the association but retains the record for audit purposes
   * (sets isVerified=false, isActive=false).
   */
  async unlinkWallet(linkId: string): Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSACTION SIGNING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sign a transaction using a managed wallet's KMS-backed key.
   *
   * 1. Validates the wallet is active and custodial
   * 2. Decrypts the private key from KMS (in-memory only)
   * 3. Signs the transaction
   * 4. Immediately zeros the key material from memory
   * 5. Returns the signature
   *
   * @throws W3_WALLET_NOT_FOUND - if wallet doesn't exist
   * @throws W3_WALLET_FROZEN - if wallet is frozen
   * @throws W3_SIGNING_FAILED - if KMS decryption or signing fails
   */
  async signTransaction(input: SignTransactionInput): Promise<SignatureResult>;

  /**
   * Sign and send a transaction in one atomic operation.
   *
   * After signing, the transaction is submitted to the Solana RPC with
   * preflight checks. The method returns immediately with the signature
   * and starts tracking confirmation status asynchronously.
   *
   * @throws W3_TX_SIMULATION_FAILED - if simulation fails (unless skipSimulation)
   * @throws W3_RPC_TIMEOUT - if RPC submission times out
   */
  async signAndSendTransaction(input: SignTransactionInput): Promise<{
    signature: string;
    status: string;
  }>;

  /**
   * Batch sign and send multiple transactions.
   *
   * Groups up to 15 instructions per Solana transaction for fee efficiency.
   * Larger batches are split into multiple transactions automatically.
   * Returns partial results — some may succeed while others fail.
   *
   * @returns BatchSignResult with per-transaction status
   */
  async batchSignAndSend(inputs: SignTransactionInput[]): Promise<BatchSignResult>;

  // ═══════════════════════════════════════════════════════════════════════════
  // BALANCE & HISTORY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get balance for a specific token (or native SOL if no mint specified).
   *
   * First checks Redis cache (10-second TTL). On cache miss, queries the
   * Solana RPC directly and updates the cache.
   */
  async getBalance(walletId: string, tokenMint?: string): Promise<TokenBalance>;

  /**
   * Get all token balances for a wallet.
   *
   * Fetches all Associated Token Accounts (ATAs) for the wallet address
   * and returns balances with USD values where available.
   */
  async getAllBalances(walletId: string): Promise<TokenBalance[]>;

  /**
   * Get paginated transaction history for a wallet.
   */
  async getTransactionHistory(
    walletId: string,
    options?: TxHistoryOptions,
  ): Promise<PaginatedResult<WalletTransaction>>;

  /**
   * Force-refresh the balance cache for a wallet.
   *
   * Bypasses Redis cache and fetches directly from RPC.
   * Useful after a known transaction to get the latest balance.
   */
  async refreshBalanceCache(walletId: string): Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLIANCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Run a compliance check on a wallet address.
   *
   * Checks: OFAC sanctions list, known mixer addresses,
   * exploit-associated addresses, and Chainalysis risk scoring.
   */
  async runComplianceCheck(address: string): Promise<ComplianceResult>;

  /**
   * Get all linked wallets for a user across all chains.
   */
  async getWalletsByUser(userId: string): Promise<WalletLink[]>;

  // ═══════════════════════════════════════════════════════════════════════════
  // KEY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Rotate a wallet's encryption key.
   *
   * 1. Generates a new keypair
   * 2. Encrypts with KMS
   * 3. Transfers all assets from old address to new address
   * 4. Updates the wallet record
   * 5. Archives the old key (rotatedAt set, isActive=false)
   *
   * ⚠️  This changes the wallet's public address!
   *
   * @throws W3_ROTATION_FAILED - if asset transfer or encryption fails
   */
  async rotateKey(walletId: string): Promise<WalletKey>;

  /**
   * Get the key health status for a wallet.
   *
   * Reports key age, rotation status, and whether rotation is required
   * (keys older than 90 days).
   */
  async getKeyStatus(walletId: string): Promise<KeyStatusReport>;
}
```

---

## Wallet Link Verification Flow

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

---

## Code Examples

### Example 1: Create a Venture Treasury Wallet

```typescript
import { walletService } from '@mcv/web3-core';

// Create a new custodial treasury wallet for BetEdge
const treasury = await walletService.createManagedWallet({
  ventureId: 'venture_betedge_uuid',
  label: 'BetEdge Treasury',
  description: 'Primary treasury vault for BetEdge venture',
  chain: 'solana',
  walletType: 'custodial',
  purpose: 'treasury',
});

console.log(treasury);
// {
//   id: '550e8400-e29b-41d4-a716-446655440000',
//   ventureId: 'venture_betedge_uuid',
//   label: 'BetEdge Treasury',
//   chain: 'solana',
//   address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
//   walletType: 'custodial',
//   status: 'active',
//   purpose: 'treasury',
//   kmsKeyId: 'arn:aws:kms:us-east-1:123456789:key/abc-def-ghi',
//   ...
// }
```

### Example 2: Derive HD Child Wallets

```typescript
import { walletService } from '@mcv/web3-core';

// Derive child wallets from the master for different purposes
const rewardsWallet = await walletService.deriveChildWallet({
  masterWalletId: 'master_wallet_uuid',
  purpose: 'rewards',
  hardened: true,
});

console.log(rewardsWallet);
// {
//   wallet: {
//     id: '...',
//     label: 'BetEdge Treasury / rewards (index 1)',
//     address: '3yFwqXBfZY4jBVUafQ4YG1UoXEF2DjKfKMkSfiL5jzYR',
//     derivationPath: "m/44'/501'/0'/1'",
//     parentWalletId: 'master_wallet_uuid',
//     purpose: 'rewards',
//     ...
//   },
//   derivation: {
//     masterWalletId: 'master_wallet_uuid',
//     childWalletId: '...',
//     derivationPath: "m/44'/501'/0'/1'",
//     childIndex: 1,
//     isHardened: true,
//     purpose: 'rewards',
//   }
// }

// Derive additional wallets
const stakingWallet = await walletService.deriveChildWallet({
  masterWalletId: 'master_wallet_uuid',
  purpose: 'staking',
  hardened: true,
});
// Automatically gets childIndex: 2, path: "m/44'/501'/0'/2'"
```

### Example 3: Link and Verify a User's Phantom Wallet

```typescript
import { walletService } from '@mcv/web3-core';

// Step 1: Initiate the wallet link (server-side)
const linkRequest = await walletService.initiateWalletLink({
  userId: 'user_uuid',
  chain: 'solana',
  address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
  provider: 'phantom',
  setPrimary: true,
});

console.log(linkRequest);
// {
//   nonce: 'a1b2c3d4e5f6...',
//   message: 'Sign this message to verify ownership of your wallet on MCV:\n\nNonce: a1b2c3d4e5f6...\nTimestamp: 2026-02-08T20:30:00Z',
//   expiresAt: '2026-02-08T20:35:00Z'  // 5 minutes from now
// }

// Step 2: User signs the message in Phantom (client-side)
// const signature = await phantomProvider.signMessage(new TextEncoder().encode(linkRequest.message));

// Step 3: Verify the signature (server-side)
const link = await walletService.verifyWalletLink({
  address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
  signature: 'base58_encoded_signature_here',
  nonce: linkRequest.nonce,
});

console.log(link);
// {
//   id: '...',
//   userId: 'user_uuid',
//   chain: 'solana',
//   address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
//   provider: 'phantom',
//   isPrimary: true,
//   isVerified: true,
//   verifiedAt: '2026-02-08T20:30:15Z',
//   complianceStatus: 'cleared',
// }
```

### Example 4: Sign and Send a Batch Transaction

```typescript
import { walletService } from '@mcv/web3-core';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

// Build multiple transfer instructions
const transfers = [
  { to: 'addr1...', amount: 1000000000n },  // 1 EDGE
  { to: 'addr2...', amount: 2000000000n },  // 2 EDGE
  { to: 'addr3...', amount: 500000000n },   // 0.5 EDGE
  // ... up to 15 per transaction
];

// Create transaction inputs
const inputs = transfers.map((t) => ({
  walletId: 'rewards_wallet_uuid',
  transactionBase64: buildTransferTx(t.to, t.amount).serialize().toString('base64'),
  txType: 'transfer' as const,
  description: `Reward distribution to ${t.to}`,
  priorityFee: 5000, // 5000 microlamports
}));

// Batch sign and send
const result = await walletService.batchSignAndSend(inputs);

console.log(result);
// {
//   total: 3,
//   succeeded: 3,
//   failed: 0,
//   results: [
//     { index: 0, signature: '5xYk...', error: null, status: 'success' },
//     { index: 1, signature: '3mNp...', error: null, status: 'success' },
//     { index: 2, signature: '9qWr...', error: null, status: 'success' },
//   ],
//   txSignatures: ['5xYk...', '3mNp...', '9qWr...'],
// }
```

### Example 5: Check Compliance and Get Key Status

```typescript
import { walletService } from '@mcv/web3-core';

// Run compliance check on an external address
const compliance = await walletService.runComplianceCheck(
  'SomeExternalWalletAddress123...'
);

console.log(compliance);
// {
//   address: 'SomeExternalWalletAddress123...',
//   chain: 'solana',
//   status: 'cleared',       // or 'flagged' or 'blocked'
//   sanctioned: false,
//   mixerAssociated: false,
//   exploitAssociated: false,
//   riskScore: 12,           // 0-100
//   details: null,
//   checkedAt: '2026-02-08T20:30:00Z',
//   provider: 'chainalysis',
// }

// Check key health for a managed wallet
const keyStatus = await walletService.getKeyStatus('treasury_wallet_uuid');

console.log(keyStatus);
// {
//   walletId: 'treasury_wallet_uuid',
//   keyVersion: 3,
//   keyType: 'ed25519',
//   isActive: true,
//   createdAt: '2025-11-15T10:00:00Z',
//   rotatedAt: '2025-11-15T10:00:00Z',
//   daysSinceRotation: 85,
//   rotationRequired: false,   // Under 90 days
//   kmsKeyArn: 'arn:aws:kms:us-east-1:...',
//   kmsKeyStatus: 'Enabled',
// }
```

### Example 6: Create a Multi-Sig Wallet

```typescript
import { walletService } from '@mcv/web3-core';

// Create a 3-of-5 multi-sig treasury vault via Squads Protocol
const multisig = await walletService.createMultisigWallet({
  ventureId: 'venture_betedge_uuid',
  label: 'BetEdge Multi-Sig Treasury',
  chain: 'solana',
  threshold: 3,
  signers: [
    '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',  // CTO
    '3yFwqXBfZY4jBVUafQ4YG1UoXEF2DjKfKMkSfiL5jzYR',  // CFO
    'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',  // Treasury Manager
    '9QgXqrgdbVU8KcpfskqJpAXKzbaYQJecgMAruSWoXGkM',  // Legal
    'HN7cABqLq46Es1jh92dQQisAi5YqpMn2RQhvVwHnY9FC',  // External Auditor
  ],
  protocol: 'squads',
  purpose: 'treasury',
});

console.log(multisig);
// {
//   id: '...',
//   label: 'BetEdge Multi-Sig Treasury',
//   walletType: 'multisig',
//   address: 'SquadsPDAAddress123...',
//   multisigConfig: {
//     threshold: 3,
//     signers: ['7xKX...', '3yFw...', 'DRpb...', '9QgX...', 'HN7c...'],
//     protocol: 'squads',
//   },
//   ...
// }
```

### Example 7: Get All Balances with USD Values

```typescript
import { walletService } from '@mcv/web3-core';

const balances = await walletService.getAllBalances('treasury_wallet_uuid');

console.log(balances);
// [
//   {
//     tokenMint: 'So11111111111111111111111111111111111111112',
//     symbol: 'SOL',
//     balance: '15234000000',          // 15.234 SOL (9 decimals)
//     decimals: 9,
//     uiBalance: '15.234',
//     valueUsd: 2743.12,
//     lastSyncedAt: '2026-02-08T20:30:00Z',
//   },
//   {
//     tokenMint: 'EDGExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
//     symbol: 'EDGE',
//     balance: '1000000000000000',     // 1,000,000 EDGE (9 decimals)
//     decimals: 9,
//     uiBalance: '1,000,000',
//     valueUsd: 150000.00,
//     lastSyncedAt: '2026-02-08T20:30:00Z',
//   },
//   {
//     tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
//     symbol: 'USDC',
//     balance: '50000000000',          // 50,000 USDC (6 decimals)
//     decimals: 6,
//     uiBalance: '50,000',
//     valueUsd: 50000.00,
//     lastSyncedAt: '2026-02-08T20:30:00Z',
//   },
// ]
```

---

## Audit Events

All wallet operations are logged to the `@mcv/fabric` audit system:

| Event | Severity | Data Captured |
|-------|----------|---------------|
| `web3.wallet.created` | info | walletId, ventureId, chain, purpose, walletType |
| `web3.wallet.derived` | info | masterWalletId, childWalletId, derivationPath, childIndex |
| `web3.wallet.multisig_created` | info | walletId, threshold, signerCount, protocol |
| `web3.wallet.frozen` | warning | walletId, reason, frozenBy |
| `web3.wallet.unfrozen` | info | walletId, unfrozenBy |
| `web3.wallet.link_initiated` | info | userId, address, chain, provider |
| `web3.wallet.link_verified` | info | userId, address, chain, complianceStatus |
| `web3.wallet.link_failed` | warning | userId, address, reason (signature/nonce/compliance) |
| `web3.wallet.unlinked` | info | userId, address, linkId |
| `web3.wallet.tx_signed` | info | walletId, txSignature, txType |
| `web3.wallet.tx_sent` | info | walletId, txSignature, status |
| `web3.wallet.tx_confirmed` | info | walletId, txSignature, confirmations, slot |
| `web3.wallet.tx_failed` | warning | walletId, txSignature, errorMessage |
| `web3.wallet.batch_signed` | info | walletId, total, succeeded, failed |
| `web3.wallet.balance_refreshed` | info | walletId, balances |
| `web3.wallet.compliance_check` | info | address, status, riskScore |
| `web3.wallet.compliance_blocked` | warning | address, reason (sanctioned/mixer/exploit) |
| `web3.wallet.key_rotated` | warning | walletId, oldKeyVersion, newKeyVersion |
| `web3.wallet.key_rotation_required` | warning | walletId, daysSinceRotation |

---

## Error Codes

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `W3_WALLET_NOT_FOUND` | 404 | Wallet ID does not exist | Verify wallet ID is correct |
| `W3_WALLET_FROZEN` | 403 | Wallet is frozen by admin | Contact admin to unfreeze wallet |
| `W3_WALLET_ARCHIVED` | 403 | Wallet has been archived | Archived wallets cannot be used |
| `W3_WALLET_CREATION_FAILED` | 500 | KMS encryption or key generation failed | Check KMS permissions and key status |
| `W3_WALLET_UNVERIFIED` | 401 | Wallet link not yet verified | Complete the signature verification flow |
| `W3_INVALID_SIGNATURE` | 401 | Ed25519/ECDSA signature verification failed | Re-sign with the correct private key |
| `W3_NONCE_EXPIRED` | 400 | Verification nonce has expired (>5 min) | Call initiateWalletLink for a new nonce |
| `W3_COMPLIANCE_BLOCKED` | 403 | Address flagged by compliance screening | Address is sanctioned or flagged |
| `W3_INSUFFICIENT_BALANCE` | 400 | Not enough tokens for the operation | Check balance before transacting |
| `W3_SIGNING_FAILED` | 500 | KMS decryption or signing operation failed | Check KMS key status and permissions |
| `W3_TX_SIMULATION_FAILED` | 400 | On-chain transaction simulation failed | Check accounts, amounts, and instruction data |
| `W3_RPC_TIMEOUT` | 504 | Solana RPC endpoint timed out | Retry — failover RPC will be used |
| `W3_RPC_RATE_LIMITED` | 429 | RPC provider rate limited | Wait for cooldown before retrying |
| `W3_DERIVATION_FAILED` | 500 | HD key derivation failed | Check master wallet key status |
| `W3_MULTISIG_CREATION_FAILED` | 500 | On-chain multi-sig vault deployment failed | Check signers and RPC availability |
| `W3_ROTATION_FAILED` | 500 | Key rotation and asset transfer failed | Manual intervention required |
| `W3_DUPLICATE_LINK` | 409 | Wallet address already linked to a user | Unlink first or use different address |
| `W3_MAX_WALLETS_EXCEEDED` | 400 | User has reached max linked wallets (10) | Unlink unused wallets |

---

## Security

### ⚠️ CRITICAL: This module handles the most sensitive cryptographic material in the MCV ecosystem.

#### Key Management Principles

1. **KMS-Only Key Storage**: Private keys for managed wallets are **never** stored in plaintext anywhere — not in the database, not in environment variables, not in logs, not in error messages. All key material is encrypted using AWS KMS envelope encryption. The `encryptedPrivateKey` column in `web3_wallet_keys` contains KMS ciphertext that can only be decrypted by calling `kms.decrypt()` with the correct key ARN.

2. **Zero Plaintext in Memory**: When signing a transaction, the private key is decrypted from KMS into a `Uint8Array`, used for the signing operation, and immediately zeroed (`array.fill(0)`). The signing process runs in a dedicated function scope with no closures that could retain the key material.

3. **Key Rotation Policy**: All managed wallet keys must be rotated every 90 days. The `getKeyStatus` method reports `rotationRequired: true` when a key exceeds this age. The `rotateKey` method:
   - Generates a new keypair
   - Encrypts the new key with KMS
   - Transfers all assets from the old address to the new address
   - Archives the old key (sets `isActive=false`, records `rotatedAt`)
   - The old key is never deleted — retained for audit

4. **No User Private Keys**: The platform **absolutely never** stores, touches, or has access to end-user private keys. Non-custodial wallet linking uses a challenge-response pattern where the user signs a nonce client-side.

#### Compliance & Screening

5. **OFAC Sanctions Screening**: Every wallet address is checked against OFAC sanctions lists (via Chainalysis API) before linking or receiving tokens. Sanctioned addresses are blocked immediately.

6. **Mixer Detection**: Addresses associated with known mixers (Tornado Cash, Blender.io, etc.) are automatically flagged and blocked from linking.

7. **Pre-Transfer Compliance**: Every outbound transfer from a managed wallet runs a compliance check on the destination address. Transfers to flagged addresses are rejected.

#### Transaction Security

8. **Simulation Before Send**: Every transaction is simulated on-chain before signing and sending. If simulation reveals an error (insufficient funds, invalid accounts, etc.), the transaction is rejected before any signing occurs.

9. **Nonce Expiration**: Wallet verification nonces expire after exactly 5 minutes. This prevents replay attacks where a captured nonce could be used later.

10. **Rate Limiting**: All wallet operations are rate-limited:
    - Wallet creation: 10/hour per venture
    - Link initiation: 5/15min per user
    - Transaction signing: 100/min per wallet
    - Balance queries: 60/min per wallet

### Security Checklist

- [ ] All private keys stored as KMS-encrypted ciphertext only
- [ ] Key material zeroed from memory immediately after use
- [ ] Key rotation policy enforced (90-day maximum)
- [ ] No user private keys stored anywhere in the system
- [ ] OFAC sanctions screening on all wallet links
- [ ] Mixer address detection and blocking
- [ ] Pre-transfer compliance checks on destination addresses
- [ ] Transaction simulation before every send
- [ ] Nonce expiration enforced (5-minute maximum)
- [ ] Rate limiting on all wallet operations
- [ ] Audit trail logging for every wallet operation
- [ ] Database access to `web3_wallet_keys` restricted and logged
- [ ] Multi-sig required for all treasury wallets in production
- [ ] Balance cache TTL configured (10 seconds)
- [ ] RPC failover configured across multiple providers

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @solana/web3.js | ^1.95.x | Solana RPC, transactions, keypairs |
| @aws-sdk/client-kms | ^3.x | AWS KMS encrypt/decrypt for key management |
| tweetnacl | ^1.0.x | Ed25519 signing and signature verification |
| bs58 | ^6.x | Base58 encoding/decoding for Solana addresses |
| @sqds/multisig | ^2.x | Squads Protocol multi-sig vault creation |
| ethers | ^6.x | EVM wallet operations (future expansion) |
| drizzle-orm | ^0.36.x | Database ORM for schema and queries |
| ioredis | ^5.x | Redis client for balance caching |

---

## Environment Variables

```bash
# ── Solana RPC ──────────────────────────────────────────────────────────
SOLANA_RPC_URL=                    # Primary RPC endpoint (Helius)
SOLANA_RPC_FALLBACK_1=             # Fallback RPC (Triton)
SOLANA_RPC_FALLBACK_2=             # Fallback RPC (QuickNode)
SOLANA_CLUSTER=mainnet-beta        # mainnet-beta | devnet | testnet

# ── Key Management ──────────────────────────────────────────────────────
AWS_KMS_KEY_ARN=                   # KMS key ARN for wallet encryption
AWS_KMS_REGION=us-east-1           # AWS region for KMS

# ── Compliance ──────────────────────────────────────────────────────────
CHAINALYSIS_API_KEY=               # Chainalysis compliance API key
OFAC_LIST_URL=                     # OFAC SDN list URL (auto-updated)

# ── Redis ───────────────────────────────────────────────────────────────
REDIS_URL=                         # Redis for balance caching
REDIS_BALANCE_CACHE_TTL=10         # Balance cache TTL in seconds (default: 10)

# ── Wallet Limits ───────────────────────────────────────────────────────
MAX_WALLETS_PER_USER=10            # Max linked wallets per user
NONCE_EXPIRY_SECONDS=300           # Nonce expiry (default: 300 = 5 min)
KEY_ROTATION_DAYS=90               # Key rotation policy (default: 90)
```

---

*@mcv/web3-core/wallets — Multi-Chain Wallet Management*
