# @mcv/web3-core/bridge

> **Tier 5 — Domain Module (MCV-Only)**
> Cross-chain bridge operations for EDGE and supported tokens across Solana and EVM chains.

---

## Purpose

The bridge module is the critical infrastructure layer that enables EDGE tokens and other supported assets to move between Solana (the native chain) and EVM-compatible chains including Ethereum, Polygon, and Arbitrum. Cross-chain interoperability is fundamental to MCV's multi-chain strategy — users must be able to seamlessly transfer value between ecosystems without worrying about the underlying bridge mechanics, attestation verification, or finality differences between chains. This module abstracts that complexity behind a unified API while maintaining the highest possible security standards.

Bridge operations are inherently the most security-sensitive component of any multi-chain system. History has shown that bridge exploits — Wormhole ($320M), Ronin ($625M), Nomad ($190M), Harmony Horizon ($100M) — represent the single largest attack vector in all of cryptocurrency. The bridge module therefore implements defense-in-depth: multi-protocol verification (Wormhole as primary, LayerZero as secondary), attestation validation before any token release, per-user and global velocity limits, automated anomaly detection, and an emergency circuit breaker that can pause all bridging operations within seconds. Every design decision in this module prioritizes security over convenience.

The module integrates with Supabase PostgreSQL for persistent off-chain tracking of bridge transfers, routes, attestations, and analytics. All bridge operations are exposed via tRPC endpoints with comprehensive monitoring — from initiation through in-flight status to final confirmation on the destination chain. The system tracks wrapped/bridged token supplies, verifies backing ratios, performs automated reconciliation, and provides real-time analytics on bridge volume, fees, popular routes, and average completion times across all supported chain pairs.

---

## Exports

```typescript
// === Primary Service ===
export { BridgeService }                    from './services/bridge.service';
export { BridgeServiceImpl }               from './services/bridge.service.impl';

// === Protocol Adapters ===
export { WormholeBridgeAdapter }           from './adapters/wormhole.adapter';
export { LayerZeroBridgeAdapter }          from './adapters/layerzero.adapter';
export { BridgeProtocolAdapter }           from './adapters/protocol.adapter';

// === Transfer Management ===
export { BridgeTransferManager }           from './managers/transfer.manager';
export { BridgeTransferMonitor }           from './managers/transfer-monitor.manager';
export { BridgeRetryManager }             from './managers/retry.manager';

// === Verification & Security ===
export { AttestationVerifier }             from './verification/attestation.verifier';
export { VAAVerifier }                     from './verification/vaa.verifier';
export { BridgeSecurityManager }           from './security/bridge-security.manager';
export { BridgeCircuitBreaker }            from './security/circuit-breaker';
export { VelocityChecker }                from './security/velocity-checker';

// === Fee Estimation ===
export { BridgeFeeEstimator }             from './fees/fee-estimator';
export { CrossChainGasOracle }            from './fees/gas-oracle';

// === Asset Tracking ===
export { BridgedAssetTracker }            from './tracking/bridged-asset.tracker';
export { BackingVerifier }                from './tracking/backing.verifier';
export { ReconciliationEngine }           from './tracking/reconciliation.engine';

// === Analytics ===
export { BridgeAnalyticsService }         from './analytics/bridge-analytics.service';
export { BridgeMetricsCollector }         from './analytics/metrics-collector';

// === Route Management ===
export { BridgeRouteResolver }            from './routes/route-resolver';
export { BridgeRouteOptimizer }           from './routes/route-optimizer';

// === Configuration ===
export { BridgeConfigManager }            from './config/bridge-config.manager';
export { BridgeLimitsManager }            from './config/limits.manager';

// === Database Schemas ===
export {
  bridgeTransfers,
  bridgeRoutes,
  bridgeConfigs,
  bridgeAttestations,
  bridgeAnalytics,
  bridgeAuditLog,
  bridgedAssetSupply,
}                                          from './db/schema';

// === Types ===
export type {
  BridgeTransfer,
  BridgeRoute,
  BridgeAttestation,
  BridgeConfig,
  FeeEstimate,
  BridgeStatus,
  BridgeProtocol,
  ChainId,
  BridgeDirection,
  BridgeTransferRequest,
  BridgeTransferResult,
  BridgeMonitorEvent,
  BridgeSecurityAlert,
  BridgeLimits,
  VelocityCheckResult,
  ReconciliationReport,
  BridgeAnalyticsSnapshot,
  BridgeHealthStatus,
  EmergencyPauseReason,
}                                          from './types';

// === Error Codes ===
export { BridgeErrorCode }                from './errors';

// === tRPC Router ===
export { bridgeRouter }                   from './router';

// === Constants ===
export {
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS,
  DEFAULT_BRIDGE_LIMITS,
  BRIDGE_PROTOCOL_PRIORITY,
  MIN_ATTESTATION_CONFIRMATIONS,
  BRIDGE_TIMEOUT_MS,
  MAX_RETRY_ATTEMPTS,
}                                          from './constants';
```

---

## Architecture

### High-Level Bridge Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BRIDGE MODULE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌──────────────────┐    ┌────────────────────────────┐    │
│  │  Client   │───▶│   tRPC Router    │───▶│    BridgeService           │    │
│  │  (User)   │    │  bridgeRouter    │    │    ┌────────────────────┐  │    │
│  └──────────┘    └──────────────────┘    │    │ Security Checks    │  │    │
│                                           │    │ ┌────────────────┐ │  │    │
│                                           │    │ │ Rate Limits    │ │  │    │
│                                           │    │ │ Velocity Check │ │  │    │
│                                           │    │ │ Circuit Breaker│ │  │    │
│                                           │    │ └────────────────┘ │  │    │
│                                           │    └────────────────────┘  │    │
│                                           └───────────┬────────────────┘    │
│                                                       │                     │
│                          ┌────────────────────────────┼───────────────┐     │
│                          │        Route Resolver      │               │     │
│                          │  (selects optimal bridge   │ protocol)     │     │
│                          └────────────┬───────────────┘               │     │
│                                       │                               │     │
│                    ┌──────────────────┼──────────────────┐            │     │
│                    ▼                                     ▼            │     │
│  ┌─────────────────────────────┐  ┌──────────────────────────────┐   │     │
│  │   Wormhole Adapter          │  │   LayerZero Adapter          │   │     │
│  │   (Primary Protocol)        │  │   (Secondary Protocol)       │   │     │
│  │                             │  │                              │   │     │
│  │  ┌───────────────────────┐  │  │  ┌────────────────────────┐  │   │     │
│  │  │ Token Lock/Burn      │  │  │  │ OFT Send               │  │   │     │
│  │  │ VAA Generation       │  │  │  │ LZ Message Compose      │  │   │     │
│  │  │ Guardian Attestation │  │  │  │ DVN Verification         │  │   │     │
│  │  │ Token Mint/Unlock    │  │  │  │ Token Receive            │  │   │     │
│  │  └───────────────────────┘  │  │  └────────────────────────┘  │   │     │
│  └──────────────┬──────────────┘  └──────────────┬───────────────┘   │     │
│                 │                                 │                   │     │
│                 └────────────────┬────────────────┘                   │     │
│                                 ▼                                     │     │
│  ┌──────────────────────────────────────────────────────────────┐     │     │
│  │                    Transfer Monitor                          │     │     │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐  │     │     │
│  │  │ INITIATED│─▶│ IN_FLIGHT │─▶│ ATTESTED │─▶│ COMPLETED │  │     │     │
│  │  └──────────┘  └───────────┘  └──────────┘  └───────────┘  │     │     │
│  │       │              │              │              │         │     │     │
│  │       ▼              ▼              ▼              ▼         │     │     │
│  │  ┌──────────────────────────────────────────────────────┐   │     │     │
│  │  │          Retry Manager (exponential backoff)         │   │     │     │
│  │  └──────────────────────────────────────────────────────┘   │     │     │
│  └──────────────────────────────────────────────────────────────┘     │     │
│                                 │                                     │     │
│                                 ▼                                     │     │
│  ┌──────────────────────────────────────────────────────────────┐     │     │
│  │                    Supabase PostgreSQL                        │     │     │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │     │     │
│  │  │ bridge_      │ │ bridge_      │ │ bridge_              │  │     │     │
│  │  │ transfers    │ │ attestations │ │ analytics            │  │     │     │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘  │     │     │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │     │     │
│  │  │ bridge_      │ │ bridge_      │ │ bridged_asset_       │  │     │     │
│  │  │ routes       │ │ configs      │ │ supply               │  │     │     │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘  │     │     │
│  └──────────────────────────────────────────────────────────────┘     │     │
│                                                                       │     │
└───────────────────────────────────────────────────────────────────────┘     │
                                                                              │
                                                                              │
