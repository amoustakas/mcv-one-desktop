# @mcv/web3-public/nfts

> **Tier 5 — Domain Module · Publishable**
> NFT minting, collection management, compressed NFTs, marketplace integration, gating, and membership systems on Solana.

---

## Purpose

The `@mcv/web3-public/nfts` module is the comprehensive NFT infrastructure layer for all MCV ventures. It provides a unified interface for minting standard and compressed NFTs on Solana via the Metaplex protocol, managing collections with verified on-chain metadata, and integrating with major marketplaces like Magic Eden and Tensor. Rather than each venture building bespoke NFT logic, this module encapsulates the full lifecycle — from collection creation and minting through metadata management, marketplace listing, ownership gating, membership systems, royalty enforcement, and burn mechanics.

NFTs in the MCV ecosystem serve far more than collectibility. They are programmable access tokens, membership credentials, achievement records, and economic primitives. BetEdge mints collectible moments from historic bets, MCV Studios issues in-game items and character skins as NFTs, and every venture can gate premium features behind NFT ownership. The module handles both standard Metaplex NFTs for high-value collectibles and compressed NFTs (cNFTs) via the Bubblegum program for mass distribution — enabling millions of NFTs to be minted at fractions of a penny each. This dual-track approach lets ventures choose the right cost/feature tradeoff for each use case.

The module also provides robust analytics tracking (floor prices, holder distribution, trading volume), royalty enforcement via Metaplex's programmable NFT standard, and a membership NFT system with built-in expiry, renewal, and tier upgrade mechanics. All operations are instrumented for observability, integrated with the MCV wallet infrastructure from `@mcv/web3-public/wallets`, and designed to be resilient against Solana network congestion through priority fees and retry logic.

---

## Exports

```typescript
// @mcv/web3-public/nfts - Public API

// ── Core Services ──────────────────────────────────────────────────
export { NFTService }                    from './services/nft.service';
export { CollectionService }             from './services/collection.service';
export { CompressedNFTService }          from './services/compressed-nft.service';
export { MetadataService }               from './services/metadata.service';
export { MarketplaceService }            from './services/marketplace.service';
export { NFTGateService }                from './services/nft-gate.service';
export { MembershipNFTService }          from './services/membership-nft.service';
export { RoyaltyService }               from './services/royalty.service';
export { NFTAnalyticsService }           from './services/nft-analytics.service';
export { BurnService }                   from './services/burn.service';

// ── Interfaces & Types ─────────────────────────────────────────────
export type { NFTMintConfig }            from './interfaces/mint-config.interface';
export type { NFTCollectionConfig }      from './interfaces/collection-config.interface';
export type { NFTMetadata }              from './interfaces/nft-metadata.interface';
export type { CompressedMintConfig }     from './interfaces/compressed-mint-config.interface';
export type { MarketplaceListing }       from './interfaces/marketplace-listing.interface';
export type { GateConfig }               from './interfaces/gate-config.interface';
export type { GateCheckResult }          from './interfaces/gate-check-result.interface';
export type { MembershipNFTConfig }      from './interfaces/membership-nft-config.interface';
export type { MembershipStatus }         from './interfaces/membership-status.interface';
export type { RoyaltyConfig }            from './interfaces/royalty-config.interface';
export type { RoyaltyDistribution }      from './interfaces/royalty-distribution.interface';
export type { NFTAnalyticsSnapshot }     from './interfaces/nft-analytics-snapshot.interface';
export type { BurnConfig }               from './interfaces/burn-config.interface';
export type { BurnReward }               from './interfaces/burn-reward.interface';
export type { CollectionStats }          from './interfaces/collection-stats.interface';
export type { HolderDistribution }       from './interfaces/holder-distribution.interface';

// ── Enums ──────────────────────────────────────────────────────────
export { NFTStandard }                   from './enums/nft-standard.enum';
export { MetadataStorageType }           from './enums/metadata-storage.enum';
export { MarketplaceProvider }           from './enums/marketplace-provider.enum';
export { GateType }                      from './enums/gate-type.enum';
export { MembershipTier }               from './enums/membership-tier.enum';
export { BurnRewardType }               from './enums/burn-reward-type.enum';
export { RoyaltyEnforcementMode }       from './enums/royalty-enforcement.enum';

// ── DB Schemas ─────────────────────────────────────────────────────
export { nftCollections }                from './db/schema/nft-collections.schema';
export { nfts }                          from './db/schema/nfts.schema';
export { nftMetadata }                   from './db/schema/nft-metadata.schema';
export { nftGates }                      from './db/schema/nft-gates.schema';
export { membershipNfts }                from './db/schema/membership-nfts.schema';
export { royaltyConfigs }                from './db/schema/royalty-configs.schema';
export { nftBurns }                      from './db/schema/nft-burns.schema';
export { nftAnalyticsSnapshots }         from './db/schema/nft-analytics-snapshots.schema';
export { marketplaceListings }           from './db/schema/marketplace-listings.schema';

// ── Utilities ──────────────────────────────────────────────────────
export { buildMetadataUri }              from './utils/metadata-uri.util';
export { validateMetadata }              from './utils/metadata-validation.util';
export { estimateMintCost }              from './utils/mint-cost-estimator.util';
export { resolveNFTOwner }              from './utils/owner-resolver.util';
export { merkleTreeSize }               from './utils/merkle-tree.util';
export { compressedNFTProof }           from './utils/cnft-proof.util';

// ── Constants ──────────────────────────────────────────────────────
export { NFT_ERROR_CODES }               from './constants/error-codes.constant';
export { DEFAULT_ROYALTY_BPS }           from './constants/defaults.constant';
export { SUPPORTED_MARKETPLACES }        from './constants/marketplaces.constant';
export { MERKLE_TREE_DEPTHS }           from './constants/merkle-tree.constant';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NFT MODULE ARCHITECTURE                            │
│                        @mcv/web3-public/nfts                                │
└─────────────────────────────────────────────────────────────────────────────┘

  Venture Apps (BetEdge, MCV Studios, All Ventures)
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           NFTService (Façade)                            │
│  ┌─────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────────────────┐  │
│  │  mint()  │ │ mintBatch()  │ │ transfer() │ │ getByOwner()          │  │
│  │  burn()  │ │ mintCNFT()   │ │ freeze()   │ │ getByCollection()     │  │
│  └─────────┘ └──────────────┘ └────────────┘ └───────────────────────┘  │
└───────┬──────────────┬──────────────┬──────────────┬────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐
│  Collection  │ │ Metadata  │ │Compressed │ │ Marketplace  │
│   Service    │ │  Service  │ │NFT Service│ │   Service    │
│              │ │           │ │           │ │              │
│ create()     │ │ upload()  │ │ mintCNFT()│ │ list()       │
│ verify()     │ │ resolve() │ │ batchMint│ │ delist()     │
│ update()     │ │ pin()     │ │ transfer()│ │ updatePrice()│
│ freeze()     │ │ migrate() │ │ verify()  │ │ getListings()│
└──────┬───────┘ └─────┬─────┘ └─────┬─────┘ └──────┬───────┘
       │               │             │               │
       ▼               ▼             ▼               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        Solana Blockchain Layer                            │
│  ┌─────────────────┐ ┌───────────────┐ ┌─────────────────────────────┐  │
│  │ Metaplex Token   │ │  Bubblegum    │ │  Token Metadata Program     │  │
│  │ Metadata Program │ │  (cNFTs)      │ │  (Royalty Enforcement)      │  │
│  └─────────────────┘ └───────────────┘ └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
       │               │
       ▼               ▼
┌──────────────┐ ┌───────────────┐
│    IPFS      │ │   Arweave     │
│  (Pinata /   │ │  (Bundlr /    │
│   nft.stor.) │ │   Irys)       │
└──────────────┘ └───────────────┘

  ┌─────────────────────────────────────────────────────────────────────┐
  │                     Supporting Services                             │
  │                                                                     │
  │  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────────┐  │
  │  │ NFT Gate   │ │ Membership   │ │  Royalty    │ │  Analytics   │  │
  │  │ Service    │ │ NFT Service  │ │  Service    │ │  Service     │  │
  │  │            │ │              │ │             │ │              │  │
  │  │ check()    │ │ issue()      │ │ configure() │ │ snapshot()   │  │
  │  │ enforce()  │ │ renew()      │ │ distribute()│ │ floorPrice() │  │
  │  │ listGates()│ │ upgrade()    │ │ enforce()   │ │ holders()    │  │
  │  │ audit()    │ │ revoke()     │ │ audit()     │ │ volume()     │  │
  │  └────────────┘ └──────────────┘ └─────────────┘ └──────────────┘  │
  │                                                                     │
  │  ┌────────────┐                                                     │
  │  │   Burn     │                                                     │
  │  │  Service   │                                                     │
  │  │            │                                                     │
  │  │ burn()     │                                                     │
  │  │ batchBurn()│                                                     │
  │  │ rewards()  │                                                     │
  │  └────────────┘                                                     │
  └─────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────┐
  │                        Data Layer (Drizzle ORM)                     │
  │                                                                     │
  │  nft_collections │ nfts │ nft_metadata │ nft_gates                 │
  │  membership_nfts │ royalty_configs │ nft_burns                     │
  │  nft_analytics_snapshots │ marketplace_listings                    │
  └─────────────────────────────────────────────────────────────────────┘
```

### Flow: Standard NFT Mint

```
  Creator/Venture
       │
       ├─1─► CollectionService.create()
       │         └──► Metaplex: createNft() with isCollection=true
       │         └──► DB: INSERT nft_collections
       │
       ├─2─► MetadataService.upload()
       │         ├──► IPFS: pin JSON + image
       │         └──► Arweave: permanent backup
       │         └──► Returns: metadata URI
       │
       ├─3─► NFTService.mint()
       │         ├──► Metaplex: createNft() with collection + metadata URI
       │         ├──► CollectionService.verify() — on-chain collection verification
       │         ├──► DB: INSERT nfts, nft_metadata
       │         └──► Returns: { mint, signature, explorerUrl }
       │
       └─4─► MarketplaceService.list() (optional)
                 ├──► Magic Eden / Tensor API: create listing
                 ├──► DB: INSERT marketplace_listings
                 └──► Returns: { listingId, marketplaceUrl }
```

### Flow: Compressed NFT Batch Mint

```
  Creator/Venture
       │
       ├─1─► CompressedNFTService.createMerkleTree()
       │         └──► Bubblegum: createTree() with maxDepth + maxBufferSize
       │         └──► DB: UPDATE nft_collections SET merkle_tree_address
       │
       ├─2─► MetadataService.uploadBatch()
       │         └──► IPFS: pin all metadata JSONs
       │         └──► Returns: metadataUri[]
       │
       └─3─► CompressedNFTService.batchMint()
                 ├──► For each NFT: Bubblegum mintToCollectionV1()
                 ├──► Batched into transactions (5-8 per tx)
                 ├──► Priority fee escalation for congestion
                 ├──► DB: INSERT nfts (type='compressed')
                 └──► Returns: { minted: number, failed: number, signatures[] }
```

---

## Core Interfaces

### NFTService

```typescript
import { PublicKey, Keypair } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

/**
 * Primary façade for all NFT operations.
 * Coordinates between collection, metadata, compressed, and marketplace services.
 */
interface NFTService {
  // ── Minting ──────────────────────────────────────────────────────
  /**
   * Mint a single standard NFT into a collection.
   * Handles metadata upload, on-chain mint, collection verification, and DB record.
   */
  mint(config: NFTMintConfig): Promise<MintResult>;

  /**
   * Mint multiple standard NFTs in a batch.
   * Optimizes by batching transactions and parallelizing metadata uploads.
   */
  mintBatch(configs: NFTMintConfig[], options?: BatchMintOptions): Promise<BatchMintResult>;

  /**
   * Mint a compressed NFT (cNFT) via the Bubblegum program.
   * ~100x cheaper than standard NFTs. Ideal for mass distribution.
   */
  mintCompressed(config: CompressedMintConfig): Promise<CompressedMintResult>;

  /**
   * Batch mint compressed NFTs.
   * Can handle thousands in a single call with automatic batching.
   */
  mintCompressedBatch(
    configs: CompressedMintConfig[],
    options?: CompressedBatchOptions
  ): Promise<CompressedBatchMintResult>;

  // ── Querying ─────────────────────────────────────────────────────
  /** Get NFT by its mint address. */
  getByMint(mintAddress: string): Promise<NFTRecord | null>;

  /** Get all NFTs owned by a wallet address. */
  getByOwner(ownerAddress: string, options?: NFTQueryOptions): Promise<NFTRecord[]>;

  /** Get all NFTs in a collection. */
  getByCollection(collectionId: string, options?: PaginationOptions): Promise<PaginatedResult<NFTRecord>>;

  /** Search NFTs by metadata attributes. */
  searchByAttributes(
    collectionId: string,
    attributes: Record<string, string | number>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<NFTRecord>>;

  // ── Transfers & State ────────────────────────────────────────────
  /** Transfer an NFT to another wallet. */
  transfer(mintAddress: string, toAddress: string, fromKeypair: Keypair): Promise<TransferResult>;

  /** Freeze an NFT (prevent transfers). Requires freeze authority. */
  freeze(mintAddress: string, authorityKeypair: Keypair): Promise<TransactionResult>;

  /** Thaw a frozen NFT (re-enable transfers). */
  thaw(mintAddress: string, authorityKeypair: Keypair): Promise<TransactionResult>;

  /** Delegate authority over an NFT. */
  delegate(
    mintAddress: string,
    delegateAddress: string,
    delegateRole: DelegateRole,
    ownerKeypair: Keypair
  ): Promise<TransactionResult>;

  // ── Burns ────────────────────────────────────────────────────────
  /** Burn an NFT, optionally triggering rewards. */
  burn(mintAddress: string, ownerKeypair: Keypair, options?: BurnOptions): Promise<BurnResult>;

  /** Batch burn multiple NFTs. */
  burnBatch(mintAddresses: string[], ownerKeypair: Keypair, options?: BurnOptions): Promise<BatchBurnResult>;

  // ── Verification ─────────────────────────────────────────────────
  /** Verify on-chain that an NFT belongs to its claimed collection. */
  verifyCollection(mintAddress: string, collectionAuthorityKeypair: Keypair): Promise<TransactionResult>;

  /** Check if a wallet owns a specific NFT or any NFT from a collection. */
  verifyOwnership(walletAddress: string, filter: OwnershipFilter): Promise<OwnershipResult>;
}

interface NFTMintConfig {
  /** Collection this NFT belongs to. */
  collectionId: string;

  /** NFT name (max 32 chars on-chain). */
  name: string;

  /** NFT symbol (max 10 chars). */
  symbol: string;

  /** Description for off-chain metadata. */
  description: string;

  /** Image file path, URL, or Buffer. */
  image: string | Buffer;

  /** Optional animation URL (video, 3D model, etc.). */
  animationUrl?: string;

  /** Metadata attributes (traits). */
  attributes: NFTAttribute[];

  /** Recipient wallet address. Defaults to treasury if not specified. */
  recipientAddress?: string;

  /** Seller fee basis points (0-10000). Overrides collection default. */
  sellerFeeBasisPoints?: number;

  /** Creator shares (must sum to 100). */
  creators?: CreatorShare[];

  /** Whether this is a programmable NFT (enforced royalties). */
  programmable?: boolean;

  /** NFT standard to use. */
  standard?: NFTStandard;

  /** Metadata storage preference. */
  metadataStorage?: MetadataStorageType;

  /** External URL to link in metadata. */
  externalUrl?: string;

  /** Additional files to include in metadata. */
  files?: NFTFile[];

  /** Category for marketplace display. */
  category?: NFTCategory;

  /** Venture identifier for cross-venture tracking. */
  ventureId: string;

  /** Priority fee in microlamports for faster confirmation. */
  priorityFee?: number;

  /** Idempotency key to prevent double mints. */
  idempotencyKey?: string;
}

interface MintResult {
  /** The NFT's mint address (public key). */
  mintAddress: string;

  /** Transaction signature. */
  signature: string;

  /** Metadata URI (IPFS/Arweave). */
  metadataUri: string;

  /** Explorer URL for the transaction. */
  explorerUrl: string;

  /** Internal DB record ID. */
  recordId: string;

  /** The slot at which the mint was confirmed. */
  slot: number;

  /** Cost breakdown. */
  cost: {
    rent: number;       // SOL for account rent
    fee: number;        // Transaction fee in SOL
    priorityFee: number; // Priority fee in SOL
    storage: number;    // Metadata storage cost in SOL
    total: number;      // Total cost in SOL
  };
}

interface BatchMintOptions {
  /** Max concurrent mints. Default: 5 */
  concurrency?: number;

  /** Continue on individual mint failure. Default: true */
  continueOnError?: boolean;

  /** Priority fee per transaction in microlamports. */
  priorityFee?: number;

  /** Callback for progress updates. */
  onProgress?: (progress: BatchProgress) => void;

  /** Delay between transactions in ms (rate limiting). Default: 200 */
  delayMs?: number;
}
```

