# @mcv/web3-core/defi

> **Tier 5 — MCV-Only Domain Module**
> DeFi protocol integrations for the EDGE token ecosystem on Solana.

| Field | Value |
|---|---|
| **Package** | `@mcv/web3-core/defi` |
| **Tier** | 5 (Domain — MCV-Only) |
| **Runtime** | Server (Node.js / Edge Workers) |
| **DB** | Supabase PostgreSQL via Drizzle ORM |
| **Chain** | Solana Mainnet-Beta / Devnet |
| **Protocols** | Jupiter, Raydium, Orca, Marinade |
| **Primary Asset** | EDGE token |
| **Depends On** | `@mcv/web3-core/solana`, `@mcv/web3-core/token`, `@mcv/shared/db`, `@mcv/shared/config` |

---

## Purpose

The `@mcv/web3-core/defi` module is the central nervous system for all decentralized finance operations within the MCV platform. It provides a unified, protocol-agnostic interface for swapping tokens, managing liquidity positions, executing yield farming strategies, and monitoring risk across the Solana DeFi ecosystem. Every interaction between EDGE tokens and on-chain DeFi protocols flows through this module — from a simple Jupiter swap to a fully automated concentrated liquidity rebalancing strategy.

DeFi on Solana moves fast. Pools appear and disappear, liquidity shifts between protocols, and price impact can wipe out returns in a single oversized swap. This module exists to abstract that complexity behind a clean service layer while preserving the low-level control that advanced strategies demand. It maintains a complete off-chain mirror of all DeFi positions in Supabase PostgreSQL, enabling real-time portfolio views, impermanent loss calculations, and historical performance tracking without hammering RPC nodes for every read.

The architecture is built around a **Strategy Engine** that can compose primitive DeFi operations (swap, add liquidity, remove liquidity, stake, harvest) into automated workflows. Strategies run on configurable schedules with circuit breakers, slippage guards, and sandwich attack detection. Every operation is logged, every position is tracked, and every risk metric is monitored — because in DeFi, the difference between profit and catastrophic loss is often a single unchecked parameter.

---

## Exports

```typescript
// @mcv/web3-core/defi - Public API

// ── Core Services ──────────────────────────────────────────────
export { DeFiService } from './services/defi.service';
export { SwapService } from './services/swap.service';
export { LiquidityService } from './services/liquidity.service';
export { YieldService } from './services/yield.service';
export { StrategyEngine } from './services/strategy-engine.service';
export { RiskMonitor } from './services/risk-monitor.service';
export { PositionManager } from './services/position-manager.service';
export { PriceImpactCalculator } from './services/price-impact.service';
export { ImpermanentLossTracker } from './services/il-tracker.service';
export { TVLAggregator } from './services/tvl-aggregator.service';

// ── Protocol Adapters ──────────────────────────────────────────
export { JupiterAdapter } from './adapters/jupiter.adapter';
export { RaydiumAdapter } from './adapters/raydium.adapter';
export { OrcaAdapter } from './adapters/orca.adapter';
export { MarinadeAdapter } from './adapters/marinade.adapter';

// ── tRPC Router ────────────────────────────────────────────────
export { defiRouter } from './router';
export type { DefiRouter } from './router';

// ── Types & Interfaces ────────────────────────────────────────
export type {
  SwapParams,
  SwapQuote,
  SwapResult,
  SwapRoute,
  RouteStep,
} from './types/swap.types';

export type {
  LiquidityPool,
  PoolInfo,
  PoolReserves,
  LPPosition,
  AddLiquidityParams,
  RemoveLiquidityParams,
  ConcentratedLiquidityRange,
} from './types/liquidity.types';

export type {
  YieldStrategy,
  YieldStrategyConfig,
  FarmPosition,
  HarvestResult,
  CompoundResult,
  APYBreakdown,
} from './types/yield.types';

export type {
  DeFiPosition,
  PositionSnapshot,
  PositionType,
  PositionStatus,
  PositionPerformance,
  UnifiedPortfolio,
} from './types/position.types';

export type {
  ImpermanentLossResult,
  ILSnapshot,
  ILTimeSeries,
} from './types/il.types';

export type {
  Strategy,
  StrategyConfig,
  StrategyExecution,
  StrategyTrigger,
  StrategyAction,
  StrategyStatus,
} from './types/strategy.types';

export type {
  RiskAlert,
  RiskLevel,
  RiskMetrics,
  PoolHealthCheck,
  OracleDeviation,
} from './types/risk.types';

export type {
  Protocol,
  ProtocolAdapter,
  ProtocolInfo,
} from './types/protocol.types';

// ── DB Schema ──────────────────────────────────────────────────
export {
  defiPositions,
  liquidityPools,
  yieldStrategies,
  swapHistory,
  strategyExecutions,
  ilSnapshots,
  riskAlerts,
} from './db/schema';

// ── Constants ──────────────────────────────────────────────────
export {
  SUPPORTED_PROTOCOLS,
  EDGE_TOKEN_MINT,
  DEFAULT_SLIPPAGE_BPS,
  MAX_SLIPPAGE_BPS,
  STRATEGY_INTERVAL_MS,
  RISK_THRESHOLDS,
} from './constants';

// ── Error Codes ────────────────────────────────────────────────
export { DefiErrorCode, DefiError } from './errors';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         tRPC API Layer                                  │
│   defiRouter: swap / quote / addLiquidity / removeLiquidity / farm /   │
│               positions / strategies / risk / tvl / history            │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────────┐
│                        DeFiService (Orchestrator)                       │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ SwapService  │  │ Liquidity    │  │ YieldService │  │ Position   │ │
│  │              │  │ Service      │  │              │  │ Manager    │ │
│  │ • quote()   │  │ • addLP()    │  │ • stake()    │  │ • sync()   │ │
│  │ • execute() │  │ • removeLP() │  │ • harvest()  │  │ • track()  │ │
│  │ • route()   │  │ • rebalance()│  │ • compound() │  │ • history()│ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                 │                  │                │        │
│  ┌──────▼─────────────────▼──────────────────▼────────────────▼──────┐ │
│  │                    Strategy Engine                                 │ │
│  │                                                                    │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │ │
│  │  │ Trigger     │  │ Action       │  │ Circuit Breakers         │  │ │
│  │  │ Evaluator   │  │ Composer     │  │                          │  │ │
│  │  │             │  │              │  │ • Max loss per execution │  │ │
│  │  │ • Schedule  │  │ • Swap+LP    │  │ • Slippage guard         │  │ │
│  │  │ • Price     │  │ • Harvest+   │  │ • Sandwich detection     │  │ │
│  │  │ • Range     │  │   Compound   │  │ • Oracle deviation halt  │  │ │
│  │  │ • TVL shift │  │ • Rebalance  │  │ • Daily loss limit       │  │ │
│  │  └─────────────┘  └──────────────┘  └──────────────────────────┘  │ │
│  └───────────────────────────┬───────────────────────────────────────┘ │
│                              │                                         │
│  ┌───────────────────────────▼───────────────────────────────────────┐ │
│  │                    Risk Monitor                                    │ │
│  │                                                                    │ │
│  │  • Pool health checks          • Oracle deviation tracking        │ │
│  │  • Utilization rate alerts      • IL threshold warnings           │ │
│  │  • Price impact simulation      • Strategy performance scoring    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                       Protocol Adapter Layer                            │
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ ┌────────────────┐ │
│  │   Jupiter    │ │   Raydium    │ │    Orca     │ │   Marinade     │ │
│  │   Adapter    │ │   Adapter    │ │   Adapter   │ │   Adapter      │ │
│  │              │ │              │ │             │ │                │ │
│  │ • Aggregator │ │ • AMM Pools  │ │ • Whirlpool│ │ • mSOL Stake   │ │
│  │ • Route      │ │ • CLMM       │ │ • CL Pools │ │ • Delayed      │ │
│  │   Discovery  │ │ • Farm/Stake │ │ • Rewards  │ │   Unstake      │ │
│  │ • DCA        │ │ • AcceleRayt │ │            │ │ • Native Stake │ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬─────┘ └───────┬────────┘ │
│         │                │                │                │          │
│  ┌──────▼────────────────▼────────────────▼────────────────▼────────┐ │
│  │              Solana Connection Manager                            │ │
│  │              (@mcv/web3-core/solana)                               │ │
│  │                                                                    │ │
│  │  • RPC pool with failover    • Transaction builder & signer       │ │
│  │  • Priority fee estimation   • Confirmation with retry            │ │
│  │  • Compute budget optimizer  • Jito bundle support (optional)     │ │
│  └───────────────────────────────┬──────────────────────────────────┘ │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                        Solana Blockchain                                │
│                                                                         │
│  Programs: Jupiter v6 │ Raydium AMM/CLMM │ Orca Whirlpool │ Marinade  │
│  Tokens:   EDGE │ SOL │ USDC │ mSOL │ LP tokens │ reward tokens       │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────┐
                    │   Off-Chain Data Layer    │
                    │   (Supabase PostgreSQL)   │
                    │                          │
                    │  • defi_positions        │
                    │  • liquidity_pools       │
                    │  • yield_strategies      │
                    │  • swap_history          │
                    │  • strategy_executions   │
                    │  • il_snapshots          │
                    │  • risk_alerts           │
                    └──────────────────────────┘
```

### Data Flow: Swap Execution

```
User Request                Protocol Selection              On-Chain
    │                            │                             │
    ▼                            ▼                             ▼
┌─────────┐   quote()   ┌──────────────┐  getRoutes()  ┌───────────┐
│  tRPC   │────────────▶│  SwapService │──────────────▶│  Jupiter  │
│  Client │             │              │               │  Adapter  │
└─────────┘             │  1. Validate │◀──────────────│           │
                        │  2. Check IL │  SwapRoute[]  └───────────┘
                        │  3. Simulate │
                        │  4. Guard    │  execute()    ┌───────────┐
                        │     slippage │──────────────▶│  Solana   │
                        │  5. Execute  │               │  TX Build │
                        │  6. Confirm  │◀──────────────│  + Sign   │
                        │  7. Record   │  TxSignature  └───────────┘
                        └──────┬───────┘
                               │
                        record()│
                               ▼
                        ┌──────────────┐
                        │  swap_history│
                        │  (Supabase)  │
                        └──────────────┘
```

---

## Core Interfaces

### Protocol Adapter Interface

Every DeFi protocol implements this common adapter interface, enabling the service layer to interact with any protocol through a uniform contract.

```typescript
// ── Protocol Adapter Base ──────────────────────────────────────

/** Supported DeFi protocols */
export type Protocol = 'jupiter' | 'raydium' | 'orca' | 'marinade';

/** Capabilities that a protocol adapter may support */
export type ProtocolCapability =
  | 'swap'
  | 'amm_liquidity'
  | 'concentrated_liquidity'
  | 'farming'
  | 'staking'
  | 'dca'
  | 'limit_order';

/** Static metadata about a protocol */
export interface ProtocolInfo {
  readonly protocol: Protocol;
  readonly name: string;
  readonly version: string;
  readonly programIds: string[];
  readonly capabilities: ProtocolCapability[];
  readonly website: string;
  readonly docsUrl: string;
}

/**
 * Base interface for all protocol adapters.
 *
 * Each adapter wraps a specific on-chain program and exposes
 * its functionality through a normalized interface. Adapters
 * are responsible for:
 * - Translating generic params into protocol-specific instructions
 * - Building transactions with correct compute budgets
 * - Parsing on-chain accounts into domain types
 * - Handling protocol-specific error codes
 */
export interface ProtocolAdapter {
  /** Protocol metadata */
  readonly info: ProtocolInfo;

  /** Initialize connection, load program accounts */
  initialize(): Promise<void>;

  /** Health check — can we reach the program? */
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;

  /** Graceful shutdown */
  destroy(): Promise<void>;
}
```

### DeFiService (Orchestrator)

```typescript
// ── DeFi Service ───────────────────────────────────────────────

/**
 * Top-level orchestrator for all DeFi operations.
 *
 * The DeFiService doesn't contain business logic itself — it
 * delegates to specialized services (SwapService, LiquidityService,
 * etc.) and coordinates cross-cutting concerns like position
 * tracking, risk checks, and event emission.
 */
export interface IDeFiService {
  // ── Swap Operations ────────────────────────────────────────
  /** Get a swap quote with optimal routing */
  getSwapQuote(params: SwapParams): Promise<SwapQuote>;

  /** Execute a swap with full guards */
  executeSwap(params: SwapParams): Promise<SwapResult>;

  /** Get available routes for a token pair */
  getRoutes(inputMint: string, outputMint: string): Promise<SwapRoute[]>;

  // ── Liquidity Operations ───────────────────────────────────
  /** Add liquidity to a pool */
  addLiquidity(params: AddLiquidityParams): Promise<LPPosition>;

  /** Remove liquidity from a pool */
  removeLiquidity(params: RemoveLiquidityParams): Promise<RemoveLiquidityResult>;

  /** Get all pools for a token pair */
  getPools(tokenA: string, tokenB: string): Promise<LiquidityPool[]>;

  /** Get detailed pool info including reserves and APY */
  getPoolInfo(poolAddress: string): Promise<PoolInfo>;

  // ── Yield Operations ───────────────────────────────────────
  /** Stake LP tokens in a farm */
  stakeFarm(params: StakeFarmParams): Promise<FarmPosition>;

  /** Harvest pending rewards */
  harvestRewards(positionId: string): Promise<HarvestResult>;

  /** Auto-compound: harvest + swap rewards + add liquidity */
  autoCompound(positionId: string): Promise<CompoundResult>;

  /** Get APY breakdown for a pool/farm */
  getAPYBreakdown(poolAddress: string): Promise<APYBreakdown>;

  // ── Position Management ────────────────────────────────────
  /** Get all DeFi positions for a wallet */
  getPositions(walletAddress: string): Promise<DeFiPosition[]>;

  /** Get unified portfolio view across all protocols */
  getPortfolio(walletAddress: string): Promise<UnifiedPortfolio>;

  /** Sync on-chain positions with off-chain database */
  syncPositions(walletAddress: string): Promise<SyncResult>;

  // ── Impermanent Loss ───────────────────────────────────────
  /** Calculate current IL for a position */
  calculateIL(positionId: string): Promise<ImpermanentLossResult>;

  /** Get IL time series for charting */
  getILTimeSeries(positionId: string, range: TimeRange): Promise<ILTimeSeries>;

  // ── Strategy ───────────────────────────────────────────────
  /** Create an automated DeFi strategy */
  createStrategy(config: StrategyConfig): Promise<Strategy>;

  /** Pause/resume a strategy */
  setStrategyStatus(strategyId: string, status: StrategyStatus): Promise<void>;

  /** Get strategy execution history */
  getStrategyHistory(strategyId: string): Promise<StrategyExecution[]>;

  // ── Risk & Monitoring ──────────────────────────────────────
  /** Get current risk metrics for all positions */
  getRiskMetrics(walletAddress: string): Promise<RiskMetrics>;

  /** Get active risk alerts */
  getAlerts(walletAddress: string): Promise<RiskAlert[]>;

  /** Get total value locked across all positions */
  getTVL(walletAddress: string): Promise<TVLSummary>;
}
```