┌─────────────────────────────────────────────────────────────────────────────┘
│
│  CROSS-CHAIN MESSAGE FLOW (Wormhole)
│
│  Source Chain                    Guardian Network              Target Chain
│  ┌──────────┐                  ┌──────────────┐              ┌──────────┐
│  │ Solana   │  Lock/Burn ───▶  │  19 Guardians│  VAA ────▶  │ Ethereum │
│  │          │  tokens on       │  observe tx  │  signed      │ Mint/    │
│  │ Token    │  source chain    │  13/19 sign  │  attestation │ Unlock   │
│  │ Bridge   │                  │  create VAA  │              │ tokens   │
│  │ Program  │                  │              │              │ on target│
│  └──────────┘                  └──────────────┘              └──────────┘
│       │                                                            │
│       │              ┌─────────────────────────┐                   │
│       └──────────────│  Relayer (automated)     │───────────────────┘
│                      │  submits VAA to target   │
│                      │  chain contract           │
│                      └─────────────────────────┘
│
│  CROSS-CHAIN MESSAGE FLOW (LayerZero)
│
│  Source Chain                    DVN Layer                    Target Chain
│  ┌──────────┐                  ┌──────────────┐              ┌──────────┐
│  │ Polygon  │  OFT Send ────▶ │  Decentralized│  Verify ──▶ │ Solana   │
│  │          │  message via     │  Verifier    │  message     │ OFT      │
│  │ OFT      │  LZ Endpoint    │  Networks    │  proof       │ Receive  │
│  │ Contract │                  │  (DVNs)      │              │ endpoint │
│  └──────────┘                  └──────────────┘              └──────────┘
│       │                                                            │
│       │              ┌─────────────────────────┐                   │
│       └──────────────│  LZ Executor             │───────────────────┘
│                      │  delivers message to     │
│                      │  destination endpoint     │
│                      └─────────────────────────┘
```

### Transfer State Machine

```
                         ┌─────────────┐
                         │  REQUESTED   │
                         │  (pending    │
                         │   security)  │
                         └──────┬──────┘
                                │
                    ┌───────────┼───────────┐
                    │    Security Checks     │
                    │  • Velocity limits     │
                    │  • User limits         │
                    │  • Global limits       │
                    │  • Circuit breaker     │
                    │  • Sanctions check     │
                    └───────────┼───────────┘
                                │
                   ┌────────────┴────────────┐
                   ▼                          ▼
          ┌──────────────┐           ┌──────────────┐
          │   REJECTED   │           │  INITIATED   │
          │   (security  │           │  (tx sent to │
          │    failed)   │           │   source     │
          └──────────────┘           │   chain)     │
                                     └──────┬──────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │  IN_FLIGHT   │
                                    │  (awaiting   │
                                    │  attestation)│
                                    └──────┬──────┘
                                            │
                              ┌─────────────┼─────────────┐
                              ▼                           ▼
                     ┌──────────────┐            ┌──────────────┐
                     │   ATTESTED   │            │   TIMED_OUT  │
                     │  (proof      │            │  (no attesta-│
                     │   received)  │            │   tion in    │
                     └──────┬──────┘            │   time)      │
                            │                    └──────┬──────┘
                            ▼                           │
                     ┌──────────────┐                   │
                     │  COMPLETING  │                   │
                     │  (submitting │                   ▼
                     │   to target) │           ┌──────────────┐
                     └──────┬──────┘           │   RETRYING   │◀─┐
                            │                    │  (attempt N) │──┘
                   ┌────────┴────────┐          └──────┬──────┘
                   ▼                  ▼                 │
          ┌──────────────┐   ┌──────────────┐          ▼
          │  COMPLETED   │   │    FAILED    │  ┌──────────────┐
          │  (tokens     │   │  (unrecov-   │  │  STUCK       │
          │   delivered) │   │   erable)    │  │  (needs manual│
          └──────────────┘   └──────────────┘  │   intervention│
                                                └──────────────┘
```

---

## Core Interfaces

### BridgeService

```typescript
import { type TRPCContext } from '@mcv/trpc';

/**
 * Supported blockchain networks for bridging.
 */
export type ChainId =
  | 'solana'
  | 'ethereum'
  | 'polygon'
  | 'arbitrum';

/**
 * Supported bridge protocols.
 */
export type BridgeProtocol = 'wormhole' | 'layerzero';

/**
 * Bridge transfer direction.
 */
export type BridgeDirection = 'lock-and-mint' | 'burn-and-unlock';

/**
 * Transfer lifecycle states.
 */
export type BridgeStatus =
  | 'requested'
  | 'rejected'
  | 'initiated'
  | 'in_flight'
  | 'attested'
  | 'completing'
  | 'completed'
  | 'timed_out'
  | 'retrying'
  | 'failed'
  | 'stuck';

/**
 * Primary bridge service interface — all bridge operations flow through here.
 */
export interface BridgeService {
  /**
   * Initiate a cross-chain token transfer.
   * Performs all security checks before submitting to the source chain.
   */
  bridgeTokens(
    request: BridgeTransferRequest,
    ctx: TRPCContext,
  ): Promise<BridgeTransferResult>;

  /**
   * Estimate fees for a bridge transfer without executing it.
   * Includes source gas, bridge protocol fee, destination gas, and relayer fee.
   */
  estimateFees(
    sourceChain: ChainId,
    targetChain: ChainId,
    tokenMint: string,
    amount: bigint,
  ): Promise<FeeEstimate>;

  /**
   * Get the current status of a bridge transfer by ID.
   */
  getTransferStatus(transferId: string): Promise<BridgeTransfer | null>;

  /**
   * List transfers for a user with optional status filter.
   */
  listUserTransfers(
    userId: string,
    options?: {
      status?: BridgeStatus[];
      limit?: number;
      offset?: number;
      sourceChain?: ChainId;
      targetChain?: ChainId;
    },
  ): Promise<{ transfers: BridgeTransfer[]; total: number }>;

  /**
   * Get all available bridge routes for a token.
   */
  getAvailableRoutes(
    tokenMint: string,
    sourceChain?: ChainId,
  ): Promise<BridgeRoute[]>;

  /**
   * Retry a failed or timed-out bridge transfer.
   * Only certain failure states are retryable.
   */
  retryTransfer(transferId: string, ctx: TRPCContext): Promise<BridgeTransferResult>;

  /**
   * Manually complete a stuck transfer by providing a valid attestation.
   * Used for admin intervention when automated completion fails.
   */
  manualComplete(
    transferId: string,
    attestation: string,
    ctx: TRPCContext,
  ): Promise<BridgeTransferResult>;

  /**
   * Trigger emergency pause on all bridge operations.
   * Requires admin privileges.
   */
  emergencyPause(
    reason: EmergencyPauseReason,
    ctx: TRPCContext,
  ): Promise<void>;

  /**
   * Resume bridge operations after an emergency pause.
   * Requires admin privileges and a review confirmation.
   */
  resumeOperations(
    reviewNotes: string,
    ctx: TRPCContext,
  ): Promise<void>;

  /**
   * Get bridge health status across all protocols and routes.
   */
  getHealthStatus(): Promise<BridgeHealthStatus>;

  /**
   * Get bridge analytics for a time period.
   */
  getAnalytics(
    startDate: Date,
    endDate: Date,
    groupBy?: 'hour' | 'day' | 'week',
  ): Promise<BridgeAnalyticsSnapshot[]>;
}
```

### BridgeTransfer

```typescript
/**
 * Request to initiate a bridge transfer.
 */
export interface BridgeTransferRequest {
  /** User initiating the transfer. */
  userId: string;

  /** Source blockchain. */
  sourceChain: ChainId;

  /** Destination blockchain. */
  targetChain: ChainId;

  /** Token mint/contract address on the source chain. */
  sourceTokenAddress: string;

  /** Amount to bridge in the token's smallest denomination (lamports, wei). */
  amount: bigint;

  /** Recipient address on the target chain. If omitted, uses the user's registered address. */
  recipientAddress?: string;

  /** Preferred bridge protocol. If omitted, the route resolver picks the optimal one. */
  preferredProtocol?: BridgeProtocol;

  /** Maximum acceptable fee in USD. Transfer is rejected if estimated fees exceed this. */
  maxFeeUsd?: number;

  /** Slippage tolerance as a decimal (0.005 = 0.5%). Applies to wrapped/bridged token rate. */
  slippageTolerance?: number;

  /** Client-generated idempotency key to prevent duplicate submissions. */
  idempotencyKey: string;

  /** Optional metadata for tracking purposes. */
  metadata?: Record<string, string>;
}

/**
 * Result of a bridge transfer initiation or status check.
 */
export interface BridgeTransferResult {
  /** Whether the transfer was successfully initiated. */
  success: boolean;

  /** Transfer record (if initiated). */
  transfer?: BridgeTransfer;

  /** Error details (if failed). */
  error?: {
    code: BridgeErrorCode;
    message: string;
    retryable: boolean;
    retryAfterMs?: number;
  };
}

/**
 * Full bridge transfer record — represents a single cross-chain transfer at any lifecycle stage.
 */
export interface BridgeTransfer {
  /** Unique transfer identifier (UUIDv7). */
  id: string;

  /** User who initiated the transfer. */
  userId: string;

  /** Current transfer status. */
  status: BridgeStatus;

  /** Bridge protocol used for this transfer. */
  protocol: BridgeProtocol;

  /** Source chain identifier. */
  sourceChain: ChainId;

  /** Target chain identifier. */
  targetChain: ChainId;

  /** Token address on source chain. */
  sourceTokenAddress: string;

  /** Token address on target chain (wrapped/bridged equivalent). */
  targetTokenAddress: string;

  /** Amount in source token's smallest denomination. */
  amount: bigint;

  /** Amount received on target chain (after fees). */
  amountReceived?: bigint;

  /** Sender address on source chain. */
  senderAddress: string;

  /** Recipient address on target chain. */
  recipientAddress: string;

  /** Transaction hash on source chain (lock/burn tx). */
  sourceTxHash?: string;

  /** Transaction hash on target chain (mint/unlock tx). */
  targetTxHash?: string;

  /** Source chain block number where the lock/burn was confirmed. */
  sourceBlockNumber?: bigint;

  /** Target chain block number where the mint/unlock was confirmed. */
  targetBlockNumber?: bigint;

  /** Fee breakdown for this transfer. */
  fees: FeeEstimate;

  /** Bridge protocol-specific sequence number (e.g., Wormhole sequence). */
  protocolSequence?: string;

  /** Attestation/VAA data when available. */
  attestation?: BridgeAttestation;

  /** Number of retry attempts. */
  retryCount: number;

  /** Maximum allowed retry attempts. */
  maxRetries: number;

  /** Next retry timestamp (if in retrying state). */
  nextRetryAt?: Date;

  /** Idempotency key for deduplication. */
  idempotencyKey: string;

  /** Custom metadata. */
  metadata?: Record<string, string>;

  /** Human-readable status message. */
  statusMessage: string;

  /** When the transfer was requested. */
  createdAt: Date;

  /** When the transfer status was last updated. */
  updatedAt: Date;

  /** When the transfer was initiated on-chain. */
  initiatedAt?: Date;

  /** When the attestation was received. */
  attestedAt?: Date;

  /** When the transfer completed on the target chain. */
  completedAt?: Date;

  /** Total time from initiation to completion in milliseconds. */
  completionTimeMs?: number;
}
```

### BridgeRoute

```typescript
/**
 * A configured bridge route between two chains for a specific token.
 */
export interface BridgeRoute {
  /** Unique route identifier. */
  id: string;

  /** Source chain. */
  sourceChain: ChainId;

  /** Target chain. */
  targetChain: ChainId;

  /** Token address on the source chain. */
  sourceTokenAddress: string;

  /** Token address on the target chain. */
  targetTokenAddress: string;

  /** Token symbol (e.g., 'EDGE'). */
  tokenSymbol: string;

  /** Token decimals on source chain. */
  sourceDecimals: number;

  /** Token decimals on target chain. */
  targetDecimals: number;

  /** Bridge protocol used for this route. */
  protocol: BridgeProtocol;

  /** Bridge direction for this route. */
  direction: BridgeDirection;

  /** Whether this route is currently active. */
  isActive: boolean;

  /** Whether this route is paused (e.g., during maintenance). */
  isPaused: boolean;

  /** Minimum bridge amount in token's smallest denomination. */
  minAmount: bigint;

  /** Maximum bridge amount per transaction. */
  maxAmount: bigint;

  /** Maximum daily volume for this route. */
  maxDailyVolume: bigint;

  /** Current daily volume used. */
  currentDailyVolume: bigint;

  /** Estimated time to completion in seconds. */
  estimatedTimeSeconds: number;

  /** Protocol-specific route configuration. */
  protocolConfig: WormholeRouteConfig | LayerZeroRouteConfig;

  /** Priority ranking (lower = preferred). */
  priority: number;

  /** Route creation timestamp. */
  createdAt: Date;

  /** Last update timestamp. */
  updatedAt: Date;
}

/**
 * Wormhole-specific route configuration.
 */
export interface WormholeRouteConfig {
  protocol: 'wormhole';

  /** Wormhole chain ID for source. */
  sourceWormholeChainId: number;

  /** Wormhole chain ID for target. */
  targetWormholeChainId: number;

  /** Token bridge contract/program address on source. */
  sourceTokenBridgeAddress: string;

  /** Token bridge contract/program address on target. */
  targetTokenBridgeAddress: string;

  /** Core bridge contract/program address on source. */
  sourceCoreAddress: string;

  /** Core bridge contract/program address on target. */
  targetCoreAddress: string;

  /** Minimum guardian signatures required (default: 13/19). */
  minGuardianSignatures: number;

  /** Required finality on source chain before guardians attest. */
  requiredFinality: 'confirmed' | 'finalized';

  /** Whether to use automatic relaying via Wormhole relayer. */
  useAutomaticRelayer: boolean;
}

/**
 * LayerZero-specific route configuration.
 */
export interface LayerZeroRouteConfig {
  protocol: 'layerzero';

  /** LayerZero endpoint ID for source. */
  sourceEndpointId: number;

  /** LayerZero endpoint ID for target. */
  targetEndpointId: number;

  /** OFT (Omnichain Fungible Token) contract on source. */
  sourceOftAddress: string;

  /** OFT contract on target. */
  targetOftAddress: string;

  /** Required DVN (Decentralized Verifier Network) confirmations. */
  requiredDvnConfirmations: number;

  /** List of required DVN addresses. */
  requiredDvns: string[];

  /** Optional DVN addresses (any N of M). */
  optionalDvns: string[];

  /** Minimum optional DVN confirmations needed. */
  optionalDvnThreshold: number;

  /** Executor address for message delivery. */
  executorAddress: string;

  /** Gas limit for destination execution. */
  destinationGasLimit: bigint;
}
```

### BridgeAttestation

```typescript
/**
 * Bridge attestation/proof — cryptographic evidence that a source chain
 * event occurred, verified by the bridge protocol's security model.
 */
export interface BridgeAttestation {
  /** Unique attestation identifier. */
  id: string;

  /** Associated bridge transfer ID. */
  transferId: string;

  /** Bridge protocol that produced this attestation. */
  protocol: BridgeProtocol;

  /** Raw attestation bytes (hex-encoded). For Wormhole, this is the signed VAA. */
  attestationData: string;

  /** Hash of the attestation for quick lookup. */
  attestationHash: string;

  /** Attestation status. */
  status: 'pending' | 'verified' | 'invalid' | 'expired';

  /** Source chain transaction hash that was attested. */
  sourceTxHash: string;

  /** Source chain emitter address. */
  emitterAddress: string;

  /** Protocol-specific sequence number. */
  sequence: string;

  /** Number of verifier signatures on this attestation. */
  signatureCount: number;

  /** Minimum signatures required for validity. */
  requiredSignatures: number;

  /** List of verifier/guardian public keys that signed. */
  signers: string[];

  /** Attestation payload (decoded). */
  payload: {
    /** Token being bridged. */
    tokenAddress: string;
    /** Token chain of origin. */
    tokenChain: ChainId;
    /** Amount in bridge-normalized form. */
    amount: bigint;
    /** Recipient address on target chain. */
    recipient: string;
    /** Target chain. */
    targetChain: ChainId;
    /** Fee deducted by the protocol. */
    fee: bigint;
  };

  /** When this attestation was first observed. */
  observedAt: Date;

  /** When this attestation passed verification. */
  verifiedAt?: Date;

  /** Expiration timestamp (attestations have limited validity). */
  expiresAt: Date;

  /** Verification error message (if invalid). */
  verificationError?: string;
}
```

### BridgeConfig

```typescript
/**
 * Global bridge configuration — controls system-wide bridge behavior.
 */
export interface BridgeConfig {
  /** Configuration identifier. */
  id: string;

  /** Whether all bridge operations are currently enabled. */
  bridgingEnabled: boolean;

  /** Whether the system is in emergency pause mode. */
  emergencyPaused: boolean;

  /** Reason for emergency pause (if active). */
  emergencyPauseReason?: EmergencyPauseReason;

  /** Timestamp when emergency pause was activated. */
  emergencyPausedAt?: Date;

  /** Admin who activated the emergency pause. */
  emergencyPausedBy?: string;

  /** Global limits. */
  globalLimits: BridgeLimits;

  /** Per-user default limits (can be overridden per user). */
  defaultUserLimits: BridgeLimits;

  /** Supported protocols and their enabled status. */
  protocolStatus: Record<BridgeProtocol, {
    enabled: boolean;
    healthScore: number; // 0-100
    lastHealthCheck: Date;
    maintenanceMessage?: string;
  }>;

  /** Anomaly detection thresholds. */
  anomalyThresholds: {
    /** Max single transfer value in USD before requiring additional verification. */
    largeTransferThresholdUsd: number;
    /** Max hourly volume before triggering circuit breaker (in USD). */
    hourlyVolumeThresholdUsd: number;
    /** Max daily volume before triggering circuit breaker (in USD). */
    dailyVolumeThresholdUsd: number;
    /** Number of failed transfers in 1 hour before alerting. */
    failureRateThreshold: number;
    /** Backing ratio deviation threshold (e.g., 0.01 = 1% deviation). */
    backingDeviationThreshold: number;
  };

  /** Retry configuration. */
  retryConfig: {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
  };

  /** Last configuration update. */
  updatedAt: Date;

  /** Admin who last updated the config. */
  updatedBy: string;
}

/**
 * Bridge limits — applied at user or global level.
 */
export interface BridgeLimits {
  /** Maximum single transfer amount in USD. */
  maxTransferUsd: number;

  /** Maximum hourly transfer volume in USD. */
  maxHourlyVolumeUsd: number;

  /** Maximum daily transfer volume in USD. */
  maxDailyVolumeUsd: number;

  /** Maximum weekly transfer volume in USD. */
  maxWeeklyVolumeUsd: number;

  /** Maximum number of transfers per hour. */
  maxTransfersPerHour: number;

  /** Maximum number of transfers per day. */
  maxTransfersPerDay: number;

  /** Maximum concurrent pending transfers. */
  maxPendingTransfers: number;

  /** Cool-down period in seconds between transfers on the same route. */
  cooldownSeconds: number;
}

/**
 * Reasons for emergency pause activation.
 */
export type EmergencyPauseReason =
  | 'anomaly_detected'
  | 'backing_mismatch'
  | 'protocol_exploit_suspected'
  | 'high_failure_rate'
  | 'volume_spike'
  | 'manual_admin_action'
  | 'guardian_set_change'
  | 'chain_reorg_detected'
  | 'smart_contract_upgrade';
```

### FeeEstimate

```typescript
/**
 * Comprehensive fee estimate for a bridge transfer.
 * All values in the native token of each respective chain unless otherwise noted.
 */
export interface FeeEstimate {
  /** Total estimated fee in USD (sum of all components). */
  totalFeeUsd: number;

  /** Source chain gas fee for the lock/burn transaction. */
  sourceGasFee: {
    amount: bigint;
    token: string;        // e.g., 'SOL', 'ETH', 'MATIC'
    usdValue: number;
  };

  /** Bridge protocol fee (paid to Wormhole/LayerZero). */
  protocolFee: {
    amount: bigint;
    token: string;
    usdValue: number;
  };

  /** Destination chain gas fee for the mint/unlock transaction. */
  destinationGasFee: {
    amount: bigint;
    token: string;
    usdValue: number;
  };

  /** Relayer fee for automated delivery (if applicable). */
  relayerFee: {
    amount: bigint;
    token: string;
    usdValue: number;
  };

  /** MCV platform fee (percentage of transfer amount). */
  platformFee: {
    amount: bigint;
    token: string;
    usdValue: number;
    basisPoints: number;  // e.g., 25 = 0.25%
  };

  /** Net amount the recipient will receive after all fees. */
  netReceivedAmount: bigint;

  /** Exchange rate applied (if any decimal conversion needed). */
  exchangeRate: number;

  /** Protocol used for this estimate. */
  protocol: BridgeProtocol;

  /** Estimated completion time in seconds. */
  estimatedTimeSeconds: number;

  /** When this estimate was computed (expires after ~60 seconds). */
  estimatedAt: Date;

  /** Whether the gas price environment is favorable. */
  gasPriceLevel: 'low' | 'medium' | 'high' | 'extreme';

  /** Recommendation on whether to proceed now or wait. */
  recommendation: 'proceed' | 'wait_for_lower_gas' | 'consider_alternative_route';

  /** Alternative routes with potentially lower fees. */
  alternatives?: Array<{
    protocol: BridgeProtocol;
    totalFeeUsd: number;
    estimatedTimeSeconds: number;
  }>;
}
```

### Additional Types

```typescript
/**
 * Velocity check result — determines if a transfer passes rate-limiting rules.
 */
export interface VelocityCheckResult {
  allowed: boolean;
  reason?: string;
  currentHourlyVolumeUsd: number;
  currentDailyVolumeUsd: number;
  currentWeeklyVolumeUsd: number;
  transfersInLastHour: number;
  transfersInLastDay: number;
  pendingTransferCount: number;
  limitHit?: keyof BridgeLimits;
  retryAfterSeconds?: number;
}

/**
 * Monitor event emitted during transfer lifecycle.
 */
export interface BridgeMonitorEvent {
  transferId: string;
  eventType:
    | 'status_changed'
    | 'attestation_received'
    | 'retry_scheduled'
    | 'completion_submitted'
    | 'fee_updated'
    | 'anomaly_detected'
    | 'manual_intervention_required';
  previousStatus?: BridgeStatus;
  newStatus?: BridgeStatus;
  details: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Security alert generated by the anomaly detection system.
 */
export interface BridgeSecurityAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  alertType:
    | 'large_transfer'
    | 'volume_spike'
    | 'backing_mismatch'
    | 'high_failure_rate'
    | 'suspicious_pattern'
    | 'protocol_anomaly'
    | 'reorg_detected';
  message: string;
  details: Record<string, unknown>;
  transferId?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  autoAction?: 'none' | 'pause_route' | 'pause_all' | 'alert_only';
  createdAt: Date;
}

/**
 * Reconciliation report — comparison of expected vs actual bridged token supply.
 */
export interface ReconciliationReport {
  id: string;
  chain: ChainId;
  tokenAddress: string;
  tokenSymbol: string;
  /** Expected supply based on successful bridge transfers. */
  expectedSupply: bigint;
  /** Actual on-chain supply of the bridged token. */
  actualSupply: bigint;
  /** Difference (actual - expected). Negative means potential issue. */
  deviation: bigint;
  /** Deviation as a percentage. */
  deviationPercent: number;
  /** Whether the deviation exceeds the configured threshold. */
  isAnomalous: boolean;
  /** Total locked/burned on source chain. */
  sourceLockedAmount: bigint;
  /** When this reconciliation was performed. */
  reconciledAt: Date;
}

/**
 * Bridge health status for monitoring dashboards.
 */
export interface BridgeHealthStatus {
  /** Overall health: green/yellow/red. */
  overall: 'healthy' | 'degraded' | 'critical' | 'paused';

  /** Whether emergency pause is active. */
  emergencyPaused: boolean;

  /** Per-protocol health. */
  protocols: Record<BridgeProtocol, {
    status: 'healthy' | 'degraded' | 'down';
    latencyMs: number;
    successRate24h: number;
    lastSuccessfulTransfer?: Date;
    activeTransfers: number;
  }>;

  /** Per-route health. */
  routes: Array<{
    routeId: string;
    sourceChain: ChainId;
    targetChain: ChainId;
    tokenSymbol: string;
    status: 'active' | 'paused' | 'degraded';
    avgCompletionTimeMs: number;
    dailyVolume: bigint;
    dailyVolumeUsd: number;
  }>;

  /** Recent alerts. */
  recentAlerts: BridgeSecurityAlert[];

  /** Last reconciliation results. */
  lastReconciliation: ReconciliationReport[];

  /** Timestamp of this health check. */
  checkedAt: Date;
}

/**
 * Bridge analytics snapshot for a time window.
 */
export interface BridgeAnalyticsSnapshot {
  /** Start of the time window. */
  windowStart: Date;

  /** End of the time window. */
  windowEnd: Date;

  /** Total number of bridge transfers initiated. */
  totalTransfers: number;

  /** Number of successfully completed transfers. */
  completedTransfers: number;

  /** Number of failed transfers. */
  failedTransfers: number;

  /** Success rate (0-1). */
  successRate: number;

  /** Total volume bridged (in USD). */
  totalVolumeUsd: number;

  /** Total fees collected (in USD). */
  totalFeesUsd: number;

  /** Average completion time in milliseconds. */
  avgCompletionTimeMs: number;

  /** Median completion time in milliseconds. */
  medianCompletionTimeMs: number;

  /** 95th percentile completion time. */
  p95CompletionTimeMs: number;

  /** Volume breakdown by route. */
  volumeByRoute: Array<{
    sourceChain: ChainId;
    targetChain: ChainId;
    tokenSymbol: string;
    protocol: BridgeProtocol;
    volumeUsd: number;
    transferCount: number;
  }>;

  /** Unique users who bridged during this window. */
  uniqueUsers: number;

  /** Average transfer size in USD. */
  avgTransferSizeUsd: number;
}
```

---

## Database Schemas

### bridge_transfers

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  integer,
  timestamp,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Core bridge transfers table — every cross-chain transfer is tracked here.
 * This is the most critical table in the bridge module; it must be durable
 * and consistent. All status transitions are atomic.
 */
export const bridgeTransfers = pgTable(
  'bridge_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: varchar('user_id', { length: 64 }).notNull(),

    status: varchar('status', { length: 32 }).notNull().default('requested'),

    protocol: varchar('protocol', { length: 32 }).notNull(),

    sourceChain: varchar('source_chain', { length: 32 }).notNull(),
    targetChain: varchar('target_chain', { length: 32 }).notNull(),

    sourceTokenAddress: varchar('source_token_address', { length: 128 }).notNull(),
    targetTokenAddress: varchar('target_token_address', { length: 128 }).notNull(),

    tokenSymbol: varchar('token_symbol', { length: 32 }).notNull(),

    /** Amount in the token's smallest denomination (stored as numeric string for precision). */
    amount: bigint('amount', { mode: 'bigint' }).notNull(),

    /** Amount received after all fees. */
    amountReceived: bigint('amount_received', { mode: 'bigint' }),

    senderAddress: varchar('sender_address', { length: 128 }).notNull(),
    recipientAddress: varchar('recipient_address', { length: 128 }).notNull(),

    sourceTxHash: varchar('source_tx_hash', { length: 128 }),
    targetTxHash: varchar('target_tx_hash', { length: 128 }),

    sourceBlockNumber: bigint('source_block_number', { mode: 'bigint' }),
    targetBlockNumber: bigint('target_block_number', { mode: 'bigint' }),

    /** Full fee breakdown as JSON. */
    fees: jsonb('fees').notNull(),

    /** Bridge protocol sequence number (e.g., Wormhole VAA sequence). */
    protocolSequence: varchar('protocol_sequence', { length: 128 }),

    retryCount: integer('retry_count').notNull().default(0),
    maxRetries: integer('max_retries').notNull().default(5),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),

    /** Idempotency key to prevent duplicate submissions. */
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull(),

    /** Human-readable status message. */
    statusMessage: text('status_message').notNull().default(''),

    /** Additional metadata as JSON. */
    metadata: jsonb('metadata'),

    /** Whether this transfer has been reconciled against on-chain state. */
    reconciled: boolean('reconciled').notNull().default(false),
    reconciledAt: timestamp('reconciled_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    initiatedAt: timestamp('initiated_at', { withTimezone: true }),
    attestedAt: timestamp('attested_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    /** Total time from initiation to completion in milliseconds. */
    completionTimeMs: integer('completion_time_ms'),
  },
  (table) => ({
    userIdIdx: index('bridge_transfers_user_id_idx').on(table.userId),
    statusIdx: index('bridge_transfers_status_idx').on(table.status),
    sourceChainIdx: index('bridge_transfers_source_chain_idx').on(table.sourceChain),
    targetChainIdx: index('bridge_transfers_target_chain_idx').on(table.targetChain),
    protocolIdx: index('bridge_transfers_protocol_idx').on(table.protocol),
    sourceTxHashIdx: index('bridge_transfers_source_tx_hash_idx').on(table.sourceTxHash),
    targetTxHashIdx: index('bridge_transfers_target_tx_hash_idx').on(table.targetTxHash),
    idempotencyIdx: uniqueIndex('bridge_transfers_idempotency_idx').on(table.idempotencyKey),
    createdAtIdx: index('bridge_transfers_created_at_idx').on(table.createdAt),
    statusCreatedIdx: index('bridge_transfers_status_created_idx').on(table.status, table.createdAt),
    pendingRetryIdx: index('bridge_transfers_pending_retry_idx').on(table.status, table.nextRetryAt),
    userStatusIdx: index('bridge_transfers_user_status_idx').on(table.userId, table.status),
    reconciledIdx: index('bridge_transfers_reconciled_idx').on(table.reconciled),
    protocolSequenceIdx: index('bridge_transfers_protocol_seq_idx').on(
      table.protocol,
      table.protocolSequence,
    ),
  }),
);
```

### bridge_routes

```typescript
/**
 * Bridge routes — defines available paths for cross-chain token transfers.
 * Routes can be activated/deactivated and have per-route limits.
 */
export const bridgeRoutes = pgTable(
  'bridge_routes',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    sourceChain: varchar('source_chain', { length: 32 }).notNull(),
    targetChain: varchar('target_chain', { length: 32 }).notNull(),

    sourceTokenAddress: varchar('source_token_address', { length: 128 }).notNull(),
    targetTokenAddress: varchar('target_token_address', { length: 128 }).notNull(),

    tokenSymbol: varchar('token_symbol', { length: 32 }).notNull(),
    sourceDecimals: integer('source_decimals').notNull(),
    targetDecimals: integer('target_decimals').notNull(),

    protocol: varchar('protocol', { length: 32 }).notNull(),
    direction: varchar('direction', { length: 32 }).notNull(),

    isActive: boolean('is_active').notNull().default(true),
    isPaused: boolean('is_paused').notNull().default(false),
    pauseReason: text('pause_reason'),

    /** Minimum bridge amount in token's smallest denomination. */
    minAmount: bigint('min_amount', { mode: 'bigint' }).notNull(),
    /** Maximum bridge amount per transaction. */
    maxAmount: bigint('max_amount', { mode: 'bigint' }).notNull(),
    /** Maximum daily volume. */
    maxDailyVolume: bigint('max_daily_volume', { mode: 'bigint' }).notNull(),
    /** Current day's volume (reset daily by cron). */
    currentDailyVolume: bigint('current_daily_volume', { mode: 'bigint' }).notNull().default(0n),
    /** Last volume reset timestamp. */
    volumeResetAt: timestamp('volume_reset_at', { withTimezone: true }).notNull().defaultNow(),

    /** Estimated completion time in seconds. */
    estimatedTimeSeconds: integer('estimated_time_seconds').notNull().default(600),

    /** Protocol-specific config as JSON. */
    protocolConfig: jsonb('protocol_config').notNull(),

    /** Route priority (lower = preferred). */
    priority: integer('priority').notNull().default(100),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    routeLookupIdx: index('bridge_routes_lookup_idx').on(
      table.sourceChain,
      table.targetChain,
      table.sourceTokenAddress,
    ),
    tokenSymbolIdx: index('bridge_routes_token_symbol_idx').on(table.tokenSymbol),
    protocolIdx: index('bridge_routes_protocol_idx').on(table.protocol),
    activeIdx: index('bridge_routes_active_idx').on(table.isActive, table.isPaused),
    routeUniqueIdx: uniqueIndex('bridge_routes_unique_idx').on(
      table.sourceChain,
      table.targetChain,
      table.sourceTokenAddress,
      table.protocol,
    ),
  }),
);
```

### bridge_configs

```typescript
/**
 * Global bridge configuration — singleton table with system-wide settings.
 * Uses optimistic locking via updatedAt to prevent concurrent config changes.
 */
export const bridgeConfigs = pgTable('bridge_configs', {
  id: uuid('id').primaryKey().defaultRandom(),

  bridgingEnabled: boolean('bridging_enabled').notNull().default(true),

  emergencyPaused: boolean('emergency_paused').notNull().default(false),
  emergencyPauseReason: varchar('emergency_pause_reason', { length: 64 }),
  emergencyPausedAt: timestamp('emergency_paused_at', { withTimezone: true }),
  emergencyPausedBy: varchar('emergency_paused_by', { length: 64 }),

  /** Global limits as JSON. */
  globalLimits: jsonb('global_limits').notNull(),

  /** Default per-user limits as JSON. */
  defaultUserLimits: jsonb('default_user_limits').notNull(),

  /** Protocol status map as JSON. */
  protocolStatus: jsonb('protocol_status').notNull(),

  /** Anomaly detection thresholds as JSON. */
  anomalyThresholds: jsonb('anomaly_thresholds').notNull(),

  /** Retry configuration as JSON. */
  retryConfig: jsonb('retry_config').notNull(),

  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 64 }).notNull(),
});
```

### bridge_attestations

```typescript
/**
 * Bridge attestations — cryptographic proofs from bridge protocols.
 * Each attestation links to exactly one transfer and contains the
 * raw signed data, verification status, and decoded payload.
 */
export const bridgeAttestations = pgTable(
  'bridge_attestations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    transferId: uuid('transfer_id')
      .notNull()
      .references(() => bridgeTransfers.id, { onDelete: 'cascade' }),

    protocol: varchar('protocol', { length: 32 }).notNull(),

    /** Raw attestation bytes (hex-encoded). */
    attestationData: text('attestation_data').notNull(),

    /** Hash of the attestation for deduplication and lookup. */
    attestationHash: varchar('attestation_hash', { length: 128 }).notNull(),

    status: varchar('status', { length: 32 }).notNull().default('pending'),

    sourceTxHash: varchar('source_tx_hash', { length: 128 }).notNull(),
    emitterAddress: varchar('emitter_address', { length: 128 }).notNull(),
    sequence: varchar('sequence', { length: 64 }).notNull(),

    signatureCount: integer('signature_count').notNull(),
    requiredSignatures: integer('required_signatures').notNull(),

    /** List of signer public keys as JSON array. */
    signers: jsonb('signers').notNull(),

    /** Decoded payload as JSON. */
    payload: jsonb('payload').notNull(),

    observedAt: timestamp('observed_at', { withTimezone: true }).notNull().defaultNow(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    /** Verification error message if invalid. */
    verificationError: text('verification_error'),
  },
  (table) => ({
    transferIdIdx: index('bridge_attestations_transfer_id_idx').on(table.transferId),
    attestationHashIdx: uniqueIndex('bridge_attestations_hash_idx').on(table.attestationHash),
    statusIdx: index('bridge_attestations_status_idx').on(table.status),
    protocolSequenceIdx: index('bridge_attestations_protocol_seq_idx').on(
      table.protocol,
      table.emitterAddress,
      table.sequence,
    ),
    expiresAtIdx: index('bridge_attestations_expires_at_idx').on(table.expiresAt),
  }),
);
```

### bridge_analytics

```typescript
/**
 * Aggregated bridge analytics — pre-computed metrics for dashboards and reporting.
 * Populated by a periodic aggregation job (runs every hour).
 */
export const bridgeAnalytics = pgTable(
  'bridge_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Start of the time window. */
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),

    /** End of the time window. */
    windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),

    /** Granularity: hour, day, week. */
    granularity: varchar('granularity', { length: 16 }).notNull(),

    /** Optional chain filter (null = all chains). */
    sourceChain: varchar('source_chain', { length: 32 }),
    targetChain: varchar('target_chain', { length: 32 }),

    /** Optional token filter (null = all tokens). */
    tokenSymbol: varchar('token_symbol', { length: 32 }),

    /** Optional protocol filter (null = all protocols). */
    protocol: varchar('protocol', { length: 32 }),

    totalTransfers: integer('total_transfers').notNull().default(0),
    completedTransfers: integer('completed_transfers').notNull().default(0),
    failedTransfers: integer('failed_transfers').notNull().default(0),

    /** Total volume in USD. */
    totalVolumeUsd: bigint('total_volume_usd', { mode: 'number' }).notNull().default(0),

    /** Total fees collected in USD (cents for precision). */
    totalFeesUsdCents: integer('total_fees_usd_cents').notNull().default(0),

    avgCompletionTimeMs: integer('avg_completion_time_ms'),
    medianCompletionTimeMs: integer('median_completion_time_ms'),
    p95CompletionTimeMs: integer('p95_completion_time_ms'),

    uniqueUsers: integer('unique_users').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    windowIdx: index('bridge_analytics_window_idx').on(
      table.windowStart,
      table.windowEnd,
      table.granularity,
    ),
    chainRouteIdx: index('bridge_analytics_chain_route_idx').on(
      table.sourceChain,
      table.targetChain,
      table.tokenSymbol,
    ),
    granularityIdx: index('bridge_analytics_granularity_idx').on(table.granularity),
    uniqueWindowIdx: uniqueIndex('bridge_analytics_unique_window_idx').on(
      table.windowStart,
      table.granularity,
      table.sourceChain,
      table.targetChain,
      table.tokenSymbol,
      table.protocol,
    ),
  }),
);
```

### bridge_audit_log

```typescript
/**
 * Immutable audit log for all bridge-related actions and state transitions.
 * This table is append-only — no updates or deletes.
 */
export const bridgeAuditLog = pgTable(
  'bridge_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Type of auditable event. */
    eventType: varchar('event_type', { length: 64 }).notNull(),

    /** Associated transfer ID (if applicable). */
    transferId: uuid('transfer_id'),

    /** User who triggered the action (null for system actions). */
    actorId: varchar('actor_id', { length: 64 }),

    /** Actor type. */
    actorType: varchar('actor_type', { length: 16 }).notNull().default('system'),

    /** Previous state (for status transitions). */
    previousState: jsonb('previous_state'),

    /** New state. */
    newState: jsonb('new_state'),

    /** Additional context. */
    details: jsonb('details'),

    /** IP address of the request (if user-initiated). */
    ipAddress: varchar('ip_address', { length: 45 }),

    /** Timestamp (with microsecond precision for ordering). */
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    eventTypeIdx: index('bridge_audit_log_event_type_idx').on(table.eventType),
    transferIdIdx: index('bridge_audit_log_transfer_id_idx').on(table.transferId),
    actorIdIdx: index('bridge_audit_log_actor_id_idx').on(table.actorId),
    createdAtIdx: index('bridge_audit_log_created_at_idx').on(table.createdAt),
  }),
);
```

### bridged_asset_supply

```typescript
/**
 * Tracks the expected supply of bridged assets on each chain.
 * Used by the reconciliation engine to detect supply mismatches.
 */
export const bridgedAssetSupply = pgTable(
  'bridged_asset_supply',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    chain: varchar('chain', { length: 32 }).notNull(),
    tokenAddress: varchar('token_address', { length: 128 }).notNull(),
    tokenSymbol: varchar('token_symbol', { length: 32 }).notNull(),

    /** Expected supply based on completed bridge transfers (computed). */
    expectedSupply: bigint('expected_supply', { mode: 'bigint' }).notNull().default(0n),

    /** Actual on-chain supply (updated by reconciliation job). */
    actualSupply: bigint('actual_supply', { mode: 'bigint' }),

    /** Deviation between expected and actual. */
    deviation: bigint('deviation', { mode: 'bigint' }),

    /** Deviation as basis points (100 = 1%). */
    deviationBps: integer('deviation_bps'),

    /** Whether current deviation exceeds threshold. */
    isAnomalous: boolean('is_anomalous').notNull().default(false),

    /** Total amount locked on source chains backing this bridged token. */
    totalLockedBacking: bigint('total_locked_backing', { mode: 'bigint' }),

    lastReconciledAt: timestamp('last_reconciled_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    chainTokenIdx: uniqueIndex('bridged_asset_supply_chain_token_idx').on(
      table.chain,
      table.tokenAddress,
    ),
    anomalousIdx: index('bridged_asset_supply_anomalous_idx').on(table.isAnomalous),
    tokenSymbolIdx: index('bridged_asset_supply_token_symbol_idx').on(table.tokenSymbol),
  }),
);
```

---

## Code Examples

### 1. Bridge Tokens (Solana → Ethereum)

```typescript
import { BridgeService } from '@mcv/web3-core/bridge';
import { v7 as uuidv7 } from 'uuid';

/**
 * Bridge EDGE tokens from Solana to Ethereum.
 * The service handles protocol selection, security checks, and initiation.
 */
async function bridgeEdgeToEthereum(
  bridgeService: BridgeService,
  ctx: TRPCContext,
) {
  // Step 1: Estimate fees before committing
  const feeEstimate = await bridgeService.estimateFees(
    'solana',
    'ethereum',
    'EDGEtoken111111111111111111111111111111111', // EDGE mint on Solana
    BigInt(1_000_000_000), // 1,000 EDGE (assuming 6 decimals = 1B lamports)
  );

  console.log('Fee breakdown:', {
    sourceGas: `${feeEstimate.sourceGasFee.usdValue} USD`,
    protocolFee: `${feeEstimate.protocolFee.usdValue} USD`,
    destGas: `${feeEstimate.destinationGasFee.usdValue} USD`,
    relayerFee: `${feeEstimate.relayerFee.usdValue} USD`,
    platformFee: `${feeEstimate.platformFee.usdValue} USD (${feeEstimate.platformFee.basisPoints} bps)`,
    total: `${feeEstimate.totalFeeUsd} USD`,
    netReceived: feeEstimate.netReceivedAmount.toString(),
    estimatedTime: `${feeEstimate.estimatedTimeSeconds}s`,
    recommendation: feeEstimate.recommendation,
  });

  // Step 2: Proceed if fees are acceptable
  if (feeEstimate.recommendation === 'wait_for_lower_gas') {
    console.log('Gas prices are high — consider waiting');
    return;
  }

  // Step 3: Initiate the bridge transfer
  const result = await bridgeService.bridgeTokens(
    {
      userId: ctx.session.userId,
      sourceChain: 'solana',
      targetChain: 'ethereum',
      sourceTokenAddress: 'EDGEtoken111111111111111111111111111111111',
      amount: BigInt(1_000_000_000),
      recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      maxFeeUsd: 50.00,
      slippageTolerance: 0.005, // 0.5%
      idempotencyKey: uuidv7(),
      metadata: {
        reason: 'portfolio_rebalance',
        clientVersion: '2.1.0',
      },
    },
    ctx,
  );

  if (result.success && result.transfer) {
    console.log('Bridge transfer initiated:', {
      id: result.transfer.id,
      status: result.transfer.status,
      protocol: result.transfer.protocol,
      sourceTxHash: result.transfer.sourceTxHash,
      estimatedTime: `${feeEstimate.estimatedTimeSeconds}s`,
    });
  } else if (result.error) {
    console.error('Bridge failed:', {
      code: result.error.code,
      message: result.error.message,
      retryable: result.error.retryable,
      retryAfterMs: result.error.retryAfterMs,
    });
  }
}
```

### 2. Estimate Fees Across Routes

```typescript
import { BridgeService, type FeeEstimate } from '@mcv/web3-core/bridge';

/**
 * Compare fees across all available routes for a bridge transfer.
 * Useful for showing users the cheapest/fastest option.
 */
async function compareBridgeRoutes(
  bridgeService: BridgeService,
  tokenMint: string,
  amount: bigint,
  sourceChain: ChainId,
  targetChain: ChainId,
): Promise<{
  cheapest: FeeEstimate;
  fastest: FeeEstimate;
  all: FeeEstimate[];
}> {
  // Get available routes
  const routes = await bridgeService.getAvailableRoutes(tokenMint, sourceChain);

  // Filter to routes that go to the desired target chain
  const relevantRoutes = routes.filter(
    (r) => r.targetChain === targetChain && r.isActive && !r.isPaused,
  );

  if (relevantRoutes.length === 0) {
    throw new Error(
      `No active routes from ${sourceChain} to ${targetChain} for token ${tokenMint}`,
    );
  }

  // Estimate fees for each route
  const estimates: FeeEstimate[] = [];
  for (const route of relevantRoutes) {
    try {
      const estimate = await bridgeService.estimateFees(
        sourceChain,
        targetChain,
        tokenMint,
        amount,
      );
      estimates.push(estimate);
    } catch (err) {
      console.warn(`Fee estimation failed for route ${route.id}:`, err);
    }
  }

  if (estimates.length === 0) {
    throw new Error('All fee estimations failed — bridge may be unavailable');
  }

  // Sort by total fee (cheapest first)
  const byFee = [...estimates].sort((a, b) => a.totalFeeUsd - b.totalFeeUsd);

  // Sort by time (fastest first)
  const byTime = [...estimates].sort(
    (a, b) => a.estimatedTimeSeconds - b.estimatedTimeSeconds,
  );

  return {
    cheapest: byFee[0],
    fastest: byTime[0],
    all: estimates,
  };
}

// Usage
const comparison = await compareBridgeRoutes(
  bridgeService,
  'EDGEtoken111111111111111111111111111111111',
  BigInt(5_000_000_000), // 5,000 EDGE
  'solana',
  'polygon',
);

console.log(`Cheapest: ${comparison.cheapest.protocol} — $${comparison.cheapest.totalFeeUsd}`);
console.log(`Fastest: ${comparison.fastest.protocol} — ${comparison.fastest.estimatedTimeSeconds}s`);
```

### 3. Monitor a Bridge Transfer

```typescript
import {
  BridgeTransferMonitor,
  type BridgeMonitorEvent,
  type BridgeTransfer,
} from '@mcv/web3-core/bridge';

/**
 * Monitor a bridge transfer from initiation through completion.
 * Uses polling with exponential backoff. In production, this would
 * be supplemented by WebSocket updates from the transfer monitor service.
 */
async function monitorBridgeTransfer(
  bridgeService: BridgeService,
  transferId: string,
  options: {
    onStatusChange?: (transfer: BridgeTransfer) => void;
    onComplete?: (transfer: BridgeTransfer) => void;
    onFailed?: (transfer: BridgeTransfer) => void;
    timeoutMs?: number;
  } = {},
): Promise<BridgeTransfer> {
  const { timeoutMs = 30 * 60 * 1000 } = options; // 30 min default timeout
  const startTime = Date.now();

  let previousStatus: BridgeStatus | null = null;
  let pollIntervalMs = 5_000; // Start at 5 seconds
  const maxPollIntervalMs = 30_000; // Max 30 seconds

  while (Date.now() - startTime < timeoutMs) {
    const transfer = await bridgeService.getTransferStatus(transferId);

    if (!transfer) {
      throw new Error(`Transfer ${transferId} not found`);
    }

    // Notify on status change
    if (transfer.status !== previousStatus) {
      console.log(
        `[Bridge Monitor] Transfer ${transferId}: ${previousStatus ?? 'initial'} → ${transfer.status}`,
        {
          sourceTxHash: transfer.sourceTxHash,
          targetTxHash: transfer.targetTxHash,
          retryCount: transfer.retryCount,
          statusMessage: transfer.statusMessage,
        },
      );

      options.onStatusChange?.(transfer);
      previousStatus = transfer.status;

      // Reset poll interval on status change
      pollIntervalMs = 5_000;
    }

    // Terminal states
    if (transfer.status === 'completed') {
      console.log(`[Bridge Monitor] Transfer completed in ${transfer.completionTimeMs}ms`, {
        targetTxHash: transfer.targetTxHash,
        amountReceived: transfer.amountReceived?.toString(),
      });
      options.onComplete?.(transfer);
      return transfer;
    }

    if (transfer.status === 'failed' || transfer.status === 'rejected') {
      console.error(`[Bridge Monitor] Transfer ${transfer.status}:`, transfer.statusMessage);
      options.onFailed?.(transfer);
      return transfer;
    }

    if (transfer.status === 'stuck') {
      console.warn(`[Bridge Monitor] Transfer is stuck — may need manual intervention`);
      options.onFailed?.(transfer);
      return transfer;
    }

    // Wait before next poll (with exponential backoff)
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    pollIntervalMs = Math.min(pollIntervalMs * 1.5, maxPollIntervalMs);
  }

  throw new Error(`Transfer ${transferId} monitoring timed out after ${timeoutMs}ms`);
}

// Usage
const transfer = await monitorBridgeTransfer(bridgeService, 'transfer-uuid-here', {
  onStatusChange: (t) => {
    // Update UI with new status
    updateUI({ status: t.status, message: t.statusMessage });
  },
  onComplete: (t) => {
    showNotification(`Bridge complete! Received ${t.amountReceived} on ${t.targetChain}`);
  },
  onFailed: (t) => {
    showError(`Bridge failed: ${t.statusMessage}`);
  },
});
```

### 4. Verify an Attestation

```typescript
import {
  AttestationVerifier,
  VAAVerifier,
  type BridgeAttestation,
} from '@mcv/web3-core/bridge';

/**
 * Verify a Wormhole VAA (Verified Action Approval) before releasing tokens.
 * This is the security-critical function — never release tokens without
 * full attestation verification.
 */
async function verifyWormholeAttestation(
  vaaVerifier: VAAVerifier,
  attestationVerifier: AttestationVerifier,
  vaaBytes: Uint8Array,
  expectedTransfer: {
    sourceChain: ChainId;
    targetChain: ChainId;
    tokenAddress: string;
    amount: bigint;
    recipient: string;
  },
): Promise<{ verified: boolean; attestation?: BridgeAttestation; error?: string }> {
  // Step 1: Parse the VAA structure
  const parsedVaa = vaaVerifier.parseVAA(vaaBytes);

  if (!parsedVaa) {
    return { verified: false, error: 'Failed to parse VAA — invalid format' };
  }

  // Step 2: Verify guardian signatures
  // Wormhole requires 13 of 19 guardians (2/3 + 1 supermajority)
  const signatureResult = await vaaVerifier.verifyGuardianSignatures(parsedVaa, {
    minSignatures: 13,
    currentGuardianSet: await vaaVerifier.getCurrentGuardianSet(),
  });

  if (!signatureResult.valid) {
    return {
      verified: false,
      error: `Insufficient guardian signatures: ${signatureResult.validCount}/${signatureResult.requiredCount}. `
        + `Invalid signers: ${signatureResult.invalidSigners.join(', ')}`,
    };
  }

  // Step 3: Verify the VAA has not been replayed
  const replayCheck = await attestationVerifier.checkReplay(parsedVaa.hash);

  if (replayCheck.isReplay) {
    return {
      verified: false,
      error: `VAA replay detected — attestation ${parsedVaa.hash} was already processed `
        + `for transfer ${replayCheck.existingTransferId}`,
    };
  }

  // Step 4: Verify payload matches the expected transfer
  const payload = vaaVerifier.decodeTransferPayload(parsedVaa.payload);

  if (payload.tokenAddress !== expectedTransfer.tokenAddress) {
    return {
      verified: false,
      error: `Token mismatch: VAA attests ${payload.tokenAddress}, expected ${expectedTransfer.tokenAddress}`,
    };
  }

  if (payload.amount !== expectedTransfer.amount) {
    return {
      verified: false,
      error: `Amount mismatch: VAA attests ${payload.amount}, expected ${expectedTransfer.amount}`,
    };
  }

  if (payload.recipient.toLowerCase() !== expectedTransfer.recipient.toLowerCase()) {
    return {
      verified: false,
      error: `Recipient mismatch: VAA attests ${payload.recipient}, expected ${expectedTransfer.recipient}`,
    };
  }

  if (payload.targetChain !== expectedTransfer.targetChain) {
    return {
      verified: false,
      error: `Target chain mismatch: VAA attests ${payload.targetChain}, expected ${expectedTransfer.targetChain}`,
    };
  }

  // Step 5: Verify VAA has not expired
  if (parsedVaa.expiresAt && parsedVaa.expiresAt < new Date()) {
    return {
      verified: false,
      error: `VAA expired at ${parsedVaa.expiresAt.toISOString()}`,
    };
  }

  // Step 6: Verify source chain finality
  const finalityCheck = await attestationVerifier.verifySourceFinality(
    expectedTransfer.sourceChain,
    parsedVaa.emitterAddress,
    parsedVaa.sequence,
  );

  if (!finalityCheck.finalized) {
    return {
      verified: false,
      error: `Source transaction not yet finalized. Current: ${finalityCheck.currentConfirmations}, `
        + `Required: ${finalityCheck.requiredConfirmations}`,
    };
  }

  // All checks passed — attestation is valid
  const attestation: BridgeAttestation = {
    id: crypto.randomUUID(),
    transferId: '', // Will be set by caller
    protocol: 'wormhole',
    attestationData: Buffer.from(vaaBytes).toString('hex'),
    attestationHash: parsedVaa.hash,
    status: 'verified',
    sourceTxHash: parsedVaa.sourceTxHash,
    emitterAddress: parsedVaa.emitterAddress,
    sequence: parsedVaa.sequence.toString(),
    signatureCount: signatureResult.validCount,
    requiredSignatures: signatureResult.requiredCount,
    signers: signatureResult.validSigners,
    payload: {
      tokenAddress: payload.tokenAddress,
      tokenChain: expectedTransfer.sourceChain,
      amount: payload.amount,
      recipient: payload.recipient,
      targetChain: payload.targetChain,
      fee: payload.fee,
    },
    observedAt: new Date(),
    verifiedAt: new Date(),
    expiresAt: parsedVaa.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  return { verified: true, attestation };
}
```

### 5. Emergency Pause Bridge Operations

```typescript
import {
  BridgeService,
  BridgeCircuitBreaker,
  type EmergencyPauseReason,
  type BridgeSecurityAlert,
} from '@mcv/web3-core/bridge';

/**
 * Emergency pause implementation — halts all bridge operations.
 * This is the nuclear option. Use when a potential exploit or
 * critical anomaly is detected. Can be triggered automatically
 * by the anomaly detection system or manually by an admin.
 */
async function handleEmergencyPause(
  bridgeService: BridgeService,
  circuitBreaker: BridgeCircuitBreaker,
  reason: EmergencyPauseReason,
  ctx: TRPCContext,
  alertDetails?: BridgeSecurityAlert,
) {
  // Step 1: Activate the circuit breaker immediately
  // This blocks ALL new bridge initiations within milliseconds
  await circuitBreaker.trip({
    reason,
    triggeredBy: ctx.session.userId,
    triggeredAt: new Date(),
    autoTriggered: reason !== 'manual_admin_action',
    alertId: alertDetails?.id,
  });

  console.error('[BRIDGE EMERGENCY] Circuit breaker tripped:', {
    reason,
    triggeredBy: ctx.session.userId,
    alertId: alertDetails?.id,
  });

  // Step 2: Pause via the bridge service (persists to database)
  await bridgeService.emergencyPause(reason, ctx);

  // Step 3: Freeze all in-flight transfers
  // Don't cancel them — just prevent any new completions
  // until the situation is assessed
  const inFlightTransfers = await bridgeService.listUserTransfers('*', {
    status: ['in_flight', 'attested', 'completing', 'retrying'],
    limit: 10000,
  });

  console.error(
    `[BRIDGE EMERGENCY] ${inFlightTransfers.total} transfers frozen in-flight`,
  );

  // Step 4: Run immediate reconciliation to check for supply mismatches
  // This helps determine if any tokens were already stolen
  const reconciliationEngine = new ReconciliationEngine();
  const reports = await reconciliationEngine.runFullReconciliation();

  const anomalousReports = reports.filter((r) => r.isAnomalous);
  if (anomalousReports.length > 0) {
    console.error('[BRIDGE EMERGENCY] Supply anomalies detected:', {
      count: anomalousReports.length,
      details: anomalousReports.map((r) => ({
        chain: r.chain,
        token: r.tokenSymbol,
        deviation: r.deviation.toString(),
        deviationPercent: `${r.deviationPercent}%`,
      })),
    });
  }

  // Step 5: Send critical alerts
  // In production, this would fire PagerDuty, Slack, etc.
  await sendCriticalAlert({
    title: `BRIDGE EMERGENCY PAUSE — ${reason}`,
    severity: 'critical',
    details: {
      reason,
      triggeredBy: ctx.session.userId,
      frozenTransfers: inFlightTransfers.total,
      supplyAnomalies: anomalousReports.length,
      alertDetails,
    },
  });

  return {
    paused: true,
    frozenTransfers: inFlightTransfers.total,
    supplyAnomalies: anomalousReports,
    reconciliationReports: reports,
  };
}

/**
 * Resume bridge operations after thorough review.
 * Requires explicit review notes documenting what was checked.
 */
async function resumeBridgeOperations(
  bridgeService: BridgeService,
  circuitBreaker: BridgeCircuitBreaker,
  reviewNotes: string,
  ctx: TRPCContext,
) {
  if (reviewNotes.length < 100) {
    throw new Error(
      'Review notes must be at least 100 characters — '
      + 'please document what was investigated and confirmed safe',
    );
  }

  // Require admin role
  if (!ctx.session.roles.includes('bridge_admin')) {
    throw new Error('Only bridge_admin can resume operations after emergency pause');
  }

  // Reset the circuit breaker
  await circuitBreaker.reset({
    resetBy: ctx.session.userId,
    resetAt: new Date(),
    reviewNotes,
  });

  // Resume via the bridge service
  await bridgeService.resumeOperations(reviewNotes, ctx);

  console.log('[BRIDGE] Operations resumed by', ctx.session.userId);

  return { resumed: true };
}
```

### 6. Automated Anomaly Detection

```typescript
import {
  BridgeSecurityManager,
  BridgeCircuitBreaker,
  type BridgeSecurityAlert,
  type BridgeConfig,
} from '@mcv/web3-core/bridge';

/**
 * Anomaly detection service — runs continuously, checking for suspicious patterns.
 * This is the automated counterpart to manual emergency pause.
 */
class BridgeAnomalyDetector {
  constructor(
    private securityManager: BridgeSecurityManager,
    private circuitBreaker: BridgeCircuitBreaker,
    private config: BridgeConfig,
  ) {}

  /**
   * Main anomaly check — runs every minute.
   */
  async check(): Promise<BridgeSecurityAlert[]> {
    const alerts: BridgeSecurityAlert[] = [];

    // Check 1: Volume spike detection
    const volumeAlert = await this.checkVolumeSpike();
    if (volumeAlert) alerts.push(volumeAlert);

    // Check 2: Failure rate anomaly
    const failureAlert = await this.checkFailureRate();
    if (failureAlert) alerts.push(failureAlert);

    // Check 3: Backing ratio verification
    const backingAlert = await this.checkBackingRatios();
    if (backingAlert) alerts.push(backingAlert);

    // Check 4: Large transfer pattern
    const patternAlert = await this.checkSuspiciousPatterns();
    if (patternAlert) alerts.push(patternAlert);

    // Process critical alerts — may auto-trigger circuit breaker
    for (const alert of alerts) {
      if (alert.severity === 'critical' && alert.autoAction === 'pause_all') {
        await this.circuitBreaker.trip({
          reason: 'anomaly_detected',
          triggeredBy: 'anomaly_detector',
          triggeredAt: new Date(),
          autoTriggered: true,
          alertId: alert.id,
        });
        console.error('[ANOMALY] Auto-paused all bridge operations:', alert.message);
      }
    }

    return alerts;
  }

  private async checkVolumeSpike(): Promise<BridgeSecurityAlert | null> {
    const hourlyVolume = await this.securityManager.getHourlyVolumeUsd();
    const threshold = this.config.anomalyThresholds.hourlyVolumeThresholdUsd;

    if (hourlyVolume > threshold) {
      return {
        id: crypto.randomUUID(),
        severity: hourlyVolume > threshold * 3 ? 'critical' : 'high',
        alertType: 'volume_spike',
        message: `Hourly bridge volume ($${hourlyVolume.toLocaleString()}) exceeds `
          + `threshold ($${threshold.toLocaleString()})`,
        details: { hourlyVolume, threshold, ratio: hourlyVolume / threshold },
        acknowledged: false,
        autoAction: hourlyVolume > threshold * 3 ? 'pause_all' : 'alert_only',
        createdAt: new Date(),
      };
    }

    return null;
  }

  private async checkFailureRate(): Promise<BridgeSecurityAlert | null> {
    const { failures, total } = await this.securityManager.getHourlyFailureStats();
    const failureRate = total > 0 ? failures / total : 0;
    const threshold = this.config.anomalyThresholds.failureRateThreshold;

    if (failures >= threshold && failureRate > 0.2) {
      return {
        id: crypto.randomUUID(),
        severity: failureRate > 0.5 ? 'critical' : 'high',
        alertType: 'high_failure_rate',
        message: `Bridge failure rate ${(failureRate * 100).toFixed(1)}% `
          + `(${failures}/${total} in last hour)`,
        details: { failures, total, failureRate },
        acknowledged: false,
        autoAction: failureRate > 0.5 ? 'pause_all' : 'alert_only',
        createdAt: new Date(),
      };
    }

    return null;
  }

  private async checkBackingRatios(): Promise<BridgeSecurityAlert | null> {
    const supplies = await this.securityManager.getBridgedAssetSupplies();
    const threshold = this.config.anomalyThresholds.backingDeviationThreshold;

    for (const supply of supplies) {
      if (supply.actualSupply === undefined || supply.actualSupply === null) continue;

      const deviation = Number(supply.actualSupply - supply.expectedSupply);
      const deviationPercent =
        Number(supply.expectedSupply) > 0
          ? Math.abs(deviation) / Number(supply.expectedSupply)
          : 0;

      if (deviationPercent > threshold) {
        return {
          id: crypto.randomUUID(),
          severity: deviationPercent > threshold * 5 ? 'critical' : 'high',
          alertType: 'backing_mismatch',
          message: `Bridged ${supply.tokenSymbol} on ${supply.chain}: `
            + `supply deviation of ${(deviationPercent * 100).toFixed(2)}% `
            + `(expected: ${supply.expectedSupply}, actual: ${supply.actualSupply})`,
          details: {
            chain: supply.chain,
            token: supply.tokenSymbol,
            expected: supply.expectedSupply.toString(),
            actual: supply.actualSupply.toString(),
            deviation: deviation.toString(),
            deviationPercent,
          },
          acknowledged: false,
          autoAction: deviationPercent > threshold * 5 ? 'pause_all' : 'pause_route',
          createdAt: new Date(),
        };
      }
    }

    return null;
  }

  private async checkSuspiciousPatterns(): Promise<BridgeSecurityAlert | null> {
    // Check for rapid sequential large transfers from different addresses
    // that may indicate a draining attack
    const recentLargeTransfers = await this.securityManager.getRecentLargeTransfers({
      minUsdValue: this.config.anomalyThresholds.largeTransferThresholdUsd,
      windowMinutes: 15,
    });

    if (recentLargeTransfers.length >= 5) {
      const totalUsd = recentLargeTransfers.reduce((sum, t) => sum + t.usdValue, 0);
      const uniqueSenders = new Set(recentLargeTransfers.map((t) => t.senderAddress)).size;

      // Many large transfers from many different senders = potential coordinated drain
      if (uniqueSenders >= 3) {
        return {
          id: crypto.randomUUID(),
          severity: 'critical',
          alertType: 'suspicious_pattern',
          message: `${recentLargeTransfers.length} large transfers ($${totalUsd.toLocaleString()}) `
            + `from ${uniqueSenders} unique senders in 15 minutes`,
          details: {
            count: recentLargeTransfers.length,
            totalUsd,
            uniqueSenders,
            transfers: recentLargeTransfers.map((t) => ({
              id: t.id,
              sender: t.senderAddress,
              amount: t.amount.toString(),
              usdValue: t.usdValue,
            })),
          },
          acknowledged: false,
          autoAction: 'pause_all',
          createdAt: new Date(),
        };
      }
    }

    return null;
  }
}
```

### 7. Bridge Reconciliation

```typescript
import {
  ReconciliationEngine,
  BridgedAssetTracker,
  type ReconciliationReport,
} from '@mcv/web3-core/bridge';

/**
 * Run a full reconciliation of all bridged assets.
 * Compares expected supply (based on bridge transfer records) against
 * actual on-chain supply of wrapped/bridged tokens.
 *
 * This should run periodically (every 5-15 minutes) and alert
 * immediately on any deviation exceeding the configured threshold.
 */
async function runBridgeReconciliation(
  reconciliationEngine: ReconciliationEngine,
  assetTracker: BridgedAssetTracker,
): Promise<{
  reports: ReconciliationReport[];
  anomalies: ReconciliationReport[];
  healthy: boolean;
}> {
  // Step 1: Get all bridged asset configurations
  const bridgedAssets = await assetTracker.getAllBridgedAssets();

  const reports: ReconciliationReport[] = [];

  for (const asset of bridgedAssets) {
    // Step 2: Compute expected supply from completed bridge transfers
    const expectedSupply = await reconciliationEngine.computeExpectedSupply(
      asset.chain,
      asset.tokenAddress,
    );

    // Step 3: Fetch actual on-chain supply
    const actualSupply = await assetTracker.getOnChainSupply(
      asset.chain,
      asset.tokenAddress,
    );

    // Step 4: Compute deviation
    const deviation = actualSupply - expectedSupply;
    const deviationPercent =
      expectedSupply > 0n
        ? (Number(deviation) / Number(expectedSupply)) * 100
        : 0;

    // Step 5: Check source chain locked amounts
    const sourceLockedAmount = await assetTracker.getLockedAmount(
      asset.sourceChain,
      asset.sourceTokenAddress,
    );

    const report: ReconciliationReport = {
      id: crypto.randomUUID(),
      chain: asset.chain,
      tokenAddress: asset.tokenAddress,
      tokenSymbol: asset.tokenSymbol,
      expectedSupply,
      actualSupply,
      deviation,
      deviationPercent: Math.abs(deviationPercent),
      isAnomalous: Math.abs(deviationPercent) > 0.1, // 0.1% threshold
      sourceLockedAmount,
      reconciledAt: new Date(),
    };

    reports.push(report);

    // Step 6: Persist the reconciliation result
    await reconciliationEngine.saveReport(report);

    // Step 7: Update bridged_asset_supply table
    await assetTracker.updateSupplyRecord({
      chain: asset.chain,
      tokenAddress: asset.tokenAddress,
      tokenSymbol: asset.tokenSymbol,
      expectedSupply,
      actualSupply,
      deviation,
      deviationBps: Math.round(Math.abs(deviationPercent) * 100),
      isAnomalous: report.isAnomalous,
      lastReconciledAt: new Date(),
    });
  }

  const anomalies = reports.filter((r) => r.isAnomalous);

  if (anomalies.length > 0) {
    console.warn(`[Reconciliation] ${anomalies.length} anomalies detected:`, {
      anomalies: anomalies.map((a) => ({
        chain: a.chain,
        token: a.tokenSymbol,
        deviation: a.deviation.toString(),
        percent: `${a.deviationPercent.toFixed(4)}%`,
      })),
    });
  }

  return {
    reports,
    anomalies,
    healthy: anomalies.length === 0,
  };
}
```

---

## Error Codes

```typescript
/**
 * Bridge-specific error codes.
 * All codes are prefixed with BRIDGE_ for namespacing.
 */
export enum BridgeErrorCode {
  // === Validation Errors (1xxx) ===

  /** Amount is below the minimum for this route. */
  BRIDGE_AMOUNT_TOO_LOW = 'BRIDGE_1001',

  /** Amount exceeds the maximum for this route. */
  BRIDGE_AMOUNT_TOO_HIGH = 'BRIDGE_1002',

  /** No active route exists for the requested chain pair and token. */
  BRIDGE_ROUTE_NOT_FOUND = 'BRIDGE_1003',

  /** The requested route is paused (maintenance or manual pause). */
  BRIDGE_ROUTE_PAUSED = 'BRIDGE_1004',

  /** Invalid recipient address format for the target chain. */
  BRIDGE_INVALID_RECIPIENT = 'BRIDGE_1005',

  /** The source token address is not a supported bridgeable token. */
  BRIDGE_UNSUPPORTED_TOKEN = 'BRIDGE_1006',

  /** The chain pair is not supported for bridging. */
  BRIDGE_UNSUPPORTED_CHAIN_PAIR = 'BRIDGE_1007',

  /** Idempotency key has already been used for a previous transfer. */
  BRIDGE_DUPLICATE_TRANSFER = 'BRIDGE_1008',

  // === Security / Limits Errors (2xxx) ===

  /** All bridge operations are currently paused (emergency). */
  BRIDGE_EMERGENCY_PAUSED = 'BRIDGE_2001',

  /** User has exceeded their per-transfer limit. */
  BRIDGE_USER_TRANSFER_LIMIT = 'BRIDGE_2002',

  /** User has exceeded their hourly volume limit. */
  BRIDGE_USER_HOURLY_LIMIT = 'BRIDGE_2003',

  /** User has exceeded their daily volume limit. */
  BRIDGE_USER_DAILY_LIMIT = 'BRIDGE_2004',

  /** User has exceeded their weekly volume limit. */
  BRIDGE_USER_WEEKLY_LIMIT = 'BRIDGE_2005',

  /** User has too many concurrent pending transfers. */
  BRIDGE_TOO_MANY_PENDING = 'BRIDGE_2006',

  /** Cool-down period between transfers has not elapsed. */
  BRIDGE_COOLDOWN_ACTIVE = 'BRIDGE_2007',

  /** Global hourly volume limit exceeded — try again later. */
  BRIDGE_GLOBAL_VOLUME_LIMIT = 'BRIDGE_2008',

  /** Route daily volume limit exceeded. */
  BRIDGE_ROUTE_VOLUME_LIMIT = 'BRIDGE_2009',

  /** The estimated fee exceeds the user's maxFeeUsd. */
  BRIDGE_FEE_EXCEEDS_MAX = 'BRIDGE_2010',

  /** Transfer flagged by velocity check — unusual pattern. */
  BRIDGE_VELOCITY_CHECK_FAILED = 'BRIDGE_2011',

  /** User or address is on a restricted list. */
  BRIDGE_RESTRICTED_ADDRESS = 'BRIDGE_2012',

  // === Protocol Errors (3xxx) ===

  /** Wormhole protocol is currently unavailable. */
  BRIDGE_WORMHOLE_UNAVAILABLE = 'BRIDGE_3001',

  /** LayerZero protocol is currently unavailable. */
  BRIDGE_LAYERZERO_UNAVAILABLE = 'BRIDGE_3002',

  /** Failed to submit the lock/burn transaction on the source chain. */
  BRIDGE_SOURCE_TX_FAILED = 'BRIDGE_3003',

  /** Failed to submit the mint/unlock transaction on the target chain. */
  BRIDGE_TARGET_TX_FAILED = 'BRIDGE_3004',

  /** Attestation/VAA was not received within the expected timeframe. */
  BRIDGE_ATTESTATION_TIMEOUT = 'BRIDGE_3005',

  /** Attestation verification failed (invalid signatures, wrong payload, etc.). */
  BRIDGE_ATTESTATION_INVALID = 'BRIDGE_3006',

  /** Attestation has expired and is no longer valid. */
  BRIDGE_ATTESTATION_EXPIRED = 'BRIDGE_3007',

  /** VAA replay detected — this attestation was already used. */
  BRIDGE_VAA_REPLAY = 'BRIDGE_3008',

  /** Relayer failed to deliver the message to the target chain. */
  BRIDGE_RELAYER_FAILED = 'BRIDGE_3009',

  /** Source chain transaction was reverted after initial confirmation (reorg). */
  BRIDGE_SOURCE_TX_REVERTED = 'BRIDGE_3010',

  // === Operational Errors (4xxx) ===

  /** Transfer not found. */
  BRIDGE_TRANSFER_NOT_FOUND = 'BRIDGE_4001',

  /** Transfer is not in a retryable state. */
  BRIDGE_NOT_RETRYABLE = 'BRIDGE_4002',

  /** Maximum retry attempts exhausted. */
  BRIDGE_MAX_RETRIES_EXCEEDED = 'BRIDGE_4003',

  /** Fee estimation failed — could not get current gas prices. */
  BRIDGE_FEE_ESTIMATION_FAILED = 'BRIDGE_4004',

  /** Insufficient balance on the source chain to cover amount + gas. */
  BRIDGE_INSUFFICIENT_BALANCE = 'BRIDGE_4005',

  /** Bridge configuration is invalid or missing. */
  BRIDGE_CONFIG_ERROR = 'BRIDGE_4006',

  /** Reconciliation detected a supply mismatch. */
  BRIDGE_SUPPLY_MISMATCH = 'BRIDGE_4007',

  /** Database error during bridge operation. */
  BRIDGE_DATABASE_ERROR = 'BRIDGE_4008',

  /** Bridge service is temporarily unavailable. */
  BRIDGE_SERVICE_UNAVAILABLE = 'BRIDGE_4009',

  /** Unknown/unexpected error during bridge operation. */
  BRIDGE_UNKNOWN_ERROR = 'BRIDGE_4999',
}

/**
 * Error code to human-readable description mapping.
 */
export const BRIDGE_ERROR_MESSAGES: Record<BridgeErrorCode, string> = {
  [BridgeErrorCode.BRIDGE_AMOUNT_TOO_LOW]:
    'Transfer amount is below the minimum required for this route.',
  [BridgeErrorCode.BRIDGE_AMOUNT_TOO_HIGH]:
    'Transfer amount exceeds the maximum allowed for this route.',
  [BridgeErrorCode.BRIDGE_ROUTE_NOT_FOUND]:
    'No active bridge route exists for the requested chain pair and token.',
  [BridgeErrorCode.BRIDGE_ROUTE_PAUSED]:
    'This bridge route is temporarily paused. Please try again later.',
  [BridgeErrorCode.BRIDGE_INVALID_RECIPIENT]:
    'The recipient address is not valid for the target chain.',
  [BridgeErrorCode.BRIDGE_UNSUPPORTED_TOKEN]:
    'This token is not supported for bridging.',
  [BridgeErrorCode.BRIDGE_UNSUPPORTED_CHAIN_PAIR]:
    'Bridging between these chains is not supported.',
  [BridgeErrorCode.BRIDGE_DUPLICATE_TRANSFER]:
    'A transfer with this idempotency key already exists.',
  [BridgeErrorCode.BRIDGE_EMERGENCY_PAUSED]:
    'All bridge operations are temporarily paused for safety. Please check back later.',
  [BridgeErrorCode.BRIDGE_USER_TRANSFER_LIMIT]:
    'This transfer exceeds your per-transaction limit.',
  [BridgeErrorCode.BRIDGE_USER_HOURLY_LIMIT]:
    'You have exceeded your hourly bridge volume limit.',
  [BridgeErrorCode.BRIDGE_USER_DAILY_LIMIT]:
    'You have exceeded your daily bridge volume limit.',
  [BridgeErrorCode.BRIDGE_USER_WEEKLY_LIMIT]:
    'You have exceeded your weekly bridge volume limit.',
  [BridgeErrorCode.BRIDGE_TOO_MANY_PENDING]:
    'You have too many pending bridge transfers. Wait for some to complete.',
  [BridgeErrorCode.BRIDGE_COOLDOWN_ACTIVE]:
    'Please wait before initiating another bridge transfer on this route.',
  [BridgeErrorCode.BRIDGE_GLOBAL_VOLUME_LIMIT]:
    'Global bridge volume limit reached. Please try again later.',
  [BridgeErrorCode.BRIDGE_ROUTE_VOLUME_LIMIT]:
    'Daily volume limit for this route has been reached.',
  [BridgeErrorCode.BRIDGE_FEE_EXCEEDS_MAX]:
    'Estimated fees exceed your specified maximum.',
  [BridgeErrorCode.BRIDGE_VELOCITY_CHECK_FAILED]:
    'Transfer flagged by security checks. Please contact support.',
  [BridgeErrorCode.BRIDGE_RESTRICTED_ADDRESS]:
    'This address is restricted from bridge operations.',
  [BridgeErrorCode.BRIDGE_WORMHOLE_UNAVAILABLE]:
    'Wormhole bridge protocol is currently unavailable.',
  [BridgeErrorCode.BRIDGE_LAYERZERO_UNAVAILABLE]:
    'LayerZero bridge protocol is currently unavailable.',
  [BridgeErrorCode.BRIDGE_SOURCE_TX_FAILED]:
    'Failed to submit the transaction on the source chain.',
  [BridgeErrorCode.BRIDGE_TARGET_TX_FAILED]:
    'Failed to complete the transaction on the target chain.',
  [BridgeErrorCode.BRIDGE_ATTESTATION_TIMEOUT]:
    'Bridge attestation was not received in time. The transfer may need to be retried.',
  [BridgeErrorCode.BRIDGE_ATTESTATION_INVALID]:
    'Bridge attestation verification failed.',
  [BridgeErrorCode.BRIDGE_ATTESTATION_EXPIRED]:
    'Bridge attestation has expired.',
  [BridgeErrorCode.BRIDGE_VAA_REPLAY]:
    'This attestation has already been used.',
  [BridgeErrorCode.BRIDGE_RELAYER_FAILED]:
    'The bridge relayer failed to deliver the message.',
  [BridgeErrorCode.BRIDGE_SOURCE_TX_REVERTED]:
    'The source transaction was reverted due to a chain reorganization.',
  [BridgeErrorCode.BRIDGE_TRANSFER_NOT_FOUND]:
    'Bridge transfer not found.',
  [BridgeErrorCode.BRIDGE_NOT_RETRYABLE]:
    'This transfer is not in a retryable state.',
  [BridgeErrorCode.BRIDGE_MAX_RETRIES_EXCEEDED]:
    'Maximum retry attempts have been exhausted for this transfer.',
  [BridgeErrorCode.BRIDGE_FEE_ESTIMATION_FAILED]:
    'Unable to estimate bridge fees at this time.',
  [BridgeErrorCode.BRIDGE_INSUFFICIENT_BALANCE]:
    'Insufficient balance to cover the transfer amount plus gas fees.',
  [BridgeErrorCode.BRIDGE_CONFIG_ERROR]:
    'Bridge configuration error. Please contact support.',
  [BridgeErrorCode.BRIDGE_SUPPLY_MISMATCH]:
    'Bridged token supply mismatch detected.',
  [BridgeErrorCode.BRIDGE_DATABASE_ERROR]:
    'Internal database error during bridge operation.',
  [BridgeErrorCode.BRIDGE_SERVICE_UNAVAILABLE]:
    'Bridge service is temporarily unavailable.',
  [BridgeErrorCode.BRIDGE_UNKNOWN_ERROR]:
    'An unexpected error occurred during the bridge operation.',
};
```

---

## Security

> **Bridges are the #1 attack vector in cryptocurrency.** Over $2.5 billion has been stolen from bridge exploits since 2020. This section documents the security architecture that protects MCV's bridge operations.

### Threat Model

| Threat | Impact | Mitigation |
|--------|--------|------------|
| **Fake attestation injection** | Attacker mints unbacked tokens on target chain | Multi-layer attestation verification, guardian signature validation, payload matching |
| **VAA replay attack** | Same attestation used to mint tokens multiple times | Attestation hash deduplication, sequence tracking per emitter |
| **Smart contract exploit** | Attacker drains locked tokens from bridge contract | Use audited Wormhole/LayerZero contracts, no custom bridge logic, upgrade monitoring |
| **Guardian/DVN compromise** | Attacker controls enough verifiers to forge attestations | Require supermajority (13/19 for Wormhole), monitor guardian set changes, pause on anomaly |
| **Relayer manipulation** | Relayer submits modified or delayed messages | Verify attestation independently of relayer, timeout and retry logic |
| **Chain reorganization** | Source chain reorg invalidates a bridge transfer | Wait for finality before attesting, reorg detection and pause |
| **Supply inflation** | More bridged tokens exist than locked backing | Continuous reconciliation, automated anomaly alerts, circuit breaker |
| **Front-running** | Attacker front-runs bridge completion to exploit price | Slippage tolerance, no exposed mempool in bridge completion |
| **Denial of service** | Attacker floods bridge with requests to exhaust limits | Per-user rate limits, velocity checks, global volume caps |
| **Admin key compromise** | Attacker uses admin credentials to drain or modify bridge | Multi-sig for admin actions, audit logging, role-based access |
| **Price oracle manipulation** | Attacker manipulates token price to bypass USD-denominated limits | Multiple oracle sources, TWAP pricing, price deviation detection |

### Defense-in-Depth Layers

```
Layer 1: Input Validation
├── Address format validation per chain
├── Amount range checks (min/max per route)
├── Token whitelist enforcement
├── Idempotency key deduplication
└── Sanitize all user-provided metadata

Layer 2: Rate Limiting & Velocity
├── Per-user transfer count limits (hourly/daily)
├── Per-user volume limits (hourly/daily/weekly, USD-denominated)
├── Per-route daily volume caps
├── Global hourly/daily volume limits
├── Cool-down period between transfers on same route
└── Maximum concurrent pending transfers

Layer 3: Pre-Transfer Security
├── Velocity check (pattern analysis across recent transfers)
├── Address screening (sanctions/restricted list check)
├── Balance verification (user has sufficient funds + gas)
├── Fee estimation validation (ensure fee quote is current)
└── Circuit breaker check (not in emergency pause)

Layer 4: Protocol Security
├── Wormhole: 13/19 guardian signature verification
├── LayerZero: DVN consensus verification
├── Source chain finality confirmation before attestation trust
├── Attestation payload verification against expected transfer
├── VAA replay prevention (hash + sequence deduplication)
└── Attestation expiry enforcement

Layer 5: Post-Transfer Monitoring
├── Continuous reconciliation of bridged asset supply
├── Anomaly detection (volume spikes, failure rates, backing deviations)
├── Automated circuit breaker on critical anomalies
├── Immutable audit log of all state transitions
└── Real-time alerting for security team

Layer 6: Operational Security
├── Admin actions require bridge_admin role
├── Emergency pause/resume audit trail
├── Configuration changes logged with actor and reason
├── Database-level row-level security on Supabase
└── Encrypted storage for sensitive configuration
```

### Attestation Verification Deep Dive

The attestation verification process is the most security-critical code path in the entire bridge module. **Tokens must never be minted or unlocked without a fully verified attestation.**

```
Verification Pipeline:
┌─────────────────────────────────────────────────────────┐
│ 1. PARSE                                                │
│    - Decode raw VAA/attestation bytes                   │
│    - Validate structural integrity                      │
│    - Extract header, body, signatures                   │
├─────────────────────────────────────────────────────────┤
│ 2. SIGNATURE VERIFICATION                               │
│    - Fetch current guardian/DVN set from on-chain        │
│    - Verify each signature against known public keys     │
│    - Ensure supermajority threshold met (13/19)          │
│    - Reject if any signature is from unknown key         │
├─────────────────────────────────────────────────────────┤
│ 3. REPLAY CHECK                                         │
│    - Hash the attestation (keccak256)                   │
│    - Check against bridge_attestations table            │
│    - Check emitter + sequence uniqueness                │
│    - Reject if any match found                          │
├─────────────────────────────────────────────────────────┤
│ 4. PAYLOAD VERIFICATION                                 │
│    - Decode transfer payload from attestation body      │
│    - Verify token address matches expected              │
│    - Verify amount matches expected                     │
│    - Verify recipient matches expected                  │
│    - Verify target chain matches expected               │
│    - Reject on ANY mismatch (no partial matches)        │
├─────────────────────────────────────────────────────────┤
│ 5. FINALITY CHECK                                       │
│    - Verify source tx has reached required finality     │
│    - For Solana: 'finalized' commitment                 │
│    - For Ethereum: 64+ block confirmations              │
│    - For Polygon: 256+ block confirmations              │
│    - Reject if finality not yet reached                 │
├─────────────────────────────────────────────────────────┤
│ 6. EXPIRY CHECK                                         │
│    - Verify attestation has not expired                 │
│    - Default TTL: 24 hours from observation             │
│    - Reject expired attestations                        │
├─────────────────────────────────────────────────────────┤
│ 7. RECORD & PROCEED                                     │
│    - Save verified attestation to database              │
│    - Link to transfer record                            │
│    - Proceed to token release on target chain           │
└─────────────────────────────────────────────────────────┘
```

### Security Invariants

These invariants must **always** hold true. If any are violated, the system should immediately pause:

1. **Supply Conservation**: For every bridged token on a target chain, there must be an equal amount locked on the source chain. `sum(locked_source) >= sum(minted_target)` at all times.

2. **Attestation Uniqueness**: No attestation hash may be used more than once. No emitter+sequence pair may produce more than one successful completion.

3. **Guardian Supermajority**: No token release occurs without verification of at least 13/19 guardian signatures (Wormhole) or the configured DVN threshold (LayerZero).

4. **Finality Before Trust**: No attestation is trusted until the source chain transaction has reached the required finality depth. Premature trust = reorg vulnerability.

5. **Payload Integrity**: The attestation payload must match the expected transfer parameters exactly. Zero tolerance for mismatches.

6. **Rate Limit Enforcement**: No single user or address may exceed configured volume limits, regardless of the number of concurrent requests.

7. **Audit Trail Completeness**: Every state transition, admin action, and security event must be recorded in the audit log with the actor, timestamp, and full context.

### Incident Response Playbook

```
SEVERITY: CRITICAL — Potential Exploit Detected
════════════════════════════════════════════════

1. IMMEDIATE (0-5 minutes)
   □ Circuit breaker auto-triggers (or manual emergencyPause)
   □ All new bridge operations blocked
   □ All in-flight completions frozen
   □ PagerDuty alert fires to on-call engineer

2. ASSESSMENT (5-30 minutes)
   □ Run full reconciliation across all chains
   □ Compare locked vs minted supply for all tokens
   □ Review last 1 hour of bridge_audit_log
   □ Check guardian set — any unexpected changes?
   □ Review source chain for unusual transactions
   □ Identify scope of potential loss

3. CONTAINMENT (30-60 minutes)
   □ If tokens were stolen: notify affected protocols
   □ If contract vulnerability: coordinate with Wormhole/LZ security teams
   □ Prepare communication for affected users
   □ Document all findings in incident report

4. RECOVERY (1-24 hours)
   □ Fix root cause (if within MCV control)
   □ Deploy patches if needed
   □ Gradual resume: test routes individually
   □ Monitor closely for 24 hours post-resume
   □ Full post-mortem within 48 hours
```

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════
# Bridge Module Environment Configuration
# ═══════════════════════════════════════════════════════

# --- Core ---
# Master switch: set to 'false' to disable all bridge operations
BRIDGE_ENABLED=true

# --- Wormhole Configuration ---
# Wormhole RPC endpoint for fetching VAAs
WORMHOLE_RPC_URL=https://api.wormholescan.io
# Wormhole guardian RPC for real-time VAA polling
WORMHOLE_GUARDIAN_RPC_URL=https://wormhole-v2-mainnet-api.certus.one
# Wormhole core bridge address on Solana
WORMHOLE_SOLANA_CORE_ADDRESS=worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth
# Wormhole token bridge address on Solana
WORMHOLE_SOLANA_TOKEN_BRIDGE_ADDRESS=wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb
# Wormhole core bridge address on Ethereum
WORMHOLE_ETH_CORE_ADDRESS=0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B
# Wormhole token bridge address on Ethereum
WORMHOLE_ETH_TOKEN_BRIDGE_ADDRESS=0x3ee18B2214AFF97000D974cf647E7C347E8fa585

# --- LayerZero Configuration ---
# LayerZero V2 endpoint address on Ethereum
LAYERZERO_ETH_ENDPOINT=0x1a44076050125825900e736c501f859c50fE728c
# LayerZero V2 endpoint ID for Solana
LAYERZERO_SOLANA_ENDPOINT_ID=30168
# LayerZero V2 endpoint ID for Ethereum
LAYERZERO_ETH_ENDPOINT_ID=30101
# LayerZero V2 endpoint ID for Polygon
LAYERZERO_POLYGON_ENDPOINT_ID=30109
# LayerZero V2 endpoint ID for Arbitrum
LAYERZERO_ARBITRUM_ENDPOINT_ID=30110

# --- RPC Endpoints (for on-chain reads/writes) ---
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}

