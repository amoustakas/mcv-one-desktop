# @mcv/web3-public — API Reference
## Tier 5: Domain Layer (PUBLISHABLE)

**Package:** `@mcv/web3-public`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Wallet SDK Service](#wallet-sdk-service)
3. [NFT Service](#nft-service)
4. [Oracle Service](#oracle-service)
5. [Attestation Service](#attestation-service)
6. [Types & Schemas](#types--schemas)
7. [Events](#events)
8. [Error Codes](#error-codes)
9. [Configuration](#configuration)

---

## API Overview

The `@mcv/web3-public` API is organized into four service modules, each exposing a set of typed methods. All methods accept Zod-validated input objects and return typed responses. Errors are thrown as structured `Web3PublicError` instances.

### Service Instantiation

```typescript
import {
  walletService,
  nftService,
  collectionService,
  mintingService,
  marketplaceService,
  oracleService,
  priceAggregator,
  randomnessService,
  sportsOracleService,
  attestationService,
  verificationService,
  credentialService,
  reputationService,
} from '@mcv/web3-public';
```

### Common Patterns

All service methods follow consistent patterns:

```typescript
// Input validation — all inputs are Zod schemas
const result = await walletService.verifyAndLink({
  address: 'GKv4wZ...',
  chain: 'solana',
  signature: 'base64...',
  nonce: 'abc123',
  ventureId: 'betedge',
});

// Paginated responses
const { data, total, page, pageSize, hasMore } = await nftService.getNFTsByCollection(
  collectionId,
  { page: 1, pageSize: 20, sort: 'rarity_rank', order: 'asc' }
);

// Error handling
try {
  await mintingService.executeMint(requestId);
} catch (error) {
  if (error instanceof Web3PublicError) {
    console.log(error.code);        // 'N201' (COLLECTION_SOLD_OUT)
    console.log(error.retryable);   // false
  }
}
```

---

## Wallet SDK Service

### `walletService.generateNonce`

Generate a cryptographic nonce for wallet signature verification.

```typescript
async generateNonce(
  address: string,
  chain: Chain,
  ip?: string
): Promise<{ nonce: string; message: string }>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `address` | `string` | Yes | Wallet public key or 0x address |
| `chain` | `Chain` | Yes | Blockchain: `'solana'`, `'ethereum'`, `'base'`, `'polygon'`, `'arbitrum'` |
| `ip` | `string` | No | Client IP for rate limiting and audit |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `nonce` | `string` | Cryptographically random nonce string |
| `message` | `string` | Full message for the wallet to sign, including domain, nonce, and timestamp |

**Example:**

```typescript
const { nonce, message } = await walletService.generateNonce(
  'GKv4wZpD2GTR8kL6t5yN...',
  'solana',
  '192.168.1.1'
);
// message: "Sign to verify wallet ownership on MCV\n\nNonce: abc123\nIssued: 2026-02-09T09:44:00Z"
```

**Errors:** `W109` (unsupported chain), `G500` (rate limited)

---

### `walletService.verifyAndLink`

Verify a wallet signature and link the wallet to a user account. Creates a new user if no account exists.

```typescript
async verifyAndLink(
  input: VerifyWalletInput
): Promise<{ wallet: UserWallet; session: WalletSession; isNewUser: boolean }>
```

**Input Schema: `VerifyWalletInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | `string` | Yes | Wallet address that signed the message |
| `chain` | `Chain` | Yes | Blockchain |
| `signature` | `string` | Yes | Base64-encoded signature of the nonce message |
| `nonce` | `string` | Yes | The nonce that was signed |
| `ventureId` | `string` | Yes | Venture context for wallet linking |
| `provider` | `WalletProvider` | No | Wallet provider (phantom, solflare, etc.) |
| `deviceId` | `string` | No | Device fingerprint for mobile session binding |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `wallet` | `UserWallet` | The linked wallet record |
| `session` | `WalletSession` | Active session with token |
| `isNewUser` | `boolean` | True if a new user account was created |

**Example:**

```typescript
const { wallet, session, isNewUser } = await walletService.verifyAndLink({
  address: 'GKv4wZpD2GTR8kL6t5yN...',
  chain: 'solana',
  signature: 'base64signature...',
  nonce: 'abc123',
  ventureId: 'betedge',
  provider: 'phantom',
});

console.log(session.sessionToken); // Use for subsequent authenticated requests
console.log(isNewUser);            // true on first connection
```

**Errors:** `W104` (nonce expired), `W105` (nonce used), `W106` (signature invalid), `W109` (unsupported chain)

---

### `walletService.disconnect`

End an active wallet session.

```typescript
async disconnect(sessionId: string): Promise<void>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `sessionId` | `string` | Yes | Active session ID to terminate |

**Errors:** `W100` (wallet not found), `W107` (session expired)

---

### `walletService.listWallets`

List all wallets linked to a user account.

```typescript
async listWallets(
  userId: string,
  ventureId: string
): Promise<UserWallet[]>
```

**Returns:** Array of `UserWallet` records with chain, address, provider, verification status, and resolved name.

---

### `walletService.linkAdditionalWallet`

Link an additional wallet to an existing user account (requires prior nonce verification).

```typescript
async linkAdditionalWallet(
  userId: string,
  input: LinkWalletInput
): Promise<UserWallet>
```

**Input Schema: `LinkWalletInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | `string` | Yes | New wallet address |
| `chain` | `Chain` | Yes | Blockchain |
| `signature` | `string` | Yes | Verified signature proof |
| `nonce` | `string` | Yes | Consumed nonce |
| `provider` | `WalletProvider` | No | Wallet provider |
| `label` | `string` | No | User-assigned label ("Hardware Wallet") |

---

### `walletService.setPrimaryWallet`

Set a wallet as the primary for its chain.

```typescript
async setPrimaryWallet(userId: string, walletId: string): Promise<UserWallet>
```

---

### `walletService.getSolanaBalance`

Get SOL balance for a Solana address.

```typescript
async getSolanaBalance(
  address: string
): Promise<{ lamports: bigint; sol: string }>
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `lamports` | `bigint` | Balance in lamports |
| `sol` | `string` | Balance in SOL (formatted string) |

---

### `walletService.getTokenBalances`

Get all token balances for a wallet address.

```typescript
async getTokenBalances(
  address: string,
  chain: Chain
): Promise<TokenBalance[]>
```

**Returns:** Array of `TokenBalance`:

| Field | Type | Description |
|-------|------|-------------|
| `mint` | `string` | Token mint address |
| `symbol` | `string` | Token symbol |
| `name` | `string` | Token name |
| `balance` | `string` | Formatted balance |
| `rawBalance` | `bigint` | Raw balance in smallest unit |
| `decimals` | `number` | Token decimals |
| `usdValue` | `number \| null` | USD value if oracle feed exists |
| `logoUri` | `string \| null` | Token logo URI |

---

### `walletService.getPortfolioValue`

Get aggregated portfolio value across all linked wallets.

```typescript
async getPortfolioValue(
  userId: string
): Promise<{ totalUsd: number; chains: ChainPortfolio[] }>
```

---

### `walletService.getTransactionHistory`

Get paginated transaction history for a wallet.

```typescript
async getTransactionHistory(
  walletId: string,
  options?: TransactionQueryOptions
): Promise<PaginatedResult<WalletTransaction>>
```

**Options:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` | `1` | Page number |
| `pageSize` | `number` | `20` | Results per page (max 100) |
| `type` | `string` | all | Filter by type (transfer, swap, nft_mint, etc.) |
| `status` | `string` | all | Filter by status |
| `startDate` | `Date` | — | Filter from date |
| `endDate` | `Date` | — | Filter to date |

---

### `walletService.createCustodialWallet`

Create an MCV-managed custodial wallet (server-side signing via KMS).

```typescript
async createCustodialWallet(
  userId: string,
  chain: Chain,
  label?: string
): Promise<UserWallet>
```

**Returns:** `UserWallet` with `isCustodial: true`. The private key is managed by KMS and never exposed.

---

### `walletService.resolveAddress`

Resolve a human-readable name (SNS/ENS) to a wallet address.

```typescript
async resolveAddress(
  name: string
): Promise<{ address: string; chain: Chain } | null>
```

**Example:**

```typescript
const result = await walletService.resolveAddress('vitalik.eth');
// { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', chain: 'ethereum' }

const result2 = await walletService.resolveAddress('mcv.sol');
// { address: 'GKv4wZpD2...', chain: 'solana' }
```

---

## NFT Service

### `nftService.createCollection` / `collectionService.create`

Create a new NFT collection (starts in DRAFT status).

```typescript
async createCollection(
  input: CreateCollectionInput
): Promise<NFTCollection>
```

**Input Schema: `CreateCollectionInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | Yes | Owning venture |
| `name` | `string` | Yes | Collection name |
| `symbol` | `string` | Yes | Collection symbol (e.g., "BEPASS") |
| `description` | `string` | No | Collection description |
| `chain` | `Chain` | Yes | Target blockchain |
| `standard` | `NFTStandard` | Yes | `'metaplex'`, `'compressed'`, `'erc721'`, `'erc1155'` |
| `maxSupply` | `number \| null` | No | Max supply (null = unlimited) |
| `royaltyBasisPoints` | `number` | No | Royalty percentage in bps (default: 500 = 5%) |
| `royaltyRecipient` | `string` | No | Royalty recipient wallet |
| `royaltySplit` | `RoyaltySplit[]` | No | Multi-creator royalty split |
| `mintPhases` | `MintPhase[]` | No | Whitelist/public mint phases |
| `image` | `string` | No | Collection thumbnail URI |
| `banner` | `string` | No | Collection banner URI |
| `traitTypes` | `TraitType[]` | No | Trait definitions for rarity |
| `category` | `string` | No | `'art'`, `'gaming'`, `'membership'`, `'collectible'`, `'utility'`, `'real_estate'` |

**MintPhase Schema:**

```typescript
interface MintPhase {
  name: string;              // "Whitelist", "Public"
  startTime: Date;
  endTime: Date;
  price: number;             // Price in SOL (or payment token)
  maxPerWallet: number;
  merkleRoot?: string;       // For whitelist verification
}
```

**Example:**

```typescript
const collection = await nftService.createCollection({
  ventureId: 'betedge',
  name: 'BetEdge Founders Pass',
  symbol: 'BEPASS',
  description: 'Exclusive founders pass for BetEdge VIP members',
  chain: 'solana',
  standard: 'metaplex',
  maxSupply: 1000,
  royaltyBasisPoints: 500,
  royaltyRecipient: 'GKv4wZ...',
  mintPhases: [
    { name: 'Whitelist', startTime: new Date('2026-03-01'), endTime: new Date('2026-03-02'), price: 0.5, maxPerWallet: 2, merkleRoot: '0xabc...' },
    { name: 'Public', startTime: new Date('2026-03-02'), endTime: new Date('2026-03-07'), price: 1.0, maxPerWallet: 5 },
  ],
  category: 'membership',
});
```

---

### `collectionService.deploy`

Deploy a collection on-chain (Candy Machine for Solana, smart contract for EVM).

```typescript
async deployCollection(
  collectionId: string
): Promise<{ collection: NFTCollection; txHash: string }>
```

**Returns:** Updated collection with `contractAddress` and `collectionMint` populated. Status transitions from `draft` to `minted`.

---

### `mintingService.requestMint`

Create a mint request (pay-first, mint-later pattern for reliability).

```typescript
async requestMint(
  input: MintNFTInput
): Promise<MintRequest>
```

**Input Schema: `MintNFTInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `collectionId` | `string` | Yes | Target collection |
| `walletAddress` | `string` | Yes | Wallet to receive the NFT |
| `quantity` | `number` | No | Number of NFTs to mint (default: 1) |
| `mintPhase` | `string` | No | Specific phase to mint in |
| `merkleProof` | `string[]` | No | Whitelist merkle proof (if WL phase) |
| `userId` | `string` | No | User ID for tracking |

**Returns:** `MintRequest` in `pending` status. Call `confirmMintPayment` after payment, then `executeMint` to mint.

---

### `mintingService.executeMint`

Execute a paid mint request — builds and submits the on-chain transaction.

```typescript
async executeMint(
  requestId: string
): Promise<{ nfts: NFT[]; txHashes: string[] }>
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `nfts` | `NFT[]` | Array of minted NFT records |
| `txHashes` | `string[]` | On-chain transaction hashes |

**Errors:** `N200` (collection not found), `N201` (sold out), `N202` (phase inactive), `N203` (not whitelisted), `N204` (max per wallet), `N205` (payment failed), `G502` (transaction failed)

---

### `mintingService.mintCompressed`

Mint a compressed NFT (cNFT) via Bubblegum — 99.6% cheaper than standard minting.

```typescript
async mintCompressed(
  input: CompressedMintInput
): Promise<{ nft: NFT; proof: CompressedNFTProof }>
```

**Input Schema: `CompressedMintInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `collectionId` | `string` | Yes | Collection with `standard: 'compressed'` |
| `walletAddress` | `string` | Yes | Recipient wallet |
| `name` | `string` | Yes | NFT name |
| `description` | `string` | No | NFT description |
| `image` | `string` | Yes | Arweave/IPFS URI |
| `attributes` | `NFTAttribute[]` | No | Trait attributes |

**Returns:** NFT record with `isCompressed: true` and the merkle `proof` for future transfers.

---

### `nftService.transferNFT`

Transfer an NFT to another wallet.

```typescript
async transferNFT(
  nftId: string,
  toAddress: string
): Promise<{ txHash: string }>
```

**Errors:** `N207` (NFT not owned by caller)

---

### `nftService.getNFT`

Get a single NFT with full details and transfer history.

```typescript
async getNFT(nftId: string): Promise<NFTWithHistory>
```

**Returns:** `NFTWithHistory` — includes NFT record plus `transfers: NFTTransfer[]` and `collection: NFTCollection`.

---

### `nftService.getNFTsByCollection`

List NFTs in a collection with pagination, sorting, and filtering.

```typescript
async getNFTsByCollection(
  collectionId: string,
  options?: NFTQueryOptions
): Promise<PaginatedResult<NFT>>
```

**Options:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` | `1` | Page number |
| `pageSize` | `number` | `20` | Items per page (max 100) |
| `sort` | `string` | `'created_at'` | Sort field: `'rarity_rank'`, `'list_price'`, `'name'` |
| `order` | `'asc' \| 'desc'` | `'desc'` | Sort order |
| `isListed` | `boolean` | — | Filter listed/unlisted |
| `ownerAddress` | `string` | — | Filter by owner |
| `traitFilter` | `TraitFilter[]` | — | Filter by attributes |

---

### `nftService.getNFTsByWallet`

Get all NFTs owned by a wallet address.

```typescript
async getNFTsByWallet(
  walletAddress: string,
  options?: NFTQueryOptions
): Promise<PaginatedResult<NFT>>
```

---

### `marketplaceService.listForSale`

List an NFT for sale on the MCV marketplace.

```typescript
async listForSale(input: ListNFTInput): Promise<NFT>
```

**Input Schema: `ListNFTInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nftId` | `string` | Yes | NFT to list |
| `price` | `number` | Yes | Listing price |
| `priceToken` | `string` | No | Payment token (default: `'SOL'`) |

---

### `marketplaceService.buyNFT`

Purchase a listed NFT.

```typescript
async buyNFT(
  nftId: string,
  buyerAddress: string
): Promise<{ nft: NFT; txHash: string }>
```

**Returns:** Updated NFT with new owner, plus transaction hash. Royalties are automatically enforced via pNFT standard.

---

### `marketplaceService.getListings`

Browse marketplace listings.

```typescript
async getListings(
  options?: ListingQueryOptions
): Promise<PaginatedResult<NFT>>
```

**Options:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `collectionId` | `string` | — | Filter by collection |
| `ventureId` | `string` | — | Filter by venture |
| `minPrice` | `number` | — | Minimum price filter |
| `maxPrice` | `number` | — | Maximum price filter |
| `sort` | `string` | `'listed_at'` | `'list_price'`, `'rarity_rank'`, `'listed_at'` |
| `order` | `'asc' \| 'desc'` | `'desc'` | Sort order |
| `page` | `number` | `1` | Page number |
| `pageSize` | `number` | `20` | Items per page |

---

### `nftService.createGate`

Create an NFT gate to restrict access to a resource.

```typescript
async createGate(input: CreateGateInput): Promise<NFTGate>
```

**Input Schema: `CreateGateInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | Yes | Venture scope |
| `resourceType` | `string` | Yes | `'feature'`, `'content'`, `'page'`, `'api'`, `'event'`, `'membership'` |
| `resourceId` | `string` | Yes | ID of the gated resource |
| `resourceName` | `string` | No | Human-readable name |
| `conditions` | `GateCondition[]` | Yes | Array of gate conditions |
| `operator` | `'AND' \| 'OR'` | No | Condition logic (default: `'OR'`) |
| `fallbackAction` | `string` | No | `'block'`, `'redirect'`, `'show_upgrade'` |
| `fallbackUrl` | `string` | No | Redirect URL for non-holders |

---

### `nftService.checkGate`

Check whether a wallet passes an NFT gate.

```typescript
async checkGate(
  gateId: string,
  walletAddress: string
): Promise<{ allowed: boolean; reason?: string }>
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `allowed` | `boolean` | Whether the wallet satisfies gate conditions |
| `reason` | `string \| undefined` | Failure reason if not allowed |

---

### `nftService.calculateRarity`

Calculate rarity scores and ranks for all NFTs in a collection.

```typescript
async calculateRarity(collectionId: string): Promise<void>
```

Updates `rarity_score` and `rarity_rank` on all NFTs. Should be called after collection is fully minted.

---

### `nftService.getRarity`

Get rarity details for a specific NFT.

```typescript
async getRarity(nftId: string): Promise<NFTRarity>
```

**Returns: `NFTRarity`**

| Field | Type | Description |
|-------|------|-------------|
| `score` | `number` | Total rarity score |
| `rank` | `number` | Rank within collection (1 = rarest) |
| `totalInCollection` | `number` | Collection size |
| `traits` | `TraitRarity[]` | Per-trait rarity breakdown |

---

## Oracle Service

### `oracleService.getPrice`

Get the current price for a trading pair.

```typescript
async getPrice(pair: string): Promise<PriceFeed>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pair` | `string` | Yes | Trading pair slug (e.g., `'sol-usd'`, `'btc-usd'`) |

**Returns: `PriceFeed`**

| Field | Type | Description |
|-------|------|-------------|
| `feedId` | `string` | Feed identifier |
| `pair` | `string` | Trading pair |
| `value` | `number` | Current price |
| `confidence` | `number` | Confidence score (0–1) |
| `change24h` | `number` | 24-hour price change (%) |
| `high24h` | `number` | 24-hour high |
| `low24h` | `number` | 24-hour low |
| `volume24h` | `number \| null` | 24-hour volume |
| `numActiveSources` | `number` | Number of contributing sources |
| `status` | `FeedStatus` | `'active'`, `'stale'`, `'inactive'` |
| `lastUpdated` | `Date` | Timestamp of last update |
| `staleSince` | `Date \| null` | When the feed became stale (if applicable) |

**Example:**

```typescript
const solPrice = await oracleService.getPrice('sol-usd');
console.log(solPrice.value);      // 142.50
console.log(solPrice.confidence); // 0.97
console.log(solPrice.status);     // 'active'
```

**Errors:** `O300` (feed not found), `O302` (feed stale — returns cached value with warning)

---

### `oracleService.getPrices`

Get current prices for multiple pairs in a single call.

```typescript
async getPrices(pairs: string[]): Promise<PriceFeed[]>
```

**Example:**

```typescript
const prices = await oracleService.getPrices(['sol-usd', 'btc-usd', 'eth-usd']);
```

---

### `oracleService.getPriceHistory`

Get historical price candles for a trading pair.

```typescript
async getPriceHistory(
  pair: string,
  interval: CandleInterval,
  limit?: number
): Promise<PriceCandle[]>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pair` | `string` | Yes | Trading pair slug |
| `interval` | `CandleInterval` | Yes | `'1m'`, `'5m'`, `'15m'`, `'1h'`, `'4h'`, `'1d'`, `'1w'` |
| `limit` | `number` | No | Max candles to return (default: 100, max: 1000) |

**Returns: `PriceCandle[]`**

| Field | Type | Description |
|-------|------|-------------|
| `open` | `number` | Opening price |
| `high` | `number` | High price |
| `low` | `number` | Low price |
| `close` | `number` | Closing price |
| `volume` | `number \| null` | Volume |
| `timestamp` | `Date` | Candle start time |

---

### `oracleService.subscribePrices`

Subscribe to real-time price updates via WebSocket.

```typescript
subscribePrices(
  pairs: string[],
  callback: (update: PriceFeed) => void
): Unsubscribe
```

**Returns:** Unsubscribe function — call to stop receiving updates.

**Example:**

```typescript
const unsubscribe = oracleService.subscribePrices(
  ['sol-usd', 'btc-usd'],
  (update) => {
    console.log(`${update.pair}: $${update.value}`);
  }
);

// Later: stop listening
unsubscribe();
```

---

### `oracleService.createFeed`

Create a custom oracle feed with configurable sources and aggregation.

```typescript
async createFeed(
  input: CreateOracleFeedInput
): Promise<OracleFeed>
```

**Input Schema: `CreateOracleFeedInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Feed name |
| `slug` | `string` | Yes | Unique slug for the feed |
| `pair` | `string` | No | Trading pair if price feed |
| `type` | `OracleType` | Yes | `'price'`, `'randomness'`, `'sports'`, `'weather'`, `'custom'` |
| `sources` | `OracleSourceConfig[]` | Yes | Array of data sources |
| `aggregationMethod` | `string` | No | `'median'` (default), `'mean'`, `'weighted'`, `'first_valid'` |
| `outlierRejection` | `boolean` | No | Enable outlier rejection (default: true) |
| `outlierSigma` | `number` | No | Sigma threshold for outlier rejection (default: 3.0) |
| `updateFrequencySeconds` | `number` | No | Update interval (default: 10) |
| `deviationThresholdPercent` | `number` | No | Min deviation to publish (default: 0.5%) |
| `heartbeatSeconds` | `number` | No | Max seconds between updates (default: 60) |
| `decimals` | `number` | No | Decimal precision (default: 8) |
| `unit` | `string` | No | Value unit ("USD", "ETH") |
| `ventureId` | `string` | No | Venture scope (null = global) |

**OracleSourceConfig:**

```typescript
interface OracleSourceConfig {
  name: string;              // "pyth-sol-usd"
  type: 'pyth' | 'switchboard' | 'api' | 'chainlink';
  weight?: number;           // For weighted aggregation (default: 1)
  // Source-specific config:
  pythSymbol?: string;       // "Crypto.SOL/USD" (for Pyth)
  feedAddress?: string;      // On-chain feed address (Switchboard/Chainlink)
  apiUrl?: string;           // REST API URL (for custom APIs)
  apiPath?: string;          // JSONPath to extract value
  apiHeaders?: Record<string, string>;
}
```

---

### `oracleService.triggerUpdate`

Manually trigger a feed update (bypasses deviation threshold).

```typescript
async triggerUpdate(feedId: string): Promise<OracleUpdate>
```

---

### `oracleService.getFeedHealth`

Get health status for all oracle feeds.

```typescript
async getFeedHealth(): Promise<FeedHealthReport>
```

**Returns: `FeedHealthReport`**

| Field | Type | Description |
|-------|------|-------------|
| `totalFeeds` | `number` | Total active feeds |
| `healthyFeeds` | `number` | Feeds within heartbeat |
| `staleFeeds` | `number` | Feeds exceeding heartbeat |
| `feeds` | `FeedStalenessResult[]` | Per-feed status details |
| `checkedAt` | `Date` | Check timestamp |

---

### `randomnessService.requestRandomness`

Request verifiable random numbers (VRF).

```typescript
async requestRandomness(
  input: RandomnessRequest
): Promise<{ requestId: string }>
```

**Input Schema: `RandomnessRequest`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | Yes | Requesting venture |
| `requesterAddress` | `string` | Yes | Wallet requesting randomness |
| `numWords` | `number` | No | Number of random values (default: 1) |
| `seed` | `string` | No | User-provided seed |
| `callbackProgramId` | `string` | No | On-chain callback program |

**Returns:** `requestId` to poll for the result.

---

### `randomnessService.getRandomnessResult`

Get the result of a randomness request.

```typescript
async getRandomnessResult(
  requestId: string
): Promise<RandomnessResult | null>
```

**Returns: `RandomnessResult`**

| Field | Type | Description |
|-------|------|-------------|
| `requestId` | `string` | Request identifier |
| `randomWords` | `string[]` | Array of random uint256 values |
| `proof` | `string` | VRF proof for verification |
| `status` | `string` | `'fulfilled'` or `'pending'` |
| `fulfilledAt` | `Date` | Fulfillment timestamp |

---

### `sportsOracleService.getSportsEvents`

Get sports events with filtering.

```typescript
async getSportsEvents(
  filters: SportsEventFilters
): Promise<PaginatedResult<SportsEvent>>
```

**Filters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sport` | `string` | No | `'football'`, `'basketball'`, `'baseball'`, `'soccer'`, etc. |
| `league` | `string` | No | `'NFL'`, `'NBA'`, `'MLB'`, `'EPL'`, `'UFC'`, etc. |
| `status` | `string` | No | `'scheduled'`, `'live'`, `'finished'`, `'certified'` |
| `startDate` | `Date` | No | Events starting after this date |
| `endDate` | `Date` | No | Events starting before this date |
| `page` | `number` | No | Page number |
| `pageSize` | `number` | No | Items per page |

---

### `sportsOracleService.getLiveEvents`

Get all currently live sports events.

```typescript
async getLiveEvents(sport?: string): Promise<SportsEvent[]>
```

---

### `sportsOracleService.subscribeSportsEvent`

Subscribe to real-time updates for a sports event (scores, status changes).

```typescript
subscribeSportsEvent(
  eventId: string,
  callback: (update: SportsEvent) => void
): Unsubscribe
```

---

### `sportsOracleService.certifyResult`

Certify a sports event result for downstream settlement.

```typescript
async certifyResult(eventId: string): Promise<SportsEvent>
```

**Errors:** `O304` (event not found), `O305` (result not ready for certification)

---

## Attestation Service

### `attestationService.createAttestation`

Issue a new attestation for a wallet address.

```typescript
async createAttestation(
  input: CreateAttestationInput
): Promise<Attestation>
```

**Input Schema: `CreateAttestationInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schemaId` | `string` | Yes | Attestation schema to use |
| `subjectAddress` | `string` | Yes | Wallet address being attested |
| `subjectId` | `string` | No | User ID if known |
| `ventureId` | `string` | No | Venture context |
| `data` | `Record<string, unknown>` | Yes | Attestation data (validated against schema) |
| `privateData` | `Record<string, unknown>` | No | Encrypted private data (SSN, DOB) |
| `attesterId` | `string` | No | ID of the attesting entity |
| `attesterName` | `string` | No | Name of the attester |
| `validityDays` | `number` | No | Override schema default validity |
| `publishOnChain` | `boolean` | No | Publish to blockchain (default: false) |
| `chain` | `Chain` | No | Chain for on-chain publication |

**Example:**

```typescript
const attestation = await attestationService.createAttestation({
  schemaId: 'age-verification',
  subjectAddress: 'GKv4wZpD2GTR8kL6t5yN...',
  ventureId: 'betedge',
  data: {
    age: 25,
    country: 'US',
    state: 'NY',
    verified: true,
  },
  privateData: {
    dateOfBirth: '2001-03-15',
    documentType: 'passport',
  },
  attesterName: 'SumSub',
  publishOnChain: true,
  chain: 'solana',
});
```

---

### `attestationService.verifyAttestation`

Check if a wallet has a valid attestation of a given type.

```typescript
async verifyAttestation(
  input: CheckAttestationInput
): Promise<{ valid: boolean; attestation?: Attestation; reason?: string }>
```

**Input Schema: `CheckAttestationInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subjectAddress` | `string` | Yes | Wallet address to check |
| `type` | `AttestationType` | Yes | Attestation type to verify |
| `requirements` | `Record<string, unknown>` | No | Additional requirements (e.g., `{ minAge: 21 }`) |
| `ventureId` | `string` | No | Venture context |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `valid` | `boolean` | Whether a valid attestation exists |
| `attestation` | `Attestation \| undefined` | The matching attestation (if valid) |
| `reason` | `string \| undefined` | Reason for invalidity |

**Example:**

```typescript
const check = await attestationService.verifyAttestation({
  subjectAddress: 'GKv4wZpD2...',
  type: 'age',
  requirements: { minAge: 21 },
  ventureId: 'betedge',
});

if (check.valid) {
  // User can place bets
} else {
  console.log(check.reason); // "No valid age attestation found"
}
```

**Errors:** `A400` (schema not found)

---

### `attestationService.revokeAttestation`

Revoke an existing attestation.

```typescript
async revokeAttestation(
  attestationId: string,
  reason: string,
  revokedBy: string
): Promise<Attestation>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `attestationId` | `string` | Yes | Attestation to revoke |
| `reason` | `string` | Yes | Reason for revocation |
| `revokedBy` | `string` | Yes | ID of user/service revoking |

**Returns:** Updated attestation with `status: 'revoked'`, `revokedAt`, and `revokeReason`.

**Errors:** `A401` (attestation not found), `A403` (already revoked)

---

### `verificationService.startVerification`

Start a KYC verification flow with an external provider.

```typescript
async startVerification(
  input: StartVerificationInput
): Promise<{ requestId: string; sdkToken: string; provider: string }>
```

**Input Schema: `StartVerificationInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schemaId` | `string` | Yes | Attestation schema to verify against |
| `userId` | `string` | Yes | User starting verification |
| `walletAddress` | `string` | Yes | Wallet to receive attestation |
| `ventureId` | `string` | Yes | Venture context |
| `provider` | `string` | No | Preferred provider (default: auto-select) |
| `redirectUrl` | `string` | No | URL to redirect after completion |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `requestId` | `string` | Verification request ID |
| `sdkToken` | `string` | Token to initialize the provider's SDK widget |
| `provider` | `string` | Selected KYC provider |

**Example:**

```typescript
const { requestId, sdkToken, provider } = await verificationService.startVerification({
  schemaId: 'age-verification',
  userId: 'usr_abc123',
  walletAddress: 'GKv4wZpD2...',
  ventureId: 'betedge',
  provider: 'sumsub',
});

// Embed SumSub SDK widget using sdkToken
// Wait for webhook callback with result
```

---

### `credentialService.issueCredential`

Issue a W3C Verifiable Credential from a verified attestation.

```typescript
async issueCredential(
  input: IssueCredentialInput
): Promise<VerifiableCredential>
```

**Input Schema: `IssueCredentialInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attestationId` | `string` | Yes | Source attestation (must be verified) |
| `credentialType` | `string` | Yes | `'KYCCredential'`, `'AgeCredential'`, etc. |
| `subjectDid` | `string` | Yes | Subject DID (`did:sol:<address>` or `did:ethr:<address>`) |
| `disclosableFields` | `string[]` | No | Fields eligible for selective disclosure |

**Returns:** Full W3C Verifiable Credential with Ed25519 proof.

---

### `credentialService.verifyCredential`

Verify a presented Verifiable Credential.

```typescript
async verifyCredential(
  credential: VerifiableCredentialJSON
): Promise<{ valid: boolean; issuer: string; expired: boolean; revoked: boolean }>
```

---

### `reputationService.calculateScore`

Calculate or recalculate a reputation score for a wallet.

```typescript
async calculateScore(
  input: ReputationScoreInput
): Promise<ReputationScore>
```

**Input Schema: `ReputationScoreInput`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `walletAddress` | `string` | Yes | Wallet to score |
| `userId` | `string` | No | User ID for cross-module data |
| `ventureId` | `string` | No | Venture context |

**Returns: `ReputationScore`**

| Field | Type | Description |
|-------|------|-------------|
| `score` | `number` | 0–1000 reputation score |
| `tier` | `string` | `'newcomer'`, `'bronze'`, `'silver'`, `'gold'`, `'platinum'`, `'diamond'` |
| `percentile` | `number` | Percentile rank (0–100) |
| `factors` | `ReputationFactor[]` | Factor breakdown with individual scores |
| `previousScore` | `number \| null` | Last calculated score |
| `scoreChange` | `number \| null` | Delta from previous |

---

## Types & Schemas

### Core Types

```typescript
// Chain identifiers
type Chain = 'solana' | 'ethereum' | 'base' | 'polygon' | 'arbitrum';

// Solana network variants
type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';

// Wallet provider identifiers
type WalletProvider = 'phantom' | 'solflare' | 'backpack' | 'metamask'
  | 'coinbase_wallet' | 'walletconnect' | 'privy' | 'kms';

// NFT standards
type NFTStandard = 'metaplex' | 'compressed' | 'erc721' | 'erc1155';

// Collection lifecycle status
type CollectionStatus = 'draft' | 'minted' | 'minting' | 'revealed' | 'frozen';

// Oracle types
type OracleType = 'price' | 'randomness' | 'sports' | 'weather' | 'custom';

// Feed health status
type FeedStatus = 'active' | 'stale' | 'inactive' | 'deprecated';

// Attestation types
type AttestationType = 'kyc' | 'aml' | 'age' | 'accredited'
  | 'jurisdiction' | 'identity' | 'credential' | 'custom';

// Attestation lifecycle status
type AttestationStatus = 'pending' | 'verified' | 'rejected' | 'expired' | 'revoked';
```

### Wallet Types

```typescript
interface UserWallet {
  id: string;
  ventureId: string;
  userId: string;
  chain: Chain;
  address: string;
  provider: WalletProvider | null;
  isCustodial: boolean;
  isPrimary: boolean;
  verifiedAt: Date | null;
  resolvedName: string | null;
  label: string | null;
  metadata: WalletMetadata | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WalletSession {
  id: string;
  walletId: string;
  userId: string;
  sessionToken: string;
  provider: WalletProvider | null;
  isActive: boolean;
  connectedAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  metadata: SessionMetadata | null;
}

interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: string;
  rawBalance: bigint;
  decimals: number;
  usdValue: number | null;
  logoUri: string | null;
}

interface WalletTransaction {
  id: string;
  chain: Chain;
  txHash: string;
  type: string;
  status: 'pending' | 'confirmed' | 'failed' | 'finalized';
  fromAddress: string;
  toAddress: string | null;
  amount: string | null;
  tokenSymbol: string | null;
  fee: string | null;
  description: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
}
```

### NFT Types

```typescript
interface NFTCollection {
  id: string;
  ventureId: string;
  name: string;
  symbol: string;
  slug: string;
  chain: Chain;
  standard: NFTStandard;
  contractAddress: string | null;
  collectionMint: string | null;
  maxSupply: number | null;
  currentSupply: number;
  royaltyBasisPoints: number;
  mintPhases: MintPhase[] | null;
  status: CollectionStatus;
  floorPrice: string | null;
  totalVolume: string | null;
  uniqueHolders: number;
  createdAt: Date;
}

interface NFT {
  id: string;
  collectionId: string | null;
  chain: Chain;
  mintAddress: string;
  name: string;
  description: string | null;
  image: string | null;
  attributes: NFTAttribute[] | null;
  ownerAddress: string | null;
  isCompressed: boolean;
  isListed: boolean;
  listPrice: string | null;
  rarityScore: string | null;
  rarityRank: number | null;
  metadataUri: string | null;
  createdAt: Date;
}

interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date';
}

interface NFTRarity {
  score: number;
  rank: number;
  totalInCollection: number;
  traits: TraitRarity[];
}

interface TraitRarity {
  trait_type: string;
  value: string;
  count: number;
  percentage: number;
  rarityScore: number;
}

interface MintRequest {
  id: string;
  collectionId: string;
  walletAddress: string;
  quantity: number;
  status: 'pending' | 'paid' | 'minting' | 'completed' | 'failed' | 'refunded';
  totalPrice: string | null;
  mintedNftIds: string[] | null;
  mintTxHashes: string[] | null;
  errorMessage: string | null;
  createdAt: Date;
}

interface CompressedNFTProof {
  root: string;
  proof: string[];
  leaf: string;
  leafIndex: number;
  treeId: string;
  canopyDepth: number;
}
```

### Oracle Types

```typescript
interface PriceFeed {
  feedId: string;
  pair: string;
  value: number;
  confidence: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number | null;
  numActiveSources: number;
  status: FeedStatus;
  lastUpdated: Date;
  staleSince: Date | null;
}

interface PriceCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  timestamp: Date;
}

type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

interface RandomnessResult {
  requestId: string;
  randomWords: string[];
  proof: string;
  status: 'pending' | 'committed' | 'fulfilled' | 'failed' | 'expired';
  fulfilledAt: Date | null;
}

interface SportsEvent {
  id: string;
  externalId: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  status: 'scheduled' | 'pregame' | 'live' | 'halftime' | 'finished' | 'cancelled';
  homeScore: number | null;
  awayScore: number | null;
  winner: string | null;
  resultCertified: boolean;
  odds: EventOdds | null;
}

interface EventOdds {
  moneyline?: { home: number; away: number; draw?: number };
  spread?: { home: number; homeOdds: number; away: number; awayOdds: number };
  total?: { over: number; overOdds: number; under: number; underOdds: number };
  provider?: string;
  updatedAt?: string;
}
```

### Attestation Types

```typescript
interface Attestation {
  id: string;
  schemaId: string;
  subjectAddress: string;
  attesterId: string | null;
  attesterName: string | null;
  status: AttestationStatus;
  data: Record<string, unknown>;
  chain: Chain | null;
  attestationUid: string | null;
  txHash: string | null;
  issuedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  revokeReason: string | null;
  verificationProvider: string | null;
  createdAt: Date;
}

interface ReputationScore {
  walletAddress: string;
  score: number;
  tier: 'newcomer' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  percentile: number;
  factors: ReputationFactor[];
  previousScore: number | null;
  scoreChange: number | null;
  lastCalculated: Date;
}

interface ReputationFactor {
  name: string;
  value: number;
  weight: number;
  score: number;
  description: string;
}

interface VerifiableCredentialJSON {
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
}
```

### Pagination Types

```typescript
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface PaginationOptions {
  page?: number;        // Default: 1
  pageSize?: number;    // Default: 20, max: 100
  sort?: string;
  order?: 'asc' | 'desc';
}
```

---

## Events

All events are published to Redpanda/Kafka topics. Consumers use standard Kafka consumer groups.

### Event Format

```typescript
interface Web3PublicEvent<T = unknown> {
  id: string;                   // Unique event ID (ULID)
  type: string;                 // Event type (e.g., 'nft.minted')
  source: string;               // 'web3-public'
  timestamp: string;            // ISO 8601
  ventureId: string | null;
  traceId: string;              // Distributed tracing ID
  data: T;                      // Event-specific payload
}
```

### Wallet Events (Topic: `web3-public.wallet`)

| Event Type | Trigger | Data Fields |
|------------|---------|-------------|
| `wallet.connected` | Wallet linked | `walletId`, `userId`, `chain`, `address`, `provider` |
| `wallet.disconnected` | Session ended | `walletId`, `userId`, `sessionId` |
| `wallet.linked` | Additional wallet | `walletId`, `userId`, `chain`, `address` |
| `wallet.transaction.confirmed` | Tx confirmed | `txHash`, `chain`, `type`, `amount`, `status` |
| `wallet.transaction.finalized` | Tx finalized | `txHash`, `chain`, `slot` |
| `wallet.session.expired` | TTL exceeded | `sessionId`, `walletId`, `userId` |

### NFT Events (Topic: `web3-public.nft`)

| Event Type | Trigger | Data Fields |
|------------|---------|-------------|
| `nft.collection.created` | Collection saved | `collectionId`, `ventureId`, `name`, `chain` |
| `nft.collection.deployed` | On-chain deploy | `collectionId`, `contractAddress`, `txHash` |
| `nft.minted` | NFT minted | `nftId`, `collectionId`, `mintAddress`, `ownerAddress` |
| `nft.transferred` | NFT transferred | `nftId`, `from`, `to`, `txHash` |
| `nft.listed` | Listed for sale | `nftId`, `price`, `marketplace` |
| `nft.sold` | NFT purchased | `nftId`, `from`, `to`, `price`, `royaltyPaid` |
| `nft.burned` | NFT burned | `nftId`, `ownerAddress`, `txHash` |
| `nft.gate.checked` | Gate evaluated | `gateId`, `walletAddress`, `allowed`, `reason` |
| `nft.membership.activated` | Membership started | `membershipId`, `userId`, `tier` |
| `nft.membership.deactivated` | Membership ended | `membershipId`, `userId`, `reason` |

### Oracle Events (Topic: `web3-public.oracle`)

| Event Type | Trigger | Data Fields |
|------------|---------|-------------|
| `oracle.price.updated` | Feed updated | `feedId`, `pair`, `value`, `confidence`, `sources` |
| `oracle.feed.stale` | Heartbeat exceeded | `feedId`, `slug`, `secondsSinceUpdate` |
| `oracle.feed.recovered` | Stale feed recovered | `feedId`, `slug`, `downtimeSeconds` |
| `oracle.randomness.fulfilled` | VRF fulfilled | `requestId`, `randomWords`, `proof` |
| `oracle.sports.status_changed` | Event status change | `eventId`, `sport`, `oldStatus`, `newStatus` |
| `oracle.sports.result_certified` | Result certified | `eventId`, `winner`, `homeScore`, `awayScore` |

### Attestation Events (Topic: `web3-public.attestation`)

| Event Type | Trigger | Data Fields |
|------------|---------|-------------|
| `attestation.verification.started` | KYC flow started | `requestId`, `userId`, `provider`, `schema` |
| `attestation.verification.completed` | KYC completed | `requestId`, `passed`, `attestationId` |
| `attestation.created` | Attestation issued | `attestationId`, `subjectAddress`, `type`, `status` |
| `attestation.revoked` | Attestation revoked | `attestationId`, `revokedBy`, `reason` |
| `attestation.expired` | Attestation expired | `attestationId`, `subjectAddress`, `type` |
| `attestation.published_onchain` | On-chain publish | `attestationId`, `chain`, `txHash` |
| `reputation.score.updated` | Score recalculated | `walletAddress`, `score`, `tier`, `change` |
| `credential.issued` | VC issued | `credentialId`, `subjectDid`, `type` |

---

## Error Codes

### Complete Error Code Reference

```typescript
// Wallet Errors (W1xx)
W100  WALLET_NOT_FOUND          // Wallet record does not exist
W101  WALLET_NOT_CONNECTED      // No active connection for this wallet
W102  WALLET_REJECTED           // User rejected connection/signature in wallet popup
W103  WALLET_ADAPTER_ERROR      // Wallet adapter threw an error (provider-specific)
W104  NONCE_EXPIRED             // Nonce TTL exceeded (5 minutes)
W105  NONCE_ALREADY_USED        // Nonce was already consumed
W106  SIGNATURE_INVALID         // Cryptographic signature verification failed
W107  SESSION_EXPIRED           // Wallet session TTL exceeded
W108  INSUFFICIENT_BALANCE      // Not enough balance for the requested operation
W109  UNSUPPORTED_CHAIN         // Chain is not supported

// NFT Errors (N2xx)
N200  COLLECTION_NOT_FOUND      // Collection does not exist
N201  COLLECTION_SOLD_OUT       // Collection max supply reached
N202  MINT_PHASE_INACTIVE       // No active mint phase
N203  NOT_WHITELISTED           // Wallet not in whitelist merkle tree
N204  MAX_PER_WALLET_EXCEEDED   // Wallet has reached mint limit for this phase
N205  MINT_PAYMENT_FAILED       // Payment transaction failed or insufficient
N206  METADATA_UPLOAD_FAILED    // Arweave/IPFS metadata upload failed
N207  NFT_NOT_OWNED             // Caller does not own this NFT
N208  NFT_ALREADY_LISTED        // NFT is already listed for sale
N209  GATE_CHECK_FAILED         // Wallet does not pass NFT gate requirements
N210  ROYALTY_ENFORCEMENT_ERROR  // Royalty enforcement failed during transfer

// Oracle Errors (O3xx)
O300  FEED_NOT_FOUND            // Oracle feed does not exist
O301  NO_VALID_SOURCES          // All oracle sources failed for this feed
O302  FEED_STALE                // Feed has not updated within heartbeat window
O303  VRF_REQUEST_FAILED        // Verifiable randomness request failed
O304  SPORTS_EVENT_NOT_FOUND    // Sports event does not exist
O305  RESULT_NOT_CERTIFIED      // Sports result not yet certified

// Attestation Errors (A4xx)
A400  SCHEMA_NOT_FOUND          // Attestation schema does not exist
A401  ATTESTATION_NOT_FOUND     // Attestation record does not exist
A402  ATTESTATION_EXPIRED       // Attestation validity period has ended
A403  ATTESTATION_REVOKED       // Attestation has been revoked
A404  VERIFICATION_FAILED       // KYC verification did not pass
A405  PROVIDER_ERROR            // KYC provider returned an error
A406  JURISDICTION_BLOCKED      // User's jurisdiction is blocked
A407  AGE_REQUIREMENT_NOT_MET   // User does not meet age requirement
A408  CREDENTIAL_INVALID        // Verifiable credential signature invalid or expired

// General Errors (G5xx)
G500  RATE_LIMITED              // Too many requests
G501  RPC_ERROR                 // Solana/EVM RPC call failed
G502  TRANSACTION_FAILED        // On-chain transaction failed
G503  TIMEOUT                   // Operation timed out
G504  INTERNAL_ERROR            // Unexpected internal error
```

### Error Response Structure

```typescript
class Web3PublicError extends Error {
  code: string;                         // Error code (e.g., 'W106')
  message: string;                      // Human-readable message
  details?: Record<string, unknown>;    // Additional context
  retryable: boolean;                   // Whether the operation can be retried
  retryAfterMs?: number;                // Suggested retry delay in milliseconds
  chain?: Chain;                        // Chain where error occurred
  txHash?: string;                      // Transaction hash if relevant
}
```

---

## Configuration

### Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════
# SOLANA RPC
# ═══════════════════════════════════════════════════════════════
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...
SOLANA_RPC_FALLBACK_URL=https://mcv-triton.rpcpool.com/...
SOLANA_RPC_BACKUP_URL=https://cold-bold-model.solana-mainnet.quiknode.pro/...
SOLANA_NETWORK=mainnet-beta                    # mainnet-beta | devnet | testnet
SOLANA_COMMITMENT=confirmed                    # processed | confirmed | finalized

# ═══════════════════════════════════════════════════════════════
# WALLET SDK
# ═══════════════════════════════════════════════════════════════
WALLET_SESSION_TTL_HOURS=24                    # Session expiry (default: 24)
WALLET_NONCE_TTL_MINUTES=5                     # Nonce expiry (default: 5)
WALLET_MAX_SESSIONS_PER_USER=10                # Max concurrent sessions
WALLETCONNECT_PROJECT_ID=...                   # WalletConnect Cloud project ID
PRIVY_APP_ID=...                               # Privy embedded wallet app ID
PRIVY_APP_SECRET=...                           # Privy secret
KMS_PROVIDER=aws                               # aws | vault
AWS_KMS_KEY_ID=...                             # AWS KMS key for custodial wallets

# ═══════════════════════════════════════════════════════════════
# NFT
# ═══════════════════════════════════════════════════════════════
ARWEAVE_BUNDLR_URL=https://node1.bundlr.network
ARWEAVE_WALLET_PATH=./keys/arweave.json        # Arweave wallet for metadata uploads
IPFS_PINATA_API_KEY=...                         # Pinata IPFS API key
IPFS_PINATA_SECRET=...                          # Pinata IPFS secret
DEFAULT_ROYALTY_BPS=500                         # Default royalty (5%)
MAX_COMPRESSED_MINT_BATCH=100                   # Max cNFTs per transaction
MERKLE_TREE_MAX_DEPTH=20                        # Bubblegum tree depth
MERKLE_TREE_MAX_BUFFER_SIZE=256                 # Bubblegum tree buffer
MERKLE_TREE_CANOPY_DEPTH=14                     # Canopy depth for concurrent writes

# ═══════════════════════════════════════════════════════════════
# ORACLES
# ═══════════════════════════════════════════════════════════════
PYTH_PROGRAM_ID=FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH
SWITCHBOARD_PROGRAM_ID=SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f
ORACLE_UPDATE_FREQUENCY_SECONDS=10              # Default update interval
ORACLE_DEVIATION_THRESHOLD_PERCENT=0.50         # Min deviation to publish
ORACLE_HEARTBEAT_SECONDS=60                     # Max seconds between updates
ORACLE_SOURCE_TIMEOUT_MS=5000                   # Per-source fetch timeout
ORACLE_OUTLIER_SIGMA=3.0                        # Outlier rejection threshold
SPORTS_API_KEY=...                              # Sports data provider API key
SPORTS_API_URL=https://api.sportsdata.io/v3

# ═══════════════════════════════════════════════════════════════
# ATTESTATION
# ═══════════════════════════════════════════════════════════════
SUMSUB_APP_TOKEN=...                            # SumSub API token
SUMSUB_SECRET_KEY=...                           # SumSub secret key
SUMSUB_WEBHOOK_SECRET=...                       # SumSub webhook signing secret
VERIFF_API_KEY=...                              # Veriff API key
VERIFF_SHARED_SECRET=...                        # Veriff shared secret
EAS_CONTRACT_ADDRESS=0xA1207F3BBa224E2c9c3c6D5aF63D816e0348CAe2  # EAS on Ethereum
ATTESTATION_ENCRYPTION_KEY=...                  # AES-256 key for private data
DEFAULT_ATTESTATION_VALIDITY_DAYS=365           # Default validity period

# ═══════════════════════════════════════════════════════════════
# REDIS
# ═══════════════════════════════════════════════════════════════
REDIS_URL=redis://localhost:6379
REDIS_PRICE_CACHE_TTL_SECONDS=30               # Price cache TTL
REDIS_SESSION_PREFIX=wallet:session:
REDIS_PRICE_PREFIX=price:

# ═══════════════════════════════════════════════════════════════
# EVENTS
# ═══════════════════════════════════════════════════════════════
REDPANDA_BROKERS=localhost:9092
REDPANDA_WALLET_TOPIC=web3-public.wallet
REDPANDA_NFT_TOPIC=web3-public.nft
REDPANDA_ORACLE_TOPIC=web3-public.oracle
REDPANDA_ATTESTATION_TOPIC=web3-public.attestation
```

### Runtime Configuration Object

```typescript
import type { Web3PublicConfig } from '@mcv/web3-public';

const config: Web3PublicConfig = {
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL!,
    fallbackRpcUrl: process.env.SOLANA_RPC_FALLBACK_URL,
    network: 'mainnet-beta',
    commitment: 'confirmed',
  },
  wallet: {
    sessionTtlHours: 24,
    nonceTtlMinutes: 5,
    maxSessionsPerUser: 10,
    walletConnect: {
      projectId: process.env.WALLETCONNECT_PROJECT_ID!,
    },
    privy: {
      appId: process.env.PRIVY_APP_ID!,
    },
  },
  nft: {
    defaultRoyaltyBps: 500,
    maxCompressedMintBatch: 100,
    arweave: {
      bundlrUrl: 'https://node1.bundlr.network',
      walletPath: './keys/arweave.json',
    },
    merkleTree: {
      maxDepth: 20,
      maxBufferSize: 256,
      canopyDepth: 14,
    },
  },
  oracle: {
    updateFrequencySeconds: 10,
    deviationThresholdPercent: 0.5,
    heartbeatSeconds: 60,
    sourceTimeoutMs: 5000,
    outlierSigma: 3.0,
  },
  attestation: {
    defaultValidityDays: 365,
    encryptionKey: process.env.ATTESTATION_ENCRYPTION_KEY!,
    sumsub: {
      appToken: process.env.SUMSUB_APP_TOKEN!,
      secretKey: process.env.SUMSUB_SECRET_KEY!,
    },
  },
  redis: {
    url: process.env.REDIS_URL!,
    priceCacheTtl: 30,
  },
  events: {
    brokers: [process.env.REDPANDA_BROKERS!],
  },
};
```

---

*@mcv/web3-public — Web3 Public Domain*