### NFTCollection

```typescript
/**
 * Represents an NFT collection on-chain and in the database.
 * A collection groups related NFTs with shared metadata and configuration.
 */
interface NFTCollection {
  /** Internal collection ID (UUID). */
  id: string;

  /** On-chain collection NFT mint address. */
  mintAddress: string;

  /** Collection name. */
  name: string;

  /** Collection symbol. */
  symbol: string;

  /** Collection description. */
  description: string;

  /** Collection image URI. */
  imageUri: string;

  /** External URL for the collection. */
  externalUrl?: string;

  /** Default seller fee basis points for NFTs in this collection. */
  sellerFeeBasisPoints: number;

  /** Creator shares configuration. */
  creators: CreatorShare[];

  /** Collection authority (can verify NFTs into collection). */
  authority: string;

  /** Update authority (can update collection metadata). */
  updateAuthority: string;

  /** Whether the collection metadata is mutable. */
  isMutable: boolean;

  /** NFT standard for items in this collection. */
  standard: NFTStandard;

  /** Merkle tree address (for compressed NFT collections). */
  merkleTreeAddress?: string;

  /** Merkle tree max depth (determines max cNFTs). */
  merkleTreeDepth?: number;

  /** Total supply minted. */
  totalMinted: number;

  /** Maximum supply (null = unlimited). */
  maxSupply?: number;

  /** Venture that owns this collection. */
  ventureId: string;

  /** Whether new mints are currently allowed. */
  mintingEnabled: boolean;

  /** Royalty enforcement mode. */
  royaltyEnforcement: RoyaltyEnforcementMode;

  /** Collection-level metadata URI. */
  metadataUri: string;

  /** Timestamps. */
  createdAt: Date;
  updatedAt: Date;

  /** Chain cluster (mainnet-beta, devnet, etc.). */
  cluster: SolanaCluster;
}

interface CreatorShare {
  /** Creator's wallet address. */
  address: string;

  /** Share percentage (0-100, all must sum to 100). */
  share: number;

  /** Whether this creator has verified on-chain. */
  verified: boolean;
}

interface CollectionService {
  /** Create a new NFT collection on-chain. */
  create(config: CollectionCreateConfig): Promise<CollectionCreateResult>;

  /** Get collection by internal ID. */
  getById(collectionId: string): Promise<NFTCollection | null>;

  /** Get collection by on-chain mint address. */
  getByMintAddress(mintAddress: string): Promise<NFTCollection | null>;

  /** Get all collections for a venture. */
  getByVenture(ventureId: string, options?: PaginationOptions): Promise<PaginatedResult<NFTCollection>>;

  /** Update collection metadata. */
  update(collectionId: string, updates: CollectionUpdateConfig): Promise<NFTCollection>;

  /** Verify an NFT as belonging to this collection. */
  verifyNFT(collectionId: string, nftMintAddress: string): Promise<TransactionResult>;

  /** Unverify an NFT from this collection. */
  unverifyNFT(collectionId: string, nftMintAddress: string): Promise<TransactionResult>;

  /** Freeze collection metadata (make immutable). */
  freezeMetadata(collectionId: string): Promise<TransactionResult>;

  /** Toggle minting enabled/disabled. */
  setMintingEnabled(collectionId: string, enabled: boolean): Promise<void>;

  /** Get collection statistics. */
  getStats(collectionId: string): Promise<CollectionStats>;

  /** Create a merkle tree for compressed NFTs in this collection. */
  createMerkleTree(collectionId: string, config: MerkleTreeConfig): Promise<MerkleTreeResult>;
}

interface CollectionCreateConfig {
  /** Collection name. */
  name: string;

  /** Collection symbol (max 10 chars). */
  symbol: string;

  /** Description. */
  description: string;

  /** Collection image (file path, URL, or Buffer). */
  image: string | Buffer;

  /** Default seller fee basis points. */
  sellerFeeBasisPoints: number;

  /** Creator shares. */
  creators: CreatorShare[];

  /** Maximum supply (omit for unlimited). */
  maxSupply?: number;

  /** NFT standard for items in this collection. */
  standard?: NFTStandard;

  /** Whether collection metadata is mutable. Default: true. */
  isMutable?: boolean;

  /** External URL. */
  externalUrl?: string;

  /** Venture ID. */
  ventureId: string;

  /** Royalty enforcement mode. Default: 'standard'. */
  royaltyEnforcement?: RoyaltyEnforcementMode;

  /** Metadata storage preference. Default: 'arweave'. */
  metadataStorage?: MetadataStorageType;

  /** Cluster to deploy on. Default from env. */
  cluster?: SolanaCluster;
}

interface CollectionStats {
  collectionId: string;
  totalMinted: number;
  totalBurned: number;
  totalActive: number;
  uniqueHolders: number;
  floorPrice?: number;
  totalVolume?: number;
  averagePrice?: number;
  listedCount: number;
  compressedCount: number;
  standardCount: number;
  lastMintedAt?: Date;
  lastSaleAt?: Date;
}
```

### NFTMetadata

```typescript
/**
 * Metaplex-compliant NFT metadata structure.
 * Follows the Token Metadata Standard for on-chain and off-chain data.
 */
interface NFTMetadata {
  /** NFT name (max 32 chars on-chain). */
  name: string;

  /** NFT symbol (max 10 chars). */
  symbol: string;

  /** Description of the NFT. */
  description: string;

  /** Seller fee basis points (0-10000 = 0%-100%). */
  seller_fee_basis_points: number;

  /** Primary image URL. */
  image: string;

  /** Animation URL (video, audio, 3D model). */
  animation_url?: string;

  /** External URL linking to more info. */
  external_url?: string;

  /** Attribute array for traits/properties. */
  attributes: NFTAttribute[];

  /** Additional properties. */
  properties: {
    /** Associated files. */
    files: NFTFile[];

    /** Category: image, video, audio, vr, html. */
    category: NFTCategory;

    /** Creator list with verified status. */
    creators: Array<{
      address: string;
      share: number;
    }>;
  };

  /** Collection info (injected on-chain). */
  collection?: {
    name: string;
    family: string;
  };
}

interface NFTAttribute {
  /** Trait category (e.g., "Background", "Rarity", "Level"). */
  trait_type: string;

  /** Trait value. */
  value: string | number;

  /** Optional display type: 'number', 'date', 'boost_percentage', etc. */
  display_type?: string;

  /** Max value (for numeric types). */
  max_value?: number;
}

interface NFTFile {
  /** File URI. */
  uri: string;

  /** MIME type. */
  type: string;

  /** Whether this is a CDN-proxied version. */
  cdn?: boolean;
}

type NFTCategory = 'image' | 'video' | 'audio' | 'vr' | 'html';

interface MetadataService {
  /**
   * Upload metadata (image + JSON) to decentralized storage.
   * Returns the metadata URI for on-chain reference.
   */
  upload(metadata: NFTMetadata, image: string | Buffer, options?: MetadataUploadOptions): Promise<MetadataUploadResult>;

  /**
   * Batch upload metadata for multiple NFTs.
   * Optimizes by batching IPFS pins and Arweave uploads.
   */
  uploadBatch(
    items: Array<{ metadata: NFTMetadata; image: string | Buffer }>,
    options?: MetadataUploadOptions
  ): Promise<MetadataUploadResult[]>;

  /** Resolve a metadata URI to its full JSON content. */
  resolve(uri: string): Promise<NFTMetadata>;

  /** Pin existing metadata to ensure persistence. */
  pin(uri: string): Promise<void>;

  /** Unpin metadata (remove from IPFS pinning service). */
  unpin(uri: string): Promise<void>;

  /** Update off-chain metadata (re-upload with new content). */
  update(
    currentUri: string,
    updates: Partial<NFTMetadata>,
    newImage?: string | Buffer
  ): Promise<MetadataUploadResult>;

  /** Migrate metadata from one storage to another (e.g., IPFS → Arweave). */
  migrate(
    uri: string,
    targetStorage: MetadataStorageType
  ): Promise<MetadataUploadResult>;

  /** Validate metadata against Metaplex standards. */
  validate(metadata: NFTMetadata): ValidationResult;
}

interface MetadataUploadOptions {
  /** Storage type preference. */
  storageType?: MetadataStorageType;

  /** Upload to both IPFS and Arweave for redundancy. Default: false. */
  dualUpload?: boolean;

  /** Custom gateway URL for IPFS. */
  ipfsGateway?: string;

  /** Image optimization options. */
  imageOptimization?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'png' | 'jpg' | 'webp';
  };
}

interface MetadataUploadResult {
  /** Primary metadata URI. */
  uri: string;

  /** Image URI (separate from metadata JSON). */
  imageUri: string;

  /** Secondary URI (if dual upload). */
  secondaryUri?: string;

  /** Storage type used. */
  storageType: MetadataStorageType;

  /** Cost of storage in SOL (for Arweave) or USD (for IPFS pinning). */
  storageCost: number;

  /** Content hash for verification. */
  contentHash: string;
}
```

### CompressedMintConfig

```typescript
/**
 * Configuration for minting compressed NFTs (cNFTs) via the Bubblegum program.
 * Compressed NFTs use merkle trees to reduce cost by ~100x.
 */
interface CompressedMintConfig {
  /** Collection ID (must have a merkle tree created). */
  collectionId: string;

  /** NFT name. */
  name: string;

  /** NFT symbol. */
  symbol: string;

  /** Metadata URI (must be pre-uploaded). */
  metadataUri: string;

  /** Recipient wallet address. */
  recipientAddress: string;

  /** Creator shares. */
  creators: CreatorShare[];

  /** Seller fee basis points. */
  sellerFeeBasisPoints: number;

  /** Whether the metadata is mutable. */
  isMutable?: boolean;

  /** Venture ID. */
  ventureId: string;

  /** Idempotency key. */
  idempotencyKey?: string;
}

interface CompressedMintResult {
  /** The leaf index in the merkle tree (serves as cNFT identifier). */
  leafIndex: number;

  /** The asset ID (derived from tree + leaf index). */
  assetId: string;

  /** Transaction signature. */
  signature: string;

  /** The merkle tree address. */
  treeAddress: string;

  /** Explorer URL. */
  explorerUrl: string;

  /** Internal DB record ID. */
  recordId: string;

  /** Cost (just transaction fee, no rent). */
  cost: {
    fee: number;
    priorityFee: number;
    total: number;
  };
}

interface CompressedBatchOptions {
  /** Max NFTs per transaction. Default: 5 (Solana tx size limit). */
  perTransaction?: number;

  /** Max concurrent transactions. Default: 10. */
  concurrency?: number;

  /** Continue on individual failure. Default: true. */
  continueOnError?: boolean;

  /** Priority fee per transaction. */
  priorityFee?: number;

  /** Progress callback. */
  onProgress?: (progress: BatchProgress) => void;

  /** Delay between transaction batches in ms. Default: 100. */
  delayMs?: number;

  /** Retry config for failed transactions. */
  retry?: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
}

interface CompressedBatchMintResult {
  /** Total successfully minted. */
  minted: number;

  /** Total failed. */
  failed: number;

  /** Individual results. */
  results: Array<CompressedMintResult | { error: string; index: number }>;

  /** All transaction signatures. */
  signatures: string[];

  /** Total cost in SOL. */
  totalCost: number;

  /** Duration in milliseconds. */
  durationMs: number;
}

interface MerkleTreeConfig {
  /** Tree depth (14=16k, 17=131k, 20=1M, 24=16M, 30=1B). */
  maxDepth: number;

  /** Buffer size for concurrent writes. Recommended: 64-2048. */
  maxBufferSize: number;

  /** Canopy depth to cache on-chain (reduces proof size). Recommended: maxDepth - 5. */
  canopyDepth: number;
}

interface MerkleTreeResult {
  /** The merkle tree account address. */
  treeAddress: string;

  /** Transaction signature for tree creation. */
  signature: string;

  /** Maximum NFTs this tree can hold. */
  maxCapacity: number;

  /** Current number of leaves (NFTs). */
  currentCount: number;

  /** Cost to create the tree account (rent). */
  cost: number;

  /** Explorer URL. */
  explorerUrl: string;
}

interface CompressedNFTService {
  /** Create a new merkle tree for compressed NFTs. */
  createMerkleTree(collectionId: string, config: MerkleTreeConfig): Promise<MerkleTreeResult>;

  /** Mint a single compressed NFT. */
  mint(config: CompressedMintConfig): Promise<CompressedMintResult>;

  /** Batch mint compressed NFTs. */
  batchMint(configs: CompressedMintConfig[], options?: CompressedBatchOptions): Promise<CompressedBatchMintResult>;

  /** Transfer a compressed NFT. Requires merkle proof. */
  transfer(assetId: string, toAddress: string, ownerKeypair: Keypair): Promise<TransactionResult>;

  /** Get the merkle proof for a compressed NFT. */
  getProof(assetId: string): Promise<MerkleProof>;

  /** Verify a compressed NFT belongs to a collection. */
  verify(assetId: string, collectionId: string): Promise<boolean>;

  /** Get compressed NFT by asset ID using DAS (Digital Asset Standard) API. */
  getAsset(assetId: string): Promise<CompressedNFTAsset>;

  /** Get all compressed NFTs owned by a wallet. */
  getAssetsByOwner(ownerAddress: string, options?: PaginationOptions): Promise<PaginatedResult<CompressedNFTAsset>>;

  /** Burn a compressed NFT. */
  burn(assetId: string, ownerKeypair: Keypair): Promise<TransactionResult>;

  /** Get tree utilization stats. */
  getTreeStats(treeAddress: string): Promise<TreeStats>;
}
```