# --- Fee Estimation ---
# Gas oracle refresh interval in seconds
GAS_ORACLE_REFRESH_INTERVAL_SECONDS=15
# Maximum gas price multiplier (safety cap)
GAS_PRICE_MAX_MULTIPLIER=2.0
# Platform fee in basis points (25 = 0.25%)
BRIDGE_PLATFORM_FEE_BPS=25

# --- Limits ---
# Default per-user limits (can be overridden in bridge_configs)
BRIDGE_DEFAULT_MAX_TRANSFER_USD=50000
BRIDGE_DEFAULT_MAX_HOURLY_VOLUME_USD=100000
BRIDGE_DEFAULT_MAX_DAILY_VOLUME_USD=500000
BRIDGE_DEFAULT_MAX_WEEKLY_VOLUME_USD=2000000
BRIDGE_DEFAULT_MAX_TRANSFERS_PER_HOUR=10
BRIDGE_DEFAULT_MAX_TRANSFERS_PER_DAY=50
BRIDGE_DEFAULT_MAX_PENDING_TRANSFERS=5
BRIDGE_DEFAULT_COOLDOWN_SECONDS=60

# Global limits
BRIDGE_GLOBAL_HOURLY_VOLUME_LIMIT_USD=5000000
BRIDGE_GLOBAL_DAILY_VOLUME_LIMIT_USD=25000000

