# @mcv/web3-public — Package Specification
## Tier 5: Domain Layer (PUBLISHABLE)

**Package:** `@mcv/web3-public`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/web3-public` provides consumer-facing Web3 infrastructure for ventures building on blockchain. It includes the Wallet SDK for wallet connections and transactions, NFT management for digital collectibles, Oracle integrations for off-chain data, and Attestation services for on-chain identity verification.

**This package is the public interface to Web3 — what users interact with directly.**

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER-FACING APPLICATIONS                             │
│                                                                              │
│  BetEdge dApp  │  SerpSpace Wallet  │  NFT Marketplace  │  Identity Portal │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ uses
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           @mcv/web3-public                                   │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          WALLET-SDK                                    │  │
│  │  connect │ sign │ transactions │ balances │ multi-chain │ custody     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                             NFTS                                       │  │
│  │  collections │ minting │ transfers │ metadata │ royalties │ marketplace│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                           ORACLES                                      │  │
│  │  price-feeds │ randomness │ sports │ custom │ aggregation             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         ATTESTATION                                    │  │
│  │  kyc │ age │ jurisdiction │ credentials │ verifiable │ privacy        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ depends on
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LOWER TIER PACKAGES                                 │
│                                                                              │
│  @mcv/db  │  @mcv/auth  │  @mcv/cache  │  @mcv/events  │  @mcv/storage     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Features |
|--------|---------|--------------|
| **wallet-sdk** | Wallet connections & transactions | Multi-wallet, multi-chain, custodial |
| **nfts** | NFT management | Collections, minting, transfers, marketplace |
| **oracles** | External data feeds | Prices, randomness, sports data |
| **attestation** | On-chain identity | KYC attestations, verifiable credentials |

---

## Module: wallet-sdk

### Purpose

The Wallet SDK provides a unified interface for connecting to Web3 wallets across multiple chains and providers. It supports both self-custodial wallets (Phantom, MetaMask) and custodial wallets managed by MCV.

### Data Models

```typescript
// @mcv/web3-public/wallet-sdk/schema.ts
import { pgTable, text, jsonb, timestamp, boolean, numeric, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const chainEnum = pgEnum('wallet_chain', [
  'solana',
  'ethereum',
  'base',
  'polygon',
  'arbitrum',
  'optimism',
  'avalanche',
  'bsc'
]);

export const walletProviderEnum = pgEnum('wallet_provider', [
  'phantom',
  'solflare',
  'metamask',
  'coinbase',
  'walletconnect',
  'privy',
  'magic',
  'kms'  // MCV custodial
]);

// User Wallets
export const userWallets = pgTable('user_wallet', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),
  
  // Wallet identity
  chain: chainEnum('chain').notNull(),
  address: text('address').notNull(),
  
  // Connection details
  provider: walletProviderEnum('provider'),
  isCustodial: boolean('is_custodial').default(false),
  isPrimary: boolean('is_primary').default(false),
  
  // Verification
  verifiedAt: timestamp('verified_at'),
  verificationSignature: text('verification_signature'),
  
  // ENS / SNS resolution
  resolvedName: text('resolved_name'),
  
  // Metadata
  label: text('label'), // User-provided label
  metadata: jsonb('metadata').$type<{
    publicKey?: string;
    derivationPath?: string;
    custodialWalletId?: string;
  }>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  chainAddressUnq: uniqueIndex('wallet_chain_address_unq').on(t.chain, t.address),
  userChainIdx: uniqueIndex('wallet_user_chain_idx').on(t.userId, t.chain),
}));

// Wallet Sessions (connected wallet sessions)
export const walletSessions = pgTable('wallet_session', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  walletId: text('wallet_id').notNull().references(() => userWallets.id),
  userId: text('user_id').notNull(),
  
  // Session details
  sessionToken: text('session_token').notNull().unique(),
  provider: walletProviderEnum('provider'),
  
  // Connection state
  isActive: boolean('is_active').default(true),
  connectedAt: timestamp('connected_at').defaultNow(),
  lastActivity: timestamp('last_activity').defaultNow(),
  expiresAt: timestamp('expires_at'),
  
  // Client info
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
});

// Transaction Index (off-chain mirror for querying)
export const walletTransactions = pgTable('wallet_transaction', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  walletId: text('wallet_id').references(() => userWallets.id),
  
  // Chain reference
  chain: chainEnum('chain').notNull(),
  txHash: text('tx_hash').notNull(),
  blockNumber: numeric('block_number'),
  
  // Transaction details
  type: text('type').notNull(), // 'transfer', 'swap', 'stake', 'nft_mint', 'contract_call'
  status: text('status').notNull().default('pending'), // 'pending', 'confirmed', 'failed'
  
  // From/To
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address'),
  
  // Value
  amount: numeric('amount', { precision: 24, scale: 8 }),
  tokenSymbol: text('token_symbol'),
  tokenMint: text('token_mint'),
  
  // Gas/fees
  fee: numeric('fee', { precision: 18, scale: 8 }),
  feeToken: text('fee_token'),
  
  // Additional data
  inputData: text('input_data'),
  logs: jsonb('logs').$type<unknown[]>(),
  
  confirmedAt: timestamp('confirmed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  txHashUnq: uniqueIndex('tx_hash_chain_unq').on(t.chain, t.txHash),
}));