### GateConfig

```typescript
/**
 * NFT gate configuration.
 * Gates restrict access to features, content, or tiers based on NFT ownership.
 */
interface GateConfig {
  /** Unique gate identifier. */
  id: string;

  /** Human-readable gate name. */
  name: string;

  /** Description of what this gate protects. */
  description: string;

  /** Gate type determining the check logic. */
  type: GateType;

  /** Collection(s) that satisfy this gate. */
  collectionIds: string[];

  /** Minimum number of NFTs required. Default: 1. */
  minCount?: number;

  /** Specific attributes required (e.g., { "Tier": "Gold" }). */
  requiredAttributes?: Record<string, string | number | string[]>;

  /** Specific NFT mint addresses that satisfy this gate. */
  specificMints?: string[];

  /** Whether the gate checks compressed NFTs too. Default: true. */
  includeCompressed?: boolean;

  /** Venture this gate belongs to. */
  ventureId: string;

  /** Resource being gated (e.g., feature flag, content ID, tier name). */
  resource: string;

  /** Resource type. */
  resourceType: 'feature' | 'content' | 'tier' | 'endpoint' | 'custom';

  /** Whether the gate is currently active. */
  active: boolean;

  /** Optional time-based restrictions. */
  timeRestriction?: {
    /** Gate only active after this date. */
    startDate?: Date;
    /** Gate expires after this date. */
    endDate?: Date;
    /** Gate active during specific hours (UTC). */
    activeHours?: { start: number; end: number };
  };

  /** Cache TTL for gate check results in seconds. Default: 60. */
  cacheTtlSeconds?: number;
}

interface GateCheckResult {
  /** Whether the wallet passes the gate. */
  allowed: boolean;

  /** Reason for denial (if not allowed). */
  reason?: string;

  /** NFTs that satisfy the gate (if allowed). */
  satisfyingNFTs?: Array<{
    mintAddress: string;
    name: string;
    collection: string;
    isCompressed: boolean;
  }>;

  /** Gate config that was checked. */
  gate: GateConfig;

  /** Wallet that was checked. */
  walletAddress: string;

  /** When this result was computed. */
  checkedAt: Date;

  /** When this cached result expires. */
  expiresAt: Date;
}

interface NFTGateService {
  /** Create a new NFT gate. */
  create(config: Omit<GateConfig, 'id'>): Promise<GateConfig>;

  /** Update an existing gate. */
  update(gateId: string, updates: Partial<GateConfig>): Promise<GateConfig>;

  /** Delete a gate. */
  delete(gateId: string): Promise<void>;

  /** Check if a wallet passes a gate. */
  check(gateId: string, walletAddress: string): Promise<GateCheckResult>;

  /** Check multiple gates for a wallet. */
  checkMultiple(gateIds: string[], walletAddress: string): Promise<GateCheckResult[]>;

  /** Check all gates for a resource. */
  checkResource(resource: string, walletAddress: string): Promise<GateCheckResult>;

  /** List all gates for a venture. */
  listByVenture(ventureId: string): Promise<GateConfig[]>;

  /** List all gates for a resource. */
  listByResource(resource: string): Promise<GateConfig[]>;

  /** Get gate pass/fail audit log. */
  getAuditLog(gateId: string, options?: PaginationOptions): Promise<PaginatedResult<GateAuditEntry>>;

  /** Middleware factory for Express/Fastify route gating. */
  middleware(gateId: string): RequestHandler;

  /** Invalidate cached gate check for a wallet. */
  invalidateCache(gateId: string, walletAddress?: string): Promise<void>;
}

interface GateAuditEntry {
  id: string;
  gateId: string;
  walletAddress: string;
  allowed: boolean;
  reason?: string;
  satisfyingMints?: string[];
  checkedAt: Date;
  ip?: string;
  userAgent?: string;
}
```

### MembershipNFT

```typescript
/**
 * Membership NFT configuration and status.
 * NFTs that represent time-limited or perpetual membership with tier levels.
 */
interface MembershipNFTConfig {
  /** Collection to mint membership NFTs into. */
  collectionId: string;

  /** Membership tier. */
  tier: MembershipTier;

  /** Duration in days (null = perpetual). */
  durationDays?: number;

  /** Whether auto-renewal is enabled. */
  autoRenew: boolean;

  /** Renewal price in SOL. */
  renewalPriceSol?: number;

  /** Renewal price in USDC. */
  renewalPriceUsdc?: number;

  /** Benefits associated with this tier. */
  benefits: MembershipBenefit[];

  /** NFT metadata template for this tier. */
  metadataTemplate: Partial<NFTMetadata>;

  /** Whether the membership NFT updates its image based on status. */
  dynamicMetadata: boolean;

  /** Venture ID. */
  ventureId: string;

  /** Maximum members at this tier (null = unlimited). */
  maxMembers?: number;

  /** Whether tier upgrades are allowed. */
  upgradeEnabled: boolean;

  /** Tiers this can upgrade to. */
  upgradePaths?: MembershipTier[];

  /** Upgrade price differential in SOL. */
  upgradePriceSol?: Record<MembershipTier, number>;
}

interface MembershipStatus {
  /** Internal membership record ID. */
  id: string;

  /** The membership NFT mint address. */
  mintAddress: string;

  /** Owner wallet address. */
  ownerAddress: string;

  /** Current tier. */
  tier: MembershipTier;

  /** Whether the membership is currently active. */
  active: boolean;

  /** When the membership was issued. */
  issuedAt: Date;

  /** When the membership expires (null = perpetual). */
  expiresAt?: Date;

  /** When the membership was last renewed. */
  lastRenewedAt?: Date;

  /** Total number of renewals. */
  renewalCount: number;

  /** Whether auto-renewal is enabled. */
  autoRenew: boolean;

  /** Days until expiry. */
  daysRemaining?: number;

  /** Benefits currently available. */
  activeBenefits: MembershipBenefit[];

  /** Venture ID. */
  ventureId: string;

  /** Collection ID. */
  collectionId: string;

  /** History of tier changes. */
  tierHistory: Array<{
    from: MembershipTier;
    to: MembershipTier;
    changedAt: Date;
    reason: string;
  }>;
}

interface MembershipBenefit {
  /** Benefit identifier. */
  id: string;

  /** Human-readable name. */
  name: string;

  /** Description. */
  description: string;

  /** Benefit type. */
  type: 'feature_access' | 'discount' | 'priority' | 'exclusive_content' | 'airdrop' | 'custom';

  /** Typed value (e.g., discount percentage, feature flag name). */
  value: string | number | boolean;

  /** Associated gate ID (if this benefit maps to an NFT gate). */
  gateId?: string;
}

interface MembershipNFTService {
  /** Issue a new membership NFT. */
  issue(
    recipientAddress: string,
    config: MembershipNFTConfig,
    paymentSignature?: string
  ): Promise<MembershipIssueResult>;

  /** Renew an existing membership. */
  renew(
    mintAddress: string,
    paymentSignature?: string
  ): Promise<MembershipRenewResult>;

  /** Upgrade a membership to a higher tier. */
  upgrade(
    mintAddress: string,
    newTier: MembershipTier,
    paymentSignature?: string
  ): Promise<MembershipUpgradeResult>;

  /** Get membership status by mint address. */
  getStatus(mintAddress: string): Promise<MembershipStatus>;

  /** Get membership status by owner wallet. */
  getByOwner(ownerAddress: string, ventureId?: string): Promise<MembershipStatus[]>;

  /** Check if a wallet has active membership at a given tier or above. */
  checkMembership(
    walletAddress: string,
    minimumTier: MembershipTier,
    ventureId: string
  ): Promise<MembershipCheckResult>;

  /** Revoke a membership (admin action). */
  revoke(mintAddress: string, reason: string): Promise<void>;

  /** Process expired memberships (cron job). */
  processExpirations(): Promise<ExpirationProcessResult>;

  /** Process auto-renewals (cron job). */
  processAutoRenewals(): Promise<AutoRenewalProcessResult>;

  /** Get membership analytics. */
  getAnalytics(ventureId: string, period?: DateRange): Promise<MembershipAnalytics>;

  /** Configure membership tiers for a venture. */
  configureTiers(ventureId: string, tiers: MembershipNFTConfig[]): Promise<void>;
}

interface MembershipIssueResult {
  membership: MembershipStatus;
  mintResult: MintResult;
  gatesCreated: string[];
}

interface MembershipCheckResult {
  /** Whether the wallet has valid membership at the required tier. */
  hasAccess: boolean;

  /** The wallet's current membership (if any). */
  currentMembership?: MembershipStatus;

  /** The minimum tier required. */
  requiredTier: MembershipTier;

  /** Whether the membership is expired but renewable. */
  expiredButRenewable?: boolean;
}
```

### RoyaltyConfig

```typescript
/**
 * Royalty configuration for NFT collections.
 * Supports standard royalties and programmable NFT enforced royalties.
 */
interface RoyaltyConfig {
  /** Internal config ID. */
  id: string;

  /** Collection this royalty config applies to. */
  collectionId: string;

  /** Seller fee basis points (0-10000). */
  sellerFeeBasisPoints: number;

  /** Enforcement mode. */
  enforcement: RoyaltyEnforcementMode;

  /** Distribution of royalties among creators. */
  distribution: RoyaltyDistribution[];

  /** Whether to use a rule set for programmable NFTs. */
  useRuleSet: boolean;

  /** Rule set address (for programmable NFTs). */
  ruleSetAddress?: string;

  /** Allowed programs that can transfer without paying royalties. */
  allowedPrograms?: string[];

  /** Denied programs that cannot interact with these NFTs. */
  deniedPrograms?: string[];

  /** Timestamps. */
  createdAt: Date;
  updatedAt: Date;
}

interface RoyaltyDistribution {
  /** Creator wallet address. */
  creatorAddress: string;

  /** Percentage of royalties (0-100, must sum to 100 across all creators). */
  percentage: number;

  /** Human-readable label. */
  label?: string;
}

interface RoyaltyService {
  /** Configure royalties for a collection. */
  configure(collectionId: string, config: Omit<RoyaltyConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoyaltyConfig>;

  /** Update royalty configuration. */
  update(configId: string, updates: Partial<RoyaltyConfig>): Promise<RoyaltyConfig>;

  /** Get royalty config for a collection. */
  getByCollection(collectionId: string): Promise<RoyaltyConfig | null>;

  /** Create a rule set for programmable NFT royalty enforcement. */
  createRuleSet(config: RuleSetConfig): Promise<RuleSetResult>;

  /** Audit royalty payments for a collection. */
  auditPayments(collectionId: string, period: DateRange): Promise<RoyaltyAuditResult>;

  /** Get total royalties earned by a creator. */
  getCreatorEarnings(creatorAddress: string, period?: DateRange): Promise<CreatorEarnings>;

  /** Distribute accumulated royalties to creators. */
  distribute(collectionId: string): Promise<DistributionResult>;
}

enum RoyaltyEnforcementMode {
  /** Standard royalties (honored by marketplaces voluntarily). */
  STANDARD = 'standard',

  /** Programmable NFTs with enforced royalties via rule set. */
  PROGRAMMABLE = 'programmable',

  /** No royalties. */
  NONE = 'none'
}
```

### BurnConfig