# --- Anomaly Detection ---
BRIDGE_LARGE_TRANSFER_THRESHOLD_USD=100000
BRIDGE_HOURLY_VOLUME_ANOMALY_THRESHOLD_USD=2000000
BRIDGE_DAILY_VOLUME_ANOMALY_THRESHOLD_USD=10000000
BRIDGE_FAILURE_RATE_THRESHOLD=10
BRIDGE_BACKING_DEVIATION_THRESHOLD=0.001

# --- Retry Configuration ---
BRIDGE_MAX_RETRY_ATTEMPTS=5
BRIDGE_RETRY_INITIAL_DELAY_MS=30000
BRIDGE_RETRY_MAX_DELAY_MS=600000
BRIDGE_RETRY_BACKOFF_MULTIPLIER=2.0

# --- Monitoring ---
# Transfer monitor polling interval
BRIDGE_MONITOR_POLL_INTERVAL_MS=10000
# Reconciliation interval
BRIDGE_RECONCILIATION_INTERVAL_MS=300000
# Analytics aggregation interval
BRIDGE_ANALYTICS_AGGREGATION_INTERVAL_MS=3600000

# --- Alerting ---
# PagerDuty integration key for critical alerts
BRIDGE_PAGERDUTY_INTEGRATION_KEY=
# Slack webhook for bridge alerts
BRIDGE_SLACK_ALERT_WEBHOOK_URL=
# Alert escalation email
BRIDGE_ALERT_EMAIL=bridge-alerts@mcv.io