### Swap Types

```typescript
// ── Swap Types ─────────────────────────────────────────────────

/**
 * Parameters for requesting a swap quote or executing a swap.
 *
 * The swap flow:
 * 1. Client sends SwapParams → getSwapQuote()
 * 2. Service queries Jupiter (and optionally Raydium/Orca direct)
 * 3. Returns best SwapQuote with route details
 * 4. Client confirms → executeSwap() with same params
 * 5. Service builds TX, signs, sends, confirms
 * 6. Returns SwapResult with signature and actual amounts
 */
export interface SwapParams {
  /** Source token mint address */
  inputMint: string;

  /** Destination token mint address */
  outputMint: string;

  /**
   * Amount in smallest unit (lamports for SOL, raw for SPL).
   * Interpreted as input amount by default.
   * Set `exactOutput` to true to treat as desired output amount.
   */
  amount: bigint;

  /** If true, `amount` is the desired output (exact-out swap) */
  exactOutput?: boolean;

  /**
   * Maximum slippage in basis points (1 bps = 0.01%).
   * Default: 50 (0.5%). Hard cap: 1000 (10%).
   *
   * @example 50 = 0.5% slippage tolerance
   * @example 100 = 1.0% slippage tolerance
   */
  slippageBps?: number;

  /** Wallet address performing the swap */
  walletAddress: string;

  /** Preferred protocol(s). If empty, auto-routes via Jupiter */
  preferredProtocols?: Protocol[];

  /**
   * Priority fee configuration.
   * 'auto' = estimate from recent blocks.
   * number = explicit microlamports per compute unit.
   */
  priorityFee?: 'auto' | number;

  /** Enable Jito bundle submission for MEV protection */
  useJitoBundle?: boolean;

  /** Optional: strategy ID if this swap is part of an automated strategy */
  strategyId?: string;

  /** Optional: idempotency key to prevent duplicate submissions */
  idempotencyKey?: string;
}

/** A single hop in a multi-hop swap route */
export interface RouteStep {
  /** Protocol handling this hop */
  protocol: Protocol;

  /** Pool or market address for this hop */
  poolAddress: string;

  /** Input token for this hop */
  inputMint: string;

  /** Output token for this hop */
  outputMint: string;

  /** Input amount for this hop */
  inputAmount: bigint;

  /** Expected output amount for this hop */
  expectedOutputAmount: bigint;

  /** Fee for this hop in basis points */
  feeBps: number;

  /** Pool fee tier (for concentrated liquidity) */
  feeRate?: number;
}

/** Complete swap route (may be multi-hop) */
export interface SwapRoute {
  /** Ordered hops */
  steps: RouteStep[];

  /** Total input amount */
  inputAmount: bigint;

  /** Total expected output amount */
  expectedOutputAmount: bigint;

  /** Minimum output after slippage */
  minimumOutputAmount: bigint;

  /** Price impact as a decimal (0.01 = 1%) */
  priceImpact: number;

  /** Estimated total fees in USD */
  estimatedFeesUsd: number;

  /** Estimated execution time in ms */
  estimatedTimeMs: number;

  /** Route quality score (0-100, higher = better) */
  score: number;
}

/** Quote returned before swap execution */
export interface SwapQuote {
  /** Best route found */
  route: SwapRoute;

  /** Alternative routes sorted by score */
  alternativeRoutes: SwapRoute[];

  /** Quote timestamp (quotes expire quickly) */
  quotedAt: Date;

  /** Quote expiry (typically 30-60 seconds) */
  expiresAt: Date;

  /** Input token price in USD at quote time */
  inputPriceUsd: number;

  /** Output token price in USD at quote time */
  outputPriceUsd: number;

  /** Effective exchange rate */
  exchangeRate: number;

  /** Price impact warning level */
  priceImpactLevel: 'low' | 'medium' | 'high' | 'extreme';

  /** Human-readable warnings */
  warnings: string[];
}

/** Result of an executed swap */
export interface SwapResult {
  /** Solana transaction signature */
  signature: string;

  /** Actual input amount spent */
  inputAmount: bigint;

  /** Actual output amount received */
  outputAmount: bigint;

  /** Actual price impact */
  priceImpact: number;

  /** Actual fees paid in USD */
  feesUsd: number;

  /** Route that was executed */
  route: SwapRoute;

  /** Block slot of confirmation */
  slot: number;

  /** Timestamp of confirmation */
  confirmedAt: Date;

  /** Time from submission to confirmation in ms */
  latencyMs: number;

  /** Internal swap history ID for tracking */
  swapHistoryId: string;
}
```

### Liquidity Pool Types

```typescript
// ── Liquidity Pool Types ───────────────────────────────────────

/** Types of liquidity pool */
export type PoolType =
  | 'constant_product'     // x*y=k (Raydium AMM, Orca legacy)
  | 'concentrated'         // Raydium CLMM, Orca Whirlpool
  | 'stable'               // Stable swap curve
  | 'weighted';            // Weighted pools (future)

/** On-chain pool representation */
export interface LiquidityPool {
  /** Pool account address */
  address: string;

  /** Protocol that owns this pool */
  protocol: Protocol;

  /** Pool type */
  type: PoolType;

  /** Token A mint */
  tokenAMint: string;

  /** Token A symbol (cached) */
  tokenASymbol: string;

  /** Token B mint */
  tokenBMint: string;

  /** Token B symbol (cached) */
  tokenBSymbol: string;

  /** Fee tier in basis points */
  feeBps: number;

  /** Current tick spacing (concentrated liquidity only) */
  tickSpacing?: number;

  /** Current price of token A in terms of token B */
  currentPrice: number;

  /** 24h volume in USD */
  volume24hUsd: number;

  /** Total value locked in USD */
  tvlUsd: number;

  /** Annualized fee APY */
  feeApy: number;

  /** Combined APY (fees + rewards) */
  totalApy: number;

  /** Whether this pool has active farming rewards */
  hasFarmRewards: boolean;

  /** Reward token mints (if farming is active) */
  rewardMints?: string[];

  /** Last time pool data was refreshed */
  lastRefreshed: Date;
}

/** Detailed pool information including reserves */
export interface PoolInfo extends LiquidityPool {
  /** Token A reserve amount */
  reserveA: bigint;

  /** Token B reserve amount */
  reserveB: bigint;

  /** LP token mint address */
  lpMint: string;

  /** Total LP token supply */
  lpSupply: bigint;

  /** For concentrated pools: current tick index */
  currentTickIndex?: number;

  /** For concentrated pools: sqrt price */
  sqrtPrice?: bigint;

  /** 7-day volume history */
  volumeHistory7d: { date: string; volumeUsd: number }[];

  /** 7-day TVL history */
  tvlHistory7d: { date: string; tvlUsd: number }[];

  /** Pool creation timestamp */
  createdAt: Date;
}

/** Current reserves of a pool */
export interface PoolReserves {
  tokenA: bigint;
  tokenB: bigint;
  lpSupply: bigint;
  lastUpdated: Date;
}

/** Parameters for adding liquidity */
export interface AddLiquidityParams {
  /** Pool to add liquidity to */
  poolAddress: string;

  /** Wallet providing liquidity */
  walletAddress: string;

  /** Amount of token A to deposit */
  amountA: bigint;

  /** Amount of token B to deposit */
  amountB: bigint;

  /** Slippage tolerance in basis points */
  slippageBps?: number;

  /**
   * For concentrated liquidity: lower price bound.
   * Omit for constant product pools.
   */
  priceLower?: number;

  /**
   * For concentrated liquidity: upper price bound.
   * Omit for constant product pools.
   */
  priceUpper?: number;

  /** Strategy ID if this is part of an automated strategy */
  strategyId?: string;
}

/** Parameters for removing liquidity */
export interface RemoveLiquidityParams {
  /** Position ID in our database */
  positionId: string;

  /** Wallet performing the withdrawal */
  walletAddress: string;

  /**
   * Percentage of position to remove (1-100).
   * 100 = full withdrawal.
   */
  percentage: number;

  /** Slippage tolerance in basis points */
  slippageBps?: number;

  /** Whether to close the position account (saves rent) */
  closePosition?: boolean;
}

/** Result of removing liquidity */
export interface RemoveLiquidityResult {
  /** Transaction signature */
  signature: string;

  /** Amount of token A received */
  amountA: bigint;

  /** Amount of token B received */
  amountB: bigint;

  /** Fees earned that were collected */
  feesCollectedA: bigint;
  feesCollectedB: bigint;

  /** Updated position (null if fully closed) */
  position: LPPosition | null;
}

/** Concentrated liquidity range definition */
export interface ConcentratedLiquidityRange {
  /** Lower tick index */
  tickLower: number;

  /** Upper tick index */
  tickUpper: number;

  /** Lower price (human-readable) */
  priceLower: number;

  /** Upper price (human-readable) */
  priceUpper: number;

  /** Whether price is currently in range */
  inRange: boolean;

  /** Percentage of time in range over last 24h */
  inRangePercent24h: number;
}

/** A user's liquidity position */
export interface LPPosition {
  /** Internal position ID */
  id: string;

  /** Pool this position belongs to */
  pool: LiquidityPool;

  /** On-chain position account (for concentrated liquidity) */
  positionAddress?: string;

  /** Wallet owning this position */
  walletAddress: string;

  /** LP tokens held (for constant product pools) */
  lpTokens?: bigint;

  /** Current liquidity (for concentrated pools) */
  liquidity?: bigint;

  /** Range (for concentrated pools) */
  range?: ConcentratedLiquidityRange;

  /** Current value of token A in position */
  currentAmountA: bigint;

  /** Current value of token B in position */
  currentAmountB: bigint;

  /** Total position value in USD */
  valueUsd: number;

  /** Uncollected fees in token A */
  unclaimedFeesA: bigint;

  /** Uncollected fees in token B */
  unclaimedFeesB: bigint;

  /** Deposit amounts for IL calculation */
  depositAmountA: bigint;
  depositAmountB: bigint;
  depositValueUsd: number;
  depositedAt: Date;

  /** Current impermanent loss percentage (negative = loss) */
  impermanentLossPct: number;

  /** Position PnL in USD (including fees, rewards, IL) */
  pnlUsd: number;

  /** Status */
  status: 'active' | 'out_of_range' | 'closed';
}
```

### Yield & Farming Types

```typescript
// ── Yield & Farming Types ──────────────────────────────────────

/** Configuration for a yield farming strategy */
export interface YieldStrategyConfig {
  /** Human-readable name */
  name: string;

  /** Pool to farm */
  poolAddress: string;

  /** Protocol */
  protocol: Protocol;

  /** Auto-compound interval in milliseconds (0 = manual only) */
  compoundIntervalMs: number;

  /** Minimum reward value (USD) before triggering compound */
  minCompoundValueUsd: number;

  /** Whether to auto-harvest rewards on schedule */
  autoHarvest: boolean;

  /** Whether to auto-compound harvested rewards back into LP */
  autoCompound: boolean;

  /** Maximum acceptable IL before pausing (as percentage, e.g. 5.0 = 5%) */
  maxILPercent: number;

  /** Whether to auto-rebalance concentrated liquidity ranges */
  autoRebalance: boolean;

  /** Rebalance trigger: percentage price has moved out of range center */
  rebalanceTriggerPercent?: number;

  /** Target allocation: what percent of portfolio to keep in this farm */
  targetAllocationPercent?: number;
}

/** Active yield strategy with runtime state */
export interface YieldStrategy extends YieldStrategyConfig {
  /** Strategy ID */
  id: string;

  /** Owner wallet */
  walletAddress: string;

  /** Associated position ID */
  positionId: string;

  /** Current status */
  status: 'active' | 'paused' | 'stopped' | 'error';

  /** Last compound execution timestamp */
  lastCompoundAt: Date | null;

  /** Last harvest execution timestamp */
  lastHarvestAt: Date | null;

  /** Next scheduled action timestamp */
  nextActionAt: Date | null;

  /** Total rewards harvested (USD) */
  totalHarvestedUsd: number;

  /** Total times compounded */
  compoundCount: number;

  /** Error message if status is 'error' */
  errorMessage?: string;

  /** Created timestamp */
  createdAt: Date;

  /** Updated timestamp */
  updatedAt: Date;
}

/** Farm staking parameters */
export interface StakeFarmParams {
  /** Pool address to farm */
  poolAddress: string;

  /** Wallet staking */
  walletAddress: string;

  /** LP tokens to stake (or position NFT for concentrated) */
  amount: bigint;

  /** Optional strategy config for auto-management */
  strategyConfig?: YieldStrategyConfig;
}

/** Active farm position */
export interface FarmPosition {
  /** Position ID */
  id: string;

  /** Pool address */
  poolAddress: string;

  /** Farm/staking program address */
  farmAddress: string;

  /** Protocol */
  protocol: Protocol;

  /** Staked LP amount */
  stakedAmount: bigint;

  /** Staked value in USD */
  stakedValueUsd: number;

  /** Pending rewards per reward token */
  pendingRewards: {
    mint: string;
    symbol: string;
    amount: bigint;
    valueUsd: number;
  }[];

  /** Total pending rewards in USD */
  totalPendingUsd: number;

  /** Current APY */
  currentApy: number;

  /** Associated yield strategy (if any) */
  strategyId?: string;

  /** Staked timestamp */
  stakedAt: Date;
}

/** Result of harvesting rewards */
export interface HarvestResult {
  /** Transaction signature */
  signature: string;

  /** Harvested rewards */
  rewards: {
    mint: string;
    symbol: string;
    amount: bigint;
    valueUsd: number;
  }[];

  /** Total USD value harvested */
  totalValueUsd: number;

  /** Timestamp */
  harvestedAt: Date;
}

/** Result of auto-compounding */
export interface CompoundResult {
  /** Harvest transaction signature */
  harvestSignature: string;

  /** Swap transaction signature (rewards → pool tokens) */
  swapSignature?: string;

  /** Add liquidity transaction signature */
  addLiquiditySignature?: string;

  /** Total value compounded in USD */
  compoundedValueUsd: number;

  /** New LP tokens / liquidity added */
  additionalLiquidity: bigint;

  /** Gas cost in SOL */
  gasCostSol: number;

  /** Net gain after gas */
  netGainUsd: number;

  /** Timestamp */
  compoundedAt: Date;
}

/** Breakdown of APY sources */
export interface APYBreakdown {
  /** Pool address */
  poolAddress: string;

  /** Trading fee APY */
  feeApy: number;

  /** Reward token APY (farming incentives) */
  rewardApy: number;

  /** Combined APY before compounding */
  totalApy: number;

  /** Projected APY with daily compounding */
  compoundedApy: number;

  /** 7-day average APY */
  avgApy7d: number;

  /** 30-day average APY */
  avgApy30d: number;

  /** APY data freshness */
  calculatedAt: Date;

  /** Confidence level based on data age and volume */
  confidence: 'high' | 'medium' | 'low';
}
```