```typescript
/**
 * Configuration for NFT burn mechanics.
 * Supports burn-for-reward, burn-to-upgrade, and deflationary burns.
 */
interface BurnConfig {
  /** Internal config ID. */
  id: string;

  /** Collection this burn config applies to. */
  collectionId: string;

  /** Whether burning is enabled. */
  enabled: boolean;

  /** Type of burn mechanic. */
  mechanic: BurnMechanic;

  /** Rewards given for burning. */
  rewards?: BurnReward[];

  /** Minimum NFTs required to burn at once. Default: 1. */
  minBurnCount?: number;

  /** Maximum NFTs that can be burned at once. Default: 10. */
  maxBurnCount?: number;

  /** Required attributes to be eligible for burning. */
  requiredAttributes?: Record<string, string | number | string[]>;

  /** Time window when burning is allowed. */
  burnWindow?: {
    startDate?: Date;
    endDate?: Date;
  };

  /** Total burns allowed (null = unlimited). */
  maxTotalBurns?: number;

  /** Current total burns. */
  currentTotalBurns: number;

  /** Venture ID. */
  ventureId: string;
}

interface BurnReward {
  /** Reward type. */
  type: BurnRewardType;

  /** Reward value (amount, NFT config, token amount, etc.). */
  value: string | number;

  /** Probability of receiving this reward (0-1, for random rewards). Default: 1. */
  probability?: number;

  /** Additional reward configuration. */
  config?: Record<string, unknown>;
}

enum BurnRewardType {
  /** Receive SOL. */
  SOL = 'sol',

  /** Receive SPL tokens. */
  TOKEN = 'token',

  /** Receive a new NFT (burn-to-upgrade). */
  NFT = 'nft',

  /** Receive points/XP in venture system. */
  POINTS = 'points',

  /** Unlock a feature or content. */
  ACCESS = 'access',

  /** Whitelist for future mint. */
  WHITELIST = 'whitelist',

  /** No reward (deflationary burn). */
  NONE = 'none'
}

enum BurnMechanic {
  /** Burn for immediate reward. */
  REWARD = 'reward',

  /** Burn to upgrade to a higher-tier NFT. */
  UPGRADE = 'upgrade',

  /** Burn multiple to combine into one. */
  COMBINE = 'combine',

  /** Deflationary burn (no reward, reduces supply). */
  DEFLATIONARY = 'deflationary',

  /** Seasonal/event burn with time-limited rewards. */
  EVENT = 'event'
}

interface BurnResult {
  /** Burn record ID. */
  id: string;

  /** NFT mint address that was burned. */
  mintAddress: string;

  /** Burn transaction signature. */
  signature: string;

  /** Rewards granted. */
  rewards: Array<{
    type: BurnRewardType;
    value: string | number;
    /** Transaction signature for reward delivery (if applicable). */
    deliverySignature?: string;
    /** New NFT mint address (if reward type is NFT). */
    newMintAddress?: string;
  }>;

  /** Explorer URL. */
  explorerUrl: string;

  /** Timestamp. */
  burnedAt: Date;
}

interface BurnService {
  /** Configure burn mechanics for a collection. */
  configure(config: Omit<BurnConfig, 'id' | 'currentTotalBurns'>): Promise<BurnConfig>;

  /** Update burn configuration. */
  update(configId: string, updates: Partial<BurnConfig>): Promise<BurnConfig>;

  /** Burn an NFT with optional reward. */
  burn(mintAddress: string, ownerKeypair: Keypair, burnConfigId?: string): Promise<BurnResult>;

  /** Batch burn multiple NFTs. */
  batchBurn(
    mintAddresses: string[],
    ownerKeypair: Keypair,
    burnConfigId?: string
  ): Promise<BatchBurnResult>;

  /** Check if an NFT is eligible for burning under a config. */
  checkEligibility(mintAddress: string, burnConfigId: string): Promise<BurnEligibility>;

  /** Get burn history for a collection. */
  getBurnHistory(collectionId: string, options?: PaginationOptions): Promise<PaginatedResult<BurnRecord>>;

  /** Get burn stats for a collection. */
  getBurnStats(collectionId: string): Promise<BurnStats>;

  /** Get burn config for a collection. */
  getConfig(collectionId: string): Promise<BurnConfig | null>;
}
```

### NFTAnalyticsSnapshot

```typescript
/**
 * Point-in-time analytics snapshot for an NFT collection.
 */
interface NFTAnalyticsSnapshot {
  /** Snapshot ID. */
  id: string;

  /** Collection ID. */
  collectionId: string;

  /** When this snapshot was taken. */
  timestamp: Date;

  /** Floor price in SOL. */
  floorPriceSol: number;

  /** Floor price in USD. */
  floorPriceUsd: number;

  /** Average sale price in SOL (24h). */
  avgPriceSol24h: number;

  /** Total trading volume in SOL (24h). */
  volumeSol24h: number;

  /** Total trading volume in SOL (7d). */
  volumeSol7d: number;

  /** Total trading volume in SOL (all time). */
  volumeSolAllTime: number;

  /** Number of sales (24h). */
  salesCount24h: number;

  /** Number of sales (7d). */
  salesCount7d: number;

  /** Unique holders count. */
  uniqueHolders: number;

  /** Total supply (minted - burned). */
  totalSupply: number;

  /** Listed count across marketplaces. */
  listedCount: number;

  /** Listed percentage. */
  listedPercentage: number;

  /** Holder distribution. */
  holderDistribution: HolderDistribution;

  /** Top holders. */
  topHolders: Array<{
    address: string;
    count: number;
    percentage: number;
  }>;

  /** Price history data points. */
  priceHistory: Array<{
    timestamp: Date;
    price: number;
    volume: number;
  }>;

  /** Marketplace breakdown. */
  marketplaceBreakdown: Array<{
    marketplace: MarketplaceProvider;
    listedCount: number;
    volumeSol24h: number;
    floorPrice: number;
  }>;
}

interface HolderDistribution {
  /** Holders with 1 NFT. */
  single: number;

  /** Holders with 2-5 NFTs. */
  small: number;

  /** Holders with 6-20 NFTs. */
  medium: number;

  /** Holders with 21-100 NFTs. */
  large: number;

  /** Holders with 100+ NFTs. */
  whale: number;
}

interface NFTAnalyticsService {
  /** Take a snapshot of collection analytics. */
  snapshot(collectionId: string): Promise<NFTAnalyticsSnapshot>;

  /** Get the latest snapshot for a collection. */
  getLatest(collectionId: string): Promise<NFTAnalyticsSnapshot | null>;

  /** Get historical snapshots for a collection. */
  getHistory(
    collectionId: string,
    period: DateRange,
    interval?: 'hourly' | 'daily' | 'weekly'
  ): Promise<NFTAnalyticsSnapshot[]>;

  /** Get current floor price for a collection. */
  getFloorPrice(collectionId: string): Promise<{ sol: number; usd: number }>;

  /** Get holder distribution for a collection. */
  getHolderDistribution(collectionId: string): Promise<HolderDistribution>;

  /** Get trading volume for a collection. */
  getVolume(collectionId: string, period: DateRange): Promise<VolumeData>;

  /** Get top holders for a collection. */
  getTopHolders(collectionId: string, limit?: number): Promise<Array<{ address: string; count: number }>>;

  /** Get price history for a collection. */
  getPriceHistory(collectionId: string, period: DateRange): Promise<PriceHistoryData>;

  /** Schedule periodic snapshot collection (cron). */
  scheduleSnapshots(collectionId: string, intervalMinutes: number): Promise<void>;

  /** Get cross-collection analytics for a venture. */
  getVentureAnalytics(ventureId: string): Promise<VentureNFTAnalytics>;
}
```

### MarketplaceListing

```typescript
/**
 * Marketplace listing configuration and status.
 */
interface MarketplaceListing {
  /** Internal listing ID. */
  id: string;

  /** NFT mint address. */
  mintAddress: string;

  /** Collection ID. */
  collectionId: string;

  /** Marketplace provider. */
  marketplace: MarketplaceProvider;

  /** Listing price in SOL. */
  priceSol: number;

  /** Listing price in USD (at time of listing). */
  priceUsd: number;

  /** Seller wallet address. */
  sellerAddress: string;

  /** Marketplace listing ID/URL. */
  marketplaceListingId: string;

  /** Direct URL to the listing on the marketplace. */
  listingUrl: string;

  /** Status. */
  status: 'active' | 'sold' | 'cancelled' | 'expired';

  /** When the listing was created. */
  listedAt: Date;

  /** When the listing was sold (if applicable). */
  soldAt?: Date;

  /** Buyer address (if sold). */
  buyerAddress?: string;

  /** Sale transaction signature (if sold). */
  saleSignature?: string;

  /** When the listing expires. */
  expiresAt?: Date;
}

enum MarketplaceProvider {
  MAGIC_EDEN = 'magic_eden',
  TENSOR = 'tensor',
  HYPERSPACE = 'hyperspace',
  EXCHANGE_ART = 'exchange_art'
}

interface MarketplaceService {
  /** List an NFT on a marketplace. */
  list(mintAddress: string, config: ListingConfig): Promise<MarketplaceListing>;

  /** List on multiple marketplaces simultaneously. */
  listMultiple(mintAddress: string, configs: ListingConfig[]): Promise<MarketplaceListing[]>;

  /** Delist an NFT from a marketplace. */
  delist(listingId: string): Promise<void>;

  /** Delist from all marketplaces. */
  delistAll(mintAddress: string): Promise<void>;

  /** Update listing price. */
  updatePrice(listingId: string, newPriceSol: number): Promise<MarketplaceListing>;

  /** Get active listings for an NFT. */
  getListings(mintAddress: string): Promise<MarketplaceListing[]>;

  /** Get all listings for a collection. */
  getCollectionListings(
    collectionId: string,
    options?: MarketplaceQueryOptions
  ): Promise<PaginatedResult<MarketplaceListing>>;

  /** Get listing activity (sales, listings, delistings). */
  getActivity(
    collectionId: string,
    options?: ActivityQueryOptions
  ): Promise<PaginatedResult<MarketplaceActivity>>;

  /** Sync listing status with marketplace APIs. */
  syncListings(collectionId: string): Promise<SyncResult>;

  /** Get best price across marketplaces for an NFT. */
  getBestPrice(mintAddress: string): Promise<{ marketplace: MarketplaceProvider; priceSol: number } | null>;
}

interface ListingConfig {
  /** Marketplace to list on. */
  marketplace: MarketplaceProvider;

  /** Listing price in SOL. */
  priceSol: number;

  /** Seller keypair for signing the listing transaction. */
  sellerKeypair: Keypair;

  /** Listing expiry duration in days. */
  expiryDays?: number;
}
```

---

## Enums

```typescript
enum NFTStandard {
  /** Standard Metaplex NFT (NonFungible). */
  STANDARD = 'standard',

  /** Programmable NFT with enforced royalties. */
  PROGRAMMABLE = 'programmable',

  /** Compressed NFT via Bubblegum. */
  COMPRESSED = 'compressed',

  /** Fungible asset (semi-fungible, edition prints). */
  FUNGIBLE_ASSET = 'fungible_asset'
}

enum MetadataStorageType {
  /** IPFS via Pinata or nft.storage. */
  IPFS = 'ipfs',

  /** Arweave via Irys (formerly Bundlr). */
  ARWEAVE = 'arweave',

  /** Shadow Drive (Solana-native storage). */
  SHADOW_DRIVE = 'shadow_drive',

  /** AWS S3 (centralized, for dev/staging). */
  S3 = 's3'
}

enum GateType {
  /** Must own any NFT from the collection(s). */
  COLLECTION_OWNERSHIP = 'collection_ownership',

  /** Must own a specific number of NFTs. */
  COUNT_THRESHOLD = 'count_threshold',

  /** Must own NFT with specific attributes. */
  ATTRIBUTE_MATCH = 'attribute_match',

  /** Must own specific NFT mint(s). */
  SPECIFIC_MINT = 'specific_mint',

  /** Combined conditions (AND logic). */
  COMPOSITE_AND = 'composite_and',

  /** Combined conditions (OR logic). */
  COMPOSITE_OR = 'composite_or',

  /** Must hold membership NFT at required tier. */
  MEMBERSHIP_TIER = 'membership_tier'
}

enum MembershipTier {
  /** Basic membership. */
  BRONZE = 'bronze',

  /** Standard membership. */
  SILVER = 'silver',

  /** Premium membership. */
  GOLD = 'gold',

  /** Elite membership. */
  PLATINUM = 'platinum',

  /** Exclusive/founders membership. */
  DIAMOND = 'diamond'
}
```

---

## Database Schemas

### nft_collections

```typescript
import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const nftStandardEnum = pgEnum('nft_standard', [
  'standard',
  'programmable',
  'compressed',
  'fungible_asset'
]);

export const royaltyEnforcementEnum = pgEnum('royalty_enforcement_mode', [
  'standard',
  'programmable',
  'none'
]);

export const solanaClusterEnum = pgEnum('solana_cluster', [
  'mainnet-beta',
  'devnet',
  'testnet',
  'localnet'
]);

export const nftCollections = pgTable('nft_collections', {
  /** Primary key. */
  id: uuid('id').defaultRandom().primaryKey(),

  /** On-chain collection NFT mint address. */
  mintAddress: varchar('mint_address', { length: 64 }).notNull().unique(),

  /** Collection name. */
  name: varchar('name', { length: 128 }).notNull(),

  /** Collection symbol. */
  symbol: varchar('symbol', { length: 16 }).notNull(),

  /** Description. */
  description: text('description').notNull(),

  /** Collection image URI. */
  imageUri: text('image_uri').notNull(),

  /** External URL. */
  externalUrl: text('external_url'),

  /** Default seller fee basis points. */
  sellerFeeBasisPoints: integer('seller_fee_basis_points').notNull().default(500),

  /** Creator shares JSON array. */
  creators: jsonb('creators').notNull().$type<CreatorShare[]>(),

  /** Collection authority public key. */
  authority: varchar('authority', { length: 64 }).notNull(),

  /** Update authority public key. */
  updateAuthority: varchar('update_authority', { length: 64 }).notNull(),

  /** Whether metadata is mutable. */
  isMutable: boolean('is_mutable').notNull().default(true),

  /** NFT standard for items in this collection. */
  standard: nftStandardEnum('standard').notNull().default('standard'),

  /** Merkle tree address (for compressed NFT collections). */
  merkleTreeAddress: varchar('merkle_tree_address', { length: 64 }),

  /** Merkle tree max depth. */
  merkleTreeDepth: integer('merkle_tree_depth'),

  /** Merkle tree max buffer size. */
  merkleTreeBufferSize: integer('merkle_tree_buffer_size'),

  /** Merkle tree canopy depth. */
  merkleTreeCanopyDepth: integer('merkle_tree_canopy_depth'),

  /** Total NFTs minted in this collection. */
  totalMinted: integer('total_minted').notNull().default(0),

  /** Total NFTs burned in this collection. */
  totalBurned: integer('total_burned').notNull().default(0),

  /** Maximum supply (null = unlimited). */
  maxSupply: integer('max_supply'),

  /** Venture that owns this collection. */
  ventureId: varchar('venture_id', { length: 64 }).notNull(),

  /** Whether minting is currently enabled. */
  mintingEnabled: boolean('minting_enabled').notNull().default(true),

  /** Royalty enforcement mode. */
  royaltyEnforcement: royaltyEnforcementEnum('royalty_enforcement').notNull().default('standard'),

  /** Collection-level metadata URI. */
  metadataUri: text('metadata_uri').notNull(),

  /** Solana cluster. */
  cluster: solanaClusterEnum('cluster').notNull().default('mainnet-beta'),

  /** When the collection was created. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** When the collection was last updated. */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_nft_collections_venture ON nft_collections(venture_id);
// CREATE INDEX idx_nft_collections_authority ON nft_collections(authority);
// CREATE INDEX idx_nft_collections_cluster ON nft_collections(cluster);
```