# --- Database ---
# Supabase connection (shared with other modules)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql://...
```

---

## Dependencies

### Internal Dependencies

| Module | Purpose |
|--------|---------|
| `@mcv/web3-core/solana` | Solana RPC, transaction building, account management |
| `@mcv/web3-core/evm` | EVM chain RPC, contract interactions, gas estimation |
| `@mcv/web3-core/tokens` | Token metadata, mint addresses, decimal normalization |
| `@mcv/web3-core/wallets` | User wallet resolution (source/target addresses) |
| `@mcv/web3-core/pricing` | USD price feeds for fee estimation and limit enforcement |
| `@mcv/shared/db` | Drizzle ORM setup, connection management |
| `@mcv/shared/auth` | Authentication context, role verification |
| `@mcv/shared/monitoring` | Metrics, logging, alerting infrastructure |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@wormhole-foundation/sdk` | `^1.x` | Wormhole SDK — VAA parsing, guardian interaction, token bridge |
| `@layerzerolabs/lz-v2-utilities` | `^2.x` | LayerZero V2 — endpoint interaction, OFT messaging |
| `@layerzerolabs/lz-evm-sdk-v2` | `^2.x` | LayerZero EVM-specific SDK |
| `@solana/web3.js` | `^1.95` | Solana web3 library |
| `ethers` | `^6.x` | Ethereum/EVM interaction library |
| `drizzle-orm` | `^0.34` | Database ORM for Supabase PostgreSQL |
| `@trpc/server` | `^10.x` | tRPC server for API endpoints |
| `zod` | `^3.x` | Runtime schema validation |
| `uuid` | `^10.x` | UUIDv7 generation for transfer IDs |