### Position & Portfolio Types

```typescript
// ── Position & Portfolio Types ─────────────────────────────────

/** Type of DeFi position */
export type PositionType =
  | 'lp_constant_product'
  | 'lp_concentrated'
  | 'farm_staked'
  | 'liquid_staking'
  | 'pending_swap';

/** Status of a position */
export type PositionStatus =
  | 'active'
  | 'out_of_range'
  | 'paused'
  | 'closing'
  | 'closed'
  | 'error';

/** Unified DeFi position across all protocols */
export interface DeFiPosition {
  /** Internal position ID */
  id: string;

  /** Position type */
  type: PositionType;

  /** Protocol */
  protocol: Protocol;

  /** Status */
  status: PositionStatus;

  /** Pool address (if applicable) */
  poolAddress?: string;

  /** Wallet owning this position */
  walletAddress: string;

  /** Current value in USD */
  valueUsd: number;

  /** Deposit value in USD */
  depositValueUsd: number;

  /** PnL in USD */
  pnlUsd: number;

  /** PnL percentage */
  pnlPercent: number;

  /** Current APY (if yield-generating) */
  currentApy?: number;

  /** Unclaimed rewards in USD */
  unclaimedRewardsUsd: number;

  /** Impermanent loss percentage (LP positions only) */
  impermanentLossPct?: number;

  /** Underlying assets */
  assets: {
    mint: string;
    symbol: string;
    amount: bigint;
    valueUsd: number;
  }[];

  /** Associated strategy (if auto-managed) */
  strategyId?: string;

  /** Risk level assessment */
  riskLevel: RiskLevel;

  /** Position opened timestamp */
  openedAt: Date;

  /** Last synced with on-chain data */
  lastSyncedAt: Date;

  /** Protocol-specific metadata */
  metadata: Record<string, unknown>;
}

/** Snapshot of a position at a point in time */
export interface PositionSnapshot {
  positionId: string;
  valueUsd: number;
  pnlUsd: number;
  impermanentLossPct: number | null;
  apy: number | null;
  snapshotAt: Date;
}

/** Performance metrics for a position */
export interface PositionPerformance {
  positionId: string;

  /** Total return in USD (fees + rewards - IL - gas) */
  totalReturnUsd: number;

  /** Total return percentage */
  totalReturnPct: number;

  /** Fee income earned */
  feeIncomeUsd: number;

  /** Reward income earned */
  rewardIncomeUsd: number;

  /** Impermanent loss in USD */
  impermanentLossUsd: number;

  /** Gas costs in USD */
  gasCostsUsd: number;

  /** Annualized return */
  annualizedReturnPct: number;

  /** Sharpe ratio (if enough data) */
  sharpeRatio?: number;

  /** Time period for calculations */
  periodDays: number;

  /** Daily snapshots for charting */
  snapshots: PositionSnapshot[];
}

/** Unified portfolio view across all protocols */
export interface UnifiedPortfolio {
  /** Wallet address */
  walletAddress: string;

  /** Total value across all DeFi positions */
  totalValueUsd: number;

  /** Total PnL across all positions */
  totalPnlUsd: number;

  /** Total PnL percentage */
  totalPnlPct: number;

  /** Total unclaimed rewards */
  totalUnclaimedRewardsUsd: number;

  /** Positions grouped by protocol */
  byProtocol: Record<Protocol, {
    positions: DeFiPosition[];
    totalValueUsd: number;
    totalPnlUsd: number;
  }>;

  /** Positions grouped by type */
  byType: Record<PositionType, {
    positions: DeFiPosition[];
    totalValueUsd: number;
  }>;

  /** Asset allocation breakdown */
  allocation: {
    mint: string;
    symbol: string;
    totalValueUsd: number;
    percentOfPortfolio: number;
  }[];

  /** Active strategies */
  strategies: YieldStrategy[];

  /** Active risk alerts */
  alerts: RiskAlert[];

  /** Portfolio last synced */
  lastSyncedAt: Date;
}

/** Result of syncing positions with on-chain state */
export interface SyncResult {
  /** Positions created (new on-chain positions discovered) */
  created: number;

  /** Positions updated (values/status changed) */
  updated: number;

  /** Positions closed (no longer on-chain) */
  closed: number;

  /** Errors encountered during sync */
  errors: { positionId: string; error: string }[];

  /** Sync duration in ms */
  durationMs: number;
}
```

### Impermanent Loss Types

```typescript
// ── Impermanent Loss Types ─────────────────────────────────────

/**
 * Impermanent loss calculation result.
 *
 * IL Formula (constant product):
 *   IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
 *
 * Where priceRatio = currentPrice / entryPrice
 *
 * For concentrated liquidity, IL is amplified by the
 * concentration factor:
 *   IL_concentrated ≈ IL_standard * (fullRange / positionRange)
 */
export interface ImpermanentLossResult {
  /** Position ID */
  positionId: string;

  /** IL as a percentage (negative = loss). e.g., -2.5 = 2.5% loss */
  ilPercent: number;

  /** IL in USD terms */
  ilUsd: number;

  /** Current value of the LP position */
  currentValueUsd: number;

  /** Value if tokens were held instead (HODL value) */
  hodlValueUsd: number;

  /** Fee income earned (offsets IL) */
  feeIncomeUsd: number;

  /** Reward income earned (offsets IL) */
  rewardIncomeUsd: number;

  /** Net PnL after IL + fees + rewards */
  netPnlUsd: number;

  /** Price at entry */
  entryPrice: number;

  /** Current price */
  currentPrice: number;

  /** Price ratio (current / entry) */
  priceRatio: number;

  /** For concentrated: amplification factor */
  concentrationFactor?: number;

  /** Calculation timestamp */
  calculatedAt: Date;
}

/** IL snapshot for time-series tracking */
export interface ILSnapshot {
  positionId: string;
  ilPercent: number;
  ilUsd: number;
  priceRatio: number;
  feeIncomeUsd: number;
  netPnlUsd: number;
  snapshotAt: Date;
}

/** Time series of IL data for charting */
export interface ILTimeSeries {
  positionId: string;
  snapshots: ILSnapshot[];
  currentIL: ImpermanentLossResult;
  /** Time range covered */
  from: Date;
  to: Date;
  /** Interval between data points */
  intervalMs: number;
}

/** Time range for queries */
export interface TimeRange {
  from: Date;
  to: Date;
}
```

### Strategy Types

```typescript
// ── Strategy Engine Types ──────────────────────────────────────

/** Trigger types that can initiate strategy execution */
export type StrategyTriggerType =
  | 'schedule'           // Cron-like interval
  | 'price_threshold'    // Token price crosses a threshold
  | 'range_exit'         // CL position goes out of range
  | 'il_threshold'       // IL exceeds configured max
  | 'tvl_change'         // Pool TVL changes significantly
  | 'apy_change'         // APY drops below threshold
  | 'manual';            // User-initiated

/** Strategy trigger configuration */
export interface StrategyTrigger {
  type: StrategyTriggerType;

  /** For 'schedule': interval in ms */
  intervalMs?: number;

  /** For 'price_threshold': price in USD */
  priceThreshold?: number;
  priceDirection?: 'above' | 'below';

  /** For 'il_threshold': max IL percent */
  ilThresholdPercent?: number;

  /** For 'tvl_change': percentage change */
  tvlChangePercent?: number;

  /** For 'apy_change': minimum acceptable APY */
  minApy?: number;
}

/** Actions a strategy can execute */
export type StrategyActionType =
  | 'swap'
  | 'add_liquidity'
  | 'remove_liquidity'
  | 'rebalance_range'
  | 'harvest'
  | 'compound'
  | 'stake'
  | 'unstake'
  | 'alert';

/** Strategy action definition */
export interface StrategyAction {
  type: StrategyActionType;

  /** Action-specific parameters */
  params: Record<string, unknown>;

  /** Order of execution (lower = first) */
  order: number;

  /** Whether to continue if this action fails */
  continueOnError: boolean;
}

/** Strategy status */
export type StrategyStatus =
  | 'active'
  | 'paused'
  | 'stopped'
  | 'error'
  | 'cooldown';

/** Complete strategy configuration */
export interface StrategyConfig {
  /** Human-readable name */
  name: string;

  /** Description */
  description: string;

  /** Wallet this strategy operates on */
  walletAddress: string;

  /** Trigger(s) that start the strategy */
  triggers: StrategyTrigger[];

  /** Actions to execute in order */
  actions: StrategyAction[];

  /** Maximum SOL to spend on gas per execution */
  maxGasPerExecutionSol: number;

  /** Maximum USD loss allowed per execution before circuit break */
  maxLossPerExecutionUsd: number;

  /** Daily loss limit in USD (circuit break for the day) */
  dailyLossLimitUsd: number;

  /** Minimum time between executions in ms */
  cooldownMs: number;

  /** Maximum consecutive failures before auto-pause */
  maxConsecutiveFailures: number;
}

/** Active strategy with state */
export interface Strategy extends StrategyConfig {
  id: string;
  status: StrategyStatus;
  lastExecutedAt: Date | null;
  nextExecutionAt: Date | null;
  consecutiveFailures: number;
  totalExecutions: number;
  totalGasSpentSol: number;
  totalPnlUsd: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Record of a single strategy execution */
export interface StrategyExecution {
  /** Execution ID */
  id: string;

  /** Strategy ID */
  strategyId: string;

  /** Trigger that caused this execution */
  trigger: StrategyTriggerType;

  /** Actions executed with results */
  actions: {
    type: StrategyActionType;
    status: 'success' | 'failed' | 'skipped';
    signature?: string;
    error?: string;
    durationMs: number;
  }[];

  /** Overall status */
  status: 'success' | 'partial' | 'failed';

  /** PnL from this execution in USD */
  pnlUsd: number;

  /** Gas cost in SOL */
  gasCostSol: number;

  /** Started timestamp */
  startedAt: Date;

  /** Completed timestamp */
  completedAt: Date;

  /** Duration in ms */
  durationMs: number;
}
```

### Risk Types

```typescript
// ── Risk Types ─────────────────────────────────────────────────

/** Risk severity levels */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Risk alert */
export interface RiskAlert {
  /** Alert ID */
  id: string;

  /** Affected position ID (or null for global alerts) */
  positionId: string | null;

  /** Alert category */
  category:
    | 'impermanent_loss'
    | 'price_impact'
    | 'oracle_deviation'
    | 'pool_imbalance'
    | 'low_liquidity'
    | 'strategy_failure'
    | 'slippage_exceeded'
    | 'sandwich_detected'
    | 'utilization_spike'
    | 'smart_contract_risk';

  /** Severity */
  level: RiskLevel;

  /** Human-readable message */
  message: string;

  /** Alert-specific data */
  data: Record<string, unknown>;

  /** Whether the alert has been acknowledged */
  acknowledged: boolean;

  /** Created timestamp */
  createdAt: Date;

  /** Auto-dismiss timestamp (null = manual only) */
  expiresAt: Date | null;
}

/** Aggregated risk metrics for a wallet */
export interface RiskMetrics {
  walletAddress: string;

  /** Overall risk score (0-100, higher = riskier) */
  overallScore: number;

  /** Overall risk level */
  overallLevel: RiskLevel;

  /** Concentration risk: largest position as % of portfolio */
  concentrationPct: number;

  /** Protocol diversification score */
  protocolDiversification: number;

  /** Maximum IL across all positions */
  maxILPercent: number;

  /** Weighted average IL */
  avgILPercent: number;

  /** Total unrealized IL in USD */
  totalILUsd: number;

  /** Number of positions out of range */
  outOfRangeCount: number;

  /** Number of active alerts */
  activeAlertCount: number;

  /** Alerts by severity */
  alertsByLevel: Record<RiskLevel, number>;

  /** Per-position risk breakdown */
  positionRisks: {
    positionId: string;
    riskLevel: RiskLevel;
    riskScore: number;
    factors: string[];
  }[];

  /** Calculated timestamp */
  calculatedAt: Date;
}

/** Pool health check result */
export interface PoolHealthCheck {
  poolAddress: string;
  protocol: Protocol;

  /** Whether the pool is operational */
  healthy: boolean;

  /** Pool TVL in USD */
  tvlUsd: number;

  /** TVL change in last 24h (percent) */
  tvlChange24hPct: number;

  /** Reserve ratio (tokenA / tokenB) — should be near expected ratio */
  reserveRatio: number;

  /** Whether reserves are significantly imbalanced */
  imbalanced: boolean;

  /** Oracle price vs pool price deviation (percent) */
  oracleDeviationPct: number;

  /** Whether oracle deviation exceeds threshold */
  oracleRisk: boolean;

  /** Pool utilization rate (volume / TVL) */
  utilizationRate: number;

  /** Smart contract risk indicators */
  contractRisk: {
    verified: boolean;
    auditStatus: 'audited' | 'unaudited' | 'unknown';
    ageInDays: number;
  };

  /** Check timestamp */
  checkedAt: Date;
}

/** Oracle price deviation tracking */
export interface OracleDeviation {
  /** Token mint */
  tokenMint: string;

  /** Pool price */
  poolPrice: number;

  /** Oracle price (Pyth/Switchboard) */
  oraclePrice: number;

  /** Deviation in percent */
  deviationPct: number;

  /** Whether this deviation is concerning */
  alert: boolean;

  /** Timestamp */
  checkedAt: Date;
}

/** TVL summary across all positions */
export interface TVLSummary {
  /** Total TVL across all positions */
  totalTvlUsd: number;

  /** TVL by protocol */
  byProtocol: Record<Protocol, number>;

  /** TVL by pool */
  byPool: {
    poolAddress: string;
    protocol: Protocol;
    tokenPair: string;
    tvlUsd: number;
    percentOfTotal: number;
  }[];

  /** TVL by asset (how much of each token) */
  byAsset: {
    mint: string;
    symbol: string;
    amount: bigint;
    valueUsd: number;
    percentOfTotal: number;
  }[];

  /** TVL change over time */
  history24h: { timestamp: Date; tvlUsd: number }[];

  /** Calculated at */
  calculatedAt: Date;
}
```

---

## Database Schemas

All off-chain state is stored in Supabase PostgreSQL via Drizzle ORM. These schemas track positions, pools, strategies, and history that would be expensive or impossible to query from on-chain data alone.

### defi_positions