### nfts

```typescript
export const nftTypeEnum = pgEnum('nft_type', [
  'standard',
  'programmable',
  'compressed'
]);

export const nftStatusEnum = pgEnum('nft_status', [
  'minted',
  'listed',
  'transferred',
  'burned',
  'frozen'
]);

export const nfts = pgTable('nfts', {
  /** Primary key. */
  id: uuid('id').defaultRandom().primaryKey(),

  /** On-chain mint address (for standard NFTs) or asset ID (for compressed). */
  mintAddress: varchar('mint_address', { length: 128 }).notNull().unique(),

  /** Collection this NFT belongs to. */
  collectionId: uuid('collection_id').notNull().references(() => nftCollections.id),

  /** NFT name. */
  name: varchar('name', { length: 64 }).notNull(),

  /** NFT symbol. */
  symbol: varchar('symbol', { length: 16 }).notNull(),

  /** NFT type. */
  type: nftTypeEnum('type').notNull().default('standard'),

  /** Current status. */
  status: nftStatusEnum('status').notNull().default('minted'),

  /** Current owner wallet address. */
  ownerAddress: varchar('owner_address', { length: 64 }).notNull(),

  /** Metadata URI. */
  metadataUri: text('metadata_uri').notNull(),

  /** Seller fee basis points. */
  sellerFeeBasisPoints: integer('seller_fee_basis_points').notNull(),

  /** Creator shares. */
  creators: jsonb('creators').notNull().$type<CreatorShare[]>(),

  /** Mint transaction signature. */
  mintSignature: varchar('mint_signature', { length: 128 }).notNull(),

  /** Merkle tree leaf index (for compressed NFTs). */
  leafIndex: integer('leaf_index'),

  /** Merkle tree address (for compressed NFTs). */
  treeAddress: varchar('tree_address', { length: 64 }),

  /** Whether the NFT is frozen (transfers disabled). */
  isFrozen: boolean('is_frozen').notNull().default(false),

  /** Whether the metadata is mutable. */
  isMutable: boolean('is_mutable').notNull().default(true),

  /** Venture ID for cross-venture tracking. */
  ventureId: varchar('venture_id', { length: 64 }).notNull(),

  /** Idempotency key to prevent duplicate mints. */
  idempotencyKey: varchar('idempotency_key', { length: 128 }).unique(),

  /** Solana cluster. */
  cluster: solanaClusterEnum('cluster').notNull().default('mainnet-beta'),

  /** When the NFT was minted. */
  mintedAt: timestamp('minted_at', { withTimezone: true }).notNull().defaultNow(),

  /** When the NFT was last transferred. */
  lastTransferAt: timestamp('last_transfer_at', { withTimezone: true }),

  /** When the NFT was burned (if applicable). */
  burnedAt: timestamp('burned_at', { withTimezone: true }),

  /** Creation timestamp. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Last update timestamp. */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_nfts_collection ON nfts(collection_id);
// CREATE INDEX idx_nfts_owner ON nfts(owner_address);
// CREATE INDEX idx_nfts_status ON nfts(status);
// CREATE INDEX idx_nfts_type ON nfts(type);
// CREATE INDEX idx_nfts_venture ON nfts(venture_id);
// CREATE INDEX idx_nfts_idempotency ON nfts(idempotency_key) WHERE idempotency_key IS NOT NULL;
// CREATE INDEX idx_nfts_minted_at ON nfts(minted_at);
```

### nft_metadata

```typescript
export const metadataStorageEnum = pgEnum('metadata_storage_type', [
  'ipfs',
  'arweave',
  'shadow_drive',
  's3'
]);

export const nftMetadata = pgTable('nft_metadata', {
  /** Primary key. */
  id: uuid('id').defaultRandom().primaryKey(),

  /** NFT this metadata belongs to. */
  nftId: uuid('nft_id').notNull().references(() => nfts.id).unique(),

  /** Primary metadata URI. */
  uri: text('uri').notNull(),

  /** Secondary/backup metadata URI. */
  secondaryUri: text('secondary_uri'),

  /** Image URI. */
  imageUri: text('image_uri').notNull(),

  /** Animation URL (video, 3D, etc.). */
  animationUrl: text('animation_url'),

  /** External URL. */
  externalUrl: text('external_url'),

  /** Storage type. */
  storageType: metadataStorageEnum('storage_type').notNull(),

  /** Full metadata JSON (cached copy of off-chain data). */
  metadataJson: jsonb('metadata_json').notNull().$type<NFTMetadata>(),

  /** Attributes extracted for indexing. */
  attributes: jsonb('attributes').notNull().$type<NFTAttribute[]>(),

  /** Content hash for integrity verification. */
  contentHash: varchar('content_hash', { length: 128 }).notNull(),

  /** Image content hash. */
  imageContentHash: varchar('image_content_hash', { length: 128 }),

  /** File size in bytes. */
  metadataSize: integer('metadata_size'),

  /** Image file size in bytes. */
  imageSize: integer('image_size'),

  /** Whether the metadata has been pinned/verified accessible. */
  verified: boolean('verified').notNull().default(false),

  /** Last time the metadata URI was verified accessible. */
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),

  /** Creation timestamp. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Last update timestamp. */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_nft_metadata_nft ON nft_metadata(nft_id);
// CREATE INDEX idx_nft_metadata_storage ON nft_metadata(storage_type);
// CREATE INDEX idx_nft_metadata_attributes ON nft_metadata USING GIN (attributes);
```

### nft_gates

```typescript
export const gateTypeEnum = pgEnum('gate_type', [
  'collection_ownership',
  'count_threshold',
  'attribute_match',
  'specific_mint',
  'composite_and',
  'composite_or',
  'membership_tier'
]);

export const resourceTypeEnum = pgEnum('resource_type', [
  'feature',
  'content',
  'tier',
  'endpoint',
  'custom'
]);

export const nftGates = pgTable('nft_gates', {
  /** Primary key. */
  id: uuid('id').defaultRandom().primaryKey(),

  /** Gate name. */
  name: varchar('name', { length: 128 }).notNull(),

  /** Description. */
  description: text('description'),

  /** Gate type. */
  type: gateTypeEnum('type').notNull(),

  /** Collection IDs that satisfy this gate. */
  collectionIds: jsonb('collection_ids').notNull().$type<string[]>(),

  /** Minimum NFT count required. */
  minCount: integer('min_count').notNull().default(1),

  /** Required attributes (JSON). */
  requiredAttributes: jsonb('required_attributes').$type<Record<string, string | number | string[]>>(),

  /** Specific mint addresses. */
  specificMints: jsonb('specific_mints').$type<string[]>(),

  /** Whether to include compressed NFTs. */
  includeCompressed: boolean('include_compressed').notNull().default(true),

  /** Venture ID. */
  ventureId: varchar('venture_id', { length: 64 }).notNull(),

  /** Resource being gated. */
  resource: varchar('resource', { length: 256 }).notNull(),

  /** Resource type. */
  resourceType: resourceTypeEnum('resource_type').notNull(),

  /** Whether the gate is active. */
  active: boolean('active').notNull().default(true),

  /** Time restriction configuration. */
  timeRestriction: jsonb('time_restriction').$type<{
    startDate?: string;
    endDate?: string;
    activeHours?: { start: number; end: number };
  }>(),

  /** Cache TTL in seconds. */
  cacheTtlSeconds: integer('cache_ttl_seconds').notNull().default(60),

  /** Creation timestamp. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Last update timestamp. */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_nft_gates_venture ON nft_gates(venture_id);
// CREATE INDEX idx_nft_gates_resource ON nft_gates(resource);
// CREATE INDEX idx_nft_gates_active ON nft_gates(active) WHERE active = true;
// CREATE INDEX idx_nft_gates_type ON nft_gates(type);
```

### membership_nfts

```typescript
export const membershipTierEnum = pgEnum('membership_tier', [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond'
]);

export const membershipStatusEnum = pgEnum('membership_status', [
  'active',
  'expired',
  'revoked',
  'pending_renewal'
]);

export const membershipNfts = pgTable('membership_nfts', {
  /** Primary key. */
  id: uuid('id').defaultRandom().primaryKey(),

  /** NFT record (references nfts table). */
  nftId: uuid('nft_id').notNull().references(() => nfts.id).unique(),

  /** NFT mint address (denormalized for quick lookups). */
  mintAddress: varchar('mint_address', { length: 128 }).notNull().unique(),

  /** Collection ID. */
  collectionId: uuid('collection_id').notNull().references(() => nftCollections.id),

  /** Current owner wallet address. */
  ownerAddress: varchar('owner_address', { length: 64 }).notNull(),

  /** Membership tier. */
  tier: membershipTierEnum('tier').notNull(),

  /** Membership status. */
  status: membershipStatusEnum('status').notNull().default('active'),

  /** When the membership was issued. */
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),

  /** When the membership expires (null = perpetual). */
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  /** When the membership was last renewed. */
  lastRenewedAt: timestamp('last_renewed_at', { withTimezone: true }),

  /** Total number of renewals. */
  renewalCount: integer('renewal_count').notNull().default(0),

  /** Whether auto-renewal is enabled. */
  autoRenew: boolean('auto_renew').notNull().default(false),

  /** Benefits JSON array. */
  benefits: jsonb('benefits').notNull().$type<MembershipBenefit[]>(),

  /** Tier change history. */
  tierHistory: jsonb('tier_history').notNull().$type<Array<{
    from: string;
    to: string;
    changedAt: string;
    reason: string;
  }>>().default([]),

  /** Venture ID. */
  ventureId: varchar('venture_id', { length: 64 }).notNull(),

  /** Revocation reason (if revoked). */
  revocationReason: text('revocation_reason'),

  /** Payment signatures for renewals. */
  paymentHistory: jsonb('payment_history').$type<Array<{
    signature: string;
    amount: number;
    currency: string;
    date: string;
    type: 'initial' | 'renewal' | 'upgrade';
  }>>().default([]),

  /** Creation timestamp. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Last update timestamp. */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_membership_nfts_owner ON membership_nfts(owner_address);
// CREATE INDEX idx_membership_nfts_status ON membership_nfts(status);
// CREATE INDEX idx_membership_nfts_tier ON membership_nfts(tier);
// CREATE INDEX idx_membership_nfts_venture ON membership_nfts(venture_id);
// CREATE INDEX idx_membership_nfts_expires ON membership_nfts(expires_at) WHERE expires_at IS NOT NULL;
// CREATE INDEX idx_membership_nfts_auto_renew ON membership_nfts(auto_renew) WHERE auto_renew = true AND status = 'active';
```

### royalty_configs

```typescript
export const royaltyConfigs = pgTable('royalty_configs', {
  /** Primary key. */
  id: uuid('id').defaultRandom().primaryKey(),

  /** Collection this config applies to. */
  collectionId: uuid('collection_id').notNull().references(() => nftCollections.id).unique(),

  /** Seller fee basis points. */
  sellerFeeBasisPoints: integer('seller_fee_basis_points').notNull(),

  /** Enforcement mode. */
  enforcement: royaltyEnforcementEnum('enforcement').notNull().default('standard'),

  /** Royalty distribution shares. */
  distribution: jsonb('distribution').notNull().$type<RoyaltyDistribution[]>(),

  /** Whether to use a rule set. */
  useRuleSet: boolean('use_rule_set').notNull().default(false),

  /** Rule set address. */
  ruleSetAddress: varchar('rule_set_address', { length: 64 }),

  /** Allowed programs (can bypass royalties). */
  allowedPrograms: jsonb('allowed_programs').$type<string[]>(),

  /** Denied programs. */
  deniedPrograms: jsonb('denied_programs').$type<string[]>(),

  /** Total royalties collected in SOL. */
  totalCollectedSol: integer('total_collected_sol').notNull().default(0),

  /** Total royalties distributed in SOL. */
  totalDistributedSol: integer('total_distributed_sol').notNull().default(0),

  /** Creation timestamp. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Last update timestamp. */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_royalty_configs_collection ON royalty_configs(collection_id);
// CREATE INDEX idx_royalty_configs_enforcement ON royalty_configs(enforcement);
```

### nft_burns

```typescript
export const burnMechanicEnum = pgEnum('burn_mechanic', [
  'reward',
  'upgrade',
  'combine',
  'deflationary',
  'event'
]);

export const nftBurns = pgTable('nft_burns', {
  /** Primary key. */
  id: uuid('id').defaultRandom().primaryKey(),

  /** NFT that was burned (references nfts table). */
  nftId: uuid('nft_id').notNull().references(() => nfts.id),

  /** Mint address (denormalized). */
  mintAddress: varchar('mint_address', { length: 128 }).notNull(),

  /** Collection ID. */
  collectionId: uuid('collection_id').notNull().references(() => nftCollections.id),

  /** Wallet that burned the NFT. */
  burnerAddress: varchar('burner_address', { length: 64 }).notNull(),

  /** Burn transaction signature. */
  burnSignature: varchar('burn_signature', { length: 128 }).notNull(),

  /** Burn mechanic used. */
  mechanic: burnMechanicEnum('mechanic').notNull(),

  /** Rewards granted. */
  rewards: jsonb('rewards').$type<Array<{
    type: string;
    value: string | number;
    deliverySignature?: string;
    newMintAddress?: string;
  }>>(),

  /** Burn config ID that was used. */
  burnConfigId: uuid('burn_config_id'),

  /** Venture ID. */
  ventureId: varchar('venture_id', { length: 64 }).notNull(),

  /** When the burn occurred. */
  burnedAt: timestamp('burned_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_nft_burns_collection ON nft_burns(collection_id);
// CREATE INDEX idx_nft_burns_burner ON nft_burns(burner_address);
// CREATE INDEX idx_nft_burns_mechanic ON nft_burns(mechanic);
// CREATE INDEX idx_nft_burns_venture ON nft_burns(venture_id);
// CREATE INDEX idx_nft_burns_burned_at ON nft_burns(burned_at);
```