---

## Testing

### Unit Tests

```bash
# Run all bridge module tests
pnpm test packages/web3-core/bridge

# Run specific test suite
pnpm test packages/web3-core/bridge/src/__tests__/attestation-verifier.test.ts

# Run with coverage
pnpm test:coverage packages/web3-core/bridge
```

### Key Test Categories

| Category | Tests | Description |
|----------|-------|-------------|
| **Attestation verification** | 30+ | VAA parsing, guardian signature verification, replay detection, payload matching, expiry, finality checks |
| **Velocity checks** | 20+ | Per-user limits, global limits, cooldown enforcement, concurrent transfer limits |
| **Circuit breaker** | 15+ | Trip conditions, auto-pause, manual resume, state persistence |
| **Fee estimation** | 15+ | Multi-chain gas estimation, fee comparison, stale estimate detection |
| **Transfer lifecycle** | 25+ | Full state machine transitions, retry logic, timeout handling |
| **Reconciliation** | 15+ | Supply computation, deviation detection, anomaly flagging |
| **Route resolution** | 10+ | Route selection, inactive route filtering, protocol priority |
| **Security** | 20+ | Input validation, address screening, rate limit enforcement |
| **Integration** | 10+ | End-to-end bridge flow (testnet), protocol adapter integration |

### Testing Security-Critical Paths