// Wallet Nonce (for signature verification)
export const walletNonces = pgTable('wallet_nonce', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  address: text('address').notNull(),
  chain: chainEnum('chain').notNull(),
  
  nonce: text('nonce').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Types & Interfaces

```typescript
// @mcv/web3-public/wallet-sdk/types.ts

export type Chain = 'solana' | 'ethereum' | 'base' | 'polygon' | 'arbitrum' | 'optimism';

export interface WalletAdapter {
  name: string;
  icon: string;
  chain: Chain;
  
  connect(): Promise<WalletConnection>;
  disconnect(): Promise<void>;
  signMessage(message: string): Promise<string>;
  signTransaction(transaction: unknown): Promise<unknown>;
  sendTransaction(transaction: unknown): Promise<string>;
  
  isConnected: boolean;
  publicKey: string | null;
}

export interface WalletConnection {
  address: string;
  publicKey: string;
  chain: Chain;
  provider: string;
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  usdValue?: number;
  logoUri?: string;
}

export interface NFTBalance {
  mint: string;
  name: string;
  symbol: string;
  image: string;
  collection?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export interface TransactionRequest {
  chain: Chain;
  to: string;
  value?: string;
  data?: string;
  // Token transfer specifics
  tokenMint?: string;
  tokenAmount?: string;
}

export interface TransactionResult {
  hash: string;
  chain: Chain;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  fee?: string;
}
```

### API Surface

```typescript
// @mcv/web3-public/wallet-sdk/router.ts
import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '@mcv/api/trpc';

export const walletRouter = router({
  // Connection Management
  getNonce: publicProcedure
    .input(z.object({
      address: z.string(),
      chain: chainSchema
    }))
    .mutation(async ({ ctx, input }) => {
      // Generate nonce for signature verification
      const nonce = generateNonce();
      await db.insert(walletNonces).values({
        address: input.address.toLowerCase(),
        chain: input.chain,
        nonce,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        ipAddress: ctx.ip
      });
      
      return { 
        nonce,
        message: `Sign this message to verify ownership of ${input.address}\n\nNonce: ${nonce}`
      };
    }),

  verify: publicProcedure
    .input(z.object({
      address: z.string(),
      chain: chainSchema,
      signature: z.string(),
      nonce: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify signature and link wallet
      const isValid = await verifySignature(input);
      if (!isValid) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      // Create or update wallet record
      // Return auth tokens if creating new user
    }),

  // Wallet Management
  list: protectedProcedure
    .query(async ({ ctx }) => {
      // List all connected wallets for user
    }),

  link: protectedProcedure
    .input(z.object({
      address: z.string(),
      chain: chainSchema,
      signature: z.string(),
      nonce: z.string(),
      label: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Link additional wallet to existing account
    }),

  unlink: protectedProcedure
    .input(z.object({ walletId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Unlink wallet from account
    }),

  setPrimary: protectedProcedure
    .input(z.object({ walletId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Set primary wallet for chain
    }),

  // Balances
  getBalances: protectedProcedure
    .input(z.object({
      walletId: z.string(),
      includeNfts: z.boolean().default(false)
    }))
    .query(async ({ ctx, input }) => {
      // Fetch token balances from chain
    }),

  getBalance: protectedProcedure
    .input(z.object({
      walletId: z.string(),
      tokenMint: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Get specific token balance
    }),

  // Transactions
  getTransactions: protectedProcedure
    .input(z.object({
      walletId: z.string().optional(),
      type: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Get transaction history
    }),

  // Custodial Wallet Operations
  custodial: router({
    create: protectedProcedure
      .input(z.object({
        chain: chainSchema,
        label: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        // Create KMS-managed custodial wallet
      }),

    signTransaction: protectedProcedure
      .input(z.object({
        walletId: z.string(),
        transaction: z.unknown()
      }))
      .mutation(async ({ ctx, input }) => {
        // Sign transaction with KMS wallet
      }),

    sendTransaction: protectedProcedure
      .input(z.object({
        walletId: z.string(),
        to: z.string(),
        amount: z.string(),
        tokenMint: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        // Send transaction from custodial wallet
      }),
  }),
});
```

### React Hooks

```typescript
// @mcv/web3-public/wallet-sdk/hooks.ts
import { useCallback, useEffect, useState } from 'react';
import { trpc } from '@mcv/api/client';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [connecting, setConnecting] = useState(false);
  
  const { data: wallets, refetch } = trpc.wallet.list.useQuery();
  const linkMutation = trpc.wallet.link.useMutation();
  const unlinkMutation = trpc.wallet.unlink.useMutation();
  
  const connect = useCallback(async (adapter: WalletAdapter) => {
    setConnecting(true);
    try {
      const connection = await adapter.connect();
      
      // Get nonce for verification
      const { nonce, message } = await trpc.wallet.getNonce.mutate({
        address: connection.address,
        chain: connection.chain
      });
      
      // Sign message
      const signature = await adapter.signMessage(message);
      
      // Verify and link
      await linkMutation.mutateAsync({
        address: connection.address,
        chain: connection.chain,
        signature,
        nonce
      });
      
      setWallet(connection);
      await refetch();
    } finally {
      setConnecting(false);
    }
  }, []);
  
  const disconnect = useCallback(async () => {
    if (wallet) {
      await unlinkMutation.mutateAsync({ walletId: wallet.id });
      setWallet(null);
      await refetch();
    }
  }, [wallet]);
  
  return {
    wallet,
    wallets,
    connecting,
    connect,
    disconnect,
    isConnected: !!wallet
  };
}

export function useWalletBalances(walletId?: string) {
  return trpc.wallet.getBalances.useQuery(
    { walletId: walletId! },
    { enabled: !!walletId }
  );
}

export function useWalletTransactions(walletId?: string) {
  return trpc.wallet.getTransactions.useInfiniteQuery(
    { walletId },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
}
```

### Adapter Implementation Example

```typescript
// @mcv/web3-public/wallet-sdk/adapters/phantom.ts
import { WalletAdapter, WalletConnection } from '../types';

export class PhantomAdapter implements WalletAdapter {
  name = 'Phantom';
  icon = '/wallets/phantom.svg';
  chain = 'solana' as const;
  
  private provider: any;
  
  get isConnected(): boolean {
    return this.provider?.isConnected ?? false;
  }
  
  get publicKey(): string | null {
    return this.provider?.publicKey?.toString() ?? null;
  }
  
  async connect(): Promise<WalletConnection> {
    if (typeof window === 'undefined') {
      throw new Error('Phantom is only available in browser');
    }
    
    const provider = (window as any).phantom?.solana;
    if (!provider?.isPhantom) {
      throw new Error('Phantom wallet not installed');
    }
    
    const response = await provider.connect();
    this.provider = provider;
    
    return {
      address: response.publicKey.toString(),
      publicKey: response.publicKey.toString(),
      chain: 'solana',
      provider: 'phantom'
    };
  }
  
  async disconnect(): Promise<void> {
    await this.provider?.disconnect();
    this.provider = null;
  }
  
  async signMessage(message: string): Promise<string> {
    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = await this.provider.signMessage(encodedMessage, 'utf8');
    return Buffer.from(signedMessage.signature).toString('base64');
  }
  
  async signTransaction(transaction: any): Promise<any> {
    return this.provider.signTransaction(transaction);
  }
  
  async sendTransaction(transaction: any): Promise<string> {
    const { signature } = await this.provider.signAndSendTransaction(transaction);
    return signature;
  }
}
```

---

## Module: nfts

### Purpose

The NFTs module provides complete NFT lifecycle management including collection creation, minting, transfers, metadata management, and marketplace integration. It supports multiple standards (Metaplex, ERC-721, ERC-1155).

### Data Models

```typescript
// @mcv/web3-public/nfts/schema.ts
import { pgTable, text, jsonb, timestamp, boolean, numeric, integer, index, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const nftStandardEnum = pgEnum('nft_standard', [
  'metaplex',      // Solana Metaplex
  'erc721',        // Ethereum/EVM ERC-721
  'erc1155',       // Ethereum/EVM ERC-1155
  'compressed'     // Solana compressed NFTs
]);

export const collectionStatusEnum = pgEnum('collection_status', [
  'draft',
  'minting',
  'minted',
  'revealed',
  'frozen'
]);

// NFT Collections
export const nftCollections = pgTable('nft_collection', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  
  // Identity
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  
  // Chain details
  chain: chainEnum('chain').notNull(),
  standard: nftStandardEnum('standard').notNull(),
  contractAddress: text('contract_address'),
  
  // Collection metadata
  image: text('image'),
  banner: text('banner'),
  externalUrl: text('external_url'),
  
  // Supply
  maxSupply: integer('max_supply'),
  currentSupply: integer('current_supply').default(0),
  
  // Royalties
  royaltyBasisPoints: integer('royalty_basis_points').default(500), // 5%
  royaltyRecipient: text('royalty_recipient'),
  
  // Minting config
  mintPrice: numeric('mint_price', { precision: 18, scale: 8 }),
  mintToken: text('mint_token').default('SOL'),
  maxPerWallet: integer('max_per_wallet'),
  
  // Reveal
  isRevealed: boolean('is_revealed').default(true),
  revealDate: timestamp('reveal_date'),
  placeholderImage: text('placeholder_image'),
  
  // Status
  status: collectionStatusEnum('status').default('draft'),
  
  // Creator info
  creatorAddress: text('creator_address'),
  creatorVerified: boolean('creator_verified').default(false),
  
  metadata: jsonb('metadata').$type<{
    attributes?: Array<{ trait_type: string; values: string[] }>;
    socials?: Record<string, string>;
  }>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  ventureIdx: index('collection_venture_idx').on(t.ventureId),
  slugIdx: index('collection_slug_idx').on(t.slug),
  contractIdx: index('collection_contract_idx').on(t.chain, t.contractAddress),
}));

// Individual NFTs
export const nfts = pgTable('nft', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  collectionId: text('collection_id').references(() => nftCollections.id),
  
  // On-chain identity
  chain: chainEnum('chain').notNull(),
  mintAddress: text('mint_address').notNull(),
  tokenId: text('token_id'), // For ERC-721/1155
  
  // Metadata
  name: text('name').notNull(),
  description: text('description'),
  image: text('image'),
  animationUrl: text('animation_url'),
  externalUrl: text('external_url'),
  
  // Attributes
  attributes: jsonb('attributes').$type<Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>>(),
  
  // Properties
  properties: jsonb('properties').$type<{
    files?: Array<{ uri: string; type: string }>;
    category?: string;
  }>(),
  
  // Ownership
  ownerAddress: text('owner_address'),
  
  // Edition info (for editions)
  editionNumber: integer('edition_number'),
  maxEdition: integer('max_edition'),
  
  // Supply (for ERC-1155)
  supply: integer('supply').default(1),
  
  // Status
  isBurned: boolean('is_burned').default(false),
  isFrozen: boolean('is_frozen').default(false),
  isListed: boolean('is_listed').default(false),
  
  // Listing info
  listPrice: numeric('list_price', { precision: 18, scale: 8 }),
  listToken: text('list_token'),
  listedAt: timestamp('listed_at'),
  
  // Rarity (pre-computed)
  rarityScore: numeric('rarity_score', { precision: 10, scale: 6 }),
  rarityRank: integer('rarity_rank'),
  
  metadataUri: text('metadata_uri'),
  lastSyncedAt: timestamp('last_synced_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  mintAddressIdx: index('nft_mint_idx').on(t.chain, t.mintAddress),
  collectionIdx: index('nft_collection_idx').on(t.collectionId),
  ownerIdx: index('nft_owner_idx').on(t.ownerAddress),
}));

// NFT Transfers/Sales History
export const nftTransfers = pgTable('nft_transfer', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  nftId: text('nft_id').notNull().references(() => nfts.id),
  
  chain: chainEnum('chain').notNull(),
  txHash: text('tx_hash').notNull(),
  blockNumber: numeric('block_number'),
  
  type: text('type').notNull(), // 'mint', 'transfer', 'sale', 'burn'
  
  fromAddress: text('from_address'),
  toAddress: text('to_address'),
  
  // Sale info
  price: numeric('price', { precision: 18, scale: 8 }),
  priceToken: text('price_token'),
  priceUsd: numeric('price_usd', { precision: 18, scale: 2 }),
  marketplace: text('marketplace'),
  
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Mint Requests (for lazy minting)
export const mintRequests = pgTable('nft_mint_request', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  collectionId: text('collection_id').notNull().references(() => nftCollections.id),
  
  // Requester
  userId: text('user_id'),
  walletAddress: text('wallet_address').notNull(),
  
  // Quantity
  quantity: integer('quantity').notNull().default(1),
  
  // Payment
  totalPrice: numeric('total_price', { precision: 18, scale: 8 }),
  paymentToken: text('payment_token'),
  paymentTxHash: text('payment_tx_hash'),
  
  // Status
  status: text('status').default('pending'), // pending, paid, minting, completed, failed
  
  // Result
  mintedNftIds: jsonb('minted_nft_ids').$type<string[]>(),
  mintTxHash: text('mint_tx_hash'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});
```

### API Surface

```typescript
// @mcv/web3-public/nfts/router.ts
export const nftRouter = router({
  // Collections
  collections: router({
    list: publicProcedure
      .input(z.object({
        chain: chainSchema.optional(),
        status: collectionStatusSchema.optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        // List collections with stats
      }),

    get: publicProcedure
      .input(z.object({ 
        collectionId: z.string().optional(),
        slug: z.string().optional(),
        contractAddress: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        // Get collection details with floor price, volume
      }),

    create: superAdminProcedure
      .input(createCollectionSchema)
      .mutation(async ({ ctx, input }) => {
        // Create collection
      }),

    update: superAdminProcedure
      .input(updateCollectionSchema)
      .mutation(async ({ ctx, input }) => {
        // Update collection metadata
      }),

    deploy: superAdminProcedure
      .input(z.object({ collectionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Deploy collection on-chain
      }),

    reveal: superAdminProcedure
      .input(z.object({ collectionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Reveal collection (switch from placeholder to real metadata)
      }),

    getStats: publicProcedure
      .input(z.object({ collectionId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get collection stats (floor, volume, holders, etc.)
      }),
  }),

  // Individual NFTs
  nfts: router({
    list: publicProcedure
      .input(z.object({
        collectionId: z.string().optional(),
        ownerAddress: z.string().optional(),
        traits: z.array(z.object({
          trait_type: z.string(),
          value: z.string()
        })).optional(),
        isListed: z.boolean().optional(),
        sortBy: z.enum(['rarity', 'price', 'recent']).default('recent'),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        // List NFTs with filtering
      }),

    get: publicProcedure
      .input(z.object({ 
        nftId: z.string().optional(),
        mintAddress: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        // Get NFT details with history
      }),

    getByWallet: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        chain: chainSchema.optional(),
        collectionId: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        // Get NFTs owned by wallet
      }),

    refresh: protectedProcedure
      .input(z.object({ nftId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Refresh NFT metadata from chain
      }),
  }),

  // Minting
  minting: router({
    getMintInfo: publicProcedure
      .input(z.object({ collectionId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get mint price, remaining supply, limits
      }),

    requestMint: protectedProcedure
      .input(z.object({
        collectionId: z.string(),
        quantity: z.number().int().min(1).max(10).default(1),
        walletAddress: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        // Create mint request, return payment info
      }),

    confirmPayment: protectedProcedure
      .input(z.object({
        requestId: z.string(),
        txHash: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify payment, trigger minting
      }),

    getMintStatus: protectedProcedure
      .input(z.object({ requestId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get mint request status
      }),
  }),

  // Transfers
  transfers: router({
    transfer: protectedProcedure
      .input(z.object({
        nftId: z.string(),
        toAddress: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        // Transfer NFT (for custodial wallets)
      }),

    getHistory: publicProcedure
      .input(z.object({
        nftId: z.string(),
        limit: z.number().min(1).max(100).default(50)
      }))
      .query(async ({ ctx, input }) => {
        // Get transfer/sale history
      }),
  }),

  // Marketplace (basic listing)
  marketplace: router({
    list: protectedProcedure
      .input(z.object({
        nftId: z.string(),
        price: z.number(),
        priceToken: z.string().default('SOL')
      }))
      .mutation(async ({ ctx, input }) => {
        // List NFT for sale
      }),

    unlist: protectedProcedure
      .input(z.object({ nftId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Remove listing
      }),

    buy: protectedProcedure
      .input(z.object({
        nftId: z.string(),
        walletAddress: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        // Purchase NFT
      }),

    getListings: publicProcedure
      .input(z.object({
        collectionId: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sortBy: z.enum(['price_asc', 'price_desc', 'recent']).default('price_asc'),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        // Get active listings
      }),
  }),
});
```

### Rarity Calculator

```typescript
// @mcv/web3-public/nfts/rarity.ts
export interface TraitRarity {
  trait_type: string;
  value: string;
  count: number;
  percentage: number;
  score: number;
}

export interface NFTRarity {
  nftId: string;
  traits: TraitRarity[];
  totalScore: number;
  rank: number;
  percentile: number;
}

export class RarityCalculator {
  async calculateCollectionRarity(collectionId: string): Promise<void> {
    // 1. Get all NFTs in collection
    const nfts = await this.getNFTs(collectionId);
    const totalSupply = nfts.length;
    
    // 2. Count trait occurrences
    const traitCounts = new Map<string, Map<string, number>>();
    
    for (const nft of nfts) {
      for (const attr of nft.attributes ?? []) {
        if (!traitCounts.has(attr.trait_type)) {
          traitCounts.set(attr.trait_type, new Map());
        }
        const valueCounts = traitCounts.get(attr.trait_type)!;
        valueCounts.set(attr.value, (valueCounts.get(attr.value) ?? 0) + 1);
      }
    }
    
    // 3. Calculate rarity scores
    const rarityScores: Array<{ nftId: string; score: number }> = [];
    
    for (const nft of nfts) {
      let totalScore = 0;
      
      for (const attr of nft.attributes ?? []) {
        const valueCounts = traitCounts.get(attr.trait_type);
        if (!valueCounts) continue;
        
        const count = valueCounts.get(attr.value) ?? 0;
        const percentage = count / totalSupply;
        
        // Rarity score = 1 / percentage (rarer = higher score)
        const score = 1 / percentage;
        totalScore += score;
      }
      
      rarityScores.push({ nftId: nft.id, score: totalScore });
    }
    
    // 4. Sort and assign ranks
    rarityScores.sort((a, b) => b.score - a.score);
    
    // 5. Update database
    for (let i = 0; i < rarityScores.length; i++) {
      await this.updateRarity(rarityScores[i].nftId, {
        rarityScore: rarityScores[i].score,
        rarityRank: i + 1
      });
    }
  }
}
```

---

## Module: oracles

### Purpose

The Oracles module provides access to off-chain data feeds for on-chain applications. It supports price feeds, verifiable randomness, sports results, and custom data sources with aggregation and caching.

### Data Models

```typescript
// @mcv/web3-public/oracles/schema.ts
import { pgTable, text, jsonb, timestamp, numeric, boolean, integer, index, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const oracleTypeEnum = pgEnum('oracle_type', [
  'price',
  'randomness',
  'sports',
  'weather',
  'custom'
]);

export const feedStatusEnum = pgEnum('feed_status', [
  'active',
  'stale',
  'inactive',
  'deprecated'
]);

// Oracle Feeds
export const oracleFeeds = pgTable('oracle_feed', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id'),
  
  // Identity
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  
  // Type
  type: oracleTypeEnum('type').notNull(),
  
  // Source configuration
  sources: jsonb('sources').$type<OracleSource[]>().notNull(),
  aggregationMethod: text('aggregation_method').default('median'), // median, mean, weighted
  
  // Chain publication
  chain: chainEnum('chain'),
  feedAddress: text('feed_address'),
  
  // Update configuration
  updateFrequency: integer('update_frequency'), // seconds
  deviationThreshold: numeric('deviation_threshold', { precision: 10, scale: 6 }), // % change to trigger update
  heartbeat: integer('heartbeat'), // max seconds between updates
  
  // Current value
  currentValue: numeric('current_value', { precision: 24, scale: 8 }),
  lastUpdated: timestamp('last_updated'),
  
  // Status
  status: feedStatusEnum('status').default('active'),
  
  // Metadata
  decimals: integer('decimals').default(8),
  unit: text('unit'), // USD, ETH, etc.
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  slugIdx: index('feed_slug_idx').on(t.slug),
  typeIdx: index('feed_type_idx').on(t.type),
}));

// Oracle Updates (History)
export const oracleUpdates = pgTable('oracle_update', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  feedId: text('feed_id').notNull().references(() => oracleFeeds.id),
  
  value: numeric('value', { precision: 24, scale: 8 }).notNull(),
  
  // Source breakdown
  sourceValues: jsonb('source_values').$type<Array<{
    source: string;
    value: number;
    timestamp: string;
  }>>(),
  
  // On-chain reference
  txHash: text('tx_hash'),
  blockNumber: numeric('block_number'),
  
  // Trigger
  triggerReason: text('trigger_reason'), // 'scheduled', 'deviation', 'manual'
  
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (t) => ({
  feedTimestampIdx: index('update_feed_ts_idx').on(t.feedId, t.timestamp),
}));

// Randomness Requests
export const randomnessRequests = pgTable('oracle_randomness', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  
  // Request details
  requesterAddress: text('requester_address').notNull(),
  requestTxHash: text('request_tx_hash'),
  
  // Parameters
  seed: text('seed'),
  numWords: integer('num_words').default(1),
  
  // Result
  randomWords: jsonb('random_words').$type<string[]>(),
  fulfillmentTxHash: text('fulfillment_tx_hash'),
  
  // Status
  status: text('status').default('pending'), // pending, fulfilled, failed
  
  // Timing
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  fulfilledAt: timestamp('fulfilled_at'),
});

// Sports Events (for sports oracle)
export const sportsEvents = pgTable('oracle_sports_event', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  
  // Event identity
  externalId: text('external_id').notNull(), // From sports data provider
  sport: text('sport').notNull(),
  league: text('league').notNull(),
  
  // Teams
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  
  // Timing
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  
  // Status
  status: text('status').default('scheduled'), // scheduled, live, finished, cancelled
  
  // Results
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  winner: text('winner'), // 'home', 'away', 'draw'
  
  // Additional data
  stats: jsonb('stats').$type<Record<string, unknown>>(),
  
  // Oracle publication
  publishedAt: timestamp('published_at'),
  publishTxHash: text('publish_tx_hash'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  externalIdx: index('sports_external_idx').on(t.externalId),
  sportLeagueIdx: index('sports_sport_league_idx').on(t.sport, t.league),
  startTimeIdx: index('sports_start_time_idx').on(t.startTime),
}));
```

### Types

```typescript
// @mcv/web3-public/oracles/types.ts

export interface OracleSource {
  name: string;
  type: 'api' | 'chainlink' | 'pyth' | 'switchboard' | 'custom';
  endpoint?: string;
  apiKey?: string; // Reference to secret
  weight?: number;
  
  // Path to extract value from response
  valuePath?: string;
  
  // Transform
  transform?: {
    multiply?: number;
    divide?: number;
    decimals?: number;
  };
}

export interface PriceFeed {
  id: string;
  pair: string; // e.g., "BTC/USD"
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdated: Date;
  sources: Array<{
    name: string;
    price: number;
  }>;
}

export interface RandomnessResult {
  requestId: string;
  randomWords: bigint[];
  proof?: string;
}

export interface SportsResult {
  eventId: string;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  homeScore?: number;
  awayScore?: number;
  winner?: 'home' | 'away' | 'draw';
  stats?: Record<string, unknown>;
}
```

### API Surface

```typescript
// @mcv/web3-public/oracles/router.ts
export const oracleRouter = router({
  // Price Feeds
  prices: router({
    list: publicProcedure
      .input(z.object({
        pairs: z.array(z.string()).optional(), // Filter by pairs
        limit: z.number().min(1).max(100).default(50)
      }))
      .query(async ({ ctx, input }) => {
        // List price feeds
      }),

    get: publicProcedure
      .input(z.object({
        pair: z.string(), // e.g., "BTC/USD"
      }))
      .query(async ({ ctx, input }) => {
        // Get current price with sources
      }),

    getHistory: publicProcedure
      .input(z.object({
        pair: z.string(),
        interval: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']).default('1h'),
        limit: z.number().min(1).max(1000).default(100)
      }))
      .query(async ({ ctx, input }) => {
        // Get historical prices
      }),

    subscribe: publicProcedure
      .input(z.object({
        pairs: z.array(z.string())
      }))
      .subscription(async function* ({ ctx, input }) {
        // Real-time price updates via WebSocket
      }),
  }),

  // Randomness
  randomness: router({
    request: protectedProcedure
      .input(z.object({
        numWords: z.number().int().min(1).max(10).default(1),
        seed: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        // Request verifiable randomness
      }),

    getResult: protectedProcedure
      .input(z.object({ requestId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get randomness result
      }),

    // Commit-reveal for on-chain fairness
    commit: protectedProcedure
      .input(z.object({
        commitment: z.string() // Hash of secret
      }))
      .mutation(async ({ ctx, input }) => {
        // Store commitment
      }),

    reveal: protectedProcedure
      .input(z.object({
        requestId: z.string(),
        secret: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        // Reveal and verify
      }),
  }),

  // Sports
  sports: router({
    getEvents: publicProcedure
      .input(z.object({
        sport: z.string().optional(),
        league: z.string().optional(),
        status: z.enum(['scheduled', 'live', 'finished']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50)
      }))
      .query(async ({ ctx, input }) => {
        // List sports events
      }),

    getEvent: publicProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get event details
      }),

    getLeagues: publicProcedure
      .input(z.object({ sport: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        // List available leagues
      }),

    subscribeEvent: publicProcedure
      .input(z.object({ eventId: z.string() }))
      .subscription(async function* ({ ctx, input }) {
        // Real-time event updates
      }),
  }),

  // Feed Management (Admin)
  feeds: router({
    create: superAdminProcedure
      .input(createFeedSchema)
      .mutation(async ({ ctx, input }) => {
        // Create oracle feed
      }),

    update: superAdminProcedure
      .input(updateFeedSchema)
      .mutation(async ({ ctx, input }) => {
        // Update feed configuration
      }),

    triggerUpdate: superAdminProcedure
      .input(z.object({ feedId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Force feed update
      }),
  }),
});
```

### Price Aggregator

```typescript
// @mcv/web3-public/oracles/aggregator.ts
export class PriceAggregator {
  async aggregate(
    sources: OracleSource[],
    method: 'median' | 'mean' | 'weighted'
  ): Promise<{ value: number; sources: Array<{ name: string; value: number }> }> {
    // Fetch from all sources in parallel
    const results = await Promise.allSettled(
      sources.map(source => this.fetchFromSource(source))
    );
    
    const validResults = results
      .filter((r): r is PromiseFulfilledResult<{ source: string; value: number }> => 
        r.status === 'fulfilled'
      )
      .map(r => r.value);
    
    if (validResults.length === 0) {
      throw new Error('No valid source responses');
    }
    
    const values = validResults.map(r => r.value);
    
    let aggregatedValue: number;
    
    switch (method) {
      case 'median':
        aggregatedValue = this.median(values);
        break;
      case 'mean':
        aggregatedValue = this.mean(values);
        break;
      case 'weighted':
        const weights = sources.map(s => s.weight ?? 1);
        aggregatedValue = this.weightedMean(values, weights);
        break;
    }
    
    return {
      value: aggregatedValue,
      sources: validResults
    };
  }
  
  private async fetchFromSource(source: OracleSource): Promise<{ source: string; value: number }> {
    switch (source.type) {
      case 'api':
        return this.fetchFromAPI(source);
      case 'chainlink':
        return this.fetchFromChainlink(source);
      case 'pyth':
        return this.fetchFromPyth(source);
      case 'switchboard':
        return this.fetchFromSwitchboard(source);
      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }
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

---

## Module: attestation

### Purpose

The Attestation module provides on-chain identity verification through attestations. It supports KYC attestations, age verification, jurisdiction checks, and verifiable credentials while preserving user privacy through zero-knowledge proofs where applicable.

### Data Models

```typescript
// @mcv/web3-public/attestation/schema.ts
import { pgTable, text, jsonb, timestamp, boolean, index, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const attestationTypeEnum = pgEnum('attestation_type', [
  'kyc',           // Know Your Customer
  'aml',           // Anti-Money Laundering
  'age',           // Age verification
  'accredited',    // Accredited investor
  'jurisdiction',  // Location/jurisdiction
  'identity',      // Identity verification
  'credential',    // Generic verifiable credential
  'custom'
]);

export const attestationStatusEnum = pgEnum('attestation_status', [
  'pending',
  'verified',
  'rejected',
  'expired',
  'revoked'
]);

// Attestation Schemas (Templates)
export const attestationSchemas = pgTable('attestation_schema', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id'),
  
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  
  type: attestationTypeEnum('type').notNull(),
  
  // Schema definition
  schema: jsonb('schema').$type<{
    fields: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean' | 'date';
      required: boolean;
      private?: boolean; // Not revealed in public attestation
    }>;
  }>().notNull(),
  
  // Verification requirements
  verificationRequirements: jsonb('verification_requirements').$type<{
    providers?: string[]; // Accepted KYC providers
    minAge?: number;
    allowedJurisdictions?: string[];
    blockedJurisdictions?: string[];
  }>(),
  
  // On-chain schema
  chain: chainEnum('chain'),
  schemaId: text('schema_id'), // EAS schema ID
  resolverAddress: text('resolver_address'),
  
  // Validity
  defaultValidityDays: integer('default_validity_days').default(365),
  isRevocable: boolean('is_revocable').default(true),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Attestations
export const attestations = pgTable('attestation', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id'),
  schemaId: text('schema_id').notNull().references(() => attestationSchemas.id),
  
  // Subject
  subjectType: text('subject_type').default('wallet'), // 'wallet' | 'user'
  subjectId: text('subject_id'), // userId if type is 'user'
  subjectAddress: text('subject_address').notNull(),
  
  // Attester
  attesterId: text('attester_id'), // userId of attester
  attesterAddress: text('attester_address'),
  
  // Status
  status: attestationStatusEnum('status').default('pending'),
  
  // Data
  data: jsonb('data').$type<Record<string, unknown>>().notNull(),
  privateData: jsonb('private_data').$type<Record<string, unknown>>(), // Encrypted
  dataHash: text('data_hash'), // Hash of data for verification
  
  // On-chain reference
  chain: chainEnum('chain'),
  attestationUid: text('attestation_uid'), // EAS UID
  txHash: text('tx_hash'),
  
  // Validity
  issuedAt: timestamp('issued_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  revokedAt: timestamp('revoked_at'),
  revokeReason: text('revoke_reason'),
  
  // Verification source
  verificationProvider: text('verification_provider'), // 'sumsub', 'jumio', etc.
  verificationId: text('verification_id'),
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  subjectIdx: index('attestation_subject_idx').on(t.subjectAddress),
  schemaIdx: index('attestation_schema_idx').on(t.schemaId),
  statusIdx: index('attestation_status_idx').on(t.status),
}));

// Verification Requests
export const verificationRequests = pgTable('attestation_verification_request', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  schemaId: text('schema_id').notNull().references(() => attestationSchemas.id),
  
  // Subject
  userId: text('user_id').notNull(),
  walletAddress: text('wallet_address').notNull(),
  
  // Provider
  provider: text('provider').notNull(), // 'sumsub', 'jumio', 'veriff'
  externalId: text('external_id'), // Provider's reference ID
  
  // Status
  status: text('status').default('pending'), // pending, processing, completed, failed
  
  // Result
  result: jsonb('result').$type<{
    passed: boolean;
    reasons?: string[];
    data?: Record<string, unknown>;
  }>(),
  
  // Webhook
  webhookReceived: boolean('webhook_received').default(false),
  webhookData: jsonb('webhook_data'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Attestation Checks (verification queries)
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
  context: text('context'), // e.g., 'token_sale', 'airdrop'
  
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
});
```

### API Surface

```typescript
// @mcv/web3-public/attestation/router.ts
export const attestationRouter = router({
  // Schema Management
  schemas: router({
    list: publicProcedure
      .input(z.object({
        type: attestationTypeSchema.optional(),
        isActive: z.boolean().optional()
      }))
      .query(async ({ ctx, input }) => {
        // List available attestation schemas
      }),

    get: publicProcedure
      .input(z.object({ schemaId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get schema details
      }),

    create: superAdminProcedure
      .input(createSchemaSchema)
      .mutation(async ({ ctx, input }) => {
        // Create attestation schema
      }),

    deploy: superAdminProcedure
      .input(z.object({ schemaId: z.string(), chain: chainSchema }))
      .mutation(async ({ ctx, input }) => {
        // Deploy schema on-chain (EAS)
      }),
  }),

  // Verification Flow
  verification: router({
    start: protectedProcedure
      .input(z.object({
        schemaId: z.string(),
        walletAddress: z.string(),
        provider: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        // Start verification flow, return provider URL/config
      }),

    getStatus: protectedProcedure
      .input(z.object({ requestId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get verification status
      }),

    // Webhook endpoint handled separately
  }),

  // Attestation Management
  attestations: router({
    list: protectedProcedure
      .input(z.object({
        walletAddress: z.string().optional(),
        type: attestationTypeSchema.optional(),
        status: attestationStatusSchema.optional()
      }))
      .query(async ({ ctx, input }) => {
        // List attestations (own or by address)
      }),

    get: publicProcedure
      .input(z.object({ attestationId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get attestation details (public data only)
      }),

    create: superAdminProcedure
      .input(z.object({
        schemaId: z.string(),
        subjectAddress: z.string(),
        data: z.record(z.unknown()),
        expiresAt: z.date().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        // Create attestation (admin/issuer only)
      }),

    revoke: superAdminProcedure
      .input(z.object({
        attestationId: z.string(),
        reason: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        // Revoke attestation
      }),

    publish: superAdminProcedure
      .input(z.object({
        attestationId: z.string(),
        chain: chainSchema
      }))
      .mutation(async ({ ctx, input }) => {
        // Publish attestation on-chain
      }),
  }),

  // Verification Checks
  check: router({
    verify: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        type: attestationTypeSchema,
        requirements: z.record(z.unknown()).optional()
      }))
      .query(async ({ ctx, input }) => {
        // Check if wallet has valid attestation
      }),

    verifyMultiple: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        checks: z.array(z.object({
          type: attestationTypeSchema,
          requirements: z.record(z.unknown()).optional()
        }))
      }))
      .query(async ({ ctx, input }) => {
        // Check multiple attestation types
      }),

    getProof: protectedProcedure
      .input(z.object({
        attestationId: z.string(),
        claims: z.array(z.string()) // Which claims to include
      }))
      .query(async ({ ctx, input }) => {
        // Generate selective disclosure proof
      }),
  }),
});
```

### Verification Provider Integration

```typescript
// @mcv/web3-public/attestation/providers/sumsub.ts
export class SumSubProvider implements VerificationProvider {
  name = 'sumsub';
  
  async createApplicant(data: {
    userId: string;
    email: string;
    walletAddress: string;
  }): Promise<{ applicantId: string; sdkToken: string }> {
    const applicant = await this.client.createApplicant({
      externalUserId: data.userId,
      email: data.email,
      fixedInfo: {
        metadata: [{ key: 'walletAddress', value: data.walletAddress }]
      }
    });
    
    const token = await this.client.generateAccessToken(applicant.id, 600);
    
    return {
      applicantId: applicant.id,
      sdkToken: token.token
    };
  }
  
  async getApplicantStatus(applicantId: string): Promise<VerificationResult> {
    const status = await this.client.getApplicantStatus(applicantId);
    
    return {
      status: this.mapStatus(status.reviewStatus),
      passed: status.reviewResult?.reviewAnswer === 'GREEN',
      reasons: status.reviewResult?.rejectLabels,
      data: {
        firstName: status.info?.firstName,
        lastName: status.info?.lastName,
        country: status.info?.country,
        dob: status.info?.dob
      }
    };
  }
  
  async handleWebhook(payload: unknown): Promise<{
    applicantId: string;
    type: string;
    data: VerificationResult;
  }> {
    const data = payload as SumSubWebhookPayload;
    
    return {
      applicantId: data.applicantId,
      type: data.type,
      data: await this.getApplicantStatus(data.applicantId)
    };
  }
  
  private mapStatus(status: string): VerificationStatus {
    switch (status) {
      case 'completed': return 'completed';
      case 'pending': return 'processing';
      case 'init': return 'pending';
      default: return 'pending';
    }
  }
}
```

### EAS Integration

```typescript
// @mcv/web3-public/attestation/eas.ts
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

export class EASService {
  private eas: EAS;
  
  constructor(chain: Chain) {
    const address = EAS_ADDRESSES[chain];
    this.eas = new EAS(address);
  }
  
  async registerSchema(schema: {
    fields: Array<{ name: string; type: string }>;
    resolverAddress?: string;
    revocable: boolean;
  }): Promise<{ schemaId: string; txHash: string }> {
    const schemaString = schema.fields
      .map(f => `${f.type} ${f.name}`)
      .join(', ');
    
    const tx = await this.eas.schemaRegistry.register({
      schema: schemaString,
      resolverAddress: schema.resolverAddress,
      revocable: schema.revocable
    });
    
    await tx.wait();
    
    return {
      schemaId: tx.schemaId,
      txHash: tx.hash
    };
  }
  
  async attest(params: {
    schemaId: string;
    recipient: string;
    data: Record<string, unknown>;
    expirationTime?: bigint;
    revocable?: boolean;
  }): Promise<{ uid: string; txHash: string }> {
    // Get schema to know field types
    const schema = await this.getSchema(params.schemaId);
    
    // Encode data
    const encoder = new SchemaEncoder(schema.schema);
    const encodedData = encoder.encodeData(
      Object.entries(params.data).map(([name, value]) => ({
        name,
        value,
        type: schema.fields.find(f => f.name === name)?.type ?? 'string'
      }))
    );
    
    const tx = await this.eas.attest({
      schema: params.schemaId,
      data: {
        recipient: params.recipient,
        expirationTime: params.expirationTime ?? 0n,
        revocable: params.revocable ?? true,
        data: encodedData
      }
    });
    
    const receipt = await tx.wait();
    
    return {
      uid: receipt.uid,
      txHash: tx.hash
    };
  }
  
  async revoke(params: {
    schemaId: string;
    uid: string;
  }): Promise<{ txHash: string }> {
    const tx = await this.eas.revoke({
      schema: params.schemaId,
      data: { uid: params.uid }
    });
    
    await tx.wait();
    
    return { txHash: tx.hash };
  }
  
  async verify(uid: string): Promise<{
    valid: boolean;
    attestation: Attestation | null;
  }> {
    const attestation = await this.eas.getAttestation(uid);
    
    if (!attestation) {
      return { valid: false, attestation: null };
    }
    
    // Check expiration
    if (attestation.expirationTime > 0 && attestation.expirationTime < Date.now() / 1000) {
      return { valid: false, attestation };
    }
    
    // Check revocation
    if (attestation.revocationTime > 0) {
      return { valid: false, attestation };
    }
    
    return { valid: true, attestation };
  }
}
```

---

## Integration Points

| Consumer | Usage |
|----------|-------|
| `@mcv/auth` | Wallet-based authentication |
| `@mcv/token-economy` | Sale eligibility, reward claims |
| `@mcv/compliance` | KYC status, jurisdiction checks |
| `@mcv/web3-core` | Token operations, staking |
| `@mcv/engagement` | NFT-gated achievements |
| `@mcv/api` | tRPC routers |

---

## Security & Performance

### Security Requirements
- Wallet signatures verified before any wallet linking
- Nonces expire after 5 minutes, single-use
- Private attestation data encrypted at rest
- KYC provider webhooks verified with signatures
- Rate limiting on all verification endpoints

### Performance Requirements
| Operation | Target Latency | Notes |
|-----------|---------------|-------|
| Wallet balance fetch | < 500ms | Cached 30s |
| NFT list (100) | < 1s | Paginated |
| Price feed read | < 50ms | Redis cached |
| Attestation check | < 100ms | DB indexed |
| Merkle proof verify | < 10ms | In-memory |

---

## Dependencies

### Internal Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/db` | * | Database access |
| `@mcv/auth` | * | Authentication |
| `@mcv/cache` | * | Redis caching |
| `@mcv/storage` | * | NFT metadata storage |
| `@mcv/events` | * | Event emission |
| `@mcv/secrets` | * | API key management |

### External Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@solana/web3.js` | ^1.x | Solana interactions |
| `@metaplex-foundation/js` | ^0.x | NFT operations |
| `viem` | ^2.x | EVM interactions |
| `@ethereum-attestation-service/eas-sdk` | ^1.x | EAS attestations |
| `merkletreejs` | ^0.4.x | Merkle proofs |

---

## Related Documentation

- [Wallet SDK Module Details](./wallet-sdk/MODULE.md)
- [NFTs Module Details](./nfts/MODULE.md)
- [Oracles Module Details](./oracles/MODULE.md)
- [Attestation Module Details](./attestation/MODULE.md)
- [Token Economy Package](./token-economy/SPEC.md)

---

*@mcv/web3-public — The User-Facing Web3 Infrastructure*