```typescript
// db/schema/defi-positions.ts

import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  bigint,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const positionTypeEnum = pgEnum('position_type', [
  'lp_constant_product',
  'lp_concentrated',
  'farm_staked',
  'liquid_staking',
  'pending_swap',
]);

export const positionStatusEnum = pgEnum('position_status', [
  'active',
  'out_of_range',
  'paused',
  'closing',
  'closed',
  'error',
]);

export const protocolEnum = pgEnum('protocol', [
  'jupiter',
  'raydium',
  'orca',
  'marinade',
]);

export const riskLevelEnum = pgEnum('risk_level', [
  'low',
  'medium',
  'high',
  'critical',
]);

/**
 * Core position tracking table.
 *
 * Every DeFi position (LP, farm, staking) gets a row here.
 * On-chain data is synced periodically; this table holds
 * enriched data (PnL, IL, risk level) that requires off-chain
 * computation.
 */
export const defiPositions = pgTable(
  'defi_positions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Owner wallet address */
    walletAddress: text('wallet_address').notNull(),

    /** Position type */
    type: positionTypeEnum('type').notNull(),

    /** Protocol (jupiter, raydium, orca, marinade) */
    protocol: protocolEnum('protocol').notNull(),

    /** Current status */
    status: positionStatusEnum('status').notNull().default('active'),

    /** Pool address on chain */
    poolAddress: text('pool_address'),

    /** On-chain position account (for CL positions, NFT positions) */
    positionAddress: text('position_address'),

    /** Token A mint */
    tokenAMint: text('token_a_mint').notNull(),

    /** Token A symbol (denormalized for query convenience) */
    tokenASymbol: text('token_a_symbol').notNull(),

    /** Token B mint */
    tokenBMint: text('token_b_mint'),

    /** Token B symbol */
    tokenBSymbol: text('token_b_symbol'),

    /** Current value in USD (updated on sync) */
    currentValueUsd: numeric('current_value_usd', {
      precision: 20,
      scale: 6,
    }).notNull().default('0'),

    /** Value at time of deposit in USD */
    depositValueUsd: numeric('deposit_value_usd', {
      precision: 20,
      scale: 6,
    }).notNull(),

    /** Deposit amount of token A (raw, smallest unit) */
    depositAmountA: bigint('deposit_amount_a', { mode: 'bigint' }).notNull(),

    /** Deposit amount of token B (raw, smallest unit) */
    depositAmountB: bigint('deposit_amount_b', { mode: 'bigint' }),

    /** Current amount of token A in position */
    currentAmountA: bigint('current_amount_a', { mode: 'bigint' }),

    /** Current amount of token B in position */
    currentAmountB: bigint('current_amount_b', { mode: 'bigint' }),

    /** LP tokens held (for constant product) */
    lpTokens: bigint('lp_tokens', { mode: 'bigint' }),

    /** Liquidity value (for concentrated) */
    liquidity: bigint('liquidity', { mode: 'bigint' }),

    /** Lower tick (concentrated liquidity) */
    tickLower: bigint('tick_lower', { mode: 'number' }),

    /** Upper tick (concentrated liquidity) */
    tickUpper: bigint('tick_upper', { mode: 'number' }),

    /** Price at entry */
    entryPrice: numeric('entry_price', { precision: 30, scale: 15 }),

    /** Current PnL in USD */
    pnlUsd: numeric('pnl_usd', { precision: 20, scale: 6 }).default('0'),

    /** Current IL percentage */
    impermanentLossPct: numeric('impermanent_loss_pct', {
      precision: 10,
      scale: 6,
    }),

    /** Total fees earned in USD */
    totalFeesEarnedUsd: numeric('total_fees_earned_usd', {
      precision: 20,
      scale: 6,
    }).default('0'),

    /** Total rewards earned in USD */
    totalRewardsEarnedUsd: numeric('total_rewards_earned_usd', {
      precision: 20,
      scale: 6,
    }).default('0'),

    /** Unclaimed rewards in USD */
    unclaimedRewardsUsd: numeric('unclaimed_rewards_usd', {
      precision: 20,
      scale: 6,
    }).default('0'),

    /** Current APY */
    currentApy: numeric('current_apy', { precision: 10, scale: 4 }),

    /** Risk level */
    riskLevel: riskLevelEnum('risk_level').default('low'),

    /** Associated strategy ID */
    strategyId: uuid('strategy_id'),

    /** Protocol-specific metadata (JSON) */
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    /** When the position was opened */
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull(),

    /** When the position was closed (null if active) */
    closedAt: timestamp('closed_at', { withTimezone: true }),

    /** Last synced with on-chain */
    lastSyncedAt: timestamp('last_synced_at', {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    walletIdx: index('defi_pos_wallet_idx').on(table.walletAddress),
    walletStatusIdx: index('defi_pos_wallet_status_idx').on(
      table.walletAddress,
      table.status,
    ),
    protocolIdx: index('defi_pos_protocol_idx').on(table.protocol),
    poolIdx: index('defi_pos_pool_idx').on(table.poolAddress),
    strategyIdx: index('defi_pos_strategy_idx').on(table.strategyId),
    statusIdx: index('defi_pos_status_idx').on(table.status),
  }),
);
```

### liquidity_pools

```typescript
// db/schema/liquidity-pools.ts

import {
  pgTable,
  text,
  timestamp,
  numeric,
  bigint,
  boolean,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const poolTypeEnum = pgEnum('pool_type', [
  'constant_product',
  'concentrated',
  'stable',
  'weighted',
]);

/**
 * Cached pool information.
 *
 * Pool data is fetched from on-chain and APIs, then cached here
 * for fast queries. Refreshed on a schedule and on-demand.
 */
export const liquidityPools = pgTable(
  'liquidity_pools',
  {
    /** Pool address on chain (primary key) */
    address: text('address').primaryKey(),

    /** Protocol */
    protocol: protocolEnum('protocol').notNull(),

    /** Pool type */
    type: poolTypeEnum('type').notNull(),

    /** Token A mint */
    tokenAMint: text('token_a_mint').notNull(),

    /** Token A symbol */
    tokenASymbol: text('token_a_symbol').notNull(),

    /** Token A decimals */
    tokenADecimals: bigint('token_a_decimals', { mode: 'number' }).notNull(),

    /** Token B mint */
    tokenBMint: text('token_b_mint').notNull(),

    /** Token B symbol */
    tokenBSymbol: text('token_b_symbol').notNull(),

    /** Token B decimals */
    tokenBDecimals: bigint('token_b_decimals', { mode: 'number' }).notNull(),

    /** LP token mint address */
    lpMint: text('lp_mint'),

    /** Fee tier in basis points */
    feeBps: bigint('fee_bps', { mode: 'number' }).notNull(),

    /** Tick spacing (concentrated liquidity) */
    tickSpacing: bigint('tick_spacing', { mode: 'number' }),

    /** Current price of token A in terms of token B */
    currentPrice: numeric('current_price', {
      precision: 30,
      scale: 15,
    }),

    /** Current tick index (concentrated liquidity) */
    currentTickIndex: bigint('current_tick_index', { mode: 'number' }),

    /** Reserve of token A */
    reserveA: bigint('reserve_a', { mode: 'bigint' }),

    /** Reserve of token B */
    reserveB: bigint('reserve_b', { mode: 'bigint' }),

    /** LP supply */
    lpSupply: bigint('lp_supply', { mode: 'bigint' }),

    /** TVL in USD */
    tvlUsd: numeric('tvl_usd', { precision: 20, scale: 2 }).default('0'),

    /** 24h volume in USD */
    volume24hUsd: numeric('volume_24h_usd', {
      precision: 20,
      scale: 2,
    }).default('0'),

    /** Fee APY */
    feeApy: numeric('fee_apy', { precision: 10, scale: 4 }).default('0'),

    /** Reward APY */
    rewardApy: numeric('reward_apy', { precision: 10, scale: 4 }).default('0'),

    /** Total APY (fee + reward) */
    totalApy: numeric('total_apy', { precision: 10, scale: 4 }).default('0'),

    /** Whether farming rewards are active */
    hasFarmRewards: boolean('has_farm_rewards').default(false),

    /** Farm address (if farming is available) */
    farmAddress: text('farm_address'),

    /** Reward token mints (JSON array) */
    rewardMints: jsonb('reward_mints').$type<string[]>(),

    /** Whether this pool involves the EDGE token */
    isEdgePool: boolean('is_edge_pool').default(false),

    /** Pool creation on-chain timestamp */
    poolCreatedAt: timestamp('pool_created_at', { withTimezone: true }),

    /** Last time data was refreshed from on-chain */
    lastRefreshedAt: timestamp('last_refreshed_at', {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    protocolIdx: index('lp_pool_protocol_idx').on(table.protocol),
    tokenPairIdx: index('lp_pool_token_pair_idx').on(
      table.tokenAMint,
      table.tokenBMint,
    ),
    isEdgeIdx: index('lp_pool_is_edge_idx').on(table.isEdgePool),
    tvlIdx: index('lp_pool_tvl_idx').on(table.tvlUsd),
    typeIdx: index('lp_pool_type_idx').on(table.type),
  }),
);
```

### yield_strategies

```typescript
// db/schema/yield-strategies.ts

import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  bigint,
  boolean,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const strategyStatusEnum = pgEnum('strategy_status', [
  'active',
  'paused',
  'stopped',
  'error',
  'cooldown',
]);

/**
 * Automated yield strategies.
 *
 * A strategy is a set of triggers and actions that automate
 * DeFi operations. Examples: auto-compound every 24h, rebalance
 * concentrated liquidity when out of range, harvest and sell
 * reward tokens.
 */
export const yieldStrategies = pgTable(
  'yield_strategies',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Human-readable name */
    name: text('name').notNull(),

    /** Description */
    description: text('description'),

    /** Owner wallet */
    walletAddress: text('wallet_address').notNull(),

    /** Associated position ID */
    positionId: uuid('position_id').notNull(),

    /** Pool address */
    poolAddress: text('pool_address').notNull(),

    /** Protocol */
    protocol: protocolEnum('protocol').notNull(),

    /** Current status */
    status: strategyStatusEnum('status').notNull().default('active'),

    /** Trigger configuration (JSON) */
    triggers: jsonb('triggers').$type<StrategyTrigger[]>().notNull(),

    /** Action configuration (JSON) */
    actions: jsonb('actions').$type<StrategyAction[]>().notNull(),

    /** Auto-compound interval in ms (0 = disabled) */
    compoundIntervalMs: bigint('compound_interval_ms', {
      mode: 'number',
    }).default(0),

    /** Minimum value to compound (USD) */
    minCompoundValueUsd: numeric('min_compound_value_usd', {
      precision: 20,
      scale: 6,
    }).default('1.00'),

    /** Auto-harvest enabled */
    autoHarvest: boolean('auto_harvest').default(false),

    /** Auto-compound enabled */
    autoCompound: boolean('auto_compound').default(false),

    /** Auto-rebalance enabled (concentrated liquidity) */
    autoRebalance: boolean('auto_rebalance').default(false),

    /** Max IL before pausing (percent) */
    maxIlPercent: numeric('max_il_percent', {
      precision: 10,
      scale: 4,
    }).default('10.0'),

    /** Rebalance trigger percent */
    rebalanceTriggerPercent: numeric('rebalance_trigger_percent', {
      precision: 10,
      scale: 4,
    }),

    /** Max gas per execution (SOL) */
    maxGasPerExecutionSol: numeric('max_gas_per_execution_sol', {
      precision: 15,
      scale: 9,
    }).default('0.01'),

    /** Max loss per execution (USD) */
    maxLossPerExecutionUsd: numeric('max_loss_per_execution_usd', {
      precision: 20,
      scale: 6,
    }).default('10.00'),

    /** Daily loss limit (USD) */
    dailyLossLimitUsd: numeric('daily_loss_limit_usd', {
      precision: 20,
      scale: 6,
    }).default('50.00'),

    /** Cooldown between executions (ms) */
    cooldownMs: bigint('cooldown_ms', { mode: 'number' }).default(60000),

    /** Max consecutive failures before auto-pause */
    maxConsecutiveFailures: bigint('max_consecutive_failures', {
      mode: 'number',
    }).default(3),

    /** Current consecutive failure count */
    consecutiveFailures: bigint('consecutive_failures', {
      mode: 'number',
    }).default(0),

    /** Total executions */
    totalExecutions: bigint('total_executions', { mode: 'number' }).default(0),

    /** Total gas spent (SOL) */
    totalGasSpentSol: numeric('total_gas_spent_sol', {
      precision: 15,
      scale: 9,
    }).default('0'),

    /** Total PnL from strategy actions (USD) */
    totalPnlUsd: numeric('total_pnl_usd', {
      precision: 20,
      scale: 6,
    }).default('0'),

    /** Total rewards harvested (USD) */
    totalHarvestedUsd: numeric('total_harvested_usd', {
      precision: 20,
      scale: 6,
    }).default('0'),

    /** Number of compounds executed */
    compoundCount: bigint('compound_count', { mode: 'number' }).default(0),

    /** Last compound time */
    lastCompoundAt: timestamp('last_compound_at', { withTimezone: true }),

    /** Last harvest time */
    lastHarvestAt: timestamp('last_harvest_at', { withTimezone: true }),

    /** Last execution time */
    lastExecutedAt: timestamp('last_executed_at', { withTimezone: true }),

    /** Next scheduled action */
    nextActionAt: timestamp('next_action_at', { withTimezone: true }),

    /** Error message (if status = error) */
    errorMessage: text('error_message'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    walletIdx: index('yield_strat_wallet_idx').on(table.walletAddress),
    positionIdx: index('yield_strat_position_idx').on(table.positionId),
    statusIdx: index('yield_strat_status_idx').on(table.status),
    nextActionIdx: index('yield_strat_next_action_idx').on(table.nextActionAt),
  }),
);
```

### swap_history