```typescript
describe('AttestationVerifier', () => {
  it('should reject attestation with insufficient guardian signatures', async () => {
    const vaa = createMockVAA({ signatureCount: 12 }); // Need 13
    const result = await verifier.verify(vaa);
    expect(result.verified).toBe(false);
    expect(result.error).toContain('Insufficient guardian signatures');
  });

  it('should reject replayed attestation', async () => {
    const vaa = createMockVAA({ hash: 'previously-used-hash' });
    await db.insert(bridgeAttestations).values({
      attestationHash: 'previously-used-hash',
      status: 'verified',
      // ... other fields
    });

    const result = await verifier.verify(vaa);
    expect(result.verified).toBe(false);
    expect(result.error).toContain('replay detected');
  });

  it('should reject attestation with mismatched payload', async () => {
    const vaa = createMockVAA({
      amount: BigInt(999), // Doesn't match expected
    });

    const result = await verifier.verify(vaa, {
      expectedAmount: BigInt(1000),
      expectedRecipient: '0xabc...',
      expectedToken: 'EDGEtoken...',
      expectedTargetChain: 'ethereum',
    });

    expect(result.verified).toBe(false);
    expect(result.error).toContain('Amount mismatch');
  });

  it('should reject expired attestation', async () => {
    const vaa = createMockVAA({
      expiresAt: new Date(Date.now() - 60_000), // Expired 1 minute ago
    });

    const result = await verifier.verify(vaa);
    expect(result.verified).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('should accept valid attestation with all checks passing', async () => {
    const vaa = createMockVAA({
      signatureCount: 15,
      amount: BigInt(1000),
      recipient: '0xabc...',
      tokenAddress: 'EDGEtoken...',
      targetChain: 'ethereum',
    });

    const result = await verifier.verify(vaa, {
      expectedAmount: BigInt(1000),
      expectedRecipient: '0xabc...',
      expectedToken: 'EDGEtoken...',
      expectedTargetChain: 'ethereum',
    });

    expect(result.verified).toBe(true);
    expect(result.attestation).toBeDefined();
    expect(result.attestation!.status).toBe('verified');
  });
});

describe('VelocityChecker', () => {
  it('should reject transfer exceeding hourly volume limit', async () => {
    // Seed: user already bridged $90,000 in the last hour (limit: $100,000)
    await seedRecentTransfers(userId, {
      count: 3,
      totalUsd: 90_000,
      withinHours: 1,
    });

    const result = await velocityChecker.check({
      userId,
      amountUsd: 15_000, // Would push to $105k, exceeding $100k limit
      sourceChain: 'solana',
      targetChain: 'ethereum',
    });

    expect(result.allowed).toBe(false);
    expect(result.limitHit).toBe('maxHourlyVolumeUsd');
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('should reject when max pending transfers reached', async () => {
    await seedPendingTransfers(userId, { count: 5 }); // Limit is 5

    const result = await velocityChecker.check({
      userId,
      amountUsd: 100,
      sourceChain: 'solana',
      targetChain: 'ethereum',
    });

    expect(result.allowed).toBe(false);
    expect(result.limitHit).toBe('maxPendingTransfers');
  });
});

describe('CircuitBreaker', () => {
  it('should trip and block all new transfers', async () => {
    await circuitBreaker.trip({
      reason: 'anomaly_detected',
      triggeredBy: 'anomaly_detector',
      triggeredAt: new Date(),
      autoTriggered: true,
    });

    const result = await bridgeService.bridgeTokens(validRequest, ctx);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(BridgeErrorCode.BRIDGE_EMERGENCY_PAUSED);
  });

  it('should allow transfers after reset', async () => {
    await circuitBreaker.trip({ reason: 'manual_admin_action', triggeredBy: 'admin' });
    await circuitBreaker.reset({ resetBy: 'admin', reviewNotes: 'Investigated — false alarm...' });

    const result = await bridgeService.bridgeTokens(validRequest, adminCtx);
    expect(result.success).toBe(true);
  });
});
```