### nft_analytics_snapshots

```typescript
export const nftAnalyticsSnapshots = pgTable('nft_analytics_snapshots', {
  /** Primary key. */
  id: uuid('id').defaultRandom().primaryKey(),

  /** Collection ID. */
  collectionId: uuid('collection_id').notNull().references(() => nftCollections.id),

  /** Snapshot timestamp. */
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),

  /** Floor price in lamports (1 SOL = 1B lamports). */
  floorPriceLamports: integer('floor_price_lamports'),

  /** Floor price in USD cents. */
  floorPriceUsdCents: integer('floor_price_usd_cents'),

  /** Average sale price in lamports (24h). */
  avgPriceLamports24h: integer('avg_price_lamports_24h'),

  /** Trading volume in lamports (24h). */
  volumeLamports24h: integer('volume_lamports_24h'),

  /** Trading volume in lamports (7d). */
  volumeLamports7d: integer('volume_lamports_7d'),

  /** Trading volume in lamports (all time). */
  volumeLamportsAllTime: integer('volume_lamports_all_time'),

  /** Number of sales (24h). */
  salesCount24h: integer('sales_count_24h').notNull().default(0),

  /** Number of sales (7d). */
  salesCount7d: integer('sales_count_7d').notNull().default(0),

  /** Unique holder count. */
  uniqueHolders: integer('unique_holders').notNull().default(0),

  /** Total supply (minted - burned). */
  totalSupply: integer('total_supply').notNull().default(0),

  /** Listed count. */
  listedCount: integer('listed_count').notNull().default(0),

  /** Holder distribution breakdown. */
  holderDistribution: jsonb('holder_distribution').$type<HolderDistribution>(),

  /** Top holders. */
  topHolders: jsonb('top_holders').$type<Array<{
    address: string;
    count: number;
    percentage: number;
  }>>(),

  /** Marketplace breakdown. */
  marketplaceBreakdown: jsonb('marketplace_breakdown').$type<Array<{
    marketplace: string;
    listedCount: number;
    volumeLamports24h: number;
    floorPriceLamports: number;
  }>>(),

  /** Creation timestamp. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_analytics_collection ON nft_analytics_snapshots(collection_id);
// CREATE INDEX idx_analytics_timestamp ON nft_analytics_snapshots(timestamp);
// CREATE INDEX idx_analytics_collection_time ON nft_analytics_snapshots(collection_id, timestamp DESC);
```

### marketplace_listings

```typescript
export const marketplaceProviderEnum = pgEnum('marketplace_provider', [
  'magic_eden',
  'tensor',
  'hyperspace',
  'exchange_art'
]);

export const listingStatusEnum = pgEnum('listing_status', [
  'active',
  'sold',
  'cancelled',
  'expired'
]);

export const marketplaceListings = pgTable('marketplace_listings', {
  /** Primary key. */
  id: uuid('id').defaultRandom().primaryKey(),

  /** NFT record. */
  nftId: uuid('nft_id').notNull().references(() => nfts.id),

  /** Mint address (denormalized). */
  mintAddress: varchar('mint_address', { length: 128 }).notNull(),

  /** Collection ID. */
  collectionId: uuid('collection_id').notNull().references(() => nftCollections.id),

  /** Marketplace provider. */
  marketplace: marketplaceProviderEnum('marketplace').notNull(),

  /** Listing price in lamports. */
  priceLamports: integer('price_lamports').notNull(),

  /** Listing price in USD cents (at time of listing). */
  priceUsdCents: integer('price_usd_cents'),

  /** Seller wallet address. */
  sellerAddress: varchar('seller_address', { length: 64 }).notNull(),

  /** Marketplace-specific listing ID. */
  marketplaceListingId: varchar('marketplace_listing_id', { length: 256 }),

  /** Direct URL to the listing. */
  listingUrl: text('listing_url'),

  /** Listing status. */
  status: listingStatusEnum('status').notNull().default('active'),

  /** Buyer address (if sold). */
  buyerAddress: varchar('buyer_address', { length: 64 }),

  /** Sale transaction signature (if sold). */
  saleSignature: varchar('sale_signature', { length: 128 }),

  /** When the listing was created. */
  listedAt: timestamp('listed_at', { withTimezone: true }).notNull().defaultNow(),

  /** When the listing was sold. */
  soldAt: timestamp('sold_at', { withTimezone: true }),

  /** When the listing was cancelled. */
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),

  /** When the listing expires. */
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  /** Creation timestamp. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Last update timestamp. */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_listings_nft ON marketplace_listings(nft_id);
// CREATE INDEX idx_listings_collection ON marketplace_listings(collection_id);
// CREATE INDEX idx_listings_marketplace ON marketplace_listings(marketplace);
// CREATE INDEX idx_listings_status ON marketplace_listings(status);
// CREATE INDEX idx_listings_seller ON marketplace_listings(seller_address);
// CREATE INDEX idx_listings_active ON marketplace_listings(status, marketplace) WHERE status = 'active';
// CREATE INDEX idx_listings_price ON marketplace_listings(price_lamports) WHERE status = 'active';
```

---

## Code Examples

### 1. Mint a Standard NFT

```typescript
import { NFTService, CollectionService, NFTStandard, MetadataStorageType } from '@mcv/web3-public/nfts';
import { WalletService } from '@mcv/web3-public/wallets';

const nftService = new NFTService({
  connection,
  metaplex,
  db,
});

// Mint a BetEdge collectible moment NFT
const mintResult = await nftService.mint({
  collectionId: 'betedge-moments-collection-id',
  name: 'Historic Parlay Win #1247',
  symbol: 'BETM',
  description: 'A legendary 12-leg parlay hit at 50,000:1 odds on Super Bowl LXII. This moment captures the exact state of the bet slip at the time of the final score.',
  image: '/assets/moments/parlay-1247.png',
  attributes: [
    { trait_type: 'Sport', value: 'Football' },
    { trait_type: 'Event', value: 'Super Bowl LXII' },
    { trait_type: 'Bet Type', value: 'Parlay' },
    { trait_type: 'Legs', value: 12, display_type: 'number' },
    { trait_type: 'Odds', value: '50000:1' },
    { trait_type: 'Payout', value: 50000, display_type: 'number' },
    { trait_type: 'Rarity', value: 'Legendary' },
    { trait_type: 'Moment Date', value: 1739145600, display_type: 'date' },
  ],
  recipientAddress: winnerWalletAddress,
  sellerFeeBasisPoints: 750, // 7.5% royalty
  creators: [
    { address: betedgeTreasury, share: 80, verified: true },
    { address: winnerWalletAddress, share: 20, verified: false },
  ],
  programmable: true, // Enforce royalties
  standard: NFTStandard.PROGRAMMABLE,
  metadataStorage: MetadataStorageType.ARWEAVE,
  externalUrl: `https://betedge.com/moments/${momentId}`,
  ventureId: 'betedge',
  idempotencyKey: `betedge-moment-${momentId}`,
  priorityFee: 50_000, // 50k microlamports
});

console.log('Minted NFT:', {
  mint: mintResult.mintAddress,
  signature: mintResult.signature,
  metadataUri: mintResult.metadataUri,
  explorer: mintResult.explorerUrl,
  cost: `${mintResult.cost.total} SOL`,
});

// Output:
// Minted NFT: {
//   mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
//   signature: '5VERv8NMvzbJMEkV8xnrLkDc9QLYxGJY1Z...',
//   metadataUri: 'https://arweave.net/abc123...',
//   explorer: 'https://explorer.solana.com/tx/5VERv8...',
//   cost: '0.0245 SOL'
// }
```

### 2. Create an NFT Collection

```typescript
import { CollectionService, RoyaltyEnforcementMode, MetadataStorageType } from '@mcv/web3-public/nfts';

const collectionService = new CollectionService({
  connection,
  metaplex,
  db,
});

// Create an MCV Studios game items collection
const collection = await collectionService.create({
  name: 'Arcane Legends - Weapons',
  symbol: 'ALWEP',
  description: 'Legendary weapons from the Arcane Legends universe. Each weapon has unique stats, lore, and evolving abilities that grow with your character.',
  image: '/assets/collections/arcane-weapons-cover.png',
  sellerFeeBasisPoints: 500, // 5% royalty
  creators: [
    { address: mcvStudiosTreasury, share: 90, verified: true },
    { address: gameDesignerWallet, share: 10, verified: true },
  ],
  maxSupply: 10_000,
  standard: NFTStandard.PROGRAMMABLE,
  isMutable: true,
  externalUrl: 'https://arcanelegends.mcvstudios.com/weapons',
  ventureId: 'mcv-studios',
  royaltyEnforcement: RoyaltyEnforcementMode.PROGRAMMABLE,
  metadataStorage: MetadataStorageType.ARWEAVE,
  cluster: 'mainnet-beta',
});

console.log('Collection created:', {
  id: collection.id,
  mintAddress: collection.mintAddress,
  name: collection.name,
  maxSupply: collection.maxSupply,
});

// Also create a merkle tree for cheap mass minting of common items
const merkleTree = await collectionService.createMerkleTree(collection.id, {
  maxDepth: 20,          // Supports up to 1,048,576 cNFTs
  maxBufferSize: 256,    // Good for moderate concurrent writes
  canopyDepth: 15,       // Cache top 15 levels on-chain (reduces proof cost)
});

console.log('Merkle tree created:', {
  address: merkleTree.treeAddress,
  maxCapacity: merkleTree.maxCapacity, // 1,048,576
  cost: `${merkleTree.cost} SOL`,
});
```

### 3. Batch Mint Compressed NFTs

```typescript
import { CompressedNFTService, MetadataService } from '@mcv/web3-public/nfts';

const compressedService = new CompressedNFTService({
  connection,
  metaplex,
  db,
});
const metadataService = new MetadataService({
  ipfsApiKey: process.env.PINATA_API_KEY!,
  arweaveWallet: process.env.ARWEAVE_WALLET!,
});

// Prepare 10,000 game item NFTs for an Arcane Legends season drop
const items = Array.from({ length: 10_000 }, (_, i) => ({
  name: `Arcane Shard #${i + 1}`,
  symbol: 'ALSRD',
  description: 'A mysterious shard imbued with arcane energy. Collect and combine shards to forge legendary weapons.',
  image: `/assets/items/shard-${(i % 5) + 1}.png`, // 5 visual variants
  attributes: [
    { trait_type: 'Type', value: 'Crafting Material' },
    { trait_type: 'Element', value: ['Fire', 'Ice', 'Lightning', 'Shadow', 'Holy'][i % 5] },
    { trait_type: 'Power Level', value: Math.floor(Math.random() * 100) + 1, display_type: 'number' },
    { trait_type: 'Season', value: 'Season 1' },
    { trait_type: 'Rarity', value: i < 100 ? 'Epic' : i < 1000 ? 'Rare' : 'Common' },
  ],
}));

// Step 1: Batch upload metadata to IPFS
console.log('Uploading metadata for 10,000 items...');
const metadataResults = await metadataService.uploadBatch(
  items.map(item => ({
    metadata: {
      name: item.name,
      symbol: item.symbol,
      description: item.description,
      seller_fee_basis_points: 500,
      image: '', // Will be set by upload
      attributes: item.attributes,
      properties: {
        files: [],
        category: 'image' as const,
        creators: [{ address: mcvStudiosTreasury, share: 100 }],
      },
    },
    image: item.image,
  })),
  { storageType: MetadataStorageType.IPFS }
);
console.log(`Uploaded ${metadataResults.length} metadata files`);

// Step 2: Batch mint compressed NFTs
console.log('Minting 10,000 compressed NFTs...');
const mintConfigs = items.map((item, i) => ({
  collectionId: arcaneWeaponsCollectionId,
  name: item.name,
  symbol: item.symbol,
  metadataUri: metadataResults[i].uri,
  recipientAddress: mcvStudiosTreasury, // Mint to treasury, distribute later
  creators: [{ address: mcvStudiosTreasury, share: 100, verified: true }],
  sellerFeeBasisPoints: 500,
  ventureId: 'mcv-studios',
  idempotencyKey: `arcane-shard-s1-${i}`,
}));

const batchResult = await compressedService.batchMint(mintConfigs, {
  perTransaction: 5,
  concurrency: 20,
  continueOnError: true,
  priorityFee: 10_000,
  delayMs: 50,
  retry: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10_000,
  },
  onProgress: (progress) => {
    if (progress.completed % 500 === 0) {
      console.log(`Progress: ${progress.completed}/${progress.total} (${progress.failed} failed)`);
    }
  },
});

console.log('Batch mint complete:', {
  minted: batchResult.minted,
  failed: batchResult.failed,
  totalCost: `${batchResult.totalCost} SOL`,
  duration: `${(batchResult.durationMs / 1000).toFixed(1)}s`,
  costPerNFT: `${(batchResult.totalCost / batchResult.minted).toFixed(6)} SOL`,
});

// Output:
// Batch mint complete: {
//   minted: 9987,
//   failed: 13,
//   totalCost: '0.4521 SOL',
//   duration: '127.3s',
//   costPerNFT: '0.000045 SOL'  // ~$0.005 per NFT at $100/SOL
// }
```

### 4. NFT Gate: Restrict Access by NFT Ownership

```typescript
import { NFTGateService, GateType } from '@mcv/web3-public/nfts';
import express from 'express';

const gateService = new NFTGateService({
  connection,
  db,
  dasApiUrl: process.env.HELIUS_DAS_API_URL!, // For compressed NFT lookups
});