```typescript
// db/schema/swap-history.ts

import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  bigint,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Complete swap history.
 *
 * Every swap executed through the DeFi module is recorded here
 * for audit, analytics, and performance tracking.
 */
export const swapHistory = pgTable(
  'swap_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Wallet that performed the swap */
    walletAddress: text('wallet_address').notNull(),

    /** Solana transaction signature */
    signature: text('signature').notNull().unique(),

    /** Protocol used for the swap */
    protocol: protocolEnum('protocol').notNull(),

    /** Input token mint */
    inputMint: text('input_mint').notNull(),

    /** Input token symbol */
    inputSymbol: text('input_symbol').notNull(),

    /** Output token mint */
    outputMint: text('output_mint').notNull(),

    /** Output token symbol */
    outputSymbol: text('output_symbol').notNull(),

    /** Input amount (raw) */
    inputAmount: bigint('input_amount', { mode: 'bigint' }).notNull(),

    /** Output amount (raw) */
    outputAmount: bigint('output_amount', { mode: 'bigint' }).notNull(),

    /** Input amount in USD at time of swap */
    inputValueUsd: numeric('input_value_usd', {
      precision: 20,
      scale: 6,
    }).notNull(),

    /** Output value in USD at time of swap */
    outputValueUsd: numeric('output_value_usd', {
      precision: 20,
      scale: 6,
    }).notNull(),

    /** Effective exchange rate (output / input in human units) */
    exchangeRate: numeric('exchange_rate', {
      precision: 30,
      scale: 15,
    }).notNull(),

    /** Price impact (as decimal, e.g. 0.005 = 0.5%) */
    priceImpact: numeric('price_impact', {
      precision: 10,
      scale: 6,
    }).notNull(),

    /** Slippage tolerance (bps) that was set */
    slippageBps: bigint('slippage_bps', { mode: 'number' }).notNull(),

    /** Actual slippage (bps) experienced */
    actualSlippageBps: bigint('actual_slippage_bps', { mode: 'number' }),

    /** Fees paid in USD */
    feesUsd: numeric('fees_usd', { precision: 20, scale: 6 }).default('0'),

    /** Priority fee paid (microlamports per CU) */
    priorityFeeMicroLamports: bigint('priority_fee_micro_lamports', {
      mode: 'number',
    }),

    /** Total gas cost in SOL */
    gasCostSol: numeric('gas_cost_sol', { precision: 15, scale: 9 }),

    /** Route taken (JSON array of hops) */
    route: jsonb('route').$type<RouteStep[]>().notNull(),

    /** Number of hops in the route */
    hopCount: bigint('hop_count', { mode: 'number' }).notNull(),

    /** Whether Jito bundle was used */
    usedJitoBundle: boolean('used_jito_bundle').default(false),

    /** Strategy ID if part of automated strategy */
    strategyId: uuid('strategy_id'),

    /** Idempotency key */
    idempotencyKey: text('idempotency_key').unique(),

    /** Confirmation slot */
    slot: bigint('slot', { mode: 'number' }).notNull(),

    /** Time from submission to confirmation (ms) */
    latencyMs: bigint('latency_ms', { mode: 'number' }),

    /** Swap timestamp (on-chain confirmation time) */
    executedAt: timestamp('executed_at', { withTimezone: true }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    walletIdx: index('swap_hist_wallet_idx').on(table.walletAddress),
    signatureIdx: index('swap_hist_sig_idx').on(table.signature),
    tokenPairIdx: index('swap_hist_token_pair_idx').on(
      table.inputMint,
      table.outputMint,
    ),
    executedAtIdx: index('swap_hist_executed_at_idx').on(table.executedAt),
    strategyIdx: index('swap_hist_strategy_idx').on(table.strategyId),
    idempotencyIdx: index('swap_hist_idempotency_idx').on(
      table.idempotencyKey,
    ),
  }),
);
```

### strategy_executions

```typescript
// db/schema/strategy-executions.ts

import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  bigint,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const executionStatusEnum = pgEnum('execution_status', [
  'success',
  'partial',
  'failed',
]);

/**
 * Strategy execution log.
 *
 * Every time a strategy fires (whether scheduled, triggered by
 * price, or manually), the execution is recorded here with
 * full details of what happened.
 */
export const strategyExecutions = pgTable(
  'strategy_executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Strategy that executed */
    strategyId: uuid('strategy_id').notNull(),

    /** Trigger that caused execution */
    triggerType: text('trigger_type').notNull(),

    /** Trigger details (JSON) */
    triggerData: jsonb('trigger_data').$type<Record<string, unknown>>(),

    /** Overall execution status */
    status: executionStatusEnum('status').notNull(),

    /** Actions executed with individual results (JSON) */
    actions: jsonb('actions').$type<{
      type: string;
      status: 'success' | 'failed' | 'skipped';
      signature?: string;
      error?: string;
      durationMs: number;
      data?: Record<string, unknown>;
    }[]>().notNull(),

    /** PnL from this execution (USD) */
    pnlUsd: numeric('pnl_usd', { precision: 20, scale: 6 }).default('0'),

    /** Gas cost (SOL) */
    gasCostSol: numeric('gas_cost_sol', {
      precision: 15,
      scale: 9,
    }).default('0'),

    /** Error message if failed */
    errorMessage: text('error_message'),

    /** Execution start time */
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),

    /** Execution end time */
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),

    /** Duration in ms */
    durationMs: bigint('duration_ms', { mode: 'number' }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    strategyIdx: index('strat_exec_strategy_idx').on(table.strategyId),
    statusIdx: index('strat_exec_status_idx').on(table.status),
    startedAtIdx: index('strat_exec_started_at_idx').on(table.startedAt),
    strategyStatusIdx: index('strat_exec_strategy_status_idx').on(
      table.strategyId,
      table.status,
    ),
  }),
);
```

### il_snapshots

```typescript
// db/schema/il-snapshots.ts

import {
  pgTable,
  uuid,
  timestamp,
  numeric,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Impermanent loss snapshots.
 *
 * Taken at regular intervals for each LP position to enable
 * IL time-series charting and historical analysis.
 */
export const ilSnapshots = pgTable(
  'il_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Position this snapshot belongs to */
    positionId: uuid('position_id').notNull(),

    /** IL as a percentage */
    ilPercent: numeric('il_percent', { precision: 10, scale: 6 }).notNull(),

    /** IL in USD */
    ilUsd: numeric('il_usd', { precision: 20, scale: 6 }).notNull(),

    /** Price ratio at snapshot time */
    priceRatio: numeric('price_ratio', {
      precision: 30,
      scale: 15,
    }).notNull(),

    /** Current price at snapshot */
    currentPrice: numeric('current_price', {
      precision: 30,
      scale: 15,
    }).notNull(),

    /** Entry price for reference */
    entryPrice: numeric('entry_price', {
      precision: 30,
      scale: 15,
    }).notNull(),

    /** Cumulative fee income at snapshot (USD) */
    feeIncomeUsd: numeric('fee_income_usd', {
      precision: 20,
      scale: 6,
    }).notNull(),

    /** Net PnL at snapshot (USD) */
    netPnlUsd: numeric('net_pnl_usd', {
      precision: 20,
      scale: 6,
    }).notNull(),

    /** Position value at snapshot (USD) */
    positionValueUsd: numeric('position_value_usd', {
      precision: 20,
      scale: 6,
    }).notNull(),

    /** HODL value at snapshot (USD) */
    hodlValueUsd: numeric('hodl_value_usd', {
      precision: 20,
      scale: 6,
    }).notNull(),

    /** Snapshot timestamp */
    snapshotAt: timestamp('snapshot_at', { withTimezone: true }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    positionIdx: index('il_snap_position_idx').on(table.positionId),
    positionTimeIdx: index('il_snap_position_time_idx').on(
      table.positionId,
      table.snapshotAt,
    ),
    snapshotAtIdx: index('il_snap_snapshot_at_idx').on(table.snapshotAt),
  }),
);
```

### risk_alerts

```typescript
// db/schema/risk-alerts.ts

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const alertCategoryEnum = pgEnum('alert_category', [
  'impermanent_loss',
  'price_impact',
  'oracle_deviation',
  'pool_imbalance',
  'low_liquidity',
  'strategy_failure',
  'slippage_exceeded',
  'sandwich_detected',
  'utilization_spike',
  'smart_contract_risk',
]);

/**
 * Risk alert records.
 *
 * Generated by the RiskMonitor service when conditions
 * exceed configured thresholds. Alerts can be auto-dismissed
 * or require manual acknowledgment.
 */
export const riskAlerts = pgTable(
  'risk_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Wallet affected */
    walletAddress: text('wallet_address').notNull(),

    /** Position affected (null for global alerts) */
    positionId: uuid('position_id'),

    /** Alert category */
    category: alertCategoryEnum('category').notNull(),

    /** Severity level */
    level: riskLevelEnum('risk_level').notNull(),

    /** Human-readable message */
    message: text('message').notNull(),

    /** Alert-specific data (JSON) */
    data: jsonb('data').$type<Record<string, unknown>>(),

    /** Whether alert has been acknowledged by user */
    acknowledged: boolean('acknowledged').notNull().default(false),

    /** When acknowledged */
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),

    /** Auto-expiry (null = manual dismiss only) */
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    /** When the alert condition was detected */
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    walletIdx: index('risk_alert_wallet_idx').on(table.walletAddress),
    walletActiveIdx: index('risk_alert_wallet_active_idx').on(
      table.walletAddress,
      table.acknowledged,
    ),
    positionIdx: index('risk_alert_position_idx').on(table.positionId),
    categoryIdx: index('risk_alert_category_idx').on(table.category),
    levelIdx: index('risk_alert_level_idx').on(table.level),
    detectedAtIdx: index('risk_alert_detected_at_idx').on(table.detectedAt),
  }),
);
```

---

## Code Examples

### Example 1: Swap EDGE → SOL via Jupiter

```typescript
import { DeFiService } from '@mcv/web3-core/defi';
import { EDGE_TOKEN_MINT } from '@mcv/web3-core/defi';
import { NATIVE_SOL_MINT } from '@mcv/web3-core/solana';

const defi = new DeFiService();

// Step 1: Get a quote
const quote = await defi.getSwapQuote({
  inputMint: EDGE_TOKEN_MINT,
  outputMint: NATIVE_SOL_MINT,
  amount: 1_000_000_000n, // 1 billion raw EDGE (adjust for decimals)
  slippageBps: 50,        // 0.5% slippage tolerance
  walletAddress: 'Abc123...userWalletAddress',
});

console.log(`Best route: ${quote.route.steps.length} hops`);
console.log(`Expected output: ${quote.route.expectedOutputAmount} lamports`);
console.log(`Price impact: ${(quote.route.priceImpact * 100).toFixed(3)}%`);
console.log(`Impact level: ${quote.priceImpactLevel}`);

if (quote.warnings.length > 0) {
  console.warn('Warnings:', quote.warnings);
}

// Step 2: Review alternative routes
for (const alt of quote.alternativeRoutes.slice(0, 3)) {
  console.log(
    `  Alt: ${alt.steps.map((s) => s.protocol).join(' → ')} ` +
    `output=${alt.expectedOutputAmount} score=${alt.score}`,
  );
}

// Step 3: Execute the swap
const result = await defi.executeSwap({
  inputMint: EDGE_TOKEN_MINT,
  outputMint: NATIVE_SOL_MINT,
  amount: 1_000_000_000n,
  slippageBps: 50,
  walletAddress: 'Abc123...userWalletAddress',
  priorityFee: 'auto',
  useJitoBundle: true, // MEV protection
});

console.log(`✅ Swap confirmed: ${result.signature}`);
console.log(`   Input:  ${result.inputAmount} EDGE`);
console.log(`   Output: ${result.outputAmount} lamports SOL`);
console.log(`   Slot:   ${result.slot}`);
console.log(`   Latency: ${result.latencyMs}ms`);
```

### Example 2: Add Concentrated Liquidity on Orca Whirlpool

```typescript
import { DeFiService } from '@mcv/web3-core/defi';

const defi = new DeFiService();

// Step 1: Find the best EDGE/SOL pool
const pools = await defi.getPools(EDGE_TOKEN_MINT, NATIVE_SOL_MINT);

const whirlpool = pools.find(
  (p) => p.protocol === 'orca' && p.type === 'concentrated',
);

if (!whirlpool) {
  throw new Error('No Orca Whirlpool found for EDGE/SOL');
}

console.log(`Pool: ${whirlpool.address}`);
console.log(`Current price: ${whirlpool.currentPrice} SOL/EDGE`);
console.log(`TVL: $${whirlpool.tvlUsd.toLocaleString()}`);
console.log(`APY: ${whirlpool.totalApy.toFixed(2)}%`);

// Step 2: Get detailed pool info for range calculation
const poolInfo = await defi.getPoolInfo(whirlpool.address);
const currentPrice = poolInfo.currentPrice!;

// Step 3: Define a ±20% range around current price
const priceLower = currentPrice * 0.80;
const priceUpper = currentPrice * 1.20;

// Step 4: Add liquidity
const position = await defi.addLiquidity({
  poolAddress: whirlpool.address,
  walletAddress: 'Abc123...userWalletAddress',
  amountA: 500_000_000n,   // 500M raw EDGE
  amountB: 1_000_000_000n, // 1 SOL in lamports
  slippageBps: 100,        // 1% slippage for LP operations
  priceLower,
  priceUpper,
});

console.log(`✅ Position created: ${position.id}`);
console.log(`   Range: ${priceLower.toFixed(6)} - ${priceUpper.toFixed(6)}`);
console.log(`   In range: ${position.range?.inRange}`);
console.log(`   Value: $${position.valueUsd.toFixed(2)}`);
console.log(`   Position address: ${position.positionAddress}`);
```

### Example 3: Yield Farming with Auto-Compound

```typescript
import { DeFiService } from '@mcv/web3-core/defi';
import type { YieldStrategyConfig } from '@mcv/web3-core/defi';

const defi = new DeFiService();

// Step 1: Find a Raydium farm with high APY
const pools = await defi.getPools(EDGE_TOKEN_MINT, USDC_MINT);

const farmPool = pools
  .filter((p) => p.protocol === 'raydium' && p.hasFarmRewards)
  .sort((a, b) => b.totalApy - a.totalApy)[0];

if (!farmPool) {
  throw new Error('No Raydium farm available for EDGE/USDC');
}

const apyBreakdown = await defi.getAPYBreakdown(farmPool.address);

console.log(`Farm: ${farmPool.address}`);
console.log(`Fee APY:      ${apyBreakdown.feeApy.toFixed(2)}%`);
console.log(`Reward APY:   ${apyBreakdown.rewardApy.toFixed(2)}%`);
console.log(`Total APY:    ${apyBreakdown.totalApy.toFixed(2)}%`);
console.log(`Compounded:   ${apyBreakdown.compoundedApy.toFixed(2)}%`);
console.log(`Confidence:   ${apyBreakdown.confidence}`);

// Step 2: Configure auto-compound strategy
const strategyConfig: YieldStrategyConfig = {
  name: 'EDGE/USDC Raydium Farm — Daily Compound',
  poolAddress: farmPool.address,
  protocol: 'raydium',
  compoundIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
  minCompoundValueUsd: 5.0,   // Don't compound less than $5 (gas > reward)
  autoHarvest: true,
  autoCompound: true,
  maxILPercent: 8.0,           // Pause if IL exceeds 8%
  autoRebalance: false,        // N/A for constant product pools
};

// Step 3: Stake LP tokens with the strategy
const farmPosition = await defi.stakeFarm({
  poolAddress: farmPool.address,
  walletAddress: 'Abc123...userWalletAddress',
  amount: 10_000_000_000n, // LP tokens to stake
  strategyConfig,
});

console.log(`✅ Farm position staked: ${farmPosition.id}`);
console.log(`   Staked value: $${farmPosition.stakedValueUsd.toFixed(2)}`);
console.log(`   Strategy: ${farmPosition.strategyId}`);

// Step 4: Check pending rewards later
const updated = await defi.getPositions('Abc123...userWalletAddress');
const farm = updated.find((p) => p.id === farmPosition.id);

if (farm) {
  console.log(`Pending rewards: $${farm.unclaimedRewardsUsd.toFixed(2)}`);
}

// Step 5: Manual harvest (if you don't want to wait for auto)
const harvest = await defi.harvestRewards(farmPosition.id);

console.log(`🌾 Harvested: $${harvest.totalValueUsd.toFixed(2)}`);
for (const reward of harvest.rewards) {
  console.log(`   ${reward.symbol}: ${reward.amount} ($${reward.valueUsd.toFixed(2)})`);
}

// Step 6: Manual compound
const compound = await defi.autoCompound(farmPosition.id);

console.log(`🔄 Compounded: $${compound.compoundedValueUsd.toFixed(2)}`);
console.log(`   Gas cost: ${compound.gasCostSol.toFixed(6)} SOL`);
console.log(`   Net gain: $${compound.netGainUsd.toFixed(2)}`);
```