### Testnet Integration Testing

```typescript
/**
 * Integration tests run against Wormhole/LayerZero testnets.
 * These are slow (minutes per test) and should run in CI nightly, not on every push.
 *
 * Testnet chains:
 * - Solana Devnet
 * - Ethereum Goerli / Sepolia
 * - Polygon Mumbai
 */
describe('Bridge Integration (Testnet)', () => {
  it('should complete a full Solana → Ethereum bridge via Wormhole', async () => {
    const result = await bridgeService.bridgeTokens({
      userId: 'test-user',
      sourceChain: 'solana',
      targetChain: 'ethereum',
      sourceTokenAddress: TESTNET_EDGE_MINT,
      amount: BigInt(1_000_000), // 1 EDGE on testnet
      recipientAddress: TESTNET_ETH_RECIPIENT,
      idempotencyKey: uuidv7(),
    }, testCtx);

    expect(result.success).toBe(true);

    // Monitor until completion (up to 10 minutes on testnet)
    const completed = await monitorBridgeTransfer(
      bridgeService,
      result.transfer!.id,
      { timeoutMs: 10 * 60 * 1000 },
    );

    expect(completed.status).toBe('completed');
    expect(completed.targetTxHash).toBeDefined();
    expect(completed.amountReceived).toBeGreaterThan(0n);
  }, 15 * 60 * 1000); // 15 minute timeout for testnet
});
```

### Coverage Requirements

| Area | Minimum Coverage | Notes |
|------|-----------------|-------|
| Attestation verification | **100%** | Every branch must be tested — this is the security boundary |
| Velocity checking | **95%** | All limit types and edge cases |
| Circuit breaker | **95%** | Trip, reset, concurrent access |
| Transfer lifecycle | **90%** | All state transitions |
| Fee estimation | **85%** | Multi-chain scenarios |
| Route resolution | **85%** | Active/inactive/paused routes |
| Error handling | **90%** | All error codes exercised |
| Overall module | **90%** | Lines + branches |

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/web3-core/solana` | Source/target chain for Solana-side bridge operations |
| `@mcv/web3-core/evm` | Source/target chain for EVM-side bridge operations |
| `@mcv/web3-core/tokens` | Token registry, metadata, decimal conversions |
| `@mcv/web3-core/wallets` | User wallet addresses for source/recipient resolution |
| `@mcv/web3-core/pricing` | Real-time USD pricing for fee estimation and limits |
| `@mcv/web3-core/transactions` | Transaction building and submission |
| `@mcv/platform/notifications` | User notifications for bridge status updates |
| `@mcv/platform/admin` | Admin dashboard for bridge monitoring and control |

---

*Last updated: 2025-02-08*
*Module owner: Web3 Core Team*
*Security review: Required before any changes to attestation verification or circuit breaker logic*