// Create a gate for BetEdge VIP features
const vipGate = await gateService.create({
  name: 'BetEdge VIP Access',
  description: 'Access to VIP betting features including higher limits, exclusive markets, and priority withdrawals.',
  type: GateType.ATTRIBUTE_MATCH,
  collectionIds: [betedgeMomentsCollectionId],
  minCount: 1,
  requiredAttributes: {
    'Rarity': ['Legendary', 'Epic'], // Must own a Legendary or Epic moment
  },
  includeCompressed: true,
  ventureId: 'betedge',
  resource: 'vip-features',
  resourceType: 'feature',
  active: true,
  cacheTtlSeconds: 300, // Cache for 5 minutes
});

// Check a wallet against the gate
const result = await gateService.check(vipGate.id, userWalletAddress);

if (result.allowed) {
  console.log('VIP access granted!', {
    satisfyingNFTs: result.satisfyingNFTs?.map(n => n.name),
  });
} else {
  console.log('VIP access denied:', result.reason);
}

// Use as Express middleware
const app = express();

app.get('/api/vip/markets',
  gateService.middleware(vipGate.id),
  async (req, res) => {
    // Only accessible to VIP NFT holders
    const markets = await getVIPMarkets();
    res.json(markets);
  }
);

// Create a composite gate: Must own a Legendary moment AND have Gold membership
const compositeGate = await gateService.create({
  name: 'BetEdge Ultra VIP',
  description: 'Ultra VIP access requiring both a Legendary moment and Gold+ membership.',
  type: GateType.COMPOSITE_AND,
  collectionIds: [betedgeMomentsCollectionId, betedgeMembershipCollectionId],
  requiredAttributes: {
    'Rarity': 'Legendary',
  },
  ventureId: 'betedge',
  resource: 'ultra-vip-features',
  resourceType: 'feature',
  active: true,
});

// Check multiple gates at once
const gateResults = await gateService.checkMultiple(
  [vipGate.id, compositeGate.id],
  userWalletAddress
);

const accessLevel = gateResults[1].allowed ? 'ultra-vip'
  : gateResults[0].allowed ? 'vip'
  : 'standard';

console.log(`User access level: ${accessLevel}`);
```

### 5. Issue and Manage Membership NFTs

```typescript
import {
  MembershipNFTService,
  MembershipTier,
  NFTGateService,
} from '@mcv/web3-public/nfts';

const membershipService = new MembershipNFTService({
  connection,
  metaplex,
  db,
  gateService, // Auto-creates gates for membership benefits
});

// Configure membership tiers for a venture
await membershipService.configureTiers('betedge', [
  {
    collectionId: betedgeMembershipCollectionId,
    tier: MembershipTier.BRONZE,
    durationDays: 30,
    autoRenew: true,
    renewalPriceSol: 0.5,
    benefits: [
      { id: 'reduced-fees', name: 'Reduced Fees', description: '10% fee reduction on all bets', type: 'discount', value: 10 },
      { id: 'daily-bonus', name: 'Daily Bonus', description: 'Daily free bet credit', type: 'feature_access', value: 'daily-bonus' },
    ],
    metadataTemplate: {
      name: 'BetEdge Bronze Membership',
      symbol: 'BETM',
      description: 'Bronze tier membership for BetEdge. Enjoy reduced fees and daily bonuses.',
      seller_fee_basis_points: 0,
      image: '', // Set per-mint
      attributes: [
        { trait_type: 'Tier', value: 'Bronze' },
        { trait_type: 'Status', value: 'Active' },
      ],
      properties: { files: [], category: 'image', creators: [] },
    },
    dynamicMetadata: true,
    ventureId: 'betedge',
    upgradeEnabled: true,
    upgradePaths: [MembershipTier.SILVER, MembershipTier.GOLD],
    upgradePriceSol: {
      [MembershipTier.SILVER]: 0.5,
      [MembershipTier.GOLD]: 2.0,
    },
  },
  {
    collectionId: betedgeMembershipCollectionId,
    tier: MembershipTier.GOLD,
    durationDays: 90,
    autoRenew: true,
    renewalPriceSol: 5.0,
    benefits: [
      { id: 'reduced-fees-gold', name: 'Reduced Fees', description: '25% fee reduction', type: 'discount', value: 25 },
      { id: 'daily-bonus-gold', name: 'Enhanced Daily Bonus', description: '3x daily free bet credit', type: 'feature_access', value: 'daily-bonus-gold' },
      { id: 'vip-markets', name: 'VIP Markets', description: 'Access exclusive VIP betting markets', type: 'exclusive_content', value: 'vip-markets' },
      { id: 'priority-withdraw', name: 'Priority Withdrawals', description: 'Instant withdrawal processing', type: 'priority', value: true },
      { id: 'seasonal-airdrop', name: 'Seasonal Airdrops', description: 'Receive seasonal NFT airdrops', type: 'airdrop', value: true },
    ],
    metadataTemplate: {
      name: 'BetEdge Gold Membership',
      symbol: 'BETM',
      description: 'Gold tier membership for BetEdge. Premium benefits including VIP markets and priority withdrawals.',
      seller_fee_basis_points: 0,
      image: '',
      attributes: [
        { trait_type: 'Tier', value: 'Gold' },
        { trait_type: 'Status', value: 'Active' },
      ],
      properties: { files: [], category: 'image', creators: [] },
    },
    dynamicMetadata: true,
    ventureId: 'betedge',
    maxMembers: 1000,
    upgradeEnabled: true,
    upgradePaths: [MembershipTier.PLATINUM, MembershipTier.DIAMOND],
    upgradePriceSol: {
      [MembershipTier.PLATINUM]: 10.0,
      [MembershipTier.DIAMOND]: 50.0,
    },
  },
]);

// Issue a Bronze membership
const membership = await membershipService.issue(
  userWalletAddress,
  {
    collectionId: betedgeMembershipCollectionId,
    tier: MembershipTier.BRONZE,
    durationDays: 30,
    autoRenew: true,
    renewalPriceSol: 0.5,
    benefits: [], // Loaded from tier config
    metadataTemplate: {}, // Loaded from tier config
    dynamicMetadata: true,
    ventureId: 'betedge',
    upgradeEnabled: true,
  },
  paymentTxSignature // SOL payment for membership
);

console.log('Membership issued:', {
  mintAddress: membership.mintResult.mintAddress,
  tier: membership.membership.tier,
  expiresAt: membership.membership.expiresAt,
  gatesCreated: membership.gatesCreated.length,
});

// Check membership for a wallet
const check = await membershipService.checkMembership(
  userWalletAddress,
  MembershipTier.GOLD,
  'betedge'
);

if (check.hasAccess) {
  console.log('Gold access confirmed');
} else if (check.expiredButRenewable) {
  console.log('Membership expired — prompt for renewal');
} else if (check.currentMembership) {
  console.log(`User has ${check.currentMembership.tier} — needs upgrade to Gold`);
} else {
  console.log('No membership — prompt for purchase');
}

// Upgrade membership
const upgraded = await membershipService.upgrade(
  membership.mintResult.mintAddress,
  MembershipTier.GOLD,
  upgradePaymentSignature
);

console.log('Upgraded to Gold:', {
  newTier: upgraded.membership.tier,
  newBenefits: upgraded.membership.activeBenefits.map(b => b.name),
});

// Process expirations (called by cron job)
const expirations = await membershipService.processExpirations();
console.log(`Processed ${expirations.expired} expirations, ${expirations.notified} renewal reminders sent`);

// Process auto-renewals (called by cron job)
const renewals = await membershipService.processAutoRenewals();
console.log(`Auto-renewed ${renewals.renewed}, ${renewals.failed} failed (insufficient funds)`);
```

### 6. Burn NFT for Rewards

```typescript
import { BurnService, BurnMechanic, BurnRewardType } from '@mcv/web3-public/nfts';

const burnService = new BurnService({
  connection,
  metaplex,
  db,
  walletService,
});

// Configure burn-to-upgrade for game items
const burnConfig = await burnService.configure({
  collectionId: arcaneWeaponsCollectionId,
  enabled: true,
  mechanic: BurnMechanic.UPGRADE,
  rewards: [
    {
      type: BurnRewardType.NFT,
      value: 'upgraded-weapon', // Mint a new upgraded weapon
      probability: 1.0,
      config: {
        upgradeCollection: arcaneWeaponsCollectionId,
        upgradeAttributes: {
          'Power Level': '+50',
          'Rarity': 'next-tier',
        },
      },
    },
    {
      type: BurnRewardType.POINTS,
      value: 100, // 100 XP
      probability: 1.0,
    },
  ],
  minBurnCount: 3, // Must burn 3 Common shards to get 1 Rare
  maxBurnCount: 10,
  requiredAttributes: {
    'Type': 'Crafting Material',
    'Rarity': ['Common', 'Rare'], // Can't burn Epics or Legendaries
  },
  burnWindow: {
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-06-01'), // Season 1 only
  },
  maxTotalBurns: 50_000,
  ventureId: 'mcv-studios',
});

// Check eligibility before burning
const eligibility = await burnService.checkEligibility(
  shardMintAddress,
  burnConfig.id
);

if (!eligibility.eligible) {
  console.log('Not eligible:', eligibility.reason);
  // "Not eligible: NFT attribute 'Rarity' is 'Legendary', requires one of: Common, Rare"
}

// Burn 3 shards to forge a Rare weapon
const burnResult = await burnService.batchBurn(
  [shard1MintAddress, shard2MintAddress, shard3MintAddress],
  playerKeypair,
  burnConfig.id
);

console.log('Burn complete:', {
  burned: burnResult.burned,
  rewards: burnResult.results.flatMap(r =>
    r.rewards?.map(rw => ({
      type: rw.type,
      value: rw.value,
      newNFT: rw.newMintAddress,
    }))
  ),
});

// Output:
// Burn complete: {
//   burned: 3,
//   rewards: [
//     { type: 'nft', value: 'upgraded-weapon', newNFT: '8yHJt...' },
//     { type: 'points', value: 100 },
//     { type: 'points', value: 100 },
//     { type: 'points', value: 100 },
//   ]
// }

// Get burn stats
const stats = await burnService.getBurnStats(arcaneWeaponsCollectionId);
console.log('Burn stats:', {
  totalBurned: stats.totalBurned,
  burnRate: `${stats.burnRatePerDay}/day`,
  rewardsDistributed: stats.rewardsDistributed,
  supplyReduction: `${stats.supplyReductionPercent}%`,
});
```

### 7. Royalty Configuration and Enforcement

```typescript
import { RoyaltyService, RoyaltyEnforcementMode } from '@mcv/web3-public/nfts';

const royaltyService = new RoyaltyService({
  connection,
  metaplex,
  db,
});

// Configure royalties with programmable enforcement
const royaltyConfig = await royaltyService.configure(betedgeMomentsCollectionId, {
  collectionId: betedgeMomentsCollectionId,
  sellerFeeBasisPoints: 750, // 7.5%
  enforcement: RoyaltyEnforcementMode.PROGRAMMABLE,
  distribution: [
    { creatorAddress: betedgeTreasury, percentage: 70, label: 'BetEdge Treasury' },
    { creatorAddress: communityFund, percentage: 20, label: 'Community Fund' },
    { creatorAddress: devFund, percentage: 10, label: 'Dev Fund' },
  ],
  useRuleSet: true,
  allowedPrograms: [
    'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K', // Magic Eden v2
    'TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN', // Tensor
  ],
  deniedPrograms: [],
});

// Create a rule set for programmable NFTs
const ruleSet = await royaltyService.createRuleSet({
  name: 'BetEdge Moments Royalty Rules',
  owner: betedgeTreasury,
  operations: {
    transfer: {
      // Only allow transfers through approved programs
      programAllowList: royaltyConfig.allowedPrograms!,
      // Require royalty payment
      additionalSigners: [],
      amountCheck: {
        minAmount: royaltyConfig.sellerFeeBasisPoints,
        field: 'Amount',
      },
    },
    delegate: {
      // Allow delegation through approved programs
      programAllowList: royaltyConfig.allowedPrograms!,
    },
  },
});

console.log('Rule set created:', ruleSet.address);

// Audit royalty payments
const audit = await royaltyService.auditPayments(
  betedgeMomentsCollectionId,
  { start: thirtyDaysAgo, end: now }
);

console.log('Royalty audit:', {
  totalSales: audit.totalSales,
  totalRoyaltiesExpected: `${audit.totalRoyaltiesExpectedSol} SOL`,
  totalRoyaltiesCollected: `${audit.totalRoyaltiesCollectedSol} SOL`,
  complianceRate: `${audit.complianceRate}%`,
  unpaidRoyalties: `${audit.unpaidRoyaltiesSol} SOL`,
});

// Get creator earnings
const earnings = await royaltyService.getCreatorEarnings(betedgeTreasury);
console.log('Creator earnings:', {
  totalEarned: `${earnings.totalEarnedSol} SOL`,
  last30Days: `${earnings.last30DaysSol} SOL`,
  pendingDistribution: `${earnings.pendingDistributionSol} SOL`,
});
```

### 8. NFT Analytics

```typescript
import { NFTAnalyticsService } from '@mcv/web3-public/nfts';

const analyticsService = new NFTAnalyticsService({
  connection,
  db,
  magicEdenApiKey: process.env.MAGIC_EDEN_API_KEY!,
  tensorApiKey: process.env.TENSOR_API_KEY!,
});

// Take a snapshot of collection analytics
const snapshot = await analyticsService.snapshot(betedgeMomentsCollectionId);

console.log('Collection Analytics:', {
  floorPrice: `${snapshot.floorPriceSol} SOL ($${snapshot.floorPriceUsd})`,
  avgPrice24h: `${snapshot.avgPriceSol24h} SOL`,
  volume24h: `${snapshot.volumeSol24h} SOL`,
  volume7d: `${snapshot.volumeSol7d} SOL`,
  sales24h: snapshot.salesCount24h,
  uniqueHolders: snapshot.uniqueHolders,
  totalSupply: snapshot.totalSupply,
  listedCount: snapshot.listedCount,
  listedPercent: `${snapshot.listedPercentage.toFixed(1)}%`,
  holderDistribution: snapshot.holderDistribution,
  topHolder: snapshot.topHolders[0],
});

// Get price history over 30 days
const priceHistory = await analyticsService.getPriceHistory(
  betedgeMomentsCollectionId,
  { start: thirtyDaysAgo, end: now }
);

// Schedule automatic snapshots every hour
await analyticsService.scheduleSnapshots(betedgeMomentsCollectionId, 60);