### Example 4: Track Impermanent Loss

```typescript
import { DeFiService } from '@mcv/web3-core/defi';
import type { TimeRange } from '@mcv/web3-core/defi';

const defi = new DeFiService();

// Get all LP positions
const positions = await defi.getPositions('Abc123...userWalletAddress');
const lpPositions = positions.filter(
  (p) => p.type === 'lp_constant_product' || p.type === 'lp_concentrated',
);

console.log(`\n📊 Impermanent Loss Report\n${'═'.repeat(60)}`);

for (const pos of lpPositions) {
  const il = await defi.calculateIL(pos.id);

  const status = il.ilPercent < -5
    ? '🔴'
    : il.ilPercent < -2
      ? '🟡'
      : '🟢';

  console.log(`\n${status} Position: ${pos.id.slice(0, 8)}...`);
  console.log(`   Protocol: ${pos.protocol}`);
  console.log(`   Entry price: ${il.entryPrice.toFixed(6)}`);
  console.log(`   Current price: ${il.currentPrice.toFixed(6)}`);
  console.log(`   Price ratio: ${il.priceRatio.toFixed(4)}x`);
  console.log(`   IL: ${il.ilPercent.toFixed(4)}% ($${il.ilUsd.toFixed(2)})`);
  console.log(`   Fee income: $${il.feeIncomeUsd.toFixed(2)}`);
  console.log(`   Reward income: $${il.rewardIncomeUsd.toFixed(2)}`);
  console.log(`   Net PnL: $${il.netPnlUsd.toFixed(2)}`);

  if (il.concentrationFactor) {
    console.log(
      `   ⚡ Concentrated: ${il.concentrationFactor.toFixed(2)}x amplification`,
    );
  }

  console.log(`   HODL value: $${il.hodlValueUsd.toFixed(2)}`);
  console.log(`   LP value:   $${il.currentValueUsd.toFixed(2)}`);
}

// Get IL time series for the first position (for charting)
if (lpPositions.length > 0) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const timeSeries = await defi.getILTimeSeries(lpPositions[0].id, {
    from: weekAgo,
    to: now,
  });

  console.log(`\n📈 IL Time Series (7d) — ${timeSeries.snapshots.length} data points`);
  for (const snap of timeSeries.snapshots.slice(-5)) {
    console.log(
      `   ${snap.snapshotAt.toISOString().slice(0, 16)} ` +
      `IL: ${snap.ilPercent.toFixed(4)}% ` +
      `Net: $${snap.netPnlUsd.toFixed(2)}`,
    );
  }
}
```

### Example 5: Automated Concentrated Liquidity Strategy

```typescript
import { DeFiService } from '@mcv/web3-core/defi';
import type { StrategyConfig } from '@mcv/web3-core/defi';

const defi = new DeFiService();

/**
 * This strategy:
 * 1. Monitors a concentrated liquidity position on Orca
 * 2. When the price exits the range, rebalances to a new range
 * 3. Harvests and compounds rewards every 12 hours
 * 4. Pauses if IL exceeds 10% or daily loss exceeds $50
 */
const strategyConfig: StrategyConfig = {
  name: 'EDGE/SOL CL Auto-Rebalance',
  description:
    'Automatically rebalance Orca whirlpool position when price exits range. ' +
    'Harvest and compound rewards every 12h.',
  walletAddress: 'Abc123...userWalletAddress',

  triggers: [
    {
      // Rebalance when position goes out of range
      type: 'range_exit',
    },
    {
      // Harvest every 12 hours
      type: 'schedule',
      intervalMs: 12 * 60 * 60 * 1000,
    },
    {
      // Also rebalance if IL gets too high
      type: 'il_threshold',
      ilThresholdPercent: 8.0,
    },
    {
      // Pause if APY drops below 5%
      type: 'apy_change',
      minApy: 5.0,
    },
  ],

  actions: [
    {
      type: 'harvest',
      params: {},
      order: 1,
      continueOnError: true,
    },
    {
      type: 'rebalance_range',
      params: {
        // New range: ±15% around current price
        rangePercent: 15,
        // Use full position value
        rebalancePercent: 100,
      },
      order: 2,
      continueOnError: false,
    },
    {
      type: 'compound',
      params: {
        minValueUsd: 2.0,
      },
      order: 3,
      continueOnError: true,
    },
  ],

  // Safety limits
  maxGasPerExecutionSol: 0.015,
  maxLossPerExecutionUsd: 25.0,
  dailyLossLimitUsd: 50.0,
  cooldownMs: 5 * 60 * 1000, // 5 minute cooldown between executions
  maxConsecutiveFailures: 5,
};

// Create and start the strategy
const strategy = await defi.createStrategy(strategyConfig);

console.log(`✅ Strategy created: ${strategy.id}`);
console.log(`   Name: ${strategy.name}`);
console.log(`   Status: ${strategy.status}`);
console.log(`   Triggers: ${strategy.triggers.length}`);
console.log(`   Actions: ${strategy.actions.length}`);
console.log(`   Next execution: ${strategy.nextExecutionAt?.toISOString()}`);

// Later: check execution history
const history = await defi.getStrategyHistory(strategy.id);

console.log(`\n📋 Execution History (${history.length} executions)`);
for (const exec of history.slice(-5)) {
  const icon = exec.status === 'success' ? '✅' : exec.status === 'partial' ? '⚠️' : '❌';
  console.log(
    `   ${icon} ${exec.startedAt.toISOString().slice(0, 16)} ` +
    `trigger=${exec.trigger} ` +
    `PnL=$${exec.pnlUsd} ` +
    `gas=${exec.gasCostSol} SOL ` +
    `duration=${exec.durationMs}ms`,
  );
  for (const action of exec.actions) {
    const aIcon = action.status === 'success' ? '  ✓' : '  ✗';
    console.log(
      `   ${aIcon} ${action.type}: ${action.status}` +
      (action.error ? ` — ${action.error}` : ''),
    );
  }
}

// Pause the strategy
await defi.setStrategyStatus(strategy.id, 'paused');
console.log('⏸️  Strategy paused');

// Resume later
await defi.setStrategyStatus(strategy.id, 'active');
console.log('▶️  Strategy resumed');
```

### Example 6: Portfolio Overview & Risk Monitoring

```typescript
import { DeFiService } from '@mcv/web3-core/defi';

const defi = new DeFiService();
const wallet = 'Abc123...userWalletAddress';

// Sync positions with on-chain state first
const syncResult = await defi.syncPositions(wallet);
console.log(
  `🔄 Synced: ${syncResult.created} new, ${syncResult.updated} updated, ` +
  `${syncResult.closed} closed (${syncResult.durationMs}ms)`,
);

// Get unified portfolio
const portfolio = await defi.getPortfolio(wallet);

console.log(`\n💼 DeFi Portfolio`);
console.log(`${'═'.repeat(60)}`);
console.log(`Total Value: $${portfolio.totalValueUsd.toLocaleString()}`);
console.log(`Total PnL: $${portfolio.totalPnlUsd.toFixed(2)} (${portfolio.totalPnlPct.toFixed(2)}%)`);
console.log(`Unclaimed Rewards: $${portfolio.totalUnclaimedRewardsUsd.toFixed(2)}`);

// By protocol
console.log(`\n📊 By Protocol:`);
for (const [protocol, data] of Object.entries(portfolio.byProtocol)) {
  if (data.positions.length === 0) continue;
  console.log(
    `   ${protocol}: ${data.positions.length} positions, ` +
    `$${data.totalValueUsd.toLocaleString()} ` +
    `(PnL: $${data.totalPnlUsd.toFixed(2)})`,
  );
}

// Asset allocation
console.log(`\n🥧 Asset Allocation:`);
for (const asset of portfolio.allocation) {
  const bar = '█'.repeat(Math.round(asset.percentOfPortfolio / 2));
  console.log(
    `   ${asset.symbol.padEnd(6)} ${bar} ` +
    `${asset.percentOfPortfolio.toFixed(1)}% ` +
    `($${asset.valueUsd.toLocaleString()})`,
  );
}

// Risk metrics
const risk = await defi.getRiskMetrics(wallet);

console.log(`\n⚠️  Risk Assessment`);
console.log(`   Overall: ${risk.overallLevel.toUpperCase()} (score: ${risk.overallScore}/100)`);
console.log(`   Concentration: ${risk.concentrationPct.toFixed(1)}%`);
console.log(`   Max IL: ${risk.maxILPercent.toFixed(2)}%`);
console.log(`   Avg IL: ${risk.avgILPercent.toFixed(2)}%`);
console.log(`   Total IL: $${risk.totalILUsd.toFixed(2)}`);
console.log(`   Out of range: ${risk.outOfRangeCount} positions`);
console.log(`   Active alerts: ${risk.activeAlertCount}`);

// Active alerts
const alerts = await defi.getAlerts(wallet);
if (alerts.length > 0) {
  console.log(`\n🚨 Active Alerts:`);
  for (const alert of alerts) {
    const icon = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🔶',
      critical: '🔴',
    }[alert.level];
    console.log(`   ${icon} [${alert.category}] ${alert.message}`);
  }
}

// TVL
const tvl = await defi.getTVL(wallet);
console.log(`\n🔒 Total Value Locked: $${tvl.totalTvlUsd.toLocaleString()}`);
for (const pool of tvl.byPool) {
  console.log(
    `   ${pool.tokenPair} (${pool.protocol}): ` +
    `$${pool.tvlUsd.toLocaleString()} ` +
    `(${pool.percentOfTotal.toFixed(1)}%)`,
  );
}
```

### Example 7: tRPC Router Integration

```typescript
// router.ts — tRPC router for DeFi endpoints

import { router, protectedProcedure } from '@mcv/shared/trpc';
import { z } from 'zod';
import { DeFiService } from './services/defi.service';
import { TRPCError } from '@trpc/server';
import { DefiError, DefiErrorCode } from './errors';

const defiService = new DeFiService();

export const defiRouter = router({
  // ── Swap ──────────────────────────────────────────────────
  getSwapQuote: protectedProcedure
    .input(
      z.object({
        inputMint: z.string(),
        outputMint: z.string(),
        amount: z.string().transform((v) => BigInt(v)),
        exactOutput: z.boolean().optional(),
        slippageBps: z.number().int().min(1).max(1000).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return await defiService.getSwapQuote({
          ...input,
          walletAddress: ctx.walletAddress,
        });
      } catch (error) {
        if (error instanceof DefiError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),

  executeSwap: protectedProcedure
    .input(
      z.object({
        inputMint: z.string(),
        outputMint: z.string(),
        amount: z.string().transform((v) => BigInt(v)),
        slippageBps: z.number().int().min(1).max(1000).optional(),
        useJitoBundle: z.boolean().optional(),
        idempotencyKey: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await defiService.executeSwap({
        ...input,
        walletAddress: ctx.walletAddress,
        priorityFee: 'auto',
      });
    }),

  // ── Liquidity ─────────────────────────────────────────────
  getPools: protectedProcedure
    .input(
      z.object({
        tokenA: z.string(),
        tokenB: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return await defiService.getPools(input.tokenA, input.tokenB);
    }),

  getPoolInfo: protectedProcedure
    .input(z.object({ poolAddress: z.string() }))
    .query(async ({ input }) => {
      return await defiService.getPoolInfo(input.poolAddress);
    }),

  addLiquidity: protectedProcedure
    .input(
      z.object({
        poolAddress: z.string(),
        amountA: z.string().transform((v) => BigInt(v)),
        amountB: z.string().transform((v) => BigInt(v)),
        slippageBps: z.number().int().min(1).max(1000).optional(),
        priceLower: z.number().optional(),
        priceUpper: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await defiService.addLiquidity({
        ...input,
        walletAddress: ctx.walletAddress,
      });
    }),

  removeLiquidity: protectedProcedure
    .input(
      z.object({
        positionId: z.string().uuid(),
        percentage: z.number().int().min(1).max(100),
        slippageBps: z.number().int().min(1).max(1000).optional(),
        closePosition: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await defiService.removeLiquidity({
        ...input,
        walletAddress: ctx.walletAddress,
      });
    }),

  // ── Positions ─────────────────────────────────────────────
  getPositions: protectedProcedure.query(async ({ ctx }) => {
    return await defiService.getPositions(ctx.walletAddress);
  }),

  getPortfolio: protectedProcedure.query(async ({ ctx }) => {
    return await defiService.getPortfolio(ctx.walletAddress);
  }),

  syncPositions: protectedProcedure.mutation(async ({ ctx }) => {
    return await defiService.syncPositions(ctx.walletAddress);
  }),

  // ── IL ────────────────────────────────────────────────────
  calculateIL: protectedProcedure
    .input(z.object({ positionId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await defiService.calculateIL(input.positionId);
    }),

  getILTimeSeries: protectedProcedure
    .input(
      z.object({
        positionId: z.string().uuid(),
        from: z.string().datetime(),
        to: z.string().datetime(),
      }),
    )
    .query(async ({ input }) => {
      return await defiService.getILTimeSeries(input.positionId, {
        from: new Date(input.from),
        to: new Date(input.to),
      });
    }),

  // ── Strategies ────────────────────────────────────────────
  createStrategy: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500),
        triggers: z.array(z.any()), // Validated in service
        actions: z.array(z.any()),  // Validated in service
        maxGasPerExecutionSol: z.number().positive().max(0.1),
        maxLossPerExecutionUsd: z.number().positive().max(1000),
        dailyLossLimitUsd: z.number().positive().max(10000),
        cooldownMs: z.number().int().positive(),
        maxConsecutiveFailures: z.number().int().min(1).max(20),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await defiService.createStrategy({
        ...input,
        walletAddress: ctx.walletAddress,
      });
    }),

  setStrategyStatus: protectedProcedure
    .input(
      z.object({
        strategyId: z.string().uuid(),
        status: z.enum(['active', 'paused', 'stopped']),
      }),
    )
    .mutation(async ({ input }) => {
      return await defiService.setStrategyStatus(input.strategyId, input.status);
    }),

  getStrategyHistory: protectedProcedure
    .input(z.object({ strategyId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await defiService.getStrategyHistory(input.strategyId);
    }),

  // ── Risk ──────────────────────────────────────────────────
  getRiskMetrics: protectedProcedure.query(async ({ ctx }) => {
    return await defiService.getRiskMetrics(ctx.walletAddress);
  }),

  getAlerts: protectedProcedure.query(async ({ ctx }) => {
    return await defiService.getAlerts(ctx.walletAddress);
  }),

  getTVL: protectedProcedure.query(async ({ ctx }) => {
    return await defiService.getTVL(ctx.walletAddress);
  }),
});

export type DefiRouter = typeof defiRouter;
```

---

## Error Codes

All errors thrown by this module use the `DefiError` class with a `DefiErrorCode` enum, enabling structured error handling across the stack.

```typescript
// errors.ts

export enum DefiErrorCode {
  // ── Swap Errors (SWAP_*) ────────────────────────────────────
  /** No route found for the given token pair */
  SWAP_NO_ROUTE = 'DEFI_SWAP_NO_ROUTE',

  /** Slippage exceeded the configured tolerance */
  SWAP_SLIPPAGE_EXCEEDED = 'DEFI_SWAP_SLIPPAGE_EXCEEDED',

  /** Price impact too high — swap would significantly move the market */
  SWAP_PRICE_IMPACT_TOO_HIGH = 'DEFI_SWAP_PRICE_IMPACT_TOO_HIGH',

  /** Swap quote has expired (quotes are valid for ~30-60s) */
  SWAP_QUOTE_EXPIRED = 'DEFI_SWAP_QUOTE_EXPIRED',

  /** Insufficient balance for the swap input amount */
  SWAP_INSUFFICIENT_BALANCE = 'DEFI_SWAP_INSUFFICIENT_BALANCE',

  /** Possible sandwich attack detected — transaction landed between suspicious txs */
  SWAP_SANDWICH_DETECTED = 'DEFI_SWAP_SANDWICH_DETECTED',

  // ── Liquidity Errors (LP_*) ─────────────────────────────────
  /** Pool not found or no longer exists */
  LP_POOL_NOT_FOUND = 'DEFI_LP_POOL_NOT_FOUND',

  /** Token amounts don't match required pool ratio */
  LP_INVALID_RATIO = 'DEFI_LP_INVALID_RATIO',

  /** Concentrated liquidity range is invalid (lower >= upper, or too narrow) */
  LP_INVALID_RANGE = 'DEFI_LP_INVALID_RANGE',

  /** Position not found in database */
  LP_POSITION_NOT_FOUND = 'DEFI_LP_POSITION_NOT_FOUND',

  /** Cannot remove more than 100% of position */
  LP_INVALID_REMOVE_PERCENTAGE = 'DEFI_LP_INVALID_REMOVE_PERCENTAGE',

  /** Pool has insufficient liquidity for the operation */
  LP_INSUFFICIENT_LIQUIDITY = 'DEFI_LP_INSUFFICIENT_LIQUIDITY',

  // ── Yield Errors (YIELD_*) ──────────────────────────────────
  /** Farm not found or not active */
  YIELD_FARM_NOT_FOUND = 'DEFI_YIELD_FARM_NOT_FOUND',

  /** No rewards to harvest */
  YIELD_NO_REWARDS = 'DEFI_YIELD_NO_REWARDS',

  /** Compound value below minimum threshold (gas > reward) */
  YIELD_COMPOUND_BELOW_MINIMUM = 'DEFI_YIELD_COMPOUND_BELOW_MINIMUM',

  // ── Strategy Errors (STRATEGY_*) ────────────────────────────
  /** Strategy not found */
  STRATEGY_NOT_FOUND = 'DEFI_STRATEGY_NOT_FOUND',

  /** Strategy is in an invalid state for the requested operation */
  STRATEGY_INVALID_STATE = 'DEFI_STRATEGY_INVALID_STATE',

  /** Circuit breaker tripped — loss limit exceeded */
  STRATEGY_CIRCUIT_BREAK = 'DEFI_STRATEGY_CIRCUIT_BREAK',

  /** Too many consecutive failures — strategy auto-paused */
  STRATEGY_MAX_FAILURES = 'DEFI_STRATEGY_MAX_FAILURES',

  /** Strategy is in cooldown period */
  STRATEGY_COOLDOWN = 'DEFI_STRATEGY_COOLDOWN',

  // ── Protocol Errors (PROTOCOL_*) ────────────────────────────
  /** Protocol adapter is not initialized */
  PROTOCOL_NOT_INITIALIZED = 'DEFI_PROTOCOL_NOT_INITIALIZED',

  /** Protocol returned an unexpected error */
  PROTOCOL_ERROR = 'DEFI_PROTOCOL_ERROR',

  /** RPC node unavailable or timed out */
  PROTOCOL_RPC_ERROR = 'DEFI_PROTOCOL_RPC_ERROR',

  /** Transaction simulation failed */
  PROTOCOL_SIMULATION_FAILED = 'DEFI_PROTOCOL_SIMULATION_FAILED',

  /** Transaction confirmation timed out */
  PROTOCOL_TX_TIMEOUT = 'DEFI_PROTOCOL_TX_TIMEOUT',

  // ── Risk Errors (RISK_*) ────────────────────────────────────
  /** Oracle price deviation exceeds safe threshold */
  RISK_ORACLE_DEVIATION = 'DEFI_RISK_ORACLE_DEVIATION',

  /** Pool health check failed */
  RISK_POOL_UNHEALTHY = 'DEFI_RISK_POOL_UNHEALTHY',

  /** Operation blocked by risk limits */
  RISK_LIMIT_EXCEEDED = 'DEFI_RISK_LIMIT_EXCEEDED',

  // ── General ─────────────────────────────────────────────────
  /** Slippage tolerance out of valid range (1-1000 bps) */
  INVALID_SLIPPAGE = 'DEFI_INVALID_SLIPPAGE',

  /** Duplicate swap submission (idempotency check) */
  DUPLICATE_SUBMISSION = 'DEFI_DUPLICATE_SUBMISSION',

  /** Wallet not authorized for this operation */
  UNAUTHORIZED = 'DEFI_UNAUTHORIZED',
}

/**
 * Structured error for DeFi operations.
 *
 * Always includes an error code for programmatic handling
 * and optional context data for debugging.
 */
export class DefiError extends Error {
  constructor(
    public readonly code: DefiErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'DefiError';
  }

  /** Create a user-friendly error message */
  toUserMessage(): string {
    switch (this.code) {
      case DefiErrorCode.SWAP_NO_ROUTE:
        return 'No swap route available for this token pair. The tokens may not have enough liquidity.';
      case DefiErrorCode.SWAP_SLIPPAGE_EXCEEDED:
        return 'The swap price moved too much. Try increasing your slippage tolerance or reducing the swap amount.';
      case DefiErrorCode.SWAP_PRICE_IMPACT_TOO_HIGH:
        return 'This swap would significantly impact the market price. Consider splitting into smaller swaps.';
      case DefiErrorCode.SWAP_SANDWICH_DETECTED:
        return 'A potential sandwich attack was detected. The swap was blocked for your protection. Try again with Jito bundles enabled.';
      case DefiErrorCode.LP_INVALID_RANGE:
        return 'The selected price range is invalid. The lower bound must be less than the upper bound.';
      case DefiErrorCode.STRATEGY_CIRCUIT_BREAK:
        return 'Your strategy has been paused because it exceeded the loss limit. Review and resume manually.';
      case DefiErrorCode.RISK_ORACLE_DEVIATION:
        return 'Price oracle deviation detected. Trades are temporarily blocked for safety.';
      default:
        return this.message;
    }
  }
}
```

---

## Security Considerations

DeFi operations carry inherently high risk. This module implements multiple layers of protection.

### Slippage Protection

```typescript
// Every swap enforces slippage bounds

const DEFAULT_SLIPPAGE_BPS = 50;  // 0.5%
const MAX_SLIPPAGE_BPS = 1000;    // 10% hard cap

// Validation in SwapService
function validateSlippage(bps: number | undefined): number {
  const slippage = bps ?? DEFAULT_SLIPPAGE_BPS;

  if (slippage < 1 || slippage > MAX_SLIPPAGE_BPS) {
    throw new DefiError(
      DefiErrorCode.INVALID_SLIPPAGE,
      `Slippage must be 1-${MAX_SLIPPAGE_BPS} bps, got ${slippage}`,
      { slippageBps: slippage },
    );
  }

  return slippage;
}

// Minimum output is computed before TX submission
function computeMinOutput(expectedOutput: bigint, slippageBps: number): bigint {
  return (expectedOutput * BigInt(10000 - slippageBps)) / 10000n;
}
```

### Sandwich Attack Prevention

```typescript
/**
 * Sandwich attack detection.
 *
 * A sandwich attack wraps your swap with two opposing trades:
 * 1. Attacker buys before you (front-run) → pushes price up
 * 2. Your swap executes at higher price
 * 3. Attacker sells after you (back-run) → profits from your slippage
 *
 * Mitigation strategies:
 */

// 1. Jito bundles — transactions are private until confirmed
const useJitoBundle = params.useJitoBundle ?? false;

// 2. Slippage guard — reject if actual output is far below expected
function checkSandwich(
  expectedOutput: bigint,
  actualOutput: bigint,
  minimumOutput: bigint,
): void {
  if (actualOutput < minimumOutput) {
    // Actual output was less than our minimum — potential sandwich
    throw new DefiError(
      DefiErrorCode.SWAP_SANDWICH_DETECTED,
      'Output significantly below expected. Possible sandwich attack.',
      {
        expectedOutput: expectedOutput.toString(),
        actualOutput: actualOutput.toString(),
        minimumOutput: minimumOutput.toString(),
        shortfallBps: Number(
          ((expectedOutput - actualOutput) * 10000n) / expectedOutput,
        ),
      },
    );
  }
}

// 3. Transaction simulation — simulate before sending
async function simulateBeforeSubmit(
  transaction: VersionedTransaction,
  connection: Connection,
): Promise<void> {
  const simulation = await connection.simulateTransaction(transaction);

  if (simulation.value.err) {
    throw new DefiError(
      DefiErrorCode.PROTOCOL_SIMULATION_FAILED,
      `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`,
      { logs: simulation.value.logs },
    );
  }
}
```

### Oracle Manipulation Protection

```typescript
/**
 * Oracle price deviation checks.
 *
 * Before executing any swap or liquidity operation, we compare
 * the pool's implied price against oracle prices (Pyth, Switchboard)
 * to detect potential manipulation.
 */

// Threshold: 2% deviation triggers a warning, 5% blocks the trade
const ORACLE_WARNING_THRESHOLD_PCT = 2.0;
const ORACLE_BLOCK_THRESHOLD_PCT = 5.0;

async function checkOracleDeviation(
  poolPrice: number,
  tokenMint: string,
  oracleService: OracleService,
): Promise<OracleDeviation> {
  const oraclePrice = await oracleService.getPrice(tokenMint);

  const deviationPct = Math.abs(
    ((poolPrice - oraclePrice) / oraclePrice) * 100,
  );

  if (deviationPct > ORACLE_BLOCK_THRESHOLD_PCT) {
    throw new DefiError(
      DefiErrorCode.RISK_ORACLE_DEVIATION,
      `Oracle deviation ${deviationPct.toFixed(2)}% exceeds safe threshold of ${ORACLE_BLOCK_THRESHOLD_PCT}%`,
      {
        poolPrice,
        oraclePrice,
        deviationPct,
        tokenMint,
      },
    );
  }

  return {
    tokenMint,
    poolPrice,
    oraclePrice,
    deviationPct,
    alert: deviationPct > ORACLE_WARNING_THRESHOLD_PCT,
    checkedAt: new Date(),
  };
}
```

### Price Impact Guards

```typescript
/**
 * Price impact levels and enforcement.
 *
 * Large swaps can move the market significantly. We categorize
 * price impact into levels and enforce different behaviors:
 *
 * - Low (<0.5%): No warning, execute normally
 * - Medium (0.5%-2%): Warning in quote, execute with confirmation
 * - High (2%-5%): Strong warning, require explicit acknowledgment
 * - Extreme (>5%): Block by default, suggest splitting the swap
 */

const PRICE_IMPACT_THRESHOLDS = {
  low: 0.005,      // 0.5%
  medium: 0.02,    // 2%
  high: 0.05,      // 5%
} as const;

function categorizePriceImpact(
  impact: number,
): 'low' | 'medium' | 'high' | 'extreme' {
  if (impact < PRICE_IMPACT_THRESHOLDS.low) return 'low';
  if (impact < PRICE_IMPACT_THRESHOLDS.medium) return 'medium';
  if (impact < PRICE_IMPACT_THRESHOLDS.high) return 'high';
  return 'extreme';
}

function enforcePriceImpact(impact: number, params: SwapParams): void {
  const level = categorizePriceImpact(impact);

  if (level === 'extreme') {
    throw new DefiError(
      DefiErrorCode.SWAP_PRICE_IMPACT_TOO_HIGH,
      `Price impact of ${(impact * 100).toFixed(2)}% is too high. ` +
      `Consider splitting into smaller swaps.`,
      {
        priceImpact: impact,
        level,
        amount: params.amount.toString(),
        suggestion: 'Split into 3-5 smaller swaps with 30-second intervals',
      },
    );
  }
}
```

### Strategy Circuit Breakers

```typescript
/**
 * Circuit breakers prevent automated strategies from
 * accumulating excessive losses due to bugs, market crashes,
 * or misconfiguration.
 *
 * Three levels of circuit breakers:
 * 1. Per-execution loss limit
 * 2. Daily aggregate loss limit
 * 3. Consecutive failure limit
 */

async function checkCircuitBreakers(
  strategy: Strategy,
  db: DrizzleDB,
): Promise<void> {
  // Check consecutive failures
  if (strategy.consecutiveFailures >= strategy.maxConsecutiveFailures) {
    throw new DefiError(
      DefiErrorCode.STRATEGY_MAX_FAILURES,
      `Strategy "${strategy.name}" auto-paused after ${strategy.consecutiveFailures} consecutive failures`,
      { strategyId: strategy.id, failures: strategy.consecutiveFailures },
    );
  }

  // Check daily loss limit
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayExecutions = await db
    .select()
    .from(strategyExecutions)
    .where(
      and(
        eq(strategyExecutions.strategyId, strategy.id),
        gte(strategyExecutions.startedAt, todayStart),
      ),
    );

  const dailyLoss = todayExecutions.reduce(
    (sum, exec) => sum + Math.min(0, parseFloat(exec.pnlUsd ?? '0')),
    0,
  );

  if (Math.abs(dailyLoss) >= parseFloat(strategy.dailyLossLimitUsd)) {
    throw new DefiError(
      DefiErrorCode.STRATEGY_CIRCUIT_BREAK,
      `Daily loss limit reached: $${Math.abs(dailyLoss).toFixed(2)} / $${strategy.dailyLossLimitUsd}`,
      {
        strategyId: strategy.id,
        dailyLoss,
        dailyLimit: strategy.dailyLossLimitUsd,
      },
    );
  }

  // Check cooldown
  if (strategy.lastExecutedAt) {
    const elapsed = Date.now() - strategy.lastExecutedAt.getTime();
    if (elapsed < strategy.cooldownMs) {
      throw new DefiError(
        DefiErrorCode.STRATEGY_COOLDOWN,
        `Strategy is in cooldown. ${strategy.cooldownMs - elapsed}ms remaining.`,
        {
          strategyId: strategy.id,
          cooldownMs: strategy.cooldownMs,
          remainingMs: strategy.cooldownMs - elapsed,
        },
      );
    }
  }
}
```