// Cross-venture analytics
const ventureAnalytics = await analyticsService.getVentureAnalytics('betedge');
console.log('Venture NFT Analytics:', {
  totalCollections: ventureAnalytics.totalCollections,
  totalNFTs: ventureAnalytics.totalNFTs,
  totalHolders: ventureAnalytics.uniqueHolders,
  totalVolume: `${ventureAnalytics.totalVolumeSol} SOL`,
  topCollection: ventureAnalytics.topCollectionByVolume.name,
});
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| `NFT_001` | `COLLECTION_NOT_FOUND` | The specified collection ID does not exist in the database. |
| `NFT_002` | `COLLECTION_MAX_SUPPLY_REACHED` | Cannot mint: the collection has reached its maximum supply limit. |
| `NFT_003` | `MINTING_DISABLED` | Minting is currently disabled for this collection. |
| `NFT_004` | `METADATA_UPLOAD_FAILED` | Failed to upload metadata to IPFS/Arweave. Check storage provider credentials. |
| `NFT_005` | `MINT_TRANSACTION_FAILED` | The on-chain mint transaction failed. Check wallet balance and network status. |
| `NFT_006` | `INSUFFICIENT_FUNDS` | The payer wallet does not have enough SOL for rent + fees. Use `estimateMintCost()` to check. |
| `NFT_007` | `DUPLICATE_MINT` | An NFT with this idempotency key has already been minted. |
| `NFT_008` | `INVALID_METADATA` | Metadata does not conform to Metaplex standard. Run `validateMetadata()` for details. |
| `NFT_009` | `COLLECTION_VERIFICATION_FAILED` | Failed to verify the NFT as part of the collection. Check authority permissions. |
| `NFT_010` | `MERKLE_TREE_FULL` | The merkle tree for compressed NFTs is full. Create a new tree with larger depth. |
| `NFT_011` | `MERKLE_TREE_NOT_FOUND` | Collection does not have a merkle tree. Call `createMerkleTree()` first. |
| `NFT_012` | `COMPRESSED_PROOF_FAILED` | Failed to retrieve or verify the merkle proof for a compressed NFT. |
| `NFT_013` | `GATE_NOT_FOUND` | The specified gate ID does not exist. |
| `NFT_014` | `GATE_CHECK_FAILED` | Gate ownership check failed due to an RPC or DAS API error. |
| `NFT_015` | `MEMBERSHIP_EXPIRED` | The membership NFT has expired. Renew to restore access. |
| `NFT_016` | `MEMBERSHIP_MAX_REACHED` | Maximum members for this tier has been reached. |
| `NFT_017` | `MEMBERSHIP_UPGRADE_NOT_ALLOWED` | The current tier cannot upgrade to the requested tier. |
| `NFT_018` | `BURN_NOT_ELIGIBLE` | The NFT is not eligible for burning under the specified burn config. |
| `NFT_019` | `BURN_WINDOW_CLOSED` | The burn window for this config has not started or has already ended. |
| `NFT_020` | `BURN_MAX_REACHED` | Maximum total burns for this config have been reached. |
| `NFT_021` | `MARKETPLACE_LISTING_FAILED` | Failed to create a listing on the marketplace. Check API credentials and NFT ownership. |
| `NFT_022` | `MARKETPLACE_DELIST_FAILED` | Failed to delist from the marketplace. The listing may have already been sold or cancelled. |
| `NFT_023` | `ROYALTY_DISTRIBUTION_INVALID` | Royalty distribution percentages must sum to 100. |
| `NFT_024` | `RULE_SET_CREATION_FAILED` | Failed to create the programmable NFT rule set on-chain. |
| `NFT_025` | `TRANSFER_NOT_ALLOWED` | NFT is frozen or the sender does not have transfer authority. |
| `NFT_026` | `NFT_NOT_FOUND` | No NFT found with the specified mint address or asset ID. |
| `NFT_027` | `DAS_API_ERROR` | The Digital Asset Standard (DAS) API returned an error. Check Helius/RPC endpoint. |
| `NFT_028` | `IMAGE_PROCESSING_FAILED` | Failed to process or optimize the image for metadata upload. |
| `NFT_029` | `METADATA_URI_UNREACHABLE` | The metadata URI is not accessible. The content may have been unpinned or the gateway is down. |
| `NFT_030` | `AUTO_RENEWAL_PAYMENT_FAILED` | Auto-renewal failed because the wallet does not have sufficient funds for the renewal payment. |

---

## Security

### Key Management

- **Never expose private keys in application code.** All signing keypairs are managed through `@mcv/web3-public/wallets` with encrypted key storage and HSM support for production.
- **Collection authority keypairs** are stored in AWS KMS / HashiCorp Vault and accessed via the wallet service's `signTransaction()` method — raw keys never touch application memory.
- **Mint authority separation:** The mint authority (can create new NFTs) and update authority (can modify metadata) are distinct keypairs with different access policies.

### Transaction Security

- **Idempotency keys** prevent duplicate mints from retry logic or network issues. Every mint operation requires an idempotency key that is checked against the database before submitting a transaction.
- **Priority fees** are capped at configurable maximums to prevent fee-escalation attacks during network congestion.
- **Transaction simulation** is performed before submission to catch errors without spending SOL.
- **Confirmation polling** uses `confirmed` commitment level for user-facing operations and `finalized` for critical state changes.

### Access Control

- NFT gate checks use **wallet signature verification** — the user must prove they own the wallet by signing a challenge message before gate checks are performed.
- **Rate limiting** on gate check endpoints prevents enumeration attacks (discovering which wallets hold specific NFTs).
- **Admin operations** (collection creation, burn config, gate management) require authenticated admin sessions with role-based access control.

### Metadata Security

- **Content hashing** ensures metadata integrity — the hash of uploaded content is stored and verified on resolution to detect tampering.
- **Image validation** prevents upload of malicious files — images are reprocessed through a sanitizing pipeline before storage.
- **IPFS pinning** is dual-provider (Pinata + nft.storage) for redundancy. Arweave provides permanent immutable storage.

### Compressed NFT Security

- **Merkle proofs** are verified on-chain by the Bubblegum program — proof validity is mandatory for transfers and burns.
- **Concurrent access control** via merkle tree buffer sizes prevents write conflicts during batch minting.
- **DAS API validation** — compressed NFT ownership lookups are cross-referenced between the DAS API and on-chain merkle tree state to prevent spoofing.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SOLANA_RPC_URL` | Yes | Solana RPC endpoint (Helius, QuickNode, or self-hosted). |
| `SOLANA_CLUSTER` | Yes | Cluster identifier: `mainnet-beta`, `devnet`, `testnet`. |
| `METAPLEX_AUTHORITY_KEYPAIR` | Yes | Path to or base64-encoded collection authority keypair. |
| `PINATA_API_KEY` | Yes | Pinata IPFS API key for metadata pinning. |
| `PINATA_SECRET_KEY` | Yes | Pinata IPFS secret key. |
| `PINATA_GATEWAY_URL` | No | Custom Pinata gateway URL. Default: `gateway.pinata.cloud`. |
| `ARWEAVE_WALLET_PATH` | Cond. | Path to Arweave wallet JSON (required if using Arweave storage). |
| `IRYS_RPC_URL` | Cond. | Irys (Bundlr) endpoint for Arweave uploads. |
| `HELIUS_API_KEY` | Yes | Helius API key for DAS (Digital Asset Standard) queries — required for compressed NFTs. |
| `HELIUS_DAS_API_URL` | No | Custom Helius DAS endpoint. Default: derived from API key. |
| `MAGIC_EDEN_API_KEY` | Cond. | Magic Eden API key (required for marketplace integration). |
| `TENSOR_API_KEY` | Cond. | Tensor API key (required for Tensor marketplace integration). |
| `NFT_DEFAULT_PRIORITY_FEE` | No | Default priority fee in microlamports. Default: `10000`. |
| `NFT_MAX_PRIORITY_FEE` | No | Maximum allowed priority fee. Default: `500000`. |
| `NFT_MINT_RETRY_COUNT` | No | Number of retries for failed mints. Default: `3`. |
| `NFT_GATE_CACHE_TTL` | No | Default gate check cache TTL in seconds. Default: `60`. |
| `NFT_METADATA_STORAGE` | No | Default metadata storage type. Default: `arweave`. |
| `NFT_ANALYTICS_INTERVAL` | No | Default analytics snapshot interval in minutes. Default: `60`. |
| `DATABASE_URL` | Yes | PostgreSQL connection string for the NFT database. |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/web3-public/wallets` | Wallet management, keypair access, transaction signing. |
| `@mcv/web3-public/tokens` | SPL token operations for token-based burn rewards. |
| `@mcv/web3-public/transactions` | Transaction building, priority fees, retry logic. |
| `@mcv/shared/db` | Drizzle ORM configuration and connection pooling. |
| `@mcv/shared/logger` | Structured logging with trace context. |
| `@mcv/shared/errors` | Standardized error handling and error code registry. |
| `@mcv/shared/cache` | Redis-based caching for gate checks and analytics. |
| `@mcv/shared/queue` | Job queue for batch operations and cron tasks (expiration, renewal). |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@solana/web3.js` | `^1.95` | Solana SDK — connections, transactions, keypairs. |
| `@metaplex-foundation/js` | `^0.20` | Metaplex SDK — NFT creation, metadata, collections. |
| `@metaplex-foundation/mpl-token-metadata` | `^3.2` | Token Metadata program client (low-level). |
| `@metaplex-foundation/mpl-bubblegum` | `^3.1` | Bubblegum program for compressed NFTs. |
| `@metaplex-foundation/mpl-token-auth-rules` | `^2.0` | Authorization rules for programmable NFTs. |
| `@solana/spl-account-compression` | `^0.2` | Merkle tree and concurrent account compression. |
| `drizzle-orm` | `^0.30` | Database ORM for schema and queries. |
| `@pinata/sdk` | `^2.1` | IPFS pinning via Pinata. |
| `@irys/sdk` | `^0.2` | Arweave uploads via Irys (formerly Bundlr). |
| `sharp` | `^0.33` | Image processing and optimization. |
| `bs58` | `^5.0` | Base58 encoding/decoding for Solana addresses. |

---

## Testing

### Unit Tests

```bash
# Run all NFT module unit tests
pnpm test --filter @mcv/web3-public/nfts

# Run specific test suites
pnpm test --filter @mcv/web3-public/nfts -- --grep "NFTService"
pnpm test --filter @mcv/web3-public/nfts -- --grep "CompressedNFT"
pnpm test --filter @mcv/web3-public/nfts -- --grep "GateService"
pnpm test --filter @mcv/web3-public/nfts -- --grep "MembershipNFT"
```

### Integration Tests

Integration tests run against Solana **devnet** and real IPFS/Arweave services. They require funded devnet wallets and valid API keys.

```bash
# Run integration tests (requires SOLANA_CLUSTER=devnet)
SOLANA_CLUSTER=devnet pnpm test:integration --filter @mcv/web3-public/nfts
```

### Test Fixtures

The module provides test fixtures for common scenarios:

```typescript
import {
  createTestCollection,
  createTestNFT,
  createTestMerkleTree,
  createTestGate,
  createTestMembership,
  mockMetadataUpload,
  mockMarketplaceListing,
} from '@mcv/web3-public/nfts/testing';

// Create a test collection with sensible defaults
const collection = await createTestCollection({
  ventureId: 'test-venture',
  standard: NFTStandard.STANDARD,
});

// Create a test NFT in the collection
const nft = await createTestNFT({
  collectionId: collection.id,
  attributes: [{ trait_type: 'Rarity', value: 'Legendary' }],
});

// Mock metadata upload (doesn't hit real IPFS/Arweave)
const metadata = mockMetadataUpload({
  name: 'Test NFT',
  image: 'test-image.png',
});
```

### Local Development

For local development without hitting real Solana:

```bash
# Start local Solana validator
solana-test-validator --reset

# Configure environment for local testing
export SOLANA_RPC_URL=http://localhost:8899
export SOLANA_CLUSTER=localnet

# Airdrop SOL to test wallets
solana airdrop 100 <TEST_WALLET_ADDRESS> --url localhost

# Run tests against local validator
pnpm test --filter @mcv/web3-public/nfts
```

### Performance Testing

For batch minting performance tests:

```bash
# Benchmark compressed NFT batch minting
pnpm test:perf --filter @mcv/web3-public/nfts -- --grep "batch-mint-benchmark"

# Expected results (devnet):
# - 1,000 cNFTs: ~15s, ~0.045 SOL
# - 10,000 cNFTs: ~120s, ~0.45 SOL
# - 100,000 cNFTs: ~1200s, ~4.5 SOL
```

---

## Cross-Venture Usage

### BetEdge

- **Collectible Moments:** Historic bet wins minted as programmable NFTs with enforced royalties.
- **VIP Membership:** Membership NFTs gating access to VIP markets, reduced fees, and priority withdrawals.
- **Achievement NFTs:** Compressed NFTs for badges and milestones (cheap mass distribution).

### MCV Studios

- **Game Items:** Weapons, armor, skins as programmable NFTs with in-game stats as attributes.
- **Crafting System:** Burn common items to forge rare ones (burn-to-upgrade mechanic).
- **Season Passes:** Membership NFTs for seasonal content access with auto-renewal.
- **Mass Airdrops:** Compressed NFTs for event rewards distributed to thousands of players.

### All Ventures

- **Platform Membership:** Cross-venture membership NFTs providing benefits across the MCV ecosystem.
- **Governance NFTs:** NFTs that grant voting rights in venture decisions.
- **Loyalty Rewards:** Compressed NFTs for loyalty program tiers and rewards.

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/web3-public/wallets` | Provides wallet management and transaction signing for all NFT operations. |
| `@mcv/web3-public/tokens` | SPL token operations used for token-based burn rewards and payment processing. |
| `@mcv/web3-public/transactions` | Transaction building, priority fees, confirmation, and retry logic. |
| `@mcv/web3-public/programs` | Custom Solana program interactions that extend NFT functionality. |
| `@mcv/shared/storage` | File storage abstraction used for metadata and image handling. |
| `@mcv/shared/queue` | Job queue for async batch operations, expiration processing, and analytics snapshots. |