### Wallet Authorization

```typescript
/**
 * Every DeFi operation validates that the requesting user
 * owns the wallet they're operating on. Authorization is
 * handled via the tRPC context (JWT → wallet mapping).
 *
 * Additional checks:
 * - Strategy operations verify the strategy belongs to the wallet
 * - Position operations verify the position belongs to the wallet
 * - No cross-wallet operations are permitted
 */

function assertWalletOwnership(
  ctxWallet: string,
  targetWallet: string,
): void {
  if (ctxWallet !== targetWallet) {
    throw new DefiError(
      DefiErrorCode.UNAUTHORIZED,
      'Cannot operate on a wallet you do not own',
      { ctxWallet, targetWallet },
    );
  }
}
```

### Security Checklist

| Category | Measure | Status |
|---|---|---|
| **Slippage** | Enforced min/max bounds on all swaps | ✅ |
| **Slippage** | Hard cap at 10% (1000 bps) | ✅ |
| **MEV** | Jito bundle support for private transactions | ✅ |
| **MEV** | Sandwich detection post-execution | ✅ |
| **Oracle** | Cross-check pool price vs Pyth/Switchboard | ✅ |
| **Oracle** | Block trades with >5% oracle deviation | ✅ |
| **Price Impact** | Categorized warnings (low/med/high/extreme) | ✅ |
| **Price Impact** | Block extreme-impact swaps by default | ✅ |
| **Strategy** | Per-execution loss limit | ✅ |
| **Strategy** | Daily aggregate loss limit | ✅ |
| **Strategy** | Consecutive failure auto-pause | ✅ |
| **Strategy** | Cooldown period between executions | ✅ |
| **Auth** | Wallet ownership verification on all operations | ✅ |
| **Auth** | Strategy/position ownership validation | ✅ |
| **Simulation** | All transactions simulated before submission | ✅ |
| **Idempotency** | Duplicate swap prevention via idempotency keys | ✅ |
| **Logging** | Every swap, harvest, compound recorded in DB | ✅ |

---

## Environment Variables

```bash
# ── Required ───────────────────────────────────────────────────

# Solana RPC endpoint (use a dedicated/paid RPC for DeFi operations)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Backup RPC endpoint (failover)
SOLANA_RPC_BACKUP_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY

# EDGE token mint address
EDGE_TOKEN_MINT=EDGExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase database connection string
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# ── Jupiter ────────────────────────────────────────────────────

# Jupiter API base URL (v6)
JUPITER_API_URL=https://quote-api.jup.ag/v6

# Jupiter API key (for higher rate limits)
JUPITER_API_KEY=your-jupiter-api-key

# ── Raydium ────────────────────────────────────────────────────

# Raydium API base URL
RAYDIUM_API_URL=https://api-v3.raydium.io

# ── Orca ───────────────────────────────────────────────────────

# Orca Whirlpool program ID (mainnet)
ORCA_WHIRLPOOL_PROGRAM_ID=whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc

# ── Marinade ───────────────────────────────────────────────────

# Marinade program ID
MARINADE_PROGRAM_ID=MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD

# ── Jito (MEV Protection) ─────────────────────────────────────

# Jito block engine URL
JITO_BLOCK_ENGINE_URL=https://mainnet.block-engine.jito.wtf

# Jito tip account (for bundle tips)
JITO_TIP_ACCOUNT=96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5

# Default Jito tip in lamports
JITO_DEFAULT_TIP_LAMPORTS=10000

# ── Strategy Engine ────────────────────────────────────────────

# How often to check strategy triggers (ms)
STRATEGY_CHECK_INTERVAL_MS=30000

# Maximum concurrent strategy executions
STRATEGY_MAX_CONCURRENT=3

# ── Risk Monitoring ────────────────────────────────────────────

# Oracle deviation warning threshold (percent)
RISK_ORACLE_WARNING_PCT=2.0

# Oracle deviation block threshold (percent)
RISK_ORACLE_BLOCK_PCT=5.0

# Pool health check interval (ms)
RISK_HEALTH_CHECK_INTERVAL_MS=60000

# IL snapshot interval (ms) — how often to record IL data points
IL_SNAPSHOT_INTERVAL_MS=3600000

# ── Optional ───────────────────────────────────────────────────

# Default slippage in basis points
DEFAULT_SLIPPAGE_BPS=50

# Maximum slippage allowed (hard cap)
MAX_SLIPPAGE_BPS=1000

# Position sync interval (ms)
POSITION_SYNC_INTERVAL_MS=300000

# Pool data refresh interval (ms)
POOL_REFRESH_INTERVAL_MS=120000

# Enable DeFi operations (kill switch)
DEFI_ENABLED=true

# Solana network (mainnet-beta | devnet)
SOLANA_NETWORK=mainnet-beta
```

---

## Dependencies

```json
{
  "dependencies": {
    "@solana/web3.js": "^1.95.0",
    "@solana/spl-token": "^0.4.0",
    "@jup-ag/api": "^6.0.0",
    "@raydium-io/raydium-sdk-v2": "^0.1.0",
    "@orca-so/whirlpools-sdk": "^0.13.0",
    "@orca-so/common-sdk": "^0.6.0",
    "@marinade.finance/marinade-ts-sdk": "^5.0.0",
    "@pythnetwork/price-service-client": "^1.9.0",
    "drizzle-orm": "^0.33.0",
    "bn.js": "^5.2.1",
    "decimal.js": "^10.4.3",
    "@trpc/server": "^10.45.0",
    "zod": "^3.23.0",
    "bullmq": "^5.0.0"
  },
  "devDependencies": {
    "@solana/web3.js": "^1.95.0",
    "vitest": "^2.0.0",
    "@faker-js/faker": "^8.0.0",
    "msw": "^2.0.0"
  }
}
```

### Dependency Notes

| Package | Purpose |
|---|---|
| `@solana/web3.js` | Core Solana blockchain interaction |
| `@solana/spl-token` | SPL token operations (balances, transfers) |
| `@jup-ag/api` | Jupiter swap aggregator SDK |
| `@raydium-io/raydium-sdk-v2` | Raydium AMM and CLMM pools |
| `@orca-so/whirlpools-sdk` | Orca concentrated liquidity (Whirlpool) |
| `@marinade.finance/marinade-ts-sdk` | Marinade liquid staking (SOL → mSOL) |
| `@pythnetwork/price-service-client` | Pyth oracle price feeds |
| `drizzle-orm` | Type-safe SQL via Drizzle ORM |
| `bn.js` | Big number arithmetic for on-chain math |
| `decimal.js` | Precise decimal math for financial calculations |
| `bullmq` | Job queue for strategy scheduling and background tasks |
| `msw` | Mock Service Worker for API mocking in tests |

---

## Testing

### Unit Tests

```typescript
// __tests__/swap.service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SwapService } from '../services/swap.service';
import { DefiError, DefiErrorCode } from '../errors';

describe('SwapService', () => {
  let service: SwapService;
  let mockJupiter: MockJupiterAdapter;

  beforeEach(() => {
    mockJupiter = createMockJupiterAdapter();
    service = new SwapService({
      jupiter: mockJupiter,
      // ...other mock adapters
    });
  });

  describe('getSwapQuote', () => {
    it('should return a quote with best route', async () => {
      mockJupiter.getQuote.mockResolvedValue(createMockQuote());

      const quote = await service.getSwapQuote({
        inputMint: EDGE_MINT,
        outputMint: SOL_MINT,
        amount: 1_000_000n,
        walletAddress: TEST_WALLET,
      });

      expect(quote.route.steps).toHaveLength(1);
      expect(quote.route.priceImpact).toBeLessThan(0.05);
      expect(quote.priceImpactLevel).toBe('low');
    });

    it('should reject slippage above hard cap', async () => {
      await expect(
        service.getSwapQuote({
          inputMint: EDGE_MINT,
          outputMint: SOL_MINT,
          amount: 1_000_000n,
          slippageBps: 1500, // > 1000 hard cap
          walletAddress: TEST_WALLET,
        }),
      ).rejects.toThrow(DefiError);
    });

    it('should flag extreme price impact', async () => {
      mockJupiter.getQuote.mockResolvedValue(
        createMockQuote({ priceImpact: 0.08 }),
      );

      const quote = await service.getSwapQuote({
        inputMint: EDGE_MINT,
        outputMint: SOL_MINT,
        amount: 999_999_999_999n, // Huge swap
        walletAddress: TEST_WALLET,
      });

      expect(quote.priceImpactLevel).toBe('extreme');
      expect(quote.warnings).toContain(
        expect.stringContaining('price impact'),
      );
    });
  });

  describe('executeSwap', () => {
    it('should simulate before submitting', async () => {
      mockJupiter.getQuote.mockResolvedValue(createMockQuote());
      mockJupiter.buildTransaction.mockResolvedValue(createMockTx());

      await service.executeSwap({
        inputMint: EDGE_MINT,
        outputMint: SOL_MINT,
        amount: 1_000_000n,
        walletAddress: TEST_WALLET,
      });

      expect(mockJupiter.simulateTransaction).toHaveBeenCalledBefore(
        mockJupiter.sendTransaction,
      );
    });

    it('should record swap in history', async () => {
      mockJupiter.getQuote.mockResolvedValue(createMockQuote());
      mockJupiter.buildTransaction.mockResolvedValue(createMockTx());
      mockJupiter.sendTransaction.mockResolvedValue('test-sig-123');

      const result = await service.executeSwap({
        inputMint: EDGE_MINT,
        outputMint: SOL_MINT,
        amount: 1_000_000n,
        walletAddress: TEST_WALLET,
      });

      expect(result.swapHistoryId).toBeDefined();
      expect(result.signature).toBe('test-sig-123');
    });

    it('should prevent duplicate submissions via idempotency key', async () => {
      mockJupiter.getQuote.mockResolvedValue(createMockQuote());

      await service.executeSwap({
        inputMint: EDGE_MINT,
        outputMint: SOL_MINT,
        amount: 1_000_000n,
        walletAddress: TEST_WALLET,
        idempotencyKey: 'unique-key-1',
      });

      await expect(
        service.executeSwap({
          inputMint: EDGE_MINT,
          outputMint: SOL_MINT,
          amount: 1_000_000n,
          walletAddress: TEST_WALLET,
          idempotencyKey: 'unique-key-1', // Same key
        }),
      ).rejects.toThrow(DefiErrorCode.DUPLICATE_SUBMISSION);
    });
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/defi.integration.test.ts

import { describe, it, expect, beforeAll } from 'vitest';
import { DeFiService } from '../../services/defi.service';

/**
 * Integration tests run against Solana devnet.
 * They require:
 * - SOLANA_RPC_URL pointing to devnet
 * - A funded devnet wallet
 * - EDGE token deployed on devnet
 *
 * Run with: pnpm test:integration
 */
describe('DeFi Integration (devnet)', () => {
  let defi: DeFiService;

  beforeAll(async () => {
    defi = new DeFiService({ network: 'devnet' });
    await defi.initialize();
  });

  it('should fetch pool data from on-chain', async () => {
    const pools = await defi.getPools(EDGE_DEVNET_MINT, SOL_DEVNET_MINT);

    expect(pools.length).toBeGreaterThan(0);
    expect(pools[0].tvlUsd).toBeGreaterThan(0);
    expect(pools[0].protocol).toBeDefined();
  });

  it('should get a swap quote from Jupiter', async () => {
    const quote = await defi.getSwapQuote({
      inputMint: EDGE_DEVNET_MINT,
      outputMint: SOL_DEVNET_MINT,
      amount: 100_000n,
      walletAddress: DEVNET_TEST_WALLET,
    });

    expect(quote.route.steps.length).toBeGreaterThan(0);
    expect(quote.route.expectedOutputAmount).toBeGreaterThan(0n);
  });

  it('should sync positions from on-chain', async () => {
    const result = await defi.syncPositions(DEVNET_TEST_WALLET);

    expect(result.durationMs).toBeLessThan(30000);
    expect(result.errors).toHaveLength(0);
  });
});
```

### Testing Strategy

| Test Type | Scope | Data Source | CI |
|---|---|---|---|
| Unit | Service methods, calculations, error handling | Mocks | ✅ Every PR |
| Integration | Protocol adapters against devnet | Solana Devnet | ✅ Nightly |
| E2E | Full swap/LP flow on devnet | Solana Devnet | 🔲 Manual |
| Snapshot | IL calculations against known scenarios | Fixtures | ✅ Every PR |
| Load | Strategy engine under concurrent load | Mocks + BullMQ | ✅ Weekly |
| Security | Slippage, sandwich, oracle edge cases | Adversarial mocks | ✅ Every PR |

### Key Test Fixtures

```
__tests__/
├── fixtures/
│   ├── jupiter-quotes/         # Captured Jupiter API responses
│   ├── raydium-pools/          # Raydium pool account data
│   ├── orca-whirlpools/        # Orca whirlpool account data
│   ├── il-scenarios/           # Known IL calculation scenarios
│   │   ├── 2x-price-move.json  # IL for 2x price increase
│   │   ├── 0.5x-price-move.json # IL for 50% price decrease
│   │   └── concentrated-ranges.json # CL IL amplification
│   └── swap-routes/            # Multi-hop route fixtures
├── mocks/
│   ├── jupiter.adapter.mock.ts
│   ├── raydium.adapter.mock.ts
│   ├── orca.adapter.mock.ts
│   └── solana.connection.mock.ts
└── helpers/
    ├── create-test-pool.ts     # Helper to create pool fixtures
    ├── create-test-position.ts # Helper to create position fixtures
    └── assert-il.ts            # IL assertion helpers with tolerance
```

---

## Related Modules

| Module | Relationship |
|---|---|
| `@mcv/web3-core/solana` | Provides Solana connection, TX building, signing |
| `@mcv/web3-core/token` | Token metadata, balances, mint info |
| `@mcv/web3-core/wallet` | Wallet management, key derivation |
| `@mcv/shared/db` | Database connection, migrations |
| `@mcv/shared/config` | Environment variable validation |
| `@mcv/shared/events` | Event bus for position change notifications |
| `@mcv/web3-core/oracle` | Price feed integration (Pyth, Switchboard) |

---

*Last updated: 2025-02-08*
*Module version: 0.1.0*
*Status: Design Phase*
